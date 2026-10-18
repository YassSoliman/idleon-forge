// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Alchemy Pay 2 Win upgrades (M7 TR-6): one generated Acquisition per upgrade,
// `alchemy-p2w.acquisition.<group>-<upgrade>`: cauldron-<cauldron>-{speed,new-bubble,boost-req},
// liquid-<liquid>-{regen,capacity}, vials-{attempts,rng} and player-{speed,extra-exp} (M19 X2: capped at
// the best Alchemy level, so no maxLevel). Names come from Toolbox's exported
// CAULDRON_INFO and LIQUID_INFO, max levels from its exported CAULDRONS_MAX_LEVELS (parsers/world-2/
// alchemy.ts). The `key` value is the Account State P2wUpgrade key (M7 TR-2), "<group>.<name>.<upgrade>".
//
// Not generated: `unlockAlchemyLevel` (20/35/80 for liquids 2–4) is game code that Toolbox doesn't
// export at the pin, so it stays an authored fact for M7 (ADR 0007's "not yet generatable").
import type { GeneratedEntryT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';

const ALCHEMY_FILE = 'parsers/world-2/alchemy.ts';

interface Info {
  name: string;
  displayName: string;
}

/** CAULDRONS_MAX_LEVELS key for each upgrade. */
const CAULDRON_UPGRADES = [
  ['speed', 'cauldronsSpeed'],
  ['newBubble', 'cauldronsNewBubble'],
  ['boostReq', 'cauldronsBoostReq'],
] as const;
const LIQUID_UPGRADES = [
  ['regen', 'liquidsRegen'],
  ['capacity', 'liquidsCapacity'],
] as const;
const VIAL_UPGRADES = [
  ['attempts', 'vialsAttempts'],
  ['rng', 'vialsRng'],
] as const;

const generator = defineGenerator({
  name: 'alchemy-p2w',
  system: 'alchemy-p2w',
  inputs: [
    `${ALCHEMY_FILE}#CAULDRONS_MAX_LEVELS`,
    `${ALCHEMY_FILE}#CAULDRON_INFO`,
    `${ALCHEMY_FILE}#LIQUID_INFO`,
  ],
  constants: { CAULDRONS_MAX_LEVELS: ALCHEMY_FILE, CAULDRON_INFO: ALCHEMY_FILE, LIQUID_INFO: ALCHEMY_FILE },
  run({ constants, pin }) {
    const max = constants.CAULDRONS_MAX_LEVELS as Record<string, number>;
    const cauldrons = constants.CAULDRON_INFO as Info[];
    const liquids = constants.LIQUID_INFO as Info[];
    if (!max || !Array.isArray(cauldrons) || !Array.isArray(liquids))
      throw new Error('alchemy-p2w: CAULDRONS_MAX_LEVELS, CAULDRON_INFO or LIQUID_INFO missing');
    const source = generatedSource(pin, ALCHEMY_FILE, 'IdleOn Toolbox game data: CAULDRONS_MAX_LEVELS');
    const by = generatedBy(generator, pin);
    const entries: GeneratedEntryT[] = [];
    const add = (
      group: string,
      name: string | null,
      display: string,
      upgrade: string,
      maxKey: string | null,
      slot: number | null,
    ) => {
      const maxLevel = maxKey === null ? null : max[maxKey];
      if (maxKey !== null && typeof maxLevel !== 'number')
        throw new Error(`alchemy-p2w: CAULDRONS_MAX_LEVELS.${maxKey} is not a number`);
      const nameSlug = name === null ? null : slugify(name);
      const slug = [group, nameSlug, slugify(upgrade)].filter(Boolean).join('-');
      const key = [group, nameSlug, upgrade].filter(Boolean).join('.');
      entries.push({
        id: `alchemy-p2w.acquisition.${slug}`,
        system: 'alchemy-p2w',
        type: 'acquisition',
        origin: 'generated',
        title: `Pay 2 Win: ${display} ${upgrade}`.slice(0, 80),
        text: `Alchemy Pay 2 Win upgrade: ${display} ${upgrade}`.slice(0, 240),
        why: 'Pay 2 Win upgrades are bought with coins in the Alchemy screen, up to a fixed max level.',
        values: {
          key,
          group,
          upgrade,
          ...(typeof maxLevel === 'number' ? { maxLevel } : {}),
          ...(slot === null ? {} : { slot }),
        },
        sources: [source],
        appliesTo: { stages: 'all' },
        confidence: 'H',
        status: 'active',
        thing: { kind: 'other', rawName: key.slice(0, 64) },
        generatedBy: by,
      });
    };
    cauldrons.forEach((c, i) => {
      for (const [u, k] of CAULDRON_UPGRADES) add('cauldron', c.name, c.displayName, u, k, i);
    });
    liquids.forEach((l, i) => {
      for (const [u, k] of LIQUID_UPGRADES) add('liquid', l.name, l.displayName, u, k, i);
    });
    for (const [u, k] of VIAL_UPGRADES) add('vials', null, 'Vials', u, k, null);
    // M19 X2: the Player upgrades (Toolbox `p2w.player`), capped at the best Alchemy level (wiki Pay 2 Win).
    for (const u of ['speed', 'extraExp']) add('player', null, 'Player', u, null, null);
    return { entries };
  },
});

export default generator;
