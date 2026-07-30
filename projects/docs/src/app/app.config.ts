import { provideThemeStack } from 'ngx-theme-stack';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideIconify } from 'ngx-iconify-stack';
import { iconSubset } from '../generated/icon-subset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideIconify({ offlineCollections: iconSubset }),
    provideThemeStack({
      themes: ['system', 'light', 'dark'] as const,
      defaultTheme: 'system',
      storageKey: 'ngx-theme-stack',
      mode: 'class',
      strategy: 'critters',
    }),
  ],
};
