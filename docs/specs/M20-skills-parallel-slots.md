# M20 Skills, Parallel Slots and the Daily & Weekly Checklist

Spec for the owner's request of 2026-10-18 (System Atlas gaps #1, #2 and #7), part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **ready for owner review**: red-teamed by an independent reviewer; every confirmed P1 and P2 finding is fixed (section 10). Every open question is self-ruled with a researched recommendation (section 8, "Owner review"), because the owner was away. Terms follow [`GLOSSARY.md`](../../GLOSSARY.md); decisions follow [ADRs 0001–0009](../adr/).

**Why this exists.** The System Atlas (2026-10-18) found that ActiveOn covers the *waste* side of a system ("claim before it caps") but has no single place for the routine a casual player loses most value on, and never says *who* should fill a free slot. Its top gap is one checklist of everything that resets daily or weekly: today the pieces are scattered over separate cards, and the weekly items (Killroy, Weekly Battles, the Bonus Ballot) and Random Events are not covered at all. Its second gap is Parallel Slots left empty: on the W3-early account 2 of 6 characters sit on the Cog Board, no character wears a worship skull (4 of 6 sit at the 50-charge cap), no character can place a trap, and Liquid Nitrogen has nobody on it. Its seventh is Construction levelling and cog tiers. Nobody shows a player each character's skills next to the Role it plays. M20 does all three, and gives each a findable home: a section with a progress ring on the Now screen, a Skills tab on the character page, and page bodies for M17's System pages.

**Decisions this spec rests on:**
- [ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md) (deterministic advice), [0004](../adr/0004-source-precedence.md) (game data first), [0005](../adr/0005-toolbox-numbers-not-our-formulas.md) (Toolbox numbers plus arithmetic), [0006](../adr/0006-client-only-spa-parsing-in-a-worker.md) (Toolbox code only in the worker), [0007](../adr/0007-generated-facts-authored-judgment.md) (generated facts, authored judgment), [0009](../adr/0009-game-art.md) (our own art: page models are data, never sprites).
- [#74](https://github.com/YassSoliman/idleon-forge/issues/74): every entry links a player-readable tier 2–4 Source; tier-1 game data stays as provenance.
- [#70](https://github.com/YassSoliman/idleon-forge/issues/70) A5: a Goal that would repeat across characters is one account line with per-character details.
- **M15's owner principles P1–P7**, adopted unchanged: one Next Action per Goal; never a target above the next Stage; every line says who, where and how long; breakdowns behind "why" and "show details"; one global ranking (`compareGoals`); no tier jargon; every warning carries its fix.
- **M3 Final rulings R-PILL-1 and R-PILL-2**: capped worship charge and traps finishing early are pills, not blockers. M20 adds no blocker of any kind.
- **M6 TR-6** (the rolling reset projection): `resetAt` rolls forward in 24 h steps from the save's `ShopRestock` countdown. M20 extends it to the weekly clocks (FR-3).
- **The owner's rule that features need a findable home** (2026-10-18): every M20 output has a place a player can open on purpose, not only a line that appears when something is wrong.

**Patch.** Game v1.23 (Toolbox gameVer 2.3.540), parser pin `6c37e3d` (`packages/toolbox-parsers/UPSTREAM`). `N.js` facts come from the resets dossier (`research/account-wide` `resets-dailies-events.md`, read 2026-10-17, offsets cited there). Wiki pages were opened on 2026-10-18 (section 11.3 lists each claim and the page that confirms it).

**Fixtures.** Acceptance criteria use the two private fixtures by account, class and level only: the **W2-late account** (5 characters: Barbarian 60, Squire 43, Shaman 44, Bowman 54, Wizard 56; `currentWorld` 2) and the **W3-early account** (6 characters: Wizard 73, Squire 51, Bowman 60, Squire 85, Barbarian 56, Shaman 54; `currentWorld` 3). Values were read on 2026-10-18 by local scripts, at the **golden clock** (`now` = the save's own `GlobalTime`, Expected Return 8 h). CI runs the same assertions on `fixtures/scrubbed/scrubbed-w2.json` and `scrubbed-w3.json`.

## 1. Purpose

A W1–W3 player in a 15-minute Play Session has two questions M20 answers. **"What do I do before I lose it?"** The game resets some things every day and some every week, on the account's own clock (not midnight, not UTC). M20 lists every one of them for this account in one **Daily & Weekly Checklist**: each row says what to do, how long it takes, whether it banks, when it resets, and ticks itself off from the next save. A ring on the Now screen shows "Today 1 of 11 · Week 2 of 5" at a glance. **"Is every character doing everything it can?"** Each character has one AFK Target and up to five Parallel Slots that run beside it for free: a Cog Board seat, worship charge, traps, a cauldron seat and a printer sample. M20 finds the ones that are empty or idle, says who should fill each one and how, and shows each character's skills next to the Role the Meta Path gives it, so the player knows which skill that character is for. It reads only the save; it never touches the game.

## 2. Scope / Out of scope

### Ownership (who builds what)

M20 is a **new module** with its own folders (D-1). It reuses other modules' interfaces and asks small changes of their owners (section 7).

| # | Feature | Folder that builds it | Entries and Detectors | Ships |
|---|---|---|---|---|
| F1 | **Daily & Weekly Checklist**: the row registry, the three reset clocks, done-detection, links, the Now section and its rings | `packages/engine/src/checklist/`, `apps/activeon/src/now/Checklist.tsx` | `checklist.fact.rows`; engine Detector `checklist/rows`; new Checks `random-events.check.today`, `killroy.check.room`, `killroy.check.skulls`, `weekly-battles.check.raid`, `ballot.check.vote`, `pet-tournament.check.register`, `task-board.check.daily`, `guild.check.daily`, `guild.check.weekly` | Phase 1 |
| F2 | **Parallel Slots**: per-character slot facts, the slot Checks, who fills each slot, the Skill Grid and the per-system page sections | `packages/engine/src/slots/`, `packages/account-state/src/slots.ts` | `construction.check.cog-seat-free` (taken over from M3, D-9), `worship.check.no-skull`, `trapping.check.start`, `trapping.check.no-trap-set`, `alchemy.check.liquid-unstaffed`, `slots.priority.fill-order`; engine Detector `slots/overview` | Phase 1 |
| F3 | **Skills tab** on the character page | `packages/engine/src/slots/skills.ts`, `apps/activeon/src/now/SkillsTab.tsx` | `skills.fact.gates`, `skills.fact.specialty`; engine Detector `skills/overview` | Phase 1 |
| F4 | Demand-driven slot choices (which critter, which totem's souls) on M14's Demand; the skull ladder past Wax; Cog Board swaps from Toolbox's board optimiser; the cog-shelf collect; Picnic Stowaway, Liquid Shop gems and Happy Hour rows | same folders | added entries | Phase 2 |

### In scope

- Every daily and weekly reset item a W1–W3 player meets (FR-1–FR-16), whether its Check is M20's or another module's (M6 owns keys, tickets, plays, vials, Spiketrap, the pet pull, Pet Mart gems and Post Office orders; the checklist only reads them).
- Four Parallel Slots beyond the printer: the Cog Board seat (Construction), worship charge and skulls (Worship), traps (Trapping) and the cauldron seat (Alchemy). The printer stays M14's; M20 only shows its pip (FR-27).
- Skill levels, efficiency, Roles and the next gate of every W1–W3 skill, per character (FR-33–FR-38).
- The dedicated System page bodies (pictures) that M17's System pages render for Construction, Worship, Trapping and Alchemy, the Skill Grid for M17's Characters place, and M20's Timeline bars (TR-6).

### Out of scope (and who owns it)

- **Verdict blockers and caps.** An unassigned cauldron and finished traps stay M3's blockers; capped worship charge and traps finishing early stay M3's pills (R-PILL-1). M20 never changes a Verdict.
- **Moving a character's AFK Target.** Only M5 (Higher-leverage options) and M14 (Walkthrough assignments) move a character. The Skills tab's "train" line never asks for a move (D-14).
- **Bubble, vial and Liquid Shop choices** (which bubble to level, what to buy): the proposed M19 Alchemy module. M20 owns only who sits on which cauldron.
- **Buildings, the build order and salts:** M15 F1–F2 (M6 folder). M20 owns the Cog Board, not the build slots.
- **What to print:** M14's printer Parallel Slot Plan.
- **Prayers** (slots, Unending Energy): M9 and M3. **Totem waves** (Tower Defence) are Active Play only (Phase 2 at the earliest).
- **Coins:** M7's Spend Plan prices nothing M20 suggests; M20's coin costs (Wax Skull, Cardboard Traps) are shop prices quoted in the line (FR-24, FR-26).
- **Navigation, the Systems hub, routes, "See it" links, the generic System page and the Timeline:** M17 (merged, [M17-views.md](M17-views.md)). M20 supplies data for M17's existing interfaces (TR-6), not pages of its own.
- **W4+ items** (Mutated Mush, W4 tasks, Sigils, Breeding), dungeons and Happy Hours (need a party), shop restock (a personal shopping list), boss-gem kills and minibosses: "Not covered yet" (M10 FR-26), revisited in Phase 2.

## 3. Functional requirements

### Facts settled for this spec (section 11.3)

- **F-a Three clocks.** (1) The **daily reset** is the account's `TimeAway.ShopRestock` countdown, anchored to account creation and moved by Pocketwatches. (2) The **account week** ends `ShopRestock + 86400 × OLA[39]` seconds after the save; it resets Killroy rooms and skulls, guild weeklies and the giant-mob count. (3) The **server week** starts Thursday 00:00 UTC (`⌊GlobalTime / 604800⌋`); it rolls the Weekly Battle boss. The **Bonus Ballot** rolls on its own server week, `⌊(GlobalTime + 197860) / 604800⌋`, Monday about 17:02 UTC. (4) The Pet Mart gems and the Pet Tournament follow a **server day** (`tournament.global.S` and `T`, the tournament day being the newer of `OLA[496]` and `T`); when it rolls is not mapped yet (V8). (Resets dossier, N.js daily loop @15114421 and the weekly block after it, H; Toolbox `Etc.jsx` L71–72.)
- **F-b What banks.** Keys and Colosseum tickets bank 3 days at their NPC. Minigame plays, the Random Event, vial attempts, the Pet Mart gems, Spiketrap gems, the Weekly Battle raid reset and daily tasks do not bank. Killroy skulls are **wiped** at the account weekly reset (wiki Killroy's Slaughterhouse, 2026-10-05: "When the challenge resets (weekly) your Skulls will also be reset").
- **F-c Killroy rooms.** Room 1 is open once the account reaches W2; room 2 once **World 3 is finished** (Toolbox's alert counts 2 rooms only after `finishedWorlds.World3`; wiki: "the 2nd unlocks at World 4"); room 3 only when room 2 is open and `OLA[227] == 1` (the 1% Skull Shop roll; N.js @4338065 checks it inside the room-2 branch, which reads the logged-in character's Frostbite Towndra portal; M20 uses `finishedWorlds.World3`, the account-level equivalent). `OLA[113]` is a per-digit code: entering room *r* adds `r·10^(r−1)`, and room *r* is done when the code's decimal string contains the digit *r* (N.js @4314131), so 1, 20, 21, 300, 301, 321 are all valid; Toolbox's skip list knows only 1, 21 and 321. Each room's class is Toolbox's `getKillRoyClasses` (seeded on the account week).
- **F-d Cog Board.** A square is open when `currentAmount ≥ requiredAmount` (the flag has finished; Toolbox's own rule in `getSmallCogUpgrades`). A player cog is in one of three places (Toolbox `construction.ts`: `SPARE_START_INDEX` 96): on the **board** (squares 0–95), on the **Cog Shelf** (save slots 96–107) or in the **cog inventory** (108–227). Toolbox's `totalBuildRate` sums the 96 board squares only, so only a seated character adds build rate (W3-early: 419 on the board against 702 summed over every player cog; wiki Construction: "Adding characters to the Cog Board is the only way to increase Build Rate before acquiring Cogs"). A character on the shelf is **not idle**: "Placing characters on the Cog Shelf will add the characters' production value towards making Cogs, and award the character the same amount of experience as if they were placed on the board" (wiki Construction). A character in the cog inventory earns nothing. W3-early: both Squires on the board, the Wizard 73, Bowman 60 and Barbarian 56 on the shelf, the Shaman 54 in the inventory.
- **F-e Worship.** Without a skull, max charge is 50 (both fixtures). The Wax Skull is sold by the Frostbite Towndra vendor for 5,000 coins and raises max charge to at least 100 (wiki Worship; Toolbox `getPlayerWorship` gives the exact value, and the skull's Speed also raises the charge rate). It sits in tool slot 5 (`tools[5]`, type `WORSHIP_SKULL`).
- **F-f Trapping.** "In order to start trapping, go to the Lord of the Hunt and start his quest line" (wiki Trapping). Quest 1, Pelt for the Pelt God, asks for 10 Shrapshell, 12 Snake Skin and 1 Cardboard Traps (consumed), bought from the town shop, and **rewards a Cardboard Traps set** and 2 Time Candy (generated `quests.acquisition.lord-of-the-hunt1`, Toolbox quests data; wiki Lord of the Hunt, 2026-09-27). Cardboard Traps are sold by the Frostbite Towndra vendor; a trap set sits in tool slot 4 (`TRAP_BOX_SET`); "each higher tier trap gives +1 more traps". M20 treats quest 1 as a **per-character** gate (in all 11 public saves every character with trap entries has `Lord_of_the_Hunt1 = 1`; V2 confirms from N.js).
- **F-g Cauldron seats.** `alchemy.activities[i]`: 0–3 the Power, Quicc, High-IQ and Kazam cauldrons, 4–7 the four liquids, ≥ 100 a sigil, −1 none. Liquids open at the account's highest Alchemy level 1 / 20 / 35 / 80. "Assigning a character will speed up liquid gain", and a liquid seat "gives that specific character 2x Alchemy xp compared to bubble cauldrons" (wiki Alchemy).
- **F-h Specialties.** The wiki Skills page (2025-06-29) gives one specialty class per skill: Mining Warrior, Smithing Archer, Choppin Mage, Fishing Barbarian, Alchemy Shaman, Catching Bowman, Trapping Hunter, Construction Squire, Worship Wizard. Game data agrees for the skill attacks (`talents.fact.skill-classes`: Big Pick on the Warrior line, Worming Undercover on the Barbarian line, Log On Logs on the Mage line). A class line with two specialties (the Squire: Construction as a subclass, Mining as a Warrior) takes the subclass one first, skipping a skill whose System is not open yet.

### F1 Daily & Weekly Checklist

**The rows**

- **FR-1 One registry.** The checklist is built from one authored fact table, `checklist.fact.rows` (TR-3). Each row names: an id, a band (`no-bank`, `banks`, `weekly`), its clock (`daily`, `account-week`, `server-week`, `ballot-week`, `own-timer`), its unlock gate, the state Detector that reads it, the entries whose Goals it links (FR-8), its effort in seconds, and its Sources. A module that adds a reset item adds its row here, in its own PR; the checklist has no hard-coded rows.
- **FR-2 Phase 1 rows.** The table ships with these rows (gates in brackets; M6 rows read M6's existing Account State fields, M20 rows read TR-2's):

  | Band | Row | Gate | Done when (from the save) | Owner of its Goal |
  |---|---|---|---|---|
  | no-bank | Free pet pull | pets data known | `freeClaimAnchor + 594,000,000 ms > now` | M6 `pets.check.free-pull` |
  | no-bank | Pet Mart free gems | as M6 FR-13 | `OLA[516] == shop day` (server day) | M6 `pets.check.mart-gems` |
  | no-bank | Pet Tournament registration | 1+ pet owned | `OLA[511] > tournament day` (registering sets it to day + 1, N.js @13333782; Toolbox's `tournamentRegister` alert); `waiting` while registration is closed (`isTournamentRegisterationClosed`) | none (row only) |
  | no-bank | Random Event | always (W1 maps) | `OLA[137] == 1` | M20 `random-events.check.today` |
  | no-bank | Skill minigame plays | W1 | plays left `== 0` | M6 `minigames.check.daily-plays` |
  | no-bank | Spiketrap gems | W1 | `OLA[7] == 0` | M6 `minigames.check.spiketrap` |
  | no-bank | Vial attempts | W2-early | attempts left `== 0` (`cannot` when no ingredient is held, M6's `vialAttemptsUsable`) | M6 `alchemy-vials.check.daily-attempts` |
  | no-bank | Post Office orders | Post Office unlocked | every company has an order done today | M6 `post-office.check.daily-orders` |
  | no-bank | Daily tasks (one row, a detail per world) | that world's Task Board unlocked | `Tasks[1][w][8] ≥ 1` per unlocked world | none (row only) |
  | no-bank | Guild daily tasks | guild member | the player ticks it (D-6) | none (row only) |
  | banks | Boss keys (a detail per key type) | `amountPerDay > 0` | `daysSincePickup == 0` for each | M6 `boss-keys.check.collect` |
  | banks | Colosseum tickets (a detail per NPC) | reachable NPC (M6 FR-8) | `daysSincePickup == 0` for each | M6 `colosseum.check.collect-tickets` |
  | weekly | Killroy's rooms | W2 reached | rooms-done code covers every open room (F-c) | M20 `killroy.check.room` (Active Play) |
  | weekly | Killroy skulls | skulls `> 0` on any save this account week | skulls `== 0` (the row stays, `done`, until the week ends) | M20 `killroy.check.skulls` |
  | weekly | Weekly Battle | W2 reached | **done for the week** once `OLA[189] ≥ 1` this server week (a new best pays trophies; the detail keeps "best 2 of 5 · try again after your daily reset" while below 5) | M20 `weekly-battles.check.raid` (Active Play) |
  | weekly | Bonus Ballot vote | W2 reached | `OLA[309] ==` this ballot week | none (row only) |
  | weekly | Guild weekly tasks | guild member | the player ticks it (D-6) | none (row only) |

- **FR-3 Reset projection.** Every row is judged at `now`, not at the save. For each clock M20 computes the current period's end: the daily reset as M6 TR-6 (`dailyResetAfter(state, now)`, 24 h steps); the account week as the first weekly end `lastCloudSave + (ShopRestock + 86400 × OLA[39]) s`, rolled forward in 7-day steps; the server and ballot weeks from `now` alone (F-a). The server-day rows (Pet Mart, Pet Tournament) have `periodEnd` null until V8 maps the roll: they are never "reset since your last save" and never lost before return. If a row's clock has rolled over since the save, the row is `todo` again whatever the save says ("reset since your last save"), and its counters read as refilled exactly as M6 TR-6 treats them. Two `ShopRestock` readings within 1 h of each other are the same reset (Toolbox notes a few seconds' drift between saves).
- **FR-4 Row states.** Each row is one of:
  - `done` for this period;
  - `todo`: doable now;
  - `waiting`: belongs to this period but is not doable yet (the pet pull's timer, a Random Event that has not started), with the time it becomes doable;
  - `cannot`: open but impossible on this account (a Killroy room for a class no character has), with the reason; never counted;
  - `unknown`: a field it reads is unknown (M1 `isKnown`); never counted, never guessed.
  A row whose unlock gate is closed is not shown in the list; it appears as one "Opens later" line per band with the unlock ("Weekly Battle: reach World 2"). A row whose gate is a quantity (no skulls held, a key type nobody earns) is simply left out.
- **FR-5 Details.** A row that groups several items (keys, tickets, daily tasks) has one detail line per item ("Typhoon: 4 days banked, 1 lost"); its state is the worst of its items (`todo` before `waiting` before `done`).
- **FR-6 Rings.** The **today ring** counts `no-bank` and `banks` rows; the **week ring** counts `weekly` rows. Each ring is `done / (done + todo + waiting)`. `cannot`, `unknown` and gated rows are left out, so the ring never shows a row the player cannot finish. Both rings carry their text equivalent ("Today: 1 of 11 · Week: 2 of 5"). The week ring mixes three weekly clocks (account, server, ballot), so it can partly refill mid-week; its "why" says so and each weekly row names its own clock (FR-13).
- **FR-7 Lost before you're back.** A `todo` row is **lost before return** when its period ends before `now + Expected Return` (for `banks` rows, when M6's `lostByReturn > 0`). Such rows show the reset time in the warning style, and the section opens expanded (FR-12).

**Links, Goals and noise**

- **FR-8 Links, never duplicates.** A row never repeats a Next Action shown elsewhere. When the engine's merged result has a Goal or Active Play entry for one of the row's linked entries (FR-1), the row links to it by its Next Action key ("in your list ↓", "If you have time ↓"). Otherwise the row shows its own one-line instruction from its entry's text (`nextAction`), with its Source. A row may also link its Systems page (TR-6).
- **FR-9 Which M20 rows make Now Goals (D-4).**
  - `random-events.check.today`: a Goal only while an event is live now or starts within 20 minutes, and today's event is not done; `nice`, by urgency (as Spiketrap). The Next Action names the map and the event from Toolbox's schedule (TR-2). The schedule is filtered to events whose maps the account can reach (Glacial Guild spawns only on W3 maps, so it needs `currentWorld ≥ 3`). The row is `todo` only while an event is live; otherwise `waiting` with the next reachable event's time and map.
  - `killroy.check.skulls`: a Goal only when the account week ends before `now + Expected Return` (`lost-before-return`, position 1 by urgency); otherwise the row only.
  - `killroy.check.room` and `weekly-battles.check.raid`: never Goals; "If you have time" Active Play entries while not done this week, with their effort.
  - Ballot, Pet Tournament, daily tasks and guild tasks: row only, never a Goal.
- **FR-10 Killroy rooms.** For each open room not done this week, the row names the room's class and the character to run it: the highest-level character whose class line holds that class (Beginner rooms: a Beginner or Journeyman line), except M2's pusher unless it is the only one; ties to the lower index. After a projected week rollover (FR-3) the classes are next week's (TR-2 keeps both). No such character: the room is `cannot` ("no Mage on your account"). The Active Play entry reads "Run Killroy's Warrior room on your Squire Lv 43 (YumYum Grotto, about 2 min)".
- **FR-11 Killroy skulls.** "Spend N Killroy skulls at Killroy's Skull Shop: Arcade ball packs first (4 skulls for 10 balls, up to 50 buys a week)", with the account-week reset time. Arcade packs left this week = `50 − OLA[417]`; when that is 0 the line drops the pack advice.
- **FR-12 The Now section.** The checklist renders at the top of the Account section, below the account blockers and above the account Goals: one line with both rings, the daily-reset time ("daily reset in 12 h") and a toggle. Collapsed by default; expanded by default when any row is lost before return. Expanded, it shows the three bands in order (no-bank, banks, weekly), `todo` rows first, then `waiting`, then `done` rows folded into "N done · show". Each row shows its state glyph and word (never colour alone), label, detail, effort ("about 1 min") and link.
- **FR-13 Clock labels.** Each weekly row says which clock it follows, in plain words: "your weekly reset in 37 h" (account week), "new boss Thursday 00:00 UTC, in 4 days" (server week), "new ballot Monday about 17:00 UTC" (ballot week). Times show in the player's local time with the UTC anchor in "why".
- **FR-14 Done from the save, and when.** Done comes only from a save field (FR-2), never from "the Goal stopped firing" (M6 FR-29). With history, a row that is `done` shows when: the first save in this period whose field shows it done ("done at 14:20"). In paste mode there is no "done at".
- **FR-15 Manual rows (D-6).** A row the save cannot judge (guild tasks: Toolbox drops the claimed flag) offers a **Done** tick instead of a state. The tick lasts until the row's period ends and is stored in M10's preferences under `checklist@<accountKey>@<rowId>@<periodIndex>`: `accountKey` is the hashed account id M10 already keys preferences by, and `periodIndex` an integer per clock (the reset ordinal `⌊(periodEnd − anchor) / period⌋` with the 1 h drift tolerance, the week number), never milliseconds. So it survives drift between saves, clears itself at the reset and never leaks into the next period. The row shows the save's own progress as a hint ("2 of 5 met").
- **FR-16 Weekly Battle and Ballot details.** The Weekly Battle row shows "best this week: difficulty 2 of 5" (`OLA[189]`, read as 0 when the save's server week `OLA[191]` is an older week). The Ballot row shows the current winner's bonus in words and, when that bonus is for a world the account has not reached, says "you get 1.25× damage instead" (wiki Bonus Ballot); it never advises how to vote.

### F2 Parallel Slots

- **FR-17 Slot facts.** For every character M20 reads (TR-2): its Cog Board square or shelf, its Toolbox `constructionSpeed` and `constructionExpPerHour`, its skull, its trap set, whether its Lord of the Hunt quest 1 is done, and its cauldron seat; for the account, the Cog Board's 96 squares, the four liquids with their caps, and the printer facts M14 already reads.
- **FR-18 Slot pips.** Each character gets one pip per Parallel Slot that is open on the account, with a state: `filled`, `fillable` (empty, and the player can fill it now), `unfillable` (empty, but it needs something first: a quest, a trap set, a free square), `capped` (worship charge at max), `locked` (the System is not open yet: "Opens in W3") or `unknown`. The cog pip is `filled` on the board ("builds") and on the shelf ("makes cogs"), `fillable` in the cog inventory (F-d). The worship pip is `capped` or `filled` (charge always accrues); a missing skull is said in its text ("no skull (max 50)"). The cauldron pip reads M3's facts; the printer pip reads M14's (`filled` when an active sample prints, `fillable` for M3's blank sample, `unfillable` past the printer's level).
- **FR-19 Stage gates.** The Cog Board, worship, traps and skulls are judged from Stage W3-early (World 2 finished), as M3 gates them; cauldron seats from W2-early. A W2 account shows these pips as `locked` and gets no slot Goal.

**Cog Board seat** (`construction.check.cog-seat-free`, taken over from M3 FR-27, D-9)

- **FR-20** One account Goal with up to two kinds of item, idle first:
  - **(a) A character in the cog inventory** earns nothing (F-d): "Put your Shaman Lv 54 on the Cog Shelf (Construction screen, W3 town): it makes cogs and earns Construction EXP there". Every inventory character is one detail; the shelf holds 12 (F-d).
  - **(b) A free open board square**: for each, the character not on the board with, in order, an active `construction-builder` Role (M2); then the largest Toolbox `constructionSpeed`; then the larger `constructionExpPerHour`; then the lower index. Inventory and shelf characters both qualify. "Seat your Wizard Lv 73 on the free Cog Board square". Why: "On the board it adds build rate for your buildings; on the shelf it makes cogs instead. Both earn the same Construction EXP." No build-rate number is quoted (ADR 0005: the board total with boosts is Toolbox's `evaluateBoard`, which M20 does not re-run per candidate in Phase 1).
  The Next Action is the first (a) item, else the first (b) item; the rest are details. Both keep the character's AFK Target.
- **FR-21** When nothing is in the inventory and the board has no free open square, M20 shows no Goal; the Cog Board page says "Board full: place a flag to open more squares" (Phase 2 adds swaps, F4).

**Worship** (`worship.check.no-skull`)

- **FR-22** Fires when the Frostbite Towndra vendor is reachable (`currentWorld ≥ 3`) and at least one character has no skull. One account line (#70 A5): "Buy a Wax Skull for each of 6 characters at the Frostbite Towndra shop (5,000 coins each) and put it in the skull slot". Why: "Without a skull, charge stops at 50; a Wax Skull raises it to 100." Details list the characters, those at the charge cap first. The line names the buyer: the character with the most coins in its own wallet, as M7 does (a skull bought by one character can be moved through storage); when that wallet is below the total, "your Squire Lv 85 has coins for 4 of 6 now".
- **FR-23** Where charge is spent is part of the Worship page, not a Goal: per character, the totem with the highest Toolbox `expReward` among those whose Worship level requirement the character meets ("spend at Goblin Gorefest, Forest Outskirts"). A totem with no wave yet (`maxWave == 0`) is never named; pushing waves is Tower Defence, Active Play only (out of scope).

**Trapping** (`trapping.check.start`, `trapping.check.no-trap-set`)

- **FR-24 Start.** From Stage W3-early, when no character has finished Lord of the Hunt quest 1: "Start Trapping: do Lord of the Hunt's first quest, Pelt for the Pelt God, on any character". It opts into M14's quest Walkthrough (like `post-office.check.unlock`), so the Goal card carries the steps, holdings and Supplies. The character M14's planner names does it; M20 picks none of its own.
- **FR-25 Trap sets.** For characters that have finished quest 1 and have no trap set equipped: one account line, "Equip Cardboard Traps on N characters", with details per character: "equip the Cardboard Traps the quest gave" when that character holds a set (`holdingsOf`), else "buy them at the Frostbite Towndra shop". When some characters have finished quest 1 and others have not, a second detail says "N more characters need Lord of the Hunt's first quest before they can trap".
- **FR-26** M20 never says how many traps to place or for how long: that is M3's `trapping.check.slots-and-timers` (branch (i), wired once `trapping.fact.trap-set-capacity` exists, which M20 ships, request X3).

**Cauldron seats** (`alchemy.check.liquid-unstaffed`)

- **FR-27** Fires when a liquid is unlocked (F-g), holds below half its cap, and nobody is assigned to it, and some bubble cauldron has 2 or more brewers. It names one brewer to move: across every cauldron that has the most brewers, the one with the lowest Alchemy level that does not hold the `alchemy` Role (the Shaman line brews); ties to the lower cauldron index, then the lower character index. Next Action: "Move your Squire Lv 85 from the Power cauldron to Liquid Nitrogen". Why: "Nitrogen is at 0 of 13 with nobody on it; a liquid seat speeds it up and earns that character 2× Alchemy EXP, and the Power cauldron keeps its other brewer." Category `nice`, confidence M. It fires for at most one liquid (the lowest-numbered) per run.
- **FR-28** An unassigned character stays M3's blocker (`alchemy.check.cauldron-unassigned`); M20 adds nothing for it. When M19 publishes bubble targets, FR-27 yields to M19's plan (section 7, X6).

**All slot Goals**

- **FR-29 Position and cap (D-10).** Every slot Goal sits at position 3g (`metapath.priority.free-value-fills`), category `compounding` (the liquid move `nice`). At most **2** slot Goals show in the Account section at once, chosen by `slots.priority.fill-order` (cog seat, skulls, trapping start, trap sets, liquid); the second carries the others as "Also free: …" details. M14's printer Goal is separate and does not count.
- **FR-30 Done.** Each slot Goal is done on a later save when its field changes: the named character is seated; a character that was named wears a skull; quest 1 is done on some character; a named character has a trap set; the named brewer sits on the liquid. Anything else (the board filling another way, a reset) drops it silently (M6 FR-29).
- **FR-31 Skill Grid.** For a `skills` overview section in M17's Characters place (`#skills`, beside `#builds` and `#cards`), M20 builds one matrix: rows are characters, columns the 9 W1–W3 skills (level, account best marked, specialty marked, AFK Target marked) and the slot pips (FR-18). Exactly one cell is highlighted: the target of the top-ranked M20 Goal, if any.
- **FR-32 System page bodies.** M20 provides the dedicated body (M17 FR-23a) of four game System pages: `construction` (the **Cog Board**: squares, characters on the board, shelf and inventory, free squares, build and EXP rate, the best constructor's next cog tier), `worship` (charge tanks with time to full and skull; totems with level requirements and best wave), `trapping` (per character: quest 1 done, trap set, placed traps ending against the return time) and `alchemy` (**Cauldron seats**: each station's brewers, the liquids against their caps, unassigned characters). M17's generic header, Next Actions, "How it opens", Coverage and Sources stay around each body; M20 adds no status, Next Action list or unlock text of its own. The Daily & Weekly Checklist's home is its Now section (FR-12), as the Spend Plan's is.

### F3 Skills tab

- **FR-33 Where.** A **Skills** tab on the character page (`apps/activeon/src/now/character-tabs.ts`), deep link `#skills-<index>`, reading `view.skills`.
- **FR-34 Rows.** One row per W1–W3 skill, in game order (Mining, Smithing, Choppin, Fishing, Alchemy, Catching, Trapping, Construction, Worship): the level, progress to the next level (`exp / expReq`), efficiency where Toolbox computes it (Mining, Choppin, Fishing, Catching), and the account's best level of that skill with "your best" when it is this character. A skill whose System is not open yet is dimmed with its unlock ("Opens in W3: finish World 2").
- **FR-35 Role and specialty.** A row carries a **Role** badge when one of the character's active M2 Roles owns that skill (M2 roles' `owns`: `FISHING`, `CATCHING`, `CHOPPIN`, `parallel:cog`, `parallel:worship`, `parallel:cauldron`, `parallel:trap`, plus `archer-smithing` for Smithing; `parallel:printer` has no skill row and shows on the printer pip), a dormant Role as "Role from W3", and a **specialty** mark from `skills.fact.specialty` (F-h) when the class line specialises in it without a Role (Mining on the Warrior line).
- **FR-36 Next gate.** Each row shows the next level that opens something, from `skills.fact.gates` and M4's generated door and tool facts: Mining and Fishing doors, the next tool tier, Anvil tabs (Smithing 15, 35, 50, 65), cog tiers (Construction 15, 40, 70), totems (Worship 10, 30, 40), liquids (Alchemy 20, 35, 80, judged on the account's best) and trap boxes (Trapping 5, 15, 20, 30, 40, 48). It says how many levels are left and whether the gate is this character's or the account's.
- **FR-37 Train for its Role.** The tab's header has one line, "Train: <skill>", picked in this order: (1) an active Role skill whose slot pip is `fillable` or `capped` (it names that slot's Goal or pill: "Construction: seat it on the Cog Board"); (2) the first active Role skill in M2's Role order for the class line; (3) the specialty skill (`skills.fact.specialty`), marked "specialty", when no active Role has a skill (a Squire whose Construction Role is still dormant); (4) no line. The verb depends on what the character does now: a Parallel Slot skill reads "Train: Construction · trains while it sits on the Cog Board" (or names the slot's fix); an AFK-Target skill reads "Train: Fishing · trains while AFK on Fishing" **only when that is its current AFK Target**; otherwise it reads "Role skill: Fishing · it's fighting now" and links M5's Higher-leverage line if one exists. It never asks for a move itself (D-14). Roles without a skill (`pusher`, `pusher-candidate`, `afk-fighting`, `refinery-throttle`, `prayer-slots`, `printer-go-brrr`) are skipped.
- **FR-38 Slots on the tab.** Below the rows, the character's slot pips (FR-18), each with its one-line state and a link to the Goal or page that fills it.

### All features

- **FR-39 Determinism.** Same Account State, history, Knowledge Base, Expected Return and `now` give byte-identical checklist, slot Goals, page sections and Skills tabs.
- **FR-40 Fail closed.** A row, pip or Goal that reads an unknown field shows `unknown` with a diagnostic (M11); nothing is ticked done from an unknown. `EmptyAccountError` produces none of M20's output.
- **FR-41 Sources.** Every entry and row carries the IdleOn Wiki page that covers it (tier 2, opened 2026-10-18, section 11.3) plus its tier-1 provenance (N.js via the resets dossier, or Toolbox at the pin). Toolbox numbers render as "Calculated by IdleOn Toolbox · 2.3.540".
- **FR-42 Stage Expectations (M15 F5).** M20 adds two rows to `metapath.metapath.stage-expectations`: "no free open Cog Board square left by W3-mid" (fix: `construction.check.cog-seat-free`) and "a skull on every character by W3-mid" (fix: `worship.check.no-skull`).

## 4. User stories

**US-1. One place for my daily items.** As a player in a Play Session, I want every daily and weekly item in one list with its reset time, so that I don't lose the ones that don't bank.
- **Given** the W3-early account at the golden clock **When** the engine runs **Then** the checklist shows a today ring of **1 of 11** (vial attempts done; the Pet Tournament is not registered, `OLA[511]` 241 is not above day 241) and a week ring of **2 of 5** (Killroy's room and the Ballot done), and says "daily reset in 13 h".
- **Given** the W2-late account at the golden clock **When** the engine runs **Then** the today ring reads **0 of 10** and the week ring **0 of 3** (Killroy's Warrior room, Weekly Battle, Ballot); Post Office orders, guild rows, Efaunt keys and Lonely Hunter tickets are not listed (not open on this account).

**US-2. No reset surprises.** As a player, I want rows to reset on the game's clock even before the next save, so that the list is never stale.
- **Given** the W3-early account **When** `now` is the save + 13 h (past the daily reset, before the account week ends) **Then** vial attempts read `todo` with "reset since your last save", the Pet Tournament and Pet Mart rows are unchanged (server day, V8), the week ring still counts Killroy's room as done, and the Ballot is unchanged.
- **Given** the W3-early account **When** `now` is the save + 37 h **Then** Killroy's room is `todo` again, named with next week's class (FR-10), and the skulls row is gone (a new week, and skulls are wiped, F-b); the daily rows have reset twice.

**US-3. Don't lose skulls.** As a player, I want to be told to spend Killroy skulls only when they would be wiped while I'm away.
- **Given** the W3-early account (6 skulls, account week ends in about 37 h) and an 8 h Expected Return **When** the engine runs **Then** there is no skull Goal; the skulls row reads "Spend 6 Killroy skulls · your weekly reset in 37 h".
- **Given** the same account with a 2-day Expected Return **When** the engine runs **Then** the Account section shows the Goal "Spend 6 Killroy skulls at Killroy's Skull Shop: Arcade ball packs first", at position 1, and the checklist opens expanded with the row linking to it.

**US-4. Who runs Killroy.** As a player, I want to know which character can run this week's Killroy room.
- **Given** the W2-late account (1 room open, class Warrior, never run) **When** the engine runs **Then** "If you have time" lists "Run Killroy's Warrior room on your Squire Lv 43 (YumYum Grotto, about 2 min)" (the Barbarian Lv 60 is the pusher, D-20), and the checklist row links to it.
- **Given** a mutation where that week's room class is Archer and no Archer-line character exists **Then** the row reads `cannot` ("no Archer on your account"), no Active Play entry shows, and the week ring's total drops by one.

**US-5. Seat the right character.** As a player in a Play Session, I want no character idle on the Construction screen and the free board square filled by the one who builds most.
- **Given** the W3-early account (23 open squares, 1 free; both Squires on the board; the Wizard 73, Bowman 60 and Barbarian 56 on the shelf; the Shaman 54 in the cog inventory) **When** the engine runs **Then** the Account section shows "Put your Shaman Lv 54 on the Cog Shelf" at position 3g with the detail "Seat your Wizard Lv 73 on the free Cog Board square" (Toolbox build speed 111.17 ties exactly with the Bowman 60 and Barbarian 56; the Wizard's Construction EXP 82.34/h is the highest), and no blocker.
- **Given** a later save with the Shaman on the shelf and the Wizard on the board **When** the engine runs **Then** the Goal is done, and no seat Goal shows.
- **Given** the W2-late account **When** the engine runs **Then** no Cog Board Goal exists and every character's cog pip is `locked` ("Opens in W3").

**US-6. Skulls for everyone.** As a player, I want one line for worship skulls, not six.
- **Given** the W3-early account (no skulls; coins well above 30,000) **When** the engine runs **Then** one account Goal reads "Buy a Wax Skull for each of 6 characters at the Frostbite Towndra shop (5,000 coins each)", details listing the four characters at 50/50 charge first, and the per-character worship pills (M3) are unchanged.

**US-7. Start Trapping.** As a player, I want to be told how to start a System none of my characters can use yet.
- **Given** the W3-early account (no character has Lord of the Hunt quest 1 done) **When** the engine runs **Then** "Start Trapping: do Lord of the Hunt's first quest, Pelt for the Pelt God, on any character" exists with M14's Walkthrough; because of FR-29's cap it shows as an "Also free" detail under the skull Goal; every trap pip is `unfillable` ("needs Lord of the Hunt's quest").
- **Given** a mutation where the Barbarian Lv 56 has quest 1 done and no trap set **Then** `trapping.check.no-trap-set` names that character, and the start Goal is gone.

**US-8. An idle liquid.** As a player, I want to know when a liquid nobody tends could earn more.
- **Given** the W3-early account (Liquid Nitrogen 0.08 of 13, nobody on it; Power and High-IQ cauldrons each have 2 brewers) **When** the engine runs **Then** `alchemy.check.liquid-unstaffed` fires naming the Squire Lv 85 (Alchemy 19: the lowest non-Shaman brewer across the two tied 2-brewer cauldrons, Power and High-IQ), shown as an "Also free" detail (FR-29).
- **Given** the W2-late account (Liquid Nitrogen locked: best Alchemy 13) **Then** it does not fire.

**US-9. Skills for a Role.** As a player, I want each character's skills next to what it is for.
- **Given** the W3-early account **When** the player opens the Squire Lv 85's Skills tab **Then** Construction 11 carries the Role badge, its next gate reads "Decent cogs at Construction 15 (4 levels)", Mining 7 carries the specialty mark, and the header reads "Train: Construction · trains while it sits on the Cog Board".
- **Given** the W3-early Wizard Lv 73's tab **Then** the header reads "Train: Worship · trains as it spends charge" (its first active Role skill; Worship 16 is the account's best; next totem Acorn Assault at Worship 30). It holds no Construction Role, so the seat does not set the header; the Construction row's cog pip (`filled`, "on the shelf: makes cogs") links the seat detail instead.
- **Given** the W3-early Bowman Lv 60's tab (AFK fighting) **Then** the header reads "Role skill: Catching · it's fighting now", never "Train" (FR-37).
- **Given** the W2-late Squire Lv 43's tab **Then** the header reads "Train: Mining (specialty) · trains while AFK on Mining" (its only active Role, `pusher-candidate`, has no skill), Mining 20 shows "Ol' Straightaway at Mining 25 (5 levels)", and the Construction row reads "Role from W3", dimmed "Opens in W3".

**US-10. A Random Event while I play.** As a player, I want to hear about a Random Event only when I can still do it.
- **Given** the W3-early account (today's event not done) and a `now` when Toolbox's schedule has an event live **When** the engine runs **Then** the Account section shows "Random Event now on <map> (<event>): one a day", `nice`, and the checklist row links to it. **Given** a `now` with the next event 3 h away **Then** there is no Goal and the row reads `waiting` with the time and map.

## 5. Technical requirements

### TR-1 Package boundaries
Engine logic is pure (no I/O, clock or randomness) in `packages/engine/src/checklist/` (`clocks.ts`, `rows.ts`, `module.ts`) and `packages/engine/src/slots/` (`facts.ts`, `seat.ts`, `skulls.ts`, `traps.ts`, `cauldrons.ts`, `grid.ts`, `sections.ts`, `skills.ts`, `module.ts`). One engine module, `slots-checklist`, registered with `after: true` (M14 TR-1), so it reads the merged Goals and Active Play of the other modules to link rows (FR-8). It imports types from `@idleon-forge/account-state`, compiled entries from `@idleon-forge/knowledge`, `MetaPathResult` from M2 and the time helpers of M6 (`unspent-time.ts`). The adapter part lives in `packages/account-state/src/slots.ts` with its types in `slots-types.ts`; Toolbox calls (`getKillRoyClasses`, `getRandomEvents`) run in the worker by injection, as M2's frontier does. The UI never imports `toolbox-parsers`.

### TR-2 Account State additions (M1 TR-11 growth; every field null when its section fails)
```ts
export type SkillId = 'mining' | 'smithing' | 'chopping' | 'fishing' | 'alchemy'
  | 'catching' | 'trapping' | 'construction' | 'worship';

// CharacterState
skills?: Partial<Record<SkillId, { level: number; exp: number; expReq: number }>> | null; // skillsInfo.<skill>
slots?: null | {
  cogPlace: null | { kind: 'board' | 'shelf' | 'inventory'; slot: number }; // F-d; null when it has no player cog
  constructionSpeed: number | null;    // Toolbox character constructionSpeed (build rate/h it adds)
  constructionExpPerHour: number | null;
  skull: string | null;                // tools[5].rawName, null when "Blank"
  trapSet: string | null;              // tools[4].rawName, null when "Blank"
  trappingStarted: boolean | null;     // questComplete.Lord_of_the_Hunt1 === 1
  cauldron: number | null;             // alchemy.activities[i].activity (F-g); null when unknown
};

// AccountSummary
cogBoard?: null | {
  squares: Array<'locked' | 'open' | 'cog' | 'character'>; // 96, game order, 12 × 8
  characterAt: Array<{ square: number; index: number }>;   // player cogs mapped to character index
  buildRate: number; expRate: number; flaggyRate: number;  // Toolbox totals
};
liquids?: null | Array<{ index: 0 | 1 | 2 | 3; unlocked: boolean; current: number; max: number }>;
resets?: null | {
  weeklyOffsetDays: number | null;     // OLA[39]
  serverWeekOfSave: number | null;     // OLA[191]
};
killroy?: null | {
  roomsOpen: 1 | 2 | 3;                // F-c
  doneCode: number;                    // OLA[113], per-digit (F-c)
  roomClasses: [this: KillroyClass[], next: KillroyClass[]]; // getKillroySchedule iterations 0 and 1, ignoreSkip (FR-10)
  skulls: number;                      // OLA[105]
  arcadePacksBought: number;           // OLA[417]
};
weeklyBattle?: null | { bestDifficulty: number; raidResetUsedToday: boolean }; // OLA[189], OLA[190]
ballot?: null | {
  votedWeek: number;                   // OLA[309]
  winner: null | { index: number; percent: number; worldGated: boolean }; // voteBallot.selectedBonus
};
randomEvents?: null | {
  doneToday: boolean;                  // OLA[137] === 1
  schedule: Array<{ at: number; map: string; event: string }>; // getRandomEvents, next 48 h only
};
petTournament?: null | { registeredThroughDay: number; day: number; registrationClosed: boolean; petsOwned: number }; // OLA[511], max(OLA[496], global.T)
taskBoardDailies?: null | Array<{ world: 1 | 2 | 3; unlocked: boolean; taskName: string; done: boolean }>;
guildTasks?: null | {                  // only when the account is in a guild (guild.id present)
  daily: Array<{ met: boolean }>; weekly: Array<{ met: boolean }>;
};
```
`skills` supersedes M14's `skillLevels` for new readers; M14's field stays (it is read today) and the adapter fills both from the same source. **Privacy:** Toolbox's player-cog names embed character names; the adapter matches them to slots inside the worker and keeps indices only. The guild name (`OLA[37]`), guild members, the tournament `playerName` and leaderboard are never read into the Account State. About 3 KB added on the W3-early fixture.

### TR-3 Fact tables (ADR 0007)
| id | Origin | Contents | Source |
|---|---|---|---|
| `checklist.fact.rows` | authored | FR-1's fields per row (17 Phase 1 rows) | wiki Daily Checklist (2026-03-24, tier 4) plus each row's own wiki page; resets dossier (tier 1 via N.js) |
| `checklist.fact.clocks` | authored tier 1 | the weekly offset index (`OLA[39]`), the server week length and epoch (Thursday 00:00 UTC), the ballot offset 197,860 s, the 1 h drift tolerance | resets dossier (N.js @15114421, @≈11766234) |
| `skills.fact.specialty` | authored | F-h's skill → class line table | wiki Skills (2025-06-29); `talents.fact.skill-classes` (generated) |
| `skills.fact.gates` | authored, CI-checked | per skill: level, label, scope (`character` or `account`) for Anvil tabs, cog tiers, totems, liquids and trap boxes. Mining and Fishing doors and tool tiers come from M4's generated `skill-doors` and `tools` facts | wiki Construction (2026-10-07), Worship, Alchemy, Trapping, Smithing; Toolbox `getTotems().skillReq` and items `lvReqToEquip` (CI: totem and trap-box levels equal Toolbox at the pin) |
| `trapping.fact.trap-set-capacity` | authored tier 1 (the items data has no capacity field, so M3 FR-21's "generated" is superseded) | traps allowed per `TrapBoxSet<n>` | N.js (V3); wiki Trapping ("each higher tier trap gives +1") |
| `worship.fact.skulls` | generated from items data, price authored | skull rawNames, `lvReqToEquip`, the Wax Skull's vendor and price | wiki Worship (5,000 coins); Toolbox `items.json` |

### TR-4 Entries (#11 shape; **A** authored)
| Entry id | Type | Detector | Position | Notes |
|---|---|---|---|---|
| `random-events.check.today` | check | `random-events/today` | 1 by urgency (`nice`) | FR-9; `effortSeconds` 180 |
| `killroy.check.room` | check (`activePlay: true`) | `killroy/rooms` | "If you have time" | FR-10; 120 s per room |
| `killroy.check.skulls` | check | `killroy/skulls` | 1 by urgency | FR-11; `spendable`; 90 s |
| `weekly-battles.check.raid` | check (`activePlay: true`) | `weekly-battles/raid` | "If you have time" | FR-16; 60 s per character (one turn each) |
| `ballot.check.vote`, `pet-tournament.check.register`, `task-board.check.daily`, `guild.check.daily`, `guild.check.weekly` | check (`surface: checklist`) | `checklist/rows` | none (row only) | FR-9; needs M11's `surface` field (X1) |
| `construction.check.cog-seat-free` | check | `construction/cog-seat-free` | 3g | FR-20; moved from M3; 30 s |
| `worship.check.no-skull` | check (account, details) | `worship/no-skull` | 3g | FR-22; 120 s |
| `trapping.check.start` | check (account, Walkthrough opt-in) | `trapping/start` | 3g | FR-24 |
| `trapping.check.no-trap-set` | check (account, details) | `trapping/no-trap-set` | 3g | FR-25; 120 s |
| `alchemy.check.liquid-unstaffed` | check | `alchemy/liquid-unstaffed` | 3g (`nice`, M) | FR-27; 30 s |
| `slots.priority.fill-order` | priority (`list: order`) | — | — | FR-29's cap order |
| `checklist/rows`, `slots/overview`, `skills/overview` | engine Detectors | — | — | rows, Skill Grid and sections, Skills tabs |

Every template uses lookups (class, map, item, skill), never free-text slots (M11 FR-27). The M6 rows link M6's entries; M20 never runs or copies M6's Detectors.

### TR-5 Engine output (M10 TR-2 additions, plain data)
```ts
export type RowState = 'done' | 'todo' | 'waiting' | 'cannot' | 'unknown';
export type ResetClock = 'daily' | 'account-week' | 'server-week' | 'ballot-week' | 'own-timer';

export interface ChecklistRow {
  id: string;                          // row id from checklist.fact.rows
  band: 'no-bank' | 'banks' | 'weekly';
  clock: ResetClock;
  label: string;
  state: RowState;
  details: string[];                   // FR-5, rendered from the entry's templates
  periodEnd: number | null;            // end of the period this state is for (FR-3)
  availableAt: number | null;          // `waiting` only
  lostBeforeReturn: boolean;           // FR-7
  resetSinceSave: boolean;             // FR-3
  effortSeconds: number;
  doneAt: number | null;               // FR-14
  manual: null | { key: string; hint: string }; // FR-15
  link: null | { kind: 'goal' | 'active-play'; key: string };
  nextAction: string | null;           // FR-8, when no link
  sources: SourceRef[];
}

export interface Checklist {
  clocks: { daily: number | null; accountWeek: number | null; serverWeek: number; ballotWeek: number };
  rings: { today: { done: number; total: number }; week: { done: number; total: number } };
  rows: ChecklistRow[];                // band order, then todo, waiting, done
  gated: Array<{ band: ChecklistRow['band']; text: string }>; // FR-4 "Opens later"
  expanded: boolean;                   // FR-12 default
}

export type SlotKind = 'cog' | 'worship' | 'trap' | 'cauldron' | 'printer';
export type SlotState = 'filled' | 'fillable' | 'unfillable' | 'capped' | 'locked' | 'unknown';
export interface SlotPip { kind: SlotKind; state: SlotState; text: string; linkKey: string | null }

export interface CharacterSkills {
  index: number;
  rows: Array<{
    skill: SkillId; level: number | null; progress: number | null; efficiency: number | null;
    accountBest: { level: number; index: number } | null;
    role: null | { id: string; active: boolean }; specialty: boolean;
    locked: null | { text: string };
    nextGate: null | { label: string; atLevel: number; levelsLeft: number; scope: 'character' | 'account' };
  }>;
  train: null | { skill: SkillId; text: string; via: 'parallel-slot' | 'afk-target'; linkKey: string | null };
  slots: SlotPip[];
}

// EngineResult additions
checklist?: Checklist | null;
skills?: CharacterSkills[];
slotPictures?: SystemPicture[];       // TR-6
// ModuleOutput.timeline: M20's TimelineBars (TR-6)
```
`NowView` gains `checklist: ChecklistView | null` (the rows with M10's formatting: local times, durations, glyph words) and `skills: SkillsTabView[]` (each `CharacterSkills` with the name, class label, level and `href` `#skills-<index>`), following the Build and Cards tabs' pattern. "See it" is M17 FR-31's link, which every Next Action already gets; M20 adds no link field of its own. A checklist row's "See it" is that same link on the row's linked Next Action, or the row's System home (`formatRoute({ place: 'system', id })`) when it has none.

### TR-6 Pictures, the Skill Grid and Timeline bars (aligned with M17 as merged)
M17 owns routes (`#system-<id>`, `#<tab>-<index>`, the Characters overview sections), the hub, the generic System page and the Timeline. M20 plugs into three of its interfaces:

**1. `SYSTEM_HOMES` entries (M17 TR-7)**, one line each in `packages/engine/src/now/system-homes.ts` and one component in `apps/activeon/src/systems/pages.ts`, in M20's build PR:
- `construction: { page: 'cog-board' }`, `worship: { page: 'worship' }`, `trapping: { page: 'trapping' }`, `alchemy: { page: 'cauldron-seats' }` (until M19 ships an Alchemy page; M19's page then embeds this picture as one of its parts, X6);
- `skills: { tab: 'skills' }` (the registry's `skills` System homes on the Skills tab, M17 FR-23a).

**2. The page bodies' data**, one picture per System, on `EngineResult.slotPictures`:
```ts
export interface PictureElement { id: string; actionKey: string | null } // actionKey: the NextAction.key it fixes
export type SystemPicture =
  | { systemId: 'construction'; kind: 'cog-board'; cols: 12; rows: 8;
      squares: Array<PictureElement & { state: 'locked' | 'open' | 'cog' | 'character'; characterIndex?: number; flag?: boolean }>;
      shelf: Array<PictureElement & { index: number }>; inventory: Array<PictureElement & { index: number }>;
      buildRate: number; expRate: number;
      bestConstructor: null | { index: number; level: number; nextTier: null | { name: string; atLevel: number } } }
  | { systemId: 'worship'; kind: 'worship';
      tanks: Array<PictureElement & { index: number; charge: number; max: number; fullAt: number | null; skull: string | null; spendAt: string | null }>;
      totems: Array<PictureElement & { name: string; map: string; levelReq: number; maxWave: number; usableBy: number[] }> }
  | { systemId: 'trapping'; kind: 'traps'; returnAt: number;
      rows: Array<PictureElement & { index: number; started: boolean; set: string | null; allowed: number | null; traps: Array<{ critter: string; endsAt: number }> }> }
  | { systemId: 'alchemy'; kind: 'cauldron-seats';
      stations: Array<PictureElement & { station: 'power' | 'quicc' | 'high-iq' | 'kazam' | 'water' | 'nitrogen' | 'trench' | 'mercury'; locked: boolean; liquid: null | { current: number; max: number }; brewers: number[] }>;
      unassigned: number[] };

// The Skill Grid, for the `skills` Characters overview section (FR-31)
export interface SkillGrid {
  skills: SkillId[];
  rows: Array<PictureElement & { index: number; cells: Record<SkillId, { level: number | null; best: boolean; specialty: boolean; role: boolean }>; afkSkill: SkillId | null; slots: SlotPip[] }>;
  totals: Record<SkillId, number>;
}
```
- **Highlight:** M17's `SystemPageView.highlight` is a `NextAction.key` (M17 FR-31). The page component outlines the elements whose `actionKey` equals it, so "See it" from the seat Goal outlines the free square and the named character. Element `id`s (`square-39`, `shelf-2`, `tank-3`, `totem-0`, `station-nitrogen`, `cell-3-construction`) are only stable React keys and test handles; there is no element fragment in M17's route grammar.
- **Status** is M17's (FR-17: `locked`, `wasting`, `behind`, `cant-tell`, `not-covered`, `ok`), computed from Goals, pills, `behindSystems` and `unknownFindings`. M20's Goals and FR-42's Stage Expectation rows feed it with no extra field.

**3. Timeline bars (M17 TR-2 `TimelineBar`, Phase 2 of M17)**, through `ModuleOutput.timeline`:
- `killroy.check.skulls`: `kind: 'bank'`, `subject: 'account'`, `what: 'Killroy skulls'`, `at` = the account-week end, `effect: 'next-action'`, `fixHolds: true`; emitted whenever skulls > 0, so the account lane shows when they are wiped.
- `random-events.check.today`: `kind: 'timer'`, `at` = the next reachable event's start, `effect: 'info'`, `fixHolds: true`, only while today's event is not done.
- Worship charge and traps are M3's bars (M17 TR-4); M20 adds none for them.

**Differences from the first draft, and from M17, noted for the owner:**
- The draft's own `SystemSection` (status, headline, in-order list, locked text, sources) is dropped: M17's generic page already renders all of them. Only the picture is M20's.
- The draft's page ids `skills` and `daily-weekly` are not M17 Systems. The Skill Grid moves to a Characters overview section, and the checklist stays on Now. M17 needs two small additions, request X9: the route grammar gains `#skills` beside `#builds` and `#cards` (`Route.section` gains `'skills'`), and `SYSTEM_HOMES` gains `skills: { tab: 'skills' }`.
- M17 allows one dedicated page component per System. Construction's body is M20's alone (M15 F2's build-next Goal shows in the generic Next Actions). Alchemy's body is M20's only until M19 owns it.
- M20's new Systems (`killroy`, `weekly-battles`, `ballot`, `random-events`, `pet-tournament`, `task-board`, `guild`) need M11 registry rows with `kind: game`, a world (W2 for the first three, 0 for the rest) and `systems.fact.unlocks` rows (M17 TR-8). `checklist` and `slots` are `kind: activeon` rows: no tile. Their home is the Now section and the slot Goals.
- Character names are joined only in the UI (M4 TR-9). Until M17 Phase 1 ships, the pictures are computed but unused; the checklist and the Skills tab have their own homes (FR-12, FR-33).

### TR-7 Performance
The adapter work is ≤ 2 ms per save in the worker (`getRandomEvents` is 100 seeded rolls; `getKillRoyClasses` 3). The engine module is ≤ 3 ms for 11 characters (M10's engine benchmark). Account State grows by ≤ 4 KB, inside M1's 300 KB cap. The engine re-runs at the earliest `periodEnd`, `availableAt` and Random Event start (M6 FR-28's `nextChangeAt`), debounced to 60 s.

### TR-8 Storage, security and privacy
M20 stores nothing of its own. Manual ticks (FR-15) and dismissals use M10's preference store, keyed by row id and period end, never by character name. Report this sends M13's `ReportContext` with the entry or row id only. Nothing leaves the device. Tests use synthetic OLA values and never print fixture names; assertions on private fixtures compare counts and class/level labels.

### TR-9 Tests
- **Detector examples** (M11): each new Check fires, stays silent and reads `unknown` on scrubbed fixtures with the mutations in section 4.
- **Clock tests:** daily, account-week, server-week and ballot-week ends at `now` = save, save + 13 h, save + 37 h and save + 8 days on both fixtures; the 1 h drift rule; a save taken after a Gold Pocketwatch (the extra daily pass already ran, so counters are refilled and the clocks unchanged) ticks no row done and moves no period end; Killroy codes 20 and 301 read rooms 2 and 1+3 as done.
- **Contract tests** (run by M12's weekly re-sync, like M6 R8): every OLA index M20 reads has the expected type and range on all fixtures; `getKillRoyClasses` and `getRandomEvents` keep their output shape.
- **Ring arithmetic:** `cannot`, `unknown` and gated rows never count; a manual tick counts until its period ends.
- **Goldens** (M11 TR-15): section 11's rows and slot lines are lines of the Now text snapshot (`[checklist] Today 2/11 · Week 2/5`, one line per row when expanded).
- **Public saves:** the 11 public saves produce no crash, no row from a closed gate and no M20 Goal on W4–W7 saves from a W1–W3 rule that does not apply.

## 6. States and edge cases

| State | Behaviour |
|---|---|
| Loading, empty parse | No checklist, no Skills tab content; the tab shows M10's loading state |
| No `ShopRestock` (`dailyResetInSeconds` null) | Rows show states from the save without period ends ("can't tell when your daily reset is"); no row is lost before return; the rings still count |
| Save older than a reset | FR-3: rows revert to `todo` with "reset since your last save" |
| Paste mode | No history: no "done at", no manual tick persistence across sessions beyond M10's store |
| Pocketwatch used | The next save's `ShopRestock` and `OLA[39]` move the clocks; nothing is cached across saves |
| Gold Pocketwatch (an extra daily reset) | The extra daily pass runs at once, so the next save shows refilled counters with unchanged clocks; rows read `todo` from those counters |
| Tournament registration closed | The row is `waiting` (FR-2) |
| Server-day rollover (Pet Mart, Tournament) | Not projected until V8; the rows change only on a new save |
| Section failed (`construction`, `alchemy`, `quests`, `voteBallot`) | That row, pip or Goal is `unknown`; others unaffected |
| Killroy room for a class the account lacks | `cannot` with the reason, not counted (FR-4) |
| Server week rolled since the save | Weekly Battle reads difficulty 0 and `todo` (FR-16) |
| Ballot winner for an unreached world | "you get 1.25× damage instead" (FR-16) |
| Account with no W2 | Killroy, Weekly Battle, Ballot and vial rows are gated ("Opens later"); cauldron pips `locked` |
| W4+ account | Rows for W1–W3 items keep working; W4 items stay "Not covered yet" |
| Characters tie for the seat | Real on W3-early: three characters tie exactly on Toolbox build speed, so the pick rests on Construction EXP per hour (82.34 against 81.53). FR-20's tie-breaks end at the lower index; the golden pins the pick |
| Board full, inventory empty | No seat Goal; the page says to place a flag (FR-21) |
| Coins below the skull total | The skull line says how many the coins cover (FR-22) |
| Game patch moves an OLA index | The contract test fails in the weekly re-sync; an out-of-range value makes that row `unknown`; entries go Stale |
| Multiple tabs | Manual ticks and dismissals sync through M10's store within 1 s |
| Second account signed in | Rows and ticks are keyed to the account's own clocks; a tick from another account's period never matches |

## 7. Dependencies and cross-module requests

| Module | What M20 uses | Interface or request |
|---|---|---|
| **M1** | Account State, `isKnown`, history, `lastCloudSave`, `dailyResetInSeconds` | TR-2 growth through M1 TR-11 |
| **M2** | Stage, Roles (`roles[index]`, `owns`, `active`), `compareGoals`, the free-value block | **X2:** in `metapath.priority.free-value-fills`, add M20's four new slot entries next to `construction.check.cog-seat-free`; add `random-events.check.today` and `killroy.check.skulls` to `never-skip` with `byUrgency: true` |
| **M3** | Expected Return, the cauldron and trap facts, `afk.coins`, the pills | **X4:** `construction.check.cog-seat-free` moves to M20 (D-9); M3's FR-27 and its `cogBoard` field are retired in favour of TR-2's `cogBoard`. **X3:** M20 ships `trapping.fact.trap-set-capacity`, so M3 can build FR-21 branch (i) |
| **M4** | the generated `skill-doors` and `tools` facts | read-only |
| **M5** | Higher-leverage lines | read-only (the Skills tab links them, FR-37) |
| **M6** | its Checks' Account State fields and Goal keys, `unspent-time.ts` | read-only; M6 Final rulings' "weekly items stay Not covered yet" is superseded for Killroy, Weekly Battles, the Ballot and Random Events (D-1) |
| **M10** | the Account section, Active Play, preferences, `NowView` | **X5:** mount the checklist section (FR-12), add `NowView.checklist` and `.skills`, the manual-tick preference key (FR-15), the Skills tab registration, the golden text format for the checklist line |
| **M11** | schema, fact tables, Detector contract | **X1:** an optional entry field `surface: 'now' | 'checklist'` (default `now`); a `checklist` entry never becomes a Goal. New CI check: every `checklist.fact.rows` row names existing entries |
| **M14** | quest Walkthroughs, the printer facts and plan, `holdingsOf` | `trapping.check.start` opts into the quest Walkthrough (as `post-office.check.unlock`); M20 reads `PrinterState` for the printer pip. **X8:** M14 Phase 3's "Parallel Slot Plans for cauldrons, traps, cog seats and worship" (M14 §2, §12) move to M20; M14 keeps the printer. M20 Phase 2 consumes M14's Demand for critter and totem choices |
| **M15** | Stage Expectations | FR-42's two rows, added in M20's PR to `metapath.metapath.stage-expectations` |
| **M2 / M10** | the Account section's 5-Goal cap | **X7:** a shared position-3 budget for the small fill modules (M16 and M20 together at most 3 Account Goals), tested on W3-early; until it exists, M20's own cap of 2 holds (D-18) |
| **M17** | routes, `SYSTEM_HOMES`, the generic System page, `SystemPageView.highlight`, `TimelineBar` | M20 adds four `page` homes and one `tab` home, `slotPictures`, the `skills` overview section and two Timeline bars (TR-6). **X9:** `#skills` in the route grammar and `Route.section`; registry rows for M20's seven new Systems and two `activeon` rows |
| **M19** (proposed) | — | **X6:** when M19 publishes bubble targets, `alchemy.check.liquid-unstaffed` yields to M19's seat plan |

## 8. Owner review (self-ruled; the owner was asleep)

Each question was ruled by the author with the recommendation below, so the build can start; each is also one line under "M20" in the batched review queue. The owner confirms or overturns in the review release.

- **D-1 Module home.** Options: grow M6 (the atlas's suggestion for the checklist), M17, or a new module. ➡️ **New module M20** for all three features. *Why:* the owner assigned the checklist to this spec; M6's Final rulings had parked the weekly items, and its Checks stay M6's; the checklist reads them through a registry (D-2) instead of moving them, and keeping it beside the slots gives one module for "what runs while you're away".
- **D-2 The checklist is a registry.** ➡️ Rows live in one fact table (`checklist.fact.rows`) that any module extends. *Why:* the owner's findable-home rule: every new daily item gets a home by adding one row, not a new card.
- **D-3 Phase 1 rows.** ➡️ The 17 rows of FR-2. Picnic Stowaway, Liquid Shop gems, shop restock, Happy Hour runs, boss-gem kills and minibosses wait for Phase 2. *Why:* Phase 1 rows all have a save field that says done; the others need a field nobody has mapped yet (Picnic's daily quest index, the Liquid Shop counters), a party, or a personal shopping list.
- **D-4 Rows versus Goals.** ➡️ Rows never duplicate Goals. M20 rows become Now Goals only for a Random Event live within 20 minutes and Killroy skulls about to be wiped while away; Killroy rooms and the Weekly Battle are "If you have time"; the Ballot, Pet Tournament, daily tasks and guild tasks are rows only. *Why:* M6 R3's noise lesson; the ring and the list are where routine items belong, the Account Goals are for what is lost.
- **D-5 Three clocks, named.** ➡️ Show each weekly row's own clock in words (your weekly reset, Thursday 00:00 UTC, Monday about 17:00 UTC). *Why:* the game uses all three, and calling them all "weekly reset" would be wrong for two of them.
- **D-6 Rows the save can't judge.** ➡️ A Done tick that lasts until the row's reset (guild tasks only in Phase 1). *Why:* the owner wants done-detection from the save; where the save drops the field (Toolbox loses the guild claim flag), a self-clearing tick keeps the ring honest without guessing.
- **D-7 Rings.** ➡️ Two rings: today (no-bank and banks rows) and week; impossible or unknown rows don't count. *Why:* a ring that can't reach full trains the player to ignore it.
- **D-8 Killroy rooms.** ➡️ 1 room until World 3 is finished, 2 after, 3 with the Skull Shop unlock; the room's character is the highest-level one of that class line. *Why:* Toolbox's rule and the wiki agree on the second room ("unlocks at World 4"); the class is seeded per account week, so it can be named in advance.
- **D-9 The Cog Board seat moves from M3 to M20.** ➡️ M20 owns `construction.check.cog-seat-free` (never built in M3). It first moves characters out of the cog inventory onto the shelf (they earn nothing there), then fills free board squares: Construction Role first, then Toolbox build speed, then Construction EXP. *Why:* "who should fill it" is this module's job; Toolbox's numbers rank seats without a formula of ours (ADR 0005); a shelf character already makes cogs and earns the same EXP (wiki), so only the inventory is truly idle, and the board is where buildings get their build rate.
- **D-10 At most 2 slot Goals.** ➡️ Cog seat, skulls, trapping start, trap sets, liquid, in that order; the rest as "Also free" details. *Why:* as M16 D-2, five slot Goals at position 3 would push out everything else; the order is cheapest and surest first (a seat is free and takes seconds; skulls cost 5,000 coins each and double a cap; a quest takes a trip).
- **D-11 Skulls.** ➡️ Phase 1 suggests the Wax Skull only, for every character without a skull, once the W3 vendor is reachable; the Ceramic and later skulls wait for Phase 2. *Why:* the Wax Skull is a cheap shop buy that doubles the cap; later skulls are crafted from souls and compete with Prayers.
- **D-12 Trapping start.** ➡️ Treat Lord of the Hunt quest 1 as a per-character gate; one account Goal to start it, through M14's Walkthrough; then one line for trap sets. *Why:* the public saves are consistent with a per-character gate (F-f); a Walkthrough already knows the quest's materials and the shop.
- **D-13 The liquid seat rule.** ➡️ Fire only for an unlocked liquid below half its cap with nobody on it, while a cauldron has 2+ brewers; move the lowest-Alchemy brewer who is not the Shaman; `nice`, confidence M, and M19 replaces it later. *Why:* it is the only idle cauldron station the save can see; the wiki gives the two gains (faster liquid, 2× Alchemy EXP); the narrow trigger avoids churning brewers.
- **D-14 The Skills tab advises, it doesn't move.** ➡️ "Train" names a skill and how it trains; moves stay with M5 and M14. *Why:* one owner for moves keeps the push and AFK safety rules in one place.
- **D-15 Specialty without a Role.** ➡️ Show the wiki Skills page's specialty (Mining on the Warrior line) as a mark, not a Role. *Why:* M2 owns Roles and has no Mining Role; the mark answers "what is this class good at" without changing M2.
- **D-16 Stage Expectations.** ➡️ Two rows: no free Cog Board square, and a skull on every character, both by W3-mid. *Why:* both are cheap fixes a player should have made by then, and "Behind for your Stage" is where a player who never opened the System finds out.
- **D-18 Shared Account budget.** ➡️ Ask M2/M10 for one position-3 budget across M16 and M20 (at most 3 Account Goals from both); M20 keeps its own cap of 2 meanwhile. *Why:* each module's cap alone still lets M16 + M20 + Random Event + skulls fill the 5-Goal Account section on W3-early.
- **D-19 Weekly Battle done.** ➡️ Done for the week once any difficulty is beaten this server week; the row keeps "best N of 5" and the daily retry hint. *Why:* early W2 accounts often can't beat all 5, and a ring that can't fill teaches the player to ignore it (D-7).
- **D-21 Plug into M17, don't parallel it.** ➡️ After M17 merged, M20 dropped its own page frame and supplies only pictures (by `SYSTEM_HOMES`), the Skill Grid (a `#skills` Characters section) and two Timeline bars; differences are listed in TR-6 and asked as X9. *Why:* one owner for navigation and page frames; M20's draft frame duplicated M17's generic page.
- **D-20 Killroy and the pusher.** ➡️ Don't send the pusher to a Killroy room unless it is the only character of that class. *Why:* the run is minutes, but the pusher's AFK push is the account's top Goal (M2), and another character of the class does the room as well.
- **D-17 Glossary.** ➡️ Add **Daily & Weekly Checklist** (the owner's own words); keep "Parallel Slot" as is. *Why:* one new term the UI uses; the atlas's "Session Checklist" and "Daily Checklist" go under _Avoid_.

## 9. Red-team notes (author's own pass)

1. **Wrong reset time.** Using midnight or UTC would mistime every row. *Defence:* F-a's three clocks from save fields; tests at four `now` values; the drift rule.
2. **Stale "done".** A save from before the reset shows yesterday's ticks. *Defence:* FR-3 reverts rows when a clock rolled; US-2.
3. **Noise.** Seventeen rows and five slot Goals could flood the Account section. *Defence:* collapsed by default, rows link instead of repeating, M20 Goals only when value is lost (D-4), at most 2 slot Goals (D-10).
4. **Wrong character named.** Seating the Shaman (8 build speed) or sending the pusher to Killroy. *Defence:* Toolbox's own per-character numbers rank seats; Killroy names the highest-level of the room's class except the pusher (D-20); the shelf is not treated as idle (F-d).
5. **Unreachable advice.** Telling a W2 account to buy skulls in W3. *Defence:* FR-19's Stage gates, FR-22's `currentWorld ≥ 3`, gated rows hidden behind "Opens later".
6. **Patch day.** OLA indices move without an error. *Defence:* TR-9's contract tests in the weekly re-sync, `unknown` on out-of-range values, Stale entries.
7. **Privacy.** Player-cog names and the guild name carry personal data. *Defence:* indices only (TR-2), never read the guild or tournament names.

## 10. Red-team log

An independent reviewer (no access to the author's reasoning) checked the first draft against N.js, the Toolbox parsers and dashboard, the engine code, the wiki and both private saves: 29 findings (0 P0, 5 P1, 13 P2, 11 P3). It confirmed every clock, key, ticket, skill level, liquid and seat number in sections 4 and 11 except the two below. The author re-checked each finding against the evidence before ruling.

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| 1 | P1 | The Cog Shelf is not idle (it makes cogs and earns the same EXP); only the cog inventory is | fixed | Confirmed (wiki Construction; Toolbox slot ranges; W3-early: 3 on the shelf, the Shaman 54 in the inventory). F-d, FR-18, FR-20 (inventory → shelf first, then free squares), TR-2 `cogPlace`, US-5, §11.2, D-9 |
| 2 | P1 | Pet Tournament done is `OLA[511] > day`, so the W3-early today ring is 1 of 11 | fixed | Confirmed in Toolbox `account.js` L274–281 (registering sets day + 1). FR-2, US-1, US-2, §11.2, V5 closed |
| 3 | P1 | Pet Mart and Tournament run on a server day, not the daily reset | fixed (projection deferred) | New fourth clock in F-a; FR-3 never projects them until V8 maps the roll |
| 4 | P1 | "Train: Fishing · trains while AFK on Fishing" on characters that are fighting implies a move | fixed | FR-37: "Train" only for the current AFK Target or a Parallel Slot, else "Role skill: … it's fighting now"; US-9, §11 |
| 5 | P1 | Weekly Battle needs all 5 difficulties, so the week ring can't fill | fixed | D-19: done once a difficulty is beaten this server week; detail keeps "best N of 5" |
| 6 | P2 | Killroy's done code is per-digit (20, 301 valid) | fixed | F-c, TR-2, TR-9 tests 20 and 301 |
| 7 | P2 | Room 3 exists only with room 2 | fixed | F-c, TR-2 |
| 8 | P2 | Room classes after a projected rollover | fixed | TR-2 keeps this and next week's classes; FR-10, US-2 |
| 9 | P2 | FR-27 has no tie-break between cauldrons with equal brewers | fixed | Lowest-Alchemy non-Shaman across every tied cauldron, then cauldron index; US-8 unchanged (Squire 85) |
| 10 | P2 | The manual-tick key breaks on `ShopRestock` drift and could collide across accounts | fixed | FR-15: account key plus an integer period index |
| 11 | P2 | The skulls row vanishes when spent, so it never counts done | fixed | The row stays `done` for the week once shown (FR-2) |
| 12 | P2 | Random Event on an unreachable W3 map; ambiguous state | fixed | FR-9 filters by reachable worlds; `todo` only while live; §11 states pinned by the golden |
| 13 | P2 | "About 111 build rate" is not Toolbox's board number | fixed | The number is dropped (ADR 0005); the why line names the trade |
| 14 | P2 | Lord of the Hunt 1's materials are wrong, and it rewards a trap set | fixed | F-f from the generated quest data; FR-25 says "equip the one the quest gave" |
| 15 | P2 | The Squire line has two specialties | fixed | F-h: subclass first, skipping closed Systems |
| 16 | P2 | M16 + M20 can together fill the Account section | fixed (cross-module) | X7 and D-18: a shared position-3 budget asked of M2/M10; M20's cap of 2 meanwhile |
| 17 | P2 | Overlap with M14 Phase 3's slot plans; trap-capacity fact origin | fixed | X8 retires M14 Phase 3's non-printer slot plans; TR-3 settles the fact as authored |
| 18 | P2 | Tournament registration can be closed | fixed | FR-2 `waiting`, TR-2 `registrationClosed`, §6 |
| 19 | P3 | The Gold Pocketwatch test describes a save that never exists | fixed | TR-9 and §6 rewritten |
| 20 | P3 | "Raises it to 100" is hard-coded | fixed | F-e: "at least 100", exact value from Toolbox |
| 21 | P3 | Coins are per wallet; the line should name the buyer | fixed | FR-22 names the richest wallet |
| 22 | P3 | Killroy could send the pusher | fixed | D-20; US-4 now names the Squire 43 |
| 23 | P3 | Wrong Role ids in FR-37; `parallel:printer` missing | fixed | FR-35, FR-37 |
| 24 | P3 | Weekly Battle effort too low | fixed | 60 s per character |
| 25 | P3 | Shelf and inventory conflated | fixed | with #1 |
| 26 | P3 | The seat tie is real on W3-early | fixed | §6 and US-5 state it; the golden pins the pick |
| 27 | P3 | The status line claimed a log that was empty | fixed | this section |
| 28 | P3 | "dailies" is an _Avoid_ word | fixed | US-1 title |
| 29 | P3 | The week ring mixes three clocks | fixed | FR-6 says so in "why" |

Rejected: none. Deferred: the server-day rollover time (V8) and the shared Account budget (X7), each with a safe default in place.

## 11. Worked examples (private fixtures, by class and level)

Golden clock (`now` = the save), Expected Return 8 h.

### 11.1 W2-late account
- **Clocks:** daily reset in 23.7 h; account week ends in 71.7 h (`OLA[39]` 2); new Weekly Battle boss in 104.2 h; Ballot week 2963, not voted.
- **Today ring 0 of 10:** free pet pull `todo` (ready since 14.9 h before the save; M6 Goal); Pet Mart gems `todo` (M6 Goal); Pet Tournament `todo` (registered through day 0, today 241; 2 pets); Random Event `todo` if a reachable event (W1 or W2 maps, so no Glacial Guild) is live at the golden clock, else `waiting` with the next one (the golden pins which, from Toolbox's seeded schedule); minigame plays `todo` (5 of 5); Spiketrap gems `todo`; vial attempts `todo` (11 of 11, when an ingredient is held); daily tasks 0 of 1 (W1 only: the W2 board waits on Desert Davey's quest); Forest Villa keys `todo` (1 day banked, 4 a day, banks 2 more days); Colosseum tickets `todo` (Typhoon 4 days, 1 lost; Centurion 2). Not listed: Post Office orders (not unlocked; M6's unlock Goal), guild rows (not in a guild), Efaunt keys (0 a day), Lonely Hunter (World 2 not finished).
- **Week ring 0 of 3:** Killroy 1 room (Warrior, never run) → "Run Killroy's Warrior room on your Squire Lv 43" (the Barbarian 60 is the pusher, D-20); Weekly Battle 0 of 5; Ballot not voted. Skulls: 0, no row.
- **Parallel Slots:** no slot Goal. Cog, worship, trap pips `locked` ("Opens in W3"); cauldron pips `filled` (Power 1, Quicc 1, High-IQ 2, Kazam 1); Liquid Nitrogen locked (best Alchemy 13).
- **Skills tabs (headers):** Barbarian 60 "Role skill: Fishing · it's fighting now" (Fishing 1, Faraway Piers at 15); Squire 43 "Train: Mining (specialty)" (no active Role has a skill; Mining 20, Ol' Straightaway at 25, 5 levels); Shaman 44 "Train: Alchemy · trains while it brews (High-IQ)" (Alchemy 12; Liquid Nitrogen opens at the account's best Alchemy 20, 7 levels); Bowman 54 "Role skill: Catching · it's fighting now" (Catching 1; Smithing 18, Role); Wizard 56 "Role skill: Choppin · it's fighting now" (Choppin 1; the account's best is the Shaman's 23).

### 11.2 W3-early account
- **Clocks:** daily reset in 12.6 h; account week ends in 36.6 h (`OLA[39]` 1); new Weekly Battle boss in 112.3 h; Ballot week 2963, voted.
- **Today ring 1 of 11:** free pet pull `waiting` (ready in 11.2 h); Pet Mart gems `todo` (M6 Goal); Pet Tournament `todo` (`OLA[511]` 241 is not above day 241); Random Event `todo` or `waiting` as on W2-late (W3 maps reachable here); minigame plays `todo` (4 of 5 left); Spiketrap gems `todo`; vial attempts `done` (0 of 17 left); daily tasks 0 of 3 (W1, W2, W3 boards open); guild dailies: Done tick, hint "2 of 5 met"; boss keys `todo` (Forest Villa 2 days at 2 a day, Efaunt 2 days at 1 a day; M6 Goal); Colosseum tickets `todo` (Lonely Hunter 5 days, 2 lost; Typhoon 1; M6 Goal).
- **Week ring 2 of 5:** Killroy's room `done` (1 room open, `OLA[113]` 1); Killroy skulls `todo` (6, "your weekly reset in 37 h"; no Goal at 8 h); Weekly Battle `todo` (best 0 of 5 this week); Ballot `done`; guild weeklies: Done tick, hint "3 of 4 met".
- **Parallel Slots (Account section):** Goal 1 "Put your Shaman Lv 54 on the Cog Shelf" with the detail "Seat your Wizard Lv 73 on the free Cog Board square"; Goal 2 "Buy a Wax Skull for each of 6 characters at the Frostbite Towndra shop (5,000 coins each)", the buyer the character with the most coins, with "Also free: Start Trapping (Lord of the Hunt's first quest); move your Squire Lv 85 to Liquid Nitrogen (0 of 13)".
- **Pips:** cog `filled` on both Squires (board) and on the Wizard 73, Bowman 60 and Barbarian 56 (shelf), `fillable` on the Shaman 54 (cog inventory); worship `capped` on 4 (50/50) and `filled` on the Wizard 73 and Shaman 54, every one reading "no skull (max 50)"; trap `unfillable` on 6 ("needs Lord of the Hunt's quest"); cauldron `filled` on 6; printer per M14 (the Barbarian 56 and Shaman 54 are past the printer's level 4).
- **Skills tabs (headers):** Wizard 73 "Train: Worship · trains as it spends charge" (Worship 16, account best; Acorn Assault at 30); Squire 85 "Train: Construction · trains while it sits on the Cog Board" (11; Decent cogs at 15); Squire 51 the same (2nd builder; Mining 29 specialty, Echoing Egress at 40); Bowman 60 "Role skill: Catching · it's fighting now" (26; Smithing 39 is the account's best, Anvil Tab 4 at 50); Barbarian 56 "Train: Fishing · trains while AFK on Fishing" (22; Deepwater Docks at 30, 8 levels); Shaman 54 "Train: Alchemy · trains while it brews (High-IQ)" (10, the account's lowest; best 20).

### 11.3 Facts checked for this spec
| Claim | Evidence (opened 2026-10-18) |
|---|---|
| Daily reset is `ShopRestock`; account week `OLA[39]`; server week Thursday 00:00 UTC; ballot offset | resets dossier (N.js daily loop @15114421, weekly block, ballot @≈11766234; Toolbox `Etc.jsx` L71–72); both fixtures' `OLA[191]` 2963 = `⌊GlobalTime/604800⌋`, the W3-early `OLA[309]` 2963 = `⌊(GlobalTime+197860)/604800⌋` |
| Killroy weekly, skulls wiped, 3rd room 1% roll, 2nd room at World 4; per-digit done code | wiki Killroy's Slaughterhouse (2026-10-05); Toolbox alert (`account.js` L643, needs `finishedWorlds.World3`); N.js @4338065 (rooms), @4314131 (code) |
| Cog Shelf characters make cogs and earn the same EXP | wiki Construction (2026-10-07); Toolbox `construction.ts` slot ranges |
| Tournament registration sets `OLA[511]` to day + 1 | N.js @13333782; Toolbox `account.js` L274–281 |
| Lord of the Hunt 1 consumes and rewards Cardboard Traps | generated `quests.acquisition.lord-of-the-hunt1` (Toolbox quests data) |
| Weekly Battles: 5 difficulties, one turn per character, 35 trophies, Pocketwatches | wiki Weekly Battles (2026-10-07); the reset time is not on the wiki, so the server week comes from N.js |
| Ballot: vote weekly for one of 3, 1.25× damage for an unreached world | wiki Bonus Ballot (2026-10-09) |
| Random Event: 21.3% an hour, one a day on the personal reset | wiki Random Events (2026-10-07); Toolbox `getRandomEvents` |
| Tournament daily | wiki Tournament (2026-10-14) |
| Daily tasks; W2 board via Desert Davey, W3 via Iceland Irwin | wiki Tasks (2026-10-03); reroll from N.js via the dossier (not on the wiki) |
| Wax Skull 5,000 coins at Frostbite Towndra, max charge 100; totem levels 1/10/30/40 | wiki Worship (edit date not shown) |
| Trapping starts with Lord of the Hunt; Cardboard Traps at the W3 vendor; box tiers 5/15/20/30/40/48; timers stop on character select | wiki Trapping (edit date not shown); wiki Lord of the Hunt (2026-09-27) |
| Cog tiers 15/40/70; seats give build rate; cog cost rises with uncollected cogs | wiki Construction (2026-10-07) |
| Each character must click the cauldron; liquid seats 2× Alchemy EXP; liquids 1/20/35/80 | wiki Alchemy (edit date not shown) |
| Specialties per skill | wiki Skills (2025-06-29) |
| 3D Printer: one printing character per building level | wiki 3D Printer (2026-10-14) |

### 11.4 Verify before build
- **V1** The game's build rate counts board squares only (N.js `WorkbenchStuff`), matching Toolbox (F-d). Agent task.
- **V2** Lord of the Hunt quest 1 gates trap placement per character (N.js trap placement handler). Agent task; if account-wide, FR-25's second detail is dropped.
- **V3** `trapping.fact.trap-set-capacity` per `TrapBoxSet<n>` from N.js.
- **V4** The daily-task done field (`Tasks[1][w][8] ≥ 1`) on a save taken right after a claim, or from N.js's claim handler.
- **V5** Settled by the red-team: registering sets `OLA[511]` to day + 1 (N.js @13333782).
- **V8** When the server day `S` / `T` rolls (Pet Mart, Tournament), so their rows can be projected.
- **V6** The Weekly Battle and Ballot unlock gates (W2 reached is the working rule).
- **V7** The W1 Task Board unlock signal (Grasslands Gary dialogue above 0 is the working rule).

## 12. Phased build plan

| Phase | Ships | Why first |
|---|---|---|
| **1** (step 8d, after M17 Phase 1 and M16 Phase 1, M17 D-19) | F1 the checklist with its 17 rows, clocks, rings, links and the Now section; F2 slot facts, the five slot Checks, pips, the Skill Grid and page sections; F3 the Skills tab; the M15 Stage Expectation rows | Uses only built modules (M1–M3, M6, M10, M11, M14) plus M17 Phase 1's homes; the two Timeline bars wait for M17 Phase 2 |
| **2** | Demand-driven slot choices (critter and totem soul types for M14 Demand items); the skull ladder; Cog Board swaps from Toolbox's optimiser; the cog-shelf collect; Picnic Stowaway, Liquid Shop gems and Happy Hour rows; M19's seat plan replacing FR-27 | Needs M14 Phase 2 Demand, mapped save fields, or M19 |

## Sources

- IdleOn Wiki, opened 2026-10-18: [Killroy's Slaughterhouse](https://idleon.wiki/wiki/Killroy%27s_Slaughterhouse) (2026-10-05), [Weekly Battles](https://idleon.wiki/wiki/Weekly_Battles) (2026-10-07), [Bonus Ballot](https://idleon.wiki/wiki/Bonus_Ballot) (2026-10-09), [Random Events](https://idleon.wiki/wiki/Random_Events) (2026-10-07), [Tournament](https://idleon.wiki/wiki/Tournament) (2026-10-14), [Tasks](https://idleon.wiki/wiki/Tasks) (2026-10-03), [Daily Checklist](https://idleon.wiki/wiki/Daily_Checklist) (2026-03-24, Stale-risk), [Guilds](https://idleon.wiki/wiki/Guilds) (2026-10-07), [Worship](https://idleon.wiki/wiki/Worship), [Trapping](https://idleon.wiki/wiki/Trapping), [Lord of the Hunt](https://idleon.wiki/wiki/Lord_of_the_Hunt) (2026-09-27), [Hoggindaz](https://idleon.wiki/wiki/Hoggindaz) (2026-09-27), [Construction](https://idleon.wiki/wiki/Construction) (2026-10-07), [Alchemy](https://idleon.wiki/wiki/Alchemy), [Skills](https://idleon.wiki/wiki/Skills) (2025-06-29), [3D Printer](https://idleon.wiki/wiki/3D_Printer) (2026-10-14), [Wizard](https://idleon.wiki/wiki/Wizard) (2026-09-03, Charge Syphon).
- Resets dossier: [`research/account-wide` resets-dailies-events.md](https://github.com/YassSoliman/idleon-forge/blob/research/account-wide/docs/research/systems/account-wide/resets-dailies-events.md) (2026-10-17; N.js v1.23 offsets and Toolbox 6827d3f lines inside).
- System Atlas (design lab, 2026-10-18): entries "Daily and weekly reset checklist", "Killroy's Slaughterhouse", "Weekly Battles", "Bonus Ballot", "Cogs, the Cog Board and flags", "Worship", "Trapping", "Alchemy assignment and brewing", "Skill overview".
- Toolbox parsers @ `6c37e3d`: `misc.ts` (`getKillRoy`, `getKillRoyClasses`, `getRandomEvents`), `world-3/construction.ts` (`parseFlags`, `SPARE_START_INDEX`), `world-3/constructionOptimizer.ts` (`evaluateBoard`), `world-2/alchemy.ts` (activities), `world-2/voteBallot.ts`, `world-3/worship.ts` (`getTotems`); Toolbox dashboard `utility/dashboard/account.js` L641–667 (Killroy alert).
- Fixture reads (aggregates only): both private fixtures, 2026-10-18; the 11 public saves for the Lord of the Hunt pattern.

## Build notes (Phase 1, 2026-10-18)

Verify-before-build items settled from N.js (v1.23, the copy read 2026-10-17) and Toolbox at the pin:

- **V2, Lord of the Hunt quest 1 is not a per-character gate.** Critter types are account-wide (`OLA[47]`, which a game migration, `DoOnceREAL` 289.3, raised to at least 9 on every account), and the traps a character can place are its equipped set's item `ID` (`"NumOfTrapsPlaceable"`, N.js @7772714). The real gate is an equipped trap set; quest 1 gives the first one. So `trapping.check.start` fires while no character has the quest done or holds or wears a set, `trapping.check.no-trap-set` fires once Trapping has started anywhere, and FR-25's second detail is dropped.
- **V3, traps per set** = the set item's `ID` (Cardboard 1 … Royal 7; later sets stay 7), +1 with an Alchemy bonus. `trapping.fact.trap-set-capacity` mirrors Toolbox `items.json`; `kb-tools/test/m20-facts.test.ts` checks it at the pin.
- **V4, the daily-task done field** is `Tasks[1][w][8] == 1`: the game credits the guild's "W1 Daily Task" only then (N.js @7478502), stops the task's progress then (@8630021), and the daily reset sets it back to 0 (@15113909).
- **V8, the server day** (Pet Mart, Tournament) is not in N.js: the game asks its host (`getTournamentDay`, `isTournamentRegisterationClosed`), so the rows are never projected and change only on a new save. Registration closed reads the global tournament doc's `C` flag (confidence M).
- **V1** (build rate counts board squares only) is taken from Toolbox's `totalBuildRate` as the spec says; not re-read in N.js.
- **V7** (task board unlocks): W1 by any character's Grasslands Gary dialogue above 0, W2 by `Desert_Davey2` done, W3 by `Iceland_Irwin1` done (wiki Tasks agrees on the NPCs).

Corrections found while building:

- **The Wax Skull price.** The wiki Worship page names the Frostbite Towndra vendor but gives no buy price (5,000 is the item's sell price), so the skull line quotes no price and FR-22's buyer line ("coins for 4 of 6") waits for a verified price.
- **Guild membership** is read from the guild's member list or guild points, never its id or name (both scrubbed identities, TR-14), so the scrubbed W3-early save keeps its guild rows and CI gives the spec's 1 of 11 and 2 of 5.
- **The Ballot's world-gated note** (FR-16, "you get 1.25× damage instead") is not built: no table says which bonus belongs to which world yet. The row shows the leading bonus in words.
- **Manual ticks** (FR-15) live in M10's per-account preference store under `checklist@<rowId>@<periodIndex>`; the store's namespace is the account key.
- **The two M20 engine modules.** `m20-slots` runs with the other modules (so M14's step attaches the Lord of the Hunt Walkthrough to the start Goal), `m20-checklist` runs after them and links rows to the merged Goals (FR-8).
- **Size.** Skills and slots per character add about 13 KB to the 17-character public save; the history guard is 320 KB.
