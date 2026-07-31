<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/graph.svg?title=ngx-iconify-stack&subtitle=SSR-safe+Iconify+for+Angular&logo=angular&logoColor=fff&mode=dark&theme=zinc&height=180&width=700" />
    <img alt="ngx-iconify-stack" src="https://shieldcn.dev/header/graph.svg?title=ngx-iconify-stack&subtitle=SSR-safe+Iconify+for+Angular&logo=angular&logoColor=dd0031&mode=light&theme=zinc&height=180&width=700" />
  </picture>
</p>

<p align="center">
  <a href="https://github.com/user/ngx-iconify-workspace"><img src="https://shieldcn.dev/github/stars/user/ngx-iconify-workspace?variant=secondary" alt="GitHub stars" /></a>
  <a href="https://angular.dev"><img src="https://shieldcn.dev/badge/Angular-22.0.0-dd0031?variant=secondary&logo=angular&logoColor=dd0031" alt="Angular" /></a>
  <a href="https://tailwindcss.com"><img src="https://shieldcn.dev/badge/Tailwind-v4-38bdf8?variant=secondary&logo=tailwindcss&logoColor=38bdf8" alt="Tailwind CSS" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://shieldcn.dev/badge/TypeScript-6.0-3178c6?variant=secondary&logo=typescript&logoColor=3178c6" alt="TypeScript" /></a>
  <img src="https://shieldcn.dev/badge/license-MIT-3b82f6?variant=secondary" alt="MIT" />
</p>

## Overview

**ngx-iconify-stack** is an Angular monorepo containing two projects:

| Project | Description |
|---------|-------------|
| [`ngx-iconify-stack`](projects/ngx-iconify-stack) | Angular library — hybrid SSR-safe Iconify component |
| [`docs`](projects/docs) | Docs site — Angular 22 SSR app with the library in action |

## The library

A lightweight, signal-based Angular component for [Iconify](https://iconify.design) — 200,000+ icons from 150+ icon sets.

**Hybrid SSR approach:**

- Icons in the offline subset render as **inline SVG** — works in SSR, no flicker, no hydration gap
- Icons not in the subset fall through to the native `<iconify-icon>` web component, which resolves them from the Iconify CDN
- Dynamic input changes recalculate reactively — no forced lifecycle transitions

→ [Full library docs](projects/ngx-iconify-stack/README.md)

## Quick start

```bash
# Install dependencies
npm install

# Build the library
npm run build:lib

# Start the docs site
npm start
```

## Project structure

```
ngx-iconify-workspace/
├── projects/
│   ├── ngx-iconify-stack/        # 📦 The library
│   │   ├── (schematics pipeline: tsc + copyfiles + node -e in package.json)
│   │   └── src/lib/
│   │       ├── ngx-iconify.ts     # The component
│   │       ├── icon-helpers.ts    # SVG lookup from offline subset
│   │       ├── icon.config.ts     # Config injection token
│   │       ├── provide-iconify.ts # Provider & lazy iconify-icon loader
│   │       └── types.ts
│   └── docs/                      # 📖 Docs site (Angular SSR)
│       └── src/app/components/
│           ├── hero-section/
│           ├── demo-section/
│           ├── api-table-section/
│           ├── navbar/
│           └── footer-section/
└── dist/                          # Build output
```

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run build:lib` | Build the library |
| `npm run build:docs` | Build the docs site (production) |
| `npm start` | Start dev server (runs the prestart hook — theme sync only) |
| `npm run prebuild` | Generate theme files + icon subset |
| `npm run icons` | Scan templates & build offline icon subset (via the schematic) |
| `npm test` | Run unit tests |
| `npm run serve:ssr:docs` | Serve the prebuilt SSR docs site |
| `npm run release` | Publish a new version |

## How the icon subset works

```
npm run prebuild
    ├── ngx-theme-stack:sync   → generates theme configuration
    └── icons                  → runs ngx-iconify-stack:generate-icon-subset
                                → scans .html/.ts files for icon="set:name"
                                → builds minimal IconifyJSON subset
                                → writes to projects/docs/src/generated/icon-subset.ts
```

The subset is injected into the app via `provideIconify({ offlineCollections: [...] })`. Icons found at build time render as inline SVG; the rest load from the Iconify CDN automatically.

## Tech stack

| Technology | Version |
|------------|---------|
| Angular | 22 |
| TypeScript | 6.0 |
| Tailwind CSS | 4 |
| Iconify | 3 |
| Express | 5 |
| Vitest | 4 |

## License

MIT
