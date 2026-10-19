// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the World 2 and 3 System pages (canvas boards after/sys/Refinery, Construction, Printer, Prayers,
// Shrines): read-only pictures drawn from Account State facts the save already holds. Plain data, so
// they survive structuredClone across the worker boundary. They add no advice and never touch a Verdict;
// a picture element's `actionKey` only says which Next Action it belongs to (M17's highlight).
import type { PictureElement } from '../slots/types';

/** One Refinery salt, in Refinery order. Display names are human ("Redox Salts"). */
export interface RefinerySaltView extends PictureElement {
  rawName: string;
  name: string;
  unlocked: boolean;
  active: boolean;
  rank: number;
  /** The rank bar: power now and the power a hand Refine ranks up at. */
  power: number;
  powerCap: number;
  autoRefine: boolean;
  /** When the bar is full (epoch ms), 0 seconds from the save when already full; null when unknown. */
  fullAt: number | null;
  /** When its fuel runs out (epoch ms), for an active salt; null when unknown or not active. */
  dryAt: number | null;
  /** Its fuel inputs in order, with how many the account holds. */
  fuel: { name: string; held: number }[];
  /** Salts of this kind waiting in the Refinery's storage, and in the storage chest. */
  inRefinery: number;
  inChest: number;
  /** Buildings in a Construction build slot whose next level is paid in this salt ("3D Printer"). */
  paysFor: { name: string; from: number; to: number }[];
}

export interface RefineryPicture {
  systemId: 'refinery';
  kind: 'refinery';
  salts: RefinerySaltView[];
  /** Total salts waiting in the Refinery's own storage. */
  waiting: number;
}

/** One Construction building (`ConstructionState.buildings`), named. */
export interface BuildingView {
  index: number;
  name: string;
  level: number;
  maxLevel: number;
  /** Build progress toward the next level, and the level's cost. */
  progress: number;
  buildCost: number;
  /** Its next level is built and the payment is due. */
  bodyFull: boolean;
  /** The salt its levels are paid in ("Redox Salts"); null when unknown. */
  salt: string | null;
}

export interface BuildSlotsPicture {
  systemId: 'construction';
  kind: 'build-slots';
  /** The open build slots in order: the building it holds, or null when empty. */
  slots: (BuildingView | null)[];
  /** Every building, shrines and the 3D Printer included, in the game's order. */
  buildings: BuildingView[];
  buildRate: number;
}

/** One prayer (Toolbox's list), its bonus and curse in words at its level (level 1 when locked). */
export interface PrayerView {
  index: number;
  name: string;
  bonus: string;
  curse: string;
  level: number;
  unlocked: boolean;
  /** The Worship totem ("Goblin Gorefest") and the wave that unlocks it. */
  zone: string;
  wave: number;
}

export interface PrayersPicture {
  systemId: 'prayers';
  kind: 'prayers';
  prayers: PrayerView[];
  /** Each character's equipped prayers, by `CharacterState.index`, in save order. */
  equipped: { index: number; prayers: string[] }[];
  /** Each totem's best wave and the Worship level it opens at (account `totems`), in game order. */
  totems: { name: string; map: string; levelReq: number; maxWave: number }[];
  /** The account's best Worship level; null when no character's skills read. */
  bestWorship: number | null;
}

export interface ShrineView {
  index: number;
  name: string;
  /** Its bonus in words at its level, or at level 1 while unbuilt ("+12% Total Damage"). */
  what: string;
  /** Its Construction building's level: 0 while it isn't built. */
  built: number;
  /** The shrine's own level, and the map it stands on (null while unbuilt or unplaced). */
  level: number;
  map: string | null;
  /** The salt its building is paid in ("Redox Salts"). */
  salt: string | null;
}

export interface ShrinesPicture {
  systemId: 'shrines';
  kind: 'shrines';
  shrines: ShrineView[];
  /** The maps characters stand on now, most characters first: the map's name and who is there. */
  maps: { map: string; characters: number[] }[];
}

/** The 3D Printer's samples per character (`account.printer`), for the Stored samples tab. */
export interface PrinterSamplesPicture {
  systemId: 'printer';
  kind: 'printer-samples';
  level: number;
  maxLevel: number | null;
  storedSlots: number;
  characters: {
    index: number;
    /** Sample size, 0..100 %. */
    samplePct: number;
    active: { name: string; perHour: number }[];
    stored: { name: string; perHour: number }[];
  }[];
}

export type W23Picture =
  | RefineryPicture
  | BuildSlotsPicture
  | PrayersPicture
  | ShrinesPicture
  | PrinterSamplesPicture;
