// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Pure helpers for Detectors and their examples. Detectors may import only this file, ../../src/types
// and types from @idleon-forge/account-state (TR-1), so anything a Detector needs at runtime from
// account-state is re-exported here.
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import { isKnown } from '@idleon-forge/account-state';
import type { HistoryEntry, Subject } from './types';

// M26 FR-6: the shared unlock guard, here so Detectors may use it (M11 TR-1 import rule).
export { hasUnlockRule, UNLOCK_RULES, type UnlockState, unlocked } from './unlock';
export { isKnown };

/** The readable characters, in save order. */
export const charactersOf = (state: AccountState): readonly CharacterState[] => state.characters;

/** Sum of `f` over `items`, skipping nulls. */
export function sumBy<T>(items: readonly T[], f: (item: T) => number | null | undefined): number {
  let total = 0;
  for (const item of items) {
    const v = f(item);
    if (typeof v === 'number' && Number.isFinite(v)) total += v;
  }
  return total;
}

export const accountSubject: Subject = { kind: 'account' };
export const characterSubject = (index: number): Subject => ({ kind: 'character', index });

/** A copy of `state` with character `index` changed by `patch` (for example mutations). */
export function withCharacter(
  state: AccountState,
  index: number,
  patch: Partial<CharacterState>,
): AccountState {
  return {
    ...state,
    characters: state.characters.map((c) => (c.index === index ? { ...c, ...patch } : c)),
  };
}

/** A copy of `state` with `account` changed by `patch` (for example mutations). */
export function withAccount(state: AccountState, patch: Partial<AccountState['account']>): AccountState {
  return { ...state, account: { ...state.account, ...patch } };
}

/** A copy of `state` in which `paths` failed their presence check (diagnostics.unknownFields). */
export function withUnknown(state: AccountState, ...paths: string[]): AccountState {
  return {
    ...state,
    diagnostics: {
      ...state.diagnostics,
      unknownFields: [...new Set([...state.diagnostics.unknownFields, ...paths])].sort(),
    },
  };
}
export * from './bubba-detectors';
export * from './purpose-detectors';

/** A value at a dot path ("account.lab.characters", "account.killroy.doneCode"); undefined when absent. */
export function valueAt(root: unknown, path: string): unknown {
  let v: unknown = root;
  for (const k of path.split('.')) {
    if (v === null || typeof v !== 'object') return undefined;
    v = (v as Record<string, unknown>)[k];
  }
  return v;
}

/** One sub-field a previous-save Detector compares, and (optionally) the shape it must have. */
export interface ComparedField {
  path: string;
  /** Rejects a reshaped value: true when the stored value has the shape this Detector compares. */
  valid?: (v: unknown) => boolean;
}

/**
 * The previous save, for a Detector that compares with it (M26 FR-7: Lab chain-broke, Killroy and
 * Weekly Battles week rolls). It is the newest earlier save; it counts as "no previous save" (null)
 * only when one of the declared sub-fields is missing (undefined) or fails its shape, never because
 * `schemaVersion` differs: a release reshapes some fields, so it silences only the Detectors that
 * compare those, for one sync. Each declared path must also be kept by the history's compact copy
 * (packages/sync engine-history.ts `compactState`), or it reads as missing on every compact entry.
 */
export function previousSave(
  history: readonly HistoryEntry[],
  fields: readonly ComparedField[],
): HistoryEntry | null {
  const prev = history.at(-1);
  if (!prev) return null;
  for (const f of fields) {
    const v = valueAt(prev.state, f.path);
    if (v === undefined || (f.valid && !f.valid(v))) return null;
  }
  return prev;
}
