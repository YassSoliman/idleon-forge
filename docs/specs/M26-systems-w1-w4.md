# M26 Systems W1-W4: every mechanic tracked, shown and guided

Spec for the owner's request of 2026-10-19: "systemise EVERY in-game mechanic of Worlds 1-4 (plus account-wide systems
and class builds) so ActiveOn can track and guide players through them", with sprites for every new view. Part of the
map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **draft for owner review, red-teamed once**
(2026-10-19: 33 findings, 6 P0; every resolution is in section 16). Per the spec-before-build rule each wave still gets
its own red team before its first PR; that red team runs only once every System FR in the wave has its user story
(section 4), and no Detector in this spec ships before it. Terms follow [`GLOSSARY.md`](../../GLOSSARY.md) plus
`GLOSSARY-ADDITIONS.md` (to merge). Decisions follow [ADRs 0001-0010](../adr/).

**Why this exists.** The M25 coverage audit answered "can't we already have all the data?" with "yes, the data is not
the bottleneck; advice is". M26 measured it. Of 1,418 W1-W4 mechanics (1,380 once the 38 W5+ rows of the Deferred
register are set aside), ActiveOn holds 651 in Account State, Toolbox parses another 673 the adapter never reads, and
only 94 need data Toolbox lacks. Yet only 22% of mechanics are shown in full and 21% advised in full. World 4 has 0
advised mechanics, and Rift, Tome and Sigils are not even registered Systems. The owner also asked whether Alchemy
covers the whole meta path ("boosts first, then bubbles, which boosts in order"); it does not, because M19 deferred
Boosts to a Phase 2 that was never scheduled. M26 closes these gaps System by System, in waves, with a findable home
for every feature (M17, "features need a home").

**Decisions this spec rests on:**
- [ADR 0002](../adr/) deterministic advice, no LLM at advice time; [0004](../adr/) source precedence, **as written**:
  game data (as extracted by Toolbox) > the IdleOn wiki if edited after the patch > dated community guides > anything
  else, and its amendment: judgment is **Contested** when two Sources dated after the current major patch disagree.
  Source tiers keep the live numbering of `schema.ts` (1 game data, 2 wiki, 3 dated community guide, 4 anything else;
  FR-2). [0005](../adr/) Toolbox numbers plus arithmetic, never our own formulas where Toolbox has one;
  [0006](../adr/) client-only SPA, parsing in a Web Worker; [0007](../adr/) generated facts, authored judgment;
  [0009](../adr/) our own pixel art only; [0010](../adr/) exact talent points.
- M17: every System has a page or tab, and every Now card links to it. M24: the 8 view rules (section 9).
- M22: truth checks run on every parse; a violation holds back only the advice it touches.
- **Two-Source rule.** A Priority or Build ships as advice only with at least two independent, dated, post-patch
  Sources (FR-2c); a Check or Goal ships only at H or M. L-confidence, single-Source or inferred orderings ship as
  display only ("No advice" lists).

**Patch.** Game 2.3.540 (Toolbox gameVer), parser pin `6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1`. Every claim was
verified on 2026-10-19 in the M26 dossiers (`scratchpad/m26/dossiers/<topic>.md`, claim registers with code path#line
or URL, tier, verified date, claim date) and the maps (`scratchpad/m26/maps/<topic>.json`). Pre-patch claims are
flagged there and in section 13. The dossiers' local copy of the game client (`N.js`) is **not** proven to be 2.3.540:
the "game v1.23" label in the dossiers comes from an update tag (`Luminous_Menagerie_v1.23`), not a version marker.
Until V43 matches it to 2.3.540, every verdict that rests on N.js alone is confidence M at most (R7).

**Fixtures.** CI never sees a private save. What CI runs on:
- Public saves `packages/account-state/fixtures/public/`. Their stages, read from the contract snapshot: `first.json`
  is the only W4 save (`currentWorld` 4, W4-entry, Breeding started); `fresh.json`, `second.json`, `third.json` and
  `fourth.json` read `currentWorld` 6, and `highend.json`, `latest.json` and the rest read 7. So **no public save is
  W1-W3**, and `fourth.json` / `highend.json` stand for "past W4, every W1-W4 System unlocked".
- **Stage fixtures** built in Wave 0.11 by a checked-in script from `first.json` (`packages/knowledge/test/fixtures/
  m26/stage-*.json`): `stage-w1-early` (one character, class level 8, no world finished, W2+ keys emptied) and
  `stage-w3-mid` (W3 finishing markers and every W4 key removed). The script asserts that Toolbox parses each one
  without an empty parse and that the M2 classifier assigns the intended Stage; a fixture that fails is rebuilt, never
  hand-edited.
- **Mutations** `m:<name>`: a public or stage fixture with the key edits a story lists, under
  `packages/knowledge/test/fixtures/m26/`.

The **W2 test account** (5 characters: Barbarian 60, Squire 43, Shaman 44, Bowman 54, Wizard 56; `currentWorld` 2)
and the **W4 test account** (6 characters: Wizard 73, Squire 51, Bowman 60, Squire 85, Barbarian 56, Shaman 54; it
reads `currentWorld` 3 because it was saved just before World 4, so it is a **late-W3** save) are private and run only
in the local truth run. Unlock guards keep every W4 Detector silent on the W4 test account as parsed; that is correct
behaviour, not a gap. A fresh save of it (Wave 0.11, owner, minutes) adds a W4-entry private case; if it slips, Wave 1
goldens come from `first.json`, `fourth.json` and `highend.json` plus mutations, and the wave is not blocked. No
character name appears in this spec, the drafts, tests or goldens.

**Inputs.** `MASTER.md` (matrix, coverage counts, build waves, conflicts, Deferred register), `SPRITES.md` (sprite
manifest), `GLOSSARY-ADDITIONS.md`, the area syntheses `synth/{W1,W2,W3,W4,AW,CL}.md`, and `kb-drafts/*.yaml`
(research notes, not loadable KB: section 7). Counts are generated by `work/count_drafts.py`: 461 draft records
(entries, facts, amendments), 452 distinct ids, 318 distinct Detector and progress ids; the script fails today on 7
duplicate and 6 malformed ids, which Wave 0.5 fixes.

## 1. Context

| Layer | Holds today (W1-W4) | M26 adds |
|---|---|---|
| Toolbox parses it | nearly everything | nothing (no vendor edit; new calls in `packages/toolbox-parsers/src/calls.ts`) |
| Adapter exposes it | 651 of 1,418 mechanics | the toolbox-only mechanics each System's advice or page needs (about 450), plus a few authored readers where Toolbox is wrong or silent |
| Engine advises on it | 304 in full, 169 partly | the 452 draft ids in `kb-drafts/` plus 78 still in the account-wide maps, converted in Wave 0.5 and promoted wave by wave after red team |
| App shows it | 309 in full, 265 partly; 28 Systems with a page | about 40 new pages or tabs, every one with an answer frame |

## 2. Goals and non-goals

**Goals**
- G1. Every W1-W4 System and every account-wide System is in the registry, has a findable home (page or tab), and its
  page answers "what do I do here now" in the first screen. **Test:** the registry-completeness test (FR-0b) fails the
  build when a `systems.yaml` System lacks a `SYSTEM_HOMES` or a `pages.ts` entry.
- G2. Every mechanic in the MASTER matrix is either tracked (Account State with provenance and a contract test), shown,
  advised, listed under "No advice" with the reason (L Source, disputed, single Source), or in the Deferred register.
  **Test:** the matrix-completeness test (FR-0b) fails on an Appendix A row that maps to nothing.
- G3. World 4 first: an account entering W4 gets real advice for the Lab, Cooking, Breeding, the Rift, the Tome and its
  elite classes (Wave 1); Sigils follow in Wave 2, once the Alchemy page they live on is rebuilt.
- G4. Alchemy covers its whole meta path: Boosts (shown, display only), new bubbles, bubble levels, big bubbles, vials,
  liquids, the Liquid Shop and sigils.
- G5. Every new view uses our own sprites (`SPRITES.md`), the M24 rules and the colour meanings. **Test:** the sprite
  key test and the per-grid snapshot tests (section 10).
- G6. No double advice: one card per thing (the "claimed by" rule, FR-5).
- G7. Every stage gets value early: what fires on a W2 save today ships in Waves 2-3, and W1 core pages ship in Wave 4.

**Non-goals**
- N1. W5+ content (Sailing, Divinity, Gaming, Farming, Sneaking, Summoning, W5+ classes, the Gallery, Crucible). The
  rows are in the Deferred register (MASTER Appendix B) with a flag: **grey later** (drawn greyed where a page needs
  them for context) or **omit**. Never advised; excluded from coverage percentages and effort roll-ups.
- N2. Any write toward the game, any automation, any backend (AGENTS.md).
- N3. Real-money and gem-spend advice (bundles, gem buy orders). Gem Shop items show owned / not owned with the
  `gemShop.json` price only. The two M-confidence Gem Shop Checks that stay (FR-73) claim free or 1-gem items. Drafted
  gem buys `alchemy.check.bleach-first` and `forge.check.brimstone-first-slots` are excluded.
- N4. Orderings with only L, single-Source or inferred support: salt rank order, atom order, Equinox upgrade order,
  shrine build order, set value order, talent orders past the shipped Builds, Boost order and the roll-vs-Boost switch
  point, Lab chip picks, Island unlock order, Bubba gift and milestone orders, Killroy runner and Skull Shop orders, meal
  order, key use, bribe set order. Display only.
- N5. Outbound messages to Toolbox or anyone else. Upstream bug reports (section 13, Q8) are drafted for the owner.

## 3. Scope and ownership

The build runs in eight waves (MASTER.md section 4, revised after the red team). Each wave is one or more PRs per
System, one concern each, branched from `main`, opened as drafts, merged by the owner. Two ordering rules from the red
team: **a hook lands with its home page** (no item builds into a page a later wave creates or rebuilds), and
**cross-link chips land with their target page**.

| Wave | Content | FRs | Folders (new code) |
|---|---|---|---|
| 0 Foundations | stage bands first, `draft` status, tier policy and lints, game-client Sources, draft conversion, Rift label, claimed-by, unlock guards and registry rows, correctness fixes, sprite grids and tests, stage fixtures and fresh W4 save, completeness tests, size baseline | FR-0a..FR-10 | `packages/knowledge/src`, `packages/engine/src/now`, `packages/account-state/src`, `packages/toolbox-parsers/src`, `apps/activeon/src/art/sprites` |
| 1 World 4 core | Rift (with the Ruby Cards, Vial Mastery, Gilded and Skill Mastery value feeds), Lab, Breeding, Cooking, Tome, Elite classes; hooks on existing pages (Gilded Stamps, Skill/Smithing Mastery, Lab rotation row) | FR-11..14, 16, 17, 18a | `packages/engine/src/world4/`, `packages/account-state/src/{rift,tome,elite}*.ts`, `apps/activeon/src/systems/w4/` |
| 2 W2/W3 gaps | salt adapter slice; Alchemy (Boosts board, bubbles + third slot, vials incl. 42-51, liquids), Sigils tab, Stats, Class kit, Forge, Task Board (incl. W4 board), quick wins | FR-15, 19..27, 18b | `packages/engine/src/alchemy/`, `packages/engine/src/classes/`, `packages/engine/src/w1/forge/`, `packages/account-state/src/salt*.ts`, `apps/activeon/src/alchemy/` |
| 3 Every stage | AFK Setup, Food, Storage, Skills (with progression), Class EXP, Dungeons, Talents, Drop rate | FR-59..63, 65, 66, 66a, 68 | `packages/engine/src/account/`, `apps/activeon/src/systems/pages/` |
| 4 W3 core + W1 core | Equinox, Death Note, Salt Lick page, Atom Collider, Prayers, Shrines, Worship and TD; Bribes, Statues, Owl, Post Office, Boss Keys, Beginner line | FR-28..34, 48, 49, 51..53, 78 (Beginner) | `packages/engine/src/w23/`, `packages/engine/src/w1/`, `apps/activeon/src/systems/{w23,w1}/` |
| 5 W2 + W3 rest | Obols, Islands, Killroy, Weekly Battles and Ballot, Arcade, Cards; Cog Board, Printer, Refinery, Trapping, Library, Armor Smithy (incl. W4 sets), Bubba | FR-35..47 | `packages/engine/src/{w2,w23}/`, `apps/activeon/src/systems/{w2,w23}/` |
| 6 W1 rest | Star Signs (incl. W4 constellations D-1..D-7), Colosseum, Minigames and Poppy, Quests, Anvil, Upgrade Vault | FR-50, 54..58 | `packages/engine/src/w1/`, `apps/activeon/src/systems/w1/` |
| 7 Late account-wide | Coins, Achievements, Pet Park, Family, Guild, Gem Shop, Friend bonuses, Event Shop, Trophies, Town shops, Checklist, class lines | FR-64, 67, 69..77, 78 | `packages/engine/src/account/`, `apps/activeon/src/systems/pages/` |

**In scope:** every System row of MASTER.md section 3; their pages; their Detectors and draft entries; the Account State
fields they need; their sprites; the correctness fixes found by the maps.

**Out of scope (owner):** N1-N5 and the Deferred register; voting advice on the Ballot (D-4); Arcade spend advice until
`arcadeNextCost` is checked against upstream.

**Existing KB files and their M26 home.** Every live `packages/knowledge/systems/*.yaml` file has one owner in M26;
nothing is orphaned or double-owned. *Extend* = the FR adds or amends entries (merge, never copy, section 7);
*unchanged* = M26 reads it and does not edit it.

| Live file(s) | M26 FR | Action |
|---|---|---|
| `afk` | FR-59 | extend |
| `alchemy`, `alchemy-bubbles`, `alchemy-vials`, `alchemy-p2w` | FR-19..22 | extend (`alchemy-p2w.priority.order` becomes Contested) |
| `anvil`, `anvil.facts` | FR-27, FR-57 | extend |
| `arcade` | FR-46 | extend |
| `armor-smithy` | FR-40 | extend (`check.register` is a revision of the live id) |
| `ballot`, `weekly-battles` | FR-45 | extend |
| `boss-keys` | FR-53 | extend |
| `bubba`, `bubba.facts` | FR-41 | extend (`bubba.fact.charisma-targets` collides: merge as an edit) |
| `cards`, `cards.facts` | FR-47, FR-27 | extend |
| `checklist`, `checklist.facts`, `random-events` | FR-77 | extend |
| `classes` | FR-24, FR-63 | extend |
| `colosseum` | FR-54 | extend |
| `construction`, `construction.facts` | FR-27, FR-35 | extend |
| `death-note` | FR-29 | extend (`contribution.skull` collides: merge as an edit) |
| `gear`, `gear.facts` | FR-57, FR-75 | extend |
| `gem-shop` | FR-73 | extend |
| `guild` | FR-71 | extend |
| `killroy` | FR-44 | extend |
| `library` | FR-39 | extend |
| `map.facts` | FR-59 | unchanged (read for boss gates) |
| `merit-shop`, `task-board`, `task-unlocks` | FR-26 | extend |
| `metapath`, `metapath.facts` | FR-17, FR-70 | extend through `metapath.patch` (edits to named entries) |
| `minigames`, `poppy` | FR-55 | extend |
| `obols`, `obols.facts` | FR-42 | extend |
| `pets`, `pet-tournament` | FR-69 | `pets` extend; `pet-tournament` unchanged, homed on the Tournament tab (US-74) |
| `portals` | FR-59 | unchanged (door progress reads it) |
| `post-office` | FR-52 | extend |
| `printer` | FR-36 | extend |
| `refinery`, `refinery.facts` | FR-37 | extend |
| `roles` | FR-20 | unchanged (read for big-bubble fit) |
| `skills`, `skills.facts` | FR-66, FR-66a | extend |
| `slots` | FR-36, FR-38 | unchanged (parallel-slot fill order) |
| `spend` | FR-27, FR-48 | extend (amendments) |
| `stamps`, `stamps.facts` | FR-18a, FR-27 | extend |
| `star-signs`, `star-signs.facts` | FR-50 | extend |
| `systems.facts` | FR-6 | extend (registry rows) |
| `talent-presets`, `talent-resets`, `talents`, `talents.facts` | FR-24, FR-65, FR-78 | extend (`talents.build.hunter-fighting` collides: merge as an edit) |
| `trapping`, `trapping.facts` | FR-38 | extend |
| `upgrade-vault` | FR-27, FR-58 | extend |
| `walkthrough`, `walkthrough.facts` | FR-11, FR-17 | extend (W4 Welcome steps) |
| `worship`, `worship.facts` | FR-34 | extend |

## 4. User stories

Every System FR has at least one story; each wave's red team runs only once its stories exist. Story format:

- **Tag** `[FR · Wave · Stage band · status]`. Status is **testable** or **blocked: V-n / Q-n** (the item must settle
  before the story's golden is recorded; until then the entry stays draft or ships display only).
- **Given** a CI fixture (public, stage or mutation `m:<name>`, see Fixtures); private test accounts appear only as
  "local:" truth-run cases. **Then** the Check id, how many findings, and the exact rendered string. `{x}` in a string
  is filled from the named Toolbox value or Account State field of that fixture and asserted equal to it; the mutation
  sets every other value shown.
- Unless a story says otherwise, a Check is **unknown** (never advice) when its Account State field is null, the page
  shows "Can't read your save right now" on an empty parse, and character references render as class and level
  ("Wizard Lv 60"), never a name.

**Stage stories** (asserted in every wave for that wave's Systems):
- **US-S1 Locked stays silent.** [FR-6 · all · W1-early · testable] Given `stage-w1-early`, Then no finding from any
  System whose unlock fact is false (every W2+ System, plus Owl, Post Office, Colosseum before their quests); the
  count of such findings is 0, and each such page shows its locked card.
- **US-S2 W3-mid.** [FR-6 · all · W3-mid · testable] Given `stage-w3-mid`, Then no W4 System finding fires, Killroy
  rooms open = 1, and the W1-W3 findings equal those of `first.json` minus the W4 ones.
- **US-S3 Beyond W4.** [FR-3 · 0 · W4-late · blocked: FR-3 bands] Given `highend.json`, Then every entry with `to:`
  `W4-entry` or later and no `stopsAt` stays applicable (count of such entries applicable on `highend.json` equals the
  count on `first.json`), and `W4-late` entries apply.

### World 4 core (Wave 1)

- **US-1 Open the Rift.** [FR-11 · 1 · W4-entry · blocked: V1 (unlock key)] Given `m:first-rift-locked` (`Rift[0]` 0,
  Rift Ripper quest step 1 not done, 2 of the 3 quest items held), Then `rift.check.unlock-quest` fires once: "Finish the
  Rift Ripper's quest 'Entering The Rift...' in World 4: {missing}" with {missing} the one item not held, and links to
  the Rift page's locked card. Silent on `highend.json`; silent on `stage-w3-mid`; unknown when quests are null.
- **US-2 AFK or play this Rift level.** [FR-11 · 1 · W4-entry · blocked: V1] Given `m:first-rift-afk` (stored level 0,
  task kind `afk`, progress 0, nobody on `riftAll`), Then `rift.check.afk-task`: "Rift level 1 wants {quota} AFK kills
  (0 so far): AFK a fighter on The Rift", {quota} from the generated `rift.fact.levels`. Kind active, score or
  multi-character: `rift.check.active-task` instead. Quota met with 2 characters still on `riftAll`:
  `rift.check.quota-done`: "Rift level 1 task looks complete: 2 characters are still AFK on The Rift for it" (neutral
  until V1 says whether `Rift[0]` advances by itself).
- **US-3 Class-gated Rift level.** [FR-11 · 1 · W4-entry · blocked: V1] Given `m:fourth-rift-gate` (stored level on the
  first Divine Knight Orb gate from `rift.fact.levels`, every Divine Knight reset to Squire), Then
  `rift.check.class-gate`: "Rift level {riftLabel(level)} is a {score} score on a Divine Knight, and nobody on the
  account is one".
- **US-4 First Lab upload.** [FR-12 · 1 · W4-entry · testable] Given `m:first-lab-empty` (nobody on the Lab AFK Target),
  Then `lab.check.first-upload`: "Set two spare characters' AFK target to the Laboratory and line them up toward {node}"
  with {node} the nearest unlit node of `lab.fact.node-reach`; the Board tab shows "+{gap} px short" computed from each
  character's Line Width read from `lab.playersCords` (`50 + 2 x Lab level` plus percent groups, never a fixed 50 px).
  Silent once one character is uploaded; silent on `fourth.json`.
- **US-5 Lab chain broke.** [FR-12 · 1 · W4-mid · testable] Given previous `fourth.json` and current
  `m:fourth-lab-drop` (one connected character moved off the Lab), Then `lab.check.chain-broke`: "{node} went dark when
  {class} Lv {level} left the Lab". Given no previous save, or a previous save whose compared sub-fields
  (`lab.characters`, `lab.bonuses`) do not validate, Then silent (FR-7).
- **US-6 Weekly Lab shop.** [FR-12 · 1 · W4-mid · blocked: V4 (rotation index)] Given `m:fourth-lab-shop` (Repository
  open, one unclaimed affordable chip, `now` a Tuesday), Then `lab.check.weekly-chip`: "Buy {chip} in the Chip
  Repository before Thursday"; silent once claimed; unaffordable: no card, the tab shows "short by {n}".
- **US-7 Full nest.** [FR-13 · 1 · W4-entry · testable] Given `m:first-nest-full` (eggs 4, capacity 4), Then
  `breeding.check.full-nest`: "Your nest is full (4 of 4): breed or trash an egg"; with `breeding.started` false the
  detail line reads that the first breed is always a Green Mushroom. Fires on `first.json` and the fresh W4 save; both
  private accounts as parsed are silent (Breeding locked), which is correct.
- **US-8 Multiplier unlocks.** [FR-13 · 1 · W4-mid · blocked: V5] Given `m:fourth-breeding-mult` (game upgrade index 3
  at level 0, Breeding level at its opens-at), Then `breeding.check.multiplier-unlock`: "Buy level 1 of {upgrade}: it
  switches on a new-Mob multiplier", {upgrade} the name of game index 3; contract tests pin indices 3/5/7/10.
- **US-9 Idle kitchen.** [FR-14 · 1 · W4-entry · testable (spice variant blocked: V6)] Given `m:first-kitchen-idle`
  (kitchen 1 idle, a discovered meal below max), Then `cooking.check.idle-kitchen`: "Kitchen 1 is idle: start {meal}"
  with {meal} the fastest-to-level meal. Fires on `first.json` and the fresh W4 save only.
- **US-11 Tome score.** [FR-16 · 1 · W4-entry · blocked: V7] Given `first.json`, Then the Tome hero shows "{pts} PTS"
  equal to Toolbox `tome.totalPoints` and "{counted} of {total} metrics counting"; `tome.goal.unlock-metric` lists the
  next three Account-LV gates: "Reach Account LV {gate} ({levels} to go): {metric} starts counting, +{pts} PTS". Given
  `m:first-acctlv-300` (Account LV below 350), Then the hero shows "0 PTS counting" and every row reads "not counting
  yet" (Toolbox pays no Tome PTS below 350, `tome.ts#L44,#L54`).
- **US-12 Eliteus step.** [FR-17 · 1 · W4-entry · blocked: V8, V44; confidence M] Given `m:fourth-eliteus` (a Squire-
  line subclass Lv 85 with `Eliteus1` not done), Then `elite-classes.check.eliteus`: "Defeat the Greenie Gang on
  Outskirts of Fallstar Isle to become a Divine Knight"; the step-2 "pick" text ships only once V44 traces the step
  keys; silent once `classIndex` is the elite; one card per character, merged with `metapath.goal.elite`.
- **US-38 Gilded Stamps.** [FR-18a · 1 · W4-mid · testable] Given `m:fourth-rift-25` (stored Rift 25, 2 Gilded Stamps
  banked), Then `stamps.check.gilded-banked`: "Use a Gilded Stamp on {stamp}: its cap raise drops from {full} to
  {gilded} {material}" and the Stamps page labels the roll "Rift 26". Stored 24: silent.
- **US-39 Skill Mastery banked.** [FR-18a · 1 · W4-mid · testable] Given `m:fourth-rift-14` (stored 14), Then the Skills
  tab Mastery row reads "banked until Rift 16" and `skills.goal.smithing-mastery` is silent; stored 15: the row shows
  live tiers and the Goal renders "Total Smithing {total} -> {target} for Skill Mastery rank {rank}".

### W2 and W3 gaps (Wave 2)

- **US-83 Salt held.** [FR-21b · 2 · W3-early · testable] Given `m:fourth-salts` (100 Redox Salts in the chest, 40 in
  Refinery storage), Then `account.salts` reads chest 100 and refinery 40 for that salt (contract test against the raw
  save), and `construction.check.bar-full-unpaid` counts only the chest 100 as payable.
- **US-13 Cauldron Boosts board.** [FR-19 · 2 · W2-mid · testable] Given `m:first-cauldron` (Power cauldron with 8
  bubbles unlocked, Speed Boost 2), When I open Alchemy > Cauldrons, Then the Boosts board shows "Speed 2 / 170" and the
  two-bar comparison "a new bubble ~{X} brew / Speed to 5: {Y} brew" with X and Y from the cauldron's brew per roll and
  Boost costs; **no Now card** (`alchemy-bubbles.check.boost-speed` is display only: no Source gives a switch point).
- **US-14 Luck Boost odd levels.** [FR-19 · 2 · W2-mid · testable] Given `m:first-luck-2` (Luck 2, next level
  affordable, unlockable bubbles left), Then `alchemy-bubbles.check.luck-odd`: "Brew {cauldron}'s Luck Boost to level
  3 ({brew} brew)". Given Luck 3, Then silent and the cell reads "next level does nothing". The factor
  `round(10(1+0.05L))/10` steps up exactly on odd L (checked for L = 0..170).
- **US-40 Big bubbles.** [FR-20, FR-18b · 2 · W2-late · testable] Given `m:fourth-role-bubble` (a character whose AFK Target is
  a Construction building wears no Construction big bubble), Then `alchemy-bubbles.check.fill-slot-role`: "Equip
  {bubble} in a big-bubble slot"; the Big bubbles tab header reads "{n} of 3 slots: 3rd at arena wave 100". Given
  `m:first-arena-60`, Then `alchemy-bubbles.goal.third-slot`: "Reach Pet Arena wave 100 for a 3rd big-bubble slot
  (wave 60 now)".
- **US-15 W4 vials visible.** [FR-21, FR-18b · 2 · W4-entry · testable] Given `first.json`, Then the 10 tiles of vial idx
  42-51 render at full opacity; given `stage-w3-mid`, Then the same 10 render dimmed with "later", never hidden; idx
  52-85 render grey "later" on both.
- **US-41 Liquid at cap.** [FR-22 · 2 · W2-mid · testable] Given `m:fourth-water-cap` (liquid 0 at its cap), Then
  `alchemy.check.liquid-cap-other`: "Spend {liquid} on bubbles, vials, the Liquid Shop or Decant" with {liquid}
  Toolbox's name for liquid 0, never a blocker; the Liquids tab rate breakdown shows the Salt Lick #6 term from the
  Wave 2.0 adapter.
- **US-10 Sigils earn nothing.** [FR-15 · 2 · W4-entry · blocked: V3] Given `m:fourth-sigils-off` (Lab node 12 dark, a
  Wizard Lv 60 seated on a sigil), Then `sigils.check.lab-off`: "Connect Sigils of Olden Alchemy in the Lab, or move
  Wizard Lv 60 off {sigil}"; unknown when `account.sigils.labOn` is null.
- **US-18 Hit chance.** [FR-23 · 2 · W3-late · blocked: V14] Given `m:first-hit-short` (a fighter's accuracy stat lowered
  until Toolbox hit chance is below 100% on a monster-curve map), Then `stats.check.hit-chance-short`: "Raise accuracy:
  {hit}% hit chance on {map}" with {hit} = `combat.hitChance` rounded down; the detail gives the +50 / +100 clone
  results. A mining character below 100% (resource curve) is silent; `combat` null is unknown. local: the W4 test
  account Squire at 36%.
- **US-16 Talent past its bubble.** [FR-24 · 2 · W3-late · blocked: V42; confidence M] Given `m:fourth-fuscia` (a Wizard
  with Fuscia Flasks 14 and Mage Is Best 1), Then, only if V42 confirms the `min()` reading,
  `classes.check.fuscia-over-bubble`: "Fuscia Flasks 14 only counts up to Mage Is Best 1". Until then the kit row shows
  both dossier readings ("max raised by min(14, 1)" vs "helps only past bubble 100") and no Check fires.
- **US-17 Idle Casting 0.** [FR-24 · 2 · W2-mid · testable] Given `m:first-idle-casting` (a Wizard Lv 20 fighting AFK
  with Idle Casting 0), Then `classes.check.idle-casting-zero` fires exactly once for that character: "Idle Casting is
  0 while Wizard Lv 20 fights AFK" (no Shaman duplicate). local: every fighting Mage on the W2 test account.
- **US-20 Forge slots idle.** [FR-25 · 2 · W1-mid · testable] Given `m:fourth-forge-idle` (4 slots unlocked by New Forge
  Slot level, all 4 empty, Copper Ore held), Then `forge.check.fill-empty-slots`: "Fill 4 empty Forge slots with Copper
  Ore"; a locked empty slot is not counted. local: the W2 test account (6 of 6).
- **US-21 Claim task tiers.** [FR-26 · 2 · W2-mid · blocked: V13 (columns only)] Given `m:fourth-task-tier` (one task
  stat past its next tier), Then `task-board.check.claim`: "Claim 1 task tier ({merits} merits, {points} task points)";
  a reset-on-claim task carries the flag in its detail line.
- **US-19 Coins outrun stamp caps.** [FR-27 · 2 · W2-late · testable] Given `m:first-coins` (coins above the total cost
  of every owned stamp below cap, one capped stamp's raise payable and carryable), Then `stamps.check.coins-outrun-caps`:
  "{capped} of {owned} stamps are at their cap; raise {ready} caps you can pay now to keep buying levels" with the three
  counts asserted from the fixture; links to the Stamps At-cap list.
- **US-24 Unpaid building.** [FR-27 · 2 · W3-mid · testable after Wave 2.0] Given `m:first-build-full` (two slotted
  buildings with a full bar below max level, their salt held per `account.salts`), Then
  `construction.check.bar-full-unpaid`: "Upgrade the {building} in the Build menu: its next level is built" for the
  lower index, detail "and 1 more"; silent when it is the `construction.check.build-next` item.
- **US-35 Class lines page.** [FR-24 · 2 · all · testable] Given `first.json`, When I open Systems > Classes, Then four
  line cards place every character on its step by `classIndex`; each subclass shows the Eliteus step greyed with the
  W4 gate; W5+ classes greyed.

### Every stage (Wave 3)

- **US-43 Can't hit its monster.** [FR-59 · 3 · W1-mid · testable] Given `m:first-afk-nohit` (a fighter on a map where
  Toolbox hit chance is 0), Then `afk.check.no-hit` (blocker): "Move off {map}: it can't hit {monster}". Mining and
  other skill characters are silent.
- **US-32 Golden food unequipped.** [FR-60 · 3 · W2-mid · testable] Given `m:fourth-golden` (one Golden Nomwich in
  storage, a character with a certainly unlocked empty food slot), Then `food.check.golden-unequipped`: "Equip Golden
  Nomwich in a food slot (+{bonus} {stat})" with {bonus} from Toolbox `getPlayerFoodBonus` on the food clone. local:
  the W4 test account names Golden Nomwich first.
- **US-33 Storage full.** [FR-61 · 3 · W1-late · testable] Given `m:first-chest-full` (every chest slot used), Then
  `storage.check.chest-full`: "Your Storage Chest is full ({slots} of {slots}): free a slot or add one", and the demoted
  `afk.check.skiller-carry` points to it. local: the W2 test account (91 of 91).
- **US-44 Harvest at zero.** [FR-66 · 3 · W1-early · testable] Given `m:first-harvest-zero` (a miner AFK on a node above
  its Mining level), Then `skills.check.harvest-zero` (blocker): "Move to a node you can harvest: {target} is too tough".
  Harvest-chance numbers stay display only until Q10's amendment and V40.
- **US-45 Next tool, door or quest.** [FR-66a · 3 · W1-early · testable once the FR-66a facts are generated] Given
  `stage-w1-early` (a miner at Mining 8 with the starter pickaxe), Then the Skills page "Next" row reads "Mining 10:
  next mine door" and "Next pickaxe: {tool} at Mining {lv} ({gap} levels)"; Given Mining 11 with Glumlee's quest not
  done, Then `skills.goal.quest-unlock` names the quest and the talent book it opens.
- **US-46 Lowest level tied.** [FR-63 · 3 · W2-early · testable] Given `m:first-lowest-tie` (the two lowest characters, a
  Squire and a Bowman, both Lv 30), Then `classes.check.lowest-level-tie`: "Squire and Bowman are both Lv 30: neither
  gets the lowest-level Class EXP bonus".
- **US-36 Dungeon trait.** [FR-68 · 3 · W2-early · blocked: V36] Given `m:first-traits` (rank 1, every trait slot -1),
  Then `dungeons.check.trait-pick`: "Pick a {set} trait at the dungeon entrance ({open} open sets have no pick)" with
  {set} the Beginner trait set. local: both test accounts.
- **US-47 Talent breakpoint.** [FR-65 · 3 · W2-mid · testable] Given `m:fourth-throttle-12` (a Squire-line character
  with Refinery Throttle 12, between two breakpoints), Then `talents.check.breakpoint`: "Refinery Throttle pays every
  {step} levels: stop at {prev} or go to {next}" with step, prev and next from Toolbox's talent breakpoint data for
  level 12.
- **US-48 Loot farmer.** [FR-62 · 3 · W2-mid · testable] Given `fourth.json`, Then `drop-rate.goal.loot-farmer`: "Raise
  drop rate on the {class} Lv {level}: {total}x now" for `account.dropRate.bestFighterIndex`, {total} Toolbox
  `getDropRate` to two decimals.

### World 3 core and World 1 core (Wave 4)

- **US-22 Equinox locked.** [FR-28 · 4 · W3-early · blocked: V16 (copy)] Given `m:first-equinox-locked` (no Mirror, no
  Equinox_Visitor, every Dream Upgrade 0), Then the Equinox page shows the locked card and `equinox.goal.find-mirror`:
  "Farm Bloodbone in Hell Hath Frozen Over for the Equinox Mirror"; `equinox.check.spend-bar` is silent although Toolbox
  reports `equinox.unlocked` true.
- **US-26 Death Note cheap point.** [FR-29 · 4 · W3-mid · blocked: V22 (labels)] Given `m:fourth-dn-cheap` (building Lv
  1, a reachable page monster nobody fights, fewest kills from its next rank), Then `death-note.check.cheap-point`:
  "{monster} is {left} kills from its next Death Note point ({rank}): move a fighter there". Building Lv 0: silent.
- **US-49 Build the Salt Lick.** [FR-30 · 4 · W3-early · testable] Given `m:stage-w3-mid-saltlick` (Salt Lick level 0, 20
  Explosive Salts held), Then `salt-lick.check.build`: "Build the Salt Lick: its first upgrade raises 3D Printer sample
  size"; silent while `construction.check.build-next` names it.
- **US-50 Hydrogen full.** [FR-31 · 4 · W3-late · testable] Given `m:fourth-hydrogen` (Hydrogen at its 90% cap), Then
  `atom-collider.check.hydrogen-full`: "Hydrogen is at its 90% cap: raise a stamp cap now".
- **US-25 Unending Energy.** [FR-32 · 4 · W3-mid · testable as Contested; in-game check pending] Given
  `m:fourth-unending` (Unending Energy equipped, away 11 h at `now`), Then `prayers.check.unending-overnight` (Contested
  next-action, "sources disagree" badge): "{class} Lv {level} has Unending Energy on and has been away 11 h: AFK gains
  may have stopped at 10 h (sources disagree)"; never a Verdict blocker.
- **US-23 Idle shrine.** [FR-33 · 4 · W3-mid · blocked: V20] Given `m:fourth-shrine-idle` (a shrine on a map no
  character AFKs on; World Tour counted), Then `shrines.check.idle`: "Move the {shrine} to {bestMap}".
- **US-51 New totem.** [FR-34 · 4 · W3-mid · testable] Given `m:fourth-totem-new` (Clash of Cans open, best wave 0),
  Then `worship.check.play-new-totem`: "Summon Clash of Cans once with your {class} Lv {level}: until it has a best
  wave it pays nothing".
- **US-52 Bribes bought.** [FR-48 · 4 · W1-early · testable] Given `stage-w1-early`, Then `bribes.goal.bought`: "Bribes
  {owned} of {obtainable} · Set {open} open · {coinsLeft} left in open sets" with the values from the fixture;
  `bribes.priority.set-order` never reaches Now (display only).
- **US-31 Statues held, cannot deposit.** [FR-49 · 4 · W1-mid · testable] Given `m:first-statue-held` (a character
  holding statues with Town Marble quest 1 not done), Then `statues.check.town-marble`: "Buy Sculpting Tools in the W1
  town shop and give them to Town Marble on {class} Lv {level}".
- **US-53 Start Orion.** [FR-51 · 4 · W1-early · testable] Given `stage-w1-early` (Owl not started), Then `owl.check.start`:
  "Visit Orion at the Grand Owl Perch in Blunder Hills and follow the HOOT popups"; silent on `first.json`.
- **US-54 Silver Pens.** [FR-52 · 4 · W1-mid · testable] Given `m:first-pens` (3 Silver Pens in a bag), Then
  `post-office.check.add-silver-pens`: "Add 3 Silver Pens from your bags to the Post Office".
- **US-55 First boss clear.** [FR-53 · 4 · W1-early · testable] Given `m:stage-w1-early-key` (one Key1 held, boss 1 never
  cleared), Then `boss-keys.check.first-clear`: "Spend 1 {key} on Normal {boss} for the {crystal}" with Toolbox's names
  for Key1, boss 1 and its portal crystal.
- **US-56 Become a Journeyman.** [FR-78 · 4 · W1-early · testable] Given `stage-w1-early` (a Beginner Lv 8, Rocklyte
  quests not done), Then the Beginner line page places it on step 1 and `journeyman-line.goal.rocklyte` renders its
  `values` text for the first undone Rocklyte quest.

### World 2 and the rest of World 3 (Wave 5)

- **US-28 Strictly better obol.** [FR-42 · 5 · W2-mid · blocked: V24 (scope)] Given `m:fourth-obol-better` (a stored
  obol of the same shape whose every summed line is >= the equipped one and one line is greater), Then
  `obols.check.swap-better`: "Swap the {stored} from storage in for the {equipped} on {where}"; any worse line: silent.
- **US-27 Islands how-to.** [FR-43 · 5 · W3-mid · testable] Given `m:stage-w3-mid-fishing22` (best Fishing 22, no island
  unlocked, raw island counters non-zero), When I open the Islands page, Then one card reads "Reach Fishing 30, then
  walk to the end of the Deepwater Docks" with "best Fishing 22 / 30", and no island Check fires.
- **US-29 Killroy rooms (regression test).** [FR-44 · 5 · W3-mid · testable] Given `stage-w3-mid`, Then rooms open = 1
  although Toolbox `getKillRoy` returns 2; given `m:fourth-ola227` (`OLA[227]` = 1), Then 3. ActiveOn already reads
  this right; the test guards it.
- **US-57 Weekly Battle attempt.** [FR-45 · 5 · W2-late · blocked: V26] Given `m:fourth-weekly-2` (best difficulty 2
  this week, today's attempt unused), Then `weekly-battles.check.daily-attempt`: "Fight the Weekly Battle again today
  (best this week: 2 of 5)".
- **US-58 Launch Arcade balls.** [FR-46 · 5 · W2-mid · testable (Gold Balls blocked: V27)] Given `m:fourth-balls` (balls
  at the cap), Then `arcade.check.launch-balls`: "Launch your {balls} Arcade balls at the Arcade" with {balls} from the
  fixture; `arcade.check.spend-gold-balls` silent until V27.
- **US-59 Card levels.** [FR-47 · 5 · W2-early · testable] Given `fourth.json`, Then `cards.goal.total-levels`: "{levels}
  total card levels · {owned} cards found", both equal to sums over Toolbox `cards`; the header star cap reads from the
  Wave 1.1 `cards.fact.star-cap` feed.
- **US-60 Free Cog Board squares.** [FR-35 · 5 · W3-mid · testable] Given `m:fourth-cog-free` (3 free squares, 3 cogs in
  inventory), Then `construction.check.cog-fill-square`: "Put 3 cogs from your cog inventory on the free Cog Board
  squares", claimed after `cog-seat-free` (one card).
- **US-61 Empty printer slot.** [FR-36 · 5 · W3-early · testable] Given `m:fourth-print-empty` (character 0 prints, 1 of
  2 active slots empty, a stored sample), Then `printer.check.empty-active-slot` renders `values.swap`: "Set {item}
  active in the {class} Lv {level}'s printer slot".
- **US-62 Salt deficit.** [FR-37 · 5 · W3-mid · testable] Given `m:fourth-salt-deficit` (a salt burning more of its
  predecessor than the predecessor makes per hour), Then `refinery.check.salt-deficit`: "Rank up {previous} before
  ranking {salt} again".
- **US-63 Free trap slots.** [FR-38 · 5 · W3-early · blocked: V21] Given `m:fourth-traps` (2 of 4 traps placed), Then
  `trapping.check.free-slots`: "Place 2 more traps: 2 of 4 out".
- **US-64 Build the Library.** [FR-39 · 5 · W3-early · testable] Given `m:stage-w3-mid-library` (12 checkouts waiting,
  building level 0), Then `library.check.build`: "Build the Talent Book Library: 12 checkouts are waiting".
- **US-65 Finish an armour set.** [FR-40 · 5 · W3-mid · testable] Given `m:fourth-set-missing` (one piece of a W3 set
  missing on the wearer), Then `armor-smithy.goal.next-set`: "Finish the {set} set: craft {item}".
- **US-66 Frozen Dice.** [FR-41 · 5 · W3-late · testable] Given `m:fourth-dice` (dice total below best, Dice Roll
  affordable), Then `bubba.check.dice-reroll`: "Buy Dice Roll in Bubba to reroll your dice ({total} now, best {best})";
  `bubba.priority.gifts` never reaches Now.

### The rest of World 1 (Wave 6)

- **US-30 Claim-ready constellation.** [FR-50 · 6 · W1-late · blocked: V30] Given `m:first-constellation` (a progress
  row with every letter recorded, not claimed, Telescope quest done), Then `star-signs.check.claim-ready`: "Click star
  {name} at {map} (W{world}): {points} Star Chart Points are waiting"; without the Telescope quest the Telescope Goal
  leads instead.
- **US-67 First Colosseum run.** [FR-54 · 6 · W1-mid · testable] Given `m:first-colo` (10 tickets, no score in arena 1),
  Then `colosseum.check.first-run`: "Run the {arena} Colosseum: you hold 10 tickets and have no score there".
- **US-68 Spiketrap round.** [FR-55 · 6 · W1-mid · testable] Given `first.json`, Then `minigames.goal.spiketrap-round`:
  "Reach round 13 in Spiketrap Surprise (best {value})" with {value} from the fixture; given `m:first-poppy` (Fisheroo
  Reset affordable), Then `poppy.check.fisheroo-reset`: "Fisheroo Reset {next} is affordable at Poppy".
- **US-69 Unique quests.** [FR-56 · 6 · W1-mid · testable] Given `first.json`, Then `quests.goal.unique-quests`: "{done}
  unique quests done · Tome {tomePoints} of 500".
- **US-70 Next Anvil tab.** [FR-57 · 6 · W1-early · blocked: V33] Given `stage-w1-early`, Then `anvil.goal.next-tab`:
  "Craft Anvil Tab 2"; a single-slot save with a bare-number `AnvilPAselect` parses (contract test).
- **US-71 Knockout target.** [FR-58 · 6 · W1-mid · testable] Given `fourth.json`, Then
  `upgrade-vault.check.knockout-target`: "Knock out {target} with no weapon equipped (Knockout! {progress}/{ladder})".

### Late account-wide and class lines (Wave 7)

- **US-72 Gold set.** [FR-64 · 7 · W3-mid · testable] Given `m:fourth-gold-set` (Gold set held, not registered), Then
  `coins.check.gold-set`: "Register the Gold set in the Armor Smithy: x1.5 coins from monsters".
- **US-73 Achievement task tier.** [FR-67 · 7 · all · blocked: V35] Given `fourth.json`, Then
  `achievements.goal.task-tier`: "Complete {left} more {world} achievements for the next Achievement task tier".
- **US-74 Pet token and Tournament.** [FR-69 · 7 · all · blocked: V37] Given `m:fourth-token` (an unspent Pet Bonus
  Token), Then `pets.check.spend-token`: "Spend your Pet Bonus Token on {pet}". Given `m:fourth-tourney` (not
  registered), Then the live `pet-tournament.check.register` fires once, homed on the Tournament tab.
- **US-75 Duplicate family line.** [FR-70 · 7 · W2-mid · blocked: V39] Given `m:fourth-dup-line` (two characters of one
  class), Then `family.check.duplicate-line`: "Your {class} Lv {level} adds no family bonus: your {class} Lv {holder}
  already sets it".
- **US-76 Join a guild.** [FR-71 · 7 · all · testable] Given `m:first-no-guild`, Then `guild.goal.join`: "Join an active
  guild: its bonuses apply to you in full"; a contract test asserts no member name anywhere in Account State.
- **US-34 Friend slots.** [FR-72 · 7 · all · testable] Given `m:fourth-friends` (2 of 5 slots empty), Then
  `friend-bonuses.check.free-slots` (nice): "2 of your 5 Friend Bonus slots are empty"; no friend name in the page, the
  card or Account State (contract test).
- **US-77 1-gem special.** [FR-73 · 7 · all · blocked: V34] Given `m:fourth-limited` (a 1-gem Limited Special in stock),
  Then `gem-shop.check.limited-freebie`: "Buy {item} in Limited Specials for 1 gem ({left} left)"; no other gem advice.
- **US-78 Event Points.** [FR-74 · 7 · all · blocked: V41] Given `m:fourth-ep` (Event Points above the cheapest unowned
  item), Then `event-shop.check.points-banked`: "Spend {points} Event Points: {affordable} items you can afford".
- **US-79 First trophy.** [FR-75 · 7 · W1-mid · testable] Given `m:first-trophy-held` (a non-limited trophy held,
  `TaskAchB23` not done), Then `trophies-nametags.check.first-trophy`: "Equip any non-limited trophy once: My First
  Trophy pays 25 gems and a 4 h candy" (a reward, not a gem spend).
- **US-80 Town shops.** [FR-76 · 7 · all · testable] Given `first.json`, Then the Town shops page header renders
  `town-shops.goal.stock-bonus` with Overstock and Vendor Stamp values from the fixture; given `stage-w1-early`, Then
  every town past W1 shows "later" even with stock.
- **US-81 Before the reset.** [FR-77 · 7 · all · testable] Given `m:fourth-before-reset` (`now` 30 min before the daily
  reset, crystal mobs not killed), Then `checklist.check.crystal-mobs`: "Kill your {n} guaranteed crystal mobs today";
  the Candle and Giant monster rows render as display rows with their No-advice reason.
- **US-82 Precision Power idle.** [FR-78 · 7 · W3-mid · blocked: V15] Given `m:fourth-precision` (a Squire-line
  character with Precision Power on a target its accuracy already covers), Then `classes.check.precision-power-idle`:
  "Precision Power adds nothing on {target}: accuracy {accuracy} of {need}". local: the W4 test account Squire.

## 5. Functional requirements

Each System FR lists what it **tracks**, its **page** (answer frame, then sections in order, per section 9), its
**advice** (the draft file in `kb-drafts/` and the ids that ship), its **Detectors**, and what is deliberately **not
advised**. "Fires today" names a private save where the map saw the draft fire. Full mechanic rows are in MASTER.md
Appendix A; full draft text is in the named file.

### F0 Foundations (Wave 0)

The order inside Wave 0 is fixed where an arrow says so: FR-3 -> everything W4; FR-2 -> FR-2b -> FR-10; FR-0a -> every
golden.

- **FR-3 Stages past W4-entry (first Wave 0 PR).** `packages/knowledge/src/stages.ts` gains `W4-mid` and `W4-late`.
  Their detection rule is authored in this PR with a cited Source, the way M2 defines the existing Stages; this spec
  does not fix the bands (owner Q2: add both now). It also gains a **beyond** policy: an entry whose `to:` stage is
  W4-entry or later stays live for accounts past W4 unless it sets `stopsAt`. The draft remap ships in the same PR:
  `W4-early` -> `W4-entry` (6 entries), and no draft may name a W5+ stage (`alchemy-vials` capped at `W4-late`; done in
  the drafts on 2026-10-19). About 45 drafts cite `W4-late`; none is promoted before this PR merges (R10).
  **Built 2026-10-19.** Rule (Meta Path `stages` entry, values `w4-mid-door` / `w4-late-door`): W4-mid once any
  character opens the door out of Wurm Highway (the 6th of World 4's 12 path doors), W4-late once any character opens
  the last one, out of Flamboyant Bayou into Enclave of Eyes (the Troll and the W5 gate), read from
  `characters[].doorKillsLeft`; an unreadable table is unknown (earliest Stage, partial). Past World 4 the account
  reads `W4-late` with `coverage: 'beyond'`. Beyond policy: a span ending at `W4-entry` or later is open-ended unless the
  entry sets `appliesTo.stopsAt` (the first Stage it no longer applies at), so every live entry written "to W4-entry"
  keeps its meaning; one `appliesAtStage()` in `packages/knowledge` replaces the five module copies, and a W4 band with
  no Priority List of its own reads the W4-entry list.
- **FR-1 Draft status.** `packages/knowledge/src/schema.ts` accepts `status: draft`; `kb compile` skips drafts, so a
  draft never reaches the engine (owner Q1: yes). Promotion flips an entry to `active` or `contested` in the PR that
  ships its Detector, after the wave's red team. **Built 2026-10-19:** the loader keeps drafts apart (`KbSource.drafts`),
  `kb check` schema-checks them and reserves their ids, fails a live entry that references one, and leaves their
  Detectors and references to their wave.
- **FR-2 Source tiers: one numbering, the live one.** The KB keeps ADR 0004 and `schema.ts` as they are: **1** game
  data via Toolbox (a permalink at a 40-character sha), **2** the wiki edited after the patch (with `claimDate`), **3** a
  dated community guide (with `claimDate`), **4** anything else. `entryRules` keep keying on these numbers (Verdict
  blockers need tier 1 or 2; authored facts cite tier 2-3 with `claimDate`). There is **no bulk rewrite** of the live KB:
  its 83 tier-3 and 12 tier-2 Sources keep their meaning. The M26 research used two other labellings (the brief: 1
  data, 2 Toolbox logic, 3 wiki, 4 community; the dossiers: T1 code/data, T2 wiki, T3 guide, T4 forum). A conversion
  script (`tier-convert`, part of FR-10) maps them: Toolbox code or logic at the pin -> 1; idleon.wiki -> 2 when the
  revision date is after the patch (it becomes `claimDate`), else 4; a dated community guide -> 3 with its date; forum,
  undated or other -> 4. A drafts lint in CI fails on any Source that is not converted: a wiki URL at tier 1 or 3, a
  tier 1 that is not a permalink (or, after FR-2b, a game-client Source), a tier 2 or 3 without `claimDate`, a non-https
  URL, or a self-citation of a scratchpad file. Today it reports 103 wiki Sources at tier 3, 103 tier 2-3 Sources without
  `claimDate`, 50 tier-1 Sources that are not permalinks, 35 non-https URLs, 21 self-citations and 24 unknown keys
  (`work/lint_sources.py`, list in `work/source-lint.json`).
- **FR-2b Game-client Sources (Q10, owner yes).** One PR amends ADR 0004 and `schema.ts` together, with a golden diff:
  a tier-1 Source may also be a **game-client read**, `url` = the client file, plus required `excerptSha256` (hash of
  the stored excerpt, kept under `docs/research/game-client/`), `clientBuild` (file hash and Last-Modified) and
  `gameVersion` verified in the client. Until that PR merges, every N.js-only claim is tier 4 and its entry is display
  only. N.js-only verdicts stay confidence M at most until V43 matches the copy to 2.3.540.
  **Built 2026-10-19:** ADR 0004 amended; `Source` takes `excerptSha256` and `clientBuild`, required on a tier-1
  `legendsofidleon.com/*.js` URL and allowed nowhere else; `kb check` verifies the stored excerpt (hash, at most 2 KB)
  and the build row in `docs/research/game-client/builds.json`, whose `gameVersion` must equal the Source's. **V43:**
  the N.js copy (sha256 `42da3130…b8b204`, 26,391,628 bytes, Last-Modified 2026-10-17) ships no version literal ("v1.23"
  is the update tag `Luminous_Menagerie_v1.23`), but contains every feature Toolbox 3.3.96 lists for 2.3.540 (Luminous
  Menagerie, Verisimilitude tier, Omega balls, Scurge, Singularity) and is dated the same day: matched to 2.3.540 by
  content, so N.js-only verdicts are no longer capped at M on version grounds. The URL no longer serves that file; a
  newer client gets its own row.
- **FR-2c Two-Source rule for judgment.** A lint fails a Priority, Build or Meta Path ordering whose status is `active`
  unless it cites at least two independent (different author and site), dated, post-patch Sources; tier-1 data counts
  as one only for the facts it supplies, not for the ordering. Entries that fail ship display only or Contested. The
  2026-10-19 re-grade marked 12 drafts display only (`ship: display-only` in the drafts; section 16, P1-9).
- **FR-4 Rift label.** `riftLabel(level) = level + 1` in `packages/engine`; every UI string and draft text gets its Rift
  number from `riftLabel()`; Detectors compare `account.rift.level` (= `Rift[0]`). A lint fails on player text
  (`text`, `why`, `values`, page strings) with a bare number after "Rift" that `riftLabel` did not produce. Display
  tests: stored 5 -> "Rift 6" (Trap Box Vacuum), 15 -> "Rift 16" (Skill Mastery), 25 -> "Rift 26" (Gilded Stamps), 35 ->
  "Rift 36" (Vial Mastery), 40 -> "Rift 41" (Construct Mastery), 45 -> "Rift 46" (Ruby Cards). The three drafts that
  printed stored numbers were fixed on 2026-10-19 (`rift.yaml` twice, `construction.yaml`); the lint will catch the
  `elite-classes.facts` `riftGate` rows, whose base is unproven until V1.
- **FR-5 Claimed by.** A finding may declare `claims: [{ system, key }]`. The engine's merge step keeps one card per
  claimed key, owned by the entry the System's FR names, and adds the other entry's reason as a detail line. Pairs at
  M26 start: MASTER.md section 5 X8-X16 and W3 #5.
- **FR-6 Unlock guards and registry.** A shared `unlocked(system)` guard keyed on **each System's own unlock fact**
  (Rift: the Rift Ripper quest; Lab: any character in a tube or the Lab built; Breeding: `breeding.started` or
  Breeding level > 0; Cooking: a kitchen owned; Sigils: Lab node 12 or any sigil progress; Equinox: the FR-8 rule;
  Islands: `islands/unlocked`), with `currentWorld` only as the fallback when the fact is null. Every Check of a System
  with an unlock fact returns silent while locked. Registry rows added in Wave 0 (MASTER 0.8), with
  `islands.unlocked` changed to `islands/unlocked` and `prayers` scope `both`.
- **FR-7 Previous-save Detectors, per sub-field.** A Detector that compares with the previous save (Lab chain-broke,
  Killroy week roll, Weekly Battles week roll) declares the sub-fields it compares; the previous state counts as "no
  previous save" only when one of those sub-fields is missing or fails its schema, not whenever `schemaVersion` differs.
  User-visible consequence, stated once: on the first save after a release that reshapes a compared sub-field, that
  Detector stays silent for one sync.
- **FR-8 Correctness fixes.** Each ships alone with a regression test: Breeding `nextEggInSeconds` reads banked time as
  remaining (fix), first-breed hint keys off `speciesBred` (fix), multiplier-unlock indices (fix, after V5); Ballot
  label "Active now"; Equinox real unlock; Refinery Throttle effective level; `friendBonusStats`, `hatRack` and
  `gallery` added to `FRONTIER_SECTIONS`; `minigames/daily-plays` Choppin step gated on talent 463 > 0. **Not fixes:**
  (a) the Killroy room count is a regression test only, since ActiveOn's `readKillroy` already applies the World 3 gate
  and only Toolbox's `getKillRoy` over-counts (ActiveOn does not use it); (b) the Killroy Prime and Skill Mastery base 7
  gates are **verify-first** (V2). Vendored Toolbox applies `RiftSkillETC` ungated on purpose (`printer.ts#L101`: "The
  game applies RiftSkillETC ungated here - it already returns its base 7"), `damage.ts#L491` reads
  `killroy.totalDamageMulti` ungated, and the "x1.06 frontier inflation" exists only as "likely, verify in N.js" in the
  W4 synthesis (x1.07 in the printer synthesis). Both views are recorded (dossier printer C22, conf M; W4 synthesis,
  conf L). If V2 shows the game gates them, the change needs its own design: `packages/toolbox-parsers/src` cannot
  change `getMaxDamage` internals without mutating the account or re-implementing it, so it needs a written ADR 0005
  exemption first.
- **FR-9 Fresh W4 save and re-parse.** Before Wave 1 goldens: a fresh private save of the W4 test account (owner,
  minutes), and both private fixtures re-parsed at the pin. **Fallback:** if the fresh save is not in by the first
  Wave 1 golden PR, goldens are recorded on `first.json` (W4-entry), `fourth.json` and `highend.json` (past W4) and their
  mutations, and the fresh save is added as a local truth case when it arrives. Wave 1 is never blocked on it.
- **FR-10 Draft conversion (not copy).** The drafts are research notes, not loadable KB: of 390 type-bearing draft
  entries run through the real `AuthoredEntry` schema with status mapped to active, 122 pass and 268 fail (191 on
  structure alone: Goals without `progress`, `unit` or `scope`; categories outside compounding / spendable / nice;
  `fromTopic` keys; invalid `doneWhen.change` and Builds; Priorities without tiers; check-only keys on Goals), and 36
  files carry top-level `status`, `facts`, `amendments` or `notDrafted` keys that `AuthoredFile` rejects. One Wave 0
  script, `kb-convert`, does the whole pass and is re-run, never hand-patched:
  - shape: progress Detector refs, units and scopes added; categories mapped; unknown keys dropped (`fromTopic`,
    `ship`, `shipReason`); `facts` move to `<system>.facts.yaml`; `amendments` and `*.patch.yaml` become edits to named
    live entries with a golden diff;
  - Sources: FR-2 conversion, permalinks pinned, dossier self-citations replaced by the committed
    `docs/research/m26/<topic>.md` path, `claimDate` filled, `notes` inside a Source moved to the entry;
  - **merge, never copy**, for the 32 draft files whose names already exist in `packages/knowledge/systems/`
    (alchemy, alchemy-bubbles, alchemy-vials, anvil, arcade, armor-smithy, ballot, boss-keys, bubba, cards, classes,
    colosseum, construction, death-note, gear, killroy, library, minigames, obols, poppy, post-office, printer,
    refinery, skills, spend, stamps, star-signs, talents, trapping, upgrade-vault, weekly-battles, worship): new ids are
    appended, an id that already exists is an edit with a diff. Ids that collide with live ids outside the patch files:
    `bubba.fact.charisma-targets`, `armor-smithy.check.register`, `death-note.contribution.skull`,
    `talents.build.hunter-fighting`; the patch files' 13 Build and Meta Path ids are edits by design;
  - the 78 account-wide map drafts (`maps/<id>.json` `kbEntryDrafts`) join the same pass;
  - `work/count_drafts.py` runs in CI over the converted files and fails on duplicate or malformed ids (7 and 6 today:
    `anvil.goal.next-tab` twice, the three Shaman / Squire / Bowman Build patches without confidence and Sources, the
    id string `engine/src/builds/diff.ts`, `spend.yaml` used as an id, a `talents.build.wizard-fighting,` typo).
  Output: one converted file per System, validated by the real schema, held as `status: draft` until its wave.
- **FR-0a Stage fixtures.** Wave 0.11 adds `stage-w1-early` and `stage-w3-mid` (Fixtures paragraph) and the per-story
  mutations as each wave needs them. Each wave's goldens include one story per Stage band the wave touches (US-S1 to
  US-S3 plus the wave's own stories), and every wave asserts US-S1 (locked Systems silent on `stage-w1-early`).
- **FR-0b Completeness tests.** (1) Registry: every System in `systems.yaml` has a `SYSTEM_HOMES` entry and a
  `pages.ts` entry, else the build fails (G1). (2) Matrix: every Appendix A row maps to an Account State field, a Check
  or Goal id, a No-advice reason, or a Deferred register row; an unmapped row fails (G2). The mapping lives in
  `packages/knowledge/coverage/m26-matrix.json`, generated from the maps and edited only by its script.
- **FR-0c Sprite acceptance.** See section 10.
- **FR-0d Size budget.** See section 6.

### F1 World 4 (Wave 1; Sigils in Wave 2)

- **FR-11 The Rift** (`rift`, new System and page, L). Tracks: unlock state (Rift Ripper quest and its three items),
  Rift level against the 65-level cap, the next bonus level (every 5), the current task (kind, quota, progress), a count
  of counted characters (never names), upcoming class gates against owned elites, characters on `riftAll`, live bonus
  values (Infinite Stars, Vial Mastery %, Construct Mastery, Ruby Cards cap, Killroy Prime), Skill Mastery (18 account
  skill totals against 150 ... 1000). Page: answer = this level's task and whether to AFK it; then the 13-node bonus
  ladder and next bonus card; "Coming up" next 10 levels with gate badges; 12 bonus cards linking to the Systems they
  feed; Skill Mastery grid ("banked" before displayed Rift 16); locked state = the quest checklist. Advice
  (`kb-drafts/rift.yaml`, 7): `rift.check.unlock-quest`, `.class-gate`, `.afk-task`, `.active-task`, `.quota-done`;
  `rift.goal.next-bonus`, `.skill-mastery`; metapath role text patch (`metapath.patch.yaml`). Detectors:
  `rift/unlock-quest`, `next-bonus`, `class-gate`, `task-kind`, `quota-done`, `skill-mastery`. `afk-task` and
  `quota-done` stay at M with neutral wording ("task looks complete", never "claim it") until V1 traces whether
  `Rift[0]` advances by itself (dossier open question 5; C10 L). Quotas print only from the generated
  `rift.fact.levels`, built from a traced Source (V1); until then the task row shows the kind and progress without a
  quota number (dossier C9 M; contradictions-1 rates the exact thresholds L, "not re-extracted"). The table is
  **not** yet cross-checked against N.js `RiftStuff[4]/[5]`: that is V1. Value feeds that ship here with no page:
  `cards.fact.star-cap` (Ruby Cards), the Vial Mastery and Gilded Stamps terms, Skill and Smithing Mastery (FR-18a).
  No advice: bonus order, Rift mob scaling.
- **FR-12 Laboratory** (`lab`, existing page, L). Tracks: uploaded, connected and drifting characters; lit nodes by
  reach order; real connection range (not a hard-coded 80 px); Line Width per character, read from
  `lab.playersCords` (`50 + 2 x Lab level` plus percent groups, dossier M11); souped tubes (`lab.soupedSlots`, with both
  readings of the Disputed tube keying, dossier C2, until V45); Lab level
  against the next chip-slot level; chip repository spares; owned-but-unlit jewels and colour sets; weekly shop
  claimed / affordable / reset countdown; Bubonic tube coverage; inert Grounded Processor (reads the drop rate before
  the chip, X13 / AW R3). Page: answer = the first firing Lab check, else "N of 14 nodes lit"; Board tab (reach rings,
  "+N px short", Bubonic marker), Characters tab, Chips tab (slot grid, Repository strip, inert overlay), Jewels tab
  (by colour, Spelunker x1.5 chip), Weekly shop tab; "Lab x2 on/off" cross-link chip on the Stamps, Printer and Refinery pages in this
  wave; the Bubbles, Vials and Sigils chips land in Wave 2 and the Death Note chip in Wave 4, each with its page. Advice (`kb-drafts/lab.yaml`, 14 ids incl. the Bubonic tube entry
  merged with the elite map): checks `first-upload`, `not-connected`, `chain-broke`, `weekly-chip`, `weekly-jewel`,
  `empty-chip-slot`, `jewel-unlit`, `inert-chip`; goals `light-next-node`, `open-repository`, `open-spinner`;
  `lab.fact.node-reach`; `lab.priority.chip-picks` is display only (one wiki page, FR-2c). Detectors (8): `lab/uploads`, `chain-broke`, `next-node`,
  `openers`, `weekly-shop`, `chip-slots`, `jewel-unlit`, `inert-chip`. No advice: node and jewel chase order, Bubonic
  placement, Souped Up Tubes targets (Contested), Viaduct on/off, when to stop levelling.
- **FR-13 Breeding and the Pet Arena** (`breeding`, existing page + Fence Yard tab, L). Tracks: nest eggs against
  capacity and real time to full; egg rarities; started flag; per-world species rows (found, total, next name, 1-in-N
  chance); multipliers on; Failsafe stacks; Mob store fill and hatch power; Dead DNA against the next upgrade; all 12
  upgrades with opens-at and costs; Fence Yard slots, hearts and shiny levels; territory teams (combat Mobs flagged),
  forage speed; Pet Arena best wave and the next bonus wave from a generated 16-rung ladder (`randomList[53]` +
  `arenaBonuses`; replaces `ARENA_WAVES`). Page: answer = the first firing Breeding check, else "next egg in X"; Nest
  and Mobs tab; Territories tab; Pet Arena tab (renamed from Mob Arena); Upgrades tab; Fence Yard tab (opens once
  Breedability or Paint Bucket is bought). Advice (`kb-drafts/breeding.yaml` 9, `breeding.facts.yaml` 2):
  `breeding.check.full-nest`, `.multiplier-unlock`, `.idle-territory`, `.combat-forager`, `.fence-empty`; goals
  `next-territory`, `arena-wave` (merged with AW's `arena-next-wave` onto the generated ladder), `egg-capacity`,
  `next-row`; facts `upgrades`, `arena-waves`. Detectors (9). No advice: upgrade order past the multiplier Lv 1 steps,
  territory and arena tier targets, arena comps, shiny priority, trashing thresholds, Gene Splicing timing.
- **FR-14 Cooking** (`cooking`, existing page, L). Tracks: kitchen status and copies per hour; next kitchen price; speed,
  fire and luck levels with the spice each needs and its cost; meal level, copies and next cost; the Ready flag; capped
  meals still cooking; Diamond (Lv 11) and Void (cap) plate counts; spices waiting and claims left; ladles; who is on the
  Kitchen AFK Target and their Cooking level. Page: answer = the idle or capped kitchen to fix, else copies per hour;
  Kitchens tab (upgrade rows "Lv N, next X spice (held Y)", recipe tiles, "What speeds this kitchen" sheet with System
  links); Meals tab ("Gives now", "Ready", plate badges, Cooking boosters filter); Spices tab (Kazam bubble and Lab
  sinks, claims meter). Advice (`kb-drafts/cooking.yaml`, 11): checks `idle-kitchen`, `level-meal`, `capped-meal`,
  `claim-spices`, `use-ladles`, `afk-chef`; goals `discover-meal`, `next-kitchen`, `kitchen-speed`, `diamond-meals`;
  `cooking.priority.meals` is display only (our own order, gist support L). Detectors (10). No advice: luck and fire levelling, recipe predictions, Richelin and
  NEW_MEAL gem buys, "all meals to 30", ladle income.
- **FR-15 Sigils** (`sigils`, new System, Alchemy > Sigils tab, M; **Wave 2.5**, after the Alchemy rebuild of
  FR-19..22, because the tab lives on that page; was Wave 1). Gate: Lab presence or sigil progress (Q9, FR-6). Tracks: each of the 24 sigils' tier, progress, next
  cost, charge rate and ETA; seated characters and who sits beyond slot 10; Lab node 12 lit; sigil speed and its
  terms; total sigil levels (Tome input). Page: answer = Lab-gate banner when node 12 is off, else the next sigil to
  level; 4x6 board (tier pips, progress bar, class chips, ETA, crown when capped, glow when ready); milestone ruler;
  speed strip; "What sigils give" by target System. Advice (`kb-drafts/sigils.yaml`, 7): checks `lab-off`,
  `seat-capped`, `ready`, `slot-over-ten`; goal `lab-connect`; facts `speed`, `catalogue` (generated). Detectors:
  `sigils/lab-off`, `seat-capped`, `ready`, `slot-over-ten`, `lab-connect`; `sigils/eta` feeds tiles and the Timeline
  only. No advice: unlock and Boost order, bubbles before sigils, Gem Shop Supercharge.
- **FR-16 Tome** (`tome`, new System and page, L). Tracks: Tome score; counted vs total metrics; damage now and at the
  next 100-PTS step; the next three Account-LV-gated metrics and their waiting PTS; the best PTS-gain tier-ups; Blue
  (4,000 PTS) and Red pages; rows below Account LV 350 labelled "not counting yet" (Toolbox counts no PTS below 350,
  `tome.ts#L44,#L54`; Q3); bubble stacks; percentile rank and nametags; statue-character spread. Metrics are keyed
  by name (`tomeData` index), never by position (122 -> 124 rows between pins). Page: answer = score and the damage it
  pays, with the next unlock; milestone track; next unlocks strip; 124 metric rows with 4-segment tier bars, filters
  and source-System links (lower-is-better rows reversed); rank and nametags card. Advice (`kb-drafts/tome.yaml`, 8):
  `tome.fact.score`, goals `unlock-metric`, `metric-tier` (ranked by PTS gain, M as advice), `bubble-stack`, checks
  `blue-pages`, `red-pages`, `claim-nametags`, `tome.fact.statue-character`. Detectors (8). The other Systems' Tome
  Goals (minigames 450, Spiketrap 13, quests 323) stay in their Systems; the Tome page links to them. No advice: a
  per-effort metric order.
- **FR-17 Elite classes and W4 bosses** (`elite-classes`, new System and page, L). Tracks per subclass character its
  elite, the Eliteus step (`none` / `gang` / `pick` / `done`; **confidence M**: the no-level-gate, picker-class and
  re-entry claims are tier 3, conf L, from an older N.js and not re-traced, dossier C5; step detection waits on V44 and
  the Greenie Gang counter key on V8 before the "gang" text ships), tab-4 points unspent (exact confidence only); per elite
  its family bonus value and next breakpoint, W4 job and the Rift gates it opens; Bubonic Purple and Green Tube
  coverage; Begone Troll! tier 0-10; Voidwalker Nebulyte steps. Page: answer = the next promotion step; six elite slots;
  promotion card (Eliteus 3-step ladder with Rift gate tags); promoted slots expand to job, family curve, tab-4 points;
  W4 bosses card (Massive Troll, Begone Troll! pips, Mutated Mush, links to Boss Keys and Rift); Voidwalker card. The
  W4 Welcome "elites" step links here. Advice (`kb-drafts/elite-classes.yaml` 6, `.facts.yaml` 2,
  `metapath.patch.yaml`): checks `eliteus`, `tab4-points`, `lab-tubes`; goals `begone-troll`, `voidwalker`,
  `family-start`; facts `elites`, `troll`; `metapath.goal.elite` keeps its L order and gets the H "why". Detectors:
  existing `metapath/elite-pending` (adds a `step` slot) + 6 new. No advice: elite order past DK/ES, tab-4 talent order
  (Builds ship only with two dated Sources, CL), duplicate elites (both views shown).
- **FR-18a W4 hooks on pages that exist and are not rebuilt** (Wave 1.7, one PR each, S): Gilded Stamps roll
  (`stamps.goal.gilded-roll`, no discount number) and banked (`stamps.check.gilded-banked`) on the Stamps page; Skill
  and Smithing Mastery (`skills.goal.smithing-mastery`, silent before displayed Rift 16) on the Skills tab; the Lab chip
  and jewel rotation checklist row reading the Lab Checks.
- **FR-18b W4 hooks folded into their home System's wave** (red team P0): vials idx 42-51 -> FR-21 (Wave 2.3); third
  big-bubble slot at Pet Arena wave 100 (`alchemy-bubbles.goal.third-slot`) -> FR-20 (2.2); Vial Mastery
  (`alchemy-vials.goal.vial-mastery`, AW supersede version) -> FR-21 (2.3), its value feed in FR-11; Task Board W4 board
  and daily -> FR-26 (2.9); Armor Smithy W4 sets -> FR-40 (Wave 5); card star cap view -> FR-47 (Wave 5), its value
  feed `cards.fact.star-cap` in FR-11; Star Signs D-1..D-7 constellations and W4 signs
  (`star-signs.goal.constellation-w4`, `.goal.signs-w4`) -> FR-50 (Wave 6).

### F2 The gaps W2 and W3 players hit every session (Wave 2)

- **FR-21b Salt adapter slice (Wave 2.0, before FR-22 and FR-27's construction items).** `account.salts` (each salt held
  in the Storage Chest and in Refinery storage) and `account.saltLick` (11 upgrades, levels, the #6 liquid-rate term with
  provenance "game client", X4). **This PR owns the salt-held field**; Construction (FR-27, FR-35), the Salt Lick page
  (FR-30) and the Refinery page (FR-37) read it and never re-derive it. No page ships in this PR.

- **FR-19 Alchemy cauldrons and Boosts** (`alchemy-bubbles`, Alchemy > Cauldrons tab, M). Tracks per cauldron: banked
  brew, brew per roll, rolls banked, the next roll's odds and each factor (base, Luck, P2W New Bubble, Bubble
  Breakthrough, Ivory), brew per hour and its multiplier (vial, P2W Speed, Ivory, Speed Boost), each brewer's brew per
  hour, the four Boosts (level of 170, progress, next-level brew after P2W Boost Req), Ivory owned. Page: answer = the
  cauldron to act on ("N rolls banked: spend brew" or the luck-odd step), where a **roll** is one bubble-unlock
  attempt and its cost is the cauldron's brew per roll from Toolbox (`alchemy.ts` cauldron `brewReq`; V9); pot tiles with a
  20-pip bubble strip, brew bar, odds chip and brew per hour; the **Boosts board** (4 cauldrons x Speed / Luck / Cost /
  2x Extra; Luck cell says whether the next level does anything; Cost cell "effect not modelled"; Extra "~2N% double
  (wiki)"); pot sheet with a two-bar "a new bubble ~X brew / Speed to 5: Y brew" comparison (numbers, no verdict).
  Advice (`kb-drafts/alchemy-bubbles.yaml`): `.check.luck-odd` (M; the only Boost advice: the factor
  `round(10(1+0.05L))/10` steps up exactly on odd L, checked for L = 0..170), revised `.check.spend-brew` (names rolls
  and the lowest odds), `.fact.boosts` (H). **Display only** (red team P0): `alchemy-bubbles.check.boost-speed` and
  `.priority.boost-order`. No Source gives a roll-vs-Boost switch point (dossier C74, conf L, "the switch point is
  inference"); the community Sources point the other way (Steam and the wiki: unlock bubbles first, then Boost); the
  Boost order rests on one post-patch tier-4 guide with W5+ context (C73); 2x Extra has no Toolbox model. The Boosts
  board shows both views with the "sources disagree" badge and the two-bar numbers, never a Now card. Detectors:
  `alchemy-bubbles/luck-odd`, `/boosts` (board feed only), extend `/brew` (slots `odds`, `rolls`). No advice: any
  switch point, Boost order, Cost Boost value, Ivory purchase, Boost targets.
- **FR-20 Alchemy bubbles and big bubbles** (`alchemy-bubbles`, Bubbles tab + new Big bubbles tab, L). Tracks every live
  bubble with level, value now and % of max, the big/small flag (generated from `stat` ending `ACTIVE`), unlocked total
  against 10/20/40/60, each character's big-bubble slots and what they wear against AFK Target and Roles, the third-slot
  parts, No Bubble Left Behind state, Boron price for 1e8+ material bubbles, Upgrade Vault count. Page: answer = the
  Bubble Plan pick (M19, unchanged) with the slot to fill; bubble grid per cauldron (level, band ring, plan tick, next 3
  locked as silhouettes); Big bubbles tab (one row per character: class sprite, AFK Target and Role icons, 1-3 sockets
  with fit tick; header "N of 3 slots: 3rd at arena wave 100"; the third-slot Goal folded in from FR-18b). "Lab x2"
  chip on Bubbles. Advice: goals `unlock-count`, `third-slot` (H),
  `prime-nblb`; checks `fill-slot-role`, `boron-pay`; amendments to `priority.plan` (Prowesessary wording Contested:
  data 2.5x vs community 2x; new row for the #16 multi bubbles), `fact.bubbles` `big` column. Detectors:
  `alchemy-bubbles/unlocked`, extend `/big-bubbles` (`role` mode), `/third-slot`, `/nblb-prime`, `/boron-pay`.
- **FR-21 Alchemy vials** (`alchemy-vials`, Vials tab shelf, L). Tracks every named vial 0-85, level, cost ladder to the
  4/5/10/13 milestones, effect now/next, the vial multiplier and its four terms, green vials when a Shaman-line
  character exists, Pickle Jar vs the Equinox challenge, total vial levels. Page: answer = the M19 vial pick; Vial shelf
  (4 shelves by liquid; flask tile with level, green ring at 4, crown at 13, lock with "roll N+"; later-world vials
  dimmed, never hidden); "Vial bonus x1.20" Big number with term chips (unearned chips grey with where to get them);
  "What your vials give" by target System; idx 42-51 full opacity from W4 (folded in from FR-18b), 52-85 grey "later";
  "Lab x2" chip on Vials. Never a discovery-roll percentage. Advice (`kb-drafts/alchemy-vials.yaml`):
  `goal.green-vials` (H), `check.ladder` (M), `goal.chemistry-set` (H), `goal.vial-overtune` (H), `goal.vial-mastery`
  (H; displayed Rift 36), `check.pickle-jar` (H), `fact.multiplier`; `goal.level-next` reads idx 0-51.
- **FR-22 Alchemy liquids, Decant and the Liquid Shop** (`alchemy`, Liquids tab, M). Tracks every unlocked liquid's
  current/max and time to full from the observed per-liquid rate (generalise `observedWaterRate`), the cap breakdown
  (flat parts, multipliers, empty parts and where they come from), Decant Cap and Rate tracks, seats per liquid (+1 with
  Bleach), the 18 Liquid Shop items, P2W liquid coins to max, Bleach / Dragonic per liquid, Ivory per cauldron
  (`AlchemyState.ivory: boolean[4]`, one field). The Salt Lick #6 rate term is read from the Wave 2.0 adapter (FR-21b, X4). Page: answer =
  the liquid that caps first and when; per-tube cards ("full in ~Xh", "Cap made of" bar, Decant meters, seat pips);
  Liquid Shop board (Shop 2 locked until Trench). Advice (`kb-drafts/alchemy.yaml`, 4): checks `liquid-cap-other`
  (never a blocker), `decant-cap`, `talent-point-tab3`, `bargain-tag`; `bleach-first` is **excluded** (a gem buy, N3:
  price 250 in `gemShop.json` vs 500 in tier lists, ranking from two tier-4 lists; Bleach shows as owned / not owned); `alchemy-p2w.priority.order`
  becomes Contested with both orders shown. Detectors: `alchemy/decant`, `/gem-cauldrons`; extend `/liquid-cap`
  (param `liquids`), `/liquid-unstaffed`, `/shop`.
- **FR-23 Stats and damage** (`stats`, Character Stats tab + Stats page, L). Tracks STR/AGI/WIS/LUK with the snapshot
  level, main and accuracy stat; max/min hit and mastery; accuracy against the need for 100% on the current target;
  crit; HP, MP, defence; movement speed; kills/h, AFK gains, respawn, kill-per-kill; damage groups with the six largest
  contributors; counterfactual clones (+25/+50/+100 accuracy stat, +100 main stat; at most 4 extra `getMaxDamage`
  calls per fighter). Page: answer = the weakest fighter and why; one row per character by kills/h; Map badge on maps
  where someone fights below 100% hit. Advice (`kb-drafts/stats.yaml`): `stats.check.hit-chance-short` (H rule / M
  advice), `stats.check.points-to-main-stat` (nice; never contradicts a push); facts `class-stats`, `thresholds`. Engine:
  `builds/diff.ts` evaluates `accuracyShort` from `combat`. No advice: unspent stat points or respec (no save key),
  movement speed caps (175% / 200% Contested).
- **FR-24 Class kit and Class lines page** (`classes`, shared layer, L). `characters[].classKit` (one discriminated
  union, Q4), `talentCooldowns` + `afkTime`, `activeBuffs`. Class lines page: one card per base line (promotion stepper
  with every character on its step by `classIndex`, family strip linking to the Family page, line levers; W5+ classes
  greyed). Build tab gains a Class kit section above the steps (value lines at effective level and at the target, "+N
  added" chip, "max raised by X", "effect not modelled" footnotes). Shared Detectors: `builds/bubble-capped-talent`
  (one Detector, four texts: Fuscia, Fantasia, Velocity Vessels, Blocky Bottles), `classes/cast-ready` (Check +
  Timeline), `builds/accuracy-short`, `builds/accuracy-over` (info), `builds/core-missing`. Ships with the lines that
  fire today: `classes.check.idle-casting-zero`, `talents.check.core-missing`
  (Idle Brawling), `classes.check.precision-power-idle` (W4 test account Squire). **Blocked on V42:**
  `classes.check.fuscia-over-bubble` and Build target 1 for the Wizard and Shaman lines, now confidence M. The rule
  "Overclocked Energy max = 100 + min(Fuscia Flasks, Mage Is Best)" comes from `talents.json` description text ("up
  to +L") with no Toolbox consumer plus N.js at M; the wizard dossier reads `min()`, the shaman dossier says the flasks
  only help once the bubble passes 100. The one save reading (max 101 = 100 + min(14, 1)) cannot tell them apart. Both
  views show on the kit row until V42 settles it against N.js. Build targets gain `bubbleLevel:
  <BUBBLE>`, step conditions `precisionPowerActive`, `talentAtLeast`, `greenVialsAtLeast`, and `breakpoints` honoured.
- **FR-25 Forge System** (`forge`, new page, L). Tracks unlocked slots (New Forge Slot level; never Toolbox's 16-slot
  `emptySlots`), per-slot ore, fill and empty-at time, bars waiting, barrels, Brimstone slots, ore capacity breakdown,
  Forge speed, six upgrade levels. Page: answer = idle slots and the ore to load, else "earliest slot empties in X";
  4x4 slot grid; bars-waiting strip; upgrades (level/max only, no costs until a cost Source exists); capacity breakdown
  linking to Stamps, Arcade, Vault, Bribes, Cards; barrels fact table with the Fossil Fuel footnote (text 80% vs data
  0.2%, both shown). Timeline event "Forge slot empties". Advice (`kb-drafts/forge.yaml`): `forge.check.fill-empty-slots`,
  `.runs-out-before-return` (pill, never a blocker), `.collect-bars`, `.add-barrel`, `.brimstone-best-ore`;
  `.brimstone-first-slots` is **excluded** (a gem buy, N3; one tier-4 guide; the Discord-sourced tier was dropped,
  Discord is out of scope; Brimstone slots show as owned / not owned on the Gem Shop page); smithing's `forge.check.idle` / `.runs-out` are dropped (X15). Fires today:
  fill-empty-slots (W2), collect-bars (both), brimstone-best-ore (W4).
- **FR-26 Task Board, Merit Shop and Task Unlocks** (`task-board`, `merit-shop`, `task-unlocks`, one page with three
  tabs, L). Tracks the 32 ranked tasks per world (stat against the next tier, tiers ready, reset-on-claim flag), board
  open per world 1-4 (W4 via `Nebula_Neddy1`; folded in from FR-18b), dailies, merit rows and the recipe gate, unlock columns by the game's rule
  (unlocks bought + anvil tab; the adapter's worlds-reached rule stays until V13 settles it), star-talent caps. Page: answer = "Claim N tiers" or the closed board's opener; world tabs; 4x2 task cards plus the daily;
  Merit Shop tab; Unlocks tab. Advice (map drafts, FR-10): `task-board.check.claim`, `.check.daily`, `.goal.open-board`;
  `merit-shop.check.recipe-ready`, `.check.star-cap`, `.check.spend-w2-efaunt-recipes`; `task-unlocks.check.spend`,
  `.goal.next-column`. Detectors: `task-board/claimable`, `/board-locked`, `merit-shop/recipe-gate`, `/star-cap`,
  `task-unlocks/unspent` (fix), `/next-column`, checklist `daily-tasks` (extend).
- **FR-27 Fires-today quick wins** (existing pages, S each): `stamps.check.coins-outrun-caps` (+ `skill-falloff`,
  `gilded-banked`, `total-levels`, `carry-wall`, `certified-stamp-book`, `golden-apple` from `kb-drafts/stamps.yaml`;
  Insider Trading 8% in `spend.yaml`); `upgrade-vault.check.knockout-target`, `.baby-on-board-idle`,
  `.mastery-unbought`, `.major-discount-low`; `anvil.check.mat-points` (cheapest-first across characters via Toolbox
  `getMonsterMatCost`); `construction.check.bar-full-unpaid` (after FR-21b, reads `account.salts`), `.slot-empty`,
  `.printer-below-characters`;
  `quests.goal.unique-quests`, `quests.check.quest-talent-past-cap`; Cards fixes (`BASE_MAX_LEVEL` reads the star-cap
  fact; boss x5 only after V-list check).

### F3 World 3 (core in Wave 4: FR-28..34; the rest in Wave 5: FR-35..41)

- **FR-28 Equinox** (`equinox`, new page, M). Tracks the real unlock (FR-8), Mirror drop and door progress before it;
  bar charge, requirement, fill rate and breakdown, full at; 14 Dream Upgrades with level/max and cloud gates; clouds
  done / active / upcoming; Food Lust stacks. Page: answer = locked: where the Mirror drops; unlocked: "bar full, spend
  it" or "full in X"; 14-tile upgrade grid; active clouds row then Done / Upcoming / Nightmare (W7, greyed); fill-rate
  rows with owning-System sprites. Timeline "Equinox bar full". Advice (`kb-drafts/equinox.yaml`): `equinox.goal.find-
  mirror`, `.check.spend-bar` (H, pill), `.goal.clouds`, `.fact.upgrades`. Detectors: `equinox/unlocked`,
  `/mirror-missing`, `/bar-full`, `/active-clouds`. No advice: upgrade buy order (tier 4 only, L).
- **FR-29 Death Note** (`death-note`, new page; the Map tab keeps a summary, L). Tracks full W1-W4 pages (every monster,
  kills, rank skull, points; `account.deathNotePages` kept out of history), building level against 51, per AFK fighter
  overkill tier, multikill and Kill-per-Kill, skull achievements, cheapest next point. Page: answer = the cheapest next
  point or the building check; W1-W4 tabs with a 7-cell ladder per monster; Your fighters; Achievements and quests
  (Blunder n/15, Saharan n/11, Nebulyte n/40 at 1M); Raise multikill (collapsed source list). Skull labels show the
  threshold ("25k skull") with the wiki name secondary (M). Advice (`kb-drafts/death-note.yaml`, 8): checks
  `cheap-point`, `overkill`; goals `world-points`, `blunder-skull`, `saharan-skull`, `nebulyte`, `building-level`;
  `contribution.skull`. The mini-boss page stays hidden until its Jade gate is read (W6).
- **FR-30 Salt Lick** (`salt-lick`, new page, M). Tracks all 11 upgrades revealed by building level, level/max, next
  cost, affordability net of salt held for slotted buildings, caps progress, the #6 rate-vs-capacity split. Page:
  answer = the affordable upgrade or "build it: 20 Explosive Salts"; 11-pip reveal row; salt wallet strip with "held for
  {building}" flags; upgrades by salt; notes footer (#6 Contested, #2 and #7 not modelled, #11 needs Rift 61). Advice
  (`kb-drafts/salt-lick.yaml`): `salt-lick.check.upgrade`, `.goal.caps`, `.check.build` (silent while build-next names
  it), `.check.spontaneity`, `.fact.upgrades`. Detector `salt-lick/state`, `salt-lick/spontaneity`. Reads `account.saltLick` and `account.salts` from FR-21b. No upgrade order.
- **FR-31 Atom Collider** (`atom-collider`, new page, M). Tracks particles, the 17 atoms (11 in W1-W4 reach), next cost
  and cost to max, building level (cost cut L/10%), Hydrogen's 90% cap and day counter, storage over the threshold.
  Page: answer = Hydrogen full or the affordable atom; collider level bar; atom rows; Hydrogen gauge ("resets on any
  stamp cap raise"); threshold chip (switch state not in the save); cost-cut footer. Advice
  (`kb-drafts/atom-collider.yaml`): `check.upgrade` (H), `check.hydrogen-full` (H), `check.threshold` (M),
  `goal.collider-level`, `fact.atoms`; `priority.order` is display only (gist through v1.21, pre-patch, L). Detector `atom-collider/state`.
- **FR-32 Prayers** (`prayers`, existing page, scope both, L). Tracks owned prayers of 19, slots per character
  (Wizard-line level + Gem Shop), soul type and cost multiplier, souls held, next unlock wave, cheapest level-ups,
  equips with curses, Unending Energy away time, curse clashes, The Royal Sampler. Page: answer frame (Goal line, soul
  strip, slot chip); equipped tiles become sockets. Advice (`kb-drafts/prayers.yaml`): `goal.owned`, checks
  `empty-slot`, `unending-overnight` (X2: Contested next-action), `unlock-next`, `level-cheap`, `skill-pair-clash`,
  `hp-curse-stack`, `royal-sampler-on`. Detectors (8).
- **FR-33 Shrines** (`shrines`, existing section, M). Tracks each shrine's map, level, progress, level-up rate (only
  while an AFK character is on that map, Toolbox `getShrineExpBonus`), card-adjusted bonus, World Tour reach, total
  shrine level against Equinox 140, same-map totals, Shrine Architect. Page: header total bar; "On your maps" with idle
  shrines in coral; "All shrines"; Speed tab (display only, Crescent 10% data vs 7.5% wiki both shown). Advice
  (`kb-drafts/shrines.yaml`): `shrines.check.idle` (H), `.check.stack` (M), `.goal.equinox-total`,
  `.goal.same-map-total`, `.fact.catalogue`. No advice: build order, move timing (both L / Contested).
- **FR-34 Worship and Tower Defense** (`worship`, existing page + Skulls and Tower Defense tabs, L). Tracks all five
  W1-W4 totems (adds Clash of Cans: `W1_W4_TOTEMS = 5`), charge pool per character with claim target and EXP per
  charge, best wave per totem against prayer unlock waves, the skull ladder past Wax, Charge Syphon, souls held, TD
  towers and starting points, total waves, soul achievements. Advice (`kb-drafts/worship.yaml`, 14): checks
  `play-new-totem` (H), `best-totem` (rendered as the place detail of charge-caps, FR-5), `prayer-wave-close`,
  `skull-next`, `syphon-first`, `first-towers`, `soul-achievement`; five best-wave goals; two facts. No TD timer or
  kill-point numbers on the page (Contested).
- **FR-35 Cog Board** (`construction`, Cog Board tab, L). Tracks per cell state, flag cost, cog kind/tier/boost shape and
  reach; placed flags and progress; spare cogs best-first; Excogia pieces; Flaggy rate; Gem Shop board upgrades.
  Advice (`kb-drafts/construction.yaml`): `flag-none`, `flag-done` (after the in-game check), `cog-fill-square`
  (claimed after cog-seat-free), `cog-swap-better` (never removes a boost cog's reach), `boost-wasted`,
  `excogia-assemble`, `board-plan` (only if Q6 allows a seeded optimiser), `fact.cog-board`. Timeline "Cog flag
  finishes". Cells kept out of history.
- **FR-36 3D Printer** (`printer`, existing page + Sample size tab, M). Tracks who prints, empty active slots, sample
  size per character with each lever and the 90% cap, print factor (Wired In 2x/3x, Harriep, 6x), multiplier
  breakdown (Skill Mastery base 7 shown as Toolbox applies it, ungated, with a "verifying" note until V2), stored-sample capacity, Printer Go Brrr cooldown, records, total
  printed. Advice (`kb-drafts/printer.yaml`): `check.empty-active-slot` (H, claimed with slot-plan), `check.sample-size-
  lever`, `check.sample-size-cap`, `check.go-brrr-ready` (after V-list cooldown unit), `priority.sample-size`; the AW
  `reset-loss-wiring` line on `printer.check.slot-plan`.
- **FR-37 Refinery** (`refinery`, existing page + Balance and Speed tabs, M). Tracks per salt power and fuel per cycle,
  made vs burned per hour, safe rank, printer limit; the three cycle timers and speed stack; Salt merit; total ranks;
  Refinery Throttle per Squire-line character (effective level); salt in Refinery storage that a payment needs in the
  chest (from `account.salts`, FR-21b). Advice (`kb-drafts/refinery.yaml`): `check.salt-deficit` (M), `check.throttle-ready` (M, via `classes/cast-
  ready`), `check.move-storage` (M), `fact.speed-sources`. No rank order.
- **FR-38 Trapping** (`trapping`, existing page + Durations, Critters, Lord of the Hunt tabs, L). Tracks free trap slots
  (set capacity + Call Me Ash; active only after the in-game capacity check), placed traps with critter, quantity,
  EXP, shiny row, timer; the 11-set ladder; efficiency vs spot requirement (met / not met only); shiny chance; Eagle Eye
  in a preset; Lord of the Hunt 1-11; critter stock; Trapper Drone. New Toolbox calls `getTrapsBonuses`,
  `getShinyChanceInfo`. Advice (`kb-drafts/trapping.yaml`, 11): `free-slots`, `call-me-ash`, `next-set`,
  `lord-of-the-hunt`, `eagle-eye`, `shiny-snitch`, `info.durations`, four facts.
- **FR-39 Talent Book Library** (`library`, new page, M). Tracks checkouts and next ready, speed breakdown and
  breakpoints, book level range and its five sources, lifetime checkouts, building max; book glyph on bookable talents
  in the Build tab. Advice (`kb-drafts/library.yaml`): `goal.book-range` (H), `check.range-upgrade`, `check.hoarding`,
  `check.build`.
- **FR-40 Armor Smithy** (`armor-smithy`, existing page + Upgrade chain tab, M). Tracks all 19 sets (adds the W4 sets
  Lustre, Diabolical, Troll, Magma, folded in from FR-18b) with world, parts worn/held/missing on one character, registered vs worn-in-full, active
  bonuses, gems toward 2,000. Advice (`kb-drafts/armor-smithy.yaml`): `check.register` (revision), `goal.next-set`,
  `check.keep-before-upgrade`, `priority.order` (lands Contested, both orders shown, never on Now). 14 crest sprites.
- **FR-41 Bubba** (`bubba`, existing page, M). Adds smoked meats, Spare Coins, the meat rate breakdown, gifts picked vs
  slots, Frozen Dice and reroll, Charisma pair and emulsify, Boon chips on Construction, Worship, Atom Collider and
  Trapping pages. Advice (`kb-drafts/bubba.yaml`): `check.charisma-pair`, `check.gift-pick` (claimed after megaflesh),
  `check.dice-reroll`, `check.emulsify` (after the cost check), two facts; `priority.gifts` and
  `priority.milestone-upgrades` are display only (tier-4 only, FR-2c) (Rizz target corrected to 45 at Megaflesh 3).

### F4 World 2 (Wave 5)

- **FR-42 Obols** (`obols`, new page with Family / Characters / Storage / Reroll & Combine tabs, L). Tracks the altar
  (Bob Joe Pickle quest), the W2 obol drop merit, 24 family slots by shape and family-level gate, 21 personal slots per
  character, what each holds with final stats and the rerolled flag, storage by shape row, fragments, reroll / combine /
  destroy costs and odds, per-character obol stat totals, achievements 83 and 99. Before the altar: one "Obols are
  closed" card. Character Gear tab gains a compact strip. Advice (`kb-drafts/obols.yaml`): `check.swap-better` (H,
  strict dominance), `check.main-stat`, `goal.reroll-dr`, `goal.combine` (silent while open slots of that shape
  remain), `goal.oh-boy`, `goal.golden-obolden`, `check.liquid-shop` (blocked until `CauldronInfo[10]` is adapted),
  three generated facts.
- **FR-43 Islands** (`islands`, new page, L). Tracks the access gate (best Fishing vs 30, or any island unlocked), six
  islands' state and next cost, bottles held and per day, the bottle bonus ladder, Trash garbage vs the 100 cap, Trash
  shop, Crystal unclaimed days (13 = 27 mobs is the peak, 14 = capped at 15), Shimmer trial and shop, Rando shop,
  Seasalt, Fractal hours. Every Check carries the unlock guard (FR-6). Advice (`kb-drafts/islands.yaml`, 14):
  `check.crystal` (H), `check.garbage`, `check.garbage-gain`, `check.bottle-gain`, `check.shimmer-trial`,
  `check.shimmer-spend`, `check.unlock-next`, three goals, three facts; `priority.unlock-order` is display only (a single
  tier-4 guide).
- **FR-44 Killroy** (`killroy`, new page, L). Tracks rooms open (1; 2 once World 3 is finished; 3 nested with
  `OLA[227]`), the done code, this and next week's class roll, the monster per room (the existing `calls.killroyWeeks` from M20, extended to return
  the room monsters, wrapped with `now`; no parallel call), six run upgrades and the timer, skulls and the Skull Shop, permanent items, Killroy Prime (from
  the Rift), best kills per monster vs the Equinox 100-kill goal, per-class best scores. Advice
  (`kb-drafts/killroy.yaml`, 9): `check.run-upgrades`, `priority.run-upgrades`, `check.third-room` (World 3 gate), `check.equinox-kills` (H), `goal.prime` (H), `goal.equinox-run` (H), `goal.second-room`;
  `priority.run-upgrades` stays only if it passes FR-2c; `priority.runner` and `priority.skull-shop` are display only (one
  community thread, W7 list pared down). Rooms: US-29 is a regression test; ActiveOn's `readKillroy` already matches
  the game.
- **FR-45 Weekly Battles and the Ballot** (`weekly-battles`, `ballot`, new page + Ballot tab, L). Tracks best difficulty
  this server week and the week-end countdown, today's attempt flag, this week's boss and the next 9 weeks
  (`getWeeklyBoss` wrapped with `now`), HP per difficulty, the 3 task types, MISC buffs vs 150% caps, the Spillover star
  talent, the Trophy Shop rotation; Ballot: your vote, the active bonus and its applied value, the world gate and the
  1.25x fallback, this week's candidates with shares. Advice (`kb-drafts/weekly-battles.yaml`): amended `check.raid`,
  `goal.difficulty`, `check.daily-attempt` (only while best < 5 or an Equinox trophy cloud is done: repeat payouts are
  Contested), `check.gold-pocketwatch`, `check.spillover-book`, `priority.trophy-shop`; `ballot.check.vote` amended. No
  voting advice.
- **FR-46 Arcade** (`arcade`, new page, L). Tracks the four currencies, balls to claim at the cap, the ball rate and its
  sources against the 122.2% floor, the Gold Ball multiplier, the 9-bonus rotation, every shop bonus with level, value
  and consumer System, Super/Omega levels, companion doubling, Tome inputs. Needs one authored `arcadeNextCost` (cost
  curve not vendored; wiki Source; checked against upstream before `spend-gold-balls` activates). Advice
  (`kb-drafts/arcade.yaml`): amended `check.balls-cap` (states the balls at stake), `check.launch-balls`,
  `check.spend-gold-balls`, `priority.shop` (two rules only), `goal.ball-rate` (H), `fact.rate-floor`, `check.cap-balls`.
- **FR-47 Cards** (`cards`, Cards tab, M). Adds an account header (total levels, cards found, star cap), a Collection
  section per W1-W4 set (owned meter, tier pips, unowned as dashed "x5" outlines, none for bosses), a passive strip,
  preset markers (off-activity, capped, Mastery ribbon). Advice (`kb-drafts/cards.yaml`): `check.capped-card-map`
  (informational), `goal.set-tier`, `goal.total-levels`, `check.mastery-frees-slots` (W4-entry+), `check.wrong-side-
  cards`, `fact.star-cap`.

### F5 World 1 (core in Wave 4: FR-48, 49, 51, 52, 53; the rest in Wave 6: FR-50, 54..58)

- **FR-48 Bribes** (`bribes`, new page, M). Tracks owned of obtainable bribes (sets 1-4, plus Bail once Trash Island is
  open), the open set, coins left in open sets, the cheapest affordable book bribe, the Bail gate. Every bribe carries
  its data value and effect name, never text templated from `desc` (Insider Trading 8%). Page: set rows with
  owned/available/locked pips, a next-buy card against the wallet. Advice (`kb-drafts/bribes.yaml`): `goal.bought`,
  `check.next-buy` (page-only; the Spend Plan keeps the Now line), `check.bail-gate`, `fact.code-values`;
  `priority.set-order` is display only (derived, not a published guide).
- **FR-49 Statues** (`statues`, existing page, L). Tracks per statue level, progress, grade, bonus and multipliers;
  statues held; Town Marble done per character; Monolith 1 (250 total levels, 17 types in a bag) and Monolith 2 (Onyx
  Tools, 20,000 Power statues); Onyx-ready stacks. Page: statue wall (22 statue sprites in grade palettes), drawer
  "level x per-level x multipliers = total", By character matrix, W4-entry Goals strip. Advice
  (`kb-drafts/statues.yaml`): `check.town-marble`, `check.deposit-held` (reserves 20 Power for Krunk 2), goals
  `monolith-1`, `onyx-tools`, `check.onyx-ready`, two facts. No advice: level order, split-deposit loss, Gold price
  formula.
- **FR-50 Star Signs W1-W3** (`star-signs`, existing page + Constellations tab, L). Tracks banked SCP against the next
  chart nodes, claim-ready constellations, sign slots per character, worn Infinite signs, Majors worn below their level,
  downside signs, constellations needing more characters. Advice (`kb-drafts/star-signs.yaml`, 11): checks
  `claim-ready`, `empty-slot`, `infinite-worn`, `major-below-level`, `negative-worn`, `points-idle`, `more-characters`;
  goals `constellation-w4`, `signs-w4`, `infinite-stars` (W4 hooks folded in from FR-18b); D-1..D-7 rows in
  `fact.constellations`.
- **FR-51 The Owl** (`owl`, new page, M). New `account.owl` (nothing is adapted today): feathers and rate, the 9 unlock
  thresholds, Feather Restart and Mega Reset affordability and multipliers, Megafeathers, Bonuses of Orion. Advice
  (`kb-drafts/owl.yaml`): checks `restart`, `mega-reset` (guarded until the Megafeather cap check), `bonuses`, `start`;
  goals `megafeathers`, `drop-rate`; two facts. Detector `owl/state` following Toolbox's restart alerts.
- **FR-52 Post Office** (`post-office`, new page, L). Tracks the unlock quest, six companies (done today, streak,
  shield, total shipments), refresh timer, Silver Pens, box income rebuilt as Toolbox does (never the saved
  `DeliveryBoxMisc`), 24 box levels per character and thresholds 26 / 101, Slug Slurp, the USPS task. Advice
  (`kb-drafts/post-office.yaml`): `check.add-silver-pens`, `check.save-streak` (Contested until the pen-on-streak
  check), `goal.next-streak-bonus`, `priority.box-order`, `check.open-next-bonus`, `check.slug-slurp`,
  `goal.orders-task`; amendments to `spend-boxes`, `daily-orders`.
- **FR-53 Bosses and keys** (`boss-keys`, new page, L). Tracks key stock Key1-Key5; the daily-key bank and coverage per
  NPC (owns the coverage Check, X14); item-only key quests ready; first clears and portal crystals; boss difficulty;
  Amarok Slabs; mini-boss counts and caps (worker call `getMiniBossesData`). Advice (`kb-drafts/boss-keys.yaml`, 10):
  checks `first-clear`, `first-key`, `unlock-daily` (Djonnut text says "check in game"), `quest-ready`,
  `mini-boss-capped` (the counter-reset rule is an in-game check; until then the Check names the count only, never a
  reset time); goals `amarok-slabs`, `daily-coverage`; two facts; `priority.key-use` is display only (inference).
- **FR-54 Colosseum** (`colosseum`, new page, L). Tracks ticket balance, three NPC ticket banks and the reach rule,
  one-time ticket quests, best score per arena, Tome total, four score achievements, Centurion ranks. Advice
  (`kb-drafts/colosseum.yaml`): `check.first-run`, `goal.score-achievements`, `goal.centurion-ranks`,
  `check.start-ticket-quest`, `fact.arenas`; `colosseum/tickets-banked` gains `requireQuest` (default false until the
  in-game reach check: both test saves show a day counter running with no first quest done).
- **FR-55 Minigames and Poppy** (`minigames`, `poppy`, Highscores tab + new Poppy page, L). Tracks plays and highscores,
  the Tome highscore (n/450), Hoops and Darts unlock ladders, Spiketrap best round (13), Pen Pals tiers, Poppy upgrades,
  Fisheroo Reset, Greatest Catch, Megafish, spirals, bonuses, shiny progress, Tar Pit. Advice
  (`kb-drafts/minigames.yaml`, `poppy.yaml`): goals `tome-highscore`, `spiketrap-round`, `hoops-unlocks`,
  `darts-unlocks`, `pen-pals`; `poppy.check.fisheroo-reset`, `.check.greatest-catch`, `.goal.megafish`; amendments to
  `daily-plays` (FR-8), `darts-spend`, `spiketrap` (gem cap 40 code vs 30 wiki, both shown).
- **FR-56 Quests** (`quests`, Character tab + account page, M). Tracks the unique quest count and milestones, the quest
  book by world (who finished each step), missable quest-gated drops, quest-scaled star talents past their useful
  level, Special Talent Book and Omar bottle quests, AFK quests. Advice (`kb-drafts/quests.yaml`): `goal.unique-quests`,
  `check.missable-drop-last`, `check.quest-talent-past-cap`, `goal.talent-books`, `goal.omar-bottles`,
  `check.afk-quest`; `check.key-quest-every-character` retired (X14).
- **FR-57 Anvil and Smithing** (`anvil`, `smithing`, existing pages, M). Tracks hammers vs expected slots, monster-
  material points, all 11 products with Smithing gate and EXP per work, the speed-source ladder, the next Anvil
  Expansion with materials, Whetstones, Material Pouch tier, the Archer Acme negative balance; gear upgrade-stone slots;
  Smithing Mastery. Advice (`kb-drafts/anvil.yaml`, `gear.yaml`, `skills.yaml`): `check.mat-points` (Wave 2),
  `goal.next-tab`, `check.hammers`, `check.product-exp`, `check.material-pouch`, `check.acme-trick`; `gear.check.stone-
  slots`; `skills.goal.smithing-mastery`. Pitfall: `AnvilPAselect` is a bare number for single-slot saves.
- **FR-58 Upgrade Vault** (`upgrade-vault`, existing page, M). Adds the Knockout section, a Kill rows tab, per-row effect
  with Mastery tier badge and "scales with", the "N.NNx cheaper" chip. Advice in FR-27; fact `major-discount-scope`.

### F6 Account-wide Systems and class lines (Wave 3: FR-59..63, 65, 66, 66a, 68; Wave 4: Beginner line; Wave 7: the rest)

- **FR-59 AFK Setup** (`afk`, new page; the Timeline stays its time view, L; Wave 3). Tracks per fighter the map and monster,
  kills/h, AFK rate, survivability, hit chance, kill-per-kill, overkill, door progress, drop and card chips, prayers and
  curses, golden food; a bounded `afkMaps` sweep (fighters only, 8 maps + current, out of history). Advice (map drafts,
  FR-10): `afk.check.no-hit` (blocker), `.dies-no-food-fix`, `.ruck-sack-fighter`, `.monster-hp-curses`,
  `.better-map` (M, ratio 2 in `values`), `.door-before-return`; `.golden-food-idle` and `.unending-energy-cap` fold
  into FR-60 (same wave) and FR-32 (X10, X2; the Unending Energy line appears once FR-32 ships in Wave 4); `shrines.check.off-afk-map` retired (X13).
- **FR-60 Food and Golden Food** (`food`, new page + Gear tab strip, M). Tracks the 16-entry food buffer per character,
  golden-food multiplier and sources, golden bonus per effect, golden food held but not equipped with its bonus if
  equipped (food clone per target character), slot purchases, a lower bound of unlocked slots, Nutty Crafter progress.
  Advice (`kb-drafts/food.yaml`): `check.golden-unequipped` (H), `check.golden-wrong-effect` (M),
  `goal.nutty-crafter`, facts `golden-foods`, `effect-words`. Never "% of your damage" (additive vs multiplier per
  effect is Contested).
- **FR-61 Storage and carry** (`storage`, new page, L). Tracks Storage Chest slots, free slots and the source ledger,
  bags per character, carry pouch per class and per-slot cap, greenstacks, exact-stack items, Zerg Rushogen on a
  skiller. Advice (`kb-drafts/storage.yaml`, 9): `check.chest-full`, `check.quest-chest`, `check.held-capacity-item`,
  `check.pouch-upgrade` (`lvReqToEquip` is never a gate), `check.zerg-on-skiller`, `check.bag-full` (M), goals
  `pouch-tier`, `greenstacks`, `fact.capacity-items`.
- **FR-62 Drop rate** (`drop-rate`, new page + Character chip, M). One canonical `characters[].dropRate` {total,
  beforeChip, chipAdded, terms} and `account.dropRate` {best, bestCharacterIndex, bestFighterIndex}; the loot farmer is
  the best fighting character. Advice (`kb-drafts/drop-rate.yaml`): `goal.loot-farmer`, `priority.levers`,
  `check.clover-shrine-farmer` (claims the Clover Shrine from shrines.check.idle), `check.next-lever` (skips Upgrade
  Vault rows, owned by the Spend Plan). Card ETAs stay without drop rate (Contested).
- **FR-63 Class EXP and levelling** (`classes`, new Levelling page + Character Level tab, M). Tracks class level and EXP
  for every character, the Class EXP multiplier and its breakdown (label -> System lookup; labels snapshotted),
  level bands, level-limited sources, the lowest-level bonus (strict minimum; 3 vs 4 per level both shown), Time Candy
  hours, Speedna steps. Advice (`kb-drafts/classes.yaml`): `check.lowest-level-tie` (H), `check.lowest-level-idle` (M),
  `check.speedna-step` (H), two facts, `goal.level` amendment.
- **FR-64 Coins** (`coins`, new page, L). Tracks the wallet, cash multi per character (`getCashMulti`) with product
  groups and the additive bracket, the coin farmer, coins/h (labelled an estimate), Upgrade Vault cash rows, real-money
  and event levers as owned / not owned only. Advice (`kb-drafts/coins.yaml`): `priority.levers` (ranked by computed
  gain, real money excluded), `check.gold-set`, `check.cash-bubble`, `check.golden-bread` (fires only when the food is
  on the wrong character, X10), `fact.multi-groups`.
- **FR-65 Talents** (`talents`, `talent-resets`, Talent presets page + Star books and Resets tabs, L). Tracks added
  levels and their sources, point sources per tab, star books found (x of 43), reset items, free-potion quests per
  character, the Slight Do-Over counter. Advice (map drafts): `talents.check.symbols-of-beyond`, `.check.breakpoint`
  (Throttle and Zow steps), `.goal.more-points`, `talent-resets.check.do-over`, `.check.quest-potion`,
  `.check.swap-token`; `idle-talent-zero` and `bubble-raise` fold into FR-24 (X8, X9).
- **FR-66 Skills** (`skills`, Skills tab + new Skills page, L; Wave 3). Tracks efficiency, harvest chance on the AFK
  node, node ladders W1-W4, the fishing kit and pool depth, AFK gains, Skill Mastery display. Advice (map drafts):
  `skills.check.harvest-zero` (blocker; it reads Toolbox efficiency vs the node requirement, tier 1),
  `.harvest-faster`, `.fishing-pool-outgrown`, `.fishing-default-kit`, four facts. The N.js-only numbers (harvest
  chance, fish pools) are display only until FR-2b merges and V40 settles the formula.
- **FR-66a Skills progression** (Wave 3, M). For each gathering skill (Mining, Choppin, Fishing, Catching) the "Next"
  row a W1-W2 player asks for: **next tool tier** (pickaxe, hatchet, rod, net: equip level requirement from `items.json`
  against the best character's skill level and the tools owned); **next door or portal gated by skill level** (mine
  doors Mining 10 / 25 / 40 / 81, fishing portals Fishing 15 / 30: dossier figures, generated from game data before
  they print); **quest unlocks** that open talent books (Glumlee at Mining 11, Krunk at Mining 20) with the level gap.
  Cooking's spice harvest links to FR-14. Page: one "Next" row per skill. Advice: new drafts `skills.goal.next-tool`,
  `.goal.next-door`, `.goal.quest-unlock` (M; written in Wave 3 from the skills dossier, each with its generated fact).
- **FR-67 Achievements** (`achievements`, new System and page, L). Tracks per world the real entries, completed and
  open, Achievement-task tiers, exact-stack readiness, bonus, talent-point and Arcade achievements, Steam-only entries
  (shown, never advised as a to-do off Steam). Advice (map drafts): `check.exact-stack`, goals `task-tier`,
  `bonus-list`, `talent-points`, `arcade-balls`, `info.steam-gems`, `fact.catalogue`.
- **FR-68 Dungeons** (`dungeons`, new System and page, L; Wave 3). Tracks rank, lifetime credits and the next rank, credits,
  Flurbos, boosted runs (bank behaviour both views: wiki weekly reset vs saves holding 23-24), 8 Flurbo stats, 8
  passives, 48 RNG items (raw `-1` = not found), 9 trait sets (`-1` = no pick, M). Advice (map drafts): `goal.rank`,
  `check.trait-pick`, `check.flurbo-spend`, `check.credits-idle`, `check.boosted-runs`, `goal.flurbo-equinox`,
  `priority.flurbo-stats` (M, derived), `priority.cards`. Both test accounts fire trait-pick and credits-idle.
- **FR-69 Pet Park** (`pets`, `pet-tournament`, one page with Collection / Pet Mart / Tournament tabs, L). Tracks the
  per-pet list over 167 named pets (owned = copies > 0 or via token, never Toolbox's simulation), Pet+ levels, tokens,
  crystals, storage, Mart offers, the Tournament division and registrations. Advice (map drafts): `check.spend-token`,
  `check.token-wiped`, `check.token-dead`, `goal.mart-target`, `check.recycle-duplicate`, `priority.spend-plan` (only if it passes FR-2c),
  `fact.catalogue`; `check.friend-slot-empty` folds into FR-72 (X11). Pet Tournament: the live
  `pet-tournament.check.register` is kept unchanged and homed on the Tournament tab (US-74); team size is an in-game
  check, so no team-size advice.
- **FR-70 Family** (`family`, new System and page, M). Tracks family level and per-character contribution, the 11 slot
  gates, the per-class bonus table (`characters[].familyBonuses` adapted), counted class level (stale snapshot
  flagged), duplicates. Advice (map drafts): `family.check.duplicate-line`, `family.fact.bonuses`, "why" lines on
  `metapath.goal.elite` and `.next-character`.
- **FR-71 Guild** (`guild`, new page, M). Tracks membership (the adapter's member test, never Toolbox's always-true
  `unlocked`), level and points, member cap, 17 bonuses with tree positions, tasks with the claimed flag, unspent GP.
  Member names never leave the worker. Advice (map drafts): `guild.goal.join`, `check.claim-met`, `check.daily`,
  `check.weekly`, `goal.next-level`, `priority.bonus-value` ("if you lead the guild"; Now only after the rank-0 check).
- **FR-72 Friend bonuses** (`friend-bonuses`, new page, M). Tracks slots (cap 20), the multiplier (max 2.75x), entries
  in save order with stat, sender level and value, what each stat feeds, companion gates. Friend names are dropped at
  parse (contract test). Advice (`kb-drafts/friend-bonuses.yaml`): `check.free-slots` (H, nice), `check.weak-sender`
  (page only), `goal.friendly-slot`, `goal.companion-upgrade`, `fact.values`.
- **FR-73 Gem Shop** (`gem-shop`, new page, M). Read-only "what you own": bought/max, next price, cost to max, effect
  now -> next, restock badges, Limited Specials, candy value. Advice (map drafts): `check.limited-freebie` (claim the
  1-gem special), `check.teleports-cap`; the existing contested `unspent` and printer lines stay. No buy order.
- **FR-74 Event Shop** (`event-shop`, new page + "owned" chips on 11 consumer pages, M). Tracks Event Points, owned items
  (157-character letter table), the winter counter, a 56-row authored catalogue (costs tier 3, unparsed rows flagged).
  Owned bonuses are already inside Toolbox's totals: never applied twice. Advice: `event-shop.check.points-banked`,
  `fact.items`, the printer `reset-loss-wiring` amendment.
- **FR-75 Trophies, Nametags and Hat Rack** (`trophies-nametags`, new page + "Cosmetic slots" on Gear & Tools, L).
  Tracks worn trophy / nametag / premium hat per character (equipment slots 10 / 14 / 8), Hat Rack gate (YumYum Grotto
  cleared; missing kills = unknown), held copies, found counts, Hat Rack totals, Silkrode chip, Tome rows. Advice
  (`kb-drafts/trophies-nametags.yaml`, 9): `check.fill-slots` lands as a kind inside `gear.check.equip-held`,
  `check.first-trophy` (a reward of 25 gems and a candy, not a gem spend; text reworded), `check.silkrode`, goals `quest-trophy`, `hat-rack-gate`, `found`, three facts. No "deposit your
  hats" advice until the auto-deposit check.
- **FR-76 Town shops** (`town-shops`, new page + "Town shop run" checklist row, M). Tracks daily stock, restock clock,
  catalogue and buy price (4 x sell price, generated), stock bonus (Overstock + Vendor Stamp, added and rounded), shop-
  only stamps, Reset Fragments, Whetstone, town bags. Unreached towns show "later" even with stock (gate on
  `currentWorld`). Advice (`kb-drafts/town-shops.yaml`): `goal.stock-bonus`, `check.reset-fragments`, two facts;
  `stamps.check.shop-now` gains `{price:coins}` and a wallet gate.
- **FR-77 Daily & Weekly Checklist** (`checklist`, `random-events`, Timeline > Daily & Weekly, L). Adds a Reset card
  (daily and weekly reset local time, server and ballot week, resets passed since the save), bank pips per key and
  ticket, a Random Events section, and 13 rows that read their owning Systems' Checks (raid reset, crystal mobs, boss
  gems, Equinox, candle, arcade balls, Crystal Island, mini bosses, breeding nest, dungeon boosts, giant monsters, Lab
  shop, Shimmer). Every row has a Check or an explicit No-advice reason: crystal mobs -> `checklist.check.crystal-mobs`; mini bosses ->
  `boss-keys.check.mini-boss-capped`; Lab shop -> `lab.check.weekly-chip/jewel`; giant monsters -> No advice (daily
  spawn not in the save; the Tachion prayer swap is `prayers.check.tachion-giants`); Candle (Glimmerwick Candle wish,
  an event item) -> No advice (event-only, shown owned / used). Advice (map drafts): `checklist.check.before-reset`,
  `.check.week-ending`, `random-events.check.today`, `checklist.priority.rows`; `lab.check.weekly-rotation`, `prayers.check.tachion-giants` and
  `boss-keys.check.boss-gems` fold into their Systems (X12).
- **FR-78 Class lines** (one PR per line on FR-24; Q4, Q5; the Beginner line in Wave 4, the others in Wave 7). Beginner line (`journeyman-line` page: Rocklyte /
  Cactolyte / Nebulyte ladders, daily casts with countdown rings, Hands matrix, Voidwalker Eclipse and speedrun;
  `kb-drafts/journeyman-line.yaml` 11 + facts 3); Barbarian (Zow and Chow block, Bobbers cap, NPNG early;
  `talents.yaml`); Squire (Precision Power gauge, Throttle ruler, Super Samples, Mastery cap, orb kills; `classes.yaml`);
  Bowman (move-speed gauge with Speedna ticks, buffs, Veins x Smithing, Velocity Vessels); Hunter (trap-preset Check,
  Looty Mc Shooty, BM tab 4 values); Wizard (MP bar, Overclocked Energy, Wis Wumbo waiting, Worship rows, ES block);
  Shaman (Virile Vials, Bubble Breakthrough preset, Busy Brewin', Cranium Cooking ready, Fantasia cap). KB renames to
  `classes.*` at merge (CL 2.8). Tab-4 Builds ship only with two dated Sources (BB skilling, SB skilling at M); the rest
  read "no current build".

## 6. Account State changes and the schema bump plan

Rules (unchanged from M1 TR-11): a field is read from Toolbox output in the adapter only, declared in `fields.ts`
(or the System's `*-fields.ts`) with its Toolbox path and raw keys, has a contract test over
`packages/account-state/fixtures/public/` and the stage fixtures, and is `null` when its section fails (one failure
marks only that sub-field unknown). New Toolbox calls go in `packages/toolbox-parsers/src/calls.ts`; nothing in
`vendor/` changes. Values Toolbox gets wrong are computed by an authored reader with provenance "game client, not
Toolbox" and a test against the raw save (Salt Lick #6 rate, Equinox unlock, Breeding indices). Killroy rooms already
have such a reader (`readKillroy`); M26 only adds its regression test.

**Schema bumps: one per wave release, not per PR.** `SCHEMA_VERSION` is 25 today. PRs inside a wave add their fields
and their line to the pending list in `types.ts`; the wave's release PR bumps `SCHEMA_VERSION` once (about 8 bumps for
M26 instead of about 65). The real numbers are set at release; this spec fixes none. History keeps older states as
they were. Previous-save Detectors compare per sub-field (FR-7), so a release silences only the Detectors whose
compared sub-fields it reshapes, and only for one sync.

| Wave | Block | Fields (owner file) |
|---|---|---|
| 0 | Breeding fixes | `breeding.eggBankSeconds`, `nextEggInSeconds` (fixed meaning), `started` (`world4.ts`) |
| 1 | Rift and its value feeds | `account.rift {unlocked, level, progress, countedChars, task, bonuses[], bonusValues}`, `account.skillTotals`, `account.towersTotalLevel`, `account.smithingMastery`, `cardStarCap` (new `rift.ts`, `rift-types.ts`, `rift-fields.ts`) |
| 1 | Lab | `lab.characters[].souped/.inTube/.lineWidth/.dropRate?`, `lab.connectionRange`, `lab.bonuses[].value`, `lab.jewels[].value/.multiplier/.group`, `lab.repository[]`, `lab.shop.items[].{claimed, affordable, short}`, `lab.soupedSlots` |
| 1 | Breeding | `eggRarities`, `rows[]`, `multipliersOn`, `failStacks`, `upgrades[].opensAt/dnaCost/meal/mealCost`, `storedMobs`, `hatchPower`, `fence`, `species[]`, `shinyTotals`, `territories[].team/forageSpeed/progress/required` |
| 1 | Cooking | `kitchens[].speedCost/fireCost/luckCost/fireSpeed/mealLuck/recipeSpices/speedFactors`, `meals[].stat/.multiplier`, `cooking.ladles`, `characters[].skillLevels.cooking` |
| 1 | Tome | `account.tome {totalPoints, countedMetrics, metrics[], bonuses, pages, bubbleStacks, extraBonus, rank, nametags}` keyed by metric name (out of history: `metrics[]`); `TOME_FIELD_RAW_KEYS` |
| 1 | Elite | `characters[].eliteStep`, `account.trollTask {tier, stat}` |
| 2 | Salt slice (2.0) | `account.salts[] {held, inRefinery}`, `account.saltLick` |
| 2 | Alchemy | `CauldronState.brew/brewPerHour/newBubble/boosts`, `AlchemyState.ivory: boolean[4]`, `alchemy.nblb`, `alchemy.bubbleLevelsTill100`, `bigBubbleSlotParts`, `alchemyPlan.vialLevels` 0-85, `alchemy.vialMultiplier`, `account.vault.vialOvertune`, `LiquidState.decantCap/decantRate/capParts/bleached/dragonic/rateBonus.saltLick` |
| 2 | Sigils | `account.sigils: SigilsState \| null`, `characters[].slots.sigil` (new `sigils-types.ts`) |
| 2 | Stats, class kit | `characters[].stats`, `characters[].combat` (worker; null on throw or non-finite), `characters[].classKit`, `.talentCooldowns`, `.afkTime`, `.activeBuffs`, `characters[].talents.*.added/.addedLevels` |
| 2 | Forge, Task Board, quick wins | `account.forge`; `account.taskBoard` (W1-W4 rows), `taskBoardDailies`, `taskUnlocks` (game rule), `merits[w].recipeGate`, `account.starTalentCaps`; `StampState.tab/skillIndex/multiplier/stat/bonus`, `StampRaise.nextTiers`, `characters[].anvil`, `account.anvil`, `account.vault.knockout`, `spend.vault.rows[].bonus`, `ConstructionState.totalLevels/slotSources/trimmed`, `ConstructionBuilding.maxLevel` (fix), `account.uniqueQuests` |
| 3 | Every stage | `characters[].food`, `account.food`; `account.storage`, `characters[].{inventorySlots, bagsUsed, maxCarryCap, carryCaps}`; `characters[].dropRate`, `account.dropRate`; `characters[].classExp/classExpMulti/classExpSources`, `account.lowestLevel`; `account.skillMastery`, `characters[].fishingKit`, `account.skillProgress` (FR-66a); `characters[].afkMaps` (out of history), `fighting.*`; `account.dungeons`; talent point sources and star books |
| 4 | W3 core, W1 core | `account.equinox`; `account.deathNotePages` (out of history), `deathNoteMiniBosses`, `characters[].deathNoteFight`; `account.atomCollider`; `prayers[].soul/.costMulti`, `account.souls`, `account.prayerSlots`; `shrines[]` (extend), `shrineTotals`, `characters[].mapIndex`; `totems` (5), `worshipSyphon`, `worshipTotalWaves`; `spend.bribes[].value/.seller`; `statues[].progress/bonus/multipliers/held`, `characters[].statueTalent`; `account.owl`; `postOffice.companies/silverPens/income`, `characters[].postOfficeBoxes`; `keys[].held`, `bosses[].difficulty`, `account.miniBosses`; `account.speedrun` |
| 5 | W2, W3 rest | `cogBoard.cells/flags/spareCogs/...` (out of history); `printer.*` additions; `refinery.cycles/speed/totalRanks`, `characters[].refineryThrottle`; `characters[].trapping`, `account.trapping`; `library.speed/breakpoints/rangeSources`; `armorSmithy.activeSets/gemsReceived/bundleC`; `BubbaState.smoked/coins/multipliers`; `ObolSlot.stats/rerolled/rarity`, `obolStorage[]`, `obolFragments`, `characters[].obolBonuses`; `account.islands`; `killroy.runUpgrades/thirdRoomUnlocked/roomMonsters/prime/bestScores/shop`; `weeklyBattle.schedule/miscBuffs/trophyClouds`, `ballot.candidates/multi`; `account.arcade`; `CardState.cardified`, `account.cardChanceFloor` |
| 6 | W1 rest | `starSigns.infiniteSlots`; `account.colosseum`; `minigames.penPals`, `account.poppy` (widened); `account.questLog` |
| 7 | Late account-wide | `characters[].cashMulti/cashBreakdown/coinsPerHour`; `account.achievements`, `achievementTasks`; `account.pets.*`, `petMart`, `petTournament`; `account.familyBonuses`, `characters[].familyClassLevel`; `account.guild`; `account.friendBonuses` (no names); `account.worldTeleports`; `account.eventShop`; `characters[].cosmetics/hatRackActive`, `account.hatRack`; `account.townShops`; checklist readers; `account.orbKills`, `account.looty.found` |

**Size budget (FR-0d).** **Owner ruling 2026-10-19 (Q12): the cap is 1 MB** (1,048,576 bytes) for a full Account
State, replacing "hold each wave to its budget". The cap had moved 200 KB (M1 TR-16) -> 300 KB (release 4) -> 392 KB
(M20, M18, M21, M24; `packages/account-state/test/contract.test.ts`, which enforces it; this section's earlier "300
KB" was stale). Save history lives in IndexedDB, not localStorage; to keep 30 days inside M1 TR-16's 50 MB at the new
size, it stores a whole state only on the newest save and the boundaries of the newest two Play Sessions, and the
compact copy elsewhere. So no field has to be rounded or kept out of the history record to fit the cap; a field is
left out only where a page or the engine does not need it. Each wave's PRs still report the largest public save's
state size in their description. Baseline (Wave 0.13, 2026-10-19, at the pin): 388,996 bytes on `highend.json`,
the largest public save (`speedrun-rank1.json` 388,088; `first.json`, the W4 save, 197,074), 3 KB under the old cap. M10's 200 KB `EngineResult` cap is a different
one and is unchanged, as is the 320 KB first-load JS budget.

## 7. Knowledge Base entries

The drafts in `scratchpad/m26/kb-drafts/<system>.yaml` (and the 78 ids still in the account-wide maps) are **research
notes, not loadable KB**: most fail the real `AuthoredEntry` and `AuthoredFile` schemas (FR-10). The Wave 0.5
conversion turns them into validated per-System files, still `status: draft`. A wave's PR then **merges** (never
copies) its System's converted file into `packages/knowledge/systems/` (32 file names already exist there; colliding ids
become edits with a golden diff), flips each entry it activates (FR-1), and adds goldens. Drafts carry a red-team
`ship` mark where the 2026-10-19 review decided their fate: `display-only` (12), `excluded` (2), `blocked` (1, on V42),
`neutral-wording` (1); the conversion drops the key and the PR honours it. Entries whose best Source is L, single, or
inferred stay out of Now (the "No advice" lists in section 5 and the syntheses).

Counts by `work/count_drafts.py` (re-run in CI after conversion): 461 records, 452 distinct ids. Per wave:

| Wave | Files (draft ids, as the drafts hold them today) |
|---|---|
| 1 | `rift` (7), `lab` (14), `breeding` (9) + `breeding.facts` (2), `cooking` (11), `tome` (8), `elite-classes` (6) + `.facts` (2), `metapath.patch` (edits); hooks in `stamps` and `skills` |
| 2 | `alchemy-bubbles` (9, incl. `third-slot`), `alchemy-vials` (8, incl. W4 vials and `vial-mastery`), `alchemy` (5), `sigils` (7), `stats` (4), `classes` (the class-kit part), `talents.patch` (edits), `forge` (9), task-board / merit-shop / task-unlocks (8, map, incl. the W4 board), `stamps` (8), `upgrade-vault` (5), `anvil` (`mat-points`), `construction` (the Construction half), `quests` (2) |
| 3 | `food` (5), `storage` (9), `drop-rate` (4), `classes` (levelling), `skills` (map 8 + FR-66a), `talents` (map 8), monster-afk / `afk` (9), dungeons (map 8) |
| 4 | `equinox` (4), `death-note` (8), `salt-lick` (5), `atom-collider` (6), `prayers` (9), `shrines` (5), `worship` (14), `bribes` (5), `statues` (7), `owl` (8), `post-office` (9), `boss-keys` (10), `journeyman-line` (14 incl. facts) |
| 5 | `construction` (Cog Board half), `printer` (5), `refinery` (4), `trapping` (11), `library` (4), `armor-smithy` (4, incl. W4 sets), `bubba` (8), `obols` (10), `islands` (14), `killroy` (9), `weekly-battles` (5) + `ballot` (amendments), `arcade` (6), `cards` (6) |
| 6 | `star-signs` (11, incl. the W4 constellations), `colosseum` (5), `minigames` (8) + `poppy` (3), `quests` (rest), `anvil` (rest), `gear` (1), `upgrade-vault` (rest), `spend` (amendments) |
| 7 | `coins` (5), `friend-bonuses` (5), `event-shop` (2), `trophies-nametags` (9), `town-shops` (4), `classes` (class lines), map-only: achievements (7), pets (8), family (4), guild (6), gem-shop (2), checklist (10) |

## 8. Detectors

Every Detector follows the M11 contract (`DetectorContext` in, `CheckFinding` out), reads only Account State and
frozen `now`, returns **unknown** on a null field, **silent** while its System is locked (FR-6), and declares `claims`
where FR-5 needs them. The per-System Detector ids are in section 5 and in each draft's `detector:` and `progress:` blocks (318
distinct ids referenced by `kb-drafts/`, 259 of them as an entry's own `detector`, counted by `work/count_drafts.py`;
most are new; the account-wide maps add their own). Shared Detectors, built once: `builds/bubble-capped-talent`, `classes/cast-ready`,
`builds/accuracy-short`, `builds/accuracy-over`, `builds/core-missing`, `rift/*` value feeds read by Cards, Vials,
Stamps, Killroy and Skills, `checklist/rows` readers (one per added row). Value feeds with no Now card
(`sigils/eta`, `alchemy-bubbles/boosts`, `coins/cash-multi`) feed pages and the Timeline only.

## 9. Views

Every new page or tab follows the M24 rules:

1. **Answer first.** One framed block (`.a-frame`) at the top: what to do, how long, where. It is the System's top
   firing entry, else a one-line state ("Every golden food you own is equipped"). No placeholder ever sits in it.
2. **Pictures before sentences.** Boards, grids, meters, timers and our sprites (section 10) carry the content; text
   labels the picture.
3. **Next three.** Lists show the three that matter now; the rest sits behind a collapsed section or a tab. Later-world
   rows are greyed "later", never hidden.
4. **Say it once.** Save freshness stays in the top bar; Sources go in one quiet line per page.
5. **One way to move.** Character-scoped pages use the character strip.
6. **Type scale.** 40 / 28 / 22 pixel display; 16 body, 14 secondary, 12 caps label; 8 px rhythm.
7. **Colour means one thing.** Coral losing value now, gold do it, mint done, blue a timer, grey later.
8. **One-line footer.**

Plus: views add no advice (M17); casual wording ("32 levels behind your level" or the item to get); class and level,
never names; Contested entries carry the "sources disagree" badge; real buttons and links, aria labels on icon-only
controls, 4.5:1 contrast; phone (390) and desktop (1440) both designed before build.

**Page registry.** Each row adds a `SYSTEM_HOMES` entry (`packages/engine/src/now/system-homes.ts`), a `pages.ts` entry
(lazy chunk) and a `systems.yaml` row where missing.

| Page | Systems homed | Kind | Wave | Answer frame |
|---|---|---|---|---|
| `rift` | rift | new | 1 | this level's task, AFK or play |
| `lab` (exists) | lab | tabs extended | 1 | first Lab check, else "N of 14 nodes lit" |
| `breeding` (exists) | breeding | + Fence Yard tab | 1 | first Breeding check, else next egg |
| `cooking` (exists) | cooking | tabs extended | 1 | idle or capped kitchen |
| `tome` | tome | new | 1 | score, damage, next unlock |
| `elite-classes` | elite-classes | new | 1 | next promotion step |
| `alchemy` (exists) | alchemy, alchemy-bubbles, alchemy-vials, alchemy-p2w | Cauldrons, Bubbles, Big bubbles, Vials, Liquids rebuilt | 2 | bubble pick or rolls to spend (Boosts shown, never the answer) |
| `alchemy` > Sigils | sigils | new tab, after the rebuild | 2 | Lab gate or next sigil |
| `stats` + Character Stats tab | stats | new | 2 | weakest fighter and why |
| `classes` (Class lines) + Build tab Class kit | classes | new | 2 | next promotion per line |
| `forge` | forge | new | 2 | idle slots and the ore |
| `task-board` | task-board, merit-shop, task-unlocks | new, 3 tabs | 2 | tiers ready to claim |
| `afk-setup`, `food`, `storage`, `drop-rate`, `levelling`, `skills`, `dungeons`; Talents tabs | one each | new | 3 | per FR-59 to FR-68 |
| `equinox`, `death-note`, `salt-lick`, `atom-collider` | one each | new | 4 | per FR-28 to FR-31 |
| `worship`, `prayers`, `shrines` (exist) | one each | tabs and frames extended | 4 | per FR-32 to FR-34 |
| `bribes`, `owl`, `post-office`, `boss-keys`, `journeyman-line`; `statues` (exists) | one each | new / extended | 4 | per FR-48 to FR-53, FR-78 |
| `obols`, `islands`, `killroy`, `weekly-battles`, `arcade`, `library` | one each (+ ballot tab) | new | 5 | per FR-39, FR-42 to FR-46 |
| `printer`, `refinery`, `trapping`, `armor-smithy`, `bubba`, `cog-board`, `cards` (exist) | one each | tabs and frames extended | 5 | per FR-35 to FR-41, FR-47 |
| `colosseum`, `poppy`, `quests`; `star-signs`, `anvil`, `upgrade-vault` (exist) | one each | new / extended | 6 | per FR-50, FR-54 to FR-58 |
| `coins`, `achievements`, `pet-park`, `family`, `guild`, `gem-shop`, `friend-bonuses`, `event-shop`, `trophies`, `town-shops`; checklist rows | one or two each | new | 7 | per FR-64, FR-67, FR-69 to FR-78 |

The registry-completeness test (FR-0b) fails the build when a System in `systems.yaml` has no `SYSTEM_HOMES` or
`pages.ts` entry; a page in this table is "done" only when that test passes for every System it homes.

Each page gets its desktop and phone artboards on the design canvas before its build PR, red-teamed with the wave.

## 10. Sprites

`SPRITES.md` is the manifest: 542 new names (about 700 grid cells with palettes and glyphs), 13 grid files, four of
them new (`stats.ts`, `mobs.ts`, `npcs.ts`, `statues.ts`), each tagged with the first wave whose views need it,
re-tagged to the revised waves (Wave 1: 57, 2: 77, 3: 50, 4: 135, 5: 106, 6: 25, 7: 92; `work/sprite_waves.py`). Rules:
our own pixel art only (ADR 0009), masked-grid format, brand tokens, palette swaps over new grids, colour meanings of
rule 7. Existing sprites listed in `SPRITES.md` are reused, not redrawn; the v2-art question (Q11, owner yes: draw the
sprite-kit versions) is settled before `place-telescope`, `item-ticket`, `item-chest` and `item-carry-pouch` are drawn.

**Acceptance (FR-0c), testable in CI:**
1. **Key test.** Every sprite key a view or entry references (`<Sprite name=...>`, `icon:` fields, `SYSTEM_HOMES` icons)
   exists in the grid registry (`art/sprites/index.ts`); an unknown key fails the build. A key the manifest names but
   that is not drawn yet may render a monogram only if it is listed in `sprites-pending.json`, which the test prints as
   a TODO count; a page's **required** sprites (its answer frame and first screen, marked in the manifest) may not be
   pending.
2. **Snapshot test per grid** at 1x and 2x, in the light and dark themes: an SVG snapshot of every cell. A review diff
   shows what changed.
3. **Readability check** per new grid at 16 px: each cell's foreground passes 3:1 contrast against both theme
   backgrounds (computed from the palette tokens), and no two cells in one grid are identical after palette mapping.
4. **Per-PR cap: 30 new names.** Sprites for a page land one PR ahead of it (required ones) or with the next PR
   (the rest), so sprite work never blocks a page such as the Rift.

## 11. Verification

- **Contract tests** per new field over every public fixture and both stage fixtures; a no-name test asserts no
  character, friend or guild member name appears anywhere in Account State, findings or goldens.
- **Stories are the acceptance.** Every System FR has at least one story in section 4 with a CI fixture and an exact
  string; the story is its golden. A blocked story's golden is recorded only after its V-item or Q settles.
- **Fires examples.** Every Check and Goal has at least one firing fixture and one silent fixture, CI-runnable (public,
  stage or mutated); a private save is only a local truth case.
- **Stage coverage.** Each wave runs US-S1 (locked Systems silent on `stage-w1-early`) and one story per Stage band it
  touches (W1-early, W3-mid, W4-entry, past W4).
- **Goldens.** Recorded per wave after that wave's "Verify before build" items are settled (section 14), at the golden
  clock, on the scrubbed fixtures; a golden diff in review names the field that moved and why (AGENTS.md re-sync rule).
  Wave 1 goldens use `first.json`, `fourth.json`, `highend.json` and mutations if the fresh W4 save is late (FR-9).
- **Lints in CI:** drafts lint and tier conversion (FR-2), game-client Source fields (FR-2b), the two-Source rule
  (FR-2c), the Rift label lint (FR-4), the draft count script (FR-10), registry and matrix completeness (FR-0b), sprite
  keys and snapshots (section 10), the size budget (section 6).
- **Truth run (M22).** At the end of each wave, the local truth run on both private saves and `?debug=truth` on the PR
  Preview: every shown number on the wave's pages is diffed against the raw save, and every M26 invariant (Rift label =
  `Rift[0]+1`; Killroy rooms; Equinox unlock; Breeding indices; Salt Lick rate; no locked-System Check) is a truth rule.
- **Determinism.** Every time-based field takes frozen `now` (`getWeeklyBoss`, `killroyWeeks`, cooldowns, Equinox
  full-at, Lab reset); no randomness in the worker unless seeded (Q6).
- **Performance.** Worker budgets per wave: at most 4 extra `getMaxDamage` calls per fighter (FR-23), the `afkMaps`
  sweep bounded (FR-59), KB compile size measured per wave against a +25 KB budget per System file.
- **Accessibility and layout.** Each new page is checked at 390 and 1440, light and dark, against rules 1-8, by a
  Playwright screenshot per page and theme in the PR Preview.

## 12. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | Scope: about 40 pages, over 300 Detectors and 540 sprites is several milestones | Eight waves; one concern per PR; each wave ships to a Preview and can stop there; sprite cap per PR |
| R2 | Double advice across Systems | FR-5 claimed-by rule and MASTER section 5; a test that no two cards in a golden name the same claim key |
| R3 | Advice from weak Sources | Checks and Goals ship only at H or M; Priorities and Builds need two independent dated post-patch Sources (FR-2c lint); L, single-Source and inferred orderings are display only; Contested where post-patch Sources disagree |
| R4 | Toolbox false positives read as truth (Equinox unlock, Throttle maxLevel, 16 forge slots, guild unlocked, Toolbox pet simulation) | Authored readers with raw-save tests; truth rules. Killroy rooms already right in ActiveOn (regression test) |
| R5 | No W1-W3 public save, and the W4 private save is late-W3 | Stage fixtures from `first.json` (FR-0a); fallback goldens on `first.json`, `fourth.json`, `highend.json` (FR-9); unlock guards keyed on unlock facts (FR-6) |
| R6 | History and state size | Owner ruling 2026-10-19 (Q12): the cap is 1 MB; history keeps whole states only on the newest save and the newest two Play Sessions' boundaries |
| R7 | Pre-patch or unmatched client Sources: the N.js copy is labelled "game v1.23" from an update tag and is not proven to be 2.3.540; Hoops cost, cooldowns, Spiketrap gem formula and the atom order gist are older still | V43 records the N.js hash, Last-Modified and in-client version; N.js-only verdicts (Breeding indices 3/5/7/10, Killroy rooms, Rift display offset, Salt Lick rate) are M at most until matched; "game v1.23" is dropped from the dossiers' labels at conversion; flagged Stale in drafts; no prices printed from pre-patch Sources |
| R8 | Raw counters tick on locked accounts (islands, equinox bar, guild tasks) | Unlock guards on unlock facts (FR-6); US-S1 |
| R9 | Concurrent draft files (several areas appended to `classes.yaml`, `lab.yaml`, `metapath.patch.yaml`, `stamps.yaml`) | Area backups in `synth/*-kb-backup/`; one conversion script (FR-10); the duplicate-id check |
| R10 | Stage registry stops at W4-entry, so W4 advice vanishes past W4 | FR-3 is the first Wave 0 PR; no W4 entry is promoted before it |
| R11 | Stage fixtures built by mutation may parse differently from a real early save | The build script asserts a non-empty parse and the intended Stage; the W2 test account is the local check for W2; a real W1 save is welcome but not required |
| R12 | The owner's blanket "yes" is mapped to specific options by us | Section 13 lists the mapping; the orchestrator confirms it with the owner in the next batch |

## 13. Open questions (owner, batched)

The owner answered on 2026-10-19: "Yes to all your questions". Read as accepting each recommended option below; the
orchestrator should confirm the mapping (R12). Q8 is excluded: an outbound message needs a yes on that specific
message, never a blanket yes.

1. Q1 `status: draft` in the schema (recommended) or flip at copy time (FR-1)? **Yes: schema.**
2. Q2 W4-mid and W4-late now (recommended), or a beyond policy only (FR-3)? **Yes: both now, plus the beyond policy.**
3. Q3 Tome before Account LV 350: show the rows labelled "not counting yet" (recommended), or hide until W4? The
   earlier "from Account LV 300" was wrong: the Tome gate is 350 (`tome.ts#L44,#L54`), and below it Toolbox pays no Tome
   PTS, so a fact at 300 would explain a bonus that does not exist. **Yes, read as: show, labelled.**
4. Q4 One `characters[].classKit` union (recommended) or one field per line? **Yes: union.**
5. Q5 Beginner line: its own page plus a Class lines card (recommended), or the card only? **Yes: page + card** (Wave 4).
6. Q6 Cog Board plan: seeded Toolbox optimiser in the worker (recommended), or no plan? **Yes: seeded.**
7. Q7 Tower Defense as a Worship tab and the Hat Rack inside Trophies (both recommended), or their own Systems? **Yes.**
8. Q8 Upstream reports to Toolbox (getKillRoy world gate, Salt Lick rate, Throttle maxLevel, Farsight y, Sailing
   Eldritch reading `rift[0]`): each is an outbound message and needs a yes per message. None was sent. The Killroy
   Prime and Skill Mastery gates are **not** on this list: they are not shown to be Toolbox bugs (FR-8; V2 first).
9. Q9 Sigils tab gate: Lab presence or sigil progress (recommended, FR-6), or `currentWorld >= 4`? **Yes: unlock fact.**
10. Q10 Game-client reads as tier 1 (recommended, FR-2b): amend ADR 0004 and the schema so an N.js read is tier 1 with
    an excerpt hash, the client build and the in-client game version. **Yes.** It is resolved in Wave 0 (MASTER 0.4),
    before FR-2's conversion runs. The full list of draft Sources the live schema rejects today
    (`work/source-lint.json`, by `work/lint_sources.py`): 31 tier-1 N.js URLs (breeding, cards, killroy and others) and
    19 tier-1 URLs that are not sha permalinks (8 vendor file paths in boss-keys, a 7-character sha, a research-branch
    URL, a main-branch URL, ...); 35 non-https URLs, 21 of them scratchpad dossier self-citations (circular, replaced by
    the committed `docs/research/m26/` path); 103 tier 2-3 Sources without `claimDate`; 22 Sources with a `notes` key
    and 2 with `prePatch`, which the strict Source object rejects. The H verdicts for Breeding, Killroy and the Rift that
    rest on N.js byte offsets get the excerpt hash and game version at conversion, or drop to M.
11. Q11 v2 design glyphs on System pages (telescope, ticket, chest, pouch), or draw the sprite-kit versions
    (recommended)? **Yes: sprite-kit versions.**
12. Q12 (new) The projected Account State passes the history cap (section 6). Raise the cap (an M1 change), or
    hold each wave to its budget by rounding and keeping more fields out of history? **Owner ruled 2026-10-19: raise
    the cap to 1 MB.**

## 14. Verify before build

Mechanics to check **in code first** (agent tasks: N.js at the pin, Toolbox source, raw saves), before the wave's
goldens are recorded. Each blocks the named entries; until it is settled the entry stays draft or ships Contested.

| # | Wave | Mechanic to verify | Where | Blocks |
|---|---|---|---|---|
| V1 | 1 | Rift task quotas and kinds; does `Rift[0]` advance by itself or need a claim; the unlock key (Rift Ripper step vs `Rift[0]`); the base of the elite `riftGate` numbers | N.js `RiftStuff[4]/[5]` vs `riftInfo` text | `rift.fact.levels` (quota numbers), `rift.check.quota-done` and `.afk-task` copy, US-1 to US-3 |
| V2 | 0 | Does the game gate Killroy Prime (Rift >= 50) and Skill Mastery base 7 (Rift >= 15)? Toolbox says no (`printer.ts#L101`, `damage.ts#L491`); one synthesis line says yes ("likely, verify") | N.js `RiftStuff`; Toolbox `damage.ts`, `printer.ts` | any change to damage or printer multipliers (none planned; FR-8 b) |
| V3 | 2 | Sigils: `getLabBonus(...,12)` vs `LabNode.lit` agree on `fourth.json` / `highend.json`; sigil seat = cauldron slot >= 100; does levelling wait for the Sigils page | Toolbox `alchemy.ts`, N.js | `sigils.check.lab-off`, `.ready` copy |
| V4 | 1 | Lab chip-slot levels 5/10/15/25/35/50/75; `currentRotation` index vs flag; Grounded Motherboard index; Lab EXP x All Skill EXP | Toolbox `lab.ts`, N.js | `lab.check.empty-chip-slot`, weekly checks |
| V5 | 1 | Breeding multiplier-unlock indices 3/5/7/10; egg time accrual while the nest is full; Mob store cap `3*GenINFO[18]`; heart cap 9 vs 10 | N.js, raw saves | FR-8 fixes, `full-nest` ETA |
| V6 | 1 | Cooking spice per upgrade and kitchen prices; 100/day spice claim cap; `KITCHEN_AFK_TARGET` string | N.js, fresh W4 save | `cooking.goal.kitchen-speed`, `.check.afk-chef` |
| V7 | 1 | Tome: 124 metrics by name; damage from Account LV 350 with no W4 gate | Toolbox `tome.ts#L254-L256` | Q3, `tome.fact.score` |
| V8 | 1 | Greenie Gang kill-counter key (the matrix lists it as missing) | `quests.json`, raw saves | `elite-classes.check.eliteus` "gang" text, US-12 |
| V9 | 2 | Luck Boost factor `round(10(1+0.05L))/10`; Cost and 2x Extra effects (not in Toolbox); bubble discounts outside the parsers | Toolbox `alchemy.ts`, N.js | `luck-odd`; "not modelled" labels |
| V10 | 2 | Vial catalogue 42-85 (func, x1, x2, world); Vial Mastery code gate 35; Meritocracy term | Toolbox `vials.json`, `alchemy.ts` | FR-21 |
| V11 | 2 | Salt Lick #6 rate in `LiquidHRrate`; Decant Rate effect | N.js | FR-22 rate breakdown |
| V12 | 2 | Forge slot unlock rule and upgrade costs; Fossil Fuel value 0.2 | Toolbox `forge.ts#L56,#L106-L110`, N.js | FR-25 |
| V13 | 2 | Task Board column rule (unlocks bought + anvil tab) vs worlds reached; recipe gate `2 + level`; W4 daily without Nebula_Neddy1 | N.js, raw saves | FR-26 |
| V14 | 2 | Stat snapshot meaning (`PVStatList`, refreshed on load?) and accuracy curve constants | Toolbox `character.ts`, N.js | `stats.check.*` |
| V15 | 2 | Precision Power 2.25x Defence; Refinery Throttle level used; Super Samples counted 0; Farsight x vs y | `talents.json`, N.js | CL Checks, FR-37 |
| V16 | 4 | Equinox: `Dream[0] = 120` initial value; Mirror drop 1 in 10 (data) vs 1 in 1000 (achievement text) | N.js, drop tables | FR-28 copy |
| V17 | 2 | Construction max levels with extras (`applyMaxLevelToTowers` not called); TowerSaltCost; trimmed slot cap 8 vs 6 | Toolbox `construction.ts`, N.js | FR-27 construction, FR-35 |
| V18 | 5 | Printer 90% cap; `cooldowns['32']` unit; building max 11 vs 10 | N.js | `go-brrr-ready`, `sample-size-cap` |
| V19 | 4 | Prayer wave gate off-by-one; Wizard-line class ids 32/34/35; Tachion gate | N.js, raw saves | FR-32 |
| V20 | 4 | `ShrineHrREQ` and progress unit; shrine `mapId 0` meaning | N.js, Toolbox `shrines.ts` | ETAs (none until settled), X13 |
| V21 | 5 | Trap capacity = set ID + Call Me Ash; Call Me Ash locked before bubble 11 | N.js | `trapping.check.free-slots` |
| V22 | 4 | Death Note building cost past Lv 1; skull names above Gold | `items.json`, N.js | FR-29 labels |
| V23 | 4 | Atom Collider switch field; `accountOptions[134]` meaning; unlock-source to atom index | raw saves, N.js | `atom-collider.check.threshold` |
| V24 | 5 | Obol reroll maps of stored obols and the altar workbench; Liquid Shop counters `CauldronInfo[10]` | Toolbox `obols.ts`, raw | `swap-better` scope, `liquid-shop` |
| V25 | 5 | Island middle-tier costs (code vs wiki); `accountOptions[182]` Shimmer; how `OLA[227]` is earned | Toolbox `islands.ts#L113-L125` | FR-43, FR-44 |
| V26 | 5 | `OLA[308]`, `OLA[39]`, `OLA[190]` encodings; `getWeeklyBoss` reads `GlobalTime` | Toolbox `weeklyBosses`, raw | FR-45 |
| V27 | 5 | Arcade Gold Ball cost curve (upstream `arcade-shop.jsx`) | upstream Toolbox | `spend-gold-balls` |
| V28 | 2 | Cards: bosses excluded from the x5 unowned drop | N.js | Cards grind fix |
| V29 | 4 | Bribes Bail cost split (garbage and/or coins) | `bribes.ts#L15`, data | `bribes.check.bail-gate` text |
| V30 | 6 | Star Signs: 49 constellations in data vs 54 on the wiki; chart node levels | `starSigns.ts#L33-L37` | FR-50 facts |
| V31 | 4 | Post Office income rebuild (never `DeliveryBoxMisc`); streak bonuses past 100 | `postoffice.ts#L49-L63` | FR-52 |
| V32 | 6 | Vault Beeg Forge unlock unit (860); Merit W1 #4 text 4% vs data 7 | data, raw saves | capacity text |
| V33 | 6 | `AnvilPAselect` bare number; Toolbox sorts `anvilSelected` in place; monster-point cap 700 | `anvil.ts#L135,#L191` | FR-57 |
| V34 | 7 | Gem Shop Limited Specials counters on rotation; teleport cap `100+160N` | Toolbox, raw | FR-73 |
| V35 | 7 | Achievements: per-slot storage stacks; idx 219 points 8 vs 10; idx 140 vs 144 | Toolbox `achievements`, raw | FR-67 |
| V36 | 3 | Dungeons: trait `-1` = no pick; credit and Flurbo cost formulas | raw saves, `wikiTables` | FR-68 |
| V37 | 7 | Pets: owned = copies > 0 or via token; free-pull tradable flag | Toolbox `companions`, raw | FR-69 |
| V38 | 7 | Guild: rank 0 = leader; claimed flag in column 1 | raw saves | `priority.bonus-value` on Now |
| V39 | 7 | Family level sums `Lv0` (code) vs `StatList[4]` (dossier) | Toolbox `index.ts#L304` | FR-70 |
| V40 | 3 | Skills: maps with two nodes; harvest chance formula | `shared-data.json`, N.js | FR-66 ladders |
| V41 | 7 | Event Shop `OLA[323]` cap 50; ids 48/49 | raw saves | FR-74 |
| V42 | 2 | Talents: bottle raise = min(bubble level, talent level) or "only past bubble 100" (wizard vs shaman dossier); star books per character or account | `talents.json`, N.js | `classes.check.fuscia-over-bubble` and the other three bubble-capped texts, Build target 1, US-16, FR-65 |
| V43 | 0 | The N.js copy's real game version: file hash, Last-Modified, an in-client version marker; match to 2.3.540 | the local `N.js`, the live client | every N.js-only verdict above M (R7, FR-2b) |
| V44 | 1 | Eliteus step detection: `Eliteus1` / `Eliteus2` keys, the picker classes 8/9/20/21/32/33, no level gate, re-entry sets the count to 10 (dossier C5: tier 3, conf L, older N.js) | N.js at the pin, raw saves | `characters[].eliteStep` at H, the "pick" text |
| V45 | 1 | Lab souped-tube keying (dossier C2, Disputed) | Toolbox `lab.ts`, N.js | `lab.soupedSlots` reading |

In-game checks (owner, credential-bound, minutes each) are listed in MASTER.md section 7. The table's wave column
follows the revised waves (section 3).

## 15. Phased build plan

The waves of MASTER.md section 4 (revised): Wave 0 foundations; Wave 1 World 4 core (Rift, Lab, Breeding, Cooking,
Tome, Elite classes); Wave 2 the W2/W3 gaps (salt slice, Alchemy, Sigils, Stats, Class kit, Forge, Task Board, quick
wins); Wave 3 what fires for every stage (AFK Setup, Food, Storage, Skills, Class EXP, Dungeons, Talents, Drop rate);
Wave 4 W3 core and W1 core; Wave 5 W2 and the rest of W3; Wave 6 the rest of W1; Wave 7 late account-wide Systems
and class lines. Each wave: its stories exist (section 4), then the red team of this spec's sections for it, the
V-items it needs, sprites, adapter PRs, Detector and entry PRs, pages, goldens, truth run, PR Preview, owner review.
Production deploys follow the batched-release rule; the release PR carries the wave's one schema bump.

## 16. Red-team log

Red team of 2026-10-19 on this spec, MASTER.md and `kb-drafts/`: 33 findings (6 P0, 16 P1, 11 P2). Every P0 and P1 is
fixed (one P1 part rejected with a reason, RT-20); every P2 is fixed. Where a finding was itself wrong in part, the row
says so. Backups of every file touched before the fixes: `work/redteam-backup/`. Scripts written for the fixes:
`work/count_drafts.py`, `work/lint_sources.py` (+ `source-lint.json`), `work/deferred.py`, `work/sprite_waves.py`,
`work/rt_ship.py`.

| # | Sev | Finding (short) | Resolution | Where |
|---|---|---|---|---|
| RT-1 | P0 | 36 stories covered about 20 of 64 topics; "every mechanic tracked, shown and guided" was untestable | Fixed. Every System FR now has at least one story (83 stories plus 3 stage stories US-S1..S3), each with its FR, wave, Stage band, status (testable / blocked: V-n), a CI fixture and the exact rendered string from the draft template. Each wave's red team is gated on its stories existing (header, section 4, section 15, MASTER section 4). A script check found no System FR without a story | section 4 |
| RT-2 | P0 | Wave 1 hooks built before their pages (vials 42-51, third big-bubble slot, Task Board W4, Armor Smithy W4 sets, Star Signs D-1..D-7, card star cap, Sigils on the page Wave 2 rebuilds, Lab chips on missing pages) | Fixed. Rule "a hook lands with its home page": FR-18 split into FR-18a (hooks on pages that exist and are not rebuilt: Gilded Stamps, Skill/Smithing Mastery, Lab rotation row; Wave 1.7) and FR-18b (each other hook folded into its home FR and wave). Sigils moved to Wave 2.5, after the Alchemy rebuild. Value feeds with no page (Ruby Cards star cap, Vial Mastery, Gilded, Skill Mastery) ship with the Rift adapter. Lab chips ship with their target page (Stamps, Printer, Refinery in Wave 1; Bubbles, Vials, Sigils in Wave 2; Death Note in Wave 4) | FR-11, FR-12, FR-15, FR-18a/b, FR-20, FR-21, FR-26, FR-40, FR-47, FR-50; MASTER 1.1-1.7, 2.2-2.5, 2.9, 5.6, 5.12, 6.1 |
| RT-3 | P0 | Salt Lick #6 rate (FR-22) and `construction.check.bar-full-unpaid` need salt and Salt Lick data that only arrived in Wave 3; no owner for salt held | Fixed. New Wave 2.0 salt adapter slice (FR-21b, no page): `account.salts` (chest and Refinery storage) and `account.saltLick`. That PR owns the salt-held field; Construction, Salt Lick, Refinery and Liquids read it. 2.4 and 2.10's construction items run after 2.0. US-83 tests it. (The Cog Board adapter is not needed by either item, so it stays in Wave 5) | FR-21b, FR-22, FR-27, FR-30, FR-37; MASTER 2.0 |
| RT-4 | P1 | Build order wrong for W2/W3 players: AFK Setup, Food, Storage, Skills, Class EXP, Dungeons, Talents, Drop rate fire on the W2 save but sat in Wave 6; W1 pages in Wave 5 | Fixed. New Wave 3 "what fires for every stage" holds all eight. W1 core (Bribes, Statues, Owl, Post Office, Boss Keys, Beginner line) is interleaved with W3 core in Wave 4. Gem Shop, Guild, Friend bonuses, Trophies, Town shops and Event Shop stay last (Wave 7). The plan now has eight waves (0-7); MASTER section 3's wave column, the effort roll-up, the schema table, the page registry, the V-table and SPRITES.md's wave tags were all re-mapped | section 3, MASTER section 4 |
| RT-5 | P1 | No W1-early or W3-mid fixture; `fresh.json` unreferenced | Fixed, with a correction: `fresh.json` is **not** W1-early; the contract snapshot shows it at `currentWorld` 6, like `second`, `third` and `fourth`. Only `first.json` is a W4 save (4); no public save is W1-W3. So stage fixtures are built by script from `first.json` (`stage-w1-early`, `stage-w3-mid`) with a parse-and-Stage assertion (FR-0a, R11). US-S1 asserts locked Systems stay silent on `stage-w1-early` every wave. The spec's own "`fourth.json` mid-W4" was also wrong and is corrected to "past W4" | Fixtures, FR-0a, section 11, MASTER 0.11 |
| RT-6 | P1 | Stories depending on unresolved items (US-11 on Q3, US-12 on V8, US-1 on V1, US-13 undefined roll and Contested threshold, US-25 on X2); stories asserted check ids, not text | Fixed. Each story is tagged testable or blocked with its V-item; strings are exact. "Roll" is defined in FR-19 (one bubble-unlock attempt; cost = the cauldron's brew per roll from Toolbox). US-13 now asserts the display-only Boosts board, not a threshold. US-25 is a Contested next-action with "may have stopped" wording (draft text fixed). V1, V7, V8 are Wave 1 blockers before goldens; Q3 is answered (350) | section 4, FR-19, section 14 |
| RT-7 | P1 | Skills omitted gathering progression (tool tiers, doors and portals, quest gates, Catching) | Fixed. New FR-66a (Wave 3): next tool tier, next door or portal by skill level, quest unlocks with level gaps, for Mining, Choppin, Fishing and Catching; Cooking's spice harvest links to FR-14. N.js-only harvest-chance numbers stay display only until FR-2b and V40. US-45 | FR-66, FR-66a |
| RT-8 | P1 | Source-tier policy unresolved (Q10); "tier" meant different things in dossiers, drafts and FR-2 | Fixed together with RT-16. One numbering (the live one), a conversion script from both research labellings, a drafts lint in CI that fails on unconverted tiers. Q10 is resolved in Wave 0 (MASTER 0.4) before FR-2's conversion runs | FR-2, FR-2b, Q10 |
| RT-9 | P1 | `currentWorld` 3 on the W4 test account silences W4 Detectors; US-7 / US-9 claimed "both accounts"; Wave 1 blocked on the owner's fresh save | Fixed. US-7 / US-9 now target `first.json` and the fresh save, and say the private saves are correctly silent. FR-6 keys unlock guards on each System's own unlock fact, `currentWorld` only as fallback. FR-9 adds the fallback: Wave 1 goldens on `first.json`, `fourth.json`, `highend.json` and mutations | US-7, US-9, FR-6, FR-9, R5 |
| RT-10 | P1 | Sprites had no testable acceptance | Fixed. FR-0c / section 10: CI key test (every referenced sprite key exists; pending keys listed, never on a page's required set), per-grid snapshot tests at 1x and 2x in both themes, a 16 px contrast check per cell, a 30-name cap per PR, required-vs-later sprites so sprite work never blocks a page. SPRITES.md re-tagged to the new waves | section 10, MASTER 0.10, SPRITES.md |
| RT-11 | P2 | Candle, crystal mobs, giant monsters, mini-boss reset and Pet Tournament had no Check; live KB files portals, walkthrough, slots had no M26 home | Fixed. Section 3 table maps every live KB file to its FR (extend or unchanged). FR-77 gives each checklist row a Check or a No-advice reason (Candle and giant monsters: No advice); FR-53 handles the mini-boss reset as count-only until the in-game check; FR-69 keeps the live `pet-tournament.check.register`, homed on the Tournament tab (US-74). Cooking Gems / Richelin stay "No advice" (gem buys, N3) | section 3, FR-53, FR-69, FR-77 |
| RT-12 | P2 | Deferred rows inconsistent (Gallery, Crucible with effort; Hat Rack inside Trophies) | Fixed. Deferred register (MASTER Appendix B, 38 rows, `work/deferred.py`) with a grey-later / omit flag; excluded from coverage percentages (recomputed: 1,380 rows, 22% shown in full, 22% advised in full) and from the effort roll-up. The Hat Rack stays in Trophies (Q7 yes) and is in scope; only the Gallery rows are deferred | N1, MASTER section 2 and Appendix B |
| RT-13 | P2 | About 65 schema bumps; FR-7 silences previous-save Detectors after each; no size projection | Fixed. One bump per wave release (about 8); FR-7 compares per declared sub-field; the user-visible consequence is stated (one silent sync after a release that reshapes a compared sub-field). Size projection table added (with RT-29) | section 6, FR-7 |
| RT-14 | P2 | G1 and G2 had no mechanical test | Fixed. FR-0b: registry-completeness test (every System has `SYSTEM_HOMES` and `pages.ts`) and matrix-completeness test (every Appendix A row maps to a field, Check, No-advice reason or Deferred row) | G1, G2, FR-0b, section 9 |
| RT-15 | P0 | FR-2 renumbered tiers and called it ADR 0004; the live schema keys behaviour on the numbers; wiki tier mixed in the drafts | Fixed, verified: ADR 0004 and `schema.ts#L63-L84` define 1 game data, 2 wiki after the patch, 3 dated community guide, 4 anything else; `entryRules` need tier 1-2 for blockers. FR-2 now keeps that numbering, does no bulk rewrite of the live KB, and converts the drafts by script; the lint reports 103 wiki Sources at tier 3 today. The "Decisions" paragraph now quotes ADR 0004 as written | header, FR-2 |
| RT-16 | P0 | Drafts are not loadable KB (268 of 390 fail `AuthoredEntry`; 36 files fail `AuthoredFile`; 32 file names and some ids collide with live files) | Fixed. Section 7 now calls the drafts research notes. FR-10 is a Wave 0.5 conversion script (shape, Sources, facts files, amendments as edits) with merge-not-copy for the 32 colliding files, the colliding ids named (4 outside the patch files: `bubba.fact.charisma-targets`, `armor-smithy.check.register`, `death-note.contribution.skull`, `talents.build.hunter-fighting`; the red team's "six" also counted patch ids), and the drafts lint and count script in CI | section 7, FR-10, MASTER 0.5 |
| RT-17 | P0 | US-13 boost-speed advice rests on an L switch point the dossier calls inference; community Sources say the opposite; boost order on one tier-4 guide | Fixed. `boost-speed` and `boost-order` are display only (drafts marked `ship: display-only`); the Boosts board shows both views with the "sources disagree" badge; only `luck-odd` stays advice. I re-checked the parity in JS: the factor steps up exactly when moving to an odd level (L = 0..20 printed; the red team checked 0..170), so luck-odd is sound | FR-19, US-13, US-14, N4, `kb-drafts/alchemy-bubbles.yaml` |
| RT-18 | P1 | FR-8's Killroy Prime / Skill Mastery "fix" contradicts tier-1 Toolbox (`printer.ts#L101`) | Fixed, verified at `printer.ts#L101`. Downgraded to verify-first (V2), both views recorded with confidence, "bug" wording dropped from Q8 and FR-36, and the ADR 0005 problem (no way to change `getMaxDamage` internals from `src/`) stated as a precondition. The Skill Mastery base 7 is shown as Toolbox applies it | FR-8, FR-36, Q8, V2, MASTER 0.9 and Q8 |
| RT-19 | P1 | 19 conf-M Priorities rest on one Source or inference; the ADR 0004 amendment only forces Contested on two disagreeing Sources | Fixed. FR-2c two-Source lint for Priorities, Builds and Meta Path orderings. Re-graded the named entries: `islands.priority.unlock-order`, `bubba.priority.gifts`, `.milestone-upgrades`, `killroy.priority.runner`, `.skull-shop`, `cooking.priority.meals` (L), `boss-keys.priority.key-use` (L), `bribes.priority.set-order` (L), `atom-collider.priority.order` (L), `lab.priority.chip-picks`, plus the two Boost entries: display only, marked in the drafts. The remaining M Priorities must pass the lint at conversion | FR-2c, N4, FR-12/14/31/41/43/44/48/53 |
| RT-20 | P1 | Three gem-spend next-actions drafted despite N3; a Discord reference | Partly fixed, partly rejected. `alchemy.check.bleach-first` and `forge.check.brimstone-first-slots` are excluded (`ship: excluded`); Gem Shop shows owned / not owned with the `gemShop.json` price; the Discord tier was removed from the forge draft. **Rejected for `trophies-nametags.check.first-trophy`:** it is not a gem spend; My First Trophy *pays* 25 gems and a candy. Its text was ambiguous ("for 25 gems"), so it is reworded to say so (US-79) | N3, FR-22, FR-25, FR-75, drafts |
| RT-21 | P1 | US-16 / `fuscia-over-bubble` stated as H though the dossiers disagree and V42 is open | Fixed. Confidence M, both dossier views on the kit row, the Check and Build target 1 blocked on V42 (`ship: blocked` in the draft) | US-16, FR-24, V42 |
| RT-22 | P1 | Rift texts printed stored numbers (5/10/15, Rift 40) despite FR-4 | Fixed in the drafts (`rift.yaml` x3: displayed 6 / 11 / 16; `construction.yaml`: Rift 41) and FR-4 now has a lint that fails on a bare number after "Rift" in player text, with display tests for each bonus | FR-4, drafts |
| RT-23 | P1 | `quota-done` says "claim it" although whether `Rift[0]` advances by itself is open; quotas printed from an L table; "cross-checked" claim false | Fixed. Neutral text ("task looks complete"), M kept; quotas print only from a generated fact with a traced Source (V1), else kind and progress only; "cross-checked" removed (it is V1's job) | FR-11, US-2, V1, `kb-drafts/rift.yaml` |
| RT-24 | P1 | Undefined W4 bands; draft stage ids W4-early, W5-entry, W7 | Fixed. FR-3 is the first Wave 0 PR (MASTER 0.1); drafts remapped on 2026-10-19 (W4-early -> W4-entry in 6 entries; vials capped at W4-late, no W5+ stage left) | FR-3, drafts |
| RT-25 | P1 | Q10 understated: 39 tier-1 non-permalinks, 31 non-https, 80+ missing claimDate, notes in Sources; H verdicts on N.js byte offsets | Fixed. Q10 now carries the full list, counted by `work/lint_sources.py` (31 N.js tier 1, 19 non-permalink tier 1, 35 non-https incl. 21 self-citations, 103 without `claimDate`, 24 unknown keys), with `work/source-lint.json` as the worklist. FR-2b requires an excerpt hash, client build and game version on N.js citations; self-citations are replaced by the committed research path at conversion; H verdicts without them drop to M | Q10, FR-2b, FR-10 |
| RT-26 | P1 | Dossiers label N.js "game v1.23" from an update tag; patch match unproven | Fixed. The Patch paragraph and R7 say so; new V43 records the hash, Last-Modified and an in-client version; N.js-only verdicts are M at most until matched; the label is dropped at conversion. The dossiers themselves are research inputs and were not rewritten line by line (about 245 lines); the conversion step owns that | Patch paragraph, R7, V43, FR-2b |
| RT-27 | P2 | Q3 recommended Account LV 300; the Tome gate is 350; US-11's 150-LV window unreferenced | Fixed, verified at `tome.ts#L44,#L54`. Q3, FR-16 and US-11 use 350 and "not counting yet"; US-11 lists the next three gates instead of a window | Q3, FR-16, US-11, MASTER Q3 |
| RT-28 | P2 | FR-44 adds `calls.killroySchedule` though `killroyWeeks` exists; US-29 presented as a fix | Fixed, verified (`packages/toolbox-parsers/src/resets.ts` exports `killroyWeeks`). FR-44 extends `killroyWeeks` for room monsters; US-29 and FR-8 call the room count a regression test | FR-44, US-29, FR-8 |
| RT-29 | P2 | Size cap misquoted as "M1 TR-16, 200 KB" | Fixed, verified: TR-16 set 200 KB, release 4 raised it to 300 KB (`contract.test.ts#L204`); M10's 200 KB is the `EngineResult` cap. Section 6 names the cap and owner, adds per-wave byte budgets in the contract test and a projection (about 309 KB, an estimate), which raises new Q12 | section 6, Q12, MASTER 0.13 |
| RT-30 | P2 | FR-7 plus about 65 bumps silence compare Checks; fixed numbering assumes a merge order | Fixed with RT-13: bumps per wave release, per-sub-field comparison, consequence stated, the fixed numbering removed from the schema table | section 6, FR-7 |
| RT-31 | P2 | US-4 "50 px base beam" holds only at Lab level 0; souped-tube dispute not carried | Fixed. Line Width read from `lab.playersCords` (`50 + 2 x Lab level` plus percent groups); `lab.soupedSlots` carries both C2 readings until new V45 | US-4, FR-12, V45, MASTER 1.2 |
| RT-32 | P2 | Eliteus claims (no gate, picker classes, re-entry) are tier 3 / L, but the step machine was specified as certain | Fixed. Step detection is M; the "gang" text waits on V8 (counter key) and the "pick" text on new V44 | FR-17, US-12, V8, V44, MASTER 1.6 |
| RT-33 | P2 | Counts drift (459 vs 452 ids; 318 vs 316 Detectors); duplicate and malformed ids | Fixed. Counts now come from `work/count_drafts.py`: 461 records, 452 distinct ids, 318 Detector and progress ids (the spec's 318 was right; the red team's 316 counted differently; 259 are entry-level `detector` ids). The script exits non-zero on the 7 duplicate and 6 malformed ids it finds and runs in CI after conversion (FR-10) | header, sections 7-8, FR-10 |

**Unresolved P0:** none. **Still open after the fixes (not P0):** the owner should confirm how "yes to all your
questions" maps to Q1-Q11 (R12) and answer Q12 (size cap); V1, V7, V8, V44 must settle before Wave 1 goldens; V42
before the Fuscia line; V43 before any N.js-only verdict rises above M.

## Sources

- M26 area syntheses `scratchpad/m26/synth/{W1,W2,W3,W4,AW,CL}.md`, dossiers `scratchpad/m26/dossiers/<topic>.md`
  (claim registers: URL or code path#line, tier, verified 2026-10-19, claim date; cross-dossier verdicts in
  `contradictions-1.md` and `contradictions-2.md`), maps `scratchpad/m26/maps/<topic>.json`, drafts
  `scratchpad/m26/kb-drafts/*.yaml`, `MASTER.md`, `SPRITES.md`, `GLOSSARY-ADDITIONS.md`.
- IdleOn Toolbox parsers and data @ `6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1`
  (`https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/`), game 2.3.540, vendored at
  `packages/toolbox-parsers/vendor/`.
- idleon.wiki pages cited per claim in the dossiers (tier 3), dated community guides (tier 4) as listed there.
- ActiveOn state read from the `fix-digits` worktree: `packages/knowledge/systems/*.yaml`, `packages/knowledge/src/
  {schema,stages}.ts`, `packages/account-state/src/types.ts` (`SCHEMA_VERSION` 25), `packages/engine/src/now/
  system-homes.ts`, `apps/activeon/src/systems/pages.ts`, `apps/activeon/src/art/sprites/grids/*.ts`; the M25 coverage
  audit `scratchpad/ux/m25-coverage.md`; the M24 design brief `scratchpad/ux/design-brief.md`.
