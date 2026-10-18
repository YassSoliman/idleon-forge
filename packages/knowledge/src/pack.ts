// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The shipped bundle's packed form (M11 TR-17 budget, M4 TR-4). A `goalFamily` expands into one concrete
// Contribution per generated Goal, each repeating the authored text, why, Sources and Detector, and
// generated Goals repeat their `generatedBy`. On disk, a field value that several entries share is
// stored once in `shared` and each entry names it in `$i`; `unpackKnowledge` restores the exact
// entries. The in-memory `CompiledKnowledge` never sees the packed form.
import { canonicalJson } from './version';

/** The entry fields whose repeated values are interned. */
const INTERNED = [
  'activity',
  'appliesTo',
  'detector',
  'generatedBy',
  'milestones',
  'notes',
  'progress',
  'sources',
  'stopHere',
  'text',
  'title',
  'values',
  'why',
] as const;
/** Values shorter than this stay inline: the reference would cost as much. */
const MIN_LENGTH = 16;

type Dict = Record<string, unknown>;

/** `kb` with repeated entry field values interned (deterministic: entry ids in sorted order). */
export function packKnowledge<T extends { entries: Record<string, unknown> }>(
  kb: T,
): T & { shared?: string[] } {
  const ids = Object.keys(kb.entries).sort();
  const count = new Map<string, number>();
  for (const id of ids) {
    const e = kb.entries[id] as Dict;
    for (const f of INTERNED)
      if (e[f] !== undefined) {
        const key = `${f}\u0000${canonicalJson(e[f])}`;
        count.set(key, (count.get(key) ?? 0) + 1);
      }
  }
  const shared: string[] = [];
  const index = new Map<string, number>();
  const entries: Record<string, unknown> = {};
  for (const id of ids) {
    const e = { ...(kb.entries[id] as Dict) };
    const refs: Record<string, number> = {};
    for (const f of INTERNED) {
      if (e[f] === undefined) continue;
      const json = canonicalJson(e[f]);
      if (json.length < MIN_LENGTH || (count.get(`${f}\u0000${json}`) ?? 0) < 2) continue;
      let n = index.get(json);
      if (n === undefined) {
        n = shared.length;
        shared.push(json);
        index.set(json, n);
      }
      refs[f] = n;
      delete e[f];
    }
    if (Object.keys(refs).length > 0) e.$i = refs;
    entries[id] = e;
  }
  return shared.length > 0 ? { ...kb, entries, shared } : kb;
}

/** Restores a packed bundle's entries; a bundle without `shared` comes back as it was. */
export function unpackKnowledge(kb: Dict): Dict {
  const shared = kb.shared;
  if (!Array.isArray(shared)) return kb;
  const entries: Record<string, unknown> = {};
  for (const [id, raw] of Object.entries((kb.entries ?? {}) as Record<string, Dict>)) {
    const refs = raw.$i as Record<string, number> | undefined;
    if (!refs) {
      entries[id] = raw;
      continue;
    }
    const { $i: _i, ...rest } = raw;
    // Parsed per entry, so no two entries share one object.
    for (const [f, n] of Object.entries(refs)) rest[f] = JSON.parse(String(shared[n])) as unknown;
    entries[id] = rest;
  }
  const { shared: _s, ...out } = kb;
  return { ...out, entries };
}
