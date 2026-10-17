// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M10 user stories asserted on NowView, over the synthetic view fixtures (M10 §4).
import { describe, expect, it } from 'vitest';
import { invariantViolations } from '../../src/core/invariants';
import { buildNowView, displayOrder, NOT_COVERED_BANNER } from '../../src/now/build-now-view';
import { EMPTY_PREFS, nextLocalMidnight } from '../../src/now/prefs';
import type { Goal } from '../../src/result';
import { FIXTURE_IDS, fixture, skipNow, uiFor, view } from './helpers';

const H = 3600;

describe('every view fixture', () => {
  it.each(FIXTURE_IDS)('%s holds the TR-9 invariants and survives structuredClone', (id) => {
    const r = fixture(id);
    expect(invariantViolations(r)).toEqual([]);
    expect(structuredClone(r)).toEqual(r);
  });
  it('has the twelve fixtures the spec names', () => {
    expect(FIXTURE_IDS).toEqual(
      [
        'account-stockpile',
        'all-set',
        'blocker-overflow',
        'cannot-tell',
        'contested',
        'detector-failure',
        'higher-leverage-character',
        'mid-session',
        'no-purpose',
        'not-covered',
        'spend-plan',
        'stale',
      ].sort(),
    );
  });
});

describe('US-1 see who is safe to leave', () => {
  const v = view(fixture('mid-session'));
  it('numbers 5 rows 1–5 with Fix, Unknown, then Ready', () => {
    expect(v.roster.map((r) => r.position)).toEqual([1, 2, 3, 4, 5]);
    expect(v.roster.map((r) => r.pill.text)).toEqual([
      'Fix before you leave',
      'Unknown',
      'Ready',
      'Ready',
      'Ready',
    ]);
    expect(v.roster[0]?.summary).toBe('Food runs out in about 2h');
  });
  it("row 1's accessible name has number, name, class, level, activity, map, Verdict and summary", () => {
    expect(v.roster[0]?.accessibleName).toBe(
      '1., Dahlia, Barbarian level 51, Fishing Goldfish, Fishing Camp, Fix before you leave, Food runs out in about 2h',
    );
  });
  it('FR-5: an Unknown row says why; a Ready row shows its top Next Action, else "Nothing to do here"', () => {
    expect(v.roster[1]?.summary).toBe("Can't tell from the save");
    expect(v.roster[3]?.summary).toBe('Collect 2 Amarok keys before they cap');
    expect(v.roster[2]?.summary).toBe('Nothing to do here');
  });
});

describe('US-2 know where to go next', () => {
  const r = fixture('mid-session');
  it('replays visitOrder [3,0,4,1,2] without re-sorting', () => {
    const v = view(r);
    expect(v.roster.map((x) => x.index)).toEqual([3, 0, 4, 1, 2]);
  });
  it('Next skips visited characters and ones with nothing to do', () => {
    // Focus on position 2 (index 0); positions 1 and 2 visited; position 3 (index 4) is Ready with no Goals.
    const v = view(r, { focus: 0, visited: new Set([3, 0]) });
    expect(v.focus?.next).toEqual({ index: 1, text: 'Next: switch to Birch →' });
  });
  it('names the worst unvisited character wherever Focus opened, with "k of M · n left"', () => {
    const v = view(r, { focus: 2 });
    expect(v.focus?.next.index).toBe(3);
    // 4 others, minus index 4 (Ready, nothing to do).
    expect(v.focus?.position).toBe('5 of 5 in your Visit Order · 3 left');
  });
  it('playing a different character than suggested only marks that one visited', () => {
    const v = view(r, { focus: 1, visited: new Set([1]) });
    expect(v.focus?.next.index).toBe(3);
  });
  it('reads "Last one" when everyone with something to do is visited', () => {
    const v = view(r, { focus: 2, visited: new Set([3, 0, 1, 2]) });
    expect(v.focus?.next).toEqual({ index: null, text: 'Last one: check the Account list ↓' });
  });
  it('D6: a reshuffled visitOrder keeps the frozen order while Verdicts update', () => {
    const later = fixture('mid-session');
    later.visitOrder = [0, 3, 4, 2, 1];
    const v = view(later, { frozenOrder: [3, 0, 4, 1, 2] });
    expect(v.roster.map((x) => x.index)).toEqual([3, 0, 4, 1, 2]);
    expect(v.progress.segments.map((s) => s.index)).toEqual([3, 0, 4, 1, 2]);
  });
  it('D6: a new character is appended; a deleted one drops out', () => {
    const later = fixture('mid-session');
    const extra = { ...(later.characters[0] as (typeof later.characters)[number]), index: 5, name: 'Fern' };
    later.characters = later.characters.filter((c) => c.index !== 1).concat(extra);
    later.visitOrder = [5, 3, 0, 4, 2];
    expect(displayOrder(later, [3, 0, 4, 1, 2])).toEqual([3, 0, 4, 2, 5]);
  });
});

describe('Focus card', () => {
  it('shows "you are on this character" and the "Left" line after an auto-follow', () => {
    const r = fixture('mid-session');
    const v = view(r, { focus: 2, leftFrom: 3, playing: { index: 2, status: 'confirmed' } });
    expect(v.focus?.playing).toBe('you are on this character');
    expect(v.focus?.left).toEqual({ index: 3, text: 'Left Dahlia ✓ 1 done · Fix before you leave' });
  });
  it('a Next-up character (FR-14 ruling) reads "Next up" and carries no "● playing"', () => {
    const r = fixture('mid-session');
    const v = view(r, { focus: 0, playing: { index: 0, status: 'next-up' } });
    expect(v.focus?.playing).toBe('Next up');
    expect(v.roster.find((x) => x.index === 0)).toMatchObject({ playing: false, nextUp: true });
  });
  it('the Verdict strip lists every character in Visit Order, aria-current on the one in Focus', () => {
    const v = view(fixture('mid-session'), { focus: 4 });
    expect(v.focus?.strip.map((s) => s.label)).toEqual([
      '1 · Dahlia',
      '2 · Alder',
      '3 · Elm',
      '4 · Birch',
      '5 · Cedar',
    ]);
    expect(v.focus?.strip.find((s) => s.current)?.index).toBe(4);
    expect(v.focus?.strip[0]?.accessibleName).toBe('Dahlia, Fix before you leave');
  });
});

describe('US-4 understand what a character is for', () => {
  it('shows each Purpose line with its Milestone and ETA', () => {
    const v = view(fixture('mid-session'), { focus: 0 });
    expect(v.focus?.purpose.map((p) => p.text)).toEqual([
      '13k Poop kills · next 100k · about 40h',
      'Fighting XP: too low for your level',
    ]);
  });
  it('no-purpose: "What is this character for?" with exactly one suggestion and a Source', () => {
    const v = view(fixture('no-purpose'), { focus: 0 });
    expect(v.focus?.unknown?.text).toBe('What is this character for?');
    expect(v.focus?.unknown?.suggestion?.text).toBe('Send this character to fight Frogs for Class XP');
    expect(v.focus?.unknown?.suggestion?.source.text).toBe('wiki · 2.3.540');
    expect(v.focus?.higherLeverage).toBeNull();
  });
  it('stopHere shows "consider stopping here"; parser-behind shows "may be out of date"', () => {
    const v = view(fixture('mid-session'), { focus: 4 });
    expect(v.focus?.purpose[0]?.text).toBe(
      '30 Catching levels · next 30 · may be out of date · consider stopping here',
    );
  });
});

describe('US-5 do one thing at a time', () => {
  const r = fixture('mid-session');
  it('6 non-blocker Goals: 3 show plus "show more (3)", 6 after expanding', () => {
    expect(view(r, { focus: 2 }).focus).toMatchObject({ hiddenCount: 3 });
    expect(view(r, { focus: 2 }).focus?.goals).toHaveLength(3);
    expect(view(r, { focus: 2, expanded: new Set(['c2']) }).focus?.goals).toHaveLength(6);
  });
  it('blocker-overflow: all 4 blockers show, and "show more (2)"... of which 2 fit under the cap', () => {
    const v = view(fixture('blocker-overflow'), { focus: 0 });
    expect(v.focus?.blockers).toHaveLength(4);
    expect(v.focus?.goals).toHaveLength(2);
    expect(v.focus?.hiddenCount).toBe(0);
  });
  it('8 account Goals: 5 show plus "show more (3)"', () => {
    const big = fixture('mid-session');
    const g = big.account.goals[0] as Goal;
    big.account.goals = Array.from({ length: 8 }, (_, n) => ({
      ...g,
      nextAction: { ...g.nextAction, key: `k${n}`, text: `Goal ${n}` },
    }));
    const v = view(big);
    expect(v.account.goals).toHaveLength(5);
    expect(v.account.hiddenCount).toBe(3);
  });
});

describe('US-6 check the Source', () => {
  it('"wiki · 2.3.540" links the wiki; "+1" lists the guide', () => {
    const v = view(fixture('mid-session'), { focus: 2 });
    const a = v.focus?.goals[1]?.action;
    expect(a?.source).toMatchObject({ text: 'wiki · 2.3.540', href: 'https://idleon.wiki/wiki/Stamps' });
    expect(a?.source.more.map((m) => m.text)).toEqual(['guide · 2.3.531']);
  });
  it('a Stale label ends with "· Stale"; a non-https URL is plain text', () => {
    const v = view(fixture('stale'), { focus: 0 });
    expect(v.focus?.goals[0]?.action.source.text).toBe('wiki · 2.3.540 · Stale');
    expect(v.focus?.goals[1]?.action.source.href).toBeNull();
  });
});

describe('US-7 see when sources disagree', () => {
  it('the Contested entry has both sides and is not the first Goal', () => {
    const v = view(fixture('contested'), { focus: 0 });
    const goals = v.focus?.goals ?? [];
    expect(goals[0]?.action.contested).toBeNull();
    const c = goals.find((g) => g.action.contested);
    expect(c?.action.contested?.sides.map((s) => s.sources[0]?.text)).toEqual([
      'wiki · 2.3.540',
      'guide · 2.3.531',
    ]);
  });
});

describe('US-8 Expected Return chips', () => {
  it('no history: 8h is pressed', () => {
    const v = view(fixture('all-set'));
    expect(v.expectedReturn.chips.filter((c) => c.pressed).map((c) => c.label)).toEqual(['8h']);
  });
  it('a learned 6h shows as "≈6h", pressed', () => {
    const r = fixture('all-set');
    r.expectedReturn = { usedSeconds: 6 * H, learnedSeconds: 6 * H };
    const v = view(r);
    expect(v.expectedReturn.chips.map((c) => c.label)).toEqual(['2h', '4h', '≈6h', '8h', '12h', '24h']);
    expect(v.expectedReturn.chips.find((c) => c.pressed)?.label).toBe('≈6h');
  });
  it('a learned 30h sits after 24h', () => {
    const r = fixture('all-set');
    r.expectedReturn = { usedSeconds: 8 * H, learnedSeconds: 30 * H };
    expect(view(r).expectedReturn.chips.at(-1)?.label).toBe('≈30h');
  });
});

describe('US-9 know when I am done', () => {
  it('all-set: banner, first fill and "safe to log off"', () => {
    const v = view(fixture('all-set'));
    expect(v.allSet?.text).toBe('All set: safe to log off');
    expect(v.allSet?.detail).toBe("First thing fills up in about 9h: Cedar's inventory");
    expect(v.progress.label).toBe('safe to log off');
  });
  it('one character turning Fix drops the banner: "4 of 5 Ready · fix 1 before you leave"', () => {
    const r = fixture('all-set');
    const c = r.characters[0] as (typeof r.characters)[number];
    const b = fixture('blocker-overflow').characters[0]?.goals[0] as Goal;
    c.goals = [b];
    c.verdict = { kind: 'fix', blockerKeys: [b.nextAction.key], unknownReason: null, suggestion: null };
    const v = view(r);
    expect(v.allSet).toBeNull();
    expect(v.progress.label).toBe('4 of 5 Ready · fix 1 before you leave');
  });
  it('R1: with AFK safety not covered, no text says "safe to log off"', () => {
    const r = fixture('all-set');
    for (const c of r.characters)
      c.verdict = { kind: 'unknown', blockerKeys: [], unknownReason: 'not-covered', suggestion: null };
    const v = view(r);
    expect(JSON.stringify(v)).not.toContain('safe to log off');
    expect(v.allSet?.text).toBe(NOT_COVERED_BANNER);
    expect(v.progress.hidden).toBe(true);
  });
  it('"Nothing fills up before you\'re back" when the engine reports nothing; "· n already full"', () => {
    const r = fixture('all-set');
    r.firstFill = null;
    r.alreadyFull = 4;
    expect(view(r).allSet?.detail).toBe("Nothing fills up before you're back · 4 already full");
  });
});

describe('US-10 progress confirmed', () => {
  it('Done this session lists confirmed Next Actions with their time', () => {
    const v = view(fixture('mid-session'), { focus: 3 });
    expect(v.focus?.done).toEqual([
      expect.objectContaining({ text: 'Spend your W1 merit points', time: '17:40' }),
    ]);
  });
});

describe('US-11 dismiss what does not apply', () => {
  const r = fixture('mid-session');
  const first = r.characters[2]?.goals[0]?.nextAction.key as string;
  it('Skip today hides a Goal; the next moves up; "1 skipped"', () => {
    const v = view(r, { focus: 2 }, { skips: skipNow(r, first) });
    expect(v.focus?.goals[0]?.action.text).toBe('Buy the Target Stamp at the stamp shop');
    expect(v.focus?.goals).toHaveLength(3);
    expect(v.focus?.skippedCount).toBe(1);
  });
  it('Not for me holds until the game build changes; an unknown build keeps it hidden', () => {
    const at142 = view(r, { focus: 2 }, { dismissals: { [first]: 142 } });
    expect(at142.focus?.dismissed.map((d) => d.key)).toEqual([first]);
    const r143 = fixture('mid-session');
    r143.versions.gameBuild = 143;
    expect(view(r143, { focus: 2 }, { dismissals: { [first]: 142 } }).focus?.dismissed).toEqual([]);
    const rNull = fixture('mid-session');
    rNull.versions.gameBuild = null;
    expect(view(rNull, { focus: 2 }, { dismissals: { [first]: 142 } }).focus?.dismissed).toHaveLength(1);
  });
  // D3: until local midnight or the end of the Play Session, whichever is later.
  const tz = 0;
  const day = Date.UTC(2026, 9, 17);
  it('skipped at 21:00, session ends 22:30: still hidden at 22:31, back after midnight', () => {
    const skipAt = day + 21 * H * 1000;
    const skips = {
      [first]: { midnightAt: nextLocalMidnight(skipAt, tz), sessionStartedAt: r.sessionStartedAt },
    };
    const lastSave = day + (22 * H + 15 * 60) * 1000;
    const at = (t: number) =>
      buildNowView(r, { ...EMPTY_PREFS, skips }, uiFor(r, { focus: 2, now: t, lastCloudSave: lastSave }));
    expect(at(day + (22 * H + 31 * 60) * 1000).focus?.skippedCount).toBe(1);
    expect(at(day + 24 * H * 1000 + 60_000).focus?.skippedCount).toBe(0);
  });
  it('skipped at 23:30 in a session that runs past midnight: hidden until the session ends', () => {
    const skipAt = day + (23 * H + 30 * 60) * 1000;
    const skips = {
      [first]: { midnightAt: nextLocalMidnight(skipAt, tz), sessionStartedAt: r.sessionStartedAt },
    };
    const lastSave = day + (24 * H + 55 * 60) * 1000; // 00:55, so the session ends 01:10
    const at = (t: number) =>
      buildNowView(r, { ...EMPTY_PREFS, skips }, uiFor(r, { focus: 2, now: t, lastCloudSave: lastSave }));
    const atMidnight = at(day + 24 * H * 1000 + 60_000);
    expect(atMidnight.focus?.skippedCount).toBe(1);
    expect(atMidnight.nextExpiry).toBe(lastSave + 15 * 60_000);
    expect(at(day + (25 * H + 11 * 60) * 1000).focus?.skippedCount).toBe(0);
  });
  it('a skip from a session that ended stays until midnight in a new session', () => {
    const skips = { [first]: { midnightAt: r.asOf + 3 * H * 1000, sessionStartedAt: r.asOf - 5 * H * 1000 } };
    expect(view(r, { focus: 2 }, { skips }).focus?.skippedCount).toBe(1);
  });
});

describe('US-15 game patch', () => {
  it('parserBehind shows the "game updated (build 143)" banner and the advice still renders', () => {
    const r = fixture('mid-session');
    r.versions = { ...r.versions, gameBuild: 143, parserBehind: true };
    const v = view(r);
    expect(v.banners[0]?.text).toBe(
      "The game updated (build 143). ActiveOn's save reader hasn't caught up yet; advice may be off.",
    );
    expect(v.roster).toHaveLength(5);
  });
  it('build 143 with no failed sections: no banner, footer reads the build and parser target', () => {
    const r = fixture('mid-session');
    r.versions.gameBuild = 143;
    const v = view(r);
    expect(v.banners.filter((b) => b.kind === 'patch')).toEqual([]);
    expect(`${v.footer.game} · ${v.footer.parserTarget}`).toBe('game build 143 · parser targets 2.3.540');
  });
});

describe('US-17 not covered', () => {
  it('lists Construction and Worship', () => {
    expect(view(fixture('not-covered')).notCovered).toEqual(['Construction', 'Worship']);
  });
});

describe('US-18 Spend Plan', () => {
  const r = fixture('spend-plan');
  const v = view(r);
  const sp = v.account.spendPlan;
  it('5 lines then "show more (1)", per-wallet running totals, statuses', () => {
    expect(sp?.lines).toHaveLength(5);
    expect(sp?.hiddenCount).toBe(1);
    expect(sp?.lines.map((l) => l.runningTotal)).toEqual([
      'total 1.2M on Alder',
      'total 2M on Alder',
      'total 4M on Alder',
      'total 300k on Cedar',
      null,
    ]);
    expect(sp?.lines[2]?.statusText).toBe('withdraw 1.5M from storage on Alder, then buy');
    expect(sp?.lines[4]?.statusText).toBe('save for it: 5M short');
    expect(sp?.summary).toBe('4 buys now on 2 characters');
    expect(sp?.unavailable).toEqual(["can't price Statue Gold right now"]);
    expect(sp?.goal?.action.text).toBe('Vault upgrade 1');
  });
  it('the unpriced line reads "cost not checked" with the totals note', () => {
    const all = view(r, { expanded: new Set(['spend']) }).account.spendPlan;
    expect(all?.lines[5]).toMatchObject({
      cost: 'cost not checked, see the price in game',
      note: 'totals below assume you skip the unchecked items',
    });
  });
  it('Roster chips: "Spend here: 3 buys" on character 0, "1 buy" on character 2, none elsewhere', () => {
    expect(v.roster.map((x) => x.spendChip)).toEqual([
      'Spend here: 3 buys, ~4M → Spend Plan',
      null,
      'Spend here: 1 buy, ~300k → Spend Plan',
    ]);
  });
});

describe('US-19 Higher-leverage option', () => {
  it('names character 4 with its why and Source; no Skip today', () => {
    const v = view(fixture('higher-leverage-character'), { focus: 1 });
    expect(v.focus?.higherLeverage).toMatchObject({
      partner: { index: 4, name: 'Elm' },
      why: 'Higher kill rate on Frogs (about 2x).',
      controls: { skip: false, notForMe: true, report: true },
    });
  });
  it('Not for me on either character hides it on both (same key)', () => {
    const r = fixture('higher-leverage-character');
    const key = r.characters[1]?.higherLeverage?.key as string;
    expect(view(r, { focus: 4 }, { dismissals: { [key]: 142 } }).focus?.higherLeverage).toBeNull();
    expect(view(r, { focus: 1 }, { dismissals: { [key]: 142 } }).focus?.higherLeverage).toBeNull();
  });
  it('paused comparisons show the note', () => {
    const r = fixture('higher-leverage-character');
    r.higherLeverageStatus = 'paused-parser-behind';
    expect(view(r, { focus: 1 }).focus?.higherLeverageNote).toBe(
      'comparisons paused: game updated, parser not caught up',
    );
  });
});

describe('US-20 get past a wrong blocker', () => {
  const one = () => {
    const r = fixture('blocker-overflow');
    const c = r.characters[0] as (typeof r.characters)[number];
    c.goals = c.goals.slice(1, 3);
    c.goals[1] = { ...(c.goals[1] as Goal), category: 'spendable' };
    c.verdict.blockerKeys = [c.goals[0]?.nextAction.key as string];
    return r;
  };
  it('skipping the only blocker reads "Ready · 1 skipped" and counts as Ready; no Not for me', () => {
    const r = one();
    const key = r.characters[0]?.verdict.blockerKeys[0] as string;
    expect(view(r).roster[0]?.pill.text).toBe('Fix before you leave');
    expect(view(r, { focus: 0 }).focus?.blockers[0]?.action.controls).toEqual({
      skip: true,
      notForMe: false,
      report: true,
    });
    const v = view(r, {}, { skips: skipNow(r, key) });
    expect(v.roster[0]?.pill).toEqual({ kind: 'ready', text: 'Ready · 1 skipped' });
    expect(v.progress.ready).toBe(2);
  });
  it('with 2 blockers and one skipped, still "Fix before you leave"', () => {
    const r = fixture('blocker-overflow');
    const key = r.characters[0]?.verdict.blockerKeys[0] as string;
    expect(view(r, {}, { skips: skipNow(r, key) }).roster[0]?.pill.text).toBe('Fix before you leave');
  });
});

describe('US-21 All set ignores Purpose questions, not safety doubts', () => {
  it('4 Ready and 1 no-purpose: banner shows, label "safe to log off · 1 Unknown"', () => {
    const r = fixture('all-set');
    (r.characters[4] as (typeof r.characters)[number]).verdict = {
      kind: 'unknown',
      blockerKeys: [],
      unknownReason: 'no-purpose',
      suggestion: null,
    };
    const v = view(r);
    expect(v.allSet).not.toBeNull();
    expect(v.progress.label).toBe('safe to log off · 1 Unknown');
  });
  it('4 Ready and 1 cannot-tell: no banner', () => {
    expect(view(fixture('cannot-tell')).allSet).toBeNull();
  });
  it('account safety unknown blocks All set until skipped, then "(1 skipped)"', () => {
    const r = fixture('all-set');
    r.account.safety = 'unknown';
    expect(view(r).allSet).toBeNull();
    expect(view(r).account.safetyUnknown).toMatchObject({ skipKey: 'unknown@account', skipped: false });
    expect(view(r, {}, { skips: skipNow(r, 'unknown@account') }).allSet?.text).toBe(
      'All set: safe to log off (1 skipped)',
    );
  });
  it('cannot-tell skipped: "Unknown · skipped", banner "(1 skipped)", label "· 1 Unknown"', () => {
    const r = fixture('cannot-tell');
    const v = view(r, { focus: 4 }, { skips: skipNow(r, 'unknown@c4') });
    expect(v.roster[0]?.pill.text).toBe('Unknown · skipped');
    expect(v.allSet?.text).toBe('All set: safe to log off (1 skipped)');
    expect(v.progress.label).toBe('safe to log off · 1 Unknown');
    expect(v.focus?.unknown).toMatchObject({ skipKey: 'unknown@c4', skipped: true });
  });
});

describe('US-22 account stockpiles block All set', () => {
  const r = fixture('account-stockpile');
  it('blockers lead the Account section; no banner; "5 of 5 Ready · fix 2 in Account"; pills Ready', () => {
    const v = view(r);
    expect(v.account.blockers.map((g) => g.action.text)).toEqual([
      'Claim Arcade balls: full for 48h',
      'Spend Water: at cap',
    ]);
    expect(v.allSet).toBeNull();
    expect(v.progress.label).toBe('5 of 5 Ready · fix 2 in Account');
    expect(new Set(v.roster.map((x) => x.pill.text))).toEqual(new Set(['Ready']));
  });
  it('both blockers plus 5 other Goals, then "show more (2)"', () => {
    const v = view(r);
    expect(v.account.goals).toHaveLength(5);
    expect(v.account.hiddenCount).toBe(2);
  });
  it('skipping both: banner with "(2 skipped)"; neither offers Not for me', () => {
    const v = view(r, {}, { skips: skipNow(r, ...r.account.blockerKeys) });
    expect(v.allSet?.text).toBe('All set: safe to log off (2 skipped)');
    expect(view(r).account.blockers.every((g) => !g.action.controls.notForMe)).toBe(true);
  });
});

describe('FR-34 new since unfocused', () => {
  it('counts visible Next Actions that were not seen', () => {
    const r = fixture('mid-session');
    const seen = view(r).visibleKeys;
    expect(view(r, {}, { seenKeys: seen }).newCount).toBe(0);
    expect(view(r, {}, { seenKeys: seen.slice(1) }).newCount).toBe(1);
  });
});

describe('detector failures and stage unknown', () => {
  it('counts failed Detectors in the footer (FR-39)', () => {
    expect(view(fixture('detector-failure')).footer.failedChecks).toBe(2);
  });
  it('Stage unknown: banner, and only Verdict blockers render', () => {
    const r = fixture('blocker-overflow');
    r.stage = { id: 'unknown', label: 'Unknown' };
    const v = view(r, { focus: 0 });
    expect(v.banners.map((b) => b.kind)).toContain('stage-unknown');
    expect(v.focus?.blockers).toHaveLength(4);
    expect(v.focus?.goals).toEqual([]);
  });
  it('banners follow TR-11 order', () => {
    const r = fixture('all-set');
    r.versions.parserBehind = true;
    const v = view(r, { update: { text: 'New version' }, connection: { text: 'Offline' } });
    expect(v.banners.map((b) => b.kind)).toEqual(['update', 'patch', 'offline', 'all-set']);
  });
});
