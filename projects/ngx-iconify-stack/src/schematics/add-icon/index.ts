import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import type { IconifyJSON } from '@iconify/types';
import { getIconData } from '@iconify/utils';
import { AddIconOptions } from './schema';
import { resolveProject, splitIconRef } from '../utils';
import {
  ICON_REF_PATTERN,
  iconManifestPath,
  iconSetJsonPath,
  parseManifestDynamicIcons,
  readJsonFile,
} from '../generate-icon-subset/icons';
import {
  declareAndInstallMissingSets,
  regenerateIconSubset,
} from '../generate-icon-subset';

/** Stable header for a NEW manifest (kept verbatim from an existing file). */
const MANIFEST_HEADER = [
  '// src/ngx-iconify/icon-manifest.ts',
  '// 🔧 MANUAL — fuente de verdad. El scanner no ve iconos dinámicos (signals,',
  '// servicios): si querés que uno entre al subset SSR, decláralo acá.',
].join('\n');

function normalizeIcons(icon: string | string[] | undefined): string[] {
  if (!icon) return [];
  return Array.isArray(icon) ? icon : [icon];
}

/**
 * Persist the refs in `dynamicSubsetIcons` inside the icon manifest. Idempotent:
 * preserves the file's header comment and any existing entries, and never
 * duplicates a ref. Sorted output keeps reruns byte-identical.
 */
function persistManifestIcons(
  tree: Tree,
  sourceRoot: string,
  refs: string[],
): void {
  const path = iconManifestPath(sourceRoot);
  let header = MANIFEST_HEADER;
  let existing: string[] = [];
  if (tree.exists(path)) {
    const content = tree.read(path)!.toString('utf8');
    // Anchor on the identifier position and the '=' that follows it (rather
    // than requiring `export const dynamicSubsetIcons` directly) so typed
    // declarations like `dynamicSubsetIcons: string[] = [...]` are rewritten
    // in place instead of appending a duplicate declaration.
    const identIndex = content.indexOf('dynamicSubsetIcons');
    const headerEnd = identIndex === -1 ? -1 : content.indexOf('=', identIndex);
    const lineStart = headerEnd === -1 ? -1 : content.lastIndexOf('\n', identIndex) + 1;
    const isDeclaration =
      headerEnd !== -1 && /\bexport\b/.test(content.slice(lineStart, headerEnd));
    if (isDeclaration) {
      header = content.slice(0, lineStart).replace(/\s+$/, '');
      existing = parseManifestDynamicIcons(content.slice(lineStart));
    } else {
      header = content.replace(/\s+$/, '');
    }
  }

  const merged = [...new Set([...existing, ...refs])].sort();
  const body =
    `export const dynamicSubsetIcons = [${merged.map((r) => `'${r}'`).join(', ')}] as const;`;

  const next = `${header}\n${body}\n`;
  if (tree.exists(path)) {
    tree.overwrite(path, next);
  } else {
    tree.create(path, next);
  }
}

export function addIcon(options: AddIconOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const { sourceRoot } = await resolveProject(tree, options);

    const icons = normalizeIcons(options.icon);
    if (icons.length === 0) {
      throw new SchematicsException(
        'No icon provided — pass --icon <prefix:name> (repeatable), e.g. --icon mdi:home.',
      );
    }

    // Validate every ref shape first, so malformed input fails fast.
    const refs = icons.map((ref) => {
      if (!ICON_REF_PATTERN.test(ref)) {
        throw new SchematicsException(
          `Invalid icon reference "${ref}" — expected prefix:name (e.g. mdi:home).`,
        );
      }
      return ref;
    });

    // Read each set's icons.json once into a cache; the missing-set probe and
    // the validation loop share it instead of re-reading per ref. Sets that
    // were missing are re-read after the directed install, which may have just
    // materialized them on the real filesystem.
    const sets = new Map<string, IconifyJSON | null>();
    const readSet = (prefix: string): IconifyJSON | null => {
      if (!sets.has(prefix)) {
        sets.set(prefix, readJsonFile(tree, iconSetJsonPath(prefix), context.logger));
      }
      return sets.get(prefix) ?? null;
    };

    // A set that is neither installed nor declared counts as missing: declare it
    // and directed-install BEFORE validating, so one run can add the icon end to end.
    const missingPrefixes = [
      ...new Set(
        refs.map((ref) => splitIconRef(ref)!.prefix).filter((prefix) => readSet(prefix) === null),
      ),
    ];
    if (missingPrefixes.length > 0) {
      declareAndInstallMissingSets(tree, context, missingPrefixes);
      for (const prefix of missingPrefixes) {
        sets.set(prefix, readJsonFile(tree, iconSetJsonPath(prefix), context.logger));
      }
    }

    // Validate existence within each installed set (alias-aware via @iconify/utils).
    for (const ref of refs) {
      const { prefix, name } = splitIconRef(ref)!;
      const fullSet = readSet(prefix);
      if (fullSet === null) {
        throw new SchematicsException(
          `Icon set "${prefix}" is not installed — install @iconify-json/${prefix} and re-run.`,
        );
      }
      if (!getIconData(fullSet, name)) {
        throw new SchematicsException(
          `Icon "${ref}" not found in set "${prefix}" — ` +
            `browse https://icon-sets.iconify.design/${prefix}/ for valid names.`,
        );
      }
    }

    // Persist the refs in the manifest, then regenerate the subset through the
    // shared pipeline (scan + manifest merge + build + wire).
    persistManifestIcons(tree, sourceRoot, refs);
    context.logger.info(`✓ Manifest updated at ${iconManifestPath(sourceRoot)}`);

    await regenerateIconSubset(tree, context, options);
    context.logger.info(`✓ Added ${refs.length} icon(s) to the subset: ${refs.join(', ')}`);
  };
}
