// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M2 Priority Lists and the comparator (FR-18 to FR-21, TR-13, TR-14, S6), over synthetic compiled lists:
// the real list files land with the Goal entries (see the M2 PR), and these rules don't depend on them.
import type { CompiledListItem, CompiledPriorityList } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import {
  compareGoals,
  FRAME,
  framePositionOf,
  positionOf,
  type Rankable,
  rankGoals,
  runMetaPath,
  selectPriorityList,
} from '../../src/metapath';
import { loadKb, NOW, scrubbed, stateOf } from './helpers';

const item = (id: string, extra: Partial<CompiledListItem> = {}): CompiledListItem => ({ id, ...extra });

/** The compiled shape of a Stage list: tier 1 the never-skip block, 2 the push, 3 the free-value block. */
function lists(): Record<string, CompiledPriorityList> {
  const neverSkip = [
    item('minigames.check.spiketrap', { via: 'metapath.priority.never-skip' }),
    item('colosseum.check.collect-tickets', { via: 'metapath.priority.never-skip', byUrgency: true }),
    item('alchemy-vials.check.daily-attempts', { via: 'metapath.priority.never-skip', byUrgency: true }),
  ];
  const free = [
    item('minigames.check.daily-plays', { via: 'metapath.priority.free-value-fills' }),
    item('cards.check.empty-slots', { via: 'metapath.priority.free-value-fills' }),
  ];
  return {
    'metapath.priority.w2-mid': {
      id: 'metapath.priority.w2-mid',
      list: 'goals',
      stage: 'W2-mid',
      positions: [
        neverSkip,
        [item('metapath.goal.push')],
        free,
        [item('stamps.check.quest-toward', { carryForward: true })],
      ],
    },
    'metapath.priority.w2-late': {
      id: 'metapath.priority.w2-late',
      list: 'goals',
      stage: 'W2-late',
      positions: [
        neverSkip,
        [item('metapath.goal.push')],
        free,
        [item('metapath.goal.subclass'), item('construction.goal.cogs', { contested: true })],
        [item('spend.goal.plan')],
        [item('classes.goal.level'), item('metapath.goal.next-character')],
      ],
    },
  };
}

const goal = (entryId: string, over: Partial<Rankable> = {}): Rankable => ({
  entryId,
  category: 'compounding',
  stale: false,
  contested: false,
  cost: null,
  milestoneEtaSeconds: null,
  goalsServed: 0,
  urgency: null,
  deadline: null,
  framePosition: null,
  ...over,
});

const list = (stage: 'W2-mid' | 'W2-late' | 'W3-early', coverage: 'covered' | 'beyond' = 'covered') =>
  selectPriorityList({ id: stage, coverage }, loadKb(lists()));

describe('TR-13 list resolution', () => {
  it('a World 4 band without its own list reads the W4-entry list (M26 FR-3); earlier Stages never borrow', () => {
    const w4: CompiledPriorityList = {
      id: 'metapath.priority.w4-entry',
      list: 'goals',
      stage: 'W4-entry',
      positions: [[item('metapath.goal.push')]],
    };
    const kb = loadKb({ ...lists(), [w4.id]: w4 });
    expect(selectPriorityList({ id: 'W4-mid', coverage: 'covered' }, kb).listId).toBe(
      'metapath.priority.w4-entry',
    );
    expect(selectPriorityList({ id: 'W4-late', coverage: 'covered' }, kb).listId).toBe(
      'metapath.priority.w4-entry',
    );
    expect(list('W3-early').listId).toBeNull();
  });

  it('an include is one position; the push is 2; Stage items from 4; last position is the bottom tie', () => {
    const l = list('W2-late');
    expect(l.listId).toBe('metapath.priority.w2-late');
    expect(positionOf(l, 'minigames.check.spiketrap')).toBe(FRAME.neverSkip);
    expect(positionOf(l, 'metapath.goal.push')).toBe(FRAME.push);
    expect(positionOf(l, 'cards.check.empty-slots')).toBe(FRAME.freeValue);
    expect(positionOf(l, 'metapath.goal.subclass')).toBe(FRAME.firstStageItem);
    expect(positionOf(l, 'metapath.goal.next-character')).toBe(l.lastPosition);
    expect(positionOf(l, 'classes.goal.level')).toBe(l.lastPosition);
    expect(positionOf(l, 'nobody.goal.unlisted')).toBeNull();
    expect(l.byUrgency).toEqual(['colosseum.check.collect-tickets', 'alchemy-vials.check.daily-attempts']);
  });

  it('a by-urgency item ranks at 1 while value is lost before the return, else at 3', () => {
    expect(framePositionOf('losing-now')).toBe(1);
    expect(framePositionOf('lost-before-return')).toBe(1);
    expect(framePositionOf('banked')).toBe(3);
    const l = list('W2-late');
    const banked = goal('alchemy-vials.check.daily-attempts', {
      urgency: 'banked',
      framePosition: framePositionOf('banked'),
    });
    const push = goal('metapath.goal.push');
    expect(rankGoals([banked, push], l).map((g) => g.entryId)).toEqual([
      'metapath.goal.push',
      banked.entryId,
    ]);
  });

  it('skill-minigame plays never reach position 1 (not by urgency)', () => {
    const l = list('W2-late');
    expect(l.byUrgency).not.toContain('minigames.check.daily-plays');
    expect(positionOf(l, 'minigames.check.daily-plays')).toBe(3);
  });

  it('a carried-forward item ranks after the last authored position, before unlisted entries', () => {
    const l = list('W2-late');
    expect(l.carryForward).toEqual(['stamps.check.quest-toward']);
    const order = rankGoals(
      [goal('nobody.goal.unlisted'), goal('stamps.check.quest-toward'), goal('classes.goal.level')],
      l,
    ).map((g) => g.entryId);
    expect(order).toEqual(['classes.goal.level', 'stamps.check.quest-toward', 'nobody.goal.unlisted']);
  });

  it('an M9 core step with no unspent points and no level-up signal lands at the last position', () => {
    const l = list('W2-late');
    const core = goal('talents.check.next-step', { atLastPosition: true });
    const order = rankGoals(
      [core, goal('spend.goal.plan'), goal('classes.goal.level', { goalsServed: 1 })],
      l,
    );
    expect(order.map((g) => g.entryId)).toEqual([
      'spend.goal.plan',
      'classes.goal.level',
      'talents.check.next-step',
    ]);
  });

  it('a Stage with no list file yet: the frame alone, the push at 2', () => {
    const l = list('W3-early');
    expect([l.listId, positionOf(l, 'metapath.goal.push'), l.lastPosition]).toEqual([null, 2, 3]);
  });

  it('beyond coverage keeps only positions 1 and 3 (FR-5, D2)', () => {
    const l = list('W2-late', 'beyond');
    expect(l.frameOnly).toBe(true);
    expect(positionOf(l, 'metapath.goal.push')).toBeNull();
    expect(positionOf(l, 'minigames.check.spiketrap')).toBe(1);
    expect(positionOf(l, 'cards.check.empty-slots')).toBe(3);
  });

  it('runMetaPath on the scrubbed W2 save with the lists resolves the W2-late list', () => {
    const r = runMetaPath(stateOf(scrubbed('scrubbed-w2')), loadKb(lists()), NOW);
    expect(r.list.listId).toBe('metapath.priority.w2-late');
  });
});

describe('TR-14 comparator', () => {
  const l = () => list('W2-late');

  it('S6: blockers, then position 1, then the push, then position 3 fills', () => {
    const items = [
      goal('cards.check.empty-slots'),
      goal('metapath.goal.push'),
      goal('alchemy-vials.check.daily-attempts', { urgency: 'banked', framePosition: 3 }),
      goal('minigames.check.spiketrap', { urgency: 'lost-before-return' }),
      goal('colosseum.check.collect-tickets', { urgency: 'losing-now', framePosition: 1 }),
      goal('arcade.check.balls-cap', { category: 'blocker' }),
    ];
    expect(rankGoals(items, l()).map((g) => g.entryId)).toEqual([
      'arcade.check.balls-cap',
      'colosseum.check.collect-tickets',
      'minigames.check.spiketrap',
      'metapath.goal.push',
      'alchemy-vials.check.daily-attempts',
      'cards.check.empty-slots',
    ]);
  });

  it('urgency then deadline: a lost-before-return item with a 13-minute deadline ranks above one with none', () => {
    const a = goal('minigames.check.darts-play', { urgency: 'lost-before-return' });
    const b = goal('minigames.check.spiketrap', {
      urgency: 'lost-before-return',
      deadline: NOW + 13 * 60_000,
    });
    expect(rankGoals([a, b], l()).map((g) => g.entryId)).toEqual([b.entryId, a.entryId]);
  });

  it('is transitive across mixed cost units, whatever the emit order', () => {
    const items = [
      goal('x.goal.gems', { cost: { unit: 'gems', amount: 1 } }),
      goal('x.goal.coins-big', { cost: { unit: 'coins', amount: 1e9 } }),
      goal('x.goal.hours', { cost: { unit: 'hours', amount: 5 } }),
      goal('x.goal.none', { cost: { unit: 'none', amount: 0 } }),
      goal('x.goal.null', { cost: null }),
      goal('x.goal.coins-small', { cost: { unit: 'coins', amount: 10 } }),
    ];
    const want = [
      'x.goal.none',
      'x.goal.hours',
      'x.goal.coins-small',
      'x.goal.coins-big',
      'x.goal.gems',
      'x.goal.null',
    ];
    for (let k = 0; k < items.length; k++) {
      const rotated = [...items.slice(k), ...items.slice(0, k)].reverse();
      expect(rankGoals(rotated, l()).map((g) => g.entryId)).toEqual(want);
    }
    for (const a of items)
      for (const b of items)
        for (const c of items)
          if (compareGoals(a, b, l()) < 0 && compareGoals(b, c, l()) < 0)
            expect(compareGoals(a, c, l())).toBeLessThan(0);
  });

  it('fresh before Stale, then closest Milestone, then most Goals served, then id', () => {
    const order = rankGoals(
      [
        goal('x.goal.d'),
        goal('x.goal.c', { goalsServed: 3 }),
        goal('x.goal.b', { milestoneEtaSeconds: 60 }),
        goal('x.goal.a', { stale: true, milestoneEtaSeconds: 1 }),
      ],
      l(),
    ).map((g) => g.entryId);
    expect(order).toEqual(['x.goal.b', 'x.goal.c', 'x.goal.d', 'x.goal.a']);
  });

  it('FR-20: a contested entry that would sort first lands second, below the first non-contested Goal', () => {
    const cogs = goal('construction.goal.cogs', { contested: true });
    const subclass = goal('metapath.goal.subclass', { cost: { unit: 'gems', amount: 1 } });
    expect(rankGoals([subclass, cogs], l()).map((g) => g.entryId)).toEqual([
      'metapath.goal.subclass',
      'construction.goal.cogs',
    ]);
    // Nothing to move it below: it stays.
    expect(rankGoals([cogs], l())).toEqual([cogs]);
  });

  it('FR-21: an unlisted entry ranks after every listed position', () => {
    const order = rankGoals([goal('nobody.goal.unlisted'), goal('metapath.goal.next-character')], l());
    expect(order.map((g) => g.entryId)).toEqual(['metapath.goal.next-character', 'nobody.goal.unlisted']);
  });
});
