import type { IconifyJSON } from '@iconify/types';
import { getIconData } from '@iconify/utils';

/**
 * Default icon box size when neither the icon nor its set declares width/height.
 * Cross-reference: `schematics/generate-icon-subset/icons.ts` exports the same
 * `DEFAULT_ICON_SIZE = 24` for the subset builder — keep the two in sync by hand
 * (the runtime library cannot import schematics code).
 */
const DEFAULT_ICON_SIZE = 24;

export interface IconLookupResult {
  body: string;
  width: number;
  height: number;
}

/**
 * Split an Iconify reference into its `prefix` and `name`, or null when there
 * is no colon. Deliberate copy of `splitIconRef` in
 * `schematics/utils.ts` — the runtime library cannot import schematics code,
 * so this stays in sync by hand.
 */
function splitIconRef(ref: string): { prefix: string; name: string } | null {
  const sep = ref.indexOf(':');
  if (sep === -1) return null;
  return { prefix: ref.slice(0, sep), name: ref.slice(sep + 1) };
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

  const parts = splitIconRef(iconRef);
  if (!parts) return null;

  const { prefix, name } = parts;
  const set = collections.find((c) => c.prefix === prefix);
  if (!set) return null;

  const icon = getIconData(set, name);
  if (!icon) return null;

  return {
    body: icon.body,
    width: icon.width ?? set.width ?? DEFAULT_ICON_SIZE,
    height: icon.height ?? set.height ?? DEFAULT_ICON_SIZE,
  };
}
