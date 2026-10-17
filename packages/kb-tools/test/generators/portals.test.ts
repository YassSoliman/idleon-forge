// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import generator from '@idleon-forge/knowledge/generators/portals.gen';
import { describe, expect, it } from 'vitest';
import { PUBLIC_FIXTURES } from '../../src/paths';
import { invariants, runLive, runOnSlice } from './helpers';

type Step = { mapIndex: number; door: number | null; requirement: number };
type Route = { world: number; town: number; paths: Record<string, Step[]> };

describe('portals generator', () => {
  it('pairs door requirements with destinations and finds shortest paths (synthetic slice, hand-checked)', () => {
    // Town 0 -> 1 (door 0, req 1); 1 -> 2 (req 20) or 3 (req 500, a side branch); 2 -> 3 (req 30).
    // Shortest path to 3 is 0-1 door 1 (two steps), not through 2. Map 4 is a lair no door reaches.
    const out = runOnSlice(generator, {
      mapNames: { 0: 'Town', 1: 'Field', 2: 'Woods', 3: 'Cave', 4: 'Lair', 5: 'Z' },
      mapPortals: { 0: [1], 1: [20, 500], 2: [30], 3: [0], 4: [9] },
      mapPortalDestinations: { 0: [1], 1: [2, 3], 2: [3], 3: [], 4: [] },
      mapEnemiesArray: ['Nothing', 'mobA', 'mobB', 'mobC', 'boss'],
      monsters: {
        mobA: { AFKtype: 'FIGHTING' },
        mobB: { AFKtype: 'FIGHTING' },
        mobC: { AFKtype: 'FIGHTING' },
        boss: { AFKtype: 'FIGHTING' },
      },
    });
    const route = ((out.facts?.[0]?.rows ?? []) as Route[])[0] as Route;
    expect(route.paths['3']).toEqual([
      { mapIndex: 0, door: 0, requirement: 1 },
      { mapIndex: 1, door: 1, requirement: 500 },
    ]);
    expect(route.paths['4']).toBeUndefined();
    const field = out.entries?.find((e) => e.id === 'portals.goal.map-1');
    expect(field?.type === 'goal' && field.milestones).toEqual([
      { at: 20, reward: 'door to Woods' },
      { at: 500, reward: 'door to Cave' },
    ]);
    expect(out.entries?.map((e) => e.id).sort()).toEqual(['portals.goal.map-1', 'portals.goal.map-2']);
  });

  it('keeps W1 side branches off the path to Tucked Away and finds W3 door 1 (pinned data)', async () => {
    // Hand-checked against shared-data at the pin: Spore Meadows 1 -> Froggy Fields 2 -> Valley of the
    // Beans 14 -> Jungle Perimeter 16 -> Winding Willows 19 -> Vegetable Patch 24 -> Forest Outskirts 26
    // -> Encroaching Forest Villas 27 -> Tucked Away 28 (door 1, 4200). Poopy Sewers 8, Rats Nest 15,
    // Base of the Bark 13 and Hollowed Trunk 18 are not on it. W3 leaves The Stache Split 104 by door 1
    // (100000) to Wam Wonderland 116; Crystal Basecamp 113 is a dead end. No door of Frostbite Towndra 100
    // lists Steep Sheep Ledge 101, so that first step is a walk (door null).
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const routes = out.facts[0]?.rows as Route[];
    const w1 = routes.find((r) => r.world === 1) as Route;
    expect(w1.paths['28']?.map((s) => s.mapIndex)).toEqual([0, 1, 2, 14, 16, 19, 24, 26, 27]);
    expect(w1.paths['28']?.at(-1)).toEqual({ mapIndex: 27, door: 1, requirement: 4200 });
    for (const side of [8, 15, 13, 18]) expect(w1.paths['28']?.some((s) => s.mapIndex === side)).toBe(false);
    const w3 = routes.find((r) => r.world === 3) as Route;
    expect(w3.paths['117']?.find((s) => s.mapIndex === 104)).toEqual({
      mapIndex: 104,
      door: 1,
      requirement: 100000,
    });
    expect(w3.paths['101']).toEqual([{ mapIndex: 100, door: null, requirement: 0 }]);
    expect(Object.keys(w3.paths)).toContain('113');
    expect(out.entries.length).toBeGreaterThan(40); // 47 at the pin
    expect(out.entries.length).toBeLessThan(90);
    const sewers = out.entries.find((e) => e.id === 'portals.goal.map-8');
    expect(sewers?.type === 'goal' && sewers.milestones).toEqual([
      { at: 20000, reward: 'door to Rats Nest' },
    ]);
  });

  it('agrees with known saves: a character with kills on a map got there through its path door', async () => {
    // Confirms the meaning of mapPortalDestinations (spec index, verify before build): door d of map m
    // leads to mapPortalDestinations[m][d]. In a real save a character's KillsLeft2Advance (KLA_<i>)
    // shows kills on a map only after it passed the door into it, so the door on our path into that
    // map is cleared (KLA[from][door] <= 0) for the same character. Also checks that the save keeps
    // one KillsLeft2Advance entry per door of mapPortals.
    const out = await runLive(generator);
    const routes = out.facts[0]?.rows as Route[];
    const reqOf = (m: number, door: number) =>
      routes.flatMap((r) => Object.values(r.paths).flat()).find((s) => s.mapIndex === m && s.door === door)
        ?.requirement;
    let checked = 0;
    let misses = 0;
    for (const file of ['first.json', 'second.json', 'third.json', 'fourth.json', 'fresh.json']) {
      const raw = JSON.parse(readFileSync(path.join(PUBLIC_FIXTURES, file), 'utf8')) as {
        data: Record<string, unknown>;
      };
      for (let i = 0; i < 11; i++) {
        const v = raw.data[`KLA_${i}`];
        if (v === undefined) continue;
        const kla = (typeof v === 'string' ? JSON.parse(v) : v) as number[][];
        for (const r of routes) {
          for (const [to, steps] of Object.entries(r.paths)) {
            const last = steps.at(-1);
            const t = Number(to);
            const ownReq = reqOf(t, 0) ?? 0;
            if (!last || last.door === null || ownReq <= 0 || !kla[t]) continue; // a walk has no door to check
            const killsOnTo = ownReq - Number(kla[t]?.[0]);
            if (!(killsOnTo > 0)) continue;
            checked++;
            if (!(Number(kla[last.mapIndex]?.[last.door]) <= 0)) misses++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
    // Allow a sliver for teleports the game grants (event or quest warps); the field reading is wrong
    // if more than a few percent disagree.
    expect(misses / checked).toBeLessThan(0.03);
  });
});
