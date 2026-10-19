// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `kb convert-drafts` (M26 FR-10): the M26 research notes (docs/research/systems/kb-drafts) become
// loadable Knowledge Base drafts, by this script only. It is re-run, never hand-patched; `--check`
// (CI, via the test) rebuilds in memory and fails on any difference.
//
// Out of one pass:
//  - systems/<system>.drafts.yaml: every new entry, validated by the real `AuthoredEntry` schema, all
//    `status: draft` (the loader takes `.drafts.yaml` files as drafts only; FR-1 keeps them out of the
//    engine until their wave promotes them);
//  - drafts/edits/<system>.yaml: changes to live entries (the patch files, the amendments and the draft
//    ids that collide with a live id), each one checked by applying it to the live entry and parsing
//    the result. They are applied by hand in the promoting PR, with its golden diff;
//  - drafts/facts/<system>.facts.yaml: draft fact tables that pass `FactTable` (not loaded; a fact
//    table ships only once a promoted entry reads it);
//  - drafts/report.json: what was converted, what was not and why, duplicates and malformed ids.
// Every change the conversion makes to a draft is listed in that entry's `notes` ("kb-convert: ...").
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { AuthoredEntry, FactTable, GAME_CLIENT_URL_RE, TIER1_URL_RE } from '@idleon-forge/knowledge';
import { parse, stringify } from 'yaml';
import { loadSource } from './load';
import { KNOWLEDGE, REPO, readPin } from './paths';

export const DRAFTS_IN = path.join(REPO, 'docs/research/systems/kb-drafts');
const RESEARCH = path.join(REPO, 'docs/research/systems');
export const DRAFTS_OUT = path.join(KNOWLEDGE, 'drafts');
const SYSTEMS = path.join(KNOWLEDGE, 'systems');
/** Where committed research is cited from (the release branch; it reaches main with the release). */
const RESEARCH_URL =
  'https://github.com/YassSoliman/idleon-forge/blob/feat/M25-release/docs/research/systems';
/** The date "edited after the patch" is measured from: the newest major patch (majors.yaml). */
const PATCH_DATE = '2026-08-26';
const VERIFIED = '2026-10-19';
const GAME_VERSION = '2.3.540';
const ID_RE = /^[a-z0-9-]+\.(check|goal|priority|contribution|build|metapath|acquisition)\.[a-z0-9-]+$/;
const FACT_RE = /^[a-z0-9-]+\.fact\.[a-z0-9-]+$/;
const CATEGORY: Record<string, 'compounding' | 'spendable' | 'nice'> = {
  unlock: 'compounding',
  unblock: 'compounding',
  milestone: 'compounding',
  'long-term': 'compounding',
  idle: 'spendable',
  wasting: 'spendable',
  waste: 'spendable',
  misplaced: 'nice',
  active: 'nice',
};

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);

export interface ConvertReport {
  inputs: { files: number; records: number };
  drafts: number;
  edits: number;
  facts: number;
  unconverted: Array<{ id: string; file: string; reasons: string[] }>;
  duplicates: string[];
  /** Records that are not KB entries: code-change notes for the engine, and draft-only types (`info`). */
  notKb: Array<{ file: string; id: string; why: string }>;
  bySystem: Record<string, number>;
}

interface Converted {
  files: Map<string, string>;
  report: ConvertReport;
}

/** The committed research note a scratchpad dossier path points at, or null. */
function researchPathOf(url: string): string | null {
  const m = /([a-z0-9-]+)\.md$/.exec(url);
  if (!m) return null;
  for (const area of readdirSync(RESEARCH, { withFileTypes: true })) {
    if (!area.isDirectory()) continue;
    if (existsSync(path.join(RESEARCH, area.name, `${m[1]}.md`))) return `${area.name}/${m[1]}.md`;
  }
  return null;
}

/** One draft Source into ADR 0004's live tiers (spec FR-2); notes for the entry are pushed to `log`. */
function convertSource(s: Dict, pin: string, log: string[]): Dict {
  const out: Dict = { ...s };
  let url = String(s.url ?? '');
  if (out.notes !== undefined) {
    log.push(`Source note: ${String(out.notes).slice(0, 160)}`);
    delete out.notes;
  }
  if (out.prePatch !== undefined) {
    log.push(`pre-patch Source: ${String(s.title ?? url).slice(0, 80)}`);
    delete out.prePatch;
  }
  for (const k of Object.keys(out))
    if (!['url', 'title', 'tier', 'verified', 'gameVersion', 'claimDate', 'note', 'verification'].includes(k))
      delete out[k];
  // Self-citations of scratchpad dossiers become the committed research note.
  if (/scratchpad|dossiers\//.test(url) || !/^https?:\/\//.test(url)) {
    const vendor = /packages\/toolbox-parsers\/vendor\/(.+)$/.exec(url);
    const research = researchPathOf(url);
    if (vendor) {
      url = `https://github.com/Morta1/IdleonToolbox/blob/${pin}/${vendor[1]}`;
      out.tier = 1;
    } else if (research) {
      url = `${RESEARCH_URL}/${research}`;
      out.tier = 4;
    } else {
      url = `${RESEARCH_URL}/MASTER.md`;
      out.tier = 4;
      log.push(`Source ${String(s.url).slice(0, 60)} had no committed copy; cited MASTER.md`);
    }
  }
  url = url.replace(/^http:\/\//, 'https://');
  out.url = url;
  const tier = Number(out.tier);
  const wiki = /^https:\/\/(www\.)?idleon\.wiki\//.test(url);
  const date = typeof out.claimDate === 'string' ? out.claimDate : out.claimDate instanceof Date ? '' : '';
  if (wiki) out.tier = date && date >= PATCH_DATE ? 2 : 4;
  else if (tier === 1 && !TIER1_URL_RE.test(url)) {
    // A game-client read is tier 1 only with its stored excerpt (FR-2b); a short or branch Toolbox link
    // is not a permalink. Both are tier 4 until fixed.
    out.tier = 4;
    log.push(
      GAME_CLIENT_URL_RE.test(url) || /legendsofidleon|N\.js/.test(url)
        ? 'game-client Source at tier 4 until its excerpt is stored (FR-2b)'
        : `tier 1 Source not a permalink at the pin, tier 4: ${url.slice(0, 80)}`,
    );
  } else if ((tier === 2 || tier === 3) && !date) out.tier = 4;
  if (out.tier === 4 && (out.claimDate === undefined || out.claimDate === '')) delete out.claimDate;
  if (typeof out.title === 'string' && out.title.length > 120) out.title = `${out.title.slice(0, 119)}…`;
  if (typeof out.note === 'string' && out.note.length > 200) out.note = `${out.note.slice(0, 199)}…`;
  if (typeof out.verified !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(out.verified)) out.verified = VERIFIED;
  if (typeof out.gameVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(out.gameVersion))
    out.gameVersion = GAME_VERSION;
  return out;
}

/** Plain-text templates: no < or >, at most 240 characters (the rest goes to notes). */
function plain(t: unknown, where: string, log: string[]): unknown {
  if (typeof t !== 'string') return t;
  let s = t
    .replace(/->/g, '→')
    .replace(/<=/g, '≤')
    .replace(/>=/g, '≥')
    .replace(/</g, 'under ')
    .replace(/>/g, 'over ');
  if (s !== t) log.push(`${where}: < and > spelled out`);
  if (s.length > 240) {
    const cut = s.slice(0, 240);
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
    const kept = end > 80 ? cut.slice(0, end + 1) : `${cut.slice(0, 239)}…`;
    log.push(`${where} cut to 240 characters; the rest: ${s.slice(kept.length).trim().slice(0, 300)}`);
    s = kept;
  }
  return s;
}

/**
 * FR-4: a typed Rift number in player text becomes the slot riftLabel() fills ("Rift {rift}"); the
 * original numbers (the game's shown ones) go to notes, for the promoting PR.
 */
function riftSlots(v: unknown, where: string, log: string[]): unknown {
  if (typeof v === 'string') {
    const found = v.match(/\bRift\s+#?\d+/gi);
    if (!found) return v;
    log.push(
      `${where}: ${found.join(', ')} -> Rift {rift} (shown numbers; the Detector fills {rift} via riftLabel())`,
    );
    return v.replace(/\bRift\s+#?\d+/gi, 'Rift {rift}');
  }
  if (Array.isArray(v)) return v.map((x, i) => riftSlots(x, `${where}.${i}`, log));
  if (isDict(v))
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [
        k,
        ['notes', 'sources', 'id'].includes(k) ? x : riftSlots(x, `${where}.${k}`, log),
      ]),
    );
  return v;
}

const yamlDate = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v);

/** Dates YAML read as Date objects back to ISO strings, everywhere. */
function undate(v: unknown): unknown {
  if (v instanceof Date) return yamlDate(v);
  if (Array.isArray(v)) return v.map(undate);
  if (isDict(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, undate(x)]));
  return v;
}

/** One draft entry into the live shape; `log` collects every change made. */
function convertEntry(raw: Dict, pin: string, log: string[]): Dict {
  const e: Dict = { ...raw };
  const type = e.type;
  for (const k of ['fromTopic', 'revision']) if (k in e) delete e[k];
  if (e.ship !== undefined) {
    log.push(`ship: ${String(e.ship)}${e.shipReason ? ` (${String(e.shipReason).slice(0, 160)})` : ''}`);
    delete e.ship;
    delete e.shipReason;
  }
  e.status = 'draft';
  if (type === 'check') {
    if ('tiers' in e) delete e.tiers;
    if (typeof e.category === 'string' && CATEGORY[e.category]) {
      log.push(`category ${e.category} -> ${CATEGORY[e.category]}`);
      e.category = CATEGORY[e.category];
    }
    if (isDict(e.doneWhen)) {
      const dw = { ...e.doneWhen };
      if (!['lower', 'higher', 'changed'].includes(String(dw.change))) {
        log.push(`doneWhen.change ${String(dw.change)} -> changed`);
        dw.change = 'changed';
      }
      for (const k of Object.keys(dw)) if (!['field', 'change'].includes(k)) delete dw[k];
      e.doneWhen = dw;
    }
  }
  if (type === 'goal') {
    if (e.scope === undefined) e.scope = e.subject === 'character' ? 'character' : 'account';
    if (e.progress === undefined && isDict(e.detector)) {
      e.progress = e.detector;
      log.push('detector -> progress');
    }
    for (const k of ['subject', 'effect', 'effortSeconds', 'priority', 'doneWhen', 'detector'])
      if (k in e) delete e[k];
    if (typeof e.category === 'string' && CATEGORY[e.category]) {
      log.push(`category ${e.category} -> ${CATEGORY[e.category]}`);
      e.category = CATEGORY[e.category];
    }
    if (e.category === undefined) {
      e.category = 'compounding';
      log.push('category defaulted to compounding');
    }
    if (e.unit === undefined) {
      e.unit = 'steps';
      log.push('unit defaulted to "steps": set the real unit at promotion');
    }
    if (Array.isArray(e.milestones))
      e.milestones = e.milestones.map((m) =>
        isDict(m) && typeof m.at === 'string' && Number.isFinite(Number(m.at))
          ? { ...m, at: Number(m.at) }
          : m,
      );
  }
  if (type === 'priority' && e.list === undefined) e.list = 'order';
  // appliesTo.stages written as one open range object.
  if (isDict(e.appliesTo)) {
    const a = { ...e.appliesTo };
    if (isDict(a.stages) && typeof a.stages.from === 'string')
      a.stages = [{ from: a.stages.from, to: (a.stages.to as string | undefined) ?? 'W4-late' }];
    if (Array.isArray(a.stages))
      a.stages = a.stages.map((x) =>
        isDict(x) && typeof x.from === 'string' && x.to === undefined ? { from: x.from, to: 'W4-late' } : x,
      );
    e.appliesTo = a;
  }
  for (const k of ['text', 'why', 'stopHere', 'groupText']) if (k in e) e[k] = plain(e[k], k, log);
  for (const k of Object.keys(e))
    if (!['id', 'notes', 'sources', 'system', 'type', 'status'].includes(k)) e[k] = riftSlots(e[k], k, log);
  if (Array.isArray(e.sources))
    e.sources = e.sources.map((s) => (isDict(s) ? convertSource(s, pin, log) : s));
  if (e.confidence === 'H' && log.some((l) => l.startsWith('game-client Source')) && !hasTier12(e)) {
    e.confidence = 'M';
    log.push('confidence H -> M: its tier 1 game-client Sources wait on their excerpts');
  }
  if (log.length) {
    const prior = typeof e.notes === 'string' ? `${e.notes} ` : '';
    const notes = `${prior}kb-convert: ${log.join('; ')}`;
    e.notes = notes.length > 1000 ? `${notes.slice(0, 999)}…` : notes;
  }
  return e;
}

const hasTier12 = (e: Dict) =>
  Array.isArray(e.sources) && e.sources.some((s) => isDict(s) && (s.tier === 1 || s.tier === 2));

/** The reasons a value fails a schema, short. */
const reasonsOf = (issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>) => [
  ...new Set(
    issues.map((i) => `${i.path.filter((p) => typeof p === 'string').join('.') || '(entry)'}: ${i.message}`),
  ),
];

interface Record_ {
  id: string;
  file: string;
  kind: 'entry' | 'fact' | 'edit';
  value: Dict;
}

/** Every record of the drafts, in file order. */
function readDrafts(): { records: Record_[]; files: number; notKb: ConvertReport['notKb'] } {
  const records: Record_[] = [];
  const notKb: ConvertReport['notKb'] = [];
  const files = readdirSync(DRAFTS_IN)
    .filter((f) => f.endsWith('.yaml'))
    .sort();
  const take = (file: string, kind: Record_['kind'], v: unknown) => {
    if (!isDict(v) || v.id === undefined) return;
    const id = String(v.id).split(' ')[0]?.replace(/,$/, '') ?? '';
    const ok = kind === 'fact' ? FACT_RE.test(id) : ID_RE.test(id) || FACT_RE.test(id);
    if (!ok) {
      notKb.push({
        file,
        id: String(v.id),
        why: /^[a-z0-9-]+\.info\./.test(id)
          ? 'type info has no Knowledge Base shape'
          : 'a code-change note, not an entry',
      });
      return;
    }
    records.push({ id, file, kind: FACT_RE.test(id) ? 'fact' : kind, value: undate({ ...v, id }) as Dict });
  };
  for (const file of files) {
    const doc = parse(readFileSync(path.join(DRAFTS_IN, file), 'utf8')) as Dict | null;
    if (!doc) continue;
    if (isDict(doc.maps)) {
      for (const list of Object.values(doc.maps))
        for (const v of (list as unknown[]) ?? []) take(file, 'entry', v);
      continue;
    }
    for (const v of (doc.entries as unknown[]) ?? [])
      take(file, isDict(v) && (v.patch !== undefined || v.patchOf !== undefined) ? 'edit' : 'entry', v);
    for (const v of (doc.facts as unknown[]) ?? []) take(file, 'fact', v);
    for (const v of (doc.amendments as unknown[]) ?? []) take(file, 'edit', v);
    for (const v of (doc.patches as unknown[]) ?? []) take(file, 'edit', v);
  }
  return { records, files: files.length, notKb };
}

const header = (what: string) =>
  `# SPDX-License-Identifier: GPL-3.0-only\n# Generated by \`pnpm kb convert-drafts\` from docs/research/systems/kb-drafts (M26 FR-10).\n# ${what} Never edit by hand: fix the draft or the script and re-run.\n`;

const dump = (v: unknown) => stringify(v, { lineWidth: 0, aliasDuplicateObjects: false });

/** The whole conversion, in memory. */
export function convertDrafts(): Converted {
  const pin = readPin().commit;
  const src = loadSource();
  const live = new Map(src.authored.map((e) => [e.value.id, e.value as unknown as Dict]));
  const liveFacts = new Set(src.facts.map((f) => f.value.id));
  const { records, files: fileCount, notKb } = readDrafts();
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const drafts = new Map<string, Dict[]>();
  const edits = new Map<string, Dict[]>();
  const facts = new Map<string, Dict[]>();
  const unconverted: ConvertReport['unconverted'] = [];
  for (const r of records) {
    // Several edits may target one live entry; only a new entry or fact id must be unique.
    if (r.kind !== 'edit' && !live.has(r.id) && seen.has(r.id)) {
      duplicates.push(r.id);
      continue;
    }
    seen.add(r.id);
    const system = r.id.split('.')[0] as string;
    const log: string[] = [];
    if (r.kind === 'fact') {
      const f: Dict = { origin: 'authored', ...r.value, system };
      delete f.status;
      for (const k of Object.keys(f))
        if (!['id', 'system', 'origin', 'title', 'rows', 'sources', 'notes'].includes(k)) delete f[k];
      if (Array.isArray(f.sources))
        f.sources = f.sources.map((s) => (isDict(s) ? convertSource(s, pin, log) : s));
      if (typeof f.title === 'string' && f.title.length > 80) f.title = `${f.title.slice(0, 79)}…`;
      if (log.length)
        f.notes = `${typeof f.notes === 'string' ? `${f.notes} ` : ''}kb-convert: ${log.join('; ')}`.slice(
          0,
          1000,
        );
      const ok = FactTable.safeParse(f);
      if (liveFacts.has(r.id))
        unconverted.push({
          id: r.id,
          file: r.file,
          reasons: ['a live fact table has this id: merge by hand'],
        });
      else if (!ok.success) unconverted.push({ id: r.id, file: r.file, reasons: reasonsOf(ok.error.issues) });
      else facts.set(system, [...(facts.get(system) ?? []), f]);
      continue;
    }
    const target = r.kind === 'edit' ? String(r.value.patchOf ?? r.value.amends ?? r.id) : r.id;
    const base = live.get(target);
    if (r.kind === 'edit' || base) {
      // An edit to a live entry: the patch fields over the live entry must still parse.
      if (!base) {
        unconverted.push({ id: r.id, file: r.file, reasons: [`edits ${target}, which is not a live entry`] });
        continue;
      }
      const patch: Dict = isDict(r.value.patch) ? { ...r.value.patch } : { ...r.value };
      for (const k of ['id', 'system', 'type', 'status', 'patch', 'patchOf', 'amends']) delete patch[k];
      const merged = convertEntry({ ...base, ...patch, status: base.status }, pin, log);
      merged.status = base.status;
      const ok = AuthoredEntry.safeParse(merged);
      const changed = Object.keys(patch).filter((k) => JSON.stringify(base[k]) !== JSON.stringify(merged[k]));
      const edit: Dict = {
        id: target,
        from: r.file,
        fields: changed,
        patch: Object.fromEntries(changed.map((k) => [k, merged[k]])),
      };
      if (!ok.success) edit.problems = reasonsOf(ok.error.issues);
      edits.set(system, [...(edits.get(system) ?? []), edit]);
      continue;
    }
    const e = convertEntry({ ...r.value, system }, pin, log);
    const ok = AuthoredEntry.safeParse(e);
    if (!ok.success) {
      unconverted.push({ id: r.id, file: r.file, reasons: reasonsOf(ok.error.issues) });
      continue;
    }
    drafts.set(system, [...(drafts.get(system) ?? []), e]);
  }
  const files = new Map<string, string>();
  for (const [system, entries] of [...drafts].sort(([a], [b]) => a.localeCompare(b)))
    files.set(
      path.join(SYSTEMS, `${system}.drafts.yaml`),
      header('Drafts: validated, never compiled until their wave promotes them (FR-1).') +
        dump({ system, entries }),
    );
  for (const [system, list] of [...edits].sort(([a], [b]) => a.localeCompare(b)))
    files.set(
      path.join(DRAFTS_OUT, 'edits', `${system}.yaml`),
      header('Edits to live entries, applied by hand in the promoting PR with its golden diff.') +
        dump({ system, edits: list }),
    );
  for (const [system, list] of [...facts].sort(([a], [b]) => a.localeCompare(b)))
    files.set(
      path.join(DRAFTS_OUT, 'facts', `${system}.facts.yaml`),
      header('Draft fact tables (FactTable-valid, not loaded).') + dump({ system, facts: list }),
    );
  const count = (m: Map<string, Dict[]>) => [...m.values()].reduce((n, l) => n + l.length, 0);
  const report: ConvertReport = {
    inputs: { files: fileCount, records: records.length + notKb.length },
    drafts: count(drafts),
    edits: count(edits),
    facts: count(facts),
    unconverted,
    duplicates,
    notKb,
    bySystem: Object.fromEntries([...drafts].map(([s, l]) => [s, l.length]).sort()),
  };
  files.set(path.join(DRAFTS_OUT, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  return { files, report };
}

/** Writes (or, with `check`, compares) every output file. Returns the problems found. */
export function runConvertDrafts(opts: { check?: boolean } = {}): string[] {
  const { files, report } = convertDrafts();
  const problems: string[] = [];
  const existing = [
    ...readdirSync(SYSTEMS)
      .filter((f) => f.endsWith('.drafts.yaml'))
      .map((f) => path.join(SYSTEMS, f)),
    ...['edits', 'facts'].flatMap((d) =>
      existsSync(path.join(DRAFTS_OUT, d))
        ? readdirSync(path.join(DRAFTS_OUT, d)).map((f) => path.join(DRAFTS_OUT, d, f))
        : [],
    ),
  ];
  if (opts.check) {
    for (const [file, text] of files)
      if (!existsSync(file) || readFileSync(file, 'utf8') !== text)
        problems.push(`${path.relative(REPO, file)} differs from its script (run pnpm kb convert-drafts)`);
    for (const f of existing)
      if (!files.has(f)) problems.push(`${path.relative(REPO, f)} is no longer produced`);
  } else {
    for (const f of existing) if (!files.has(f)) rmSync(f);
    for (const [file, text] of files) {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, text);
    }
  }
  if (report.duplicates.length) problems.push(`duplicate draft ids: ${report.duplicates.join(', ')}`);
  return problems;
}
