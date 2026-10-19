// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Daily & Weekly picture's arithmetic (M21 FR-T2), pure and tested: where the day and week rings
// stand, the banking rows' day pips, and the Five-minute plan. Every word comes from the engine's view
// words; every number from the engine's checklist rows (DS-23: nothing invented).
import type { ChecklistRowView, ChecklistView } from '@idleon-forge/engine/now';
import type { Checklist } from '@idleon-forge/engine/result';

const DAY = 86_400_000;
const WEEK = 7 * DAY;

/** How far round each ring is: the time left to its reset as a fraction of its period; null when unknown. */
export function ringFractions(
  clocks: Checklist['clocks'] | undefined,
  now: number,
): { day: number | null; week: number | null } {
  const frac = (at: number | null | undefined, period: number) =>
    at == null || at <= now ? null : Math.min(1, (at - now) / period);
  return { day: frac(clocks?.daily, DAY), week: frac(clocks?.accountWeek, WEEK) };
}

/** One banked item: "Lonely Hunter: 3 days banked, 2 lost" (M20 FR-5's detail line) as pips. */
export interface BankPips {
  name: string;
  kept: number;
  lost: number;
}

const BANKED = /^(.+?): (\d+) days? banked(?:, (\d+) lost)?$/;

/** The banking rows' details as day pips (0 to 3 kept, then the lost ones); other details stay text. */
export function bankPips(details: readonly string[]): { pips: BankPips[]; rest: string[] } {
  const pips: BankPips[] = [];
  const rest: string[] = [];
  for (const d of details) {
    const m = BANKED.exec(d);
    if (m?.[1] && m[2]) pips.push({ name: m[1], kept: Math.min(3, Number(m[2])), lost: Number(m[3] ?? 0) });
    else rest.push(d);
  }
  return { pips, rest };
}

const BAND_ORDER: Record<ChecklistRowView['band'], number> = { 'no-bank': 0, banks: 1, weekly: 2 };

/**
 * The time planner (M24 `TimelineDaily`; M21's Five-minute plan): the to-do rows that fit in `minutes`,
 * the ones already being lost first (a banking row past its bank), then no-bank, banking and weekly rows,
 * each row's own effort from the engine, added up until the next one would not fit.
 */
export function planFor(
  view: ChecklistView,
  effortOf: (id: string) => number | null,
  minutes: number,
): { rows: ChecklistRowView[]; usedSeconds: number } {
  const todo = view.bands
    .flatMap((b) => b.rows)
    .filter((r) => r.state === 'todo')
    .map((r, i) => ({ r, i }))
    .sort(
      (a, z) =>
        (z.r.lostBeforeReturn ? 1 : 0) - (a.r.lostBeforeReturn ? 1 : 0) ||
        BAND_ORDER[a.r.band] - BAND_ORDER[z.r.band] ||
        a.i - z.i,
    );
  const budget = minutes * 60;
  const rows: ChecklistRowView[] = [];
  let used = 0;
  for (const { r } of todo) {
    const e = effortOf(r.id);
    if (e === null || used + e > budget) continue;
    rows.push(r);
    used += e;
  }
  return { rows, usedSeconds: used };
}
