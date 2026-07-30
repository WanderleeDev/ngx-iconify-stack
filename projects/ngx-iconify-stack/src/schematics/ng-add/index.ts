import { getWorkspace } from '@schematics/angular/utility/workspace';
import { patchAppConfig } from '../utils';
import { Rule, chain, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  addPackageJsonDependency,
  NodeDependencyType,
} from '@schematics/angular/utility/dependencies';

export function ngAdd(options: { project?: string }): Rule {
  return chain([
    addIconifyDependency(),
    addProvider(options),
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

function addProvider(options: { project?: string }): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const workspace = await getWorkspace(tree);
    const projectName = options.project ?? [...workspace.projects.keys()][0];
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
