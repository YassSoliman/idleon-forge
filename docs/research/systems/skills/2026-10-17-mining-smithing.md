# System Dossiers: Mining, Smithing

- **Verified:** 2026-10-17, game v1.23 "Lumi Menagerie" (2026-10-16/17).
- **Ticket:** [#25](https://github.com/YassSoliman/idleon-forge/issues/25). Format: [SYSTEM-DOSSIER.md](../../SYSTEM-DOSSIER.md). Terms: [GLOSSARY.md](../../../../GLOSSARY.md).
- **Pinned sources:**
  - Toolbox [@ 6827d3f2](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2) (commit dated 2026-10-17, so it covers v1.23). Cited as `TB:<path>#L`.
  - `N.js` (Last-Modified 2026-10-17, patch note `Luminous_Menagerie_v1.23` @14132571). Cited as `N.js <symbol>@offset`.
  - idleon.wiki bot-data pages [Mining](https://idleon.wiki/wiki/Mining) (rev 2026-10-06), [Smithing](https://idleon.wiki/wiki/Smithing) (rev 2026-10-05), [Forging](https://idleon.wiki/wiki/Forging) (rev 2026-10-05), [Smithing/Anvil Tab 1-4](https://idleon.wiki/wiki/Smithing/Anvil_Tab_1) (rev 2026-10-07), [Portal Requirements](https://idleon.wiki/wiki/Portal_Requirements) (rev 2026-10-07), [Set Bonuses](https://idleon.wiki/wiki/Set_Bonuses) (rev 2026-10-07). **All predate v1.23 by about 10 days.** They are generated from game data, and the v1.23 patch note does not touch Mining or Smithing (its only related line is a W7 Menagerie "forge speed multi" bonus, N.js @14132571), so they are treated as current (confidence H for tables, M where noted).
  - Community: "Idleon Complete Guide Sheet" by shadowstorm2204 (post-W7, pre-Royal Guardian; [htmlview](https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview), W1 tab). Reddit (Arctic Shift) was rate-limited during this pass; no Reddit claim is used.
- **Scope note:** Mining here is the skill (mines, ores, pickaxes, efficiency). Smithing is the skill (anvil crafting tabs, anvil Production tab only as the Smithing EXP source, Smithing levels). The **Anvil** (production economy, anvil points), **Forge** (bars, slots, oils), **Stamps**, **Refinery**, **Alchemy Bubbles/Vials**, **Lab chips**, **Smithy set bonuses**, **Post Office**, **Cards**, **Obols**, **Statues** and **Star Signs** dossiers are written elsewhere; this file only says what Mining and Smithing feed into them and take from them.

**Changes since 2025 that older guides miss** (wiki changelogs, local copies 2026-10-16):

| Date / patch | Change | Effect on advice |
|---|---|---|
| v2.28, 2025-02-08 | Forge times cut 80% (Copper 50 s to 15 s ... Godshard 50000 s to 15000 s) | Old "forge is the bottleneck" advice is Stale; ore supply is the bottleneck now. ([Changelog 2025](https://idleon.wiki/wiki/Changelog_2025)) |
| v2.28, 2025-02-08 | Anvil no longer Quick-Ref only, craft from anywhere | Crafting needs no trip to town. |
| v2.41, 2025-07-06 | Veins of the Infernal (Archer) caps at Smithing Lv 100 | Smithing past 100 adds no Archer damage. |
| v1.00b, 2025-11-09 | "Statues no longer drop from Skilling activities, like mining etc. Instead, those statues now drop from Crystal monsters." | Any guide saying "mine for statues" is Stale. |
| v1.07, 2026-03-06 | "SUPER boosted anvil craft speed (normal craft, NOT Craft From Storage)" | Bulk crafting (pouches, Peanuts) is instant. ([Changelog 2026](https://idleon.wiki/wiki/Changelog_2026)) |
| v1.20, 2026-08-26 | Royal Guardian (Divine Knight master class) lists **Mining** as its first specialized skill; its Outposts include all five W1 mines | W5+ only; see Mining min-max outline. ([Royal Guardian](https://idleon.wiki/wiki/Royal_Guardian), rev 2026-10-07) |

---

## Mining

- **What it is:** a Warrior-specialized, STR-based efficiency skill. A character AFKs (or actively swings) at an ore vein in the W1 mines; each successful hit yields ore and Mining EXP. Ore is smelted into bars at the Forge and is the main input to Stamps, early Alchemy, the Refinery's first and sixth salts, Lab chips, and most W1-W4 anvil equipment. ([Mining](https://idleon.wiki/wiki/Mining); class/stat: wiki infobox "Class Warrior, Main Stat Strength")

- **Unlocks:**
  - Scripticus quest "Certified Swinger, of Pickaxes of course!" sends you to the **left portal of W1 town** and rewards a **Junk Pickaxe** (+50 Mining EXP). Glumlee's three quests in Tunnels Entrance teach mining and smelting. ([Mining, Mining Exp Quests](https://idleon.wiki/wiki/Mining); `TB:data/website-data/quests.json#L1044` Glumlee)
  - Deeper mines are gated by **Mining level on the door**, not kills. Toolbox: "Every door of a map with its base requirement (CustomLists.MapDetails[map][0]): kills on a fighting map, the skill level on a mining or fishing one." ([TB:parsers/portals.ts#L39-L47](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/portals.ts#L39-L47); values from `shared-data.json mapPortals` [L25379](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L25379); cross-checked with [Portal Requirements](https://idleon.wiki/wiki/Portal_Requirements)). Confidence H.

| Mine (map index) | Door into it needs | Veins (wiki "Area") |
|---|---|---|
| Tunnels Entrance (6) | none (left portal of W1 town) | Copper |
| Freefall Caverns (7) | Mining 10 (door in Tunnels Entrance) | Iron, Gold |
| The Ol' Straightaway (10) | Mining 25 (door in Freefall Caverns) | Platinum, Dementia |
| Echoing Egress (11) | Mining 40 | Void, Lustre |
| Slip Slidy Ledges (12) | Mining 60 (2nd door of Echoing Egress; its 1st door at 50 leads to an unused "Miningg2" map) | Starfire, Dreadlo |
| Motherlode Pit (32) | Mining 60 (door in Slip Slidy Ledges) | Godshard |
| Outside the mines | W3 Igloo's Basement (Platinum, per wiki, M); W3 Equinox Valley (Marble); W5 The Hole (Motherlode); W7 Balloon Bay (Prehistrium) | |

  Freefall Caverns has a second door at "81" to The Royal Castle (map 43), a Royal Guardian feature (W5+; confidence M on the meaning).

- **Scope:** both. Per character: Mining level and EXP, pickaxe, efficiency, AFK target, talents, star signs, Post Office box, obols, equipped cards. Account-wide: ores in storage (Copper Collector reads storage), stamps, bubbles, vials, statues, Skill Mastery (total Mining level of all characters, after Rift 16), Smithy set bonuses, the Mining card set.

- **Inputs → outputs:**
  - **In:** AFK time or active play; a pickaxe (tool slot 0); STR and HP (efficiency); Mining level.
  - **Out:** ore (count per hour below), Mining EXP, ore cards (rare drop per hit), 3D Printer samples (W3+: the Printer Sampling star talent samples "the resource you're AFKing", [3D Printer](https://idleon.wiki/wiki/3D_Printer)).
  - **The core mechanic (efficiency vs toughness).** Every vein has a toughness (`Defence` in the monster table). With `r = Mining Efficiency / toughness`:
    - **Harvest chance** = 0 if r < 0.25, else `min(1.512 * (r - 0.0763) / (r + 5), 1)`. So the first chance (about 5%) appears at **0.25 x toughness** and the chance hits **100% at about 10 x toughness**. (N.js `RunCodeOfTypeXforThingY("ChanceToHarvest")` @4085115, formula @4087955)
    - **Ore per successful hit** = `floor(max((Eff / (10 * toughness))^(0.25 + MiningProwess), 1))`. So 2 ore per hit needs 160 x toughness, 3 needs 810 x, 4 needs 2,560 x (prowess raises the exponent; Toolbox caps all-skill prowess at +0.1, [TB:parsers/efficiency.ts#L84-L90](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L84-L90)). (N.js `SkillStats("MiningOreValue")` @4203407)
    - **Hits per hour** = `3600 / (MiningSpeed + 0.4) * min(1, harvest chance) * afkAttackBonus(1..3) / 1.15`, and 0 if the harvest chance is at or below 5%. (N.js `HourlyKillRate("Mining")` @4431541)
    - **AFK ore per hour** = hits/hr x AFK gain rate x (1 + Multi-Ore%/100) x ore per hit. **AFK EXP per hour** = hits/hr x AFK gain rate x the vein's base EXP: EXP is per hit, so multi-ore and ore-per-hit do not raise EXP. (N.js AFK Info display @3807336)
    - **Multi-Ore chance** sums the Twin Ores stamp, a stat term, a Mining-level term, Motherlode Miner, the Wyoming Blood bubble and Dwarfo Beardus; it is **capped at 100% unless Wyoming Blood is equipped at level 20+, then 300%** (plus W5 Cosmo "Resource Bursting"). (N.js `SkillStats("MiningMultiOre")` @4199215; wiki Mining Prowess table)
    - **Mining speed** (seconds per swing) depends on the **pickaxe's Speed stat** and Mining level, divided by food (Icing Ironbite, Giftybread, Stained Pearl), Dementia/Lustre/Biggole Mole cards, Action Frenzy and keychains, with a floor of 0.57 s. A pickaxe with Speed below 3 uses a much harsher curve. (N.js `SkillStats("MiningSpeed")` @4200525)

  **Vein table** (toughness and base EXP from game data `monsters.json` [L13583-L13995](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/monsters.json#L13583-L13995); thresholds are the formulas above and match the wiki vein pages; bars per ore from [Forging](https://idleon.wiki/wiki/Forging)):

| Ore | Toughness | Base EXP/hit | First chance (0.25x) | 100% hits (10x) | 2 ore/hit (160x) | Ore per bar | Forge time per bar (base, post-2025-02) | Ore card bonus |
|---|---|---|---|---|---|---|---|---|
| Copper | 25 | 2 | 7 | 250 | 4 K | 2 | 15 s | +4 base Accuracy |
| Iron | 140 | 5 | 35 | 1.4 K | 22.4 K | 4 | 30 s | +5%/tier Total Mining Eff |
| Gold | 1,000 | 10 | 250 | 10 K | 160 K | 7 | 60 s | +5%/tier Mining EXP |
| Platinum | 7,500 | 30 | 1.88 K | 75 K | 1.2 M | 16 | 200 s | +2%/tier Mining Away Gains |
| Dementia | 40,000 | 55 | 10 K | 400 K | 6.4 M | 40 | 400 s | +4%/tier Mining Speed |
| Void | 100,000 | 185 | 25 K | 1 M | 16 M | 100 | 750 s | +6%/tier Total Mining Eff |
| Lustre | 250,000 | 250 | 62.5 K | 2.5 M | 40 M | 250 | 1,300 s | +5%/tier Mining Speed |
| Starfire | 1 M | 500 | 250 K | 10 M | 160 M | 500 | 2,000 s | +8%/tier Mining EXP |
| Dreadlo | 5 M | 850 | 1.25 M | 50 M | 800 M | 1,000 | 3,000 s | +3%/tier Mining Away Gains |
| Godshard | 40 M | 1,600 | 10 M | 400 M | 6.4 B | 6,000 | 10,000 s | +30%/tier Forge Cap and Speed (passive) |
| Marble (W3 Equinox Valley) | 2 M | 800 | 500 K | 20 M | 320 M | 3,000 | 5,000 s | (Dreadlo card in table; M) |
| Motherlode (W5 The Hole) | 30,000 | 150 | 7.5 K | 300 K | 4.8 M | not smeltable (currency) | | |

  Card effects: `cards.json` [L312](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/cards.json#L312) and neighbours; Copper card from the [Copper Vein](https://idleon.wiki/wiki/Copper_Vein) page. The entity graph describes Platinum as "4 Minutes per Bar" while the Forging page says 200 s; the changelog's post-cut list says 200 s, so 200 s is used (confidence M on the graph text being an older base).

  **Pickaxe tiers** (game data `items.json` [L29307-L29630](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/items.json#L29307-L29630): equip level, Speed, Power; recipes from [Smithing/Anvil Tab 1-4](https://idleon.wiki/wiki/Smithing/Anvil_Tab_1); "%" = the pickaxe's own Mining Efficiency line):

| Pickaxe | Equip Lv (Mining) | Speed | Power | % eff | Slots | Source and recipe | Smithing Lv to craft | Recipe from |
|---|---|---|---|---|---|---|---|---|
| Junk | 2 | 3 | 2 | | 0 | Scripticus quest; Glumlee shop | | |
| Copper | 3 | 3 | 6 | | 2 | Tab 1 #9: 8 Copper Ore | 3 | Start of tab |
| Iron | 8 | 4 | 10 | | 2 | Tab 1 #29: 100 Iron Ore | 13 | Start of tab |
| Gold | 15 | 4 | 13 | | 2 | Tab 2 #9: Iron Pickaxe + 2.5 K Megalodon Tooth + 400 Gold Bar | 20 | Yum Yum Desert Task Unlocks |
| Poopy | 15 | **2** | 18 | 2% | 6 | Dr Defecaus / TP Pete drop | | |
| Platinum | 25 | 4 | 16 | 1% | 3 | Tab 2 #29: Gold Pickaxe + 800 Plat Bar + 10.5 K Pincer Arm | 26 | Yum Yum Desert Task Unlocks |
| Dementia | 37 | 5 | 19 | 2% | 3 | Tab 3 #9: Plat Pickaxe + 275 Dementia Bar + 15 K Moustache Comb | 38 | Frostbite Tundra Task Unlocks |
| Void Imperium Pik | 45 | 5 | 24 | 8% | 4 | Tab 3 #33: Dementia Pickaxe + 400 Void Bar + 5 Dense Water | 45 | Frostbite Tundra Task Unlocks |
| Lustre | 55 | 6 | 30 | 12% | 4 | Tab 4 #9: Void Pik + 250 Lustre Bar + 600 Dioxide Synthesis | 52 | Hyperion Nebula Task Unlocks |
| Starfire | 65 | 6 | 35 | 16% | 5 | Tab 4 #37: Lustre Pickaxe + 500 Starfire Bar + 5 Pearler Shell | 60 | Hyperion Nebula Task Unlocks |
| Dreadlo Pickolo | 70 | 7 | 42 | 20% | 5 | Tab 5 #9 (W5) | | |
| Marbiglass / Destroyer of the Mollo Gomme / Prehistoric | 80 / 100 / 110 | 7 / 8 / 8 | 51 / 62 / 75 | 25 / 35 / 50% | | Tabs 6 / 6 / 7 (W6-W7) | | |

  Each pickaxe recipe consumes the previous pickaxe, so craft them in order. Equip level is taken as the Mining level (tools use the skill level; confidence M, the item field is just `lvReqToEquip`).

- **Goals and Milestones:**

| Milestone | Reward / why | Source |
|---|---|---|
| Glumlee "Learning to Swing" (2 Copper Ore) | Glumlee's Special Tutorial Oil (+999% forge speed oil), 10 Mining EXP | `quests.json` L1044 |
| Glumlee "Learning to Smelt" (1 Copper Bar) | 10 Bottled Town Teleports, 20 EXP | same |
| Mining 10 | Freefall Caverns door | mapPortals |
| Mining 11: Glumlee "The Impossible Task" | **Exp Converter** special talent book, 250 EXP | [Mining](https://idleon.wiki/wiki/Mining); N.js dialogue "Return at Mining Lv.11" @15332353 |
| Krunk "A Plot to be Perfect" (200 Iron Ore, 50 Small Mana Potion) | 200 Icing Ironbite (+15% Mining Speed food) | `quests.json` L917 |
| Krunk "Scientific Method" (200 Gold Ore, 100 Iron Bar, 20 Power Statue) | 5 Armor Upgrade Stone G, Storage Chest 3; final Krunk quest at Mining 20 | same; N.js "Return at Mining Lv.20" @15328901 |
| Sprout "Sticks and Stone..." (500 Stick, 1,500 Iron Ore) | 12 Thicc Skin Statue, EXP balloons | `quests.json` |
| Mining 25 / 40 / 60 | Ol' Straightaway / Echoing Egress / Slip Slidy Ledges and Motherlode Pit | mapPortals |
| Mining 32 (+ Smithing 35, Choppin 33) | W2 Cactolyte club member quest gate | N.js `Cactolyte1` CustomArray @15362043 |
| Pickaxe equip levels 3 / 8 / 15 / 25 / 37 / 45 / 55 / 65 | next pickaxe | items.json |
| Wyoming Blood bubble Lv 20 (equipped) | Multi-Ore cap 100% to 300% | N.js @4199215 |
| Skill Mastery (after Rift 16, W4; total Mining across characters) | 150: +25% Mining EXP; 200: +10% Mining eff; 300: all Mining cards passive; 400: +10% all skill EXP; 500: +5% all skill eff; 750: +1% Printer output; 1000: +25% all skill EXP | [Mining, Skill Mastery](https://idleon.wiki/wiki/Mining) |
| Ore card tiers | see vein table; Copper/Iron/Gold "Easy Resources", Plat-Lustre "Medium", Starfire+ "Hard" | `cards.json` |

- **Feeds / fed by:**

  **What each ore and bar feeds** (game data: `stamps.json`, `cauldrons.json`, `vials.json`, `shared-data.json` refinery/chips, `quests.json`, plus the Toolbox entity graph `data/entity-graph.json` "craftedFrom/upgradedWith/refinedFrom/requires" edges; recipe counts from the Anvil Tab pages):

| Item | Stamps (upgrade material unless noted) | Alchemy | Refinery / Lab / other systems | Smithing recipes (biggest sinks) | Quests |
|---|---|---|---|---|---|
| Copper Ore | Mana, Anvil Zoomer, Arcade Ball, Talent V; crafts Swag Swingy Tool and Duplogs stamps | Roid Ragin bubble (Power), Copper Corona vial | **Redox Salts: 10 Spore Cap + 5 Copper Ore per cycle** (Refinery, W3); Grounded Nanochip 20 K (Lab, W4); **Copper Collector** talent reads Copper in storage | Copper Pickaxe 8, Cramped Mining Pouch 50, Copper Helmet/Platebody, Militia Helm 80, Cavern Trekkers 1.5 K, Rough Rockers **300 K** (W4) | Glumlee 1 |
| Copper Bar | Tomahawk | Barium Mixture vial | | Copper Platelegs 10, Boots 30, Copper Band 100, Copper Fish Rod 200 | Glumlee 2 |
| Iron Ore | Shield; Potion Stamp via Icing Ironbite | Hammer Hammer bubble (Quicc) | | Iron Pickaxe 100, Small Mining Pouch 500, Dirty Coal Miner pants 200, Cavern Trekkers 1.2 K | Krunk 1 (200), Sprout (1,500) |
| Iron Bar | Book; crafts Clover, Twin Ores, Duplogs stamps | Molto Loggo bubble (Hi-IQ), Barley Brew vial | Taskboard "Forge Foreman Grillin" (25 Iron Bars) | **Anvil Tab 2 (100)**, Iron armor, Steel Band 600, Fur Shirt 500, Amarok Bodyplate 300, Iron Fishing Rod 300 | Krunk 2 (100), Picnic Stowaway 6 (100) |
| Gold Ore | Brainstew | Name I Guess bubble, Gold Guzzle vial | Conductive Motherboard 100 K (Lab) | Average Mining Pouch 2 K, Mining Overalls 2 K | Krunk 2 (200) |
| Gold Bar | Arcane | | | **Golden Peanut (50 + 100 Peanut)**, Gold set (200-600 each), Gold Pickaxe 400, Viking Cap 400 | |
| Platinum Ore | Holy Mackerel | **Stronk Tools** bubble (Power), **Blue Flav** vial (-% stamp material cost) | | Sizable Mining Pouch 7.5 K, Platinet 3 K | |
| Platinum Bar | Buckler | | | **Anvil Tab 3 (2 K)**, Blunder Skills Completion Token 1 K, Plat armor, Plat Pickaxe 800, Plat Rod 800 | |
| Dementia Ore | Violence | LAAARRRRYYYY bubble (Kazam) | Galvanic Software 300 K (Lab) | Big Mining Pouch 15 K | |
| Dementia Bar | Saw (Construction EXP) | | | Dementia armor 300-500 each, Dementia Pickaxe 275, Rod 300 | |
| Void Ore | | Severapurple bubble, **Void Vial (+% Mining eff)** | | Large Mining Pouch 40 K | |
| Void Bar | | | **Nullo Salt: 5 Void Bar per cycle** (Refinery, late W3/W4) | **Anvil Tab 4 (1 K)**, Void Imperium armor (500-1 K each), Void Pik 400 | |
| Lustre Ore / Bar | | | | Massive Mining Pouch 110 K / Lustre armor 1.2-2.5 K each, Lustre Pickaxe 250 | |
| Starfire Ore / Bar | | | | Volumetric 100 K, Colossal 900 K pouch / Diabolical gear (2.5 K-50 K), Troll gear (3-20 K), **Anvil Tab 5 (5 K)**, Starfire Pickaxe 500 | |
| Dreadlo Ore / Bar | Dementia Sword / | Dreadnog vial (Cooking speed) | | / Magma Core gear, Pickolo 600, Anvil Tab 6 8.5 K (W5) | |
| Godshard Ore / Bar | Forge Stamp (forge capacity) / | Dabar Special vial | | Herculean pouch 5 M / Gods gear, Anvil Tab 7 100 K (W6+) | |

  Checked and **not** consumers: Construction building upgrades (TowerInfo cost items are refinery salts, N.js `na.TowerInfo` @14519175; Construction reaches ore only through Redox and Nullo Salts), Statues (statue items, and since 2025-11 no statue drops from skilling), Post Office (boosts, not consumes). Confidence H for the data-listed rows; M that the list is exhaustive (bubble upgrade costs beyond the first material were not walked).

  **What feeds Mining** (efficiency formula [TB:parsers/efficiency.ts#L247-L340](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L247-L340); AFK gains [TB:parsers/character.ts#L3422-L3440](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3422-L3440); EXP [TB:parsers/character.ts#L591-L640](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L591-L640); bonus lists on the wiki Mining page):

| System | Efficiency / power | Multi-ore, speed, AFK | EXP |
|---|---|---|---|
| Talents (Warrior tab) | Tool Proficiency (pickaxe power per 10 Mining Lv), Copper Collector (per power of 10 Copper in storage), Big Pick (active) | Motherlode Miner (multi-ore, up to 4 triggers) | Tempestuous Emotions |
| Talents (other) | Brute Efficiency, Idle Skilling (Rage Basics = Warrior line); Skill Strengthen (Blood Berserker / Divine Knight); Right Hand of Action (Maestro, for lower-level chars); Supersource star talent | Action Frenzy (star, speed); Tick Tock (star, AFK) | Happy Dude (Beginner), Left Hand of Learning (Maestro) |
| Stamps | Pickaxe, Cool Diggy Tool (base eff) | Twin Ores (multi-ore), Lil' Mining Baggy (carry cap) | Smart Dirt |
| Alchemy | Stronk Tools (tool power), Hearty Diggy (per power of 10 max HP), Void Vial, Slabi Orefish, Endgame Eff I | Wyoming Blood (multi-ore, cap to 300%), Dream of Ironfish (AFK) | Reely Smart (doubled for the lower of Mining/Fishing) |
| Statues | Mining Statue (power); Barbarian Strongest Statues and Squire Shieldiest Statues boost it | | |
| Post Office | Dwarven Supplies: % Mining eff | Dwarven Supplies: Prowess, % Mining AFK gain | |
| Star signs | Dwarfo Beardus +5% eff | Dwarfo Beardus +20% multi-ore; Miniature Game +30% minigame reward | Sir Savvy |
| Cards | Iron, Void ore cards | Plat, Dreadlo (away gains); Dementia, Lustre (speed); Bunny/Mama Troll/Amarok (skill AFK) | Gold, Starfire |
| Obols | Platinum Obol of Dwarven Delving (2%), Dementia Obol of Magisterial Metals (8%) | | |
| Gear | Viking Cap 10%, Mining Overalls 20%, Dirty Coal Miner pants 5%, Cavern Trekkers 20%, Rough Rockers 35%, pickaxe % lines | Icing Ironbite / Giftybread / Stained Pearl (speed food) | Taco Chain, Falloween Nametag |
| Golden Food | **Golden Peanut x1.3** | Golden Dumpling (AFK) | Golden Ham |
| Smithy (W3) | **Copper Set +60% Mining and Choppin eff** (Copper Helmet + Platebody + Platelegs + one copper tool), passive for all once unlocked at the W3 Smithy | Void Set +10% AFK | Chizoar Set |
| Lab (W4) | Emerald Navette jewel (+200 base eff, +10% speed) | Conductive Processor chip (+15% skilling AFK) | |
| Prayers | | Zerg Rushogen (AFK +); Ruck Sack (AFK -) | |

- **Per-session actions:**
  - Check every miner's **AFK Info**: harvest chance under 100% means efficiency below 10 x toughness; 0% means below 0.25 x (the character is idle). Toolbox shows the efficiency number (`getSkillEfficiency('mining')`).
  - Move a miner up an ore when its efficiency passes about 10 x the next ore's toughness for materials, or when the EXP table below says the next ore wins.
  - Craft and equip the next pickaxe as soon as Mining level and bars allow; it is the single biggest efficiency jump (pickaxe power enters the formula three times: `power^1.3`, `x (1 + power/100)` and via Tool Proficiency).
  - Empty the inventory into storage (ores count for Copper Collector only in storage) and refill all forge slots.
  - Spend the 5 daily Mining minigame plays (needs 5% eff to pay out; [Mining, Minigame](https://idleon.wiki/wiki/Mining)).
  - **Idle/capped states:** harvest chance 0%; carry cap full (Mining pouch too small); no pickaxe equipped; forge slots empty while ores pile up.

- **AFK Setup implications:**
  - A character on Mining sits on `afkType = 'MINING'`, `afkTarget = <ore rawName>`. Base skill AFK gain is 50% plus bonuses ([TB:parsers/character.ts#L3422-L3433](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3422-L3433)).
  - **Best Mining EXP per hit-slot by efficiency** (arithmetic on the game formulas above, EXP x harvest chance; ignores AFK rate, which is the same for every ore):

| Efficiency | Best EXP ore (chance) | Runner-up |
|---|---|---|
| 100 | Copper (66%) | Iron (17%) |
| 300 | Iron (44%) | Copper (100%) |
| 1 K | Iron (88%) | Gold (23%) |
| 3 K | Gold (55%) | Iron (100%) |
| 10 K | Gold (100%) | Plat (30%) |
| 30 K | Plat (66%) | Void (6%) |
| 100 K | **Void (23%)** | Plat (100%) |
| 300 K - 1 M | Void (55-100%) | Lustre |
| 3 M | Starfire (55%) | Lustre (100%) |
| 10 M | Starfire (100%) | Dreadlo (42%) |
| 30 M - 100 M | Dreadlo (81-100%) | Starfire / Godshard |

  Void's EXP per toughness (185 / 100 K) beats Dementia's (55 / 40 K), so for EXP a Mining 40+ character skips Dementia once it has about 100 K efficiency. For **materials**, pick by demand (consumer table), and remember low ores pay more per hit at high efficiency: Copper at 1 M efficiency gives 7 ore per hit before multi-ore.
  - Who should AFK Mining: anyone not needed in combat can, but **Warrior-line characters mine best** (STR feeds the base and a multiplier, Hearty Diggy scales with HP, all Mining talents are Warrior tab). One W1-W3 Warrior on the highest ore it can fully harvest is the usual pattern; other characters only need enough Mining level for Skill Mastery totals and quest gates (confidence M, reasoning from the formula, no current community source states a count).
  - Pair with the Forge: an AFK Stretch of mining should end with ores in the forge (Forge dossier), and an Archer's AFK kills add forge progress via Smeltin' Erryday (Smithing below).

- **Min-max by stage:**

| Stage | Mining Lv | AFK target | Pickaxe | Key buys and crafts | Why (consumers) |
|---|---|---|---|---|---|
| Early W1 | 1-10 | Copper | Junk then Copper (Lv 3) | Cramped Mining Pouch; Pickaxe stamp; Glumlee quests (Exp Converter at Lv 11) | Copper for Mana/Anvil Zoomer/Talent V stamps, Copper armor, later Copper Collector |
| Late W1 | 10-25 | Iron, then Gold when eff > ~10 K | Iron (Lv 8) | Small Mining Pouch; Icing Ironbite food (Krunk); Twin Ores stamp; Golden Peanut (Gold Bars); Mining Overalls, Dirty Coal Miner pants | Iron Bars for Anvil Tab 2 and Iron armor; Gold Bars for Golden Peanut and Gold set |
| W2 | 25-40 | Platinum (Dementia only if needed) | Gold (Lv 15), Plat (Lv 25) | Viking Cap, Cavern Trekkers; Dwarven Supplies box; Stronk Tools, Wyoming Blood, Hearty Diggy, Dream of Ironfish bubbles; Dwarfo Beardus | Plat Bars for Anvil Tab 3 (2 K) and Plat armor; Plat Ore for Stronk Tools / Blue Flav |
| W3 | 40-55 | Void (EXP and Void Bars) | Dementia (Lv 37), Void Pik (Lv 45) | Copper Set at the Smithy (+60%); Void Vial; Mining obols | Void Bars: Anvil Tab 4 and **Nullo Salt** (5 per refine cycle); Copper keeps Redox Salts running |
| W4 | 55-65+ | Lustre, Starfire | Lustre (Lv 55), Starfire (Lv 65) | Rough Rockers (300 K Copper Ore); Emerald Navette, Conductive Processor; Skill Mastery after Rift 16 | Lustre/Starfire Bars for Lustre and Diabolical gear and Anvil Tab 5 (5 K Starfire Bars) |
| W5+ outline | 60-100+ | Dreadlo, Godshard; Motherlode in The Hole | Dreadlo Pickolo and later | Bravery Monument, Cosmo Resource Bursting, Bonus Ballot, Royal Guardian outposts | Godshard Forge Stamp, Gods gear; RG kingdom |

  Per class: **Warrior/Barbarian/Squire** carry the Mining talents and statue boosts; **Blood Berserker/Divine Knight** add Skill Strengthen; **Royal Guardian** (DK master class, v1.20) specializes in Mining (W5+). **Journeyman/Maestro** lifts lower-level characters via Right/Left Hand while its own Mining level is higher. Archers and Mages mine with lower STR but still benefit from the account-wide parts.

- **Common mistakes:**

| Mistake | How to detect from the save |
|---|---|
| No pickaxe equipped on characters that sometimes mine | `characters[].tools[0].rawName === 'Blank'` (a W2 test account had 4 of 5 characters without one; a W3 account 4 of 6) |
| Mining left at Lv 1 on most characters (wastes Mastery totals and Cactolyte gate) | `characters[].skillsInfo.mining.level`; both test accounts had several characters at Mining 1 |
| AFK on an ore with 0% harvest chance | Toolbox efficiency < 0.25 x toughness of `afkTarget` |
| Selling or spending all Copper (kills Copper Collector, which counts powers of 10 in storage) | `account.storage` Copper_Ore count; Copper Collector talent level |
| Using the Poopy Pickaxe for AFK because of its 18 power | its Speed 2 puts it on the slow speed curve (N.js @4200525); only good when efficiency, not speed, is the limit (confidence M) |
| Ores piling up while forge slots are empty | `account.forge.list[].ore.rawName === 'Blank'` while storage holds ore; both test accounts had all 16 slots empty |
| Following "mine for statues" advice | Stale since v1.00b (2025-11-09) |

- **Save and Toolbox fields:**
  - `characters[].skillsInfo.mining` `{level, exp, expReq, rank}`; `characters[].afkType` (`'MINING'`), `characters[].afkTarget` (ore rawName, e.g. `'Copper'`, `'Plat'`); `characters[].tools[0]` = pickaxe (`TOOLS.PICKAXE = 0`, `TB:utility/consts.js`); `characters[].postOffice`, `.starSigns`, `.equippedBubbles`, `.cards`/`.cardPresets`, `.obols`, `.flatTalents`, `.equipment`.
  - `account.totalSkillsLevels.mining` `{level, rank}` (Skill Mastery), `account.rift`, `account.storage`, `account.armorSmithy.sets` (Copper Set unlocked/equipped), `account.forge`, `account.looty` (Slabi Orefish), `account.hole` (W5).
  - Toolbox-computed numbers (ADR 0005): `getSkillEfficiency('mining', ...)` ([TB:parsers/efficiency.ts#L665](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L665), shown in `components/characters/Skills.jsx`), `getAfkGain` MINING branch ([TB:parsers/character.ts#L3229](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3229)), `getSkillExpMulti('mining')` ([TB:parsers/character.ts#L555](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L555)), `getMapDoorRequirements` (mine doors), `getArmorSetBonus(account,'COPPER_SET')` ([TB:parsers/world-3/armorSmithy.ts#L62](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-3/armorSmithy.ts#L62)). Toolbox does **not** expose harvest chance, ore per hit, or ores per hour; ActiveOn derives them with the N.js formulas above from Toolbox efficiency and the vein toughness (plain arithmetic, no new formula).

- **Sources:** see the end of file. Key: N.js `ChanceToHarvest`@4085115/@4087955, `MiningOreValue`@4203407, `MiningMultiOre`@4199215, `MiningSpeed`@4200525, `HourlyKillRate("Mining")`@4431541 (all 2026-10-17 client); Toolbox 6827d3f2; wiki pages listed in the header (2026-10-05 to 07).

---

## Smithing

- **What it is:** an Archer-specialized, AGI-based town skill. Smithing EXP comes from (1) **crafting** items at the anvil (one-off EXP per craft) and (2) the anvil **Production** tab, which every character runs continuously and which the wiki calls "a characters main source of Smithing EXP". Smithing level gates anvil recipes, production items and new anvil tabs, and gives +1 anvil point per level. ([Smithing](https://idleon.wiki/wiki/Smithing))

- **Unlocks:** available from the start in W1 town (the anvil); the Production tab is unlocked by the first quests (the community W1 walkthrough: "After you complete his first quests, the first thing you should do is to go to the anvil and start producing threads", [Complete Guide Sheet W1](https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview)). The Forge is bought in W1 town ([Forging](https://idleon.wiki/wiki/Forging)). Since v2.28 the anvil can be used from anywhere.

- **Scope:** both. Per character: Smithing level/EXP, anvil production slots, anvil points (`speed`, `xp`, `cap`), material carry cap. Account-wide: unlocked recipes ("After an item is crafted for the first time on one character, it'll unlock the option to craft that item from storage on any character", wiki), anvil tabs, forge, stamps, Skill Mastery.

- **Inputs → outputs:**
  - **Crafting:** in: materials (bars, ores, logs, monster drops, anvil products, salts); out: equipment, tools, capacity pouches, stamps' craft materials, food (Peanut, Golden Peanut, Icing Ironbite), anvil tab expansions, Smithing EXP.
  - **Production:** in: time only (no materials); out: anvil products and Smithing EXP. Products, Smithing level to unlock and EXP (game data `shared-data.json anvilProducts` [L529](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L529)):

| Product | Smithing Lv | Production per craft | EXP per craft | EXP per 1 K production |
|---|---|---|---|---|
| Thread | 1 | 100 | 6 | **60** |
| Trusty Nails | 5 | 200 | 10 | 50 |
| Boring Brick | 12 | 350 | 16 | 46 |
| Chain Link | 17 | 700 | 25 | 36 |
| Leather Hide | 25 | 1,200 | 35 | 29 |
| Pinion Spur | 30 | 2,000 | 50 | 25 |
| Lugi Bracket | 35 | 3,000 | 65 | 22 |
| Purple Screw | 43 | 4,000 | 75 | 19 |
| Thingymabob | 50 | 6,000 | 90 | 15 |
| Tangled Cords | 60 | 8,500 | 110 | 13 |
| PVC Pipe | 70 | 12,000 | 140 | 12 |

  Since production speed is the same whatever is produced, **Thread gives the most Smithing EXP per hour** at every level; this matches the community ("best thing to produce for XP is Thread", Complete Guide Sheet W1). Produce other products only for a recipe that needs them.
  - **Production speed** = `(1 + (Anvil Zoomer stamp + 2 x speed points)/100) x (1 + (Blacksmith Box + Anvil Statue + Upgrade Vault)/100) x (1 + Hammer Hammer/100) x AGI speed bonus x (1 + (Bob Build Guy + Broken Time)/100)` ([TB:parsers/world-1/anvil.ts#L16-L24](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-1/anvil.ts#L16-L24)).
  - **Production EXP bonus** = `(1 + 3 x xp points/100) x Smithing EXP multi`, soft-capped above 20 and hard-capped at 75 ([TB:parsers/world-1/anvil.ts#L74-L79](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-1/anvil.ts#L74-L79)).
  - **Capacity** = material pouch capacity per slot x (2 + 0.1 x cap points) ([TB:parsers/world-1/anvil.ts#L186-L187](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-1/anvil.ts#L186-L187)). Material pouches are therefore the real capacity upgrade (wiki: "best to upgrade a characters capacity with Material Capacity Pouches instead of spending too many anvil points on capacity").
  - **Smithing EXP multi** = `max(0.1, (1 + (Focused Soul + SmithExp stamps + Happy Dude + 25 x Mastery)/100) x (1 + Smithing cards/100) x (1 + Blacksmith Box/100) + (all-skill EXP + Left Hand)/100)` ([TB:parsers/world-1/anvil.ts#L200-L221](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-1/anvil.ts#L200-L221); N.js `SkillStats("SmithingEXPmulti")` @4204451, which also shows Fire Forge 4%/tier and Cinder Forge 7%/tier cards). The Forge's "Forge EXP Gain" upgrade adds +1% per level (max 85) to anvil production EXP ([Forging](https://idleon.wiki/wiki/Forging)).

- **Goals and Milestones:**

| Smithing Lv | Unlock | Cost / note |
|---|---|---|
| 3 | Copper Pickaxe, Cramped Mining/Choppin pouches, Blue Tee | Copper Ore, Oak Logs |
| 5 / 12 / 17 / 25 / 30 / 35 / 43 / 50 / 60 / 70 | Production: Trusty Nails / Boring Brick / Chain Link / Leather Hide / Pinion Spur / Lugi Bracket / Purple Screw / Thingymabob / Tangled Cords / PVC Pipe | anvilProducts |
| 6 | Cramped Material Pouch (first anvil capacity upgrade) | 50 Thread, 50 Frog Leg |
| 13 | Iron Pickaxe, Iron armor | 100 Iron Ore; Iron Bars |
| 15 (17 in practice) | **Anvil Tab 2**: 100 Iron Bar, 100 Chain Link, 100 Jungle Logs, 100 Bullfrog Horn | Chain Link needs Smithing 17 on whoever produces it |
| 18 | **Golden Peanut** (+30% Mining eff golden food); Average Material Pouch (Glass Shard + 1.7 K Chain Link) | 100 Peanut + 50 Gold Bar |
| 20 / 26 | Gold Pickaxe / Platinum Pickaxe | Gold / Plat Bars |
| 35 | **Anvil Tab 3**: 2 K Plat Bar, 2 K Bloach, 2 K Fruitfly, 1.5 K High Steaks | also Smithing 35 for the W2 Cactolyte quest (with Mining 32, Choppin 33) |
| 38 / 45 | Dementia Pickaxe / Void Imperium Pik | |
| 40 | Blunder Skills Completion Token (1 K Plat Bar, Amarok Helmet, 2 K Veiny Logs) | Quest "Champion of the Grasslands" |
| 50 | **Anvil Tab 4**: 1 K Void Bar, 2.5 K Frigid Soul, 10 Eternal Lord of The Undying Ember, 400 Spontaneity Salts | |
| 52 / 60 | Lustre / Starfire Pickaxe | |
| 65 | **Anvil Tab 5**: 5 K Starfire Bar, 200 K Cubed Logs, 150 K Fairy, 600 Nullo Salt | W4 to W5 gate |
| 80 | Anvil Tabs 6 and 7 (Dreadlo / Godshard Bars) | W5+ |
| 100 | Veins of the Infernal (Archer) stops scaling | v2.41 cap |
| Skill Mastery (Rift 16) | 150: +25% Smithing EXP; 200: +25% forge ore capacity; 300: +5% total damage; 400/500/750/1000 as Mining | [Smithing](https://idleon.wiki/wiki/Smithing) |

  Recipe levels and costs from [Smithing/Anvil Tab 1-4](https://idleon.wiki/wiki/Smithing/Anvil_Tab_1) (rev 2026-10-07). Most recipes come from **Taskboard Unlocks** per world; some from drops (e.g. Mining Overalls "Dropped by Gold", Iron Boots from the W1 Silver Chest), quests and merit shops. The Tab 4 page lists "Exp 1 M" for every recipe, which looks like a display cap in the bot data (confidence L on those EXP values).

- **Feeds / fed by:**
  - **Feeds:** Mining (pickaxes, mining pouches, Golden Peanut, Viking Cap / Mining Overalls / Cavern Trekkers / Rough Rockers), every other skill's tools and pouches, combat armor and weapons (Copper to Diabolical sets), **Smithy set bonuses** (Copper +60% Mining/Choppin, Iron +25% Class EXP, Gold 1.5x coins, Platinum +60% Fishing/Catching, Dementia +50% critters/souls, Void +10% AFK, Lustre +75% damage; [Set Bonuses](https://idleon.wiki/wiki/Set_Bonuses)), **Stamps** (crafted stamp materials: Thief Hood to Twin Ores, Militia Helm to Duplogs, Copper Pickaxe to Swag Swingy Tool, Iron Platebody to Clover, Iron Hatchet to Cool Diggy Tool, Icing Ironbite to Potion), **Statues** (Anvil Statue product speed), Archer damage (Veins of the Infernal), inventory (bags), Construction indirectly (production items are building/quest materials, e.g. Chain Link).
  - **Fed by:** Mining and the Forge (bars), Choppin (logs), Fishing/Catching/Trapping/Worship (pouches), monster drops (anvil points with mats), Refinery salts (Tab 4/5 and late recipes), Alchemy (Hammer Hammer +1 production slot, Anvilnomics cheaper points), Gem Shop (Infinity Hammer +1 slot), Stamps (Anvil Zoomer; SmithExp stamps), Post Office (Blacksmith Box: Smithing EXP, production speed, chance for +1 upgrade slot on crafted items), Statues (Anvil), Star signs (Bob Build Guy, Sir Savvy), Cards (Fire/Cinder Forge passive EXP, from forge collections), Upgrade Vault (Production Revolution), Guild (Make or Break), W3 Automation Arm (auto-deposits production at daily reset).

- **Per-session actions:**
  - On every character: collect the anvil (Quick Deposit or Codex Quick Ref), make sure **all production slots are running** (1 base, +1 Hammer Hammer bubble equipped, +1 Infinity Hammer) and not at capacity (`currentAmount` at cap stops production).
  - Spend new anvil points (+1 per Smithing level) and buy points with coins/monster mats when cheap.
  - Craft newly affordable tier upgrades: next pickaxe and pouches first, then the next anvil tab.
  - Craft equipment on an Archer with Godly Creation for the chance at bonus stats (wiki: "% chance to apply a special bonus to any equip crafted at the anvil"; Godlier Creation bribe raises it from +4 to +12 stats).
  - **Idle/capped states:** a production slot empty or full; `availablePoints > 0`; a recipe whose materials are all in storage but not crafted.

- **AFK Setup implications:** Production runs regardless of the character's AFK activity, so it needs no AFK slot; it only needs the slots filled and capacity to last the AFK Stretch (Toolbox `getTimeTillCap`, [TB:parsers/world-1/anvil.ts#L223](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-1/anvil.ts#L223)). For Smithing EXP put all slots on Thread unless a product is short. An Archer AFK-fighting with **Smeltin' Erryday** gives "every kill a % chance to give seconds of instant forge progress" (talents.json [L2889](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L2889)), so the Forge benefits from Archers in combat AFK.

- **Min-max by stage:**

| Stage | Smithing Lv | Production | Anvil points | Craft priority |
|---|---|---|---|---|
| Early W1 | 1-15 | Thread x all slots; Trusty Nails when Stingers/Copper Platebody need them | All into **speed** (community W1 sheet; +2% each) | Copper Pickaxe, Cramped pouches (Material first for capacity), Copper Helmet/Platebody/Platelegs (keep a set for the W3 Smithy), Blue Tee |
| Late W1 | 15-20 | Thread; Chain Link (Lv 17) for Tab 2 and Average Material Pouch | speed; a few xp points while the EXP bonus is under its soft cap | Iron Pickaxe, Small pouches, **Anvil Tab 2**, Golden Peanut (Lv 18), Dirty Coal Miner pants |
| W2 | 20-35 | Thread | speed; buy coin points | Gold/Plat Pickaxe, Average/Sizable pouches, Mining Overalls, Viking Cap, Cavern Trekkers, **Anvil Tab 3** (Lv 35); Blacksmith Box; Hammer Hammer bubble equipped |
| W3 | 35-50 | Thread; Purple Screw (Lv 43) stockpile for Lustre Scales (60 K) | speed | Dementia and Void armor and tools, Big/Large pouches, **Anvil Tab 4** (Lv 50); unlock Smithy sets |
| W4 | 50-65 | Thread | speed | Lustre/Diabolical gear, Massive/Volumetric pouches, Rough Rockers, **Anvil Tab 5** (Lv 65) |
| W5+ outline | 65-100 | Thread | | Tabs 5-7 (Dreadlo/Marble/Godshard gear); Veins of the Infernal maxes at 100 |

  Per class: **Archer line** is the Smithing class: Acme Anvil (+1 anvil point, plus more every 10 Smithing levels; [TB talents.json L2901](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L2901); wiki notes you can spend Acme points then respec and keep the upgrades), Focused Soul (specialized skill EXP), Yea I Already Know (start levels with EXP per 250 AGI), Godly Creation, Smeltin' Erryday, Veins of the Infernal, Broken Time (Calm Basics, town production speed). **Bowman/Hunter** boost the Anvil statue (Shwifty / Straightshot Statues). High **AGI** raises production speed for any class (`getSpeedBonusFromAgility`). Beginner Happy Dude and Maestro Left Hand help everyone.

- **Common mistakes:**

| Mistake | How to detect |
|---|---|
| Producing high-tier products "because they are better" | `characters[].anvil.anvilProduction` shows slots on low-EXP items with no recipe demand; Thread is the EXP pick |
| Anvil points unspent or sunk into capacity | `anvil.anvilStats.availablePoints > 0`; high `capPoints` with a small material pouch |
| Only 1 production slot (Hammer Hammer not equipped) | `characters[].equippedBubbles` lacks HAMMER_HAMMER; `anvilSelected` length 1 |
| Anvil full during the AFK Stretch | `currentAmount` at `stats.anvilCapacity` from `getPlayerAnvil` |
| Not crafting the Copper set (needed later for the +60% Smithy bonus) | `account.armorSmithy.sets` COPPER_SET not unlocked |
| Smithing low on all but one character (Skill Mastery and the Cactolyte gate want totals) | `characters[].skillsInfo.smithing.level`; test accounts ranged 13-39, totals 89 and 154 |

- **Save and Toolbox fields:**
  - `characters[].skillsInfo.smithing` `{level, exp, expReq, rank}`; `characters[].anvil` = `{anvilProduction: [ [currentAmount, currentXP, currentProgress, totalProduced] x 14 ], anvilStats: {availablePoints, pointsFromCoins, pointsFromMats, pointsFromAcme, xpPoints, speedPoints, capPoints}, anvilSelected}`; `characters[].equippedBubbles`, `.postOffice`, `.flatTalents`, `.stats.agility`.
  - `account.anvil` (per-character list), `account.forge` (`list[16]` with `ore`, `barrel`, `bar`, `speed`, `isBrimestone`; `upgrades`; `oreCapacity`), `account.totalSkillsLevels.smithing`, `account.armorSmithy`, `account.cards` (Fire/Cinder Forge).
  - Toolbox-computed (ADR 0005): `getPlayerAnvil` (`stats.anvilSpeed` per hour, `stats.anvilCapacity`, `stats.anvilCost`), `calcAnvilExp`, `getTimeTillCap`, `getAnvilFutureProduction` ([TB:parsers/world-1/anvil.ts#L115-L257](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-1/anvil.ts#L115-L257)); `getForge` / `getForgeOreCapacity` ([TB:parsers/world-1/forge.ts#L27](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-1/forge.ts#L27), [L162](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-1/forge.ts#L162)); `getSkillExpMulti('smithing')`.

- **Sources:** see below.

---

## Sources

Game data and code (highest trust):
- Toolbox @ 6827d3f2 (2026-10-17): [parsers/efficiency.ts L83-L89, L231-L340, L651-L670](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L231-L340); [parsers/character.ts L555-L640, L3229, L3422-L3440](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3422-L3440); [parsers/portals.ts L1-L47](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/portals.ts#L1-L47); [parsers/world-1/anvil.ts L16-L257](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-1/anvil.ts#L16-L257); [parsers/world-1/forge.ts L27-L80](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-1/forge.ts#L27-L80); [parsers/world-3/armorSmithy.ts L62-L64](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-3/armorSmithy.ts#L62-L64); [data/website-data/monsters.json L13583-L13995](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/monsters.json#L13583-L13995) (vein toughness, EXP); [items.json L29307-L29630](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/items.json#L29307-L29630) (pickaxes); [shared-data.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json) (`anvilProducts` L529, `chips` L3562, `mapPortals` L25379, `postOffice` Dwarven Supplies L33682 / Blacksmith Box L33714, `refinery` L35480-L35595, `starSigns` Dwarfo Beardus L41312, `towers` L48623); [stamps.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/stamps.json) (Mana L48, Pickaxe L1015, Twin Ores L1103, Forge L2597); [cauldrons.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/cauldrons.json) (Roid Ragin L5, Stronk Tools L215, Hammer Hammer L1117); [vials.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/vials.json) (Blue Flav L471, Void Vial L627, Dreadnog L1433); [cards.json L312](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/cards.json#L312); [talents.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json) (Big Pick L1153, Copper Collector L1175, Motherlode Miner L1187, Tool Proficiency L1199, Smeltin' Erryday L2889, Acme Anvil L2901, Godly Creation L2925, Focused Soul L2937); [quests.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/quests.json) (Krunk L917, Glumlee L1044); `data/entity-graph.json` (item use edges).
- N.js client (Last-Modified 2026-10-17, v1.23): `RunCodeOfTypeXforThingY("ChanceToHarvest")`@4085115 and chance curve @4087955; `SkillStats("MiningMultiOre")`@4199215; `SkillStats("MiningSpeed")`@4200525; `SkillStats("MiningOreValue")`@4203407; `SkillStats("MiningMinigame")`@4203946; `SkillStats("SmithingEXPmulti")`@4204451; `HourlyKillRate("Mining")`@4431541; AFK Info ore/hr display @3807336; Skills Info panel @3640707; `na.TowerInfo`@14519175; Krunk dialogue @15328901; Glumlee dialogue @15332353; Cactolyte quest @15362043; v1.23 patch note @14132571.

Wiki (generated from game data; revision dates 2026-10-03 to 2026-10-07, before v1.23):
- [Mining](https://idleon.wiki/wiki/Mining), [Smithing](https://idleon.wiki/wiki/Smithing), [Forging](https://idleon.wiki/wiki/Forging), [Smithing/Anvil Tab 1](https://idleon.wiki/wiki/Smithing/Anvil_Tab_1), [Tab 2](https://idleon.wiki/wiki/Smithing/Anvil_Tab_2), [Tab 3](https://idleon.wiki/wiki/Smithing/Anvil_Tab_3), [Tab 4](https://idleon.wiki/wiki/Smithing/Anvil_Tab_4), [Portal Requirements](https://idleon.wiki/wiki/Portal_Requirements), [Copper Vein](https://idleon.wiki/wiki/Copper_Vein), [Gold Vein](https://idleon.wiki/wiki/Gold_Vein), [Dreadlo Vein](https://idleon.wiki/wiki/Dreadlo_Vein), [Set Bonuses](https://idleon.wiki/wiki/Set_Bonuses), [3D Printer](https://idleon.wiki/wiki/3D_Printer), [Royal Guardian](https://idleon.wiki/wiki/Royal_Guardian) (rev 2026-10-07).
- [Changelog 2025](https://idleon.wiki/wiki/Changelog_2025) (v2.28 2025-02-08 forge -80% and anvil anywhere; v2.41 2025-07-06 Veins cap; v1.00b 2025-11-09 statues no longer from skilling) and [Changelog 2026](https://idleon.wiki/wiki/Changelog_2026) (v1.07 2026-03-06 anvil craft speed; v1.20 2026-08-26 Royal Guardian).

Community (tier 3):
- "Idleon Complete Guide Sheet" by shadowstorm2204, W1 tab ([htmlview](https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview)), undated, post-W7 (after 2025-11-06), pre-Royal Guardian (before 2026-08-26): "go to the anvil and start producing threads", "best thing to produce for XP is Thread ... investing ALL your points into speed", "FORGE DONT FORGET ... always have ores smelting because you will need bars for gear, refinery".

Account State check: two private parsed saves (a W2 and a W3 account) were read for field names and aggregate patterns only.
