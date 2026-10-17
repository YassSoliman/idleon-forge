// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The build-time guards (M1 TR-1, TR-21). The real bundle runs them on every `pnpm build`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkChunk, checkFiles, PARSER_BANNER, WORKER_FILE } from '../bundle-guards';

const nm = '/repo/node_modules/.pnpm/firebase/node_modules';
const chunk = (modules: Record<string, string[]>, code = '') => ({
  fileName: 'assets/index-abc.js',
  code,
  modules: Object.fromEntries(Object.entries(modules).map(([id, e]) => [id, { renderedExports: e }])),
});

describe('checkChunk', () => {
  it('passes the read-only APIs the app uses', () => {
    expect(
      checkChunk(
        chunk({
          [`${nm}/@firebase/firestore/dist/index.esm.js`]: ['getDoc', 'onSnapshot', 'doc'],
          [`${nm}/@firebase/database/dist/index.esm.js`]: ['get', 'child', 'ref', 'goOnline'],
        }),
      ),
    ).toEqual([]);
  });

  it.each([
    ['@firebase/firestore', 'setDoc'],
    ['@firebase/firestore', 'writeBatch'],
    ['@firebase/database', 'set'],
    ['@firebase/database', 'push'],
    ['firebase/database', 'remove'],
  ])('fails on %s %s', (pkg, name) => {
    const dir = pkg.startsWith('@') ? `${pkg}/dist/index.esm.js` : `${pkg}/dist/esm/index.esm.js`;
    expect(checkChunk(chunk({ [`${nm}/${dir}`]: ['get', name] }))).toEqual([
      expect.stringContaining(`write API ${pkg.split('/')[1]}.${name}`),
    ]);
  });

  it('fails on any firebase/functions module', () => {
    expect(checkChunk(chunk({ [`${nm}/@firebase/functions/dist/index.esm.js`]: [] }))).toHaveLength(1);
  });

  it('fails when a UI chunk carries the parser runtime', () => {
    expect(checkChunk(chunk({ '/repo/packages/toolbox-parsers/dist/index.js': ['parseSave'] }))).toHaveLength(
      1,
    );
    expect(checkChunk(chunk({}, `/*! ${PARSER_BANNER}. GPL */`))).toHaveLength(1);
  });
});

describe('checkFiles', () => {
  const code = (name: string) => (name.includes('worker') ? `/*! ${PARSER_BANNER} */` : '');
  it('wants exactly one parse worker at the path _headers locks down', () => {
    expect(checkFiles(['assets/index-a.js', 'assets/parse.worker-2d_Px0YR.js'], code)).toEqual([]);
    expect(checkFiles(['assets/index-a.js'], code)).toHaveLength(1);
    expect(checkFiles(['assets/workers/parse.worker-x.js'], code)).toHaveLength(1);
  });

  it('matches the worker rule in public/_headers', () => {
    const headers = readFileSync(fileURLToPath(new URL('../public/_headers', import.meta.url)), 'utf8');
    expect(headers).toContain('/assets/parse.worker-*');
    expect(WORKER_FILE.test('assets/parse.worker-2d_Px0YR.js')).toBe(true);
    const workerRule = headers.split('/assets/parse.worker-*')[1] ?? '';
    expect(workerRule).toMatch(/connect-src 'none'/);
  });
});
