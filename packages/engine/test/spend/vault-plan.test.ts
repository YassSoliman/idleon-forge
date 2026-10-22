// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-58, the Vault plan: on the public, scrubbed and (locally) private saves, every pocket pays only
// what it holds, every step's coins are Toolbox's per-level prices in plan order, the levels run on from
// row to row without a gap, and the list's targets come before the cheapest levels. Rules only, never a
// private save's balances.
import { existsSync, readdirSync } from 'node:fs';
import type { AccountState } from '@idleon-forge/account-state';
import { describe, expect, it } from 'vitest';
import { buildVaultPlan, resolveSpendList, type VaultPlan } from '../../src/spend';
import { PRIVATE } from '../metapath/helpers';
import { PUBLIC_FILES, scrubbedFile, spendKb, spendStateOf, stageOf } from './helpers';

const kb = spendKb();
const gate = { bullseye: true, defence: true };
const planOf = (s: AccountState): VaultPlan | null => {
  const items = resolveSpendList(kb, stageOf(s)) ?? [];
  return buildVaultPlan({ state: s, items, gate });
};
const privateSaves = existsSync(PRIVATE)
  ? readdirSync(PRIVATE)
      .filter((f) => f.endsWith('.raw.json'))
      .map((f) => PRIVATE + f)
  : [];
const saves = [scrubbedFile('scrubbed-w2'), scrubbedFile('scrubbed-w3'), ...PUBLIC_FILES, ...privateSaves];
const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(1, Math.abs(b));

describe.each(saves.map((f) => [f.split('/').pop() as string, f]))('%s', (_label, file) => {
  const state = spendStateOf(file);
  let plan: VaultPlan | null = null;
  try {
    plan = planOf(state);
  } catch (e) {
    if (!(e instanceof Error && e.message === 'fixture has no Stage')) throw e;
  }
  const vault = state.account.spend?.vault;

  it('pays every step from one pocket, never more than it holds', () => {
    if (!plan) return;
    plan.pockets.forEach((p, i) => {
      if (i > 0) expect(p.fromBank).toBe(0);
      expect(p.left).toBeGreaterThanOrEqual(-1e-6 * p.coins);
      expect(rel(p.spent, p.coins - p.left + p.fromBank)).toBeLessThan(1e-9);
      const paid = plan?.steps.filter((s) => s.payer === p.holder).reduce((t, s) => t + s.coins, 0) ?? 0;
      expect(rel(paid, p.spent)).toBeLessThan(1e-9);
      expect(plan?.steps.filter((s) => s.payer === p.holder).length).toBe(p.steps);
    });
    expect(plan.bank.left).toBeGreaterThanOrEqual(-1e-6 * plan.bank.coins);
    const wallet = (i: number) => state.account.spend?.wallets.find((w) => w.holder === i)?.coins;
    for (const p of plan.pockets) expect(p.coins).toBe(wallet(p.holder));
  });

  it("prices each step at Toolbox's per-level costs, in plan order, with no gap between steps", () => {
    if (!plan || !vault) return;
    const at = new Map(vault.rows.map((r) => [r.index, r.level]));
    let md = 0; // Major Discount levels bought so far
    for (const s of plan.steps) {
      const row = vault.rows.find((r) => r.index === s.index);
      if (!row) throw new Error(`no row ${s.index}`);
      expect(s.fromLevel).toBe(at.get(s.index));
      expect(s.toLevel).toBeGreaterThan(s.fromLevel);
      expect(s.toLevel).toBeLessThanOrEqual(row.maxLevel);
      const factor =
        s.index < 33 && s.index !== 13 && vault.discount ? (vault.discount.factors[md] as number) : 1;
      let sum = 0;
      for (let l = s.fromLevel; l < s.toLevel; l++) sum += (row.costs[l - row.level] as number) * factor;
      expect(rel(s.coins, sum)).toBeLessThan(1e-9);
      if (s.index === 13) md += s.toLevel - s.fromLevel;
      at.set(s.index, s.toLevel);
    }
    const bought = plan.steps.reduce((t, s) => t + s.toLevel - s.fromLevel, 0);
    expect(plan.levels.bought).toBe(bought);
    expect(plan.levels.after).toBe(vault.totalLevels + bought);
    expect(
      rel(
        plan.spent,
        plan.steps.reduce((t, s) => t + s.coins, 0),
      ),
    ).toBeLessThan(1e-9);
  });

  it("buys a pocket's list targets before its cheapest levels, and Major Discount only by the list", () => {
    if (!plan) return;
    for (const p of plan.pockets) {
      const mine = plan.steps.filter((s) => s.payer === p.holder);
      const firstCheap = mine.findIndex((s) => s.phase === 'cheapest');
      // Only a row opened by this pocket's new levels can bring the plan back to the list.
      mine.slice(firstCheap < 0 ? mine.length : firstCheap).forEach((s) => {
        if (s.phase === 'list') expect(s.opensAt).not.toBeNull();
      });
      for (const s of mine) if (s.index === 13) expect(s.phase).toBe('list');
      for (const s of mine) if (s.phase === 'list') expect(s.toLevel).toBeLessThanOrEqual(s.target as number);
    }
  });

  it('lists every row exactly once as bought, waiting or maxed, and opens rows by the count rule', () => {
    if (!plan || !vault) return;
    const seen = new Set([
      ...plan.steps.map((s) => s.index),
      ...plan.waiting.map((w) => w.index),
      ...plan.maxed.map((m) => m.index),
    ]);
    expect(seen.size).toBe(vault.rows.length);
    for (const w of plan.waiting) expect(plan.steps.some((s) => s.index === w.index)).toBe(false);
    for (const o of plan.opened) expect(o.at).toBeLessThanOrEqual(plan.levels.after);
    if (plan.nextUnlock) expect(plan.nextUnlock.at).toBeGreaterThan(plan.levels.after);
    expect(planOf(state)).toEqual(plan);
  });

  it('never carries a character name', () => {
    const text = JSON.stringify(plan);
    for (const c of state.characters) if (c.name.length > 3) expect(text).not.toContain(`"${c.name}"`);
  });
});

describe('a rich account (scrubbed W3 with 1e13 coins on one character)', () => {
  const state = spendStateOf(scrubbedFile('scrubbed-w3'), (d) => {
    d.Money_0 = 1e13;
  });
  const plan = planOf(state) as VaultPlan;

  it('keeps going past the list targets with the cheapest levels and opens new rows on the way', () => {
    expect(plan.steps.some((s) => s.phase === 'cheapest')).toBe(true);
    expect(plan.opened.length).toBeGreaterThan(0);
    const first = plan.pockets[0];
    // The pocket stops only when one more level of any open row (but Major Discount) costs more than it holds.
    expect(first?.left).toBeLessThan(1e13 * 0.01);
  });

  it('caps an open-ended list item at its share of the pocket (M7 D6)', () => {
    const items = resolveSpendList(kb, stageOf(state)) ?? [];
    for (const s of plan.steps.filter((x) => x.phase === 'list')) {
      const item = items.find((i) => i.ref === `upgrade-vault.acquisition.row-${s.index}`);
      const pocket = plan.pockets.find((p) => p.holder === s.payer);
      if (item?.spend.openEnded && pocket)
        expect(s.coins).toBeLessThanOrEqual((item.spend.shareCap ?? 1 / 3) * pocket.coins + 1);
    }
  });
});
