// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 F1 the Daily & Weekly Checklist (docs/specs/M20-skills-parallel-slots.md FR-1 to FR-15): the rows of
// `checklist.fact.rows`, each read from the save at `now`, linked to the Goal or Active Play entry that
// already carries its Next Action (FR-8, never a duplicate), with the two rings and the "Opens later"
// lines. Pure: the engine runs it after every other module, on their merged result.
import type { AccountState } from '@idleon-forge/account-state';
import type { MetaPathResult } from '../metapath/types';
import type { EngineResult } from '../result';
import { FACT, type M20Knowledge, rowsOf, say, sourcesOf } from '../slots/kb';
import { accountWeekEnd, ballotWeekEnd, dailyResetAfter, periodIndex, serverWeekEnd } from './clocks';
import { periodLength, type RowCtx, type RowDef, type RowRead, readRow } from './rows';
import type { Checklist, ChecklistRow, RowState } from './types';

const STATE_ORDER: Record<RowState, number> = { todo: 0, waiting: 1, cannot: 2, unknown: 3, done: 4 };
const BAND_ORDER = { 'no-bank': 0, banks: 1, weekly: 2 } as const;

export const rowDefs = (kb: M20Knowledge): RowDef[] => rowsOf<RowDef[]>(kb, FACT.rows) ?? [];

/** The first save in this period whose own state already shows the row done (FR-14). */
function doneAtOf(def: RowDef, read: RowRead, ctx: RowCtx): number | null {
  const len = periodLength(def.clock);
  if (read.state !== 'done' || read.periodEnd === null || len === null) return null;
  const start = read.periodEnd - len;
  const saves = [
    ...ctx.history.filter((h) => h.lastCloudSave > start),
    ...(ctx.state.account.lastCloudSave !== null
      ? [{ lastCloudSave: ctx.state.account.lastCloudSave, state: ctx.state }]
      : []),
  ].sort((a, b) => a.lastCloudSave - b.lastCloudSave);
  if (ctx.history.length === 0) return null;
  for (const h of saves) {
    const r = readRow(def, { ...ctx, state: h.state, now: h.lastCloudSave });
    if ('state' in r && r.state === 'done') return h.lastCloudSave;
  }
  return null;
}

/** The Goal or Active Play key already carrying one of the row's entries (FR-8). */
function linkOf(def: RowDef, prior: EngineResult | undefined): ChecklistRow['link'] {
  if (!prior) return null;
  const goals = [...prior.account.goals, ...prior.characters.flatMap((c) => c.goals)];
  const g = goals.find((x) => def.entries.includes(x.nextAction.entryId));
  if (g) return { kind: 'goal', key: g.nextAction.key };
  const plays = [...prior.account.activePlay, ...prior.characters.flatMap((c) => c.activePlay)];
  const p = plays.find((a) => def.entries.some((e) => a.key.startsWith(`${e}@`)));
  return p ? { kind: 'active-play', key: p.key } : null;
}

export interface ChecklistInput {
  state: AccountState;
  kb: M20Knowledge;
  meta: MetaPathResult | null;
  now: number;
  expectedReturnMs: number;
  history: RowCtx['history'];
  prior?: EngineResult;
}

export function buildChecklist(i: ChecklistInput): Checklist | null {
  const defs = rowDefs(i.kb);
  if (defs.length === 0) return null;
  const ctx: RowCtx = {
    state: i.state,
    kb: i.kb,
    meta: i.meta,
    now: i.now,
    expectedReturnMs: i.expectedReturnMs,
    history: i.history,
  };
  const rows: ChecklistRow[] = [];
  const gated: Checklist['gated'] = [];
  const returnAt = i.now + i.expectedReturnMs;
  for (const def of defs) {
    let r: ReturnType<typeof readRow>;
    try {
      r = readRow(def, ctx);
    } catch {
      r = { state: 'unknown', details: [], periodEnd: null, availableAt: null, resetSinceSave: false };
    }
    if ('hidden' in r) continue;
    if ('gated' in r) {
      gated.push({ band: def.band, text: r.gated });
      continue;
    }
    const link = linkOf(def, i.prior);
    const entry = def.entries[0] ?? '';
    const own = r.text ?? (say(i.kb, entry, 'row') || (i.kb.entries[entry]?.title ?? def.label));
    const lost =
      r.state === 'todo' &&
      (def.band === 'banks' ? r.losesBanked === true : r.periodEnd !== null && r.periodEnd < returnAt);
    const len = periodLength(def.clock);
    rows.push({
      id: def.id,
      band: def.band,
      clock: def.clock,
      label: r.text ?? def.label,
      state: r.state,
      details:
        r.resetSinceSave && r.state === 'todo' ? ['reset since your last save', ...r.details] : r.details,
      periodEnd: r.periodEnd,
      availableAt: r.availableAt,
      lostBeforeReturn: lost,
      resetSinceSave: r.resetSinceSave,
      effortSeconds: def.effortSeconds,
      doneAt: doneAtOf(def, r, ctx),
      manual:
        r.manual && r.periodEnd !== null && len !== null
          ? { key: `checklist@${def.id}@${periodIndex(r.periodEnd, len)}`, hint: r.manual.hint }
          : r.manual
            ? { key: `checklist@${def.id}@0`, hint: r.manual.hint }
            : null,
      link,
      nextAction: link ? null : own,
      systemId: def.system,
      sources: [
        ...sourcesOf(i.kb, entry),
        ...(sourcesOf(i.kb, entry).some((s) => s.url === def.wiki)
          ? []
          : [
              {
                label: `IdleOn Wiki: ${def.label}`,
                url: def.wiki,
                tier: 2 as const,
                verifiedOn: '2026-10-18',
                gameVersion: '2.3.540',
              },
            ]),
      ],
    });
  }
  rows.sort(
    (a, b) =>
      BAND_ORDER[a.band] - BAND_ORDER[b.band] ||
      STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
      defs.findIndex((d) => d.id === a.id) - defs.findIndex((d) => d.id === b.id),
  );
  const ring = (pick: (r: ChecklistRow) => boolean) => {
    const rs = rows.filter(
      (r) => pick(r) && (r.state === 'done' || r.state === 'todo' || r.state === 'waiting'),
    );
    return { done: rs.filter((r) => r.state === 'done').length, total: rs.length };
  };
  return {
    clocks: {
      daily: dailyResetAfter(i.state, i.now),
      accountWeek: accountWeekEnd(i.state, i.now),
      serverWeek: serverWeekEnd(i.now),
      ballotWeek: ballotWeekEnd(i.now),
    },
    rings: { today: ring((r) => r.band !== 'weekly'), week: ring((r) => r.band === 'weekly') },
    rows,
    gated,
    expanded: rows.some((r) => r.lostBeforeReturn),
  };
}
