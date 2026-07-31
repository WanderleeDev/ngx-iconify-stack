import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { HostTree, Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';

/**
 * PR3 wiring tests: legacy migration, prebuild/prestart re-chaining, missing-set
 * auto-install (no install task), and idempotent reruns. Runs against the
 * COMPILED dist collection (test:schematic builds it first).
 */
const COLLECTION_PATH = fileURLToPath(
  new URL('../../../../dist/ngx-iconify-stack/schematics/collection.json', import.meta.url),
);

const LEGACY_SCRIPTS = {
  prebuild: 'npm run ngx-theme-stack:sync && node scripts/collect-icons.mjs',
  prestart: 'npm run ngx-theme-stack:sync && node scripts/collect-icons.mjs',
};

function createTree(scripts: Record<string, string>, dependencies: Record<string, string> = {}): Tree {
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
    JSON.stringify(
      { name: 'docs-workspace', version: '0.0.0', scripts, dependencies },
      null,
      2,
    ),
  );
  return tree;
}

/** Legacy consumer: collect-icons.mjs script present + prebuild/prestart referencing it. */
function createLegacyTree(): Tree {
  const tree = createTree({ ...LEGACY_SCRIPTS });
  tree.create('/scripts/collect-icons.mjs', '// legacy scanner\n');
  tree.create('/src/app/hero.component.html', '<ngx-iconify icon="mdi:home" />\n');
  return tree;
}

const ICONS_SCRIPT = 'ng generate ngx-iconify-stack:generate-icon-subset --project docs';

describe('generate-icon-subset wiring (dist)', () => {
  it('migrates a legacy consumer: deletes collect-icons.mjs and rewires scripts', async () => {
    const runner = new SchematicTestRunner('ngx-iconify-stack', COLLECTION_PATH);
    const tree = await runner.runSchematic(
      'generate-icon-subset',
      { project: 'docs' },
      createLegacyTree(),
    );

    expect(tree.exists('/scripts/collect-icons.mjs')).toBe(false);

    const pkg = JSON.parse(tree.readContent('/package.json'));
    expect(pkg.scripts.prebuild).toBe('npm run ngx-theme-stack:sync && npm run icons');
    expect(pkg.scripts.prestart).toBe('npm run ngx-theme-stack:sync');
    expect(pkg.scripts.icons).toBe(ICONS_SCRIPT);
    expect(pkg.scripts['collect-icons']).toBeUndefined();
  });

  it('chains icons into prebuild and strips it from prestart, keeping other steps', async () => {
    const runner = new SchematicTestRunner('ngx-iconify-stack', COLLECTION_PATH);
    const tree = await runner.runSchematic(
      'generate-icon-subset',
      { project: 'docs' },
      createTree({
        prebuild: 'npm run ngx-theme-stack:sync',
        prestart: 'npm run icons && npm run dev',
      }),
    );

    const pkg = JSON.parse(tree.readContent('/package.json'));
    expect(pkg.scripts.prebuild).toBe('npm run ngx-theme-stack:sync && npm run icons');
    expect(pkg.scripts.prestart).toBe('npm run dev');
  });

  it('adds a missing @iconify-json/<prefix> dependency and schedules no install task', async () => {
    const runner = new SchematicTestRunner('ngx-iconify-stack', COLLECTION_PATH);
    const tree = createTree({});
    tree.create('/src/app/hero.component.html', '<ngx-iconify icon="foo:home" />\n');
    const result = await runner.runSchematic('generate-icon-subset', { project: 'docs' }, tree);

    const pkg = JSON.parse(result.readContent('/package.json'));
    expect(pkg.dependencies['@iconify-json/foo']).toBe('^1.0.0');
    expect(runner.tasks.filter((t) => t.name === 'node-package')).toHaveLength(0);
  });

  it('does not duplicate an already-listed dependency', async () => {
    const runner = new SchematicTestRunner('ngx-iconify-stack', COLLECTION_PATH);
    const tree = createTree({}, { '@iconify-json/foo': '^1.0.0' });
    tree.create('/src/app/hero.component.html', '<ngx-iconify icon="foo:home" />\n');
    const result = await runner.runSchematic('generate-icon-subset', { project: 'docs' }, tree);

    const pkg = JSON.parse(result.readContent('/package.json'));
    const matches = Object.entries(pkg.dependencies).filter(
      ([name]) => name === '@iconify-json/foo',
    );
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('^1.0.0');
  });

  it('rerun is idempotent: no double-append and byte-identical subset', async () => {
    const runner = new SchematicTestRunner('ngx-iconify-stack', COLLECTION_PATH);
    const tree1 = await runner.runSchematic(
      'generate-icon-subset',
      { project: 'docs' },
      createLegacyTree(),
    );
    const tree2 = await runner.runSchematic('generate-icon-subset', { project: 'docs' }, tree1);

    const pkg2 = JSON.parse(tree2.readContent('/package.json'));
    expect(pkg2.scripts.prebuild).toBe('npm run ngx-theme-stack:sync && npm run icons');
    expect(pkg2.scripts.prestart).toBe('npm run ngx-theme-stack:sync');
    expect(pkg2.scripts['collect-icons']).toBeUndefined();
    expect(tree2.readContent('/src/generated/icon-subset.ts')).toBe(
      tree1.readContent('/src/generated/icon-subset.ts'),
    );
  });
});
