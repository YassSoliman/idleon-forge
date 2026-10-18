// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The truth checks' one entry point (M22): read the raw facts, build the facts table, run every
// rule, suppress what the violations touch. Runs in the parse worker after the engine, on every parse,
// for every player. It never sends anything anywhere: the report goes back to the page with the
// result and stays on the device.
import type { AccountState } from '@idleon-forge/account-state';
import type { EngineResult } from '@idleon-forge/engine/result';
import { factsOf } from './facts';
import { type EnvelopeLike, readRawFacts } from './raw/read';
import { RULES, type Rule } from './rules';
import { suppress } from './suppress';
import type { TruthReport, Violation } from './types';

export interface TruthInput {
  envelope: EnvelopeLike;
  state: AccountState;
  /** The engine's result; null when it didn't run or threw. */
  result: EngineResult | null;
  rules?: readonly Rule[];
}

export interface TruthOutput {
  /** `result` with the doubted advice replaced, or the same object when nothing was. */
  result: EngineResult | null;
  report: TruthReport;
}

/** Runs the truth checks. Never throws: a failure is reported in `report.error` and suppresses nothing. */
export function checkTruth({ envelope, state, result, rules = RULES }: TruthInput): TruthOutput {
  const started = performance.now();
  const ms = () => Math.round((performance.now() - started) * 10) / 10;
  const base = { asOf: state.asOf, rules: rules.map((r) => r.id) };
  try {
    const raw = readRawFacts(envelope);
    const facts = factsOf(raw, state, result);
    const violations: Violation[] = [];
    for (const rule of rules) violations.push(...rule.check({ raw, state, result, facts }));
    const out = result ? suppress(result, violations) : { result, suppressed: [] };
    const report = { ...base, violations, suppressed: out.suppressed, facts, raw, error: null, ms: ms() };
    return { result: out.result, report };
  } catch (err) {
    const error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return {
      result,
      report: { ...base, violations: [], suppressed: [], facts: [], raw: null, error, ms: ms() },
    };
  }
}
