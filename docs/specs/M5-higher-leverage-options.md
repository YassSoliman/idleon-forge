# M5 Higher-leverage options

Spec for [#33](https://github.com/YassSoliman/idleon-forge/issues/33), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Terms follow [GLOSSARY.md](../../GLOSSARY.md). Status: **draft, not yet grilled or red-teamed by a second pass.** M5 is last in the build order (#13), so it builds on M1–M4.

**Inputs this spec rests on:**
- Now screen behaviour (#10) and the prototype resolution (#12, items 1–3: Purpose, Ready, one Higher-leverage line).
- Knowledge Base shape (#11) and [ADR 0007](../adr/0007-generated-facts-authored-judgment.md).
- Architecture (#14) and [ADR 0006](../adr/0006-client-only-spa-parsing-in-a-worker.md).
- Hypothetical math (#16, `research/hypothetical-math`) and [ADR 0005](../adr/0005-toolbox-numbers-not-our-formulas.md).
- Leverage model (#26, `research/leverage-model`), especially §3.0 (ranking), §4.2–4.3 (Roles, "better fit", pusher) and §5 (worked examples).
- Priority verification (#27, `research/priority-verification`): push-first norm, Lab rows 6.3 and 8.8.
- Skills dossier (#25) and the W4 Lab dossier (#23): "pulling a character off the Lab can switch off account-wide nodes".

**Numbers in this spec** were measured on 2026-10-17 by re-running the hypothetical-math probe at Toolbox pin `f1e4240` (game 2.3.531), with `now` frozen at 2026-10-17T12:00Z, on the two private fixtures and on the public Toolbox saves. Characters are named only by account, class and level.

## 1. Purpose

While the player is switching through characters in a Play Session, M5 answers one question per character: **is there something clearly better this character could be doing while I'm away?** It compares the character's current AFK Target against the alternatives that the character can actually reach. It also compares the character against the other characters who could do the same job. When the Knowledge Base clearly ranks another option higher, it adds one line to that character's row: "Move to The Ring: about 15× the class EXP per hour", or "Bowman Lv 54 is a better fit for Poopy Sewers…". When nothing clearly beats the current activity, M5 stays silent. It never suggests a move that would cost something worth more, such as switching off the Lab chain, abandoning the pusher's portal, or losing the Goal that made the current activity worthwhile (the Copper-for-stamps lesson from #12). Silence is the common case, and it is correct.

## 2. Scope / Out of scope

**In scope**
- **Move:** the same character on a different AFK Target. That can be another fighting map, a different skill, or the Lab.
- **Hand-off:** a different character taking over the Goal this character serves, so that this character is freed for a better Move (#12 item 3: "Character X is a better fit").
- **Role fit:** the character is doing an activity whose Role belongs to another class, and Toolbox agrees that the Role owner is better at it (leverage model §4.3).
- **Unknown-Purpose suggestion:** the one suggestion shown when M4 finds no Goal for the character (#12 item 2).
- **Safety rules that suppress options:**
  - the Lab-chain rule;
  - pusher protection;
  - reachability;
  - AFK safety, delegated to M3;
  - Contested and Stale handling.
- **The hypothetical layer.** A small set of Toolbox-computed "what if" numbers, produced in the parse Worker and added to the Account State. It is the only place M5 touches Toolbox.
- The data M5 adds to the Knowledge Base, and the Detectors it needs.

**Out of scope**
- **Parallel Slots** (traps, cog seat, worship charge, cauldron). Filling them belongs to M6 Unspent & idle. Changing which character holds a Parallel Slot is not an AFK Target change.
- **Gear, food, cards, obols and talent presets on the hypothetical.** The clone keeps the character "as it is now" (hypothetical-math §2). The preset swap is unverified (hypothetical-math §3). These belong to M8 Collections and M9 Builds.
- **Active Play:** quests, bosses, minigames, and opening a new portal by hand. A map the character has not reached is a push Goal (M2), never a Move destination.
- **Choosing the pusher.** M2 picks the pusher by arithmetic. M5 only protects it.
- **Course Correction:** making a new character, or the Sub Class Swap Token. These are Meta Path Goals owned by M2.
- **Skilling rates.** Toolbox has no resources-per-hour or skill-EXP-per-hour figures, and ADR 0005 forbids writing our own (see D5).
- **Chains of three or more characters swapping.** Only single Moves and two-character Hand-offs are evaluated.
- **Any LLM at advice time** ([ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md)).

## 3. Functional requirements

**Candidates**
- **FR-1 Candidate Moves.** For each character with data, M5 builds the candidate AFK Targets:
  1. every fighting map in `reachableFightingMaps(c)` (TR-4) whose world is ≤ the account's `currentWorld`;
  2. every skilling AFK Target named by an active Contribution whose level gate the character meets (e.g. a Mining door at Mining Lv 10/25/40/60);
  3. Laboratory, when the account has the Lab (W4-entry and later).

  The current activity is always included as the baseline.
- **FR-2 Reachability.** A fighting map is a candidate only if the character can walk to it today: it is the character's current map, or a portal destination of a map the character has cleared (Toolbox `hasClearedMap` plus `mapPortalDestinations` and the multi-character door lock). A map the character cannot reach is never shown, even if its numbers are better.

**Comparison** (#11 item 6: blockers, then Priority List position, then arithmetic tie-breaks; no weights)
- **FR-3 Goals served.** For the baseline and each candidate, M5 gets the set of Goals it advances from M4's Contributions. Each Goal comes with its Stage Priority List position (M2) and its next-Milestone ETA. For fighting candidates, the ETA is arithmetic: the gap ÷ the sum of the Toolbox `finalKillsPerHour` of every character who would be contributing after the move. Skilling Contributions are yes/no and carry no ETA (#11 item 8).
- **FR-4 Comparison order.** A candidate beats the baseline only by winning the first of these steps that decides:
  1. **Best position:** the lowest position among the Goals served. Lower wins. A candidate that serves any Goal beats a baseline that serves none.
  2. **Closest Milestone:** among the Goals at that best position, the shortest ETA wins, but only if the candidate's ETA ≤ the baseline's ETA ÷ `clearMargin` (D1, default 1.25). If either side has no ETA, this step is skipped. It never counts as a win.
  3. **Most Goals:** the number of Goals served. More wins.

  If no step decides, there is **no option**. Unknown numbers never win, so the comparison fails closed.
- **FR-5 Class XP as a Goal.** Class XP is compared only as the M4 Goal "level this character", with Milestones at the next level gates. Its ETA is (EXP needed) ÷ (Toolbox `finalKillsPerHour` × the monster's `ExpGiven` × `getClassExpMulti`) on that map, which is plain arithmetic on Toolbox numbers. Its list position is set by D2. M5 never ranks maps on kills/h alone (#16).

**Gates that suppress an option** (applied before display; a suppressed option goes to "also considered" with its reason, FR-15)
- **FR-6 Lab-chain rule.** A Move, Hand-off or Role fit that takes a character off `LABORATORY` is suppressed when re-running Toolbox's `getLab` with that character out of the lab turns off any Mainframe node or jewel that is lit now. It is also suppressed when that re-run cannot be computed (fail closed). The option's "also considered" entry names the nodes that would switch off. A character kept in the chain by something other than its AFK Target (Arctis, W5) loses nothing, so the rule does not block it.
- **FR-7 Pusher protection.** The character M2 names as the pusher is never offered a Move away from an activity that serves the push Goal. It is never offered a Hand-off of that Goal unless the partner's `finalKillsPerHour` on the push map beats the pusher's by `clearMargin`. (That case is M2 choosing a different pusher, so M5 defers to M2's next run rather than showing a Hand-off.)
- **FR-8 AFK safety.** Every candidate is passed to M3's hypothetical safety check (TR-8). Any blocker, and any Unknown, suppresses the option. M5 never proposes a Move that would turn a Ready Verdict into Fix before you leave.
- **FR-9 Contested and Stale.**
  - If the deciding step rests on a Contested entry (its Goal position or its Contribution), the option is never the row line. It may appear in "also considered" with the "sources disagree" badge.
  - If the deciding entry is Stale, the option is shown with the Stale badge and ranks below any fresh option.
  - When the save's game version is newer than the parser pin's target ("game updated, parser not caught up", #14 item 6), steps 2 and FR-5 are skipped, because they need Toolbox rates. Only position wins (step 1) can show.

**Option kinds**
- **FR-10 Move.** The best surviving candidate under FR-4 becomes the character's Move option. Ties are broken by the lower map index, then the lower skill index, so the result is deterministic.
- **FR-11 Hand-off.** For a character `c` whose Move is blocked only because it would drop a Goal `g` (it wins FR-4 once `g` is removed from the baseline), M5 looks for a partner `c'`. It offers "`c'` is a better fit for `<activity>`" when all of these hold:
  - (a) `c'` has a Move into `c`'s current activity, computed by FR-10 against the current Account State;
  - (b) `c'` would reach `g`'s next Milestone within the Expected Return (D4);
  - (c) `c`'s freed Move clears FR-4 once `g` is still served by `c'`.

  Among several partners, the shortest ETA for `g` wins, then the lower character index. Only pairs are evaluated.
- **FR-12 Role fit.** It follows leverage model §4.3. It is offered when:
  - (a) the Meta Path's Role table names a different class as owner of `c`'s current AFK Target;
  - (b) a character of that class exists, is not the pusher, and is on an activity that is not its own Role;
  - (c) Toolbox agrees: for skills, the owner's `getSkillEfficiency(skill)` and `getAfkGain({...c, afkType})` are both higher; for fighting, the owner's class-XP ETA on that map is shorter by `clearMargin`;
  - (d) FR-6 to FR-9 pass for both characters.
- **FR-13 Unknown-Purpose suggestion.** When M4 gives the character no Goal (Verdict Unknown, "What is this character for?"), M5 supplies exactly one suggestion: the Move under FR-4 against an empty baseline. If no candidate serves any Goal, it suggests the Role owner's AFK Target when the character's Role owns one. Otherwise there is no suggestion. It never changes the Verdict.

**Output and display**
- **FR-14 One line per row.** Each character row shows at most one Higher-leverage line (#12 item 3). The priority is Hand-off, then Role fit, then Move, because a Hand-off or Role fit carries a Move inside it. The line has a Source label like every Next Action (#10 item 10). A Hand-off or Role fit appears on both characters' rows, and each line names the other character by class and level.
- **FR-15 Focus card detail.** Tapping the row (C Focus, #12) shows:
  - the option's numbers: kills/h, class EXP/h ratio, Milestone ETAs before and after, survivability;
  - the step that decided it (FR-4 step 1, 2 or 3);
  - up to 2 "also considered" alternatives, each with its reject reason (lab chain, not reachable, AFK-unsafe, pusher, loses Goal X, below margin, Contested, no rate).
- **FR-16 Never a Verdict input.** A Higher-leverage option never changes a Verdict, the 3-Goals-per-character cap, or the Visit Order (D3).
- **FR-17 Done, Skip, Not for me.**
  - The option disappears when a later save shows the suggested change (the character, or the partner, on the destination activity), or when it no longer wins.
  - **Skip today** and **Not for me** are keyed by the option id (TR-2). "Not for me" lasts until the next patch, as in #10 item 8.
- **FR-18 Report this.** Sends:
  - the option id;
  - the Knowledge Base entry ids that decided it;
  - the Knowledge Base, game and parser versions;
  - the Stage;
  - both characters' classes and levels;
  - the map indices.

  It never sends names or save data (#11 item 15).
- **FR-19 Determinism.** The same Account State, save history, Knowledge Base and `now` always produce byte-identical M5 output. Golden snapshots enforce this (TR-12).

## 4. User stories

Fixtures:
- **W2-late account:** the private W2 save, 5 characters, Stage W2-late.
- **W3-early account:** the private W3 save, 6 characters, Stage W3-early.
- **Public saves:** Toolbox's GPL saves in `packages/account-state/fixtures/public/`.

**Test Knowledge Base.** Until M2 and M4 author the real entries, the acceptance tests run on a pinned test Knowledge Base, `kb-fixture/m5-min`, with M2 and M4 stubbed. It contains:
- **Push:** the push Goal at position 2. Its only Contribution is the pusher's own kills on its frontier map while that map's next portal is still closed (portal kills are per character).
  - M2 is stubbed to name the character on the furthest map: the Wizard Lv 56 on the W2-late account and the Squire Lv 85 on the W3-early account.
  - The W2-late push steps (Djonnut quests, Efaunt) are Active Play, so they have no AFK Contribution.
- **Materials:** a stamp and forge material Goal at the W1-mid stamps position (5), on every Stage, with Copper Ore as a Contribution.
- **Dirty Money:** the Upgrade Vault's per-power-of-10 Poop kills Goal, at the leverage model's W2-late Vault position (11). It applies W1-late to W2-late only.
- **Death Note:** the mob-rank Goals at the W3-mid position (6). They apply from W3-mid, so they are active on neither fixture.
- **Levels:** "level this character" (Class XP, with an ETA from TR-3) and "level this skill" (yes/no, no ETA), both at the bottom of every list (D2).
- **No card-star Goals:** their order is unverified (PV 2.1), and Toolbox has no card drop multiplier, so they would have no ETA. M8 adds them later.

The golden Now-screen snapshot with the real Knowledge Base is re-baselined when M2 and M4 land. These stories pin the *rules*.

**US-1 Don't undo deliberate skilling (#12 regression).** As a player in a Play Session, I want ActiveOn to leave a skiller alone when its resource is what the account needs, so that I'm not told to mine Iron when I'm mining Copper on purpose.
- **Given** the W2-late account, where the Squire Lv 43 is AFK Mining Copper (Mining Lv 20, Iron's door open) and Copper Ore is named by an active material Contribution, **When** the engine runs, **Then** the Squire's row shows **no** Higher-leverage line. "Also considered" may list Iron with reason "loses Goal: stamp materials".
- **Given** the same account with the Copper Contribution removed from the test Knowledge Base (Copper and Iron both serve only Mining XP), **When** the engine runs, **Then** there is still no line, because skilling has no ETA and FR-4 step 2 is skipped (FR-4: unknown never wins).

**US-2 Clearly more class EXP.** As a player in a Play Session, I want to hear when a character could earn far more class EXP somewhere it can reach, so that its AFK Stretch isn't wasted.
- **Given** the W2-late account, where the Shaman Lv 44 fights on Jungle Perimeter at 1,285 final kills/h (100% survival) and its current map serves only Class XP, **When** the engine runs, **Then** its row shows exactly one Move line:
  - **if Poopy Sewers is in its reachable set (TR-4):** to Poopy Sewers (1,100 kills/h, 100% survival, about 7.8× the class EXP per hour), decided by position, because it also feeds Dirty Money;
  - **otherwise:** to The Ring (map 62), with 1,368 kills/h, about **15.5×** the class EXP per hour and 100% survival, decided by closest Milestone.

  The Focus card shows the numbers and the deciding step.
- **Given** the W2-late account, where the Bowman Lv 54 fights on Spore Meadows (map 1) at about 11k class EXP/h, **When** the engine runs, **Then** its row shows exactly one Move line:
  - **if Poopy Sewers is reachable:** to Poopy Sewers (1,169 kills/h, 100% survival), decided by position;
  - **otherwise:** to Sands of Time (map 64), at about **214×** the class EXP per hour and 100% survival.
- **Given** either outcome above, **When** the engine runs, **Then** the destination is a W1 or W2 map, never one of the W3 maps (101–105) that top the unfiltered sweep for these characters (R1).

**US-3 Silence below the margin.** As a player in a Play Session, I want small gains ignored, so that the screen only speaks when it matters.
- **Given** the W2-late account, where the Wizard Lv 56 fights on Djonnuttown (874 kills/h) and its best reachable alternative (Sands of Time) gives **1.22×** the class EXP/h, **When** the engine runs with `clearMargin` 1.25, **Then** there is no line, and "also considered" shows Sands of Time with "below margin".
- **Given** the W3-early account, where the Bowman Lv 60's best alternative (Up Up Down Down) gives 1.04×, **When** the engine runs, **Then** there is no line.

**US-4 Kills per hour is not value.** As a player in a Play Session, I want maps ranked by what they give me, not by how fast monsters die, so that I'm never sent backwards for an empty number.
- **Given** the W3-early account, where the Wizard Lv 73 is on The Stache Split (934 kills/h) and Jar Bridge gives it 1,816 kills/h but less class EXP per hour, **When** the engine runs, **Then** there is no line. Jar Bridge never appears as a suggestion, because The Stache Split is the Wizard's highest class-EXP/h reachable map.

**US-5 Keep a worthwhile Goal.** As a player in a Play Session, I want a character on a Milestone Goal kept there unless something ranks higher, so that ActiveOn doesn't trade a real Goal for raw XP.
- **Given** the W2-late account, where the Barbarian Lv 60 is on Poopy Sewers (1,430 kills/h, 78% survival) and serves Dirty Money (2,995 of 10,000 Poop kills, so the next Milestone is about **4.9 h** away), **When** the engine runs, **Then** there is no Move line, even though The Ring gives it about **2.5×** the class EXP per hour. "Also considered" shows The Ring with "loses Goal: Dirty Money".

**US-6 A better fit for the same Goal (Hand-off).** As a player in a Play Session, I want to hear when another character could hold this Goal while this one does something better, so that the Goal and both characters are served.
- **Given** a test state derived from the W2-late account, where a second fighter can reach Poopy Sewers and has a Move into it, and Toolbox gives that fighter an ETA to 10,000 Poop kills within the 8 h default Expected Return, **When** the engine runs, **Then**:
  - the Barbarian's row shows "*`<class> Lv <n>` is a better fit for Poopy Sewers: 10k Poop kills in X h; this Barbarian gets 2.5× class EXP on The Ring*";
  - the partner's row shows the matching Move;
  - each line names the other character by class and level.
- **Given** the W2-late account as saved, where reachability (TR-4) decides whether any partner can reach Poopy Sewers, **When** the engine runs, **Then** the outcome depends on who can reach it:
  - **If the Bowman Lv 54 can reach Poopy Sewers:** the pair is Barbarian ↔ Bowman. The Bowman alone would reach 10,000 Poop kills in about **6.0 h** (7,005 ÷ 1,169), against 6.4 h for the Shaman Lv 44 (7,005 ÷ 1,100), and both are within the 8 h default. The Bowman's row shows the Hand-off instead of its US-2 Move (FR-14).
  - **If no partner can reach it:** the Barbarian row stays silent, as in US-5.

**US-7 Never move the pusher off the push.** As a player in a Play Session, I want the pusher left on the portal grind, so that the account's top Goal keeps moving.
- **Given** the W3-early account, where the Squire Lv 85 is the pusher on Thermonuclear Climb (map 109). It has 1,065 kills/h at a 36% hit chance, and the next portal needs 15,000 kills. Rollin' Tundra would give it **1.32×** the class EXP/h. **When** the engine runs, **Then** there is no line on the Squire's row.
- **Given** the same account, where the Barbarian Lv 56 gets 2,154 kills/h on W3 maps but only 472 on map 109, **When** the engine runs, **Then** no Hand-off of the push is offered, because 472 < 1,065 (FR-7).

**US-8 Don't send a character somewhere unsafe.** As a player in a Play Session, I want suggestions to pass the same AFK-safety checks as my current setup, so that following one never breaks my Ready.
- **Given** the W3-early account, where the Shaman Lv 54 is on Shifty Sandbox (895 kills/h, 100% survival). Its highest class-EXP/h reachable alternative, Inside the Igloo, gives 1.32× but only 75% survival. **When** the engine runs with M3's survivability check, **Then** there is no line, and "also considered" shows Inside the Igloo with "AFK-unsafe".

**US-9 Don't break the Lab chain.** As a player in a Play Session, I want ActiveOn never to pull a character out of the Lab if that switches off account-wide bonuses, so that one "better" character doesn't cost everyone.
- **Given** the public save `first.json`, where characters at save index 1, 2, 4 and 5 are AFK in the Lab and connected (3 nodes lit). Re-running `getLab` without index 2 or index 4 switches off Wired In, Gilded Cyclical Tubing and No Bubble Left Behind. Without index 1, it switches off two of them. Without index 5, it switches off No Bubble Left Behind. **When** the engine runs with a test Knowledge Base where a fighting map would otherwise win for any of them, **Then** none of the four gets a Move, Hand-off or Role-fit line. Each Focus card shows "would switch off: …" with the nodes for that character.
- **Given** the public save `speedrun-rank1.json`, where the one character AFK in the Lab (index 4) is not needed for any lit node (all 11 stay connected; removing it loses 0 nodes and 0 jewels), **When** a candidate would otherwise win, **Then** the Lab rule does not suppress it.

**US-10 Better fit by Role.** As a player in a Play Session, I want to know when another class owns the job a character is doing, so that each job goes to the character built for it.
- **Given** a test state derived from the W3-early account: the Squire Lv 51's AFK Target is set to Catching (Catching efficiency 56), and the Bowman Lv 60, who owns Catching by Role, is fighting (not its Role, not the pusher) with Catching efficiency 1,277 and a higher Catching AFK gain (0.88 vs 0.81). **When** the engine runs, **Then** both rows show the Role-fit pair, naming the other character by class and level, with the efficiency numbers in the Focus card.
- **Given** the W2-late and W3-early accounts as saved, **When** the engine runs, **Then** there is no Role-fit line on either. No character is on an AFK Target that the Role table gives to a different class with a free owner. (The W3 Barbarian Lv 56 fishes, which is its own Role.)

**US-11 What is this character for?** As a player in a Play Session, I want one concrete idea when a character's activity serves nothing, so that the Unknown Verdict comes with a way out.
- **Given** a test state derived from the W2-late account with the Bowman Lv 54's AFK Target set to `Nothing`, **When** the engine runs, **Then** its Verdict is Unknown (from M4), and the row shows exactly one suggestion: the FR-4 Move against an empty baseline, which is the same destination as US-2's Bowman case. The Verdict stays Unknown until a save confirms the move.

**US-12 Quiet accounts stay quiet.** As a player in a Play Session, I want no Higher-leverage noise when my AFK Targets are already sound, so that I trust the lines when they appear.
- **Given** the W3-early account, **When** the engine runs on `kb-fixture/m5-min`, **Then** no character has a Higher-leverage line. Its leaks are Parallel Slots and spending (M6, M7), not AFK Targets, which matches leverage model §5.2.
- **Given** the W2-late account, **When** the engine runs, **Then** exactly the Shaman Lv 44 and Bowman Lv 54 rows carry a line (US-2), plus any Hand-off that passes US-6.

**US-13 Stale parser, fewer claims.** As a player in a Play Session, I want rate-based advice paused while the parser is behind the game, so that a patch can't make ActiveOn confidently wrong.
- **Given** the W2-late account with its game version set one patch ahead of the parser pin's target, **When** the engine runs, **Then** the Shaman and Bowman lines (which are rate-decided) are absent, and the Focus card shows "comparisons paused: game updated, parser not caught up". A position-decided option (FR-4 step 1) would still show, with the Stale badge.

## 5. Technical requirements

**TR-1 Package boundaries.**

| Where | What | Why |
|---|---|---|
| `packages/account-state` (runs in the parse Worker) | `hypotheticals/`: the clone helpers, rate table, reachability and Lab removal. Only this code imports Toolbox. Its output is plain data on the Account State | ADR 0006: Toolbox stays in the Worker. ADR 0005: Toolbox numbers only |
| `packages/engine` | `higher-leverage/`: candidate building, FR-4 comparison, the gates and option assembly. A pure function | #14 item 4 |
| `packages/knowledge` | `systems/leverage.yaml`: M5's Checks and parameters; generated `gen/maps.json`, `gen/lab-nodes.json`, `gen/skill-classes.json` | #11, ADR 0007 |
| `apps/activeon` | Renders the row line and the Focus card section. No logic | M10 |

**TR-2 Engine output types.**

```ts
// packages/engine/src/higher-leverage/types.ts
export type ActivityRef =
  | { kind: 'fight'; mapIndex: number; targetMonster: string }
  | { kind: 'skill'; afkType: 'MINING' | 'CHOPPIN' | 'FISHING' | 'CATCHING'; target: string }
  | { kind: 'lab' }
  | { kind: 'none' };

export interface GoalServed {
  goalId: string;              // Knowledge Base Goal entry id
  position: number;            // Stage Priority List position (M2); ties allowed
  contested: boolean;
  stale: boolean;
  etaHours: number | null;     // next Milestone; null = no rate (skilling) or unknown
}

export type RejectReason =
  | 'unreachable' | 'lab-chain' | 'pusher' | 'afk-unsafe' | 'loses-goal'
  | 'below-margin' | 'contested' | 'no-rate' | 'parser-behind' | 'no-hypothetical';

export interface Considered {
  to: ActivityRef;
  reason: RejectReason;
  detail?: string;             // e.g. lost goal id, or "Wired_In, Gilded_Cyclical_Tubing"
}

export interface HigherLeverageOption {
  /** Stable across saves: `hl:<kind>:<characterIndex>:<destKey>[:<partnerIndex>]`. Keys Skip / Not for me. */
  id: string;
  kind: 'move' | 'handoff' | 'role-fit' | 'unknown-purpose';
  characterIndex: number;
  partnerIndex?: number;
  from: ActivityRef;
  to: ActivityRef;
  decidedBy: 'position' | 'milestone-eta' | 'goal-count';
  baseline: GoalServed[];
  candidate: GoalServed[];
  numbers: {
    finalKillsPerHour?: [now: number, then: number];
    classExpPerHourRatio?: number;
    survivability?: [now: number, then: number];
    skillEfficiency?: [mine: number, partner: number];
  };
  stale: boolean;
  textEntryId: string;          // the Check entry whose template produced the line
  sources: string[];            // entry ids whose Sources are shown
  provenance: { fields: string[]; entries: string[] }; // #14 item 4, #17
  alsoConsidered: Considered[]; // at most 2 shown (FR-15)
}

export interface HigherLeverageResult {
  byCharacter: Record<number, HigherLeverageOption | null>;
  status: 'ok' | 'paused-parser-behind' | 'unavailable';
}
```

**TR-3 Hypothetical layer (Worker side).** It is computed right after the parse, from the same Toolbox objects. It is posted as a second Worker message, so the Now screen renders before M5 lines arrive (TR-10).

```ts
// packages/account-state/src/types.ts (addition, owned with M1)
export interface FightRate {
  mapIndex: number;
  targetMonster: string;
  finalKillsPerHour: number;   // Toolbox getMaxDamage(...).finalKillsPerHour on the clone
  survivability: number;       // 0..1
  hitChance: number;           // 0..1
  classExpPerHour: number;     // finalKillsPerHour × monsters[target].ExpGiven × getClassExpMulti(clone)
}
export interface LabRemoval {
  inChain: boolean;            // in connectedPlayers now
  lostNodes: string[] | null;  // null = re-run failed -> treat as unsafe
  lostJewels: string[] | null;
}
export interface CharacterHypotheticals {
  characterIndex: number;
  reachableFightingMaps: number[];
  fight: FightRate[];          // current map first (if fighting), then candidates
  afkGain: Partial<Record<'FIGHTING' | 'MINING' | 'CHOPPIN' | 'FISHING' | 'CATCHING' | 'LABORATORY', number>>;
  skillEfficiency: Partial<Record<'mining' | 'chopping' | 'fishing' | 'catching', number>>;
  lab: LabRemoval | null;      // null when the account has no Lab data
}
export interface Hypotheticals {
  status: 'ok' | 'partial' | 'unavailable';
  identityCheck: 'pass' | 'fail';  // TR-5
  computedMs: number;
  characters: CharacterHypotheticals[];
}
// AccountState gains: hypotheticals?: Hypotheticals
```

- **Clone (hypothetical-math §2):**
  - `{ ...c, mapIndex, targetMonster, currentMap, afkTarget, afkType }`;
  - `afkType` is swapped too (or `finalKillsPerHour` comes out ~12% high);
  - `targetMonster` is passed explicitly on multi-target maps;
  - Toolbox's `shared` damage cache is reused across maps for the same character.
- **Gates:** `getMaxDamage` is called only for `FIGHTING` targets. Its kill numbers for ore or fish "monsters" are never stored.
- **Lab removal:** `getLab(raw, rawCharacters with c's AFKtarget changed, account, characters)`, then a comparison of `labBonuses[].active` and `jewels[].active` against the live parse. It took ≤ 1 ms per character on the public saves.

**TR-4 Reachability Detector.** `reachableFightingMaps(c)` contains:
- the current map;
- every map `m` with `hasClearedMap(c, m)`;
- every `mapPortalDestinations[m]` of a cleared map, minus doors closed by `getMultiCharDoorLock`;
- only maps in worlds ≤ `currentWorld`.

The portal graph is a generated fact (ADR 0007, `gen/maps.json`). Contract test: every fighting character's current map is in its own set, on all 11 public saves and both private fixtures.
- **Known risk:** the 2026-10-17 approximation left Poopy Sewers out of three W2-late fighters' sets. That may be true, or it may be an error, and the contract test plus one in-game check by Yasser settle it before build.

**TR-5 Identity contract test** (hypothetical-math §6). On every fixture, the clone rebuilt on each fighting character's own map must equal the direct parse field by field (it passed on 8 of 8 fighters on 2026-10-17). It runs in CI on the public saves and locally on the private ones.
- If it fails at runtime (patch drift), `identityCheck = 'fail'` and every rate-decided step is disabled for that save (as FR-9's parser-behind case).

**TR-6 Knowledge Base entries.** M5 adds no new entry type. It uses the #11 types:

| Entry | Type | Generated or authored | Detector | Notes |
|---|---|---|---|---|
| `gen.maps.*` (index, name, world, AFK type, targets, `ExpGiven`, door requirements, destinations) | (fact table used by Contributions) | **Generated** from Toolbox `mapNames`, `mapEnemiesArray`, `monsters`, `mapPortals`, `mapPortalDestinations` | n/a | Re-generated at each parser re-sync |
| `gen.lab-nodes.*` (node and jewel names, positions) | fact table | **Generated** from Toolbox `labBonuses`, `jewels` | n/a | For "would switch off" text |
| `gen.skill-classes.*` (class line → skill talents) | fact table | **Generated** from `talents.json` | n/a | Feeds the Role table's checks |
| `meta-path.roles` (`owns: [afkType or system]`) | Meta Path | **Authored** (M2) | n/a | Leverage model §4.2 |
| `leverage.move` | Check | **Authored** | `higherLeverage.move` | Text: "Move to {to}: {because}" |
| `leverage.handoff` | Check | **Authored** | `higherLeverage.handoff` | Text: "{partner} is a better fit for {activity}: {because}" |
| `leverage.role-fit` | Check | **Authored** | `higherLeverage.roleFit` | Text: "{partner} owns {skill} on the Meta Path: efficiency {a} vs {b}" |
| `leverage.unknown-purpose` | Check | **Authored** | `higherLeverage.unknownPurpose` | Text: "Nothing here advances a Goal. Try {to}: {because}" |
| `leverage.lab-chain` | Check (suppressing guard) | **Authored** | `labChainSafe` | Sources: W4 Lab dossier (connection rules, H); skills dossier |
| Contributions with an `activity` key | Contribution | M4 authors them; map-to-mob kill Contributions are **generated** | M4's | M5 needs `activitiesServing(goalId)` (TR-9) |

Example (authored):

```yaml
- id: leverage.move
  system: leverage
  type: check
  detector: higherLeverage.move
  text: "Move to {to.name}: {because}"
  why: "Same character, somewhere it can reach, that advances a higher-ranked Goal or reaches the same Milestone clearly sooner."
  params:
    clearMargin: 1.25        # D1
  sources:
    - url: https://github.com/YassSoliman/idleon-forge/issues/12
      tier: project-ruling
      verified: 2026-10-17
      gameVersion: 2.3.540
    - url: https://github.com/YassSoliman/idleon-forge/blob/research/hypothetical-math/docs/research/2026-10-17-hypothetical-math.md
      tier: 1   # Toolbox game-data numbers
      verified: 2026-10-17
      gameVersion: 2.3.531
  appliesTo: { stages: all, classes: all }
  confidence: M
  status: active
```

A `because` slot is filled from the deciding step, for example "about 15× the class EXP per hour", "also feeds Dirty Money (10k in 2.7 h)", or "the Lab's Certified Stamp Book needs one more character".

**TR-7 Detectors** (typed TypeScript, `packages/engine/src/higher-leverage/detectors/`; each gets fires / doesn't-fire tests on the fixtures, #11 item 12):

| Detector | Inputs | Output |
|---|---|---|
| `reachableFightingMaps` (account-state) | Toolbox character, `gen.maps` | `number[]` |
| `fightRates` (account-state) | Toolbox objects, candidate map list | `FightRate[]` |
| `labRemoval` (account-state) | raw save, raw characters, parsed account | `LabRemoval` |
| `higherLeverage.move` | Account State + hypotheticals, M4 Purpose, M2 positions and pusher, M3 check, Knowledge Base, `now`, Expected Return | `HigherLeverageOption \| null` per character |
| `higherLeverage.handoff` | the same, plus every character's Move result | option or null |
| `higherLeverage.roleFit` | the same, plus `meta-path.roles` and `gen.skill-classes` | option or null |
| `higherLeverage.unknownPurpose` | the same, plus M4's Unknown flag | option or null |
| `labChainSafe` | `LabRemoval` | `true` / `false` (false also when `lostNodes` is null) |

**TR-8 M3 interface.** `checkHypothetical(characterIndex, to: ActivityRef, rate?: FightRate, expectedReturnH): { blockers: string[]; unknown: boolean }` evaluates M3's AFK-safety Checks as if the character were on `to`, using the same food, carry and cap Checks. If M3's spec has no survivability Check, M5 suppresses any candidate whose survivability is below both 0.95 and the baseline's (the US-8 numbers), and flags it as an M3 gap.

**TR-9 M4 and M2 interfaces.**
- M4 `purposeOf(characterIndex): GoalServed[] | 'unknown'`.
- M4 `goalsServedBy(activity: ActivityRef, contributors: number[]): GoalServed[]` takes the set of characters who would be on that activity, for shared ETAs.
- M4 `activitiesServing(goalId): ActivityRef[]`.
- M2 `stage`, `positionOf(goalId)`, `pusherIndex: number | null`, `roles`.

The names are provisional until those specs merge.

**TR-10 Performance budgets** (measured 2026-10-17 on Node 22, M-series laptop):
- **Measured:** a parse takes ~0.5 s. An unshared `getMaxDamage` clone costs ~1.4 ms. A 6-character sweep over ~75 maps took ~0.7 s without the `shared` cache. Lab removal takes ≤ 1 ms per character.
- **Budget:**
  - the hypothetical layer adds **≤ 300 ms p50 and ≤ 800 ms p95** on an 11-character public save in the Worker (CI proxy: Node, ≤ 600 ms on `highend.json`), using the `shared` cache;
  - the engine's M5 step adds **≤ 20 ms**;
  - the Now screen never waits for M5: M5 lines appear when the second message lands.
- **Over budget:** the candidate set shrinks to Goal-served maps plus the character's current world. `status: 'partial'` is recorded, and the Focus card says so.

**TR-11 Storage.** M5 stores nothing new:
- Skip today and Not for me use the M10 preference store (localStorage, keyed by option id and patch).
- Hypotheticals are recomputed on every save and are not persisted to IndexedDB history. History is used only for the learned Expected Return (via M3).

**TR-12 Tests.**
- Vitest unit tests for FR-4: every step, ties, null ETAs, margins.
- Detector fires / doesn't-fire tests (TR-7).
- The identity and reachability contract tests (TR-4, TR-5).
- Golden snapshots of `HigherLeverageResult` per fixture (both private fixtures locally; the public saves and the scrubbed W2 save in CI, #14 item 7), with `kb-fixture/m5-min` and later with the real Knowledge Base.
- Derived test states (US-6, US-10, US-11) are built in the test by mutating the parsed raw save in memory. They are never committed as files.

**TR-13 Security and privacy.**
- Nothing leaves the device (ADR 0006).
- Hypotheticals carry character indices, never names. The Toolbox fields that embed names (e.g. a stamp's `bestCharacter`, a Lab `playerName`) are not copied into `Hypotheticals`.
- Report this and Suggestions (ADR 0008) attach class, level and map indices only.
- The Lab re-run works on an in-memory copy and never mutates the parsed state used by other modules.

## 6. States and edge cases

| State | M5 behaviour |
|---|---|
| **Loading** (parse done, hypotheticals pending) | Rows render without M5 lines. The Focus card section shows "comparing…". No placeholder line |
| **Broken parse / empty account** | No advice at all (#10 item 13). M5 emits nothing |
| **Hypotheticals unavailable** (Toolbox threw, section failed) | `status: 'unavailable'`. Position-decided options would need Goal sets only, but rate data is also needed for AFK-safety checks, so M5 emits **nothing** and the Focus card says "comparisons unavailable" |
| **Identity check fails** (patch drift) | Rate-decided steps off (TR-5). Position wins only |
| **Parser behind the game** | FR-9: rate steps paused; banner from M10; position wins with the Stale badge |
| **Stale Knowledge Base entry decides** | Shown with the Stale badge, ranked below fresh options (glossary: Stale) |
| **Contested entry decides** | Never the line; badge in "also considered" |
| **Character with no AFK Target** (`Nothing`, `Paying_Respect`) | Baseline is empty. FR-13 suggestion if M4 marks it Unknown |
| **Skilling baseline vs fighting candidate** | Only FR-4 step 1 or 3 can decide (the skilling side has no ETA) |
| **Character on a map it can no longer "reach"** (current map always counts) | Fine; the current map is always the baseline |
| **Multi-target skilling map** | `targetMonster` passed explicitly (hypothetical-math caveat 4) |
| **Account without Lab** (pre-W4, both fixtures) | `lab: null`; FR-6 is vacuous; a Lab candidate is never built |
| **Lab re-run fails** | `lostNodes: null`, so the Move is suppressed (fail closed) |
| **Arctis (W5) keeps a character in the chain** | The re-run shows nothing lost, so moving is allowed (US-9, `speedrun-rank1.json`) |
| **No pusher** (M2 returns null) | FR-7 is vacuous |
| **Two characters get the same destination** | Allowed. An account-wide kill Goal sums contributors, so each row's ETA assumes only that character moves (FR-3). The Focus card says "if only this character moves" |
| **A Hand-off partner is also a Hand-off holder** | Only pairs: a character appears in at most one Hand-off, chosen by FR-11's tie-break. The other keeps its Move |
| **Save arrives mid-session; option flips** | Recomputed per save. FR-4's margin and the fixed tie-breaks keep it stable. No hysteresis state in the MVP (red-team R6) |
| **Player follows the advice** | The next cloud save (instant on character switch, #5) shows the new AFK Target, so the line disappears (FR-17) |
| **Offline** (no new saves) | Works on the last good save, with the "last cloud save Ns ago" line (#10 item 12). Nothing extra |
| **Multiple tabs** | Each tab's Worker computes independently. Determinism (FR-19) gives the same lines. Skip and Not for me are shared through localStorage |
| **Second account in the same browser** | One account per browser (#10 item 16). On sign-out, Skip and Not for me keys are cleared with the rest of the data |
| **11 characters** | Budget TR-10; pairs evaluated ≤ 55 |
| **W4-entry and later** | The Lab is a candidate. "Everyone not pushing goes to the Lab" (W4-entry position 4) wins by position over XP-only activities. Untested on a real save (leverage model Q5) |

## 7. Dependencies

| Module | M5 needs | Interface |
|---|---|---|
| **M1 Sync & Account State** | The Worker posts the `hypotheticals` section; Toolbox objects stay in the Worker; contract tests | `AccountState.hypotheticals` (TR-3); second Worker message |
| **M2 Stage & Meta Path** | Stage; each Goal's Priority List position; the pusher; the Role table | `stage`, `positionOf`, `pusherIndex`, `roles` (TR-9) |
| **M3 AFK Safety** | The hypothetical safety check; Expected Return | `checkHypothetical` (TR-8); `expectedReturnHours` |
| **M4 Purpose & Milestones** | Goals served per activity, ETAs, the Unknown flag, inverse Contribution lookup; Class XP as a Goal (D2) | `purposeOf`, `goalsServedBy`, `activitiesServing` (TR-9) |
| **M6 Unspent & idle** | Boundary only: Parallel Slots are M6's | none |
| **M8 Collections, M9 Builds** | Card, obol and build Goals reach M5 only through M4's Goal sets; preset swaps stay out | none |
| **M10 Now screen UI** | Renders one line per row, both rows of a pair, and the Focus card section; owns Skip and Not for me storage | `HigherLeverageResult` (TR-2) |
| **M11 Knowledge tooling** | Compiles `leverage.yaml`; generates `gen/maps.json`, `gen/lab-nodes.json`, `gen/skill-classes.json`; schema for `params` | Knowledge Base build |
| **M12 Release** | Golden snapshots, budget check in CI | TR-12 |
| **M13 Suggestions** | Attaches the option id to "Confusing" or "Something's wrong" Suggestions | FR-18 fields |

## 8. Open decisions for Yasser

❓ D1 - How clear is "clearly": when a rate decides (same Goal, sooner Milestone, e.g. more class EXP per hour), how much better must the alternative be? Options: 1.10×, **1.25×**, 1.5×, or 2×.
➡️ 1.25×. Toolbox's `finalKillsPerHour` is a model, "a floor, not a prediction", and it was never verified live at W1–W3 (hypothetical-math §5). A margin smaller than the model's likely error would make lines flicker between saves. At 1.25×, the W2-late Wizard Lv 56 (1.22×) and the W3-early Bowman Lv 60 (1.04×) stay quiet. The 1.32× W3-early cases are already decided by other rules (push, AFK safety). The rate-decided lines that can fire on the fixtures (15.5× and 214×) are unambiguous at any of these margins. It lives in `leverage.move.params`, so changing it is a one-line Knowledge Base PR.

❓ D2 - Where does Class XP rank? M5 needs a list position for the "level this character" Goal. Options: (a) **the bottom of every Stage list**, so XP decides only when nothing else does; (b) its own position just below free-value fills (position 3.5); (c) not a Goal at all, so M5 never suggests a map for XP alone.
➡️ (a). It matches the 2026 push-first norm (#27) and the #12 lesson (Copper beat Iron because the Goal mattered, not the XP). It still lets the obviously wasted cases through (US-2: 15× and 214×). Option (c) would silence exactly the lines players most need. Option (b) would let XP override real System Goals such as Dirty Money (US-5).

❓ D3 - Should a strong Higher-leverage option affect the Verdict? For example, a character whose Move would serve a position-1 or position-2 Goal while it now serves only XP. Options: (a) **never: the Verdict stays AFK safety plus "some worthwhile Purpose"**; (b) demote to Fix before you leave when the option wins by position and lands on positions 1–2.
➡️ (a). #10 defines the Verdict as AFK safety, and #12 makes Ready mean "safe and serving a worthwhile Purpose". A line that says "better" is advice, not a blocker. Making it a blocker would put the noisiest, model-dependent part of the engine into the one signal that must never be wrong (the done bar: no wrong Verdict blocker). If a Goal truly makes the current activity worthless, M4 should not count that activity as worthwhile, which is M4's call.

❓ D4 - Hand-off tolerance: how much slower may the partner be on the shared Goal? Options: (a) **the partner reaches the Goal's next Milestone within the Expected Return**; (b) within 1.5× the current holder's ETA; (c) at least as fast.
➡️ (a). It uses a number the player already gave us (one tap, or the learned gap, #10 item 4). It also matches how the player experiences it: "the Milestone still lands before I'm back". Option (c) would almost never fire, because the holder is usually the stronger character, and it would kill #12's own example. Option (b) is arbitrary.

❓ D5 - Skilling comparisons and ADR 0005 (leverage model Q6): Toolbox has no ore/h or skill-EXP/h, so M5 cannot say "mine X instead of Y, it's faster". Options: (a) **keep ADR 0005 as is: skilling options win only on Goal position, Goal count, or Role fit backed by efficiency and AFK-gain comparisons**; (b) amend ADR 0005 to allow one small formula, efficiency → resources/h, for the 4 gathering skills.
➡️ (a) for the MVP. It covers the cases that matter (the wrong class on a Role skill; a skill that serves no Goal) without owning a formula the game patches every 1–2 weeks. Revisit after the 5-session bar if players report "should I be on Iron?" through Suggestions.

## 9. Red-team notes

**R1 Wrong advice from an unreached map.**
- **Failure:** the unfiltered sweep's top class-EXP maps for every W2-late fighter were W3 maps (101–105), which they cannot reach. A naive engine would send a W2 character to W3.
- **Defence:**
  - FR-2 and TR-4 reachability, plus the world ≤ `currentWorld` cap;
  - a contract test that the current map is always reachable;
  - Yasser's one in-game check of the Poopy Sewers result before build.

**R2 Trading a real Goal for raw numbers (the Copper lesson).**
- **Failure:** XP or kills/h beats a deliberate activity.
- **Defence:**
  - FR-4 puts Goal position before any rate;
  - skilling has no rate, so "Iron instead of Copper" can never win on speed (US-1);
  - kills/h alone is never used (US-4: Jar Bridge's 1,816 vs 934 is ignored);
  - "also considered" shows what was rejected and why, so a wrong rejection is visible and reportable.

**R3 Breaking the account to help one character.**
- **Failure:** pulling a Lab character off switches off Certified Stamp Book (2× stamps) or Killer's Brightside for everyone.
- **Defence:**
  - FR-6 re-runs Toolbox's own `getLab` with the character removed and compares lit nodes (verified on `first.json`: 1–3 nodes lost per character);
  - it fails closed when the re-run can't run;
  - Arctis cases are handled by the same re-run (`speedrun-rank1.json`).
- **Residual risk:** the re-run is Toolbox's model of the chain. The prism-first ordering and the souped-tube rank can shift when one character leaves. Mitigation: compare lit sets, never positions, and add a W4 golden test once a real W4 save exists.

**R4 Unsafe suggestion.**
- **Failure:** a better map kills the character or starves it before the Expected Return.
- **Defence:**
  - FR-8 runs M3's own Checks on the hypothetical;
  - a survivability floor applies if M3 lacks one (TR-8, US-8);
  - M5 can never flip a Verdict (FR-16).

**R5 Patch drift makes confident nonsense.**
- **Failure:** the game patches every 1–2 weeks. The pin was already one version behind on 2026-10-17.
- **Defence:**
  - the identity contract test runs at build and at runtime (TR-5);
  - rate steps pause when the parser is behind (FR-9, US-13);
  - generated facts are re-generated per re-sync (ADR 0007);
  - Stale badges apply.

**R6 Flicker and nagging.**
- **Failure:** a save every ~4 min re-ranks two near-equal maps back and forth, or the same line nags every session.
- **Defence:**
  - the 1.25× margin (D1);
  - fixed index tie-breaks;
  - FR-4 never lets unknown numbers win;
  - Skip today and Not for me per option id;
  - one line per row.
- **Residual risk:** an option sitting right at the margin can still blink. If golden-snapshot runs on consecutive saves show that, add a small history-based hysteresis (the engine already receives save history).

**R7 UX confusion in pairs.**
- **Failure:** "Bowman is a better fit" on the Barbarian's row reads as a criticism of the Barbarian, or the two rows disagree.
- **Defence:**
  - both rows carry the pair (FR-14), and each names the other;
  - the text states what each character gains;
  - a character appears in at most one pair;
  - the Visit Order is unchanged (FR-16), so nothing forces the swap.

**R8 Privacy leak through comparisons.**
- **Failure:** Toolbox embeds names in some fields (stamps' `bestCharacter`, Lab `playerName`), and comparisons name "the other character".
- **Defence:**
  - only indices, classes and levels are copied into `Hypotheticals` (TR-13);
  - names are shown only in the local UI from the Account State;
  - reports carry class, level and map indices only.

**R9 Contested advice dressed as certain.**
- **Failure:** the W1–W3 pusher (Barbarian vs Squire) and cogs are contested. A Hand-off built on them could look authoritative.
- **Defence:**
  - FR-9 keeps any option decided by a Contested entry off the line;
  - the pusher itself is M2's arithmetic choice, and M5 only protects it (FR-7).

**R10 Too slow for an 11-character account.**
- **Failure:** a full map sweep runs ~0.7 s for 6 characters without the cache. 11 characters on a weaker laptop could stall the Worker.
- **Defence:**
  - the second Worker message keeps the Now screen responsive;
  - Toolbox's `shared` cache;
  - the TR-10 budget is checked in CI;
  - the candidate set shrinks to Goal-served maps when over budget, with `status: 'partial'` shown.

Verified 2026-10-17 against game v1.23 (Toolbox pins `f1e4240`, game 2.3.531, for the measured numbers, and `6827d3f`, game 2.3.540, for the dossiers). Stale against any later patch.
