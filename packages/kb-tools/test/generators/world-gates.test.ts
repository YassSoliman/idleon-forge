// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { probeGates } from '@idleon-forge/knowledge/generators/world-gates.gen';
import { describe, expect, it } from 'vitest';
import { knownSave, runLive, runOnSlice } from './helpers';

type Gate = {
  world: number;
  gatekeeper: string | null;
  accountOption: number | null;
  crystal: string | null;
};

describe('world-gates generator', () => {
  it('finds the gatekeeper by probing, not by copying names (synthetic slice, hand-checked)', () => {
    const fake = (
      chars: { npcDialog?: Record<string, number> }[],
      acc: { accountOptions?: Record<number, number> },
      w: number,
    ) => (w === 6 ? (acc.accountOptions?.[7] ?? 0) > 0 : chars.some((c) => c.npcDialog?.[`Npc${w}`]));
    expect(
      probeGates(fake, ['Npc1', 'Npc2', 'Npc3', 'Npc4', 'Npc5', 'Other']).map((g) => [
        g.gatekeeper,
        g.accountOption,
      ]),
    ).toEqual([
      ['Npc1', null],
      ['Npc2', null],
      ['Npc3', null],
      ['Npc4', null],
      ['Npc5', null],
      [null, 7],
    ]);
    const out = runOnSlice(
      generator,
      {
        npcRoster: { Npc1: {}, Npc2: {} },
        quests: { Npc3: {}, Npc4: {}, Npc5: {} },
        items: { Crystal1: { displayName: 'Desert_Topaz' }, Crystal4: { displayName: 'Not_A_Gate' } },
      },
      { isWorldFinished: fake },
    );
    const rows = out.facts?.[0]?.rows as Gate[];
    expect(rows[0]).toMatchObject({ world: 1, gatekeeper: 'Npc1', crystal: 'Crystal1' });
    expect(rows[3]?.crystal).toBeNull();
  });

  it('reads the pinned parser: Builder Bird, Constructor Crow, Carpenter Cardinal, Muhmuguh, Lafu Shi', async () => {
    // Hand-checked against quests.ts isWorldFinished at the pin; world 6 is the account option 408 flag.
    const out = await runLive(generator);
    const rows = out.facts[0]?.rows as Gate[];
    expect(rows.map((r) => r.gatekeeper ?? `option ${r.accountOption}`)).toEqual([
      'Builder_Bird',
      'Constructor_Crow',
      'Carpenter_Cardinal',
      'Muhmuguh',
      'Lafu_Shi',
      'option 408',
    ]);
    expect(rows.slice(0, 3).map((r) => r.crystal)).toEqual(['Crystal1', 'Crystal2', 'Crystal3']);
    expect(out.facts[0]?.sources[0]?.tier).toBe(1);
  });

  it("agrees with Toolbox's finishedWorlds on known saves", async () => {
    const out = await runLive(generator);
    const rows = ((out.facts[0]?.rows ?? []) as Gate[]).filter((r) => r.gatekeeper !== null);
    let checked = 0;
    for (const file of ['first.json', 'third.json', 'fresh.json', 'latest.json']) {
      const parsed = knownSave(file);
      // Toolbox's account.finishedWorlds is { World1: boolean, ... }, built from the parsed npcDialog.
      const finished = (parsed.account.finishedWorlds ?? {}) as Record<string, boolean>;
      for (const r of rows) {
        const talked = (parsed.characters as { npcDialog?: Record<string, unknown> }[]).some(
          (c) => !!c.npcDialog?.[r.gatekeeper as string],
        );
        expect(finished[`World${r.world}`], `${file} world ${r.world}`).toBe(talked);
        checked++;
      }
    }
    expect(checked).toBe(20);
  });
});
