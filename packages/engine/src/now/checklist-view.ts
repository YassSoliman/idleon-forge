// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Daily & Weekly Checklist section's view model (M20 FR-12, FR-13, FR-15): the engine's rows worded
// with local times and the Timeline's one duration format (`span`), the player's Done ticks applied
// (FR-15) and the two rings recounted with them. The UI renders it as is. Pure; UI-thread safe.
import type { ChecklistRow, EngineResult, RowState } from '../result';
import { sourceView } from './build-now-view';
import { clockAt, inSpan, span } from './format';
import type { NowPrefs } from './prefs';
import type { ChecklistBandView, ChecklistRowView, ChecklistView } from './view';

const STATE: Record<RowState, { word: string; glyph: string }> = {
  todo: { word: 'To do', glyph: '○' },
  waiting: { word: 'Waiting', glyph: '◷' },
  done: { word: 'Done', glyph: '✓' },
  cannot: { word: "Can't", glyph: '⊘' },
  unknown: { word: "Can't tell", glyph: '?' },
};
const BANDS: { band: ChecklistRow['band']; title: string }[] = [
  { band: 'no-bank', title: 'No bank: lost at the reset' },
  { band: 'banks', title: 'Banks up to 3 days' },
  { band: 'weekly', title: 'Weekly' },
];
const TIMELINE_ROWS = new Set(['killroy-skulls', 'random-event']);

/** FR-13: each clock in plain words. */
function clockText(r: ChecklistRow, now: number): string | null {
  if (r.periodEnd === null) return r.clock === 'server-day' ? 'resets with the server day' : null;
  const left = inSpan(r.periodEnd - now);
  switch (r.clock) {
    case 'account-week':
      return `your weekly reset ${left}`;
    case 'server-week':
      return `new boss Thursday 00:00 UTC, ${left}`;
    case 'ballot-week':
      return `new ballot Monday about 17:00 UTC, ${left}`;
    default:
      return `resets ${left}`;
  }
}

export interface ChecklistUi {
  now: number;
  tzOffsetMinutes: number;
}

export function checklistView(result: EngineResult, prefs: NowPrefs, ui: ChecklistUi): ChecklistView | null {
  const c = result.checklist ?? null;
  if (!c) return null;
  const ticks = prefs.ticks ?? {};
  const rows: ChecklistRowView[] = c.rows.map((r) => {
    const ticked = r.manual ? (ticks[r.manual.key] ?? 0) > ui.now : false;
    const state: RowState = ticked ? 'done' : r.state;
    const s = STATE[state];
    return {
      id: r.id,
      band: r.band,
      state,
      stateWord: s.word,
      glyph: s.glyph,
      label: r.label,
      details: r.details,
      clockText: clockText(r, ui.now),
      availableText:
        r.state === 'waiting' && r.availableAt !== null
          ? `from ${clockAt(r.availableAt, ui.tzOffsetMinutes)}, ${inSpan(r.availableAt - ui.now)}`
          : null,
      effort: span(r.effortSeconds * 1000),
      lostBeforeReturn: r.lostBeforeReturn && !ticked,
      doneAt: r.doneAt !== null ? `done at ${clockAt(r.doneAt, ui.tzOffsetMinutes)}` : null,
      manual: r.manual ? { key: r.manual.key, ticked, hint: r.manual.hint } : null,
      link: r.link,
      nextAction: r.nextAction,
      systemId: r.systemId,
      timeline: TIMELINE_ROWS.has(r.id),
      source: r.sources.length ? sourceView(r.sources, false) : null,
    };
  });
  const counted = (pick: (r: ChecklistRowView) => boolean) => {
    const rs = rows.filter(
      (r) => pick(r) && (r.state === 'done' || r.state === 'todo' || r.state === 'waiting'),
    );
    return { done: rs.filter((r) => r.state === 'done').length, total: rs.length };
  };
  const today = counted((r) => r.band !== 'weekly');
  const week = counted((r) => r.band === 'weekly');
  const order: Record<RowState, number> = { todo: 0, waiting: 1, cannot: 2, unknown: 3, done: 4 };
  const bands: ChecklistBandView[] = BANDS.map(({ band, title }) => {
    const mine = rows.filter((r) => r.band === band).sort((a, b) => order[a.state] - order[b.state]);
    return {
      band,
      title,
      rows: mine.filter((r) => r.state !== 'done'),
      done: mine.filter((r) => r.state === 'done'),
      later: c.gated.filter((g) => g.band === band).map((g) => g.text),
    };
  }).filter((b) => b.rows.length + b.done.length + b.later.length > 0);
  return {
    rings: { today, week },
    ringText: `Today ${today.done} of ${today.total} · Week ${week.done} of ${week.total}`,
    dailyText:
      c.clocks.daily === null
        ? "can't tell when your daily reset is"
        : `daily reset ${inSpan(c.clocks.daily - ui.now)}`,
    weekWhy:
      'The week ring mixes three weekly clocks (your weekly reset, the Thursday boss and the Monday ballot), so it can partly refill mid-week.',
    expanded: rows.some((r) => r.lostBeforeReturn),
    bands,
  };
}
