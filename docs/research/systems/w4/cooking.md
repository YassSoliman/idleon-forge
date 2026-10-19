# Cooking (World 4)

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540, vendored). Tiers: 1 game data / Toolbox code, 2 wiki, 3 Toolbox logic/dashboard, 4 community. `T` = `packages/toolbox-parsers/vendor/parsers/world-4/cooking.ts`; `D` = `packages/toolbox-parsers/vendor/data/website-data/`. Claims are numbered [C#] and registered with Source and tier in the Claim register at the end. Confidence H/M/L where sources disagree or I inferred.

Method note: the formulas were re-read in the vendored Toolbox code (not copied from the earlier research). The game-client facts that are not in Toolbox (kitchen coin prices, recipe-discovery odds, ladle income) come from the earlier N.js reading (`research/w4-systems`, N.js Last-Modified 2026-10-17, v1.23), re-labelled tier 1 with that provenance. Web search budget was exhausted this session, so wiki/community coverage is limited to pages that could be fetched (Cooking, Cooking Ladle, the shnaps gist); the Google Sheet and Reddit could not be fetched, so those lines are carried over from the earlier research and marked.

## Cooking

- **What it is:** a W4 skill and account system. Up to 10 kitchens passively cook **meals**; copies of a meal are spent on the Dinner Menu to level that meal, and every meal level is a permanent, account-wide bonus [C1]. Kitchens are upgraded with **spices** (from Breeding territories) and fast-forwarded with **ladles** [C27][C25]. Later layers: Ribbons and Cooking Mastery (W7-era Rift) [C42][C46].
- **Unlocks:**
  - Access: reach the W4 town. Kitchen 1 is already `status 1` in every save, even W2/W3 accounts [C22].
  - First spice: Gobo's tutorial line (breed Green Mushroom, win Grasslands battle, claim spice, finish a recipe, upload to the Lab); it also pays 19 ladles (4+4, 5, 6 across Gobo3-5) [C29].
  - More kitchens: coins only, 8.2M, 75M, 400M, 8B, 50B, 2.13T, 60T, 2Q, 1e17 for kitchens 2-10 [C21].
  - New meals: discovered in a kitchen with spices; the gem shop sells NEW_MEAL as a fallback [C56].
  - Cooking Mastery: W4 Rift reward 61 (null until unlocked) [C42]. Ribbons: Death Bringer Grimoire upgrade 5, Death Bringer / Boaring bundles, or Event Shop 13 [C47].
- **Scope:** account-wide: kitchens, meals, spices, mastery, ribbons. Per-character: Cooking level/EXP/efficiency (ladle income), which character AFKs in the Kitchen, Blood Berserker talents, and (read from the logged-in character) star sign and Farming level that feed kitchen speed [C30][C31][C40][C41]. Voidwalker's Blood Marrow uses the logged-in or highest character [C32].
- **Inputs -> outputs:** time (kitchens run offline), spices, coins, ladles, AFK time in the Kitchen -> meal copies, recipe discoveries, kitchen levels, Cooking EXP, ladles. Meal copies are also costs of Lab chips/jewels and Breeding Mob upgrades [C52]; spices are also costs of three Alchemy bubbles and every chip/jewel [C67][C52].
- **Goals and Milestones:**

| Goal | Milestones | Why it steps up | Src |
|---|---|---|---|
| Kitchens owned | 2 (8.2M) -> 3 (75M) -> 4 (400M) -> 5 (8B) -> 8 (60T) -> 10 | each is a full extra production line; 5 and 8 on one meal unlock Cabbage Patch / Le Pretzel Bleu | [C21][C34] |
| Meals discovered | every meal reachable with owned spices (74 exist) | Lv 1 is the cheapest bonus; meals gate chips/jewels | [C3][C52] |
| Meals at Lv 11 | count at 11+ | Diamond Chef multiplier counts each | [C19] |
| Meals at Lv 30 | count at 30 | Fluoride atom counts each; Lv 30 is the W4 cap | [C20][C14] |
| Kitchen levels (sum, all three stats) | 25 steps (Emerald Pyramite), 100 steps (Overwhelmed Golden Egg), 10 per kitchen (Cabbage), Lv 300 any stat (achievement) | direct multipliers / achievement crown | [C33][C36][C54][C55] |
| Max meal level | 30 -> +10 Jade x2, +up to 60 Causticolumn, +20 Grimoire, +30 Lore Boss 6, +10 Menagerie = 170 | opens new levels on every meal | [C14] |
| Mastery level | rank thresholds 0/1/5/10/25/100 unlock the six categories | each category is a multiplier | [C43] |

- **Feeds / fed by:**
  - Cooking -> damage (Turkey of Thank, Octoplop, Onion, Massive Fig, Plumpcakes), accuracy/crit/defence meals, Lab (EXP and line width), Breeding (new-mob odds, breeding EXP, egg time, Mob damage), skilling efficiency, Library/VIP points, Tower Defence, liquid caps, Divinity/Gaming/Sailing/Farming/Sneaking/Summoning/Spelunking/Research/Polymer/Mine currency (indices 47-73) [C3]; Tome ("Total Kitchen Upgrade LV", total meal levels) [C53]; Breeding ("Overwhelmed Golden Egg") [C54].
  - Fed by Breeding (all spices, Trasher gene, arena wave 35, Shiny "bonuses from all meals"), Lab (jewels), Alchemy (Diamond Chef, vials, Garlic Glove sigil), Stamps, Atom Collider, Cards/achievements/star sign, Classes (Blood Berserker, Voidwalker, Death Bringer), Gem shop (Richelin), Equinox (Food Lust), and W5-W7 systems (Sailing, Gaming, Sneaking, Farming, Summoning, Caverns, Menagerie, Rift) [C5][C11][C35][C36][C38][C39].
- **Per-session actions:** (1) level every meal whose stock covers its next level; (2) claim spices up to the daily cap and spend them on kitchen upgrades; (3) make sure no kitchen is idle (`status 1`) or parked on a long recipe (`status 3` adds no meal speed); (4) re-point kitchens off meals that hit the max level; (5) spend ladles near level-ups or finishing recipes; (6) with No Meal Left Behind, expect the lowest meal to gain free levels at daily reset. Idle/capped states: all meals at cap with nothing to discover, upgrades unaffordable because a territory spice is missing, claims exhausted [C7][C13][C26][C48].
- **AFK Setup implications:** one character AFKs on the Kitchen target for Cooking EXP and ladles (best fit Blood Berserker with Overflowing Ladle / Waiting To Cool, Ladle stamp, Chefs Essentials PO box) [C28][C31]. That character is not available for Lab tubes or kill goals. Kitchens need only a sensible meal assignment before leaving; put the longest-cookReq meals on the most-upgraded kitchens (M).
- **Common mistakes and detection:** see "Common mistakes" below.
- **Save and Toolbox fields:** see "Mechanics catalogue" (each row names the exact path) and "Save and Toolbox fields".

## Mechanics catalogue

Every row: mechanic, rule/formula, caps, unlock, cost, field. "W5+" extensions noted in one line each at the end of the table.

### A. Kitchens

| # | Mechanic | Rule / formula | Cap | Unlock / cost | Field |
|---|---|---|---|---|---|
| A1 | Kitchen table | 10 kitchens; `Cooking[k]=[status, mealIdx, spice1..4(-1 empty), speedLv, fireLv, luckLv, ?, progress]`; status 0 not owned, 1 idle, 2 cooking, 3 researching a recipe [C4] | 10 | kitchen 1 free; 2-10 coins 8.2M, 75M, 400M, 8B, 50B, 2.13T, 60T, 2Q, 1e17 [C21] | raw `Cooking`; `account.cooking.kitchens[]` (status>0 only) |
| A2 | Meal speed | `10 x prod(32 multiplicative factors in Toolbox; earlier text said ~35)`; progress per hour per kitchen; copies/h = speed / cookReq [C5] | none | n/a | `kitchens[].mealSpeed`, `.mealSpeedBreakdown` |
| A3 | Speed upgrade | multiplier `1 + speedLv/10` (Lv 10 = 2x, Lv 20 = 3x) [C6] | none found in Toolbox (achievement for Lv 300) [C55] | spice cost, A7 | raw `Cooking[k][6]`; `kitchens[].speedLv` |
| A4 | Fire (recipe) speed (**Disputed**, conf H on correction) | Earlier text: `5 x fire level ...`. Game-data lens: fire level term is `(1+fireLv/10)`, not `x fireLv`; also carries Vote bonus 13 and MSA_Mealing superbit. Correct: `5 x (1+Richelin?1:0) x (1+vote/100) x DiamondChef^meals(Lv11+) x VoidPlateChef x (1+superbit/100) x (1+fireLv/10) x (1+recipeVials/100) x (1+recipeStamps/100) x (1+recipeMeals(Rcook)/100) x (1+min(6*troll,50)/100) x (1+kitchenEffMulti/100)` [C8] | none | spice cost | raw `Cooking[k][7]`; `kitchens[].fireSpeed` |
| A5 | Luck upgrade | new-recipe chance multiplier `1 + (5*luckLv)^0.85 / 100` (Lv 10 = 1.28x, 50 = 2.09x, 100 = 2.97x) [C9] | none | spice cost | raw `Cooking[k][8]`; `kitchens[].mealLuck` |
| A6 | Status 3 rule | kitchens researching a recipe add 0 to total meal speed [C7] | n/a | n/a | `getTotalMealSpeed` |
| A7 | Upgrade spice cost | per level step `1 + base(lv)/D`; `base(lv) = (lv+1+floor(max(0,lv-10)/2)+max(0,lv-30)^1.2) x 1.02^max(0,lv-60)`; D = product of discounts (A8) [C10]. Cumulative from Lv 0 with no discounts: Lv 10 = 65, 20 = 250, 30 = 585, 50 = 2,018, 60 = 3,268, 100 = 17,472, 150 = 98,956, 200 = 434,750, 300 = 5.9M [C10] | none | spice type by kitchen (A9) | `kitchens[].speedCost/fireCost/luckCost` |
| A8 | Cost discounts (multiply in D) | (Choco Milkshake vial + Garlic Glove sigil, additive); Fractal Island 30%; sum of Dango/Durian/Ratatouey meal `KitchC`; Richelin 40% (divisor 1.4); arena wave 35 listed as -50% in arenaBonuses[7] text but the code divides by 1.5 (conf H) [C11] | n/a | various | see C11 |
| A9 | Which spice per upgrade | kitchen k (from 0): Speed = spice 2k, Fire = spice 2k+1, Luck = spice 2k+2 (so kitchen 1 Speed = Grasslands, Fire = Jungle, Luck = Encroaching Forest; kitchen 10 Luck = Spirit Fields); spices 21-23 upgrade nothing [C66] | n/a | territory of that spice must be won | game `CookingUpgSpiceCostType` |
| A10 | Total kitchen levels | sum of speed+fire+luck over all kitchens; feeds Emerald Pyramite (+1% per 25), Overwhelmed Golden Egg (per 100), Tome task [C36][C54][C53] | n/a | n/a | `getTotalKitchenLevels` |
| A11 | Richelin Kitchen | gem shop item 120: upgrades kitchens in order; each is 3x meal speed, 2x fire, -40% upgrade cost; `kitchenIndex < GemItemsPurchased[120]` [C35] | max 10 purchases | gems | `account.gemShopPurchases[120]` |
| A12 | Sapphire Pyramite jewel | every 24 h the lowest kitchen upgrades gain +1 Lv each (jewel bonus value = count) [C36] | n/a | Lab jewel (Cabbage 5,000 + Beach Docks spice 400 + quest item) | `account.lab.jewels` |

### B. Meals

| # | Mechanic | Rule / formula | Cap | Unlock / cost | Field |
|---|---|---|---|---|---|
| B1 | Meal table | 74 meals (index 0-73): cookReq, baseStat, bonus text; e.g. 0 Turkey of Thank 10 req +2% Total Damage, 12 Corndog 1e3 +12% speed, 66 Nyanborgir 5e16 +9% Crop Evo; 67-73 are W7 meals with 1e43-1e66 req [C3] | n/a | discovery (C23) | `D/shared-data.json cookingMenu`; `account.cooking.meals[]` |
| B2 | Meal bonus | `level x baseStat x (1+(Black Diamond Rhinestone jewel 16, +16, + Shiny%)/100) x (1+winner/100) x (1+25x companion162/100) x ribbon x mastery node`; the `PxLine` meal (Pancakes etc.) skips all multipliers [C2] | max level B4 | n/a | `getMealBonus(account, meal)` |
| B3 | Meal level cost | `(10+L+L^2) x (1.2+0.05L)^L` copies for L->L+1 (L>=1), times discounts; above L>=111 extra `10^22` and `(1+0.4k)^L` terms (k=floor((L+1000)/1111)). Examples: 15, 27.0, 54.1, 115, 256 ...; 29->30 = 1.65e15; cumulative Lv1->30 = 2.09e15 [C13] | n/a | copies in stock | `meals[].levelCost`, `meals[].amount` |
| B4 | Cost discounts | Best Plate achievement 233 (text -10%; code divides cost by 1.1, about -9.1%, conf H) (divisor min(5, 1+10x%)); Wickerlight Spirit companion 162 (divides cost by up to 5x its bonus); Food Lust equinox stacks `0.8^n` (`0.58` floor after challenge 33), n up to counter `accountOptions[193]` and upgrade max (10, +4 via challenge 25) [C13][C49][C50] | n/a | n/a | `getMealLevelCost` |
| B5 | Max meal level (**Disputed**) | `30 + min(20, Grimoire 26) + 10 (Menagerie 20) + Causticolumn (10 x artifact grade 1-7) + 10 (Jade 20) + 10 (Jade 21) + 30 (Lore Boss 6)`. Earlier text: up to 170. Game-data lens: Causticolumn is baseBonus 10 x grade (sailing.ts#L973-L977); Toolbox supports grade 7 (+70), so 120 with a plain artifact, 170 at grade 6, 180 at grade 7 (2.3.540). Source lens did not dispute the 170 arithmetic (it holds at grade 6) [C14] | 180 (grade 7), conf M | see C15-C18 | `account.cooking.mealMaxLevel` (30 in all of W4) |
| B6 | Plate tiers | level thresholds are cosmetic except Lv 11 (Diamond, counted by Diamond Chef; achievement 231 Good Plate) and Lv 30 (void pearl plate, counted by Fluoride; achievement 233 Best Plate pays about -9.1% cost). Verifiers also list a Great Plate (purple, achievement 232) tier and its Arcade-ball reward; its exact effect was not re-read (conf L) [C51] | n/a | n/a | `meals[].level` |
| B7 | Speed meals | Egg 5/lv, Corndog 12, Soda 20, Double Cherry 30 (`Mcook`, summed, one `1+sum/100` factor); Burned Mello 40/lv (`zMealFarm`, x ceil((farming+1)/50)); Cabbage `KitchenEff` 5/lv x floor(kitchen total levels/10) in that kitchen [C33][C41][C70] | n/a | meals discovered | `getMealsBonusByEffectOrStat(account, null, 'Mcook')` |
| B8 | Recipe-speed meals | Pie 5/lv, Canopy 10/lv (`Rcook`) [C8][C3] | n/a | n/a | same helper, stat `Rcook` |
| B9 | Kitchen-cost meals | Dango 2, Durian Fruit 6, Ratatouey 8 per level (`KitchC`) [C11] | n/a | n/a | stat `KitchC` |
| B10 | Meals as costs | every Lab chip and jewel needs a meal + a spice (chips: 100 of one meal, jewels 2,000-1e8); Mob upgrades need one meal each (Egg Capacity = Pie, Fence Extension = Pancakes, Overwhelmed Golden Egg = meal 35) [C52] | n/a | n/a | `D/shared-data.json chips/jewels/petUpgrades.foodIndex` |
| B11 | No Meal Left Behind | daily reset: the lowest-level meal (Lv >= 2) gains levels: Jade 16 gives +1, bundle `bun_s` gives +2 (they stack onto one meal); since 2.3.540 never raises a meal past 150; the pick compares against max level; only on days the player plays [C48] | 150 | Jade Emporium 16 or bundle | `getNoMealLeftBehindLevels/Queue` |
| B12 | Dinner Menu hint | permanent, always-on, all characters (hint text) [C1] | n/a | n/a | n/a |

### C. Recipe discovery

| # | Mechanic | Rule | Field |
|---|---|---|---|
| C-1 | Spice selection | 1-4 spices in an idle kitchen -> status 3 [C4] | raw `Cooking[k][2..5]` |
| C-2 | Possible meals | game `PossibleRecipes2`: each spice's own meal (`randomList[49][spice]`), plus meals centred on the sum of spice indices (remapped above 70). Toolbox's `getMealsFromSpiceValues` is simpler and differs for large sums, so prefer the game rule [C23][C24] | `kitchens[].possibleMeals` (status 3 only) |
| C-3 | Fire requirement | 2 x cookReq of the highest possible meal (index capped 66, x25 per index above 66); each fire level costs 3x more and multiplies undiscovered-meal chance 1.5x [C23] | game `CookingFireREQ` |
| C-4 | Odds | possible meals sorted low to high with base weights `[1,.2,.1,.05,.02,.01,.004,.001,.0005,.0003]`; undiscovered meal weight x luck x 1.5^fireLevel; discovered meals dilute [C23][C24] | `D/randomList.json [50]` |
| C-5 | Taste Test | Blood Berserker active: finishes all recipes, kitchens keep a % of fire [C31] | talents |
| C-6 | Accelerators | Fire upgrade, Pie, Canopy, Spice Stamp (+2/lv), Spook Pint (+5/lv), Massive Troll (<=+50%), Richelin, Diamond Chef, Fluoride, Cabbage, ladles [C8][C38][C39] | A4 |
| C-7 | NEW_MEAL | gem shop purchase unlocks a meal [C56] | gem shop |

### D. Spices

| # | Mechanic | Rule | Field |
|---|---|---|---|
| D1 | Territory production | `Territory[t]=[progress,?,?,spiceName,amount]`; claiming moves `amount` into the bank `Meals[3][spice]` [C25] | `account.cooking.spices.toClaim[]` |
| D2 | Daily claim cap | `accountOptions[100]` counts claims since reset; Toolbox cap 100; Trasher gene +25 in Fence Yard [C26] | `spices.numberOfClaims` |
| D3 | Boosters | Spice Is Nice x1.5 and Spice Is Nicer x2 superbits (W5); Spice Spillage star talent; shiny/gene abilities (50% double, free-claim) [C26] | superbits, talents, petStats |
| D4 | Spice sinks | kitchen upgrades (A7), bubbles EGG_INK (Spice0 x100), DIAMOND_CHEF (Spice6 x100), CARD_CHAMP (Spice9 x100) base costs, Lab chips (100) and jewels (200-10,000) [C67][C52] | `Meals[3]` |
| D5 | Achievement | "Hunned Times a Day": 10,000 individual claims [C55] | achievements |

### E. Ladles

| # | Mechanic | Rule | Field |
|---|---|---|---|
| E1 | Effect | each ladle in a held stack = all kitchens +1 h; whole stack used; no AFK rewards [C27] | inventory item `Cooking_Ladle` |
| E2 | AFK income | `15 x floor(max((CookingEff/1000)^(0.25+prowess),1))` per day on the Kitchen AFK target, x Cooking AFK gain rate x days away [C28] | `getCookingEff`, `getCookingProwess` |
| E3 | Quest / shop sources | Gobo 4+4+5+6, Blobbo 48 per quest, Killroy skull shop 9 (3 ladles), Mutated Mush drop (3, ~1%), Post Office box [C29] | quests.json |
| E4 | Efficiency inputs | base 250 + strength^0.6 + Ladle stamp (+25/lv) + gear + obols + rift skill mastery + PO Chefs Essentials; multiplied by Apocalypse Chow, Brute Efficiency, gear/obols % and the shared all-skill efficiency tree [C30] | `getCookingEffParts` |
| E5 | Ladle talents | Overflowing Ladle (+% more AFK time per ladle), Waiting To Cool (+% Cooking AFK gain), Apocalypse Chow (+% EXP and efficiency per 1M-kill mob) [C31] | talents |
| E6 | Ladles used | cumulative ladles used `CookMaster[1][3]` feeds Mastery SALTY [C43] | raw |

### F. Cooking Mastery (Rift 61, mostly W7-era but starts in Cooking)

| # | Mechanic | Rule | Field |
|---|---|---|---|
| F1 | Unlock | `CookMaster` present; Toolbox returns null otherwise [C42] | `account.cooking.cookingMastery` |
| F2 | Level | `CookMaster[1]=[level, exp, ?, ladlesUsed]`; `expReq = 100 x 2.5^lvl x 5^max(0,lvl-40)` [C42] | raw |
| F3 | Categories | 6 flavors with unlock levels `[0,1,5,10,25,100]` and base multipliers `[200,1,30,10,2,20]`: SALTY (EXP per POW10 ladles used), SPICY (EXP per account Cooking LV above 1000), SWEET (EXP per Divorce Cake level above 75), SMOKY (daily ribbon rank chance, `m/(25+m)x250`), SOUR (EXP per total ribbon rank), SAVORY (EXP per mastery rank) [C43] | `CookMaster[2][i]` |
| F4 | EXP rate | `2 x prod(1+cat/100) x research grid 190 x superbit x companion87 x fountain x menagerie21 x (1+(vial+arcade+salt lick)/100)` [C44] | `expRate` |
| F5 | Points | purple (category) and yellow (meal node) points = level + 1 + 5xEvent Shop 54 + 5xcompanion87, plus jelly bonuses; spent in `CookMaster[2]` and `[0]` [C44] | `points` |
| F6 | Meal nodes | per-meal multiplier `1 + n/(n+5)` on that meal's bonus [C45] | `CookMaster[0][meal]` |

### G. Ribbons (Grimoire / bundle era)

| # | Mechanic | Rule | Field |
|---|---|---|---|
| G1 | Storage | `Ribbon[0..27]` shelf, `Ribbon[28+meal]` rank on that meal; max rank 25 [C46] | `account.grimoire.ribbons` |
| G2 | Multiplier | `1 + (floor(5r + floor(r/2)(4+6.5 floor(r/5))) + floor(r/4)xemperor-set/4 + floor(r/10)xcloud73 + floor(r/20)xjelly60)/100`; rank 10 = about 2.35x, 20 = 5.0x base [C46] | `getRibbonBonus` |
| G3 | Daily ribbons | unlocked by Grimoire 5 / Death Bringer or Boaring bundle / Event Shop 13; count `floor(M x (1 + 3xconnoisseur + bundles(5 each) + legend talent + talent/100 + roll + min(3, palette)))`; rank starts 1 with free rolls, streak chance `min(0.65, 0.1+(grimoire+15 bundle)/100)`, bonus rolls (Sushi, anniversary bundle, Smoky, Armory, Bin Goosey); rank above 20 becomes 2 [C47] | `calcDailyRibbons` |

### H. Cross-system speed sources (the 32 multiplicative factors) and W5+ extensions

W4-reachable: speed upgrade, Egg/Corndog meals, Cabbage, Diamond Chef, Cooked Meal stamp + Emerald Pyramite (summed), Long Island Tea + Dreadnog vials (summed), Gordonius Major star sign (logged-in character), Massive Troll + Cabbage Patch + Le Pretzel Bleu (<=+100%), Amethyst Rhinestone (x1.5, doubled with all 3 purple), Richelin, Arcade 28, Fluoride atom [C5][C34][C36][C38][C39][C40]. W5+ one-liners: Causticolumn/Triagulon artifacts (Triagulon = % per power of 10 Turkey owned) [C37]; Turtle Tisane and Firefly Grog vials [C38]; Upgrade Vault 54 Kitchen Dream-mare (unlock 2600, max 500) [C40]; Superbit MSA Mealing; Crop Depot; Summoning winner bonus; vote ballot 13; Caverns monument/schematic/lamp; Clam Work (`1+9*bonus`), Button 7, Dough Roller (Event Shop 53, flat 2x), Enhancement Eclipse (Voidwalker), Pet Arena Crucible (`9*crucible5 + 20*crucible12 + 1`, cooking.ts#L815), Monument, Schematic 56, Lamp, card Cooking_Spd_Multi, Cooking_SPD star sign, Menagerie boost 4 (and Blue Jellyfish auto-ladle, L) [C5][C57].

### I. Missed mechanics added after adversarial verification (2026-10-19)

| # | Mechanic | Rule | Source / conf |
|---|---|---|---|
| I1 | Pet Arena Crucible | meal speed factor `9*getPetArenaCrucBonus(5) + 20*getPetArenaCrucBonus(12) + 1` | T#L815, tier 1, H |
| I2 | Meal speed factors the first draft omitted | Dough Roller, Crop Depot, Vote 13, Monument, Schematic 56, Lamp, Button 7, Clam Work 10, card, Enhancement Eclipse, Mealing superbit (+10% per 10 waves), star sign, Winner bonus | T#L803-L852, tier 1, H (superbit per-10-waves figure from verifier, M) |
| I3 | Recipe (fire) speed sources | Rcook meals (Pie, Canopy), New Recipe Cooking Speed stamp and Recipe Cooking Speed vial, Vote 13, MSA_Mealing superbit | T#L895-L914, tier 1, H |
| I4 | Mastery SMOKY chance | daily ribbon rank chance `m/(25+m)*250`, at most +3 rank | T#L258-L330, tier 1, M (verifier) |
| I5 | Mastery category scaling inputs | ladles used (lavaLog), account Cooking level above 1000, Divorce Cake (meal 73) level above 75, total ribbon ranks, mastery rank | T#L258-L330, tier 1, M |
| I6 | Mastery EXP rate inputs | Canteen Read vial, Cook Mastery arcade, salt lick 10, Green Water fountain, Menagerie boost 21, superbit 68 (+40%), companion 87; Cooking Mastery "EXP boost via Ladle" (+% per POW10 ladles ever used); Bejeweled Ladle Event Shop 54 gives +5 mastery points; per-meal yellow node points exist | T#L449-L486, tier 1, M-H |
| I7 | Daily ribbon inputs | Meritocracy 11, Legend talent 13, Ribbon Winning talent, Balmy Red palette 33, Sushi 14, Armory 82, Elegant Ribbons Event Shop 51, Bin Goosey companion 169, 5th Anniversary bundle ban_a, Death Bringer and Boaring bundles | T#L560-L720, tier 1, M |
| I8 | Meal level cost modifiers | Wickerlight Spirit companion 162; equinox cloud Food Lust discount; `accountOptions[193]` Food Lust stacks reset on each meal upgrade | T#L1047-L1062, tier 1, M-H |
| I9 | Lore Boss 6 and Causticolumn grade | Lore Boss 6 (spelunking loreBosses[5]) +30 max level; Causticolumn scales to grade 7 | T#L1031-L1045, sailing.ts#L973-L977, tier 1, H |
| I10 | More ladle quest sources | Oinkin1-3 (4, 5, 6), Capital_P1-P3 (1 each), Royal_Worm3 (40), Nebula_Neddy (48), another 48-ladle quest; list in E3 is incomplete | D/quests.json, tier 1, M |
| I11 | Lab Pyramite jewels | Emerald Pyramite uses the total of all kitchen speed, fire and luck levels; Sapphire Pyramite auto-levels the 2 lowest kitchen upgrades daily | D jewels, tier 1, H |
| I12 | Talents | Taste Test finishes all recipes while kitchens keep a % of fire; Spice Spillage claims all mob spices on 1hr+ AFK claims; Overflowing Ladle (`getHighestOverflowingLadle`) is a ladle-time source | D/talents.json, tier 1, M |
| I13 | Achievements and breeding link | Michelin Ranked (kitchen stat Lv 300 crown); Overwhelmed Golden Egg (new-mob chance per 100 total kitchen levels) | D/achievements.json, breeding.ts, tier 1, H |
| I14 | Spice Is Nice/Nicer and territory claims | superbits x1.5 and x2 on claims; territory claim mechanics via Breeding not re-traced (conf L) | superbitsUpgrades[14,17], tier 1, L-M |
| I15 | Kitchen Luck gating | Luck level and mealLuck feed new-recipe odds alongside Dream-mare (Upgrade Vault 54); status 3 kitchens expose `possibleMeals` from spice sums | T#L933, L990-L1017, tier 1, M |
| I16 | Meal-effect taxonomy | cooking-feeding stats Mcook, Rcook, KitchC, KitchenEff (Cabbage) and farming-scaled zMealFarm (Burned Mello) are distinct categories | cookingMenu, tier 1, H |
| I17 | Toolbox dashboard helpers | `calcMealTime` (time to max level), `getHighestOverflowingLadle`, `getNoMealLeftBehindQueue` simulation | T, tier 3, H |

## Min-max by stage

All lines below marked (ours) are derived from the multiplier structure in the Mechanics catalogue; there is no dated v1.23 community order for W4 cooking (confidence M). Community lines are cited.

| Stage | Priority order | Source / conf |
|---|---|---|
| W1 / W2 / W3 (before W4) | Nothing to cook yet. Kitchen 1 exists but spices need the W4 Gobo line. Prepare: Alchemy Diamond Chef needs Spice6, Garlic Glove sigil and Choco Milkshake vial help later; stamp slots (Cooked Meal, Spice, Ladle) can be levelled when affordable | [C22][C19][C39] (ours, M) |
| W4 arrival | Finish Gobo 1-5 (19 ladles); put the ladles into the first recipe / first meal levels | [C29] (M) |
| Early W4 | (1) discover with **single spices** in territory order (Turkey of Thank, Egg, Pie, Salad, Spaghetti, Garlicles Bread, Frenk Fries, Apple, Cabbage); (2) cook Egg first for speed; (3) spend Grasslands on kitchen 1 Speed; (4) buy kitchen 2 at 8.2M and kitchen 3 at 75M; (5) keep every meal leveling while chasing recipes | [C23][C21][C59] (ours + gist, M) |
| Mid W4 | (1) Diamond Chef bubble; push every meal to **Lv 11** cheapest-cookReq first (gist mid-game target: meals up to Eggplant at Lv 11); (2) Corndog and Cabbage levels, Cooked Meal stamp, Long Island Tea; (3) kitchen 4 (400M); (4) keep one kitchen on discovery (Pie, Canopy speed it); (5) Ratatouey early because it cuts kitchen upgrade cost | [C19][C60][C59][C11] (gist L-M; rest ours) |
| Late W4 | (1) all discovered meals to **Lv 30** (cap), damage meals first, then Lab and Breeding meals; (2) kitchen 5 (8B), stack discounts (Choco Milkshake, Garlic Glove, Fractal later); (3) Amethyst Rhinestone and Emerald Pyramite jewels; (4) Fluoride atom; (5) Cabbage Patch briefly (5 kitchens on Cabbage) | [C14][C20][C34][C36] (ours, M) |
| W5+ outline | Causticolumn raises the cap; Fractal Island + Ratatouey cut costs; Soda/Double Cherry speed; Black Diamond Rhinestone multiplies all meals; Jade Emporium +20 and No Meal Left Behind; Grimoire 26; Lore Boss; Menagerie +10; then Ribbons and Mastery | [C14][C15][C48] (H for mechanics) |
| Per class | Blood Berserker owns the Cooking AFK talents; Voidwalker adds Blood Marrow speed; Death Bringer adds the Grimoire (cap, ribbons). Others only matter via the logged-in character's star sign | [C31][C32] (H) |

Upgrade-order rule of thumb (ours, M): since speed factors multiply, buy a new multiplier source (a new kitchen, Diamond Chef, a speed meal at Lv 1) before deepening one (speed Lv 20+ costs 250 spices), and give discount multipliers to the territory spices you farm most [C10][C5].

## Common mistakes

| Mistake | Save detection |
|---|---|
| Kitchen idle or stuck on a recipe | `kitchens[].status` idle, or recipe with low `fireSpeed` |
| Meals with enough stock not levelled | `meals[].amount >= levelCost` and `level < mealMaxLevel` |
| Kitchen cooking a capped meal | `kitchen.meal.level >= mealMaxLevel` |
| Unused spice claims | `spices.numberOfClaims` far below 100 at end of session |
| Luck/Fire before Speed on a kitchen that only cooks | high luck/fire, low speed |
| Meals stuck below Lv 11 (Diamond Chef) | discovered meals with level 1-10 |
| Hoarded ladles | `Cooking_Ladle` stack in inventory |
| Nobody on the Kitchen AFK target | no character with that target |
| Trusting the wiki's 160 max level | compare `mealMaxLevel` (170 with Menagerie) [C62] |
| Expecting No Meal Left Behind to push past 150 | cap since 2.3.540 [C48] |

## Save and Toolbox fields

| Field | Meaning |
|---|---|
| raw `Cooking[k]` | kitchen row (A1) |
| raw `Meals[0][i]` / `[1][i]` / `[2][i]` / `[3][s]` | meal level / in-progress / stock / spice bank |
| raw `Territory[t]` | per-territory spice progress/amount |
| raw `CookMaster` | `[nodes, [level,exp,?,ladlesUsed], categories]` |
| raw `Ribbon` (via `account.grimoire.ribbons`) | shelf + per-meal ranks |
| `accountOptions[100]` / `[193]` / `[89]` | spice claims today / Food Lust counter / arena wave |
| `gemShopPurchases[120]` | Richelin count |
| `account.cooking.meals[]` | `{index, name, level, amount, levelCost, cookReq, baseStat, effect, stat, shinyMulti, cookingMasteryNode}` |
| `account.cooking.kitchens[]` | `{status, meal, speedLv, fireLv, luckLv, currentProgress, mealSpeed(+breakdown), fireSpeed(+breakdown), mealLuck, speedCost, fireCost, luckCost, spices, possibleMeals}` |
| `account.cooking.spices` | `{toClaim[], available[], numberOfClaims}` |
| `account.cooking.mealMaxLevel`, `.cookingMastery` | cap; mastery or null |
| `characters[].skillsInfo.cooking`, `.afkTarget`, `.chow` | skill, AFK target, Chow progress |

Toolbox-computed numbers to use (ADR 0005): `getTotalMealSpeed`, `calcTimeToNextLevel`, `calcMealTime`, `getMealBonus`, `getCookingEff`, `getNoMealLeftBehindQueue`, `calcDailyRibbons` [C13][C5][C48][C47].

What ActiveOn exposes today: `CookingState` carries kitchens (status, meal name, three levels, mealSpeed), meals (level, amount, levelCost, cookReq, perLevel, effect), spices (held, toClaim), `mealMaxLevel` and `claimsToday`; there is a Cooking page and a `cooking` system home, but no Knowledge Base system file or detectors and no advice (read-only page). **Disputed (C63):** the Kitchen interface already has `fireLv` (world4-types.ts#L90); not modelled are fire speed, ribbons, mastery, NMLB, luck odds and recipe fields, ladle stock [C63][C64].

## Sprite needs

Existing: `sys-cooking`, `item-meal`, `item-spice` (apps/activeon/src/art/sprites/grids). Proposed new grids if the module is built: `item-ladle` (Cooking Ladle), `sys-kitchen` (table/pot), `item-ribbon` (rank ribbon), `sys-plate-diamond`, `sys-plate-great` (purple, achievement 232) and `sys-plate-void` (Lv 11 / Great / Lv 30 milestone plates), `sys-fire-bar` (recipe fire), plus per-spice tints reusing `item-spice` [C63].

## Open questions

1. In-game daily spice claim cap: Toolbox says 100, unread in minified `_GenINFO[115]`; verify on first W4 save [C26].
2. Whether ladles advance recipe fire as well as meals (item text says "kitchens ahead by 1 hour"; Toolbox does not model it) (M).
3. Recipe odds normalisation and the exact kitchen coin cost table are from the N.js reading; neither is in the vendored Toolbox (ADR 0004 tier 1 but not reproducible from the pin) [C21][C23].
4. Whether `Cooking[k][9]` (unnamed) has a meaning.
5. Current v1.23 community W4 cooking priority order: not found (search budget exhausted, Sheet and Reddit not fetchable).
6. Max kitchen upgrade level: Toolbox shows none, achievement mentions Lv 300 [C55].
7. Great Plate (achievement 232) effect and the Arcade-ball reward: not re-read.
8. Pre-patch flag: the wiki max-level list (160) and the Incomplete Guide predate v1.23 [C62].

## Claim register

| Id | Claim | Source | Tier | Conf |
|---|---|---|---|---|
| C1 | Meal bonus is permanent, account-wide: `level x baseStat x multipliers` | T#L206-L243; N.js hint text (earlier research @14706880); verified 2026-10-19 | 1 | H |
| C2 | Meal bonus multipliers: Black Diamond + Shiny additive, winner, companion 162, ribbon, mastery node; PxLine skips | T#L206-L243 | 1 | H |
| C3 | 74 meals (0-73) with cookReq/baseStat/effect/stat | D/shared-data.json `cookingMenu`; 2026-10-19 | 1 | H |
| C4 | Kitchen row layout and statuses | T#L731-L740 | 1 | H |
| C5 | Meal speed = 10 x product of 32 multiplicative factors | T#L818-L852 | 1 | H |
| C6 | Speed upgrade multiplier 1+speedLv/10 | T#L836 | 1 | H |
| C7 | Status 3 kitchens add no meal speed | T#L1070-L1072 | 1 | H |
| C8 | **Disputed** (game-data lens refuted): fire speed is 5 x (1+fireLv/10), plus Vote and Mealing superbit terms; see A4 | T#L899-L914 | 1 | H on correction (Disputed) |
| C9 | Luck multiplier 1+(5 lv)^0.85/100 | T#L933 | 1 | H |
| C10 | Spice cost per level and cumulative totals (computed from formula) | T#L185-L190, L947-L957  (totals include the +1 per-level term: 65/585/3268/17472/434750) | 1 | H |
| C11 | Cost-discount divisor components | T#L939-L953; D/vials.json CHOCO_MILKSHAKE; D/shared-data.json sigils[18], arenaBonuses[7] | 1 | H |
| C12 | Upgrade cost = 1 + discount x base cost | T#L955-L957 | 1 | H |
| C13 | Meal level cost formula and discounts | T#L1047-L1062 | 1 | H |
| C14 | **Disputed**: max level formula; Causticolumn = 10 x grade, so 120/170/180 at grade 1/6/7 | T#L1031-L1045 | 1 | M (Disputed) |
| C15 | Causticolumn artifact adds max level | D/artifacts.json [17]; T#L1034 | 1 | H |
| C16 | Grimoire 26 Supreme Head Chef Status: +1 max per level, max 20, unlock level 1900 | D/shared-data.json grimoire[26] | 1 | H |
| C17 | Jade Emporium 20 and 21 each +10 max level | D/shared-data.json jadeUpgrades | 1 | H |
| C18 | Menagerie unlock 20 "+10 max Cooking LV" (v1.23) | D/research.json [56][20]; T#L1040 | 1 | H |
| C19 | Diamond Chef: Kazam c17, 0.3/13 decay, Spice6 x100 + Liquid3 x4, per meal Lv 11+, speed and fire | D/cauldrons.json kazam[17]; T#L763-L764 | 1 | H |
| C20 | Fluoride Void Plate Chef: per meal Lv 30+, baseBonus 1 | D/shared-data.json atomsInfo[8]; T#L798-L805 | 1 | H |
| C21 | Kitchen coin costs 8.2M...1e17 | N.js `CookingNewKitchenCoinCost` @7893536 (earlier research, 2026-10-17); not in vendored Toolbox  (unverifiable: N.js/fixtures only, not in vendored Toolbox) | 1 | L |
| C22 | Kitchen 1 is status 1 in all saves, even W2/W3 | Earlier research save check on two fixtures, 2026-10-17  (unverifiable: N.js/fixtures only, not in vendored Toolbox) | 1 | L |
| C23 | Recipe discovery: PossibleRecipes2, fire requirement, odds weights | N.js `PossibleRecipes2` @7881938, `CookingFireREQ` @7890692, `CookingNewRecipeOdds` @7893066 (2026-10-17); T#L990-L1017 differs | 1 | M |
| C24 | randomList[49] spice->meal, [50] odds weights | D/randomList.json | 1 | H |
| C25 | Territory and spice-bank layout | T#L66-L93 | 1 | H |
| C26 | Spice claims capped 100/day (Toolbox), Trasher +25, superbits x1.5/x2, Spice Spillage | T#L1170, L90; D/petStats.json; D/shared-data.json superbitsUpgrades[14,17]; talents.json SPICE_SPILLAGE | 1 | M |
| C27 | Ladle = +1 h to all kitchens per ladle, whole stack | N.js item @15998344 (earlier research); https://idleon.wiki/wiki/Cooking_Ladle fetched 2026-10-19 | 2 | M |
| C28 | AFK ladle income formula | N.js `CookingBaseLadlePerDay` @4241639 (earlier research, 2026-10-17)  (unverifiable: N.js/fixtures only, not in vendored Toolbox) | 1 | L |
| C29 | Gobo ladles 4+4,5,6; Blobbo 48 each; Killroy skull shop 9 (3); Mutated Mush drop | D/quests.json Gobo/Blobbo; D/shared-data.json killRoySkullShop[9]; https://idleon.wiki/wiki/Cooking_Ladle (2026-10-19) | 1 | M |
| C30 | Cooking efficiency formula | T#L147-L176 | 1 | H |
| C31 | Blood Berserker talents (Taste Test, Overflowing Ladle, Waiting To Cool, Apocalypse Chow) | D/talents.json | 1 | H |
| C32 | Voidwalker Blood Marrow multiplicative per total meal levels | T#L790-L795; D/talents.json | 1 | H |
| C33 | Cabbage KitchenEff x floor(kitchen levels/10) | T#L810 | 1 | H |
| C34 | Achievements 224 (+10%) and 225 (+20%), Massive Troll 6 x (stars+1), cap 100% | T#L812; D/achievements.json 224-225 | 1 | M |
| C35 | Richelin: gem item 120, 3x speed, 2x fire, -40% cost | D/gemShop.json; T#L761  (gem item index 120 ambiguous, check before relying) | 1 | H |
| C36 | Lab jewels Amethyst, Emerald Pyramite, Sapphire Pyramite, Black Diamond Rhinestone and costs | D/shared-data.json jewels; T#L744-L748 | 1 | H |
| C37 | Triagulon artifact: % cooking speed per power of 10 Turkey owned | D/artifacts.json [13] | 1 | H |
| C38 | Vials: Long Island Tea +6, Dreadnog +2, Firefly Grog +5 (x), Turtle Tisane +4 (x), Spook Pint +5 recipe, Choco Milkshake | D/vials.json | 1 | H |
| C39 | Stamps: Cooked Meal +2, Spice +2, Ladle +25 eff | D/stamps.json skills[36-38] | 1 | H |
| C40 | Arcade 28, Gordonius Major +15% (logged-in), Upgrade Vault 54 (unlock 2600, max 500) | D/shared-data.json arcadeShop[28], starSigns[58], upgradeVault[54] | 1 | H |
| C41 | Burned Mello x ceil((farming+1)/50) of logged-in character | T#L810, L783-L786 | 1 | H |
| C42 | Cooking Mastery unlock and layout, expReq formula | T#L348-L355 | 1 | H |
| C43 | Mastery categories, thresholds [0,1,5,10,25,100], multipliers | D/shared-data.json gameTables.cookingRankRequirement, randomList2[8-9]; T#L258-L330 | 1 | H |
| C44 | Mastery EXP rate and points formulas | T#L449-L486 | 1 | H |
| C45 | Meal node multiplier 1+n/(n+5) | T#L87 | 1 | H |
| C46 | Ribbon storage, max rank 25, bonus formula | T#L247-L253, L332-L334 | 1 | H |
| C47 | Daily ribbon unlock and roll rules | T#L560-L720 | 1 | H |
| C48 | No Meal Left Behind rules and 150 cap | T#L1099-L1165; D/shared-data.json jadeUpgrades[16] | 1 | H |
| C49 | Food Lust equinox: 0.8 per stack, floor 0.58 with challenge 33, max 10 (+4) | D/shared-data.json equinoxUpgrades[9], equinoxChallenges[25,33]; T#L1048-L1056 | 1 | H |
| C50 | Best Plate achievement 233 text -10%, code about -9.1% | D/achievements.json 233 | 1 | H |
| C51 | Lv 11 and Lv 30 thresholds | T#L739-L741; D/achievements.json 231-233 | 1 | H |
| C52 | Meals/spices as costs of chips, jewels, Mob upgrades | D/shared-data.json chips, jewels, petUpgrades | 1 | H |
| C53 | Tome tasks on kitchen levels and meal levels | T tome.ts#L340-L342 | 1 | H |
| C54 | Overwhelmed Golden Egg: new-mob chance per 100 kitchen levels | breeding.ts#L239-L302; D/shared-data.json petUpgrades[9] | 1 | H |
| C55 | Achievements 226 (kitchen stat Lv 300), 230 (10,000 spice claims) | D/achievements.json | 1 | H |
| C56 | NEW_MEAL gem shop item | D/gemShop.json World_4 | 1 | H |
| C57 | Menagerie boost 4 cooking speed; Blue Jellyfish daily ladles | D/research.json [57][4]; r/idleon 2026-10-16 via earlier research (not re-fetched) | 4 | M (Blue Jellyfish ladle part L) |
| C59 | Keep all meals levelling while chasing recipes; Ratatouey cuts kitchen costs; Diamond Chef helps | https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa (self-dated through v1.21, 2026-09-18; fetched 2026-10-19) | 4 | L |
| C60 | Mid-game target: meals up to Eggplant at Lv 11 | same gist via earlier research (2026-10-17) | 4 | L |
| C61 | Territories produce slower when unclaimed | Idleon Incomplete Guide W4 tab via earlier research (undated, pre-v1.23, not re-fetched) | 4 | L |
| C62 | Wiki and Sheet list 160 max level, stale vs v1.23 +10 | https://idleon.wiki/wiki/Cooking (2026-10-13 revision per earlier research) | 2 | L |
| C63 | **Disputed**: ActiveOn CookingState fields (Kitchen has fireLv) and existing sprites | packages/account-state/src/world4-types.ts#L79-L132; apps/activeon/src/art/sprites/grids/systems.ts, items.ts | 1 | H on correction (Disputed) |
| C64 | No cooking KB system file or detectors; page shows no advice | packages/knowledge/{systems,detectors}; scratchpad/ux/m25-coverage.md | 1 | H |
| C66 | Kitchen k upgrades use spice 2k (Speed), 2k+1 (Fire), 2k+2 (Luck) | N.js `CookingUpgSpiceCostType` @7889726 (earlier research)  (unverifiable: N.js/fixtures only, not in vendored Toolbox) | 1 | L |
| C67 | Bubbles EGG_INK, DIAMOND_CHEF, CARD_CHAMP cost Spice0/6/9 x100 | D/cauldrons.json kazam[16-18] | 1 | H |
| C70 | Speed meals Egg 5, Corndog 12, Soda 20, Double Cherry 30, Burned Mello 40 | D/shared-data.json cookingMenu | 1 | H |
