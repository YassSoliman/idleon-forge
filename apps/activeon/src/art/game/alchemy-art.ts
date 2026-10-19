// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Alchemy's game sprites (M25, ADR 0009 as amended 2026-10-19), named as IdleOn Toolbox draws them
// (pages/account/world-2/cauldrons.jsx, vials.jsx): a bubble cauldron is data/aJarB<i>, a liquid's
// cauldron data/aJarL<i>, a liquid data/Liquid<n>_x1, a vial's jar data/aVials<level> (locked ones as
// level 1), and a vial's item its rawName. VIAL_ITEMS is each vial's main item by vial index, copied from
// Toolbox's vials.json at the pin (6c37e3d); game-art-coverage-alchemy.test.tsx checks it still matches.
import { dataArt, type GameArt, vialArt } from './game-art';

/** The four bubble cauldrons in game order (Power, Quicc, High-IQ, Kazam). */
const POTS = ['power', 'quicc', 'high-iq', 'kazam'];

/** A bubble cauldron by its engine id ("power"): the cauldron brewing its colour. */
export const cauldronArt = (cauldron: string): GameArt | null => {
  const i = POTS.indexOf(cauldron);
  return i < 0 ? null : { path: `data/aJarB${i}` };
};

/** A liquid (0 Water, 1 Nitrogen, 2 Sea Water, 3 Mercury): its drop. */
export const liquidArt = (index: number): GameArt | null =>
  Number.isInteger(index) && index >= 0 && index < 4 ? { path: `data/Liquid${index + 1}_x1` } : null;

/** A liquid's own cauldron (Toolbox draws it beside the liquid's bar). */
export const liquidCauldronArt = (index: number): GameArt | null =>
  Number.isInteger(index) && index >= 0 && index < 4 ? { path: `data/aJarL${index}` } : null;

/** A vial's jar: the jar of its level, a locked vial as level 1 (as Toolbox draws it). */
export const vialJarArt = (level: number): GameArt | null => vialArt(Math.max(1, level));

/** Each vial's main item rawName, by vial index (Toolbox vials.json `mainItem`). */
export const VIAL_ITEMS: readonly string[] = [
  'Copper',
  'OakTree',
  'Grasslands1',
  'CraftMat1',
  'CopperBar',
  'Grasslands3',
  'Jungle2',
  'CraftMat5',
  'JungleTree',
  'IronBar',
  'Forest1',
  'ToiletTree',
  'Gold',
  'Forest3',
  'Fish1',
  'Sewers2',
  'Bug1',
  'DesertA2',
  'Plat',
  'Fish2',
  'BobJoePickle',
  'SnowA1',
  'Soul1',
  'Critter2',
  'Void',
  'Refinery1',
  'Bug5',
  'SaharanFoal',
  'Critter1A',
  'SnowB2',
  'Soul2',
  'Critter4',
  'SnowB3',
  'Refinery2',
  'SnowB5',
  'Soul4',
  'SnowC1',
  'Critter7',
  'SnowC4',
  'Refinery5',
  'Critter9',
  'BallJoePickle',
  'GalaxyA1',
  'GalaxyA3',
  'Fish6',
  'Soul5',
  'GalaxyB3',
  'Critter10',
  'GalaxyB4',
  'GalaxyC1b',
  'Fish8',
  'GalaxyC4',
  'LavaA1',
  'Tree9',
  'LavaA5b',
  'DreadloBar',
  'Bug10',
  'LavaB3',
  'Soul6',
  'LavaC2',
  'Marble',
  'Tree11',
  'Fish13',
  'Bug11',
  'SpiA2',
  'Bug12',
  'Fish12',
  'SpiB1',
  'Bug13',
  'GodshardBar',
  'Soul7',
  'SpiC2',
  'Tree13',
  'SpiD3',
  'Critter11',
  'Spelunking0',
  'Tree14',
  'w7A3',
  'Prehistrium',
  'Soul8',
  'Spelunking2',
  'w7A5',
  'Bug15',
  'w7A12',
  'w7B12b',
  'Spelunking5',
  'w7B10',
];

/** The item a vial needs, by vial index. */
export const vialItemArt = (index: number): GameArt | null => dataArt(VIAL_ITEMS[index]);
