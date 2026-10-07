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
  - [x] `add-icon --icon` → flag of `generate-icon-subset` (PART A done); `add-icon` dir deleted, now a thin re-export of the shared `ensureManifestIcons` pipeline.
  - [x] `list-sets` + `validate-set` + `validate-icon` → single `doctor` report (PART B done): `doctor --list [--search --category --limit]`, `doctor --prefix <p>`, `doctor --icon <ref...>` (repeatable), combinable flags, one consolidated report, hard-fail only on `--icon`/`--prefix` validation errors. Deleted 3 directories + 3 specs; coverage ported to `doctor.spec.ts` (18 tests).
  - [x] Replaced `spawnSync` install with declared deps + one `NodePackageInstallTask`; missing set → actionable warning + partial subset until install task runs. No `child_process` import remains under `src/`.
  - [x] `scan.ts` `ADD_ICON_SCRIPT` → `LEGACY_ADD_ICON_SCRIPT`: stale `ngx-iconify-stack:add-icon` package.json entries now tidied on every rewire (dead-script cleanup, not wiring).
  - [x] Updated README + SKILL.md/api-reference.md docs to `doctor` + `generate-icon-subset --icon`.
  - **Note for collection.json**: PR4 introduces breaking schematic renames (list-sets/validate-set/validate-icon/add-icon removed, doctor added, generate-icon-subset now accepts --icon). Per plan, this rides a major bump or deprecated aliases — decision deferred to user.

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

## Progress (cont.)

- 2026-10-06 PR2 done: `refactor(lib): unify icon size defaults into ICON_DEFAULTS`.
  - GREEN (worker + parent diff review): `npx ng test ngx-iconify-stack --watch=false` → 13 files, 138 tests, all passed. Zero behavior change, no new tests needed.
  - `ICON_DEFAULTS = { size: 24, display: '16px' }` in `lib/icon.config.ts`; runtime (`ngx-iconify.ts`, `icon-helpers.ts`) imports it. Schematics `icons.ts` keeps the literal (cannot import runtime lib) with a pointer comment to the source of truth. `splitIconRef` hand-copy intentionally left for PR3.

## Progress (cont.)

- 2026-10-06 PR3 done: `refactor(schematics): split utils.ts into scan.ts/patch.ts, externalize skill content to real .md/.ts files`.
  - GREEN (worker + parent): `npx ng test` 13 files / 138 tests; `npx tsc -p tsconfig.schematics.json --noEmit` clean; `npm run build:lib` clean; SKILL.md/API/example byte-identical in dist vs source via `node dist/.../skill/index.js` + `generateSkill` (5625/4692/396 bytes match).
  - `utils.ts` (was 709 lines) is now a 136-line barrel; `scan.ts` (293) holds splitIconRef/wiring; `patch.ts` (308) holds patchAppConfig + TS-AST. Skill content now lives in `skill/SKILL.md`, `skill/api-reference.md`, `skill/example.ts` — edited without touching TS.

- 2026-10-06 PR4 done (PART A + PART B): `feat(schematics)!: consolidate catalog tools into doctor, add --icon flag, replace spawnSync with install task`.
  - GREEN (worker + parent): `npx ng test` 10 files / 134 tests; `npx tsc` clean; `npm run build:lib` clean; dist now has exactly 4 schematics (ng-add, generate-icon-subset, doctor, skill).
  - `generate-icon-subset` accepts repeatable `--icon` refs (absorbs `add-icon`); three read-only catalog tools consolidated into `doctor` (list / prefix / icon); `installMissingSets` spawnSync replaced with declared deps + `NodePackageInstallTask`.
  - 16 old files `git rm`'d: list-sets/{index,schema.json,schema.ts}, validate-set/{...}, validate-icon/{...}, add-icon/{...} + their .spec.ts.
  - `scan.ts` `ADD_ICON_SCRIPT` renamed to `LEGACY_ADD_ICON_SCRIPT` (dead-script cleanup on rewire).

## Next step

- PR4 work-unit commit + close-out on `dev`; then user pushes PRs dev → main.
