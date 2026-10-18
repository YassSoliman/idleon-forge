// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M15 F3, Next family-level unlock (docs/specs/M15-account-depth.md US-3, FR-14 to FR-19, TR-8, TR-13).
// Characters are named by class and level only.
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import { compile } from '@idleon-forge/kb-tools/src/compile';
import { loadSource } from '@idleon-forge/kb-tools/src/load';
import type { CompiledKnowledge } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { runEngine } from '../../src';
import type { EngineHistoryEntry } from '../../src/core/module';
import {
  FAMILY_UNLOCK_ID,
  familyEta,
  familyGates,
  familyPace,
  familyUnlock,
  lookupOf,
  runMetaPath,
} from '../../src/metapath';
import type { Goal } from '../../src/result';
import { hasPrivate, loadKb, NOW, privateFixture, scrubbed, stateOf } from './helpers';
import { account, char } from './synthetic';

/** The compiled bundle, so M8's generated Obol Altar quest ships with it as in the app. */
const kb: CompiledKnowledge = await compile(loadSource(), { git: null });
const facts = () => lookupOf(loadKb());
const DAY = 24 * 3600 * 1000;

function engine(state: AccountState, entries: EngineHistoryEntry[] = []) {
  return runEngine({
    state,
    history: { entries, sessionStartedAt: null, learnedExpectedReturnSeconds: null },
    knowledge: { version: 'test', coverage: () => [], kb },
    now: NOW,
    options: { expectedReturnSeconds: 8 * 3600 },
  });
}
const unlockOf = (r: ReturnType<typeof engine>): Goal | undefined =>
  r.account.goals.find((g) => g.id === FAMILY_UNLOCK_ID);
const withLevel = (s: AccountState, accountLevel: number): AccountState => ({
  ...s,
  account: { ...s.account, accountLevel },
});

const w2 = [scrubbed('scrubbed-w2'), ...(hasPrivate('yasser') ? [privateFixture('yasser')] : [])];
const w3 = [scrubbed('scrubbed-w3'), ...(hasPrivate('joseph') ? [privateFixture('joseph')] : [])];

describe('the family-level gate table (V3)', () => {
  it('pins the character slots to NewCharLvReq at the pin: 8, 30, 70, 150, 300, 500, 750, 1,100, 1,500, 5,000', () => {
    const slots = familyGates(facts(), { beyond: false }).filter((g) => g.characterSlot !== null);
    expect(slots.map((g) => [g.characterSlot, g.familyLevel])).toEqual([
      [2, 8],
      [3, 30],
      [4, 70],
      [5, 150],
      [6, 300],
      [7, 500],
      [8, 750],
      [9, 1100],
      [10, 1500],
      [11, 5000],
    ]);
  });

  it('merges family obol gates by level from the game data (400 opens a Hexagon and a Circle)', () => {
    const gates = familyGates(facts(), { beyond: false });
    const at = (lv: number) => gates.find((g) => g.familyLevel === lv);
    expect(at(350)?.obolShapes).toEqual(['Circle']);
    expect(at(400)?.obolShapes).toEqual(['Hexagon', 'Circle']);
    expect(at(470)?.obolShapes).toEqual(['Circle']);
    expect(at(1500)).toMatchObject({ characterSlot: 10, obolShapes: ['Circle'] });
  });

  it('FR-19: a beyond account has no gate for character slot 11', () => {
    expect(familyGates(facts(), { beyond: true }).some((g) => g.characterSlot === 11)).toBe(false);
  });
});

describe.each(w2)('US-3 on the W2-late account (%s)', (file) => {
  const state = stateOf(file);

  it('shows character slot 6 for your Hunter at 300 (43 to go), last position, and the 350 obol slot in the why', () => {
    const g = unlockOf(engine(state));
    expect(g?.nextAction.text).toBe(
      'Next family unlock: character slot 6 for your Hunter at family level 300 (43 to go)',
    );
    // Copy pass: the ETA rides in the why.
    expect(g?.nextAction.why).toMatch(/^ETA after a few more sessions\. /);
    expect(g?.nextAction.why).toContain('After that, a Circle family obol slot opens at family level 350.');
    expect(g?.category).toBe('nice');
    expect(g?.milestone).toMatchObject({ unit: 'family level', current: 257, next: 300 });
    // FR-17: F3 replaces M2's closed-slot note; no Make-a-character Goal while the slot is closed.
    expect(engine(state).account.goals.some((x) => x.id === 'metapath.goal.next-character')).toBe(false);
  });

  it('FR-17: once slot 6 is open, Make a Hunter shows and F3 names the next unlock (the 350 obol slot)', () => {
    const r = engine(withLevel(state, 304));
    expect(r.account.goals.find((x) => x.id === 'metapath.goal.next-character')).toBeDefined();
    expect(unlockOf(r)?.nextAction.text).toBe(
      'Next family unlock: a Circle family obol slot at family level 350 (46 to go)',
    );
  });

  it('a newly made Beginner Lv 1 holds the Hunter line: the roster moves on, slot 7 opens at 500', () => {
    const fresh = char(5, 'Beginner', 1);
    const s = withLevel({ ...state, characters: [...state.characters, fresh] }, 305);
    const m = runMetaPath(s, loadKb(), NOW);
    expect(m.roster.slots.find((x) => x.characterIndex === 5)).toMatchObject({
      line: 'Hunter',
      status: 'tentative',
    });
    expect(m.roster.missingLines).toEqual([]);
    expect(m.roster.nextCharacter).toMatchObject({ line: 'Journeyman', slotNumber: 7, opensAt: 500 });
    // FR-14: the lowest gate wins, so the 350 obol slot comes first; slot 7 at 500 is the next character unlock.
    const g = unlockOf(engine(s));
    expect(g?.nextAction.text).toBe(
      'Next family unlock: a Circle family obol slot at family level 350 (45 to go)',
    );
    const at400 = unlockOf(engine(withLevel(s, 420)));
    expect(at400?.nextAction.text).toBe(
      'Next family unlock: a Circle family obol slot at family level 470 (50 to go)',
    );
    expect(at400?.nextAction.why).toContain('After that, character slot 7 opens at family level 500.');
    expect(unlockOf(engine(withLevel(s, 480)))?.nextAction.text).toBe(
      'Next family unlock: character slot 7 for your Journeyman at family level 500 (20 to go)',
    );
  });

  it('a newly made Archer below level 10 is still a base class: it holds nothing yet', () => {
    const s = { ...state, characters: [...state.characters, char(5, 'Archer', 3)] };
    expect(runMetaPath(s, loadKb(), NOW).roster.nextCharacter?.line).toBe('Hunter');
  });
});

describe.each(w3)('US-3 on the W3-early account (%s)', (file) => {
  const state = stateOf(file);

  it('shows the Hexagon and Circle family obol slots at 400 (21 to go) with the altar note; slot 7 at 500 next', () => {
    const g = unlockOf(engine(state));
    expect(g?.nextAction.text).toBe(
      'Next family unlock: a Hexagon and a Circle family obol slot at family level 400 (21 to go)',
    );
    // Copy pass: the altar note and the ETA ride in the why.
    expect(g?.nextAction.why).toMatch(/^Equip them after the Obol Altar\. ETA after a few more sessions\. /);
    expect(g?.nextAction.why).toContain('After that, a Circle family obol slot opens at family level 470.');
    // FR-18: no claim about the 350 slot the save still marks locked.
    expect(g?.nextAction.text).not.toContain('350');
  });

  it('at family level 401 the next unlock is the 470 Circle slot, not the character slot at 500', () => {
    const at401 = unlockOf(engine(withLevel(state, 401)))?.nextAction;
    expect(at401?.text).toBe('Next family unlock: a Circle family obol slot at family level 470 (69 to go)');
    expect(at401?.why).toMatch(/^Equip it after the Obol Altar\. ETA after a few more sessions\. /);
  });

  it('ETA: 3 Play Sessions over 4 days from 349 to 379 read "in 3d 0h at your recent pace"', () => {
    const last = state.account.lastCloudSave ?? NOW;
    const entry = (daysAgo: number, level: number): EngineHistoryEntry => ({
      lastCloudSave: last - daysAgo * DAY,
      receivedAt: last - daysAgo * DAY,
      state: withLevel(state, level),
    });
    const g = unlockOf(engine(state, [entry(4, 349), entry(2, 364)]));
    expect(g?.nextAction.text).toMatch(/\(21 to go\)$/);
    // 3 days through the shared duration formatter (days only from 100 h).
    expect(g?.nextAction.why).toMatch(/^Equip them after the Obol Altar\. In 3d 0h at your recent pace\. /);
  });
});

describe('FR-16 pace and ETA (TR-8)', () => {
  const p = (day: number, familyLevel: number, characters = 6) => ({
    at: day * DAY,
    familyLevel,
    characters,
  });

  it('needs 24 h of history; a pace of 0 gives no ETA', () => {
    expect(familyPace([p(0, 100)], p(0.5, 110), DAY)).toBeNull();
    expect(familyPace([p(0, 100)], p(2, 100), 3 * DAY)).toBeNull();
    expect(familyPace([p(0, 100)], p(2, 110), 3 * DAY)).toBeCloseTo(5);
  });

  it('ignores saves with another character count, so a new character is not pace', () => {
    expect(familyPace([p(0, 100, 5), p(1, 101, 6)], p(3, 105, 6), 3 * DAY)).toBeCloseTo(2);
  });

  it('uses the last 7 days only', () => {
    expect(familyPace([p(0, 0), p(10, 100)], p(12, 110), 12 * DAY)).toBeCloseTo(5);
  });

  it('caps at 90 days and rounds to whole days', () => {
    expect(familyEta(21, null)).toEqual({ kind: 'no-history' });
    expect(familyEta(21, 7.5)).toEqual({ kind: 'days', days: 3 });
    expect(familyEta(10, 50)).toEqual({ kind: 'days', days: 1 });
    expect(familyEta(1000, 10)).toEqual({ kind: 'too-long' });
  });
});

describe('FR-19 gates and limits', () => {
  it('unknown family level: no Goal', () => {
    const s = account([char(0, 'Squire', 40)], { accountLevel: null });
    expect(
      familyUnlock(s, facts(), { id: 'W2-early', coverage: 'covered' }, { nextCharacter: null }, [], NOW),
    ).toBeNull();
  });

  it('past the last gate: no Goal', () => {
    const s = account([char(0, 'Squire', 40)], { accountLevel: 6000 });
    expect(
      familyUnlock(s, facts(), { id: 'W4-entry', coverage: 'covered' }, { nextCharacter: null }, [], NOW),
    ).toBeNull();
  });

  it('a new account: slot 2 at family level 8', () => {
    const s: AccountState = account([char(0, 'Beginner', 3) as CharacterState]);
    const u = familyUnlock(
      s,
      facts(),
      { id: 'W1-early', coverage: 'covered' },
      { nextCharacter: null },
      [],
      NOW,
    );
    expect(u).toMatchObject({ next: { familyLevel: 8, characterSlot: 2 }, gap: 5 });
  });
});
