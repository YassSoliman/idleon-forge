# M3 AFK Safety

Spec for [#31](https://github.com/YassSoliman/idleon-forge/issues/31), part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Build order: M1 → M11 → M2 → M10 → M13 → **M3** → M6 → M4 → M7 → M8 → M9 → M5, with M12 alongside ([#13](https://github.com/YassSoliman/idleon-forge/issues/13)).

Status: **ready**. Section 8 ruled by Yasser on 2026-10-17 (every recommendation accepted); red-teamed, see section 10. Four red-team findings wait on Yasser (RT-5, RT-6, RT-10, RT-24, plus the product half of RT-14).

Terms follow [`GLOSSARY.md`](../../GLOSSARY.md) exactly. Decisions this spec rests on:
- [ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md): deterministic advice.
- [ADR 0004](../adr/0004-source-precedence.md): source precedence.
- [ADR 0005](../adr/0005-toolbox-numbers-not-our-formulas.md): Toolbox numbers plus arithmetic, never our own formulas.
- [ADR 0006](../adr/0006-client-only-spa-parsing-in-a-worker.md): parsing in a Web Worker.
- [ADR 0007](../adr/0007-generated-facts-authored-judgment.md): generated facts, authored judgment.
- Resolutions of [#10](https://github.com/YassSoliman/idleon-forge/issues/10) (Now screen behaviour), [#11](https://github.com/YassSoliman/idleon-forge/issues/11) (Knowledge Base shape), [#12](https://github.com/YassSoliman/idleon-forge/issues/12) (Purpose), [#14](https://github.com/YassSoliman/idleon-forge/issues/14) (architecture), [#15](https://github.com/YassSoliman/idleon-forge/issues/15) (no AFK cap), [#16](https://github.com/YassSoliman/idleon-forge/issues/16) (hypothetical math), [#26](https://github.com/YassSoliman/idleon-forge/issues/26) (Leverage model) and [#27](https://github.com/YassSoliman/idleon-forge/issues/27) (priority verification).

It is written against the parallel drafts of M1 (PR #43), M4 (PR #47), M10 (PR #44) and M11 (PR #46), and uses their interface names. Where this spec needs something from them, section 7 says so.

**Fixture convention.** The two private fixtures are named by account only: the **W2-late account** (5 characters, highest Lv 60) and the **W3-early account** (6 characters, highest Lv 85). Characters are named by class and level, never by name. Numbers below come from running the vendored Toolbox parsers (pin `6c37e3d`, game 2.3.540) on `fixtures/private/*.raw.json` with `now` set to **each save's own cloud-save time** (`TimeAway.GlobalTime`). They are re-recorded as golden values on the first engine run. Note that the W3 export's `lastUpdated` is 8.5 h after its cloud save; using it as `now` would project 8.5 h of extra AFK and change every number.

## 1. Purpose

Before a player logs off, M3 answers one question per character: *if I leave now and come back in about the time I said, will anything fill up, run out, sit empty or switch off while I'm gone?* It turns the player's one-tap **Expected Return** into a return time. It then checks each character against the real limits of an AFK Stretch: food running out or the character dying, inventory and carry space filling, anvil production capping, worship charge capping, traps finishing early, empty Parallel Slots that could be filled right now, and the Unending Energy 10 h curse. It does the same for the few account-wide stockpiles that cap, such as Arcade balls and liquids. Every problem that the player can fix in the next minute, and that the fix would actually solve for the whole stretch, becomes a Verdict blocker ("Fix before you leave") with one Next Action. Everything else that M3 notices becomes a quieter line. M3 also composes the final Verdict from these blockers and M4's Purpose, and it says when the first thing will fill up for the "All set: safe to log off" banner.

## 2. Scope / Out of scope

**In scope**
- The **Expected Return** model: the default, the value learned from save history, the player's per-session choice, and the return time it implies. The chips are drawn by M10.
- **Per-character AFK-safety Checks** (FR-12 to FR-23): no AFK Target, survival and food, inventory and carry space, anvil production cap, worship charge cap, Unending Energy, traps, cauldron assignment and 3D Printer sample.
- **Account-level stockpile Checks** (FR-24 to FR-27): Arcade balls, liquids, Refinery fuel and the Cog Board.
- The **blocker rule**: when a firing Check is a Verdict blocker, a Next Action, or nothing (FR-6, FR-7).
- The **Verdict composer**: safety from M3, plus Purpose status from M4, gives Ready, Fix before you leave or Unknown (FR-9).
- **First fill**: when the first fixable thing fills up or runs out after the return, for the All-set banner (FR-11).
- The **Account State facts** M3 needs, requested from M1 through its TR-11 growth process (TR-2).
- **Observed rates** from save history: food eaten and resources gathered per AFK hour (TR-6).

**Out of scope**
- **Purpose, Milestones and "serving a worthwhile Purpose":** M4. M3 only reads `Purpose.status`.
- **Weak map, wrong skill and better-fit options:** M4 and M5. A character that dies on its map and has no owned food that fixes it is not an M3 blocker (FR-13).
- **Talent preset matches the activity:** M9 owns this Detector. If Yasser wants it to block, it uses M3's blocker contract (TR-3), but the Check is M9's.
- **Unfillable empty slots** (no trap set owned, no skull, printer level too low, Cog Board full), and raising caps (anvil Capacity points, carry bags, Egg Capacity): M6, M7 and M8 own these Goals. M3 blocks only on slots the player can fill now (FR-7).
- **Time-gated, never-skip items** (keys before the 3-day bank, daily vial attempts, salts to rank up, the Death Note building): the Priority List position-1 block in M2 and M6. They are spending, not safety (#10 item 3).
- **The Expected Return chips, banners, pills and copy layout:** M10.
- **Notifications** when something fills: not in the MVP (map, "Not yet specified").
- **W4 Systems:** Lab chain breaks, kitchen and nest caps. Breeding's `capacity × egg time` cap is the first candidate after the MVP. W4-entry accounts get the W1–W3 Checks only, plus a "Not covered yet: Lab, Cooking, Breeding (AFK safety)" line through M10 FR-26.
- **Character-select pause of trap timers:** it can't be detected from the save. It is covered by the trap fix text only (FR-21).

## 3. Functional requirements

### Expected Return

- **FR-1 Resolution order.** The Expected Return used by the engine is, in order: (1) the player's choice for the current Play Session; (2) the learned value (FR-2); (3) **8 h** (#10 item 4). The engine output reports both the used and the learned value (M10 `EngineResult.expectedReturn`).
- **FR-2 Learned value.** The learned value comes from M1's Play Sessions:
  1. Take the gaps between the end of one Play Session and the start of the next, over the last 30 days.
  2. Keep the gaps whose leaving time of day is within ±2 h of the current local time of day (D5). If fewer than 3 match, use all gaps.
  3. Take the median of the last 10 kept gaps, and round it **up** to a whole hour (minimum 1 h).
  4. With fewer than 3 gaps in total, there is no learned value.
- **FR-3 Choice lifetime.** A chip choice holds until the next Play Session starts (M1 TR-15: a gap of 15 min or more). It is stored per account under M10's preference namespace (TR-9). It is shared across tabs of the same browser, and the last write wins.
- **FR-4 Return time.** `returnAt = now + expectedReturn`, where `now` is the skew-corrected clock of TR-7. The engine re-evaluates when a new save arrives, when the Expected Return changes, and on a 60 s tick. That way countdowns stay true, and leaving 20 minutes after picking a chip still judges the right return time.

### Checks, blockers and Verdicts

- **FR-5 Check outcome.** Each applicable Check gives, per subject (a character or the account), one of three results:
  - `pass`;
  - `fires`, with `at`, the epoch ms when the problem bites (`at ≤ now` means it is already happening);
  - `unknown`, with a reason: `field-missing`, `parser-section-failed` or `needs-history` (M11 `CheckFinding`).

  A Check is applicable when its `appliesTo` matches the account's Stage (M2) and the character's class and level.
- **FR-6 Fires before the return.** A Check that uses the Expected Return fires only when `at < returnAt`. A Check about a present state (an empty fillable slot, no AFK Target, a fighter that dies) fires whatever the Expected Return.
- **FR-7 The blocker rule.** A firing Check counts as a Verdict blocker only when its entry has `effect: blocker` **and** all three of these hold:
  - **(a) Quick fix.** The fix is an in-game action the player can do this Play Session in about a minute: collect, spend, equip something already owned, assign, place or unequip. Farming, crafting and buying are not quick fixes.
  - **(b) Fillable.** Everything the fix needs is in the save now: the item is owned, the slot exists, the station has room.
  - **(c) The fix works for the whole stretch.** Its Detector reports `fixHolds: true`: if the fix were applied now, the Check would pass until `returnAt`. For example, an anvil product that would fill within the stretch even after being collected fails (c).

  A firing Check that fails (a), (b) or (c), or whose entry has `effect: next-action`, is shown as a **Next Action** (M10 category `nice`) on the row, with its reason ("fills in about 2.8 h even if collected"). It never changes the Verdict (D7).
- **FR-8 Safety per character.**
  - `unsafe` if at least one blocker fires.
  - Otherwise `unknown` if at least one applicable blocker Check is `unknown` for a reason other than `needs-history`. `needs-history` Checks fall back as FR-14 and FR-17 describe, and never make a character Unknown.
  - Otherwise `not-covered` if the character's AFK Target is one M3 has no Checks for yet (Lab or Cooking, W4). M10 FR-25's exception then applies, so the banner never says "safe to log off" over an activity nobody checked (red-team RT-9).
  - Otherwise `safe`.
  - The same rule gives the account's safety from the account-level Checks. Account safety `unknown` blocks the All-set banner like a `cannot-tell` Unknown, and can be skipped the same way (M10 D7). An Arcade or alchemy section that failed to parse therefore never yields "safe to log off" (RT-2).
- **FR-9 Verdict composition.**

  | Safety (M3) | Purpose status (M4) | Verdict | `unknownReason` |
  |---|---|---|---|
  | `unsafe` | any | Fix before you leave | — |
  | `unknown` | any | Unknown | `cannot-tell` |
  | `not-covered` | any | Unknown | `not-covered` |
  | `safe` | `serving` | Ready | — |
  | `safe` | `not-covered` | Unknown | `not-covered` |
  | `safe` | `exhausted`, `none`, `no-activity` | Unknown | `no-purpose` |
  | `safe` | `cannot-tell` | Unknown | `cannot-tell` |

  Until M4 ships, `safe` gives Ready, and the row's Focus shows "Purpose not checked yet" (D4).
- **FR-10 Blocker order.** Within a character, blockers are ranked:
  1. already biting (`at ≤ now`), then by earliest `at`;
  2. ties by Check rank: present-state Checks before stockpile Checks;
  3. then by entry id.

  Every blocker is listed. None is hidden behind "show more" (M10 FR-16). The first one is the row's summary line (M10 FR-5).
- **FR-11 First fill.** `firstFill` (per character and for the account) is the earliest `at` that is at or after `returnAt`, among Findings whose fix would hold. It has a label naming class and level, since an account can have two of a class: "Bowman Lv 60's anvil", "Arcade balls". It needs the `at` of Checks that **pass** (something that fills after the return), which M11's `CheckFinding` does not carry yet; M3 asks M11 for a `nextAt` on `pass` results (section 7). The result also counts Findings already at cap whose fix holds but that are Next Actions (for example skull-less worship at 50/50), as `alreadyFull`, so M10 can say so next to the banner instead of implying nothing is full (RT-13). When nothing has a computable time, it is `null`, and M10 says "Nothing fills up before you're back". Unfixable caps (FR-7 (c)) are excluded, so the banner never names something the player can't change.

### Per-character Checks

Each one is a Check entry in the Knowledge Base (TR-5), with the Detector named in TR-4. "Blocks" means `effect: blocker`, subject to FR-7.

- **FR-12 No AFK Target (blocks).** It fires when `afkType` is `Nothing`. `Paying_Respect` (standing at a W5 monument) is a deliberate activity, so it does not fire (RT-23). The Next Action is "Send {class} to an AFK Target before you leave". The suggested target comes from M4 or M5 when they exist, and otherwise the text is generic.
- **FR-13 Dies on its map, and owned food would fix it (blocks).**
  - It fires for a fighter whose Toolbox survivability is under 100%, when equipping one owned health food in a free food slot raises survivability to 100% (a `getMaxDamage` clone, TR-2).
  - The Next Action names the best food: the lowest stack that still reaches 100%, so stacks aren't wasted. Ties go to the largest stack. Until the unlocked food-slot count is verified (TR-12 item 1), the text reads "Equip or swap in {food}", so it stays true if every unlocked slot is taken (RT-18).
  - If no owned food fixes it, the Check does not fire. Survival then becomes M4's "not progressing" or M5's better-map problem.
- **FR-14 Health food runs out before the return (blocks).**
  - Applies only to a fighter whose survivability without food is under 100% while its survivability with food is 100% (TR-2 `survivabilityNoFood`).
  - It fires when the observed consumption (TR-6) empties the health-food stacks before `returnAt`.
  - Without an observed rate, it fires only when such a fighter has **no** health food equipped (D1). Otherwise it passes and shows "food estimate after your next session".
- **FR-15 Boost food runs out (Next Action only).** A boost-food stack that observed consumption empties before `returnAt` gives a Next Action: "Life potions run out in about 5 h". Golden food is never consumed and is ignored.
- **FR-16 Inventory full for a fighter.**
  - It blocks when the inventory has 0 free slots **and** at least one of the monster's drops that is expected at least once per hour has no non-full stack in the bag. A full bag whose every common drop still stacks loses nothing (RT-11). The fix "Deposit to storage" is fillable only when storage has free slots (`AccountAfkFacts.storageFreeSlots`).
  - It is a Next Action when the expected number of **new** item types exceeds the free slots (D6). New item types are the drops expected at least once before `returnAt` that have no non-full stack in the inventory already. The expectation is `finalKillsPerHour × hours × effectiveChance × dropRate`, arithmetic on Toolbox values and game data. Coins, cards and obols are excluded, because they don't take inventory slots.
- **FR-17 Carry or inventory full for a skiller (blocks).**
  - It fires when the stack of the AFK Target's resource is at its carry cap and there is no free slot. Gains are being lost now.
  - Until history gives an observed gather rate, only the branch above blocks (D6). With an observed gather rate (TR-6), it also fires when the remaining room (the free part of the stack plus free slots × cap) fills before `returnAt`.
  - The fix is "Deposit to storage". It holds when the empty room after depositing outlasts the stretch.
- **FR-18 Anvil production caps before the return (blocks if fixable).**
  - It fires per product with hammers when Toolbox's time to cap ends before `returnAt`.
  - It blocks only if the time to cap **from empty** (Toolbox `getTimeTillCap(..., fromZero)`) is at least `returnAt − now`, so collecting now really covers the stretch.
  - Otherwise it is a Next Action: "Anvil fills in about 2.8 h even if collected; Capacity points would help". The capacity Goal is M6 or M7.
- **FR-19 Worship charge caps before the return.**
  - It fires when the projected charge reaches the maximum before `returnAt`, or is already at it. The time is `(max − current) / ratePerHour`, from Toolbox `getPlayerWorship`.
  - It applies once `finishedWorlds` includes World 2 (Toolbox's gate).
  - It is a Next Action while the character has no skull (max 50), and it blocks once a skull is equipped (D2).
  - The fix is "Spend worship charge (or let the Wizard's Charge Syphon take it)", and it holds when `max / ratePerHour ≥ returnAt − now`.
- **FR-20 Unending Energy over 10 h (blocks when unequipping wins).** The prayer trades a 10 h AFK cap for a Class and Skill EXP bonus (Toolbox `getPrayerBonusAndCurse`; +25% at level 1). With `T = returnAt − afkSince`:
  - it **blocks** when `T > cap × (1 + bonus/100)`: unequipping gains more AFK time than the bonus is worth. The fix is "Unequip Unending Energy: it caps AFK gains at 10 h".
  - it is a **Next Action** when `cap < T ≤ cap × (1 + bonus/100)`: "Unending Energy stops AFK gains at 10 h; its +{bonus}% EXP still comes out ahead at about {T}". Unequipping there would lose EXP, so a blocker would be false (RT-17). This is arithmetic on a Toolbox value (ADR 0005).
- **FR-21 Traps (blocks).** It applies from W3-early (Toolbox gates traps on World 2 finished). It has two branches:
  - **(i)** The character has a trap set equipped and fewer traps placed than its set allows. The fix is "Place {n} traps", with a duration that just covers the Expected Return (skills dossier: Royal or Cardboard under 1 h, otherwise the duration that matches).
  - **(ii)** A placed trap has **finished** (`endsAt ≤ now`) and sits idle. The fix is "Collect and re-place traps sized to about {expectedReturn}" (the trap duration closest to it, from `trapping.fact.trap-durations`). This matches Toolbox's `trapsOverdue` (`isPast(timeLeft)`).
  - **(iii)** A placed trap is still running and ends before `returnAt`: a **Next Action** only, "Traps finish in about {t}, then sit idle until you're back". Pulling a running trap early gives up what it has built, so it is not a quick fix that holds (RT-1).
  - The trap count a set allows is a generated fact per set (`trapping.fact.trap-set-capacity`), plus 1 once the Call Me Ash bubble is level 1 or more. Toolbox's `missingTraps` reads the last character of the item name, which is wrong for `TrapBoxSet8`–`TrapBoxSet10`, so M3 does not use it (RT-8).

  The fix text adds "Close the game fully afterwards: trap timers stop on the character-select screen". A character with no trap set owned passes. Getting one is M6 or M8's Goal.
- **FR-22 Cauldron unassigned (blocks).** It applies from W2-early. It fires when `alchemy.activities[i].activity == -1` for the character. The fix is "Assign {class} to a cauldron".
- **FR-23 3D Printer sample blank (Next Action).**
  - It applies from W3-early, and only to characters the printer serves (save slot index < printer building level, per the construction dossier) that have a blank sample.
  - It is a Next Action, not a blocker, because the sampling-talent requirement is not yet confirmed (confidence M).
  - Characters past the printer's level pass. Raising the printer is M6's Goal.

### Account-level Checks

These have `subject: account`. They never change a character's Verdict. They head the Account section as "Fix before you leave", and the All-set banner needs none of them firing (D3).

- **FR-24 Arcade balls cap (blocks).** It applies once the Arcade is unlocked (W2-early). The cap is at `timeAway.Arcade + getMaxClaimTime` (48 h plus up to 10 h from stamps; Toolbox returns seconds, TR-2 stores ms). M3 owns this blocker (M10 FR-23, D9). M6's Arcade Goal (M6 FR-17) must dedupe against it, and M6 US-11's 58 h maximum is wrong for these fixtures (both have the Ball Timer stamp at 0, so 48 h) (RT-20). It fires when that is before `returnAt` or already past. The fix is "Claim Arcade balls", and it holds when `getMaxClaimTime ≥ returnAt − now`.
- **FR-25 Liquid at cap (blocks when the fix is shown to hold).** It applies to Water from W2-early, and to each other liquid once its unlock is verified (TR-12 item 6). It fires when `current ≥ maxLiquid` (truly capped, so regeneration has stopped), using the cauldron's `maxLiquid` field. The fix is "Spend {liquid} (bubbles, vials or the Liquid Shop)".
  - No regeneration rate is in Toolbox. Without an observed rate (TR-6), whether spending covers the stretch can't be shown, so FR-7 (c) fails and it is a **Next Action**: "Water is at cap: spend it; it may refill before you're back".
  - With an observed rate, it **blocks** when `maxLiquid / rate ≥ returnAt − now`, and it also fires when the liquid fills before `returnAt`.
  - Toolbox's own `liquids` alert is not used: at this pin it compares against the cauldron object instead of `maxLiquid`, so it never fires, and its threshold is a user setting (90%), not a game rule (RT-4).
- **FR-26 Refinery runs dry (Next Action).** It applies from W3-early. It fires per active salt when Toolbox's `getSaltMatsTimeLeft` hours end before `returnAt`. It is a Next Action, because more fuel means farming or printing, which is not a quick fix.
- **FR-27 Cog Board seat free (Next Action, confidence M).** It applies from W3-early. It fires when the board has an unlocked empty square and at least one character's player cog is off the board. It stays a Next Action until it is verified that off-board player cogs add no build rate (red-team 9).

### Output, text and lifecycle

- **FR-28 Wording.** Every Finding renders its entry's `text`, `why` and fix with filled slots, at least one Source and an "about Nh"/"now" time. Times under 1 h show minutes. Times are rounded and prefixed "about", never shown to the second.
- **FR-29 Done from the save.** A blocker disappears when a later save makes its Check pass (#10 item 8). M3 keeps no "done" state of its own. M10 shows it under "done this session" from M1's previous state.
- **FR-30 Contested and Stale.** A Contested Check can never block (M11 FR-6, CI). A Stale Check still blocks, because a missed food run-out costs more than a stale wording, but it carries the Stale badge and ranks after fresh blockers with the same `at`.
- **FR-31 Determinism and provenance.** The same Account State, history, Knowledge Base, Expected Return and `now` give byte-identical output. Every Finding records the entry id and the Account State fields it read (M10 `Provenance`).

## 4. User stories

Unless a story says otherwise, `now` is the fixture's own cloud-save time, history is empty, the Expected Return is the 8 h default, and the Knowledge Base is the M3 set in TR-5.

**US-1. A fighter that would die.** As a player in a Play Session, I want to be told when a character will keep dying while I'm away and I already own the food that fixes it, so that I don't lose a night of kills.
- **Given** the W2-late account, Barbarian Lv 60, fighting on Poopy Sewers: survivability 78% (53% with no food), no health food equipped, Blank food slots, and 4 kinds of health food in storage (largest stack 105), each of which lifts survivability to 100% in the clone. **When** the engine runs **Then** the row is "Fix before you leave", with the blocker "Equip or swap in a health food before you leave", naming the lowest stack that still reaches 100%, and Source "game data (Toolbox survivability)".
- **Given** the same account **When** the engine runs **Then** no food blocker shows on the Shaman Lv 44 or the Bowman Lv 54 (100% with and without food), nor on the Wizard Lv 56 (100%, with 88 health food equipped).
- **Given** the W3-early account **When** the engine runs **Then** no food blocker shows on any character. All four fighters are at 100%. The Wizard Lv 73 (62% without food) and the Squire Lv 85 (45% without) carry 153 and 146 health food, and there is no history, so FR-14 passes with "food estimate after your next session".

**US-2. Food that runs out overnight.** As a player in a Play Session, I want to know if a character's health food runs out before I'm back, so that I can top it up.
- **Given** the W3-early account, with a synthetic history in which the Squire Lv 85's health food fell by 20 per AFK hour over two earlier stretches, and an Expected Return of 8 h **When** the engine runs **Then** the Squire Lv 85 shows "Fix before you leave: health food runs out in about 7.3 h" (146 ÷ 20), with the fix "Add more health food from storage" (the synthetic storage holds 500, enough for the stretch, so the fix holds).
- **Given** the same history and an Expected Return of 4 h **When** the engine runs **Then** no food blocker shows, and the Squire's `firstFill` is the food run-out at about 7.3 h.

**US-3. Picking how long I'll be away.** As a player in a Play Session, I want to tap how long I'll be away, so that every Verdict judges the right stretch.
- **Given** no save history **When** the engine runs **Then** `expectedReturn.usedSeconds` is 28,800 and `learnedSeconds` is null.
- **Given** history with 10 gaps, of which the 4 that left within 2 h of the current time of day have gaps of 8.5 h, 9 h, 9.2 h and 7.9 h **When** the engine runs **Then** the learned value is 9 h (the median 8.75 h, rounded up). The used value is 9 h until the player picks a chip.
- **Given** the player picked 2 h in this Play Session and then a save 20 min later **When** the engine runs **Then** 2 h is still used. **Given** a new save after a 3 h gap (a new Play Session) **When** the engine runs **Then** the learned or default value is back.

**US-4. Anvil that caps, and anvil that can't be helped.** As a player in a Play Session, I want to be told to collect the anvil only when collecting actually helps, so that I don't get a red row I can't clear.
- **Given** the W2-late account and an 8 h Expected Return **When** the engine runs **Then** no anvil blocker shows on any character. Every anvil product fills within 8 h even from empty: the Barbarian Lv 60 is already at cap, 1,069/1,069, and refills in about 2.8 h. So each row has one Next Action, "Anvil fills in about {t} even if collected". These are the Squire Lv 43 ≈1.4 h, Shaman Lv 44 ≈1.6 h, Bowman Lv 54 ≈1.8 h and Wizard Lv 56 ≈5.8 h.
- **Given** the same account and a 2 h Expected Return **When** the engine runs **Then** the Barbarian Lv 60 shows the blocker "Collect anvil production: it's full now" (2.8 h from empty ≥ 2 h). The Shaman Lv 44 and the Squire Lv 43 still get only the Next Action (1.8 h and 1.5 h from empty, both under 2 h). The Bowman Lv 54 (1.8 h to cap, about 2.0 h from empty) is the edge case of FR-18: it is a blocker if and only if its exact `fromEmptyMs` is at least 7,200,000, and the golden snapshot pins that exact value and outcome (RT-21).
- **Given** the W3-early account and an 8 h Expected Return **When** the engine runs **Then** no anvil blocker shows. The account's `firstFill` is the Bowman Lv 60's anvil at about 8.2 h, because its first product caps at 8.15 h, after the return.

**US-5. Worship charge that is already full.** As a player in a Play Session, I want to see when worship charge is capped, without every row turning red over a 50-charge skull-less bar, so that the warning means something.
- **Given** the W3-early account (World 2 finished, no skulls, maximum 50 on all 6) **When** the engine runs **Then** the Squire Lv 51, Bowman Lv 60, Squire Lv 85 and Barbarian Lv 56 (50/50) each show the Next Action "Worship charge is full: spend it or Syphon it". None is a blocker. The Wizard Lv 73 (26.1/50 at 1.28/h, full in about 18.7 h) and the Shaman Lv 54 (14/50, full in about 29 h) show nothing.
- **Given** the same account with the Wizard Lv 73 wearing a skull (synthetic: max 120, same charge and rate) and a 24 h Expected Return **When** the engine runs **Then** no worship blocker shows: the charge fills in (120 − 26.1) ÷ 1.28 ≈ 73 h, after the return, and the Wizard's `firstFill` is its worship charge at about 73 h. **Given** the same mutation with the charge at 110/120 and an 8 h Expected Return **When** the engine runs **Then** the Wizard shows the blocker "Spend worship charge: it fills in about 7.8 h" (10 ÷ 1.28), and the fix holds (120 ÷ 1.28 ≈ 94 h ≥ 8 h).
- **Given** the W2-late account **When** the engine runs **Then** no worship Finding exists (World 2 is not finished).

**US-6. Account stockpiles that cap.** As a player in a Play Session, I want the account-wide things that fill to show before I log off, so that "safe to log off" is true.
- **Given** the W2-late account and an 8 h Expected Return **When** the engine runs **Then** the Account section shows one blocker, "Claim Arcade balls: full since about 48 h ago" (96.3 h since the last claim against a 48 h cap). Water at 32/32 is the Next Action "Water is at cap: spend it; it may refill before you're back", because with no history the fix can't be shown to hold (FR-25). Under D3, the All-set banner does not show even if every character were Ready. **Given** the same account with a history giving Water an observed rate whose `32 / rate` is at least 8 h **When** the engine runs **Then** "Spend Water: it's at cap (32/32)" is a second account blocker.
- **Given** the W2-late account with `diagnostics.failedSections` containing the Arcade section **When** the engine runs **Then** account safety is `unknown` and the All-set banner does not show (FR-8).
- **Given** the W3-early account and an 8 h Expected Return **When** the engine runs **Then** no account blocker shows. Arcade balls cap in about 30 h (18 h since the last claim). The active salt has about 40 h of fuel. Water is at 92.7/138.
- **Given** the W3-early account and a 48 h Expected Return **When** the engine runs **Then** the Arcade blocker fires ("caps in about 30 h"). Its fix holds, since 48 h ≥ 48 h. The Refinery gives the Next Action "Refinery runs dry in about 40 h".

**US-7. An inventory that will overflow.** As a player in a Play Session, I want to know when a fighter's bag will run out of room for new drops, so that I deposit first.
- **Given** the W3-early account, Wizard Lv 73 fighting Sir Stache: 18 of 23 slots used, 934 final kills/h, drop rate 2.29×, and 6 drop types expected at least once in 8 h that it doesn't already hold **When** the engine runs **Then** it shows "Deposit to storage: about 6 new item types expected, 5 free slots". This is a Next Action (D6: a blocker only after calibration).
- **Given** the W2-late account **When** the engine runs **Then** no inventory Finding shows. Its fighters have 14, 11, 15 and 9 free slots against 8, 7, 5 and 2 expected new types.
- **Given** a mutation of the W2-late Squire Lv 43 (mining Copper) with its Copper stack at the carry cap and 0 free slots (storage has free slots) **When** the engine runs **Then** it shows the blocker "Deposit to storage: Copper Ore is full and the bag has no free slot".

**US-8. Empty Parallel Slots I can fill now.** As a player in a Play Session, I want empty slots that I can fill right now to block, and the ones I can't fill to stay out of my way, so that Fix always means a minute's work.
- **Given** the W3-early account (0 traps placed, no trap set owned by any character) **When** the engine runs **Then** no trap Finding exists. **Given** a mutation where the Barbarian Lv 56 has a Cardboard trap set equipped and 0 placed **When** the engine runs **Then** it shows the blocker "Place 1 trap sized to about 8 h, then close the game fully" (Cardboard allows 1, and Call Me Ash is level 0 on this account). **Given** the same mutation with Call Me Ash at level 1 **Then** it says "Place 2 traps". **Given** a mutation with one Cardboard trap placed that finishes in 3 h and an 8 h Expected Return **Then** there is no blocker, only the Next Action "Traps finish in about 3 h, then sit idle until you're back"; and with that trap already finished, the blocker "Collect and re-place traps sized to about 8 h" (FR-21 (ii), (iii)).
- **Given** both fixtures (every character assigned to a cauldron) **When** the engine runs **Then** no cauldron Finding exists. **Given** a mutation setting the W2-late Bowman Lv 54's activity to −1 **When** the engine runs **Then** it shows "Assign Bowman to a cauldron".
- **Given** the W3-early account (3D Printer Lv 4, the characters in save slots 5–6 unsampled) **When** the engine runs **Then** no printer Finding exists. Those two are past the printer's level.
- **Given** the W3-early account (both Squires seated on the Cog Board, 1 free unlocked square, 4 player cogs off the board) **When** the engine runs **Then** the Account section shows the Next Action "Seat one more character on the Cog Board", with no blocker.

**US-9. Unending Energy overnight.** As a player in a Play Session, I want to be warned when a prayer will cut my AFK short, so that I don't lose half the night.
- **Given** either fixture (no prayers equipped) **When** the engine runs **Then** no Unending Energy Finding exists.
- **Given** a mutation where the W3-early Wizard Lv 73 has Unending Energy equipped, and an 8 h Expected Return **When** the engine runs **Then** no blocker shows (8 h ≤ 10 h). With a 12 h Expected Return and the prayer at level 1 (+25%), it is the Next Action "Unending Energy stops AFK gains at 10 h; its +25% EXP still comes out ahead at about 12 h" (12 ≤ 12.5). With a 24 h Expected Return, it is the blocker "Unequip Unending Energy: it caps AFK gains at 10 h".

**US-10. When the save can't tell.** As a player in a Play Session, I want an honest Unknown instead of a confident Ready when a part of the save didn't parse, so that I'm never told I'm safe on a guess.
- **Given** the W2-late account with `diagnostics.failedSections` containing the anvil section **When** the engine runs **Then** every character whose other Checks pass is Unknown ("Can't tell from the save"). The Barbarian Lv 60 stays "Fix before you leave" for its food blocker.
- **Given** a mutation where the Barbarian Lv 60's anvil production rate comes out 0 or NaN **When** the engine runs **Then** its anvil fact is null and the Check is `unknown: field-missing`, never a silent pass (TR-2).
- **Given** a W4-entry public save with a character whose AFK Target is Lab **When** the engine runs **Then** that character is Unknown `not-covered` and the banner uses M10 FR-25's "AFK safety isn't covered yet" wording (FR-8).
- **Given** a parse failure (an empty account) **When** the engine would run **Then** M3 never runs, and M10 shows "Can't read your save right now" (#10 item 13).

**US-11. The overall verdict.** As a player in a Play Session, I want a single "safe to log off" once nothing needs me, so that I can close the game with confidence.
- **Given** the W3-early account at an 8 h Expected Return, with M4 not yet shipped (D4) **When** the engine runs **Then** all 6 characters are Ready, no account blocker fires, and `firstFill` is the Bowman Lv 60's anvil at about 8.2 h ("First thing fills up in about 8h: Bowman Lv 60's anvil"), with `alreadyFull` 4 (the skull-less worship charges, US-5).
- **Given** the W2-late account at 8 h **When** the engine runs **Then** 1 character is "Fix before you leave" (the Barbarian Lv 60) and 4 are Ready (pre-M4). The Account section shows 1 blocker (Arcade), and no All-set banner shows.

## 5. Technical requirements

**TR-1 Package boundaries.**

| Where | What |
|---|---|
| `packages/account-state/src/afk-facts.ts` | Builds `CharacterAfkFacts` and `AccountAfkFacts` (TR-2) from Toolbox output. It runs in the parse worker inside the adapter, the only place that calls Toolbox functions (M1 TR-11). |
| `packages/knowledge/detectors/{afk,anvil,worship,prayers,trapping,alchemy,printer,arcade,refinery,construction}/*.ts` | M3's Detectors (TR-4). They are pure, and read only `DetectorContext` (M11 TR-4). |
| `packages/knowledge/systems/*.yaml` | M3's Check entries (TR-5), in each System's file. |
| `packages/engine/src/afk-safety/` | `resolveExpectedReturn`, `evaluateAfkSafety` (the blocker rule, safety, ordering, `firstFill`), `composeVerdict`, `observedRates`. Pure, with no Toolbox import. |

The engine runs in the worker (M10 TR-1), so the Account State and history never leave it twice.

**TR-2 Account State additions** (requested from M1 through TR-11; every field gets a `FIELD_SOURCES` and `FIELD_SECTIONS` row, and the change bumps `schemaVersion`). All times are epoch ms and absolute, so a later `now` needs no re-parse.

```ts
// SPDX-License-Identifier: GPL-3.0-only
export interface CharacterState {
  // …M1 fields…
  afk: CharacterAfkFacts | null; // null when the sections it needs failed
}

export interface CharacterAfkFacts {
  /** When this character's AFK Stretch started: its own last-played time (Toolbox afkTime). */
  afkSince: number;
  food: Array<{ slot: number; item: string; kind: 'health' | 'boost' | 'golden' | 'other'; amount: number }>;
  freeFoodSlots: number | null;                 // null until the unlocked slot count is verified (TR-12)
  fighting: null | {
    survivability: number;                      // %, getMaxDamage(c)
    survivabilityNoFood: number;                // %, getMaxDamage({ ...c, food: [] })
    finalKillsPerHour: number;
    dropRate: number;                           // getDropRate
    /** Owned health foods (inventory + storage) that lift survivability to 100% when put in a free slot. */
    fixingFoods: Array<{ item: string; amount: number }>;
    /** Expected drop counts per hour, from monsterDrops × kills/h × drop rate; coins, cards and obols excluded. */
    dropsPerHour: Array<{ item: string; perHour: number }>;
  };
  inventory: {
    usedSlots: number; totalSlots: number;
    stacks: Array<{ item: string; amount: number; cap: number }>; // cap from Toolbox getItemCapacity for the item's bag type
  };
  anvil: Array<{ item: string; hammers: number; capAt: number; fromEmptyMs: number }>; // getTimeTillCap, with and without fromZero
  worship: null | { charge: number; max: number; ratePerHour: number; hasSkull: boolean }; // getPlayerWorship, at parse time
  prayers: Array<{ name: string; bonus: number }>; // activePrayers, bonus from getPrayerBonusAndCurse
  traps: null | { allowed: number; placed: Array<{ critter: string; endsAt: number }>; setEquipped: boolean }; // allowed from trapping.fact.trap-set-capacity + Call Me Ash
  cauldronAssigned: boolean | null;
  printer: null | { served: boolean; sampled: boolean };
}

export interface AccountAfkFacts {
  /** Parse time used for every projection (= M1 asOf). */
  projectedAt: number;
  arcade: null | { lastClaimAt: number; maxClaimMs: number };  // getMaxClaimTime returns seconds; × 1000 here
  liquids: Array<{ index: number; current: number; max: number }>; // max = liquidCauldrons[i].maxLiquid
  salts: Array<{ salt: string; active: boolean; dryAt: number | null }>; // getSaltMatsTimeLeft
  storageFreeSlots: number | null;              // chest free slots, for the deposit fixes (FR-16, FR-17)
  cogBoard: null | { freeUnlockedSquares: number; playersOffBoard: number[] };
}
```

- Trap `endsAt` is anchored to the cloud-save time: `lastCloudSave + (trapTime − timeElapsed)`. Toolbox's own `timeLeft` adds the remaining time to the parse clock, which drifts when the save is old.
- `fixingFoods` and `survivabilityNoFood` cost up to 2 + K `getMaxDamage` calls per fighter, with K ≤ 4 distinct owned health foods, tried from the smallest useful stack upward.
- **Finite or null.** Every derived number (times, rates, `capAt`, `fromEmptyMs`, `ratePerHour`, `dryAt`, survivability) must be finite and in a sane range (rates > 0, times within 30 days of `projectedAt`). Otherwise the fact is null, so its Check returns `unknown: field-missing`. Toolbox divides by production rates that can be 0 on patch day, and a NaN `at` would make every comparison false and the Check silently pass (RT-3).
- The size budget is under 20 KB for 11 characters, well inside M1's 1 MB.

**TR-3 Engine API.**

```ts
// SPDX-License-Identifier: GPL-3.0-only
export interface ExpectedReturn {
  usedMs: number;
  learnedMs: number | null;
  source: 'player' | 'learned' | 'default';
}
export function resolveExpectedReturn(input: {
  choice: { seconds: number; chosenAt: number } | null; // M10 TR-8 `expectedReturn` preference
  sessions: PlaySession[];                              // M1 SaveHistory.playSessions
  currentSessionStart: number;
  now: number;
  timeZoneOffsetMin: number;                           // injected; the engine never reads the clock or locale
}): ExpectedReturn;

export type Safety = 'safe' | 'unsafe' | 'unknown' | 'not-covered';

export interface SafetyFinding {
  key: string;                // `${entryId}@${subject}`, as M10 NextAction.key
  entryId: string;
  subject: Subject;           // M10: 'account' | `c${index}`
  role: 'blocker' | 'next-action';
  /** When it bites; null for present-state Checks. */
  at: number | null;
  fixHolds: boolean;
  demotedBecause: null | 'not-quick' | 'not-fillable' | 'fix-does-not-hold' | 'effect-next-action';
  nextAction: NextAction;     // M10 shape, text already filled
}

export interface AfkSafetyResult {
  expectedReturn: ExpectedReturn;
  returnAt: number;
  characters: Array<{
    index: number;
    safety: Safety;
    findings: SafetyFinding[];    // blockers first (FR-10), then next-actions
    firstFill: Fill | null;       // M10 Fill
  }>;
  account: { safety: Safety; findings: SafetyFinding[]; firstFill: Fill | null };
  firstFill: Fill | null;
  alreadyFull: number;          // Findings already at cap that are Next Actions (FR-11)
}

export function evaluateAfkSafety(ctx: DetectorContext, kb: CompiledKnowledge, stage: StageResult): AfkSafetyResult;
export function composeVerdict(safety: Safety, purpose: PurposeStatus | 'not-implemented'): Verdict; // M10 Verdict
```

`DetectorContext.expectedReturnMs` (M11) carries `usedMs`. M10's engine input takes seconds; the engine converts once at its boundary. Other modules' blocker Checks (for example M9's preset Check) go through the same `evaluateAfkSafety` pipeline and FR-7 rule.

**TR-4 Detectors.** Every Detector returns M11 `CheckFinding`s, extended with `fixHolds` and `demotedBecause`. "Facts" means TR-2 fields.

| Detector | Reads | Fires when | `at` | `fixHolds` |
|---|---|---|---|---|
| `afk/no-afk-target` | `afkType` | `Nothing` | — | true |
| `afk/dies-fixable-by-food` | `fighting.survivability`, `fixingFoods`, `freeFoodSlots` | survivability < 100 and `fixingFoods` non-empty and a free slot exists (or `freeFoodSlots` unknown and a Blank slot exists) | — | true |
| `afk/health-food-runs-out` | food, `survivabilityNoFood`, observed rate | food-dependent fighter, and stacks ÷ rate ends before the return; without history, no health food | `afkSince + stack/rate` | storage holds enough to cover the stretch at the rate |
| `afk/boost-food-runs-out` | food, observed rate | needs history | as above | — (next-action) |
| `afk/fighter-inventory-full` | `inventory`, `dropsPerHour`, `storageFreeSlots` | 0 free slots and a drop expected ≥ 1/h has no non-full stack | now | storage has free slots |
| `afk/fighter-inventory-overflow` | `inventory`, `dropsPerHour`, params `minExpected` (1) | new types > free slots | the hour the free slots run out | true when depositing frees enough slots |
| `afk/skiller-carry` | `inventory`, AFK Target resource, observed rate | target stack at cap and 0 free; or room ÷ rate ends before the return | as computed | room after deposit ÷ rate ≥ the stretch |
| `anvil/caps-before-return` | `anvil[]` | `capAt < returnAt` | `capAt` | `fromEmptyMs ≥ returnAt − now` |
| `worship/charge-caps-skull` | `worship`, Stage | skull equipped; full now, or full before the return | `projectedAt + (max − charge)/rate` | `max/rate ≥ the stretch` |
| `worship/charge-caps-no-skull` | `worship`, Stage | no skull; full now, or full before the return | as above | — (next-action) |
| `prayers/unending-energy` | `prayers`, `afkSince` | equipped and `returnAt − afkSince > cap`; blocks only past `cap × (1 + bonus/100)` (FR-20) | `afkSince + cap` | true |
| `trapping/slots-and-timers` | `traps` | (i) set equipped and placed < allowed; (ii) an `endsAt ≤ now` | (ii) earliest `endsAt` | true |
| `trapping/finishes-early` | `traps` | (iii) a running trap with `now < endsAt < returnAt` | earliest such `endsAt` | false (next-action) |
| `alchemy/cauldron-unassigned` | `cauldronAssigned` | false | — | true |
| `printer/sample-blank` | `printer` | `served && !sampled` | — | true |
| `arcade/balls-cap` | `arcade` | `lastClaimAt + maxClaimMs < returnAt` | that time | `maxClaimMs ≥ the stretch` |
| `alchemy/liquid-cap` | `liquids`, observed rate | `current ≥ max`; or, with a rate, fills before the return | now, or projected | with a rate, `max / rate ≥ the stretch`; without one, false |
| `refinery/fuel-runs-out` | `salts` | an active salt with `dryAt < returnAt` | `dryAt` | false (not quick) |
| `construction/cog-seat-free` | `cogBoard` | free square ≥ 1 and players off board ≥ 1 | — | true |

Each Detector ships at least one `fires` and one `silent` example on the fixtures, plus mutation examples for the branches the fixtures don't reach (M11 `FixtureExample`). Section 4's acceptance criteria are those examples.

**TR-5 Knowledge Base entries.** These use M11's schema (`CheckEntry`: `subject`, `effect`, `detector`, `usesExpectedReturn`, `needsCharacter`). They are all authored judgment: the words, the `effect`, and the thresholds in `params`. Example:

```yaml
# packages/knowledge/systems/anvil.yaml
- id: anvil.check.caps-before-return
  title: Anvil fills while you're away
  text: "Collect {product:name} from the anvil: it {when}"
  why: Anvil production stops at capacity, so every hour past it is lost production and Smithing EXP.
  values: { fix: "Open the anvil and collect, then leave the hammers on the same products." }
  sources:
    - url: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-1/anvil.ts
      title: IdleOn Toolbox, getTimeTillCap and getAnvilFutureProduction
      tier: 1
      verified: 2026-10-17
      gameVersion: 2.3.540
    - url: https://github.com/YassSoliman/idleon-forge/blob/research/w1-systems/docs/research/systems/w1-systems/anvil-smithing.md
      title: W1 dossier, Anvil and Smithing
      tier: 1
      verified: 2026-10-17
      gameVersion: 2.3.540
      verification: confirmed
  appliesTo: { stages: all }
  confidence: H
  status: active
  subject: character
  effect: blocker
  usesExpectedReturn: true
  detector: { id: anvil/caps-before-return }
```

| Entry | System | `effect` | Conf | Main Sources |
|---|---|---|---|---|
| `afk.check.no-afk-target` | afk | blocker | H | Toolbox `afkType`; skills dossier |
| `afk.check.dies-fixable-by-food` | afk | blocker | H | Toolbox `getSurvivability` (`damage.ts`); character-builds, Food |
| `afk.check.health-food-runs-out` | afk | blocker | H | mechanics §1 (`AFKfoodsTimeRedux`); PV 1.8 confirmed |
| `afk.check.boost-food-runs-out` | afk | next-action | M | character-builds, Food |
| `afk.check.fighter-inventory-full` | afk | blocker | H | game-loop §AFK Setup; Toolbox `monsterDrops` |
| `afk.check.fighter-inventory-overflow` | afk | next-action until calibrated (D6) | M | Toolbox `monsterDrops`, `getDropRate` |
| `afk.check.skiller-carry` | afk | blocker | H | skills dossiers ("carry cap full" idle states); Toolbox `getItemCapacity` |
| `anvil.check.caps-before-return` | anvil | blocker | H | Toolbox `anvilOverdue`; PV 3.1 |
| `worship.check.charge-caps-skull` | worship | blocker (D2) | H | Toolbox `worshipAlerts.chargeOverdue`; worship dossier |
| `worship.check.charge-caps-no-skull` | worship | next-action (D2) | H | Toolbox `worshipAlerts.chargeOverdue`; worship dossier |
| `prayers.check.unending-energy` | prayers | blocker | H | mechanics §1 (N.js `Math.min(Time, 36E3)`); Toolbox `worshipAlerts` |
| `trapping.check.slots-and-timers` | trapping | blocker | H | Toolbox `trapsAlerts.trapsOverdue`; trapping dossier; PV 5.14 |
| `trapping.check.finishes-early` | trapping | next-action | H | trapping dossier (traps that end early sit idle) |
| `alchemy.check.cauldron-unassigned` | alchemy | blocker | H | Toolbox `alchemy.noActivity`; W2 dossier |
| `printer.check.sample-blank` | printer | next-action | M | construction dossier, 3D Printer; PV 5.3 |
| `arcade.check.balls-cap` | arcade | blocker | H | Toolbox `getMaxClaimTime`; W2 dossier, Arcade |
| `alchemy.check.liquid-cap` | alchemy | blocker (demoted by FR-7 (c) until a rate exists) | H | Toolbox `liquidCauldrons[].maxLiquid`; W2 dossier, Liquids |
| `refinery.check.fuel-runs-out` | refinery | next-action | H | Toolbox `getSaltMatsTimeLeft`; construction dossier |
| `construction.check.cog-seat-free` | construction | next-action | M | construction dossier |

**Generated facts (ADR 0007), written by M11's generator at each parser re-sync:**
- `prayers.fact.unending-energy-cap`: 36,000 s. It is parsed from the prayer's curse text in Toolbox prayer data (`Max_AFK_time_is_now_10_hours`). Generation fails loudly if the text no longer parses, so a patch that moves the cap breaks the build instead of the advice.
- `trapping.fact.trap-durations`: from Toolbox `trapsInfo`, used for the "sized to {expectedReturn}" suggestion.
- `trapping.fact.trap-set-capacity`: the number of traps each trap set allows, from items data (not from the item name's last character).
- `afk.fact.food-kinds`: from items.json `Type` (`HEALTH_FOOD`, `BOOST_FOOD`, `GOLDEN_FOOD`).

All other numbers are Toolbox values computed at runtime (ADR 0005), so they need no entry.

**TR-6 Observed rates from save history.** These are arithmetic on observed data, so no game formula is involved (ADR 0005).
- **Observation.** A character's AFK gains are applied when it is loaded (mechanics §1). One observation is two consecutive history records for the same character where:
  - `afkSince` moved forward (the character was loaded), and
  - its AFK Target is unchanged across the interval.

  Then `rate = (amountBefore − amountAfter) / hoursAway` for food, and `(amountAfter − amountBefore) / hoursAway` for the gathered resource, with `hoursAway = afkSince_after − afkSince_before` (in hours).
  - `amountBefore` must come from a record saved within 10 min before the character's previous switch-away (its `afkSince_before`), and `amountAfter` from a record saved within 10 min after the load. Records further away include active play (fighting, deposits, hand gathering) and are discarded. This needs M1 to keep, per character, the records around each load, not only the first and last save of older Play Sessions (M1 TR-14, section 7) (RT-15).
- **Guards.** Discard an observation when:
  - the amount moved the "wrong" way (a refill or a deposit);
  - `hoursAway` < 0.5;
  - the item's slot changed.

  Use the median of the last 5 valid observations in 30 days. With fewer than 2, the result is `needs-history`.
- **Liquids.** The rate is `Δcurrent / Δt` between consecutive saves with no level change and no spend (current only rose), and only while `current < max` at both ends; an interval that touches the cap is discarded, since a capped liquid reads as a rate of 0.
- **Cost.** These scans are bounded at 30 days and are memoised per history version, so a new save adds one comparison.

**TR-7 Time anchors.**
- Every projection Toolbox makes uses the parse clock (`asOf`). TR-2 stores absolute times, so `evaluateAfkSafety` at a later `now` subtracts nothing and never re-parses.
- The device clock may be ahead of or behind the server's. Durations are measured against the save's own `TimeAway.GlobalTime` (M1 `lastCloudSave`): `asOf` is pinned to `max(device now, lastCloudSave)`, and negative durations are clamped to 0.
- **One corrected `now`.** On each save arrival the engine records `skew = receivedAt − lastCloudSave`, clamped to ±10 min (a save arrives within seconds of being written). Every `now` the engine uses, including `returnAt` (FR-4) and the 60 s tick, is `device now − skew`. A device clock that is off therefore moves no return time and makes nothing "already full" (RT-19).
- Golden tests inject `now = lastCloudSave` (the fixture convention above).

**TR-8 Performance budgets** (both on a mid-range laptop, as in M1 and M10).
- **Facts build in the worker:** at most 350 ms per save in the worst case (11 fighters × 6 `getMaxDamage` calls × 5 ms), and typically about 100 ms. Measured: `getMaxDamage` takes 2–5 ms per call on both fixtures. It runs once per save, after the Now screen's first render from the previous facts, so it never blocks a chip tap (RT-22).
- **`evaluateAfkSafety` plus `composeVerdict`:** at most 10 ms, so a chip tap or the 60 s tick re-evaluates without a re-parse, inside M10's TR-12 budget.
- The observed-rate scan over 30 days of history takes at most 20 ms cold, and at most 1 ms memoised.

**TR-9 Storage.** M3 adopts M10 TR-8 as written: the Expected Return choice is M10's `expectedReturn` preference (`{seconds, chosenAt}`) under `activeon:<uidHash>:`, so no uid is stored in a key or value. It expires at the next Play Session start, is cleared by "Clear my data", and syncs across tabs through the `storage` event. M3 stores nothing else: rates are recomputed from M1's history (RT-16).

**TR-10 Security and privacy.**
- Nothing M3 computes leaves the device.
- "Report this" on an M3 Finding sends the entry id, the Detector id, the Knowledge Base version, the game version, the Stage, the class and level, the Expected Return, and the Finding's slot values. It never sends names, the save or history (#11 item 15).
- Detectors cannot read the network, the clock or storage (M11).

**TR-11 Tests.**
- Every Detector has `fires` and `silent` examples, with the section 4 criteria as tests.
- Both private fixtures run locally. The scrubbed W2 save (M1 D1) and, once Joseph agrees, the scrubbed W3 save run in CI, with golden Now-screen snapshots at Expected Returns of 2 h, 8 h and 24 h. M11's `## Verdict changes` diff then shows every Verdict a Knowledge Base PR flips.
- There are property tests for:
  - **Monotonicity.** For a longer Expected Return, the set of firing Findings only grows (a time-based Check that fires at a shorter return still fires). A Finding's role may change only from blocker to Next Action, and only when its `fixHolds` flips to false (RT-14).
  - **Fix-holds soundness.** Applying the fix as a state mutation makes the Check pass at `returnAt`.

**TR-12 Verifications before build** (open facts, not product decisions; each is a task in the M3 build ticket):
1. The unlocked food-slot count. Toolbox's `food` is a 16-entry buffer (character-builds dossier). Until then `freeFoodSlots` is null, and the Detector uses the first Blank slot.
2. The carry-cap category of each item for `getItemCapacity`.
3. Board-square unlock and off-board player cogs (FR-27).
4. Whether a blank printer sample needs the Printer Sampling talent (FR-23).
5. One calibration Play Session per account (M12): compare M3's anvil, worship and inventory predictions against in-game numbers after a real stretch.
6. The unlock gate of liquids 2–4 (the W2 dossier rates it M; locked liquids still report a `maxLiquid`). Until verified, FR-25 runs for Water only.
7. What pulling a running trap gives (FR-21 (iii)), to confirm it stays a Next Action.

## 6. States and edge cases

| State | Behaviour |
|---|---|
| **First run, no history** | The Expected Return is 8 h (`source: default`). FR-14, FR-15, FR-17 rate branches and FR-25 rate branch use their no-history fallbacks. Food and gather estimates read "after your next session". Never Unknown for lack of history alone (FR-8). |
| **Loading** (no Account State yet) | M3 doesn't run. M10 shows its loading state. |
| **Empty or broken parse** | M3 never runs on a failed parse. M10 shows "Can't read your save right now" with the last good save time (#10 item 13). |
| **A Toolbox number is NaN, Infinity or 0 where a rate is needed** | The fact is null and its Check is `unknown: field-missing` (TR-2). It never silently passes. |
| **One parser section failed** | Facts that depend on it are null. Their Checks return `unknown: parser-section-failed`, and an otherwise-safe character becomes Unknown ("Can't tell from the save", US-10). A Check that can still fire from other fields does. |
| **Stale patch** (game version ahead of the parser pin) | M3 runs, because M1 only blocks on a failed parse. Stale entries keep blocking, with their badge (FR-30). M10's "game updated, parser not caught up" banner applies. |
| **Save is old** (no save for a while, player away from the game) | Projections count down from `now`, so a Ready can flip to Fix while the screen is open, which is correct. M10's "last cloud save Ns ago" shows the age. A character that will be visited resets its `afkSince` on the next save. |
| **Character being played** | Its `afkSince` is about `now`. Its AFK-time Checks (Unending Energy, food) measure from when it was last saved. The final check before leaving is the save made on switching away. |
| **Expected Return shorter than the time already away** | Already-biting problems (`at ≤ now`) fire whatever the Expected Return. |
| **Very long Expected Return** (24 h or more) | Fix-holds tests demote more blockers to Next Actions (anvil, worship). Monotonicity is tested (TR-11). The banner may legitimately say nothing fills before return only when nothing computable does. |
| **Offline** | The last good state keeps being evaluated on the tick. M10 shows the offline banner. No new done-detection. |
| **Multiple tabs** | Each tab evaluates its own Account State. The Expected Return choice syncs through the `storage` event (TR-9). History records are de-duplicated by M1. |
| **Second account on the same browser** | The Expected Return and the learned value are per `uid`. The other account's history is never read (M1 FR-22). |
| **Pasted save** | It is evaluated like a live one. It is not in history (M1 D2), so it doesn't feed observed rates. |
| **Time zones and DST** | The Expected Return is a duration, never a clock time. The learned value's time-of-day bucket uses the injected offset at each gap's leaving time. |
| **Device clock skew** | Durations are anchored to the save's own `GlobalTime`, and `now` is skew-corrected (TR-7). Negative durations are clamped to 0. |
| **Trap timers paused** | The character-select screen stops trap timers, and that can't be seen in the save. The fix text tells the player to close the game fully (FR-21). |
| **Account with no W2 or W3 unlocked** | Stage gating keeps worship, traps, printer, Refinery, Cog Board, cauldron, liquid and Arcade Checks silent (`appliesTo`). |
| **W4-entry account** | The W1–W3 Checks run. Lab, Cooking and Breeding AFK safety shows as "Not covered yet" (M10 FR-26). A character whose AFK Target is Lab or Cooking is `not-covered`, not Ready (FR-8). |
| **Two fixes that conflict** | Collecting the anvil adds items to a full bag. FR-10 ranks present-state Checks (inventory) before stockpile Checks (anvil), so "Deposit" comes first. Fix-holds for the anvil assumes the deposit is done. |

## 7. Dependencies

| Module | M3 uses | Interface |
|---|---|---|
| **M1 Sync & Account State** | Account State, plus the TR-2 facts added through its TR-11 process; `diagnostics` and `isKnown` for Unknown; history for observed rates, including the records around each character load (TR-6, an ask on M1 TR-14); Play Sessions for the learned Expected Return; the save arrival time for skew (TR-7) | `AccountState`, `CharacterState.afk`, `AccountState.afk`, `SaveHistory.playSessions/since`, `FIELD_SOURCES`, `FIELD_SECTIONS` |
| **M2 Stage & Meta Path** | Stage for each Check's `appliesTo`; worlds finished for the W2 and W3 gates | `StageResult` |
| **M4 Purpose & Milestones** | `Purpose.status` for `composeVerdict` (FR-9). M4 never produces a blocker (M4 §2) | `PurposeStatus` |
| **M5 Higher-leverage options** | (reverse) M5 may read `AfkSafetyResult` so as not to suggest a move that makes a character unsafe | `AfkSafetyResult` |
| **M6 Unspent & idle** | M3 owns the Arcade cap blocker; M6 FR-17 dedupes against it and corrects US-11's 58 h (FR-24). (shared boundary) slots that are empty but can't be filled now, and caps to raise, are M6's Goals. M3's fillable-slot blockers point to M6's Goal when it exists. The M4 draft says "Empty slots are M6's, capping slots are M3's". This spec refines that: empty and **fillable now** is M3, empty and unfillable is M6. | Goal ids such as `trapping.goal.*`, `anvil.goal.capacity` |
| **M7 Spend Plan** | The anvil-Capacity point advice behind FR-18's Next Action | Spend line keys |
| **M9 Builds** | (reverse) the preset-for-activity Check uses M3's blocker contract if it blocks | `evaluateAfkSafety` pipeline, FR-7 |
| **M10 Now screen UI** | Renders the Verdict, blockers, Next Actions, `firstFill`, `alreadyFull` and the Expected Return chips. Owns the Expected Return preference (TR-8); account safety `unknown` blocks All set like `cannot-tell` (FR-8). The chips are 2/4/8/12/24 h plus a learned chip. The All-set banner rule is extended by D3 (M10 FR-25 takes the same change). | `EngineResult.expectedReturn`, `CharacterResult.verdict/goals/firstFill`, `Fill` |
| **M11 Knowledge tooling** | Entry schema (`CheckEntry`), Detector interface and registry, fixture examples, goldens, the blocker evidence bar (confidence H), and generated facts. **Asks:** `CheckFinding` gains `fixHolds` and `demotedBecause` on `fires`, and an optional `nextAt` on `pass` (FR-11). Each M3 entry has one `effect` and one `confidence`, so split rules are separate entries (TR-5) | `DetectorContext`, `CheckFinding`, `kb check`, `kb golden` |
| **M12 Release** | The calibration Play Session (TR-12 item 5), which promotes D6's inventory Next Action to a blocker | — |
| **M13 Suggestions** | "Report this" on M3 Findings, with the payload in TR-10 | Suggestion context |

## 8. Decisions

Ruled by Yasser on 2026-10-17 (PR #54): every recommendation accepted as written.

- **D1. Food run-out before any history: presence only.** A food-dependent fighter with **no** health food equipped blocks. Otherwise the Check passes with "food estimate after your next session" until history gives an observed rate (TR-6). *Why:* a worst-case bound (one food per cooldown) would flag the W2-late Wizard Lv 56 as running out in 44 min while it sits at 100%, which is exactly the false blocker the done bar forbids. Making every food-dependent fighter Unknown would make most fighters Unknown on day one. Observed consumption is arithmetic on what the save shows (ADR 0005), and it arrives after one or two stretches. Applied in FR-14 and TR-4.
- **D2. Worship charge cap: Next Action without a skull, blocker with one.** A character with no skull (max 50) gets a Next Action when its charge caps. Once a skull is equipped, a cap before the return blocks. *Why:* on the W3-early account, blocking every capped charge turns 4 of 6 rows red every session over about 1.24 charge/h the account isn't using yet, which teaches the player to ignore red. Once a skull is on, the player has invested in Worship, and letting it cap is real loss. Applied in FR-19, TR-5 and US-5.
- **D3. Account stockpiles head the Account section and gate the All-set banner.** Account-level blockers (Arcade balls, liquids at cap) show at the top of the Account section as "Fix before you leave". They never change a character's Verdict, and "All set: safe to log off" requires none of them firing. *Why:* on the W2-late account the Arcade has been full for about 48 h and Water is at cap, so "safe to log off" would be false. Putting them on a character's row would make an unrelated character "Fix before you leave". This extends M10 FR-25, so M10's spec takes the same change. Applied in the account-level Checks, FR-11 and US-6.
- **D4. Before M4 ships, Ready = safe.** A safe character is Ready, with a "Purpose not checked yet" line in Focus. *Why:* making every safe character Unknown would make the Now screen useless for the 2–3 modules in between, and a fourth "Safe" pill adds a state the glossary doesn't have. The Focus line keeps it honest, and M4's arrival changes only `composeVerdict`'s input. Applied in FR-9 and US-11.
- **D5. The learned Expected Return knows the time of day.** It is the median of gaps whose leaving time is within ±2 h of the current time of day, falling back to all gaps with fewer than 3 matches. *Why:* with a plain median, someone who plays three times a day (gaps of about 3 h, 4 h and 9 h) gets about 4 h at bedtime, and overnight Verdicts come out Ready while the anvil, Arcade and food cap at 6 h. That is the most dangerous wrong Ready this module can produce. The bucket is cheap and needs no new storage. Applied in FR-2 and US-3.
- **D6. Drop and gather estimates are Next Actions until calibrated.** For fighters, "0 free slots" blocks from day one, and the drop estimate is a Next Action until one calibration Play Session per account (M12) agrees with what actually dropped; then it becomes a blocker. For skillers, only "target stack full and no free slot" blocks until history gives an observed gather rate. *Why:* the estimate is useful today (it flags the W3-early Wizard Lv 73, with 5 free slots against about 6 new item types in 8 h), but M11 requires confidence H for a blocker, and nobody has checked drop arithmetic against a real stretch at W1–W3. Dropping the estimate entirely would throw away the main limit on long AFK Stretches. Applied in FR-16, FR-17, TR-5 and US-7.
- **D7. Caps the player can't beat this session are one quiet Next Action.** An anvil product that fills within the stretch even right after collecting (as on all 5 W2-late characters at 8 h) shows one Next Action per character ("Anvil fills in about 2.8 h even if collected; Capacity points would help"). It is never a blocker and never the `firstFill`. *Why:* blocking gives a red row the player can never clear, and hiding it buries a true fact that explains why gains look low and points to the real fix (Capacity, the Leverage model's "Capacity only if a product fills before the Expected Return"). Applied in FR-7, FR-11, FR-18 and US-4.

## 9. Red-team notes

1. **A wall of red.** If most rows are "Fix before you leave" every session, players stop reading Verdicts. *Defence:*
   - FR-7 blocks only on quick, fillable fixes that hold for the whole stretch. Unfixable anvil caps (all 5 W2-late characters at 8 h), skull-less worship (4 W3-early characters, D2), unowned traps and printer slots past its level all stay out of the Verdict.
   - The golden snapshots pin the count: the W2-late account has 1 character blocker plus 1 account blocker (Arcade) at 8 h, and the W3-early account has 0.
   - M11's `## Verdict changes` diff shows any Knowledge Base PR that adds red.
2. **A false Ready, the worst failure.** The done bar is "no wrong Verdict blocker", but a missed food run-out loses a night. *Defence:*
   - A failed parser section makes an otherwise-safe character Unknown, never Ready (FR-8).
   - Time-of-day learning prevents a daytime Expected Return being used at bedtime (D5).
   - The Expected Return chip is always visible, so a one-tap correction is available.
   - Monotonicity property tests (TR-11).
   - Stale Checks keep blocking (FR-30).
3. **Wrong clock, wrong answer.** Toolbox projects to its parse clock. The W3 fixture's export time is 8.5 h after its save, and its traps' `timeLeft` ignores the save's age. *Defence:* absolute times anchored to `GlobalTime` (TR-2, TR-7), an injected `now`, the clamping rules, and goldens pinned to the cloud-save time.
4. **Wrong food or drop arithmetic.** Food duration lives in game code that Toolbox doesn't mirror (`AFKfoodsTimeRedux`). The drop estimate is ours. *Defence:*
   - No worst-case bound (D1).
   - Observed rates from the player's own history (TR-6), with guards.
   - The drop estimate stays a Next Action until M12's calibration (D6).
   - Every time shows "about".
5. **Patch breakage.** Lava renames a prayer, moves the 10 h cap, or changes trap data. *Defence:*
   - The Unending Energy cap is a generated fact parsed from the curse text, and it fails the build if the text changes (TR-5).
   - Field renames fail M1's contract tests (`AccountShapeError`), not M3 at runtime.
   - Every Detector has fixture examples, so a re-sync PR shows changed findings.
6. **Advice that makes things worse.** "Collect the anvil" into a full bag, "equip food" with no free slot, or "spend charge" on a character that can't reach a totem. *Defence:*
   - Present-state Checks rank before stockpile Checks (FR-10).
   - The fillable test (FR-7 (b)) requires a free food slot.
   - The worship fix offers Charge Syphon, a Role action from the Wizard (Leverage model §4.3).
7. **Contested or low-confidence advice blocking.** *Defence:* CI rejects contested blockers, and M11 requires confidence H for one. Every M-confidence Check in TR-5 (printer, cog seat, boost food, drop estimate) is a Next Action.
8. **Privacy leak.** Character names in Detector slots, player-cog names in the Cog Board (Toolbox's cog names embed character names), or history sent out. *Defence:*
   - Slots use class and level, and the subject key is `c<index>` (M10).
   - The cog facts carry indices only (TR-2 `playersOffBoard: number[]`).
   - The Report payload is fixed (TR-10).
   - Nothing leaves the worker but the result.
9. **Scope collisions with M4 and M6.** M4's draft says "empty slots are M6's". The Leverage model's W3-early worked example lists "printer samples on the 2 unsampled characters" as firing, but the printer is at Lv 4 with 6 characters, so by the construction dossier's rule those 2 can't print. *Defence:*
   - The boundary is stated in section 7: fillable now is M3, unfillable is M6.
   - M3 follows the dossier's H rule and does not flag those two. The M6 author should reconcile the worked example.
   - The cog-seat Check stays a Next Action until it is verified whether off-board player cogs on the shelf already add build rate (TR-12 item 3).
10. **Multi-tab and multi-account confusion.** One tab says 2 h and another says 8 h, or a family member signs in on the same browser. *Defence:* the choice is per `uid` and synced through the `storage` event (TR-9), the learned value is per account, and the Expected Return in use is shown on every screen (M10 chips).

## 10. Red-team log

Independent red-team on 2026-10-17, charged to find false blockers and false "Ready" overnight, checked against the vendored Toolbox (pin `6c37e3d`), both private fixtures and the sibling specs. Every finding below was re-verified before its verdict. Totals: 24 findings (P0 1, P1 5, P2 11, P3 7); 20 fixed (RT-14 in part), 4 deferred to Yasser (plus the product half of RT-14), 0 rejected.

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| RT-1 | P0 | Trap branch (ii) blocked on traps still running, and "collect and re-place" throws their progress away | Fixed | (ii) blocks only on finished traps (`endsAt ≤ now`, Toolbox `trapsOverdue`); a running trap that ends before the return is the new Next Action (iii) (FR-21, TR-4, TR-5, US-8). |
| RT-2 | P1 | An account-level Check that is `unknown` (failed Arcade or alchemy section) still let "All set" show | Fixed | Account safety uses FR-8's rule, and `unknown` blocks the banner like `cannot-tell` (FR-8, US-6, section 7). |
| RT-3 | P1 | A NaN, Infinity or 0 from Toolbox on patch day makes `<` false, so Checks pass silently | Fixed | TR-2 "finite or null" rule; such facts are `unknown: field-missing` (TR-2, section 6, US-10). |
| RT-4 | P1 | Liquid blocker: `fixHolds` hard-coded true with no regen rate; `0.95 × max − 5` fires at 39% on a cap of 9; Toolbox's alert is dead code and its 90% is a user setting; unlock gate only M | Fixed | Fires at `current ≥ maxLiquid`; a Next Action until an observed rate shows the fix holds; Water only until the unlock gate is verified (FR-25, TR-4, TR-12 item 6, US-6, US-11). |
| RT-5 | P1 | With no history, a food-dependent fighter with a few health food left passes Ready; the no-history branch only repeats FR-13 | Deferred | Needs Yasser: D1 rules out Unknown for lack of history, and a low-stack threshold is a product call. |
| RT-6 | P1 | The learned Expected Return's fallback to all gaps and its median under-shoot bring back the bedtime false Ready | Deferred | Needs Yasser: D5 ruled the fallback as written. |
| RT-7 | P2 | US-8 expected "Place 2 traps" from a Cardboard set; the account can place 1 (Call Me Ash 0), so the blocker could never clear | Fixed | US-8 expects 1, with a Call Me Ash mutation for 2. |
| RT-8 | P2 | Toolbox's `missingTraps` reads the item name's last character: Set10 reads 0, Sets 8–9 read too high | Fixed | New generated fact `trapping.fact.trap-set-capacity` (FR-21, TR-2, TR-5). |
| RT-9 | P2 | On W4-entry accounts, characters on Lab or Cooking were Ready with no Check covering them | Fixed | New safety `not-covered`, giving Unknown `not-covered` and M10 FR-25's exception wording (FR-8, FR-9, TR-3, US-10, section 6). |
| RT-10 | P2 | Things that idle overnight with no module checking them: empty Forge slots (both fixtures), Refinery storage and full power | Deferred | Needs Yasser: whether the Forge and Refinery storage are M3 Checks or M6 Goals is a scope call. |
| RT-11 | P2 | "0 free slots" blocked even when every expected drop stacks; the deposit fix ignored storage room | Fixed | Blocks only when a drop expected ≥ 1/h has no non-full stack, and is fillable only with storage free slots (FR-16, TR-2, TR-4). |
| RT-12 | P2 | Two entries had split `effect`/`confidence`, which M11's schema can't express | Fixed | Split into `fighter-inventory-full`/`-overflow` and `charge-caps-skull`/`-no-skull`; `CheckFinding` additions listed as M11 asks (TR-4, TR-5, section 7). |
| RT-13 | P2 | `firstFill` needs `at` on passing Checks, which M11 lacks; already-full stockpiles were hidden; "Squire's anvil" is ambiguous with two Squires | Fixed | `nextAt` asked of M11; `alreadyFull` count; labels carry class and level (FR-11, TR-3, US-11). |
| RT-14 | P2 | TR-11 monotonicity contradicted itself; a longer return turns an already-full anvil from blocker to Ready | Fixed (test) / Deferred (product) | Property restated (TR-11); whether a biting cap with a partial fix should block is for Yasser. |
| RT-15 | P2 | Observed rates skewed by active play and M1's history trimming; `hoursAway` undefined; a capped liquid reads as rate 0 | Fixed | `hoursAway` defined, 10-min record windows around each load, an ask on M1 TR-14, capped intervals dropped (TR-6, section 7). |
| RT-16 | P2 | M3's storage key put the raw uid in localStorage and clashed with M10 TR-8 | Fixed | M3 adopts M10 TR-8's `expectedReturn` preference (FR-3, TR-3, TR-9). |
| RT-17 | P2 | "Unequip Unending Energy" at 12 h loses EXP overall (+25% at level 1 beats 2 extra hours) | Fixed | Blocks only past `cap × (1 + bonus)` using Toolbox `getPrayerBonusAndCurse`; a trade-off Next Action below that (FR-20, TR-2, TR-4, US-9). |
| RT-18 | P3 | The food-slot fillable test always passes (16-entry buffer), and US-1 quoted an unverified "4 empty slots" | Fixed | Text says "equip or swap in" until TR-12 item 1; US-1 no longer quotes the count. |
| RT-19 | P3 | Device clock skew moved `returnAt` | Fixed | One skew-corrected `now` from save arrival time, clamped to ±10 min (FR-4, TR-7). |
| RT-20 | P3 | M3 and M6 both claim the Arcade; M6 assumes 58 h (fixtures are 48 h); `getMaxClaimTime` is seconds, not ms | Fixed | M3 owns the blocker, M6 dedupes and corrects US-11, unit conversion stated (FR-24, TR-2, section 7). |
| RT-21 | P3 | US-4's Bowman Lv 54 edge case had no stated outcome | Fixed | Blocker if and only if `fromEmptyMs ≥ 7,200,000`, pinned in the golden. |
| RT-22 | P3 | TR-8's 150 ms budget didn't add up (6 × 6 × 5 ms = 180 ms; 11 fighters ≈ 330 ms) | Fixed | Worst case 350 ms, off the chip-tap path (TR-8). |
| RT-23 | P3 | `Paying_Respect` (W5 monuments, deliberate) counted as "No AFK Target" | Fixed | Removed from FR-12 and TR-4. |
| RT-24 | P3 | A Stale entry still blocks, which can be a false blocker on patch day | Deferred | Needs Yasser: FR-30's trade-off is a product call. |

## Final rulings (Yasser, 2026-10-17)

These supersede anything above that conflicts with them.

> **Ruled by Yasser (2026-10-17), all as recommended:**
> - **RT-5:** low food on day one shows the "Low food: N left; can't time it yet" Next Action. It's not a blocker.
> - **RT-6:** the learned-return fallback is the larger of 8 h and the all-gap value, using the 75th percentile.
> - **RT-10:** "Forge slot empty" is an M3 Check: a blocker when ore is owned, otherwise a Next Action. Refinery storage goes under Not covered yet.
> - **RT-24:** a Stale entry blocks only while its fixture examples pass at the current parser pin; otherwise it becomes a Next Action.
> - **RT-14:** a cap that is already full now, with a quick fix, always blocks and shows "fills again in about X".
