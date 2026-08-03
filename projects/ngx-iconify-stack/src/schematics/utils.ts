// utils/patch-app-config.ts
import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import { addRootProvider } from '@schematics/angular/utility';
import * as ts from 'typescript';
import { pickProjectName, toRelativeImport } from './project';

export { pickProjectName, toRelativeImport } from './project';

/** Package.json script that (re)generates the offline icon subset. */
export const ICONS_SCRIPT = 'ngx-iconify-stack:generate-icons';

/** Package.json script that (re)generates the AI agent skill. */
export const SKILL_SCRIPT = 'ngx-iconify-stack:skill';

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
        if (['npm', 'yarn', 'pnpm', 'bun'].includes(name)) return name;
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
): 'added' | 'updated' | 'unchanged' {
  pkg.scripts ??= {};
  const command = `${runner} generate ngx-iconify-stack:skill --project ${projectName}`;
  const existing = pkg.scripts[SKILL_SCRIPT];
  if (!existing) {
    pkg.scripts[SKILL_SCRIPT] = command;
    return 'added';
  }
  if (existing === command) return 'unchanged';
  pkg.scripts[SKILL_SCRIPT] = command;
  return 'updated';
}

/** Split a `a && b && c` script chain into trimmed segments. */
function splitChain(script: string): string[] {
  return script
    .split('&&')
    .map((seg) => seg.trim())
    .filter(Boolean);
}

/** True for legacy `collect-icons` segments or any package manager's marker. */
function isIconSegment(seg: string): boolean {
  return (
    seg.includes('collect-icons') ||
    ['npm', 'yarn', 'pnpm', 'bun'].some((pm) => seg === `${pm} run ${ICONS_SCRIPT}`)
  );
}

/**
 * Idempotent script wiring (marker-based, so reruns never double-append):
 * adds the `ngx-iconify-stack:generate-icons` script (removing the legacy
 * `icons` entry), creates `prebuild` when missing or chains into it, strips
 * icon segments from `prestart`, and removes the dead legacy `collect-icons`.
 * The `prebuild` wiring uses the detected package manager runner (`${pm} run`)
 * so pnpm/yarn/bun workspaces are not forced through npm. Returns true when
 * the package.json must be rewritten.
 */
export function wireIconifyScripts(
  pkg: { scripts?: Record<string, string> },
  projectName: string,
  packageManager = 'npm',
  runner: 'nx' | 'ng' = 'ng',
): boolean {
  pkg.scripts ??= {};

  let changed = false;

  const expectedIconsScript = `${runner} generate ngx-iconify-stack:generate-icon-subset --project ${projectName}`;
  if (pkg.scripts[ICONS_SCRIPT] !== expectedIconsScript) {
    pkg.scripts[ICONS_SCRIPT] = expectedIconsScript;
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

  const keptPrestart = splitChain(pkg.scripts['prestart'] ?? '').filter(
    (seg) => !isIconSegment(seg),
  );
  if (keptPrestart.length > 0) {
    const next = keptPrestart.join(' && ');
    if (pkg.scripts['prestart'] !== next) {
      pkg.scripts['prestart'] = next;
      changed = true;
    }
  } else if (pkg.scripts['prestart'] !== undefined) {
    delete pkg.scripts['prestart'];
    changed = true;
  }

  if (pkg.scripts['collect-icons'] !== undefined) {
    delete pkg.scripts['collect-icons'];
    changed = true;
  }

  return changed;
}

export async function patchAppConfig(
  tree: Tree,
  context: SchematicContext,
  projectSourceRoot: string,
  provideCall: string, // ej: "provideIconify({ offlineCollections: [] })"
  providerName: string, // ej: "provideIconify"
  moduleName: string, // ej: "ngx-iconify-stack"
  projectName?: string,
  extraImports?: { symbol: string; module: string }[],
): Promise<void> {
  const mainPath = `${projectSourceRoot}/main.ts`.replace(/^\//, '');
  const appConfigPath = `${projectSourceRoot}/app/app.config.ts`.replace(/^\//, '');

  let startFile: string | null = null;
  if (tree.exists(appConfigPath)) startFile = appConfigPath;
  else if (tree.exists(mainPath)) startFile = mainPath;

  if (!startFile) {
    context.logger.warn(
      `⚠ No se encontró app.config.ts ni main.ts. Agregá ${providerName}() manualmente.`,
    );
    return;
  }

  const content = tree.read(startFile)?.toString() || '';
  const alreadyHasProvider = content.includes(providerName);

  // ── Estrategia 1: addRootProvider oficial (solo si NO existe ya) ──
  if (projectName && !alreadyHasProvider) {
    try {
      const rule: Rule = addRootProvider(
        projectName,
        ({ code, external }) =>
          code`${external(providerName, moduleName)}(${provideCall
            .replace(new RegExp(`^${providerName}\\(`), '')
            .replace(/\)$/, '')})`,
      );
      await Promise.resolve((rule as (t: Tree, ctx: SchematicContext) => unknown)(tree, context));

      const updatedContent = tree.read(startFile)?.toString() || '';
      if (updatedContent.includes(providerName)) {
        ensureImports(tree, startFile, providerName, moduleName, extraImports);
        return;
      }
    } catch (e) {
      context.logger.debug(`addRootProvider falló: ${String(e)}`);
    }
  }

  // ── Estrategia 2: AST walker de fallback ──
  if (
    await applySmartPatch(
      tree,
      context,
      startFile,
      provideCall,
      providerName,
      moduleName,
      extraImports,
    )
  ) {
    return;
  }

  context.logger.warn(`⚠ No se pudo inyectar/actualizar el provider en ${startFile}.`);
}

async function applySmartPatch(
  tree: Tree,
  context: SchematicContext,
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
          context,
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

// ── Helpers de AST (idénticos a los tuyos, solo parametrizando el nombre del provider) ──

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
