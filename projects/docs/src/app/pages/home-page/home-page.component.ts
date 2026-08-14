import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoSectionComponent } from '../../components/demo-section/demo-section.component';
import { HeroSectionComponent } from '../../components/hero-section/hero-section.component';
import { HowItWorksComponent } from '../../components/how-it-works/how-it-works.component';

@Component({
  selector: 'home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroSectionComponent, HowItWorksComponent, DemoSectionComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent {}
