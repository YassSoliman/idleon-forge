// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The shipped bundle's packed form (M11 TR-17 budget, M4 TR-4). The compiled Knowledge Base repeats
// itself a lot: every entry of a type has the same keys, a `goalFamily` expands into one Contribution
// per generated Goal with the same text, why, Sources and Detector, and Sources, titles, systems and
// stage ranges recur across hundreds of entries. The packed form is a lossless JSON codec over the
// whole bundle:
//   - an object is `[3 + shape, ...values]`, its keys stored once in `shapes` (key repetition gone);
//   - an array is `[0, ...items]`;
//   - a string that occurs twice or more (and is not tiny) is `[1, n]`, stored once in `strings`;
//   - an object or array that occurs twice or more (and is not tiny) is `[2, n]`, stored once in `trees`;
//   - numbers, booleans and null stay as they are.
// Keys are encoded sorted, like `canonicalJson`, so the loader sees exactly the order the JSON form had.
// A shared tree is decoded afresh at every reference, so no two entries share one object.
// Authors' `notes` are never shown to players (schema: "never shown"), so the shipped form leaves them
// out; `byType` and `detectorOf` are functions of the entries, so the loader rebuilds them. Everything
// else comes back exactly: `unpackKnowledge(packKnowledge(kb))` equals `kb` minus notes. Source `note`s
// (reviewer paraphrases) are left out the same way since M26 (`shippedEntry`).
import { ENTRY_TYPES } from './schema';

/** Marks a packed bundle; bumped if the encoding ever changes. */
export const PACK_FORMAT = 2;
/** Fields the shipped bundle drops: authoring aids that no runtime code reads. */
export const UNSHIPPED_FIELDS = ['notes'] as const;

/** A Source's `note` (our paraphrase of the claim, for reviewers): no runtime code reads it either (M26). */
const isSource = (o: Dict) => typeof o.url === 'string' && typeof o.tier === 'number' && 'note' in o;
function dropSourceNotes(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(dropSourceNotes);
  if (v && typeof v === 'object') {
    const out: Dict = {};
    for (const [k, x] of Object.entries(v as Dict)) out[k] = dropSourceNotes(x);
    if (isSource(out)) delete out.note;
    return out;
  }
  return v;
}

/** An entry as the shipped bundle holds it: no authors' `notes`, no Source `note`s. */
export function shippedEntry(e: unknown): Dict {
  const copy = dropSourceNotes(e) as Dict;
  for (const f of UNSHIPPED_FIELDS) delete copy[f];
  return copy;
}

const ARRAY = 0;
const STRING = 1;
const TREE = 2;
const SHAPE_BASE = 3;
/** Strings shorter than this stay inline: `[1,123]` would cost as much. */
const MIN_STRING = 6;
/** Subtrees whose JSON is shorter than this stay inline. */
const MIN_TREE = 24;

type Dict = Record<string, unknown>;
type Encoded = null | boolean | number | string | Encoded[];

export interface PackedKnowledge {
  kbpack: typeof PACK_FORMAT;
  shapes: string[][];
  strings: string[];
  trees: Encoded[];
  body: Encoded;
}

/** `v` with object keys sorted and undefined values dropped, as `canonicalJson` writes it. */
function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === 'object') {
    const o = v as Dict;
    const out: Dict = {};
    for (const k of Object.keys(o).sort()) {
      if (o[k] === undefined) continue;
      if (k === '__proto__') throw new Error('packKnowledge: a "__proto__" key cannot be packed');
      out[k] = canonical(o[k]);
    }
    return out;
  }
  return v;
}

/** The shipped form of `kb` (deterministic: the same `kb` always packs to the same JSON). */
export function packKnowledge(kb: { entries: Record<string, unknown> }): PackedKnowledge {
  const entries: Dict = {};
  for (const [id, e] of Object.entries(kb.entries)) entries[id] = shippedEntry(e);
  const { byType: _b, detectorOf: _d, ...rest } = kb as Dict;
  const doc = canonical({ ...rest, entries });

  // Pass 1: how often each string and each subtree occurs.
  const stringCount = new Map<string, number>();
  const treeCount = new Map<string, number>();
  const json = new Map<object, string>();
  const count = (v: unknown): void => {
    if (typeof v === 'string') stringCount.set(v, (stringCount.get(v) ?? 0) + 1);
    else if (v && typeof v === 'object') {
      const j = JSON.stringify(v);
      json.set(v, j);
      treeCount.set(j, (treeCount.get(j) ?? 0) + 1);
      for (const x of Array.isArray(v) ? v : Object.values(v)) count(x);
    }
  };
  count(doc);

  // Pass 2: encode, numbering shapes, strings and trees in first-use order.
  const shapes: string[][] = [];
  const shapeIndex = new Map<string, number>();
  const strings: string[] = [];
  const stringIndex = new Map<string, number>();
  const trees: Encoded[] = [];
  const treeIndex = new Map<string, number>();
  const encode = (v: unknown, shared = true): Encoded => {
    if (typeof v === 'string') {
      if (v.length < MIN_STRING || (stringCount.get(v) ?? 0) < 2) return v;
      let n = stringIndex.get(v);
      if (n === undefined) {
        n = strings.length;
        strings.push(v);
        stringIndex.set(v, n);
      }
      return [STRING, n];
    }
    if (v === null || typeof v !== 'object') return v as Encoded;
    const j = json.get(v) as string;
    if (shared && j.length >= MIN_TREE && (treeCount.get(j) ?? 0) >= 2) {
      let n = treeIndex.get(j);
      if (n === undefined) {
        n = trees.length;
        trees.push(null);
        treeIndex.set(j, n);
        trees[n] = encode(v, false);
      }
      return [TREE, n];
    }
    if (Array.isArray(v)) return [ARRAY, ...v.map((x) => encode(x))];
    const keys = Object.keys(v);
    const key = JSON.stringify(keys);
    let s = shapeIndex.get(key);
    if (s === undefined) {
      s = shapes.length;
      shapes.push(keys);
      shapeIndex.set(key, s);
    }
    return [SHAPE_BASE + s, ...keys.map((k) => encode((v as Dict)[k]))];
  };
  const body = encode(doc, false);
  return { kbpack: PACK_FORMAT, shapes, strings, trees, body };
}

/** Decodes a packed body; throws on anything the encoder never writes. */
function decoder(p: PackedKnowledge): (v: Encoded) => unknown {
  const { shapes, strings, trees } = p;
  const bad = (what: string): never => {
    throw new Error(`the packed Knowledge Base has a bad ${what}`);
  };
  const decode = (v: Encoded): unknown => {
    if (!Array.isArray(v)) return v;
    const tag = v[0];
    if (tag === ARRAY) {
      const out = new Array(v.length - 1);
      for (let i = 1; i < v.length; i++) out[i - 1] = decode(v[i] as Encoded);
      return out;
    }
    if (tag === STRING) return strings[v[1] as number] ?? bad('string reference');
    if (tag === TREE) return decode(trees[v[1] as number] ?? bad('tree reference'));
    const keys = shapes[(tag as number) - SHAPE_BASE] ?? bad('shape reference');
    if (keys.length !== v.length - 1) bad('object');
    const out: Dict = {};
    for (let i = 0; i < keys.length; i++) out[keys[i] as string] = decode(v[i + 1] as Encoded);
    return out;
  };
  return decode;
}

/** The Detector ids an entry's line comes from (kb-tools `detectorRefsOf`, ids only). */
function detectorIdsOf(e: Dict): string[] {
  const id = (x: unknown) => (x && typeof x === 'object' ? (x as { id?: unknown }).id : undefined);
  const out: unknown[] = [];
  if (e.type === 'goal') out.push(id(e.progress));
  if (e.type === 'contribution' || e.type === 'check') out.push(id(e.detector));
  if (e.type === 'acquisition' && e.detector) out.push(id(e.detector));
  if (e.type === 'metapath') {
    if (e.detector) out.push(id(e.detector));
    for (const m of (Array.isArray(e.milestones) ? e.milestones : []) as Dict[]) out.push(id(m.detector));
  }
  return [...new Set(out.filter((x): x is string => typeof x === 'string'))].sort();
}

/** `byType` (ids sorted) and `detectorOf`, as `kb compile` builds them, from the entries. */
function derivedIndexes(entries: Record<string, Dict>): {
  byType: Record<string, string[]>;
  detectorOf: Record<string, string[]>;
} {
  const byType: Record<string, string[]> = Object.fromEntries(ENTRY_TYPES.map((t) => [t, [] as string[]]));
  const detectorOf: Record<string, string[]> = {};
  for (const id of Object.keys(entries).sort()) {
    const e = entries[id] as Dict;
    byType[String(e.type)]?.push(id);
    const ids = detectorIdsOf(e);
    if (ids.length) detectorOf[id] = ids;
  }
  return { byType, detectorOf };
}

const isPacked = (kb: Dict): kb is Dict & PackedKnowledge =>
  kb.kbpack === PACK_FORMAT &&
  Array.isArray(kb.shapes) &&
  Array.isArray(kb.strings) &&
  Array.isArray(kb.trees) &&
  'body' in kb;

/** Restores a packed bundle; a bundle that is not packed comes back as it was. */
export function unpackKnowledge(kb: Dict): Dict {
  if (!isPacked(kb)) return kb;
  const out = decoder(kb)(kb.body);
  if (!out || typeof out !== 'object' || Array.isArray(out))
    throw new Error('the packed Knowledge Base is not an object');
  const doc = out as Dict;
  const entries = (doc.entries ?? {}) as Record<string, Dict>;
  return { ...doc, ...derivedIndexes(entries) };
}
