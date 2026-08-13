import { describe, it, expect } from 'vitest';
import type { IconifyJSON } from '@iconify/types';
import { lookupIcon } from './icon-helpers';

function makeCollection(overrides: Partial<IconifyJSON> = {}): IconifyJSON {
  return {
    prefix: 'mdi',
    icons: {
      home: {
        body: '<path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3z"/>',
        width: 24,
        height: 24,
      },
      account: {
        body: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>',
      },
    },
    ...overrides,
  };
}

describe('lookupIcon', () => {
  it('returns null when collections is null', () => {
    expect(lookupIcon('mdi:home', null)).toBeNull();
  });

  it('returns null when collections is undefined', () => {
    expect(lookupIcon('mdi:home')).toBeNull();
  });

  it('returns null for an empty collections array', () => {
    expect(lookupIcon('mdi:home', [])).toBeNull();
  });

  it('returns null for an empty icon ref', () => {
    expect(lookupIcon('', [makeCollection()])).toBeNull();
  });

  it('returns null when the ref has no prefix separator', () => {
    expect(lookupIcon('home', [makeCollection()])).toBeNull();
  });

  it('returns null for an unknown prefix', () => {
    expect(lookupIcon('foo:home', [makeCollection()])).toBeNull();
  });

  it('returns null for an unknown icon name', () => {
    expect(lookupIcon('mdi:ghost', [makeCollection()])).toBeNull();
  });

  it('returns body and icon-level dimensions for a direct icon', () => {
    const result = lookupIcon('mdi:home', [makeCollection()]);
    expect(result).toEqual({
      body: expect.stringContaining('<path'),
      width: 24,
      height: 24,
    });
  });

  it('falls back to set-level width/height when the icon lacks them', () => {
    const result = lookupIcon('mdi:account', [makeCollection({ width: 32, height: 32 })]);
    expect(result?.width).toBe(32);
    expect(result?.height).toBe(32);
  });

  it('defaults width/height to 24 when neither icon nor set has them', () => {
    const set = makeCollection({
      icons: {
        bare: { body: '<path d="M0 0h24v24H0z"/>' },
      },
    });
    const result = lookupIcon('mdi:bare', [set]);
    expect(result?.width).toBe(24);
    expect(result?.height).toBe(24);
  });

  it('prefers icon-level dimensions over set-level ones', () => {
    const result = lookupIcon('mdi:home', [makeCollection({ width: 32, height: 32 })]);
    expect(result?.width).toBe(24);
    expect(result?.height).toBe(24);
  });

  it('resolves a single alias whose parent is a real icon', () => {
    const set = makeCollection({
      icons: {
        house: { body: '<path d="house"/>', width: 24, height: 24 },
      },
      aliases: {
        home: { parent: 'house' },
      },
    });
    const result = lookupIcon('mdi:home', [set]);
    expect(result?.body).toBe('<path d="house"/>');
    expect(result?.width).toBe(24);
    expect(result?.height).toBe(24);
  });

  it('resolves an alias chain to the final parent icon', () => {
    const set = makeCollection({
      icons: {
        target: { body: '<path d="target"/>', width: 48, height: 48 },
      },
      aliases: {
        a1: { parent: 'a2' },
        a2: { parent: 'a3' },
        a3: { parent: 'target' },
      },
    });
    const result = lookupIcon('mdi:a1', [set]);
    expect(result?.body).toBe('<path d="target"/>');
    expect(result?.width).toBe(48);
    expect(result?.height).toBe(48);
  });

  it('resolves deep alias chains through @iconify/utils (no fixed depth cap)', () => {
    const aliases: NonNullable<IconifyJSON['aliases']> = {};
    for (let i = 1; i <= 11; i++) {
      aliases[`a${i}`] = { parent: i === 11 ? 'target' : `a${i + 1}` };
    }
    const set = makeCollection({
      icons: { target: { body: '<path d="target"/>', width: 24, height: 24 } },
      aliases,
    });
    // The old hand-rolled loop capped at 10 hops; getIconData resolves the full chain.
    const result = lookupIcon('mdi:a1', [set]);
    expect(result?.body).toBe('<path d="target"/>');
  });

  it('returns null for a cyclic alias chain instead of looping forever', () => {
    const set = makeCollection({
      icons: { x: { body: '<path d="x"/>' } },
      aliases: { a: { parent: 'b' }, b: { parent: 'a' } },
    });
    expect(lookupIcon('mdi:a', [set])).toBeNull();
  });

  it('returns null for an alias whose parent does not exist', () => {
    const set = makeCollection({
      aliases: { clock: { parent: 'missing' } },
    });
    expect(lookupIcon('mdi:clock', [set])).toBeNull();
  });

  it('returns null for an alias whose parent chain never resolves', () => {
    const set = makeCollection({
      aliases: {
        a1: { parent: 'a2' },
        a2: { parent: 'a3' },
        a3: { parent: 'ghost' },
      },
    });
    expect(lookupIcon('mdi:a1', [set])).toBeNull();
  });
});
