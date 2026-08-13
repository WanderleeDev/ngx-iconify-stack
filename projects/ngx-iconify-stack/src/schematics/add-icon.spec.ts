import { HostTree, Tree } from '@angular-devkit/schematics';
import { addIcon } from './add-icon';
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
    '<ngx-iconify icon="mdi:home" />\n',
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

describe('addIcon', () => {
  beforeEach(() => {
    mockedSpawnSync.mockClear();
  });

  it('adds a valid icon to the manifest (idempotent) and regenerates the subset', async () => {
    const workspace = createWorkspace();
    installSet(workspace, 'mdi', {
      home: { body: '<path d="M1 2"/>' },
      user: { body: '<path d="M3 4"/>' },
    });

    const first = await runRule(
      addIcon({ project: 'frontend', icon: 'mdi:user' }),
      workspace,
      stubContext(),
    );

    let manifest = first.read('/src/ngx-iconify/icon-manifest.ts')!.toString();
    expect(manifest).toContain("'mdi:user'");
    expect(manifest).toContain('dynamicSubsetIcons');
    expect(manifest).not.toContain('dynamicSubsetIcons = []');

    let subset = first.read('/src/ngx-iconify/icon-subset.ts')!.toString();
    expect(subset).toContain('"prefix": "mdi"');
    expect(subset).toContain('"user"');
    expect(subset).toContain('"home"');

    // Rerun with repeated options: no duplicates, entries preserved.
    const second = await runRule(
      addIcon({ project: 'frontend', icon: ['mdi:user', 'mdi:home'] }),
      first,
      stubContext(),
    );
    manifest = second.read('/src/ngx-iconify/icon-manifest.ts')!.toString();
    expect(manifest.match(/'mdi:user'/g)).toHaveLength(1);
    expect(manifest.match(/'mdi:home'/g)).toHaveLength(1);
  });

  it('rejects a malformed icon reference', async () => {
    const workspace = createWorkspace();
    await expect(
      runRule(addIcon({ project: 'frontend', icon: 'home' }), workspace, stubContext()),
    ).rejects.toThrow(/expected prefix:name/);
  });

  it('rejects a three-segment provider ref like catppuccin:frappe:home', async () => {
    // `a:b:c` is provider:prefix:name for custom Iconify API providers, NOT an
    // offline-subset reference — the pinned pattern keeps it out of scope.
    const workspace = createWorkspace();
    await expect(
      runRule(
        addIcon({ project: 'frontend', icon: 'catppuccin:frappe:home' }),
        workspace,
        stubContext(),
      ),
    ).rejects.toThrow(/expected prefix:name/);
  });

  it('throws a clear error for an icon that does not exist in the set', async () => {
    const workspace = createWorkspace();
    installSet(workspace, 'mdi', { home: { body: '<path d="M1 2"/>' } });

    await expect(
      runRule(addIcon({ project: 'frontend', icon: 'mdi:ghost' }), workspace, stubContext()),
    ).rejects.toThrow(/not found in set "mdi"/);

    // Nothing was persisted on failure.
    expect(workspace.exists('/src/ngx-iconify/icon-manifest.ts')).toBe(false);
  });

  it('does not duplicate an icon that is already present', async () => {
    const workspace = createWorkspace();
    installSet(workspace, 'mdi', {
      home: { body: '<path d="M1 2"/>' },
      user: { body: '<path d="M3 4"/>' },
    });

    const first = await runRule(
      addIcon({ project: 'frontend', icon: 'mdi:user' }),
      workspace,
      stubContext(),
    );
    const second = await runRule(
      addIcon({ project: 'frontend', icon: 'mdi:user' }),
      first,
      stubContext(),
    );

    const manifest = second.read('/src/ngx-iconify/icon-manifest.ts')!.toString();
    expect(manifest.match(/'mdi:user'/g)).toHaveLength(1);
    expect(manifest).toContain('MANUAL');
  });

  it('declares + directed-installs a missing set, then fails loudly if it stays missing', async () => {
    const workspace = createWorkspace();
    // heroicons is not installed anywhere (tree or workspace node_modules).
    mockedSpawnSync.mockReturnValue({ status: 0 } as never);

    await expect(
      runRule(addIcon({ project: 'frontend', icon: 'heroicons:star' }), workspace, stubContext()),
    ).rejects.toThrow(/set "heroicons" is not installed/);

    const pkg = readJson(workspace, '/package.json');
    expect(pkg.dependencies['@iconify-json/heroicons']).toBe('^1.0.0');
    expect(mockedSpawnSync).toHaveBeenCalledTimes(1);
    const [cmd, args] = mockedSpawnSync.mock.calls[0];
    expect(cmd).toBe('npm');
    expect(args).toEqual(['install', '@iconify-json/heroicons@^1.0.0']);
  });
});
