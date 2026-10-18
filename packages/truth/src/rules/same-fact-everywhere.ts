// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Invariant: one fact has one value on every surface the app shows it on (M22 FR-2c). The facts
// table keys each fact once (`c3.level`, `c3.p1.talent.281`), so the Build view's level, its talent
// rows and path, the character header and the Spend Plan's wallets must all match the Account State.
// The raw save is left to `raw-matches-state`, so one misread is reported once.
import { same } from '../facts';
import type { Surface, Violation } from '../types';
import { type Rule, scopeOfFact } from './rule';

const SHOWN: readonly Surface[] = ['build', 'build-row', 'build-path', 'character', 'spend'];

export const sameFactEverywhere: Rule = {
  id: 'same-fact-everywhere',
  title: 'The same fact has the same value on every surface',
  check({ facts }) {
    const out: Violation[] = [];
    for (const f of facts) {
      const base = f.values.state;
      if (base === undefined || base === null) continue;
      for (const s of SHOWN) {
        const v = f.values[s];
        if (v === undefined || v === null || same(v, base)) continue;
        out.push({
          rule: 'same-fact-everywhere',
          key: f.key,
          message: `${f.label}: the Account State says ${base}, the ${s} surface shows ${v}`,
          severity: 'P1',
          scope: scopeOfFact(f.key),
          evidence: { state: base, [s]: v },
        });
      }
    }
    return out;
  },
};
