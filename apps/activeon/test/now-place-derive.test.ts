// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (area I-now): the Now place's grouping of engine facts (now/place/derive.ts). Hand-built views,
// class + level only. It must add no judgement: the hero's word follows the counter, then what is full.
import type { NowView, TimelineView } from '@idleon-forge/engine/now';
import { describe, expect, it } from 'vitest';
import {
  awayParts,
  cardState,
  dailyPart,
  fullGroups,
  fullSet,
  heroState,
  lossesNow,
  miniMarks,
  roundNext,
} from '../src/now/place/derive';
import { NOW_PLACE_WORDS } from '../src/now/place/words';

const cap = (entryId: string, label: string, fullNow: boolean) => ({
  key: `${entryId}@x`,
  entryId,
  label,
  fullNow,
});
const row = (index: number, position: number, kind: 'ready' | 'fix' | 'unknown', caps: unknown[] = []) => ({
  index,
  position,
  classLabel: ['Barbarian', 'Shaman', 'Bowman', 'Squire'][index] ?? 'Hunter',
  level: 70 + index,
  activity: 'Fighting Snowman',
  map: index === 3 ? 'Bloque Town' : "Rollin' Tundra",
  pill: { kind, text: kind },
  caps,
  summary: 'Craft Copper Boots',
});

const W = 'worship.check.charge-caps-no-skull';
const view = {
  roster: [
    row(2, 1, 'ready', [cap(W, 'Worship full · spend', true)]),
    row(0, 2, 'fix', [cap(W, 'Worship full · spend', true)]),
    row(1, 3, 'ready', [cap('anvil.check.full', 'Anvil full · collect', false)]),
    row(3, 4, 'unknown'),
  ],
  account: {
    goals: [
      {
        id: 'g',
        blocker: false,
        action: { entryId: 'colosseum.check.collect-tickets', text: 'Collect 4 Colosseum tickets' },
      },
    ],
  },
} as unknown as NowView;

const NOW = 1_000_000;
const bar = (o: Record<string, unknown>) => ({
  state: 'open',
  untimed: false,
  fullNow: false,
  key: String(o.label),
  kind: 'storage',
  kindWord: 'full',
  system: 'anvil',
  ...o,
});
const timeline = {
  axis: { start: NOW, returnAt: NOW + 8 * 3_600_000, ticks: [] },
  lanes: [
    {
      kind: 'character',
      index: 2,
      bars: [
        bar({ entryId: W, what: 'worship charge', label: 'Worship full · spend', at: NOW, fullNow: true }),
        bar({ entryId: 'anvil', what: 'anvil', label: 'anvil full', at: NOW + 3_600_000 }),
      ],
      untimed: [],
    },
    {
      kind: 'character',
      index: 1,
      bars: [bar({ entryId: 'anvil', what: 'anvil', label: 'anvil full', at: NOW + 3_700_000 })],
      untimed: [],
    },
  ],
  accountLanes: [
    {
      kind: 'account',
      index: null,
      bars: [
        bar({
          entryId: 'colosseum.check.collect-tickets',
          what: 'Colosseum tickets',
          label: 'Colosseum tickets lost',
          at: NOW,
          fullNow: true,
          kind: 'bank',
          kindWord: 'lost',
        }),
      ],
      untimed: [],
    },
    {
      kind: 'account',
      index: null,
      bars: [
        bar({
          entryId: 'refinery.fuel',
          what: 'salt fuel',
          label: 'salt fuel runs out',
          at: NOW + 6 * 3_600_000,
          system: 'refinery',
        }),
      ],
      untimed: [],
    },
  ],
} as unknown as TimelineView;

describe('the hero and the cards agree (red-team #2)', () => {
  it('groups what is full now, in Visit Order, named by the Timeline bar ("worship charge")', () => {
    const groups = fullGroups(timeline, view);
    expect(groups).toEqual([{ entryId: W, what: 'worship charge', verb: 'spend', indexes: [2, 0] }]);
  });

  it('a full cap without a Timeline bar takes its words from the pill ("Anvil full · collect" → anvil)', () => {
    const v = {
      ...view,
      roster: [row(1, 1, 'ready', [cap('anvil.check.full', 'Anvil full · collect', true)])],
    } as unknown as NowView;
    expect(fullGroups(null, v)[0]).toMatchObject({ what: 'anvil', verb: 'collect', indexes: [1] });
  });

  it('the verdict: fixes first, then Collect, then Ready; Unknown when nothing is judged', () => {
    const groups = fullGroups(timeline, view);
    expect(heroState(1, null, groups)).toBe('fix');
    expect(heroState(0, { covered: true }, groups)).toBe('collect');
    expect(heroState(0, { covered: true }, [])).toBe('ready');
    expect(heroState(0, null, [])).toBe('unknown');
  });

  it('a card says Fix first over Collect, Collect when full, Ready otherwise, never Ready beside a full cap', () => {
    const full = fullSet(fullGroups(timeline, view));
    expect(view.roster.map((r) => cardState(r, full))).toEqual(['collect', 'fix', 'ready', 'unknown']);
  });
});

describe('the account and the Away line', () => {
  it('an account limit losing value now carries its Goal sentence', () => {
    expect(lossesNow(timeline, view)).toEqual([
      {
        entryId: 'colosseum.check.collect-tickets',
        label: 'Colosseum tickets lost',
        action: 'Collect 4 Colosseum tickets',
      },
    ]);
  });

  it('the Away line says what filled up, what is lost, and that everyone still fights', () => {
    const parts = awayParts(fullGroups(timeline, view), lossesNow(timeline, view), view, NOW_PLACE_WORDS);
    expect(parts).toEqual(['2 worship charges filled up', 'Colosseum tickets lost', 'all 4 still fighting']);
  });
});

describe('the mini-timeline', () => {
  it("marks each character's next limit and each account limit before you are back, never one full now", () => {
    const marks = miniMarks(timeline, view, () => 'in 1h');
    expect(marks.map((m) => [m.index, m.label, Number(m.x.toFixed(3)), m.row])).toEqual([
      [2, 'anvil full', 0.125, 0],
      [1, 'anvil full', 0.128, 1],
      [null, 'salt fuel runs out', 0.75, 0],
    ]);
    expect(marks[0]?.a11y).toBe('Bowman 72: anvil full in 1h');
  });
});

describe('the round and the rail', () => {
  it('the round starts at the first character in Visit Order not opened yet', () => {
    expect(roundNext(view, [])?.index).toBe(2);
    expect(roundNext(view, [2, 0])?.index).toBe(1);
  });

  it('the rail lists three daily rows lost at the reset and counts the rest', () => {
    const r = (label: string, state = 'todo') => ({ id: label, label, state, details: [] });
    const part = dailyPart({
      rings: { today: { done: 1, total: 13 }, week: { done: 0, total: 4 } },
      dailyText: 'daily reset in 12h 09m',
      bands: [
        { band: 'no-bank', rows: [r('a'), r('b'), r('c'), r('d'), r('e', 'waiting')] },
        { band: 'banks', rows: [r('f')] },
        { band: 'weekly', rows: [r('g'), r('h')] },
      ],
    } as never);
    expect(part?.rows.map((x) => x.label)).toEqual(['a', 'b', 'c']);
    expect([part?.moreToday, part?.moreWeek]).toEqual([2, 2]);
  });
});
