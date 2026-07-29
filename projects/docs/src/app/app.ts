import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiTableSectionComponent } from './components/api-table-section/api-table-section.component';
import { DemoSectionComponent } from './components/demo-section/demo-section.component';
import { FooterSectionComponent } from './components/footer-section/footer-section.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { NavbarComponent } from './components/navbar/navbar.component';

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
