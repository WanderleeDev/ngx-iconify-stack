import { HostTree } from '@angular-devkit/schematics';
import { validateSet } from './validate-set';
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

describe('validateSet', () => {
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
      validateSet({ project: 'frontend', prefix: 'mdi' }),
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
      runRule(validateSet({ project: 'frontend', prefix: 'nope' }), workspace, context),
    );
    expect(error.message).toContain('Set "nope" does not exist in the Iconify catalog');
    expect(error.message).toContain('list-sets --search nope');
  });

  it('throws an install hint when @iconify/collections is missing', async () => {
    const workspace = createWorkspace();

    const { context } = collectingContext();
    await expect(
      runRule(validateSet({ project: 'frontend', prefix: 'mdi' }), workspace, context),
    ).rejects.toThrow(/npm install -D @iconify\/collections/);
  });
});