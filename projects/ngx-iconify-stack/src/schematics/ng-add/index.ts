import { getWorkspace } from '@schematics/angular/utility/workspace';
import {
  assertAngularProject,
  detectPackageManager,
  patchAppConfig,
  resolveProjectName,
  SKILL_SCRIPT,
  wireIconifyScripts,
  wireSkillScript,
} from '../utils';
import { Rule, chain, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  addPackageJsonDependency,
  NodeDependencyType,
} from '@schematics/angular/utility/dependencies';
import { generateSkill } from '../skill/index';
import { NgAddOptions } from './schema';

export function ngAdd(options: NgAddOptions): Rule {
  return chain([
    addIconifyDependency(),
    addProvider(options),
    wireIconifyScriptsRule(options),
    installSkill(options),
    (tree: Tree, ctx: SchematicContext) => {
      ctx.addTask(
        new NodePackageInstallTask({ packageManager: detectPackageManager(tree) }),
      );
    },
  ]);
}

function addIconifyDependency(): Rule {
  return (tree: Tree) => {
    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Default,
      name: 'iconify-icon',
      version: '^3.0.2',
      overwrite: false,
    });
    return tree;
  };
}

function addProvider(options: NgAddOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const projectName = await resolveProjectName(tree, options);
    const workspace = await getWorkspace(tree);
    const project = workspace.projects.get(projectName);
    const sourceRoot = project?.sourceRoot ?? 'src';

    assertAngularProject(tree, sourceRoot, projectName);

    await patchAppConfig(
      tree,
      context,
      sourceRoot,
      'provideIconify()',
      'provideIconify',
      'ngx-iconify-stack',
      projectName,
    );
  };
}

function wireIconifyScriptsRule(options: NgAddOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const pkgPath = '/package.json';
    if (!tree.exists(pkgPath)) return tree;

    const pkg = JSON.parse(tree.read(pkgPath)!.toString()) as {
      scripts?: Record<string, string>;
    };

    const projectName = await resolveProjectName(tree, options);
    const changed = wireIconifyScripts(pkg, projectName, detectPackageManager(tree));
    if (!changed) {
      context.logger.info(
        ` \u001b[90mℹ\u001b[0m package.json (${'ngx-iconify-stack:generate-icons'} script + prebuild already correct — skipped)`,
      );
      return tree;
    }
    tree.overwrite(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    context.logger.info(
      ` \u001b[33mM\u001b[0m package.json (${'ngx-iconify-stack:generate-icons'} script + prebuild wiring)`,
    );
    return tree;
  };
}

function installSkill(options: NgAddOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    if (options.installSkill === false) return tree;

    const projectName = await resolveProjectName(tree, options);
    generateSkill(tree, context);

    const pkgPath = '/package.json';
    if (!tree.exists(pkgPath)) return tree;

    const pkg = JSON.parse(tree.read(pkgPath)!.toString()) as {
      scripts?: Record<string, string>;
    };
    const result = wireSkillScript(pkg, projectName);
    if (result === 'added') {
      tree.overwrite(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      context.logger.info(
        ` \u001b[33mM\u001b[0m package.json (${SKILL_SCRIPT} script added)`,
      );
    } else if (result === 'updated') {
      tree.overwrite(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      context.logger.info(
        ` \u001b[33mM\u001b[0m package.json (${SKILL_SCRIPT} script updated to --project ${projectName})`,
      );
    } else {
      context.logger.info(
        ` \u001b[90mℹ\u001b[0m package.json (${SKILL_SCRIPT} script already correct — skipped)`,
      );
    }

    return tree;
  };
}
