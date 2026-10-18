// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import type { ParsedSave, RawSaveEnvelope } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import {
  AccountShapeError,
  toAccountState as adapt,
  EmptyAccountError,
  humanize,
  SCHEMA_VERSION,
  UNNAMED_WARNING,
} from '../src';
import { accountStateOf, NOW, PUBLIC_DIR, readSave } from './helpers';

/** The raw keys behind the synthetic parse below, so its presence checks pass. */
const envelope = (over: Record<string, unknown> = {}): RawSaveEnvelope => ({
  data: {
    CharacterClass_0: 1,
    Lv0_0: '[3]',
    AFKtarget_0: 'mushG',
    CurrentMap_0: 0,
    EquipOrder_0: '[]',
    EquipQTY_0: '[]',
    PTimeAway_0: 1000,
    TimeAway: '{"GlobalTime":1000}',
    CSver: 34.05,
    OptLacc: '[]',
    NPCdialogue_0: '{}',
    ...over,
  },
});
const toAccountState = (p: ParsedSave, env = envelope()) => adapt(p, env);

const UNSPENT_ACCOUNT_KEYS = [
  'highestLevel',
  'alchemy',
  'bigBubbleSlots',
  'merits',
  'taskUnlocks',
  'gems',
  'gemPurchases',
  'keys',
  'colosseumTickets',
  'minigames',
  'pets',
  'petMart',
  'postOffice',
  'poppy',
  'deathNoteBuilding',
  // M8 TR-15's block is tested in collections.test.ts.
  'stampLevels',
  'storageItems',
  'refineryStorage',
  'bankCoins',
  'shopStock',
  'heldItemTypes',
  'cards',
  'cardSets',
  'familyObols',
  'storedObols',
  'obolDropMerit',
] as const;
const MODULE_CHARACTER_KEYS = [
  'bigBubbles',
  'postOfficeUnspent',
  'anvilPointsAvailable',
  'quests',
  'inventoryItems',
  'freeInventorySlots',
  'carryPerSlot',
  'money',
  'smithingLevel',
  'targetMonster',
  'cardLoadout',
  'personalObols',
];
/** M14 TR-2's fields, covered by test/walkthrough.test.ts. */
const M14_ACCOUNT_KEYS = [
  'anvilTabsOwned',
  'forgeOutput',
  'storageItems',
  'refineryStorage',
  'printer',
  'supplyRates',
];
const M14_CHARACTER_KEYS = [
  'quests',
  'inventoryItems',
  'smithingLevel',
  'targetMonster',
  'mapIndex',
  'skillLevels',
  'skillEfficiency',
  'anvilSpeed',
  'talentPresets',
  'cardPresets',
];
/** Slice 1's account fields only (M6's block is tested in unspent.test.ts, M8's in collections.test.ts). */
const withoutUnspent = (a: object) =>
  Object.fromEntries(
    Object.entries(a).filter(
      ([k]) => !(UNSPENT_ACCOUNT_KEYS as readonly string[]).includes(k) && !M14_ACCOUNT_KEYS.includes(k),
    ),
  );
const withoutUnspentCharacter = (c: object) =>
  Object.fromEntries(
    Object.entries(c).filter(([k]) => !MODULE_CHARACTER_KEYS.includes(k) && !M14_CHARACTER_KEYS.includes(k)),
  );

const parsed = (over: Partial<ParsedSave> = {}): ParsedSave => ({
  account: {
    currentWorld: 2,
    finishedWorlds: { World1: true, World2: false },
    timeAway: { GlobalTime: 1000, ShopRestock: 3600 },
    accountLevel: 3,
  },
  characters: [
    {
      name: 'Test',
      class: 'Beginner',
      level: 3,
      afkType: 'FIGHTING',
      afkTarget: 'Green_Mushroom',
      currentMap: 'Blunder_Hills',
      afkTime: 1_000_000,
      food: [
        { name: 'Golden_Jam', amount: 5, rawName: 'FoodG1' },
        { rawName: 'Blank', amount: 0 },
      ],
    },
  ],
  failedSections: [],
  error: null,
  meta: {
    now: 1_060_000,
    saveVersion: 34.05,
    capturedAt: null,
    parserGameVersion: '2.3.540',
    parserCommit: 'abc123',
  },
  ...over,
});

describe('toAccountState', () => {
  it('projects the minimal fields', () => {
    const state = toAccountState(parsed());
    // M6's unspent-and-idle fields have their own test below; this one pins slice 1's fields.
    expect(withoutUnspent(state.account)).toEqual({
      currentWorld: 2,
      dailyResetInSeconds: 3600,
      accountLevel: 3,
      finishedWorlds: [1],
      lastCloudSave: 1_000_000,
      secondsSinceLastSave: 60,
      gameVersion: { serverBuild: null, saveVersion: 34.05, parserTarget: '2.3.540' },
      // M2 TR-3: the synthetic parse has no towers, refinery, quests or storage.
      buildings: { deathNote: 0, printer3d: 0, atomCollider: 0 },
      salts: [],
      gateQuests: {},
      worldCrystals: { desertTopaz: 0, glacierQuartz: 0, galaxialAmethyst: 0 },
      frontier: null,
      afk: null,
      // M9 TR-4: storage parsed, with no reset items in it.
      resetItems: { potions: 0, fragments: 0 },
      // M7 TR-2: null without the worker's Toolbox functions.
      spend: null,
    });
    expect(state.characters.map(withoutUnspentCharacter)).toEqual([
      {
        index: 0,
        name: 'Test',
        class: 'Beginner',
        level: 3,
        afkType: 'FIGHTING',
        afkTarget: 'Green_Mushroom',
        currentMap: 'Blunder_Hills',
        foodStacks: [{ item: 'Golden_Jam', amount: 5 }],
        secondsSinceLastSave: 60,
        // M2 TR-3: the synthetic character has no classIndex, dialogue or portal progress.
        classIndex: null,
        npcDialog: {},
        nextPortal: null,
        afk: null,
        // M9 TR-3: the synthetic save has no talent keys.
        talents: null,
      },
    ]);
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.lastPlayedCharacterIndex).toBe(0);
    expect(state.diagnostics).toEqual({
      failedSections: [],
      failedSideReads: [],
      skippedCharacters: [],
      unreadableCharacters: [],
      unknownIds: { monsters: [], maps: [], items: [], classes: [] },
      // The synthetic parse has no server vars, its raw save no KillsLeft2Advance (M2 TR-3), and none of
      // the sections M6's fields read.
      unknownFields: expect.arrayContaining(['characters[0].nextPortal', 'account.gameVersion.serverBuild']),
      unnamed: false,
      parserPin: { commit: 'abc123', gameVersion: '2.3.540' },
      source: 'paste',
    });
  });

  it('lists each failed section once, and side reads that errored', () => {
    const state = adapt(parsed({ failedSections: ['obols', 'obols'] }), {
      ...envelope(),
      sideReadReport: { failed: ['guild', 'guild', 'companion'] },
    });
    expect(state.diagnostics.failedSections).toEqual(['obols']);
    expect(state.diagnostics.failedSideReads).toEqual(['guild', 'companion']);
    expect(state.warnings).toEqual(['Parser section "obols" failed and was skipped.']);
  });

  it('names the path and the type of a bad value, never the value (it could be a name)', () => {
    const base = parsed();
    expect(() => toAccountState({ ...base, characters: ['Secret Name' as never] })).toThrow(
      'characters[0]: expected an object, got a string',
    );
    try {
      toAccountState({ ...base, characters: ['Secret Name' as never] });
    } catch (err) {
      expect(String(err)).not.toContain('Secret');
    }
  });

  it('treats an empty parsed account as a hard error', () => {
    expect(() => toAccountState(parsed({ account: {}, characters: [] }))).toThrow(EmptyAccountError);
    expect(() => toAccountState(parsed({ account: {}, error: 'boom' }))).toThrow(/boom/);
  });

  it('treats an account with no character data as a hard error', () => {
    expect(() => toAccountState(parsed({ characters: [{ playerId: 0, name: 'Stub' }] }))).toThrow(
      EmptyAccountError,
    );
  });

  it('skips stub characters with a warning', () => {
    const base = parsed();
    const state = toAccountState({ ...base, characters: [...base.characters, { name: 'Stub' }] });
    expect(state.characters).toHaveLength(1);
    expect(state.warnings).toEqual(['Character 2 has no save data and was skipped.']);
    expect(state.diagnostics.skippedCharacters).toEqual([1]);
  });

  it('numbers characters when the save carries no names (a bare paste)', () => {
    const [c] = parsed().characters;
    const state = toAccountState(parsed({ characters: [{ ...c, name: undefined }] }));
    expect(state.characters[0]?.name).toBe('Character 1');
    expect(state.warnings).toEqual([UNNAMED_WARNING]);
    expect(state.diagnostics.unnamed).toBe(true);
  });

  it('fails loudly when upstream renames a field', () => {
    const [c] = parsed().characters;
    expect(() => toAccountState(parsed({ characters: [{ ...c, level: undefined, lvl: 3 }] }))).toThrow(
      AccountShapeError,
    );
    // US-6: `class` removed from a character, as an upstream rename would.
    expect(() => toAccountState(parsed({ characters: [{ ...c, class: undefined }] }))).toThrow(
      /characters\[0\]\.class/,
    );
  });

  it('marks the last-played character, and none on a tie (FR-19, TR-12)', () => {
    // The account saved at 1_000_000 ms; each character's own save time is Toolbox's afkTime (ms).
    const [c] = parsed().characters;
    const two = (t0: number, t1: number) =>
      parsed({
        characters: [
          { ...c, afkTime: t0 },
          { ...c, name: 'Second', afkTime: t1 },
        ],
      });
    const raw = envelope({
      CharacterClass_1: 1,
      Lv0_1: '[3]',
      AFKtarget_1: 'mushG',
      CurrentMap_1: 0,
      EquipOrder_1: '[]',
      EquipQTY_1: '[]',
      NPCdialogue_1: '{}',
      PTimeAway_1: 1000,
    });
    expect(adapt(two(1_000_000, 977_000), raw).lastPlayedCharacterIndex).toBe(0);
    expect(adapt(two(977_000, 1_000_000), raw).lastPlayedCharacterIndex).toBe(1);
    // 0.5 s apart: a tie, so no row opens on its own.
    expect(adapt(two(1_000_000, 999_500), raw).lastPlayedCharacterIndex).toBeNull();
    // The newest character save is 31 s away from the account's: not trusted.
    expect(adapt(two(969_000, 900_000), raw).lastPlayedCharacterIndex).toBeNull();
  });

  it('never reports negative ages', () => {
    const state = toAccountState(parsed({ meta: { ...parsed().meta, now: 0 } }));
    expect(state.account.secondsSinceLastSave).toBe(0);
    expect(state.characters[0]?.secondsSinceLastSave).toBe(0);
  });
});

describe('on real parser output', () => {
  it('rejects a save the parser silently fails on', () => {
    // Keys of one character from a public save, with its class corrupted: Toolbox swallows the crash.
    const save = readSave(PUBLIC_DIR, 'fresh.json') as { data: Record<string, unknown> };
    const data = Object.fromEntries(Object.entries(save.data).filter(([k]) => !/^(Lv0|EquipOrder)_/.test(k)));
    expect(() => accountStateOf({ data })).toThrow(EmptyAccountError);
  });

  it('is deterministic for a fixed now and moves with it', () => {
    const save = readSave(PUBLIC_DIR, 'first.json');
    const a = accountStateOf(save);
    expect(accountStateOf(save)).toEqual(a);
    const later = accountStateOf(save, NOW + 60_000);
    expect(later.account.secondsSinceLastSave).toBe((a.account.secondsSinceLastSave ?? 0) + 60);
  });
});

describe('humanize', () => {
  it.each([
    ['Siege_Breaker', 'Siege Breaker'],
    ['FIGHTING', 'Fighting'],
    ['Paying_Respect', 'Paying Respect'],
  ])('%s -> %s', (id, label) => {
    expect(humanize(id)).toBe(label);
  });
});
