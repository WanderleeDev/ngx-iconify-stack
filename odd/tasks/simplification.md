# Simplification Plan — ngx-iconify-stack

## Objective

Reduce plumbing code and close two correctness gaps (XSS via `color`, silent CDN fallback) without changing visible behavior. Deliver in 4 small PRs from `dev` to `main`.

## Why

The lib is well-designed but over-implemented: ~450-line `utils.ts` god-file, 7 schematics for 3 jobs, 3 hand-synced size constants, SKILL.md embedded as a TS string, `spawnSync` inside a schematic, and a `color` input with raw string injection into SVG + `bypassSecurityTrustHtml`.

## Scope

- Runtime (`projects/ngx-iconify-stack/src/lib/`): PR1 + PR2.
- Schematics (`projects/ngx-iconify-stack/src/schematics/`): PR3 + PR4.
- No changes to the inline/CDN dual-render model, no reimplementation of Iconify delegation (`getIcons`/`getIconData`), no behavior change for consumers except: invalid `color` ignored + dev warning, missing-subset warning in dev.

## Constraints

- All existing tests must pass; new tests for new behavior (color whitelist, warnOnMissing).
- PR1–PR3: zero breaking changes. PR4: breaking schematic renames → major or deprecated aliases in `collection.json`.
- Conventional Commits, work-unit commits per task on `dev`.
- Delivery strategy: `single-pr` per PR slice dev→main (each PR ≤400 lines), user creates the actual PRs.

## Tasks

- [ ] **PR1 — Harden runtime inputs** (`fix(lib): validate color + warn on missing subset`)
  - [ ] RED: test invalid `color` (`red" onclick=...`, `javascript:...`) is ignored; test dev warning on subset miss.
  - [ ] Add `SAFE_COLOR` whitelist in `ngx-iconify.ts`; ignore + `console.warn` (dev only) on mismatch.
  - [ ] Add `warnOnMissing` to `NgxIconifyConfig` (default: true); warn when `!forceCdn && lookup miss`.
  - [ ] Tests: `ng test ngx-iconify-stack`. Evidence: vitest output.
- [ ] **PR2 — Unify size constants** (`refactor(lib): single ICON_DEFAULTS source`)
  - [ ] New `ICON_DEFAULTS = { size: 24, display: '16px' }` in `icon.config.ts` (or `config.ts`).
  - [ ] Replace `DEFAULT_ICON_WIDTH` (component), `DEFAULT_ICON_SIZE` (icon-helpers + schematics/icons.ts).
  - [ ] Delete the three "keep in sync by hand" comments. Tests pass unchanged.
- [ ] **PR3 — Split utils.ts + externalize SKILL.md** (`refactor(schematics): split utils, externalize skill content`)
  - [ ] `utils.ts` → `scan.ts` (regex/splitIconRef/manifest), keep `project.ts`, new `patch.ts` (patchAppConfig + AST).
  - [ ] `skill/SKILL.md`, `skill/api-reference.md`, `skill/example.ts` as real files; `skill/index.ts` reads/copies them.
  - [ ] Zero behavior change: full schematic suite green.
- [ ] **PR4 — Merge schematics** (`feat(schematics)!: sync-icons + doctor`)
  - [ ] `add-icon --icon` → flag of `generate-icon-subset` (or renamed `sync-icons`); `list-sets/validate-set/validate-icon` → single `doctor` report.
  - [ ] `collection.json` aliases for old names (deprecated) or major bump.
  - [ ] Replace `spawnSync` install with declared deps + `NodePackageInstallTask`; missing set = actionable error, not partial subset.
  - [ ] Update README + SKILL.md docs.

## Acceptance criteria

- `npm run build:lib` green, `ng test ngx-iconify-stack` green after each PR.
- PR1: malicious `color` strings never reach the SVG body; dev console warns on typo'd icon refs.
- PR2: exactly one size-constant definition; `grep DEFAULT_ICON` hits one file.
- PR3: no file over ~200 lines in schematics root; SKILL.md editable without touching TS.
- PR4: 3 schematics (+ng-add) instead of 7; no `child_process` import in schematics.

## Progress

- 2026-10-06: branch `dev` created from `main` (a68b057). Plan written.
- 2026-10-06 PR1 done: `fix(lib): validate color input and warn on subset miss`.
  - RED (verified by parent): 4 failed on old code — injection tests show raw value inserted (`expected 'red' to be 'currentColor'`), warn tests fail with no call.
  - GREEN (verified by parent): `npx ng test ngx-iconify-stack --watch=false` → 13 files, 138 tests, all passed.
  - `SAFE_COLOR` whitelist (hex/named/rgb/hsl/var); unsafe values skipped + dev warn. `warnOnMissing` (default true) warns on subset miss → CDN fallback; silent when `forceCdn` or `warnOnMissing: false`.

## Next step

- PR2: unify size constants into `ICON_DEFAULTS`.
