// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M2 Stage detection: the TR-5 rule table on both sides of every edge (TR-19), TR-6 certainty, the TR-6a
// cross-check, and S1 on the scrubbed saves (CI) and the private ones (local only).
import { withUnknown } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { detectStage, lookupOf, runMetaPath } from '../../src/metapath';
import { hasPrivate, loadKb, NOW, PUBLIC, privateFixture, scrubbed, stateOf } from './helpers';
import { account, char, failSection } from './synthetic';

const kb = () => lookupOf(loadKb());
const stage = (s: Parameters<typeof detectStage>[0]) => detectStage(s, kb());

describe('TR-5 rule table (synthetic, both sides of each edge)', () => {
  it('W1: early below 14, mid from 14, late from 28 or a Dog Bone dialogue', () => {
    expect(stage(account([char(0, 'Warrior', 13)])).id).toBe('W1-early');
    expect(stage(account([char(0, 'Warrior', 14)])).id).toBe('W1-mid');
    expect(stage(account([char(0, 'Warrior', 27)])).id).toBe('W1-mid');
    expect(stage(account([char(0, 'Warrior', 28)])).id).toBe('W1-late');
    expect(stage(account([char(0, 'Warrior', 20, { npcDialog: { Dog_Bone: 3 } })])).id).toBe('W1-late');
  });

  it('a 9999 dialogue is not band evidence (TR-5, F12)', () => {
    expect(stage(account([char(0, 'Warrior', 20, { npcDialog: { Dog_Bone: 9999 } })])).id).toBe('W1-mid');
    const w2 = (d: number) =>
      stage(account([char(0, 'Barbarian', 35, { npcDialog: { Djonnut: d } })], { finishedWorlds: [1] })).id;
    expect(w2(9999)).toBe('W2-mid');
    expect(w2(2)).toBe('W2-late');
  });

  it('W2: early below 30 or with nobody subclassed (D3), mid at 30 with a subclass, late from 50', () => {
    const w2 = (...chars: Parameters<typeof char>[]) =>
      stage(
        account(
          chars.map((c) => char(...c)),
          { finishedWorlds: [1] },
        ),
      ).id;
    expect(w2([0, 'Barbarian', 29])).toBe('W2-early');
    expect(w2([0, 'Barbarian', 30])).toBe('W2-mid');
    expect(w2([0, 'Warrior', 40])).toBe('W2-early');
    expect(w2([0, 'Barbarian', 49])).toBe('W2-mid');
    expect(w2([0, 'Barbarian', 50])).toBe('W2-late');
    // A new base-class character does not regress the Stage (D3).
    expect(w2([0, 'Barbarian', 40], [1, 'Archer', 12])).toBe('W2-mid');
  });

  it('subclassed is positive: a Beginner, a Journeyman and a null classIndex are not; a Maestro is', () => {
    const w2 = (c: ReturnType<typeof char>) => stage(account([c], { finishedWorlds: [1] })).id;
    expect(w2(char(0, 'Beginner', 40))).toBe('W2-early');
    expect(w2(char(0, 'Journeyman', 40))).toBe('W2-early');
    expect(w2(char(0, null, 40))).toBe('W2-early');
    expect(w2(char(0, 'Maestro', 40))).toBe('W2-mid');
  });

  it('W3: early until Death Note, 3D Printer and Hoggindaz 5; mid with all three; late on Nullo or Galaxial Amethyst', () => {
    const done = { Hoggindaz5: { completedBy: [0], inProgressBy: [] } };
    const w3 = (patch: Parameters<typeof account>[1]) =>
      stage(account([char(0, 'Squire', 80)], { finishedWorlds: [1, 2], ...patch })).id;
    expect(w3({})).toBe('W3-early');
    expect(w3({ buildings: { deathNote: 1, printer3d: 1, atomCollider: 0 } })).toBe('W3-early');
    expect(w3({ buildings: { deathNote: 1, printer3d: 1, atomCollider: 0 }, gateQuests: done })).toBe(
      'W3-mid',
    );
    expect(w3({ buildings: { deathNote: 0, printer3d: 1, atomCollider: 0 }, gateQuests: done })).toBe(
      'W3-early',
    );
    expect(w3({ worldCrystals: { desertTopaz: 0, glacierQuartz: 0, galaxialAmethyst: 1 } })).toBe('W3-late');
    expect(
      w3({ salts: [0, 1, 2, 3, 4, 5].map((i) => ({ rawName: `Refinery${i + 1}`, unlocked: i === 5 })) }),
    ).toBe('W3-late');
  });

  it('W4-entry once World 3 is finished; beyond coverage once World 4 is (D2)', () => {
    const w4 = stage(account([char(0, 'Divine_Knight', 120)], { finishedWorlds: [1, 2, 3] }));
    expect([w4.id, w4.coverage, w4.next]).toEqual(['W4-entry', 'covered', null]);
    const beyond = stage(account([char(0, 'Divine_Knight', 200)], { finishedWorlds: [1, 2, 3, 4] }));
    expect([beyond.id, beyond.coverage, beyond.next]).toEqual(['W4-entry', 'beyond', null]);
  });
});

describe('TR-6 certainty and TR-6a cross-check', () => {
  it('finishedWorlds unknown: no Stage, certainty unknown (FR-3)', () => {
    const s = stage(
      withUnknown(account([char(0, 'Squire', 80)], { finishedWorlds: [1] }), 'account.finishedWorlds'),
    );
    expect([s.id, s.certainty]).toEqual([null, 'unknown']);
  });

  it('two unknown predicates (towers failed, Hoggindaz 5 done): earliest Stage, partial, a Check line', () => {
    const s = stage(
      failSection(
        account([char(0, 'Squire', 80)], {
          finishedWorlds: [1, 2],
          buildings: null,
          gateQuests: { Hoggindaz5: { completedBy: [0], inProgressBy: [] } },
        }),
        'towers',
      ),
    );
    expect([s.id, s.certainty]).toEqual(['W3-early', 'partial']);
    expect(s.evidence.filter((e) => !e.known).map((e) => e.field)).toEqual([
      'account.buildings.deathNote',
      'account.buildings.printer3d',
    ]);
    expect(s.next?.needs).toEqual(["Check the Death Note and 3D Printer levels (couldn't read them)"]);
  });

  it('World 2 finished but World 1 not: the later world, partial', () => {
    const s = stage(account([char(0, 'Squire', 80)], { finishedWorlds: [2] }));
    expect([s.id, s.certainty]).toEqual(['W3-early', 'partial']);
  });

  it('a World 2 gate quest done with World 1 not finished: World 2, partial', () => {
    const s = stage(
      account([char(0, 'Barbarian', 40)], {
        finishedWorlds: [],
        gateQuests: { Djonnut1: { completedBy: [0], inProgressBy: [] } },
      }),
    );
    expect([s.world, s.certainty]).toEqual([2, 'partial']);
    expect(s.evidence.some((e) => e.field === 'account.gateQuests' && e.value === 1)).toBe(true);
  });
});

const fixtures = [
  { name: 'scrubbed W2', file: scrubbed('scrubbed-w2'), w: 2 as const },
  { name: 'scrubbed W3', file: scrubbed('scrubbed-w3'), w: 3 as const },
  ...(hasPrivate('yasser')
    ? [{ name: 'private W2-late', file: privateFixture('yasser'), w: 2 as const }]
    : []),
  ...(hasPrivate('joseph')
    ? [{ name: 'private W3-early', file: privateFixture('joseph'), w: 3 as const }]
    : []),
];

describe.each(fixtures)('S1 on the $name account', ({ file, w }) => {
  it('places the account, with evidence and next.needs', () => {
    const s = stage(stateOf(file));
    if (w === 2) {
      expect([s.id, s.certainty, s.rule, s.label]).toEqual([
        'W2-late',
        'certain',
        'w2-late',
        'World 2, late',
      ]);
      expect(s.evidence).toEqual(
        expect.arrayContaining([
          { field: 'account.finishedWorlds', value: [1], known: true },
          { field: 'characters[*].level', value: 60, known: true },
        ]),
      );
      expect(s.evidence.find((e) => e.field === 'characters[*].npcDialog.Djonnut')).toBeDefined();
      expect(s.next).toEqual({
        stage: 'W3-early',
        needs: ['A character talks to Constructor Crow (finishes World 2)'],
      });
    } else {
      expect([s.id, s.certainty, s.rule]).toEqual(['W3-early', 'certain', 'w3-early']);
      expect(s.evidence).toEqual(
        expect.arrayContaining([
          { field: 'account.finishedWorlds', value: [1, 2], known: true },
          { field: 'account.buildings.deathNote', value: 0, known: true },
          { field: 'account.buildings.printer3d', value: 4, known: true },
          { field: 'account.gateQuests.Hoggindaz5.completedBy', value: 0, known: true },
        ]),
      );
      expect(s.next?.needs).toEqual([
        'Build the Death Note to level 1',
        'Finish Hoggindaz 5 on any character',
      ]);
    }
    // Evidence never carries a string (no name can enter, TR-17).
    expect(s.evidence.every((e) => typeof e.value !== 'string')).toBe(true);
  });

  it.runIf(w === 3)('with only the towers section failed, still W3-early and certain', () => {
    const s = stage(failSection(stateOf(file), 'towers'));
    expect([s.id, s.certainty]).toEqual(['W3-early', 'certain']);
  });

  it.runIf(w === 3)('with Hoggindaz 5 done and towers failed: W3-early, partial, a Check line', () => {
    const base = stateOf(file);
    const s = stage(
      failSection(
        {
          ...base,
          account: {
            ...base.account,
            buildings: null,
            gateQuests: { ...base.account.gateQuests, Hoggindaz5: { completedBy: [3], inProgressBy: [] } },
          },
        },
        'towers',
      ),
    );
    expect([s.id, s.certainty]).toEqual(['W3-early', 'partial']);
    expect(s.evidence.filter((e) => !e.known).map((e) => e.field)).toEqual([
      'account.buildings.deathNote',
      'account.buildings.printer3d',
    ]);
    expect(s.next?.needs).toEqual(["Check the Death Note and 3D Printer levels (couldn't read them)"]);
  });
});

describe('S1 beyond coverage (public W7 save)', () => {
  it('highend.json is W4-entry beyond: no push, next-character, elite or world-tutorial Goal', () => {
    const r = runMetaPath(stateOf(`${PUBLIC}highend.json`, { now: NOW }), loadKb(), NOW);
    expect([r.stage.id, r.stage.coverage]).toEqual(['W4-entry', 'beyond']);
    expect(r.pushGoal).toBeNull();
    expect(r.pushUnavailable).toBe('beyond-coverage');
    expect(r.goals).toEqual([]);
    expect(r.list.frameOnly).toBe(true);
  });
});
