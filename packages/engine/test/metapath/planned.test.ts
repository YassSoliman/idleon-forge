// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Planned Path (owner report 2026-10-19): the Now screen asked for a Journeyman for slot 7, the new
// Beginner's own page said "Beginner › Archer or Mage or Warrior". One function now answers which class
// each character takes next, and the roadmap, the Now cards and the Build notes all read it. On a
// mutated public save (its Journeyman-line character turned into a Lv 8 Beginner) and on every public
// save as it is. Characters are named by class and level only.
import type { AccountState } from '@idleon-forge/account-state';
import { humanize } from '@idleon-forge/account-state';
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS, withCharacter } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { goldenResult } from '../../src/golden';
import { lookupOf } from '../../src/metapath/knowledge';
import { plannedPaths } from '../../src/metapath/planned';
import { analyzeRoster } from '../../src/metapath/roster';
import { detectStage } from '../../src/metapath/stage';
import type { EngineResult } from '../../src/result';

const ctx = await goldenContext();
const facts = lookupOf(ctx.kb);
const fixtures = listFixtures({ private: false });
const first = fixtures.find((f) => f.id === 'first');
if (!first) throw new Error('no public fixture "first"');

/** "first" (six subclass lines and a Maestro) with the Maestro turned into a fresh Lv 8 Beginner. */
function journeymanSlotBeginner(): AccountState {
  const s = stateOf(first as NonNullable<typeof first>);
  const maestro = s.characters.find((c) => c.class === 'Maestro');
  if (!maestro) throw new Error('fixture: no Maestro');
  // A fresh Beginner: none of Rocklyte's quests done yet.
  const quests = { ...(maestro.quests ?? {}), Rocklyte: { '1': -1, '2': -1, '3': -1 } };
  return withCharacter(s, maestro.index, { class: 'Beginner', classIndex: 1, level: 8, quests });
}

const run = (state: AccountState, now: number): EngineResult =>
  goldenResult({
    state,
    kb: ctx.kb,
    registries: ctx.registries,
    now,
    expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
  });

const pathText = (r: EngineResult, index: number) =>
  (r.builds ?? [])
    .find((b) => b.index === index)
    ?.path.map((p) => p.label)
    .join(' › ');

describe('a Lv 8 Beginner in the Journeyman slot (mutated public save "first")', () => {
  const state = journeymanSlotBeginner();
  const index = state.characters.find((c) => c.class === 'Beginner')?.index as number;
  const stage = detectStage(state, facts);
  const r = run(state, first?.now ?? 0);

  it('the roster holds it for the Journeyman line and asks for the 2nd Squire next', () => {
    const roster = analyzeRoster(state, facts, stage.id);
    expect(roster.slots.find((s) => s.characterIndex === index)).toMatchObject({
      line: 'Journeyman',
      slot: 7,
      status: 'tentative',
    });
    expect(roster.nextCharacter?.line).toBe('Squire');
  });

  it('its Planned Path is Beginner › Journeyman › Maestro › Voidwalker, through Rocklyte', () => {
    const p = plannedPaths(state, facts, stage.id).find((x) => x.characterIndex === index);
    expect(p).toMatchObject({ line: 'Journeyman', basis: 'roster', next: 'Journeyman', via: 'rocklyte' });
    expect(p?.steps.map((s) => s.class)).toEqual(['Beginner', 'Journeyman', 'Maestro', 'Voidwalker']);
  });

  it('its page shows that roadmap, no Lv 10 class pick, and the Journeyman-line note on the Beginner build', () => {
    expect(pathText(r, index)).toBe('Beginner › Journeyman › Maestro › Voidwalker');
    const b = r.builds?.find((x) => x.index === index);
    expect(b?.classPickAt).toBeNull();
    expect(b?.nextClass).toMatch(/Skip the Lv 10 class pick.*Rocklyte/);
    expect(b?.nextClass).not.toMatch(/Archer|Mage|Warrior/);
    expect(b?.comingUp[0]).toMatch(/^Journeyman line: keep the Beginner build/);
    expect(b?.note).toBeNull();
  });

  it('its Now card says to become a Journeyman at Rocklyte, with the three quests as Walkthrough steps', () => {
    const c = r.characters.find((x) => x.index === index);
    const g = c?.goals.find((x) => x.id === 'metapath.goal.subclass');
    expect(g?.nextAction.text).toBe('Become a Journeyman at Rocklyte, not a Lv 10 class');
    expect(g?.walkthrough?.steps.map((s) => s.text)).toEqual([
      'Bring Rocklyte 500 Peanuts in Froggy Fields',
      'Bring Rocklyte 5 Golden Peanuts, crafted at the Anvil',
      'Talk to Rocklyte again: Become a Journeyman',
    ]);
    expect(g?.walkthrough?.steps[0]?.progress?.need).toBe(500);
    expect(g?.walkthrough?.collapsed).toBe("3 of 3 left: Rocklyte's quests in Froggy Fields");
    expect(g?.nextAction.sources.some((s) => s.url.endsWith('website-data/quests.json'))).toBe(true);
    // Never told to pick Warrior, Archer or Mage.
    const all = (c?.goals ?? []).map((x) => x.nextAction.text).join('\n');
    expect(all).not.toMatch(/Pick (your class|Warrior|Archer|Mage)/);
  });
});

describe('the Now screen and the character page agree on the next class, on every public save', () => {
  const cases = [
    ...fixtures.map((f) => ({ id: f.id, state: stateOf(f), now: f.now })),
    { id: 'first+journeyman-slot', state: journeymanSlotBeginner(), now: first?.now ?? 0 },
  ];
  for (const { id, state, now } of cases)
    it(id, () => {
      const r = run(state, now);
      const plans = plannedPaths(state, facts, detectStage(state, facts).id);
      for (const c of state.characters) {
        const plan = plans.find((p) => p.characterIndex === c.index);
        const road = r.builds?.find((b) => b.index === c.index);
        const next = road?.path.find((p) => p.state === 'next')?.label ?? null;
        // The page shows the Planned Path's next class (or its options when the roster has none).
        const want = plan?.next
          ? humanize(plan.next)
          : (plan?.options.length ?? 0) > 1
            ? plan?.options.map((o) => humanize(o)).join(' or ')
            : null;
        expect(next, `${id} c${c.index} ${c.class}`).toBe(want);
        // The Now card names the same class, or none when the plan has no single answer.
        const g = r.characters
          .find((x) => x.index === c.index)
          ?.goals.find((x) => x.id === 'metapath.goal.subclass');
        if (!g) continue;
        if (plan?.basis === 'roster' && plan.next) expect(g.nextAction.text).toContain(humanize(plan.next));
        else expect(g.nextAction.text).toMatch(/^(Pick your class|Take your subclass|Take your Maestro)/);
      }
    });
});
