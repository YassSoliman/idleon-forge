// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 6 (FR-55): the Minigames and Poppy Milestone ladders and Poppy's prestige Checks, as M6's
// module renders them (US-68). The ladders come from generated parents (`extends`), inlined here the
// way `kb compile` inlines them.
import { readFileSync } from 'node:fs';
import type { Entry } from '@idleon-forge/knowledge';
import { detectors } from '@idleon-forge/knowledge/detectors';
import { withAccount } from '@idleon-forge/knowledge/helpers';
import { describe, expect, it } from 'vitest';
import { createUnspentModule } from '../../src/unspent';
import { input, publicState } from '../core/helpers';
import { loadKb } from '../metapath/helpers';

const base = loadKb();
const generated = JSON.parse(
  readFileSync(new URL('../../../knowledge/generated/minigames.json', import.meta.url), 'utf8'),
) as { entries: Entry[] };
const parents = new Map(generated.entries.map((e) => [e.id, e]));
const entries = Object.fromEntries(
  Object.entries(base.entries).map(([id, e]) => {
    const parent = e.type === 'goal' && e.extends ? parents.get(e.extends) : undefined;
    return [id, parent?.type === 'goal' ? { ...e, milestones: parent.milestones } : e];
  }),
) as Record<string, Entry>;
const m6 = createUnspentModule({ kb: { ...base, entries }, registry: detectors });

const texts = (s: ReturnType<typeof publicState>, system: string) =>
  (m6.run(input(s, { now: s.account.lastCloudSave as number })).account?.goals ?? [])
    .filter((g) => g.goal.system === system)
    .map((g) => g.goal.nextAction.text);

describe('first.json (W4-entry)', () => {
  const s = publicState('first.json');
  it('US-68: Spiketrap best round 2, the Tome highscore at 350 of 450, the unlock ladders', () => {
    expect(texts(s, 'minigames')).toEqual(
      expect.arrayContaining([
        'Reach round 13 in Spiketrap Surprise (best 2)',
        'Raise your minigame highscores to 450 in total (350 now)',
      ]),
    );
  });
  it('Poppy never reached: no Poppy line at all', () => {
    expect(texts(s, 'poppy')).toEqual([]);
  });
  it('US-68 m:first-poppy: a Fisheroo Reset the fish cover', () => {
    const p = s.account.poppy;
    if (!p?.upgrades) throw new Error('no pond');
    const pond = {
      ...p,
      unlocked: true,
      totalFish: 5e7,
      fish: 5e7,
      upgrades: p.upgrades.map((u) =>
        u.name === 'Fisheroo Reset' ? { ...u, unlocked: true, cost: 4e7 } : u,
      ),
    };
    expect(texts(withAccount(s, { poppy: pond }), 'poppy')).toEqual(
      expect.arrayContaining(['Fisheroo Reset 1 is affordable at Poppy']),
    );
  });
});

describe('highend.json (past W4)', () => {
  const s = publicState('highend.json');
  it('every ladder it has finished says nothing; Pen Pals 183 is short of 200', () => {
    expect(texts(s, 'minigames').filter((t) => /highscores to|Spiketrap Surprise|Pen Pals/.test(t))).toEqual([
      'Pen Pals highscore 200 opens a critter gain bonus (183 now)',
    ]);
    expect(texts(s, 'poppy').filter((t) => t.startsWith('Megafish'))).toEqual([]);
  });
});
