import type { IconifyJSON } from '@iconify/types';
import { getIconData } from '@iconify/utils';

export interface IconLookupResult {
  body: string;
  width: number;
  height: number;
}

/**
 * Look up an icon reference ("prefix:name") in a list of offline collections.
 * Splitting `prefix:name` stays manual (first colon); alias resolution is
 * delegated to `getIconData` from @iconify/utils. Returns the SVG body and
 * dimensions, or null if not found.
 */
export function lookupIcon(
  iconRef: string,
  collections?: IconifyJSON[] | null,
): IconLookupResult | null {
  if (!collections || !iconRef) return null;

  const sep = iconRef.indexOf(':');
  if (sep === -1) return null;

  const prefix = iconRef.slice(0, sep);
  const name = iconRef.slice(sep + 1);
  const set = collections.find((c) => c.prefix === prefix);
  if (!set) return null;

  const icon = getIconData(set, name);
  if (!icon) return null;

  return {
    body: icon.body,
    width: icon.width ?? set.width ?? 24,
    height: icon.height ?? set.height ?? 24,
  };
}
