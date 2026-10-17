// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Expected Return the engine uses (M3 FR-1, FR-3, FR-4): the player's choice for the current Play
// Session, else the learned value, else 8 h. The learned value itself (FR-2, D5, RT-6) is computed by
// M1 from its Play Sessions (`learnedExpectedReturn` in @idleon-forge/sync) and reaches the engine as
// `EngineHistory.learnedExpectedReturnSeconds` (M10 TR-6), so it is an input here, not recomputed.
import type { ExpectedReturn } from './types';

export const HOUR_MS = 3_600_000;
/** #10 item 4. */
export const DEFAULT_EXPECTED_RETURN_MS = 8 * HOUR_MS;

export interface ExpectedReturnInput {
  /** M10 TR-8 `expectedReturn` preference, or null. */
  choice: { seconds: number; chosenAt: number } | null;
  /** The learned value (ms, whole hours), or null without enough history. */
  learnedMs: number | null;
  /** The first save of the current Play Session (M1 TR-15); null when unknown (paste mode). */
  currentSessionStart: number | null;
}

const valid = (ms: number | null | undefined): ms is number =>
  typeof ms === 'number' && Number.isFinite(ms) && ms > 0;

export function resolveExpectedReturn(input: ExpectedReturnInput): ExpectedReturn {
  const learnedMs = valid(input.learnedMs) ? input.learnedMs : null;
  const c = input.choice;
  // FR-3: a choice holds until the next Play Session starts.
  const current =
    c !== null &&
    valid(c.seconds) &&
    Number.isFinite(c.chosenAt) &&
    (input.currentSessionStart === null || c.chosenAt >= input.currentSessionStart);
  if (current) return { usedMs: Math.round(c.seconds * 1000), learnedMs, source: 'player' };
  if (learnedMs !== null) return { usedMs: learnedMs, learnedMs, source: 'learned' };
  return { usedMs: DEFAULT_EXPECTED_RETURN_MS, learnedMs: null, source: 'default' };
}

/** FR-4: when the player is back. */
export const returnAtOf = (now: number, er: ExpectedReturn): number => now + er.usedMs;
