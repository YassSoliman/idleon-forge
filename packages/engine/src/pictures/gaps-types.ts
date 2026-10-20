// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 2, the W2/W3 gaps: the read-only pictures of the wave's pages (pictures/gaps.ts). Data only;
// the pages lay them out and add no advice (M17).

export interface ForgeItemView {
  rawName: string;
  /** "Copper Ore" */
  name: string;
  amount: number;
}

export interface ForgeSlotView {
  index: number;
  unlocked: boolean;
  brimstone: boolean;
  ore: ForgeItemView | null;
  /** Ore against one slot's capacity, 0..1. */
  fill: number;
  smelting: boolean;
  /** Seconds from the save until it empties; 0 when not smelting. */
  emptyInSeconds: number;
  bar: ForgeItemView | null;
  barrel: (ForgeItemView & { effect: 'speed' | 'double'; power: number }) | null;
}

export interface ForgePicture {
  systemId: 'forge';
  kind: 'forge';
  slotsUnlocked: number;
  slots: ForgeSlotView[];
  /** Unlocked slots with less than one bar's worth of ore. */
  idle: number;
  /** The soonest smelting slot to empty, seconds from the save; null when none smelts. */
  firstEmptySeconds: number | null;
  barsWaiting: number;
  /** Bars waiting, by bar, most first. */
  bars: ForgeItemView[];
  capacity: number;
  upgrades: Array<{ name: string; level: number; maxLevel: number }>;
  /** Ores held (storage and bags) that make at least one bar, most first. */
  ores: Array<ForgeItemView & { bars: number }>;
  barrels: Array<ForgeItemView & { effect: 'speed' | 'double'; power: number }>;
}

export type GapsPicture = ForgePicture;
