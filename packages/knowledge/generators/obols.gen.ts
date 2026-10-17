// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Obols (M8 TR-3): one generated Acquisition per obol that drops from a monster, id
// `obols.acquisition.<slug of rawName>-drop` (ObolEfauntA -> obol-efaunt-a-drop, as M11 TR-3's
// example extends), its drop chance per monster in `rates` (monsterDrops.json `effectiveChance`) and
// its shape from the item type; plus the fact table `obols.fact.slots`: the personal and family obol
// slots with their shape and level gate (shared-data `obols.character` / `obols.family`). A row's `slot`
// is its position in the save's equipped-order list (ObolEquippedOrder), which keys that data; Toolbox
// shows the slots in another order (calculateWeirdObolIndex), which is display only.
//
// Not generated here: the daily Liquid Shop obol buys ("Not covered yet", M6 D6) and Gem Shop obol
// items (info only, M8 TR-3), so the M8 obol advice reads drops and slots only.
import type { FactTableT, GeneratedEntryT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';
import { humanName, mapsOfMonsters, worldOfMap } from './world-maps';

interface Drop {
  monsterRawName: string;
  rawName: string;
  displayName?: string;
  Type?: string;
  effectiveChance?: number;
  chance?: number;
}
type Slots = Record<string, { shape: string; levelReq: number }>;

const SHAPE_OF_TYPE: Record<string, string> = {
  CIRCLE_OBOL: 'Circle',
  SQUARE_OBOL: 'Square',
  HEXAGON_OBOL: 'Hexagon',
  SPARKLE_OBOL: 'Sparkle',
};

const generator = defineGenerator({
  name: 'obols',
  system: 'obols',
  inputs: [
    'website-data/monsterDrops.json',
    'website-data/shared-data.json#obols',
    'website-data/shared-data.json#mapEnemiesArray',
    'website-data/shared-data.json#mapNames',
  ],
  run({ data, pin }) {
    const drops = data.monsterDrops as Record<string, unknown[]>;
    const slots = data.obols as { character: Slots; family: Slots };
    const maps = mapsOfMonsters(data.mapEnemiesArray as string[], data.mapNames as Record<string, string>);
    if (!slots?.character || !slots?.family) throw new Error('obols: shared-data obols has no slot tables');
    const byObol = new Map<string, { display: string; type: string; rows: Drop[] }>();
    for (const rows of Object.values(drops))
      for (const d of (rows ?? []) as Drop[]) {
        if (!d || typeof d.rawName !== 'string' || !d.rawName.startsWith('Obol')) continue;
        const hit = byObol.get(d.rawName) ?? {
          display: d.displayName ?? d.rawName,
          type: d.Type ?? '',
          rows: [],
        };
        hit.rows.push(d);
        byObol.set(d.rawName, hit);
      }
    const dropSource = generatedSource(
      pin,
      'website-data/monsterDrops.json',
      'IdleOn Toolbox game data: monsterDrops',
    );
    const slotSource = generatedSource(
      pin,
      'website-data/shared-data.json#obols',
      'IdleOn Toolbox game data: obols',
    );
    const by = generatedBy(generator, pin);
    const entries: GeneratedEntryT[] = [...byObol].map(([raw, o]) => {
      const display = humanName(o.display);
      const rates: Record<string, number> = {};
      const monsters = o.rows
        .map((d) => {
          const chance = d.effectiveChance ?? d.chance ?? 0;
          rates[d.monsterRawName] = Math.max(rates[d.monsterRawName] ?? 0, chance);
          const m = maps.get(d.monsterRawName) ?? [];
          return {
            monster: d.monsterRawName,
            chance,
            maps: m,
            world: m.length ? Math.min(...m.map(worldOfMap)) : null,
          };
        })
        .sort((a, b) => a.monster.localeCompare(b.monster));
      const shape = SHAPE_OF_TYPE[o.type] ?? null;
      return {
        id: `obols.acquisition.${slugify(raw)}-drop`,
        system: 'obols',
        type: 'acquisition',
        origin: 'generated',
        title: `Obol drop: ${display}`.slice(0, 80),
        text: `${display} drops from monsters`.slice(0, 240),
        why: 'This obol drops from the listed monsters at a small base chance.',
        values: { name: o.display, ...(shape ? { shape } : {}) },
        sources: [dropSource],
        appliesTo: { stages: 'all' },
        confidence: 'H',
        status: 'active',
        thing: { kind: 'obol', rawName: raw },
        rates,
        data: { monsters },
        generatedBy: by,
      };
    });
    const table = (t: Slots) =>
      Object.entries(t)
        .map(([i, s]) => ({ slot: Number(i), shape: s.shape, levelReq: s.levelReq }))
        .sort((a, b) => a.slot - b.slot);
    const facts: FactTableT[] = [
      {
        id: 'obols.fact.slots',
        system: 'obols',
        origin: 'generated',
        title: 'Obol slots: shapes and level gates',
        rows: { character: table(slots.character), family: table(slots.family) },
        sources: [slotSource],
        generatedBy: by,
      },
    ];
    return { entries, facts };
  },
});

export default generator;
