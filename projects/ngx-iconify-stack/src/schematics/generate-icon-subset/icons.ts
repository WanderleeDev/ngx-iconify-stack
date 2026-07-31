// icons.ts — inline icon scan + subset build for the generate-icon-subset schematic.
// Ported from scripts/collect-icons.mjs (behavior pinned by the spec): the factory now
// executes scanning/subsetting directly instead of emitting a script file.
import { Tree } from '@angular-devkit/schematics';
import type { IconifyJSON } from '@iconify/types';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Pinned reference pattern: `icon`/`icons` followed by `:` or `=` and a quoted `prefix:name`. */
export const ICON_REFERENCE_PATTERN = /(?:icon|icons)\s*[:=]\s*["']([\w-]+:[\w-]+)["']/;
/** Maximum alias-chain depth before an icon is treated as unresolved. */
export const MAX_ALIAS_DEPTH = 10;
/** Default icon box size when the set does not declare width/height. */
export const DEFAULT_ICON_SIZE = 24;

/** Minimal logger surface required for subset warnings. */
export interface SubsetLogger {
  warn(message: string): void;
}

/**
 * Walk every `.html`/`.ts` file under `sourceRoot` and collect `prefix -> Set<name>`
 * references matching the pinned pattern. Never matches `mdi-home`, `iconName =`, or
 * the literal word `iconify`.
 */
export function scanIcons(tree: Tree, sourceRoot: string): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>();
  // Schematic tree paths are absolute (leading '/'); sourceRoot from getWorkspace is not.
  const rootPrefix = `/${sourceRoot.replace(/^\/+|\/+$/g, '')}/`;

  tree.visit((path) => {
    if (!path.startsWith(rootPrefix)) return;
    if (path.includes('/node_modules/')) return;
    if (!/\.(html|ts)$/.test(path)) return;

    const buffer = tree.read(path);
    if (buffer === null) return;
    const content = buffer.toString('utf8');

    // A fresh global regex per file avoids lastIndex carryover between files.
    for (const match of content.matchAll(new RegExp(ICON_REFERENCE_PATTERN.source, 'g'))) {
      const ref = match[1];
      const sep = ref.indexOf(':');
      if (sep === -1) continue;
      const prefix = ref.slice(0, sep);
      const name = ref.slice(sep + 1);
      const names = found.get(prefix);
      if (names) {
        names.add(name);
      } else {
        found.set(prefix, new Set([name]));
      }
    }
  });

  return found;
}

/**
 * Read a JSON file from the schematic tree first, falling back to the real
 * filesystem (relative to the workspace root, i.e. process.cwd() during `ng g`).
 * The tree-first read lets the schematic test harness mock
 * `node_modules/@iconify-json/<prefix>/icons.json` as virtual files.
 */
export function readJsonFile(tree: Tree, path: string): unknown | null {
  const treePath = path.startsWith('/') ? path : `/${path}`;
  const treeBuffer = tree.read(treePath);
  if (treeBuffer !== null) {
    try {
      return JSON.parse(treeBuffer.toString('utf8'));
    } catch {
      return null;
    }
  }

  const fsPath = resolve(process.cwd(), path);
  if (!existsSync(fsPath)) return null;
  try {
    return JSON.parse(readFileSync(fsPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Build an `IconifyJSON[]` subset from the scanned `prefix -> names` map. Reads each
 * set's `icons.json`, resolves alias chains (parent traversal, depth cap 10, body
 * copied under the alias name), and warns + skips what cannot be resolved.
 */
export function buildSubset(
  tree: Tree,
  found: Map<string, Set<string>>,
  logger: SubsetLogger = { warn: () => undefined },
): IconifyJSON[] {
  const collections: IconifyJSON[] = [];

  for (const [prefix, names] of found) {
    const iconsJsonPath = `node_modules/@iconify-json/${prefix}/icons.json`;
    const fullSet = readJsonFile(tree, iconsJsonPath) as IconifyJSON | null;
    if (fullSet === null) {
      logger.warn(`Set "${prefix}" not found — install @iconify-json/${prefix}`);
      continue;
    }

    const subset: IconifyJSON = {
      prefix,
      icons: {},
      width: fullSet.width ?? DEFAULT_ICON_SIZE,
      height: fullSet.height ?? DEFAULT_ICON_SIZE,
    };

    for (const name of names) {
      if (fullSet.icons[name]) {
        subset.icons[name] = fullSet.icons[name];
        continue;
      }

      // Try the alias chain: walk parents until a concrete icon is found.
      let resolved = name;
      let depth = 0;
      while (fullSet.aliases?.[resolved]?.parent && depth < MAX_ALIAS_DEPTH) {
        resolved = fullSet.aliases[resolved].parent;
        depth++;
      }
      if (fullSet.icons[resolved]) {
        subset.icons[name] = fullSet.icons[resolved];
      } else {
        logger.warn(`Icon "${prefix}:${name}" not found in set`);
      }
    }

    collections.push(subset);
  }

  return collections;
}
