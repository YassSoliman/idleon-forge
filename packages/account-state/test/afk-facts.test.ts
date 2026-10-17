// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 TR-2: the AFK facts, built from Toolbox's own functions. The scrubbed W2-late save (CI) carries
// the spec's acceptance numbers: a Barbarian Lv 60 at 78% survivability (53% with no food) whose anvil
// is full, Water at cap and an Arcade claimed 96 h ago against a 48 h cap.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import {
  type AccountState,
  AFK_HORIZON_MS,
  ANVIL_EXHAUSTIVE_MAX,
  ANVIL_PLAN_WINDOWS_MS,
  anvilPlanWindow,
  bestAnvilSplit,
  isKnown,
  toAccountState,
} from '../src';
import { listJson, PUBLIC_DIR, readSave } from './helpers';

const SCRUBBED = fileURLToPath(new URL('../../../fixtures/scrubbed/', import.meta.url));
const scrubbed = (id: string) => {
  const raw = JSON.parse(readFileSync(`${SCRUBBED}${id}.json`, 'utf8'));
  const meta = JSON.parse(readFileSync(`${SCRUBBED}${id}.meta.json`, 'utf8')) as { now: string };
  return { raw, now: Date.parse(meta.now) };
};
const toolbox = { calls: toolboxCalls, withFrozenClock };

function stateOf(raw: unknown, now: number, withCalls = true): AccountState {
  const envelope = normalizeEnvelope(raw);
  return toAccountState(parseSave(envelope, { now }), envelope, withCalls ? { toolbox } : {});
}

describe('AFK facts on the scrubbed W2-late save', () => {
  const { raw, now } = scrubbed('scrubbed-w2');
  const state = stateOf(raw, now);
  const barbarian = state.characters.find((c) => c.class === 'Barbarian' && c.level === 60);

  it('reads the Barbarian Lv 60 survivability with and without food, and the foods that fix it', () => {
    const f = barbarian?.afk?.fighting;
    expect(f?.survivability).toBe(78);
    expect(f?.survivabilityNoFood).toBe(53);
    expect(f?.fixingFoods.length).toBe(4);
    expect(Math.max(...(f?.fixingFoods ?? []).map((x) => x.amount))).toBe(105);
    expect(barbarian?.afk?.food.some((x) => x.kind === 'health')).toBe(false);
    expect(barbarian?.afk?.blankFoodSlot).toBe(true);
  });

  it('reads heal per bite, max HP and the food carry cap (R-FOOD-1, R-FOOD-2)', () => {
    const f = barbarian?.afk?.fighting;
    expect(f?.maxHp).toBeCloseTo(722.5, 0);
    expect(f?.foodCap).toBe(274);
    const pie = f?.fixingFoods.find((x) => x.item === 'FoodHealth7');
    expect(pie?.healPerBite).toBe(500);
    const wizard = state.characters.find((c) => c.class === 'Wizard');
    expect(wizard?.afk?.food.find((x) => x.kind === 'health')?.healPerBite).toBe(500);
    expect(wizard?.afk?.food.find((x) => x.kind === 'boost')?.healPerBite).toBeNull();
  });

  it('reads the full anvil product and how long it takes to refill from empty', () => {
    const [p] = barbarian?.afk?.anvil ?? [];
    expect(p?.amount).toBe(p?.capacity);
    expect(p?.capAt).toBeLessThanOrEqual(state.asOf);
    expect((p?.fromEmptyMs ?? 0) / 3_600_000).toBeCloseTo(2.76, 1);
  });

  it('reads the Arcade claim, Water at cap and storage room', () => {
    const afk = state.account.afk;
    expect(afk?.arcade?.maxClaimMs).toBe(48 * 3_600_000);
    expect((state.asOf - (afk?.arcade?.lastClaimAt ?? 0)) / 3_600_000).toBeCloseTo(96.3, 0);
    expect(afk?.liquids?.[0]).toEqual({ index: 0, current: 32, max: 32 });
    expect(afk?.salts).toEqual([]);
    expect(afk?.projectedAt).toBe(state.asOf);
  });

  it('marks every character as assigned to a cauldron', () => {
    expect(state.characters.map((c) => c.afk?.cauldronAssigned)).toEqual([true, true, true, true, true]);
  });

  it('is null, never a default, without the Toolbox calls', () => {
    const bare = stateOf(raw, now, false);
    expect(bare.account.afk).toBeNull();
    expect(bare.characters.every((c) => c.afk === null)).toBe(true);
  });
});

describe('the anvil point plan (#70) on the scrubbed W2-late save', () => {
  const { raw, now } = scrubbed('scrubbed-w2');
  const state = stateOf(raw, now);
  const plans = state.characters.map((c) => c.afk?.anvilPlan);
  const at = (h: number) => plans.map((p) => anvilPlanWindow(p, h * 3_600_000));

  it('recomputes unspent points: 0 everywhere; Exp untouched; one plan per "Back in about" chip', () => {
    expect(plans.map((p) => p?.unspent)).toEqual([0, 0, 0, 0, 0]);
    expect(plans.every((p) => p?.xpPoints === 0)).toBe(true);
    expect(
      plans.every((p) => p?.windows.map((w) => w.windowMs).join() === ANVIL_PLAN_WINDOWS_MS.join()),
    ).toBe(true);
    expect(at(8).every((w) => w?.spend === null)).toBe(true);
  });

  it('finds the 8 h Whetstone split per character (research: Barbarian 62/19 -> 25/56, about 1.9x Thread)', () => {
    const splits = plans.map((p, i) => [
      p?.speedPoints,
      p?.capPoints,
      at(8)[i]?.respec.speed,
      at(8)[i]?.respec.capacity,
    ]);
    expect(splits).toEqual([
      [62, 19, 25, 56],
      [76, 4, 25, 55],
      [83, 11, 30, 64],
      [88, 15, 37, 66],
      [39, 50, 28, 61],
    ]);
    const gains = at(8).map(
      (w) => Math.round(((w?.respec.output ?? 0) / (w?.current.output ?? 1)) * 100) / 100,
    );
    expect(gains).toEqual([1.94, 3.12, 2.71, 2.46, 1.16]);
    expect(plans[0]?.products).toEqual([{ item: 'CraftMat1', name: 'Thread' }]);
  });

  it('follows the Expected Return: 2 h puts the Barbarian at 70 Speed / 11 Capacity; 24 h all Capacity', () => {
    expect([at(2)[0]?.respec.speed, at(2)[0]?.respec.capacity]).toEqual([70, 11]);
    expect([at(24)[0]?.respec.speed, at(24)[0]?.respec.capacity]).toEqual([0, 81]);
    // A learned 10 h is between two chips: the shorter one; 9 h is nearest 8 h.
    expect(anvilPlanWindow(plans[0], 10 * 3_600_000)?.windowMs).toBe(8 * 3_600_000);
    expect(anvilPlanWindow(plans[0], 9 * 3_600_000)?.windowMs).toBe(8 * 3_600_000);
    expect(anvilPlanWindow(null, 8 * 3_600_000)).toBeNull();
  });

  it('reads the account coins for the Whetstone gate', () => {
    expect(state.account.afk?.coins).toBeGreaterThan(1_200_000);
  });
});

describe('bestAnvilSplit', () => {
  // A concave window output: one product, speed rises 30 per point, capacity 50 per point, cap rounding.
  const score = (rate: number) => (s: number, k: number) =>
    Math.min(((100 + 2 * s) * rate) / 100, Math.round(1000 * (2 + 0.1 * k)));
  const scan = (budget: number, f: (s: number, k: number) => number) => {
    let best = { speed: -1, output: -1 };
    for (let x = 0; x <= budget; x++) {
      const out = f(x, budget - x);
      if (out >= best.output - 1e-9 * Math.max(1, best.output)) best = { speed: x, output: out };
    }
    return best;
  };

  it('scores every split up to the exhaustive limit, ties to Speed', () => {
    expect(bestAnvilSplit({ speed: 0, capacity: 0 }, 10, () => 5)).toMatchObject({ speed: 10, capacity: 0 });
    expect(bestAnvilSplit({ speed: 3, capacity: 4 }, 2, (s) => s)).toMatchObject({ speed: 5, capacity: 4 });
  });

  it.each([500, 1300, 2700])('narrows a %i-point budget to the same split as a full scan', (budget) => {
    for (const rate of [800, 5000, 40_000, 400_000]) {
      const f = score(rate);
      const got = bestAnvilSplit({ speed: 0, capacity: 0 }, budget, f);
      expect(budget).toBeGreaterThan(ANVIL_EXHAUSTIVE_MAX);
      expect(got.speed).toBe(scan(budget, f).speed);
    }
    // A flat output (nothing producing) goes all to Speed.
    expect(bestAnvilSplit({ speed: 0, capacity: 0 }, budget, () => 0).speed).toBe(budget);
  });
});

describe('AFK facts on the scrubbed W3-early save', () => {
  const { raw, now } = scrubbed('scrubbed-w3');
  const state = stateOf(raw, now);

  it('reads worship charge, rates and skulls', () => {
    const w = state.characters.map((c) => c.afk?.worship);
    expect(w.every((x) => x?.max === 50 && x.hasSkull === false)).toBe(true);
  });

  it('reads the active salt and its fuel time', () => {
    const salts = state.account.afk?.salts ?? [];
    expect(salts.map((s) => s.salt)).toEqual(['Refinery1']);
  });

  it('reads the Wizard Lv 73 bag: 18 of 23 slots used', () => {
    const wizard = state.characters.find((c) => c.class === 'Wizard' && c.level === 73);
    expect(wizard?.afk?.inventory?.usedSlots).toBe(18);
    expect(wizard?.afk?.inventory?.totalSlots).toBe(23);
  });
});

describe('AFK facts on every public save', () => {
  it.each(listJson(PUBLIC_DIR))('%s: every time is finite and within 30 days of the parse', (file) => {
    const raw = readSave(PUBLIC_DIR, file) as { lastUpdated?: number };
    const now = raw.lastUpdated ?? Date.UTC(2026, 9, 17, 12);
    const state = stateOf(raw, now);
    const near = (t: number) => Number.isFinite(t) && Math.abs(t - state.asOf) <= AFK_HORIZON_MS;
    for (const c of state.characters) {
      if (!c.afk) continue;
      for (const p of c.afk.anvil ?? []) expect(near(p.capAt)).toBe(true);
      for (const t of c.afk.traps?.placed ?? []) expect(near(t.endsAt)).toBe(true);
      const f = c.afk.fighting;
      if (f) expect(f.survivability).toBeGreaterThanOrEqual(f.survivabilityNoFood);
    }
    for (const s of state.account.afk?.salts ?? []) expect(near(s.dryAt)).toBe(true);
  });

  it('reports a fact unknown when a section it depends on failed', () => {
    const { raw, now } = scrubbed('scrubbed-w2');
    const state = stateOf(raw, now);
    const failed = { ...state, diagnostics: { ...state.diagnostics, failedSections: ['arcade'] } };
    expect(isKnown(failed, 'account.afk.arcade')).toBe(false);
    expect(isKnown(failed, 'account.afk.liquids')).toBe(true);
    expect(isKnown(failed, 'characters[0].afk.fighting')).toBe(false);
  });
});
