// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type AccountState, toAccountState } from '@idleon-forge/account-state';
import { normalizeEnvelope, parseSave } from '@idleon-forge/toolbox-parsers';
import type { EngineInput } from '../../src/core/module';
import type { Goal, NextAction } from '../../src/result';

export const NOW = Date.UTC(2026, 9, 17, 12);
const PUBLIC = fileURLToPath(new URL('../../../account-state/fixtures/public/', import.meta.url));

/** Toolbox's public saves (CI-safe). */
export const PUBLIC_SAVES = readdirSync(PUBLIC)
  .filter((f) => f.endsWith('.json'))
  .sort();

const cache = new Map<string, AccountState>();
export function publicState(file: string): AccountState {
  const hit = cache.get(file);
  if (hit) return hit;
  const envelope = normalizeEnvelope(JSON.parse(readFileSync(PUBLIC + file, 'utf8')));
  const state = toAccountState(parseSave(envelope, { now: NOW }), envelope, { source: 'paste' });
  cache.set(file, state);
  return state;
}

export const input = (state: AccountState, over: Partial<EngineInput> = {}): EngineInput => ({
  state,
  history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
  knowledge: { version: 'test', coverage: () => [] },
  now: NOW,
  options: { expectedReturnSeconds: 8 * 3600 },
  ...over,
});

const SRC = {
  label: 'wiki',
  url: 'https://idleon.wiki',
  tier: 2 as const,
  verifiedOn: '2026-10-01',
  gameVersion: '2.3.540',
};

export const action = (
  entryId: string,
  subject: string,
  text = entryId,
  over: Partial<NextAction> = {},
): NextAction => ({
  key: `${entryId}@${subject}`,
  entryId,
  text,
  why: 'why',
  sources: [SRC],
  stale: false,
  contested: null,
  confidence: 'H',
  provenance: { entryIds: [entryId], fields: [] },
  ...over,
});

export const goal = (
  entryId: string,
  subject: string,
  over: Partial<Goal> = {},
  actionOver: Partial<NextAction> = {},
): Goal => ({
  id: entryId,
  title: entryId.split('.')[0] ?? entryId,
  system: entryId.split('.')[0] ?? entryId,
  category: 'spendable',
  nextAction: action(entryId, subject, actionOver.text ?? entryId, actionOver),
  milestone: null,
  ...over,
});
