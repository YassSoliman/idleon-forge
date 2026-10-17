// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// "Not covered yet" (M11 FR-24, TR-9): the unlocked Systems that have no active or contested
// authored entry. Generated facts alone never count as coverage (D5).
import type { AccountState } from '@idleon-forge/account-state';
import { type ContextOptions, findDetector, makeContext, runDetector } from './run';
import type { SystemDefT } from './schema';
import type { DetectorRegistry, MilestoneFinding } from './types';
import type { CompiledKnowledge } from './version';

/** Whether `system` is unlocked on this account: 'yes', 'no' or 'unknown' (a Detector that can't tell or throws). */
export function systemUnlocked(
  system: SystemDefT,
  state: AccountState,
  kb: Pick<CompiledKnowledge, 'entries' | 'facts'>,
  registries: readonly DetectorRegistry[],
  opts: ContextOptions,
): 'yes' | 'no' | 'unknown' {
  if (system.unlocked === 'always') return 'yes';
  const detector = findDetector(system.unlocked.id, ...registries);
  if (!detector || detector.kind !== 'milestone') return 'unknown';
  const run = runDetector(detector, makeContext(state, kb, opts), system.unlocked.params);
  if (!run.ok) return 'unknown';
  const account = (run.findings as readonly MilestoneFinding[]).find((f) => f.subject.kind === 'account');
  return account?.reached ?? 'unknown';
}

/** The Systems with at least one authored (not generated) active or contested entry. */
export function coveredSystems(kb: Pick<CompiledKnowledge, 'entries'>): Set<string> {
  const covered = new Set<string>();
  for (const e of Object.values(kb.entries)) {
    const generated = 'origin' in e && e.origin === 'generated';
    if (!generated && (e.status === 'active' || e.status === 'contested')) covered.add(e.system);
  }
  return covered;
}

/**
 * The unlocked Systems with no active or contested authored entry, sorted by world then name. An
 * `unknown` unlock counts as unlocked, which errs toward listing (TR-9).
 */
export function coverage(
  state: AccountState,
  kb: Pick<CompiledKnowledge, 'entries' | 'facts' | 'systems'>,
  registries: readonly DetectorRegistry[],
  opts: ContextOptions = { now: state.asOf },
): SystemDefT[] {
  const covered = coveredSystems(kb);
  return kb.systems
    .filter((s) => !covered.has(s.id) && systemUnlocked(s, state, kb, registries, opts) !== 'no')
    .sort((a, b) => a.world - b.world || a.name.localeCompare(b.name, 'en-US'));
}
