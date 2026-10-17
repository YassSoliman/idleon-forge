# ActiveOn MVP spec index

The 14 module specs for ActiveOn's MVP ([map #1](https://github.com/YassSoliman/idleon-forge/issues/1)), read as one whole. Terms follow [`GLOSSARY.md`](../../GLOSSARY.md); decisions follow [ADRs 0001–0008](../adr/).

**How to read a spec.** Each spec ends with **Final rulings (Yasser, 2026-10-17)**, which supersede anything above them. The consistency pass of 2026-10-17 rewrote the body text of every spec so it agrees with its own Final rulings and with the other specs, and added a short `Consistency pass (2026-10-17)` section to each one listing what changed. Where two specs still disagree, this index says which one owns the answer (the "Owner" columns below). The few genuine conflicts between rulings are not resolved here; they are listed under [Needs Yasser](#needs-yasser).

## Modules

| # | Spec | Purpose | Owns these Checks and outputs | Depends on |
|---|---|---|---|---|
| M1 | [Sync & Account State](M1-sync-account-state.md) | Google sign-in, live read-only save listener, parsing in a Web Worker, the typed Account State, 30-day save history, freshness and patch awareness | No Checks. Owns `AccountState`, `diagnostics`, `isKnown`, `SaveHistory`, `HistoryEntry`, `lastPlayedCharacterIndex`, `verifiedBuilds` | none (Toolbox pinned fork, the game's Firebase) |
| M2 | [Stage & Meta Path](M2-stage-meta-path.md) | Stage from the save, the Meta Path (slot plan, Roles, gate chain), the pusher, every Priority List and the one ranking comparator | Meta Path Goals: push, subclass, world tutorial, elite, next character. Owns `StageResult`, `MetaPathResult`, the Priority List files, `compareGoals`, `roleOwnersOf`, `visitHints` | M1, M11 |
| M3 | [AFK Safety](M3-afk-safety.md) | Expected Return, every AFK-safety Check, the blocker rule, the Verdict composer, first fill | Every AFK-safety Verdict blocker and its Next-Action siblings, character and account level (see the matrix) | M1, M2, M4 (Purpose status), M11 |
| M4 | [Purpose & Milestones](M4-purpose-milestones.md) | Each character's Purpose: the Goals its activity advances, Milestones, ETAs, stop-here, "What is this character for?" | Contributions and generated Goal ladders (portals, Vault kill rows, Death Note, cards, Class EXP, skill doors, tools, stamp materials, Roles, Lab). No blockers | M1, M2, M5 (`bestExpPerHour`), M7 (stamp raise costs), M8 (card lists), M11 |
| M5 | [Higher-leverage options](M5-higher-leverage-options.md) | One "something clearly better" line per character: Move, Hand-off, Role fit, Unknown-Purpose suggestion; the hypothetical sweep | `leverage.check.*`. Owns `Hypotheticals`, `HigherLeverageResult` | M1–M4, M11 |
| M6 | [Unspent & idle](M6-unspent-idle.md) | Banked keys and tickets, dailies, cooldown minigames, idle stock, unspent points, big bubbles, Post Office, two W3 idle systems | Every M6 Check (see the matrix). Never a blocker | M1, M2, M3 (anvil caps), M11 |
| M7 | [Spend Plan](M7-spend-plan.md) | Where coins go: Vault, stamps, bribes, statue Gold, Pay 2 Win, Anvil coin points, per character wallet | `spend.check.duplicate-entries`, `spend.check.hydrogen-hold`, `spend.check.stamp-not-ready`, the Spend Plan Goal. Owns `SpendInputs`, `SpendPlan` | M1, M2, M11 |
| M8 | [Collections](M8-collections.md) | Stamps you can get now or work toward, cards and card sets and card presets, the Obol Altar and stored obols | Every stamp-acquisition, card, card-set, card-preset and obol Check; card lists for M4 | M1, M2, M4, M11 |
| M9 | [Builds](M9-builds.md) | Talent presets: wrong preset, empty or behind presets, next talent points, attack bar, reset potions | The two talent blockers (wrong preset, 0 attacks) and every preset and talent Goal. Owns the Build entry shape | M1, M2, M3 (blocker pipeline), M11 |
| M10 | [Now screen UI](M10-now-screen-ui.md) | The Now screen (Roster, Focus, Account section), its states, controls and accessibility; the view-model contract | No Checks. Owns `EngineResult`, `buildNowView`, `NowView`, `renderNowText`, preferences. Its build also carries the engine core (merge, rank, dedupe, Visit Order) | every advice module, M12, M13 |
| M11 | [Knowledge tooling](M11-knowledge-tooling.md) | The Knowledge Base package: schema, Detector contract, fact generators, CI checks, scrubbed fixtures, golden snapshots, versioning, the authoring and red-team workflow | No Checks. Owns the entry schema, id formats, fact tables, `DetectorContext`, `CheckFinding`, the registry, `kb` CLI, goldens | M1 |
| M12 | [Release](M12-release.md) | Production deploy, PR Previews, the weekly parser re-sync, BuildInfo, What's new, governance, headers | No Checks. Owns `BuildInfo`, `whats-new.json`, the workflows, CODEOWNERS, rulesets | M1, M10, M11, M13 |
| M13 | [Suggestions](M13-suggestions.md) | In-app Suggestions and Report this, filed as GitHub issues by a small Worker; the Claude Code listener | No Checks. Owns `SuggestionContext`, `ReportContext`, the name scrub, the Suggestions Worker | M1, M2, M10, M11, M12 |
| M14 | [Walkthroughs & Parallel Slot Plans](M14-walkthroughs-and-slot-plans.md) | Breaks quest, unlock and (later) gear Goals into Requirement Trees and ordered steps; Demand across Walkthroughs; Supplies with drop and anvil effort; one job per character within AFK safety and the pusher; the 3D Printer Parallel Slot Plan | `walkthrough.check.assign`, `printer.check.slot-plan`, `walkthrough.contribution.supply`, generated `items.acquisition.*` and `walkthrough.goal.*`. Owns `WalkthroughResult`, `holdingsOf` (M8 TR-6's rule), `SupplyRates`, and builds `reachableFightingMaps` first for M5 | M1, M2, M3, M6, M11; M4 and M5 when present |

## Build order

**M1 → M11 → M2 → M10 → M13 → M3 → M6 → M14 (Phase 1) → M4 → M7 → M8 → M9 → M5 → M14 (Phases 2–3)**, with **M12 alongside** from the start (each module ships to the shared URL when done, #13).

| Step | Module | Why here |
|---|---|---|
| 1 | M1 | Everything reads the Account State |
| 2 | M11 | Schema, Detector contract, generators and goldens come before any content |
| 3 | M2 | Stage and Priority Lists rank every later Goal |
| 4 | M10 | The screen and the engine core; until M3 ships every Verdict is Unknown `not-covered` |
| 5 | M13 | Feedback from the first sessions |
| 6 | M3 | Verdicts become real |
| 7 | M6 | Free value; the first big content set |
| 8 | M14 Phase 1 | Quest Walkthroughs and the printer Parallel Slot Plan: the owner's top ask; needs only M1–M3, M6, M11 (M14 Q3) |
| 9 | M4 | Purpose turns Ready into "safe and serving" (until then Ready = safe, M3 D4); adds `walkthrough.contribution.supply` |
| 10 | M7 | Coins |
| 11 | M8 | Collections; imports M14's `holdingsOf` |
| 12 | M9 | Builds |
| 13 | M5 | Needs M1–M4 and the hypothetical sweep; reuses M14's reachability and shares its map reservations |
| 14 | M14 Phases 2–3 | Account-wide parallel plans, observed skilling rates, gear, the other Parallel Slots |
| — | M12 | Alongside: first deploy, Previews, parser sync |

## Id formats

M11 is the authority (M11 TR-2, TR-2b). Every spec now uses these forms.

| Kind | Format | Example |
|---|---|---|
| Entry | `<system>.<type>.<slug>`, type one of `goal`, `contribution`, `check`, `priority`, `build`, `acquisition`, `metapath` | `afk.check.no-afk-target`, `metapath.priority.w2-late` |
| Detector | `<system>/<name>` (Knowledge Base Detectors and engine Detectors share one id space) | `anvil/caps-before-return`, `metapath/pusher`, `spend/wallets` |
| Fact table (not an entry) | `<system>.fact.<slug>`, generated or authored tier 2 | `classes.fact.class-tree`, `trapping.fact.trap-set-capacity` |
| Spend list item | `${listId}#${itemSlug}` inside a `list: spend` Priority List | `spend.priority.w2-late#max-sleepy-time` |

Ids renamed in this pass: M2's Meta Path and list entries (`metapath.metapath.*`, `metapath.priority.*`), Detectors (`metapath/*`) and facts (`gen.*` → `<system>.fact.*`); M5's `leverage.*` checks and Detectors; M6's Check ids (`<system>.check.<slug>`); M7's spend items, Checks, Detectors and generated Acquisitions; M8's Acquisitions, ordering lists, fact tables and Detectors; M9's fact groups; M11's `deathnote` system (now `death-note`) and `vault` generator (now `upgrade-vault`).

## Shared interface catalogue

Every type or function used by more than one module, with the one spec that owns it. A change to any row needs a note in the owner's spec and in each consumer's.

| Interface | Owner | What it is | Main consumers |
|---|---|---|---|
| `AccountState`, `CharacterState`, `AccountSummary`, `ParseDiagnostics`, `isKnown`, `FIELD_SOURCES`, `FIELD_SECTIONS`, `FIELD_RAW_KEYS` | M1 TR-10, TR-11 | The typed snapshot and its presence checks; fields grow only through M1 TR-11 | all |
| Fields added by modules | M2 TR-3, M3 TR-2, M4 TR-2, M5 TR-3, M6 TR-3, M7 TR-2, M8 TR-15, M9 TR-3/TR-4 | Each module's Account State additions, read only in `adapter.ts` | per module |
| Shared fields with one owner | `classIndex`, `nextPortal`, `npcDialog` (with `Bellows`), `buildings`, `frontier`: M2 TR-3. `fighting: FightingRate`: M4 TR-2. `salts`: M6 TR-3 (M2 adds `rawName` and `unlocked` first). Per-stamp list `spend.stamps`: M7 TR-2. `cards`: M4 TR-2 plus `effect` (M8) | Duplicate fields were merged in this pass; all survivability and hit chance values are % 0..100 | M2–M9 |
| `lastPlayedCharacterIndex` | M1 FR-19, TR-12 | Newest per-character save within 30 s of the cloud save, null on a tie | M6 TR-7, M10 FR-14 |
| `SaveHistory`, `SaveRecord`, `PlaySession`, `HistoryEntry`, `usualGapSeconds` | M1 TR-14, TR-15 | IndexedDB history, Play Sessions (15-minute rule), the history slice the engine sees | M3, M4, M6, M9, M10, M11 |
| Worker protocol (`parse`, reserved `what-if`) | M1 TR-4 | Parse request and response; the engine runs in the same worker (M10 TR-6) | M2, M5, M10 |
| `verifiedBuilds`, parser-behind rule | M1 FR-29, D3 | "Newer than any build this pin parsed cleanly, and broken" banner; builds and game versions are never compared | M5 FR-9, M10 FR-35, M11 TR-11 |
| `accountReportFields(state)` | M1 TR-22 | The Account State part of a Suggestion context (game build, save age, class and level) | M13 |
| Entry schema (zod), `Source`, `AppliesTo`, entry types, `category` | M11 TR-2, TR-2b | Seven entry types; additions requested by M2–M9 | all content |
| Fact tables, `ctx.facts.get` | M11 TR-2b | Generated or authored tier-2 facts referenced by id | M2, M3, M5, M6, M7, M8, M9 |
| `Detector`, `DetectorContext`, `CheckFinding`, `ProgressFinding`, `ContributionFinding`, `UnknownReason`, engine Detectors | M11 TR-4 | The Detector contract, incl. `pass` with `nextAt`, `fixHolds`, `demotedBecause`, `urgency`, `deadline`, `doneKey`, `nextChangeAt` | M2–M9 |
| `CompiledKnowledge`, `loadKnowledge`, `render`, `isStale`, `coverage`, `diffManifests`, `entryReportFields` | M11 TR-7, TR-11, TR-13, FR-29 | Runtime surface of `packages/knowledge` | engine, M10, M12, M13 |
| Golden snapshot harness and file | M11 TR-15 | `packages/knowledge/golden/<fixture>.md`; its Now section is M10's `renderNowText` | all modules |
| Scrubbed fixtures, `kb scrub` | M11 TR-14 | `fixtures/scrubbed/scrubbed-w2.json`, `scrubbed-w3.json`; M1 TR-17's requirements are acceptance criteria for it | all tests |
| `StageId`, `STAGES`, `StageResult` | M2 TR-4 (`STAGES` in `packages/knowledge/src/stages.ts`) | 10 Stages, certainty, coverage, `next.needs` | all |
| `MetaPathResult`, `ResolvedPriorityList`, `positionOf` | M2 TR-4a | Stage, resolved list, pusher, push Goal, Roles, roster, Visit Order hints, as plain data | M4 (`MetaPathInput` is a Pick of it), M5, M7, M8 |
| `Frontier` (`account.frontier`) | M2 TR-3 | Worker-computed kill rates, hit chance and survivability on the frontier map | M4, M5, M7 (Bullseye gate), M8 (Frostbite rule) |
| `Rankable`, `compareGoals`, Priority List frame and resolution | M2 TR-13, TR-14 | The one total order for every Goal; positions 1–3 frame, include, by-urgency, carry-forward, last-position tie | every advice module, engine core |
| `roleOwnersOf`, `VisitHint` | M2 FR-23, TR-12 | Role lookup and Visit Order hints | M4, M5, engine core |
| `ExpectedReturn`, `resolveExpectedReturn`, `Safety`, `SafetyFinding`, `AfkSafetyResult`, `evaluateAfkSafety`, `composeVerdict` | M3 TR-3 | Expected Return, the blocker rule and pipeline, Verdict composition | M5, M9 (its blockers use the pipeline), M10 |
| `ActivityRef`, `GoalInstance`, `Eta`, `Purpose`, `PurposeStatus`, `StopHere`, `MilestoneCrossing`, `FightingRate`, `derivePurposes`, `goalsServedBy`, `activitiesServing`, `purposeOf` | M4 TR-3 | Purpose and its lookups | M3, M5, M10 |
| `Hypotheticals`, `FightRate`, `LabRemoval`, `MoveTarget`, `HigherLeverageOption`, `HigherLeverageResult`, `bestExpPerHour` (computed by M5's sweep) | M5 TR-2, TR-3 | The worker-side sweep and the option output | M4 (`bestExpPerHour`), M10 |
| `spendCount`, `nextChangeAt` | M6 FR-28, FR-30 | Per-character spend count for Visit Order; re-run timer | engine core |
| `SpendInputs`, `StampState`, `SpendPlan`, `SpendLine`, `SpendHandoff` | M7 TR-2, TR-3 | Wallets and sinks; the plan M10 renders (M10 imports it) | M4 (stamp raise costs), M8, M10 |
| `CollectionsResult`, `cardList(class, stage)` | M8 TR-7, FR-18 | Internal collections result; card lists for M4 | M4 |
| `BuildEntry`, `PresetRole`, `BuildStep` | M9 TR-5 (adopted by M11 TR-2) | Role-keyed Builds | M11 schema |
| `EngineResult`, `CharacterResult`, `Goal`, `NextAction`, `Milestone`, `PurposeLine`, `Verdict`, `HigherLeverage`, `Fill`, `Category`, `Subject`, `SourceRef`, `Provenance` | M10 TR-2 | The engine output every module feeds | all |
| `buildNowView`, `NowView`, `renderNowText`, preference keys | M10 TR-3, TR-8, TR-15 | View model, text snapshot, localStorage | M11 goldens, M13 |
| `BuildInfo`, `WhatsNewFeed` | M12 TR-4, TR-7 | Build stamp and changelog | M10 footer and What's new, M13 context |
| `SuggestionContext`, `ReportContext`, `SuggestionRequest`, name scrub, `getSignInProof` (in `packages/sync`) | M13 TR-3, TR-4 | What may leave the browser for a Suggestion (ADR 0008) | M10, M1 |
| `WalkthroughResult`, `Walkthrough`, `ReqNode`, `SupplyEval`, `Job`, `PrinterSlotPlan`, `planWalkthroughs` | M14 TR-6 | Requirement Trees, Demand, assignments, the printer Parallel Slot Plan | M10 (`Goal.walkthrough`), M3 (`printer.check.sample-blank` item), M5 (reservations) |
| `holdingsOf` (`packages/engine/src/core/holdings.ts`) | M14 TR-11, implementing M8 TR-6's rule plus Forge output | What the account holds of an item, by place | M8, M14 |
| `SupplyRates`, `reachableFightingMaps` | M14 TR-3 (reachability to M5 TR-4's rules and tests) | Kill and drop rates on supply maps; per-character reachable maps | M5, M14 |
| Account State: `anvilTabsOwned`, `forgeOutput`, `liquids`, `storageItems`, `characters[].inventoryItems`, `smithingLevel`, `printer` | M14 TR-2 (`storageItems`, `inventoryItems` shared with M8) | Holdings, gates and printer facts | M8, M14 |

## Check ownership matrix

One owner per Check. "Pos" is the Priority List position (M2 TR-13): B = Verdict blocker (ranks first, never in a list), 1 = never-skip, 3 = free-value fill, 4+ = Stage item, last = the last-position tie, +∞ = unlisted.

| Check or Goal (entry ids) | Owner | Effect | Pos | Notes |
|---|---|---|---|---|
| `afk.check.no-afk-target` | M3 | blocker | B | M4 hands it the suggested target |
| `afk.check.dies-fixable-by-food` | M3 | blocker | B | |
| `afk.check.health-food-runs-out` | M3 | blocker | B | No history: presence only (D1) |
| `afk.check.low-food-untimed` | M3 | next-action | +∞ | New (M3 Final rulings RT-5) |
| `afk.check.boost-food-runs-out` | M3 | next-action | +∞ | |
| `afk.check.fighter-inventory-full` / `-overflow` | M3 | blocker / next-action (D6) | B / +∞ | Overflow becomes a blocker after calibration |
| `afk.check.skiller-carry` | M3 | blocker | B | |
| `anvil.check.caps-before-return` | M3 | blocker | B | Already full now always blocks (M3 RT-14); not-yet-full unbeatable caps are Next Actions (D7) |
| `worship.check.charge-caps-skull` / `-no-skull` | M3 | blocker / next-action | B / +∞ | D2 |
| `prayers.check.unending-energy` | M3 | blocker | B | |
| `trapping.check.slots-and-timers` / `finishes-early` | M3 | blocker / next-action | B / +∞ | |
| `alchemy.check.cauldron-unassigned` | M3 | blocker | B | |
| `printer.check.sample-blank` | M3 | next-action | 3 (3g) | |
| `construction.check.cog-seat-free` | M3 | next-action | 3 (3g) | |
| `forge.check.slot-empty` | M3 | blocker if ore owned, else next-action | B | New (M3 Final rulings RT-10) |
| `arcade.check.balls-cap` (account) | M3 | blocker | B (Account) | M6 has no Arcade Check; cap is 48 h on both fixtures |
| `alchemy.check.liquid-cap` (account) | M3 | blocker | B (Account) | Water only until liquids 2–4 are verified |
| `refinery.check.fuel-runs-out` (account) | M3 | next-action | +∞ | |
| `talent-presets.check.wrong-preset`, `talents.check.attack-bar` (0 attacks) | M9 | blocker | B | Through M3's `evaluateAfkSafety` |
| `talent-presets.check.empty` / `incomplete` / `same-role` | M9 | Goal | 3 (3e) | M6 ships no preset Check |
| `talent-presets.check.behind` | M9 | Goal | 3 (3h) | |
| `talents.check.next-step` (core), `talent-resets.check.reset` | M9 | Goal | 3, or last | Position 3 only while the tab's lower bound is above 0 or FR-12a fires (M9 Final rulings RT1) |
| `talents.check.next-step` (non-core), `talents.check.skill-attack` | M9 | Goal | last / 3 | |
| `metapath.goal.push` | M2 | Goal | 2 | |
| `metapath.goal.subclass`, `.world-tutorial-w3`, `.elite` | M2 | Goal | 4 | |
| `metapath.goal.next-character` | M2 | Goal (note while the slot is closed) | last | From W2-late |
| `boss-keys.check.collect`, `colosseum.check.collect-tickets`, `alchemy-vials.check.daily-attempts`, `pets.check.free-pull`, `pets.check.mart-gems`, `minigames.check.spiketrap`, `minigames.check.darts-play` / `hoops-play`, `post-office.check.daily-orders` | M6 | next-action, by urgency | 1 or 3 | `losing-now` / `lost-before-return` → 1, `banked` → 3. Pet Mart gated off until its unlock is verified (M6 Final rulings) |
| `minigames.check.daily-plays` | M6 | next-action (`nice`) + Active Play | 3 | Never position 1 (M2 Final rulings D4 note) |
| `refinery.check.salt-off`, `death-note.check.build` | M6 | next-action | 1 | D6 |
| `alchemy-bubbles.check.spend-brew`, `.fill-slot`, `.wrong-fit` | M6 | next-action | 3 (3c) | |
| `merit-shop.check.spend-w1…w4`, `task-unlocks.check.spend`, `anvil.check.spend-points`, `post-office.check.spend-boxes` | M6 | next-action | 3 (3h) | W3 merits Contested |
| `gem-shop.check.unspent` | M6 | next-action | 3 | Printer Goal only once the Infinity Hammer is owned or from W3 (M6 Final rulings RT2) |
| `post-office.check.unlock`, `poppy.check.open`, `minigames.check.darts-spend` / `hoops-spend` | M6 | next-action | 3 | |
| `obols.check.altar`, `obols.check.stored` | M8 | next-action | 3 (3a) | Stored obols only after the altar quest (M8 FR-20) |
| `cards.check.empty-slots`, `.no-set`, `.set-mismatch`, `.blunder-50`, `.passive-slot`, `.preset-mismatch` | M8 | next-action | 3 (3b) | M6 emits none of them (M8 D6) |
| `stamps.check.shop-now`, `.handin-now`, `.held-now` | M8 | next-action | 3 (3i) | New position 3i (M8 D5) |
| `stamps.goal.collect`, `stamps.check.quest-toward`, `stamps.check.activeplay-*` | M8 | Goal / show-more / Active Play | 4+, carried forward | Carry-forward rule (M2 TR-13) |
| `cards.goal.set-tier`, `obols.goal.slots` | M8 | Goal or Milestone line | 4+ | |
| `spend.goal.plan` and its lines | M7 | Goal (one Account block) | the Stage list's first coin-sink position | Line order inside comes from `spend.priority.<stage>` |
| `spend.check.duplicate-entries` | M7 | line | Spend frame 1 | `reserve`; ticket wording per M7 Final rulings RT-1 |
| `spend.check.hydrogen-hold`, `spend.check.stamp-not-ready` | M7 | line / handoff | inside the plan | Not-ready raises go under Not covered yet for the MVP |
| Purpose Contributions (portals, Vault rows, Death Note, cards, Class EXP, doors, tools, stamp material, Roles, Lab) | M4 | Purpose lines, stop-here Next Action | Class XP and skill doors: last | Never a blocker |
| `leverage.check.move`, `.handoff`, `.role-fit`, `.unknown-purpose`, `.lab-chain` | M5 | Higher-leverage line | not ranked | Never a Verdict input (D3) |
| `walkthrough.check.assign` | M14 | next-action on the assignee's row (Q5 rule) | the parent Goal's position | At most one per character; the Walkthrough itself renders on the parent's card |
| `printer.check.slot-plan` (Goal `construction.goal.printer-samples`) | M14 | next-action (Account) | W3-early list position of `construction.goal.printer-samples` | M3's `printer.check.sample-blank` names M14's item instead of a second line |
| `walkthrough.contribution.supply` | M14 (via M4's Contribution engine) | Purpose line | — | Makes an assigned character read as serving |

**No MVP owner: shown under "Not covered yet"** (M6 Final rulings RT1, applied to every leftover): tools (Leverage 3d), constellations and star signs (3f), W4 shop dailies (1i), Random Events, Liquid Shop dailies and cheap daily obols, the Equinox bar, weekly items (Killroy, Ballot, weekly bosses), salt rank-ups and manual refining, unfillable slots and caps to raise (trap sets, printer level, anvil Capacity, carry bags), Refinery storage (M3 Final rulings RT-10), Lab, Cooking and Breeding AFK safety, Forge upgrades as a spend, stamp raises that need farming or carry capacity, Worlds 5–7, elite and Journeyman talent builds.

## Verify before build

Facts each module must check before (or in) its first build PR. Open facts, not product decisions.

**M1**
- [ ] TR-20 live checks, recorded as timings only: Cloud Save to screen under 10 s (3 runs); characters appear after a full browser restart; Joseph signs in on his own browser and sees 6 rows; one full Play Session gives one history Play Session. (Qualitative character-switch and reload checks already confirmed, M1 Final rulings.)
- [ ] TR-25: a real sign-in and the Realtime Database long-polling fallback work under the CSP headers.
- [ ] Record a live A → B → C character switch as a scrubbed snapshot sequence (M10 FR-14 gate).
- [ ] The parser sync emits `verifiedBuilds` (FR-29).

**M11**
- [ ] Each generator's reading of its raw fields is confirmed against a known save in its own test before it merges (TR-10), including `mapPortalDestinations` for M2's route path.
- [ ] `SERVER_VARS_READ` and `OPTLACC_STRING_KEEP` are generated and reviewed before the first scrub (TR-14).
- [ ] The public-fixture manifest pins every Toolbox save by sha256 (TR-15).
- [ ] The "exactly one of `goal` or `goalFamily`" refine works inside zod 4's discriminated union; otherwise move it into `entryRules` (TR-2).
- [ ] Every new generator (TR-10) has its owner module's hand-checked expected-value test before it merges.

**M2**
- [ ] Re-run the frontier clone identity check at the pin `6c37e3d` (its `damage.ts` changed in 2.3.540) (TR-2).
- [ ] Re-run the TR-10 fixture check on the route-path definition before the code merges.
- [ ] Benchmark the frontier step at the pin (TR-15: 60 ms p95 for 11 characters).
- [ ] Falsifier: does talking to a gatekeeper before handing in its crystal already set its dialogue above 0 (TR-6a)? Check on the first W1 save.
- [ ] Find exported parser constants for the town-unlock thresholds, the Obol Altar level and the gatekeepers; until then they are authored tier-2 facts.

**M10**
- [ ] The issue forms `kb-correction.yml` and `idea.yml` exist with pre-fillable fields (repo setup #7).
- [ ] Contrast fixes measured at 4.5:1 (TR-14); axe passes on every state.
- [ ] The view fixtures (`spend-plan`, `cannot-tell`, `all-set`, `account-stockpile`) are regenerated to the new `EngineResult` shapes (M7 `SpendPlan`, `account.safety`, `alreadyFull`), and the package entry M10 imports `SpendPlan` from is confirmed.

**M13**
- [ ] **By Yasser, by hand, before ship:** the game's database refuses an ID token 1, 5 and 15 minutes after expiry (TR-4, Final rulings). If not at 15 minutes, raise the margin.
- [ ] The Worker's Turnstile hostname list matches the IdleOn origins.
- [ ] The game's Steam sign-in shows up as `firebase.sign_in_provider === 'custom'` on the proof (TR-4, Final rulings RT-12).

**M3**
- [ ] The unlocked food-slot count (TR-12 item 1); the carry-cap category per item (2); board-square unlock and whether off-board player cogs add build rate (3); whether a blank printer sample needs the Printer Sampling talent (4); the unlock gate of liquids 2–4 (6); what pulling a running trap gives (7).
- [ ] The Forge fields for `forge.check.slot-empty`: slot state and ore ownership from Toolbox's forge parser (Final rulings RT-10).
- [ ] The Forge Check's unlock gate (highest class level ≥ 18, taken from the Leverage model) is right for it (FR-27a).
- [ ] One calibration Play Session per account (TR-12 item 5, run with M12) before the drop estimate becomes a blocker (D6).

**M6**
- [ ] The Pet Mart unlock condition, read from game code; the Check stays off until it is known (Final rulings).
- [ ] An Account State field for "Infinity Hammer owned" (from `gemShopPurchases` at the generated gem-shop index), which the printer Goal's gate needs (Final rulings RT2).
- [ ] The OLA index table cites Toolbox's enum or the N.js offset for every index; the per-fixture value snapshot test passes (TR-3, R8).
- [ ] Toolbox oracle tests agree with every Detector on every fixture, except the documented quirks (TR-13).
- [ ] The W1 merit Priority List is mapped to generated row ids and reviewed in game by Yasser or Joseph (R6).

**M4**
- [ ] The † kill rates land within ±5% at the pin before any golden is recorded (§4).
- [ ] The Lab Contribution ships only if a fixture with the Lab unlocked passes its tests (TR-4).

**M7**
- [ ] **Ship gate:** where Colosseum ticket doubling applies in N.js (on collection or on redeem); it sets the Duplicate Entries wording (FR-12, Final rulings RT-1).
- [ ] The ladder contract test passes on both fixtures and the public saves (TR-4).
- [ ] Toolbox's `getPlayerAnvil` / `getCoinCost` import in the worker; otherwise Anvil coin points are `unpriced` (D3).

**M8**
- [ ] Which Toolbox field holds a shop's buy price at the pin (TR-8 rule 5).
- [ ] Whether the stale family-slot lock clears when the player visits the Obol Altar (R10).
- [ ] The adapter reads stored obols from raw `ObolInvOr` (the parsed list came back empty, TR-15).

**M9**
- [ ] How Construction, Worship and Alchemy read talent levels (live preset or not) in N.js (R9).
- [ ] That a skill attack helps AFK skilling only while on the bar, in N.js (TR-10).
- [ ] Pin the classification of the 17 classifiable fixture presets once the tags are authored (TR-6).

**M5**
- [ ] Re-measure every story number with the fixed reachability and Lab re-run (§4, RT-1, RT-2).
- [ ] The sweep budget on `highend.json` in the first build PR (TR-10: ≤ 300 ms p50, ≤ 800 ms p95 in the worker).
- [ ] The identity and reachability contract tests pass on all public saves and both private fixtures (TR-4, TR-5).
- [ ] How "biggest gain" is measured when two characters target one destination with different deciding steps (FR-10, Final rulings RT-8; the spec says: earliest deciding FR-4 step, then the largest margin on it).

**M14**
- [ ] Anvil recipe tabs and recipe-unlock state from Toolbox or N.js (`anvil.fact.recipe-tabs` is tier 2 until then).
- [ ] Quest hand-ins read the character's inventory, not storage.
- [ ] Whether the drop rate applies again inside nested drop tables (until then "at most").
- [ ] TR-7's contract tests: drop rate vs M3 `dropsPerHour`, anvil hours vs `getTimeTillCap`, sample-size reproduction.
- [ ] Which characters hold the printer's player slots below a full building level.
- [ ] **By Yasser, one minute in game:** the Liquid Shop's Distilled Water price after a few buys (M14 Final rulings R-Q6).
- [ ] `MAX_SUPPLY_MAPS = 12` within TR-8 on `highend.json`.

**M12**
- [ ] Chunk-load behaviour after a redeploy (TR-10, Appendix A step 14).
- [ ] The `wrangler preview --json` URL field path (TR-13).
- [ ] The CSP host list with a real sign-in on a Preview before the header PR merges (TR-11).
- [ ] `MIRROR_TOKEN`'s Workflows permission on the first upstream workflow change (TR-15).
- [ ] The minimal token scope for `wrangler preview` (the deploy token is already verified Workers-only, Final rulings).
- [ ] Cloudflare Access works on Preview URLs before Previews rely on it (Final rulings RT-11).

## Manual steps for Yasser

In order of when they are needed. Agents can do everything else.

**Now, before the first deploy (M12 Appendix A)**
1. GitHub repository settings: set the merge commit message to **Pull request title and description** (today it is still `MERGE_MESSAGE` / `PR_TITLE`, which drops the PR body and every `What's-new:` line); allow merge commits only; turn on automatic head-branch deletion. Needed before the first M12 merge.
2. Environment `production`: untick **Allow administrators to bypass configured protection rules** (still on today) and add the variable `PRODUCTION_URL` = `https://activeon.idleon.workers.dev`.
3. Cloudflare (IdleOn account): create the `activeon-preview` token (Workers Scripts: Edit only), then create the GitHub `preview` environment and seed it with `ENVIRONMENT=preview scripts/push-secrets.sh ~/.config/idleon-forge/preview.env`, and copy the six `VITE_*` variables (Appendix A step 8). Delete the old business-account token (M12 Final rulings RT-10, "afterwards").
4. Cloudflare Zero Trust: the one-time **Enable Access**, so Previews can sit behind Access (M12 Final rulings RT-11). Until then, never sign in on a Preview whose diff you haven't read.
5. Fork Toolbox to `YassSoliman/IdleonToolbox` with Actions off and a linear-history ruleset; create `MIRROR_TOKEN` and the `mirror` environment (Appendix A steps 5–6).
6. Actions settings: allow GitHub Actions to create pull requests; require approval for external contributors.
7. Invite `JoKhalil` with Write access.
8. Decide where the Forge Bot key lives (Needs Yasser N2).

**After the M12 PR merges**
9. Create the `main-checks` and `main-review` rulesets, then delete the classic branch rule; set "Allow select actions" and SHA pinning (Appendix A step 11).
10. Enable private vulnerability reporting.
11. Run the first deploy and the verification steps 13–15 (sign-in on production, asset rollover, a throwaway Preview, two parser-sync dispatches).
12. A calendar reminder 11 months out to rotate the Cloudflare tokens and the mirror token.

**When M1 is marked done:** the TR-20 live checks with Joseph (see Verify before build).

**When M2 ships:** an in-game AFK Info spot-check of one character's kill rate (M2 R3, M4 red-team note 1).

**When M3 has shipped:** one calibration Play Session per account, Yasser and Joseph (M3 TR-12 item 5).

**When M13 ships:** the by-hand ID-token expiry check (before ship); `wrangler secret put` for the Suggestions Worker (`GH_APP_ID` from the local `LOCAL_SUGGESTIONS_APP_ID`, `GH_INSTALLATION_ID`, `GH_APP_PRIVATE_KEY` converted to PKCS#8, `TURNSTILE_SECRET`, `SUGGESTER_PEPPER`) using `LOCAL_CLOUDFLARE_ADMIN_TOKEN` or the dashboard; the Turnstile widget; your numeric GitHub id in `MAINTAINER_IDS`; then start the dedicated listener session (M13 TR-17).

**Ongoing:** player review of every Knowledge Base PR (yours or Joseph's approval, M11 TR-19 C); patch-day runbook (M12 Appendix C); a current Hunter Build when one of you makes a Hunter (M9 D4).

**Already done (2026-10-17):** the separate IdleOn Cloudflare account with the `idleon` subdomain and a Workers-only CI token; the `production` environment secrets pointing at IdleOn; the local-only `LOCAL_CLOUDFLARE_ADMIN_TOKEN`; the Forge Bot GitHub App `idleon-forge-bot` (repository secret `FORGE_BOT_PRIVATE_KEY`, variable `FORGE_BOT_APP_ID`; agents get a bot token from `scripts/forge-bot-token.sh`); the Suggestions App `idleon-forge-suggestions` (Issues only; key kept locally); Joseph's consent for his scrubbed save (relayed by Yasser).

## Calls made in this pass

Judgment calls the consistency pass made where no spec or ruling decided, so they can be reviewed in one place:

- **Engine core owner.** Merging module output, applying `compareGoals`, dedupe and Visit Order were disclaimed by both M2 and M10. They are built with M10, in `packages/engine/src/core/`.
- **Fact tables and engine Detectors** were added to M11 so the generated facts (M2, M3, M5–M9) and module engines (M2, M5, M7) every spec relies on have a home without adding an eighth entry type.
- **Spend items** are `spend` items inside a `list: spend` Priority List (M11), not entries.
- **M3 Final rulings RT-14** is read as changing only the blocker rule's "fix holds" condition for `effect: blocker` Checks, so D2's skull-less worship (an `effect: next-action` entry) stays a Next Action, while an anvil that is full now and Water at cap now block.
- **Skill-minigame plays** are a `nice` Goal at position 3 plus their "If you have time" entry: never position 1 (M2 Final rulings) and both surfaces kept (M6 D4).
- **Orphans** go under "Not covered yet", extending M6 Final rulings RT1 to every unowned leftover.
- **Shared fields** were merged to one owner (see the catalogue); all survivability and hit-chance numbers are % 0..100.
- **M7's Bullseye gate** reads M2's frontier hit chance, which exists from M2, instead of waiting for M5.
- **The Spend Plan's place in each Stage list** is the list's first coin-sink position, authored per list (M2 TR-13); M7 owns the order of lines inside it. M7's Spend frame positions are written out in each Stage list, with only the position-1 guard in the shared block, because an include is one position.
- **M3's `lowStack` threshold** for the new low-food Next Action has no number in the spec; it is authored in the entry and checked in its Knowledge Base PR's player review.
- **One scrub tool and one fixture path** (M11's `kb scrub`, `fixtures/scrubbed/`), with M1's scrub requirements kept as its acceptance criteria.

## Needs Yasser

Genuine conflicts or open choices the pass did not settle. Each has a recommendation.

❓ **N1. When does the Now screen treat the last-played character as "being played"?** M1 FR-19 opens that character's row on its own only while the last cloud save is under **5 minutes** old; M10 FR-14 and FR-4 (red-team #17) auto-open Focus and show "● playing" while it is under **30 minutes** old.
➡️ Use M1's 5 minutes for the auto-open and the "● playing" marker (the game autosaves every 4 minutes while open, so an older save usually means the game is closed or the player is in a dungeon), and keep 30 minutes for M1 FR-27's "Open the game" hint.

❓ **N2. Where does the Forge Bot's private key live?** M12 TR-16 says every secret lives in an environment, never at repository level, but `FORGE_BOT_PRIVATE_KEY` and `FORGE_BOT_APP_ID` are repository-level today, where any same-repo PR workflow can name them.
➡️ Move both into a `forge-bot` environment restricted to `main`, used only by the parser-sync job that opens the PR; agents keep minting tokens locally with `scripts/forge-bot-token.sh`.

❓ **N3. Should the Spend Plan pool two characters' coins through storage for every line, not only `reserve` lines?** M7 FR-7 suggests "deposit on one character, withdraw on the buyer" only for `reserve` lines. The Final rulings' in-game facts say that step is cheap and works from any character through the codex, which weakens the original reason (fewer steps) but does not rule on it.
➡️ Keep it reserve-only for the MVP, so each line stays one or two steps; revisit after the first 5 sessions if players find coins stranded.

❓ **N4. Does M3's RT-14 ("a cap that is already full now, with a quick fix, always blocks") also cover skull-less worship?** The pass read RT-14 as changing only the blocker rule's "fix holds" condition for `effect: blocker` Checks, so D2's skull-less worship (an `effect: next-action` entry) stays a Next Action at 50/50, while a full anvil and Water at cap now block. If RT-14 was meant for every cap, it reverses D2 and turns 4 of 6 W3-early rows red every session.
➡️ Confirm the narrow reading and keep D2.

✅ **N5. M14's open questions (Q1–Q9): resolved.** Yasser accepted every recommendation on 2026-10-17; see [M14 Final rulings](M14-walkthroughs-and-slot-plans.md#final-rulings-yasser-2026-10-17). He does the Liquid Shop price check in game (Q6).
