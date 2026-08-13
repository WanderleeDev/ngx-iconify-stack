// icons.ts — inline icon scan + subset build for the generate-icon-subset schematic.
// Behavior pinned by the subset schematic contract: the factory now
// executes scanning/subsetting directly instead of emitting a script file.
import { Tree } from '@angular-devkit/schematics';
import type { IconifyIcon, IconifyJSON } from '@iconify/types';
import { getIconData, getIcons } from '@iconify/utils';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Pinned reference pattern: `icon`/`icons` followed by `:` or `=` and a quoted `prefix:name` (handles nested quotes). */
export const ICON_REFERENCE_PATTERN = /(?:icon|icons)\s*[:=]\s*["'](?:["']?([\w-]+:[\w-]+)["']?)["']/;
/** Default icon box size when the set does not declare width/height. */
export const DEFAULT_ICON_SIZE = 24;

/** IconifyJSON path for a set prefix under node_modules. */
export function iconSetJsonPath(prefix: string): string {
  return `node_modules/@iconify-json/${prefix}/icons.json`;
}

/** Path of the hand-written dynamic-icon manifest in a target project. */
export function iconManifestPath(sourceRoot: string): string {
  return `${sourceRoot}/ngx-iconify/icon-manifest.ts`.replace(/^\//, '');
}

/**
 * Extract the `prefix:name` literals from a `dynamicSubsetIcons = [...]` array
 * literal. Build-time regex parse (NOT a TS AST) — the manifest is a hand-written
 * source of truth for icons the template scanner cannot see (signals, services).
 */
export function parseManifestDynamicIcons(content: string): string[] {
  // Strip comments BEFORE matching the array so a `]` or a quoted `prefix:name`
  // inside a comment cannot truncate the lazy match or inject false positives.
  const withoutComments = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/\/\/[^\n]*/g, ''); // line comments
  const arrayMatch = withoutComments.match(/dynamicSubsetIcons\s*=\s*\[([\s\S]*?)\]/);
  if (!arrayMatch) return [];
  const refs: string[] = [];
  for (const match of arrayMatch[1].matchAll(/['"]([\w-]+:[\w-]+)['"]/g)) {
    refs.push(match[1]);
  }
  return refs;
}

/**
 * Merge the dynamic icons declared in `<sourceRoot>/ngx-iconify/icon-manifest.ts`
 * into the scanned `prefix -> Set<name>` map (prefix:name -> Map<prefix, Set<name>>).
 * Absent manifest => no-op (backwards compatible). Returns the merged refs so
 * callers can log what came from the manifest.
 */
export function mergeManifestIcons(
  tree: Tree,
  sourceRoot: string,
  found: Map<string, Set<string>>,
): string[] {
  const manifestPath = iconManifestPath(sourceRoot);
  if (!tree.exists(manifestPath)) return [];
  const refs = parseManifestDynamicIcons(tree.read(manifestPath)!.toString('utf8'));
  for (const ref of refs) {
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
  return refs;
}

/** Minimal logger surface required for subset warnings. */
export interface SubsetLogger {
  warn(message: string): void;
}

/** `getIcons` returns an IconifyJSON plus a getIcons-only `not_found` field. */
type IconSubsetResult = IconifyJSON & { not_found?: string[] };

/**
 * Extract the full tag text (`<...>`) containing a match at `matchStart`.
 * Used to detect per-tag attributes like `forceCdn` on `<ngx-iconify>`.
 */
function tagTextAt(content: string, matchStart: number, matchEnd: number): string {
  const tagStart = content.lastIndexOf('<', matchStart);
  const tagEnd = content.indexOf('>', matchEnd);
  if (tagStart === -1 || tagEnd === -1) return '';
  return content.slice(tagStart, tagEnd + 1);
}

/**
 * Walk every `.html`/`.ts` file under `sourceRoot` and collect `prefix -> Set<name>`
 * references matching the pinned pattern. Never matches `mdi-home`, `iconName =`, or
 * the literal word `iconify`.
 *
 * Icons referenced in a tag carrying `forceCdn` (presence or `[forceCdn]="true"`)
 * are CDN-only by intent and are EXCLUDED from the subset.
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

      const matchStart = match.index ?? 0;
      const tag = tagTextAt(content, matchStart, matchStart + match[0].length);
      if (/\bforceCdn\b/.test(tag)) continue;

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
 * Resolve a name inside a set (concrete icon or alias chain) via
 * `getIconData` from @iconify/utils. Returns the icon body, or undefined when
 * the name resolves to nothing.
 */
export function resolveIcon(fullSet: IconifyJSON, name: string): IconifyIcon | undefined {
  return getIconData(fullSet, name) ?? undefined;
}

/**
 * Build an `IconifyJSON[]` subset from the scanned `prefix -> names` map. Reads each
 * set's `icons.json` and delegates alias resolution + subset extraction to
 * `getIcons` from @iconify/utils. Missing names land in `result.not_found`,
 * are warned and excluded from `icons`; a set whose icons.json is absent is
 * warned and skipped entirely.
 */
export function buildSubset(
  tree: Tree,
  found: Map<string, Set<string>>,
  logger: SubsetLogger = { warn: () => undefined },
): IconifyJSON[] {
  const collections: IconifyJSON[] = [];

  for (const [prefix, names] of found) {
    const fullSet = readJsonFile(tree, iconSetJsonPath(prefix)) as IconifyJSON | null;
    if (fullSet === null) {
      logger.warn(`Set "${prefix}" not found — install @iconify-json/${prefix}`);
      continue;
    }

    const subset = getIcons(fullSet, [...names], true) as IconSubsetResult | null;
    if (subset === null) {
      for (const name of names) logger.warn(`Icon "${prefix}:${name}" not found in set`);
      continue;
    }

    for (const name of subset.not_found ?? []) {
      logger.warn(`Icon "${prefix}:${name}" not found in set`);
    }

    // Preserve explicit width/height defaults from the full set so the
    // generated file stays stable (getIcons copies them only when present).
    if (subset.width === undefined) subset.width = fullSet.width ?? DEFAULT_ICON_SIZE;
    if (subset.height === undefined) subset.height = fullSet.height ?? DEFAULT_ICON_SIZE;

    // `not_found` is a getIcons-only field, not part of IconifyJSON — keep the
    // generated subset clean by dropping it.
    delete subset.not_found;

    collections.push(subset);
  }

  return collections;
}
