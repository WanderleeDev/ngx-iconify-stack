import { HostTree } from '@angular-devkit/schematics';
import {
  assertAngularProject,
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
