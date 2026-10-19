// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C (FR-C7, FR-C8, section 6): the terms of one character's anvil speed, each the Toolbox helper
// `getPlayerAnvil` calls (vendor/parsers/world-1/anvil.ts, the "ANVIL SPEED MATH" block), so the
// Production Plan can show what a lever adds without re-deriving the formula. `speedWith` re-runs
// Toolbox's own `getAnvilSpeed` on the same terms with one changed (the Anvil Zoomer stamp's next level,
// Hammer Hammer on). Runs only in the parse worker (ADR 0006).
import { getAllSkillsExp } from '../vendor/parsers/character';
import { getSpeedBonusFromAgility, isCompanionBonusActive } from '../vendor/parsers/misc';
import { getUpgradeVaultBonus } from '../vendor/parsers/misc/upgradeVault';
import { getStarSignBonus } from '../vendor/parsers/starSigns';
import { getTalentBonus } from '../vendor/parsers/talents';
import { calcAnvilExp, getAnvilSpeed } from '../vendor/parsers/world-1/anvil';
import { getStampBonus } from '../vendor/parsers/world-1/stamps';
import { getStatueBonus } from '../vendor/parsers/world-1/statues';
import { getActiveBubbleBonus } from '../vendor/parsers/world-2/alchemy';
import { getPostOfficeBonus } from '../vendor/parsers/world-3/postoffice';
import type { AnvilSpeedTerms } from './types';

// biome-ignore lint/suspicious/noExplicitAny: Toolbox's own account and character types are untyped.
type Any = any;

export type { AnvilSpeedTerms };

const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** The terms for one character, or null when its anvil stats are missing. Throws what Toolbox throws. */
export function anvilSpeedTerms(character: unknown, account: unknown): AnvilSpeedTerms | null {
  const c = character as Any;
  const a = account as Any;
  const stats = c?.anvil?.anvilStats;
  if (!stats) return null;
  return {
    agility: n(c?.stats?.agility),
    speedPoints: n(stats.speedPoints),
    stamp: n(getStampBonus(a, 'skills', 'StampB3', c)),
    box: n(getPostOfficeBonus(c?.postOffice, 'Blacksmith_Box', 1)),
    hammerHammer: n(getActiveBubbleBonus(c?.equippedBubbles, 'HAMMER_HAMMER', a)),
    statue: n(getStatueBonus(a, 11, c?.flatTalents)),
    starSign: n(getStarSignBonus(c, a, 'Speed_in_Town')),
    brokenTime: n(getTalentBonus(c?.flatTalents, 'BROKEN_TIME')),
    vault: n(getUpgradeVaultBonus(a?.upgradeVault?.upgrades, 24)),
  };
}

/** Anvil speed per hour (Toolbox `stats.anvilSpeed`) for these terms. */
export function anvilSpeedOf(t: AnvilSpeedTerms): number {
  return (
    3600 *
    getAnvilSpeed(
      t.agility,
      t.speedPoints,
      t.stamp,
      t.box,
      t.hammerHammer,
      t.statue,
      t.starSign,
      t.brokenTime,
      t.vault,
    )
  );
}

/** Whether Hammer Hammer counts without being equipped (companion bonus 4, `getActiveBubbleBonus`). */
export const hammerHammerByCompanion = (account: unknown): boolean =>
  Boolean(isCompanionBonusActive(account as Any, 4));

/** The agility multiplier `getAnvilSpeed` applies, for the speed-up steps' "effect" lines. */
export const agilityMultiplier = (agility: number): number => n(getSpeedBonusFromAgility(agility));

/**
 * Toolbox `calcAnvilExp` (the anvil's Smithing EXP bonus, percent) for one character, with the
 * character's own Exp points and `getPlayerAnvil`'s `baseAnvilExp` (`getAllSkillsExp`), as Toolbox's
 * anvil screen calls it. Used only to weigh characters against each other (US-C6).
 */
export function anvilExpBonus(character: unknown, characters: unknown[], account: unknown): number | null {
  const c = character as Any;
  const xp = c?.anvil?.anvilStats?.xpPoints;
  const base = n((getAllSkillsExp(c, characters as Any[], account) as Any)?.value);
  const v = calcAnvilExp(c, characters, account, base, n(xp));
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
