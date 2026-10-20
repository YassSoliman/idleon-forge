// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Shared by the World 1 core Detectors (M26 Wave 4: FR-48, 49, 51..53, 78), exported through helpers.ts.
import type { OwlState } from '@idleon-forge/account-state';
import { formatBig } from './template';

/** 5.6e6 -> "5.6M", 5.63e28 -> "5.6e28": the `{x:big}` format, for pictures. */
export const bigWord = formatBig;

/** Orion's upgrades by index (Toolbox `owlData` order). */
export const OWL = {
  generation: 0,
  bonuses: 1,
  multiplier: 2,
  cheapener: 3,
  restart: 4,
  superProduction: 5,
  shiny: 6,
  superCheapener: 7,
  megaReset: 8,
} as const;

/** Orion has never run: no feathers held or made, no Megafeather, no Bonuses of Orion. */
export const owlNotStarted = (o: OwlState): boolean =>
  o.feathers <= 0 && o.progress <= 0 && o.megafeathers <= 0 && o.bonusesLevel <= 0;

/** An upgrade is open and the feathers held pay for its next level. */
export const owlAffordable = (o: OwlState, index: number): boolean => {
  const u = o.upgrades[index];
  return !!u && u.unlocked && o.feathers >= u.cost;
};

/** The stat the next Bonuses of Orion level raises, and by how much (one step of its base). */
export function owlNextBonus(
  o: OwlState,
): { stat: string; offset: number; delta: number; percent: boolean } | null {
  const b = o.bonuses.find((x) => x.offset === o.bonusesLevel % 6);
  if (!b) return null;
  return {
    stat: b.name,
    offset: b.offset,
    delta: Number((b.base * o.bonusMultiplier).toPrecision(4)),
    percent: b.percent,
  };
}

/** "+5% Class XP", "+10 Base DMG". */
export const owlBonusWord = (b: { stat: string; delta: number; percent: boolean }): string =>
  `+${b.delta.toLocaleString('en-US', { maximumFractionDigits: 2 })}${b.percent ? '%' : ''} ${b.stat}`;

/** The Restart's feather multiplier per restart: 3, or 5 once the 7th Megafeather (Pristine) is owned. */
export const owlRestartFactor = (o: OwlState): number => (o.megafeathers > 6 ? 5 : 3);

/** What the next Megafeather does (Toolbox `megaFeathersDesc`, in our words); the 10th and on repeat. */
export const MEGAFEATHER_WORDS: readonly string[] = [
  'feathers x10',
  "Orion's bonuses x2",
  'every upgrade 1% cheaper per Feather Generation level',
  "Orion's bonuses x3",
  'the cheapeners add feathers a second',
  "Orion's bonuses x4",
  'each Restart gives x5 instead of x3',
  "Orion's bonuses x5",
  'Feather Generation costs grow slower',
  "Orion's bonuses x6",
];
export const megafeatherWord = (n: number): string =>
  MEGAFEATHER_WORDS[n - 1] ?? "Orion's bonuses +0.5x more";

/** 12.345 -> 12.3: one decimal for a shown percent or multiplier. */
export const oneDecimal = (n: number): number => Math.round(n * 10) / 10;
