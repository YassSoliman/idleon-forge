// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What kind of cloud save this is, from which character it stamped (live recording on Yasser's
// account, 2026-10-17, ticket #38):
// - a character-switch save stamps `PTimeAway` of the character just LEFT, and carries that
//   character's final state (Exp, kills, items, quests);
// - an autosave (every ~2–4 min) stamps the CURRENT character;
// - characters away on AFK are never saved; their state changes only when visited.
// So a save's "stamped slot" is the character with the newest own save time, and a change of stamped
// slot between two saves marks a leave: the character stamped by the new save has been left (or, when
// that save is the first autosave on a newly visited character, is being played; the next save tells).
import type { AccountState } from '@idleon-forge/account-state';

/** Two character save times closer than this can't be told apart: no stamped slot. */
const TIE_MS = 1000;

/**
 * The character this save stamped: the one whose own save time is the newest, or null when two are
 * within 1 s of each other or no character has a save time.
 */
export function stampedSlot(state: AccountState): number | null {
  const times = state.characters
    .filter((c) => c.secondsSinceLastSave !== null)
    .map((c) => ({ slot: c.index, at: state.asOf - (c.secondsSinceLastSave ?? 0) * 1000 }))
    .sort((a, b) => b.at - a.at);
  const [newest, next] = times;
  if (!newest) return null;
  if (next && newest.at - next.at < TIE_MS) return null;
  return newest.slot;
}

export type SaveKind = 'switch-leave' | 'autosave' | 'first';

export interface SaveClass {
  /**
   * `first`: nothing to compare with (no previous save, or either stamped slot unknown).
   * `switch-leave`: the stamped slot changed, so `slot` was just left (or, for the first autosave
   * after arriving on it, is being played; a following save with the same slot means the latter).
   * `autosave`: the same slot as the previous save: `slot` is the character being played.
   */
  kind: SaveKind;
  /** The slot this save stamped; null when it can't be told. */
  slot: number | null;
}

/** Classifies `curr` against the save before it (M10 FR-14 ruling: "Left X ✓", then Next up). */
export function classifySave(prev: AccountState | null, curr: AccountState): SaveClass {
  const slot = stampedSlot(curr);
  const before = prev ? stampedSlot(prev) : null;
  if (slot === null || before === null) return { kind: 'first', slot };
  return { kind: slot === before ? 'autosave' : 'switch-leave', slot };
}
