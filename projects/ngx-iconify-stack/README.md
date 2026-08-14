<div align="center">

# ✨ ngx-iconify-stack

![ngx-iconify-stack banner](https://raw.githubusercontent.com/WanderleeDev/ngx-iconify-stack/main/projects/docs/public/banner.png)

**A lightweight, SSR-safe Angular wrapper for Iconify.**  
Driven by signals, with offline icon subsetting and zero runtime overhead.

[![npm version](https://img.shields.io/npm/v/ngx-iconify-stack.svg?style=flat-square&color=3b82f6)](https://www.npmjs.com/package/ngx-iconify-stack)
[![license](https://img.shields.io/github/license/WanderleeDev/ngx-iconify-stack.svg?style=flat-square&color=3b82f6)](https://github.com/WanderleeDev/ngx-iconify-stack/blob/main/LICENSE)
[![angular](https://img.shields.io/badge/angular-v20+-dd0031.svg?style=flat-square&logo=angular)](https://angular.dev/)
[![signals](https://img.shields.io/badge/signals-powered-a78bfa.svg?style=flat-square)](https://angular.dev/guide/signals)
[![SSR](https://img.shields.io/badge/SSR-ready-4ade80.svg?style=flat-square)](https://angular.dev/guide/ssr)
[![AI Skill](https://img.shields.io/badge/AI%20Skill-ready-6366f1.svg?style=flat-square)](#-ai-code-assistants-integration)

[📦 npm](https://www.npmjs.com/package/ngx-iconify-stack) · [📖 Docs](https://ngx-iconify-stack-docs.wanderlee.site/docs) · [⭐ Star on GitHub](https://github.com/WanderleeDev/ngx-iconify-stack) · [🔤 Iconify](https://iconify.design)

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

The schematic asks for the **delivery mode**, installs `iconify-icon`, adds the provider to `app.config.ts`, and asks whether to generate the AI agent skill. In `autohost` mode (default) it also scans your templates, generates the offline icon subset, adds the required `@iconify-json/*` dependencies, and wires the `ngx-iconify-stack:generate-icons` script into `prebuild`. See [Delivery modes](#-delivery-modes) below.

> [!TIP]
> **Using Bun?**
> Since `ng add` is not supported in Bun environments, use the manual two-step process:
>
> ```bash
> bun add ngx-iconify-stack
> ng generate ngx-iconify-stack:ng-add
> ```

> [!TIP]
> **Using an Nx monorepo?**
> Since `ng add` doesn't run in Nx workspaces, use the Nx-native two-step process:
>
> ```bash
> nx add ngx-iconify-stack
> nx g ngx-iconify-stack:ng-add --project <app-name>
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

> [!NOTE]
> In a monorepo (Nx or multi-project Angular workspace) always pass `--project <app-name>` — without it, the schematic targets the first application project it finds.

### Dynamic icons (signals & services)

The scanner only captures **static template literals** (`icon="mdi:home"`). Icons resolved at runtime from signals or services are not scanned — they are not false positives and simply load from the CDN by default. To include one in the SSR offline subset, declare it in `src/ngx-iconify/icon-manifest.ts` (`dynamicSubsetIcons`) or run:

```bash
ng g ngx-iconify-stack:add-icon --project <project-name> --icon mdi:home
```

The `add-icon` schematic validates the icon (installing the icon set if needed), appends it to the manifest idempotently, and regenerates the subset.

---

## 🌐 Delivery Modes

`ng add ngx-iconify-stack` asks how icons should be loaded at runtime. You can also pass the flag explicitly:

```bash
ng add ngx-iconify-stack --mode autohost   # default
ng add ngx-iconify-stack --mode cdn
```

| Mode | Subset file | `prebuild` wiring | `@iconify-json/*` deps | Provider in `app.config.ts` |
| --- | --- | --- | --- | --- |
| **`autohost`** (default) | ✅ generates `src/ngx-iconify/icon-subset.ts` | ✅ wires `generate-icons` into `prebuild` | ✅ added + **installed automatically** when missing | `provideIconify({ offlineCollections: iconSubset })` |
| **`cdn`** | ❌ none | ❌ none | ❌ none | `provideIconify()` |

**`autohost`** is SSR-safe offline delivery: templates are scanned, the subset ships only the icons you actually use, and any missing `@iconify-json/*` set is declared and installed on the same run — no manual `npm install` step. Missing sets are also resolved automatically whenever the subset regenerates (e.g. on `prebuild`).

**`cdn`** uses the Iconify CDN only — no subset file and no build wiring. Re-running `ng add --mode cdn` on a project that previously used `autohost` **removes** the prior wiring (subset file, `prebuild` segment, and `generate-icons` script). Switching back to `autohost` regenerates everything.

> [!TIP]
> **Changing modes later?** Just re-run `ng add` with the other `--mode`. Both directions are idempotent — nothing is duplicated on reruns.

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
| `inline`           | `boolean`                              | Align icon to the text baseline (applied on the host element) |
| `mode`             | `"svg" \| "bg" \| "mask" \| "style"`   | Rendering mode for the web component                |
| `forceCdn`         | `boolean`                              | Force CDN resolution and exclude from the generated subset |
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
- **`[forceCdn]="true"`** → skips the subset and resolves from the CDN even for subset icons (useful for icons deliberately kept out of the generated subset). The subset scanner also excludes any icon referenced with `forceCdn`, so regenerating drops it from `icon-subset.ts`.
- Inputs are signals, so switching icons recalculates reactively — works in zoneless apps.

**ngx-iconify-stack is a thin Angular wrapper around [Iconify](https://iconify.design).** It provides:
- Signal-based reactivity for smooth icon switching
- SSR-safe offline subsetting (no runtime CDN dependency for subset icons)
- Zero runtime overhead via Angular's standalone component model

For icon names, transformations, rendering modes, and more — consult the [Iconify documentation](https://iconify.design/docs/).

---

## 🤖 AI Code Assistants Integration

`ng add` can generate a `SKILL.md` standard file for AI coding assistants (Claude, Cursor, Copilot, and others). It encodes the library's usage patterns — setup, `ngx-iconify` component inputs, icon subsetting, and SSR-safe rendering — so your AI agent works with the library correctly without guessing.

The generated skill also ships three **read-only catalog schematics** that prevent icon hallucination:

| Schematic | Command | Purpose |
| --------- | ------- | ------- |
| `list-sets` | `ng g ngx-iconify-stack:list-sets --project <name> [--search <term>] [--category <name>] [--limit <N>]` | Lists real Iconify sets from the catalog (never invent one) |
| `validate-set` | `ng g ngx-iconify-stack:validate-set --project <name> --prefix <prefix>` | Confirms a set exists and prints its metadata + samples |
| `validate-icon` | `ng g ngx-iconify-stack:validate-icon --project <name> --icon <prefix>:<name>` (repeatable) | Validates that an icon reference is well-formed AND actually exists — fails hard on unknown sets/icons |

All three are read-only: they read `node_modules/@iconify/collections` and installed `@iconify-json/*` sets, never write files, never spawn processes, and never hit the network. The `skill` schematic declares `@iconify/collections` as a devDependency so the tools work out of the box. Only `add-icon` auto-installs a missing set.

---

## 🤝 Contributing & Issues

Contributions are welcome! If you find a bug or have a suggestion, feel free to open an issue or submit a pull request:
- Report bugs or request features on [GitHub Issues](https://github.com/WanderleeDev/ngx-iconify-stack/issues).
- For local development guidelines (how to build, test, and run the demo), please refer to the workspace [README](../../README.md).

---

## 📄 License

[MIT](https://github.com/WanderleeDev/ngx-iconify-stack/blob/main/LICENSE)
