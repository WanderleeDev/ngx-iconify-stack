import {
  inject,
  PLATFORM_ID,
  provideEnvironmentInitializer,
  makeEnvironmentProviders,
  EnvironmentProviders,
  ErrorHandler,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NGX_ICONIFY_CONFIG, NgxIconifyConfig } from './icon.config';

export function provideIconify(config: NgxIconifyConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: NGX_ICONIFY_CONFIG, useValue: config },
    provideEnvironmentInitializer(() => {
      const platformId = inject(PLATFORM_ID);
      if (!isPlatformBrowser(platformId)) return;

      const errorHandler = inject(ErrorHandler);

      import('iconify-icon')
        .then(async ({ addCollection, addAPIProvider }) => {
          if (config.apiProvider) {
            addAPIProvider(config.apiProvider.name, {
              resources: [config.apiProvider.resource],
            });
          }
          config.offlineCollections?.forEach((set) => addCollection(set));
        })
        .catch((err: unknown) => {
          const error = err instanceof Error ? err : new Error(String(err));
          errorHandler.handleError(error);
        });
    }),
  ]);
}
