// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The bundle-time data trims (scripts/bundle.mjs DATA_TRIMS). A trim is safe only while the parsers
// read no more of the file than it keeps, so this pins who imports each trimmed file and the code
// that reads it, checks that every data file the parsers import still ships, and parses every public
// save with the trimmed and the untrimmed bundle and requires identical output.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build, type Metafile } from 'esbuild';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bundleOptions, DATA_TRIMS, root } from '../scripts/bundle.mjs';

const vendor = path.join(root, 'vendor');
const websiteData = path.join(vendor, 'data/website-data');
const FIXTURES = path.resolve(root, '../account-state/fixtures/public');

/** Every vendored source file (parsers/, utility/, polyfills.js), relative to vendor/. */
function vendorSources(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.[cm]?[jt]sx?$/.test(name)) out.push(path.relative(vendor, full).split(path.sep).join('/'));
    }
  };
  walk(path.join(vendor, 'parsers'));
  walk(path.join(vendor, 'utility'));
  return [...out, 'polyfills.js'].sort();
}

/** The names a file imports from '@website-data' (named imports, multi-line included). */
function websiteDataImports(text: string): string[] {
  const names: string[] = [];
  for (const m of text.matchAll(/import\s*(type\s+)?\{([^}]*)\}\s*from\s*['"]@website-data['"]/g)) {
    if (m[1]) continue;
    for (const part of (m[2] as string).split(',')) {
      const name = part
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)[0];
      if (name && !part.trim().startsWith('type ')) names.push(name);
    }
  }
  return names;
}

describe('data trims: who reads a trimmed file', () => {
  const sources = vendorSources();
  const text = new Map(sources.map((f) => [f, readFileSync(path.join(vendor, f), 'utf8')]));

  it('no vendored file reaches website-data except through the @website-data alias', () => {
    const direct = /(?:from\s*|import\s*\(\s*|require\s*\(\s*)['"](?!@website-data['"])[^'"]*website-data/;
    for (const [f, t] of text) expect(t, f).not.toMatch(direct);
  });

  for (const [file, trim] of Object.entries(DATA_TRIMS)) {
    const exportName = file.replace(/\.json$/, '');

    it(`${file}: only ${trim.importers.join(', ')} import it`, () => {
      const index = readFileSync(path.join(websiteData, 'index.js'), 'utf8');
      // Re-exported as its own name and nothing else reads the file inside website-data.
      expect(index).toContain(`export { default as ${exportName} } from './${file}';`);
      expect(index.split(`./${file}`).length - 1).toBe(1);
      const importers = sources.filter((f) => websiteDataImports(text.get(f) as string).includes(exportName));
      expect(importers).toEqual(trim.importers);
      // No namespace import of @website-data anywhere, which would read every file.
      for (const [f, t] of text)
        expect(t, f).not.toMatch(/import\s*\*\s*as\s+\w+\s+from\s*['"]@website-data/);
    });

    it(`${file}: the code that reads it is the code the trim was checked against`, () => {
      for (const f of trim.importers) {
        const t = text.get(f) as string;
        expect(t, `${f} changed how it reads ${exportName}; re-check DATA_TRIMS`).toContain(trim.reads);
        // Every mention of the name is the import or inside the pinned code.
        const mentions = t.split(new RegExp(`\\b${exportName}\\b`)).length - 1;
        const pinned = trim.reads.split(new RegExp(`\\b${exportName}\\b`)).length - 1;
        expect(mentions, `${f} reads ${exportName} somewhere new; re-check DATA_TRIMS`).toBe(pinned + 1);
      }
    });
  }
});

describe('data trims: the bundle parses exactly as without them', () => {
  let dir: string;
  const metas: Record<'trimmed' | 'full', Metafile> = {} as never;
  const files: Record<'trimmed' | 'full', string> = {} as never;

  beforeAll(async () => {
    dir = mkdtempSync(path.join(tmpdir(), 'parser-trims-'));
    for (const kind of ['trimmed', 'full'] as const) {
      files[kind] = path.join(dir, `${kind}.js`);
      const { options } = bundleOptions({ outfile: files[kind], trimData: kind === 'trimmed' });
      metas[kind] = (await build({ ...options, logLevel: 'silent' })).metafile;
    }
  }, 120_000);
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('every data file the parsers import still ships, and the trims make the bundle smaller', () => {
    const data = (m: Metafile) => Object.keys(m.inputs).filter((i) => i.includes('website-data/'));
    expect(data(metas.trimmed).sort()).toEqual(data(metas.full).sort());
    for (const file of Object.keys(DATA_TRIMS))
      expect(data(metas.trimmed).some((i) => i.endsWith(`website-data/${file}`))).toBe(true);
    // Every name the parsers import from @website-data is one index.js exports.
    const index = readFileSync(path.join(websiteData, 'index.js'), 'utf8');
    for (const f of vendorSources())
      for (const name of websiteDataImports(readFileSync(path.join(vendor, f), 'utf8')))
        expect(index, `${f} imports ${name}`).toMatch(new RegExp(`\\b${name}\\b`));
    const size = (m: Metafile) => (Object.values(m.outputs)[0] as { bytes: number }).bytes;
    expect(size(metas.trimmed)).toBeLessThan(size(metas.full));
  });

  it('parses every public save to identical output', () => {
    // Plain Node, one process per bundle: each one patches built-in prototypes when it loads.
    const run = (bundle: string) =>
      execFileSync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `
          import { readdirSync, readFileSync } from 'node:fs';
          import { createHash } from 'node:crypto';
          const { normalizeEnvelope, parseSave } = await import(${JSON.stringify(`file://${bundle}`)});
          const dir = ${JSON.stringify(FIXTURES)};
          const out = {};
          for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
            const env = normalizeEnvelope(JSON.parse(readFileSync(dir + '/' + f, 'utf8')));
            for (const now of [Date.UTC(2026, 9, 17, 12), Date.UTC(2027, 0, 1)]) {
              const text = JSON.stringify(parseSave(env, { now }));
              out[f + '@' + now] = [text.length, createHash('sha256').update(text).digest('hex')];
            }
          }
          console.log(JSON.stringify(out));
          `,
        ],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
      );
    const trimmed = JSON.parse(run(files.trimmed));
    const full = JSON.parse(run(files.full));
    expect(Object.keys(full).length).toBeGreaterThan(10);
    expect(trimmed).toEqual(full);
  }, 300_000);
});
