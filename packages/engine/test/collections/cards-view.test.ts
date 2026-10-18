// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8 Cards view (owner request 2026-10-18): presets as slots, the best preset from owned cards as a
// diff, the reachable grind list with ETAs, and the account overview. On the committed scrubbed saves
// (by class and level, never by name) plus synthetic edits; the real saves are in cards-view.private.test.ts.
import type { AccountState } from '@idleon-forge/account-state';
import { describe, expect, it } from 'vitest';
import {
  buildCardsView,
  type CardPreferences,
  type CharacterCards,
  createCardsViewModule,
  type FactLookup,
  GRIND_BEYOND,
  GRIND_NONE,
  hoursText,
  killsFor,
  M8,
  nextThreshold,
  oneIn,
  UNOWNED_MULTIPLIER,
} from '../../src/collections';
import { runEngine } from '../../src/core/engine';
import { input, publicState } from '../core/helpers';
import { scrubbedFile } from '../walkthrough/helpers';
import { cardsState, facts, kb } from './cards-helpers';

const w2 = () => cardsState(scrubbedFile('scrubbed-w2'));
const w3 = () => cardsState(scrubbedFile('scrubbed-w3'));

const charOf = (s: AccountState, cls: string, level: number) => {
  const c = s.characters.find((x) => x.class === cls && x.level === level);
  if (!c) throw new Error(`no ${cls} ${level}`);
  return c;
};
const viewOf = (s: AccountState, cls: string, level: number, lookup: FactLookup = facts): CharacterCards => {
  const v = buildCardsView(s, lookup);
  const c = v?.characters.find((x) => x.index === charOf(s, cls, level).index);
  if (!c) throw new Error('no cards view');
  return c;
};

describe('ETA arithmetic (M14 Supply method, ADR 0005)', () => {
  it('a first copy counts the ×5 unowned chance; later copies the base chance', () => {
    expect(killsFor(0.001, 0, 1)).toBeCloseTo(1 / (0.001 * UNOWNED_MULTIPLIER));
    expect(killsFor(0.001, 0, 3)).toBeCloseTo(200 + 2000);
    expect(killsFor(0.002, 10, 5)).toBeCloseTo(2500);
    expect(killsFor(0, 0, 1)).toBeNull();
    expect(killsFor(0.01, 3, 0)).toBeNull();
  });
  it('the next threshold is the first copy, then Toolbox nextLevelReq, and none at the base max', () => {
    expect(nextThreshold(0, 0, 0)).toEqual({ copies: 1, label: 'first copy' });
    expect(nextThreshold(12, 1, 41)).toEqual({ copies: 41, label: 'level 3' });
    expect(nextThreshold(300, 4, 0)).toBeNull();
  });
  it('words chances and hours plainly', () => {
    expect(oneIn(0.004)).toBe('1 in 250');
    expect(oneIn(0.00006)).toBe('1 in 16,670');
    expect(hoursText(0.5)).toBe('about 30m');
    expect(hoursText(1.9)).toBe('about 2h');
    expect(hoursText(30)).toBe('about 30h');
    expect(hoursText(100)).toBe('about 4d');
  });
  it("a grind line's hours are its mean kills over the character's kill rate on that map", () => {
    const s = w3();
    const v = buildCardsView(s, facts);
    const lines = v?.characters.flatMap((c) => c.grind.map((g) => ({ c, g }))) ?? [];
    const timed = lines.filter(({ g }) => g.hours !== null);
    expect(timed.length).toBeGreaterThan(0);
    for (const { c, g } of timed) {
      const rate = s.account.supplyRates?.maps
        .find((m) => m.mapIndex === g.mapIndex)
        ?.rates.find((r) => r.characterIndex === c.index)?.finalKillsPerHour;
      const kph = rate ?? s.characters.find((x) => x.index === c.index)?.afk?.fighting?.finalKillsPerHour;
      expect(kph).toBeGreaterThan(0);
      expect(g.hours).toBeCloseTo((g.kills as number) / (kph as number), 6);
      expect(g.kills).toBeCloseTo(
        killsFor(g.owned > 0 ? g.chance : g.chance / UNOWNED_MULTIPLIER, g.owned, g.missing) as number,
        6,
      );
    }
  });
});

describe('presets, visualised', () => {
  it('shows every unlocked preset as its slots, marks the one in use and what each fits', () => {
    const c = viewOf(w3(), 'Wizard', 73);
    expect(c.presets.map((p) => p.n)).toEqual([1, 2]);
    expect(c.presets.find((p) => p.active)?.n).toBe(2);
    expect(c.presets[0]?.label).toBe('fits fighting');
    expect(c.presets[1]?.label).toBe('fits Choppin');
    for (const p of c.presets) expect(p.slots).toHaveLength(c.slotCount);
    expect(c.presets[0]?.slots.every((s) => s && s.level > 0 && /^\+\d/.test(s.effect))).toBe(true);
  });
  it('keeps empty slots visible', () => {
    const c = viewOf(w3(), 'Squire', 51);
    const active = c.presets.find((p) => p.active);
    expect(active?.slots.filter((s) => s === null)).toHaveLength(1);
    expect(c.emptySlots).toBe(1);
    expect(c.overview).toContain('1 empty slot');
  });
});

describe('the best preset from owned cards', () => {
  it('W3-early: the fighting Wizard on its choppin preset is told to switch to preset 1, with the swaps', () => {
    const c = viewOf(w3(), 'Wizard', 73);
    const fight = c.recommendations.find((r) => r.reason === 'afk-target');
    expect(fight?.activity).toBe('fighting');
    expect(fight?.where).toBe('Switch to card preset 1 (fits fighting)');
    expect(fight?.preset).toBe(1);
    expect(fight?.cards.every((x) => x.level > 0)).toBe(true);
    expect(fight?.swaps.length).toBeGreaterThan(0);
    expect(c.presetFits).toBe(false);
  });
  it('W2-late: the mining Squire fills empty preset 2, Iron card first', () => {
    const c = viewOf(w2(), 'Squire', 43);
    const mine = c.recommendations.find((r) => r.reason === 'afk-target');
    expect(mine?.where).toBe('Fill empty card preset 2, then switch to it');
    expect(mine?.cards[0]?.name).toBe('Iron');
    expect(mine?.swaps[0]?.text).toBe('Add Iron');
  });
  it('recommends only cards the account owns, and never a passive card', () => {
    for (const s of [w2(), w3()])
      for (const c of buildCardsView(s, facts)?.characters ?? [])
        for (const r of c.recommendations)
          for (const x of r.cards) {
            expect(s.account.cards?.[x.rawName]?.amount ?? 0).toBeGreaterThan(0);
            expect(x.passive).toBe(false);
          }
  });
  it('never sends two jobs to one preset', () => {
    for (const s of [w2(), w3()])
      for (const c of buildCardsView(s, facts)?.characters ?? []) {
        const ns = c.recommendations.flatMap((r) => (r.preset === null ? [] : [r.preset]));
        expect(new Set(ns).size).toBe(ns.length);
      }
  });
  it('a preset already holding the best cards is done', () => {
    const s = w3();
    const c = charOf(s, 'Squire', 85);
    const best = viewOf(s, 'Squire', 85).recommendations[0]?.cards.map((x) => x.rawName) ?? [];
    const edited: AccountState = {
      ...s,
      characters: s.characters.map((x) =>
        x.index === c.index && x.cardLoadout
          ? { ...x, cardLoadout: { ...x.cardLoadout, equipped: best } }
          : x,
      ),
    };
    expect(viewOf(edited, 'Squire', 85).recommendations[0]?.done).toBe(true);
  });
});

/** The Knowledge Base with W4 cards put at the top of the fighting list. */
function withW4Cards(): FactLookup {
  const prefs = facts.get(M8.cardPreferences) as unknown as { rows: CardPreferences };
  const rows: CardPreferences = {
    ...prefs.rows,
    matrix: { ...prefs.rows.matrix, FIGHTING: [['demonP', 'mushP', 'w4a2'], ...prefs.rows.matrix.FIGHTING] },
  };
  return { get: (id) => (id === M8.cardPreferences ? { ...prefs, rows } : facts.get(id)) } as FactLookup;
}

describe('cards to grind are reachable now', () => {
  it('W3-early: no W4 card, even when the list ranks W4 cards first', () => {
    const v = buildCardsView(w3(), withW4Cards());
    const all = [...(v?.characters.flatMap((c) => c.grind) ?? []), ...(v?.account.grind ?? [])];
    expect(all.length).toBeGreaterThan(0);
    expect(all.some((g) => ['demonP', 'mushP', 'w4a2'].includes(g.rawName))).toBe(false);
    expect(all.every((g) => g.world <= 3)).toBe(true);
  });
  it('W2-late: no W3 card', () => {
    const v = buildCardsView(w2(), facts);
    const all = [...(v?.characters.flatMap((c) => c.grind) ?? []), ...(v?.account.grind ?? [])];
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((g) => g.world <= 2)).toBe(true);
  });
  it("only maps the character can walk to today (M14's reachable maps)", () => {
    const s = w3();
    for (const c of buildCardsView(s, facts)?.characters ?? []) {
      const ch = s.characters.find((x) => x.index === c.index);
      const reach = s.account.supplyRates?.reachable[c.index] ?? [];
      for (const g of c.grind)
        if (g.skill === null) expect(reach.includes(g.mapIndex) || ch?.mapIndex === g.mapIndex).toBe(true);
    }
  });
  it('lists the card on its AFK map first, then quick wins by hours, and marks a character already farming the map', () => {
    const s = w3();
    for (const c of buildCardsView(s, facts)?.characters ?? []) {
      const ch = s.characters.find((x) => x.index === c.index);
      const here = c.grind.findIndex((g) => g.mapIndex === ch?.mapIndex);
      if (here >= 0) expect(here).toBe(0);
      const rest = c.grind.filter((g) => g.mapIndex !== ch?.mapIndex);
      const firstSlow = rest.findIndex((g) => !g.quick);
      if (firstSlow >= 0) expect(rest.slice(firstSlow).every((g) => !g.quick)).toBe(true);
      // Within each group, fewest hours first (no estimate last).
      for (const group of [rest.filter((g) => g.quick), rest.filter((g) => !g.quick)]) {
        const h = group.map((g) => g.hours ?? Number.POSITIVE_INFINITY);
        expect(h).toEqual([...h].sort((a, b) => a - b));
      }
    }
    const squire = viewOf(s, 'Squire', 51);
    expect(squire.grind.find((g) => g.rawName === 'Iron')?.farmingNow).toEqual(['Squire 51']);
  });
});

describe('the grind list never contradicts the best preset (R5 QA P3-1)', () => {
  it('W3-early Squire Lv 85: Thermister, on the map it is farming, leads', () => {
    const v = viewOf(w3(), 'Squire', 85);
    expect(v.grind[0]?.rawName).toBe('thermostat');
  });
  it('W2-late Barbarian: Mimic, swapped out of fighting preset 1, is not said to improve it', () => {
    const v = viewOf(w2(), 'Barbarian', 60);
    const fighting = v.recommendations.find((r) => r.activity === 'fighting');
    expect(fighting?.swaps.some((x) => x.from?.rawName === 'mimicA')).toBe(true);
    const mimic = v.grind.find((g) => g.rawName === 'mimicA');
    expect(mimic?.improves).not.toBe('fighting preset (card preset 1)');
    // A quick win in minutes sits above the slower ones, not last.
    expect(v.grind.findIndex((g) => g.rawName === 'mimicA')).toBeLessThan(2);
  });
  it('a card the best preset swaps out never "improves" that preset', () => {
    for (const s of [w2(), w3()])
      for (const c of buildCardsView(s, facts)?.characters ?? [])
        for (const r of c.recommendations) {
          const out = new Set(r.swaps.map((x) => x.from?.rawName).filter(Boolean));
          const keeps = new Set(r.cards.map((x) => x.rawName));
          for (const g of c.grind)
            if (g.improves === `${r.activity} preset (card preset ${r.preset})`) {
              expect(out.has(g.rawName)).toBe(false);
              expect(keeps.has(g.rawName)).toBe(true);
            }
        }
  });
});

describe('an account past World 4 (R5 QA P3-2)', () => {
  it("public latest.json: an empty grind list says the view covers Worlds 1–4, not 'nothing in reach'", () => {
    const v = buildCardsView(publicState('latest.json'), facts);
    expect(v?.characters.length).toBeGreaterThan(0);
    for (const c of v?.characters ?? []) {
      expect(c.grindEmpty).toBe(GRIND_BEYOND);
      if (c.grind.length === 0 && !c.unknown) expect(c.overview).toMatch(/covers Worlds 1–4 for now$/);
    }
  });
  it('W3-early keeps the plain wording', () => {
    for (const c of buildCardsView(w3(), facts)?.characters ?? []) expect(c.grindEmpty).toBe(GRIND_NONE);
  });
});

describe('the account overview and the engine result', () => {
  it('one overview row per character, naming none', () => {
    const s = w3();
    const v = buildCardsView(s, facts);
    expect(v?.characters).toHaveLength(s.characters.length);
    for (const c of v?.characters ?? []) {
      expect(c.overview).toMatch(/·/);
      for (const ch of s.characters) expect(JSON.stringify(c)).not.toContain(`"${ch.name}"`);
    }
    expect(viewOf(s, 'Squire', 85).overview).toMatch(/^preset fits fighting ✓ · slots full · next grind: /);
    expect(v?.sources[0]?.tier).toBeGreaterThan(1);
    expect(v?.sources[0]?.url).toBe('https://idleon.wiki/wiki/Cards');
  });
  it('the merged account list names each card once', () => {
    const g = buildCardsView(w3(), facts)?.account.grind ?? [];
    expect(new Set(g.map((x) => x.rawName)).size).toBe(g.length);
    expect(g.every((x) => x.helps.length >= 1)).toBe(true);
  });
  it('the cards-view module puts the view on EngineResult.cards', () => {
    const s = w3();
    const out = runEngine(input(s, { now: s.asOf }), [createCardsViewModule({ kb })]);
    expect(out.cards?.characters).toHaveLength(s.characters.length);
    expect(structuredClone(out.cards)).toEqual(out.cards);
  });
  it("can't read a character's cards: says so, never guesses", () => {
    const s = w3();
    const c = charOf(s, 'Wizard', 73);
    const edited: AccountState = {
      ...s,
      characters: s.characters.map((x) => (x.index === c.index ? { ...x, cardLoadout: null } : x)),
    };
    const v = viewOf(edited, 'Wizard', 73);
    expect(v.unknown).toBe("Can't read this character's cards right now");
    expect(v.presets).toEqual([]);
    expect(v.grind).toEqual([]);
  });
});
