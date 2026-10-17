// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, {
  type BubbleRow,
  bubbleRows,
} from '@idleon-forge/knowledge/generators/alchemy-bubbles.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive } from './helpers';

describe('alchemy-bubbles generator', () => {
  it('builds codes and rawNames from CAULDRON_INFO (synthetic slice, hand-checked)', () => {
    const rows = bubbleRows(
      {
        quicc: [
          { bubbleIndex: 'a0', bubbleName: 'SWIFT_STEPPIN' },
          { bubbleIndex: 'a1', bubbleName: 'ARCHER_OR_BUST' },
        ],
      },
      [{ name: 'quicc', imageLetter: 'G', bubblePrefix: 'a' }],
    );
    expect(rows[1]).toEqual({
      cauldron: 'quicc',
      cauldronIndex: 0,
      index: 1,
      code: 'a1',
      rawName: 'aUpgradesG1',
      name: 'ARCHER_OR_BUST',
    });
    expect(() =>
      bubbleRows({ quicc: [{ bubbleIndex: 'b0', bubbleName: 'X' }] }, [
        { name: 'quicc', imageLetter: 'G', bubblePrefix: 'a' },
      ]),
    ).toThrow();
  });

  it('holds its invariants on the pinned data: 4 cauldrons of 35', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const rows = out.facts[0]?.rows as unknown as BubbleRow[];
    // Hand-checked in cauldrons.json at the pin: 35 bubbles per cauldron; power _11 is CALL_ME_BOB.
    expect(rows).toHaveLength(140);
    expect(rows.find((r) => r.code === '_11')).toMatchObject({
      name: 'CALL_ME_BOB',
      rawName: 'aUpgradesO11',
    });
  });

  it("matches the rawName Toolbox's alchemy parser gives every bubble, on a known save", async () => {
    const rows = (await runLive(generator)).facts[0]?.rows as unknown as BubbleRow[];
    const parsed = knownSave('latest.json').account.alchemy as {
      bubbles: Record<string, { rawName: string; bubbleIndex: string }[]>;
    };
    let checked = 0;
    for (const [cauldron, list] of Object.entries(parsed.bubbles))
      for (const b of list) {
        expect(rows.find((r) => r.cauldron === cauldron && r.code === b.bubbleIndex)?.rawName).toBe(
          b.rawName,
        );
        checked++;
      }
    expect(checked).toBe(140);
  });
});
