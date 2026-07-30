import { Component } from '@angular/core';
import { NgxIconComponent } from 'ngx-iconify-stack';

interface FloatingIcon {
  icon: string;
  label: string;
  top: string;
  left: string;
  size?: number;
  delay?: string;
  opacity: number;
}

@Component({
  selector: 'docs-hero',
  imports: [NgxIconComponent],
  templateUrl: './hero-section.component.html',
})
export class HeroSectionComponent {
  readonly floatingIcons: FloatingIcon[] = [
    // Top row across full width
    { icon: 'mdi:home', label: 'Home', top: '5%', left: '4%', size: 24, delay: '0s', opacity: 0.2 },
    {
      icon: 'lucide:zap',
      label: 'Zap',
      top: '8%',
      left: '22%',
      size: 28,
      delay: '-1.4s',
      opacity: 0.4,
    },
    {
      icon: 'mdi:bell',
      label: 'Bell',
      top: '6%',
      left: '45%',
      size: 22,
      delay: '-0.8s',
      opacity: 0.15,
    },
    {
      icon: 'lucide:layers',
      label: 'Layers',
      top: '9%',
      left: '68%',
      size: 26,
      delay: '-2.3s',
      opacity: 0.35,
    },
    {
      icon: 'mdi:heart',
      label: 'Heart',
      top: '5%',
      left: '92%',
      size: 24,
      delay: '-0.5s',
      opacity: 0.25,
    },

    // Upper-mid row
    {
      icon: 'ph:compass-bold',
      label: 'Compass',
      top: '25%',
      left: '12%',
      size: 26,
      delay: '-2.1s',
      opacity: 0.5,
    },
    {
      icon: 'mdi:star',
      label: 'Star',
      top: '28%',
      left: '35%',
      size: 20,
      delay: '-0.7s',
      opacity: 0.2,
    },
    {
      icon: 'lucide:code-2',
      label: 'Code',
      top: '26%',
      left: '60%',
      size: 28,
      delay: '-1.9s',
      opacity: 0.45,
    },
    {
      icon: 'mdi:shield-check',
      label: 'Shield',
      top: '24%',
      left: '84%',
      size: 24,
      delay: '-1.6s',
      opacity: 0.3,
    },

    // Middle area (behind/around title)
    {
      icon: 'mdi:cloud-upload',
      label: 'Upload',
      top: '48%',
      left: '6%',
      size: 24,
      delay: '-3.2s',
      opacity: 0.3,
    },
    {
      icon: 'ph:plant-bold',
      label: 'Plant',
      top: '45%',
      left: '26%',
      size: 22,
      delay: '-2.9s',
      opacity: 0.15,
    },
    {
      icon: 'mdi:cog',
      label: 'Settings',
      top: '46%',
      left: '74%',
      size: 24,
      delay: '-0.9s',
      opacity: 0.2,
    },
    {
      icon: 'mdi:rocket-launch',
      label: 'Rocket',
      top: '49%',
      left: '93%',
      size: 26,
      delay: '-2.8s',
      opacity: 0.5,
    },

    // Lower-mid row
    {
      icon: 'ph:cube-bold',
      label: 'Cube',
      top: '68%',
      left: '15%',
      size: 24,
      delay: '-1.2s',
      opacity: 0.4,
    },
    {
      icon: 'mdi:magnify',
      label: 'Search',
      top: '71%',
      left: '38%',
      size: 20,
      delay: '-0.4s',
      opacity: 0.15,
    },
    {
      icon: 'mdi:palette',
      label: 'Palette',
      top: '70%',
      left: '62%',
      size: 26,
      delay: '-3.6s',
      opacity: 0.35,
    },
    {
      icon: 'mdi:account',
      label: 'Account',
      top: '69%',
      left: '86%',
      size: 22,
      delay: '-1.8s',
      opacity: 0.25,
    },

    // Bottom row across full width
    {
      icon: 'mdi:lightning-bolt',
      label: 'Lightning',
      top: '90%',
      left: '8%',
      size: 26,
      delay: '-2.5s',
      opacity: 0.45,
    },
    {
      icon: 'tabler:package',
      label: 'Package',
      top: '88%',
      left: '30%',
      size: 22,
      delay: '-1.0s',
      opacity: 0.2,
    },
    {
      icon: 'simple-icons:iconify',
      label: 'Iconify',
      top: '91%',
      left: '52%',
      size: 24,
      delay: '-3.0s',
      opacity: 0.15,
    },
    {
      icon: 'logos:angular-icon',
      label: 'Angular',
      top: '89%',
      left: '76%',
      size: 22,
      delay: '-0.6s',
      opacity: 0.35,
    },
    {
      icon: 'mdi:check-circle',
      label: 'Check',
      top: '92%',
      left: '94%',
      size: 20,
      delay: '-2.2s',
      opacity: 0.2,
    },
  ];
}
