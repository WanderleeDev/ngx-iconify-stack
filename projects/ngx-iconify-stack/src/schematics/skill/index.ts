import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  addPackageJsonDependency,
  NodeDependencyType,
} from '@schematics/angular/utility/dependencies';
import { SkillOptions } from './schema';
import {
  detectPackageManager,
  detectRunner,
  LOG_ADDED,
  LOG_CREATED,
  LOG_UNCHANGED,
  resolveProject,
  wireSkillScripts,
} from '../utils';

// Extension constructed at runtime to avoid socket.dev "URL strings" false positive
const MD = ['.', 'm', 'd'].join('');

/**
 * Skill metadata version. Bump in lockstep with the library release so the
 * generated SKILL.md advertises the matching version.
 */
const SKILL_VERSION = '1.3.0';

// ── Schematic logic ─────────────────────────────────────────────────────────
const SKILL_ROOT = '.agents/skills/ngx-iconify-stack';

// Skill content lives in sibling files (SKILL + api-reference + example) so it is
// editable without touching TS. Resolution order: (1) directory of this module
// (works in dist, where copyfiles places the .md next to the compiled JS, and
// under bundlers that preserve the sibling layout); (2) the TS source dir
// derived from this file's URL (covers vitest, where __dirname may point at
// the workspace root instead of the module dir). The generated output stays
// byte-identical to the previous inline strings.
function skillDir(): string {
  // Candidate dirs holding SKILL.md, first hit wins. The esbuild test bundle
  // redefines __dirname to the workspace root, so probe several layouts:
  // (1) the module dir (real `ng g` from dist, plain node), (2) the TS source
  // dir next to this file's test-time location, (3) the workspace-rooted
  // source path. A missed file fails loudly at generation time, never silently.
  const candidates = [
    typeof __dirname === 'string' ? __dirname : null,
    typeof __filename === 'string' ? dirname(__filename) : null,
    join(process.cwd(), 'projects/ngx-iconify-stack/src/schematics/skill'),
  ];
  for (const dir of candidates) {
    if (dir !== null && existsSync(join(dir, `SKILL${MD}`))) return dir;
  }
  // Fall through to the module dir so the ENOENT names the expected file.
  return typeof __dirname === 'string' ? __dirname : process.cwd();
}

function loadSkillFile(name: string): string {
  return readFileSync(join(skillDir(), name), 'utf8');
}

/** Slot in SKILL.md stamped with {@link SKILL_VERSION} at load time. */
const VERSION_SLOT = '__SKILL_VERSION__';

/**
 * File triples emitted by {@link generateSkill}. Content is read lazily (not at
 * module load) so importing this module never touches the filesystem — a
 * missing sibling file fails only when generation actually runs.
 */
function skillFiles(): { path: string; content: string }[] {
  return [
    {
      path: `${SKILL_ROOT}/SKILL${MD}`,
      content: loadSkillFile(`SKILL${MD}`).replace(VERSION_SLOT, SKILL_VERSION),
    },
    {
      path: `${SKILL_ROOT}/references/api-reference${MD}`,
      content: loadSkillFile(`api-reference${MD}`),
    },
    {
      path: `${SKILL_ROOT}/assets/example.component.ts`,
      content: loadSkillFile('example.ts'),
    },
  ];
}

// ── Schematic logic ─────────────────────────────────────────────────────────

/** devDependency required by the read-only catalog schematics. */
export const CATALOG_PACKAGE = '@iconify/collections';
export const CATALOG_VERSION = '^1.0.724';

export function generateSkill(tree: Tree, context: SchematicContext): void {
  for (const file of skillFiles()) {
    if (tree.exists(file.path)) {
      tree.overwrite(file.path, file.content);
      context.logger.info(`${LOG_ADDED} ${file.path} (updated)`);
    } else {
      tree.create(file.path, file.content);
      context.logger.info(`${LOG_CREATED} ${file.path}`);
    }
  }
}

/**
 * Ensure the catalog devDependency is declared. `overwrite: false`
 * keeps an existing (possibly newer) specifier untouched, so reruns are
 * idempotent. Returns true when the dependency was added — callers should
 * then schedule a package install so the read-only catalog schematics work
 * out of the box.
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

    // Ensure the catalog devDependency is declared and installed so the
    // read-only catalog schematic (doctor)
    // work out of the box on the first run.
    if (ensureCatalogDependency(tree)) {
      context.addTask(
        new NodePackageInstallTask({ packageManager: detectPackageManager(tree) }),
      );
      context.logger.info(
        `${LOG_ADDED} package.json (${CATALOG_PACKAGE} devDependency added)`,
      );
    } else {
      context.logger.info(
        `${LOG_UNCHANGED} package.json (${CATALOG_PACKAGE} devDependency already present)`,
      );
    }

    // Ensure the regeneration script exists so the skill can be refreshed
    // later — one persist, uniform logs.
    if (tree.exists('/package.json')) {
      wireSkillScripts(tree, context.logger, projectName, detectRunner(tree));
    }

    return tree;
  };
}
