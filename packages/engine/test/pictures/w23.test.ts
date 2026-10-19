// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the World 2 and 3 page pictures (pictures/w23.ts) on the scrubbed W3 save, parsed like the worker
// parses it: the Refinery, the build slots, the printer's samples, the prayers and the shrines. They
// only lay out Account State facts, so the tests pin the facts and the words, not any advice.
import { describe, expect, it } from 'vitest';
import {
  buildSlotsPicture,
  fill,
  prayersPicture,
  printerSamplesPicture,
  refineryPicture,
  shrinesPicture,
  shrineWhat,
} from '../../src/pictures/w23';
import { scrubbedFile, spendStateOf } from '../spend/helpers';

const state = spendStateOf(scrubbedFile('scrubbed-w3'));

describe('the words', () => {
  it("fills the game's templates with the number at the level", () => {
    expect(fill('+{%_Class_EXP', 30)).toBe('+30% Class EXP');
    expect(fill('Giant_Monsters_can_now_spawn...', 10)).toBe('Giant Monsters can now spawn');
    expect(shrineWhat('Boosts_Total_Damage_of_players_on_this_map_by_+{%.', 12)).toBe('+12% Total Damage');
    expect(shrineWhat('Boosts_AFK_Gain_Rate_on_this_map_by_+{%.', 1.1)).toBe('+1.1% AFK Gain Rate');
  });
});

describe('the pictures', () => {
  it('Refinery: every salt in order, the open one with its bar, fuel and storage', () => {
    const r = refineryPicture(state);
    expect(r?.salts.map((s) => s.name).slice(0, 2)).toEqual(['Redox Salts', 'Explosive Salts']);
    const redox = r?.salts[0];
    expect(redox?.unlocked).toBe(true);
    expect(redox?.powerCap).toBeGreaterThan(0);
    expect(redox?.fuel.map((f) => f.name)).toEqual(['Spore Cap', 'Copper Ore']);
    expect(r?.waiting).toBe(r?.salts.reduce((t, s) => t + s.inRefinery, 0));
  });

  it('Construction: the open build slots hold named buildings, with their salt', () => {
    const b = buildSlotsPicture(state);
    expect(b?.slots.length).toBe(state.account.construction?.buildSlots.length);
    expect(b?.buildings.find((x) => x.index === 0)?.name).toBe('3D Printer');
    expect(b?.buildings.find((x) => x.index === 0)?.salt).toBe('Redox Salts');
  });

  it('3D Printer: every character with its sample size and samples', () => {
    const p = printerSamplesPicture(state);
    expect(p?.characters).toHaveLength(state.characters.length);
    expect(p?.maxLevel).toBe(11);
  });

  it('Prayers: Big Brain Time at wave 10 of Goblin Gorefest, its bonus and curse in words', () => {
    const p = prayersPicture(state);
    const first = p?.prayers[0];
    expect(first).toMatchObject({ name: 'Big Brain Time', zone: 'Goblin Gorefest', wave: 10 });
    expect(first?.bonus).toMatch(/^\+\d+% Class EXP$/);
    expect(p?.equipped).toHaveLength(state.characters.length);
  });

  it('Shrines: nine, each with its salt, and the maps characters stand on', () => {
    const s = shrinesPicture(state, () => 'Blunder_Hills');
    expect(s?.shrines).toHaveLength(9);
    expect(s?.shrines[0]).toMatchObject({ name: 'Woodular Shrine', salt: 'Redox Salts' });
    expect(s?.maps.reduce((t, m) => t + m.characters.length, 0)).toBe(
      state.characters.filter((c) => c.currentMap).length,
    );
  });

  it('a state without the facts draws no picture', () => {
    const bare = { ...state, account: { ...state.account, refinery: null, prayers: null, shrines: null } };
    expect(refineryPicture(bare)).toBeNull();
    expect(prayersPicture(bare)).toBeNull();
    expect(shrinesPicture(bare, () => null)).toBeNull();
  });
});
