// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Shared helpers for generator tests (TR-10): each generator gets (1) a test on a small synthetic
// data slice with a hand-checked expected output, (2) invariant tests on the live pinned data, and
// (3) a check of its reading of the raw fields against a known save, before it merges.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { FactTableT, GeneratedEntryT } from '@idleon-forge/knowledge';
import type { Generator, GeneratorInput, Pin } from '@idleon-forge/knowledge/generators';
import { runGenerator } from '../../src/generate';
import { parseExport } from '../../src/parse';
import { PUBLIC_FIXTURES, readPin } from '../../src/paths';
import { loadConstants } from '../../src/toolbox-data';

export const PIN: Pin = {
  commit: '6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1',
  commitDate: '2026-10-17',
  gameVersion: '2.3.540',
  toolboxVersion: '3.3.96',
};

/** Runs a generator on a synthetic slice (no declared-input guard: the slice is the whole world). */
export function runOnSlice(
  g: Generator,
  data: Record<string, unknown>,
  constants: Record<string, unknown> = {},
  patchNotes: GeneratorInput['patchNotes'] = [],
) {
  return g.run({ data, constants, pin: PIN, patchNotes }) as {
    entries?: GeneratedEntryT[];
    facts?: FactTableT[];
  } & Record<string, unknown>;
}

/** Runs a generator on the live pinned Toolbox data, through the real runner (validation included). */
export async function runLive(g: Generator) {
  const pin = readPin();
  const out = await runGenerator(g, { pin, patchNotes: [] });
  if ('raw' in out) throw new Error(`${g.name} is a validation-only generator; use runLiveRaw`);
  return out;
}

export async function constantsOf(spec: Record<string, string>) {
  return loadConstants(spec);
}

/** Toolbox's full parse of a public fixture at its own lastUpdated: the "known save" for field checks. */
export function knownSave(file = 'latest.json') {
  const raw = JSON.parse(readFileSync(path.join(PUBLIC_FIXTURES, file), 'utf8')) as { lastUpdated: number };
  return parseExport(raw, raw.lastUpdated);
}

/** Ids ascend, are unique, and every entry or table carries one tier 1 Source at the pin. */
export function invariants(out: { entries: GeneratedEntryT[]; facts: FactTableT[] }) {
  const ids = [...out.entries.map((e) => e.id), ...out.facts.map((f) => f.id)];
  const problems: string[] = [];
  if (new Set(ids).size !== ids.length) problems.push('duplicate ids');
  const sorted = [...out.entries.map((e) => e.id)].sort();
  if (sorted.join() !== out.entries.map((e) => e.id).join()) problems.push('entries not sorted by id');
  for (const e of [...out.entries, ...out.facts])
    if (!e.sources.every((s) => s.tier === 1 && s.url.includes(readPin().commit)))
      problems.push(`${e.id}: Source not a pinned tier 1 link`);
  for (const e of out.entries)
    if (e.type === 'goal' && e.milestones?.some((m, i, a) => i > 0 && m.at <= (a[i - 1]?.at ?? 0)))
      problems.push(`${e.id}: ladder not ascending`);
  return problems;
}
