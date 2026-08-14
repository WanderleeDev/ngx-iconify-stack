import { HostTree } from '@angular-devkit/schematics';
import { skill } from './skill';
import { runRule } from './spec-run-rule';
import { SKILL_SCRIPT } from './utils';

const TOOLS_ROOT = '.agents/skills/ngx-iconify-stack';
const TOOL_PATH = `${TOOLS_ROOT}/tools/list-sets.mjs`;

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
    JSON.stringify({
      name: 'app',
      version: '0.0.0',
      scripts: {},
      dependencies: {},
      devDependencies: {},
    }),
  );
  tree.create(
    '/src/main.ts',
    "import { bootstrapApplication } from '@angular/platform-browser';\nbootstrapApplication(AppComponent, appConfig);",
  );
  return tree;
}

describe('skill', () => {
  it('generates the skill files, documents the three read-only tool schematics, and wires the skill script', async () => {
    const tree = await runRule(skill({ project: 'frontend' }), createWorkspace(), stubContext());

    // The standalone list-sets.mjs tool is gone — tools are schematics now.
    expect(tree.exists(`/${TOOL_PATH}`)).toBe(false);

    const skillMd = tree.read('/.agents/skills/ngx-iconify-stack/SKILL.md')!.toString();
    expect(skillMd).toContain('## Tools');
    expect(skillMd).toContain('ngx-iconify-stack:list-sets');
    expect(skillMd).toContain('ngx-iconify-stack:validate-set');
    expect(skillMd).toContain('ngx-iconify-stack:validate-icon');
    expect(skillMd).toContain('--category');
    expect(skillMd).toContain('--search');
    expect(skillMd).toContain('--limit');
    expect(skillMd).toContain('ALWAYS validate against the catalog/set first');
    expect(skillMd).not.toContain('npm run ngx-iconify-stack:list-sets');
    expect(skillMd).not.toContain('list-sets.mjs');

    const apiRef =
      tree.read('/.agents/skills/ngx-iconify-stack/references/api-reference.md')!.toString();
    expect(apiRef).toContain('| `list-sets` |');
    expect(apiRef).toContain('| `validate-icon` |');
    expect(apiRef).toContain('| `validate-set` |');

    const pkg = JSON.parse(tree.read('/package.json')!.toString());
    expect(pkg.scripts[SKILL_SCRIPT]).toBe(
      'ng generate ngx-iconify-stack:skill --project frontend',
    );
    expect(pkg.scripts['ngx-iconify-stack:list-sets']).toBeUndefined();
    expect(pkg.devDependencies['@iconify/collections']).toBeDefined();
  });

  it('is idempotent: rerunning keeps the skill files and skill script in place', async () => {
    const first = await runRule(skill({ project: 'frontend' }), createWorkspace(), stubContext());
    const second = await runRule(skill({ project: 'frontend' }), first, stubContext());

    expect(second.exists(`/${TOOL_PATH}`)).toBe(false);
    expect(second.exists(`/${TOOLS_ROOT}/SKILL.md`)).toBe(true);
    expect(second.exists(`/${TOOLS_ROOT}/references/api-reference.md`)).toBe(true);
    expect(second.exists(`/${TOOLS_ROOT}/assets/example.component.ts`)).toBe(true);
    const pkg = JSON.parse(second.read('/package.json')!.toString());
    expect(pkg.scripts['ngx-iconify-stack:list-sets']).toBeUndefined();
    expect(pkg.devDependencies['@iconify/collections']).toBeDefined();
  });
});