// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { TOOL_TYPES } from '@idleon-forge/knowledge/generators/tools.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

describe('tools generator', () => {
  it('ladders anvil tools by lvReqToEquip, ignoring drop-only tools (synthetic slice, hand-checked)', () => {
    const out = runOnSlice(generator, {
      items: {
        PickA: { displayName: 'Copper_Pickaxe', Type: 'PICKAXE', lvReqToEquip: 3, desc_line1: 'level 99' },
        PickB: { displayName: 'Iron_Pickaxe', Type: 'PICKAXE', lvReqToEquip: 8 },
        PickDrop: { displayName: 'Poopy_Pickaxe', Type: 'PICKAXE', lvReqToEquip: 15 },
        Sword: { displayName: 'Sword', Type: 'SWORD', lvReqToEquip: 5 },
      },
      crafts: {
        Copper_Pickaxe: { rawName: 'PickA', materials: [{ rawName: 'Copper', itemQuantity: 8 }] },
        Iron_Pickaxe: { rawName: 'PickB', materials: [{ rawName: 'Iron', itemQuantity: 20 }] },
        Sword: { rawName: 'Sword', materials: [] },
      },
    });
    expect(out.entries?.map((e) => e.id)).toEqual(['skills.goal.tool-mining']);
    const e = out.entries?.[0];
    expect(e?.type === 'goal' && e.milestones).toEqual([
      { at: 3, reward: 'Copper Pickaxe' },
      { at: 8, reward: 'Iron Pickaxe' },
    ]);
    expect(((e?.data?.tools ?? []) as { materials: unknown }[])[0]?.materials).toEqual([
      { rawName: 'Copper', quantity: 8 },
    ]);
  });

  it('holds its invariants on the pinned data: one ladder per gathering skill', async () => {
    // Hand-checked: Copper_Pickaxe (EquipmentTools2) needs Mining 3 and 8 Copper ore; Iron_Pickaxe 8.
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    expect(out.entries.map((e) => e.id).sort()).toEqual(
      Object.values(TOOL_TYPES)
        .map((s) => `skills.goal.tool-${s}`)
        .sort(),
    );
    const mining = out.entries.find((e) => e.id === 'skills.goal.tool-mining');
    expect(mining?.type === 'goal' && mining.milestones?.slice(0, 2)).toEqual([
      { at: 3, reward: 'Copper Pickaxe' },
      { at: 8, reward: 'Iron Pickaxe' },
    ]);
    for (const e of out.entries)
      expect(e.type === 'goal' && (e.milestones?.length ?? 0)).toBeGreaterThanOrEqual(8);
  });

  it('agrees with known saves: every equipped anvil tool is within its skill level', async () => {
    // Confirms lvReqToEquip is the skill level gate: the game won't equip a tool above it.
    const out = await runLive(generator);
    const need = new Map<string, { skill: string; level: number }>();
    for (const e of out.entries)
      for (const t of (e.data?.tools ?? []) as { rawName: string; level: number }[])
        need.set(t.rawName, { skill: e.values.skill as string, level: t.level });
    let checked = 0;
    for (const file of ['first.json', 'second.json', 'third.json', 'fourth.json', 'latest.json']) {
      for (const c of knownSave(file).characters as {
        tools?: { rawName?: string }[];
        skillsInfo?: Record<string, { level: number }>;
      }[]) {
        for (const tool of c.tools ?? []) {
          const n = tool.rawName ? need.get(tool.rawName) : undefined;
          if (!n) continue;
          expect(c.skillsInfo?.[n.skill]?.level ?? 0, `${file} ${tool.rawName}`).toBeGreaterThanOrEqual(
            n.level,
          );
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(20);
  });
});
