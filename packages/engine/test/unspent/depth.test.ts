// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M15 F1 (Refinery set-up) and F2 (Construction "build this next") through the M6 engine module and the
// engine core: US-1 and US-2 on the scrubbed saves, and on the private saves when present (local only,
// class and level only, never a name).
import { existsSync, readFileSync } from 'node:fs';
import type { AccountState, ConstructionBuilding } from '@idleon-forge/account-state';
import { accountStateOfExport } from '@idleon-forge/kb-tools/src/parse';
import { withAccount } from '@idleon-forge/knowledge';
import { detectors } from '@idleon-forge/knowledge/detectors';
import { describe, expect, it } from 'vitest';
import { engineDetectors } from '../../detectors';
import { goldenResult } from '../../src/golden';
import type { Goal } from '../../src/result';
import { createUnspentModule } from '../../src/unspent';
import { kb } from '../afk/helpers';
import { input, publicState } from '../core/helpers';
import { PRIVATE, SCRUBBED } from '../metapath/helpers';

/** The scrubbed saves' `now` (their meta files). */
const NOW = Date.parse('2026-10-17T16:12:33.140Z');
const load = (path: string): AccountState =>
  accountStateOfExport(JSON.parse(readFileSync(path, 'utf8')), NOW);
const w3 = load(`${SCRUBBED}scrubbed-w3.json`);
const w2 = load(`${SCRUBBED}scrubbed-w2.json`);

const m6 = createUnspentModule({ kb, registry: detectors });
const accountGoals = (s: AccountState): Goal[] =>
  (m6.run(input(s, { now: NOW })).account?.goals ?? []).map((g) => g.goal);
const goalOf = (s: AccountState, id: string) => accountGoals(s).find((g) => g.id === id);
const M15 = [
  'refinery.check.auto-refine-off',
  'refinery.check.refine-full',
  'refinery.check.unlock-next',
  'construction.check.build-next',
];

const salts = (
  s: AccountState,
  f: (x: NonNullable<AccountState['account']['refinery']>['salts'][number], i: number) => object,
) =>
  withAccount(s, {
    refinery: s.account.refinery && { salts: s.account.refinery.salts.map((x, i) => ({ ...x, ...f(x, i) })) },
  });
const buildings = (
  s: AccountState,
  f: (b: ConstructionBuilding) => ConstructionBuilding,
  slots?: Array<number | null>,
) => {
  const c = s.account.construction;
  return withAccount(s, {
    construction: c && { ...c, buildings: c.buildings.map(f), ...(slots ? { buildSlots: slots } : {}) },
  });
};

describe('US-1 Rank my salts (F1)', () => {
  it('W3-early: turn Auto Refine off on Redox, rank 1 named, no higher rank, position 3, compounding', () => {
    const g = goalOf(w3, 'refinery.check.auto-refine-off');
    expect(g?.nextAction.text).toBe('Turn Auto Refine off on Redox Salts');
    expect(g?.nextAction.why).toMatch(/^Then refine it only when its bar is full/);
    expect(g?.nextAction.why).toContain('Auto Refine keeps it at rank 1.');
    expect(g?.nextAction.why).toContain('left of the Construction Table in Frostbite Tundra');
    expect(g?.nextAction.why).not.toMatch(/rank [2-9]|14,?2\d\d/);
    expect(g?.category).toBe('compounding');
    expect(g?.details).toEqual([
      {
        subject: 'account',
        text: 'Before a long AFK Stretch, refine a full bar so the stretch has the whole bar to fill.',
      },
    ]);
    const ranked = m6.run(input(w3, { now: NOW })).account?.goals?.find((x) => x.goal.id === g?.id);
    expect(ranked?.rank?.framePosition).toBe(3);
  });

  it('W3-early: no F1 Goal names Explosive Salts (M6 FR-31 owns it, FR-6)', () => {
    const f1 = accountGoals(w3).filter((g) => g.id.startsWith('refinery.check.') && M15.includes(g.id));
    expect(f1.some((g) => /Explosive/.test(g.nextAction.text))).toBe(false);
    expect(goalOf(w3, 'refinery.check.salt-fuel')?.nextAction.text).toBe(
      'Get 1 more Bullfrog Horn to run Explosive Salts',
    );
  });

  it('a full bar with Auto Refine off: refine it now, at position 1, losing-now', () => {
    const s = salts(w3, (_x, i) => (i === 0 ? { autoRefine: false, power: 50, fullInSeconds: 0 } : {}));
    const out = m6.run(input(s, { now: NOW })).account?.goals ?? [];
    const g = out.find((x) => x.goal.id === 'refinery.check.refine-full');
    expect(g?.goal.nextAction.text).toBe('Refine Redox Salts now: its bar is full');
    expect(g?.goal.nextAction.why).toMatch(/^It has stopped making salt/);
    expect(g?.rank).toMatchObject({ framePosition: 1, urgency: 'losing-now' });
    expect(out.some((x) => x.goal.id === 'refinery.check.auto-refine-off')).toBe(false);
  });

  it('Auto Refine off and filling before the return: no Goal for Redox', () => {
    const s = salts(w3, (_x, i) => (i === 0 ? { autoRefine: false, power: 40, fullInSeconds: 9000 } : {}));
    expect(accountGoals(s).filter((g) => M15.slice(0, 2).includes(g.id))).toEqual([]);
  });

  it('W2-late: no F1 or F2 Goal (Stage gate)', () => {
    expect(accountGoals(w2).filter((g) => M15.includes(g.id))).toEqual([]);
  });

  it('a beyond account (highend): no F1 or F2 Goal', () => {
    const s = publicState('highend.json');
    expect(accountGoals(s).filter((g) => M15.includes(g.id))).toEqual([]);
  });

  it('unlock the next salt only with the cost in the chest and nothing waiting on it (FR-4, FR-10)', () => {
    const rich = withAccount(w3, { storageItems: { ...(w3.account.storageItems ?? {}), Refinery2: 160 } });
    // The Death Note and Boulder Roller wait for Explosive Salts: reserved, no unlock.
    expect(goalOf(rich, 'refinery.check.unlock-next')).toBeUndefined();
    const free = buildings(rich, (b) => (b.saltRawName === 'Refinery2' ? { ...b, bodyFull: false } : b));
    expect(goalOf(free, 'refinery.check.unlock-next')?.nextAction.text).toBe(
      'Unlock Spontaneity Salts in the Refinery',
    );
    expect(goalOf(free, 'refinery.check.unlock-next')?.nextAction.why).toMatch(
      /^It costs 150 Explosive Salts from your storage chest \(you have 160\)/,
    );
  });
});

describe('US-2 Build the right thing next (F2)', () => {
  it('W3-early: the 3D Printer waits on Redox in the Refinery storage: collect, then check the Build menu', () => {
    const g = goalOf(w3, 'construction.check.build-next');
    expect(g?.nextAction.text).toBe("Collect your Redox Salts from the Refinery's storage into the chest");
    expect(g?.nextAction.why).toMatch(
      /^Then check the 3D Printer in the Build menu: it upgrades when you have enough\./,
    );
    expect(g?.nextAction.why).toContain('Construction Table in Frostbite Tundra town');
    expect(g?.nextAction.why).toContain('Then: Salt Lick to level 1, then Talent Book Library to level 2.');
  });

  it('ranks at the W3-early list position M2 authors (5), not at the free-value 3', () => {
    const r = goldenResult({
      state: w3,
      kb,
      registries: { knowledge: detectors, engine: engineDetectors },
      now: NOW,
      expectedReturnMs: 8 * 3600_000,
    });
    const ids = r.account.goals.map((g) => g.id);
    expect(ids).toContain('construction.check.build-next');
    expect(ids.indexOf('construction.check.build-next')).toBeGreaterThan(
      ids.indexOf('refinery.check.auto-refine-off'),
    );
  });

  it('no F2 Goal names the Death Note (M6 owns its first level, FR-12)', () => {
    expect(
      accountGoals(w3)
        .filter((g) => g.id === 'construction.check.build-next')
        .map((g) => g.nextAction.text)
        .join(),
    ).not.toMatch(/Death Note/);
    expect(goalOf(w3, 'death-note.check.build')?.nextAction.text).toBe(
      "Refine 10 Explosive Salts for the Death Note's first level (have 0)",
    );
  });

  it('17 Redox Salts in the chest, none in the Refinery: pay in the Build menu, no time on Auto Refine', () => {
    const s = withAccount(w3, {
      refineryStorage: { ...(w3.account.refineryStorage ?? {}), Refinery1: 0 },
      storageItems: { ...(w3.account.storageItems ?? {}), Refinery1: 17 },
    });
    expect(goalOf(s, 'construction.check.build-next')?.nextAction.text).toBe(
      'Upgrade the 3D Printer in the Build menu',
    );
    expect(goalOf(s, 'construction.check.build-next')?.nextAction.why).toMatch(
      /^It upgrades when you have its Redox Salts; you have 17 in storage\./,
    );
  });

  it('the Printer at Lv 6, a slot empty: put the Salt Lick in it (its Explosive Salt is not running)', () => {
    const s = buildings(
      w3,
      (b) =>
        b.rawName === '3D_Printer' ? { ...b, level: 6, progress: 0, inSlot: false, bodyFull: false } : b,
      [2, null],
    );
    expect(goalOf(s, 'construction.check.build-next')?.nextAction.text).toBe(
      'Put the Salt Lick in an empty build slot',
    );
    expect(goalOf(s, 'construction.check.build-next')?.nextAction.why).toMatch(
      /^The slot is at the Construction Table\. It is paid in Explosive Salts, which is not running yet\./,
    );
  });

  it('every slot busy: swap it into the slot of the lowest-listed holder, never the Death Note', () => {
    const s = buildings(
      w3,
      (b) =>
        b.rawName === '3D_Printer'
          ? { ...b, level: 6, progress: 0, inSlot: false, bodyFull: false }
          : b.rawName === 'Boulder_Roller'
            ? { ...b, inSlot: true, bodyFull: false }
            : b,
      [2, 11],
    );
    expect(goalOf(s, 'construction.check.build-next')?.nextAction.text).toBe(
      'Swap the Salt Lick into the build slot holding the Boulder Roller',
    );
  });

  it('in a slot and building: no Goal', () => {
    const s = buildings(w3, (b) =>
      b.rawName === '3D_Printer' ? { ...b, progress: 10, bodyFull: false } : b,
    );
    expect(goalOf(s, 'construction.check.build-next')).toBeUndefined();
  });

  it('the salt not running and the bar full: no F2 Goal, M6 owns the salt (FR-9 step 2)', () => {
    const s = withAccount(w3, { refineryStorage: {} });
    const off = salts(s, (_x, i) => (i === 0 ? { active: false } : {}));
    expect(goalOf(off, 'construction.check.build-next')).toBeUndefined();
  });
});

const privateSave = (stem: string) => `${PRIVATE}${stem}.raw.json`;
describe.skipIf(!existsSync(privateSave('joseph')) || !existsSync(privateSave('yasser')))(
  'private saves (local only)',
  () => {
    it('W3-early: F1 fires on Redox and F2 names the 3D Printer waiting on Redox', () => {
      const s = load(privateSave('joseph'));
      expect(goalOf(s, 'refinery.check.auto-refine-off')?.nextAction.text).toMatch(
        /^Turn Auto Refine off on Redox Salts/,
      );
      // The KB copy pass (#112) splits it: the step collects the Redox, its why names the 3D Printer.
      const next = goalOf(s, 'construction.check.build-next')?.nextAction;
      expect(next?.text).toMatch(/Redox Salts/);
      expect(next?.why).toMatch(/3D Printer/);
    });
    it('W2-late: F1 and F2 silent', () => {
      const s = load(privateSave('yasser'));
      expect(accountGoals(s).filter((g) => M15.includes(g.id))).toEqual([]);
    });
  },
);
