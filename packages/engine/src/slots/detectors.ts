// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20's engine Detectors (TR-4, M11 TR-4 `kind: 'engine'`), behind the Detector contract so `kb check`
// runs their examples on the scrubbed saves and records what they read. The Goals, rows and pictures are
// built by the engine modules (module.ts), which also read M2's result; these return the save-only parts.
import { defineDetector } from '@idleon-forge/knowledge';
import { z } from 'zod';

const slots = z.strictObject({ text: z.string(), why: z.string() });
const none = z.strictObject({});

export const randomEventsDetector = defineDetector({
  id: 'random-events/today',
  kind: 'engine',
  system: 'random-events',
  params: none,
  slots,
  reads: ['account.randomEvents', 'account.currentWorld'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { doneToday: false } }],
    silent: [
      {
        fixture: 'scrubbed-w3',
        mutate: (s) => ({
          ...s,
          account: {
            ...s.account,
            randomEvents: s.account.randomEvents && { ...s.account.randomEvents, doneToday: true },
          },
        }),
      },
    ],
  },
  run: ({ state }) => {
    const r = state.account.randomEvents;
    if (!r || r.doneToday) return [];
    const world = state.account.currentWorld ?? 1;
    return [
      { doneToday: false, reachable: r.schedule.filter((e) => e.world >= 1 && e.world <= world).length },
    ];
  },
});

export const killroyRoomsDetector = defineDetector({
  id: 'killroy/rooms',
  kind: 'engine',
  system: 'killroy',
  params: none,
  slots,
  reads: ['account.killroy', 'account.currentWorld'],
  examples: {
    fires: [{ fixture: 'scrubbed-w2', expect: { roomsOpen: 1, done: 0 } }],
    silent: [{ fixture: 'scrubbed-w3' }],
  },
  run: ({ state }) => {
    const k = state.account.killroy;
    if (!k || (state.account.currentWorld ?? 0) < 2) return [];
    let done = 0;
    for (let r = 1; r <= k.roomsOpen; r++) if (String(Math.trunc(k.doneCode)).includes(String(r))) done++;
    return done === k.roomsOpen ? [] : [{ roomsOpen: k.roomsOpen, done }];
  },
});

export const killroySkullsDetector = defineDetector({
  id: 'killroy/skulls',
  kind: 'engine',
  system: 'killroy',
  params: none,
  slots,
  reads: ['account.killroy'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { skulls: 6 } }],
    silent: [{ fixture: 'scrubbed-w2' }],
  },
  run: ({ state }) => {
    const k = state.account.killroy;
    return k && k.skulls > 0 ? [{ skulls: k.skulls, packsBought: k.arcadePacksBought }] : [];
  },
});

export const weeklyBattleDetector = defineDetector({
  id: 'weekly-battles/raid',
  kind: 'engine',
  system: 'weekly-battles',
  params: none,
  slots,
  reads: ['account.weeklyBattle', 'account.currentWorld'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { best: 0 } }],
    silent: [
      {
        fixture: 'scrubbed-w3',
        mutate: (s) => ({
          ...s,
          account: { ...s.account, weeklyBattle: { bestDifficulty: 2, raidResetUsedToday: false } },
        }),
      },
    ],
  },
  run: ({ state }) => {
    const w = state.account.weeklyBattle;
    if (!w || (state.account.currentWorld ?? 0) < 2 || w.bestDifficulty >= 1) return [];
    return [{ best: w.bestDifficulty }];
  },
});

/** The row-only Checks (D-4): ballot, Pet Tournament, daily tasks and guild tasks, one row each. */
export const checklistRowsDetector = defineDetector({
  id: 'checklist/rows',
  kind: 'engine',
  system: 'checklist',
  params: z.strictObject({
    row: z.enum(['ballot', 'pet-tournament', 'daily-tasks', 'guild-daily', 'guild-weekly']),
  }),
  slots,
  reads: ['account.ballot', 'account.petTournament', 'account.taskBoardDailies', 'account.guildTasks'],
  examples: {
    fires: [{ fixture: 'scrubbed-w2', params: { row: 'ballot' }, expect: { row: 'ballot', open: true } }],
    silent: [{ fixture: 'scrubbed-w2', params: { row: 'guild-daily' } }],
  },
  run: ({ state }, { row }) => {
    const a = state.account;
    switch (row) {
      case 'ballot':
        return a.ballot ? [{ row, open: true, votedWeek: a.ballot.votedWeek }] : [];
      case 'pet-tournament':
        return a.petTournament && a.petTournament.petsOwned > 0
          ? [{ row, open: true, registered: a.petTournament.registeredThroughDay > a.petTournament.day }]
          : [];
      case 'daily-tasks': {
        const open = (a.taskBoardDailies ?? []).filter((t) => t.unlocked);
        return open.length
          ? [{ row, open: true, done: open.filter((t) => t.done).length, of: open.length }]
          : [];
      }
      default: {
        const g = a.guildTasks;
        if (!g?.member) return [];
        const list = row === 'guild-daily' ? g.daily : g.weekly;
        return [{ row, open: true, met: list.filter((t) => t.met).length, of: list.length }];
      }
    }
  },
});

export const cogSeatDetector = defineDetector({
  id: 'construction/cog-seat-free',
  kind: 'engine',
  system: 'construction',
  params: none,
  slots,
  reads: ['account.cogBoard', 'characters[*].slots', 'account.currentWorld'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { inventory: 1, free: 1 } }],
    silent: [{ fixture: 'scrubbed-w2' }],
  },
  run: ({ state }) => {
    const b = state.account.cogBoard;
    if (!b || (state.account.currentWorld ?? 0) < 3) return [];
    const inventory = state.characters.filter((c) => c.slots?.cogPlace?.kind === 'inventory').length;
    const free = b.squares.filter((s) => s === 'open').length;
    return inventory + free > 0 ? [{ inventory, free }] : [];
  },
});

export const noSkullDetector = defineDetector({
  id: 'worship/no-skull',
  kind: 'engine',
  system: 'worship',
  params: none,
  slots,
  reads: ['characters[*].slots', 'account.currentWorld'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { without: 6 } }],
    silent: [{ fixture: 'scrubbed-w2' }],
  },
  run: ({ state }) => {
    if ((state.account.currentWorld ?? 0) < 3 || !state.characters.every((c) => c.slots)) return [];
    const without = state.characters.filter((c) => c.slots?.skull === null).length;
    return without > 0 ? [{ without }] : [];
  },
});

export const trappingStartDetector = defineDetector({
  id: 'trapping/start',
  kind: 'engine',
  system: 'trapping',
  params: none,
  slots,
  reads: [
    'characters[*].slots',
    'characters[*].inventoryItems',
    'account.storageItems',
    'account.currentWorld',
  ],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { started: false } }],
    silent: [{ fixture: 'scrubbed-w2' }],
  },
  run: ({ state }) => {
    if ((state.account.currentWorld ?? 0) < 3 || !state.characters.every((c) => c.slots)) return [];
    const held = (r: Record<string, number> | null | undefined) =>
      Object.entries(r ?? {}).some(([k, n]) => k.startsWith('TrapBoxSet') && n > 0);
    const started =
      state.characters.some((c) => c.slots?.trappingStarted || c.slots?.trapSet || held(c.inventoryItems)) ||
      held(state.account.storageItems);
    return started ? [] : [{ started: false }];
  },
});

export const trapSetDetector = defineDetector({
  id: 'trapping/no-trap-set',
  kind: 'engine',
  system: 'trapping',
  params: none,
  slots,
  reads: ['characters[*].slots', 'account.currentWorld'],
  examples: {
    fires: [
      {
        fixture: 'scrubbed-w3',
        mutate: (s) => ({
          ...s,
          characters: s.characters.map((c, i) =>
            i === 4 && c.slots ? { ...c, slots: { ...c.slots, trappingStarted: true } } : c,
          ),
        }),
        expect: { without: 6 },
      },
    ],
    silent: [{ fixture: 'scrubbed-w3' }],
  },
  run: ({ state }) => {
    if ((state.account.currentWorld ?? 0) < 3 || !state.characters.every((c) => c.slots)) return [];
    const started = state.characters.some((c) => c.slots?.trappingStarted || c.slots?.trapSet);
    if (!started) return [];
    const without = state.characters.filter((c) => !c.slots?.trapSet).length;
    return without > 0 ? [{ without }] : [];
  },
});

export const liquidDetector = defineDetector({
  id: 'alchemy/liquid-unstaffed',
  kind: 'engine',
  system: 'alchemy',
  params: none,
  slots,
  reads: ['account.liquids', 'characters[*].slots'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { liquid: 1 } }],
    silent: [{ fixture: 'scrubbed-w2' }],
  },
  run: ({ state }) => {
    const liquids = state.account.liquids;
    if (!liquids) return [];
    const at = state.characters.map((c) => c.slots?.cauldron ?? null);
    const idle = liquids.find((l) => l.unlocked && l.current < l.max / 2 && !at.includes(4 + l.index));
    const counts = [0, 1, 2, 3].map((k) => at.filter((x) => x === k).length);
    return idle && Math.max(...counts) >= 2 ? [{ liquid: idle.index }] : [];
  },
});
