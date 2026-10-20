// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-11, US-2: what this Rift level's task needs (V1: the game client's RiftStuff tables, read from
// Toolbox's `riftInfo` text). `kind: afk` fires when the task is AFK kills, it isn't met, and nobody is
// AFK on The Rift. `kind: active` fires when the task is played (timed kills, tears, skull points, N
// characters, or a score on an elite the account has); a score task with no such elite is
// `rift/class-gate`'s. Silent once the quota is met (`rift/quota-done`). `task` is the game's own
// task clause (a lookup value), so the text can't drift from it.
import { z } from 'zod';
import { accountSubject, atRift, RIFT_READS, riftOf, shownLevel, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'rift/task-kind',
  kind: 'check',
  system: 'rift',
  params: z.strictObject({ kind: z.enum(['afk', 'active']) }),
  slots: z
    .strictObject({
      level: z.number(),
      quota: z.number(),
      progress: z.number(),
      task: z.string(),
      afk: z.number(),
    })
    .partial(),
  reads: [...RIFT_READS],
  examples: {
    fires: [
      // fourth.json: level 2 (shown 3), "defeat all mobs before they respawn on 3 characters", 1 done.
      {
        fixture: 'fourth',
        params: { kind: 'active' },
        expect: { slots: { level: 3, quota: 3, progress: 1 } },
      },
      {
        fixture: 'fourth',
        params: { kind: 'afk' },
        mutate: (s) => atRift(s, 9, 12000),
        expect: { slots: { level: 10, quota: 200000, progress: 12000 } },
      },
      // A score task with the elite on the account (first.json has a Divine Knight).
      { fixture: 'first', params: { kind: 'active' }, mutate: (s) => atRift(s, 7, 90) },
    ],
    silent: [
      { fixture: 'fourth', params: { kind: 'afk' } },
      // Somebody is already AFK on The Rift.
      { fixture: 'fourth', params: { kind: 'afk' }, mutate: (s) => atRift(s, 9, 0, { afkOnRift: [0] }) },
      // The quota is met: rift/quota-done says so instead.
      { fixture: 'fourth', params: { kind: 'afk' }, mutate: (s) => atRift(s, 9, 200000) },
      // A score task with no such elite: rift/class-gate's.
      {
        fixture: 'fourth',
        params: { kind: 'active' },
        mutate: (s) =>
          atRift(s, 7, 0, { elites: { Divine_Knight: [], Siege_Breaker: [], Elemental_Sorcerer: [] } }),
      },
      { fixture: 'first', params: { kind: 'active' } },
      { fixture: 'highend', params: { kind: 'active' } },
      { fixture: 'scrubbed-w3', params: { kind: 'active' } },
    ],
    unknown: [
      { fixture: 'fourth', params: { kind: 'active' }, mutate: (s) => withUnknown(s, 'account.rift') },
    ],
  },
  run({ state }, { kind }) {
    const r = riftOf(state);
    if (r === 'unknown')
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    if (r === null || !r.unlocked || !r.task || r.complete || r.task.quota === null) return [];
    const t = r.task;
    const slots = {
      level: shownLevel(r),
      quota: t.quota ?? 0,
      progress: r.progress,
      task: t.text,
      afk: r.afkOnRift.length,
    };
    const fires = [{ subject: accountSubject, slots, result: 'fires' as const, doneKey: `rift-${r.level}` }];
    if (kind === 'afk') return t.kind === 'afk' && r.afkOnRift.length === 0 ? fires : [];
    if (t.kind === 'afk' || t.kind === 'end') return [];
    if (t.kind === 'score' && (!t.elite || (r.elites[t.elite] ?? []).length === 0)) return [];
    return fires;
  },
});
