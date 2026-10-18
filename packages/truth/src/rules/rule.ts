// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What a truth rule is (M22 TR-3). A rule reads the raw facts, the Account State, the engine result
// and the facts table, and returns violations. Rules never change anything; suppression is separate.
// To add one: a file in this folder exporting a `Rule`, then one line in `index.ts`.
import type { AccountState } from '@idleon-forge/account-state';
import type { EngineResult } from '@idleon-forge/engine/result';
import type { FactRow, PresetSlot, RawFacts, Violation, ViolationScope } from '../types';

export interface RuleInput {
  raw: RawFacts;
  state: AccountState;
  /** null when the engine didn't run or threw: only the raw-vs-state rules have work then. */
  result: EngineResult | null;
  facts: FactRow[];
}

export interface Rule {
  /** Kebab-case, stable: it keys the report and the suppressions. */
  id: string;
  /** One line: the invariant it holds. */
  title: string;
  check(input: RuleInput): Violation[];
}

/** The scope a fact key casts doubt on: `c3.p1.t2.spent` -> talents of slot 3, preset 1, tab 2. */
export function scopeOfFact(key: string): ViolationScope {
  const c = /^c(\d+)\./.exec(key);
  const character = c ? Number(c[1]) : null;
  const p = /\.p([01])\./.exec(key);
  const slot = p ? (Number(p[1]) as PresetSlot) : undefined;
  const tab = /\.t(\d+)\./.exec(key);
  if (/\.(talent|star|t\d+)\b/.test(key) || key.endsWith('.preset'))
    return {
      kind: 'talents',
      character,
      ...(slot === undefined ? {} : { slot }),
      ...(tab ? { tab: Number(tab[1]) } : {}),
    };
  if (key.endsWith('.level') || key.endsWith('.class')) return { kind: 'character', character };
  if (key.endsWith('.coins')) return { kind: 'coins', character };
  return { kind: 'items', character };
}

/** The first number after "(to " in a Build line: "(to 40 of 100)" -> 40, "(to 100)" -> 100. */
export function reachOf(text: string): number | null {
  const m = /\(to ([\d,]+)/.exec(text);
  return m?.[1] ? Number(m[1].replace(/,/g, '')) : null;
}

/** "Put the next 12 points into X (...)" -> 12; null for any other line. */
export function takeOf(text: string): number | null {
  const m = /^Put the next ([\d,]+) points? into /.exec(text);
  return m?.[1] ? Number(m[1].replace(/,/g, '')) : null;
}

/** A Build line that claims a tab has nothing to spend. */
export const NO_POINTS = /no points waiting/i;
/** A Build line that says it doesn't know of any points (M9 lower bound 0, #120): not a claim of none. */
export const NO_POINTS_KNOWN = /no unspent points known/i;
