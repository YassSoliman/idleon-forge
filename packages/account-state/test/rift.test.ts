// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-11 contract tests: `account.rift` on the W4 and past-W4 public saves, and V1: each level's task
// and quota as read from Toolbox's `riftInfo` text equal the game client's own tables.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RIFT_MAX_LEVEL, riftTaskOf } from '../src';
import { accountStateOf, editedSave, PUBLIC_DIR, readSave } from './helpers';

/**
 * Game client N.js (sha256 42da3130...b8b204, game 2.3.540, docs/research/game-client/builds.json),
 * `CustomLists.RiftStuff`: [4] the task id of each `Rift[0]` (first 70 of 100), [5] each task's quota.
 */
const CLIENT_TASK_OF_LEVEL = (
  '0 2 4 0 3 13 3 6 8 1 2 12 0 4 10 7 12 6 3 10 4 7 12 0 11 2 8 3 6 11 13 0 1 4 11 7 2 3 11 11 4 12 6 8 11 10 ' +
  '3 2 11 11 11 11 11 11 11 11 11 11 11 14 0 12 3 14 7 9 9 9 9 9'
)
  .split(' ')
  .map(Number);
const CLIENT_QUOTA_OF_TASK = [500, 200000, 3, 4, 3, 2, 180, 75, 60, 1, 1000000, 5000000, 5000, 1000, 11, 12];
/** The client's `RiftTaskProgress` callers: AFK gains add to 1/10/11; score tasks keep the best (6-8); 'name' counts characters (3, 5, 14, 15; 4 is per character too). */
const CLIENT_KIND_OF_TASK = [
  'active',
  'afk',
  'active',
  'characters',
  'characters',
  'characters',
  'score',
  'score',
  'score',
  'end',
  'afk',
  'afk',
  'active',
  'active',
  'characters',
  'characters',
];

const shared = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL('../../toolbox-parsers/vendor/data/website-data/shared-data.json', import.meta.url),
    ),
    'utf8',
  ),
) as { riftInfo: unknown[] };

describe('riftInfo tasks agree with the game client (V1)', () => {
  it('has 65 real levels and 5 end rows', () => {
    expect(shared.riftInfo).toHaveLength(70);
    expect(riftTaskOf(RIFT_MAX_LEVEL - 1, shared.riftInfo[RIFT_MAX_LEVEL - 1])?.kind).not.toBe('end');
    expect(riftTaskOf(RIFT_MAX_LEVEL, shared.riftInfo[RIFT_MAX_LEVEL])?.kind).toBe('end');
  });
  it.each(shared.riftInfo.map((row, level) => [level, row] as const))('level %i', (level, row) => {
    const t = riftTaskOf(level, row);
    const id = CLIENT_TASK_OF_LEVEL[level] as number;
    expect(t?.kind).toBe(CLIENT_KIND_OF_TASK[id]);
    if (id !== 9) expect(t?.quota).toBe(CLIENT_QUOTA_OF_TASK[id]);
    if (id >= 6 && id <= 8)
      expect(t?.elite).toBe(['Divine_Knight', 'Siege_Breaker', 'Elemental_Sorcerer'][id - 6]);
  });
});

describe('account.rift on the public saves', () => {
  it('first.json: World 4, Rift Ripper not done, so locked at level 0', () => {
    const r = accountStateOf(readSave(PUBLIC_DIR, 'first.json')).account.rift;
    expect(r).toBeTruthy();
    expect(r?.unlocked).toBe(false);
    expect(r?.level).toBe(0);
    expect(r?.questItems.map((i) => [i.rawName, i.amount])).toEqual([
      ['GalaxyA2b', 5],
      ['GalaxyA1', 878],
      ['GalaxyB2', 592],
    ]);
    expect(r?.task?.kind).toBe('active');
    expect(r?.upcoming).toHaveLength(10);
    expect(r?.bonuses).toHaveLength(12);
    expect(r?.bonuses.every((b) => !b.unlocked)).toBe(true);
    // A Divine Knight, a Siege Breaker and an Elemental Sorcerer are on the account.
    expect(Object.values(r?.elites ?? {}).every((e) => e.length === 1)).toBe(true);
  });
  it('fourth.json: unlocked, level 2, one point of progress', () => {
    const r = accountStateOf(readSave(PUBLIC_DIR, 'fourth.json')).account.rift;
    expect(r?.unlocked).toBe(true);
    expect(r?.level).toBe(2);
    expect(r?.progress).toBe(1);
    expect(r?.task?.kind).toBe('characters');
    expect(r?.task?.quota).toBe(3);
    expect(r?.complete).toBe(false);
    expect(r?.afkOnRift).toEqual([]);
  });
  it('highend.json: the last level, every bonus unlocked', () => {
    const r = accountStateOf(readSave(PUBLIC_DIR, 'highend.json')).account.rift;
    expect(r?.level).toBe(65);
    expect(r?.task?.kind).toBe('end');
    expect(r?.upcoming).toEqual([]);
    expect(r?.bonuses.every((b) => b.unlocked)).toBe(true);
  });
  it('reads an AFK fighter on The Rift and a met quota', () => {
    const save = editedSave(readSave(PUBLIC_DIR, 'fourth.json'), (d) => {
      d.Rift = [9, 250000, 'a,b,', 0, 0, 0, 0, 0, 0, 0];
      d.AFKtarget_0 = 'riftAll';
    });
    const r = accountStateOf(save).account.rift;
    expect(r?.task?.kind).toBe('afk');
    expect(r?.task?.quota).toBe(200000);
    expect(r?.complete).toBe(true);
    expect(r?.countedChars).toBe(2);
    expect(r?.afkOnRift).toEqual([0]);
  });
});
