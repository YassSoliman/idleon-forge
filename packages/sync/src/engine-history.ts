// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The save history the engine receives with each parse (M1 TR-14 `HistoryEntry`, M10 TR-6). A full
// Account State can be up to 1 MB (M1 TR-16, owner ruling 2026-10-19), and 30 days of kept saves can
// be hundreds of them, so the worker gets a compact copy (history stores most of them compact too): every entry keeps only the fields the history readers use, and the two entries that
// whole-state comparisons need (the first save of this Play Session, for M8's done-this-session, and
// the last save before it, for M9's level-up baseline) keep their whole state.
//
// The history readers, and what they read from an earlier save:
//  - M3 food rates (`afk/health-food-runs-out`, `afk/dies-fixable-by-food`, `afk/low-food-untimed`):
//    `account.lastCloudSave`; per character `index`, `afkType`, `afkTarget`, `afk.afkSince`, `afk.food`.
//  - M3 Water refill (`alchemy/liquid-cap`): `account.afk.liquids`.
//  - M6 cooldowns and resets (`minigames/cooldown-play`, `poppy/pending-fish`): `account.minigames`,
//    `account.poppy`.
//  - M9 level-up (`levelUpSignal`) and M8 done-this-session: the whole state, on the boundary entries.
//  - M15 F3 family-level pace (`familyPoints`): `account.accountLevel`, the character count
//    (`characters`, `diagnostics.unreadableCharacters`). M15 F5 new-this-session: `characters[*].index`.
// A history reader that needs another field adds it to `compactState` (the engine test that runs the
// engine on full and on compact history and expects the same result catches a missing one).
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import type { HistoryEntry, SaveRecord } from './history';

/** How far back the engine looks: the whole retention window (`HISTORY_RETENTION_MS`, 30 days). */
export const ENGINE_HISTORY_WINDOW_MS = 30 * 24 * 3600 * 1000;

/** At most this many entries go to the worker, newest kept (about 2 KB each when compact). */
export const ENGINE_HISTORY_MAX_ENTRIES = 1000;

const compactCharacter = (c: CharacterState): CharacterState =>
  ({
    index: c.index,
    class: c.class,
    level: c.level,
    afkType: c.afkType,
    afkTarget: c.afkTarget,
    afk: c.afk ? { afkSince: c.afk.afkSince, food: c.afk.food } : (c.afk ?? null),
  }) as unknown as CharacterState;

/**
 * An Account State cut down to the fields the history readers use (see the file header). It is typed
 * as an `AccountState` because `HistoryEntry` is, but most fields are absent: only history readers may
 * see it, never a Detector's `state`.
 */
export function compactState(state: AccountState): AccountState {
  const a = state.account;
  return {
    schemaVersion: state.schemaVersion,
    asOf: state.asOf,
    lastPlayedCharacterIndex: state.lastPlayedCharacterIndex,
    diagnostics: state.diagnostics,
    warnings: [],
    account: {
      lastCloudSave: a.lastCloudSave,
      currentWorld: a.currentWorld,
      accountLevel: a.accountLevel,
      afk: a.afk ? { liquids: a.afk.liquids } : (a.afk ?? null),
      minigames: a.minigames ?? null,
      poppy: a.poppy ?? null,
    },
    characters: state.characters.map(compactCharacter),
  } as unknown as AccountState;
}

export interface EngineHistoryOptions {
  /** The cloud-save time of the save being shown: only saves before it are earlier saves. */
  before: number;
  /** M1 `sessionStart` of that save (TR-15), or null. Its boundary entries keep their whole state. */
  sessionStartedAt: number | null;
  /** Defaults to `ENGINE_HISTORY_MAX_ENTRIES`. */
  maxEntries?: number;
}

/**
 * Which saves go to one engine run (times oldest first): saves before `before`, within 30 days of it,
 * at most `maxEntries` (newest kept). `whole` holds the two that keep their whole state: the first save
 * at or after `sessionStartedAt` and the last save before it.
 */
export function selectEngineHistory(
  times: readonly number[],
  options: EngineHistoryOptions,
): { kept: number[]; whole: Set<number> } {
  const { before, sessionStartedAt: start } = options;
  const from = before - ENGINE_HISTORY_WINDOW_MS;
  const kept = times
    .filter((t) => t < before && t >= from)
    .sort((a, b) => a - b)
    .slice(-(options.maxEntries ?? ENGINE_HISTORY_MAX_ENTRIES));
  const whole = new Set<number>();
  if (start !== null) {
    const first = kept.find((t) => t >= start);
    const baseline = kept.findLast((t) => t < start);
    if (first !== undefined) whole.add(first);
    if (baseline !== undefined) whole.add(baseline);
  }
  return { kept, whole };
}

type Stored = Pick<SaveRecord, 'lastCloudSave' | 'receivedAt' | 'state'>;

/** `selectEngineHistory` over records in memory: the entries for one engine run, oldest first. */
export function engineHistoryOf(records: readonly Stored[], options: EngineHistoryOptions): HistoryEntry[] {
  const byTime = new Map(records.map((r) => [r.lastCloudSave, r]));
  const { kept, whole } = selectEngineHistory([...byTime.keys()], options);
  return kept.flatMap((t) => {
    const r = byTime.get(t);
    if (!r) return [];
    return [
      { lastCloudSave: t, receivedAt: r.receivedAt, state: whole.has(t) ? r.state : compactState(r.state) },
    ];
  });
}
