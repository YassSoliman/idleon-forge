// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Prints the content digest of vendor/data/ (M12 TR-15 step 4): the SHA-256 of the sorted
// "<sha256>  <relative path>" listing of every file, the .commit stamp excluded. UPSTREAM pins it as
// dataDigest=, so vendor/data/ (gitignored, never in a diff) is pinned by content and a poisoned cache
// entry can't pass as the real data (RT-2). Usage: node scripts/data-digest.mjs [dir]
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const dir = process.argv[2] ?? new URL('../vendor/data', import.meta.url).pathname;
const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)],
  );
const lines = walk(dir)
  .map((abs) => relative(dir, abs).split(sep).join('/'))
  .filter((p) => p !== '.commit')
  .sort()
  .map(
    (p) =>
      `${createHash('sha256')
        .update(readFileSync(join(dir, p)))
        .digest('hex')}  ${p}`,
  );
if (!lines.length) {
  console.error(`no files under ${dir}`);
  process.exit(1);
}
console.log(
  createHash('sha256')
    .update(`${lines.join('\n')}\n`)
    .digest('hex'),
);
