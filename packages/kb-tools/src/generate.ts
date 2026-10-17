// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `kb generate` (M11 FR-14, FR-15, FR-18, TR-10): rebuilds every generated entry and fact table from
// the pinned Toolbox data, writes generated/*.json deterministically, prints the fact diff for the sync
// PR, and holds a failing generator's last good output instead of blocking the parser update.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  canonicalJson,
  ENTRY_ID_RE,
  FACT_ID_RE,
  FactTable,
  type FactTableT,
  GeneratedEntry,
  type GeneratedEntryT,
} from '@idleon-forge/knowledge';
import type { Generator, GeneratorInput } from '@idleon-forge/knowledge/generators';
import { discoverGenerators } from './discover';
import { type Hold, layoutOf, loadSource } from './load';
import { GENERATED_DIR, KNOWLEDGE, readPin, rel, type UpstreamPin } from './paths';
import { writeScrubInputs } from './scrub/inputs';
import { declaredData, loadConstants, loadGameData, loadPatchNotes } from './toolbox-data';

/** 2-space JSON, sorted keys, trailing newline (TR-10). */
export const stableJson = (value: unknown): string => `${canonicalJson(value, 2)}\n`;

export interface GeneratedFiles {
  /** Path relative to generated/ -> file content. */
  files: Map<string, string>;
  held: Hold[];
  errors: string[];
  /** One line per generator: what it emitted. */
  summary: string[];
}

type Output = { entries: GeneratedEntryT[]; facts: FactTableT[] } | { raw: Record<string, unknown> };

const fileOf = (g: Generator) => g.file ?? g.name;

function readExisting(dir: string, name: string): string | null {
  const p = path.join(dir, name);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

/** Every id authored YAML (and authored fact files) mention: extends, goal, list items, requires, params. */
export function authoredReferences(root: string = KNOWLEDGE): Map<string, string> {
  const src = loadSource(root);
  const refs = new Map<string, string>();
  const walk = (v: unknown, where: string) => {
    if (typeof v === 'string') {
      const id = v.split('#')[0] as string;
      if (ENTRY_ID_RE.test(id) || FACT_ID_RE.test(id)) if (!refs.has(id)) refs.set(id, where);
    } else if (Array.isArray(v)) for (const x of v) walk(x, where);
    else if (v && typeof v === 'object')
      for (const [k, x] of Object.entries(v)) if (k !== 'id') walk(x, where);
  };
  for (const a of src.authored) walk(a.value, `${a.file}:${a.lineOf()} ${a.value.id}`);
  for (const f of src.facts) if (f.value.origin === 'authored') walk(f.value.rows, `${f.file} ${f.value.id}`);
  return refs;
}

function validate(g: Generator, out: { entries?: unknown[]; facts?: unknown[] }) {
  const entries: GeneratedEntryT[] = [];
  const facts: FactTableT[] = [];
  for (const e of out.entries ?? []) {
    const r = GeneratedEntry.safeParse(e);
    if (!r.success)
      throw new Error(
        `${g.name}: invalid entry ${(e as { id?: string }).id ?? '?'}: ${r.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.')} ${i.message}`)
          .join('; ')}`,
      );
    if (r.data.system !== g.system)
      throw new Error(`${g.name}: entry ${r.data.id} is not in system ${g.system}`);
    entries.push(r.data);
  }
  for (const f of out.facts ?? []) {
    const r = FactTable.safeParse(f);
    if (!r.success)
      throw new Error(
        `${g.name}: invalid fact table ${(f as { id?: string }).id ?? '?'}: ${r.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.')} ${i.message}`)
          .join('; ')}`,
      );
    facts.push(r.data);
  }
  const ids = [...entries.map((e) => e.id), ...facts.map((f) => f.id)];
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) throw new Error(`${g.name}: slug collision on ${dup}`);
  entries.sort((a, b) => (a.id < b.id ? -1 : 1));
  facts.sort((a, b) => (a.id < b.id ? -1 : 1));
  return { entries, facts };
}

/** Runs one generator against the pinned data. Throws on any failure (the caller holds). */
export async function runGenerator(
  g: Generator,
  ctx: { pin: UpstreamPin; patchNotes: GeneratorInput['patchNotes'] },
): Promise<Output> {
  const { data } = loadGameData();
  const constants = g.constants ? await loadConstants(g.constants, ctx.pin) : {};
  const input: GeneratorInput = {
    data: declaredData(data, g.inputs, g.name),
    constants,
    pin: ctx.pin,
    patchNotes: ctx.patchNotes,
  };
  const out = g.run(input);
  if (g.raw) return { raw: out as Record<string, unknown> };
  return validate(g, out as { entries?: unknown[]; facts?: unknown[] });
}

function render(g: Generator, out: Output, files: Map<string, string>) {
  const stem = fileOf(g);
  if ('raw' in out) {
    files.set(`_${stem.replace(/^_/, '')}.json`, stableJson(out.raw));
    return;
  }
  if (out.entries.length > 0)
    files.set(`${stem}.json`, stableJson({ system: g.system, generator: g.name, entries: out.entries }));
  if (out.facts.length > 0)
    files.set(`${stem}.facts.json`, stableJson({ system: g.system, generator: g.name, facts: out.facts }));
}

const idsIn = (content: string | null, key: 'entries' | 'facts'): string[] =>
  content ? ((JSON.parse(content) as Record<string, { id: string }[]>)[key] ?? []).map((e) => e.id) : [];

/**
 * Regenerates everything into memory. A generator that throws keeps its committed files and records a
 * hold; one that drops ids authored YAML still references keeps those entries and records a hold for them.
 */
export async function generateAll(
  opts: { root?: string; only?: string[]; generators?: readonly Generator[] } = {},
): Promise<GeneratedFiles> {
  const root = opts.root ?? KNOWLEDGE;
  const dir = layoutOf(root).generatedDir;
  const pin = readPin();
  const generators = (opts.generators ?? (await discoverGenerators())).filter(
    (g) => !opts.only || opts.only.includes(g.name),
  );
  const refs = authoredReferences(root);
  const previousHolds = (JSON.parse(readExisting(dir, '_held.json') ?? '{"holds":[]}') as { holds: Hold[] })
    .holds;
  let patchNotes: GeneratorInput['patchNotes'] = [];
  const errors: string[] = [];
  try {
    patchNotes = await loadPatchNotes(pin);
  } catch (e) {
    errors.push(`patch notes unavailable: ${(e as Error).message}`);
  }
  const files = new Map<string, string>();
  const held: Hold[] = [];
  const summary: string[] = [];

  const holdFor = (g: Generator, ids: string[], reason: string): Hold => {
    const prev = previousHolds.find((h) => h.generator === g.name);
    return {
      generator: g.name,
      ids: [...new Set([...(prev?.ids ?? []), ...ids])].sort(),
      reason,
      issue: prev?.issue ?? '',
      since: prev?.since ?? pin.commit,
      lastCommit: pin.commit,
      // A hold counts the parser syncs it has lived through; CI fails past 2 (TR-10).
      syncs: prev ? prev.syncs + (prev.lastCommit === pin.commit ? 0 : 1) : 0,
    };
  };

  for (const g of generators) {
    const stem = fileOf(g);
    const committed = {
      entries: readExisting(dir, `${stem}.json`),
      facts: readExisting(dir, `${stem}.facts.json`),
    };
    let out: Output;
    try {
      out = await runGenerator(g, { pin, patchNotes });
    } catch (e) {
      const reason = (e as Error).message;
      const ids = [...idsIn(committed.entries, 'entries'), ...idsIn(committed.facts, 'facts')];
      if (committed.entries === null && committed.facts === null && !g.raw) {
        errors.push(`${g.name}: failed with no last good output to hold: ${reason}`);
        continue;
      }
      held.push(holdFor(g, ids, reason));
      if (committed.entries !== null) files.set(`${stem}.json`, committed.entries);
      if (committed.facts !== null) files.set(`${stem}.facts.json`, committed.facts);
      const rawFile = readExisting(dir, `_${stem.replace(/^_/, '')}.json`);
      if (g.raw && rawFile !== null) files.set(`_${stem.replace(/^_/, '')}.json`, rawFile);
      summary.push(`${g.name}: HELD (${reason})`);
      continue;
    }
    if (!('raw' in out)) {
      // Keep any id authored YAML references that the new data no longer produces (FR-18).
      const newIds = new Set([...out.entries.map((e) => e.id), ...out.facts.map((f) => f.id)]);
      const prevEntries = committed.entries
        ? (JSON.parse(committed.entries) as { entries: GeneratedEntryT[] }).entries
        : [];
      const prevFacts = committed.facts ? (JSON.parse(committed.facts) as { facts: FactTableT[] }).facts : [];
      const dropped = [...prevEntries, ...prevFacts].filter((e) => !newIds.has(e.id) && refs.has(e.id));
      if (dropped.length > 0) {
        out.entries.push(...(prevEntries.filter((e) => dropped.includes(e)) as GeneratedEntryT[]));
        out.facts.push(...(prevFacts.filter((f) => dropped.includes(f)) as FactTableT[]));
        out.entries.sort((a, b) => (a.id < b.id ? -1 : 1));
        out.facts.sort((a, b) => (a.id < b.id ? -1 : 1));
        held.push(
          holdFor(
            g,
            dropped.map((d) => d.id),
            `dropped ids still referenced by authored entries: ${dropped.map((d) => `${d.id} (${refs.get(d.id)})`).join(', ')}`,
          ),
        );
      }
      summary.push(`${g.name}: ${out.entries.length} entries, ${out.facts.length} fact tables`);
    } else summary.push(`${g.name}: ${Object.keys(out.raw).length} tables (validation only)`);
    render(g, out, files);
  }
  files.set('_held.json', stableJson({ holds: held.sort((a, b) => a.generator.localeCompare(b.generator)) }));
  return { files, held, errors, summary };
}

/** Writes the regenerated files, removing stale generated files that no generator produced. */
export function writeGenerated(result: GeneratedFiles, dir: string = GENERATED_DIR, prune = true) {
  mkdirSync(dir, { recursive: true });
  if (prune) {
    const existing = existsSync(dir) ? readdirSync(dir) : [];
    for (const f of existing) if (f.endsWith('.json') && !result.files.has(f)) rmSync(path.join(dir, f));
  }
  for (const [name, content] of result.files) writeFileSync(path.join(dir, name), content);
}

export interface CheckResult {
  ok: boolean;
  problems: string[];
}

/** `kb generate --check` (FR-15): regenerate in memory and diff against the committed files. */
export async function checkGenerated(root: string = KNOWLEDGE): Promise<CheckResult> {
  const dir = layoutOf(root).generatedDir;
  const result = await generateAll({ root });
  const problems = [...result.errors];
  const committed = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
  for (const [name, content] of result.files) {
    const old = readExisting(dir, name);
    if (old !== content)
      problems.push(`${rel(path.join(dir, name))}: ${old === null ? 'missing' : 'out of date'}`);
  }
  for (const f of committed)
    if (!result.files.has(f)) problems.push(`${rel(path.join(dir, f))}: no generator produces it`);
  for (const h of result.held)
    if (h.syncs > 2)
      problems.push(`hold on ${h.generator} is older than 2 syncs (since ${h.since.slice(0, 7)}): fix it`);
  const scrub = await writeScrubInputs({ check: true });
  problems.push(...scrub.problems);
  if (problems.length > 0) problems.push('generated facts are out of date; run `pnpm kb generate`');
  return { ok: problems.length === 0, problems };
}

// ---- the fact diff (FR-18) ----

type Flat = Map<string, string | number | boolean | null>;
function flatten(v: unknown, prefix = '', out: Flat = new Map()): Flat {
  if (Array.isArray(v)) for (const [i, x] of v.entries()) flatten(x, `${prefix}[${i}]`, out);
  else if (v && typeof v === 'object')
    for (const [k, x] of Object.entries(v)) flatten(x, prefix ? `${prefix}.${k}` : k, out);
  else out.set(prefix, v as string | number | boolean | null);
  return out;
}

const PROVENANCE = /^(sources|generatedBy)\b/;

export interface FactDiff {
  added: string[];
  removed: string[];
  /** "milestones[1].at: 100000 → 120000" -> ids */
  changes: Map<string, string[]>;
  renames: string[];
}

/** The fact diff between two sets of generated files (old committed vs new). */
export function factDiff(oldFiles: Map<string, string>, newFiles: Map<string, string>): FactDiff {
  const items = (files: Map<string, string>) => {
    const m = new Map<string, { title: string; flat: Flat }>();
    for (const [name, content] of files) {
      if (name.startsWith('_')) continue;
      const json = JSON.parse(content) as {
        entries?: { id: string; title: string }[];
        facts?: { id: string; title: string }[];
      };
      for (const e of [...(json.entries ?? []), ...(json.facts ?? [])])
        m.set(e.id, { title: e.title, flat: flatten(e) });
    }
    return m;
  };
  const a = items(oldFiles);
  const b = items(newFiles);
  const diff: FactDiff = { added: [], removed: [], changes: new Map(), renames: [] };
  for (const id of b.keys()) if (!a.has(id)) diff.added.push(id);
  for (const id of a.keys()) if (!b.has(id)) diff.removed.push(id);
  for (const [id, x] of a) {
    const y = b.get(id);
    if (!y) continue;
    for (const key of new Set([...x.flat.keys(), ...y.flat.keys()])) {
      if (PROVENANCE.test(key)) continue;
      const ov = x.flat.get(key);
      const nv = y.flat.get(key);
      if (ov !== nv) {
        const line = `${key}, ${JSON.stringify(ov ?? null)} → ${JSON.stringify(nv ?? null)}`;
        diff.changes.set(line, [...(diff.changes.get(line) ?? []), id]);
      }
    }
  }
  for (const r of diff.removed) {
    const t = a.get(r)?.title;
    const match = diff.added.find((n) => b.get(n)?.title === t);
    if (match) diff.renames.push(`possible rename: ${r} → ${match}`);
  }
  diff.added.sort();
  diff.removed.sort();
  return diff;
}

/** The Markdown block for the sync PR body: added, removed, grouped changes, renames, held facts. */
export function formatFactDiff(d: FactDiff, held: readonly Hold[] = []): string {
  const lines: string[] = ['## Fact diff', ''];
  if (d.added.length + d.removed.length + d.changes.size === 0) lines.push('No generated fact changed.');
  const some = (ids: string[]) =>
    ids.length > 30 ? `${ids.slice(0, 30).join(', ')} and ${ids.length - 30} more` : ids.join(', ');
  if (d.added.length) lines.push(`Added (${d.added.length}): ${some(d.added)}`);
  if (d.removed.length) lines.push(`Removed (${d.removed.length}): ${some(d.removed)}`);
  for (const [change, ids] of [...d.changes].sort(([x], [y]) => x.localeCompare(y)))
    lines.push(ids.length > 1 ? `- ${ids.length} entries: ${change}` : `- ${ids[0]}: ${change}`);
  for (const r of d.renames) lines.push(`- ${r}`);
  if (held.length) {
    lines.push('', '## Held facts', '');
    for (const h of held)
      lines.push(`- ${h.generator}: ${h.ids.length} ids held since ${h.since.slice(0, 7)}: ${h.reason}`);
  }
  return `${lines.join('\n')}\n`;
}

/** The committed generated files, for diffing. */
export function committedGenerated(dir: string = GENERATED_DIR): Map<string, string> {
  const m = new Map<string, string>();
  if (!existsSync(dir)) return m;
  for (const f of readdirSync(dir).filter((n: string) => n.endsWith('.json')))
    m.set(f, readFileSync(path.join(dir, f), 'utf8'));
  return m;
}
