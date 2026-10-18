// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Story fixtures on the worker's real result for the scrubbed saves (M21 RT-21). Class and level only,
// never a name. Each parse runs the whole worker (parser + engine), so results are cached per file.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { AccountState } from '@idleon-forge/account-state';
import type { EngineResult } from '@idleon-forge/engine/result';
import { handleRequest } from '../src/worker/handle-request';

const SCRUBBED = path.resolve(import.meta.dirname, '../../../fixtures/scrubbed');

export interface Parsed {
  result: EngineResult;
  state: AccountState;
  /** The parse clock: a "fresh" run, the save's own time + 60 s (M21 §6). */
  now: number;
}

const cache = new Map<string, Parsed>();

/** `scrubbed-w2` (W2-late) or `scrubbed-w3` (W3-early), parsed fresh with an 8 h Expected Return. */
export function scrubbed(name: 'scrubbed-w2' | 'scrubbed-w3'): Parsed {
  const hit = cache.get(name);
  if (hit) return hit;
  const raw = JSON.parse(readFileSync(path.join(SCRUBBED, `${name}.json`), 'utf8')) as {
    data: Record<string, unknown>;
  };
  const ta = raw.data.TimeAway;
  const savedAt = Math.round(
    ((typeof ta === 'string' ? JSON.parse(ta) : ta) as { GlobalTime: number }).GlobalTime * 1000,
  );
  const now = savedAt + 60_000;
  const res = handleRequest({
    type: 'parse',
    id: 1,
    now,
    input: { kind: 'text', text: JSON.stringify(raw) },
    engine: {
      expectedReturnSeconds: 8 * 3600,
      sessionStartedAt: null,
      learnedExpectedReturnSeconds: null,
      knowledgeVersion: 'k',
    },
  } as never);
  if (!('state' in res) || !res.ok || !res.result || 'error' in res.result)
    throw new Error(`expected a result for ${name}`);
  const parsed = { result: res.result, state: res.state, now };
  cache.set(name, parsed);
  return parsed;
}

/** The two Verdict blockers W2-late has (its golden): the Barbarian Lv 60's food, and the Arcade balls. */
export const W2_BLOCKERS = {
  food: 'afk.check.dies-fixable-by-food',
  account: 'arcade.check.balls-cap',
} as const;

const entryOf = (key: string) => key.split('@')[0] ?? key;

/**
 * `allSetW2` (M21 US-4, RT-21): W2-late with the Barbarian Lv 60's food and the account blocker
 * resolved. The save itself isn't edited (food and Arcade balls live deep in the raw save); instead the
 * two Checks are taken out of the result as if they no longer fired: their Goals go, their keys leave
 * `blockerKeys`, and a character left with no blocker reads Ready. Everything else is the real result.
 */
export function allSetW2(): EngineResult {
  const { result } = scrubbed('scrubbed-w2');
  const resolved = (key: string) => entryOf(key) === W2_BLOCKERS.food || entryOf(key) === W2_BLOCKERS.account;
  const barbarian = result.characters.find((c) => c.classLabel === 'Barbarian' && c.level === 60);
  if (!barbarian) throw new Error('W2-late has a Barbarian Lv 60');
  return {
    ...result,
    characters: result.characters.map((c) => {
      if (c.index !== barbarian.index) return c;
      const blockerKeys = c.verdict.blockerKeys.filter((k) => !resolved(k));
      return {
        ...c,
        goals: c.goals.filter((g) => !resolved(g.nextAction.key)),
        verdict: {
          ...c.verdict,
          blockerKeys,
          kind: c.verdict.kind === 'fix' && blockerKeys.length === 0 ? 'ready' : c.verdict.kind,
        },
      };
    }),
    account: {
      ...result.account,
      goals: result.account.goals.filter((g) => !resolved(g.nextAction.key)),
      blockerKeys: result.account.blockerKeys.filter((k) => !resolved(k)),
    },
  };
}
