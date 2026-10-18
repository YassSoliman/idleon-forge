// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 Star Signs and constellations as an engine module (docs/specs/M16-star-signs.md TR-1): F1's
// Telescope Goal, F2's constellation Goals with their Walkthroughs, F3's Star Signs Goal (or, without a
// Next Action, only the Star Chart summary), F4's "If you have time" challenge, and the view model the
// Signs tab and the Star Chart section read (EngineResult.starSigns). Never a Verdict input (FR-22).
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import { STAGES, type StageId } from '@idleon-forge/knowledge';
import { activityLabel, classLabel, mapLabel } from '../core/labels';
import type { EngineInput, EngineModule, ModuleGoal, ModuleOutput } from '../core/module';
import { runMetaPath } from '../metapath';
import { effortCost } from '../metapath/priority';
import type { MetaPathResult } from '../metapath/types';
import { aboutDuration } from '../now/format';
import type {
  ActivePlay,
  Done,
  Goal,
  GoalDetail,
  SourceRef,
  WalkthroughStepView,
  WalkthroughView,
} from '../result';
import {
  byCloseness,
  bySelection,
  type Candidate,
  type ConstellationStep,
  constellationCandidates,
  GOAL_KINDS,
} from './constellations';
import {
  characterOf,
  contextOf,
  DEFAULT_VALUES,
  killsToTelescope,
  reachesTelescope,
  type StarContext,
  type StarValues,
  wornOf,
} from './context';
import {
  constellationFacts,
  ENTRY,
  human,
  knowledgeReady,
  numberOf,
  type StarKnowledge,
  say as sayRaw,
  sourcesOf,
  starRules,
} from './knowledge';
import {
  activityOf,
  afterCosmos,
  buyable,
  type ChartState,
  chartState,
  currentLeg,
  fitSet,
  isStarter,
  rawActivity,
} from './signs';
import { telescopePlan } from './telescope';
import type { CharacterSigns, NextConstellation, StarSignsView } from './types';

const W1_MID = STAGES.indexOf('W1-mid');
/** "Not covered yet" on a W4-entry account (spec §2 Out of scope). */
export const W4_NOT_COVERED = {
  systemId: 'star-signs-w4',
  label: 'W4+ constellations and Infinite Stars',
} as const;
const LOCATIONS = 'https://idleon.wiki/wiki/Constellation_Locations';

export const who = (c: Pick<CharacterState, 'class' | 'level'>) => `${classLabel(c)} Lv ${c.level}`;
const back = (c: CharacterState) => mapLabel(c) ?? activityLabel(c);
const ACTIVITY: Record<string, string> = {
  FIGHTING: 'Fighting',
  MINING: 'Mining',
  CHOPPIN: 'Choppin',
  FISHING: 'Fishing',
  CATCHING: 'Catching',
};
const activityWord = (a: string) => ACTIVITY[a] ?? human(a.charAt(0) + a.slice(1).toLowerCase());
/** 7500 -> "7,500" (locale-free, FR-23). */
const thousands = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const signList = (signs: readonly string[]) => signs.map(human).join(', ');
const joinAnd = (xs: readonly string[]) =>
  xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

export function starValues(kb: StarKnowledge): StarValues {
  const n = (k: keyof StarValues) => numberOf(kb, ENTRY.signs, k, DEFAULT_VALUES[k]);
  return {
    maxM16Goals: n('maxM16Goals'),
    maxCandyHours: n('maxCandyHours'),
    levelGap: n('levelGap'),
    maxChallenges: n('maxChallenges'),
    talkSeconds: numberOf(kb, ENTRY.signs, 'talkMinutes', DEFAULT_VALUES.talkSeconds / 60) * 60,
    visitSeconds: numberOf(kb, ENTRY.signs, 'visitMinutes', DEFAULT_VALUES.visitSeconds / 60) * 60,
    claimSeconds: numberOf(kb, ENTRY.signs, 'claimMinutes', DEFAULT_VALUES.claimSeconds / 60) * 60,
    candySeconds: numberOf(kb, ENTRY.signs, 'candyMinutes', DEFAULT_VALUES.candySeconds / 60) * 60,
  };
}

interface Built {
  account: ModuleGoal[];
  walkthroughs: { parentKey: string; view: WalkthroughView }[];
  activePlay: ActivePlay[];
  done: Done[];
  view: StarSignsView | null;
}

/** M16 as a pure function of the Account State, the Knowledge Base and M2's result. */
export function buildStarSigns(
  state: AccountState,
  kb: StarKnowledge,
  meta: MetaPathResult | null,
  before: AccountState | null = null,
): Built {
  const empty: Built = { account: [], walkthroughs: [], activePlay: [], done: [], view: null };
  const stage = meta?.stage;
  if (!stage?.id || STAGES.indexOf(stage.id as StageId) < W1_MID || !knowledgeReady(kb)) return empty;
  if (state.account.starSigns === null || state.account.starSigns === undefined)
    throw new Error('star-signs/constellations: unknown (the starSigns or constellations section failed)');
  if (state.account.starSigns.pointsUnspent === null)
    throw new Error('star-signs/signs: unknown (unspent Star Chart Points could not be read)');
  const ctx = contextOf(state, kb, meta, stage.world ?? 1, starValues(kb));
  if (!ctx) return empty;
  const beyond = stage.coverage === 'beyond';
  const questDone = ctx.signs.telescopeQuestDone;
  if (questDone === null) return empty;

  const T = (key: string, slots: Record<string, string | number> = {}) =>
    sayRaw(kb, ENTRY.telescope, key, slots);
  const C = (key: string, slots: Record<string, string | number> = {}) =>
    sayRaw(kb, ENTRY.constellation, key, slots);
  const S = (key: string, slots: Record<string, string | number> = {}) => sayRaw(kb, ENTRY.signs, key, slots);
  const mapName = (m: number) => human(ctx.maps.get(m)?.name ?? `map ${m}`);
  const banked = ctx.signs.pointsUnspent ?? 0;

  // ---- F2: candidates (as they are, and for F1's why, as if the quest were handed in) ----
  const candidates = questDone ? constellationCandidates(ctx, { assumeHandedIn: false }) : [];
  const ready = candidates.filter((x) => GOAL_KINDS.has(x.kind)).sort(bySelection);
  const readyPoints = ready.reduce((n, x) => n + x.fact.points, 0);

  // ---- F3: the chart, the next unlock, the per-character signs ----
  const chart = chartState(ctx);
  const leg = currentLeg(ctx, chart);
  const trip = buyable(ctx, banked);
  const reachers = state.characters.filter((c) => reachesTelescope(ctx, c) === true);
  const playing = state.lastPlayedCharacterIndex;
  const atTelescope = [...reachers].sort(
    (a, b) => Number(b.index === playing) - Number(a.index === playing) || a.index - b.index,
  )[0];

  type SignsAction = { text: string; why?: string; who: CharacterState; unlocks: string[] };
  const signsAction = (constellationsShown: boolean): SignsAction | null => {
    if (beyond || !atTelescope) return null;
    // 1. Unlock, one trip (D-14).
    if (trip.signs.length > 0 && leg && (banked >= leg.remaining || !constellationsShown)) {
      const after = chartState(ctx, trip.signs);
      const own = fitGain(ctx, atTelescope, chart, after);
      const unlock = S('unlock', { who: who(atTelescope), signs: signList(trip.signs) });
      return {
        text: own.length ? S('unlock-align', { unlock, sign: joinAnd(own.map(human)) }) : unlock,
        why: S('why-unlock', { cost: trip.cost, points: banked }),
        who: atTelescope,
        unlocks: trip.signs,
      };
    }
    // 2. Empty slot; 3. Better (non-starter) fit.
    for (const c of reachers) {
      const a = activityOf(ctx, c);
      if (!a) continue;
      const worn = wornOf(ctx, c);
      const want = fitSet(ctx, a, chart.unlocked, chart.slots);
      const missing = want.find((s) => !worn.includes(s));
      if (worn.length < chart.slots && missing)
        return { text: S('empty', { who: who(c), sign: human(missing) }), who: c, unlocks: [] };
    }
    for (const c of reachers) {
      const a = activityOf(ctx, c);
      if (!a) continue;
      const worn = wornOf(ctx, c);
      const want = fitSet(ctx, a, chart.unlocked, chart.slots);
      const better = want.find((s) => !worn.includes(s) && !isStarter(ctx, s));
      const out = worn.find((s) => !want.includes(s));
      if (better && out)
        return {
          text: S('swap', { who: who(c), worn: human(out), sign: human(better), activity: activityWord(a) }),
          who: c,
          unlocks: [],
        };
    }
    return null;
  };

  // FR-7 cap: the Star Signs Goal counts as one when it has a Next Action (D-2).
  let action = questDone ? signsAction(ready.length > 0) : null;
  const cap = Math.max(0, ctx.values.maxM16Goals - (action ? 1 : 0));
  const shown = ready.slice(0, cap);
  if (action && shown.length === 0 && ready.length > 0) action = signsAction(false);
  const shownPoints = shown.reduce((n, x) => n + x.fact.points, 0);

  const planLine = (): string | null => {
    if (beyond || !leg) return null;
    if (action?.unlocks.length) return action.text;
    if (!shown.length) return null;
    const after = buyable(ctx, banked + shownPoints);
    const last = after.signs[after.signs.length - 1];
    return last ? S('bank', { list: joinAnd(shown.map((x) => x.fact.name)), sign: human(last) }) : null;
  };

  // ---- per-character lines (FR-18) ----
  const unlockedAfter = chartState(ctx, action?.unlocks ?? []);
  const characters: CharacterSigns[] = state.characters.map((c) => characterSigns(ctx, c, unlockedAfter, S));

  const milestone = beyond || !leg ? null : milestoneLine(leg, banked + readyPoints, S);
  const nextCharacter = meta?.goals.some((g) => g.entryId === 'metapath.goal.next-character')
    ? S('next-character')
    : null;
  const describe = (x: Candidate) => describeConstellation(ctx, x, C, mapName);
  const alsoReady = ready
    .slice(shown.length)
    .map((x) =>
      S('also-item', { name: x.fact.name, points: x.fact.points, eta: aboutDuration(x.effortSeconds) }),
    );
  const later = candidates
    .filter((x) => x.kind === 'afk-hours' || x.kind === 'later-level')
    .sort((a, b) => a.fact.world - b.fact.world || a.fact.rawIndex - b.fact.rawIndex)
    .map((x) => laterLine(ctx, x, S, mapName))
    .filter(Boolean);

  // ---- F4: the challenge closest to done (FR-13) ----
  const challenges = candidates
    .filter((x) => x.kind === 'challenge')
    .sort(byCloseness)
    .slice(0, ctx.values.maxChallenges);
  const activePlay: ActivePlay[] = challenges.flatMap((x) => {
    const t = characterOf(ctx, x.tryWith as number);
    if (!t) return [];
    const ch = sayRaw(kb, ENTRY.challenge, `ch-${x.fact.name.toLowerCase()}`);
    if (!ch) return [];
    const key = x.fact.enter?.key;
    const spends = key
      ? sayRaw(kb, ENTRY.challenge, 'spends-key', { key: keyName(kb, key) })
      : x.fact.enter?.ticket
        ? sayRaw(kb, ENTRY.challenge, x.fact.enter.ticket === 1 ? 'spends-ticket' : 'spends-tickets', {
            tickets: x.fact.enter.ticket,
          })
        : '';
    const text = sayRaw(kb, ENTRY.challenge, x.missing === 1 ? 'line-one' : 'line', {
      challenge: ch,
      k: x.missing,
      recorded: x.count,
      players: x.fact.players,
      who: who(t),
      spends,
    });
    return [
      {
        key: `${ENTRY.challenge}@${x.fact.name}`,
        text,
        estimateSeconds: 300,
        subject: 'account' as const,
        sources: sourcesOf(kb, ENTRY.challenge),
      },
    ];
  });

  const account: ModuleGoal[] = [];
  const walkthroughs: Built['walkthroughs'] = [];
  const signDetails: GoalDetail[] = characters.map((c) => ({ subject: `c${c.index}`, text: c.line }));

  if (!questDone) {
    // ---- F1: the Telescope Goal replaces every F2 and F3 Goal (FR-1) ----
    const plan = telescopePlan(ctx);
    if (plan) {
      const o = plan.opener;
      const s = plan.step;
      let text = '';
      // The step is short (Design Lab copy rule); how to do it leads the Goal's why.
      let stepWhy = '';
      let seconds: number | null = 180;
      if (s.kind === 'open') {
        const eta = s.seconds !== null ? T('open-eta', { eta: aboutDuration(s.seconds) }) : T('open-no-rate');
        text = T('open', {
          who: who(o),
          map: mapName(s.mapIndex),
          kills: s.kills,
          next: s.next === null ? T('the-top') : mapName(s.next),
        });
        stepWhy = [
          T('why-open', { eta, kills: s.kills, next: s.next === null ? T('the-top') : mapName(s.next) }),
          plan.whenFree ? T('why-when-free') : '',
        ]
          .filter(Boolean)
          .join(' ');
        seconds = s.seconds;
      } else if (s.kind === 'talk') {
        text = T('talk', { who: who(o) });
        stepWhy = T('why-talk');
      } else if (s.kind === 'a2') {
        const key = s.candy ? (s.candy.fromStorage ? 'a2-candy-storage' : 'a2-candy') : 'a2-wait';
        const slots = { who: who(o), hours: s.candy?.hours ?? 0, afk: s.afkHours, target: back(o) };
        text = T(key, slots);
        stepWhy = T(`why-${key}`, slots);
      } else {
        text = T('hand-in', { who: who(o) });
        stepWhy = T('why-hand-in');
      }
      // FR-4: what the hand-in opens, counted as if it were done (with the quest's reward candies).
      const after = constellationCandidates(ctx, {
        assumeHandedIn: true,
        extraCandies: ctx.rules.telescope.rewards,
      }).filter((x) => GOAL_KINDS.has(x.kind) && x.fact.name !== 'A-2');
      const p = after.reduce((n, x) => n + x.fact.points, 0);
      const cosmosLeft = currentLeg(ctx, chart)?.leg === 1 ? (currentLeg(ctx, chart)?.remaining ?? 0) : 0;
      const reach =
        p + banked >= cosmosLeft
          ? T('reach-cosmos')
          : T('reach-part', { points: p, need: Math.max(0, cosmosLeft - banked) });
      const why = [
        stepWhy,
        T('why-start'),
        after.length ? T('why-after', { n: after.length, points: p, reach }) : '',
      ]
        .filter(Boolean)
        .join(' ');
      const e = kb.entries[ENTRY.telescope];
      if (text && e) {
        const details: GoalDetail[] = [
          ...(milestone ? [{ subject: 'account' as const, text: milestone }] : []),
          ...signDetails,
          ...(nextCharacter ? [{ subject: 'account' as const, text: nextCharacter }] : []),
        ];
        account.push({
          goal: goalOf(kb, ENTRY.telescope, e.title, `${ENTRY.telescope}@account`, text, why, details, [
            'account.starSigns',
            'characters[*].telescopeRoute',
            'characters[*].npcDialog',
          ]),
          rank: {
            urgency: 'banked',
            ...(seconds !== null ? { cost: effortCost(seconds) } : {}),
          },
        });
      }
    }
  } else {
    // ---- F2 Goals with their Walkthroughs (FR-7, FR-8) ----
    for (const x of shown) {
      const d = describe(x);
      const key = `${ENTRY.constellation}@${x.fact.name}`;
      const goal = goalOf(
        kb,
        ENTRY.constellation,
        d.title,
        key,
        d.steps[0]?.text ?? d.title,
        [d.steps[0]?.why, C('why', { name: x.fact.name, points: x.fact.points })].filter(Boolean).join(' '),
        undefined,
        ['account.starSigns', 'account.supplyRates', 'account.storageItems', 'characters[*].inventoryItems'],
        x.fact.anchor,
      );
      account.push({ goal, rank: { urgency: 'banked', cost: effortCost(x.effortSeconds) } });
      walkthroughs.push({ parentKey: key, view: d.view });
    }
    // ---- F3 Goal, only with a Next Action (FR-17) ----
    if (action) {
      const e = kb.entries[ENTRY.signs];
      const plan = planLine();
      const details: GoalDetail[] = [
        ...(milestone ? [{ subject: 'account' as const, text: milestone }] : []),
        ...(plan && plan !== action.text ? [{ subject: 'account' as const, text: plan }] : []),
        ...signDetails,
        ...(nextCharacter ? [{ subject: 'account' as const, text: nextCharacter }] : []),
        ...(alsoReady.length
          ? [{ subject: 'account' as const, text: S('also', { list: alsoReady.join(', ') }) }]
          : []),
        ...later.map((t) => ({ subject: 'account' as const, text: t })),
      ];
      if (e)
        account.push({
          goal: goalOf(
            kb,
            ENTRY.signs,
            e.title,
            `${ENTRY.signs}@account`,
            action.text,
            [action.why, S('why')].filter(Boolean).join(' '),
            details,
            ['account.starSigns', 'characters[*].starSigns', 'characters[*].telescopeRoute'],
          ),
          rank: { urgency: 'banked', cost: effortCost(ctx.values.visitSeconds) },
        });
    }
  }

  const next: NextConstellation[] = ready.map((x) => ({
    name: x.fact.name,
    text: describe(x).headline,
    points: x.fact.points,
    effortSeconds: x.effortSeconds,
    shown: shown.includes(x),
  }));
  const view: StarSignsView = {
    points: ctx.signs.pointsUnspent,
    unlockedNodes: chart.count,
    hydronAt: ctx.rules.chartGates.hydron,
    slots: chart.slots,
    questDone,
    milestone,
    plan: questDone ? (action?.text ?? planLine()) : null,
    next,
    later: [...later, ...activePlay.map((a) => a.text)],
    nextCharacter,
    characters,
    sources: sourcesOf(kb, ENTRY.signs),
  };

  // FR-14: constellations claimed since the Play Session started.
  const done: Done[] = [];
  const was = before?.account.starSigns?.claimed;
  if (was)
    for (const f of constellationFacts(kb))
      if (ctx.signs.claimed.includes(f.rawIndex) && !was.includes(f.rawIndex))
        done.push({
          key: `${ENTRY.constellation}@${f.name}`,
          text: C('done', { name: f.name }),
          confirmedAt: state.asOf,
        });

  return { account, walkthroughs, activePlay, done, view };
}

/** The signs the unlocking character's own fit set gains from this trip (FR-17.1 "and align"). */
function fitGain(ctx: StarContext, c: CharacterState, before: ChartState, after: ChartState): string[] {
  const a = activityOf(ctx, c);
  if (!a) return [];
  const was = fitSet(ctx, a, before.unlocked, before.slots);
  const now = fitSet(ctx, a, after.unlocked, after.slots);
  const worn = wornOf(ctx, c);
  return now.filter((s) => !was.includes(s) && !worn.includes(s));
}

type Say = (key: string, slots?: Record<string, string | number>) => string;

function milestoneLine(leg: { leg: number; remaining: number }, have: number, S: Say): string {
  return S('milestone', { have, need: leg.remaining, leg: S(`leg-${leg.leg}`) });
}

function characterSigns(ctx: StarContext, c: CharacterState, chart: ChartState, S: Say): CharacterSigns {
  const a = activityOf(ctx, c);
  const worn = wornOf(ctx, c);
  const reach = reachesTelescope(ctx, c);
  const kills = reach === true ? null : killsToTelescope(ctx, c);
  if (!a)
    return {
      index: c.index,
      activity: null,
      slots: chart.slots,
      worn: worn.map(human),
      recommended: [],
      afterCosmos: null,
      onceUnlocked: null,
      matches: true,
      canChange: reach,
      killsToTelescope: kills,
      line: S('char-none', { who: who(c), activity: activityWord(rawActivity(c)) }),
    };
  const want = fitSet(ctx, a, chart.unlocked, chart.slots);
  const matches = want.length === worn.length && want.every((s) => worn.includes(s));
  const onlyStarters = [...want, ...worn].every((s) => isStarter(ctx, s));
  let line = S('char-line', { who: who(c), activity: activityWord(a), set: want.map(human).join(' + ') });
  if (matches) line += S('char-ok');
  else if (reach !== true && kills !== null)
    line += S(worn.length ? 'char-far' : 'char-far-empty', {
      worn: worn.map(human).join(' + '),
      kills: thousands(kills),
    });
  else if (onlyStarters || reach === true)
    line += S(worn.length ? 'char-swap' : 'char-swap-empty', { worn: worn.map(human).join(' + ') });
  let after: string[] | null = null;
  let once: string | null = null;
  if (chart.slots === 1) {
    const x = afterCosmos(ctx, chart, a);
    after = x.set.map(human);
    once = x.once ? human(x.once) : null;
    line += S('char-after', { set: after.join(' + ') });
    if (once) line += S('char-once', { sign: once });
  }
  return {
    index: c.index,
    activity: activityWord(a),
    slots: chart.slots,
    worn: worn.map(human),
    recommended: want.map(human),
    afterCosmos: after,
    onceUnlocked: once,
    matches,
    canChange: reach,
    killsToTelescope: kills,
    line,
  };
}

const keyName = (kb: StarKnowledge, rawName: string) => human(starRules(kb)?.keys[rawName] ?? rawName);

function describeConstellation(
  ctx: StarContext,
  x: Candidate,
  C: Say,
  mapName: (m: number) => string,
): { title: string; headline: string; steps: WalkthroughStepView[]; view: WalkthroughView } {
  const f = x.fact;
  const kb = ctx.kb;
  const map = mapName(f.mapIndex);
  const lineOf = (k: number) => (k <= 1 ? 'one' : 'many');
  const what =
    x.kind === 'claim'
      ? C('what-claim')
      : f.kind === 'level'
        ? C('what-level', { level: f.min, players: f.players })
        : f.kind === 'afk'
          ? C('what-afk', { hours: f.min, players: f.players })
          : f.kind === 'task'
            ? C(`task-${f.name.toLowerCase()}-short`, { players: f.players })
            : f.min > 0 || f.max < 99
              ? C(`what-class-${f.name.toLowerCase()}`)
              : C(`what-visit-${lineOf(f.players)}`, { players: f.players });
  const headline = C('headline', { map, what });
  const title = C('title', { name: f.name, map, what });
  const sources: SourceRef[] = sourcesOf(kb, ENTRY.constellation).map((s) =>
    s.url === LOCATIONS ? { ...s, url: `${LOCATIONS}#${f.anchor}` } : s,
  );
  // A step is short (Design Lab copy rule); the rest of how to do it is its why, behind the tap.
  const step = (s: ConstellationStep): { text: string; why: string } => {
    const c = characterOf(ctx, s.character) as CharacterState;
    const base = { who: who(c), map, world: f.world, target: back(c) };
    switch (s.kind) {
      case 'talk':
        return { text: C('step-talk', base), why: '' };
      case 'visit':
        return { text: C('step-visit', base), why: C('why-back', base) };
      case 'task': {
        const task = `task-${f.name.toLowerCase()}`;
        return {
          text: C('step-task', { ...base, task: C(task) }),
          why: [C(`why-${task}`), C('why-task', base)].filter(Boolean).join(' '),
        };
      }
      case 'candy-withdraw':
        return { text: C('step-candy-withdraw', { ...base, hours: s.candy?.hours ?? f.min }), why: '' };
      case 'candy':
        return {
          text: C('step-candy', { ...base, hours: s.candy?.hours ?? f.min }),
          why: C('why-candy', base),
        };
      case 'key-withdraw':
        return { text: C('step-key-withdraw', { ...base, key: keyName(kb, f.enter?.key ?? '') }), why: '' };
      case 'claim': {
        const e = f.enter;
        if (e?.key) {
          const slots = { ...base, key: keyName(kb, e.key), arena: mapName(e.arena ?? f.mapIndex) };
          return { text: C('step-claim-key', slots), why: C('why-claim-key', slots) };
        }
        if (e?.ticket) {
          const key = e.ticket === 1 ? 'step-claim-ticket' : 'step-claim-tickets';
          const slots = { ...base, tickets: e.ticket };
          return { text: C(key, slots), why: C(key.replace('step-', 'why-'), slots) };
        }
        return { text: C('step-claim', base), why: C('why-back', base) };
      }
    }
  };
  const steps: WalkthroughStepView[] = x.steps.map((s, i) => {
    const st = step(s);
    return {
      order: i + 1,
      text: st.text,
      when: i === 0 ? 'now' : 'after',
      after: i === 0 ? [] : [i],
      subject: `c${s.character}`,
      progress: null,
      why: st.why || null,
      sources,
    };
  });
  const tree = x.recorded.map((i) => {
    const c = characterOf(ctx, i);
    return { depth: 0, text: C('recorded', { who: c ? who(c) : `C${i + 1}` }), done: true };
  });
  const view: WalkthroughView = {
    targetId: `${ENTRY.constellation}@${f.name}`,
    collapsed: C('collapsed', {
      name: f.name,
      recorded: Math.min(x.count, f.players),
      players: f.players,
      eta: aboutDuration(x.effortSeconds),
    }),
    steps,
    tree,
    otherWays: [],
    caveats: x.reachUnknown ? [C('reach-unknown')] : [],
  };
  return { title, headline, steps, view };
}

function laterLine(ctx: StarContext, x: Candidate, S: Say, mapName: (m: number) => string): string {
  const f = x.fact;
  if (x.kind === 'afk-hours')
    return S(x.missing === 1 ? 'later-afk-one' : 'later-afk', {
      name: f.name,
      hours: f.min,
      map: mapName(f.mapIndex),
      k: x.missing,
      recorded: x.count,
      players: f.players,
    });
  const s = x.short;
  const c = s ? characterOf(ctx, s.index) : undefined;
  if (!s || !c) return '';
  const line = S('later-level', { name: f.name, level: f.min, players: f.players, who: who(c), gap: s.gap });
  return s.more > 0 ? `${line}${S('later-level-more', { more: s.more })}` : line;
}

function goalOf(
  kb: StarKnowledge,
  id: string,
  title: string,
  key: string,
  text: string,
  why: string,
  details: GoalDetail[] | undefined,
  fields: string[],
  anchor?: string,
): Goal {
  const e = kb.entries[id];
  const sources = sourcesOf(kb, id).map((s) =>
    anchor && s.url === LOCATIONS ? { ...s, url: `${LOCATIONS}#${anchor}` } : s,
  );
  return {
    id,
    title,
    system: 'star-signs',
    category: 'compounding',
    nextAction: {
      key,
      entryId: id,
      text,
      why,
      sources,
      stale: false,
      contested: null,
      confidence: e?.confidence ?? 'M',
      provenance: { entryIds: [id, 'star-signs.fact.constellations', 'star-signs.fact.chart'], fields },
    },
    milestone: null,
    ...(details?.length ? { details } : {}),
  };
}

export interface StarSignsModuleDeps {
  kb: StarKnowledge;
}

/** The engine module (TR-1). It reads M2's result itself (runMetaPath), like M14's step. */
export function createStarSignsModule(deps: StarSignsModuleDeps): EngineModule {
  return {
    id: 'star-signs',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    run(input: EngineInput): ModuleOutput {
      const full = input.knowledge.kb;
      if (!full) return {};
      const meta = runMetaPath(input.state, full, input.now);
      const start = input.history.sessionStartedAt;
      const before =
        start === null
          ? null
          : (input.history.entries.filter((e) => e.lastCloudSave < start).at(-1)?.state ?? null);
      const r = buildStarSigns(input.state, deps.kb, meta, before);
      // Out of scope until a W4 spec: D-row constellations and Infinite Stars (M10 FR-26).
      const w4 = (meta.stage.world ?? 0) >= 4;
      return {
        ...(w4 ? { notCovered: [W4_NOT_COVERED] } : {}),
        account: { goals: r.account, activePlay: r.activePlay, doneThisSession: r.done },
        walkthroughs: r.walkthroughs,
        starSigns: r.view,
      };
    },
  };
}
