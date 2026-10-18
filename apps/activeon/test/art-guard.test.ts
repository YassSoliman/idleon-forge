// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// ADR 0009 guard (M21 TR-4): every motif the app can draw comes from a file of our own in
// docs/design-lab/art, listed in MANIFEST.json with a matching sha256; no game sprite (the Lab's ref/)
// is anywhere in the repo; and the generated modules are current (the importer's --check).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { motifs as core } from '../src/design/art/core';
import { ART_INDEX, CORE_NAMES } from '../src/design/art/names';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const ART = join(ROOT, 'docs/design-lab/art');
const manifest = JSON.parse(readFileSync(join(ART, 'MANIFEST.json'), 'utf8')) as {
  files: Record<string, string>;
};
const sha = (file: string) =>
  createHash('sha256')
    .update(readFileSync(join(ART, file)))
    .digest('hex');

describe('ADR 0009 art guard', () => {
  const ids = Object.keys(ART_INDEX);

  it('every generated motif has a source file listed in MANIFEST.json with a matching sha256', () => {
    expect(ids.length).toBeGreaterThan(200);
    for (const id of ids) {
      const file = `${id}.svg`;
      expect(manifest.files[file], `${file} missing from MANIFEST.json`).toBeTypeOf('string');
      expect(sha(file), `${file} changed since MANIFEST.json`).toBe(manifest.files[file]);
    }
  });

  it('every SVG in the archive is in the manifest, and nothing else is', () => {
    const svgs = readdirSync(ART).filter((f) => f.endsWith('.svg'));
    expect(Object.keys(manifest.files).sort()).toEqual(svgs.sort());
    expect(svgs.map((f) => f.replace(/\.svg$/, '')).sort()).toEqual([...ids].sort());
  });

  it('the core motifs are exactly the ones names.ts marks core', () => {
    expect(Object.keys(core).sort()).toEqual([...CORE_NAMES].sort());
    for (const id of CORE_NAMES) expect(ART_INDEX[id][2]).toBe('core');
  });

  it('no path in the repo contains design-lab/ref (game sprites are never copied)', () => {
    const skip = new Set(['node_modules', '.git', 'dist', '.cache', 'vendor', '.wrangler', '.claude']);
    const hits: string[] = [];
    const walk = (dir: string, rel: string) => {
      for (const name of readdirSync(dir)) {
        if (skip.has(name)) continue;
        const r = rel ? `${rel}/${name}` : name;
        if (/design-lab\/ref(\/|$)/.test(r)) hits.push(r);
        const abs = join(dir, name);
        if (statSync(abs).isDirectory()) walk(abs, r);
      }
    };
    walk(join(ROOT, 'docs'), 'docs');
    walk(join(ROOT, 'apps'), 'apps');
    walk(join(ROOT, 'scripts'), 'scripts');
    expect(hits).toEqual([]);
  });

  it('the generated art modules are current (scripts/art/import.mjs --check)', () => {
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts/art/import.mjs'), '--check'], {
      encoding: 'utf8',
    });
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
  }, 30_000);
});
