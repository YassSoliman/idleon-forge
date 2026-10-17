# M6 Unspent & idle

Spec for [#34](https://github.com/YassSoliman/idleon-forge/issues/34), part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **ready**. Section 8 ruled by Yasser on 2026-10-17 (every recommendation accepted); red-teamed, see section 10. Build order: M1 → M11 → M2 → M10 → M13 → M3 → **M6** → M4 → M7 → M8 → M9 → M5, with M12 alongside ([#13](https://github.com/YassSoliman/idleon-forge/issues/13)).

Terms follow [`GLOSSARY.md`](../../GLOSSARY.md). This spec rests on [ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md) (deterministic advice), [ADR 0004](../adr/0004-source-precedence.md) (Source precedence), [ADR 0005](../adr/0005-toolbox-numbers-not-our-formulas.md) (Toolbox numbers plus arithmetic, no formulas of ours), [ADR 0006](../adr/0006-client-only-spa-parsing-in-a-worker.md) (engine in the browser) and [ADR 0007](../adr/0007-generated-facts-authored-judgment.md) (generated facts, authored judgment), and on the resolutions of [#10](https://github.com/YassSoliman/idleon-forge/issues/10) (Now screen behaviour), [#11](https://github.com/YassSoliman/idleon-forge/issues/11) (Knowledge Base shape), [#12](https://github.com/YassSoliman/idleon-forge/issues/12) (Purpose), [#13](https://github.com/YassSoliman/idleon-forge/issues/13) (MVP cut), [#14](https://github.com/YassSoliman/idleon-forge/issues/14) (architecture), [#16](https://github.com/YassSoliman/idleon-forge/issues/16) (hypothetical math) and [#26](https://github.com/YassSoliman/idleon-forge/issues/26) (the Leverage model).

**Inputs used.** The Leverage model (`research/leverage-model`, §3.0 shared frame, positions 1 and 3), which is the backbone; the priority verification overlay (`research/priority-verification`, **PV**, wins on conflicts); the dossiers `research/account-wide` (resets and keys, minigames, merit, gem shop, pets), `research/w2-systems` (bubbles, vials, Arcade, Poppy), `research/w1-systems` (Post Office, anvil), `research/character-builds` (talent presets); the draft specs of M1 ([PR #43](https://github.com/YassSoliman/idleon-forge/pull/43)) and M10 ([PR #44](https://github.com/YassSoliman/idleon-forge/pull/44)) for the interfaces M6 plugs into. Fixture numbers below were read from the two private parsed saves on 2026-10-17 and are aggregates only.

**Patch.** Game v1.23 "Lumi Menagerie" (Toolbox gameVer 2.3.540). The engine's vendored parser pin is `6c37e3d` (Toolbox 3.3.96, `packages/toolbox-parsers/UPSTREAM`), and every Toolbox function and OLA index (`account.accountOptions[n]`) quoted here is checked against that pin; dossier links that cite the research-time commit `6827d3f` point at the same game version. See R8.

---

## 1. Purpose

Between Play Sessions an IdleOn account quietly piles up things that are worth something only once the player uses them: brew sitting in the cauldrons, boss keys and Colosseum tickets waiting at their NPCs, merits and task unlock points nobody spent, Darts and Hoops points, a free daily pet pull, Post Office boxes, a big-bubble slot with nothing in it. Some of it is lost for good if it waits too long (keys and tickets stop banking after 3 days, daily minigame plays and vial attempts reset). On a W3 account the Refinery and Construction add two more: a salt that is unlocked but switched off, and a Death Note building still at level 0, so multikill pays nothing. Both of our accounts leak value exactly this way. M6 finds every one of these in the save, says what to do with it in one concrete Next Action, and ranks it so that whatever will be lost before the player's Expected Return comes first. It never changes a Verdict: unspent stock is a Goal, not an AFK-safety problem.

## 2. Scope / Out of scope

### In scope (the M6 Checks)

| Group | What M6 detects | Where it shows |
|---|---|---|
| **Banked at an NPC (3-day cap)** | Boss keys (Forest Villa, Efaunt's Tomb, Chizoar's Cavern); Colosseum tickets | A character who can collect (keys) or Account (tickets) |
| **Daily, does not bank** | Vial attempts; skill-minigame plays; Spiketrap Surprise daily gems; the free daily pet pull; Pet Mart daily free gems | Account |
| **Cooldown minigames** | Throwy Darts and Swishy Hoops: a play is available, and points are unspent | Account |
| **Idle stock that converts only by hand** | Brew banked in a cauldron; Poppy's unconverted fish | Account |
| **Unspent points and currencies** | Merits per world; task unlock points; gems; Post Office boxes (per character); anvil points (per character) | Account, or the character holding them |
| **Empty or mis-fitted slots** | Big-bubble slots that are empty, or hold a bubble that does nothing for the character's AFK Target | The character |
| **Idle system** | Post Office unlockable but not unlocked; unlocked but today's orders not filled | The character with the quest in progress, then Account |
| **W3 idle systems** (D6) | A Refinery salt unlocked but switched off; the Death Note building at Lv 0 once Explosive Salt is unlocked | Account |

### Out of scope (and who owns it)

- **Anything that changes a Verdict.** Food, carry space, liquids filling, worship charge, anvil products capping, traps ending, empty Parallel Slots (cauldron assignment, cog seat, printer sample, traps): **M3 AFK Safety**. M6 owns banks that are *not* tied to a character's AFK Target (keys, tickets, Poppy, plays); M3 owns caps that stop a character's own production, and the **Arcade ball cap** (M3 FR-24, an account blocker, which M10 leads the Account section with). See §7 for the dedupe rule.
- **Coins** and the coin Spend Plan (Upgrade Vault, stamps, bribes, statues): **M7 Spend Plan**.
- **Cards, card presets, card sets, obols** (Leverage fills 3a, 3b): **M8 Collections**.
- **Talent presets**, all of them: the empty or incomplete second preset (M9 FR-7, FR-8), unspent talent points, the wrong preset on an AFK Target, and reset suggestions: **M9 Builds**. M9 classifies a preset's role, which M6 cannot, so M6 emits no preset Goal (red-team #7).
- **Tools, constellations, star signs** (fills 3d, 3f): not M6.
- **The rest of the Refinery and Construction:** manual Refine of a full bar and rank-ups (Leverage 1f), Auto Refine on Redox or Dioxide, salt balance, fuel running dry (M3 FR-26), unpaid build bars, build slots and the build order (Leverage W3-early 5), and Death Note mob ranks (M4 `contrib.fight.death-note`). M6 owns only the two D6 Checks. The Equinox bar stays out (D6).
- **Weekly and event items** (Killroy, Bonus Ballot, weekly bosses, Random Events), Tournament and Raid registration, Pet Bonus Tokens, Pet Crystal spending, Orion upgrades, Arcade gold-ball spending, the Equinox bar, Liquid Shop dailies and the Bargain Tag: not in the MVP M6. They appear in "Not covered yet" (M10 FR-26), to be assigned after the first 5 sessions (D6).
- **Writing any game formula.** Darts, Hoops and bubble costs are read from Toolbox where Toolbox computes them, and otherwise not used (ADR 0005). Where Toolbox has no number, or a number known to be wrong (the Hoops cost, R1), M6 states the stock, not the purchase.

## 3. Functional requirements

**General**

- **FR-1** M6 runs as part of the engine on every clean Account State, and again whenever the Expected Return changes or a time-sensitive Check reaches its `nextChangeAt` (FR-28). It returns Goals, each with exactly one Next Action, for the account and for characters. It never returns a Verdict blocker and never changes a Verdict.
- **FR-2** Every M6 Goal has category `spendable`, `compounding` or `nice` (M10 TR-2), one or more Sources, a confidence (H/M/L), and provenance listing the Knowledge Base entry ids and the Account State fields that produced it.
- **FR-3** A Check whose inputs are unknown (a failed parser section, a failed side read, a missing field) produces no Goal and records an `unknown` diagnostic. It never guesses a zero.
- **FR-4** Each Check fires only once its System is unlocked on the account (the entry's `appliesTo.stage` plus its unlock Detector). Nothing W3-only fires on a W2 account.
- **FR-5** A Check declares an **urgency**: `losing-now` (value is already being lost: a bank past its cap), `lost-before-return` (the cap or reset falls before `now + Expected Return`), or `banked` (safe until after the return). Urgency decides the Priority List position (TR-9).
- **FR-6** Every Next Action states the amount in play ("Collect 8 Colosseum tickets", "Spend 12 W1 merits"), and, for a cap or reset, when it hits ("2 of them have been capped for a day", "resets in about 12h").

**Banked at an NPC**

- **FR-7 Keys.** For each key type with `amountPerDay > 0`, let `lostByReturn = daysSincePickup + resetsBefore(now + ER) − 3` (resets crossed between the save and the return, TR-6). M6 shows "Collect N <key>" when `daysSincePickup ≥ 2` or `lostByReturn > 0`, where N is Toolbox's `totalAmount` (`min(days, 3) × perDay`). The counter itself is never capped: a raw 4 means one day already lost. It places the Goal on a character eligible to collect (TR-7). Key types that fire for the same character merge into one Goal.
- **FR-8 Colosseum tickets.** An NPC counts only once the account can reach it: Typhoon always, Centurion once `finishedWorlds.World1`, Lonely Hunter once `finishedWorlds.World2` (Toolbox `areKeysOverdue`; the day counter keeps rising on an unreachable NPC). Toolbox hardcodes one ticket a day, so there is no per-day gate. The FR-7 rule decides whether a reachable NPC fires; when any fires, one Account Goal "Collect N Colosseum tickets" counts every reachable NPC's `min(days, 3)`, since the player collects them in one trip. If any NPC is past 3 days, the Next Action says how many days are already lost.

**Daily, does not bank**

- **FR-9 Vial attempts.** When `vialAttempts.current > 0` (W2+) and at least one level-0 vial's ingredient is held somewhere on the account (Toolbox's `vialsAttempts` alert rule, exposed as `vialAttemptsUsable`, TR-3), "Use your N vial attempts on the W2 town cauldron". Urgency from the daily reset (TR-6, D5).
- **FR-10 Skill-minigame plays.** When the shared pool is above 0 and the daily reset falls before the return, "Use today's N minigame plays", naming the first open highscore Milestone from the authored list (TR-4, entry `minigames.daily-plays`). See D4.
- **FR-11 Spiketrap Surprise.** When today's gems are unclaimed (`OLA[7] == 1`) and the next round (top of the hour) starts within 20 minutes, "Spiketrap starts at :00: up to 40 gems today". Category `nice`.
- **FR-12 Free pet pull.** When `freeClaimAnchor + 594,000,000 ms ≤ now`, "Claim your free pet pull at Doggy". Urgency `losing-now` (a missed day is not given back).
- **FR-13 Pet Mart gems.** When the server offers them (`serverVars.GemPM_x ≥ 0.1`), the shop day `S ≥ 1` and `OLA[516] < S`, "Claim today's free Pet Mart gems". Confidence M until R2's check is done.

**Cooldown minigames**

- **FR-14 Play.** When Darts (or Hoops) is unlocked, off cooldown at `now`, and has not been played in this Play Session, "Play one round of Darts (about 2 min, from any map with the Darts item)". Once a play is seen, it does not return in that Play Session (D3).
- **FR-15 Spend.** An upgrade is unlocked when the game's total levels reach its `pointsToUnlock` (Darts 0/40/150/250, Hoops 0/12/80/200), never from Toolbox's `unlocked` flag, which reads `level > 0` and marks every upgrade of a fresh account as locked. When Darts points ≥ the cheapest unlocked upgrade's Toolbox cost, "Spend N Darts points (next DMG level costs C)". Toolbox prices Hoops with the Darts formula, which **understates** the real Hoops cost (R1), so for Hoops M6 states the stock only: "N Hoops points unspent" (`nice`, no cost, no "spend" claim) until the parser pin carries the real cost.

**Idle stock**

- **FR-16 Brew.** For each cauldron with Toolbox `newBubble.expectedBubbles ≥ 1`, M6 counts it in one Account Goal: "Spend banked brew in <cauldrons>: about N new bubbles". N is the rounded sum of `expectedBubbles` over firing cauldrons. If the next bubble of a cauldron is a big bubble that fits an AFK Target in use on the account (TR-4 pairing table), the why line says so.
- **FR-18 Poppy.** When Poppy is unlocked and Toolbox's `pendingFish > 0` and Poppy has not been opened this Play Session, "Open Poppy's pond to convert your fish". Category `nice`.

**Unspent points and currencies**

- **FR-19 Merits.** For each world with unspent merits ≥ the cheapest unmaxed **real** row's cost (rows with a null cost are placeholders, such as W1 row 7 "IDK YET", and are dropped by the generator, TR-5), "Spend N W<w> merits: first <row>", where <row> is the first unmaxed row of that world's merit Priority List that the merits cover. `unspent = 0` never fires. A world whose list is Contested (W3, PV 7.3) shows the badge and both sides, and is never the first Goal.
- **FR-20 Task unlock points.** When `unlockPointsOwned − unlockedRecipes > 0` and an open Unlocks column has an unbought row, "Spend N task unlock points".
- **FR-21 Gems (D2).** When `gems > 0`: from Stage W2-late on, if the Crystal 3D Printer is not owned, "Crystal 3D Printer: N of 875 gems" (`nice`, with a Milestone, TR-10) while gems < 875, and "Buy the Crystal 3D Printer (875 gems)" (`spendable`) once gems ≥ 875. Before W2-late, or once the printer is owned, "N gems unspent" with the "sources disagree" badge and both PV 7.5 sides (Infinity Hammer first; Extra Card Slots and the Crystal 3D Printer first). A Gem Goal names a purchase only when gems ≥ its price, and the Contested form is never position 1 or the first Account Goal. Prices come from the generated gem shop facts (TR-5), never from this spec.
- **FR-22 Post Office boxes.** Once the Post Office is unlocked, for each character with `postOffice.unspentPoints > 0`, "Spend N Post Office boxes" on that character, naming the class's first box from the authored order (PV 3.5).
- **FR-23 Anvil points.** For each character with `anvilStats.availablePoints > 0`, "Spend N anvil points on Speed" on that character (PV 3.1). Capacity is named instead only when M3 reports an anvil product capping before the return.

**Slots**

- **FR-24 Big bubbles.** When the account owns the Sheepie companion ("all big bubbles count as equipped"), the Check is silent; when companion data is unknown, it returns `unknown` (FR-3). Otherwise, for each character, slots available = 1, plus 1 if the "Changing the Code" bribe is bought, plus 1 if Breeding arena wave 100 is reached. For every empty slot, M6 names the best **unlocked** big bubble for the character's current AFK Target from the pairing table (TR-4); if none is unlocked, no Goal on that character (the brew Goal's why line covers it). A slot holding a big bubble that fits none of the character's uses (for example a multi-log bubble on a fighter) fires "Swap <bubble> for <better>" when a better unlocked one exists. Both are `compounding`, confidence M (the pairing is authored, L in the dossier, and is the AFK-Target reading of the bubbles' own game text).
- **FR-25 (removed).** The empty second talent preset belongs to M9 (FR-7: "Set up your second preset for <role>"), which classifies preset roles; M6 has no preset Check (red-team #7).

**Idle system**

- **FR-26 Post Office unlock.** When the highest class level is ≥ 50 and no character has finished Postboy Pablob's quest, "Finish Postboy Pablob's quest: 5 Empty Boxes from Anvil Tab 2" on the character with the quest in progress (or the highest-level character if nobody started it). The why line mentions boxes already waiting, if any.
- **FR-27 Post Office orders.** Once unlocked, when a company has no order completed today, "Fill today's Post Office orders from storage" (Account). The orders refresh on the Post Office's own timer (`timeAway.PostOfficeRefresh`), not the shop restock, so urgency uses that timer (TR-6).

**Time and history**

- **FR-28** Each time-sensitive Check (keys, tickets, daily resets, Post Office refresh, pet pull, Darts and Hoops cooldowns, Spiketrap) returns `nextChangeAt`, the next moment its answer can change without a new save. The engine re-runs M6 at the earliest one, so a pet pull that becomes claimable mid-session appears without waiting for a save.
- **FR-29** Done is detected per Check from a later save by an explicit field change (TR-8), never from "the Check stopped firing". A Goal that stops firing only because time moved (Spiketrap's window closed) disappears without being marked done.
- **FR-30** M6 reports, per character, `spendCount`: the number of its non-`nice` M6 Goals. The engine uses it for the "then most to spend" part of Visit Order.

**W3 idle systems (D6)**

- **FR-31 Salt switched off.** From Stage W3-early on (the account has finished W2, so the Refinery is reachable), for each salt that is unlocked and not active: if Toolbox reports no missing fuel for it at its rank (`hasMissingMats`, which also covers the previous salt it burns), "Switch on <salt> in the Refinery"; otherwise "Get <n> more <material> to run <salt>" for the first missing input (the amounts are Toolbox's `quantity × floor(rank^1.5)` against `totalAmount`; ADR 0005 arithmetic on its numbers). Several off salts merge into one Account Goal, in Refinery order, with the first one's Next Action. Urgency `losing-now` (an off salt makes no power while the account is away). When the Death Note Check also fires and Explosive is the salt that is off, the why line says the Death Note's first level is paid in Explosive Salt. M6 never advises Auto Refine, ranks or salt balance (§2).
- **FR-32 Death Note building.** From Stage W3-early on, when Explosive Salt is unlocked and the Death Note building is at Lv 0: if it is not in a build slot, "Put the Death Note in a Construction build slot"; if it is in a slot and the account holds fewer Explosive Salts than its level-1 cost (Toolbox `towers.data[Death_Note].itemReq`, counted in storage and refinery storage), "Refine <cost> Explosive Salts for the Death Note's first level (have <n>)". When it is in a slot and the salts are held, the building finishes on its own and M6 shows nothing. Urgency `losing-now` (every fighter's kills earn no multikill until Lv 1). Account. Once the building is Lv ≥ 1 the Check is silent.

## 4. User stories

**Fixtures and conventions.** "W2-late account" is the private W2 fixture (Stage W2-late per the Leverage model §1.3: 5 characters, Barbarian 60, Squire 43, Shaman 44, Bowman 54, Wizard 56). "W3-early account" is the private W3 fixture (Stage W3-early: 6 characters, Wizard 73, Squire 51, Bowman 60, Squire 85, Barbarian 56, Shaman 54). In CI they run as M1's scrubbed copies (`scrubbed/w2.json`, `scrubbed/w3.json`); the scrubbed copies drop pet data, so the pet stories run locally only (TR-13). Unless a story says otherwise, **`now` = the fixture's last cloud save** and **Expected Return = 8 h** (the default). "Shows" means the `EngineResult` contains the Goal with that text, which M10 renders; every Then below is also a golden-snapshot line (M11).

**US-1 Don't lose banked keys and tickets.** As a player in a Play Session, I want to be told which keys and tickets are sitting at their NPCs, so that I collect them before the 3-day bank throws any away.
- Given the W3-early account / When the engine runs / Then the Squire Lv 85 row shows one Goal "Collect 6 boss keys (4 Forest Villa, 2 Efaunt's Tomb)" with urgency `banked` (it fires on the 2-day threshold; 2 days + 8 h is still under the 3-day cap), and no other character shows a key Goal (the active character, the Shaman Lv 54, cannot collect either key).
- Given the W3-early account / When the engine runs / Then the Account section shows "Collect 4 Colosseum tickets" (Lonely Hunter 3, Typhoon 1, Centurion 0), and its Next Action says "one NPC has been capped for 2 days".
- Given the W2-late account / When the engine runs / Then no key Goal shows (Forest Villa is 1 day banked, Efaunt and Chizoar earn 0 a day), and the Account section shows "Collect 5 Colosseum tickets" (Typhoon 3, Centurion 2) with "one NPC has been capped for a day". Lonely Hunter is not counted: the account has not finished W2, although its day counter reads 4.
- Given the W2-late account and Expected Return 72 h / When the engine runs / Then "Collect 4 Forest Villa keys" appears with urgency `lost-before-return` (1 day plus 3 resets before the return is 4, one day past the cap), on the Barbarian Lv 60 (the last-played character, and eligible). With Expected Return 48 h it does not show: 1 + 2 resets reaches the cap but loses nothing.
- Given the W3-early account / When a later save shows Forest Villa and Efaunt `daysSincePickup` below the values the Goal fired on (0, or 1 if a reset passed before the save) / Then the Goal moves to "Done this session".

**US-2 Use the free dailies.** As a player in a Play Session, I want the daily freebies that don't bank listed, so that I stop throwing them away.
- Given the W2-late account / When the engine runs / Then the Account section includes "Claim your free pet pull at Doggy" with "claimable since about 15h ago", urgency `losing-now`.
- Given the W3-early account / When the engine runs / Then no pet-pull Goal shows, and M6's `nextChangeAt` for it is about 11h 13m after the save.
- Given the W3-early account and `now` = save + 12 h / When the engine re-runs on that timer (no new save) / Then "Claim your free pet pull at Doggy" appears.
- Given either account / When the engine runs / Then "Claim today's free Pet Mart gems" shows (shop day 241, last claimed 0), with confidence M.
- Given the W2-late account (it holds the ingredient of at least one level-0 vial) / When the engine runs / Then "Use your 11 vial attempts on the W2 town cauldron" shows with urgency `banked` (the daily reset is about 23h 43m away, after the return). With Expected Return 24 h, the same Goal shows with urgency `lost-before-return`.
- Given the W3-early account / When the engine runs / Then no vial Goal shows (0 of 17 left).
- Given the W3-early account and Expected Return 24 h / When the engine runs / Then "Use today's 4 minigame plays" shows (reset in about 12h 33m), naming an open highscore Milestone. With Expected Return 8 h it does not show.
- Given the W2-late account / When the engine runs / Then "Spiketrap starts at :00: up to 40 gems today" shows in category `nice` (13 min to the hour, gems unclaimed); with `now` = save + 20 min it does not show, and it is not marked done. Given the W3-early account / Then it also shows (15 min to the hour, gems unclaimed).

**US-3 Darts and Hoops.** As a player in a Play Session, I want a nudge to play Darts and spend its points, so that the highest-Leverage minigame keeps compounding.
- Given the W2-late account (29 Darts points, 7 Hoops points, every upgrade at level 0) / When the engine runs / Then the Account section includes "Spend 29 Darts points (next DMG level costs 2)" (DMG unlocks at 0 total levels) and "7 Hoops points unspent" in category `nice`, with no Hoops cost.
- Given the W3-early account / When the engine runs / Then no Darts spend Goal shows (2 Darts points against a next cost of 5) and no Hoops stock line (0 points), and "Play one round of Darts" and "Play one round of Hoops" show because both are off cooldown.
- Given a Darts Goal "Play one round" is showing / When a later save in the same Play Session shows `OLA[440]` (plays today) up by 1 / Then it is marked done and does not return in this Play Session even when the cooldown ends (D3).

**US-4 Spend the brew.** As a player in a Play Session, I want to know my brew is banked, so that it turns into bubbles instead of sitting there.
- Given the W2-late account / When the engine runs / Then the Account section shows "Spend banked brew in Quicc, High-IQ and Kazam: about 10 new bubbles" (Power is left out: under 1 expected bubble), and the why line says Kazam's next bubble, Level Up Gift, is a big bubble for the account's 4 fighters.
- Given the W3-early account / When the engine runs / Then it shows "Spend banked brew in all 4 cauldrons: about 7 new bubbles".
- Given a save in which every cauldron's `expectedBubbles` is below 1 / When the engine runs / Then no brew Goal shows.

**US-5 Fill big-bubble slots.** As a player in a Play Session, I want each character told which big bubble to equip, so that no slot sits empty.
- Given the W2-late account / When the engine runs / Then the Squire Lv 43 (Mining Copper) row shows "Equip Wyoming Blood in a big-bubble slot", and the other 4 characters (all fighting) show no bubble Goal, because no fighting big bubble is unlocked yet.
- Given the W3-early account / When the engine runs / Then the Shaman Lv 54 (Fighting) row shows "Equip Level Up Gift and Hammer Hammer (2 empty big-bubble slots)".
- Given the W3-early account / When the engine runs / Then the Wizard Lv 73 (Fighting, with Molto Loggo equipped) row shows "Swap Molto Loggo for Hammer Hammer: Molto Loggo only works while Choppin".
- Given the W3-early account / When the engine runs / Then the Barbarian Lv 56 (Fishing, Sploosh Sploosh and Hammer Hammer) row shows no bubble Goal.
- Given the W3-early account mutated to own the Sheepie companion ("all big bubbles count as equipped") / When the engine runs / Then no character shows a bubble Goal. With companion data unknown, the bubble Detector returns `unknown` (TR-6).

**US-6 Spend merits and unlock points.** As a player in a Play Session, I want unspent merits and unlock points flagged with what to buy first, so that the Task Board pays off.
- Given the W2-late account / When the engine runs / Then the Account section shows "Spend 12 W1 merits" and "Spend 2 task unlock points". Once the W1 merit Priority List is mapped to row ids (R6), the merit Goal also names the first unmaxed row of that list (PV 7.1) and this line of the golden snapshot is updated in the same PR.
- Given the W3-early account / When the engine runs / Then it shows "Spend 1 W2 merit: All Yum-Yum Desert mobs respawn faster" (the first unmaxed row of PV 7.2's corrected order: Obol and AFK gains are maxed), "Spend 10 task unlock points", and a W3 merits Goal "Spend 3 W3 merits" with the "sources disagree" badge (Telekinetic and Library vs Build/Food slots, PV 7.3) that is never first in the Account section.

**US-7 Unspent gems.** As a player in a Play Session, I want to know my gems are idle and what the community buys, so that I'm not hoarding them for nothing.
- Given the W2-late account (628 gems, nothing bought; Stage W2-late) / When the engine runs / Then the Account section shows "Crystal 3D Printer: 628 of 875 gems" in category `nice`, with no buy Next Action and no Contested first-buy line at position 1.
- Given the W3-early account (365 gems, no Crystal 3D Printer) / When the engine runs / Then it shows "Crystal 3D Printer: 365 of 875 gems", category `nice`.
- Given a W2-mid account with 400 gems and nothing bought / When the engine runs / Then it shows "400 gems unspent" with the "sources disagree" badge and both sides (Infinity Hammer first; Extra Card Slots and the Crystal 3D Printer first), never as the first Account Goal.
- Given a W3 account with 900 gems and no Crystal 3D Printer / When the engine runs / Then it shows "Buy the Crystal 3D Printer (875 gems)" as a normal Next Action.

**US-8 (removed).** The empty second preset is M9's (FR-25); its stories live in M9.

**US-9 Post Office.** As a player in a Play Session, I want to know the Post Office is waiting for me, so that the account starts earning boxes.
- Given the W2-late account / When the engine runs / Then the Barbarian Lv 60 row (quest in progress) shows "Finish Postboy Pablob's quest: 5 Empty Boxes from Anvil Tab 2".
- Given the W3-early account / When the engine runs / Then the Squire Lv 85 row shows the same Goal, with the why line "4 boxes are already waiting on every character". No "Spend Post Office boxes" Goal shows, because the Post Office is not unlocked.
- Given a save where the quest is done and a character has 4 unspent boxes / When the engine runs / Then that character shows "Spend 4 Post Office boxes: Civil War Memory Box first" (Barbarian; per-class box per PV 3.5).

**US-10 Anvil points.** As a player in a Play Session, I want unspent anvil points on any character flagged, so that every anvil runs at full speed.
- Given the W3-early account / When the engine runs / Then the Bowman Lv 60 row shows "Spend 3 anvil points on Speed", and no other character does.
- Given the W2-late account / When the engine runs / Then no anvil-point Goal shows.

**US-11 Poppy.** As a player in a Play Session, I want to know Poppy has fish waiting, so that they convert before I leave. (The Arcade ball cap is M3's, FR-24.)
- Given either account / When the engine runs / Then "Open Poppy's pond to convert your fish" shows once, in category `nice`; after a later save in the same Play Session shows `pendingFish` dropped, it is done.

**US-12 Ranking.** As a player in a Play Session, I want what will be lost first at the top, so that a short session still saves the most value.
- Given the W2-late account / When the engine runs / Then M6's Account Goals rank in this order: free pet pull (20 s) and Colosseum tickets (60 s), the two `losing-now` items ordered by effort; then Spiketrap (`lost-before-return`, deadline in 13 min), then Play Darts and Play Hoops (`lost-before-return` with no deadline, 120 s each, tied and ordered by entry id) (TR-9). The position-3 Goals (Pet Mart gems, vials, merits, unlock points, Darts spend, the Hoops stock line, brew, Poppy, the printer progress) follow. M10 merges these with M3's Account blockers (the Arcade, Water), which come first, and caps what is visible.
- Given any fixture / When the engine runs / Then no M6 Goal is a Verdict blocker, and every character's Verdict is identical with M6 switched off.

**US-13 Unknown, not wrong.** As a player in a Play Session, I want missing data to stay quiet rather than produce bad advice, so that I can trust what's shown.
- Given the scrubbed W2 save with the companion side read removed / When the engine runs / Then no free pet pull Goal and no bubble Goal shows, `diagnostics.failedDetectors` lists the pet pull and big-bubble Detectors with "companion data unavailable", and no Verdict changes. Given the tournament side read removed instead, only the Pet Mart Detector is listed (it reads the tournament and server vars, not companions).
- Given the W3-early account with the `alchemy` parser section forced to fail / When the engine runs / Then no brew, vial or bubble Goal shows, and those Detectors are listed as unknown.

**US-14 Switch the W3 engine on (D6).** As a player in a Play Session, I want to be told when a salt is switched off or the Death Note building is still at level 0, so that the Refinery and multikill start paying while I'm away.
- Given the W3-early account (Explosive unlocked and off; its rank-1 fuel is 10 Bullfrog Horn, 5 Forest Fibres and 2 Redox Salts, and the account holds 9 Bullfrog Horn) / When the engine runs / Then the Account section shows "Get 1 more Bullfrog Horn to run Explosive Salt" with urgency `losing-now`, and its why line says the Death Note's first level is paid in Explosive Salt. Redox (active) is not named. Mutated to hold 10 Bullfrog Horn, the Next Action becomes "Switch on Explosive Salt in the Refinery".
- Given the W3-early account / When the engine runs / Then the Account section shows "Refine 10 Explosive Salts for the Death Note's first level (have 0)" (the building is Lv 0, in a build slot, and the account holds no Explosive Salt), urgency `losing-now`. Mutated to hold 10 Explosive Salts, no Death Note Goal shows.
- Given the W2-late account / When the engine runs / Then neither Goal shows, although the save lists Redox as unlocked and inactive: the Stage is W2-late, and the Refinery is a W3 System.
- Given the W3-early account / When a later save shows Explosive active / Then the salt Goal moves to "Done this session"; when a later save shows the Death Note at Lv 1, so does the Death Note Goal.

## 5. Technical requirements

### TR-1 Package boundaries

| Package | M6 parts |
|---|---|
| `packages/account-state` | The fields in TR-3, added through M1's TR-11 process (`types.ts`, `adapter.ts`, `FIELD_SOURCES`, `FIELD_SECTIONS`, `schemaVersion` bump). |
| `packages/knowledge` | `systems/{boss-keys,colosseum,alchemy-bubbles,alchemy-vials,merit-shop,task-unlocks,gem-shop,pets,minigames,post-office,anvil,poppy,refinery,death-note}.yaml` (authored entries), the generated facts they reference (TR-5), and the Detectors in `detectors/<system>/*.ts` (M11 TR-1 layout), registered by id `<system>/<name>`. No Toolbox import: Detectors read only the Account State (M1 TR-11). |
| `packages/engine` | Nothing M6-specific beyond the ranking inputs (TR-9) and the `nextChangeAt` timer. |
| `apps/activeon` | Nothing M6-specific. M10 renders M6 Goals like any other. |

### TR-2 Detector contract (M11 TR-4)

M6 Detectors implement M11's `Detector<'check', …>` exactly: `DetectorContext` (`state`, `history: readonly HistoryEntry[]`, injected `now`, `expectedReturnMs`, `facts.get(id)`), `CheckFinding` (`subject: {kind, index}`, `slots`, `result: 'fires' | 'unknown'`, optional `at`), ids `<system>/<name>`, declared `reads`, and `examples.fires` / `examples.silent` on fixtures. Stage gating is the entry's `appliesTo` (the engine skips an entry whose Stage doesn't apply), not a Detector input. "Session start" and "previous save" are derived from `history` with M1's Play Session rule. Every M6 Check sets `usesExpectedReturn: true` where its urgency reads the return.

M6 needs four additions to M11's schema, to land in M11 before M6 is built (§7):

| Addition | Where | Used for |
|---|---|---|
| `urgency: 'losing-now' \| 'lost-before-return' \| 'banked'` and `deadline?: number` (epoch ms the value is lost) | on a firing `CheckFinding` | TR-9 position and sort |
| `nextChangeAt?: number` | Detector result (one per run, earliest) | FR-28 re-run timer |
| `effortSeconds`, `doneWhen`, `affectsVerdict: false`, `priority: { frame: by-urgency }` | entry YAML schema (zod) | TR-8, TR-9, R9 |
| `doneKey` | on a firing `CheckFinding` | TR-8 |

Rules (as M11): pure, deterministic, no I/O, no clock reads other than `now`; must not throw on a well-typed Account State (a throw is caught and reported as a failed Detector); `params` come from the entry's YAML.

### TR-3 Account State fields M6 needs (additions; M1 TR-11)

All paths are relative to the parsed Toolbox output `{account, characters}` at the pin. `null` means "not in this save" and makes dependent Detectors return `unknown`.

```ts
export interface AccountSummary {
  // ...M1 fields
  highestLevel: number;                                   // max(characters[].level)
  dailyResetInSeconds: number | null;                     // timeAway.ShopRestock, at lastCloudSave
  alchemy: null | {
    cauldrons: Array<{ id: 'power'|'quicc'|'high-iq'|'kazam'; attempts: number;
      newBubbleChance: number; expectedNewBubbles: number;  // Toolbox newBubble.chance / .expectedBubbles
      unlockedBubbles: number; nextBubble: string | null }>; // bubbles[c][unlockedBubbles].bubbleName
    unlockedBigBubbles: string[];                          // bubblesFlat with level ≥ 1 and an active flag (TR-5)
    vialAttempts: { current: number; max: number };        // alchemy.p2w.vialsAttempts
    vialAttemptsUsable: boolean;                          // a level-0 vial's itemReq is held (Toolbox vialsAttempts alert rule)
  };
  bigBubbleSlots: number | null;                           // 1 + bribes[Changing_the_Code].done + (arena wave ≥ 100)
  merits: null | Array<{ world: 1|2|3|4; unspent: number;  // tasks[4][w] (raw), meritsDescriptions[w-1]
    rows: Array<{ index: number; level: number; max: number; cost: number }> }>;
  taskUnlocks: null | { owned: number; bought: number; openUnbought: number };
  gems: number | null;                                     // currencies.gems
  gemPurchases: number[] | null;                           // gemShopPurchases (index → count)
  keys: null | Array<{ id: 'forest-villa'|'efaunt'|'chizoar'; perDay: number; daysSincePickup: number | null; banked: number }>;
  colosseumTickets: null | Array<{ npc: 0|1|2; reachable: boolean; daysSincePickup: number; banked: number }>; // OLA[15,35,56]; reachable = npc 0 || finishedWorlds[World<npc>]
  minigames: null | {
    plays: number;                                         // currencies.minigamePlays (OLA[33])
    highscores: { choppin: number; fishing: number; catching: number; mining: number };
    darts: CooldownGame; hoops: CooldownGame;
    spiketrap: { gemsAvailableToday: boolean; bestRound: number };  // OLA[7] == 1, OLA[201]
  };
  pets: null | { freeClaimAnchor: number; owned: number; sheepie: boolean };  // companions side read (M1 TR-8); sheepie = companion 4 owned (all big bubbles count as equipped)
  petMart: null | { lastClaimedShopDay: number; currentShopDay: number; gemsOffered: boolean }; // OLA[516], tournament.global.S, serverVars.GemPM_x
  postOffice: null | { unlocked: boolean; questInProgressOn: number[]; companiesNotDoneToday: number; refreshInSeconds: number }; // timeAway.PostOfficeRefresh
  poppy: null | { unlocked: boolean; pendingFish: number };  // kangaroo
  salts: null | Array<{ rawName: string; unlocked: boolean; active: boolean;     // refinery.salts[i] (D6)
    missingFuel: Array<{ rawName: string; need: number; have: number }> }>;        // Toolbox hasMissingMats at the salt's rank
  deathNoteBuilding: null | { level: number; inBuildSlot: boolean;              // towers.data[name=Death_Note].{level,inProgress} (D6)
    nextCost: { rawName: string; amount: number }; held: number };              // itemReq[0]; held in storage + refinery storage
}

export interface CooldownGame {
  points: number;                 // Darts OLA[434] / Hoops OLA[418]
  levels: number[];               // OLA[435..438] / OLA[419..422]
  nextCosts: Array<number | null>;// Toolbox getDartsData / getHoopsData cost per upgrade; null = locked
  cooldownSecondsAtSave: number;  // OLA[439] / OLA[423]; ≤ 0 = ready
  playsToday: number;             // OLA[440] / OLA[424]
}

export interface CharacterState {
  // ...M1 fields
  bigBubbles: Array<string | null>;                        // equippedBubbles[i].bubbleName
  npcProgress: { dogBone: number | null; djonnut: number | null; bellows: number | null };
  postOfficeUnspent: number | null;                        // postOffice.unspentPoints
  anvilPointsAvailable: number | null;                     // anvil.anvilStats.availablePoints
}
```

OLA reads go through a named table in `adapter.ts` (`OLA.DARTS_POINTS = 434`, …) that cites Toolbox's `data/account-options-enum.js` where it names the index, and the dossier's N.js offset where it does not. A contract test asserts each index's type and range on every fixture, **and** snapshots each index's value per fixture, so two neighbouring day counters that swap in a patch (same type, same range) still fail (R8).

### TR-4 Knowledge Base entries

Shape per [#11](https://github.com/YassSoliman/idleon-forge/issues/11): YAML, one file per System, compiled to JSON and schema-checked in CI. Every entry has `id`, `system`, `type`, text template, `why`, `sources[]`, `appliesTo`, `confidence`, `status`. **G** = generated from Toolbox data at each parser re-sync (ADR 0007); **A** = authored.

| Entry id | Type | Detector | Gen/Auth | Notes |
|---|---|---|---|---|
| `boss-keys.collect` | Check | `boss-keys/banked` | A (thresholds, why); authored Toolbox-code constants (bank cap 3 days, collector dialogue thresholds, TR-5) | Fires at ≥ 2 days or a day lost before return |
| `colosseum.collect-tickets` | Check | `colosseum/tickets-banked` | A; authored Toolbox-code constants (cap, reach rule, TR-5) | |
| `alchemy-vials.daily-attempts` | Check | `alchemy-vials/attempts` | A | W2-early+ |
| `minigames.daily-plays` | Check | `minigames/daily-plays` | A (Milestone list, D4); G (Milestone scores from `quests.json`, achievements) | Category `nice` |
| `minigames.spiketrap` | Check | `minigames/spiketrap` | A; G (gem table) | `nice` |
| `pets.free-pull` | Check | `pets/free-pull` | A; authored Toolbox-code constant (594e6 ms period, TR-5) | Needs `_comp` side read |
| `pets.mart-gems` | Check | `pets/mart-gems` | A | Confidence M (R2) |
| `minigames.darts-play`, `minigames.hoops-play` | Check | `minigames/cooldown-play` | A | D3 |
| `minigames.darts-spend`, `minigames.hoops-spend` | Check | `minigames/cooldown-spend` | A (order: DMG until 40 total, then TALENT and DMG, then VAULT, per the minigames dossier); authored Toolbox-code constants (unlock thresholds 0/40/150/250 and 0/12/80/200, TR-5) | |
| `alchemy-bubbles.spend-brew` | Check | `alchemy-bubbles/brew` | A; G (bubble names, active flag) | Leverage W2-mid 4 |
| `alchemy-bubbles.fill-slot`, `alchemy-bubbles.wrong-fit` | Check | `alchemy-bubbles/big-bubbles` | A (pairing table below); G (active flag, cauldron index) | Fill 3c |
| `merit-shop.spend-w1` … `spend-w4` | Check + Priority List | `merit-shop/unspent` | A (order per PV 7.1, 7.2, 7.4; W3 Contested per 7.3); G (row costs, max levels, row text) | Order references rows by generated **row id**, never by a guide's nickname (R6) |
| `task-unlocks.spend` | Check | `task-unlocks/unspent` | A | |
| `gem-shop.unspent` + Priority List `gem-shop.order` | Check + Priority List | `gem-shop/unspent` | A (both PV 7.5 sides, Contested); G (prices, item indices) | D2 |
| `post-office.unlock`, `post-office.daily-orders`, `post-office.spend-boxes` | Check | `post-office/state` | A (per-class first box, PV 3.5); G (Lv 50 gate, quest id) | Fill 3h |
| `anvil.spend-points` | Check | `anvil/points` | A (Speed first, PV 3.1) | Fill 3h |
| `poppy.open` | Check | `poppy/pending-fish` | A | `nice` |
| `refinery.salt-off` | Check | `refinery/salt-off` | A (why); G (salt display names, Refinery order) | Leverage 1f, D6; `appliesTo.stage: ">=W3-early"` |
| `death-note.build` | Check | `death-note/build` | A (why); G (building index and name) | Leverage 1g, D6; `appliesTo.stage: ">=W3-early"` |

**Example (authored), `packages/knowledge/systems/boss-keys.yaml`:**

```yaml
- id: boss-keys.collect
  system: boss-keys
  type: check
  detector: boss-keys/banked
  params: { fireAtDays: 2, bankCapDays: 3 }               # authored constant, Source: Toolbox misc.ts (TR-5)
  category: spendable
  priority: { frame: by-urgency }             # position 1 when losing-now or lost-before-return, else 3 (TR-9)
  effortSeconds: 60
  text: "Collect {total} boss keys ({breakdown})"
  why: "Keys bank at the NPC for 3 days at most; anything past that is lost."
  doneWhen: { field: account.keys[*].daysSincePickup, becomes: 0 }
  appliesTo: { stage: ">=W1-late", classes: any }
  confidence: H
  status: active
  sources:
    - { label: "game code (N.js v1.23)", url: "https://www.legendsofidleon.com/ytGl5oc/N.js", tier: 1, verifiedOn: 2026-10-17, gameVersion: "2.3.540" }
    - { label: "Toolbox misc.ts KeysAll", url: "https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/misc.ts#L593", tier: 1, verifiedOn: 2026-10-17, gameVersion: "2.3.540" }
    - { label: "PV 7.14", url: "https://github.com/YassSoliman/idleon-forge/blob/research/priority-verification/docs/research/2026-10-17-priority-verification.md", tier: 3, verifiedOn: 2026-10-17, gameVersion: "2.3.540" }
```

**Big-bubble pairing table (authored, `alchemy-bubbles.yaml`, confidence M).** From the W2 dossier's AFK Setup table, which pairs each big bubble with the AFK Target its own game text names. Ordered best-first within a row; a Detector picks the first one that is unlocked and not already equipped.

| Use | Big bubbles, best first |
|---|---|
| Mining | Wyoming Blood |
| Fishing | Sploosh Sploosh |
| Choppin | Molto Loggo |
| Catching | Bug² |
| Fighting | Grind Time, Kill Per Kill, Level Up Gift, Big Game Hunter |
| Any character with an anvil product (every character) | Hammer Hammer |
| W3 skills (Construction, Trapping, Worship roles, from M2 Roles) | Call Me Bob, Call Me Ash, Call Me Pope |

"Wrong fit" = an equipped big bubble whose row matches none of the character's uses (its AFK Target, Hammer Hammer, its Role's W3 skill).

**Skill-minigame open Milestones (authored, `minigames.yaml`, confidence L, checked in order):** Choppin score 20 (Funguy quest, if not done); Fishing highscore below the Barbarian BOBBIN' BOBBERS cap (only if a Barbarian-line character exists); Choppin next multiple of 25 (only if a Mage-line character exists); Catching Goldric "Hoopsies" (if the quest is not done); the Mining yellow-vein achievement (if not complete). If none is open, the plays Check does not fire.

### TR-5 Generated facts M6 needs (ADR 0007)

Produced by M11's generator from the pinned Toolbox **data** (`website-data`) at every re-sync, into `packages/knowledge/generated/`: bubble catalogue (name, rawName, cauldron, index, active/passive; the pairing table keys on `rawName`, since display names such as Bug² are mangled in the data); merit rows per world (id, text, cost, max; rows with a null cost are placeholders and are left out); gem shop items (index, price, increment, max); Post Office unlock (highest Lv 50, quest `Postboy_Pablob1`); talent preset unlock level (15); Refinery salt catalogue (raw name, display name, order); Construction building catalogue (index, name; the Death Note is index 2). An authored entry referencing a generated id that disappears after a re-sync fails CI (M11).

**Toolbox-code constants (authored, not generated).** Some facts M6 needs live in Toolbox's TypeScript, not its data, so the generator cannot produce them: the key and ticket bank cap (3 days, `misc.ts`), the ticket reach rule (`areKeysOverdue`), the pet free-pull period (594,000,000 ms, `helpers.js`, found by experiment), the Darts and Hoops unlock thresholds (0/40/150/250 and 0/12/80/200, `highScores.ts`). Each is an authored constant whose Source is the Toolbox file and line at the pin. M12's re-sync diffs those exact lines and fails when one changes, so a patch can't move them silently (ADR 0007's intent, by other means).

### TR-6 Detector logic (each one, with its done predicate)

Time at `now`: for any counter saved at `lastCloudSave`, the Detector uses `elapsed = (now − lastCloudSave)/1000` s, clamped at 0. `resetAt` = `lastCloudSave + dailyResetInSeconds·1000`, rolling forward by 24 h; `resetsBefore(t)` = how many resets fall between `lastCloudSave` and `t`. **If `resetsBefore(now) ≥ 1`, a daily reset happened since the save**: daily counters are treated as refilled (vial attempts = max, plays = pool size, cooldowns ready, Spiketrap flag set, Pet Mart re-offered), and each `daysSincePickup` is taken as `+ resetsBefore(now)`. The counter is never capped; only the banked amount is (`min(days, 3)`). Post Office orders use their own `postOffice.refreshInSeconds` the same way. "Before return" means `< now + expectedReturnMs`. `deadline` (TR-2) is the moment the value starts to be lost: the next reset for a daily item, the reset that takes a bank past its cap, the top of the hour for Spiketrap; a cooldown play and a `losing-now` item have none.

| Detector | Fires when | Urgency | `nextChangeAt` | Done when (later save vs the save it fired on) |
|---|---|---|---|---|
| `boss-keys/banked` | per key: `perDay > 0` and (`days ≥ 2` or `days + resetsBefore(return) > 3`); place by TR-7 | `losing-now` if `days > 3`; else `lost-before-return` if `days + resetsBefore(return) > 3`; else `banked` | next daily reset | that key's `daysSincePickup` is below its value on the save the Goal fired on (a reset before the next save leaves it at 1, not 0) |
| `colosseum/tickets-banked` | per **reachable** NPC (FR-8), same rule; the merged count covers every reachable NPC | same | next daily reset | every fired NPC's `daysSincePickup` is below its fired value |
| `alchemy-vials/attempts` | `current > 0 && vialAttemptsUsable` | `lost-before-return` if `resetAt` before return, else `banked` | `resetAt` | `current` lower than at firing (a reset alone never counts, TR-8) |
| `minigames/daily-plays` | `plays > 0`, `resetAt` before return, an open Milestone exists | `lost-before-return` | `resetAt` | `plays` lower |
| `minigames/spiketrap` | `gemsAvailableToday` and the next top of the hour is within 20 min | `lost-before-return` | next :00 − 20 min, or :00 | `gemsAvailableToday` false |
| `pets/free-pull` | `freeClaimAnchor + 594e6 ≤ now` | `losing-now` | `freeClaimAnchor + 594e6` if in the future | `freeClaimAnchor` increased |
| `pets/mart-gems` | `gemsOffered && currentShopDay ≥ 1 && lastClaimedShopDay < currentShopDay` | `lost-before-return` if `resetAt` before return, else `banked` | `resetAt` | `lastClaimedShopDay == currentShopDay` |
| `minigames/cooldown-play` | the game is unlocked (any upgrade level > 0 or a best score > 0), cooldown remaining at `now` ≤ 0, and `playsToday` has not risen since the session's first save | `lost-before-return` (cooldown time is being wasted) | cooldown end | `playsToday` rose (D3: then no refire this Play Session) |
| `minigames/cooldown-spend` | Darts: `points ≥` the lowest Toolbox cost among upgrades with total levels ≥ `pointsToUnlock`. Hoops: `points > 0`, stock line only (FR-15) | `banked` | none | `points` lower or a level rose |
| `alchemy-bubbles/brew` | any cauldron `expectedNewBubbles ≥ 1` | `banked` | none | `unlockedBubbles` rose in a firing cauldron |
| `alchemy-bubbles/big-bubbles` | Sheepie not owned (`pets.sheepie` false; `unknown` if `pets` is null), and an empty slot with a fitting unlocked bubble, or a wrong fit with a better one | `banked` | none | the slot holds the named bubble, or the AFK Target changed (then re-evaluated, not done) |
| `merit-shop/unspent` | per world: `unspent > 0` and `unspent ≥` min cost of unmaxed rows with a non-null cost | `banked` | none | `unspent` lower |
| `task-unlocks/unspent` | `owned − bought > 0` and `openUnbought > 0` | `banked` | none | `bought` rose |
| `gem-shop/unspent` | `gems > 0`; form by FR-21 (D2) | `banked` | none | `gemPurchases` changed |
| `post-office/state` | unlock: `highestLevel ≥ 50 && !unlocked`; orders: `unlocked && companiesNotDoneToday > 0`; boxes: per character `postOfficeUnspent > 0 && unlocked` | `banked`; orders `lost-before-return` if the Post Office refresh falls before return | Post Office refresh (orders) | unlocked true; companies done; unspent lower |
| `anvil/points` | per character `anvilPointsAvailable > 0` | `banked` | none | value lower |
| `poppy/pending-fish` | `unlocked && pendingFish > 0` and not converted since `history.sessionStart` | `banked` | none | `pendingFish` dropped |
| `refinery/salt-off` | `appliesTo` ≥ W3-early, and any salt with `unlocked && !active`; Next Action by `missingFuel` (FR-31) | `losing-now` | none | every salt it named is `active` |
| `death-note/build` | `appliesTo` ≥ W3-early, Explosive (`salts[1]`) unlocked, `level == 0`, and (not in a build slot, or `held < nextCost.amount`) | `losing-now` | none | `level ≥ 1`, or `held` rose to cover the cost (then the Goal is done and the build finishes itself) |

Each Detector also checks its unlock: keys need the quest line, Darts and Hoops need an upgrade level > 0 or a best score > 0, Poppy needs the Secret Map (its upgrades or totals are non-zero), vials and bubbles need W2, salts and the Death Note need Stage ≥ W3-early (the save reports the first salt as unlocked on every account, so `unlocked` alone is not a gate). A not-yet-unlocked System is silent, not unknown.

### TR-7 Placement (#10 item 6)

- A Goal that any character can do goes to the Account section: tickets, vials, brew, merits, unlock points, gems, pets, Darts, Hoops, Spiketrap, plays, Poppy, Post Office orders, salts, the Death Note building.
- A Goal that needs a specific character goes on that character: big bubbles, Post Office boxes, anvil points (their own), the Post Office quest (the character with it in progress), and **keys**, which go to a character eligible to collect (Dog Bone dialogue > 5 for Forest Villa; Djonnut > 6 for Efaunt, the collector threshold, which is stricter than the > 5 that earns keys, R1; Bellows > 8.5 for Chizoar).
- **Choosing that character** must not depend on Visit Order (Visit Order uses M6's `spendCount`, so that would loop): the last-played character (M1 FR-19 `lastPlayedCharacterIndex`) if it is non-null and eligible, else the eligible character with the highest level, ties to the lowest index.

### TR-8 Done detection

Each entry carries `doneWhen`, evaluated by the engine on the first save newer than the one the Goal was shown on (M1 `history.previous`). Only an explicit change counts. A Goal that stops firing for any other reason (time passed, AFK Target changed, a section failed) is dropped silently. Pastes have no history: done is not detected in paste mode, and "once per Play Session" rules (D3, Poppy) treat the paste as the start of a session.

### TR-9 Ranking and categories

- M6 never emits `category: 'blocker'`.
- **Priority List position** (the Leverage model's shared frame, §3.0): `losing-now` and `lost-before-return` items take **position 1** (never-skip); `banked` items take **position 3** (free-value fills; spending stock costs nothing). Merits and gems name *what* to buy from their own per-world and gem Priority Lists, but the Goal itself sits at position 3. Within position 1, `losing-now` precedes `lost-before-return`, and `lost-before-return` items sort by `deadline`, soonest first, with no-deadline items last; only then do the tie-breaks apply. This needs M2's `Rankable` to carry the frame position from urgency, the deadline and `effortSeconds` (§7). Spiketrap with 13 min left therefore ranks above a cooldown play that can wait.
- **Tie-breaks** (#11 item 6, in order): cheapest = lowest `effortSeconds` (authored per entry: pet pull 20 s, Pet Mart gems 20 s, tickets 60 s, keys 60 s, vials 60 s, Darts and Hoops play 120 s, brew 120 s, merits 60 s, unlock points 60 s, Post Office boxes 60 s, anvil points 30 s, bubbles 30 s, preset 300 s, Spiketrap 180 s, plays 600 s, salt switch 30 s, Death Note 60 s; no preset entry: FR-25); then closest Milestone (none of M6's has one, so skipped); then most Goals per activity; then entry id, so the order is total and stable.
- **Categories** are display tags only (D1): `spendable` for banked currency and claims (keys, tickets, vials, plays, pets, Darts/Hoops, brew, merits, unlocks, gems, Post Office boxes and orders, anvil points); `compounding` for big-bubble slots, the Post Office unlock, salts and the Death Note building; `nice` for Spiketrap, Poppy, skill-minigame plays, the Hoops stock line, and a gem Goal with no affordable buy.
- **Contested** entries (W3 merits, the first gem buy) are never position 1 and never the first Account Goal (#11 item 5; M10 TR-9 asserts it).
- **Stale** entries rank below fresh ones at the same position (#10 item 10).

### TR-10 Output into `EngineResult` (M10 TR-2)

M6 adds `Goal`s to `characters[i].goals` and `account.goals`, with `goal.system` = the entry's system and `goal.milestone = null` except the gem printer progress Goal (D2), which uses `{unit: 'gems', current, next: 875, etaSeconds: null, stopHere: false}`. It adds `spendCount` per character for Visit Order, and `nextChangeAt` (earliest across M6) to the engine's scheduling list. It adds an Active Play entry only for skill-minigame plays when they fire (`estimateSeconds` 600), so a long minigame sitting never crowds out quick claims.

### TR-11 Performance

All M6 Detectors together: ≤ 3 ms on an 11-character Account State on a mid-range desktop, measured in the engine benchmark (M11), with no allocation proportional to save size (they read the compact Account State, never the 4–5 MB Toolbox object). The re-run on `nextChangeAt` costs one engine run, at most once a minute (the engine debounces timers to 60 s).

### TR-12 Security and privacy

- Detectors never put a character name into `slots`; subjects are indices (M10 TR-2). Why lines name classes ("your Barbarian"), never names.
- Pet data comes from the companions side read (M1 TR-8), which stays in the browser like the rest of the save (ADR 0006). Pet Mart and server vars are public game data.
- Report this (M10 TR-10) for an M6 Goal sends the entry id, action text, versions, Stage, and class and level only for character Goals, through M13's scrub.
- No Detector reads or exposes `uid`, email, guild ids or member lists.

### TR-13 Tests

- **Fires / doesn't fire per Detector** on both private fixtures (local), both scrubbed fixtures (CI) and the 11 public saves (CI), with `now` = last cloud save and ER 8 h, plus the ER and `now` variants in §4. The public W4–W7 saves must produce no crash and no Goal from a locked System.
- **Toolbox oracle tests:** where Toolbox has an alert for the same condition, our Detector must agree with it on every fixture, except documented quirks: `freeCompanion`, `petMartGems`; `areKeysOverdue` (Toolbox fires at 3 days, we fire at 2; assert ours ⊇ theirs, with the same ticket reach rule); `vialsAttempts` (same item gate, assert equal); `dailyShipments`; `unspentPoints` (anvil and Post Office); `missingBubbles` (ours counts the bribe slot and Toolbox's arena slot, and both honour Sheepie; assert ours ⊇ theirs). The Arcade alert is M3's oracle, not M6's.
- **Reset-crossing test:** the W2-late fixture with `now` = save + 24 h treats vial attempts as refilled and every `daysSincePickup` as +1 (uncapped: Typhoon reads 5, two days lost). A later save after a claim plus one reset (counter 1) still counts as done.
- **Golden snapshots** (M11): §4's Then lines are lines of the plain-text Now snapshot for each fixture, and §4 lists every M6 line each fixture produces at the default inputs, so the snapshot and the stories cannot drift.
- Tests never print names or raw values from private fixtures; assertions on private fixtures compare counts and class/level labels only.

## 6. States and edge cases

| State or case | What the player sees | How M6 handles it |
|---|---|---|
| Loading / first parse | Nothing from M6 until the engine result arrives | Engine runs after the parse (M10 TR-6) |
| Parse failure | "Can't read your save" (M1, M10); no M6 Goal | M6 never runs on a failed parse |
| Partial parse (e.g. `alchemy` failed) | Other Goals show; no brew, vial or bubble Goals | Those Detectors return `unknown`; listed in `failedDetectors`; **no Verdict changes** (R9) |
| Side read failed (companion, tournament, server vars) | No pet or Pet Mart Goals | `unknown`, same |
| Fresh account (W1-early) | Only Darts/Hoops (if found) and keys (once Dog Bone is done) | Unlock checks; locked Systems are silent |
| W2 account whose save lists Redox as unlocked | No salt Goal | Stage gate ≥ W3-early (TR-6), not the `unlocked` flag alone |
| Ticket NPC in a world not reached yet | Its counter isn't counted | FR-8 reach rule |
| A salt that is off but can't be fuelled | "Get N more <material> to run <salt>", never "switch on" | FR-31, Toolbox `hasMissingMats` |
| Sheepie owned | No big-bubble Goals | FR-24 |
| Bank counter read after a claim and a reset (1, not 0) | Done still detected | TR-6 done "below its fired value" |
| Merit world whose only unmaxed rows are placeholders | No merit Goal | FR-19, TR-5 |
| Nothing unspent | No M6 Goals; the Account section may be empty | Normal |
| Stale save (game closed for 9 h) | Time-based Goals reflect `now`, not the save time | TR-6 elapsed and reset-crossing rules |
| A daily reset happened after the save | Vial attempts and plays shown as refilled; banked days +1 | TR-6 |
| Clock skew (local clock behind the save) | Ages clamp at 0 (M1) | `elapsed` clamped at 0; nothing fires early |
| Game patched, parser behind | Banner (M1/M10); M6 still runs if the parse is clean | OLA contract test (R8) should fail in the weekly re-sync first; an out-of-range OLA value makes that Detector `unknown` |
| Stale Knowledge Base entry | "· Stale" label; ranks below fresh | TR-9 |
| Offline | Last good state; timers still re-run M6 | Time-based Goals update without a save; done waits for the next save |
| Multiple tabs | Same Goals in each tab | Pure function of the same inputs; done keys are per entry and subject |
| Second account on this browser | Its own Goals only | History is per uid (M1 FR-22) |
| Paste mode | Goals show; no done, "once per session" treats the paste as session start | TR-8 |
| Character created mid-session | New row; its Goals appear on the next save | M1 FR-11 |
| 11 characters, everything unspent | At most 3 Goals per character and 5 Account Goals visible; rest behind "show more" | M10 caps; M6 ranking keeps losses first |
| Expected Return changed | Urgency of keys, tickets, plays, vials, Pet Mart and orders re-evaluated within M10's budget | ER is an engine input |
| Darts played twice in one session | "Play Darts" gone after the first play | D3 |
| Character switches AFK Target mid-session | Bubble Goal re-computed for the new target | Not "done", just recomputed |
| Pet Mart not reachable on this account | Goal could be unactionable | R2: confidence M; verify before build |

## 7. Dependencies

| Module | What M6 needs | Interface |
|---|---|---|
| **M1 Sync & Account State** | The TR-3 fields (via M1 TR-11), `diagnostics.failedSections` / `failedSideReads` and `isKnown()`, `lastPlayedCharacterIndex` (FR-19, null on a tie), `lastCloudSave`, history (TR-2); the companion, tournament and server-vars side reads (already read per save). **The scrubber must keep the non-personal fields M6 reads**, including the companion ownership flags (Sheepie) and the free-pull anchor, so the bubble and pet stories run in CI. | `AccountState`, `SaveHistory` |
| **M2 Stage & Meta Path** | `stage` for `appliesTo`; Roles (which W3 skill a character serves, for bubble fit). **Three amendments to land in M2 before M6 is built:** (1) `Rankable` carries the frame position derived from a `by-urgency` entry's urgency (1 or 3), its `deadline` and `effortSeconds`, and the CI "one position per list" rule accepts a `by-urgency` frame entry (it lives in the shared frame, not a Stage list); (2) M2's W2-late story that puts vial attempts at position 1 at the default return follows D5 instead (position 3 until the reset falls before the return); (3) skill-minigame plays follow D4 (`lost-before-return`, position 1, only with an open Milestone), not position 3. | `StageId`, `rolesFor(classIndex)`, `Rankable` |
| **M3 AFK Safety** | **Ownership boundary:** M3 owns caps on a character's own production (food, carry, liquids, worship charge, anvil products, traps), empty Parallel Slots that can be filled now, Refinery fuel running dry (FR-26) and the **Arcade ball cap** (FR-24, an account blocker); M6 owns account banks not tied to an AFK Target, and has no Arcade Check. M3's draft also names M6 as owner of unfillable slots and caps to raise (trap set, printer level, anvil Capacity): M6 defines none of them in the MVP, open for Yasser (red-team #8). Engine dedupe: if M3 and M6 emit Goals with the same `system` and subject, M3's blocker wins and M6's is dropped. M3 tells M6 if an anvil product caps before return (FR-23). | `EngineResult` merge; `anvilCapsBeforeReturn(c)` |
| **M7 Spend Plan** | None from M6. M7 owns coins; gems are M6's (D2). M7's draft hands M6 an `unspent.coins-idle` Check and "farm the material" Goals for unready stamps; M6 defines neither. Open for Yasser (red-team #8): until ruled, neither Check exists and M7 must not link to them. | — |
| **M8 Collections** | None; cards and obols are M8's. M8 links its "obols don't drop" line to M6's W2 merit Goal (`merit-shop.spend-w2`). M8's draft also says M6 owns the Liquid Shop daily obols: under D6 they are "Not covered yet", so M8 must not link to a Liquid Shop Goal. | Goal id |
| **M9 Builds** | M9 owns every talent preset Goal, including the empty second preset (FR-25 removed). M6 emits no preset Goal, so there is no double advice. | — |
| **M10 Now screen UI** | Renders M6 Goals; must treat a failed M6 Detector as **not** affecting the Verdict (FR-39 says partial Detector failures turn characters Unknown: that must be limited to Detectors with `affectsVerdict: true`). Visit Order uses `spendCount`. Timers: the engine re-run on `nextChangeAt`. | `EngineResult`, TR-10 |
| **M11 Knowledge tooling** | Detector registry and contract (TR-2), the four schema and finding additions in TR-2 (`urgency`, `deadline`, `nextChangeAt`, `doneKey`; YAML `priority`, `effortSeconds`, `doneWhen`, `affectsVerdict`, false for all M6 entries), the fact generator (TR-5), fixture harness with injected `now` and ER, golden snapshots. | registry, schema, `accountStateOf(fixture, now)` |
| **M12 Release** | The weekly parser re-sync runs M6's OLA contract test (types, ranges and per-fixture value snapshots) and diffs the Toolbox lines behind TR-5's authored constants. | CI |
| **M13 Suggestions** | Report this on M6 Goals. | M10 TR-10 |

## 8. Decisions

Ruled by Yasser on 2026-10-17 (PR #53): every recommendation accepted as written.

- **D1 - Rank by #11's order everywhere; category is a display tag.** Verdict blockers, then the Stage Priority List position, then the arithmetic tie-breaks, for both character rows and the Account section. `spendable`, `compounding` and `nice` only label a Goal ("Spend · Keys"). *Why:* #11 is the later and more specific ruling, the Leverage model and both worked examples are built on it, and it is what lifts "will be lost before you're back" to the top, which is the point of M6. It is engine-wide, so it binds M3–M9 too. Touches FR-2, FR-5, TR-9, US-12.
- **D2 - Gems: a Contested count early, an agreed printer goal from W2-late.** From W1 to W2-mid, M6 shows only "N gems unspent" with both PV 7.5 sides behind the "sources disagree" badge, never first. From W2-late on, it shows a `nice` progress Goal "Crystal 3D Printer: N of 875 gems" while gems are short, and a normal Next Action "Buy the Crystal 3D Printer (875 gems)" once gems cover it. Once the printer is owned, the account falls back to the Contested count. *Why:* it gives an agreed action when one exists and never presents a disputed buy as advice; recommending the overlap (an Extra Card Slot) would be our inference, not a Source's ruling. Touches FR-21, TR-4, TR-6, TR-9, TR-10, US-7.
- **D3 - Prompt a Darts or Hoops play once per Play Session.** After the first play the "Play" Goal does not return in that Play Session, even when the cooldown ends. The spend Goal still fires whenever points cover the next level. *Why:* Darts is the highest-Leverage minigame (it feeds the Upgrade Vault and tab-1 talent points), so one nudge per session is worth it; a prompt every 90 s to 15 min would be noise. Touches FR-14, TR-6, TR-8, US-3.
- **D4 - Skill-minigame plays fire only when they would be lost and a Milestone is open.** The Check fires when the daily reset falls before the Expected Return and an open highscore Milestone exists, as a `nice` Goal plus an Active Play ("If you have time") entry. *Why:* a play is worth only minutes of AFK harvest; its value is in one-time Milestones (quests, achievements, class talents), and a short session should stay on the quick claims. Touches FR-10, TR-4, TR-6, TR-10, US-2.
- **D5 - Daily items that refill before you're back still show, at position 3.** Vial attempts, Pet Mart gems and Post Office orders show as `banked` (position 3) when the daily reset falls after the Expected Return, and rise to position 1 (`lost-before-return`) when it falls before. *Why:* they are quick and free, and "use them now" is never wrong; hiding them would keep the W2-late account's 11 unused vial attempts out of sight at the default 8 h return. Touches FR-9, FR-13, FR-27, TR-6, US-2.
- **D6 - Salts and the Death Note building join M6; the rest wait in "Not covered yet".** M6 gains two W3 Checks, both position 1: `refinery.salt-off` (a salt unlocked on a W3 account but switched off) and `death-note.build` (the Death Note building at Lv 0 once Explosive Salt is unlocked). Weekly items (Killroy, Bonus Ballot, weekly bosses), Random Events, Tournament and Raid registration, Pet Bonus Tokens, Pet Crystal buys, Orion upgrades, Arcade gold balls, the Equinox bar, Liquid Shop dailies and the Bargain Tag stay out of the MVP and appear in "Not covered yet" (M10 FR-26), to be assigned after the first 5 sessions. *Why:* they are the W3-early account's top two Leverage-model items (1f, 1g) and nothing else owns them; the others need numbers Toolbox doesn't compute (gold-ball costs), detection that is still wrong (the Equinox mirror, Leverage Q3), or are weekly and low-Leverage for W1–W3. Touches §1, §2, FR-31, FR-32, TR-1, TR-3, TR-4, TR-5, TR-6, TR-7, TR-9, US-14, §6.

## 9. Red-team notes

**R1. Toolbox quirks give wrong advice.** Toolbox counts Djonnut key earners at dialogue > 6 (the game uses > 5), prices Hoops upgrades with the Darts formula (`floor(2 + L/12)` against the game's `floor(3 + L/8)`, so it **understates** the cost), marks a Darts or Hoops upgrade `unlocked` only when its level is above 0, ignores the bribe slot in `missingBubbles`, and fires keys at 3 days. *Defence:* M6 reads the raw fields and states each quirk in FR-15, TR-6 and TR-7: earners at > 5, collectors at > 6; unlock from total levels against the thresholds; for Hoops, M6 states the stock and never a cost or a "spend" claim until the pin prices it correctly; bubble slots count the bribe; keys fire at 2 days. Oracle tests (TR-13) assert ours ⊇ Toolbox's where the quirk makes ours fire more, and equality elsewhere.

**R2. A Goal the player can't act on.** The Pet Mart sits in the Tournament lobby, and both accounts have never claimed its gems; we have not checked that a W2 account can reach it. The free pet pull and Pet Mart read RTDB data that the scrubbed CI fixtures drop. *Defence:* the Pet Mart entry ships at confidence M, and before M6 is marked done Yasser checks in game, on the W2-late account, that the Pet Mart claim is reachable (one line in the PR, no account data). If not reachable, the entry's `appliesTo` gets the real gate. Pet Detectors return `unknown` when the side read is missing, never "nothing to claim".

**R3. Noise.** The W2-late account fires about 15 Account Goals. A wall of chores trains the player to ignore the section. *Defence:* M10 shows 5, ranked by what's lost first; position 1 holds only real losses; quick claims tie-break first by effort; Darts/Hoops/Poppy prompt once per session (D3); skill-minigame plays need a reason (D4); Skip today and Not for me work on every M6 Goal; Spiketrap and Poppy are `nice`.

**R4. False "done".** Some Checks stop firing because time moved, not because the player acted (Spiketrap's window, a cooldown, a reset). Marking those done would lie in "Done this session". *Defence:* explicit `doneWhen` field changes per entry (TR-8); "stopped firing" is never done.

**R5. Time arithmetic on an old save.** `ShopRestock` and the cooldowns are countdowns at save time. If the save is 9 h old, or a daily reset happened since, raw values say "11 vial attempts" after the game already refilled, or "keys 2 days" when it's now 3. *Defence:* TR-6's elapsed and reset-crossing rules, a dedicated test at save + 24 h, and clock-skew clamping.

**R6. Merit advice named after the wrong row.** PV's merit orders use community nicknames ("Hemoglobin") that don't appear in the game's W1 row text (the W1 rows read inventory bag, respawn, EXP for the lowest, Goblet, boss keys, Amarok recipes, minibosses). Copying the nicknames would point at the wrong row. *Defence:* merit Priority Lists reference generated row ids (TR-4, TR-5); authoring each world's order is a Knowledge Base PR reviewed by Yasser or Joseph in game, and US-6 asserts row text, not nicknames. Until W1's list is mapped, its entry ships with `confidence: L` and the Goal says only "Spend 12 W1 merits".

**R7. Contested advice presented as fact.** The first gem buy and W3 merits are disputed; a careless Detector could name one side as the Next Action. *Defence:* `status: contested` on those Priority Lists; Contested entries never take position 1 or the first Account slot (TR-9, M10 TR-9 asserts it); D2 picks the one agreed gem action.

**R8. A patch moves an OLA index.** Darts, Hoops, Spiketrap, Pet Mart and tickets read `accountOptions[n]` by number, and indices can shift in a patch with no error. *Defence:* one named OLA table citing Toolbox's enum or the N.js offset (TR-3); a contract test checks each index's type and plausible range on every fixture, run by the weekly re-sync (M12); an out-of-range value makes the Detector `unknown`; every entry's patch tag makes it Stale after a patch until re-verified.

**R9. Unspent stock leaks into the Verdict.** #10 says spendables never change a Verdict, but M10's FR-39 turns characters Unknown when "some Detectors fail". An M6 failure (say the pet side read) could make a safe character Unknown. *Defence:* every M6 entry has `affectsVerdict: false`; M10 and the engine must only count `affectsVerdict` Detectors for Unknown (§7); US-12 and US-13 assert Verdicts are identical with M6 on, off or failing.

**R10. Bubble advice that's wrong for the player's plan.** The pairing table is our reading of the bubbles' own text (dossier L). A player may run Molto Loggo on a fighter on purpose before switching to Choppin. *Defence:* confidence M, `compounding` (never position 1), only a swap when a better unlocked bubble exists, recomputed when the AFK Target changes, and Not for me hides it until the next patch.

**R11. Double advice across modules.** M3 (liquids, anvil caps), M8 (empty card and obol slots), M9 (presets) and M6 all touch nearby things; the same issue could appear twice with different words. *Defence:* the ownership table in §2 and §7, and the engine dedupe on `system` plus subject with M3's blocker winning.

**R12. Privacy.** Why lines could be tempted to say "your <name> has 3 anvil points". *Defence:* subjects are indices, slots never carry names (TR-12), and the TR-13 tests on private fixtures compare counts and class/level labels only.

## 10. Red-team log

Independent red-team run on 2026-10-17 against this spec (with D1–D6 folded in), the glossary, the ADRs, the vendored Toolbox parsers at `6c37e3d`, the M1–M13 draft specs, the research dossiers, and aggregates from the two private fixtures. Each finding was checked against that evidence before a verdict. 22 findings: P0 2, P1 9, P2 8, P3 3. Verdicts: fixed 18, fixed in part 1 (its rejected sub-point is noted), deferred 2, rejected 1.

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| 1 | P0 | Ticket NPCs fire in worlds the account hasn't reached; W2-late "8 tickets, two capped" is wrong (Toolbox gates NPC *i* on `finishedWorlds[World i]` and hardcodes 1/day). | Fixed | FR-8 reach rule, `reachable` field, per-day gate dropped; US-1 now 5 tickets with one NPC capped (W2) and 4 (W3). |
| 2 | P0 | "Switch on Explosive Salt" can't run on the W3 fixture: 9 of the 10 Bullfrog Horn it needs, and it burns Redox. | Fixed | FR-31 checks Toolbox `hasMissingMats`; otherwise "Get 1 more Bullfrog Horn to run Explosive Salt"; US-14 and §6. |
| 3 | P1 | "Keep building the Death Note" is not a Next Action; the real blocker is 0 of 10 Explosive Salts. | Fixed | FR-32: slot it, or "Refine 10 Explosive Salts … (have 0)"; silent once the salt is held; US-14. |
| 4 | P1 | `by-urgency` positions, the sub-order and `effortSeconds` don't fit M2's `Rankable` or its one-position CI rule. | Fixed | §7 M2 amendment (1): frame position, deadline and effort on `Rankable`; frame entries exempt from the Stage-list rule. |
| 5 | P1 | TR-2's Detector contract contradicts M11's on nearly every field. | Fixed | TR-2 now adopts M11 TR-4 as is, with four listed additions for M11 to land first; ids renamed `<system>/<name>`. |
| 6 | P1 | The Arcade is M3's blocker (FR-24, M10 D9), so M6's Goal could never show; 38 h was wrong (cap is 48 h). | Fixed | FR-17, US-11's Arcade lines, the field, entry and Detector removed; ownership stated in §2 and §7. |
| 7 | P1 | The empty second preset is emitted by both M6 and M9 FR-7, and M6's "skilling Build" text is wrong for skillers. | Fixed | FR-25 and US-8 removed; M9 owns every preset Goal (§2, §7). |
| 8 | P1 | Other specs hand M6 Goals it doesn't define: coins-idle (M7), farm-the-material (M7), unfillable slots and caps (M3, M4, M5), salt rank-ups (M3). | Deferred | Product scope; §7 records each gap and that no one may link to them until ruled. Needs Yasser. |
| 9 | P1 | Sheepie makes all big bubbles count as equipped; bubble Goals become noise. | Fixed | FR-24 and TR-6 gate on `pets.sheepie`, `unknown` without companion data; M1 scrubber keeps the flag; US-5 case. |
| 10 | P1 | D2's printer Goal from W2-late picks the printer-first side over the Infinity-Hammer-first side of PV 7.5. | Deferred | Argues against ruled D2; D2 left as ruled. Needs Yasser. |
| 11 | P1 | M2's stories rank vials and minigame plays differently from D4 and D5; plays appear twice (Goal and Active Play). | Fixed in part | §7 M2 amendments (2) and (3) align M2 to the ruled D4/D5. The double surface is D4 as ruled ("a `nice` Goal plus an If you have time entry"): rejected. |
| 12 | P2 | Hoops cost understates (not overstates) the real cost; Toolbox's `unlocked = level > 0` would stop "Spend 29 Darts points". | Fixed | FR-15 unlock by total levels against thresholds; Hoops shows stock only; R1 rewritten; US-3. |
| 13 | P2 | Key/ticket urgency mixes a day counter with hours, and capping the counter erases lost days. | Fixed | FR-7 and TR-6 count resets before the return, never cap the counter; US-1 ER case moved to 72 h. |
| 14 | P2 | Vial done "or a reset passed" is time-based; keys never detect done after claim + reset; Post Office orders use the wrong timer. | Fixed | TR-6 done predicates "below the fired value"; FR-27 and TR-3 use `PostOfficeRefresh`; reset test extended. |
| 15 | P2 | Vial attempts fire with no ingredient held (Toolbox requires one). | Fixed | FR-9 and TR-3 `vialAttemptsUsable`; oracle now asserts equality. Checked: W2 fixture holds 8 of 80 locked vials' items. |
| 16 | P2 | Null-cost placeholder merit rows make `min cost` 0 and fire "Spend 0 merits". | Fixed | FR-19 and TR-5 drop null-cost rows; `unspent > 0` required; §6 row. |
| 17 | P2 | TR-5's "generated" facts (594e6 ms, 3-day cap, unlock thresholds) live in Toolbox code, not data; wrong pin; range-only OLA test misses swaps. | Fixed | TR-5 splits authored Toolbox-code constants with a re-sync line diff (M12); pin `6c37e3d`; OLA value snapshots (TR-3, R8). |
| 18 | P2 | Ranking by effort puts Spiketrap (13 min left) behind a play that can wait. | Fixed | TR-9 sorts `lost-before-return` by `deadline` first; US-12 order updated. |
| 19 | P2 | `activeCharacterIndex` no longer exists in M1 (now `lastPlayedCharacterIndex`, null on a tie). | Fixed | TR-7 and §7 use the new field with a highest-level fallback. |
| 20 | P3 | W3 golden lines miss Hoops play, Spiketrap and the Typhoon ticket. | Fixed | US-1, US-2, US-3 add them; TR-13 requires §4 to list every M6 line per fixture. |
| 21 | P3 | Text details: "available for 15h", US-13's pet Detectors, Arcade text, `_comp` called RTDB, Bug² display name. | Fixed | Wording fixed in US-2, US-13, TR-12; pairing keyed on `rawName` (TR-5). |
| 22 | P3 | Report this could fingerprint an account from exact amounts plus class and level. | Rejected | One Goal's amount plus one class/level is low-entropy, and payload policy is M13's scrub, which TR-12 now names. |
