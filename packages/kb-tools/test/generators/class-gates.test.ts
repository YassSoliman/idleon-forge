// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { obolGates } from '@idleon-forge/knowledge/generators/class-gates.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

describe('class-gates generator', () => {
  it('labels the levels that open personal obol slots (synthetic slice, hand-checked)', () => {
    const out = runOnSlice(generator, {
      obols: {
        character: {
          0: { shape: 'Square', levelReq: 5 },
          1: { shape: 'Circle', levelReq: 0 },
          2: { shape: 'Circle', levelReq: 3 },
          3: { shape: 'Hexagon', levelReq: 5 },
        },
        family: { 0: { shape: 'Circle', levelReq: 2 } },
      },
    });
    const e = out.entries?.[0];
    expect(e?.type === 'goal' && e.milestones).toEqual([
      { at: 2, reward: 'level 2' },
      { at: 3, reward: 'level 3: personal obol slot (Circle)' },
      { at: 4, reward: 'level 4' },
      { at: 5, reward: 'level 5: personal obol slots (Hexagon, Square)' },
    ]);
  });

  it('holds its invariants on the pinned data: 20 gated slots up to level 250', async () => {
    // Hand-checked: shared-data obols.character has 21 slots; slot 1 has levelReq 0, the others run
    // 25, 32, 40, 48, 60, 70, 80, 90, 98, 105, 112, 120, 130, 140, 152, 170, 180, 190, 210, 250.
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const e = out.entries[0];
    expect(e?.type === 'goal' && e.milestones?.length).toBe(249);
    const gates = ((e?.data?.gates ?? []) as { level: number }[]).map((g) => g.level);
    expect(gates).toEqual([
      25, 32, 40, 48, 60, 70, 80, 90, 98, 105, 112, 120, 130, 140, 152, 170, 180, 190, 210, 250,
    ]);
    expect(obolGates({ a: { shape: 'Circle', levelReq: 0 } })).toEqual([]);
  });

  it("matches Toolbox's slot gates on known saves: no obol sits in a slot above the character's level", async () => {
    // Toolbox's parseObols attaches obols.character[i] (shape, levelReq) to save slot i; the game keeps
    // a slot locked below its levelReq, so a real obol there would mean the field is misread.
    let checked = 0;
    for (const file of ['third.json', 'first.json', 'fresh.json']) {
      for (const c of knownSave(file).characters as {
        level?: number;
        obols?: { list?: { levelReq?: number; rawName?: string }[] };
      }[]) {
        for (const o of c.obols?.list ?? []) {
          if (typeof o.levelReq !== 'number' || typeof c.level !== 'number') continue;
          // A slot holding the game's ObolLocked<n> placeholder is always above the character's level.
          // (The converse can fail: a speedrun resets levels but keeps equipped obols, as in fresh.json.)
          const locked = /^ObolLocked\d*$/.test(o.rawName ?? '');
          if (locked) {
            expect(o.levelReq, `${file} lv${c.level} slot ${o.levelReq}`).toBeGreaterThan(c.level);
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(10);
  });
});
