import { Routes } from '@angular/router';
import { ComponentDocsComponent } from './pages/docs/component/component-docs.component';
import { GettingStartedComponent } from './pages/docs/getting-started/getting-started.component';
import { ProviderComponent } from './pages/docs/provider/provider.component';
import { RenderingComponent } from './pages/docs/rendering/rendering.component';
import { SchematicsComponent } from './pages/docs/schematics/schematics.component';
import { ToolsComponent } from './pages/docs/tools/tools.component';
import { DocsPageComponent } from './pages/docs-page/docs-page.component';
import { HomePageComponent } from './pages/home-page/home-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  {
    path: 'docs',
    component: DocsPageComponent,
    children: [
      { path: '', redirectTo: 'getting-started', pathMatch: 'full' },
      { path: 'getting-started', component: GettingStartedComponent },
      { path: 'provider', component: ProviderComponent },
      { path: 'component', component: ComponentDocsComponent },
      { path: 'rendering', component: RenderingComponent },
      { path: 'schematics', component: SchematicsComponent },
      { path: 'tools', component: ToolsComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
