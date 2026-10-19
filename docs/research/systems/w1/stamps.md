# Stamps: system dossier (M26)

Revision 2 (2026-10-19) corrected C55 (consumer list) and C56 (Exalted caveat) and added M22, C58-C63. Revised 2026-10-19 after two adversarial verdict sets (source, game data): no claim was refuted by either lens; one correction (C11) and one tier fix (C27) applied, five mechanics added (M16-M20). Every claim now carries a confidence (H/M/L) in the register. Verified 2026-10-19 against IdleOn Toolbox @ 6c37e3d (game 2.3.540). Paths below are relative to `packages/toolbox-parsers/` in the fix-digits checkout; `TS` = `vendor/parsers/world-1/stamps.ts`, `SD` = `vendor/data/website-data/shared-data.json`, `STD` = `vendor/data/website-data/stamps.json`. Every `[Cn]` is registered with source, tier (1 code/data, 2 Toolbox logic/dashboard, 3 wiki, 4 community) and date in the Claims register at the bottom. The earlier W1 dossier (`research/w1-systems`, Toolbox @ 6827d3f) was re-checked against the pinned data: all 128 cap steps and base material costs are unchanged [C1]. The per-stamp table (cap step, material, coin and material costs) is in `research/w1-systems:docs/research/systems/w1-systems/stamps-table.md`; this dossier does not repeat it.

## Stamps

- **What it is:** 128 stamps in three tabs (44 Combat, 57 Skills, 27 Misc), each an account-wide permanent bonus that grows with its level. Coins buy levels up to a per-stamp max level; materials raise that max level in fixed steps [C1][C3][C5][C8].
- **Unlocks:** Mr Pigibank in W1 town. The class level that opens him is disputed: the wiki says 12, the earlier N.js read says 14, and the wiki's own Mr Pigibank page says he costs 10 [C31]. Individual stamps come from town shops, NPC quest hand-ins, monster and resource drops, the Arcade, the W2 Trash Island trade, and later-world quests [C28][C29][C30]. The Gilded Stamp mechanic opens at code `Rift[0] >= 25`, which the game UI and wiki display as "Rift 26" (same event, 0- vs 1-based) [C11][C12][X1]. Exalting comes from the Windwalker Compass and event shop [C20].
- **Scope:** Levels, max levels and bonuses are account-wide [C3]. Three things are per-character: the skill-level falloff on skill-tied Skills stamps [C13][C14], Toilet Paper Postage (star talent) on "Eff" stamps [C17], and carry capacity, which decides whether a cap raise can be paid by the character doing it [C23].
- **Inputs → outputs:**
  - Level up: coins `baseCoin·(1−Insider Trading 8%)·max(1.05, powCoin − L/(L+5m)·0.25)^(L·10/m)·max(0.1, 1−vial%)` [C5][C6][C7].
  - Raise max level by m: material `baseMat·0.05(if gilded)/(1+Meritocracy%)·(1−Hydrogen%)/(1+Envelope sigil%)·powMat^(max(0,round(L/m)−1)^0.8)` then ×(1−vial%) with floors [C8][C9][C10][C11].
  - Output: the stamp's `stat` bonus through the growth curve, times modifiers [C4][C15]–[C19]. Output stats feed damage, HP, skill efficiency/EXP/carry, Alchemy, the Arcade, talent points, drop rate, card drop and more [C32].
- **Goals and Milestones:** total stamp levels drive the Gilded chance (1% per 100 total levels, daily) [C11]. Community tier thresholds are 50/100/150/200/250/300/400/500/600/700/800/1,000/2,500/4,000/5,500/7,500/9,200/11,000/13,000 total levels [C34][C35]; "10,000 total levels = a guaranteed daily Gilded Stamp" follows from the formula and is stated by a community guide [C37]. Also: stamp collected (level > 0) count [C26]; stamp-quest-based collection goals already ship in the KB [C41].
- **Feeds / fed by:**
  - Fed by: coins; cap-raise materials from W1-W3 skills and drops [C8]; Bribes (Insider Trading) [C6]; Alchemy vials and sigil [C7][C9]; Hydrogen atom (W3) [C10]; Gilded Stamps (Rift) [C11]; Meritocracy ballot [C9]; Certified Stamp Book lab node (W4) [C15]; Liqorice Rolle charm [C16]; Upgrade Vault 16 [C18]; Exalted multiplier sources [C19]; daily free levels [C21][C22].
  - Feeds: the carry stamps raise carry capacity, which loops back into cap raises [C32]; Atomic Stamp lowers atom costs [C32]; Droplots/Alch Go Brrr/Sigil Stamp/Kruker feed Alchemy [C32]; every combat and skill stat.
- **Per-session actions:** (1) spend coins on stamps below their cap; (2) for capped stamps check material in storage and best-carrier capacity [C23]; (3) with Hydrogen online, batch the raises in one session because any raise zeroes the discount [C10]; (4) if Gilded Stamps are banked, spend them on the costliest raise [C11]; (5) claim new stamp items and hand-ins [C28][C30]; (6) daily login nets free levels [C21]. A stamp at its cap with unaffordable or unfit materials is a Goal, not a spend.
- **AFK Setup implications:** put skilling characters on the skills whose products are the next cap-raise materials; fight-AFK funds coins [C8]. Stamps never "cap out" from AFK.
- **Min-max by stage:** see the section below.
- **Common mistakes:** too few stamps owned for the stage [C34]; coins idle below cap [C25]; raising one cap at a time and resetting Hydrogen [C10]; levelling a skill stamp far past the best character's skill [C13]; using a Gilded Stamp on a cheap raise [C11][C40]; trusting the "5%" Insider Trading text, which is 8 in data [C6]; ignoring that the carrier needs bag space [C23].
- **Save and Toolbox fields:** see the Mechanics catalogue and `Fields` table.
- **Sources:** Claims register below.

## Mechanics catalogue

Letters: L = current level, m = cap step (`reqItemMultiplicationLevel`), Lmax = current max level. Toolbox path `account.stamps.{combat|skills|misc}[i]` is built in `TS#L36-62` and re-evaluated by `updateStamps` into the fields marked (eval) [C3][C25].

### M1. Catalogue and tabs
128 stamps: 44 combat, 57 skills, 27 misc, each with `func` (add 90, decay 38), `x1`, `x2`, `reqItemMultiplicationLevel`, `baseMatCost`, `baseCoinCost`, `powCoinBase`, `powMatBase`, `skillIndex`, `stat`, `itemReq` [C1][C2]. Save: `StampLv[tab][i]` = level, `StampLvM[tab][i]` = max level; tab 0 combat, 1 skills, 2 misc [C3]. A stamp not owned has level 0; its cap is 0 until the first stamp item is used (the KB treats `maxLevel>0 || level>0` as owned) [C41].

### M2. Bonus curve
`add`: bonus = x1·L when x2=0 (every `add` stamp in the data has x2=0); `decay`: x1·L/(L+x2) (the "+{20×level÷(60+level)}%" stamps), so decay stamps asymptote to x1. Final per-stamp value = growth × `multiplier` (Certified Stamp Book) × Toilet Paper Postage × (1+Liqorice/100) × (1+Upgrade Vault/100) × exalted multi [C4][C15]–[C19].

### M3. Coin cost to buy a level (only while L < Lmax)
`floor( baseCoin·(1−Insider Trading) · max(1.05, powCoin − L/(L+5m)·0.25)^(L·10/m) · max(0.1, 1−vialStampMat%/100) )`. Insider Trading is `bribes[0]`, value 8, applied when `done` [C5][C6][C7]. Higher m means a slower exponent, so wide-step stamps are cheaper per level but need more materials per raise. Coins come from `account.currencies.rawMoney` (eval `goldCost`, `hasMoney`).

### M4. Max-level raise (material cost, only when L = Lmax)
Cost = `max(1, floor(floor(baseMat·g·merit·red·sig·powMat^(t^0.8))·vial))` with `t = max(0, round(L/m) − 1)`, `g` = 0.05 when a Gilded Stamp applies else 1, `merit = 1/(1+Meritocracy bonus 14 %)`, `red = max(0.1, 1−Hydrogen%)`, `sig = 1/(1+Envelope sigil %)`, `vial = max(0.1, 1−vial%)`. Above 2e9 the floors are skipped. Each raise adds m to Lmax (`Lmax += m`) [C8][C9][C10][C11]. Material cost is evaluated at the current level (tier = round(L/m) - 1), so the shown cost is that of the next raise from the current level [C44]. The Gilded 0.05 factor applies to materials only; coin cost (M3) is unchanged by Gilded [C11]. Example: Matty Bag Stamp (m=10, base 1 Cramped Material Pouch) needs 2/8/55 pouches at Lv 20/50/100, which is why the carry stamps are cheap to raise (derived from the formula, checked against the earlier table) [C42].

### M5. Required material and storage rules
Each stamp's `itemReq[0]` names the material. For gear materials (Steel Axe, Iron Hatchet, pouches) the stamp stores a flattened craft list and judges the cost by sub-materials; stackables are counted from `account.storage.list` (`ownedMats`), with a "green stack" (above 1e7) tracked separately [C24]. The cap raise is paid from one character's inventory, so that character's carry capacity for the item is a hard wall (`enoughPlayerStorage = bestCharacter.maxCapacity ≥ materialCost`, `bestCharacter` from `getHighestCapacityCharacter`) [C23].

### M6. Hydrogen, Stamp Decreaser (Atom Collider, W3)
Reduction % = min(90, atomLevel × 1 × days), where days = `accountOptions[134]` (days logged in since the last stamp max-level upgrade). Any raise resets it to 0. Exposed as `account.atoms.stampReducer` [C10]. Atomic Stamp (Misc, `Lower_Atom_Upgrade_Costs`) cheapens atom upgrades [C32].

### M7. Gilded Stamp (code gate `Rift[0] >= 25` = displayed "Rift 26", "Stamp Mastery")
Every 100 total stamp levels = 1% chance per login day of a banked Gilded Stamp; each gives −95% on the material cost of a stamp max-level upgrade (the code uses ×0.05 in `getMaterialCost` only; coin cost is not reduced) and stacks multiplicatively with the others [C11][C12]. Bank is `accountOptions[154]`; ActiveOn already reads it [C41]. Toolbox dashboard flags `gildedStamps` and `showGildedWhenNoAtomDiscount` [C40].

### M8. Cost reducers (summary)
| Reducer | Applies to | Value | Source |
|---|---|---|---|
| Insider Trading bribe | coins | −8% | [C6] |
| Blue Flav / Venison Malt vials (`MatCostStamp`) | coins and materials, floor −90% | decay(x1 30, x2 7) / add 2 per level | [C7] |
| Envelope Pile sigil | materials | ÷(1 + 12/25/40/65/75%) by tier | [C9] |
| Meritocracy bonus 14 (W2 ballot) | materials | ÷(1 + b%) | [C9] |
| Hydrogen atom | materials | up to −90% | [C10] |
| Gilded Stamp | materials, one raise | ×0.05 | [C11] |
| W6 Ninja upgrade "All material costs for upgrading Stamp Max LV are }x lower" | materials (unverified in parser) | n/a | [C22] |

### M9. Skill-level falloff (skill-tied Skills stamps)
Applies when `skillIndex > 0`, `m > 1` and Jade "Level_Exemption" is not unlocked. `sl = L·(200/(20m))`; if `sl > 3`: `lvlDiff = 3 + (sl−3)·(charSkill/(sl−3))^0.75`, scaled back by `20m/200`, `effective = min(floor(lvlDiff), sl, L)`. Example: Pickaxe Lv 100 on a character at Mining 50 acts as Lv 62 [C13][C14]. Skill index map (inferred from stamp names): 1 Mining, 2 Smithing, 3 Choppin, 4 Fishing, 5 Alchemy, 6 Catching, 7 Trapping, 8 Construction, 9 Worship [C14]. Affected: 31 stamps with `skillIndex>0`, only those with m>1 are reduced.

### M10. Bonus multipliers
- Certified Stamp Book (Lab node 7, W4): ×2 on Combat and Skills (`multiplier`), not Misc [C15].
- Liqorice Rolle (pristine charm, W6): `(1 + x/100)` on non-Misc [C16].
- Toilet Paper Postage (star talent): multiplies stamps whose `stat` contains "Eff" [C17].
- Upgrade Vault 16 "Stamp Bonanza": multiplies every stamp whose `stat` is BaseDmg/BaseHP/BaseAcc/BaseDef. That is 14 stamps, not just the 4 named in its description: Sword, Longsword, Scimitar, Avast Yar, Gilded Axe, Void Sword (Dmg); Heart, Vitality, Blackheart (HP); Target, Bullseye, Tripleshot (Acc); Shield, Buckler (Def) [C18][C43].
- Exalted (Windwalker Compass): see M11 [C19][C20].

### M11. Exalted stamps (W6 and later in practice)
Per exalted stamp: ×(1 + value/100), value = 100 + Aluminium atom + Jellypick charm + Compass + Emperor set + 20·eventShop(18) + Palette + Exotic market + Exalted fragments (Spelunking) + Legend talent + Sushi + Jelly/100. Applies to all tabs incl. Misc [C19]. Uses available = Compass bonus 44 + `accountOptions[366]` + event shop 18 − `compass.usedExaltedStamps`; flags in `account.compass.exaltedStamps[tab][i]` (parsed from "_12" / "a5" / "b3" strings) [C20].

### M12. Free levels (No Stamp Left Behind and relatives)
+5/day with bundle `bun_s`, +3/day with event shop bonus 1, plus Summoning winner bonus "+{ Stamp LV/day"; `getStampsPerDay` [C21]. W6 Ninja "Stamp Stack" gives +3 random stamp levels a day [C22].

### M13. Acquisition routes
Shop stock (Target, Shield, Mana; Vitality; Vendor; Matty Bag, Clover; Egg, Spice, Sigil; Refinery; Forge; Kruker), Trash Island trade (Skelefish, Amplestample, Golden Sixes, Stat Wallstreet), NPC quests (Hamish, Mutton, Wellington, Snouts, Fishpaste97, Tiki Chief, XxX Cattleprod XxX, Crystalswine, Pirate Porkchop, Papua Piggea, Capital P, Poigu, Oinkin, Hoov, Sussy Gene, Snootie, Bloo Radley), rare monster/resource drops (Stamp drop rate raised by Tracking Chips bribe, +15%), Arcade and level-up gifts [C28][C29][C30][C6]. 7 stamps are unobtainable [C27].

### M14. Totals
`calcStampLevels` = sum of all levels; `calcStampCollected` = count with level > 0 [C26]. These drive the Gilded chance and community tiers.

### M16. Evaluation order and lookups
`applyStampsMulti` (Certified Stamp Book, skips Misc) runs in `parsers/index.ts` before `updateStamps`, so the `multiplier` is set on each stamp before any bonus is evaluated; a consumer must not read bonuses before that step [C15][C45]. `getStampBonus` returns early on the skill-falloff branch before the Upgrade Vault multiplier is reached (harmless, since falloff stamps are skill stamps, but order matters if the branches are reused) [C13][C46]. Lookups come in two flavours: `getStampsBonusByEffect` matches by substring of the effect text, `getStampsBonusByStat` matches `stat` exactly (e.g. Multikill_Stamp has stat "Overkill" but effect "Base_Multikill_Rate"); 26 parser files call one or the other, so ActiveOn must pick the same one per consumer [C47].

### M17. Catalogue filtering
Stamps are built from `liveEntries(categoryCatalog)`, which drops retired or unlisted stamps, so the 128 count is the live catalogue and indexes keep their original catalogue index [C48].

### M18. Exalted dashboard alert
Toolbox's `exaltedStamps` tracker option (default on) alerts when the player has Compass exalted-stamp uses not yet applied to a stamp. ActiveOn can mirror this as a Now-screen item driven by uses available (M11) minus flagged stamps [C49].

### M19. Daily free level as a trackable action
The daily free stamp levels (M12) are claimed through the daily login and the Stamp Stack ninja upgrade applies +3 to a random stamp; both are once-a-day actions worth a Now item, with the count from `getStampsPerDay` [C21][C22][C50].

### M20. Coin affordability to cap
`getGoldCostToMaxLevel` sums `getGoldCost` for each level from current to current max, i.e. the total coins to fill the present cap. Compare with `rawMoney` to flag "coins now enough to cap this stamp" (Toolbox `affordableStampLevels` alert) [C40][C51].

### M21. Golden Apple Stamp as a bonus consumer (Golden Food multiplier)
Stamp StampC7 "Golden_Apple_Stamp" (Misc tab, stat `GFood`, `func` add, x1=1, x2=0, so +1% per level; effect text "+{% Effect from Golden Food. Sparkle sparkle!"); baseCoin 3000, powCoin 1.3, baseMat 2, powMat 4, m (reqItemMultiplicationLevel) 4; raise material is Golden Nomwich (FoodG4) [C53]. `getGoldenFoodMulti` reads it via `getStampsBonusByEffect(account, 'Effect_from_Golden_Food._Sparkle_sparkle!')` and adds it to the additive percent group (labelled "Stamp") alongside gear, obols, talent, achievements, bubble, sigil, meal, star sign, bribe, charm, vote, cards, companions, Vault 86 and Jelly; the group is scaled by the Shaman family factor and the Secret Set / Verminous companion factor [C54]. The multiplier then scales every golden food: `bonus = amount · multi · 0.05 · lavaLog(1+qty) · (1 + lavaLog(1+qty)/2.14)` per food, consumed by Golden Ham, Nigiri, Cake, Bread, Dumpling (character.ts), Nomwich, Butter Bar, Meat Pie (damage.ts), Golden Cheese (shrines.ts), plus Peanut, Ribs, Kebabs and Jam in multiplier form `1+bonus/100` [C55]; Beanstalk (Jade `Gold_Food_Beanstalk`) adds a second term [C55]. Because the stamp is a Misc stamp it takes no Certified Stamp Book (applyStampsMulti skips misc) and no Liqorice Rolle multiplier, but the Exalted multiplier still applies to it [C56][C19]. Full consumer list also includes Golden Peanut, Ribs, Kebabs and Jam (efficiency.ts, damage.ts, multiplier form), and world-7 button.ts reads the multi directly [C55]. The Beanstalk second term uses quantity 1000·10^rank, so rank breakpoints are 10k / 100k / 1M [C61]. Community ranks it A tier (Golden Apple 40 -> 60 -> 100 -> 112 across AutoReview tiers) [C37][C35]. Not in the stamp Combat/Skills falloff set (skillIndex 0). Gap: ActiveOn has no golden-food view, so this consumer is invisible to players [C57].

### M15. Future-cost planning (Toolbox)
`minReduction`: smallest Hydrogen % that brings the next raise inside best-carrier capacity (null if even 90% cannot) [C25]; `futureCosts`: next three raise tiers by reducer value [C25].

### W5+ extensions (one line each)
- Exalted Stamps and Pristine/Jelly/Sushi/Palette boosters are W5-W7 content [C19].
- Stamps with W5-W7 stats exist in the catalogue now: Sailboat, Gamejoy, Divine, Cavern Resource, Study Hall, Kruker, Corale, Spelunking trio (Amber, Little Rock, Hardhat), Crop Evo, Sneaky Peeky, Jade Mint, Summoner Stone, essences [C1][C32].
- Level_Exemption (Jade, W6) removes falloff [C14].

### Fields table
| Mechanic | Path |
|---|---|
| Levels / max levels | raw `StampLv`, `StampLvM` → `account.stamps.*[i].level/maxLevel` [C3] |
| Stamp rows incl. cost eval | `account.stamps.*[i].{goldCost,materialCost,hasMoney,hasMaterials,enoughPlayerStorage,bestCharacter,futureCosts,minReduction,ownedMats}` [C25] |
| Hydrogen discount | `account.atoms.stampReducer`; days in `accountOptions[134]` [C10] |
| Gilded bank | `accountOptions[154]` [C11] |
| Insider Trading | `account.bribes[0].done` [C6] |
| Exalted flags / uses | `account.compass.exaltedStamps`, `usedExaltedStamps`, `accountOptions[366]` [C20] |
| Free levels | `getStampsPerDay(account)` [C21] |
| Exalted alert / coin-to-cap | `getGoldCostToMaxLevel`, dashboard `exaltedStamps`, `affordableStampLevels` [C49][C51] |
| Falloff inputs | `characters[].skillsInfoArray[skillIndex].level`, jade `Level_Exemption` [C13] |
| Carry | `getHighestCapacityCharacter` [C23] |
| Golden Food consumer | `getGoldenFoodMulti` (misc.ts#L923-L1000) reads stamp stat `GFood`; `getGoldenFoodBonus(foodName, character, account, characters)` [C54][C55] |

## Min-max by stage

Priorities are community opinion unless marked; no source gives a single canonical order, so these merge four independent lists and disagree in places (see Open questions).

| Stage | Priority order | Basis |
|---|---|---|
| W1 early (class Lv 12/14-30) | Unlock Mr Pigibank, buy Insider Trading first (every coin cost -8%). Shop stamps: Mana, Target, Shield, then Vitality (EV) and Vendor. Hamish's Tomahawk and Choppin' Bag quests. AutoReview's 150-total tier: Mana, Tomahawk, Target, Shield, Vitality, Choppin' Bag, Vendor [C34][C6][C28]. Do not buy Clover or Kapow yet [C36] |
| W1 mid/late | Carry stamps: Lil' Mining Baggy (200 tier), Anvil Zoomer + Matty Bag (250 tier). Pickaxe and Hatchet to 35 (400 tier) with Fishing Rod and Catch Net [C34] |
| W2 (collect) | 700-total tier: Fist, Manamoar, Longsword, Battleaxe, Scimitar, Bullseye, Buckler; Twin Ores, Duplogs, Cool Diggy, Swag Swingy, Alch Go Brrr, Droplots, Bugsack, Hidey Box, Spikemouth, Purp Froge; Crystallin and Talent S. Drippy Drop 30 -> 40, Matty Bag 30 [C34]. Mason Jar (Cattleprod 2); Arcade stamps from the Arcade [C30] |
| W3 | 800 tier: Stample, Spice, Egg, Mason Jar (12), Sigil; Pickaxe/Hatchet 45 -> 55. 1,000 tier: Bag o Heads, Cooked Meal, Card (50), Drippy Drop 50. Hydrogen online: batch raises [C34][C10]. Skip the "not recommended" set: Saw, Agile, Book, Smart Dirt, High IQ Lumber, Fishhead, Polearm, Biblio [C36] |
| W3 late / W4 | 2,500 tier: Banked Pts, Nest Eggs, Ladle, Sailboat, Refinery; Matty Bag 100, Crystallin 60, Card 100, Pickaxe/Hatchet 65. 4,000 tier: Sashe Sidestamp, Gamejoy, Divine, Bugsack/Bag o Heads 80, Drippy Drop 85, Crystallin 100. Certified Stamp Book (Lab, x2) the highest single boost. Spend Gilded Stamps on the highest-material raise [C35][C15][C11] |
| W4 end (Rift[0] >= 25, displayed Rift 26+) | Gilded chance starts; 5,500 tier: Tripleshot, Maxo Slappo, Crop Evo, Buzz Buzz, Potion, Golden Apple (40), Mason Jar 52, Matty Bag 150, Card 150 [C35] |
| Tier lists (community 2026) | S: Crystallin, Multitool, Mason Jar. A: Golden Apple, Matty Bag, Card, Vendor, Kruker. B: Summoner Stone, Drippy Drop, Refinery, Golden Sixes. C: Cool Diggy, Swag Swingy, Gold Ball, Maxo Slappo, Stat Wallstreet, Lil' Mining Baggy, Choppin' Bag [C37] |
| Exalted priority (W6+) | T1: Crystallin, Kruker, Arcade Ball, Mason Jar, Matty Bag; T2: Multitool, Refinery, Golden Apple, Card, Vendor, Captalist, Golden Sixes, mining/choppin carry; T3: Divine, Summoner Stone, Drippy Drop, Atomic [C38] |
| Per class | Stamps are account-wide; classes differ only through skill falloff. Level each skill stamp toward the best character's skill level and do that skilling on that character [C13] |

## Disagreements and confidence

| Topic | View A | View B | Confidence |
|---|---|---|---|
| Pigibank unlock level | wiki: class level 12 (rev. 2026-10-05) [C31] | N.js read in the earlier dossier: 14 [C31] | L |
| Insider Trading | text says 5% [C6] | data/code value is 8 [C6] | H for 8 |
| Where the Trash Island stamps come from | earlier dossier: "W5 Island Expedition" | itemSources key `trashIsland`, Toolbox parser under world-2 [C29] | M for W2 trade |
| Unobtainable list | Toolbox list has typo and omits Splosion [C27] | wiki lists 7 [C27] | H for wiki's 7 |
| Mason Jar rank | S-tier [C37] | AutoReview waits until the 800 tier and targets 12 early [C34] | M |
| Clover/Kapow/Hermes/Talent III | AutoReview: not recommended early [C36] | none contradicts | M |

## Claims register

Date verified for all: 2026-10-19. "Patch" is game 2.3.540 where code or data; community dates as stated.

| ID | Claim | Source | Tier |
|---|---|---|---|
| C1 | 128 stamps: 44 combat, 57 skills, 27 misc; earlier-dossier per-stamp cap step and base material cost match the pinned data for all 128 (checked by script) | packages/toolbox-parsers/vendor/data/website-data/stamps.json | 1 |
| C2 | Each stamp record has func (add 90, decay 38; every add stamp has x2=0), x1, x2, reqItemMultiplicationLevel, baseMatCost, baseCoinCost, powCoinBase, powMatBase, skillIndex, stat, itemReq | packages/toolbox-parsers/vendor/data/website-data/stamps.json | 1 |
| C3 | Save: StampLv and StampLvM, indexed [tab][i], tab 0 combat, 1 skills, 2 misc; unparsed values default to 0 | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L27-L44 | 1 |
| C4 | Bonus = growth(func,level,x1,x2); add: x1*level, decay: x1*level/(level+x2); then multiplied by modifiers | packages/toolbox-parsers/vendor/utility/wiki/growth.mjs; packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L395-L400 | 1 |
| C5 | Coin cost of next level: floor(baseCoin*(1-bribe%)*max(1.05, powCoin - L/(L+5m)*0.25)^(L*10/m)*max(0.1,1-vial%/100)) | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L231-L258 | 1 |
| C6 | Insider Trading bribe (bribes[0], value 8, applied when done) cuts coin cost; its text says 5% but the data value is 8; Tracking Chips bribe gives +15% stamp drops | packages/toolbox-parsers/vendor/data/website-data/shared-data.json bribes; packages/toolbox-parsers/vendor/parsers/world-1/bribes.ts#L30; packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L238-L243 | 1 |
| C7 | Vials BLUE_FLAV (decay x1 30 x2 7) and VENISON_MALT (add 2) have stat MatCostStamp; it reduces both coin and material cost, floored at -90% | packages/toolbox-parsers/vendor/data/website-data/vials.json; packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L235,#L280,#L285 | 1 |
| C8 | Max-level raise material cost: max(1, floor(floor(baseMat*(0.05 if gilded)*meritocracy*(1-reducer)*sigil*powMat^(max(0,round(L/m)-1)^0.8))*vial)); floors skipped above 2e9; each raise adds m to the cap | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L279-L296 | 1 |
| C9 | Envelope Pile sigil divides material cost by 1+12/25/40/65/75% (unlock/boost/jade-ionized/ethereal/eclectic); Meritocracy bonus 14 divides it by 1+bonus% | packages/toolbox-parsers/vendor/data/website-data/shared-data.json sigils ENVELOPE_PILE; packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L281-L284 | 1 |
| C10 | Hydrogen atom: reduction = min(90, level*1*days), days=accountOptions[134], reset to 0 by any stamp max-level upgrade; exposed as account.atoms.stampReducer | packages/toolbox-parsers/vendor/parsers/world-3/atomCollider.ts#L35-L42,#L113; packages/toolbox-parsers/vendor/data/website-data/shared-data.json atomsInfo[0] | 1 |
| C11 | Gilded Stamp: every 100 total stamp levels gives a 1% chance per login day of a stackable Gilded Stamp, -95% stamp max-level upgrade MATERIAL cost (code: x0.05 in getMaterialCost only; coin cost not reduced, per game-data verifier); bank in accountOptions[154] | packages/toolbox-parsers/vendor/data/website-data/shared-data.json riftInfo (Stamp_Mastery); packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L288; packages/account-state/src/spend.ts#L44 | 1 |
| C12 | Gilded Stamp starts on reaching displayed Rift 26 (= code `Rift[0] >= 25`, N.js `gildedStampChance` `25>Rift[0]?0:GenINFO[106]/1e4` @10781884; gate verified 2026-10-19, not 'after completing' 26); earlier N.js read also puts the chance at GenINFO[106]/1e4 (not re-verified in this pass) | https://idleon.wiki/wiki/Stamps (2026-10-19 fetch); research/w1-systems:docs/research/systems/w1-systems/stamps.md | 3 |
| C13 | Skill falloff: if skillIndex>0, m>1 and no Level_Exemption: sl=L*(200/(20m)); if sl>3, lvlDiff=3+(sl-3)*(charSkill/(sl-3))^0.75, scaled by 20m/200, effective=min(floor,sl,L); Pickaxe Lv100 at Mining 50 acts as Lv62 (recomputed) | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L372-L389 | 1 |
| C14 | Jade bonus Level_Exemption removes the falloff; 31 stamps have skillIndex>0 (1 Mining, 2 Smithing, 3 Choppin, 4 Fishing, 5 Alchemy, 6 Catching, 7 Trapping, 8 Construction, 9 Worship inferred from stamp names) | packages/toolbox-parsers/vendor/data/website-data/shared-data.json jadeUpgrades; packages/toolbox-parsers/vendor/data/website-data/stamps.json; packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L367 | 1 |
| C15 | Certified Stamp Book (Lab bonus 7) doubles Combat and Skills stamps, not Misc | packages/toolbox-parsers/vendor/parsers/index.ts#L234-L235; packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L403-L411; packages/toolbox-parsers/vendor/data/website-data/shared-data.json labBonuses | 1 |
| C16 | Liqorice Rolle pristine charm multiplies non-Misc stamps by 1+charm/100 | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L363-L365; packages/toolbox-parsers/vendor/data/website-data/shared-data.json pristineCharms[17] | 1 |
| C17 | Toilet Paper Postage star talent multiplies stamps whose stat contains 'Eff' | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L360-L362 | 1 |
| C18 | Upgrade Vault 16 (Stamp Bonanza) multiplies BaseDmg/BaseHP/BaseAcc/BaseDef stamps | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L391-L394; packages/toolbox-parsers/vendor/data/website-data/shared-data.json upgradeVault | 1 |
| C19 | Exalted multiplier = 1+(100+Aluminium atom+Jellypick+Compass 76+Emperor set+20*event shop 18+Palette 23+Exotic 49+Exalted fragments+Legend talent 36+Sushi 17+Jelly 50/100)/100, applies to every tab | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L318-L352,#L366-L369 | 1 |
| C20 | Exalted uses available = Compass 44 + accountOptions[366] + event shop 18 - used; flags parsed from compass raw strings into account.compass.exaltedStamps[tab][i] | packages/toolbox-parsers/vendor/parsers/class-specific/compass.ts#L199-L222,#L407-L413 | 1 |
| C21 | Free stamp levels per day: +5 with bundle bun_s, +3 with event shop bonus 1, plus Summoning winner bonus '+{ Stamp LV/day' | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L64-L82 | 1 |
| C22 | W6 Ninja upgrades: 'Stamp Stack' gives +3 LV/day to a random stamp; another upgrade makes all stamp max-level material costs }x lower (not applied by the Toolbox stamp parser) | packages/toolbox-parsers/vendor/data/website-data/shared-data.json ninjaExtraInfo | 1 |
| C23 | Cap-raise material is judged against the best-capacity character's carry (enoughPlayerStorage = maxCapacity>=materialCost); the earlier N.js read says it is removed from the inventory of the character doing the raise | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L87,#L102; packages/toolbox-parsers/vendor/parsers/misc.ts#L1134-L1152 | 1 |
| C24 | Gear-material stamps are judged by flattened craft sub-materials; stackables use storage amount; 1e7 'green stack' tracked separately | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L46-L58,#L135-L143 | 1 |
| C25 | minReduction solves the smallest Hydrogen % that fits best-carrier capacity (null if 90% is not enough); futureCosts projects the next three raise tiers | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L151-L221 | 1 |
| C26 | calcStampLevels sums all levels; calcStampCollected counts level>0 | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L413-L423 | 1 |
| C27 | Toolbox unobtainable list (7 items) has a typo 'Stat_Wallstree_Stamp' so it matches nothing and omits Splosion (tier 1); the wiki lists seven unobtainable stamps: Splosion, Shiny Crab, Gear, SpoOoky, Prayday, Talent I, Talent V (tier 3, not re-fetched this pass) | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L425-L426 (tier 1); https://idleon.wiki/wiki/Stamps (tier 3) | 1 / 3 |
| C28 | Town shops sell stamps: Target/Shield/Mana (shop 0), Vitality (1), Vendor (2), Matty Bag/Clover (3), Egg/Spice/Sigil (5), Refinery (6), Forge (7), Kruker (8) | packages/toolbox-parsers/vendor/data/website-data/shared-data.json shops | 1 |
| C29 | itemSources key trashIsland (W2 islands) lists StampB47 Skelefish, StampB32 Amplestample, StampA38 Golden Sixes, StampA39 Stat Wallstreet; wiki calls it 'Island Expedition'; the earlier dossier placed it in W5 | packages/toolbox-parsers/vendor/data/website-data/shared-data.json itemSources; packages/toolbox-parsers/vendor/data/website-data/stamps.json; packages/toolbox-parsers/vendor/parsers/world-2/islands.ts | 1 |
| C30 | Quest and drop sources per stamp (Hamish, Mutton, Wellington, Snouts, XxX Cattleprod XxX, Fishpaste97, Tiki Chief, etc.; crystal-mob and monster drops; Arcade; level-up gifts) are listed in the wiki bot tables | https://idleon.wiki/wiki/Stamps (rev. 2026-10-05); research/w1-systems:docs/research/systems/w1-systems/stamps-table.md | 3 |
| C31 | Mr Pigibank class-level unlock: wiki says 12; the earlier N.js read says 14; wiki Mr Pigibank page says he costs 10 | https://idleon.wiki/wiki/Stamps; https://idleon.wiki/wiki/Mr_Pigibank; research/w1-systems:docs/research/systems/w1-systems/stamps.md | 3 |
| C32 | Stamp stats feed other systems: Atomic Stamp lowers atom upgrade costs, Droplots liquid cap, Alch Go Brrr alchemy speed, Sigil Stamp sigil charge, Kruker daily Kattlekruk bubble levels, Biblio library refresh, Golden Apple golden food, Matty Bag/Mason Jar carry capacity | packages/toolbox-parsers/vendor/parsers/world-3/atomCollider.ts#L68; vendor/parsers/world-2/alchemy.ts#L183,#L715,#L897,#L1177; vendor/parsers/misc.ts#L388,#L692-L704,#L930 | 1 |
| C33 | Misc stamps get no Certified Stamp Book or Liqorice Rolle multiplier but can be exalted | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L363-L369,#L403-L411 | 1 |
| C34 | AutoReview tiers 0-12 (total levels 0/50/100/150/200/250/300/400/500/600/700/800/1000): T3 Mana, Tomahawk, Target, Shield, Vitality, Choppin' Bag, Vendor; T4 Lil' Mining Baggy; T5 Anvil Zoomer, Matty Bag; T7 Fishing Rod, Catch Net, Pickaxe/Hatchet 35; T8 Drippy Drop 30; T10 seven combat, ten skill, Crystallin, Talent S; T11 Stample, Spice, Egg, Mason Jar, Sigil, Pickaxe/Hatchet 45; T12 Bag o Heads, Cooked Meal, Card 50, Drippy Drop 50, Pickaxe/Hatchet 55 | https://github.com/TwoSpookyBoos/IdleOnAutoReviewBot/blob/05ac4496c335644dedd68e0be65ac893971efc73/mysite/consts/progression_tiers.py#L558-L650 (2026-09-23 pin) | 4 |
| C35 | AutoReview tiers 13-20 (2500/4000/5500/7500/9200/11000/13000): e.g. Matty Bag 100->150->200->280->320->380, Crystallin 60->100->150->250->260->270, Card 100->150->200, Pickaxe/Hatchet 65->75->85->95->105 then 255/295, Mason Jar 52->80->88->92->96, Drippy Drop 85->100->110->155, Golden Apple 40->60->100->112, Multitool 100->210 | https://github.com/TwoSpookyBoos/IdleOnAutoReviewBot/blob/05ac4496c335644dedd68e0be65ac893971efc73/mysite/consts/progression_tiers.py#L650-L700 (2026-09-23 pin) | 4 |
| C36 | AutoReview 'not recommended' lists: Clover and Kapow early; Hermes and Talent III; Saw, Agile, Book, Smart Dirt, High IQ Lumber, Fishhead, Polearm, Biblio at T12; Stat Graph, Brainstew, Arcane, Fly Intel, Holy Mackerel, Talent II, Gilded Axe, Avast Yar, Blackheart, Lab Tube, DNA at T13; its T12 list has a missing comma that merges 'Skelefish Stamp' and 'Cooked Meal Stamp' into one string (bug) | https://github.com/TwoSpookyBoos/IdleOnAutoReviewBot/blob/05ac4496c335644dedd68e0be65ac893971efc73/mysite/consts/progression_tiers.py#L570-L620 | 4 |
| C37 | Community tier list (2026-05-26): S Crystallin, Multitool, Mason Jar; A Golden Apple, Matty Bag, Card, Vendor, Kruker; B Summoner Stone, Drippy Drop, Refinery, Golden Sixes; advice to always upgrade stamps and aim for 10,000 total levels for a guaranteed daily Gilded Stamp | https://gameslikefinder.com/article/idleon-best-stamps/ | 4 |
| C38 | Exalted stamp priority (2026-10-06): T1 Crystallin, Kruker, Arcade Ball, Mason Jar, Matty Bag; T2 Multitool, Refinery, Golden Apple, Card, Vendor, Captalist Stats, Golden Sixes, mining/choppin carry; T3 Divine, Summoner Stone, Drippy Drop, Atomic | https://www.digitaltq.com/wiki/idleon/exalted-stamps-priority-guide | 4 |
| C39 | r/idleon (2026-05-01): the purpose of Matty Bag is to help level your other stamps | https://www.reddit.com/r/idleon/comments/1t0r1fy/ (via earlier dossier) | 4 |
| C40 | Toolbox dashboard: affordableStampLevels alert (coins), gildedStamps and showGildedWhenNoAtomDiscount options | packages/toolbox-parsers/vendor/utility/dashboard/baseTrackers.js#L97-L100 | 2 |
| C41 | ActiveOn today: KB stamps.yaml has acquisition checks (shop, hand-in, held, quest-toward, 9 timed quests), stamps.priority.acquire, stamps.goal.cap-material and material contributions; Spend Plan reads stamp raises (atDiscount/atZero/gilded); Stamps page exists; only sprite is generic item-stamp | packages/knowledge/systems/stamps.yaml; packages/account-state/src/spend.ts#L121-L175; apps/activeon/src/art/sprites/grids/items.ts#L368; apps/activeon/src/systems/pages.ts#L43 | 2 |
| C42 | Cap step is a trade-off; Matty Bag Lv 20/50/100 raise needs 2/8/55 Cramped Material Pouches and a Gilded + Hydrogen 90% raise costs 0.05*0.1 = 0.5% of base (derived) | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L279-L296 with packages/toolbox-parsers/vendor/data/website-data/stamps.json | 1 |

## Open questions

1. Exact Mr Pigibank class-level gate (12 vs 14); needs the game data or a fresh-account check.
2. Does the Ninja "All material costs for upgrading Stamp Max LV are }x lower" bonus apply in-game? Toolbox's stamp parser does not read it, so ActiveOn's raise price would be off for W6 players.
3. Gate re-verified 2026-10-19 in N.js (`25 > Rift[0] ? 0 : GenINFO[106]/1e4`, daily roll `randomFloat() < chance` -> OLA[154]++ @15091541); the GenINFO[106] term itself is still unread. Rift 25 (code) vs 26 (wiki) is a numbering difference, see rift.md resolution note.
4. Is the material removed from the raising character only, or from any? Toolbox checks storage plus best-carrier capacity.
5. Is the Trash Island stamp route reachable in W2, or gated later (earlier dossier said W5)?
6. No community source gives one canonical per-stage order; the four lists conflict on Mason Jar timing.
7. Sprites: ActiveOn only has the generic `item-stamp`. Per-category stamp art (Combat, Skills, Misc, Gilded, Exalted) should be added to `apps/activeon/src/art/sprites/grids/items.ts` or `systems.ts` when the Stamps view is expanded.

## Additional claims (revision)

| ID | Claim | Source | Tier |
|---|---|---|---|
| C43 | Stamp Bonanza (Upgrade Vault 16) applies by stat to 14 stamps: Sword, Longsword, Scimitar, Avast Yar, Gilded Axe, Void Sword, Heart, Vitality, Blackheart, Target, Bullseye, Tripleshot, Shield, Buckler (counted from stamps.json) | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L391-L394; packages/toolbox-parsers/vendor/data/website-data/stamps.json | 1 |
| C44 | Material cost uses the current level: t = max(0, round(L/m)-1), so it is the cost of the next raise | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L279-L296 | 1 |
| C45 | applyStampsMulti (Certified Stamp Book) is applied in index.ts before updateStamps; skips Misc | packages/toolbox-parsers/vendor/parsers/index.ts#L234-L235; stamps.ts#L403-L411 | 1 |
| C46 | getStampBonus skill-falloff branch returns before the Upgrade Vault multiplier | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L366-L400 | 1 |
| C47 | getStampsBonusByEffect matches by substring of effect; getStampsBonusByStat matches stat exactly; Multikill vs Overkill; 26 parser files use one of them | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L298-L316 | 1 |
| C48 | Stamps are built from liveEntries(catalog), filtering retired/unlisted stamps | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L40 | 1 |
| C49 | Dashboard option exaltedStamps alerts on unapplied compass exalted stamps | packages/toolbox-parsers/vendor/utility/dashboard/baseTrackers.js#L113-L117 | 2 |
| C50 | Daily free level actions: bundle/event/winner bonus count plus Stamp Stack random level (once per day) | stamps.ts#L64-L82; shared-data.json ninjaExtraInfo | 1 |
| C51 | getGoldCostToMaxLevel sums getGoldCost from level to maxLevel | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L261-L268 | 1 |
| C52 | Stamps feed other parsers: arcade ball claim time/recharge, class XP, all skill XP, drop rate, damage/accuracy/HP/MP/defence/crit, efficiency stats, movement speed, building speed, boost food, 3D printer sampling (game-data verifier list; spot-checked via the 26 parser files calling the stamp lookups) | packages/toolbox-parsers/vendor/parsers/** (grep getStampsBonusBy*) | 1 |
| C53 | Golden_Apple_Stamp (StampC7): Misc tab, stat GFood, add x1=1 x2=0, baseCoin 3000, powCoin 1.3, baseMat 2, powMat 4, reqItemMultiplicationLevel 4, itemReq Golden_Nomwich (FoodG4) | packages/toolbox-parsers/vendor/data/website-data/stamps.json#L2530-L2551 | 1 |
| C54 | getGoldenFoodMulti reads the stamp by effect 'Effect_from_Golden_Food._Sparkle_sparkle!' and adds it to the additive percent group (breakdown label 'Stamp') | packages/toolbox-parsers/vendor/parsers/misc.ts#L930,#L964-L968,#L982 | 1 |
| C55 | Golden food bonuses (amount·multi·0.05·lavaLog(1+qty)·(1+lavaLog(1+qty)/2.14)) are consumed by Golden Ham/Nigiri/Cake/Bread/Dumpling, Nomwich, Butter Bar, Meat Pie and Cheese (shrines), plus Golden_Peanut and Golden_Ribs (efficiency.ts#L273,#L471), Golden_Kebabs and Golden_Jam (damage.ts#L756,#L1098) via getGoldenFoodMultiplier, and world-7/button.ts#L364 reads the multi directly; Jade Gold_Food_Beanstalk adds a second term (qty 1e3*10^rank) | packages/toolbox-parsers/vendor/parsers/misc.ts#L1047-L1076; character.ts#L1660,#L2118,#L2415,#L2807,#L3278; damage.ts#L899,#L999,#L1392; world-3/shrines.ts#L80 | 1 |
| C56 | Misc stamps are skipped by applyStampsMulti (Certified Stamp Book), so the Golden Apple level value is not doubled by it. Caveat (both lenses): getStampBonus still applies the Exalted multiplier to misc stamps and skips only the Liqorice charm (stamps.ts#L363); the Book multiplier exclusion is an inference for this stamp | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L403-L411 | 1 |
| C57 | Existing C32 listed Golden Apple only in passing; no ActiveOn golden-food view or detector reads this consumer (grep of knowledge/systems/stamps.yaml showed no golden entry; grep-verified absence in knowledge/systems, detectors, engine, app src; engine golden.ts is only a test harness) | packages/knowledge/systems/stamps.yaml (2026-10-19 grep) | 1 |

## Missed mechanics added (revision 2, verifier lists)

### M22. Stamp value modifiers in getStampBonus (stamps.ts#L355-L401)
- Exalted multiplier applies to EVERY stamp tab including Misc (so also Golden Apple) [C58].
- Liqorice Rolle charm applies only to non-Misc stamps [C58].
- Jade bonus `Level_Exemption` removes the skill-level reduction (the falloff for stamps with skillIndex > 0 that uses the character's skill level) [C59].
- Toilet Paper Postage star talent multiplies stamps whose stat contains "Eff" (character-dependent) [C60].
- Upgrade Vault bonus 16 multiplies only stamps with stat BaseDmg, BaseHP, BaseAcc, BaseDef [C62].
- Golden Food Beanstalk (Jade) rank breakpoints 10k/100k/1M effective food quantity [C61].
- Lookups: `getStampsBonusByEffect` matches by substring of the effect text; `getStampsBonusByStat` matches the stat exactly (the in-game StampBonusOfTypeX uses the stat column) [C63].

## Additional claims (revision 2)

| ID | Claim | Source | Tier |
|---|---|---|---|
| C58 | getStampBonus: exaltedBonus applies for every tree (isStampExalted flag), charmBonus (Liqorice) only when tree != misc | packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L360-L369 | 1 |
| C59 | Level_Exemption jade bonus sets removeLevelReduction, skipping the skill-level falloff branch | stamps.ts#L367,#L372 | 1 |
| C60 | Toilet Paper Postage talent multiplies stamps whose stat includes 'Eff' | stamps.ts#L359-L362 | 1 |
| C61 | Beanstalk adds foodBonus at quantity 1e3*10^rank (ranks 1-3 = 10k/100k/1M) | packages/toolbox-parsers/vendor/parsers/misc.ts#L1046-L1072 | 1 |
| C62 | Upgrade Vault 16 multiplies BaseDmg/BaseHP/BaseAcc/BaseDef stamps only | stamps.ts#L391-L394 | 1 |
| C63 | getStampsBonusByEffect substring-matches effect; getStampsBonusByStat exact-matches stat | stamps.ts#L296-L316 | 1 |

All H (code read directly; both lenses listed the mechanics except C60-C62 listed by the source lens only, still read in code here).

## Confidence per claim

H (code or data read directly, matched by both verifiers): C1, C2, C4, C5, C6, C7, C8, C10, C11, C13, C15-C19, C21, C26, C29, C33, C40, C42-C51, C53-C55, C58-C63. M (consistent with code structure, not re-run in detail, or mixed tier): C3, C9, C14 (count of 31 and skill-index map inferred), C20, C22 (parser omission unchecked), C23 (consumption side unverified), C24, C25, C27, C28, C32, C41, C52, C56, C57. L (external or unverifiable here): C12, C30, C31, C34-C39. Disputed claims: none after revision 2 (C53-C57 not refuted by either lens; C55 consumer list and C56 caveat corrected); C11 carries a scope correction, C27 a tier fix.
