# System Dossiers: Choppin, Fishing, Catching (W1-W2 gathering skills)

- **Verified:** 2026-10-17, game v1.23 "Lumi Menagerie" (2026-10-16/17).
- **Ticket:** [#25](https://github.com/YassSoliman/idleon-forge/issues/25), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Format: [SYSTEM-DOSSIER.md](../../SYSTEM-DOSSIER.md). Terms: [GLOSSARY.md](../../../../GLOSSARY.md).
- **Pinned sources:**
  - Toolbox [Morta1/IdleonToolbox @ 6827d3f2](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2) (2026-10-17). Tier 1. Short form below: `TB/<path>` = `https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/<path>`.
  - Game client [`N.js`](https://www.legendsofidleon.com/ytGl5oc/N.js), Last-Modified 2026-10-17, newest patch note `Luminous_Menagerie_v1.23` (@14132571). Cited as `symbol@offset`. Tier 1.
  - idleon.wiki bot-data pages [Choppin](https://idleon.wiki/wiki/Choppin) (rev 2026-10-03), [Fishing](https://idleon.wiki/wiki/Fishing) (rev 2026-10-03), [Catching](https://idleon.wiki/wiki/Catching) (rev 2026-10-03), [Post Office](https://idleon.wiki/wiki/Post_Office) (rev 2026-10-07). Tier 2. Tables are generated from game data; the prose sentences may be older than the revision date. **All predate v1.23 by about two weeks.**
  - Talents guide sheet by Fibster/Tetsu ([pubhtml](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml)), last changelog 2024-07-12. Tier 3, **Stale** (pre Master Classes). Used only to corroborate class affinity.
- **v1.23 check:** the full `Luminous_Menagerie_v1.23` note in N.js (@14132571) changes nothing in Choppin, Fishing or Catching (its only "Log" hit is the W7 "What's Under The Log" minigame). Everything below is treated as current. (H)
- **Confidence:** H = read in game data or code. M = my reading of code or control flow. L = community opinion or unrecorded source.

**Cross-cutting facts for all three skills (read once):**

1. **They are AFK targets.** Each gathering node is a "monster" with `AFKtype` `CHOPPIN`, `FISHING` or `CATCHING` in [`TB/data/website-data/monsters.json` L14025-L15920](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/monsters.json#L14025-L15920). Its `Defence` is the efficiency it asks for, and `ExpGiven` is its base EXP. (H)
2. **No skill-level gate on nodes, except two fishing portals.** Nodes have no level requirement. What gates them is map access (the map's normal kill portal) and efficiency. The tool, not the node, carries the skill-level requirement (`lvReqToEquip`). The two exceptions are the Fishing portals: Faraway Piers needs Fishing 15 and Deepwater Docks needs Fishing 30 ([`TB/data/website-data/shared-data.json` `mapDetails` L18750](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L18750), maps 54/55 = `[15]`/`[30]`; wiki Fishing). (H)
3. **Each skill has one main stat, one specialist class line, and one cauldron.**

   | Skill | Stat | Specialist talents on | Tool bubble (cauldron) | Statue | Post Office box | Star sign |
   |---|---|---|---|---|---|---|
   | Choppin | WIS | **Mage** tab (every mage) | Le Brain Tools (High-IQ, purple) | Lumberbob | Taped Up Timber | Hipster Logger |
   | Fishing | STR | **Barbarian** tab | Stronk Tools (Power, orange) | Oceanman | Sealed Fishheads | Pie Seas |
   | Catching | AGI | **Bowman** tab (not Hunter) | Sanic Tools (Quicc, green) | Ol' Reliable | Bug Hunting Supplies | Shoe Fly |

   Sources for the table: [`TB/parsers/efficiency.ts` L356-L548](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L356-L548) and [`TB/data/website-data/talents.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json). (H)

   The tool bubble's class multiplier only applies when the character's main stat matches that cauldron: `getBubbleBonus(..., isWisdom/isStrength/isAgility)` ([`TB/parsers/world-2/alchemy.ts` L418-L445](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-2/alchemy.ts#L418-L445)). So a Mage gets more from Le Brain Tools, a Warrior from Stronk Tools and an Archer from Sanic Tools. (M)
4. **Toolbox computes both numbers ActiveOn needs.** `getSkillEfficiency('chopping'|'fishing'|'catching', ...)` gives skill efficiency with a breakdown ([`TB/parsers/efficiency.ts` L640-L671](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L640-L671)). `getAfkGain(character, ...)` gives the AFK gain rate for `afkType` CHOPPIN/FISHING/CATCHING ([`TB/parsers/character.ts` L3229-L3540](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3229-L3540)). Toolbox does **not** compute the multi-drop tier reached or EXP/hour for these skills. Compare efficiency against the node thresholds below (game-table numbers; the arithmetic is ours), and read EXP/hour in-game from AFK Info. (H)
5. **Lifetime counts matter.** The Upgrade Vault's "Schoolin' the Fish" gives Class EXP per power of 10 fish ever caught. "Bug Power En Masse" gives Total Damage per power of 10 bugs ever caught ([`shared-data.json` `upgradeVault` L49887-L49959](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L49887-L49959)). Every catch counts, not only stockpiles. (H)

---

## Choppin

- **What it is:** a W1 gathering skill. A character swings a hatchet at a tree and gets logs, rare leaves, Choppin EXP and drops. Main stat WIS; tool slot Hatchet; skill type Efficiency + AFK ([wiki Choppin](https://idleon.wiki/wiki/Choppin)). (H)
- **Unlocks:** available from the start. The first tree (Oak) is in Spore Meadows, the first combat map in W1 ([N.js `ja.MapAFKtargetSide`@13859852](https://www.legendsofidleon.com/ytGl5oc/N.js), map 1 = `OakTree`). There is a minigame with 5 plays a day on the account, resetting with the shop. It gives logs, leaves and EXP, needs at least 5% efficiency, and its highscore feeds the Mage talent Choppin It Up Ez ([wiki Choppin](https://idleon.wiki/wiki/Choppin#Choppin_Minigame)). (H)
- **Scope:** both.
  - **Per character:** Choppin level, efficiency, hatchet, AFK target, talents and Post Office boxes.
  - **Account-wide:** logs and leaves (the storage chest), statues, stamps, bubbles, vials, cards and Skill Mastery (total Choppin level across all characters, W4 Rift 16).
  - Leaf Thief reads Grass Leaves from the chest, and Teleki'net'ic Logs (Bowman) reads Oak Logs from the chest ([`TB/parsers/efficiency.ts` L376](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L376-L376), L508). (H)
- **Inputs → outputs:**
  - Inputs are AFK or active time on a tree map.
  - Outputs are the log (1 per success at "100%", up to x4 multi-log above that), leaves (about 0.4% per action; Grass/Twisty/Arctic/Galactic by world), Choppin EXP, tree cards, and a shared drop table (Tool/Weapon Upgrade Stones, Golden food, Silver Pen, Talent Point Reset Fragment, Mystery Stones) ([`TB/data/entity-graph.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/entity-graph.json) `drops` edges for `monster:OakTree`, `monster:Tree7`, `monster:AlienTree`).
  - **Efficiency formula** (Toolbox port of `SkillStats("ChoppinEfficiency")`): **8 + (power^1.3 + WIS term + stamps + base skill eff) × multipliers**. The multipliers are: level (1 + Lv/200), WIS (with Deforesting All Doubt and Skill Wiz), power, Leaf Thief, all-skill efficiency, Post Office + Right Hand of Action + star sign, Hocus Choppus + Monument, Smart Efficiency + gear + obols + Skill Mastery + vote + Copper Set, and cards + vial + achievement ([`TB/parsers/efficiency.ts` L356-L421](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L356-L421)). (H)

**Trees, W1-W4 in depth.** Efficiency columns come from the wiki tree table, which is bot data. "First" is the minimum efficiency for any chance, "100%" means 1 log per success, and x2/x3/x4 are the multi-log thresholds ([wiki Choppin#Trees](https://idleon.wiki/wiki/Choppin#Trees)). EXP and Defence come from monsters.json. Maps come from `MapAFKtargetSide`@13859852 and the wiki.

| Tree → product | Map (world) | First | 100% | x2 | x3 | x4 | Base EXP |
|---|---|---|---|---|---|---|---|
| Oak Tree → Oak Logs | Spore Meadows (W1) | 3 | 100 | 1.6K | 8.1K | 25.6K | 2 |
| Birch Tree → Bleach Logs | Valley of the Beans (W1) | 10 | 400 | 6.4K | 32.4K | 103K | 6 |
| Jungle Tree → Jungle Logs | Vegetable Patch, Grandfrog's Gazebo (W1) | 30 | 1.2K | 19.2K | 97.2K | 308K | 12 |
| Forest Tree → Forest Fibres | Tucked Away (W1) | 100 | 4K | 64K | 324K | 1.03M | 20 |
| Palm Tree → Tropilogs | Dessert Dunes (W2) | 250 | 10K | 160K | 810K | 2.56M | 32 |
| Toilet Tree → Potty Rolls | Poopy Sewers (W1) | 875 | 35K | 560K | 2.84M | 8.96M | 50 |
| Stump Tree → Veiny Logs | Hollowed Trunk (W1) | 2.5K | 100K | 1.6M | 8.1M | 25.6M | 90 |
| Saharan Foal → Tundra Logs | Steep Sheep Ledge (W3) | 3.75K | 150K | 2.4M | 12.2M | 38.4M | 150 |
| Wispy Tree → Wispy Lumber | Waterlogged Entrance, Igloo's Basement (W3) | 7.5K | 300K | 4.8M | 24.3M | 76.8M | 275 |
| Alien Tree → Alien Hive Chunk | Outskirts of Fallstar Isle (W4) | 17.5K | 700K | 11.2M | 56.7M | 180M | 500 |
| Cubed Tree → Cubed Logs | Standstill Plains, OJ Bay (W4) | 37.5K | 1.5M | 24M | 122M | 384M | 1,250 |
| *W3+ side:* Equinox Willow → Willow Logs | Equinox Valley (W3 Equinox) | 1.05M | 42M | 672M | 3.41B | 10.8B | 8,500 |
| *W5+:* Maple, Dandelioli (W5); Bamboo, Effervescent Eucalyptus (W6); Ancient Seaweed (W7); Evertree (The Hole) | | 150K to 500M | | | | | 2.5K to 150K |

Ordering note (H): **Potty Rolls and Veiny Logs sit on W1 maps but need more efficiency than W2 Tropilogs.** Defence is Palm 1,000 < Toilet 3,500 < Stump 10,000 ([monsters.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/monsters.json#L14025-L14520)). A player who walks the trees in world order will stall at Poopy Sewers. Choppin's real ladder is Oak → Bleach → Jungle → Forest → Palm → Toilet → Stump → Tundra → Wispy → Alien → Cubed.

**Hatchets** (stats from [`TB/data/website-data/items.json` L29682-L30056](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/items.json#L29682-L30056); recipes from [`TB/data/website-data/crafts.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/crafts.json#L177-L28430); anvil tab and recipe from the wiki tools table). "Lv" is the Choppin level needed to equip.

| Hatchet | Lv | Power | WIS | Source and cost |
|---|---|---|---|---|
| Old Hatchet | 2 | 3 | 1 | Quest "A noob's 2nd first swing" (Woodsman) ([bot-wiki-index](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/bot-wiki-index.json)) |
| Copper Chopper | 4 | 7 | 3 | Anvil tab 1: **6 Oak Logs** |
| Iron Hatchet | 8 | 10 | 5 | Anvil tab 1: **200 Jungle Logs** |
| Grumbie the Hatchet Hammer | 10 | 5 | 0 (12 STR) | Grumblo drop; +5% *Mining* efficiency. This is a miner's hatchet, not a chopper's |
| Golden Axe | 15 | 14 | 8 | Anvil tab 2: Iron Hatchet + 5 Golden Dubloon + 2,000 Crabby Cakey |
| Stinky Axe | 15 | 18 | 8 | Drop from Dr Defecaus (W1 Poopy Sewers boss); 6 upgrade slots, higher power than Golden Axe |
| Plat Hatchet | 20 | 18 | 14 | Anvil tab 2: Golden Axe + **6,500 Tropilogs** + 5,000 Chain Link |
| Dementia Dicer | 25 | 23 | 17 | Anvil tab 3: Plat Hatchet + **15,000 Tundra Logs** + 50 Redox Salts |
| Void Imperium Axe | 30 | 26 | 20 | Anvil tab 3: Dicer + **50,000 Wispy Lumber** + 5 Dense Water |
| Lustre Logger | 40 | 29 | 24 | Anvil tab 4: Void Axe + **110,000 Alien Hive Chunk** + 600 Dioxide Synthesis |
| Starfire Hatchet | 50 | 35 | 28 | Anvil tab 4: Lustre + **100,000 Cubed Logs** + 5 Pearler Shell |
| *W5+:* Dreadlo 65 (250K Maple), Marbiglass 75 (+5% chop eff, 3M Willow), Annihilator of the Yggdrasil 90 (+12%), Prehistoric Choppah 100 (+25%) | | | | Anvil tabs 5-7 |

Each hatchet costs logs from a tree you can only reach well with the previous hatchet. **The hatchet chain is the Choppin Purpose ladder.** (H)

**Goals and Milestones**

| Milestone | Threshold | Reward | Source |
|---|---|---|---|
| Skill Mastery (W4, after Rift 16) | Total Choppin level across all characters: 150 / 200 / 300 / 400 / 500 / 750 / 1K | +25% Choppin EXP / **+10% Choppin eff** / **all Choppin cards passive** / +10% all skill EXP / +5% all skill eff / +1% printer / +25% all skill EXP | [wiki Choppin#Skill Mastery](https://idleon.wiki/wiki/Choppin#Skill_Mastery) (H) |
| Copper Set | Wear 3 Copper armour pieces + 1 tool, or unlock the set at the W3 Armor Smithy | **+60% Mining and Chopping efficiency** | [N.js `La.EquipmentSets`@14935103](https://www.legendsofidleon.com/ytGl5oc/N.js); [`TB/parsers/world-3/armorSmithy.ts` L13-L64](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-3/armorSmithy.ts#L13-L64) (H) |
| Achievements | 1,500 Oak Logs in chest ("1.5 Ki'log'grams"); 500K Veiny Logs ("Half a Mill-log"); "Effervess Enthusiess" gives +10% Choppin eff (W6) | Achievement points and bonus | [entity-graph](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/entity-graph.json) `about` edges; [N.js chest-quantity checks](https://www.legendsofidleon.com/ytGl5oc/N.js)@5141499 (H) |
| Cards | Bleach Logs card +5%/tier, Alien Hive card +8%/tier Choppin eff; Potty/Wispy/Cubed cards add Choppin speed; Palm and Tundra cards add Choppin AFK gains | Efficiency, speed, AFK | [`TB/data/website-data/cards.json` L342-L1102](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/cards.json#L342-L1102) (H) |
| Card set "Easy Resources" (Oak, Birch, Jungle, Forest, Goldfish, Hermit, Jelly, Fly, Butterfly cards) | Full set | +8% Skill Efficiency | [`shared-data.json` `cardSets` L3482-L3500](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L3482-L3500) (H) |
| Choppin EXP quests | e.g. Woodsman chain (3, 30, 1,000 Oak; 1 Forest Fibre); Hamish (Copper Chopper → Tomahawk Stamp; Purple Tupacband → Choppin' Bag Stamp) | EXP, stamps, Stump Prop (+5% chop eff hat) | [wiki Choppin#Choppin Exp Quests](https://idleon.wiki/wiki/Choppin#Choppin_Exp_Quests) (H) |

- **Feeds / fed by:**

  **What each log feeds (W1-W4).** From Toolbox's entity graph (`craftedFrom`, `upgradedWith`, `requires`, `refinedFrom` edges), [stamps.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/stamps.json), [cauldrons.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/cauldrons.json), [vials.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/vials.json), refinery and chips in [shared-data.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L35479-L35640), and Post Office orders in [N.js `ja.PostOfficePossibleOrders`@14040869](https://www.legendsofidleon.com/ytGl5oc/N.js). (H)

  | Log | Stamps (upgrade material) | Alchemy | Smithing / anvil | Refinery / Lab / PO / quests |
  |---|---|---|---|---|
  | Oak Logs | Heart, Pickaxe, Ball Timer | Stable Jenius bubble (+WIS all players); Sippy Splinters vial | Copper Chopper (6), Copper Platelegs (150), Blue Tee, Choppin pouch, Fiberous Footings (300K, +35% chop eff shoe) | PO Simple Shippin 200; Lab chip Grounded Motherboard 30K; Woodsman quests; **Bowman Teleki'net'ic Logs scales with Oak in chest** |
  | Bleach Logs | Fist | Startue EXP bubble | Top Hat (→ Witch Hat +10% chop eff), Birch Longbow, Bleached Designer Wode Patch Pants (+5% chop eff), Peanut | PO 100; Krunk, Picnic Stowaway, Stiltzcho quests |
  | Jungle Logs | Lil' Mining Baggy | Hearty Diggy bubble; Jungle Juice vial | **Iron Hatchet (200)**, **Anvil Tab 2 (100)**, Iron Platebody (60, feeds Clover stamp), **Copper Netted Net (500)**, Logger Heels (1,600; +20% chop eff), Saucy Logfries (choppin speed food) | PO 80 |
  | Forest Fibres | Alch Go Brrr | Anvilnomics bubble | **Reinforced Net (800)**, Logger Heels (1,000), Amarok Helmet (2,500), Royal Bayonet, Bullet | **Explosive Salts (5/cycle) → Construction**; Woodsman 4, Dazey quests (1,000 each) |
  | Potty Rolls | Buzz Buzz (multi-bug) | Cookin Roadkill, **Prowesessary** bubbles; Tea with Pea vial | Bandage Wraps (2,000) | PO 125; Funguy quest |
  | Tropilogs | none | none | **Plat Hatchet (6,500)**, Platinum Boots (7,000), Sleek Coif (+10% catch eff hat) | PO 110 |
  | Veiny Logs | none | All For Kill bubble | Blunder Skills Completion Token (2,000) | PO 100; Lab chip Conductive Nanochip 100K; "Half a Mill-log" achievement |
  | Tundra Logs | Biblio | Call Me Ash bubble (Trapping); **The Spanish Sahara vial (+1%/lvl Choppin eff)** | **Dementia Dicer (15K)**, Spriggly Storm | none |
  | Wispy Lumber | none | Ignore Overdues bubble (Talent Library) | **Void Axe (50K)**, Void Shardshins | **Nullo Salt (5/cycle)** |
  | Alien Hive Chunk | Nest Eggs | Nickel of Wisdom bubble | **Lustre Logger (110K)**, Slimsharp Fin, Peeper Pouch | PO Cosmic Carrier 300 |
  | Cubed Logs | none | Matrix Evolved bubble (Lab EXP) | **Starfire Hatchet (100K)**, **Anvil Tab 5 (200K)**, Diabolical Abdomen | PO Cosmic Carrier 300; Lab chip Wood Chip 250K |
  | Leaves | Grass: Battleaxe; Twisty: Talent S; Arctic: Talent III | none | Amarok Paws (Grass 125) | Lonely Hunter quest; Eco-Friendly Oil; **Mage Leaf Thief scales with Grass Leaves in chest** |

  **Systems that do NOT take logs** (checked, H):
  - **Forge:** ores only.
  - **Anvil production:** it makes thread, nails and the like from production points, not from inputs ([`shared-data.json` `anvilProducts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json)).
  - **Construction buildings and Shrines:** every building's cost in `na.TowerInfo`@14519175 is a Refinery salt plus "Blank". Logs reach Construction **only through Refinery salts** (Forest Fibres → Explosive Salts, Wispy → Nullo).
  - **Cooking, Breeding, Worship and Trapping:** none of these consumes logs, except through the bubbles and stamps listed above.

  **Fed by:**
  - Mage talents.
  - Stamps: Hatchet (+1 base eff/lvl, Thread), Swag Swingy Tool (+2/lvl, Copper Pickaxe), Duplogs (multi-log), Choppin' Bag (carry), High IQ Lumber (EXP).
  - Lumberbob statue: Choppin Power. Drops from Wood Mushroom, Crystal Carrot, Crystal Cattle and Random Events ([wiki Statues](https://idleon.wiki/wiki/Statues)).
  - Bubbles Le Brain Tools (costs **Sentient Cereal** from Catching), Hocus Choppus and Tree Sleeper (AFK). Vial The Spanish Sahara.
  - Post Office Taped Up Timber: Choppin eff, Prowess and Choppin AFK gain ([`shared-data.json` L33746](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L33746)).
  - Star signs Hipster Logger (+5% chop eff, +20% multi-log), The Big Comatose and The OG Skiller (skill AFK) ([`shared-data.json` L41329](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L41329)).
  - Obols Platinum Lumby Loggo (2%) and Dementia WOWOWOWWO (8%); gear pieces in the table below; Copper Set; Skill Mastery; Bonus Ballot vote; W4 Lab jewel Emerald Navette (+200 base eff all skills).
- **Per-session actions:**
  1. Spend the 5 minigame plays. Each gives logs, leaves and EXP, and raises the highscore that Choppin It Up Ez scales on.
  2. On a Mage, cast **Log On Logs** before leaving. It is a timed buff ("For { minutes, trees drop }% more logs"). The 2024 guide calls it "a pretty big boost".
  3. Check the AFK target is the highest tree at or above "100%" for the material you need.
  4. Craft the next hatchet once the log count allows.
  5. Feed Oak Logs and Grass Leaves into storage: they power Teleki'net'ic Logs and Leaf Thief.
  6. Since v2.28 (2025-02-08) you can "tick" a node: start chopping, run away, run back, for fast active skilling ([wiki Changelog 2025](https://idleon.wiki/wiki/Changelog_2025)).

  **Capped or idle states:**
  - Carry capacity is full. Choppin pouches and the Choppin' Bag stamp raise it.
  - The AFK target is still a tree whose hatchet you have already crafted, and nothing downstream needs that log.
  - Efficiency is below "First" on the target (zero gains).
- **AFK Setup implications:** Choppin wants a **Mage-line character** (Wizard, Shaman, Elemental Sorcerer, Bubonic Conjuror, Arcane Cultist): the Mage tab carries every Choppin talent, and Smart Efficiency and Active AFK'er sit on the Savvy (mage) Basics tab.
  - Toolbox only applies **Active AFK'er** to the CHOPPIN AFK rate, not Idle Skilling ([`TB/parsers/character.ts` L3450-L3476](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3450-L3476)). (M: this is Toolbox's port; the talent text says "all Specialized Skills".)
  - On W1-W3 accounts, one mage on the current hatchet-tier tree is enough for gear. Add a second when Refinery (Forest Fibres, Wispy) or Post Office orders run dry.

**Choppin gear (efficiency %, wiki bonus table):**

| Slot | Item | Choppin eff |
|---|---|---|
| Helmet | Stump Prop / Witch Hat | 5% / 10% |
| Shirt | Furled Robes | 20% |
| Pants | Bleached Designer Wode Patch Pants | 5% |
| Shoes | Logger Heels / Fiberous Footings | 20% / 35% |
| Food | Saucy Logfries / Chogg Nog | +15% / +25% Choppin speed |

- **Min-max by stage:**

  | Stage / Choppin Lv | AFK target | Why (Purpose) | Do alongside |
  |---|---|---|---|
  | Early W1, Lv 1-7 | Oak (Spore Meadows), then Bleach | 6 Oak → Copper Chopper; Woodsman quests; Heart/Pickaxe stamps; Copper Platelegs for the Copper Set | Copper Set (+60% eff) ASAP; Hatchet + Swag Swingy stamps |
  | Mid W1, Lv 8-15 | Jungle (Vegetable Patch) → Forest Fibres (Tucked Away) | 200 Jungle → Iron Hatchet; 100 → Anvil Tab 2; 500 → Copper Netted Net (Catching); 800 Fibres → Reinforced Net; Logger Heels | Lumberbob statue; Mage talents Deforesting All Doubt, Leaf Thief |
  | W2, Lv 15-25 | Palm (Dessert Dunes); then Toilet / Stump once eff ≥ 35K / 100K | 6,500 Tropilogs → Plat Hatchet (Lv 20); Platinum Boots for the Platinum Set (Fishing/Catching!); Potty Rolls for Prowesessary / Buzz Buzz | Le Brain Tools and Hocus Choppus bubbles; Taped Up Timber boxes on the mage; Hipster Logger star sign |
  | W3, Lv 25-40 | Tundra (Steep Sheep Ledge) → Wispy (Waterlogged Entrance) | 15K Tundra → Dicer; Spanish Sahara vial; 50K Wispy → Void Axe; Nullo Salt for Refinery and Construction | Skill Wiz (ES / Bubonic); Tree Sleeper bubble; Copper Set at the Armor Smithy |
  | W4, Lv 40-50+ | Alien Hive (Fallstar Outskirts) → Cubed (Standstill Plains) | 110K Alien → Lustre Logger; Alien Hive card (+8%/tier eff); 100K Cubed → Starfire Hatchet; 200K → Anvil Tab 5; Wood Chip | **Skill Mastery: push total Choppin Lv to 200 (+10% eff) and 300 (cards passive)**; Maestro Right Hand of Action |
  | W5+ outline | Maple → Dandelioli; Equinox Willow | Dreadlo / Marbiglass hatchets; Evertree in The Hole for low-level choppers (2025 community tip, L) | n/a |

  **Per-class view:**
  - **Mage line:** the only line with Choppin talents (Log On Logs, Leaf Thief, Deforesting All Doubt, Choppin It Up Ez; [`talents.json` L4403-L4472](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L4403-L4472)). Elemental Sorcerer and Bubonic Conjuror add **Skill Wiz**, WIS impact up to +60% ([L5063](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L5063)). A 2025-05-19 r/idleon post reports Bubonic Conjuror far above Elemental Sorcerer in Choppin efficiency ([reddit](https://reddit.com/r/idleon/comments/1kqci0p/bubo_has_almost_100t_more_choppin_efficiency_than/)). (L)
  - **Journeyman → Maestro:** Right Hand of Action gives up to +150% efficiency to every other character whose Choppin level is below the Maestro's ([L593](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L593)). So level the Maestro in Choppin too. (H)
  - **Warriors and Archers** chop at a big WIS penalty. Use them only for quick active tick-chopping.
- **Common mistakes (and how to detect from the save):**
  1. **Nobody AFKs Choppin.** No `characters[].afkType == 'CHOPPIN'`. Example: a W2 account had 5 characters, none on Choppin, best Choppin level 23.
  2. **A non-mage on trees.** `afkType=='CHOPPIN'` while `characters[].class` is not a mage-line class.
  3. **Wrong tree order.** Walking world order (stalling on Potty Rolls before Tropilogs is maxed). Compare `getSkillEfficiency('chopping')` to the 100% column.
  4. **Old hatchet.** `characters[].tools[1]` is below the `lvReqToEquip` the character's Choppin level allows. Slot index 1 is the hatchet (M; slot 3 is the net, checked on a save).
  5. **Unspent minigame plays.** `account.highscores.minigameHighscores[name=='chopping']` stays flat across sessions.
  6. **Log On Logs never cast before AFK.** Not in the save. Ask the player.
- **Save and Toolbox fields:**
  - `characters[].skillsInfo.chopping.{level,exp,expReq,rank}`, `characters[].afkType` / `afkTarget` / `mapIndex`, `characters[].tools[]`, `characters[].stats.wisdom`, `characters[].flatTalents`, `characters[].postOffice`, `characters[].starSigns`, `characters[].obols`.
  - `account.storage.list` (Oak Logs, Leaf1), `account.totalSkillsLevels.chopping.level` (Skill Mastery), `account.highscores.minigameHighscores`, `account.statues[6]` (Lumberbob), `account.stamps.skills`, `account.alchemy.{bubbles,vials}`, `account.cards`, `account.armorSmithy.sets`.
  - Toolbox numbers: `getSkillEfficiency('chopping', …)` and `getAfkGain(…)` (afkType CHOPPIN). Both verified present at 6827d3f2. (H)
- **Sources:** see the end of file. Key: [wiki Choppin](https://idleon.wiki/wiki/Choppin) (rev 2026-10-03, pre-v1.23), [`TB/parsers/efficiency.ts` L356-L421](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L356-L421), [`TB/data/website-data/talents.json` Mage L4252-L4472](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L4252-L4472), N.js `ja.MapAFKtargetSide`@13859852.

---

## Fishing

- **What it is:** a W2 gathering skill. A character casts a rod into a fish pool and gets fish, Fishing EXP and drops. Efficiency both raises catch quantity and speed, and decides **which depth (fish species)** is caught. Main stat STR; tool slot Fishing Rod; there is a second account-wide "toolkit" of bait and line ([wiki Fishing](https://idleon.wiki/wiki/Fishing)). (H)
- **Unlocks:** W2 Yum-Yum Desert.
  - Salty Shores (map 54) has 2 small pools and the whale NPC Whattso.
  - **Faraway Piers needs Fishing Lv 15** (3 small pools; the toolkit vendor; Fishpaste97; Scubidew).
  - **Deepwater Docks needs Fishing Lv 30** (3 medium pools; Omar Da Ogar; the raft to Island Expeditions).
  - Large fish come only from **Seasalt Island via Island Expeditions** (W2).

  Sources: [wiki Fishing#Fishing Areas](https://idleon.wiki/wiki/Fishing#Fishing_Areas); `mapDetails` maps 54/55 = `[15]`/`[30]` ([shared-data.json L18750](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L18750)). (H)
- **Scope:** both.
  - **Per character:** level, efficiency, rod, AFK pool, **chosen bait and line**. The save stores them in `PersonalValuesMap.FishingToolkit` ([`TB/parsers/character.ts` L301-L305](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L301-L305)).
  - **Account-wide:** owning a toolkit accessory ("add this accessory to your fishing toolkit, where it can be accessed by all characters", [items.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/items.json)), fish in the chest, the Fishing minigame highscore and Skill Mastery. (H)
- **Inputs → outputs:**
  - Inputs are time at a pool, a rod, and bait + line.
  - Outputs are fish (multi-fish possible), Fishing EXP, fish cards, and a drop table (Bugsack Stamp, Paper Boat, Silver Pen, Golden Meat Pie, obols, Mystery Stone I) ([wiki Fishing#Drops](https://idleon.wiki/wiki/Fishing#Drops)). Active fishing can hurt: a caught fish hits the character's head with its Attack if their Defence is lower (wiki).
  - **Efficiency formula:** **(power^1.3 + STR^0.6 × (1+Skill Strengthen) + stamps + base) × multipliers**. Power includes the toolkit's bait+line POW and Bobbin' Bobbers (capped by the minigame highscore). The STR multiplier is scaled by Skill Strengthen, Skill Mastery, the vote, the Platinum Set, the Fishermaster bribe and the Skelefish stamp (% per Fishing Lv). Other multipliers: level, power, Golden Ribs, Brute Efficiency, star sign, all-skill efficiency, Post Office + Right Hand, and cards + vial + gear + obols + Poppy ([`TB/parsers/efficiency.ts` L423-L487](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L423-L487)). (H)

**Fish pools and depths** (game data: [N.js `La.FishPools`@14933983](https://www.legendsofidleon.com/ytGl5oc/N.js). Each pool array is [fish], [base EXP], [attack], [min efficiency for depth 2/3/4], [cards], [card chance]. Cross-checked with [wiki Fishing#Fish](https://idleon.wiki/wiki/Fishing#Fish)). (H)

| Pool (where) | Depth 1 (green) | Depth 2 (yellow) | Depth 3 (red) | Depth 4 (purple) |
|---|---|---|---|---|
| Small (Salty Shores, Faraway Piers; W2) | Goldfish: eff 0, EXP 4, atk 25 | Hermit Can: eff 50, EXP 7, atk 70 | Jellyfish: eff 200, EXP 12, atk 120 | Bloach: eff 400, EXP 21, atk 200 |
| Medium (Deepwater Docks, Lv 30; W2) | Skelefish: 0 / 35 / 300 | Sand Shark: 10K / 60 / 750 | Manta Ray: 50K / 92 / 1.5K | Kraken: 200K / 150 / 4K |
| Large (Seasalt Island via Island Expeditions; W2 late) | Icefish: 0 / 450 / 5K | Shellfish: 1M / 1.6K / 6K | Jumbo Shrimp: 5M / 3.5K / 8K | Caulifish: 30M / 30K / 10K |
| *W3 Equinox:* Equinox pool (Equinox Valley) | Equinox Fish at every depth: 0 / 400K / 2M / 12M eff, EXP 2K | | | |
| *W5 Hole:* Trench pool | Trench Fish | | | |

- **How depth works:** efficiency must reach the depth's minimum before that fish can appear. The bait and line then **weight** the four depths ("the four colored Xs increase the chance of catching the fish of that depth"). Each spot also has its own rates (wiki).
- **What the toolkit columns mean:** [N.js `ja.FishToolkitInfo`@14039605](https://www.legendsofidleon.com/ytGl5oc/N.js); [`shared-data.json` `fishingKits` L9224](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L9224). FExp = Fishing EXP, FSpeed = shorter catch time, FPow = flat Fishing Power.

**Toolkit, W2-W4 relevant pieces.** Columns are depth weights D1-D4, then EXP / Speed / Pow. Sources: [Toolbox bot-wiki-index](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/bot-wiki-index.json); `shops[3]` = Faraway Piers vendor ([shared-data.json L1956](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L1956)); wiki Fishing Accessories.

| Kind | Name | D1 | D2 | D3 | D4 | EXP | Speed | Pow | Source |
|---|---|---|---|---|---|---|---|---|---|
| Bait | Fly (default) | 2 | 1 | 0 | 0 | 0 | 0 | 0 | default |
| Bait | Wormie (Wormie Weight) | 0 | 15 | 0 | 0 | 5 | 0 | 0 | Piers vendor; Whattso "Mopey Dick" |
| Bait | Iron Hook | 3 | 2 | 0 | 0 | 0 | 3 | 1 | Scubidew / Carpetiem quests |
| Bait | Basic Bobber | 0 | 3 | 3 | 0 | 4 | 4 | 1 | Soda Can drop; Scubidew quest |
| Bait | Dualhook Prongs | 0 | 0 | 4 | 4 | 0 | 8 | 3 | Alien / Cubed trees (W4); Crystal Custard |
| Bait | Pound of Steel | 0 | 0 | 0 | 30 | 2 | 2 | 0 | Piers vendor |
| Bait | Pound of Feathers | 0 | 0 | 35 | 10 | 0 | 5 | 0 | Fishpaste97 "Can you do the Can Can?" |
| Bait | Massless Unit | 20 | 0 | 0 | 0 | 10 | 0 | 0 | Crystal Custard, Trolls, TV |
| Bait | Literal Elephant | 0 | 0 | 20 | 60 | 0 | 0 | 6 | Loominadi quest |
| Bait | Dynamite / Not Dynamite | 0/12 | 0/12 | 10/0 | 20/0 | 0 | 0 | 2/4 | Piers vendor |
| Bait | Triple Threat | 0 | 0 | 0 | 0 | 6 | 6 | 6 | Whattso "Bobbin' Bobbers" |
| Bait | Crash Box / Fat Albert | 0 | 0 | 0 | 11/0 | 0/10 | 12/0 | 5/19 | Trolls, Clammie, Octodar / Royal Worm quest |
| Line | Fishing Twine (default) | 0 | 3 | 0 | 0 | 0 | 0 | 0 | default |
| Line | Copper Twine | 0 | 3 | 5 | 0 | 0 | 3 | 0 | Piers vendor |
| Line | Silver Twine | 0 | 0 | 20 | 0 | 15 | 0 | 0 | Carpetiem quest |
| Line | Gold Twine | 0 | 0 | 8 | 20 | 22 | 6 | 2 | Flombeige |
| Line | Platinum Twine | 0 | 0 | 30 | 30 | 35 | 12 | 5 | Crystal Capybara; Dandelioli / Willow trees (W5+) |
| Line | Leafy Vines / Needledrop | 0 | 0 | 10/5 | 0/10 | 0/5 | 0 | 2/0 | Piers vendor |
| Line | Electrical Wiring / Wiener Links | 0 | 0 | 5/17 | 20/5 | 0 | 2/3 | 5/10 | Whattso quest / Crystal Custard, Trolls |
| Line | Zeus Gon Fishin | 0 | 0 | 0 | 30 | 0 | 5 | 20 | Skydoggie Spirit |
| Line | Its a Boy / Girl / Alright | 0 | 0 | 0 | 0 | 0/15/8 | 15/5/8 | 5/0/8 | TV / W4+ bugs (Bee, Fairy...) / Samurai Guardian |

**Fishing rods** ([items.json L30057-L30381](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/items.json#L30057-L30381); [crafts.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/crafts.json#L2358-L2400)). "Lv" is the Fishing level needed to equip.

| Rod | Lv | Power | STR | Source and cost |
|---|---|---|---|---|
| Wood Fishing Rod | 2 | 3 | 1 | No source recorded on wiki or Toolbox (L: starter tool) |
| Copper Fish Rod | 4 | 8 | 2 | Anvil tab 1: 200 Copper Bar + **180 Goldfish** |
| Iron Fishing Rod | 9 | 13 | 4 | 300 Iron Bar + **650 Hermit Can** + 3 Distilled Water |
| Gold Fishing Rod | 15 | 19 | 6 (+4 LUK) | Iron Rod + **2,500 Hermit Can** + 1,000 Leather Hide |
| Plat Fishing Rod | 25 | 25 | 9 | Gold Rod + **2,000 Bloach** + 800 Platinum Bar |
| Dementia Rod for Fishing | 33 | 30 | 12 | Plat Rod + 300 Dementia Bar + 50 Redox Salts |
| Void Imperium Rod | 40 | 36 | 15 | Dementia Rod + 200 Spontaneity Salts + 3 Minervowl + 5 Dense Water |
| Lustre Rod | 45 | 43 | 20 | Void Rod + **90,000 Skelefish** + 750 Dioxide Synthesis |
| Starfire Rod | 50 | 50 | 25 | Lustre Rod + **40,000 Manta Ray** + 5 Pearler Shell |
| *W5+:* Dreadlo 60 (250K Kraken), Marbiglass 75 (+5%, 2M Icefish), Angler of the Iliunne 90 (+12%), Prehistoric 100 (+25%) | | | | |

**Goals and Milestones**

| Milestone | Threshold | Reward | Source |
|---|---|---|---|
| Portals | Fishing 15 / 30 | Faraway Piers / Deepwater Docks | wiki; `mapDetails` (H) |
| Depth unlocks | Eff 50/200/400 (small), 10K/50K/200K (medium), 1M/5M/30M (large) | Next fish species | `La.FishPools` (H) |
| Skill Mastery (W4) | Total Fishing Lv 150 / 200 / 300 / … | +25% Fishing EXP / **+10% Fishing eff** / **all fish cards passive** / … (same ladder as Choppin) | [wiki Fishing#Skill Mastery](https://idleon.wiki/wiki/Fishing#Skill_Mastery) (H) |
| Platinum Set | 4 Platinum armour pieces + 1 tool + weapon, or unlock at the W3 Armor Smithy | **+60% Fishing and Catching efficiency** | `La.EquipmentSets`@14935103; [armorSmithy.ts](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-3/armorSmithy.ts#L13-L64) (H) |
| Fishermaster bribe (W1 Bandit Bob) | Buy it | +25% Fishing EXP, +15% Fishing eff | [shared-data.json `bribes` L2170](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L2170) (H) |
| Minigame highscore | Score points | Bobbin' Bobbers adds +1 Fishing Power per point, up to its cap; the Whattso quests reward toolkit pieces | [efficiency.ts L439-L440](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L439-L440) (H) |
| Cards | Hermit Can +5%, Skelefish +8% eff per tier; Sand Shark card for speed; Bloach / Kraken cards for AFK; Jellyfish / Manta cards for EXP | | [cards.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/cards.json#L342-L1102) (H) |
| Poppy's Fish Pond (W2, The Oasis) | Poppy bonus levels | +3%/level Fishing efficiency | [wiki Poppy](https://idleon.wiki/wiki/Poppy_the_Kangaroo_Mouse%27s_Fish_Pond); `getKangarooBonus(..., 'Fishing Eff')` in efficiency.ts L481 (H) |

- **Feeds / fed by** (same sources as the Choppin consumer table; all H):

  | Fish | Stamps | Alchemy | Smithing / anvil | Refinery / Lab / PO / quests |
  |---|---|---|---|---|
  | Goldfish | Scimitar; **Catch Net (+2 base *Catching* eff/lvl)**; Gold Ball (Arcade) | Lil Big Damage, Droppin Loads (drop rate) bubbles; Seawater vial | **Copper Fish Rod (180)**, Fishing Overalls (+12% fish eff), Gold Platelegs, Angler Boots (1,250), Deep Sea Galoshes (300K; +35%), fish pouches | **Spontaneity Salts (30/cycle)**; PO Simple Shippin 120; Lab Grounded Software 20K; Scubidew, Whattso quests |
  | Hermit Can | **Bugsack (Catching carry cap)** | **Sploosh Sploosh (multi-fish)** bubble; **Slug Slurp vial (+Post Office box points)** | **Iron Rod (650)**, **Gold Rod (2,500)**, Angler Boots (1,000), Slurpin Herm (speed food), Empty Box | PO 100; Scubidew quest |
  | Jellyfish | Blover (LUK) | **Undeveloped Costs** bubble (cheaper bubbles) | **Platinum Helmet (2,250)**, Platinum Boots (3,000) for the Platinum Set | PO 70 |
  | Bloach | **Droplots (Alchemy liquid cap)** | Shaquracy bubble | **Plat Rod (2,000)**, **Anvil Tab 3 (2,000)**, Pharaoh Bow, Yumyum Skills Token (4,000) | **Purple Salt (5/cycle)**; PO 40 |
  | Skelefish | **Skelefish (% fish eff per Fishing Lv)**; Cooked Meal (Cooking speed) | Penny of Strength bubble | **Lustre Rod (90K)**, Lustre Veil, Shardsure Leif | Lab Galvanic Motherboard 250K (+skill eff); PO Cosmic Carrier 250 |
  | Sand Shark | **Ladle (Cooking eff)** | **Long Island Tea vial (meal cooking speed)** | Peeper Pouch | Omar quest 40K |
  | Manta Ray | none | Hyperswift bubble (attack speed) | **Starfire Rod (40K)**, Diabolical Toe Tips | none |
  | Kraken | Golden Sixes (drop rate) | Krakenade vial (weapon power) | Dreadlo Rod (250K), Diabolical Flesh Ripper | Lab Omega Motherboard 10M; Omar 250K |
  | Icefish / Shellfish / Jumbo / Caulifish | Crop Evo (W6 Farming); Triad Essence (Caulifish, W6 Summoning) | Flavorgil vial (Caulifish, Farming) | Marbiglass / Angler / Prehistoric rods, Crown of the Gods | Propagated Salt (Caulifish); Omar 1,000 Shellfish |

  **Not consumed by** (H): Forge, Anvil production, Construction (only through Spontaneity / Purple / Propagated salts), Shrines, Cooking. Cooking is *boosted* by Skelefish / Sand Shark stamps and the Long Island Tea vial, but meals do not eat fish.

  **Fed by:**
  - Barbarian talents.
  - Stamps: Fishing Rod (+2 base fish eff/lvl, costs **Flies** from Catching), Fishhead (EXP), Bag o Heads (carry, costs **Butterflies**), Holy Mackerel (multi-fish), Skelefish.
  - Oceanman statue (Crystal Crabal, Random Events).
  - Stronk Tools bubble; Dream of Ironfish bubble (Mining + Fishing AFK); Slabi Orefish (W5); Etruscan Lager vial (W3 Mamooth Tusk, +1%/lvl).
  - Sealed Fishheads box; Pie Seas star sign; Golden Ribs (Alien/Cubed tree drop, +40% fish eff); Fishermaster bribe; Platinum Set.
  - Obols (Tremendous Trout 2%, Monument Marlins 8%); gear Paper Boat 5%, Studded Hide 20%, Fishing Overalls 12%, Angler Boots 20%, Deep Sea Galoshes 35%; Skullfish Pendant (+5% fish AFK).
  - Poppy.
- **Per-session actions:**
  1. Play the fishing minigame. It raises the Bobbin' Bobbers power cap, which is the minimum of the highscore and the talent cap.
  2. **Set each fisher's bait and line for the depth you want** (see Min-max), and re-set it when you change pools.
  3. Check that the efficiency reaches the next depth threshold (from `getSkillEfficiency('fishing')`).
  4. Do the Whattso / Scubidew / Fishpaste97 / Omar quests for toolkit pieces and EXP.
  5. On Barbarian AFK, nothing to cast. Catching Some Zzz's is passive.

  **Idle or capped states:**
  - Toolkit still Fly + Fishing Twine (default weights favour depth 1-2).
  - Fishing 30+ but still in a small pool.
  - Carry capacity full (fish pouches, Bag o Heads stamp).
- **AFK Setup implications:** Fishing wants a **Barbarian** (later Blood Berserker): that tab has Worming Undercover, Bobbin' Bobbers, All Fish Diet and Catching Some Zzz's ([`talents.json` L1385-L1443](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L1385-L1443)).
  - Toolbox applies **Idle Skilling** (Rage Basics) plus **Catching Some Zzz's** to the FISHING AFK rate ([character.ts L3477-L3509](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3477-L3509)).
  - It applies **Brute Efficiency** (Rage Basics) as a Fishing efficiency multiplier, but not Smart or Elusive Efficiency (efficiency.ts L469).
  - So any Warrior-line character (Squire / Divine Knight too) gets the Rage-tab half of the Fishing bonuses. Only the Barbarian line gets the Fishing tab itself. (M on the talent-to-skill mapping, which is Toolbox's port of the game formula)
- **Min-max by stage:**

  | Stage / Fishing Lv | Pool and toolkit | Why (Purpose) |
  |---|---|---|
  | W2 early, Lv 1-15 | Salty Shores small pool; Fly + Fishing Twine → Iron Hook / Basic Bobber | 180 Goldfish → Copper Rod; Goldfish feeds Catch Net stamp, Droppin Loads, Spontaneity Salts; Hermit Can → Iron / Gold rods, Bugsack stamp, **Slug Slurp vial** |
  | W2, Lv 15-30 | Faraway Piers; buy Copper Twine, Pound of Steel (D4 30) or Wormie (D2 15) by target | Efficiency 200/400 opens Jellyfish / Bloach: Platinum Helmet + Boots (Platinum Set), Plat Rod (2,000 Bloach), Anvil Tab 3, Droplots stamp |
  | W2 late / W3, Lv 30-45 | Deepwater Docks medium pool; toward D2-D4 baits as efficiency reaches 10K/50K/200K | Skelefish → Skelefish stamp (scales with level), Lustre Rod (90K), Cooking stamps; Sand Shark → Ladle stamp, Long Island Tea vial (W4 Cooking prep) |
  | W4, Lv 45-60 | Medium D3-D4 (Manta / Kraken), Island Expeditions large pool | Manta → Starfire Rod; Kraken → Golden Sixes stamp, Krakenade, Omar quests; **Skill Mastery: total Fishing Lv 200 / 300**; Galvanic Motherboard chip (250K Skelefish) |
  | W5+ outline | Large pool deep fish; Equinox pool; Trench (Hole) | Marbiglass rods; W6 Farming / Summoning stamps; Death Bringer Famine o' Fish (Wraith crit per POW 10 Fishing eff) |

  **Per class:**
  - **Barbarian / Blood Berserker:** the fisher. BB and Divine Knight add **Skill Strengthen** (STR impact +60%, [L1803](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L1803)). The 2024 guide says the "Class specializes in fishing… points spend depends on your fishing minigame score" ([talents guide](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml), Stale 2024).
  - **Death Bringer (W6+ master class):** reads Fishing efficiency for damage (Famine o' Fish, [L2237](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L2237)). This is a W6+ reason to keep a warrior's fishing efficiency high.
  - **Maestro:** Right Hand / Left Hand, as in Choppin.
- **Common mistakes:**
  1. **Toolkit never changed.** Both fixture accounts (W2, W3) had every character on the default Fly + Fishing Twine. Read `characters[].fishingKit.bait.name == 'Fly'` and `line.name == 'Fishing_Twine'`. On a W3 account this means the Piers vendor pieces were never bought. (H, from the saves)
  2. **Fishing 30+ still at Salty Shores.** `skillsInfo.fishing.level >= 30` while `mapIndex` is 54 or 55.
  3. **Minigame highscore low.** A W3 account had a fishing highscore of 12, which caps Bobbin' Bobbers power at +12.
  4. **A non-STR character fishing.**
  5. **Getting stuck on "Can you do the Can Can?" (Fishpaste97, Pound of Feathers reward).** The quest needs specific consecutive catches. High-efficiency accounts report solving it by spam-starting the left Salty Shores hole with yellow-weighted bait ([reddit 2026-09-20](https://reddit.com/r/idleon/comments/1wl96li/did_i_mess_up_by_not_completing_the_can_you_do/), L).
- **Save and Toolbox fields:**
  - `characters[].skillsInfo.fishing`, `characters[].fishingKit.{bait,line}` with depth1-4 / exp / speed / pow, `characters[].tools[2]` (rod, M), `characters[].stats.strength`, `characters[].afkType=='FISHING'`, `characters[].mapIndex` (54 / 55 / 61 / 72).
  - `account.highscores.minigameHighscores[name=='fishing']`, `account.totalSkillsLevels.fishing`, `account.bribes` (Fishermaster), `account.statues[8]`, `account.kangaroo`, `account.armorSmithy.sets` (Platinum).
  - Toolbox numbers: `getSkillEfficiency('fishing', …)` and `getAfkGain` (FISHING). (H)
- **Sources:** see the end of file. Key: N.js `La.FishPools`@14933983, `ja.FishToolkitInfo`@14039605, [`efficiency.ts` L423-L487](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L423-L487), [wiki Fishing](https://idleon.wiki/wiki/Fishing) (rev 2026-10-03).

---

## Catching

- **What it is:** a W2 gathering skill. A character swings a net at a bug nest and gets bugs, Catching EXP and drops. Main stat AGI; tool slot Bug Catching Net ([wiki Catching](https://idleon.wiki/wiki/Catching)). (H)
  - **Critters are not Catching output.** Critters (Froge, Crabbo, Scorpie, Mousey, Owlio…) come from **Trapping** (W3, Hunter), which has its own dossier. Catching yields **bugs** only. (H: `Type: CRITTER` vs `BUG` in [items.json L1150-L1500](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/items.json#L1150-L1500))
- **Unlocks:** W2. The first nest is the Fly Nest at Jar Bridge (map 51). Butterflies are at Bandit Bob's Hideout (map 67, a catching-only map). **The Butterfly and Sentient Cereal nests must be attacked before they can be caught.** They reset every 24 h or when the character leaves the screen; AFK still gives full rewards ([wiki Catching](https://idleon.wiki/wiki/Catching); `MapAFKtargetSide`@13859852). There is a Flappy-Bird minigame; the Goldric quest "Hoopsies" (15 hoops in a row or 90 total) gives 10,000 Catching EXP + 2 Tool Upgrade Stone III. (H)
- **Scope:** both.
  - **Per character:** level, efficiency, net, AFK target, talents and boxes.
  - **Account-wide:** bugs in the chest, the Ol' Reliable statue, stamps, bubbles, the vial, cards and Skill Mastery. The Bowman's Teleki'net'ic Logs reads **Oak Logs in the storage chest** ([efficiency.ts L508-L524](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L508-L524)). (H)
- **Inputs → outputs:**
  - Inputs are time at a nest and a net.
  - Outputs are bugs (multi-bug possible; the "BUG]" bubble lifts the cap to 300%), Catching EXP, bug cards, and drops (Tool Upgrade Stones, Agile and Bag o Heads stamps from Flies, the Butterfly Pendant from Butterflies, "Its a Girl Celebration" line from W4+ bugs, Golden Ribs) ([entity-graph `monster:Bug1/Bug7/Bug8`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/entity-graph.json)).
  - **Efficiency formula:** **(power^1.3 + AGI^0.6 × (1+Skill Ambidexterity) + stamps + base) × multipliers**. AGI is pre-multiplied by Briar Patch Runner. The multipliers are: level, AGI, power (+up to 5 from achievement 74), Teleki'net'ic Logs (× log10 of Oak Logs), Elusive Efficiency, all-skill efficiency, then cards + vial + Monument + Skill Mastery + vote + Platinum Set + gear + obols + achievement 351, then Post Office + Right Hand + star sign ([`efficiency.ts` L489-L548](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L489-L548)). (H)

**Nests, W1-W4 in depth.** Efficiency columns from [wiki Catching#Bugs](https://idleon.wiki/wiki/Catching#Bugs); EXP from [monsters.json L15503-L15920](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/monsters.json#L15503-L15920).

| Nest → bug | Map (world) | First | 100% | x2 | x3 | x4 | Base EXP |
|---|---|---|---|---|---|---|---|
| Fly Nest → Fly | Jar Bridge (W2) | 3 | 100 | 1.6K | 8.1K | 25.6K | 2 |
| Butterfly Bar → Butterfly (attack nest first) | Bandit Bob's Hideout (W2) | 20 | 800 | 12.8K | 64.8K | 205K | 6 |
| Sentient Bowl → Sentient Cereal (attack nest first) | Pincer Plateau (W2) | 100 | 4K | 64K | 324K | 1.03M | 10 |
| Grocery Bag → Fruitfly | Up Up Down Down (W2) | 500 | 20K | 320K | 1.62M | 5.12M | 20 |
| Snowden → Mosquisnow | Mamooooth Mountain (W3) | 1.88K | 75K | 1.2M | 6.08M | 19.2M | 40 |
| Icicle Nest → Flycicle | Overpass of Sound (W3) | 3.75K | 150K | 2.4M | 12.2M | 38.4M | 75 |
| Bee Hive → Worker Bee | Jelly Cube Bridge (W4) | 7.5K | 300K | 4.8M | 24.3M | 76.8M | 150 |
| Fairy Hovel → Fairy | Shelled Shores (W4) | 25K | 1M | 16M | 81M | 256M | 300 |
| *W3 Equinox:* Equinox Nest → Dream Particulate | Equinox Valley | 1.5M | 60M | | | | 3.5K |
| *W5+:* Scarab (Great Molehill), Dust Mote (Mount Doomish), Ladybug / Firefly (W6), Litterbug (W7), Fractal Fly (The Hole) | | 75K to 500M | | | | | 550 to 110K |

**Nets** ([items.json L30382-L30707](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/items.json#L30382-L30707); [crafts.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/crafts.json#L2397-L28430)). "Lv" is the Catching level needed to equip.

| Net | Lv | Power | AGI | Source and cost |
|---|---|---|---|---|
| Bug Net | 2 | 4 | 2 | No source recorded (L: starter tool) |
| Copper Netted Net | 4 | 9 | 3 | Anvil tab 1: **500 Jungle Logs + 400 Fly** |
| Reinforced Net | 10 | 14 | 4 | **800 Forest Fibres + 850 Butterfly** + 3 Distilled Water |
| Golden Net | 15 | 20 | 6 | Reinforced Net + 5 Golden Dubloon + **2,500 Butterfly** |
| Platinet | 20 | 26 | 7 | Golden Net + **7,000 Fruitfly** + 3,000 Platinum Ore |
| Dementia Net | 25 | 31 | 9 | Platinet + **15,000 Mosquisnow** + 50 Redox Salts (also Royal Worm quest) |
| Void Imperium Net | 30 | 37 | 12 | Dementia Net + **50,000 Flycicle** + 5 Dense Water |
| Lustre Netting | 40 | 45 | 15 | Void Net + **130,000 Worker Bee** + 750 Dioxide Synthesis |
| Starfire Trim Netting | 50 | 55 | 20 | Lustre + **100,000 Fairy** + 5 Pearler Shell |
| *W5+:* Dreadlo Matted 65 (250K Scarab), Marbiglass 80 (+5%), Wrangler of the Qoxzul 95 (+12%), Prehistoric 105 (+25%) | | | | |

Nets 1-3 need **Choppin** logs (Jungle, Forest Fibres). A catcher depends on a chopper in W1-W2. (H)

**Goals and Milestones**

| Milestone | Threshold | Reward | Source |
|---|---|---|---|
| Skill Mastery (W4) | Total Catching Lv 150 / 200 / 300 / … | +25% Catching EXP / **+10% Catching eff** / **all Catching cards passive** / … | [wiki Catching#Skill Mastery](https://idleon.wiki/wiki/Catching#Skill_Mastery) (H) |
| Platinum Set | As in Fishing | +60% Fishing and Catching eff | `La.EquipmentSets`@14935103 (H) |
| Cards | Butterfly +5%, Mosquisnow +7%, Worker Bee +8% eff per tier; Fairy for speed; Fruitfly / Flycicle for AFK; Sentient Cereal for EXP | | [cards.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/cards.json#L342-L1102) (H) |
| Achievements | 2,500 Fly / 50,000 Sentient Cereal in chest ("Super Cereal"); #74 gives +5 Catching power, #351 gives +10% eff | | N.js chest checks @5143104; efficiency.ts L521, L537 (H) |
| Lifetime bugs | Powers of 10 caught | Upgrade Vault "Bug Power En Masse": +% Total Damage per POW 10 | [shared-data.json L49959](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L49959) (H) |

- **Feeds / fed by** (same sources; all H):

  | Bug | Stamps | Alchemy | Smithing / anvil | Refinery / Lab / PO / quests |
  |---|---|---|---|---|
  | Fly | **Fishing Rod (+2 base *Fishing* eff/lvl)** | **Wyoming Blood (multi-ore, Mining)** bubble; Fly in my Drink vial (accuracy) | **Copper Netted Net (400)**, Bandito Pantaloon (+12% catch eff), Gold Helmet (2,000), Bandito Boots, Spaggy Westerados (300K; +35%), Bullet | **Spontaneity Salts (40/cycle)**; PO Simple Shippin 120; Lab Potato Chip 20K |
  | Butterfly | **Bag o Heads (Fishing carry)** | Stamp Tramp bubble | **Reinforced Net (850)**, **Golden Net (2,500)**, Butterfly Pendant (+10% catch eff), Bandito Boots, Buttered Toasted Butter (speed food) | PO 100; Fishpaste97 quest 1,500 |
  | Sentient Cereal | Bullseye | **Le Brain Tools (Choppin tool power)**, "BUG]" (multi-bug) bubbles | **Platinum Shins (5,000) for the Platinum Set** | **Purple Salt (5/cycle)**; PO 90 |
  | Fruitfly | Steve Sword (damage) | FMJ bubble (defence) | **Platinet (7,000)**, **Anvil Tab 3 (2,000)**, Crows Nest, Starstrut Ring, Yumyum Skills Token (8,000) | PO 65; Omar 250K |
  | Mosquisnow | **Amplestample (3D Printer sample size)** | **Gospel Leader (Worship)**, Cheap Shot bubbles; **Ew Gross Gross vial (+1%/lvl Catching eff)** | **Dementia Net (15K)**, bug pouch | Lab Conductive Processor 100K (+skilling AFK); Shuvelle quest 200 |
  | Flycicle | none | **Fast Boi Talent bubble (+talent points for Archers)** | **Void Net (50K)**, Void Imperium Kicks | **Nullo Salt (5/cycle)** |
  | Worker Bee | **DNA (W4 Breeding splicing)** | **Fly in Mind bubble (Catching AFK)** | **Lustre Netting (130K)**, Peeper Pouch | PO Cosmic Carrier 300; Omar 75K |
  | Fairy | none | AFK Expexp bubble (double AFK EXP) | **Starfire Netting (100K)**, **Anvil Tab 5 (150K)**, Diabolical leg guards | PO Cosmic Carrier 300; Lab Silkrode Software 2M, Omega Nanochip 10M |

  **Not consumed by** (H): Forge, Anvil production, Construction (only through Spontaneity / Purple / Nullo salts), Shrines, Cooking. Breeding is *boosted* by the DNA stamp (Worker Bee); Worship by Gospel Leader (Mosquisnow).

  **Fed by:**
  - Bowman talents.
  - Stamps: Catch Net (+2 base/lvl, costs **Goldfish** from Fishing), Fly Intel (EXP), Bugsack (carry, costs **Hermit Can**), Buzz Buzz (multi-bug, costs **Potty Rolls** from Choppin).
  - Ol' Reliable statue (Crystal Crabal, Random Events).
  - Sanic Tools bubble (costs Jungle1 drops); Fly in Mind (AFK); Slabo Critterbug (W5); Ew Gross Gross vial.
  - Bug Hunting Supplies box; Shoe Fly star sign; Platinum Set.
  - Gear: Sleek Coif 10%, Feral Leathering 20%, Bandito Pantaloon 12%, Bandito Boots 20%, Spaggy Westerados 35%, Butterfly Pendant 10%. Obols: Ample Anthropods 2%, Colossal Crawlies 8%.
  - **Oak Logs in storage** (Teleki'net'ic Logs).
- **Per-session actions:**
  1. Re-hit the Butterfly / Cereal nest if the catcher moved.
  2. Play the catching minigame once for the Hoopsies quest.
  3. Check the catcher's target against the 100% column.
  4. Craft the next net.
  5. Keep Oak Logs stockpiling: Teleki'net'ic Logs multiplies by its talent % × log10(Oak Logs), so each power of 10 adds a step.

  **Capped or idle states:** carry capacity full (bug pouches, Bugsack stamp); target below "First" (zero gains); an un-hit Butterfly or Cereal nest while active.
- **AFK Setup implications:** Catching wants a **Bowman** (→ Siege Breaker; Wind Walker master class). The Bowman tab carries Teleki'net'ic Logs, Briar Patch Runner, Bug Enthusiast and Sunset on the Hives ([`talents.json` L3101-L3160](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L3101-L3160)).
  - **The Hunter has no Catching talent.** Its gathering talent is Invasive Species (Trapping). Guides that say "Hunter for bugs" are wrong. (H)
  - Toolbox applies Elusive Efficiency (Calm Basics) to Catching, and only Sunset on the Hives plus generic sources to the CATCHING AFK rate. No Basics-tab AFK talent applies, unlike Idle Skilling for Fishing or Active AFK'er for Choppin ([character.ts L3514-L3540](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3514-L3540)). (M)
- **Min-max by stage:**

  | Stage / Catching Lv | AFK target | Why (Purpose) |
  |---|---|---|
  | W2 early, Lv 1-10 | Fly (Jar Bridge) | 400 Fly + 500 Jungle → Copper Netted Net; **Fishing Rod stamp** (Fly) for your fisher; Wyoming Blood for your miner; Spontaneity Salts later |
  | W2, Lv 10-20 | Butterfly (Bandit Bob's) → Sentient Cereal (Pincer Plateau) at eff ≥ 800 / 4K | Reinforced and Golden nets; **Bag o Heads** for the fisher; **Le Brain Tools for the chopper**; Platinum Shins (Platinum Set) |
  | W2 late, Lv 20-25 | Fruitfly (Up Up Down Down, eff 20K) | 7,000 → Platinet; Anvil Tab 3 (with Bloach); Omar quests later |
  | W3, Lv 25-40 | Mosquisnow → Flycicle | Dementia / Void nets; Ew Gross Gross vial; Amplestample (3D Printer); Gospel Leader (Worship); **Fast Boi Talent** for archers; Nullo Salt |
  | W4, Lv 40-50+ | Worker Bee → Fairy | Lustre / Starfire nettings; DNA stamp (Breeding); Fly in Mind; Anvil Tab 5; Lab chips (Fairy 2M/10M); **Skill Mastery 200 / 300 total** |
  | W5+ outline | Scarab → Dust Mote; Equinox Dream Particulate | Dreadlo / Marbiglass nets; Slabe Logsoul (Scarab); Multitool stamp (Dust Mote, +10 all skill eff/lvl) |

  **Per class:**
  - **Bowman / Siege Breaker:** the catcher. Siege Breaker and Beast Master add **Skill Ambidexterity** (AGI impact +60%, [L3519](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L3519)). The 2024 guide says "He will have highest catching efficiency" (Stale 2024).
  - **Beast Master** gets Ambidexterity but no Catching tab.
  - **Maestro:** Right Hand, as in Choppin.
- **Common mistakes:**
  1. **Bowman AFKing combat for good.** A W3 account had its Bowman at Catching 26 but `afkType=='FIGHTING'`, and no character on CATCHING. Check `characters[].class=='Bowman'` and `afkType`.
  2. **Thinking critters come from Catching.**
  3. **No Oak Logs stockpile** (`account.storage.list` OakTree < 1,000) while the Bowman has Teleki'net'ic Logs points.
  4. **Catching minigame never played.** A W3 account had a catching highscore of 0, so the Hoopsies quest was not done.
  5. **Cross-skill stamps left at low level.** Catch Net (Goldfish), Fishing Rod (Fly), Bugsack (Hermit), Bag o Heads (Butterfly) are cheap early efficiency for each other's skill. Check `account.stamps.skills` levels.
- **Save and Toolbox fields:**
  - `characters[].skillsInfo.catching`, `characters[].tools[3]` (net, H: slot 3 seen holding `CatchingNet2` on a save), `characters[].stats.agility`, `characters[].afkType=='CATCHING'`, `characters[].mapIndex` (51 / 59 / 63 / 67 / 106 / 112 / 157 / 160).
  - `account.storage.list` (OakTree for Teleki'net'ic), `account.highscores.minigameHighscores[name=='catching']`, `account.totalSkillsLevels.catching`, `account.statues[9]`.
  - Toolbox numbers: `getSkillEfficiency('catching', …)` and `getAfkGain` (CATCHING). (H)
- **Sources:** see below. Key: [wiki Catching](https://idleon.wiki/wiki/Catching) (rev 2026-10-03), [`efficiency.ts` L489-L548](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L489-L548), [`talents.json` Bowman L2950-L3160](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L2950-L3160).

---

## Sources

Tier 1, game data and code (Toolbox @ 6827d3f2, 2026-10-17, covers v1.23):
- [`data/website-data/monsters.json` L14025-L15920](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/monsters.json#L14025-L15920): trees, fish pools and bugs, with `AFKtype`, `Defence`, `ExpGiven`.
- [`data/website-data/items.json` L612-L1500](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/items.json#L612-L1500) (logs, leaves, fish, bugs, critters, toolkit accessories) and [L29682-L30707](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/items.json#L29682-L30707) (hatchets, rods, nets).
- [`data/website-data/crafts.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/crafts.json#L177-L28430): tool recipes.
- [`data/website-data/talents.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json):
  - Mage [L4252-L4472](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L4252-L4472) and Savvy Basics [L4191-L4250](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L4191-L4250).
  - Barbarian [L1224-L1443](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L1224-L1443) and Rage Basics [L941-L1000](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L941-L1000).
  - Bowman [L2950-L3160](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L2950-L3160) and Calm Basics [L2677](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L2677).
  - Hunter [L3162](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L3162) (no Catching talent).
  - Skill Wiz [L5063](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L5063), Skill Strengthen [L1803](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L1803), Skill Ambidexterity [L3519](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L3519), Right Hand of Action [L593](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L593), Famine o' Fish [L2237](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json#L2237).
- [`data/website-data/stamps.json` L1037-L2139](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/stamps.json#L1037-L2139), [`cauldrons.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/cauldrons.json) (Le Brain Tools L2289, Stronk Tools L215, Sanic Tools L1237, Tree Sleeper L2619, Fly in Mind L1567, Dream of Ironfish L515), [`vials.json` L29-L757](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/vials.json#L29-L757), [`cards.json` L342-L1102](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/cards.json#L342-L1102).
- [`data/website-data/shared-data.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json): `fishingKits` L9224, `postOffice` boxes L33746 / L33810 / L33874, `refinery` L35479-L35640, `chips` L3562-L3900, `cardSets` L3482, `starSigns` L41329-L41363, `statues` L44041, `towers` L48623, `upgradeVault` L49887-L49959, `bribes` L2170, `mapDetails` L18750, `shops` L1956.
- [`data/entity-graph.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/entity-graph.json) (consumer edges `craftedFrom` / `upgradedWith` / `requires` / `refinedFrom` / `drops`) and [`data/bot-wiki-index.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/bot-wiki-index.json) (item sources).
- [`parsers/efficiency.ts` L356-L548, L640-L671](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/efficiency.ts#L356-L548): skill efficiency.
- [`parsers/character.ts` L301-L305, L3229-L3540](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3229-L3540): fishing kit and AFK gains.
- [`parsers/world-2/alchemy.ts` L418-L445](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-2/alchemy.ts#L418-L445): bubble class multiplier.
- [`parsers/world-3/armorSmithy.ts` L13-L64](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-3/armorSmithy.ts#L13-L64): set bonuses.
- Game client [N.js](https://www.legendsofidleon.com/ytGl5oc/N.js) (2026-10-17): `ja.MapAFKtarget`@13858406, `ja.MapAFKtargetSide`@13859852, `La.FishPools`@14933983, `ja.FishToolkitInfo`@14039605, `ja.PostOfficePossibleOrders`@14040869, `na.TowerInfo`@14519175, `La.EquipmentSets`@14935103, `ja.AlchemyVialItems`@14091463, Equinox Valley node spawns `_customBlock_CreateMonster("Tree11"…)`@11302647, AFK drop mapping `"FishSmall"==…?"Fish1"`@5518211, chest achievements @5141499 / @5143104, `Luminous_Menagerie_v1.23` @14132571.

Tier 2, wiki (bot-data pages; revisions predate v1.23):
- [Choppin](https://idleon.wiki/wiki/Choppin) (rev 2026-10-03), [Fishing](https://idleon.wiki/wiki/Fishing) (rev 2026-10-03), [Catching](https://idleon.wiki/wiki/Catching) (rev 2026-10-03), [Post Office](https://idleon.wiki/wiki/Post_Office) (rev 2026-10-07; Simple Shippin and Cosmic Carrier order lists), [Statues](https://idleon.wiki/wiki/Statues), [Poppy the Kangaroo Mouse's Fish Pond](https://idleon.wiki/wiki/Poppy_the_Kangaroo_Mouse%27s_Fish_Pond), [Changelog 2025](https://idleon.wiki/wiki/Changelog_2025) (v2.28, 2025-02-08: node "ticking"; Starfire tools to 5 Pearler Shells).

Tier 3, community (Stale or opinion):
- Talents guide by Fibster/Tetsu, [pubhtml](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml), 2024-07-12, **Stale**: Mage, Barbarian and Bowman tabs. The shadowstorm2204 Complete Guide Sheet W1-W4 tabs have no Choppin, Fishing or Catching guidance.
- r/idleon:
  - [Bubonic Conjuror vs Elemental Sorcerer Choppin efficiency](https://reddit.com/r/idleon/comments/1kqci0p/bubo_has_almost_100t_more_choppin_efficiency_than/) (2025-05-19).
  - ["Can you do the Can Can" quest](https://reddit.com/r/idleon/comments/1wl96li/did_i_mess_up_by_not_completing_the_can_you_do/) (2026-09-20).
  - [Low-level choppin tree tip](https://reddit.com/r/idleon/comments/1ji9juj/if_any_of_your_dudes_arent_leveled_up_in_choppin/) (2025-03-23).

Save checks: two private fixture saves (one W2 account, one W3 account) were read for field names and aggregate patterns only.
