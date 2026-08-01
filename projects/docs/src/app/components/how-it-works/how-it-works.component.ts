import { Component } from '@angular/core';
import { NgxIconify } from 'ngx-iconify-stack';

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

interface WhyCard {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'docs-how-it-works',
  standalone: true,
  imports: [NgxIconify],
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.css'],
})
export class HowItWorksComponent {
  readonly features: FeatureCard[] = [
    {
      icon: 'tabler:package',
      title: 'Icon Subsetting',
      description: 'Build time scans your templates and generates a subset of only the icons you actually use. No bloat, only essentials.',
    },
    {
      icon: 'mdi:server',
      title: 'SSR Ready',
      description: 'Icons render as inline SVG on the server. Zero flicker, no hydration mismatches, instant paint on client.',
    },
    {
      icon: 'mdi:cloud-check',
      title: 'Smart Fallback',
      description: 'Icons outside the subset resolve through the Iconify CDN. Use 200,000+ icons without shipping them all.',
    },
  ];

  readonly whyPoints: WhyCard[] = [
    {
      icon: 'mdi:check-circle',
      title: 'Signal-Driven Reactivity',
      description: 'Built with Angular signals for maximum performance and zoneless app support.',
    },
    {
      icon: 'mdi:check-circle',
      title: 'Zero Runtime Overhead',
      description: 'Minimal bundle impact with standalone component architecture.',
    },
    {
      icon: 'mdi:check-circle',
      title: 'Auto-Subsetting Schematic',
      description: 'One CLI command to generate your icon subset — baked into your build pipeline.',
    },
    {
      icon: 'mdi:check-circle',
      title: '200,000+ Icons',
      description: 'Access 150+ icon sets. Ship what you need, fallback to the CDN for the rest.',
    },
  ];
}
