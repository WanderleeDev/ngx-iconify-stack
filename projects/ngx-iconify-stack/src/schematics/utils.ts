import { callRule, Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import { lastValueFrom } from 'rxjs';
import { addRootProvider } from '@schematics/angular/utility';
import * as ts from 'typescript';
import { pickProjectName, toRelativeImport } from './project';

export { pickProjectName, toRelativeImport } from './project';

/** Package.json script that (re)generates the offline icon subset. */
export const ICONS_SCRIPT = 'ngx-iconify-stack:generate-icons';

/** Package.json script that adds an icon to the subset via the manifest. */
export const ADD_ICON_SCRIPT = 'ngx-iconify-stack:add-icon';

/** Package.json script that (re)generates the AI agent skill. */
export const SKILL_SCRIPT = 'ngx-iconify-stack:skill';

/**
 * Split an Iconify reference into its `prefix` and `name`. Returns null when
 * there is no colon separator (i.e. not a `prefix:name` reference). The single
 * canonical split for the schematics; `lib/icon-helpers.ts` carries a linked
 * copy because the runtime library cannot import schematics code.
 */
export function splitIconRef(ref: string): { prefix: string; name: string } | null {
  const sep = ref.indexOf(':');
  if (sep === -1) return null;
  return { prefix: ref.slice(0, sep), name: ref.slice(sep + 1) };
}

/** Package managers recognized by the workspace probes. */
export const PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm', 'bun'];

/** Outcome of an idempotent package.json script wiring. */
export type WireResult = 'added' | 'updated' | 'unchanged';

/** ANSI-styled log prefixes shared across schematics (single source of truth). */
export const LOG_ADDED = ' \u001b[32m✔\u001b[0m';
export const LOG_UPDATED = ' \u001b[33mM\u001b[0m';
export const LOG_UNCHANGED = ' \u001b[90mℹ\u001b[0m';
export const LOG_CREATED = ' \u001b[36mA\u001b[0m';

/** ANSI-colored log line for each wiring outcome (lookup table, no if-chain). */
const WIRE_LOG: Record<
  WireResult,
  (key: string, updatedDetail?: string) => string
> = {
  added: (key) => `${LOG_ADDED} package.json (${key} script added)`,
  updated: (key, detail) => {
    const suffix = detail ? ` to ${detail}` : '';
    return `${LOG_UPDATED} package.json (${key} script updated${suffix})`;
  },
  unchanged: (key) =>
    `${LOG_UNCHANGED} package.json (${key} script already correct — skipped)`,
};

/**
 * Idempotent wiring of a single npm script: sets `pkg.scripts[key]` to
 * `command` when missing ('added') or different ('updated'), and leaves it
 * untouched when already equal ('unchanged'). The generic that the typed
 * wrappers delegate to.
 */
export function wireScript(
  pkg: { scripts?: Record<string, string> },
  key: string,
  command: string,
): WireResult {
  pkg.scripts ??= {};
  const existing = pkg.scripts[key];
  if (!existing) {
    pkg.scripts[key] = command;
    return 'added';
  }
  if (existing === command) return 'unchanged';
  pkg.scripts[key] = command;
  return 'updated';
}

/**
 * Resolve the target Angular project for a schematic (Angular 20+).
 * See {@link pickProjectName} for selection rules — no legacy `defaultProject`.
 */
export async function resolveProjectName(
  tree: Tree,
  options: { project?: string } = {},
): Promise<string> {
  const workspace = await getWorkspace(tree);
  return pickProjectName(workspace.projects, options.project);
}

/**
 * Resolve the target Angular project plus its source root and guard it against
 * non-Angular targets. Wraps {@link resolveProjectName} with the workspace
 * lookup and the `sourceRoot ?? 'src'` default, then runs
 * {@link assertAngularProject}. Shared by every schematic entry point so the
 * resolution logic cannot diverge.
 */
export async function resolveProject(
  tree: Tree,
  options: { project?: string } = {},
): Promise<{ projectName: string; sourceRoot: string }> {
  const projectName = await resolveProjectName(tree, options);
  const workspace = await getWorkspace(tree);
  const project = workspace.projects.get(projectName);
  const sourceRoot = project?.sourceRoot ?? 'src';
  assertAngularProject(tree, sourceRoot, projectName);
  return { projectName, sourceRoot };
}

/**
 * Detect the workspace package manager (monorepo-aware).
 * Reads the `packageManager` field first, then falls back to lockfiles.
 * Unknown or absent managers default to `npm`.
 */
export function detectPackageManager(tree: Tree): string {
  try {
    const pkgPath = '/package.json';
    if (tree.exists(pkgPath)) {
      const pkg = JSON.parse(tree.read(pkgPath)!.toString()) as {
        packageManager?: string;
      };
      const pmField = pkg.packageManager;
      if (pmField) {
        const name = pmField.split('@')[0];
        if (PACKAGE_MANAGERS.includes(name)) return name;
      }
    }
  } catch {
    // malformed package.json — fall through to lockfile detection
  }
  if (tree.exists('pnpm-lock.yaml')) return 'pnpm';
  if (tree.exists('yarn.lock')) return 'yarn';
  if (tree.exists('bun.lockb')) return 'bun';
  if (tree.exists('package-lock.json')) return 'npm';
  return 'npm';
}

/**
 * True when a `main.ts` content looks like a NestJS bootstrap instead of an
 * Angular entry point. Used to fail loudly instead of patching a Nest app.
 */
export function looksLikeNestMain(mainContent: string | null | undefined): boolean {
  if (!mainContent) return false;
  return /@nestjs\/core|NestFactory\.create/.test(mainContent);
}

/**
 * Guards a schematic against targeting a non-Angular application. When the
 * resolved project's `main.ts` is a NestJS bootstrap, stop with an actionable
 * error instead of wiring the provider/scripts into the wrong app.
 */
export function assertAngularProject(
  tree: Tree,
  sourceRoot: string,
  projectName: string,
): void {
  const mainPath = `${sourceRoot}/main.ts`.replace(/^\//, '');
  if (!looksLikeNestMain(tree.read(mainPath)?.toString())) return;
  throw new SchematicsException(
    `"${projectName}" looks like a NestJS application, not an Angular app. ` +
      `Pass --project <angular-app-name> to target the Angular app.`,
  );
}

/**
 * Resolve the Angular entry file a standalone app bootstraps from: prefer
 * `app/app.config.ts`, else `main.ts`. Returns null when neither exists.
 */
export function resolveConfigFile(tree: Tree, sourceRoot: string): string | null {
  const appConfigPath = `${sourceRoot}/app/app.config.ts`.replace(/^\//, '');
  const mainPath = `${sourceRoot}/main.ts`.replace(/^\//, '');
  if (tree.exists(appConfigPath)) return appConfigPath;
  if (tree.exists(mainPath)) return mainPath;
  return null;
}

/**
 * Detect the workspace schematic runner: `nx` in Nx workspaces (nx.json
 * present), `ng` everywhere else. Injected scripts must call the runner that
 * actually exists in the workspace — Nx monorepos often don't install the
 * Angular CLI binary (`ng`), while plain/Turborepo workspaces rely on it.
 */
export function detectRunner(tree: Tree): 'nx' | 'ng' {
  return tree.exists('nx.json') ? 'nx' : 'ng';
}

/**
 * Idempotent script wiring for the skill generator: adds or rewrites the
 * `ngx-iconify-stack:skill` script so it always targets the current project.
 * Returns 'added' | 'updated' | 'unchanged' so callers can log the right
 * message without duplicating the comparison logic.
 */
export function wireSkillScript(
  pkg: { scripts?: Record<string, string> },
  projectName: string,
  runner: 'nx' | 'ng' = 'ng',
): WireResult {
  return wireScript(
    pkg,
    SKILL_SCRIPT,
    `${runner} generate ngx-iconify-stack:skill --project ${projectName}`,
  );
}

/**
 * Apply a batch of idempotent script wirings to `/package.json` and persist
 * the file at most once. Each wire mutates `pkg.scripts` and returns its
 * outcome; the caller supplies the wire closures (which also carry the
 * command detail used in the 'updated' log, e.g. `--project <name>`).
 * Any changed wiring triggers a single rewrite; the file is never written
 * when nothing changed.
 */
export function applyScriptWires(
  tree: Tree,
  logger: { info: (message: string) => void },
  wires: {
    key: string;
    wire: (pkg: { scripts?: Record<string, string> }) => WireResult;
    updatedDetail?: string;
  }[],
  pkgPath = '/package.json',
): void {
  const pkg = JSON.parse(tree.read(pkgPath)!.toString()) as {
    scripts?: Record<string, string>;
  };

  const results = wires.map(({ key, wire, updatedDetail }) => ({
    key,
    result: wire(pkg),
    updatedDetail,
  }));

  if (results.some((r) => r.result !== 'unchanged')) {
    tree.overwrite(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  for (const { key, result, updatedDetail } of results) {
    logger.info(WIRE_LOG[result](key, updatedDetail));
  }
}

/**
 * Wire the skill regeneration script in a single persist with uniform logs.
 * Shared by ng-add and the skill schematic so the two entry points cannot
 * diverge.
 */
export function wireSkillScripts(
  tree: Tree,
  logger: { info: (message: string) => void },
  projectName: string,
  runner: 'nx' | 'ng' = 'ng',
): void {
  applyScriptWires(tree, logger, [
    {
      key: SKILL_SCRIPT,
      wire: (pkg) => wireSkillScript(pkg, projectName, runner),
      updatedDetail: `--project ${projectName}`,
    },
  ]);
}

/** Split a `a && b && c` script chain into trimmed segments. */
function splitChain(script: string): string[] {
  return script
    .split('&&')
    .map((seg) => seg.trim())
    .filter(Boolean);
}

/**
 * Strip icon segments from `pkg.scripts[key]` using the split → filter →
 * join-or-delete algorithm shared by the prestart cleanup in
 * {@link wireIconifyScripts} and the per-key loop in
 * {@link removeIconifyScripts}. Deletes the script when it would become
 * empty. Returns true when the script value changed or was removed.
 */
function stripScriptSegments(
  pkg: { scripts?: Record<string, string> },
  key: string,
  isIconSegment: (seg: string) => boolean,
): boolean {
  pkg.scripts ??= {};
  const kept = splitChain(pkg.scripts[key] ?? '').filter((seg) => !isIconSegment(seg));
  if (kept.length > 0) {
    const next = kept.join(' && ');
    if (pkg.scripts[key] !== next) {
      pkg.scripts[key] = next;
      return true;
    }
  } else if (pkg.scripts[key] !== undefined) {
    delete pkg.scripts[key];
    return true;
  }
  return false;
}

/** True for legacy `collect-icons` segments or any package manager's marker. */
function isIconSegment(seg: string): boolean {
  return (
    seg.includes('collect-icons') ||
    PACKAGE_MANAGERS.some((pm) => seg === `${pm} run ${ICONS_SCRIPT}`)
  );
}

/**
 * Idempotent script wiring (marker-based, so reruns never double-append):
 * adds the `ngx-iconify-stack:generate-icons` script (removing the legacy
 * `icons` entry) and the `ngx-iconify-stack:add-icon` script, creates
 * `prebuild` when missing or chains into it, strips icon segments from
 * `prestart`, and removes the dead legacy `collect-icons`. The `prebuild`
 * wiring uses the detected package manager runner (`${pm} run`) so
 * pnpm/yarn/bun workspaces are not forced through npm. Returns true when the
 * package.json must be rewritten.
 *
 * When `opts.remove` is true the wiring is reversed: the
 * `ngx-iconify-stack:generate-icons` and `ngx-iconify-stack:add-icon` scripts
 * are deleted, icon segments are stripped from `prebuild`/`prestart`
 * (deleting the script when it becomes empty), and the legacy `collect-icons`
 * entry is dropped. Used by `ng-add` in `cdn` mode to tear down autohost
 * wiring. Returns true when anything changed, false when already clean
 * (idempotent).
 */
export function wireIconifyScripts(
  pkg: { scripts?: Record<string, string> },
  projectName: string,
  packageManager = 'npm',
  runner: 'nx' | 'ng' = 'ng',
  opts?: { remove?: boolean },
): boolean {
  pkg.scripts ??= {};

  if (opts?.remove) {
    return removeIconifyScripts(pkg);
  }

  let changed = false;

  const expectedIconsScript = `${runner} generate ngx-iconify-stack:generate-icon-subset --project ${projectName}`;
  if (pkg.scripts[ICONS_SCRIPT] !== expectedIconsScript) {
    pkg.scripts[ICONS_SCRIPT] = expectedIconsScript;
    changed = true;
  }

  const expectedAddIconScript = `${runner} generate ngx-iconify-stack:add-icon --project ${projectName}`;
  if (pkg.scripts[ADD_ICON_SCRIPT] !== expectedAddIconScript) {
    pkg.scripts[ADD_ICON_SCRIPT] = expectedAddIconScript;
    changed = true;
  }

  const run = `${packageManager} run ${ICONS_SCRIPT}`;
  const prebuildSegs = splitChain(pkg.scripts['prebuild'] ?? '');
  if (prebuildSegs.some(isIconSegment)) {
    const next = prebuildSegs.map((seg) => (isIconSegment(seg) ? run : seg)).join(' && ');
    if (pkg.scripts['prebuild'] !== next) {
      pkg.scripts['prebuild'] = next;
      changed = true;
    }
  } else if (prebuildSegs.length > 0) {
    pkg.scripts['prebuild'] = `${prebuildSegs.join(' && ')} && ${run}`;
    changed = true;
  } else if ((pkg.scripts['prebuild'] ?? '') !== run) {
    pkg.scripts['prebuild'] = run;
    changed = true;
  }

  if (stripScriptSegments(pkg, 'prestart', isIconSegment)) changed = true;

  if (pkg.scripts['collect-icons'] !== undefined) {
    delete pkg.scripts['collect-icons'];
    changed = true;
  }

  return changed;
}

/**
 * Tear down the autohost wiring added by {@link wireIconifyScripts} (the
 * non-remove path). Deletes the generate-icons and add-icon scripts, strips
 * icon segments from `prebuild`/`prestart` (removing the script when it
 * empties out), and drops the legacy `collect-icons` entry. Idempotent:
 * returns true when anything changed, false when the scripts are already clean.
 */
function removeIconifyScripts(pkg: { scripts?: Record<string, string> }): boolean {
  pkg.scripts ??= {};
  let changed = false;

  if (pkg.scripts[ICONS_SCRIPT] !== undefined) {
    delete pkg.scripts[ICONS_SCRIPT];
    changed = true;
  }

  if (pkg.scripts[ADD_ICON_SCRIPT] !== undefined) {
    delete pkg.scripts[ADD_ICON_SCRIPT];
    changed = true;
  }

  for (const key of ['prebuild', 'prestart']) {
    if (stripScriptSegments(pkg, key, isIconSegment)) changed = true;
  }

  if (pkg.scripts['collect-icons'] !== undefined) {
    delete pkg.scripts['collect-icons'];
    changed = true;
  }

  return changed;
}

/**
 * Build the `provideIconify(...)` call string fed to `patchAppConfig`.
 * Single source of truth for the provider patch so ng-add (cdn) and
 * generate-icon-subset (autohost) cannot drift apart.
 * - `cdn`: bare `provideIconify()` — CDN-only, no offline subset.
 * - `autohost` with `subsetImport`: `provideIconify({ offlineCollections: <ref> })`.
 */
export function providerCallFor(
  mode: 'cdn' | 'autohost',
  subsetImport?: string,
): string {
  if (mode === 'cdn') return 'provideIconify()';
  return subsetImport
    ? `provideIconify({ offlineCollections: ${subsetImport} })`
    : 'provideIconify()';
}

export async function patchAppConfig(
  tree: Tree,
  context: SchematicContext,
  projectSourceRoot: string,
  provideCall: string, // e.g. "provideIconify({ offlineCollections: [] })"
  providerName: string, // e.g. "provideIconify"
  moduleName: string, // e.g. "ngx-iconify-stack"
  projectName?: string,
  extraImports?: { symbol: string; module: string }[],
): Promise<void> {
  const startFile = resolveConfigFile(tree, projectSourceRoot);

  if (!startFile) {
    context.logger.warn(
      `Could not find app.config.ts or main.ts — add ${providerName}() manually.`,
    );
    return;
  }

  const content = tree.read(startFile)?.toString() || '';
  const alreadyHasProvider = content.includes(providerName);

  // ── Strategy 1: official addRootProvider (only when not present) ──
  if (projectName && !alreadyHasProvider) {
    try {
      const rule: Rule = addRootProvider(
        projectName,
        ({ code, external }) =>
          code`${external(providerName, moduleName)}(${provideCall
            .replace(new RegExp(`^${providerName}\\(`), '')
            .replace(/\)$/, '')})`,
      );
      await lastValueFrom(callRule(rule, tree, context));

      const updatedContent = tree.read(startFile)?.toString() || '';
      if (updatedContent.includes(providerName)) {
        ensureImports(tree, startFile, providerName, moduleName, extraImports);
        return;
      }
    } catch (e) {
      context.logger.warn(
        `addRootProvider failed (${String(e)}) — falling back to the AST-based patch.`,
      );
    }
  }

  // ── Strategy 2: AST walker fallback ──
  if (
    await applySmartPatch(
      tree,
      startFile,
      provideCall,
      providerName,
      moduleName,
      extraImports,
    )
  ) {
    return;
  }

  context.logger.warn(`Could not inject/update the provider in ${startFile}.`);
}

async function applySmartPatch(
  tree: Tree,
  filePath: string,
  provideCall: string,
  providerName: string,
  moduleName: string,
  extraImports?: { symbol: string; module: string }[],
  targetIdentifier?: string,
  visitedFiles = new Set<string>(),
): Promise<boolean> {
  if (visitedFiles.has(filePath)) return false;
  visitedFiles.add(filePath);

  const buffer = tree.read(filePath);
  if (!buffer) return false;

  const content = buffer.toString();
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  const existingCall = findProviderCall(sourceFile, providerName);
  if (existingCall) {
    const updated =
      content.slice(0, existingCall.getStart()) +
      provideCall +
      content.slice(existingCall.getEnd());
    tree.overwrite(filePath, updated);
    ensureImports(tree, filePath, providerName, moduleName, extraImports);
    return true;
  }

  if (targetIdentifier) {
    const variableDeclaration = findVariableDeclaration(sourceFile, targetIdentifier);
    if (
      variableDeclaration?.initializer &&
      ts.isArrayLiteralExpression(variableDeclaration.initializer)
    ) {
      insertIntoArray(tree, filePath, variableDeclaration.initializer, provideCall);
      ensureImports(tree, filePath, providerName, moduleName, extraImports);
      return true;
    }
  }

  const arrayLiteral = findProvidersArrayLiteral(sourceFile);
  if (arrayLiteral) {
    insertIntoArray(tree, filePath, arrayLiteral, provideCall);
    ensureImports(tree, filePath, providerName, moduleName, extraImports);
    return true;
  }

  const delegatedIdentifier = findProvidersIdentifier(sourceFile);
  if (delegatedIdentifier) {
    const importPath = findImportPathForIdentifier(sourceFile, delegatedIdentifier);
    if (importPath) {
      const dir = filePath.substring(0, filePath.lastIndexOf('/'));
      let resolvedPath = `${dir}/${importPath}.ts`
        .replace(/\/\/+/g, '/')
        .replace(/\.ts\.ts$/, '.ts');
      if (!tree.exists(resolvedPath)) {
        resolvedPath = `${dir}/${importPath}/index.ts`.replace(/\/\/+/g, '/');
      }
      if (tree.exists(resolvedPath)) {
        return applySmartPatch(
          tree,
          resolvedPath,
          provideCall,
          providerName,
          moduleName,
          extraImports,
          delegatedIdentifier,
          visitedFiles,
        );
      }
    } else {
      const variableDeclaration = findVariableDeclaration(sourceFile, delegatedIdentifier);
      if (
        variableDeclaration?.initializer &&
        ts.isArrayLiteralExpression(variableDeclaration.initializer)
      ) {
        insertIntoArray(tree, filePath, variableDeclaration.initializer, provideCall);
        ensureImports(tree, filePath, providerName, moduleName, extraImports);
        return true;
      }
    }
  }

  return false;
}

// ── AST helpers (provider name parametrized) ──

function walkFirst<T>(root: ts.Node, match: (n: ts.Node) => T | null): T | null {
  let result: T | null = null;
  function visit(n: ts.Node): void {
    if (result !== null) return;
    result = match(n);
    if (result === null) ts.forEachChild(n, visit);
  }
  visit(root);
  return result;
}

function findProviderCall(node: ts.Node, providerName: string): ts.CallExpression | null {
  return walkFirst(node, (n) =>
    ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === providerName
      ? n
      : null,
  );
}

function findProvidersArrayLiteral(node: ts.Node): ts.ArrayLiteralExpression | null {
  return walkFirst(node, (n) =>
    ts.isPropertyAssignment(n) &&
    ts.isIdentifier(n.name) &&
    n.name.text === 'providers' &&
    ts.isArrayLiteralExpression(n.initializer)
      ? n.initializer
      : null,
  );
}

function findProvidersIdentifier(node: ts.Node): string | null {
  return walkFirst(node, (n) =>
    ts.isPropertyAssignment(n) &&
    ts.isIdentifier(n.name) &&
    n.name.text === 'providers' &&
    ts.isIdentifier(n.initializer)
      ? n.initializer.text
      : null,
  );
}

function findImportPathForIdentifier(sourceFile: ts.SourceFile, identifier: string): string | null {
  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      if (statement.importClause.namedBindings.elements.some((e) => e.name.text === identifier)) {
        return (statement.moduleSpecifier as ts.StringLiteral).text;
      }
    }
  }
  return null;
}

function findVariableDeclaration(
  sourceFile: ts.SourceFile,
  identifier: string,
): ts.VariableDeclaration | null {
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === identifier) return decl;
      }
    }
  }
  return null;
}

function insertIntoArray(
  tree: Tree,
  filePath: string,
  array: ts.ArrayLiteralExpression,
  text: string,
) {
  const content = tree.read(filePath)!.toString();
  const insertionPos =
    array.elements.length > 0
      ? array.elements[array.elements.length - 1].getEnd()
      : array.getStart() + 1;
  const prefix = array.elements.length > 0 ? ', ' : '';
  tree.overwrite(
    filePath,
    content.slice(0, insertionPos) + prefix + text + content.slice(insertionPos),
  );
}

/** Ensure the provider import plus any extra imports (e.g. the generated subset). */
function ensureImports(
  tree: Tree,
  filePath: string,
  providerName: string,
  moduleName: string,
  extraImports?: { symbol: string; module: string }[],
) {
  ensureImport(tree, filePath, providerName, moduleName);
  for (const { symbol, module } of extraImports ?? []) {
    ensureImport(tree, filePath, symbol, module);
  }
}

function ensureImport(tree: Tree, filePath: string, symbol: string, module: string) {
  const content = tree.read(filePath)!.toString();
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  const importFound = sourceFile.statements.some(
    (s) =>
      ts.isImportDeclaration(s) &&
      ts.isStringLiteral(s.moduleSpecifier) &&
      s.moduleSpecifier.text === module &&
      s.importClause?.namedBindings &&
      ts.isNamedImports(s.importClause.namedBindings) &&
      s.importClause.namedBindings.elements.some((e) => e.name.text === symbol),
  );
  if (importFound) return;

  const moduleImportRegex = new RegExp(`import\\s*{([^}]*)}\\s*from\\s*['"]${module}['"]`);
  const match = moduleImportRegex.exec(content);

  if (match) {
    const existingSymbols = match[1].trim();
    const updatedSymbols = existingSymbols ? `${existingSymbols}, ${symbol}` : symbol;
    tree.overwrite(
      filePath,
      content.replace(match[0], `import { ${updatedSymbols} } from '${module}'`),
    );
  } else {
    tree.overwrite(filePath, `import { ${symbol} } from '${module}';\n` + content);
  }
}
