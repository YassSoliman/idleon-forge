# M6 Unspent & idle

Spec for [#34](https://github.com/YassSoliman/idleon-forge/issues/34), part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Build order: M1 → M11 → M2 → M10 → M13 → M3 → **M6** → M4 → M7 → M8 → M9 → M5, with M12 alongside ([#13](https://github.com/YassSoliman/idleon-forge/issues/13)).

Terms follow [`GLOSSARY.md`](../../GLOSSARY.md). This spec rests on [ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md) (deterministic advice), [ADR 0004](../adr/0004-source-precedence.md) (Source precedence), [ADR 0005](../adr/0005-toolbox-numbers-not-our-formulas.md) (Toolbox numbers plus arithmetic, no formulas of ours), [ADR 0006](../adr/0006-client-only-spa-parsing-in-a-worker.md) (engine in the browser) and [ADR 0007](../adr/0007-generated-facts-authored-judgment.md) (generated facts, authored judgment), and on the resolutions of [#10](https://github.com/YassSoliman/idleon-forge/issues/10) (Now screen behaviour), [#11](https://github.com/YassSoliman/idleon-forge/issues/11) (Knowledge Base shape), [#12](https://github.com/YassSoliman/idleon-forge/issues/12) (Purpose), [#13](https://github.com/YassSoliman/idleon-forge/issues/13) (MVP cut), [#14](https://github.com/YassSoliman/idleon-forge/issues/14) (architecture), [#16](https://github.com/YassSoliman/idleon-forge/issues/16) (hypothetical math) and [#26](https://github.com/YassSoliman/idleon-forge/issues/26) (the Leverage model).

**Inputs used.** The Leverage model (`research/leverage-model`, §3.0 shared frame, positions 1 and 3), which is the backbone; the priority verification overlay (`research/priority-verification`, **PV**, wins on conflicts); the dossiers `research/account-wide` (resets and keys, minigames, merit, gem shop, pets), `research/w2-systems` (bubbles, vials, Arcade, Poppy), `research/w1-systems` (Post Office, anvil), `research/character-builds` (talent presets); the draft specs of M1 ([PR #43](https://github.com/YassSoliman/idleon-forge/pull/43)) and M10 ([PR #44](https://github.com/YassSoliman/idleon-forge/pull/44)) for the interfaces M6 plugs into. Fixture numbers below were read from the two private parsed saves on 2026-10-17 and are aggregates only.

**Patch.** Game v1.23 "Lumi Menagerie" (Toolbox gameVer 2.3.540, pin `6827d3f`). Every OLA index (`account.accountOptions[n]`) quoted here is verified against that patch only; see R8.

---

## 1. Purpose

Between Play Sessions an IdleOn account quietly piles up things that are worth something only once the player uses them: brew sitting in the cauldrons, boss keys and Colosseum tickets waiting at their NPCs, merits and task unlock points nobody spent, Darts and Hoops points, a free daily pet pull, Post Office boxes, an empty second talent preset, a big-bubble slot with nothing in it. Some of it is lost for good if it waits too long (keys and tickets stop banking after 3 days, Arcade balls stop after about 48 h, daily minigame plays and vial attempts reset). On a W3 account the Refinery and Construction add two more: a salt that is unlocked but switched off, and a Death Note building still at level 0, so multikill pays nothing. Both of our accounts leak value exactly this way. M6 finds every one of these in the save, says what to do with it in one concrete Next Action, and ranks it so that whatever will be lost before the player's Expected Return comes first. It never changes a Verdict: unspent stock is a Goal, not an AFK-safety problem.

## 2. Scope / Out of scope

### In scope (the M6 Checks)

| Group | What M6 detects | Where it shows |
|---|---|---|
| **Banked at an NPC (3-day cap)** | Boss keys (Forest Villa, Efaunt's Tomb, Chizoar's Cavern); Colosseum tickets | A character who can collect (keys) or Account (tickets) |
| **Daily, does not bank** | Vial attempts; skill-minigame plays; Spiketrap Surprise daily gems; the free daily pet pull; Pet Mart daily free gems | Account |
| **Cooldown minigames** | Throwy Darts and Swishy Hoops: a play is available, and points are unspent | Account |
| **Idle stock that converts only by hand** | Brew banked in a cauldron; Arcade balls at or past their claim cap; Poppy's unconverted fish | Account |
| **Unspent points and currencies** | Merits per world; task unlock points; gems; Post Office boxes (per character); anvil points (per character) | Account, or the character holding them |
| **Empty or mis-fitted slots** | Big-bubble slots that are empty, or hold a bubble that does nothing for the character's AFK Target; an empty second talent preset | The character |
| **Idle system** | Post Office unlockable but not unlocked; unlocked but today's orders not filled | The character with the quest in progress, then Account |
| **W3 idle systems** (D6) | A Refinery salt unlocked but switched off; the Death Note building at Lv 0 once Explosive Salt is unlocked | Account |

### Out of scope (and who owns it)

- **Anything that changes a Verdict.** Food, carry space, liquids filling, worship charge, anvil products capping, traps ending, empty Parallel Slots (cauldron assignment, cog seat, printer sample, traps): **M3 AFK Safety**. M6 owns banks that are *not* tied to a character's AFK Target (keys, tickets, Arcade, Poppy, plays); M3 owns caps that stop a character's own production. See §7 for the dedupe rule.
- **Coins** and the coin Spend Plan (Upgrade Vault, stamps, bribes, statues): **M7 Spend Plan**.
- **Cards, card presets, card sets, obols** (Leverage fills 3a, 3b): **M8 Collections**.
- **Talent Build content**, unspent talent points inside a preset that is already in use, the wrong preset on an AFK Target, and reset suggestions: **M9 Builds**. M6 only flags a second preset with zero points spent and hands the "what to put in it" to M9.
- **Tools, constellations, star signs** (fills 3d, 3f): not M6.
- **The rest of the Refinery and Construction:** manual Refine of a full bar and rank-ups (Leverage 1f), Auto Refine on Redox or Dioxide, salt balance, fuel running dry (M3 FR-26), unpaid build bars, build slots and the build order (Leverage W3-early 5), and Death Note mob ranks (M4 `contrib.fight.death-note`). M6 owns only the two D6 Checks. The Equinox bar stays out (D6).
- **Weekly and event items** (Killroy, Bonus Ballot, weekly bosses, Random Events), Tournament and Raid registration, Pet Bonus Tokens, Pet Crystal spending, Orion upgrades, Arcade gold-ball spending, the Equinox bar, Liquid Shop dailies and the Bargain Tag: not in the MVP M6. They appear in "Not covered yet" (M10 FR-26), to be assigned after the first 5 sessions (D6).
- **Writing any game formula.** Darts, Hoops, Arcade and bubble costs are read from Toolbox where Toolbox computes them, and otherwise not used (ADR 0005). Where Toolbox has no number, M6 states the stock, not the purchase.

## 3. Functional requirements

**General**

- **FR-1** M6 runs as part of the engine on every clean Account State, and again whenever the Expected Return changes or a time-sensitive Check reaches its `nextChangeAt` (FR-28). It returns Goals, each with exactly one Next Action, for the account and for characters. It never returns a Verdict blocker and never changes a Verdict.
- **FR-2** Every M6 Goal has category `spendable`, `compounding` or `nice` (M10 TR-2), one or more Sources, a confidence (H/M/L), and provenance listing the Knowledge Base entry ids and the Account State fields that produced it.
- **FR-3** A Check whose inputs are unknown (a failed parser section, a failed side read, a missing field) produces no Goal and records an `unknown` diagnostic. It never guesses a zero.
- **FR-4** Each Check fires only once its System is unlocked on the account (the entry's `appliesTo.stage` plus its unlock Detector). Nothing W3-only fires on a W2 account.
- **FR-5** A Check declares an **urgency**: `losing-now` (value is already being lost: a bank past its cap), `lost-before-return` (the cap or reset falls before `now + Expected Return`), or `banked` (safe until after the return). Urgency decides the Priority List position (TR-9).
- **FR-6** Every Next Action states the amount in play ("Collect 8 Colosseum tickets", "Spend 12 W1 merits"), and, for a cap or reset, when it hits ("2 of them have been capped for a day", "resets in about 12h").

**Banked at an NPC**

- **FR-7 Keys.** For each key type with `amountPerDay > 0` and `daysSincePickup ≥ 2`, or `daysSincePickup + ExpectedReturn ≥ 3 days`, M6 shows "Collect N <key>" where N is Toolbox's `totalAmount` (`min(days, 3) × perDay`). It places the Goal on a character eligible to collect (TR-7). Key types that fire for the same character merge into one Goal.
- **FR-8 Colosseum tickets.** Same rule per ticket NPC (Typhoon, Centurion, Lonely Hunter), merged into one Account Goal "Collect N Colosseum tickets". If any NPC is past 3 days, the Next Action says how many days are already lost.

**Daily, does not bank**

- **FR-9 Vial attempts.** When `vialAttempts.current > 0` (W2+), "Use your N vial attempts on the W2 town cauldron". Urgency from the daily reset (TR-6).
- **FR-10 Skill-minigame plays.** When the shared pool is above 0 and the daily reset falls before the return, "Use today's N minigame plays", naming the first open highscore Milestone from the authored list (TR-4, entry `minigames.daily-plays`). See D4.
- **FR-11 Spiketrap Surprise.** When today's gems are unclaimed (`OLA[7] == 1`) and the next round (top of the hour) starts within 20 minutes, "Spiketrap starts at :00: up to 40 gems today". Category `nice`.
- **FR-12 Free pet pull.** When `freeClaimAnchor + 594,000,000 ms ≤ now`, "Claim your free pet pull at Doggy". Urgency `losing-now` (a missed day is not given back).
- **FR-13 Pet Mart gems.** When the server offers them (`serverVars.GemPM_x ≥ 0.1`), the shop day `S ≥ 1` and `OLA[516] < S`, "Claim today's free Pet Mart gems". Confidence M until R2's check is done.

**Cooldown minigames**

- **FR-14 Play.** When Darts (or Hoops) is off cooldown at `now` and has not been played in this Play Session, "Play one round of Darts (about 2 min, from any map with the Darts item)". See D3.
- **FR-15 Spend.** When Darts points ≥ the cheapest next level among unlocked Darts upgrades (Toolbox cost), "Spend N Darts points (next DMG level costs C)". The same for Hoops, using Toolbox's Hoops cost, which can only overstate the real cost (R1), so the Check never fires falsely.

**Idle stock**

- **FR-16 Brew.** For each cauldron with Toolbox `newBubble.expectedBubbles ≥ 1`, M6 counts it in one Account Goal: "Spend banked brew in <cauldrons>: about N new bubbles". N is the rounded sum of `expectedBubbles` over firing cauldrons. If the next bubble of a cauldron is a big bubble that fits an AFK Target in use on the account (TR-4 pairing table), the why line says so.
- **FR-17 Arcade.** When the seconds since the last ball claim at `now` reach Toolbox's maximum claim time, "Open the Arcade: balls stopped banking about N h ago" (`losing-now`). When they will reach it before the return, the same Goal with `lost-before-return`.
- **FR-18 Poppy.** When Poppy is unlocked and Toolbox's `pendingFish > 0` and Poppy has not been opened this Play Session, "Open Poppy's pond to convert your fish". Category `nice`.

**Unspent points and currencies**

- **FR-19 Merits.** For each world with unspent merits ≥ the cheapest unmaxed row's cost, "Spend N W<w> merits: first <row>", where <row> is the first unmaxed row of that world's merit Priority List that the merits cover. A world whose list is Contested (W3, PV 7.3) shows the badge and both sides, and is never the first Goal.
- **FR-20 Task unlock points.** When `unlockPointsOwned − unlockedRecipes > 0` and an open Unlocks column has an unbought row, "Spend N task unlock points".
- **FR-21 Gems (D2).** When `gems > 0`: from Stage W2-late on, if the Crystal 3D Printer is not owned, "Crystal 3D Printer: N of 875 gems" (`nice`, with a Milestone, TR-10) while gems < 875, and "Buy the Crystal 3D Printer (875 gems)" (`spendable`) once gems ≥ 875. Before W2-late, or once the printer is owned, "N gems unspent" with the "sources disagree" badge and both PV 7.5 sides (Infinity Hammer first; Extra Card Slots and the Crystal 3D Printer first). A Gem Goal names a purchase only when gems ≥ its price, and the Contested form is never position 1 or the first Account Goal. Prices come from the generated gem shop facts (TR-5), never from this spec.
- **FR-22 Post Office boxes.** Once the Post Office is unlocked, for each character with `postOffice.unspentPoints > 0`, "Spend N Post Office boxes" on that character, naming the class's first box from the authored order (PV 3.5).
- **FR-23 Anvil points.** For each character with `anvilStats.availablePoints > 0`, "Spend N anvil points on Speed" on that character (PV 3.1). Capacity is named instead only when M3 reports an anvil product capping before the return.

**Slots and presets**

- **FR-24 Big bubbles.** For each character, slots available = 1, plus 1 if the "Changing the Code" bribe is bought, plus 1 if Breeding arena wave 100 is reached. For every empty slot, M6 names the best **unlocked** big bubble for the character's current AFK Target from the pairing table (TR-4); if none is unlocked, no Goal on that character (the brew Goal's why line covers it). A slot holding a big bubble that fits none of the character's uses (for example a multi-log bubble on a fighter) fires "Swap <bubble> for <better>" when a better unlocked one exists. Both are `compounding`, confidence M (the pairing is authored, L in the dossier, and is the AFK-Target reading of the bubbles' own game text).
- **FR-25 Empty second talent preset.** For a character at level ≥ 15 whose non-selected talent preset has 0 points spent, "Fill talent preset 2 with your <class>'s skilling Build" (PV 1.3: one combat and one skilling preset). The Build itself comes from M9 when it exists; until then the Next Action links the Build Source.

**Idle system**

- **FR-26 Post Office unlock.** When the highest class level is ≥ 50 and no character has finished Postboy Pablob's quest, "Finish Postboy Pablob's quest: 5 Empty Boxes from Anvil Tab 2" on the character with the quest in progress (or the highest-level character if nobody started it). The why line mentions boxes already waiting, if any.
- **FR-27 Post Office orders.** Once unlocked, when a company has no order completed today, "Fill today's Post Office orders from storage" (Account).

**Time and history**

- **FR-28** Each time-sensitive Check (keys, tickets, daily resets, pet pull, Darts and Hoops cooldowns, Spiketrap, Arcade) returns `nextChangeAt`, the next moment its answer can change without a new save. The engine re-runs M6 at the earliest one, so a pet pull that becomes claimable mid-session appears without waiting for a save.
- **FR-29** Done is detected per Check from a later save by an explicit field change (TR-8), never from "the Check stopped firing". A Goal that stops firing only because time moved (Spiketrap's window closed) disappears without being marked done.
- **FR-30** M6 reports, per character, `spendCount`: the number of its non-`nice` M6 Goals. The engine uses it for the "then most to spend" part of Visit Order.

**W3 idle systems (D6)**

- **FR-31 Salt switched off.** From Stage W3-early on (the account has finished W2, so the Refinery is reachable), for each salt that is unlocked and not active, "Switch on <salt> in the Refinery" (Account). Several off salts merge into one Goal naming them in Refinery order. Urgency `losing-now` (an off salt makes no power while the account is away). When the Death Note Check also fires and Explosive is the salt that is off, the why line says the Death Note's first level is paid in Explosive Salt. M6 never advises Auto Refine, ranks or fuel (§2).
- **FR-32 Death Note building.** From Stage W3-early on, when Explosive Salt is unlocked and the Death Note building is at Lv 0: if it is not in a build slot, "Put the Death Note in a Construction build slot"; if it is building, "Keep building the Death Note to Lv 1: multikill is off until then". Urgency `losing-now` (every fighter's kills earn no multikill until Lv 1). Account. It stops firing once the building is Lv ≥ 1.

## 4. User stories

**Fixtures and conventions.** "W2-late account" is the private W2 fixture (Stage W2-late per the Leverage model §1.3: 5 characters, Barbarian 60, Squire 43, Shaman 44, Bowman 54, Wizard 56). "W3-early account" is the private W3 fixture (Stage W3-early: 6 characters, Wizard 73, Squire 51, Bowman 60, Squire 85, Barbarian 56, Shaman 54). In CI they run as M1's scrubbed copies (`scrubbed/w2.json`, `scrubbed/w3.json`); the scrubbed copies drop pet data, so the pet stories run locally only (TR-13). Unless a story says otherwise, **`now` = the fixture's last cloud save** and **Expected Return = 8 h** (the default). "Shows" means the `EngineResult` contains the Goal with that text, which M10 renders; every Then below is also a golden-snapshot line (M11).

**US-1 Don't lose banked keys and tickets.** As a player in a Play Session, I want to be told which keys and tickets are sitting at their NPCs, so that I collect them before the 3-day bank throws any away.
- Given the W3-early account / When the engine runs / Then the Squire Lv 85 row shows one Goal "Collect 6 boss keys (4 Forest Villa, 2 Efaunt's Tomb)" with urgency `banked` (it fires on the 2-day threshold; 2 days + 8 h is still under the 3-day cap), and no other character shows a key Goal (the active character, the Shaman Lv 54, cannot collect either key).
- Given the W3-early account / When the engine runs / Then the Account section shows "Collect 3 Colosseum tickets", and its Next Action says "one NPC has been capped for 2 days".
- Given the W2-late account / When the engine runs / Then no key Goal shows (Forest Villa is 1 day banked, Efaunt and Chizoar earn 0 a day), and the Account section shows "Collect 8 Colosseum tickets" with "two NPCs have been capped for a day".
- Given the W2-late account and Expected Return 48 h / When the engine runs / Then "Collect 4 Forest Villa keys" appears with urgency `lost-before-return` (1 day + 48 h reaches the 3-day cap), on the Barbarian Lv 60 (the active character, and eligible).
- Given the W3-early account / When a later save shows Forest Villa and Efaunt `daysSincePickup` at 0 / Then the Goal moves to "Done this session".

**US-2 Use the free dailies.** As a player in a Play Session, I want the daily freebies that don't bank listed, so that I stop throwing them away.
- Given the W2-late account / When the engine runs / Then the Account section includes "Claim your free pet pull at Doggy" with "available for about 15h", urgency `losing-now`.
- Given the W3-early account / When the engine runs / Then no pet-pull Goal shows, and M6's `nextChangeAt` for it is about 11h 13m after the save.
- Given the W3-early account and `now` = save + 12 h / When the engine re-runs on that timer (no new save) / Then "Claim your free pet pull at Doggy" appears.
- Given either account / When the engine runs / Then "Claim today's free Pet Mart gems" shows (shop day 241, last claimed 0), with confidence M.
- Given the W2-late account / When the engine runs / Then "Use your 11 vial attempts on the W2 town cauldron" shows with urgency `banked` (the daily reset is about 23h 43m away, after the return). With Expected Return 24 h, the same Goal shows with urgency `lost-before-return`.
- Given the W3-early account / When the engine runs / Then no vial Goal shows (0 of 17 left).
- Given the W3-early account and Expected Return 24 h / When the engine runs / Then "Use today's 4 minigame plays" shows (reset in about 12h 33m), naming an open highscore Milestone. With Expected Return 8 h it does not show.
- Given the W2-late account / When the engine runs / Then "Spiketrap starts at :00: up to 40 gems today" shows in category `nice` (13 min to the hour, gems unclaimed); with `now` = save + 20 min it does not show, and it is not marked done.

**US-3 Darts and Hoops.** As a player in a Play Session, I want a nudge to play Darts and spend its points, so that the highest-Leverage minigame keeps compounding.
- Given the W2-late account / When the engine runs / Then the Account section includes "Spend 29 Darts points (next DMG level costs 2)" and "Spend 7 Hoops points".
- Given the W3-early account / When the engine runs / Then no Darts or Hoops spend Goal shows (2 Darts points against a next cost of 5; 0 Hoops points), and "Play one round of Darts" shows because it is off cooldown.
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

**US-6 Spend merits and unlock points.** As a player in a Play Session, I want unspent merits and unlock points flagged with what to buy first, so that the Task Board pays off.
- Given the W2-late account / When the engine runs / Then the Account section shows "Spend 12 W1 merits" and "Spend 2 task unlock points". Once the W1 merit Priority List is mapped to row ids (R6), the merit Goal also names the first unmaxed row of that list (PV 7.1) and this line of the golden snapshot is updated in the same PR.
- Given the W3-early account / When the engine runs / Then it shows "Spend 1 W2 merit: All Yum-Yum Desert mobs respawn faster" (the first unmaxed row of PV 7.2's corrected order: Obol and AFK gains are maxed), "Spend 10 task unlock points", and a W3 merits Goal "Spend 3 W3 merits" with the "sources disagree" badge (Telekinetic and Library vs Build/Food slots, PV 7.3) that is never first in the Account section.

**US-7 Unspent gems.** As a player in a Play Session, I want to know my gems are idle and what the community buys, so that I'm not hoarding them for nothing.
- Given the W2-late account (628 gems, nothing bought; Stage W2-late) / When the engine runs / Then the Account section shows "Crystal 3D Printer: 628 of 875 gems" in category `nice`, with no buy Next Action and no Contested first-buy line at position 1.
- Given the W3-early account (365 gems, no Crystal 3D Printer) / When the engine runs / Then it shows "Crystal 3D Printer: 365 of 875 gems", category `nice`.
- Given a W2-mid account with 400 gems and nothing bought / When the engine runs / Then it shows "400 gems unspent" with the "sources disagree" badge and both sides (Infinity Hammer first; Extra Card Slots and the Crystal 3D Printer first), never as the first Account Goal.
- Given a W3 account with 900 gems and no Crystal 3D Printer / When the engine runs / Then it shows "Buy the Crystal 3D Printer (875 gems)" as a normal Next Action.

**US-8 Talent presets.** As a player in a Play Session, I want an empty second talent preset flagged, so that each character has a skilling setup ready.
- Given the W2-late account / When the engine runs / Then the Barbarian Lv 60, Bowman Lv 54 and Wizard Lv 56 rows each show "Fill talent preset 2 with your <class>'s skilling Build", and the Squire Lv 43 and Shaman Lv 44 rows do not.
- Given the W3-early account / When the engine runs / Then only the Squire Lv 85 row shows it.
- Given a character at level 14 with an empty second preset / When the engine runs / Then nothing shows (presets unlock at 15).

**US-9 Post Office.** As a player in a Play Session, I want to know the Post Office is waiting for me, so that the account starts earning boxes.
- Given the W2-late account / When the engine runs / Then the Barbarian Lv 60 row (quest in progress) shows "Finish Postboy Pablob's quest: 5 Empty Boxes from Anvil Tab 2".
- Given the W3-early account / When the engine runs / Then the Squire Lv 85 row shows the same Goal, with the why line "4 boxes are already waiting on every character". No "Spend Post Office boxes" Goal shows, because the Post Office is not unlocked.
- Given a save where the quest is done and a character has 4 unspent boxes / When the engine runs / Then that character shows "Spend 4 Post Office boxes: Civil War Memory Box first" (Barbarian; per-class box per PV 3.5).

**US-10 Anvil points.** As a player in a Play Session, I want unspent anvil points on any character flagged, so that every anvil runs at full speed.
- Given the W3-early account / When the engine runs / Then the Bowman Lv 60 row shows "Spend 3 anvil points on Speed", and no other character does.
- Given the W2-late account / When the engine runs / Then no anvil-point Goal shows.

**US-11 Arcade and Poppy.** As a player in a Play Session, I want to know when the Arcade has stopped banking, so that I open it before more balls are lost.
- Given the W2-late account / When the engine runs / Then the Account section shows "Open the Arcade: balls stopped banking about 38h ago" (96 h since the last claim against a 58 h maximum), urgency `losing-now`. (If Toolbox's max claim time for this account is below 58 h, N is larger; the text uses Toolbox's number.)
- Given the W3-early account (18 h since the last claim) and Expected Return 48 h / When the engine runs / Then "Open the Arcade before you leave" shows with urgency `lost-before-return`; with 8 h it does not show.
- Given either account / When the engine runs / Then "Open Poppy's pond to convert your fish" shows once, in category `nice`; after a later save in the same Play Session shows `pendingFish` dropped, it is done.

**US-12 Ranking.** As a player in a Play Session, I want what will be lost first at the top, so that a short session still saves the most value.
- Given the W2-late account / When the engine runs / Then the five visible Account Goals are, in this order: free pet pull (20 s), Colosseum tickets (60 s), Arcade (90 s), which are the three `losing-now` items ordered by effort (TR-9); then Play Darts and Play Hoops (`lost-before-return`, 120 s each, tied and ordered by entry id). Spiketrap (position 1, 180 s), then the position-3 Goals (Pet Mart gems, vials, merits, unlock points, Darts and Hoops spend, brew, Poppy, the printer progress) sit behind "show more (n)".
- Given any fixture / When the engine runs / Then no M6 Goal is a Verdict blocker, and every character's Verdict is identical with M6 switched off.

**US-13 Unknown, not wrong.** As a player in a Play Session, I want missing data to stay quiet rather than produce bad advice, so that I can trust what's shown.
- Given the scrubbed W2 save (companion data removed) / When the engine runs / Then no pet Goal shows, `diagnostics.failedDetectors` lists the two pet Detectors with "companion data unavailable", and no Verdict changes.
- Given the W3-early account with the `alchemy` parser section forced to fail / When the engine runs / Then no brew, vial or bubble Goal shows, and those Detectors are listed as unknown.

**US-14 Switch the W3 engine on (D6).** As a player in a Play Session, I want to be told when a salt is switched off or the Death Note building is still at level 0, so that the Refinery and multikill start paying while I'm away.
- Given the W3-early account / When the engine runs / Then the Account section shows "Switch on Explosive Salt in the Refinery" with urgency `losing-now`, and its why line says the Death Note's first level is paid in Explosive Salt. Redox (active) is not named.
- Given the W3-early account / When the engine runs / Then the Account section shows "Keep building the Death Note to Lv 1: multikill is off until then" (the building is Lv 0 and in a build slot), urgency `losing-now`.
- Given the W2-late account / When the engine runs / Then neither Goal shows, although the save lists Redox as unlocked and inactive: the Stage is W2-late, and the Refinery is a W3 System.
- Given the W3-early account / When a later save shows Explosive active / Then the salt Goal moves to "Done this session"; when a later save shows the Death Note at Lv 1, so does the Death Note Goal.

## 5. Technical requirements

### TR-1 Package boundaries

| Package | M6 parts |
|---|---|
| `packages/account-state` | The fields in TR-3, added through M1's TR-11 process (`types.ts`, `adapter.ts`, `FIELD_SOURCES`, `FIELD_SECTIONS`, `schemaVersion` bump). |
| `packages/knowledge` | `systems/{boss-keys,colosseum,alchemy-bubbles,alchemy-vials,merit-shop,task-unlocks,gem-shop,pets,minigames,talent-presets,post-office,anvil,arcade,poppy,refinery,death-note}.yaml` (authored entries) and the generated facts they reference (TR-5). |
| `packages/engine` | `src/detectors/m6/*.ts` (one file per Detector, TR-6), registered in the Detector registry by id. No Toolbox import: Detectors read only the Account State (M1 TR-11). |
| `apps/activeon` | Nothing M6-specific. M10 renders M6 Goals like any other. |

### TR-2 Detector contract (shared with M3–M9; M11 owns the registry)

```ts
export interface DetectorContext {
  state: AccountState;
  history: HistoryView;              // M1 SaveHistory, pre-read by the engine (sessionStart, previous)
  now: number;                       // epoch ms, injected
  expectedReturnSeconds: number;
  stage: StageId;                    // from M2
  facts: GeneratedFacts;             // TR-5, read-only
}

export type Urgency = 'losing-now' | 'lost-before-return' | 'banked';

export interface Firing {
  subject: Subject;                  // 'account' | `c${index}` (M10 TR-2)
  slots: Record<string, string | number>;   // fills the entry's text template
  urgency: Urgency;
  effortSeconds: number;             // hands-on time, from the entry (tie-break, TR-9)
  fields: string[];                  // Account State paths read (provenance)
  doneKey: string;                   // what TR-8's done predicate compares
}

export type DetectorResult =
  | { status: 'ok'; firings: Firing[]; nextChangeAt: number | null }
  | { status: 'unknown'; reason: string; fields: string[] };

export type Detector = (ctx: DetectorContext, params: Record<string, unknown>) => DetectorResult;
```

Rules: pure, deterministic, no I/O, no clock reads other than `ctx.now`; must not throw on a well-typed Account State (a throw is caught by the engine and reported as a failed Detector); `params` come from the entry's YAML (thresholds, ids).

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
  };
  bigBubbleSlots: number | null;                           // 1 + bribes[Changing_the_Code].done + (arena wave ≥ 100)
  merits: null | Array<{ world: 1|2|3|4; unspent: number;  // tasks[4][w] (raw), meritsDescriptions[w-1]
    rows: Array<{ index: number; level: number; max: number; cost: number }> }>;
  taskUnlocks: null | { owned: number; bought: number; openUnbought: number };
  gems: number | null;                                     // currencies.gems
  gemPurchases: number[] | null;                           // gemShopPurchases (index → count)
  keys: null | Array<{ id: 'forest-villa'|'efaunt'|'chizoar'; perDay: number; daysSincePickup: number | null; banked: number }>;
  colosseumTickets: null | Array<{ npc: 0|1|2; perDay: number; daysSincePickup: number; banked: number }>;
  minigames: null | {
    plays: number;                                         // currencies.minigamePlays (OLA[33])
    highscores: { choppin: number; fishing: number; catching: number; mining: number };
    darts: CooldownGame; hoops: CooldownGame;
    spiketrap: { gemsAvailableToday: boolean; bestRound: number };  // OLA[7] == 1, OLA[201]
  };
  pets: null | { freeClaimAnchor: number; owned: number };  // companions (RTDB side read)
  petMart: null | { lastClaimedShopDay: number; currentShopDay: number; gemsOffered: boolean }; // OLA[516], tournament.global.S, serverVars.GemPM_x
  postOffice: null | { unlocked: boolean; questInProgressOn: number[]; companiesNotDoneToday: number };
  arcade: null | { lastClaimAt: number; maxClaimSeconds: number; balls: number };   // timeAway.Arcade; Toolbox dungeons.ts max claim
  poppy: null | { unlocked: boolean; pendingFish: number };  // kangaroo
  salts: null | Array<{ rawName: string; unlocked: boolean; active: boolean }>;   // refinery.salts[i].{rawName,unlocked,active} (D6)
  deathNoteBuilding: null | { level: number; inBuildSlot: boolean };              // towers.data[name=Death_Note].{level,inProgress} (D6)
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
  talentPresets: { selected: 0 | 1; otherPresetPointsSpent: number };   // sum of talentPreset.talents levels
  npcProgress: { dogBone: number | null; djonnut: number | null; bellows: number | null };
  postOfficeUnspent: number | null;                        // postOffice.unspentPoints
  anvilPointsAvailable: number | null;                     // anvil.anvilStats.availablePoints
}
```

OLA reads go through a named table in `adapter.ts` (`OLA.DARTS_POINTS = 434`, …) that cites Toolbox's `data/account-options-enum.js` where it names the index, and the dossier's N.js offset where it does not. A contract test asserts each index's type and range on every fixture (R8).

### TR-4 Knowledge Base entries

Shape per [#11](https://github.com/YassSoliman/idleon-forge/issues/11): YAML, one file per System, compiled to JSON and schema-checked in CI. Every entry has `id`, `system`, `type`, text template, `why`, `sources[]`, `appliesTo`, `confidence`, `status`. **G** = generated from Toolbox data at each parser re-sync (ADR 0007); **A** = authored.

| Entry id | Type | Detector | Gen/Auth | Notes |
|---|---|---|---|---|
| `boss-keys.collect` | Check | `m6.keys-banked` | A (thresholds, why); G (bank cap 3 days, collector dialogue thresholds) | Fires at ≥ 2 days or cap before return |
| `colosseum.collect-tickets` | Check | `m6.tickets-banked` | A; G (cap) | |
| `alchemy-vials.daily-attempts` | Check | `m6.vial-attempts` | A | W2-early+ |
| `minigames.daily-plays` | Check | `m6.minigame-plays` | A (Milestone list, D4); G (Milestone scores from `quests.json`, achievements) | Category `nice` |
| `minigames.spiketrap` | Check | `m6.spiketrap` | A; G (gem table) | `nice` |
| `pets.free-pull` | Check | `m6.pet-free-pull` | A; G (594e6 ms period) | Needs `_comp` side read |
| `pets.mart-gems` | Check | `m6.pet-mart-gems` | A | Confidence M (R2) |
| `minigames.darts-play`, `minigames.hoops-play` | Check | `m6.cooldown-play` | A | D3 |
| `minigames.darts-spend`, `minigames.hoops-spend` | Check | `m6.cooldown-spend` | A (order: DMG until 40 total, then TALENT and DMG, then VAULT, per the minigames dossier); G (unlock thresholds 0/40/150/250 and 0/12/80/200) | |
| `alchemy-bubbles.spend-brew` | Check | `m6.brew` | A; G (bubble names, active flag) | Leverage W2-mid 4 |
| `alchemy-bubbles.fill-slot`, `alchemy-bubbles.wrong-fit` | Check | `m6.big-bubbles` | A (pairing table below); G (active flag, cauldron index) | Fill 3c |
| `merit-shop.spend-w1` … `spend-w4` | Check + Priority List | `m6.merits` | A (order per PV 7.1, 7.2, 7.4; W3 Contested per 7.3); G (row costs, max levels, row text) | Order references rows by generated **row id**, never by a guide's nickname (R6) |
| `task-unlocks.spend` | Check | `m6.task-unlocks` | A | |
| `gem-shop.unspent` + Priority List `gem-shop.order` | Check + Priority List | `m6.gems` | A (both PV 7.5 sides, Contested); G (prices, item indices) | D2 |
| `talent-presets.fill-second` | Check | `m6.empty-preset` | A; G (unlock level 15) | Fill 3e; text links M9's Build |
| `post-office.unlock`, `post-office.daily-orders`, `post-office.spend-boxes` | Check | `m6.post-office` | A (per-class first box, PV 3.5); G (Lv 50 gate, quest id) | Fill 3h |
| `anvil.spend-points` | Check | `m6.anvil-points` | A (Speed first, PV 3.1) | Fill 3h |
| `arcade.open` | Check | `m6.arcade` | A; G (48 h base; stamp hours come from Toolbox per account) | Leverage 1d |
| `poppy.open` | Check | `m6.poppy` | A | `nice` |
| `refinery.salt-off` | Check | `m6.salt-off` | A (why); G (salt display names, Refinery order) | Leverage 1f, D6; `appliesTo.stage: ">=W3-early"` |
| `death-note.build` | Check | `m6.death-note-build` | A (why); G (building index and name) | Leverage 1g, D6; `appliesTo.stage: ">=W3-early"` |

**Example (authored), `packages/knowledge/systems/boss-keys.yaml`:**

```yaml
- id: boss-keys.collect
  system: boss-keys
  type: check
  detector: m6.keys-banked
  params: { fireAtDays: 2, bankCapFact: fact:resets.key-bank-days }
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
    - { label: "Toolbox misc.ts KeysAll", url: "https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L599", tier: 1, verifiedOn: 2026-10-17, gameVersion: "2.3.540" }
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

Produced by M11's generator from the pinned Toolbox data at every re-sync, into `packages/knowledge/generated/`: bubble catalogue (name, cauldron, index, active/passive); merit rows per world (id, text, cost, max); gem shop items (index, price, increment, max); Darts and Hoops upgrade unlock thresholds; key and ticket bank caps (3 days); pet free-pull period (594,000,000 ms); Post Office unlock (highest Lv 50, quest `Postboy_Pablob1`); talent preset unlock level (15); Refinery salt catalogue (raw name, display name, order); Construction building catalogue (index, name; the Death Note is index 2). An authored entry referencing a generated id that disappears after a re-sync fails CI (M11).

### TR-6 Detector logic (each one, with its done predicate)

Time at `now`: for any counter saved at `lastCloudSave`, the Detector uses `elapsed = (now − lastCloudSave)/1000` s. **If `elapsed ≥ dailyResetInSeconds`, a daily reset happened since the save**: daily counters are treated as refilled (vial attempts = max, plays = pool size, cooldowns ready, Spiketrap flag set, Pet Mart re-offered) and `daysSincePickup` values are taken as +1 per reset crossed, capped at the bank cap. `resetAt = lastCloudSave + dailyResetInSeconds·1000`, rolling forward by 24 h. "Before return" means `< now + expectedReturnSeconds·1000`.

| Detector | Fires when | Urgency | `nextChangeAt` | Done when (later save vs the save it fired on) |
|---|---|---|---|---|
| `m6.keys-banked` | per key: `perDay > 0` and (`days ≥ 2` or `days + ER ≥ 3 d`); place by TR-7 | `losing-now` if `days ≥ 3`; else `lost-before-return` if the cap falls before return; else `banked` | next daily reset | that key's `daysSincePickup` is 0 |
| `m6.tickets-banked` | per NPC, same | same | next daily reset | that NPC's `daysSincePickup` is 0 |
| `m6.vial-attempts` | `current > 0` | `lost-before-return` if `resetAt` before return, else `banked` | `resetAt` | `current` lower, or a reset passed |
| `m6.minigame-plays` | `plays > 0`, `resetAt` before return, an open Milestone exists | `lost-before-return` | `resetAt` | `plays` lower |
| `m6.spiketrap` | `gemsAvailableToday` and the next top of the hour is within 20 min | `lost-before-return` | next :00 − 20 min, or :00 | `gemsAvailableToday` false |
| `m6.pet-free-pull` | `freeClaimAnchor + 594e6 ≤ now` | `losing-now` | `freeClaimAnchor + 594e6` if in the future | `freeClaimAnchor` increased |
| `m6.pet-mart-gems` | `gemsOffered && currentShopDay ≥ 1 && lastClaimedShopDay < currentShopDay` | `lost-before-return` if `resetAt` before return, else `banked` | `resetAt` | `lastClaimedShopDay == currentShopDay` |
| `m6.cooldown-play` | cooldown remaining at `now` ≤ 0, and `playsToday` has not risen since `history.sessionStart` | `lost-before-return` (cooldown time is being wasted) | cooldown end | `playsToday` rose (D3: then no refire this Play Session) |
| `m6.cooldown-spend` | `points ≥ min(non-null nextCosts)` | `banked` | none | `points` lower or a level rose |
| `m6.brew` | any cauldron `expectedNewBubbles ≥ 1` | `banked` | none | `unlockedBubbles` rose in a firing cauldron |
| `m6.big-bubbles` | empty slot with a fitting unlocked bubble; or a wrong fit with a better one | `banked` | none | the slot holds the named bubble, or the AFK Target changed (then re-evaluated, not done) |
| `m6.merits` | per world: `unspent ≥ min cost of unmaxed rows` | `banked` | none | `unspent` lower |
| `m6.task-unlocks` | `owned − bought > 0` and `openUnbought > 0` | `banked` | none | `bought` rose |
| `m6.gems` | D2 | `banked` | none | `gemPurchases` changed |
| `m6.empty-preset` | `level ≥ 15` and `otherPresetPointsSpent == 0` | `banked` | none | `otherPresetPointsSpent > 0` |
| `m6.post-office` | unlock: `highestLevel ≥ 50 && !unlocked`; orders: `unlocked && companiesNotDoneToday > 0`; boxes: per character `postOfficeUnspent > 0 && unlocked` | `banked`; orders `lost-before-return` if reset before return | `resetAt` (orders) | unlocked true; companies done; unspent lower |
| `m6.anvil-points` | per character `anvilPointsAvailable > 0` | `banked` | none | value lower |
| `m6.arcade` | `now − lastClaimAt ≥ maxClaimSeconds` (`losing-now`) or will be before return (`lost-before-return`) | as stated | `lastClaimAt + maxClaimSeconds` | `lastClaimAt` increased |
| `m6.poppy` | `unlocked && pendingFish > 0` and not converted since `history.sessionStart` | `banked` | none | `pendingFish` dropped |
| `m6.salt-off` | Stage ≥ W3-early, and any salt with `unlocked && !active` | `losing-now` | none | every salt it named is `active` |
| `m6.death-note-build` | Stage ≥ W3-early, Explosive (`salts[1]`) unlocked, `deathNoteBuilding.level == 0` | `losing-now` | none | `level ≥ 1` |

Each Detector also checks its unlock: keys need the quest line, Darts needs a best score > 0 or the item, the Arcade needs class Lv 8, Poppy needs the Secret Map (its upgrades or totals are non-zero), vials and bubbles need W2, salts and the Death Note need Stage ≥ W3-early (the save reports the first salt as unlocked on every account, so `unlocked` alone is not a gate). A not-yet-unlocked System is silent, not unknown.

### TR-7 Placement (#10 item 6)

- A Goal that any character can do goes to the Account section: tickets, vials, brew, merits, unlock points, gems, pets, Darts, Hoops, Spiketrap, plays, Arcade, Poppy, Post Office orders, salts, the Death Note building.
- A Goal that needs a specific character goes on that character: big bubbles, presets, Post Office boxes, anvil points (their own), the Post Office quest (the character with it in progress), and **keys**, which go to a character eligible to collect (Dog Bone dialogue > 5 for Forest Villa; Djonnut > 6 for Efaunt, the collector threshold, which is stricter than the > 5 that earns keys, R1; Bellows > 8.5 for Chizoar).
- **Choosing that character** must not depend on Visit Order (Visit Order uses M6's `spendCount`, so that would loop): the active character (M1 `activeCharacterIndex`) if eligible, else the eligible character with the highest level, ties to the lowest index.

### TR-8 Done detection

Each entry carries `doneWhen`, evaluated by the engine on the first save newer than the one the Goal was shown on (M1 `history.previous`). Only an explicit change counts. A Goal that stops firing for any other reason (time passed, AFK Target changed, a section failed) is dropped silently. Pastes have no history: done is not detected in paste mode, and "once per Play Session" rules (D3, Poppy) treat the paste as the start of a session.

### TR-9 Ranking and categories

- M6 never emits `category: 'blocker'`.
- **Priority List position** (the Leverage model's shared frame, §3.0): `losing-now` and `lost-before-return` items take **position 1** (never-skip); `banked` items take **position 3** (free-value fills; spending stock costs nothing). Merits and gems name *what* to buy from their own per-world and gem Priority Lists, but the Goal itself sits at position 3. Within position 1, `losing-now` precedes `lost-before-return` (authored sub-order, a tie otherwise).
- **Tie-breaks** (#11 item 6, in order): cheapest = lowest `effortSeconds` (authored per entry: pet pull 20 s, Pet Mart gems 20 s, tickets 60 s, keys 60 s, Arcade 90 s, vials 60 s, Darts and Hoops play 120 s, brew 120 s, merits 60 s, unlock points 60 s, Post Office boxes 60 s, anvil points 30 s, bubbles 30 s, preset 300 s, Spiketrap 180 s, plays 600 s, salt switch 30 s, Death Note 60 s); then closest Milestone (none of M6's has one, so skipped); then most Goals per activity; then entry id, so the order is total and stable.
- **Categories** are display tags only (D1): `spendable` for banked currency and claims (keys, tickets, vials, plays, pets, Darts/Hoops, brew, merits, unlocks, gems, Post Office boxes and orders, anvil points, Arcade); `compounding` for slots and presets, the Post Office unlock, salts and the Death Note building; `nice` for Spiketrap, Poppy, skill-minigame plays, and a gem Goal with no affordable buy.
- **Contested** entries (W3 merits, the first gem buy) are never position 1 and never the first Account Goal (#11 item 5; M10 TR-9 asserts it).
- **Stale** entries rank below fresh ones at the same position (#10 item 10).

### TR-10 Output into `EngineResult` (M10 TR-2)

M6 adds `Goal`s to `characters[i].goals` and `account.goals`, with `goal.system` = the entry's system and `goal.milestone = null` except the gem printer progress Goal (D2), which uses `{unit: 'gems', current, next: 875, etaSeconds: null, stopHere: false}`. It adds `spendCount` per character for Visit Order, and `nextChangeAt` (earliest across M6) to the engine's scheduling list. It adds an Active Play entry only for skill-minigame plays when they fire (`estimateSeconds` 600), so a long minigame sitting never crowds out quick claims.

### TR-11 Performance

All M6 Detectors together: ≤ 3 ms on an 11-character Account State on a mid-range desktop, measured in the engine benchmark (M11), with no allocation proportional to save size (they read the compact Account State, never the 4–5 MB Toolbox object). The re-run on `nextChangeAt` costs one engine run, at most once a minute (the engine debounces timers to 60 s).

### TR-12 Security and privacy

- Detectors never put a character name into `slots`; subjects are indices (M10 TR-2). Why lines name classes ("your Barbarian"), never names.
- Pet data comes from the RTDB `_comp/{uid}` side read, which stays in the browser like the rest of the save (ADR 0006). Pet Mart and server vars are public game data.
- Report this (M10 TR-10) for an M6 Goal sends the entry id, action text, versions, Stage, and class and level only for character Goals.
- No Detector reads or exposes `uid`, email, guild ids or member lists.

### TR-13 Tests

- **Fires / doesn't fire per Detector** on both private fixtures (local), both scrubbed fixtures (CI) and the 11 public saves (CI), with `now` = last cloud save and ER 8 h, plus the ER and `now` variants in §4. The public W4–W7 saves must produce no crash and no Goal from a locked System.
- **Toolbox oracle tests:** where Toolbox has an alert for the same condition, our Detector must agree with it on every fixture, except documented quirks: `freeCompanion`, `petMartGems`, `areKeysOverdue` (Toolbox fires at 3 days, we fire at 2; assert ours ⊇ theirs), `dailyShipments`, `unspentPoints` (anvil and Post Office), `missingBubbles` (ours counts the bribe slot; assert ours ⊇ theirs).
- **Reset-crossing test:** the W2-late fixture with `now` = save + 24 h treats vial attempts as refilled, and every `daysSincePickup` as +1.
- **Golden snapshots** (M11): §4's Then lines are lines of the plain-text Now snapshot for each fixture.
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
| Expected Return changed | Urgency and Arcade/plays/vial Goals re-evaluated within M10's budget | ER is an engine input |
| Darts played twice in one session | "Play Darts" gone after the first play | D3 |
| Character switches AFK Target mid-session | Bubble Goal re-computed for the new target | Not "done", just recomputed |
| Pet Mart not reachable on this account | Goal could be unactionable | R2: confidence M; verify before build |

## 7. Dependencies

| Module | What M6 needs | Interface |
|---|---|---|
| **M1 Sync & Account State** | The TR-3 fields (via M1 TR-11), `diagnostics.failedSections` / `failedSideReads` and `isKnown()`, `activeCharacterIndex`, `lastCloudSave`, history `previous` and `sessionStart`; the companion, tournament and server-vars side reads (already read per save). The scrubber must keep non-personal save fields M6 reads. | `AccountState`, `SaveHistory` |
| **M2 Stage & Meta Path** | `stage` for `appliesTo`; Roles (which W3 skill a character serves, for bubble fit). **M2 must define how an item from an earlier Stage's list ranks at a later Stage** (e.g. the Post Office unlock is a W2-late item, firing on a W3-early account). M6's assumption: M6 items use the shared frame positions 1 and 3, which exist in every Stage, so they need no carry-over rule. | `StageId`, `rolesFor(classIndex)` |
| **M3 AFK Safety** | **Ownership boundary:** M3 owns caps on a character's own production (food, carry, liquids, worship charge, anvil products, traps) and empty Parallel Slots; M6 owns account banks not tied to an AFK Target. Engine dedupe: if M3 and M6 emit Goals with the same `system` and subject, M3's blocker wins and M6's is dropped. M3 tells M6 if an anvil product caps before return (FR-23). | `EngineResult` merge; `anvilCapsBeforeReturn(c)` |
| **M7 Spend Plan** | None from M6. M7 owns coins; gems are M6's (D2) unless Yasser moves them. | — |
| **M8 Collections** | None; cards and obols are M8's. | — |
| **M9 Builds** | The skilling Build to name in the empty-preset Goal; until M9 ships, a Source link. M9 owns everything inside a preset already in use. | `buildFor(class, preset)` |
| **M10 Now screen UI** | Renders M6 Goals; must treat a failed M6 Detector as **not** affecting the Verdict (FR-39 says partial Detector failures turn characters Unknown: that must be limited to Detectors with `affectsVerdict: true`). Visit Order uses `spendCount`. Timers: the engine re-run on `nextChangeAt`. | `EngineResult`, TR-10 |
| **M11 Knowledge tooling** | Detector registry and contract (TR-2), YAML schema fields `params`, `priority`, `effortSeconds`, `doneWhen`, `affectsVerdict` (false for all M6 entries), the fact generator (TR-5), fixture harness with injected `now` and ER, golden snapshots. | registry, schema, `accountStateOf(fixture, now)` |
| **M12 Release** | The weekly parser re-sync runs M6's OLA contract test. | CI |
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

**R1. Toolbox quirks give wrong advice.** Toolbox counts Djonnut key earners at dialogue > 6 (the game uses > 5), prices Hoops upgrades with the Darts formula, ignores the bribe slot in `missingBubbles`, and fires keys at 3 days. *Defence:* M6 reads the raw fields and states each quirk in TR-6 and TR-7: earners at > 5, collectors at > 6; the Hoops cost from Toolbox only overstates the real cost, so a "spend" never fires falsely (it can fire late, accepted); bubble slots count the bribe; keys fire at 2 days. Oracle tests (TR-13) assert ours ⊇ Toolbox's where the quirk makes ours fire more, and equality elsewhere.

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
