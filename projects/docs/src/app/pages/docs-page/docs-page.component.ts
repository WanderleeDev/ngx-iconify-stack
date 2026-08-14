import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgxIconify } from 'ngx-iconify-stack';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'docs-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxIconify, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './docs-page.component.html',
  styleUrl: './docs-page.component.css',
})
export class DocsPageComponent {
  readonly navItems: NavItem[] = [
    { path: 'getting-started', label: 'Getting started', icon: 'mdi:rocket-launch' },
    { path: 'provider', label: 'Provider config', icon: 'mdi:server' },
    { path: 'component', label: 'Component', icon: 'mdi:cog' },
    { path: 'rendering', label: 'Rendering', icon: 'mdi:palette' },
    { path: 'schematics', label: 'Schematics', icon: 'mdi:tag-outline' },
    { path: 'tools', label: 'Catalog tools', icon: 'mdi:magnify' },
  ];
}
