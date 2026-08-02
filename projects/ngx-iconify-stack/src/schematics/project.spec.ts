import { pickProjectName, toRelativeImport } from './project';

describe('pickProjectName', () => {
  const libFirst = [
    ['ngx-iconify-stack', { extensions: { projectType: 'library' } }],
    ['docs', { extensions: { projectType: 'application' } }],
  ] as const;

  const adminClient = [
    ['client', { extensions: { projectType: 'application' } }],
    ['admin', { extensions: { projectType: 'application' } }],
    ['shared', { extensions: { projectType: 'library' } }],
  ] as const;

  it('uses the explicit project when provided', () => {
    expect(pickProjectName(libFirst, 'docs')).toBe('docs');
    expect(pickProjectName(adminClient, 'admin')).toBe('admin');
  });

  it('throws when the explicit project is missing', () => {
    expect(() => pickProjectName(libFirst, 'missing')).toThrow(
      /Project "missing" not found/,
    );
  });

  it('prefers the first application over an earlier library (multiproject bug)', () => {
    // Same shape as this workspace: library listed before the docs app.
    expect(pickProjectName(libFirst)).toBe('docs');
  });

  it('picks the first application when several apps exist', () => {
    expect(pickProjectName(adminClient)).toBe('client');
  });

  it('falls back to the first project when no application exists', () => {
    const libsOnly = [
      ['core', { extensions: { projectType: 'library' } }],
      ['ui', { extensions: { projectType: 'library' } }],
    ] as const;
    expect(pickProjectName(libsOnly)).toBe('core');
  });

  it('throws when the workspace has no projects', () => {
    expect(() => pickProjectName([])).toThrow(/No projects found/);
  });
});

describe('toRelativeImport', () => {
  it('resolves app.config.ts → ngx-iconify/icon-subset (docs layout)', () => {
    expect(
      toRelativeImport(
        'projects/docs/src/app/app.config.ts',
        'projects/docs/src/ngx-iconify/icon-subset.ts',
      ),
    ).toBe('../ngx-iconify/icon-subset');
  });

  it('resolves main.ts → ngx-iconify/icon-subset', () => {
    expect(
      toRelativeImport('src/main.ts', 'src/ngx-iconify/icon-subset.ts'),
    ).toBe('./ngx-iconify/icon-subset');
  });

  it('strips a leading slash from tree paths', () => {
    expect(
      toRelativeImport('/src/app/app.config.ts', '/src/ngx-iconify/icon-subset.ts'),
    ).toBe('../ngx-iconify/icon-subset');
  });
});
