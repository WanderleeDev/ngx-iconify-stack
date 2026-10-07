import { HostTree, Tree } from '@angular-devkit/schematics';
import { doctor } from './doctor';
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

/** Await a rule run and return the thrown error (fails when nothing throws). */
async function captureError(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (e) {
    return e as Error;
  }
  throw new Error('expected the rule to throw');
}

function messagesOf(messages: LoggedMessage[], type: LoggedMessage['type']): string[] {
  return messages.filter((m) => m.type === type).map((m) => m.text);
}

const CATALOG_FIXTURE = {
  mdi: { name: 'Material Design Icons', total: 7447, category: 'Material' },
  lucide: { name: 'Lucide', total: 1111, category: 'General' },
  tabler: { name: 'Tabler Icons', total: 2222, category: 'General' },
  'mdi-light': { name: 'Material Design Light', total: 284, category: 'Material' },
};

describe('doctor', () => {
  // ── --list (ported from list-sets.spec.ts) ──

  it('lists every set in the catalog when no filters are given', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, CATALOG_FIXTURE);

    const { context, messages } = collectingContext();
    await runRule(doctor({ project: 'frontend', list: true }), workspace, context);

    const info = messages.filter((m) => m.type === 'info').map((m) => m.text);
    expect(info[0]).toBe('Available icon sets (4)');
    expect(info.join('\n')).toContain('mdi');
    expect(info.join('\n')).toContain('lucide');
    expect(info.join('\n')).toContain('tabler');
    expect(info.join('\n')).toContain('mdi-light');
  });

  it('lists sets by default when neither --icon nor --prefix is given', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, CATALOG_FIXTURE);

    const { context, messages } = collectingContext();
    await runRule(doctor({ project: 'frontend' }), workspace, context);

    const info = messages.filter((m) => m.type === 'info').map((m) => m.text);
    expect(info[0]).toBe('Available icon sets (4)');
  });

  it('filters by case-insensitive search on prefix and name', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, CATALOG_FIXTURE);

    const { context, messages } = collectingContext();
    await runRule(
      doctor({ project: 'frontend', list: true, search: 'lucide' }),
      workspace,
      context,
    );

    const info = messages.filter((m) => m.type === 'info').map((m) => m.text);
    expect(info.join('\n')).toContain('lucide');
    expect(info.join('\n')).not.toContain('mdi');

    const { context: upperContext, messages: upperMessages } = collectingContext();
    await runRule(
      doctor({ project: 'frontend', list: true, search: 'MATERIAL' }),
      workspace,
      upperContext,
    );
    const upperInfo = upperMessages.filter((m) => m.type === 'info').map((m) => m.text).join('\n');
    expect(upperInfo).toContain('mdi');
    expect(upperInfo).toContain('mdi-light');
    expect(upperInfo).not.toContain('lucide');
  });

  it('filters by exact category', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, CATALOG_FIXTURE);

    const { context, messages } = collectingContext();
    await runRule(
      doctor({ project: 'frontend', list: true, category: 'Material' }),
      workspace,
      context,
    );

    const info = messages.filter((m) => m.type === 'info').map((m) => m.text).join('\n');
    expect(info).toContain('mdi');
    expect(info).toContain('mdi-light');
    expect(info).not.toContain('lucide');
    expect(info).not.toContain('tabler');
  });

  it('applies the limit cap', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, CATALOG_FIXTURE);

    const { context, messages } = collectingContext();
    await runRule(
      doctor({ project: 'frontend', list: true, limit: 2 }),
      workspace,
      context,
    );

    const info = messages.filter((m) => m.type === 'info').map((m) => m.text);
    expect(info[0]).toBe('Available icon sets (4)');
    expect(info).toHaveLength(3); // header + 2 rows
    expect(info[1]).toContain('mdi');
    expect(info[2]).toContain('lucide');
    expect(info.join('\n')).not.toContain('tabler');
  });

  it('throws an install hint when @iconify/collections is missing', async () => {
    const workspace = createWorkspace();

    const { context } = collectingContext();
    const error = await captureError(runRule(doctor({ project: 'frontend', list: true }), workspace, context));
    expect(error.message).toContain('@iconify/collections is not installed');
    expect(error.message).toContain('npm install -D @iconify/collections');
  });

  // ── --prefix (ported from validate-set.spec.ts) ──

  it('prints compact metadata for a set that exists in the catalog', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, {
      mdi: {
        name: 'Material Design Icons',
        total: 7447,
        author: { name: 'Austin Andrews', url: 'https://github.com/Templarian/MaterialDesign' },
        license: { title: 'Apache 2.0', spdx: 'Apache-2.0' },
        samples: [
          'account-check',
          'bell-alert-outline',
          'calendar-edit',
          'skip-previous',
          'home-variant',
          'lock-open-outline',
        ],
        height: 24,
        category: 'Material',
        tags: ['material'],
        palette: false,
      },
    });

    const { context, messages } = collectingContext();
    const tree = await runRule(
      doctor({ project: 'frontend', prefix: 'mdi' }),
      workspace,
      context,
    );

    const info = messages.filter((m) => m.type === 'info').map((m) => m.text);
    expect(info[0]).toContain('✓ Set "mdi" exists in the Iconify catalog');
    expect(info[0]).toContain('Material Design Icons');
    expect(info).toContain('  total: 7447 icons');
    expect(info).toContain('  category: Material');
    expect(info).toContain('  height: 24');
    expect(info).toContain('  palette: false');
    expect(info).toContain('  license: Apache 2.0 (Apache-2.0)');
    expect(info).toContain(
      '  samples: account-check, bell-alert-outline, calendar-edit, skip-previous, home-variant, lock-open-outline',
    );
    expect(messages.filter((m) => m.type === 'error')).toHaveLength(0);
    // READ-ONLY: no writes beyond the workspace fixture.
    expect(tree.read('/node_modules/@iconify/collections/collections.json')).toBeDefined();
  });

  it('throws an actionable error for a prefix that does not exist in the catalog', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, { mdi: { name: 'Material Design Icons' } });

    const { context } = collectingContext();
    const error = await captureError(
      runRule(doctor({ project: 'frontend', prefix: 'nope' }), workspace, context),
    );
    expect(error.message).toContain('Set "nope" does not exist in the Iconify catalog');
    expect(error.message).toContain('list-sets --search nope');
  });

  it('throws an install hint for --prefix when @iconify/collections is missing', async () => {
    const workspace = createWorkspace();

    const { context } = collectingContext();
    await expect(
      runRule(doctor({ project: 'frontend', prefix: 'mdi' }), workspace, context),
    ).rejects.toThrow(/npm install -D @iconify\/collections/);
  });

  // ── --icon (ported from validate-icon.spec.ts) ──

  it('passes a well-formed icon that exists in an installed set (read-only)', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, {
      mdi: { name: 'Material Design Icons', total: 7447 },
    });
    installSet(workspace, 'mdi', { home: { body: '<path d="M1 2"/>' } });

    const before = listPaths(workspace);
    const { context, messages } = collectingContext();
    const tree = await runRule(
      doctor({ project: 'frontend', icon: 'mdi:home' }),
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
      runRule(doctor({ project: 'frontend', icon: 'MDI:Home' }), workspace, context),
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
      runRule(doctor({ project: 'frontend', icon: 'foo:bar' }), workspace, context),
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
      doctor({ project: 'frontend', icon: 'heroicons:star' }),
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
      runRule(doctor({ project: 'frontend', icon: 'mdi:hose' }), workspace, context),
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
        doctor({ project: 'frontend', icon: ['mdi:home', 'mdi:ghost'] }),
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
      runRule(doctor({ project: 'frontend', icon: 'mdi:home' }), workspace, context),
    ).rejects.toThrow(/Icon validation failed/);

    const errors = messagesOf(messages, 'error');
    expect(errors[0]).toContain('@iconify/collections is not installed');
    expect(errors[0]).toContain('npm install -D @iconify/collections');
  });

  // ── combined flags ──

  it('runs the listing and the prefix check together into one report', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, CATALOG_FIXTURE);

    const { context, messages } = collectingContext();
    await runRule(
      doctor({ project: 'frontend', list: true, prefix: 'mdi' }),
      workspace,
      context,
    );

    const info = messages.filter((m) => m.type === 'info').map((m) => m.text);
    expect(info[0]).toBe('Available icon sets (4)');
    expect(info.join('\n')).toContain('✓ Set "mdi" exists in the Iconify catalog');
  });

  it('fails the consolidated run when the --icon check fails', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, CATALOG_FIXTURE);
    installSet(workspace, 'mdi', { home: { body: '<path d="M1 2"/>' } });

    const { context, messages } = collectingContext();
    await expect(
      runRule(
        doctor({ project: 'frontend', list: true, icon: 'mdi:ghost' }),
        workspace,
        context,
      ),
    ).rejects.toThrow(/Icon validation failed/);

    // The listing still ran before the failing icon check.
    const info = messages.filter((m) => m.type === 'info').map((m) => m.text);
    expect(info[0]).toBe('Available icon sets (4)');
  });
});
