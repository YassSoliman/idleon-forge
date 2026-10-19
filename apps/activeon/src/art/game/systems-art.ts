// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The game sprites the System pages draw (M25, ADR 0009 as amended 2026-10-19), each named the way
// IdleOn Toolbox draws the same thing (the Toolbox file is cited per helper). Paths only: <GameIcon>
// loads them and falls back to our own sprite.
import { dataArt, type GameArt } from './game-art';
import { ITEM_BY_NAME } from './item-names.gen';

const isIndex = (n: number | null | undefined): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0;

/** A material by the display name a view shows ("Forest Fibres"), or null when it isn't one we know. */
export const materialArt = (name: string | null | undefined): GameArt | null =>
  dataArt(name ? ITEM_BY_NAME[name.replace(/_/g, ' ').trim()] : null);

/**
 * A statue by its index (0 = Power Statue), in its grade's colour: stone, Gold, Onyx, Zenith
 * (data/Statue<n>, StatueG<n>, StatueO<n>, StatueZ<n>, 1-based, as the game's statue wall).
 */
export function statueArt(index: number, grade = 0): GameArt | null {
  if (!isIndex(index)) return null;
  const prefix = ['Statue', 'StatueG', 'StatueO', 'StatueZ'][Math.min(3, Math.max(0, grade))] ?? 'Statue';
  return { path: `data/${prefix}${index + 1}` };
}
/** A statue's item (data/EquipmentStatues<n>), the fallback when a grade has no picture. */
export const statueItemArt = (index: number): GameArt | null =>
  isIndex(index) ? { path: `data/EquipmentStatues${index + 1}` } : null;

/** An Upgrade Vault row by its index (Toolbox: data/VaultUpg<index>). */
export const vaultArt = (index: number): GameArt | null =>
  isIndex(index) ? { path: `data/VaultUpg${index}` } : null;

/** A Construction building by its index (Toolbox buildings.jsx: data/ConTower<index>). */
export const buildingArt = (index: number): GameArt | null =>
  isIndex(index) ? { path: `data/ConTower${index}` } : null;

/** A shrine by its own index 0..8 (Toolbox shrines.ts: rawName ConTowerB<18 + index>). */
export const shrineArt = (index: number): GameArt | null =>
  isIndex(index) ? { path: `data/ConTowerB${18 + index}` } : null;

/** A prayer by its index (Toolbox: data/Prayer<prayerIndex>). */
export const prayerArt = (index: number): GameArt | null =>
  isIndex(index) ? { path: `data/Prayer${index}` } : null;

/** A Worship totem by its game order (Toolbox Totems.jsx: etc/totem_<index>). */
export const totemArt = (index: number): GameArt | null =>
  isIndex(index) ? { path: `etc/totem_${index}` } : null;

/**
 * A cog on the Construction board. Account State keeps which squares hold a cog but not which cog,
 * so every cog square draws the game's plain cog.
 */
export const COG_ART: GameArt = { path: 'data/Cog0A0' };

/** The Anvil Reset Whetstone item. */
export const WHETSTONE_ART: GameArt = { path: 'data/Whetstone' };

/** The three minigames' pictures: the darts wheel, the basketball, the spike trap. */
export const MINIGAME_ART: Readonly<Record<'darts' | 'hoops' | 'spiketrap', GameArt>> = {
  darts: { path: 'data/MGp' },
  hoops: { path: 'data/HoopB' },
  spiketrap: { path: 'etc/Spike_Minigame' },
};

/**
 * An Alchemy station: the four cauldrons (data/aEmptyCauldronB0..3, Power to Kazam) and the four
 * liquids (Toolbox: data/Liquid<n>_x1, Water Droplets to Toxic Mercury).
 */
export const STATION_ART: Readonly<
  Record<'power' | 'quicc' | 'high-iq' | 'kazam' | 'water' | 'nitrogen' | 'trench' | 'mercury', GameArt>
> = {
  power: { path: 'data/aEmptyCauldronB0' },
  quicc: { path: 'data/aEmptyCauldronB1' },
  'high-iq': { path: 'data/aEmptyCauldronB2' },
  kazam: { path: 'data/aEmptyCauldronB3' },
  water: { path: 'data/Liquid1_x1' },
  nitrogen: { path: 'data/Liquid2_x1' },
  trench: { path: 'data/Liquid3_x1' },
  mercury: { path: 'data/Liquid4_x1' },
};

/** The Star Signs road's three legs. */
export const STAR_ROAD_ART: Readonly<Record<'telescope' | 'constellations' | 'cosmos', GameArt>> = {
  telescope: { path: 'data/SignStar3a' }, // a bright star: the Telescope opens star-sign slots
  constellations: { path: 'data/SignStarC0' }, // a star sign
  cosmos: { path: 'data/SignStarA2' }, // the Chronus sign, for the second slot
};
