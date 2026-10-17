# System Dossiers: Trapping, Construction, Worship (W3 skills)

- **Verified:** 2026-10-17, game v1.23 "Lumi Menagerie" (2026-10-16/17).
- **Ticket:** [#25](https://github.com/YassSoliman/idleon-forge/issues/25), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Format: [SYSTEM-DOSSIER.md](../../SYSTEM-DOSSIER.md). Terms: [GLOSSARY.md](../../../../GLOSSARY.md).
- **Pinned sources:**
  - Toolbox [Morta1/IdleonToolbox @ 6827d3f2](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2) (2026-10-17). Its patch notes say gameVer **2.3.540**, "Updated for game version 2.3.540", so it covers v1.23. Tier 1.
  - Game client `N.js`, Last-Modified 2026-10-17, newest patch note `Luminous_Menagerie_v1.23` (@14132571). Tier 1.
  - idleon.wiki bot-data pages: Trapping (rev 2026-10-07), Construction (rev 2026-10-07), Worship (rev 2026-10-07), Prayers (rev 2026-10-03). These are tier 2, and their tables are generated from game data. **All predate v1.23 by about 10 days.** The v1.23 patch note lists no change to these three skills (see "v1.23 check" below), so they are treated as current, but flagged.
- **Confidence:** H = read in code or game data. M = my reading of code or control flow. L = community opinion.

**v1.23 check.** The full `Luminous_Menagerie_v1.23` note in N.js (@14132571) mentions Construction only indirectly (a W7 Yellow Jelly construction EXP multiplier already appears in Toolbox's `getConstructionExpMulti`). It mentions no Trapping or Worship change. One late-W3 change: "Various late-W3 related upgrades in RG's Royal Armory had their cost types changed". That is a W7 system, so it does not affect these dossiers. (H)

**Cross-cutting fact for all three:** none of these skills is an AFK target. The only AFK targets in the game are `FIGHTING`, `MINING`, `CHOPPIN`, `FISHING`, `CATCHING`, `COOKING`, `LABORATORY`, `DIVINITY` and `SPELUNKING`, plus the non-gaining `Nothing` and `Paying_Respect`. These come from the `AFKtype` field of every entry in Toolbox [`data/website-data/monsters.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/monsters.json), read by [`parsers/character.ts` L293](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L293) and branched on in `getAfkGain` ([L3229](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3229)). Trapping, Construction and Worship run **in parallel with** whatever a character is AFK-ing on: placed traps, a seat on the cog board, and a worship charge that refills. A complete AFK Setup therefore fills these parallel slots for every character, on top of picking the AFK target. (H)

---

## Trapping

- **What it is:** a W3 skill where each character places timed traps on critter spawns, then collects critters (and rarer shiny critters) plus Trapping EXP when the timer ends. Hunter's specialty skill; main stat AGI; tool slot = Trap Box Set ([wiki Trapping](https://idleon.wiki/wiki/Trapping), rev 2026-10-07; [wiki Skills](https://idleon.wiki/wiki/Skills)). (H)
- **Unlocks:** W3 Frostbite Towndra. Start the Lord of the Hunt quest line. Quest 2, "Frogecoin to the MOON!", introduces trapping, and Cardboard Traps are sold by the Frostbite Towndra vendor ([wiki Trapping](https://idleon.wiki/wiki/Trapping)). Each critter spawn then needs its own quest (table below). Trapping Lv 5 lets you craft Silkskin Traps. (H)
- **Scope:** both. Traps, trap tier, efficiency, EXP and Trapping level are **per character**: traps are stored per character in `PldTraps` ([`parsers/world-3/traps.ts` L23-41](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-3/traps.ts#L23-L41)). Critters go to the shared storage chest. Eagle Eye (Hunter) collects for **all** characters. (H)
- **Inputs → outputs:**
  - Inputs are time and a trap.
  - Outputs are critters (base 10 per 20-min trap × the trap's quantity multiplier, plus bonus critters from efficiency), at most one shiny per trap unless Shiny Snitch is active, and Trapping EXP (wiki "Critters" section). (H)
  - **There is no minimum efficiency to collect.** Efficiency only adds bonus critters (wiki). (H)
  - **Efficiency, EXP and shiny chance are saved when the trap is placed**, except bonuses from cards and Critter Numnums, which apply at collection (wiki Tips). So re-place traps after a big efficiency gain. (H)

**Critters (game data: [`shared-data.json` `trappingInfo` L49084](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L49084); quests and names from the wiki):**

| Critter (shiny) | Map (world) | Quest to unlock | Base EXP/critter | Base shiny % | Bonus-critter eff. req |
|---|---|---|---|---|---|
| Froge (Poison Froge) | Jungle Perimeter (W1) | Frogecoin to the MOON! | 2 | 5 | 35 |
| Crabbo (Mutant Crabbo) | Salty Shores (W2) | Yet another Cartoon Reference | 8 | 3 | 400 |
| Scorpie (Crescent Scorpie) | The Ring (W2) | Small Stingers, Big Owie | 25 | 2 | 1.5K |
| Mousey (Nakeo Moleo) | Rats Nest (W1) | The Mouse n the Molerat | 50 | 1 | 3.5K |
| Owlio (Minervowl) | Hollowed Trunk (W1) | Happy Tree Friend | 80 | 0.6 | 8K |
| Pingy (Eternal Lord of The Undying Ember) | The Stache Split (W3) | Noot Noot! | 125 | 0.3 | 15K |
| Bunny (Purbunni) | Thermonuclear Climb (W3) | Bunny you Should Say That! | 160 | 0.15 | 45K |
| Dung Beat (Jade Scarab) | Efaunt's Tomb (W2) | Rollin' Thunder! | 200 | 0.06 | 100K |
| Honker (Diamond Duck) | Wam Wonderland (W3) | Untitled Quest | 260 | 0.02 | 200K |
| Blobfish (Voodofish) | Cocoa Tunnel (W4) | Glitter Critter | 350 | 0.003 | 500K |
| Tuttle (Tottoise) | Bamboo Laboredge (W6) | Jade Emporium | 900 | 0.001 | 10M |

**Trap boxes (tool) by band. Stats are from the wiki's bot tables; the craft tab and recipe are as listed there. The last column is from Toolbox `traps` ([L49174](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L49174)), rows 0–6 = Cardboard, Silkskin, Wooden, Natural, Steel, Meaty, Royal, per the `trapType` comment in `traps.ts` L29):**

| Trap box | Trapping Lv | Placeable traps | Source | Trap durations: qty× / EXP× (or shiny×) |
|---|---|---|---|---|
| Cardboard | 1 | 1 | W3 town vendor | 20m 1/1 · 1h 2/2 · 8h 10/8 · 20h 20/15 |
| Silkskin (shiny) | 5 | 1 | Smithing tab 1 | 20m 1/2s · 1h 2/4s · 8h 10/16s · 20h 20/30s · 40h 35/50s |
| Wooden | 15 | 2 | Smithing tab 2 | 3h 5/5 · 60h 50/40 · 5d 100/80 · 5d 200/0 · 5d 0/200 |
| Natural (EXP only) | 20 | 2 | Smithing tab 3 | 8h 0/40 · 20h 0/75 · 43.9h 0/120 · 6d 0/350 |
| Steel (shiny) | 30 | 3 | Smithing tab 3 | 3h 5/10s · 60h 50/80s · 5d 100/160s · 20h 1/60s |
| Meaty | 40 | 3 | Smithing tab 4 | 1h 3/3 · 10h 15/12 · 30h 40/30 · 8.3d 220/200 |
| Royal (shiny) | 48 | 4 | Smithing tab 4 | 20m 2/4s · 1h 4/8s · 10h 21/38s · 40h 70/125s · 6.7d 250/375s · 28d 550/1150s |
| Egalitarian / Forbidden / Containment of the Zrgyios / Prehistoric | 55 / 70 / 85 / 100 | 4 / 5 / 6 / 7 | Smithing tabs 5–7 | (W5+ boxes; no new trap type, only more traps and stats) |

- **How to read it:** on shiny traps (Silkskin, Steel, Royal), the second number is the **shiny** multiplier ("s"); Natural multiplies EXP only (wiki "Trap Box Efficiency", which matches the Toolbox rows). The **equipped** box decides how many traps you can place and which lower trap types you may pick (wiki). Some of the later rows may be gated behind unlocks I did not verify (M).
- **Per-hour view** (qty× / h, from the table; this is arithmetic on game data):
  - Royal 20 min is the best short-session trap (6.0 qty/h, 12 shiny/h).
  - Natural 8 h is the best EXP trap (5.0 EXP/h).
  - Cardboard and Meaty 1 h give 3.0 qty/h.
  - Long traps trade rate for coverage: Royal 40 h gives 1.75 qty/h, Wooden 5 d gives 0.83 qty/h.
  - **So pick the duration that just covers the Expected Return.** A trap that finishes early sits idle.

- **Goals and Milestones:**

| Milestone | Reward | Source |
|---|---|---|
| Trapping Lv 5 / 15 / 20 / 30 / 40 / 48 | Silkskin / Wooden / Natural / Steel / Meaty / Royal box (1 → 4 traps) | wiki tool table |
| Every 10 Trapping Lv | Hunter's Reflective Eyesight shiny multiplier triggers again | [talents.json Hunter](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json) |
| Pen Pals minigame high score 25/50/75/100/125/150/175/200/225 | +5% EXP, +5% eff, +15% shiny, +5% EXP, +10% critters, +15% shiny, +5% eff, +10% critters, +1% skill AFK gain | wiki Pen Pals table; Toolbox `getTrappingStuff('TrapMGbonus')` reads `accountOptions[99]` |
| Combined Trapping + Worship Lv above 100 (any character) | Species Epoch (Voidwalker) +critters and souls per level | `worship.ts` `getSpeciesEpochBonus` |
| 10/25/50 of each critter for quests; vial unlocks | see Feeds | entity graph |

- **Feeds / fed by:**
  - **Critters feed:**
    - **Alchemy Vials:** Crab Juice (Crabbo, + starting Worship TD points), Poison Tincture (Poison Froge, Eagle Eye critters), Bubonic Burp (Mousey, + cog inventory), Bunny Brew (Bunny, + tab-3 talent points), Goosey Glug (Honker, + base critter per trap), Bloat Draft (Blobfish, + Lab EXP), Turtle Tisane (Tuttle, multiplicative artifact, sigil, cooking and construction speed).
    - **Alchemy Bubble** upgrade costs: Call Me Pope, Big Game Hunter, Buff Boi Talent, Green/Yellow Bargain, Premigreen, Petting the Rift.
    - **Stamps:** Hidey Box, Purp Froge, Spikemouth, Shiny Crab, Avast Yar.
    - **Refinery salts:** Scorpie → Dioxide Synthesis, Mousey → Purple Salt, Tuttle → Crosslink.
    - **Smithing recipes:** critter pouches, Dementia set, the trap boxes themselves (Poison Froge → Silkskin, Mutant Crabbo → Wooden, Nakeo Moleo → Natural, Eternal Lord → Steel and Anvil Tab 4, Jade Scarab → Meaty and the Tundra Skills Completion Token, Blobfish → Royal).
    - **Lab chips (W4):** Crabbo ×10K → Conductive Software, Blobfish ×2M → Silkrode Processor.
    - **Quests,** and W6 Glimbo trades.
    - All of the above from Toolbox [`data/entity-graph.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/entity-graph.json) (`craftedFrom`, `upgradedWith`, `refinedFrom`, `requires`) and [`vials.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/vials.json). (H)
  - **Fed by** (wiki "Trapping Bonuses" bot tables):
    - Hunter talents (Eagle Eye, Invasive Species, Shroom Bait, Reflective Eyesight).
    - Bubbles Call Me Ash (+1 placeable trap, permanent even after unequip), Cuz I Catch Em All, Goosey Glug.
    - Stamps, cards (Crabbo, Dung Beat, Scorpie, Honker, Froge, Mousey, Pingy, Blobfish), the Trapezoidburg star sign, the Trapping Lockbox Post Office box, the Box Statue.
    - Trapper Drone (Construction), Magnesium atom (+1%/day trap compounder, capped at 60 days, resets on re-place), meals (Sea Urchin), shiny pets, and the Shiny Snitch prayer (shiny bundles). (H)
- **Per-session actions:**
  - Collect any finished trap. Critters drop **at the character's feet**, so loot before leaving the map (wiki). Then re-place traps sized to the Expected Return.
  - With a Hunter: Eagle Eye collects and resets every character's traps remotely, at 50% + 0.25%/Lv critters and 40% + 0.2%/Lv EXP to each player (wiki; Toolbox `calcCrittersBonusInfo`, floor 50% / 40%).
  - **Idle state:** a trap whose `timeLeft ≤ 0` is idle until collected. **Capped state:** none, beyond the trap ending. (H)
- **AFK Setup implications:**
  - Every W3+ character should have all placeable traps out, regardless of its AFK target, because traps run in parallel.
  - Trap timers **do not progress on the character-select screen**, so close the game fully (wiki Tips). (H)
  - Use short Royal or Cardboard traps for sessions under ~1 h, and the duration that matches the Expected Return otherwise.
  - Use Natural traps when the Purpose is Trapping levels (tool tiers, Species Epoch).
  - Trap on the critter whose quest, vial or recipe is the current Goal.
- **Min-max by stage:**
  - **Early W3:**
    - Cardboard Traps for everyone (shadowstorm's W3 guide says "buy skulls and traps for everyone and equip them" (L), [Idleon Complete Guide Sheet, W3 tab](https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview)).
    - Do Lord of the Hunt quests to unlock spawns.
    - Push one character to Lv 5 for Silkskin.
    - Equip Call Me Ash once on each character for the permanent +1 trap.
  - **Mid W3:**
    - Make a Hunter (Meta Path slot 5 per [meta-sources](https://github.com/YassSoliman/idleon-forge/blob/research/meta-sources/docs/research/2026-10-16-meta-sources.md)) and level Eagle Eye. Use a second talent preset if points are short (wiki Tips).
    - Natural traps on one character to reach Steel and Royal tiers.
    - Trap Mousey and Scorpie for Purple and Dioxide salts.
  - **Late W3 / W4:**
    - Royal traps; build Trapper Drone; buy Goosey Glug vial.
    - Blobfish (W4 Cocoa Tunnel) for the Bloat Draft lab vial and the Silkrode Processor chip.
    - Shiny Snitch prayer only on a character whose traps are all shiny-type.
  - **Per class:** only Hunter has trapping talents ([talents.json Hunter, Eagle Eye L3323](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L3323)). Beast Master inherits the Hunter tab. Any class can trap. (H)
- **Common mistakes:**
  - (1) No traps placed at all. A W3 test account had **0 traps on all 6 characters**, and every character at Trapping Lv 1. Detect it with `account.traps[i].length === 0` for a character that has the trapping quest done.
  - (2) Traps that are finished but not collected (`timeLeft < now`).
  - (3) Moving maps before looting critters.
  - (4) Placing 20 h traps when you return in 2 h, or the reverse. Compare against the Expected Return.
  - (5) No Hunter, so no Eagle Eye: check for class `Hunter`/`Beast_Master` in `characters[].class`.
  - (6) Unending Energy prayer on a trapper away more than 10 h. That one is a general AFK cap ([mechanics](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md)).
- **Save and Toolbox fields:**
  - `account.traps[charIndex][]` = `{name, rawName, crittersQuantity, trapType, trapExp, timeLeft (ms epoch), trapData}`.
  - `characters[].skillsInfo.trapping.{level,exp,expReq}`.
  - `characters[].tools[]` holds the trap box (`Type` "TRAP_BOX_SET" in item data).
  - `characters[].equippedBubbles` (Call Me Ash).
  - `characters[].activePrayers`.
  - The trap box sits in `characters[].tools[4]`.
  - Toolbox-computed: `getTrapsBonuses(account, characters)` → per-character Eagle Eye critter and EXP collect rates; `calcTotalCritters`.
  - Toolbox dashboard alerts in [`utility/dashboard/characters.js` `trapsAlerts` L76-98](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/utility/dashboard/characters.js#L76-L98), both ready-made Next Action triggers:
    - `missingTraps`: fewer traps placed than the box tier (+1 for Call Me Ash), capped at 8.
    - `trapsOverdue`: a trap past its end.
  - `hasAvailableToolUpgrade` (same file, L251) flags a better trap box or skull the skill level already allows.
  - Critter totals: `account.storage.list` by rawName `Critter1..11` and `Critter1A..11A`. (H)
- **Sources:** see the end of this file.

---

## Construction

- **What it is:**
  - The W3 town skill where characters and cogs on the **cog board** produce Build Rate (to build and upgrade W3 buildings, Worship towers and Shrines), Flaggy Rate (to unlock board squares) and Construction EXP.
  - Characters on the **cog shelf** produce new cogs.
  - It is Squire's specialty ([wiki Construction](https://idleon.wiki/wiki/Construction), rev 2026-10-07). (H)
- **Unlocks:** W3 town, the Construction Table on the middle-upper platform, reached via Hoggindaz's W3 quest line. The first build is the 3D Printer (wiki Getting Started; shadowstorm W3 tab "go and talk with Hoggindaz and complete his quests" (L)). (H)
- **Scope:** both.
  - **Per character:** Construction level, which sets that character's own build rate, Flaggy rate and EXP/h, and the tier of cog it can make.
  - **Account-wide:** the board, cogs, building levels and the rates on the board.
  - **A new cog's stats scale with the highest Construction level on the account** (wiki "Cogs"). (H)
- **Inputs → outputs:**
  - Inputs: character time on the board or shelf, plus refinery salts and W1–W3 materials to finish each building level. When the build bar is "DONE", materials are taken from the storage chest (wiki).
  - Outputs: building levels (a separate System per building), cogs and Construction EXP.
  - **Per-character build speed** = `3·(Lv/2 + 0.7)^1.6 × (1 + Lv·Carpenter%) × (1 + stamps, post office, guild, gear, obols, achievement, mastery, vial, arcade, vote, vault, bubba) × multipliers × Redox Rates talent` ([`character.ts` `getPlayerConstructionSpeed` L3655](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3655)).
  - **Construction EXP/h** = `(buildSpeed^0.7 / 2 + 2 + 6·Lv) × EXP multi` ([`getPlayerConstructionExpPerHour` L3755](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3755)). Construction level therefore compounds: it raises build speed, which raises EXP. (H)
- **Goals and Milestones:**

| Milestone | Reward | Source |
|---|---|---|
| Construction Lv 1 / 15 / 40 / 70 | Can produce Nooby / Decent / Superb / Ultimate cogs (more stat rolls, bigger boosts) | wiki "Basic Cogs" |
| Each placed Flag | Unlocks a board square (cost escalates, e.g. 50M to 250M Flaggy for far squares) | `construction.ts` `getFlagReq`; parsed `board[].requiredAmount` |
| Each building level | That building's bonus (3D Printer slots, Talent Library, Death Note, Salt Lick, Chest Space, Trapper Drone, Wizard towers, Shrines …) | Toolbox `shared-data.json` `towers` |
| Total building levels 250 / 500 / 750 / 1000 / 1250 / 1500 / 2500 | Construction Mastery bonuses (W4 Rift 16 unlock) | `construction.ts` L441 `constructionMasteryThresholds` |
| Total Construction Lv (all characters) | Rift Skill Mastery (W4), +10% all skill EXP at 400 and +25% at 1000 total, per skill | wiki Skilling EXP Gain table |

- **Feeds / fed by:**
  - **Feeds** every W3 building System: 3D Printer, Talent Book Library, Death Note, Salt Lick, Chest Space, Trapper Drone (Trapping), the nine Wizard towers that Worship needs (Pulse Mage … Voidinator) and the nine Shrines.
  - **Fed by** the Refinery (salts are the main upgrade cost; Squire's Redox Rates gives build speed per power of 10 Redox Salts in storage) and by W1–W2 materials (bars, logs, etc., via building costs).
  - **Fed by** Carpenter bubble, Building Speed stamps, the Construction Container Post Office box, the guild, Turtle Tisane vial (Tuttle critter), W4 Lab jewel Sapphire Rhinestone ("Construction slot 1 is now trimmed up"), and Tiny Cogs from W5+ research (wiki; `character.ts` L3655-3687). (H)
- **Per-session actions:**
  - Click DONE on finished builds and confirm the materials are in the chest. A finished build with missing materials **blocks that building** (wiki).
  - Queue buildings so the bar never idles. All queued builds get the full Build Rate (wiki).
  - Collect cogs from the shelf. Cog cost doubles for each uncollected cog (30 → 60 → 120 …), so an uncollected shelf is the idle state (wiki).
  - Move flags when one completes.
- **AFK Setup implications:**
  - **Put every character on the board** (or the shelf) as soon as there are free squares. Placement runs in parallel with the character's AFK target, because Toolbox sums the board's `playersBuildRate` without reading `afkType` (M: inferred from Toolbox's sums, not from N.js).
  - Prefer EXP cogs early, because Construction level drives everything else (wiki; shadowstorm W3 "You always want to have Exp cogs on board" (L)).
  - Place the highest-level Construction character where boost cogs (Adjay, Diggle, Row, Column) hit it.
- **Min-max by stage:**
  - **Early W3:** build 3D Printer, then Talent Library, then the rest of the top row. Place flags. Get all characters on the board. Start Redox Salts in the Refinery (wiki Getting Started).
  - **Mid W3:** reach Lv 15 on the best constructor for Decent cogs, then Lv 40 for Superb. Keep EXP cogs. Level Squire talents Redox Rates and Sharper Saws.
  - **Late W3 / W4:** Lv 70 for Ultimate cogs. Wizard towers for Worship. Shrines with Shrine World Tour (Lab).
  - **Per class:** Squire ([talents.json Squire, Redox Rates L1639, Sharper Saws L1651](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L1639-L1662)), inherited by Divine Knight. Community opinion favours a **second Divine Knight "for construction"** in the endgame roster (L: [Iacchus "Recommended Class Setups"](https://docs.google.com/spreadsheets/d/1dp-qoLsX8JxwvvwNM0GlpoVkOVcItb8J7aB5YRX7Ka4/htmlview), patch 2.41 (2025-07-06), **pre-Royal Guardian, Stale**).
- **Common mistakes:**
  - (1) Few characters on the board. A W3 test account had **2 of 6 characters on the cog board** and all at Construction Lv 11. Detect it by counting `account.construction.board[].cog.name` that start with `Player_`, against the number of characters.
  - (2) Uncollected cogs piling up.
  - (3) Builds stuck at DONE for lack of salts.
  - (4) Making build-rate cogs before the constructor reaches the next cog tier.
- **Save and Toolbox fields:**
  - `account.construction.{totalBuildRate,totalExpRate,totalFlaggyRate,totalPlayerExpRate,playersBuildRate,board[],spareCogs[],leftColumn,rightColumn,smallCogs,boardMultipliers}`.
  - `account.towers.{data[],totalLevels,totalWaves}` (building levels).
  - `characters[].skillsInfo.construction`.
  - Toolbox-computed: `characters[].constructionSpeed` and `characters[].constructionExpPerHour` (parsers/index.ts L350-351), and the cog optimizer `constructionOptimizer.ts`. (H)

---

## Worship

- **What it is:**
  - A W3 tower-defence skill played at Totems on maps in W1–W7.
  - Each character holds a **charge** that refills over time. Spending charge at a Totem, either by playing the TD actively or by pressing WORSHIP to claim rewards for the highest wave reached, gives **souls** and Worship EXP.
  - Souls buy and upgrade **Prayers**.
  - Wizard's specialty; main stat WIS; tool slot = Skull ([wiki Worship](https://idleon.wiki/wiki/Worship), rev 2026-10-07). (H)
- **Unlocks:** W3 (the skill page lists Frostbite Tundra). The first Totem, Goblin Gorefest, is in W1 Forest Outskirts. Further Totems need Worship levels (table). Towers are built through Construction (wiki "Towers"). Wax Skull is sold by the Frostbite Towndra vendor. (H)
- **Scope:** both.
  - **Per character:** charge, charge rate, max charge, Worship level, skull and equipped prayers.
  - **Account-wide:** highest wave per totem, tower levels, souls and prayer levels ([`worship.ts` `getTotems` L25](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-3/worship.ts#L25), `getPlayerWorship`). (H)
- **Inputs → outputs:**
  - Inputs: charge, which comes from time, skull, Worship level, cards, stamps, Nearby Outlet and Call Me Pope ([`getChargeRate` L164](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-3/worship.ts#L164), [`getMaxCharge` L146](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-3/worship.ts#L146), floor 50).
  - Souls per worship = `5 × (1 + effBonus) × waveMulti × (1 + food and Dementia set) × Species Epoch × arcade × vault`. Here `effBonus = floor(100 × (eff / (10 × minEff))^0.25)%`, and it is **0 if worship efficiency is below the totem's minimum** ([`getSoulsReward` L135](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-3/worship.ts#L135)).
  - `waveMulti = ((5 + maxWave) / 10)^2.6`, and EXP per wave = `15·(totem+1)² × waveMulti^0.9 × EXP multi` (`getTotems`, `getTotemExpReward`).
  - **Raising the highest wave is the main lever:** souls scale about as wave^2.6. (H)

**Totems (game data `totems` [L48533](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L48533); map indexes from `worship.ts` L28):**

| Totem | Map (world) | Worship Lv | Charge per run | Min efficiency | Soul |
|---|---|---|---|---|---|
| Goblin Gorefest | Forest Outskirts (W1) | 1 | 25 | 60 | Forest Soul |
| Wakawaka War | Up Up Down Down (W2) | 10 | 40 | 250 | Dune Soul |
| Acorn Assault | The Roots (W1) | 30 | 60 | 1,000 | Rooted Soul |
| Frosty Firefight | Rollin' Tundra (W3) | 40 | 90 | 3,000 | Frigid Soul |
| Clash of Cans | Mountainous Deugh (W4) | 50 | 120 | 8,000 | Squishy Soul |
| Citric Conflict | OJ Bay (W5) | 60 | 250 | 20,000 | Oozie Soul |
| Breezy Battle | Above the Clouds (W6) | 80 | 500 | 150,000 | Breezy Soul |
| Pufferblob Brawl | Puffpuff Overpass (W7) | 100 | 1,000 | 2,500,000 | Deepsea Soul |

**Skulls (tool) by band (wiki bot table):**

| Skull | Lv | Speed | Max charge | Source |
|---|---|---|---|---|
| Wax | 1 | 4 | 100 | W3 vendor |
| Ceramic | 10 | 5 | 200 | Smithing tab 1 (Forest Soul) |
| Horned | 25 | 5 | 400 | Smithing tab 2 (Dune Soul) |
| Prickle | 35 | 6 | 750 | Smithing tab 3 (Rooted Soul) |
| Manifested | 40 | 7 | 1,250 | Smithing tab 3 (Frigid Soul) |
| Glauss | 50 | 7 | 1,750 | Smithing tab 4 |
| Luciferian | 60 | 8 | 2,500 | Smithing tab 4 (Squishy Soul) |
| Dreadnaught / Cultist / Crystal Skull of Esquire Vnoze / Prehistoric | 70 / 90 / 120 / 150 | 9 / 9 / 10 / 10 | 3,000 / 3,600 / 4,200 / 6,000 | Smithing tabs 5–7 (W5+) |
| Slush Skull | 10 | 2 | 1,000 | Dilapidated Slush drop. **Do not equip:** speed 2 cripples charge rate (shadowstorm W3: "DONT EQUIP SLUSH SKULL" (L); `getChargeRate` uses a slower branch below speed 3) |

- **Goals and Milestones:**

| Milestone | Reward | Source |
|---|---|---|
| Worship Lv 10 / 30 / 40 / 50 / 60 / 80 / 100 | Next totem (souls of the next tier) | totems table |
| Highest wave per totem | Prayer unlocks: Goblin Gorefest wave 10 Big Brain Time, 25 Skilled Dimwit, 51 Unending Energy, 81 Shiny Snitch, 121 Zerg Rushogen; later totems unlock the others | `shared-data.json` `prayers[].unlockZone/unlockWave` L34322 |
| Every 10 Worship Lv | +Gospel Leader bubble max charge step | `getMaxCharge` (`floor(worshipLv/10)`) |
| Total waves across totems (/10) | MSA Totalizer bonuses (W5 Gaming) | `worship.ts` `getTotalizerBonuses` |

- **Feeds / fed by:**
  - **Souls feed:**
    - Prayers. Forest Soul levels Big Brain Time, Skilled Dimwit, Unending Energy, Shiny Snitch and Zerg Rushogen. Dune Soul levels Tachion, Balance of Precision, Midas Minded and Jawbreaker. Rooted Soul levels Royal Sampler, Antifun Spirit, Circular Criticals and Ruck Sack. Frigid Soul levels Fibers of Absence, Vacuous Tissue and Beefy For Real. Squishy Soul levels Balance of Pain, Balance of Proficiency and Glitterbug.
    - Skull crafting (Ceramic … Prehistoric) and soul pouches.
    - Vials: Sippy Soul (Forest, + tab-2 talent points), Chonker Chug (Dune, Talent Library speed), Slowergy Drink (Frigid, multikill), Spook Pint (Squishy, new-recipe cooking speed), Oozie Ooblek, Refreshment, Octosoda.
    - Bubbles (Cuz I Catch Em All, Tree Sleeper, Purple and Orange Bargain, Sample It, Bow Jack …).
    - Stamps: SpoOoky, Banked Pts, Hermes, Intellectostampo.
    - Refinery: Dune Soul → Dioxide Synthesis, Frigid Soul → Nullo Salt.
    - Lab chip: Squishy Soul ×2M → Silkrode Motherboard.
    - All from [`entity-graph.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/entity-graph.json) and `vials.json`. (H)
  - **Fed by:**
    - Wizard talents: Charge Syphon (pools charge from all characters), Nearby Outlet (×charge rate), Sooouls (efficiency per power of 10 Forest Souls), Bless Up (EXP) ([talents.json Wizard L4645-4700](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L4645-L4700)).
    - Construction (towers), Crab Juice vial (starting TD points), Twosoul Statue, SpoOoky stamp.
    - Dementia set (+50% critters and souls), Species Epoch (Voidwalker), the Critters 'n Souls vault upgrade, the Bonus Ballot (W6).
- **Per-session actions:**
  - On every character whose charge is near max, spend it with WORSHIP at the highest totem where worship efficiency ≥ the totem's min efficiency. Otherwise go one totem lower: under the minimum, the efficiency bonus is 0.
  - Then **Charge Syphon** with the Wizard to pool the rest.
  - **Capped state:** `currentCharge == maxCharge`. Charge stops accruing, so this is waste.
  - Toolbox's `getClosestWorshiper` and `getChargeWithSyphon` give the time to cap. (H)
  - Occasionally do an active TD run to raise `maxWave`. This is an Active Play suggestion: hands-on, it does not fit a 15-min session, and it never affects a Verdict.
- **AFK Setup implications:**
  - Equip the best skull on **every** character, since charge accrues on all of them in parallel.
  - Time the next visit against the earliest charge cap.
  - Avoid prayers whose curse hurts the coming AFK Stretch: Unending Energy caps AFK time at 10 h ([mechanics](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md)); Zerg Rushogen costs carry capacity.
- **Min-max by stage:**
  - **Early W3:** Wax Skull for everyone; Goblin Gorefest to wave 10 → 25 → 51 for the first prayers; Ceramic Skulls from Forest Souls.
  - **Mid W3:** a Wizard (Meta Path slot 6) with Nearby Outlet and Charge Syphon; Worship 10 → 30 for Dune and Rooted Souls; build Pulse Mage, Fireball and Boulder towers.
  - **Late W3 / W4:** Frosty Firefight (Lv 40), then Clash of Cans (Lv 50, W4) for Squishy Souls (Balance of Pain, a multikill prayer used for pushing).
  - **Per class:** Wizard for the talents. Wizard, Hunter and Journeyman also have the crowd-control and multi-hit actives the wiki lists for active TD ("Class Usefulness"). Elemental Sorcerer inherits the Wizard tab.
- **Common mistakes:**
  - (1) Charge sitting at the cap on idle characters. A W3 test account had **4 of 6 characters at full charge and max charge at the floor of 50**, which means no useful skull or bonus. Detect it with `characters[].worship.currentCharge >= maxCharge`.
  - (2) Only the first totem played: that account's highest wave was 41 at Goblin Gorefest and 0 elsewhere, with 2 prayers at Lv 1. Read it from `account.totems[].maxWave` and `account.prayers[].level`.
  - (3) Equipping the Slush Skull.
  - (4) Worshipping at a totem whose min efficiency exceeds yours.
  - (5) Unending Energy on an overnight character.
- **Save and Toolbox fields:**
  - `characters[].worship.{maxCharge,chargeRate,currentCharge}` (Toolbox-estimated to "now").
  - `characters[].skillsInfo.worship`.
  - `characters[].tools[5]` (skull).
  - `characters[].activePrayers`.
  - `account.totems[] {name, maxWave, waveMulti, expReward, minEfficiency, skillReq, chargeReq, map}`.
  - `account.prayers[] {name, level, soul, unlockZone, unlockWave, …}`.
  - `account.towers.totalWaves`.
  - Toolbox-computed: `getSoulsReward`, `getTotemExpReward`, `getClosestWorshiper`, `getChargeWithSyphon`.
  - The `worshipAlerts` dashboard check ([`characters.js` L58-75](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/utility/dashboard/characters.js#L58-L75)) has two parts:
    - `chargeOverdue`: charge ≥ 95% of max.
    - `unendingEnergy`: the prayer is equipped and the character has been AFK more than 10 h. (H)

---

## Sources

- Toolbox @ [6827d3f2](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2) (2026-10-17, gameVer 2.3.540):
  - [`parsers/world-3/traps.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-3/traps.ts), [`parsers/world-3/worship.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-3/worship.ts), [`parsers/world-3/construction.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-3/construction.ts)
  - [`parsers/character.ts` L293, L3229, L3655, L3755](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts)
  - [`data/website-data/shared-data.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json) (`trappingInfo`, `traps`, `totems`, `prayers`, `towers`, `mapNames`)
  - [`talents.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json), [`vials.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/vials.json), [`monsters.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/monsters.json), [`items.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/items.json), [`data/entity-graph.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/entity-graph.json), [`data/patch-notes.js`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/patch-notes.js)
- Game client [N.js](https://www.legendsofidleon.com/ytGl5oc/N.js), Last-Modified 2026-10-17: the patch note `Luminous_Menagerie_v1.23` @14132571.
- idleon.wiki (bot data, read 2026-10-16/17): [Trapping](https://idleon.wiki/wiki/Trapping) (rev 2026-10-07), [Construction](https://idleon.wiki/wiki/Construction) (rev 2026-10-07), [Worship](https://idleon.wiki/wiki/Worship) (rev 2026-10-07), [Prayers](https://idleon.wiki/wiki/Prayers) (rev 2026-10-03), [Skills](https://idleon.wiki/wiki/Skills) (rev 2025-06-29, **Stale**; class-to-skill mapping only). All four main pages predate v1.23.
- Community (tier 3, opinion):
  - "Idleon Complete Guide Sheet" by shadowstorm2204, [W3 tab](https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview): post-W7, pre-Royal Guardian (2026-08-25), so **Stale**.
  - Iacchus "Recommended Class Setups", [sheet](https://docs.google.com/spreadsheets/d/1dp-qoLsX8JxwvvwNM0GlpoVkOVcItb8J7aB5YRX7Ka4/htmlview): patch 2.41, 2025-07-06, **Stale**.
- Not read: Reddit. Arctic Shift returned "Too many requests" on every attempt on 2026-10-17. Recent threads exist (e.g. "Need help with trapping", 2026-09-27, id 1wrx3w1; "Worship sucks", 2026-10-10, id 1x2leem) but were not used.
- Test saves: `fixtures/private/*.parsed.json`, read for field names and aggregates only.
