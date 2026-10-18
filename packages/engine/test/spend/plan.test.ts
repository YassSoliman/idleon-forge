// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 Spend Plan user stories (docs/specs/M7-spend-plan.md section 4) as tests, on the scrubbed W2-late
// and W3-early saves (committed, consented; their numbers match the private fixtures). Synthetic cases
// patch named raw fields and re-parse, or patch the projection where the spec allows it. Assertions use
// rules and rounded figures, never a balance.
import type { AccountState, SpendInputs, StampState } from '@idleon-forge/account-state';
import { render } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { runEngine } from '../../src/core/engine';
import { metaPathModule } from '../../src/metapath/module';
import {
  buildSpendPlan,
  createSpendModule,
  resolveSpendList,
  type SpendLine,
  type SpendPlan,
  stampRef,
} from '../../src/spend';
import { input } from '../core/helpers';
import { scrubbedFile, spendKb, spendStateOf, stageOf } from './helpers';

const kb = spendKb();
const GATE_OFF = { bullseye: false, defence: false };
const planOf = (s: AccountState, gate = GATE_OFF): SpendPlan => {
  const p = buildSpendPlan({ state: s, kb, stage: stageOf(s), gate });
  if (!p) throw new Error('no plan');
  return p;
};
const withSpend = (s: AccountState, patch: (sp: SpendInputs) => void): AccountState => {
  const copy = structuredClone(s);
  patch(copy.account.spend as SpendInputs);
  return copy;
};

const w2 = spendStateOf(scrubbedFile('scrubbed-w2'));
const w3 = spendStateOf(scrubbedFile('scrubbed-w3'));
const p2 = planOf(w2);
const p3 = planOf(w3);
const BARBARIAN = 0; // W2-late: Barbarian Lv 60
const W2_BOWMAN = 3; // W2-late: Bowman Lv 54, under 1K
const W3_BOWMAN = 2; // W3-early: Bowman Lv 60
const W3_SMALL = [1, 4]; // W3-early: Squire Lv 51 and Barbarian Lv 56, under 10K each
const stepsOf = (p: SpendPlan) => p.lines.flatMap((l) => l.steps.map((s) => ({ line: l, s })));
const vaultStep = (p: SpendPlan, row: number) =>
  stepsOf(p).find(({ s }) => s.ref === `upgrade-vault.acquisition.row-${row}`);
const buys = (p: SpendPlan) => p.lines.filter((l) => l.status === 'buy' || l.status === 'move-coins');
const near = (x: number | null | undefined, want: number, tol = 0.06) =>
  expect(Math.abs((x ?? 0) - want) / want).toBeLessThan(tol);

describe('M7 fixtures', () => {
  it('detects the Stages the spec names', () => {
    expect(p2.stage).toBe('W2-late');
    expect(p3.stage).toBe('W3-early');
  });
});

describe('US-1 See what to buy, in order', () => {
  it('AC-1.1 W3-early: Duplicate Entries first, ~100M, buy, with the redeem wording (RT-1)', () => {
    const first = p3.lines[0] as SpendLine;
    expect(first.entryId).toMatch(/#duplicate-entries$/);
    expect(first.status).toBe('buy');
    near(first.coins, 1e8, 0.01);
    expect(first.text).toMatch(
      /^Buy Duplicate Entries \(Vault\) on .+ before redeeming tickets: 100M coins$/,
    );
  });

  it('AC-1.2 W2-late: no Duplicate Entries (row 52 is locked)', () => {
    expect(vaultStep(p2, 52)).toBeUndefined();
  });

  it('AC-1.3 no line targets a Vault row at its max, whatever Toolbox costs it at', () => {
    for (const [s, p] of [
      [w2, p2],
      [w3, p3],
    ] as const) {
      const rows = s.account.spend?.vault?.rows ?? [];
      for (const { s: step } of stepsOf(p)) {
        if (step.sink !== 'vault' || step.fromLevel === null) continue;
        const row = rows.find((r) => `upgrade-vault.acquisition.row-${r.index}` === step.ref);
        expect(row && row.level < row.maxLevel).toBe(true);
        expect(step.toLevel ?? 0).toBeLessThanOrEqual(row?.maxLevel ?? 0);
      }
    }
  });

  it('AC-1.4 W2-late: Sleepy Time 18→20, Drops for Days 29→50, Bubble Money 7→10, paid by the Barbarian', () => {
    for (const [row, from, to, coins] of [
      [23, 18, 20, 3.0e6],
      [18, 29, 50, 3.9e6],
      [37, 7, 10, 8.3e6],
    ] as const) {
      const hit = vaultStep(p2, row);
      expect(hit?.s).toMatchObject({ fromLevel: from, toLevel: to });
      near(hit?.s.coins, coins);
      expect(hit?.line.payer).toBe(BARBARIAN);
    }
  });

  it('AC-1.5 the last line is unlock fuel, with an "about" estimate', () => {
    expect(p2.lines.at(-1)?.text).toMatch(/^56 more Vault levels to unlock Active Murdering: about /);
    expect(p3.lines.at(-1)?.text).toMatch(/^33 more Vault levels to unlock Special Talent: about /);
    expect(p2.unlockFuel).toMatchObject({ levels: 56, unlocks: 'Active Murdering' });
    expect(p3.unlockFuel?.coinsAbout).toBeGreaterThan(0);
  });

  it('AC-1.6 at most 5 visible lines', () => {
    for (const p of [p2, p3]) {
      expect(p.visibleCount).toBeLessThanOrEqual(5);
      expect(p.lines.length).toBeGreaterThan(p.visibleCount);
    }
  });

  it('AC-1.7 a failed Vault section: no Vault line, no unlock fuel, the other sinks still listed', () => {
    for (const s of [w2, w3]) {
      const failed = withSpend(s, (sp) => {
        sp.vault = null;
      });
      const p = planOf(failed);
      expect(p.unavailable).toContain('vault');
      expect(stepsOf(p).some(({ s: x }) => x.sink === 'vault')).toBe(false);
      expect(p.unlockFuel).toBeNull();
      expect(stepsOf(p).some(({ s: x }) => x.sink === 'stamp')).toBe(true);
    }
  });
});

describe('US-2 Know which character to buy on', () => {
  it('AC-2.1 W2-late: every buy above 1M is the Barbarian; the Bowman pays nothing', () => {
    for (const l of buys(p2)) if ((l.coins ?? 0) > 1e6 && l.payer !== null) expect(l.payer).toBe(BARBARIAN);
    expect(p2.lines.some((l) => l.payer === W2_BOWMAN)).toBe(false);
    expect(p2.perCharacter.some((x) => x.characterIndex === W2_BOWMAN)).toBe(false);
  });

  it('AC-2.2 the plan never spends more than a wallet holds (FR-5); tiny W3 wallets pay no priced line', () => {
    for (const p of [p2, p3])
      for (const w of p.wallets) expect(w.planned).toBeLessThanOrEqual(w.coins + 1e-6);
    // The one exception is each character's own Anvil coin point, which only its own coins pay (AC-8.4).
    for (const l of p3.lines) if (l.payer !== null) expect(W3_SMALL).not.toContain(l.payer);
  });

  it('AC-2.3 W3-early: Duplicate Entries goes to the smallest wallet that covers it (the Bowman)', () => {
    expect(p3.lines[0]?.payer).toBe(W3_BOWMAN);
  });

  it('AC-2.4 per-character totals, most first', () => {
    for (const p of [p2, p3])
      for (let i = 1; i < p.perCharacter.length; i++)
        expect(p.perCharacter[i - 1]?.coins ?? 0).toBeGreaterThanOrEqual(p.perCharacter[i]?.coins ?? 0);
    expect(p2.perCharacter[0]?.characterIndex).toBe(BARBARIAN);
  });

  it('AC-2.5 W2-late: the bank only tops up move-coins lines, never a buy', () => {
    const bank = p2.wallets.find((w) => w.holder === 'bank');
    const moved = p2.lines.filter((l) => l.status === 'move-coins');
    expect(moved.length).toBeGreaterThan(0);
    for (const l of moved) {
      expect(l.payer).toBe(BARBARIAN);
      expect(l.transfer?.fromBank).toBeGreaterThan(0);
    }
    expect(bank?.planned).toBeCloseTo(
      moved.reduce((t, l) => t + (l.transfer?.fromBank ?? 0), 0),
      0,
    );
    for (const l of p2.lines.filter((x) => x.status === 'buy')) expect(l.transfer).toBeUndefined();
  });
});

describe('US-3 Raise stamp caps, then buy the levels', () => {
  const coinStamps = (p: SpendPlan) =>
    stepsOf(p)
      .filter(({ s }) => s.sink === 'stamp' && !s.material)
      .map(({ s }) => s.ref);
  const raiseSteps = (p: SpendPlan) => stepsOf(p).filter(({ s }) => s.sink === 'stamp' && s.material);

  it('AC-3.1 W2-late: the only coin-only stamp line is the Bullseye Stamp, Lv 0 of 5', () => {
    expect(coinStamps(p2)).toEqual(['stamps.acquisition.stamp-a17']);
    expect(stepsOf(p2).find(({ s }) => s.ref === 'stamps.acquisition.stamp-a17')?.s).toMatchObject({
      fromLevel: 0,
      toLevel: 5,
    });
  });

  it('AC-3.2 W2-late: one grouped line raises Shield and Hatchet (~1.3M); Target is not ready', () => {
    const raises = raiseSteps(p2);
    expect(raises.map(({ s }) => s.ref).sort()).toEqual([
      'stamps.acquisition.stamp-a6',
      'stamps.acquisition.stamp-b2',
    ]);
    const line = raises[0]?.line as SpendLine;
    expect(new Set(raises.map(({ line: l }) => l.id)).size).toBe(1);
    expect(line.text).toMatch(/^Raise and level 2 capped stamps on /);
    expect(line.detail).toMatch(/Shield/);
    expect(line.detail).toMatch(/Hatchet/);
    near(line.coins, 1.31e6, 0.02);
    expect(p2.handoffs).toContainEqual(
      expect.objectContaining({ kind: 'stamp-material', ref: 'stamps.acquisition.stamp-a5' }),
    );
    // Never the gilded price (457 Thread) while the account holds no Gilded Stamp.
    const target = w2.account.spend?.stamps?.find((s) => s.id === 'StampA5');
    expect(target?.raise?.atDiscount.cost).not.toBe(457);
    expect(target?.raise?.atDiscount.cost).toBeGreaterThan(9000);
  });

  it('AC-3.3 W3-early: 9 ready raises; the equipment ones and Vendor Stamp are not lines', () => {
    expect(raiseSteps(p3)).toHaveLength(9);
    const refs = raiseSteps(p3).map(({ s }) => s.ref);
    for (const id of ['stamp-b5', 'stamp-b10', 'stamp-c11']) {
      expect(refs).not.toContain(`stamps.acquisition.${id}`);
      expect(p3.handoffs.map((h) => h.ref)).toContain(`stamps.acquisition.${id}`);
    }
    expect(p3.notCovered).toContain('stamps.raise-material');
  });

  it('AC-3.4 W3-early: material doers are the line wallet or the Wizard Lv 73 / Squire Lv 85', () => {
    for (const { line, s } of raiseSteps(p3)) expect([line.payer, 0, 3]).toContain(s.material?.doer);
  });
});

describe("US-4 Don't waste the Hydrogen discount (synthetic: Hydrogen Lv 5, raw OLA[134])", () => {
  const hydro = (days: number) =>
    spendStateOf(scrubbedFile('scrubbed-w3'), (d) => {
      const atoms = (typeof d.Atoms === 'string' ? JSON.parse(d.Atoms) : d.Atoms) as number[];
      atoms[0] = 5;
      d.Atoms = atoms;
      const ola = (typeof d.OptLacc === 'string' ? JSON.parse(d.OptLacc) : d.OptLacc) as unknown[];
      ola[134] = days;
      d.OptLacc = ola;
    });
  const h8 = hydro(8);
  /** One at-cap stamp that is owned but too big to carry, needing `minReduction`. */
  const waiting = (s: AccountState, minReduction: number) =>
    withSpend(s, (sp) => {
      const st = sp.stamps?.find((x) => x.id === 'StampA9') as StampState;
      if (!st.raise) throw new Error('fixture changed');
      st.raise.ownedInStorage = st.raise.atDiscount.cost + 1;
      st.raise.atDiscount = { ...st.raise.atDiscount, hasMaterials: true, carryOk: false };
      st.raise.minReduction = minReduction;
    });

  it('the synthetic save re-parses to a 40% discount', () => {
    expect(h8.account.spend?.hydrogen).toMatchObject({ level: 5, dailyRate: 5, discountPct: 40 });
  });

  it('AC-4.1 all ready raises are one batch line; the first at 40%, the rest at 0%', () => {
    const p = planOf(h8);
    const raiseLines = p.lines.filter((l) => l.steps.some((s) => s.material));
    expect(raiseLines).toHaveLength(1);
    const steps = raiseLines[0]?.steps ?? [];
    expect(steps.length).toBeGreaterThan(1);
    const stamps = h8.account.spend?.stamps ?? [];
    const priceOf = (ref: string) => stamps.find((s) => stampRef(s.id) === ref)?.raise;
    const [first, ...rest] = steps;
    expect(first?.material?.amount).toBe(priceOf(first?.ref ?? '')?.atDiscount.cost);
    for (const s of rest) expect(s.material?.amount).toBe(priceOf(s.ref)?.atZero?.cost);
  });

  it('AC-4.2 a stamp waiting to fit within 7 days holds the batch; coin levels stay buyable', () => {
    const p = planOf(waiting(h8, 55));
    const held = p.lines.find((l) => l.status === 'hold');
    expect(held?.hold).toEqual({ discountPct: 40, neededPct: 55, days: 3 });
    const name = (h8.account.spend?.stamps?.find((x) => x.id === 'StampA9')?.name ?? '').replace(/_/g, ' ');
    expect(held?.text).toBe('Hold stamp cap raises for the Hydrogen discount (40% of 55%)');
    expect(held?.why).toContain(`${name} fits in an inventory once the discount reaches 55%, in 3d 0h`);
    expect(p.lines.filter((l) => l.steps.some((s) => s.material) && l.status !== 'hold')).toHaveLength(0);
  });

  it('AC-4.3 at the 90% cap the batch is bought, no hold', () => {
    const p = planOf(hydro(18));
    expect(p.lines.some((l) => l.status === 'hold')).toBe(false);
    expect(p.lines.some((l) => l.steps.some((s) => s.material) && l.status === 'buy')).toBe(true);
  });

  it('AC-4.4 the real fixtures (Hydrogen Lv 0) never hold', () => {
    for (const p of [p2, p3]) expect(p.lines.some((l) => l.status === 'hold')).toBe(false);
  });

  it('AC-4.5 a stamp 8 days away (80% needed) does not hold the batch (K = 7)', () => {
    const p = planOf(waiting(h8, 80));
    expect(p.lines.some((l) => l.status === 'hold')).toBe(false);
  });
});

describe("US-5 Don't make an irreversible spending mistake", () => {
  it('AC-5.1 the why quotes the NPC-banked tickets, never "unredeemed"', () => {
    const why = p3.lines[0]?.why ?? '';
    expect(why).toMatch(/^Doubles every Colosseum ticket you redeem; 4 are waiting at the NPCs/);
    expect(why).not.toMatch(/unredeemed/i);
    expect(p3.lines[0]?.sources.some((s) => s.url.startsWith('https://idleon.wiki/'))).toBe(true);
  });

  const short = (closest: number) =>
    withSpend(w3, (sp) => {
      for (const w of sp.wallets) w.coins = w.holder === W3_BOWMAN ? closest : w.holder === 'bank' ? 0 : 1e6;
    });

  it('AC-5.2 60M closest: save-for 40M short, and nothing below spends that wallet', () => {
    const p = planOf(short(60e6));
    const de = p.lines[0] as SpendLine;
    expect(de.status).toBe('save-for');
    expect(de.shortfall).toEqual({ coins: 40e6, closest: W3_BOWMAN });
    expect(p.lines.slice(1).some((l) => l.payer === W3_BOWMAN)).toBe(false);
  });

  it('AC-5.3 30M closest: save-for 70M short, and the lines below may spend that wallet', () => {
    const p = planOf(short(30e6));
    expect(p.lines[0]?.shortfall).toEqual({ coins: 70e6, closest: W3_BOWMAN });
    expect(p.lines.slice(1).some((l) => l.payer === W3_BOWMAN)).toBe(true);
  });
});

describe('US-6 Trust each line', () => {
  it('AC-6.1 every line cites a player-facing Source (#74) and keeps Toolbox provenance', () => {
    for (const p of [p2, p3])
      for (const l of p.lines) {
        expect(l.sources.some((s) => s.tier >= 2 && !s.url.startsWith('https://github.com/'))).toBe(true);
        expect(l.sources[0]?.tier).toBeGreaterThan(1);
        for (const s of l.sources) expect(s.gameVersion).toBe('2.3.540');
        if (l.steps.some((s) => s.sink === 'vault') && !l.entryId.endsWith('#duplicate-entries'))
          expect(['L', 'M']).toContain(l.confidence);
      }
  });

  it('AC-6.2 no Contested line is first', () => {
    for (const p of [p2, p3]) expect(p.lines[0]?.contested).toBe(false);
  });

  it('AC-6.3 Report this text: costs at 2 s.f., no shortfall, transfer or names', () => {
    for (const s of [w2, w3]) {
      const names = s.characters.map((c) => c.name).filter((n) => n.length > 2);
      for (const l of planOf(s).lines) {
        for (const n of names) expect(l.reportText).not.toContain(n);
        expect(l.reportText).not.toMatch(/short|withdraw|storage on/);
      }
    }
    const fuel = p2.lines.at(-1) as SpendLine;
    expect(fuel.reportText).toContain(render('{c:coins}', { c: Number((fuel.coins ?? 0).toPrecision(2)) }));
  });
});

describe('US-7 The plan keeps up with what I bought', () => {
  it('AC-7.1 Sleepy Time bought and ~3.0M spent: the line is gone and no wallet is overdrawn', () => {
    const s = spendStateOf(scrubbedFile('scrubbed-w2'), (d) => {
      const v = (typeof d.UpgVault === 'string' ? JSON.parse(d.UpgVault) : d.UpgVault) as number[];
      v[23] = 20;
      d.UpgVault = v;
      d.Money_0 = Number(d.Money_0) - 3.0e6;
    });
    const p = planOf(s);
    expect(vaultStep(p, 23)).toBeUndefined();
    for (const w of p.wallets) expect(w.planned).toBeLessThanOrEqual(w.coins + 1e-6);
  });

  it('AC-7.2 Duplicate Entries at Lv 1: no longer first, and its ~100M on the Bowman is free', () => {
    const s = spendStateOf(scrubbedFile('scrubbed-w3'), (d) => {
      const v = (typeof d.UpgVault === 'string' ? JSON.parse(d.UpgVault) : d.UpgVault) as number[];
      v[52] = 1;
      d.UpgVault = v;
    });
    const p = planOf(s);
    expect(p.lines[0]?.entryId).not.toMatch(/#duplicate-entries$/);
    expect(vaultStep(p, 52)).toBeUndefined();
    const bowman = p.wallets.find((w) => w.holder === W3_BOWMAN);
    expect((bowman?.coins ?? 0) - (bowman?.planned ?? 0)).toBeGreaterThan(1e8);
  });
});

describe('US-8 Know what is not priced or not covered', () => {
  it('AC-8.1 W2-late: Kachow statue Gold is unpriced, never deducted, below priced lines', () => {
    const kachow = p2.lines.find((l) => l.steps[0]?.ref === 'statues.acquisition.statue-5');
    expect(kachow).toMatchObject({ status: 'unpriced', coins: null, payer: null });
    expect(kachow?.text).toContain('Kachow');
    const at = p2.lines.filter((l) => l.position === kachow?.position);
    expect(at.at(-1)?.status).toBe('unpriced');
  });

  it('AC-8.2 locked liquids (level -1) are never lines', () => {
    for (const s of [w2, w3]) {
      const locked = (s.account.spend?.p2w ?? []).filter((u) => u.level < 0).map((u) => u.key);
      const refs = stepsOf(planOf(s)).map(({ s: x }) => x.ref);
      for (const k of locked) expect(refs.some((r) => r.includes(k.split('.')[1] ?? '?'))).toBe(false);
    }
    expect((w2.account.spend?.p2w ?? []).filter((u) => u.level < 0)).toHaveLength(6);
  });

  it('AC-8.3 Forge upgrades only under Not covered yet', () => {
    for (const p of [p2, p3]) expect(p.notCovered).toContain('forge.upgrades');
  });

  it('AC-8.4 Anvil coin points are paid by their own character; vials are unpriced', () => {
    for (const p of [p2, p3]) {
      const anvil = p.lines.filter((l) => l.steps.some((s) => s.sink === 'anvil'));
      for (const l of anvil) {
        expect(l.payer).toBeNull();
        for (const s of l.steps) expect(s.payer).toBeTypeOf('number');
      }
      for (const l of p.lines.filter((x) => x.steps.some((s) => s.ref.includes('vials-'))))
        expect(l.status).toBe('unpriced');
    }
  });
});

describe('US-9 Empty and edge states', () => {
  it('AC-9.1 every wallet empty: "nothing affordable", the cheapest line and its shortfall', () => {
    const broke = withSpend(w2, (sp) => {
      for (const w of sp.wallets) w.coins = 0;
    });
    const p = planOf(broke);
    expect(buys(p)).toHaveLength(0);
    expect(p.empty?.reason).toBe('nothing-affordable');
    expect(p.empty?.cheapest?.shortfall?.coins).toBeGreaterThan(0);
  });

  it('AC-9.2 below class level 14: only Vault lines', () => {
    const young = withSpend(w2, (sp) => {
      sp.highestClassLevel = 13;
    });
    const sinks = new Set(stepsOf(planOf(young)).map(({ s }) => s.sink));
    expect(
      [...sinks].filter((x) => x !== 'vault' && x !== 'anvil' && x !== 'statue-gold' && x !== 'p2w'),
    ).toEqual([]);
    expect(sinks.has('stamp')).toBe(false);
    expect(sinks.has('bribe')).toBe(false);
  });

  it('AC-9.3 without a projection (a failed or empty parse) there is no plan', () => {
    const none = structuredClone(w2);
    none.account.spend = null;
    expect(buildSpendPlan({ state: none, kb, stage: 'W2-late', gate: GATE_OFF })).toBeNull();
  });
});

describe('US-10 and US-11', () => {
  it('AC-10.1 the Barbarian row carries the Spend chip; the Bowman has none', () => {
    const m7 = createSpendModule({ kb });
    const r = runEngine(input(w2, { now: w2.asOf }), [metaPathModule, m7]);
    const per = r.account.spendPlan?.perCharacter.find((x) => x.characterIndex === BARBARIAN);
    expect(r.characters.find((c) => c.index === BARBARIAN)?.spendChip).toEqual({
      lines: per?.lines,
      coins: per?.coins,
    });
    expect(r.characters.find((c) => c.index === W2_BOWMAN)?.spendChip).toBeNull();
  });

  it('AC-11.1 Major Discount takes at most 1/3 of its wallet and stops at the checkpoint; capped rows still buy', () => {
    const md = vaultStep(p2, 13);
    const wallet = w2.account.spend?.wallets.find((w) => w.holder === md?.line.payer);
    expect(md?.s.coins ?? 0).toBeLessThanOrEqual((wallet?.coins ?? 0) / 3);
    expect(md?.s.toLevel ?? 0).toBeLessThanOrEqual(50);
    for (const row of [23, 18, 37]) expect(vaultStep(p2, row)?.line.status).toBe('buy');
  });
});

describe('the Knowledge Base side', () => {
  it('every Stage resolves a list whose item templates render with the engine slots', () => {
    const slots = { name: 'X', payer: 'Y', coins: 1, from: 0, to: 1, levels: 1, count: 2, unlocks: 'Z' };
    for (const stage of ['W1-early', 'W1-late', 'W2-early', 'W2-late', 'W3-mid', 'W4-entry'] as const) {
      const items = resolveSpendList(kb, stage) ?? [];
      expect(items.length).toBeGreaterThan(5);
      for (const i of items) {
        expect(() => render(i.text, slots)).not.toThrow();
        expect(() => render(i.why, slots)).not.toThrow();
        expect(i.sources.some((s) => s.tier >= 2)).toBe(true);
      }
    }
  });

  it('is deterministic', () => {
    expect(planOf(w3)).toEqual(p3);
  });

  it('carries earlier bands forward at their frame position', () => {
    const items = resolveSpendList(kb, 'W3-early') ?? [];
    const carried = items.filter((i) => i.carried);
    expect(carried.some((i) => i.slug === 'every-stamp-level')).toBe(true);
    for (const i of carried) expect(i.position).toBeGreaterThanOrEqual(1);
  });
});
