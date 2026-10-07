---
name: ngx-iconify-stack
description: "Trigger: ngx-iconify-stack, ngx-iconify, add iconify icons, icon subset, generate-icon-subset, SSR-safe icons. Signal-based Angular wrapper for Iconify — configure provideIconify, use the <ngx-iconify> component, generate offline icon subsets, handle SSR-safe rendering."
compatibility: Angular 20+ with TypeScript. Optional iconify-icon web component.
metadata:
  author: WanderleeDev
  version: '__SKILL_VERSION__'
---

# ngx-iconify-stack

Signal-based Angular wrapper for [Iconify](https://iconify.design) with SSR-safe offline subsets.

**This is a wrapper, not a reimplementation.** For icon names, transformations, and rendering modes, consult the [Iconify docs](https://iconify.design/docs/iconify-icon/).

## Interaction Rules

- **When adding icons**: ask the user for the icon name in `prefix:name` format (e.g. `mdi:home`) and whether it must work offline (SSR) or CDN-only is fine.
- **Validate before choosing**: when choosing icons, ALWAYS validate against the catalog/set first (`doctor --icon`) — never invent icon names. Use `doctor --list` to discover real sets.
- **Finding icons**: when the user does not know the exact icon name, ASK them which they prefer — offer the [Iconify icon sets catalog](https://icon-sets.iconify.design/) URL so they can browse it themselves, or offer to look it up for them (the agent can fetch that page to find the right set and exact `prefix:name`). Never silently decide on their behalf.
- **SSR/offline**: icons that must render in server HTML need to be in the offline subset — run the subset generation after template changes.
- **CDN-only**: skip `offlineCollections` entirely; the component works without the provider.
- **Delivery mode**: `ng add ngx-iconify-stack` asks for the mode. `autohost` (default) generates the offline subset, adds `@iconify-json/*` dependencies (installing missing sets automatically), and wires `prebuild`. `cdn` uses the Iconify CDN only — no subset file, no prebuild wiring, provider is `provideIconify()`.

## Constraints & Rules

- Provide config **once** in root `app.config.ts` via `provideIconify({ offlineCollections: iconSubset })`.
- Regenerate the subset after adding/removing icons in templates: run `npm run ngx-iconify-stack:generate-icons` (wired into `prebuild`), or `npx ng generate ngx-iconify-stack:generate-icon-subset --project <name>`. Missing `@iconify-json/*` sets are declared and installed automatically on the next run.
- In Nx workspaces run `nx g ngx-iconify-stack:generate-icon-subset --project <name>` instead of `ng generate`.
- Icons in the subset render inline `<svg>` (no `@defer` needed — no hydration gap). Icons outside it render `<iconify-icon>` from the CDN.
- Inputs map to `<iconify-icon>` attributes — see the [attribute docs](https://iconify.design/docs/iconify-icon/#attributes).
- Install the peer dependency `iconify-icon` when the CDN fallback is used.

## Dynamic icons (offline subset)

- The scanner ONLY captures **template literals** — `icon="mdi:home"` or `icon = 'mdi:home'`. Icons resolved at runtime from **signals or services are NOT captured** and are also NOT false positives: they resolve via the Iconify CDN by default without breaking.
- To include a dynamic icon in the SSR offline subset, add it to `dynamicSubsetIcons` in `src/ngx-iconify/icon-manifest.ts`, or run `ng g ngx-iconify-stack:generate-icon-subset --project <name> --icon mdi:home` (the `--icon` option is repeatable) to append it to the manifest and regenerate the subset.
- NEVER make the scanner regex more permissive to catch dynamic icons — keep it pinned to template literals only.

## References and Guides

- **API Reference & Config**: [references/api-reference.md](references/api-reference.md)
- **Iconify icon sets catalog**: [icon-sets.iconify.design](https://icon-sets.iconify.design/) — browse sets and find exact `prefix:name` values

## Tools

Interact with the Iconify catalog and validate icons through the read-only `doctor` schematic (it never writes files and never installs — only `generate-icon-subset` auto-installs missing sets):

- **`doctor --list`** — `ng g ngx-iconify-stack:doctor --list --project <name> [--search <term>] [--category <name>] [--limit <N>]` — list real sets; use BEFORE choosing a set so you never invent one.
- **`doctor --prefix`** — `ng g ngx-iconify-stack:doctor --prefix <prefix> --project <name>` — confirm a set exists + metadata/samples.
- **`doctor --icon`** — `ng g ngx-iconify-stack:doctor --icon <prefix>:<name> --project <name>` (repeatable) — confirm an icon exists; NEVER hallucinate an icon name.

When choosing icons, ALWAYS validate against the catalog/set first (`doctor --icon`) — never invent icon names. Use `doctor --list` to discover real sets.

- Read-only by construction: it reads the catalog from `node_modules/@iconify/collections` and installed sets from `node_modules/@iconify-json/<prefix>` — it never writes files, never spawns processes, no network.
- The `skill` schematic declares `@iconify/collections` as a devDependency and installs it, so the tool works out of the box.
- Use the returned `prefix` to add icons offline: `ng g ngx-iconify-stack:generate-icon-subset --project <name> --icon <prefix>:<name>`.

## Component Example

- **Basic Usage**: [assets/example.component.ts](assets/example.component.ts)

## Anti-patterns

- Do NOT write manual SVG, `innerHTML` with icon strings, or custom icon-fetching logic.
- Do NOT wrap subset icons in `@defer` — they are already SSR-safe inline SVG.
- Do NOT ship full `@iconify-json/*` bundles to the client; always use the generated subset.
- Do NOT call `provideIconify()` in a lazy/feature module — configure it once at the root.
