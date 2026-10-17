# Statues (W1)

Part of the [W1 System Dossiers](../2026-10-17-w1-systems.md). The source pins are listed there.

## Statues

- **What it is:** 32 statue types. Statue items drop from monsters, above all Crystal mobs. You deposit them at the Statue Man in the W1 town. Each deposit adds EXP toward the statue's next level, and each level adds a fixed bonus. There is no max level. The tiers Gold (account-wide), Onyx (×2) and Zenith (×3 total) multiply the bonus. (H: Toolbox `parsers/world-1/statues.ts`, `shared-data.json` `statues`; N.js `StatueExpReq`, `StatueBonusGiven`, `Tower2Stats("StatueGoldCost")`; wiki [Statues](https://idleon.wiki/wiki/Statues), rev. 2026-10-14)
- **Unlocks:**
  - **Town Marble** appears in the W1 town once any character reaches **class Lv 22**, and is then bought (OptionsListAccount[250]). The wiki says "for 20".
  - His quest "Visualizing the Sculpture Within…" (hand over the **Sculpting Tools** from the W1 Town Shop) unlocks depositing. The wiki notes **this quest is not account-wide**: each character that wants to deposit must do it.
  - Gold upgrades need the Statue Man turned Gold with **Guilding Tools** (Yum-Yum Grotto shop, W2).
  - Onyx needs Onyx Tools from **Monolith** (W4, map 162).
  - Zenith needs Zenith Tools from **Zenelith** (W7, map 302).
  - (H: N.js actor gate on OLA[250] and `_event_Statue` needing `NPCdialogue.Town_Marble ≥ 3`; Toolbox `quests.json`, `npcPlacements`; wiki for the tool shops.)
- **Scope:** **per character until a statue is Gold, then account-wide.**
  - Each character has its own `StatueLevels` (level and progress per statue). Deposits go to the depositing character.
  - Buying Gold for a statue makes it account-wide, using the **highest** level any character has. Deposits on the other characters are lost (wiki; Toolbox `getHighestLevelStatues`).
  - Class talents multiply some statues on the character that has the talent (table below).
  - Voodoo Statufication (Voidwalker, W5+) multiplies all statues for all characters.
- **Inputs → outputs:**
  - **Statues → levels.** The next level needs `round(L^1.17 · 1.35^(L/10) + 1)` statues at level L (unrounded above L 300). (H: N.js `StatueExpReq`; Toolbox `Statues.jsx`)

| Level | Statues for next level | Cumulative statues from 0 |
|---|---|---|
| 1 | 2 | 1 |
| 10 | 21 | 84 |
| 20 | 62 | 455 |
| 25 | 93 | 822 |
| 40 | 250 | 3,169 |
| 50 | 437 | 6,440 |
| 75 | 1,485 | 27,664 |
| 100 | 4,400 | 93,824 |
| 150 | 31,699 | 781,676 |
| 200 | 199,014 | 5.29M |
| 240 | 818,197 | 22.6M |
| 280 | 3.25M | 92.1M |
| 300 | 6.43M | 184M |

  - **Coins → Gold:** statue n (1-based) costs `floor(min((1e5 + 25e3·n)^(0.95 + 0.03·n), 2.1e9))` coins. (H: N.js `Tower2Stats("StatueGoldCost")`, purchase handler checks `Money >` cost and `StatueG[i] == 0`)
  - **Bonus** = `level × base × class talent × Voodoo Statufication × Onyx (2 + Onyx Lantern artifact) × Zenith (1.5 + Zenith Market) × Dragon statue × Vault 25 (Power, Speed, Mining, Lumberbob only) × event shop × Meritocracy 26`. (H: Toolbox `getStatueBonus`, `applyStatuesMulti`)
  - **Deposit boosts:** the Startue Exp bubble (keeps part of the bar on level-up), the Skinny 0 Cal vial (chance to double), +10% per Onyx statue type and +25% per Zenith type, Statue Flairs (Royal Guardian armory, v1.20 2026-08-26) and Emulsion (Royal Guardian orblet shop). (wiki Statues)

| # | Statue | Bonus per level | Gold cost (coins) | Class talent that boosts it | Main sources (wiki) |
|---|---|---|---|---|---|
| 0 | Power Statue | +3 Base Damage | 98.8K | Squire (Shieldiest) or Barbarian (Strongest) | Level Up Gift, Crystal Carrot, Slime, Baby Boa, Carrotman, and more |
| 1 | Speed Statue | +0.1% Move Speed | 169K | Hunter (Straightshot) or Bowman (Shwifty) | Level Up Gift, Crystal Carrot, Crystal Cattle, Wood Mushroom, Sheepie, and more |
| 2 | Mining Statue | +0.3 Mining Power | 284K | Squire (Shieldiest) or Barbarian (Strongest) | Level Up Gift, Crystal Carrot, Crystal Cattle, Wood Mushroom |
| 3 | Feasty Statue | +1% Food Effect | 470K | Maestro (Skilliest) | Level Up Gift, Poop, Rat, Crystal Carrot, Crystal Cattle, and more |
| 4 | Health Statue | +3 Base Health | 772K | — | Level Up Gift, Crystal Carrot, Glublin, Wode Board, Gigafrog, and more |
| 5 | Kachow Statue | +0.4% Crit Damage | 1.26M | Maestro (Skilliest) | Level Up Gift, Picnic Stowaway — Luncheon with the Inlaws, Tiki Chief — Brochure Building, Monolith — A Lack o |
| 6 | Lumberbob Statue | +0.3 Choppin Power | 2.04M | Wizard (Staring) or Shaman (Stupendous) | Level Up Gift, Crystal Carrot, Crystal Cattle, Wood Mushroom |
| 7 | Thicc Skin Statue | +1 Base Defence | 3.29M | Squire (Shieldiest) | Level Up Gift, Crystal Crabal, Sprout — Sticks and Stone Something Something Bones... |
| 8 | Oceanman Statue | +0.3 Fishing Power | 5.3M | Barbarian (Strongest) | Crystal Crabal |
| 9 | Ol Reliable Statue | +0.3 Catchin Power | 8.51M | Bowman (Shwifty) | Crystal Crabal |
| 10 | Exp Book Statue | +0.1% Class Exp | 13.6M | Wizard (Staring) or Shaman (Stupendous) | Crystal Crabal, Dig Doug, Mafioso, Sand Castle, Pincermin, and more |
| 11 | Anvil Statue | +0.5% Product Spd | 21.8M | Hunter (Straightshot) or Bowman (Shwifty) | Crystal Crabal, Sandy Pot, Mimic, Crabcake, Biggie Hours, and more |
| 12 | Cauldron Statue | +0.5% Alchemy Exp | 34.8M | Shaman (Stupendous) | Crystal Crabal, Tyson, Moonmoon, Sand Giant, Snelbie, and more |
| 13 | Beholder Statue | +0.2% Crit Chance | 55.6M | Wizard (Staring) | Crystal Carrot, Crystal Cattle, Wood Mushroom, Down Undelivery |
| 14 | Bullseye Statue | +0.8% Accuracy | 88.6M | Hunter (Straightshot) | Crystal Carrot, Crystal Cattle, Wood Mushroom, Down Undelivery |
| 15 | Box Statue | +0.3 Trappin Power | 141M | — | Sheepie, Penguin |
| 16 | Twosoul Statue | +0.3 Worship Power | 225M | — | Sir Stache, Quenchie, Royal Worm — Kickin' the Can |
| 17 | EhExPee Statue | +0.1% Skill Exp | 357M | Maestro (Skilliest) | Crystal Cattle, Sheepie, Frost Flake, Sir Stache, Xylobone, and more |
| 18 | Seesaw Statue | +0.5% Cons Exp | 568M | — | Bloque, Cryosnake, Alpine Suppliers |
| 19 | Pecunia Statue | +1% Coins | 904M | — | Crystal Custard, Massive Troll, Chaotic Troll, Blitzkrieg Troll, Purp Mushroom, TV, and more |
| 20 | Mutton Statue | +0.3% Cooking Exp | 1.44B | — | Crystal Custard, Massive Troll, Chaotic Troll, Blitzkrieg Troll, Soda Can, Flying Worm, and more |
| 21 | Egg Statue | +0.4% Breeding Exp | 2.1B | — | Crystal Custard, Massive Troll, Chaotic Troll, Blitzkrieg Troll, Clammie, Octodar, and more |
| 22 | Battleaxe Statue | +0.2% Damage | 2.1B | — | Crystal Capybara, Suggma, Maccie, Mister Brightside, Cheese Nub, Stiltmole, and more |
| 23 | Spiral Statue | +1% Divinity Exp | 2.1B | — | Crystal Capybara, Crawler, Tremor Wurm, Kattlekruk, Chaotic Kattlekruk, Molten Golden Chest |
| 24 | Boat Statue | +0.5% Sailing Spd | 2.1B | — | Crystal Capybara, Molti, Purgatory Stalker, Citringe, Lampar, Fire Spirit, and more |
| 25 | Compost Statue | +0.4% Farming Exp | 2.1B | — | Crystal Candalight, Sprout Spirit, Ricecake, River Spirit, Baby Troll, Woodlin Spirit, and more |
| 26 | Stealth Statue | +0.3% Stealth | 2.1B | — | Crystal Candalight, Bamboo Spirit, Lantern Spirit, Mama Troll, Leek Spirit, Emperor, and more |
| 27 | Essence Statue | +0.6% White Ess | 2.1B | — | Crystal Candalight, Ceramic Spirit, Skydoggie Spirit, Emperor, Potti — Glory to the Crop Depot, Potti — Armor  |
| 28 | Villager Statue | +0.3% Villager Exp | 2.1B | — | Gloomie Mushroom |
| 29 | Dragon Warrior Statue | +0.2% Statues Bonus | 2.1B | — | — |
| 30 | Spelunky Statue | +0.1% Spelunk Exp | 2.1B | — | Crystal Cuttlefish, Equinox Broadbass, Doodlefish, Eamsy Earl, Shellslug, Balloonfish, and more |
| 31 | Reef Coral Statue | +0.02% Daily Coral | 2.1B | — | Crystal Cuttlefish, Equinox Broadbass, Doodlefish, Eamsy Earl, Shellslug, Balloonfish, and more |

  Bonus per level comes from Toolbox `statues[].bonus`, gold cost from the formula, sources from the wiki (I dropped "Random Events" and "Level Up Gift", which appear on most W1 statues). Each class talent gives up to +100% (`decay`, x1 100, x2 50) to its three statues, on that character only. (H: Toolbox `talents.json`; N.js `StatueBonusGiven` talent checks.) The raw StuG grade array is longer than the 32-entry catalog (60 entries in the fixtures).

- **Goals and Milestones:**

| Milestone | Why | Source |
|---|---|---|
| Level 20 on the core W1–W2 statues (Power, Speed, Mining, Feasty, Health, Lumberbob, Ol Reliable, Exp, Anvil, Cauldron, Beholder) and on the W3 Pecunia, Mutton and Egg | AutoReview tier 1 | AutoReview `statues_progressionTiers` (L) |
| Gold on each statue type | Account-wide; stops per-character waste | game rule (H) |
| Level 40 on all of them, then Mining, Feasty and Lumberbob to 150 / 200 / 240 / 280 | AutoReview tiers 6–11 (the skilling statues are the long-term ones) | AutoReview (L) |
| Onyx (a stack of exactly 20,000 dropped on the Statue Man) | ×2 bonus; +10% deposit EXP per Onyx type | wiki (H for ×2 via Toolbox `onyxMulti`) |
| Zenith (a stack of 1,000,000) | ×3 total; +25% deposit EXP per Zenith type | wiki; Toolbox `zenithMulti = 1 + (50 + ZenithMarket0)/100` on top of Onyx |

- **Feeds / fed by:**
  - **Fed by:** drops from monster kills, mostly Crystal mobs (Crystallin stamp, crystal spawn), so drop rate ([Owl](owl.md) Drop Rate, the Post Office Non Predatory Loot Box) and kill rate feed statues. Also Post Office rewards (Power, Feasty, Kachow, Cauldron, Beholder, Bullseye, EhExPee and Seesaw Statues; see [post-office.md](post-office.md)), quests (Sprout: 12 Thicc Skin; Stiltzcho: 10 Speed; Krunk: 2 Speed; Tiki Chief: 50 Kachow; Picnic Stowaway: 3 Kachow), coins (Gold), and later the Royal Guardian (flairs, emulsion).
  - **Feeds:** fighting stats (Power, Health, Thicc Skin, Kachow, Beholder, Bullseye, Battleaxe), food effect (Feasty, which feeds AFK food), skill power and EXP (Mining, Lumberbob, Oceanman, Ol Reliable, Box, Twosoul, EhExPee), Anvil speed (Anvil Statue → [anvil-smithing.md](anvil-smithing.md)), Alchemy EXP (Cauldron), coins (Pecunia), Cooking, Breeding, Divinity, Sailing, Farming, Sneaking, Spelunking and Coral Reef (later worlds).
- **Per-session actions:**
  1. Deposit statues on the right character: the **main** character before Gold, anyone after Gold. Use "Deposit All", which takes from storage too.
  2. Buy Gold for the cheapest statue not yet Gold when coins allow.
  3. Once Onyx is unlocked (W4+), keep stacks heading for 20K instead of depositing them.
  - **Idle state:** statues sitting in storage on an account that has not bought Gold, or has not done Town Marble's quest on the depositing character.
- **AFK Setup implications:** statue farming is fighting on a map with a high Crystal mob rate and good drop rate. Early, the community farms W1 statues at Frogs or Bored Beans ("Bored Beans will be Best W1 Statue Farm Again", r/idleon 2026-08-27, after Royal Guardian). It is an Active Play suggestion until Onyx, when it becomes a real Goal. AFK fighting also drops statues, but r/idleon (2026-06-11) reports that some mobs drop none in AFK.
- **Min-max by stage:**
  - **Early W1:** do Town Marble's quest on the main character and deposit everything there. Before Gold, deposit Power first (damage).
  - **W2:** buy Guilding Tools. Gold in cost order (Power 99K, Speed 169K, Mining 284K, Feasty 470K, Health 772K, Kachow 1.26M, Lumberbob 2.04M …). Every Gold also rescues that statue's levels on the highest character.
  - **W3:** Gold through Bullseye (89M) and on to EhExPee and Seesaw. Push the AutoReview level-20 tier.
  - **W4+ outline:** Onyx in AutoReview's order (core W1–W3 statues first, then Thicc Skin, EhExPee and the W5–W6 statues, then Kachow, Oceanman, Bullseye, Box, Twosoul, Seesaw). Community 2026 advice: hold back **Power** statues for the 20K Onyx stack, and deposit the rest ("Except POW statue… deposit all", r/idleon 2026-06-02).
  - **Per class:** a Squire or Barbarian gets more from Power and Mining, a Bowman or Hunter from Speed and Anvil, a Wizard or Shaman from Exp and Lumberbob, and a Maestro from EhExPee, Kachow and Feasty. These talent bonuses apply only on the talented character, and they stack with Gold.
- **Common mistakes:**
  - **Depositing one statue type on several characters before Gold.** Detect a statue with `statueGrades[i] == 0` and `StatueLevels[i][0] > 0` on two or more characters. Everything except the highest is lost at Gold.
  - **Not buying Gold.** Detect `statueGrades[i] == 0` with `rawMoney > goldCost(i)`. Both MVP fixtures had Gold only on the first 5 (W2) and 13 (W3) statues, with levels under 10. That leaves cheap account-wide value unbought.
  - **Not doing Town Marble's quest on the farming character.**
  - **Depositing a stack that should have gone to Onyx** (W4+).
- **Save and Toolbox fields:**
  - Raw `StuG` / `StatueG` (grade per statue: 0 none, 1 Gold, 2 Onyx, 3 Zenith; longer than the catalog) and per-character `StatueLevels_N` (`[level, progress]`).
  - Parsed `account.statues[]` (`{name, effect, bonus, level, progress, onyxStatue, zenithStatue, talentMulti, onyxMulti, zenithMulti, dragonMulti, upgradeVaultMulti, …}`, where `level` is the highest across characters), `account.statueGrades[]`, `characters[i].statues` (raw per-character pairs).
  - Helpers `getStatueBonus(account, index, character.flatTalents)`, `calcStatueLevels`, `calcTotalOnyx`.
  - `accountOptions[69]` gates the Onyx count (Toolbox `calcTotalOnyx`).
- **Sources:** N.js v1.23 (2026-10-17): `StatueExpReq`, `StatueBonusGiven`, `_customBlock_Tower2Stats("StatueGoldCost")`, Gold purchase handler, `_event_Statue`, GrasslandaTown init (Town Marble gate). Toolbox @ 6827d3f: [`parsers/world-1/statues.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-1/statues.ts), [`components/account/Worlds/World1/Statues.jsx`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/components/account/Worlds/World1/Statues.jsx), `talents.json`. Wiki: [Statues](https://idleon.wiki/wiki/Statues) (rev. 2026-10-14), [Town Marble](https://idleon.wiki/wiki/Town_Marble). Changelog 2026: v1.20 (Royal Guardian: Royal Statues, Statue Flair) and v1.0x (statue carry cap to 999,999,999; Deposit All from storage fix). AutoReview @ 05ac449 `statues_progressionTiers`. r/idleon: [1tuusil](https://www.reddit.com/r/idleon/comments/1tuusil/) (2026-06-02), [1w06yw8](https://www.reddit.com/r/idleon/comments/1w06yw8/) (2026-08-27), [1u2ue1l](https://www.reddit.com/r/idleon/comments/1u2ue1l/) (2026-06-11).
