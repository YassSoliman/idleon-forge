// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M7's Spend Plan fields come from (M7 TR-2, M1 TR-11): Toolbox paths for provenance and the parser
// sections each is computed in. A sink whose section failed or whose raw key is missing is null and is
// listed in `diagnostics.unknownFields` by the adapter (FR-25). Merged into fields.ts's tables.

export const SPEND_FIELD_SOURCES: Record<string, string> = {
  'account.spend': 'M7 SpendInputs (spend.ts)',
  'account.spend.wallets': 'characters[i].money, MoneyBANK (currencies.bankMoney)',
  'account.spend.vault': 'account.upgradeVault.upgrades (cost, costToMax), parseUpgradeVault re-runs (TR-4)',
  'account.spend.stamps': 'updateStamps(gildedStamp = OLA[154] > 0, withMinReduction) re-run (TR-4)',
  'account.spend.bribes': 'BribeStatus (raw), account.bribes[].price',
  'account.spend.statueGold': 'StuG (raw grades)',
  'account.spend.guildingToolsOwned': 'account.storage.list, characters[i].inventory (SmithingHammerChisel2)',
  'account.spend.p2w': 'account.alchemy.p2w.cauldrons, .liquids, .vials',
  'account.spend.anvilCoinPoints': 'getPlayerAnvil(...).stats.anvilCost (nextCoinUpgrade, coinsToMax)',
  'account.spend.hydrogen': 'account.atoms.atoms[0] (level, baseBonus), account.atoms.stampReducer',
  'account.spend.gildedStamps': 'account.accountOptions (OLA 154, Gilded Stamps held)',
  'account.spend.colosseumTickets': 'CYColosseumTickets, account.currencies.ColosseumTickets.allTickets',
  'account.spend.highestClassLevel': 'characters[i].level',
};

export const SPEND_FIELD_SECTIONS: Record<string, string[]> = {
  'account.spend.vault': ['upgradeVault'],
  'account.spend.stamps': ['stamps', 'storage'],
  'account.spend.bribes': ['bribes'],
  'account.spend.statueGold': ['statues'],
  'account.spend.guildingToolsOwned': ['storage'],
  'account.spend.p2w': ['alchemy'],
  'account.spend.anvilCoinPoints': ['stamps', 'alchemy'],
  'account.spend.hydrogen': ['atoms'],
  'account.spend.colosseumTickets': ['currencies.ColosseumTickets'],
};
