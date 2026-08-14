import { HostTree, Tree } from '@angular-devkit/schematics';
import { validateIcon } from './validate-icon';
import { runRule } from './spec-run-rule';

interface LoggedMessage {
  type: 'info' | 'warn' | 'error';
  text: string;
}

function collectingContext(): {
  context: import('@angular-devkit/schematics').SchematicContext;
  messages: LoggedMessage[];
} {
  const messages: LoggedMessage[] = [];
  const context = {
    logger: {
      info: (m: string) => messages.push({ type: 'info', text: m }),
      warn: (m: string) => messages.push({ type: 'warn', text: m }),
      error: (m: string) => messages.push({ type: 'error', text: m }),
      debug: () => undefined,
      fatal: () => undefined,
      log: () => undefined,
    },
    addTask: () => undefined,
    engine: undefined,
    interactive: true,
    strategy: undefined,
  } as unknown as import('@angular-devkit/schematics').SchematicContext;
  return { context, messages };
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
  return tree;
}

function installCatalog(tree: HostTree, sets: Record<string, Record<string, unknown>>): void {
  tree.create('/node_modules/@iconify/collections/collections.json', JSON.stringify(sets));
}

function installSet(tree: HostTree, prefix: string, icons: Record<string, { body: string }>) {
  tree.create(
    `/node_modules/@iconify-json/${prefix}/icons.json`,
    JSON.stringify({ prefix, icons }),
  );
}

function listPaths(tree: Tree): string[] {
  const paths: string[] = [];
  tree.visit((path) => paths.push(path));
  return paths.sort();
}

function messagesOf(messages: LoggedMessage[], type: LoggedMessage['type']): string[] {
  return messages.filter((m) => m.type === type).map((m) => m.text);
}

describe('validateIcon', () => {
  it('passes a well-formed icon that exists in an installed set (read-only)', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, {
      mdi: { name: 'Material Design Icons', total: 7447 },
    });
    installSet(workspace, 'mdi', { home: { body: '<path d="M1 2"/>' } });

    const before = listPaths(workspace);
    const { context, messages } = collectingContext();
    const tree = await runRule(
      validateIcon({ project: 'frontend', icon: 'mdi:home' }),
      workspace,
      context,
    );

    expect(messagesOf(messages, 'info')).toContain(
      '✓ mdi:home is valid and exists in @iconify-json/mdi',
    );
    expect(messagesOf(messages, 'info')).toContain('1/1 icons valid');
    expect(messagesOf(messages, 'error')).toHaveLength(0);
    // READ-ONLY: the schematic must never mutate the tree.
    expect(listPaths(tree)).toEqual(before);
  });

  it('fails an invalid-format reference with the specific reason', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, { mdi: { name: 'Material Design Icons' } });
    installSet(workspace, 'mdi', { home: { body: '<path d="M1 2"/>' } });

    const { context, messages } = collectingContext();
    await expect(
      runRule(validateIcon({ project: 'frontend', icon: 'MDI:Home' }), workspace, context),
    ).rejects.toThrow(/Icon validation failed/);

    expect(messagesOf(messages, 'error')[0]).toContain('invalid format');
    expect(messagesOf(messages, 'error')[0]).toContain('lowercase');
    expect(messagesOf(messages, 'info')).toContain('0/1 icons valid');
  });

  it('fails a prefix that does not exist in the catalog and suggests list-sets', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, { mdi: { name: 'Material Design Icons' } });

    const { context, messages } = collectingContext();
    await expect(
      runRule(validateIcon({ project: 'frontend', icon: 'foo:bar' }), workspace, context),
    ).rejects.toThrow(/Icon validation failed/);

    const errors = messagesOf(messages, 'error');
    expect(errors[0]).toContain('Set "foo" does not exist in the Iconify catalog');
    expect(errors[0]).toContain('list-sets --search foo');
  });

  it('warns (without failing) when the set is known but not installed', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, {
      heroicons: { name: 'Heroicons', total: 305 },
    });

    const { context, messages } = collectingContext();
    const tree = await runRule(
      validateIcon({ project: 'frontend', icon: 'heroicons:star' }),
      workspace,
      context,
    );

    const warnings = messagesOf(messages, 'warn');
    expect(warnings[0]).toContain('Set "heroicons" is known but not installed');
    expect(warnings[0]).toContain('install @iconify-json/heroicons');
    expect(warnings[0]).toContain('icon existence NOT verified');
    expect(messagesOf(messages, 'info')).toContain('1/1 icons valid');
    expect(messagesOf(messages, 'error')).toHaveLength(0);
    expect(listPaths(tree)).toEqual(listPaths(workspace));
  });

  it('fails an unknown icon in an installed set and suggests the closest matches', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, { mdi: { name: 'Material Design Icons' } });
    installSet(workspace, 'mdi', {
      house: { body: '<path d="M1 2"/>' },
      home: { body: '<path d="M3 4"/>' },
      hotel: { body: '<path d="M5 6"/>' },
    });

    const { context, messages } = collectingContext();
    await expect(
      runRule(validateIcon({ project: 'frontend', icon: 'mdi:hose' }), workspace, context),
    ).rejects.toThrow(/Icon validation failed/);

    const errors = messagesOf(messages, 'error');
    expect(errors[0]).toContain(
      'Icon "mdi:hose" does not exist in installed set "@iconify-json/mdi"',
    );
    expect(errors[0]).toContain('Did you mean "mdi:house", "mdi:home", "mdi:hotel"');
  });

  it('summarizes multiple icons and fails when any of them is invalid', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, { mdi: { name: 'Material Design Icons' } });
    installSet(workspace, 'mdi', { home: { body: '<path d="M1 2"/>' } });

    const { context, messages } = collectingContext();
    await expect(
      runRule(
        validateIcon({ project: 'frontend', icon: ['mdi:home', 'mdi:ghost'] }),
        workspace,
        context,
      ),
    ).rejects.toThrow(/Icon validation failed: 1\/2 icons valid/);

    expect(messagesOf(messages, 'info')).toContain('1/2 icons valid');
  });

  it('fails when @iconify/collections is missing, with an install hint', async () => {
    const workspace = createWorkspace();

    const { context, messages } = collectingContext();
    await expect(
      runRule(validateIcon({ project: 'frontend', icon: 'mdi:home' }), workspace, context),
    ).rejects.toThrow(/Icon validation failed/);

    const errors = messagesOf(messages, 'error');
    expect(errors[0]).toContain('@iconify/collections is not installed');
    expect(errors[0]).toContain('npm install -D @iconify/collections');
  });
});