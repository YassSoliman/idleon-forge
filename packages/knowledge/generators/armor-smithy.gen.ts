// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 F4 (docs/specs/M18-gear-tools.md TR-3, F-g): `armor-smithy.fact.sets`, the nine W1–W3 armour sets
// in the Armor-set Smithy's list order (randomList[113], Toolbox `SMITHY_SET_ORDER`), with their parts
// and how many tools and weapons each set needs (Toolbox `getSetPartsReq`), and the bonus in words.
import type { FactTableT } from '../src/schema';
import { type EquipmentSet, W13_SETS } from './gear.gen';
import { defineGenerator, generatedBy, generatedSource } from './types';

const human = (s: string) => s.replace(/_/g, ' ').trim();

const generator = defineGenerator({
  name: 'armor-smithy',
  system: 'armor-smithy',
  inputs: ['website-data/shared-data.json#equipmentSets', 'website-data/randomList.json'],
  run({ data, pin }) {
    const sets = data.equipmentSets as EquipmentSet[];
    const order = ((data.randomList as unknown[])[113] as string[] | undefined) ?? [];
    const rank = (s: string) => {
      const i = order.indexOf(s);
      return i === -1 ? order.length : i;
    };
    const smithy = sets
      .filter((s) => (W13_SETS as readonly string[]).includes(s.setName))
      .sort((a, b) => rank(a.setName) - rank(b.setName))
      .map((s) => ({
        set: s.setName,
        name: human(
          s.setName
            .replace(/_SET$/, '')
            .toLowerCase()
            .replace(/^./, (c) => c.toUpperCase()),
        ),
        armors: s.armors,
        tools: s.tools,
        weapons: s.weapons,
        requiredTools: s.requiredTools,
        requiredWeapon: s.requiredWeapon,
        bonusValue: s.bonusValue,
        // Toolbox's rule: `{` is the value, `}` the multiplier 1 + value/100 ("1.5x Coins").
        bonus: human(
          s.description
            .replace('{', String(s.bonusValue))
            .replace('}', String(Math.round((1 + s.bonusValue / 100) * 100) / 100))
            .replace('|', ' '),
        ),
      }));

    const facts: FactTableT[] = [
      {
        id: 'armor-smithy.fact.sets',
        system: 'armor-smithy',
        origin: 'generated',
        title: 'W1–W3 armour sets in the Smithy',
        rows: smithy as unknown as FactTableT['rows'],
        sources: [
          generatedSource(
            pin,
            'website-data/shared-data.json#equipmentSets',
            'IdleOn Toolbox game data: equipment sets',
          ),
        ],
        generatedBy: generatedBy(generator, pin),
      },
    ];
    return { facts };
  },
});

export default generator;
