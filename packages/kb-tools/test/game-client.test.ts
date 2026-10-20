// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-2b: game-client Sources (ADR 0004 amendment): the schema's shape rules, and kb check's
// excerpt and build rules, on throwaway trees; plus the recorded V43 build.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Source } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { checkSource } from '../src/check';
import { readBuilds } from '../src/game-client';
import { formatIssue } from '../src/issues';
import { layoutOf, loadSource } from '../src/load';
import { entry, file, kbTree, testRegistries } from './kb-tree';

const CLIENT = 'https://legendsofidleon.com/ytGl5oc/N.js';
const BUILD = '42da3130082762cfe4650212fccbf51d7982175ee91778ef3b202fcb33b8b204';
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const base = { url: CLIENT, title: 'Game client', verified: '2026-10-19', gameVersion: '2.3.540' };
const client = { sha256: BUILD, lastModified: '2026-10-17' };

describe('Source schema (M26 FR-2b)', () => {
  it('a tier 1 game-client read needs the excerpt hash and the client build', () => {
    expect(Source.safeParse({ ...base, tier: 1, excerptSha256: sha('x'), clientBuild: client }).success).toBe(
      true,
    );
    expect(Source.safeParse({ ...base, tier: 1 }).success).toBe(false);
    expect(Source.safeParse({ ...base, tier: 1, excerptSha256: sha('x') }).success).toBe(false);
    // Before its build is matched, a client read is tier 4: allowed without them.
    expect(Source.safeParse({ ...base, tier: 4 }).success).toBe(true);
  });

  it('the client fields belong to game-client Sources only; other tier 1 URLs stay Toolbox permalinks', () => {
    const toolbox =
      'https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/x.ts';
    expect(Source.safeParse({ ...base, url: toolbox, tier: 1, excerptSha256: sha('x') }).success).toBe(false);
    expect(Source.safeParse({ ...base, url: 'https://example.com/N.js', tier: 1 }).success).toBe(false);
    expect(Source.safeParse({ ...base, url: toolbox, tier: 1 }).success).toBe(true);
  });
});

describe('kb check on game-client Sources (M26 FR-2b)', () => {
  const excerpt = 'GenINFO[53] example excerpt';
  const src = (h: string, extra = '') =>
    `{ url: "${CLIENT}", title: Game client, tier: 1, verified: 2026-10-19, gameVersion: 2.3.540, excerptSha256: ${h}, clientBuild: { sha256: ${BUILD}, lastModified: 2026-10-17 }${extra} }`;
  const tree = (h: string, store: Record<string, string>, builds: unknown[]) => {
    const root = kbTree({
      'systems/afk.yaml': file(
        'afk',
        entry({
          id: 'afk.check.client',
          system: 'afk',
          type: 'check',
          subject: 'account',
          effect: 'next-action',
          confidence: 'M',
          status: 'draft',
          detector: '{ id: afk/not-built }',
          sources: `[${src(h)}]`,
        }),
      ),
    });
    const dir = layoutOf(root).gameClientDir;
    mkdirSync(path.join(dir, 'excerpts'), { recursive: true });
    for (const [name, body] of Object.entries(store)) writeFileSync(path.join(dir, 'excerpts', name), body);
    writeFileSync(path.join(dir, 'builds.json'), JSON.stringify({ builds }));
    return root;
  };
  const row = {
    url: CLIENT,
    sha256: BUILD,
    bytes: 1,
    lastModified: '2026-10-17',
    gameVersion: '2.3.540',
    verified: '2026-10-19',
    evidence: [],
  };
  const errors = async (root: string) =>
    (await checkSource(loadSource(root), testRegistries()))
      .filter((i) => i.level === 'error' && !i.message.includes('orphan'))
      .map(formatIssue);

  it('passes a stored, matching excerpt of a recorded, matched build', async () => {
    expect(await errors(tree(sha(excerpt), { [`${sha(excerpt)}.txt`]: excerpt }, [row]))).toEqual([]);
  });

  it('fails a missing or edited excerpt, an unknown build and an unmatched one', async () => {
    const h = sha(excerpt);
    expect((await errors(tree(h, {}, [row]))).join()).toMatch(/is not stored/);
    expect((await errors(tree(h, { [`${h}.txt`]: `${excerpt}!` }, [row]))).join()).toMatch(
      /does not match its hash/,
    );
    expect((await errors(tree(h, { [`${h}.txt`]: excerpt }, []))).join()).toMatch(
      /not recorded in builds\.json/,
    );
    expect(
      (await errors(tree(h, { [`${h}.txt`]: excerpt }, [{ ...row, gameVersion: null }]))).join(),
    ).toMatch(/not matched to a game version \(V43\)/);
  });
});

describe('the recorded client build (V43)', () => {
  it('N.js is recorded, matched to 2.3.540', () => {
    const b = readBuilds(layoutOf().gameClientDir).find((x) => x.sha256 === BUILD);
    expect(b).toMatchObject({ gameVersion: '2.3.540', lastModified: '2026-10-17', bytes: 26391628 });
  });
});
