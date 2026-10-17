// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M2 Meta Path Goals: S3 (push step, W3 tutorial), FR-13 (wall), FR-16, FR-17 (elite order), FR-22, and
// the engine Detectors run through the M11 contract (purity, determinism).
import type { AccountState } from '@idleon-forge/account-state';
import { makeContext, runDetector } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { elitePending, lookupOf, METAPATH_DETECTORS, runMetaPath, worldTutorial } from '../../src/metapath';
import { hasPrivate, loadKb, NOW, privateFixture, scrubbed, stateOf } from './helpers';
import { account, char, frontierOf } from './synthetic';

const who = (s: AccountState, i: number | undefined) => {
  const c = s.characters.find((x) => x.index === i);
  return `${c?.class} ${c?.level}`;
};
const run = (s: AccountState) => runMetaPath(s, loadKb(), NOW);
const w2 = [scrubbed('scrubbed-w2'), ...(hasPrivate('yasser') ? [privateFixture('yasser')] : [])];
const w3 = [scrubbed('scrubbed-w3'), ...(hasPrivate('joseph') ? [privateFixture('joseph')] : [])];

describe.each(w2)('S3 on the W2-late account (%s)', (file) => {
  const state = stateOf(file, { rates: 'toolbox' });
  it('the push Goal is "Open World 3": finish Djonnut quest 2 on the Barbarian 60', () => {
    const r = run(state);
    expect(r.pushGoal?.chainId).toBe('metapath.metapath.gate-chain-w2');
    expect(loadKb().entries['metapath.metapath.gate-chain-w2']?.text).toBe('Open World 3');
    expect(who(state, r.pushGoal?.characterIndex)).toBe('Barbarian 60');
    expect(r.pushGoal?.step).toEqual({
      kind: 'quest',
      quest: 'Djonnut2',
      npc: 'Djonnut',
      number: 2,
      title: "I'm Blue Dabadedada",
    });
    expect(state.account.gateQuests?.Djonnut1?.completedBy).toContain(r.pushGoal?.characterIndex);
    expect(state.account.worldCrystals?.glacierQuartz).toBe(0);
  });

  it('FR-22: nothing from World 3 fires on W2-late', () => {
    const r = run(state);
    expect(r.goals.filter((g) => g.entryId === 'metapath.goal.world-tutorial-w3')).toEqual([]);
    expect(r.list.positions).not.toHaveProperty('metapath.goal.world-tutorial-w3');
  });
});

describe.each(w3)('S3 on the W3-early account (%s)', (file) => {
  const state = stateOf(file, { rates: 'toolbox' });
  it('"Push World 3": kill 14,981 more on Thermonuclear Climb, about 14 h', () => {
    const r = run(state);
    expect(who(state, r.pushGoal?.characterIndex)).toBe('Squire 85');
    expect(r.pushGoal?.step).toEqual({
      kind: 'route',
      mapName: 'Thermonuclear_Climb',
      mapIndex: 109,
      door: 0,
      killsLeft: 14981,
    });
    expect(r.pushGoal?.etaSeconds).toBe(Math.round((14981 / 1065) * 3600));
    expect(Math.round((r.pushGoal?.etaSeconds ?? 0) / 3600)).toBe(14);
  });

  it('a separate W3 tutorial Goal: Hoggindaz 1 (Turn ON for what???) on the Squire 85', () => {
    const goals = run(state).goals.filter((g) => g.entryId === 'metapath.goal.world-tutorial-w3');
    expect(goals).toHaveLength(1);
    const g = goals[0];
    expect(g?.subject.kind === 'character' && who(state, g.subject.index)).toBe('Squire 85');
    expect(g?.slots).toMatchObject({ quest: 'Hoggindaz1', title: 'Turn ON for what???' });
  });

  it('the push Goal stays when nobody can fight: FR-13 names the wall on the strongest candidate', () => {
    const f = state.account.frontier;
    if (!f) throw new Error('no frontier');
    const walled = { ...f, fights: f.fights.map((x) => ({ ...x, finalKillsPerHour: 0 })) };
    const r = run({ ...state, account: { ...state.account, frontier: walled } });
    expect(r.pusher).toBeNull();
    expect(r.pushGoal?.step).toMatchObject({ kind: 'wall', mapName: 'Thermonuclear_Climb', reason: 'hit' });
    expect(who(state, r.pushGoal?.characterIndex)).toBe('Squire 85');
  });
});

describe('FR-16 and FR-17 (synthetic)', () => {
  const facts = () => lookupOf(loadKb());
  it('the W3 tutorial stops once any character completes Hoggindaz 5', () => {
    const s = account([char(0, 'Squire', 80)], {
      finishedWorlds: [1, 2],
      gateQuests: { Hoggindaz5: { completedBy: [0], inProgressBy: [] } },
    });
    const stage = run(s).stage;
    expect(worldTutorial(s, facts(), stage, 0)).toEqual([]);
  });

  it('elites at W4-entry: DK and ES first, then BC, BB, BM, SB', () => {
    const s = account(
      ['Bowman', 'Barbarian', 'Shaman', 'Wizard', 'Squire', 'Hunter'].map((c, i) => char(i, c, 120)),
      { finishedWorlds: [1, 2, 3] },
    );
    const goals = elitePending(s, facts(), run(s).stage).sort((a, b) => a.order - b.order);
    expect(goals.map((g) => g.slots.elite)).toEqual([
      'Divine_Knight',
      'Elemental_Sorcerer',
      'Bubonic_Conjuror',
      'Blood_Berserker',
      'Beast_Master',
      'Siege_Breaker',
    ]);
  });

  it('W4-entry push: Gobo quests first, on the pusher', () => {
    const s = account([char(0, 'Divine_Knight', 120)], {
      finishedWorlds: [1, 2, 3],
      frontier: { ...frontierOf([{ i: 0, kph: 900, count: 2 }]), world: 4 },
    });
    expect(run(s).pushGoal?.step).toMatchObject({ kind: 'quest', quest: 'Gobo1' });
  });
});

describe('engine Detectors through the M11 contract', () => {
  const kb = loadKb();
  const state = stateOf(scrubbed('scrubbed-w3'), { rates: 'toolbox' });
  it.each(Object.values(METAPATH_DETECTORS))('$id runs, is deterministic and never reads the clock', (d) => {
    const realDate = globalThis.Date;
    const ctx = makeContext(state, kb, { now: NOW });
    let a: ReturnType<typeof runDetector>;
    try {
      // M11 FR-12: a Detector that reads the real clock fails.
      globalThis.Date = (() => {
        throw new Error('Date read');
      }) as unknown as DateConstructor;
      a = runDetector(d, ctx);
    } finally {
      globalThis.Date = realDate;
    }
    expect(a.ok, a.ok ? '' : a.error).toBe(true);
    expect(runDetector(d, makeContext(state, kb, { now: NOW }))).toEqual(a);
    expect(d.kind).toBe('engine');
  });

  it('runMetaPath is deterministic: two runs with the same now are identical (FR-19)', () => {
    expect(run(state)).toEqual(run(state));
    expect(structuredClone(run(state))).toEqual(run(state));
  });
});

describe('the engine Detector registry', () => {
  it('registers the 7 M2 Detectors by file convention', async () => {
    const { engineDetectors } = await import('../../detectors');
    const metapath = Object.keys(engineDetectors).filter((id) => id.startsWith('metapath/'));
    expect(metapath.sort()).toEqual(Object.keys(METAPATH_DETECTORS).sort());
  });
});
