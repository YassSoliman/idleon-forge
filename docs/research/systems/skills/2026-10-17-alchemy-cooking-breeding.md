# System Dossiers: Alchemy (as a skill), Cooking, Breeding

- **Verified:** 2026-10-17, game v1.23 "Lumi Menagerie" (2026-10-16/17).
- **Ticket:** [#25](https://github.com/YassSoliman/idleon-forge/issues/25), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Format: [SYSTEM-DOSSIER.md](../../SYSTEM-DOSSIER.md). Terms: [GLOSSARY.md](../../../../GLOSSARY.md).
- **Pinned sources:**
  - Toolbox [@ 6827d3f2](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2) (2026-10-17, gameVer 2.3.540, so v1.23 is covered).
  - `N.js` (Last-Modified 2026-10-17, patch note `Luminous_Menagerie_v1.23` @14132571).
  - idleon.wiki bot-data pages: [Alchemy](https://idleon.wiki/wiki/Alchemy) (rev 2026-10-05), [Cooking](https://idleon.wiki/wiki/Cooking) (rev 2026-10-13, carries an "outdated: Cooking Mastery added via Rift" banner), [Breeding](https://idleon.wiki/wiki/Breeding) (rev 2026-10-14, "needs cleanup" banner). **All predate v1.23.**
- **Scope note:** this file covers the **skill side**: levels, who to station where, and what the station produces. The Alchemy Bubbles, Vials, Sigils, Meals, Spices, Pets and Territories Systems are written by the W2 and W4 cluster dossiers and are only cross-linked here.

**v1.23 changes that touch these skills** (N.js patch note @14132571):
- "Auto Cooking Ladle use" is a W7 Menagerie unlock.
- "No Meal Left Behind will now cap out at Lv.150 for all meals".
- "1 new Alchemy Liquid Shop purchase".
- Toolbox 3.3.96 adds "Breeding: Crucible arena bonuses" (W7).
- None of these changes W1–W4 choices. Flag: once an account has the Menagerie, ladle advice changes. (H)

---

## Alchemy (as a skill)

- **What it is:** the per-character Alchemy skill. Each character is **assigned** to one brewing cauldron (Power, Quicc, High-IQ, Kazam), a liquid cauldron (Water Drops, Liquid N2, Trench H2O, Toxic Mercury) or, later, a Sigil. It fills that station's bar, which unlocks and boosts bubbles, fills liquids or levels sigils, and the character gains Alchemy EXP. Shaman's specialty; main stat WIS ([wiki Alchemy](https://idleon.wiki/wiki/Alchemy), [Skills](https://idleon.wiki/wiki/Skills)). (H)
- **Unlocks:**
  - W2 Yum-Yum Desert town. "Each character must go to World 2 town and click on the cauldron! They cannot gain experience nor be assigned to cauldrons until this is done!" (wiki).
  - Liquid cauldrons unlock by Alchemy level: Water Drops at Lv 1, Liquid N2 at 20, Trench H2O at 35 (also Liquid Shop 2), Toxic Mercury at 80 (wiki "Liquids").
  - Sigils are levelled by assigning players once the W4 Lab node **Sigils of Olden Alchemy** is connected ([`shared-data.json` `labBonuses`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L18020)). (H)
- **Scope:** both. Alchemy level and assignment are per character. Cauldrons, bubbles, liquids and sigils are account-wide. The save stores one activity code per character: 0–3 = brewing cauldron, 4–7 = liquid, ≥100 = sigil index + 100, −1 = none ([`parsers/world-2/alchemy.ts` L94-97, L239, L842-848](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-2/alchemy.ts#L94-L97)). (H)
- **Inputs → outputs:**
  - Input: the character's brew speed. Output: bar progress and Alchemy EXP.
  - **Brew speed per character** = `round(AlchLv^0.8) × (1 + stamp, guild, Brewstachio bubble, Potion Package PO box) × (1 + p2wSpeed × AlchLv × WIS-curve multi × (1 + Busy Brewin', Broken Time, star signs)/100) × Mafioso companion` ([`getCharacterBrewSpeed` L706](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-2/alchemy.ts#L706)).
  - **Cauldron total** = the sum over assigned characters × the cauldron multiplier (vial, p2w, Ivory, Speed boost) ([`applyBrewSpeeds` L784](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-2/alchemy.ts#L784)). Because it is a plain sum, **every assigned character counts, whatever its AFK target** (H, from the code: no `afkType` check).
  - Liquid cauldrons give the assigned character **2× Alchemy EXP** compared with brewing cauldrons (wiki "Liquids"). (H)
- **Goals and Milestones:**

| Milestone | Reward | Source |
|---|---|---|
| Visit the W2 cauldron (each character) | Can be assigned and gain EXP | wiki |
| Alchemy Lv 20 / 35 / 80 | Liquid N2 / Trench H2O + Liquid Shop 2 / Toxic Mercury cauldrons | wiki Liquids |
| Each Alchemy Lv | Brew speed rises as `Lv^0.8` and linearly in the WIS term | `getCharacterBrewSpeed` |
| Bubble unlock charge 0.01 → 0.15 → 0.75 → 5 → 20 → 88 → 277 … | Next bubble in that cauldron (the bar can be overfilled) | wiki "Brewing" table |
| Cauldron Boost (Speed / Cost / Luck / 2x), max 170 each | Speed +5%/Lv for that cauldron, cheaper bubbles, new-bubble luck | wiki "Boost" |
| Total Alchemy Lv (all characters) 400 / 1000 | +10% / +25% all skill EXP (Rift Skill Mastery, W4) | wiki Skilling EXP table |

- **Feeds / fed by:**
  - **Feeds:** Alchemy Bubbles (new unlocks and boosts), Liquids (spent on bubble upgrades, vial upgrades and the Liquid Shop: obols, upgrade stones, Distilled/Dense Water for recipes, gems, a tab-2 Talent Point that is never reset, Bargain Tags), and Sigils.
  - **Fed by:** Shaman talents Busy Brewin' (this character's brew speed), Bubble Breakthrough (+Alch EXP and new-bubble odds when brewing on this player) and Sharing Some Smarts (+Alch EXP to everyone in the same cauldron) ([talents.json Shaman L4889+](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L4889)); the WIS stat; the Cauldron statue (boosted by Shaman's Stupendous Statues); the Brewstachio bubble; Potion Package (Post Office); the guild; stamps; the Ivory Cauldron and other gem-shop upgrades. (H)
- **Per-session actions:**
  - Check that every character has an activity: `alchemy.activities[i].activity !== -1`. That is Toolbox's `alchemyAlerts.noActivity` ([`characters.js` L110-126](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/utility/dashboard/characters.js#L110-L126)).
  - Empty a full cauldron: claim the bubble, or Boost.
  - **Spend liquids before they cap.** Liquids stop generating when the bar is full (wiki). Toolbox has an account alert `alchemy.liquids`.
  - Buy the daily Bargain Tags. (H)
- **AFK Setup implications:**
  - Assignment is free: put **every** character somewhere, always.
  - Put the highest-Alchemy, highest-WIS characters (Shaman, then other Mages) on the cauldron that holds the current Goal, for example the cauldron with the next bubble that a Spend Plan targets.
  - Put low-Alchemy characters on a liquid cauldron. They level faster there (2× EXP) and liquids are needed constantly.
  - Group with the Shaman for Sharing Some Smarts.
- **Min-max by stage:**
  - **Early W2:** all characters visit the cauldron. The Shaman (Meta Path slot 3) brews in the cauldron the bubble guides prioritise (shadowstorm W2: "potions on your main pusher"; the Reddit Mega Guide: "don't do sigils until you unlock all bubbles" (L), [meta-sources](https://github.com/YassSoliman/idleon-forge/blob/research/meta-sources/docs/research/2026-10-16-meta-sources.md)).
  - **Mid W2–W3:** Alchemy Lv 20 on one character for Liquid N2, then 35 for Trench H2O. Rotate low characters through Water Drops.
  - **W4:** connect Sigils of Olden Alchemy and move spare characters to sigils.
  - **Per class:** Shaman, inherited by Bubonic Conjuror and Arcane Cultist. Mage-line WIS helps every character's brew speed.
- **Common mistakes:**
  - (1) A character never visited the cauldron, so Alchemy stays at Lv 1. Detect it with `skillsInfo.alchemy.level <= 1` on a W2+ account.
  - (2) Unassigned characters (`activity === -1`).
  - (3) Liquids capped (`account.alchemy.liquids` against capacity).
  - (4) Two strong brewers split across cauldrons when the Goal is one bubble.
  - Both test accounts had every character assigned. That account-level check passes.
- **Save and Toolbox fields:**
  - `account.alchemy.{activities[], cauldrons{power,quicc,high-iq,kazam}.{players[],progress,req,boosts,brewSpeed}, liquidCauldrons, liquids, p2w, bubbles, vials}`.
  - `characters[].skillsInfo.alchemy`.
  - `characters[].equippedBubbles`.
  - Toolbox-computed: `cauldrons[].brewSpeed` (from `applyBrewSpeeds`), `getCharacterBrewSpeed`, `getExpectedNewBubbles`, and the dashboard alerts `alchemy.liquids`, `alchemy.vials`, `alchemy.p2wUpgrades`, `alchemy.sigils` ([`utility/dashboard/account.js` L439-546](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/utility/dashboard/account.js#L439-L546)). (H)

---

## Cooking

- **What it is:** a W4 skill. Kitchens (up to 10, bought with coins) cook **meals** passively at an account-wide speed, and meals level up on the Dinner Table to give permanent bonuses. **A character gains Cooking EXP only by AFK-ing in the W4 town kitchen area**, which also produces **Cooking Ladles** (each skips 1 h of kitchen time). Blood Berserker's specialty ([wiki Cooking](https://idleon.wiki/wiki/Cooking); shadowstorm W4: "You only get cooking exp when you afk in kitchen or using balloons" (L)). (H)
- **Unlocks:** W4 Hyperion Nebula town. One kitchen at the start, more for coins. New recipes are found by putting up to 4 spices from Breeding territories on a table; fire and luck decide the odds (wiki "Unlocking Recipes"). (H)
- **Scope:** both. Kitchens, meals, spices and cooking speed are account-wide. Cooking level, EXP, efficiency and ladles are per character. The AFK target `Cooking` is one of the 9 AFK types ([`monsters.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/monsters.json); `getAfkGain` COOKING branch [`character.ts` L3404](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3404)). (H)
- **Inputs → outputs:**
  - Kitchen speed is account-wide: stamps, vials, meals, Diamond Chef bubble, lab jewels, cards, arcade, achievements, Richelin gem upgrade, star sign and farming level of the logged-in character, and more ([`parsers/world-4/cooking.ts` `parseKitchens` L728+](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-4/cooking.ts#L728)). **It does not read any character's Cooking level** (H, from code).
  - The cooking AFK character's **Cooking Efficiency** = `(250 + STR^0.6 × Skill Strengthen + stamp + gear + obols + mastery + Chef's Essentials PO + base-eff pool) × (all-eff pool, Apocalypse Chow, Brute Efficiency, gear, obols)` ([`getCookingEffParts` L144](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-4/cooking.ts#L144)).
  - Cooking AFK gains get BB's Waiting To Cool on top of the normal skill AFK pool (`character.ts` L3404-3420).
  - **So the kitchen AFK slot produces Cooking EXP and ladles, not meals.** (H)
- **Goals and Milestones:**

| Milestone | Reward | Source |
|---|---|---|
| Kitchens 1 → 10 | More parallel meals | wiki |
| Meal Lv cap 30 (base); +17 from the Causticolumn artifact, +20 Jade Emporium, +20 Death Bringer Grimoire, +30 W7 Spelunking | Higher meal bonuses | `wikiTables.mealMaxLevel {base: 30, artifact: 17}`; shadowstorm W4 list (L) |
| Meal Lv 11 (diamond) / 30 (void) counts | Diamond Chef bubble and Void Plate Chef atom multipliers | `parseKitchens` (`diamondMeals`, `voidMeals`) |
| Blood Berserker Cooking Lv every 10 | +Weapon Power (Tough Steaks) | [talents.json BB](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L1873) |
| Total Cooking Lv (all characters) 400 / 1000 | Rift Skill Mastery +10% / +25% all skill EXP | wiki |
| No Meal Left Behind (Lab / atom) | Auto-levels low meals, **capped at Lv 150 since v1.23** | N.js v1.23 note |

- **Feeds / fed by:**
  - **Meals feed** nearly every System through their bonuses (e.g. Leek +skilling prowess, Pretzel +Lab EXP, Sea Urchin +critters from traps, Spaghetti +Breeding EXP, Mashed Potato +Cooking EXP, wiki meal list).
  - **Meals are also a currency:** 100 of a meal is part of every Lab chip's cost (Turkey of Thank → Grounded Nanochip, Egg → Grounded Motherboard, Pizza → Conductive Nanochip, …) ([`shared-data.json` `chips` L3562](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L3562)), and meals pay for Breeding upgrades (wiki Breeding upgrade costs: Turkey of Thank, Pancakes, …).
  - **Fed by** Breeding (spices unlock recipes), the Lab (Amethyst Rhinestone, Emerald Pyramite and Sapphire Pyramite jewels), and BB talents Taste Test, Apocalypse Chow, Waiting To Cool and Overflowing Ladle (`talents.json` BB L1873-1896). (H)
- **Per-session actions:**
  - Re-queue finished kitchens on the meal the Goal needs.
  - Use ladles on the meal closest to its next level. **Ladles used on a Blood Berserker give more AFK time** (Overflowing Ladle).
  - Spend spices on recipe discovery.
  - Toolbox alerts: `cooking.meals`, `cooking.spices`, `cooking.mealLadleCost`, `cooking.ribbons`, `cooking.cookingMastery` ([`account.js` getWorld4Alerts L949-1058](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/utility/dashboard/account.js#L949-L1058)). (H)
- **AFK Setup implications:**
  - **One cooking AFK character is enough**, normally the Blood Berserker. It is the cooking class (Waiting To Cool gives +Cooking AFK gains, Overflowing Ladle helps ladles), and STR drives cooking efficiency.
  - Other characters gain nothing for the kitchens by AFK-ing there. They should fight, gather or sit in the Lab instead.
  - Community W4 advice puts the BB on AFK fighting when pushing ("use Blood Berserker as he is the best class when it comes to afk", shadowstorm W4 (L)), which competes with the cooking slot. ActiveOn should frame this as a Leverage choice.
- **Min-max by stage:**
  - **W4 entry:** unlock kitchens with coins, then discover recipes with the spices you have. A Breeding territory must be won first.
  - **Mid W4:** Lab jewels for meal speed, then level meals that feed current Goals.
  - **Late W4 / W5:** meal cap raises (Causticolumn artifact from Sailing in W5).
  - **Per class:** Blood Berserker (Barbarian line; [talents.json BB](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L1873)). Voidwalker's Blood Marrow multiplies meal speed account-wide.
- **Common mistakes:**
  - (1) Parking several characters in the kitchen expecting faster meals.
  - (2) Idle kitchens: a table with no meal queued.
  - (3) Hoarding ladles.
  - (4) No BB, so poor ladle value.
  - Detect them through `account.cooking.kitchens[]` and from `characters[].afkTarget === 'Cooking'` counts. Neither test account has reached W4.
- **Save and Toolbox fields:**
  - `account.cooking.{meals[] {name, level, amount, cookReq, …}, spices, mealMaxLevel, cookingMastery, kitchens[]}`.
  - `characters[].afkTarget` = `"Cooking"`.
  - `characters[].skillsInfo.cooking`.
  - Toolbox-computed: kitchen speeds and meal times (`calcMealTime`, `calcTimeToNextLevel`, `getTotalMealSpeed`), `getCookingEff`, `getHighestOverflowingLadle`. (H)

---

## Breeding

- **What it is:**
  - A W4 town skill. An incubator makes eggs (one per 2 h; 3 stored at first). Hatching and breeding eggs into **mobs (pets)** unlocks new species.
  - Pets fight Territory Battles, which unlock **spice** forage spots that pets then forage.
  - Pets also fight the endless **Arena** for account bonuses, and **shiny** pets level passive bonuses in the Fenceyard.
  - Beast Master's specialty ([wiki Breeding](https://idleon.wiki/wiki/Breeding), rev 2026-10-14). (H)
- **Unlocks:** W4 town; the first breed is a guaranteed Green Mushroom. Breeding level gates the upgrades:

| Breeding Lv | Upgrade unlocked (max Lv) |
|---|---|
| 1 | Gene Splicing (20): gene boosting with the DNA Splicer tool |
| 5 | Egg Capacity (5) |
| 8 | Mob Arena opens (wiki "Fighting") |
| 10 | Breedability Mobs (10) |
| 15 | Fence Extension (10) |
| 20 | Rarity of the Egg (10): egg rarity, more Breeding EXP |
| 25 | Blooming Axe (10) |
| 30 | Pastpresent Brood (5) |
| 40 | Paint Bucket (100): **shiny pets** |
| 50 / 60 / 70 / 80 | Overwhelmed Golden Egg / Failsafe Restitution Cloud / Shattershell Iteration / Grand Martial of Shinytown |

  Levels come from the wiki's bot table ("Level Unlocked"). Max levels match Toolbox [`shared-data.json` `petUpgrades`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json). (H)
- **Scope:** mostly account-wide: pets, eggs, territories, arena and upgrades. Breeding level and EXP are per character. **Breeding EXP goes to the character who hatches the eggs.** Beast Master's Shining Beacon of Egg and Curviture of the Paw apply "no matter which player you hatch eggs on" ([talents.json BM L3811](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L3811)). **Breeding is not an AFK target.** (H)
- **Inputs → outputs:**
  - Eggs: from the incubator timer, and from Beast Master's I Dream Of Peace And Egg (a chance for 3 eggs per 10 h of AFK claims, no candy).
  - Hatching gives pets plus Breeding EXP (higher-rarity eggs give more).
  - Dead DNA (from trashing pets) pays for upgrades. Territories give spices. Arena waves give bonuses. Shiny pets give passives.
  - **DNA Splicers** turn a fighting character's AFK gains into DNA Spirals for gene boosting. This is an **AFK Setup** hook: equip a splicer while AFK-fighting. Best maps per world (shadowstorm W4 (L)): Frogs, Sand Giants, Sir Staches, Soda Cans. Gains decay with claim length, so claim at about 1 h or use candies.
- **Goals and Milestones (Arena, game data [`shared-data.json` `arenaBonuses`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json)):**

| Arena wave | Bonus |
|---|---|
| 2 / 15 / 50 / 125 | Unlocks 3rd / 4th / 5th / 6th mob battle slot |
| 5 / 80 | +25% / +60% Library VIP membership |
| 8 / 200 | 1.20× / 1.40× total damage |
| 12 / 25 / 65 | New Post Office upgrade crate |
| 20 / 175 | 1.5× / 2× monster cash |
| 35 | −50% kitchen upgrade costs |
| 100 | **Can equip a 3rd large bubble** (also checked by Toolbox `alchemyAlerts.missingBubbles`) |
| 150 | +20% Lab line width for all players |

  Shiny pets of note for skilling: Walking Stick and Octodar give +base critters per trap; Carrotman, Gigafrog, Mashed Potato and Sand Giant give +20 base efficiency for all skills per level; Crabcake, Thermister and Clammie give +Skill EXP; Mallay gives +Lab line width. Shiny levels cap at 20 (wiki "Unlockable Mobs", shadowstorm W4). The v1.23 **Crucible** arena (W7) is out of W1–W4 scope.
- **Feeds / fed by:**
  - **Feeds:** Cooking (spices unlock recipes, and 100 of a spice is part of each Lab chip cost), Alchemy (3rd bubble slot), the Lab (line width), Post Office, damage, and Trapping and all skills (shiny pets).
  - **Fed by:** the Mutated Mush mobs and the W4 Colosseum for eggs (shadowstorm W4 (L)); Cooking (meals pay for upgrades, and Spaghetti / Potato P Pastry / Eggplant meals); the Lab (Emerald Rhinestone and Emerald Ulthurite jewels, Animal Farm node: +1% damage per species bred); BM talents; the Nest Eggs stamp; the TV card.
- **Per-session actions:**
  - Hatch or breed when the incubator is full. **When the incubator is full, new eggs are wasted** until Rarity of the Egg is bought (shadowstorm W4 (L); the wiki says a full incubator rolls rarity instead).
  - Claim spices; place pets on newly won territories; push the arena when pets improve.
  - Toolbox alerts: `breeding.eggs`, `breeding.eggsRarity`, `breeding.shinies`, `breeding.breedability`. (H)
- **AFK Setup implications:**
  - No breeding AFK slot exists. The AFK-relevant parts are **DNA Splicers on fighters**, and claiming AFK gains often enough that egg and spice timers do not cap.
  - The star talent "spice spillage" gives a chance to collect all spices when claiming over 1 h of AFK (shadowstorm W4 (L)).
- **Min-max by stage:**
  - **W4 entry:** win the first territories for the Grasslands, Jungle and Encroaching Forest spices that cooking needs.
  - **Next:** Egg Capacity (Lv 5), Arena waves 2 and 15 for battle slots, Breeding Lv 20 for Rarity of the Egg.
  - **Mid W4:** Lv 40 for shinies. Shiny pets that raise skill efficiency and critters.
  - **Late:** Arena wave 100 for the 3rd bubble slot.
  - **Per class:** Beast Master (Hunter line). Hatch on the BM so its own Breeding level rises too, although the BM talent bonuses apply whoever hatches.
- **Common mistakes:**
  - (1) Incubator left full.
  - (2) Spices unclaimed, or no pets on won territories.
  - (3) Fighters AFK-ing without a splicer once Gene Splicing is unlocked.
  - (4) Never pushing the arena past 100, so no 3rd bubble slot.
  - Detect them from `account.breeding.{eggs, eggCapacity, timeToNextEgg, territories, foragingRounds, maxArenaLevel}`.
- **Save and Toolbox fields:**
  - `account.breeding.{eggs, eggCapacity, timeToNextEgg, pets, storedPets, fencePets, territories, foragingRounds, maxArenaLevel, arenaBonuses, petUpgrades, deadCells, totalShinyLevels, genetics, speciesUnlocks}`.
  - `account.accountOptions[89]` (arena wave, read by Toolbox).
  - `characters[].skillsInfo.breeding`.
  - Toolbox parser [`parsers/world-4/breeding.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-4/breeding.ts). (H)

---

## Sources

- Toolbox @ [6827d3f2](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2):
  - [`parsers/world-2/alchemy.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-2/alchemy.ts), [`parsers/world-4/cooking.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-4/cooking.ts), [`parsers/world-4/breeding.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-4/breeding.ts), [`parsers/character.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts)
  - [`utility/dashboard/characters.js`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/utility/dashboard/characters.js), [`utility/dashboard/account.js`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/utility/dashboard/account.js)
  - [`data/website-data/shared-data.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json) (`chips`, `labBonuses`, `petUpgrades`, `arenaBonuses`), [`talents.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json), [`wikiTables.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/wikiTables.json), [`data/patch-notes.js`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/patch-notes.js)
- [N.js](https://www.legendsofidleon.com/ytGl5oc/N.js) (Last-Modified 2026-10-17): `Luminous_Menagerie_v1.23` note @14132571.
- idleon.wiki: [Alchemy](https://idleon.wiki/wiki/Alchemy) (2026-10-05), [Cooking](https://idleon.wiki/wiki/Cooking) (2026-10-13), [Breeding](https://idleon.wiki/wiki/Breeding) (2026-10-14), [Skills](https://idleon.wiki/wiki/Skills) (2025-06-29, **Stale**, class mapping only). All are pre-v1.23.
- Community (tier 3): shadowstorm2204 "Idleon Complete Guide Sheet" [W2 and W4 tabs](https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview) (post-W7, pre-Royal Guardian, **Stale** for roster advice).
- Reddit not read: Arctic Shift was rate-limited on 2026-10-17. A 2026-10-16 thread, "Welp that explains what they mean by 'auto' ladle usage for cooking" (id 1x7qoye), concerns the v1.23 Menagerie unlock.
