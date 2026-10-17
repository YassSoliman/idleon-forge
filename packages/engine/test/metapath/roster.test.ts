// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M2 roster and Roles: S4 (next character), S5 (Roles), S7 (subclass nudge), FR-10 / F17 (swap token).
import type { AccountState } from '@idleon-forge/account-state';
import { describe, expect, it } from 'vitest';
import { analyzeRoster, lookupOf, roleOwnersOf, runMetaPath } from '../../src/metapath';
import { hasPrivate, loadKb, NOW, privateFixture, scrubbed, stateOf } from './helpers';
import { account, char } from './synthetic';

const kb = () => loadKb();
const run = (s: AccountState) => runMetaPath(s, kb(), NOW);
const w2 = [scrubbed('scrubbed-w2'), ...(hasPrivate('yasser') ? [privateFixture('yasser')] : [])];
const w3 = [scrubbed('scrubbed-w3'), ...(hasPrivate('joseph') ? [privateFixture('joseph')] : [])];
/** Slot -> class and level, never a name. */
const who = (s: AccountState, i: number) => {
  const c = s.characters.find((x) => x.index === i);
  return `${c?.class} ${c?.level}`;
};
const roleSet = (r: ReturnType<typeof run>, s: AccountState, label: string, active = true) => {
  const c = s.characters.find((x) => `${x.class} ${x.level}` === label);
  return (r.roles[c?.index ?? -1] ?? []).filter((x) => x.active === active).map((x) => x.role);
};

describe.each(w2)('S4/S5/S7 on the W2-late account (%s)', (file) => {
  const state = stateOf(file);

  it('S4: 5 of 6 lines (Hunter missing), 5 of 5 slots, a note (not a Goal) for slot 6 at 300', () => {
    const r = run(state);
    expect(r.roster.missingLines).toEqual(['Hunter']);
    expect([r.roster.charactersUsed, r.roster.slotsUnlocked]).toEqual([5, 5]);
    expect(r.roster.nextCharacter).toMatchObject({
      line: 'Hunter',
      slotNumber: 6,
      opensAt: 300,
      gap: 43,
      slotOpen: false,
    });
    expect(r.goals.some((g) => g.entryId === 'metapath.goal.next-character')).toBe(false);
  });

  it('S4: with family level 300 the note becomes the Make a Hunter Goal', () => {
    const r = run({ ...state, account: { ...state.account, familyLevel: 300 } });
    const g = r.goals.find((x) => x.entryId === 'metapath.goal.next-character');
    expect(g?.slots).toEqual({ line: 'Hunter', baseClass: 'Archer', slotNumber: 6 });
  });

  it('S5: Construction and Worship are dormant at W2-late; nobody owns Trapping', () => {
    const r = run(state);
    expect(roleSet(r, state, 'Squire 43', false)).toEqual(expect.arrayContaining(['construction-builder']));
    expect(roleSet(r, state, 'Wizard 56', false)).toEqual(expect.arrayContaining(['worship']));
    expect(roleOwnersOf(r, 'Trapping')).toEqual([]);
  });

  it('S7: no subclass Goal (everyone is subclassed); a Lv 12 Archer gets one, holds Hunter, Stage stays', () => {
    expect(run(state).goals.filter((g) => g.entryId === 'metapath.goal.subclass')).toEqual([]);
    const archer = char(5, 'Archer', 12);
    const r = run({ ...state, characters: [...state.characters, archer] });
    expect(r.stage.id).toBe('W2-late');
    expect(r.goals.filter((g) => g.entryId === 'metapath.goal.subclass').map((g) => g.subject)).toEqual([
      { kind: 'character', index: 5 },
    ]);
    expect(r.roster.slots.find((x) => x.characterIndex === 5)).toMatchObject({
      line: 'Hunter',
      status: 'tentative',
    });
    expect(r.roster.nextCharacter?.line).not.toBe('Hunter');
  });
});

describe.each(w3)('S4/S5 on the W3-early account (%s)', (file) => {
  const state = stateOf(file, { rates: 'toolbox' });

  it('S4: the Squire 51 is the on-path 2nd Squire; next is Hunter at 500 (121 to go); no swap token', () => {
    const r = run(state);
    const second = r.roster.slots.find((x) => x.note === 'second-squire');
    expect(second && who(state, second.characterIndex)).toBe('Squire 51');
    expect(second?.slot).toBe(8);
    expect(r.roster.nextCharacter).toMatchObject({
      line: 'Hunter',
      slotNumber: 7,
      opensAt: 500,
      gap: 121,
      slotOpen: false,
    });
    expect(r.roster.swapToken).toBeNull();
    expect(r.goals.some((g) => g.entryId === 'metapath.goal.swap-token')).toBe(false);
  });

  it('S5: every Role named in the spec, all active at W3-early', () => {
    const r = run(state);
    expect(roleSet(r, state, 'Squire 85')).toEqual(['pusher', 'construction-builder', 'refinery-throttle']);
    expect(roleSet(r, state, 'Squire 51')).toEqual(['construction-builder-2nd']);
    // TR-9 also gives the Wizard line Choppin; S5 lists only Worship and prayer slots.
    expect(roleSet(r, state, 'Wizard 73')).toEqual(expect.arrayContaining(['worship', 'prayer-slots']));
    expect(roleSet(r, state, 'Shaman 54')).toEqual(['alchemy']);
    expect(roleSet(r, state, 'Bowman 60')).toEqual(['catching', 'archer-smithing']);
    expect(roleSet(r, state, 'Barbarian 56')).toEqual(['afk-fighting', 'fishing']);
    expect(
      roleOwnersOf(r, 'construction')
        .map((i) => who(state, i))
        .sort(),
    ).toEqual(['Squire 51', 'Squire 85']);
  });

  it('FR-24: the Wizard (Worship) visits after the characters it pools from', () => {
    const r = run(state);
    const hint = r.visitHints.find((h) => h.kind === 'pool-after');
    expect(hint && who(state, hint.characterIndex)).toBe('Wizard 73');
    expect(hint?.after).toHaveLength(5);
  });
});

describe('FR-6, FR-8, FR-10 (synthetic)', () => {
  const facts = () => lookupOf(kb());

  it('F17: two Squires and no Barbarian: the swap token turns the lower Squire into a Barbarian', () => {
    const s = account([char(0, 'Squire', 70), char(1, 'Squire', 40), char(2, 'Bowman', 50)], {
      finishedWorlds: [1],
    });
    const r = analyzeRoster(s, facts(), 'W2-late');
    expect(r.swapToken).toEqual({ characterIndex: 1, from: 'Squire', to: 'Barbarian' });
    const goals = runMetaPath({ ...s, account: { ...s.account, familyLevel: 150 } }, kb(), NOW).goals;
    expect(goals.find((g) => g.entryId === 'metapath.goal.swap-token')?.subject).toEqual({
      kind: 'character',
      index: 1,
    });
  });

  it('a duplicate Barbarian with a Squire present gets no swap token (FR-10 wins over the old §6 row)', () => {
    const s = account([char(0, 'Barbarian', 70), char(1, 'Barbarian', 40), char(2, 'Squire', 50)]);
    expect(analyzeRoster(s, facts(), 'W2-late').swapToken).toBeNull();
  });

  it('an Archer holds Hunter if Hunter is missing, else Bowman', () => {
    const one = analyzeRoster(account([char(0, 'Archer', 12)]), facts(), 'W1-mid');
    expect(one.slots[0]).toMatchObject({ line: 'Bowman', status: 'tentative' });
    const two = analyzeRoster(account([char(0, 'Bowman', 40), char(1, 'Archer', 12)]), facts(), 'W2-mid');
    expect(two.slots[1]).toMatchObject({ line: 'Hunter', status: 'tentative' });
  });

  it('next character: a line whose Role is already active comes first; slot 7 waits for 1–6', () => {
    // W3-early: Hunter (Trapping, W3-early) and Shaman (Alchemy, W2-early) are both active: #15 order wins.
    const s = account([
      char(0, 'Barbarian', 60),
      char(1, 'Squire', 60),
      char(2, 'Bowman', 60),
      char(3, 'Wizard', 60),
    ]);
    expect(analyzeRoster(s, facts(), 'W3-early').nextCharacter?.line).toBe('Hunter');
    // W2-early: Shaman's Alchemy is active, Hunter's Trapping is not yet.
    expect(analyzeRoster(s, facts(), 'W2-early').nextCharacter?.line).toBe('Shaman');
    const full = account(
      ['Barbarian', 'Squire', 'Bowman', 'Hunter', 'Shaman', 'Wizard'].map((c, i) => char(i, c, 60)),
    );
    expect(analyzeRoster(full, facts(), 'W3-early').nextCharacter?.line).toBe('Journeyman');
  });

  it('a new account: Barbarian line first, slot 2 opens at family level 8', () => {
    const r = analyzeRoster(account([char(0, 'Beginner', 3)]), facts(), 'W1-early');
    expect(r.nextCharacter).toMatchObject({
      line: 'Barbarian',
      baseClass: 'Warrior',
      slotNumber: 2,
      opensAt: 8,
    });
  });
});
