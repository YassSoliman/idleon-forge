// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 Bubba as one engine module, `bubba` (docs/specs/M23-bubba.md F6, FR-18 to FR-21). It runs the six
// Bubba Checks' Detectors, then makes them ONE account Goal (DS-25): its Next Action is the top firing
// Check in `bubba.priority.visit`, the others are its details (at most 2, then "+n more"). The Goal's key
// is stable (`bubba.goal.visit@account`), so Skip today and Not for me hold whatever is on top. It also
// emits the Bubba Timeline lane (FR-20) and the System page's data (views.ts). Never a Verdict, never a
// blocker; pure (the clock is `now`).
import type { AccountState } from '@idleon-forge/account-state';
import {
  type CheckFinding,
  type DetectorRegistry,
  type Entry,
  type FactTable,
  findDetector,
  makeContext,
  runDetector,
  type SlotValue,
} from '@idleon-forge/knowledge';
import {
  type BubbaNow,
  boonBuy,
  bubbaNow,
  charismaIdle,
  megafleshPlan,
  PATS_HOUR_SECONDS,
  patGift,
  SMOKER_MAX_QUALITY_SECONDS as SMOKER_CAP,
  smokerClaim,
  UPG,
} from '@idleon-forge/knowledge/helpers';
import type { EngineInput, EngineModule, ModuleGoal, ModuleOutput } from '../core/module';
import { lookupOf } from '../metapath/knowledge';
import { detectStage } from '../metapath/stage';
import type { Category, Goal, GoalDetail, SourceRef, TimelineBar, UnknownFinding } from '../result';
import { say, sourcesOf, who } from '../slots/kb';
import { bonusText, spanText } from './text';
import type { BubbaResult } from './types';
import { type BoonRow, buildBubbaView, ratingsOf } from './views';

export const ENTRY = {
  start: 'bubba.check.start',
  megaflesh: 'bubba.check.megaflesh',
  boon: 'bubba.check.boon',
  smoker: 'bubba.check.smoker',
  patGift: 'bubba.check.pat-gift',
  charisma: 'bubba.check.charisma-idle',
  goal: 'bubba.goal.visit',
  visit: 'bubba.priority.visit',
  run: 'bubba.priority.run',
  ratings: 'bubba.priority.boon-bonuses',
  charismaTargets: 'bubba.priority.charisma',
  mindful: 'bubba.priority.charisma-mindful',
} as const;
export const FACT = {
  upgrades: 'bubba.fact.upgrades',
  megaflesh: 'bubba.fact.megaflesh',
  boon: 'bubba.fact.boon',
  charisma: 'bubba.fact.charisma',
  gifts: 'bubba.fact.gifts',
  targets: 'bubba.fact.charisma-targets',
} as const;
/** The Goal's stable key (FR-18, RT-18). */
export const GOAL_KEY = `${ENTRY.goal}@account`;
/** FR-18: at most 2 other Checks as details, then "+n more". */
const MAX_ALSO = 2;
/** FR-20: a bar more than a year away is out of reach. */
const OUT_OF_REACH_MS = 365 * 86_400_000;

export interface BubbaKnowledge {
  entries: Readonly<Record<string, Entry>>;
  facts: Readonly<Record<string, FactTable>>;
}

export interface BubbaModuleDeps {
  kb: BubbaKnowledge & { readsOf?: Readonly<Record<string, string[]>> };
  /** The Knowledge Base Detector registry (the six Checks' Detectors). */
  registry: DetectorRegistry;
}

type Fired = Extract<CheckFinding, { result: 'fires' }>;

/** A firing Check, rendered as the Goal's Next Action would read it. */
interface Step {
  entryId: string;
  text: string;
  why: string;
  details: string[];
  category: Category;
  urgency: Fired['urgency'] | null;
}

const rowsOf = <T>(kb: BubbaKnowledge, id: string): T | null => (kb.facts[id]?.rows as T | undefined) ?? null;
const value = (kb: BubbaKnowledge, id: string, key: string) => kb.entries[id]?.values[key];
const flag = (slots: Record<string, SlotValue>, k: string) => slots[k] === 1;

/** The Stage key of `bubba.priority.boon-bonuses` (FR-17): W3 Stages as is, W4 and beyond as W4-entry. */
function ratingStage(state: AccountState, kb: BubbaKnowledge): string {
  try {
    const s = detectStage(state, lookupOf(kb));
    if (s.coverage === 'beyond') return 'W4-entry';
    if (s.id && typeof value(kb, ENTRY.ratings, s.id) === 'string') return s.id;
  } catch {
    // no Stage: the earliest row
  }
  return 'W3-early';
}

const categoryOf = (kb: BubbaKnowledge, id: string): Category => {
  const e = kb.entries[id];
  return (e && e.type === 'check' && e.category) || 'compounding';
};

/** The next Boon level's added bonus in words (X1's delta, at the current multiplier). */
export function boonAdd(n: BubbaNow, boon: readonly BoonRow[], offset = 0, multiplier = 1): string | null {
  const b = n.b;
  if (b.boonNextDelta === null) return null;
  const level = (b.levels[UPG.boon] ?? 0) + offset;
  const row = boon[level % 7];
  const first = boon[(b.levels[UPG.boon] ?? 0) % 7];
  if (!row || !first || first.perStack === 0) return null;
  // Each Boon level adds one stack of the rotation's bonus; stacks differ only by their table value.
  return bonusText(row.key, row.name, (b.boonNextDelta * row.perStack * multiplier) / first.perStack);
}

function steps(n: BubbaNow, kb: BubbaKnowledge, fired: Map<string, Fired>, state: AccountState): Step[] {
  const out: Step[] = [];
  const boon = rowsOf<BoonRow[]>(kb, FACT.boon) ?? [];
  const megafleshRows = rowsOf<{ row: number; text: string }[]>(kb, FACT.megaflesh) ?? [];
  const charisma = rowsOf<{ id: number; name: string }[]>(kb, FACT.charisma) ?? [];
  const ratings = ratingsOf(kb, ratingStage(state, kb));
  const add = (entryId: string, text: string, why: string, details: string[] = []) => {
    const f = fired.get(entryId);
    if (!f || !text) return;
    out.push({
      entryId,
      text,
      why,
      details: details.filter(Boolean),
      category: categoryOf(kb, entryId),
      urgency: f.urgency ?? null,
    });
  };

  const start = fired.get(ENTRY.start);
  if (start) {
    const r = flag(start.slots, 'restart');
    add(
      ENTRY.start,
      say(kb, ENTRY.start, r ? 'text-restart' : 'text'),
      say(kb, ENTRY.start, r ? 'why-restart' : 'why'),
    );
  }

  const mf = fired.has(ENTRY.megaflesh) ? megafleshPlan(n) : null;
  if (mf && mf !== 'unknown') {
    const M = ENTRY.megaflesh;
    const row = Math.min(mf.next, 12);
    const game = (megafleshRows.find((x) => x.row === row)?.text ?? '')
      .split('@')[0]
      ?.replace(/\$x?/g, '')
      .trim();
    const details: string[] = [];
    const after = mf.multiplierAfter;
    const ratio = after && n.b.megafleshMultiplier ? after / n.b.megafleshMultiplier : null;
    mf.boonBuys.forEach((buy, k) => {
      if (k >= 3) return;
      const delta = boonAdd(n, boon, k);
      const afterDelta = ratio ? boonAdd(n, boon, k, ratio) : null;
      details.push(
        delta === null
          ? say(kb, M, 'detail-boon-plain', { level: buy.level })
          : afterDelta
            ? say(kb, M, 'detail-boon-after', { level: buy.level, delta, after: afterDelta })
            : say(kb, M, 'detail-boon', { level: buy.level, delta }),
      );
    });
    const last = mf.boonBuys[mf.boonBuys.length - 1];
    if (mf.boonBuys.length > 3 && last) details.push(say(kb, M, 'detail-boon-more', { level: last.level }));
    const fun = mf.funGiftBuys[mf.funGiftBuys.length - 1];
    if (fun) details.push(say(kb, M, 'detail-fun-gifts', { level: fun.level }));
    details.push(say(kb, M, 'detail-restart'));
    if (mf.charismaReset) details.push(say(kb, M, 'detail-charisma'));
    add(
      M,
      say(kb, M, 'text', { next: mf.next, label: String(value(kb, M, `label-${row}`) ?? '') }),
      say(kb, M, 'why', { game: game || String(value(kb, M, `label-${row}`) ?? '') }),
      details,
    );
  }

  const share = (() => {
    const e = kb.entries[ENTRY.boon];
    const p = e && e.type === 'check' ? e.detector.params.share : undefined;
    return typeof p === 'number' ? p : 0.1;
  })();
  const boonFire = fired.has(ENTRY.boon) ? boonBuy(n, share) : null;
  if (boonFire && boonFire !== 'unknown') {
    const B = ENTRY.boon;
    const row = boon[(boonFire.level - 1) % 7];
    const delta = boonAdd(n, boon);
    const high = row && ratings[row.key] === 'high';
    const why = say(kb, B, boonFire.mode === 'cheap' ? 'why-cheap' : 'why');
    add(
      B,
      delta === null
        ? say(kb, B, 'text-plain', { level: boonFire.level, bonus: row?.name ?? '' })
        : say(kb, B, 'text', { level: boonFire.level, delta }),
      high ? `${why} ${say(kb, B, 'why-high-note', { bonus: row?.name ?? '' })}` : why,
    );
  }

  const smoke = fired.has(ENTRY.smoker) ? smokerClaim(n) : null;
  if (smoke && smoke !== 'unknown') {
    const S = ENTRY.smoker;
    const why = say(kb, S, 'why', { cap: spanText(SMOKER_CAP) });
    add(
      S,
      say(kb, S, smoke.freeRoll ? 'text-free-roll' : 'text'),
      smoke.freeRoll ? `${say(kb, S, 'why-lead-free-roll')} ${why}` : why,
    );
  }

  const idle = fired.has(ENTRY.charisma) ? charismaIdle(n) : null;
  if (idle && idle !== 'unknown') {
    const C = ENTRY.charisma;
    const none = idle.selected === 0;
    const name = charisma.find((c) => c.id === idle.selected)?.name ?? '';
    const why = say(kb, C, none ? 'why-none' : 'why', { selected: name, max: idle.max });
    add(
      C,
      say(kb, C, idle.mindful ? 'text-mindful' : none ? 'text-none' : 'text'),
      idle.mindful ? `${say(kb, C, 'why-lead-mindful')} ${why}` : why,
      idle.banked !== null && idle.banked > 0 ? [say(kb, C, 'detail-banked', { banked: idle.banked })] : [],
    );
  }

  const pat = fired.has(ENTRY.patGift) ? patGift(n) : null;
  if (pat && pat !== 'unknown') {
    const P = ENTRY.patGift;
    add(
      P,
      pat.pats === null ? say(kb, P, 'text-until-stops') : say(kb, P, 'text', { pats: pat.pats }),
      say(kb, P, 'why'),
      [say(kb, P, 'detail-fade')],
    );
  }

  // FR-18: bubba.priority.visit's order.
  const visit = kb.entries[ENTRY.visit];
  const order = visit && visit.type === 'priority' ? visit.tiers.flat().map(String) : [];
  const rank = (id: string) => {
    const i = order.indexOf(id);
    return i < 0 ? order.length : i;
  };
  return out.sort((a, b) => rank(a.entryId) - rank(b.entryId));
}

/** FR-6: the character a Bubba visit should be on, when not every character has the door. */
function openOn(state: AccountState, n: BubbaNow): string | null {
  if (n.unlock.all) return null;
  const last = state.lastPlayedCharacterIndex;
  const pick =
    last !== null && n.unlock.open.includes(last)
      ? last
      : [...n.unlock.open].sort(
          (a, b) =>
            (state.characters.find((c) => c.index === b)?.level ?? 0) -
            (state.characters.find((c) => c.index === a)?.level ?? 0),
        )[0];
  const c = state.characters.find((x) => x.index === pick);
  return c ? who(c) : null;
}

function goalOf(kb: BubbaKnowledge, list: Step[], fields: string[], extra: string[]): ModuleGoal | null {
  const top = list[0];
  const entry = kb.entries[ENTRY.goal];
  if (!top || !entry) return null;
  const others = list.slice(1);
  // "Also in Bubba: pat Bubba 10 times, then buy Open Gift right away": the other step, said as a step.
  const lower = (t: string) => (/^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);
  const also = others
    .slice(0, MAX_ALSO)
    .map((s) => say(kb, ENTRY.goal, 'detail-also', { title: lower(s.text) }));
  const more =
    others.length > MAX_ALSO ? [say(kb, ENTRY.goal, 'detail-more', { n: others.length - MAX_ALSO })] : [];
  const details: GoalDetail[] = [...top.details, ...also, ...more, ...extra]
    .filter(Boolean)
    .map((text) => ({ subject: 'account', text }));
  const sources: SourceRef[] = sourcesOf(kb, top.entryId);
  const e = kb.entries[top.entryId];
  const goal: Goal = {
    id: ENTRY.goal,
    title: entry.title,
    system: 'bubba',
    category: top.category,
    nextAction: {
      key: GOAL_KEY,
      entryId: top.entryId,
      text: top.text,
      why: top.why,
      sources,
      stale: false,
      contested: null,
      confidence: e?.confidence ?? 'M',
      provenance: { entryIds: [ENTRY.goal, ...list.map((s) => s.entryId)], fields },
    },
    milestone: null,
    ...(details.length ? { details } : {}),
  };
  const effort = e && e.type === 'check' ? e.effortSeconds : undefined;
  return {
    goal,
    rank: {
      rankAs: ENTRY.goal,
      urgency: top.urgency ?? null,
      deadline: null,
      framePosition: null,
      cost: effort ? { unit: 'hours', amount: effort / 3600 } : null,
    },
  };
}

/** FR-20: the account lane "Bubba". */
function timelineOf(n: BubbaNow, fired: ReadonlySet<string>, share: number): TimelineBar[] {
  const { b } = n;
  const bars: TimelineBar[] = [];
  const bar = (entryId: string, slot: string, kind: TimelineBar['kind'], what: string, at: number) => {
    if (!Number.isFinite(at) || at - n.now > OUT_OF_REACH_MS) return;
    bars.push({
      barId: `${entryId}@account#${slot}`,
      key: GOAL_KEY,
      entryId,
      system: 'bubba',
      subject: 'account',
      kind,
      what,
      at,
      untimed: false,
      effect: fired.has(entryId) ? 'next-action' : 'info',
      fixHolds: false,
    });
  };
  const perSec = n.rate === null ? 0 : n.rate / 60;
  // `at` from the save: (cost - meat) / (meat per second) seconds after it (RT-9).
  const affordAt = (cost: number | null) =>
    cost === null || perSec <= 0 ? Number.NaN : n.save + (Math.max(0, cost - b.meat) / perSec) * 1000;
  if (!n.notStarted && !n.restart && perSec > 0) {
    const mfCost = b.costs[UPG.megaflesh] ?? null;
    if (b.types > UPG.megaflesh)
      bar(ENTRY.megaflesh, 'megaflesh', 'timer', `Megaflesh ${b.megaflesh + 1}`, affordAt(mfCost));
    const boonCost = b.costs[UPG.boon] ?? null;
    const boonLevel = (b.levels[UPG.boon] ?? 0) + 1;
    const cheap = boonCost !== null && mfCost !== null && boonCost <= share * mfCost;
    if (b.types > UPG.boon && (boonLevel <= 7 || cheap))
      bar(ENTRY.boon, 'boon', 'timer', `Bubba Boon ${boonLevel}`, affordAt(boonCost));
  }
  if (b.smoker.unlocked)
    bar(
      ENTRY.smoker,
      'smoker',
      'time-cap',
      'Smoker quality',
      n.save + Math.max(0, SMOKER_CAP - b.smoker.seconds) * 1000,
    );
  const happi = (b.levels[UPG.happiBoi] ?? 0) + (b.prestige[UPG.happiBoi] ?? 0);
  const refill = n.save + Math.max(0, PATS_HOUR_SECONDS - b.pats.timer) * 1000;
  if (happi >= 1 && refill > n.now) bar(ENTRY.patGift, 'pats', 'timer', "Bubba's pats", refill);
  return bars;
}

export interface BubbaRun {
  goals: ModuleGoal[];
  view: BubbaResult | null;
  timeline: TimelineBar[];
  unknown: UnknownFinding[];
}

const CHECKS = [ENTRY.start, ENTRY.megaflesh, ENTRY.boon, ENTRY.smoker, ENTRY.charisma, ENTRY.patGift];

/** M23 as a pure function of the Account State, the Knowledge Base and `now`. */
export function buildBubba(
  state: AccountState,
  kb: BubbaModuleDeps['kb'],
  registry: DetectorRegistry,
  now: number,
): BubbaRun {
  const empty: BubbaRun = { goals: [], view: null, timeline: [], unknown: [] };
  const n = bubbaNow(state, now);
  if (n === null) return empty;
  const unknownAll = (): UnknownFinding[] =>
    CHECKS.map((entryId) => ({ entryId, subject: 'account' as const, reason: 'field-missing' }));
  if (n === 'unknown') {
    // FR-21: no number from an unreadable record; the page says so when Bubba is open.
    const open = state.characters.some((c) => (c.doorKillsLeft?.[50]?.[0] ?? 1) <= 0);
    return { ...empty, unknown: unknownAll(), view: open ? unknownView() : null };
  }
  const ctx = makeContext(state, kb, { now });
  const fired = new Map<string, Fired>();
  const unknown: UnknownFinding[] = [];
  const fields = new Set<string>();
  for (const id of CHECKS) {
    const e = kb.entries[id];
    if (e?.type !== 'check') continue;
    const d = findDetector(e.detector.id, registry);
    if (!d) continue;
    for (const f of kb.readsOf?.[d.id] ?? d.reads) fields.add(f);
    const run = runDetector(d, ctx, e.detector.params);
    if (!run.ok) {
      unknown.push({ entryId: id, subject: 'account', reason: 'detector-failed' });
      continue;
    }
    for (const f of run.findings as readonly CheckFinding[]) {
      if (f.result === 'fires') fired.set(id, f);
      else if (f.result === 'unknown') unknown.push({ entryId: id, subject: 'account', reason: f.reason });
    }
  }
  const list = steps(n, kb, fired, state);
  const opensOn = openOn(state, n);
  const extra = [
    opensOn ? say(kb, ENTRY.goal, 'detail-who', { who: opensOn }) : '',
    !n.unlock.all && !n.notStarted ? say(kb, ENTRY.goal, 'detail-login') : '',
  ];
  const g = goalOf(kb, list, [...fields].sort(), extra);
  const share = (() => {
    const e = kb.entries[ENTRY.boon];
    const p = e && e.type === 'check' ? e.detector.params.share : undefined;
    return typeof p === 'number' ? p : 0.1;
  })();
  const timeline = timelineOf(n, new Set(list.map((s) => s.entryId)), share);
  const view = buildBubbaView({
    n,
    kb,
    state,
    stage: ratingStage(state, kb),
    step: g ? { key: GOAL_KEY, entryId: g.goal.nextAction.entryId, text: g.goal.nextAction.text } : null,
    timeline,
    openOn: opensOn,
    share,
  });
  return { goals: g ? [g] : [], view, timeline, unknown };
}

function unknownView(): BubbaResult {
  return {
    state: 'unknown',
    step: null,
    nextEvent: null,
    ratePerMin: null,
    projected: null,
    bonuses: [],
    boonNext: null,
    megaflesh: { owned: 0, rows: [], chromatic: 0, next: null, multiplier: null },
    run: { nextType: null, nextBuys: [] },
    pats: null,
    smoker: null,
    charisma: null,
    gifts: [],
    dice: [],
    loginNote: false,
    openOn: null,
    locked: {},
  };
}

export function createBubbaModule(deps: BubbaModuleDeps): EngineModule {
  return {
    id: 'bubba',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    run(input: EngineInput): ModuleOutput {
      const r = buildBubba(input.state, deps.kb, deps.registry, input.now);
      return {
        account: { goals: r.goals },
        bubba: r.view,
        ...(r.timeline.length ? { timeline: r.timeline } : {}),
        ...(r.unknown.length ? { unknownFindings: r.unknown } : {}),
      };
    },
  };
}
