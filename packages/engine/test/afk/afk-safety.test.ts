// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 AFK Safety's user stories (section 4) as tests, on the scrubbed W2-late and W3-early saves at
// their own cloud-save time, with no history and an 8 h Expected Return unless a story says otherwise.
// Characters are named by class and level only.
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import type { HistoryEntry } from '@idleon-forge/knowledge';
import { withCharacter, withUnknown } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { composeVerdict, HOUR_MS, toModuleOutput } from '../../src/afk';
import { blockers, capsOf, charOf, evaluate, kb, nextActions, patchAfk, W2, W3 } from './helpers';

// W2-late save order: Barbarian Lv 60, Squire Lv 43, Shaman Lv 44, Bowman Lv 54, Wizard Lv 56.
// W3-early save order: Wizard Lv 73, Squire Lv 51, Bowman Lv 60, Squire Lv 85, Barbarian Lv 56, Shaman Lv 54.

describe('US-1 a fighter that would die', () => {
  it('blocks the W2-late Barbarian Lv 60 on the most efficient owned food (R-FOOD-1), with its Source', () => {
    const r = evaluate(W2());
    const c = charOf(r, 0);
    expect(c.safety).toBe('unsafe');
    const f = c.findings.find((x) => x.entryId === 'afk.check.dies-fixable-by-food');
    expect(f?.role).toBe('blocker');
    // Max HP about 722: Meat Pie (500 a bite) is the smallest heal that refills most of it. Magic
    // Meatloaf (2000) overheals, and Kebab Sticks (300) and Hot Dog (50) refill too little.
    expect(f?.nextAction.text).toBe('Equip Meat Pie before you leave');
    expect(f?.nextAction.why).toMatch(/^This character is at 78% survivability and you own 105\./);
    expect(f?.nextAction.sources[0]?.tier).toBe(1);
    expect(f?.nextAction.sources[0]?.url).toContain('parsers/damage.ts');
  });

  it('says stock up when no owned stack lasts the return (R-FOOD-1), and stays a blocker', () => {
    const s = W2();
    const r8 = evaluate(s, 8, { history: eatingHistory(s, 0, 30) });
    const f = charOf(r8, 0).findings.find((x) => x.entryId === 'afk.check.dies-fixable-by-food');
    // 30 Meat Pie an hour is 15,000 HP an hour: 105 Meat Pie last about 3.5 h, under 8 h, and no other
    // owned stack lasts longer, so the efficient food is named with a stock-up.
    expect(f?.role).toBe('blocker');
    expect(f?.nextAction.text).toBe('Equip Meat Pie and stock up on it before you leave');
    expect(f?.nextAction.why).toMatch(
      /^Your 105 last about 4h, less than your return, and this character is at 78% survivability\./,
    );
    // At a 2 h return the same stack lasts: plain equip text.
    const r2 = evaluate(s, 2, { history: eatingHistory(s, 0, 30) });
    const g = charOf(r2, 0).findings.find((x) => x.entryId === 'afk.check.dies-fixable-by-food');
    expect(g?.nextAction.text).toBe('Equip Meat Pie before you leave');
  });

  it('shows no food blocker on the W2-late Shaman, Bowman or Wizard', () => {
    const r = evaluate(W2());
    for (const i of [2, 3, 4])
      expect(blockers(charOf(r, i).findings).filter((x) => x.startsWith('afk.'))).toEqual([]);
  });

  it('flags low food under 60% of the food carry cap (R-FOOD-2), as Next Actions only', () => {
    const r = evaluate(W3());
    // Wizard Lv 73: 153 against a cap of 419 (threshold 251). Squire Lv 85: 146 against 313 (188).
    for (const i of [0, 3]) {
      const f = charOf(r, i).findings.find((x) => x.entryId === 'afk.check.low-food-untimed');
      expect(f?.role).toBe('next-action');
      expect(charOf(r, i).safety).toBe('safe');
    }
    for (const c of r.characters) expect(blockers(c.findings).filter((x) => x.includes('food'))).toEqual([]);
  });

  it('falls back to 50 when the food cap is unknown or contradicted by the save', () => {
    const s = W3();
    const f = s.characters[3]?.afk?.fighting;
    const food = (s.characters[3]?.afk?.food ?? []).map((x) =>
      x.kind === 'health' ? { ...x, amount: 60 } : x,
    );
    const noCap = f ? patchAfk(s, 3, { food, fighting: { ...f, foodCap: null } }) : s;
    expect(charOf(evaluate(noCap), 3).findings.map((x) => x.entryId)).not.toContain(
      'afk.check.low-food-untimed',
    );
    const low = (s.characters[3]?.afk?.food ?? []).map((x) =>
      x.kind === 'health' ? { ...x, amount: 40 } : x,
    );
    const r = evaluate(f ? patchAfk(s, 3, { food: low, fighting: { ...f, foodCap: null } }) : s);
    expect(
      charOf(r, 3).findings.find((x) => x.entryId === 'afk.check.low-food-untimed')?.nextAction.text,
    ).toBe("Low food: 40 left; can't time it yet");
  });
});

/** Three earlier 2 h AFK Stretches of `index` with Meat Pie equipped, eating `perHour` (R-FOOD-1). */
/** Saves an hour apart in which Water rose by `perHour` each hour from 0, below its cap (R-PILL-2). */
function waterHistory(s: AccountState, perHour: number): HistoryEntry[] {
  return [3, 2, 1].map((k) => {
    const afk = s.account.afk;
    const at = s.asOf - k * HOUR_MS;
    const liquids = (afk?.liquids ?? []).map((l) =>
      l.index === 0 ? { ...l, current: (3 - k) * perHour } : l,
    );
    const state = afk ? { ...s, account: { ...s.account, afk: { ...afk, liquids } } } : s;
    return { lastCloudSave: at, receivedAt: at, state };
  });
}

function eatingHistory(s: AccountState, index: number, perHour: number): HistoryEntry[] {
  const since = s.characters.find((c) => c.index === index)?.afk?.afkSince ?? s.asOf;
  const at = (k: number): HistoryEntry => {
    const afkSince = since - k * 2 * HOUR_MS;
    const pie = {
      slot: 2,
      item: 'FoodHealth7',
      kind: 'health' as const,
      amount: 100 + perHour * 2 * k,
      healPerBite: 500,
    };
    const c = s.characters.find((x) => x.index === index);
    const state = patchAfk(s, index, { afkSince, food: [...(c?.afk?.food ?? []), pie] });
    return {
      lastCloudSave: afkSince,
      receivedAt: afkSince,
      state: { ...state, account: { ...state.account, lastCloudSave: afkSince } },
    };
  };
  return [at(3), at(2), at(1)];
}

/** Two earlier AFK Stretches of `index`, 2 h each, eating `perHour` health food (US-2). */
function foodHistory(s: AccountState, index: number, perHour: number): HistoryEntry[] {
  const now = s.characters.find((c) => c.index === index)?.afk?.afkSince ?? s.asOf;
  const health = (c: CharacterState | undefined) =>
    (c?.afk?.food ?? []).filter((f) => f.kind === 'health').reduce((n, f) => n + f.amount, 0);
  const left = health(s.characters.find((c) => c.index === index));
  const at = (k: number): HistoryEntry => {
    const afkSince = now - k * 2 * HOUR_MS;
    const c = s.characters.find((x) => x.index === index);
    const food = (c?.afk?.food ?? []).map((f) =>
      f.kind === 'health' ? { ...f, amount: left + perHour * 2 * k } : f,
    );
    const state = patchAfk(s, index, { afkSince, food });
    return {
      lastCloudSave: afkSince,
      receivedAt: afkSince,
      state: { ...state, account: { ...state.account, lastCloudSave: afkSince } },
    };
  };
  return [at(2), at(1)];
}

describe('US-2 food that runs out overnight', () => {
  const withSpare = (s: AccountState) => {
    const f = s.characters[3]?.afk?.fighting;
    return f ? patchAfk(s, 3, { fighting: { ...f, spareHealthFood: 500 } }) : s;
  };

  it('blocks the W3-early Squire Lv 85 at 8 h: 146 food at 20 an hour runs out in about 7.3 h', () => {
    const s = withSpare(W3());
    const r = evaluate(s, 8, { history: foodHistory(s, 3, 20) });
    const f = charOf(r, 3).findings.find((x) => x.entryId === 'afk.check.health-food-runs-out');
    expect(f?.role).toBe('blocker');
    expect(f?.fixHolds).toBe(true);
    expect(((f?.at ?? 0) - (s.characters[3]?.afk?.afkSince ?? 0)) / HOUR_MS).toBeCloseTo(7.3, 1);
    expect(f?.nextAction.text).toBe('Add more health food from storage');
    expect(f?.nextAction.why).toMatch(/^It runs out in 7h \d\dm \(146 left\)\./);
  });

  it('shows no food blocker at 4 h; the run-out is after the return', () => {
    const s = withSpare(W3());
    const r = evaluate(s, 4, { history: foodHistory(s, 3, 20) });
    const c = charOf(r, 3);
    expect(c.findings.map((f) => f.entryId)).not.toContain('afk.check.health-food-runs-out');
    // The Squire's first fill is its anvil (about 5.1 h), which comes before the food run-out (7.3 h).
    expect(c.firstFill?.label).toBe("Squire Lv 85's anvil");
  });

  it('demotes the block to a Next Action when storage cannot cover the stretch', () => {
    const s0 = W3();
    const f = s0.characters[3]?.afk?.fighting;
    const s = f ? patchAfk(s0, 3, { fighting: { ...f, spareHealthFood: 5 } }) : s0;
    const r = evaluate(s, 8, { history: foodHistory(s, 3, 20) });
    const x = charOf(r, 3).findings.find((y) => y.entryId === 'afk.check.health-food-runs-out');
    expect(x?.role).toBe('next-action');
    expect(x?.demotedBecause).toBe('fix-does-not-hold');
  });
});

describe('US-4 anvil that caps, and anvil that cannot be helped (#70 A5, R-PILL-1)', () => {
  it('W2-late at 8 h: the Barbarian Lv 60 is full now: a cap pill, not a blocker; the other four show nothing', () => {
    const r = evaluate(W2());
    const barb = charOf(r, 0);
    expect(barb.findings.map((f) => f.entryId)).not.toContain('anvil.check.caps-before-return');
    const pill = barb.caps.find((p) => p.entryId === 'anvil.check.caps-before-return');
    expect(pill?.label).toBe('Anvil full · collect');
    expect(pill?.fullNow).toBe(true);
    expect(pill?.key).toBe('anvil.check.caps-before-return@c0');
    expect(pill?.nextAction.text).toBe('Collect Thread from the anvil');
    expect(pill?.nextAction.why).toMatch(/^Full now; it refills in about 3h after you collect\./);
    // Still Fix, but only for its food: the anvil is not one of its blockers.
    expect(blockers(barb.findings)).toEqual(['afk.check.dies-fixable-by-food']);
    for (const i of [1, 2, 3, 4]) expect(capsOf(charOf(r, i))).toEqual([]);
  });

  it('W2-late at 2 h: the Barbarian keeps its pill; the Bowman edge (fills before the return) is a pill too', () => {
    const r = evaluate(W2(), 2);
    expect(capsOf(charOf(r, 0))).toContain('anvil.check.caps-before-return');
    for (const i of [1, 2]) expect(capsOf(charOf(r, i))).toEqual([]);
    const bowman = W2().characters[3]?.afk?.anvil?.[0];
    // 7,355,512 ms from empty >= 2 h: collecting now lasts the stretch, so it shows, as a pill.
    expect(bowman?.fromEmptyMs).toBe(7355512);
    const pill = charOf(r, 3).caps.find((p) => p.entryId === 'anvil.check.caps-before-return');
    expect(pill?.fullNow).toBe(false);
    expect(pill?.label).toMatch(/^Anvil full in \d+h \d\dm · collect$/);
    for (const c of r.characters)
      expect(blockers(c.findings)).not.toContain('anvil.check.caps-before-return');
  });

  it("W3-early at 8 h: no anvil blocker, and the first fill is the Bowman Lv 60's anvil at about 8.2 h", () => {
    const r = evaluate(W3());
    for (const c of r.characters)
      expect(blockers(c.findings)).not.toContain('anvil.check.caps-before-return');
    expect(r.firstFill?.label).toBe("Bowman Lv 60's anvil");
    expect(((r.firstFill?.at ?? 0) - W3().asOf) / HOUR_MS).toBeCloseTo(8.15, 1);
  });

  it('R-PILL-1: every W3-early anvil full now (16:12 UTC) is a pill, never a blocker', () => {
    const s = W3();
    const r = evaluate(s, 8, { now: Date.parse('2026-10-17T16:12:33.140Z') });
    for (const c of r.characters) {
      expect(capsOf(c)).toContain('anvil.check.caps-before-return');
      // Only M9's wrong-preset Check (a real blocker) can make a row unsafe here.
      expect(blockers(c.findings).filter((x) => !x.startsWith('talent-presets.'))).toEqual([]);
    }
  });
});

describe('US-5 worship charge that is already full', () => {
  it('W3-early: four skull-less 50/50 bars are "Worship full" pills, never blockers or Goals (R-PILL-1)', () => {
    const r = evaluate(W3());
    for (const i of [1, 2, 3, 4]) {
      expect(capsOf(charOf(r, i))).toContain('worship.check.charge-caps-no-skull');
      expect(charOf(r, i).caps.find((p) => p.entryId.startsWith('worship'))?.label).toBe(
        'Worship full · spend',
      );
    }
    for (const i of [0, 5]) expect(capsOf(charOf(r, i))).not.toContain('worship.check.charge-caps-no-skull');
    for (const c of r.characters) expect(c.findings.some((f) => f.entryId.startsWith('worship'))).toBe(false);
  });

  const skull = (charge: number) => {
    const s = W3();
    const w = s.characters[0]?.afk?.worship;
    return w ? patchAfk(s, 0, { worship: { ...w, max: 120, charge, hasSkull: true } }) : s;
  };

  it('a skull at 26.1/120 and a 24 h return: no blocker, and the first fill is the worship charge at about 73 h', () => {
    const r = evaluate(skull(26.05), 24);
    expect(blockers(charOf(r, 0).findings)).toEqual([]);
    expect(charOf(r, 0).firstFill?.label).toBe("Wizard Lv 73's worship charge");
    expect(((charOf(r, 0).firstFill?.at ?? 0) - W3().asOf) / HOUR_MS).toBeCloseTo(73.4, 0);
  });

  it('a skull at 110/120 and an 8 h return: a "Worship full in X" pill, not a blocker (R-PILL-1)', () => {
    const r = evaluate(skull(110));
    expect(charOf(r, 0).findings.map((x) => x.entryId)).not.toContain('worship.check.charge-caps-skull');
    const pill = charOf(r, 0).caps.find((x) => x.entryId === 'worship.check.charge-caps-skull');
    expect(pill?.fullNow).toBe(false);
    expect(pill?.label).toMatch(/^Worship full in \d+h \d\dm · spend$/);
    expect(charOf(r, 0).safety).toBe('safe');
  });

  it('W2-late: no worship Finding (World 2 is not finished)', () => {
    const r = evaluate(W2());
    for (const c of r.characters) expect(c.findings.some((f) => f.entryId.startsWith('worship'))).toBe(false);
  });
});

describe('US-6 account stockpiles that cap', () => {
  it('W2-late at 8 h, no history: the Arcade blocks; Water at cap is an account line, not a blocker (R-PILL-2)', () => {
    const r = evaluate(W2());
    expect(r.account.safety).toBe('unsafe');
    expect(blockers(r.account.findings)).toEqual(['arcade.check.balls-cap']);
    const water = r.account.findings.find((f) => f.entryId === 'alchemy.check.liquid-cap-line');
    expect(water?.role).toBe('next-action');
    expect(water?.nextAction.text).toBe('Spend Water on bubbles, vials or the Liquid Shop');
    expect(water?.nextAction.why).toMatch(/^Water is at cap \(32 of 32\)\./);
    expect(r.account.findings.map((f) => f.entryId)).not.toContain('alchemy.check.liquid-cap');
  });

  it('R-PILL-2: Water at cap blocks only when save history shows it refilling slower than the return', () => {
    const s = W2();
    // 2 Water an hour: 32 takes 16 h to refill, longer than an 8 h return, so the whole return is lost.
    const slow = evaluate(s, 8, { history: waterHistory(s, 2) });
    expect(blockers(slow.account.findings)).toContain('alchemy.check.liquid-cap');
    expect(slow.account.findings.map((f) => f.entryId)).not.toContain('alchemy.check.liquid-cap-line');
    const slowNa = slow.account.findings.find((f) => f.entryId === 'alchemy.check.liquid-cap')?.nextAction;
    expect(slowNa?.text).toBe('Spend Water on bubbles, vials or the Liquid Shop');
    expect(slowNa?.why).toMatch(
      /^Water is at cap \(32 of 32\), and your saves show it takes about 16h to refill, longer than your return\./,
    );
    // At a 24 h return the same 16 h refill is faster than the return: an account line again.
    const long = evaluate(s, 24, { history: waterHistory(s, 2) });
    expect(blockers(long.account.findings)).not.toContain('alchemy.check.liquid-cap');
    // 10 Water an hour: 3.2 h to refill, faster than 8 h: an account line, never a blocker.
    const fast = evaluate(s, 8, { history: waterHistory(s, 10) });
    expect(blockers(fast.account.findings)).not.toContain('alchemy.check.liquid-cap');
    expect(nextActions(fast.account.findings)).toContain('alchemy.check.liquid-cap-line');
  });

  it('R-PILL-2: a history where Water sat at cap gives no rate, so it never blocks', () => {
    const s = W2();
    const capped = waterHistory(s, 2).map((h) => ({ ...h, state: s }));
    expect(blockers(evaluate(s, 8, { history: capped }).account.findings)).not.toContain(
      'alchemy.check.liquid-cap',
    );
  });

  it('a failed Arcade section makes an otherwise-safe account Unknown (W3-early)', () => {
    const s = W3();
    const failed = { ...s, diagnostics: { ...s.diagnostics, failedSections: ['arcade'] } };
    expect(evaluate(failed).account.safety).toBe('unknown');
  });

  it('W3-early at 8 h: no account blocker', () => {
    const r = evaluate(W3());
    expect(blockers(r.account.findings)).toEqual([]);
    expect(r.account.safety).toBe('safe');
  });

  it('W3-early at 48 h: the Arcade blocks (its fix holds, 48 h >= 48 h) and the Refinery is a Next Action', () => {
    const r = evaluate(W3(), 48);
    const arcade = r.account.findings.find((f) => f.entryId === 'arcade.check.balls-cap');
    expect(arcade?.role).toBe('blocker');
    expect(arcade?.fixHolds).toBe(true);
    expect(nextActions(r.account.findings)).toContain('refinery.check.fuel-runs-out');
  });
});

describe('US-7 an inventory that is full', () => {
  it('a skiller whose target stack is at cap with a full bag: blocked only when storage has room', () => {
    const fill = (s: AccountState, freeStorage: number) => {
      const c = s.characters[1];
      const inv = c?.afk?.inventory;
      if (!inv || !c?.afk) return s;
      const stacks = [
        ...inv.stacks.map((x) => (x.item === c.afkTarget && x.cap !== null ? { ...x, amount: x.cap } : x)),
        ...Array.from({ length: inv.totalSlots - inv.stacks.length }, (_, i) => ({
          item: `F${i}`,
          amount: 1,
          cap: null,
        })),
      ];
      const t = patchAfk(s, 1, { inventory: { ...inv, stacks, usedSlots: inv.totalSlots } });
      const afk = t.account.afk;
      return afk ? { ...t, account: { ...t.account, afk: { ...afk, storageFreeSlots: freeStorage } } } : t;
    };
    const blocked = evaluate(fill(W2(), 3));
    const f = charOf(blocked, 1).findings.find((x) => x.entryId === 'afk.check.skiller-carry');
    expect(f?.role).toBe('blocker');
    expect(f?.nextAction.text).toBe('Deposit Copper to storage');
    expect(f?.nextAction.why).toMatch(/^Copper is at its carry cap \(274\) and the bag has no free slot/);
    // The real W2-late storage is full (91 of 91), so depositing is not possible: a Next Action.
    const full = charOf(evaluate(fill(W2(), 0)), 1).findings.find(
      (x) => x.entryId === 'afk.check.skiller-carry',
    );
    expect(full?.demotedBecause).toBe('not-fillable');
  });
});

describe('US-8 empty Parallel Slots and idle traps', () => {
  it('no cauldron Finding on either fixture; an unassigned Bowman Lv 54 blocks', () => {
    for (const s of [W2(), W3()])
      for (const c of evaluate(s).characters)
        expect(c.findings.map((f) => f.entryId)).not.toContain('alchemy.check.cauldron-unassigned');
    const r = evaluate(patchAfk(W2(), 3, { cauldronAssigned: false }));
    const f = charOf(r, 3).findings.find((x) => x.entryId === 'alchemy.check.cauldron-unassigned');
    expect(f?.role).toBe('blocker');
    // Copy pass rule 6: the Bowman's own row doesn't repeat its name in the action.
    expect(f?.nextAction.text).toBe('Assign this character to a cauldron before you leave');
  });

  const trap = (offsetH: number) => {
    const s = W3();
    return patchAfk(s, 4, {
      traps: { placed: [{ critter: 'Critter1', endsAt: s.asOf + offsetH * HOUR_MS }] },
    });
  };

  it('no trap Finding on the W3-early account', () => {
    for (const c of evaluate(W3()).characters)
      expect(c.findings.some((f) => f.entryId.startsWith('trapping'))).toBe(false);
  });

  it('a trap finishing in 3 h against 8 h is a "Traps idle" pill (R-PILL-1); a finished trap blocks', () => {
    const running = charOf(evaluate(trap(3)), 4);
    expect(running.caps.find((p) => p.entryId === 'trapping.check.finishes-early')?.label).toBe(
      'Traps idle in 3h 00m',
    );
    expect(running.findings.map((f) => f.entryId)).not.toContain('trapping.check.finishes-early');
    // This fisher is also on its fighting preset: M9's wrong-preset blocker joins the pipeline (M9 US-1).
    expect(blockers(running.findings)).toEqual(['talent-presets.check.wrong-preset']);
    const done = charOf(evaluate(trap(-1)), 4);
    expect(blockers(done.findings)).toContain('trapping.check.slots-and-timers');
  });
});

describe('US-10 when the save cannot tell', () => {
  it('an unreadable anvil no longer makes a row Unknown (R-PILL-1: the anvil is not a blocker); food still is', () => {
    let s = W2();
    for (const c of s.characters) s = withUnknown(s, `characters[${c.index}].afk.anvil`);
    const r = evaluate(s);
    expect(charOf(r, 0).safety).toBe('unsafe');
    for (const i of [1, 2, 3, 4]) expect(charOf(r, i).safety).toBe('safe');
    for (const c of r.characters) expect(capsOf(c)).toEqual([]);
  });

  it('a character whose AFK Target is the Lab is not-covered, never Ready', () => {
    const r = evaluate(withCharacter(W3(), 5, { afkType: 'LABORATORY', afkTarget: null }));
    expect(charOf(r, 5).safety).toBe('not-covered');
    expect(composeVerdict('not-covered', 'not-implemented')).toEqual({
      kind: 'unknown',
      blockerKeys: [],
      unknownReason: 'not-covered',
      suggestion: null,
    });
  });

  it('missing AFK facts (no Toolbox calls) are Unknown, never a silent pass', () => {
    const s = W3();
    const bare = {
      ...s,
      characters: s.characters.map((c) => ({ ...c, afk: null })),
      account: { ...s.account, afk: null },
    };
    const r = evaluate(bare);
    // M9's wrong-preset blockers read talents, not AFK facts, so those two rows stay Fix (M9 US-1).
    for (const c of r.characters)
      expect(c.safety).toBe(c.index === 2 || c.index === 4 ? 'unsafe' : 'unknown');
    expect(r.account.safety).toBe('unknown');
  });
});

describe('US-11 the overall verdict', () => {
  it('W3-early at 8 h: 4 Ready and 2 on the wrong talent preset, no account blocker, first fill the Bowman Lv 60 anvil, 4 already full', () => {
    const r = evaluate(W3());
    const out = toModuleOutput(r, kb);
    // The Bowman Lv 60 and the fishing Barbarian Lv 56 are on the wrong preset (M9 US-1).
    expect((out.characters ?? []).map((c) => c.verdict?.kind)).toEqual([
      'ready',
      'ready',
      'fix',
      'ready',
      'fix',
      'ready',
    ]);
    expect(out.account?.blockerKeys).toEqual([]);
    expect(out.firstFill?.label).toBe("Bowman Lv 60's anvil");
    expect(out.alreadyFull).toBe(4);
  });

  it('W2-late at 8 h: the Barbarian Lv 60 is Fix for its food only (its full anvil is a pill), 4 Ready', () => {
    const out = toModuleOutput(evaluate(W2()), kb);
    expect((out.characters ?? []).map((c) => c.verdict?.kind)).toEqual([
      'fix',
      'ready',
      'ready',
      'ready',
      'ready',
    ]);
    // R-PILL-1: the full anvil is a pill, never one of the Verdict's blockers.
    expect(out.characters?.[0]?.verdict?.blockerKeys).toEqual(['afk.check.dies-fixable-by-food@c0']);
    const caps = (out.characters?.[0]?.info ?? []).filter((l) => l.kind === 'cap');
    expect(caps.map((l) => l.label)).toEqual(['Anvil full · collect']);
    // Arcade only: Water at cap is an account line without history (R-PILL-2).
    expect(out.account?.blockerKeys).toEqual(['arcade.check.balls-cap@account']);
  });
});

describe('FR-9 Verdict composition', () => {
  it.each([
    ['unsafe', 'serving', 'fix', null],
    ['unknown', 'serving', 'unknown', 'cannot-tell'],
    ['not-covered', 'serving', 'unknown', 'not-covered'],
    ['safe', 'serving', 'ready', null],
    ['safe', 'not-implemented', 'ready', null],
    ['safe', 'not-covered', 'unknown', 'not-covered'],
    ['safe', 'exhausted', 'unknown', 'no-purpose'],
    ['safe', 'none', 'unknown', 'no-purpose'],
    ['safe', 'no-activity', 'unknown', 'no-purpose'],
    ['safe', 'cannot-tell', 'unknown', 'cannot-tell'],
  ] as const)('%s + %s -> %s (%s)', (safety, purpose, kind, reason) => {
    const v = composeVerdict(safety, purpose, ['k']);
    expect(v.kind).toBe(kind);
    expect(v.unknownReason).toBe(reason);
    expect(v.blockerKeys).toEqual(kind === 'fix' ? ['k'] : []);
  });
});

describe('TR-11 properties', () => {
  const RETURNS = [2, 4, 8, 12, 24, 48];
  it.each(['w2', 'w3'] as const)(
    'monotonicity on %s: a longer return only adds Findings; roles move only blocker -> Next Action',
    (w) => {
      const s = w === 'w2' ? W2() : W3();
      let prev: Map<string, { role: string; fixHolds: boolean; at: number | null }> | null = null;
      for (const h of RETURNS) {
        const r = evaluate(s, h);
        const all = [...r.characters.flatMap((c) => c.findings), ...r.account.findings];
        const now = new Map(all.map((f) => [f.key, { role: f.role, fixHolds: f.fixHolds, at: f.at }]));
        if (prev)
          for (const [key, p] of prev) {
            const n = now.get(key);
            // #70 A5: an anvil cap that is not full now leaves once collecting no longer lasts the stretch.
            const anvilLeft =
              key.startsWith('anvil.check.caps-before-return@') && p.at !== null && p.at > s.asOf;
            if (!n && anvilLeft) continue;
            expect(n, `${key} vanished at ${h} h`).toBeDefined();
            if (n && p.role !== n.role) {
              expect(p.role).toBe('blocker');
              expect(n.fixHolds).toBe(false);
              expect(n.at !== null && n.at <= s.asOf).toBe(false);
            }
          }
        prev = now;
      }
    },
  );

  it('fix-holds soundness: collecting the anvil now makes the Check pass at the return', () => {
    const s = W2();
    const r = evaluate(s, 2);
    for (const c of r.characters) {
      const f = c.findings.find((x) => x.entryId === 'anvil.check.caps-before-return');
      if (!f?.fixHolds) continue;
      const afk = s.characters.find((x) => x.index === c.index)?.afk;
      const anvil = (afk?.anvil ?? []).map((p) => ({ ...p, amount: 0, capAt: s.asOf + p.fromEmptyMs }));
      const after = charOf(evaluate(patchAfk(s, c.index, { anvil }), 2), c.index);
      expect(after.findings.map((x) => x.entryId)).not.toContain('anvil.check.caps-before-return');
    }
  });

  it('is deterministic: the same inputs give the same output (FR-31)', () => {
    expect(JSON.stringify(evaluate(W2()))).toBe(JSON.stringify(evaluate(W2())));
    expect(JSON.stringify(evaluate(W3(), 12))).toBe(JSON.stringify(evaluate(W3(), 12)));
  });

  it('never puts a character name in advice text', () => {
    for (const s of [W2(), W3()]) {
      const text = JSON.stringify(evaluate(s));
      for (const c of s.characters) expect(text).not.toContain(c.name);
    }
  });
});
