import {
  inject,
  PLATFORM_ID,
  provideEnvironmentInitializer,
  makeEnvironmentProviders,
  EnvironmentProviders,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NGX_ICONIFY_CONFIG, NgxIconifyConfig } from './icon.config';

export function provideIconify(config: NgxIconifyConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: NGX_ICONIFY_CONFIG, useValue: config },
    provideEnvironmentInitializer(() => {
      const platformId = inject(PLATFORM_ID);
      if (!isPlatformBrowser(platformId)) return;

      import('iconify-icon')
        .then(async ({ addCollection, addAPIProvider }) => {
          if (config.apiProvider) {
            addAPIProvider(config.apiProvider.name, {
              resources: [config.apiProvider.resource],
            });
          }
          config.offlineCollections?.forEach((set) => addCollection(set));
        })
        .catch((err) => {
          console.error(
            '[ngx-iconify] failed to load the iconify-icon web component; CDN fallback is unavailable',
            err,
          );
        });
    }),
  ]);
}
