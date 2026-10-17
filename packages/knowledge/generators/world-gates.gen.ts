// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// World gates (M2 TR-7): `metapath.fact.world-gates`. Toolbox's exported isWorldFinished (quests.ts)
// hard-codes the gatekeeper NPC standing past each world's exit; the generator reads it by calling the
// function on probe inputs (one NPC's dialogue at a time, then one account option at a time for a
// world gated by an account flag) instead of copying the names. The world gate crystals are the
// items Crystal1–Crystal3 of items.json (W1–W3). The boss and boss map per world are not in Toolbox's
// data or exports at the pin, so they stay authored tier 2 in M2's table until they are.
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';

export const QUESTS_FILE = 'parsers/quests.ts';
export const WORLDS = [1, 2, 3, 4, 5, 6] as const;
const OPTION_PROBE = 1000;

export type IsWorldFinished = (
  characters: { npcDialog?: Record<string, number> }[],
  account: { accountOptions?: Record<number, number> },
  world: number,
) => boolean;

export interface WorldGate {
  world: number;
  /** The NPC whose dialogue marks the exit as used, or null when an account option does. */
  gatekeeper: string | null;
  /** OptLacc index that marks the exit as used, when no NPC does. */
  accountOption: number | null;
  /** The crystal item that opens the gate (W1–W3), or null. */
  crystal: string | null;
  crystalName: string | null;
}

/** Probes isWorldFinished for each world's gatekeeper NPC among `npcs`, or its account option. */
export function probeGates(fn: IsWorldFinished, npcs: readonly string[]) {
  return WORLDS.map((world) => {
    if (fn([], {}, world))
      throw new Error(`world-gates: world ${world} counts as finished on an empty account`);
    const gatekeeper = npcs.find((npc) => fn([{ npcDialog: { [npc]: 1 } }], {}, world)) ?? null;
    let accountOption: number | null = null;
    if (gatekeeper === null)
      for (let i = 0; i < OPTION_PROBE && accountOption === null; i++)
        if (fn([], { accountOptions: { [i]: 1 } }, world)) accountOption = i;
    return { world, gatekeeper, accountOption };
  });
}

const generator = defineGenerator({
  name: 'world-gates',
  system: 'metapath',
  inputs: [
    `${QUESTS_FILE}#isWorldFinished`,
    'website-data/shared-data.json#npcRoster',
    'website-data/quests.json',
    'website-data/items.json',
  ],
  constants: { isWorldFinished: QUESTS_FILE },
  run({ data, constants, pin }) {
    const fn = constants.isWorldFinished;
    if (typeof fn !== 'function') throw new Error('world-gates: isWorldFinished is not a function');
    const npcs = [
      ...new Set([
        ...Object.keys(data.npcRoster as Record<string, unknown>),
        ...Object.keys(data.quests as Record<string, unknown>),
      ]),
    ].sort();
    const items = data.items as Record<string, { displayName?: string }>;
    const rows: WorldGate[] = probeGates(fn as IsWorldFinished, npcs).map((g) => {
      const crystal = g.world <= 3 && items[`Crystal${g.world}`] ? `Crystal${g.world}` : null;
      return { ...g, crystal, crystalName: crystal ? (items[crystal]?.displayName ?? null) : null };
    });
    for (const r of rows)
      if (r.gatekeeper === null && r.accountOption === null)
        throw new Error(`world-gates: no gatekeeper found for world ${r.world}`);
    const by = generatedBy(generator, pin);
    const facts: FactTableT[] = [
      {
        id: 'metapath.fact.world-gates',
        system: 'metapath',
        origin: 'generated',
        title: 'World gates: gatekeeper and crystal per world',
        rows: rows.map((r) => ({ ...r })),
        sources: [generatedSource(pin, QUESTS_FILE, 'IdleOn Toolbox: isWorldFinished gatekeepers')],
        generatedBy: by,
        notes: 'Boss and boss map per world are not generated yet (not in Toolbox data at the pin).',
      },
    ];
    return { facts };
  },
});

export default generator;
