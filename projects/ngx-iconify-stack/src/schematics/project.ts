import { posix as path } from 'node:path';

/** Minimal project shape needed for name resolution (Angular workspace). */
export interface ProjectRef {
  extensions: Record<string, unknown>;
}

/** Typed read of `project.extensions['projectType']` (a `Record<string, unknown>`). */
function getProjectType(project: ProjectRef): string | undefined {
  const v = project.extensions['projectType'];
  return typeof v === 'string' ? v : undefined;
}

/**
 * Pure project picker for Angular 20+ workspaces.
 *
 * No `defaultProject` — that field was removed from angular.json in v15 and is
 * irrelevant for the library's Angular 20+ peer range.
 *
 * Order:
 * 1. explicit `--project` / schema option
 * 2. first project with `projectType === 'application'`
 * 3. first project in the workspace (last resort)
 */
export function pickProjectName(
  projects: Iterable<readonly [string, ProjectRef]>,
  explicit?: string,
): string {
  const entries = [...projects];

  if (explicit) {
    if (!entries.some(([name]) => name === explicit)) {
      throw new Error(`Project "${explicit}" not found in angular.json.`);
    }
    return explicit;
  }

  for (const [name, project] of entries) {
    if (getProjectType(project) === 'application') {
      return name;
    }
  }

  if (entries.length === 0) {
    throw new Error('No projects found in angular.json.');
  }

  return entries[0][0];
}

/** Relative bare import path from one tree file to another (no `.ts` suffix). */
export function toRelativeImport(fromFile: string, toFile: string): string {
  const fromDir = path.dirname(fromFile.replace(/^\//, ''));
  const target = toFile.replace(/^\//, '').replace(/\.tsx?$/, '');
  let rel = path.relative(fromDir, target);
  if (!rel.startsWith('.')) {
    rel = `./${rel}`;
  }
  return rel.replace(/\\/g, '/');
}
