# Smithing and gear crafting (Anvil, Forge, Armor-set Smithy, upgrade stones)

- **Topic id:** `smithing`. **Verified:** 2026-10-19. **Game version:** 2.3.540 (Toolbox pin `6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1`).
- **Revision 2026-10-19 (verdict pass):** two adversarial lenses (source, game-data) reviewed every claim. No claim was refuted by both lenses, so nothing was removed. One claim was refuted by one lens and is marked **Disputed** (recipe counts, M11). Claims no lens could check offline (wiki and community) carry confidence L. Missed mechanics were researched and added as M27-M34. Confidence tags: H = matches Toolbox code or game data re-read at the pin; M = data-derived or tier 2/3 with partial support; L = unverifiable here (wiki, community) or ambiguous in code.
- **Citation shorthand:** `V:` = `packages/toolbox-parsers/vendor/` in the reference checkout; `data:` = `V:data/website-data/`. Tier 1 = game data / Toolbox code, 2 = wiki, 3 = community guides (ADR 0004).
- **Prior research:** `research/skills:docs/research/systems/skills/2026-10-17-mining-smithing.md` (Toolbox `6827d3f2`). Every formula in it was re-read against the current pin; differences are called out inline (the pin adds Menagerie, Brimstone and Upgrade-Vault terms to the Forge, and no stamp matches `SmithExp`).
- **Existing ActiveOn coverage:** Anvil (`anvil.yaml`: caps-before-return, fill-time, spend-points, respec), Armor Smithy (`armor-smithy.yaml`), Gear and Tools (`gear.yaml`, `gear.facts.yaml`), Anvil coin points in the Spend Plan. **Not covered:** the Forge (no page, no Check; coverage audit rows "Forge" = T only), Smithing EXP / level goals, Skill Mastery thresholds, Production recipe-demand guidance, upgrade-stone guidance, Godly Creation, Anvil Tab 5-7.

## System dossier

- **What it is:** Smithing is the Archer-specialised town skill. Three linked sub-systems: the **Anvil** (two tabs a player cares about: *Craft*, one-off recipes that produce gear, tools, pouches and anvil tab expansions; *Produce*, a passive per-character production line that is the main Smithing EXP source), the **Forge** (account-wide ore to bar smelting, 16 slots) and the **Armor-set Smithy** (registers armour set bonuses account-wide). Gear crafting at the anvil is the only source of most equipment until the late game. [C1] [C2] [C20]
- **Unlocks:** Anvil and Tab 1 are available from the start; the Produce tab produces Thread from Smithing Lv 1 (wiki: "start producing thread"). Anvil Tabs 2-7 are crafted items (`EquipmentSmithingTabs2..7`) that unlock for the whole account. Forge is a W1 town building. The Armor-set Smithy (Frostbite Towndra, W3) opens after 30 days or 2,000 gems bought (the `bun_c` bundle counts 1,500). [C12] [C13] [C31] [C32]
- **Scope:** per-character: Smithing level and EXP, Produce slots and progress, anvil points, material pouch capacity. Account-wide: anvil tab unlocks and "crafted once" recipe state, the Forge (slots, upgrades, ore/bar contents), registered armour sets, total-Smithing-level Skill Mastery. [C4] [C12] [C30]
- **Inputs to outputs:**
  - Craft: materials (bars, ores, logs, monster drops, anvil products, salts, previous-tier gear) to equipment, tools, pouches, stamps' craft items, anvil tabs; gives a one-off Smithing EXP. [C14]
  - Produce: time only, no materials; yields anvil products (Thread to PVC Pipe) and Smithing EXP. [C3] [C5]
  - Forge: ore + time (+ optional oil barrel) to bars, plus Forge EXP that feeds Produce EXP via the "Forge EXP Gain" upgrade. [C27] [C28]
  - Armor-set Smithy: a worn full set, once registered, gives its bonus to every character permanently. [C31]
- **Goals and Milestones:** see the Smithing-level table, the point-source table and the Skill Mastery table in the Mechanics catalogue. Headline gates: Lv 15 (Tab 2 craft), 35 (Tab 3), 50 (Tab 4), 65 (Tab 5, W4 to W5), 80 (Tabs 6-7); total Smithing 150 / 200 / 300 across characters for Skill Mastery. [C13] [C21] [C22]
- **Feeds / fed by:**
  - Feeds: Mining/Choppin/Fishing/Catching/Trapping/Worship tools and pouches; combat armour and weapons; stamps (craft items); all character carry capacity (Material Pouch is also the anvil capacity base); Archer damage (Veins of the Infernal, capped Lv 100); set bonuses (Copper +60% Mining/Choppin Efficiency up to Prehistoric 2x W7 skill EXP). [C16] [C17] [C29] [C31]
  - Fed by: Mining, Choppin and Forge bars; Refinery salts (Tabs 4+); Alchemy (Hammer Hammer, Anvilnomics); Gem Shop (Infinity Hammer, Brimstone slots); Stamps (Anvil Zoomer, Forge Stamp); Post Office Blacksmith Box; Statue (Anvil); Star sign Bob Build Guy; cards Fire/Cinder Forge; Upgrade Vault (Production Revolution, Beeg Forge); bribes; Arcade; Rift Skill Mastery. [C1] [C6] [C7] [C26] [C27]
- **Per-session actions:** collect Produce on every character (Quick Deposit); keep every Produce slot filled (1 base + Infinity Hammer + Hammer Hammer = 3) and below capacity; spend new anvil points; top up the Forge (all 16 slots with ore, a barrel on speed-limited slots) and collect bars; craft newly affordable tool, pouch and armour tiers; register full armour sets at the Smithy. Idle states: empty hammer slot, product at capacity, `availablePoints > 0`, Forge slot at `Blank` or ore at 0, unregistered craftable set. [C1] [C5] [C8] [C27] [C31]
- **AFK Setup implications:** Produce and the Forge run regardless of the character's AFK activity; no AFK slot needed. They need only capacity to last the AFK Stretch. An Archer fighting AFK with Smeltin' Erryday adds seconds of instant Forge progress per kill. Archers in combat AFK therefore also speed the Forge. [C5] [C25]
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:** see the dedicated section below.
- **Save and Toolbox fields:** see the Mechanics catalogue (each row names the exact path) and the field list at the end.
- **Sources:** inline per claim; full list at the end.

## Mechanics catalogue

Format per mechanic: **rule / formula**, caps, unlock, cost, field. Field paths: `character.*` = `characters[i].*` in Account State / Toolbox `characters[]`; `account.*` = Toolbox `account.*`. Raw save keys are named where Toolbox reads them.

### A. Anvil: Produce tab

**M1. Products and recipe table. (H)** 14 entries (`anvilProducts`), 11 usable in W1-W4. The same production speed applies to any product, so a product's cost is `requiredAmount` progress units per item. [C3]

| # | Product (rawName) | Smithing Lv | Progress per item | EXP per item | EXP per 1K progress |
|---|---|---|---|---|---|
| 0 | Thread (CraftMat1) | 1 | 100 | 6 | 60 |
| 1 | Trusty Nails (CraftMat5) | 5 | 200 | 10 | 50 |
| 2 | Boring Brick (CraftMat6) | 12 | 350 | 16 | 46 |
| 3 | Chain Link (CraftMat7) | 17 | 700 | 25 | 36 |
| 4 | Leather Hide (CraftMat9) | 25 | 1,200 | 35 | 29 |
| 5 | Pinion Spur (CraftMat8) | 30 | 2,000 | 50 | 25 |
| 6 | Lugi Bracket (CraftMat10) | 35 | 3,000 | 65 | 22 |
| 7 | Purple Screw (CraftMat11) | 43 | 4,000 | 75 | 19 |
| 8 | Thingymabob (CraftMat12) | 50 | 6,000 | 90 | 15 |
| 9 | Tangled Cords (CraftMat13) | 60 | 8,500 | 110 | 13 |
| 10 | PVC Pipe (CraftMat14) | 70 | 12,000 | 140 | 12 |
| 11-13 | CraftMat15/16/17 (no display name in item data) | 999 (unreachable) | 120,000 / 160,000 / 250,000 | 1,000 / 1,300 / 2,000 | 8.3 / 8.1 / 8 |

Entries 11-13 are placeholders for a future product tier (levelReq 999). W5+ note: none is producible today. Field: `character.anvil.anvilProduction[i] = [currentAmount, currentXP, currentProgress, totalProduced]` from raw `AnvilPA_<char>`; product metadata merged from `anvilProducts[i]`.

**M2. Hammers (parallel slots). (H for Infinity Hammer and Hammer Hammer; L for "max 3")** Each "hammer" works one product; progress per second is `anvilSpeed/3600` per hammer on that product. Base 1 hammer; Infinity Hammer (Gem Shop `GemP1`, 300 gems, one purchase, account-wide, "stacks with other +1 hammer sources") +1; Hammer Hammer alchemy bubble (big bubble, must be equipped; also +% speed) +1. "Max 3" is wiki-only and unverifiable in code or data (L): Toolbox simply counts how many entries of `anvilSelected` equal a product index, so the true ceiling is whatever the save holds; the Gem Shop text says Infinity Hammer "stacks with other bonuses that give +1 anvil hammer", so other sources may exist (see M28). Field: `character.anvil.anvilSelected` (raw `AnvilPAselect_<char>`, a list of product indices, one entry per hammer; the same index twice = two hammers on one product); `character.equippedBubbles` (`HAMMER_HAMMER`); `account.gemShopPurchases[103]`. [C5] [C6] [C7]

**M3. Production speed (items per hour = speed x hammers / requiredAmount). (H)** `anvilSpeed(per hour) = 3600 x (1 + (AnvilZoomerStamp + 2 x speedPoints)/100) x (1 + (BlacksmithBox[1] + AnvilStatue + UpgradeVault24)/100) x (1 + HammerHammer/100) x AgilityBonus x (1 + (BobBuildGuyStarSign + BrokenTimeTalent)/100)`. [C1]
- Anvil Zoomer stamp `StampB3` (skills tab index 2), `func add x1=1`: +1% per stamp level. [C6]
- Blacksmith Box (Post Office, max level 400): upgrade 2 "Production Speed" `decay x1=75 x2=200`. [C6]
- Anvil Statue (statue index 11, `%@PRODUCT_SPD`, bonus 0.5 per level); Archer/Bowman statue talents Straightshot / Shwifty Statues add to the statue bonus. [C6]
- Upgrade Vault index 24 "Production Revolution": max 100, unlockLevel 750. [C6]
- Hammer Hammer: Quicc cauldron bubble `a2`, `func bigBase x1=23 x2=2`. [C6]
- Bob Build Guy star sign: +10% Speed in Town. Broken Time (Calm Basics): `decay x1=100 x2=75`, "Production Speed in all Town Skills". [C6]
- Agility bonus: `getSpeedBonusFromAgility(agi) = 2 x StatCurve(agi) + 1`, `StatCurve(s) = ((s+1)^0.37 - 1)/40` below 1000, else `((s-1000)/(s+2500)) x 0.5 + 0.297`. Applies to any class, so high AGI helps non-Archers. [C2]
- Field: `character.anvil.anvilStats.speedPoints`; Toolbox-computed `getPlayerAnvil(...).stats.anvilSpeed` (per hour). In Account State: `characters[].afk.anvil[]` (`hammers, amount, capacity, capAt, fromEmptyMs`).

**M4. Anvil points: the three stats. (H)** Three allocatable stats: **Exp** (`xpPoints`), **Speed** (`speedPoints`, +2% production speed each, inside the stamp term), **Capacity** (`capPoints`). Unspent = Smithing level + Acme Anvil points + coin points + monster-material points minus (Exp + Speed + Capacity). Field: `character.anvil.anvilStats = {availablePoints, pointsFromCoins, pointsFromMats, pointsFromAcme, xpPoints, speedPoints, capPoints}` from raw `AnvilPAstats_<char>` = `[available, fromCoins, fromMats, xp, speed, cap]`. Account State recomputes the true unspent as `characters[].unspent.anvilPointsAvailable` / `afk.anvilPlan.unspent` because the stored `availablePoints` is stale after a Smithing level-up. [C4] [C8]

**M5. Point sources and costs. (H for formulas and the 600 coin cap; L for wiki-only items marked below)**
- +1 per Smithing level. [C8]
- Coins: cost of the (n+1)-th coin point `round((n^3 + 50) x (1 + n/100) x max(0.1, 1 - Anvilnomics/100))`; max 600 coin points (Toolbox `MAX_POINTS_FROM_COINS = 600`). [C9]
- Monster materials: cost of the n-th point `round(((n+1)^1.5 + n) x max(0.1, 1 - Anvilnomics/100))`; the required monster drop changes at 26 thresholds (5, 15, 25, 40 ... 600, 601 points: Spore Cap, Frog Leg, Bean Slices, Slime Sludge, Carrot Cube, ... Empty Oyster Shell, Condensed Zap). Wiki states max 700 material points (L, unverifiable offline); Toolbox imposes no cap and its last tier repeats from 601. [C9] [C10]
- Acme Anvil (Archer talent 281): `pointsFromAcme = SkillLevels[281] + talentBonus x floor(smithingLevel / 10)` where talent 281 is `intervalAdd` x1=1, x2=15. Two readings of x2=15 exist: the description says "+{ extra pts every 10 Smithing Lvs", while Toolbox multiplies `getTalentBonus` by `floor(smithing/10)`; the meaning of x2=15 is low confidence (L), use the code's value as the reference. Resetting talents drives the stored balance negative; re-investing restores it ("spend then respec and keep the upgrades" trick). [C11]
- Anvilnomics (Quicc bubble `a4`, `decay x1=40 x2=100`) reduces both coin and material cost. [C6]
- Respec: the Anvil Reset Whetstone (Frostbite Towndra shop, W3; 1.2M coins, stock 1 per day per the existing KB entry) re-splits all points and resets Exp. Confidence L: wiki Vendors page, not verifiable from code or data. [C19]
- Total ceiling per character per wiki: 1,300 purchasable (600 + 700) plus level and Acme points. Confidence L (the 700 half is wiki-only; code confirms only the 600 coin cap). [C10]

**M6. Production EXP bonus. (H)** `ProdExpBonus = (1 + 3 x xpPoints/100) x SmithingEXPmulti`; below 20 it is linear, above 20 it soft-caps `20 + ((x-20)/(x-20+70)) x 50`, hard cap 75. Toolbox returns `100 x (bonus - 1)` as the displayed percentage. Field: `calcAnvilExp`. [C37]

**M7. Smithing EXP multiplier ("SmithingEXPmulti"). (H)** `max(0.1, (1 + (FocusedSoul + SmithExpStamps + HappyDude + 25 x SkillMasteryTier1)/100) x (1 + SmithingCards/100) x (1 + BlacksmithBox[0]/100) + (AllSkillExp + LeftHandOfLearning)/100)`. [C37]
- Focused Soul (Archer talent 265, `add x1=1`): "EXP gain for all Specialized Skills". Happy Dude (Beginner talent 75, `add x1=1`): EXP for all skills. Left Hand of Learning (Maestro talent 42). [C11]
- Cards: Fire Forge (`ForgeA`, base bonus 4) and Cinder Forge (`ForgeB`, base bonus 7), both with `perTier` 10 in `cards.json`, effect "+{% Smithing EXP (Passive)". The earlier "+4 / +7 per tier" wording was imprecise (source lens): the per-level scaling is a Toolbox card formula that was not re-derived here, so state only the base values. Confidence M. [C15]
- Blacksmith Box upgrade 1 "Smithing EXP" `decay x1=50 x2=200`. [C6]
- Skill Mastery tier 1 (total Smithing >= 150): +25 inside the first bracket. [C30]
- **Important: no stamp in the current stamp data has an effect string containing `SmithExp`**, so the stamp term evaluates to 0 with this pin (the prior dossier listed "SmithExp stamps"). Only StampB3 and StampC10 touch smithing/forge/anvil. The Blacksmith Box stat is also named `SmithExp` but is a Post Office source, a different term. Confidence H; open question OQ2. [C38]
- Forge "Forge EXP Gain" upgrade (+1% per level, max 85) adds to Produce EXP per the wiki (L); the vendored Toolbox does not read it in `calcAnvilExp`. OQ3. [C28]
- The all-skill EXP multiplier explicitly does not multiply Smithing (`AllSkillxpMULTI` excludes smithing, alchemy, construction); `AllSkillExp` enters additively. [C39]

**M8. Capacity. (H)** `anvilCapacity = round(min(2e9, materialPouchCapacityPerSlot x (2 + 0.1 x capPoints)))`; `materialPouchCapacityPerSlot` is the character's `bCraft` carry bag. Each product caps independently; production stops at capacity. Time to cap: `(capacity - futureProduction) / (speed/3600/requiredAmount x hammers)`. Field: `character.carryCapBags[Class=bCraft].capacityPerSlot`, `getTimeTillCap`, `getAnvilFutureProduction`. [C5] [C18]

**M9. Offline production. (H)** The game's AFK code adds `ProductionSpeed x seconds` to each hammer's product progress, then converts whole `requiredAmount` chunks to items, floored and capped at capacity. Toolbox reproduces this from `Date.now() - afkTime`. Account State freezes this to `now` (ADR determinism). Field: `characters[].afk.anvil`. [C5]

**M10. Quick deposit / anywhere. (L, wiki/changelog; not re-fetched)** The anvil can be used from anywhere since v2.28 (2025-02-08); Quick Deposit sends completed Produce items to storage. W3 Automation Arm auto-deposits at reset (prior dossier, unverified in this pin). Both verifiers flagged this unverifiable from code or data. [C33]

### B. Anvil: Craft tab

**M11. Craft recipes and tabs. (H for data counts; M for wiki-supplied tab/level)** `crafts.json` holds 420 recipes (`itemName -> {rawName, type, subType, materials[{itemName, rawName, itemQuantity}]}`); the tab and the Smithing level of a recipe are NOT in Toolbox data (and `items.json` `lvReqToCraft` is not the Smithing level: Copper Pickaxe = 4 vs wiki Lv 3, Platebody = 55 vs wiki Lv 7). ActiveOn's authored `gear.fact.recipes` supplies tab, n and lv from the wiki. Recipe unlock sources: Anvil Tab start, Task Board (W-specific Unlocks), World Merit Shop "Smithing recipes", drop, craft-after-previous. Crafting one item for the first time unlocks it from storage for every character. Field: `account.anvilRecipes` (raw `AnvilCraftStatus[tab][recipe]`: -1 locked, 0 available, 1 crafted once). [C12] [C14] [C20]
- **Disputed (C14).** Data lens refuted an earlier "13 per class line / 12 per tool" summary: `crafts.json` has spears, bows and wands at 13 each but fisticuffs at 12; pickaxes, hatchets, fishing rods and bug nets at 12 each but trap boxes and worship skulls at 10. The list below is the corrected set (source lens agreed on the counts but flagged the same weapon exception). Confidence H.
- Recipe counts by subType (data): carry bags 90, shirts 33, shoes 32, helmets 31, pants 23, quest items 19, rings 18, pendants 15, spears/bows/wands 13 each, fisticuffs 12, pickaxes/hatchets/rods/nets 12 each, traps 10, skulls 10, boost food 9, anvil expansions 6 (Tabs 2-7), premium helmets 5. [C14]

**M12. Anvil tab expansions (costs H from `crafts.json`; Smithing Lv gates M/L, wiki-only)** (`ANVIL_EXPANSION`; wiki Smithing Lv in brackets). [C13]

| Tab | Recipe (rawName) | Cost | Wiki Lv |
|---|---|---|---|
| 2 | Anvil Tab 2 (`EquipmentSmithingTabs2`) | 100 Iron Bar, 100 Chain Link, 100 Jungle Logs, 100 Bullfrog Horn | 15 (Chain Link needs Lv 17 to produce) |
| 3 | Anvil Tab 3 (`...Tabs3`) | 2,000 Platinum Bar, 2,000 Bloach, 2,000 Fruitfly, 1,500 High Steaks | 35 |
| 4 | Anvil Tab 4 (`...Tabs4`) | 1,000 Void Bar, 2,500 Frigid Soul, 10 Eternal Lord of The Undying Ember, 400 Spontaneity Salts | 50 |
| 5 | Anvil Tab 5 | 5,000 Starfire Bar, 200,000 Cubed Logs, 150,000 Fairy, 600 Nullo Salt | 65 |
| 6 (W5+) | Anvil Tab 6 | 8,500 Dreadlo Bar, 2,000,000 Dandielogs, 1,000,000 Dust Mote, 10 Kruk Cavity Tooth | 80 |
| 7 (W5+) | Anvil Tab 7 | 100,000 Godshard Bar, 25,000,000 Effervescent Logs, 25,000,000 Firefly, 50 Emperor Ribbon | 80 |

Item data also names `EquipmentSmithingTabs8` (parseMaps.ts exclusion list), no recipe yet. The prior dossier's Lv 65 / 80 gates are wiki-only (tier 2).

**M13. Material pouches (anvil capacity base). (H for recipes, M for capacity values)** 8 Material Pouch tiers (`MaxCapBagM*`): Cramped (cap 50; 50 Thread + 50 Frog Leg), Average (250; 1 Glass Shard + 1,700 Chain Link), Sizable (500; 3 Golden Plop + 4 Woodular Circle), Big (1,000; 15,000 Sticky Stick + 3 Ice Age 3), Large (2,000; 20,000 Audio Cord + 1 Black Lense), Massive (5,000; 130,000 Genie Lamp + 10 Lost Batteries + 1,000 Dioxide Synthesis), Volumetric (10,000; 500,000 Condensed Zap + 5 Pearler Shell + 800 Nullo Salt), then W5+ Colossal (20,000), Gargantuan (25,000), Herculean (30,000), Enormous (35,000). Recipe costs are shown after the semicolon; per-slot capacity values come from `invBags`, not from this table. Because anvil capacity scales with `capacityPerSlot`, pouches matter more than Capacity points. [C18] [C14]

**M14. Gear ladder (W1-W4 sets and tools). (M: abbreviated, material lists spot-checked)** From `equipmentSets` and `crafts.json` (recipes abbreviated; base item is consumed at each tier, so every tier needs the previous one). [C14] [C31]

| Set | Pieces to craft | Key materials | Equip Lv |
|---|---|---|---|
| Copper (W1) | Helmet, Platebody, Platelegs, Pickaxe, Chopper | Copper Ore, Bean Slices, Trusty Nails, Oak Logs | 3-8 |
| Iron (W1) | Helmet, Platebody, Platelegs, Pickaxe, Hatchet | Iron Bar, Glublin Ear, Jungle Logs, Boring Brick | 8-15 |
| Amarok (W1 Merit Shop recipes) | Helmet, Bodyplate, Hinds, Paws | Amarok Slab (boss drop), Forest Fibres, Iron Bar, Chain Link | 35-40 |
| Gold (W2) | Helmet, Platebody, Platelegs, Boots, Pickaxe, Axe, weapons | Gold Bar + Copper/Iron piece + drops | 15-35 |
| Platinum (W2) | Helmet, Platbody, Shins, Boots, Pickaxe, Hatchet, weapons | Platinum Bar + Iron/Gold piece | 20-55 |
| Efaunt (W2 boss) | Helmet, Ribcage, Hipilium, Broken Ankles | Ripped Tunic (boss), Distilled Water | 70-80 |
| Dementia (W3) | Helmet, Body, Shins, Boots, Pickaxe, Dicer, weapons | Dementia Bar 300-500 each | 25-70 |
| Void (W3) | Imperium Helmet, Platebody, Shardshins, Kicks, Pik, Axe, weapons | Void Bar 400-1,000; Dense Water; Spontaneity Salts | 30-90 |
| Chizoar (W3 Merit Shop recipes) | Helmet, Bodyplate, Leggings, Walkers | Chizoar Spike (boss), Purple Salt | 95-110 |
| Lustre (W4) | Veil, Chestplate, Scales, Shieldshoe, Pickaxe, Logger, weapons | Lustre Bar 250-2,500, Dioxide Synthesis | 40-115 |
| Diabolical (W4) | Headcase, Abdomen, Leg Guards, Toe Tips, Starfire Pickaxe, weapons | Starfire Bar 500-10,000, Nullo Salt | 48-135 |
| Troll (W4 drop set) | Troll armour (no anvil recipe in crafts data) | boss/event | n/a |

Sets above Diabolical (Magma, Kattlekruk, Marbiglass, Godshard, Emperor, Prehistoric) are W5+ (see section E).

**M15. Upgrade slots and stones. (M; slot counts and stone families from item data, community meta L)** Every crafted equip has `Upgrade_Slots_Left` (Copper 2 ... Diabolical 5-8). A stone (`UPGRADE` items) is dragged on equipment, has a success chance (`Amount`, 100 for Stone I), and uses up slots only on success. Families: Weapon, Armor, Tool, Helmet, Mystery (negative stat risk); tiers I, II, III, IV, V, VI, VII, "C/G/B/SK" variants, plus seasonal Giftmas/Easter/Summer. Example effects: Armor Stone I `Defence,2.Random_Stat,1`; Weapon Stone I `Weapon_Power,1`; Tool Stone I `Weapon_Power,1.Random_Stat,1`; Helmet Stone I `Random_Stat,3` at 70%. Applied stone stats are stored per item in the save (`EquipmentMap[0]` equipment, `[1]` tools, `CMm` chest) and merged by `addStoneDataToEquip`; `maxUpgradeSlots` is derived. Field: `character.equipment[].maxUpgradeSlots`, `character.tools[]`, stone fields `Defence, Weapon_Power, STR..LUK, UQ1/2`. [C23]

**M16. Godly Creation (Archer talent 283) and Blacksmith Box "+1 slot". (H numbers / L effect)** Godly Creation: `decay x1=50 x2=75` "% chance to apply a special bonus to any equip crafted at the anvil". Blacksmith Box upgrade 3 `OneSlot` `decay x1=30 x2=150`: "% to craft +1 slot". No Toolbox parser consumes either; not detectable from the save beyond the talent and Post Office levels. Full detail in M27 and M29. Confidence H for the numbers, L for what the "special bonus" actually is. [C6] [C11]

### C. Smithing level and Archer talents

**M17. Smithing level curve. (H)** Smithing is skill index 2. EXP to next level `getExpReq(2, t) = (15 + t^2 + 13t) x (1.225 - min(0.114, 0.135 t/(t+50)))^t - 26`. Field: `character.skillsInfo.smithing = {level, exp, expReq, rank}`; `account.totalSkillsLevels.smithing` (sum over characters). [C21]

**M18. Archer Smithing talents (H ids and decay values; L for Acme x2 meaning, see M5)** (class talent ids): Acme Anvil 281, Focused Soul 265, Broken Time 269 (Calm Basics), Yea I Already Know 282 (start with x% EXP per 250 AGI on a Specialised Skill level-up, capped; `decay x1=5 x2=90`, cap `intervalAdd y1=5 y2=10`; see M29), Godly Creation 283, Smeltin' Erryday 280, Veins of the Infernal 284 (`decay x1=35 x2=50`, damage per 10 Smithing levels, `min(100, level)/10`, a separate multiplier; so Lv 100 is the cap). Field: `character.flatTalents`. [C11] [C24]

### D. Forge (account-wide)

**M19. Slots. (H for slots and speed; L for the multi-bar claim)** 16 slots (upgrade "New Forge Slot", max 16). Each slot holds `[ore, barrel, bar]` and quantities. Brimstone slots (Gem Shop `GemP4`, 100 gems each, max 16, global index 104): the first N slots smelt +50% faster and get x1.5 forge speed (`BRIMSTONE_MULTI = 1.5` in forge.ts, the only Brimstone effect Toolbox applies). The earlier "+50% multi-bar chance" claim is NOT in Toolbox code or data (wiki/in-game text only, unverified; L). Treat Brimstone as a speed boost in ActiveOn until proven. Field: `account.forge.list[0..15] = {ore, barrel, bar, speed, isBrimestone}` from raw `ForgeItemOrder`, `ForgeItemQty`/`ForgeItemQuantity`; `account.gemShopPurchases[104]`. [C27]

**M20. Forge upgrades (H for max level and costMulti; L for the effect text marked "wiki")** (`account.forge.upgrades[]`, raw `ForgeLV`/`FurnaceLevels`):

| Upgrade | Max | costMulti | Effect |
|---|---|---|---|
| New Forge Slot | 16 | n/a | +1 slot per level |
| Ore Capacity Boost | 50 | 1.41 | raises the base term: `20 + growth('add', level, 10, 10)` |
| Forge Speed | 90 | 1.2 | +5 speed per level over base 100 (wiki: +5% per level) |
| Forge EXP Gain | 85 | 1.21 | +1% EXP gain from the anvil (wiki) |
| Bar Bonanza | 75 | 1.25 | +1% chance per level of an extra bar (wiki) |
| Puff Puff Go | 60 | 1.33 | +2% card-drop chance per level (wiki) |

[C27] [C28]

**M21. Forge speed. (H)** `ForgeSpeed = round((100 + 5 x speedLevel + 30 x GodshardCardLevel) x (1 + MenagerieBoost11/100))`; slot speed `= ForgeSpeed/100 x (1 + barrelAmount/100 if speed barrel) x 1.5 if Brimstone x 0.25`. A smelt cycle takes `ore.Cooldown / (4 x slotSpeed)` seconds and consumes `ore.Amount` ore for one bar. [C27]

**M22. Forge ore capacity. (H; verifier note: forge.ts#L53 is only the constant BEEG_FORGE_VAULT_UPGRADE = 26, its use is in `getForgeOreCapacity`; vault index 26 Beeg Forge max 100 unlock 860 and index 24 Production Revolution max 100 unlock 750 both confirmed in data)** `min(2e9, BeegBeegForge x (20 + OreCapacityBoost) x (1 + (Arcade26 + 30 x GodshardCard)/100) x (1 + ForgeStamp/100) x (1 + (Bribe "Forge Cap Smuggling" 30 + UpgradeVault26)/100) x (1 + (Achievement 281 x 50 + 25 x SmithingMasteryTier2)/100))`. Field: `account.forge.oreCapacity.value`. [C27]

**M23. Ores and barrels (H for ore Amount/Cooldown; L for wiki-only extra-bar barrels)** (`items.json`): Copper 2 ore / 15 s, Iron 4 / 30, Gold 7 / 60, Platinum 16 / 200, Dementia 40 / 400, Void 100 / 750, Lustre 250 / 1,300, Starfire 500 / 2,000 (W4); Dreadlo 1,000 / 3,000, Marble 3,000 / 5,000, Godshard 6,000 / 10,000, Prehistrium 20,000 / 15,000 (W5+; cooldown base units). Speed barrels: Crude Oil (+15%, 75), Radioactive Waste (+30%, 30), Eco Friendly Oil (+10%), Glumlee's Special Tutorial Oil (+999%); barrel use per cycle is reduced by the bribe "Fossil Fuel Legislation" (-20%). Wiki also lists extra-bar barrels (Toxic Sludge +20%, Magma +40%, Plasma +60%) that this pin's items data lacks (OQ4). Field: `account.forge.list[].barrel`. [C27] [C28]

### E. Armor-set Smithy and Skill Mastery

**M24. Armor-set Smithy. (H)** Unlock: `ServerGemsReceived + 1500 x bun_c >= 2000` or `days >= 30` (days is `OLA[381]`); hire flag `OLA[380]`; registered sets `OLA[379]` (comma list, first element dropped). A set also counts when the logged-in character wears it entirely (parts-on = armour pieces worn + min(requiredTools, tools held) + 1 weapon if required). Bonus value is read by `getArmorSetBonus(account, setName)` when `unlocked || equipped`. Field: `account.armorSmithy = {sets[], days, smithyUnlocked, unlockedSets, isSmithyUnlocked}`; Account State `armorSmithy = {canHire, hired, daysWaited, registered}`. [C31] [C32]

**M25. Set bonuses (all 19 sets). (H, 19 sets verified)** Copper +60% Mining/Chopping Efficiency (1 tool required); Iron +25% Class EXP (1 tool); Amarok +40% Accuracy and Defence; Gold 1.5x coins dropped (1 tool, 1 weapon); Platinum +60% Fishing/Catching Efficiency; Efaunt +25% Drop Rate; Dementia +50% Critters and Souls (2 tools, 1 weapon); Void +10% AFK Gains; Chizoar +40% All Skill EXP; Lustre +75% Total Damage; Diabolical +20% Faster Monster Respawning; Troll 1.25x Tome bonuses; Secret 1.25x Gold Food; W5+: Magma +100% Lab/Divinity EXP, Kattlekruk +5 talent LV, Marbiglass +10% All Stat, Godshard 1.15x Summoning winner bonuses, Emperor 1.2x Ribbons/Exalted Stamps, Prehistoric 2x W7 skill EXP. [C31]

**M26. Skill Mastery (Rift). (H for ranks and the rank 1/2 effects; L for the wiki tier 3 +5% damage)** Needs the Rift at stage >= 15 (`rift.currentRift >= 15`). Rank from the SUM of that skill's level over all characters: <150 rank 0, 150 rank 1, 200 rank 2, 300 rank 3, 400 rank 4, 500 rank 5, 750 rank 6, 1000 rank 7. Smithing: rank 1 = +25 Smithing EXP bracket (M7); rank 2 = +25% Forge ore capacity (M22); further tiers read through `getSkillMasteryBonusByIndex` (+10 per qualifying skill at rank 4 bonus index etc.); the prior dossier records, from the wiki, tier 3 (300) = +5% total damage (not read by this pin's Smithing code). Field: `account.totalSkillsLevels.smithing.{level, rank}`, `account.rift.currentRift`. [C30]

### F0. Mechanics added in the verdict pass (missed by the first draft)

**M27. Blacksmith Box (Post Office, three stats).** `postOffice` "Blacksmith_Box", max level 400, `upgradeLevels` [24.9, 99.9, 400.1] (the level thresholds at which each stat unlocks, presumably), all `decay`: stat 1 `SmithExp` "% Smithing EXP" x1=50 x2=200; stat 2 `ProdSpd` "% Production Speed" x1=75 x2=200 (feeds M3); stat 3 `OneSlot` "% to Craft +1 Slot" x1=30 x2=150. OneSlot is a gear-crafting mechanic: a chance that a crafted equip gets +1 upgrade slot. No Toolbox parser reads it. Field: `characters[].postOffice` Blacksmith_Box level. Source: tier 1 `data:shared-data.json` (Blacksmith_Box block ~L33720-33745), confidence H for numbers, L for the exact in-game roll. [C6]

**M28. Hammer count sources.** Per-character hammers are not a stored total: each character's `AnvilPAselect_<n>` list has one product index per working hammer, and Toolbox counts `anvilSelected.filter(i => i === product).length` per product (`anvil.ts` ~L149). Known +1 sources: base 1, Infinity Hammer (`GemP1`, global index 103), Hammer Hammer bubble. The Gem Shop text confirms "stacks with other bonuses that give +1 anvil hammer", so unknown further sources are possible (L). Players assign hammers to products per character (the product-selection UI), so the Check should read the list length, not recompute from sources. Confidence H for the read path, L for the source list completeness. [C7]

**M29. Godly Creation and Yea I Already Know.** Godly Creation (talent 283): `decay x1=50 x2=75`, "% chance to apply a special bonus to any equip crafted at the anvil"; no Toolbox consumer, the bonus type and storage are unknown (L; possibly stone-like fields on the crafted item, unverified). Yea I Already Know (talent 282): `decay x1=5 x2=90` "Start with x% EXP per 250 AGI when you lv up any Specialized Skill. Caps at y%", y by `intervalAdd` y1=5 y2=10. No Toolbox consumer. Confidence H numbers, L semantics. Source: tier 1 `data:talents.json` Archer. [C11]

**M30. Forge extras.** Speed: Menagerie boost 11 multiplies ForgeSpeed; Godshard card +30 speed and +30% capacity per card level; speed barrel (`Effect === 'SpeedForge'`) adds `Amount`% to slot speed. Capacity: Arcade bonus 26, Forge Stamp, bribe Forge_Cap_Smuggling, Upgrade Vault 26, achievement 281 (x50), Beeg Beeg Forge cosmo multiplier (W5 Hole), Skill Mastery Smithing rank 2 (+25); cap 2e9. Barrel depletion: a speed barrel lasts `barrelQuantity / (barrel.Cooldown x barrelUsePerCycle / 100)` cycles, after which the slot runs at the barrel-less speed; bribe Fossil_Fuel_Legislation reduces barrel use (`barrelUsePerCycle = 1 - bribe/100`). Whole-ore cycles only: a leftover below `ore.Amount` never smelts. Source: tier 1 `V:parsers/world-1/forge.ts` L45-60, L120-228. Confidence H. [C27]

**M31. Smeltin' Erryday (Archer talent 280).** `decay x1=50 x2=80` chance per kill for `intervalAdd y1=1 y2=60` seconds of instant Forge progress. Toolbox does not model it (the game applies it in combat). Not detectable from the save beyond the talent level; ActiveOn can only advise investing it for Archers who fight AFK. Source: tier 1 `data:talents.json`. Confidence H numbers, L for effect size at runtime. [C25]

**M32. Armor Smithy registration and unlock (OLA 379-381).** Covered numerically in M24; additionally `OLA[379]` is a comma-separated list of registered set names (first element dropped), `OLA[380]` the hire flag, `OLA[381]` the days waited. The set bonus applies when `registered || fully worn`. Source: tier 1 `V:parsers/world-3/armorSmithy.ts`. Confidence H. [C32]

**M33. Anvil point reset and negative unspent after Acme Anvil changes.** Because `availablePoints` in the save is a stale snapshot and Acme points derive from the talent level and Smithing level, a talent reset can leave the stored balance negative; re-investing restores it. Account State's recomputed `unspent.anvilPointsAvailable` is the safe field. The Anvil Reset Whetstone (W3 shop, L) is the sanctioned respec. Source: tier 1 anvil.ts, existing ActiveOn KB. Confidence M. [C8] [C11]

**M34. Produce-tab product selection, craft slots and bCraft.** `anvilSelected` picks the product per hammer (M28); anvil products feed Alchemy, Stamp crafts and quests (which products are demanded by which recipes is in the Craft tab material lists, M12/M13/M14). The Material Pouch (`bCraft` carry bag) is the capacity base for every product (M8); "craft-slot" wording in the verifier note refers to the same bag plus Blacksmith Box OneSlot (M27). Anvil Tabs 6-7 costs exist in `crafts.json` (Dreadlo and Godshard bars; W5+, M12). Source: tier 1 anvil.ts, crafts.json. Confidence M. [C13] [C18]

### F. W5+ extensions (one line each)

- Anvil Tabs 6-7, Dreadlo/Marble/Godshard/Prehistrium gear (Marbiglass, Godshard, Prehistoric, Kattlekruk, Magma, Emperor sets) and CraftMat15-17 placeholders. [C13] [C14]
- Forge ores Dreadlo through Prehistrium, Beeg Beeg Forge cosmo upgrade (W5 Hole), Menagerie boost 11 (W7) as a Forge speed multiplier. [C27]
- Spelunking/Research tools reference smithing (`SmithingHammerChisel` items excluded as unfarmable in parseMaps.ts). [C14]
- Veins of the Infernal stops scaling at Smithing Lv 100. [C24]

## Min-max by stage

Priority orders below are synthesised from game-data arithmetic (tier 1) plus the closest community meta found (tier 3). Where only data supports a line, it is marked "data". Confidence H/M/L.

### Anvil point allocation (all stages)

1. **Speed first.** Rationale (data): Speed is `+2%` per point inside the first multiplicative bracket along with the Zoomer stamp, and production speed directly multiplies EXP and materials. The guide (2026-05-26) says "prioritize speed"; the Steam 2021 thread says the same for new characters. Confidence H. [C1] [C34] [C35]
2. **Exp points: sink only until ProdExpBonus nears its soft cap (20x)**: each Exp point adds 3% of a base `SmithingEXPmulti`; with a base multi around 1-2 the cap region is reached late. Data-derived; community silent (L). [C37]
3. **Capacity: only when a product fills before your usual return** after Material Pouch upgrades. Late-game 20-26 h AFK players value Capacity (Steam, 2021, pre-Whetstone). Toolbox-based ActiveOn plan already brute-forces the split. Confidence M. [C18] [C35] [C19]
4. **Archer trick:** invest in Acme Anvil, spend the points in W1, respec talents, keep the spent upgrades (guide 2026-05; wiki). Confidence M. [C11] [C34]

### Per stage

| Stage | Smithing Lv | Produce | Craft / Forge / Smithy |
|---|---|---|---|
| W1 early | 1-15 | Thread on all hammers (tier 3: "best thing to produce for XP is Thread"). Trusty Nails only when a recipe needs 120 (Copper Platebody). | Copper Pickaxe/Chopper, Cramped Material then Mining/Choppin pouches, Copper set (Helmet, Platebody, Platelegs, Boots) and a spare for the Smithy; keep the Forge full; first anvil points all Speed. |
| W1 mid/late | 15-20 | Thread; Chain Link (Lv 17) for Tab 2 (100) and Average Material Pouch (1,700). | Iron Pickaxe/Hatchet, Small pouches, Iron set, Tab 2; Golden Peanut (Lv 18 wiki); Hammer Hammer bubble when Alchemy allows; Infinity Hammer (300 gems) is the best early gem buy for Smithing (+1 hammer on every character). |
| W2 | 20-35 | Thread; stockpile Boring Brick/Chain Link as recipes demand. | Gold and Platinum tools (Mining/Choppin tier), Gold Helmet + three Amarok pieces (tier 3 gear guide and wiki Tips), Average/Sizable pouches, Anvil Tab 3 (Lv 35); Blacksmith Box in Post Office; Anvil Zoomer stamp. |
| W3 | 35-50 | Thread; Purple Screw (Lv 43) as needed for later Lustre Scales (60,000). | Dementia then Void tools and armour; Big/Large pouches; unlock Smithy (30 days / 2,000 gems) and register Copper, Iron, Gold, Platinum first (tier 3 Reddit: register older sets), then Dementia/Void; Tab 4 (Lv 50). |
| W4 | 50-65 | Thread. | Lustre then Diabolical gear, Massive/Volumetric pouches, Tab 5 (Lv 65) as the W5 gate; Forge Stamp, Beeg Forge vault upgrade, Starfire ore. |
| W5+ | 65-100 | Thread. | Tabs 6-7; Veins cap at Lv 100; Prehistoric / Marbiglass / Godshard sets. |

Forge upgrade order (data-derived, tier 3 silent): Forge Speed and Ore Capacity first (both feed bars for gear), then Forge EXP Gain, then Bar Bonanza; New Forge Slot early as cheap slots keep multiple ore types smelting; buy Brimstone slots (100 gems) after Infinity Hammer. Confidence L.

Upgrade-stone meta (tier 3, 2026-07-25): W1-W3 use stones "on equipment and move equipment around so it optimises for accuracy"; W4+ "use stones on the character that will wear the piece"; Armor Stone II from the W2 shop; W7 stones also buff misc slots. Confidence M. [C36]

Per class: the **Archer line** is the Smithing class (Acme Anvil, Focused Soul, Broken Time, Yea I Already Know; Godly Creation lowest priority per the 2026-05 guide). Bowman/Hunter statue talents boost the Anvil statue. High AGI helps any class. Maestro Left Hand of Learning gives other characters Smithing EXP. [C11] [C34]

## Common mistakes and save-based detection

| Mistake | Detection (path) |
|---|---|
| Producing high-tier products "for more EXP" | `character.anvil.anvilSelected` points at index > 0 with EXP/1K progress lower than Thread and no recipe demand (table M1) |
| Unspent anvil points | `characters[].unspent.anvilPointsAvailable > 0` |
| Points sunk into Capacity early | `anvilStats.capPoints` large while `afk.anvil[].fromEmptyMs` is far beyond the usual AFK length |
| Only one hammer | `anvilSelected.length === 1` while Infinity Hammer purchased (`gemShopPurchases[103]`) or Hammer Hammer bubble owned |
| Anvil full during an AFK Stretch | `afk.anvil[].capAt <= now + expectedReturn` (existing Check) |
| Not crafting a spare set before the Smithy opens | `account.armorSmithy.registered` lacks COPPER_SET / IRON_SET etc. |
| Forge slots empty or ore at 0 | `account.forge.list[].ore.rawName === 'Blank'` or `ore.timeTillEmpty <= 0` |
| Forge upgrades with free cash unspent | `account.forge.upgrades[].level < maxLevel` (not currently flagged; Forge has no Check) |
| Low Smithing on all but one character | `account.totalSkillsLevels.smithing.level` vs the 150/200/300 Skill Mastery thresholds |
| Wasting the Archer talent trick | `afk.anvilPlan.unspent < 0` after a talent reset |

## Sprites needed (for the build step)

Existing grids: `sys-anvil`, `sys-forge`, `sys-armor-smithy`, `skill-smithing`. Missing and recommended for the pages in section "ActiveOn gaps": anvil product icons (Thread, Trusty Nails, Boring Brick, Chain Link, Leather Hide, Pinion Spur, Lugi Bracket, Purple Screw, Thingymabob, Tangled Cords, PVC Pipe) as `item-craftmat-*`; `sys-hammer-slot` (hammer count pip); `sys-brimstone` (brimstone slot); five forge barrel icons (Crude Oil, Radioactive Waste, Eco Friendly Oil, speed barrel generic, extra-bar barrel); upgrade-stone family icons (weapon, armor, tool, helmet, mystery); material-pouch tier icons (8); ore and bar icons Copper to Starfire for the Forge page; set-bonus emblem per set (11 W1-W4 sets). Use the project's masked-grid format in `apps/activeon/src/art/sprites/grids/*.ts`, brand tokens only.

## ActiveOn gaps this dossier implies (for the spec step)

1. Forge page and Checks: idle slot, ore at 0, `timeTillEmpty` before return, upgrade affordable.
2. Anvil Craft ladder beyond the Gear Plan: tab unlock, pouch tiers, Tab 5 gate.
3. Smithing Goals: level thresholds (15/35/50/65/80/100), total-level mastery thresholds (150/200/300).
4. Hammer-count Check (Infinity Hammer / Hammer Hammer).
5. Upgrade-stone advice (slots left, family).
6. Smithing EXP breakdown (once OQ2/OQ3 resolve).

## Save and Toolbox fields (summary)

- `characters[].skillsInfo.smithing`, `characters[].anvil.{anvilProduction, anvilStats, anvilSelected}`, `characters[].carryCapBags[Class=bCraft]`, `characters[].equippedBubbles`, `characters[].postOffice`, `characters[].flatTalents`, `characters[].stats.agility`, `characters[].equipment[]`, `characters[].tools[]`.
- `account.anvil[]`, `account.forge.{list, upgrades, oreCapacity}`, `account.armorSmithy`, `account.totalSkillsLevels.smithing`, `account.rift.currentRift`, `account.cards`, `account.stamps`, `account.gemShopPurchases[103,104]`, `account.upgradeVault.upgrades[24,26]`, `account.bribes`, `account.achievements[281]`.
- Raw save keys: `AnvilPA_<n>`, `AnvilPAstats_<n>`, `AnvilPAselect_<n>`, `AnvilCraftStatus`, `ForgeItemOrder`, `ForgeItemQty`, `ForgeLV`, `EquipmentMap` / `CMm` (stone data), `OLA[379..381]`.
- Account State: `characters[].afk.anvil`, `characters[].afk.anvilPlan`, `characters[].unspent.anvilPointsAvailable`, `account.anvilRecipes`, `account.armorSmithy`, `account.spend.anvilCoinPoints`, `gearItems`.

## Open questions

- OQ1: Where does the game store each recipe's Smithing level? `items.json lvReqToCraft` does not match the wiki. Use wiki/authored table; verify against N.js `ItemToCraftLV` if available.
- OQ2: Is there a stamp that contributes to the `SmithExp` term? None in current stamp data.
- OQ3: Does Forge EXP Gain actually feed Produce EXP? The wiki says yes; Toolbox `calcAnvilExp` does not read it.
- OQ4: Extra-bar oil barrels (Toxic Sludge, Magma, Plasma) are in the wiki but not in the vendored items data.
- OQ5: Monster-material point cap (wiki 700) versus Toolbox (no cap).
- OQ6: Exact Smithing level of Anvil Tab 5-7 gates; wiki-only.
- OQ7: Forge upgrade cost curves (base cost) are not in Toolbox, only `costMulti`.
- OQ8: What is the Godly Creation special bonus and where is it stored on the crafted item?
- OQ9: Does Brimstone really add +50% multi-bar chance (wiki/in-game text) or only x1.5 speed (Toolbox)?
- OQ10: Are there further +1 hammer sources beyond Infinity Hammer and Hammer Hammer, and is 3 the real cap?
- OQ11: Meaning of Acme Anvil x2=15 (per-10-levels points vs code multiplier).

## Sources

Tier 1 (code, game data), pin `6c37e3da`, game 2.3.540, verified 2026-10-19: `V:parsers/world-1/anvil.ts`, `V:parsers/world-1/forge.ts`, `V:parsers/world-3/armorSmithy.ts`, `V:parsers/misc.ts`, `V:parsers/character.ts`, `V:parsers/damage.ts`, `V:parsers/items.ts`, `V:parsers/parseMaps.ts`, `data:shared-data.json`, `data:crafts.json`, `data:items.json`, `data:talents.json`, `data:stamps.json`, `data:cards.json`, `data:cauldrons.json`, `data:gemShop.json`. Upstream: https://github.com/Morta1/IdleonToolbox.
Tier 2: https://idleon.wiki/wiki/Smithing , https://idleon.wiki/wiki/Forging , https://idleon.wiki/wiki/Set_Bonuses , https://idleon.wiki/wiki/Smithing/Anvil_Tab_1 (and Tabs 2-4), fetched 2026-10-19; the prior dossier records revisions of 2026-10-03 to 2026-10-07 (pre-dating v1.23 by about 10 days).
Tier 3: https://gameslikefinder.com/article/idleon-smithing-build-guide/ (2026-05-26), https://gameslikefinder.com/article/idleon-equipment-guide/ (2026-07-25), https://steamcommunity.com/app/1476970/discussions/0/3035977540368512302 (2021-08 to 09, **pre-patch**: before the Anvil Reset Whetstone), Reddit threads cited in `gear.facts.yaml`.
