<div align="center">

# 🎨 ngx-iconify-stack

**A lightweight, SSR-safe Angular wrapper for Iconify.**  
Driven by signals, with offline icon subsetting and zero runtime overhead.

[![npm version](https://img.shields.io/npm/v/ngx-iconify-stack.svg?style=flat-square&color=3b82f6)](https://www.npmjs.com/package/ngx-iconify-stack)
[![license](https://img.shields.io/github/license/WanderleeDev/ngx-iconify-stack.svg?style=flat-square&color=3b82f6)](https://github.com/WanderleeDev/ngx-iconify-stack/blob/main/LICENSE)
[![angular](https://img.shields.io/badge/angular-v20+-dd0031.svg?style=flat-square&logo=angular)](https://angular.dev/)
[![signals](https://img.shields.io/badge/signals-powered-a78bfa.svg?style=flat-square)](https://angular.dev/guide/signals)
[![SSR](https://img.shields.io/badge/SSR-ready-4ade80.svg?style=flat-square)](https://angular.dev/guide/ssr)
[![AI Skill](https://img.shields.io/badge/AI%20Skill-ready-6366f1.svg?style=flat-square)](#-ai-code-assistants-integration)

[📦 npm](https://www.npmjs.com/package/ngx-iconify-stack) · [⭐ Star on GitHub](https://github.com/WanderleeDev/ngx-iconify-stack) · [🔤 Iconify](https://iconify.design)

</div>

---

## 🚀 Features

- **⚡ Single Command Setup:** Fully configured via standard `ng add ngx-iconify-stack`.
- **📦 Offline Icon Subsetting:** Only the icons you actually use ship with your app — no CDN dependency at runtime.
- **🧱 Angular Signals:** Built natively with reactive signals for maximum performance.
- **🌍 SSR & Hydration Ready:** Icons in your subset render as inline SVG on the server — zero flicker or hydration gap.
- **🔀 Smart Fallback:** Icons outside the subset resolve through the native `<iconify-icon>` web component from the Iconify CDN.
- **🤖 AI Code Assistants Integration:** Work with AI coding assistants using the generated `SKILL.md` standard.

---

## 📦 Installation

```bash
ng add ngx-iconify-stack
```

The schematic installs `iconify-icon`, adds the provider to `app.config.ts`, wires the `ngx-iconify-stack:generate-icons` script into `prebuild`, and asks whether to generate the AI agent skill.

> [!TIP]
> **Using Bun?**
> Since `ng add` is not supported in Bun environments, use the manual two-step process:
>
> ```bash
> bun add ngx-iconify-stack
> ng generate ngx-iconify-stack:ng-add
> ```

---

## 🛠️ Setup

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
npm run ngx-iconify-stack:generate-icons
```

Skip `offlineCollections` entirely if you only want CDN icons. The component works without the provider.

---

## 🧩 Usage

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

---

## ⚙️ How it works

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

**This is a wrapper, not a reimplementation.** For anything beyond the basics — icon names, transformations, rendering modes — read the [Iconify documentation](https://iconify.design/docs/).

---

## 🤖 AI Code Assistants Integration

`ng add` can generate a `SKILL.md` standard file for AI coding assistants (Claude, Cursor, Copilot, and others). It encodes the library's usage patterns — setup, `ngx-iconify` component inputs, icon subsetting, and SSR-safe rendering — so your AI agent works with the library correctly without guessing.

---

## 🤝 Contributing & Issues

Contributions are welcome! If you find a bug or have a suggestion, feel free to open an issue or submit a pull request:
- Report bugs or request features on [GitHub Issues](https://github.com/WanderleeDev/ngx-iconify-stack/issues).
- For local development guidelines (how to build, test, and run the demo), please refer to the workspace [README](../../README.md).

---

## 📄 License

[MIT](https://github.com/WanderleeDev/ngx-iconify-stack/blob/main/LICENSE)
