// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 Bubba user stories (docs/specs/M23-bubba.md section 4) and TR-10 on the scrubbed and public saves,
// through the full golden engine. The W3-early account is scrubbed-w3, the W2-late account scrubbed-w2.
import type { AccountState } from '@idleon-forge/account-state';
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS } from '@idleon-forge/knowledge';
import {
  justReset,
  neverStarted,
  UPG,
  withBubba,
  withGifts,
  withMeat,
  withUpgrade,
} from '@idleon-forge/knowledge/helpers';
import { describe, expect, it } from 'vitest';
import { BUBBA_GOAL_KEY } from '../../src/bubba';
import { renderBubbaText } from '../../src/bubba/text';
import { goldenResult } from '../../src/golden';
import { EMPTY_PREFS } from '../../src/now/prefs';
import { buildSystemsView } from '../../src/now/systems-view';
import type { EngineResult, Goal } from '../../src/result';

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const fixture = (id: string) => {
  const f = fixtures.find((x) => x.id === id);
  if (!f) throw new Error(`no fixture ${id}`);
  return f;
};
/** `atSave`: now is the save time, so the meat is the mutated value (US-3). */
const run = (id: string, edit?: (s: AccountState) => AccountState, atSave = false): EngineResult => {
  const f = fixture(id);
  const state = edit ? edit(structuredClone(stateOf(f))) : stateOf(f);
  return goldenResult({
    state,
    kb: ctx.kb,
    registries: ctx.registries,
    now: atSave ? (state.account.lastCloudSave ?? f.now) : f.now,
    expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
  });
};
const bubba = (r: EngineResult): Goal | undefined => r.account.goals.find((g) => g.id === 'bubba.goal.visit');
const details = (g: Goal | undefined) => (g?.details ?? []).map((d) => d.text);
const tile = (r: EngineResult) =>
  (() => {
    const v = buildSystemsView(r, EMPTY_PREFS, { now: 0 });
    return [...v.groups.flatMap((g) => g.tiles), ...(v.later?.tiles ?? [])].find((t) => t.id === 'bubba');
  })();

const w3 = run('scrubbed-w3');

describe('US-1 is Bubba worth a minute', () => {
  it('W3-early: one account Goal, training a maxed Hustle, with the banked levels; no character card', () => {
    const goals = w3.account.goals.filter((g) => g.system === 'bubba');
    expect(goals).toHaveLength(1);
    const g = goals[0];
    expect(g?.title).toBe('Bubba');
    expect(g?.nextAction.key).toBe(BUBBA_GOAL_KEY);
    expect(g?.nextAction.text).toBe(
      "Train another attribute in Bubba's Charisma Chart: tap one that isn't maxed",
    );
    expect(g?.nextAction.why).toBe(
      'Hustle is at its max of 120. XP keeps banking until you pick another, and the next Megaflesh wipes it.',
    );
    expect(details(g)[0]).toMatch(/^About \d+ levels of XP are waiting$/);
    // The save is 8h 28m before the golden clock: 102B projected covers Open Gift's 100B (Beeg Slice picked).
    expect(details(g)).toContain('Also in Bubba: pat Bubba 10 times, then buy Open Gift right away');
    for (const c of w3.characters) expect(c.goals.some((x) => x.system === 'bubba')).toBe(false);
  });

  it('W2-late: no Bubba output, and the tile is locked with its unlock line', () => {
    const w2 = run('scrubbed-w2');
    expect(bubba(w2)).toBeUndefined();
    expect(w2.bubba ?? null).toBeNull();
    const t = tile(w2);
    expect(t?.status).toBe('locked');
    expect(t?.reason.map((s) => s.text).join('')).toContain("YumYum Grotto's door");
  });

  it('never started: the start Goal, compounding, and no Bubba production bars', () => {
    const r = run('scrubbed-w3', neverStarted);
    const g = bubba(r);
    expect(g?.nextAction.text).toBe('Start Bubba: open the Codex, tap Bubba, buy 1st Slice');
    expect(g?.category).toBe('compounding');
    expect(
      (r.timeline ?? []).filter(
        (b) => b.system === 'bubba' && b.kind === 'timer' && b.what !== "Bubba's pats",
      ),
    ).toEqual([]);
    expect(r.bubba?.state).toBe('not-started');
  });

  it('just after Megaflesh 4: the restart Goal, losing-now, and the hub marks Bubba wasting', () => {
    const r = run('scrubbed-w3', justReset);
    const g = bubba(r);
    expect(g?.nextAction.text).toBe('Buy 1st Slice again: Bubba makes nothing until you do');
    expect(g?.urgency).toBe('losing-now');
    expect(tile(r)?.status).toBe('wasting');
  });
});

describe('US-2 the Smoker', () => {
  it('latest.json: silent with Slabcakes, and the page says it is held', () => {
    const r = run('latest');
    expect(r.account.goals.some((g) => g.nextAction.entryId === 'bubba.check.smoker')).toBe(false);
    expect(r.bubba?.smoker).toMatchObject({ atMax: true, heldForSlabcakes: true });
    expect(renderBubbaText(r.bubba, fixture('latest').now)).toContain('held for Slabcakes');
  });

  it('latest.json with Beeg Slice: claim until the timer resets (Megaflesh 12), no urgency, not wasting', () => {
    const r = run('latest', (s) => withGifts(s, 1, 6));
    const g = bubba(r);
    // FR-18: the Smoker ranks above Charisma idle and pat then gift.
    expect(g?.nextAction.text).toBe('Claim the Smoker: buy Smoker levels until its timer resets');
    expect(g?.urgency ?? null).not.toBe('losing-now');
    expect(tile(r)?.status).not.toBe('wasting');
  });

  it('highend.json: silent, and the Smoker bar is at the save + 11h 18m', () => {
    const r = run('highend');
    expect(r.account.goals.some((g) => g.nextAction.entryId === 'bubba.check.smoker')).toBe(false);
    const bar = r.timeline?.find((b) => b.entryId === 'bubba.check.smoker');
    const save = stateOf(fixture('highend')).account.lastCloudSave ?? 0;
    expect(Math.floor(((bar?.at ?? 0) - save) / 60_000)).toBe(11 * 60 + 18);
  });
});

describe('US-3 Megaflesh, with nothing wasted', () => {
  it('260B: Megaflesh 4, restart and Charisma details, the Charisma idle Check silent, no Boon detail', () => {
    const r = run('scrubbed-w3', (s) => withMeat(s, 260e9), true);
    const g = bubba(r);
    expect(g?.nextAction.text).toBe('Buy Megaflesh 4: account bonuses 1.40x');
    expect(details(g).slice(0, 2)).toEqual([
      'Then buy 1st Slice right away to restart',
      'Charisma levels and XP reset too',
    ]);
    // Pat then gift stays (FR-7): Beeg Slice grows the leftover. No Boon detail: 15B is short of 1.33T.
    expect(details(g).some((d) => d.includes('Boon'))).toBe(false);
    expect(g?.nextAction.provenance.entryIds).not.toContain('bubba.check.charisma-idle');
  });

  it('1.6T: the leftover buys Boon 12 first, with the bonus after this Megaflesh', () => {
    const g = bubba(run('scrubbed-w3', (s) => withMeat(s, 1.6e12), true));
    expect(details(g)[0]).toBe(
      'First buy Boon 12 (+1.2% All Kills, +1.4% All Kills after this Megaflesh) with the leftover',
    );
  });

  it('unmutated: the Bubba lane has "Megaflesh 4" about 11h 52m after the golden clock', () => {
    const bar = w3.timeline?.find((b) => b.entryId === 'bubba.check.megaflesh');
    expect(bar?.what).toBe('Megaflesh 4');
    const mins = Math.round(((bar?.at ?? 0) - fixture('scrubbed-w3').now) / 60_000);
    expect(mins).toBeGreaterThan(11 * 60 + 40);
    expect(mins).toBeLessThan(12 * 60 + 5);
  });
});

describe('US-4 Boon to 7', () => {
  it('Boon 4 with 100M meat: Buy Bubba Boon 5 for All Kills at 1.2x; the page marks All Kills, low at W3-early', () => {
    const r = run('scrubbed-w3', (s) => withMeat(withUpgrade(s, UPG.boon, 4, 1e6), 100e6), true);
    expect(bubba(r)?.nextAction.text).toBe('Buy Bubba Boon 5: adds +1.2% All Kills to your whole account');
    const next = r.bubba?.bonuses.find((b) => b.next);
    expect(next).toMatchObject({ key: 'allKills', rating: 'low' });
  });

  it('Boon 4, Megaflesh 0, meat for Megaflesh 1 and Boon 5 to 7: Megaflesh first, the leftover buys 5, 6 and 7', () => {
    const r = run(
      'scrubbed-w3',
      (s) => {
        const b = s.account.bubba;
        if (!b) return s;
        const costs = [...b.costs];
        costs[UPG.megaflesh] = 1e6;
        costs[UPG.boon] = 1e3;
        const levels = [...b.levels];
        levels[UPG.boon] = 4;
        levels[UPG.funGifts] = 6;
        return withMeat(
          withBubba(s, {
            megaflesh: 0,
            costs,
            levels,
            ahead: { boonCosts: [1e3, 1e4, 1e5, 1e12], funGiftsCosts: [] },
          }),
          1.2e6,
        );
      },
      true,
    );
    const g = bubba(r);
    expect(g?.nextAction.text).toMatch(/^Buy Megaflesh 1: /);
    expect(
      details(g)
        .slice(0, 3)
        .map((d) => d.match(/Boon (\d+)/)?.[1]),
    ).toEqual(['5', '6', '7']);
  });
});

describe('US-5 pat, then gift, only with Beeg Slice', () => {
  it('latest.json with Beeg Slice and Slabcakes: 21 pats, as a detail under Charisma idle', () => {
    const g = bubba(run('latest', (s) => withGifts(s, 1, 5)));
    expect(g?.nextAction.entryId).toBe('bubba.check.charisma-idle');
    expect(details(g)).toContain('Also in Bubba: pat Bubba 21 times, then buy Open Gift right away');
  });

  it('latest.json unmutated: silent', () => {
    expect(bubba(run('latest'))?.nextAction.provenance.entryIds).not.toContain('bubba.check.pat-gift');
  });

  it('W3-early: the Pats panel reads 10 of 10, full when you open Bubba', () => {
    expect(w3.bubba?.pats).toEqual({ left: 10, perHour: 10, refillAt: null });
  });
});

describe('US-6 account bonuses, not Charisma', () => {
  it('W3-early: the seven totals, boosted 1.2x, and Charisma at Hustle 120, the rest 0', () => {
    expect(w3.bubba?.bonuses.map((b) => b.text)).toEqual([
      '+24% Build Rate',
      '+1.2 base critters per trap',
      '+12% Soul Gain',
      '+36% Total Damage',
      '+1.2% All Kills',
      '+4.8% Class EXP',
      '−3.6% Atom Cost',
    ]);
    expect(w3.bubba?.megaflesh.multiplier).toBe('1.2x');
    const c = w3.bubba?.charisma;
    expect(c?.attrs[0]).toMatchObject({ name: 'Hustle', level: 120, training: true, atMax: true });
    expect(c?.attrs.slice(1).every((a) => a.level === 0)).toBe(true);
    expect(c?.attrs[1]?.next).toBe('Rizz 0 → 1: −2.06% Costs');
    expect(c?.targets.map((t) => t.source).sort()).toEqual(['gameslikefinder', 'kanumar']);
    expect(c?.targets.find((t) => t.source === 'gameslikefinder')?.gaps[1]).toEqual({ target: 15, gap: 15 });
  });
});

describe('US-7 and FR-3 home in two taps', () => {
  it('the Goal opens the Bubba System, whose home is its own page', async () => {
    const { SYSTEM_HOMES } = await import('../../src/now/system-homes');
    expect(SYSTEM_HOMES.bubba).toEqual({ page: 'bubba' });
    expect(bubba(w3)?.system).toBe('bubba');
    expect(w3.systems?.find((s) => s.id === 'bubba')?.unlocked).toBe('yes');
  });
});

describe('TR-10', () => {
  it('Charisma naming: none at Megaflesh 5, Mindful at 6 below max, none with Mindful maxed', () => {
    const at = (mf: number, mindful: number) =>
      bubba(
        run('scrubbed-w3', (s) => {
          const b = s.account.bubba;
          if (!b) return s;
          const levels = [...b.charisma.levels] as typeof b.charisma.levels;
          levels[4] = mindful;
          return withBubba(s, { megaflesh: mf, charismaPatch: { levels } });
        }),
      )?.nextAction.text;
    expect(at(5, 0)).toBe("Train another attribute in Bubba's Charisma Chart: tap one that isn't maxed");
    expect(at(6, 0)).toBe("Train Mindful in Bubba's Charisma Chart");
    expect(at(6, 120)).toBe("Train another attribute in Bubba's Charisma Chart: tap one that isn't maxed");
    for (const t of [at(5, 0), at(6, 0), at(6, 120)]) expect(t).not.toMatch(/Hustle|Rizz/);
  });

  it('nothing selected: "Pick an attribute to train" (the owner\'s live case)', () => {
    const g = bubba(run('scrubbed-w3', (s) => withBubba(s, { charismaPatch: { selected: 0 } })));
    expect(g?.nextAction.text).toBe("Pick an attribute to train in Bubba's Charisma Chart");
    expect(g?.nextAction.why).toMatch(/^No attribute is training/);
  });

  it('the stable key: Skip today on the Goal holds when the top Check changes', () => {
    const a = bubba(w3);
    const b = bubba(run('scrubbed-w3', (s) => withGifts(s, 1, 6)));
    expect(a?.nextAction.key).toBe(b?.nextAction.key);
  });

  it('timeline units: rate 60 a minute and 60 meat short is 60,000 ms after the save', () => {
    const r = run(
      'scrubbed-w3',
      (s) => {
        const b = s.account.bubba;
        if (!b) return s;
        const costs = [...b.costs];
        costs[UPG.megaflesh] = b.meat + 60;
        return withBubba(s, { rateBase: 60, costs });
      },
      true,
    );
    const bar = r.timeline?.find((x) => x.entryId === 'bubba.check.megaflesh');
    expect((bar?.at ?? 0) - (stateOf(fixture('scrubbed-w3')).account.lastCloudSave ?? 0)).toBe(60_000);
  });

  it('payback: a discount dearer than its saving on the Megaflesh is never a next buy', () => {
    const r = run('scrubbed-w3', (s) =>
      withBubba(s, { discountNextRatio: [0.9999999, 0.9999999, 0.9999999] }),
    );
    expect(r.bubba?.run.nextBuys.some((x) => x.tier === 6)).toBe(false);
  });

  it('projection: equals the meat at the save, rises after, and hides with happiness and no X1', () => {
    const at = run('scrubbed-w3', undefined, true);
    expect(at.bubba?.projected).toBe('565M meat');
    expect(w3.bubba?.projected).toBe('102B meat');
    const hidden = run('scrubbed-w3', (s) => withBubba(s, { rateBase: null, happiness: 50 }));
    expect(hidden.bubba?.projected).toBeNull();
  });

  it('is deterministic: the same input gives the same output', () => {
    expect(JSON.stringify(run('scrubbed-w3').bubba)).toBe(JSON.stringify(w3.bubba));
  });

  it('an unreadable record: no Goal, the Checks unknown, the page "Can\'t read"', () => {
    const r = run('scrubbed-w3', (s) => ({ ...s, account: { ...s.account, bubba: null } }));
    expect(bubba(r)).toBeUndefined();
    expect(r.bubba?.state).toBe('unknown');
    expect(renderBubbaText(r.bubba, 0)).toBe("Can't read Bubba from this save");
  });
});
