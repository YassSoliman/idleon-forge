// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Test helpers for M2: the Knowledge Base as `kb compile` would ship it for M2 (authored YAML through the
// schema, generated and authored fact tables), fixture Account States, and the frontier step with kill
// rates recorded by the TR-2 clone at the pin (getMaxDamage is not in the parser bundle's public API).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  type AccountState,
  computeFrontier,
  type FrontierFight,
  toAccountState,
} from '@idleon-forge/account-state';
import {
  AuthoredEntry,
  AuthoredFactsFile,
  type CompiledPriorityList,
  type Entry,
  type FactTable,
} from '@idleon-forge/knowledge';
import { normalizeEnvelope, parseSave, toolboxCalls } from '@idleon-forge/toolbox-parsers';
import { parse } from 'yaml';
import { frontierRoute, lookupOf, type MetaPathKnowledge } from '../../src/metapath';

/** The spec's frozen clock (M2 §4). */
export const NOW = Date.UTC(2026, 9, 17, 12);

const at = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const KNOWLEDGE = at('../../../knowledge/');
export const SCRUBBED = at('../../../../fixtures/scrubbed/');
/** Real saves: gitignored, local only. FORGE_PRIVATE_FIXTURES points elsewhere (e.g. from a worktree). */
export const PRIVATE = process.env.FORGE_PRIVATE_FIXTURES
  ? `${process.env.FORGE_PRIVATE_FIXTURES.replace(/\/$/, '')}/`
  : at('../../../../fixtures/private/');
export const PUBLIC = at('../../../account-state/fixtures/public/');

let cached: MetaPathKnowledge | null = null;

/** Entries and fact tables, schema-parsed (so defaults apply) like the compiled bundle. */
export function loadKb(lists: Record<string, CompiledPriorityList> = {}): MetaPathKnowledge {
  if (!cached) {
    const entries: Record<string, Entry> = {};
    const facts: Record<string, FactTable> = {};
    const dir = `${KNOWLEDGE}systems/`;
    for (const f of existsSync(dir) ? readdirSync(dir).sort() : []) {
      const value = parse(readFileSync(dir + f, 'utf8'));
      if (f.endsWith('.facts.yaml')) for (const t of AuthoredFactsFile.parse(value).facts) facts[t.id] = t;
      else
        for (const e of (value as { entries: unknown[] }).entries) {
          const parsed = AuthoredEntry.parse(e);
          // Drafts never reach the engine (M26 FR-1), here as in the compiled bundle.
          if (parsed.status !== 'draft') entries[parsed.id] = parsed;
        }
    }
    const gen = `${KNOWLEDGE}generated/`;
    for (const f of readdirSync(gen).filter((x) => x.endsWith('.facts.json')))
      for (const t of (JSON.parse(readFileSync(gen + f, 'utf8')) as { facts: FactTable[] }).facts)
        facts[t.id] = t;
    cached = { entries, facts, lists: {}, priorityByStage: {} };
  }
  const priorityByStage: MetaPathKnowledge['priorityByStage'] = {};
  for (const l of Object.values(lists))
    if (l.stage && l.list === 'goals') priorityByStage[l.stage] = { goals: l.id };
  return { ...cached, lists, priorityByStage };
}

/** One character's fight on the frontier, before its killsLeft is read from the save. */
export type Rate = Omit<FrontierFight, 'killsLeft'>;

export interface StateOptions {
  now?: number;
  /**
   * The worker's frontier step (M2 TR-2): 'toolbox' runs Toolbox's clone (`toolboxCalls.frontierRates`),
   * an array injects synthetic rates. Omitted: no frontier, as before the worker step runs.
   */
  rates?: 'toolbox' | Rate[];
  edit?: (data: Record<string, unknown>) => void;
}

const raws = new Map<string, unknown>();
const readRaw = (file: string) => {
  if (!raws.has(file)) raws.set(file, JSON.parse(readFileSync(file, 'utf8')));
  return structuredClone(raws.get(file));
};

/** The Account State of a fixture file, with the worker's frontier step when `rates` are given. */
export function stateOf(file: string, opts: StateOptions = {}): AccountState {
  const raw = readRaw(file) as { data?: Record<string, unknown> };
  if (opts.edit && raw.data) opts.edit(raw.data);
  const envelope = normalizeEnvelope(raw);
  const now = opts.now ?? NOW;
  const parsed = parseSave(envelope, { now });
  let frontier = null;
  if (opts.rates) {
    const kb = lookupOf(loadKb());
    const world = Math.min(4, Number((parsed.account as { currentWorld?: number }).currentWorld ?? 1));
    const route = frontierRoute(kb, world) ?? [];
    const given = opts.rates;
    const rates = (map: number) => (given === 'toolbox' ? toolboxCalls.frontierRates(parsed, map) : given);
    frontier = computeFrontier(parsed, envelope, { world, route, rates });
  }
  return toAccountState(parsed, envelope, { frontier });
}

export const scrubbed = (id: 'scrubbed-w2' | 'scrubbed-w3') => `${SCRUBBED}${id}.json`;
export const privateFixture = (stem: 'yasser' | 'joseph') => `${PRIVATE}${stem}.raw.json`;
export const hasPrivate = (stem: 'yasser' | 'joseph') => existsSync(privateFixture(stem));
