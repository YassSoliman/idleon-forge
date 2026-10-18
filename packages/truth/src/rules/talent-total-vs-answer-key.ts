// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Invariant: a tab's exact talent point total (ADR 0010, the game's TotalTalentPoints ported in
// account-state) is never below what the save proves is there. Spent points can't exceed the tab's
// total, so the preset that spent more there (its own points-granting talents taken out) is an answer
// key. The adapter already falls back to the lower bound on such a tab (`confidence: 'bound'`, with the
// formula and the answer key kept); this rule reports it with the save fields the formula read, so the
// missing term can be found. Nothing is held back: the advice already uses the lower bound.
import { TALENT_POINT_TERMS, type TabKey, termsOfTab } from '@idleon-forge/account-state';
import type { PresetSlot, Violation } from '../types';
import type { Rule } from './rule';

export const TALENT_TOTAL_RULE = 'talent-total-vs-answer-key';

export const talentTotalVsAnswerKey: Rule = {
  id: TALENT_TOTAL_RULE,
  title: 'The exact talent point total is never below what the save already spent',
  check({ raw, state }) {
    const out: Violation[] = [];
    for (const sc of state.characters) {
      const t = sc.talents;
      if (!t) continue;
      const rc = raw.characters.find((c) => c.index === sc.index);
      const who = `Slot ${sc.index} ${rc?.className ?? `class ${t.classIndex}`}`;
      const presets = [
        { slot: t.selectedPreset as PresetSlot, p: t.active },
        ...(t.other ? [{ slot: (1 - t.selectedPreset) as PresetSlot, p: t.other }] : []),
      ];
      for (const { slot, p } of presets) {
        for (const [key, v] of Object.entries(p.talentPoints ?? {})) {
          // `bound` with no formula is "couldn't run" (no worker calls, a failed section), not a mismatch.
          if (v?.confidence !== 'bound' || v.formula === null || v.oracle === null) continue;
          const tab: TabKey = key === 'star' ? 'star' : (Number(key) as TabKey);
          const where = tab === 'star' ? 'the star tab' : `tab ${tab}`;
          const evidence: Violation['evidence'] = {
            formula: v.formula,
            answerKey: v.oracle,
            spent: v.spent,
            fields: termsOfTab(tab, t.classIndex)
              .map((id) => TALENT_POINT_TERMS[id]?.read)
              .filter(Boolean)
              .join('; '),
          };
          for (const [id, n] of Object.entries(v.terms ?? {})) evidence[`term.${id}`] = n;
          out.push({
            rule: TALENT_TOTAL_RULE,
            key: `c${sc.index}.p${slot}.${tab === 'star' ? 'star' : `t${tab}`}.total`,
            message: `${who} · preset ${slot + 1} · ${where}: the game's formula gives ${v.formula} points, but the save shows at least ${Math.ceil(v.oracle)} there. A bonus term is missing, or a points-granting talent was lowered after the points were spent; showing the lower bound instead.`,
            severity: 'P2',
            hold: false,
            scope: { kind: 'talents', character: sc.index, slot, ...(tab === 'star' ? {} : { tab }) },
            evidence,
          });
        }
      }
    }
    return out;
  },
};
