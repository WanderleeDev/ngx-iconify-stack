import { HostTree } from '@angular-devkit/schematics';
import { listSets } from './list-sets';
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

/** Await a rule run and return the thrown error (fails when nothing throws). */
async function captureError(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (e) {
    return e as Error;
  }
  throw new Error('expected the rule to throw');
}

const FIXTURE = {
  mdi: { name: 'Material Design Icons', total: 7447, category: 'Material' },
  lucide: { name: 'Lucide', total: 1111, category: 'General' },
  tabler: { name: 'Tabler Icons', total: 2222, category: 'General' },
  'mdi-light': { name: 'Material Design Light', total: 284, category: 'Material' },
};

describe('listSets', () => {
  it('lists every set in the catalog when no filters are given', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, FIXTURE);

    const { context, messages } = collectingContext();
    await runRule(listSets({ project: 'frontend' }), workspace, context);

    const info = messages.filter((m) => m.type === 'info').map((m) => m.text);
    expect(info[0]).toBe('Available icon sets (4)');
    expect(info.join('\n')).toContain('mdi');
    expect(info.join('\n')).toContain('lucide');
    expect(info.join('\n')).toContain('tabler');
    expect(info.join('\n')).toContain('mdi-light');
  });

  it('filters by case-insensitive search on prefix and name', async () => {
    const workspace = createWorkspace();
    installCatalog(workspace, FIXTURE);

    const { context, messages } = collectingContext();
    await runRule(
      listSets({ project: 'frontend', search: 'lucide' }),
      workspace,
      context,
    );

    const info = messages.filter((m) => m.type === 'info').map((m) => m.text);
    expect(info.join('\n')).toContain('lucide');
    expect(info.join('\n')).not.toContain('mdi');

    const { context: upperContext, messages: upperMessages } = collectingContext();
    await runRule(
      listSets({ project: 'frontend', search: 'MATERIAL' }),
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
    installCatalog(workspace, FIXTURE);

    const { context, messages } = collectingContext();
    await runRule(
      listSets({ project: 'frontend', category: 'Material' }),
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
    installCatalog(workspace, FIXTURE);

    const { context, messages } = collectingContext();
    await runRule(
      listSets({ project: 'frontend', limit: 2 }),
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
    const error = await captureError(runRule(listSets({ project: 'frontend' }), workspace, context));
    expect(error.message).toContain('@iconify/collections is not installed');
    expect(error.message).toContain('npm install -D @iconify/collections');
  });
});