# M4 Purpose & Milestones

Spec for [#32](https://github.com/YassSoliman/idleon-forge/issues/32), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **draft**, waiting for the open decisions in section 8 to be grilled, then a red-team pass, then merge. Terms follow [GLOSSARY.md](../../GLOSSARY.md).

**Inputs this spec is built from:**
- Now screen behaviour ([#10](https://github.com/YassSoliman/idleon-forge/issues/10)) and the prototype resolution that introduced Purpose ([#12](https://github.com/YassSoliman/idleon-forge/issues/12)).
- Knowledge Base shape ([#11](https://github.com/YassSoliman/idleon-forge/issues/11), [ADR 0007](../adr/0007-generated-facts-authored-judgment.md)), architecture ([#14](https://github.com/YassSoliman/idleon-forge/issues/14), [ADR 0006](../adr/0006-client-only-spa-parsing-in-a-worker.md)) and the MVP cut ([#13](https://github.com/YassSoliman/idleon-forge/issues/13)).
- Toolbox-number rules ([ADR 0005](../adr/0005-toolbox-numbers-not-our-formulas.md)) and what Toolbox can compute ([#16](https://github.com/YassSoliman/idleon-forge/issues/16), `research/hypothetical-math`).
- The Leverage model ([#26](https://github.com/YassSoliman/idleon-forge/issues/26), `research/leverage-model`), the priority verification overlay ([#27](https://github.com/YassSoliman/idleon-forge/issues/27), `research/priority-verification`, which wins on conflicts), and the dossiers on `research/{account-wide,cards-obols,w3-systems,skills}`.

Verified against game v1.23 (Toolbox gameVer 2.3.540) on 2026-10-17.

## 1. Purpose

When a player looks at a character, M4 answers "what is this character doing for me right now, and when should I stop?". From the Account State alone, it works out the Goals the character's current activity is advancing (its Purpose). Each Goal comes with its progress and next Milestone, for example "Poop kills 2,995 → 10,000 for Dirty Money, about 4.9 h". Fighting Goals get an ETA from Toolbox's kills per hour; skilling Goals get a plain yes or no. When the character is about to cross a Milestone and the next one is far off, M4 suggests stopping there. When the activity advances nothing worthwhile, M4 says so ("What is this character for?") so the Verdict can be Unknown instead of a false Ready. The player never types a Purpose in. A wrong Purpose is fixed through **Report this**.

## 2. Scope / Out of scope

**In scope**
- Deriving each character's **activity** from the Account State: its AFK Target (type, map, target monster or resource).
- Matching that activity against **Contribution** entries to build the character's **Purpose**: a ranked list of Goal instances, each with current progress, the reached and next **Milestone**, and an ETA or a yes/no.
- The **Goal families** shipped in the MVP (section 5, TR-4):
  - fighting: pusher's next portal, Upgrade Vault kill rows, Death Note skulls, card levels, Class EXP;
  - skilling: skill-level doors and gates, tool-chain ingredient, stamp-material shortfall, Role skill.
  - W4 entry: Lab chain membership (yes/no).
- **ETAs** for fighting Goals: arithmetic on Toolbox `finalKillsPerHour` (and EXP per kill, base drop chance), summed over every character feeding the same account-wide counter.
- The **worthwhile test**, which decides whether a Purpose counts toward a Ready Verdict.
- The **stop-here suggestion** at a Milestone.
- **Milestone crossings** since the previous save ("Reached 10,000 Poop kills"), from save history.
- The Knowledge Base entries M4 needs: generated Goal ladders and authored Contributions, plus their Detectors and fixture tests.

**Out of scope**
- **Skilling rates and skilling ETAs.** Toolbox computes no resources or skill EXP per hour ([#16](https://github.com/YassSoliman/idleon-forge/issues/16)), and #11 item 8 rules skilling yes/no only. A rate from save history (Δ EXP between claims) is a possible later addition, not MVP.
- **Choosing a better activity or character.** That is M5 Higher-leverage options. M4 only says the current activity's Purpose is weak, exhausted or absent, and hands M5 the reason.
- **AFK safety** (food, caps, run-outs): M3. M4 never produces a Verdict blocker.
- **Parallel Slot Purposes** (cauldron, cog seat, traps, worship, printer). The engine contract supports them (`ActivityRef.kind = 'parallel'`), but the MVP ships no such Contributions. Empty slots are M6's, capping slots are M3's.
- **Buying things** (a Vault row whose kill steps pay nothing until it has a level, stamp cap raises): M7 Spend Plan. **Equipping cards and sets:** M8 Collections.
- **Stage, pusher choice, Roles and Priority List contents:** M2. M4 reads them.
- **Rendering:** M10. M4 outputs data and text templates; M10 lays them out.
- **Quest-item drops as Goals** (e.g. 100 Kebab Sticks for Speccius). Deferred to an Acquisition-driven follow-up; listed in Red-team note 10.
- Talent-preset hypotheticals (lossy per #16).

## 3. Functional requirements

- **FR-1 Activity.** For each character, M4 derives exactly one `ActivityRef` from `afkType`, `mapIndex` and the saved `targetMonster`. `afkType` of `Nothing` or `Paying_Respect`, or no target, yields `kind: 'none'`.
- **FR-2 Contribution matching.** M4 evaluates every active Contribution entry whose `appliesTo` (Stage, class, level) holds and whose Detector matches the activity. Each match yields at most one Goal instance per (Goal, character).
- **FR-3 Progress.** Each Goal instance shows the counter's saved value, its projected value (FR-9), the last reached Milestone, the next Milestone, and the one after it. The values are numbers from the Account State or Toolbox, never typed in.
- **FR-4 Fighting ETA.** For a fighting Goal, ETA = (next Milestone − projected value) ÷ rate. The rate is the sum of Toolbox `finalKillsPerHour` over every character whose activity feeds the same counter. Per-character counters (portal kills) use only that character's rate. ETA is shown rounded (minutes under 1 h, then hours to 1 decimal place under 10 h, then whole hours, then days), capped at "30+ days".
- **FR-5 Zero rate.** If the rate is 0 (the character cannot kill the target, or survivability is 0), the Goal shows "not progressing", carries no ETA, and does not count as worthwhile.
- **FR-6 Skilling yes/no.** A skilling Goal shows progress (e.g. Mining level 20, EXP 8.9k of 21.8k) and the next gate, but never an ETA or a per-hour number.
- **FR-7 Worthwhile test.** A Goal instance is worthwhile when all of these hold: its entry status is `active` or `contested` (not `retired`); its Contribution's own `worthwhile` rule passes (TR-4); for a fighting Goal, the rate is above 0 and the ETA to the next Milestone is within the entry's horizon (TR-5). A character's Purpose is **serving** when at least one Goal instance is worthwhile.
- **FR-8 Purpose status.** Each character gets exactly one status:
  - `serving`: at least one worthwhile Goal;
  - `exhausted`: Goals matched, none worthwhile;
  - `none`: the activity matched no Contribution, and its System has Contributions;
  - `not-covered`: the activity's System has no Contribution entries at all ("Not covered yet: Catching");
  - `no-activity`: FR-1 gave `kind: 'none'`;
  - `cannot-tell`: a required field is missing or the parse warned on a section the Detector reads.
  Only `serving` lets the Verdict be Ready. Every other status makes it Unknown, never Fix before you leave.
- **FR-9 Projection.** A character's AFK kills reach the save only when that character is next claimed. For fighting counters, the projected value = saved value + rate × hours since that character's last save (`secondsSinceLastSave`), and progress shows a leading "~". The saved value is available on tap. Projection never crosses a Milestone that history has not confirmed for the "Reached" line (FR-12).
- **FR-10 Ranking within a Purpose.** Goal instances are ordered by: the Stage Priority List position of the Goal's item (M2), then closest Milestone (smallest ETA; yes/no Goals after timed ones), then most Goals served by the same activity, then entry id. Stale entries rank below fresh ones at the same position. There are no numeric weights.
- **FR-11 Display budget.** M4 marks the top-ranked Goal instance as the row headline and the top 3 as the Focus card's Purpose block. The rest go behind "show more". How this block relates to the 3-Goal Next Action cap is D4.
- **FR-12 Milestone reached.** When save history shows a Goal's counter crossed a Milestone between the previous save and this one, M4 emits one `MilestoneCrossing` ("Reached 10,000 Poop kills: Dirty Money steps up"). It shows for that save only.
- **FR-13 Stop-here suggestion.** M4 emits a stop-here suggestion for a character when both hold:
  - (a) its top worthwhile fighting Goal will reach its next Milestone within the Expected Return, or reached one since the previous save (FR-12);
  - (b) after that Milestone, no Goal instance of the activity stays worthwhile, because the following Milestone's ETA is beyond the horizon.
  The text: "Poop kills reach 10,000 in ~4.9 h. The next step, 100,000, is ~63 h away. Consider stopping here." It names the Goal, both Milestones and both ETAs. It links to M5's option when M5 has one. It never changes the Verdict (D2). It supports Skip today and Not for me (M10).
- **FR-14 No-Purpose prompt.** For `exhausted`, `none` and `no-activity`, M4 emits the prompt "What is this character for?" with the reason (e.g. "Poop card is maxed and Class EXP here is under half your best map"). M5 supplies the one suggestion. Until M5 ships, M4 falls back to the class's Role from the Meta Path (M2): "Squires usually do Construction". For `not-covered`, M4 emits "Not covered yet: <System>" instead, and no suggestion.
- **FR-15 Contested and Stale.** A Contribution whose *order* is contested still counts as worthwhile, shows the "sources disagree" badge, and is never the row headline when an uncontested worthwhile Goal exists. A Contribution whose *usefulness itself* is contested (`status: contested` with `contestedOn: usefulness`) is shown but never makes a Purpose `serving`. Stale entries show the Stale badge and rank below fresh ones (FR-10).
- **FR-16 Provenance.** Every Goal instance, stop-here and prompt records the Knowledge Base entry ids, the Account State field paths and the Toolbox functions it used (#14 item 4). Report this sends the entry id, Knowledge Base version, game version, Stage, class and level only (#11 item 15).
- **FR-17 Determinism.** Same Account State, history, Knowledge Base, Expected Return and `now` give byte-identical output.
- **FR-18 Fail closed.** If a Detector throws or reads a missing field, that Goal instance is dropped, a warning is recorded, and the character's status becomes `cannot-tell` if no other Goal remains. M4 never shows a guessed number.

## 4. User stories

Fixtures: the **W2-late account** (5 characters, highest Lv 60, Stage W2-late) and the **W3-early account** (6 characters, highest Lv 85, Stage W3-early), parsed 2026-10-17 at the Toolbox pin. Characters are named by account, class and level only. Rates marked † come from `research/hypothetical-math` at pin `f1e4240` and are re-recorded as golden values on the first engine run. Expected Return is the default 8 h unless stated.

**US-1 A fighter's Purpose with an ETA.** As a player in a Play Session, I want to see what my AFK fighter is working toward and how long it will take, so that I know it is worth leaving there.
- **Given** the W2-late account, Barbarian Lv 60, AFK fighting Poop on Poopy Sewers (map 8), with account Poop kills 2,995 (`upgradeVault.vaultTotalKills[3]`), Dirty Money at 25/25, and 1,430 final kills/h†, with no other character on map 8
- **When** the engine runs
- **Then** the row headline is "Poop kills ~2,995 → 10,000 · Dirty Money · ~4.9 h". The Purpose is `serving`, and the Goal cites the Upgrade Vault entry and its Source. ETA = (10,000 − 2,995) ÷ 1,430 ≈ 4.9 h, plus the FR-9 projection.

**US-2 Stop here at the Milestone.** As a player in a Play Session, I want to be told when my character is about to finish the useful part of its grind, so that I move it before it wastes the rest of the AFK Stretch.
- **Given** US-1's state and an Expected Return of 8 h
- **When** the engine runs
- **Then** a stop-here suggestion shows: "Poop kills reach 10,000 in ~4.9 h. The next step, 100,000, is ~63 h away. Consider stopping here." 63 h = 90,000 ÷ 1,430, which is beyond the 24 h default horizon (D1). The Verdict is not changed by it (D2).
- **Given** the same state with an Expected Return of 2 h
- **Then** no stop-here shows, because 4.9 h is beyond the return.

**US-3 Goals that don't count.** As a player in a Play Session, I want ActiveOn to ignore slow or not-yet-useful Goals, so that "Ready" means the character is doing something that pays.
- **Given** the W2-late Barbarian Lv 60 on Poop, with the Poop card at 1 copy (level 1, next level at more than 11 copies; base chance 1 in 16,667)
- **When** the engine runs
- **Then** the card Goal is listed under "show more" as "Poop card 1 → 11 copies · up to ~117 h at the base drop rate", and is not worthwhile, because 117 h > 24 h. There is **no Death Note Goal**, because Death Note Contributions apply from W3-early. Nor is there a portal Goal, because this character's portal on map 8 (2,814 of 20,000 kills) is not the pusher's push route (D5).
- **Given** the W3-early account, where the Death Note building is Lv 0, and the Shaman Lv 54 fighting Sand Castle on Shifty Sandbox (account Death Note kills ~12.8k on that mob)
- **Then** a Death Note line shows "~12.8k → 25k (banked: the Death Note building is Lv 0)", and it is not worthwhile, because multikill pays nothing until the building is Lv 1 (W3 dossier, H).

**US-4 Skilling on purpose (the Copper lesson).** As a player in a Play Session, I want a skiller doing something useful to read as Ready, without ActiveOn judging it on EXP, so that I'm not told to swap Copper for Iron when I mine Copper on purpose.
- **Given** the W2-late account, Squire Lv 43, AFK mining Copper on Tunnels Entrance, Mining Lv 20 (EXP 8.9k of 21.8k)
- **When** the engine runs
- **Then** the headline is "Mining 20 → 25 opens The Ol' Straightaway". It is yes/no with no ETA and no per-hour number. The Purpose is `serving` (the next door is not reached). A "Copper: stamp material" line shows only if an owned stamp's next cap raise is short of Copper. In this fixture Mana Stamp needs 68 against 1,294 held, so it is omitted.
- **Given** the W3-early account, Squire Lv 51, mining Gold on Freefall Caverns at Mining Lv 29
- **Then** the headline is "Mining 29 → 40 opens the next door", and the Purpose is `serving`.
- **Given** the W3-early account, Barbarian Lv 56, fishing on Salty Shores at Fishing Lv 22
- **Then** the Purpose is `serving` through the Role-skill Contribution (Barbarian = Fishing, skills dossier) and the next Fishing gate.

**US-5 What is this character for?** As a player in a Play Session, I want to be told plainly when a character's activity serves nothing, so that I don't leave it idling for 8 hours.
- **Given** the W2-late account, Shaman Lv 44, fighting Slime on Jungle Perimeter (map 16). Its portal there is already open (73 of 60). The Slime card is at 4 stars, which is level 5, the max before Rift 45. Map 16 is not a Vault kill map, and Death Note Goals don't apply at W2-late.
- **When** the engine runs
- **Then** the card Goal shows "complete". The only remaining candidate is Class EXP, which is worthwhile only if this map's EXP/h is at least half of the character's best opened map (D3). The expected golden result is Purpose `exhausted`, Verdict Unknown, and "What is this character for?" with the reason line and M5's (or the Role's) one suggestion.
- **Given** the W2-late account, Bowman Lv 54, fighting Green Mushroom on Spore Meadows (map 1). It has 3 cards, the next level is at 6, the portal is open, and the map is not a Vault map.
- **Then** the same `exhausted` outcome, unless the D3 test passes. The golden snapshot records which.

**US-6 The pusher's portal.** As a player in a Play Session, I want my pusher's next portal to be its headline Goal, so that the account's top Leverage (Priority List position 2) is visible on the character doing it.
- **Given** the W3-early account, where M2 picks the Squire Lv 85 as pusher (highest final kills/h on the next map; the Leverage model, §5.2). The Squire is fighting on Thermonuclear Climb with 19 of 15,000 portal kills.
- **When** the engine runs
- **Then** the headline is "Portal: ~19 → 15,000 kills · ~N h", with N = 14,981 ÷ its final kills/h (golden). The card line "Thermostat card: first copy (5× drop chance while unowned)" shows below it. The second Squire (Lv 51) gets no portal Goal.

**US-7 Reached since last time.** As a player in a Play Session, I want to see when a Goal stepped up while I was away, so that I know the AFK Stretch paid off.
- **Given** a history of two saves of the W2-late account, where the account Poop kills went from 9,800 to 10,400 between them (a synthetic history built from the fixture)
- **When** the engine runs on the newer save
- **Then** one line shows "Reached 10,000 Poop kills: Dirty Money steps up", and the Goal's next Milestone becomes 100,000. On the save after that, the line is gone.

**US-8 Not covered yet.** As a player in a Play Session, I want ActiveOn to admit when it has no knowledge of an activity, so that I don't read "What is this character for?" as a judgment.
- **Given** a public fixture with a character AFK on Catching, and a Knowledge Base with no Catching Contributions
- **When** the engine runs
- **Then** the status is `not-covered` with "Not covered yet: Catching", the Verdict is Unknown, and no suggestion shows.

**US-9 Broken data never gives a Purpose.** As a player in a Play Session, I want no Purpose when the save can't be read, so that I never act on invented numbers.
- **Given** a parse that throws `EmptyAccountError`, or one whose `warnings` include the `upgradeVault` section
- **When** the engine runs
- **Then** for the empty account, no Purpose is produced (M1 shows "Can't read your save"). For the section warning, Vault Goals are dropped, characters left with no Goal become `cannot-tell`, and a warning is recorded.

## 5. Technical requirements

**TR-1 Package boundary.** M4 lives in `packages/engine/src/purpose/` as pure functions, with no I/O, no clock read and no randomness. It imports only types from `@idleon-forge/account-state` and compiled entries from `@idleon-forge/knowledge`. Detectors live in `packages/knowledge/detectors/purpose/` (typed TS, per #11 item 2). M4 never imports `toolbox-parsers`: every Toolbox number reaches it through the Account State, including the hypothetical layer.

**TR-2 Inputs it needs from the Account State (M1).** The slice-1 `CharacterState` grows these fields. M4's Detectors read only them, never raw Toolbox output.

```ts
interface CharacterState {
  // existing: index, name, class, level, afkType, afkTarget, currentMap, foodStacks, secondsSinceLastSave
  classIndex: number;
  mapIndex: number | null;
  targetMonster: string | null;            // saved raw target; never re-derived from the map (#16 caveat 4)
  classExp: { level: number; exp: number; expReq: number };
  skills: Record<SkillKey, { level: number; exp: number; expReq: number }>;
  mapKills: number[];                      // Toolbox kills[mapIndex], per character, lifetime
  nextPortal: { current: number; goal: number } | null;
  fighting: FightingRate | null;           // identity call on the current map; null unless afkType === 'FIGHTING'
  tools: string[];                         // raw item names, 'Blank' removed
}
interface FightingRate {
  finalKillsPerHour: number;  // Toolbox getMaxDamage().finalKillsPerHour
  expPerKill: number;         // monsters[target].ExpGiven × getClassExpMulti(clone)
  survivability: number;
}
interface AccountState {
  // existing …
  deathNote: Record<string, { mobs: { rawName: string; kills: number }[] }>;
  deathNoteBuildingLevel: number;          // towers Death_Note level
  vault: { killTotals: number[]; rows: { name: string; level: number; maxLevel: number }[] };
  cards: Record<string, { amount: number; stars: number; nextLevelReq: number; perTier: number }>;
  stamps: { rawName: string; itemReq: string; materialCost: number; ownedMats: number }[]; // bestCharacter stripped (privacy)
  /** Best EXP/h over maps this character has opened, from the hypothetical sweep (M1/M5); null if not computed. */
  bestOpenedExpPerHour: (number | null)[]; // indexed by character index
}
```

**TR-3 Engine interface.**

```ts
type ActivityRef =
  | { kind: 'afk'; afkType: string; mapIndex: number | null; target: string | null; skill: SkillKey | null }
  | { kind: 'parallel'; slot: 'cauldron' | 'cog' | 'traps' | 'worship' | 'printer'; detail: string } // no MVP entries
  | { kind: 'none' };

type Eta =
  | { kind: 'hours'; hours: number; ratePerHour: number; feeders: number[]; bound: 'estimate' | 'upper' }
  | { kind: 'yesno' }
  | { kind: 'none'; reason: 'zero-rate' | 'beyond-cap' | 'complete' };

interface GoalInstance {
  goalId: string;              // generated ladder entry, e.g. 'goal.vault-kills.map-8'
  contributionId: string;      // authored entry, e.g. 'contrib.fight.vault-kill-row'
  characterIndex: number;
  scope: 'character' | 'account';
  unit: 'kills' | 'copies' | 'level' | 'items' | 'yesno';
  saved: number; projected: number;
  reached: number | null; next: number | null; following: number | null;
  eta: Eta; etaFollowing: Eta | null;
  worthwhile: boolean; notWorthwhileReason?: 'horizon' | 'zero-rate' | 'rule' | 'usefulness-contested' | 'complete';
  priorityPos: number | null;  // from the Stage Priority List (M2); null = unlisted, ranks after listed
  badges: ('contested' | 'stale')[];
  text: RenderedTemplate;      // headline and detail, slots filled; M10 renders
  provenance: Provenance;
}

type PurposeStatus = 'serving' | 'exhausted' | 'none' | 'not-covered' | 'no-activity' | 'cannot-tell';

interface Purpose {
  characterIndex: number;
  activity: ActivityRef;
  status: PurposeStatus;
  goals: GoalInstance[];       // all, ranked (FR-10)
  headline: GoalInstance | null;
  stopHere: StopHere | null;
  prompt: { kind: 'what-for' | 'not-covered'; reason: RenderedTemplate; system?: string } | null;
  reached: MilestoneCrossing[];
}
interface StopHere { goalId: string; at: number; etaAt: Eta; following: number; etaFollowing: Eta; provenance: Provenance }
interface MilestoneCrossing { goalId: string; milestone: number; provenance: Provenance }

function derivePurposes(input: {
  state: AccountState; history: AccountState[]; kb: CompiledKnowledge;
  stage: StageResult;          // M2: stage, pusherIndex, roles, priority positions
  expectedReturnHours: number; now: number;
}): Purpose[];
```

The Verdict composer (M3/M10) reads `status`: `serving` is required for Ready, and any other status gives Unknown.

**TR-4 Knowledge Base entries.** These use #11's shape (one YAML file per System, required fields `id`, `system`, `type`, text template, `why`, `sources[]`, `appliesTo`, `confidence`, `status`). M4 adds two fields to Goal entries (`ladder`, `counter`) and three to Contribution entries (`activity`, `worthwhile`, `horizonHours`). M11 owns the schema change.

*Goal entries (generated, ADR 0007).* The M11 generator writes them at every parser re-sync from Toolbox game data, with `generated: true` and the Toolbox pin as their Source.

| Goal family | Ladder | Generated from | Instances |
|---|---|---|---|
| `goal.portal.map-<i>` | single step: the map's door requirement | `shared-data.json mapPortals` (Toolbox `portals.ts`) | every fighting map W1–W4 |
| `goal.vault-kills.map-<i>` | powers of 10 from 10 | `VaultKillzTotal` map list (8, 13, 14, 24, 101) and the 5 scaled rows | 5 |
| `goal.death-note.<mob>` | 25k / 100k / 250k / 500k / 1M / 5M / 100M | `DEATH_NOTE_RANKS`, `deathNote` mob list | 40 (W1–W3) + W4 page |
| `goal.card.<card>` | perTier × 1, 4, 9, 25 (cap at the account's max level; Lv 6+ only after Rift 45) | `cards.json` perTier; `monsterDrops.json` base chance | every monster and resource card W1–W4 |
| `goal.class-level` | each level, plus labelled level gates (tab 4 at 90, personal obol slots, Obol Altar 30, Post Office 50) | `expReq` from the save; gate list from talents and obol data | 1 ladder |
| `goal.skill-door.<skill>` | the door levels (Mining 10 / 25 / 40 / 60; Fishing depths) | `mapPortals` skill doors | per gathering skill |
| `goal.tool.<skill>` | next tool tier the skill level allows | `items.json` tools, anvil recipes | per gathering skill |

*Contribution entries (authored judgment).* Each one is parametric: one entry covers a whole Goal family, and its Detector picks the instance.

```yaml
# packages/knowledge/systems/upgrade-vault.yaml
- id: contrib.fight.vault-kill-row
  type: contribution
  system: upgrade-vault
  activity: { afkType: FIGHTING }
  goal: goal.vault-kills.*              # Detector resolves map-<i>
  detector: purpose.vaultKillRow
  worthwhile: { rowLevelMin: 1 }         # a row at Lv 0 pays nothing per step; M7 suggests buying it
  horizonHours: 24                       # "worth it only to cross the next power of 10 cheaply"
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

| Contribution (authored) | Activity | Detector | Worthwhile rule | Horizon | Priority item (M2) |
|---|---|---|---|---|---|
| `contrib.fight.push-portal` | FIGHTING, character is M2's pusher, map on the push route | `purpose.pushPortal` | rate > 0 | none (always worthwhile) | position 2 |
| `contrib.fight.vault-kill-row` | FIGHTING on maps 8/13/14/24/101 | `purpose.vaultKillRow` | the scaled row's level ≥ 1 | 24 h | Vault table rows (W1-late 9 …) |
| `contrib.fight.death-note` | FIGHTING on a Death Note mob, Stage ≥ W3-early | `purpose.deathNoteSkull` | building Lv ≥ 1; character overkills (Toolbox kill-per-kill > 1) | 48 h | W3-mid 6, W3-late 6 |
| `contrib.fight.card` | FIGHTING or skilling on a target with a card | `purpose.cardLevel` | 0 copies owned (5× chance), **or** the card is on the class's card list (authored, M8) and below max | 24 h on the upper-bound ETA | W1-early 8 |
| `contrib.fight.class-exp` | FIGHTING | `purpose.classExp` | this map's EXP/h ≥ 50% of `bestOpenedExpPerHour` (D3) | none | unlisted |
| `contrib.skill.door` | MINING / CHOPPIN / FISHING / CATCHING | `purpose.skillDoor` | skill level below the next door | yes/no | unlisted |
| `contrib.skill.tool` | gathering | `purpose.toolChain` | the target's resource is an ingredient of the next tool the skill level allows, and the character lacks that tool | yes/no | 3d |
| `contrib.skill.stamp-material` | gathering | `purpose.stampMaterial` | an owned stamp's next cap raise needs this resource and `materialCost > ownedMats` | yes/no | W1 stamp items |
| `contrib.skill.role` | the Role skill of the class (Meta Path, M2) | `purpose.roleSkill` | the skill is the class's Role skill | yes/no | unlisted |
| `contrib.lab.chain` | LABORATORY, Stage W4-entry | `purpose.labChain` | the character is connected in the Lab chain | yes/no | W4-entry 4 |

Whether skilling with *only* `contrib.skill.role` matching counts as `serving` is D6.

**TR-5 Detectors.** Every Detector is `(ctx, character, params, ladder) => GoalProgress | null`, where `ctx = { state, history, stage, now }`. A Detector returns `null` when it does not apply, and throws `DetectorDataError` on a missing field (FR-18).

| Detector | Reads | Returns |
|---|---|---|
| `purpose.activityOf` | `afkType`, `mapIndex`, `targetMonster` | `ActivityRef` |
| `purpose.pushPortal` | `nextPortal`, `fighting.finalKillsPerHour`, `stage.pusherIndex` | per-character progress and rate |
| `purpose.vaultKillRow` | `vault.killTotals[slot]`, the row's level, every character's `fighting` on the same map | account progress, summed rate |
| `purpose.deathNoteSkull` | `deathNote[w].mobs[target].kills`, `deathNoteBuildingLevel`, every feeder's rate | account progress, summed rate, banked flag |
| `purpose.cardLevel` | `cards[card].amount/stars/nextLevelReq`, base chance (generated), feeders' rates | copies; ETA = gap ÷ (Σ rate × base chance × (5 if amount = 0)); `bound: 'upper'` |
| `purpose.classExp` | `classExp`, `fighting.expPerKill`, `fighting.finalKillsPerHour`, `bestOpenedExpPerHour` | level progress; ETA = (expReq − exp) ÷ (rate × expPerKill); ratio flag |
| `purpose.skillDoor` | `skills[skill]`, generated door list | level progress, yes/no |
| `purpose.toolChain` | `tools`, `skills[skill].level`, generated tool table | yes/no |
| `purpose.stampMaterial` | `stamps[].itemReq/materialCost/ownedMats` | shortfall count, yes/no |
| `purpose.roleSkill` | `class`, `stage.roles` | yes/no |
| `purpose.labChain` | Lab connection fields (M1 adds them at W4) | yes/no |
| `purpose.milestoneCrossed` | the previous save in `history`, same Goal counter | `MilestoneCrossing[]` |

Each Detector gets fires and doesn't-fire tests on both private fixtures (local only) and on the public and scrubbed fixtures (CI). That follows #14 item 7 and #11 item 12.

**TR-6 Rates.** Fighting rates come only from `CharacterState.fighting`, the identity call on the saved map, which equals Toolbox's Stats page (#16). M4 never calls `getMaxDamage`. `bestOpenedExpPerHour` comes from the hypothetical sweep run in the parse Worker (M1, shared with M5). If the sweep is absent, `contrib.fight.class-exp` is skipped with a warning, never guessed.

**TR-7 Performance.** `derivePurposes` takes ≤ 15 ms for 11 characters on a mid-range laptop, and ≤ 5 ms per extra history save scanned (only the previous save is scanned). The hypothetical sweep is budgeted in M1/M5 (≤ 1 s per save in the Worker, from #16's ~0.5 s for 6 characters × 51 maps). M4 allocates no per-map arrays.

**TR-8 Storage.** M4 stores nothing. It reads save history from IndexedDB through the engine input (M1). Skip today and Not for me on stop-here suggestions are M10's, keyed by `(contributionId, goalId, milestone)`, so a dismissal never hides the next Milestone's suggestion.

**TR-9 Security and privacy.** Outputs carry the character index, never names. The UI joins names locally. `stamps[].bestCharacter` (a name, #16) is stripped in the Account State. Provenance records field paths and entry ids, never save values. Nothing in M4 leaves the device.

**TR-10 Golden snapshots.** The golden Now-screen snapshot per fixture (#11 item 12) includes every character's `Purpose` (status, headline, top 3, stop-here). Any Knowledge Base PR that changes a Purpose shows up in the snapshot diff.

## 6. States and edge cases

| State | Behaviour |
|---|---|
| **Loading** (first parse not done) | No Purpose. M10 shows its skeleton |
| **Empty account / broken parse** | No Purpose at all; M1's "Can't read your save" (US-9) |
| **Section warning** (e.g. `upgradeVault` failed) | Goals reading that section are dropped; affected characters may become `cannot-tell` (FR-18) |
| **No history yet** (first save) | No "Reached" lines; projection still works (it uses `secondsSinceLastSave`, not history) |
| **Character not claimed for days** | Projection may pass the next Milestone. Progress shows "~", the stop-here uses the projected value, and "Reached" waits for a save that confirms it |
| **Character being played actively** | Kills come faster than the AFK rate. The ETA still uses the AFK rate, labelled "at AFK pace" |
| **Rate 0** (can't hit, dies) | "not progressing", not worthwhile (FR-5). M3 owns any safety blocker |
| **Skilling map with several targets** | The saved `targetMonster` is used, never `mapEnemiesArray` (#16: a mining Squire's Gold vs Iron) |
| **Goal complete** (card at max, last skull) | Shown as "complete" under "show more", never worthwhile |
| **Several characters on one map** | Account counters sum their rates. Each feeder's row shows the same account Goal, and the stop-here shows on each |
| **Stale patch** (save game version > parser pin) | Generated ladders may be wrong. Goals still show with the Stale badge, and M1's banner explains. Detector failures fail closed |
| **Entry Stale** (≈10 patches old) | Shown, Stale badge, ranked below fresh ones (FR-10) |
| **Offline** | M4 is pure and runs on the last good Account State. The "last cloud save Ns ago" line (M10) covers freshness |
| **Multiple tabs** | Each tab computes the same output (FR-17). M4 writes nothing, so there are no conflicts |
| **Second account in the same browser** | Not supported (one account per browser, #10). History is keyed by account uid, so Purposes never mix histories |
| **Character with no AFK Target** (town, `Nothing`) | `no-activity`, Unknown, "What is this character for?" |
| **W4+ AFK types** (Cooking, Divinity, Spelunking) | `not-covered` until entries exist. Lab is covered at W4-entry, but untested on a real save (Leverage model Q5) |
| **Boss, dungeon or crystal-mob target** | No Contribution matches, so the status is `none`. A boss key Goal is M6's |
| **Expected Return shorter than every ETA** | No stop-here. The Purpose still shows |
| **Clock skew** (save `asOf` in the future) | `secondsSinceLastSave` is clamped at 0 by M1, so there is no negative projection |
| **Patch renames a Toolbox field** | M1's adapter throws `AccountShapeError` in contract tests before release. M4 never sees half-shaped data |

## 7. Dependencies

| Module | What M4 needs | Interface |
|---|---|---|
| **M1** Sync & Account State | the TR-2 fields; `fighting` identity rates; `bestOpenedExpPerHour` sweep; save history; section warnings | `AccountState`, `history: AccountState[]` |
| **M2** Stage & Meta Path | Stage; pusher index; push route; Roles (class → Role skill); Priority List position per Goal item | `StageResult { stage, pusherIndex, pushRoute, roles, priorityPosOf(itemId) }` |
| **M3** AFK Safety | consumes `Purpose.status` to compose the Verdict (safety blockers first, then Purpose) | `Purpose[]` |
| **M5** Higher-leverage options | consumes `exhausted`/`none`/stop-here reasons; supplies the one suggestion M4 links to | `Purpose[]` in, `Option \| null` per character out |
| **M7** Spend Plan | when a Vault kill row is at Lv 0, M7 owns "buy the row"; M4 marks the Goal `rule` not-worthwhile | shared entry ids |
| **M8** Collections | authors the per-class card lists that `contrib.fight.card` reads; owns card equip actions | `cardList(class, stage)` entries |
| **M10** Now screen UI | renders the headline, Focus block, stop-here, prompts, badges; owns Skip and Not for me | `Purpose[]` |
| **M11** Knowledge tooling | schema additions (TR-4), the Goal-ladder generators, CI source checks, Detector test harness | YAML schema, generator scripts |
| **M13** Suggestions | "Report this" on a Purpose files with the TR-9 payload | report payload |

## 8. Open decisions for Yasser

❓ D1 - Stop-here horizon: when is the next Milestone "too far" to keep going? (a) one global number of hours (e.g. 24 h); (b) a multiple of the Expected Return (e.g. 3×); (c) per-entry authored hours, with a default.
➡️ (c), with a default of **24 h** of AFK, and never below the current Expected Return. The right horizon is System judgment: Vault kill rows are "worth it only to cross the next power of 10 cheaply", while Death Note skulls are a multi-session Goal (48 h). The floor at the Expected Return stops a "stop here" from firing on something that finishes while you sleep anyway.

❓ D2 - Does a Purpose that runs out before the Expected Return change the Verdict? (a) No, it's a suggestion line and the Verdict stays Ready; (b) it becomes Fix before you leave; (c) Ready with a warning style.
➡️ (a). #10 keeps the Verdict for AFK safety plus "serving a worthwhile Purpose", and the character *is* serving one until the Milestone. Making it a blocker would turn every Vault step into a red row and train players to ignore Fix. The stop-here line plus M5's option carries the advice.

❓ D3 - When does Class EXP count as a worthwhile Purpose ("XP: too low for your level")? (a) EXP/h here ≥ 50% of the character's best opened map; (b) ≥ 75%; (c) Class EXP never counts on its own.
➡️ (a), **50%**. Every fighter earns EXP, so (c) would make many plain levelling fighters Unknown. 75% would flag near-equal maps on noise in an unverified-at-W1–W3 rate (#16 caveat 1). Under half is clearly wrong. That is what the prototype's "too low for your level" meant, and M5 then names the better map.

❓ D4 - Is the Purpose block part of the "at most 3 Goals per character" cap (#10 item 5)? (a) Separate: a one-line Purpose headline on the row, up to 3 Purpose lines in Focus, and the 3-Goal cap stays for Next Actions; (b) Purpose Goals count against the 3.
➡️ (a). Purpose describes what the character is already doing and needs no action, while the 3-Goal cap exists to limit what the player must *do*. Mixing them would push real Next Actions behind "show more". The stop-here line, which *is* an action, counts as one of the 3.

❓ D5 - Do portal Goals count for characters other than the pusher? (a) Pusher only (the push route, Priority position 2); (b) any character, when the portal ETA is within the horizon; (c) never as worthwhile, display only.
➡️ (a). The 2026 norm is one pusher (PV cross-cutting 1). A side-map portal on another character (e.g. the W2-late Barbarian's 2,814 of 20,000 on Poopy Sewers) is not Leverage by any Source. Other characters' portal progress still shows in Focus, under "show more".

❓ D6 - When is a skilling activity `serving`? (a) Only when a concrete Goal is live: next door not reached, tool-chain ingredient, or stamp shortfall; (b) also when the skill is the class's Role skill (e.g. Barbarian fishing, Squire mining is not); (c) any skilling counts.
➡️ (b). (c) makes every skiller Ready and hides drift. (a) alone would mark a Role-correct skiller "What is this character for?" once it passes its last door before W4. The Role keeps that case Ready, and M5 still compares efficiency for "better fit".

## 9. Red-team notes

1. **Wrong ETAs.** Toolbox's `finalKillsPerHour` has never been live-checked at W1–W3 (#16 caveat 1), and a 2× error flips stop-here timing. *Defence:* ETAs only drive suggestions, never a Verdict. Every ETA shows "~". M12 runs a one-time calibration: Yasser compares one character with in-game AFK Info, and the result is recorded in the golden snapshot.
2. **Purpose too permissive, so false Ready.** If anything matched, a Lv 54 Bowman on map 1 would read Ready. *Defence:* the worthwhile test is separate from matching (FR-7). Class EXP needs the D3 ratio, cards need a first copy or an authored list, Death Note needs the building, and Vault rows need a level. US-5 pins two real `exhausted` cases from the W2-late fixture.
3. **Purpose too strict, so Unknown everywhere.** That trains players to ignore Unknown. *Defence:* `not-covered` is separate from `none` (FR-8, US-8), so missing knowledge never reads as a judgment. The Role-skill rule (D6) keeps correct skillers Ready. Unknown never blocks and never turns red. A wrong Unknown is one tap from Report this.
4. **Stale counts for unvisited characters.** The cloud save holds kills only up to that character's last claim, so a fighter left 20 h shows yesterday's progress. *Defence:* FR-9 projection, "~" labels, and "Reached" only on confirmed saves.
5. **Patch breakage.** A patch moves a Vault row, adds Death Note ranks, or renames `nextPortal`. *Defence:* ladders are generated at every re-sync (ADR 0007), so they can't rot silently. Renames fail M1's contract tests. Detectors fail closed (FR-18), and the Stale badges and patch banner show the risk.
6. **Account-wide counters treated per character.** Vault and Death Note kills are summed over characters. An ETA using one character's rate is wrong when two farm the same mob. *Defence:* summed feeder rates (FR-4), and every feeder row shows the same Goal and ETA.
7. **Privacy leak.** Toolbox embeds a character name in `stamps[].bestCharacter`, and provenance could copy save values into a Report. *Defence:* stripped in M1 (TR-2), outputs keyed by index (TR-9), provenance holds paths not values, and the Report payload is #11's fixed list.
8. **Stop-here nagging.** If it fires every save until the character moves, players learn to ignore it. *Defence:* once per (Goal, Milestone), with Skip today and Not for me keyed to that Milestone (TR-8), and it never changes the Verdict (D2).
9. **Repeating the prototype's mistake.** The Copper Squire was told to mine Iron because of XP. *Defence:* skilling is never judged on EXP or rates (FR-6). Purposes come from material, door, tool and Role Contributions (US-4). "Better" skilling choices are M5's, and only when Toolbox efficiency agrees.
10. **Missing Goal families make a real Purpose look empty.** The cases are quest-item farming (Kebab Sticks), boss-key routes, and crystal mobs for statues. *Defence:* these show `none` with a reason, not `exhausted`. M13 Suggestions and Report this feed new Contributions through the #11 pipeline, and the quest-item family is the first follow-up (out of scope, section 2).
11. **Card ETAs mislead.** The base chance ignores `CardChanceMulti` (≥ 1.2, not in Toolbox), so the ETA is an upper bound. *Defence:* it is labelled "up to … at the base drop rate" (`bound: 'upper'`), and the horizon test uses the upper bound, so the error only ever makes a card Goal look *less* worthwhile.
12. **Contested Sources tip a Verdict.** *Defence:* order-contested Goals count but never headline over an uncontested one. Usefulness-contested Goals never make a Purpose `serving` (FR-15), which keeps #11's "never a Verdict blocker or the top action" in spirit.
