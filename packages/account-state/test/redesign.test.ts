// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-3 contract tests: each preset's star point total (V-2), door kills on every map (V-3) and the
// statue levels (V-4), on the public saves with the worker's Toolbox calls. Never a name.
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { type AccountState, doorKillsOf, isKnown, type PresetTalents, toAccountState } from '../src';
import { editedSave, listJson, NOW, PRIVATE_DIR, PUBLIC_DIR, readSave } from './helpers';

const stateOf = (input: unknown, toolbox = true): AccountState => {
  const envelope = normalizeEnvelope(input);
  return toAccountState(
    parseSave(envelope, { now: NOW }),
    envelope,
    toolbox ? { toolbox: { calls: toolboxCalls, withFrozenClock } } : {},
  );
};
const spent = (p: PresetTalents) => p.star.reduce((n, t) => n + t.base, 0);
/** Each preset's unspent star points (total − spend), active and other. */
const unspent = (s: AccountState) => {
  const active: number[] = [];
  const other: number[] = [];
  for (const c of s.characters) {
    const t = c.talents;
    if (t?.starPoints?.active != null) active.push(t.starPoints.active - spent(t.active));
    if (t?.other && t.starPoints?.other != null) other.push(t.starPoints.other - spent(t.other));
  }
  return { active, other };
};
const zeroOrOne = (x: number) => x === 0 || x === 1;

describe('characters[].talents.starPoints (V-2)', () => {
  it.each(['first.json', 'second.json'])('%s: every active preset totals its spend plus 0–1', (file) => {
    const s = stateOf(readSave(PUBLIC_DIR, file));
    for (const c of s.characters) {
      expect(c.talents?.starPoints?.active, `slot ${c.index}`).toEqual(expect.any(Number));
      if (c.talents?.other)
        expect(c.talents.starPoints?.other, `slot ${c.index}`).toEqual(expect.any(Number));
    }
    const { active } = unspent(s);
    expect(active.length).toBe(s.characters.length);
    expect(active.every(zeroOrOne)).toBe(true);
  });

  it('first.json: the other presets too; second.json: no other preset is over budget', () => {
    expect(unspent(stateOf(readSave(PUBLIC_DIR, 'first.json'))).other.every(zeroOrOne)).toBe(true);
    // second.json leaves points unspent on 8 of its 10 other presets (69 to 254): a real gap. Its
    // per-preset totals differ where Star Player does (2,417 vs 2,268), so it isn't the active total.
    const other = unspent(stateOf(readSave(PUBLIC_DIR, 'second.json'))).other;
    expect(other.every((x) => x >= 0)).toBe(true);
  });

  it('fourth.json: reproduces the active preset 201 points over budget', () => {
    expect(unspent(stateOf(readSave(PUBLIC_DIR, 'fourth.json'))).active).toContain(-201);
  });

  it('is null without the worker’s Toolbox calls, and for a character with no other preset', () => {
    const s = stateOf(readSave(PUBLIC_DIR, 'first.json'), false);
    for (const c of s.characters) expect(c.talents?.starPoints).toEqual({ active: null, other: null });
    const withCalls = stateOf(readSave(PUBLIC_DIR, 'latest.json'));
    for (const c of withCalls.characters)
      if (c.talents && !c.talents.other) expect(c.talents.starPoints?.other).toBeNull();
  }, 30_000); // two full parses
});

describe('characters[].doorKillsLeft (V-3)', () => {
  it.each(listJson(PUBLIC_DIR))('%s: covers every map of every character, door by door', (file) => {
    const save = readSave(PUBLIC_DIR, file) as { data: Record<string, unknown> };
    const s = stateOf(save, false);
    for (const c of s.characters) {
      const doors = c.doorKillsLeft;
      expect(doors, `slot ${c.index}`).toBeTruthy();
      const value = save.data[`KLA_${c.index}`];
      const raw = (typeof value === 'string' ? JSON.parse(value) : value) as unknown[];
      expect(Object.keys(doors ?? {}).length).toBe(raw.length);
      // The current map agrees with M4's portalKillsLeft (the same read, one map), clamped at 0.
      if (c.portalKillsLeft && c.mapIndex !== null && c.mapIndex !== undefined)
        expect(doors?.[c.mapIndex]).toEqual(c.portalKillsLeft.map((n) => Math.max(0, n)));
    }
  });

  it('ceils each value, clamps cleared doors at 0, and keeps the map index', () => {
    expect(doorKillsOf([[0, 0], [-31146.87], [150, 10.2], 'x', [3]])).toEqual([
      [0, 0],
      [0],
      [150, 11],
      [],
      [3],
    ]);
    expect(doorKillsOf([[1, 'x']])).toBeNull();
    expect(doorKillsOf(null)).toBeNull();
  });

  it('a missing KLA_<i> makes that character’s door kills null and Unknown', () => {
    const save = readSave(PUBLIC_DIR, 'latest.json');
    const s = stateOf(
      editedSave(save, (d) => delete d.KLA_0),
      false,
    );
    expect(s.characters.find((c) => c.index === 0)?.doorKillsLeft).toBeNull();
    expect(isKnown(s, 'characters[0].doorKillsLeft')).toBe(false);
  });
});

describe('account.statues (V-4)', () => {
  it.each(listJson(PUBLIC_DIR))(
    '%s: every statue with its highest level, grade and per-character levels',
    (file) => {
      const s = stateOf(readSave(PUBLIC_DIR, file), false);
      const st = s.account.statues;
      expect(st?.length).toBeGreaterThanOrEqual(20);
      for (const x of st ?? []) {
        expect(x.grade).toBeGreaterThanOrEqual(0);
        expect(x.grade).toBeLessThanOrEqual(3);
        // Toolbox's level is the highest character's (getHighestLevelStatues).
        expect(x.byCharacter?.length).toBe(s.characters.length);
        expect(Math.max(0, ...(x.byCharacter ?? []))).toBe(x.level);
      }
    },
  );

  it('a missing StuG makes the statues null and Unknown', () => {
    const s = stateOf(
      editedSave(readSave(PUBLIC_DIR, 'latest.json'), (d) => delete d.StuG),
      false,
    );
    expect(s.account.statues).toBeNull();
    expect(isKnown(s, 'account.statues')).toBe(false);
  });
});

describe.skipIf(listJson(PRIVATE_DIR, '.raw.json').length === 0)('private saves (local only)', () => {
  it.each(listJson(PRIVATE_DIR, '.raw.json'))(
    '%s: the active preset’s star total is at least its spend',
    (file) => {
      const s = stateOf(readSave(PRIVATE_DIR, file));
      for (const c of s.characters) {
        const t = c.talents;
        expect(t?.starPoints?.active).toEqual(expect.any(Number));
        if (t?.starPoints?.active != null) expect(t.starPoints.active >= spent(t.active)).toBe(true);
      }
    },
  );
});
