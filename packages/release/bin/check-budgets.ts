// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Usage: node packages/release/bin/check-budgets.ts [dist dir, default apps/activeon/dist]
// Fails (exit 1) when dist/ breaks a TR-12 budget.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { checkBudgets, type DistFile, isMainChunk } from '../src/budgets.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const dist = process.argv[2] ?? join(root, 'apps/activeon/dist');

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
  );

const files: DistFile[] = walk(dist).map((abs) => {
  const path = relative(dist, abs).split(sep).join('/');
  const size = statSync(abs).size;
  return isMainChunk(path) ? { path, size, gzip: gzipSync(readFileSync(abs)).length } : { path, size };
});
const problems = checkBudgets(files);
const main = files.find((f) => isMainChunk(f.path));
console.log(`dist/: ${files.length} files; main chunk ${((main?.gzip ?? 0) / 1024).toFixed(1)} KB gzipped`);
for (const p of problems) console.log(`::error title=Budget::${p}`);
process.exit(problems.length ? 1 : 0);
