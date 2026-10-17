// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// classifySave / stampedSlot against the 2026-10-17 live recording (ticket #38): an autosave stamps
// the current character, a switch save stamps the character just left.
import type { AccountState } from '@idleon-forge/account-state';
import { describe, expect, it } from 'vitest';
import { classifySave, stampedSlot } from '../src';

/** A state at `t` whose characters last saved `secondsAgo[i]` seconds earlier. */
const state = (t: number, secondsAgo: Array<number | null>): AccountState =>
  ({
    asOf: t,
    characters: secondsAgo.map((s, index) => ({ index, secondsSinceLastSave: s })),
  }) as unknown as AccountState;

describe('stampedSlot', () => {
  it('is the character with the newest own save time', () => {
    expect(stampedSlot(state(0, [233, 0, 535]))).toBe(1);
  });

  it('is null on a tie within 1 s, or with no save times', () => {
    expect(stampedSlot(state(0, [0, 0, 500]))).toBeNull();
    expect(stampedSlot(state(0, [null, null]))).toBeNull();
    expect(stampedSlot(state(0, []))).toBeNull();
  });
});

describe('classifySave', () => {
  it('the first save, or one whose slot is unknown, is "first"', () => {
    expect(classifySave(null, state(0, [0, 300]))).toEqual({ kind: 'first', slot: 0 });
    expect(classifySave(state(0, [0, 0]), state(1, [0, 300]))).toEqual({ kind: 'first', slot: 0 });
  });

  it('the synthetic sequence: autosave A, autosave A, switch (stamps A), autosave B, switch (stamps B)', () => {
    // Slots: A = 0, B = 1. Times in seconds; offsets are each character's age at the save.
    const seq = [
      state(0, [0, 600]), //       autosave A
      state(240, [0, 840]), //     autosave A
      state(300, [0, 900]), //     switch away from A: stamps A again
      state(540, [240, 0]), //     autosave B
      state(560, [260, 0]), //     switch away from B: stamps B again
    ].map((s) => ({ ...s, asOf: s.asOf * 1000 }));
    const kinds = seq.map((s, i) => classifySave(seq[i - 1] ?? null, s));
    expect(kinds).toEqual([
      { kind: 'first', slot: 0 },
      { kind: 'autosave', slot: 0 },
      // A switch save that stamps the character the autosaves stamped can't be told from them.
      { kind: 'autosave', slot: 0 },
      { kind: 'switch-leave', slot: 1 },
      { kind: 'autosave', slot: 1 },
    ]);
  });

  it('the live recording: slots 0, 0, 1, 2, 4, 4 (saves 1–6 of 2026-10-17)', () => {
    // Per-character ages (s) exactly as recorded, names left out.
    const seq = [
      state(0, [0, 233, 535, 523, 509]),
      state(17, [0, 250, 552, 540, 526]),
      state(47, [28, 0, 580, 568, 554]),
      state(93, [73, 45, 0, 613, 599]),
      state(246, [224, 196, 151, 764, 0]),
      state(487, [465, 437, 392, 1005, 0]),
    ].map((s) => ({ ...s, asOf: s.asOf * 1000 }));
    expect(seq.map(stampedSlot)).toEqual([0, 0, 1, 2, 4, 4]);
    expect(seq.map((s, i) => classifySave(seq[i - 1] ?? null, s).kind)).toEqual([
      'first',
      'autosave', //     save 2 was the switch leaving slot 0: not visible until save 3
      'switch-leave', // save 3 left slot 1
      'switch-leave', // save 4 left slot 2
      'switch-leave', // save 5 is the first autosave on slot 4: reads as a leave; save 6 corrects it
      'autosave',
    ]);
  });
});
