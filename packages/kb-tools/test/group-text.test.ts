// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-N3, V-10: every Check whose Next Action shows on 3 or more characters of a golden fixture has
// a groupText, and `latest`'s trap line groups by entry id even though its counts differ per row.
import { describe, expect, it } from 'vitest';
import { listFixtures } from '../src/fixtures';
import { goldenContext, repeatSightings } from '../src/golden';
import { groupTextProblems } from '../src/group-text';

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const sightings = repeatSightings(ctx, fixtures);

describe('M21 FR-N3: groupText', () => {
  it('every repeated job on the public fixtures has its grouped sentence', () => {
    expect(sightings.length).toBeGreaterThan(0);
    expect(groupTextProblems(ctx.kb, sightings)).toEqual([]);
  });

  it('flags a repeated Check without groupText, and skips non-Check entries', () => {
    const kb = {
      entries: {
        'a.check.x': { type: 'check' },
        'a.check.y': { type: 'check', groupText: 'Do it once' },
        'a.goal.z': { type: 'goal' },
      },
    } as never;
    const problems = groupTextProblems(kb, [
      { fixtureId: 'f1', entryId: 'a.check.x', characters: 4 },
      { fixtureId: 'f2', entryId: 'a.check.x', characters: 3 },
      { fixtureId: 'f1', entryId: 'a.check.y', characters: 5 },
      { fixtureId: 'f1', entryId: 'a.goal.z', characters: 5 },
    ]);
    expect(problems.map((p) => [p.entryId, p.where])).toEqual([
      ['a.check.x', 'f1 (4 characters), f2 (3 characters)'],
    ]);
  });

  it('V-10: latest groups its trap line by entry id (8 rows, 6 or 7 traps each)', () => {
    const trap = sightings.find(
      (s) => s.fixtureId === 'latest' && s.entryId === 'trapping.check.slots-and-timers',
    );
    expect(trap?.characters).toBe(8);
    const entry = ctx.kb.entries['trapping.check.slots-and-timers'] as { groupText?: string };
    expect(entry.groupText).toBe('Collect and re-place your finished traps');
  });
});
