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

## ⚠️ Deprecation Notice

**Versions < 1.0.0 are deprecated.** Please upgrade to v1.0.0 or later for the latest features and improvements.

### Migration from 0.x to 1.0

No breaking changes to the public API. If you're using 0.x:
1. Run `npm install ngx-iconify-stack@latest`
2. Update imports from `src/generated/icon-subset.ts` → `src/ngx-iconify/icon-subset.ts` (or rerun `ng add ngx-iconify-stack`)
3. Done! Your app will work as before.

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
import { iconSubset } from './ngx-iconify/icon-subset';

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
    <ngx-iconify icon="tabler:brand-github" [inline]="true" />
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

**ngx-iconify-stack is a thin Angular wrapper around [Iconify](https://iconify.design).** It provides:
- Signal-based reactivity for smooth icon switching
- SSR-safe offline subsetting (no runtime CDN dependency for subset icons)
- Zero runtime overhead via Angular's standalone component model

For icon names, transformations, rendering modes, and more — consult the [Iconify documentation](https://iconify.design/docs/).

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
