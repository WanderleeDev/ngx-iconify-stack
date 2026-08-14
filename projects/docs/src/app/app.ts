import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FooterSectionComponent } from './components/footer-section/footer-section.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomePageComponent } from './pages/home-page/home-page.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavbarComponent, HomePageComponent, FooterSectionComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
