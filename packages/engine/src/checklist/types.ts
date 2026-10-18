// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 F1 the Daily & Weekly Checklist (docs/specs/M20-skills-parallel-slots.md TR-5): plain data on
// EngineResult.checklist. All times epoch ms, all durations seconds.
import type { SourceRef } from '../result';

export type RowState = 'done' | 'todo' | 'waiting' | 'cannot' | 'unknown';
export type ResetClock =
  | 'daily'
  | 'account-week'
  | 'server-week'
  | 'ballot-week'
  | 'server-day'
  | 'own-timer';
export type RowBand = 'no-bank' | 'banks' | 'weekly';

export interface ChecklistRow {
  /** Row id from `checklist.fact.rows`. */
  id: string;
  band: RowBand;
  clock: ResetClock;
  label: string;
  state: RowState;
  /** FR-5: one line per grouped item, or the state's own detail ("best 0 of 5 · try again after your daily reset"). */
  details: string[];
  /** End of the period this state is for (FR-3); null when the clock can't be told (server day, V8). */
  periodEnd: number | null;
  /** `waiting` only: when the row becomes doable. */
  availableAt: number | null;
  /** FR-7. */
  lostBeforeReturn: boolean;
  /** FR-3: the row's clock rolled over since the save. */
  resetSinceSave: boolean;
  effortSeconds: number;
  /** FR-14: the first save in this period that showed it done; null in paste mode. */
  doneAt: number | null;
  /** FR-15: a row the save can't judge; `key` is the preference key without the account prefix. */
  manual: null | { key: string; hint: string };
  /** FR-8: the Goal or Active Play entry that already carries this row's Next Action. */
  link: null | { kind: 'goal' | 'active-play'; key: string };
  /** FR-8: the row's own one-line instruction when nothing links; null otherwise. */
  nextAction: string | null;
  /** The System the row's "See it" opens when it has no link (M17 `SYSTEM_HOMES`). */
  systemId: string;
  sources: SourceRef[];
}

export interface Checklist {
  clocks: { daily: number | null; accountWeek: number | null; serverWeek: number; ballotWeek: number };
  /** FR-6: done / (done + todo + waiting); `cannot`, `unknown` and gated rows never count. */
  rings: { today: { done: number; total: number }; week: { done: number; total: number } };
  /** Band order, then todo, waiting, done. */
  rows: ChecklistRow[];
  /** FR-4 "Opens later". */
  gated: Array<{ band: RowBand; text: string }>;
  /** FR-12: open by default when a row is lost before return. */
  expanded: boolean;
}
