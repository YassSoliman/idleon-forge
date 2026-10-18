// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 acceptance on the two private saves, against the spec's worked examples (§11). Local only:
// fixtures/private is gitignored, so these skip in CI. By class and level, never by name (TR-9).
import { describe, expect, it } from 'vitest';
import type { EngineResult } from '../../src/result';
import { gearGoals, hasPrivate, privateFile, run, slotOf, workerState } from './helpers';

const T = 120_000;
const texts = (r: EngineResult) =>
  [...r.account.goals, ...r.characters.flatMap((c) => c.goals)].flatMap((g) => [
    g.nextAction.text,
    ...(g.details ?? []).map((d) => d.text),
  ]);

describe.skipIf(!hasPrivate('yasser'))('the W2-late private save (§11.1)', () => {
  it(
    'equip the held Copper Bands on the Wizard Lv 56; craft Copper Platelegs',
    () => {
      const r = run(workerState(privateFile('yasser')));
      const t = texts(r);
      expect(t).toContain('Wizard Lv 56: 2 Copper Bands from storage');
      expect(t.some((x) => x.endsWith('Craft Copper Platelegs for your pants (anvil tab 1)'))).toBe(true);
    },
    T,
  );
  it(
    'the five next pieces, each behind anvil tab 2 and the W2 Task Board',
    () => {
      const st = workerState(privateFile('yasser'));
      const r = run(st);
      const next = (cls: string, lv: number) =>
        gearGoals(r).find(
          (g) => g.subject === `c${slotOf(st, cls, lv)}` && g.goal.id === 'gear.check.next-piece',
        )?.goal;
      expect(next('Barbarian', 60)?.title).toBe('Next piece: Enforced Slasher for your weapon');
      expect(next('Squire', 43)?.title).toBe('Next piece: Royal Bayonet for your weapon');
      expect(next('Shaman', 44)?.title).toBe('Next piece: Starlight for your weapon');
      expect(next('Wizard', 56)?.title).toBe('Next piece: Crows Nest for your weapon');
    },
    T,
  );
});

describe.skipIf(!hasPrivate('joseph'))('the W3-early private save (§11.2)', () => {
  it(
    'Amarok Paws for 4 characters, at position 3, everything held',
    () => {
      const r = run(workerState(privateFile('joseph')));
      const g = r.account.goals.find((x) => x.id === 'gear.check.next-piece');
      expect(g?.nextAction.text).toBe('Craft Amarok Paws for 4 characters (anvil tab 1)');
      expect(g?.walkthrough?.collapsed).toMatch(/^You hold everything/);
    },
    T,
  );
  it(
    'the Barbarian Lv 56 unlocks then crafts the Iron Fishing Rod',
    () => {
      const st = workerState(privateFile('joseph'));
      const r = run(st);
      const g = gearGoals(r).find((x) => x.subject === `c${slotOf(st, 'Barbarian', 56)}`)?.goal;
      expect(g?.nextAction.text).toBe('Unlock the Iron Fishing Rod at the W1 Task Board, then craft it');
    },
    T,
  );
  it(
    'the Squire Lv 85: The Ice Breaker, 45 levels behind, anvil tab 3 the bottleneck',
    () => {
      const st = workerState(privateFile('joseph'));
      const r = run(st);
      const i = slotOf(st, 'Squire', 85);
      const g = gearGoals(r).find((x) => x.subject === `c${i}`)?.goal;
      expect(g?.title).toBe('Next piece: The Ice Breaker for your weapon');
      expect(g?.nextAction.text).toBe('Craft Anvil Tab 3 to open the W3 Task Board unlocks');
      expect(
        r.gear?.characters.find((c) => c.index === i)?.slots.find((s) => s.slot === 'weapon')?.word,
      ).toBe('45 levels behind');
    },
    T,
  );
});
