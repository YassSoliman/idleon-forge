// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Pure helpers for Detectors and their examples. Detectors may import only this file, ../../src/types
// and types from @idleon-forge/account-state (TR-1), so anything a Detector needs at runtime from
// account-state is re-exported here.
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import { isKnown } from '@idleon-forge/account-state';
import type { Subject } from './types';

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
