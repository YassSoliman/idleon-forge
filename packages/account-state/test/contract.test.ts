// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Contract tests: the adapter must produce a valid Account State from every public Toolbox save at
// the current parser pin. After `pnpm sync-parsers`, a failure here means upstream changed a field we
// read; the snapshot diff shows what moved.
import { describe, expect, it } from 'vitest';
import {
  type AccountState,
  type CardLoadout,
  type ObolSlot,
  type PresetTalents,
  SCHEMA_VERSION,
} from '../src';
import { accountStateOf, listJson, NOW, PRIVATE_DIR, PUBLIC_DIR, readSave } from './helpers';

const publicSaves = listJson(PUBLIC_DIR);
const privateSaves = listJson(PRIVATE_DIR, '.raw.json');

function expectValid(state: AccountState) {
  expect(state.schemaVersion).toBe(SCHEMA_VERSION);
  expect(state.asOf).toBe(NOW);
  const { account, characters } = state;
  expect(account.currentWorld).toBeGreaterThanOrEqual(1);
  expect(account.currentWorld).toBeLessThanOrEqual(8);
  for (const w of account.finishedWorlds) expect(w).toBeLessThan(account.currentWorld ?? 0);
  expect(account.lastCloudSave).toBeGreaterThan(Date.UTC(2020, 0, 1));
  expect(account.secondsSinceLastSave).toBeGreaterThanOrEqual(0);
  expect(account.gameVersion.parserTarget).toMatch(/^\d+\.\d+\.\d+$/);

  expect(characters.length).toBeGreaterThan(0);
  const indices = characters.map((c) => c.index);
  expect(new Set(indices).size).toBe(indices.length);
  for (const c of characters) {
    expect(c.name.length).toBeGreaterThan(0);
    expect(c.class.length).toBeGreaterThan(0);
    expect(c.level).toBeGreaterThanOrEqual(1);
    expect(c.afkType?.length).toBeGreaterThan(0);
    if (c.afkType === 'Nothing') expect(c.afkTarget).toBeNull();
    expect(c.currentMap).toEqual(expect.any(String));
    for (const f of c.foodStacks) {
      expect(f.item?.length).toBeGreaterThan(0);
      expect(f.amount).toBeGreaterThan(0);
    }
    expect(c.secondsSinceLastSave).toBeGreaterThanOrEqual(0);
  }
  if (state.lastPlayedCharacterIndex !== null) expect(indices).toContain(state.lastPlayedCharacterIndex);

  // A clean save at this pin: every field passed its presence check and every id is known.
  const d = state.diagnostics;
  expect(d.failedSections).toEqual([]);
  expect(d.unreadableCharacters).toEqual([]);
  expect(d.unknownFields).toEqual([]);
  expect(d.unknownIds).toEqual({ monsters: [], maps: [], items: [], classes: [] });
  expect(d.parserPin.gameVersion).toBe(account.gameVersion.parserTarget);
}

/** No warnings other than skipped stub characters: anything else is a contract break. */
const unexpectedWarnings = (state: AccountState) =>
  state.warnings.filter((w) => !w.endsWith('has no save data and was skipped.'));

/** M9's presets as a digest (per-tab spend and talent count, star spend, the bar), not ~150 rows each. */
const presetDigest = (p: PresetTalents | null) =>
  p && {
    tabs: p.tabs.map((t) => ({
      tab: t.tab,
      tabName: t.tabName,
      talents: t.talents.length,
      spent: t.talents.reduce((n, x) => n + x.base, 0),
    })),
    starSpent: p.star.reduce((n, x) => n + x.base, 0),
    attackBar: p.attackBar,
  };
/**
 * M14's printer, presets and rates are recorded one line each (or rounded): their values are checked in
 * walkthrough.test.ts. M14 reads M8's holdings and quests, recorded with M8's maps below.
 */
const line = (v: unknown) => (v && typeof v === 'object' ? JSON.stringify(v) : v);
const round = (v: Record<string, number> | null | undefined) =>
  v ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, Math.round(x)])) : v;

/** What the shape snapshot records: everything but names (and the pin's commit, which re-syncs move). */
/**
 * M8's lookup maps (by item, card, stamp or NPC) are recorded as their entry counts: their values are
 * checked in collections.test.ts, and hundreds of lines per save would bury the shape diff a re-sync
 * needs reviewed.
 */
const ACCOUNT_MAPS = ['stampLevels', 'storageItems', 'refineryStorage', 'heldItemTypes', 'cards'] as const;
const CHARACTER_MAPS = ['quests', 'inventoryItems', 'carryPerSlot'] as const;
const count = (v: unknown) => (v && typeof v === 'object' ? { entries: Object.keys(v as object).length } : v);
const compact = (o: Record<string, unknown>, keys: readonly string[]) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, keys.includes(k) ? count(v) : v]));

/** Obol slots and card loadouts one line each. */
const slots = (v: ObolSlot[] | null | undefined) =>
  v
    ?.map(
      (o) =>
        `${o.shape[0]}${o.levelReq}${o.state === 'filled' ? `=${o.obol}` : o.state === 'locked' ? 'x' : '_'}`,
    )
    .join(' ') ?? v;
const loadout = (v: CardLoadout | null | undefined) => (v ? JSON.stringify(v) : v);

const shapeOf = (state: AccountState) => ({
  account: {
    ...compact(state.account as unknown as Record<string, unknown>, ACCOUNT_MAPS),
    shopStock: state.account.shopStock?.map(count) ?? state.account.shopStock,
    familyObols: slots(state.account.familyObols),
    storedObols:
      state.account.storedObols?.map((o) => `${o.shape[0]}=${o.rawName}`).join(' ') ??
      state.account.storedObols,
    cardSets: state.account.cardSets?.map((s) => `${s.rawName} tier ${s.tier} (${s.points}/${s.size})`),
    printer: line(state.account.printer),
    // M18 TR-2: digests, so a re-sync diff shows what moved without listing every stat.
    gearItems: state.account.gearItems && `${Object.keys(state.account.gearItems).length} items`,
    anvilRecipes: state.account.anvilRecipes?.map((t) => t.length).join('/') ?? state.account.anvilRecipes,
    // M21 TR-3: one line, "level/grade" per statue (per-character levels checked in redesign.test.ts).
    statues: state.account.statues?.map((x) => `${x.level}/${x.grade}`).join(' ') ?? state.account.statues,
  },
  characters: state.characters.map(({ name: _name, talents, ...c }) => ({
    ...compact(c as unknown as Record<string, unknown>, CHARACTER_MAPS),
    personalObols: slots(c.personalObols),
    cardLoadout: loadout(c.cardLoadout),
    talents: talents && {
      ...talents,
      active: presetDigest(talents.active),
      other: presetDigest(talents.other),
    },
    gear: c.gear?.map((w) => (w === null ? '-' : typeof w === 'string' ? w : `${w[0]}+stones`)).join(' '),
    skillEfficiency: round(c.skillEfficiency),
    anvilSpeed: c.anvilSpeed == null ? c.anvilSpeed : Math.round(c.anvilSpeed),
    talentPresets: c.talentPresets
      ? `selected ${c.talentPresets.selected}: ${c.talentPresets.presets.map((p) => Object.keys(p.levels).length).join('/')} talents`
      : c.talentPresets,
    cardPresets: line(c.cardPresets),
    // M21 TR-3: maps and doors still open (kills left above 0), not 300+ rows per character.
    doorKillsLeft: c.doorKillsLeft
      ? (() => {
          const rows = Object.values(c.doorKillsLeft);
          return `${rows.length} maps, ${rows.flat().filter((n) => n > 0).length} doors open`;
        })()
      : c.doorKillsLeft,
  })),
  lastPlayedCharacterIndex: state.lastPlayedCharacterIndex,
  diagnostics: { ...state.diagnostics, parserPin: { gameVersion: state.diagnostics.parserPin.gameVersion } },
  warnings: state.warnings,
});

describe.each(publicSaves)('public save %s', (file) => {
  const state = accountStateOf(readSave(PUBLIC_DIR, file));

  it('produces a valid Account State', () => {
    expectValid(state);
  });

  it('parses every parser section and finds every name', () => {
    expect(unexpectedWarnings(state)).toEqual([]);
  });

  it('matches the recorded shape (review the diff after a re-sync)', () => {
    // Names are left out of the snapshot on purpose; the shape is what the contract is about.
    expect(shapeOf(state)).toMatchSnapshot();
  });
});

describe('across all public saves', () => {
  const states = publicSaves.map((f) => accountStateOf(readSave(PUBLIC_DIR, f)));
  const all = states.flatMap((s) => s.characters);

  it('reads the daily reset countdown from every public save', () => {
    for (const s of states) expect(s.account.dailyResetInSeconds).toEqual(expect.any(Number));
  });

  it('reads the total account level as the sum of every class level (issue #60)', () => {
    for (const s of states) {
      expect(s.account.accountLevel).toEqual(expect.any(Number));
      // Readable characters are a lower bound: Toolbox also counts any it could read and we couldn't.
      const sum = s.characters.reduce((n, c) => n + c.level, 0);
      expect(s.account.accountLevel).toBeGreaterThanOrEqual(sum);
    }
  });

  // M1 TR-16 set 200 KB; M8's collections and M9's talent presets together put the largest public
  // save (730 KB raw, about 3x a real account) at ~255 KB, so the cap moved to 300 KB in release 4.
  // M20 TR-2 adds skills and Parallel Slots per character (~13 KB on the 17-character speedrun save,
  // ~3 KB on a real W3 account), so the guard was 320 KB; the history step keeps only compact entries.
  // M18 TR-2 adds worn gear and every held item's stats, stored once per rawName (+17 KB on highend.json,
  // which holds 122 kinds of gear; +5 KB on a real W3 account), so the guard was 340 KB.
  // M21 TR-3 adds door kills on every map (one small array per map, clamped at 0) and the statue levels
  // per character (+19 KB on highend.json's 11 late characters, 351.9 KB in all; +4 KB on a real W3
  // account), so the guard is 360 KB.
  it('keeps every Account State under the 360 KB history cap (TR-16, M20 TR-2, M18 TR-2, M21 TR-3)', () => {
    const largest = Math.max(...states.map((s) => new TextEncoder().encode(JSON.stringify(s)).length));
    expect(largest).toBeLessThan(360 * 1024);
  });

  it('has the 11 public saves', () => {
    expect(publicSaves).toHaveLength(11);
  });

  it('sees fighting and skilling AFK Targets, with targets and food', () => {
    const types = new Set(all.map((c) => c.afkType));
    expect(types.has('FIGHTING')).toBe(true);
    expect([...types].some((t) => t !== 'FIGHTING' && t !== 'Nothing')).toBe(true);
    expect(all.some((c) => c.afkTarget !== null)).toBe(true);
    expect(all.some((c) => c.foodStacks.length > 0)).toBe(true);
  });
});

describe.skipIf(privateSaves.length === 0)('private saves (local only)', () => {
  // Real accounts: assert without printing names or values (no toEqual on the state itself).
  const stateOf = (file: string) => accountStateOf(readSave(PRIVATE_DIR, file));

  it.each(privateSaves)('%s produces a valid Account State', (file) => {
    expectValid(stateOf(file));
  });

  it.each(privateSaves)('%s parses every parser section and finds every name', (file) => {
    expect(unexpectedWarnings(stateOf(file)).length).toBe(0);
  });

  it.each(privateSaves)('%s matches its local shape snapshot', async (file) => {
    // Kept beside the saves in the gitignored fixtures/private/, never committed.
    await expect(`${JSON.stringify(shapeOf(stateOf(file)), null, 2)}\n`).toMatchFileSnapshot(
      `${PRIVATE_DIR}__shape__/${file.replace(/\.raw\.json$/, '.shape.json')}`,
    );
  });

  // US-5 and TR-12: checked by hand on both real saves.
  const LAST_PLAYED: Record<string, number> = { 'yasser.raw.json': 0, 'joseph.raw.json': 5 };
  it.each(privateSaves.filter((f) => f in LAST_PLAYED))(
    '%s marks the right last-played character',
    (file) => {
      expect(stateOf(file).lastPlayedCharacterIndex === LAST_PLAYED[file]).toBe(true);
    },
  );
});
