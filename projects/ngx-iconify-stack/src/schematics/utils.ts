// utils.ts — thin barrel after PR3 Part A split (zero behavior change).
// New homes: scan-related wiring in ./scan, provider patch + AST in ./patch.
// Project resolution stays here; everything moved is re-exported so existing
// import sites and utils.spec.ts keep working unchanged.
import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import { pickProjectName } from './project';
import { PACKAGE_MANAGERS } from './scan';

export { pickProjectName, toRelativeImport } from './project';
export {
  applyScriptWires,
  ICONS_SCRIPT,
  LEGACY_ADD_ICON_SCRIPT,
  LOG_ADDED,
  LOG_CREATED,
  LOG_UNCHANGED,
  LOG_UPDATED,
  PACKAGE_MANAGERS,
  SKILL_SCRIPT,
  splitIconRef,
  wireIconifyScripts,
  wireScript,
  wireSkillScript,
  wireSkillScripts,
} from './scan';
export type { WireResult } from './scan';
export { patchAppConfig, providerCallFor } from './patch';

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
