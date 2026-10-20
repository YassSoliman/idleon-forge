// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 1 stories through the full golden engine: the Rift (US-1, US-2, US-3 via the Detector
// examples), its page picture, and the stage stories (US-S1 locked stays silent on stage-w1-early, US-S2
// no World 4 finding on stage-w3-mid). The W4 test account is a local truth case, never here.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { goldenResult } from '../../src/golden';
import type { RiftPicture } from '../../src/pictures/w4-types';
import type { EngineResult, Goal } from '../../src/result';

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const STAGE_DIR = fileURLToPath(new URL('../../../knowledge/test/fixtures/m26/', import.meta.url));
const stageFixture = (id: string) => {
  const file = `${STAGE_DIR}${id}.json`;
  const now = (JSON.parse(readFileSync(file, 'utf8')) as { lastUpdated: number }).lastUpdated;
  return { id, kind: 'public' as const, file, now };
};
const run = (id: string): EngineResult => {
  const f = fixtures.find((x) => x.id === id) ?? stageFixture(id);
  return goldenResult({
    state: stateOf(f),
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

describe('stage stories', () => {
  it('US-S1: stage-w1-early has no World 4 core finding', () => {
    expect(goals(run('stage-w1-early')).filter((g) => W4_CORE.has(g.system))).toEqual([]);
  });
  it('US-S2: stage-w3-mid has no World 4 core finding', () => {
    expect(goals(run('stage-w3-mid')).filter((g) => W4_CORE.has(g.system))).toEqual([]);
  });
});
