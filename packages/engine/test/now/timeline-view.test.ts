// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 Phase 2, TR-4, TR-6, TR-14: the Timeline. The bar producers per module (M3 and M6 through the full
// engine on the scrubbed and public saves), the axis rule D-16, overflow detection (FR-25), Fix targets
// (FR-27), the stale band (§6), grouping of repeats, untimed dedupe (FR-26) and determinism. Characters
// are named by class and level only.
import type { AccountState } from '@idleon-forge/account-state';
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS, TIMELINE_KINDS, withAccount } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { AFK_SAFETY_ENTRIES } from '../../src/afk/evaluate';
import { AFK_INFO_ENTRIES } from '../../src/afk/info';
import { goldenResult } from '../../src/golden';
import { buildNowView, DEFAULT_UI } from '../../src/now/build-now-view';
import { inSpan, span } from '../../src/now/format';
import { EMPTY_PREFS, type NowPrefs } from '../../src/now/prefs';
import { renderTimelineText } from '../../src/now/render-views-text';
import { buildTimelineView, timelineAxisEnd } from '../../src/now/timeline-view';
import type { TimelineView } from '../../src/now/view';
import { KIND_WORDS } from '../../src/now/view-words';
import type { CharacterResult, EngineResult, Goal, InfoLine, TimelineBar } from '../../src/result';

const NOW = 1_792_260_000_000;
const H = 3_600_000;

// ---- hand-written results ----

const goal = (id: string, subject: string, over: Partial<Goal> = {}): Goal => ({
  id,
  title: id,
  system: id.split('.')[0] ?? id,
  category: 'compounding',
  nextAction: {
    key: `${id}@${subject}`,
    entryId: id,
    text: `${id} text`,
    why: 'because',
    sources: [],
    stale: false,
    contested: null,
    confidence: 'H',
    provenance: { entryIds: [id], fields: [] },
  },
  milestone: null,
  ...over,
});

const character = (index: number, goals: Goal[] = [], info: InfoLine[] = []): CharacterResult => ({
  index,
  name: `Char${index}`,
  classId: 'Squire',
  classLabel: 'Squire',
  level: 40 + index,
  activityLabel: 'Fighting',
  mapLabel: null,
  isPlaying: false,
  verdict: {
    kind: goals.some((g) => g.category === 'blocker') ? 'fix' : 'ready',
    blockerKeys: goals.filter((g) => g.category === 'blocker').map((g) => g.nextAction.key),
    unknownReason: null,
    suggestion: null,
  },
  purpose: [],
  goals,
  higherLeverage: null,
  spendChip: null,
  activePlay: [],
  doneThisSession: [],
  firstFill: null,
  info,
});

const bar = (entryId: string, subject: string, over: Partial<TimelineBar> = {}): TimelineBar => ({
  barId: `${entryId}@${subject}`,
  key: `${entryId}@${subject}`,
  entryId,
  system: entryId.split('.')[0] ?? entryId,
  subject: subject as TimelineBar['subject'],
  kind: 'storage',
  what: 'anvil',
  at: NOW + H,
  untimed: false,
  effect: 'blocker',
  fixHolds: true,
  ...over,
});

const pillLine = (index: number): InfoLine => ({
  key: `anvil.check.caps@c${index}`,
  text: 'Collect from the anvil',
  sources: [],
  kind: 'cap',
  label: 'Anvil full · collect',
  at: NOW - H,
});

function result(over: Partial<EngineResult> = {}): EngineResult {
  return {
    asOf: NOW,
    lastPlayedCharacterIndex: null,
    sessionStartedAt: NOW - H,
    expectedReturn: { usedSeconds: 8 * 3600, learnedSeconds: null },
    stage: { id: 'W2-mid', label: 'W2-mid' },
    characters: [character(0), character(1), character(2)],
    visitOrder: [2, 0, 1],
    account: {
      goals: [],
      blockerKeys: [],
      safety: 'safe',
      spendPlan: null,
      activePlay: [],
      doneThisSession: [],
    },
    firstFill: null,
    alreadyFull: 0,
    higherLeverageStatus: 'ok',
    notCovered: [],
    versions: { knowledge: 'test', gameBuild: 1, parserTarget: '2.3.540', parserBehind: false },
    diagnostics: { failedDetectors: [] },
    systems: [],
    timeline: [],
    returnAt: NOW + 8 * H,
    ...over,
  };
}

const ui = { now: NOW, lastCloudSave: NOW - 60_000 };
const timeline = (r: EngineResult, prefs: NowPrefs = EMPTY_PREFS, u = ui) =>
  buildTimelineView(r, prefs, buildNowView(r, prefs, { ...DEFAULT_UI, now: u.now }), u) as TimelineView;
const barOf = (v: TimelineView, key: string) =>
  [...v.lanes, ...v.accountLanes].flatMap((l) => [...l.bars, ...l.untimed]).find((b) => b.key === key);

describe('the one duration format (Design Lab hard rule)', () => {
  it('reads "in 14h 04m", minutes under an hour and days from 48 h', () => {
    expect(inSpan(14 * H + 4 * 60_000)).toBe('in 14h 04m');
    expect(span(45 * 60_000)).toBe('45m');
    expect(span(10_000)).toBe('1m');
    expect(span(60 * H)).toBe('2d 12h');
  });
});

describe('D-16, FR-29: the axis', () => {
  it('runs from now to the later of now + 12 h and the return + 25 %', () => {
    expect(timelineAxisEnd(NOW, NOW + 8 * H, 8 * H)).toBe(NOW + 12 * H);
    expect(timelineAxisEnd(NOW, NOW + 12 * H, 12 * H)).toBe(NOW + 15 * H);
    expect(timelineAxisEnd(NOW, NOW + 2 * H, 2 * H)).toBe(NOW + 12 * H);
  });
  it('is capped at 48 h, but always reaches the return + 1 h', () => {
    expect(timelineAxisEnd(NOW, NOW + 40 * H, 40 * H)).toBe(NOW + 48 * H);
    expect(timelineAxisEnd(NOW, NOW + 60 * H, 60 * H)).toBe(NOW + 61 * H);
  });
  it('places the Back marker at the return, with its time and clock', () => {
    const v = timeline(result());
    expect(v.axis.backX).toBeCloseTo(8 / 12);
    expect(v.axis.backLabel).toMatch(/^Back in 8h 00m · \d\d:\d\d$/);
    expect(v.axis.ticks.map((t) => t.label)).toEqual(['+2h', '+4h', '+6h', '+8h', '+10h']);
  });
  it('has no view without M3 (no returnAt)', () => {
    const { returnAt: _, ...rest } = result();
    expect(buildTimelineView(rest as EngineResult, EMPTY_PREFS, { roster: [] }, ui)).toBeNull();
  });
});

describe('FR-28: lanes', () => {
  it('follows the Roster order for characters, then one lane per System with account bars', () => {
    const r = result({
      systems: [
        { ...sys('arcade'), world: 2 },
        { ...sys('alchemy'), world: 2 },
      ],
      timeline: [bar('alchemy.check.liquid', 'account'), bar('arcade.check.balls', 'account')],
    });
    const v = timeline(r);
    expect(v.lanes.map((l) => l.index)).toEqual([2, 0, 1]);
    expect(v.lanes.map((l) => l.position)).toEqual([1, 2, 3]);
    expect(v.accountLanes.map((l) => l.systemId)).toEqual(['arcade', 'alchemy']);
  });
});

function sys(id: string) {
  return {
    id,
    name: id[0]?.toUpperCase() + id.slice(1),
    kind: 'game' as const,
    world: 1,
    scope: 'account' as const,
    unlocked: 'yes' as const,
    unlockBy: 'world' as const,
    covered: true,
    unlock: null,
    wiki: null,
    checks: [],
  };
}

describe('FR-25: overflow before the return', () => {
  const blocker = goal('arcade.check.balls', 'c0', { category: 'blocker' });
  const r = (at: number | null, over: Partial<TimelineBar> = {}) =>
    result({
      characters: [character(0, [blocker]), character(1), character(2)],
      timeline: [bar('arcade.check.balls', 'c0', { at, ...over })],
    });

  it('outlines a blocker that ends before the return, says so, hatches to the marker and links its fix', () => {
    const b = barOf(timeline(r(NOW + 7 * H)), 'arcade.check.balls@c0');
    expect(b).toMatchObject({
      beforeReturn: true,
      outlined: true,
      hatched: true,
      flag: "before you're back",
    });
    expect(b?.hatchTo).toBeCloseTo(8 / 12);
    expect(b?.fix).toEqual({ subject: 'c0', key: 'arcade.check.balls@c0', where: 'focus', expand: null });
    expect(b?.a11y).toMatch(/^anvil full in 7h 00m, at \d\d:\d\d, before you're back$/);
  });

  it('leaves a bar after the return plain, without a fix link', () => {
    const b = barOf(timeline(r(NOW + 9 * H)), 'arcade.check.balls@c0');
    expect(b).toMatchObject({ beforeReturn: false, outlined: false, hatched: false, fix: null });
    expect(b?.a11y).toMatch(/after you're back$/);
  });

  it('re-flags the bar when a longer Expected Return arrives (US-10)', () => {
    const later = { ...r(NOW + 9 * H), returnAt: NOW + 12 * H };
    later.expectedReturn = { usedSeconds: 12 * 3600, learnedSeconds: null };
    expect(barOf(timeline(later), 'arcade.check.balls@c0')?.outlined).toBe(true);
  });

  it('draws a passed time as full now, and a present-state blocker as a "now" marker', () => {
    const full = barOf(timeline(r(NOW - H)), 'arcade.check.balls@c0');
    expect(full).toMatchObject({ fullNow: true, x: 0, timeText: 'now', outlined: true });
    const present = barOf(timeline(r(null, { what: 'no AFK Target' })), 'arcade.check.balls@c0');
    expect(present).toMatchObject({ label: 'no AFK Target', timeText: 'now', outlined: true, x: 0 });
  });

  it('keeps a cap pill plain with its own label and a See it target (R-PILL-1)', () => {
    const v = timeline(
      result({
        characters: [character(0, [], [pillLine(0)]), character(1), character(2)],
        timeline: [bar('anvil.check.caps', 'c0', { effect: 'pill', at: NOW - H })],
      }),
    );
    const b = barOf(v, 'anvil.check.caps@c0');
    expect(b).toMatchObject({ label: 'Anvil full · collect', outlined: false, hatched: false });
    expect(b?.fix?.where).toBe('pill');
    expect(v.empty).toBe("Nothing fills up before you're back");
  });

  it('keeps a limit whose fix does not hold plain, with the producer text and no fix link (M3 FR-7 c)', () => {
    const line = goal('anvil.check.fill', 'c0');
    const v = timeline(
      result({
        characters: [character(0, [line]), character(1), character(2)],
        timeline: [
          bar('anvil.check.fill', 'c0', { effect: 'next-action', fixHolds: false, at: NOW + 2 * H }),
        ],
      }),
    );
    const b = barOf(v, 'anvil.check.fill@c0');
    expect(b).toMatchObject({ outlined: false, hatched: false, fix: null, note: 'anvil.check.fill text' });
  });

  it('draws a skipped blocker unoutlined, reads "skipped", and still links where "1 skipped · undo" is', () => {
    const prefs: NowPrefs = {
      ...EMPTY_PREFS,
      skips: { 'arcade.check.balls@c0': { midnightAt: NOW + H, sessionStartedAt: NOW - H } },
    };
    const b = barOf(timeline(r(NOW + H), prefs), 'arcade.check.balls@c0');
    expect(b).toMatchObject({ outlined: false, state: 'skipped', flag: 'skipped' });
    expect(b?.fix).toMatchObject({ where: 'focus', subject: 'c0' });
    expect(b?.a11y).toMatch(/, skipped$/);
  });
});

describe('FR-27: fix targets', () => {
  it('opens "show more" for a Next Action past the account cap', () => {
    const goals = Array.from({ length: 7 }, (_, i) => goal(`arcade.check.g${i}`, 'account'));
    const v = timeline(
      result({
        account: { ...result().account, goals },
        timeline: [bar('arcade.check.g6', 'account', { effect: 'next-action' })],
      }),
    );
    expect(barOf(v, 'arcade.check.g6@account')?.fix).toEqual({
      subject: 'account',
      key: 'arcade.check.g6@account',
      where: 'account',
      expand: 'show-more',
    });
  });

  it('points a finding moved into the Behind Goal at that Goal, with its details open', () => {
    const behind = goal('metapath.goal.behind', 'account');
    const v = timeline(
      result({
        account: { ...result().account, goals: [behind] },
        behindSystems: [
          {
            systemId: 'cards',
            rowId: 'r',
            fixEntryId: 'cards.check.x',
            findingKeys: ['cards.check.x@c0'],
            chosen: true,
          },
        ],
        timeline: [bar('cards.check.x', 'c0', { effect: 'next-action' })],
      }),
    );
    expect(barOf(v, 'cards.check.x@c0')?.fix).toEqual({
      subject: 'account',
      key: 'metapath.goal.behind@account',
      where: 'account',
      expand: 'behind-details',
    });
  });

  it('gives Goals hidden while the Stage is unknown no fix link (§6)', () => {
    const g = goal('arcade.check.g', 'account');
    const v = timeline(
      result({
        stage: { id: 'unknown', label: '?' },
        account: { ...result().account, goals: [g] },
        timeline: [bar('arcade.check.g', 'account', { effect: 'next-action' })],
      }),
    );
    expect(barOf(v, 'arcade.check.g@account')?.fix).toBeNull();
  });
});

describe('FR-26: untimed limits', () => {
  it('lists "<what> · can\'t tell when" once per what, with no position', () => {
    const v = timeline(
      result({
        timeline: [
          bar('afk.check.food', 'c0', { untimed: true, at: null, kind: 'food', what: 'health food' }),
          bar('afk.check.low-food', 'c0', { untimed: true, at: null, kind: 'food', what: 'health food' }),
        ],
      }),
    );
    const lane = v.lanes.find((l) => l.index === 0);
    expect(lane?.bars).toEqual([]);
    expect(lane?.untimed.map((b) => [b.label, b.timeText, b.x])).toEqual([
      ['health food runs out', "can't tell when", null],
    ]);
    expect(lane?.untimed[0]?.a11y).toBe("health food runs out, can't tell when");
  });
});

describe('§6: the stale save', () => {
  it("puts the save's age first when the save is older than the Expected Return", () => {
    const v = timeline(result(), EMPTY_PREFS, { now: NOW, lastCloudSave: NOW - 9 * H - 28 * 60_000 });
    expect(v.stale).toEqual({
      text: 'Your last save is 9h 28m old: these times are projected from it.',
      band: 'Since the save: 9h 28m',
    });
  });
  it('has no band for a fresh save', () => {
    expect(timeline(result()).stale).toBeNull();
  });
});

describe('Design Lab: repeats are said once', () => {
  it('groups the same pill on several characters, "the same on n more", and keeps each fix its own', () => {
    const blockers = [0, 1, 2].map((i) => goal('afk.check.no-target', `c${i}`, { category: 'blocker' }));
    const r = result({
      characters: [0, 1, 2].map((i) => character(i, [blockers[i] as Goal], [pillLine(i)])),
      timeline: [0, 1, 2].flatMap((i) => [
        bar('anvil.check.caps', `c${i}`, { effect: 'pill', at: NOW - H }),
        bar('afk.check.no-target', `c${i}`, { at: null, what: 'no AFK Target' }),
      ]),
    });
    const v = timeline(r);
    const pills = v.lanes.map((l) => l.bars.find((b) => b.entryId === 'anvil.check.caps')?.group);
    expect(pills[0]).toEqual({
      first: true,
      more: [
        { index: 0, name: 'Char0', key: 'anvil.check.caps@c0' },
        { index: 1, name: 'Char1', key: 'anvil.check.caps@c1' },
      ],
    });
    expect(pills.slice(1)).toEqual([
      { first: false, more: [] },
      { first: false, more: [] },
    ]);
    expect(v.lanes.map((l) => l.bars.find((b) => b.entryId === 'afk.check.no-target')?.group)).toEqual([
      null,
      null,
      null,
    ]);
  });
});

describe('TR-6: determinism and words', () => {
  it('gives byte-identical output for the same input', () => {
    const r = result({ timeline: [bar('arcade.check.balls', 'c0')] });
    expect(JSON.stringify(timeline(r))).toBe(JSON.stringify(timeline(r)));
  });
  it('has a kind word for every Timeline kind the schema allows', () => {
    expect(Object.keys(KIND_WORDS).sort()).toEqual([...TIMELINE_KINDS].sort());
  });
});

// ---- the producers, through the full engine (TR-4) ----

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const engineOn = (state: AccountState, now: number, expectedReturnMs = DEFAULT_EXPECTED_RETURN_MS) =>
  goldenResult({ state, kb: ctx.kb, registries: ctx.registries, now, expectedReturnMs });
const fixture = (id: string) => {
  const f = fixtures.find((x) => x.id === id);
  if (!f) throw new Error(`no fixture ${id}`);
  return { state: stateOf(f), now: f.now };
};
const barsOf = (r: EngineResult, entryId: string) => (r.timeline ?? []).filter((b) => b.entryId === entryId);
const viewOn = (r: EngineResult, now: number, lastCloudSave: number | null) =>
  buildTimelineView(r, EMPTY_PREFS, buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now }), {
    now,
    lastCloudSave,
  }) as TimelineView;

describe('TR-4: every entry that emits bars authors its words', () => {
  it("covers M3's Checks, every blocker Check, the anvil fill-time line and the M6 banks", () => {
    const blockers = Object.values(ctx.kb.entries)
      .filter((e) => e.type === 'check' && e.effect === 'blocker')
      .map((e) => e.id);
    const ids = [
      ...AFK_SAFETY_ENTRIES,
      ...AFK_INFO_ENTRIES,
      ...blockers,
      'boss-keys.check.collect',
      'colosseum.check.collect-tickets',
    ];
    const missing = ids.filter((id) => {
      const v = ctx.kb.entries[id]?.values ?? {};
      return typeof v.timelineKind !== 'string' || typeof v.timelineWhat !== 'string';
    });
    expect(missing).toEqual([]);
  });
});

describe('TR-4 producers on scrubbed-w3 (W3-early, 6 characters)', () => {
  const { state, now } = fixture('scrubbed-w3');
  const r = engineOn(state, now);

  it('M3 supplies returnAt, and every entry that emits bars authors its kind and words', () => {
    expect(r.returnAt).toBe(now + DEFAULT_EXPECTED_RETURN_MS);
    for (const b of r.timeline ?? []) {
      expect(TIMELINE_KINDS).toContain(b.kind);
      expect(b.what.length).toBeGreaterThan(0);
    }
  });

  it('anvil: a full-now cap pill on all 6 characters', () => {
    const anvil = barsOf(r, 'anvil.check.caps-before-return');
    expect(anvil).toHaveLength(6);
    expect(anvil.every((b) => b.effect === 'pill' && b.at !== null && b.at <= now)).toBe(true);
  });

  it('worship charge: a pill on the 4 characters at 50 of 50', () => {
    const worship = (r.timeline ?? []).filter((b) => b.system === 'worship' && b.effect === 'pill');
    expect(worship).toHaveLength(4);
  });

  it('the wrong-preset blockers are present-state "now" markers (at null)', () => {
    const presets = barsOf(r, 'talent-presets.check.wrong-preset');
    expect(presets).toHaveLength(2);
    expect(presets.every((b) => b.at === null && !b.untimed && b.effect === 'blocker')).toBe(true);
  });

  it('food: health food without history is untimed, never a guessed bar', () => {
    const food = barsOf(r, 'afk.check.health-food-runs-out');
    expect(food.length).toBeGreaterThan(0);
    expect(food.every((b) => b.untimed && b.at === null)).toBe(true);
  });

  it('salt fuel: the passing fuel Check says when it runs out (about 40 h)', () => {
    const [fuel] = barsOf(r, 'refinery.check.fuel-runs-out');
    expect(fuel?.effect).toBe('info');
    expect(((fuel?.at ?? 0) - now) / H).toBeGreaterThan(30);
  });

  it('liquids: Water below cap without a refill rate is untimed', () => {
    expect(barsOf(r, 'alchemy.check.liquid-cap-line')).toMatchObject([{ untimed: true, effect: 'info' }]);
  });

  it('the Arcade ball bank: a passing Check gives its cap time', () => {
    const [arcade] = barsOf(r, 'arcade.check.balls-cap');
    expect(arcade?.effect).toBe('info');
    expect(arcade?.at ?? 0).toBeGreaterThan(now);
  });

  it('M6 tickets: the losing-now Colosseum bank is full now, outlined, with its fix in the Account section', () => {
    const [tickets] = barsOf(r, 'colosseum.check.collect-tickets');
    expect(tickets).toMatchObject({ kind: 'bank', at: now, effect: 'next-action', subject: 'account' });
    const v = viewOn(r, now, state.account.lastCloudSave);
    const b = barOf(v, 'colosseum.check.collect-tickets@account');
    expect(b).toMatchObject({ outlined: true, fullNow: true });
    expect(b?.fix?.where).toBe('account');
  });

  it('M6 keys: a key bank that tops out before the return is a bank bar on its character at the deadline', () => {
    const found = [0, 1, 2, 3, 5]
      .map((d) =>
        engineOn(
          withAccount(state, {
            keys: (state.account.keys ?? []).map((k) => ({ ...k, daysSincePickup: d })),
          }),
          now,
        ),
      )
      .flatMap((x) => barsOf(x, 'boss-keys.check.collect'));
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((b) => b.kind === 'bank' && b.subject !== 'account')).toBe(true);
    expect(found.some((b) => b.at !== null && b.at > now && b.at <= now + DEFAULT_EXPECTED_RETURN_MS)).toBe(
      true,
    );
    expect(found.some((b) => b.at === now)).toBe(true);
  });

  it('US-10: lanes in the Roster order, pills at the now line, the Bowman 60 preset marker outlined', () => {
    const v = viewOn(r, now, null);
    const roster = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now }).roster;
    expect(v.lanes.map((l) => l.index)).toEqual(roster.map((x) => x.index));
    expect(v.lanes).toHaveLength(6);
    for (const lane of v.lanes) {
      const pill = lane.bars.find((b) => b.entryId === 'anvil.check.caps-before-return');
      expect(pill).toMatchObject({ effect: 'pill', outlined: false, x: 0, label: 'Anvil full · collect' });
    }
    const first = v.lanes[0];
    expect(first?.detail).toMatch(/^Bowman lv 60/);
    expect(first?.bars[0]).toMatchObject({ entryId: 'talent-presets.check.wrong-preset', outlined: true });
    expect(first?.bars[0]?.fix?.where).toBe('focus');
  });

  it('US-10: the Wizard 73 health food reads "can\'t tell when" once', () => {
    const v = viewOn(r, now, null);
    const wizard = v.lanes.find((l) => /^Wizard lv 73/.test(l.detail ?? ''));
    expect(wizard?.untimed.filter((b) => b.what === 'health food')).toHaveLength(1);
    expect(wizard?.bars.some((b) => b.what === 'health food')).toBe(false);
  });

  it('the stale W3 golden save (8h 28m old) puts its age first', () => {
    expect(viewOn(r, now, state.account.lastCloudSave).stale?.text).toBe(
      'Your last save is 8h 28m old: these times are projected from it.',
    );
  });
});

describe('TR-4 producers on scrubbed-w2 (W2-late, 5 characters)', () => {
  const { state, now } = fixture('scrubbed-w2');
  const r = engineOn(state, now);
  const v = viewOn(r, now, null);

  it('US-10: the Barbarian 60 lane starts with the outlined dies-on-its-map marker', () => {
    const barb = v.lanes.find((l) => /^Barbarian lv 60/.test(l.detail ?? ''));
    expect(barb?.bars[0]).toMatchObject({ entryId: 'afk.check.dies-fixable-by-food', outlined: true });
    expect(barb?.bars[0]?.fix?.key).toMatch(/^afk\.check\.dies-fixable-by-food@c/);
  });

  it('US-10: the Arcade lane shows "Arcade balls full · now", outlined, fixed from the Account section', () => {
    const arcade = v.accountLanes.find((l) => l.systemId === 'arcade');
    expect(arcade?.bars[0]).toMatchObject({ label: 'Arcade balls full', timeText: 'now', outlined: true });
    expect(arcade?.bars[0]?.fix).toMatchObject({ where: 'account', subject: 'account' });
  });

  it('US-10: the four anvils that refill before the return are plain fill-time bars, no fix, no hatching', () => {
    const fills = (r.timeline ?? []).filter((b) => b.entryId === 'anvil.check.fill-time');
    expect(fills).toHaveLength(4);
    for (const f of fills) {
      const b = barOf(v, f.key);
      expect(b).toMatchObject({
        effect: 'info',
        outlined: false,
        hatched: false,
        fix: null,
        beforeReturn: true,
      });
    }
  });

  it('liquids: Water at cap is a plain bar with the producer text (its fix does not hold)', () => {
    const b = barOf(v, 'alchemy.check.liquid-cap-line@account');
    expect(b).toMatchObject({ fullNow: true, outlined: false });
    expect(b?.note).toMatch(/^Spend Water/);
  });
});

describe('TR-4 producers on the public latest save (11 characters)', () => {
  const { state, now } = fixture('latest');
  const r = engineOn(state, now);

  it('traps: finished traps are full-now blockers, and running ones give their finish time', () => {
    const done = barsOf(r, 'trapping.check.slots-and-timers');
    expect(done.length).toBeGreaterThan(0);
    expect(done.every((b) => b.kind === 'timer' && b.at !== null && b.at <= now)).toBe(true);
    const running = barsOf(r, 'trapping.check.finishes-early');
    expect(running.every((b) => b.at !== null && b.at > now)).toBe(true);
  });

  it('renders an 11-lane text Timeline with no name in it', () => {
    const v = viewOn(r, now, null);
    expect(v.lanes).toHaveLength(11);
    const text = renderTimelineText(v, { label: (i) => `C${i + 1}`, classOf: () => 'x' });
    for (const c of r.characters) expect(text).not.toContain(c.name);
  });

  it('builds in under 6 ms (TR-11: 3 ms budget, CI fails at 2×)', () => {
    const roster = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now });
    buildTimelineView(r, EMPTY_PREFS, roster, { now });
    const t0 = performance.now();
    for (let i = 0; i < 20; i++) buildTimelineView(r, EMPTY_PREFS, roster, { now });
    expect((performance.now() - t0) / 20).toBeLessThan(6);
  });
});
