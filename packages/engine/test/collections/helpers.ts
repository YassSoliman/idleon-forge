// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Test helpers for M8: the Knowledge Base with the generated entries M8 reads (stamp, card and quest
// Acquisitions, card set Goals) on top of M2's loader, and fixture Account States parsed the way the
// worker parses them (with Toolbox's functions, so shop stock, card sets and carry caps are read).
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type AccountState, toAccountState } from '@idleon-forge/account-state';
import type { Entry } from '@idleon-forge/knowledge';
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import type { CollectionsKnowledge } from '../../src/collections';
import { loadKb } from '../metapath/helpers';

const GENERATED = fileURLToPath(new URL('../../../knowledge/generated/', import.meta.url));

let kb: CollectionsKnowledge | null = null;
export function loadM8Kb(): CollectionsKnowledge {
  if (kb) return kb;
  const base = loadKb();
  const entries: Record<string, Entry> = { ...base.entries };
  for (const f of readdirSync(GENERATED).filter((x) => x.endsWith('.json') && !x.endsWith('.facts.json')))
    for (const e of (JSON.parse(readFileSync(GENERATED + f, 'utf8')) as { entries?: Entry[] }).entries ?? [])
      entries[e.id] ??= e;
  kb = { entries, facts: base.facts };
  return kb;
}

const raws = new Map<string, unknown>();
/** The worker's Account State of a fixture file at its own last cloud save. */
export function m8State(file: string, edit?: (data: Record<string, unknown>) => void): AccountState {
  if (!raws.has(file)) raws.set(file, JSON.parse(readFileSync(file, 'utf8')));
  const raw = structuredClone(raws.get(file)) as { data?: Record<string, unknown> };
  if (edit && raw.data) edit(raw.data);
  const envelope = normalizeEnvelope(raw);
  const now = Date.UTC(2026, 9, 17, 16);
  const parsed = parseSave(envelope, { now });
  return toAccountState(parsed, envelope, { toolbox: { calls: toolboxCalls, withFrozenClock } });
}
