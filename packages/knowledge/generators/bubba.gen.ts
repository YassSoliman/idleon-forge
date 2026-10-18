// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 Bubba F1 (docs/specs/M23-bubba.md TR-3, ADR 0007): Bubba's game tables, generated from Toolbox's
// game data. `bubbaUpgrades` gives the 28 upgrades; the game's CustomLists.Spelunky (`generalSpelunky`)
// gives the Boon bonuses (33), the Charisma labels, names and per-level values (35-37), the Megaflesh texts
// and names (38, 42) and the gift names (39). The judgment (run-order tiers, Megaflesh short labels, Stage
// ratings) is authored in systems/bubba.yaml. Cross-checks fail generation when the data stops matching
// what M23 reads: Boon, Megaflesh and Fun Gifts at 3, 8 and 9 (the upgrades a Megaflesh keeps, N.js
// `_customEvent_Bubbathings`), Fun Gifts' cap of 6, and YumYum Grotto's door 0 leading to map 100 (the
// unlock, `bubba.fact.unlock`).
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';

export interface BubbaUpgradeRow {
  index: number;
  /** "1st Slice": the rawName with spaces, as the game prints it. */
  name: string;
  /** The level cap; 999 means none. */
  x4: number;
}
export interface BubbaMegafleshRow {
  /** 1..12; row 12 (Chromatic) stacks once per Megaflesh past 11. */
  row: number;
  name: string;
  /** The game's effect text, `@` as a line break; `$` is a value the game fills in. */
  text: string;
}
export interface BubbaBoonRow {
  /** 1..7 in rotation order. */
  id: number;
  /** Toolbox's `bubba.bonuses` key. */
  key: string;
  name: string;
  /** Per stack, before the Megaflesh multiplier. */
  perStack: number;
  negative: boolean;
}
export interface BubbaCharismaRow {
  /** 1..6, as Bubba[0][6] selects it. */
  id: number;
  name: string;
  perLevel: number;
  /** The game's label: `}` a multiplier, `{`/`$` the value. */
  label: string;
}
export interface BubbaGiftRow {
  /** 1..6, as Bubba[0][2] and [0][3] pick it. */
  id: number;
  name: string;
}

/** Toolbox's own bonus map in parsers/clickers/bubba.ts (getBubbaBonusesObject), in rotation order. */
const BOON_KEYS: readonly { key: string; name: string; negative: boolean }[] = [
  { key: 'buildRate', name: 'Build Rate', negative: false },
  { key: 'critterGain', name: 'Critter Gain', negative: false },
  { key: 'soulGain', name: 'Soul Gain', negative: false },
  { key: 'totalDamage', name: 'Total Damage', negative: false },
  { key: 'allKills', name: 'All Kills', negative: false },
  { key: 'expMulti', name: 'Class EXP', negative: false },
  { key: 'atomCost', name: 'Atom Cost', negative: true },
];
const PERSISTS: Readonly<Record<number, string>> = { 3: 'Bubba_Boon', 8: 'Megaflesh', 9: 'Fun_Gifts' };
/** Fun Gifts' cap, which the account-state reader also uses (FUN_GIFTS_CAP). */
export const FUN_GIFTS_CAP = 6;

const words = (s: string) => s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
const list = (s: unknown, i: number): unknown[] => {
  const row = Array.isArray(s) ? s[i] : undefined;
  if (!Array.isArray(row)) throw new Error(`bubba: generalSpelunky[${i}] is not a list`);
  return row;
};
const num = (v: unknown, where: string): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`bubba: ${where} is not a number`);
  return n;
};

export function upgradeRows(upgrades: unknown): BubbaUpgradeRow[] {
  if (!Array.isArray(upgrades) || upgrades.length !== 28)
    throw new Error('bubba: bubbaUpgrades is not 28 long');
  const rows = upgrades.map((u: Record<string, unknown>, index) => {
    if (typeof u?.name !== 'string') throw new Error(`bubba: upgrade ${index} has no name`);
    return { index, rawName: u.name, name: words(u.name), x4: num(u.x4, `upgrade ${index} x4`) };
  });
  for (const [i, raw] of Object.entries(PERSISTS))
    if (rows[Number(i)]?.rawName !== raw) throw new Error(`bubba: upgrade ${i} is no longer ${raw}`);
  if (rows[9]?.x4 !== FUN_GIFTS_CAP) throw new Error(`bubba: Fun Gifts' cap is no longer ${FUN_GIFTS_CAP}`);
  return rows.map(({ index, name, x4 }) => ({ index, name, x4 }));
}

export function megafleshRows(spelunky: unknown): BubbaMegafleshRow[] {
  const texts = list(spelunky, 38);
  const names = list(spelunky, 42);
  if (texts.length !== 12 || names.length !== 12) throw new Error('bubba: Megaflesh rows are not 12');
  return texts.map((t, i) => ({
    row: i + 1,
    name: words(String(names[i]))
      .replace(' # ', ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (c) => c.toUpperCase()),
    text: words(String(t)),
  }));
}

export function boonRows(spelunky: unknown): BubbaBoonRow[] {
  const values = list(spelunky, 33);
  return BOON_KEYS.map((b, i) => ({
    id: i + 1,
    key: b.key,
    name: b.name,
    perStack: num(values[i + 1], `Boon bonus ${i + 1}`),
    negative: b.negative,
  }));
}

export function charismaRows(spelunky: unknown): BubbaCharismaRow[] {
  const labels = list(spelunky, 35);
  const names = list(spelunky, 36);
  const values = list(spelunky, 37);
  if (names.length !== 6) throw new Error('bubba: Charisma attributes are not 6');
  return names.map((n, i) => ({
    id: i + 1,
    name: String(n),
    perLevel: num(values[i], `Charisma ${i + 1}`),
    label: words(String(labels[i] ?? '')),
  }));
}

export function giftRows(spelunky: unknown): BubbaGiftRow[] {
  const names = list(spelunky, 39);
  if (names.length !== 6) throw new Error('bubba: gifts are not 6');
  return names.map((n, i) => ({ id: i + 1, name: words(String(n)) }));
}

/** FR-2's cross-check: YumYum Grotto (map 50)'s door 0 leads to the W3 town (map id 100). */
export function checkUnlockDoor(destinations: unknown): void {
  const doors =
    typeof destinations === 'object' && destinations !== null
      ? (destinations as Record<string, unknown>)['50']
      : undefined;
  if (!Array.isArray(doors) || doors[0] !== 100)
    throw new Error("bubba: map 50's door 0 no longer leads to map 100 (bubba.fact.unlock)");
}

const generator = defineGenerator({
  name: 'bubba',
  system: 'bubba',
  inputs: [
    'website-data/shared-data.json#bubbaUpgrades',
    'website-data/shared-data.json#generalSpelunky',
    'website-data/shared-data.json#mapPortalDestinations',
  ],
  run({ data, pin }) {
    checkUnlockDoor(data.mapPortalDestinations);
    const src = (what: string) =>
      generatedSource(pin, 'website-data/shared-data.json', `IdleOn Toolbox game data: ${what}`);
    const table = (id: string, title: string, rows: unknown, what: string): FactTableT => ({
      id,
      system: 'bubba',
      origin: 'generated',
      title,
      rows: rows as FactTableT['rows'],
      sources: [src(what)],
      generatedBy: generatedBy(generator, pin),
    });
    const s = data.generalSpelunky;
    return {
      facts: [
        table('bubba.fact.upgrades', 'Bubba upgrades', upgradeRows(data.bubbaUpgrades), 'bubbaUpgrades'),
        table('bubba.fact.megaflesh', 'Megaflesh tiers', megafleshRows(s), 'generalSpelunky 38, 42'),
        table('bubba.fact.boon', 'Bubba Boon bonuses', boonRows(s), 'generalSpelunky 33'),
        table('bubba.fact.charisma', 'Charisma Chart attributes', charismaRows(s), 'generalSpelunky 35-37'),
        table('bubba.fact.gifts', 'Bubba gifts', giftRows(s), 'generalSpelunky 39'),
      ],
    };
  },
});

export default generator;
