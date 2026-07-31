import { getWorkspace } from '@schematics/angular/utility/workspace';
import { patchAppConfig } from '../utils';
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
    installSkill(options),
    (_tree: Tree, ctx: SchematicContext) => {
      ctx.addTask(new NodePackageInstallTask());
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

async function resolveProjectName(tree: Tree, options: NgAddOptions): Promise<string> {
  const workspace = await getWorkspace(tree);
  return options.project ?? [...workspace.projects.keys()][0];
}

function addProvider(options: NgAddOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const projectName = await resolveProjectName(tree, options);
    const workspace = await getWorkspace(tree);
    const project = workspace.projects.get(projectName);
    const sourceRoot = project?.sourceRoot ?? 'src';

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
    pkg.scripts ??= {};

    const skillCmd = `ng generate ngx-iconify-stack:skill --project ${projectName}`;
    const existing = pkg.scripts['ngx-iconify-stack:skill'];
    if (!existing) {
      pkg.scripts['ngx-iconify-stack:skill'] = skillCmd;
      tree.overwrite(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      context.logger.info(
        ' \u001b[33mM\u001b[0m package.json (ngx-iconify-stack:skill script added)',
      );
    } else if (existing === skillCmd) {
      context.logger.info(
        ' \u001b[90mℹ\u001b[0m package.json (ngx-iconify-stack:skill script already correct — skipped)',
      );
    } else {
      context.logger.info(
        ' \u001b[90mℹ\u001b[0m package.json (ngx-iconify-stack:skill script differs — left unchanged)',
      );
    }

    return tree;
  };
}
