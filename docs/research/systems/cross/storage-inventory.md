# Storage chest, inventory bags and carry capacity

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Paths: `P` = `packages/toolbox-parsers/vendor/parsers`, `D` = `packages/toolbox-parsers/vendor/data/website-data`. Web access note: the wiki fetch budget was partly exhausted; only idleon.wiki/wiki/Storage_Chest and /wiki/Inventory were readable (tier 3); no community meta pages could be fetched, so Min-max is tier-1 derived plus the existing KB (flagged).

- **What it is:** three linked capacity systems. (a) The account-wide Storage Chest (shared slots, no per-stack cap). (b) Per-character inventory slots, grown by Inventory Bags. (c) Per-slot Carry Capacity per item class (ore, logs, fish, bugs, critters, souls, food, materials), set by crafted/quest Carry Bags (pouches) and multiplied by stamps, gem shop, talents, prayers, shrine, guild, star signs, bribe, vault. [C1][C15][C20]
- **Unlocks:** Storage Chest and bags open in W1 via quests (Hamish "Slime for Storage" gives Storage Chest 1; Scripticus gives Bags A-C; Promotheus Bag D; Cowbo Jones Bags E, F, H and Chest 4). Higher tiers come from W2-W5 monsters, anvil crafts, merit-shop task unlocks and the gem shop. [C17][C4]
- **Scope:** Storage slots, gem-shop carry, stamps, guild, bribe, vault are account-wide. Inventory bags (`InvBagsUsed`), `MaxCarryCap` pouches, talents, prayers, shrine map and star signs are per-character. [C3][C15][C23]
- **Inputs to outputs:** gems, quest items, drops, bars/materials, GP, coins -> more slots or higher per-slot caps. A full bag or a stack at its cap discards AFK gains, which is the main coaching hook. [C22][C40]
- **Goals and Milestones:** pouch tiers 25/50/100/250/500/1k/2k/5k/10k/20k/25k/30k/35k per class (critters and souls start at 50). Greenstack at 10,000,000 in storage; Equinox greenstack goals at 20, 75 and 200 distinct items. [C20][C13]
- **Feeds / fed by:** feeds Stamps (carry wall for stamp materials), Anvil (material bag), AFK (cap and free slots), Slab/Equinox/Research (greenstacks), achievements (exact stacks). Fed by Gem Shop, Event Shop, Upgrade Vault, Towers, Bundles, Guild, Prayers, Star Signs, Bribes, Companions. [C13][C14][C40]
- **Per-session actions:** check each AFK character's bag for free slots and AFK-target stack vs cap; check storage free slots; spend on the cheapest cap/slot source; note greenstack candidates and exact-stack achievements before depositing. [C22][C40]
- **AFK Setup implications:** a skiller whose target stack hits cap with no free slot loses all gains; Zerg Rushogen prayer cuts carry (floor x0.4) and Ruck Sack costs AFK rate, so presets must weigh them; Telekinetic Storage auto-deposits. [C23][C27][C25]
- **Min-max by stage:** see section below.
- **Common mistakes:** leaving Zerg Rushogen on a skiller; mining/choppin stacks at cap; never buying gem-shop carry; spending gem-shop money on bags before +25% carry; destroying a would-be exact stack (achievement) or greenstack by consuming. Detect from `maxCarryCap`, `carryCapBags`, `inventory`, `storage.slots`. [C31][C27][C14]
- **Save and Toolbox fields:** see catalogue.
- **Sources:** inline per claim.

## Mechanics catalogue

### Storage Chest (account)
1. **Slot total** = 54 base + 2*Towers[4].level + sum(chest items used) + 8 (bun_i) + 16 (bun_c) + 20 (bon_a) + 9*gemShopPurchases[109] + 12*Event10 + 16*Event11 + UpgradeVault[33] + 22 (bon_x) + 27 (bon_y). Parser: `P/storage.ts getStorageSlots` -> `account.storage.slots.value`. [C1]
2. **Base 54** slots, flat. [C1]
3. **Tower "Chest_Space"** (index 4): +2 slots per level, maxLevel 25 (=50), cost Explosive Salts (Refinery2) 25 base, costInc 2/30. Field `account.towers.data[4].level`. Data `D/shared-data.json towers.Chest_Space`. [C2]
4. **Chest items**: each InvStorage item is a one-time +N slots per account (N = `capacity`, 3-10; ID = key in `InvStorageUsed`). Field: raw `InvStorageUsed` -> `account.storage.storageChests[].amount/unlocked`. Toolbox displays max 336. [C3][C4]
5. **Chest sources**: Hamish quest (Chest 1), Krunk quest (3), Cowbo Jones (4), Mutton (5), Snake_Jar (11, 8500 Red Stuff Pot), Hoov (Ninja Chest); drops: Chest 14 (0.12% from Crystal Crabal, Mafioso, Efaunt etc.), 24 (0.12%), 25 (0.03%), 22 (TV, 0.0008%), 23 (Biggole Wurm), plus event/boss chests F,S,C,D,N and 16-slot H, L, Z. [C17][C4]
6. **Gem shop Storage Chest Space (idx 56)**: gives Storage Chest 31-42 (+9 each), 175 gems, +25 per purchase, max 12 (=108 slots). Counted through chest items, not separately. [C5]
7. **Gem shop More Storage Space (idx 109)**: +9 slots, 450 gems, +12 per purchase, max 10 (=90). Formula 9*purchases. [C6]
8. **Bundles**: bun_i AutoLoot +8 ($19.99), bun_c Starter Pack +16 ($4.99), bon_a Storage Ram +20 ($8.99; also remote storage), bon_x +22, bon_y +27 (starter offers). `isBundlePurchased`. [C7]
9. **Event Shop**: idx10 Storage Chest +12, idx11 Storage Vault +16, via `accountOptions[311]` letter flags. [C8]
10. **Upgrade Vault "Storage Slots"** (idx 33): maxLevel 24, unlock Vault level 1100, +1 slot/level. [C9]
11. **Storage has no stack cap**; items can exceed 10M. [C10]
12. **Greenstack** = 10,000,000+ of one item; registry `GreenStacks` is permanent since 2.3.508; `account.storage.greenStacks`. [C10]
13. **isGreenstackable** (`P/misc.ts#L460`): non-equipment, not DUNGEON_EVAPORATE/FOOD/ITEM, not in the NON_STORABLE list (hole resources, dungeon credits, XP, cash). [C11]
14. **Unrealistic greenstacks**: curated quest-only items (e.g. NPC tokens) excluded from missing counts (`P/parseMaps.ts#L132`). [C12]
15. **Greenstack rewards**: Equinox challenges (20/75/200 distinct), Research grid ("Greenstack N different items"), Unadulterated Banking Fury (+2% total damage per greenstack, a bank-style effect), leaderboard "Most Greenstacks". [C13]
16. **Exact-stack achievements**: "Have a stack of exactly N X in your Storage Chest" (500 Copper Ore, 1500 Oak Logs, 2000 Iron Ore, 20,000 Sticks, 30,000 Gold Ore, 1,000,000 Void Ore, 10,000,000 Wriggly Balls, ...). `D/achievements.json`. Must be exact, so check before depositing. [C14]

### Inventory bags (per character)
17. **Slots** = count of non-`LockedInvSpace` entries in `InventoryOrder` (`characters[].inventorySlots`). [C15]
18. **Bag table** (`D/shared-data.json invBags`): A,B,C +1 (equip lv 1/3/5); D +2 (lv10); E +2 (15); F-I +2 (lv20); U-Z +4 each (gem shop); 100 +2 Snakeskin; 101 +2 fake bag; 102 Blunderbag +4 (lv5); 103 Sandy Satchel +4; 104 +1; 105-107 +1 (lv15/35/70); 108 +2 (lv120); 109 Shivering +3; 110 Mamooth Hide +1 (lv55); 111 Peeper +3 (lv115); 112 4th Anniversary +8; 113 +1 (lv140); 114 +1 (lv200); 115 +1 (lv300). Bags sum 75. `characters[].invBagsUsed[].acquired`. [C16]
19. **Bag sources**: quests (Scripticus x3-4, Promotheus, Cowbo x3); drop Bag G (Crystal Crabal, Sandy Pot, Mimic, Crabcake, Biggie Hours, Efaunt, W2 bronze chest; 0.18%); Snakeskin from Baby Boa (0.008%); Mimic drops 101; Mamooth drops 110; crafts: Blunderbag (2 Shirts16, 2 Hats6, 150 Grasslands1), Sandy Satchel (Sewers1b, InvBag100, 777 DesertA1), Shivering Sack (InvBag110, 2000 SnowA2, 3 SnowA2a), Peeper Pouch (10k Fish6, 20k Bug7, 20k AlienTree, 5k Soul5); merit-shop task unlocks give 102/103/109/111. [C17]
20. **Gem shop Backpack Space (idx 55)**: Inventory Bag U-Z (+4), 200 gems, +25 each, max 6 (=24 slots). [C18]

### Carry capacity (per character, per class)
21. **Carry bags**: `D/carryBags.json`, classes Mining, Chopping, Foods, bCraft (materials), Fishing, Bugs, Critters, Souls; tiers 25 ... 35,000 (Miniature -> Enormous). Character field `MaxCarryCap[class]` -> `characters[].maxCarryCap`, `carryCapBags`. Quests/Statues/fillerz entries excluded. Craft path is Anvil (cross-ref). [C20]
22. **Per-slot cap** (`getItemCapacity`, `P/misc.ts#L1185`): `floor(min(2.05e9, (allCapBase + MaxCarryCap[class]) * (1+classStamp/100) * (1+25*gem[58]/100) * (1+(allCarryStamp+starSign)/100) * allCap))`, with extra `(1+EXTRA_BAGS/100)` for materials; classStamp: Mining (ore, bar, oil), Chopping (log, leaf), Fishing, Catching (bugs), Material; Food, Critters and Souls have no class stamp. [C21][C22]
23. **allCapBase** = Upgrade Vault[11] + 1000*(bon_w+bon_x+bon_y). [C34][C35]
24. **allCap** (`getAllCap`) = (1+(Guild+Telekinetic)/100) * (1+Companion18/100) * (1+Shrine/100) * max(1-ZergCurse/100, 0.4) * (1+(RuckSack+Bribe+RamLv2 30)/100). [C23]
25. **Fixed caps**: currency, quest, statue stone, exp orb, stone, fish toolkit and any other "d" type = 999,999,999; non-stackable = 2. [C22]
26. **Stamps**: Lil' Mining Baggy, Choppin' Bag, Matty Bag, Bag o Heads (fishing), Bugsack (catching) each +x% to class; Mason Jar +x% to ALL (`func add`, x1=1). Cross-ref stamps dossier. [C32]
27. **Gem shop Carry Capacity (idx 58)**: +25% each, 150 gems, +25 per purchase, max 10 (=+250%). [C31]
28. **Guild "Rucksack"**: +% total carry, maxLevel 50, `decay` x1=70 x2=50. [C24]
29. **Talent TELEKINETIC_STORAGE** (Special Talent 2): passive +% carry, x1=30 x2=60 decay; active deposits items. [C25]
30. **Talent EXTRA_BAGS** (Beginner, Vman line): material cap +%, x1=200 x2=100 decay. [C33]
31. **Shrine** (Pantheon Shrine, index 3): +10% base +2% per level on its map; Toolbox `getShrineBonus(...,3,mapIndex)`. [C26]
32. **Prayers**: Ruck_Sack +30 base (x2=15), maxLevel 50, curse -AFK rate; Zerg_Rushogen curse -carry (x1=5, x2=12, maxLevel 20), carry multiplier floor 0.4. [C27]
33. **Bribe 23 "Bottomless Bags"**: +5% carry, 1,200,000,000 coins. [C28]
34. **Companions**: companion idx18 bonus and Pet Mart+ Dedotated Ram level 2 flat +30%. [C29]
35. **Star signs**: Pack Mule +10, The OG Skiller +5, Mr No Sleep +30 (carry, with -6% AFK). Silkrode Nanochip interaction in `getStarSignBonus`. [C30]
36. **Upgrade Vault "Carry Capacity"** (idx 11): maxLevel 100, unlock Vault 130, x1 200, x2 1.35; adds to allCapBase. [C34]
37. **Legacy helpers** `getAllCapsBonus` (#L685) and `getMaterialCapacity` (#L689) are an older formula (stamps, gem, mason jar, star sign, talent) kept for callers; prefer `getItemCapacity`. [C36]
38. **Toolbox derived**: `carryCapBags[].capacityPerSlot`, `.maxCapacity` (= per slot * inventorySlots), `.breakdown` in `P/index.ts#L344`. [C41]
39. **W5+ extensions**: W5-W6 chest drops (Chests 24/25 from W5 monsters), Pet Mart+ companion Lv2 carry, Spelunking/Gallery "Bling Bags" are unrelated; no further W5+ bag tiers found in the 2.3.540 data. [C4][C29]

## Min-max by stage
Tier-4 community meta could not be fetched this run. Lines below are derived from tier-1 formulas and the existing KB; marked inference where applicable. [C42]

- **W1 early:** do the Scripticus, Promotheus, Hamish and Cowbo bag/chest quests (free slots); craft pouch tiers as the anvil allows; Matty Bag and Lil' Mining Baggy stamps first (existing KB: carry stamps first). [C17][C40]
- **W1 mid:** buy gem-shop Carry Capacity (+25% x10 applies to every item type) before inventory bags, since the formula multiplies all classes; equip Mason Jar stamp. Inference. [C31][C32]
- **W1 late / W2:** farm bag G and Chest 14/24 drops; unlock Blunderbag and Sandy Satchel crafts; enable Ruck Sack prayer only on non-AFK-critical characters. [C17][C27]
- **W3:** Chest_Space tower to 25; guild Rucksack; Pantheon shrine on the main skilling map; bribe 23 when coins allow. [C2][C24][C26][C28]
- **W4:** Peeper Pouch (115) and Shivering Sack (3 slots); Vault Carry Capacity and Storage Slots; star signs Pack Mule / Mr No Sleep for skillers. [C16][C30][C34]
- **Per class:** Vman (Beginner line) gets EXTRA_BAGS so is the best material carrier; skilling characters carry the TELEKINETIC_STORAGE talent. [C33][C25]
- **Greenstack/exact stacks:** deposit exact-stack achievement items first, then accumulate to 10M for Equinox goals. [C13][C14]

## Open questions
- Toolbox shows chest max 336 but data sums to 347; which 11 slots are unobtainable?
- Exact bag drop/craft source for Bags H, I, 100-115 not in quests/crafts data beyond those listed.
- Upgrade Vault Storage Slots x5 field role unclear (assumed +1 slot per level).
- Base inventory slot count and Silkrode Nanochip effect not in the parser; wiki fetch lacked them.
- No tier-3/4 meta ordering fetched (search budget).
