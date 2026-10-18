// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M15 F4 Talent Book Library through the M9 module: US-4 on the scrubbed saves (and the private ones
// when present, local only), plus the candidate rules on synthetic presets. Class and level only.
import { existsSync, readFileSync } from 'node:fs';
import { type AccountState, computeFrontier, toAccountState } from '@idleon-forge/account-state';
import { deterministic } from '@idleon-forge/kb-tools/src/parse';
import { makeContext, withAccount } from '@idleon-forge/knowledge';
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { analyzeAccount } from '../../src/builds/analyze';
import { bookCandidate, bookEligible } from '../../src/builds/library';
import { frontierRoute, lookupOf } from '../../src/metapath';
import type { Goal } from '../../src/result';
import { loadKb, PRIVATE, SCRUBBED } from '../metapath/helpers';
import { kb, run, setTalent, TALENT } from './helpers';

/** The scrubbed saves' `now` (their meta files): 5 checkouts stored on the W3-early account. */
const NOW = Date.parse('2026-10-17T16:12:33.140Z');
/** As the worker parses: the Toolbox calls and the frontier step (M2 TR-2), so the pusher is known (FR-21). */
const load = (path: string): AccountState =>
  deterministic(() => {
    const envelope = normalizeEnvelope(JSON.parse(readFileSync(path, 'utf8')));
    const parsed = parseSave(envelope, { now: NOW });
    const world = Math.min(4, Number((parsed.account as { currentWorld?: number }).currentWorld ?? 1));
    const route = frontierRoute(lookupOf(loadKb()), world) ?? [];
    const frontier = computeFrontier(parsed, envelope, {
      world,
      route,
      rates: (map) => toolboxCalls.frontierRates(parsed, map),
    });
    return toAccountState(parsed, envelope, { frontier, toolbox: { calls: toolboxCalls, withFrozenClock } });
  });
const w3 = load(`${SCRUBBED}scrubbed-w3.json`);
const w2 = load(`${SCRUBBED}scrubbed-w2.json`);

const libraryGoals = (s: AccountState): Goal[] =>
  (run(s, { now: NOW }).account?.goals ?? []).map((g) => g.goal).filter((g) => g.system === 'library');
const goal = (s: AccountState, id: string) => libraryGoals(s).find((g) => g.id === id);
const library = (s: AccountState, patch: Partial<NonNullable<AccountState['account']['library']>>) =>
  withAccount(s, { library: s.account.library && { ...s.account.library, ...patch } });
const SQUIRE_85 = 3;

describe('US-4 Use the Library well (F4)', () => {
  it('W3-early: check out Gilded Sword for the Squire Lv 85, with 5 checkouts and the next in about 7 hours', () => {
    const g = goal(w3, 'library.check.checkout');
    expect(g?.nextAction.text).toBe('Check out Gilded Sword for your Squire Lv 85 at the Library');
    expect(g?.nextAction.why).toMatch(/^Checkouts: 5; the next is ready in \dh \d\dm,/);
    expect(g?.nextAction.why).toContain('Talent Book Library, Frostbite Tundra town: the Warrior page.');
    expect(g?.category).toBe('spendable');
    const ranked = run(w3, { now: NOW }).account?.goals?.find((x) => x.goal.id === 'library.check.checkout');
    expect(ranked?.rank?.framePosition).toBe(3);
    // The other candidates come only from the Builds, one line per character (#70 A5).
    for (const d of g?.details ?? [])
      expect(d.text).toMatch(/^(then .+ for your .+ Lv \d+|Your .+ can read .+)$/);
    expect(new Set(g?.details?.map((d) => d.subject)).size).toBe(g?.details?.length ?? 0);
  });

  it('W3-early: the held Health Booster books go to a reader of the Warrior line, never "check out more"', () => {
    const read = goal(w3, 'library.check.read-book');
    const checkout = goal(w3, 'library.check.checkout');
    const lines = [read?.nextAction.text ?? '', ...(checkout?.details ?? []).map((d) => d.text)];
    const booster = lines.filter((t) => /Health Booster/.test(t));
    expect(booster.length).toBeGreaterThan(0);
    // Never as a checkout suggestion.
    expect(checkout?.nextAction.text).not.toMatch(/Health Booster/);
    expect((checkout?.details ?? []).some((d) => /^then Health Booster/.test(d.text))).toBe(false);
    // The Squire Lv 85 already reads Health Booster at 122: it is never the reader.
    expect(booster.some((t) => /Squire Lv 85/.test(t))).toBe(false);
  });

  it('W2-late: no F4 Goal (no W3, Library at Lv 0, 11 checkouts)', () => {
    expect(w2.account.library?.checkouts).toBe(11);
    expect(libraryGoals(w2)).toEqual([]);
  });

  it('the Library at Lv 0: no F4 Goal (FR-25)', () => {
    expect(libraryGoals(library(w3, { libraryLevel: 0 }))).toEqual([]);
  });

  it('0 checkouts: no checkout Goal (FR-24)', () => {
    expect(goal(library(w3, { checkouts: 0 }), 'library.check.checkout')).toBeUndefined();
  });

  it('the Book Reservation System on: no checkout Goal below 20 checkouts (FR-24)', () => {
    expect(goal(library(w3, { reservationOn: true }), 'library.check.checkout')).toBeUndefined();
    expect(goal(library(w3, { reservationOn: true, checkouts: 20 }), 'library.check.checkout')).toBeDefined();
  });

  it('no books held: no read-book Goal', () => {
    expect(goal(library(w3, { heldBooks: [] }), 'library.check.read-book')).toBeUndefined();
  });
});

describe('book candidates (FR-20)', () => {
  const facts = makeContext(w3, kb, { now: NOW }).facts;
  const eligible = bookEligible(facts);
  const candidateOf = (s: AccountState, index: number) => {
    const a = analyzeAccount(s, makeContext(s, kb, { now: NOW }).facts).characters.get(index);
    return a ? bookCandidate(a, eligible, 105) : null;
  };

  it('skips ineligible talents (the game list and star talents)', () => {
    expect(eligible(0)).toBe(true);
    expect(eligible(TALENT.GILDED_SWORD)).toBe(true);
    for (const id of [10, 11, 12, 23, 75, 79, 86, 87, 266, 267, 446, 447, 615, 700])
      expect(eligible(id)).toBe(false);
  });

  it('takes the first capped max step: Gilded Sword on the Squire Lv 85', () => {
    expect(candidateOf(w3, SQUIRE_85)?.talentId).toBe(TALENT.GILDED_SWORD);
  });

  it('skips a step not filled to its max (base < max)', () => {
    const s = setTalent(w3, SQUIRE_85, 'active', TALENT.GILDED_SWORD, 50);
    expect(candidateOf(s, SQUIRE_85)?.talentId).not.toBe(TALENT.GILDED_SWORD);
  });
});

const privateSave = (stem: string) => `${PRIVATE}${stem}.raw.json`;
describe.skipIf(!existsSync(privateSave('joseph')) || !existsSync(privateSave('yasser')))(
  'private saves (local only)',
  () => {
    it('W3-early: Gilded Sword for the Squire Lv 85 with 5 checkouts', () => {
      const g = goal(load(privateSave('joseph')), 'library.check.checkout');
      expect(g?.nextAction.text).toMatch(
        /^Library: check out Gilded Sword for your Squire Lv 85 \(you have 5 checkouts/,
      );
    });
    it('W2-late: silent', () => {
      expect(libraryGoals(load(privateSave('yasser')))).toEqual([]);
    });
  },
);
