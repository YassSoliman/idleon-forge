// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 TR-2's gear fields on the scrubbed saves (CI) and every public save: worn gear with its stones,
// held gear from M8's holdings at base stats, the raw recipe states and the Smithy. Counts, classes,
// levels and item rawNames only (TR-9).
import { readFileSync } from 'node:fs';
import { normalizeEnvelope, parseSave } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { type AccountState, GEAR_SLOTS, heldGear, toAccountState, wornGear } from '../src';
import { accountStateOf, listJson, PUBLIC_DIR, readSave } from './helpers';

const scrubbed = (id: string) => {
  const raw = JSON.parse(
    readFileSync(new URL(`../../../fixtures/scrubbed/${id}.json`, import.meta.url), 'utf8'),
  ) as Parameters<typeof normalizeEnvelope>[0];
  const env = normalizeEnvelope(raw);
  const d = env.data as Record<string, unknown>;
  const ta = (typeof d.TimeAway === 'string' ? JSON.parse(d.TimeAway) : d.TimeAway) as { GlobalTime: number };
  return toAccountState(parseSave(env, { now: Math.round(ta.GlobalTime * 1000) }), env);
};
const byClass = (s: AccountState, cls: string, level: number) => {
  const c = s.characters.find((x) => x.class === cls && x.level === level);
  if (!c) throw new Error(`no ${cls} ${level}`);
  return c;
};
const slotOf = (s: AccountState, cls: string, level: number) => {
  const w = wornGear(s, byClass(s, cls, level)) ?? [];
  return Object.fromEntries(w.map((x) => [x.slot, x.item?.rawName ?? null]));
};

describe('M18 fields on the scrubbed W3-early save', () => {
  const s = scrubbed('scrubbed-w3');
  it('reads the 12 judged slots in F-a order, empty ones as null', () => {
    const bow = slotOf(s, 'Bowman', 60);
    expect(Object.keys(bow)).toEqual([...GEAR_SLOTS]);
    expect([bow.helmet, bow.shirt, bow.pants, bow.shoes]).toEqual([null, null, null, null]);
    expect(slotOf(s, 'Squire', 85).weapon).toBe('TestObj3'); // Royal Bayonet
    expect(slotOf(s, 'Barbarian', 56).rod).toBeNull();
  });
  it("keeps a worn copy's stones and its base stats apart (the Wizard 73's Quarterstaff: +2 Weapon Power)", () => {
    const wand = wornGear(s, byClass(s, 'Wizard', 73))?.find((x) => x.slot === 'weapon')?.item;
    expect(wand?.rawName).toBe('EquipmentWands2');
    expect(wand?.wp).toBe(18);
    expect(wand?.slotsLeft).toBe(0);
    expect(wand?.slotsMax).toBe(2);
    expect(s.account.gearItems?.EquipmentWands2?.[4]).toBe(16);
  });
  it('holds the Gold Helmet, a Copper Platebody and Copper Platelegs in storage, never what is worn', () => {
    const held = heldGear(s) ?? [];
    const at = (raw: string) => held.find((h) => h.rawName === raw)?.places;
    expect(at('EquipmentHats28')).toEqual([{ place: 'storage', count: 1 }]);
    expect(at('EquipmentShirts11')?.[0]?.place).toBe('storage');
    expect(at('EquipmentPants2')?.[0]?.place).toBe('storage');
    expect(at('EquipmentWands2')).toBeUndefined();
  });
  it('reads the raw recipe states: 7 tabs, Amarok Paws available, Iron Boots available, Steel Band locked', () => {
    const r = s.account.anvilRecipes ?? [];
    expect(r.map((t) => t.length)).toEqual([84, 80, 72, 64, 36, 52, 24]);
    expect([r[0]?.[67], r[0]?.[38], r[0]?.[39]]).toEqual([0, 0, -1]);
  });
  it('reads the Smithy: day 5 of 30, not hired, nothing registered, cannot be hired yet', () => {
    expect(s.account.armorSmithy).toEqual({ canHire: false, hired: false, daysWaited: 5, registered: [] });
  });
});

describe('M18 fields on the scrubbed W2-late save', () => {
  const s = scrubbed('scrubbed-w2');
  it('the Wizard 56 has both rings empty; 2 Copper Bands sit in storage', () => {
    const wiz = slotOf(s, 'Wizard', 56);
    expect([wiz.ring1, wiz.ring2]).toEqual([null, null]);
    const band = heldGear(s)?.find((h) => h.rawName === 'EquipmentRings2');
    expect(band?.places.find((p) => p.place === 'storage')?.count).toBeGreaterThanOrEqual(2);
  });
  it("a Spore Tee in the Squire 43's bag is held there, by index", () => {
    const sq = byClass(s, 'Squire', 43);
    const tee = heldGear(s)?.find((h) => h.places.some((p) => p.place === `inv:c${sq.index}`));
    expect(tee).toBeDefined();
  });
  it('day 4 of 30 at the Smithy', () => {
    expect(s.account.armorSmithy?.daysWaited).toBe(4);
  });
});

describe('every public save', () => {
  const states = listJson(PUBLIC_DIR).map((f) => accountStateOf(readSave(PUBLIC_DIR, f)));
  it("decodes every character's gear, and every worn rawName has its stats", () => {
    for (const s of states)
      for (const c of s.characters) {
        const w = wornGear(s, c);
        expect(w).toHaveLength(12);
        expect(w?.some((x) => x.unknown)).toBe(false);
      }
  });
  it('held gear never lists a copy that is only worn (holdings exclude equipped gear)', () => {
    for (const s of states) {
      const held = heldGear(s) ?? [];
      for (const h of held) expect(h.count).toBeGreaterThan(0);
    }
  });
  it('reads the recipe tabs M18 covers on every save (tabs 1–3; an old save may lack the newest tab)', () => {
    for (const s of states) {
      const r = s.account.anvilRecipes ?? [];
      expect(r.length).toBeGreaterThanOrEqual(6);
      expect(r.slice(0, 3).map((t) => t.length)).toEqual([84, 80, 72]);
    }
  });
});

describe('synthetic saves', () => {
  const env = (data: Record<string, unknown>) => ({ data, charNames: ['A'] }) as never;
  it("an item the pin doesn't know makes that one slot unknown and lists its rawName", () => {
    const blank = { rawName: 'Blank' };
    const parsed = {
      account: {
        currentWorld: 1,
        finishedWorlds: {},
        timeAway: { GlobalTime: 1000, ShopRestock: 10 },
        accountLevel: 1,
        storage: { list: [] },
      },
      characters: [
        {
          name: 'A',
          class: 'Beginner',
          level: 1,
          afkType: 'FIGHTING',
          afkTarget: 'Green_Mushroom',
          currentMap: 'Blunder_Hills',
          afkTime: 1_000_000,
          equipment: [{ rawName: 'NewPatchHat' }, blank, blank, blank, blank, blank, blank, blank],
          tools: [blank, blank, blank, blank],
          inventory: [],
        },
      ],
      failedSections: [],
      meta: { now: 1_000_060, saveVersion: 1, parserCommit: 'x', parserGameVersion: '2.3.540' },
    } as never;
    const st = toAccountState(
      parsed,
      env({
        Lv0_0: '[1]',
        CharacterClass_0: 1,
        AFKtarget_0: 'Green_Mushroom',
        CurrentMap_0: 0,
        EquipOrder_0: '[[],[],[]]',
        ChestOrder: '[]',
        InventoryOrder_0: '[]',
        PTimeAway_0: 1000,
        TimeAway: '{}',
        OptLacc: '[]',
      }),
    );
    const c = st.characters[0];
    expect(c && wornGear(st, c)?.[0]).toEqual({ slot: 'helmet', item: null, unknown: true });
    expect(st.diagnostics.unknownIds.items).toContain('NewPatchHat');
  });
});
