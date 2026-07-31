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
  <img src="https://shieldcn.dev/badge/TypeScript-6.0-3178c6?variant=secondary&logo=typescript&logoColor=3178c6" alt="TypeScript" />
  <img src="https://shieldcn.dev/badge/sideEffects-false-22c55e?variant=secondary" alt="side effects" />
  <img src="https://shieldcn.dev/badge/license-MIT-3b82f6?variant=secondary" alt="MIT" />
  <a href="https://github.com/user/ngx-iconify-workspace"><img src="https://shieldcn.dev/github/stars/user/ngx-iconify-workspace?variant=secondary" alt="GitHub stars" /></a>
</p>

A lightweight, signal-based Angular wrapper for [Iconify](https://iconify.design) — access 200,000+ icons from 150+ icon sets with SSR-safe rendering and zero unnecessary DOM churn.

## Features

- **SSR-safe inline SVG** — icons in your offline subset render as `<svg>` in the server HTML. No flicker, no hydration gap.
- **CDN fallback** — icons not in the subset automatically use the `<iconify-icon>` web component. No manual fetch logic.
- **Build-time subsetting** — `collect-icons.mjs` scans your templates and generates a minimal icon subset. No full JSON bundles shipped to the browser.
- **Signal-based reactivity** — inputs as signals, computed SVG — zero `zone.js` overhead.
- **Standalone** — import `NgxIconify` directly, no `NgModule` required.
- **Tree-shakeable** — `sideEffects: false`.

## Installation

```bash
npm install ngx-iconify-stack iconify-icon @iconify/types
```

`@iconify/types` is optional — only needed for TypeScript tooling.

## Setup

### 1. Provide config

Configure offline collections and an optional custom API provider:

```typescript
import { provideIconify } from 'ngx-iconify-stack';
import { iconSubset } from './generated/icon-subset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideIconify({
      offlineCollections: iconSubset,
    }),
  ],
};
```

### 2. Import the component

```typescript
import { NgxIconify } from 'ngx-iconify-stack';

@Component({
  selector: 'app-my-component',
  imports: [NgxIconify],
  template: `
    <ngx-iconify icon="mdi:home" [size]="24" />
  `,
})
export class MyComponent {}
```

## Build-time icon subsetting

Install only the icon sets you use:

```bash
npm install -D @iconify-json/mdi @iconify-json/lucide @iconify-json/tabler
```

Use `collect-icons.mjs` to scan your templates and generate a minimal subset:

```bash
node scripts/collect-icons.mjs
```

This produces a `generated/icon-subset.ts` file with only the icons your templates reference — nothing more.

## Usage

### Basic

```html
<ngx-iconify icon="mdi:home" />
<ngx-iconify icon="lucide:arrow-right" />
<ngx-iconify icon="tabler:brand-github" [size]="32" />
```

### With color

```html
<ngx-iconify icon="mdi:star" [size]="24" color="#f59e0b" />
```

### Inline with text

```html
<p>
  Click the
  <ngx-iconify icon="mdi:cog" [size]="18" [inline]="true" />
  settings icon to configure.
</p>
```

### Transforms

```html
<ngx-iconify icon="mdi:arrow-right" flip="horizontal" />
<ngx-iconify icon="mdi:arrow-up" rotate="90" />
<ngx-iconify icon="mdi:chevron-right" flip="vertical" rotate="180" />
```

### Dynamic

```html
<ngx-iconify [icon]="currentIcon()" [size]="iconSize()" />
```

## API

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `icon` | `string` | **required** | Iconify icon identifier, e.g. `"mdi:home"` |
| `size` | `number` | — | Convenience shorthand — sets both width and height |
| `width` | `number \| string` | — | Explicit width in pixels (overrides `size`) |
| `height` | `number \| string` | — | Explicit height in pixels (overrides `size`) |
| `color` | `string` | — | CSS color value for the icon |
| `flip` | `"horizontal" \| "vertical" \| "both"` | — | Flip transformation |
| `rotate` | `string \| number` | — | Rotation: `"90"`, `"180"`, `"270"` or degree value |
| `inline` | `boolean` | `false` | Aligns icon to text baseline |
| `mode` | `"svg" \| "bg" \| "mask" \| "style"` | — | Rendering mode passed to `<iconify-icon>` |
| `noObserver` | `boolean` | `false` | Disables intersection observer lazy loading |

## How it works

```
                   icon="mdi:home"
                         │
                         ▼
          ┌── lookupIcon() ──┐
          │ in offlineCollections │
          └────────┬─────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   Found? → inline SVG    Not found? → <iconify-icon>
   ───────                 ──────────
   SSR-safe <svg>          Resolves from Iconify CDN
   No hydration flicker    Handles transforms dynamically
   Color replacement       Full web component support
   via currentColor
```

- **Icons in the offline subset** render as inline `<svg>` on the server and stay as SVG on the client. No forced replacement, no unnecessary DOM mutation.
- **Icons not in the subset** render as `<iconify-icon>` from the start, resolving from the Iconify CDN.
- **Dynamic input changes** recalculate the SVG content reactively via signals — when the icon switches between subset and non-subset, the render path switches automatically.

## Scripts

| Script | Description |
|--------|-------------|
| `collect-icons.mjs` | Scan templates and build offline icon subset |

## Peer dependencies

| Package | Version | Required |
|---------|---------|----------|
| `@angular/common` | `^22.0` | ✅ |
| `@angular/core` | `^22.0` | ✅ |
| `iconify-icon` | `>=3.0.2` | ✅ |
| `@iconify/types` | `^2.0` | ⬜ optional |

## License

MIT
