// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Test fixtures for M3: the compiled Knowledge Base, the Detector registry, and the scrubbed saves
// parsed at their own cloud-save time (the spec's fixture convention: the W3 export was captured 8.5 h
// after its save, and using that as `now` would project 8.5 h of extra AFK).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AccountState, CharacterAfkFacts } from '@idleon-forge/account-state';
import { compile } from '@idleon-forge/kb-tools/src/compile';
import { loadSource } from '@idleon-forge/kb-tools/src/load';
import { accountStateOfExport } from '@idleon-forge/kb-tools/src/parse';
import { type CompiledKnowledge, type HistoryEntry, withCharacter } from '@idleon-forge/knowledge';
import { detectors } from '@idleon-forge/knowledge/detectors';
import { type AfkSafetyResult, evaluateAfkSafety, HOUR_MS } from '../../src/afk';

export const kb: CompiledKnowledge = await compile(loadSource(), { git: null });
export const registry = detectors;

const SCRUBBED = fileURLToPath(new URL('../../../../fixtures/scrubbed/', import.meta.url));

const cache = new Map<string, AccountState>();
/** A scrubbed save parsed at its own cloud-save time. */
export function fixture(id: 'scrubbed-w2' | 'scrubbed-w3'): AccountState {
  const hit = cache.get(id);
  if (hit) return hit;
  const raw = JSON.parse(readFileSync(`${SCRUBBED}${id}.json`, 'utf8')) as { data: Record<string, unknown> };
  const ta = raw.data.TimeAway;
  const timeAway = (typeof ta === 'string' ? JSON.parse(ta) : ta) as { GlobalTime: number };
  const state = accountStateOfExport(raw, Math.round(timeAway.GlobalTime * 1000));
  cache.set(id, state);
  return state;
}

export const W2 = () => fixture('scrubbed-w2');
export const W3 = () => fixture('scrubbed-w3');

export function evaluate(
  state: AccountState,
  hours = 8,
  opts: { history?: readonly HistoryEntry[]; now?: number } = {},
): AfkSafetyResult {
  const usedMs = hours * HOUR_MS;
  return evaluateAfkSafety({
    state,
    history: opts.history ?? [],
    now: opts.now ?? state.asOf,
    expectedReturn: { usedMs, learnedMs: null, source: 'player' },
    kb,
    registry,
  });
}

/** Changes one character's AFK facts. */
export function patchAfk(s: AccountState, index: number, patch: Partial<CharacterAfkFacts>): AccountState {
  const afk = s.characters.find((c) => c.index === index)?.afk;
  if (!afk) throw new Error(`character ${index} has no AFK facts`);
  return withCharacter(s, index, { afk: { ...afk, ...patch } });
}

export const charOf = (r: AfkSafetyResult, index: number) => {
  const c = r.characters.find((x) => x.index === index);
  if (!c) throw new Error(`no character ${index}`);
  return c;
};
export const blockers = (findings: AfkSafetyResult['account']['findings']) =>
  findings.filter((f) => f.role === 'blocker').map((f) => f.entryId);
export const nextActions = (findings: AfkSafetyResult['account']['findings']) =>
  findings.filter((f) => f.role === 'next-action').map((f) => f.entryId);
/** R-PILL-1: the entry ids of a subject's cap pills. */
export const capsOf = (c: { caps: AfkSafetyResult['account']['caps'] }) => c.caps.map((p) => p.entryId);
