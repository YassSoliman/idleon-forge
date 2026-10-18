// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Invariant: "no points waiting" never coexists with unspent points over 0 (M22 FR-2b). Two sources
// of unspent points can contradict a "No points waiting" Build line on a preset's tab:
// - the raw floor (`RawTab.unspentAtLeast`, the game's own TotalTalentPoints with only its raw terms);
// - the engine's own lower bound on that tab (`BuildTabView.unspent`, M9 TR-7).
// Either one above 0 makes the line wrong. 10 or more points waiting is P1 (about three class levels'
// worth); fewer is P2. The hedged line "No unspent points known here" (#120) claims nothing, so it is
// not held back; when the save proves points are there it is reported as a P2 `hold: false` finding,
// since the player still reads it as "nothing to spend".
import type { Violation } from '../types';
import { NO_POINTS, NO_POINTS_KNOWN, type Rule } from './rule';

export const noPointsVsUnspent: Rule = {
  id: 'no-points-vs-unspent',
  title: '"No points waiting" never coexists with unspent points',
  check({ raw, result }) {
    const out: Violation[] = [];
    for (const b of result?.builds ?? []) {
      const rc = raw.characters.find((c) => c.index === b.index);
      for (const p of b.presets) {
        for (const n of p.next) {
          const claim = NO_POINTS.test(n.text);
          if (!claim && !NO_POINTS_KNOWN.test(n.text)) continue;
          const rawTab = rc?.presets.find((x) => x.slot === p.slot)?.tabs.find((t) => t.tab === n.tab);
          const engine = p.tabs.find((t) => t.tab === n.tab)?.unspent ?? 0;
          const floor = rawTab?.unspentAtLeast ?? 0;
          if (floor <= 0 && (engine <= 0 || !claim)) continue;
          const who = rc ? `Slot ${rc.index} ${rc.className ?? `class ${rc.classId}`}` : `Slot ${b.index}`;
          out.push({
            rule: 'no-points-vs-unspent',
            key: n.key,
            message: `${who} · preset ${p.slot + 1} · tab ${n.tab}: the Build says ${
              claim ? 'no points waiting' : 'no unspent points known'
            }, but ${floor > 0 ? `the save has at least ${floor} unspent there` : `its own count is at least ${engine}`}`,
            severity: claim && Math.max(floor, engine) >= 10 ? 'P1' : 'P2',
            ...(claim ? {} : { hold: false as const }),
            scope: { kind: 'talents', character: b.index, slot: p.slot, tab: n.tab, itemKey: n.key },
            evidence: { rawAtLeast: floor, engineAtLeast: engine, text: n.text },
          });
        }
      }
    }
    return out;
  },
};
