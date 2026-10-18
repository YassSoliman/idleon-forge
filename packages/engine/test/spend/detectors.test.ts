// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 engine Detectors (TR-5): fires / doesn't fire on the scrubbed saves, their registration and the
// combat gate (FR-21). Private-fixture runs live in plan.private.test.ts (local only).
import { makeContext } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { engineDetectors } from '../../detectors';
import { lookupOf } from '../../src/metapath/knowledge';
import {
  CHECK,
  combatGate,
  duplicateEntriesGuard,
  SPEND_DETECTORS,
  stampHydrogen,
  stampNotReady,
} from '../../src/spend';
import { scrubbedFile, spendKb, spendStateOf } from './helpers';

const kb = spendKb();
const w2 = spendStateOf(scrubbedFile('scrubbed-w2'));
const w3 = spendStateOf(scrubbedFile('scrubbed-w3'));

describe('M7 engine Detectors', () => {
  it('are registered by file convention, and each Check entry names one', () => {
    for (const id of Object.keys(SPEND_DETECTORS)) expect(engineDetectors[id]).toBeDefined();
    for (const id of Object.values(CHECK)) {
      const e = kb.entries[id];
      expect(e?.type).toBe('check');
      if (e?.type === 'check') expect(SPEND_DETECTORS).toHaveProperty(e.detector.id);
    }
  });

  it('spend/duplicate-entries-guard fires on W3-early (4 tickets at the NPCs), not on W2-late', () => {
    expect(duplicateEntriesGuard(w3)).toEqual({ fires: true, tickets: 4 });
    expect(duplicateEntriesGuard(w2).fires).toBe(false);
  });

  it('spend/stamp-hydrogen is off at Hydrogen Lv 0 on both saves', () => {
    expect(stampHydrogen(w2)).toEqual({ batching: false, hold: null });
    expect(stampHydrogen(w3)).toEqual({ batching: false, hold: null });
  });

  it('spend/stamp-raise-ready (negative side) lists Target Stamp on W2-late and Vendor Stamp on W3-early', () => {
    expect(stampNotReady(w2)).toContainEqual({
      ref: 'stamps.acquisition.stamp-a5',
      reason: 'stamp-material',
    });
    expect(stampNotReady(w3)).toContainEqual({
      ref: 'stamps.acquisition.stamp-c11',
      reason: 'stamp-material',
    });
  });

  it('runs through the Detector contract (makeContext), deterministically', () => {
    for (const d of Object.values(SPEND_DETECTORS)) {
      const ctx = makeContext(w3, kb, { now: w3.asOf });
      expect(d.run(ctx, {})).toEqual(d.run(ctx, {}));
    }
  });

  it('spend/combat-row-gate stays closed without a frontier (FR-21)', () => {
    expect(combatGate(w2, lookupOf(kb))).toEqual({ bullseye: false, defence: false });
  });

  it("spend/combat-row-gate opens on the pusher's hit chance and survivability below 100%", () => {
    const s = structuredClone(w2);
    s.account.frontier = {
      world: 2,
      mapIndex: 1,
      mapName: 'X',
      door: 0,
      kind: 'uncleared',
      requirement: 1,
      routeCleared: [],
      fights: [
        {
          characterIndex: 0,
          finalKillsPerHour: 100,
          killsPerHour: 100,
          hitChance: 80,
          survivability: 100,
          killsLeft: 1,
        },
      ],
    };
    expect(combatGate(s, lookupOf(kb))).toEqual({ bullseye: true, defence: false });
  });
});
