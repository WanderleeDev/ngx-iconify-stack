import { Component } from '@angular/core';
import { NgxIconComponent } from 'ngx-icon-stack';

interface IconItem {
  icon: string;
  label: string;
}

@Component({
  selector: 'docs-hero',
  imports: [NgxIconComponent],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.css',
})
export class HeroSectionComponent {
  /** Left column — scrolls upward on page scroll */
  readonly leftIcons: IconItem[] = [
    { icon: 'mdi:home', label: 'Home' },
    { icon: 'mdi:heart', label: 'Heart' },
    { icon: 'mdi:star', label: 'Star' },
    { icon: 'mdi:bell', label: 'Bell' },
    { icon: 'mdi:magnify', label: 'Search' },
    { icon: 'mdi:cog', label: 'Settings' },
    { icon: 'mdi:account', label: 'Account' },
    { icon: 'mdi:cloud-upload', label: 'Upload' },
    { icon: 'mdi:palette', label: 'Palette' },
  ];

  /** Right column — scrolls downward on page scroll */
  readonly rightIcons: IconItem[] = [
    { icon: 'mdi:lightning-bolt', label: 'Lightning' },
    { icon: 'mdi:shield-check', label: 'Shield' },
    { icon: 'mdi:rocket-launch', label: 'Rocket' },
    { icon: 'lucide:layers', label: 'Layers' },
    { icon: 'lucide:code-2', label: 'Code' },
    { icon: 'lucide:zap', label: 'Zap' },
    { icon: 'ph:plant-bold', label: 'Plant' },
    { icon: 'ph:compass-bold', label: 'Compass' },
    { icon: 'ph:cube-bold', label: 'Cube' },
  ];
}
