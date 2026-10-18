// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M2 pusher and frontier: S2 on the saves, the TR-2 clone identity check at the pin, the W1 route path,
// the reachability rule and the D1 margin boundary (TR-19), FR-13's wall, and the TR-15 budget.
import { readFileSync } from 'node:fs';
import { type AccountState, computeFrontier } from '@idleon-forge/account-state';
import {
  normalizeEnvelope,
  type ParsedSave,
  parseSave,
  toolboxCalls,
  withFrozenClock,
} from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { choosePusher, frontierRoute, lookupOf, runMetaPath, selectPusher } from '../../src/metapath';
import { hasPrivate, loadKb, NOW, privateFixture, scrubbed, stateOf } from './helpers';
import { frontierOf } from './synthetic';

const facts = () => lookupOf(loadKb());
const who = (s: AccountState, i: number | undefined) => {
  const c = s.characters.find((x) => x.index === i);
  return `${c?.class} ${c?.level}`;
};
const w2 = [scrubbed('scrubbed-w2'), ...(hasPrivate('yasser') ? [privateFixture('yasser')] : [])];
const w3 = [scrubbed('scrubbed-w3'), ...(hasPrivate('joseph') ? [privateFixture('joseph')] : [])];

describe.each(w3)('S2 on the W3-early account (%s)', (file) => {
  const state = stateOf(file, { rates: 'toolbox' });
  it('frontier Thermonuclear Climb; pusher Squire 85 at 1,065; next Barbarian 56 at 472; the rest below 30', () => {
    const f = state.account.frontier;
    expect([f?.mapName, f?.kind, f?.door]).toEqual(['Thermonuclear_Climb', 'uncleared', 0]);
    const sel = selectPusher(state, facts());
    expect(sel.kind).toBe('pusher');
    if (sel.kind !== 'pusher') return;
    expect(who(state, sel.pusher.index)).toBe('Squire 85');
    expect(who(state, sel.pusher.incumbent)).toBe('Squire 85');
    const rate = (label: string) =>
      f?.fights.find((x) => who(state, x.characterIndex) === label)?.finalKillsPerHour;
    expect(rate('Squire 85')).toBe(1065);
    expect(rate('Barbarian 56')).toBe(472);
    const rest = f?.fights.filter(
      (x) => !['Squire 85', 'Barbarian 56'].includes(who(state, x.characterIndex)),
    );
    expect(rest?.every((x) => x.finalKillsPerHour < 30)).toBe(true);
  });
});

describe.each(w2)('S2 on the W2-late account (%s)', (file) => {
  const state = stateOf(file, { rates: 'toolbox' });
  it('every W2 path door is cleared: Sands of Time is the hardest; pusher Barbarian 60 at 1,680', () => {
    const f = state.account.frontier;
    expect([f?.mapName, f?.kind, f?.requirement]).toEqual(['Sands_of_Time', 'hardest-cleared', 3000]);
    const sel = selectPusher(state, facts());
    if (sel.kind !== 'pusher') throw new Error(sel.kind);
    expect(who(state, sel.pusher.index)).toBe('Barbarian 60');
    expect(who(state, sel.pusher.incumbent)).toBe('Barbarian 60');
    const rates = Object.fromEntries(
      f?.fights.map((x) => [who(state, x.characterIndex), x.finalKillsPerHour]) ?? [],
    );
    expect(rates).toEqual({
      'Barbarian 60': 1680,
      'Bowman 54': 1496,
      'Shaman 44': 1368,
      'Wizard 56': 1193,
      'Squire 43': 57,
    });
  });

  it('S2: the push Goal Source shows both pusher-class sides and the kill-rate line', () => {
    const e = loadKb().entries['metapath.metapath.pusher-rule'];
    const notes = e?.sources.map((s) => s.note ?? '') ?? [];
    expect(notes.some((n) => n.startsWith('Barbarian side'))).toBe(true);
    expect(notes.some((n) => n.startsWith('Squire side'))).toBe(true);
    expect(e?.values['source-line']).toBe(
      'ActiveOn picked by kill rate on {map:name}, as each character is equipped',
    );
  });
});

/** A minimal parse with `levels.length` characters and their KillsLeft2Advance tables. */
function synthetic(
  levels: number[],
  kla: (unknown[] | undefined)[],
): { parsed: ParsedSave; envelope: { data: Record<string, unknown> } } {
  return {
    parsed: {
      account: { a: 1 },
      characters: levels.map((level) => ({ level })),
      failedSections: [],
      error: null,
      meta: { now: NOW, saveVersion: 1, capturedAt: null, parserGameVersion: '2.3.540', parserCommit: 'x' },
    },
    envelope: { data: Object.fromEntries(kla.map((t, i) => [`KLA_${i}`, JSON.stringify(t ?? [])])) },
  };
}

describe('TR-10 route path, reachability and the D1 margin', () => {
  it('W1: with Froggy Fields cleared by one character, the frontier is the next door on the Amarok path', () => {
    const route = frontierRoute(facts(), 1) ?? [];
    const names = route.map((d) => d.mapName);
    for (const side of ['Poopy_Sewers', 'Rats_Nest', 'The_Base_Of_The_Bark', 'Hollowed_Trunk'])
      expect(names).not.toContain(side);
    const table: unknown[] = [];
    for (const d of route) {
      const row = (table[d.mapIndex] as number[] | undefined) ?? [];
      row[d.door] = d.mapName === 'Froggy_Fields' || d.mapName === 'Spore_Meadows' ? 0 : d.requirement;
      table[d.mapIndex] = row;
    }
    const { parsed, envelope } = synthetic([20], [table]);
    const rate = {
      characterIndex: 0,
      finalKillsPerHour: 500,
      killsPerHour: 500,
      hitChance: 100,
      survivability: 100,
    };
    const f = computeFrontier(parsed, envelope as never, { world: 1, route, rates: () => [rate] });
    expect([f?.mapName, f?.door, f?.kind]).toEqual(['Valley_Of_The_Beans', 0, 'uncleared']);
    expect(f?.routeCleared[0]).toMatchObject({ count: 2, reachesFrontier: true });
  });

  it('a character with 2x the incumbent rate that has not cleared the doors before is not the pusher', () => {
    const f = frontierOf([
      { i: 0, kph: 1000, count: 9 },
      { i: 1, kph: 2000, count: 3, reaches: false },
    ]);
    const sel = choosePusher(f, () => 60, 1.25);
    expect(sel.kind === 'pusher' && sel.pusher.index).toBe(0);
  });

  it('the 1.25 boundary: exactly 1.25x switches, just below keeps the incumbent', () => {
    const at = (kph: number) =>
      choosePusher(
        frontierOf([
          { i: 0, kph: 1000, count: 9 },
          { i: 1, kph, count: 8 },
        ]),
        () => 60,
        1.25,
      );
    const exactly = at(1250);
    const below = at(1249);
    expect(exactly.kind === 'pusher' && exactly.pusher.index).toBe(1);
    expect(below.kind === 'pusher' && below.pusher.index).toBe(0);
  });

  it('FR-13: nobody can fight the frontier: no pusher, the strongest candidate and its wall', () => {
    const f = frontierOf([
      { i: 0, kph: 0, raw: 0.4, count: 9, hit: 40 },
      { i: 1, kph: 0, raw: 0.9, count: 9, hit: 60 },
    ]);
    const sel = choosePusher(f, () => 60, 1.25);
    expect(sel).toMatchObject({ kind: 'wall', wall: { characterIndex: 1, reason: 'hit', hitChance: 60 } });
  });

  it('no frontier (a damage section failed, or the step did not run): no pusher, the push Goal says so', () => {
    const r = runMetaPath(stateOf(scrubbed('scrubbed-w2')), loadKb(), NOW);
    expect([r.pusher, r.pushGoal, r.pushUnavailable]).toEqual([null, null, 'no-frontier']);
    const { parsed, envelope } = synthetic([20], [[]]);
    const failed = { ...parsed, failedSections: ['stamps'] };
    expect(
      computeFrontier(failed, envelope as never, {
        world: 1,
        route: frontierRoute(facts(), 1) ?? [],
        rates: () => [],
      }),
    ).toBeNull();
  });
});

describe('TR-2 clone identity check and TR-15 budget (at the pin)', () => {
  it.each([scrubbed('scrubbed-w2'), scrubbed('scrubbed-w3')])(
    'the clone on a fighting character own map equals the direct call (%s)',
    (file) => {
      const envelope = normalizeEnvelope(JSON.parse(readFileSync(file, 'utf8')));
      const parsed = parseSave(envelope, { now: NOW });
      const chars = parsed.characters as Array<Record<string, unknown>>;
      const fighting = chars.filter((c) => c.level && c.afkType === 'FIGHTING');
      expect(fighting.length).toBeGreaterThan(0);
      withFrozenClock(NOW, () => {
        for (const c of fighting) {
          const direct = toolboxCalls.getMaxDamage(c, chars, parsed.account);
          const clone = toolboxCalls.getMaxDamage(
            toolboxCalls.onMap(c, c.mapIndex as number),
            chars,
            parsed.account,
          );
          expect(clone.finalKillsPerHour).toBe(direct.finalKillsPerHour);
          expect(clone.killsPerHour).toBe(direct.killsPerHour);
        }
      });
      // TR-15: one getMaxDamage per character on one map (60 ms p95 for 11 characters in the worker).
      const t0 = performance.now();
      toolboxCalls.frontierRates(parsed, 109);
      const ms = performance.now() - t0;
      expect(ms).toBeLessThan(1000);
    },
  );
});
