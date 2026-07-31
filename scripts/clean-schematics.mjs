#!/usr/bin/env node
// scripts/clean-schematics.mjs — removes the compiled schematics outDir so stale
// .js files from removed sources never linger in dist (tsc does not clean).
// Runs before tsc in the build:schematic chain; portable across platforms.
import { rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(repoRoot, 'dist/ngx-iconify-stack/schematics');

await rm(outDir, { recursive: true, force: true });
console.log(`✓ clean-schematics: removed ${outDir}`);
