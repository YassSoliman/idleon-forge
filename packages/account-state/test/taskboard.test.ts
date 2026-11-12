// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-26 contract tests: `account.taskBoard`. Each task's stat and level are the raw TaskZZ0 / TaskZZ1
// entries; a claim at level L pays 1 + floor(L/5) merits and floor(x + w*L) task points.
import { describe, expect, it } from 'vitest';
import { meritsAt, pointsAt } from '../src/taskboard';
import { accountStateOf, PUBLIC_DIR, readSave } from './helpers';

type Data = Record<string, unknown>;
const json = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v);

describe.each(['first.json', 'fourth.json', 'highend.json'])('%s', (file) => {
  const save = readSave(PUBLIC_DIR, file) as { data: Data };
  const tb = accountStateOf(save).account.taskBoard;
  const z0 = json(save.data.TaskZZ0) as number[][];
  const z1 = json(save.data.TaskZZ1) as number[][];
  it('reads 8 ranked tasks per world 1-4 from the raw stats and levels', () => {
    expect(tb?.worlds.map((w) => w.world)).toEqual([1, 2, 3, 4]);
    for (const w of tb?.worlds ?? []) {
      expect(w.tasks).toHaveLength(8);
      for (const t of w.tasks) {
        expect(t.stat).toBe(Number(z0[w.world - 1]?.[t.index] ?? 0));
        expect(t.level).toBe(Number(z1[w.world - 1]?.[t.index] ?? 0));
        expect(t.level + t.ready).toBeLessThanOrEqual(t.maxLevel);
        if (t.resetsOnClaim) expect(t.ready).toBeLessThanOrEqual(1);
      }
    }
  });
});

it('the claim pay matches the game: merits 1 + floor(L/5), points floor(x + w*L)', () => {
  expect([0, 4, 5, 9, 10].map(meritsAt)).toEqual([1, 1, 2, 2, 3]);
  expect(pointsAt(10, 2, 7)).toBe(24);
  expect(pointsAt(5, 1, 0)).toBe(5);
});

it('fourth.json: every board open, Maximum Efficiency has one tier waiting (it resets on claim)', () => {
  const tb = accountStateOf(readSave(PUBLIC_DIR, 'fourth.json')).account.taskBoard;
  expect(tb?.worlds.every((w) => w.open)).toBe(true);
  const ready = tb?.worlds.flatMap((w) =>
    w.tasks.filter((t) => t.ready > 0).map((t) => [w.world, t.name, t.ready]),
  );
  expect(ready).toEqual([[2, 'Maximum_Efficiency', 1]]);
  expect(tb?.worlds[3]?.daily).toEqual({ name: 'Cracked_Crystals', done: true });
});
