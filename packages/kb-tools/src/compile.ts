// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `kb compile` (M11 TR-7): validated source -> dist/knowledge.json. Deterministic: sorted keys, no
// timestamp other than the version. Retired entries are dropped (kept in `retired`), includes,
// `extends` and `goalFamily` are resolved, and only what a shipped entry or Detector references ships.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  type CompiledKnowledge,
  type CompiledListItem,
  type CompiledPriorityList,
  canonicalJson,
  ENTRY_TYPES,
  type Entry,
  type EntryTypeName,
  FACT_ID_RE,
  type FactTableT,
  isStale,
  knowledgeVersion,
  playerVisible,
  type StageId,
} from '@idleon-forge/knowledge';
import { detectorRefsOf } from './check';
import { detectorFiles, discoverDetectors, type Registries } from './discover';
import type { KbSource } from './load';
import { DETECTORS_DIR, DIST, ENGINE_DETECTORS_DIR, KNOWLEDGE, REPO, readPin } from './paths';

export const hash8 = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 8);

const isGenerated = (e: Entry) => 'origin' in e && e.origin === 'generated';

/** Git metadata for the version (TR-13), or null outside git or in a shallow clone (PR CI). */
export function gitVersionInfo(
  dir: string = KNOWLEDGE,
): { newestCommitDate: string; ordinal: number } | null {
  try {
    const git = (...args: string[]) =>
      execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (git('rev-parse', '--is-shallow-repository') === 'true') return null;
    // First-parent main history, like the build stamp (packages/release knowledgeVersion), so the footer,
    // Suggest and Report all show one Knowledge Base version (release 3 QA P2-1).
    const dates = git('log', '--first-parent', '--format=%cI', '--', path.relative(REPO, dir))
      .split('\n')
      .filter(Boolean);
    if (dates.length === 0) return null;
    const day = (iso: string) => new Date(iso).toISOString().slice(0, 10);
    const newest = dates[0] as string;
    return { newestCommitDate: newest, ordinal: dates.filter((d) => day(d) === day(newest)).length };
  } catch {
    return null;
  }
}

/** String ids a Detector's source mentions (`'upgrade-vault.fact.kill-slots'`): the facts it reads through ctx.facts. */
function idsInDetectorSources(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const dir of [DETECTORS_DIR, ENGINE_DETECTORS_DIR])
    for (const f of detectorFiles(dir)) {
      const text = readFileSync(path.join(dir, f), 'utf8');
      const ids = [
        ...text.matchAll(/['"`]([a-z0-9-]+\.(?:fact|goal|acquisition|check|contribution)\.[a-z0-9-]+)['"`]/g),
      ].map((m) => m[1] as string);
      out.set(f.replace(/^\.\//, '').replace(/\.ts$/, ''), ids);
    }
  return out;
}

export interface CompileOptions {
  /** Use git metadata for the date version (deploy build). Default: when available and not shallow. */
  git?: { newestCommitDate: string; ordinal: number } | null;
}

/** Builds the compiled bundle from a source that passed `kb check`. */
export async function compile(
  src: KbSource,
  opts: CompileOptions = {},
  registries?: Registries,
): Promise<CompiledKnowledge> {
  const regs = registries ?? (await discoverDetectors());
  const pin = readPin();
  const all = [...src.authored.map((a) => a.value), ...src.generated.map((g) => g.value)] as Entry[];
  const byId = new Map(all.map((e) => [e.id, e]));
  const factsById = new Map(src.facts.map((f) => [f.value.id, f.value]));

  // goalFamily -> one concrete Contribution per generated Goal in the family.
  const expanded: Entry[] = [];
  for (const e of src.authored.map((a) => a.value) as Entry[]) {
    if (e.type === 'contribution' && e.goalFamily) {
      const fam = e.goalFamily;
      const [sys, , slug] = e.id.split('.');
      for (const g of all
        .filter((x) => x.type === 'goal' && isGenerated(x) && (x.id === fam || x.id.startsWith(`${fam}-`)))
        .sort((a, b) => (a.id < b.id ? -1 : 1))) {
        const goalSlug = g.id.split('.')[2] as string;
        const { goalFamily: _f, ...rest } = e;
        expanded.push({ ...rest, id: `${sys}.contribution.${slug}-${goalSlug}`, goal: g.id } as Entry);
      }
    } else expanded.push(e);
  }

  const shippedAuthored = expanded.filter((e) => e.status !== 'retired');
  // Reachability: authored entries ship; generated entries and fact tables ship when referenced.
  const shipped = new Map<string, Entry>();
  const shippedFacts = new Map<string, FactTableT>();
  const detectorIds = idsInDetectorSources();
  const queue: string[] = [];
  const visit = (v: unknown) => {
    if (typeof v === 'string') {
      const id = v.split('#')[0] as string;
      if (byId.has(id) || factsById.has(id)) queue.push(id);
    } else if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === 'object')
      for (const [k, x] of Object.entries(v)) if (k !== 'id' && k !== 'sources') visit(x);
  };
  for (const e of shippedAuthored) {
    shipped.set(e.id, e);
    visit(e);
    for (const r of detectorRefsOf(e)) for (const id of detectorIds.get(r.id) ?? []) queue.push(id);
  }
  // M17 FR-34: how each System opens ships with the registry (and the level facts its rows name).
  for (const s of src.systems) if (s.value.unlockFact) queue.push(s.value.unlockFact);
  while (queue.length) {
    const id = queue.pop() as string;
    if (shipped.has(id) || shippedFacts.has(id)) continue;
    const e = byId.get(id);
    if (e) {
      if (e.status === 'retired') continue;
      shipped.set(id, e);
      visit(e);
      for (const r of detectorRefsOf(e)) for (const x of detectorIds.get(r.id) ?? []) queue.push(x);
      continue;
    }
    const f = factsById.get(id);
    if (f) {
      shippedFacts.set(id, f);
      visit(f.rows);
    }
  }
  // Facts mentioned by System unlock Detectors' sources ship too.
  for (const s of src.systems)
    if (s.value.unlocked !== 'always')
      for (const id of detectorIds.get(s.value.unlocked.id) ?? [])
        if (factsById.has(id)) shippedFacts.set(id, factsById.get(id) as FactTableT);

  // Inline a generated parent's ladder into Goals that extend it, and derive affectsVerdict.
  const entries: Record<string, Entry> = {};
  for (const [id, e] of [...shipped].sort(([a], [b]) => (a < b ? -1 : 1))) {
    let out = e;
    if (e.type === 'goal' && e.extends) {
      const parent = byId.get(e.extends);
      if (parent?.type === 'goal') out = { ...e, milestones: parent.milestones };
    }
    if (e.type === 'check') out = { ...out, affectsVerdict: e.effect === 'blocker' } as Entry;
    entries[id] = out;
  }

  // Lists with includes expanded: an include is ONE position, a tie of all the block's items.
  const lists: Record<string, CompiledPriorityList> = {};
  const flatten = (id: string, seen: string[] = []): CompiledListItem[] => {
    const l = byId.get(id);
    if (l?.type !== 'priority' || seen.includes(id)) return [];
    return l.tiers.flatMap((tier) => tier.flatMap((item) => itemOf(item, id, [...seen, id])));
  };
  const itemOf = (item: unknown, listId: string, seen: string[]): CompiledListItem[] => {
    if (typeof item === 'string')
      return [{ id: item, ...(byId.get(item)?.status === 'contested' ? { contested: true } : {}) }];
    const o = item as Record<string, unknown>;
    if (typeof o.include === 'string')
      return flatten(o.include, seen).map((x) => ({ ...x, via: x.via ?? (o.include as string) }));
    if (typeof o.item === 'string')
      return [{ id: `${listId}#${o.item}`, ...(o.carryForward ? { carryForward: true } : {}) }];
    const ref = o.ref as string;
    return [
      {
        id: ref,
        ...(o.byUrgency ? { byUrgency: true } : {}),
        ...(o.carryForward ? { carryForward: true } : {}),
        ...(o.verification === 'contested' || byId.get(ref)?.status === 'contested'
          ? { contested: true }
          : {}),
      },
    ];
  };
  const priorityByStage: CompiledKnowledge['priorityByStage'] = {};
  for (const e of Object.values(entries)) {
    if (e.type !== 'priority') continue;
    lists[e.id] = {
      id: e.id,
      list: e.list,
      stage: (e.stage ?? null) as StageId | null,
      positions: e.tiers.map((tier) => tier.flatMap((item) => itemOf(item, e.id, [e.id]))),
    };
    if (e.stage && (e.list === 'goals' || e.list === 'spend' || e.list === 'leverage')) {
      const slot = priorityByStage[e.stage] ?? {};
      priorityByStage[e.stage] = slot;
      slot[e.list] = e.id;
    }
  }

  const byType = Object.fromEntries(ENTRY_TYPES.map((t) => [t, [] as string[]])) as Record<
    EntryTypeName,
    string[]
  >;
  for (const e of Object.values(entries)) byType[e.type].push(e.id);

  const manifest: Record<string, string> = {};
  for (const e of Object.values(entries)) {
    if (isGenerated(e)) continue;
    const parent =
      (e.type === 'goal' || e.type === 'acquisition') && e.extends ? byId.get(e.extends) : undefined;
    manifest[e.id] = hash8(canonicalJson(playerVisible(e, parent)));
  }
  const retired: CompiledKnowledge['retired'] = {};
  for (const e of src.authored.map((a) => a.value))
    if (e.status === 'retired')
      retired[e.id] = {
        title: e.title,
        ...(e.retired?.replacedBy ? { replacedBy: e.retired.replacedBy } : {}),
      };

  const detectorOf: Record<string, string[]> = {};
  for (const e of Object.values(entries)) {
    const ids = detectorRefsOf(e).map((r) => r.id);
    if (ids.length) detectorOf[e.id] = [...new Set(ids)].sort();
  }
  const readsOf: Record<string, string[]> = {};
  for (const reg of [regs.knowledge, regs.engine])
    for (const d of Object.values(reg)) readsOf[d.id] = [...d.reads].sort();

  const stale = Object.values(entries)
    .filter((e) => isStale(e, pin.gameVersion, src.patches))
    .map((e) => e.id)
    .sort();

  const facts = Object.fromEntries([...shippedFacts].sort(([a], [b]) => (a < b ? -1 : 1)));
  const contentHash = hash8(
    canonicalJson({ entries, facts, lists, systems: src.systems.map((s) => s.value) }),
  );
  const git = opts.git === undefined ? gitVersionInfo() : opts.git;
  return {
    version: knowledgeVersion(contentHash, git),
    builtFrom: { parserCommit: pin.commit, gameVersion: pin.gameVersion, toolboxVersion: pin.toolboxVersion },
    patches: src.patches,
    systems: src.systems.map((s) => s.value),
    entries,
    facts,
    byType,
    lists,
    priorityByStage,
    manifest,
    retired,
    detectorOf,
    readsOf,
    stale,
  };
}

export function writeCompiled(kb: CompiledKnowledge, file: string = DIST): { bytes: number } {
  mkdirSync(path.dirname(file), { recursive: true });
  const text = `${canonicalJson(kb)}\n`;
  writeFileSync(file, text);
  return { bytes: Buffer.byteLength(text) };
}

export const readCompiled = (file: string = DIST): CompiledKnowledge | null =>
  existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as CompiledKnowledge) : null;

export const isFactId = (s: string) => FACT_ID_RE.test(s);
