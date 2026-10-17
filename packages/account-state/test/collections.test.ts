// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8 TR-15's field map and traps, on the scrubbed W2-late and W3-early saves (CI-safe): each field is
// read, each trap is handled, and each field turns unknown (never a default) when its raw key or its
// parser section is missing. Characters are named by class and level only.
import { fileURLToPath } from 'node:url';
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { type AccountState, isKnown, toAccountState } from '../src';
import { editedSave, NOW, readSave } from './helpers';

const SCRUBBED = fileURLToPath(new URL('../../../fixtures/scrubbed/', import.meta.url));
const raw = (id: string) => readSave(SCRUBBED, `${id}.json`);
const stateOf = (input: unknown, toolbox = true): AccountState => {
  const envelope = normalizeEnvelope(input);
  return toAccountState(parseSave(envelope, { now: NOW }), envelope, {
    ...(toolbox ? { toolbox: { calls: toolboxCalls, withFrozenClock } } : {}),
  });
};
const w2 = stateOf(raw('scrubbed-w2'));
const w3 = stateOf(raw('scrubbed-w3'));
const char = (s: AccountState, cls: string, level: number) => {
  const c = s.characters.find((x) => x.class === cls && x.level === level);
  if (!c) throw new Error(`no ${cls} ${level}`);
  return c;
};

describe('M8 collections fields (TR-15)', () => {
  it('stamps: every catalogue stamp with level and cap; collected = level > 0 or cap > 0', () => {
    const collected = (s: AccountState) =>
      Object.values(s.account.stampLevels ?? {}).filter((x) => x.level > 0 || x.maxLevel > 0).length;
    expect(Object.keys(w3.account.stampLevels ?? {})).toHaveLength(128);
    expect(collected(w3)).toBe(17);
    expect(collected(w2)).toBe(8);
    expect(w2.account.stampLevels?.StampA17).toMatchObject({ level: 0, maxLevel: 5, name: 'Bullseye_Stamp' });
  });

  it('per-character quest status keeps string keys that are not 1..n (Fishpaste97 971, 972)', () => {
    const c = char(w3, 'Bowman', 60);
    expect(c.quests?.Hamish?.['1']).toBe(0);
    expect(Object.keys(c.quests?.Fishpaste97 ?? {})).toEqual(['971', '972']);
  });

  it('holdings: storage and refinery storage counted apart, bag items without equipped gear', () => {
    expect(w3.account.storageItems?.Refinery1).toBe(9);
    expect(w3.account.refineryStorage?.Refinery1).toBe(8);
    expect(char(w3, 'Bowman', 60).inventoryItems?.EquipmentToolsHatchet3).toBe(1);
    // The Wizard 73's Copper Chopper is its equipped tool, not a bag item.
    expect(char(w3, 'Wizard', 73).inventoryItems?.EquipmentToolsHatchet3).toBeUndefined();
    expect(char(w3, 'Wizard', 73).inventoryItems?.StampB7).toBe(3);
  });

  it('free inventory slots are derived (no such Toolbox field), carry caps are per item type', () => {
    for (const c of w3.characters) expect(c.freeInventorySlots).toEqual(expect.any(Number));
    expect(char(w3, 'Squire', 85).carryPerSlot?.bCraft).toBeGreaterThan(100);
    expect(w3.account.heldItemTypes?.Refinery1).toBe('bCraft');
  });

  it('shop stock comes from raw ShopStock, stamps included (Toolbox’s parsed list drops them)', () => {
    expect(w3.account.shopStock?.[1]?.StampA12).toBe(1); // Vitality, Encroaching Forest Villas
    expect(w3.account.shopStock?.[3]?.StampB8).toBe(1); // Matty Bag, Faraway Piers
    expect(w3.account.shopStock?.[2]?.BobJoePickle).toBeGreaterThan(0);
  });

  it('bank coins from bankMoney; character coins from money', () => {
    expect(w2.account.bankCoins).toBeGreaterThan(0);
    expect(char(w2, 'Barbarian', 60).money).toBeGreaterThan(0);
  });

  it('cards: owned cards by rawName with effect; equippedCards padding removed; set tier = Toolbox stars + 1', () => {
    expect(w3.account.cards?.ForgeA?.effect).toMatch(/Passive/);
    expect(char(w3, 'Wizard', 73).cardLoadout).toMatchObject({
      equipped: ['JungleTree', 'BirchTree', 'mimicA', 'ForestTree'],
      set: null,
      selectedPreset: 1,
    });
    expect(char(w3, 'Wizard', 73).cardLoadout?.presets).toHaveLength(7);
    expect(char(w3, 'Shaman', 54).cardLoadout?.equipped).toEqual([]);
    expect(char(w3, 'Squire', 85).cardLoadout?.set).toBe('CardSet1');
    const tier = (s: AccountState, raw: string) => s.account.cardSets?.find((x) => x.rawName === raw)?.tier;
    expect([tier(w3, 'CardSet0'), tier(w3, 'CardSet1'), tier(w3, 'CardSet2'), tier(w3, 'CardSet4')]).toEqual([
      2, 2, 1, 1,
    ]);
    expect([tier(w2, 'CardSet0'), tier(w2, 'CardSet1'), tier(w2, 'CardSet2')]).toEqual([1, 1, 0]);
  });

  it('obols: family and personal slots with shape and gate; storage rows by shape; the W2 merit', () => {
    expect(w3.account.storedObols).toEqual([
      { rawName: 'ObolSilver0', shape: 'Circle' },
      { rawName: 'ObolSilver0', shape: 'Circle' },
      { rawName: 'ObolSilver3', shape: 'Circle' },
      { rawName: 'ObolSilver2', shape: 'Circle' },
    ]);
    expect(w3.account.familyObols?.filter((o) => o.state === 'empty')).toHaveLength(6);
    // The trap: the slot gated at family level 350 is still locked at family level 379 (FR-22).
    expect(w3.account.familyObols?.find((o) => o.levelReq === 350)?.state).toBe('locked');
    expect(w3.account.obolDropMerit).toBe(7);
    expect(w2.account.obolDropMerit).toBe(0);
    expect(char(w3, 'Squire', 85).personalObols?.some((o) => o.state === 'empty')).toBe(true);
  });

  it('without Toolbox’s functions the worker-only fields are null, not unknown', () => {
    const bare = stateOf(raw('scrubbed-w3'), false);
    expect(bare.account.shopStock).toBeNull();
    expect(bare.account.cardSets).toBeNull();
    expect(bare.diagnostics.unknownFields.filter((f) => /shopStock|cardSets|carryPerSlot/.test(f))).toEqual(
      [],
    );
  });

  it('a missing raw key makes its field unknown, never a default', () => {
    const s = stateOf(
      editedSave(raw('scrubbed-w3'), (d) => {
        delete d.ShopStock;
        d.QuestComplete_0 = 'not json';
      }),
    );
    expect(s.account.shopStock).toBeNull();
    expect(isKnown(s, 'account.shopStock')).toBe(false);
    expect(isKnown(s, 'characters[0].quests')).toBe(false);
    expect(isKnown(s, 'characters[1].quests')).toBe(true);
  });

  it('a failed parser section makes its fields unknown (FR-26)', () => {
    const s = structuredClone(w3);
    s.diagnostics.failedSections = ['storage', 'cards'];
    expect(isKnown(s, 'account.storageItems')).toBe(false);
    expect(isKnown(s, 'account.cards')).toBe(false);
    expect(isKnown(s, 'characters[0].cardLoadout')).toBe(false);
    expect(isKnown(s, 'account.stampLevels')).toBe(true);
  });
});
