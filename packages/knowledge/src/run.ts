// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Running Detectors: the DetectorContext and per-Detector error isolation (FR-13). The engine and the
// kb tooling both run Detectors through here, so a throw is handled the same way everywhere.
import type { AccountState } from '@idleon-forge/account-state';
import type { Entry, FactTable } from './schema';
import type { AnyDetector, AnyFinding, DetectorContext, DetectorRegistry, HistoryEntry } from './types';
import type { CompiledKnowledge } from './version';

/** The default Expected Return: 8 hours (M3). */
export const DEFAULT_EXPECTED_RETURN_MS = 8 * 3_600_000;

export interface ContextOptions {
  now: number;
  history?: readonly HistoryEntry[];
  expectedReturnMs?: number;
}

/** A DetectorContext over `state` and the compiled Knowledge Base's entries and fact tables. */
export function makeContext(
  state: AccountState,
  kb: Pick<CompiledKnowledge, 'entries' | 'facts'> | null,
  opts: ContextOptions,
): DetectorContext {
  const entries = kb?.entries ?? {};
  const facts = kb?.facts ?? {};
  return Object.freeze({
    state,
    history: opts.history ?? [],
    now: opts.now,
    expectedReturnMs: opts.expectedReturnMs ?? DEFAULT_EXPECTED_RETURN_MS,
    facts: Object.freeze({
      get: (id: string): Readonly<Entry | FactTable> | undefined => entries[id] ?? facts[id],
    }),
  });
}

export type DetectorRun =
  | { ok: true; findings: readonly AnyFinding[] }
  | { ok: false; error: string; detectorId: string };

/**
 * Runs one Detector with its params validated against its own schema. Never throws: a throw (or bad
 * params) comes back as `ok: false`, which the engine records as `unknown` for that entry (FR-13).
 */
export function runDetector(detector: AnyDetector, ctx: DetectorContext, params: unknown = {}): DetectorRun {
  try {
    const parsed = detector.params.parse(params ?? {});
    return { ok: true, findings: detector.run(ctx, parsed) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), detectorId: detector.id };
  }
}

/** Looks a Detector up in one or more registries (Knowledge Base first, then engine). */
export function findDetector(
  id: string,
  ...registries: readonly DetectorRegistry[]
): AnyDetector | undefined {
  for (const r of registries) if (Object.hasOwn(r, id)) return r[id];
  return undefined;
}
