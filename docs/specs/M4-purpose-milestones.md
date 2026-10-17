# M4 Purpose & Milestones

Spec for [#32](https://github.com/YassSoliman/idleon-forge/issues/32), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **ready**. Section 8 decisions ruled by Yasser on 2026-10-17; red-team pass logged in section 10. Terms follow [GLOSSARY.md](../../GLOSSARY.md).

**Inputs this spec is built from:**
- Now screen behaviour ([#10](https://github.com/YassSoliman/idleon-forge/issues/10)) and the prototype resolution that introduced Purpose ([#12](https://github.com/YassSoliman/idleon-forge/issues/12)).
- Knowledge Base shape ([#11](https://github.com/YassSoliman/idleon-forge/issues/11), [ADR 0007](../adr/0007-generated-facts-authored-judgment.md)), architecture ([#14](https://github.com/YassSoliman/idleon-forge/issues/14), [ADR 0006](../adr/0006-client-only-spa-parsing-in-a-worker.md)) and the MVP cut ([#13](https://github.com/YassSoliman/idleon-forge/issues/13)).
- Toolbox-number rules ([ADR 0005](../adr/0005-toolbox-numbers-not-our-formulas.md)) and what Toolbox can compute ([#16](https://github.com/YassSoliman/idleon-forge/issues/16), `research/hypothetical-math`).
- The Leverage model ([#26](https://github.com/YassSoliman/idleon-forge/issues/26), `research/leverage-model`), the priority verification overlay ([#27](https://github.com/YassSoliman/idleon-forge/issues/27), `research/priority-verification`, which wins on conflicts), and the dossiers on `research/{account-wide,cards-obols,w3-systems,skills}`.

Verified against game v1.23 (Toolbox gameVer 2.3.540) on 2026-10-17. The parser pin for every golden value is the vendored Toolbox commit in `packages/toolbox-parsers/UPSTREAM` (currently `6c37e3d`). Research citations to `6827d3f2` and the `f1e4240` hypothetical-math run are evidence, not pins.

## 1. Purpose

When a player looks at a character, M4 answers "what is this character doing for me right now, and when should I stop?". From the Account State alone, it works out the Goals the character's current activity is advancing (its Purpose). Each Goal comes with its progress and next Milestone, for example "Poop kills 2,995 → 10,000 for Dirty Money, about 4.9 h". Fighting Goals get an ETA from Toolbox's kills per hour; skilling Goals get a plain yes or no. When the character is about to cross a Milestone and the next one is far off, M4 suggests stopping there. When the activity advances nothing worthwhile, M4 says so ("What is this character for?") so the Verdict can be Unknown instead of a false Ready. The player never types a Purpose in. A wrong Purpose is fixed through **Report this**.

## 2. Scope / Out of scope

**In scope**
- Deriving each character's **activity** from the Account State: its AFK Target (type, map, target monster or resource).
- Matching that activity against **Contribution** entries to build the character's **Purpose**: a ranked list of Goal instances, each with current progress, the reached and next **Milestone**, and an ETA or a yes/no.
- The **Goal families** shipped in the MVP (section 5, TR-4):
  - fighting: pusher's next portal (shown from M2's push Goal), Upgrade Vault kill rows, Death Note skulls, card levels, Class EXP;
  - skilling: skill-level doors (Mining 10/25/40/60, Fishing 15/30), tool-chain ingredient, stamp-material shortfall, first card copy, Role skill.
  - W4 entry: Lab chain membership (yes/no).
- **ETAs** for fighting Goals: arithmetic on Toolbox `finalKillsPerHour` (and EXP per kill, base drop chance), summed over every character feeding the same account-wide counter.
- The **worthwhile test**, which decides whether a Purpose counts toward a Ready Verdict.
- The **stop-here suggestion** at a Milestone.
- **Milestone crossings** since the Play Session started ("Reached 10,000 Poop kills"), from save history.
- The Knowledge Base entries M4 needs: generated Goal ladders and authored Contributions, plus their Detectors and fixture tests.

**Out of scope**
- **Skilling rates and skilling ETAs.** Toolbox computes no resources or skill EXP per hour ([#16](https://github.com/YassSoliman/idleon-forge/issues/16)), and #11 item 8 rules skilling yes/no only. A rate from save history (Δ EXP between claims) is a possible later addition, not MVP.
- **Choosing a better activity or character.** That is M5 Higher-leverage options. M4 only says the current activity's Purpose is weak, exhausted or absent, hands M5 the reason, and exposes the pure lookups M5 needs (TR-3).
- **AFK safety** (food, caps, run-outs): M3. M4 never produces a Verdict blocker.
- **Parallel Slot Purposes** (cauldron, cog seat, traps, worship, printer). The engine contract supports them (`ActivityRef.kind = 'parallel'`), but the MVP ships no such Contributions. Empty slots are M6's, capping slots are M3's.
- **Buying things** (a Vault row whose kill steps pay nothing until it has a level, stamp cap raises): M7 Spend Plan. **Equipping cards and sets:** M8 Collections.
- **Stage, pusher choice, Roles and Priority List contents:** M2. M4 reads them.
- **Rendering:** M10. M4 outputs data and text templates; M10 lays them out.
- **Quest-item drops as Goals** (e.g. 100 Kebab Sticks for Speccius). Deferred to an Acquisition-driven follow-up; listed in Red-team note 10.
- Talent-preset hypotheticals (lossy per #16).

## 3. Functional requirements

- **FR-1 Activity.** For each character, M4 derives exactly one `ActivityRef` from `afkType`, `mapIndex` and the saved `targetMonster`. `afkType` of `Nothing` or `Paying_Respect`, or no target, yields `kind: 'none'`. A field that `isKnown(state, path)` (M1 TR-11) reports as unknown yields `cannot-tell`, never a guessed activity.
- **FR-2 Contribution matching.** M4 evaluates every active Contribution entry whose `appliesTo` (Stage, class, level) holds and whose Detector matches the activity. Each match yields at most one Goal instance per (Goal, character). Gates that need M2's output (pusher, per-character Roles) are applied by M4's engine layer around the Detector call, because M11's `DetectorContext` carries no Stage result (TR-5).
- **FR-3 Progress.** Each Goal instance shows the counter's saved value, its projected value (FR-9), the last reached Milestone, the next Milestone, and the one after it. The values are numbers from the Account State or Toolbox, never typed in.
- **FR-4 Fighting ETA.** For a fighting Goal, ETA = (next Milestone − projected value) ÷ rate. The rate is the sum of Toolbox `finalKillsPerHour` over every character whose activity feeds the same counter. Per-character counters (portal kills) use only that character's rate. ETA is shown rounded: minutes under 1 h, hours to 1 decimal place under 10 h, whole hours under 72 h, then days; capped at "30+ days". Internally the ETA is seconds (`etaSeconds`, M10's unit).
- **FR-5 Zero rate.** If the rate is 0 (the character cannot kill the target, or survivability is 0), the Goal shows "not progressing", carries no ETA, and does not count as worthwhile.
- **FR-6 Skilling yes/no.** A skilling Goal shows progress (e.g. Mining level 20, EXP 8.9k of 21.8k) and the next gate, but never an ETA or a per-hour number.
- **FR-7 Worthwhile test.** A Goal instance is worthwhile when all of these hold: its entry status is `active` or `contested` (not `retired`); its Contribution's own `worthwhile` rule passes (TR-4); for a fighting Goal, the rate is above 0 and the ETA to the next Milestone is within the **effective horizon**. The effective horizon is the entry's `horizonHours` (default 24 h when the entry sets none), raised to the Expected Return when that is longer (D1). Entries marked "none" in TR-4 have no horizon test. A character's Purpose is **serving** when at least one Goal instance is worthwhile.
- **FR-8 Purpose status.** Each character gets exactly one status:
  - `serving`: at least one worthwhile Goal;
  - `exhausted`: Goals matched, none worthwhile;
  - `none`: the activity matched no Contribution, and its AFK type is covered;
  - `not-covered`: no active Contribution in the compiled Knowledge Base names this AFK type in `activity.afkType` ("Not covered yet: Cooking"). Coverage is per AFK type, computed once per Knowledge Base build;
  - `no-activity`: FR-1 gave `kind: 'none'`;
  - `cannot-tell`: no Goal instance remains *and* at least one was dropped because a field it reads is unknown (`isKnown` false, or a section in `diagnostics.failedSections`), per FR-18.
  Because `classes.contribution.exp` matches every FIGHTING activity, a fighting character is never `none`: an unmatched fighting target (boss, crystal mob, quest-item farm) ends `exhausted` with the reason "only Class EXP here, and it is under half your best map", or `serving` if the D3 test passes.
  Only `serving` lets the Purpose side of the Verdict be Ready. Every other status makes it Unknown. M4 never produces Fix before you leave; M3's safety Checks can still make the Verdict Fix (for `no-activity`, M3 FR-12 always does).
- **FR-9 Projection.** A character's AFK kills reach the save only when that character is next claimed. Only kill counters are projected (Vault kill rows, Death Note); card copies (random drops) and Class EXP are never projected, and the push portal uses M2's numbers unchanged (TR-4). For a projected counter, projected = saved + Σ over feeders *i* of rate_i × min(away_i, cap_i), where away_i = `now` − that feeder's last save (`lastCloudSave` − `secondsSinceLastSave`, so it advances with `now` like M3's countdowns), and cap_i is the feeder's AFK-time cap when the Account State exposes one (e.g. M3's Unending Energy 10 h fact), otherwise uncapped. Progress shows a leading "~"; the saved value is available on tap. The projection is clamped at the next Milestone: when it would pass it, progress shows "~reached, claim to confirm", the ETA is `{ kind: 'none', reason: 'reached-unconfirmed' }`, and the Goal keeps the worthwhile result it had at the saved value. A projected crossing never changes `status`, never advances "next", and never emits a "Reached" line (FR-12).
- **FR-10 Ranking within a Purpose.** Goal instances are ordered by M2's `compareGoals` (M2 TR-14) over the Stage's `ResolvedPriorityList`, with each instance as a `Rankable` (`milestoneEtaSeconds` = its ETA in seconds, null for yes/no; `goalsServed` = the number of Goal instances in this Purpose). That one comparator puts Priority List position first, Stale below fresh at the same position, and closest Milestone before entry id, so the Purpose order matches the rest of the Now screen. There are no numeric weights.
- **FR-11 Display budget.** M4 marks the top-ranked Goal instance as the row headline and the top 3 as the Focus card's Purpose block. The rest go behind "show more". The Purpose block is separate from the "at most 3 Goals per character" Next Action cap (#10 item 5): Purpose lines describe what the character already does and need no action, so they never count against it. The stop-here suggestion (FR-13) is an action and counts as one of the 3 (D4). TR-3 gives the mapping to M10's `PurposeLine` and `Goal`.
- **FR-12 Milestone reached.** When a Goal's *saved* counter is at or past a Milestone that it was below in the first save of the current Play Session (M1 `SaveHistory.sessionStart`, TR-15's 15-minute rule), M4 emits one `MilestoneCrossing` ("Reached 10,000 Poop kills: Dirty Money steps up"). It shows on every save of that Play Session and is gone from the first save of the next one. With no session-start save (first save ever), there are no crossings.
- **FR-13 Stop-here suggestion.** M4 emits a stop-here suggestion for a character when both hold:
  - (a) its top worthwhile fighting Goal will reach its next Milestone within the Expected Return (by projection, FR-9), or reached one this Play Session (FR-12);
  - (b) after that Milestone, no Goal instance of the activity stays worthwhile, because the following Milestone's ETA is beyond the effective horizon (FR-7, D1).
  The text: "Poop kills reach 10,000 in ~4.9 h. The next step, 100,000, is ~63 h away. Consider stopping here." It names the Goal, both Milestones and both ETAs. It links to M5's option when M5 has one. It never changes the Verdict: a Purpose that runs out before the Expected Return keeps a Ready Verdict, and the advice lives only in this line (D2). It counts as one of the 3 Next Actions (D4). It supports Skip today and Not for me (M10), keyed per Milestone (TR-8). It is recomputed on every save while (a) and (b) hold; there is no "once only" state in M4.
- **FR-14 No-Purpose prompt.** For `exhausted` and `none`, M4 emits the prompt "What is this character for?" with the reason (e.g. "Poop card is maxed and Class EXP here is under half your best map"). M5 supplies the one suggestion. Until M5 ships, M4 falls back to the character's *active* M2 Role that owns an AFK Target (e.g. "Barbarians usually fish"); Roles that own only a Parallel Slot (Construction, Worship) or are dormant are never used, and with no such Role there is no suggestion. For `no-activity`, M4 emits no prompt: M3 FR-12's blocker "Send {class} to an AFK Target" is the one line, and M4 only hands M3 the same suggested target. For `not-covered`, M4 emits "Not covered yet: <AFK type>" and no suggestion.
- **FR-15 Contested and Stale.** A Contribution whose *order* is contested still counts as worthwhile, shows the "sources disagree" badge, and is never the row headline when an uncontested worthwhile Goal exists. A Contribution whose *usefulness itself* is contested (`status: contested` with `contestedOn: usefulness`) is shown but never makes a Purpose `serving`. Stale entries show the Stale badge and rank below fresh ones (FR-10).
- **FR-16 Provenance.** Every Goal instance, stop-here and prompt records the Knowledge Base entry ids, the Account State field paths and the Toolbox functions it used (#14 item 4). Report this sends M13's `ReportContext` (M13 FR-9, FR-10): the output kind, the rendered text, entry and Detector ids, field paths, Stale and Contested flags, plus the slot values only when "Attach the numbers" stays ticked (M13 D3). M4's template slots are therefore restricted to numbers, Milestones, ETAs and game names (monster, item, map, skill, class); no template has a character-name slot, and names are joined only by the UI (TR-9).
- **FR-17 Determinism.** Same Account State, history, Knowledge Base, Expected Return and `now` give byte-identical output.
- **FR-18 Fail closed.** If a Detector returns M11's unknown result (`advances: 'unknown'` or `value: null` with a reason), throws, or reads a field that is `null` or `isKnown`-false, that Goal instance is dropped, a diagnostic is recorded, and the character's status becomes `cannot-tell` if no other Goal remains. A field renamed by a patch reaches M4 as `null` (M1 TR-11 returns null, not an error), so this rule, not M1's contract tests, is the patch-day defence. M4 never shows a guessed number.

## 4. User stories

Fixtures: the **W2-late account** (5 characters, highest Lv 60, Stage W2-late) and the **W3-early account** (6 characters, highest Lv 85, Stage W3-early), parsed 2026-10-17 at the parser pin. Characters are named by account, class and level only. Rates marked † come from `research/hypothetical-math` (run at `f1e4240`). They are pre-registered expectations: the first engine run at the parser pin must land within ±5% of each, and a larger gap is investigated (pin drift or a bug) before any golden is recorded, never silently re-recorded. Expected Return is the default 8 h unless stated.

**US-1 A fighter's Purpose with an ETA.** As a player in a Play Session, I want to see what my AFK fighter is working toward and how long it will take, so that I know it is worth leaving there.
- **Given** the W2-late account, Barbarian Lv 60, AFK fighting Poop on Poopy Sewers (map 8), with account Poop kills 2,995 (`upgradeVault.vaultTotalKills[3]`), Dirty Money at 25/25, and 1,430 final kills/h†, with no other character on map 8
- **When** the engine runs
- **Then** the row headline is "Poop kills ~2,995 → 10,000 · Dirty Money · ~4.9 h". The Purpose is `serving`, and the Goal cites the Upgrade Vault entry and its Source. ETA = (10,000 − 2,995) ÷ 1,430 ≈ 4.9 h at the saved value; the FR-9 projection shortens it by the hours since the Barbarian's last save (0 in the fixture, where it is the last-played character).

**US-2 Stop here at the Milestone.** As a player in a Play Session, I want to be told when my character is about to finish the useful part of its grind, so that I move it before it wastes the rest of the AFK Stretch.
- **Given** US-1's state and an Expected Return of 8 h
- **When** the engine runs
- **Then** a stop-here suggestion shows: "Poop kills reach 10,000 in ~4.9 h. The next step, 100,000, is ~63 h away. Consider stopping here." 63 h = 90,000 ÷ 1,430, which is beyond the 24 h default horizon (D1). The Verdict is not changed by it (D2).
- **Given** the same state with an Expected Return of 2 h
- **Then** no stop-here shows, because 4.9 h is beyond the return.

**US-3 Goals that don't count.** As a player in a Play Session, I want ActiveOn to ignore slow or not-yet-useful Goals, so that "Ready" means the character is doing something that pays.
- **Given** the W2-late Barbarian Lv 60 on Poop, with the Poop card at 1 copy (level 1, next level at more than 11 copies; base chance 1 in 16,667)
- **When** the engine runs
- **Then** the card Goal is listed under "show more" as "Poop card 1 → 11 copies · about 117 h on average at the base drop rate" (perTier 10, level 2 at more than 10 copies; 10 more copies × 16,667 ÷ 1,430 ≈ 117 h), and is not worthwhile, because 117 h > 24 h. There is **no Death Note Goal**, because Death Note Contributions apply from W3-early. Nor is there a worthwhile portal Goal: the Barbarian is M2's W2-late pusher, but map 8 is not the frontier map (M2 TR-10; its push Goal is a quest step), so its portal on map 8 (2,814 of 20,000 kills) shows only under "show more" (D5).
- **Given** the W3-early account, where the Death Note building is Lv 0, and the Shaman Lv 54 fighting Sand Castle on Shifty Sandbox (account Death Note kills ~12.8k on that mob)
- **Then** a Death Note line shows "~12.8k → 25k (banked: the Death Note building is Lv 0)", and it is not worthwhile, because multikill pays nothing until the building is Lv 1 (W3 dossier, H).

**US-4 Skilling on purpose (the Copper lesson).** As a player in a Play Session, I want a skiller doing something useful to read as Ready, without ActiveOn judging it on EXP, so that I'm not told to swap Copper for Iron when I mine Copper on purpose.
- **Given** the W2-late account, Squire Lv 43, AFK mining Copper on Tunnels Entrance, Mining Lv 20 (EXP 8.9k of 21.8k)
- **When** the engine runs
- **Then** the headline is "Mining 20 → 25 opens The Ol' Straightaway". It is yes/no with no ETA and no per-hour number. The Purpose is `serving` (the next door is not reached). A "Copper: stamp material" line shows only if an owned stamp's next cap raise is short of Copper. In this fixture Mana Stamp needs 68 against 1,294 held, so it is omitted.
- **Given** the W3-early account, Squire Lv 51, mining Gold on Freefall Caverns at Mining Lv 29
- **Then** the headline is "Mining 29 → 40 opens Echoing Egress", and the Purpose is `serving`.
- **Given** the W3-early account, Barbarian Lv 56, fishing on Salty Shores at Fishing Lv 22
- **Then** the Purpose is `serving` through the Role Contribution (M2 gives this Barbarian the active Fishing Role, M2 S5) and the next Fishing door (Fishing 30, Deepwater Docks).

**US-5 What is this character for?** As a player in a Play Session, I want to be told plainly when a character's activity serves nothing, so that I don't leave it idling for 8 hours.
- **Given** the W2-late account, Shaman Lv 44, fighting Slime on Jungle Perimeter (map 16). Its first door there is open (73 of 60); the second door (3,000) is not, but the Shaman is not the pusher, so it is display-only (D5). The Slime card is at 4 stars, which is level 5, the max before Rift 45. Map 16 is not a Vault kill map, and Death Note Goals don't apply at W2-late.
- **When** the engine runs
- **Then** the card Goal shows "complete". The only remaining candidate is Class EXP, and it fails D3: M5's sweep puts its best reachable map at about 7.8× (Poopy Sewers) or 15.5× (The Ring) this map's class EXP/h (M5 US-2), so this map is under 13% of the best. The Purpose is `exhausted`, the Verdict is Unknown, and "What is this character for?" shows with the reason line and M5's (or the active Role's) one suggestion.
- **Given** the W2-late account, Bowman Lv 54, fighting Green Mushroom on Spore Meadows (map 1). It has 3 copies (perTier 5, so level 1; level 2 at more than 5 copies), the portal is open, and the map is not a Vault map.
- **Then** the card Goal is not worthwhile (it owns a copy, and the story's pinned test card list for the Bowman, standing in for M8's, does not name Green Mushroom), Class EXP fails D3 (the best reachable map gives about 214× this map's class EXP/h, M5 US-2), and the Purpose is `exhausted`.

**US-6 The pusher's portal.** As a player in a Play Session, I want my pusher's next portal to be its headline Goal, so that the account's top Leverage (Priority List position 2) is visible on the character doing it.
- **Given** the W3-early account, where M2 picks the Squire Lv 85 as pusher (highest final kills/h on the frontier map, M2 TR-10). The Squire is fighting on Thermonuclear Climb with 19 of 15,000 portal kills.
- **When** the engine runs
- **Then** the headline is "Portal: 19 → 15,000 kills · ~14 h", carrying M2's push Goal entry id and M2's ETA (14,981 ÷ 1,065 kills/h, M2 S3) unchanged, so the row and M2's Next Action never show two different portal ETAs. The card line "Thermostat card: first copy (5× drop chance while unowned)" shows below it. The second Squire (Lv 51) gets no portal Goal.

**US-7 Reached since last time.** As a player in a Play Session, I want to see when a Goal stepped up while I was away, so that I know the AFK Stretch paid off.
- **Given** a synthetic history built from the W2-late fixture: a session-start save with account Poop kills at 9,800, then saves 4 minutes apart in the same Play Session, the second of which has 10,400
- **When** the engine runs on the second save and on every later save of that Play Session
- **Then** one line shows "Reached 10,000 Poop kills: Dirty Money steps up", and the Goal's next Milestone is 100,000.
- **Given** a later save more than 15 minutes after the previous one (a new Play Session)
- **Then** the line is gone.
- **Given** a single save whose *projected* Poop kills pass 10,000 while the saved value is 9,800
- **Then** no "Reached" line shows, progress reads "~reached, claim to confirm", and the next Milestone stays 10,000 (FR-9).

**US-8 Not covered yet.** As a player in a Play Session, I want ActiveOn to admit when it has no knowledge of an activity, so that I don't read "What is this character for?" as a judgment.
- **Given** a public fixture with a character AFK on Cooking (a W4 AFK type no MVP Contribution names), and the real MVP Knowledge Base
- **When** the engine runs
- **Then** the status is `not-covered` with "Not covered yet: Cooking", the Verdict is Unknown (unless M3 makes it Fix), and no suggestion shows.
- **Given** the same fixture with that character switched to Catching
- **Then** the status is not `not-covered`, because the card, stamp-material and Role Contributions name CATCHING.

**US-9 Broken data never gives a Purpose.** As a player in a Play Session, I want no Purpose when the save can't be read, so that I never act on invented numbers.
- **Given** a parse that throws `EmptyAccountError`, or one whose `diagnostics.failedSections` includes `upgradeVault`, or one where the raw Vault key is missing so `isKnown(state, 'account.vault.killTotals')` is false
- **When** the engine runs
- **Then** for the empty account, no Purpose is produced (M1 shows "Can't read your save"). For the failed or unknown section, Vault Goals are dropped, characters left with no Goal become `cannot-tell`, characters with another Goal keep their status, and a diagnostic is recorded. `warnings` (display-only text) are never read.

## 5. Technical requirements

**TR-1 Package boundary.** M4 lives in `packages/engine/src/purpose/` as pure functions, with no I/O, no clock read and no randomness. It imports only types from `@idleon-forge/account-state`, compiled entries and the Detector registry from `@idleon-forge/knowledge`, and `compareGoals` from M2. Detectors live where M11 puts them: `packages/knowledge/detectors/<system>/`, with ids `<system>/<name>` (M11 `DetectorId`), e.g. `upgrade-vault/kill-row`. M4 never imports `toolbox-parsers`: every Toolbox number reaches it through the Account State, including the hypothetical layer.

**TR-2 Inputs it needs from the Account State (M1).** The slice-1 `CharacterState` grows these fields through M1's TR-11 growth process. Every field is `null` when the save lacks it (M1 TR-11), and M4's Detectors read only these fields, never raw Toolbox output.

```ts
interface CharacterState {
  // existing: index, name, class, level, afkType, afkTarget, currentMap, foodStacks, secondsSinceLastSave
  classIndex: number;
  mapIndex: number | null;
  targetMonster: string | null;            // saved raw target; never re-derived from the map (#16 caveat 4)
  classExp: { level: number; exp: number; expReq: number } | null;
  skills: Record<SkillKey, { level: number; exp: number; expReq: number }> | null;
  mapKills: number[] | null;               // Toolbox kills[mapIndex], per character, lifetime
  nextPortal: { door: number; current: number; goal: number } | null; // Toolbox nextPortal: the first unopened door
  fighting: FightingRate | null;           // identity call on the current map; null unless afkType === 'FIGHTING'
  tools: string[] | null;                  // raw item names, 'Blank' removed
}
interface FightingRate {
  finalKillsPerHour: number;  // Toolbox getMaxDamage().finalKillsPerHour
  expPerKill: number;         // monsters[target].ExpGiven × getClassExpMulti(clone)
  survivability: number;
}
interface AccountState {
  // existing …
  deathNote: Record<string, { mobs: { rawName: string; kills: number }[] }> | null; // look up by rawName === target
  deathNoteBuildingLevel: number | null;   // towers Death_Note level
  vault: { killTotals: Record<number, number>; rows: { name: string; level: number; maxLevel: number }[] } | null;
                                           // killTotals keyed by map index through the generated map → slot table
                                           // (`upgrade-vault.fact.kill-slots`); raw VaultKillzTotal slots are never read by index
  cards: Record<string, { amount: number; stars: number; nextLevelReq: number; perTier: number }> | null;
  stamps: { rawName: string; itemReq: string; materialCost: number; ownedMats: number }[] | null; // bestCharacter stripped (privacy)
  lab: { connected: boolean[] } | null;    // per character index; null below W4 or when unread
}
```

`bestExpPerHour` is not an Account State field. It comes from M5's reachability sweep (TR-6).

**TR-3 Engine interface.**

```ts
type ActivityRef =
  | { kind: 'afk'; afkType: string; mapIndex: number | null; target: string | null; skill: SkillKey | null }
  | { kind: 'parallel'; slot: 'cauldron' | 'cog' | 'traps' | 'worship' | 'printer'; detail: string } // no MVP entries
  | { kind: 'none' };

type Eta =
  | { kind: 'time'; seconds: number; ratePerHour: number; feeders: number[]; bound: 'estimate' | 'mean-at-base-rate' }
  | { kind: 'yesno' }
  | { kind: 'none'; reason: 'zero-rate' | 'beyond-cap' | 'complete' | 'reached-unconfirmed' };

interface GoalInstance {
  goalId: string;              // generated Goal entry, e.g. 'upgrade-vault.goal.kill-row-map-8'
  contributionId: string;      // concrete Contribution, e.g. 'upgrade-vault.contribution.kill-row-map-8' (TR-4 expansion)
  characterIndex: number;
  scope: 'character' | 'account';
  unit: 'kills' | 'copies' | 'level' | 'items' | 'yesno';
  saved: number; projected: number;
  reached: number | null; next: number | null; following: number | null;
  eta: Eta; etaFollowing: Eta | null;
  worthwhile: boolean; notWorthwhileReason?: 'horizon' | 'zero-rate' | 'rule' | 'usefulness-contested' | 'complete';
  badges: ('contested' | 'stale' | 'parser-behind')[];
  text: RenderedTemplate;      // headline and detail, slots filled; M10 renders
  provenance: Provenance;      // M10 shape { entryIds, fields }
}

type PurposeStatus = 'serving' | 'exhausted' | 'none' | 'not-covered' | 'no-activity' | 'cannot-tell';

interface Purpose {
  characterIndex: number;
  activity: ActivityRef;
  status: PurposeStatus;
  goals: GoalInstance[];       // all, ranked (FR-10)
  headline: GoalInstance | null;
  stopHere: StopHere | null;
  prompt: { kind: 'what-for' | 'not-covered'; reason: RenderedTemplate; afkType?: string } | null;
  suggestedTarget: ActivityRef | null; // for M3 FR-12 when status is 'no-activity', and for the FR-14 fallback
  reached: MilestoneCrossing[];
}
interface StopHere { contributionId: string; goalId: string; at: number; etaAt: Eta; following: number; etaFollowing: Eta; provenance: Provenance }
interface MilestoneCrossing { goalId: string; milestone: number; provenance: Provenance }

/** What M4 reads from M2 (M2 FR-7, FR-11, FR-12, TR-9, TR-10, TR-14). Plain data, structured-cloneable. */
interface MetaPathInput {
  stage: StageResult;                         // M2 TR-4
  list: ResolvedPriorityList;                 // for compareGoals
  pusher: { index: number; frontierMap: number } | null;
  pushGoal: { entryId: string; current: number; goal: number; etaSeconds: number | null } | null;
  roles: Record<number, { role: string; afkType: string | null; active: boolean }[]>; // per character index
}

function derivePurposes(input: {
  state: AccountState;
  history: { sessionStart: AccountState | null }; // M1 SaveHistory.sessionStart, resolved by the caller; null on the first save
  kb: CompiledKnowledge;
  meta: MetaPathInput;
  bestExpPerHour: (number | null)[];          // M5 sweep, by character index (TR-6)
  expectedReturnHours: number; now: number;
}): Purpose[];

/** M5's lookups (M5 TR-9). Pure; same inputs as derivePurposes plus injected hypothetical rates. */
function goalsServedBy(activity: ActivityRef, contributors: number[], rates: Record<number, FightingRate | null>, input: DeriveInput): GoalInstance[];
function activitiesServing(goalId: string, kb: CompiledKnowledge): ActivityRef[]; // inverse index over Contributions
type DeriveInput = Parameters<typeof derivePurposes>[0];
// purposeOf(i) is derivePurposes(input)[i]; M5 reads it from the same EngineResult.
```

The Verdict composer (M3/M10) reads `status`: `serving` is required for Ready, and any other status gives Unknown unless an M3 blocker gives Fix. **Mapping to M10's `CharacterResult` (M10 TR-2):** each `GoalInstance` becomes a `PurposeLine` (`goalId`, `title`, `worthwhile`, `sources`, `provenance`, and `milestone = { unit, current: projected, next, etaSeconds, stopHere }`, with `etaSeconds` null for yes/no). `stopHere` is true on the line whose Goal the `StopHere` names. The `StopHere` is also emitted as one `Goal` with one `NextAction` (D4), whose `key` is `${contributionId}@${subject}#${milestone}`. Status maps to `Verdict.unknownReason`: `exhausted`/`none`/`no-activity` → `'no-purpose'`, `cannot-tell` → `'cannot-tell'`, `not-covered` → `'not-covered'`.

**TR-4 Knowledge Base entries.** These use M11's schema (TR-4 there, built on #11's shape): ids `<system>.<type>.<slug>`, strict objects, `detector: { id, params }`, `values` for authored constants, and `eta: 'kills-per-hour' | 'none'` on every Contribution (`kills-per-hour` only with `afkType: FIGHTING`). M4's judgment maps onto existing fields: the worthwhile thresholds go in `detector.params` (validated by each Detector's params schema), the horizon in `values.horizonHours` (absent = the 24 h default, D1). M4 needs three additions to M11's `ContributionEntry`, listed in section 7: `goalFamily` (below), an optional `stopHere: Template`, and an optional `contestedOn: 'order' | 'usefulness'` alongside `contested` (FR-15).

*Goal entries (generated, ADR 0007).* M11 generators write them at every parser re-sync from Toolbox game data, with the Toolbox pin as their tier-1 Source. Five of the families need generators M11's MVP table does not yet list (section 7).

| Goal family | Ladder | Generated from | Instances | Generator |
|---|---|---|---|---|
| `portals.goal.map-<i>` | one step per door, in door order (maps 7, 11, 13, 14, 16, 24 have two) | `shared-data#mapPortals` (Toolbox `portals.ts` `getMapDoorRequirements`) | every fighting map W1–W4 | M11 `portals` (exists) |
| `upgrade-vault.goal.kill-row-map-<i>` | powers of 10 from 10 | the `VaultKillzTotal` map list (8, 13, 14, 24, 101), the 5 scaled rows, and the map → slot table | 5 | **new** `vault-kills` |
| `death-note.goal.<mob>` | 25k / 100k / 250k / 500k / 1M / 5M / 100M | `DEATH_NOTE_RANKS`, `deathNote` mob list | 40 (W1–W3) + W4 page | M11 `deathnote` (exists) |
| `cards.goal.<card>` | copies > perTier × 1, 4, 9, 25, i.e. steps at perTier × k + 1 (Lv 6+ only after Rift 45) | `cards.json` perTier; `monsterDrops.json` base chance | every monster and resource card W1–W4 | **new** `card-levels` |
| `classes.goal.level` | each level, plus labelled level gates (tab 4 at 90, personal obol slots, Post Office 50); account gates such as Obol Altar (highest character Lv 30) are excluded | `expReq` from the save; gate list from talents and obol data | 1 ladder | **new** `class-gates` |
| `skills.goal.door-<skill>` | Mining 10 / 25 / 40 / 60; Fishing 15 / 30. Doors whose destination is beyond W4 or an unused map (Freefall's 81, Echoing Egress's 50) are filtered out | `mapPortals` on skilling maps, filtered by destination world | Mining, Fishing | **new** `skill-doors` |
| `skills.goal.tool-<skill>` | next tool tier the skill level allows | `items.json` tools (`lvReqToEquip`), anvil recipes | per gathering skill | **new** `tools` |

Choppin and Catching have no level doors (skills dossier, cross-cutting fact 2), so they have no door Goal.

*Contribution entries (authored judgment).* An authored Contribution may name a generated Goal family instead of one Goal: `goalFamily: <system>.goal.<prefix>` in place of `goal`. `kb compile` expands it into one concrete Contribution per generated Goal in that family (`<system>.contribution.<slug>-<goal-slug>`), each with the same text, why, Sources and params, so the runtime and M11's checks only ever see concrete `goal` ids (M11: "one activity serving several Goals = several Contributions"). The Detector picks the instance's data from params plus the Goal id.

```yaml
# packages/knowledge/systems/upgrade-vault.yaml
- id: upgrade-vault.contribution.kill-row
  type: contribution
  system: upgrade-vault
  title: Vault kill row
  activity: { afkType: FIGHTING }
  goalFamily: upgrade-vault.goal.kill-row       # expands to kill-row-map-8, -13, -14, -24, -101
  detector: { id: upgrade-vault/kill-row, params: { rowLevelMin: 1 } }  # a row at Lv 0 pays nothing per step; M7 suggests buying it
  eta: kills-per-hour
  values: { horizonHours: 24 }                  # "worth it only to cross the next power of 10 cheaply"
  text: "{target} kills {projected} → {next} · {row} · {eta}"
  why: "Each power of 10 of {target} kills raises {row} for every character."
  stopHere: "{target} kills reach {next} in {eta}. The next step, {following}, is {etaFollowing} away. Consider stopping here."
  appliesTo: { stages: [W1-late, W2-early, W2-mid, W2-late, W3-early, W3-mid, W3-late, W4-entry] }
  confidence: H
  status: active
  sources:
    - { url: "https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/misc/upgradeVault.ts#L269", tier: 1, verified: 2026-10-17, gameVersion: 2.3.540 }
    - { url: "https://github.com/YassSoliman/idleon-forge/blob/research/account-wide/docs/research/systems/account-wide/upgrade-vault.md", tier: 3, verified: 2026-10-17, gameVersion: 2.3.540 }
```

| Contribution (authored) | Activity | Detector | `eta` | Worthwhile rule (`params`) | Horizon | Priority item (M2) |
|---|---|---|---|---|---|---|
| `portals.contribution.push` | FIGHTING, the character is M2's pusher and on M2's frontier map (D5: no other character's portal is ever worthwhile) | `portals/push` | kills-per-hour (M2's ETA, copied) | rate > 0 | none (always worthwhile) | position 2 (M2's push Goal) |
| `upgrade-vault.contribution.kill-row` | FIGHTING on maps 8/13/14/24/101 | `upgrade-vault/kill-row` | kills-per-hour | the scaled row's level ≥ 1 | 24 h | Vault table rows (W1-late 9 …) |
| `death-note.contribution.skull` | FIGHTING on a Death Note mob, Stage ≥ W3-early | `death-note/skull` | kills-per-hour | Death Note building Lv ≥ 1 | 48 h | W3-mid 6, W3-late 6 |
| `cards.contribution.fight` | FIGHTING on a target with a card | `cards/fight-level` | kills-per-hour | 0 copies owned (5× chance), **or** the card is on the class's card list (authored, M8) and below max | 24 h, on the mean-at-base-rate ETA | W1-early 8 |
| `cards.contribution.skill` | MINING / CHOPPIN / FISHING / CATCHING on a node with a card | `cards/skill-first-copy` | none | 0 copies owned (yes/no, FR-6) | yes/no | W1-early 8 |
| `classes.contribution.exp` | FIGHTING | `classes/exp` | kills-per-hour | this map's EXP/h ≥ 50% of `bestExpPerHour` (D3) | none | unlisted |
| `skills.contribution.door` | MINING / FISHING | `skills/door` | none | skill level below the next door | yes/no | unlisted |
| `skills.contribution.tool` | gathering | `skills/tool-chain` | none | the target's resource is an ingredient of the next tool the skill level allows, and the character lacks that tool | yes/no | 3d |
| `stamps.contribution.material` | gathering | `stamps/material` | none | an owned stamp's next cap raise needs this resource and `materialCost > ownedMats` | yes/no | W1 stamp items |
| `roles.contribution.skill` | the AFK type of one of the character's **active** M2 Roles | `roles/skill` | none | the character holds an active Role owning this AFK type (`meta.roles`) | yes/no | unlisted |
| `lab.contribution.chain` | LABORATORY, Stage W4-entry | `lab/chain` | none | `lab.connected[i]` | yes/no | W4-entry 4 |

Skilling with *only* the Role Contribution matching counts as `serving` (D6). Skilling outside an active Role with no live door, tool, stamp or first-copy card Goal is `exhausted`. The Lab entry ships only if a public or scrubbed fixture with the Lab unlocked passes its fires and doesn't-fire tests before merge; otherwise it is held back and LABORATORY is `not-covered`.

**TR-5 Detectors.** Detectors follow M11's contract (M11 Detector types): they take M11's `DetectorContext` (`state`, `history`, `now`, `expectedReturnMs`, `facts`) plus their validated `params`, and return a `ProgressFinding` (current value) or a `ContributionFinding` (`advances`, `etaMs`). Missing data is returned as M11's unknown result with a reason, never thrown. Stage-dependent gates (pusher, frontier map, Roles) and the M2 push-Goal values are applied by M4's engine layer from `meta`, not inside Detectors, because `DetectorContext` carries no Stage result.

| Detector | Reads | Returns |
|---|---|---|
| `purpose/activity-of` (engine helper, not an entry Detector) | `afkType`, `mapIndex`, `targetMonster` | `ActivityRef` |
| `portals/push` | `nextPortal`, `fighting.finalKillsPerHour` (engine copies `meta.pushGoal`) | per-character progress |
| `upgrade-vault/kill-row` | `vault.killTotals[map]`, the row's level, every character's `fighting` on the same map | account progress, summed rate |
| `death-note/skull` | the mob in `deathNote[w].mobs` with `rawName === target`, `deathNoteBuildingLevel`, every feeder's rate | account progress, summed rate, banked flag |
| `cards/fight-level` | `cards[card].amount/stars/nextLevelReq`, base chance (generated), feeders' rates | copies; mean ETA = gap ÷ (Σ rate × base chance × (5 if amount = 0)); `bound: 'mean-at-base-rate'` |
| `cards/skill-first-copy` | `cards[card].amount` | yes/no |
| `classes/exp` | `classExp`, `fighting.expPerKill`, `fighting.finalKillsPerHour` (ratio against `bestExpPerHour` applied by the engine) | level progress; ETA = (expReq − exp) ÷ (rate × expPerKill) |
| `skills/door` | `skills[skill]`, generated door list | level progress, yes/no |
| `skills/tool-chain` | `tools`, `skills[skill].level`, generated tool table | yes/no |
| `stamps/material` | `stamps[].itemReq/materialCost/ownedMats` | shortfall count, yes/no |
| `roles/skill` | `afkType` (Role match applied by the engine from `meta.roles`) | yes/no |
| `lab/chain` | `lab.connected` | yes/no |
| `purpose/milestone-crossed` (engine helper) | `history.sessionStart`, same Goal counter | `MilestoneCrossing[]` |

Each Detector gets fires and doesn't-fire tests on both private fixtures (local only) and on the public and scrubbed fixtures (CI). That follows #14 item 7 and #11 item 12.

**TR-6 Rates.** Fighting rates for the current activity come only from `CharacterState.fighting`, the identity call on the saved map, which equals Toolbox's Stats page (#16). M4 never calls `getMaxDamage`. `bestExpPerHour[i]` is the best class EXP/h over M5's `reachableFightingMaps(i)` (M5 TR-4), taken from M5's what-if sweep, which already filters out unreachable maps (M5 R1). M5 computes and caches it per save; M4 only reads it. If it is absent (sweep not run, or still running), `classes.contribution.exp` is skipped with a diagnostic, never guessed, and a fighter with no other Goal is `cannot-tell`, not `exhausted`. For M5's `goalsServedBy`, hypothetical rates are injected by the caller from M5's what-if channel; M4 never computes them.

**TR-7 Performance.** `derivePurposes` takes ≤ 15 ms for 11 characters on a mid-range laptop, plus ≤ 5 ms for the one history state it reads (the session-start save). The hypothetical sweep is M5's budget, not M4's. M4 allocates no per-map arrays.

**TR-8 Storage.** M4 stores nothing. The caller resolves the session-start state from M1's `SaveHistory` before calling M4. Skip today and Not for me on stop-here suggestions are M10's, keyed by the stop-here `NextAction.key` (`${contributionId}@${subject}#${milestone}`, TR-3), so a dismissal never hides the next Milestone's suggestion. M10's key today is `${entryId}@${subject}`; the `#milestone` suffix is an M10 change (section 7).

**TR-9 Security and privacy.** Outputs carry the character index, never names. The UI joins names locally. `stamps[].bestCharacter` (a name, #16) is stripped in the Account State. Provenance records field paths and entry ids, never save values. Template slots never hold a character name (FR-16). Nothing in M4 leaves the device; what Report this sends is M13's `ReportContext`, previewed to the player.

**TR-10 Golden snapshots.** The golden Now-screen snapshot per fixture (#11 item 12) includes every character's `Purpose` (status, headline, top 3, stop-here). Any Knowledge Base PR that changes a Purpose shows up in the snapshot diff.

## 6. States and edge cases

| State | Behaviour |
|---|---|
| **Loading** (first parse not done) | No Purpose. M10 shows its skeleton |
| **Empty account / broken parse** | No Purpose at all; M1's "Can't read your save" (US-9) |
| **Section failed or field unknown** (`diagnostics.failedSections`, `isKnown` false, or a `null` field) | Goals reading it are dropped; characters left with no Goal become `cannot-tell` (FR-18). Display-only `warnings` are never read |
| **No history yet** (first save) | No "Reached" lines; projection still works (it uses each feeder's last save time and `now`, not history) |
| **Character not claimed for days** | The projection is capped by the feeder's AFK-time cap when known and clamped at the next Milestone: progress shows "~reached, claim to confirm", status and "next" stay as at the saved value, and "Reached" waits for a saved value that confirms it (FR-9) |
| **Character being played actively** | Kills come faster than the AFK rate. The ETA still uses the AFK rate, labelled "at AFK pace" |
| **Rate 0** (can't hit, dies) | "not progressing", not worthwhile (FR-5). M3 owns any safety blocker |
| **Skilling map with several targets** | The saved `targetMonster` is used, never `mapEnemiesArray` (#16: a mining Squire's Gold vs Iron) |
| **Goal complete** (card at max, last skull) | Shown as "complete" under "show more", never worthwhile |
| **Several characters on one map** | Account counters sum their rates. Each feeder's row shows the same account Goal, and the stop-here shows on each |
| **Game newer than the parser pin** (M1 FR-29 banner) | Generated entries are never Stale (M11 FR-19), so no Stale badge appears and ladders may be silently wrong until the next re-sync. M4 adds a `parser-behind` flag to every Goal instance while M1 shows the banner, and M10 shows it as "may be out of date" next to ETAs. Renamed fields arrive as `null` and fail closed (FR-18) |
| **Entry Stale** (≈10 patches old) | Shown, Stale badge, ranked below fresh ones (FR-10) |
| **Offline** | M4 is pure and runs on the last good Account State. The "last cloud save Ns ago" line (M10) covers freshness |
| **Multiple tabs** | Each tab computes the same output (FR-17). M4 writes nothing, so there are no conflicts |
| **Second account in the same browser** | M1 FR-22 keeps history per account uid; M4 receives only the signed-in account's states, so Purposes never mix histories |
| **Character with no AFK Target** (town, `Nothing`) | `no-activity`. M3 FR-12 blocks, so the Verdict is Fix before you leave; M4 emits no prompt of its own and gives M3 the suggested target (FR-14) |
| **W4+ AFK types** (Cooking, Divinity, Spelunking) | `not-covered` until entries exist. Lab is covered at W4-entry only if its fixture test passes (TR-4); otherwise `not-covered` |
| **Boss, dungeon, crystal-mob or quest-item target** | Only Class EXP (and any card) match, so the status is `exhausted` unless D3 passes, with the reason naming what was checked. A boss key Goal is M6's; quest-item Goals are a follow-up (section 2) |
| **Expected Return shorter than every ETA** | No stop-here. The Purpose still shows |
| **Clock skew** (a feeder's last save after `now`) | away_i is clamped at 0, so there is no negative projection |
| **Patch renames a Toolbox field** | M1's adapter returns `null` for a missing key (it throws `AccountShapeError` only on a wrong type), and contract tests run on fixtures, not on players' new saves. So M4 can see half-shaped data: every `null` or unknown field a Detector reads drops that Goal (FR-18) |

## 7. Dependencies

| Module | What M4 needs | Interface |
|---|---|---|
| **M1** Sync & Account State | the TR-2 fields (via TR-11 growth, `null` when absent); `fighting` identity rates; `SaveHistory` previous and `sessionStart` states; `diagnostics.failedSections`, `isKnown`; the FR-29 parser-behind signal | `AccountState`, `SaveHistory` |
| **M2** Stage & Meta Path | Stage; the pusher and frontier map; the push Goal's entry id, counts and ETA; per-character Roles with `active`; the resolved Priority List and `compareGoals` | `MetaPathInput` (TR-3), assembled from M2 FR-7, FR-11, FR-12, TR-9, TR-10, TR-14. **M2 change:** expose `pusher`, `pushGoal` and per-character `roles` as plain data on its result |
| **M3** AFK Safety | consumes `Purpose.status` to compose the Verdict (safety blockers first, then Purpose); takes `suggestedTarget` for FR-12 | `Purpose[]` |
| **M5** Higher-leverage options | consumes `exhausted`/`none`/stop-here reasons; supplies the one suggestion M4 links to; supplies `bestExpPerHour` from its reachability sweep and hypothetical rates for `goalsServedBy` | `purposeOf`, `goalsServedBy`, `activitiesServing` (TR-3, M5 TR-9) |
| **M7** Spend Plan | when a Vault kill row is at Lv 0, M7 owns "buy the row"; M4 marks the Goal `rule` not-worthwhile | shared entry ids |
| **M8** Collections | authors the per-class card lists that `cards.contribution.fight` reads; owns card equip actions | `cardList(class, stage)` entries |
| **M10** Now screen UI | renders the Purpose lines, Focus block, stop-here, prompts, badges; owns Skip and Not for me. **M10 change:** NextAction keys may carry a `#milestone` suffix (TR-8), and a `parser-behind` badge | `CharacterResult` mapping (TR-3) |
| **M11** Knowledge tooling | **schema additions:** `goalFamily` with compile-time expansion, `stopHere: Template`, `contestedOn`. **New generators:** `vault-kills` (with the map → slot table), `card-levels`, `class-gates`, `skill-doors`, `tools`. CI source checks, Detector test harness | YAML schema, generator scripts |
| **M13** Suggestions | "Report this" on a Purpose line or stop-here files M13's `ReportContext` | `ReportContext` |

## 8. Decisions

Ruled by Yasser on 2026-10-17 ([PR #47](https://github.com/YassSoliman/idleon-forge/pull/47)): every recommendation accepted as written.

- **D1 Stop-here horizon: per-entry authored hours, default 24 h, never below the Expected Return.** *Why:* the right horizon is System judgment. Vault kill rows are "worth it only to cross the next power of 10 cheaply" (24 h), while Death Note skulls are a multi-session Goal (48 h). The floor at the Expected Return stops a stop-here from firing on something that finishes while the player sleeps anyway. Applied in FR-7, FR-13 and TR-4.
- **D2 A Purpose that runs out before the Expected Return does not change the Verdict.** It is a suggestion line and the Verdict stays Ready. *Why:* #10 keeps the Verdict for AFK safety plus "serving a worthwhile Purpose", and the character *is* serving one until the Milestone. A blocker would turn every Vault step into a red row and train players to ignore Fix. The stop-here line plus M5's option carries the advice. Applied in FR-13 and US-2.
- **D3 Class EXP counts as worthwhile when this map's EXP/h is at least 50% of the character's best opened map.** *Why:* every fighter earns EXP, so "never counts" would make plain levelling fighters Unknown. 75% would flag near-equal maps on noise in a rate not yet live-checked at W1–W3 (#16 caveat 1). Under half is clearly wrong, which is what the prototype's "too low for your level" meant, and M5 then names the better map. Applied in TR-4, TR-5 and US-5.
- **D4 The Purpose block is separate from the 3-Goal Next Action cap.** One Purpose headline on the row, up to 3 Purpose lines in Focus; the cap of 3 stays for Next Actions. The stop-here line, which is an action, counts as one of the 3. *Why:* Purpose describes what the character already does and needs no action, while the cap limits what the player must *do*. Mixing them would push real Next Actions behind "show more". Applied in FR-11 and FR-13.
- **D5 Portal Goals are worthwhile for the pusher only, on M2's frontier map (the push route; Priority position 2).** Other characters' portal progress shows in Focus under "show more", never worthwhile. *Why:* the 2026 norm is one pusher (PV cross-cutting 1). A portal off the frontier map (e.g. the W2-late Barbarian's 2,814 of 20,000 on Poopy Sewers, which is not M2's frontier even though the Barbarian is the pusher) is not Leverage by any Source. Applied in TR-4, US-3 and US-6.
- **D6 A skilling activity is `serving` when a concrete Goal is live (door not reached, tool-chain ingredient, stamp shortfall) or when the skill is the class's Role skill.** *Why:* "any skilling counts" makes every skiller Ready and hides drift. Concrete Goals alone would mark a Role-correct skiller "What is this character for?" once it passes its last door before W4. The Role keeps that case Ready, and M5 still compares efficiency for "better fit". Applied in TR-4 and US-4.

## 9. Red-team notes

1. **Wrong ETAs.** Toolbox's `finalKillsPerHour` has never been live-checked at W1–W3 (#16 caveat 1), and a 2× error flips stop-here timing. *Defence:* ETAs only drive suggestions, never a Verdict. Every ETA shows "~". M12 runs a one-time calibration: Yasser compares one character with in-game AFK Info, and the result is recorded in the golden snapshot.
2. **Purpose too permissive, so false Ready.** If anything matched, a Lv 54 Bowman on map 1 would read Ready. *Defence:* the worthwhile test is separate from matching (FR-7). Class EXP needs the D3 ratio, cards need a first copy or an authored list, Death Note needs the building, and Vault rows need a level. US-5 pins two real `exhausted` cases from the W2-late fixture.
3. **Purpose too strict, so Unknown everywhere.** That trains players to ignore Unknown. *Defence:* `not-covered` is separate from `none` (FR-8, US-8), so missing knowledge never reads as a judgment. The Role-skill rule (D6) keeps correct skillers Ready. Unknown never blocks and never turns red. A wrong Unknown is one tap from Report this.
4. **Stale counts for unvisited characters.** The cloud save holds kills only up to that character's last claim, so a fighter left 20 h shows yesterday's progress. *Defence:* FR-9 projection from `now`, capped by AFK-time caps and clamped at the next Milestone, "~" labels, and "Reached" only on saved values.
5. **Patch breakage.** A patch moves a Vault row, adds Death Note ranks, or renames `nextPortal`. *Defence:* ladders are generated at every re-sync (ADR 0007), so they rot only between a patch and the next re-sync. In that window generated entries carry no Stale badge (M11 FR-19), so M4 flags every Goal `parser-behind` while M1's banner shows (section 6). Renames reach M4 as `null`, not as errors (M1 TR-11), and every Detector fails closed on `null` or unknown fields (FR-18).
6. **Account-wide counters treated per character.** Vault and Death Note kills are summed over characters. An ETA using one character's rate is wrong when two farm the same mob. *Defence:* summed feeder rates (FR-4), and every feeder row shows the same Goal and ETA.
7. **Privacy leak.** Toolbox embeds a character name in `stamps[].bestCharacter`, and provenance could copy save values into a Report. *Defence:* stripped in M1 (TR-2), outputs keyed by index (TR-9), provenance holds paths not values, templates have no name slot (FR-16), and Report this sends M13's previewed `ReportContext`, whose values the player can untick (M13 D3).
8. **Stop-here nagging.** If it fires every save until the character moves, players learn to ignore it. *Defence:* Skip today and Not for me are keyed to that Milestone (TR-8), so one tap silences it until the next Milestone, and it never changes the Verdict (D2).
9. **Repeating the prototype's mistake.** The Copper Squire was told to mine Iron because of XP. *Defence:* skilling is never judged on EXP or rates (FR-6). Purposes come from material, door, tool and Role Contributions (US-4). "Better" skilling choices are M5's, and only when Toolbox efficiency agrees.
10. **Missing Goal families make a real Purpose look empty.** The cases are quest-item farming (Kebab Sticks), boss-key routes, and crystal mobs for statues. *Defence:* Class EXP matches every fighter, so these show `exhausted` (or `serving` if D3 passes) with a reason naming what was checked (FR-8), rather than a bare judgment. M13 Suggestions and Report this feed new Contributions through the #11 pipeline, and the quest-item family is the first follow-up (out of scope, section 2).
11. **Card ETAs mislead.** Drops are random, so gap ÷ (rate × chance) is a mean, not a bound: for 10 copies there is roughly a 45% chance of still being short at that time. The base chance also ignores `CardChanceMulti` (≥ 1.2), which only shortens the mean. *Defence:* the ETA is labelled "about N h on average at the base drop rate" (`bound: 'mean-at-base-rate'`), and the horizon test uses that mean, so the multiplier error only ever makes a card Goal look *less* worthwhile. Skilling cards get no ETA at all (FR-6).
12. **Contested Sources tip a Verdict.** *Defence:* order-contested Goals count but never headline over an uncontested one. Usefulness-contested Goals never make a Purpose `serving` (FR-15), which keeps #11's "never a Verdict blocker or the top action" in spirit.

## 10. Red-team log

Independent red-team pass on 2026-10-17, after the section 8 decisions were folded in. The reviewer had not seen the drafting, and every finding was checked against the sibling specs (`spec/M1`, `M2`, `M3`, `M5`, `M10`, `M11`, `M13`), the dossiers, the vendored parsers and Toolbox `shared-data.json` at `6827d3f2` before a verdict. Totals: 22 findings (P0 1, P1 6, P2 11, P3 4). 20 were fixed in full, and 2 in part with the rest rejected (RT-4, RT-19). None was deferred.

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| RT-1 | P0 | Entries and Detectors break M11's strict schema and Detector contract (ids, unknown fields, wildcard `goal`, no `eta`, thrown errors, `purpose/` paths, missing generators) | fixed | TR-1, TR-4 and TR-5 adopt M11's ids, `detector.params`, `values.horizonHours`, `eta`, findings and unknown results. Three schema additions (`goalFamily` with compile-time expansion, `stopHere`, `contestedOn`) and five generators are listed as M11 changes in section 7. Card entry split into fighting and skilling |
| RT-2 | P1 | M2's `StageResult` has none of the fields M4 assumed; the push portal would show two different ETAs | fixed | TR-3 `MetaPathInput` built from M2's real outputs. The push line copies M2's push Goal id, counts and ETA (US-6: ~14 h). The M2 change is listed in section 7 |
| RT-3 | P1 | M5 TR-9 needs `purposeOf`, `goalsServedBy` and `activitiesServing`, which M4 didn't export | fixed | Added to TR-3, with hypothetical rates injected by M5 (TR-6) |
| RT-4 | P1 | Skill doors are wrong (no Choppin or Catching doors; Fishing is 15/30; unfiltered `mapPortals` gives 81 and 50), and "below the next door" makes most skillers `serving` | fixed in part | Doors corrected and filtered (TR-4); CHOPPIN and CATCHING dropped from the door entry. The "most skillers serving" part is rejected: D6 (a) explicitly rules that a door not yet reached is a live Goal, and choosing a better node is M5's job |
| RT-5 | P1 | Projection past a Milestone was undefined, could flip status, was frozen at parse time and ignored AFK caps | fixed | FR-9: projection per feeder from `now`, capped by known AFK caps, clamped at the next Milestone ("~reached, claim to confirm"). It never changes status or "next". Only kill counters are projected |
| RT-6 | P1 | A "Reached" line compared to the previous save lasts only about one 4-minute save | fixed | FR-12 and US-7 compare to M1 `SaveHistory.sessionStart` and show the line for the whole Play Session |
| RT-7 | P1 | Patch-day claims were wrong: renames arrive as `null`, contract tests don't run on players' saves, and generated entries are never Stale | fixed | FR-18 treats `null`/unknown as fail-closed. Section 6 adds the `parser-behind` flag while M1's banner shows. Red-team note 5 rewritten |
| RT-8 | P2 | The card ETA is a mean, not "up to"; skilling cards have no rate | fixed | "About N h on average at the base drop rate" (`mean-at-base-rate`). Skilling cards are yes/no for the first copy only (TR-4, US-3, note 11) |
| RT-9 | P2 | The Death Note rule read a missing `killPerKill` field and tested the wrong character: skull points pay every character in that world | fixed | Rule is now building Lv ≥ 1 only (W3 dossier: points are per world) |
| RT-10 | P2 | `none` is impossible for fighting, "not-covered" was undefined, and US-8's Catching is covered | fixed | FR-8 defines coverage per AFK type, and fighting falls to `exhausted`. US-8 is rebased on Cooking. Section 6 boss row and note 10 corrected |
| RT-11 | P2 | No AFK Target is an M3 blocker (Fix), not Unknown, and it gave two prompts | fixed | FR-8, FR-14 and section 6: no M4 prompt for `no-activity`; `suggestedTarget` goes to M3 FR-12 |
| RT-12 | P2 | Roles are per character and can be dormant (M2 TR-9); the fallback named a Parallel Slot | fixed | `meta.roles` with `active` per character. The fallback uses only active Roles that own an AFK Target (FR-14, TR-4) |
| RT-13 | P2 | `bestOpenedExpPerHour` was undefined and had no owner or budget | fixed | Renamed `bestExpPerHour`: the best over M5 `reachableFightingMaps`, computed and cached by M5. When absent, a fighter with nothing else is `cannot-tell` (TR-6, TR-7) |
| RT-14 | P2 | Goldens that "record whatever happens" can't fail, and three Toolbox pins were mixed | fixed | One parser pin (`UPSTREAM`, `6c37e3d`). † rates are pre-registered within ±5%. US-5 now asserts `exhausted` for both characters from M5's ratios |
| RT-15 | P2 | Output didn't match M10's `PurposeLine`/`Milestone`/`NextAction` contract; dismissal keys lacked the Milestone; "once per" needed state | fixed | TR-3 mapping to M10 (seconds, `stopHere`, `unknownReason`), `#milestone` key suffix (M10 change, section 7), and the "once per" claim removed (FR-13, note 8) |
| RT-16 | P2 | Section failures were read from display-only `warnings`; FR-8 and FR-18 disagreed | fixed | `failedSections` and `isKnown`. `cannot-tell` only when no Goal is left (FR-8, US-9) |
| RT-17 | P2 | Report this privacy text was out of date against M13 | fixed | FR-16 and TR-9 point to M13 `ReportContext`; templates have no name slots |
| RT-18 | P2 | Portal ladders ignored second doors (map 16 is `[60, 3000]`) | fixed | One step per door (TR-4). `nextPortal` carries `door`. US-5 restated |
| RT-19 | P2 | Lab chain is beyond the MVP cut and untestable | fixed in part | The scope claim is rejected: the Leverage model lists the Lab at W4-entry (#26, position 4). Testability is fixed: `lab.connected` added to TR-2, and the entry ships only if a fixture test passes, otherwise LABORATORY is `not-covered` |
| RT-20 | P3 | Card level thresholds were off by one ("more than 11") | fixed | Steps at perTier × k + 1. US-3 text corrected |
| RT-21 | P3 | "Closest Milestone" had three definitions, and one tie-break was constant | fixed | FR-10 uses M2 `compareGoals` |
| RT-22 | P3 | Nits: Obol Altar gate, `deathNote` lookup, Vault slots, days threshold, header "section 10", D5 example, second account, TR-7 wording | fixed (one rejected) | Gate moved to account gates, lookup by `rawName`, generated map → slot table, days from 72 h, D5 example corrected (the Barbarian *is* the W2-late pusher; map 8 just isn't the frontier), the M1 FR-22 row and TR-7 corrected. The "section 10 missing" nit is rejected: this section is it |
