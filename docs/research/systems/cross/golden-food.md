# Food slots, health/boost food and Golden Food (dossier)

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Paths: `T/` = `packages/toolbox-parsers/vendor/parsers/`, `D/` = `packages/toolbox-parsers/vendor/data/website-data/`. Tiers: 1 = game data / Toolbox code, 3 = idleon.wiki (ADR 0004: wiki is tier 3), 4 = community. Confidence (H/M/L) is appended to each claim; revised 2026-10-19 after two adversarial verdict sets (source and game-data lenses; no claim was refuted by both). The web-search budget was exhausted mid-run and Reddit is not fetchable, so tier-4 community meta is thin (see Open questions).

## Food slots, health/boost food and Golden Food

- **What it is:** Each character has a food buffer. Items equipped in it do three different things: HEALTH_FOOD is auto-eaten when HP drops under a threshold, BOOST_FOOD is a consumable buff for a skill/stat, and GOLDEN_FOOD is never consumed and gives a permanent bonus that grows with the stack size. [C1][C2][C3] (H for the three types, verified 17/41/22 in items.json; wiki 50% default trigger tier 3, M)
- **Unlocks:** Base slots are not in the parsed data (the 16-entry buffer comes from an internal ActiveOn spec, not a game source, and character.ts#L364 shows no cap; unlocked count unverified, confidence L). Extra slots: Gem Shop "Food Slot" (2 purchases) and World 3 Merit Shop row (2 of its 4 levels). Golden foods drop from W1 onward; the Beanstalk (W6 Jade) is an extra home for stacks. [C4][C5][C6] (C4, C5 H; C6 L)
- **Scope:** Slots and equipped food are per-character. Gem Shop slots apply to all characters. Golden Food multiplier is per-character (family bonus, talents, gear, obols, star sign) with many account-wide inputs. Beanstalk ranks are account-wide. [C7] (H)
- **Inputs → outputs:** Input: golden foods owned and equipped (stack size = `amount`), plus Golden Food multiplier sources. Output: a bonus per Effect (MaxHP%, Damage, Defence, BaseDamage, SkillExp, MonsterCash, FishingEff, MiningEff, ShrineEffect, AllStatz, SailAFKz, ClassEXPz, AllAFK, DropRatez, SpelunkEXPz, BaseAcc). [C8][C9] (H)
- **Goals and Milestones:** Stack size drives a log curve (table below); Beanstalk drop breakpoints are 10k, 100k, 1M. Two achievements need 5 and 14 different golden foods on the Beanstalk. [C10][C11][C12] (H)

| Stack (multi = 1) | bonus per 1 unit of food `Amount` |
|---|---|
| 10 | 0.077 |
| 100 | 0.194 |
| 1,000 | 0.360 |
| 10,000 | 0.574 |
| 100,000 | 0.834 |
| 1,000,000 | 1.141 |
| 10,000,000 | 1.495 |

(Computed from [C10]: `0.05*multi*lavaLog(1+q)*(1+lavaLog(1+q)/2.14)`, lavaLog = ln/2.30259.) Doubling the multiplier doubles the bonus, but 10x more stack gives only about 1.5x to 1.6x; both levers matter. [C10]

- **Feeds / fed by:** Fed by monster drops, chests, resource nodes (see catalogue), Double Golden Food Drop, Stamp, Alchemy, Cooking, Companions. Feeds damage (Nomwich BaseDamage, Kebabs Damage), survivability (Jam MaxHP%, Meat Pie Defence), AFK gain rates (Dumpling AllAFK, Ham SkillExp), drop rate (Cake, Sugar Cookie), skill efficiency (Peanut, Ribs), shrines (Cheese). Linked to M3 AFK safety (health food) and character-builds. [C8][C13]
- **Per-session actions:** (1) Check every character has all food slots filled; empty slot with an owned golden food is free power. (2) Check health food stack is enough for the AFK stretch. (3) Check golden foods in inventory/storage that are not equipped (carry them to the slot). (4) Drop golden stacks on the Beanstalk when the Jade unlock exists. Idle/capped: all slots full; Beanstalk at rank 3.
- **AFK Setup implications:** Fighters need health food (survivability); put the boost food matching the AFK skill (mining, choppin, fishing, catching, trapping, worship) before leaving; golden food has no upkeep. Golden Cake/Sugar Cookie raise drop rate for farm characters; Golden Peanut/Ribs for mining/fishing characters. [C8]
- **Min-max by stage:** see section below.
- **Common mistakes:** Equipping a golden food whose effect the character does not use (e.g. Ribs on a non-fisher). Selling golden food (sellPrice is 50 to 350; stacks are the bonus). Leaving food slots empty after buying them. Putting two golden foods with the same Effect (Cake and Sugar Cookie both DropRatez) - both count, but a later same-effect food on the Beanstalk is ignored. Forgetting that golden food is not consumed so one stack is enough for all time. Gem Shop slots forgotten. [C9][C10]
- **Save and Toolbox fields:** see catalogue.
- **Sources:** inline per claim.

## Mechanics catalogue (up to end of World 4; W5+ one-liners)

### M1. Food slots
- Rule: the character's food list is `EquipmentOrder[2]` with quantities `EquipmentQuantity[2]`; empty entries are dropped. Parser path: `characters[].food[]` = `{name, rawName, owner, amount, ...item fields}` (T/character.ts#L364). Buffer size 16 is unverified against game data (L); the number of unlocked slots is not in the parsed data. [C2]
- Gem Shop `FOOD_SLOT` (GemP8, globalIndex 59): +1 slot for all characters, cost 450 then +300 increment (750 for the second, 1,200 total), max 2 purchases. Save field: `GemItemsPurchased[59]` (T/gemShop.ts#L8). [C4]
- Merit Shop, World 3 (merits[2][0]): "1st, 3rd purchase give +1 Build Slot, 2nd, 4th give +1 Food Slot", 4 levels, merit cost 3 (per D/shared-data.json `merits`; parser T/tasks.ts getTasks/getMeritDescription). So 2 food slots from there. [C5]
- Item text says "4 food slots will be added for free in later updates, scattered across the game" (Gem Shop description). Their sources are not identified in the data (open question). [C4]

### M2. Health food and auto-eat
- Items Type HEALTH_FOOD (22), fields `Effect: Health`, `Amount` (HP healed), `Trigger` (HP% under which it is eaten), `Cooldown` (seconds). Trigger ranges 30-80% and Cooldown 10-60 s (not just 10-30): the full 22-item roster is in the correction block below. Examples: Nomwich 20 HP / 50% / 30s; Hot Dog 50; Cheezy Pizza 125; Kebab Sticks 300; Meat Pie 500; Cupcake 3000 at 70%; Spicy Space Ribs 6000 / 25s; Grilled Cheese Nomwich 12,500 / 20s; Dumpling 40,000; Sugar Cookie 80,000 / 70% / 20s; Peanut 80 at 75%; Magic Meatloaf 2000 at 30% / 10s; Milk Choco 1000 at 80% / 12s. Outliers: Crabby Cake Supreme 700 at 35% / 60s, Yeti Ham 1000 at 60%, Lemon Slice 8000 at 60% / 22s. [C3][C14] (H, items.json; wiki default 50%/Cupcake 70/Peanut 75/Meatloaf 30 agrees, tier 3, page dated 2026-09-13, no patch stated)
- Heal per bite = `Amount * getPlayerFoodBonus(character, account, true)` where the health variant is `1 + (CarepackFromMum(PostOffice lvl idx1) + Statue 3 + gear stat 9 + stamp Boost_Health_Effect + star sign All_Food_Effect + CardSet1 bonus)/100` (T/character.ts#L3166-L3187). Hourly health from food = `Amount * bonus / max(Cooldown,1) * 3600` (T/misc.ts#L1371). [C15] (H; character.ts#L3166-3191, misc.ts#L1363-1379; health per hour only for Trigger>0)
- Save field: `characters[].food[]` (above); ActiveOn already carries `afk.food[].healPerBite`, `survivabilityNoFood`, `fixingFoods`, `foodCap` (account-state/src/afk-types.ts).

### M3. Boost food (potions and similar)
- Items Type BOOST_FOOD (41): `Effect` names like BaseDmgBoosts, HpBaseBoosts, MoveSpdBoosts, ManaRegenBoosts, ClassEXP, MiningSpeedBoosts, ChoppinSpeedBoosts, FishingSpeedBoosts, CatchingSpeedBoosts, TrappingSpeedBoosts, WorshipSoulBoosts, WeaponPowerBoosts (the list is not exhaustive: Mana potions use ManaRegenBoosts). `Trigger` is a negative id that selects the activity. `Cooldown` is the duration/consumption interval. Examples: Strength potions 50/150/400/1000 BaseDmg; Life potions 75/200/400/800 HpBase; Speed potions 10/15/17/20; EXP potions 30/45/60/75/90; Icing Ironbite 15 mining (cooldown 10); Saucy Logfries 15 chop; Slurpin Herm 20 fish; Buttered Toasted Butter 20 catch; Critter Numnums 25 trap (125); Soulble Gum 25 worship (125). [C16] (H, items.json; list is partial, see below)
- Effective amount = `Amount * getPlayerFoodBonus(character, account)` where bonus = `1 + (Carepack idx2 + Statue 3 + gear stat 9 + stamp Effect_from_Boost_Food + star sign All_Food_Effect + card Y5 + CardSet1 + talent FROTHY_MALK)/100` (T/character.ts#L3166-L3191, T/misc.ts#L1363). [C15] (H)
- Stamp: Potion Stamp (StampC6, `BFood`), +1 per level, itemReq Icing Ironbite. [C17] (H)
- Event/pearl foods (Minto Choco, Lemony Choco, Giftybread Man, Chogg Nog, Candy Canes, Mistleberries, Cherry Choco, Aqua/Stained/Shiny Pearl) share the BOOST_FOOD type. Bullets (Bullet, FMJ, Coldseeker) and Midnight Cookie are BOOST_FOOD with WeaponPowerBoosts. Exact rows are in the correction block below. [C16] (H)

### M4. Golden Food bonus per food
- Formula: `bonus = sum over equipped slots with Type GOLDEN_FOOD and same Effect of Amount * goldenFoodMulti * 0.05 * lavaLog(1+qty) * (1 + lavaLog(1+qty)/2.14)` (+ the same expression for the Beanstalk entry when unlocked) (T/misc.ts#L1046-L1072; the effect map is at L1035-1040 with its comment at L1042-1044, function at L1046). No cap. Zero if `amount` or `qty` is 0. [C10] (H; formula and GAME_LN10 2.30259 at helpers.js#L294, lavaLog at L296 verified)
- Additive vs multiplicative split (T/misc.ts#L1075): `getGoldenFoodMultiplier = 1 + bonus/100`. The game returns the bonus itself (additive) for BaseDamage, Defence, SkillExp, AllAFK, DropRatez..., and `1 + bonus/100` (multiplier) for Damage, MaxHPpct, MiningEff, FishingEff, HealthFoods. Callers pick the form per stat (character.ts L1660, L2118, L2415, L2807, L3278; damage.ts L756, L899, L999, L1098, L1392; efficiency.ts L273, L471; shrines.ts L80). **Disputed (C18, confidence L):** the source lens confirms the split as stated in the misc.ts comment (L1073-1075); the game-data lens finds that the parser's `getGoldenFoodMultiplier` always returns `1 + bonus/100` for every effect, so the additive/multiplicative split is the comment's description of the game, not implemented in Toolbox code. Correction: treat the split as a game-side claim and do not rely on Toolbox to apply it per effect. [C18]
- The 17 golden foods (items.json, Type GOLDEN_FOOD) with Effect and base `Amount`: Golden Peanut (PeanutG) MiningEff 30; Golden Jam (FoodG1) MaxHPpct 30; Golden Kebabs (G2) Damage 20; Golden Meat Pie (G3) Defence 30; Golden Nomwich (G4) BaseDamage 400; Golden Ham (G5) SkillExp 18; Golden Bread (G6) MonsterCash 30; Golden Ribs (G7) FishingEff 40; Golden Cheese (G8) ShrineEffect 20; Golden Grilled Cheese Nomwich (G9) AllStatz 10; Golden Hampter Gummy Candy (G10) SailAFKz 23 (W5); Golden Nigiri (G11) ClassEXPz 40; Golden Dumpling (G12) AllAFK 4; Golden Cake (G13) DropRatez 8; Golden Saltwater Taffy (G14) SpelunkEXPz 1 (W7); Golden Sugar Cookie (G15) DropRatez 2; Butter Bar BaseAcc 60 (Type GOLDEN_FOOD per Toolbox data, counted by the same formula). Parser matches by Effect, not name. Golden foods carry Trigger -1337 and Cooldown 1 in items.json; Butter Bar (BaseAcc 60) is the 17th GOLDEN_FOOD. [C8][C10] (H, all 17 values verified)
- Two foods share DropRatez, so both contribute if both equipped. [C10] (H)

### M5. Golden Food multiplier (`getGoldenFoodMulti`, per character)
`value = (1 + (SecretSet + 50*Verminous)/100) * (max(familyFactor,1) + (gear8 + obols + HungryForGold + stamp + ach37 + bubble + sigil + meals + starSign + bribe + charm + 2*ach380 + 3*ach383 + vote26 + ApocalypseWow*apocalypses + purpMushroom + legend25 + cards + vanillie + 1e4*verminous + vault86 + jelly10 + jelly51)/100)` (T/misc.ts#L923-L1031). Treat as a factor on bonus (value 1 = no boost). [C19] (H; matches the code structure exactly)
Components, with their data:
- Family bonus: Shaman family bonus is `classFamilyBonuses[33]` "HIGHER_BONUSES_FROM_GOLDEN_FOODS", func decayMulti x1 0.4 x2 100, unlocks at class level 29; `factor = 1 + 0.4*L/(L+100)` with `L = level - 29`, so max 1.4x; THE_FAMILY_GUY (Blood Berserker, Divine Knight, Siege Breaker, Beast Master, Elemental Sorcerer, Bubonic Conjuror; decay x1 40 x2 100) enlarges family bonuses for the character who has it. Toolbox field `characters[].familyBonuses.Shaman`. Data verified: decayMulti x1 0.4 x2 100, THE_FAMILY_GUY x1 40 x2 100, x3 29. "Max 1.4x" is the asymptote of the decay formula, not a coded cap; the family bonus is also modified per character (family.ts walk); the Shaman mapping of index 33 was not independently confirmed. [C20] (M)
- Gear stat (`getStatsFromGear(character, 8)`) and obols (`bonuses.etcBonuses[8]`): equipment/obol bonus "% Golden Food". [C19]
- HAUNGRY_FOR_GOLD (Warrior line talent, decay x1 55 x2 80): up to +55% by level. [C21] (H)
- Golden Apple Stamp (StampC7, stat GFood, +1 per level, req Golden Nomwich). [C17] (H)
- Achievement 37 Nutty_Crafter (craft 42 Golden Peanuts): +5% for all characters (TaskAchA38, achievement index 37, verified). [C22] (H)
- Bubble SHIMMERON (power cauldron index _18, decay x1 80 x2 40, so +80% asymptote). Toolbox reads it with the strength-class bubble flag. [C23] (H)
- Sigil EMOJI_VEGGIE (unlock 10, boost 25, jade 40, ethereal 60, eclectic 80%). Unlock cost 4,500; boost 33,000 (sigil points); jade 480,000. [C24] (H)
- Cooking meal zGoldFood: Yumi Peachring (cookReq 8e14, baseStat 2 per level). [C25] (H)
- Star sign `Golden_Food` (Beanbie_Major gives +20%, cost 3 slots). [C26] (H)
- Bribe Gold_from_Lead: +10%, price 7.1e19 coins. [C27] (H)
- Charm Gumm_Stick (Pristine charm, W6 sneaking; x1 3 x2 14 x3 50). [C28] (H)
- Achievements 380 (Beanstacker Trainee: 5 different golden foods on the Beanstalk, +2%) and 383 (Beanstacker Prodigy: 14 different, +3%): each is counted at 2x and 3x of the status (so up to +4 and +9 as coded; TaskAchF31/F34 verified). [C29] (H)
- Vote index 26 (Ballot bonus; best match is "Midusian Appetite" text but that is legend talent 25; vote bonus 26 not identified; the code does read vote ballot index 26 via getVoteBonus at voteBallot.ts L157). [C30] (L for the identity, H that the index is read)
- Apocalypse Wow (Death Bringer talent, decay x1 2 x2 200): +% per billion-kill class ("apocalypses" = last Blood Berserker line character `wow.finished[0]`). [C31] (H)
- Companions: Purp Mushroom (index 48, +5, upgraded +7); Vanillie (155, +2500%, upgraded +4000%); Verminous (174, +10000% additive and 1.5x; upgraded +20000% and 2x; the 1.5x/2x is the outer (1+50*bonus/100) term). Vanillie and Verminous are pet-shop items, effectively late game. [C32] (H)
- Legend talent 25 Midusian Appetite (W7): +% additive (x1 3, x2 500). [C33] (H)
- Cards: cropfallEvent1 (min(4*cardLv,50)) and anni5Event1 (min(5*cardLv,50)), each capped at 50, summed up to +100. Event cards; each card capped at 50 separately. [C34] (H)
- Upgrade Vault 86 "24 Karat Foods": +% golden food bonuses, max level 50, unlock level 7000, cost x1 4e19 growth 4. [C35] (H)
- Jelly Operator indices 10 and 51 (W7); getJellyBonus indices 10 and 51 verified. [C36] (H)
- Armor set SECRET_SET: "}x Gold Food effect", bonusValue 25 (description "}x Gold Food effect", a multiplier). Pieces: EquipmentHats61, EquipmentPunching11, EquipmentShirts31, Trophy3, EquipmentNametag4. [C37] (H)
W1-4 reachable now (M, derived): family bonus, talents, gear/obols, stamp, ach37, bubble, sigil, meals (late W4), star sign, bribe (late), and the ach pair needs Jade. Everything else is W5+.

### M6. Double Golden Food Drop
- Chance: `getDoubleGoldenFoodDrop = Tesseract bonus 30 + Palette bonus 24 + Big Fish (advice fish) 5`, percent, additive (T/misc.ts#L89-L130). All three sources are W5+; none is reachable in W1-4. [C38] (H)
- Size: `Math.round(2 + (Legend talent 2 "Double Aint Enough")/100) * (bon_k bundle ? 2 : 1)` (T/misc.ts#L113 and getDoubleDropSize). Hardhat (Grey Hardhat) is not used for golden food. Bundle bon_k doubles Statue and Gold Food drops, and the Advice_on_Materialism fish bonus doubles Gold Food drop chance. [C38] (H; the bundle and fish effects come from the verifier list and shared-data, M)
- Also "Parallel Golden Food" (W7 data): % chance for Golden Food to drop at 2x. [C39] (H)

### M7. Where golden foods drop (D/monsterDrops.json)
- Typical entry: `chance 0.5, quantity 1, dropTable SuperDropTable1, tableChance` giving `effectiveChance` as low as 6e-6 on weak monsters up to 1.2e-3 on Crystal monsters. Crystal Carrot (Crystal0) has 5 DropTables for G4 ranging 1.0e-3 to 1.8e-3 (1.2e-3 is one of them). Green Mushroom G4 is 6e-6, Efaunt G3 is 3e-3, W1 Golden Chest G1 is 0.5. [C40] (H)
- W1: Golden Nomwich (FoodG4) from nearly every W1 monster and mining/chop nodes; Golden Jam from the W1 Golden Chest (ChestC1, 0.5). W2: Golden Meat Pie from W2 monsters, Efaunt (Boss2A 0.003) and chests; Golden Kebabs from the W2 chest ChestB2. W3: Golden Ham and Golden Cheese from W3 monsters, bosses and chests; Golden Bread from the W3 chest ChestC3. W4: Golden Ribs from W4 monsters, bosses, fish/bug nodes. W5: Gummy Candy (G10) and Grilled Cheese Nomwich (G9). W6: Nigiri (G11), Dumpling (G12). W7: Taffy (G14). Golden Cake (G13) from mini bosses mini5a/mini6a (and recipe item). Sugar Cookie (G15) not seen in drops (crafted/event). [C40] (M for the per-world listing, H for the quoted numbers)
- Golden Peanut: crafted (achievement 37 says "craft 42 golden peanuts"). [C22]

### M8. Beanstalk (W6, one line)
- Jade unlock `Gold_Food_Beanstalk`: drop a stack of 10,000 golden food; `Supersized Gold Beanstacking` allows 100,000; the item text mentions 1M stacks. `sneaking.beanstalkData[i]` rank 0..3 per food (BEANSTALK_BREAKPOINTS [10k,100k,1M], T/misc.ts#L1033), effective stack = `1000 * 10^rank`; the game stops at the first food with a matching Effect. [C11][C12]

### W5+ extensions (one line each)
- Tesseract, Palette (Gaming), Big Fish advice, Vault 24 Karat Foods, Jelly Operator, Legend talent, Armor set, Cards, Companions, Verminous: more multiplier or double-drop sources (see M5, M6). [C19][C38]
- Sailing artifacts, Button task `ButtonBonusNames[47]` exposes golden food multi as a task stat (T/world-7/button.ts#L364, case 47 returns `100*(multi-1)`). Note that a different switch at button.ts#L278 has case 47 returning 0 ("not parsed"); cite the L364 function only. [C41] (H)

## Min-max by stage

W1 early: The first Golden Nomwich (BaseDamage) drops from almost any W1 monster at tiny odds; keep every Golden Food you find and equip it (it is never consumed). Equip health food that heals above your hit pattern; use potions only for the skill you are AFKing. [C40][C8]
W1 mid/late: Buy the Gem Shop Food Slot if gems are spare (450 + 750). Craft Golden Peanuts toward ach37 (42 crafts = +5% to all multi). Equip Nomwich (damage) and Jam (HP) by priority. Warrior line gets HAUNGRY_FOR_GOLD from talent books. [C4][C22][C21]
W2: Golden Meat Pie (Defence) and Kebabs join. Alchemy: SHIMMERON bubble is a poor upgrade by its own description but adds up to +80% multi; sigil EMOJI_VEGGIE is a better target when sigil points are free. Stamp Golden Apple is the cheapest percent. [C23][C24][C17]
W3: Golden Ham (SkillExp), Golden Cheese (shrines) and Bread are available. W3 Merit Shop food slot row (3 merits, two levels give slots): community dossier ranks Build/Food slot row first, another gist ranks Telekinetic/Library first (contested, confidence L). Tiers: the gist is tier 3 and the W3 community dossier is tier 4 (the yaml tags the wiki as tier 2, which conflicts with ADR 0004). [C5][C42] (L)
W4: Golden Ribs (Fishing/Catching) and mini-boss Golden Cake (drop rate) appear; Cooking meal Yumi Peachring is the first meal-based multiplier (cookReq 8e14, 2 per level). Bribe Gold_from_Lead is far end of W4 coins (7.1e19). [C25][C27][C40]
Priority order that the data supports (no community source found): (1) fill every food slot; (2) stack the golden foods whose effect your main AFK uses (damage, drop rate, class exp); (3) multiply with cheap percent sources (stamp, ach37, star sign, bribe); (4) grow stacks, since one more 10x multiplies the bonus about 1.5-1.6x. [C10]
W5+: Verminous and Vanillie pets, Beanstalk, Palette and Tesseract double drops, Vault 24 Karat Foods, Legend talent, Armor set: the late-game golden food engine. [C32][C35]

## Claims

(see structured output for the full list, numbered C1..C42)

## Corrections and added mechanics (2026-10-19 verification)

All 42 claims survived; none was refuted by both lenses. Changes: C3 range corrected, C18 marked Disputed, C6 and C42 downgraded to L, C40/C41/C9/C20 qualified inline. Added mechanics follow. Source for all rows below: `D/items.json` (tier 1, verified 2026-10-19, game 2.3.540), confidence H unless stated.

### M2a. Full HEALTH_FOOD roster (22), Amount / Trigger% / Cooldown s
Nomwich 20/50/30; Hot Dog 50/50/30; Cheezy Pizza 125/50/30; Peanut 80/75/20; Cranberry Jam 200/50/30; Kebab Sticks 300/50/30; Meat Pie 500/50/30; Saucy Weiner 700/50/30; Crabby Cake Supreme 700/35/60; Mountain Bread 750/50/30; Yeti Ham 1000/60/30; Sheepie Dairy 1500/50/30; Magic Meatloaf 2000/30/10; Cupcake 3000/70/30; Spicy Space Ribs 6000/50/25; Lemon Slice 8000/60/22; Grilled Cheese Nomwich 12500/70/20; Raw Nigiri 20000/70/20; Dumpling 40000/70/20; Saltwater Taffy 60000/70/20; Sugar Cookie 80000/70/20; Milk Choco 1000/80/12. Trigger therefore spans 30-80% and Cooldown 10-60 s. ActiveOn implication: AFK health-food math must read Trigger and Cooldown per item, not assume 50%/30 s. [C3 correction]

### M3a. BOOST_FOOD families not listed above (Effect, Amount, Trigger, Cooldown)
- Mana potions (ManaRegenBoosts, Trigger -3): Small 20 (cd 2), Average 30 (cd 2), Decent 40 (cd 1), Potent 50 (cd 1).
- Pearls: Aqua Pearl FishingSpeedBoosts 30 (-7); Stained Pearl MiningSpeedBoosts 30 (-4); Shiny Pearl ClassEXP 25 (-1).
- Weapon power (WeaponPowerBoosts, Trigger -1): Bullet 1 (cd 15), FMJ Bullet 2 (cd 12), Coldseeker Bullet 9 (cd 5), Midnight Cookie 5 (cd 2), Cherry Choco 5 (cd 10).
- Event foods: Minto Choco MoveSpdBoosts 8 (-2); Lemony Choco ClassEXP 30 (-1); Giftybread Man MiningSpeedBoosts 25 (-4, cd 3); Chogg Nog ChoppinSpeedBoosts 25 (-6); Candy Canes FishingSpeedBoosts 25 (-7, cd 3); Mistleberries CatchingSpeedBoosts 25 (-8). Milk Choco (FoodEvent8) is a health food.
- Non-golden Effect foods use `getFoodBonus` with the `getPlayerFoodBonus` multiplier (boost food sums Amount * bonus); health uses the Trigger>0 filter.
- Carepack_From_Mum uses separate post-office indices: idx 1 for health food, idx 2 for boost food; card Y5 and the FROTHY_MALK star talent apply to boost food only. [source lens, M]

### M8a. Beanstalk, achievements, quests and shops (one-liners, W6+ unless noted)
- The Beanstalk list is the non-numeric entries of `ninjaExtraInfo[29]`; Jade upgrades `Gold_Food_Beanstalk` (10k stack) and `Supersized_Gold_Beanstacking` (100k stack) gate ranks 1 and 2 (Supersized unlocks the 100k rank). [H, T/misc.ts#L1033-1072]
- Achievement counter `Total_Golden_Food_Beanstacks_` counts a Supersized stack as 2. Task "Have 16 or more Millionmega Gold Foods on the Beanstalk" needs the Sad Urie questline first (shared-data.json L7936). [H]
- Merit Shop / task requirement "Have a total of {% Golden Food Bonus as shown by The Beanstalk" (shared-data.json around L3282). `Gold_Food_Coupon` quest items and a "Gold_Food" 100x shop entry (FoodG, x1 12) exist. [M, not re-read]
- Gold Food 2x Quantity also applies to AFK gains (shared-data around L49437). [M]
- Research grid contains total-Golden-Food-bonus squares (research.json L1310, L1351). [M]
- Craft chain: Golden Jam via the Picnic Stowaway achievement; Golden Peanut craft (ach37 above). [M]
- Jade upgrade Deal_Sweetening (+25% Magic Beans) is adjacent to the Beanstalk; the Magic Bean merchant economy is not covered here (out of scope, L).
- Per-claim tier note for C12: `beanstalkData: number[]` at generated-types.ts#L1623 (tier 1, H); Jade is W6.

## Open questions (carried)
- Base unlocked food-slot count and the true buffer size (not in vendor data).
- Source of the 4 "free later" food slots mentioned in the Gem Shop text.
- Identity of vote ballot bonus 26.
- Tier-4 community meta remains thin (Reddit not fetchable in the original run).
