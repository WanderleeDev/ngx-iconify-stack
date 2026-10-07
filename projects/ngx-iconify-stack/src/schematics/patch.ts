// patch.ts — provider patch + TS-AST helpers moved verbatim from utils.ts (PR3 Part A; zero behavior change).
import { callRule, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { addRootProvider } from '@schematics/angular/utility';
import { lastValueFrom } from 'rxjs';
import * as ts from 'typescript';
import { resolveConfigFile } from './utils';

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
