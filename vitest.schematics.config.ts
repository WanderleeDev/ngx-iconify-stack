import { defineConfig } from 'vitest/config';

/**
 * Vitest config for schematics tests (SchematicTestRunner integration suite).
 * Runs against the COMPILED dist collection, so build:schematic must run first
 * (the test:schematic npm script chains both).
 */
export default defineConfig({
  test: {
    include: ['projects/ngx-iconify-stack/src/schematics/**/*.spec.ts'],
    environment: 'node',
  },
});
