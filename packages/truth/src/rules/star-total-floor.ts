// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Invariant: the star talent point total the Account State carries (Toolbox `calcTotalStarTalent`,
// M21 TR-3) is never below the game's own floor (TotalTalentPoints' star line with its raw terms:
// class level, skill levels, `CYTalentPoints`, achievements). Below it, the star tab's "points left"
// would be too low, so its advice can't be trusted.
import { statePreset } from '../facts';
import type { Violation } from '../types';
import type { Rule } from './rule';

export const starTotalFloor: Rule = {
  id: 'star-total-floor',
  title: 'The star talent total is never below the game’s floor',
  check({ raw, state }) {
    const out: Violation[] = [];
    for (const rc of raw.characters) {
      const sc = state.characters.find((c) => c.index === rc.index);
      const points = sc?.talents?.starPoints;
      if (!sc?.talents || !points) continue;
      for (const rp of rc.presets) {
        const total = statePreset(sc, rp.slot) === sc.talents.active ? points.active : points.other;
        if (total === null || total === undefined || total >= rp.star.totalAtLeast) continue;
        out.push({
          rule: 'star-total-floor',
          key: `c${rc.index}.p${rp.slot}.star.total`,
          message: `Slot ${rc.index} ${rc.className ?? `class ${rc.classId}`} · preset ${rp.slot + 1}: the star talent total is ${total}, the game's floor is ${rp.star.totalAtLeast}`,
          severity: 'P2',
          scope: { kind: 'talents', character: rc.index, slot: rp.slot },
          evidence: { state: total, rawAtLeast: rp.star.totalAtLeast },
        });
      }
    }
    return out;
  },
};
