<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/surface.svg?title=ngx-iconify-stack&subtitle=SSR-safe+Iconify+component+for+Angular&logo=angular&logoColor=fff&mode=dark&theme=zinc&height=160&width=680" />
    <img alt="ngx-iconify-stack" src="https://shieldcn.dev/header/surface.svg?title=ngx-iconify-stack&subtitle=SSR-safe+Iconify+component+for+Angular&logo=angular&logoColor=dd0031&mode=light&theme=zinc&height=160&width=680" />
  </picture>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ngx-iconify-stack"><img src="https://shieldcn.dev/npm/v/ngx-iconify-stack?variant=secondary" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/ngx-iconify-stack"><img src="https://shieldcn.dev/npm/dm/ngx-iconify-stack?variant=secondary" alt="npm downloads" /></a>
  <a href="https://angular.dev"><img src="https://shieldcn.dev/badge/Angular-%5E22.0-dd0031?variant=secondary&logo=angular&logoColor=dd0031" alt="Angular" /></a>
  <img src="https://shieldcn.dev/badge/license-MIT-3b82f6?variant=secondary" alt="MIT" />
</p>

# ngx-iconify-stack

A signal-based Angular wrapper for [Iconify](https://iconify.design). Icons in your offline subset render as SSR-safe inline SVG; everything else falls through to the native [`<iconify-icon>`](https://iconify.design/docs/iconify-icon/) web component.

**This is a wrapper, not a reimplementation.** For anything beyond the basics — icon names, transformations, rendering modes — read the [Iconify documentation](https://iconify.design/docs/).

## Install

```bash
ng add ngx-iconify-stack
```

The schematic installs `iconify-icon`, adds the provider to `app.config.ts`, and asks whether to generate the AI agent skill.

> [!TIP]
> **Using Bun?** Since `ng add` is not supported in Bun environments, use the manual two-step process:
>
> ```bash
> bun add ngx-iconify-stack
> ng generate ngx-iconify-stack:ng-add
> ```

## Setup

Provide the offline icon subset in your `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideIconify } from 'ngx-iconify-stack';
import { iconSubset } from './generated/icon-subset';

export const appConfig: ApplicationConfig = {
  providers: [provideIconify({ offlineCollections: iconSubset })],
};
```

The subset is generated at build time by the included schematic — it scans your templates and ships only the icons you actually use:

```bash
npx ng generate ngx-iconify-stack:generate-icon-subset --project <project-name>
# or, if the schematic wired it up for you:
npm run icons
```

Skip `offlineCollections` entirely if you only want CDN icons. The component works without the provider.

## Usage

```typescript
import { NgxIconify } from 'ngx-iconify-stack';

@Component({
  selector: 'app-example',
  imports: [NgxIconify],
  template: `
    <ngx-iconify icon="mdi:home" [size]="24" />
    <ngx-iconify icon="lucide:arrow-right" color="#f59e0b" />
    <ngx-iconify icon="tabler:brand-github" flip="horizontal" rotate="90" />
  `,
})
export class ExampleComponent {}
```

| Input              | Type                                   | Description                                         |
| ------------------ | -------------------------------------- | --------------------------------------------------- |
| `icon`             | `string`                               | Iconify icon name, e.g. `"mdi:home"` (**required**) |
| `size`             | `number`                               | Shorthand that sets both width and height           |
| `width` / `height` | `number \| string`                     | Explicit dimensions (override `size`)               |
| `color`            | `string`                               | CSS color for the icon                              |
| `class`            | `string`                               | CSS class added to the rendered icon element        |
| `flip`             | `"horizontal" \| "vertical" \| "both"` | Flip the icon                                       |
| `rotate`           | `number \| string`                     | Rotate the icon, e.g. `90` or `"90deg"`             |
| `inline`           | `boolean`                              | Align icon to the text baseline                     |
| `mode`             | `"svg" \| "bg" \| "mask" \| "style"`   | Rendering mode for the web component                |
| `noObserver`       | `boolean`                              | Disable lazy rendering on scroll                    |

These map to the [`<iconify-icon>` attributes](https://iconify.design/docs/iconify-icon/#attributes) — see the [Iconify docs](https://iconify.design/docs/) for icon names and behavior details.

## How it works

```
icon="mdi:home"
      │
      ▼
┌─ in offlineCollections? ─┐
│      └────────┬─────────┘
│               │
┌▼──────────────▼────────────────────────┐
│  Yes → inline <svg>                    │
│  No  → <iconify-icon> resolved from CDN │
└────────────────────────────────────────┘
```

- **In subset** → inline `<svg>` rendered on the server, no flicker or hydration gap.
- **Not in subset** → `<iconify-icon>` web component resolves it from the Iconify CDN.
- Inputs are signals, so switching icons recalculates reactively — works in zoneless apps.

## License

MIT
