// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { calculateItemTotalAmount } from '@parsers/items';
import { getRefineryStorage } from '@parsers/world-3/refinery';
import { saltLicks, towers } from '@website-data';
import { round, tryToParse } from '@utility/helpers';
import { getBestActiveCharacter } from '@parsers/talents';

// characters: the previous pass's enriched characters (empty on pass 1)
export const getSaltLick = (idleonData: any, storage: any, characters: any[] = []) => {
  const saltLickRaw = tryToParse(idleonData?.SaltLick) || idleonData?.SaltLick;
  const towersRaw = idleonData?.TowerInfo || tryToParse(idleonData?.Tower);
  // Each Salt Lick building level shows one more upgrade (the game draws a blank slot past TowerInfo[3])
  const unlockedCount = towersRaw?.[towers.Salt_Lick.index] ?? 0;
  // The game's owned count (ItemsAndStorageOWNED) is the logged-in character's inventory, storage and the salts
  // waiting in the refinery's slots
  const loggedInInventory = getBestActiveCharacter(characters)?.inventory ?? [];
  const ownedItems = [...loggedInInventory, ...(storage ?? []),
    ...getRefineryStorage(tryToParse(idleonData?.Refinery) || idleonData?.Refinery)];
  return saltLicks?.map((bonus, index) => {
    // The game clamps a level above the cap back down to it on load
    const level = Math.min(saltLickRaw?.[index] ?? 0, bonus.maxLevel);
    const totalAmount = calculateItemTotalAmount(ownedItems, bonus?.rawName, true, true);
    return {
      ...bonus,
      totalAmount,
      level,
      unlocked: index < unlockedCount
    }
  })
}

export const getSaltLickBonus = (saltLicks: any, saltIndex: any, shouldRound = false) => {
  const saltLick = saltLicks?.[saltIndex];
  if (!saltLick || saltLick === 0) return 0;
  const bonus = saltLick.baseBonus * (saltLick.level ?? 0);
  if (shouldRound) return round(bonus) ?? 0;
  return bonus;
}
