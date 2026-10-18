// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Build view's data (owner request 2026-10-18, docs/specs/M9-builds.md "Build view"): one roadmap
// per character, built from M9's own analysis (analyze.ts) and M2's class tree and roster. The class
// path, both presets against their Builds ("current / target" per talent, unspent points, the attack
// bar), an ordered "Next points" checklist and what opens next. Pure and deterministic: no clock.
import {
  type AccountState,
  type CharacterState,
  humanize,
  isKnown,
  type PresetTalents,
} from '@idleon-forge/account-state';
import { type Entry, STAGE_DEFINITIONS, type StageId } from '@idleon-forge/knowledge';
import { type ClassRow, classTree } from '../metapath/knowledge';
import { analyzeRoster } from '../metapath/roster';
import type { FactLookup } from '../metapath/types';
import type {
  BuildNextPoint,
  BuildPathStep,
  BuildPresetView,
  BuildRoadmap,
  BuildTabView,
  BuildTalentRow,
  SourceRef,
} from '../result';
import {
  type AccountAnalysis,
  analyzeAccount,
  bestNextStep,
  type CharacterAnalysis,
  PRESET_LEVEL,
  type PresetView,
} from './analyze';
import { levelOf, maxOf, tabSpent } from './classify';
import { stepApplies, targetOf, type WalkContext } from './diff';
import {
  type BuildsKnowledge,
  otherRole,
  type PresetRole,
  type ResolvedBuild,
  talentLabel,
} from './knowledge';

/** "Next points" lines per tab, so the checklist stays short. */
export const NEXT_PER_TAB = 3;
/** Promotheus asks for class Lv 10 before the class pick (Toolbox quests.json, Promotheus1). */
export const CLASS_PICK_LEVEL = 10;

const SKILLING_AFK = new Set(['MINING', 'CHOPPIN', 'FISHING', 'CATCHING']);

export interface RoadmapOptions {
  /** Entry ids the bundle marks Stale (M11 `CompiledKnowledge.stale`). */
  stale?: ReadonlySet<string>;
  /** Entries by id, for the Builds' and the class path's Sources and confidence. */
  entries?: Readonly<Record<string, Entry | undefined>>;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
const stageLabel = (id: string) => STAGE_DEFINITIONS[id as StageId]?.label ?? id;
const buildName = (b: ResolvedBuild) => b.entry.title.split(' (')[0] ?? b.entry.title;

interface Row extends ClassRow {
  released?: boolean;
  talentTabs?: string[];
}

// ---------- one preset ----------

interface PresetInput {
  p: PresetTalents;
  slot: 0 | 1;
  active: boolean;
  role: PresetRole | null;
  cls: PresetView['cls'] | null;
  build: ResolvedBuild | null;
  lb: { byTab: Record<1 | 2 | 3, number>; total: number } | null;
  afkType: string | null;
}

function tabRows(p: PresetTalents, b: ResolvedBuild, tab: number, ctx: WalkContext, kb: BuildsKnowledge) {
  const rows = new Map<number, BuildTalentRow>();
  for (const t of b.tabs) {
    if (t.tab !== tab) continue;
    for (const step of t.steps) {
      const target = targetOf(p, step);
      if (target === null) continue;
      const max = maxOf(p, step.id);
      const current = levelOf(p, step.id);
      const applies = stepApplies(step, ctx);
      const prev = rows.get(step.id);
      const goal = Math.max(prev?.target ?? 0, target);
      let note: string | null = null;
      if (applies === 'no') {
        const s = step.when.find((c) => c.kind === 'stageAtLeast');
        note = s && s.kind === 'stageAtLeast' ? `from ${stageLabel(s.stage)}` : 'later';
      } else if (applies === 'unknown') note = 'only if you are short on accuracy';
      else if (kb.talents.bubbleCapped.has(step.id)) note = 'a bubble raises it; no points needed';
      else if (current < goal && current >= max) note = `max for now (the build wants ${goal})`;
      rows.set(step.id, {
        id: step.id,
        label: talentLabel(step.talent),
        current,
        target: goal,
        max,
        met: current >= goal || kb.talents.bubbleCapped.has(step.id),
        core: (prev?.core ?? false) || step.core,
        note: prev && prev.note === null ? null : note,
      });
    }
  }
  return [...rows.values()];
}

/** The Build's steps minus current levels, in step order, simulating the levels as each step is done. */
function nextPoints(p: PresetTalents, b: ResolvedBuild, ctx: WalkContext, kb: BuildsKnowledge, slot: number) {
  const out: BuildNextPoint[] = [];
  for (const t of b.tabs) {
    const sim = new Map<number, number>();
    let n = 0;
    // M9 FR-11: the tab's core step first (the one the Build insists on), then the steps in order.
    const core = t.steps.filter((x) => x.core);
    for (const step of [...core, ...t.steps.filter((x) => !x.core)]) {
      if (n >= NEXT_PER_TAB) break;
      if (stepApplies(step, ctx) !== 'yes' || kb.talents.bubbleCapped.has(step.id)) continue;
      const target = targetOf(p, step);
      if (target === null) continue;
      const max = maxOf(p, step.id);
      const goal = Math.min(target, max);
      const current = sim.get(step.id) ?? levelOf(p, step.id);
      const need = goal - current;
      if (need <= 0) continue;
      sim.set(step.id, goal);
      const label = talentLabel(step.talent);
      const to = goal < target ? `to ${goal}, its max for now` : `to ${goal}`;
      const text =
        n === 0
          ? `Put the next ${plural(need, 'point')} into ${label} (${to})`
          : `then ${need.toLocaleString('en-US')} into ${label} (${to})`;
      out.push({ key: `c-s${slot}-t${t.tab}-${n}`, tab: t.tab, text, points: need });
      n++;
    }
  }
  return out;
}

function attackBarOf(x: PresetInput, kb: BuildsKnowledge): BuildPresetView['attackBar'] {
  const bar = x.p.attackBar;
  const name = (id: number) => talentLabel(kb.talents.nameOf(id) ?? String(id));
  const wanted = (x.build?.attacks ?? []).slice();
  if (x.role === 'skilling' && x.afkType && SKILLING_AFK.has(x.afkType)) {
    const id = kb.talents.skillAttackOf(x.afkType);
    if (id !== null && levelOf(x.p, id) >= 1 && !wanted.includes(id)) wanted.push(id);
  }
  if (bar === null) {
    return wanted.length
      ? { set: [], recommended: wanted.map(name), missing: [], text: "Can't read this preset's attack bar" }
      : null;
  }
  const set = bar.filter((id) => kb.talents.isAttack(id) || kb.talents.skillAttackFor(id) !== null);
  if (set.length === 0 && wanted.length === 0) return null;
  const missing = wanted.filter((id) => !bar.includes(id));
  const text = missing.length
    ? `Put ${missing.map(name).join(', ')} on the attack bar`
    : wanted.length
      ? 'Every attack the build wants is on the bar'
      : 'The build wants no attacks here';
  return { set: set.map(name), recommended: wanted.map(name), missing: missing.map(name), text };
}

function othersOf(p: PresetTalents, tab: number, named: ReadonlySet<number>, kb: BuildsKnowledge) {
  const t = p.tabs.find((x) => x.tab === tab);
  return (t?.talents ?? [])
    .filter((x) => x.base > 0 && !named.has(x.id))
    .sort((a, b) => b.base - a.base || a.id - b.id)
    .map((x) => ({ label: talentLabel(kb.talents.nameOf(x.id) ?? String(x.id)), level: x.base }));
}

function presetOf(x: PresetInput, kb: BuildsKnowledge, ctx: WalkContext): BuildPresetView {
  const { p, build } = x;
  const tabs: BuildTabView[] = p.tabs.map((t) => {
    const rows = build && t.tab <= 3 ? tabRows(p, build, t.tab, ctx, kb) : [];
    return {
      tab: t.tab,
      name: humanize(t.tabName),
      spent: tabSpent(p, t.tab),
      unspent: x.lb && t.tab <= 3 ? x.lb.byTab[t.tab as 1 | 2 | 3] : null,
      rows,
      others: othersOf(p, t.tab, new Set(rows.map((r) => r.id)), kb),
    };
  });
  const role = x.role;
  const heading = role ? `${cap(role)} preset` : x.active ? 'Current preset' : 'Other preset';
  const roleText =
    x.cls === 'empty'
      ? `Empty: set it up for ${role ?? 'your other role'}`
      : x.cls === 'incomplete'
        ? `Not finished: tabs 1 and 2 have no points. Set it up for ${role ?? 'your other role'}`
        : x.cls === 'unclassified'
          ? `Mixed fighting and skilling points; shown against the ${role ?? 'fighting'} build`
          : build
            ? buildName(build)
            : 'No build to compare';
  return {
    slot: x.slot,
    active: x.active,
    role,
    heading,
    roleText,
    buildTitle: build ? buildName(build) : null,
    unspent: x.lb?.total ?? null,
    tabs,
    attackBar: role ? attackBarOf(x, kb) : null,
    next: build ? nextPoints(p, build, ctx, kb, x.slot) : [],
  };
}

// ---------- the class path ----------

interface ClassPath {
  path: BuildPathStep[];
  nextClass: string | null;
  /** The class the character is heading for next (planned subclass, or the elite class). */
  heading: Row | null;
}

function classPathOf(c: CharacterState, facts: FactLookup, planned: string | null): ClassPath {
  const tree = classTree(facts);
  const byName = tree.byName as ReadonlyMap<string, Row>;
  const row = byName.get(c.class);
  if (!row) return { path: [], nextClass: null, heading: null };
  const back: Row[] = [];
  for (let r: Row | undefined = row, g = 0; r && g < 8; g++) {
    back.unshift(r);
    r = r.promotesFrom ? byName.get(r.promotesFrom) : undefined;
  }
  const released = (r: Row | undefined): r is Row => !!r && r.released !== false;
  const options = row.promotesTo.map((n) => byName.get(n)).filter(released);
  const pick =
    options.length <= 1
      ? (options[0] ?? null)
      : planned
        ? (options.find((o) => o.class === planned) ?? null)
        : null;
  const forward: { label: string; cls: string; row: Row | null }[] = [];
  if (pick) forward.push({ label: humanize(pick.class), cls: pick.class, row: pick });
  else if (options.length > 1)
    forward.push({ label: options.map((o) => humanize(o.class)).join(' or '), cls: '', row: null });
  for (let r: Row | null = pick, g = 0; r && g < 4; g++) {
    const n = r.promotesTo.map((x) => byName.get(x)).filter(released)[0] ?? null;
    if (n) forward.push({ label: humanize(n.class), cls: n.class, row: n });
    r = n;
  }
  const path: BuildPathStep[] = [
    ...back.map(
      (r) => ({ class: r.class, label: humanize(r.class), state: r === row ? 'now' : 'done' }) as const,
    ),
    ...forward.map((f, i) => ({ class: f.cls, label: f.label, state: i === 0 ? 'next' : 'later' }) as const),
  ];
  const first = forward[0];
  let nextClass: string | null = null;
  if (first) {
    if (row.tier === 'beginner')
      nextClass =
        c.level < CLASS_PICK_LEVEL
          ? `Lv ${CLASS_PICK_LEVEL}: pick ${first.label} at Promotheus`
          : `Pick ${first.label} at Promotheus`;
    else if (row.tier === 'base') nextClass = `Next class: take ${first.label} at Speccius`;
    else if (row.tier === 'subclass') nextClass = `Elite class: ${first.label} at Eliteus`;
    else nextClass = `Next class: ${first.label}`;
  }
  return { path, nextClass, heading: first?.row ?? null };
}

// ---------- the roadmap ----------

const NOTE: Record<string, string> = {
  beyond: 'Builds cover World 1 to World 4 for now; these are your plain talent levels',
  journeyman: 'No build yet for this class (Journeyman line); these are your plain talent levels',
  beginner: 'No build yet for a Beginner past Lv 15: pick your class first',
};

function sourcesOf(entries: readonly (Entry | undefined)[]): SourceRef[] {
  const out: SourceRef[] = [];
  for (const e of entries)
    for (const s of e?.sources ?? [])
      if (!out.some((x) => x.url === s.url))
        out.push({
          label: s.title,
          url: s.url,
          tier: s.tier,
          verifiedOn: s.verified,
          gameVersion: s.gameVersion,
          ...(s.claimDate ? { claimDate: String(s.claimDate) } : {}),
        });
  return out;
}

function roleFor(v: PresetView, other: PresetView | null, need: PresetRole | null): PresetRole {
  if (v.cls === 'fighting' || v.cls === 'skilling') return v.cls;
  if (other && (other.cls === 'fighting' || other.cls === 'skilling')) return otherRole(other.cls);
  if (v.isActive) return need ?? 'fighting';
  return need ? otherRole(need) : 'skilling';
}

function covered(
  c: CharacterState,
  a: CharacterAnalysis,
  acc: AccountAnalysis,
  path: ClassPath,
  opts: RoadmapOptions,
): BuildRoadmap {
  const kb = acc.kb;
  const views = [a.active, a.other]
    .filter((v): v is PresetView => v !== null)
    .sort((x, y) => x.slot - y.slot);
  const presets = views.map((v) => {
    const other = v === a.active ? a.other : a.active;
    const role = roleFor(v, other, a.neededRole);
    return presetOf(
      {
        p: v.talents,
        slot: v.slot,
        active: v.isActive,
        role,
        cls: v.cls,
        build: a.builds[role],
        lb: v.lb,
        afkType: c.afkType,
      },
      kb,
      a.walkCtx,
    );
  });
  const shown = [
    ...new Set(presets.map((p) => (p.role ? a.builds[p.role] : null)).filter((b) => b !== null)),
  ];
  const stale = shown.some((b) => b.stale || b.contested || opts.stale?.has(b.entry.id) === true);
  const lowConfidence = shown.some((b) => b.entry.confidence === 'L');

  // ---- coming up ----
  const comingUp: string[] = [];
  if (c.level < PRESET_LEVEL)
    comingUp.push(
      `Lv ${PRESET_LEVEL}: your second talent preset opens, one for fighting and one for skilling`,
    );
  const next = path.heading;
  if (next) {
    const mine = (classRow(acc, c.class)?.talentTabs ?? []).length;
    const theirs = next.talentTabs ?? [];
    if (theirs.length > mine) {
      const tab = theirs[theirs.length - 1] ?? next.class;
      comingUp.push(
        `Taking ${humanize(next.class)} opens the ${humanize(tab)} talent tab (tab ${theirs.length})`,
      );
    }
    const line = kb.lineOf(next.class);
    if (line && line !== a.classLine) {
      for (const role of ['fighting', 'skilling'] as const) {
        const b = kb.build(line, role);
        const t3 = b?.tabs.find((t) => t.tab === 3)?.steps.slice(0, 2) ?? [];
        if (b && t3.length)
          comingUp.push(
            `Then the ${buildName(b)} starts tab 3 with ${t3.map((s) => talentLabel(s.talent)).join(', then ')}`,
          );
      }
    }
    if (next.tier === 'elite') comingUp.push('Elite talent builds are not covered yet');
  }
  const gated = new Set<string>();
  for (const b of shown)
    for (const t of b.tabs)
      for (const s of t.steps) {
        const w = s.when.find((x) => x.kind === 'stageAtLeast');
        if (w && w.kind === 'stageAtLeast' && stepApplies(s, a.walkCtx) === 'no')
          gated.add(`From ${stageLabel(w.stage)}: ${talentLabel(s.talent)} (${b.role} build, tab ${t.tab})`);
      }
  comingUp.push(...gated);
  if (acc.eliteTabs.includes(c.index))
    comingUp.push('Elite talent tabs show plain levels: no elite build yet');

  // ---- status ----
  const parts: string[] = [];
  const most = presets.reduce<BuildPresetView | null>(
    (m, p) => ((p.unspent ?? 0) > (m?.unspent ?? 0) ? p : m),
    null,
  );
  const emptySlots = new Set(views.filter((v) => v.cls === 'empty').map((v) => v.slot));
  if (most?.unspent) {
    const n = most.unspent.toLocaleString('en-US');
    parts.push(
      emptySlots.has(most.slot)
        ? `${cap(most.heading.toLowerCase())} empty: ${n}+ points waiting`
        : `${n}+ unspent on the ${most.heading.toLowerCase()}`,
    );
  }
  // The preset with points waiting leads (M9 FR-9); else M9's next step over both presets (FR-11).
  const best = bestNextStep(a);
  const lead =
    (most?.unspent ? most : null) ??
    (best && presets.find((p) => p.slot === best.preset.slot)) ??
    presets.find((p) => (a.neededRole ? p.role === a.neededRole : p.active));
  const first = lead?.next[0] ?? presets.flatMap((p) => p.next)[0];
  if (first)
    parts.push(
      `next: ${first.text.replace(/^Put the next [\d,]+ points? into /, '').replace(/ \(.*\)$/, '')}`,
    );
  if (parts.length === 0) parts.push('on track with the build');

  return {
    index: c.index,
    classLabel: humanize(c.class),
    level: c.level,
    status: parts.join(' · '),
    path: path.path,
    nextClass: path.nextClass,
    presets,
    comingUp,
    note: null,
    quiet: stale
      ? 'This build is marked stale: it only lists the steps game data backs. Check it against the Sources.'
      : lowConfidence
        ? 'Low-confidence build, put together from community builds. Check it against the Sources.'
        : null,
    stale,
    sources: sourcesOf(shown.map((b) => opts.entries?.[b.entry.id] ?? b.entry)),
    entryIds: shown.map((b) => b.entry.id),
  };
}

// The class tree is read through the same lookup the analysis used.
const lookups = new WeakMap<AccountAnalysis, FactLookup>();
const factsOf = (acc: AccountAnalysis): FactLookup => lookups.get(acc) as FactLookup;
const classRow = (acc: AccountAnalysis, cls: string): Row | undefined =>
  classTree(factsOf(acc)).byName.get(cls) as Row | undefined;

function plain(c: CharacterState, acc: AccountAnalysis, path: ClassPath, note: string): BuildRoadmap {
  const t = c.talents;
  const kb = acc.kb;
  const ctx: WalkContext = { stage: acc.stage, bubbleCapped: kb.talents.bubbleCapped };
  const list: { p: PresetTalents; slot: 0 | 1; active: boolean }[] = [];
  if (t) {
    list.push({ p: t.active, slot: t.selectedPreset, active: true });
    if (t.other && c.level >= PRESET_LEVEL)
      list.push({ p: t.other, slot: t.selectedPreset === 0 ? 1 : 0, active: false });
  }
  list.sort((x, y) => x.slot - y.slot);
  const presets = list.map((x) =>
    presetOf(
      {
        p: x.p,
        slot: x.slot,
        active: x.active,
        role: null,
        cls: null,
        build: null,
        lb: null,
        afkType: c.afkType,
      },
      kb,
      ctx,
    ),
  );
  for (const p of presets) p.roleText = 'No build to compare';
  const comingUp: string[] = [];
  if (t && c.level < PRESET_LEVEL)
    comingUp.push(
      `Lv ${PRESET_LEVEL}: your second talent preset opens, one for fighting and one for skilling`,
    );
  return {
    index: c.index,
    classLabel: humanize(c.class),
    level: c.level,
    status: note.split(';')[0] ?? note,
    path: path.path,
    nextClass: path.nextClass,
    presets,
    comingUp,
    note,
    quiet: null,
    stale: false,
    sources: [],
    entryIds: [],
  };
}

/**
 * One roadmap per character, in save order. Characters M9 covers get both presets against their
 * Builds; the rest get their plain talent levels and a note ("No build yet for this class").
 */
export function buildRoadmaps(
  state: AccountState,
  facts: FactLookup,
  opts: RoadmapOptions = {},
): BuildRoadmap[] {
  const acc = analyzeAccount(state, facts);
  lookups.set(acc, facts);
  let roster: ReturnType<typeof analyzeRoster> | null = null;
  try {
    roster = analyzeRoster(state, facts, acc.stage);
  } catch {
    roster = null;
  }
  return state.characters.map((c) => {
    const planned = roster?.slots.find((s) => s.characterIndex === c.index)?.line ?? null;
    let path: ClassPath;
    try {
      path = classPathOf(c, facts, planned);
    } catch {
      path = { path: [], nextClass: null, heading: null };
    }
    if (!c.talents || !isKnown(state, `characters[${c.index}].talents`))
      return plain(c, acc, path, "Can't read this character's talents from the save");
    const a = acc.characters.get(c.index);
    if (a) return covered(c, a, acc, path, opts);
    const reason = acc.notCovered.get(c.index);
    return plain(c, acc, path, (reason && NOTE[reason]) ?? 'No build yet for this class');
  });
}
