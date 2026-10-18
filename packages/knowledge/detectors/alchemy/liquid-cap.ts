// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-25, RT-4, Final rulings R-PILL-2 (owner, 2026-10-17): Water truly at cap (`current >= maxLiquid`),
// so its regeneration has stopped. An account-level Check, from W2-early, for Water only until the unlock
// gate of liquids 2-4 is verified (TR-12 item 6).
// Two parts, one per entry (one entry has one effect, RT-12):
// - `slow`: the blocker. It fires only when the player's own save history shows Water refilling slower
//   than the Expected Return (`max / rate >= return`), so leaving it full loses the whole return.
// - `line`: the ordinary account line. It fires at cap in every other case: no history (never block
//   without one), or a refill faster than the return (at most one bar's worth is lost).
// The rate is observed (Toolbox has none, TR-6): over consecutive saves at least 10 minutes apart in
// which Water rose and was below its cap at both ends (a capped interval reads as rate 0, RT-15), the
// median of Δcurrent / Δt. Toolbox's own `liquids` alert is not used: at this pin it compares against the
// cauldron object, not maxLiquid, so it never fires, and its 90% threshold is a user setting.
import type { AccountState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount, withUnknown } from '../../src/helpers';
import { defineDetector, type HistoryEntry } from '../../src/types';

const WORLD = 2;
const WATER = 0;
const HOUR = 3_600_000;
const MIN_GAP_MS = 10 * 60_000;

const waterOf = (s: AccountState) => s.account.afk?.liquids?.find((l) => l.index === WATER) ?? null;

const atCap = (s: AccountState): AccountState => {
  const afk = s.account.afk;
  if (!afk?.liquids) return s;
  return withAccount(s, { afk: { ...afk, liquids: afk.liquids.map((l) => ({ ...l, current: l.max })) } });
};

/** Water per hour from the player's saves, or null without a usable interval. */
function observedWaterRate(history: readonly HistoryEntry[]): number | null {
  const points = history
    .map((h) => ({ at: h.lastCloudSave, w: waterOf(h.state) }))
    .filter((p): p is { at: number; w: NonNullable<ReturnType<typeof waterOf>> } => p.w !== null)
    .sort((a, b) => a.at - b.at);
  const rates: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (!a || !b) continue;
    const dt = b.at - a.at;
    const rise = b.w.current - a.w.current;
    if (dt < MIN_GAP_MS || rise <= 0 || a.w.current >= a.w.max || b.w.current >= b.w.max) continue;
    rates.push(rise / (dt / HOUR));
  }
  if (rates.length === 0) return null;
  rates.sort((x, y) => x - y);
  return rates[Math.floor((rates.length - 1) / 2)] ?? null;
}

export default defineDetector({
  id: 'alchemy/liquid-cap',
  kind: 'check',
  system: 'alchemy',
  params: z.strictObject({ part: z.enum(['slow', 'line']) }),
  slots: z.strictObject({ current: z.number(), max: z.number(), refill: z.number() }).partial(),
  reads: ['asOf', 'account.afk', 'account.currentWorld', 'diagnostics'],
  examples: {
    fires: [
      // R-PILL-2: the W2-late account's Water at 32/32 with no history is the account line.
      { fixture: 'scrubbed-w2', params: { part: 'line' }, subject: accountSubject },
      { fixture: 'scrubbed-w3', params: { part: 'line' }, subject: accountSubject, mutate: atCap },
    ],
    silent: [
      // No history: never the blocker.
      { fixture: 'scrubbed-w2', params: { part: 'slow' } },
      // US-6: the W3-early account's Water at 92.7/138.
      { fixture: 'scrubbed-w3', params: { part: 'line' }, subject: accountSubject },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        params: { part: 'line' },
        mutate: (s) => withUnknown(s, 'account.afk.liquids'),
      },
    ],
  },
  run({ state, now, history, expectedReturnMs }, { part }) {
    if (!isKnown(state, 'account.currentWorld') || (state.account.currentWorld ?? 0) < WORLD) return [];
    const subject = accountSubject;
    if (!isKnown(state, 'account.afk.liquids') || !state.account.afk?.liquids)
      return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
    const water = waterOf(state);
    if (!water) return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
    if (water.current < water.max)
      return part === 'line' ? [{ subject, slots: {}, result: 'pass' as const }] : [];
    const rate = observedWaterRate(history);
    const refillMs = rate !== null && rate > 0 ? (water.max / rate) * HOUR : null;
    const slow = refillMs !== null && refillMs >= expectedReturnMs;
    if ((part === 'slow') !== slow) return [];
    return [
      {
        subject,
        slots: { current: water.current, max: water.max, ...(refillMs !== null ? { refill: refillMs } : {}) },
        result: 'fires' as const,
        at: Math.min(now, state.asOf),
        // The blocker's fix holds: refilling from empty takes at least the whole return.
        fixHolds: part === 'slow',
      },
    ];
  },
});
