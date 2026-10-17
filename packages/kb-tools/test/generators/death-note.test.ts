// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator from '@idleon-forge/knowledge/generators/death-note.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

describe('death-note generator', () => {
  it('builds a ladder per monster from the rank table, 1-based worlds (synthetic slice, hand-checked)', () => {
    const out = runOnSlice(
      generator,
      {
        deathNote: [{ rawName: 'poopSmall', name: 'Poop', world: 0 }],
        ninjaExtraInfo: Object.assign([], { 30: ['slimeB'] }),
        monsters: { poopSmall: { Name: 'Poop' }, slimeB: { Name: 'Glunko_The_Massive' } },
      },
      {
        DEATH_NOTE_RANKS: [
          [25e3, 1],
          [12e4, 2],
        ],
        MINI_BOSS_DEATH_NOTE_RANKS: [[100, 1]],
        ECLIPSE_SKULL_KILLS: 1e9,
        ECLIPSE_SKULL_RANK: 20,
      },
    );
    const poop = out.entries?.find((e) => e.id === 'death-note.goal.poop-small');
    expect(poop?.type === 'goal' && poop.milestones).toEqual([
      { at: 25000, reward: 'rank 1' },
      { at: 120000, reward: 'rank 2' },
    ]);
    expect(poop?.values).toEqual({ monster: 'poopSmall', world: 1 });
    expect(poop?.text).toBe('{value:compact} Poop kills; next Death Note rank at {next:compact}');
    const mini = out.entries?.find((e) => e.id === 'death-note.goal.miniboss-slime-b');
    expect(poop?.type === 'goal' && poop.data).toEqual({
      eclipse: { above: 1e9, rank: 20, needsRiftBonus: 'Eclipse_Skulls' },
    });
    expect(mini?.type === 'goal' && mini.milestones).toEqual([{ at: 100, reward: 'rank 1' }]);
    expect(mini?.type === 'goal' && mini.data).toBeUndefined();
    expect(mini?.title).toBe('Death Note: Glunko The Massive');
  });

  it('holds its invariants on the pinned data: 104 normal ladders plus the minibosses', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const normal = out.entries.filter((e) => !e.id.includes('.miniboss-'));
    expect(normal).toHaveLength(104);
    expect(out.entries.length - normal.length).toBeGreaterThanOrEqual(5);
    // Every normal ladder is the one shared table.
    const ladders = new Set(normal.map((e) => JSON.stringify(e.type === 'goal' ? e.milestones : null)));
    expect(ladders.size).toBe(1);
  });

  it("reads the rank tables the way Toolbox's parser does, on a known save", async () => {
    // Toolbox's per-world rank is the sum over its mobs of the highest threshold each mob's kills reach,
    // or the eclipse rank past the eclipse threshold (this late-game save has the rift bonus).
    const out = await runLive(generator);
    const parsed = knownSave('latest.json');
    const deathNote = parsed.account.deathNote as Record<
      string,
      { rank: number; mobs: { rawName: string; kills: number }[] }
    >;
    const ladderOf = new Map(
      out.entries.map((e) => [e.type === 'goal' ? (e.values.monster as string) : '', e]),
    );
    let checked = 0;
    for (const world of ['0', '1', '2']) {
      const w = deathNote[world];
      expect(w).toBeDefined();
      let rank = 0;
      for (const mob of w?.mobs ?? []) {
        const entry = ladderOf.get(mob.rawName);
        if (entry?.type !== 'goal') continue;
        const reached = (entry.milestones ?? []).filter((m) => mob.kills >= m.at);
        const eclipse = entry.data?.eclipse as { above: number; rank: number } | undefined;
        if (eclipse && mob.kills > eclipse.above) rank += eclipse.rank;
        else rank += reached.length ? Number(reached[reached.length - 1]?.reward.replace('rank ', '')) : 0;
        checked++;
      }
      expect(rank).toBe(w?.rank);
    }
    expect(checked).toBeGreaterThan(30);
  });
});
