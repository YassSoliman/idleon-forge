// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Shared by the Rift Detectors (M26 FR-11): the read guard, the shown level, and test states (exported
// through helpers.ts). Every Rift number a player reads comes from `riftLabel()` (FR-4).
import {
  type AccountState,
  isKnown,
  type RiftState,
  riftLabel,
  riftTaskOf,
} from '@idleon-forge/account-state';

export const RIFT_READS: readonly string[] = [
  'account.rift',
  'account.currentWorld',
  'characters[*].index',
  'diagnostics',
];

/** The Rift when it can be read; 'unknown' when its section failed; null when the save has none (pre-W4). */
export function riftOf(state: AccountState): RiftState | 'unknown' | null {
  if (!isKnown(state, 'account.rift')) return 'unknown';
  return state.account.rift ?? null;
}

/** The level a player reads: `riftLabel(Rift[0])`. */
export const shownLevel = (r: RiftState): number => riftLabel(r.level);

/** The task text of the levels the examples use (Toolbox `riftInfo`). */
const RIFT_TASK_TEXT: Record<number, string> = {
  0: "DEFEAT_500_MONSTERS_WITHIN_5_MIN._@_YOU'VE_DEFEATED_{_SO_FAR...",
  2: "DEFEAT_ALL_MOBS_BEFORE_THEY_RESPAWN_ON_3_CHARACTERS._YOU'VE_DONE_{_SO_FAR...",
  7: 'GET_AN_ORB_SCORE_OF_180_ON_YOUR_DIVINE_KNIGHT._YOUR_BEST_IS_{_SO_FAR...',
  9: "KILL_200000_MONSTERS_WHILE_AFK._YOU'VE_KILLED_{_SO_FAR...",
};

/** A test state: the save's Rift set to `level` with `progress`, everything else as read. */
export function atRift(
  s: AccountState,
  level: number,
  progress: number,
  patch: Partial<RiftState> = {},
): AccountState {
  const r = s.account.rift;
  if (!r) return s;
  const task = riftTaskOf(level, { task: RIFT_TASK_TEXT[level], monsterName: 'Rift_Slug' });
  return {
    ...s,
    account: {
      ...s.account,
      rift: {
        ...r,
        unlocked: true,
        level,
        progress,
        task,
        complete: task?.quota != null && progress >= task.quota,
        ...patch,
      },
    },
  };
}
