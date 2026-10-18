// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Exact talent points (ADR 0010): the bonus terms of the game's `_customBlock_TotalTalentPoints` (N.js)
// that need Toolbox's computed values (bubbles, vials, star signs, stamps, shinies, the Upgrade Vault,
// companions, talents, W6/W7 class systems). Each is one Toolbox helper, called as the game calls the
// matching block; the arithmetic that combines them lives in @idleon-forge/account-state
// (talent-points-formula.ts), next to the raw-save terms. Runs only in the parse worker (ADR 0006).

import { getCompassBonus } from '../vendor/parsers/class-specific/compass';
import { getGrimoireBonus } from '../vendor/parsers/class-specific/grimoire';
import { getArmoryUpgradeBonus, getOrbletMarketBonus } from '../vendor/parsers/class-specific/royalGuardian';
import { getTesseractBonus } from '../vendor/parsers/class-specific/tesseract';
import { getDungeonFlurboStatBonus } from '../vendor/parsers/dungeons';
import { isCompanionBonusActive } from '../vendor/parsers/misc';
import { getUpgradeVaultBonus } from '../vendor/parsers/misc/upgradeVault';
import { getStarSignBonus } from '../vendor/parsers/starSigns';
import { getTalentBonus, mainStatMap } from '../vendor/parsers/talents';
import { getStampsBonusByStat } from '../vendor/parsers/world-1/stamps';
import { getBubbleBonus, getVialsBonusByStat } from '../vendor/parsers/world-2/alchemy';
import { getArcadeBonus } from '../vendor/parsers/world-2/arcade';
import { getShinyBonus } from '../vendor/parsers/world-4/breeding';
import { getJellyBonus } from '../vendor/parsers/world-7/jellyOperator';
import { getSpelunkingBonus } from '../vendor/parsers/world-7/spelunking';

// biome-ignore lint/suspicious/noExplicitAny: Toolbox's own account and character types are untyped.
type Any = any;

/**
 * The character Toolbox's bonus lookups should read for one preset. The active preset is the parse's
 * character as is; `'other'` is a copy carrying `talentPreset.flatTalents` (tab-shaped in Toolbox, with
 * added levels applied, flattened here) and `.flatStarTalents`, because GetTalentNumber reads the live
 * preset's `SkillLevels`. null when there is no other preset.
 */
export function presetSubject(
  character: unknown,
  preset: 'active' | 'other',
): Record<string, unknown> | null {
  const c = character as Record<string, unknown> | null;
  if (!c || typeof c !== 'object') return null;
  if (preset === 'active') return c;
  const p = c.talentPreset as Record<string, unknown> | undefined;
  if (!p || !Array.isArray(p.flatStarTalents)) return null;
  const tabs = p.flatTalents;
  const flat = Array.isArray(tabs)
    ? tabs
    : tabs && typeof tabs === 'object'
      ? Object.values(tabs as Record<string, { orderedTalents?: unknown[] }>).flatMap((t) =>
          Array.isArray(t?.orderedTalents) ? t.orderedTalents : [],
        )
      : null;
  if (!flat) return null;
  return { ...c, flatTalents: flat, flatStarTalents: p.flatStarTalents };
}

/** The class talent bubble TotalTalentPoints adds to tabs 1-4 (`DNSM.AlchBubbles.TalArchers/TalWarrior/TalWiz`). */
const TALENT_BUBBLES: { below: number; name: string; cauldron: string; mainStat: string }[] = [
  // Game: `7 > CharacterClass ? TalArchers`: the Beginner line gets the archer bubble ("the SECRET class").
  { below: 7, name: 'FAST_BOI_TALENT', cauldron: 'quicc', mainStat: 'agility' },
  { below: 19, name: 'BUFF_BOI_TALENT', cauldron: 'power', mainStat: 'strength' },
  { below: 31, name: 'FAST_BOI_TALENT', cauldron: 'quicc', mainStat: 'agility' },
  { below: Number.POSITIVE_INFINITY, name: 'SMART_BOI_TALENT', cauldron: 'high-iq', mainStat: 'wisdom' },
];

const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/**
 * Every Toolbox-computed term of TotalTalentPoints for one character's preset, by term id (the ids
 * account-state's `TALENT_POINT_TERMS` cites). Missing systems read 0, as the game's blocks do.
 * null when the preset doesn't exist. Throws what Toolbox throws; the adapter catches it.
 */
export function talentPointTerms(
  character: unknown,
  account: unknown,
  preset: 'active' | 'other',
): Record<string, number> | null {
  const c = presetSubject(character, preset) as Any;
  if (!c) return null;
  const a = account as Any;
  const classIndex = n(c.classIndex);
  const talent = (name: string, y = false) => n(getTalentBonus(c.flatTalents, name, y));
  const starTalent = (name: string) => n(getTalentBonus(c.flatStarTalents, name));
  const bubble = TALENT_BUBBLES.find((b) => classIndex < b.below) ?? TALENT_BUBBLES[3];
  const shiny = (passive: string) => n(getShinyBonus(a?.breeding?.pets, passive));
  const vault = (i: number) => n(getUpgradeVaultBonus(a?.upgradeVault?.upgrades, i));
  const stamp = (stat: string) => n(getStampsBonusByStat(a, stat, c));
  const vial = (stat: string) => n(getVialsBonusByStat(a?.alchemy?.vials, stat));
  // An unbought bubble adds nothing; Toolbox's growth() gives a bigBase bubble its x1 (5) at level 0,
  // which the save's answer key rules out (every tab of a W2 account read 5 over its fully spent preset).
  const bubbleLevel = n(
    (a?.alchemy?.bubbles?.[bubble.cauldron] as Any[] | undefined)?.find(
      (b: Any) => b?.bubbleName === bubble.name,
    )?.level,
  );
  return {
    // AlchBubbles.Tal*: the bubble, with the class bubble when the character is of the cauldron's class.
    bubble:
      bubbleLevel > 0
        ? n(
            getBubbleBonus(
              a,
              bubble.name,
              false,
              (mainStatMap as Any)?.[c.class] === bubble.mainStat,
              bubble.cauldron,
            ),
          )
        : 0,
    vial1: vial('Tab1Pts'),
    vial2: vial('Tab2Pts'),
    vial3: vial('Tab3Pts'),
    vial4: vial('Tab4Pts'),
    // StarSigns.TalPts1: The Fuzzy Dice (+3), with Toolbox's chip, Infinite Stars and Seraph Cosmos rules.
    starSign1: n(getStarSignBonus(c, a, 'Talent_Points')),
    stamp1: stamp('Talent1'),
    stamp2: stamp('Talent2'),
    stamp3: stamp('Talent3'),
    stamp4: stamp('Talent4'),
    stamp5: stamp('Talent5'),
    // FlurboShop(1): the Dungeon Flurbo shop's talent points, added to every tab.
    flurbo: n(getDungeonFlurboStatBonus(a?.dungeons?.upgrades, 'Talent_Pts')),
    arcade16: n(getArcadeBonus(a?.arcade?.shop, 16)?.bonus),
    shiny1: shiny('Tab_1_Talent_Pts'),
    shiny2: shiny('Tab_2_Talent_Pts'),
    shiny3: shiny('Tab_3_Talent_Pts'),
    shiny4: shiny('Tab_4_Talent_Pts'),
    vault1: vault(1),
    vault6: vault(6),
    vault40: vault(40),
    companion20: isCompanionBonusActive(a, 20) ? n(a?.companions?.list?.at(20)?.bonus) : 0,
    // GetTalentNumber(1, id) on this preset's talents.
    t44: talent('JMAN_WAS_BETTER'),
    t119: talent('BACK_TO_BASICS'),
    t299: talent('PREVIOUS_POINTS'),
    t494: talent('EARLIER_EDUCATION'),
    t34: talent('ONE_STEP_AHEAD'),
    // GetTalentNumber(2, 45): the second effect.
    t45y: talent('VOID_TRIAL_RERUN', true),
    t8: talent('STAR_PLAYER'),
    t17: talent('SUPERNOVA_PLAYER'),
    t622: starTalent('STONKS!'),
    grimoire32: n(getGrimoireBonus(a?.grimoire?.upgrades, 32)),
    grimoire45: n(getGrimoireBonus(a?.grimoire?.upgrades, 45)),
    compass46: n(getCompassBonus(a, 46)),
    compass56: n(getCompassBonus(a, 56)),
    compass67: n(getCompassBonus(a, 67)),
    tesseract33: n(getTesseractBonus(a, 33)),
    orblet2: n(getOrbletMarketBonus(a, 2)),
    spelunkShop62: n(getSpelunkingBonus(a, 62)),
    armory46: n(getArmoryUpgradeBonus(a, 46)),
    armory47: n(getArmoryUpgradeBonus(a, 47)),
    armory48: n(getArmoryUpgradeBonus(a, 48)),
    armory49: n(getArmoryUpgradeBonus(a, 49)),
    jelly6: n(getJellyBonus(a, 6)),
    jelly59: n(getJellyBonus(a, 59)),
  };
}
