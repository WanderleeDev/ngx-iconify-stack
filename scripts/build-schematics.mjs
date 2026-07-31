#!/usr/bin/env node
// scripts/build-schematics.mjs — post-processes the tsc schematics output into a
// consumable dist layout (see SDD design D1/D2). Idempotent; safe to re-run.
//
//   1. Copies collection.json + every schema.json from src/schematics into
//      dist/ngx-iconify-stack/schematics, preserving relative subdirectories
//      (tsc only emits .js — the JSON files are copied here).
//   2. Rewrites dist/ngx-iconify-stack/package.json:
//        - removes "type": "module"  (ng-packagr re-emits it every build; the
//          FESM bundle is fesm2022/*.mjs, so it stays ESM via explicit extension)
//        - adds "schematics": "./schematics/collection.json" so
//          `ng g ngx-iconify-stack:<name>` resolves the CJS collection.

import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcSchematicsDir = join(repoRoot, 'projects/ngx-iconify-stack/src/schematics');
const distSchematicsDir = join(repoRoot, 'dist/ngx-iconify-stack/schematics');
const distPkgJsonPath = join(repoRoot, 'dist/ngx-iconify-stack/package.json');

/** Recursively copy collection.json + schema.json, preserving relative paths. */
async function copySchematicsJson(srcDir, distDir) {
  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const relPath = relative(srcSchematicsDir, srcPath);
    if (entry.isDirectory()) {
      await copySchematicsJson(srcPath, distDir);
    } else if (entry.name === 'collection.json' || entry.name === 'schema.json') {
      const destPath = join(distDir, relPath);
      await mkdir(dirname(destPath), { recursive: true });
      await cp(srcPath, destPath);
    }
  }
}

await copySchematicsJson(srcSchematicsDir, distSchematicsDir);

const pkg = JSON.parse(await readFile(distPkgJsonPath, 'utf8'));
delete pkg.type;
pkg.schematics = './schematics/collection.json';
await writeFile(distPkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');

console.log('✓ build-schematics: JSON files copied, dist package.json patched');
