// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 RT-21: the historyOf test builder.
import { describe, expect, it } from 'vitest';
import { PUBLIC_SAVES, publicState } from '../core/helpers';
import { engineHistory, historyOf, sessionOf, shiftedState } from './history-of';

const base = publicState(PUBLIC_SAVES[0] as string);
const saved = base.account.lastCloudSave as number;
const first = base.characters[0];

describe('historyOf', () => {
  it('makes earlier saves, oldest first, with shifted clocks', () => {
    const h = historyOf(base, [{ minutesBefore: 10 }, { minutesBefore: 600 }]);
    expect(h.map((e) => saved - e.lastCloudSave)).toEqual([600 * 60_000, 10 * 60_000]);
    expect(h[0]?.state.asOf).toBe(base.asOf - 600 * 60_000);
    expect(h[0]?.state.account.lastCloudSave).toBe(h[0]?.lastCloudSave);
    expect(h[0]?.receivedAt).toBe(h[0]?.lastCloudSave);
  });

  it('changes only the levels it names and never touches the base', () => {
    if (!first) throw new Error('fixture has no character');
    const h = historyOf(base, [{ minutesBefore: 60, levels: { [first.index]: first.level - 2 } }]);
    expect(h[0]?.state.characters[0]?.level).toBe(first.level - 2);
    expect(h[0]?.state.characters[1]?.level).toBe(base.characters[1]?.level);
    expect(base.characters[0]?.level).toBe(first.level);
  });

  it('rejects a step at or after the base save', () => {
    expect(() => historyOf(base, [{ minutesBefore: 0 }])).toThrow(/before the base save/);
  });

  it('sessionOf spaces saves across a previous Play Session', () => {
    const steps = sessionOf({ endedMinutesBefore: 540, lengthMinutes: 30, everyMinutes: 10 });
    expect(steps.map((s) => s.minutesBefore)).toEqual([570, 560, 550, 540]);
    const h = engineHistory(historyOf(base, steps), saved);
    expect(h.entries).toHaveLength(4);
    expect(h.sessionStartedAt).toBe(saved);
  });

  it('shiftedState moves asOf and the save together', () => {
    const s = shiftedState(base, 5 * 60_000);
    expect(base.asOf - s.asOf).toBe(5 * 60_000);
  });
});
