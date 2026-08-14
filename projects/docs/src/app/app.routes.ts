import { Routes } from '@angular/router';
import { DocsPageComponent } from './pages/docs-page/docs-page.component';
import { HomePageComponent } from './pages/home-page/home-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'docs', component: DocsPageComponent },
  { path: '**', redirectTo: '' },
];
