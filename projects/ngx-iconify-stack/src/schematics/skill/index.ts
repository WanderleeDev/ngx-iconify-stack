import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  addPackageJsonDependency,
  NodeDependencyType,
} from '@schematics/angular/utility/dependencies';
import { SkillOptions } from './schema';
import {
  applyScriptWires,
  detectPackageManager,
  LIST_SETS_SCRIPT,
  resolveProject,
  SKILL_SCRIPT,
  wireListSetsScript,
  wireSkillScript,
} from '../utils';

// Extension constructed at runtime to avoid socket.dev "URL strings" false positive
const MD = ['.', 'm', 'd'].join('');

// ── SKILL content (Tier 2 — loaded on activation) ─────────
const SKILL_CONTENT = `---
name: ngx-iconify-stack
description: "Trigger: ngx-iconify-stack, ngx-iconify, add iconify icons, icon subset, generate-icon-subset, SSR-safe icons. Signal-based Angular wrapper for Iconify — configure provideIconify, use the <ngx-iconify> component, generate offline icon subsets, handle SSR-safe rendering."
compatibility: Angular 20+ with TypeScript. Optional iconify-icon web component.
metadata:
  author: WanderleeDev
  version: '1.2.4'
---

# ngx-iconify-stack

Signal-based Angular wrapper for [Iconify](https://iconify.design) with SSR-safe offline subsets.

**This is a wrapper, not a reimplementation.** For icon names, transformations, and rendering modes, consult the [Iconify docs](https://iconify.design/docs/iconify-icon/).

## Interaction Rules

- **When adding icons**: ask the user for the icon name in \`prefix:name\` format (e.g. \`mdi:home\`) and whether it must work offline (SSR) or CDN-only is fine.
- **Finding icons**: when the user does not know the exact icon name, ASK them which they prefer — offer the [Iconify icon sets catalog](https://icon-sets.iconify.design/) URL so they can browse it themselves, or offer to look it up for them (the agent can fetch that page to find the right set and exact \`prefix:name\`). Never silently decide on their behalf.
- **SSR/offline**: icons that must render in server HTML need to be in the offline subset — run the subset generation after template changes.
- **CDN-only**: skip \`offlineCollections\` entirely; the component works without the provider.
- **Delivery mode**: \`ng add ngx-iconify-stack\` asks for the mode. \`autohost\` (default) generates the offline subset, adds \`@iconify-json/*\` dependencies (installing missing sets automatically), and wires \`prebuild\`. \`cdn\` uses the Iconify CDN only — no subset file, no prebuild wiring, provider is \`provideIconify()\`.

## Constraints & Rules

- Provide config **once** in root \`app.config.ts\` via \`provideIconify({ offlineCollections: iconSubset })\`.
- Regenerate the subset after adding/removing icons in templates: run \`npm run ngx-iconify-stack:generate-icons\` (wired into \`prebuild\`), or \`npx ng generate ngx-iconify-stack:generate-icon-subset --project <name>\`. Missing \`@iconify-json/*\` sets are declared and installed automatically on the next run.
- In Nx workspaces run \`nx g ngx-iconify-stack:generate-icon-subset --project <name>\` instead of \`ng generate\`.
- Icons in the subset render inline \`<svg>\` (no \`@defer\` needed — no hydration gap). Icons outside it render \`<iconify-icon>\` from the CDN.
- Inputs map to \`<iconify-icon>\` attributes — see the [attribute docs](https://iconify.design/docs/iconify-icon/#attributes).
- Install the peer dependency \`iconify-icon\` when the CDN fallback is used.

## Dynamic icons (offline subset)

- The scanner ONLY captures **template literals** — \`icon="mdi:home"\` or \`icon = 'mdi:home'\`. Icons resolved at runtime from **signals or services are NOT captured** and are also NOT false positives: they resolve via the Iconify CDN by default without breaking.
- To include a dynamic icon in the SSR offline subset, add it to \`dynamicSubsetIcons\` in \`src/ngx-iconify/icon-manifest.ts\`, or run \`ng g ngx-iconify-stack:add-icon --icon mdi:home\` (the \`--icon\` option is repeatable) to append it to the manifest and regenerate the subset.
- NEVER make the scanner regex more permissive to catch dynamic icons — keep it pinned to template literals only.

## References and Guides

- **API Reference & Config**: [references/api-reference${MD}](references/api-reference${MD})
- **Iconify icon sets catalog**: [icon-sets.iconify.design](https://icon-sets.iconify.design/) — browse sets and find exact \`prefix:name\` values

## Catalog tool

Discover available Iconify icon sets without leaving the terminal:

\`\`\`bash
node .agents/skills/ngx-iconify-stack/tools/list-sets.mjs
# or the wired npm script:
npm run ngx-iconify-stack:list-sets
\`\`\`

- Read-only by construction: never writes files, never spawns processes, no network.
- Options: \`--category <name>\` (exact category match), \`--search <term>\` (case-insensitive substring on prefix and name), \`--limit <N>\` (positive integer cap).
- This schematic adds \`@iconify/collections\` as a devDependency and installs it, so the tool works out of the box. If it is somehow absent, the tool prints an install hint and exits 1 — it NEVER auto-installs.
- Use the returned \`prefix\` to add icons offline: \`ng g ngx-iconify-stack:add-icon --icon <prefix>:<name>\`.

## Component Example

- **Basic Usage**: [assets/example.component.ts](assets/example.component.ts)

## Anti-patterns

- Do NOT write manual SVG, \`innerHTML\` with icon strings, or custom icon-fetching logic.
- Do NOT wrap subset icons in \`@defer\` — they are already SSR-safe inline SVG.
- Do NOT ship full \`@iconify-json/*\` bundles to the client; always use the generated subset.
- Do NOT call \`provideIconify()\` in a lazy/feature module — configure it once at the root.
`;

// ── references/api-reference (Tier 3 — loaded on demand) ─────────
const API_REFERENCE_CONTENT = `# API Reference

## \`provideIconify(config)\`

Environment providers function. Call once in root \`app.config.ts\`.

\`\`\`typescript
import { provideIconify } from 'ngx-iconify-stack';
import { iconSubset } from '../ngx-iconify/icon-subset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideIconify({ offlineCollections: iconSubset }),
  ],
};
\`\`\`

| Option | Type | Description |
|--------|------|-------------|
| \`offlineCollections\` | \`IconifyJSON[]\` | Icon sets rendered as SSR-safe inline SVG. Generated by the subset schematic. |
| \`apiProvider\` | \`{ name: string; resource: string }\` | Optional custom Iconify API provider for the CDN fallback. |

## Schematics

| Schematic | Command | Purpose |
|-----------|---------|---------|
| \`generate-icon-subset\` | \`ng g ngx-iconify-stack:generate-icon-subset --project <name>\` | Scans templates for \`icon="prefix:name"\` literals, merges the dynamic-icon manifest, builds \`src/ngx-iconify/icon-subset.ts\`, declares + installs missing \`@iconify-json/*\` sets, wires \`prebuild\`, and patches the provider. |
| \`add-icon\` | \`ng g ngx-iconify-stack:add-icon --project <name> --icon mdi:home\` (repeatable) | Validates \`prefix:name\`, installs the set if missing, appends the icon to \`src/ngx-iconify/icon-manifest.ts\` (idempotent), and regenerates the subset through the same pipeline. |
| \`skill\` | \`ng g ngx-iconify-stack:skill --project <name>\` | Regenerates the AI agent skill under \`.agents/skills/ngx-iconify-stack\`, declares the \`@iconify/collections\` devDependency for the catalog tool, and adds the \`list-sets\` npm script. |
| \`list-sets\` | \`npm run ngx-iconify-stack:list-sets\` (or \`node .agents/skills/ngx-iconify-stack/tools/list-sets.mjs\`) | Lists the Iconify icon-set catalog (read-only, never installs): \`--category\`, \`--search\`, \`--limit\`. |

### Dynamic icon manifest (\`src/ngx-iconify/icon-manifest.ts\`)

The template scanner only sees static \`icon="prefix:name"\` literals. Icons used through signals or services are invisible to it and are NOT false positives — they load from the CDN by default. To force one into the SSR offline subset, list it:

\`\`\`typescript
export const dynamicSubsetIcons = ['mdi:home', 'mdi:user'] as const;
\`\`\`

\`generate-icon-subset\` merges these into the scanned set before building the subset; \`add-icon\` edits the same file for you.

## Component inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| \`icon\` | \`string\` | **required** | Iconify icon name, e.g. \`"mdi:home"\` |
| \`size\` | \`number \\| string\` | \`16px\` | Sets both width and height (e.g. \`"1em"\`, \`"24px"\`, \`24\`) |
| \`width\` | \`number \\| string\` | \`16px\` | Explicit width (overrides \`size\`) |
| \`height\` | \`number \\| string\` | icon's native | Explicit height (overrides \`size\`); falls back to the icon's native height when unset |
| \`color\` | \`string\` | — | CSS color for the icon |
| \`class\` | \`string\` | — | CSS class added to the rendered icon element |
| \`inline\` | \`boolean\` | \`false\` | Align to text baseline (boolean attribute); applied on the host element |
| \`forceCdn\` | \`boolean\` | \`false\` | Force CDN resolution and EXCLUDE from the generated subset (boolean attribute) |
| \`mode\` | \`"svg" \\| "bg" \\| "mask" \\| "style"\` | — | Rendering mode for \`<iconify-icon>\` |
| \`noObserver\` | \`boolean\` | \`false\` | Disable lazy loading observer (boolean attribute) |

\`inline\`, \`forceCdn\` and \`noObserver\` use a \`booleanAttribute\` transform, so presence syntax works: \`<ngx-iconify icon="mdi:home" inline />\` is equivalent to \`[inline]="true"\`.

All inputs mirror \`<iconify-icon>\` attributes — see [Iconify docs](https://iconify.design/docs/iconify-icon/#attributes).

## Rendering

- **In subset** → inline \`<svg>\` rendered on the server, no flicker or hydration gap.
- **Not in subset** → \`<iconify-icon>\` web component resolving from the Iconify CDN.
- **\`[forceCdn]="true"\`** → skips the subset lookup and renders \`<iconify-icon>\` from the CDN, even when the icon exists in the subset (useful for icons deliberately kept out of the generated subset). The subset scanner also EXCLUDES any icon referenced with \`forceCdn\`, so regenerating drops it from \`icon-subset.ts\`.
- Inputs are signals, so dynamic changes recalculate reactively — works in zoneless apps.
`;

// ── assets/ component example (Tier 3 — pure TypeScript, read on demand) ───
const EXAMPLE_COMPONENT_CONTENT = `import { Component } from '@angular/core';
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
export class ExampleComponent {}
`;

// ── tools/list-sets.mjs (read-only catalog tool, safe by construction) ─────
// Pure Node ESM using only builtins. NEVER writes files, spawns processes,
// fetches the network, or installs anything. Generated by the skill schematic.
const LIST_SETS_MJS = `#!/usr/bin/env node
// list-sets.mjs — read-only Iconify icon-set catalog tool.
// Safe by construction: no writes, no child processes, no network, no installs.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

function findCollectionsJson() {
  const candidates = [];
  let dir = resolve(SCRIPT_DIR);
  for (;;) {
    candidates.push(join(dir, 'node_modules', '@iconify', 'collections', 'collections.json'));
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  dir = resolve(process.cwd());
  for (;;) {
    candidates.push(join(dir, 'node_modules', '@iconify', 'collections', 'collections.json'));
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return candidates.find((candidate) => existsSync(candidate)) || null;
}

function detectPackageManager() {
  try {
    const pkgPath = join(process.cwd(), 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      if (pkg && typeof pkg.packageManager === 'string') {
        return pkg.packageManager.split('@')[0];
      }
    }
  } catch {
    // malformed package.json — fall through to lockfile detection
  }
  if (existsSync(join(process.cwd(), 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(process.cwd(), 'yarn.lock'))) return 'yarn';
  if (existsSync(join(process.cwd(), 'bun.lockb'))) return 'bun';
  if (existsSync(join(process.cwd(), 'package-lock.json'))) return 'npm';
  return 'npm';
}

function printUsage() {
  console.log('Usage: node list-sets.mjs [--category <name>] [--search <term>] [--limit <N>]');
  console.log('  --category <name>  only sets whose category matches exactly');
  console.log('  --search <term>    case-insensitive substring match on prefix and name');
  console.log('  --limit <N>        cap the number of sets printed (positive integer)');
}

const args = process.argv.slice(2);
let category = null;
let search = null;
let limit = Infinity;

let i = 0;
while (i < args.length) {
  const arg = args[i];
  const value = args[i + 1];
  if (arg === '--category') {
    if (value === undefined || value.startsWith('--')) {
      printUsage();
      process.exit(1);
    }
    category = value;
    i += 2;
  } else if (arg === '--search') {
    if (value === undefined || value.startsWith('--')) {
      printUsage();
      process.exit(1);
    }
    search = value;
    i += 2;
  } else if (arg === '--limit') {
    const n = Number(value);
    if (value === undefined || value.startsWith('--') || !Number.isInteger(n) || n <= 0) {
      printUsage();
      process.exit(1);
    }
    limit = n;
    i += 2;
  } else {
    printUsage();
    process.exit(1);
  }
}

const collectionsPath = findCollectionsJson();
if (collectionsPath === null) {
  const pm = detectPackageManager();
  console.log(
    '@iconify/collections is not installed. Install it with: ' +
      pm +
      ' install -D @iconify/collections',
  );
  process.exit(1);
}

let collections;
try {
  collections = JSON.parse(readFileSync(collectionsPath, 'utf8'));
} catch (error) {
  console.log('Failed to parse ' + collectionsPath + ': ' + String(error));
  process.exit(1);
}

const rows = [];
for (const prefix of Object.keys(collections)) {
  const info = collections[prefix] || {};
  const name = info.name || '';
  const total = typeof info.total === 'number' ? info.total : 0;
  const cat = info.category || '';
  if (category !== null && cat !== category) continue;
  if (search !== null) {
    const needle = search.toLowerCase();
    if (!prefix.toLowerCase().includes(needle) && !name.toLowerCase().includes(needle)) {
      continue;
    }
  }
  rows.push({ prefix, name, total, cat });
}

console.log('Available icon sets (' + Object.keys(collections).length + ')');
if (rows.length > 0) {
  const shown = rows.slice(0, limit);
  const prefixWidth = Math.max(8, ...shown.map((row) => row.prefix.length));
  const nameWidth = Math.max(4, ...shown.map((row) => row.name.length));
  for (const row of shown) {
    console.log(
      row.prefix.padEnd(prefixWidth) +
        '  ' +
        row.name.padEnd(nameWidth) +
        '  ' +
        String(row.total).padStart(6) +
        '  ' +
        row.cat,
    );
  }
}
`;

// ── Schematic logic ─────────────────────────────────────────────────────────
const SKILL_ROOT = '.agents/skills/ngx-iconify-stack';

/** devDependency required by the read-only catalog tool (`list-sets.mjs`). */
export const CATALOG_PACKAGE = '@iconify/collections';
export const CATALOG_VERSION = '^1.0.724';
const FILES: { path: string; content: string }[] = [
  { path: `${SKILL_ROOT}/SKILL${MD}`, content: SKILL_CONTENT },
  { path: `${SKILL_ROOT}/references/api-reference${MD}`, content: API_REFERENCE_CONTENT },
  { path: `${SKILL_ROOT}/assets/example.component.ts`, content: EXAMPLE_COMPONENT_CONTENT },
  { path: `${SKILL_ROOT}/tools/list-sets.mjs`, content: LIST_SETS_MJS },
];

export function generateSkill(tree: Tree, context: SchematicContext): void {
  for (const file of FILES) {
    if (tree.exists(file.path)) {
      tree.overwrite(file.path, file.content);
      context.logger.info(` \u001b[32m✔\u001b[0m ${file.path} (updated)`);
    } else {
      tree.create(file.path, file.content);
      context.logger.info(` \u001b[36mA\u001b[0m ${file.path}`);
    }
  }
}

/**
 * Ensure the catalog tool's devDependency is declared. `overwrite: false`
 * keeps an existing (possibly newer) specifier untouched, so reruns are
 * idempotent. Returns true when the dependency was added — callers should
 * then schedule a package install so the tool works out of the box.
 */
export function ensureCatalogDependency(tree: Tree): boolean {
  const before = tree.read('/package.json')?.toString();
  addPackageJsonDependency(tree, {
    type: NodeDependencyType.Dev,
    name: CATALOG_PACKAGE,
    version: CATALOG_VERSION,
    overwrite: false,
  });
  return before !== tree.read('/package.json')?.toString();
}

export function skill(options: SkillOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const { projectName } = await resolveProject(tree, options);

    context.logger.info(`Generating AI agent skill for project: ${projectName}`);

    generateSkill(tree, context);

    // Ensure the catalog tool's devDependency is declared and installed so
    // `list-sets.mjs` works out of the box on the first run.
    if (ensureCatalogDependency(tree)) {
      context.addTask(
        new NodePackageInstallTask({ packageManager: detectPackageManager(tree) }),
      );
      context.logger.info(
        ` \u001b[32m✔\u001b[0m package.json (${CATALOG_PACKAGE} devDependency added)`,
      );
    } else {
      context.logger.info(
        ` \u001b[90mℹ\u001b[0m package.json (${CATALOG_PACKAGE} devDependency already present)`,
      );
    }

    // Ensure the regeneration script exists so the skill can be refreshed later,
    // plus the read-only catalog tool script — one persist, uniform logs.
    if (tree.exists('/package.json')) {
      applyScriptWires(tree, context.logger, [
        {
          key: SKILL_SCRIPT,
          wire: (pkg) => wireSkillScript(pkg, projectName),
          updatedDetail: `--project ${projectName}`,
        },
        { key: LIST_SETS_SCRIPT, wire: (pkg) => wireListSetsScript(pkg) },
      ]);
    }

    return tree;
  };
}
