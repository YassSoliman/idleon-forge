# M5 Higher-leverage options

Spec for [#33](https://github.com/YassSoliman/idleon-forge/issues/33), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Terms follow [GLOSSARY.md](../../GLOSSARY.md). Status: **decisions ruled (section 8), red-teamed (section 10); ready to build once M1–M4 merge.** M5 is last in the build order (#13), so it builds on M1–M4.

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
- **The hypothetical layer.** A small set of Toolbox-computed "what if" numbers, produced in the parse Worker before the engine runs and added to the Account State. It is the only place M5 touches Toolbox, and M4's `bestOpenedExpPerHour` reads the same sweep (RT-3, RT-4).
- The data M5 adds to the Knowledge Base, and the Detectors it needs.

**Out of scope**
- **Parallel Slots** (traps, cog seat, worship charge, cauldron). Filling them belongs to M6 Unspent & idle. Changing which character holds a Parallel Slot is not an AFK Target change.
- **Gear, food, cards, obols and talent presets on the hypothetical.** The clone keeps the character "as it is now" (hypothetical-math §2). The preset swap is unverified (hypothetical-math §3). These belong to M8 Collections and M9 Builds.
- **Active Play:** quests, bosses, minigames, and opening a new portal by hand. A map the character has not reached is a push Goal (M2), never a Move destination.
- **Choosing the pusher.** M2 picks the pusher by arithmetic. M5 only protects it.
- **Course Correction:** making a new character, or the Sub Class Swap Token. These are Meta Path Goals owned by M2.
- **Skilling rates.** Toolbox has no resources-per-hour or skill-EXP-per-hour figures, and ADR 0005 forbids writing our own (see D5).
- **Chains of three or more characters swapping.** Only single Moves and two-character Hand-offs are evaluated.
- **Laboratory as a Move destination.** M5 can compute what a character's removal costs the Lab chain, but not what adding one gains (M4's `contrib.lab.chain` needs the character connected). Lab candidates wait for an "add to Lab" re-run after the MVP (RT-18).
- **Role fit for fighting Roles** (e.g. a Barbarian's "AFK fighting"). Levelling is per character, so there is no shared Goal to compare; only skill Roles are evaluated in the MVP (RT-10).
- **Any LLM at advice time** ([ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md)).

## 3. Functional requirements

**Candidates**
- **FR-1 Candidate Moves.** For each character with data, M5 builds the candidate AFK Targets:
  1. every fighting map in `reachableFightingMaps(c)` (TR-4) whose world is ≤ the account's `currentWorld`;
  2. every skilling AFK Target named by an active Contribution whose level gate the character meets (e.g. a Mining door at Mining Lv 10/25/40/60).

  Laboratory is never a candidate in the MVP (Out of scope, RT-18). The current activity is always included as the baseline.
  The candidate fighting maps are a fixed, deterministic subset of the reachable set: maps in `currentWorld` and `currentWorld − 1`, plus any map named by an active Contribution (TR-10, RT-7).
- **FR-2 Reachability.** A fighting map is a candidate only if the character can walk to it today (TR-4): it is the character's current map, a map the character has killed on, or the destination of a door whose own kill requirement the character has met. Boss, colosseum and quest maps are never candidates. A map the character cannot be shown to reach is never shown, even if its numbers are better: reachability fails closed, so a gap in the door data costs a suggestion, never a wrong one (RT-1, RT-13).

**Comparison** (#11 item 6: blockers, then Priority List position, then arithmetic tie-breaks; no weights)
- **FR-3 Goals served.** For the baseline and each candidate, M5 gets the set of Goals it advances from M4's Contributions. Each Goal comes with its Stage Priority List position (M2) and its next-Milestone ETA. Only Goals M4 counts as **worthwhile** for that activity are counted (M4 FR-5 zero rate, D3 50% rule); a Goal that would be "not progressing" on the candidate serves nothing (RT-9). For fighting candidates, the ETA is arithmetic: the gap ÷ the sum of the Toolbox `finalKillsPerHour` of every character who would be contributing after the move. Skilling Contributions are yes/no and carry no ETA (#11 item 8; D5).
- **FR-4 Comparison order.** A candidate beats the baseline only by winning the first of these steps that decides:
  1. **Best position:** the lowest position among the Goals served. Lower wins. A candidate that serves any Goal beats a baseline that serves none.
  2. **Closest Milestone:** only for a Goal at that best position that **both sides serve** (D1: "same Goal, sooner Milestone"). The candidate wins if its ETA for that Goal ≤ the baseline's ETA ÷ `clearMargin` (D1: 1.25); the baseline wins if its ETA is shorter at all. If the gain is inside the margin, or either side has no ETA, or no shared Goal exists, the step does not decide and the comparison moves to step 3. Two different Goals are never compared by ETA (RT-9).
  3. **Most Goals:** the number of Goals served. More wins.

  The first step that has a winner decides, **for whichever side wins it**: a baseline win at any step means no option. If no step decides, there is **no option**. Unknown numbers never win, so the comparison fails closed.
- **FR-5 Class XP as a Goal.** Class XP is compared only as the M4 Goal "level this character", with Milestones at the next level gates. Its ETA is (EXP needed) ÷ (Toolbox `finalKillsPerHour` × the monster's `ExpGiven` × `getClassExpMulti`) on that map, which is plain arithmetic on Toolbox numbers. Its list position is the bottom of every Stage list (D2). M5 never ranks maps on kills/h alone (#16).

**Gates that suppress an option** (applied before display; a suppressed option goes to "also considered" with its reason, FR-15)
- **FR-6 Lab-chain rule.** A Move, Hand-off or Role fit that takes a character off `LABORATORY` is suppressed when re-running Toolbox's `getLab` with that character out of the lab turns off any Mainframe node or jewel that is lit now. It is also suppressed when that re-run cannot be computed (fail closed). The option's "also considered" entry names the nodes that would switch off. A character kept in the chain by something other than its AFK Target (Arctis, W5) loses nothing, so the rule does not block it. Removals are not independent (RT-12): at most **one** option per account per save may take a character off `LABORATORY` (the lowest character index among those that pass), and a Hand-off counts both of its characters.
- **FR-7 Pusher protection.** The character M2 names as the pusher is never offered a Move, Hand-off or Role fit away from an activity that serves the push Goal. Portal kills are per character, so the push Goal is never handed off; choosing a different pusher is M2's job (M2 FR-11), not M5's (RT-19).
- **FR-8 AFK safety.** Every fighting candidate must pass M5's own survivability rule (TR-8), applied unconditionally: it is suppressed when its Toolbox survivability, with the character's current food, is below 95% **and** below the baseline's. A missing survivability number suppresses it (fail closed). This is an M5 rule, not M3's FR-13, because M3 deliberately does not block a death that no owned food fixes (RT-6). M3's other Checks (food stacks, carry caps) run on the next save after the player moves, which arrives on the character switch (#5).
- **FR-9 Contested and Stale.**
  - If the deciding step rests on a Contested entry (its Goal position or its Contribution), the option is never the shown line. It may appear in "also considered" with the "sources disagree" badge.
  - If the deciding entry is Stale, the option is shown with the Stale badge and ranks below any fresh option.
  - **Rates distrusted.** When the server build is not in the pin's `verifiedBuilds` (M1 FR-29, regardless of failed sections), or TR-5's identity check fails, FR-4 step 2 and FR-5 are skipped, because they need Toolbox rates. Survivability comes from the same model, so every **fighting** candidate is also suppressed (reason `parser-behind`). Only position or Goal-count wins between non-fighting activities can show. The two version numbers are never compared directly (M1 D3, RT-5).

**Option kinds**
- **FR-10 Move.** The best surviving candidate under FR-4 becomes the character's Move option. Ties are broken by the lower map index, then the lower skill index, so the result is deterministic.
- **FR-11 Hand-off.** For a character `c` whose Move is blocked only because it would drop a Goal `g` (it wins FR-4 once `g` is removed from the baseline), M5 looks for a partner `c'`. It offers "`c'` is a better fit for `<activity>`" when all of these hold:
  - (a) `c'` has a Move into `c`'s current activity, computed by FR-10 against the current Account State, **or** `c'` is already on that activity (a half-followed Hand-off still frees `c`, RT-8);
  - (b) `c'` would reach `g`'s next Milestone within the Expected Return (D4: the Expected Return is the tolerance);
  - (c) `c`'s freed Move clears FR-4 once `g` is still served by `c'`.

  Among several partners, the shortest ETA for `g` wins, then the lower character index. Only pairs are evaluated.
- **FR-12 Role fit.** It follows leverage model §4.3, for **skill** AFK Targets only (Mining, Choppin, Fishing, Catching; fighting Roles are out of scope, RT-10). It is offered when:
  - (a) M2's `roleOwnersOf(activity)` names a character `o` (not `c`) whose Role owns `c`'s current AFK Target;
  - (b) `o` is not the pusher and is on an activity that is not its own Role;
  - (c) Toolbox agrees: `o`'s `getSkillEfficiency(skill)` and `getAfkGain({...o, afkType})` are both higher than `c`'s;
  - (d) `o` moving onto the skill does not lose under FR-4 (its baseline's Goals against the skill's Goals), so the owner never drops a better Goal (the Copper lesson);
  - (e) `c` has a destination: its own Move from FR-10 once the skill is held by `o`, or, if none, the line names no destination for `c` and says only "`o` owns this skill";
  - (f) FR-6 to FR-9 pass for both characters.

  An owner appears in at most one Role-fit pair per save (the `c` with the lowest efficiency, then the lower index).
- **FR-13 Unknown-Purpose suggestion.** When M4's Purpose is `exhausted`, `none` or `no-activity` (Verdict Unknown, "What is this character for?"), M5 supplies exactly one suggestion. For `not-covered` and `cannot-tell` it supplies none, matching M4 FR-14 (RT-17). The suggestion is the best candidate against an empty baseline, where candidates are ranked against each other by FR-4's steps (position, then the shared-Goal ETA, then Goal count, then FR-10's index tie-break). If no candidate serves any Goal, it suggests the AFK Target that the character's own Role owns, but only if that target passes FR-2, the level gate, and FR-6 to FR-9. Otherwise there is no suggestion. It never changes the Verdict (D3).

**Output and display**
- **FR-14 One option per character.** Each character has at most one Higher-leverage option (#12 item 3); M10 decides where it renders (M10 FR-21: in Focus). The priority is Hand-off, then Role fit, then Move, because a Hand-off or Role fit carries a Move inside it. The line has a Source label like every Next Action (#10 item 10). A Hand-off or Role fit is attached to both characters, sharing one option id. The engine output names the other character only by `partnerIndex`; M10 renders that character's name from the local Account State and links to its Focus (M10 FR-21), so two characters of the same class and level are never confused (RT-20).
- **FR-15 Focus card detail.** Tapping the row (C Focus, #12) shows:
  - the option's numbers: kills/h, class EXP/h ratio, Milestone ETAs before and after, survivability;
  - the step that decided it (FR-4 step 1, 2 or 3);
  - up to 2 "also considered" alternatives, each with its reject reason (lab chain, not reachable, AFK-unsafe, pusher, loses Goal X, below margin, Contested, no rate).
- **FR-16 Never a Verdict input.** A Higher-leverage option never changes a Verdict, the 3-Goals-per-character cap, or the Visit Order (D3).
- **FR-17 Done, Skip, Not for me.**
  - The option disappears when a later save shows the suggested change (the character, or the partner, on the destination activity), or when it no longer wins.
  - **Not for me** is offered, as M10 FR-21 defines for this line (no Skip today on it). It is keyed with M10's dismissal key, `${textEntryId}@${optionId}`, and lasts until the next patch, as in #10 item 8. Dismissing a pair on either character hides it on both. If a character slot is deleted, indices shift and a dismissed key stops matching, so the line can reappear: that fails visible, never silent (RT-14).
- **FR-18 Report this.** Sends M10's TR-10 report payload (Stage, versions, the reported character's class and level), plus two game-data identifiers that describe the advice, not the account:
  - the option id (kind, slot indices and destination key);
  - the Knowledge Base entry ids that decided it.

  It never sends names, save data, or the partner's class and level (#11 item 15, ADR 0008). Adding the two identifiers to M1 TR-22's allow-list is an M5 dependency (§7, RT-15).
- **FR-19 Determinism.** The same Account State, save history, Knowledge Base and `now` always produce byte-identical M5 output. Golden snapshots enforce this (TR-12).

## 4. User stories

Fixtures:
- **W2-late account:** the private W2 save, 5 characters, Stage W2-late.
- **W3-early account:** the private W3 save, 6 characters, Stage W3-early.
- **Public saves:** Toolbox's GPL saves in `packages/account-state/fixtures/public/`.

**Test Knowledge Base.** Until M2 and M4 author the real entries, the acceptance tests run on a pinned test Knowledge Base, `kb-fixture/m5-min`, with M2 and M4 stubbed. It contains:
- **Push:** the push Goal at position 2. Its only Contribution is the pusher's own kills on its frontier map while that map's next portal is still closed (portal kills are per character).
  - M2 is stubbed to name the Squire Lv 85 on the W3-early account and the Barbarian Lv 60 on the W2-late account, matching M2's fixture result (M2 US, TR-10: Barbarian 60 at 1,680/h on Sands of Time). The push Goal's Contribution is per character, so on W2-late it covers only the Barbarian's own frontier kills; Poopy Sewers is not the frontier, so US-5 and US-6 still test Dirty Money (RT-21).
  - The W2-late push steps (Djonnut quests, Efaunt) are Active Play, so they have no AFK Contribution.
- **Materials:** a stamp and forge material Goal at the W1-mid stamps position (5), on every Stage, with Copper Ore as a Contribution.
- **Dirty Money:** the Upgrade Vault's per-power-of-10 Poop kills Goal, at the leverage model's W2-late Vault position (11). It applies W1-late to W2-late only.
- **Death Note:** the mob-rank Goals at the W3-mid position (6). They apply from W3-mid, so they are active on neither fixture.
- **Levels:** "level this character" (Class XP, with an ETA from TR-3) and "level this skill" (yes/no, no ETA), both at the bottom of every list (D2).
- **No card-star Goals:** their order is unverified (PV 2.1), and Toolbox has no card drop multiplier, so they would have no ETA. M8 adds them later.

The golden Now-screen snapshot with the real Knowledge Base is re-baselined when M2 and M4 land. These stories pin the *rules*. A second golden run uses M4's real Contribution table (cards at W1-early position 8, Death Note from W3-early), because unowned card Goals outrank Class XP and can change US-2 and US-12 (RT-16).

**Numbers to re-measure.** The kill rates, EXP ratios and Lab node lists below were measured on 2026-10-17 with the first-draft reachability approximation and the first-draft Lab re-run, both of which the red-team found faulty (RT-1, RT-2). The rules each story pins stand; the exact destinations and numbers are re-measured with the TR-4 and TR-3 fixes before the first build PR, and each story is then asserted on a derived test state whose reachable set is fixed in the test, so every story has one stated outcome (RT-13).

**US-1 Don't undo deliberate skilling (#12 regression).** As a player in a Play Session, I want ActiveOn to leave a skiller alone when its resource is what the account needs, so that I'm not told to mine Iron when I'm mining Copper on purpose.
- **Given** the W2-late account, where the Squire Lv 43 is AFK Mining Copper (Mining Lv 20, Iron's door open) and Copper Ore is named by an active material Contribution, **When** the engine runs, **Then** the Squire's row shows **no** Higher-leverage line. "Also considered" may list Iron with reason "loses Goal: stamp materials".
- **Given** the same account with the Copper Contribution removed from the test Knowledge Base (Copper and Iron both serve only Mining XP), **When** the engine runs, **Then** there is still no line, because skilling has no ETA and FR-4 step 2 is skipped (FR-4: unknown never wins).

**US-2 Clearly more class EXP.** As a player in a Play Session, I want to hear when a character could earn far more class EXP somewhere it can reach, so that its AFK Stretch isn't wasted.

These characters' current maps earn under half of their best reachable map's EXP/h, so M4 marks their Purpose `exhausted` (M4 D3, M4 US-5) and the line is an **Unknown-Purpose suggestion** (FR-13), not an ordinary Move (RT-4).
- **Given** a derived W2-late state where the Shaman Lv 44 fights on Jungle Perimeter (1,285 final kills/h, 100% survival in the first measurement), its current map serves only Class XP, and its reachable set is fixed to {Jungle Perimeter, The Ring (62)}, **When** the engine runs, **Then** its Purpose is `exhausted`, and it gets exactly one `unknown-purpose` option to The Ring (first measured at about **15.5×** the class EXP per hour), decided by position against the empty baseline. The Focus card shows the numbers and the deciding step.
- **Given** the same state with Poopy Sewers (8) added to the Shaman's reachable set, **When** the engine runs, **Then** the option is Poopy Sewers instead, because it also feeds Dirty Money (position 11 beats Class XP at the bottom).
- **Given** a derived W2-late state where the Bowman Lv 54 fights on Spore Meadows (map 1) at about 11k class EXP/h, with Sands of Time (64) in its reachable set and Poopy Sewers not, **When** the engine runs, **Then** it gets exactly one `unknown-purpose` option to Sands of Time (first measured at about **214×** the class EXP per hour, 100% survival).
- **Given** the W2-late account as saved, **When** the engine runs, **Then** no destination is a W3 map (101–105, which top the unfiltered sweep), a boss, colosseum or quest map, or a map behind a door whose own requirement the character has not met (R1, RT-1).

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
- **Given** a derived W2-late state where both the Bowman Lv 54 and the Shaman Lv 44 can reach Poopy Sewers, **When** the engine runs, **Then** the pair is Barbarian ↔ Bowman: the Bowman alone would reach 10,000 Poop kills in about **6.0 h** (7,005 ÷ 1,169, first measurement), against 6.4 h for the Shaman (7,005 ÷ 1,100), both within the 8 h default. The Bowman shows the Hand-off instead of its US-2 suggestion (FR-14).
- **Given** a derived state where no partner can reach Poopy Sewers, **When** the engine runs, **Then** the Barbarian stays silent, as in US-5.
- **Given** a derived state where the Bowman is already on Poopy Sewers and the Barbarian has not moved, **When** the engine runs, **Then** the Barbarian still gets its freed Move (FR-11(a)).

**US-7 Never move the pusher off the push.** As a player in a Play Session, I want the pusher left on the portal grind, so that the account's top Goal keeps moving.
- **Given** the W3-early account, where the Squire Lv 85 is the pusher on Thermonuclear Climb (map 109). It has 1,065 kills/h at a 36% hit chance, and the next portal needs 15,000 kills. Rollin' Tundra would give it **1.32×** the class EXP/h. **When** the engine runs, **Then** there is no line on the Squire's row.
- **Given** the same account, **When** the engine runs, **Then** no Hand-off or Role fit involving the Squire's push is offered to any character (FR-7: the push Goal is never handed off).

**US-8 Don't send a character somewhere unsafe.** As a player in a Play Session, I want suggestions to pass the same AFK-safety checks as my current setup, so that following one never breaks my Ready.
- **Given** a derived W3-early state where the Shaman Lv 54 is on Shifty Sandbox (895 kills/h, 100% survival) and its reachable set is fixed to include one ordinary W3 map whose clone gives more class EXP/h but 75% survival, **When** the engine runs, **Then** there is no line, and "also considered" shows that map with "AFK-unsafe" (FR-8). (The first draft used Inside the Igloo, a quest map that only looked reachable because of RT-1.)
- **Given** the W3-early account as saved, **When** the engine runs, **Then** Inside the Igloo (118) and the other boss, colosseum and quest maps are never in any character's candidate set.

**US-9 Don't break the Lab chain.** As a player in a Play Session, I want ActiveOn never to pull a character out of the Lab if that switches off account-wide bonuses, so that one "better" character doesn't cost everyone.
- **Given** the public save `first.json`, where characters at save index 1, 2, 4 and 5 are AFK in the Lab and connected, and the fixed re-run (TR-3) shows each of them switching off at least one lit node or jewel (first draft: 1–3 nodes each), **When** the engine runs with a test Knowledge Base where a fighting map would otherwise win for any of them, **Then** none of the four gets a Move, Hand-off or Role-fit line, and each Focus card shows "would switch off: …" with the nodes and jewels for that character.
- **Given** the public save `speedrun-rank1.json`, where the one character AFK in the Lab (index 4) is kept connected by something else (first draft: 0 nodes lost; jewels to be re-measured with the fixed re-run), **When** a candidate would otherwise win and the fixed re-run shows nothing lost, **Then** the Lab rule does not suppress it.
- **Given** a test where removing one Lab character switches a jewel off (a jewel lit only through that character), **When** the re-run runs, **Then** `lostJewels` names it, and the live parsed `account.lab` is byte-identical before and after (TR-13, RT-2).
- **Given** two Lab characters who are each safe to remove alone, **When** both would otherwise get a Move, **Then** only the lower index gets one (FR-6).

**US-10 Better fit by Role.** As a player in a Play Session, I want to know when another class owns the job a character is doing, so that each job goes to the character built for it.
- **Given** a test state derived from the W3-early account: the Squire Lv 51's AFK Target is set to Catching (Catching efficiency 56), and the Bowman Lv 60, whom `roleOwnersOf('CATCHING')` names, is fighting (not its Role, not the pusher, and its fighting serves only Class XP so FR-12(d) passes) with Catching efficiency 1,277 and a higher Catching AFK gain (0.88 vs 0.81). **When** the engine runs, **Then** both characters carry the one Role-fit option, each linking to the other (FR-14), with the efficiency numbers in the Focus card.
- **Given** the same state where the Bowman's fighting also serves a higher-position Goal, **When** the engine runs, **Then** there is no Role-fit option (FR-12(d)).
- **Given** the W2-late and W3-early accounts as saved, **When** the engine runs, **Then** there is no Role-fit line on either. No character is on an AFK Target that the Role table gives to a different class with a free owner. (The W3 Barbarian Lv 56 fishes, which is its own Role.)

**US-11 What is this character for?** As a player in a Play Session, I want one concrete idea when a character's activity serves nothing, so that the Unknown Verdict comes with a way out.
- **Given** a test state derived from the W2-late account with the Bowman Lv 54's AFK Target set to `Nothing`, **When** the engine runs, **Then** its Verdict is Unknown (from M4), and the row shows exactly one suggestion: the FR-4 Move against an empty baseline, which is the same destination as US-2's Bowman case. The Verdict stays Unknown until a save confirms the move.

**US-12 Quiet accounts stay quiet.** As a player in a Play Session, I want no Higher-leverage noise when my AFK Targets are already sound, so that I trust the lines when they appear.
- **Given** the W3-early account, **When** the engine runs on `kb-fixture/m5-min`, **Then** no character has a Higher-leverage line. Its leaks are Parallel Slots and spending (M6, M7), not AFK Targets, which matches leverage model §5.2.
- **Given** the W2-late account, **When** the engine runs, **Then** only characters whose Purpose M4 marks `exhausted` carry a line (US-2, first measured: the Shaman Lv 44 and Bowman Lv 54), plus any Hand-off that passes US-6.

**US-13 Stale parser, fewer claims.** As a player in a Play Session, I want rate-based advice paused while the parser is behind the game, so that a patch can't make ActiveOn confidently wrong.
- **Given** the W2-late account with its server build set to one not in `verifiedBuilds`, and a save that parses with no failed sections, **When** the engine runs, **Then** every fighting option is absent (FR-9), and the Focus card shows "comparisons paused: game updated, parser not caught up". A position-decided option between non-fighting activities would still show, with the Stale badge.
- **Given** the TR-5 identity check failing at runtime, **When** the engine runs, **Then** the same pause applies.

## 5. Technical requirements

**TR-1 Package boundaries.**

| Where | What | Why |
|---|---|---|
| `packages/account-state` (runs in the parse Worker) | `hypotheticals/`: the clone helpers, rate table, reachability and Lab removal. Only this code imports Toolbox. Its output is plain data on the Account State | ADR 0006: Toolbox stays in the Worker. ADR 0005: Toolbox numbers only |
| `packages/engine` | `higher-leverage/`: candidate building, FR-4 comparison, the gates and option assembly. A pure function | #14 item 4 |
| `packages/knowledge` | `systems/leverage.yaml`: M5's Checks and parameters; generated `gen/maps.json`, `gen/lab-nodes.json`, `gen/skill-classes.json` | #11, ADR 0007 |
| `apps/activeon` | Renders the option and the Focus card section (M10 FR-21). No logic | M10 |

**TR-2 Engine output types.**

```ts
// packages/engine/src/higher-leverage/types.ts
export type ActivityRef =
  | { kind: 'fight'; mapIndex: number; targetMonster: string }
  | { kind: 'skill'; afkType: 'MINING' | 'CHOPPIN' | 'FISHING' | 'CATCHING'; target: string }
  | { kind: 'lab' }
  | { kind: 'other'; afkType: string }   // COOKING, DIVINITY, SPELUNKING, … : baseline only, never a candidate
  | { kind: 'none' };                     // Nothing / Paying_Respect only

export interface GoalServed {
  goalId: string;              // Knowledge Base Goal entry id
  position: number;            // Stage Priority List position (M2); ties allowed
  contested: boolean;
  stale: boolean;
  etaHours: number | null;     // next Milestone; null = no rate (skilling) or unknown
}

export type RejectReason =
  | 'unreachable' | 'lab-chain' | 'pusher' | 'afk-unsafe' | 'loses-goal'
  | 'below-margin' | 'contested' | 'no-rate' | 'parser-behind' | 'no-hypothetical'
  | 'lab-one-per-save' | 'owner-loses-goal';

export interface Considered {
  to: ActivityRef;
  reason: RejectReason;
  detail?: string;             // e.g. lost goal id, or "Wired_In, Gilded_Cyclical_Tubing"
}

export interface HigherLeverageOption {
  /** Stable across saves: `hl:<kind>:<characterIndex>:<destKey>[:<partnerIndex>]`. With textEntryId, keys Not for me (FR-17). */
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
    survivability?: [now: number, then: number];   // %, 0..100, as Toolbox and M3
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
  // M10 renders this through its `HigherLeverage` view type; M10's type gains
  // alsoConsidered, stale, decidedBy and status in the same PR that lands M5 (RT-14).
}
```

**TR-3 Hypothetical layer (Worker side).** It is computed right after the parse, from the same Toolbox objects, and **before** the engine runs, inside the same parse response (M10: the engine runs in the parse Worker and returns one `EngineResult`). There is no second message, so a Verdict that depends on M4's `bestOpenedExpPerHour` never flips when M5's data lands (RT-4). M1's reserved `what-if` message is not used by the MVP; this sweep is part of the parse response, and M2's one-map `account.frontier` is reused rather than recomputed (RT-3).

```ts
// packages/account-state/src/types.ts (addition, owned with M1)
export interface FightRate {
  mapIndex: number;
  targetMonster: string;
  finalKillsPerHour: number;   // Toolbox getMaxDamage(...).finalKillsPerHour on the clone
  survivability: number;       // %, 0..100 (Toolbox getSurvivability, same unit as M3)
  hitChance: number;           // %, 0..100
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
  afkGain: Partial<Record<'FIGHTING' | 'MINING' | 'CHOPPIN' | 'FISHING' | 'CATCHING' | 'LABORATORY' | 'COOKING' | 'DIVINITY' | 'SPELUNKING', number>>;
  skillEfficiency: Partial<Record<'mining' | 'chopping' | 'fishing' | 'catching', number>>;
  lab: LabRemoval | null;      // null when the account has no Lab data
}
export interface Hypotheticals {
  status: 'ok' | 'partial' | 'unavailable';  // partial: some characters' sweeps threw; those characters get no option
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
- **Lab removal:** `getLab(raw, rawCharacters with c's AFKtarget changed, { ...structuredClone(account), lab: undefined }, characters)`, then a comparison of `labBonuses[].active` and `jewels[].active` against the live parse. `lab` must be cleared: Toolbox reuses `account.lab.jewels` when present (`world-4/lab.ts`, `jewelsList = account?.lab?.jewels || …`) and its `checkConnection` only ever sets `active = true` on those shared objects, so a re-run on the live account keeps every lit jewel lit (under-counting lost jewels and, through jewel range bonuses, lost nodes) and mutates the live state (RT-2). The first draft measured ≤ 1 ms per character; re-measure with the clone.
- **Units:** survivability and hit chance stay in Toolbox's percent (0..100), the unit M3 uses. M2's `Frontier` stores 0..1; M5 converts on read (RT-6).

**TR-4 Reachability Detector.** `reachableFightingMaps(c)` reads the raw `KillsLeft2Advance` (not Toolbox's `character.kills`, which keeps door 0 only) and contains:
- the current map;
- every map where the character has killed something (`KillsLeft2Advance[m][i] < mapPortals[m][i]` for some door, or a negative `KillsLeft2Advance` on a map with no requirement, meaning kills beyond it). Toolbox's `hasClearedMap` is **not** used: on a map whose door-0 requirement is 0 it returns true for every character, even a Lv 1 that never went there (`portals.ts`; `fresh.json` shows this on 10 maps);
- for each door `i` of such a map, `mapPortalDestinations[m][i]` only when that door's own requirement is met (`KillsLeft2Advance[m][i] <= 0`), minus doors closed by `getMultiCharDoorLock`. Door 0's requirement never opens door 1 (e.g. Jungle Perimeter `[60, 3000]`, The Stache Split `[3000, 100000]`);
- never a map in Toolbox's boss, colosseum and quest exclusion list (`getFilteredPortals` in `portals.ts`: Igloo maps, Efaunt's Tomb, Grandfrog maps, Gravel Tomb, Heaty Hole, End of the Road, Colosseums, …);
- only maps in worlds ≤ `currentWorld`.

The portal graph and the exclusion list are generated facts (ADR 0007, `gen/maps.json`): the exclusion list is produced by calling Toolbox's exported `getFilteredPortals` at generation time, so it re-syncs with the pin like the rest. Toolbox's door data has no door into some entry maps (Poopy Sewers 8, Steep Sheep Ledge 101, Chizoar's Cavern, …); those maps are reachable only once the character has killed there. That costs suggestions, never correctness (FR-2, RT-13).

Contract tests, on all 11 public saves and both private fixtures:
- every fighting character's current map is in its own set;
- a Lv 1 character (`fresh.json`) reaches only its current map and the doors it has actually opened;
- no excluded map ever appears;
- the set differs from the first-draft approximation only in ways a test names (re-baseline record for US-2, US-6, US-8).

**TR-5 Identity contract test** (hypothetical-math §6). On every fixture, the clone rebuilt on each fighting character's own map must equal the direct parse field by field (it passed on 8 of 8 fighters on 2026-10-17). It runs in CI on the public saves and locally on the private ones.
- If it fails at runtime, `identityCheck = 'fail'` and FR-9's "rates distrusted" mode applies to that save.
- **What it can and cannot catch:** it runs the same pinned code twice, so it catches a clone that drifted from the direct parse (new fields the clone does not swap). It cannot catch a patch that changes the game's own damage or EXP rules; that is FR-9's `verifiedBuilds` trigger (RT-5).

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
| `higherLeverage.move` | Account State + hypotheticals, M4 Purpose, M2 positions and pusher, M3 `AfkSafetyResult`, Knowledge Base, `now`, Expected Return | `HigherLeverageOption \| null` per character |
| `higherLeverage.handoff` | the same, plus every character's Move result | option or null |
| `higherLeverage.roleFit` | the same, plus M2 `roleOwnersOf` and `gen.skill-classes` | option or null |
| `higherLeverage.unknownPurpose` | the same, plus M4's Unknown flag | option or null |
| `labChainSafe` | `LabRemoval` | `true` / `false` (false also when `lostNodes` or `lostJewels` is null) |
| `higherLeverage.survivable` | baseline and candidate `FightRate` | `true` / `false` (TR-8) |

**TR-8 AFK-safety rule.** M3 exposes only `AfkSafetyResult` for the current state (M3 §7); there is no hypothetical M3 check (RT-3). M5 therefore owns one Detector, `higherLeverage.survivable(baseline: FightRate, candidate: FightRate): boolean`, true when `candidate.survivability >= 95` or `candidate.survivability >= baseline.survivability` (both %, current food). `survivableFloor: 95` lives in `leverage.move.params`. M5 also reads the current `AfkSafetyResult`: it never proposes a Move for a character whose current M3 result is a blocker that the Move does not address (the Fix comes first).

**TR-9 M4 and M2 interfaces.**
- M4 `purposeOf(characterIndex): GoalServed[] | { unknown: 'exhausted' | 'none' | 'no-activity' | 'not-covered' | 'cannot-tell' }`.
- M4 `goalsServedBy(activity: ActivityRef, contributors: number[], rates: FightRate[]): GoalServed[]`: M4's pure Contribution Detectors evaluated on a hypothetical activity, with M5's `FightRate` passed in (M4 itself never calls `getMaxDamage`, M4 TR-6). Only worthwhile Goals are returned (FR-3).
- M4 `activitiesServing(goalId): ActivityRef[]`.
- M2 `stage`, `positionOf(goalId)`, `pusherIndex: number | null`, `roleOwnersOf(activity)` (M2 FR-23), `account.frontier`.

The M2 names are taken from M2's spec. `goalsServedBy` and `activitiesServing` are **not yet in M4's spec**: M4 must export them (its Detectors are already pure) before M5's build starts. That is a blocking dependency (§7, RT-3).

**TR-10 Performance budgets** (measured 2026-10-17 on Node 22, M-series laptop):
- **Measured:** a parse takes ~0.5 s. An unshared `getMaxDamage` clone costs ~1.4 ms. A 6-character sweep over ~75 maps took ~0.7 s without the `shared` cache. Lab removal takes ≤ 1 ms per character (first-draft re-run).
- **Candidate set is fixed, not adaptive.** FR-1's subset (current and previous world, plus Contribution-named maps) is the same on every device, so the output never depends on device speed (FR-19, RT-7). There is no runtime shrinking.
- **Budget (to confirm before build):** the cached sweep over that subset is measured on `highend.json` (an 11-character late-game save) in the first build PR; the target is **≤ 300 ms p50 and ≤ 800 ms p95** in the Worker (CI proxy: Node, ≤ 600 ms on `highend.json`), within M1's parse budget and on top of M2's frontier step and M3's food clones. The engine's M5 step adds **≤ 20 ms**.
- **If CI shows it over budget,** the fix is a reviewed change to FR-1's fixed subset (for example, current world only), never a device-dependent cut.

**TR-11 Storage.** M5 stores nothing new:
- Not for me uses the M10 preference store (localStorage, M10's key `${textEntryId}@${optionId}`, per patch).
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
| **Loading** | None of M5's own: the sweep is part of the parse response (TR-3), so M5's options arrive with the rest of `EngineResult` |
| **Broken parse / empty account** | No advice at all (#10 item 13). M5 emits nothing |
| **Hypotheticals unavailable** (Toolbox threw, section failed) | `status: 'unavailable'`. Position-decided options would need Goal sets only, but rate data is also needed for AFK-safety checks, so M5 emits **nothing** and the Focus card says "comparisons unavailable". M4 skips its Class-EXP Contribution in the same case (M4 TR-6) |
| **Identity check fails** (clone drift) | FR-9 "rates distrusted": rate steps off and fighting candidates suppressed (TR-5) |
| **Server build not in `verifiedBuilds`** | FR-9 "rates distrusted", even when the save parses cleanly; M1's footer or banner rule is unchanged |
| **Character on Cooking, Divinity, Spelunking or another non-candidate AFK type** | `ActivityRef` kind `other`: a real baseline whose Goals come from M4. If M4 has no Contribution for it, M4 says `not-covered` and M5 stays silent (FR-13). Never treated as `none` (RT-11) |
| **Stale Knowledge Base entry decides** | Shown with the Stale badge, ranked below fresh options (glossary: Stale) |
| **Contested entry decides** | Never the line; badge in "also considered" |
| **Character with no AFK Target** (`Nothing`, `Paying_Respect`) | Baseline is empty. FR-13 suggestion if M4 marks it Unknown |
| **Skilling baseline vs fighting candidate** | Only FR-4 step 1 or 3 can decide (the skilling side has no ETA) |
| **Character on a map it can no longer "reach"** (current map always counts) | Fine; the current map is always the baseline |
| **Multi-target skilling map** | `targetMonster` passed explicitly (hypothetical-math caveat 4) |
| **Account without Lab** (pre-W4, both fixtures) | `lab: null`; FR-6 is vacuous |
| **Two Lab characters each safe to remove alone** | At most one Lab-leaving option per save (FR-6) |
| **Lab re-run fails** | `lostNodes: null`, so the Move is suppressed (fail closed) |
| **Arctis (W5) keeps a character in the chain** | The re-run shows nothing lost, so moving is allowed (US-9, `speedrun-rank1.json`) |
| **No pusher** (M2 returns null) | FR-7 is vacuous |
| **Two characters get the same destination** | Allowed in the MVP. An account-wide kill Goal sums contributors, so each row's ETA assumes only that character moves (FR-3). The Focus card says "if only this character moves". Whether to cap it at one Move per destination is open (RT-8, Needs Yasser) |
| **A Hand-off partner is also a Hand-off holder** | Only pairs: a character appears in at most one Hand-off, chosen by FR-11's tie-break. The other keeps its Move |
| **Save arrives mid-session; option flips** | Recomputed per save. FR-4's margin and the fixed tie-breaks keep it stable. No hysteresis state in the MVP (red-team R6) |
| **Player follows the advice** | The next cloud save (instant on character switch, #5) shows the new AFK Target, so the line disappears (FR-17) |
| **Offline** (no new saves) | Works on the last good save, with the "last cloud save Ns ago" line (#10 item 12). Nothing extra |
| **Multiple tabs** | Each tab's Worker computes independently. Determinism (FR-19) gives the same lines. Skip and Not for me are shared through localStorage |
| **Second account in the same browser** | One account per browser (#10 item 16). On sign-out, Skip and Not for me keys are cleared with the rest of the data |
| **11 characters** | Budget TR-10; pairs evaluated ≤ 55 |
| **W4-entry and later** | The Lab is not a candidate in the MVP (RT-18), so "everyone not pushing goes to the Lab" (W4-entry position 4) is not suggested yet; M4 and M6 still show the Lab Goal. Lab-leaving moves are still guarded (FR-6) |
| **Stale and fresh candidates both beat the baseline** | A fresh-decided candidate wins over a Stale-decided one regardless of FR-10's index order; among the same freshness, FR-10 applies (RT-20) |

## 7. Dependencies

| Module | M5 needs | Interface |
|---|---|---|
| **M1 Sync & Account State** | The Worker computes the `hypotheticals` section inside the parse response, before the engine; Toolbox objects stay in the Worker; contract tests; `verifiedBuilds`; the TR-22 report allow-list gains `optionId` and `entryIds` (FR-18). The reserved `what-if` message is unused by the MVP | `AccountState.hypotheticals` (TR-3); FR-29; TR-22 |
| **M2 Stage & Meta Path** | Stage; each Goal's Priority List position; the pusher; the Role-owner lookup; the frontier fights | `stage`, `positionOf`, `pusherIndex`, `roleOwnersOf`, `account.frontier` (TR-9) |
| **M3 AFK Safety** | The current `AfkSafetyResult`; Expected Return. No hypothetical check (TR-8) | `AfkSafetyResult`; `expectedReturnHours` |
| **M4 Purpose & Milestones** | Goals served per activity, ETAs, the Unknown reason, inverse Contribution lookup; Class XP as a Goal (D2); `bestOpenedExpPerHour` read from M5's sweep. **Blocking:** M4 must export `goalsServedBy` and `activitiesServing` | `purposeOf`, `goalsServedBy`, `activitiesServing` (TR-9) |
| **M6 Unspent & idle** | Boundary only: Parallel Slots are M6's | none |
| **M8 Collections, M9 Builds** | Card, obol and build Goals reach M5 only through M4's Goal sets; preset swaps stay out | none |
| **M10 Now screen UI** | Renders the one option per character in Focus (M10 FR-21), on both characters of a pair, with "also considered"; owns Not for me storage; its `HigherLeverage` type gains the TR-2 fields | `HigherLeverageResult` (TR-2) |
| **M11 Knowledge tooling** | Compiles `leverage.yaml`; generates `gen/maps.json`, `gen/lab-nodes.json`, `gen/skill-classes.json`; schema for `params` | Knowledge Base build |
| **M12 Release** | Golden snapshots, budget check in CI | TR-12 |
| **M13 Suggestions** | Attaches the option id to "Confusing" or "Something's wrong" Suggestions | FR-18 fields |

## 8. Decisions

Ruled by Yasser on 2026-10-17 ([PR #52 comment](https://github.com/YassSoliman/idleon-forge/pull/52#issuecomment-6238791932)): every recommendation accepted as written.

- **D1: `clearMargin` = 1.25×.** When a rate decides (same Goal, sooner Milestone), the alternative must be at least 1.25× better. Why: Toolbox's `finalKillsPerHour` is a model, "a floor, not a prediction", never verified live at W1–W3 (hypothetical-math §5); a smaller margin would sit inside the model's likely error and make lines flicker between saves. At 1.25× the W2-late Wizard Lv 56 (1.22×) and the W3-early Bowman Lv 60 (1.04×) stay quiet, and the lines that fire on the fixtures (15.5×, 214×) are unambiguous. It lives in `leverage.move.params`, so changing it is a one-line Knowledge Base PR. Applies to FR-4 step 2, FR-7, FR-12(c).
- **D2: Class XP ("level this character") sits at the bottom of every Stage Priority List.** XP decides only when nothing else does. Why: it matches the 2026 push-first norm (#27) and the #12 lesson (Copper beat Iron because the Goal mattered, not the XP), while still letting the obviously wasted cases through (US-2: 15× and 214×). Not making it a Goal would silence exactly the lines players most need; a mid-list position would let XP override real System Goals such as Dirty Money (US-5). Applies to FR-5 and the test Knowledge Base.
- **D3: A Higher-leverage option never affects the Verdict.** The Verdict stays AFK safety plus "some worthwhile Purpose". Why: #10 defines the Verdict as AFK safety and #12 makes Ready mean "safe and serving a worthwhile Purpose"; a "better" line is advice, not a blocker, and making it one would put the noisiest, model-dependent part of the engine into the one signal that must never be wrong. If a Goal truly makes the current activity worthless, that is M4's call. Applies to FR-13 and FR-16.
- **D4: Hand-off tolerance is the Expected Return.** A partner qualifies when it reaches the Goal's next Milestone within the Expected Return. Why: it uses a number the player already gave (one tap, or the learned gap, #10 item 4) and matches how the player experiences it ("the Milestone still lands before I'm back"). "At least as fast" would almost never fire, because the holder is usually the stronger character; a 1.5× ratio would be arbitrary. Applies to FR-11(b).
- **D5: ADR 0005 stays as is; no skilling-rate formula in the MVP.** Skilling options win only on Goal position, Goal count, or Role fit backed by Toolbox efficiency and AFK-gain comparisons. Why: it covers the cases that matter (the wrong class on a Role skill; a skill that serves no Goal) without owning a formula the game patches every 1–2 weeks. Revisit after the 5-session bar if players report "should I be on Iron?" through Suggestions. Applies to Out of scope, FR-3, FR-12 and US-1.

## 9. Red-team notes

**R1 Wrong advice from an unreached map.**
- **Failure:** the unfiltered sweep's top class-EXP maps for every W2-late fighter were W3 maps (101–105), which they cannot reach. A naive engine would send a W2 character to W3.
- **Defence:**
  - FR-2 and TR-4 reachability, plus the world ≤ `currentWorld` cap;
  - a contract test that the current map is always reachable;
  - per-door requirements, no `hasClearedMap` on zero-requirement maps, and the generated boss/quest exclusion list (TR-4, RT-1).

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
  - FR-6 re-runs Toolbox's own `getLab` on a cloned account with `lab` cleared and the character removed, and compares lit nodes and jewels (first draft on `first.json`: 1–3 nodes lost per character; re-measure, RT-2);
  - at most one Lab-leaving option per save (RT-12);
  - it fails closed when the re-run can't run;
  - Arctis cases are handled by the same re-run (`speedrun-rank1.json`).
- **Residual risk:** the re-run is Toolbox's model of the chain. The prism-first ordering and the souped-tube rank can shift when one character leaves. Mitigation: compare lit sets, never positions, and add a W4 golden test once a real W4 save exists.

**R4 Unsafe suggestion.**
- **Failure:** a better map kills the character or starves it before the Expected Return.
- **Defence:**
  - FR-8 runs M3's own Checks on the hypothetical;
  - M5's own unconditional survivability rule (FR-8, TR-8, US-8);
  - M5 can never flip a Verdict (FR-16).

**R5 Patch drift makes confident nonsense.**
- **Failure:** the game patches every 1–2 weeks. The pin was already one version behind on 2026-10-17.
- **Defence:**
  - the identity contract test runs at build and at runtime, catching clone drift (TR-5);
  - rate steps and fighting candidates pause whenever the server build is not in `verifiedBuilds`, which is what catches a formula change (FR-9, US-13);
  - generated facts are re-generated per re-sync (ADR 0007);
  - Stale badges apply.

**R6 Flicker and nagging.**
- **Failure:** a save every ~4 min re-ranks two near-equal maps back and forth, or the same line nags every session.
- **Defence:**
  - the 1.25× margin (D1);
  - fixed index tie-breaks;
  - FR-4 never lets unknown numbers win;
  - Not for me per option (FR-17);
  - one option per character.
- **Residual risk:** an option sitting right at the margin can still blink. If golden-snapshot runs on consecutive saves show that, add a small history-based hysteresis (the engine already receives save history).

**R7 UX confusion in pairs.**
- **Failure:** "Bowman is a better fit" on the Barbarian's row reads as a criticism of the Barbarian, or the two rows disagree.
- **Defence:**
  - both characters carry the pair (FR-14), and each links to the other by local name;
  - the text states what each character gains;
  - a character appears in at most one pair;
  - the Visit Order is unchanged (FR-16), so nothing forces the swap.

**R8 Privacy leak through comparisons.** (See also RT-15.)
- **Failure:** Toolbox embeds names in some fields (stamps' `bestCharacter`, Lab `playerName`), and comparisons name "the other character".
- **Defence:**
  - only indices, classes and levels are copied into `Hypotheticals` (TR-13);
  - names are shown only in the local UI from the Account State;
  - reports carry M10's payload plus the option id and entry ids only (FR-18).

**R9 Contested advice dressed as certain.**
- **Failure:** the W1–W3 pusher (Barbarian vs Squire) and cogs are contested. A Hand-off built on them could look authoritative.
- **Defence:**
  - FR-9 keeps any option decided by a Contested entry off the line;
  - the pusher itself is M2's arithmetic choice, and M5 only protects it (FR-7).

**R10 Too slow for an 11-character account.**
- **Failure:** a full map sweep runs ~0.7 s for 6 characters without the cache. 11 characters on a weaker laptop could stall the Worker.
- **Defence:**
  - the sweep runs inside the parse response on a fixed candidate set (TR-3, TR-10);
  - Toolbox's `shared` cache;
  - the TR-10 budget is checked in CI on a fixed, device-independent candidate set.

## 10. Red-team log

An independent reviewer red-teamed this spec on 2026-10-17 against the Toolbox source at pin `f1e4240`, the research branches and the M1–M4, M10 and M13 specs. Every finding was checked against the code or the sibling spec before a verdict. RT-21 came from that verification pass. Totals: **P0 3, P1 10, P2 6, P3 2.** 19 fixed, 1 fixed in part and deferred (RT-8, needs a ruling), and 1 fixed with one sub-point rejected (RT-20).

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| RT-1 | P0 | Reachability counted maps nobody can reach: `hasClearedMap` is true for every character on maps whose door-0 requirement is 0, door 0 opened door 1, and boss, colosseum and quest maps (Igloo, Efaunt's Tomb, …) were included | fixed | TR-4 reads raw `KillsLeft2Advance` per door, drops `hasClearedMap`, excludes Toolbox's `getFilteredPortals` list (generated); new contract tests; US-2 and US-8 rewritten |
| RT-2 | P0 | The Lab re-run reuses `account.lab.jewels` and only ever sets `active = true`, so lost jewels always read 0, lost nodes are under-counted, and the live state is mutated | fixed | TR-3 calls `getLab` on `structuredClone(account)` with `lab` cleared; US-9 re-baselined, with a jewel-loss test and a no-mutation test |
| RT-3 | P0 | M5 relied on interfaces M3 and M4 do not define (`checkHypothetical`, `goalsServedBy`) and on a second Worker message M1 does not have | fixed | TR-8 drops the M3 hypothetical check for an M5-owned survivability Detector; TR-9 makes M4's two exports a blocking dependency; TR-3 puts the sweep in the parse response and reuses M2's frontier; §7 updated |
| RT-4 | P1 | M4's 50% Class-EXP rule reads M5's sweep, so a late second message could flip Verdicts, and US-2's characters are really M4 `exhausted` cases | fixed | TR-3: sweep before the engine, one response; US-2 and US-12 rewritten as FR-13 Unknown-Purpose suggestions |
| RT-5 | P1 | "Game version newer than the pin" compares numbers M1 says are never compared; the identity check cannot catch a formula change; survivability was still trusted when rates were not | fixed | FR-9 triggers on "server build not in `verifiedBuilds`" and also suppresses fighting candidates; TR-5 states what it catches; US-13 and R5 updated |
| RT-6 | P1 | M3 deliberately does not block an unfixable death, so delegating AFK safety to M3 inverted the intent; survivability units clashed (% vs 0..1) | fixed | FR-8 and TR-8: unconditional M5 rule (≥ 95% or ≥ baseline); all survivability in % |
| RT-7 | P1 | Shrinking the candidate set when over budget made output device-dependent, breaking FR-19; budget unmeasured on a late save | fixed | FR-1 and TR-10: fixed candidate subset; budget confirmed on `highend.json` in the first build PR; changes are reviewed, never runtime |
| RT-8 | P1 | Piling on and never releasing: every XP-only character gets the same Move, a holder is never freed, a half-followed Hand-off strands the holder, and position ignores how far off the Milestone is | fixed in part, deferred | FR-11(a) accepts a partner already on the activity; FR-3 counts only M4-worthwhile Goals. Marginal-contribution counting and one-Move-per-destination need a product ruling (Needs Yasser) |
| RT-9 | P1 | FR-4 step 2 compared ETAs of different Goals, and it was unclear whether a baseline win or an in-margin gain decides | fixed | Step 2 only on a Goal both sides serve (D1's "same Goal"); "first step with a winner decides, for either side"; only worthwhile Goals count |
| RT-10 | P1 | Role fit for fighting compared per-character levelling, one owner could pair with many rows, the owner's own Goals were not checked, and the displaced character had no destination | fixed | FR-12: skills only (fighting Roles out of scope), `roleOwnersOf`, FR-4 check on the owner, one pair per owner, destination rule |
| RT-11 | P1 | Cooking, Divinity and Spelunking fell through to `none`, an empty baseline that any Goal beats | fixed | `ActivityRef` kind `other`; §6 row; M4 `not-covered` leads to silence |
| RT-12 | P1 | Lab removals were checked one at a time; following two "safe" moves could still break the chain | fixed | FR-6: at most one Lab-leaving option per save; US-9 case |
| RT-13 | P1 | Toolbox's door data has no door into Poopy Sewers, Steep Sheep Ledge and others, so the "if reachable" branches were settled by missing data, and the stories had two outcomes | fixed | TR-4 states the fail-closed behaviour; US-2, US-6 and US-8 use derived states with a fixed reachable set, one outcome each |
| RT-14 | P2 | M10 renders the line in Focus with Not for me only, uses a different dismissal key, and its type lacks M5's fields | fixed | FR-14, FR-17, TR-2 and TR-11 follow M10 FR-21 and its key; pair dismissal and index-shift behaviour stated; M10 type change listed in §7 |
| RT-15 | P2 | Report this sent more than the ADR 0008 / M1 TR-22 allow-list (partner's class and level, map indices), and it is posted publicly before M13 | fixed | FR-18 sends M10's payload plus option id and entry ids only; allow-list amendment listed as an M1 dependency |
| RT-16 | P2 | The test Knowledge Base drops M4's real card and Death Note Contributions, which can change US-2 and US-12 | fixed | §4 adds a second golden run on M4's real Contribution table |
| RT-17 | P2 | FR-13 ignored M4's Unknown reason, and its Role fallback skipped reachability and safety | fixed | FR-13 branches on the reason (silent for `not-covered`, `cannot-tell`); fallback passes FR-2 and FR-6 to FR-9 |
| RT-18 | P2 | No "add to Lab" hypothetical, so a Lab candidate's Goals cannot be known | fixed | Lab removed as a Move destination for the MVP (Scope, FR-1, §6) |
| RT-19 | P3 | FR-7's Hand-off clause can never apply (portal kills are per character) | fixed | Clause deleted; US-7 rewritten |
| RT-20 | P3 | Class-and-level naming is ambiguous for duplicates; every entry is Stale on day one; Stale ranking within a row undefined | fixed (one sub-point rejected) | Partner rendered by local name via `partnerIndex`; §6 rule for fresh vs Stale candidates. Rejected: "Stale on day one" is how Stale is defined, and re-verification belongs to M11 |
| RT-21 | P2 | (verification pass) The test Knowledge Base stubbed the W2-late pusher as the Wizard Lv 56, while M2's own rule names the Barbarian Lv 60 | fixed | §4 stub follows M2's fixture result |

Verified 2026-10-17 against game v1.23 (Toolbox pins `f1e4240`, game 2.3.531, for the measured numbers, and `6827d3f`, game 2.3.540, for the dossiers). Stale against any later patch.
