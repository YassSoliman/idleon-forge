// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-23 (Final rulings, #70 A3): the account-level respec suggestion, "Whetstone respec -> about N x
// Thread at T h". Points only move with an Anvil Reset Whetstone, sold at the W3 town shop (Frostbite
// Towndra) for 1.2M coins, one a day. The plan is the adapter's brute force over every integer split
// of Speed + Capacity + unspent with Toolbox getPlayerAnvil, Exp kept (`characters[].afk.anvilPlan`,
// materials objective only, A4), for the window of the player's Expected Return ("Back in about",
// 8 h by default).
// It fires when the W3 town is reached, coins cover a Whetstone, and at least one character would make
// `minGain` more items (default 25%) than its current split with its unspent points placed. One
// character finding per such character, best gain first, is the Goal's per-character detail.
import { anvilPlanWindow } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, characterSubject, isKnown, withAccount } from '../../src/helpers';
import { type CheckFinding, defineDetector } from '../../src/types';

export default defineDetector({
  id: 'anvil/respec',
  kind: 'check',
  system: 'anvil',
  params: z.strictObject({
    /** Judgment (#70 A3): the smallest gain worth a Whetstone trip. */
    minGain: z.number().positive().default(0.25),
    /** Game data: the Whetstone's price in coins (wiki Vendors, Frostbite Towndra). */
    price: z.number().positive().default(1_200_000),
    /** The world whose town shop sells it (Frostbite Towndra, W3). */
    shopWorld: z.int().min(1).default(3),
  }),
  slots: z
    .strictObject({
      count: z.number(),
      hours: z.number(),
      times: z.number(),
      morePct: z.number(),
      product: z.string(),
      speed: z.number(),
      capacity: z.number(),
      pct: z.number(),
      mixed: z.number(),
      mixedPct: z.number(),
    })
    .partial(),
  reads: ['characters[*].index', 'characters[*].afk', 'account.afk', 'account.currentWorld', 'diagnostics'],
  examples: {
    // W3-early: the town is reached and the account has the coins.
    fires: [{ fixture: 'scrubbed-w3' }],
    silent: [
      // W2-late: the Frostbite Towndra shop isn't reached yet.
      { fixture: 'scrubbed-w2' },
      // Not enough coins for a Whetstone.
      {
        fixture: 'scrubbed-w3',
        mutate: (s) => withAccount(s, { afk: s.account.afk ? { ...s.account.afk, coins: 1_000 } : null }),
      },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        mutate: (s) => withAccount(s, { afk: s.account.afk ? { ...s.account.afk, coins: null } : null }),
      },
    ],
  },
  run({ state, expectedReturnMs }, { minGain, price, shopWorld }): CheckFinding[] {
    const unknown: CheckFinding = {
      subject: accountSubject,
      slots: {},
      result: 'unknown',
      reason: 'field-missing',
    };
    const world = state.account.currentWorld;
    if (!isKnown(state, 'account.currentWorld') || world === null) return [unknown];
    if (world < shopWorld) return [];
    const coins = state.account.afk?.coins;
    if (!isKnown(state, 'account.afk') || coins == null) return [unknown];
    if (coins < price) return [];

    const rows: Array<{ index: number; speed: number; capacity: number; base: number; best: number }> = [];
    const products = new Set<string>();
    let hours = 0;
    for (const c of state.characters) {
      const plan = c.afk?.anvilPlan;
      const window = anvilPlanWindow(plan, expectedReturnMs);
      if (!plan || !window) continue;
      const base = window.spend?.output ?? window.current.output;
      const best = window.respec.output;
      if (!(base > 0) || best / base - 1 < minGain) continue;
      rows.push({ index: c.index, speed: window.respec.speed, capacity: window.respec.capacity, base, best });
      for (const p of plan.products) products.add(p.name);
      hours = window.windowMs / 3_600_000;
    }
    if (rows.length === 0) return [];
    rows.sort((a, b) => b.best / b.base - a.best / a.base || a.index - b.index);
    // Rounded so the slots stay stable: the text shows whole percent or whole multiples anyway.
    const ratio = (best: number, base: number) => Math.round((best / base) * 100) / 100;
    const times = ratio(
      rows.reduce((n, r) => n + r.best, 0),
      rows.reduce((n, r) => n + r.base, 0),
    );
    const morePct = Math.round((times - 1) * 100);
    const [product] = [...products];
    const mixed = products.size !== 1 || product === undefined;
    // "about 2x" reads well from 2x up; below that the text says "about 60% more" (one flag per variant).
    const asPct = times < 1.95;
    const flag = mixed ? (asPct ? 'mixedPct' : 'mixed') : asPct ? 'pct' : null;
    return [
      {
        subject: accountSubject,
        slots: {
          count: rows.length,
          hours,
          times,
          morePct,
          ...(mixed ? {} : { product }),
          ...(flag ? { [flag]: 1 } : {}),
        },
        result: 'fires',
        urgency: 'banked',
        doneKey: 'anvil-respec',
      },
      ...rows.map(
        (r): CheckFinding => ({
          subject: characterSubject(r.index),
          slots: {
            speed: r.speed,
            capacity: r.capacity,
            times: ratio(r.best, r.base),
            morePct: Math.round((ratio(r.best, r.base) - 1) * 100),
          },
          result: 'fires',
          urgency: 'banked',
          doneKey: `anvil-respec:${r.index}`,
        }),
      ),
    ];
  },
});
