// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Focus follows the game (M10 FR-14, D1), as ruled on #38 from the live recording:
// - a character-switch save stamps the character just LEFT; an autosave stamps the current one;
// - after a switch save the screen marks "Left X ✓ n done" and moves Focus to the next Visit-Order
//   character as "Next up";
// - the next autosave confirms it, or silently corrects it (the save that stamps a different character
//   as current wins);
// - a tap on a row or strip chip means "I'm on X" until a save confirms or contradicts it.
// M1's `classifySave` can be one save late or briefly wrong (the first switch after an autosave looks
// like another autosave), so every rule here is a guess the next save may overwrite. Pure: the screen
// decides whether to apply `followTo` (never mid-interaction).
import type { SaveKind } from '@idleon-forge/sync';

/** N1 (ruled): auto-open and the "● playing" marker only while the last cloud save is under 5 minutes. */
export const AUTO_OPEN_MS = 5 * 60_000;

export type PlayingStatus = 'confirmed' | 'assumed' | 'next-up';

export interface FollowState {
  playing: { index: number; status: PlayingStatus } | null;
  /** The character just left, for the "Left <name>" line. */
  leftFrom: number | null;
  /** Visited this Play Session (FR-12): played, left, or (paste mode) opened by hand. */
  visited: number[];
  sessionStartedAt: number | null;
}

export const INITIAL_FOLLOW: FollowState = {
  playing: null,
  leftFrom: null,
  visited: [],
  sessionStartedAt: null,
};

export interface SaveEvent {
  kind: SaveKind;
  /** The slot the save stamped (M1 `stampedSlot`); null never moves the view. */
  slot: number | null;
  /** The last cloud save is under `AUTO_OPEN_MS` old. */
  fresh: boolean;
  sessionStartedAt: number | null;
  /** FR-12's Next target: the worst unvisited character with something to do, skipping `exclude`. */
  nextUp(exclude: number, visited: ReadonlySet<number>): number | null;
}

export interface FollowResult {
  state: FollowState;
  /** Where Focus should move, or null to stay. */
  followTo: number | null;
}

const withVisited = (visited: number[], ...add: number[]) => [...new Set([...visited, ...add])];

export function onSave(prev: FollowState, e: SaveEvent): FollowResult {
  const sameSession = prev.sessionStartedAt === e.sessionStartedAt;
  const base: FollowState = sameSession
    ? prev
    : { playing: null, leftFrom: null, visited: [], sessionStartedAt: e.sessionStartedAt };
  if (e.slot === null || !e.fresh) return { state: base, followTo: null };
  const slot = e.slot;
  if (e.kind === 'switch-leave') {
    const visited = withVisited(base.visited, slot);
    const next = e.nextUp(slot, new Set(visited));
    return {
      state: {
        ...base,
        visited,
        leftFrom: slot,
        playing: next === null ? null : { index: next, status: 'next-up' },
      },
      followTo: next,
    };
  }
  // `autosave` (and `first`, when there is nothing to compare with): `slot` is being played.
  const moved = base.playing?.index !== slot;
  return {
    state: {
      ...base,
      visited: withVisited(base.visited, slot),
      leftFrom: moved ? base.leftFrom : base.leftFrom === slot ? null : base.leftFrom,
      playing: { index: slot, status: 'confirmed' },
    },
    followTo: moved ? slot : null,
  };
}

/** "I'm on X": a tap on a row or a strip chip, until a save confirms or contradicts it. */
export function onTap(prev: FollowState, index: number, live: boolean): FollowState {
  return {
    ...prev,
    visited: withVisited(prev.visited, index),
    playing: live ? { index, status: prev.playing?.index === index ? prev.playing.status : 'assumed' } : null,
  };
}
