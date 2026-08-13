import { HostTree, Tree } from '@angular-devkit/schematics';
import { generateIconSubset, directedInstallCommand } from './generate-icon-subset';
import { runRule } from './spec-run-rule';

const { spawnSync: mockedSpawnSync } = vi.hoisted(() => ({ spawnSync: vi.fn() }));

vi.mock('node:child_process', () => ({
  default: { spawnSync: mockedSpawnSync },
  spawnSync: mockedSpawnSync,
}));

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
  tree.create(
    '/src/app/app.component.html',
    '<ngx-iconify icon="mdi:home" />\n<ngx-iconify icon="lucide:arrow-right" />\n',
  );
  return tree;
}

function installSet(tree: HostTree, prefix: string, icons: Record<string, { body: string }>) {
  tree.create(
    `/node_modules/@iconify-json/${prefix}/icons.json`,
    JSON.stringify({ prefix, icons }),
  );
}

function readJson(tree: Tree, path: string) {
  return JSON.parse(tree.read(path)!.toString());
}

describe('directedInstallCommand', () => {
  it('maps npm/pnpm to install and yarn/bun to add', () => {
    expect(directedInstallCommand('npm')).toBe('install');
    expect(directedInstallCommand('pnpm')).toBe('install');
    expect(directedInstallCommand('yarn')).toBe('add');
    expect(directedInstallCommand('bun')).toBe('add');
  });
});

describe('generateIconSubset', () => {
  beforeEach(() => {
    mockedSpawnSync.mockClear();
  });
  it('writes a complete subset when all sets are installed, without touching deps', async () => {
    const workspace = createWorkspace();
    installSet(workspace, 'mdi', { home: { body: '<path d="M1 2"/>' } });
    installSet(workspace, 'lucide', { 'arrow-right': { body: '<path d="M3 4"/>' } });

    const tree = await runRule(
      generateIconSubset({ project: 'frontend' }),
      workspace,
      stubContext(),
    );

    const subset = tree.read('/src/ngx-iconify/icon-subset.ts')!.toString();
    expect(subset).toContain('"prefix": "mdi"');
    expect(subset).toContain('"home"');
    expect(subset).toContain('"prefix": "lucide"');
    expect(subset).toContain('"arrow-right"');

    const pkg = readJson(tree, '/package.json');
    expect(pkg.dependencies['@iconify-json/mdi']).toBeUndefined();
    expect(pkg.dependencies['@iconify-json/lucide']).toBeUndefined();

    expect(mockedSpawnSync).not.toHaveBeenCalled();

    const config = tree.read('/src/app/app.config.ts')!.toString();
    expect(config).toContain('provideIconify({ offlineCollections: iconSubset })');
  });

  it('declares and directed-installs missing sets before building the subset', async () => {
    const workspace = createWorkspace();
    // heroicons is NOT present in the real workspace node_modules, so the
    // filesystem fallback in readJsonFile treats it as genuinely missing.
    workspace.overwrite(
      '/src/app/app.component.html',
      '<ngx-iconify icon="mdi:home" />\n<ngx-iconify icon="heroicons:arrow-right" />\n',
    );
    installSet(workspace, 'mdi', { home: { body: '<path d="M1 2"/>' } });
    mockedSpawnSync.mockReturnValue({ status: 0 } as never);

    const tree = await runRule(
      generateIconSubset({ project: 'frontend' }),
      workspace,
      stubContext(),
    );

    const pkg = readJson(tree, '/package.json');
    expect(pkg.dependencies['@iconify-json/mdi']).toBeUndefined();
    expect(pkg.dependencies['@iconify-json/heroicons']).toBe('^1.0.0');

    expect(mockedSpawnSync).toHaveBeenCalledTimes(1);
    const [cmd, args] = mockedSpawnSync.mock.calls[0];
    expect(cmd).toBe('npm');
    expect(args).toEqual(['install', '@iconify-json/heroicons@^1.0.0']);

    // The missing set is skipped (no installed JSON to read in the test tree)
    // but the run does not break.
    const subset = tree.read('/src/ngx-iconify/icon-subset.ts')!.toString();
    expect(subset).toContain('"prefix": "mdi"');
  });

  it('is idempotent: rerun with everything installed neither adds deps nor installs', async () => {
    const workspace = createWorkspace();
    installSet(workspace, 'mdi', { home: { body: '<path d="M1 2"/>' } });
    installSet(workspace, 'lucide', { 'arrow-right': { body: '<path d="M3 4"/>' } });

    await runRule(generateIconSubset({ project: 'frontend' }), workspace, stubContext());
    const tree = await runRule(
      generateIconSubset({ project: 'frontend' }),
      workspace,
      stubContext(),
    );

    const pkg = readJson(tree, '/package.json');
    expect(pkg.dependencies['@iconify-json/mdi']).toBeUndefined();
    expect(pkg.dependencies['@iconify-json/lucide']).toBeUndefined();
    expect(mockedSpawnSync).not.toHaveBeenCalled();
  });

  it('excludes icons referenced with forceCdn from the subset', async () => {
    const workspace = createWorkspace();
    workspace.overwrite(
      '/src/app/app.component.html',
      [
        '<ngx-iconify icon="mdi:home" />',
        '<ngx-iconify icon="mdi:cloud" forceCdn />',
        '<ngx-iconify icon="lucide:star" [forceCdn]="true" />',
      ].join('\n'),
    );
    installSet(workspace, 'mdi', {
      home: { body: '<path d="M1 2"/>' },
      cloud: { body: '<path d="M3 4"/>' },
    });
    installSet(workspace, 'lucide', { star: { body: '<path d="M5 6"/>' } });

    const tree = await runRule(
      generateIconSubset({ project: 'frontend' }),
      workspace,
      stubContext(),
    );

    const subset = tree.read('/src/ngx-iconify/icon-subset.ts')!.toString();
    expect(subset).toContain('"home"');
    expect(subset).not.toContain('"cloud"');
    expect(subset).not.toContain('"star"');
    // The set with all its icons force-CDN'd is not in the subset at all.
    expect(subset).not.toContain('"prefix": "lucide"');
    expect(subset).toContain('"prefix": "mdi"');
  });

  it('still detects forceCdn after a quoted `>` in a binding attribute', async () => {
    const workspace = createWorkspace();
    workspace.overwrite(
      '/src/app/app.component.html',
      '<ngx-iconify icon="mdi:home" [attr.title]="max > min" forceCdn />\n',
    );
    installSet(workspace, 'mdi', { home: { body: '<path d="M1 2"/>' } });

    const tree = await runRule(
      generateIconSubset({ project: 'frontend' }),
      workspace,
      stubContext(),
    );

    // The `>` inside the quoted binding must NOT truncate the tag text before
    // `forceCdn` is seen — otherwise the icon would leak into the subset.
    const subset = tree.read('/src/ngx-iconify/icon-subset.ts')!.toString();
    expect(subset).not.toContain('"home"');
    expect(subset).not.toContain('"prefix": "mdi"');
  });

  it('removes an icon from the subset after forceCdn is added and regenerated', async () => {
    const workspace = createWorkspace();
    installSet(workspace, 'mdi', { home: { body: '<path d="M1 2"/>' } });

    // First run: mdi:home is used without forceCdn → included.
    const first = await runRule(
      generateIconSubset({ project: 'frontend' }),
      workspace,
      stubContext(),
    );
    expect(first.read('/src/ngx-iconify/icon-subset.ts')!.toString()).toContain('"home"');

    // Add forceCdn to the template, regenerate → home is dropped.
    workspace.overwrite(
      '/src/app/app.component.html',
      '<ngx-iconify icon="mdi:home" forceCdn />\n',
    );
    const second = await runRule(
      generateIconSubset({ project: 'frontend' }),
      workspace,
      stubContext(),
    );
    const subset = second.read('/src/ngx-iconify/icon-subset.ts')!.toString();
    expect(subset).not.toContain('"home"');
    expect(subset).not.toContain('"prefix": "mdi"');
  });

  it('merges dynamicSubsetIcons from the manifest into the generated subset', async () => {
    const workspace = createWorkspace();
    // The dynamic icons exist ONLY in the manifest — no template references them.
    workspace.overwrite(
      '/src/app/app.component.html',
      '<ngx-iconify icon="lucide:arrow-right" />\n',
    );
    workspace.create(
      '/src/ngx-iconify/icon-manifest.ts',
      [
        '// src/ngx-iconify/icon-manifest.ts',
        '// 🔧 MANUAL — fuente de verdad.',
        "export const dynamicSubsetIcons = ['mdi:home', 'mdi:user'] as const;",
        '',
      ].join('\n'),
    );
    installSet(workspace, 'mdi', {
      home: { body: '<path d="M1 2"/>' },
      user: { body: '<path d="M3 4"/>' },
    });
    installSet(workspace, 'lucide', { 'arrow-right': { body: '<path d="M5 6"/>' } });

    const tree = await runRule(
      generateIconSubset({ project: 'frontend' }),
      workspace,
      stubContext(),
    );

    const subset = tree.read('/src/ngx-iconify/icon-subset.ts')!.toString();
    expect(subset).toContain('"prefix": "mdi"');
    expect(subset).toContain('"home"');
    expect(subset).toContain('"user"');
    expect(subset).toContain('"prefix": "lucide"');
    expect(subset).toContain('"arrow-right"');
    // Manifest entries never leak into the generated file itself.
    expect(subset).not.toContain('dynamicSubsetIcons');
  });

  it('ignores comments inside the manifest array (bracket and icon-like strings)', async () => {
    const workspace = createWorkspace();
    workspace.overwrite(
      '/src/app/app.component.html',
      '<ngx-iconify icon="lucide:arrow-right" />\n',
    );
    // A `]` and a quoted `prefix:name` inside line/block comments must NOT
    // truncate the lazy array match nor inject false positives.
    workspace.create(
      '/src/ngx-iconify/icon-manifest.ts',
      [
        '// src/ngx-iconify/icon-manifest.ts',
        '// 🔧 MANUAL — fuente de verdad.',
        'export const dynamicSubsetIcons = [',
        "  'mdi:home', // sección del [dashboard]",
        '  /* TODO: cambiar a mdi:alert */',
        "  'mdi:user',",
        "] as const;",
        '',
      ].join('\n'),
    );
    installSet(workspace, 'mdi', {
      home: { body: '<path d="M1 2"/>' },
      user: { body: '<path d="M3 4"/>' },
    });
    installSet(workspace, 'lucide', { 'arrow-right': { body: '<path d="M5 6"/>' } });

    const tree = await runRule(
      generateIconSubset({ project: 'frontend' }),
      workspace,
      stubContext(),
    );

    const subset = tree.read('/src/ngx-iconify/icon-subset.ts')!.toString();
    // Real entries survive the bracket-in-comment truncation.
    expect(subset).toContain('"home"');
    expect(subset).toContain('"user"');
    // Comment-only icon-like strings never leak into the subset.
    expect(subset).not.toContain('"alert"');
  });

  it('keeps a name present only as an alias in the subset (aliases preserved)', async () => {
    const workspace = createWorkspace();
    // `home` exists ONLY as an alias pointing at `house` — getIcons must copy
    // the parent into icons and keep the alias under the requested name.
    workspace.create(
      '/node_modules/@iconify-json/mdi/icons.json',
      JSON.stringify({
        prefix: 'mdi',
        icons: { house: { body: '<path d="M1 2"/>' } },
        aliases: { home: { parent: 'house' } },
      }),
    );

    const tree = await runRule(
      generateIconSubset({ project: 'frontend' }),
      workspace,
      stubContext(),
    );

    const subset = tree.read('/src/ngx-iconify/icon-subset.ts')!.toString();
    expect(subset).toContain('"prefix": "mdi"');
    expect(subset).toContain('"house"');
    expect(subset).toContain('"home"');
    expect(subset).toContain('"parent": "house"');
  });

  it('leaves the subset unchanged when no manifest exists', async () => {
    const workspace = createWorkspace();
    installSet(workspace, 'mdi', { home: { body: '<path d="M1 2"/>' } });
    installSet(workspace, 'lucide', { 'arrow-right': { body: '<path d="M3 4"/>' } });

    const tree = await runRule(
      generateIconSubset({ project: 'frontend' }),
      workspace,
      stubContext(),
    );

    expect(tree.exists('/src/ngx-iconify/icon-manifest.ts')).toBe(false);
    const subset = tree.read('/src/ngx-iconify/icon-subset.ts')!.toString();
    expect(subset).toContain('"prefix": "mdi"');
    expect(subset).toContain('"home"');
    expect(subset).toContain('"prefix": "lucide"');
    expect(subset).toContain('"arrow-right"');
  });
});