import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { getIconData, matchIconName, stringToIcon } from '@iconify/utils';
import { DoctorOptions } from './schema';
import {
  closestIconMatches,
  IconifySetInfo,
  readCollections,
  readInstalledSet,
} from '../catalog';
import { detectPackageManager, resolveProject } from '../utils';

interface Row {
  prefix: string;
  name: string;
  total: number;
  category: string;
}

function normalizeIcons(icon: string | string[] | undefined): string[] {
  if (!icon) return [];
  return Array.isArray(icon) ? icon : [icon];
}

function heightLabel(height: IconifySetInfo['height']): string {
  if (height === undefined) return '—';
  return Array.isArray(height) ? height.join('/') : String(height);
}

/**
 * List the catalog sets filtered by search/category and capped by limit.
 * Log lines and the missing-catalog hint are byte-identical to the former
 * `list-sets` schematic.
 */
function printListing(tree: Tree, context: SchematicContext, options: DoctorOptions): void {
  const catalog = readCollections(tree);
  if (catalog === null) {
    const pm = detectPackageManager(tree);
    throw new SchematicsException(
      `@iconify/collections is not installed — install it with: ${pm} install -D @iconify/collections`,
    );
  }

  const search = options.search?.toLowerCase();
  const rows: Row[] = [];
  for (const prefix of Object.keys(catalog)) {
    const info = catalog[prefix] ?? {};
    if (options.category !== undefined && info.category !== options.category) continue;
    if (search) {
      const name = (info.name ?? '').toLowerCase();
      if (!prefix.toLowerCase().includes(search) && !name.includes(search)) continue;
    }
    rows.push({
      prefix,
      name: info.name ?? '',
      total: typeof info.total === 'number' ? info.total : 0,
      category: info.category ?? '',
    });
  }

  const shown = rows.slice(0, options.limit ?? Infinity);

  context.logger.info(`Available icon sets (${Object.keys(catalog).length})`);
  if (shown.length === 0) return;

  const prefixWidth = Math.max(8, ...shown.map((row) => row.prefix.length));
  const nameWidth = Math.max(4, ...shown.map((row) => row.name.length));
  for (const row of shown) {
    context.logger.info(
      `${row.prefix.padEnd(prefixWidth)}  ${row.name.padEnd(nameWidth)}  ` +
        `${String(row.total).padStart(6)}  ${row.category}`,
    );
  }
}

/**
 * Print the catalog metadata for a single set prefix. Messages and failure
 * semantics are identical to the former `validate-set` schematic.
 */
function printSetMetadata(tree: Tree, context: SchematicContext, prefix: string): void {
  const catalog = readCollections(tree);
  if (catalog === null) {
    const pm = detectPackageManager(tree);
    throw new SchematicsException(
      `@iconify/collections is not installed — install it with: ${pm} install -D @iconify/collections.`,
    );
  }

  const info = catalog[prefix];
  if (!info) {
    throw new SchematicsException(
      `Set "${prefix}" does not exist in the Iconify catalog — list real sets with: ` +
        `ng g ngx-iconify-stack:list-sets --search ${prefix}.`,
    );
  }

  context.logger.info(
    `✓ Set "${prefix}" exists in the Iconify catalog (${info.name ?? prefix})`,
  );
  context.logger.info(`  total: ${info.total ?? '—'} icons`);
  context.logger.info(`  category: ${info.category ?? '—'}`);
  context.logger.info(`  height: ${heightLabel(info.height)}`);
  context.logger.info(`  palette: ${info.palette ?? '—'}`);
  const license = info.license;
  context.logger.info(
    `  license: ${license?.title ?? '—'}${license?.spdx ? ` (${license.spdx})` : ''}`,
  );
  const samples = (info.samples ?? []).slice(0, 6);
  context.logger.info(`  samples: ${samples.length > 0 ? samples.join(', ') : '—'}`);
}

/**
 * Validate icon references (format, catalog presence, set installed?, icon
 * existence + closest-match suggestions). Log lines and failure semantics are
 * identical to the former `validate-icon` schematic.
 */
function validateIcons(tree: Tree, context: SchematicContext, refs: string[]): void {
  const catalog = readCollections(tree);
  const catalogMissing = catalog === null;
  const packageManager = detectPackageManager(tree);

  let valid = 0;
  let failed = 0;

  for (const ref of refs) {
    // 1. Format validation: parse the ref and pin both segments to the
    // icon-name charset (`matchIconName`). A `a:b:c` provider ref parses,
    // then simply falls through to the prefix lookup like any other ref.
    const parsed = stringToIcon(ref, true);
    if (
      parsed === null ||
      !matchIconName.test(parsed.prefix) ||
      !matchIconName.test(parsed.name)
    ) {
      context.logger.error(
        `Invalid icon reference "${ref}": invalid format — must be prefix:name ` +
          'in lowercase letters/digits/hyphens (e.g. mdi:home).',
      );
      failed++;
      continue;
    }
    const { prefix, name } = parsed;

    // 2. Catalog presence — without it no existence claim can be made.
    if (catalogMissing) {
      context.logger.error(
        `@iconify/collections is not installed — install it with: ${packageManager} ` +
          'install -D @iconify/collections. Icon existence cannot be verified.',
      );
      failed++;
      continue;
    }

    // 3. Set existence in the catalog.
    if (!catalog![prefix]) {
      context.logger.error(
        `Set "${prefix}" does not exist in the Iconify catalog — list real sets with: ` +
          `ng g ngx-iconify-stack:list-sets --search ${prefix}.`,
      );
      failed++;
      continue;
    }

    // 4. Installed set present? A known-but-missing set cannot verify
    // existence — warn clearly, but do not fail the run.
    const installed = readInstalledSet(tree, prefix);
    if (installed === null) {
      context.logger.warn(
        `Set "${prefix}" is known but not installed — install @iconify-json/${prefix} ` +
          '(add-icon does this automatically); icon existence NOT verified.',
      );
      valid++;
      continue;
    }

    // 5. Icon existence within the installed set (alias-aware via
    // @iconify/utils) + closest-match suggestions for typos.
    if (!getIconData(installed, name)) {
      const suggestions = closestIconMatches(installed, name);
      const hint =
        suggestions.length > 0
          ? ` Did you mean ${suggestions.map((s) => `"${prefix}:${s}"`).join(', ')}?`
          : '';
      context.logger.error(
        `Icon "${prefix}:${name}" does not exist in installed set ` +
          `"@iconify-json/${prefix}".${hint}`,
      );
      failed++;
      continue;
    }

    // 6. Pass.
    context.logger.info(`✓ ${prefix}:${name} is valid and exists in @iconify-json/${prefix}`);
    valid++;
  }

  context.logger.info(`${valid}/${refs.length} icons valid`);
  if (failed > 0) {
    throw new SchematicsException(
      `Icon validation failed: ${valid}/${refs.length} icons valid`,
    );
  }
}

/**
 * Consolidated read-only icon-health report. `--list` (or neither `--icon`
 * nor `--prefix`) lists the catalog sets; `--prefix` prints one set's
 * metadata; `--icon` (repeatable) validates icon references. Flags combine —
 * each requested check runs in order into a single report. Only `--icon` and
 * `--prefix` hard-fail, with the same messages as the former `validate-*`
 * schematics; the listing never fails beyond the missing-catalog hint.
 */
export function doctor(options: DoctorOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    await resolveProject(tree, options);

    const refs = normalizeIcons(options.icon);
    const runListing = options.list === true || (refs.length === 0 && !options.prefix);

    if (runListing) {
      printListing(tree, context, options);
    }
    if (options.prefix) {
      printSetMetadata(tree, context, options.prefix);
    }
    if (refs.length > 0) {
      validateIcons(tree, context, refs);
    }
  };
}
