// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 340ef2ccfa460673b759369dabf8996eb11d8086.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { commaNotation, lavaLog, lavaLog2, notateNumber, tryToParse } from '@utility/helpers';
import { bubbaUpgrades, generalSpelunky } from '@website-data';
import { isCompanionBonusActive } from '@parsers/misc';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { getJellyBonus } from '@parsers/world-7/jellyOperator';
import { getFountainBonusTotal } from '@parsers/world-5/caverns/the-fountain';
import { getMineheadBonusQTY } from '@parsers/world-7/minehead';
import { getClickerCheapener } from '@parsers/world-7/menagerie';
import { getPetArenaCrucBonus } from '@parsers/world-4/breeding';

const BUBBA_CHEAPENER_BOOST = 20;

// Minehead opponent whose bonus makes every Bubba upgrade cheaper
const MINEHEAD_BUBBA_COST_BONUS = 5;

export const getBubba = (idleonData: any, account: any) => {
  const rawBubba = tryToParse(idleonData?.Bubba);

  return parseBubba(rawBubba, account);
}

// game: "MeatProdREQ"
const getMeatProdREQ = (upgradeTypeIndex: any) => {
  if (upgradeTypeIndex === 0) return 0;
  return 50 * Math.pow(2.8 + upgradeTypeIndex / 3.55, upgradeTypeIndex - Math.min(1, Math.floor(upgradeTypeIndex / 4)));
};

// Helper function to get TotalUpgTypesAvailable
// This is calculated by checking how many upgrade types can be unlocked based on meat production
// game: "TotalUpgTypesAvailable"
const getTotalUpgTypesAvailable = (rawBubba: any) => {
  const meatProduced = rawBubba?.[0]?.[4] || 0;
  let totalAvailable = 1; // Start with at least 1 upgrade type available

  // Check up to 28 upgrade types (max)
  for (let i = 1; i < 28; i++) {
    const meatReq = getMeatProdREQ(i);
    if (meatProduced >= meatReq) {
      totalAvailable = i + 1;
    }
    else {
      break;
    }
  }

  return Math.min(28, totalAvailable);
};

const parseBubba = (rawBubba: any, account: any) => {
  const totalUpgTypesAvailable = getTotalUpgTypesAvailable(rawBubba);
  const megafleshOwned = rawBubba?.[1]?.[8] || 0;
  const upgrades = bubbaUpgrades.map((upgrade, index) => {
    return {
      ...upgrade,
      level: rawBubba?.[1]?.[index] || 0,
      prestige: rawBubba?.[2]?.[index] || 0,
      realLV: getRealLV(rawBubba, index),
      cost: getUpgradeCost(rawBubba, account, index),
      bonus: getTotUpgBonus(rawBubba, index),
      description: formatUpgradeDescription(rawBubba, index),
      unlocked: index < totalUpgTypesAvailable
    }
  });
  const megafleshDesc = generalSpelunky?.[38] || [];
  const megaFlesh = megafleshDesc.map((description: any, index: any) => {
    const base = {
      description: replaceLineBreaks(description),
      unlocked: index + 1 <= megafleshOwned
    };
    if (index === 0) {
      const value = 1 + (getMegafleshOwned(rawBubba, 0) * getTotalQTYofLVs(rawBubba)) / 100;
      const formatted = value < 100
        ? String(notateNumber(value, 'MultiplierInfo')).replace('#', '')
        : commaNotation(value);
      return { ...base, totalBonus: formatted };
    }
    if (index === 11) {
      // game: ActorEvents_713 _event_11 draws Bubba[1][8] - 11 once 12 <= Bubba[1][8]; the bonus still reads Bubba[1][8] - 12
      const amount = Math.max(0, megafleshOwned - 11);
      const value = 2 + Math.max(0, megafleshOwned - 12) / 5;
      return {
        ...base,
        amount,
        totalBonus: String(notateNumber(value, 'MultiplierInfo')).replace('#', '')
      };
    }
    return base;
  });
  return {
    upgrades,
    meatSlices: rawBubba?.[0]?.[0] || 0,
    meatsliceRate: 60 * getMeatsliceRate(rawBubba, account),
    progress: rawBubba?.[0]?.[4] || 0,
    progressReq: getProgressReq(totalUpgTypesAvailable),
    bonuses: getBubbaBonusesObject(rawBubba, account),
    totalUpgTypesAvailable,
    megafleshOwned,
    megaFlesh,
    // Smoker (upgrade 15) smoking time: banked seconds [0][14] plus pending idle seconds [0][7],
    // which the game folds into [0][14] next time the Bubba window ticks
    smokerUnlocked: totalUpgTypesAvailable > 15,
    smokerSeconds: (rawBubba?.[0]?.[14] || 0) + (rawBubba?.[0]?.[7] || 0),
    ...getBubbaNextSteps(rawBubba, account, totalUpgTypesAvailable)
  };
}

// The smoked meat tier roll is floor(5 * rand ^ max(0.1, 9 - 10 * t / (7200 + t))).
// The exponent bottoms out at 0.1 once t / (7200 + t) = 0.89, so waiting longer gains nothing.
export const SMOKER_MAX_QUALITY_SECONDS = 0.89 * 7200 / 0.11;

// game: ActorEvents_713 refills the daily pets once Bubba[0][13] reaches 3600 seconds
export const PATS_HOUR_SECONDS = 3600;

// game: Open Gift with Beeg Slice adds 1200 * Bubbastuff("MeatsliceRate") meat slices (20 minutes of production)
export const BEEG_SLICE_SECONDS = 1200;

// game: ActorEvents_713 levels the selected attribute only while 120 > Bubba[3][selected - 1]
export const CHARISMA_MAX_LEVEL = 120;

// Upper bound on the banked levels loop, so a corrupt XP value can't hang the parse
const CHARISMA_LEVELS_BANKED_LIMIT = 10000;

// Bubba upgrades that make every upgrade cheaper: Bargain, Cost Saver and Perma Sale
const BUBBA_DISCOUNT_UPGRADES = [4, 18, 26];

// What the next pat, Charisma level, Boon level or discount level is worth, all from the game's own functions.
// Null without a Bubba record.
const getBubbaNextSteps = (rawBubba: any, account: any, totalUpgTypesAvailable: number) => {
  if (!Array.isArray(rawBubba)) {
    return {
      patsPerHour: null,
      meatsliceRateBase: null,
      charismaMaxLevel: null,
      charismaXpReq: null,
      charismaXpPerSec: null,
      charismaLevelsBanked: null,
      charismaBonus: null,
      charismaBonusNext: null,
      boonNextDelta: null,
      megafleshMultiplier: null,
      discountNextRatio: null
    };
  }
  const charismaTraits = generalSpelunky?.[36] || [];
  return {
    patsPerHour: getDailyPetting(rawBubba),
    // MeatsliceRate per minute with no happiness: what the save produces once happiness has decayed
    meatsliceRateBase: 60 * getMeatsliceRate(rawBubba, account, { happiness: 0 }),
    charismaMaxLevel: CHARISMA_MAX_LEVEL,
    charismaXpReq: getCharismaTraitREQ(getCharismaTotal(rawBubba)),
    charismaXpPerSec: getCharismaTraitSPD(rawBubba),
    charismaLevelsBanked: getCharismaLevelsBanked(rawBubba, totalUpgTypesAvailable),
    charismaBonus: charismaTraits.map((_: any, index: number) => getCharismaBonus(rawBubba, index)),
    charismaBonusNext: charismaTraits.map((_: any, index: number) => getCharismaBonus(withRawValue(rawBubba, 3, index, 1), index)),
    boonNextDelta: getBoonNextDelta(rawBubba, account),
    megafleshMultiplier: 1 + getBubbaRoGAll(rawBubba) / 100,
    discountNextRatio: BUBBA_DISCOUNT_UPGRADES.map((upgradeIndex) => getDiscountNextRatio(rawBubba, account, upgradeIndex))
  };
};

// A copy of the raw Bubba record with one value raised by `delta`
const withRawValue = (rawBubba: any, row: number, index: number, delta: number) => rawBubba.map((values: any, rowIndex: number) => {
  if (rowIndex !== row) return values;
  const copy = [...(values || [])];
  copy[index] = (copy[index] || 0) + delta;
  return copy;
});

// Sum of all six Charisma attribute levels, Bubba[3][0..5]
const getCharismaTotal = (rawBubba: any) => {
  let total = 0;
  for (let i = 0; i < 6; i++) {
    total = Math.round(total + (rawBubba?.[3]?.[i] || 0));
  }
  return total;
};

// game: "CharismaTraitREQ" - XP for the next level of any attribute, from the total of all six levels
const getCharismaTraitREQ = (charismaTotal: number) => {
  return 20 * (1 + charismaTotal / 20) * Math.pow(1.03, charismaTotal);
};

// game: "CharismaTraitSPD" - Charisma XP per second (Numbahs is gift 2)
const getCharismaTraitSPD = (rawBubba: any) => {
  return (1 + getTotUpgBonus(rawBubba, 6) / 100) * (1 + getGiftPassiveBonus(rawBubba, 2, true) / 100);
};

// game: ActorEvents_713 first folds the pending seconds Bubba[0][7] * CharismaTraitSPD into the XP Bubba[0][8]
// (once TotalUpgTypesAvailable > 5), then each tick spends one CharismaTraitREQ on a level. REQ counts every
// attribute's level, so the total rises by 1 per level. Uncapped: the selected attribute and the max level are
// not applied, because the player may pick another attribute.
const getCharismaLevelsBanked = (rawBubba: any, totalUpgTypesAvailable: number) => {
  const pendingSeconds = totalUpgTypesAvailable > 5 ? rawBubba?.[0]?.[7] || 0 : 0;
  let xp = (rawBubba?.[0]?.[8] || 0) + pendingSeconds * getCharismaTraitSPD(rawBubba);
  let charismaTotal = getCharismaTotal(rawBubba);
  let levels = 0;
  while (levels < CHARISMA_LEVELS_BANKED_LIMIT && xp >= getCharismaTraitREQ(charismaTotal)) {
    xp -= getCharismaTraitREQ(charismaTotal);
    charismaTotal += 1;
    levels += 1;
  }
  return levels;
};

// The next Bubba Boon level (upgrade 3) adds one stack to bonus (L mod 7) + 1: BubbaRoG_Bonuses at L + 1 minus at L
const getBoonNextDelta = (rawBubba: any, account: any) => {
  const boonLevel = rawBubba?.[1]?.[3] || 0;
  const ringIndex = (boonLevel % 7) + 1;
  return getBubbaBonuses(withRawValue(rawBubba, 1, 3, 1), account, ringIndex) - getBubbaBonuses(rawBubba, account, ringIndex);
};

// game: "UpgCost" of upgrade 0 with the discount one level higher, divided by its cost now. Every upgrade's cost
// shares the same discount factors, so this is the factor every later cost falls by.
const getDiscountNextRatio = (rawBubba: any, account: any, discountIndex: number) => {
  const cost = getUpgradeCost(rawBubba, account, 0);
  if (!(cost > 0)) return null;
  return getUpgradeCost(withRawValue(rawBubba, 1, discountIndex, 1), account, 0) / cost;
};

const getProgressReq = (totalUpgTypesAvailable: any) => {
  return 50 * Math.pow(2.8 + totalUpgTypesAvailable / 3.55, totalUpgTypesAvailable - Math.min(1, Math.floor(totalUpgTypesAvailable / 4)));
}

const getBubbaBonusesObject = (rawBubba: any, account: any) => {
  // Define the structure of the bonuses
  const bonusMap = {
    buildRate: { name: 'Build Rate', id: 1 },
    critterGain: { name: 'Critter Gain', id: 2 },
    soulGain: { name: 'Soul Gain', id: 3 },
    totalDamage: { name: 'Total Damage', id: 4 },
    allKills: { name: 'All Kills', id: 5 },
    expMulti: { name: 'EXP Multi', id: 6 },
    atomCost: { name: 'Atom Cost', id: 7, isNegative: true }
  };

  // Use reduce to build the final object dynamically
  return Object.keys(bonusMap).reduce((acc, key) => {
    const { name, id, isNegative = false } = (bonusMap as Record<string, any>)[key];

    (acc as Record<string, any>)[key] = {
      name,
      bonus: getBubbaBonuses(rawBubba, account, id),
      isNegative
    };

    return acc;
  }, {});
};

// game: "UpgCost"
const getUpgradeCost = (rawBubba: any, account: any, upgradeIndex: any) => {
  const level = rawBubba?.[1]?.[upgradeIndex] || 0;
  const upgrade = bubbaUpgrades?.[upgradeIndex];
  const x1 = upgrade?.x1 || 0;
  const x2 = upgrade?.x2 || 0;

  // Cost reduction multipliers
  const costReductionMinehead = 1 / (1 + getMineheadBonusQTY(account, MINEHEAD_BUBBA_COST_BONUS) / 100);
  const costReduction4 = 1 / (1 + getTotUpgBonus(rawBubba, 4) / 100);
  const costReduction18 = 1 / (1 + getTotUpgBonus(rawBubba, 18) / 100);
  const costReduction26 = 1 / (1 + getTotUpgBonus(rawBubba, 26) / 100);
  const costReductionCharisma = 1 / (1 + getCharismaBonus(rawBubba, 1) / 100);
  // game: MenagerieStuff("BubbaCheapener", t, 0)
  const menagerieCheapener = getClickerCheapener(account, BUBBA_CHEAPENER_BOOST, upgradeIndex);

  // Base cost calculation
  const baseCost = Math.pow(upgradeIndex + 1, 2) * level
    + Math.pow(2.4 + upgradeIndex / 3.65, upgradeIndex) * Math.pow(x2, level);

  return costReductionMinehead
    * costReduction4
    * costReduction18
    * menagerieCheapener
    * costReduction26
    * costReductionCharisma
    * baseCost
    * x1;
};

// game: "RealLV" - level + prestige
const getRealLV = (rawBubba: any, upgradeIndex: any) => {
  const level = rawBubba?.[1]?.[upgradeIndex] || 0;
  const prestige = rawBubba?.[2]?.[upgradeIndex] || 0;
  return Math.round(level + prestige);
};

// game: "TotUpgBonus"
const getTotUpgBonus = (rawBubba: any, upgradeIndex: any) => {
  const realLV = getRealLV(rawBubba, upgradeIndex);
  const upgradeBonus = bubbaUpgrades?.[upgradeIndex]?.x3 || 0; // x3 value from bubbaUpgrades
  return realLV * upgradeBonus;
};

// game: "HappinessBonus"
const getHappinessBonus = (rawBubba: any, happiness: number = rawBubba?.[0]?.[1] || 0) => {
  return 1 + (10 * (lavaLog2(happiness) + 25 * lavaLog(happiness) + Math.pow(happiness, 0.75))) / 100;
};

// game: "TotalQTYofLVs"
const getTotalQTYofLVs = (rawBubba: any) => {
  let total = 0;
  for (let i = 0; i < 28; i++) {
    total = Math.round(total + getRealLV(rawBubba, i));
  }
  return total;
};

// game: "CharismaBonus"
const getCharismaBonus = (rawBubba: any, traitIndex: any) => {
  const charismaData = generalSpelunky?.[37] || []; // Charisma bonus values
  const selectedTrait = rawBubba?.[0]?.[15] || 0;
  const charismaLevel = rawBubba?.[3]?.[traitIndex] || 0;
  const charismaValue = parseFloat(charismaData?.[traitIndex] || '0');
  const isSelected = Math.round(traitIndex + 1) === selectedTrait;
  const totUpgBonus13 = getTotUpgBonus(rawBubba, 13);

  if (isSelected) {
    return 3 * charismaLevel * charismaValue * (1 + totUpgBonus13 / 100);
  }
  return charismaLevel * charismaValue * (1 + totUpgBonus13 / 100);
};

// game: "GiftPassiveBonus"
const getGiftPassiveBonus = (rawBubba: any, giftIndex: any, checkAll = false) => {
  const giftPassiveData = generalSpelunky?.[41] || []; // Gift passive bonus values
  const selectedGift1 = rawBubba?.[0]?.[2] || 0;
  const selectedGift2 = rawBubba?.[0]?.[3] || 0;

  if (checkAll && selectedGift1 !== Math.round(giftIndex + 1) && selectedGift2 !== Math.round(giftIndex + 1)) {
    return 0;
  }

  const giftValue = parseFloat(giftPassiveData?.[giftIndex] || '0');
  const totUpgBonus17 = getTotUpgBonus(rawBubba, 17);
  return giftValue * Math.min(5, 1 + totUpgBonus17 / 100);
};

// game: "Dice_Multi"
const getDiceMulti = (rawBubba: any) => {
  let diceTotal = 0;
  for (let i = 0; i < 8; i++) {
    const diceValue = rawBubba?.[4]?.[i] || 0;
    if (diceValue > 0) {
      diceTotal = Math.max(1, diceTotal) * (Math.min(diceValue, 6) + Math.max(diceValue - 6, 0) / 2.5);
    }
  }
  return 1 + diceTotal / 100;
};

// game: "SmokeMeat_Multi"
const getSmokeMeatMulti = (rawBubba: any) => {
  const smokeMeatData = generalSpelunky?.[34] || []; // Smoke meat bonus values, one per smoked meat tier
  let smokeMeatTotal = 1;
  for (let i = 0; i < 5; i++) {
    const smokeMeatValue = rawBubba?.[5]?.[i] || 0;
    if (smokeMeatValue > 0) {
      const smokeMeatBonus = parseFloat(smokeMeatData?.[i] || '0');
      smokeMeatTotal = smokeMeatTotal * (1 + (smokeMeatValue * smokeMeatBonus) / 100);
    }
  }
  return smokeMeatTotal;
};

// game: "MegafleshOwned"
const getMegafleshOwned = (rawBubba: any, megafleshIndex: any) => {
  const megafleshLevel = rawBubba?.[1]?.[8] || 0;
  if (megafleshLevel > megafleshIndex) {
    if (megafleshIndex === 11) {
      return megafleshLevel - 11;
    }
    return 1;
  }
  return 0;
};

// game: DNSM "Bubba_RoG_all", set inside BubbaRoG_Bonuses: 20 * sum of MegafleshOwned for indices 1, 3, 6, 9, 11
const getBubbaRoGAll = (rawBubba: any) => {
  return 20 * (
    getMegafleshOwned(rawBubba, 1) +
    getMegafleshOwned(rawBubba, 3) +
    getMegafleshOwned(rawBubba, 6) +
    getMegafleshOwned(rawBubba, 9) +
    getMegafleshOwned(rawBubba, 11)
  );
};

// game: "BubbaRoG_Bonuses" - Ring of Greed bonuses
const getBubbaBonuses = (rawBubba: any, account: any, ringIndex: any) => {
  const rogBonusesData = generalSpelunky?.[33] || [];
  const companionBonus = isCompanionBonusActive(account, 51) ? account?.companions?.list?.at(51)?.bonus : 0;
  const bubbaRoGAll = getBubbaRoGAll(rawBubba);

  // Get the Ring of Greed bonus value for this ring index
  const rogBonusValue = parseFloat(rogBonusesData?.[Math.round(ringIndex)] || '0');

  // Get the level of upgrade index 3 (Bubba[1][3])
  const upgrade3Level = rawBubba?.[1]?.[3] || 0;

  // Calculate the bonus: (1 + Bubba_RoG_all / 100) * Spelunky[33][ringIndex] * Math.ceil((Bubba[1][3] - (ringIndex - 1)) / 7)
  const bonus = (1 + bubbaRoGAll / 100)
    * rogBonusValue
    * Math.ceil((upgrade3Level - (ringIndex - 1)) / 7)
    * (1 + companionBonus);

  return Math.max(0, bonus);
};

// game: "SpareCoins_Multi"
const getSpareCoinsMulti = (rawBubba: any) => {
  const coin1 = rawBubba?.[0]?.[9] || 0;
  const coin2 = rawBubba?.[0]?.[10] || 0;
  const coin3 = rawBubba?.[0]?.[11] || 0;
  const coin4 = rawBubba?.[0]?.[12] || 0;
  return 1 + (coin1 + (5 * coin2 + (25 * coin3 + 100 * coin4))) / 100;
};

// game: "DailyPetting"
const getDailyPetting = (rawBubba: any) => {
  const realLV1 = getRealLV(rawBubba, 1);
  return Math.ceil(lavaLog2(realLV1) + Math.min(realLV1, 3));
};

// game: "DailyPet_HappinessFromUpg"
const getDailyPetHappinessFromUpg = (rawBubba: any) => {
  const totUpgBonus5 = getTotUpgBonus(rawBubba, 5);
  const totUpgBonus20 = getTotUpgBonus(rawBubba, 20);
  const charismaBonus2 = getCharismaBonus(rawBubba, 2);
  const giftPassiveBonus1 = getGiftPassiveBonus(rawBubba, 1, true);
  const multiplier = 1 + (totUpgBonus20 + (charismaBonus2 + giftPassiveBonus1)) / 100;

  return (Math.min(1, totUpgBonus5) + (totUpgBonus5 / (totUpgBonus5 + 200)) * 2) * multiplier;
};

// Helper function to format timer display (seconds to HH:MM:SS)
const formatTimerDisplay = (seconds: any) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// The game renders @ as a line break
const replaceLineBreaks = (description: any) => String(description ?? '').replace(/_*@_*/g, '\n');

// Format upgrade description with bonus values
const formatUpgradeDescription = (rawBubba: any, upgradeIndex: any) => {
  const upgrade = bubbaUpgrades?.[upgradeIndex];
  if (!upgrade || !upgrade.description) {
    return '';
  }

  let description = upgrade.description;
  const bonus = getTotUpgBonus(rawBubba, upgradeIndex);

  // Replace { with bonus value
  if (description.includes('{')) {
    const bonusValue = bonus < 1e6
      ? commaNotation(bonus)
      : notateNumber(bonus, 'Big');
    description = description.replace('{', '' + bonusValue);
  }

  // Replace } with multiplier (1 + bonus / 100)
  if (description.includes('}')) {
    const multiplier = 1 + bonus / 100;
    let multiplierStr = '' + notateNumber(multiplier, 'MultiplierInfo');
    // Remove # if present
    multiplierStr = multiplierStr.replace(/#/g, '');
    description = description.replace('}', multiplierStr);
  }

  // Replace $ with special values
  if (description.includes('$')) {
    let dollarValue: any = '';
    if (upgradeIndex === 4 || upgradeIndex === 18 || upgradeIndex === 26) {
      // Cost reduction percentage
      dollarValue = Math.floor(1e4 * (1 - 1 / (1 + bonus / 100))) / 100;
    }
    else if (upgradeIndex === 1) {
      // DailyPetting value
      dollarValue = getDailyPetting(rawBubba);
    }
    else if (upgradeIndex === 5) {
      // DailyPet_HappinessFromUpg value
      dollarValue = Math.round(100 * getDailyPetHappinessFromUpg(rawBubba)) / 100;
    }
    description = description.replace('$', '' + dollarValue);
  }

  // Replace ~ with timer values
  if (description.includes('~')) {
    let timerValue = '';
    if (upgradeIndex === 1 || upgradeIndex === 12) {
      // Timer for 3600 - Bubba[0][13]
      const timeRemaining = Math.max(0, 3600 - (rawBubba?.[0]?.[13] || 0));
      timerValue = formatTimerDisplay(timeRemaining);
    }
    else if (upgradeIndex === 15) {
      // Timer for Bubba[0][14]
      const timeValue = rawBubba?.[0]?.[14] || 0;
      timerValue = formatTimerDisplay(timeValue);
    }
    description = description.replace('~', timerValue);
  }

  return replaceLineBreaks(description);
};

// game: "MeatsliceRate". `happiness` replaces the save's Bubba[0][1] in HappinessBonus
const getMeatsliceRate = (rawBubba: any, account: any, { happiness }: { happiness?: number } = {}) => {
  const baseRate = getTotUpgBonus(rawBubba, 0) + getTotUpgBonus(rawBubba, 7) + getTotUpgBonus(rawBubba, 23);
  const percentageBonus = (getTotUpgBonus(rawBubba, 2)
    + getTotUpgBonus(rawBubba, 11)
    + getTotUpgBonus(rawBubba, 19)
    + getTotUpgBonus(rawBubba, 24) * lavaLog(account?.accountOptions?.[267] || 1)) / 100;

  const happinessBonus = getHappinessBonus(rawBubba, happiness);
  const diceMulti = getDiceMulti(rawBubba);
  const smokeMeatMulti = getSmokeMeatMulti(rawBubba);
  const charismaBonus = getCharismaBonus(rawBubba, 0) / 100;
  const megafleshBonus = (getMegafleshOwned(rawBubba, 0) * getTotalQTYofLVs(rawBubba)) / 100;
  const giftPassiveBonus = getGiftPassiveBonus(rawBubba, 0, true) / 100;
  const spareCoinsMulti = getSpareCoinsMulti(rawBubba);
  const vaultBonus65 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 65);

  return baseRate
    * (1 + percentageBonus)
    * happinessBonus
    * diceMulti
    * smokeMeatMulti
    * (1 + charismaBonus)
    // game: (1 + 2 * Breeding("PetArenaCrucBonus", "0", 10, 0))
    * (1 + 2 * getPetArenaCrucBonus(account, 10))
    * (1 + megafleshBonus)
    * (1 + giftPassiveBonus)
    * spareCoinsMulti
    * (1 + vaultBonus65 / 100)
    * (1 + getSushiBonus(account, 39) / 100)
    * (1 + getJellyBonus(account, 58) / 100)
    * (1 + getFountainBonusTotal(account?.hole?.holesObject, 2, 18) / 100); // Bubba Forever (Green Water)
};