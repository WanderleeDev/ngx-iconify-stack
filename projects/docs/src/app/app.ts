import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterSectionComponent } from './components/footer-section/footer-section.component';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavbarComponent, RouterOutlet, FooterSectionComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
