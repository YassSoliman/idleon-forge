// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Invariant: what the independent raw readers read equals what the Account State says (M22 FR-1).
// A disagreement means the Toolbox parse or our adapter misread the save.
import { same } from '../facts';
import type { Violation } from '../types';
import { type Rule, scopeOfFact } from './rule';

const SEVERITY = { talents: 'P1', character: 'P1', coins: 'P2', items: 'P3', 'spend-line': 'P1' } as const;

export const rawMatchesState: Rule = {
  id: 'raw-matches-state',
  title: 'The Account State agrees with the save itself',
  check({ facts }) {
    const out: Violation[] = [];
    for (const f of facts) {
      const raw = f.values.raw;
      const state = f.values.state;
      if (raw === undefined || raw === null || state === undefined || state === null) continue;
      if (same(raw, state)) continue;
      const scope = scopeOfFact(f.key);
      out.push({
        rule: 'raw-matches-state',
        key: f.key,
        message: `${f.label}: the save says ${raw}, the Account State says ${state}`,
        severity: SEVERITY[scope.kind],
        scope,
        evidence: { raw, state },
      });
    }
    return out;
  },
};
