// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8 Collections as an engine module: the user stories' Given/When/Then on the scrubbed W2-late and
// W3-early saves (CI-safe; the private saves give the same output and are checked locally in
// private.test.ts). Characters are named by class and level only.
import type { AccountState } from '@idleon-forge/account-state';
import { describe, expect, it } from 'vitest';
import { engineDetectors } from '../../detectors';
import { cardList, collectionsResult, createCollectionsModule, evaluateStamps } from '../../src/collections';
import type { EngineHistoryEntry } from '../../src/core/module';
import { lookupOf } from '../../src/metapath/knowledge';
import { input } from '../core/helpers';
import { PUBLIC, scrubbed } from '../metapath/helpers';
import { loadM8Kb, m8State } from './helpers';

const kb = loadM8Kb();
const facts = lookupOf(kb);
const m8 = createCollectionsModule({ kb, registry: engineDetectors });
const w2 = m8State(scrubbed('scrubbed-w2'));
const w3 = m8State(scrubbed('scrubbed-w3'));

const run = (s: AccountState, over: Parameters<typeof input>[1] = {}) =>
  m8.run(input(s, { now: s.account.lastCloudSave ?? 0, ...over }));
const indexOf = (s: AccountState, cls: string, level: number) => {
  const c = s.characters.find((x) => x.class === cls && x.level === level);
  if (!c) throw new Error(`no ${cls} ${level}`);
  return c.index;
};
const rowTexts = (s: AccountState, cls: string, level: number) =>
  (run(s).characters?.find((c) => c.index === indexOf(s, cls, level))?.goals ?? []).map(
    (g) => g.goal.nextAction.text,
  );
const accountTexts = (s: AccountState) => (run(s).account?.goals ?? []).map((g) => g.goal.nextAction.text);
const play = (s: AccountState) => (run(s).account?.activePlay ?? []).map((a) => a.text);
const allTexts = (s: AccountState) => {
  const out = run(s);
  return [
    ...(out.account?.goals ?? []).map((g) => g.goal.nextAction.text),
    ...(out.characters ?? []).flatMap((c) => (c.goals ?? []).map((g) => g.goal.nextAction.text)),
    ...(out.account?.activePlay ?? []).map((a) => a.text),
  ];
};

describe('the M8 engine module', () => {
  it('declares itself: never a Verdict, not Expected-Return-dependent', () => {
    expect(m8).toMatchObject({ id: 'collections', affectsVerdict: false, dependsOnExpectedReturn: false });
    const out = run(w3);
    expect(out.characters?.every((c) => c.verdict === undefined)).toBe(true);
  });

  it('registers its 5 engine Detectors by file convention', () => {
    expect(
      Object.keys(engineDetectors)
        .filter((id) => !id.startsWith('metapath/'))
        .sort(),
    ).toEqual(['cards/preset', 'cards/set', 'cards/slots', 'obols/state', 'stamps/status']);
  });

  it('never puts a character name in any text', () => {
    for (const s of [w2, w3])
      for (const t of allTexts(s)) for (const c of s.characters) expect(t).not.toContain(c.name);
  });
});

describe('US-1 stamps I can grab right now', () => {
  it('W3-early: one shop trip, towns in world and shop order, carry stamps first in a town', () => {
    expect(accountTexts(w3)).toContain(
      'Buy 3 new stamps from town shops on one trip: Encroaching Forest Villas: Vitality Stamp; Faraway Piers: Matty Bag Stamp and Clover Stamp',
    );
  });

  it('W3-early: the Wizard 73 is carrying an uncollected Duplogs Stamp (FR-2a)', () => {
    expect(rowTexts(w3, 'Wizard', 73)).toContain("Use the Duplogs Stamp you're carrying");
  });

  it('W2-late: Vitality, Vendor, then Matty Bag and Clover; the Vendor Stamp only here (W3 owns it)', () => {
    expect(accountTexts(w2)).toContain(
      'Buy 4 new stamps from town shops on one trip: Encroaching Forest Villas: Vitality Stamp; YumYum Grotto: Vendor Stamp; Faraway Piers: Matty Bag Stamp and Clover Stamp',
    );
  });

  it('either fixture: no owned stamp and no shop in an unreached world appears', () => {
    for (const s of [w2, w3]) {
      const owned = Object.values(s.account.stampLevels ?? {})
        .filter((x) => x.level > 0 || x.maxLevel > 0)
        .map((x) => x.name.replace(/_/g, ' '));
      const texts = allTexts(s).join('\n');
      for (const name of owned) expect(texts).not.toContain(`${name} `);
    }
    // W2-late has not reached W3: no Frostbite Tundra or W4 town shop.
    expect(allTexts(w2).join('\n')).not.toMatch(/Frostbite Towndra|Outer World Town|Spice Stamp|Sigil Stamp/);
  });
});

describe('US-2 a quest hand-in I didn’t realise I could do', () => {
  it('W3-early: the Bowman 60 hands Hamish the Copper Chopper it carries; the equipped one on the Wizard 73 is never counted', () => {
    expect(rowTexts(w3, 'Bowman', 60)).toContain(
      "Give Hamish the Copper Chopper you're carrying → Tomahawk Stamp",
    );
    expect(rowTexts(w3, 'Wizard', 73).some((t) => /Hamish|Copper Chopper/.test(t))).toBe(false);
  });

  it('W2-late: the Barbarian 60 crafts the Copper Chopper first (FR-5)', () => {
    expect(rowTexts(w2, 'Barbarian', 60)).toContain(
      'Craft a Copper Chopper at the Anvil (6 Oak Logs), then give it to Hamish → Tomahawk Stamp',
    );
  });

  it('W3-early: Snouts 1 is a toward line (17 of 30 Redox Salts) with the shared-resource note, never a ranked Next Action', () => {
    const out = run(w3);
    const sq = out.characters?.find((c) => c.index === indexOf(w3, 'Squire', 85));
    const line = sq?.goals?.find((g) => g.goal.nextAction.text.startsWith('Snouts 1:'));
    expect(line?.goal.nextAction.text).toBe(
      'Snouts 1: 17 of 30 Redox Salts → Buckler Stamp (uses Redox Salts, which also pays for Construction)',
    );
    expect(line?.goal.category).toBe('nice');
    expect(line?.goal.id).toBe('stamps.check.quest-toward');
  });
});

describe('US-3 short active quests for stamps', () => {
  it('W3-early: Cattleprod 2 and Wellington 1 on the Squire 85, with the Wellington 2 look-ahead and its carry caveat', () => {
    const p = play(w3);
    expect(p).toContain(
      'XxX Cattleprod XxX 2 on Squire 85: kill 30 Mafiosos and 18 Sand Castles before the timer runs out → Mason Jar Stamp and Fishhead Stamp',
    );
    const well = p.find((t) => t.startsWith('Wellington 1 on Squire 85'));
    expect(well).toMatch(
      /then: Wellington 2 gives Fly Intel Stamp and Holy Mackerel Stamp, and you already hold the 2,500 High Steaks, Wakka Cherry and Singlecle/,
    );
    expect(well).toMatch(/free inventory slots/);
  });

  it('W2-late: Cattleprod 1 and Wellington 1 on the Barbarian 60, with no look-ahead', () => {
    const p = play(w2);
    expect(p).toContain(
      "XxX Cattleprod XxX 1 on Barbarian 60: kill 15 Mafiosos before they respawn → Lil' Mining Baggy Stamp and Catch Net Stamp",
    );
    expect(p).toContain(
      'Wellington 1 on Barbarian 60: find the 3 invisible platforms hidden around the game → Arcane Stamp and Brainstew Stamps',
    );
  });

  it('Active Play carries its authored time estimate and never becomes a Goal', () => {
    const out = run(w3);
    expect(out.account?.activePlay?.every((a) => a.estimateSeconds > 0)).toBe(true);
    const ids = (out.account?.goals ?? []).map((g) => g.goal.id);
    expect(ids.some((id) => id.includes('activeplay'))).toBe(false);
  });

  it('fixture totals (pinned): now, active and toward members', () => {
    const s3 = evaluateStamps(w3, facts);
    const s2 = evaluateStamps(w2, facts);
    expect(s3.byStatus).toEqual({ owned: 17, now: 5, active: 5, toward: 3, later: 91, unknown: 0 });
    expect(s2.byStatus).toEqual({ owned: 8, now: 5, active: 4, toward: 3, later: 101, unknown: 0 });
    const status = (s: typeof s3, raw: string) => s.items.find((i) => i.rawName === raw)?.status;
    expect(status(s3, 'StampA4')).toBe('now'); // Tomahawk
    expect(status(s3, 'StampB7')).toBe('now'); // Duplogs, held
    expect(status(s3, 'StampA21')).toBe('toward'); // Buckler, Snouts 1
    expect(status(s3, 'StampA14')).toBe('toward'); // Manamoar, Mutton 2
    expect(status(s2, 'StampA4')).toBe('now'); // via craft
  });
});

describe('US-4 how far I am in stamps', () => {
  it('reads the header from the generated catalogue minus the 7 unobtainable stamps', () => {
    expect(accountTexts(w3)).toContain(
      'Stamps 17 of 121 · 5 now · 5 with active play · 3 in progress · 91 later',
    );
    expect(accountTexts(w2)).toContain(
      'Stamps 8 of 121 · 5 now · 4 with active play · 3 in progress · 101 later',
    );
  });

  it('W2-late: the Bullseye Stamp at Lv 0 counts as owned and goes to M7, not to an M8 action (FR-2)', () => {
    expect(collectionsResult(w2, facts).stamps.lv0ForSpendPlan).toEqual(['StampA17']);
    expect(allTexts(w2).some((t) => /Bullseye/.test(t))).toBe(false);
  });

  it('before Mr Pigibank (highest class Lv below 14), stamps say nothing one by one', () => {
    const early = structuredClone(w2);
    early.account.highestLevel = 10;
    expect(evaluateStamps(early, facts).state).toBe('locked');
    expect(allTexts(early).some((t) => /Stamp/.test(t))).toBe(false);
  });
});

describe('US-5 cards on every character (one account line when it repeats, #70 A5)', () => {
  it('W2-late: empty slots, Yum Yum for the fighters at Lv 50+ (the pusher falls back while Frostbite is tier 0), Blunder Hills below 50', () => {
    expect(accountTexts(w2)).toEqual(
      expect.arrayContaining([
        'Equip Slime, Bored Bean, Pincermin and Mashed Potato in the empty card slots of 2 characters: Shaman 44 and Wizard 56',
        'Equip the Yum Yum Desert card set (tier 1, +10% All Food Effect) on 3 characters: Barbarian 60, Bowman 54 and Wizard 56',
      ]),
    );
    expect(rowTexts(w2, 'Bowman', 54)).toContain(
      'Equip 4 cards in your empty card slots: Carrotman, Bored Bean, Pincermin and Mashed Potato',
    );
    expect(rowTexts(w2, 'Shaman', 44)).toContain(
      'Equip the Blunder Hills card set (tier 1, +8% EXP if below Lv 50)',
    );
  });

  it('W2-late: the mining Squire 43 gets no set action (no skilling set at tier 1)', () => {
    expect(rowTexts(w2, 'Squire', 43).some((t) => /card set/.test(t))).toBe(false);
  });

  it('W3-early: Shaman 54 empty slots, Squire 51 one more card (Amarok, though another character has it), the passive Fire Forge card', () => {
    expect(rowTexts(w3, 'Shaman', 54)).toContain(
      'Equip 4 cards in your empty card slots: Slime, Bored Bean, Mimic and Sand Castle',
    );
    expect(rowTexts(w3, 'Squire', 51)).toContain('Equip 1 card in your empty card slots: Amarok');
    expect(rowTexts(w3, 'Bowman', 60).find((t) => t.startsWith('Replace the Fire Forge card'))).toMatch(
      /passive, it works unequipped/,
    );
  });

  it('W3-early: Easy Resources for the two skillers and Yum Yum tier 2 for three fighters, as account lines', () => {
    expect(accountTexts(w3)).toEqual(
      expect.arrayContaining([
        'Equip the Easy Resources card set (tier 1, +8% Skill Efficiency) on 2 characters: Squire 51 and Barbarian 56',
        'Equip the Yum Yum Desert card set (tier 2, +20% All Food Effect) on 3 characters: Wizard 73, Bowman 60 and Shaman 54',
      ]),
    );
  });

  it('W3-early: the pusher (Squire 85) swaps Yum Yum for Frostbite while it misses (D3), and keeps it without a frontier', () => {
    expect(rowTexts(w3, 'Squire', 85).some((t) => /card set/.test(t))).toBe(false);
    const i = indexOf(w3, 'Squire', 85);
    const fights = w3.characters.map((c) => ({
      characterIndex: c.index,
      finalKillsPerHour: c.index === i ? 5000 : 100,
      killsPerHour: c.index === i ? 5000 : 100,
      hitChance: 36,
      survivability: 100,
      killsLeft: 1000,
    }));
    const withFrontier = structuredClone(w3);
    withFrontier.account.frontier = {
      world: 3,
      mapIndex: 108,
      mapName: 'Thermonuclear_Climb',
      door: 0,
      kind: 'uncleared',
      requirement: 1000,
      routeCleared: w3.characters.map((c) => ({
        characterIndex: c.index,
        count: 1,
        of: 1,
        reachesFrontier: true,
      })),
      fights,
    };
    expect(rowTexts(withFrontier, 'Squire', 85)).toContain(
      'Swap the Yum Yum Desert card set for Frostbite Tundra (tier 1, +5% DEF and ACC)',
    );
  });

  it('carries the set tier as a Milestone (FR-19)', () => {
    const g = run(w3).account?.goals?.find((x) => x.goal.nextAction.text.startsWith('Equip the Yum Yum'));
    expect(g?.goal.milestone).toMatchObject({ current: 40, next: 42 });
  });

  it('a set past what M8 judges (Bosses, W4+) is left alone', () => {
    const s = structuredClone(w3);
    const c = s.characters.find((x) => x.class === 'Wizard');
    if (c?.cardLoadout) c.cardLoadout.set = 'CardSet26';
    expect(rowTexts(s, 'Wizard', 73).some((t) => /card set/.test(t))).toBe(false);
  });
});

describe('US-6 the right card preset for the job', () => {
  it('W3-early: the fighting Wizard 73 on its choppin preset switches to card preset 1', () => {
    expect(rowTexts(w3, 'Wizard', 73)).toContain('Switch to card preset 1 (fighting)');
  });

  it('W2-late: the mining Squire 43 on combat cards fills its empty preset 2', () => {
    expect(rowTexts(w2, 'Squire', 43)).toContain(
      'Fill card preset 2 for Mining (Iron card first), then switch to it',
    );
  });

  it('either fixture: no preset action where the cards already fit the AFK Target', () => {
    for (const [s, cls, lv] of [
      [w3, 'Barbarian', 56],
      [w3, 'Squire', 85],
      [w2, 'Barbarian', 60],
    ] as const)
      expect(rowTexts(s, cls, lv).some((t) => /card preset/.test(t))).toBe(false);
  });

  it('never suggests a preset that isn’t unlocked or overwriting a non-empty one', () => {
    const s = structuredClone(w2);
    const sq = s.characters.find((x) => x.class === 'Squire');
    if (sq?.cardLoadout) sq.cardLoadout.presets[1] = ['plank'];
    expect(rowTexts(s, 'Squire', 43).some((t) => /card preset/.test(t))).toBe(false);
  });
});

describe('US-7 card lists for M4', () => {
  it('every class present has a list, main-stat cards first (cardList)', () => {
    for (const s of [w2, w3])
      for (const c of s.characters) expect(cardList(facts, c.class).length).toBeGreaterThan(10);
    expect(cardList(facts, 'Bowman')[0]).toBe('cards.acquisition.carrot-o');
    expect(cardList(facts, 'Shaman')[0]).toBe('cards.acquisition.slime-g');
    expect(collectionsResult(w3, facts).cardLists).toHaveLength(w3.characters.length);
  });
});

describe('US-8 spare obols into empty slots', () => {
  it('W3-early: the altar first, on the Squire 85 (highest with the quest accepted); stored obols wait', () => {
    expect(rowTexts(w3, 'Squire', 85)).toContain(
      'Buy a Bob Joe Pickle at the YumYum Grotto shop and give it to the Obol Altar',
    );
    expect(accountTexts(w3)).toContain('4 stored obols wait for the Obol Altar');
    expect(allTexts(w3).some((t) => /Equip .*stored obol|Family obols/.test(t))).toBe(false);
  });

  it('W3-early after the altar: 4 obols into family circle slots, no Milestone for the stale 350 lock (FR-22)', () => {
    const done = m8State(scrubbed('scrubbed-w3'), (data) => {
      const q = JSON.parse(String(data.QuestComplete_3)) as Record<string, number>;
      q.Obol_Altar1 = 1;
      data.QuestComplete_3 = JSON.stringify(q);
    });
    const texts = accountTexts(done);
    expect(texts).toContain('Equip 4 stored obols in family circle slots');
    expect(texts).toContain('Family obols 0 of 6 filled');
    const r = collectionsResult(done, facts).obols;
    expect(r.nextFamilySlot).toBeNull();
  });

  it('W2-late: one obol into a family circle slot, with the merit line and the next family slot at 350 (93 to go)', () => {
    expect(accountTexts(w2)).toEqual(
      expect.arrayContaining([
        "Equip 1 stored obol in a family circle slot; regular monsters don't drop obols until the W2 merit 'Monsters now drop Obols'",
        "Family obols 0 of 6 filled; next circle slot at family level 350 (93 to go); regular monsters don't drop obols until the W2 merit 'Monsters now drop Obols'",
      ]),
    );
  });

  it('done this session: the stored-obol action is gone in the next save and listed as done (FR-25)', () => {
    const later = m8State(scrubbed('scrubbed-w2'), (data) => {
      const inv = data.ObolInvOr as Record<string, string>[];
      if (inv[0]) inv[0]['0'] = 'Blank';
      const fam = data.ObolEqO1 as string[];
      fam[0] = 'ObolSilver0';
    });
    const first: EngineHistoryEntry = { lastCloudSave: 1, receivedAt: 1, state: w2 };
    const out = m8.run(
      input(later, {
        now: later.account.lastCloudSave ?? 0,
        history: { entries: [first], sessionStartedAt: 0, learnedExpectedReturnSeconds: null },
      }),
    );
    const texts = (out.account?.goals ?? []).map((g) => g.goal.nextAction.text);
    expect(texts.some((t) => t.startsWith('Equip 1 stored obol'))).toBe(false);
    expect(out.account?.doneThisSession?.map((d) => d.key)).toContain('obols.check.stored@account');
  });
});

describe('US-9 no collections advice from a broken read', () => {
  it('W3-early with the stamps section failed: no stamp action, "can’t tell", cards and obols still shown', () => {
    const broken = structuredClone(w3);
    broken.diagnostics.failedSections = ['stamps'];
    const texts = allTexts(broken);
    expect(texts).toContain("Stamps: can't tell right now");
    expect(texts.some((t) => /→ .*Stamp|new stamps|Duplogs/.test(t))).toBe(false);
    expect(texts.some((t) => /card set/.test(t))).toBe(true);
    expect(texts).toContain('4 stored obols wait for the Obol Altar');
  });

  it('a failed storage read makes hand-ins unknown, never "you lack X"', () => {
    const broken = structuredClone(w3);
    broken.diagnostics.failedSections = ['storage'];
    const s = evaluateStamps(broken, facts);
    expect(s.handins).toHaveLength(0);
    expect(s.items.find((i) => i.rawName === 'StampA21')?.status).toBe('unknown');
  });

  it('without Toolbox’s functions (no shop stock), shop stamps are unknown, not "sold out"', () => {
    const bare = structuredClone(w3);
    bare.account.shopStock = null;
    bare.diagnostics.unknownFields = ['account.shopStock'];
    expect(accountTexts(bare).some((t) => /town shops/.test(t))).toBe(false);
    expect(evaluateStamps(bare, facts).items.find((i) => i.rawName === 'StampA12')?.status).toBe('unknown');
  });
});

describe('TR-11 performance', () => {
  it('runs every M8 Detector on the largest public save in at most 15 ms (median of 5, after a warm-up)', () => {
    const big = m8State(`${PUBLIC}highend.json`);
    run(big);
    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      const s = structuredClone(big); // a fresh state: nothing memoised
      const t = performance.now();
      run(s);
      times.push(performance.now() - t);
    }
    times.sort((a, b) => a - b);
    expect(times[2]).toBeLessThan(15);
  });
});
