# M2 Stage & Meta Path

Spec for [#30](https://github.com/YassSoliman/idleon-forge/issues/30), part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Third module in the build order (M1 → M11 → **M2** → M10 → M13 → M3 → M6 → M4 → M7 → M8 → M9 → M5, with M12 alongside), so every later game-logic module (M3–M9) ranks its output through what M2 produces.

Terms follow [`GLOSSARY.md`](../../GLOSSARY.md) exactly. Decisions this spec rests on:
- [ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md): advice is deterministic; no LLM at advice time.
- [ADR 0004](../adr/0004-source-precedence.md): Source precedence; every entry records the patch it was verified on.
- [ADR 0005](../adr/0005-toolbox-numbers-not-our-formulas.md): Toolbox numbers plus arithmetic; no formulas of ours.
- [ADR 0006](../adr/0006-client-only-spa-parsing-in-a-worker.md): Toolbox code runs only in the Web Worker.
- [ADR 0007](../adr/0007-generated-facts-authored-judgment.md): game facts generated, judgment authored.
- Resolutions of [#26](https://github.com/YassSoliman/idleon-forge/issues/26) (Leverage model; the backbone of this spec), [#27](https://github.com/YassSoliman/idleon-forge/issues/27) (priority verification, abbreviated **PV**, which wins on conflicts), [#11](https://github.com/YassSoliman/idleon-forge/issues/11) (Knowledge Base shape), [#13](https://github.com/YassSoliman/idleon-forge/issues/13) (MVP cut), [#3](https://github.com/YassSoliman/idleon-forge/issues/3) and [#15](https://github.com/YassSoliman/idleon-forge/issues/15) (Meta Path sources and slots), [#16](https://github.com/YassSoliman/idleon-forge/issues/16) (hypothetical math), [#10](https://github.com/YassSoliman/idleon-forge/issues/10) and [#12](https://github.com/YassSoliman/idleon-forge/issues/12) (Now screen), [#14](https://github.com/YassSoliman/idleon-forge/issues/14) (architecture), [#17](https://github.com/YassSoliman/idleon-forge/issues/17) (provenance).
- Sibling drafts read for interfaces: M1 (`spec/M1-sync-account-state`, the Account State and its growth rule TR-11) and M10 (`spec/M10-now-screen-ui`, the `EngineResult` contract).

Research inputs: `research/leverage-model` (§1 Stages, §3 Priority Lists, §4 Roles), `research/priority-verification`, `research/community-guides`, `research/hypothetical-math`, and the eight dossier branches. Fixture facts below were re-read on 2026-10-17 from the two private fixtures at Toolbox pin `6c37e3d` (game 2.3.540). Only aggregates, classes and levels appear here.

Markers: **[new]** specified here for the first time; **[from #26]** taken as-is from the Leverage model; **[changed]** differs from the Leverage model, with the reason given inline.

## 1. Purpose

M2 answers "where is my account on the route, and who on my team does what?" From the save alone, it places the whole account on one **Stage** (W1-early … W4-entry). It knows the **Meta Path**: which classes the account should have in which slots, the **Role** each class plays, and the per-world milestones that open the next world. It picks the **pusher**, the one character that should be opening the next portal, using Toolbox's kill-rate numbers rather than opinion. And it hands the rest of the engine the Stage's **Priority List**, so that every Goal from every module is ranked the same way: never-skip things first, then the push, then free empty slots, then the Stage's own System items. The player sees M2 mostly indirectly, as the order of their advice. Directly, they see the push Goal ("Open World 3: finish Djonnut's quest 2 on your Barbarian"), the next-character Goal ("your next character should be a Hunter, 43 family levels away"), the subclass and elite Goals, and the Stage label in the Now-screen header ("World 2 · late", D5).

## 2. Scope / Out of scope

**In scope**
- Stage detection: a pure Detector over the Account State, with its evidence and its certainty.
- The Meta Path Knowledge Base entries: the Stage table, the slot plan, the Roles, the per-world gate chain, and the pusher rule.
- Roster analysis: map each character onto a Meta Path slot, find missing class lines and duplicates, and say whether each duplicate is on-path (the PV Course Correction rule only).
- Pusher selection by Toolbox `finalKillsPerHour` on the frontier map, computed in the Web Worker.
- The Meta Path Goals: the push Goal (position 2 of every list), subclass (W2), the world tutorial chains (Hoggindaz 1–5 in W3, Gobo 1–5 in W4), the elite Goal (W4-entry), and the next new character.
- Priority List selection and ranking: the shared frame, the per-Stage list files, and the comparator every module's Goals are ranked with.
- Role-derived Visit Order hints and the Role-owner lookup that M5 uses for "better fit".
- The Account State fields M2 needs (requested from M1 under its TR-11 growth rule) and the generated game-fact entries M2 needs (requested from M11 under ADR 0007).

**Out of scope**
- **Contents of the System items** (positions 1, 3 and 4+). The never-skip and free-value items are M6's. Vault, stamps and bribes are M7's. Cards and obols are M8's. Talents are M9's. M2 owns the list files and their order; each referenced entry and its Detector belong to its module.
- **Verdicts and AFK safety** (M3), **Purpose and Milestones** (M4), **Higher-leverage options** (M5). M2 only supplies the Role table and the pusher to them.
- **Computing the Visit Order** (engine core, rendered by M10). M2 only supplies hints.
- **Full Course Correction** (reset, reassign or live with a drifted account) and **per-character Meta Path overrides**: both stay in "Not yet specified" on #1. M2 implements only the PV rule: a duplicate Squire is on-path, the Sub Class Swap Token is never suggested unless the sibling rule fits, and a missing class line is filled by a new character.
- **Map-progress sub-staging** (#26 Q1). The pusher's route progress is used only for the pusher and the push Goal, never to split Stages.
- **Stages past W4-entry** (Worlds 5–7): see D2.
- **A playstyle picker** or a second Meta Path (#1 out of scope).
- **Rendering.** M10 decides where the Stage label, the push Goal and the roster notes appear.

## 3. Functional requirements

**Stage**
- **FR-1** The engine derives exactly one Stage per Account State, from the 10 values in TR-4, evaluated by the rules in TR-5. The same Account State and Knowledge Base always give the same Stage.
- **FR-2** The Stage carries its evidence: the rule that matched and the field values that decided it (provenance, #14 item 4 and #17). A Report this or a Suggestion carries the Stage id only.
- **FR-3** When a field that decides between two Stages in the same world is unknown (its parser section failed, per M1 `diagnostics.failedSections`), the Stage is the **earliest** Stage of that world consistent with the known fields, and its certainty is `partial`. When `finishedWorlds` itself is unknown, the Stage is `null` with certainty `unknown`: only Stage-independent output (Verdict blockers) is shown, plus "Can't tell where your account is on the route".
- **FR-4** The Stage includes what the account needs to reach the next Stage (`next.needs`, one line per unmet condition), or `null` at W4-entry. The Stage `label` and `next.needs` are shown to the player as a small header label that opens `next.needs` on tap (D5); M10 owns the placement.
- **FR-5** An account past the coverage of the 10 Stages (World 4 finished, or later) is flagged `coverage: 'beyond'` and treated as `W4-entry` (D2). It gets the "Not covered yet: Worlds 5–7" banner and only Stage-independent advice: Verdict blockers, the position-1 never-skip items and the position-3 free-value fills. No push, next-character, elite or world-tutorial Goal is produced, and no W4-entry System item from position 4 on.

**Meta Path and roster**
- **FR-6** Each character is mapped to one Meta Path slot (TR-8): the highest-level character of each subclass line takes that line's slot in 1–6, a duplicate Squire line takes slot 8, a Journeyman takes slot 7, and other duplicates take slots 9–10 (contested) or "off-path".
- **FR-7** Each character gets the Roles of its class line from the Role entries (TR-9). A Role that the current Stage does not activate yet (e.g. Construction before W3) is listed as dormant, not active.
- **FR-8** The roster lists the subclass lines the account is missing. The **next new character** is the missing line whose Role activates earliest at or after the current Stage. Ties follow the #15 slot order (Barbarian, Squire, Bowman, Hunter, Shaman, Wizard). When slots 1–6 are all filled, the next is Journeyman, then the 2nd Squire.
- **FR-9** The next-character output states the family level now, the family level that opens the next slot (generated thresholds 8 / 30 / 70 / 150 / 300 / 500 / 750 / 1,100 / 1,500 / 5,000), and the gap. While the slot is closed it is an Account-section note, not a Goal. Once the slot is open it becomes a Goal whose Next Action is "Create a character; pick <base class> at level 10, then <subclass> at Speccius".
- **FR-10** A duplicate Squire line is marked on-path ("2nd Squire → Divine Knight → Royal Guardian", PV 1.1). The Sub Class Swap Token is never suggested unless the duplicate's sibling subclass (8 ↔ 9, 20 ↔ 21, 32 ↔ 33) is the one the slot plan wants and the account does not already have it.

**Pusher and push Goal**
- **FR-11** The pusher is chosen by TR-10: among characters able to fight, the one with the highest Toolbox `finalKillsPerHour` on the frontier map, subject to the incumbent rule (D1). The choice is recomputed on every save.
- **FR-12** The push Goal is position 2 of every Stage's Priority List. Its one Next Action is the next step of the current world's gate chain (TR-11) for the pusher: kill the remaining monsters for the next portal (with an ETA from `finalKillsPerHour`, ADR 0005), or the next boss-chain step (quest, boss, crystal, gatekeeper).
- **FR-13** When no character can fight the frontier (every candidate at 0 final kills/h), the pusher is `null`, the push Goal's Next Action is "Nobody can fight <map> yet" with the strongest candidate's hit chance, and the Goal carries the wall reason (hit < 100% or survivability < 100%).
- **FR-14** The pusher class choice is contested in Sources (Barbarian vs Squire in W1–W3, DK vs ES in W4, PV cross-cutting 2). The push Goal itself is not contested. Its Source popover shows both class Sources and states that ActiveOn picked by kill rate.

**Meta Path Goals**
- **FR-15** Subclass Goal (W2 and later): one per character still on a base class (classIndex 7, 19 or 31) at level ≥ 10, on that character's row.
- **FR-16** World tutorial Goals: Hoggindaz 1–5 (W3-early onward, until any character completes Hoggindaz 5) and Gobo 1–5 (W4-entry). The Next Action names the character with the most progress, and the next quest by its in-game name.
- **FR-17** Elite Goal (W4-entry): one per subclass character without an elite, with DK and ES first (PV 6.2) and the rest in the unverified order BC, BB, BM, SB at confidence L.

**Priority Lists**
- **FR-18** Each Stage has one Priority List built from the shared frame (TR-13): position 1 never-skip, position 2 push, position 3 free-value fills, then the Stage's System items from position 4. Ties are allowed. There are no numeric weights anywhere.
- **FR-19** All Goals from all modules are ranked with one comparator (TR-14): Verdict blockers first, then Priority List position, then fresh before Stale, then the arithmetic tie-breaks (cheapest, then closest Milestone, then most Goals per activity), then entry id, so the order is total and stable.
- **FR-20** A Contested entry never ranks first in any list it appears in (a character's Goals or the Account section). It is moved directly below the first non-contested entry.
- **FR-21** A Goal whose entry is not on the current Stage's list ranks after every listed position. CI warns when an entry's `appliesTo` names a Stage whose list does not reference it.
- **FR-22** A Stage list never shows a Goal from a later Stage's System that is not unlocked yet. Each entry's own Detector gates on its unlock. The sanity check is that nothing from W3 fires on the W2-late fixture.

**Roles in the rest of the engine**
- **FR-23** M2 exposes `roleOwnersOf(activity)` (which characters' Roles own an AFK Target or Parallel Slot) for M5's "better fit".
- **FR-24** M2 emits Visit Order hints from Roles (leverage-model §4.3): pooling Roles (Wizard with Charge Syphon) after the characters they pool from; cooldown Roles (the Squire's Refinery Throttle, the Maestro's Printer Go Brrr) flagged when their cooldown is up; and, when a Hunter has Eagle Eye in a preset, trap-only stops are skipped. Coin holders first in the spend phase is arithmetic, left to the engine core.

## 4. User stories

Acceptance criteria use the two private fixtures (gitignored, run locally only, M1 TR-17): the **W2-late account** (5 characters: Barbarian 60, Wizard 56, Bowman 54, Shaman 44, Squire 43; family level 257) and the **W3-early account** (6 characters: Squire 85, Wizard 73, Bowman 60, Barbarian 56, Shaman 54, Squire 51; family level 379). CI runs the same assertions on the scrubbed W2 save, and on the public saves for the beyond-coverage paths. The clock is frozen at 2026-10-17T12:00:00Z.

**S1. Know where my account is**
As a player in a Play Session, I want ActiveOn to know my Stage without asking me, so that advice fits where I actually am.
- Given the W2-late account / When the engine runs / Then the Stage is `W2-late` with certainty `certain`, matched by rule `w2-late`, with evidence finishedWorlds = [1], highest level 60, and Djonnut dialogue > 0 on 2 characters.
- Given the W3-early account / When the engine runs / Then the Stage is `W3-early`, matched by rule `w3-early`, with evidence finishedWorlds = [1, 2], Death Note building level 0, 3D Printer level 4, and 0 characters with Hoggindaz 5 complete.
- Given the W2-late account / When the engine runs / Then `next.needs` reads "A character talks to Constructor Crow (finishes World 2)". Given the W3-early account / Then it lists "Build the Death Note to level 1" and "Finish Hoggindaz 5 on any character", and does not list the 3D Printer (already level 4).
- Given the W3-early account with only the `towers` parser section marked failed / When the engine runs / Then the Stage is still `W3-early` with certainty `certain`, because nobody has completed Hoggindaz 5, which decides the rule whatever the buildings are.
- Given a copy of the W3-early account with Hoggindaz 5 marked complete and the `towers` section marked failed / When the engine runs / Then the Stage is `W3-early` (the earliest Stage still possible) with certainty `partial`, and `buildings.deathNote` and `buildings.printer3d` are named in the evidence as unknown.
- Given Toolbox's public W7 save `highend.json` / When the engine runs / Then the Stage is `W4-entry` with `coverage: 'beyond'` (D2), the "Not covered yet: Worlds 5–7" banner is requested, and no push Goal, next-character Goal, elite Goal or position-4+ item is produced. Verdict blockers and position-1 and position-3 items still rank.

**S2. Know who should push**
As a player in a Play Session, I want to be told which character opens the next portal, so that I don't spread my fighting across five half-pushers.
- Given the W3-early account / When the engine runs / Then the frontier map is Thermonuclear Climb (the first W3 route map no character has cleared), the pusher is the **Squire 85** with 1,065 final kills/h there, the next-best candidate is the Barbarian 56 at 472, and the four others are below 30.
- Given the W2-late account / When the engine runs / Then every W2 route map is cleared by at least one character, so the frontier falls back to the hardest W2 route map, Sands of Time (3,000 kills to open), and the pusher is the **Barbarian 60** at 1,680 final kills/h (Bowman 54: 1,496; Shaman 44: 1,368; Wizard 56: 1,193; Squire 43: 57).
- Given either fixture / When I open the push Goal's Source / Then I see both pusher-class Sources (Barbarian: Idleon Academy and Reddit; Squire: the Incomplete Guide and the shnaps gist) and the line "ActiveOn picked by kill rate on <map>".

**S3. Know the next step to the next world**
As a player in a Play Session, I want the one next step that moves my account to the next world, so that I keep pushing without looking up the quest chain.
- Given the W2-late account / When the engine runs / Then the push Goal (position 2) is "Open World 3". Its Next Action is on the Barbarian 60's row: "Finish Djonnut's quest 2" (Djonnut 1 is done by that character, Djonnut 2 is in progress, and the account holds 0 Glacier Quartz), with why "Djonnut 1–2, then Efaunt, gives the Glacier Quartz for Constructor Crow".
- Given the W3-early account / When the engine runs / Then the push Goal is "Push World 3". Its Next Action is on the Squire 85's row: "Kill 14,981 more on Thermonuclear Climb to open the next portal", with an ETA of about 14 h (14,981 ÷ 1,065 kills/h).
- Given the W3-early account / When the engine runs / Then a separate Goal, "Finish the W3 tutorial", is at position 4 with the Next Action "Finish Hoggindaz 1 (Turn ON for what???)" on the Squire 85's row, the only character with it in progress.

**S4. Know which character to make next**
As a player in a Play Session, I want to know which class my next character should be and when I can make it, so that my account covers every Role.
- Given the W2-late account / When the engine runs / Then the roster shows 5 of 6 subclass lines (missing: Hunter), 5 of 5 character slots used, and the Account-section note "Next character: Hunter. Slot 6 opens at family level 300 (43 to go)". It is a note, not a Goal.
- Given the W3-early account / When the engine runs / Then the roster shows the Squire 51 in slot 8 as "2nd Squire (on the Meta Path: → Divine Knight → Royal Guardian)", missing line Hunter, and the note "Next character: Hunter. Slot 7 opens at family level 500 (121 to go)". No Sub Class Swap Token suggestion appears anywhere.
- Given the W2-late account with family level raised to 300 in the fixture copy / When the engine runs / Then the note becomes a Goal: "Make a Hunter: create a character, pick Archer at level 10, then Hunter at Speccius".

**S5. Know my roles**
As a player in a Play Session, I want each character's Role on the Meta Path, so that I understand why a character is told to do a particular job.
- Given the W3-early account / When the engine runs / Then the Squire 85 has Roles {pusher, Construction builder, Refinery Throttle}, the Squire 51 has {Construction builder (2nd)}, the Wizard 73 has {Worship, prayer slots}, the Shaman 54 has {Alchemy}, the Bowman 60 has {Catching, Archer-line Smithing}, and the Barbarian 56 has {Fishing, AFK fighting}. All are active at W3-early.
- Given the W2-late account / When the engine runs / Then the Squire 43's Construction Role and the Wizard 56's Worship Role are dormant (they activate at W3-early), and `roleOwnersOf('Trapping')` is empty (no Hunter).

**S6. One consistent order for everything**
As a player in a Play Session, I want advice ordered the same way every time, so that the top item is always the thing to do first.
- Given the W2-late account / When the engine runs / Then the Account section lists position-1 items (vial attempts, capped Water, Arcade balls) before the push Goal, and the push Goal before position-3 fills (big bubbles, cards, obols, tools). This is the leverage-model §5.1 order.
- Given the W2-late account / When the engine runs twice with the same `now` / Then both rankings are identical, element by element.
- Given a synthetic Account section where the contested cog-type entry (PV 5.5) would sort first / When the engine ranks it / Then the cog entry lands second, directly below the first non-contested Goal, and carries the "sources disagree" badge. On the W3-early account, none of the contested entries (cogs, first prayers, W3 merit order, first Gem Shop buy) is first in any list.
- Given the W2-late account / When the engine runs / Then no Goal whose entry `appliesTo` only W3 Stages appears (Equinox, salts, Death Note).

**S7. Get subclass and elite nudges**
As a player in a Play Session, I want to be told when a character is due for its subclass or elite, so that no character stays a base class by accident.
- Given the W2-late or the W3-early account / When the engine runs / Then no subclass Goal appears (every character is subclassed).
- Given the W2-late account with a Lv 12 Archer (classIndex 19) added to the fixture copy / When the engine runs / Then that character's row has the Goal "Take your subclass at Speccius", and the Stage stays `W2-late` (see D3).

## 5. Technical requirements

### Package boundaries

- **TR-1** Code lives in `packages/engine/src/meta-path/`:
  - `stage.ts` (Detector `stage.detect`);
  - `roster.ts` (`metapath.roster`);
  - `pusher.ts` (`metapath.pusher`);
  - `gate-chain.ts` (`metapath.push-step`, `metapath.world-tutorial`, `metapath.subclass-pending`, `metapath.elite-pending`);
  - `priority.ts` (`priority.select`, `priority.compare`);
  - `roles.ts` (`roleOwnersOf`, `visitHints`).

  Each is a pure function of `(state: AccountState, kb: KnowledgeBase, now: number)`. None imports `toolbox-parsers`. None reads the clock, IndexedDB or the network.
- **TR-2** The only Toolbox call M2 needs, `getMaxDamage` on a clone moved to the frontier map, runs **inside the parse worker**, right after the parse, and its result is written into the Account State as `account.frontier` (TR-3). The engine stays pure and synchronous ([#14](https://github.com/YassSoliman/idleon-forge/issues/14) item 4). M1's `what-if` message stays reserved for M5's open-ended queries. The clone is the one verified in `research/hypothetical-math` §2. It swaps `mapIndex`, `targetMonster`, `afkType`, `afkTarget` and `currentMap`, and it is contract-tested with the identity check (the clone on a character's own map equals the direct call).

### Data

- **TR-3** Account State fields M2 needs. Each one is requested from M1 through its TR-11 process: typed in `types.ts`, read only in `adapter.ts`, listed in `FIELD_SOURCES` and `FIELD_SECTIONS`, `null` when absent.

  ```ts
  // additions to CharacterState
  classIndex: number;                       // Toolbox characters[].classIndex
  /** Only the gate NPCs M2 reads; never the whole dialogue map. 9999 is kept as-is (Toolbox reads it as "met"). */
  npcDialog: Partial<Record<GateNpc, number>>;
  /** Toolbox characters[].nextPortal for the character's current map. */
  nextPortal: { goal: number; current: number } | null;

  // additions to AccountSummary
  familyLevel: number | null;               // account.accountLevel (sum of class levels)
  buildings: { deathNote: number | null; printer3d: number | null; atomCollider: number | null }; // account.towers.data[name].level
  saltsUnlocked: boolean[] | null;          // account.refinery.salts[i].unlocked, index 5 = Nullo
  /** Per gate quest: indices of characters that completed it (Toolbox getQuests `completed[]`), and who stands on it now (`progress[]`). */
  gateQuests: Record<GateQuestId, { completedBy: number[]; inProgressBy: number[] }>;
  /** Counts in storage plus every inventory: Crystal1 Desert Topaz, Crystal2 Glacier Quartz, Crystal3 Galaxial Amethyst. */
  worldCrystals: { desertTopaz: number; glacierQuartz: number; galaxialAmethyst: number } | null;
  /** Computed in the worker (TR-2). Null before W1 portals exist or when the section failed. */
  frontier: Frontier | null;

  export type GateNpc = 'Builder_Bird' | 'Constructor_Crow' | 'Carpenter_Cardinal'
    | 'Dog_Bone' | 'Djonnut' | 'Bellows' | 'Speccius' | 'Postboy_Pablob';
  export type GateQuestId = `${'Dog_Bone' | 'Djonnut' | 'Hoggindaz' | 'Bellows' | 'Gobo'}${number}`;

  export interface Frontier {
    world: number;                          // the account's currentWorld
    mapIndex: number;
    mapName: string;                        // Toolbox name, e.g. "Thermonuclear_Climb"
    kind: 'uncleared' | 'hardest-cleared';  // TR-10 step 1 or its fallback
    /** Route maps of this world each character has cleared (Toolbox hasClearedMap). */
    routeCleared: Array<{ characterIndex: number; count: number; of: number }>;
    /** One row per character with level > 0; zeros kept so "nobody can fight" is visible. */
    fights: Array<{
      characterIndex: number;
      finalKillsPerHour: number;
      hitChance: number;                    // 0..1
      survivability: number;                // 0..1
    }>;
  }
  ```

  Correction to the Leverage model: §1.1 reads quest completion from `progress[].status`. In Toolbox `getQuests` (at `6c37e3d`), `progress[]` is only the quest each character currently *stands on*, and completion is in `completed[]`. M2 uses `completed[]`. On both fixtures, this is the difference between "Djonnut 1 done by the Barbarian" (true) and "not started" (what `progress` alone suggests).

- **TR-4** Stage ids and labels:

  ```ts
  export type StageId =
    | 'W1-early' | 'W1-mid' | 'W1-late'
    | 'W2-early' | 'W2-mid' | 'W2-late'
    | 'W3-early' | 'W3-mid' | 'W3-late'
    | 'W4-entry';

  export interface StageResult {
    id: StageId | null;                     // null only when certainty is 'unknown'
    label: string;                          // "World 2, late"
    world: 1 | 2 | 3 | 4 | null;
    certainty: 'certain' | 'partial' | 'unknown';
    coverage: 'covered' | 'beyond';
    rule: string | null;                    // e.g. "w2-late"
    evidence: Array<{ field: string; value: unknown; known: boolean }>;
    next: { stage: StageId; needs: string[] } | null;
    provenance: Provenance;                 // M10 TR-2 shape: { entryIds, fields }
  }
  ```

  `EngineResult.stage` (M10 TR-2) is `{ id, label }` from this result. `id` is `"unknown"` when null.

- **TR-5** Stage rules **[from #26 §1.2, with the [changed] items marked]**. The rules are evaluated top to bottom and the **last** rule that holds wins. Worlds are mutually exclusive through `finishedWorlds`, so "last wins" only orders the bands inside a world. `maxLv` = max character level. "Subclassed" = classIndex not in {1, 7, 19, 31} (Beginner and the three base classes). A character counts as a pending base class only at level ≥ 10, because before that it cannot subclass.

  | Rule | Holds when |
  |---|---|
  | `w1-early` | not W1 finished, and maxLv < 14 |
  | `w1-mid` | not W1 finished, and maxLv ≥ 14 |
  | `w1-late` | not W1 finished, and (maxLv ≥ 28 or any `Dog_Bone` dialogue > 0) |
  | `w2-early` | W1 finished, not W2, and (maxLv < 30 or **no character is subclassed yet**) **[changed, D3]** |
  | `w2-mid` | W1 finished, not W2, maxLv ≥ 30, and at least one character subclassed **[changed, D3]** |
  | `w2-late` | W1 finished, not W2, and (any `Djonnut` dialogue > 0 or maxLv ≥ 50) |
  | `w3-early` | W2 finished, not W3, and (Death Note level 0, or 3D Printer level 0, or nobody has completed Hoggindaz 5) |
  | `w3-mid` | W2 finished, not W3, Death Note ≥ 1, 3D Printer ≥ 1, and Hoggindaz 5 completed by someone |
  | `w3-late` | W2 finished, not W3, and (Nullo unlocked (`saltsUnlocked[5]`) **or Galaxial Amethyst > 0**) **[changed]** |
  | `w4-entry` | W3 finished |

  The [changed] W3-late clause closes #26 Q2: Toolbox `items.json` at `6c37e3d` names `Crystal3` = Galaxial_Amethyst (and `Crystal2` = Glacier_Quartz, `Crystal1` = Desert_Topaz). The thresholds 14 / 28 / 30 / 50 are not written into the rule code. The Stage entry references them as generated facts (`gen.town-unlocks.stamps`, `.tasks`, `gen.obol-altar.level`, `gen.town-unlocks.post-office`), so a patch that moves one is visible in the Knowledge Base diff.

- **TR-6** Certainty (FR-3). Each rule declares the fields it reads. When a rule's outcome depends on an unknown field, it is evaluated both ways. When the two answers differ, the earliest Stage of the world that is still possible is taken, certainty becomes `partial`, and the unknown fields go into `evidence` with `known: false`.

- **TR-7** Knowledge Base entries in the #11 shape (YAML, compiled to JSON, schema-checked in CI by M11). **Authored** entries (judgment; ADR 0007):

  | id | type | Contents |
  |---|---|---|
  | `metapath.stages` | meta-path | the 10 Stages: label, rule id, the generated facts each threshold references, the `next.needs` text templates. Detector `stage.detect` |
  | `metapath.slot-plan` | meta-path | slots 1–11 with class line and status (TR-8) |
  | `metapath.role.<class-line>` | meta-path | one per line: Roles, `activeFrom` Stage, owned activities, Visit Order hints (TR-9) |
  | `metapath.pusher-rule` | meta-path | the TR-10 rule and its incumbent margin (D1), both pusher-class Sources |
  | `metapath.gate-chain.w<N>` | meta-path | the ordered steps per world (TR-11), referencing generated quest, boss and crystal facts |
  | `metapath.goal.push` | goal | the push Goal; Detector `metapath.push-step` |
  | `metapath.goal.subclass` | goal | Detector `metapath.subclass-pending` |
  | `metapath.goal.world-tutorial.w3` / `.w4` | goal | Hoggindaz 1–5 / Gobo 1–5; Detector `metapath.world-tutorial` |
  | `metapath.goal.elite` | goal | Detector `metapath.elite-pending` |
  | `metapath.goal.next-character` | goal | Detector `metapath.roster` (fires only when a slot is open) |
  | `priority.frame` | priority-list | the shared positions 1–3 (TR-13) |
  | `priority.<stage>` | priority-list | one per Stage, positions from 4 (leverage-model §3.1–3.10, as corrected by PV) |

  **Generated** entries (game facts from Toolbox data at each parser re-sync; M11 builds the generator):

  | id | From (Toolbox at the pin) |
  |---|---|
  | `gen.class-tree` | classIndex → class name, line, tier (base / subclass / elite / master), swap sibling (`classPromotions.json`; the N.js `ClassSwap` pairs per the character-builds dossier) |
  | `gen.family-slots` | family level per character slot 2–11 (wiki Character_Creation rev 2026-10-07 and Toolbox's `newCharacters` alert, until a data field is found; tier 2, see Red-team R8) |
  | `gen.world-gates` | gatekeeper NPC per world (`quests.ts` `isWorldFinished`), the crystal item per world gate (`items.json` Crystal1–3), the boss per world |
  | `gen.world-routes` | per world, the fighting maps with a first-door kill requirement > 0, in map-index order, with that requirement (`shared-data.json` `mapPortals`, `getFilteredPortals`) |
  | `gen.gate-quests` | quest ids, in-game names and step requirements for Dog Bone, Djonnut, Hoggindaz, Bellows and Gobo (`quests.json`) |
  | `gen.town-unlocks`, `gen.obol-altar` | the highest-class-level gates 14 / 18 / 22 / 28 / 50 and 30 (the W1 dossier's N.js thresholds) |

  Example authored entry (shape only; field names follow #11 item 4):

  ```yaml
  - id: metapath.role.squire
    system: meta-path
    type: meta-path
    text: "{class} · Construction builder"
    why: "Squires add the most build rate on the Cog Board and run Refinery Throttle."
    appliesTo: { stages: [W1-early, W1-mid, W1-late, W2-early, W2-mid, W2-late, W3-early, W3-mid, W3-late, W4-entry], classes: [Squire, Divine_Knight, Royal_Guardian] }
    roles:
      - { id: construction-builder, activeFrom: W3-early, owns: [parallel:cog-seat] }
      - { id: refinery-throttle, activeFrom: W3-early, visitHint: cooldown }
      - { id: pusher-candidate, activeFrom: W1-early }
    confidence: H
    status: active
    sources:
      - { url: "https://github.com/YassSoliman/idleon-forge/blob/research/priority-verification/docs/research/2026-10-17-priority-verification.md", tier: 3, verified: 2026-10-17, gameVersion: 2.3.540, note: "PV 5.6, 2 Squire builders confirmed" }
  ```

- **TR-8** Slot plan **[from #26 §4.1 and the PV adjudication]**:

  | Slot | Class line | Status |
  |---|---|---|
  | 1–6 | one each of Barbarian, Squire, Bowman, Hunter, Shaman, Wizard (slot 1 a Warrior; order inside 1–6 soft) | confirmed set, soft order |
  | 7 | Journeyman (→ Maestro → Voidwalker) | confirmed, but only after 1–6 are all present (PV adjudication 2) |
  | 8 | 2nd Squire (→ 2nd DK → 2nd RG) | confirmed post-RG |
  | 9–10 | 2nd Arcane Cultist / 2nd Death Bringer / 2nd ES | contested |
  | 11 | Beginner, left blank | confirmed in practice |
  | never | 2nd Siege Breaker, 2nd ES (deprecated), 2nd Voidwalker | confirmed |

  Assignment (FR-6) reads `classIndex` through `gen.class-tree`, never a template. Ties inside a line go to the higher level, then the lower character index.

- **TR-9** Roles **[from #26 §4.2]**: Barbarian line (pusher candidate, AFK fighting, Fishing; BB Cooking from W4); Squire line (pusher candidate, Construction builder, Refinery Throttle; DK Rift 8); Bowman line (Catching, Archer-line Smithing); Hunter line (Trapping with Eagle Eye, Tower Defence; BM Breeding); Shaman line (Alchemy brewer; BC Lab split point); Wizard line (Worship with Charge Syphon, prayer slots, Choppin; ES pusher candidate from W4); Journeyman line (Maestro: 3D Printer sample size, Printer Go Brrr). `activeFrom`: Alchemy W2-early; Catching W2-early; Construction, Refinery, Worship, Trapping and prayer slots W3-early; Lab, Cooking and Breeding W4-entry. A Role is attached to the line's highest-level character, plus the 2nd-Squire Role to the slot-8 character.

- **TR-10** Pusher rule **[changed: #26 says "highest `finalKillsPerHour` on the next unopened map" and leaves "next map" undefined]**:
  1. **Frontier map:** the first map in `gen.world-routes[currentWorld]` that no character has cleared (Toolbox `hasClearedMap`). If every route map is cleared (the boss-chain part of a world), use the route map with the highest first-door requirement (`kind: 'hardest-cleared'`).
  2. **Candidates:** characters with level > 0 and `finalKillsPerHour > 0` on the frontier clone. Their current AFK type does not matter: the clone swaps `afkType`.
  3. **Incumbent:** the candidate with the most route maps cleared in the current world. Ties go to the higher `finalKillsPerHour`.
  4. **Pusher:** the candidate with the highest `finalKillsPerHour`, unless the incumbent is within the margin of D1, in which case the incumbent. Remaining ties go to the higher level, then the lower index.

  This needs no save history, so it stays a pure function of one Account State.

  Fixture check (TR-2 clone at `6c37e3d`, frozen clock): W3-early → frontier Thermonuclear Climb (`uncleared`); Squire 85 = 1,065, Barbarian 56 = 472, the rest < 30; the Squire 85 is also the incumbent. W2-late → frontier Sands of Time (`hardest-cleared`); Barbarian 60 = 1,680, Bowman 54 = 1,496, Shaman 44 = 1,368, Wizard 56 = 1,193, Squire 43 = 57; the incumbent (Barbarian 60 and Wizard 56 have both cleared every route map; the tie goes to the Barbarian) is also the fastest.

- **TR-11** Gate chain per world **[from #26 §3 position 2]**. The first unmet step is the push Goal's Next Action:
  - **W1:** route portals → Dog Bone quests on the pusher → Amarok → Desert Topaz (Crystal1) → Builder Bird.
  - **W2:** route portals → Djonnut 1–2 on the pusher → Efaunt → Glacier Quartz (Crystal2) → Constructor Crow.
  - **W3:** route portals → Chizoar → Galaxial Amethyst (Crystal3) → Hoggindaz 9 → Carpenter Cardinal.
  - **W4-entry:** Gobo 1–5 first ("portals onward are blocked without it", PV 6.1), then route portals to map 154 for the elites.

  A step is met from Account State facts:
  - route: the pusher has cleared every route map;
  - quest: in `gateQuests[...].completedBy`;
  - crystal: count > 0;
  - gatekeeper: the world is finished.

  The boss step's Next Action states how many keys of that boss the account holds (M6 owns the key Checks). The step text comes from `gen.gate-quests` names, never hand-copied.

- **TR-12** Visit Order hints (FR-24):

  ```ts
  export interface VisitHint {
    characterIndex: number;
    kind: 'pool-after' | 'cooldown-ready' | 'skip-trap-stop';
    after?: number[];
    roleId: string;
    provenance: Provenance;
  }
  ```

- **TR-13** Shared frame **[from #26 §3.0]**, as the `priority.frame` entry:
  - **position 1, never-skip:** the M6 entries 1a–1i (keys; 1b daily unbanked claims, now only the Random Event and Darts and Hoops on cooldown; daily Alchemy buys, capped stockpiles, weekly, salts, Death Note Lv 1, Equinox bar, W4 shop dailies). Skill-minigame plays, which #26 drafted into 1b, are **not** here (D4, superseded by M6-D4): M6's `minigames.daily-plays` fires only when the plays would be lost before the Expected Return and a highscore Milestone is open, and M10 shows it under "If you have time", outside the ranked list;
  - **position 2:** `metapath.goal.push`;
  - **position 3, free-value fills:** the M6 and M8 entries 3a–3h (obols, cards, big bubbles, tools, second preset, constellation, Parallel Slot fills, unspent points).

  A Stage list has the shape `{ stage, extends: priority.frame, positions: [{ pos: 4, entries: [...] }, ...] }`. The same entry may appear at only one position per list (a CI error otherwise). The Meta Path Goals sit at authored positions: subclass at W2-early 4, world tutorial at W3-early 4, next-character at W2-late 9, elite at W4-entry 2 (tied with Gobo, as #26 lists them).

- **TR-14** Comparator, a total order (FR-19):

  ```ts
  export interface Rankable {
    entryId: string;
    category: Category;                // M10: 'blocker' | 'compounding' | 'spendable' | 'nice'
    stale: boolean;
    contested: boolean;
    cost: { unit: 'coins' | 'gems' | 'hours' | 'none'; amount: number } | null;
    milestoneEtaSeconds: number | null;
    goalsServed: number;               // Contributions count for its activity (M4)
  }
  export function compareGoals(a: Rankable, b: Rankable, list: ResolvedPriorityList): number;
  ```

  The order is:
  1. `blocker` first;
  2. lower list position (unlisted = +∞);
  3. fresh before Stale;
  4. cheaper first, compared only when the cost units match;
  5. smaller `milestoneEtaSeconds` first (null last);
  6. more `goalsServed` first;
  7. `entryId`, then the subject key, lexicographically.

  The contested rule (FR-20) is applied after sorting, as a single move.

  This supersedes the "blockers, compounding, spendables, nice" order of #10 item 5: #11 item 6 is the later, more specific ruling. `category` stays a display label for M10.

### Performance

- **TR-15** The worker's frontier step (TR-2) takes at most 60 ms p95 for an 11-character account: one `getMaxDamage` per character on one map, about 1.6 ms each per the spike's 0.5 s for 6 × 51. It runs only after a clean parse, inside M1's 1.5 s parse budget. The engine-side M2 Detectors take at most 5 ms together per run, with no allocation proportional to save size.
- **TR-16** Stage and roster results are memoised per `(lastCloudSave, knowledgeVersion)` within a tab. A re-render never recomputes them.

### Security and privacy

- **TR-17** M2 output identifies characters only by `characterIndex`. Class and level are the only character facts in Stage evidence. The Stage id is the only M2 value in `reportContext` (M1 TR-22) and in M13's context. `npcDialog` is narrowed to `GateNpc` in the adapter, so no other NPC data enters the Account State.
- **TR-18** Knowledge Base YAML is data. It is compiled at build time, and no entry can carry code. Detector ids resolve against a static registry, and an unknown id fails CI (M11).

### Tests

- **TR-19** Vitest, in `packages/engine/test/meta-path/`:
  - a rule-table test per Stage boundary on synthetic Account States (each rule's true/false edge, including level 9 vs 10 base classes and the 9999 dialogue value);
  - the S1–S7 assertions on both private fixtures (local only) and on the scrubbed W2 save (CI);
  - the pusher identity check (TR-2);
  - a determinism test (FR-19);
  - "nothing from W3 fires on W2-late" (FR-22);
  - the golden Now-screen snapshot per fixture (#11 item 12), which changes only through a reviewed PR.

## 6. States and edge cases

| Case | Behaviour |
|---|---|
| **Loading** (no Account State yet) | M2 does not run. M10 shows its loading state. No Stage is shown. |
| **Broken parse / empty account** | M1 never hands over an Account State, so M2 never runs on it (#10 item 13). The last good Stage is not reused for new advice. |
| **Partial parse** (a section failed) | TR-6: earliest consistent Stage, certainty `partial`, unknown fields named. If `frontier` is null, the push Goal shows "Can't compute who should push right now" and no pusher, and the rest of the list ranks normally. |
| **`finishedWorlds` unknown** | Stage `null`, certainty `unknown`. Only Verdict blockers rank (position is +∞ for everything else), with the banner "Can't tell where your account is on the route". |
| **Stale patch** (save's game version newer than the parser pin) | M1 shows its banner. M2 still runs. Meta Path entries verified on an older patch are marked Stale and rank below fresh ones at the same position. The Stage itself is never Stale-badged, because its facts are generated at the pin. |
| **Game moves a gate** (e.g. a threshold changes) | The generated fact changes at the next parser re-sync. The Knowledge Base diff shows which Stage rule moved. The golden snapshots show the effect before merge. |
| **Offline** | The engine runs on the last Account State from history. M2 is pure, so the output is identical to before. |
| **Multiple tabs** | Each tab computes the same Stage from the same save, with nothing shared. |
| **Second account in the same browser** | One account per browser (#10 item 16). Memoisation (TR-16) keys on `uid` through the history key, so nothing carries over. |
| **New account (W1-early, 1 character)** | Stage W1-early. The pusher is the only character. The frontier is the first W1 route map. Next character: Barbarian line if missing, otherwise the next of the #15 order, with "slot 2 opens at family level 8". |
| **Character deleted** | Max level and roster are recomputed from the save, so the Stage may drop a band (e.g. W1-mid to W1-early). That is the honest reading. No history is used to hold it. |
| **New base-class character in W2** | The Stage does not regress, by the D3 rule. The character's subclass Goal fires on its row. |
| **Base class below level 10** | Not counted as pending for the Stage. No subclass Goal (it cannot subclass yet). |
| **`npcDialog` = 9999** | Treated as "met", the same as Toolbox `isWorldFinished`. Its exact meaning is unverified (both fixtures show it on characters that never pushed), so no M2 rule reads it as quest progress. Quest progress comes from `gateQuests` only. |
| **Every candidate at 0 kills/h on the frontier** | FR-13: pusher `null`, and the push Goal names the wall (hit chance or survivability) for the best candidate. |
| **Pusher is AFK skilling, or on an old map** | Still the pusher. Whether its current activity is worthwhile is M4's call, and the move is M5's. M2 never moves characters. |
| **Pusher also holds the Construction Role** (W3 fixture: Squire 85) | No conflict: the cog seat is a Parallel Slot and coexists with fighting (glossary). |
| **Two characters tie on everything** | TR-10 step 4, then TR-14 step 7: deterministic by level, then index. |
| **Account past W4-entry, or a W5–W7 public save** | Treated as `W4-entry` with `coverage: 'beyond'` and the "Not covered yet: Worlds 5–7" banner (D2). Only Verdict blockers and positions 1 and 3 rank. |
| **Duplicate Barbarian when the account wants a 2nd Squire** | The only case where the Swap Token is suggested (FR-10), as a Goal at W2-late or later with the sibling rule shown in its why. |
| **11 characters** | Slot 11 is Beginner by plan. An 11th character with a class is "off-path" with no advice, unless it is a Journeyman or Squire filling an empty plan slot. |

## 7. Dependencies

| Module | M2 needs from it | M2 gives it |
|---|---|---|
| **M1 Sync & Account State** | The TR-3 fields through its TR-11 growth process. The frontier step in the parse worker (TR-2), after the clean parse, before `postMessage`. `diagnostics.failedSections` and `isKnown()` for certainty. | `stage.id` for `reportContext`. |
| **M11 Knowledge tooling** | The YAML schema with the `meta-path` and `priority-list` entry types. The generators for the TR-7 generated entries. The CI checks (unknown Detector id, an entry at two positions, `appliesTo` without a list reference, every entry has a Source). | Entry ids and Detector ids to register. |
| **M10 Now screen UI** | Where to show the Stage header label and its `next.needs` tap (D5), the push Goal, roster notes and the "Not covered yet: Worlds 5–7" banner (D2). | `EngineResult.stage`, the ranked order through `compareGoals`, Account-section notes. |
| **M13 Suggestions** | — | the Stage id in `SuggestionContext`. |
| **M3 AFK Safety** | Which Goals are Verdict blockers (category `blocker`). | Stage, so blockers can filter by `appliesTo`. |
| **M4 Purpose & Milestones** | `goalsServed` per activity for tie-break 6. | Stage, Roles, the pusher (the push Goal is a Purpose for the pusher). |
| **M5 Higher-leverage options** | — | `roleOwnersOf`, the pusher, `account.frontier.fights` (it may reuse them before calling `what-if`). |
| **M6 Unspent & idle** | The entries behind frame positions 1 and 3. | Stage-gated list positions. |
| **M7 Spend Plan, M8 Collections, M9 Builds** | Their entries at positions 4+. | Stage, the list, the comparator. |
| **Engine core** | Visit Order computation that consumes `VisitHint`s. | `visitHints`. |

## 8. Decisions

Ruled by Yasser on 2026-10-17 (PR #48): every recommendation accepted as written, with D4 superseded by M6-D4.

- **D1. Pusher stickiness: keep the incumbent unless a challenger has at least 25% more final kills/h on the frontier map.** Why: on maps everyone one-shots, Toolbox's kill rates sit within a few percent (the W2 fixture's Djonnuttown: four characters within 6%, 874–929/h), so a pure argmax would flip the pusher between saves on noise and tell the player to move portal progress to another character. 25% is far above that noise and leaves both fixtures' real choices unchanged (Squire 85 at 1,065 vs 472/h; Barbarian 60 at 1,680 vs 1,496/h). The margin is an authored number in `metapath.pusher-rule`, tunable in one place. Applied in TR-10.
- **D2. Accounts past W4-entry are treated as W4-entry with a "Not covered yet: Worlds 5–7" banner.** They still get Stage-independent advice (Verdict blockers, position-1 never-skip, position-3 free-value fills), but no push, next-character, elite or world-tutorial Goal and no position-4+ System items. Why: it keeps the 10 Stage values the glossary and #26 define, needs no new list, still helps W5–W7 saves with the time-gated and empty-slot items, and is honest about the gap through #11 item 14's "Not covered yet". Applied in FR-5, S1, §6.
- **D3. W2-early is "maxLv < 30 or no character is subclassed yet".** New base-class characters are handled by the per-character subclass Goal at every Stage. Why: the Stage is account-level, with per-character differences coming from filters (glossary). One new character should not reshuffle the whole account's priorities, and this keeps the Stage a pure function of one save. It matches #26 on both fixtures. Applied in TR-5, FR-15, S7.
- **D4. Skill-minigame plays are not a never-skip item (superseded by M6-D4).** They are shown only when they would be lost before the Expected Return **and** a highscore Milestone is open, as an "If you have time" item, not at position 1 and not in the ranked list. Seconds-long claims (Darts, the Random Event) stay at position 1. Why: a play is worth minutes of AFK harvest; its value is in one-time Milestones, and each takes active minutes, so ranking them above the push would let a 15-minute session go to minigames. M6 owns the entry and its gate. Applied in TR-13.
- **D5. The Stage is shown as a small label in the Now-screen header ("World 2 · late"); a tap shows `next.needs`.** Why: one line explains why the advice changes when the player crosses a gate and lets a player spot a wrong Stage at a glance, which then goes through Report this. A full Account-section line every session is noise. M10 owns the placement; M2 provides `label` and `next.needs`. Applied in §1, FR-4, §7.

## 9. Red-team notes

**R1. Wrong Stage, so everything ranks wrong.** One misread field (a quest flag, a building level) shifts the whole list. *Defence:*
- every rule is a table test on both sides of its edge (TR-19);
- evidence is recorded and can be reported (FR-2);
- unknown fields degrade to the earliest consistent Stage, never a later one (TR-6);
- the quest reading uses Toolbox's `completed[]`, not `progress[]`, fixing a misreading in #26 §1.1 that would have marked done quests as not started (TR-3);
- D5 makes a wrong Stage visible to the player.

**R2. The pusher flip-flops, or is a character the player would never pick.** Kill rates on one-shot maps are nearly flat. *Defence:*
- the incumbent margin (D1);
- a frontier fallback that picks the hardest route map instead of a town map (on W2, Djonnuttown at 874–929/h vs Sands of Time at 1,193–1,680/h);
- a deterministic tie order;
- both class Sources shown (FR-14), so the arithmetic is explained, not hidden.

  A remaining risk is that the route order uses map-index order (TR-7 `gen.world-routes`), which approximates branching portals. It is correct on both fixtures. The first save where it is wrong goes through Report this, and the fix is a generated ordering, not a rule change.

**R3. `finalKillsPerHour` is wrong at W1–W3.** Toolbox verified it live only at endgame (hypothetical-math §5). *Defence:*
- M2 uses kills/h only to *compare* characters on the same map, where a shared bias cancels out, and for one ETA;
- the ETA is shown as "about N h" (M10 formatting), never as a promise;
- Yasser's in-game AFK Info spot-check on the first live test is the falsifier.

**R4. Advising the Swap Token or a class change that ruins an account.** The original dossier advice would have turned Joseph's 2nd Squire into a 2nd Barbarian. *Defence:*
- FR-10 encodes the PV ruling;
- the token can only appear in the one sibling case;
- the duplicate Squire is explicitly labelled on-path (S4);
- class composition is read from `classIndex`, never assumed.

**R5. Privacy leak through Stage or roster.** *Defence:*
- characters are referenced by index (TR-17);
- `npcDialog` is narrowed in the adapter;
- reports carry only the Stage id;
- Toolbox's `bestCharacter` name fields (hypothetical-math §4) never enter M2's fields.

**R6. Patch breakage.** A patch renames an NPC, moves a level gate or adds a map. *Defence:*
- every gate, threshold and route is a generated fact (ADR 0007), regenerated at re-sync and shown in the Knowledge Base diff with golden-snapshot changes (#11 item 12);
- the M1 adapter fails loudly on a shape change rather than letting M2 read `undefined` as 0.

  A remaining risk is a new gate the rules don't know (e.g. a new W3 tutorial step). It shows as a Stage that stays put, which the player sees through D5.

**R7. Ranking that confuses the player.** For example, a contested item on top, or a free fill buried under a long System item. *Defence:*
- one total comparator for every module (TR-14);
- contested entries are never first (FR-20);
- unlisted entries rank last (FR-21), and CI flags them;
- the §5.1 fixture order is asserted (S6).

  The explicit supersession of #10's "compounding before spendables" ordering is called out in TR-14, so M10 and M3–M9 don't build two orders.

**R8. Wrong family-slot thresholds.** The 11th-slot value conflicts between Sources (#26 Q9), and the slot thresholds come from the wiki plus a Toolbox alert, not a data table. *Defence:*
- it is irrelevant before W4;
- the thresholds are one generated or tier-2 entry, so a correction lands in one place;
- the next-character output always shows the family level it assumed, so a wrong "43 to go" is checkable in-game.

**R9. Meta Path Goals crowding out the session.** For example, the push Goal says "finish Djonnut 2" every session for a week. *Defence:*
- Goals always show one Next Action, and "Skip today" and "Not for me" apply (#10 item 8);
- the push is position 2 by the PV community norm, below the never-skip items, and it never becomes a Verdict blocker (it is category `compounding`).

**R10. Stage-gated entries leaking across worlds.** For example, the Equinox flag being true on a W2 save. *Defence:*
- FR-22 plus a fixture test that no W3 entry fires on the W2-late account;
- each entry's Detector checks its own unlock rather than trusting the Stage alone.
