import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgxIconify } from 'ngx-iconify-stack';

interface ComponentInput {
  name: string;
  type: string;
  default: string;
  description: string;
}

@Component({
  selector: 'docs-component-docs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxIconify],
  templateUrl: './component-docs.component.html',
})
export class ComponentDocsComponent {
  readonly componentExampleCode = `import { Component } from '@angular/core';
import { NgxIconify } from 'ngx-iconify-stack';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [NgxIconify],
  template: \`
    <ngx-iconify icon="mdi:home" [size]="24" />
    <ngx-iconify icon="lucide:arrow-right" color="#f59e0b" />
    <ngx-iconify icon="tabler:brand-github" inline />
  \`,
})
export class ExampleComponent {}`;

  readonly inputs: ComponentInput[] = [
    {
      name: 'icon',
      type: 'string',
      default: 'required',
      description: 'Iconify icon name, e.g. "mdi:home"',
    },
    {
      name: 'size',
      type: 'number | string',
      default: '16px',
      description: 'Sets both width and height (e.g. "1em", "24px", 24)',
    },
    {
      name: 'width',
      type: 'number | string',
      default: '16px',
      description: 'Explicit width (overrides size)',
    },
    {
      name: 'height',
      type: 'number | string',
      default: "icon's native",
      description:
        "Explicit height (overrides size); falls back to the icon's native height when unset",
    },
    {
      name: 'color',
      type: 'string',
      default: '—',
      description: 'CSS color for the icon',
    },
    {
      name: 'class',
      type: 'string',
      default: '—',
      description: 'CSS class added to the rendered icon element',
    },
    {
      name: 'inline',
      type: 'boolean',
      default: 'false',
      description: 'Align to text baseline (boolean attribute); applied on the host element',
    },
    {
      name: 'forceCdn',
      type: 'boolean',
      default: 'false',
      description: 'Force CDN resolution and EXCLUDE from the generated subset (boolean attribute)',
    },
    {
      name: 'mode',
      type: '"svg" | "bg" | "mask" | "style"',
      default: '—',
      description: 'Rendering mode for <iconify-icon>',
    },
    {
      name: 'noObserver',
      type: 'boolean',
      default: 'false',
      description: 'Disable lazy loading observer (boolean attribute)',
    },
  ];
}
