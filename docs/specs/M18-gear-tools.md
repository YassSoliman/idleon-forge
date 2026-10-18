# M18 Gear & Tools

Spec for System Atlas gap #4, "gear and tools behind the character's level" (owner request of 2026-10-18), part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **ready for owner review**. An independent reviewer red-teamed it: 36 findings (7 P1, 16 P2, 13 P3), every confirmed P1 and P2 fixed (section 10). The owner was away, so every open question is self-ruled with a researched recommendation (section 8, "Owner review"). Terms follow [`GLOSSARY.md`](../../GLOSSARY.md). Decisions follow [ADRs 0001–0009](../adr/).

**Why this exists.** On both private fixtures, almost every character wears gear far below its level. Characters at Lv 43–85 wear helmets, shirts and pants that need Lv 1–40. 6 of 11 characters have an empty armour or ring slot. One character fishes with no rod, and the W3-early account's Bowman Lv 60 has no helmet, shirt, pants or shoes while a Gold Helmet and a Copper Platebody sit in storage. Nothing in ActiveOn looks at gear today. The Design Lab drew a paper doll, a gear heat strip and tool ladders (`character.gear.*`), but its critique says the pictures "can't light the choice yet" because the engine has no rule. M18 is that rule. For each character it says which slot is the weak one, what goes there next, where that piece comes from and what it costs, and whether the account can make it now.

**Decisions this spec rests on:**
- [ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md) (deterministic advice), [0004](../adr/0004-source-precedence.md) (game data first), [0005](../adr/0005-toolbox-numbers-not-our-formulas.md) (Toolbox numbers plus arithmetic), [0006](../adr/0006-client-only-spa-parsing-in-a-worker.md) (Toolbox code only in the worker), [0007](../adr/0007-generated-facts-authored-judgment.md) (generated facts, authored judgment), [0009](../adr/0009-game-art.md) (our own art: the paper doll is data plus our pixel art, never sprites).
- [#74](https://github.com/YassSoliman/idleon-forge/issues/74): every entry links a player-readable tier 2–4 Source. Tier-1 game data stays as provenance.
- [#70](https://github.com/YassSoliman/idleon-forge/issues/70) A5: a Goal that would repeat across characters becomes one account line with per-character details.
- **M15's owner principles P1–P7**, adopted unchanged: one Next Action per Goal; never a target above the next Stage; every line says who, where and how long; breakdowns go behind "why" and "show details"; one global ranking (`compareGoals`); no tier jargon; every warning carries its fix.
- **M14's Requirement Tree, Demand and Supply** expand every piece M18 names (TR-6). M18 picks the piece. M14 says how to get it.
- **M17's homes**: the Gear tab registers in `characterTabs`, and the Gear System page body plugs into `SYSTEM_HOMES` (TR-7).
- **Design Lab v2 critique**: one highlight per picture; a step of about 12 words with one verb; units on every number ("45 levels behind"); lists behind a picture capped at three rows; unknown who or time tokens are hidden, not printed.

**Patch.** Game v1.23 (Toolbox gameVer 2.3.540), parser pin `6c37e3d` (`packages/toolbox-parsers/UPSTREAM`). Wiki pages were opened on 2026-10-18 (section 11.3 lists each claim and the page that confirms it). No 2026 patch note changes W1–W3 armour, tools or upgrade stones (wiki [Changelog/2026](https://idleon.wiki/wiki/Changelog/2026), checked to v1.22; v1.23 has no wiki entry yet).

**Fixtures.** Acceptance criteria use the two private fixtures, by account, class and level only. The **W2-late account** has 5 characters (Barbarian 60, Squire 43, Shaman 44, Bowman 54, Wizard 56; `currentWorld` 2). The **W3-early account** has 6 characters (Wizard 73, Squire 51, Bowman 60, Squire 85, Barbarian 56, Shaman 54; `currentWorld` 3). Values were read on 2026-10-18 by local scripts, at the golden clock (`now` = the save's `GlobalTime`, Expected Return 8 h). CI runs the same assertions on `fixtures/scrubbed/scrubbed-w2.json` and `scrubbed-w3.json`, and the golden snapshots pin the exact text.

## 1. Purpose

Every character has 8 equipment slots (helmet, weapon, shirt, pendant, pants, two rings, shoes) and tool slots for its gathering skills. A W1–W3 player rarely looks at them after the first hour. The game never says that a character 40 levels past its armour could wear something much better, that the better piece is already in storage, or that the recipe it needs is one Task Board unlock away. M18 answers one question per character: **"Which slot is weak, and what goes there next?"** First it hands out the free wins: gear the account already holds goes onto the characters who can use it. Then it fills empty slots with the cheapest piece the account can make now. Then it names the next piece on the **Gear Plan**, an opinionated, Source-backed list of what each slot should hold at each Stage. That piece gets a Walkthrough: the recipe, the anvil tab, the unlock, and the materials held and still needed. M18 also tracks the W3 Armor-set Smithy, which makes set bonuses permanent. The Gear tab on each Character page shows it all as a paper doll with one lit slot, and the Gear System page shows the whole account as one heat strip. It reads only the save. It never touches the game.

## 2. Scope / Out of scope

### Ownership (who builds what)

M18 is a **new module** with its own folders (D-1). It reuses other modules' interfaces and asks small changes of their owners (section 7).

| # | Feature | Folder that builds it | Entries and Detectors | Ships |
|---|---|---|---|---|
| F1 | **Gear facts**: the Account State gear fields, the generated ladder, the authored recipe table and the Gear Plan | `packages/account-state/src/gear.ts`, `packages/knowledge/generators/gear.gen.ts`, `packages/knowledge/systems/gear*.yaml` | `gear.fact.ladder` (generated), `gear.fact.recipes` (authored tier 2), `gear.priority.plan` (authored Priority List, `list: order`) | Phase 1 |
| F2 | **Slot states and the free wins**: every slot's state, held gear handed out, empty slots filled | `packages/engine/src/gear/` | `gear.check.equip-held`, `gear.check.empty-slot`, `gear.check.afk-tool`; engine Detector `gear/slots` | Phase 1 |
| F3 | **The upgrade path**: the next Gear Plan piece per character, with its Walkthrough | `packages/engine/src/gear/` | `gear.goal.next-piece`; Walkthrough roots for M14 (TR-6) | Phase 1 |
| F4 | **Armor-set Smithy**: unlock, hire, register sets, keep the pieces a set still needs | `packages/engine/src/gear/smithy.ts` | `armor-smithy.check.hire`, `armor-smithy.check.register` | Phase 1 |
| F5 | **Views**: the Gear tab (paper doll, tool ladders) and the Gear System page (heat strip, Smithy set cards) | `apps/activeon/src/gear/` (lazy chunk) | none (views add no advice, M17 TR-9) | Phase 1 |
| F6 | Upgrade stones (which held stone on which kept piece), class Lv 40 skilling pieces for skilling presets, boss-set Walkthroughs beyond Amarok, the Dementia-or-Amarok W3 choice by measured kills | same folders | added entries | Phase 2 |

### In scope

- Equipment slots 0–7 (helmet, weapon, shirt, pendant, pants, ring, shoes, ring) and the four gathering tool slots (pickaxe, hatchet, fishing rod, bug net) of every character, W1–W3 content.
- Gear the account holds but nobody wears (storage and every inventory), handed to the character it helps.
- Empty slots, filled with the cheapest piece the account can make now.
- The next Gear Plan piece per character: where it is crafted (anvil tab), what unlocks its recipe (start of tab, a Task Board unlock, a Merit Shop purchase, a monster drop), the crafter's Smithing level, and the materials held and needed, through M14's Requirement Tree.
- The Armor-set Smithy: when it opens, hiring it, and registering the W1–W3 sets the account can complete.
- The Gear tab on the Character page and the Gear System page (`equipment`), plus the Armor Smithy System page (`armor-smithy`).

### Out of scope (and who owns it)

- **Worship skulls and trap sets** (tool slots 4 and 5): M20 owns `worship.check.no-skull` and `trapping.check.no-trap-set`. The paper doll shows both slots with M20's state and links M20's Goals. The skull and trap ladders past the Wax Skull and Cardboard Traps are M20 Phase 2.
- **The Purpose line "this AFK Target gathers toward the next tool"**: M4's `skills.contribution.tool-*` stays M4's. M18 owns equipping and crafting the tool, M4 owns the Purpose line (section 7, dedupe rule).
- **Premium and cosmetic slots** (8–15: premium helmet, keychains, trophy, cape, nametag) and the W4 DNA gun: gem-shop or W4 content. Not covered.
- **Damage, defence or kill-rate numbers for a gear swap.** Toolbox can't price one (V3, section 11.4). M18 compares item stats only.
- **Upgrade stones**: Phase 2 (D-10). Phase 1 shows each piece's free upgrade slots and never suggests stoning a piece the Gear Plan replaces.
- **Spending merits or Task Board unlock points in general**: M6 (`merit-shop.check.spend-w*`, `task-unlocks.check.spend`). M18 only names which recipe a gear Goal needs. M6's lines show that as their first detail (section 7).
- **Navigation, the generic System page, routes and "See it"**: M17. M18 supplies a tab, two page bodies and data (TR-7).
- **Worlds 4+**: Troll, Lustre and later sets, W4 shop stones. The Gear Plan stops at W3.

## 3. Functional requirements

### Facts settled for this spec (section 11.4)

- **F-a Slots.** Toolbox `characters[i].equipment[0..15]` and `tools[0..15]`. Equipment slot index → slot: 0 helmet, 1 weapon, 2 shirt, 3 pendant, 4 pants, 5 ring, 6 shoes, 7 ring (8–15 premium and cosmetic). Tool slot index → tool: 0 pickaxe, 1 hatchet, 2 fishing rod, 3 bug net, 4 trap set, 5 worship skull (6 W4 DNA gun). Each item carries its game data: `Type`, `Class` (`ALL`, `WARRIOR`, `ARCHER`, `MAGE`, `BEGINNER`), `lvReqToEquip`, `Defence`, `Weapon_Power`, `STR`, `AGI`, `WIS`, `LUK`, `UQ1txt`/`UQ1val`, `UQ2txt`/`UQ2val`, `Upgrade_Slots_Left`, plus Toolbox's `maxUpgradeSlots` (Toolbox `character.ts` L346–363, `items.ts` `createItemsWithUpgrades`). Verified on both fixtures (V1).
- **F-b Level gates.** Armour, weapons, pendants and rings need the **class level** (`lvReqToEquip`). Gathering tools need the **skill level** of their skill: 503 of the 507 tools equipped across the 11 public saves meet their skill level, and the 4 that don't sit on a Lv 1 Beginner in `fresh.json` that meets neither gate (V2). M4's tool generator makes the same reading.
- **F-c Recipe state.** The raw save key `AnvilCraftStatus` holds 7 tabs × N recipes, with -1 = recipe locked, 0 = recipe available and never crafted, 1 = crafted at least once. The wiki's `Smithing/Anvil_Tab_N` pages number every recipe within its tab. Matching both on the two fixtures agrees everywhere it can be checked: the W3-early account's Amarok Paws (tab 1 recipe 68) is 0 and the other three Amarok recipes are -1 with its W1 Merit Shop recipe row at level 1; Iron Boots (tab 1 #39, a chest-drop recipe) is 0 on W3-early and -1 on W2-late; every Task Unlock recipe agrees with Toolbox's `taskUnlocks.taskUnlocksList[w][i].unlocked` (V4). Toolbox does not parse this key, so the adapter reads it raw.
- **F-d Recipe source.** Armour base sets (Copper, Iron, Gold, Platinum, Dementia, Void) are "Start of the tab". Boss-set recipes (Amarok, Efaunt, Chizoar) are Merit Shop purchases 1–5 of that world's "Smithing recipes" row (`merit-shop.fact.rows` `w1-smithing-recipes1`, and so on). Weapons, gold-and-later tools, rods, nets, Steel Band and the Lv 40 class pieces are Task Board unlocks. A few are monster drops (Iron Boots: the W1 Silver Chest; Serrated Rex Ring: Baba Yaga). Copper Platelegs and Copper Boots unlock by crafting the piece before them ("Crafting Copper Platebody", wiki Anvil Tab 1). Each recipe also has a Smithing level (the wiki rows' "LV" column) and lives on an anvil tab the account must **own**. A tab is owned by crafting its expansion item (`EquipmentSmithingTabs2` …, raw `CYAnvilTabsOwned`, M14's `anvilTabsOwned`), and crafting that item needs Smithing 15 for tab 2, 35 for tab 3 and 50 for tab 4 (wiki Smithing). The W2-late account owns 1 tab, the W3-early account 2.
- **F-e Recipes consume the previous piece.** Gold armour consumes the Copper piece (Gold Boots consume Iron Boots), Platinum armour consumes the Iron piece, Void consumes Dementia, Chizoar consumes Void. Weapons and tools from the Gold tier up consume the previous tier. Copper → Iron tools and Dementia armour consume nothing (wiki Anvil_Tab_1–3, 2026-10-07; game data `crafts.json`).
- **F-f No damage numbers.** Toolbox's `getMaxDamage` reads a character's STR, AGI, WIS and LUK from the save's own `StatList` (Toolbox `character.ts` L310), which already includes the worn gear. A clone with another item keeps the old stats and changes only Weapon Power, Defence and the item's % lines. So no gear swap can be priced in damage or kills without a formula of our own (ADR 0005). M18 compares item stats, and says so (V3).
- **F-g The Smithy.** Toolbox `getArmorSmithy`: the Smithy can be hired once `ServerGemsReceived + 1,500 × (bundle bun_c bought) ≥ 2,000` or its 30-day wait has passed (`OLA[381]` counts days, and on both fixtures it equals the account's age, so the wait runs from account creation, not from reaching W3). M18 calls Toolbox's own `isSmithyUnlocked`. `OLA[380]` marks it hired and `OLA[379]` lists the registered sets. A set is registered by wearing all of it on one character and tapping a worn piece (wiki [Frostbite Tundra](https://idleon.wiki/wiki/Frostbite_Tundra), 2025-07-21; [Set Bonuses](https://idleon.wiki/wiki/Set_Bonuses), 2026-10-07). Set parts come from Toolbox `equipmentSets` and `getSetPartsReq`: Copper and Iron need 3 armour pieces and 1 tool of the set; Gold and Platinum need 4 pieces, 1 tool and 1 weapon; Amarok, Efaunt and Chizoar need 4 armour pieces; Dementia and Void need 4 pieces, 2 tools and 1 weapon. Neither fixture can hire it yet (day 4 and day 5 of 30).

### F2 Slot states and the free wins

- **FR-1 Slots read.** For every character M18 reads equipment slots 0–7 and tool slots 0–3 (F-a). Slots 4 and 5 (trap set, skull) are shown with M20's state (FR-24) and never judged by M18.
- **FR-2 Wearable.** An item is wearable by a character when its `Class` is `ALL` or the character's class family, read from M2's generated class tree (`classes.fact.class-tree`: every class, elite and secret ones included, maps to `WARRIOR`, `ARCHER`, `MAGE` or `BEGINNER`; a class the tree doesn't know makes its slots `unknown`), and its `lvReqToEquip` is at most the class level (armour, weapon, pendant, ring) or the tool's skill level (F-b).
- **FR-3 Better, without a formula.** An item is **better** than the one equipped in that slot when the slot is empty, or when the item **dominates** the equipped one: at least as much of the slot's primary stat (Defence for helmet, shirt, pants and shoes; Weapon Power for weapons and tools; for pendants and rings, at least as much Defence **and** at least as much Weapon Power, each on its own), at least as much of the character's main stat (STR for the Warrior line, AGI for the Archer line, WIS for the Mage line, LUK for Beginners), at least the same value of every % line the equipped item has (same `UQ` text), and strictly more of one of the two stats. A piece that trades one stat for another is never "better". This needs no weighting (F-f, D-5). Stats are the item's own, stones included (Toolbox adds each copy's stone data). Dominance is for pieces **off** the Gear Plan; between Gear Plan pieces the Plan's order decides (FR-12).
- **FR-4 Slot state.** Each judged slot gets one state:
  - `empty`: nothing equipped;
  - `ok`: the equipped item is the slot's Gear Plan target for this Stage, or nothing on the Gear Plan up to this Stage is better (FR-3);
  - `behind`: a Gear Plan piece the character can wear at this Stage is better (FR-11);
  - `held-upgrade`: something the account holds is better (FR-6), whatever the Gear Plan says. It wins over `empty` and `behind`: an empty slot with a better item held reads "empty · one held" and its Next Action is the hand-out;
  - `unknown`: the slot or a field it needs is unknown (M1 `isKnown`).

  `behind` slots carry **levels behind**: the target's `lvReqToEquip` minus the equipped item's (`45 levels behind`). The Gear tab shows the word and the number, never colour alone.
- **FR-5 Held gear.** M18 lists every unequipped item of a judged slot type that the account holds, in chest storage and every character's inventory (M14 `holdingsOf` places; equipped gear never counts, M8 TR-6), one entry per stack (copies with different stones are different entries), with its places.

**Equip what you hold** (`gear.check.equip-held`)

- **FR-6 Who gets held gear.** M18 hands held items out in two passes. Empty slots go first, then replacements (FR-3). Characters are taken in order: M2's pusher, then higher class level, then lower index. Slots are taken in order: weapon, helmet, shirt, pants, shoes, pendant, ring, ring, then the AFK Target's tool. For each slot, the best held item that is wearable and better (highest primary stat, then main stat, then rawName) goes there, and its count drops by one. Tools for skills the character doesn't AFK are only listed on the Gear tab ("free stats"), never in the Goal.
- **FR-7 One account Goal.** When any item is handed out, one account Goal: "Equip gear you already hold on 3 characters". Details, one per character: "Bowman Lv 60: Gold Helmet, Copper Platebody and Copper Platelegs from storage". Why: "Better gear for these characters is sitting unused. Nothing to craft or buy." Category `compounding`, confidence H, position 3 (free-value fills, M2 X1), effort 30 s per piece. Done on a later save when every named piece is equipped on its character or no longer held (M6 FR-29: anything else drops it silently).

**Empty slots** (`gear.check.empty-slot`)

- **FR-8 Fill an empty slot.** An armour or weapon slot that is still empty after FR-6 fires for its character. Its Next Action names, in this order:
  1. the slot's **Gear Plan target**, when its whole Walkthrough can be done now (every recipe on the way available, every anvil tab owned, every material held, FR-15): "Craft Amarok Paws for your Bowman Lv 60 (anvil tab 1): you hold everything";
  2. otherwise the **cheapest piece the account can make now** for that slot: the first Gear Plan piece for the slot, from the earliest Stage up, that is wearable, whose recipe is available (F-c = 0 or 1), whose anvil tab is owned, whose Smithing level some character has, and whose materials are all held after earlier lines took theirs: "Craft Copper Boots for your Bowman Lv 54 (anvil tab 1)";
  3. otherwise the target's first open step (FR-14): an unlock, a merit purchase or the scarcest material.
- **FR-9 Empty accessories are one account line.** Empty pendant and ring slots across the account are one Goal (#70 A5): "Fill 7 empty ring slots: craft Copper Bands (anvil tab 1, 100 Copper Bars each)", with a detail per character and "you hold enough for 3". The empty armour and weapon slots stay per character (each has its own piece).
- **FR-10 Position.** An empty slot that can be filled now is a free-value fill (position 3). One that needs farming or an unlock first ranks with `gear.goal.next-piece` (FR-17).

### F3 The upgrade path

- **FR-11 The Gear Plan.** `gear.priority.plan` is an authored ordering list (`list: order`, M11). Each row names a slot family (armour slot, weapon by class line, pendant, ring, gathering tool by skill), a first Stage, and the piece. The target for a slot is the **latest row whose Stage the account has reached and whose piece the character can wear** (FR-2). It is never a piece above the next Stage (P2). Phase 1 rows (Sources in TR-4 and section 11.3):

  | Slot | From Stage | Piece (Lv to equip) | Why (Source) |
  |---|---|---|---|
  | Helmet, shirt, pants, shoes | W1-early | Copper Helmet, Copper Platebody, Copper Platelegs, Copper Boots (8) | Anvil tab 1, start of the tab; the Copper set (wiki Anvil Tab 1, Set Bonuses) |
  | Helmet, shirt, pants, shoes | W1-mid | Iron Helmet, Iron Platebody, Iron Platelegs, Iron Boots (15) | Tab 1; Iron Boots' recipe drops from the W1 Silver Chest |
  | Helmet | W2-early | Gold Helmet (35) | "The best starting gear after completing World 1 would be a Golden Helmet with 3 pieces of Amarok Armor" (wiki Tips and Tricks) |
  | Shirt, pants, shoes | W2-early | Amarok Bodyplate (35), Amarok Hinds (40), Amarok Paws (35) | Same; recipes from the W1 Merit Shop; Amarok worn into W5–W6 by many players (Reddit, 2026-06-26) |
  | Helmet, shirt, pants, shoes | W3-mid | Dementia Helmet, Body, Shins (70), Dementia Boots (65) | "While pushing World 3 or World 4 … move into Dementia Armor" (wiki Tips and Tricks); confidence L, D-3 |
  | Weapon (Warrior / Archer / Mage) | W1-early | Steel Axe (11) / Birch Longbow (12) / Quarterstaff (12) | "Use the best weapon that is craftable at all times" (wiki Tips and Tricks); W1 Task Board unlocks |
  | Weapon | W2-early | Royal Bayonet / Spiked Menace / Starlight (30) | W2 Task Board unlocks; each consumes the previous weapon |
  | Weapon | W2-mid | Enforced Slasher / Pharaoh Bow / Crows Nest (50) | W2 Task Board unlocks |
  | Weapon | W3-early | The Ice Breaker / Blizzard Bow / Spriggly Storm (75) | W3 Task Board unlocks |
  | Weapon | W3-mid | Deuscythe / Blackhole Bow / Grey Gatsby (90) | W3 Task Board unlocks |
  | Weapon (Beginner, Journeyman) | W2-early / W3-early / W3-mid | Bandage Wraps (25) / Uninflated Glove (50) / Eclectic Ordeal (85) | Same rule, fists; W2 and W3 Task Board unlocks |
  | Pendant | W1-early | Slimy Necklace (5) | +15% total damage; drops from Glunko The Massive (wiki Pendants) |
  | Pendant | W2-early | Chaotic Amarok Pendant (30) | +20% total damage; W1 Merit Shop purchase 5 (wiki Chaotic Amarok Pendant) |
  | Ring (both) | W1-early | Copper Band (1) | Tab 1; "None of those slots … should be empty. It doesn't need to be the best" (Reddit, 2026-08-31) |
  | Ring (both) | W1-mid | Steel Band (15) | "For Jewelry, start with Iron bands …" (wiki Tips and Tricks; no item is called Iron Band, Steel Band is the Iron Bar ring); W1 Task Board unlock |
  | Ring (both) | W2-mid | Serrated Rex Ring (50) | "… and move to Serrated Rex Rings" (same FAQ); its recipe drops from Baba Yaga (wiki Rings), so it is a target only once that recipe is unlocked (F-c ≥ 0), never a farming Goal |
  | Pickaxe, hatchet, rod, net | the tool's world | every crafted tier, Copper → Void, at its skill level | wiki Tools; "Empty tool slots are bad" (Reddit, 2026-07-24) |

  The tool rows are generated from the ladder (F1): W1 rows are Copper and Iron, W2 rows Gold and Platinum, W3 rows Dementia and Void. Boss sets past Amarok (Efaunt, Chizoar) and Platinum armour are not wear targets in Phase 1 (D-3). They appear only as Smithy sets (FR-21).
- **FR-12 Behind.** A slot is `behind` when the equipped item is **an earlier Gear Plan row** than its target (the Plan's order is the authored judgment, cited per row: Amarok Hinds is the upgrade over Iron Platelegs even though it has less main stat), or when the equipped item is off the Gear Plan and the target dominates it (FR-3). A slot whose off-Plan item the target doesn't dominate (a trade) is `ok` with the note "a trade: compare in game".
- **FR-13 One gear Goal per character.** `gear.goal.next-piece` is a character Goal. It names one slot, picked in this order: (1) the AFK Target's tool slot when FR-19 fires and can't be done now; (2) a `behind` weapon or armour slot whose whole Walkthrough can be done now (weapon first, then the most levels behind); (3) the weapon, when `behind`; (4) the `behind` armour slot with the most levels behind (ties: helmet, shirt, pants, shoes). An empty armour or weapon slot goes through FR-8 instead. Accessories are never this Goal (FR-9). **One piece, one line (#70 A5):** when the same piece would be the FR-8 line or this Goal for two or more characters, they merge into one account Goal, "Craft Amarok Paws for 4 characters", with a detail per character, at the best position any of them would have had (position 3 when every detail can be done now). Those characters get no other gear Goal in that run. Its title is "Next piece: <piece> for your <slot>", for example "Next piece: The Ice Breaker for your weapon". When its whole Walkthrough can be done now, the Next Action says so: "Craft Amarok Paws now (anvil tab 1): you hold everything".
- **FR-14 The Next Action is the first open step.** The Goal's Next Action is the first open step of its Walkthrough (TR-6), in this order:
  1. **Unlock** the recipe when it is locked (F-c = -1): "Unlock Steel Band at the W1 Task Board (Unlocks tab)", "Buy 3 more Amarok recipes at the W1 Merit Shop (they come in order: Paws, Hinds, Bodyplate, Helmet, Pendant; merit cost from `merit-shop.fact.rows`)", or "Its recipe drops from <monster> at <map>". A W2 or W3 Task Board unlock needs that world's Task Board open (M20 V7's signal: Desert Davey's quest for W2, Iceland Irwin's for W3; V9). While it is closed, this step is that quest, through M14's quest Walkthrough.
  2. **Own the anvil tab** when it isn't owned (M14 `anvilTabsOwned`): craft the tab's expansion item, M14's existing anvil-tab target (its Requirement Tree, often the Bottleneck: Anvil Tab 3 needs 2,000 Platinum Bars).
  3. **Reach the Smithing level** when no character has the recipe's LV (FR-16).
  4. **Get the previous piece** when the recipe consumes one (F-e) and it is neither worn by this character nor held: craft it first, as one more step.
  5. **The scarcest material** (M14's Bottleneck), with its Supply.
  6. **Craft it**, on the crafter (FR-16): "Craft Amarok Paws at the anvil (tab 1), then equip it on your Bowman Lv 60".
- **FR-15 Held means held, with the worn piece counted.** Materials count through M14's `holdingsOf`. A piece the recipe consumes counts as held when it is **worn by the character that gets the new piece** (it is unequipped and crafted in), and the step says so: "uses the Copper Helmet it is wearing". A piece worn by another character never counts. M14 doesn't count worn gear (M14 FR-6), so X3 asks M14 to count a root's consumed piece as held when the root names it as worn by the root's own character. For choosing a **position** (3 or later), M18 hands holdings out in FR-6's character order. The words "you hold everything" are never M18's: they come from M14's Walkthrough (`allHeld`, after M14's Demand allocation by Goal rank), so the line and its Walkthrough can't disagree. When the two allocations differ, a line can sit at position 3 while its Walkthrough shows a shortfall; it then reads like any other Walkthrough line.
- **FR-16 The crafter.** A recipe's Smithing level (F-d) is checked against the wearer first: when the wearer has it, the wearer crafts. Otherwise the character with the highest Smithing level that has it is named ("craft it on your Bowman Lv 60, Smithing 39"). The crafted piece then moves through storage. When no character has the Smithing level, step 1 becomes "reach Smithing <LV> on any character" (M4's skill ladder carries it). V5 confirms that the gate is the crafter's Smithing level.
- **FR-17 Position.** `gear.goal.next-piece` for a weapon sits in each Stage list right after the subclass and tutorial Goals. For armour it sits in the Stage list's last positions, next to `classes.goal.level` (M2 X1). The weapon comes earlier because the wiki says to use the best weapon you can craft "at all times". Armour comes late because players report that gear matters little before W4 next to the Upgrade Vault, Alchemy and stamps (Reddit, 2026-08-01, 2026-01-15) (D-6). Category `compounding`. Confidence M for weapons and tools, L for armour.
- **FR-18 Keep what a set still needs.** When a Goal's recipe consumes a part of a Smithy set that the account has not registered (F-e and F-g: Gold armour consumes Copper, Platinum armour Iron, and the Gold- and Platinum-set weapons and tools are consumed by the next tier), its why line adds: "This uses your Copper Helmet. Register the Copper set at the Armor-set Smithy first, or craft a spare." Until the Smithy can be hired, it says: "… The Smithy opens in 26 days, and the Copper set needs this piece." This is a line, never a block (P7: the fix is "craft a spare"). When the consumed piece carries upgrade stones, the line adds "it has 2 upgrade stones in it".

**The AFK Target's tool** (`gear.check.afk-tool`)

- **FR-19 The tool for what it does.** For a character whose AFK Target is Mining, Choppin, Fishing or Catching, the matching tool slot fires when it is empty, or when a tool the character can wear (F-b) is better (FR-3) and is either held (handled by FR-6, so this Check only links it) or reachable now. It names **the highest tool tier the character can wear whose whole path is open now**: every recipe available or unlockable with unspent unlock points on an open Task Board, its tab owned, its materials held. "Your Barbarian Lv 56 fishes with no rod: unlock the Iron Fishing Rod at the W1 Task Board, then craft it". Failing that, it names the lowest wearable tier's first open step, never a higher one. It is one line: the same slot is never also FR-13 case (1). Position 3 when it can be done now, otherwise the FR-13 slot (1). Confidence H for an empty slot (the tool sets skill power, wiki Tools), M otherwise.
- **FR-20 Fighters' tools.** Empty tool slots on a character that isn't AFK on that skill are only listed on the Gear tab with "free stats from a held tool" when FR-6 found one. They are never a Goal: the wiki gives tools combat stats, but no Source says how much they help a fighter (section 11.3).

### F4 Armor-set Smithy

- **FR-21 Smithy states.** The Armor Smithy System page shows one of: `waiting` ("Opens in 26 days, or once 2,000 gems were bought"), `ready to hire`, `hired`, or `unknown`. While waiting, no Goal fires.
- **FR-22 Hire it.** `armor-smithy.check.hire`: when it can be hired (F-g) and isn't, one account Goal: "Hire the Armor-set Smithy in Frostbite Towndra". Why: "Registered sets give their bonus to every character for good, without wearing them." Position 3, `compounding`, confidence M (a wiki-reported 30-day timer the player must press Unlock on, Reddit 2025-07-09).
- **FR-23 Register a set.** `armor-smithy.check.register`: once hired, for each W1–W3 set (Copper, Iron, Gold, Amarok, Platinum, Efaunt, Dementia, Void, Chizoar) that is not registered and whose parts (F-g) the account holds or wears in full, one account Goal for the first such set in the smithy's list order: "Register the Copper set: wear its 3 pieces and a Copper tool on one character, then tap a worn piece". The details list where each part is. Sets missing one or two craftable parts appear on the page only, never as a Goal ("Iron set: 2 of 4 parts, craft an Iron Helmet"). Position 3, `compounding`.

### F5 Views

- **FR-24 The Gear tab.** A **Gear** tab on the Character page (`characterTabs`, deep link `#gear-<index>`), loaded as its own lazy chunk (TR-8). It shows:
  - the **paper doll** (Design Lab pick "Coloured silhouette"): 8 equipment squares and 6 tool squares (pickaxe, hatchet, rod, net, trap set, skull), each with its state glyph and word (`ok`, `45 levels behind`, `empty`, `better one held`, `unknown`). Trap set and skull show M20's state. Exactly one square is lit: the slot of this character's top-ranked M18 Next Action, counting an account Goal's detail for this character (so the hand-out wins over a lower-ranked craft), or none;
  - under the doll, **one step** (the lit slot's Next Action, about 12 words) and a "why" disclosure;
  - a tap on any square opens a sheet with: what is equipped (name, Lv, Defence or Weapon Power, main stat, % lines, upgrade slots free/total); the Gear Plan target and how it is obtained (FR-14's steps, at most three rows, "show all" for the rest); held items that fit; and the Sources;
  - the **tool ladder** (Design Lab pick "Tool ladder per skill") for the character's AFK skill, and for any skill whose tool is equipped: the tiers on one skill-level axis, the equipped tier ringed, the next tier with its level gate ("Platinum Pickaxe at Mining 25: you're 29").
- **FR-25 The Characters tile line.** The tab publishes one status line for its Characters tile (M17 FR-13), with at most two parts taken in this order: "<n> empty" (equipment slots plus the AFK skill's tool), "better gear held", "<slot> <N> levels behind" (the slot most levels behind). Examples: "4 empty · better gear held", "weapon 39 levels behind". Otherwise it reads "Gear ok", or "can't tell" when a slot is unknown.
- **FR-26 The Gear System page.** `equipment` (the registry's Gear & Tools System, M17 FR-35) gets a dedicated body (M17 FR-23a): the **gear heat strip** (Design Lab pick for the account view). Rows are characters, columns the 8 equipment slots and the AFK tool, each cell a glyph, a word and a number ("39 lv", "empty", "ok"). The cell for the top-ranked M18 Next Action is lit. Under 720 px wide it becomes a list of characters, each with its worst slot, three rows and "show all" (the critique's phone fallback).
- **FR-27 The Armor Smithy page.** `armor-smithy` gets a body: one card per W1–W3 set with its parts as slots (worn, held or missing), the bonus in words, and "registered" when it is (Design Lab "Set progress"). The card of the FR-22 or FR-23 Goal is lit.
- **FR-28 Highlight.** Pictures light the element whose `actionKey` equals M17's `SystemPageView.highlight` (M17 FR-31), as M20's pictures do. "See it" on any M18 Next Action opens the Gear tab of its character (character Goals) or the Gear page (account Goals).

### All features

- **FR-29 Determinism.** Same Account State, Knowledge Base, Expected Return and `now` give byte-identical slot states, Goals, Walkthrough roots and views.
- **FR-30 Fail closed.** A slot, Goal or picture element that reads an unknown field is `unknown` with a diagnostic (M11). Nothing is handed out or crafted from an unknown. `EmptyAccountError` produces no M18 output.
- **FR-31 Sources.** Every entry carries a player-readable wiki page or dated community post (tier 2–4, section 11.3) and its tier-1 provenance (Toolbox game data at the pin). The Gear Plan's judgment rows carry their community Source and a confidence.
- **FR-32 Stage Expectations (M15 F5).** M18 adds two rows to `metapath.metapath.stage-expectations`: "no empty armour or weapon slot by W1-mid" (fix: `gear.check.empty-slot`) and "the AFK skill's tool equipped by W1-late" (fix: `gear.check.afk-tool`).

## 4. User stories

**US-1. Use what I already have.** As a player in a Play Session, I want gear I own put on the characters who can use it, so that it isn't wasted in storage.
- **Given** the W3-early account at the golden clock **When** the engine runs **Then** the Account section shows "Equip gear you already hold on 2 characters" at position 3, with the details "Bowman Lv 60: Gold Helmet, Copper Platebody and Copper Platelegs from storage" and "Shaman Lv 54: Farmer Brim from storage".
- **Given** the W3-early account mutated so the Bowman Lv 60 already wears a helmet **When** the engine runs **Then** the Gold Helmet still goes to no Wizard Lv 73: its Alien Headband has more WIS and a mana-regen line, so the swap is a trade (FR-3). It goes to the Shaman Lv 54 instead (it dominates the Green Headband).
- **Given** the W2-late account **When** the engine runs **Then** the same Goal reads "… on 3 characters": "Wizard Lv 56: 2 Copper Bands from storage", "Bowman Lv 54: Carrot Launcher and a Copper Band from storage, Spore Tee from the Squire Lv 43's bag", "Squire Lv 43: Iron Pickaxe from storage (it mines at Mining 20)". The Barbarian Lv 60's held Old Hatchet is listed only on its Gear tab (FR-20).
- **Given** a later W3-early save where the Bowman wears the three pieces **When** the engine runs **Then** that detail is gone and the Goal reads "… on 1 character".

**US-2. No empty slots.** As a player, I want empty slots filled with something I can make now, so that a slot never sits at zero.
- **Given** the W2-late account **When** the engine runs **Then** the Wizard Lv 56 row has "Craft Copper Platelegs for your pants (anvil tab 1)" (150 of the 161 Oak Logs). The Bowman Lv 54 row has "Craft Copper Boots for your shoes (anvil tab 1)" and, for its pants, "Craft Iron Platelegs (anvil tab 1)": the Oak Logs went to the Wizard, so FR-8 case 2 moves to the next row (10 of 19 Iron Bars, 50 of 2,147 Boring Bricks).
- **Given** the W3-early account **When** the engine runs **Then** one account Goal reads "Fill 7 empty ring slots: craft Copper Bands now (100 Copper Bars each)", with details for the Squire Lv 51 (2), Bowman Lv 60 (1), Barbarian Lv 56 (2) and Shaman Lv 54 (2), and the why "Steel Band is better from Lv 15: unlock it at the W1 Task Board (10 unlock points unspent)".
- **Given** the W3-early account **When** the engine runs **Then** one account Goal reads "Craft Amarok Paws for 4 characters (anvil tab 1)" at position 3 (FR-13's merge): the Bowman Lv 60's empty shoes (FR-8 case 1) and the Wizard Lv 73, Squire Lv 51 and Shaman Lv 54, whose Copper Boots it replaces. Each detail's Walkthrough is "Copper Boots (the Bowman crafts one; the others use the pair they wear) → Iron Boots → Amarok Paws", and M14's header reads "you hold everything" (58 Amarok Slabs, 642 Grass Leaves, 1,983 Iron Bars and 3,201 Trusty Nails cover four pairs).

**US-3. The tool for the job.** As a player, I want a skiller to hold the right tool, so that it gathers at full power.
- **Given** the W3-early account (the Barbarian Lv 56 is AFK Fishing at Fishing 22 with no rod; every rod recipe is locked; 10 Task Board unlock points are unspent; the W1 and W2 boards are open) **When** the engine runs **Then** the Barbarian's row shows "Unlock the Iron Fishing Rod at the W1 Task Board, then craft it" (FR-19: Iron is the highest tier whose whole path is open now; the Gold rod needs 2,500 Hermit Cans and 1,966 are held), and M6's "Spend 10 task unlock points" line lists "first: Iron Fishing Rod, …" (X5).
- **Given** the W2-late account **When** the engine runs **Then** the Squire Lv 43 (AFK Mining 20) gets no separate tool line: its Iron Pickaxe is a detail of US-1's Goal, and its Gear tab ladder shows "Gold Pickaxe at Mining 15: needs the W2 Task Board unlock and anvil tab 2".

**US-4. What to work toward.** As a player, I want one clear next piece per character with a path to it, so that I know what to craft and what to farm.
- **Given** the W3-early Squire Lv 85 (Royal Bayonet, Lv 30) **When** the engine runs **Then** its Goal is "Next piece: The Ice Breaker for your weapon" (Lv 75; "45 levels behind"). Its first open step is "Unlock The Ice Breaker at the W3 Task Board". The Walkthrough then needs anvil tab 3 (the account owns 2; the tab's 2,000 Platinum Bars, 20 held, are the Bottleneck), an Enforced Slasher crafted from the Royal Bayonet it wears (that recipe is already unlocked, but needs 3 Nuget Cakes, none held), and the Ice Breaker's own materials.
- **Given** the W3-early Wizard Lv 73 **When** the engine runs **Then** it has no gear Goal of its own: its shoes are a detail of US-2's Amarok Paws Goal. Its weapon (Quarterstaff, Lv 12) reads "38 levels behind" on the Gear tab.
- **Given** the W2-late Barbarian Lv 60 (Steel Axe, Lv 11) **When** the engine runs **Then** its Goal is "Next piece: Enforced Slasher for your weapon" ("39 levels behind"). Enforced Slasher consumes a Royal Bayonet; both are W2 Task Board unlocks on anvil tab 2 (the account owns only tab 1), and Enforced Slasher needs Smithing 23 (the account's best is 18). The W2 Task Board is closed on this account, so the first open step is Desert Davey's quest (FR-14 step 1, V9).

**US-5. Don't lose a set.** As a player, I want to be warned before a recipe eats a piece the Smithy will need.
- **Given** the W3-early Squire Lv 51 (Copper Helmet worn) and a mutation where the Gold Helmet is its Goal's piece **When** the engine runs **Then** the why line reads "This uses your Copper Helmet. The Armor-set Smithy opens in 25 days, and the Copper set needs this piece: craft a spare."
- **Given** the W3-early Squire Lv 85's Ice Breaker Goal **When** the engine runs **Then** its why line adds that the Enforced Slasher it crafts on the way consumes the Royal Bayonet, a Gold set weapon, and that the Bayonet "has 3 upgrade stones in it".

**US-6. The Smithy when it opens.** As a player, I want to know when the Smithy opens and which set to register first.
- **Given** either fixture **When** the Armor Smithy page renders **Then** it reads "Opens in 26 days (W2-late) / 25 days (W3-early), or once 2,000 gems were bought", and no Smithy Goal exists.
- **Given** the W3-early account mutated to `OLA[381] = 30` **When** the engine runs **Then** "Hire the Armor-set Smithy in Frostbite Towndra" shows at position 3.
- **Given** that mutation plus `OLA[380] = 1` **When** the engine runs **Then** "Register the Copper set: wear its 3 pieces and a Copper tool on one character, then tap a worn piece" shows, with details "Copper Helmet, Platebody and Platelegs: worn by your Squire Lv 51" and "Copper Pickaxe: worn by your Wizard Lv 73". The Iron card reads "1 of 4 parts: the Iron Pickaxe in storage".

**US-7. The pictures light one thing.** As a player, I want to see each character's weakest slot at a glance.
- **Given** the W3-early account **When** the player opens the Bowman Lv 60's Gear tab **Then** the helmet, shirt and pants squares read "empty · one held", the shoes square reads "empty", the helmet square is lit (US-1's account Goal ranks first and its first detail is this helmet, FR-24), and the step reads "Equip the Gold Helmet from storage".
- **Given** the W3-early account **When** the player opens the Gear System page at 1280 px **Then** the heat strip shows 6 rows and 9 columns with the same Bowman Lv 60 helmet cell lit, and at 390 px it shows three character rows and "show all".

## 5. Technical requirements

### TR-1 Package boundaries
Engine logic is pure (no I/O, clock or randomness) in `packages/engine/src/gear/` (`slots.ts`, `held.ts`, `plan.ts`, `paths.ts`, `smithy.ts`, `views.ts`, `module.ts`). One engine module, `gear`, registered with `after: false`, so M14's `walkthroughs` module (which runs `after: true`) sees its Goals. It imports types from `@idleon-forge/account-state`, compiled entries from `@idleon-forge/knowledge`, `MetaPathResult` (Stage, pusher) from M2 and `holdingsOf` from M14. The adapter part lives in `packages/account-state/src/gear.ts` and `gear-types.ts`. The worker supplies Toolbox `getArmorSmithy` through injection, as M2's frontier does. The UI never imports `toolbox-parsers`, and the main chunk never imports `apps/activeon/src/gear/` (TR-8).

### TR-2 Account State additions (M1 TR-11 growth; every field null when its section fails)
```ts
export type GearSlotId = 'helmet' | 'weapon' | 'shirt' | 'pendant' | 'pants' | 'ring1' | 'shoes' | 'ring2'
  | 'pickaxe' | 'hatchet' | 'rod' | 'net';
export type GearClass = 'ALL' | 'WARRIOR' | 'ARCHER' | 'MAGE' | 'BEGINNER';

export interface GearItem {
  rawName: string;                 // Toolbox item rawName, e.g. "EquipmentHats28"
  type: string;                    // items.json Type, e.g. "HELMET", "BOW", "PICKAXE"
  cls: GearClass;
  lvReq: number;                   // lvReqToEquip (class level, or skill level for tools: F-b)
  def: number; wp: number; str: number; agi: number; wis: number; luk: number;
  pct: Array<{ txt: string; val: number }>;   // UQ1/UQ2, empty when none
  slotsLeft: number; slotsMax: number;         // Upgrade_Slots_Left, Toolbox maxUpgradeSlots
}

// CharacterState
gear?: null | { slots: Array<{ slot: GearSlotId; item: GearItem | null }> };   // 12 slots, F-a order

// AccountSummary
gearHeld?: null | Array<GearItem & { count: number; places: HoldingPlace[] }>; // one entry per stack (stones make copies differ), judged slot types only (M14 places)
anvilRecipes?: null | number[][];  // raw AnvilCraftStatus: [tab][recipe], -1 locked, 0 available, 1 crafted (F-c)
smithingRecipeMerits?: null | [number, number, number];  // W1–W3 "Smithing recipes" merit row levels (0..5)
armorSmithy?: null | { canHire: boolean; hired: boolean; daysWaited: number; registered: string[] }; // F-g, OLA[379–381]
```
Stats come from the item data Toolbox already attaches to each equipped item, and for held items from the worker's item lookup. **Privacy:** Toolbox's item `owner` field is a character name, so the adapter maps it to a character index inside the worker and keeps indices only. About 13 KB is added on the W3-early fixture (worn gear 8.7, held 3.1, recipe states 1.1, measured by the red-team on a compact serialisation), and an estimated 30 KB on the 17-character public save. The build PR measures both against M1's 320 KB guard before merging, and drops zero stats from the serialisation if needed.

### TR-3 Fact tables (ADR 0007)
| id | Origin | Contents | Source |
|---|---|---|---|
| `gear.fact.ladder` | generated (`gear.gen.ts`) from Toolbox `equipmentSets`, `items.json`, `crafts.json`, `taskUnlocks.json` | For the W1–W3 sets (Copper, Iron, Gold, Amarok, Platinum, Efaunt, Dementia, Void, Chizoar) plus the pieces `gear.priority.plan` names outside a set: rawName, slot family, set, `lvReq`, class, primary and main stats, % lines, upgrade slots, recipe materials (one level, with quantities), and the Task Board unlock position (world, index) when it is one | Toolbox game data at the pin (tier 1); wiki Equipment Sets (2026-09-23) and Set Bonuses (2026-10-07) |
| `gear.fact.recipes` | generated where game data has it, authored for the rest (tier 2, CI-checked); extends M14's `anvil.fact.recipe-tabs`, never a second table | generated: the tab-1 recipe numbers (`crafts.json` order, which matches tab 1), the Task Board unlock positions (`taskUnlocks.json`), the merit purchases (`merit-shop.fact.rows`); authored: the tab 2–3 numbers, the Smithing LV and the drop and on-craft sources (`start-of-tab`, `task-unlock`, `merit`, `drop` with monster, `on-craft` with the piece before, `on-entering` with world) | wiki Smithing/Anvil_Tab_1, _2, _3 (2026-10-07, "Drawn from game data"). CI: every `task-unlock` row's (world, index) matches the generated ladder, and on every public save its `AnvilCraftStatus` state agrees with Toolbox's `taskUnlocks` flag (V4) |
| `armor-smithy.fact.sets` | generated from Toolbox `equipmentSets` and `randomList[113]` (the smithy's order) | set name, parts (armour, tools, weapons), parts required, bonus value and text | Toolbox game data; wiki Set Bonuses |

Size, measured on 2026-10-18 by compiling with the gear items added: the ladder fact is about 12 KB raw. The materials' `items.acquisition.*` entries that M14 needs for the Requirement Trees (TR-6) add +61 entries and +33 KB raw (+5.9 KB gzip). Shipping a full Acquisition for every gear piece too would add +97 KB raw (+17.4 KB gzip), so gear pieces are expanded from the ladder fact instead (D-8). With both, the compiled bundle goes from 574 KB to about 620 KB of its 720 KB budget.

### TR-4 Entries (#11 shape; **A** authored)
| Entry id | Type | Detector | Position | Notes |
|---|---|---|---|---|
| `gear.priority.plan` | priority (`list: order`) **A** | — | — | FR-11's rows, each with its Source and confidence |
| `gear.check.equip-held` | check (account, details) **A** | `gear/slots` (params `{ part: held }`) | 3 (free-value fills) | FR-6, FR-7; effort 30 s per piece |
| `gear.check.empty-slot` | check (character; accessories as one account line) **A** | `gear/slots` (`{ part: empty }`) | 3 when craftable now, else with `gear.goal.next-piece` | FR-8–FR-10; 60 s |
| `gear.check.afk-tool` | check (character) **A** | `gear/slots` (`{ part: afk-tool }`) | 3 when doable now, else the FR-13 slot | FR-19; 60 s |
| `gear.goal.next-piece` | goal (character, Walkthrough) **A** | `gear/plan` | weapon: after the subclass Goals; armour: last positions | FR-13–FR-18; unit "steps" |
| `armor-smithy.check.hire` | check (account) **A** | `armor-smithy/state` | 3 | FR-22; 60 s |
| `armor-smithy.check.register` | check (account, details) **A** | `armor-smithy/state` | 3 | FR-23; 120 s |
| `gear/slots`, `gear/plan`, `armor-smithy/state` | engine Detectors | — | — | M11 engine Detectors |

Every template uses lookups (class, item, slot, map, monster), never free-text slots (M11 FR-27).

### TR-5 Engine output (M10 TR-2 additions, plain data built in the worker)
```ts
export type GearSlotState = 'empty' | 'ok' | 'behind' | 'held-upgrade' | 'unknown';

export interface GearSlotView {
  slot: GearSlotId | 'trap' | 'skull';
  state: GearSlotState | 'm20';        // trap and skull: 'm20', with M20's pip below
  pip?: SlotPip;                       // M20's SlotPip for trap and skull
  word: string;                        // "45 levels behind", "empty", "better one held", "ok"
  equipped: null | { rawName: string; name: string; lvReq: number };
  target: null | { rawName: string; name: string; lvReq: number; how: string }; // FR-14's first step, ≤ 12 words
  levelsBehind: number | null;
  actionKey: string | null;            // the NextAction.key this slot's element answers (FR-28)
}

export interface CharacterGear {
  index: number;
  slots: GearSlotView[];               // 8 equipment, 4 tools, then trap and skull
  lit: GearSlotId | null;              // FR-24's one lit square
  step: string | null;                 // the lit slot's Next Action text
  ladder: null | { skill: SkillId; tiers: Array<{ rawName: string; name: string; atLevel: number; equipped: boolean }>; skillLevel: number };
  status: string;                      // FR-25's tile line
}

export interface GearResult {
  characters: CharacterGear[];
  smithy: { state: 'waiting' | 'ready' | 'hired' | 'unknown'; daysLeft: number | null;
            sets: Array<{ setName: string; bonus: string; registered: boolean;
                          parts: Array<{ rawName: string; where: 'worn' | 'held' | 'missing' }>; actionKey: string | null }> };
  heat: { columns: GearSlotId[]; rows: Array<{ index: number; cells: Array<{ word: string; state: GearSlotState; actionKey: string | null }> }> };
  unlockWants: Array<{ kind: 'task-unlock' | 'merit'; world: 1 | 2 | 3; what: string }>; // X5: M6's details, in Goal rank order
}

// EngineResult addition
gear?: GearResult | null;
```
`buildNowView` passes `result.gear` through unchanged as `view.gear` (one line, no logic, so the main chunk stays the same size). Everything the Gear tab and pages render is built here, in the worker. The lazy chunk only formats it.

### TR-6 Walkthroughs (M14 reuse)
- A `gear.goal.next-piece` Goal, an `afk-tool` line that needs crafting, and an `empty-slot` line that needs crafting each carry a **Walkthrough root** built from the ladder fact: `{ kind: 'craft', item: rawName, tab, smithingLv, gate: { kind: 'task-unlock' | 'merit' | 'drop' | 'on-entering' | null, … }, requires: [{ ref, amount }] }`. Each `requires` names the material's generated `items.acquisition.*` entry, or, for a previous-tier gear piece, a nested root from the same ladder (F-e).
- M14 expands everything below the root exactly as for any other target: holdings with places, Supplies with drop and anvil effort, the Bottleneck, the steps and their progress, Demand and its ordered allocation (M14 FR-13). M14 also assigns farmers (M14 FR-17, FR-18), so a gear Goal can put a character on a material as its one job, within AFK safety and never on the pusher.
- This needs two small M14 additions (X3): an engine module may hand M14 an inline root on `Goal.walkthroughRoot` (today a target must be an Acquisition id in the entry's `walkthrough` field), and two gate kinds, `task-unlock` and `merit`, next to the anvil-tab and skill-level gates M14 has. `rateTargets` also takes the roots' materials, so the worker computes their Supply rates.

### TR-7 Homes, tabs and registry (M17 interfaces)
- `characterTabs` gains `{ id: 'gear', label: 'Gear', Component: lazy(() => import('../gear/GearTab')), status: (view, i) => view.gear?.characters.find(c => c.index === i)?.status ?? null }` (M17 FR-15). The status reads a string, so it adds no code to the main chunk.
- `SYSTEM_HOMES` gains `equipment: { tab: 'gear', page: 'gear' }` and `'armor-smithy': { page: 'armor-smithy' }`. `SYSTEM_PAGES` gains both `page` ids, each a `lazy()` component.
- The System registry gains `equipment` (name "Gear & Tools", world 0, scope character) and `armor-smithy` (world 3, scope account), with `systems.fact.unlocks` rows: `equipment` "Open from the start", `armor-smithy` "Opens in the W3 town once you've waited 30 days or bought 2,000 gems". These are two of M17 FR-35's ten Phase 3 rows, landed early by this module.
- Phase 1 M17 needs one change (X6): `Focus.tsx` renders the tab component inside a `<Suspense>` boundary (today only `Shell.tsx` has one), and `SystemPage.tsx` does the same for the page body.

### TR-8 Performance and budgets
- **Worker:** the adapter work is ≤ 2 ms per save. The engine module is ≤ 4 ms for 11 characters (M10's engine benchmark), with ≤ 12 Walkthrough roots in total (one Goal per character, plus the account lines). The Supply work for their materials falls inside M14 TR-8's budget, and the first build PR measures it on `highend.json`.
- **Knowledge Base:** +55 KB raw and +10 KB gzip at most (TR-3: ladder 12, material Acquisitions 33, recipes, Smithy sets, the Gear Plan and seven entries about 10), against 574 KB raw and 130.8 KB gzip measured on 2026-10-18 (budgets 720 KB and 160 KB), checked by `kb compile` in the build PR. Over that means trimming the ladder's unused fields, never dropping a Source.
- **Main chunk:** it measured **319.05 KB gzip of its 320 KB budget** on main `4ae879c` (2026-10-18). M18 adds nothing to it: the tab, both page bodies and their CSS are lazy chunks; the tab status is a string from the worker; `buildNowView` only passes `gear` through. The tab entry, the two `lazy()` stubs and the `<Suspense>` boundaries do sit in the main chunk, about 0.3–0.5 KB gzip together, and M19 needs room too, out of 0.95 KB of headroom. The build PR runs `check-budgets`. If the main chunk would pass 320 KB, the PR moves an existing eager import to a lazy chunk in the same PR (the Cards and Build tabs are the candidates) instead of raising the budget.
- **Account State:** ≤ 4 KB per save (TR-2).

### TR-9 Storage, security and privacy
M18 stores nothing of its own. Dismissals use M10's preference store, keyed by entry id, character index and slot, never by a character name. Item `owner` names never leave the worker (TR-2). "Report this" sends M13's `ReportContext` with the entry id and the item rawNames only. Tests use synthetic mutations and never print fixture names. Assertions on the private fixtures compare counts and class and level labels.

### TR-10 Tests
- **Detector examples** (M11): each Check fires, stays silent and reads `unknown` on the scrubbed fixtures with section 4's mutations.
- **Dominance** (FR-3): table tests for every rule: an empty slot, a dominated item, a trade on the main stat, a lost % line, an equal item.
- **Allocation** (FR-6, FR-15): one held Gold Helmet and two candidates; one Oak Log stack and two Copper Platelegs; the worn piece counts only for its wearer.
- **Recipe state** (V4): a contract test on all public saves and both scrubbed fixtures checks that every `task-unlock` row's `AnvilCraftStatus` value agrees with Toolbox's `taskUnlocks` flag, that every `merit` row agrees with the merit level, that every piece worn on a save has its recipe at 1 (crafted) or the item is a drop, and that the per-tab array lengths are 84, 80, 72, 64, 36, 52 and 24. It runs in M12's weekly re-sync, so a patch that moves recipe numbers fails loudly.
- **Generator** (`gear.gen.ts`): the ladder equals Toolbox's `equipmentSets` for the nine W1–W3 sets at the pin, and every Gear Plan rawName exists in it.
- **Goldens** (M11 TR-15): section 11's lines are lines of the Now text snapshot, plus a `## Gear` section (one line per character: lit slot, state words).
- **Public saves:** the 11 public saves give no crash, no Goal from a Gear Plan row above the account's Stage, and no M18 Goal on a W4+ save from a W1–W3 row that doesn't apply.

## 6. States and edge cases

| State | Behaviour |
|---|---|
| Loading, empty parse | No Gear tab content (M10's loading state); no M18 Goals |
| A W1-early account | Only W1-early Gear Plan rows apply; the Smithy page reads "In the W3 town; its 30-day wait counts from your account's start (N days left)" |
| A W4+ account | Slot states still judged (a W4 piece the plan doesn't know is never "behind" a W3 target, FR-3: it dominates or trades); no Gear Plan Goal above W3 rows; the tab says "Gear Plan covers Worlds 1–3" |
| A Beginner or Journeyman | Fists ladder; class `BEGINNER` items only |
| Item unknown to the pin (new patch item) | That slot is `unknown` ("an item this version doesn't know"); other slots unaffected |
| `AnvilCraftStatus` missing or a different shape | Every recipe's state is unknown; Goals show the piece but no "craft now" and no unlock step ("check the recipe in game") |
| Recipe numbers moved by a patch | The weekly contract test fails (TR-10); entries go Stale until `gear.fact.recipes` is refreshed |
| Held item worn by two candidates' needs | FR-6's order decides; the second character's slot stays `empty` and reads "craft …" |
| A recipe consumes the piece the character wears | FR-15: counts as held for that character; the step says "uses the <piece> it is wearing" |
| A recipe consumes a piece worn by someone else | Not held; the Walkthrough adds "craft another <piece>" |
| Two Goals want the same material | M14 FR-13: the higher-ranked Goal is served first; the other shows what is left |
| Smithy days counter missing | Smithy `unknown`; no Smithy Goal |
| Second account signed in | Everything is per Account State; nothing is cached across accounts |
| Multiple tabs | Dismissals sync through M10's store |
| Paste mode | Works on the pasted save; no history is needed |

## 7. Dependencies and cross-module requests

| Module | What M18 uses | Interface or request |
|---|---|---|
| **M1** | Account State, `isKnown` | TR-2 growth through M1 TR-11 |
| **M2** | Stage, pusher, `compareGoals`, Stage lists | **X1:** add `gear.check.equip-held`, `gear.check.empty-slot`, `gear.check.afk-tool`, `armor-smithy.check.hire` and `.register` to `metapath.priority.free-value-fills`; add `gear.goal.next-piece` (weapon) after the subclass Goals and (armour) to the last positions of every Stage list from W1-mid on |
| **M4** | the tool Purpose lines and `skills.goal.tool-*` ladders | Dedupe: M4 keeps the Purpose line and the next tool tier the skill level hasn't reached yet ("Dementia Pickaxe at Mining 37"); M18 owns the Next Action for a tool the character can already wear (FR-19). The Gear tab ladder shows both, in one axis, so they never read as two answers. No change to M4 |
| **M6** | merit and unlock-point lines | **X5:** `task-unlocks.check.spend` and `merit-shop.check.spend-w1…w3` add M18's `unlockWants` as their first details ("first: Iron Fishing Rod, Steel Band"). M6's ranking and text are otherwise unchanged |
| **M8** | `holdingsOf`'s rule (equipped never counts) | read-only |
| **M10** | `EngineResult`, `NowView` | `gear` added and passed through (TR-5); the `## Gear` golden section |
| **M11** | schema, fact tables, Detector contract, generators | the `gear` generator; CI for `gear.fact.recipes` (TR-3); registry rows (TR-7) |
| **M14** | Requirement Trees, Supplies, Demand, `holdingsOf`, `anvilTabsOwned`, planner | **X3:** inline Walkthrough roots on `Goal.walkthroughRoot`; gate kinds `task-unlock` and `merit`; roots' materials in `rateTargets`; count a root's consumed piece as held when the root names it as worn by the root's own character (an exception to M14 FR-6); and an `allHeld` flag on the Walkthrough that M18's lines use for "you hold everything" (FR-15). **X4:** M14 Phase 3's "gear Walkthroughs … gear Priority List owned with M9" moves to M18; M9 is not involved |
| **M15** | Stage Expectations | FR-32's two rows, added in M18's PR |
| **M17** | `characterTabs`, `SYSTEM_HOMES`, `SYSTEM_PAGES`, registry, highlight | TR-7; **X6:** `<Suspense>` around tab and page bodies |
| **M20** | skull and trap slot states | The paper doll shows M20's `SlotPip` for trap and skull and links M20's Goals. **X7:** M20 FR-36's Skills-tab gates read "Anvil tab 2 at Smithing 15"; a tab is owned by crafting its expansion item (F-d), so the gate should read "can craft Anvil tab 2 from Smithing 15" |

## 8. Owner review (self-ruled; the owner was asleep)

Each question was ruled by the author with the recommendation below, so the build can start. Each is also one line under "M18" in the batched review queue. The owner confirms or overturns them in the review release.

- **D-1 Module home.** Options: grow M9 (Builds), grow M14 Phase 3, or a new module. ➡️ **A new module M18** that owns the Gear Plan, the gear Checks and the Smithy, and takes over M14 Phase 3's gear Walkthroughs and gear Priority List (X4). *Why:* the owner asked for M18. M9 owns talents, not items. M14 expands whatever it is handed and was always meant to receive the choice from somewhere else.
- **D-2 Which slots.** ➡️ The 8 equipment slots and the 4 gathering tools. Trap set and skull stay M20's, and premium and cosmetic slots are out. *Why:* M20 already owns skulls and traps. Premium slots are gem-shop items with no crafting path.
- **D-3 What "behind" is measured against.** Options: the best piece the character could wear; the best piece reachable at its Stage; an authored Gear Plan. ➡️ **An authored Gear Plan per Stage** (FR-11): Copper → Iron → Gold Helmet plus Amarok → Dementia from W3-mid; the best craftable weapon; Copper Band → Steel Band; Slimy Necklace → Chaotic Amarok Pendant; every crafted tool tier at its skill level. Dementia carries confidence L. *Why:* "best wearable" flags every slot 30–60 levels behind on both fixtures, and that is noise. The wiki's FAQ names this exact path ("a Golden Helmet with 3 pieces of Amarok Armor", then Dementia in W3–W4, "the best weapon that is craftable at all times", "start with Iron bands"). Players report wearing Amarok into W5–W6, so Dementia is the one row most likely to change (Contested under ADR 0004 once a post-patch Source disagrees). Platinum, Efaunt and Chizoar armour are not wear targets in Phase 1, only Smithy sets.
- **D-4 Thresholds for the picture.** ➡️ No thresholds: a slot is `behind` exactly when it holds an earlier Gear Plan row than its target, or an off-Plan item the target dominates (FR-12), and the number shown is the level gap. *Why:* the Design Lab's 10/30-level bands would colour almost every slot "far behind" on both fixtures. A dominance test is honest and needs no tuning.
- **D-5 Comparing two items.** Options: a weighted gear score; Toolbox damage on a clone; dominance. ➡️ **Dominance for off-Plan items, the Plan's cited order between Plan pieces** (FR-3, FR-12). *Why:* a weighted score is a formula of ours, and Toolbox's clone keeps the saved stats (F-f), so neither is allowed (ADR 0005). Dominance never recommends a trade, and the Gear tab says "a trade: compare in game" instead.
- **D-6 Noise and rank.** ➡️ Held gear is one account Goal at position 3; empty accessories are one account line; each character has at most one gear Goal; weapons rank after the subclass Goals, armour last. *Why:* #70 A5. The wiki says to keep the best weapon craftable, and players say armour matters little before W4 next to the Vault, Alchemy and stamps (Reddit 2026-08-01, 2026-01-15).
- **D-7 Damage numbers.** ➡️ None in Phase 1. *Why:* F-f. Swapping gear on a Toolbox clone changes only Weapon Power and Defence, not STR, AGI, WIS or LUK, so any "+X% damage" would be wrong. Revisit only if Toolbox computes stats from gear itself.
- **D-8 Walkthroughs and the bundle.** ➡️ Gear Goals get M14 Walkthroughs from inline roots built from `gear.fact.ladder` (X3), and only the materials' Acquisitions ship (+33 KB raw). *Why:* a full Acquisition per gear piece costs +97 KB raw, two thirds of the room left for M5, M18 and M19 together (TR-3).
- **D-9 The Smithy.** ➡️ Phase 1 shows its countdown and covers hiring it, registering complete W1–W3 sets, and warning before a recipe eats a piece a set still needs (FR-18). *Why:* both fixtures are 25–26 days from opening it. The warning is the one thing worth knowing now, because Gold armour consumes Copper and Platinum consumes Iron, and players advise registering those sets first (Reddit 2026-01-15, 2026-08-12).
- **D-10 Upgrade stones.** ➡️ Phase 2. Phase 1 shows free upgrade slots on the doll and never suggests a stone. *Why:* players agree old-world stones lose value with each new world and that Mystery stones are kept for stamps (Reddit 2026-04-15). A good stone rule needs to know which pieces are kept, which the Gear Plan provides in Phase 2.
- **D-11 Stage Expectations.** ➡️ "No empty armour or weapon slot by W1-mid" and "the AFK skill's tool equipped by W1-late". *Why:* both are cheap fixes the game offers from W1, and "Behind for your Stage" is where a player who never opened the Gear tab finds out.
- **D-12 Fighters' tools.** ➡️ Listed on the Gear tab when held, never a Goal. *Why:* tools carry STR, AGI, WIS and LUK, and Toolbox adds them to combat stats, but no human Source says it matters for a fighter.
- **D-13 The crafter.** ➡️ The wearer crafts when it has the recipe's Smithing level; otherwise the highest-Smithing character that has it is named. *Why:* the anvil is usable from anywhere since v2.27, and a crafted piece moves through storage. V5 confirms which character's Smithing level the game checks.
- **D-14 Glossary.** ➡️ Add **Gear Plan**. *Why:* the UI says "Gear Plan target" and "behind the Gear Plan", and the term should be fixed before the build.

## 9. Red-team notes (author's own pass)

1. **Wrong "better".** Recommending a Copper Platebody (DEF 10, WIS 3) to a Wizard wearing Tattered Cloth (WIS 8). *Defence:* dominance on the main stat and every % line (FR-3); US-1 tests the Gold Helmet trade.
2. **Noise.** Five or six gear Goals on every character. *Defence:* one Goal per character, armour in the last positions, accessories and held gear as account lines (D-6).
3. **Eating a set piece.** Gold armour consumes the Copper piece the Smithy needs. *Defence:* FR-18's warning with its fix.
4. **A locked recipe sold as "craft now".** *Defence:* `AnvilCraftStatus` (F-c) and the unlock step first (FR-14), with a weekly contract test on recipe numbers (TR-10).
5. **Patch day.** New items, moved recipe numbers. *Defence:* unknown items make one slot `unknown`; the contract test fails loudly; entries go Stale.
6. **Main-chunk budget.** It is at 319.05 of 320 KB. *Defence:* everything visual is lazy; the status line is a worker string; the build PR proves +0.3 KB at most (TR-8).
7. **Privacy.** Toolbox's `owner` is a character name. *Defence:* indices only, mapped in the worker (TR-2).
8. **A target above the Stage.** Telling a W2 account to make Dementia armour. *Defence:* FR-11's Stage column (P2), with a public-save test (TR-10).

## 10. Red-team log

An independent reviewer (no access to the author's reasoning) checked the draft against the vendored Toolbox code and data, M2, M4, M6, M14, M15, M17 and M20, the wiki and both private saves (raw `AnvilCraftStatus` and `CYAnvilTabsOwned` included), with its own scripts: 36 findings (0 P0, 7 P1, 16 P2, 13 P3). It confirmed both hand-outs in US-1, every weapon's levels-behind number, the recipe states, the unlock points, the Task Board open or closed state, the Amarok Paws chain and the Smithy countdown. The author re-checked each finding before ruling.

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| 1 | P1 | Anvil tabs are owned by crafting an expansion item, not by a Smithing level | fixed | F-d; FR-14 step 2; US-4 and §11 add the tab steps (W2-late owns 1 tab, W3-early 2); X7 asks M20 to fix its gate text |
| 2 | P1 | The Smithing LV gate was missing from W2-late's examples | fixed | FR-14 step 3; US-4, §11.1 (Smithing 23 vs 18) |
| 3 | P1 | Plan rows don't dominate the rows before them | fixed | FR-12: between Plan pieces the Plan's cited order decides; dominance only for off-Plan items (D-4, D-5) |
| 4 | P1 | §11.1 tile lines wrong | fixed | Recomputed with FR-12 (Squire Lv 43: pants 32) |
| 5 | P1 | Bowman Lv 54's pants: Iron Platelegs, not "needs Oak Logs" | fixed | US-2, §11.1 |
| 6 | P1 | One piece repeated across four characters at two ranks | fixed | FR-13: one account line per piece, at the best position (US-2) |
| 7 | P1 | Worn pieces count as held, against M14 FR-6 | fixed | X3 asks M14 for the exception; "you hold everything" comes from M14's `allHeld` (FR-15) |
| 8 | P2 | Tool advice overlaps M4's tool ladders | fixed | §7 M4 row: M4 the next tier above the skill, M18 the wearable tier |
| 9 | P2 | FR-19 didn't say which tool; US-3 picked the Copper rod | fixed | FR-19: highest tier whose path is open now; US-3 names the Iron Fishing Rod; one line, never also FR-13 |
| 10 | P2 | FR-18 ignored weapon and tool set parts | fixed | FR-18 covers them; US-5's second case |
| 11 | P2 | `gearHeld` merged stacks with different stones | fixed | One entry per stack; stats include stones (FR-3, TR-2) |
| 12 | P2 | Account State estimate 5× low | fixed | TR-2: ~13 KB measured; the build PR checks M1's guard |
| 13 | P2 | KB budget left out entries and gzip | fixed | TR-8: +55 KB raw, +10 KB gzip, against measured 574 / 130.8 KB |
| 14 | P2 | Main-chunk claim unproven | fixed | TR-8: the stubs are counted; over budget means moving an eager import in the same PR |
| 15 | P2 | `gear.fact.recipes` authored where data exists; duplicates `anvil.fact.recipe-tabs` | fixed | TR-3: generated where possible, extends M14's table |
| 16 | P2 | Contract test covered only task-unlock rows | fixed | TR-10: merit rows, worn pieces, array lengths |
| 17 | P2 | Class families missed elite classes | fixed | FR-2 reads M2's class tree |
| 18 | P2 | Merit recipes are bought in order | fixed | FR-14 step 1 wording |
| 19 | P2 | US-7 lit two different slots; empty-with-held undefined | fixed | FR-4 (held-upgrade wins), FR-24 (account details count), US-7 |
| 20 | P2 | Fists row above the next Stage | fixed | FR-11 splits it by Stage |
| 21 | P2 | FR-15 shipped a known contradiction | fixed | The words come from M14's `allHeld` (FR-15) |
| 22 | P2 | No tool fallback rule | fixed | FR-19 |
| 23 | P2 | Smithy timer counts from account creation | fixed | F-g; §6 W1 row |
| 24 | P3 | Spore Tee is in a bag, not storage | fixed | US-1, §11.1 |
| 25 | P3 | The trade rule wasn't really tested | fixed | US-1 mutation case |
| 26 | P3 | Copper Platelegs and Boots unlock on craft | fixed | F-d; `on-craft` source kind (TR-3) |
| 27 | P3 | Bundle path left out of the Smithy rule | fixed | F-g uses Toolbox's `isSmithyUnlocked` |
| 28 | P3 | Defence plus Weapon Power was a weighting | fixed | FR-3: each on its own |
| 29 | P3 | Crafts destroy stones without warning | fixed | FR-18's stone line |
| 30 | P3 | Dismissals not keyed by character | fixed | TR-9 |
| 31 | P3 | `'m20'` dropped M20's pip | fixed | TR-5 `pip` |
| 32 | P3 | "<n> empty" ambiguous | fixed | FR-25 |
| 33 | P3 | Plan stopped at Steel Band | fixed | Serrated Rex Ring row, once its dropped recipe is unlocked |
| 34 | P3 | Crafter always the top-Smithing character | fixed | FR-16, D-13 |
| 35 | P3 | "tier" used for Stage-list positions | fixed | "last positions" |
| 36 | P3 | Reddit Sources unchecked; X5 order undefined | fixed in part | The Sources were opened by the author's research pass on 2026-10-18 (§11.3); X5 lists unlocks in Goal rank order (TR-5) |

Rejected: none. Deferred: none.

## 11. Worked examples (private fixtures, by class and level)

Golden clock (`now` = the save), Expected Return 8 h. Smithy: day 4 of 30 (W2-late), day 5 of 30 (W3-early), not hired, nothing registered.

### 11.1 W2-late account (Stage W2-late; 1 anvil tab owned; Smithing 17–18 on every character; 2 unspent Task Board unlock points; W2 Task Board closed; W1 Amarok recipes 0 of 5)
- **Equip what you hold** (account, position 3): Wizard Lv 56, 2 Copper Bands (both rings empty); Bowman Lv 54, the Carrot Launcher (bow, Lv 18) for its Birch Longbow, a Copper Band, and the Spore Tee from the Squire Lv 43's bag; Squire Lv 43, the Iron Pickaxe (it mines at Mining 20 with a Copper Pickaxe). The Barbarian Lv 60's Old Hatchet is only on its Gear tab.
- **Empty slots** (per character): Wizard Lv 56, "Craft Copper Platelegs" (pants; 150 of the 161 Oak Logs); Bowman Lv 54, "Craft Copper Boots" (shoes) and "Craft Iron Platelegs" (pants: the Oak Logs went to the Wizard). The Bowman's second ring is one account line, "Fill 1 empty ring slot: craft a Copper Band".
- **Next piece** (one per character; none can be finished now: every W2 weapon is a W2 Task Board unlock on anvil tab 2, the W2 board is closed, and the Platinum-tier weapons need Smithing 23): Barbarian Lv 60, Enforced Slasher (Steel Axe Lv 11, "39 levels behind"); Squire Lv 43, Royal Bayonet (Wooden Spear Lv 4, "26 levels behind"; a Steel Axe first); Shaman Lv 44, Starlight (Gnarled Wand Lv 4, "26 levels behind"; a Quarterstaff first); Bowman Lv 54, Pharaoh Bow (Birch Longbow Lv 12, "38 levels behind"); Wizard Lv 56, Crows Nest (Gnarled Wand Lv 4, "46 levels behind"). Each first open step is Desert Davey's quest (V9). Armour targets are the Gold Helmet (anvil tab 2) and Amarok (W1 Merit Shop, bought in order). The Bowman's and Wizard's Real Civil Engineer Helmets, the Wizard's Tattered Cloth and its Goo Galoshes are off-Plan trades, so those slots read "ok · a trade".
- **Gear tab tile lines** (FR-25): Barbarian Lv 60 "weapon 39 levels behind"; Squire Lv 43 "better gear held · pants 32 levels behind" (Copper Platelegs is an earlier Plan row than Amarok Hinds, FR-12); Bowman Lv 54 "4 empty · better gear held". The golden pins the rest.

### 11.2 W3-early account (Stage W3-early; 2 anvil tabs owned; Smithing 13–39; 10 unspent Task Board unlock points; W1, W2 and W3 boards open; W1 Amarok recipes 1 of 5, so Amarok Paws is unlocked)
- **Equip what you hold:** Bowman Lv 60, Gold Helmet, Copper Platebody and Copper Platelegs from storage (it wears no helmet, shirt or pants); Shaman Lv 54, Farmer Brim from storage for its Green Headband.
- **The AFK tool:** Barbarian Lv 56 fishes at Fishing 22 with no rod: "Unlock the Iron Fishing Rod at the W1 Task Board, then craft it" (300 Iron Bars, 650 Hermit Cans, 3 Distilled Water held). Squire Lv 51 mines at Mining 29 with a Gold Pickaxe; its ladder shows the Platinum Pickaxe (Mining 25, recipe unlocked) needing 800 Platinum Bars (20 held), with M4's Purpose line toward it.
- **Empty rings:** 7 across the Squire Lv 51, Bowman Lv 60, Barbarian Lv 56 and Shaman Lv 54, one account line ("craft Copper Bands now"; Steel Band is a locked W1 unlock).
- **Amarok Paws, one line:** "Craft Amarok Paws for 4 characters" (Bowman Lv 60's empty shoes; Wizard Lv 73, Squire Lv 51 and Shaman Lv 54 over their Copper Boots), position 3, everything held.
- **Next piece:** Squire Lv 85, The Ice Breaker (weapon, "45 levels behind"; unlock it at the W3 board, then anvil tab 3, whose 2,000 Platinum Bars are the Bottleneck, and 3 Nuget Cakes for the Enforced Slasher on the way). Barbarian Lv 56 gets the rod (above). Bowman Lv 60, Pharaoh Bow (Carrot Launcher Lv 18, "32 levels behind"; "Unlock Spiked Menace at the W2 Task Board" first). The Wizard Lv 73, Squire Lv 51 and Shaman Lv 54 have only the merged Paws line this run. The Squire Lv 85's Viking Cap and Studded Hide, and every Goo Galoshes, are off-Plan trades.
- **Smithy:** "Opens in 25 days". The Squire Lv 51 and Barbarian Lv 56 wear Copper Helmets, so a Gold Helmet craft would carry FR-18's warning.

### 11.3 Facts checked for this spec
| Claim | Evidence (opened 2026-10-18) |
|---|---|
| Slot order, item fields | Toolbox `character.ts` L346–363, `items.ts` `createItemsWithUpgrades` @ 6c37e3d; both fixtures |
| Tool level = skill level | 503 of 507 equipped tools on the 11 public saves (scratch script over `parseSave`) |
| `AnvilCraftStatus` -1 / 0 / 1 | both raw fixtures vs wiki recipe numbers and Toolbox `taskUnlocks` (17 groups of recipes agree) |
| Recipe sources, tabs, LV, consumed pieces | wiki [Smithing/Anvil Tab 1](https://idleon.wiki/wiki/Smithing/Anvil_Tab_1), [Tab 2](https://idleon.wiki/wiki/Smithing/Anvil_Tab_2), [Tab 3](https://idleon.wiki/wiki/Smithing/Anvil_Tab_3) (2026-10-07); [Smithing](https://idleon.wiki/wiki/Smithing) (2026-10-05); [Tasks/Unlocks](https://idleon.wiki/wiki/Tasks/Unlocks) (2026-10-07) |
| Armour, weapon, ring, pendant and tool tiers | wiki [Helmets](https://idleon.wiki/wiki/Helmets), [Shirts](https://idleon.wiki/wiki/Shirts), [Pants](https://idleon.wiki/wiki/Pants), [Shoes](https://idleon.wiki/wiki/Shoes) (2026-09-13), [Weapons](https://idleon.wiki/wiki/Weapons) (2026-10-03), [Rings](https://idleon.wiki/wiki/Rings) (2026-09-14), [Pendants](https://idleon.wiki/wiki/Pendants) (2026-10-14), [Tools](https://idleon.wiki/wiki/Tools) (2026-10-03) |
| The FAQ's gear path | wiki [Tips and Tricks](https://idleon.wiki/wiki/Tips_and_Tricks) (rewrite 2025-03-12, last edit 2025-12-24): Gold Helmet plus 3 Amarok pieces after W1; Dementia while pushing W3–W4; "the best weapon that is craftable at all times"; "start with Iron bands" |
| Empty slots shouldn't be empty | Reddit [r/idleon comment](https://old.reddit.com/r/idleon/comments/1w2v0m0/_/p6y45vg/) (2026-08-31); [tools](https://old.reddit.com/r/idleon/comments/1v59wcs/_/ozhb9dn/) (2026-07-24) |
| Amarok worn into W5–W6 | Reddit [1ufprom](https://old.reddit.com/r/idleon/comments/1ufprom/when_should_i_bother_a_about_armor_set/) (2026-06-26); [1symnnq](https://old.reddit.com/r/idleon/comments/1symnnq/can_someone_explain_the_amarok_set_bonus/) (2026-04-30) |
| Gear matters little before W4 | Reddit [p13am18](https://old.reddit.com/r/idleon/comments/1vbovov/_/p13am18/) (2026-08-01); [1qdkpnh](https://old.reddit.com/r/idleon/comments/1qdkpnh/should_i_go_from_goldamarock_armor_to_platinum/) (2026-01-15) |
| Register Copper and Iron before upgrading | Reddit 1qdkpnh (2026-01-15); [1vlwxx5](https://old.reddit.com/r/idleon/comments/1vlwxx5/delete_old_armor_sets/) (2026-08-12) |
| Smithy: patch, unlock, registering | wiki [Changelog/2025](https://idleon.wiki/wiki/Changelog/2025) (v2.37b, 2025-05-29); [Frostbite Tundra](https://idleon.wiki/wiki/Frostbite_Tundra) (2025-07-21); [Set Bonuses](https://idleon.wiki/wiki/Set_Bonuses) (2026-10-07); Reddit [1lq3xp3](https://old.reddit.com/r/idleon/comments/1lq3xp3/reminder_to_check_armorset_smithy/) (2025-07-02, 30 days or 2,000 gems; press Unlock); Toolbox `armorSmithy.ts`; AutoReview `w3/armor_sets.py` L47 @05ac449 (cited, not copied) |
| Upgrade stones | wiki [Upgrades](https://idleon.wiki/wiki/Upgrades) (2026-09-13), [Armor Upgrade Stone II](https://idleon.wiki/wiki/Armor_Upgrade_Stone_II) (2026-10-05); Reddit [1smbq2e](https://old.reddit.com/r/idleon/comments/1smbq2e/trash_upgrade_stones/) (2026-04-15) |
| Anvil from anywhere | wiki Changelog/2025, v2.27 (2025-02-03) |
| No gear swap damage | Toolbox `character.ts` L310 (`StatList`), `damage.ts` (`getStatsFromGear` for WP and Defence only) |
| `lvReqToCraft` is not the anvil LV | `items.json` Gold Helmet `lvReqToCraft` 5 vs the wiki row's LV 15 |
| Main chunk size | `pnpm --filter @idleon-forge/activeon build` on 4ae879c: `index-*.js` 319.05 KB gzip |
| Bundle cost of gear Acquisitions | `kb compile` with the gear items seeded: +165 entries, +97 KB (all pieces); +61 entries, +33 KB (materials only) |

### 11.4 Verify before build
- **V1** (settled) Slot order and item fields on both fixtures: F-a.
- **V2** (settled) Tool level gates are skill levels: F-b.
- **V3** (settled) Toolbox can't price a gear swap: F-f.
- **V4** (settled) `AnvilCraftStatus` semantics and wiki recipe numbers: F-c. The build adds the weekly contract test (TR-10).
- **V5** Which character's Smithing level the anvil checks (the crafter's, D-13), from N.js's craft handler. Agent task. If it is account-wide (the highest), FR-16's naming is dropped.
- **V6** Whether hiring the Smithy costs anything, from N.js or one look in game. Agent task first, then Yasser if N.js is unclear.
- **V7** Whether a set must be registered while the logged-in character wears it (Toolbox counts the logged-in character's parts, F-g), so the register Goal names "on one character, logged in". Agent task (N.js `GetSetBonus`).
- **V8** That every Gear Plan rawName and recipe number still holds at the pin when the build starts (the generator test, TR-10).
- **V9** That a world's Task Board Unlocks column needs that world's Task Board open (M20 V7's quest signals), and what the W2-late account sees in the W2 column today. Agent task (N.js Task Board UI); until then FR-14 step 1 assumes it does, which is the safer wording (it names one more step, never one too few).
- **V10** That one Task Board unlock costs one unlock point (`unlockPointsOwned` minus `unlockedRecipes` = unspent: 2 on W2-late, 10 on W3-early). Agent task (N.js or Toolbox `getPointsReq`).

### 11.5 Build notes (Phase 1 build, 2026-10-18)
- **V5 settled.** The craft check is `Lv0[2] >= ItemToCraftEXP[tab][n][0]` on the logged-in character (N.js @5356030): the crafter's own Smithing level. FR-16 stands. Recipe numbers and LVs agree with N.js `ItemToCraftNAME` / `ItemToCraftEXP` (V8); crafting Copper Platebody and Platelegs sets the next recipe to 0 (N.js @6964661, F-c's `on-craft`).
- **V6 for the owner.** The hire button sets `OLA[380] = 1` once `PermaUnlockAfford` is 1 and deducts nothing (N.js @12680370), so hiring looks free; one look in game confirms.
- **V7 settled.** `GetSetBonus("PartsOn")` reads the logged-in character's `EquipmentOrder`, and a hired Smithy adds a fully worn set to `OLA[379]` (N.js @11088373). The register line says "wear it all, log in, tap a piece".
- **V9 settled, and it changes FR-14 step 1.** A world's Unlocks column opens when the account owns that world's anvil tab and has unlocked enough recipes in all (N.js `TaskStuff("UnlockColumnsOpened")` @6598822: tab 2 and 7 unlocks for W2, tab 3 and 22 for W3), not on a quest. So the W2-late weapons start with "Craft Anvil Tab 2 to open the W2 Task Board unlocks", and the Squire Lv 85's Ice Breaker with "Craft Anvil Tab 3 to open the W3 Task Board unlocks" (its anvil tab 3 is the bottleneck either way). A contract test checks the rule on every public save.
- **V10 settled.** Toolbox counts `unlockedRecipes` as the sum of the 0/1 flags, one per unlock row; unspent = owned − unlocked.
- Ids: entries must start with their System, so the registry System is `gear` (M17 named it `equipment`), and the next-piece entry is `gear.check.next-piece` (a check: it has no Milestone ladder). The Gear Plan is the authored fact `gear.fact.plan` (no item shape in a Priority List, the M15 C4 precedent).
- Size: held copies are judged at their base stats; an item's stats are stored once per rawName (TR-2's guard moved to 340 KB).

## 12. Phased build plan

| Phase | Ships | Why first |
|---|---|---|
| **1** (after M17 Phase 1, alongside M19; build order in the spec index) | F1 the facts and the Gear Plan; F2 slot states, held gear, empty slots, the AFK tool; F3 the next piece with M14 Walkthroughs; F4 the Smithy; F5 the Gear tab, the Gear page and the Smithy page; the two Stage Expectation rows | Uses only built modules (M1, M2, M6, M10, M11, M14, M17) and fills an atlas top-5 gap with data Toolbox already parses |
| **2** | Upgrade stones on kept pieces; class Lv 40 skilling pieces for skilling presets (with M9); Efaunt and Chizoar Walkthroughs; Dementia vs Amarok by measured kill rates on the frontier (M2's clone, when Toolbox can price it) | Needs the Gear Plan's kept pieces, M9's presets, or numbers Toolbox doesn't compute yet |

## Sources

- IdleOn Wiki, opened 2026-10-18: [Tips and Tricks](https://idleon.wiki/wiki/Tips_and_Tricks) (last edit 2025-12-24), [Smithing](https://idleon.wiki/wiki/Smithing) (2026-10-05), [Smithing/Anvil Tab 1](https://idleon.wiki/wiki/Smithing/Anvil_Tab_1), [Tab 2](https://idleon.wiki/wiki/Smithing/Anvil_Tab_2), [Tab 3](https://idleon.wiki/wiki/Smithing/Anvil_Tab_3) (2026-10-07), [Tasks/Unlocks](https://idleon.wiki/wiki/Tasks/Unlocks) (2026-10-07), [Helmets](https://idleon.wiki/wiki/Helmets), [Shirts](https://idleon.wiki/wiki/Shirts), [Pants](https://idleon.wiki/wiki/Pants), [Shoes](https://idleon.wiki/wiki/Shoes) (2026-09-13), [Weapons](https://idleon.wiki/wiki/Weapons) (2026-10-03), [Tools](https://idleon.wiki/wiki/Tools) (2026-10-03), [Rings](https://idleon.wiki/wiki/Rings) (2026-09-14), [Pendants](https://idleon.wiki/wiki/Pendants) (2026-10-14), [Chaotic Amarok Pendant](https://idleon.wiki/wiki/Chaotic_Amarok_Pendant) (2026-09-12), [Set Bonuses](https://idleon.wiki/wiki/Set_Bonuses) (2026-10-07), [Equipment Sets](https://idleon.wiki/wiki/Equipment_Sets) (2026-09-23), [Frostbite Tundra](https://idleon.wiki/wiki/Frostbite_Tundra) (2025-07-21), [Upgrades](https://idleon.wiki/wiki/Upgrades) (2026-09-13), [Changelog/2025](https://idleon.wiki/wiki/Changelog/2025) (2026-10-08), [Changelog/2026](https://idleon.wiki/wiki/Changelog/2026) (2026-09-27).
- Reddit r/idleon (dated community posts, tier 3): 1w2v0m0 (2026-08-31), 1v59wcs (2026-07-24), 1vbovov (2026-08-01), 1ufprom (2026-06-26), 1symnnq (2026-04-30), 1qdkpnh (2026-01-15), 1vlwxx5 (2026-08-12), 1smbq2e (2026-04-15), 1lq3xp3 (2025-07-02), each linked in section 11.3.
- IdleOn AutoReview `mysite/w3/armor_sets.py` and `consts/progression_tiers.py` L1725–1747 @ 05ac449 (2026-09-23): cited for the Smithy unlock rule and as context only. Nothing is copied (no licence).
- Toolbox parsers and data @ `6c37e3d`: `character.ts`, `items.ts`, `damage.ts`, `world-3/armorSmithy.ts`, `tasks.ts`; `website-data/items.json`, `crafts.json`, `taskUnlocks.json`, `shared-data.json` (`equipmentSets`).
- System Atlas (design lab, 2026-10-18, private): entries "Equipment", "Tools", "Upgrade stones", "Smithing crafting and Anvil tabs", "Armor Smithy". Design Lab v2 (`character.gear.paper-doll`, `character.gear.upgrade-path`) and its critique.
- Fixture reads (aggregates only): both private fixtures and the 11 public saves, 2026-10-18.
