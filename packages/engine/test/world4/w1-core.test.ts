// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 1 stories through the full golden engine: the Rift (US-1, US-2, US-3 via the Detector
// examples), its page picture, and the stage stories (US-S1 locked stays silent on stage-w1-early, US-S2
// no World 4 finding on stage-w3-mid). The W4 test account is a local truth case, never here.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AccountState } from '@idleon-forge/account-state';
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { goldenResult } from '../../src/golden';
import type { ElitePicture, RiftPicture, TomePicture } from '../../src/pictures/w4-types';
import type { EngineResult, Goal } from '../../src/result';

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const STAGE_DIR = fileURLToPath(new URL('../../../knowledge/test/fixtures/m26/', import.meta.url));
const stageFixture = (id: string) => {
  const file = `${STAGE_DIR}${id}.json`;
  const now = (JSON.parse(readFileSync(file, 'utf8')) as { lastUpdated: number }).lastUpdated;
  return { id, kind: 'public' as const, file, now };
};
const run = (id: string, edit: (s: AccountState) => AccountState = (s) => s): EngineResult => {
  const f = fixtures.find((x) => x.id === id) ?? stageFixture(id);
  return goldenResult({
    state: edit(stateOf(f)),
    kb: ctx.kb,
    registries: ctx.registries,
    now: f.now,
    expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
  });
};
const goals = (r: EngineResult): Goal[] => [...r.account.goals, ...r.characters.flatMap((c) => c.goals)];
const W4_CORE = new Set(['rift', 'lab', 'breeding', 'cooking', 'tome', 'elite-classes']);
const rift = (r: EngineResult) => r.slotPictures?.find((p): p is RiftPicture => p.kind === 'rift') ?? null;

describe('the Rift', () => {
  it('first.json (W4-entry, locked): the unlock step stays on though the Rift reads locked', () => {
    const r = run('first');
    const g = goals(r).find((x) => x.id === 'rift.check.unlock-quest');
    expect(g?.nextAction.text).toBe("Finish the Rift Ripper's quest 'Entering The Rift...' in World 4");
    expect(g?.nextAction.why).toContain(
      'Still to find: 0 Lost Batteries, 0 Purple Mush Cap and 592 Wurm Tail',
    );
    expect(goals(r).filter((x) => x.system === 'rift')).toHaveLength(1);
    expect(rift(r)?.unlocked).toBe(false);
    expect(rift(r)?.quest.map((q) => q.need)).toEqual([5, 878, 592]);
  });
  it('fourth.json (level 2 done): play the three-character task, shown as Rift 3', () => {
    const r = run('fourth');
    const g = goals(r).find((x) => x.system === 'rift');
    expect(g?.id).toBe('rift.check.active-task');
    expect(g?.nextAction.text).toBe('Play Rift level 3: Defeat all mobs before they respawn on 3 characters');
    const p = rift(r);
    expect(p?.label).toBe('Rift 3');
    expect(p?.current?.kind).toBe('On 3 characters');
    expect(p?.upcoming).toHaveLength(10);
    expect(p?.bonuses).toHaveLength(12);
    expect(p?.nextBonus).toEqual({ name: 'Trap Box Vacuum', shown: 6, label: 'Rift 6', levelsToGo: 3 });
    // Level 8 (stored 7) is an Orb score on a Divine Knight, and fourth.json has none.
    expect(p?.upcoming.find((l) => l.shown === 8)?.gate).toEqual({ elite: 'Divine Knight', owned: false });
  });
  it('highend.json (all 65 levels): nothing to do, every bonus open', () => {
    const r = run('highend');
    expect(goals(r).filter((x) => x.system === 'rift')).toEqual([]);
    expect(rift(r)?.current).toBeNull();
    expect(rift(r)?.bonuses.every((b) => b.unlocked)).toBe(true);
  });
});

describe('Elite classes', () => {
  // US-12: a Siege Breaker set back to Bowman, 3 Greenie Gang kills in.
  const bowman = (s: AccountState): AccountState => ({
    ...s,
    characters: s.characters.map((c) =>
      c.index === 2
        ? {
            ...c,
            class: 'Bowman',
            classIndex: 20,
            eliteStep: { step: 'gang', elite: 'Siege_Breaker', gangKills: 3 },
          }
        : c,
    ),
  });
  it('one card per character: the Eliteus step owns it, the Meta Path goal is its detail line', () => {
    const r = run('first', bowman);
    const c2 = r.characters.find((c) => c.index === 2)?.goals ?? [];
    const g = c2.find((x) => x.id === 'elite-classes.check.eliteus');
    expect(g?.nextAction.text).toBe('Beat the Greenie Gang at Eliteus for your Siege Breaker class');
    expect(g?.nextAction.why).toContain('(3 done, 7 to go)');
    expect(c2.some((x) => x.id === 'metapath.goal.elite')).toBe(false);
    const pic = r.slotPictures?.find((p): p is ElitePicture => p.kind === 'elite');
    expect(pic?.elites.find((e) => e.elite === 'Siege_Breaker')?.onTheWay).toEqual([
      { index: 2, step: 'gang', kills: 3 },
    ]);
    expect(pic?.elites.find((e) => e.elite === 'Divine_Knight')?.riftGates).toEqual([
      'Rift 8',
      'Rift 18',
      'Rift 29',
      'Rift 43',
    ]);
  });
  it('first.json as saved: every subclass is promoted, so no Eliteus card', () => {
    expect(goals(run('first')).filter((g) => g.system === 'elite-classes')).toEqual([]);
  });
});

describe('the Tome', () => {
  const tome = (r: EngineResult) => r.slotPictures?.find((p): p is TomePicture => p.kind === 'tome') ?? null;
  it('US-11 first.json: 2,286 PTS from 7 of 124 metrics, the next gates listed', () => {
    const t = tome(run('first'));
    expect(t?.points).toBe(2286);
    expect(t?.counted).toBe(7);
    expect(t?.total).toBe(124);
    expect(t?.nextUnlocks.map((u) => u.lvReq)).toEqual([630, 670, 710]);
    expect(t?.nextUnlocks[0]?.levelsToGo).toBe(28);
  });
  it('US-11 below Account LV 350: nothing counts, every row "not counting yet"', () => {
    const r = run('first', (s) => ({
      ...s,
      account: {
        ...s.account,
        tome: s.account.tome ? { ...s.account.tome, accountLevel: 300, totalPoints: 0 } : null,
      },
    }));
    expect(tome(r)?.counted).toBe(0);
    expect(tome(r)?.rows.every((x) => !x.counting)).toBe(true);
  });
});

describe('Breeding and Cooking', () => {
  it('US-7 highend.json: the nest is full, so it says so first', () => {
    const g = goals(run('highend')).find((x) => x.id === 'breeding.check.full-nest');
    expect(g?.nextAction.text).toBe('Your nest is full (15 of 15): hatch or trash an egg');
  });
  it('US-9 first.json with Kitchen 2 stopped: start the meal closest to its next level there', () => {
    const r = run('first', (s) => ({
      ...s,
      account: {
        ...s.account,
        cooking: s.account.cooking
          ? {
              ...s.account.cooking,
              kitchens: s.account.cooking.kitchens.map((k) =>
                k.index === 1 ? { ...k, status: 'idle' as const, meal: null } : k,
              ),
            }
          : null,
      },
    }));
    const g = goals(r).find((x) => x.id === 'cooking.check.idle-kitchen');
    expect(g?.nextAction.text).toMatch(/^Start .+ in Kitchen 2$/);
  });
  it('first.json as saved: no Breeding or Cooking card', () => {
    expect(goals(run('first')).filter((g) => g.system === 'breeding' || g.system === 'cooking')).toEqual([]);
  });
});

describe('stage stories', () => {
  it('US-S1: stage-w1-early has no World 4 core finding', () => {
    expect(goals(run('stage-w1-early')).filter((g) => W4_CORE.has(g.system))).toEqual([]);
  });
  it('US-S2: stage-w3-mid has no World 4 core finding', () => {
    expect(goals(run('stage-w3-mid')).filter((g) => W4_CORE.has(g.system))).toEqual([]);
  });
});
