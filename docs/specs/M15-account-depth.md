# M15 Account depth

Spec for the five features the owner approved on 2026-10-17 from the AutoReview deep dive (`docs/research/2026-10-17-ecosystem-autoreview.md`, scratch copy; its section 3.5 "Recommended next 5"), part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **ready for review**: red-teamed and fixed (section 10); open questions in section 8. Terms follow [`GLOSSARY.md`](../../GLOSSARY.md); decisions follow [ADRs 0001–0008](../adr/).

M15 is not a new module folder. It is one spec covering five features, each **built inside an existing module's folder** (the ownership table in section 2). It exists as one document because the five share inputs (the W3 Account State, the Stage, the Priority Lists), share the owner's UX principles below, and the fifth feature (Behind for your Stage) reads the output of the other four.

**Decisions this spec rests on:**
- [ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md) (deterministic advice), [0004](../adr/0004-source-precedence.md) (Source precedence, game data first), [0005](../adr/0005-toolbox-numbers-not-our-formulas.md) (Toolbox numbers plus arithmetic, no formulas of ours), [0006](../adr/0006-client-only-spa-parsing-in-a-worker.md) (Toolbox code runs only in the worker), [0007](../adr/0007-generated-facts-authored-judgment.md) (generated facts, authored judgment).
- [#74](https://github.com/YassSoliman/idleon-forge/issues/74) (every entry links a player-readable tier 2–4 Source; tier-1 game data stays as provenance).
- [#70](https://github.com/YassSoliman/idleon-forge/issues/70) A5 (a Goal that would repeat across characters is one account line with per-character details).
- The specs it extends: M2 (Stage, Priority Lists, `compareGoals`, the next-character note), M6 (`refinery.check.salt-off`, `death-note.check.build`), M8 (family obol slots, FR-22), M9 (Build entries, talent fields), M10 (`Goal.details`, "Not covered yet"), M11 (schema, fact tables, CI), M14 (the printer Parallel Slot Plan, `holdingsOf`).

**AutoReview.** [IdleOn AutoReview](https://github.com/TwoSpookyBoos/IdleOnAutoReviewBot) ([site](https://ieautoreview-scoli.pythonanywhere.com/)) has **no licence** (all rights reserved). This spec cites it as the inspiration for features 1–5, especially its Pinchy rater for feature 5, and uses it only to learn *which conditions players are judged on*. No AutoReview text, table, tier number, threshold or ordering is copied into this spec or into any entry it defines. Every number below comes from Toolbox game data at the pin, the game client `N.js`, or a dated human Source.

**Patch.** Game v1.23 (Toolbox gameVer 2.3.540), parser pin `6c37e3d` (`packages/toolbox-parsers/UPSTREAM`). `N.js` read 2026-10-17 (the client served that day, 26.4 MB); offsets below are character offsets in that file and shift every patch, the symbol names do not.

**Fixtures.** Acceptance criteria use the two private fixtures, described by account, class and level, never by name: the **W2-late account** (5 characters: Barbarian 60, Squire 43, Shaman 44, Bowman 54, Wizard 56; family level 257) and the **W3-early account** (6 characters: Wizard 73, Squire 51, Bowman 60, Squire 85, Barbarian 56, Shaman 54; family level 379). CI runs the same assertions on `fixtures/scrubbed/scrubbed-w2.json` and `scrubbed-w3.json`. Every fixture value quoted was read on 2026-10-17 by a local script (section 11); exact text is pinned by the golden snapshots.

**Owner principles** (ruled 2026-10-17, binding on every requirement below). Each FR says which it serves as **P1–P7**:
- **P1** One Next Action per Goal.
- **P2** Never a target above the next Stage.
- **P3** Every line says who, where and how long.
- **P4** Breakdowns sit behind "why" (or "show details"), never in the list.
- **P5** One global ranking (`compareGoals`, M2 TR-14).
- **P6** No tier jargon ("Tier 3", "Optional", "Practical Max", "rank S").
- **P7** Every warning carries its fix.

## 1. Purpose

A W3-early account has five quiet leaks that no ActiveOn module catches yet. Its Redox Salt sits on Auto Refine at rank 1, so it will never rank up. Its 3D Printer is built and waiting for a salt payment the player can't see is short. It doesn't know which family level unlocks its next character slot, or how many days that is. It checks out Talent Book Library books for whatever talent the Library shows first. And nothing tells the player which whole System is lagging behind where the account is. M15 adds one opinionated Goal for each: **set up the Refinery**, **build this next**, **your next family unlock**, **check out this book**, and **behind for your Stage**. Each says what to do next, on which character, where, and how long it takes.

## 2. Scope / Out of scope

### Ownership (who builds what)

| # | Feature | Owner module | Folder that builds it | Entries and Detectors | Ships |
|---|---|---|---|---|---|
| F1 | Refinery set-up | **M6** | `packages/engine/src/unspent/`, `packages/knowledge/systems/refinery.yaml`, `packages/knowledge/detectors/refinery/` | `refinery.check.auto-refine-off`, `refinery.check.refine-full`, `refinery.check.unlock-next`; Detectors `refinery/auto-refine`, `refinery/full-bar`, `refinery/unlock-next`; fact `refinery.fact.salt-unlock-costs` | Phase 1 |
| F2 | Construction "build this next" | **M6** (Check), **M2** (the order list) | M6: `packages/knowledge/systems/construction.yaml`, `detectors/construction/`. M2: the list entry `construction.priority.build-order` in `systems/construction.priority.yaml` | `construction.check.build-next`; Detector `construction/build-next`; list `construction.priority.build-order` (`list: order`) | Phase 1 |
| F3 | Next family-level unlock | **M2** (Goal, character slots), **M8** (family obol slot rows) | M2: `packages/engine/src/metapath/family.ts`, `systems/metapath.yaml`. M8: the generated fact `obols.fact.family-slots` | `metapath.goal.family-unlock`; engine Detector `metapath/family-unlock` | Phase 1 |
| F4 | Talent Book Library | **M9** | `packages/engine/src/builds/library.ts`, `systems/library.yaml` | `library.check.checkout`, `library.check.read-book`; Detectors `library/checkout`, `library/read-book` | Phase 2, with M9 |
| F5 | Behind for your Stage | **M2** | `packages/engine/src/metapath/behind.ts`, `systems/metapath.yaml` | `metapath.metapath.stage-expectations` (`part: expectations`), `metapath.goal.behind`; engine Detector `metapath/behind` | Phase 1 (rows whose fix exists), rows added with each owner module |

"Phase 1" means right after M14 Phase 1 in the build order (README). F4 needs M9's Build entries and talent fields, so it ships in M9's build or right after it (D-3). A Stage Expectation row (F5) ships in the same PR as its fix entry, never before (M11's dangling-reference rule).

### In scope
- F1: Auto Refine off while a salt can still usefully rank up; refine a full bar; unlock the next salt when the account can pay for it without starving a waiting building. Switching an off salt on stays M6 FR-31.
- F2: one Construction Goal naming one building at a time, from a Stage-keyed order, with the salt it waits on, the build slot to use and the time to finish.
- F3: one Goal for the next thing the family level opens (a character slot or a family obol slot), with the gap and an ETA from save history.
- F4: one account Goal for Library checkouts: which talent to check out for which character, read any book already held, and when the next checkout is ready.
- F5: one Goal naming the System that lags the account's Stage the most, whose Next Action is that System's own top Next Action.

### Out of scope (and who owns it)
- **Salt ranks beyond "Auto Refine off until the safe rank"**: the full salt balance plan, Refinery Throttle timing (M2 Visit Order hint), fuel running dry (M3 FR-26), Salt Lick upgrades (M7 candidate, "Not covered yet").
- **Construction beyond the build order**: cogs and the Cog Board (M3 `construction.check.cog-seat-free`, PV 5.5 Contested), flags, Construct Mastery (W4), shrines and wizard towers past their quest levels, the Atom Collider (W4 value; "Not covered yet").
- **Death Note Lv 0 → 1**: M6 `death-note.check.build` keeps it; F2 defers to it (FR-12).
- **Which class the next character should be**: M2 FR-8. F3 only says when the slot opens and how to get there.
- **Filling family obol slots**: M8 FR-21. F3 only names the next one to open.
- **Talent points themselves**: M9. F4 only raises a talent's maximum level.
- **The Book Reservation System** (Automation Arm level 5, spends 20 checkouts for a top-level book) and VIP bookshelf books: shown as one why line at most; no Goal.
- **A per-System rating or a list of every lagging System** (AutoReview's Pinchy buckets). F5 names one System, never a ladder.
- **Writing a game formula** (ADR 0005). Where Toolbox computes no number, M15 states the stock or the gate, not a computed amount (D-1).

## 3. Functional requirements

### F1 Refinery set-up (M6)

Facts settled for this feature (section 11, V1):
- A salt **ranks up only on a manual Refine with a full power bar**. The Refine click is the only code that raises a salt's rank (`N.js` @7640085: `power >= PowerCAP(rank)` → `rank + 1`, then power → 0).
- **Auto Refine never ranks up.** The auto pass empties the bar into salt whenever power reaches the Auto Refine percentage of the cap, sets power to 0 and never touches the rank (`N.js` @7727530). The toggle stores 0.01 % or 0 (@7642192), and a v2.41 migration set every older percentage to 0.01 (@6422360), so "on" means "refine at any power" (wiki [Changelog/2025](https://idleon.wiki/wiki/Changelog/2025), v2.41, 2025-07-06: "it will refine into salt whenever it has any Power at all").
- **Salt per cycle is the same either way.** A Refine yields `floor(power)` salt (`RewardPct`, @7773451), so Auto Refine gives no extra salt per cycle.
- **An AFK Stretch fills at most one bar, whatever the setting.** Away time is added to the refinery timers (`AwayTimers`, @6466083); the next once-a-second tick runs every elapsed cycle in one batch, **capped at the room left in the bar**, and drops the leftover time (@7656133: cycles = `min(fuel, round((PowerCAP − power) ÷ PowerPerCycle), floor(timer ÷ cycle))`, the timer reduced by every elapsed cycle). The Auto Refine pass runs only after that batch, on the 10-second event. So over a stretch a salt makes at most `PowerCAP − power` power in either mode; what is lost is the room left unfilled. During a Play Session, a full bar with Auto Refine off stops the salt until it is refined.
- **A Refine on a partial bar wastes rank progress.** It pays out `floor(power)` and sets power to 0 with no rank-up (@7640085 onward), so with Auto Refine off the player should refine only a full bar.
- Ranking up raises fuel cost faster than output (fuel `rank^1.5`, power `rank^1.3`; wiki [Construction](https://idleon.wiki/wiki/Construction), 2026-10-07: "From Rank 3★ onwards, ranking up causes the efficiency to decrease"). Toolbox `getSaltsBalance` gives each salt's `saltMaxSafeRank` (the highest rank its **predecessor salt** can still fuel) and a `maxSafeRank` further capped by **printer** rates when a fuel material is being printed. F1 uses `saltMaxSafeRank` only: the printer cap changes whenever a sample changes, and on the W3-early account it is 0 for Redox (the printer makes about 38 Spore Cap an hour against 10 per cycle), which would silence F1 for the wrong reason (red-team #1). Redox has no predecessor, so its `saltMaxSafeRank` is Toolbox's `maxUsefulRank` (about 14,200); the community ranks Redox and Dioxide highest (PV 5.2, Reddit 2026-06 to 2026-08).
- Toolbox agrees: its salt balance alert skips any salt with `autoRefinePercentage > 0` because "a salt on auto refine never banks power to rank up with" (`utility/dashboard/account.js` at the pin).

Requirements:
- **FR-1 Auto Refine off.** From Stage W3-early to W4-entry (never on `coverage: 'beyond'` accounts, P2), for each salt that is unlocked, active, has Auto Refine on, and has `rank < saltMaxSafeRank`: one Account Goal "Turn Auto Refine off on <salt>, then refine it only when its bar is full" with the why "A salt ranks up only when you refine a full bar by hand; Auto Refine empties the bar every cycle, so it stays at rank <r>. Each rank makes more salt per cycle." No rank above the current one is shown (P2). Where: "Refinery, left of the Construction Table in Frostbite Tundra town". How long: "a few seconds; the bar is full in about <t>" (Toolbox `calcTimeToRankUp`, ADR 0005). The details add "Before a long AFK Stretch, refine a full bar so the stretch has the whole bar to fill" (V1). Several salts merge into one Goal in Refinery order, the first one's Next Action shown and the rest as details (P1, P3, P4). Urgency `banked`, position 3 (it compounds; nothing is lost this stretch). Category `compounding`.
- **FR-2 At the safe rank.** A salt with `rank ≥ saltMaxSafeRank` gets no F1 Goal in either setting: ranking further would starve the salt after it. ActiveOn never tells the player to switch Auto Refine **on** (D-2).
- **FR-2a Waiting buildings.** When a built-and-waiting building needs this salt (F2 FR-10) and its bar is not full, FR-1 still fires, and F2's Next Action says to wait for the full bar (FR-9 step 3), so the player is never pushed to refine a partial bar to pay a building (red-team #4).
- **FR-3 Refine a full bar.** For each active salt with Auto Refine off whose bar is full (`power ≥ powerCap`, the game's own rank-up test; Toolbox's looser alert rule would ask for a refine with no rank-up from rank 13, red-team #21): "Refine <salt> now: its bar is full, so it has stopped making salt", urgency `losing-now` (position 1, by urgency), category `compounding`. If its bar will fill before the Expected Return, the FR-1 or FR-3 why line adds "it fills in about <t>, before you're back; refine it then", and the Goal's `nextChangeAt` is that moment (M6 FR-28). This takes "manual refining and rank-ups" out of "Not covered yet" (README).
- **FR-4 Unlock the next salt.** From Stage W3-early, when the first locked salt's unlock cost (`refinery.fact.salt-unlock-costs`: the previous salt) is covered by that salt **in the storage chest** (the unlock reads and spends chest storage only, `N.js` @7643814) and **no** built-and-waiting building needs that salt (F2 FR-10): "Unlock <salt> in the Refinery (costs <n> <previous salt>; you have <h> in storage)". Category `compounding`, urgency `banked`, position 3. While a building waits on that salt, no Goal; F2's why line says the unlock comes next.
- **FR-5 Gates.** Every F1 Check fires only from Stage W3-early and only for salts the save marks `unlocked` (the first salt reads `unlocked` on every account, M6 TR-6). Salts 7–9 (Polymerization, W5+) never fire (P2). A failed `refinery` section, or a failed balance or cycle computation in the worker, makes the Detector `unknown` (M6 FR-3).
- **FR-6 Ownership.** "Switch on <salt>" and "get fuel for <salt>" stay M6 FR-31 (`refinery.check.salt-off`, `refinery.check.salt-fuel`). When FR-31 fires for a salt, F1 emits nothing for that salt (one Goal per salt, P1).

### F2 Construction "build this next" (M6 Check, M2 list)

Facts settled (section 11, V2):
- Each building level is a **build phase** (the bar fills from Total Build Rate in every build slot) and then a **salt payment**. The payment is made in the Construction Build menu and is paid from **inventory and storage chest only**: the level-up code removes the salt with `removeitems(…, "InventoryStorage")` (`N.js` @8779435), and the "can upgrade" mark checks `_ItemsAndStorageOWNED` (@8740784). **Salt sitting in the Refinery's 8 storage slots does not count** until it is collected. M6 FR-32's "the building finishes on its own" is wrong on this point (cross-spec finding X1).
- Build cost per level: Toolbox `getBuildCost(towers, level, bonusInc, index)`. Total Build Rate: Toolbox `account.construction.totalBuildRate`. The salt per level depends on the level and the Cost Cruncher; Toolbox does not compute it (D-1).
- Build slots are read from the save, never computed: `TowerInfo[54..61]` holds the building index in each slot, −1 when empty (`N.js` @8747958); the open-slot count comes from the same save data, not from a formula of ours (red-team #11, ADR 0005; verify item for the exact field).
- Each building's salt comes from game data (`towers[].itemReq[0].rawName`); a building whose salt is not unlocked can't be paid, so it is never "next".

Requirements:
- **FR-7 One building at a time.** From Stage W3-early, the Detector walks `construction.priority.build-order` for the current Stage (TR-6) and takes the **first item not yet at its target level** whose salt is unlocked. That building is the Goal's subject; the Goal shows one Next Action for it (P1), and the next two items as a "then: …" why line (P4).
- **FR-8 Never above the next Stage.** Items come from the current Stage's part of the list; when every item there is met, from the next Stage's part; never later (P2). Targets are levels authored per Stage (TR-6), capped at the building's `maxLevel`.
- **FR-9 The Next Action.** In this order, the first that applies:
  1. The building's bar is full and its payment is due, and some of the salt it needs is in the Refinery's storage slots: "Collect your <salt> from the Refinery's storage into the chest, then check <building> in the Build menu: it upgrades when you have enough". Where: "Construction Table, Frostbite Tundra town", on any character.
  2. The bar is full and that salt is not active (FR-31 would fire): the Goal hands off to F1/M6. Its Next Action is M6's ("Switch on <salt> …" or "Get <n> more <material> …"), and the why says "<building> is built and waiting for <salt>". No second Goal for the salt (P1, P7).
  3. The bar is full and the salt is active: "Upgrade <building> in the Build menu when you have its <salt>: you have <h> in storage". How long: when that salt has Auto Refine off, "<salt>'s bar is full in about <t>; refine it then" (FR-2a); when it is on, no time (the amount due is the game's, D-1).
  4. The building is not in a build slot and a slot is empty: "Put <building> in an empty build slot at the Construction Table".
  5. The building is not in a slot and every slot is busy: "Swap <building> into the build slot holding <the lowest-listed building in a slot>" (the slot holder is never the subject of an earlier item, never a building whose bar is already full).
  6. The building is in a slot and building: no Next Action. The Goal does not show; an info line "Construction: <building> Lv <n+1> in about <t>" goes behind "show details" on the Account section, where `t = (getBuildCost − progress) ÷ totalBuildRate` (ADR 0005 arithmetic).
- **FR-10 Waiting payments are reserved.** A built-and-waiting building's salt is reserved for it: F1 FR-4 never unlocks a salt with that stock, and FR-9 step 3 names the building first.
- **FR-11 Empty slots.** When a build slot is empty and the walk's first item is already in a slot, the Next Action fills the empty slot with the next unslotted item ("Put <next building> in your empty build slot"), so a slot is never idle (dossier: "an empty slot wastes the full build rate").
- **FR-12 Death Note.** When the walk reaches the Death Note at level 0, F2 defers to M6 `death-note.check.build` and emits nothing (no double Goal). From Death Note level 1 the list's later Death Note targets are F2's.
- **FR-13 Category and position.** `compounding`; urgency `banked`; position: the Stage list position M2 authors for `construction.check.build-next` (W3-early position 5, replacing the Leverage model's item 5; TR-6). No urgency escalation: the fixtures show build progress well past the cost (Death Note 6,585 against 2,250), so it is not known that a full bar wastes build rate (verify item, red-team #13).

### F3 Next family-level unlock (M2, with M8)

Facts settled (section 11, V3):
- Character slots open at family level 0, 8, 30, 70, 150, 300, 500, 750, 1,100, 1,500 and 5,000 (`N.js` `NewCharLvReq`, @13840595; wiki [Character Creation](https://idleon.wiki/wiki/Character_Creation), 2026-10-07). This confirms M2's tier-2 `metapath.fact.family-slots`, including the 11th slot at 5,000 (M2 R8's conflict).
- Family obol slots open by family level from Toolbox `shared-data.json` `obols` (`levelReq`): 60, 80, 100, 160, 200, 250, 350, 400 (two), 470, 650, 700, 875, 900, … (wiki [Obols](https://idleon.wiki/wiki/Obols), "Family Obol Level Reqs").
- **The save's family-slot lock can lag the gate; the trigger is not settled.** The code that rewrites family-slot locks from `LvTotal0` (@7111866) sits inside a large UI actor's setup (@7059362), not an obol-only screen. The W3-early account's slots up to 250 are open with the Obol Altar not done, while its 350 slot is still locked at family level 379. So the lock does update without the altar, but what triggers it, and whether `LvTotal0[0]` is exactly the family level, is open (verify item; M8 R10 stays open, red-team #9).

Requirements:
- **FR-14 The next unlock.** The Goal names the **lowest family-level gate above the current family level** among (a) the next character slot and (b) the next family obol slot, both from the gate tables, never from the save's lock flag. Ties name both in one line. While the Obol Altar is not done, an obol gate's line adds "equip it after the Obol Altar" (M8 FR-20 owns the altar).
- **FR-15 Text.** "Next family unlock: <what> at family level <n> (<gap> to go)". For a character slot it adds the class M2 FR-8 picks ("your Hunter"). Its Next Action is **the account's top Class XP Next Action** (`classes.goal.level`, M4/M5, which already says who, where and how long, P3) when one exists; otherwise the Goal renders as an Account info line with its gap and ETA and no action of its own (red-team #8: a bare "level your lowest characters" names no place and would pull Role holders off their jobs). Category `nice`, urgency `banked`, position: the last position of the Stage list (the tie with Class XP and next-character, M2 TR-13).
- **FR-16 How long.** With at least 2 Play Sessions over at least 24 h in `SaveHistory` (M1 TR-14), the ETA is `gap ÷ (Δ family level ÷ Δ time)` over the last 7 days (or all history if shorter), shown as "about <n> days at your recent pace" (ADR 0005 arithmetic on saves). With less history, or a pace of 0, no ETA ("ETA after a few more sessions"). Never extrapolated beyond 90 days ("more than 3 months at this pace").
- **FR-17 One line, not two.** F3 **replaces** M2 FR-9's closed-slot note: while a character slot is the next unlock, the Account section shows F3's Goal and not M2's note. Once a slot is open, M2's next-character Goal ("Create a character …") takes over and F3 names the unlock after it (D-4).
- **FR-18 Stale family lock.** Not in Phase 1. A gate met but saved locked gets no action and no claim (M8 FR-22's anomaly rule stands) until the trigger is verified (section 11).
- **FR-19 Gates and limits.** No Goal past the 11th character slot and the last family obol gate. No Goal on an account M2 flags `coverage: 'beyond'` for character slots past 10 (P2: slot 11 at 5,000 is W5+ content). Unknown family level (failed section) → `unknown`.

### F4 Talent Book Library (M9)

Facts settled (section 11, V4):
- **Checkouts accumulate account-wide** in `OLA[55]` while `timeAway.BookLib` fills; each stored checkout makes the next one slower: base 4 h divided by the checkout speed, times `1 + 10 × n^1.4 %` for `n` stored (Toolbox `getTimeToNextBooks`, mirroring `N.js` `BookReqTime`). Toolbox `account.libraryTimes` gives the count now and the time to the next one. **Holding checkouts costs refill speed**: on the W2-late account, 11 stored checkouts make the next one take about 15.5 h instead of 4 h.
- **A checkout picks a class page and a talent** and makes a **talent book item** whose level is a random roll between the account's minimum and maximum book level (Toolbox `getBookLvRange`: 101–125 on both fixtures), or the maximum with the Book Reservation System (`N.js` @8875709).
- **A book is read by holding it down**; it raises that talent's **maximum level on the character reading it** to the book's level (item tooltip, `N.js` @7015346: "Hold down on this book to increase the max level of the following Talent to <level>"). Max levels are per character, shared by both presets (character-builds dossier).
- **Not every talent takes a book.** Only class talents (`skillIndex < 615`) outside Toolbox's `BOOK_INELIGIBLE_INDICES` (`[10, 11, 12, 23, 75, 79, 86, 87, 266, 267, 446, 447]`, the game's `RANDOlist[16]`).
- The W3-early account holds **two unread Warrior-page books in storage**, both for talent 0 (Health Booster, a Basics HP talent) at levels 122 and 109, and its Squire Lv 85 already reads Health Booster at max 122. That pattern is what a Library click on the page's first talent produces. It is the failure F4 exists to stop.

Requirements:
- **FR-20 What to check out.** For each character with talent data at Stage W3-early or later, the **book candidate** is the first step of its Build (M9 TR-5) for the preset its AFK Target needs (the active preset when the target needs no role) that has `target: max`, is book-eligible, has `base == max` on that preset (the player has filled it, so more max levels are usable at once), and has `max < minBookLv`, so every roll raises it (a book's level is a random roll in the range, red-team #20). Core steps first, then Build order. A character with no Build (M9 FR-21) or no candidate gets none.
- **FR-21 Whose book first.** Candidates are ordered: the pusher (M2 TR-10) first, then characters in the order M2's Role table lists their line's first active Role (D-5), ties by higher level, then lower index.
- **FR-22 The Goal.** One Account Goal (#70 A5): "Library: check out <talent> for your <class Lv>" (P1) with where "Talent Book Library, Frostbite Tundra town: the <class line> page", and how long "you have <n> checkouts; the next one is ready in about <t>" (Toolbox `libraryTimes`). The other candidates, up to the stored count, are details: "then <talent> for your <class Lv>" (P4). The why: "Books raise a talent's max level for the character who reads it. Each checkout you keep makes the next one slower." Category `spendable`, urgency `banked`, position 3 (free value: checkouts are already earned).
- **FR-23 Read the book you hold.** When a talent book item sits in storage or an inventory and some character of its class line has that talent with `max < book level`: if the talent is a step in that character's Build, "Read the <talent> book (Lv <b>) on your <class Lv>: take it from storage and hold it down", first in the F4 Goal; if no Build lists it, the details line "Your <class Lv> can read the <k> <talent> books you hold (no current build uses it; free, but low value)", category `nice`, never the Next Action. Build membership decides the branch; the reader is the highest-level eligible character (red-team #19). No "check out more" advice ever follows a talent outside the Builds.
- **FR-24 When.** With 0 checkouts stored, or fewer than 20 while the Book Reservation toggle is on (a checkout then needs more than 19 and spends 20, `N.js` @8875709, red-team #6), no Goal; the next checkout's time appears as an info line behind "show details" only. With 1 or more, the Goal shows. The checkout count Toolbox computes already includes the time since the save (it reads the frozen `now`, M1).
- **FR-25 Gates.** From Stage W3-early **and** the Talent Book Library building at level 1 or more (Toolbox counts checkouts even with no Library: the W2-late account has 11 at building level 0, V4). F4 runs only where M9's Builds apply (M9 FR-21: no Journeyman line, no tab 4, nothing past W4). A failed `libraryTimes` section or unknown talents → `unknown`.

### F5 Behind for your Stage (M2)

Facts settled (section 11, V5): AutoReview's Pinchy places each rated section on a Stage ladder and compares the weakest with the Stage implied by the account's map progress. **M15 takes only that idea.** Its expectation table is our own: each row says "by this Stage, this fix of ours should no longer be firing", built from our dossiers' "Min-max by stage" sections, game-data gates and Sources dated after the current major patch.

Requirements:
- **FR-26 Stage Expectations.** `metapath.metapath.stage-expectations` lists rows `{ id, system, expectedBy: StageId, fix: <entry id>, when?, minCharacterLevel?, why, sources }` (TR-10). A row is **unmet** when its `fix` entry has at least one firing finding on this run whose subject passes the row's filters: character findings for characters below `minCharacterLevel` (default 30) or first seen in the current Play Session never count, so making a new character never marks the account behind (red-team #7). A row is **behind** when it is unmet and `expectedBy` is strictly earlier than the account's current Stage (`STAGES` order). Rows whose `expectedBy` is the current Stage or later are never behind: that is ordinary on-path work, ranked by the Stage list (P2).
- **FR-27 The weakest System.** Among behind rows, the weakest is the one with the earliest `expectedBy`; ties go to the fix with the better list position (M2 `positionOf`), then the row order in the table. Exactly one row is chosen per run.
- **FR-28 The Goal.** One Account Goal: "Behind for your Stage: <System>" with the why "Accounts usually finish this well before where you are; it's the earliest thing yours has left." No Stage label for the System, no rating, no placement (glossary _Avoid_, P6). Its one Next Action is the **fix entry's top-ranked Next Action** this run, unchanged (who, where and how long come from the fix, P3). Never "Tier a → b", never a score, never a list of other lagging Systems (P6).
- **FR-29 One Goal, not two.** While F5 shows, the fix entry's findings move into it: its top finding is the Next Action and the rest (other characters, other items) are `details` (#70 A5). The fix entry's own Goals do not also show on character rows or in the Account section (D-6). When F5 stops choosing that row, they return to their own places.
- **FR-30 Rank.** The Behind Goal ranks at its fix entry's list position, ordered inside that position by the same comparator as everything else, carrying the fix's urgency, cost and deadline (P5). It never jumps above position 1 items or the push (position 2). No "first in its tie" step: that would be a second ranking rule (red-team #16).
- **FR-31 No fix, no Goal.** A behind row whose fix finding is `unknown`, Contested or Stale is skipped (the next-weakest row is used), so the Goal always carries a fix that is safe to follow (P7). With no behind row, no Goal and no "you're on track" line.
- **FR-32 Seed rows.** The MVP table (TR-10) holds only rows whose fix entry exists in the build; each later module adds its rows in its own Knowledge Base PR, with player review (M11 TR-19 C).

### All features
- **FR-33** Every M15 Goal carries a tier 2–4 player-readable Source (#74) plus its tier-1 provenance, a confidence, and provenance (entry ids and Account State fields).
- **FR-34** No M15 Goal is a Verdict blocker or changes a Verdict (`affectsVerdict: false`, M6 R9).
- **FR-35** Every M15 Check names a done condition from a later save (`doneWhen`, M6 TR-8): F1 Auto Refine off or rank up; F2 the building's level rose or it entered a slot; F3 the gate passed (the Goal re-targets); F4 a new talent book item appeared or a held book left storage (the stored count alone also rises with time, red-team #24); F5 inherits its fix's done rule.

## 4. User stories

Unless a story says otherwise, `now` is the fixture's last cloud save and the Expected Return is 8 h. "Shows" means the `EngineResult` holds the Goal with that text; every Then is also a golden-snapshot line. Character facts are class and level only.

**US-1 Rank my salts.** As a player in a Play Session, I want to know when a Refinery setting is quietly stopping my salts from ranking up, so that the Refinery grows instead of standing still.
- Given the W3-early account (Redox Salt unlocked, active, Auto Refine on, rank 1, power 0 of 50; no salt feeds Redox, so its `saltMaxSafeRank` is Toolbox's `maxUsefulRank`, although its printer-capped `maxSafeRank` is 0) / When the engine runs / Then the engine result holds "Turn Auto Refine off on Redox Salt, then refine it only when its bar is full" with the why naming rank 1 and no higher rank number, where "Refinery, left of the Construction Table in Frostbite Tundra town", position 3, category `compounding`.
- Given the W3-early account / When the engine runs / Then no F1 Goal names Explosive Salt (unlocked and off: M6 FR-31's "Get 1 more Bullfrog Horn to run Explosive Salt" owns it, FR-6).
- Given the W3-early account mutated so Redox has Auto Refine off and power 50 of 50 at rank 1 / When the engine runs / Then "Refine Redox Salt now: its bar is full, so it has stopped making salt" shows at position 1, urgency `losing-now`.
- Given the W3-early account mutated so Redox is at rank 1 with Auto Refine off and its bar fills in under 8 h / When the engine runs / Then no Goal shows for Redox, and `nextChangeAt` is the moment the bar fills.
- Given the public `highend.json` save (`coverage: 'beyond'`) / When the engine runs / Then no F1 Goal shows.
- Given the W2-late account (Redox listed as unlocked, rank 1, inactive) / When the engine runs / Then no F1 Goal shows: the Stage is W2-late and the Refinery is a W3 System (FR-5).
- Given a later W3-early save with Redox Auto Refine off / When the engine runs / Then the F1 Goal moves to "Done this session".

**US-2 Build the right thing next.** As a player in a Play Session, I want one building named at a time, with what it's waiting for, so that every build slot and every salt goes where it counts.
- Given the W3-early account (2 build slots; slot 0 holds the Death Note at level 0, built and unpaid; slot 1 holds the 3D Printer at level 4, built and unpaid; 9 Redox Salts in storage and 8 in the Refinery's storage; 6 characters) / When the engine runs / Then the Account section shows the Construction Goal for the **3D Printer** (target level 6, one per character) with the Next Action "Collect your Redox Salts from the Refinery's storage into the chest, then check the 3D Printer in the Build menu: it upgrades when you have enough", where "Construction Table, Frostbite Tundra town", and the why line "then: Salt Lick, then Talent Book Library to level 2" (the authored order, TR-6; the Death Note is M6's).
- Given the same account / When the engine runs / Then no F2 Goal names the Death Note (M6's "Refine 10 Explosive Salts for the Death Note's first level (have 0)" owns it, FR-12).
- Given the W3-early account mutated so 17 Redox Salts are in storage and none in the Refinery / When the engine runs / Then the Next Action is "Upgrade the 3D Printer in the Build menu when you have its Redox Salts: you have 17 in storage" (FR-9 step 3; the amount due is the game's, D-1), with no time while Redox stays on Auto Refine.
- Given the W3-early account mutated so the 3D Printer is at level 6 and the Salt Lick is in no slot while a slot is empty / When the engine runs / Then the Next Action is "Put the Salt Lick in an empty build slot at the Construction Table", and the why says it needs Explosive Salt, which is not running yet.
- Given the W2-late account (no buildings, Total Build Rate 0) / When the engine runs / Then no F2 Goal shows.
- Given the W3-early account where a building is in a slot and building / When the engine runs / Then no Construction Goal shows for it and the Account details hold "Construction: <building> Lv <n+1> in about <t>" with `t = (getBuildCost − progress) ÷ 419` (the fixture's Total Build Rate, 419 per hour).

**US-3 Know my next family unlock.** As a player in a Play Session, I want to know what my family level opens next and how far it is, so that I level the right characters and plan my next one.
- Given the W2-late account (family level 257; 5 of 5 slots used; Obol Altar done; family obol gates met up to 250) / When the engine runs / Then the engine result holds "Next family unlock: character slot 6 for your Hunter at family level 300 (43 to go)" (M2 FR-8), with the top Class XP Next Action as its action when M4/M5 emit one (otherwise an Account info line), position last, and M2's closed-slot note does not also show (FR-17). The why mentions "a Circle family obol slot opens at 350".
- Given the W3-early account (family level 379; 6 characters; Obol Altar not done; the 350 Circle gate met but saved as locked) / When the engine runs / Then it holds "Next family unlock: a Hexagon and a Circle family obol slot at family level 400 (21 to go)" with "equip them after the Obol Altar", because obol gates count by the table, not the lock; no claim is made about the 350 slot (FR-18); the character slot at 500 is the next line in the why.
- Given either fixture (no save history) / When the engine runs / Then no ETA is shown ("ETA after a few more sessions").
- Given a synthetic history of 3 Play Sessions over 4 days in which family level rose from 349 to 379 / When the engine runs on the W3-early account / Then the ETA reads "about 3 days at your recent pace" (21 ÷ 7.5 per day, rounded).
- Given the W3-early account mutated to family level 401 / When the engine runs / Then the next unlock is family level 470 (a Circle family obol slot), not the character slot at 500.

**US-4 Use the Library well.** As a player in a Play Session, I want to know which book to check out for which character, so that my checkouts go to talents my builds actually use.
- Given the W3-early account (Stage W3-early; Library building level 1; 5 checkouts stored at `now`, next in 23,864 s; two Health Booster books Lv 122 and 109 in storage; the Squire Lv 85 is the pusher with Gilded Sword and Sharpened Axe at 100 of 100 on its fighting preset, below the minimum book level 101) / When the engine runs / Then the engine result holds "Library: check out Gilded Sword for your Squire Lv 85" with "you have 5 checkouts; the next one is ready in about 7 h" (M10's duration format: whole hours, rounded, under 24 h), where "Talent Book Library, Frostbite Tundra town: the Warrior page", position 3, and details listing the next candidates (the first capped, eligible Build step of each character in FR-21 order, pinned by the golden once the Builds are authored).
- Given the same account (the Barbarian Lv 56 has Health Booster at max 100, below both books) / When the engine runs / Then the details hold "Your Barbarian Lv 56 can read the 2 Health Booster books you hold (no current build uses it; free, but low value)" (FR-23), never as the Next Action.
- Given the W2-late account mutated to Stage W3-early with the Library at level 0 / When the engine runs / Then no F4 Goal shows (FR-25).
- Given the W2-late account (11 stored checkouts, no W3 access) / When the engine runs / Then no F4 Goal shows (FR-25).
- Given the W3-early account mutated to 0 stored checkouts / When the engine runs / Then no F4 Goal shows, and the details hold "Library: next checkout in about <t>".
- Given a later save with a new talent book item in storage / When the engine runs / Then the F4 Goal moves to "Done this session".

**US-5 Know what's lagging.** As a player in a Play Session, I want the one System that's furthest behind for my Stage named with its next step, so that I catch up where it matters instead of reading a wall of ratings.
- Given the W2-late account (Stage W2-late) / When the engine runs with the seed table (TR-10) / Then the behind rows are cards (expected by W1-mid: 3 characters have empty card slots), stamps (W1-late: 4 town-shop stamps not bought), talent presets (W2-early: 3 empty second presets) and big bubbles (W2-mid: the mining Squire Lv 43's empty slot); the weakest is **Cards** (every character involved is level 30 or more), and the engine result holds "Behind for your Stage: Cards" with the why "Accounts usually finish this well before where you are; it's the earliest thing yours has left", whose Next Action is M8's top card Next Action (an "Equip 4 cards" line on the first such character in Visit Order) and whose details hold the other characters' card lines. Those card Goals do not also show on the character rows (FR-29).
- Given the W3-early account (Stage W3-early) / When the engine runs / Then the behind rows include cards (W1-mid), anvil points (W1-mid), stamps (W1-late), the Obol Altar (W2-early), talent presets (W2-early), big bubbles (W2-mid: the Shaman Lv 54's two empty slots) and the Post Office (W2-late); the weakest is again **Cards** (earliest Stage; ahead of anvil points by row order at the same position 3).
- Given the W3-early account mutated so every card slot is filled / When the engine runs / Then the weakest is **Anvil points** ("Unspent anvil points on 1 character → Speed", M6's account line).
- Given any fixture / When the engine runs / Then no Behind Goal names a System whose row's `expectedBy` is the current Stage or later, and no Goal text contains "Tier", "rated", a score or a Stage label for the System.
- Given the W3-early account plus a new level-1 character with empty card slots, unspent anvil points and no second preset / When the engine runs / Then the Behind Goal is unchanged by that character (FR-26 filters).
- Given either fixture rendered through `buildNowView` with M10's Account cap / When it renders / Then every M15 Goal inside the cap is visible and the rest sit behind "show more" (Then lines above assert `EngineResult` rank; the cap is M10's, red-team #15).
- Given a W3-early account where the only behind row's fix is Contested / When the engine runs / Then no Behind Goal shows (FR-31).

## 5. Technical requirements

### TR-1 Package boundaries
Each feature lives in its owner's folder (section 2). Detectors read only the Account State (M1 TR-11) and the compiled Knowledge Base; none imports `toolbox-parsers`. The Toolbox calls F1 and F4 need (`getSaltsBalance`, `calcTimeToRankUp`, `getBuildCost`, `getBookLvRange`, `libraryTimes`) run **in the parse worker** after a clean parse, like M2's frontier (M2 TR-2), and land in the Account State as plain numbers.

### TR-2 Account State additions (M1 TR-11; owner in brackets)
```ts
// AccountSummary
refinery: null | {                                   // [M6] extends the shared account.salts list (M2 TR-3, M6 TR-3)
  salts: Array<{ rawName: string; rank: number; power: number; powerCap: number;
    autoRefine: boolean;                             // autoRefinePercentage > 0
    saltMaxSafeRank: number | null;                  // Toolbox getSaltsBalance .saltMaxSafeRank (predecessor limit only); null when its inputs failed
    fullInSeconds: number | null;                    // Toolbox calcTimeToRankUp(...).timeLeft - now, s; 0 when full
    unlockCost: { rawName: string; amount: number } | null }>; // refinery.fact.salt-unlock-costs; null for salt 1
  storage: Array<{ rawName: string; amount: number }>;          // refineryStorage (8 slots), not counted for payments
};
construction: null | {                               // [M6]
  totalBuildRate: number;                            // Toolbox account.construction.totalBuildRate, per hour
  buildSlots: Array<number | null>;                  // TowerInfo[54..61] as read: building index per open slot, null when empty
  buildings: Array<{ index: number; rawName: string; level: number; maxLevel: number;
    progress: number; buildCost: number;             // Toolbox getBuildCost at this level
    inSlot: boolean; saltRawName: string; bodyFull: boolean /* progress >= buildCost */ }>;
};
familyLevel: number | null;                          // [M2] already M2 TR-3
familyObolSlots: null | Array<{ shape: string; levelReq: number; lockedInSave: boolean }>; // [M8] from account.obols.list
library: null | {                                    // [M9]
  checkouts: number;                                 // Toolbox libraryTimes.bookCount (includes time since save)
  reservationOn: boolean;                            // Lab[16][3] == 1: a checkout spends 20 (Book Reservation System)
  libraryLevel: number;                              // towers.data[1].level
  nextInSeconds: number;                             // libraryTimes.next
  bookLv: { min: number; max: number };              // getBookLvRange
  heldBooks: Array<{ classPage: string; talentId: number; level: number; place: 'storage' | `inv:c${number}` }>; // TalentBook2..5 items, talent id from the item's custom stats (Speed), level from Reach
};
// CharacterState: M9 TR-3's TalentLevel.max already carries the per-character max level
```
`HistoryEntry` (M1 TR-14) gains `familyLevel` so F3 can compute its pace without loading full saves.

### TR-3 Fact tables (ADR 0007)
| id | Origin | Contents | Source |
|---|---|---|---|
| `refinery.fact.salt-unlock-costs` | authored tier 2 until generated | per salt: the previous salt and amount (Explosive 40 Redox, Spontaneity 150 Explosive, Dioxide 300, Purple 500, Nullo 750) | `N.js` unlock handler @7643805 (tier 1), wiki Construction "Refinery" (tier 2) |
| `construction.fact.buildings` | generated | index, rawName, display name, salt rawName, max level (`towers`) | Toolbox `shared-data.json` `towers` |
| `metapath.fact.family-slots` | authored tier 2 (M2), **now verified** | slots 2–11 at 8 … 5,000 | `N.js` `NewCharLvReq` (tier 1), wiki Character Creation 2026-10-07 |
| `obols.fact.family-slots` | generated (M8) | family obol slot shape and `levelReq` | Toolbox `obols`, wiki Obols |
| `talents.fact.book-eligible` | generated (M9) | per talent: book-eligible flag (`skillIndex < 615`, not in `RANDOlist[16]`) | Toolbox `BOOK_INELIGIBLE_INDICES` |

### TR-4 Entries (#11 shape; **A** authored, **G** generated)
| Entry id | Type | Detector | A/G | Position | Notes |
|---|---|---|---|---|---|
| `refinery.check.auto-refine-off` | check | `refinery/auto-refine` | A | 3 | FR-1, FR-2 |
| `refinery.check.refine-full` | check | `refinery/full-bar` | A | by urgency (1 or 3) | FR-3; `priority: { frame: by-urgency }` |
| `refinery.check.unlock-next` | check | `refinery/unlock-next` | A (G costs) | 3 | FR-4 |
| `construction.check.build-next` | check | `construction/build-next` | A | W3 Stage lists (TR-6) | FR-7–FR-13 |
| `construction.priority.build-order` | priority (`list: order`) | — | A | — | TR-6; owned by M2 |
| `metapath.goal.family-unlock` | goal | `metapath/family-unlock` (engine) | A | last | FR-14–FR-19 |
| `library.check.checkout` | check | `library/checkout` | A | 3 | FR-20–FR-22, FR-24 |
| `library.check.read-book` | check | `library/read-book` | A | 3 | FR-23 |
| `metapath.metapath.stage-expectations` | metapath (`part: expectations`) | — | A | — | TR-10; M11 schema addition |
| `metapath.goal.behind` | goal | `metapath/behind` (engine) | A | the fix's position, first in its tie | FR-26–FR-32 |

Example (authored), `systems/refinery.yaml`:
```yaml
- id: refinery.check.auto-refine-off
  system: refinery
  type: check
  detector: { id: refinery/auto-refine }
  category: compounding
  effortSeconds: 10
  text: "Turn Auto Refine off on {salt}, then refine it only when its bar is full"
  why: "A salt ranks up only when you refine a full bar by hand; Auto Refine empties the bar every cycle, so it stays at rank {rank}. Each rank makes more salt per cycle."
  doneWhen: { field: account.refinery.salts[*].autoRefine, becomes: false }
  appliesTo: { stages: [{ from: W3-early, to: W4-entry }] }
  confidence: H
  status: active
  sources:
    - { title: "IdleOn Wiki, Changelog/2025 (v2.41: Auto Refine is a toggle that refines at any Power)", url: "https://idleon.wiki/wiki/Changelog/2025", tier: 2, claimDate: 2025-07-06, verified: 2026-10-17, gameVersion: 2.3.540 }
    - { title: "IdleOn Wiki, Construction (Refinery, rank efficiency)", url: "https://idleon.wiki/wiki/Construction", tier: 2, claimDate: 2026-10-07, verified: 2026-10-17, gameVersion: 2.3.540 }
    - { title: "game code: the Refine click is the only rank-up; the auto pass never ranks up", url: "https://www.legendsofidleon.com/ytGl5oc/N.js", tier: 1, verified: 2026-10-17, gameVersion: 2.3.540, note: "@7640085 rank-up on manual Refine; @7727530 auto pass sets power to 0, rank untouched" }
    - { title: "Calculated by IdleOn Toolbox (getSaltsBalance, calcTimeToRankUp)", url: "https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/refinery.ts", tier: 1, verified: 2026-10-17, gameVersion: 2.3.540 }
```
Per #74 the UI links the wiki and shows the tier-1 lines as plain provenance text.

### TR-5 Detector logic
| Detector | Fires when | Next Action / text inputs | Urgency | `nextChangeAt` |
|---|---|---|---|---|
| `refinery/auto-refine` | Stage W3-early … W4-entry, coverage covered; salt `unlocked && active && autoRefine && saltMaxSafeRank != null && rank < saltMaxSafeRank`; M6 FR-31 silent for it | salt, rank, `fullInSeconds` | `banked` | none |
| `refinery/full-bar` | Stage ≥ W3-early; `active && !autoRefine && power >= powerCap` | salt | `losing-now` | none |
| (same Detector, early form) | `!autoRefine && 0 < fullInSeconds < expectedReturn` | no Goal; feeds the why line of FR-1/FR-3 and returns `nextChangeAt` | — | `now + fullInSeconds` |
| `refinery/unlock-next` | first locked salt ≤ 6; `chest(prev) ≥ unlockCost.amount`; no built-and-waiting building on `prev` | salt, cost, held | `banked` | none |
| `construction/build-next` | Stage ≥ W3-early; TR-6 walk yields a subject with a Next Action under FR-9/FR-11 | building, salt, place of salt, slot holder, ETA | `banked`, or `lost-before-return` under FR-13 | when the subject's bar fills: `now + (buildCost − progress) ÷ totalBuildRate` |
| `metapath/family-unlock` | `familyLevel` known; a gate above it exists (FR-19) | gate, what, gap, class (M2 FR-8), the top `classes.goal.level` finding if any, pace from `history` | `banked` | none |
| `library/checkout` | Stage ≥ W3-early; `checkouts ≥ 1`; ≥ 1 candidate (FR-20) | first candidate, others as details, `checkouts`, `nextInSeconds` | `banked` | `now + nextInSeconds` when `checkouts == 0` |
| `library/read-book` | a held book whose talent has `max < level` on some character of its line | book, character, place | `banked` | none |
| `metapath/behind` | engine step after every module's findings (TR-9) | chosen row, its fix's top finding | the fix's | the fix's |

Place filters (red-team #10), each taken from the code that spends the item: **salt unlocks and refinery fuel** read the storage chest only (@7643814, `FuelCalc` @7773451); **building payments** read the inventory of the character at the Construction Table plus the chest (`_ItemsAndStorageOWNED`, @8779435); refinery storage pays for neither. "You have" lines name each place. Because the payment amount is unknown (D-1), FR-4 reserves no amount; it simply never unlocks with a salt a waiting building needs (red-team #5).

### TR-6 The build order list (M2 owns the file)
`construction.priority.build-order` is a System ordering list (`list: order`, glossary Priority List) with one part per Stage and a level target per item. **Authored**, confidence M, player-reviewed in its Knowledge Base PR (M11 TR-19 C). Seed, from the dossier's early/mid W3 synthesis, the wiki and dated guides, filtered by game data (a building is listed only at a Stage whose salt can be unlocked):

| Stage | Order (target level) | Why | Sources (tier 2–4) |
|---|---|---|---|
| W3-early | 3D Printer (`target: characters`, the character count, capped at `max`) → Death Note (1, M6's) → Salt Lick (1) → Talent Book Library (2) → Pulse Mage and Fireball Lobber (the levels Hoggindaz 3–4 need, from `quests.json`) | Printer: one more character printing per level; Salt Lick unlocks its first upgrade (+printer sample size); Library: +5 % checkout speed per level. Targets are levels or `characters`, never the generated `maxLevel` written out (M11 FR-17) | wiki [Construction](https://idleon.wiki/wiki/Construction) 2026-10-07 ("Click on the first thing … the 3D Printer"); shnaps gist 2026-09-18 ("build + max it first"; Salt Lick, Library, Death Note named next); r/idleon [1cp1hjq](https://www.reddit.com/r/idleon/comments/1cp1hjq/) 2024-05-10 ("unlocking all 3D printer slots first") |
| W3-mid, W3-late | **Not authored in Phase 1** (D-7). Game-data candidates: Cost Cruncher (cuts every later salt payment), Automation Arm (remote Worship souls at 3), Trapper Drone (remote traps at 1), Chest Space, Salt Lick and Library levels | — | none yet with a dated, quotable human order; the dossier's W3-mid line fed the Leverage model, which also drew on AutoReview, so it is not reused (red-team #14) |

**Correction recorded for M2's lists.** The Leverage model's W3-early item 5 ("3D Printer → Cost Cruncher → Automation Arm → Library → …", PV 5.1 and 8.5) rests on AutoReview's building tiers, which this project may cite but not reuse as content. M2's W3-early list replaces that item with `construction.check.build-next` at position 5, ordered by this list. Cost Cruncher and Automation Arm need Spontaneity Salt (game data), which the W3-early Stage rarely has. Past W3-early the walk finds no authored item and F2 shows nothing until D-7's list is authored with dated human Sources (P2 still holds: nothing past the next Stage).

### TR-7 F2 walk
For the current Stage part, then the next one (FR-8): for each item in order, skip it when `level ≥ target`, when its salt is not `unlocked`, or when it is the Death Note at level 0 (FR-12); the first remaining item is the subject. Apply FR-9 to it. If FR-9 yields step 6 (no action) and a build slot is empty, apply FR-11 to the next remaining unslotted item. Stop at the end of the next Stage's part (P2).

### TR-8 F3 details
Pace: `Δ familyLevel ÷ Δ t` between the oldest and newest `HistoryEntry` in the window, using only entries whose character count equals today's (a new character jumps family level by its own level and is not pace).

### TR-9 F5 engine step
Runs in the engine core (built with M10) **after** every module's Detectors and **before** `compareGoals`: (1) for each row, look up its fix entry's findings this run; (2) compute behind rows (FR-26) and skip rows per FR-31; (3) choose the weakest (FR-27); (4) build `metapath.goal.behind` from the fix's top finding (by `compareGoals`) and attach the rest as `details`; (5) mark those findings as moved so the merge step does not render them again (FR-29). Pure, deterministic, ≤ 1 ms.

### TR-10 Stage Expectations, seed table
Shape (`part: expectations`, M11 TR-2b addition):
```ts
interface StageExpectation {
  id: string;                 // e.g. "cards-slots-filled"
  system: string;             // display name of the System, e.g. "Cards"
  expectedBy: StageId;        // the Stage by which the fix should be silent
  fix: string;                // an existing entry id; CI fails on a dangling id
  when?: { findingField: string; equals: string | number }; // e.g. F2's subject is the 3D Printer
  minCharacterLevel?: number; // default 30; newer characters never count (FR-26)
  why: string;                // one line, no tier words
  sources: Source[];          // ≥ 1 tier 2–4 (#74)
}
```
Seed rows, in table order (the tie-break, FR-27). Each `expectedBy` is the Stage at which the System's gate is open on every account plus the dossier's own stage advice; each is authored, confidence M, player-reviewed:

| Row | System | Expected by | Fix entry (owner) | Gate behind the Stage | Source |
|---|---|---|---|---|---|
| cards-slots-filled | Cards | W1-mid | `cards.check.empty-slots` (M8) | card slots exist from character creation; any card beats an empty slot | cards-obols dossier; PV 2.5-style "any stat beats empty"; wiki [Cards](https://idleon.wiki/wiki/Cards) |
| anvil-points-spent | Anvil | W1-mid | `anvil.check.spend-points` (M6) | anvil points from Smithing level 1 | W1 anvil dossier; wiki [Anvil](https://idleon.wiki/wiki/Anvil) |
| stamps-town-shops | Stamps | W1-late | `stamps.check.shop-now` (M8) | town shops of reached worlds | W1 stamps dossier; wiki [Stamps](https://idleon.wiki/wiki/Stamps) |
| obol-altar | Obols | W2-early | `obols.check.altar` (M8) | highest class level 30 (`obols.fact.obol-altar`) | cards-obols dossier; wiki [Obols](https://idleon.wiki/wiki/Obols) |
| presets-set-up | Talent presets | W2-early | `talent-presets.check.empty` (M9) | second preset from class level 15 | character-builds dossier; wiki [Talents](https://idleon.wiki/wiki/Talents) |
| big-bubbles | Alchemy | W2-mid | `alchemy-bubbles.check.fill-slot` (M6) | W2 Alchemy | W2 dossier; wiki [Alchemy](https://idleon.wiki/wiki/Alchemy) |
| post-office | Post Office | W2-late | `post-office.check.unlock` (M6) | highest class level 50 | W1 post-office dossier; wiki [Post Office](https://idleon.wiki/wiki/Post_Office) |
| salts-running | Refinery | W3-early | `refinery.check.salt-off` (M6) | W3 town | construction dossier; wiki Construction |
| printer-per-character | Construction | W3-mid | `construction.check.build-next` (M6, F2), `when: { findingField: subject, equals: 3D_Printer }` | W3 Construction | construction dossier; wiki 3D Printer |
| auto-refine | Refinery | W3-mid | `refinery.check.auto-refine-off` (F1) | W3 Refinery | wiki Changelog/2025; wiki Construction |

Every wiki URL is opened by the author of the row's Knowledge Base PR to confirm it covers the claim before it merges (#74); the table above names the page, not a verified quote.

### TR-11 Performance
All M15 Detectors together ≤ 3 ms per engine run on an 11-character account; the worker's added Toolbox calls (`getSaltsBalance`, `calcTimeToRankUp` × 6 salts, `getBuildCost` × 27 buildings, `getBookLvRange`) ≤ 20 ms p95, benchmarked at the pin with M2's frontier benchmark.

### TR-12 Security and privacy
Subjects are character indices; texts use class and level ("your Squire Lv 85"), never names. No new data leaves the browser; Report this carries the entry id and rendered text through M13's scrub. Held-book talent ids and levels are game data, not personal.

### TR-13 Tests
- Per Detector: fires / silent on both private fixtures (local), both scrubbed fixtures and the 11 public saves (CI, no crash; the public W4–W7 saves fire nothing past their caps).
- F1 contract test: on every fixture and public save, `refinery/auto-refine` fires only for salts with `autoRefinePercentage > 0` and `rank < saltMaxSafeRank`, never on a `beyond` account; a printer sample change alone never flips it.
- F2: the walk on synthetic towers (each FR-9 step, the Death Note deferral, an empty slot, a Spontaneity building at W3-early skipped); the "Refinery storage doesn't pay" case.
- F3: the slot table is an authored tier-2 fact with a patch tag (Toolbox carries `NewCharLvReq` only as a code comment, so it can't be generated); a unit test pins it against the `N.js` constant at the pin and the staleness pass flags it each patch; the pace rule with a new character in the window; the obol-gate-by-table case.
- F4: candidate selection on synthetic presets (ineligible talents skipped, `base < max` skipped, Health Booster books routed to the `nice` line).
- F5: behind vs current-Stage rows; the tie-break; FR-29's move (the fix's Goals render once); FR-31's skip on Contested, Stale and unknown fixes.
- Golden snapshots: every Then in section 4.

## 6. States and edge cases

| Case | Behaviour |
|---|---|
| Loading, broken parse, empty account | Nothing from M15 (M1, M10). |
| `refinery`, `towers`, `libraryTimes` or `obols` section failed | That feature's Detectors are `unknown` and listed in `failedDetectors`; others run; no Verdict changes. |
| Worker Toolbox call threw (`getSaltsBalance`, `getBuildCost`) | Field `null`; dependent Detector `unknown`, never a guessed 0 (M6 FR-3). |
| W2 account whose save lists Redox unlocked | No F1 or F2 Goal (Stage gate). |
| Salt at or above its safe rank, either setting | Silent (FR-2); over-ranking stays "Not covered yet" (no fix ActiveOn can give without a salt plan). |
| Printer printing a salt's fuel | Ignored by F1 (it reads the predecessor limit only); fuel running out is M3 FR-26. |
| A full bar the player refines during the session | Done on the next save (power fell, rank rose). |
| Building built, salt in the Refinery's storage | FR-9 step 1: collect, then upgrade. |
| Every listed building at target for this and the next Stage | No F2 Goal (P2). |
| Gem or merit build slots bought | `buildSlots` counts them; FR-11 fills them. |
| New character created | F3 re-targets at once; the pace window ignores the jump (TR-8). |
| Family obol gate met but saved locked | No claim, no action (FR-18); M8's diagnostic. |
| Library checkouts piling up on a W2 account | Silent until W3-early; the first W3 session shows them all. |
| A held book for a character who can't read it (wrong class line) | It is not offered to that character; the book line names the class line. |
| No Build applies (Journeyman line, elite tab 4, beyond W4) | No F4 candidate for that character. |
| Every behind row's fix Contested, Stale or unknown | No Behind Goal (FR-31). |
| Behind row's fix fires only on a character Not for me hid | That finding doesn't count; if none remain, the row is met. |
| Stale patch (parser behind) | M15 runs on what parsed; entries carry their patch and go Stale by M11's rule. |
| Offline, multiple tabs, second account | Pure functions of the same inputs; history is per uid (M1). |
| Paste mode | No history: no F3 ETA, no done detection (M6 TR-8). |

## 7. Dependencies and cross-module requests

| Module | M15 needs | M15 gives |
|---|---|---|
| M1 | TR-2 fields via TR-11; the worker step running the TR-1 Toolbox calls; `HistoryEntry.familyLevel` | — |
| M2 | Stage, `positionOf`, the pusher, Roles (FR-21), FR-8's class choice; the `construction.priority.build-order` file and its W3 list positions; the replacement of FR-9's closed-slot note by F3 (FR-17) | `metapath.goal.family-unlock`, `metapath.goal.behind`, `part: expectations` rows |
| M6 | `refinery.check.salt-off`/`salt-fuel` stay its own; `death-note.check.build` stays its own | F1 and F2 entries in its folder |
| M8 | `obols.check.altar` status, `obols.fact.family-slots`; FR-22's anomaly rule relaxed (C3) | F5 rows for its fixes |
| M9 | Builds, `TalentLevel.max`, `talents.fact.book-eligible` | F4 entries in its folder |
| M10 | `Goal.details` and info lines (already in TR-2/TR-3); "show details" for F2's in-progress line and F4's next-checkout line | — |
| M11 | schema additions: `part: expectations` (TR-10), `construction.priority.*` as a `list: order` file owned by M2; CI rule: every expectation `fix` resolves | — |
| M14 | `holdingsOf` (with a place filter that drops refinery storage for payments) | — |

**Cross-module requests** (for each owner's next PR; M15 edits no other spec):
- **C1 (M6):** FR-32's "When it is in a slot and the salts are held, the building finishes on its own" is wrong: the level-up is paid in the Build menu from inventory and storage only (V2). Its Next Action should add "collect from the Refinery's storage" when that is where the Explosive Salt sits.
- **C2 (M2):** replace W3-early item 5 with `construction.check.build-next` (TR-6); mark `metapath.fact.family-slots` verified against `NewCharLvReq` (closes R8's conflict); hide the FR-9 note while F3 shows (FR-17).
- **C3 (M8):** R10 is narrowed, not answered (V3): the lock is rewritten from the family level in a general UI setup block and updates without the Obol Altar; the trigger is still open, so FR-22's anomaly silence stays.
- **C6 (M6):** FR-31 reads Toolbox's fuel totals, which count refinery storage; the game fuels from the storage chest only (`FuelCalc`, @7773451), so "Switch on <salt>" can fire when the previous salt sits only in the Refinery's slots. Exclude refinery storage there (red-team #10).
- **C7 (M2):** add `library.check.checkout` and `library.check.read-book` (M9) and `refinery.check.auto-refine-off` / `unlock-next` (M6) to the position-3 free-value block, and `refinery.check.refine-full` to the never-skip block as by-urgency (TR-4; red-team #17).
- **C4 (M11):** the `expectations` part, the dangling-fix CI rule, and `list: order` files owned by M2 for a System (construction).
- **C5 (README):** "salt rank-ups and manual refining" leave "Not covered yet" for F1.

## 8. Open questions

Each with a recommendation. Settled facts are in section 11, not here.

❓ D-1 - Building salt payments: Toolbox doesn't compute the salt a building level costs (the game multiplies the base by the next level and the Cost Cruncher discount). Options: (a) never state the amount, only the salt and what's held; (b) an ADR 0005 exception with an authored formula fact citing `N.js` `TowerSaltCost`.
➡️ (a). The Next Action stays actionable without it (the Build menu shows the amount), ADR 0005 holds, and FR-4 never unlocks with a salt a waiting building needs, so no amount is ever guessed (TR-5). Revisit only if Toolbox starts computing it.

❓ D-2 - Should ActiveOn ever say "turn Auto Refine **on**" (for a salt at its safe rank)?
➡️ No, not in Phase 1. The code shows no salt gain from it: an AFK Stretch fills at most one bar in either mode (V1), and on gives up rank-ups. Its only benefit is not having to refine a full bar by hand during play. The community disagrees (the gist says "on for every salt", Reddit threads in PV 5.2 say never for Redox and Dioxide), so silence at the safe rank is the honest answer.

❓ D-3 - F4 needs M9's Builds. Ship F4 with M9 (step 12) or ship a Build-free first cut after M14 Phase 1 (any capped, book-eligible talent on the AFK preset)?
➡️ Ship with M9. A Build-free rule would recommend whatever talent the player happened to cap (Health Booster on the W3-early Squire is exactly that), which is the failure F4 is meant to stop.

❓ D-4 - F3 replaces M2's closed-slot note. Keep M2's note wording ("Next character: Hunter. Slot 6 opens at family level 300") inside F3's line, or drop the class from F3?
➡️ Keep the class in F3's line ("character slot 6 for your Hunter at family level 300"). One line answers both "when" and "what", and M2's note disappears.

❓ D-5 - F4 order across characters: pusher first, then Role order (recommended); or the character whose candidate talent is core in its Build first; or plain Visit Order?
➡️ Pusher first, then M2's Role order. The pusher's damage talents compound into the push (position 2, the account's top lever), and Role order is stable across saves; Visit Order changes every session and would reshuffle the Library advice.

❓ D-6 - F5 moves the fix's findings into the Behind Goal (FR-29), so a lagging card slot no longer shows on that character's row. Or keep them on the rows and make the Behind Goal a pointer with no action of its own?
➡️ Move them. It keeps P1 (one Next Action) and "one Goal, not a duplicate", and the per-character lines are one tap away in "show details" (#70 A5). A pointer Goal with no Next Action would break the glossary's Goal definition.

❓ D-7 - Phase 1 authors only the W3-early build order (wiki, gist, Reddit). Author W3-mid and W3-late now from game-data reasoning alone (e.g. Cost Cruncher first because it discounts every later payment), or wait until a dated human Source orders them?
➡️ Wait. The only full mid-W3 orders we hold trace back to AutoReview's tiers through the Leverage model, which we may cite but not reuse (red-team #14). An agent finds a dated guide or forum order in the Knowledge Base PR for that list, player-reviewed by the owners; until then F2 is silent past W3-early.

❓ D-8 - F5's seed table: is W1-mid right for "every card slot filled" (it makes Cards the weakest System on both accounts today, on characters level 30 and up)?
➡️ Yes. Cards and slots exist from the first character, any card beats an empty slot (the cards dossier), and both accounts really do have level-30-plus characters with empty card slots. New and low characters no longer count (FR-26). If it still feels constant after 5 sessions, move it to W1-late.

## 9. Red-team notes (author's own pass)

- **R1 Wrong Auto Refine advice.** A guide says the opposite (gist 2026-09-18, "turn auto-refine ON for every salt — no downside"). *Defence:* the rule rests on game code (V1), which wins under ADR 0004; ActiveOn only ever says "off" and only below the safe rank (FR-2, D-2); the Toolbox contract test (TR-13) keeps us in line with Toolbox's own reading.
- **R2 The bar stalls.** An AFK Stretch fills at most one bar in either mode, and during play a full bar with Auto Refine off stops the salt. *Defence:* FR-3 at position 1 when full; FR-1's details tell the player to refine a full bar before a long stretch; `nextChangeAt` re-runs the engine when the bar fills.
- **R3 Unlocking a salt starves a building.** *Defence:* FR-4 never unlocks with a salt any built-and-waiting building needs (no amount guessed, D-1), and the waiting building is named first (FR-10).
- **R4 Building order copied from AutoReview.** *Defence:* TR-6 is authored from the wiki, the gist, a dated Reddit thread and game-data gates; the Leverage-model item that rested on AutoReview tiers is replaced (C2).
- **R5 "Refinery storage counts" mistake.** M6 and our own holdings rule would say the salts are held. *Defence:* V2's code reading, the payment filter in TR-5, a dedicated test.
- **R6 Library advice that wastes checkouts.** *Defence:* candidates come only from Builds (D-3), only for eligible, already-capped talents, and the held Health Booster books are routed to a `nice` line, never "check out more".
- **R7 Behind Goal turns into Pinchy.** *Defence:* one System only (FR-27), rows only for earlier Stages (FR-26), its action is the fix's own (FR-28), no tier words (US-5 asserts it), and the table is ours (TR-10).
- **R8 Noise.** Five new Goals on a W3-early account, against M10's Account cap. *Defence:* F1, F4 and F5 are single account lines with details; F2 shows nothing while building; F3 sits at the last position and becomes an info line without a Class XP action; F5 moves rather than adds (FR-29); a cap-rendering test (US-5).

## 10. Red-team log

Independent red-team run on 2026-10-17 by a sub-agent that had not seen the author's reasoning, given this spec, `GLOSSARY.md`, the ADRs, `AGENTS.md`, the sibling specs, the vendored Toolbox, `N.js` and the private fixtures (class and level only). Each finding was checked against that evidence before a verdict. 24 findings: P0 1, P1 8, P2 10, P3 5. Verdicts: fixed 21, fixed in part 2, rejected 1.

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| 1 | P0 | F1 silent on the W3-early account: `maxSafeRank` is capped by printer rates (Spore Cap printed at about 38/h vs 10 per cycle → 0) | Fixed | F1 reads `saltMaxSafeRank` (predecessor limit only); V1, US-1, TR-2, TR-5, TR-13 |
| 2 | P1 | Auto Refine on also stalls over an AFK Stretch: away time is applied in one batch capped at the bar's room | Fixed | Confirmed at @6466083 and @7656133; V1, FR-1 why and details, D-2, R2 rewritten |
| 3 | P1 | "Safely go to rank 14,200" breaks P2; F1 fires on `beyond` accounts | Fixed | No rank above the current is shown; F1 gated to W3-early … W4-entry, never `beyond` (FR-1, US-1) |
| 4 | P1 | Missing "refine only a full bar"; F2 pushes an early refine | Fixed | FR-1 text, FR-2a, FR-9 step 3 waits for the full bar |
| 5 | P1 | Reserving the base amount under-reserves (payment is base × next level) | Fixed | FR-4 never unlocks while a building waits on that salt; TR-5 |
| 6 | P1 | F4 fires with no Library built; Book Reservation needs 20 | Fixed | FR-25 Library level ≥ 1; FR-24 reservation rule; TR-2 fields; US-4 case |
| 7 | P1 | F5 flips on a new character; Stage-label wording is a placement | Fixed | `minCharacterLevel` (30) and new-character filter (FR-26); why reworded without a Stage label (FR-28); US-5 cases |
| 8 | P1 | F3's "level your lowest characters" has no where or how long and fights Roles | Fixed | Next Action is the top Class XP Next Action, else an info line (FR-15, US-3) |
| 9 | P1 | The obol-lock trigger is not obol-screen-specific; altar is not needed to open slots | Fixed in part | V3 narrowed, FR-18 deferred, obol gates by table with an altar note (FR-14); trigger left as a verify item (a one-minute signed-in check) |
| 10 | P2 | Wrong place filters (unlocks and fuel are chest-only; payments are character inventory plus chest) | Fixed | TR-5 place filters; FR-4; FR-9 step 1; cross-module request C6 for M6 FR-31 |
| 11 | P2 | Build slots computed by a formula of ours | Fixed | Read `TowerInfo[54..61]` (TR-2, F2 facts); exact open-slot field is a verify item |
| 12 | P2 | FR-9 step 3's ETA unrelated to the payment; step 1 assumes the total covers it | Fixed | Step 1 "collect, then check the Build menu"; step 3 time only from the salt's full bar |
| 13 | P2 | FR-13's escalation assumes a full bar wastes build rate, which the fixture contradicts | Fixed | Escalation removed; verify item |
| 14 | P2 | W3-mid build order and "Cost Cruncher first" mirror AutoReview's tier sets | Fixed | W3-mid/late not authored in Phase 1; D-7 rewritten; V5 records it |
| 15 | P2 | M10's Account cap hides M15 Goals; stories said "shows" | Fixed | Thens assert `EngineResult`; a cap-rendering test (US-5) |
| 16 | P2 | "First in its tie" is a second ranking rule | Fixed | Removed; FR-30 uses the comparator only |
| 17 | P2 | Expectation rows can't express "while its subject is the Printer"; F4 needs a position-3 slot from M2 | Fixed | `when` field (TR-10); request C7 to M2 |
| 18 | P2 | Fixture rosters and owner names in a public spec | Fixed in part | Owner names dropped from D-7. Class/level rosters kept: every sibling spec uses them, they carry no names, and the goldens need them (M8 red-team #30 precedent) |
| 19 | P2 | F4 contradicts itself: the Barbarian Lv 56 can read the Health Booster books | Fixed | FR-23 branch by Build membership; US-4 details line names the Barbarian Lv 56; book decoding marked provisional |
| 20 | P2 | `max < maxBookLv` lets mostly-wasted rolls through | Fixed | FR-20 requires `max < minBookLv` |
| 21 | P3 | Toolbox's looser "full" rule refines without a rank-up from rank 13 | Fixed | FR-3 and TR-5 use `power ≥ powerCap` |
| 22 | P3 | Writing out `max 11` trips M11 FR-17; `NewCharLvReq` can't be generated | Fixed | `target: characters` / `max`; TR-13 pins the authored fact against `N.js` |
| 23 | P3 | Duration rounding unspecified; untestable "nothing past their caps" | Fixed | US-4 states M10's format; public-save silences are the existing per-Detector fire/silent tests |
| 24 | P3 | F4 done rule misses checkouts over a long gap | Fixed | Done when a new book item appears (FR-35, US-4) |
| — | — | (none) | Rejected | Only the roster sub-point of #18, above |

## 11. Verify results (settled before build)

Code- and data-checkable items, done on 2026-10-17 at the pin and in `N.js`. Fixture checks ran locally on `fixtures/private/{W2-late,W3-early}.parsed.json` by a scratch script; only class, level and aggregates appear here.

- **V1 Auto Refine rule: confirmed, with one correction from the red-team.** The only rank-up in the client is the manual Refine at a full bar (@7640085). The auto pass (@7727530) refines at power ≥ Auto Refine % × cap, sets power to 0 and never changes the rank. Toggle values 0.01/0 (@7642192); old percentages migrated to 0.01 (@6422360). Refine yields `floor(power)` salt either way (`RewardPct`). **Correction:** away time is added to the refinery timers (@6466083) and applied in one batch capped at the bar's free room, the rest dropped (@7656133), with the auto pass only after it, so an AFK Stretch fills at most one bar whatever the setting. Toolbox at the pin agrees that an auto-refining salt "never banks power to rank up with". The wiki changelog v2.41 says the toggle refines at any power. W3-early fixture: Redox rank 1, active, Auto Refine on, power 0 of 50; Toolbox's printer-capped `maxSafeRank` is 0 (Spore Cap printed at about 38/h), its `saltMaxSafeRank` is `maxUsefulRank`, so F1 fires on the latter (FR-1); Explosive unlocked and off → M6 FR-31. W2-late: Stage gate, silent.
- **V2 Building payments: settled.** The level-up removes salt from the active character's inventory and the chest (`removeitems(…, "InventoryStorage")`, @8779435); the affordability mark reads `_ItemsAndStorageOWNED` (@8740784); refinery storage is separate (`Refinery[1..2]`). Build slots: `TowerInfo[54..61]` hold the building per slot (@8747958). Salt unlocks and refinery fuel read the chest only (@7643814, `FuelCalc`). W3-early fixture: 3D Printer level 4 with progress 4,411 against a level-4 build cost of about 186 (built, waiting), 9 Redox in storage + 8 in refinery storage; Death Note level 0 built (6,585 against 2,250) with 0 Explosive; Total Build Rate 419/h; 2 build slots (no gem or merit slots). The salt amount per level is a game formula Toolbox does not compute (D-1).
- **V3 Family thresholds: confirmed.** `NewCharLvReq` = 0, 8, 30, 70, 150, 300, 500, 750, 1,100, 1,500, 5,000 (@13840595), matching M2 and the wiki. Family obol gates from Toolbox `obols`; on both fixtures the 350 Circle slot is saved locked, although the W3-early family level is 379 and its lower slots opened without the Obol Altar; the lock rewrite (@7111866) sits in a general UI setup block (@7059362), so its trigger stays open. W2-late: next = slot 6 at 300 (43 to go); next obol gate 350. W3-early: next = the two family obol slots at 400 (21 to go), then character slot 7 at 500 (121).
- **V4 Library: settled.** Checkout count and timing from Toolbox `libraryTimes` (W2-late: 11 stored with the Library at building level 0, next about 11 h, base time per checkout grown to about 15.5 h; W3-early: 5 at `now`, Library level 1, next about 6.6 h). With the Book Reservation toggle (`Lab[16][3]`) on, a checkout needs more than 19 stored and spends 20 (@8875709). Book range 101–125 on both. Checkout makes a book item with a random level in range (@8875709); reading it raises that character's max level (@7015346). Eligibility list from Toolbox. W3-early holds two Warrior-page books for talent 0 (Health Booster) at 122 and 109, and its Squire Lv 85 reads Health Booster at max 122; candidate talents for it (Gilded Sword, Sharpened Axe: indices 6 and 5, eligible) sit at 100 of 100.
- **V5 AutoReview use: checked.** No AutoReview string, tier table, threshold or order appears in this spec or its entries. The red-team found that a draft W3-mid build order matched AutoReview's tier sets through the Leverage model; it was removed (TR-6, D-7). TR-6's W3-early order and TR-10's rows cite the wiki, dated guides, our dossiers and game data. AutoReview is cited for the idea only.

Remaining before build (each owner's first PR):
- [ ] The Talent Book Library's in-game location text for FR-22's "where" (town building vs Construction screen), read from the client's scene data or a player's one look; until then "Talent Book Library, Frostbite Tundra" (M9).
- [ ] How the talent id of a chest-stored book is encoded (the fixture's custom stats show `Speed: 0` for both books; confirm 0 means talent 0, Health Booster, not "unset"). Until then the Health Booster reading in F4's stories is provisional (M9).
- [ ] What triggers the family-slot lock rewrite (@7111866) and whether `LvTotal0[0]` is the family level; then FR-18 and M8 FR-22 can act on a stale lock (M2, M8). A signed-in player can settle it in a minute by opening the Obols screen on the W3-early account and checking the 350 slot.
- [ ] Whether build progress past a full bar carries over to the next level (`TowerInfo[66+i]` on level-up); it decides FR-13's urgency (M6).
- [ ] The open-slot count next to `TowerInfo[54..61]` (which entries are unlocked slots) (M6).
- [ ] `refinery.fact.salt-unlock-costs` read from the unlock handler (@7643805) rather than the wiki table (M6).
- [ ] The worker benchmark for the TR-1 Toolbox calls (TR-11).
- [ ] Each TR-10 row's wiki page opened and confirmed by its PR author (#74).

## Sources

- Game client `N.js`, https://www.legendsofidleon.com/ytGl5oc/N.js, read 2026-10-17 (game 2.3.540). Offsets cited inline.
- IdleOn Toolbox at `6c37e3d` (vendored): `parsers/world-3/refinery.ts`, `parsers/world-3/construction.ts`, `parsers/misc.ts` (`getLibraryBookTimes`, `getTimeToNextBooks`, `getBookLvRange`), `parsers/talents.ts` (`BOOK_INELIGIBLE_INDICES`), `utility/dashboard/account.js`, `data/website-data/{talents,quests,shared-data}.json`.
- IdleOn Wiki: [Construction](https://idleon.wiki/wiki/Construction) (2026-10-07), [Changelog/2025](https://idleon.wiki/wiki/Changelog/2025) (v2.41, 2025-07-06), [Talent Book Library](https://idleon.wiki/wiki/Talent_Book_Library) (2026-10-12), [Character Creation](https://idleon.wiki/wiki/Character_Creation) (2026-10-07), [Obols](https://idleon.wiki/wiki/Obols); all opened 2026-10-17.
- shnaps, IdleOn progression gist, https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa (rev. 2026-09-18), opened 2026-10-17.
- r/idleon thread 1cp1hjq (2024-05-10), via search snippet; r/idleon threads 1tzc5nw, 1vq7e2t, 1v57r29 as recorded in PV 5.2 (not reopened: reddit blocked the fetch).
- Our research: `research/w3-systems` (`construction.md`), `research/character-builds`, `research/account-wide` (`achievements-tasks-merit.md`), `research/priority-verification` (PV 5.1, 5.2, 8.5), `research/leverage-model` (§3.7), the AutoReview deep dive (2026-10-17).
- IdleOn AutoReview (inspiration only, no licence): https://github.com/TwoSpookyBoos/IdleOnAutoReviewBot, https://ieautoreview-scoli.pythonanywhere.com/.
