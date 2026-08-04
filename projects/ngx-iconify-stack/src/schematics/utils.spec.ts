import { HostTree } from '@angular-devkit/schematics';
import {
  assertAngularProject,
  detectPackageManager,
  detectRunner,
  ICONS_SCRIPT,
  looksLikeNestMain,
  SKILL_SCRIPT,
  wireIconifyScripts,
  wireSkillScript,
} from './utils';

describe('wireIconifyScripts', () => {
  it('adds the icons script with the current project when missing', () => {
    const pkg = { scripts: {} as Record<string, string> };
    const changed = wireIconifyScripts(pkg, 'frontend');
    expect(changed).toBe(true);
    expect(pkg.scripts[ICONS_SCRIPT]).toBe(
      'ng generate ngx-iconify-stack:generate-icon-subset --project frontend',
    );
  });

  it('rewrites the icons script when it targets another project (self-heal)', () => {
    const pkg = {
      scripts: {
        [ICONS_SCRIPT]:
          'ng generate ngx-iconify-stack:generate-icon-subset --project backend',
      } as Record<string, string>,
    };
    const changed = wireIconifyScripts(pkg, 'frontend');
    expect(changed).toBe(true);
    expect(pkg.scripts[ICONS_SCRIPT]).toBe(
      'ng generate ngx-iconify-stack:generate-icon-subset --project frontend',
    );
  });

  it('leaves everything untouched when script and prebuild are already correct', () => {
    const pkg = {
      scripts: {
        [ICONS_SCRIPT]:
          'ng generate ngx-iconify-stack:generate-icon-subset --project frontend',
        prebuild: `npm run ${ICONS_SCRIPT}`,
      } as Record<string, string>,
    };
    const changed = wireIconifyScripts(pkg, 'frontend');
    expect(changed).toBe(false);
  });

  it('remove mode deletes the icons script and prebuild when they are solely icon wiring', () => {
    const pkg = {
      scripts: {
        [ICONS_SCRIPT]:
          'ng generate ngx-iconify-stack:generate-icon-subset --project frontend',
        prebuild: `npm run ${ICONS_SCRIPT}`,
        prestart: `npm run ${ICONS_SCRIPT}`,
        'collect-icons': 'node scripts/collect-icons.mjs',
      } as Record<string, string>,
    };
    const changed = wireIconifyScripts(pkg, 'frontend', 'npm', 'ng', { remove: true });
    expect(changed).toBe(true);
    expect(pkg.scripts[ICONS_SCRIPT]).toBeUndefined();
    expect(pkg.scripts['prebuild']).toBeUndefined();
    expect(pkg.scripts['prestart']).toBeUndefined();
    expect(pkg.scripts['collect-icons']).toBeUndefined();
  });

  it('remove mode strips only the icon segment from a mixed prebuild chain', () => {
    const pkg = {
      scripts: {
        [ICONS_SCRIPT]:
          'ng generate ngx-iconify-stack:generate-icon-subset --project frontend',
        prebuild: `npm run ${ICONS_SCRIPT} && ng build`,
      } as Record<string, string>,
    };
    const changed = wireIconifyScripts(pkg, 'frontend', 'npm', 'ng', { remove: true });
    expect(changed).toBe(true);
    expect(pkg.scripts['prebuild']).toBe('ng build');
    expect(pkg.scripts[ICONS_SCRIPT]).toBeUndefined();
  });

  it('remove mode is idempotent when there is nothing to remove', () => {
    const pkg = { scripts: { build: 'ng build' } as Record<string, string> };
    const changed = wireIconifyScripts(pkg, 'frontend', 'npm', 'ng', { remove: true });
    expect(changed).toBe(false);
    expect(pkg.scripts['build']).toBe('ng build');
  });

  it('remove mode leaves non-icon scripts untouched', () => {
    const pkg = {
      scripts: {
        prebuild: 'tsc -p tsconfig.server.json',
        [ICONS_SCRIPT]:
          'ng generate ngx-iconify-stack:generate-icon-subset --project frontend',
      } as Record<string, string>,
    };
    const changed = wireIconifyScripts(pkg, 'frontend', 'npm', 'ng', { remove: true });
    expect(changed).toBe(true);
    expect(pkg.scripts['prebuild']).toBe('tsc -p tsconfig.server.json');
    expect(pkg.scripts[ICONS_SCRIPT]).toBeUndefined();
  });
});

describe('wireSkillScript', () => {
  it('adds the skill script when missing', () => {
    const pkg = { scripts: {} as Record<string, string> };
    expect(wireSkillScript(pkg, 'frontend')).toBe('added');
    expect(pkg.scripts[SKILL_SCRIPT]).toBe(
      'ng generate ngx-iconify-stack:skill --project frontend',
    );
  });

  it('rewrites the skill script when it targets another project (self-heal)', () => {
    const pkg = {
      scripts: {
        [SKILL_SCRIPT]: 'ng generate ngx-iconify-stack:skill --project backend',
      } as Record<string, string>,
    };
    expect(wireSkillScript(pkg, 'frontend')).toBe('updated');
    expect(pkg.scripts[SKILL_SCRIPT]).toBe(
      'ng generate ngx-iconify-stack:skill --project frontend',
    );
  });

  it('reports unchanged when the script already targets the current project', () => {
    const pkg = {
      scripts: {
        [SKILL_SCRIPT]: 'ng generate ngx-iconify-stack:skill --project frontend',
      } as Record<string, string>,
    };
    expect(wireSkillScript(pkg, 'frontend')).toBe('unchanged');
  });
});

describe('detectRunner', () => {
  it('returns nx when nx.json exists', () => {
    const tree = new HostTree();
    tree.create('nx.json', '{}');
    expect(detectRunner(tree)).toBe('nx');
  });

  it('returns ng without nx.json (plain or Turborepo workspace)', () => {
    expect(detectRunner(new HostTree())).toBe('ng');
  });
});

describe('wireIconifyScripts runner (nx vs ng)', () => {
  it('writes nx generate in Nx workspaces', () => {
    const pkg = { scripts: {} as Record<string, string> };
    const changed = wireIconifyScripts(pkg, 'frontend', 'npm', 'nx');
    expect(changed).toBe(true);
    expect(pkg.scripts[ICONS_SCRIPT]).toBe(
      'nx generate ngx-iconify-stack:generate-icon-subset --project frontend',
    );
  });

  it('migrates an existing ng script to nx when the workspace is Nx', () => {
    const pkg = {
      scripts: {
        [ICONS_SCRIPT]:
          'ng generate ngx-iconify-stack:generate-icon-subset --project frontend',
      } as Record<string, string>,
    };
    const changed = wireIconifyScripts(pkg, 'frontend', 'npm', 'nx');
    expect(changed).toBe(true);
    expect(pkg.scripts[ICONS_SCRIPT]).toBe(
      'nx generate ngx-iconify-stack:generate-icon-subset --project frontend',
    );
  });
});

describe('wireSkillScript runner (nx vs ng)', () => {
  it('writes nx generate in Nx workspaces', () => {
    const pkg = { scripts: {} as Record<string, string> };
    expect(wireSkillScript(pkg, 'frontend', 'nx')).toBe('added');
    expect(pkg.scripts[SKILL_SCRIPT]).toBe(
      'nx generate ngx-iconify-stack:skill --project frontend',
    );
  });

  it('migrates an existing ng script to nx when the workspace is Nx', () => {
    const pkg = {
      scripts: {
        [SKILL_SCRIPT]: 'ng generate ngx-iconify-stack:skill --project frontend',
      } as Record<string, string>,
    };
    expect(wireSkillScript(pkg, 'frontend', 'nx')).toBe('updated');
    expect(pkg.scripts[SKILL_SCRIPT]).toBe(
      'nx generate ngx-iconify-stack:skill --project frontend',
    );
  });
});

describe('looksLikeNestMain', () => {
  it('detects a NestJS import', () => {
    expect(looksLikeNestMain("import { NestFactory } from '@nestjs/core';")).toBe(true);
  });

  it('detects NestFactory.create', () => {
    expect(looksLikeNestMain('const app = await NestFactory.create(AppModule);')).toBe(true);
  });

  it('rejects an Angular bootstrap', () => {
    expect(
      looksLikeNestMain(
        "import { bootstrapApplication } from '@angular/platform-browser';",
      ),
    ).toBe(false);
  });

  it('rejects empty or missing content', () => {
    expect(looksLikeNestMain('')).toBe(false);
    expect(looksLikeNestMain(null)).toBe(false);
    expect(looksLikeNestMain(undefined)).toBe(false);
  });
});

describe('detectPackageManager', () => {
  it('reads the packageManager field', () => {
    const tree = new HostTree();
    tree.create('/package.json', JSON.stringify({ packageManager: 'pnpm@9.0.0' }));
    expect(detectPackageManager(tree)).toBe('pnpm');
  });

  it('reads the packageManager field for yarn', () => {
    const tree = new HostTree();
    tree.create('/package.json', JSON.stringify({ packageManager: 'yarn@4.1.0' }));
    expect(detectPackageManager(tree)).toBe('yarn');
  });

  it('falls back to pnpm-lock.yaml', () => {
    const tree = new HostTree();
    tree.create('pnpm-lock.yaml', 'lockfileVersion: 9.0');
    expect(detectPackageManager(tree)).toBe('pnpm');
  });

  it('falls back to package-lock.json', () => {
    const tree = new HostTree();
    tree.create('package-lock.json', '{}');
    expect(detectPackageManager(tree)).toBe('npm');
  });

  it('defaults to npm without any signal', () => {
    expect(detectPackageManager(new HostTree())).toBe('npm');
  });
});

describe('wireIconifyScripts package manager', () => {
  it('writes prebuild with the detected runner', () => {
    const pkg = { scripts: {} as Record<string, string> };
    const changed = wireIconifyScripts(pkg, 'frontend', 'pnpm');
    expect(changed).toBe(true);
    expect(pkg.scripts['prebuild']).toBe('pnpm run ngx-iconify-stack:generate-icons');
  });

  it('rewrites a different runner to the detected one (self-heal)', () => {
    const pkg = {
      scripts: {
        prebuild: 'npm run ngx-iconify-stack:generate-icons',
      } as Record<string, string>,
    };
    const changed = wireIconifyScripts(pkg, 'frontend', 'pnpm');
    expect(changed).toBe(true);
    expect(pkg.scripts['prebuild']).toBe('pnpm run ngx-iconify-stack:generate-icons');
  });

  it('leaves prebuild untouched when it already uses the detected runner', () => {
    const pkg = {
      scripts: {
        [ICONS_SCRIPT]:
          'ng generate ngx-iconify-stack:generate-icon-subset --project frontend',
        prebuild: 'pnpm run ngx-iconify-stack:generate-icons',
      } as Record<string, string>,
    };
    const changed = wireIconifyScripts(pkg, 'frontend', 'pnpm');
    expect(changed).toBe(false);
  });

  it('recognizes a yarn runner segment in prestart cleanup', () => {
    const pkg = {
      scripts: {
        prestart: 'yarn run ngx-iconify-stack:generate-icons && tsc -p tsconfig.server.json',
      } as Record<string, string>,
    };
    const changed = wireIconifyScripts(pkg, 'frontend', 'yarn');
    expect(changed).toBe(true);
    expect(pkg.scripts['prestart']).toBe('tsc -p tsconfig.server.json');
  });
});

describe('assertAngularProject', () => {
  it('throws an actionable error for a NestJS main.ts', () => {
    const tree = new HostTree();
    tree.create(
      'src/main.ts',
      "import { NestFactory } from '@nestjs/core';\nNestFactory.create(AppModule);",
    );
    expect(() => assertAngularProject(tree, 'src', 'backend')).toThrow(
      /"backend" looks like a NestJS application/,
    );
  });

  it('passes for an Angular main.ts', () => {
    const tree = new HostTree();
    tree.create(
      'src/main.ts',
      "import { bootstrapApplication } from '@angular/platform-browser';",
    );
    expect(() => assertAngularProject(tree, 'src', 'frontend')).not.toThrow();
  });
});
