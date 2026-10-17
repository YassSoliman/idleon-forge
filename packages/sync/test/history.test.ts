// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Save history (M1 FR-21–FR-25, TR-14–TR-16, US-8), against fake-indexeddb and the in-memory store.
import 'fake-indexeddb/auto';
import type { AccountState } from '@idleon-forge/account-state';
import type { RawSaveEnvelope } from '@idleon-forge/toolbox-parsers';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import {
  cloudSaveTimeOf,
  HISTORY_RETENTION_MS,
  type OpenHistoryOptions,
  openSaveHistory,
  preferencePrefix,
  readRaw,
  type SaveHistory,
  uidHash,
} from '../src';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY0 = Date.UTC(2026, 9, 1, 0, 0);
const at = (h: number, m = 0, day = 0) => DAY0 + day * 24 * HOUR + h * HOUR + m * MIN;

/** A minimal Account State saved at `t`. */
function stateAt(
  t: number,
  over: Partial<AccountState['diagnostics']> & { lastPlayed?: number | null } = {},
) {
  const { lastPlayed = 0, ...diag } = over;
  return {
    schemaVersion: 3,
    asOf: t,
    account: {
      currentWorld: 2,
      finishedWorlds: [1],
      lastCloudSave: t,
      secondsSinceLastSave: 0,
      dailyResetAt: t + HOUR,
      gameVersion: { serverBuild: 142, saveVersion: 34.05, parserTarget: '2.3.540' },
    },
    characters: [],
    lastPlayedCharacterIndex: lastPlayed,
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
      ...diag,
    },
    warnings: [],
  } satisfies AccountState;
}

const rawAt = (t: number): RawSaveEnvelope => ({
  data: { TimeAway: JSON.stringify({ GlobalTime: t / 1000 }), Filler: 'x'.repeat(2000) },
});

class MemStorage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

type Kind = 'indexeddb' | 'memory';
const open = (kind: Kind, over: OpenHistoryOptions = {}) =>
  openSaveHistory({
    indexedDB: kind === 'indexeddb' ? new IDBFactory() : null,
    storage: null,
    estimate: async () => undefined,
    clock: () => at(20),
    ...over,
  });

const putAll = async (h: SaveHistory, uid: string, times: number[]) => {
  for (const t of times) await h.put(uid, stateAt(t), rawAt(t));
};

describe.each<Kind>(['indexeddb', 'memory'])('save history (%s)', (kind) => {
  it('reports whether it persists (FR-25)', async () => {
    expect((await open(kind)).persistent).toBe(kind === 'indexeddb');
  });

  it('US-8: splits Play Sessions at 15 minutes and finds the usual gap and the session start', async () => {
    const h = await open(kind);
    await putAll(h, 'u1', [at(10), at(10, 4), at(10, 8), at(18, 30), at(18, 34)]);
    const sessions = await h.playSessions('u1');
    expect(sessions).toEqual([
      { start: at(10), end: at(10, 8), saves: 3 },
      { start: at(18, 30), end: at(18, 34), saves: 2 },
    ]);
    expect((sessions[1]?.start ?? 0) - (sessions[0]?.end ?? 0)).toBe(8 * HOUR + 22 * MIN);
    expect((await h.sessionStart('u1', at(18, 34)))?.lastCloudSave).toBe(at(18, 30));
    expect((await h.sessionStart('u1', at(10, 5)))?.lastCloudSave).toBe(at(10));
    expect(await h.sessionStart('u1', at(9))).toBeNull();
  });

  it('a gap of exactly 15 minutes starts a new Play Session; 14:59 does not', async () => {
    const h = await open(kind);
    await putAll(h, 'u1', [at(10), at(10, 15), at(10, 29) + 59_000]);
    expect((await h.playSessions('u1')).map((s) => s.saves)).toEqual([1, 2]);
  });

  it('US-8: the same cloud save delivered twice is stored once', async () => {
    const h = await open(kind);
    await putAll(h, 'u1', [at(10), at(10)]);
    expect(await h.has('u1', at(10))).toBe(true);
    expect((await h.playSessions('u1'))[0]?.saves).toBe(1);
    expect(await h.since('u1', 0)).toHaveLength(1);
  });

  it('US-8: never stores a pasted save (D2) or one without a save time', async () => {
    const h = await open(kind);
    await h.put('u1', stateAt(at(10), { source: 'paste' }), rawAt(at(10)));
    const noTime = stateAt(at(11));
    await h.put('u1', { ...noTime, account: { ...noTime.account, lastCloudSave: null } }, rawAt(at(11)));
    expect(await h.latest('u1')).toBeNull();
  });

  it('answers latest, previous and since', async () => {
    const h = await open(kind);
    await putAll(h, 'u1', [at(10), at(10, 4), at(10, 8)]);
    expect((await h.latest('u1'))?.lastCloudSave).toBe(at(10, 8));
    expect((await h.previous('u1', at(10, 8)))?.lastCloudSave).toBe(at(10, 4));
    expect(await h.previous('u1', at(10))).toBeNull();
    expect((await h.since('u1', at(10, 4))).map((r) => r.lastCloudSave)).toEqual([at(10, 4), at(10, 8)]);
    const r = await h.latest('u1');
    expect(r?.state.account.lastCloudSave).toBe(at(10, 8));
    expect(r?.receivedAt).toBe(at(20));
    expect(r?.schemaVersion).toBe(3);
  });

  it('usual gap: median of the last 10 gaps, null with fewer than 3 gaps', async () => {
    const h = await open(kind);
    await putAll(h, 'u1', [at(1), at(3), at(6)]);
    expect(await h.usualGapSeconds('u1')).toBeNull(); // 2 gaps
    await putAll(h, 'u1', [at(16)]);
    expect(await h.usualGapSeconds('u1')).toBe(3 * 3600); // gaps 2, 3, 10 h
  });

  it('FR-22: another account on this browser sees none of the first one', async () => {
    const h = await open(kind);
    await putAll(h, 'yasser', [at(10), at(10, 4)]);
    expect(await h.latest('other')).toBeNull();
    expect(await h.playSessions('other')).toEqual([]);
    await h.clear('other');
    expect((await h.latest('yasser'))?.lastCloudSave).toBe(at(10, 4));
  });

  it('US-8: Clear my data removes the account history and its preferences, nothing else', async () => {
    const storage = new MemStorage();
    const h = await open(kind, { storage });
    await putAll(h, 'u1', [at(10), at(10, 4)]);
    await putAll(h, 'u2', [at(11)]);
    const mine = await preferencePrefix('u1');
    const theirs = await preferencePrefix('u2');
    storage.setItem(`${mine}skips`, '{}');
    storage.setItem(`${mine}dismissals`, '{}');
    storage.setItem(`${theirs}skips`, '{}');
    await h.clear('u1');
    expect(await h.latest('u1')).toBeNull();
    expect(await h.playSessions('u1')).toEqual([]);
    expect(await h.cleanBuild('u1', 'pin1')).toBeNull();
    expect(storage.getItem(`${mine}skips`)).toBeNull();
    expect(storage.getItem(`${mine}dismissals`)).toBeNull();
    expect(storage.getItem(`${theirs}skips`)).toBe('{}');
    expect((await h.latest('u2'))?.lastCloudSave).toBe(at(11));
  });

  it('US-8: history older than 30 days is pruned', async () => {
    const h = await open(kind);
    await putAll(h, 'u1', [at(10), at(10, 0, 31)]);
    await h.prune(at(10, 1, 31));
    expect((await h.playSessions('u1')).map((s) => s.start)).toEqual([at(10, 0, 31)]);
    expect(at(10, 1, 31) - at(10)).toBeGreaterThan(HISTORY_RETENTION_MS);
  });

  it('records the newest clean build per parser pin, and ignores saves that read badly (FR-29)', async () => {
    const h = await open(kind);
    await h.put('u1', stateAt(at(10)), rawAt(at(10)));
    const newer = stateAt(at(11), { failedSections: ['obols'] });
    newer.account.gameVersion.serverBuild = 143;
    await h.put('u1', newer, rawAt(at(11)));
    expect(await h.cleanBuild('u1', 'pin1')).toEqual({ serverBuild: 142, saveVersion: 34.05 });
    expect(await h.cleanBuild('u1', 'pin2')).toBeNull();
  });

  it('keeps the raw save gzipped and gives it back', async () => {
    const h = await open(kind);
    await putAll(h, 'u1', [at(10)]);
    const record = await h.latest('u1');
    expect(record?.rawGzip).toBeInstanceOf(Blob);
    expect(record?.rawGzip?.size).toBeLessThan(500); // 2 KB of filler compresses well
    expect(record && (await readRaw(record))).toEqual(rawAt(at(10)));
  });

  it('TR-14: keeps full states for the last two Play Sessions and the ends of older ones', async () => {
    const h = await open(kind);
    // Three sessions of 4 saves, 2 h apart.
    const sessions = [0, 2, 4].map((start) => [0, 4, 8, 12].map((m) => at(start, m)));
    for (const s of sessions) await putAll(h, 'u1', s);
    const kept = (await h.since('u1', 0)).map((r) => r.lastCloudSave);
    expect(kept).toEqual([at(0), at(0, 12), ...(sessions[1] ?? []), ...(sessions[2] ?? [])]);
    // Play Sessions still count every save, from the index.
    expect((await h.playSessions('u1')).map((s) => s.saves)).toEqual([4, 4, 4]);
  });

  it('TR-14: keeps a raw copy only on the newest save and the last save of each Play Session', async () => {
    const h = await open(kind);
    await putAll(h, 'u1', [at(0), at(0, 4), at(2), at(2, 4)]);
    const raw = (await h.since('u1', 0)).filter((r) => r.rawGzip).map((r) => r.lastCloudSave);
    expect(raw).toEqual([at(0, 4), at(2, 4)]);
  });

  it('TR-16: with low quota, only the newest raw copy is kept', async () => {
    const h = await open(kind, { estimate: async () => ({ quota: 120e6, usage: 60e6 }) });
    await putAll(h, 'u1', [at(0), at(0, 4), at(2), at(2, 4)]);
    const raw = (await h.since('u1', 0)).filter((r) => r.rawGzip).map((r) => r.lastCloudSave);
    expect(raw).toEqual([at(2, 4)]);
  });

  it('M3 TR-6: keeps the states around each character switch in older Play Sessions', async () => {
    const h = await open(kind);
    const times = [0, 4, 8, 12, 16, 20].map((m) => at(0, m));
    const played = [0, 0, 0, 1, 1, 1];
    for (const [i, t] of times.entries()) {
      await h.put('u1', stateAt(t, { lastPlayed: played[i] }), rawAt(t));
    }
    await putAll(h, 'u1', [at(2), at(4)]); // push that session out of the two recent ones
    const kept = (await h.since('u1', 0)).map((r) => r.lastCloudSave);
    expect(kept).toEqual([at(0), at(0, 8), at(0, 12), at(0, 16), at(0, 20), at(2), at(4)]);
  });
});

describe('save history at scale (US-8, TR-16, TR-19)', () => {
  it('30 days of saves every 4 minutes stays small and answers playSessions within 100 ms', async () => {
    const h = await open('memory', { clock: () => at(0, 0, 30) });
    // 30 days, saves every 4 minutes, with the game left open: ~10,800 saves in one long session per day
    // (split nightly by an hour without saves so Play Sessions exist).
    let stored = 0;
    for (let day = 0; day < 30; day++) {
      for (let m = 0; m < 23 * 60; m += 4) {
        const t = at(0, m, day);
        await h.put('u1', stateAt(t), rawAt(t));
        stored++;
      }
    }
    expect(stored).toBeGreaterThan(10_000);
    const started = performance.now();
    const sessions = await h.playSessions('u1');
    expect(performance.now() - started).toBeLessThan(100);
    expect(sessions).toHaveLength(30);
    // Full states: the two recent sessions plus two per older session.
    const states = await h.since('u1', 0);
    expect(states.length).toBe(2 * 345 + 28 * 2);
    expect(states.filter((r) => r.rawGzip)).toHaveLength(30);
  }, 120_000);

  it('put stays within 50 ms in IndexedDB with days of history behind it (TR-19)', async () => {
    const h = await open('indexeddb', { clock: () => at(0, 0, 5) });
    for (let day = 0; day < 4; day++) {
      for (let m = 0; m < 23 * 60; m += 4) await h.put('u1', stateAt(at(0, m, day)), rawAt(at(0, m, day)));
    }
    const times: number[] = [];
    for (let m = 0; m < 40; m += 4) {
      const started = performance.now();
      await h.put('u1', stateAt(at(0, m, 4)), rawAt(at(0, m, 4)));
      times.push(performance.now() - started);
    }
    times.sort((a, b) => a - b);
    expect(times[Math.floor(times.length / 2)]).toBeLessThan(50);
  }, 120_000);
});

describe('helpers', () => {
  it('reads the cloud-save time from a raw envelope the way the adapter does', () => {
    expect(cloudSaveTimeOf(rawAt(at(10)))).toBe(at(10));
    expect(cloudSaveTimeOf({ data: { TimeAway: { GlobalTime: 1.0005 } } })).toBe(1001);
    expect(cloudSaveTimeOf({ data: {} })).toBeNull();
    expect(cloudSaveTimeOf({ data: { TimeAway: 'not json' } })).toBeNull();
  });

  it('hashes the uid to 12 hex characters, stable and never the uid itself', async () => {
    const hash = await uidHash('some-uid');
    expect(hash).toMatch(/^[0-9a-f]{12}$/);
    expect(await uidHash('some-uid')).toBe(hash);
    expect(await uidHash('other-uid')).not.toBe(hash);
    expect(await preferencePrefix('some-uid')).toBe(`activeon:${hash}:`);
  });
});
