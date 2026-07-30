import type { IconifyJSON } from '@iconify/types';

export interface IconLookupResult {
  body: string;
  width: number;
  height: number;
}

/**
 * Look up an icon reference ("prefix:name") in a list of offline collections.
 * Resolves alias chains. Returns the SVG body and dimensions, or null if not found.
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

  let body: string | undefined;
  let iconWidth: number | undefined;
  let iconHeight: number | undefined;

  const icon = set.icons?.[name];
  if (icon) {
    body = icon.body;
    iconWidth = icon.width;
    iconHeight = icon.height;
  } else if (set.aliases?.[name]) {
    // Resolve alias chain (e.g. renamed icons)
    let alias = set.aliases[name];
    let depth = 0;
    while (alias?.parent && depth < 10) {
      const resolved = set.icons?.[alias.parent];
      if (resolved) {
        body = resolved.body;
        iconWidth = resolved.width;
        iconHeight = resolved.height;
        break;
      }
      alias = set.aliases?.[alias.parent];
      depth++;
    }
  }

  if (!body) return null;

  return {
    body,
    width: iconWidth ?? set.width ?? 24,
    height: iconHeight ?? set.height ?? 24,
  };
}
