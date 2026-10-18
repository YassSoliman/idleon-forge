// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Unassigned tray (M21 FR-T3, the Lab's `time.parallel-slots` runner-up): the Slot grid's text partner.
// One line per slot kind that has an empty or a full slot, with the characters said once (P7), empty
// first; the NOW kind first. It only groups `buildSlotsView`'s rows (in the lazy chunk, TR-12).

import type { buildSlotsView } from '@idleon-forge/engine/now';
import type { SlotKind } from '@idleon-forge/engine/result';
import { SLOTS_UI_WORDS as W } from './words';

type Grid = NonNullable<ReturnType<typeof buildSlotsView>>;

export interface SlotTrayLine {
  kind: SlotKind;
  heading: string;
  /** "1 empty · 4 full". */
  count: string;
  who: { index: number; classLabel: string; level: number; tone: 'empty' | 'full' }[];
  now: boolean;
}

export function slotTray(v: Grid): SlotTrayLine[] {
  return v.columns
    .flatMap((col) => {
      const who = v.rows.flatMap((r) =>
        r.cells
          .filter((c) => c.kind === col.kind && (c.state === 'fillable' || c.state === 'capped'))
          .map((c) => ({
            index: r.index,
            classLabel: r.classLabel,
            level: r.level,
            tone: c.state === 'fillable' ? ('empty' as const) : ('full' as const),
          })),
      );
      if (!who.length) return [];
      const empty = who.filter((w) => w.tone === 'empty');
      const full = who.filter((w) => w.tone === 'full');
      return [
        {
          kind: col.kind,
          heading: col.heading,
          count: [empty.length ? W.trayFree(empty.length) : '', full.length ? W.trayFull(full.length) : '']
            .filter(Boolean)
            .join(' · '),
          who: [...empty, ...full],
          now: v.now?.kind === col.kind,
        },
      ];
    })
    .sort((a, b) => Number(b.now) - Number(a.now));
}
