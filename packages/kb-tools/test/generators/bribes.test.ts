// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import generator from '@idleon-forge/knowledge/generators/bribes.gen';
import { describe, expect, it } from 'vitest';
import { PUBLIC_FIXTURES } from '../../src/paths';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

const b = (name: string, desc: string, value: number, price = 100, effectName = 'X') => ({
  name,
  desc,
  npc: 'pigbank',
  price,
  effectName,
  value,
});

describe('bribes generator', () => {
  it('takes the value field, not the text, and reads sets and sellers from the data (synthetic slice, hand-checked)', () => {
    const out = runOnSlice(generator, {
      bribes: [
        b('Insider_Trading', 'All_stamps_cost_5%_less_coins_to_upgrade.', 8, 750),
        b(
          'The_Art_of_the_Deal',
          'Unlocks_the_next_set_of_7_Bribes_to_be_purchased.',
          2,
          15000,
          'BribeExpansion',
        ),
        b('Two', 'x', 1),
        b(
          'The_Art_of_the_Bail',
          'Unlock_the_next_Bribe_Set_from_the_Garbage_Tuna_on_Trash_Island_in_World_2_to_buy.',
          4,
          1,
          'BribeExpansion',
        ),
        b('Random_Garbage', 'All_random_event_bosses_now_drop_Garbage_Piles_to_give_to_the_Garbage_Tuna.', 1),
      ],
    });
    const v = (i: number) => out.entries?.find((e) => e.id === `bribes.acquisition.bribe-${i}`)?.values;
    expect(v(0)).toMatchObject({ codeValue: 8, price: 750, set: 1, soldBy: 'book' });
    expect(v(1)).toMatchObject({ set: 1, opensSet: 2, opensAtIndex: 2, soldBy: 'book' });
    expect(v(2)).toMatchObject({ set: 2, soldBy: 'book' });
    expect(v(3)).toMatchObject({ set: 2, soldBy: 'garbage-tuna', opensSet: 3 });
    expect(v(4)).toMatchObject({ set: 3, soldBy: 'garbage-tuna' });
  });

  it('holds its invariants on the pinned data: 41 bribes, book 0–25, the Bail sold by the Garbage Tuna', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    expect(out.entries).toHaveLength(41);
    const v = (i: number) => out.entries.find((e) => e.id === `bribes.acquisition.bribe-${i}`)?.values;
    // Hand-checked in shared-data bribes: Insider Trading's text says 5% but its value is 8 (M7 TR-6).
    expect(v(0)).toMatchObject({ name: 'Insider_Trading', codeValue: 8, price: 750, set: 1 });
    for (let i = 0; i <= 25; i++) expect(v(i)?.soldBy).toBe('book');
    expect(v(26)).toMatchObject({ name: 'The_Art_of_the_Bail', soldBy: 'garbage-tuna', set: 4 });
    expect(v(33)).toMatchObject({ name: 'The_Art_of_the_Grail', soldBy: 'jade-emporium' });
    // Sets by the BribeExpansion values: 0–5, 6–12, 13–19, 20–26 are sets 1–4.
    expect([5, 6, 12, 13, 19, 20, 26].map((i) => v(i)?.set)).toEqual([1, 2, 2, 3, 3, 4, 4]);
  });

  it("matches Toolbox's parsed bribes and the raw BribeStatus on a known save", async () => {
    const out = await runLive(generator);
    const parsed = knownSave('latest.json').account.bribes as {
      name: string;
      price: number;
      value: number;
      done: boolean;
    }[];
    const raw = JSON.parse(readFileSync(path.join(PUBLIC_FIXTURES, 'latest.json'), 'utf8')) as {
      data: { BribeStatus: number[] | string };
    };
    const status =
      typeof raw.data.BribeStatus === 'string' ? JSON.parse(raw.data.BribeStatus) : raw.data.BribeStatus;
    for (const e of out.entries) {
      const i = e.values.index as number;
      expect(parsed[i]?.name).toBe(e.values.name);
      expect(parsed[i]?.price).toBe(e.values.price);
      expect(parsed[i]?.value).toBe(e.values.codeValue);
      expect(parsed[i]?.done).toBe(status[i] === 1);
    }
  });
});
