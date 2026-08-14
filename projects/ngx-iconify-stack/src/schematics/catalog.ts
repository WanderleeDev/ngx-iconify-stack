import { Tree } from '@angular-devkit/schematics';
import type { IconifyJSON } from '@iconify/types';

/** Catalog path inside a target project's node_modules. */
export const COLLECTIONS_JSON_PATH = '/node_modules/@iconify/collections/collections.json';

/** Path of an installed set's icon data inside a target project's node_modules. */
export function iconSetJsonPath(prefix: string): string {
  return `/node_modules/@iconify-json/${prefix}/icons.json`;
}

/** Per-set metadata shape from `@iconify/collections/collections.json`. */
export interface IconifySetInfo {
  name?: string;
  total?: number;
  category?: string;
  author?: { name?: string; url?: string };
  license?: { title?: string; spdx?: string; url?: string };
  samples?: string[];
  height?: number | number[];
  palette?: boolean;
  tags?: string[];
  [key: string]: unknown;
}

/** The collections catalog keyed by set prefix. */
export type IconifyCollections = Record<string, IconifySetInfo>;

/**
 * Read + parse a JSON file from the schematic tree (no filesystem fallback —
 * these tools are read-only and must never fabricate data). Returns null when
 * the file is absent or malformed.
 */
function readJson<T>(tree: Tree, path: string): T | null {
  const buffer = tree.read(path);
  if (buffer === null) return null;
  try {
    return JSON.parse(buffer.toString('utf8')) as T;
  } catch {
    return null;
  }
}

/** Read the Iconify set catalog; null when `@iconify/collections` is not installed. */
export function readCollections(tree: Tree): IconifyCollections | null {
  return readJson<IconifyCollections>(tree, COLLECTIONS_JSON_PATH);
}

/** Read an installed set's icons.json; null when the set is not installed. */
export function readInstalledSet(tree: Tree, prefix: string): IconifyJSON | null {
  return readJson<IconifyJSON>(tree, iconSetJsonPath(prefix));
}

/**
 * Top `limit` icon names in a set closest to `name` by Levenshtein distance
 * (ties broken by insertion order, so suggestions are stable). Candidates come
 * from the set's icons plus its aliases. Empty when the set has no names.
 */
export function closestIconMatches(
  set: IconifyJSON,
  name: string,
  limit = 3,
): string[] {
  const candidates = new Set([
    ...Object.keys(set.icons ?? {}),
    ...Object.keys(set.aliases ?? {}),
  ]);
  return [...candidates]
    .map((candidate) => ({ candidate, distance: levenshtein(candidate, name) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

/** Classic Levenshtein edit distance between two strings. */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => {
    const row = new Array<number>(n + 1);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[m][n];
}