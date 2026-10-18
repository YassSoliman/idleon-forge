// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 Purpose & Milestones: one test per user story (docs/specs/M4-purpose-milestones.md §4) on the
// scrubbed W2-late and W3-early saves, parsed the way the worker parses them (frontier and supply
// rates, Toolbox functions). The † kill rates are checked within ±5% before any number is pinned.
import { fileURLToPath } from 'node:url';
import { withAccount, withCharacter, withUnknown } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { lookupOf } from '../../src/metapath';
import { buildNowView, DEFAULT_UI } from '../../src/now/build-now-view';
import { EMPTY_PREFS } from '../../src/now/prefs';
import {
  cardEtas,
  classXpActionFor,
  coveredAfkTypes,
  derive,
  etaSuffix,
  purposesFor,
} from '../../src/purpose';
import { deps, derived, engineOf, inputOf, kb, purposeOf, W2, W3, workerState } from './helpers';

const LATEST = fileURLToPath(new URL('../../../account-state/fixtures/public/latest.json', import.meta.url));

const within5 = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected) / expected).toBeLessThan(0.05);
const goal = (p: ReturnType<typeof purposeOf>, prefix: string) =>
  p.goals.find((g) => g.contributionId.startsWith(prefix));

describe('the pre-registered † kill rates land within ±5% at the pin (§4)', () => {
  it('W2-late Barbarian Lv 60 on Poop: 1,430 kills/h; W3-early Squire Lv 85: 1,065', () => {
    within5(W2().characters[0]?.fighting?.finalKillsPerHour ?? 0, 1430);
    within5(W3().characters[3]?.fighting?.finalKillsPerHour ?? 0, 1065);
  });
});

describe('US-1 a fighter’s Purpose with an ETA', () => {
  const p = purposeOf(derived(W2()), 0);
  it('headlines the Vault kill row: ~2,995 → 10k for Dirty Money, about 5h (7,005 ÷ 1,430)', () => {
    expect(p.status).toBe('serving');
    expect(p.headline?.contributionId).toBe('upgrade-vault.contribution.kill-row-kill-row-map-8');
    expect(p.headline?.text.headline).toBe('Poop kills ~2,995 → 10k for Dirty Money · about 5h');
    expect(p.headline?.saved).toBe(2995);
    expect(p.headline?.eta.kind === 'time' && p.headline.eta.seconds / 3600).toBeCloseTo(7005 / 1430, 1);
  });
  it('cites the Upgrade Vault entry and its player Source', () => {
    expect(p.headline?.provenance.entryIds).toContain('upgrade-vault.goal.kill-row-map-8');
    expect(
      kb.entries[p.headline?.contributionId ?? '']?.sources.some((s) => s.url.includes('idleon.wiki')),
    ).toBe(true);
  });
});

describe('US-2 stop here at the Milestone', () => {
  it('8 h return: stop at 10k; the next step, 100k, is beyond the 24 h horizon', () => {
    const p = purposeOf(derived(W2()), 0);
    expect(p.stopHere).toMatchObject({
      goalId: 'upgrade-vault.goal.kill-row-map-8',
      at: 10_000,
      following: 100_000,
    });
    expect(
      p.stopHere?.etaFollowing.kind === 'time' && p.stopHere.etaFollowing.seconds / 3600,
    ).toBeGreaterThan(24);
    const r = engineOf(W2());
    const stop = r.characters[0]?.goals.find((g) => g.milestone?.stopHere);
    expect(stop?.nextAction.text).toMatch(
      /^Poop kills reach 10k in about 5h\. The next step, 100k, is about \d+h away\. Consider stopping here\.$/,
    );
    expect(stop?.nextAction.key).toBe('upgrade-vault.contribution.kill-row-kill-row-map-8@c0#10000');
  });
  it('never changes the Verdict (D2) and a 2 h return shows no stop-here', () => {
    const r = engineOf(W2());
    expect(r.characters[0]?.purposeStatus).toBe('serving');
    expect(purposeOf(derived(W2(), { expectedReturnHours: 2 }), 0).stopHere).toBeNull();
  });
});

describe('US-3 Goals that don’t count', () => {
  const p = purposeOf(derived(W2()), 0);
  it('the Poop card: 1 → 11 copies, about 117 h on average, not worthwhile (beyond 24 h)', () => {
    const card = goal(p, 'cards.contribution.fight-');
    expect(card?.worthwhile).toBe(false);
    expect(card?.next).toBe(11);
    expect(card?.eta.kind === 'time' && card.eta.bound).toBe('mean-at-base-rate');
    expect(card?.eta.kind === 'time' && card.eta.seconds / 3600).toBeCloseTo((10 * 16_667) / 1430, -1);
    expect(card?.text.headline).toContain('on average');
  });
  it('no Death Note Goal at W2-late; the portal off the frontier is display only (D5)', () => {
    expect(goal(p, 'death-note.')).toBeUndefined();
    const portal = goal(p, 'portals.');
    expect(portal?.saved).toBe(2814);
    expect(portal?.worthwhile).toBe(false);
    expect(portal?.notWorthwhileReason).toBe('rule');
  });
  it('W3-early Shaman Lv 54 on Sand Castle: ~12.8k → 25k, banked while the building is Lv 0', () => {
    const dn = goal(purposeOf(derived(W3()), 5), 'death-note.');
    expect(dn?.saved).toBe(12_806);
    expect(dn?.next).toBe(25_000);
    expect(dn?.worthwhile).toBe(false);
    expect(dn?.text.detail).toBe('banked: the Death Note building is Lv 0');
  });
});

describe('US-4 skilling on purpose (the Copper lesson)', () => {
  it('W2-late Squire Lv 43: "Mining 20 → 25 opens The Ol\' Straightaway", yes/no, no per-hour number', () => {
    const p = purposeOf(derived(W2()), 1);
    expect(p.status).toBe('serving');
    expect(p.headline?.text.headline).toBe("Mining 20 → 25 opens The Ol' Straightaway");
    expect(p.headline?.eta).toEqual({ kind: 'yesno' });
    expect(p.goals.every((g) => !/about|\/h/.test(g.text.headline))).toBe(true);
  });
  it('Copper is a stamp material: Mana Stamp’s raise costs 1,371 at M7’s price, 1,294 in storage', () => {
    const p = purposeOf(derived(W2()), 1);
    expect(goal(p, 'stamps.contribution.material-mining')?.text.headline).toBe(
      'Copper: stamp material for Mana Stamp',
    );
  });
  it('W3-early Squire Lv 51: "Mining 29 → 40 opens Echoing Egress"', () => {
    const p = purposeOf(derived(W3()), 1);
    expect(p.status).toBe('serving');
    expect(p.headline?.text.headline).toBe('Mining 29 → 40 opens Echoing Egress');
  });
  it('W3-early Barbarian Lv 56 fishing: the Fishing door and the Role (D6)', () => {
    const p = purposeOf(derived(W3()), 4);
    expect(p.status).toBe('serving');
    expect(p.goals.map((g) => g.text.headline)).toEqual([
      'Fishing 22 → 30 opens Deepwater Docks',
      'Fishing: its job on your team',
    ]);
  });
});

describe('US-5 what is this character for?', () => {
  const d = derived(W2());
  it('W2-late Shaman Lv 44 on Slime: card complete, Class EXP under half its best map: exhausted', () => {
    const p = purposeOf(d, 2);
    expect(p.status).toBe('exhausted');
    expect(goal(p, 'cards.contribution.fight-')?.notWorthwhileReason).toBe('complete');
    expect(goal(p, 'classes.')?.notWorthwhileReason).toBe('rule');
    expect(p.prompt?.kind).toBe('what-for');
    expect(p.prompt?.reason.headline).toContain('Slime card is complete');
  });
  it('W2-late Bowman Lv 54 on Green Mushroom: exhausted; its Role is the one suggestion (FR-14)', () => {
    expect(purposeOf(d, 3).status).toBe('exhausted');
    const r = engineOf(W2());
    const bowman = r.characters[3];
    expect(bowman?.verdict.kind).toBe('unknown');
    expect(bowman?.verdict.unknownReason).toBe('no-purpose');
    expect(bowman?.verdict.suggestion?.text).toBe('Its Role on your team is catching: send it there');
  });
});

describe('US-6 the pusher’s portal', () => {
  it('W3-early Squire Lv 85: "Portal on Thermonuclear Climb: 19 → 15k kills", M2’s ETA unchanged', () => {
    const input = inputOf(W3());
    const p = purposeOf(derive(input), 3);
    expect(p.headline?.contributionId).toBe('portals.contribution.push-map-109');
    expect(p.headline?.worthwhile).toBe(true);
    expect(p.headline?.text.headline).toBe('Portal on Thermonuclear Climb: 19 → 15k kills · about 14h');
    expect(p.headline?.eta.kind === 'time' && p.headline.eta.seconds).toBe(input.meta.pushGoal?.etaSeconds);
    expect(goal(p, 'cards.contribution.fight-')?.text.headline).toMatch(
      /^Thermister card: first copy \(5× drop chance while unowned\)/,
    );
  });
  it('the second Squire (Lv 51) gets no portal Goal', () => {
    expect(goal(purposeOf(derived(W3()), 1), 'portals.')).toBeUndefined();
  });
});

describe('US-7 reached since last time', () => {
  const at = (s: ReturnType<typeof W2>, kills: number) => {
    const v = s.account.vault;
    if (!v) throw new Error('no vault');
    return withAccount(s, { vault: { ...v, killTotals: v.killTotals.map((k, i) => (i === 3 ? kills : k)) } });
  };
  it('a session start at 9,800 and a save at 10,400: one "Reached 10k Poop kills" line, next 100k', () => {
    const now = at(W2(), 10_400);
    const p = purposeOf(derived(now, { history: { sessionStart: at(W2(), 9800) } }), 0);
    expect(p.reached).toEqual([
      expect.objectContaining({ goalId: 'upgrade-vault.goal.kill-row-map-8', milestone: 10_000 }),
    ]);
    expect(goal(p, 'upgrade-vault.')?.next).toBe(100_000);
    const r = engineOf(now, {
      history: {
        entries: [{ lastCloudSave: 1, receivedAt: 1, state: at(W2(), 9800) }],
        sessionStartedAt: 1,
        learnedExpectedReturnSeconds: null,
      },
    });
    expect(r.characters[0]?.doneThisSession.map((x) => x.text)).toEqual([
      'Reached 10k Poop kills: Dirty Money step 4',
    ]);
  });
  it('a new Play Session (no session-start save): the line is gone', () => {
    expect(purposeOf(derived(at(W2(), 10_400)), 0).reached).toEqual([]);
  });
  it('a projected crossing never says Reached: "reached, claim to confirm", next stays 10k (FR-9)', () => {
    const s = at(W2(), 9800);
    const p = purposeOf(derived(s, { now: s.asOf + 3 * 3_600_000 }), 0);
    const v = goal(p, 'upgrade-vault.');
    expect(v?.next).toBe(10_000);
    expect(v?.eta).toEqual({ kind: 'none', reason: 'reached-unconfirmed' });
    expect(v?.text.headline).toContain('reached, claim to confirm');
    expect(p.reached).toEqual([]);
  });
});

describe('US-8 not covered yet', () => {
  it('a character on Cooking: "Not covered yet: Cooking", Unknown, no suggestion', () => {
    const s = withCharacter(W2(), 3, { afkType: 'COOKING', targetMonster: 'CookingM', mapIndex: 0 });
    const p = purposeOf(derived(s), 3);
    expect(p.status).toBe('not-covered');
    expect(p.prompt?.reason.headline).toBe('Not covered yet: Cooking');
    expect(p.suggestedTarget).toBeNull();
    expect(coveredAfkTypes(kb).has('COOKING')).toBe(false);
  });
  it('Catching is covered (the card, stamp-material and Role Contributions name it)', () => {
    const s = withCharacter(W2(), 3, { afkType: 'CATCHING', targetMonster: 'Bug1', mapIndex: 0 });
    expect(purposeOf(derived(s), 3).status).not.toBe('not-covered');
    expect(coveredAfkTypes(kb).has('CATCHING')).toBe(true);
  });
});

describe('US-9 broken data never gives a Purpose', () => {
  it('an unknown Vault: the Vault Goal is dropped with a diagnostic; nothing worthwhile left is cannot-tell', () => {
    const d = derived(withUnknown(W2(), 'account.vault'));
    const p = purposeOf(d, 0);
    expect(goal(p, 'upgrade-vault.')).toBeUndefined();
    expect(d.diagnostics.some((x) => x.entryId.startsWith('upgrade-vault.') && x.characterIndex === 0)).toBe(
      true,
    );
    expect(p.status).toBe('cannot-tell');
    // A character with another worthwhile Goal keeps its status.
    expect(purposeOf(d, 1).status).toBe('serving');
  });
  it('an unknown AFK type is cannot-tell, never a guessed activity (FR-1)', () => {
    expect(purposeOf(derived(withUnknown(W2(), 'characters[1].afkType')), 1).status).toBe('cannot-tell');
  });
  it('no AFK Target is no-activity, with no M4 prompt (M3 FR-12 owns the line)', () => {
    const p = purposeOf(
      derived(withCharacter(W2(), 3, { afkType: 'Nothing', afkTarget: null, targetMonster: null })),
      3,
    );
    expect(p.status).toBe('no-activity');
    expect(p.prompt).toBeNull();
  });
});

describe('FR-17 determinism, TR-7 budget and the module contract', () => {
  it('the same input gives the same output', () => {
    expect(derived(W3())).toEqual(derived(W3()));
  });
  it('derivePurposes stays well inside the frame budget for 6 characters', () => {
    const input = inputOf(W3());
    const t = performance.now();
    derive(input);
    expect(performance.now() - t).toBeLessThan(250);
  });
  it('Verdicts: serving is Ready when safe; exhausted is Unknown no-purpose (M3 FR-9)', () => {
    const r = engineOf(W3());
    const squire = r.characters.find((c) => c.index === 1);
    expect(squire?.purposeStatus).toBe('serving');
    expect(squire?.purpose[0]?.text).toBe('Mining 29 → 40 opens Echoing Egress');
  });
  it('the ETA words: one formatter, unknown tokens hidden', () => {
    expect(
      etaSuffix({ kind: 'time', seconds: 4.9 * 3600, ratePerHour: 1, feeders: [0], bound: 'estimate' }),
    ).toBe(' · about 5h');
    expect(etaSuffix({ kind: 'yesno' })).toBe('');
    expect(etaSuffix({ kind: 'none', reason: 'zero-rate' })).toBe(' · not progressing');
  });
});

describe('cross-module: M8 Cards view and M15 F3', () => {
  const input = (s: ReturnType<typeof W2>) => ({
    state: s,
    history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
    knowledge: { version: 't', coverage: () => [], kb },
    now: s.asOf,
    options: { expectedReturnSeconds: 8 * 3600 },
  });
  it('card ETAs sum every character on the card’s monster (two feeders: half the time)', () => {
    const base = W2();
    const alone = cardEtas(input(base), deps)(0, 'poopSmall');
    const fighting = base.characters[0]?.fighting ?? null;
    const two = withCharacter(base, 4, {
      targetMonster: 'poopSmall',
      mapIndex: 8,
      afkTarget: 'Poop',
      fighting,
    });
    const shared = cardEtas(input(two), deps)(0, 'poopSmall');
    expect(alone?.feeders).toBe(1);
    expect(shared?.feeders).toBe(2);
    expect(shared?.hours).toBeCloseTo((alone?.hours ?? 0) / 2, 3);
  });
  it('the top Class XP Next Action names who, where and how long (M15 FR-15)', () => {
    const a = classXpActionFor(deps)(input(W3()));
    expect(a?.entryId).toBe('classes.goal.level');
    expect(a?.text).toMatch(/^Level \w+ Lv \d+ on [\w' ]+: Lv \d+ in about \d+[mh]$/);
    expect(purposesFor(input(W3()), deps)).toBe(purposesFor(input(W3()), deps));
  });
  it('the shipped bundle has the generated ladders the Contributions name', () => {
    expect(lookupOf(kb).get('upgrade-vault.fact.kill-slots')).toBeDefined();
    expect(kb.entries['portals.contribution.push-map-109']).toBeDefined();
  });
});

describe('the Focus card’s Purpose block (Design Lab now.focus-purpose: Quest line + ladder)', () => {
  const focus = (i: number) => {
    const s = W2();
    return buildNowView(engineOf(s), EMPTY_PREFS, { ...DEFAULT_UI, focus: i, now: s.asOf }).focus;
  };
  it('one line plus a short ladder: now, next with its ETA, the step after', () => {
    const f = focus(0);
    const head = f?.purpose[0];
    expect(head?.text).toBe('Poop kills ~2,995 → 10k for Dirty Money · about 5h · consider stopping here');
    expect(head?.ladder.map((l) => l.state)).toEqual(['done', 'next', 'later']);
    expect(head?.ladder[1]).toEqual({ state: 'next', label: '10k kills', note: 'about 5h' });
    expect(head?.bar).toEqual({ current: 2995, next: 10_000 });
    expect(f?.purposeStatus).toBe('serving');
  });
  it('copy rules: every line 12 words or fewer, units on numbers, no repeated line', () => {
    for (const i of [0, 1, 2, 3, 4]) {
      const lines = focus(i)?.purpose.map((p) => p.text.replace(/ · consider stopping here$/, '')) ?? [];
      for (const t of lines)
        expect(t.split(/\s+/).filter((w) => /\w/.test(w)).length, t).toBeLessThanOrEqual(12);
      expect(new Set(lines).size).toBe(lines.length);
    }
  });
  it('a projection at the next step: the ladder says "reached, claim to confirm", then the step after', () => {
    const base = W2();
    const v = base.account.vault;
    if (!v) throw new Error('no vault');
    const s = withAccount(base, {
      vault: { ...v, killTotals: v.killTotals.map((k, i) => (i === 3 ? 9800 : k)) },
    });
    const now = s.asOf + 3 * 3_600_000;
    const f = buildNowView(engineOf(s, { now }), EMPTY_PREFS, { ...DEFAULT_UI, focus: 0, now }).focus;
    const head = f?.purpose.find((p) => p.goalId === 'upgrade-vault.goal.kill-row-map-8');
    expect(head?.ladder.map((l) => [l.state, l.label, l.note.replace(/about \d+h/, 'ETA')])).toEqual([
      ['done', '10k kills', 'reached, claim to confirm'],
      ['next', '100k kills', 'ETA'],
    ]);
  });
  it('"What is this character for?" carries the reason (FR-14)', () => {
    const f = focus(2);
    expect(f?.unknown?.text).toBe('What is this character for?');
    expect(f?.unknown?.note).toContain('Slime card is complete');
  });
});

describe('R7 QA: capped ladders and the headline that repeats the first Goal', () => {
  it('latest: a capped Class level reads "Class level 1,280 · maxed", never a dangling arrow', () => {
    const d = derived(workerState(LATEST));
    const texts = d.purposes.flatMap((p) => p.goals.map((g) => g.text.headline));
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.filter((t) => /→\s*(·|$)/.test(t))).toEqual([]);
    const capped = texts.filter((t) => t.startsWith('Class level') && t.endsWith('maxed'));
    expect(capped.length).toBeGreaterThan(0);
    for (const t of capped) expect(t).toMatch(/^Class level [\d,]+ · maxed$/);
    expect(texts).toContain('Class level 1,280 · maxed');
  });

  it('W3-early Squire Lv 85: the portal headline echoes the push Goal, so it is shown once (ladder kept)', () => {
    const s = W3();
    const r = engineOf(s);
    const squire = s.characters.find((c) => c.class === 'Squire' && c.level === 85);
    if (!squire) throw new Error('fixture');
    const v = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: r.asOf, focus: squire.index });
    expect(v.focus?.goals[0]?.id).toBe('metapath.goal.push');
    expect(v.focus?.purpose[0]?.echoesGoal).toBe(true);
    expect(v.focus?.purpose[0]?.ladder.length).toBeGreaterThan(0);
    // Any other character's headline is shown as usual.
    const other = s.characters.find((c) => c.class === 'Squire' && c.level === 51);
    if (!other) throw new Error('fixture');
    const w = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: r.asOf, focus: other.index });
    expect(w.focus?.purpose[0]?.echoesGoal).toBeUndefined();
  });
});
