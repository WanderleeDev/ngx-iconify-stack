import { InjectionToken } from '@angular/core';
import type { IconifyJSON } from '@iconify/types';

export interface NgxIconifyConfig {
  offlineCollections?: IconifyJSON[];
  apiProvider?: { name: string; resource: string };
}

export const NGX_ICONIFY_CONFIG = new InjectionToken<NgxIconifyConfig>('NGX_ICONIFY_CONFIG');
