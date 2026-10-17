// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator from '@idleon-forge/knowledge/generators/skill-doors.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

describe('skill-doors generator', () => {
  it('keeps only doors into real maps of the same skill (synthetic slice, hand-checked)', () => {
    // Map 1 (mining) -> 2 (mining) at 10; 1 -> 3 (fighting) at 99 is dropped; 2 -> 4 (placeholder Z) at 50 dropped.
    const out = runOnSlice(generator, {
      mapNames: { 0: 'Town', 1: 'Mine_A', 2: 'Mine_B', 3: 'Field', 4: 'Z' },
      mapPortals: { 1: [10, 99], 2: [50] },
      mapPortalDestinations: { 1: [2, 3], 2: [4] },
      mapEnemiesArray: ['Nothing', 'Copper', 'Iron', 'mob', 'Z'],
      monsters: { Copper: { AFKtype: 'MINING' }, Iron: { AFKtype: 'MINING' }, mob: { AFKtype: 'FIGHTING' } },
    });
    expect(out.entries?.map((e) => e.id)).toEqual(['skills.goal.door-mining']);
    const e = out.entries?.[0];
    expect(e?.type === 'goal' && e.milestones).toEqual([{ at: 10, reward: 'door to Mine B' }]);
  });

  it('gives Mining 10/25/40/60 and Fishing 15/30 at the pin', async () => {
    // Hand-checked against shared-data: Tunnels Entrance 6 [10] -> 7; Freefall Caverns 7 [25, 81] -> 10,
    // 43 (Royal Castle, not a mining map: dropped); The Ol' Straightaway 10 [40] -> 11; Echoing Egress 11
    // [50, 60] -> 35 (placeholder Miningg2: dropped), 12; Slip Slidy Ledges 12 [60] -> 32 Motherlode Pit.
    // Salty Shores 54 [15] -> 55; Faraway Piers 55 [30] -> 61 Deepwater Docks; Filler 56 is a placeholder.
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const at = (id: string) => {
      const e = out.entries.find((x) => x.id === id);
      return e?.type === 'goal' ? e.milestones?.map((m) => m.at) : null;
    };
    expect(out.entries.map((e) => e.id)).toEqual(['skills.goal.door-fishing', 'skills.goal.door-mining']);
    expect(at('skills.goal.door-mining')).toEqual([10, 25, 40, 60]);
    expect(at('skills.goal.door-fishing')).toEqual([15, 30]);
  });

  it('agrees with known saves: a character standing past a skill door has that skill level', async () => {
    // Confirms mapPortals on a skilling map is a skill level (not kills): a character on map `to` came
    // through the door into it, so its Mining or Fishing level is at least that door's requirement.
    const out = await runLive(generator);
    const into = new Map<number, { skill: string; level: number }>();
    for (const e of out.entries)
      for (const d of (e.data?.doors ?? []) as { level: number; to: number }[]) {
        const prev = into.get(d.to);
        if (!prev || d.level < prev.level)
          into.set(d.to, { skill: e.values.skill as string, level: d.level });
      }
    let checked = 0;
    for (const file of [
      'first.json',
      'second.json',
      'third.json',
      'fourth.json',
      'fresh.json',
      'latest.json',
    ]) {
      for (const c of knownSave(file).characters as {
        mapIndex?: number;
        skillsInfo?: Record<string, { level: number }>;
      }[]) {
        const need = c.mapIndex === undefined ? undefined : into.get(c.mapIndex);
        if (!need) continue;
        expect(c.skillsInfo?.[need.skill]?.level ?? 0, `${file} on map ${c.mapIndex}`).toBeGreaterThanOrEqual(
          need.level,
        );
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
