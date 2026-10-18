// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 acceptance on the two private saves (local only: fixtures/private is gitignored, so these skip in
// CI). By class and level, never by name.
import { describe, expect, it } from 'vitest';
import { hasPrivate, privateFile, run, starGoals, starState } from './helpers';

describe.skipIf(!hasPrivate('yasser'))('the W2-late private save', () => {
  it('one character opens the tree; constellations and signs wait for the hand-in', () => {
    const r = run(starState(privateFile('yasser')));
    const goals = starGoals(r);
    expect(goals.map((g) => g.id)).toEqual(['star-signs.goal.telescope']);
    expect(goals[0]?.nextAction.text).toMatch(/^Move your \w+ Lv \d+ to .+: [\d,]+ more kills open /);
    expect(r.starSigns?.characters.filter((c) => c.canChange === true)).toHaveLength(0);
  });
});

describe.skipIf(!hasPrivate('joseph'))('the W3-early private save', () => {
  it('A-7 and B-1 next, Chronus Cosmos reachable this session, only the Wizard Lv 73 can change signs', () => {
    const r = run(starState(privateFile('joseph')));
    expect(
      starGoals(r)
        .filter((g) => g.id === 'star-signs.goal.constellation')
        .map((g) => g.nextAction.key),
    ).toEqual(['star-signs.goal.constellation@A-7', 'star-signs.goal.constellation@B-1']);
    expect(r.starSigns?.milestone).toBe(
      '21 points ready, 19 needed for Chronus Cosmos (2 signs on every character)',
    );
    const can = r.starSigns?.characters.filter((c) => c.canChange === true) ?? [];
    expect(can.map((c) => c.line.split(' (')[0])).toEqual(['Wizard Lv 73']);
  });
});
