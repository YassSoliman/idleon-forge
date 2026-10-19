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
  BuildConfidenceView,
  BuildKnownPoints,
  BuildNextPoint,
  BuildPathStep,
  BuildPresetView,
  BuildRoadmap,
  BuildTabView,
  BuildTalentRow,
  SourceRef,
} from '../result';
import { pointsLeft } from '../talents/points';
import {
  type AccountAnalysis,
  analyzeAccount,
  bestNextStep,
  type CharacterAnalysis,
  neededRoleOf,
  PRESET_LEVEL,
  type PresetView,
} from './analyze';
import { levelOf, maxOf, tabSpent } from './classify';
import { stepApplies, targetOf, type WalkContext } from './diff';
import {
  type BuildsKnowledge,
  CLASS_TABS,
  otherRole,
  type PresetRole,
  type ResolvedBuild,
  type TabNo,
  talentLabel,
} from './knowledge';
import {
  ACCURACY_NOTE,
  bandPath,
  classGroups,
  laterOf,
  MAX_NOTE,
  type StarContext,
  starKnown,
  starTab,
} from './path';
import { type TabPoints, zeroTabs } from './unspent';

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
  /** Known unspent points per tab: M9 TR-7's lower bound, or exact counts when Account State has them. */
  lb: {
    byTab: TabPoints;
    total: number;
    /** Tabs whose count is the exact one (ADR 0010); the others are M9 TR-7 lower bounds. */
    exactTabs?: ReadonlySet<TabNo>;
    /** Exact tabs the save confirms (`exact-verified`). */
    verifiedTabs?: ReadonlySet<TabNo>;
  } | null;
  /** The class tabs the Builds count points on (1–3, and 4 or 5 once a Build names them). */
  counted: readonly TabNo[];
  /** M26: the account is past World 4, where the point counts are lower bounds only. */
  beyond?: boolean;
  afkType: string | null;
  /** The preset's next step's tab (M9's shared rule, analyze.ts `spendableNext`); leads the list. */
  lead: number | null;
  /** M21 FR-C9 to FR-C14: the star tab's inputs. */
  star: StarInput;
}

interface StarInput {
  /** Toolbox's star point total for this preset (Account State `starPoints`), or null. */
  total: number | null;
  /** The other preset's talents, for the fallback lower bound. */
  other: PresetTalents | null;
  role: PresetRole;
  /** The AFK skills the preset serves (its matched class Build's `serves`); null when unknown. */
  serves: string[] | null;
  ctx: StarContext;
}

function starOf(x: PresetInput, kb: BuildsKnowledge): BuildTabView {
  const s = x.star;
  return starTab(x.p, kb.starBuild(s.role), starKnown(s.total, x.p, s.other), s.serves, s.ctx, kb, x.slot);
}

function tabRows(p: PresetTalents, b: ResolvedBuild, tab: number, ctx: WalkContext, kb: BuildsKnowledge) {
  const rows = new Map<number, BuildTalentRow>();
  for (const t of b.tabs) {
    if (t.tab !== tab) continue;
    for (const step of t.steps) {
      const target = targetOf(p, step);
      if (target === null) continue;
      const max = maxOf(p, step.id, step.tab);
      const current = levelOf(p, step.id, step.tab);
      const applies = stepApplies(step, ctx);
      const prev = rows.get(step.id);
      const goal = Math.max(prev?.target ?? 0, target);
      let note: string | null = null;
      if (applies === 'no') {
        note = laterOf(step, ctx) ?? 'later';
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

/**
 * The Build's steps minus current levels, simulating the levels as each step is done. Points are per
 * tab (R5 QA P2-1): with points waiting (the lower bound), only tabs that have some are listed, the
 * preset's next step's tab first, and each step takes no more than its tab has left. A tab with none
 * waiting gets one line naming where its next points go. Without a second preset (nothing known),
 * every tab is listed as before. Same `spendOrder` as the path (M21 FR-C11): a tie is one line, its
 * points split evenly.
 */
function nextPoints(
  p: PresetTalents,
  b: ResolvedBuild,
  ctx: WalkContext,
  kb: BuildsKnowledge,
  slot: number,
  lb: PresetInput['lb'],
  lead: number | null,
  beyond = false,
) {
  const out: BuildNextPoint[] = [];
  const waiting = lb !== null && lb.total > 0;
  const tabs = b.tabs
    .filter((t) => !waiting || (lb?.byTab[t.tab] ?? 0) > 0)
    .sort((x, y) => Number(y.tab === lead) - Number(x.tab === lead) || x.tab - y.tab);
  for (const t of tabs) {
    let k = 0;
    const sim = new Map<number, number>();
    let budget = waiting ? (lb?.byTab[t.tab] ?? 0) : Number.POSITIVE_INFINITY;
    const none = lb !== null && !waiting;
    for (const group of classGroups(p, b, t.tab, ctx, kb)) {
      if (k >= (none ? 1 : NEXT_PER_TAB) || budget <= 0) break;
      // Only steps that apply now and take points (M9 FR-11): no later, bubble-set or accuracy-only steps.
      const live = group
        .filter((m) => m.later === null && m.fixed === null && m.note !== ACCURACY_NOTE)
        .map((m) => ({ ...m, current: sim.get(m.id) ?? m.current }));
      const need = live.reduce((s, m) => s + Math.max(0, m.goal - m.current), 0);
      if (need <= 0) continue;
      const tie = live.filter((m) => m.goal > m.current);
      const label = tie.map((m) => m.label).join(' = ');
      const goal = tie.reduce((s, m) => s + m.goal, 0);
      const key = `c-s${slot}-t${t.tab}-${k}`;
      const capped = tie.some((m) => m.note === MAX_NOTE);
      if (none) {
        // Past World 4 the game's point totals aren't modelled, so a tab with none known stays quiet
        // rather than say "no unspent points known" over a save that has many (M26).
        if (beyond) break;
        const to = tie.length > 1 ? 'split evenly' : `to ${goal}`;
        // A lower bound of 0 can't prove the tab is empty (fix/build-points): never "no points waiting".
        // An exact 0 (ADR 0010) can: the tab is all spent.
        const spentOut = lb?.exactTabs?.has(t.tab) === true;
        out.push({
          key,
          tab: t.tab,
          label,
          text: `${spentOut ? 'All spent here' : 'No unspent points known here'}; the next go into ${label} (${to})`,
          points: 0,
          talentId: tie[0]?.id ?? 0,
          ...(tie.length === 1 ? { to: goal } : {}),
        });
        k++;
        continue;
      }
      const take = Math.min(need, budget);
      budget -= take;
      // A part-paid tie spreads its points evenly (FR-C11); a single step just takes them.
      let left = take;
      for (const [i, m] of tie.entries()) {
        const share =
          i === tie.length - 1 ? left : Math.min(m.goal - m.current, Math.ceil(take / tie.length));
        sim.set(m.id, m.current + share);
        left -= share;
      }
      const to =
        tie.length > 1
          ? take < need
            ? `${take} of ${need}, split evenly`
            : 'split evenly'
          : take < need
            ? `to ${(tie[0]?.current ?? 0) + take} of ${goal}`
            : capped
              ? `to ${goal}, its max for now`
              : `to ${goal}`;
      const text =
        k === 0
          ? `Put the next ${plural(take, 'point')} into ${label} (${to})`
          : `then ${take.toLocaleString('en-US')} into ${label} (${to})`;
      out.push({
        key,
        tab: t.tab,
        label,
        text,
        points: take,
        talentId: tie[0]?.id ?? 0,
        ...(tie.length === 1 ? { to: (tie[0]?.current ?? 0) + take } : {}),
      });
      k++;
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
    .map((x) => ({ id: x.id, label: talentLabel(kb.talents.nameOf(x.id) ?? String(x.id)), level: x.base }));
}

/** A tab's known points (FR-C2): exact where ADR 0010's count exists, else the lower bound. */
function knownOf(lbs: PresetInput['lb'], tab: number, points: number | null): BuildKnownPoints {
  if (points === null) return { kind: 'none', points: null, overBy: null };
  const k = tab as TabNo;
  if (lbs?.exactTabs?.has(k))
    return { kind: 'exact', points, overBy: null, verified: lbs.verifiedTabs?.has(k) === true };
  return { kind: 'lower-bound', points, overBy: null };
}

function presetOf(x: PresetInput, kb: BuildsKnowledge, ctx: WalkContext): BuildPresetView {
  const { p, build } = x;
  const tabs: BuildTabView[] = p.tabs.map((t) => {
    const counted = x.counted.includes(t.tab);
    const rows = build && counted ? tabRows(p, build, t.tab, ctx, kb) : [];
    const lb = x.lb && counted ? x.lb.byTab[t.tab] : null;
    return {
      tab: t.tab,
      name: humanize(t.tabName),
      spent: tabSpent(p, t.tab),
      unspent: lb,
      rows,
      others: othersOf(p, t.tab, new Set(rows.map((r) => r.id)), kb),
      known: knownOf(x.lb, t.tab, lb),
      path:
        build && counted ? bandPath(classGroups(p, build, t.tab, ctx, kb), lb, `p-s${x.slot}-t${t.tab}`) : [],
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
    next: build ? nextPoints(p, build, ctx, kb, x.slot, x.lb, x.lead, x.beyond === true) : [],
    star: starOf(x, kb),
    confidence: build ? confidenceView(build) : null,
    ...(build
      ? {
          sources: sourcesOf([build.entry, ...(build.inherited ? [build.inherited] : [])]),
          entryId: build.entry.id,
        }
      : {}),
  };
}

/** "Community build · 6 sources" (M26 owner ruling 2026-10-19: one source is fine, and always labelled). */
export function confidenceView(b: ResolvedBuild): BuildConfidenceView {
  const n = b.confidence.sourceCount;
  const tiers = new Set(b.entry.sources.map((s) => s.tier));
  const kind = tiers.has(3) ? 'Community build' : tiers.has(2) ? 'Wiki build' : 'Build';
  return {
    level: b.confidence.level,
    sourceCount: n,
    text: `${kind} · ${n === 1 ? 'one source' : `${n} sources`}`,
    label: b.confidence.label,
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
  beyond: 'No build for this stage yet (builds cover World 1 to World 4): these are your talent levels',
  journeyman: 'No build yet for this class (Journeyman line): these are your talent levels',
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
        // Past World 4 the game's point formula is not modelled (the truth run's talent-total P2), so
        // the exact counts are not shown there: only M9's lower bound between the two presets (M26).
        lb: acc.beyond
          ? v.lb
          : (knownPoints(v.talents, other?.talents ?? null, kb.talents.tab2Granting, a.tabs) ?? v.lb),
        counted: a.tabs,
        beyond: acc.beyond,
        afkType: c.afkType,
        lead: v.next?.tab ?? null,
        star: {
          total: starTotalOf(c, v.talents, v.isActive),
          other: other?.talents ?? null,
          role,
          // FR-C11: what a preset serves is its matched class Build's `serves`; unknown when M9 can't
          // classify the preset or the Build lists none.
          serves:
            (v.cls === 'fighting' || v.cls === 'skilling') && v.build && v.build.entry.serves.length > 0
              ? [...v.build.entry.serves]
              : null,
          ctx: starCtxOf(acc),
        },
      },
      kb,
      a.walkCtx,
    );
  });
  const shown = [
    ...new Set(presets.map((p) => (p.role ? a.builds[p.role] : null)).filter((b) => b !== null)),
  ];
  const stale = shown.some(
    (b) =>
      b.stale ||
      b.contested ||
      opts.stale?.has(b.entry.id) === true ||
      (b.inherited !== null && opts.stale?.has(b.inherited.id) === true),
  );
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
    const newTab = theirs.length;
    if (line && line !== a.classLine) {
      for (const role of ['fighting', 'skilling'] as const) {
        const b = kb.build(line, role);
        // A Build for a world past the Stage model (a master class) stays out of a W4 account's plan (M26).
        if (!b || (b.stageHint !== null && !a.walkCtx.beyond)) continue;
        const first = b.tabs.find((t) => t.tab === newTab)?.steps.slice(0, 2) ?? [];
        if (first.length)
          comingUp.push(
            `Then the ${buildName(b)} starts tab ${newTab} with ${first.map((s) => talentLabel(s.talent)).join(', then ')}`,
          );
      }
    }
    if ((next.tier === 'elite' || next.tier === 'master') && !kb.hasBuild(next.class))
      comingUp.push(`${next.tier === 'elite' ? 'Elite' : 'Master'} talent builds are not covered yet`);
  }
  const gated = new Set<string>();
  for (const b of shown)
    for (const t of b.tabs)
      for (const s of t.steps) {
        const w = s.when.find((x) => x.kind === 'stageAtLeast');
        if (stepApplies(s, a.walkCtx) !== 'no') continue;
        if (s.stageHint && !a.walkCtx.beyond)
          gated.add(
            `From World ${s.stageHint.slice(1)}: ${talentLabel(s.talent)} (${b.role} build, tab ${t.tab})`,
          );
        else if (w && w.kind === 'stageAtLeast')
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
    // Exact counts (when Account State has them) drop the "at least" (DS-24 holds for bounds only).
    const exact = most.tabs.every((t) => !a.tabs.includes(t.tab as TabNo) || t.known?.kind === 'exact');
    const n = `${exact ? '' : 'at least '}${most.unspent.toLocaleString('en-US')}`;
    parts.push(
      emptySlots.has(most.slot)
        ? `${cap(most.heading.toLowerCase())} empty: ${n} points waiting`
        : `${n} points unspent on the ${most.heading.toLowerCase()}`,
    );
  }
  // The preset with points waiting leads (M9 FR-9); else M9's next step over both presets (FR-11).
  const best = bestNextStep(a);
  const lead =
    (most?.unspent ? most : null) ??
    (best && presets.find((p) => p.slot === best.preset.slot)) ??
    presets.find((p) => (a.neededRole ? p.role === a.neededRole : p.active));
  const first = lead?.next[0] ?? presets.flatMap((p) => p.next)[0];
  if (first) parts.push(`next: ${first.label}`);
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
    sources: sourcesOf(
      shown.flatMap((b) => [
        opts.entries?.[b.entry.id] ?? b.entry,
        ...(b.inherited ? [opts.entries?.[b.inherited.id] ?? b.inherited] : []),
      ]),
    ),
    entryIds: shown.flatMap((b) => [b.entry.id, ...(b.inherited ? [b.inherited.id] : [])]),
    confidence: shown[0] ? confidenceView(shown[0]) : null,
  };
}

// The class tree is read through the same lookup the analysis used.
const lookups = new WeakMap<AccountAnalysis, FactLookup>();
const factsOf = (acc: AccountAnalysis): FactLookup => lookups.get(acc) as FactLookup;

// FR-C12: the account numbers the star Builds' useful caps read, worked out once per run.
const starCtxs = new WeakMap<AccountAnalysis, StarContext>();
const starCtxOf = (acc: AccountAnalysis): StarContext =>
  starCtxs.get(acc) ?? {
    bestLevel: 0,
    bestBeginner: 0,
    stage: { stage: acc.stage, bubbleCapped: acc.kb.talents.bubbleCapped },
  };

/**
 * FR-C12: the best class level on the account, and the best Beginner-line level (a class whose talent
 * tabs run through Beginner: Beginner, Journeyman, Maestro, Voidwalker), as Toolbox's
 * `getHighestLevelOf(characters, 'Beginner')` reads it for Beginner Best Class (`damage.ts`).
 */
export function starContext(state: AccountState, acc: AccountAnalysis): StarContext {
  let bestLevel = 0;
  let bestBeginner = 0;
  for (const c of state.characters) {
    bestLevel = Math.max(bestLevel, c.level);
    if (acc.kb.talentTabsOf(c.class).includes('Beginner')) bestBeginner = Math.max(bestBeginner, c.level);
  }
  return { bestLevel, bestBeginner, stage: { stage: acc.stage, bubbleCapped: acc.kb.talents.bubbleCapped } };
}

/**
 * Points left per tab 1–3 (ADR 0010, #125): the Account State's exact count where it has one
 * (`talentPoints[tab]`, confidence other than `bound`), else M9 TR-7's lower bound, per tab, through
 * the shared `pointsLeft`. Null when neither is known on any tab (one preset, below class Lv 15).
 */
export function knownPoints(
  p: PresetTalents,
  q: PresetTalents | null,
  granting: ReadonlySet<number>,
  tabs: readonly TabNo[] = [1, 2, 3],
): PresetInput['lb'] {
  const byTab = zeroTabs();
  const exactTabs = new Set<TabNo>();
  const verifiedTabs = new Set<TabNo>();
  let any = false;
  for (const t of tabs) {
    const left = pointsLeft(p, q, t, granting);
    if (left.points === null) continue;
    any = true;
    byTab[t] = Math.max(0, left.points);
    if (left.kind === 'exact') exactTabs.add(t);
    if (left.verified) verifiedTabs.add(t);
  }
  if (!any) return null;
  return { byTab, total: CLASS_TABS.reduce((n, t) => n + byTab[t], 0), exactTabs, verifiedTabs };
}

/**
 * FR-C9, FR-C10: the star tab's total for a preset: the Account State's exact star count (ADR 0010)
 * when it has one, else Toolbox's `starTotal` read for the preset in use or the other one.
 */
const starTotalOf = (c: CharacterState, p: PresetTalents, active: boolean): number | null => {
  const exact = p.talentPoints?.star;
  if (exact && exact.confidence !== 'bound' && exact.total !== null) return exact.total;
  return (active ? c.talents?.starPoints?.active : c.talents?.starPoints?.other) ?? null;
};
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
  // FR-C14: the star tab shows on every character; without a class Build, the preset in use takes the
  // role its AFK Target needs (fighting by default) and the other preset the other role.
  const activeRole = neededRoleOf(c.afkType) ?? 'fighting';
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
        counted: [1, 2, 3],
        afkType: c.afkType,
        lead: null,
        star: {
          total: starTotalOf(c, x.p, x.active),
          other: list.find((y) => y !== x)?.p ?? null,
          role: x.active ? activeRole : otherRole(activeRole),
          serves: null,
          ctx: starCtxOf(acc),
        },
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
    confidence: null,
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
  starCtxs.set(acc, starContext(state, acc));
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
    const a = acc.characters.get(c.index) ?? acc.viewOnly.get(c.index);
    if (a) return covered(c, a, acc, path, opts);
    const reason = acc.notCovered.get(c.index);
    return plain(c, acc, path, (reason && NOTE[reason]) ?? 'No build yet for this class');
  });
}
