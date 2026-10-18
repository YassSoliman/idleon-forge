// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `buildNowView(result, prefs, ui)` (M10 TR-3): pure and deterministic. All ordering, capping and
// wording of the Now screen happens here, so the components and the golden text can't drift from
// the engine (red-team #5). It never ranks: it replays the engine's order (and the order frozen for
// the Play Session, D6), drops what the player skipped or dismissed, and caps what is left.

import { playerSources } from '@idleon-forge/knowledge/player-sources';
import { toolboxPage } from '@idleon-forge/knowledge/toolbox-site';
import type {
  ActivePlay,
  CharacterResult,
  Done,
  EngineResult,
  Goal,
  HigherLeverage,
  InfoLine,
  NextAction,
  SourceRef,
  SpendLine,
  VerdictKind,
} from '../result';
import { buildsView } from './build-view';
import { cardsView } from './cards-view';
import { checklistView } from './checklist-view';
import { aboutDuration, compact, plural, shortDuration } from './format';
import {
  dismissActive,
  type NowPrefs,
  type SessionClock,
  sessionEndsAt,
  skipActive,
  skipExpiresAt,
} from './prefs';
import { skillGridView, skillsView } from './skills-view';
import { starSignsView } from './star-signs-view';
import type {
  ActivePlayView,
  Banner,
  CapPillView,
  ControlsView,
  DoneView,
  FocusCard,
  GoalView,
  HigherLeverageView,
  LadderStepView,
  NextActionView,
  NowView,
  PillView,
  PurposeItemView,
  RosterRow,
  SourceView,
  SpendLineView,
  SpendPlanView,
} from './view';

export const CHARACTER_GOAL_CAP = 3;
export const ACCOUNT_GOAL_CAP = 5;
export const SPEND_LINE_CAP = 5;
/** R-PILL-1: cap pills on a Roster row before "+n". */
export const ROW_CAP_PILLS = 3;
export const EXPECTED_RETURN_CHIPS = [2, 4, 8, 12, 24].map((h) => h * 3600);

export interface NowUi {
  /** CharacterState.index in Focus, or null for the Roster. */
  focus: number | null;
  /** Subjects showing everything: `c<index>`, `account`, `spend`. */
  expanded: ReadonlySet<string>;
  /** Characters visited this Play Session (FR-12). */
  visited: ReadonlySet<number>;
  /** The character just left, for the "Left <name>" line (FR-10, FR-14). */
  leftFrom: number | null;
  /** The Visit Order frozen for this Play Session (D6); null replays `result.visitOrder`. */
  frozenOrder: readonly number[] | null;
  now: number;
  /** Who the screen treats as being played (FR-4, FR-14 ruling). null: no marker. */
  playing: { index: number; status: 'confirmed' | 'assumed' | 'next-up' } | null;
  /** The account's last cloud save, for the end of the Play Session (D3). */
  lastCloudSave: number | null;
  /** Minutes east of UTC, for "14:02" times. */
  tzOffsetMinutes: number;
  appVersion: string;
  /** Banners the caller knows about (TR-11): a newer build is live, offline or a sync error. */
  update: null | { text: string };
  connection: null | { text: string };
}

export const DEFAULT_UI: NowUi = {
  focus: null,
  expanded: new Set(),
  visited: new Set(),
  leftFrom: null,
  frozenOrder: null,
  now: 0,
  playing: null,
  lastCloudSave: null,
  tzOffsetMinutes: 0,
  appVersion: 'local',
  update: null,
  connection: null,
};

// ---- small renderers --------------------------------------------------------------------------

const CATEGORY_TAG: Record<Goal['category'], string> = {
  blocker: 'Fix',
  compounding: 'Grow',
  spendable: 'Spend',
  nice: 'Extra',
};

const VERDICT_TEXT: Record<VerdictKind, string> = {
  ready: 'Ready',
  fix: 'Fix before you leave',
  unknown: 'Unknown',
};

const UNKNOWN_TEXT = {
  'no-purpose': 'What is this character for?',
  'cannot-tell': "Can't tell from the save",
  'not-covered': "AFK safety isn't covered yet",
} as const;

export const NOT_COVERED_BANNER = "Nothing ActiveOn checks needs fixing · AFK safety isn't covered yet";

/** TR-13: only https URLs become links. */
export function safeHref(url: string): string | null {
  try {
    return new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * `entryId` names the entry (or `<entryId>@<subject>` key) the Sources belong to; it picks the Toolbox
 * website page (#74 follow-up) for the credit, and for the link when no wiki or guide covers the entry.
 */
export function sourceView(sources: readonly SourceRef[], stale: boolean, entryId?: string): SourceView {
  const [best, ...rest] = playerSources(sources);
  const toolbox = sources.find((s) => s.tier === 1);
  const site = toolbox && entryId ? toolboxPage(entryId.split('@')[0] ?? '') : null;
  const more = rest.map((s) => ({
    text: s.label,
    href: safeHref(s.url),
    tier: s.tier,
    verifiedOn: s.verifiedOn,
  }));
  const credit = toolbox ? `Calculated by IdleOn Toolbox · ${toolbox.gameVersion}` : null;
  if (best)
    return { text: best.label, href: safeHref(best.url), credit, creditHref: site?.url ?? null, stale, more };
  // No wiki or guide: link the Toolbox page itself; the credit beside it stays text (one link, not two).
  return { text: site?.title ?? null, href: site?.url ?? null, credit, creditHref: null, stale, more };
}

function actionView(
  a: NextAction,
  title: string,
  category: Goal['category'],
  controls: ControlsView,
): NextActionView {
  return {
    key: a.key,
    entryId: a.entryId,
    tag: `${CATEGORY_TAG[category]} · ${title}`,
    text: a.text,
    why: a.why,
    source: sourceView(a.sources, a.stale, a.entryId),
    stale: a.stale,
    contested: a.contested
      ? {
          sides: a.contested.sides.map((s) => ({
            text: s.text,
            sources: s.sources.map((x) => sourceView([x], false, a.entryId)),
          })),
        }
      : null,
    controls,
    provenance: a.provenance,
  };
}

/** FR-11: Purpose lines in the Focus card: the first 3 show, the rest behind "show more". */
export const PURPOSE_SHOWN = 3;

/** M4 → the Focus card's Purpose block (Design Lab: a Quest line with a short ladder). */
export function purposeItems(c: Pick<CharacterResult, 'purpose'>): PurposeItemView[] {
  return c.purpose.map((l, i) => {
    const base = l.text ?? (l.milestone ? milestoneText(l.milestone) : l.title);
    const behind = l.badges.includes('parser-behind') ? ' · may be out of date' : '';
    const stopHere = l.milestone?.stopHere ?? false;
    const stop = stopHere ? ' · consider stopping here' : '';
    const ladder: LadderStepView[] = [];
    const d = l.ladder;
    if (i === 0 && d && d.next !== null) {
      const unit = (n: number) =>
        d.unit === 'level' ? `Lv ${compact(n)}` : `${compact(n)}${d.unit ? ` ${d.unit}` : ''}`;
      const eta = (s: number | null) =>
        s === null ? '' : `${aboutDuration(s)}${d.mean ? ' on average' : ''}`;
      ladder.push({ state: 'done', label: unit(d.current), note: d.projected ? 'now (projected)' : 'now' });
      ladder.push({ state: 'next', label: unit(d.next), note: eta(d.nextEtaSeconds) });
      if (d.later !== null)
        ladder.push({ state: 'later', label: unit(d.later), note: eta(d.laterEtaSeconds) });
    }
    return {
      goalId: l.goalId,
      text: `${base}${behind}${stop}`,
      detail: l.detail ?? null,
      worthwhile: l.worthwhile,
      stopHere,
      badges: l.badges,
      source: l.sources.length ? sourceView(l.sources, l.badges.includes('stale'), l.goalId) : null,
      bar: d && d.next !== null && d.next > 0 ? { current: Math.min(d.current, d.next), next: d.next } : null,
      ladder,
      more: i >= PURPOSE_SHOWN,
    };
  });
}

export function milestoneText(m: Goal['milestone']): string | null {
  if (!m) return null;
  const eta = m.etaSeconds === null ? '' : ` · ${aboutDuration(m.etaSeconds)}`;
  return `${compact(m.current)} ${m.unit} · next ${compact(m.next)}${eta}`;
}

export function goalView(g: Goal): GoalView {
  const blocker = g.category === 'blocker';
  return {
    id: g.id,
    title: g.title,
    system: g.system,
    category: g.category,
    blocker,
    // D2, D9: blockers can be skipped, never dismissed; Report this everywhere.
    action: actionView(g.nextAction, g.title, g.category, { skip: true, notForMe: !blocker, report: true }),
    milestone: milestoneText(g.milestone),
    details: (g.details ?? []).map((d) => ({ key: `${g.id}#${d.subject}`, text: d.text })),
    walkthrough: g.walkthrough ?? null,
  };
}

const clockTime = (at: number, tz: number) => {
  const d = new Date(at + tz * 60_000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

const doneView = (d: Done, tz: number): DoneView => ({ ...d, time: clockTime(d.confirmedAt, tz) });

// ---- the build --------------------------------------------------------------------------------

interface Filtered {
  blockers: Goal[];
  skippedBlockers: number;
  /** Every skipped key on this subject (blockers and Goals), for "n skipped · undo". */
  skippedKeys: string[];
  goals: Goal[];
  skipped: number;
  dismissed: Goal[];
}

/** TR-3 step 0: the frozen order with dropped indexes removed and new ones appended (D6). */
export function displayOrder(result: EngineResult, frozen: readonly number[] | null): number[] {
  if (frozen === null) return [...result.visitOrder];
  const present = new Set(result.characters.map((c) => c.index));
  const kept = frozen.filter((i) => present.has(i));
  const added = result.visitOrder.filter((i) => !kept.includes(i));
  return [...kept, ...added];
}

export function buildNowView(result: EngineResult, prefs: NowPrefs, ui: NowUi): NowView {
  const clock: SessionClock = {
    now: ui.now,
    sessionStartedAt: result.sessionStartedAt,
    lastCloudSave: ui.lastCloudSave,
  };
  const build = result.versions.gameBuild;
  const skipped = (key: string) => {
    const s = prefs.skips[key];
    return s !== undefined && skipActive(s, clock);
  };
  const dismissed = (key: string) => {
    const d = prefs.dismissals[key];
    return d !== undefined && dismissActive(d, build);
  };
  const stageUnknown = result.stage.id === 'unknown';
  const nameOf = (i: number) => result.characters.find((c) => c.index === i)?.name ?? `Character ${i + 1}`;

  const filter = (goals: Goal[], blockerKeys: readonly string[]): Filtered => {
    const blockerSet = new Set(blockerKeys);
    const out: Filtered = {
      blockers: [],
      skippedBlockers: 0,
      skippedKeys: [],
      goals: [],
      skipped: 0,
      dismissed: [],
    };
    for (const g of goals) {
      const key = g.nextAction.key;
      if (g.category === 'blocker' || blockerSet.has(key)) {
        if (skipped(key)) {
          out.skippedBlockers++;
          out.skippedKeys.push(key);
        } else out.blockers.push(g);
        continue;
      }
      // Stage unknown (M2 FR-3): only Verdict blockers render.
      if (stageUnknown) continue;
      if (dismissed(key)) out.dismissed.push(g);
      else if (skipped(key)) {
        out.skipped++;
        out.skippedKeys.push(key);
      } else out.goals.push(g);
    }
    return out;
  };

  // Per character: filter, Verdict skip rules (D2, D7), pills.
  const perChar = new Map(
    result.characters.map((c) => {
      const f = filter(c.goals, c.verdict.blockerKeys);
      const unknownKey = `unknown@c${c.index}`;
      const cannotTell = c.verdict.kind === 'unknown' && c.verdict.unknownReason === 'cannot-tell';
      const unknownSkipped = cannotTell && skipped(unknownKey);
      const blockersAllSkipped = c.verdict.kind === 'fix' && f.blockers.length === 0;
      const effective: VerdictKind = blockersAllSkipped ? 'ready' : c.verdict.kind;
      const pill: PillView = blockersAllSkipped
        ? { kind: 'ready', text: `Ready · ${f.skippedBlockers} skipped` }
        : unknownSkipped
          ? { kind: 'unknown', text: 'Unknown · skipped' }
          : { kind: c.verdict.kind, text: VERDICT_TEXT[c.verdict.kind] };
      const expanded = ui.expanded.has(`c${c.index}`);
      const shown = expanded ? f.goals : f.goals.slice(0, CHARACTER_GOAL_CAP);
      // R-PILL-1: cap pills, minus the ones skipped today (their keys join the undo list).
      const capLines = (c.info ?? []).filter((l) => l.kind === 'cap');
      const caps = capLines.filter((l) => !skipped(l.key)).map((l) => capView(l, ui.now));
      const skippedCaps = capLines.filter((l) => skipped(l.key)).map((l) => l.key);
      return [
        c.index,
        {
          c,
          f,
          effective,
          pill,
          unknownSkipped,
          cannotTell,
          shown,
          hidden: f.goals.length - shown.length,
          caps,
          skippedCaps,
        },
      ] as const;
    }),
  );

  const order = displayOrder(result, ui.frozenOrder).filter((i) => perChar.has(i));
  const total = order.length;
  const hasAnything = (i: number) => {
    const p = perChar.get(i);
    return p !== undefined && (p.effective !== 'ready' || p.f.goals.length > 0 || p.caps.length > 0);
  };

  const summaryOf = (i: number): string => {
    const p = perChar.get(i);
    if (!p) return '';
    const firstBlocker = p.f.blockers[0];
    if (p.effective === 'fix' && firstBlocker) return firstBlocker.nextAction.text;
    if (p.effective === 'unknown' && p.c.verdict.unknownReason) {
      // M4 FR-14: an activity no Contribution names says which one ("Not covered yet: Cooking").
      if (p.c.verdict.unknownReason === 'not-covered')
        return p.c.purposeStatus === 'not-covered' && p.c.purposeNote
          ? p.c.purposeNote
          : 'Not covered yet: AFK safety';
      return UNKNOWN_TEXT[p.c.verdict.unknownReason];
    }
    const top = p.f.goals[0];
    // R-PILL-1: a row whose only items are cap pills shows just the pills.
    return top ? top.nextAction.text : p.caps.length > 0 ? '' : 'Nothing to do here';
  };

  const spendChipText = (c: CharacterResult) =>
    c.spendChip
      ? `Spend here: ${plural(c.spendChip.lines, 'buy')}, ~${compact(c.spendChip.coins)} → Spend Plan`
      : null;

  const roster: RosterRow[] = order.map((i, k) => {
    const p = perChar.get(i) as NonNullable<ReturnType<typeof perChar.get>>;
    const c = p.c;
    const summary = summaryOf(i);
    const playing = ui.playing?.index === i && ui.playing.status !== 'next-up';
    return {
      index: i,
      position: k + 1,
      name: c.name,
      classLabel: c.classLabel,
      level: c.level,
      activity: c.activityLabel,
      map: c.mapLabel,
      playing,
      nextUp: ui.playing?.index === i && ui.playing.status === 'next-up',
      pill: p.pill,
      caps: p.caps.slice(0, ROW_CAP_PILLS),
      moreCaps: Math.max(0, p.caps.length - ROW_CAP_PILLS),
      summary,
      purpose: purposeItems(c)[0]?.text ?? null,
      spendChip: spendChipText(c),
      accessibleName: [
        `${k + 1}.`,
        c.name,
        `${c.classLabel} level ${c.level}`,
        c.activityLabel,
        c.mapLabel,
        p.pill.text,
        ...p.caps.map((x) => x.label),
        summary,
      ]
        .filter(Boolean)
        .join(', '),
    };
  });

  // ---- progress and All set (FR-9, FR-25, D4, D7, D9) ----
  let ready = 0;
  let fix = 0;
  let unknown = 0;
  let notCoveredUnknowns = 0;
  let skippedForAllSet = 0;
  let blockingUnknowns = 0;
  for (const i of order) {
    const p = perChar.get(i);
    if (!p) continue;
    if (p.effective === 'ready') ready++;
    else if (p.effective === 'fix') fix++;
    else unknown++;
    if (p.effective === 'unknown' && p.c.verdict.unknownReason === 'not-covered') notCoveredUnknowns++;
    if (p.c.verdict.kind === 'fix') skippedForAllSet += p.f.skippedBlockers;
    if (p.cannotTell) {
      if (p.unknownSkipped) skippedForAllSet++;
      else blockingUnknowns++;
    }
  }
  const acct = filter(result.account.goals, result.account.blockerKeys);
  const accountBlockersFiring = acct.blockers.length;
  skippedForAllSet += acct.skippedBlockers;
  const safetyUnknown = result.account.safety === 'unknown';
  const safetySkipped = safetyUnknown && skipped('unknown@account');
  if (safetySkipped) skippedForAllSet++;
  const afkNotCovered = notCoveredUnknowns > 0;
  const allSetHolds =
    fix === 0 && blockingUnknowns === 0 && (!safetyUnknown || safetySkipped) && accountBlockersFiring === 0;

  let allSet: NowView['allSet'] = null;
  if (allSetHolds) {
    const skippedText = skippedForAllSet > 0 ? ` (${skippedForAllSet} skipped)` : '';
    if (afkNotCovered) {
      allSet = { text: NOT_COVERED_BANNER, detail: null, skipped: skippedForAllSet, covered: false };
    } else {
      const fill = result.firstFill;
      const who =
        fill && fill.subject !== 'account'
          ? `${nameOf(Number(fill.subject.slice(1)))}'s ${fill.what ?? fill.label}`
          : fill?.label;
      const fillText = fill
        ? `First thing fills up in ${aboutDuration((fill.at - ui.now) / 1000)}: ${who}`
        : "Nothing fills up before you're back";
      // Say what is full: quick-collect caps (the pills) and Next Actions already at their cap (R3 QA P3).
      const n = result.alreadyFull;
      const full =
        n > 0
          ? ` · ${n} ${n === 1 ? 'thing is' : 'things are'} already full: collect ${n === 1 ? 'it' : 'them'} before you go`
          : '';
      allSet = {
        text: `All set: safe to log off${skippedText}`,
        detail: `${fillText}${full}`,
        skipped: skippedForAllSet,
        covered: true,
      };
    }
  }

  const unknownText = unknown > 0 ? ` · ${unknown} Unknown` : '';
  const label =
    allSet?.covered === true
      ? `safe to log off${unknownText}`
      : [
          `${ready} of ${total} Ready`,
          fix > 0 ? `fix ${fix} before you leave` : null,
          unknown > 0 ? `${unknown} Unknown` : null,
          accountBlockersFiring > 0 ? `fix ${accountBlockersFiring} in Account` : null,
        ]
          .filter(Boolean)
          .join(' · ');

  // ---- Focus ----
  const focusCard = (() => {
    const i = ui.focus;
    if (i === null) return null;
    const p = perChar.get(i);
    if (!p) return null;
    const c = p.c;
    const k = order.indexOf(i) + 1;
    // "n left" counts what is still to do after this position, so it never exceeds the positions left
    // ("5 of 5 · 4 left" read as a contradiction); the last position reads "last one".
    const left = order.slice(k).filter((j) => !ui.visited.has(j) && hasAnything(j)).length;
    const nextTarget = order.find((j) => j !== i && !ui.visited.has(j) && hasAnything(j)) ?? null;
    const playing =
      ui.playing?.index === i
        ? ui.playing.status === 'next-up'
          ? 'Next up'
          : 'you are on this character'
        : null;
    const leftFrom = ui.leftFrom !== null && ui.leftFrom !== i ? perChar.get(ui.leftFrom) : undefined;
    const reason = c.verdict.kind === 'unknown' ? c.verdict.unknownReason : null;
    const hl = stageUnknown ? null : c.higherLeverage;
    const card: FocusCard = {
      index: i,
      name: c.name,
      classLabel: c.classLabel,
      level: c.level,
      activity: c.activityLabel,
      map: c.mapLabel,
      strip: order.map((j, n) => {
        const q = perChar.get(j);
        return {
          index: j,
          label: `${n + 1} · ${q?.c.name ?? ''}`,
          accessibleName: `${q?.c.name ?? ''}, ${q?.pill.text ?? ''}`,
          kind: q?.effective ?? 'unknown',
          current: j === i,
        };
      }),
      // Only the last position reads "last one"; nothing left to do after an earlier one reads how many
      // come after it, never "3 of 5 · 0 left" (R3 QA P3) nor "last one" on every page (R6 QA).
      position: `${k} of ${total} in your Visit Order · ${
        k >= total ? 'last one' : left > 0 ? `${left} left` : `${total - k} after it`
      }`,
      playing,
      left: leftFrom
        ? {
            index: leftFrom.c.index,
            text: `Left ${leftFrom.c.name} ✓ ${leftFrom.c.doneThisSession.length} done · ${leftFrom.pill.text}`,
          }
        : null,
      pill: p.pill,
      caps: p.caps,
      blockers: p.f.blockers.map(goalView),
      skippedBlockers: p.f.skippedBlockers,
      unknown: reason
        ? {
            reason,
            text:
              reason === 'not-covered' && c.purposeStatus === 'not-covered' && c.purposeNote
                ? c.purposeNote
                : UNKNOWN_TEXT[reason],
            note: reason === 'no-purpose' ? (c.purposeNote ?? null) : null,
            suggestion:
              reason === 'no-purpose' && c.verdict.suggestion
                ? actionView(c.verdict.suggestion, 'Purpose', 'compounding', {
                    skip: false,
                    notForMe: false,
                    report: true,
                  })
                : null,
            skipKey: reason === 'cannot-tell' ? `unknown@c${i}` : null,
            skipped: p.unknownSkipped,
          }
        : null,
      purpose: purposeItems(c),
      purposeStatus: c.purposeStatus ?? null,
      goals: p.shown.map(goalView),
      hiddenCount: p.hidden,
      skippedCount: p.f.skipped,
      skippedKeys: [...p.f.skippedKeys, ...p.skippedCaps],
      dismissed: p.f.dismissed.map((g) => ({ key: g.nextAction.key, text: g.nextAction.text })),
      higherLeverage: hl && !dismissed(hl.key) ? higherLeverageView(hl, nameOf) : null,
      higherLeverageNote:
        result.higherLeverageStatus === 'paused-parser-behind'
          ? 'comparisons paused: game updated, parser not caught up'
          : result.higherLeverageStatus === 'unavailable'
            ? 'comparisons unavailable'
            : null,
      activePlay: c.activePlay.map((a) => activePlayView(a, nameOf)),
      info: (c.info ?? [])
        .filter((l) => l.kind !== 'cap')
        .map((l) => ({
          key: l.key,
          text: l.text,
          source: l.sources.length ? sourceView(l.sources, false, l.key) : null,
        })),
      done: c.doneThisSession.map((d) => doneView(d, ui.tzOffsetMinutes)),
      next:
        nextTarget === null
          ? {
              index: null,
              text:
                k >= total
                  ? 'Last one: check the Account list ↓'
                  : 'Nothing left to visit: check the Account list ↓',
            }
          : { index: nextTarget, text: `Next: switch to ${nameOf(nextTarget)} →` },
    };
    return card;
  })();

  // ---- Account ----
  const accountExpanded = ui.expanded.has('account');
  const accountShown = accountExpanded ? acct.goals : acct.goals.slice(0, ACCOUNT_GOAL_CAP);
  const spendPlan = stageUnknown
    ? null
    : spendPlanView(result, prefs, skipped, dismissed, ui.expanded.has('spend'), nameOf);

  // ---- banners (TR-11 order) ----
  const banners: Banner[] = [];
  if (ui.update) banners.push({ kind: 'update', text: ui.update.text });
  if (result.versions.parserBehind)
    banners.push({
      kind: 'patch',
      text: `The game updated${build !== null ? ` (build ${build})` : ''}. ActiveOn's save reader hasn't caught up yet; advice may be off.`,
    });
  if (stageUnknown)
    banners.push({ kind: 'stage-unknown', text: "Can't tell where your account is on the route" });
  if (ui.connection) banners.push({ kind: 'offline', text: ui.connection.text });
  if (allSet)
    banners.push({ kind: 'all-set', text: allSet.detail ? `${allSet.text}. ${allSet.detail}` : allSet.text });

  // ---- Expected Return chips (FR-27) ----
  const used = result.expectedReturn.usedSeconds;
  const learned = result.expectedReturn.learnedSeconds;
  const chips = EXPECTED_RETURN_CHIPS.map((s) => ({
    seconds: s,
    label: shortDuration(s),
    pressed: s === used,
  }));
  if (learned !== null && !EXPECTED_RETURN_CHIPS.includes(learned)) {
    const chip = { seconds: learned, label: `≈${shortDuration(learned)}`, pressed: used === learned };
    const at = chips.findIndex((c) => c.seconds > learned);
    chips.splice(at < 0 ? chips.length : at, 0, chip);
  }

  // ---- what is visible, new since unfocused (FR-34), and when to rebuild (TR-3 step 6) ----
  const visibleKeys = [
    ...[...perChar.values()].flatMap((p) => [...p.f.blockers, ...p.shown].map((g) => g.nextAction.key)),
    ...acct.blockers.map((g) => g.nextAction.key),
    ...accountShown.map((g) => g.nextAction.key),
  ];
  const seen = prefs.seenKeys ? new Set(prefs.seenKeys) : null;
  const newCount = seen ? visibleKeys.filter((k) => !seen.has(k)).length : 0;
  const expiries = Object.values(prefs.skips)
    .filter((s) => skipActive(s, clock))
    .map((s) => skipExpiresAt(s, clock));
  const end = sessionEndsAt(clock);
  if (end !== null) expiries.push(end);
  const future = expiries.filter((t) => t > ui.now);
  const nextExpiry = future.length ? Math.min(...future) : null;

  return {
    progress: {
      ready,
      fix,
      unknown,
      total,
      segments: order.map((i) => {
        const p = perChar.get(i);
        return {
          index: i,
          kind: p?.effective ?? 'unknown',
          label: `${p?.c.name ?? ''}: ${p?.pill.text ?? ''}`,
        };
      }),
      label,
      hidden: total > 0 && notCoveredUnknowns === total,
    },
    allSet,
    roster,
    focus: focusCard,
    account: {
      blockers: acct.blockers.map(goalView),
      skippedBlockers: acct.skippedBlockers,
      safetyUnknown: safetyUnknown
        ? { skipKey: 'unknown@account', skipped: safetySkipped, text: "Unknown: can't tell from the save" }
        : null,
      goals: accountShown.map(goalView),
      hiddenCount: acct.goals.length - accountShown.length,
      skippedCount: acct.skipped,
      skippedKeys: [...acct.skippedKeys, ...(safetySkipped ? ['unknown@account'] : [])],
      dismissed: acct.dismissed.map((g) => ({ key: g.nextAction.key, text: g.nextAction.text })),
      spendPlan,
      done: result.account.doneThisSession.map((d) => doneView(d, ui.tzOffsetMinutes)),
    },
    activePlay: [...result.characters.flatMap((c) => c.activePlay), ...result.account.activePlay].map((a) =>
      activePlayView(a, nameOf),
    ),
    notCovered: result.notCovered.map((n) => n.label),
    banners,
    expectedReturn: { chips },
    footer: {
      app: `ActiveOn ${ui.appVersion}`,
      // versions.knowledge is the Knowledge Base's display string, already "knowledge 2026.10.17.NN".
      knowledge: `knowledge ${result.versions.knowledge.replace(/^knowledge /, '')}`,
      game: `game build ${build ?? '?'}`,
      parserTarget: `parser targets ${result.versions.parserTarget}`,
      failedChecks: result.diagnostics.failedDetectors.length,
    },
    newCount,
    visibleKeys,
    nextExpiry,
    builds: buildsView(result),
    cards: cardsView(result),
    starSigns: starSignsView(result),
    checklist: checklistView(result, prefs, { now: ui.now, tzOffsetMinutes: ui.tzOffsetMinutes }),
    skills: skillsView(result),
    skillGrid: skillGridView(result),
  };
}

/** R-PILL-1: an info line of kind 'cap' as a pill. */
function capView(l: InfoLine, now: number): CapPillView {
  return {
    key: l.key,
    entryId: l.key.split('@')[0] ?? l.key,
    label: l.label ?? l.text,
    text: l.text,
    why: l.why ?? '',
    source: l.sources.length ? sourceView(l.sources, false, l.key) : null,
    fullNow: l.at === null || l.at === undefined || l.at <= now,
  };
}

function higherLeverageView(h: HigherLeverage, nameOf: (i: number) => string): HigherLeverageView {
  return {
    key: h.key,
    kind: h.kind,
    text: h.text,
    why: h.why,
    source: sourceView(h.sources, h.stale, h.textEntryId),
    stale: h.stale,
    partner: h.partnerIndex === null ? null : { index: h.partnerIndex, name: nameOf(h.partnerIndex) },
    decidedBy: { position: 'list position', 'milestone-eta': 'Milestone ETA', 'goal-count': 'Goals served' }[
      h.decidedBy
    ],
    alsoConsidered: h.alsoConsidered.slice(0, 2),
    // FR-21: no Skip today on a Higher-leverage line.
    controls: { skip: false, notForMe: true, report: true },
  };
}

function activePlayView(a: ActivePlay, nameOf: (i: number) => string): ActivePlayView {
  return {
    key: a.key,
    text: a.text,
    estimate: `${aboutDuration(a.estimateSeconds)} of hands-on play`,
    who: a.subject === 'account' ? null : nameOf(Number(a.subject.slice(1))),
    subject: a.subject,
    source: a.sources.length ? sourceView(a.sources, false, a.key) : null,
  };
}

const SINK_LABEL: Record<string, string> = {
  vault: 'the Upgrade Vault',
  stamp: 'stamps',
  bribe: 'bribes',
  'statue-gold': 'Statue Gold',
  p2w: 'Pay 2 Win',
  anvil: 'Anvil coin points',
};

/** M7 FR-18: Skip today and Not for me key on the Spend item plus its ref. */
export const spendLineKey = (l: SpendLine) => `${l.entryId}@${l.steps[0]?.ref ?? l.id}`;

function spendPlanView(
  result: EngineResult,
  _prefs: NowPrefs,
  skipped: (k: string) => boolean,
  dismissed: (k: string) => boolean,
  expanded: boolean,
  nameOf: (i: number) => string,
): SpendPlanView | null {
  const plan = result.account.spendPlan;
  if (!plan) return null;
  const who = (i: number | null) => {
    if (i === null) return null;
    const c = result.characters.find((x) => x.index === i);
    return c ? `${c.name} (${c.classLabel} lv${c.level})` : nameOf(i);
  };
  let skippedCount = 0;
  const skippedKeys: string[] = [];
  const live = plan.lines.filter((l) => {
    const key = spendLineKey(l);
    if (dismissed(key)) return false;
    if (skipped(key)) {
      skippedCount++;
      skippedKeys.push(key);
      return false;
    }
    return true;
  });
  const totals = new Map<number, number>();
  let unpricedSeen = false;
  const views: SpendLineView[] = live.map((l) => {
    const first = l.steps[0];
    const last = l.steps[l.steps.length - 1];
    // A grouped line buys several things (two Vault rows, eight stamps): one "Lv a → b" across them
    // reads as nonsense ("Lv 65 → 30"), so only a single purchase shows its range (M7 request).
    const single = new Set(l.steps.map((s) => s.ref)).size === 1;
    const levels =
      single && first && last && first.fromLevel !== null && last.toLevel !== null
        ? `Lv ${first.fromLevel} → ${last.toLevel}`
        : null;
    let runningTotal: string | null = null;
    if (l.payer !== null && l.coins !== null && (l.status === 'buy' || l.status === 'move-coins')) {
      const t = (totals.get(l.payer) ?? 0) + l.coins;
      totals.set(l.payer, t);
      runningTotal = `total ${compact(t)} on ${nameOf(l.payer)}`;
    }
    let note: string | null = null;
    if (l.status === 'unpriced' && !unpricedSeen) {
      unpricedSeen = true;
      note = 'totals below assume you skip the unchecked items';
    }
    const payerName = l.payer === null ? '' : nameOf(l.payer);
    const statusText = {
      buy: 'buy',
      'move-coins': `withdraw ${compact(l.transfer?.fromBank ?? 0)} from storage on ${payerName}, then buy`,
      'save-for': `save for it: ${compact(l.shortfall?.coins ?? 0)} short`,
      hold: `hold: wait for the Hydrogen discount${l.hold ? ` (${l.hold.discountPct}% of ${l.hold.neededPct}%, about ${l.hold.days}d)` : ''}`,
      unpriced: 'cost not checked',
    }[l.status];
    return {
      id: l.id,
      key: spendLineKey(l),
      text: l.text,
      levels,
      cost: l.coins === null ? 'cost not checked, see the price in game' : `${compact(l.coins)} coins`,
      payer: who(l.payer),
      status: l.status,
      statusText,
      runningTotal,
      note,
      source: l.sources.length ? sourceView(l.sources, l.stale, l.entryId) : null,
      stale: l.stale,
      contested: l.contested,
    };
  });
  const shown = expanded
    ? views
    : views.slice(0, Math.min(SPEND_LINE_CAP, plan.visibleCount || SPEND_LINE_CAP));
  const buys = live.filter((l) => l.status === 'buy' || l.status === 'move-coins');
  const payers = new Set(buys.map((l) => l.payer).filter((p) => p !== null));
  let summary: string;
  if (plan.empty) {
    const cheapest = plan.empty.cheapest;
    summary =
      plan.empty.reason === 'nothing-affordable'
        ? `Nothing worth buying yet${cheapest ? `: next is ${cheapest.text}${cheapest.shortfall ? `, ${compact(cheapest.shortfall.coins)} short` : ''}` : ''}`
        : 'Spend Plan empty';
  } else summary = `${plural(buys.length, 'buy')} now on ${plural(payers.size, 'character')}`;
  const firstBuy = buys[0];
  const goal: GoalView | null = firstBuy
    ? {
        id: 'spend.goal.plan',
        title: 'Spend coins',
        system: 'spend',
        category: 'spendable',
        blocker: false,
        action: {
          key: 'spend.goal.plan@account',
          entryId: 'spend.goal.plan',
          tag: 'Spend · Spend coins',
          text: firstBuy.text,
          why: firstBuy.why,
          source: sourceView(firstBuy.sources, firstBuy.stale, firstBuy.entryId),
          stale: firstBuy.stale,
          contested: null,
          controls: { skip: false, notForMe: false, report: true },
          provenance: { entryIds: firstBuy.provenance.entries, fields: firstBuy.provenance.fields },
        },
        milestone: null,
        details: [],
        walkthrough: null,
      }
    : null;
  return {
    goal,
    lines: shown,
    hiddenCount: views.length - shown.length,
    skippedCount,
    skippedKeys,
    summary,
    unavailable: plan.unavailable.map((s) => `can't price ${SINK_LABEL[s] ?? s} right now`),
  };
}
