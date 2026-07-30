// utils/patch-app-config.ts
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { addRootProvider } from '@schematics/angular/utility';
import * as ts from 'typescript';

export async function patchAppConfig(
  tree: Tree,
  context: SchematicContext,
  projectSourceRoot: string,
  provideCall: string, // ej: "provideIconify({ offlineCollections: [] })"
  providerName: string, // ej: "provideIconify"
  moduleName: string, // ej: "ngx-iconify-stack"
  projectName?: string,
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
      if (updatedContent.includes(providerName)) return;
    } catch (e) {
      context.logger.debug(`addRootProvider falló: ${String(e)}`);
    }
  }

  // ── Estrategia 2: AST walker de fallback ──
  if (await applySmartPatch(tree, context, startFile, provideCall, providerName, moduleName)) {
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
    ensureImport(tree, filePath, providerName, moduleName);
    return true;
  }

  if (targetIdentifier) {
    const variableDeclaration = findVariableDeclaration(sourceFile, targetIdentifier);
    if (
      variableDeclaration?.initializer &&
      ts.isArrayLiteralExpression(variableDeclaration.initializer)
    ) {
      insertIntoArray(tree, filePath, variableDeclaration.initializer, provideCall);
      ensureImport(tree, filePath, providerName, moduleName);
      return true;
    }
  }

  const arrayLiteral = findProvidersArrayLiteral(sourceFile);
  if (arrayLiteral) {
    insertIntoArray(tree, filePath, arrayLiteral, provideCall);
    ensureImport(tree, filePath, providerName, moduleName);
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
        ensureImport(tree, filePath, providerName, moduleName);
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
