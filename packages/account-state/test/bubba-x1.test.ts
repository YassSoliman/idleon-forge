// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 X1 (ADR 0010): Bubba's derived values, checked against the game's own code on two public saves and
// against Toolbox's own Bubba parse on edited records.
import { normalizeEnvelope, parseSave, toolboxCalls } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import {
  BUBBA_BOON_BONUS_KEYS,
  BUBBA_X1_NONE,
  type BubbaX1,
  bubbaX1,
  CHARISMA_LEVELS_BANKED_LIMIT,
  CHARISMA_MAX_LEVEL,
  SMOKER_MAX_QUALITY_SECONDS,
} from '../src';
import { NOW, PUBLIC_DIR, readSave } from './helpers';

type Raw = number[][];
type Save = { data: Record<string, unknown> };

const load = (file: string) => {
  const save = readSave(PUBLIC_DIR, file) as Save;
  const { account } = parseSave(normalizeEnvelope(save), { now: NOW });
  const b = save.data.Bubba;
  const raw = (typeof b === 'string' ? JSON.parse(b) : b) as Raw | undefined;
  return { save, account, raw };
};

const latest = load('latest.json');
const highend = load('highend.json');
const latestRaw = latest.raw as Raw;
const copyRaw = (): Raw => structuredClone(latestRaw);
const at = (raw: Raw, row: number, i: number): number => raw[row]?.[i] ?? 0;
const set = (raw: Raw, row: number, i: number, value: number): void => {
  const r = raw[row];
  if (!r) throw new Error(`no Bubba row ${row}`);
  r[i] = value;
};
const x1Of = (raw: Raw): BubbaX1 => bubbaX1(raw, latest.account, toolboxCalls);
const toolboxOf = (raw: Raw) => toolboxCalls.bubbaParse(raw, latest.account);

/** Relative closeness; an expected 0 must be exactly 0. */
const within = (actual: number | null | undefined, expected: number, tolerance = 1e-9) =>
  expected === 0
    ? expect(actual).toBe(0)
    : expect(Math.abs((actual as number) / expected - 1)).toBeLessThan(tolerance);

// The game's own _customBlock_Bubbastuff, copied verbatim from N.js (served 2026-10-18, Last-Modified
// 2026-10-17) and run by scripts/oracle/bubba-oracle.cjs on 2026-10-18 over each save's Bubba record with
// the client's own CustomLists.BubbaUpg and Spelunky:
//   node scripts/oracle/bubba-oracle.cjs packages/account-state/fixtures/public/<save> --companion51 <x>
// Companions(51) is 0 on latest.json (its Build Rate, 420, read live on 2026-10-11, has no companion
// factor) and 2 on highend.json (Toolbox's companion list).
const ORACLE = {
  'latest.json': {
    patsPerHour: 11,
    charismaXpReq: 78532.93546816966,
    charismaXpPerSec: 17.8,
    charismaLevelsBanked: 155,
    charismaBonus: [4752, 0, 0, 0, 8.184000000000001, 22.44],
    charismaBonusNext: [4791.6, 2.64, 6.6000000000000005, 1.32, 8.316, 23.76],
    boonNextDelta: 6,
    megafleshMultiplier: 2,
    discountNextRatio: [0.9976415094339622, 0.9870129870129871, 0.9615384615384613],
  },
  'highend.json': {
    patsPerHour: 13,
    charismaXpReq: 10119541.444369016,
    charismaXpPerSec: 88.65,
    charismaLevelsBanked: 0,
    charismaBonus: [6642, 619.92, 738, 0, 44.28, 154.98],
    charismaBonusNext: [6752.7, 627.3, 756.45, 3.69, 44.64900000000001, 158.67],
    boonNextDelta: 36,
    megafleshMultiplier: 4,
    discountNextRatio: [0.999411071849234, 0.9986206896551724, 0.9976415094339622],
  },
} as const;

describe.each([
  ['latest.json', latest],
  ['highend.json', highend],
] as const)('%s against the game code', (file, fixture) => {
  const expected = ORACLE[file];
  const x1 = bubbaX1(fixture.raw, fixture.account, toolboxCalls);

  it.each([
    'patsPerHour',
    'charismaXpReq',
    'charismaXpPerSec',
    'boonNextDelta',
    'megafleshMultiplier',
  ] as const)('%s', (key) => {
    within(x1[key], expected[key]);
  });

  it.each(['charismaBonus', 'charismaBonusNext', 'discountNextRatio'] as const)('%s', (key) => {
    const actual = x1[key] as number[];
    expect(actual).toHaveLength(expected[key].length);
    expected[key].forEach((value, i) => {
      within(actual[i], value);
    });
  });

  it('charismaLevelsBanked', () => {
    expect(x1.charismaLevelsBanked).toBe(expected.charismaLevelsBanked);
  });
});

describe('meatsliceRateBase', () => {
  it('is the live rate on latest.json, which was saved with no happiness', () => {
    // Bubbastuff("MeatsliceRate"), read live on 2026-10-11 through the debug server, per second
    expect(at(latestRaw, 0, 1)).toBe(0);
    within(x1Of(latestRaw).meatsliceRateBase, 880127763438743 * 60);
  });

  it('equals Toolbox meatsliceRate when the save has no happiness', () => {
    const raw = copyRaw();
    set(raw, 0, 1, 0);
    const rate = toolboxOf(raw)?.meatsliceRate as number;
    expect(rate).toBeGreaterThan(0);
    expect(x1Of(raw).meatsliceRateBase).toBe(rate);
  });

  it('stays at the happiness-0 rate while meatsliceRate rises with happiness', () => {
    const raw = copyRaw();
    set(raw, 0, 1, 500);
    const happy = toolboxOf(raw)?.meatsliceRate as number;
    const base = x1Of(raw).meatsliceRateBase as number;
    expect(base).toBe(toolboxOf(latestRaw)?.meatsliceRate);
    expect(base).toBeLessThan(happy);
  });
});

describe('boonNextDelta', () => {
  // One more Bubba Boon level changes exactly one of the seven bonuses, (L mod 7) + 1, by boonNextDelta
  it.each(Array.from({ length: 31 }, (_, level) => [level]))('Bubba Boon %i', (level) => {
    const raw = copyRaw();
    set(raw, 1, 3, level);
    const now = toolboxOf(raw);
    const delta = x1Of(raw).boonNextDelta as number;
    set(raw, 1, 3, level + 1);
    const next = toolboxOf(raw);
    const changed = BUBBA_BOON_BONUS_KEYS.filter((k) => next?.bonuses[k]?.bonus !== now?.bonuses[k]?.bonus);
    expect(changed).toEqual([BUBBA_BOON_BONUS_KEYS[level % 7]]);
    const key = changed[0] as string;
    expect(delta).toBeGreaterThan(0);
    expect(delta).toBeCloseTo((next?.bonuses[key]?.bonus ?? 0) - (now?.bonuses[key]?.bonus ?? 0), 9);
  });

  it('scales with the Megaflesh multiplier', () => {
    const raw = copyRaw();
    set(raw, 1, 8, 0);
    const plain = x1Of(raw);
    expect(plain.megafleshMultiplier).toBe(1);
    const boosted = x1Of(latestRaw);
    expect((boosted.boonNextDelta as number) / (boosted.megafleshMultiplier as number)).toBeCloseTo(
      plain.boonNextDelta as number,
      9,
    );
  });
});

describe('charismaBonusNext', () => {
  it('is above charismaBonus for every attribute below the max level', () => {
    const x1 = x1Of(latestRaw);
    const traits = toolboxCalls.bubbaTables().charismaNames;
    expect(x1.charismaBonus).toHaveLength(traits.length);
    expect(x1.charismaBonusNext).toHaveLength(traits.length);
    const belowMax = traits.map((_, i) => i).filter((i) => at(latestRaw, 3, i) < CHARISMA_MAX_LEVEL);
    expect(belowMax.length).toBeGreaterThan(0);
    for (const i of belowMax) {
      expect(x1.charismaBonusNext?.[i]).toBeGreaterThan(x1.charismaBonus?.[i] as number);
    }
  });
});

describe('discountNextRatio', () => {
  it.each(['latest.json', 'highend.json', 'speedrun-rank1.json'])('%s: every ratio is in (0, 1)', (file) => {
    const f = load(file);
    const ratios = bubbaX1(f.raw, f.account, toolboxCalls).discountNextRatio;
    expect(ratios).toHaveLength(3);
    for (const r of ratios ?? []) {
      expect(r).toBeGreaterThan(0);
      expect(r).toBeLessThan(1);
    }
  });
});

describe('charismaLevelsBanked', () => {
  // The game's CharismaTraitREQ, verbatim, as the oracle for the hand-stepped loop
  const req = (total: number) => 20 * (1 + total / 20) * 1.03 ** total;
  // A record with every attribute at 0 holding `xp` Charisma XP and `pendingSeconds` not yet folded in
  const withXp = (xp: number, pendingSeconds = 0): Raw => {
    const raw = copyRaw();
    raw[3] = (raw[3] ?? []).map((v, i) => (i < 6 ? 0 : v));
    set(raw, 0, 8, xp);
    set(raw, 0, 7, pendingSeconds);
    return raw;
  };

  it('is 0 when the XP is below one level', () => {
    expect(x1Of(withXp(req(0) - 1)).charismaLevelsBanked).toBe(0);
  });

  it('agrees with a hand-stepped loop, one REQ per level as the total rises', () => {
    const three = req(0) + req(1) + req(2);
    expect(x1Of(withXp(three + 1)).charismaLevelsBanked).toBe(3);
    expect(x1Of(withXp(three - 1)).charismaLevelsBanked).toBe(2);
  });

  it('counts the pending seconds at CharismaTraitSPD', () => {
    const perSec = x1Of(withXp(0)).charismaXpPerSec as number;
    const seconds = req(0) / perSec;
    expect(x1Of(withXp(0, seconds * 1.001)).charismaLevelsBanked).toBe(1);
    expect(x1Of(withXp(0, seconds * 0.999)).charismaLevelsBanked).toBe(0);
  });

  it('ignores the pending seconds before the Charisma Chart folds them in', () => {
    const raw = withXp(0, 1e6);
    expect(x1Of(raw).charismaLevelsBanked).toBeGreaterThan(0);
    set(raw, 0, 4, 0); // no meat produced, so only one upgrade type is open
    expect(x1Of(raw).charismaLevelsBanked).toBe(0);
  });

  it(`stops at ${CHARISMA_LEVELS_BANKED_LIMIT} levels`, () => {
    expect(x1Of(withXp(1e300)).charismaLevelsBanked).toBe(CHARISMA_LEVELS_BANKED_LIMIT);
  });
});

describe('fallback to null', () => {
  it('gives null for every field with no Bubba record', () => {
    const f = load('first.json');
    expect(f.raw).toBeUndefined();
    expect(bubbaX1(f.raw, f.account, toolboxCalls)).toEqual(BUBBA_X1_NONE);
  });

  it('gives null for every field without the Toolbox calls', () => {
    expect(bubbaX1(latestRaw, latest.account, null)).toEqual(BUBBA_X1_NONE);
  });

  it('gives null for every field when Toolbox throws', () => {
    const broken = {
      ...toolboxCalls,
      bubbaParse: () => {
        throw new Error('boom');
      },
    };
    expect(bubbaX1(latestRaw, latest.account, broken)).toEqual(BUBBA_X1_NONE);
  });

  it('reads the save string as well as the rows', () => {
    expect(bubbaX1(latest.save.data.Bubba, latest.account, toolboxCalls)).toEqual(x1Of(latestRaw));
  });

  it('gives 0 pats, rate, banked levels and Charisma bonus for an empty Bubba record', () => {
    const f = load('fresh.json');
    const x1 = bubbaX1(f.raw, f.account, toolboxCalls);
    expect(x1.patsPerHour).toBe(0);
    expect(x1.meatsliceRateBase).toBe(0);
    expect(x1.charismaLevelsBanked).toBe(0);
    expect(x1.charismaBonus).toEqual(toolboxCalls.bubbaTables().charismaNames.map(() => 0));
    expect(x1.megafleshMultiplier).toBe(1);
  });
});

describe('constants', () => {
  it("SMOKER_MAX_QUALITY_SECONDS matches Toolbox's export", () => {
    expect(SMOKER_MAX_QUALITY_SECONDS).toBe(toolboxCalls.bubbaTables().smokerMaxQualitySeconds);
  });
});
