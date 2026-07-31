import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { HostTree, Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';

/**
 * Compiled collection under test. This is the artifact produced by the
 * build:schematic pipeline: tsc (CJS) + build-schematics.mjs (JSON copies).
 */
const COLLECTION_PATH = fileURLToPath(
  new URL('../../../../dist/ngx-iconify-stack/schematics/collection.json', import.meta.url),
);

/** Minimal virtual workspace: angular.json with a `docs` project + root package.json. */
function createWorkspaceTree(): Tree {
  const tree = new HostTree();
  tree.create(
    '/angular.json',
    JSON.stringify(
      {
        version: 1,
        projects: {
          docs: {
            projectType: 'application',
            root: '',
            sourceRoot: 'src',
            prefix: 'app',
            architect: {},
          },
        },
      },
      null,
      2,
    ),
  );
  tree.create(
    '/package.json',
    JSON.stringify({ name: 'docs-workspace', version: '0.0.0', scripts: {} }, null, 2),
  );
  return tree;
}

describe('compiled schematics collection (dist)', () => {
  it('loads the collection and runs the ng-add factory, adding the iconify-icon dependency', async () => {
    const runner = new SchematicTestRunner('ngx-iconify-stack', COLLECTION_PATH);
    const tree = await runner.runSchematic('ng-add', { project: 'docs' }, createWorkspaceTree());

    const pkg = JSON.parse(tree.readContent('/package.json'));
    expect(pkg.dependencies['iconify-icon']).toBe('^3.0.2');
  });

  it('runs the generate-icon-subset factory, creating the collect-icons script and chaining prebuild', async () => {
    const runner = new SchematicTestRunner('ngx-iconify-stack', COLLECTION_PATH);
    const tree = await runner.runSchematic(
      'generate-icon-subset',
      { project: 'docs' },
      createWorkspaceTree(),
    );

    expect(tree.exists('/scripts/collect-icons.mjs')).toBe(true);
    expect(tree.readContent('/scripts/collect-icons.mjs')).toContain('collect-icons.mjs');

    const pkg = JSON.parse(tree.readContent('/package.json'));
    expect(pkg.scripts.prebuild).toContain('collect-icons');
  });
});
