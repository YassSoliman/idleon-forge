// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `kb check` (M11 TR-8): the cross-entry rules that run after every file passed its schema.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  type AnyDetector,
  BUILTIN_SLOTS,
  compareGameVersions,
  DETECTOR_KIND_FOR,
  type DetectorKind,
  type DetectorRegistry,
  ENTRY_ID_RE,
  type Entry,
  FACT_ID_RE,
  type FactTableT,
  FORMAT_TYPE,
  isPlayerSource,
  parseTemplate,
  STAGES,
  type StageId,
  stagesBetween,
  TemplateError,
} from '@idleon-forge/knowledge';
import type { z } from 'zod';
import { detectorFiles, discoverDetectors, type Registries } from './discover';
import type { Issue } from './issues';
import type { KbSource, Located } from './load';
import { DETECTORS_DIR, REPO, readPin } from './paths';

type AnyEntry = Located<Entry>;

export interface CheckContext {
  src: KbSource;
  registries: Registries;
  /** The parser pin's game version ("current", TR-11). */
  gameVersion: string;
}

const isGenerated = (e: Entry) => 'origin' in e && e.origin === 'generated';

/** The slot types a Detector's slots schema declares: 'number' | 'string' per key. */
export function slotTypes(schema: z.ZodType): Record<string, 'number' | 'string'> {
  const shape = (schema as unknown as { shape?: Record<string, z.ZodType> }).shape;
  if (!shape) return {};
  const out: Record<string, 'number' | 'string'> = {};
  for (const [k, v] of Object.entries(shape)) {
    let def = (v as unknown as { _zod: { def: { type: string; innerType?: unknown; options?: unknown[] } } })
      ._zod.def;
    while ((def.type === 'optional' || def.type === 'nullable' || def.type === 'default') && def.innerType)
      def = (def.innerType as { _zod: { def: typeof def } })._zod.def;
    out[k] = def.type === 'number' || def.type === 'int' ? 'number' : 'string';
  }
  return out;
}

/** The Detector refs of an entry, with the field they sit in (for the kind table). */
export function detectorRefsOf(e: Entry): { field: string; id: string; params: Record<string, unknown> }[] {
  const out: { field: string; id: string; params: Record<string, unknown> }[] = [];
  if (e.type === 'goal') out.push({ field: 'goal.progress', ...e.progress });
  if (e.type === 'contribution') out.push({ field: 'contribution.detector', ...e.detector });
  if (e.type === 'check') out.push({ field: 'check.detector', ...e.detector });
  if (e.type === 'acquisition' && e.detector) out.push({ field: 'acquisition.detector', ...e.detector });
  if (e.type === 'metapath') {
    if (e.detector) out.push({ field: 'metapath.detector', ...e.detector });
    for (const m of e.milestones ?? []) out.push({ field: 'metapath.milestones', ...m.detector });
  }
  return out;
}

/** Every entry or fact id an entry mentions, with where. */
function referencesOf(e: Entry): { where: (string | number)[]; id: string; role: string }[] {
  const out: { where: (string | number)[]; id: string; role: string }[] = [];
  if ((e.type === 'goal' || e.type === 'acquisition') && e.extends)
    out.push({ where: ['extends'], id: e.extends, role: 'extends' });
  if ((e.type === 'contribution' || e.type === 'check') && e.goal)
    out.push({ where: ['goal'], id: e.goal, role: 'goal' });
  if (e.retired?.replacedBy)
    out.push({ where: ['retired', 'replacedBy'], id: e.retired.replacedBy, role: 'replacedBy' });
  if (e.type === 'acquisition')
    for (const [i, m] of (e.methods ?? []).entries())
      for (const [j, r] of m.requires.entries())
        if (typeof r === 'string')
          out.push({ where: ['methods', i, 'requires', j], id: r, role: 'requires' });
        else if ('ref' in r) out.push({ where: ['methods', i, 'requires', j, 'ref'], id: r.ref, role: 'requires' });
  // M14 FR-1: a Goal or Check names its Walkthrough's target Acquisition.
  if ((e.type === 'goal' || e.type === 'check') && e.walkthrough)
    out.push({ where: ['walkthrough'], id: e.walkthrough, role: 'walkthrough' });
  if (e.type === 'priority')
    for (const [i, tier] of e.tiers.entries())
      for (const [j, item] of tier.entries()) {
        const where = ['tiers', i, j];
        if (typeof item === 'string') out.push({ where, id: item, role: 'item' });
        else if ('include' in item) out.push({ where, id: item.include, role: 'include' });
        else if ('item' in item) out.push({ where, id: item.ref, role: 'spend' });
        else out.push({ where, id: item.ref, role: 'item' });
      }
  // Fact ids in values and Detector params.
  const scan = (v: unknown, where: (string | number)[]) => {
    if (typeof v === 'string' && FACT_ID_RE.test(v)) out.push({ where, id: v, role: 'fact' });
    else if (Array.isArray(v)) for (const [i, x] of v.entries()) scan(x, [...where, i]);
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) scan(x, [...where, k]);
  };
  scan(e.values, ['values']);
  for (const r of detectorRefsOf(e)) scan(r.params, [r.field.split('.')[1] ?? 'detector', 'params']);
  return out;
}

const numbersIn = (v: unknown, out: number[] = []): number[] => {
  if (typeof v === 'number') out.push(v);
  else if (typeof v === 'string')
    for (const m of v.matchAll(/(?<![\w.])\d[\d,]*(?:\.\d+)?(?![\w])/g))
      out.push(Number(m[0].replace(/,/g, '')));
  else if (Array.isArray(v)) for (const x of v) numbersIn(x, out);
  else if (v && typeof v === 'object') for (const x of Object.values(v)) numbersIn(x, out);
  return out;
};

/** Expands a Priority List's items through includes (for "at most once" and coverage). */
function expandList(
  id: string,
  lists: Map<string, Entry & { type: 'priority' }>,
  stack: string[] = [],
): { ids: string[]; cycle: string[] | null } {
  const list = lists.get(id);
  if (!list) return { ids: [], cycle: null };
  if (stack.includes(id)) return { ids: [], cycle: [...stack, id] };
  const ids: string[] = [];
  let cycle: string[] | null = null;
  for (const tier of list.tiers)
    for (const item of tier) {
      if (typeof item === 'string') ids.push(item);
      else if ('include' in item) {
        const r = expandList(item.include, lists, [...stack, id]);
        ids.push(...r.ids);
        cycle ??= r.cycle;
      } else if ('item' in item) ids.push(`${id}#${item.item}`);
      else ids.push(item.ref);
    }
  return { ids, cycle };
}

const stagesOf = (e: Entry): StageId[] =>
  e.appliesTo.stages === 'all'
    ? [...STAGES]
    : e.appliesTo.stages.flatMap((s) => (typeof s === 'string' ? [s] : stagesBetween(s.from, s.to)));

/** Runs every TR-8 rule. Returns errors and warnings; schema issues from loading are included. */
export async function checkSource(src: KbSource, registries?: Registries): Promise<Issue[]> {
  const regs = registries ?? (await discoverDetectors());
  const issues: Issue[] = [...src.issues];
  const err = (file: string, line: number, id: string | undefined, message: string, code?: string) =>
    issues.push({ level: 'error', file, line, id, message, code });
  const warn = (file: string, line: number, id: string | undefined, message: string, code?: string) =>
    issues.push({ level: 'warning', file, line, id, message, code });
  const pin = readPin();

  const all: AnyEntry[] = [...src.authored, ...src.generated] as AnyEntry[];
  const byId = new Map<string, AnyEntry>();
  for (const e of all) {
    const prev = byId.get(e.value.id);
    if (prev)
      err(e.file, e.lineOf(['id']), e.value.id, `duplicate id (also in ${prev.file}:${prev.lineOf(['id'])})`);
    else byId.set(e.value.id, e);
  }
  const facts = new Map<string, Located<FactTableT>>();
  for (const f of src.facts) {
    if (facts.has(f.value.id) || byId.has(f.value.id))
      err(f.file, f.lineOf(['id']), f.value.id, 'duplicate id');
    facts.set(f.value.id, f);
  }
  const lists = new Map(
    all
      .filter((e) => e.value.type === 'priority')
      .map((e) => [e.value.id, e.value as Entry & { type: 'priority' }]),
  );

  // ---- references (FR-5) ----
  for (const e of all) {
    for (const ref of referencesOf(e.value)) {
      const line = e.lineOf(ref.where);
      if (ref.role === 'fact') {
        if (!facts.has(ref.id) && !byId.has(ref.id))
          err(e.file, line, e.value.id, `references a missing fact table ${ref.id}`);
        continue;
      }
      const target = byId.get(ref.id)?.value;
      if (!target) {
        // A Priority List may name an entry its owner module hasn't shipped yet (M2 TR-13: M2 owns the
        // lists, M3–M9 own their entries): a warning, so the lists can land first. Anywhere else it is
        // an error.
        if (e.value.type === 'priority')
          warn(
            e.file,
            line,
            e.value.id,
            `references ${ref.id}, not in the Knowledge Base yet`,
            'pending-entry',
          );
        else err(e.file, line, e.value.id, `references a missing entry ${ref.id}`);
        continue;
      }
      const t = target.type;
      const bad = (what: string) => err(e.file, line, e.value.id, `${ref.role} ${ref.id} must be ${what}`);
      if (ref.role === 'extends' && (!isGenerated(target) || t !== e.value.type))
        bad(`a generated ${e.value.type}`);
      if (ref.role === 'goal' && t !== 'goal') bad('a Goal');
      if (ref.role === 'walkthrough' && t !== 'acquisition') bad('an Acquisition');
      if (ref.role === 'replacedBy' && target.status === 'retired') bad('a non-retired entry');
      if (ref.role === 'include' && !(t === 'priority' && target.list === 'block'))
        bad("a Priority List with list: 'block'");
      if (ref.role === 'spend') {
        if (!(t === 'acquisition' && isGenerated(target))) bad('a generated Acquisition');
        if (e.value.type === 'priority' && e.value.list !== 'spend')
          err(e.file, line, e.value.id, "spend items appear only in list: 'spend'");
      }
      if (ref.role === 'item' && e.value.type === 'priority') {
        if (target.status === 'retired')
          err(e.file, line, e.value.id, `a Priority List cannot reference retired ${ref.id}`);
        const allowed =
          e.value.list === 'order' ? t !== 'priority' : t === 'goal' || t === 'check' || t === 'acquisition';
        if (!allowed)
          bad(e.value.list === 'order' ? 'an entry (not a list)' : 'a Goal, Check or Acquisition');
      }
    }
    // goalFamily resolves to at least one generated Goal
    if (e.value.type === 'contribution' && e.value.goalFamily) {
      const fam = e.value.goalFamily;
      if (
        !src.generated.some(
          (g) => g.value.type === 'goal' && (g.value.id === fam || g.value.id.startsWith(`${fam}-`)),
        )
      )
        err(e.file, e.lineOf(['goalFamily']), e.value.id, `goalFamily ${fam} matches no generated Goal`);
    }
  }

  // ---- Priority Lists: cycles, at most once, spend item slugs, byUrgency placement ----
  for (const [id, list] of lists) {
    const located = byId.get(id) as AnyEntry;
    const { ids, cycle } = expandList(id, lists);
    if (cycle) err(located.file, located.lineOf(['tiers']), id, `include cycle: ${cycle.join(' -> ')}`);
    const seen = new Set<string>();
    for (const x of ids) {
      if (seen.has(x))
        err(located.file, located.lineOf(['tiers']), id, `${x} appears more than once after includes`);
      seen.add(x);
    }
    const slugs = new Set<string>();
    for (const [i, tier] of list.tiers.entries())
      for (const [j, item] of tier.entries()) {
        if (typeof item === 'object' && 'item' in item) {
          if (slugs.has(item.item))
            err(
              located.file,
              located.lineOf(['tiers', i, j]),
              id,
              `spend item ${item.item} is not unique in its list`,
            );
          slugs.add(item.item);
        }
        if (
          typeof item === 'object' &&
          'ref' in item &&
          !('item' in item) &&
          item.byUrgency &&
          id !== 'metapath.priority.never-skip'
        )
          err(
            located.file,
            located.lineOf(['tiers', i, j]),
            id,
            'byUrgency is allowed only inside metapath.priority.never-skip',
          );
      }
  }

  // ---- Stage coverage warnings (TR-8) ----
  const goalsByStage = new Map<string, string>();
  for (const [id, l] of lists) if (l.list === 'goals' && l.stage) goalsByStage.set(l.stage, id);
  if (lists.size > 0 || src.authored.length > 0) {
    for (const s of STAGES)
      if (!goalsByStage.has(s))
        warn(
          'packages/knowledge/systems',
          1,
          undefined,
          `Stage ${s} has no goals Priority List yet`,
          'stage-without-list',
        );
    for (const e of src.authored) {
      const v = e.value;
      if (v.type === 'priority' || v.status === 'retired' || (v.type === 'check' && v.effect === 'blocker'))
        continue;
      if (v.type !== 'goal' && v.type !== 'check' && v.type !== 'acquisition') continue;
      for (const s of stagesOf(v)) {
        const listId = goalsByStage.get(s);
        if (!listId) continue;
        const ids = new Set(expandList(listId, lists).ids);
        const carried = [...lists.values()].some((l) =>
          l.tiers.some((t) =>
            t.some((it) => typeof it === 'object' && 'ref' in it && it.ref === v.id && it.carryForward),
          ),
        );
        if (!ids.has(v.id) && !carried)
          warn(
            e.file,
            e.lineOf(['appliesTo']),
            v.id,
            `appliesTo names ${s}, whose list ${listId} doesn't reference it`,
            'applies-without-list',
          );
      }
    }
  }

  // ---- Detectors (FR-9, FR-10) and template slots (TR-6) ----
  const referenced = new Set<string>();
  const pending = new Map<string, number>();
  const find = (id: string): AnyDetector | undefined => regs.knowledge[id] ?? regs.engine[id];
  const paramsSeen = new Map<string, string>();
  for (const e of all) {
    const v = e.value;
    const refs = detectorRefsOf(v);
    for (const r of refs) {
      referenced.add(r.id);
      const d = find(r.id);
      const where =
        r.field === 'goal.progress'
          ? ['progress']
          : r.field === 'metapath.milestones'
            ? ['milestones']
            : ['detector'];
      if (!d) {
        if (isGenerated(v)) pending.set(r.id, (pending.get(r.id) ?? 0) + 1);
        else err(e.file, e.lineOf(where), v.id, `detector ${r.id} is not registered`);
        continue;
      }
      const kinds = DETECTOR_KIND_FOR[r.field] ?? [];
      if (!kinds.includes(d.kind as DetectorKind))
        err(
          e.file,
          e.lineOf(where),
          v.id,
          `detector ${r.id} is a ${d.kind} Detector; ${r.field} needs ${kinds.join(' or ')}`,
        );
      const p = d.params.safeParse(r.params ?? {});
      if (!p.success)
        err(
          e.file,
          e.lineOf([...where, 'params']),
          v.id,
          `params for ${r.id}: ${p.error.issues[0]?.message}`,
        );
      if (v.type === 'check') {
        const key = `${r.id}|${JSON.stringify(r.params ?? {})}`;
        const other = paramsSeen.get(key);
        if (other)
          warn(
            e.file,
            e.lineOf(where),
            v.id,
            `shares detector ${r.id} with equal params with ${other}`,
            'duplicate-check',
          );
        paramsSeen.set(key, v.id);
      }
    }
    // Template slots: finding slots, built-ins, values, extended facts.
    const main = refs[0] ? find(refs[0].id) : undefined;
    const available: Record<string, 'number' | 'string'> = { ...BUILTIN_SLOTS };
    if (main) Object.assign(available, slotTypes(main.slots));
    for (const [k, x] of Object.entries(v.values)) available[k] = typeof x === 'number' ? 'number' : 'string';
    if ((v.type === 'goal' || v.type === 'acquisition') && v.extends) {
      const parent = byId.get(v.extends)?.value;
      for (const [k, x] of Object.entries(parent?.values ?? {}))
        available[k] ??= typeof x === 'number' ? 'number' : 'string';
    }
    const slotCheckable = !refs.length || !!main || !isGenerated(v);
    const templates: [string[], string][] = [
      [['text'], v.text],
      [['why'], v.why],
    ];
    if (v.type === 'contribution' && v.stopHere) templates.push([['stopHere'], v.stopHere]);
    for (const [where, t] of templates) {
      try {
        for (const part of parseTemplate(t)) {
          if (!slotCheckable) continue;
          const type = available[part.slot];
          if (!type)
            err(
              e.file,
              e.lineOf(where),
              v.id,
              `template slot {${part.slot}} is not provided by the Detector, built-ins or values`,
            );
          else if (part.format && FORMAT_TYPE[part.format] !== type)
            err(
              e.file,
              e.lineOf(where),
              v.id,
              `{${part.slot}:${part.format}} needs a ${FORMAT_TYPE[part.format]} slot; ${part.slot} is a ${type}`,
            );
        }
      } catch (x) {
        if (x instanceof TemplateError) err(e.file, e.lineOf(where), v.id, x.message);
        else throw x;
      }
    }
    if (v.type === 'metapath')
      v.milestones?.forEach((m, i) => {
        const d = find(m.detector.id);
        if (d && d.kind !== 'milestone')
          err(
            e.file,
            e.lineOf(['milestones', i, 'detector']),
            v.id,
            `milestone ${m.id} needs a milestone Detector`,
          );
      });
  }
  for (const s of src.systems)
    if (s.value.unlocked !== 'always') {
      const id = s.value.unlocked.id;
      referenced.add(id);
      const d = find(id);
      if (!d) err(s.file, s.lineOf(['unlocked']), s.value.id, `detector ${id} is not registered`);
      else if (d.kind !== 'milestone')
        err(
          s.file,
          s.lineOf(['unlocked']),
          s.value.id,
          `unlocked needs a milestone Detector; ${id} is ${d.kind}`,
        );
      else {
        const p = d.params.safeParse(s.value.unlocked.params ?? {});
        if (!p.success)
          err(
            s.file,
            s.lineOf(['unlocked', 'params']),
            s.value.id,
            `params for ${id}: ${p.error.issues[0]?.message}`,
          );
      }
    }
  for (const [id, n] of pending)
    warn(
      'packages/knowledge/generated',
      1,
      undefined,
      `${n} generated entries use detector ${id}, not registered yet (its owner module adds it)`,
      'pending-detector',
    );
  for (const reg of [regs.knowledge, regs.engine])
    for (const id of Object.keys(reg))
      if (!referenced.has(id))
        err(
          `packages/knowledge/detectors/${id}.ts`,
          1,
          undefined,
          `detector ${id} is not referenced by any entry (orphan)`,
        );

  // ---- lookups (class, talent, map, monster, item rawNames) ----
  const L = src.lookups;
  if (L) {
    const classes = new Set(L.classes);
    const has = (table: string, x: string) => (L[table] as string[] | undefined)?.includes(x) ?? true;
    for (const e of src.authored) {
      const v = e.value;
      v.appliesTo.classes?.forEach((c, i) => {
        if (!classes.has(c)) err(e.file, e.lineOf(['appliesTo', 'classes', i]), v.id, `unknown class ${c}`);
      });
      if (v.type === 'build') {
        if (!classes.has(v.classLine))
          err(e.file, e.lineOf(['classLine']), v.id, `unknown class ${v.classLine}`);
        const line = new Set(
          [v.classLine, ...(L.classTree[v.classLine] ?? [])].flatMap((c) => L.talentsByClass[c] ?? []),
        );
        for (const [i, t] of v.tabs.entries())
          for (const [j, s] of t.steps.entries())
            if (!line.has(s.talent))
              err(
                e.file,
                e.lineOf(['tabs', i, 'steps', j, 'talent']),
                v.id,
                `talent ${s.talent} is not on a ${v.classLine} talent tab`,
              );
      }
      if (v.type === 'metapath') {
        for (const [i, sl] of (v.slots ?? []).entries())
          if (!classes.has(sl.classLine))
            err(e.file, e.lineOf(['slots', i, 'classLine']), v.id, `unknown class ${sl.classLine}`);
        for (const [i, r] of (v.roles ?? []).entries())
          if (!classes.has(r.classLine))
            err(e.file, e.lineOf(['roles', i, 'classLine']), v.id, `unknown class ${r.classLine}`);
      }
      if (v.type === 'contribution') {
        if (v.activity.map && !has('maps', v.activity.map))
          err(e.file, e.lineOf(['activity', 'map']), v.id, `unknown map ${v.activity.map}`);
        if (v.activity.target && !has('monsters', v.activity.target) && !has('items', v.activity.target))
          err(e.file, e.lineOf(['activity', 'target']), v.id, `unknown target ${v.activity.target}`);
      }
      if (v.type === 'acquisition') {
        const t = v.thing.rawName;
        if (
          !has('items', t) &&
          !has('cards', t) &&
          !has('talents', t) &&
          !has('classes', t) &&
          !has('stamps', t) &&
          v.thing.kind !== 'other' &&
          v.thing.kind !== 'building'
        )
          err(e.file, e.lineOf(['thing', 'rawName']), v.id, `unknown ${v.thing.kind} ${t}`);
      }
    }
  }

  // ---- hand-copied facts (FR-17) ----
  const factNumbers = (ids: string[]) => {
    const nums = new Set<number>();
    for (const id of ids) {
      const target = byId.get(id)?.value ?? facts.get(id)?.value;
      if (!target) continue;
      const data = 'rows' in target ? target.rows : target;
      for (const n of numbersIn(data)) nums.add(n);
    }
    return nums;
  };
  for (const e of src.authored) {
    const v = e.value;
    const refIds = referencesOf(v)
      .filter((r) => r.role === 'extends' || r.role === 'fact' || r.role === 'goal' || r.role === 'spend')
      .map((r) => r.id);
    const known = factNumbers(refIds);
    const scanned: [(string | number)[], unknown][] = [
      [['text'], v.text],
      [['why'], v.why],
      [['values'], v.values],
      ...detectorRefsOf(v).map(
        (r) => [[r.field.split('.')[1] ?? 'detector', 'params'], r.params] as [(string | number)[], unknown],
      ),
    ];
    if (v.type === 'goal' && v.milestones) scanned.push([['milestones'], v.milestones.map((m) => m.at)]);
    for (const [where, value] of scanned)
      for (const n of numbersIn(value)) {
        if (n === 0 || n === 1 || n === 2 || !Number.isFinite(n)) continue;
        if (known.has(n))
          err(e.file, e.lineOf(where), v.id, `hand-copied fact ${n}; use a slot`, 'hand-copied-fact');
        else if (Math.abs(n) >= 100)
          warn(
            e.file,
            e.lineOf(where),
            v.id,
            `numeric literal ${n}: confirm it is judgment, not a game fact`,
            'literal-3-digits',
          );
      }
  }
  // Detector code: numeric literals of 2+ digits outside params defaults and examples (warning).
  for (const f of detectorFiles(DETECTORS_DIR)) {
    const file = path.join(DETECTORS_DIR, f);
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '').replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '');
      if (/\b(?:default|min|max|int|examples|fixture|index|subject)\b/.test(code)) return;
      for (const m of code.matchAll(/(?<![\w.])(\d{2,}(?:_\d+)*)(?![\w])/g))
        warn(
          path.relative(REPO, file),
          i + 1,
          undefined,
          `numeric literal ${m[1]} in a Detector: thresholds belong in params`,
          'detector-literal',
        );
    });
  }

  // ---- Player-facing Sources (#74): a warning, so a module can land and backfill ----
  for (const e of src.authored)
    if (!e.value.sources.some(isPlayerSource))
      warn(
        e.file,
        e.lineOf(['sources']),
        e.value.id,
        'no tier 2–4 Source a player can read (the IdleOn Wiki, a dated guide or thread, patch notes); the Now screen shows no link',
        'no-player-source',
      );

  // ---- Source game versions (TR-11): never newer than the pin ----
  for (const e of src.authored) {
    const sources = [...e.value.sources, ...(e.value.contested?.sides.flatMap((s) => s.sources) ?? [])];
    for (const s of sources)
      if (compareGameVersions(s.gameVersion, pin.gameVersion) > 0)
        err(
          e.file,
          e.lineOf(['sources']),
          e.value.id,
          `Source game version ${s.gameVersion} is newer than the parser pin ${pin.gameVersion}`,
        );
    if (e.value.stale && compareGameVersions(e.value.stale.flaggedAt, pin.gameVersion) > 0)
      err(
        e.file,
        e.lineOf(['stale']),
        e.value.id,
        `stale.flaggedAt ${e.value.stale.flaggedAt} is newer than the pin`,
      );
  }
  for (const f of src.facts)
    if (
      f.value.origin === 'authored' &&
      f.value.sources.some((s) => s.tier === 1) &&
      !f.value.sources.every((s) => s.tier === 1)
    )
      err(
        f.file,
        f.lineOf(['sources']),
        f.value.id,
        'an authored fact table cites tier 2–3 Sources with claimDate, or only Toolbox permalinks',
      );

  // ---- references from entries to fact ids in strings, and patches ----
  if (src.patches.length > 0 && !src.patches.includes(pin.gameVersion))
    err(
      'packages/knowledge/generated/_patches.json',
      1,
      undefined,
      `the pin's game version ${pin.gameVersion} is not in _patches.json`,
    );

  return issues.sort((a, b) =>
    a.level === b.level ? a.file.localeCompare(b.file) || a.line - b.line : a.level === 'error' ? -1 : 1,
  );
}

export const isEntryId = (s: string) => ENTRY_ID_RE.test(s);
export type { DetectorRegistry };
