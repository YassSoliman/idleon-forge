# M14 Walkthroughs & Slot Plans

Spec for the owner's request of 2026-10-17 ("every Goal like the Post Office should come with a step-by-step walkthrough … and advise which chars to put where at any given time"), plus Joseph's 3D Printer point, part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **draft, red-teamed** (section 10). Open questions for the owner are in section 8, each with a recommended answer. Terms follow [GLOSSARY.md](../../GLOSSARY.md); decisions follow [ADRs 0001–0008](../adr/).

**Inputs this spec is built from:**
- The specs it builds on: M2 (frontier rates, pusher, Roles, `compareGoals`), M3 (AFK safety, `dropRate`, anvil, `printer.check.sample-blank`), M4 (Purpose, Contributions, the quest-item follow-up in its red-team note 10), M5 (reachability, `leverage/survivable`, one Move per destination), M6 (`post-office.check.unlock`), M8 (stamp routes, the holdings rule TR-6), M10 (Goal cards), M11 (schema, generators, `PARALLEL_SLOTS`, the illustrative `construction.goal.printer-*` ids).
- Toolbox game data at the pin (`packages/toolbox-parsers/UPSTREAM`, `6c37e3d`, game 2.3.540): `crafts.json`, `quests.json`, `monsterDrops.json`, `monsters.json`, `items.json`, `shared-data.json` (`mapNames`, `mapEnemiesArray`, `anvilProducts`, `liquidsShop`, `shops`, `npcPlacements`), and the vendored parsers `items.ts` (`flattenCraftObject`, `getAllItems`), `character.ts` (`getDropRate`), `world-1/anvil.ts`, `world-3/printer.ts`.
- The game code `N.js` (build of 2026-10-17), read for three mechanics Toolbox does not compute: the drop roll (`_customBlock_DropOdds`), the 3D Printer sample rule, and the re-sample rule. Each is cited where it is used.
- The IdleOn Wiki pages [3D Printer](https://idleon.wiki/wiki/3D_Printer) (edited 2026-10-14), [Anvil](https://idleon.wiki/wiki/Anvil), [Empty Box](https://idleon.wiki/wiki/Empty_Box), [Anvil Tab 2](https://idleon.wiki/wiki/Anvil_Tab_2), [Alchemy#Liquid Shop](https://idleon.wiki/wiki/Alchemy#Liquid_Shop), [Fishing](https://idleon.wiki/wiki/Fishing), and the skills dossier on `research/skills` (fish pools, tree maps).

Every number in sections 4 and 11 was measured on 2026-10-17 at the pin, on the two private fixtures (local only), described by account, class and level. Kill rates are Toolbox `finalKillsPerHour` from `toolboxCalls.frontierRates(parsed, map)`; drop rates are Toolbox `getDropRate`.

## 1. Purpose

When a Goal needs things the player doesn't have yet (a quest hand-in, an unlock item, a better tool or piece of gear), M14 turns it into a **Walkthrough**: where to go (world, map, NPC), everything it needs as a **Requirement Tree** down to raw materials, how much of each the account already holds, where each missing material comes from and how long it takes at this account's own kill and drop rates, which character should farm what so the work runs in parallel without breaking AFK safety or the pusher's push, and the steps in order with progress on each. Underneath, one account-wide **Demand** (what every Walkthrough still needs, netted against storage, bags and chests) feeds a **Slot Plan** for the Parallel Slots, starting with the 3D Printer: what each character should print, which sample to keep, how to take a new one, and when to swap. The player never types anything in; every fact comes from game data and the save, every judgment from authored entries.

## 2. Scope / Out of scope

**In scope (all phases; section 12 says what ships when)**
- A **requirement expander**: from a target (a quest, a craftable item, an anvil tab, a gear piece) to a tree of items, quantities and gates, using generated recipes, quest requirements, anvil production, Forge smelting and shops, recursively, with cycle protection.
- **Holdings**: what the account holds of each item, by place (storage, refinery storage, the Forge's output slots, each character's inventory), as of the save, with stale-save caveats.
- **Supplies**: every way to get a missing item (monster drop, skilling node, anvil production, Forge, town shop, Liquid Shop, 3D Printer, chest or crystal mob as Active Play), with the place and, where Toolbox allows, the rate for each character.
- **Effort**: expected kills and hours per Supply from Toolbox kill and drop rates (plain arithmetic, ADR 0005).
- **Demand** across every active Walkthrough, with holdings given to the higher-ranked Goal first.
- The **Bottleneck** of each Walkthrough, and the rule that starts it first, even before an earlier gate opens.
- An **assignment planner**: one farming job per character per AFK Stretch, within M3's AFK safety, M2's pusher and Roles, and M5's reachability and survivability rules.
- The **Walkthrough view**: ordered steps with progress, under the Goal card it belongs to (M10 renders).
- The **printer Slot Plan** (Phase 1), and the same pattern for cauldrons, traps, cog seats and worship later (Phase 3).
- **Gear walkthroughs** (Phase 3): equipment recipes and upgrade stones, on authored gear Goals.
- Knowledge Base entries: generated item Acquisitions and fact tables, authored Supply judgment, one Contribution so an assigned character reads as serving its Purpose.

**Out of scope**
- **Choosing which Goals matter.** M2's Priority Lists rank Goals; M14 only breaks a Goal that already exists into steps. A Walkthrough never raises a Goal's position.
- **Choosing which gear to aim for.** Which weapon or armour a class line should craft next is authored judgment (a gear Priority List, Phase 3, owned with M9); M14 only expands the chosen piece.
- **Skilling rates from formulas.** Toolbox computes no resources per hour (#16, M4 FR-6). Skilling Supplies are yes/no in Phase 1; Q4 proposes rates observed from save history for Phase 2.
- **Upgrade-stone success odds and stat optimisation.** Phase 3 lists where stones come from, never which stat to roll.
- **Moving a character for anything other than a Walkthrough's Demand.** That stays M5 Higher-leverage options.
- **Writing to the game.** Like every Mod, M14 only reads; every step is something the player does.
- **Lab, Cooking, Breeding, Divinity, W5+ Supplies.** Shown as "Not covered yet" when a tree needs them.

## 3. Functional requirements

### Requirement Trees

- **FR-1 Targets.** A Walkthrough exists for any Goal or Check entry that names a target Acquisition in its new `walkthrough` field (TR-4), for example `post-office.check.unlock` → `quests.acquisition.postboy-pablob1`. Targets are quests (generated `quests.acquisition.*`), craftable items, anvil tabs and authored gear Goals. A Goal without a `walkthrough` field shows no Walkthrough; nothing is inferred from its text.
- **FR-2 Expansion.** M14 expands the target into a Requirement Tree from generated facts only (ADR 0007):
  - a quest's `requires` items with amounts, plus its gates (quest accepted on some character, `InventorySpacesNeeded`, the NPC's world reached);
  - an item's anvil recipe (`crafts.json`): inputs × amount, gates `lvReqToCraft` (Smithing level) and the recipe's anvil tab (FR-4);
  - an anvil-production material (`anvilProducts`, e.g. Chain Link): a production Supply with its Smithing level gate, not a recipe;
  - a Forge bar (`typeGen: bBar`): its ore, as a Forge Supply;
  - an item with no recipe: a leaf, sourced by FR-8.
  Quantities multiply down the tree (5 Empty Boxes × 400 = 2,000 Megalodon Teeth).
- **FR-3 Recursion and cycles.** Expansion stops at a leaf, at depth 6, or when an item reappears on its own path (a cycle). A cycle or a depth stop makes that node a leaf with `stoppedBecause: 'cycle' | 'depth'` and a diagnostic, never an error. The generator's CI test (TR-10) fails if any W1–W4 target's tree hits either, so a patch that adds a loop is caught in the parser-sync PR.
- **FR-4 Gates.** Gates are tree nodes that are met or not, never amounts: anvil tab owned (raw `CYAnvilTabsOwned` ≥ tab), Smithing ≥ `lvReqToCraft` on at least one character, the recipe unlocked where the save records it, quest accepted or acceptable (M8 FR-4's status rule), the NPC's world ≤ `currentWorld`, free inventory slots. An unmet gate whose own unlock is craftable (Anvil Tab 2) expands into its own subtree. A gate whose state the save does not expose is `unknown` and shown as "check in game", never assumed met.
- **FR-5 One entry per node.** Two branches that need the same item (two recipes both needing Iron Bars) are summed into one Demand line for that item, while the tree view keeps both branches (Toolbox `flattenCraftObject` sums the same way).

### Holdings and progress

- **FR-6 Holdings.** `holdingsOf(rawName)` follows M8 TR-6 (chest storage + refinery storage + every character's inventory, each once; equipped gear, tools, food slots and obol slots never count), plus the Forge's output slots, which Toolbox's `getAllItems` also counts. Each holding names its place ("in storage", "in the Forge: collect", "in the Squire Lv 43's bag"). Every node shows `held / need` and its missing amount.
- **FR-7 Stale save.** Holdings are as of each character's last save; storage is as of the cloud save. When a character assigned to a Supply has not saved for longer than the Expected Return, or holds unclaimed AFK gains (`secondsSinceLastSave` > 0 while on a supply map), the step shows "as of its last save: switch to it to claim". Material counts are never projected forward (drops are random; contrast M4 FR-9's kill projection). M1's parser-behind banner adds "may be out of date" to every Walkthrough number.

### Supplies and effort

- **FR-8 Supplies.** For each missing leaf, M14 lists every Supply the generated tables know, each with world, map and NPC or monster names:
  - **drop:** a monster on an AFK-able fighting map (`monsters.json` `AFKtype: FIGHTING` with a `mapIndex`, not in Toolbox's boss, colosseum and quest exclusion list), with `effectiveChance` and quantity from `monsterDrops.json`;
  - **skill node:** a Mining, Choppin, Fishing or Catching node, with its map and its depth or efficiency gate (authored fact table, TR-5);
  - **anvil production**, **Forge smelt**, **town shop** (M8 TR-8 rules), **Liquid Shop** (W2 Alchemy, paid in Water Droplets), **3D Printer** (a stored or active sample of that item, FR-25), **recipe** (the item is crafted, FR-2);
  - **Active Play only:** crystal mobs, chests, bosses and colosseums. These are listed under "other ways" and never assigned to an AFK character.
- **FR-9 Already farming.** A Supply that a character is already on (its AFK Target is the Supply's monster or node, or its active printer sample is the item) is marked "already farming" and counts toward the Walkthrough's progress rate without any move.
- **FR-10 Drop effort.** For a drop Supply and character *c*: expected kills = missing ÷ (`effectiveChance` × quantity × `dropRate_c`), and hours = kills ÷ `finalKillsPerHour_c` on that map. Several characters on Supplies of the same item: hours = missing ÷ Σ (`finalKillsPerHour_i` × `effectiveChance_i` × quantity × `dropRate_i`). `dropRate_c` is Toolbox `getDropRate` on the character moved to that map (shrines make it map-dependent). Gems and Time Candy use `dropRate^0.2` per N.js and are never Walkthrough leaves. The result is a mean, labelled "about … on average", never a bound (M4 red-team note 11). For drops from a nested drop table (e.g. Distilled Water through `DropTable14`), the drop rate is applied once, which can only overstate the hours; the line says "at most about" (TR-7).
- **FR-11 Other effort.** Anvil production: hours = missing ÷ (Toolbox `getPlayerAnvil` `anvilSpeed` ÷ the product's `requiredAmount`), per hammer, the same quantities Toolbox's `getTimeTillCap` uses. Printer: hours = missing ÷ Toolbox printer `boostedValue` per hour. Liquid Shop: the Water cost of N purchases today from `liquidsShop` base cost and growth (Q6), checked against the Water held. Skill nodes, Forge smelting and shops: no hours in Phase 1, only the gate ("Fishing efficiency 50 needed for Hermit Cans"; "costs coins").
- **FR-12 Reachability and safety per character.** A drop Supply is offered to character *c* only if the map is in M5 TR-4's `reachableFightingMaps(c)` and M5 TR-8's `leverage/survivable` passes (survivability ≥ 95%, or no worse than *c*'s current map). A Supply nobody can reach yet is shown with the gate that opens it ("W3: open Frostbite Tundra first"), never as a step.

### Demand and the Bottleneck

- **FR-13 Demand.** Demand is the sum, over every Walkthrough whose parent Goal is shown on the Now screen this run (any Stage position, including "show more"), of each node's missing amount. Holdings are given out in the parents' `compareGoals` order (M2 TR-14): the higher-ranked Goal takes what it needs first, then the next one. A lower Goal never counts teeth a higher Goal has already claimed.
- **FR-14 Jobs.** Each missing leaf with an AFK-able Supply becomes one **job**: (item, amount, Supplies). Craft, hand-in, buy, collect and unlock steps are not jobs; they are steps a player does in a Play Session.
- **FR-15 Bottleneck.** A Walkthrough's Bottleneck is its job with the longest expected hours at the best single assignment (FR-17). A job with no rate (a skill node) is the Bottleneck when its missing amount is at least the entry's authored `values.unratedBottleneckAt` (default 500 items), because a large unrated gather is the usual long pole; otherwise it ranks after every rated job. Ties go to the deeper node, then the lower item index.
- **FR-16 Start early.** A job whose material is needed only behind an unmet gate (Megalodon Teeth for Empty Boxes, behind Anvil Tab 2) still starts now when it is the Bottleneck or when a character is free for it. The step says why: "Start now: it's the slowest part, and the boxes need it once Anvil Tab 2 is done."

### Assignment

- **FR-17 One job per character.** The planner gives each character at most one job per AFK Stretch. Jobs are taken in order: Bottleneck of the highest-ranked Walkthrough first, then by hours, longest first. Each job gets the eligible character that finishes it soonest, with these preferences, in order:
  1. a character already on one of its Supplies (FR-9): it stays, no move;
  2. a character whose M4 Purpose is `exhausted`, `none` or `no-activity` (never `cannot-tell`: the data can't say it is idle); until M4 ships, a character whose current activity no shown Goal names;
  3. any other eligible character, shown with "this moves it off <current activity>".
  Ties go to the lower survivability margin that still passes (the weakest character that clears the map comfortably keeps stronger ones free), then the lower index.
- **FR-18 Never eligible.** A character is never assigned a job that moves it when:
  - it is M2's pusher and its current activity serves the push Goal (M5 FR-7);
  - its AFK Target is `LABORATORY` (M5 FR-6's Lab-chain rule; M14 never computes Lab removals);
  - it holds an active M2 Role whose AFK type is its current activity, unless the job's Supply is that same activity;
  - M3 shows it a blocker that the move would not fix (M5 TR-8: the Fix comes first);
  - the Supply fails FR-12.
  A character that can only take a job by breaking one of these gets none, and the job waits with "no free character: next Play Session".
- **FR-19 One job per destination.** At most one character is moved onto each map by the planner, as M5 FR-10 rules for Moves, unless one character cannot finish the job within the Expected Return; then a second is added, and so on, while each added character still cuts the hours by at least 25% (M5 D1's `clearMargin`).
- **FR-20 Parallel Slots.** Anvil production and printer jobs run on a character's Parallel Slot, alongside its AFK Target, so they never use up the character's one AFK job. Anvil jobs name the hammer to switch ("switch one hammer from Thread to Chain Link"); M3's anvil cap Checks still run on the result.
- **FR-21 Assignments on the Now screen.** An assignment that moves a character is a Next Action on that character's row ("Move to The Mimic Hole: Megalodon Teeth for the Post Office"), ranked at its parent Goal's position, only when preference 2 applies or the parent outranks every Goal the character serves now (Q5). Otherwise it stays inside the Walkthrough. It counts against the 3-Goal cap like any Next Action. Once the character is on the Supply, the M4 Contribution `walkthrough.contribution.supply` (TR-4) makes that activity a worthwhile Purpose line, so the move never turns a Ready Verdict into Unknown.

### The Walkthrough view

- **FR-22 Steps.** A Walkthrough is an ordered list of steps: farm (a job), produce (anvil or printer), buy, collect, smelt, level a skill to a gate, craft, unlock, withdraw, hand in. Order: every step whose inputs are ready ("now"), Bottleneck first; then steps that wait on others ("after"), in tree order from the leaves up; the hand-in last. Each step shows who does it (class and level, joined to names only in the UI, M4 TR-9), where (world · map · NPC or monster), its progress (`held / need`), and its effort (FR-10, FR-11). Done steps stay, ticked, until the Walkthrough completes.
- **FR-23 Where it shows.** The Walkthrough is attached to its parent Goal's card (M10 TR-2 `Goal.walkthrough`). Collapsed, the card shows one line: "Steps 2 of 9 · slowest: Hermit Cans". Expanded, it shows the steps (FR-22), then the Requirement Tree as an indented list, then "other ways" (FR-8 Active Play Supplies). It is account-level: one Walkthrough per target, never repeated on each character's row (#70 A5); character rows get only their own FR-21 assignment.
- **FR-24 Done and dismissal.** A Walkthrough is done when its parent's own done rule fires (e.g. `doneWhen` on `post-office.check.unlock`). Skip today and Not for me act on the parent Goal (M10); an assignment Next Action has its own key `walkthrough@<target>#<item>@c<index>` so dismissing a move doesn't hide the Walkthrough.

### Printer Slot Plan

- **FR-25 Printer facts.** Per character, from Toolbox's printer parser and the save: whether it has a printer player slot (the 3D Printer's building level gives one slot per level, wiki; M2 `buildings.printer3d`), its Printer Sampling talent level, its sample size % (`printerSample`), its stored samples (5 base slots plus extra ones, N.js `PrinterSampleSlots`) and its active samples (1, or 2 with the Crystal 3D Printer from the Gem Shop), each with Toolbox's `boostedValue` per hour.
- **FR-26 What can be sampled.** A sample is always of the activity the character is AFK on when the talent is used (N.js): for a fighting map, the first of the monster's first four drop rows that is not coins, not a card and not quest-linked (Mimic → Megalodon Tooth; Gigafrog → Bullfrog Horn); for a mining or choppin node, its ore or log. Items behind a drop table (Distilled Water) can never be printed. The sampleable item per monster is a generated fact (TR-5) so a patch that reorders drops re-syncs.
- **FR-27 What to print.** For each character with a printer slot, the plan picks at most one change per Play Session:
  - **swap to a stored sample** of a Demand item, when its `boostedValue` would cover more of the Demand than the active sample does (the active sample's item is not in Demand, or is covered): "In the 3D Printer, set the Squire Lv 51's active sample to Iron Ore (stored, ~219/h)";
  - **take a new sample** of a Demand item that no stored sample covers: on the character the planner already sends to that Supply (FR-17), if it has the talent and a slot; otherwise on the highest-sample-% character with the talent that can reach the map, as a short visit ("visit The Mimic Hole, use Printer Sampling from the attack bar, then go back");
  - **keep** otherwise. The plan never suggests replacing an active sample unless a Demand item takes its place (Q7).
  Demand items are ranked by their Walkthrough's parent position, then by missing hours.
- **FR-28 Sample size.** A new sample's size is shown only when TR-7's prediction test passes on the fixtures; until then the step says "sample size shows in the printer once taken". Re-sampling an item keeps the larger of the old and new sample (N.js), so "re-sample after a level-up" is never harmful; the plan suggests it only when a prediction exists and is at least 25% larger.
- **FR-29 When to swap back.** When the Demand for the printed item is covered (holdings ≥ need), the plan marks the sample "covered" and offers the next Demand item, or keeps it if none. It never tells the player to swap back to the old sample for its own sake.
- **FR-30 Gates and hand-offs.** No printer slot free: the plan names the building ("3D Printer Lv 4: 4 of 6 characters can print; Construction raises it"), linking `construction.goal.printer-cruncher-arm` when that Goal exists. No Printer Sampling talent: "Printer Sampling (Star Talent tab 2) is at 0 on this character". A blank active sample is M3's `printer.check.sample-blank`; M14 only supplies the item that Next Action names ("Fill the blank printer sample: Megalodon Tooth from The Mimic Hole"), so the two never show twice.

### General

- **FR-31 Sources.** Each step links the IdleOn Wiki page for its item, monster, map or NPC (generated wiki links, verified to exist at generation, TR-9), per #74. Tier-1 numbers render as "Calculated by IdleOn Toolbox · 2.3.540", unlinked.
- **FR-32 Determinism.** Same Account State, history, Knowledge Base, Expected Return and `now` give byte-identical Walkthroughs and Slot Plans.
- **FR-33 Fail closed.** A node, Supply or rate that reads an unknown field (`isKnown` false, a failed section, a `null` field) drops to "can't tell" with a diagnostic; a Walkthrough with an unknown holding never claims a step is done, and an unknown rate never wins an assignment. `EmptyAccountError` produces no Walkthrough at all.

## 4. User stories

Fixtures: the **W2-late account** (5 characters, highest Lv 60, Stage W2-late) and the **W3-early account** (6 characters, highest Lv 85, Stage W3-early), parsed at the pin. Numbers marked ‡ are pre-registered expectations measured with the vendored Toolbox on 2026-10-17; the first engine run must land within ±5% of each before a golden is recorded (M4's rule).

**US-1 The Post Office, before Anvil Tab 2 (W2-late).** As a player in a Play Session, I want the Post Office Goal broken into steps with my own numbers, so that I can start the slow parts today.
- **Given** the W2-late account: the Barbarian Lv 60 has Postboy Pablob's quest accepted (status 0); `CYAnvilTabsOwned` = 1; storage holds 525 Megalodon Teeth, 2 Distilled Water, 0 Hermit Cans, 19 Iron Bars (+66 in the Forge), 18 Chain Links, 1,533 Jungle Logs, and the Squire Lv 43 carries 8 Bullfrog Horns; nobody has Fishing above Lv 1; Water Droplets are at their cap of 32
- **When** the engine runs
- **Then** the Post Office Goal's Walkthrough shows the tree: quest → 5 Empty Box (Anvil Tab 2, Smithing 15) → 1,250 Hermit Can (0 held), 2,000 Megalodon Tooth (525), 20 Distilled Water (2); gate Anvil Tab 2 (not owned) → 100 Iron Bar (85, incl. the Forge's 66), 100 Chain Link (18), 100 Jungle Logs (✓ 1,533), 100 Bullfrog Horn (8).
- **And** the Bottleneck is Hermit Cans (1,250 unrated ≥ 500, FR-15), and Megalodon Teeth start now although Anvil Tab 2 isn't done (FR-16).
- **And** the steps, in order, are:
  1. Buy Distilled Water at the Liquid Shop (W2 Alchemy): 18 needed, about 8 a day with Water capped at 32 (Q6), so 3 days; it also spends the Water that M3 flags as at cap.
  2. Send the Shaman Lv 44 to Salty Shores (W2) to fish: Hermit Cans need Fishing efficiency 50 (depth 2); no rate shown (skilling).
  3. Send the Bowman Lv 54 to The Mimic Hole (W2): 1,475 Megalodon Teeth ≈ 3,900 kills at 21.2% × 1.78 drop rate, about 2.6 h at 1,496 kills/h‡.
  4. Send the Wizard Lv 56 to Tucked Away (W1): 92 Bullfrog Horns ≈ 370 kills at 14% × 1.78, about 0.3 h at 1,252 kills/h‡.
  5. Switch one anvil hammer to Chain Link on any character (Smithing 17 ✓): 82 needed, about 1.5 h per hammer (anvil speed 38,790 ÷ 700‡).
  6. Collect 66 Iron Bars from the Forge and smelt 15 more from the 4,276 Iron Ore in storage.
  7. *(after 3–6)* Craft Anvil Tab 2 (Smithing 15) with all four materials in the crafter's bag.
  8. *(after 1–3, 7)* Craft 5 Empty Boxes: the first craft needs 250 Hermit Cans, 400 Teeth and 4 Water in the crafter's bag (wiki: first craft from inventory).
  9. *(after 8)* Hand the 5 Empty Boxes to Postboy Pablob in YumYum Grotto on the Barbarian Lv 60.
- **And** the Barbarian Lv 60 is never assigned (it is M2's W2-late pusher), the Squire Lv 43 is not moved off Copper (its Purpose is serving a Mining door, FR-17 preference 2 has candidates), and each of the Shaman, Bowman and Wizard gets one job.

**US-2 The Post Office, nearly there (W3-early).** As a player in a Play Session, I want ActiveOn to notice which characters already farm what I need, so that I move as few characters as possible.
- **Given** the W3-early account: the Squire Lv 85 (the pusher, on Thermonuclear Climb) has the quest accepted; Anvil Tab 2 is owned; holdings are 1,966 Hermit Cans, 1,010 Megalodon Teeth, 11 Distilled Water; the Wizard Lv 73 fights Sir Stache on The Stache Split; Water Droplets are at about 92
- **When** the engine runs
- **Then** Hermit Cans show ✓ (1,966 of 1,250); the Bottleneck is Distilled Water (9 missing).
- **And** "already farming" marks both the Wizard Lv 73 (Sir Stache drops Distilled Water at 0.0068%‡ × 2.29) and the pusher (Thermister, 0.00825% × 2.18), together about 0.34 per hour, so at most about 27 h by drops‡; the first step is the Liquid Shop instead: 9 Distilled Water for about 43 Water, affordable today (Q6).
- **And** the Shaman Lv 54 (on Sand Castle, where the Death Note pays nothing at building Lv 0, M4 US-3) goes to The Mimic Hole: 990 Teeth ≈ 2,130 kills at 21.2% × 2.19, about 2.4 h at 895 kills/h‡. The Barbarian Lv 56 is not moved (it holds the active Fishing Role on its current activity, FR-18), and the pusher is not moved (FR-18).
- **And** the last steps are: craft 5 Empty Boxes (any character with Smithing ≥ 15; the Shaman's 13 is too low), then hand them in on the Squire Lv 85.

**US-3 The printer feeds the Demand (W3-early).** As a player in a Play Session, I want to know what each character should print, so that the printer works on what my Goals need.
- **Given** the W3-early account: the 3D Printer is Lv 4; the Wizard Lv 73, Squire Lv 51, Bowman Lv 60 and Squire Lv 85 print Forest Fibres (~18/h), Copper Ore (~219/h), Wakka Cherry (~15/h) and Spore Cap (~38/h); the Barbarian Lv 56 and Shaman Lv 54 have Printer Sampling at 0; the Demand from US-2 holds 990 Megalodon Teeth; nobody has a stored Megalodon sample
- **When** the engine runs
- **Then** the Slot Plan proposes one change: the Bowman Lv 60 (Printer Sampling 100, sample size 18.6%, the highest with a slot) visits The Mimic Hole, uses Printer Sampling and sets the new sample active in place of Wakka Cherry, which no Demand needs. The Shaman, who will farm there, can't sample (talent at 0).
- **And** no other character's sample changes (their items are not in Demand, FR-27 "keep").
- **And** the sample size reads "shows in the printer once taken" until TR-7's prediction test passes.
- **Given** the Demand for Teeth is covered on a later save
- **Then** the Bowman's sample shows "covered" and, with no other Demand item, "keep" (FR-29).

**US-4 No printer yet (W2-late).** As a player in a Play Session, I want the printer plan to stay quiet until I have a printer, so that it doesn't add noise.
- **Given** the W2-late account (no 3D Printer: World 3 not reached)
- **When** the engine runs
- **Then** no Slot Plan shows, and Walkthrough Supplies never offer "printer".

**US-5 A Supply nobody can reach (W2-late).** As a player in a Play Session, I want to see drops I can't reach yet without being sent there, so that I'm not told to walk into World 3.
- **Given** US-1's state
- **When** the Distilled Water node is expanded
- **Then** "other ways" lists the W3 drops (Sheepie, Frost Flake, Sir Stache, …, "open Frostbite Tundra first") and Crystal Cattle (crystal mob, Active Play), and none of them is a step.

**US-6 A cycle or a patch.** As a player in a Play Session, I want a broken recipe never to give me a wrong plan, so that I can trust the steps.
- **Given** a test Knowledge Base where item A's recipe needs B and B's needs A
- **When** the engine runs on a Walkthrough reaching A
- **Then** the node shows "can't expand this (recipe loop)", a diagnostic is recorded, and the rest of the Walkthrough still shows. The generator's CI test fails on the same input.
- **Given** a save where `CYAnvilTabsOwned` is missing
- **Then** the Anvil Tab 2 gate reads "check in game", and step 7 never shows as done.

**US-7 Broken save.** As a player in a Play Session, I want no Walkthrough when the save can't be read, so that I never act on invented numbers.
- **Given** an `EmptyAccountError`, or a save whose `storage` section failed
- **Then** there is no Walkthrough (empty account), or every holding shows "can't tell" and no step is ticked (failed storage).

## 5. Technical requirements

**TR-1 Package boundaries.** The engine part lives in `packages/engine/src/walkthrough/` as pure functions (no I/O, no clock, no randomness): `expand.ts` (trees), `holdings.ts`, `supply.ts`, `demand.ts`, `plan.ts` (assignment), `slots/printer.ts`. It imports only types from `@idleon-forge/account-state`, compiled entries from `@idleon-forge/knowledge`, `compareGoals` from M2 and `leverage/survivable` from M5 (or its rule, TR-11). It never imports `toolbox-parsers`. The worker part (supply rates, TR-3) lives in `packages/account-state/src/supply.ts` and receives `toolboxCalls` by injection, like M2's frontier. Detectors live in `packages/knowledge/detectors/walkthrough/`.

**TR-2 Account State additions** (M1 TR-11 growth; each `null` when its section fails):

```ts
interface AccountSummary {
  /** Raw CYAnvilTabsOwned: anvil tabs unlocked for every anvil. */
  anvilTabsOwned?: number | null;
  /** Items in the Forge's output slots (bars), as Toolbox's getAllItems counts them. */
  forgeOutput?: { rawName: string; amount: number }[] | null;
  /** Liquids held now, index 0 = Water Droplets (Toolbox alchemy.liquids). */
  liquids?: number[] | null;
  /** Worker-computed rates on the supply maps (TR-3). */
  supplyRates?: SupplyRates | null;
  printer?: PrinterState | null;
}
interface CharacterState {
  /** Unequipped inventory stacks (rawName, amount); 'Blank' removed. M8 TR-15 already needs it. */
  inventoryItems?: { rawName: string; amount: number }[] | null;
  smithingLevel?: number | null;
  fishingEfficiency?: number | null;     // Toolbox getSkillEfficiency('fishing'); Phase 2
}
interface PrinterState {
  level: number;                          // buildings.printer3d (M2), restated for one read
  characters: {
    characterIndex: number;
    samplingLevel: number;                // PRINTER_SAMPLING star talent level
    samplePct: number;                    // Toolbox printerSample
    stored: PrinterSample[]; active: PrinterSample[];
  }[];
}
interface PrinterSample { rawName: string; value: number; perHour: number } // perHour = Toolbox boostedValue
```

Account storage (`account.storage.list` from Toolbox, by rawName) is read through the adapter as `account.storageItems: { rawName: string; amount: number }[] | null`, shared with M8 (M8 TR-6 reads the same field).

**TR-3 Supply rates (worker).** After the parse and before the engine (inside the same parse response, as M5 TR-3), the worker computes `SupplyRates` for the **supply maps**: the fighting maps that host a drop Supply of any missing leaf of any Walkthrough target that is not yet done (quest status from the save; items from the generated `walkthrough.fact.supply-maps` table, TR-5), in worlds ≤ `currentWorld`, capped at `MAX_SUPPLY_MAPS = 12`, taking maps in the order of the generated table (W1 → W4, then map index) so the set never depends on device speed. For each map and each character with a level it calls `frontierRates(parsed, map)` and `getDropRate(onMap(c, map), account, characters)` inside the frozen clock, sharing Toolbox's damage cache.

```ts
interface SupplyRates {
  status: 'ok' | 'partial' | 'unavailable';
  maps: { mapIndex: number; rates: { characterIndex: number; finalKillsPerHour: number; survivability: number;
          hitChance: number; dropRate: number }[] }[];
  reachable: Record<number, number[]>;   // characterIndex → reachableFightingMaps (M5 TR-4), computed here first
}
```

When M5's sweep ships, maps it already covers are read from `hypotheticals` and not recomputed. `reachableFightingMaps` is built here first, to M5 TR-4's rules and contract tests, and M5 reuses it.

**TR-4 Knowledge Base entries.**

*Schema additions (M11, section 7):*
- `walkthrough?: EntryId` on Goal and Check entries: the target Acquisition (FR-1).
- Acquisition `methods[].requires` accepts `{ ref: EntryId, amount: number }` alongside the existing forms, so generated requirements carry quantities.
- Acquisition `methods[].kind?: 'drop' | 'skill-node' | 'anvil' | 'forge' | 'shop' | 'liquid-shop' | 'printer' | 'recipe' | 'quest' | 'active-play'`.
- Acquisition `thing.kind` gains `'quest'` (generated quest Acquisitions use `'other'` today).

*Generated (ADR 0007), by a new `items` generator plus the existing `quests` one:*

| Id | What | From |
|---|---|---|
| `items.acquisition.<slug>` | one per item reachable from any target, W1–W4: recipe (inputs × amount, `lvReqToCraft`, tab), anvil product (`requiredAmount`, `levelReq`), Forge bar (ore), shop rows (M8 TR-8 rule 5 for prices), Liquid Shop row, every drop row (monster, map, world, `effectiveChance`, quantity, `dropTablePath`) | `crafts.json`, `shared-data#anvilProducts`, `items.json` `typeGen`, `shared-data#shops`, `#liquidsShop`, `monsterDrops.json`, `monsters.json`, `#mapNames` |
| `quests.acquisition.<npc><n>` (exists) | `requires` now reference `items.acquisition.*` with amounts | `quests.json` |
| `walkthrough.fact.supply-maps` | per target, its drop-Supply maps, W1 → W4 | the two above |
| `printer.fact.sample-item` | per monster, the item a sample there gives (FR-26) | `monsterDrops.json` (first four rows) |
| `walkthrough.goal.<target-slug>` | one generated Goal per target, scope account, unit "steps", so the M4 Contribution has a Goal to point at | the targets |

*Authored (judgment and facts Toolbox lacks):*

| Id | What | Source |
|---|---|---|
| `skills.fact.nodes` | tier 2: skill nodes per map (trees, fish pools and depths with minimum efficiency, bug nodes) | skills dossier, wiki Choppin/Fishing/Catching |
| `anvil.fact.recipe-tabs` | tier 2 until a Toolbox field exists: each recipe's anvil tab and whether it is "start of the tab" or needs a recipe unlock | wiki Anvil Tab pages (bot data); verify-before-build |
| `walkthrough.contribution.supply` | Contribution, `goalFamily: walkthrough.goal`, Detector `walkthrough/supply`: the activity advances a Walkthrough when it is a Supply of an assigned or "already farming" job. `eta: kills-per-hour` for fighting; worthwhile while the job's item is missing | this spec |
| `walkthrough.check.assign` | the FR-21 Next Action text | this spec |
| `printer.check.slot-plan` | the FR-27 Next Action text; `construction.goal.printer-samples` is its Goal (the id M11's example list already uses) | wiki 3D Printer |
| `values.unratedBottleneckAt` | 500, on `walkthrough.contribution.supply` | judgment (Q4) |

Parents that opt in at Phase 1: `post-office.check.unlock` (M6), the gate-chain quests of M2 (`quests.goal.*`), M8's `stamps.check.quest-toward`, M4's `skills.goal.tool-*`. Each opt-in is a one-line `walkthrough:` edit in that module's YAML, reviewed in its Knowledge Base PR.

**TR-5 Detectors.**

| Detector | Reads | Returns |
|---|---|---|
| `walkthrough/expand` (engine) | target Acquisition, `items.acquisition.*`, gates from the Account State | `ReqNode` tree |
| `walkthrough/holdings` (engine helper) | `storageItems`, `characters[].inventoryItems`, `forgeOutput`, refinery storage | `Holding[]` per rawName |
| `walkthrough/supply` (Contribution) | the plan, the character's AFK Target, `printer` | advances yes/no, `etaMs` |
| `walkthrough/plan` (engine) | Demand, `supplyRates`, M2 `MetaPathInput`, M3 `AfkSafetyResult`, M4 `Purpose[]` (when present) | `Job[]` with assignees |
| `printer/slot-plan` (engine) | `printer`, Demand, `printer.fact.sample-item`, the plan | `PrinterSlotPlan` |

Each gets fires / doesn't-fire tests on both private fixtures (local) and the public and scrubbed fixtures (CI).

**TR-6 Engine types** (`packages/engine/src/walkthrough/types.ts`):

```ts
type Gate = 'anvil-tab' | 'smithing' | 'recipe' | 'quest' | 'world' | 'free-slots' | 'skill-efficiency';
type ReqNode =
  | { kind: 'item'; rawName: string; need: number; held: number; missing: number; holdings: Holding[];
      via: 'recipe' | 'leaf' | 'anvil' | 'forge'; children: ReqNode[]; supplies: SupplyEval[];
      stoppedBecause?: 'cycle' | 'depth'; unknown?: true }
  | { kind: 'gate'; gate: Gate; label: RenderedTemplate; met: boolean | null; children: ReqNode[] };
interface Holding { place: 'storage' | 'refinery' | 'forge' | `inv:c${number}`; amount: number }
interface SupplyEval {
  acquisitionId: string; method: number; kind: SupplyKind; afkable: boolean;
  where: { world: number | null; mapIndex: number | null; monster?: string; npc?: string; node?: string };
  perCharacter: { characterIndex: number; eligible: boolean; reason?: IneligibleReason;
                  killsNeeded: number | null; etaSeconds: number | null; alreadyFarming: boolean }[];
  bound: 'mean' | 'at-most-mean' | 'none';
}
interface Job { key: string; rawName: string; missing: number; supplies: SupplyEval[];
                assignees: number[]; etaSeconds: number | null; bottleneckOf: string[] }
interface WalkthroughStep {
  order: number; kind: 'farm' | 'produce' | 'buy' | 'collect' | 'smelt' | 'level' | 'craft' | 'unlock' | 'withdraw' | 'hand-in';
  when: 'now' | 'after' | 'blocked'; after: number[]; characterIndex: number | null;
  progress: { held: number; need: number } | null; etaSeconds: number | null;
  text: RenderedTemplate; sources: SourceRef[]; provenance: Provenance; done: boolean;
}
interface Walkthrough {
  targetId: string; parentKey: string; tree: ReqNode; steps: WalkthroughStep[];
  bottleneck: string | null; stepsDone: number; caveats: ('stale' | 'parser-behind' | 'unknown-holding')[];
}
interface PrinterSlotPlan {
  slotsUsed: number; slotsTotal: number;
  characters: { characterIndex: number; action: 'keep' | 'swap-to-stored' | 'take-sample' | 'none';
                item: string | null; replaces: string | null; mapIndex: number | null;
                reason: RenderedTemplate; covered: boolean }[];
}
interface WalkthroughResult { walkthroughs: Walkthrough[]; demand: { rawName: string; missing: number; byParent: { key: string; amount: number }[] }[];
                              jobs: Job[]; printer: PrinterSlotPlan | null; }
function planWalkthroughs(input: DeriveInput & { purposes: Purpose[] | null; safety: AfkSafetyResult; shownGoals: Rankable[] }): WalkthroughResult;
```

M10 TR-2 gains `Goal.walkthrough?: WalkthroughView` (steps, collapsed line, tree) and renders it (FR-23). Character rows get FR-21's Next Actions through the normal `Goal`/`NextAction` path.

**TR-7 Arithmetic and its checks (ADR 0005).** Every number is a Toolbox value or plain arithmetic on one:
- drop hours (FR-10): `effectiveChance` and quantity are game data; `finalKillsPerHour` and `dropRate` are Toolbox's. The linear use of the drop rate is the game's own (`_customBlock_DropOdds` multiplies the chance by `Drop_Rarity`); a contract test replays it on both fixtures against M3's `dropsPerHour` for the current map, and they must agree.
- nested drop tables apply the drop rate once (`bound: 'at-most-mean'`) until N.js shows whether the inner roll applies it again.
- anvil hours (FR-11) use `anvilSpeed ÷ requiredAmount`; a contract test checks it against Toolbox `getTimeTillCap` on both fixtures within 1%. If it fails, anvil jobs show no hours.
- sample-size prediction (FR-28): `samplePct × floor(finalKillsPerHour) × quantity × dropRate × printer multi` is shown only if, on both fixtures, it reproduces every active fighting sample's stored value within ±5%. Otherwise it is never shown. (This reproduces N.js's sample rule from Toolbox inputs; if it can't be matched, the rule is not ours to write.)
- Liquid Shop cost (FR-11, Q6).

**TR-8 Performance.** Worker supply step ≤ 120 ms p95 on `highend.json` with 12 maps (≈ 1.4 ms per character per map with the shared cache, M5 TR-10); engine `planWalkthroughs` ≤ 20 ms for 11 characters and 20 Walkthroughs; the generated `items` entries add ≤ 200 KB gzipped (they are indexed by rawName once per Knowledge Base load). Over budget means a reviewed change to `MAX_SUPPLY_MAPS` or the opt-in list, never a device-dependent cut.

**TR-9 Sources (#74).** Generated entries keep their tier-1 Toolbox Source. For the player link, the generator adds the IdleOn Wiki page of the item, monster, map or NPC (`https://idleon.wiki/wiki/<Display_Name>`), but only after checking through the MediaWiki API that the page exists; its last revision date sets tier 2 (after the current major) or tier 4. A missing page means no link, never a GitHub link. The check runs in the weekly parser-sync job and is cached in `generated/_wiki-pages.json`.

**TR-10 Generator tests.** For every W1–W4 target: no cycle, no depth stop, every referenced rawName exists in `items.json`, every drop map exists in `mapNames`. Hand-checked expected trees for `postboy-pablob1` (US-1's tree) and Anvil Tab 2 before merge. The parser-sync PR diff lists changed recipes and drop rows.

**TR-11 Reuse, not copies.** `holdingsOf` implements M8 TR-6 once, in `packages/engine/src/core/holdings.ts`; M8 imports it. `reachableFightingMaps` is M5 TR-4's, built in TR-3 first. The survivability rule is M5 TR-8's `leverage/survivable`, moved into `core/` so both modules call one function. Quest status uses M8 FR-4's rule.

**TR-12 Storage.** M14 stores nothing. Dismissals are M10's (FR-24 keys). Phase 2's observed skilling rates (Q4) read M1's `SaveHistory`.

**TR-13 Privacy.** Outputs carry character indices only; names are joined in the UI. No template has a name slot. Report this sends M13's `ReportContext` with the Walkthrough target id and step number, never holdings values unless "Attach the numbers" stays ticked (M13 D3). Nothing leaves the device.

## 6. States and edge cases

| State | Behaviour |
|---|---|
| Loading, empty account | No Walkthrough, no Slot Plan |
| Section failed (`storage`, `quests`, `printer`) | Holdings, quest gates or the Slot Plan read "can't tell"; nothing is ticked done (FR-33) |
| Stale character (unclaimed AFK gains) | "as of its last save: switch to it to claim" on its holdings and jobs (FR-7) |
| Game newer than the pin (M1 banner) | "may be out of date" on every number; generated trees may be wrong until the next re-sync |
| Quest accepted on several characters | The hand-in step goes to the one already carrying the items, then the one with free slots, then the highest level (M8 FR-10) |
| Quest accepted by nobody | First step: "accept the quest from <NPC> in <map>" on the highest-level character (M6 FR-26's rule) |
| Items in storage, hand-in needs the bag | A withdraw step names the amount and the character; carry capacity per M8 TR-6 ("needs N free slots: carry it in several trips") |
| First craft of a recipe | Materials must be in the crafter's bag (wiki Anvil); later crafts can use storage |
| A material needed by two Walkthroughs | One Demand line; holdings go to the higher-ranked parent first (FR-13) |
| Two Walkthroughs want the same character | One job per character (FR-17); the lower job waits or takes the next eligible character |
| Every eligible character busy | The job waits: "no free character: next Play Session" |
| Pusher already on a Supply | Counted as "already farming", never moved (US-2) |
| Supply only via Active Play (crystal mob, boss, chest) | Under "other ways"; never a step |
| Material from a W5+ system | "Not covered yet: <system>" on that node |
| Liquid Shop bought today | Cost assumes no purchase yet today (the save doesn't show the count, Q6); the line says "if you haven't bought any today" |
| Printer: no slot, no talent, Lv 0 printer | FR-30's gate line; US-4 when there is no printer |
| Multiple tabs, second account, offline | As M4 (pure, nothing stored, per-uid history) |

## 7. Dependencies

| Module | What M14 needs | Interface |
|---|---|---|
| **M1** | TR-2 fields; `isKnown`, `failedSections`; parser-behind | `AccountState` |
| **M2** | Stage list and `compareGoals` for the Demand order; pusher; Roles with `active` | `MetaPathInput` |
| **M3** | `AfkSafetyResult` (blockers); `dropRate` and `dropsPerHour` for the TR-7 test; anvil caps on anvil jobs; `printer.check.sample-blank` takes M14's item | `evaluateAfkSafety` |
| **M4** | `Purpose[]` for preference 2; adds the Contribution `walkthrough.contribution.supply` (closes M4 red-team note 10, quest-item farming) | `derivePurposes` |
| **M5** | `reachableFightingMaps` and `leverage/survivable` (built by M14 first, TR-11); one Move per destination is shared with FR-19 so M5 never proposes a Move onto a map M14 reserved, and treats an assigned character's job as a baseline Goal | `Hypotheticals`, a `reserved` map list |
| **M6** | `post-office.check.unlock` opts in (TR-4) | entry YAML |
| **M8** | holdings rule and quest-status rule (TR-11); `stamps.check.quest-toward` opts in | `holdingsOf`, entry YAML |
| **M9** | Printer Sampling must be on the attack bar to take a sample (M9's attack-bar facts); gear Priority Lists in Phase 3 | `talents.fact.*` |
| **M10** | `Goal.walkthrough` view and its expand/collapse | M10 TR-2 change |
| **M11** | schema additions (TR-4), the `items` generator, wiki-link check (TR-9), the fact tables | schema, generators |
| **M13** | Report this on a step | `ReportContext` |

## 8. Open questions for Yasser

❓ Q1 - Where this lives: a new module M14 "Walkthroughs & Slot Plans", or folded into M4 (Purpose already owns Goal ladders and Contributions), M5 (Moves) or M8 (Acquisitions and stamp routes)?
➡️ A new module, M14. M4 answers "what does this character's activity serve?", M5 "is there something better for this one character?", M8 "which collectibles can I get?". None of them owns "break this Goal into materials, and spread the materials across characters", which is account-wide and cuts across all three. M14 reuses each one's pieces instead of copying them: M8's holdings rule and quest status, M5's reachability, survivability and one-Move-per-map, M4's Contribution mechanism (so an assigned character reads as serving), and M2's ranking. Folding it into M4 would make M4's per-character Purpose account-wide; into M8 would make every Goal a "collection".

❓ Q2 - The glossary terms: Walkthrough (per-Goal steps), Requirement Tree, Demand, Supply, Bottleneck and Slot Plan, or fewer?
➡️ All six, as added to `GLOSSARY.md` in this PR. "Step Plan" was rejected because Goal already "shows exactly one Next Action" and "plan" is taken by Spend Plan; "Supply" avoids "Source" (a citation) and "route" (Visit Order's _Avoid_).

❓ Q3 - Build order: ship Phase 1 (Post-Office-style quest Walkthroughs plus the printer Slot Plan) right after M6, before M4, or after M5 as the last module?
➡️ Right after M6, as step 8 of the build order, before M4. It is the most-asked-for value and needs only M1–M3, M6 and M11, all on main. The two M4/M5 hooks (preference 2 and the Contribution) have stated fallbacks until those modules ship. Phases 2 and 3 come after M5.

❓ Q4 - Skilling pace: Toolbox computes no resources per hour. Keep skilling Supplies yes/no (Phase 1), or in Phase 2 show a rate observed from save history (Δ item count ÷ hours while a character sat on that node, over the last 30 days)?
➡️ Yes/no in Phase 1, observed rates in Phase 2, labelled "measured from your last N hours on this node". It is arithmetic on save data, not a formula (ADR 0005), and it is what makes Hermit Cans a measurable Bottleneck. Until then the authored 500-item threshold (FR-15) decides.

❓ Q5 - Should a planned move show on the character's own row as a Next Action, or only inside the Walkthrough?
➡️ On the row only when the character's Purpose is not serving, or when the Walkthrough's parent outranks everything it serves (FR-21), and at most one per character. Otherwise only in the Walkthrough. That keeps "which char where" visible where the player switches characters, without nagging characters that are already doing something worthwhile.

❓ Q6 - The Liquid Shop: its price per purchase is game data (base cost and ×1.37 growth in `liquidsShop`, also on the wiki), but Toolbox computes no cost function. May M14 sum the growing price (arithmetic on game data) to say "about 8 a day with Water at 32"?
➡️ Yes, as data arithmetic with the wiki cited, rounded down, and a one-minute in-game check by Yasser or Joseph before the first golden. The alternative, "buy Distilled Water at the Liquid Shop" with no count, can't tell the player it takes three days, which is the point of a Bottleneck.

❓ Q7 - With no Demand for an item, should the printer plan still suggest what to print from an authored per-Stage "default print" list (e.g. refinery salt inputs, atoms)?
➡️ Not in Phase 1: only Demand-driven changes, otherwise "keep". Phase 3 adds an authored `printer.priority.<stage>` list, through the normal Knowledge Base review, once the Demand-driven plan has run for a few Play Sessions.

❓ Q8 - Which Goals opt in to Walkthroughs at launch?
➡️ `post-office.check.unlock`, M2's gate-chain quests, M8's quest-toward stamps and M4's tool-chain Goals: every quest or craft Goal that already exists. Gear needs a gear Priority List first (Phase 3).

❓ Q9 - Should the planner ever move a character that holds an active Role on its Role activity (the W3-early Barbarian fishing) when it would finish a job fastest?
➡️ No in Phase 1 (FR-18). A Role is the Meta Path's judgment; overriding it for a material is what M5's Role-fit and Hand-off comparisons exist for. Revisit once M5 ships.

## 9. Red-team notes (author's pass)

1. **Wrong drop hours.** A 2× error in drop math flips the Bottleneck. *Defence:* the drop rate's linear effect is the game's own (N.js), M3's `dropsPerHour` is the cross-check (TR-7), nested tables are labelled "at most", and every effort line is "about … on average".
2. **Moving the wrong character.** Sending the pusher or a Lab character to farm teeth costs more than the box. *Defence:* FR-18's hard exclusions, M3 blockers first, M5's survivability rule, preference for idle Purposes, and "this moves it off …" whenever a working character is chosen.
3. **Noise.** Five characters each get a Walkthrough line. *Defence:* one Walkthrough per target, on the parent Goal's card; rows get at most one assignment, only under Q5's rule.
4. **Double counting.** Two Goals both claim the same teeth. *Defence:* FR-13's ordered allocation.
5. **Patch day.** A recipe or drop table changes. *Defence:* everything is generated at re-sync; the sync PR diff lists changed recipes; the cycle/depth CI test; parser-behind labels; fail-closed fields.
6. **Stale holdings.** Unclaimed AFK gains make a step look unfinished. *Defence:* FR-7's caveat; nothing is ticked from a projection.
7. **Unreachable advice.** Telling a W2 account to farm W3 drops. *Defence:* M5 TR-4 reachability and world ≤ `currentWorld` (US-5).
8. **Printer churn.** Swapping samples every save. *Defence:* one change per Play Session per character, only for a Demand item, never swap back for its own sake (FR-27, FR-29).
9. **Inventing formulas.** Sample size and Liquid Shop cost tempt a formula. *Defence:* sample size only when a fixture test reproduces stored samples; Liquid Shop arithmetic goes to Q6.
10. **Privacy.** Steps name characters. *Defence:* indices only; names joined in the UI (TR-13).

## 10. Red-team log

(Filled in after the independent red-team pass; see below.)

## 11. Worked examples (local only)

### 11.1 Post Office, W2-late account

| Node | Need | Held | Missing | Best Supply | Effort‡ |
|---|---|---|---|---|---|
| Postboy Pablob quest (YumYum Grotto, W2) | accepted on Barbarian Lv 60 | | | | |
| └ Empty Box × 5 (Anvil Tab 2, start of tab; Smithing 15) | 5 | 0 | 5 | craft | after the gate |
| &nbsp;&nbsp;├ Hermit Can | 1,250 | 0 | 1,250 | Salty Shores, Fishing depth 2 (eff 50) | no rate: **Bottleneck** (≥ 500) |
| &nbsp;&nbsp;├ Megalodon Tooth | 2,000 | 525 | 1,475 | The Mimic Hole (W2), Mimic 21.2% | Bowman Lv 54: ~3,900 kills, ~2.6 h |
| &nbsp;&nbsp;└ Distilled Water | 20 | 2 | 18 | Liquid Shop (W2 Alchemy) | ~8 a day at 32 Water: 3 days |
| └ gate: Anvil Tab 2 (not owned; Smithing 15) | | | | craft | |
| &nbsp;&nbsp;├ Iron Bar | 100 | 85 (66 in the Forge) | 15 | Forge, 4,276 Iron Ore held | no rate |
| &nbsp;&nbsp;├ Chain Link | 100 | 18 | 82 | anvil production (Smithing 17) | ~1.5 h per hammer |
| &nbsp;&nbsp;├ Jungle Logs | 100 | 1,533 | 0 | ✓ | |
| &nbsp;&nbsp;└ Bullfrog Horn | 100 | 8 (Squire's bag) | 92 | Tucked Away (W1), Gigafrog 14% | Wizard Lv 56: ~370 kills, ~0.3 h |

Rates on the supply maps, kills/h‡ (drop rate): The Mimic Hole: Barbarian 2,270 (1.84, excluded: pusher), Bowman 1,496 (1.78), Shaman 1,368 (1.79), Wizard 1,193 (1.78), Squire 557 (1.79). Tucked Away: Barbarian 2,092, Bowman 1,334, Shaman 1,255, Wizard 1,252, Squire 652. Every character is at 100% survivability on both maps. Assignments: Shaman → Salty Shores (the Bottleneck, no other free character with a better case; Fishing Lv 1, so the first step is reaching efficiency 50), Bowman → The Mimic Hole, Wizard → Tucked Away, one anvil hammer → Chain Link. The Squire Lv 43 stays on Copper (serving). No printer (US-4).

### 11.2 Post Office, W3-early account

Hermit Can 1,966 / 1,250 ✓. Megalodon Tooth 1,010 / 2,000: Shaman Lv 54 → The Mimic Hole, 895 kills/h‡ × 21.2% × 2.19, ~2,130 kills, ~2.4 h. Distilled Water 11 / 20: already farming on the Wizard Lv 73 (Sir Stache, 934 kills/h, 0.0068%, 2.29) and the pusher Squire Lv 85 (Thermister, 1,065 kills/h, 0.00825%, 2.18): ~0.34 per hour together, at most ~27 h; Liquid Shop: 9 for ~43 Water, ~92 held, so today. Anvil Tab 2 owned. Craft on any character with Smithing ≥ 15 (all but the Shaman, 13); hand in on the Squire Lv 85. Other Mimic Hole rates‡: Barbarian 2,360 (Role: fishing, not moved), Squire Lv 85 1,863 (pusher), Wizard 1,323 (already on a Supply), Squire Lv 51 711, Bowman 625.

### 11.3 Printer Slot Plan, W3-early account

3D Printer Lv 4: 4 slots, all used.

| Character | Sampling | Sample % | Active (per h, Toolbox) | Stored | Plan |
|---|---|---|---|---|---|
| Wizard Lv 73 | 1 | 11.2 | Forest Fibres ~18 | Forest Fibres | keep (no Demand item it could print better) |
| Squire Lv 51 | 52 | 15 | Copper Ore ~219 | Spore Cap, Copper, Iron, Gold Ore | keep |
| Bowman Lv 60 | 100 | 18.6 | Wakka Cherry ~15 | Wakka Cherry | **take a sample at The Mimic Hole, set it active: Megalodon Tooth** |
| Squire Lv 85 | 24 | 12.9 | Spore Cap ~38 | Spore Cap | keep (pusher; a visit would cost push time) |
| Barbarian Lv 56 | 0 | — | none | none | can't sample (talent 0); no slot free |
| Shaman Lv 54 | 0 | — | none | none | can't sample (talent 0); no slot free |

The W2-late account has no printer (US-4).

## 12. Phased build plan

| Phase | Ships | Why first / later |
|---|---|---|
| **1** (step 8, after M6) | `items` generator and fact tables; holdings; Requirement Trees; drop, anvil and Liquid Shop effort; reachability (built here for M5); one-job-per-character planner with FR-18's exclusions; the Walkthrough view under the Goal card; opt-ins for the Post Office, gate-chain quests, quest-toward stamps and tool Goals; the printer Slot Plan (FR-25–FR-30) | Highest value per line of code: every quest Goal already on the Now screen becomes actionable, and the printer is Joseph's main confusion |
| **2** (after M5) | Account-wide Demand across all Walkthroughs with ordered allocation (FR-13) driving multi-character parallel plans (FR-19); M5 reservation sharing; observed skilling rates (Q4); sample-size prediction once TR-7 passes | Needs M4's Purpose and M5's sweep to choose characters well |
| **3** | Gear Walkthroughs (authored gear Priority List per class line and Stage, owned with M9; equipment recipes and upgrade-stone Supplies); Slot Plans for cauldrons, traps, cog seats and worship on the same Demand; the authored default print list (Q7) | Needs authored judgment (which gear, which bubble) that doesn't exist yet |

## Verify before build

- [ ] Anvil recipe tabs and recipe-unlock state: find a Toolbox or N.js source for "which tab, start of tab or recipe" (`anvil.fact.recipe-tabs` stays tier 2 until then).
- [ ] Quest hand-in reads the character's inventory, not storage (wiki or N.js), so the withdraw step is right.
- [ ] Whether the drop rate applies again inside a nested drop table (N.js `DropTable` branch); until then "at most".
- [ ] TR-7's three contract tests (drop rate vs M3 `dropsPerHour`, anvil vs `getTimeTillCap`, sample-size reproduction).
- [ ] Which characters hold the printer's player slots when the building level is below the character count.
- [ ] The Liquid Shop daily price (Q6): one in-game check.
- [ ] `MAX_SUPPLY_MAPS = 12` within TR-8's budget on `highend.json`.
