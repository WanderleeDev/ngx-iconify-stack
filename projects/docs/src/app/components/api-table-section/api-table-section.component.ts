import { Component } from '@angular/core';
import { NgxIconify } from 'ngx-iconify-stack';

interface ApiProp {
  name: string;
  type: string;
  required: boolean;
  default: string;
  description: string;
}

interface CodeExample {
  id: string;
  label: string;
  code: string;
}

@Component({
  selector: 'docs-api-table',
  imports: [NgxIconify],
  templateUrl: './api-table-section.component.html',
  styles: ``,
})
export class ApiTableSectionComponent {
  activeExample = 'basic';
  copiedId: string | null = null;

  readonly apiProps: ApiProp[] = [
    {
      name: 'icon',
      type: 'string',
      required: true,
      default: '—',
      description: 'Iconify icon identifier, e.g. "mdi:home" or "lucide:arrow-right".',
    },
    {
      name: 'size',
      type: 'number',
      required: false,
      default: '—',
      description: 'Convenience input — sets both width and height via font-size.',
    },
    {
      name: 'width',
      type: 'number | string',
      required: false,
      default: '—',
      description: 'Explicit width in pixels. Overrides size.',
    },
    {
      name: 'height',
      type: 'number | string',
      required: false,
      default: '—',
      description: 'Explicit height in pixels. Overrides size.',
    },
    {
      name: 'color',
      type: 'string',
      required: false,
      default: '—',
      description: 'CSS color value for the icon (e.g. "#fff", "var(--color-accent)").',
    },
    {
      name: 'mode',
      type: "'svg' | 'bg' | 'mask' | 'style'",
      required: false,
      default: '—',
      description: 'Rendering mode passed to the iconify-icon web component.',
    },
    {
      name: 'inline',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Renders inline — aligns icon to text baseline.',
    },
    {
      name: 'noObserver',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Disables intersection observer; icon loads immediately.',
    },
  ];

  readonly examples: CodeExample[] = [
    {
      id: 'basic',
      label: 'Basic',
      code: `<!-- Basic usage -->
<ngx-iconify icon="mdi:home" />

<!-- With size -->
<ngx-iconify icon="mdi:heart" [size]="32" />

<!-- With color -->
<ngx-iconify icon="mdi:star" [size]="24" color="#f59e0b" />`,
    },
    {
      id: 'css-transform',
      label: 'CSS transforms',
      code: `<!-- CSS transforms (flip/rotate are not part of the API) -->
<!-- Note: CSS transform does not swap the layout box -->
<ngx-iconify icon="mdi:arrow-right" class="scale-x-[-1]" />
<ngx-iconify icon="mdi:arrow-up" class="rotate-90" />`,
    },
    {
      id: 'inline',
      label: 'Inline text',
      code: `<!-- Inline with text — aligns to baseline -->
<p>
  Click the
  <ngx-iconify icon="mdi:cog" [size]="18" [inline]="true" />
  settings icon to configure.
</p>`,
    },
    {
      id: 'dynamic',
      label: 'Dynamic',
      code: `<!-- Dynamic icon driven by a signal -->
@Component({
  template: \`
    <ngx-iconify [icon]="currentIcon()" [size]="iconSize()" />
    <button (click)="toggle()">Toggle</button>
  \`
})
export class MyComponent {
  readonly currentIcon = signal('mdi:moon');
  readonly iconSize = signal(24);

  toggle() {
    this.currentIcon.update(i =>
      i === 'mdi:moon' ? 'mdi:sun' : 'mdi:moon'
    );
  }
}`,
    },
  ];

  copyCode(code: string, id: string): void {
    navigator.clipboard?.writeText(code).catch(() => {});
    this.copiedId = id;
    setTimeout(() => (this.copiedId = null), 1300);
  }
}
