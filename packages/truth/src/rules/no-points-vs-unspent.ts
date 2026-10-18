// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Invariant: "no points waiting" never coexists with unspent points over 0 (M22 FR-2b). Three sources
// of unspent points can contradict a "No points waiting" Build line on a preset's tab:
// - the raw floor (`RawTab.unspentAtLeast`, the game's own TotalTalentPoints with only its raw terms);
// - the engine's own lower bound on that tab (`BuildTabView.unspent`, M9 TR-7);
// - the Account State's exact count (`talentPoints[tab].unspent`, ADR 0010), unless it fell back
//   to the lower bound (`confidence: 'bound'`).
// Any one above 0 makes the line wrong. 10 or more points waiting is P1 (about three class levels'
// worth); fewer is P2. The hedged line "No unspent points known here" (#120) claims nothing, so it is
// not held back; when the save proves points are there it is reported as a P2 `hold: false` finding,
// since the player still reads it as "nothing to spend".
import { statePreset } from '../facts';
import type { Violation } from '../types';
import { NO_POINTS, NO_POINTS_KNOWN, type Rule } from './rule';

export const noPointsVsUnspent: Rule = {
  id: 'no-points-vs-unspent',
  title: '"No points waiting" never coexists with unspent points',
  check({ raw, state, result }) {
    const out: Violation[] = [];
    for (const b of result?.builds ?? []) {
      const rc = raw.characters.find((c) => c.index === b.index);
      const sc = state.characters.find((c) => c.index === b.index);
      for (const p of b.presets) {
        const sp = sc ? statePreset(sc, p.slot) : null;
        for (const n of p.next) {
          const claim = NO_POINTS.test(n.text);
          if (!claim && !NO_POINTS_KNOWN.test(n.text)) continue;
          const rawTab = rc?.presets.find((x) => x.slot === p.slot)?.tabs.find((t) => t.tab === n.tab);
          const engine = p.tabs.find((t) => t.tab === n.tab)?.unspent ?? 0;
          const floor = rawTab?.unspentAtLeast ?? 0;
          const points = sp?.talentPoints?.[n.tab as 1 | 2 | 3 | 4 | 5];
          const exact = points && points.confidence !== 'bound' ? (points.unspent ?? 0) : 0;
          if (floor <= 0 && exact <= 0 && (engine <= 0 || !claim)) continue;
          const who = rc ? `Slot ${rc.index} ${rc.className ?? `class ${rc.classId}`}` : `Slot ${b.index}`;
          const proof =
            exact > 0
              ? `the save has ${exact} unspent there`
              : floor > 0
                ? `the save has at least ${floor} unspent there`
                : `its own count is at least ${engine}`;
          out.push({
            rule: 'no-points-vs-unspent',
            key: n.key,
            message: `${who} · preset ${p.slot + 1} · tab ${n.tab}: the Build says ${
              claim ? 'no points waiting' : 'no unspent points known'
            }, but ${proof}`,
            severity: claim && Math.max(floor, engine, exact) >= 10 ? 'P1' : 'P2',
            ...(claim ? {} : { hold: false as const }),
            scope: { kind: 'talents', character: b.index, slot: p.slot, tab: n.tab, itemKey: n.key },
            evidence: {
              rawAtLeast: floor,
              engineAtLeast: engine,
              exact: exact > 0 ? exact : null,
              text: n.text,
            },
          });
        }
      }
    }
    return out;
  },
};
