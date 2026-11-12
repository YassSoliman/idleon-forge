// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 4, the World 1 core Systems through the full golden engine: their stories (US-52..56), their
// page pictures and their ladder Goals. The W2 and W4 test accounts are local truth cases, never here;
// scrubbed-w2 is the committed scrub of one of them.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AccountState } from '@idleon-forge/account-state';
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { goldenResult } from '../../src/golden';
import type { OwlPicture } from '../../src/pictures/w1-types';
import type { EngineResult, Goal } from '../../src/result';

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const STAGE_DIR = fileURLToPath(new URL('../../../knowledge/test/fixtures/m26/', import.meta.url));
const stageFixture = (id: string) => {
  const file = `${STAGE_DIR}${id}.json`;
  const now = (JSON.parse(readFileSync(file, 'utf8')) as { lastUpdated: number }).lastUpdated;
  return { id, kind: 'public' as const, file, now };
};
const run = (id: string, edit: (s: AccountState) => AccountState = (s) => s): EngineResult => {
  const f = fixtures.find((x) => x.id === id) ?? stageFixture(id);
  return goldenResult({
    state: edit(stateOf(f)),
    kb: ctx.kb,
    registries: ctx.registries,
    now: f.now,
    expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
  });
};
const goals = (r: EngineResult): Goal[] => [...r.account.goals, ...r.characters.flatMap((c) => c.goals)];
const of = (r: EngineResult, system: string) => goals(r).filter((g) => g.system === system);
const owl = (r: EngineResult) => r.slotPictures?.find((p): p is OwlPicture => p.kind === 'owl') ?? null;

describe('Orion the Owl (FR-51)', () => {
  it('US-53 stage-w1-early: start Orion', () => {
    const g = of(run('stage-w1-early'), 'owl').find((x) => x.id === 'owl.check.start');
    expect(g?.nextAction.text).toBe(
      'Visit Orion at the Grand Owl Perch in Blunder Hills, follow the HOOT popups',
    );
  });
  it('US-53 first.json (it predates Orion): no Owl card and no Owl page picture', () => {
    const r = run('first');
    expect(of(r, 'owl')).toEqual([]);
    expect(owl(r)).toBeNull();
  });
  it('scrubbed-w2 (12 Megafeathers, the 13th affordable): the Mega Reset', () => {
    const r = run('scrubbed-w2');
    const cards = of(r, 'owl').filter((g) => g.category !== 'nice');
    expect(cards.map((g) => g.id)).toEqual(['owl.check.mega-reset']);
    expect(cards[0]?.nextAction.text).toBe('Buy The Great Mega Reset at Orion for Megafeather 13');
    expect(cards[0]?.nextAction.why).toMatch(
      /^Megafeather 13 adds half of Orion's base bonuses again, for good\. You hold 5\.6e28 feathers/,
    );
    const ladder = of(r, 'owl').find((g) => g.id === 'owl.goal.megafeathers');
    expect(ladder?.milestone).toMatchObject({ current: 12, next: 17 });
  });
  it('highend.json: nothing to buy, so no Owl card; the page reads 37 Megafeathers', () => {
    const r = run('highend');
    expect(of(r, 'owl').filter((g) => g.category !== 'nice')).toEqual([]);
    expect(owl(r)).toMatchObject({ megafeathers: 37, bonusesLevel: 41, started: true, nextUnlock: null });
    expect(owl(r)?.megas.every((m) => m.owned)).toBe(true);
  });
});
