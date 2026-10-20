// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-2c: the two-Source rule for judgment, on throwaway trees, and the shrink-only debt list.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkSource } from '../src/check';
import { loadSource } from '../src/load';
import { supportingSites } from '../src/two-source';
import { entry, file, kbTree, SRC1, testRegistries } from './kb-tree';

const wiki = (date: string) =>
  `{ url: https://idleon.wiki/wiki/Alchemy, title: wiki, tier: 2, claimDate: ${date}, verified: 2026-10-19, gameVersion: 2.3.540 }`;
const reddit = (date: string) =>
  `{ url: https://www.reddit.com/r/idleon/comments/2/, title: thread, tier: 3, claimDate: ${date}, verified: 2026-10-19, gameVersion: 2.3.540 }`;
const own = `{ url: https://github.com/YassSoliman/idleon-forge/blob/main/docs/x.md, title: ours, tier: 3, claimDate: 2026-10-01, verified: 2026-10-19, gameVersion: 2.3.540 }`;
const MAJORS = 'majors:\n  - { gameVersion: 1.20.0, date: 2026-08-26, what: test }\n';

const list = (sources: string, status = 'active') =>
  entry({
    id: 'metapath.priority.order-x',
    system: 'metapath',
    type: 'priority',
    list: 'block',
    confidence: 'M',
    status,
    sources: `[${sources}]`,
    tiers: '[[alchemy.check.slot]]',
  });
const slot = entry({
  id: 'alchemy.check.slot',
  system: 'alchemy',
  type: 'check',
  subject: 'character',
  effect: 'next-action',
  confidence: 'M',
  detector: '{ id: afk/no-target }',
});
const issuesOf = async (sources: string, debt?: string[], status?: string) => {
  const root = kbTree({
    'majors.yaml': MAJORS,
    'systems/alchemy.yaml': file('alchemy', slot),
    'systems/metapath.yaml': file('metapath', list(sources, status)),
  });
  if (debt) writeFileSync(path.join(root, 'two-source-debt.json'), JSON.stringify({ ids: debt }));
  return (await checkSource(loadSource(root), testRegistries())).filter((i) =>
    i.code?.startsWith('two-source'),
  );
};

describe('the two-Source rule (M26 FR-2c)', () => {
  it('counts tier 2-3 Sources dated on or after the newest major, one per site, never tier 1 or our own notes', () => {
    const s = (url: string, tier: number, claimDate?: string) => ({ url, tier, claimDate });
    expect(
      supportingSites(
        [
          s('https://idleon.wiki/wiki/A', 2, '2026-09-01'),
          s('https://idleon.wiki/wiki/B', 2, '2026-09-02'),
          s('https://www.reddit.com/r/idleon/1', 3, '2026-08-25'),
          s('https://github.com/Morta1/IdleonToolbox/blob/x', 1),
          s('https://github.com/YassSoliman/idleon-forge/blob/main/x.md', 3, '2026-10-01'),
        ],
        '2026-08-26',
      ),
    ).toEqual(['idleon.wiki']);
  });

  it('passes two independent post-patch Sources; fails one site, an old date, tier 1 or our own notes', async () => {
    expect(await issuesOf(`${wiki('2026-09-01')}, ${reddit('2026-09-15')}`)).toEqual([]);
    for (const bad of [
      wiki('2026-09-01'),
      `${wiki('2026-09-01')}, ${reddit('2026-08-01')}`,
      `${SRC1}, ${wiki('2026-09-01')}`,
      `${own}, ${wiki('2026-09-01')}`,
    ])
      expect((await issuesOf(bad)).map((i) => i.code)).toEqual(['two-source']);
  });

  it('a draft is not checked; a listed debt entry passes until it is fixed, then must come off the list', async () => {
    expect(await issuesOf(wiki('2026-09-01'), undefined, 'draft')).toEqual([]);
    expect(await issuesOf(wiki('2026-09-01'), ['metapath.priority.order-x'])).toEqual([]);
    const fixed = await issuesOf(`${wiki('2026-09-01')}, ${reddit('2026-09-15')}`, [
      'metapath.priority.order-x',
    ]);
    expect(fixed.map((i) => i.message)).toEqual([expect.stringMatching(/passes the two-Source rule now/)]);
    const gone = await issuesOf(`${wiki('2026-09-01')}, ${reddit('2026-09-15')}`, ['nobody.priority.gone']);
    expect(gone.map((i) => i.message)).toEqual([expect.stringMatching(/is not in the Knowledge Base/)]);
  });
});
