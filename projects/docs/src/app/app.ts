import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavbarComponent } from './components/navbar.component';
import { HeroSectionComponent } from './components/hero-section.component';
import { DemoSectionComponent } from './components/demo-section.component';
import { ApiTableSectionComponent } from './components/api-table-section.component';
import { FooterSectionComponent } from './components/footer-section.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NavbarComponent,
    HeroSectionComponent,
    DemoSectionComponent,
    ApiTableSectionComponent,
    FooterSectionComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
