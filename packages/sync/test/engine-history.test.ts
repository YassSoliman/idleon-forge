// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The history the engine receives with each parse (M10 TR-6, M1 TR-14): earlier saves only, 30 days,
// bounded, compact except the Play Session's boundary saves, and cached per save.
import 'fake-indexeddb/auto';
import type { AccountState } from '@idleon-forge/account-state';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import {
  compactState,
  ENGINE_HISTORY_MAX_ENTRIES,
  ENGINE_HISTORY_WINDOW_MS,
  engineHistoryOf,
  HISTORY_RETENTION_MS,
  openSaveHistory,
  selectEngineHistory,
} from '../src';

const MIN = 60_000;
const HOUR = 60 * MIN;
const T0 = Date.UTC(2026, 9, 10, 8);

/** An Account State saved at `t`, with AFK facts, Water, minigames and some bulk the engine never reads. */
function stateAt(t: number, slot = 0): AccountState {
  return {
    schemaVersion: 3,
    asOf: t,
    account: {
      currentWorld: 2,
      lastCloudSave: t,
      secondsSinceLastSave: 0,
      gameVersion: { serverBuild: 142, saveVersion: 34.05, parserTarget: '2.3.540' },
      cards: Array.from({ length: 50 }, (_, i) => ({ id: `card${i}`, level: 1 })),
      afk: { projectedAt: t, arcade: null, liquids: [{ index: 0, current: 10, max: 32 }] },
      minigames: { darts: { playsToday: 1 } },
      poppy: { unlocked: true, pendingFish: 3 },
    },
    characters: [0, 1].map((index) => ({
      index,
      name: `C${index}`,
      class: 'Squire',
      level: 50,
      afkType: 'FIGHTING',
      afkTarget: 'Frog',
      currentMap: 'Frog_Fields',
      foodStacks: [],
      secondsSinceLastSave: index === slot ? 0 : 3600,
      quests: { big: 'x'.repeat(500) },
      afk: {
        afkSince: index === slot ? t : t - HOUR,
        food: [{ slot: 0, item: 'FoodHealth1', kind: 'health', amount: 100, healPerBite: 50 }],
        fighting: { survivability: 100 },
      },
    })),
    lastPlayedCharacterIndex: slot,
    diagnostics: {
      failedSections: [],
      failedSideReads: [],
      skippedCharacters: [],
      unreadableCharacters: [],
      unknownIds: { monsters: [], maps: [], items: [], classes: [] },
      unknownFields: [],
      unnamed: false,
      parserPin: { commit: 'pin1', gameVersion: '2.3.540' },
      source: 'live',
    },
    warnings: ['w'],
  } as unknown as AccountState;
}

const record = (t: number) => ({ lastCloudSave: t, receivedAt: t + 1000, state: stateAt(t) });

describe('selectEngineHistory', () => {
  const times = [T0 - 31 * 24 * HOUR, T0, T0 + HOUR, T0 + 2 * HOUR, T0 + 5 * HOUR, T0 + 6 * HOUR];

  it('keeps only earlier saves within 30 days, oldest first', () => {
    const { kept } = selectEngineHistory([...times].reverse(), {
      before: T0 + 5 * HOUR,
      sessionStartedAt: null,
    });
    expect(kept).toEqual([T0, T0 + HOUR, T0 + 2 * HOUR]);
  });

  it('keeps the newest `maxEntries`', () => {
    const { kept } = selectEngineHistory(times, {
      before: T0 + 7 * HOUR,
      sessionStartedAt: null,
      maxEntries: 2,
    });
    expect(kept).toEqual([T0 + 5 * HOUR, T0 + 6 * HOUR]);
  });

  it("marks the session's first save and the save before it as whole", () => {
    const { whole } = selectEngineHistory(times, { before: T0 + 7 * HOUR, sessionStartedAt: T0 + 5 * HOUR });
    expect([...whole].sort()).toEqual([T0 + 2 * HOUR, T0 + 5 * HOUR]);
    // A new session that starts at the current save: only the baseline before it.
    const fresh = selectEngineHistory(times, { before: T0 + 7 * HOUR, sessionStartedAt: T0 + 7 * HOUR });
    expect([...fresh.whole]).toEqual([T0 + 6 * HOUR]);
    expect(selectEngineHistory(times, { before: T0 + 7 * HOUR, sessionStartedAt: null }).whole.size).toBe(0);
  });

  it('looks back the whole retention window', () => {
    expect(ENGINE_HISTORY_WINDOW_MS).toBe(HISTORY_RETENTION_MS);
  });
});

describe('compactState', () => {
  it('keeps what the history readers use and drops the rest', () => {
    const full = stateAt(T0);
    const c = compactState(full);
    expect(c.account.lastCloudSave).toBe(T0);
    expect(c.account.afk?.liquids).toEqual(full.account.afk?.liquids);
    expect(c.account.minigames).toEqual(full.account.minigames);
    expect(c.account.poppy).toEqual(full.account.poppy);
    expect(c.characters[1]).toEqual({
      index: 1,
      class: 'Squire',
      level: 50,
      afkType: 'FIGHTING',
      afkTarget: 'Frog',
      afk: { afkSince: T0 - HOUR, food: full.characters[1]?.afk?.food },
    });
    expect((c.account as unknown as Record<string, unknown>).cards).toBeUndefined();
    expect(JSON.stringify(c).length).toBeLessThan(JSON.stringify(full).length / 3);
    expect(structuredClone(c)).toEqual(c);
  });
});

describe('engineHistoryOf', () => {
  it('is compact except the boundary saves, which keep the whole state', () => {
    const records = [record(T0), record(T0 + HOUR), record(T0 + 2 * HOUR)];
    const out = engineHistoryOf(records, { before: T0 + 3 * HOUR, sessionStartedAt: T0 + HOUR });
    expect(out.map((h) => h.lastCloudSave)).toEqual([T0, T0 + HOUR, T0 + 2 * HOUR]);
    expect(out[0]?.state).toBe(records[0]?.state);
    expect(out[1]?.state).toBe(records[1]?.state);
    expect(out[2]?.state).toEqual(compactState(records[2]?.state as AccountState));
    expect(out[2]?.receivedAt).toBe(T0 + 2 * HOUR + 1000);
  });

  it('empty history gives an empty list', () => {
    expect(engineHistoryOf([], { before: T0, sessionStartedAt: T0 })).toEqual([]);
  });
});

describe('SaveHistory.forEngine', () => {
  const uid = 'u1';
  const open = () =>
    openSaveHistory({
      indexedDB: new IDBFactory(),
      storage: null,
      estimate: async () => undefined,
      clock: () => T0,
    });

  it('returns the stored earlier saves, compact except the boundaries, and caches compact copies', async () => {
    const h = await open();
    // One Play Session of switch saves 5 minutes apart (each a leave event, so all are kept), then a
    // new session hours later.
    const times = [0, 5, 10, 15].map((m) => T0 + m * MIN);
    for (const [i, t] of times.entries()) await h.put(uid, stateAt(t, i % 2), { data: {} });
    const later = T0 + 3 * HOUR;
    const a = await h.forEngine(uid, { before: later, sessionStartedAt: later });
    expect(a.map((x) => x.lastCloudSave)).toEqual(times);
    expect(a.at(-1)?.state.characters[0]?.name).toBe('C0'); // the baseline: whole
    expect(a[0]?.state.characters[0]?.name).toBeUndefined(); // compact
    const b = await h.forEngine(uid, { before: later, sessionStartedAt: later });
    expect(b[0]).toBe(a[0]);
    // Only saves before `before`, and none for another account.
    expect((await h.forEngine(uid, { before: T0 + 10 * MIN, sessionStartedAt: null })).length).toBe(2);
    expect(await h.forEngine('other', { before: later, sessionStartedAt: null })).toEqual([]);
    await h.clear(uid);
    expect(await h.forEngine(uid, { before: later, sessionStartedAt: null })).toEqual([]);
  });

  it('is bounded', () => {
    expect(ENGINE_HISTORY_MAX_ENTRIES).toBeLessThanOrEqual(1000);
  });
});
