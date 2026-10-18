// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Pure helpers shared by M8's Detectors (M8 TR-1, TR-6): holdings, quest status, the FR-10 character
// pick, carry slots, and display labels. No clock, no names (characters are labelled by class and level).
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import { isKnown } from '@idleon-forge/account-state';
import type { HoldingPlace, Requirement } from './types';

/** "Squire 85": the only way M8 text names a character (TR-13). */
export const who = (c: Pick<CharacterState, 'class' | 'level'>) => `${c.class.replace(/_/g, ' ')} ${c.level}`;

export interface Holding {
  total: number;
  where: HoldingPlace[];
  /** Per place, for "in storage: take 30" and the carrier's own stack. */
  byPlace: Partial<Record<HoldingPlace, number>>;
}

/** TR-6: chest storage + refinery storage + every character's bag, each counted once; never equipped gear. */
export function holdings(state: AccountState, rawName: string): Holding {
  const byPlace: Partial<Record<HoldingPlace, number>> = {};
  const add = (p: HoldingPlace, n: number | undefined) => {
    if (n && n > 0) byPlace[p] = (byPlace[p] ?? 0) + n;
  };
  add('storage', state.account.storageItems?.[rawName]);
  add('refinery', state.account.refineryStorage?.[rawName]);
  for (const c of state.characters) add(`inv:c${c.index}`, c.inventoryItems?.[rawName]);
  const where = Object.keys(byPlace) as HoldingPlace[];
  return { total: where.reduce((n, p) => n + (byPlace[p] ?? 0), 0), where, byPlace };
}

/** The Account State fields holdings read, for `isKnown` (FR-26). */
export function holdingsKnown(state: AccountState): boolean {
  return (
    isKnown(state, 'account.storageItems') &&
    isKnown(state, 'account.refineryStorage') &&
    state.characters.every((c) => isKnown(state, `characters[${c.index}].inventoryItems`))
  );
}

export type QuestStanding = 'done' | 'accepted' | 'acceptable' | 'locked' | 'unknown';

/**
 * FR-4: a quest's status on one character. Keys are strings and not always 1..n (Fishpaste97 uses
 * '971'); the previous quest's key comes from `prevKey`, which the caller takes from the generated
 * quest order, never from key arithmetic.
 */
export function questStanding(
  c: CharacterState,
  npc: string,
  key: string,
  prevKey: string | null,
): QuestStanding {
  const q = c.quests?.[npc];
  if (!c.quests) return 'unknown';
  const s = q?.[key];
  if (s === 1) return 'done';
  if (s === 0) return 'accepted';
  if (prevKey === null) return 'acceptable';
  return q?.[prevKey] === 1 ? 'acceptable' : 'locked';
}

/**
 * The key of the quest before `order` for `npc`: from the generated quests M8 ships when one is there,
 * else the save's own keys for that NPC in Toolbox's order (`quests.json`, which Toolbox walks in order).
 */
export function previousKey(
  state: AccountState,
  npc: string,
  order: number,
  known: ReadonlyMap<string, string>,
): string | null {
  if (order <= 0) return null;
  const fromKb = known.get(`${npc}#${order - 1}`);
  if (fromKb) return fromKb;
  for (const c of state.characters) {
    const keys = Object.keys(c.quests?.[npc] ?? {});
    if (keys.length > order - 1) return keys.sort((a, b) => Number(a) - Number(b))[order - 1] ?? null;
  }
  return null;
}

/** Carry cap per inventory slot for an item on a character; equipment and unknown types take one slot per item. */
export function perSlot(state: AccountState, c: CharacterState, rawName: string): number {
  const type = state.account.heldItemTypes?.[rawName];
  if (!type) return 1;
  return c.carryPerSlot?.[type] ?? 1;
}

/** TR-6: free slots the chosen character needs to carry every item it doesn't hold itself, plus the quest's own. */
export function slotsNeeded(
  state: AccountState,
  c: CharacterState,
  items: readonly Extract<Requirement, { kind: 'item' }>[],
  questSpaces: number,
): number {
  let n = questSpaces;
  for (const i of items) {
    const own = c.inventoryItems?.[i.rawName] ?? 0;
    const carry = Math.max(0, i.amount - own);
    if (carry > 0) n += Math.ceil(carry / perSlot(state, c, i.rawName));
  }
  return n;
}

/** "storage", "refinery storage", or the carrier's class and level. */
export function placeLabel(state: AccountState, p: HoldingPlace): string {
  if (p === 'storage') return 'storage';
  if (p === 'refinery') return 'refinery storage';
  const index = Number(p.slice(5));
  const c = state.characters.find((x) => x.index === index);
  return c ? who(c) : 'a character';
}

/** Natural list: "A", "A and B", "A, B and C". */
export function and(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);
