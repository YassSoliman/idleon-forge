// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19 Alchemy F1 (docs/specs/M19-alchemy.md TR-3, ADR 0007): the generated fact tables the Bubble Plan,
// the vial order and the Liquid Shop read.
// - `alchemy-bubbles.fact.curves`: every W1-W3 bubble's curve (func, x1, x2), its materials with their base
//   costs, and its band levels: the first level at 10 %, 20 % and 40 % of the bubble's maximum value (F-a).
//   `decay` is x1·L/(L+x2), so it reaches a share f at L = f·x2/(1-f): x2/9, x2/4 and 2·x2/3. For
//   `decayMulti` the share is of the bonus above 1x (our own definition, F-a), the same fractions. Linear
//   curves (`addDECAY`, `bigBase`, `add`) have no maximum: they take the levels of the reference curve
//   x2 = 100 (12, 25, 67), our own rule (FR-1). W1-W3 means no Trench Seawater, Toxic Mercury or Bits cost
//   (those open at Alchemy 35, 80 or in W5).
// - `alchemy-vials.fact.catalogue`: the 42 W1-W3 vials (catalogue index below 42): name, item, the roll
//   needed (`discoveryScore`), liquid and effect stat.
// - `alchemy-vials.fact.costs`: Toolbox's exported `vialCostsArray` (item cost from level L to L+1 is
//   items[L]) and the liquid rule 3·L (Toolbox's own vial alert, utility/dashboard/account.js L477-494).
// - `alchemy.fact.liquid-shop`: the Liquid Shop items (price x1·x2^bought) and whether the price resets at
//   the daily reset. The flag is authored from the wiki: only the two Talent Points and Small Donation
//   never reset (wiki Alchemy, Liquid Shop); N.js resets the others in the daily-reset block.
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';

interface CauldronInfo {
  name: string;
  imageLetter: string;
}
interface RawBubble {
  bubbleName: string;
  func: string;
  x1: number;
  x2: number;
  itemReq: { rawName: string; baseCost: number }[];
}
interface RawVial {
  name?: string;
  mainItem?: string;
  discoveryScore?: number;
  stat?: string;
  itemReq?: { rawName: string }[];
}

/** The band fractions of FR-1 / D-3: W2, W3, W3-late. */
export const BAND_FRACTIONS = [0.1, 0.2, 0.4] as const;
/** FR-1's reference curve for linear bubbles. */
export const LINEAR_REFERENCE_X2 = 100;
export const LINEAR_FUNCS: ReadonlySet<string> = new Set(['addDECAY', 'bigBase', 'add']);
export const DECAY_FUNCS: ReadonlySet<string> = new Set(['decay', 'decayMulti']);
/** The W1-W3 vials: catalogue indices 0-41 (account-state W13_VIALS). */
export const W13_VIAL_COUNT = 42;
/** Liquid Shop items whose price never resets (wiki Alchemy, Liquid Shop): Small Donation, both Talent Points. */
export const NEVER_RESETS: ReadonlySet<number> = new Set([6, 8, 17]);

/** The first level whose share of a `x1·L/(L+x2)` curve's maximum is at least `f`. */
export function bandLevel(x2: number, f: number): number {
  const exact = (f * x2) / (1 - f);
  return Math.max(1, Math.ceil(exact - 1e-9));
}

export interface CurveRow {
  rawName: string;
  cauldron: string;
  index: number;
  name: string;
  func: string;
  x1: number;
  x2: number;
  linear: boolean;
  materials: { rawName: string; baseCost: number; name: string }[];
  /** Levels at 10 %, 20 % and 40 % of maximum; null for a curve M19 can't band. */
  bands: [number, number, number] | null;
}

type ItemNames = Record<string, { displayName?: string } | undefined>;
const itemName = (items: ItemNames, raw: string) => items[raw]?.displayName ?? raw;

export function curveRows(
  cauldrons: Record<string, RawBubble[]>,
  info: readonly CauldronInfo[],
  items: ItemNames = {},
): CurveRow[] {
  const rows: CurveRow[] = [];
  for (const c of info) {
    const list = cauldrons[c.name];
    if (!Array.isArray(list)) throw new Error(`alchemy-curves: cauldron ${c.name} is missing`);
    list.forEach((b, index) => {
      const materials = b.itemReq
        .filter((r) => r.rawName !== 'Blank')
        .map((r) => ({
          rawName: r.rawName,
          baseCost: r.baseCost,
          name: /^Liquid\d$/.test(r.rawName) ? r.rawName : itemName(items, r.rawName),
        }));
      if (materials.some((m) => /^Liquid[34]$/.test(m.rawName) || m.rawName === 'Bits')) return;
      const linear = LINEAR_FUNCS.has(b.func);
      const x2 = linear ? LINEAR_REFERENCE_X2 : b.x2;
      const bands =
        linear || (DECAY_FUNCS.has(b.func) && b.x2 > 0)
          ? (BAND_FRACTIONS.map((f) => bandLevel(x2, f)) as [number, number, number])
          : null;
      rows.push({
        rawName: `aUpgrades${c.imageLetter}${index}`,
        cauldron: c.name,
        index,
        name: b.bubbleName,
        func: b.func,
        x1: b.x1,
        x2: b.x2,
        linear,
        materials,
        bands,
      });
    });
  }
  return rows;
}

export function vialRows(vials: Record<string, RawVial> | RawVial[], items: ItemNames = {}) {
  const list = Array.isArray(vials) ? vials : Object.values(vials);
  return list.slice(0, W13_VIAL_COUNT).map((v, index) => {
    const liquid = Number(/^Liquid([1-4])$/.exec(v.itemReq?.[1]?.rawName ?? '')?.[1] ?? 0);
    if (!v.name || !v.mainItem || typeof v.discoveryScore !== 'number' || liquid < 1)
      throw new Error(`alchemy-curves: vial ${index} is incomplete`);
    return {
      index,
      name: v.name,
      item: v.mainItem,
      itemName: itemName(items, v.mainItem),
      score: v.discoveryScore,
      liquid,
      stat: v.stat ?? '',
    };
  });
}

const ALCHEMY_FILE = 'parsers/world-2/alchemy.ts';

const generator = defineGenerator({
  name: 'alchemy-curves',
  system: 'alchemy-bubbles',
  inputs: [
    'website-data/cauldrons.json',
    'website-data/vials.json',
    'website-data/items.json',
    'website-data/shared-data.json#liquidsShop',
    `${ALCHEMY_FILE}#CAULDRON_INFO`,
    `${ALCHEMY_FILE}#vialCostsArray`,
  ],
  constants: { CAULDRON_INFO: ALCHEMY_FILE, vialCostsArray: ALCHEMY_FILE },
  run({ data, constants, pin }) {
    const info = constants.CAULDRON_INFO as CauldronInfo[];
    const costs = constants.vialCostsArray as number[];
    if (!Array.isArray(info) || !Array.isArray(costs))
      throw new Error('alchemy-curves: CAULDRON_INFO or vialCostsArray is not exported');
    const by = generatedBy(generator, pin);
    const shop = (data.liquidsShop as { name: string; x1: number; x2: number; index: number }[]).map((s) => ({
      index: s.index,
      name: s.name,
      x1: s.x1,
      x2: s.x2,
      resetsDaily: !NEVER_RESETS.has(s.index),
    }));
    const facts: FactTableT[] = [
      {
        id: 'alchemy-bubbles.fact.curves',
        system: 'alchemy-bubbles',
        origin: 'generated',
        title: 'Alchemy bubble curves and band levels',
        rows: curveRows(
          data.cauldrons as Record<string, RawBubble[]>,
          info,
          data.items as ItemNames,
        ) as unknown as FactTableT['rows'],
        sources: [generatedSource(pin, 'website-data/cauldrons.json', 'IdleOn Toolbox game data: cauldrons')],
        generatedBy: by,
      },
      {
        id: 'alchemy-vials.fact.catalogue',
        system: 'alchemy-vials',
        origin: 'generated',
        title: 'W1-W3 vial catalogue',
        rows: vialRows(
          data.vials as Record<string, RawVial>,
          data.items as ItemNames,
        ) as unknown as FactTableT['rows'],
        sources: [
          generatedSource(pin, 'website-data/vials.json', 'IdleOn Toolbox game data: vials and items'),
        ],
        generatedBy: by,
      },
      {
        id: 'alchemy-vials.fact.costs',
        system: 'alchemy-vials',
        origin: 'generated',
        title: 'Vial level costs',
        rows: { items: costs, liquidPerLevel: 3 },
        sources: [generatedSource(pin, ALCHEMY_FILE, 'IdleOn Toolbox vialCostsArray')],
        generatedBy: by,
      },
      {
        id: 'alchemy.fact.liquid-shop',
        system: 'alchemy',
        origin: 'generated',
        title: 'Liquid Shop items',
        rows: shop as unknown as FactTableT['rows'],
        sources: [
          generatedSource(
            pin,
            'website-data/shared-data.json#liquidsShop',
            'IdleOn Toolbox game data: liquidsShop',
          ),
        ],
        generatedBy: by,
      },
    ];
    return { facts };
  },
});

export default generator;
