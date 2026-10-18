// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M15 TR-2 contract tests: the Refinery, Construction and Talent Book Library fields with the worker's
// Toolbox calls, on the public saves (no crash, rules hold) and the two scrubbed saves (the values the
// M15 user stories rest on). Never a name; class and level only.
import { fileURLToPath } from 'node:url';
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { type AccountState, isKnown, toAccountState } from '../src';
import { editedSave, listJson, PUBLIC_DIR, readSave } from './helpers';

const SCRUBBED_DIR = fileURLToPath(new URL('../../../fixtures/scrubbed/', import.meta.url));
/** The scrubbed saves' `now` (their meta files). */
const SCRUBBED_NOW = Date.parse('2026-10-17T16:12:33.140Z');

const stateOf = (input: unknown, now: number, toolbox = true): AccountState => {
  const envelope = normalizeEnvelope(input);
  const parsed = parseSave(envelope, { now });
  return toAccountState(
    parsed,
    envelope,
    toolbox ? { toolbox: { calls: toolboxCalls, withFrozenClock } } : {},
  );
};

describe('scrubbed W3-early save', () => {
  const raw = readSave(SCRUBBED_DIR, 'scrubbed-w3.json');
  const state = stateOf(raw, SCRUBBED_NOW);
  const { refinery, construction, library } = state.account;

  it('reads Redox on Auto Refine at rank 1, with the predecessor safe rank, not the printer one', () => {
    const redox = refinery?.salts[0];
    expect(redox).toMatchObject({
      rawName: 'Refinery1',
      unlocked: true,
      active: true,
      rank: 1,
      autoRefine: true,
    });
    expect(redox?.power).toBe(0);
    expect(redox?.powerCap).toBe(50);
    // No salt feeds Redox: Toolbox's maxUsefulRank (red-team #1; its printer-capped maxSafeRank is 0).
    expect(redox?.saltMaxSafeRank).toBeGreaterThan(10_000);
    expect(redox?.fullInSeconds).toBeGreaterThan(0);
    expect(refinery?.salts[1]).toMatchObject({ rawName: 'Refinery2', unlocked: true, active: false });
    expect(refinery?.salts[2]?.unlocked).toBe(false);
    expect(refinery?.salts[2]?.fullInSeconds).toBeNull();
  });

  it('reads 2 build slots (Death Note, 3D Printer), both bars full, and the build rate', () => {
    expect(construction?.buildSlots).toEqual([2, 0]);
    expect(Math.round(construction?.totalBuildRate ?? 0)).toBe(419);
    const printer = construction?.buildings.find((b) => b.rawName === '3D_Printer');
    expect(printer).toMatchObject({
      index: 0,
      level: 4,
      maxLevel: 11,
      inSlot: true,
      saltRawName: 'Refinery1',
      bodyFull: true,
    });
    expect(Math.round(printer?.buildCost ?? 0)).toBe(186);
    const dn = construction?.buildings.find((b) => b.rawName === 'Death_Note');
    expect(dn).toMatchObject({
      level: 0,
      inSlot: true,
      saltRawName: 'Refinery2',
      bodyFull: true,
      buildCost: 2250,
    });
    expect(construction?.buildings.find((b) => b.rawName === 'Salt_Lick')).toMatchObject({
      inSlot: false,
      bodyFull: false,
    });
  });

  it('reads the Library: level 1, 5 checkouts at now, two Warrior-page books for talent 0', () => {
    expect(library).toMatchObject({ checkouts: 5, libraryLevel: 1, reservationOn: false });
    expect(library?.bookLv.max).toBe(125);
    expect(library?.bookLv.min).toBeGreaterThan(100);
    expect(library?.nextInSeconds).toBeGreaterThan(6 * 3600);
    expect(library?.heldBooks.map((b) => [b.page, b.talentId, b.level, b.place])).toEqual([
      ['Warrior', 0, 122, 'storage'],
      ['Warrior', 0, 109, 'storage'],
    ]);
  });

  it('is null without the worker Toolbox functions', () => {
    const bare = stateOf(raw, SCRUBBED_NOW, false).account;
    expect([bare.refinery, bare.construction, bare.library]).toEqual([null, null, null]);
  });

  it('marks the fields unknown when their raw keys are gone', () => {
    const s = stateOf(
      editedSave(raw, (d) => {
        delete d.Refinery;
        delete d.Tower;
      }),
      SCRUBBED_NOW,
    );
    expect(isKnown(s, 'account.refinery')).toBe(false);
    expect(isKnown(s, 'account.construction')).toBe(false);
    expect(isKnown(s, 'account.library')).toBe(false);
    expect(s.account.refinery).toBeNull();
  });
});

describe('scrubbed W2-late save', () => {
  const state = stateOf(readSave(SCRUBBED_DIR, 'scrubbed-w2.json'), SCRUBBED_NOW);

  it('reads no buildings, no build rate and 11 checkouts at building level 0', () => {
    expect(state.account.construction?.totalBuildRate).toBe(0);
    expect(state.account.construction?.buildSlots).toEqual([null, null]);
    expect(state.account.construction?.buildings.every((b) => b.level === 0 && !b.inSlot)).toBe(true);
    expect(state.account.library).toMatchObject({ checkouts: 11, libraryLevel: 0 });
    expect(state.account.refinery?.salts[0]).toMatchObject({
      unlocked: true,
      active: false,
      autoRefine: false,
    });
  });
});

describe.each(listJson(PUBLIC_DIR))('public save %s', (file) => {
  const state = stateOf(readSave(PUBLIC_DIR, file), SCRUBBED_NOW);

  it('reads the fields with the rules the Detectors rely on', () => {
    const { refinery, construction, library } = state.account;
    for (const s of refinery?.salts ?? []) {
      if (!s.unlocked) expect(s.fullInSeconds).toBeNull();
      if (s.power >= s.powerCap) expect(s.fullInSeconds).toBe(0);
    }
    if (construction) {
      expect(construction.buildSlots.length).toBeGreaterThanOrEqual(2);
      expect(construction.buildSlots.length).toBeLessThanOrEqual(8);
      const slotted = new Set(construction.buildSlots.filter((x) => x !== null));
      for (const b of construction.buildings) expect(b.inSlot).toBe(slotted.has(b.index));
    }
    for (const b of library?.heldBooks ?? []) expect(b.level).toBeGreaterThan(0);
  });
});
