# M9 Builds

Spec for [#37](https://github.com/YassSoliman/idleon-forge/issues/37), part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Terms follow [`GLOSSARY.md`](../../GLOSSARY.md). Decisions it rests on: ADRs [0002](../adr/0002-deterministic-advice-ai-built-knowledge.md), [0004](../adr/0004-source-precedence.md), [0005](../adr/0005-toolbox-numbers-not-our-formulas.md), [0007](../adr/0007-generated-facts-authored-judgment.md); resolutions of #10, #11, #12, #13, #14, #16, #17, #18, #26, #27.

**Inputs.** Facts and orders come from the character-builds dossier (`research/character-builds`, `docs/research/systems/2026-10-17-character-builds.md`), corrected by the priority verification overlay (`research/priority-verification`, abbreviated **PV**), and placed in the account-wide ranking by the Leverage model (`research/leverage-model`, abbreviated **LM**). Where PV and the dossier disagree, PV wins. Verified against game v1.23 (Toolbox gameVer 2.3.540, pin `6827d3f`).

**Fixtures.** Acceptance criteria cite the two private fixtures by account and class, never by name: the **W2-late account** (5 characters) and the **W3-early account** (6 characters). Only aggregates are quoted. Both were read on 2026-10-17 with the Toolbox parser output (`fixtures/private/*.parsed.json`).

## 1. Purpose

Every character has two talent presets, and each one spends the character's full talent points on its own. Swapping between them is free and instant. A good AFK Setup puts a fighter on a fighting preset and a skiller on a skilling preset, both following a current build for the class. In practice players leave a fighter on its skilling preset, never set up the second preset at all, leave hundreds of points unspent on the preset they are not looking at, and miss the one talent that drives AFK gains. M9 is the part of ActiveOn that catches all of this from the save. It tells the player, per character, the one talent thing to fix before leaving (the wrong preset), the presets to set up or finish, where the next points go, and, rarely and only when it clearly pays, when to use a Talent Point Reset Potion.

## 2. Scope / Out of scope

**In scope**

- **Build entries** (authored, ADR 0007): one fighting and one skilling talent order per class line and preset role, for every W1–W3 class: Beginner, Warrior, Archer, Mage, Barbarian, Squire, Bowman, Hunter, Shaman, Wizard. Elite classes (W4-entry) use their subclass's Build for tabs 1–3.
- **Preset role classification**: is each preset a fighting preset, a skilling preset, empty, or incomplete.
- **Wrong preset on AFK**: the active preset's role does not match the character's AFK Target. This is a Verdict blocker.
- **Preset setup**: the second preset is empty or incomplete.
- **Points left behind**: a lower bound on unspent talent points, found by comparing the two presets.
- **Drift**: where the next talent points go, from the first unmet step of the Build, with core steps (e.g. the Idle fighting talent at 50) promoted.
- **Attack bar**: an AFK fighter with too few attacks on its bar, and a skiller without its skill attack.
- **Talent reset suggestions**: when a Talent Point Reset Potion is worth using, on which preset, in which order.
- Generated facts M9 needs (talent ids, names, tabs, max levels, which talents are attacks, reset items and their quest sources).

**Out of scope**

- **Sub Class Swap Token and any class change.** That is Course Correction, owned by M2 (Stage & Meta Path). PV's ruling stands: keep a duplicate Squire; never suggest the token except toward the sibling subclass the Meta Path wants. M9 never suggests the token.
- **Tab 4 (elite) builds and the W4+ "Library book" preset trick.** Shown as "Not covered yet: elite talent builds".
- **Journeyman / Maestro / Voidwalker builds.** Only Stale v1.40b sources exist. "Not covered yet".
- **Active-play build variants** (1 point per attack, max passives). ActiveOn coaches the AFK Setup, so every fighting Build is the AFK variant.
- **Star signs, constellations, equipment, tools, food.** Covered in the same dossier but owned by other modules (food by M3 AFK Safety; empty tool and slot fills by M6 Unspent & idle; constellations and star signs by M8 Collections, per #13's module list). M9 does not emit Goals for them.
- **Super Talents** (W5+), **Star Talent Reset Potions**, and the Slight Do-Over beyond a one-line mention.
- **Counting exact unspent points.** Toolbox does not compute points remaining, and porting `TotalTalentPoints` would be our own game formula (ADR 0005). M9 only reports lower bounds.
- **Matching a skilling preset to a specific skill** (e.g. a fishing preset used for mining). MVP checks fighting vs skilling only.
- **Parallel Slot talents** (Construction, Worship, Alchemy, Refinery) and which preset they read from. See Red-team R9.
- Damage, kills per hour and survivability numbers. They come from Toolbox through M5; M9 uses them only where noted.

## 3. Functional requirements

Character-level requirements apply to every character with talent data. "Fighting AFK" means `afkType == FIGHTING`; "skilling AFK" means `afkType` is one of MINING, CHOPPIN, FISHING, CATCHING. Any other `afkType` (Nothing, Lab, Cooking, Divinity, Spelunking, Paying_Respect) has no required preset role.

**Classification**

- **FR-1** For each character, M9 classifies the active preset and, from class Lv 15, the other preset as one of `fighting`, `skilling`, `empty`, `incomplete` or `unclassified`.
  - `empty`: no point spent in tabs 1–3.
  - `incomplete`: tabs 1 and 2 have no points but a later tab does.
  - `fighting` / `skilling`: the preset's spent points overlap that role's Build for the character's class by at least 60% and by at least twice the other role's overlap (TR-6).
  - `unclassified`: anything else.
- **FR-2** Below class Lv 15 a character has one preset. M9 runs only the drift (FR-11) and attack-bar (FR-13) rules on it.

**Wrong preset (Verdict blocker)**

- **FR-3** If the AFK Target needs a role (fighting or skilling) and the active preset is classified as the other role, M9 emits a **blocker** for that character: "Swap to your <role> preset before you leave."
- **FR-4** If the needed role exists on neither preset (the other is `empty` or `incomplete`), the blocker's Next Action is to set up the other preset for that role, then stay on it.
- **FR-5** An `unclassified` active preset never produces a blocker.
- **FR-6** While FR-3 fires for a character, every other M9 Goal for that character is suppressed. They are re-evaluated on the next save, after the swap.

**Preset setup and points left behind**

- **FR-7** From class Lv 15, if the other preset is `empty`, M9 emits a Goal "Set up your second preset for <role>", where role is the one the active preset does not cover. Its Next Action names the first steps of the matching Build and ends with "then swap back" whenever the active preset is the one the AFK Target needs.
- **FR-8** If the other preset is `incomplete`, the Goal reads "Finish your <role> preset" with the same Next Action shape.
- **FR-9** For each preset, M9 computes a lower bound of unspent points per tab by comparing it with the other preset (TR-7). If the total lower bound on a preset is at least 10, M9 emits a Goal "Spend at least N talent points on your <role> preset", naming the tabs and the first unmet Build step in each.
- **FR-10** Lower bounds are always shown as "at least N". The UI never shows an exact unspent count.

**Drift and next points**

- **FR-11** For each classified preset, M9 walks the matching Build's applicable steps (TR-5) and picks the preset's **next step**. That is the first unmet step flagged `core` in any tab (in tab order), or, if every core step is met, the first unmet step in the lowest tab. A step is unmet when its talent is below its target.
- **FR-12** If the next step is `core` (e.g. the Idle fighting talent to 50, Big Pick on a mining preset), M9 emits a Goal "Next talent points: <talent> to <target>" with category `compounding`. Otherwise the same Goal has category `nice`, unless decision D6 says otherwise.

**Attack bar**

- **FR-13** When fighting AFK on a fighting preset, M9 counts attack talents on the active bar (Printer Sampling and Roll Da Dice do not count). With fewer than 2, it emits the attack-bar Goal (severity per decision D1), naming the Build's attacks that are levelled but missing from the bar.
- **FR-14** When skilling AFK on a skilling preset of a class whose Build lists a skill attack for that skill (Big Pick for mining, Log On Logs for choppin), and that attack is not on the bar, M9 emits a `compounding` Goal to put it on the bar.

**Reset suggestions**

- **FR-15** M9 suggests a Talent Point Reset Potion for a preset only when all of these hold:
  1. the preset is `fighting` or `skilling`;
  2. its **wrong-role points** reach the threshold set by decision D2. Wrong-role points are points in talents that appear in the *other* role's Build for the class but not in this one, plus points above the target on steps marked `hardCap`;
  3. the account owns at least one potion, or 10 fragments (storage plus inventories);
  4. the Build is not Stale and not Contested.
- **FR-16** The suggestion's Next Action gives the exact order: swap to that preset if needed, use the potion (it resets the active preset only), spend along the Build, swap back to the preset the AFK Target needs.
- **FR-17** M9 never suggests a reset for a wrong preset (FR-3) or an empty preset (FR-7). Never suggests buying potions with gems. Never touches star talents.
- **FR-18** When FR-15 fails only on condition 3 (no potion owned), M9 adds no Goal. The wrong-role points show only in the Focus card's provenance.

**Output, limits, coverage**

- **FR-19** M9 emits at most **one blocker and two Goals per character**: one "Talent presets" Goal (FR-7, FR-8 or FR-9, first that fires) and one "Talents" Goal (FR-15, then FR-13/FR-14, then FR-12, first that fires).
- **FR-20** Every M9 Next Action has at least one Source and carries provenance: the entry ids, plus the Account State fields read.
- **FR-21** Characters whose class has no Build (Journeyman line), and elite tab 4, produce no Goals. The engine lists them under "Not covered yet: <class> talent builds" / "elite talent builds".
- **FR-22** A Build whose newest Source is Stale is still used for FR-3 to FR-14 (ranked below fresh entries, with the Stale mark). It is never used for FR-15.
- **FR-23** M9 output depends only on the Account State, the Knowledge Base, the Stage, and (for D6 only) the previous save. Two runs on the same inputs give identical output.

## 4. User stories

Each "Then" is asserted on the engine output (`EngineResult`) and on the golden Now-screen snapshot for that fixture (#11 item 12, #13). Counts are per fixture, read 2026-10-17.

### US-1 Wrong preset before I leave

*As a player in a Play Session, I want to be told when a character is AFK on the wrong talent preset, so that I don't lose a whole AFK Stretch to the wrong talents.*

- **Given** the W3-early account, Bowman Lv 60, AFK fighting, active preset classified `skilling` (its points sit in Elusive Efficiency, Broken Time, Acme Anvil and the catching talents) and other preset `fighting` (Idle Shooting at 100, five attacks on its bar) / **When** the engine runs / **Then** that character's Verdict is "Fix before you leave", its first blocker reads "Swap to your fighting preset before you leave", and no other M9 Goal shows for it.
- **Given** the W3-early account, Barbarian Lv 56, AFK fishing, active preset `fighting`, other preset `skilling` (Brute Efficiency 100, Idle Skilling 100, the fishing talents) / **When** the engine runs / **Then** the blocker reads "Swap to your skilling preset before you leave".
- **Given** the W3-early account / **When** the engine runs / **Then** exactly 2 characters carry an M9 blocker.
- **Given** the W2-late account / **When** the engine runs / **Then** no character carries an M9 blocker (the mining Squire is on its skilling preset; the four fighters are on fighting presets).
- **Given** the W3-early Bowman's next save after a swap, with the fighting preset active / **When** the engine runs / **Then** the blocker is gone, it is listed under "done this session", and the character's other M9 Goals are evaluated again (FR-6).

### US-2 Set up the empty second preset

*As a player in a Play Session, I want to know which characters never set up their second preset, and how to start, so that each character has a preset for both its fighting and its skilling.*

- **Given** the W2-late account / **When** the engine runs / **Then** 3 characters show "Set up your second preset for skilling": Barbarian Lv 60 (fishing), Bowman Lv 54 (catching), Wizard Lv 56 (choppin). Each Next Action names the first tab-1 steps of the class's skilling Build (the class efficiency talent, then Idle Skilling or Active AFK'er), says "at least N points are waiting" with N = 640, 575 and 592, and ends "then swap back to your fighting preset".
- **Given** the W3-early account / **When** the engine runs / **Then** Squire Lv 85 shows "Set up your second preset for skilling" with "at least 1,020 points", and Shaman Lv 54 shows "Finish your skilling preset" (tabs 1–2 empty, tab 3 started) with "at least 383 points".
- **Given** a synthetic character at Lv 14 with one preset / **When** the engine runs / **Then** no preset Goal shows for it (FR-2).

### US-3 Points left behind on the other preset

*As a player in a Play Session, I want to see when one preset has fallen behind the other, so that the points I already earned are spent on both.*

- **Given** the W2-late account / **When** the engine runs / **Then** Shaman Lv 44 shows "Spend at least 118 talent points on your skilling preset", and Squire Lv 43 shows "Spend at least 17 talent points on your fighting preset".
- **Given** the W3-early account / **When** the engine runs / **Then** Wizard Lv 73 shows "at least 215" on its skilling preset, Barbarian Lv 56's figure (at least 148 on its skilling preset) is suppressed by its US-1 blocker, and Squire Lv 51 shows "Spend at least 115 talent points on your skilling preset", all in the Squire tab. Its first unmet Build step is Refinery Throttle (the account's Refinery is unlocked).
- **Given** two presets with equal per-tab spend and no tab-2 point talents / **When** the engine runs / **Then** no FR-9 Goal shows (unit test).
- **Given** the W3-early Squire Lv 51, whose presets spend 244 and 248 in tab 2 with Back To Basics at 0 and 4 / **When** the lower bound runs / **Then** tab 2 contributes 0. This is the contract test for the Back To Basics adjustment (TR-7).

### US-4 The core talent I missed

*As a player in a Play Session, I want the one talent that most changes my AFK gains called out, so that new points go there first.*

- **Given** the W2-late account / **When** the engine runs / **Then** Barbarian Lv 60, Shaman Lv 44 and Wizard Lv 56 each show a `compounding` Goal "Next talent points: Idle Brawling to 50" / "Idle Casting to 50" (the Idle fighting talent is at 0 on their fighting preset).
- **Given** the W3-early account / **When** the engine runs / **Then** Wizard Lv 73 and Shaman Lv 54 show the Idle Casting Goal. The Bowman Lv 60's Idle Shooting at 0 is on its wrong (skilling) preset, so it is suppressed by US-1.
- **Given** the W2-late account, Bowman Lv 54, with Gilded Sword and Sharpened Axe at their targets and Idle Shooting at 13 / **When** the engine runs / **Then** its "Talents" Goal is "Next talent points: Idle Shooting to 50", category `compounding` (core step), with "at 13" in the why.
- **Given** the W3-early account, Squire Lv 51 on its mining preset with Big Pick at 1 while later tab-2 Build steps are at 100 / **When** the engine runs / **Then** its "Talents" Goal is "Next talent points: Big Pick to <target>" (Big Pick is core on the Squire skilling Build).

### US-5 Attacks on the bar

*As a player in a Play Session, I want to know when an AFK fighter has too few attacks on its bar, so that its AFK damage is not thrown away.*

- **Given** the W2-late account / **When** the engine runs / **Then** no FR-13 or FR-14 Goal shows (every fighter has at least 4 attacks on its bar; the mining Squire has Big Pick on its bar).
- **Given** the W3-early Bowman Lv 60 (only Printer Sampling on the active bar) / **When** the engine runs / **Then** FR-13 does not fire, because the active preset is the skilling one and US-1 owns this character.
- **Given** a synthetic AFK fighter on a fighting preset with 0 attacks on its bar / **When** the engine runs / **Then** the attack-bar Goal fires with the severity set by D1, naming the levelled attacks that are missing.

### US-6 When to use a reset potion

*As a player in a Play Session, I want a reset suggested only when it clearly pays, with the exact steps, so that I don't waste a potion or reset the wrong preset.*

- **Given** the W2-late account (3 potions and 13 fragments in storage) / **When** the engine runs / **Then** no reset is suggested. The largest off-build allocation, 27 points in Super Samples on the Squire's mining preset, is in no Build at all, so it does not count as wrong-role points.
- **Given** the W3-early account (10 potions and 32 fragments) / **When** the engine runs / **Then** no reset is suggested. The largest wrong-role allocation is 6 points of Gilded Sword on the Squire Lv 51's mining preset.
- **Given** a synthetic Squire skilling preset with 45 points in Gilded Sword and Meat Shank, and 1 potion in storage / **When** the engine runs / **Then** its "Talents" Goal is "Reset your skilling preset with a Talent Point Reset Potion (you have 1)", and the Next Action lists: swap to the skilling preset, use the potion, spend along the Build starting at Brute Efficiency, swap back to the preset your AFK Target needs.
- **Given** the same synthetic preset and no potion or fragments / **When** the engine runs / **Then** no reset Goal shows (FR-18).
- **Given** the same synthetic preset, with the Squire skilling Build marked Stale / **When** the engine runs / **Then** no reset Goal shows (FR-22).

### US-7 What the advice is based on

*As a player in a Play Session, I want every talent instruction to show its Source and how current it is, so that I can trust it or report it.*

- **Given** any M9 Next Action on either fixture / **When** I tap its Source label / **Then** I see the Toolbox community build it comes from, with its last-edited date (e.g. 2026-10-12 for the Barbarian Build) and the patch it was verified on.
- **Given** a Hunter (no fixture has one; synthetic) / **When** the engine runs / **Then** its M9 Goals carry the Stale mark and rank below fresh Goals of the same category (FR-22, decision D4).
- **Given** the public `highend.json` save (11 characters, all elite or later classes) / **When** the engine runs / **Then** tabs 1–3 are checked against their subclass lines' Builds, no Detector throws, and the Now screen lists "Not covered yet: elite talent builds".
- **Given** I press Report this on an M9 Next Action / **When** the pre-filled issue opens / **Then** it contains the entry id, the Knowledge Base version, the game version, the Stage, and the character's class and level, and nothing about names or other characters.

### US-8 Can't read the save

*As a player in a Play Session, I want no talent advice when the save can't be read, so that I never act on a broken read.*

- **Given** a save whose `talents` section failed to parse for one character (`diagnostics.failedSections` includes it) / **When** the engine runs / **Then** that character gets no M9 Goal or blocker, its Verdict is decided by the other modules, and `diagnostics.failedDetectors` names the M9 Detectors that were skipped.
- **Given** an empty or failed parse / **When** the engine runs / **Then** M9 produces nothing; the Now screen shows "Can't read your save right now" (M1/M10).

### Golden expectations summary

| | W2-late account | W3-early account |
|---|---|---|
| Wrong-preset blockers (FR-3) | 0 | 2 (Bowman Lv 60, Barbarian Lv 56) |
| Empty or incomplete second preset (FR-7/8) | 3 (Barbarian 60, Bowman 54, Wizard 56) | 2 (Squire 85 empty, Shaman 54 incomplete) |
| Points left behind (FR-9), shown | 2 (Shaman 44: 118; Squire 43: 17) | 2 (Wizard 73: 215; Squire 51: 115). Barbarian 56 (148) and Bowman 60 (93) suppressed |
| Core next step (FR-12, compounding) | 4 (Idle talent on Barbarian 60, Shaman 44, Wizard 56; Idle Shooting 13→50 on Bowman 54) | 3 (Idle Casting on Wizard 73 and Shaman 54; Big Pick on Squire 51) |
| Attack-bar Goals (FR-13/14) | 0 | 0 |
| Reset suggestions (FR-15) | 0 | 0 |

These are the fire/doesn't-fire tests (#11 item 12). The exact text is pinned by the golden snapshots once the Build entries are authored.

## 5. Technical requirements

### Package boundaries

- **TR-1** Code lives in `packages/engine/src/builds/`: pure functions with no I/O, no clock and no Toolbox import.
  - `classify.ts`: preset role classification.
  - `diff.ts`: Build walk, next step, wrong-role points.
  - `unspent.ts`: lower bounds.
  - `detectors.ts`: the Detectors registered with M11.

  Entries live in `packages/knowledge/systems/talents.yaml` (Builds and drift Checks), `talent-presets.yaml` (preset Checks) and `talent-resets.yaml` (the reset Check and its Acquisition). Generated facts go in `packages/knowledge/generated/talents.json`.
- **TR-2** Detectors read only the Account State (M1 TR-11) and the compiled Knowledge Base. Talent values (e.g. "Idle Casting 50 = +10% AFK fight gains" in a why line) come from Toolbox's own growth function (`utility/wiki/growth.mjs`), run when the Knowledge Base is generated and stored in `generated/talents.json`. ActiveOn never re-implements the formula (ADR 0005).

### Account State fields M9 needs (requested from M1, via its TR-11 growth process)

- **TR-3** Added to `CharacterState`:

  ```ts
  export interface TalentLevel {
    /** Toolbox talentId / skillIndex. */
    id: number;
    /** Points bought (`baseLevel`). */
    base: number;
    /** Max level in this save (`maxLevel`), including book and bubble raises. */
    max: number;
  }
  export interface PresetTalents {
    /** Tabs 1–4 in class order; from Toolbox `talents` (active) or `talentPreset.talents` (other). */
    tabs: { tab: 1 | 2 | 3 | 4; tabName: string; talents: TalentLevel[] }[];
    /** Star tab levels, from `flatStarTalents` / `talentPreset.flatStarTalents` (they use `level`, not `baseLevel`). */
    star: TalentLevel[];
    /**
     * Talent ids on the attack bar, rows 0–1, "Null" dropped. Active: Toolbox `talentsLoadout`.
     * Other: the raw save's `AttackLoadoutpre_<i>`, which Toolbox does not parse. Null when unreadable.
     */
    attackBar: number[] | null;
  }
  export interface CharacterTalents {
    classIndex: number;
    /** `selectedTalentPreset` (0 or 1). */
    selectedPreset: 0 | 1;
    active: PresetTalents;
    /** Null below class Lv 15 or when the save has no preset data. */
    other: PresetTalents | null;
  }
  // CharacterState gains: talents: CharacterTalents | null
  ```
- **TR-4** Added to the account: `resetItems: { potions: number; fragments: number }`. These are the summed `ResetCompleted` and `ResetFrag` counts over storage and every character's inventory, or null if storage failed to parse. Slight Do-Over is only mentioned in text; its level (`upgradeVault.upgrades[51]`) is not needed in the MVP. Both raw reads (`AttackLoadoutpre_<i>`) and Toolbox reads go through the M1 adapter with `FIELD_SOURCES` entries, so provenance can name them.

### Knowledge Base entries (#11 shape)

- **TR-5 Build entry** (`type: build`, authored). Required fields are the #11 common fields (`id`, `system`, `type`, `why`, `sources[]`, `appliesTo`, `confidence`, `status`) plus:

  ```ts
  export type PresetRole = 'fighting' | 'skilling';
  export type StepCondition =
    | { kind: 'systemUnlocked'; system: 'refinery' | 'construction' | 'printer' | 'library' | 'worship' | 'trapping' | 'alchemy' }
    | { kind: 'classBubbleAbove'; level: number }           // bottle / vessel / flask talents
    | { kind: 'stageAtLeast'; stage: StageId }              // e.g. No Pain No Gain only from W4-entry
    | { kind: 'accuracyShort' };                            // accuracy-stat talents; needs M5 hit chance
  export interface BuildStep {
    talent: `talent.${number}`;  // id of a generated talent fact
    target: number | 'max';      // 'max' = the save's TalentLevel.max
    tie?: string;                // steps sharing a tie key are levelled together ("=" in the guide)
    core?: boolean;              // promotes the next-step Goal to compounding (FR-12)
    hardCap?: boolean;           // points above target count as wrong-role points (FR-15)
    when?: StepCondition[];      // all must hold, otherwise the step is skipped
    breakpoints?: number[];      // Apocalypse ZOW 33/66/99/132; Refinery Throttle in multiples of 8
  }
  export interface BuildEntry {
    id: string;                  // build.<classLine>.<role>, e.g. build.squire.skilling
    type: 'build';
    system: 'talents';
    classLine: string;           // Toolbox class id of the line, e.g. "Squire"
    classIndices: number[];      // e.g. [9] plus its elite index; elites use tabs 1–3 only
    role: PresetRole;
    serves: string[];            // afkTypes this role covers, e.g. ["MINING"]
    variant: 'afk';
    tabs: { tab: 1 | 2 | 3; steps: BuildStep[] }[];
    star?: BuildStep[];
    attackBar: { attacks: `talent.${number}`[]; skillAttack?: `talent.${number}` };
    onePointOk: `talent.${number}`[];  // utility talents a point in which is never drift (Firmly Grasp It, Teleport)
  }
  ```

  Rules:
  - Every step has an explicit `target` transcribed from the Source build's per-talent levels. An unnumbered step is a CI error. `max` must be written out.
  - A step whose `when` is **false** is skipped by drift. If it is also `hardCap` (bottle, vessel or flask talents before the class bubble passes 100), its points count as wrong-role points.
  - A `when` that **cannot be evaluated** (e.g. `accuracyShort` without M5 data) makes the step met for drift (never nag), and its points never count as wrong-role (never reset on an unknown).
  - Elite and later class indices map to their subclass line through generated class-tree data (Toolbox `classPromotions.json`). Tabs past 3 are not covered.

  Example (abridged):

  ```yaml
  - id: build.barbarian.fighting
    type: build
    system: talents
    classLine: Barbarian
    classIndices: [8]
    role: fighting
    serves: [FIGHTING]
    variant: afk
    tabs:
      - tab: 1
        steps:
          - { talent: talent.6,  target: max }                 # Gilded Sword
          - { talent: talent.5,  target: max }                 # Sharpened Axe
          - { talent: talent.88, target: 50, core: true }      # Idle Brawling
          - { talent: talent.86, target: max }                 # Meat Shank
          - { talent: talent.12, target: max, hardCap: true, when: [{ kind: accuracyShort }] }  # Book of the Wise
    attackBar: { attacks: [talent.90, talent.91, talent.105, talent.106] }
    onePointOk: [talent.94]
    why: "Damage first, then the Idle fighting talent, per the most-liked current Barbarian build."
    sources:
      - { label: "Sir_Grimtide, Barbarian/Fishing (Toolbox builds)", url: "https://idleontoolbox.com/tools/builds/view?id=ih5wAK", tier: 3, verifiedOn: 2026-10-17, gameVersion: "2.3.540", edited: 2026-10-12 }
    appliesTo: { stages: [W2-early, W4-entry], minLevel: 15 }
    confidence: L
    status: active
  ```

  **Build set for the MVP** (authors transcribe from the dossier's "Build orders" section; PV 1.3 confirmed, 1.4 unverified tier 3):

  | Class line | Fighting Build source | Skilling Build (serves) | Freshness |
  |---|---|---|---|
  | Beginner (Lv 1–14, one preset) | "Early game dmg", 2026-05-14 | — | fresh |
  | Warrior / Archer / Mage (before subclass) | v1.23 community builds, matching the 2026 core | mining / catching or smithing / choppin | **Stale** |
  | Barbarian | Sir_Grimtide 2026-10-12 | fishing (FISHING) | fresh |
  | Squire | Sir_Grimtide 2026-10-10 | mining + construction (MINING) | fresh |
  | Bowman | Sir_Grimtide 2026-10-12 (Idle Shooting, not the guide's "Idle Brawling" typo) | catching (CATCHING) | fresh |
  | Hunter | v1.40b community | trapping (`serves: []`: used while claiming traps, never an AFK Target; FR-3's skilling side still accepts it as "a skilling preset") | **Stale** (D4) |
  | Wizard | Sir_Grimtide 2026-10-13 | choppin + worship (CHOPPIN) | fresh |
  | Shaman | Sir_Grimtide 2026-10-15 | alchemy + choppin (CHOPPIN) | fresh |

- **TR-6 Classification** (`classify.ts`). For a preset P and the class's two Builds F and S: `overlap(P, B) = Σ min(P.base[t], target(t))` over B's step talents, plus attack-bar talents. `spent(P)` = Σ base over tabs 1–3. The role is F or S if its overlap ≥ 0.6 × spent and ≥ 2 × the other overlap. Otherwise `unclassified`. `empty` and `incomplete` are checked first (FR-1). On both fixtures every non-empty preset classifies at ≥ 80% one role (dossier, H on fixtures), so the 0.6 threshold has margin.

- **TR-7 Lower bound of unspent points** (`unspent.ts`). Both presets of a character share one budget per tab (dossier, H: `TotalTalentPoints` subtracts only the live preset's spend). Tab-2 budgets differ by the levels of the tab-3 talents that grant tab-2 points (Back To Basics, Previous Points, Earlier Education: +1 tab-2 point per level, a generated fact). For preset p and the other preset q, per tab t:
  - t ≠ 2: `lb(p,t) = max(0, spent(q,t) − spent(p,t))`;
  - t = 2: `lb(p,2) = max(0, spent(q,2) − g(q) + g(p) − spent(p,2))`, where g is the tab-2-granting talent level on that preset.

  This is arithmetic on save data (ADR 0005), not a game formula.

  Fixture values: see US-2 and US-3. Contract test: the W3-early Squire Lv 51's tab 2 gives exactly 0.

- **TR-8 Checks** (`type: check`, authored; each points to one Detector; words, thresholds and Sources live in YAML):

  | Entry id | Detector | Inputs | Output (fires with) | Category |
  |---|---|---|---|---|
  | `check.talent-presets.wrong-preset` | `builds.wrongPreset` | `talents.active`, `talents.other`, `afkType`, Builds | `{ fromRole, toRole, otherRole }` | blocker |
  | `check.talent-presets.empty` | `builds.presetEmpty` | `talents.other`, `level` | `{ role, pointsAtLeast, firstSteps[] }` | compounding |
  | `check.talent-presets.incomplete` | `builds.presetEmpty` (mode) | same | same | compounding |
  | `check.talent-presets.behind` | `builds.presetBehind` | both presets | `{ presetRole, pointsAtLeast, tabs[], firstSteps[] }` | spendable |
  | `check.talents.next-step` | `builds.nextStep` | preset, Build, Stage, M5 hit chance (optional) | `{ talent, target, current, tab, core }` | compounding if core, else nice (D6) |
  | `check.talents.attack-bar` | `builds.attackBar` | `attackBar`, `afkType`, generated `isAttack` | `{ attacksOnBar, missing[] }` | per D1 |
  | `check.talents.skill-attack` | `builds.skillAttack` | `attackBar`, `afkType`, Build `skillAttack` | `{ talent }` | compounding |
  | `check.talent-resets.reset` | `builds.resetCandidate` | preset, both Builds, `resetItems`, Build status | `{ presetRole, wrongRolePoints, talents[], potionsOwned }` | compounding |

  The engine applies FR-6 (suppression) and FR-19 (at most one blocker and two Goals) after the Detectors run, in `detectors.ts`, so each Detector stays independent and testable alone.

- **TR-9 Goal entries** (authored): `goal.talent-presets.pair` ("Both presets set up and spent", Milestones: other preset set up, then no points left behind) and `goal.talents.follow-build` ("Follow the <class> <role> build", Milestone: steps met / total applicable, e.g. 7 of 19). Their `title` values are "Talent presets" and "Talents" (M10 `Goal.title`).
- **TR-10 Generated facts** (ADR 0007, rebuilt at every parser re-sync from Toolbox `talents.json`, `items.json`, `quests.json`, `gemShop.json`):
  - `talent.<id>`: name, tab, class line, default max, `funcX/x1/x2`, `isAttack` (has `D` and `K` in Toolbox data), and a value table at levels 10/25/50/100 computed by Toolbox's growth function;
  - `talent-group.tab2-granting`: Back To Basics, Previous Points, Earlier Education;
  - `item.ResetCompleted`, `item.ResetFrag` (10 make 1);
  - `acquisition.talent-reset-potion`: the 9 W1–W3 quest sources (Promotheus ×3, Hamish ×1, Speccius ×1, Lord of the Hunt ×4) and the gem price (200 gems, 10 per week). It is shown only as the why of FR-18-adjacent text, never as a Goal.
- **TR-11 Priority List placement** (authored, per decision D3). M9's Goals enter the Stage lists of LM §3: the empty or incomplete preset as **3e**, points left behind as part of **3h**, and W1-early's existing position 7 ("Talent core") becomes `check.talents.next-step`. The positions of core next steps and resets in the other Stages are set by D3.

### Performance

- **TR-12** All M9 Detectors together take ≤ 5 ms per engine run for an 11-character account in the worker. That is O(characters × talents), about 11 × 2 × 60 lookups. The compiled Build entries add ≤ 60 KB to the Knowledge Base JSON.

### Security and privacy

- **TR-13** M9 stores nothing. It reads only the in-memory Account State and needs no network. Report this and Suggestions send only the entry id, Knowledge Base version, game version, Stage, class and level (#11 item 15, ADR 0008), never the talent allocation, names or other characters.
- **TR-14** Build entries cite public community builds by URL and author handle only. No player data enters the Knowledge Base. Fixture-derived numbers stay in tests that run locally (`fixtures/private/`) or in the scrubbed W2 save in CI.

### Tests

- **TR-15** Vitest, per Detector: fires / doesn't-fire on both private fixtures (local), on the scrubbed W2 save (CI) and on the 11 public saves (CI, no crash, classification coverage reported). Synthetic Account States cover the reset, attack-bar, Lv < 15 and failed-section cases. The golden Now-screen snapshot per fixture pins the summary table in §4. A CI schema check rejects a Build step whose talent id is missing from `generated/talents.json`, an unnumbered target, or a Build without a dated Source.

## 6. States and edge cases

| State | Behaviour |
|---|---|
| Loading / no save yet | M9 does not run. |
| Broken parse or empty account | No advice (M1, M10). M9 never runs on a failed read. |
| `talents` section failed for one character | That character gets no M9 output. Detectors are listed in `diagnostics.failedDetectors` (US-8). |
| Raw `AttackLoadoutpre_<i>` unreadable | `other.attackBar = null`. FR-3 still fires from talent levels. Nothing that needs the inactive bar fires. |
| Class Lv < 15 | One preset. Only drift and attack bar (FR-2). |
| Beginner (Lv < 10) | Beginner Build: Gilded Sword and Sharpened Axe split, Sleepin' On The Job if AFK. |
| Base class, not yet subclassed (W2-early) | Stale base-class Builds. The subclass quest is M2's Goal, not M9's. |
| Just subclassed: tab 3 at 0 on both presets | The lower bound can't see it. The next step on tab 3 is still the first Build step (FR-12), so the player is pointed there. If D6 is adopted, the level-up signal also fires. |
| Elite class (W4-entry) | Tabs 1–3 against the subclass Build. Tab 4 "Not covered yet". |
| Journeyman line | "Not covered yet: Journeyman talent builds". No Goals. |
| AFK Target with no role (Nothing, Lab, Cooking, Divinity, …) | No wrong-preset check. The other rules still run. |
| Active preset `unclassified` (hybrid) | No blocker (FR-5). Drift runs against the closer Build only if it reaches 0.6 overlap; otherwise only the setup and points-left-behind Goals. |
| Swap done in game but not yet saved | The blocker shows until the next cloud save. Switching character saves instantly (#5), and the "last cloud save" line covers it. |
| Player set up the empty preset and forgot to swap back | The next save shows a wrong-preset blocker (US-1): the system corrects itself. |
| Talent max raised by the Library or a bubble | `target: max` resolves from the save's `max`, so drift follows the raise. |
| Stale patch: talent renamed, renumbered or rebalanced | The parser re-sync regenerates talent facts. A Build step pointing at a missing id fails CI on the re-sync PR. If one slips through, that step is skipped at runtime and the entry is reported in diagnostics. The staleness pass (#17) flags Builds whose patch tag is old, and Stale Builds lose FR-15. |
| Parser behind the game version | The banner comes from M10. M9 runs on whatever parsed, and Stale marks follow the patch tags. |
| Offline | No new saves. M9 output for the last good save stays on screen (M10). |
| Multiple tabs | The engine is pure, so every tab shows the same output. M9 has no state to conflict. |
| Second account in the same browser | One account per browser (#10). M9 is per Account State. |
| Pasted save (no history) | All M9 rules work without history, except D6's level-up signal. |
| Contested Build step (two Sources disagree) | The step keeps the badge and is never a core step or used for wrong-role points. The Goal is never the top action (#11 item 5). |

## 7. Dependencies

| Module | M9 uses | Interface |
|---|---|---|
| M1 Sync & Account State | Talent and preset fields, raw inactive attack bar, reset items, `diagnostics.failedSections`, `FIELD_SOURCES` for provenance; `SaveHistory.previous` for D6 only | TR-3, TR-4 added through M1 TR-11 (`schemaVersion` bump, contract snapshot) |
| M2 Stage & Meta Path | Stage id (Build `appliesTo`, `stageAtLeast`); Roles (which skill a class's skilling preset serves); Course Correction owns the Swap Token | `stage.id`; Meta Path Roles entry |
| M3 AFK Safety | Combines M9's blocker with its own into the Verdict; food and capping are M3's | `Goal` with `category: 'blocker'` |
| M4 Purpose & Milestones | None. M9 does not change Purpose; a wrong preset does not change what the activity serves | — |
| M5 Higher-leverage options | Optional hit chance on the AFK target for `accuracyShort` (via the `getMaxDamage` clone). Without it, the condition is unknown (TR-5 rules) | read-only computed slice on the Account State (owned by M5/M1) |
| M6 Unspent & idle | M6 must not emit its own "unspent talent points" item (LM 3h); it references M9's `check.talent-presets.behind` | entry id |
| M7 Spend Plan | None. Reset potions are never bought with gems by M9 | — |
| M8 Collections | None (star signs and constellations are M8's) | — |
| M10 Now screen UI | Renders M9 Goals in the standard Goal and Next Action components; "Not covered yet" list; Stale and Contested marks | M10 TR-2 `Goal`, `NextAction`, `notCovered` |
| M11 Knowledge tooling | `type: build` schema (TR-5), Detector registry, generation of talent facts (TR-10), CI checks (TR-15), golden snapshots | KB schema, `Detector` signature |
| M12 Release | Knowledge Base version and "What's new" list Build changes | changelog |
| M13 Suggestions | Context fields (class, level, entry id) | ADR 0008 context |

## 8. Open decisions for Yasser

❓ D1 - Empty attack bar: blocker or Goal?: When a character is AFK fighting on its fighting preset with fewer than 2 attacks on the bar, should the Verdict be "Fix before you leave" (a blocker), or should it be a compounding Goal that leaves the Verdict alone? Neither fixture has this case today. Options: (a) always a blocker; (b) always a Goal; (c) a blocker at 0 attacks, a Goal at 1.
➡️ (c). Attacks add to AFK damage only while they are on the bar. With none there, the AFK Stretch is badly weakened, which is the kind of "weak setup" #10 lets the Verdict judge. One attack is merely suboptimal, and a blocker there would make Ready rare for no good reason.

❓ D2 - Reset threshold: How many wrong-role points on one preset justify suggesting a Talent Point Reset Potion? Options: (a) any; (b) 30 points (about 10 class levels' worth of one tab); (c) 20% of the preset's spent points; (d) never suggest resets in the MVP.
➡️ (b) 30, and only with a potion or 10 fragments already owned. Both accounts own potions (3 and 10), so the suggestion can be acted on. Counting only wrong-role points (fighting talents on a skilling preset and the reverse, plus hard-capped surplus) means a talent the guide simply forgot to list can never trigger a reset. Neither fixture reaches 30 today, which is the right outcome: their gaps are unspent points and missing presets, not bad allocations.

❓ D3 - Where Build Goals rank in each Stage: LM places the empty second preset (3e) and unspent points (3h) in every Stage's position 3, and the talent core only in W1-early (position 7). Where do the "core next step" (e.g. Idle fighting talent at 0) and the reset suggestion go in W1-mid to W4-entry? Options: (a) position 3 (free value: the points are already earned); (b) just after the Stage's System items; (c) the bottom, as a nice-to-have.
➡️ (a) for core next steps and resets, and (c) for non-core next steps. A core step changes AFK gains for the whole next Stretch and costs nothing but a few clicks, which is the definition of position 3. Non-core pointers are useful but low-stakes and would otherwise crowd the 3-Goal cap.

❓ D4 - Hunter and base-class Builds are only Stale: The only Hunter builds, and the Warrior/Archer/Mage pre-subclass ones, are 2021–22 community guides (v1.23/v1.40b). Should M9 (a) ship them Stale, with the Stale mark and no reset suggestions, (b) ship only their data-backed steps (Idle Shooting 50; Eagle Eye on the skilling preset, PV 5.14), or (c) mark the Hunter "Not covered yet" until a 2026 Source exists?
➡️ (b). Both accounts' next new character is a Hunter (PV ruling), so (c) would leave the next character uncoached exactly when it matters. The full stale order risks advising talents that have since changed. Ship the core steps that game data and PV confirm, tagged Stale, and ask Joseph or Yasser to transcribe a current Hunter build when they make one.

❓ D5 - What to call the presets on screen: The game labels the two presets in a way the dossier read only from minified code ("0"/"1" labels drawn from Lv 30, confidence M). Should Next Actions say (a) "preset 1 / preset 2", (b) the in-game label, whatever it is, or (c) only "your fighting preset / your skilling preset / your other preset"?
➡️ (c), plus the in-game label in brackets once you confirm it with a glance in game. Role names are what the player needs, and they don't break if the label reading is wrong.

❓ D6 - Make "next talent points" contextual?: The non-core "Next talent points: X to N" pointer is true at all times, but only actionable when the character has new points to spend. With save history, M9 could promote it only when the character gained class levels since the previous Play Session and the preset's spend did not change. Options: (a) always show it as a nice-to-have; (b) show it only after a level-up with no spend since, as compounding; (c) never show non-core pointers.
➡️ (b). A level-up with unchanged spend is a reliable sign of new, unspent points (every class level gives points to each unlocked tab, H), so the pointer appears exactly when it's useful. It is hidden otherwise, which keeps the Goal cap for real work. It needs `SaveHistory.previous` and falls back to (c) on a pasted save.

## 9. Red-team notes

**R1. Wrong advice from a guide's omission or typo.** Tier-3 builds skip talents, and one 2026 build names a Warrior talent on an Archer tab.
- *Defence:* wrong-role points count only talents that appear in the other role's Build (FR-15), so a talent no Build mentions can never trigger a reset.
- Drift only ever points forward ("next points"). It never nags about points already spent inside the Build.
- Authors transcribe explicit targets, and CI checks every talent id against generated data (TR-5, TR-15). The Bowman typo is already corrected in the Build table.
- Every Next Action is confidence L with a dated Source and Report this.

**R2. The unspent-points inference is wrong.** The equal-budget assumption could break if a patch adds a per-preset point source, or if some other talent grants points to another tab.
- *Defence:* the numbers are lower bounds, always shown as "at least" (FR-10).
- The only adjustment is the H-sourced tab-2-granting group, which is generated.
- A contract test pins the exact zero on the W3-early Squire Lv 51's tab 2 (244 + 4 = 248), which is live evidence the model holds.
- The FR-9 threshold of 10 absorbs small noise. A per-patch staleness hit on the "Talents" System re-opens TR-7.

**R3. False wrong-preset blockers.** A hybrid preset (a Shaman fighting with Cranium Cooking feeding alchemy, a Barbarian mining-and-fishing preset) could be misread, and a false blocker turns Ready into "Fix before you leave".
- *Defence:* classification needs 60% overlap and a 2× margin, and `unclassified` never blocks (FR-5).
- The blocker fires only when the other preset is the needed role, or is empty (FR-4).
- Both fixtures classify cleanly at ≥ 80%. "No wrong Verdict blocker on either golden snapshot" is an MVP done criterion (#13), and the 2 W3-early blockers match the dossier's independent count.

**R4. Our instruction creates the next problem.** "Set up your second preset" leaves the character on the new preset when the player forgets to swap back.
- *Defence:* every setup or spend Next Action ends with "then swap back to your <role> preset" (FR-7, FR-16).
- If the player forgets, the next save raises the wrong-preset blocker, which Visit Order puts first. The loop closes in one save.

**R5. Patch breakage.** The game patches every 1–2 weeks and talents get rebalanced. A stale Build could keep confidently pointing at a nerfed talent.
- *Defence:* talent facts are generated per re-sync (ADR 0007), and Build entries carry the game version they were verified on.
- The staleness pass (#17) flags them, Stale Builds rank lower and lose reset suggestions (FR-22), and a missing talent id fails CI.

**R6. Burning a potion on the wrong preset.** A potion resets only the active preset, and a Swap Token wipes both.
- *Defence:* FR-16's ordered steps start with "swap to that preset".
- M9 never suggests the Swap Token or gem purchases (FR-17), and never suggests a reset for a wrong or empty preset.

**R7. Noise drowns the Now screen.** The W2-late account has 5 characters with up to 4 M9 findings each.
- *Defence:* M9 emits at most one blocker and two Goals per character (FR-19), suppresses everything else under a blocker (FR-6), and caps non-core pointers (D6).
- The golden summary in §4 shows at most 2 M9 Goals on any fixture character.

**R8. Privacy leak through Report this or provenance.** Talent allocations are harmless, but names and whole saves are not.
- *Defence:* M9 adds nothing to Report this beyond the #11 item 15 fields (TR-13).
- Fixture numbers in this spec and in tests are aggregates by class and level, and the private fixtures stay gitignored.

**R9. Parallel Slot talents may follow the active preset.** If Construction build rate (Sharper Saws), Worship charge (Charge Syphon) or Alchemy talents count only from the active preset, then a Squire fighting on the Cog Board is told it is fine while it loses build rate. That would be wrong advice M9 cannot see.
- *Defence:* this is an unverified game fact, so the MVP gives no Parallel-Slot preset advice (§2), and the wrong-preset check uses the AFK Target only.
- **Research to do before build:** read `N.js` for how Construction, Worship and Alchemy read talent levels (live `SkillLevels` vs `SLpre`). If they use the live preset, add a Contested-free Check in a follow-up spec change.

**R10. Stale computed stats for non-active characters.** `characters[].stats` is a cache that can trail by many levels, so accuracy-surplus advice could be wrong.
- *Defence:* the `accuracyShort` condition uses only M5's `getMaxDamage` clone, never the cache. Without it the condition is unknown: drift treats it as satisfied and resets ignore it (TR-5). M9 never claims "you have too much accuracy" from cached stats.

**R11. Conflict with Course Correction.** The dossier once proposed a Swap Token for the duplicate Squire, and PV overturned it.
- *Defence:* class change is out of M9's scope, and M9 has no entry that mentions the token except the Acquisition's why. The PV ruling lives in M2.
