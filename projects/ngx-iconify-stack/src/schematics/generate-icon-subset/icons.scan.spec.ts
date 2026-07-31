import { describe, expect, it } from 'vitest';
import { HostTree } from '@angular-devkit/schematics';
import { scanIcons } from './icons';

const SOURCE_ROOT = 'projects/docs/src';

function createScanTree(files: Record<string, string>): HostTree {
  const tree = new HostTree();
  for (const [path, content] of Object.entries(files)) {
    tree.create(path, content);
  }
  return tree;
}

describe('scanIcons', () => {
  it('collects icons from HTML icon="prefix:name" attributes', () => {
    const tree = createScanTree({
      [`${SOURCE_ROOT}/app/app.component.html`]: `<ngx-iconify icon="mdi:home"></ngx-iconify>`,
    });

    const found = scanIcons(tree, SOURCE_ROOT);

    expect(found.get('mdi')).toEqual(new Set(['home']));
  });

  it('collects icons from TS property and assignment forms', () => {
    const tree = createScanTree({
      [`${SOURCE_ROOT}/app/app.component.ts`]: [
        `export const labels = { icon: 'mdi:home' };`,
        `export class AppComponent { icon = 'mdi:star'; }`,
      ].join('\n'),
    });

    const found = scanIcons(tree, SOURCE_ROOT);

    expect(found.get('mdi')).toEqual(new Set(['home', 'star']));
  });

  it('collects multiple names under one prefix, deduplicating repeats', () => {
    const tree = createScanTree({
      [`${SOURCE_ROOT}/a.html`]: `<ngx-iconify icon="mdi:home"></ngx-iconify>`,
      [`${SOURCE_ROOT}/b.ts`]: `const a = { icon: 'mdi:home' }; const b = { icon: 'mdi:search' };`,
    });

    const found = scanIcons(tree, SOURCE_ROOT);

    expect(found.get('mdi')).toEqual(new Set(['home', 'search']));
  });

  it('does not match dash-separated names like icon="mdi-home"', () => {
    const tree = createScanTree({
      [`${SOURCE_ROOT}/app/app.component.html`]: `<ngx-iconify icon="mdi-home"></ngx-iconify>`,
    });

    expect(scanIcons(tree, SOURCE_ROOT).size).toBe(0);
  });

  it('does not match iconName = "prefix:name" properties', () => {
    const tree = createScanTree({
      [`${SOURCE_ROOT}/app/app.component.ts`]: `const iconName = 'mdi:home';`,
    });

    expect(scanIcons(tree, SOURCE_ROOT).size).toBe(0);
  });

  it('does not match the literal word iconify', () => {
    const tree = createScanTree({
      [`${SOURCE_ROOT}/app/app.component.ts`]: [
        `import { iconify } from 'some-lib';`,
        `const iconify = 'mdi:home';`,
      ].join('\n'),
    });

    expect(scanIcons(tree, SOURCE_ROOT).size).toBe(0);
  });

  it('ignores files outside the source root', () => {
    const tree = createScanTree({
      [`${SOURCE_ROOT}/app/app.component.html`]: `<ngx-iconify icon="mdi:home"></ngx-iconify>`,
      ['/src/legacy.html']: `<ngx-iconify icon="legacy:icon"></ngx-iconify>`,
    });

    const found = scanIcons(tree, SOURCE_ROOT);

    expect(found.get('mdi')).toEqual(new Set(['home']));
    expect(found.has('legacy')).toBe(false);
  });
});
