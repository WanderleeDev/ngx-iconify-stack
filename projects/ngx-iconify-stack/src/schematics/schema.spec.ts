import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface JsonSchema {
  properties?: Record<string, { type?: string; $default?: { $source?: string } }>;
  required?: string[];
}

function loadSchema(name: string): JsonSchema {
  const path = join(__dirname, name, 'schema.json');
  return JSON.parse(readFileSync(path, 'utf8')) as JsonSchema;
}

describe('schematic schema contract (multiproject safety)', () => {
  const ngAdd = loadSchema('ng-add');
  const generate = loadSchema('generate-icon-subset');

  it('ng-add requires an explicit project', () => {
    expect(ngAdd.required).toContain('project');
  });

  it('generate-icon-subset requires an explicit project', () => {
    expect(generate.required).toContain('project');
  });

  it('ng-add project resolves from the projectName context when available', () => {
    expect(ngAdd.properties?.['project']?.$default?.$source).toBe('projectName');
  });

  it('generate-icon-subset project resolves from the projectName context when available', () => {
    expect(generate.properties?.['project']?.$default?.$source).toBe('projectName');
  });

  it('ng-add project is a string option', () => {
    expect(ngAdd.properties?.['project']?.type).toBe('string');
  });

  it('generate-icon-subset project is a string option', () => {
    expect(generate.properties?.['project']?.type).toBe('string');
  });
});
