import { InjectionToken } from '@angular/core';
import type { IconifyJSON } from '@iconify/types';

export interface NgxIconifyConfig {
  offlineCollections?: IconifyJSON[];
  apiProvider?: { name: string; resource: string };
  /**
   * Warn in dev (console.warn) when an icon misses the offline subset and
   * falls back to the CDN. Set to false to silence. Default: true.
   */
  warnOnMissing?: boolean;
}

export const NGX_ICONIFY_CONFIG = new InjectionToken<NgxIconifyConfig>('NGX_ICONIFY_CONFIG');
