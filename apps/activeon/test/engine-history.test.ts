// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The save history the worker's engine reads (M10 TR-6, M1 TR-14): sent compact with each parse, only
// earlier saves, none for a paste, and giving the same result as the whole states would.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AccountState } from '@idleon-forge/account-state';
import { engineHistoryOf, type HistoryEntry } from '@idleon-forge/sync';
import { normalizeEnvelope } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { createRequestHandler, historyFor } from '../src/worker/handle-request';
import type { EngineCall, ParseInput } from '../src/worker/protocol';

const HOUR = 3_600_000;
const SCRUBBED = fileURLToPath(new URL('../../../fixtures/scrubbed/scrubbed-w2.json', import.meta.url));
const raw = readFileSync(SCRUBBED, 'utf8');
const envelope = normalizeEnvelope(JSON.parse(raw));
const live: ParseInput = { kind: 'envelope', envelope };

/** The W2-late save parsed by the worker, at its own cloud-save time, with the history parse too. */
let cached: { state: AccountState; savedAt: number } | null = null;
function parsed(): { state: AccountState; savedAt: number } {
  if (cached) return cached;
  const res = createRequestHandler()({ id: 1, type: 'parse', now: 0, input: live, withHistory: true });
  if (!('state' in res) || !res.ok || !res.historyState) throw new Error('expected a history state');
  const savedAt = res.historyState.account.lastCloudSave;
  if (savedAt === null) throw new Error('no cloud-save time');
  cached = { state: res.historyState, savedAt };
  return cached;
}

/**
 * Three earlier saves, 2 h apart, each at the Barbarian Lv 60's switch-away (so inside the 10-minute
 * load window): it ate 30 Meat Pie an hour, and Water rose 2 an hour below its 32 cap.
 * `offsetMs` moves every save away from the switch-away (a stale save the window must drop).
 */
function history(base: AccountState, offsetMs = 0): HistoryEntry[] {
  const c0 = base.characters.find((c) => c.index === 0);
  const since = c0?.afk?.afkSince;
  if (!c0?.afk || since === undefined) throw new Error('no AFK facts');
  return [3, 2, 1].map((k) => {
    const afkSince = since - k * 2 * HOUR;
    const at = afkSince + offsetMs;
    const pie = {
      slot: 2,
      item: 'FoodHealth7',
      kind: 'health' as const,
      amount: 100 + 60 * k,
      healPerBite: 500,
    };
    const afk = c0.afk ? { ...c0.afk, afkSince, food: [...c0.afk.food, pie] } : null;
    const liquids = (base.account.afk?.liquids ?? []).map((l) =>
      l.index === 0 ? { ...l, current: (3 - k) * 4 } : l,
    );
    const state: AccountState = {
      ...base,
      asOf: at,
      account: {
        ...base.account,
        lastCloudSave: at,
        afk: base.account.afk ? { ...base.account.afk, liquids } : null,
      },
      characters: base.characters.map((c) => (c.index === 0 ? { ...c, afk } : c)),
    };
    return { lastCloudSave: at, receivedAt: at, state };
  });
}

const call = (entries: readonly HistoryEntry[], sessionStartedAt: number | null): EngineCall => ({
  expectedReturnSeconds: 8 * 3600,
  sessionStartedAt,
  learnedExpectedReturnSeconds: null,
  knowledgeVersion: 'k1',
  history: entries,
});

function run(engine: EngineCall, input: ParseInput = live, now?: number) {
  const { savedAt } = parsed();
  const res = createRequestHandler()({ id: 2, type: 'parse', now: now ?? savedAt, input, engine });
  if (!('state' in res) || !res.ok || !res.result || 'error' in res.result) throw new Error('no result');
  return res.result;
}

const WATER_SLOW = 'takes about 16 h to refill';
const STOCK_UP = 'and stock up on it';

describe('the engine reads real save history (M10 TR-6)', () => {
  it('without history, neither the Water refill nor the food stock-up shows', () => {
    const text = JSON.stringify(run(call([], null)));
    expect(text).not.toContain(WATER_SLOW);
    expect(text).not.toContain(STOCK_UP);
    expect(text).toContain("Spend Water (bubbles, vials or the Liquid Shop): it's at cap (32 of 32)");
  });

  it('with enough history, the observed Water refill and the food stock-up light up', () => {
    const { state, savedAt } = parsed();
    const text = JSON.stringify(run(call(history(state), savedAt)));
    expect(text).toContain(WATER_SLOW);
    expect(text).toContain(STOCK_UP);
  });

  it('the compact history gives exactly the result the whole states give', () => {
    const { state, savedAt } = parsed();
    const full = history(state);
    for (const start of [savedAt, full[1]?.lastCloudSave ?? 0, null]) {
      const compact = engineHistoryOf(full, { before: savedAt, sessionStartedAt: start });
      expect(compact.some((h) => h.state.account.cards === undefined)).toBe(true);
      expect(run(call(compact, start))).toEqual(run(call(full, start)));
    }
  }, 60_000);

  it('saves away from the switch-away are dropped (the 10-minute AFK window): no food rate', () => {
    const { state, savedAt } = parsed();
    const text = JSON.stringify(run(call(history(state, 30 * 60_000), savedAt)));
    expect(text).not.toContain(STOCK_UP);
  });

  it('a stale save (opened hours later) still reads its history the same way', () => {
    const { state, savedAt } = parsed();
    const later = savedAt + 3 * HOUR;
    const text = JSON.stringify(run(call(history(state), savedAt), live, later));
    expect(text).toContain(STOCK_UP);
  });

  it('a pasted save reads no history, even when some is sent (M1 D2)', () => {
    const { state, savedAt } = parsed();
    const text = JSON.stringify(run(call(history(state), savedAt), { kind: 'text', text: raw }));
    expect(text).not.toContain(WATER_SLOW);
    expect(text).not.toContain(STOCK_UP);
  });

  it('only earlier saves reach the engine, oldest first', () => {
    const { state, savedAt } = parsed();
    const h = history(state);
    const self = { lastCloudSave: savedAt, receivedAt: savedAt, state };
    const later = { lastCloudSave: savedAt + HOUR, receivedAt: savedAt + HOUR, state };
    const got = historyFor(state, call([later, self, ...[...h].reverse()], null));
    expect(got.map((x) => x.lastCloudSave)).toEqual(h.map((x) => x.lastCloudSave));
    expect(historyFor(state, { ...call([], null), history: undefined })).toEqual([]);
  });
});
