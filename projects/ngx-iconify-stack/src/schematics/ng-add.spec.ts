import { HostTree, Tree } from '@angular-devkit/schematics';
import { ngAdd } from './ng-add';
import { runRule } from './spec-run-rule';

function stubContext(): import('@angular-devkit/schematics').SchematicContext {
  return {
    logger: {
      info: () => undefined,
      debug: () => undefined,
      warn: () => undefined,
      fatal: () => undefined,
      error: () => undefined,
      log: () => undefined,
    },
    addTask: () => undefined,
    engine: undefined,
    interactive: true,
    strategy: undefined,
  } as unknown as import('@angular-devkit/schematics').SchematicContext;
}

function createWorkspace(): HostTree {
  const tree = new HostTree();
  tree.create(
    '/angular.json',
    JSON.stringify({
      version: 1,
      projects: {
        frontend: {
          projectType: 'application',
          root: '',
          sourceRoot: 'src',
          architect: {
            build: {
              builder: '@angular/build:application',
              options: { main: 'src/main.ts', tsConfig: 'tsconfig.app.json' },
            },
          },
        },
      },
    }),
  );
  tree.create(
    '/package.json',
    JSON.stringify({ name: 'app', version: '0.0.0', scripts: {}, dependencies: {}, devDependencies: {} }),
  );
  tree.create(
    '/src/main.ts',
    "import { bootstrapApplication } from '@angular/platform-browser';\nbootstrapApplication(AppComponent, appConfig);",
  );
  tree.create(
    '/src/app/app.config.ts',
    "import { ApplicationConfig } from '@angular/core';\nexport const appConfig: ApplicationConfig = { providers: [] };\n",
  );
  return tree;
}

function readJson(tree: Tree, path: string) {
  return JSON.parse(tree.read(path)!.toString());
}

describe('ngAdd mode', () => {
  it('autohost (default) wires the subset provider, subset file, and prebuild', async () => {
    const result = await runRule(ngAdd({ project: 'frontend' }), createWorkspace(), stubContext());

    const config = result.read('/src/app/app.config.ts')!.toString();
    expect(config).toContain('provideIconify({ offlineCollections: iconSubset })');
    expect(config).toContain('iconSubset');

    expect(result.exists('/src/ngx-iconify/icon-subset.ts')).toBe(true);

    const pkg = readJson(result, '/package.json');
    expect(pkg.scripts['ngx-iconify-stack:generate-icons']).toBe(
      'ng generate ngx-iconify-stack:generate-icon-subset --project frontend',
    );
    expect(pkg.scripts['prebuild']).toContain('ngx-iconify-stack:generate-icons');

    // The skill is installed by default: catalog devDependency, no standalone
    // list-sets script (the agent uses `ng g ngx-iconify-stack:list-sets`).
    expect(pkg.scripts['ngx-iconify-stack:list-sets']).toBeUndefined();
    expect(pkg.devDependencies['@iconify/collections']).toBeDefined();
  });

  it('cdn mode patches a plain provideIconify() with no subset and no prebuild', async () => {
    const result = await runRule(
      ngAdd({ project: 'frontend', mode: 'cdn' }),
      createWorkspace(),
      stubContext(),
    );

    const config = result.read('/src/app/app.config.ts')!.toString();
    expect(config).toContain('provideIconify()');
    expect(config).not.toContain('offlineCollections');
    expect(config).not.toContain('iconSubset');

    expect(result.exists('/src/ngx-iconify/icon-subset.ts')).toBe(false);

    const pkg = readJson(result, '/package.json');
    expect(pkg.scripts['ngx-iconify-stack:generate-icons']).toBeUndefined();
    expect(pkg.scripts['prebuild']).toBeUndefined();

    // cdn mode still installs the skill (catalog devDependency only).
    expect(pkg.scripts['ngx-iconify-stack:list-sets']).toBeUndefined();
    expect(pkg.devDependencies['@iconify/collections']).toBeDefined();
  });

  it('switching autohost → cdn replaces the provider call and removes the wiring', async () => {
    const first = await runRule(ngAdd({ project: 'frontend' }), createWorkspace(), stubContext());
    expect(first.read('/src/app/app.config.ts')!.toString()).toContain('offlineCollections');

    const switched = await runRule(ngAdd({ project: 'frontend', mode: 'cdn' }), first, stubContext());

    const config = switched.read('/src/app/app.config.ts')!.toString();
    expect(config).toContain('provideIconify()');
    expect(config).not.toContain('offlineCollections');

    expect(switched.exists('/src/ngx-iconify/icon-subset.ts')).toBe(false);

    const pkg = readJson(switched, '/package.json');
    expect(pkg.scripts['ngx-iconify-stack:generate-icons']).toBeUndefined();
    expect(pkg.scripts['prebuild']).toBeUndefined();
  });

  it('cdn mode with installSkill=false adds no catalog devDependency and no list-sets script', async () => {
    const result = await runRule(
      ngAdd({ project: 'frontend', mode: 'cdn', installSkill: false }),
      createWorkspace(),
      stubContext(),
    );

    const pkg = readJson(result, '/package.json');
    expect(pkg.devDependencies['@iconify/collections']).toBeUndefined();
    expect(pkg.scripts['ngx-iconify-stack:list-sets']).toBeUndefined();

    // The runtime and typing deps remain unconditional.
    expect(pkg.dependencies['iconify-icon']).toBeDefined();
    expect(pkg.devDependencies['@iconify/types']).toBeDefined();
  });
});
