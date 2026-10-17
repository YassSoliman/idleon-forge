// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 test helpers: the Knowledge Base as `kb compile` ships it for the Spend Plan (authored YAML through
// the schema, plus the generated Acquisitions the lists reference), and Account States parsed with the
// worker's Toolbox calls (the Vault ladders and the stamp re-evaluation, TR-4).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type AccountState, toAccountState } from '@idleon-forge/account-state';
import type { Entry, StageId } from '@idleon-forge/knowledge';
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { lookupOf } from '../../src/metapath/knowledge';
import { detectStage } from '../../src/metapath/stage';
import type { SpendKnowledge } from '../../src/spend';
import { loadKb, NOW, PRIVATE, SCRUBBED } from '../metapath/helpers';

const at = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const GENERATED = at('../../../knowledge/generated/');
const ACQUISITIONS = ['upgrade-vault', 'bribes', 'stamps', 'statues', 'alchemy-p2w'];

export type SpendKb = SpendKnowledge & ReturnType<typeof loadKb>;

let cached: SpendKb | null = null;
export function spendKb(): SpendKb {
  if (cached) return cached;
  const base = loadKb();
  const entries: Record<string, Entry> = { ...base.entries };
  for (const g of ACQUISITIONS)
    for (const e of (JSON.parse(readFileSync(`${GENERATED}${g}.json`, 'utf8')) as { entries: Entry[] })
      .entries)
      entries[e.id] = e;
  const priorityByStage: SpendKnowledge['priorityByStage'] = {};
  for (const e of Object.values(entries))
    if (e.type === 'priority' && e.list === 'spend' && e.stage) priorityByStage[e.stage] = { spend: e.id };
  cached = { ...base, entries, priorityByStage } as SpendKb;
  return cached;
}

const raws = new Map<string, unknown>();
const readRaw = (file: string) => {
  if (!raws.has(file)) raws.set(file, JSON.parse(readFileSync(file, 'utf8')));
  return structuredClone(raws.get(file)) as { data: Record<string, unknown> };
};

/** An Account State parsed like the worker parses it, with optional raw save edits (synthetic fixtures). */
export function spendStateOf(file: string, edit?: (data: Record<string, unknown>) => void): AccountState {
  const raw = readRaw(file);
  if (edit) edit(raw.data);
  const envelope = normalizeEnvelope(raw);
  const parsed = parseSave(envelope, { now: NOW });
  return toAccountState(parsed, envelope, { toolbox: { calls: toolboxCalls, withFrozenClock } });
}

export const stageOf = (s: AccountState): StageId => {
  const id = detectStage(s, lookupOf(spendKb())).id;
  if (!id) throw new Error('fixture has no Stage');
  return id;
};

export const scrubbedFile = (id: 'scrubbed-w2' | 'scrubbed-w3') => `${SCRUBBED}${id}.json`;
export const privateFile = (stem: 'yasser' | 'joseph') => `${PRIVATE}${stem}.raw.json`;
export const hasPrivateFile = (stem: 'yasser' | 'joseph') => existsSync(privateFile(stem));
export const PUBLIC_FILES = (() => {
  const dir = at('../../../account-state/fixtures/public/');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => dir + f);
})();
