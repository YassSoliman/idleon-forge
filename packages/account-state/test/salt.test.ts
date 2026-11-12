// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-21b contract tests: `account.salts[].held` / `.inRefinery` against the raw save (US-83), and
// `account.saltLick` with its game-client liquid-rate term (X4).
import { describe, expect, it } from 'vitest';
import { accountStateOf, editedSave, PUBLIC_DIR, readSave } from './helpers';

type Data = Record<string, unknown>;
const json = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v);

/** What the raw save holds of `rawName`: ChestOrder/ChestQuantity, and Refinery[1]/[2]. */
function rawHeld(data: Data, rawName: string) {
  const order = json(data.ChestOrder) as string[];
  const qty = json(data.ChestQuantity) as number[];
  const ref = json(data.Refinery) as unknown[][];
  const sum = (names: unknown[], amounts: unknown[]) =>
    names.reduce<number>((n, x, i) => (x === rawName ? n + Number(amounts[i] ?? 0) : n), 0);
  return { held: sum(order, qty), inRefinery: sum(ref[1] ?? [], ref[2] ?? []) };
}

describe.each(['first.json', 'fourth.json', 'highend.json'])('%s', (file) => {
  const save = readSave(PUBLIC_DIR, file) as { data: Data };
  const s = accountStateOf(save);
  it('each salt held equals the raw Storage Chest and Refinery storage', () => {
    expect(s.account.salts?.length).toBeGreaterThan(0);
    for (const salt of s.account.salts ?? []) {
      const raw = rawHeld(save.data, salt.rawName);
      expect({ salt: salt.rawName, held: salt.held, inRefinery: salt.inRefinery }).toEqual({
        salt: salt.rawName,
        ...raw,
      });
    }
  });
  it('reads 11 Salt Lick upgrades, the liquid rate from #6', () => {
    const lick = s.account.saltLick;
    expect(lick?.upgrades).toHaveLength(11);
    expect(lick?.liquidRatePct).toBe(lick?.upgrades[5]?.level);
    expect(lick?.upgrades.filter((u) => u.unlocked).length).toBe(Math.min(11, lick?.buildingLevel ?? 0));
  });
});

it('US-83 m:fourth-salts: 100 Redox Salts in the chest and 40 in Refinery storage read apart', () => {
  const save = editedSave(readSave(PUBLIC_DIR, 'fourth.json'), (d) => {
    const order = (json(d.ChestOrder) as string[]).map((x) => (x === 'Refinery1' ? 'Blank' : x));
    const qty = json(d.ChestQuantity) as number[];
    const at = order.indexOf('Blank');
    order[at] = 'Refinery1';
    qty[at] = 100;
    d.ChestOrder = order;
    d.ChestQuantity = qty;
    const ref = json(d.Refinery) as unknown[][];
    (ref[1] as string[])[0] = 'Refinery1';
    (ref[2] as number[])[0] = 40;
    d.Refinery = JSON.stringify(ref);
  });
  const redox = accountStateOf(save).account.salts?.find((x) => x.rawName === 'Refinery1');
  expect(redox).toMatchObject({ held: 100, inRefinery: 40 });
});

it('fourth.json: Salt Lick #6 at level 80 adds 80% liquid rate (game client LiquidHRrate)', () => {
  const lick = accountStateOf(readSave(PUBLIC_DIR, 'fourth.json')).account.saltLick;
  expect(lick?.buildingLevel).toBe(10);
  expect(lick?.upgrades[5]).toMatchObject({ salt: 'Refinery3', level: 80, maxLevel: 100, unlocked: true });
  expect(lick?.liquidRatePct).toBe(80);
});
