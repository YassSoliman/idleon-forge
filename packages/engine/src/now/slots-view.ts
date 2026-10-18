// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-T3: the Parallel Slots grid (the Timeline's `#slots` section, the Design Lab's `time.parallel-slots`
// Slot grid with the Unassigned tray as its text partner). Owned by area T.
//
// Rows are characters in the Roster's frozen Visit Order; columns are the five slots in the Lab's order
// (cauldron, traps, worship, Cog Board, printer). Each cell is M20's own pip: its state and its words. The
// one NOW cell is M20's fill order (`slots.priority.fill-order`): the first slot Goal in the account list
// whose key a pip links to, on the empty cell it fills when there is one. The view computes nothing of
// its own (D-18): counts are counts of M20's pips, and the step is that Goal's own Next Action text.
// The tray (the grid's text partner) groups these rows in the lazy section (`timeline/slots-tray.ts`).
import type { EngineResult, SlotKind, SlotPip } from '../result';
import type { NowView, SlotsView } from './view';
import { SLOTS_WORDS as W } from './words/time';

/** The Lab's column order. */
export const SLOT_KINDS: readonly SlotKind[] = ['cauldron', 'trap', 'worship', 'cog', 'printer'];

export interface SlotCellView {
  kind: SlotKind;
  state: SlotPip['state'];
  /** M20's pip words ("brews (Power)", "in the cog inventory: earns nothing"). Wrapped, never cut. */
  text: string;
  /** The state's word, beside the glyph (never colour alone). */
  stateWord: string;
  /** The Lab's cell class: in use, full (spend it), empty (free value) or closed (not open yet). */
  tone: 'filled' | 'full' | 'empty' | 'closed';
  filled: boolean;
  now: boolean;
}

export interface SlotRowView {
  index: number;
  name: string;
  classLabel: string;
  level: number;
  cells: SlotCellView[];
}

export interface SlotColumnView {
  kind: SlotKind;
  heading: string;
  inUse: number;
  of: number;
  free: number;
  full: number;
  /** "5 of 6 in use · 1 free". */
  count: string;
}

export interface SlotsGridView extends SlotsView {
  rows: SlotRowView[];
  columns: SlotColumnView[];
  /** The NOW cell's step: the fill-order Goal's own Next Action, with who. */
  now: null | { index: number; kind: SlotKind; key: string; text: string; who: string };
}

const TONE: Record<SlotPip['state'], SlotCellView['tone']> = {
  filled: 'filled',
  capped: 'full',
  fillable: 'empty',
  unfillable: 'empty',
  locked: 'closed',
  unknown: 'closed',
  'not-covered': 'closed',
};

export function buildSlotsView(result: EngineResult, view: NowView): SlotsGridView | null {
  const skills = result.skills ?? [];
  if (!skills.length) return null;
  const byIndex = new Map(skills.map((s) => [s.index, s.slots]));
  const order = view.roster.filter((r) => byIndex.has(r.index));
  if (!order.length) return null;

  // M20 FR-29's fill order is the account list's order of the slot Goals (only shown Goals link a pip).
  const linked = new Set(skills.flatMap((s) => s.slots.flatMap((p) => (p.linkKey ? [p.linkKey] : []))));
  const top = result.account.goals.find((g) => linked.has(g.nextAction.key)) ?? null;
  let nowCell: { index: number; kind: SlotKind } | null = null;
  if (top) {
    const key = top.nextAction.key;
    const cells = order.flatMap((r) =>
      (byIndex.get(r.index) ?? []).filter((p) => p.linkKey === key).map((p) => ({ index: r.index, p })),
    );
    // The empty cell the Goal fills, else the first linked one.
    const pick = cells.find((c) => c.p.state === 'fillable') ?? cells[0];
    if (pick) nowCell = { index: pick.index, kind: pick.p.kind };
  }

  const rows: SlotRowView[] = order.map((r) => {
    const pips = byIndex.get(r.index) ?? [];
    const cells = SLOT_KINDS.flatMap((kind) => {
      const p = pips.find((x) => x.kind === kind);
      if (!p) return [];
      const stateWord = W.states[p.state];
      const tone = TONE[p.state];
      return [
        {
          kind,
          state: p.state,
          text: p.text,
          stateWord,
          tone,
          filled: tone === 'filled' || tone === 'full',
          now: nowCell?.index === r.index && nowCell.kind === kind,
        },
      ];
    });
    return { index: r.index, name: r.name, classLabel: r.classLabel, level: r.level, cells };
  });

  const columns: SlotColumnView[] = SLOT_KINDS.map((kind) => {
    const cells = rows.flatMap((r) => r.cells.filter((c) => c.kind === kind));
    const open = cells.filter((c) => c.tone !== 'closed');
    const inUse = open.filter((c) => c.filled).length;
    const free = open.filter((c) => c.state === 'fillable').length;
    const full = open.filter((c) => c.state === 'capped').length;
    return {
      kind,
      heading: W.kinds[kind],
      inUse,
      of: cells.length,
      free,
      full,
      count: open.length ? W.count(inUse, cells.length, free, full) : W.states.locked,
    };
  });

  const nowRow = nowCell ? rows.find((r) => r.index === nowCell?.index) : undefined;
  return {
    rows,
    columns,
    now:
      top && nowCell && nowRow
        ? {
            index: nowCell.index,
            kind: nowCell.kind,
            key: top.nextAction.key,
            text: top.nextAction.text,
            who: `${nowRow.classLabel} ${nowRow.level}`,
          }
        : null,
  };
}
