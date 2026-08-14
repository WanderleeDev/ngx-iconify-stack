import {
  detectPackageManager,
  detectRunner,
  ICONS_SCRIPT,
  LOG_UNCHANGED,
  LOG_UPDATED,
  patchAppConfig,
  providerCallFor,
  resolveProject,
  resolveProjectName,
  wireIconifyScripts,
  wireSkillScripts,
} from '../utils';
import { Rule, chain, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  addPackageJsonDependency,
  NodeDependencyType,
} from '@schematics/angular/utility/dependencies';
import { CATALOG_PACKAGE, CATALOG_VERSION, generateSkill } from '../skill/index';
import { generateIconSubset } from '../generate-icon-subset/index';
import { NgAddOptions } from './schema';

export function ngAdd(options: NgAddOptions): Rule {
  const autohost = options.mode !== 'cdn';
  return chain([
    addIconifyDependency(options),
    ...(autohost
      ? // autohost (default): the subset schematic owns the whole flow —
        // scan, subset file, @iconify-json/* deps, prebuild wiring, and the
        // `provideIconify({ offlineCollections: iconSubset })` provider patch.
        [generateIconSubset({ project: options.project })]
      : // cdn: provider without offlineCollections, no prebuild wiring, and
        // teardown of any previous autohost wiring/subset file.
        [addProvider(options), removeAutohostWiring(options)]),
    installSkill(options),
    (tree: Tree, ctx: SchematicContext) => {
      ctx.addTask(
        new NodePackageInstallTask({ packageManager: detectPackageManager(tree) }),
      );
    },
  ]);
}

function addIconifyDependency(options: NgAddOptions): Rule {
  return (tree: Tree) => {
    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Default,
      name: 'iconify-icon',
      version: '^3.0.2',
      overwrite: false,
    });
    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Dev,
      name: '@iconify/types',
      version: '^2.0.0',
      overwrite: false,
    });
    // The catalog tool's devDependency only makes sense when the skill is
    // installed; in cdn mode without the skill no tool is generated, so the
    // dependency would be dead weight. (The skill step adds it on its own.)
    if (options.installSkill !== false) {
      addPackageJsonDependency(tree, {
        type: NodeDependencyType.Dev,
        name: CATALOG_PACKAGE,
        version: CATALOG_VERSION,
        overwrite: false,
      });
    }
    return tree;
  };
}

function addProvider(options: NgAddOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const { projectName, sourceRoot } = await resolveProject(tree, options);

    await patchAppConfig(
      tree,
      context,
      sourceRoot,
      providerCallFor('cdn'),
      'provideIconify',
      'ngx-iconify-stack',
      projectName,
    );
  };
}

/**
 * cdn mode teardown: delete a previously generated subset file (if any) and
 * reverse the autohost script wiring (`generate-icons` + prebuild segments).
 * Idempotent — a project that never used autohost is left untouched.
 */
function removeAutohostWiring(options: NgAddOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const { projectName, sourceRoot } = await resolveProject(tree, options);

    const subsetPath = `${sourceRoot}/ngx-iconify/icon-subset.ts`.replace(/^\//, '');
    if (tree.exists(subsetPath)) {
      tree.delete(subsetPath);
      context.logger.info(`${LOG_UPDATED} Removed ${subsetPath}`);
    }

    const pkgPath = '/package.json';
    if (!tree.exists(pkgPath)) return tree;

    const pkg = JSON.parse(tree.read(pkgPath)!.toString()) as {
      scripts?: Record<string, string>;
    };

    const changed = wireIconifyScripts(
      pkg,
      projectName,
      detectPackageManager(tree),
      detectRunner(tree),
      { remove: true },
    );
    if (!changed) {
      context.logger.info(
        `${LOG_UNCHANGED} package.json (no ${ICONS_SCRIPT} wiring to remove — skipped)`,
      );
      return tree;
    }
    tree.overwrite(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    context.logger.info(
      `${LOG_UPDATED} package.json (removed ${ICONS_SCRIPT} script + prebuild wiring)`,
    );
    return tree;
  };
}

function installSkill(options: NgAddOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    if (options.installSkill === false) return tree;

    const projectName = await resolveProjectName(tree, options);
    generateSkill(tree, context);

    // Wire the skill regeneration script — one persist, uniform logs.
    if (tree.exists('/package.json')) {
      wireSkillScripts(tree, context.logger, projectName, detectRunner(tree));
    }

    return tree;
  };
}
