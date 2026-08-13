import { HostTree, Tree } from '@angular-devkit/schematics';
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { skill } from './skill';
import { runRule } from './spec-run-rule';
import { LIST_SETS_SCRIPT, SKILL_SCRIPT } from './utils';

const TOOL_PATH = '.agents/skills/ngx-iconify-stack/tools/list-sets.mjs';

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
  it('generates the skill files, including the catalog tool, and wires both scripts', async () => {
    const tree = await runRule(skill({ project: 'frontend' }), createWorkspace(), stubContext());

    const tool = tree.read(`/${TOOL_PATH}`)!.toString();
    expect(tool).toContain('#!/usr/bin/env node');
    expect(tool).toContain('@iconify/collections');
    expect(tool).not.toContain('writeFileSync');

    const skillMd = tree.read('/.agents/skills/ngx-iconify-stack/SKILL.md')!.toString();
    expect(skillMd).toContain('## Catalog tool');
    expect(skillMd).toContain('ngx-iconify-stack:list-sets');
    expect(skillMd).toContain('--category');
    expect(skillMd).toContain('--search');
    expect(skillMd).toContain('--limit');

    const apiRef =
      tree.read('/.agents/skills/ngx-iconify-stack/references/api-reference.md')!.toString();
    expect(apiRef).toContain('| `list-sets` |');

    const pkg = JSON.parse(tree.read('/package.json')!.toString());
    expect(pkg.scripts[LIST_SETS_SCRIPT]).toBe(
      'node .agents/skills/ngx-iconify-stack/tools/list-sets.mjs',
    );
    expect(pkg.scripts[SKILL_SCRIPT]).toBe(
      'ng generate ngx-iconify-stack:skill --project frontend',
    );
  });

  it('is idempotent: rerunning keeps the tool and scripts in place', async () => {
    const first = await runRule(skill({ project: 'frontend' }), createWorkspace(), stubContext());
    const second = await runRule(skill({ project: 'frontend' }), first, stubContext());

    expect(second.exists(`/${TOOL_PATH}`)).toBe(true);
    const pkg = JSON.parse(second.read('/package.json')!.toString());
    expect(pkg.scripts[LIST_SETS_SCRIPT]).toBe(
      'node .agents/skills/ngx-iconify-stack/tools/list-sets.mjs',
    );
  });
});

describe('list-sets.mjs runtime', () => {
  let tmp: string;
  let toolPath: string;

  function runNode(args: string[]): Promise<{ stdout: string; code: number | null }> {
    return new Promise((resolve, reject) => {
      execFile(
        process.execPath,
        [toolPath, ...args],
        { cwd: tmp },
        (error, stdout, stderr) => {
          if (error) {
            (error as { stdout?: string }).stdout = stdout;
            (error as { stderr?: string }).stderr = stderr;
            reject(error);
            return;
          }
          resolve({ stdout, code: 0 });
        },
      );
    });
  }

  function writeFixture(sets: Record<string, { name: string; total: number; category?: string }>) {
    const dir = join(tmp, 'node_modules', '@iconify', 'collections');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'collections.json'), JSON.stringify(sets));
  }

  function snapshotTree(dir: string): string[] {
    const entries: string[] = [];
    for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
      entries.push(`${entry.name}${entry.isDirectory() ? '/' : ''}`);
    }
    return entries.sort();
  }

  beforeEach(async () => {
    tmp = mkdtempSync(join(tmpdir(), 'list-sets-'));
    const tree = await runRule(skill({ project: 'frontend' }), createWorkspace(), stubContext());
    toolPath = join(tmp, 'list-sets.mjs');
    writeFileSync(toolPath, tree.read(`/${TOOL_PATH}`)!.toString());
  });

  it('lists sets and respects --limit', async () => {
    writeFixture({
      mdi: { name: 'Material Design Icons', total: 7447, category: 'Material' },
      lucide: { name: 'Lucide', total: 1111, category: 'General' },
      tabler: { name: 'Tabler Icons', total: 2222, category: 'General' },
    });

    const { stdout } = await runNode(['--limit', '2']);
    const lines = stdout.trim().split('\n');
    expect(lines[0]).toBe('Available icon sets (3)');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('mdi');
    expect(lines[1]).toContain('7447');
    expect(lines[2]).toContain('lucide');
  });

  it('filters by --search and --category', async () => {
    writeFixture({
      mdi: { name: 'Material Design Icons', total: 7447, category: 'Material' },
      lucide: { name: 'Lucide', total: 1111, category: 'General' },
      'mdi-light': { name: 'Material Design Light', total: 284, category: 'Material' },
    });

    const searched = await runNode(['--search', 'lucide']);
    expect(searched.stdout).toContain('Available icon sets (3)');
    expect(searched.stdout).toContain('lucide');
    expect(searched.stdout).not.toContain('mdi');

    const categorized = await runNode(['--category', 'Material']);
    expect(categorized.stdout).toContain('mdi');
    expect(categorized.stdout).toContain('mdi-light');
    expect(categorized.stdout).not.toContain('lucide');
  });

  it('exits 1 with an install hint when @iconify/collections is absent', async () => {
    await expect(runNode([])).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining(
        '@iconify/collections is not installed. Install it with: npm install -D @iconify/collections',
      ),
    });
  });

  it('never writes files', async () => {
    writeFixture({
      mdi: { name: 'Material Design Icons', total: 7447, category: 'Material' },
    });
    const before = snapshotTree(tmp);

    await runNode(['--search', 'mdi', '--limit', '1']);
    await runNode(['--category', 'Material']);
    await runNode([]);

    expect(snapshotTree(tmp)).toEqual(before);
    expect(existsSync(join(tmp, 'collections.json'))).toBe(false);
  });
});
