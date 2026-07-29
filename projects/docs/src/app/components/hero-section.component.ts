import { Component } from '@angular/core';
import { NgxIconComponent } from 'ngx-icon-stack';

@Component({
  selector: 'docs-hero',
  imports: [NgxIconComponent],
  templateUrl: './hero-section.component.html',
  styles: `
    .hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 6rem 1.5rem 4rem;
      gap: 1.5rem;
    }

    .hero__badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      background: color-mix(in oklch, var(--color-accent) 12%, transparent);
      border: 1px solid color-mix(in oklch, var(--color-accent) 30%, transparent);
      color: var(--color-accent);
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.03em;
    }

    .hero__title {
      margin: 0;
      font-size: clamp(2.8rem, 8vw, 5.5rem);
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.04em;
    }

    .hero__title-gradient {
      background: var(--gradient-brand);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero__subtitle {
      max-width: 54ch;
      font-size: 1.15rem;
      line-height: 1.7;
      color: var(--color-text-muted);
      margin: 0;
    }

    .hero__cta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
      justify-content: center;
      margin-top: 0.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.4rem;
      border-radius: 0.6rem;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .btn--primary {
      background: var(--gradient-brand);
      color: #fff;
      box-shadow: 0 4px 24px color-mix(in oklch, var(--color-accent) 35%, transparent);
    }

    .btn--primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px color-mix(in oklch, var(--color-accent) 45%, transparent);
    }

    .btn--ghost {
      background: transparent;
      color: var(--color-text);
      border: 1.5px solid var(--color-border);
    }

    .btn--ghost:hover {
      background: var(--color-surface-2);
      border-color: var(--color-accent);
    }

    .hero__icons {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 1.5rem;
      max-width: 600px;
    }

    .hero__icon-chip {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      border-radius: 0.75rem;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      transition: all 0.2s ease;
    }

    .hero__icon-chip:hover {
      background: color-mix(in oklch, var(--color-accent) 12%, transparent);
      border-color: var(--color-accent);
      transform: translateY(-3px) scale(1.08);
      color: var(--color-accent);
    }
  `,
})
export class HeroSectionComponent {
  readonly iconShowcase = [
    { icon: 'mdi:home', label: 'Home' },
    { icon: 'mdi:heart', label: 'Heart' },
    { icon: 'mdi:star', label: 'Star' },
    { icon: 'mdi:bell', label: 'Bell' },
    { icon: 'mdi:magnify', label: 'Search' },
    { icon: 'mdi:cog', label: 'Settings' },
    { icon: 'mdi:account', label: 'Account' },
    { icon: 'mdi:cloud-upload', label: 'Upload' },
    { icon: 'mdi:palette', label: 'Palette' },
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
