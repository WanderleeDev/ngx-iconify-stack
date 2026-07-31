import { describe, expect, it } from 'vitest';
import { HostTree } from '@angular-devkit/schematics';
import { buildSubset, readJsonFile, scanIcons, MAX_ALIAS_DEPTH } from './icons';

/** Mock @iconify-json set as it would live at node_modules/@iconify-json/<prefix>/icons.json. */
interface MockSet {
  prefix: string;
  icons?: Record<string, { body: string }>;
  aliases?: Record<string, { parent: string }>;
  width?: number;
  height?: number;
}

function createSubsetTree(
  sets: Record<string, MockSet>,
  sourceFiles?: Record<string, string>,
): HostTree {
  const tree = new HostTree();
  for (const [prefix, set] of Object.entries(sets)) {
    tree.create(`/node_modules/@iconify-json/${prefix}/icons.json`, JSON.stringify(set));
  }
  for (const [path, content] of Object.entries(sourceFiles ?? {})) {
    tree.create(path, content);
  }
  return tree;
}

function collectWarnings(): { logger: { warn: (message: string) => void }; warnings: string[] } {
  const warnings: string[] = [];
  return { logger: { warn: (message) => warnings.push(message) }, warnings };
}

const FOO_SET: MockSet = {
  prefix: 'foo',
  icons: {
    home: { body: '<path d="home"/>' },
    star: { body: '<path d="star"/>' },
  },
  aliases: {
    'home-alt': { parent: 'home' },
    'home-alt-2': { parent: 'home-alt' },
  },
};

describe('buildSubset', () => {
  it('copies direct icons and defaults width/height to 24 when the set omits them', () => {
    const tree = createSubsetTree({ foo: FOO_SET });
    const found = new Map([['foo', new Set(['home'])]]) as Map<string, Set<string>>;

    const collections = buildSubset(tree, found);

    expect(collections).toEqual([
      {
        prefix: 'foo',
        icons: { home: { body: '<path d="home"/>' } },
        width: 24,
        height: 24,
      },
    ]);
  });

  it('preserves explicit width/height declared by the set', () => {
    const tree = createSubsetTree({
      bar: { prefix: 'bar', icons: { logo: { body: '<path d="logo"/>' } }, width: 32, height: 40 },
    });
    const found = new Map([['bar', new Set(['logo'])]]) as Map<string, Set<string>>;

    const collections = buildSubset(tree, found);

    expect(collections[0].width).toBe(32);
    expect(collections[0].height).toBe(40);
  });

  it('resolves an alias chain of 2 hops, copying the resolved body under the alias name', () => {
    const tree = createSubsetTree({ foo: FOO_SET });
    const found = new Map([['foo', new Set(['home-alt-2'])]]) as Map<string, Set<string>>;

    const collections = buildSubset(tree, found);

    expect(collections[0].icons['home-alt-2']).toEqual({ body: '<path d="home"/>' });
  });

  it('omits and warns for an alias chain deeper than the cap', () => {
    const deepAliases: Record<string, { parent: string }> = {};
    for (let i = 0; i < MAX_ALIAS_DEPTH + 1; i++) {
      deepAliases[`alias-${i}`] = { parent: i + 1 > MAX_ALIAS_DEPTH ? 'home' : `alias-${i + 1}` };
    }
    const tree = createSubsetTree({
      foo: { prefix: 'foo', icons: { home: { body: '<path d="home"/>' } }, aliases: deepAliases },
    });
    const found = new Map([['foo', new Set(['alias-0'])]]) as Map<string, Set<string>>;
    const { logger, warnings } = collectWarnings();

    const collections = buildSubset(tree, found, logger);

    expect(collections[0].icons['alias-0']).toBeUndefined();
    expect(warnings).toContain('Icon "foo:alias-0" not found in set');
  });

  it('omits and warns for an icon that is neither concrete nor aliased', () => {
    const tree = createSubsetTree({ foo: FOO_SET });
    const found = new Map([['foo', new Set(['ghost'])]]) as Map<string, Set<string>>;
    const { logger, warnings } = collectWarnings();

    const collections = buildSubset(tree, found, logger);

    expect(collections[0].icons['ghost']).toBeUndefined();
    expect(warnings).toContain('Icon "foo:ghost" not found in set');
  });

  it('skips and warns for a prefix whose @iconify-json set is not installed', () => {
    const tree = createSubsetTree({ foo: FOO_SET });
    const found = new Map([['ghostset', new Set(['home'])]]) as Map<string, Set<string>>;
    const { logger, warnings } = collectWarnings();

    const collections = buildSubset(tree, found, logger);

    expect(collections).toEqual([]);
    expect(warnings).toContain('Set "ghostset" not found — install @iconify-json/ghostset');
  });

  it('builds one collection per scanned prefix, mixing resolved and skipped sets', () => {
    const tree = createSubsetTree({
      foo: FOO_SET,
      bar: { prefix: 'bar', icons: { x: { body: '<path d="x"/>' } } },
    });
    const found = new Map([
      ['foo', new Set(['home', 'home-alt'])],
      ['ghostset', new Set(['x'])],
      ['bar', new Set(['x'])],
    ]) as Map<string, Set<string>>;

    const collections = buildSubset(tree, found);

    expect(collections.map((c) => c.prefix)).toEqual(['foo', 'bar']);
    expect(collections[0].icons['home-alt']).toEqual({ body: '<path d="home"/>' });
  });

  it('reads icons.json from the virtual tree (mock node_modules) instead of the real filesystem', () => {
    const tree = createSubsetTree({ foo: FOO_SET });

    expect(readJsonFile(tree, 'node_modules/@iconify-json/foo/icons.json')).toEqual(FOO_SET);
    expect(readJsonFile(tree, 'node_modules/@iconify-json/ghostset/icons.json')).toBeNull();
  });

  it('feeds scanIcons output straight into buildSubset (scan -> subset contract)', () => {
    const tree = createSubsetTree(
      { foo: FOO_SET },
      {
        '/projects/docs/src/app/app.component.html': `<ngx-iconify icon="foo:home-alt-2"></ngx-iconify>`,
      },
    );

    const found = scanIcons(tree, 'projects/docs/src');
    const collections = buildSubset(tree, found);

    expect(collections[0].icons['home-alt-2']).toEqual({ body: '<path d="home"/>' });
  });
});
