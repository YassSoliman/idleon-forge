// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The shipped bundle's packed form (M11 TR-17 budget, M4 TR-4). A `goalFamily` expands into one concrete
// Contribution per generated Goal, each repeating the authored text, why, Sources and Detector, and
// generated Goals repeat their `generatedBy`. On disk, a field value that several entries share is
// stored once in `shared`; the set of shared fields an entry uses is stored once in `refs`, and the
// entry names it in `$i`. Authors' `notes` are never shown to players (schema: "never shown"), so the
// shipped form leaves them out. `unpackKnowledge` restores every other field exactly; the in-memory
// `CompiledKnowledge` of `kb compile` never sees the packed form.
import { canonicalJson } from './version';

/** The entry fields whose repeated values are interned. */
const INTERNED = [
  'activity',
  'appliesTo',
  'detector',
  'generatedBy',
  'milestones',
  'progress',
  'sources',
  'stopHere',
  'text',
  'title',
  'values',
  'why',
] as const;
/** Fields the shipped bundle drops: authoring aids that no runtime code reads. */
export const UNSHIPPED_FIELDS = ['notes'] as const;
/** Values shorter than this stay inline: the reference would cost as much. */
const MIN_LENGTH = 16;

type Dict = Record<string, unknown>;

/** `kb` with repeated entry field values interned (deterministic: entry ids in sorted order). */
export function packKnowledge<T extends { entries: Record<string, unknown> }>(
  kb: T,
): T & { shared?: string[]; refs?: Record<string, number>[] } {
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
  const refs: Record<string, number>[] = [];
  const refIndex = new Map<string, number>();
  const entries: Record<string, unknown> = {};
  for (const id of ids) {
    const e = { ...(kb.entries[id] as Dict) };
    for (const f of UNSHIPPED_FIELDS) delete e[f];
    const used: Record<string, number> = {};
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
      used[f] = n;
      delete e[f];
    }
    if (Object.keys(used).length > 0) {
      const key = canonicalJson(used);
      let r = refIndex.get(key);
      if (r === undefined) {
        r = refs.length;
        refs.push(used);
        refIndex.set(key, r);
      }
      e.$i = r;
    }
    entries[id] = e;
  }
  return shared.length > 0 ? { ...kb, entries, shared, refs } : kb;
}

/** Restores a packed bundle's entries; a bundle without `shared` comes back as it was. */
export function unpackKnowledge(kb: Dict): Dict {
  const shared = kb.shared;
  const refs = kb.refs;
  if (!Array.isArray(shared) || !Array.isArray(refs)) return kb;
  const entries: Record<string, unknown> = {};
  for (const [id, raw] of Object.entries((kb.entries ?? {}) as Record<string, Dict>)) {
    const r = raw.$i;
    if (typeof r !== 'number') {
      entries[id] = raw;
      continue;
    }
    const { $i: _i, ...rest } = raw;
    // Parsed per entry, so no two entries share one object.
    for (const [f, n] of Object.entries((refs[r] ?? {}) as Record<string, number>))
      rest[f] = JSON.parse(String(shared[n])) as unknown;
    entries[id] = rest;
  }
  const { shared: _s, refs: _r, ...out } = kb;
  return { ...out, entries };
}
