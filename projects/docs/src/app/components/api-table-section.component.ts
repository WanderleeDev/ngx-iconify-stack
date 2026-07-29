import { Component } from '@angular/core';
import { NgxIconComponent } from 'ngx-icon-stack';

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
  imports: [NgxIconComponent],
  template: `
    <section class="api" aria-labelledby="api-title">
      <div class="section-header">
        <h2 id="api-title" class="section-title">API Reference</h2>
        <p class="section-desc">All inputs are signal-based and fully typed.</p>
      </div>

      <div class="api__table-wrap" role="region" aria-label="API inputs table" tabindex="0">
        <table class="api__table">
          <thead>
            <tr>
              <th scope="col">Input</th>
              <th scope="col">Type</th>
              <th scope="col">Required</th>
              <th scope="col">Default</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            @for (prop of apiProps; track prop.name) {
              <tr>
                <td><code class="api__code api__code--name">{{ prop.name }}</code></td>
                <td><code class="api__code api__code--type">{{ prop.type }}</code></td>
                <td>
                  @if (prop.required) {
                    <span class="api__badge api__badge--required">required</span>
                  } @else {
                    <span class="api__badge api__badge--optional">optional</span>
                  }
                </td>
                <td>
                  @if (prop.default !== '—') {
                    <code class="api__code">{{ prop.default }}</code>
                  } @else {
                    <span class="api__em">{{ prop.default }}</span>
                  }
                </td>
                <td class="api__desc">{{ prop.description }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="api__examples" aria-labelledby="examples-title">
        <h3 id="examples-title" class="api__examples-title">Usage Examples</h3>
        <div class="api__tabs" role="tablist" aria-label="Code examples">
          @for (example of examples; track example.id) {
            <button
              class="api__tab"
              [class.api__tab--active]="activeExample === example.id"
              [id]="'tab-' + example.id"
              role="tab"
              [attr.aria-selected]="activeExample === example.id"
              [attr.aria-controls]="'panel-' + example.id"
              (click)="activeExample = example.id"
            >
              {{ example.label }}
            </button>
          }
        </div>
        @for (example of examples; track example.id) {
          @if (activeExample === example.id) {
            <div
              class="api__code-block"
              [id]="'panel-' + example.id"
              role="tabpanel"
              [attr.aria-labelledby]="'tab-' + example.id"
            >
              <div class="api__code-header">
                <span class="api__code-lang">HTML</span>
                <button
                  class="api__copy-btn"
                  [id]="'copy-' + example.id"
                  (click)="copyCode(example.code, example.id)"
                  aria-label="Copy code"
                >
                  <ngx-icon
                    [icon]="copiedId === example.id ? 'mdi:check' : 'mdi:content-copy'"
                    [size]="16"
                  />
                  {{ copiedId === example.id ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <pre class="api__pre"><code>{{ example.code }}</code></pre>
            </div>
          }
        }
      </div>
    </section>
  `,
  styles: `
    .api {
      padding: 4rem 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }

    .section-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .section-title {
      font-size: clamp(1.8rem, 4vw, 2.6rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      margin: 0 0 0.75rem;
      background: var(--gradient-brand);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .section-desc {
      color: var(--color-text-muted);
      font-size: 1rem;
      margin: 0;
    }

    .api__table-wrap {
      overflow-x: auto;
      border-radius: 0.85rem;
      border: 1.5px solid var(--color-border);
      margin-bottom: 3rem;
    }

    .api__table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .api__table thead {
      background: var(--color-surface-2);
    }

    .api__table th {
      padding: 0.85rem 1.1rem;
      text-align: left;
      font-weight: 700;
      color: var(--color-text-muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .api__table td {
      padding: 0.85rem 1.1rem;
      border-top: 1px solid var(--color-border);
      vertical-align: top;
    }

    .api__table tr:hover td {
      background: color-mix(in oklch, var(--color-accent) 4%, transparent);
    }

    .api__code {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.82rem;
      padding: 0.15rem 0.45rem;
      border-radius: 0.3rem;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
    }

    .api__code--name {
      color: var(--color-accent);
    }

    .api__code--type {
      color: color-mix(in oklch, var(--color-accent) 70%, var(--color-text));
    }

    .api__badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .api__badge--required {
      background: color-mix(in oklch, oklch(60% 0.2 25) 15%, transparent);
      color: oklch(60% 0.2 25);
      border: 1px solid color-mix(in oklch, oklch(60% 0.2 25) 30%, transparent);
    }

    .api__badge--optional {
      background: var(--color-surface-2);
      color: var(--color-text-muted);
      border: 1px solid var(--color-border);
    }

    .api__em {
      color: var(--color-text-muted);
      font-style: italic;
    }

    .api__desc {
      color: var(--color-text-muted);
      line-height: 1.5;
      min-width: 200px;
    }

    .api__examples-title {
      font-size: 1.3rem;
      font-weight: 700;
      margin: 0 0 1.25rem;
      letter-spacing: -0.02em;
    }

    .api__tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0;
      border-bottom: 1.5px solid var(--color-border);
      padding-bottom: 0;
    }

    .api__tab {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1.5px;
      transition: all 0.15s;
      font: inherit;
    }

    .api__tab:hover {
      color: var(--color-text);
    }

    .api__tab--active {
      color: var(--color-accent);
      border-bottom-color: var(--color-accent);
    }

    .api__code-block {
      border: 1.5px solid var(--color-border);
      border-top: none;
      border-radius: 0 0 0.85rem 0.85rem;
      overflow: hidden;
    }

    .api__code-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 1rem;
      background: var(--color-surface-2);
      border-bottom: 1px solid var(--color-border);
    }

    .api__code-lang {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .api__copy-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.65rem;
      border-radius: 0.4rem;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text-muted);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      font: inherit;
    }

    .api__copy-btn:hover {
      color: var(--color-accent);
      border-color: var(--color-accent);
    }

    .api__pre {
      margin: 0;
      padding: 1.5rem;
      overflow-x: auto;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.85rem;
      line-height: 1.7;
      color: var(--color-text);
      background: var(--color-surface);
    }
  `,
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
      name: 'flip',
      type: "'horizontal' | 'vertical' | 'both'",
      required: false,
      default: '—',
      description: 'Flip transformation applied to the icon.',
    },
    {
      name: 'rotate',
      type: 'string | number',
      required: false,
      default: '—',
      description: 'Rotation: "90", "180", "270" or a degree value.',
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
<ngx-icon icon="mdi:home" />

<!-- With size -->
<ngx-icon icon="mdi:heart" [size]="32" />

<!-- With color -->
<ngx-icon icon="mdi:star" [size]="24" color="#f59e0b" />`,
    },
    {
      id: 'transform',
      label: 'Transforms',
      code: `<!-- Flip horizontal -->
<ngx-icon icon="mdi:arrow-right" flip="horizontal" />

<!-- Rotate 90° -->
<ngx-icon icon="mdi:arrow-up" rotate="90" />

<!-- Flip + rotate -->
<ngx-icon icon="mdi:chevron-right" flip="vertical" rotate="180" />`,
    },
    {
      id: 'inline',
      label: 'Inline text',
      code: `<!-- Inline with text — aligns to baseline -->
<p>
  Click the
  <ngx-icon icon="mdi:cog" [size]="18" [inline]="true" />
  settings icon to configure.
</p>`,
    },
    {
      id: 'dynamic',
      label: 'Dynamic',
      code: `<!-- Dynamic icon driven by a signal -->
@Component({
  template: \`
    <ngx-icon [icon]="currentIcon()" [size]="iconSize()" />
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
