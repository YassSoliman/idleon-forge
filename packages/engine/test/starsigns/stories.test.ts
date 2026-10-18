// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 user stories (docs/specs/M16-star-signs.md §4) on the committed scrubbed saves. Characters are
// named by class and level only.
import { describe, expect, it } from 'vitest';
import { rankGoals } from '../../src/core/rank';
import { runMetaPath } from '../../src/metapath';
import { positionOf } from '../../src/metapath/priority';
import type { Goal } from '../../src/result';
import {
  buildStarSigns,
  buyable,
  candyPool,
  chartState,
  contextOf,
  DEFAULT_VALUES,
  takeCandy,
} from '../../src/starsigns';
import {
  claim,
  claimAll,
  handedIn,
  kb,
  m16,
  progressOf,
  run,
  scrubbedFile,
  setProgress,
  signIds,
  slotOf,
  starGoals,
  starState,
} from './helpers';

const W2 = () => starState(scrubbedFile('scrubbed-w2'));
const W3 = () => starState(scrubbedFile('scrubbed-w3'));
const byId = (gs: Goal[], id: string) => gs.filter((g) => g.id === id);
const LEG1 = [
  'Dwarfo_Beardus',
  'Hipster_Logger',
  'Pack_Mule',
  'Pirate_Booty',
  'All_Rounder',
  'Fatty_Doodoo',
  'Robinhood',
  'Ned_Kelly',
  'Chronus_Cosmos',
];
const STARTERS = ['The_Buff_Guy', 'Flexo_Bendo', 'The_Book_Worm', 'The_Fuzzy_Dice'];

describe('US-1 Start the System (W2-late)', () => {
  it('shows one Telescope Goal whose Next Action opens the tree on the closest character the pusher rule allows', () => {
    const s = W2();
    const r = run(s);
    const goals = starGoals(r);
    expect(goals.map((g) => g.id)).toEqual(['star-signs.goal.telescope']);
    const g = goals[0] as Goal;
    expect(g.title).toBe('Start Star Signs: the Telescope');
    expect(g.category).toBe('compounding');
    const meta = runMetaPath(s, kb, s.asOf);
    // The Barbarian Lv 60 is closest (about 5,000 kills) but it is the pusher on its push (M14 FR-18).
    expect(meta.pusher?.index).toBe(slotOf(s, 'Barbarian', 60));
    expect(g.nextAction.text).toBe('Move your Wizard Lv 56 to The Base Of The Bark (W1)');
    // The kills and the time to open it move behind the tap (copy rule: a step is at most 12 words).
    expect(g.nextAction.why).toMatch(
      /^2,500 more kills there open Hollowed Trunk; time to open it: about \d+[mh] at its kill rate\. /,
    );
    // Position 3 (the free-value fills block).
    expect(positionOf(meta.list, 'star-signs.goal.telescope')).toBe(3);
  });

  it('its why counts what the hand-in opens: 6 constellations worth 23 points, enough for Chronus Cosmos', () => {
    const g = starGoals(run(W2()))[0] as Goal;
    expect(g.nextAction.why).toContain(
      'After this, 6 constellations are ready, worth 23 points: enough for Chronus Cosmos, 2 signs on every character.',
    );
  });

  it('its details hold one sign line per character; nothing else from M16 shows', () => {
    const s = W2();
    const g = starGoals(run(s))[0] as Goal;
    const lines = (g.details ?? []).filter((d) => d.subject !== 'account').map((d) => d.text);
    expect(lines).toHaveLength(s.characters.length);
    expect(lines.every((l) => l.includes('wear The Fuzzy Dice'))).toBe(true);
    expect(lines.filter((l) => l.includes('after Chronus Cosmos: Pirate Booty + All Rounder'))).toHaveLength(
      4,
    );
    expect(lines.find((l) => l.startsWith('Squire Lv 43 (Mining)'))).toContain(
      'after Chronus Cosmos: Dwarfo Beardus + Pack Mule',
    );
    expect(lines.find((l) => l.startsWith('Barbarian Lv 60'))).toContain(
      '(wearing The Buff Guy; about 4,994 kills until it can reach the Telescope)',
    );
  });

  it('once the opener stands at the Telescope with the dialogue, the Next Action is A-2 with a 1-hour candy', () => {
    const s = W2();
    const w = s.characters[slotOf(s, 'Wizard', 56)];
    if (!w) throw new Error('no Wizard');
    w.mapIndex = 31;
    w.telescopeRoute = [0, 0, 0];
    w.npcDialog = { ...(w.npcDialog ?? {}), Telescope: 1 };
    const g = starGoals(run(s))[0] as Goal;
    expect(g.nextAction.text).toBe('On your Wizard Lv 56: withdraw a 1-hour Time Candy for star A-2');
    expect(g.nextAction.why).toMatch(/^Withdraw it, .*click star A-2 .*then send it back to .+\. /);

    // A-2 done: hand the quest in.
    claim(s, ['A-2']);
    expect((starGoals(run(s))[0] as Goal).nextAction.text).toBe(
      'On your Wizard Lv 56: hand in "I\'m Seeing Stars!" at the Telescope',
    );
    expect((starGoals(run(s))[0] as Goal).nextAction.why).toMatch(
      /^Talk to the Telescope again, with 2 bag slots free first: every character can then use constellations\. /,
    );
  });
});

describe('US-2 What to clear next (W3-early)', () => {
  it('shows exactly 2 constellation Goals, A-7 then B-1, quickest first', () => {
    const r = run(W3());
    const cs = byId(starGoals(r), 'star-signs.goal.constellation');
    expect(cs.map((g) => g.title)).toEqual([
      'Constellation A-7: Winding Willows, AFK 2h on 2 characters',
      'Constellation B-1: The Mimic Hole, reach the star on 3 characters',
    ]);
    // Goals stay together in the Account ranking (position 3).
    const ids = r.account.goals.map((g) => g.nextAction.key);
    expect(ids.indexOf('star-signs.goal.constellation@A-7')).toBeLessThan(
      ids.indexOf('star-signs.goal.constellation@B-1'),
    );
  });

  it("B-1's Walkthrough has 3 visit steps with the Constellation Locations link", () => {
    const s = W3();
    const b1 = run(s).account.goals.find((g) => g.nextAction.key === 'star-signs.goal.constellation@B-1');
    const w = b1?.walkthrough;
    expect(w?.collapsed).toBe('B-1: 0 of 3 characters · about 9m');
    expect(w?.steps).toHaveLength(3);
    for (const st of w?.steps ?? []) {
      expect(st.text).toMatch(/: click the star at The Mimic Hole \(W2\)$/);
      expect(st.why).toMatch(/^Then go back to .+\.$/);
      expect(st.sources.some((x) => x.url === 'https://idleon.wiki/wiki/Constellation_Locations#B-1')).toBe(
        true,
      );
    }
    // Free characters first: the pusher is never the first assignee while others can go.
    const meta = runMetaPath(s, kb, s.asOf);
    expect(w?.steps[0]?.subject).not.toBe(`c${meta.pusher?.index}`);
  });

  it('A-7 uses two-hour candies, never a four-hour one, on characters that can reach Winding Willows', () => {
    const s = W3();
    const a7 = run(s).account.goals.find((g) => g.nextAction.key === 'star-signs.goal.constellation@A-7');
    const uses = (a7?.walkthrough?.steps ?? []).filter((x) => x.text.includes('use a'));
    expect(uses).toHaveLength(2);
    expect(uses.every((x) => x.text.includes('use a 2-hour Time Candy'))).toBe(true);
    for (const u of uses) {
      const i = Number(u.subject?.slice(1));
      expect(s.account.supplyRates?.reachable[i]).toContain(19);
    }
  });

  it('the Star Signs line is info only: the unlock waits, banked plus ready covers Chronus Cosmos', () => {
    const r = run(W3());
    expect(byId(starGoals(r), 'star-signs.goal.signs')).toHaveLength(0);
    expect(r.starSigns?.milestone).toBe(
      '21 points ready, 19 needed for Chronus Cosmos (2 signs on every character)',
    );
    expect(r.starSigns?.plan).toMatch(/^Bank your points: after A-7 and B-1, unlock up to .+ at once$/);
    expect(r.starSigns?.next.filter((n) => !n.shown).map((n) => n.name)).toEqual(['B-4', 'A-1', 'A-3']);
  });

  it('never names C-6 (9 characters), C-1 (nobody Lv 90) or any D-row constellation', () => {
    const r = run(W3());
    const text = JSON.stringify({ goals: r.account.goals, starSigns: r.starSigns, ap: r.account.activePlay });
    for (const n of ['C-6', 'C-1', 'D-1', 'D-2', 'D-3', 'D-4']) expect(text).not.toContain(`${n}:`);
    expect(text).not.toMatch(/Constellation D-/);
  });
});

describe('US-3 Claim what is already earned', () => {
  it('W2-late after the hand-in: A-9 is a claim Goal on a character already recorded', () => {
    const s = handedIn(W2());
    const g = run(s).account.goals.find((x) => x.nextAction.key === 'star-signs.goal.constellation@A-9');
    expect(g?.title).toBe('Constellation A-9: End Of The Road, claim it');
    const steps = g?.walkthrough?.steps ?? [];
    expect(steps.map((x) => x.text.split(': ')[1])).toEqual([
      'withdraw 1 Forest Villa Key from storage',
      'click the star in End Of The Road (1 Forest Villa Key)',
    ]);
    expect(steps[1]?.why).toBe('Entering End Of The Road spends 1 Forest Villa Key.');
    const recorded = progressOf(s, 'A-9')?.recorded ?? [];
    expect(recorded).toContain(Number(steps[0]?.subject?.slice(1)));
  });

  it('W3-early: A-9 (2 of 3) is not a Goal; it is the If you have time challenge, never on a recorded character', () => {
    const s = W3();
    const r = run(s);
    expect(r.account.goals.some((g) => g.nextAction.key.endsWith('@A-9'))).toBe(false);
    const ap = r.account.activePlay.find((a) => a.key === 'star-signs.check.activeplay-challenge@A-9');
    expect(ap?.text).toBe(
      'Kill Amarok in under 20 seconds on 1 more character (2 of 3): try your Bowman Lv 60, highest-level not yet done; spends 1 Forest Villa Key each',
    );
    expect(ap?.text).not.toMatch(/Wizard Lv 73|Squire Lv 85/);
  });
});

describe('US-4 Which sign on which character', () => {
  it('W3-early: one line per character; only the Wizard Lv 73 can change signs; no starter swap is a Next Action', () => {
    const r = run(W3());
    const lines = r.starSigns?.characters ?? [];
    expect(lines.find((c) => c.line.startsWith('Squire Lv 51'))?.line).toBe(
      'Squire Lv 51 (Mining): wear The Fuzzy Dice (wearing The Buff Guy; about 10,431 kills until it can reach the Telescope) · after Chronus Cosmos: Dwarfo Beardus + Pack Mule',
    );
    expect(lines.find((c) => c.line.startsWith('Wizard Lv 73'))?.line).toBe(
      "Wizard Lv 73 (Fighting): wear The Fuzzy Dice (wearing The Book Worm; swap next time it's at the Telescope) · after Chronus Cosmos: Pirate Booty + All Rounder",
    );
    expect(lines.filter((c) => c.canChange === true).map((c) => c.line.split(' (')[0])).toEqual([
      'Wizard Lv 73',
    ]);
    expect(r.account.goals.some((g) => /swap The/.test(g.nextAction.text))).toBe(false);
    // The Barbarian Lv 56 fishes: Pack Mule + The Fuzzy Dice, Pie Seas once unlocked.
    expect(lines.find((c) => c.line.startsWith('Barbarian Lv 56'))?.line).toContain(
      'after Chronus Cosmos: Pack Mule + The Fuzzy Dice, Pie Seas once unlocked',
    );
  });

  // D-14: one trip buys everything the points cover in chart order, so the 2 points left after Chronus
  // Cosmos also buy Pie Seas (US-4's "19 of your 21" stopped at the leg's end).
  it('with the constellations done and 21 points, the Wizard Lv 73 unlocks through Chronus Cosmos in one trip', () => {
    const s = W3();
    const ss = s.account.starSigns;
    if (!ss) throw new Error('no star signs');
    claim(s, ['A-1', 'A-3', 'A-7', 'B-1', 'B-4']);
    ss.pointsUnspent = 21;
    const g = byId(starGoals(run(s)), 'star-signs.goal.signs')[0];
    expect(g?.nextAction.text).toMatch(
      /^On your Wizard Lv 73 at the Telescope: unlock Dwarfo Beardus, Hipster Logger, Pack Mule, Pirate Booty, All Rounder, Fatty Doodoo, Robinhood, Ned Kelly, Chronus Cosmos, Pie Seas, and align Pirate Booty and All Rounder$/,
    );
    expect(g?.nextAction.why).toMatch(/^The unlock costs 21 of your 21 points\. /);
  });

  it('a new fighting Hunter on a starters-only account wears The Fuzzy Dice; before it exists, the next character picks it', () => {
    const s = W3();
    const base = s.characters[0];
    if (!base) throw new Error('no character');
    s.characters.push({
      ...structuredClone(base),
      index: 6,
      class: 'Hunter',
      level: 12,
      afkType: 'FIGHTING',
      starSigns: signIds(['The_Fuzzy_Dice']),
      telescopeRoute: [null, null, null],
      mapIndex: 1,
    });
    const line = run(s).starSigns?.characters.find((c) => c.index === 6)?.line;
    expect(line).toBe(
      'Hunter Lv 12 (Fighting): wear The Fuzzy Dice ✓ · after Chronus Cosmos: Pirate Booty + All Rounder',
    );

    const t = W3();
    const meta = runMetaPath(t, kb, t.asOf);
    const withSlot = {
      ...meta,
      goals: [
        ...meta.goals,
        {
          entryId: 'metapath.goal.next-character' as const,
          subject: { kind: 'account' as const },
          slots: {},
          order: 0,
          provenance: { entryIds: [], fields: [] },
        },
      ],
    };
    expect(buildStarSigns(t, kb, withSlot).view?.nextCharacter).toBe(
      'Next character: pick The Fuzzy Dice when you create it',
    );
  });

  it('with Chronus Cosmos unlocked, a character at the Telescope wearing one sign aligns the empty slot', () => {
    const s = W3();
    const ss = s.account.starSigns;
    if (!ss) throw new Error('no star signs');
    ss.unlocked = signIds([...STARTERS, ...LEG1]);
    const w = s.characters[slotOf(s, 'Wizard', 73)];
    if (w) w.starSigns = signIds(['Pirate_Booty']);
    const g = byId(starGoals(run(s)), 'star-signs.goal.signs')[0];
    expect(g?.nextAction.text).toBe(
      'On your Wizard Lv 73, at the Telescope: align All Rounder in your empty slot',
    );
  });
});

describe('US-5 Spend points in a sensible order', () => {
  it('Chronus Cosmos unlocked, 13 nodes and 2 points: 2 of the 18 points for the Hydron chart; next is Pie Seas', () => {
    const s = W3();
    const ss = s.account.starSigns;
    if (!ss) throw new Error('no star signs');
    ss.unlocked = signIds([...STARTERS, ...LEG1]);
    ss.pointsUnspent = 2;
    claimAll(s);
    const r = m16(s);
    expect(r.view?.milestone).toBe('2 points ready, 18 needed for opening the Hydron chart');
    const ctx = contextOf(s, kb, runMetaPath(s, kb, s.asOf), 3, DEFAULT_VALUES);
    if (!ctx) throw new Error('no context');
    expect(chartState(ctx).count).toBe(13);
    expect(buyable(ctx, 2).signs).toEqual(['Pie_Seas']);
  });

  it('24 nodes unlocked by another route: leg 2 is skipped, the next sign is All Rounderi', () => {
    const s = W3();
    const ss = s.account.starSigns;
    if (!ss) throw new Error('no star signs');
    const other = [
      'Shoe_Fly',
      'Pie_Seas',
      'Miniature_Game',
      'Blue_Hedgehog',
      'The_Fallen_Titan',
      'Activelius',
      'Gum_Drop',
      'Mount_Eaterest',
      'Bob_Build_Guy',
      'The_Big_Comatose',
      'Sir_Savvy',
    ];
    ss.unlocked = signIds([...STARTERS, ...LEG1, ...other]);
    const ctx = contextOf(s, kb, runMetaPath(s, kb, s.asOf), 3, DEFAULT_VALUES);
    if (!ctx) throw new Error('no context');
    expect(chartState(ctx).count).toBe(24);
    expect(chartState(ctx).hydronOpen).toBe(true);
    expect(buyable(ctx, 5).signs[0]).toBe('All_Rounderi');
  });

  it('a synthetic 23-node set keeps the Hydron chart shut', () => {
    const s = W3();
    const ss = s.account.starSigns;
    if (!ss) throw new Error('no star signs');
    ss.unlocked = signIds([
      ...STARTERS,
      ...LEG1,
      'Shoe_Fly',
      'Pie_Seas',
      'Miniature_Game',
      'Blue_Hedgehog',
      'Activelius',
      'Gum_Drop',
      'Mount_Eaterest',
      'Bob_Build_Guy',
      'The_Big_Comatose',
      'Sir_Savvy',
    ]);
    const ctx = contextOf(s, kb, runMetaPath(s, kb, s.asOf), 3, DEFAULT_VALUES);
    expect(ctx && chartState(ctx).count).toBe(23);
    expect(ctx && chartState(ctx).hydronOpen).toBe(false);
  });
});

describe('US-6 Broken or partial data', () => {
  it('a failed constellations section: no M16 Goal, and the diagnostics say star-signs/constellations: unknown', () => {
    const s = W3();
    s.account.starSigns = null;
    s.diagnostics.failedSections.push('constellations');
    const r = run(s);
    expect(starGoals(r)).toHaveLength(0);
    expect(
      r.diagnostics.failedDetectors.some((f) => f.message.includes('star-signs/constellations: unknown')),
    ).toBe(true);
  });

  it('a letter for a slot with no character counts toward progress and is never assigned a step', () => {
    const s = W3();
    setProgress(s, 'A-3', 3, [0, 7, 8]);
    const c = m16(s);
    const view = c.walkthroughs.find((w) => w.parentKey.endsWith('@A-3'))?.view;
    const next = c.view?.next.find((n) => n.name === 'A-3');
    expect(next?.effortSeconds).toBe(180); // 4 needed, 3 counted: one visit
    for (const st of view?.steps ?? []) expect(['c7', 'c8']).not.toContain(st.subject);
  });
});

describe('TR-10 pieces', () => {
  it('the candy chooser keeps a 4-hour candy when 2-hour ones cover the star, bag before storage', () => {
    const s = W3();
    const ctx = contextOf(s, kb, null, 3, DEFAULT_VALUES);
    if (!ctx) throw new Error('no context');
    const pool = candyPool(ctx);
    const wizard = slotOf(s, 'Wizard', 73);
    expect(takeCandy(pool, 2, wizard)).toMatchObject({ hours: 2, place: 'storage' });
    expect(takeCandy(pool, 1, wizard)).toMatchObject({ hours: 1, place: `inv:c${wizard}` });
    expect(pool.some((u) => u.hours === 4)).toBe(true);
  });

  it('two equal-cost constellation Goals rank by key in the shared comparator (A-7 before B-1)', () => {
    const s = W3();
    const meta = runMetaPath(s, kb, s.asOf);
    const goal = (name: string): Goal => ({
      id: 'star-signs.goal.constellation',
      title: name,
      system: 'star-signs',
      category: 'compounding',
      nextAction: {
        key: `star-signs.goal.constellation@${name}`,
        entryId: 'star-signs.goal.constellation',
        text: name,
        why: '',
        sources: [],
        stale: false,
        contested: null,
        confidence: 'H',
        provenance: { entryIds: [], fields: [] },
      },
      milestone: null,
    });
    const cost = { unit: 'hours' as const, amount: 0.1 };
    const ranked = rankGoals(
      [
        { goal: goal('B-1'), rank: { cost }, moduleId: 'star-signs' },
        { goal: goal('A-7'), rank: { cost }, moduleId: 'star-signs' },
      ],
      meta.list,
    );
    expect(ranked.map((g) => g.title)).toEqual(['A-7', 'B-1']);
  });

  it('is deterministic: the same input gives the same output (FR-23)', () => {
    expect(JSON.stringify(m16(W3()))).toBe(JSON.stringify(m16(W3())));
  });

  it('is structured-cloneable on EngineResult', () => {
    const r = run(W3());
    expect(structuredClone(r.starSigns)).toEqual(r.starSigns);
  });
});
