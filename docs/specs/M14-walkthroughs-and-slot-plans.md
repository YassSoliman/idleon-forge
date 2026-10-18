# M14 Walkthroughs & Parallel Slot Plans

Spec for the owner's request of 2026-10-17 ("every Goal like the Post Office should come with a step-by-step walkthrough … and advise which chars to put where at any given time"), plus a co-player's point that nobody knows what to put in the 3D Printer, part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **ready**. Red-teamed (section 10); the owner ruled on every open question on 2026-10-17 (**Final rulings**, at the end, which supersede anything above them). Terms follow [GLOSSARY.md](../../GLOSSARY.md); decisions follow [ADRs 0001–0008](../adr/).

**Inputs this spec is built from:**
- The specs it builds on: M2 (frontier rates, pusher, Roles, `compareGoals`), M3 (AFK safety, `dropRate`, anvil, `printer.check.sample-blank`), M4 (Purpose, Contributions, the quest-item follow-up in its red-team note 10), M5 (reachability, `leverage/survivable`, one Move per destination), M6 (`post-office.check.unlock`), M8 (stamp routes, the holdings rule TR-6), M10 (Goal cards), M11 (schema, generators, `PARALLEL_SLOTS`, the illustrative `construction.goal.printer-*` ids).
- Toolbox game data at the pin (`packages/toolbox-parsers/UPSTREAM`, `6c37e3d`, game 2.3.540): `crafts.json`, `quests.json`, `monsterDrops.json`, `monsters.json`, `items.json`, `shared-data.json` (`mapNames`, `mapEnemiesArray`, `anvilProducts`, `liquidsShop`, `shops`, `npcPlacements`), and the vendored parsers `items.ts` (`flattenCraftObject`, `getAllItems`), `character.ts` (`getDropRate`), `world-1/anvil.ts`, `world-3/printer.ts`.
- The game code ([`N.js`](https://www.legendsofidleon.com/ytGl5oc/N.js), read 2026-10-17 at game 2.3.540, cited by character offset as the dossiers do), for mechanics Toolbox does not compute: the drop roll (`_customBlock_DropOdds` @4454584, nested tables @4281847), the 3D Printer sample rule (@4759326), the re-sample and reset rules (@4768361) and the stored-sample slot count (`PrinterSampleSlots`). These become authored facts with that Source (TR-4), re-checked by M11's staleness pass like any other.
- The IdleOn Wiki pages [3D Printer](https://idleon.wiki/wiki/3D_Printer) (edited 2026-10-14), [Anvil](https://idleon.wiki/wiki/Anvil), [Empty Box](https://idleon.wiki/wiki/Empty_Box), [Anvil Tab 2](https://idleon.wiki/wiki/Anvil_Tab_2), [Alchemy#Liquid Shop](https://idleon.wiki/wiki/Alchemy#Liquid_Shop), [Fishing](https://idleon.wiki/wiki/Fishing), and the skills dossier on `research/skills` (fish pools, tree maps).

Every number in sections 4 and 11 was measured on 2026-10-17 at the pin, on the two private fixtures (local only), described by account, class and level. Kill rates are Toolbox `finalKillsPerHour` from `toolboxCalls.frontierRates(parsed, map)`; drop rates are Toolbox `getDropRate`.

## 1. Purpose

When a Goal needs things the player doesn't have yet (a quest hand-in, an unlock item, a better tool or piece of gear), M14 turns it into a **Walkthrough**: where to go (world, map, NPC), everything it needs as a **Requirement Tree** down to raw materials, how much of each the account already holds, where each missing material comes from and how long it takes at this account's own kill and drop rates, which character should farm what so the work runs in parallel without breaking AFK safety or the pusher's push, and the steps in order with progress on each. Underneath, one account-wide **Demand** (what every Walkthrough still needs, netted against storage, bags and chests) feeds a **Parallel Slot Plan** for the Parallel Slots, starting with the 3D Printer: what each character should print, which sample to keep, how to take a new one, and when to swap. The player never types anything in; every fact comes from game data and the save, every judgment from authored entries.

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
- The **printer Parallel Slot Plan** (Phase 1), and the same pattern for cauldrons, traps, cog seats and worship later (Phase 3).
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
- **FR-7 Stale save.** Holdings are as of each character's last save; storage is as of the cloud save. When a character on a Supply has not saved for longer than its usual gap (M1 `usualGapSeconds`, or 1 h with no history), the step shows "as of its last save: switch to it to claim". Material counts are never projected forward (drops are random; contrast M4 FR-9's kill projection). M1's parser-behind banner adds "may be out of date" to every Walkthrough number.

### Supplies and effort

- **FR-8 Supplies.** For each missing leaf, M14 lists every Supply the generated tables know, each with world, map and NPC or monster names:
  - **drop:** a monster on an AFK-able fighting map (`monsters.json` `AFKtype: FIGHTING` with a `mapIndex`, not in Toolbox's boss, colosseum and quest exclusion list), with `effectiveChance` and quantity from `monsterDrops.json`;
  - **skill node:** a Mining, Choppin, Fishing or Catching node, with its map and its depth or efficiency gate (authored fact table, TR-5);
  - **anvil production**, **Forge smelt**, **town shop** (M8 TR-8 rules), **Liquid Shop** (W2 Alchemy, paid in Water Droplets), **3D Printer** (a stored or active sample of that item, FR-25), **recipe** (the item is crafted, FR-2);
  - **Active Play only:** crystal mobs, chests, bosses and colosseums. These are listed under "other ways" and never assigned to an AFK character.
- **FR-9 Already farming.** A Supply that a character is already on (its AFK Target is the Supply's monster or node, or its active printer sample is the item) is marked "already farming" and counts toward the Walkthrough's progress rate without any move.
- **FR-10 Drop effort.** For a drop Supply and character *c*: expected kills = missing ÷ (`effectiveChance` × quantity × `dropRate_c`), and hours = kills ÷ `finalKillsPerHour_c` on that map. Several characters on Supplies of the same item: hours = missing ÷ Σ (`finalKillsPerHour_i` × `effectiveChance_i` × quantity × `dropRate_i`). `dropRate_c` is Toolbox `getDropRate` on the character moved to that map (shrines make it map-dependent). Gems and Time Candy use `dropRate^0.2` (`^0.35` inside a drop table) per N.js and are never Walkthrough leaves. The result is a mean, labelled "about … on average", never a bound (M4 red-team note 11). For a nested drop table (e.g. Distilled Water through `DropTable14`) the game applies the drop rate once, on the outer roll: inner rows divide it back out (N.js @4281847), so the same formula holds; an inner talent bonus that Toolbox's `effectiveChance` omits can only make the real time shorter.
- **FR-11 Other effort.** Anvil production: hours = missing ÷ (Toolbox `getPlayerAnvil` `anvilSpeed` ÷ the product's `requiredAmount`), per hammer, the same quantities Toolbox's `getTimeTillCap` uses. Printer: hours = missing ÷ Toolbox printer `boostedValue` per hour. Liquid Shop: how many the Water held now buys today, from `liquidsShop` base cost and growth (Q6), plus "more later today as Water refills"; the effort is the number of days at that rate, labelled "up to". Skill nodes, Forge smelting and shops: no hours in Phase 1, only the gate ("Fishing efficiency 50 needed for Hermit Cans"; "costs coins").
- **FR-12 Reachability and safety per character.** A drop Supply is offered to character *c* only if the map is in M5 TR-4's `reachableFightingMaps(c)` and M5 TR-8's `leverage/survivable` passes (survivability ≥ 95%, or no worse than *c*'s current map). A skill-node Supply is offered only if the character has been on that map or a door into it is open for that character (the same portal data). A Supply nobody can reach yet is shown with the gate that opens it ("W3: open Frostbite Tundra first"), never as a step.

### Demand and the Bottleneck

- **FR-13 Demand.** Demand is the sum, over every Walkthrough whose parent Goal is shown on the Now screen this run (any Stage position, including "show more"), of each node's missing amount. Holdings are given out in the parents' `compareGoals` order (M2 TR-14): the higher-ranked Goal takes what it needs first, then the next one. A lower Goal never counts teeth a higher Goal has already claimed. A parent the player marked Not for me leaves the Demand; Skip today keeps it in.
- **FR-14 Effort per leaf, and jobs.** Each missing leaf's effort is the minimum over all its Supplies, counting every kind: a buy finished today is 0 h, a buy spread over days counts its days, a drop counts its hours, an unrated skill gather counts as one Expected Return when its missing amount is at least `values.unratedBottleneckAt` (default 500), else as unknown-small. A leaf whose cheapest Supply is a buy becomes a buy step, not a job. Every other missing leaf with an AFK-able Supply becomes one **job**: (item, amount, Supplies). Craft, hand-in, buy, collect, use and unlock steps are things the player does in a Play Session, never jobs.
- **FR-15 Bottleneck.** A Walkthrough's Bottleneck is its missing leaf with the largest FR-14 effort, whatever the Supply kind, so a three-day buy can be it and a buy finished today never is. Unknown-small efforts rank after every rated one. Ties go to the deeper node, then the lower item index.
- **FR-16 Start early.** A job whose material is needed only behind an unmet gate (Megalodon Teeth for Empty Boxes, behind Anvil Tab 2) still starts now when it is the Bottleneck or when a character is free for it. The step says why: "Start now: it's the slowest part, and the boxes need it once Anvil Tab 2 is done."

### Assignment

- **FR-17 One job per character.** The planner gives each character at most one job per AFK Stretch. Jobs are taken in order: the highest-ranked Walkthrough's first, longest FR-14 effort first. Each job goes to the first preference group below that has an eligible character; inside a group, the one that finishes it soonest (for an unrated skill job: the holder of an active Role for that skill, then the lower index):
  1. a character already on one of its Supplies (FR-9): it stays, no move;
  2. a character whose M4 Purpose is `exhausted`, `none` or `no-activity` (never `cannot-tell`: the data can't say it is idle); until M4 ships, a character whose current activity no shown Goal names;
  3. any other eligible character, shown with "this moves it off <current activity>".
  Until M4 ships, a character on a skilling AFK Target counts as serving (M4 D6, the Copper lesson), so Phase 1 never pulls a skiller off its node for preference 2. Ties go to the lower survivability margin that still passes (the weakest character that clears the map comfortably keeps stronger ones free), then the lower index.
- **FR-18 Never eligible.** A character is never assigned a job that moves it when:
  - it is M2's pusher and its current activity serves the push Goal (M5 FR-7);
  - its AFK Target is `LABORATORY` (M5 FR-6's Lab-chain rule; M14 never computes Lab removals);
  - it holds an active M2 Role whose AFK type is its current activity, unless the job's Supply is that same activity;
  - M3 shows it a blocker that the move would not fix (M5 TR-8: the Fix comes first);
  - the Supply fails FR-12.
  A character that can only take a job by breaking one of these gets none, and the job waits with "no free character: next Play Session".
- **FR-19 One job per destination.** At most one character is moved onto each map by the planner, as M5 FR-10 rules for Moves, unless one character cannot finish the job within the Expected Return; then a second is added, and so on, while each added character still brings the hours down to at most the previous hours ÷ 1.25 (M5 D1's `clearMargin`).
- **FR-20 Parallel Slots.** Anvil production and printer jobs run on a character's Parallel Slot, alongside its AFK Target, so they never use up the character's one AFK job. Anvil jobs name the hammer to switch ("switch one hammer from Thread to Chain Link"); M3's anvil cap Checks still run on the result.
- **FR-21 Assignments on the Now screen.** An assignment that moves a character is a Next Action on that character's row ("Move to The Mimic Hole: Megalodon Teeth for the Post Office"), ranked at its parent Goal's position, only when preference 2 applies or the parent outranks every Goal the character serves now (Q5). Otherwise it stays inside the Walkthrough. It counts against M10 FR-16's 3-Goals-per-character cap like any Next Action. Once the character is on the Supply, the M4 Contribution `walkthrough.contribution.supply` (TR-4) makes that activity a Purpose line, worthwhile under M4 FR-7's own horizon (24 h default, never below the Expected Return), so a move to a job that finishes within it never turns a Ready Verdict into Unknown.

### The Walkthrough view

- **FR-22 Steps.** A Walkthrough is an ordered list of steps: farm (a job), produce (anvil or printer), buy, collect, smelt, level a skill to a gate, craft, use (an unlock item such as Anvil Tab 2 must be used after crafting), withdraw, hand in. Order: every step whose inputs are ready ("now"), Bottleneck first; then steps that wait on others ("after"), in tree order from the leaves up; the hand-in last. Each step shows who does it (class and level, joined to names only in the UI, M4 TR-9), where (world · map · NPC or monster), its progress (`held / need`), and its effort (FR-10, FR-11). Done steps stay, ticked, until the Walkthrough completes.
- **FR-23 Where it shows.** The Walkthrough is attached to its parent Goal's card (M10 TR-2 `Goal.walkthrough`). Collapsed, the card shows one line: "Steps 2 of 9 · slowest: Hermit Cans". Expanded, it shows the steps (FR-22), then the Requirement Tree as an indented list, then "other ways" (FR-8 Active Play Supplies). It renders wherever the parent renders (a `needsCharacter` Check such as the Post Office unlock sits on its character's row, M6 FR-26), once per target, never repeated on other rows (#70 A5); other rows get only their own FR-21 assignment. The generated `walkthrough.goal.*` entries are Purpose-line targets only and never render as Goals, so they use no Goal cap.
- **FR-24 Done and dismissal.** A Walkthrough is done when its parent's own done rule fires (e.g. `doneWhen` on `post-office.check.unlock`). Skip today and Not for me act on the parent Goal (M10); an assignment Next Action has its own key `walkthrough@<target>#<item>@c<index>` so dismissing a move doesn't hide the Walkthrough.

### Printer Parallel Slot Plan

- **FR-25 Printer facts.** Per character, from Toolbox's printer parser and the save: whether it has a printer player slot (the 3D Printer's building level gives one slot per level, wiki; M2 `buildings.printer3d`), its Printer Sampling talent level, its sample size % (`printerSample`), its stored samples (4 slots plus `gemShopPurchases[112]`, N.js `PrinterSampleSlots`; a new sample into full slots fails in game, "fullsamplez2") and its active samples (1, plus `gemShopPurchases[111]` with the Crystal 3D Printer), each with Toolbox's `boostedValue` per hour. Only characters in save slots below the building level print (M3 FR-23's rule). Account-wide: the printer's day counters (`accountOptions[125]`, `[323]`, `[479]`) and Toolbox `getPrinterMulti` now and with those counters at 0 (worker, TR-3).
- **FR-26 What can be sampled.** A sample is always of the activity the character is AFK on when the talent is used (N.js): for a fighting map, the first of the monster's first four drop rows that is not coins, not a card and not quest-linked (Mimic → Megalodon Tooth; Gigafrog → Bullfrog Horn); for a mining or choppin node, its ore or log. Items behind a drop table (Distilled Water) can never be printed. The sampleable item per monster is a generated fact (TR-5) so a patch that reorders drops re-syncs.
- **FR-27 What to print.** For each character with a printer slot, the plan picks at most one change per Play Session:
  - **swap to a stored sample** of a Demand item, when its `boostedValue` would cover more of the Demand than the active sample does (the active sample's item is not in Demand, or is covered): "In the 3D Printer, set the Squire Lv 51's active sample to Iron Ore (stored, ~219/h)";
  - **take a new sample** of a Demand item that no stored sample covers, on the eligible character (talent ≥ 1, a printer slot, the map reachable, and a free stored-sample slot or a stored sample not in Demand to clear first) with the largest `samplePct × finalKillsPerHour × dropRate` on that map. The sample comes from the sampler's own rates (N.js @4759326), so this ranks candidates without predicting a size. The step is a short visit: "visit The Mimic Hole, put Printer Sampling on the attack bar and use it, set the sample active, then go back";
  - **keep** otherwise. The plan never suggests replacing an active sample unless a Demand item takes its place (Q7), and never proposes changing an active sample that is already an uncovered Demand item, so it does not churn between saves although it stores nothing.
- **FR-27a Sampling resets the printer bonus.** Every successful sample sets the account's printer day counters to 0 (N.js @4768361), which resets the Gold Relic, winter-event and legend-talent growth for every character's printing. Before a take-a-sample step, the plan compares `getPrinterMulti` now with the multi after the reset. When the loss is above `values.maxResetLoss` (authored, default 10%), the step is offered only if the Demand item is the Bottleneck, and then it says so: "Taking a sample resets the printer bonus: all printing ×1.84 → ×1.00". Swapping between stored samples resets nothing.
  Demand items are ranked by their Walkthrough's parent position, then by missing hours.
- **FR-28 Sample size.** A new sample's size is never predicted in Phases 1–2: the step says "the size shows in the printer once taken". Re-sampling an item keeps the larger of the old and new value (N.js), but it still resets the printer bonus (FR-27a), so the plan never suggests a re-sample for its own sake.
- **FR-29 When to swap.** When the Demand for the printed item is covered (holdings ≥ need), the plan marks the sample "covered" and offers the next Demand item from the stored samples first, or keeps it if none. It never tells the player to swap back to the old sample for its own sake.
- **FR-30 Gates and hand-offs.** No printer slot free: the plan names the building ("3D Printer Lv 4: 4 of 6 characters can print; Construction raises it"), linking `construction.goal.printer-cruncher-arm` when that Goal exists. No Printer Sampling talent: "Printer Sampling (Star Talent tab 2) is at 0 on this character". A blank active sample is M3's `printer.check.sample-blank`; M14 only supplies the item that Next Action names ("Fill the blank printer sample: Megalodon Tooth from The Mimic Hole"), so the two never show twice.

### General

- **FR-31 Sources.** Each step links the IdleOn Wiki page for its item, monster, map or NPC (generated wiki links, verified to exist at generation, TR-9), per #74. Tier-1 numbers render as "Calculated by IdleOn Toolbox · 2.3.540", unlinked.
- **FR-32 Determinism.** Same Account State, history, Knowledge Base, Expected Return and `now` give byte-identical Walkthroughs and Parallel Slot Plans.
- **FR-33 Fail closed.** A node, Supply or rate that reads an unknown field (`isKnown` false, a failed section, a `null` field) drops to "can't tell" with a diagnostic; a Walkthrough with an unknown holding never claims a step is done, and an unknown rate never wins an assignment. `EmptyAccountError` produces no Walkthrough at all.

## 4. User stories

Fixtures: the **W2-late account** (5 characters, highest Lv 60, Stage W2-late) and the **W3-early account** (6 characters, highest Lv 85, Stage W3-early), parsed at the pin. Numbers marked ‡ are pre-registered expectations measured with the vendored Toolbox on 2026-10-17; the first engine run must land within ±5% of each before a golden is recorded (M4's rule).

**US-1 The Post Office, before Anvil Tab 2 (W2-late).** As a player in a Play Session, I want the Post Office Goal broken into steps with my own numbers, so that I can start the slow parts today.
- **Given** the W2-late account: the Barbarian Lv 60 has Postboy Pablob's quest accepted (status 0); `CYAnvilTabsOwned` = 1; storage holds 525 Megalodon Teeth, 2 Distilled Water, 0 Hermit Cans, 19 Iron Bars (+66 in the Forge), 18 Chain Links, 1,533 Jungle Logs, and the Squire Lv 43 carries 8 Bullfrog Horns; nobody has Fishing above Lv 1; Water Droplets are at their cap of 32
- **When** the engine runs
- **Then** the Post Office Goal's Walkthrough shows the tree: quest → 5 Empty Box (Anvil Tab 2, Smithing 15) → 1,250 Hermit Can (0 held), 2,000 Megalodon Tooth (525), 20 Distilled Water (2); gate Anvil Tab 2 (not owned) → 100 Iron Bar (85, incl. the Forge's 66), 100 Chain Link (18), 100 Jungle Logs (✓ 1,533), 100 Bullfrog Horn (8).
- **And** the Bottleneck is Distilled Water (a buy spread over up to 3 days, FR-14), ahead of Hermit Cans (1,250 unrated ≥ 500 counts as one Expected Return, 8 h); both, and the Megalodon Teeth, start now although Anvil Tab 2 isn't done (FR-16).
- **And** the steps, in order, are:
  1. Buy Distilled Water at the Liquid Shop (W2 Alchemy): 18 needed; the 32 Water held buys 8 now (Q6), more later today as Water refills, so up to 3 days; it also spends the Water that M3 flags as at cap.
  2. *(R-Q9a)* On the Barbarian Lv 60: finish its push step (Djonnut's quest 2 on this save), then fish Hermit Cans at Salty Shores (W2, small pool depth 2, efficiency 50; its fishing efficiency is 54 as equipped); no rate shown (skilling). Then, as its own steps: set up talent preset 2 for Fishing, fill card preset 2 for Fishing and switch to it.
  3. Send the Bowman Lv 54 to The Mimic Hole (W2): 1,475 Megalodon Teeth ≈ 3,900 kills at 21.2% × 1.78 drop rate, about 2.6 h at 1,496 kills/h‡.
  4. Farm 92 Bullfrog Horns at Tucked Away (W1): only the Barbarian Lv 60 can walk there (the door from Encroaching Forest Villas needs 4,200 kills, which no other character has; FR-12), and it is busy with the push and the Hermit Cans, so the step names the door instead of a character. *(Build finding, 2026-10-17: the first draft sent the Wizard Lv 56, which FR-12's reachability rule doesn't allow on this save.)*
  5. Switch one anvil hammer to Chain Link on any character (Smithing 17 ✓): 82 needed, about 1.5 h per hammer (anvil speed 38,790 ÷ 700‡).
  6. Collect 66 Iron Bars from the Forge and smelt 15 more from the 4,276 Iron Ore in storage.
  7. *(after 3–6)* Craft Anvil Tab 2 (Smithing 15) with all four materials in the crafter's bag, then use it to open tab 2 for every anvil.
  8. *(after 1–3, 7)* Craft 5 Empty Boxes: the first craft needs 250 Hermit Cans, 400 Teeth and 4 Water in the crafter's bag (wiki: first craft from inventory).
  9. *(after 8)* Hand the 5 Empty Boxes to Postboy Pablob in YumYum Grotto on the Barbarian Lv 60.
- **And** *(R-Q9a)* the Barbarian Lv 60 is both M2's pusher and the Fishing Role holder, so it takes the Hermit Cans job, sequenced after the push (neither finishes within an hour; the push ranks higher at position 2). It is never pulled onto the Teeth or the Horns (fighting jobs that are not one of its Roles). The Squire Lv 43 stays on Copper (serving a Mining door; before M4, a skiller counts as serving). The Bowman gets the Teeth (2.6 h, faster than the Shaman's 2.9 h and the Wizard's 3.3 h); the Shaman and Wizard stay, since neither can reach Tucked Away.

**US-2 The Post Office, nearly there (W3-early).** As a player in a Play Session, I want ActiveOn to notice which characters already farm what I need, so that I move as few characters as possible.
- **Given** the W3-early account: the Squire Lv 85 (the pusher, on Thermonuclear Climb) has the quest accepted; Anvil Tab 2 is owned; holdings are 1,966 Hermit Cans, 1,010 Megalodon Teeth, 11 Distilled Water; the Wizard Lv 73 fights Sir Stache on The Stache Split; Water Droplets are at about 92
- **When** the engine runs
- **Then** Hermit Cans show ✓ (1,966 of 1,250). Distilled Water (9 missing) is a buy step, not a job: the Liquid Shop sells 9 for about 43 Water, affordable today (Q6), against about 27 h by drops ("already farming" on the Wizard Lv 73, Sir Stache 0.0068%‡ × 2.29, and on the pusher, Thermister 0.00825% × 2.18, together about 0.34 per hour‡). The Bottleneck is the Megalodon Teeth.
- **And** the Shaman Lv 54 (on Sand Castle, where the Death Note pays nothing at building Lv 0, M4 US-3) goes to The Mimic Hole: 990 Teeth ≈ 2,130 kills at 21.2% × 2.19, about 2.4 h at 895 kills/h‡. The Barbarian Lv 56 is not moved (it holds the active Fishing Role on its current activity, FR-18), and the pusher is not moved (FR-18).
- **And** the last steps are: craft 5 Empty Boxes (any character with Smithing ≥ 15; the Shaman's 13 is too low), then hand them in on the Squire Lv 85.

**US-3 The printer feeds the Demand (W3-early).** As a player in a Play Session, I want to know what each character should print, so that the printer works on what my Goals need.
- **Given** the W3-early account: the 3D Printer is Lv 4; the Wizard Lv 73, Squire Lv 51, Bowman Lv 60 and Squire Lv 85 print Forest Fibres (~18/h), Copper Ore (~219/h), Wakka Cherry (~15/h) and Spore Cap (~38/h); the Barbarian Lv 56 and Shaman Lv 54 have Printer Sampling at 0; the Demand from US-2 holds 990 Megalodon Teeth; nobody has a stored Megalodon sample
- **When** the engine runs
- **Then** the Parallel Slot Plan proposes one change: the Wizard Lv 73 visits The Mimic Hole, uses Printer Sampling and sets the new sample active in place of Forest Fibres, which no Demand needs. It ranks first on `samplePct × kills/h × drop rate` there: 11.2% × 1,323 × 2.29 ≈ 339, against the Bowman Lv 60's 18.6% × 625 × 2.18 ≈ 253 and the Squire Lv 51's 15% × 711 × 2.18 ≈ 232 (whose 4 stored slots are also full). The Shaman, who will farm there, can't sample (talent at 0), and the pusher isn't sent.
- **And** the printer bonus loss is 0%: this account's printer multi (×1.07) comes from Skill Mastery, which a sample doesn't reset (FR-27a).
- **And** no other character's sample changes (their items are not in Demand, FR-27 "keep").
- **And** the sample size reads "shows in the printer once taken" (FR-28).
- **Given** the Demand for Teeth is covered on a later save
- **Then** the Wizard's sample shows "covered" and, with no other Demand item, "keep" (FR-29).

**US-4 No printer yet (W2-late).** As a player in a Play Session, I want the printer plan to stay quiet until I have a printer, so that it doesn't add noise.
- **Given** the W2-late account (no 3D Printer: World 3 not reached)
- **When** the engine runs
- **Then** no Parallel Slot Plan shows, and Walkthrough Supplies never offer "printer".

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

**TR-1 Package boundaries.** The engine part lives in `packages/engine/src/walkthrough/` as pure functions (no I/O, no clock, no randomness): `expand.ts` (trees), `holdings.ts`, `supply.ts`, `demand.ts`, `plan.ts` (assignment), `slots/printer.ts`. It imports only types from `@idleon-forge/account-state`, compiled entries from `@idleon-forge/knowledge`, `compareGoals` from M2 and `leverage/survivable` from M5 (or its rule, TR-11). It never imports `toolbox-parsers`. The worker part (supply rates, TR-3) lives in `packages/account-state/src/supply.ts` and receives `toolboxCalls` by injection, like M2's frontier. The one Knowledge Base Detector, `walkthrough/supply`, lives in `packages/knowledge/detectors/walkthrough/` and reads only the Account State and generated facts (M11's Detector contract); expansion, Demand, the planner and the Parallel Slot Plan are engine steps, run after M3 and M4 in the engine core, because they read other modules' results.

**TR-2 Account State additions** (M1 TR-11 growth; each `null` when its section fails):

```ts
interface AccountSummary {
  /** Raw CYAnvilTabsOwned: anvil tabs unlocked for every anvil. */
  anvilTabsOwned?: number | null;
  /** Items in the Forge's output slots (bars), as Toolbox's getAllItems counts them. */
  forgeOutput?: { rawName: string; amount: number }[] | null;
  // Water Droplets held: read from M3's `account.afk` liquids (M3 TR-2), not a second field.
  /** Worker-computed rates on the supply maps (TR-3). */
  supplyRates?: SupplyRates | null;
  printer?: PrinterState | null;
}
interface CharacterState {
  // Inventory stacks: M3's `afk.inventory.stacks` (M3 TR-2), extended with `rawName`; not a second field.
  smithingLevel?: number | null;
  fishingEfficiency?: number | null;     // Toolbox getSkillEfficiency('fishing'); Phase 2
}
interface PrinterState {
  level: number;                          // buildings.printer3d (M2), restated for one read
  storedSlots: number;                    // 4 + gemShopPurchases[112] (N.js PrinterSampleSlots)
  activeSlots: number;                    // 1 + gemShopPurchases[111] (N.js PrinterBigSlots)
  multiNow: number; multiAfterSample: number; // Toolbox getPrinterMulti, live and with accountOptions[125], [323], [479] at 0 (FR-27a)
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

**TR-3 Supply rates (worker).** After the parse and before the engine (inside the same parse response, as M5 TR-3), the worker computes `SupplyRates` for the **supply maps**: for each missing leaf of each Walkthrough target that is not yet done (quest status and holdings from the save; Supplies from the generated `walkthrough.fact.supply-maps` table, TR-4), the `SUPPLY_MAPS_PER_LEAF = 3` drop maps with the highest `effectiveChance` in worlds ≤ `currentWorld` that at least one character can reach, plus every character's current map (already computed by M4's identity call, so free). The set depends only on the save and the Knowledge Base, never on device speed. A leaf whose other drop maps were not computed says "rates for N more maps not computed" under "other ways" (`status: 'partial'`). For each map and each character with a level it calls `frontierRates(parsed, map)` and `getDropRate(onMap(c, map), account, characters)` inside the frozen clock, sharing Toolbox's damage cache.

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
| `walkthrough.contribution.supply` | Contribution, `goalFamily: walkthrough.goal`, Detector `walkthrough/supply`: the activity advances a Walkthrough when its target monster or node is a Supply of a missing leaf of that Walkthrough (Account State + generated facts only). `eta: kills-per-hour` for fighting; worthwhile under M4 FR-7 (horizon `values.horizonHours`, default 24 h, floored at the Expected Return) | this spec |
| `printer.fact.sample-rules`, `drops.fact.roll-rules` | tier 1 game code (N.js URL, offset, game 2.3.540) plus the wiki 3D Printer page: the sample item rule, slot counts, the reset counters; the drop roll's linear drop rate and nested-table handling | N.js, wiki |
| `walkthrough.check.assign` | the FR-21 Next Action text | this spec |
| `printer.check.slot-plan` | the FR-27 Next Action text; `construction.goal.printer-samples` is its Goal (the id M11's example list already uses) | wiki 3D Printer |
| `values.unratedBottleneckAt`, `values.maxResetLoss` | 500 items; 10% printer bonus loss | judgment (Q4, FR-27a) |

Parents that opt in at Phase 1: `post-office.check.unlock` (M6), the gate-chain quests of M2 (`quests.goal.*`), M8's `stamps.check.quest-toward`, M4's `skills.goal.tool-*`. Each opt-in is a one-line `walkthrough:` edit in that module's YAML, reviewed in its Knowledge Base PR.

**TR-5 Detectors.**

| Detector | Reads | Returns |
|---|---|---|
| `expand` (engine step) | target Acquisition, `items.acquisition.*`, gates from the Account State | `ReqNode` tree |
| `holdingsOf` (engine core) | `storageItems`, `characters[].inventoryItems`, `forgeOutput`, refinery storage | `Holding[]` per rawName |
| `walkthrough/supply` (Contribution Detector) | the character's AFK Target, holdings, `supplyRates`, generated Supplies | advances yes/no, `etaMs` |
| `plan` (engine step, after M3 and M4) | Demand, `supplyRates`, M2 `MetaPathInput`, M3 `AfkSafetyResult`, M4 `Purpose[]` (when present) | `Job[]` with assignees |
| `printerPlan` (engine step) | `printer`, Demand, `printer.fact.sample-item`, the plan | `PrinterSlotPlan` |

The Detector gets fires / doesn't-fire tests, and each engine step unit tests, on both private fixtures (local) and the public and scrubbed fixtures (CI).

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
  bound: 'mean' | 'none';
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
- drop hours (FR-10): `effectiveChance` and quantity are game data; `finalKillsPerHour` and `dropRate` are Toolbox's. The linear use of the drop rate is the game's own (`_customBlock_DropOdds` multiplies the chance by `Drop_Rarity`; nested tables divide it back out), recorded in `drops.fact.roll-rules`. M3's `dropsPerHour` uses the same arithmetic, so it is no independent check: the falsifier is M3's calibration Play Session (M3 TR-12 item 5) and, in Phase 2, save-history deltas (Q4) on a character left on a supply map.
- anvil hours (FR-11) use `anvilSpeed ÷ requiredAmount`; a contract test checks it against Toolbox `getTimeTillCap` on both fixtures within 1%. If it fails, anvil jobs show no hours.
- sample-size: never predicted (FR-28). The sampler ranking (FR-27) uses only the ordering of `samplePct × finalKillsPerHour × dropRate`, all Toolbox values.
- printer bonus loss (FR-27a): Toolbox `getPrinterMulti` called twice, no formula of ours.
- Liquid Shop cost (FR-11, Q6).

**TR-8 Performance.** Worker supply step: measured in the first build PR on `highend.json` (11 characters) and both fixtures, target ≤ 150 ms p95. M5 TR-10's 1.4 ms is the *unshared* clone, so 11 characters × 10 maps can reach ~150 ms before the shared cache; `getDropRate` (no damage model) is cheap but counted. Over budget means lowering `SUPPLY_MAPS_PER_LEAF` in a reviewed PR; engine `planWalkthroughs` ≤ 20 ms for 11 characters and 20 Walkthroughs; the generated `items` entries add ≤ 200 KB gzipped (they are indexed by rawName once per Knowledge Base load). Over budget means a reviewed change to `SUPPLY_MAPS_PER_LEAF` or the opt-in list, never a device-dependent cut.

**TR-9 Sources (#74).** Generated entries keep their tier-1 Toolbox Source. For the player link, the generator adds the IdleOn Wiki page of the item, monster, map or NPC (`https://idleon.wiki/wiki/<Display_Name>`), but only after checking through the MediaWiki API that the page exists; its last revision date sets tier 2 (after the current major) or tier 4. A missing page means no link, never a GitHub link. The check runs in the weekly parser-sync job and is cached in `generated/_wiki-pages.json`.

**TR-10 Generator tests.** For every W1–W4 target: no cycle, no depth stop, every referenced rawName exists in `items.json`, every drop map exists in `mapNames`. Hand-checked expected trees for `postboy-pablob1` (US-1's tree) and Anvil Tab 2 before merge. The parser-sync PR diff lists changed recipes and drop rows.

**TR-11 Reuse, not copies.** `holdingsOf` implements M8 TR-6 once, in `packages/engine/src/core/holdings.ts`; M8 imports it. `reachableFightingMaps` is M5 TR-4's, built in TR-3 first. The survivability rule is M5 TR-8's `leverage/survivable`, moved into `core/` so both modules call one function. Quest status uses M8 FR-4's rule.

**TR-12 Storage.** M14 stores nothing. Dismissals are M10's (FR-24 keys). Phase 2's observed skilling rates (Q4) read M1's `SaveHistory`.

**TR-13 Privacy.** Outputs carry character indices only; names are joined in the UI. No template has a name slot. Report this sends M13's `ReportContext` with the Walkthrough target id and step number, never holdings values unless "Attach the numbers" stays ticked (M13 D3). Nothing leaves the device.

## 6. States and edge cases

| State | Behaviour |
|---|---|
| Loading, empty account | No Walkthrough, no Parallel Slot Plan |
| Section failed (`storage`, `quests`, `printer`) | Holdings, quest gates or the Parallel Slot Plan read "can't tell"; nothing is ticked done (FR-33) |
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

## 8. Open questions for Yasser (ruled)

All nine were ruled on 2026-10-17 exactly as recommended; see **Final rulings**. The questions stay here for the reasoning.


❓ Q1 - Where this lives: a new module M14 "Walkthroughs & Parallel Slot Plans", or folded into M4 (Purpose already owns Goal ladders and Contributions), M5 (Moves) or M8 (Acquisitions and stamp routes)?
➡️ A new module, M14. M4 answers "what does this character's activity serve?", M5 "is there something better for this one character?", M8 "which collectibles can I get?". None of them owns "break this Goal into materials, and spread the materials across characters", which is account-wide and cuts across all three. M14 reuses each one's pieces instead of copying them: M8's holdings rule and quest status, M5's reachability, survivability and one-Move-per-map, M4's Contribution mechanism (so an assigned character reads as serving), and M2's ranking. Folding it into M4 would make M4's per-character Purpose account-wide; into M8 would make every Goal a "collection".

❓ Q2 - The glossary terms: Walkthrough (per-Goal steps), Requirement Tree, Demand, Supply, Bottleneck and Parallel Slot Plan, or fewer?
➡️ All six, as added to `GLOSSARY.md` in this PR. "Step Plan" was rejected because "plan" alone is already Spend Plan's; bare "Slot Plan" was rejected because M2's slot plan is the character-slot plan (`metapath.metapath.slot-plan`); "Supply" avoids "Source" (a citation) and "route" (Visit Order's _Avoid_).

❓ Q3 - Build order: ship Phase 1 (Post-Office-style quest Walkthroughs plus the printer Parallel Slot Plan) right after M6, before M4, or after M5 as the last module?
➡️ Right after M6, as step 8 of the build order, before M4. It is the most-asked-for value and needs only M1–M3, M6 and M11, all on main. The two M4/M5 hooks (preference 2 and the Contribution) have stated fallbacks until those modules ship. Phases 2 and 3 come after M5.

❓ Q4 - Skilling pace: Toolbox computes no resources per hour. Keep skilling Supplies yes/no (Phase 1), or in Phase 2 show a rate observed from save history (Δ item count ÷ hours while a character sat on that node, over the last 30 days)?
➡️ Yes/no in Phase 1, observed rates in Phase 2, labelled "measured from your last N hours on this node". It is arithmetic on save data, not a formula (ADR 0005), and it is what makes Hermit Cans a measurable Bottleneck. Until then the authored 500-item threshold (FR-15) decides.

❓ Q5 - Should a planned move show on the character's own row as a Next Action, or only inside the Walkthrough?
➡️ On the row only when the character's Purpose is not serving, or when the Walkthrough's parent outranks everything it serves (FR-21), and at most one per character. Otherwise only in the Walkthrough. That keeps "which char where" visible where the player switches characters, without nagging characters that are already doing something worthwhile.

❓ Q6 - The Liquid Shop: its price per purchase is game data (base cost and ×1.37 growth in `liquidsShop`, also on the wiki), but Toolbox computes no cost function. May M14 sum the growing price (arithmetic on game data) to say "about 8 a day with Water at 32"?
➡️ Yes, as data arithmetic with the wiki cited, rounded down, counting only the Water held now ("more later today as Water refills"), with a one-minute in-game check before the first golden. ADR 0005 allows arithmetic on game data; if you read a growing price as a game formula, say so and the step drops the count. The alternative, "buy Distilled Water at the Liquid Shop" with no count, can't tell the player it takes three days, which is the point of a Bottleneck.

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
8. **Printer churn.** Swapping samples every save. *Defence:* at most one change per character, only toward an uncovered Demand item, never away from one, never swap back for its own sake (FR-27, FR-29); sampling's account-wide bonus reset is priced first (FR-27a).
9. **Inventing formulas.** Sample size and Liquid Shop cost tempt a formula. *Defence:* sample size is never predicted; the sampler ranking and the bonus loss use only Toolbox values and functions; Liquid Shop arithmetic goes to Q6.
10. **Privacy.** Steps name characters. *Defence:* indices only; names joined in the UI (TR-13).

## 10. Red-team log

Independent red-team pass on 2026-10-17 by a reviewer that had not seen the drafting, against the spec, the glossary, the ADRs, the sibling specs, Toolbox data and parsers at the pin, N.js and both private fixtures. Every finding was re-checked before a verdict (the P0 and the slot count against N.js @4768361 and `PrinterSampleSlots`; the nested-table rule at @4281847; the rates by re-running `frontierRates` on map 52). Totals: 23 findings (P0 1, P1 8, P2 11, P3 3): 20 fixed, 2 fixed in part, 1 rejected.

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| RT-1 | P0 | Taking any sample resets the account's printer day counters (Gold Relic, winter event, legend talent), so "re-sampling is never harmful" was false | fixed | FR-27a prices the loss with Toolbox `getPrinterMulti` before and after (`multiAfterSample`, TR-2); a sample above `maxResetLoss` 10% is offered only for the Bottleneck; FR-28 drops re-sample advice. US-3 states the W3-early loss is 0% |
| RT-2 | P1 | Picking the sampler by highest sample % ignores the sampler's own kill rate | fixed | FR-27 ranks by `samplePct × finalKillsPerHour × dropRate`; US-3 now picks the Wizard Lv 73 (≈339 vs 253 and 232) |
| RT-3 | P1 | Stored slots are 4 + gem[112], not 5, and sampling into full slots fails | fixed | FR-25, TR-2 `storedSlots`/`activeSlots`; FR-27 requires a free slot or a non-Demand sample to clear; §11.3 marks the Squire Lv 51's 4 of 4 |
| RT-4 | P1 | The sample-size reproduction test can't work (old samples, pre-multi values, multikill) | fixed | Size is never predicted in Phases 1–2 (FR-28, TR-7) |
| RT-5 | P1 | FR-18 excludes the pusher only on its push activity, but US-1 said the W2-late pusher (on Poopy Sewers, not its frontier) is "never assigned" | fixed | US-1 re-derived: FR-18 doesn't exclude it; it stays because it serves the Vault row and preference 2 has candidates |
| RT-6 | P1 | The Bottleneck looked at farming jobs only: a buy-today leaf was the Bottleneck in US-2, a 3-day buy could never be one in US-1 | fixed | FR-14 effort per leaf is the minimum over every Supply kind; buys become steps; FR-15 ranks all efforts. US-1's Bottleneck is now Distilled Water, US-2's the Teeth |
| RT-7 | P1 | Dependency loop with M4 and Detectors reading other modules' results | fixed | Only `walkthrough/supply` is a Knowledge Base Detector (Account State + generated facts); expansion, plan and printer plan are engine steps after M3/M4 (TR-1, TR-5) |
| RT-8 | P1 | `MAX_SUPPLY_MAPS = 12` in world order drops the best Distilled Water maps | fixed | TR-3: top 3 maps per leaf by `effectiveChance` among reachable ones, plus current maps; `partial` says what was skipped |
| RT-9 | P1 | Exact holdings and a named person tied to a fixture in a public file | fixed in part | The person's name is gone and §11 says what it is. The counts stay: every merged spec's acceptance criteria quote fixture counts by class and level (M4 US-1, M8, M3), which the spec brief requires; they are not save content or names |
| RT-10 | P2 | TR-8's budget used the unshared clone cost and left out `getDropRate` | fixed | TR-8 restated as measured in the first build PR, ≤ 150 ms p95, with the honest worst case |
| RT-11 | P2 | FR-19 said "25%" for M5's 1.25 margin (a 20% cut) | fixed | FR-19 uses "≤ previous ÷ 1.25" |
| RT-12 | P2 | Nested tables: N.js already shows the drop rate applies once; gems use ^0.35 inside tables | fixed | FR-10 and TR-7 updated; `at-most-mean` removed; verify item dropped |
| RT-13 | P2 | The drop-hours contract test against M3 is circular; M3's fields aren't built yet | fixed | TR-7's falsifier is M3's calibration Play Session and Phase 2 history deltas; `dropRate` lives in `SupplyRates` |
| RT-14 | P2 | Skill Supplies had no reachability or assignment rule; fishing depends on bait | fixed | FR-12 reachability for skill nodes; FR-17 rule for unrated jobs (active Role holder, then index); US-1 step 2 says it starts by levelling and that bait weights matter |
| RT-15 | P2 | Phase plan contradictions (allocation in Phase 2, M4-dependent stories before M4, attack bar in M9) | fixed | Allocation moved to Phase 1 (§12); FR-17's pre-M4 fallbacks and US-1 state both paths; the sampling step tells the player to put the talent on the attack bar; FR-13 defines dismissal |
| RT-16 | P2 | The Post Office parent is a character-row Check, not account-level; generated Goals could render twice | fixed | FR-23: renders wherever the parent renders, once; `walkthrough.goal.*` are Purpose-line targets only; FR-21 names M10 FR-16's cap |
| RT-17 | P2 | The stale trigger (`secondsSinceLastSave > 0`) fires on nearly every character | fixed | FR-7 uses M1 `usualGapSeconds` (1 h without history) |
| RT-18 | P2 | "One change per Play Session" needs state; the Contribution ignored M4's horizon | fixed | FR-27's stateless no-churn rule; TR-4 Contribution follows M4 FR-7's horizon |
| RT-19 | P2 | "Slot Plan" collides with M2's character slot plan | fixed | Renamed Parallel Slot Plan in the spec, glossary and index |
| RT-20 | P2 | N.js lacked a URL and pinned version; sample prediction and Liquid Shop cost read as formulas | fixed in part | N.js cited by URL, date, game version and offset, held in authored facts re-checked by the staleness pass (TR-4); prediction removed. The Liquid Shop sum stays an owner question (Q6), not settled here |
| RT-21 | P3 | "About 8 a day" ignores Water refilling | fixed | "8 now, more later today", "up to 3 days" (FR-11, US-1) |
| RT-22 | P3 | Arithmetic: all figures reproduce; §11.3 showed "—" for 1.1%; three Mimic rates equal M2's Sands of Time rates | fixed (one rejected) | 1.1% shown. The rates were measured on map 52 itself (re-run 2026-10-17); they match because both maps are respawn-capped for those characters, now noted in §11.1 |
| RT-23 | P3 | Missing "use Anvil Tab 2" step; duplicate liquids and inventory fields; two verify items already answerable | fixed | US-1 step 7 uses the tab; TR-2 reads M3's fields; verify items rewritten (`AnvilCraftStatus`, M3 FR-23's printer slot rule) |


## 11. Worked examples (private fixtures, by class and level)

Computed locally from the two private fixtures, like every other spec's acceptance numbers; no names, no raw save content, only the counts the stories assert.

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

Rates on the supply maps, kills/h‡ (drop rate): The Mimic Hole: Barbarian 2,270 (1.84, excluded: pusher), Bowman 1,496 (1.78), Shaman 1,368 (1.79), Wizard 1,193 (1.78), Squire 557 (1.79). Tucked Away: Barbarian 2,092, Bowman 1,334, Shaman 1,255, Wizard 1,252, Squire 652. Every character is at 100% survivability on both maps. Bottleneck: Distilled Water by Liquid Shop, up to 3 days. Assignments (R-Q9a): Barbarian → push first, then Salty Shores (its own Fishing Role; fishing efficiency 54 against the Bowman's 54 and the Shaman's 38, the Role breaking the near tie), Bowman → The Mimic Hole, Horns waiting on the Encroaching Forest Villas door (only the Barbarian has opened it), one anvil hammer → Chain Link (the Shaman Lv 44's anvil, about 1.2 h). These Mimic Hole rates equal M2 S-stories' Sands of Time rates for three characters because both maps are capped by respawn for them; they were measured on map 52 itself. The Squire Lv 43 stays on Copper (serving). No printer (US-4).

### 11.2 Post Office, W3-early account

Hermit Can 1,966 / 1,250 ✓. Megalodon Tooth 1,010 / 2,000: Shaman Lv 54 → The Mimic Hole, 895 kills/h‡ × 21.2% × 2.19, ~2,130 kills, ~2.4 h. Distilled Water 11 / 20: a buy step (Liquid Shop: 9 for ~43 Water, ~92 held, so today), rather than ~27 h by the drops already being farmed on the Wizard Lv 73 (Sir Stache, 934 kills/h, 0.0068%, 2.29) and the pusher Squire Lv 85 (Thermister, 1,065 kills/h, 0.00825%, 2.18). Bottleneck: Megalodon Teeth. Anvil Tab 2 owned. Craft on any character with Smithing ≥ 15 (all but the Shaman, 13); hand in on the Squire Lv 85. Other Mimic Hole rates‡: Barbarian 2,360 (Role: fishing, not moved), Squire Lv 85 1,863 (pusher), Wizard 1,323 (already on a Supply), Squire Lv 51 711, Bowman 625.

### 11.3 Printer Parallel Slot Plan, W3-early account

3D Printer Lv 4: 4 slots, all used.

| Character | Sampling | Sample % | Active (per h, Toolbox) | Stored | Plan |
|---|---|---|---|---|---|
| Wizard Lv 73 | 1 | 11.2 | Forest Fibres ~18 | Forest Fibres | **take a sample at The Mimic Hole, set it active: Megalodon Tooth** (best sampler there, US-3; bonus loss 0%) |
| Squire Lv 51 | 52 | 15 | Copper Ore ~219 | Spore Cap, Copper, Iron, Gold Ore (4 of 4) | keep (stored slots full) |
| Bowman Lv 60 | 100 | 18.6 | Wakka Cherry ~15 | Wakka Cherry | keep (second-best sampler) |
| Squire Lv 85 | 24 | 12.9 | Spore Cap ~38 | Spore Cap | keep (pusher; a visit would cost push time) |
| Barbarian Lv 56 | 0 | 1.1 | none | none | can't sample (talent 0); save slot 5 is past the printer's Lv 4 |
| Shaman Lv 54 | 0 | 1.1 | none | none | can't sample (talent 0); save slot 6 is past the printer's Lv 4 |

The W2-late account has no printer (US-4).

## 12. Phased build plan

| Phase | Ships | Why first / later |
|---|---|---|
| **1** (step 8, after M6) | `items` generator and fact tables; holdings; Requirement Trees; drop, anvil and Liquid Shop effort; reachability (built here for M5); Demand with FR-13's ordered allocation (so two Walkthroughs never count the same items); a one-job-per-character planner with FR-18's exclusions and the pre-M4 fallbacks (FR-17); the Walkthrough view under the Goal card; opt-ins for the Post Office, gate-chain quests, quest-toward stamps and tool Goals; the printer Parallel Slot Plan (FR-25–FR-30) | Highest value per line of code: every quest Goal already on the Now screen becomes actionable, and what to print is the players' main printer confusion |
| **2** (after M5) | Several characters per job (FR-19) and M4's Purposes in preference 2; M5 reservation sharing; observed skilling rates (Q4); sample-size prediction once TR-7 passes | Needs M4's Purpose and M5's sweep to choose characters well |
| **3** | Gear Walkthroughs (authored gear Priority List per class line and Stage, owned with M9; equipment recipes and upgrade-stone Supplies); Parallel Slot Plans for cauldrons, traps, cog seats and worship on the same Demand; the authored default print list (Q7) | Needs authored judgment (which gear, which bubble) that doesn't exist yet |

## Verify before build

- [ ] Anvil recipe tabs: find a Toolbox or N.js source for each recipe's tab (`anvil.fact.recipe-tabs` stays tier 2 until then). Recipe unlocks: read raw `AnvilCraftStatus` and confirm its mapping on both fixtures.
- [ ] Quest hand-in reads the character's inventory, not storage (wiki or N.js), so the withdraw step is right.
- [ ] TR-7's anvil contract test against `getTimeTillCap`; the drop arithmetic is checked in M3's calibration Play Session.
- [ ] `getPrinterMulti` with the three day counters zeroed reproduces the in-game bonus after a sample (FR-27a), checked once in game.
- [ ] **By Yasser, in game (Final rulings):** the Liquid Shop's Distilled Water price after a few buys (Q6).
- [ ] `SUPPLY_MAPS_PER_LEAF = 3` within TR-8's budget on `highend.json`.

## Final rulings (Yasser, 2026-10-17)

These supersede anything above that conflicts with them.

> **Ruled by Yasser (2026-10-17, relayed by the coordinator on PR #79): yes to all nine open questions, exactly as recommended.**

- **R-Q1 Module home:** a new module, M14, reusing M2, M4, M5 and M8's pieces instead of extending one of them.
- **R-Q2 Terms:** Walkthrough, Requirement Tree, Demand, Supply, Bottleneck and Parallel Slot Plan, as in `GLOSSARY.md`.
- **R-Q3 Build order:** Phase 1 is step 8, right after M6 and before M4; Phases 2–3 come after M5 (README build order).
- **R-Q4 Skilling pace:** yes/no in Phase 1; rates observed from save history in Phase 2, labelled as measured. The 500-item threshold (FR-14) decides until then.
- **R-Q5 Row Next Actions:** a planned move shows on the character's row only when its Purpose isn't serving or the Walkthrough's parent outranks everything it serves, at most one per character (FR-21).
- **R-Q6 Liquid Shop:** summing the growing price is allowed as arithmetic on game data, with the wiki cited, counting only the Water held now. **Yasser does the in-game price check** before the first golden.
- **R-Q7 Default printing:** none in Phase 1 (Demand-driven changes only, otherwise keep); an authored per-Stage list in Phase 3.
- **R-Q8 Launch opt-ins:** `post-office.check.unlock`, M2's gate-chain quests, M8's quest-toward stamps and M4's tool-chain Goals; gear waits for Phase 3.
- **R-Q9 Role holders:** never moved off their Role activity in Phase 1 (FR-18); revisited once M5 ships. Amended by R-Q9a.
- **R-Q9a Role arbitration (owner amendment, 2026-10-17, relayed by the coordinator during the Phase 1 build; supersedes R-Q9's blanket lock and the "pusher never moves" assumption):**
  1. A character whose own Role matches a needed Supply (the Barbarian, Role Fishing, for Hermit Cans) is a candidate even when it is the pusher or busy with another Role. R-Q9 still forbids pulling a character on its Role activity onto an activity that is not one of its Roles, and M3 AFK safety still holds. Moving between a character's own Roles is allowed. Only skilling Roles (Fishing, Mining, Choppin, Catching) name a Supply; the pusher and the generic fighting Roles ("Fights AFK", "Can push portals") never make a character the owner of a farming job.
  2. Candidates are ranked by real rate: drops by Toolbox kill and drop rates; skilling by the efficiency the save exposes (Toolbox `getSkillEfficiency`, as equipped), then skill level, then the Role holder. A Lv 1 fisher never beats a trained one unless the trained one is busy with a higher-ranked job.
  3. When one character serves two Goals (the portal push and a Walkthrough job), both are kept and ordered: a job that finishes within 1 h (push kills left ÷ kill rate, or the Supply's missing ÷ rate) goes first; otherwise the higher-ranked Goal by `compareGoals` goes first. The character's step reads "finish the push (about …), then …" with the reason in a short why.
  4. Preset steps are explicit Walkthrough steps: when a job changes the character's activity, "Switch to talent preset N and card preset N (<activity>)", or "Set up talent preset N for <activity> first" / "Fill card preset N for <activity>, then switch to it" when no preset fits. Until M8 (#80) and M9 (#77) merge, the fit rules are local helpers over `walkthrough.fact.preset-fit` (`TODO(M8)`, `TODO(M9)`).
  5. Always live: everything is computed from the current save; a step whose materials are held disappears (the collapsed line counts it as done).

## Build notes (Phase 1, 2026-10-17)

Found while building Phase 1; the rules above stand, these record how the build meets them.

- **Reachability decides the Horns.** On the W2-late save only the Barbarian Lv 60 has opened the door into Tucked Away (Encroaching Forest Villas, 4,200 kills), so FR-12 never sends the Wizard Lv 56 there; the step names the door instead (US-1 step 4).
- **Fishing ponds have no door in Toolbox's map data** (like Poopy Sewers in M5 TR-4), so a skilling map counts as reachable once the character walks any map of its world. Verify in game that Salty Shores opens from the World 2 town without a kill gate.
- **M3 blockers** keep a character a candidate after every unblocked one, with "fix first" in its step: a blocker is often a one-minute fix (collect the anvil), and on a late paste every character carries one, which would otherwise freeze every assignment. A move from fighting to skilling counts as fixing a fighting-safety blocker.
- **`walkthrough.fact.supply-maps` and `printer.fact.sample-item`** are not separate tables: the worker derives the supply maps from the generated item Acquisitions at parse time (TR-3), and each drop row carries `printable` (FR-26). `walkthrough.goal.*` and `walkthrough.contribution.supply` wait for M4.
- **Anvil recipe tabs** (`anvil.fact.recipe-tabs`) list Empty Box (tab 2) and Anvil Tab 2 (tab 1) from their wiki pages; crafts.json's order matches the game only for tab 1. Any other recipe's tab gate reads "check in game".
- **The anvil Chain Link rate** is the fastest eligible anvil (the Shaman Lv 44's, about 1.2 h per hammer), not the 1.5 h of the first draft's anvil.
