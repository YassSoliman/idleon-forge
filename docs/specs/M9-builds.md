# M9 Builds

Spec for [#37](https://github.com/YassSoliman/idleon-forge/issues/37), part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Terms follow [`GLOSSARY.md`](../../GLOSSARY.md). Decisions it rests on: ADRs [0002](../adr/0002-deterministic-advice-ai-built-knowledge.md), [0004](../adr/0004-source-precedence.md), [0005](../adr/0005-toolbox-numbers-not-our-formulas.md), [0007](../adr/0007-generated-facts-authored-judgment.md); resolutions of #10, #11, #12, #13, #14, #16, #17, #18, #26, #27.

**Inputs.** Facts and orders come from the character-builds dossier (`research/character-builds`, `docs/research/systems/2026-10-17-character-builds.md`), corrected by the priority verification overlay (`research/priority-verification`, abbreviated **PV**), and placed in the account-wide ranking by the Leverage model (`research/leverage-model`, abbreviated **LM**). Where PV and the dossier disagree, PV wins. Verified against game v1.23 (Toolbox gameVer 2.3.540, pin `6827d3f`).

**Fixtures.** Acceptance criteria cite the two private fixtures by account and class, never by name: the **W2-late account** (5 characters) and the **W3-early account** (6 characters). The spec quotes class, level, a few talent levels and point totals per character; it never quotes names, and the saves themselves stay gitignored. Both were read on 2026-10-17 with the Toolbox parser output (`fixtures/private/*.parsed.json`).

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

Character-level requirements apply to every character with talent data. "Fighting AFK" means `afkType == FIGHTING`; "skilling AFK" means `afkType` is one of MINING, CHOPPIN, FISHING, CATCHING. Any other value (COOKING, LABORATORY, DIVINITY, SPELUNKING, a non-AFK state such as Nothing, or `null` when M1 can't map the id) has no required preset role.

**Classification**

- **FR-1** For each character, M9 classifies the active preset and, from class Lv 15, the other preset as one of `fighting`, `skilling`, `empty`, `incomplete` or `unclassified`.
  - `empty`: no point spent in tabs 1–3.
  - `incomplete`: tabs 1 and 2 have no points but a later tab does.
  - `fighting` / `skilling`: the preset's points in that role's **tagged talents** for the class line are at least twice its points in the other role's tagged talents, and the two together cover at least half the preset's spend (TR-6).
  - `unclassified`: anything else.
- **FR-2** Below class Lv 15 a character has one preset. M9 runs only the drift (FR-11) and attack-bar (FR-13) rules on it. A Beginner at Lv 15 or above (rare; seen only on a W7 public save) is listed under "Not covered yet: Beginner talent builds".

**Wrong preset (Verdict blocker)**

- **FR-3** If the AFK Target needs a role (fighting or skilling), the active preset is not that role (it is classified as the other role, or is `empty` or `incomplete`), and the other preset **is** classified as that role, M9 emits a **blocker** for that character: "Swap to your <role> preset before you leave." The Check declares `effect: blocker`, confidence H (the swap mechanics are read from game code) and `fixHolds: true`, since a swap lasts the whole stretch (M3 FR-7, M11 FR-7).
- **FR-4** If the needed role exists on neither preset, M9 emits **no blocker**: setting up a preset means spending hundreds of points, which is not a quick fix (M3 FR-7 (a)). Instead the "Talent presets" Goal names the needed role: FR-7 or FR-8 when a preset is `empty` or `incomplete` (the active one if both are), or, when both presets hold the same role, "Neither preset is set up for <role>", whose Next Action is the FR-16 reset flow on the other preset when FR-15's conditions 3 and 4 hold, and otherwise links the role's Build.
- **FR-5** An `unclassified` active preset never produces a blocker.
- **FR-6** While FR-3 fires for a character, every other M9 Goal for that character is suppressed. They are re-evaluated on the next save, after the swap.

**Preset setup and points left behind**

- **FR-7** From class Lv 15, if the other preset is `empty`, M9 emits a Goal "Set up your second preset for <role>", where role is the one the active preset does not cover (or, when the active preset is `unclassified`, the role the AFK Target needs, defaulting to skilling). Its Next Action names the first steps of the matching Build and ends with "then swap back" whenever the active preset is the one the AFK Target needs.
- **FR-8** If the other preset is `incomplete`, the Goal reads "Finish your <role> preset" with the same Next Action shape.
- **FR-9** For each preset, M9 computes a lower bound of unspent points per tab by comparing it with the other preset (TR-7). If the total lower bound on a preset is at least 10, M9 emits a Goal "Spend at least N talent points on your <role> preset", naming the tabs and the first unmet Build step in each.
- **FR-10** Lower bounds are always shown as "at least N". The UI never shows an exact unspent count.

**Drift and next points**

- **FR-11** For each classified preset, M9 walks the matching Build's applicable steps (TR-5) and picks the preset's **next step**. That is the first unmet step flagged `core` in any tab (in tab order), or, if every core step is met, the first unmet step in the lowest tab. A step is unmet when its talent is below its target. When both presets have a next step, the character's "Talents" Goal (FR-19) takes a core step before a non-core one, and between two of the same kind, the preset the AFK Target needs (or the active preset when the target needs no role).
- **FR-12** If the next step is `core` (e.g. the Idle fighting talent to 50, Big Pick on a mining preset), M9 emits a Goal "Next talent points: <talent> to <target>" with category `compounding`, placed at position 3 of the Stage's Priority List (D3).
- **FR-12a** If the next step is not `core`, the same Goal is emitted only when the character has new points (D6): its class level is higher than in the **baseline** save and the preset's spend in tabs 1–3 is unchanged from it. Presets are matched across the two saves by slot (`selectedPreset` 0 or 1), not by "active", so a swap in between never compares two different presets. The baseline is the last stored Account State before the current Play Session started (M1 `SaveHistory.previous(uid, s.lastCloudSave)` where `s = sessionStart(uid, now)`), passed to the engine as an input. It is then `compounding`, placed at the bottom of the Stage's list (D3). With no baseline (first save, pasted save, or a baseline stored before the Account State had `talents`) a non-core next step is never shown.

**Attack bar**

- **FR-13** When fighting AFK on a fighting preset, M9 counts attack talents on the active bar, using the generated `isAttack` (TR-10: Toolbox `AFKactivity == 0`, the same test Toolbox's AFK damage uses, so buffs and tools such as Firmly Grasp It, Strafe, Printer Sampling and Roll Da Dice never count). With 0, it emits a **blocker** "Put your attacks on the bar before you leave"; with exactly 1, a `compounding` Goal (D1). Both name the attacks levelled on that preset but missing from the bar. The 0-attack blocker requires at least one attack talent at level 1 or more on the preset (M3 FR-7 (b), fillable) and declares `fixHolds: true`; without one, the Goal "Level an attack and put it on the bar" shows instead, as `compounding`.
- **FR-14** When skilling AFK on a skilling preset and the class line has a skill attack for that skill (generated `skillAttackFor`, TR-10: Big Pick for mining, Log On Logs for choppin, Worming Undercover for fishing; catching has none), and that attack is not on the bar, M9 emits a `compounding` Goal to put it on the bar.

**Reset suggestions**

- **FR-15** M9 suggests a Talent Point Reset Potion for a preset only when all of these hold:
  1. the preset is `fighting` or `skilling`;
  2. its **wrong-role points** are at least **30** (D2). Wrong-role points are points in talents that appear in the *other* role's Build for the class but not in this one, plus points above the target on steps marked `hardCap`;
  3. the account owns at least one potion, or 10 fragments (storage plus inventories);
  4. the Build is not Stale and not Contested;
  5. the character has no tab-4 talent points (no elite class): the potion resets every non-star talent on the preset, tab 4 included, and M9 has no tab-4 Build to re-spend it.
- **FR-16** The suggestion's Next Action gives the exact order: swap to that preset if needed; check in game that the open preset is the one to reset (it shows <talent> at <level>, a talent the other preset lacks), because ActiveOn only sees a swap after the next cloud save; if only fragments are owned, combine 10 fragments into a potion (it needs a free inventory slot); use the potion (it resets the active preset only); spend along the Build; swap back to the preset the AFK Target needs. The title counts what is owned: "(you have N)" for potions, "(you have N fragments)" when there are none.
- **FR-17** M9 never suggests a reset for a wrong preset (FR-3) or an empty preset (FR-7). Never suggests buying potions with gems. Never touches star talents.
- **FR-18** When FR-15 fails only on condition 3 (no potion owned), M9 adds no Goal. The wrong-role points are recorded only in the engine's diagnostics for that character (M11), never shown as advice.

**Output, limits, coverage**

- **FR-19** M9 emits at most **one blocker and two Goals per character**. The blocker is FR-3 or the 0-attack case of FR-13 (they cannot both fire: one needs the wrong preset active, the other the right one). The Goals are one "Talent presets" Goal (FR-4's same-role Goal, FR-7, FR-8 or FR-9, first that fires) and one "Talents" Goal (FR-15, then FR-13/FR-14, then FR-12/FR-12a, first that fires).
- **FR-20** Every M9 Next Action has at least one Source and carries provenance: the entry ids, plus the Account State fields read.
- **FR-21** Characters whose class has no Build (the Journeyman line, Voidwalker included; Beginners from Lv 15), and tabs 4 and 5 (elite and master classes), produce no Goals. The engine lists them under "Not covered yet: <class> talent builds" / "elite talent builds". On an account M2 flags `coverage: 'beyond'` (past W4-entry), no Build applies (their `appliesTo` ends at W4-entry), so M9 emits nothing and lists "Not covered yet: talent builds past World 4".
- **FR-22** A Stale Build (M11 FR-19: its newest Source 10 or more game versions behind, or flagged by the staleness pass; D4's Builds carry the `stale:` flag from the PR that adds them) is still used for FR-3 to FR-14 (ranked below fresh entries, with the Stale mark). It is never used for FR-15.
- **FR-23** M9 output depends only on the Account State, the Knowledge Base, the Stage, and (for FR-12a only) the baseline save. Two runs on the same inputs give identical output.
- **FR-24** Next Actions name presets by role only: "your fighting preset", "your skilling preset", or "your other preset" when the other preset is `empty`, `incomplete` or `unclassified` (D5). They never say "preset 1/2". The in-game label may be added in brackets only once Yasser has confirmed it in game; it is a single Knowledge Base string, empty until then.

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

- **Given** the W2-late account / **When** the engine runs / **Then** 3 characters show "Set up your second preset for skilling": Barbarian Lv 60 (fishing), Bowman Lv 54 (catching), Wizard Lv 56 (choppin). Each Next Action names the first tab-1 steps of the class's skilling Build (Barbarian: Brute Efficiency, then Idle Skilling; Bowman: Elusive Efficiency, then Quickness Boots, since the Archer line has no Idle Skilling talent; Wizard: Smart Efficiency, then Active AFK'er), says "at least N points are waiting" with N = 640, 575 and 592, and ends "then swap back to your fighting preset".
- **Given** the W3-early account / **When** the engine runs / **Then** Squire Lv 85 shows "Set up your second preset for skilling" with "at least 1,020 points", and Shaman Lv 54 shows "Finish your skilling preset" (tabs 1–2 empty, tab 3 started) with "at least 383 points".
- **Given** a synthetic character at Lv 14 with one preset / **When** the engine runs / **Then** no preset Goal shows for it (FR-2).

### US-3 Points left behind on the other preset

*As a player in a Play Session, I want to see when one preset has fallen behind the other, so that the points I already earned are spent on both.*

- **Given** the W2-late account / **When** the engine runs / **Then** Shaman Lv 44 shows "Spend at least 118 talent points on your skilling preset", and Squire Lv 43 shows "Spend at least 17 talent points on your fighting preset".
- **Given** the W3-early account / **When** the engine runs / **Then** Wizard Lv 73 shows "at least 215" on its skilling preset, Barbarian Lv 56's figure (at least 148 on its skilling preset) is suppressed by its US-1 blocker, and Squire Lv 51 shows "Spend at least 115 talent points on your skilling preset", all in the Squire tab. Its first unmet Build step is Refinery Throttle (its `stageAtLeast: W3-early` condition holds on this account).
- **Given** two presets with equal per-tab spend and no tab-2 point talents / **When** the engine runs / **Then** no FR-9 Goal shows (unit test).
- **Given** the W3-early Squire Lv 51, whose presets spend 244 and 248 in tab 2 with Back To Basics at 0 and 4 / **When** the lower bound runs / **Then** tab 2 contributes 0. This is the contract test for the Back To Basics adjustment (TR-7).

### US-4 The core talent I missed

*As a player in a Play Session, I want the one talent that most changes my AFK gains called out, so that new points go there first.*

- **Given** the W2-late account / **When** the engine runs / **Then** Barbarian Lv 60, Shaman Lv 44 and Wizard Lv 56 each show a `compounding` Goal "Next talent points: Idle Brawling to 50" / "Idle Casting to 50" (the Idle fighting talent is at 0 on their fighting preset).
- **Given** the W2-late account, Squire Lv 43, AFK mining on its skilling preset with every core skilling step met (Big Pick 100), and Idle Brawling at 0 on its inactive fighting preset / **When** the engine runs / **Then** its "Talents" Goal is "Next talent points: Idle Brawling to 50 on your fighting preset" (FR-11 precedence: a core step on either preset beats a non-core one).
- **Given** the W3-early account / **When** the engine runs / **Then** Wizard Lv 73 and Shaman Lv 54 show the Idle Casting Goal. The Bowman Lv 60's Idle Shooting at 0 is on its wrong (skilling) preset, so it is suppressed by US-1.
- **Given** the W2-late account, Bowman Lv 54, with Gilded Sword and Sharpened Axe at their targets and Idle Shooting at 13 / **When** the engine runs / **Then** its "Talents" Goal is "Next talent points: Idle Shooting to 50", category `compounding` (core step), with "at 13" in the why.
- **Given** the W3-early account, Squire Lv 51 on its mining preset with Big Pick at 1 while later tab-2 Build steps are at 100 / **When** the engine runs / **Then** its "Talents" Goal is "Next talent points: Big Pick to <target>" (Big Pick is core on the Squire skilling Build).

### US-5 Attacks on the bar

*As a player in a Play Session, I want to know when an AFK fighter has too few attacks on its bar, so that its AFK damage is not thrown away.*

- **Given** the W2-late account / **When** the engine runs / **Then** no FR-13 or FR-14 Goal shows (every fighter has at least 4 attacks on its bar; the mining Squire has Big Pick on its bar).
- **Given** the W3-early Bowman Lv 60 (only Printer Sampling on the active bar) / **When** the engine runs / **Then** FR-13 does not fire, because the active preset is the skilling one and US-1 owns this character.
- **Given** a synthetic AFK fighter on a fighting preset with 0 attacks on its bar / **When** the engine runs / **Then** its Verdict is "Fix before you leave" with the blocker "Put your attacks on the bar before you leave", naming the levelled attacks that are missing (D1).
- **Given** the same fighter with exactly 1 attack on its bar / **When** the engine runs / **Then** no blocker shows and its "Talents" Goal is the `compounding` attack-bar Goal (D1).

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
- **Given** a Hunter (no fixture has one; synthetic) / **When** the engine runs / **Then** its M9 Goals come only from the data-backed steps (Idle Shooting to 50, Eagle Eye), carry the Stale mark, rank below fresh Goals of the same category, and never include a reset (FR-22, D4).
- **Given** the public `highend.json` save (11 characters at Lv 1,700+: 9 elite or master classes, a Voidwalker and a Beginner; M2 flags it `coverage: 'beyond'`) / **When** the engine runs / **Then** no Detector throws, M9 emits no Goal or blocker, and the Now screen lists "Not covered yet: talent builds past World 4" (FR-21). A unit test also runs the classifier and Build walk on its tabs 1–3 to prove 5-tab characters parse.
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
| Core next step (FR-12, compounding) | 5 (Idle talent on Barbarian 60, Shaman 44, Wizard 56; Idle Shooting 13→50 on Bowman 54; Idle Brawling on Squire 43's inactive fighting preset) | 3 (Idle Casting on Wizard 73 and Shaman 54; Big Pick on Squire 51) |
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
    /** Tabs 1–5 in class order (5 only for master classes); from Toolbox `talents` (active) or `talentPreset.talents` (other). */
    tabs: { tab: 1 | 2 | 3 | 4 | 5; tabName: string; talents: TalentLevel[] }[];
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

- **TR-5 Build entry** (`type: build`, authored). It has M11's common `Base` fields (`id`, `system`, `title`, `text`, `why`, `sources[]`, `appliesTo`, `confidence`, `status`, optional `stale`) plus the fields below. M11's current `BuildEntry` (`class`, `preset: 1|2`, a flat `order`) can't express role-keyed presets (D5), per-tab steps, step conditions or the attack bar, so this shape **replaces it: a change request to M11 TR-5**, landing in the same PR as the first Build entries. Ids follow M11's `<system>.<type>.<slug>`. Talent references are Toolbox rawNames (M11 `RawName`, e.g. `IDLE_BRAWLING`), checked against generated talents and resolved to a `skillIndex` at compile time; the shared Basics names (e.g. `GILDED_SWORD`) resolve to one index on every class line.

  ```ts
  export type PresetRole = 'fighting' | 'skilling';
  export type StepCondition =
    | { kind: 'stageAtLeast'; stage: StageId }   // e.g. No Pain No Gain only from W4-entry; Refinery Throttle from W3-early
    | { kind: 'accuracyShort' };                 // accuracy-stat talents; needs M5 hit chance, unknown at MVP ship
  export interface BuildStep {
    talent: RawName;             // a generated talent fact
    target: number | 'max';      // 'max' = the save's TalentLevel.max
    tie?: string;                // steps sharing a tie key are levelled together ("=" in the guide)
    core?: boolean;              // promotes the next-step Goal (FR-12); see the core list below
    hardCap?: boolean;           // points above target count as wrong-role points (FR-15); see the rule below
    when?: StepCondition[];      // all must hold, otherwise the step is skipped
    breakpoints?: number[];      // Apocalypse ZOW 33/66/99/132; Refinery Throttle in multiples of 8
  }
  export interface BuildEntry {
    id: string;                  // talents.build.<classLine>-<role>, e.g. talents.build.squire-skilling
    type: 'build';
    system: 'talents';
    classLine: ClassName;        // Toolbox class id of the line, e.g. "Squire"
    role: PresetRole;
    serves: KnownAfkType[];      // afkTypes this role covers, e.g. ["MINING"]
    variant: 'afk';
    /** The role's talents for classification (TR-6): every talent typical of this role on the line, not only the steps. */
    tags: RawName[];
    tabs: { tab: 1 | 2 | 3; steps: BuildStep[] }[];
    attacks: RawName[];          // attacks the fighting Build wants on the bar (the skill attack is generated, TR-10)
    onePointOk: RawName[];       // utility talents a point in which is never drift (Firmly Grasp It, Teleport)
  }
  ```

  Rules:
  - Every step has an explicit `target` transcribed from the Source build's per-talent levels. An unnumbered step is a CI error. `max` must be written out.
  - A step whose `when` is **false** is skipped by drift.
  - A `when` that **cannot be evaluated** (`accuracyShort` has no M5 data in the MVP, since M5 builds after M9 and computes hit chance only for the active fighting setup) makes the step met for drift (never nag), and its points never count as wrong-role (never reset on an unknown). So at MVP ship no accuracy-stat step ever fires.
  - Stage conditions come from M2's `stage.id` and the Role `activeFrom` stages (M2 TR-9: Alchemy W2-early; Construction, Refinery, Worship, Trapping W3-early). No unlock flags are read.
  - **Bubble-capped talents** (the Bottles, Vessels and Flasks talents) are in the generated group `talent-group.bubble-capped`. In game code their raise is `min(talent bonus, class bubble level)`, so their points work from bubble level 1 and only the part above the bubble level is wasted (N.js `_customBlock_TotalTalentPoints`). The MVP Account State has no bubble levels, so these steps are always treated as met, never drift, and never count as wrong-role points.
  - **`core` steps** in the MVP Builds are only: the Idle fighting talent to 50 on every fighting Build, and the generated skill attack of the served skill on a skilling Build (Big Pick, Log On Logs, Worming Undercover). Nothing else is core.
  - **`hardCap`** is allowed only where a generated fact shows that levels above the target add nothing in this save. A guide's "1 point" or "only for accuracy" advice is never `hardCap`. In the MVP Builds the only `hardCap` steps are the accuracy-stat talents under `accuracyShort`, which are unknown at ship, so in practice wrong-role points come only from the other role's talents.
  - Elite and later class indices map to their subclass line through generated class-tree data (Toolbox `classPromotions.json`). Tabs past 3 are not covered.
  - Source dates: `claimDate` is the guide's last edit, and `gameVersion` is the Toolbox game version current on that date (from Toolbox's patch notes), never a later patch the author didn't see. A guide tagged only with an old in-game version string (the 2021–22 "Community Guide" builds say v1.23 / v1.40b, which collides with today's v1.23) is never used as a Source.

  Example (abridged):

  ```yaml
  - id: talents.build.barbarian-fighting
    type: build
    system: talents
    title: Barbarian fighting build
    text: "Next talent points: {talent} to {target}"
    classLine: Barbarian
    role: fighting
    serves: [FIGHTING]
    variant: afk
    tags: [GILDED_SWORD, SHARPENED_AXE, IDLE_BRAWLING, MEAT_SHANK, POWER_STRIKE, WHIRL, DOUBLE_STRIKE, BEAR_SWIPE, AXE_HURL]  # abridged
    tabs:
      - tab: 1
        steps:
          - { talent: GILDED_SWORD,  target: max }
          - { talent: SHARPENED_AXE, target: max }
          - { talent: IDLE_BRAWLING, target: 50, core: true }
          - { talent: MEAT_SHANK,    target: max }
          - { talent: BOOK_OF_THE_WISE, target: max, hardCap: true, when: [{ kind: accuracyShort }] }
    attacks: [POWER_STRIKE, WHIRL, BEAR_SWIPE, AXE_HURL]
    onePointOk: [FIRMLY_GRASP_IT]
    why: "Damage first, then the Idle fighting talent, per the most-liked current Barbarian build."
    sources:
      - { title: "Sir_Grimtide, Barbarian/Fishing (Toolbox builds)", url: "https://idleontoolbox.com/tools/builds/view?id=ih5wAK", tier: 3, verified: 2026-10-17, claimDate: 2026-10-12, gameVersion: "<Toolbox gameVer on 2026-10-12>" }
    appliesTo: { stages: [{ from: W2-early, to: W4-entry }], classes: [Barbarian], levels: { min: 15 } }
    confidence: L
    status: active
  ```

  **Build set for the MVP** (authors transcribe from the dossier's "Build orders" section; PV 1.3 confirmed, 1.4 unverified tier 3):

  | Class line | Fighting Build source | Skilling Build (serves) | Freshness |
  |---|---|---|---|
  | Beginner (Lv 1–14, one preset) | "Early game dmg", 2026-05-14 | — | fresh |
  | Warrior / Archer / Mage (before subclass) | Data-backed steps only (D4): the 2026 common core (Gilded Sword, Sharpened Axe, Idle fighting talent 50, attacks) | mining / catching / choppin: the efficiency talent, then Idle Skilling (Warrior) or Active AFK'er (Mage) or Quickness Boots (Archer, which has neither), and the skill attack (Big Pick, Log On Logs) | **Stale** (D4) |
  | Barbarian | Sir_Grimtide 2026-10-12 | fishing (FISHING) | fresh |
  | Squire | Sir_Grimtide 2026-10-10 | mining + construction (MINING) | fresh |
  | Bowman | Sir_Grimtide 2026-10-12 (Idle Shooting, not the guide's "Idle Brawling" typo) | catching (CATCHING) | fresh |
  | Hunter | Data-backed steps only (D4): the common core with Idle Shooting to 50 | trapping, Eagle Eye only (PV 5.14) (`serves: []`: used while claiming traps, never an AFK Target; FR-3's skilling side still accepts it as "a skilling preset") | **Stale** (D4) |
  | Wizard | Sir_Grimtide 2026-10-13 | choppin + worship (CHOPPIN) | fresh |
  | Shaman | Sir_Grimtide 2026-10-15 | alchemy + choppin (CHOPPIN) | fresh |

  D4's sparse Builds still carry the class line's full `tags`, so they classify like any other (TR-6).

- **TR-6 Classification** (`classify.ts`). For a preset P and the class line's two Builds F and S: `tagged(P, B) = Σ P.base[t]` over `B.tags`, and `spent(P)` = Σ base over tabs 1–3. The role is F if `tagged(P, F) ≥ 2 × tagged(P, S)` and `tagged(P, F) + tagged(P, S) ≥ 0.5 × spent(P)`, and the same for S; otherwise `unclassified`. `empty` and `incomplete` are checked first (FR-1). Classifying on tag sums rather than overlap with the Build's steps is what the dossier did (every non-empty fixture preset was at least 80% one role, H on fixtures), and it works for D4's sparse Builds, whose few steps would cover far less than half a preset's spend. A fixture test pins the classification of the 17 fixture presets that are neither `empty` nor `incomplete` once the tags are authored.

- **TR-7 Lower bound of unspent points** (`unspent.ts`). Both presets of a character share one budget per tab (dossier, H: `TotalTalentPoints` subtracts only the live preset's spend). Tab-2 budgets differ by the levels of the tab-3 talents that grant tab-2 points (Back To Basics, Previous Points, Earlier Education: +1 tab-2 point per level, a generated fact). For preset p and the other preset q, per tab t:
  - t ≠ 2: `lb(p,t) = max(0, spent(q,t) − spent(p,t))`;
  - t = 2: `lb(p,2) = max(0, spent(q,2) − g(q) + g(p) − spent(p,2))`, where g is the tab-2-granting talent level on that preset.

  This is arithmetic on save data (ADR 0005), not a game formula.

  Fixture values: see US-2 and US-3. Contract test: the W3-early Squire Lv 51's tab 2 gives exactly 0.

- **TR-8 Checks** (`type: check`, authored; each points to one Detector; words, thresholds and Sources live in YAML):

  | Entry id | Detector | Inputs | Output (fires with) | Category |
  |---|---|---|---|---|
  | `talent-presets.check.wrong-preset` | `builds/wrong-preset` | `talents.active`, `talents.other`, `afkType`, Builds | `{ fromRole, toRole, otherRole }`, `fixHolds: true` | blocker (`effect: blocker`, confidence H, tier 1 Source: the preset-swap code) |
  | `talent-presets.check.empty` | `builds/preset-empty` | `talents.active`, `talents.other`, `level`, `afkType` | `{ role, pointsAtLeast, firstSteps[] }` | compounding |
  | `talent-presets.check.incomplete` | `builds/preset-empty` (mode) | same | same | compounding |
  | `talent-presets.check.same-role` | `builds/preset-empty` (mode) | same, plus `resetItems` | `{ role, potionsOwned }` | compounding |
  | `talent-presets.check.behind` | `builds/preset-behind` | both presets | `{ presetRole, pointsAtLeast, tabs[], firstSteps[] }` | spendable |
  | `talents.check.next-step` | `builds/next-step` | both presets, Builds, Stage, M5 hit chance (optional), baseline save (non-core only) | `{ preset, talent, target, current, tab, core }` | compounding (non-core only after a level-up, D6) |
  | `talents.check.attack-bar` | `builds/attack-bar` | `attackBar`, `afkType`, generated `isAttack` | `{ attacksOnBar, missing[], levelledAttack }`, `fixHolds: true` | blocker at 0 with a levelled attack (`effect: blocker`, confidence H, tier 1 Source: the AFK attack code); otherwise compounding (D1) |
  | `talents.check.skill-attack` | `builds/skill-attack` | `attackBar`, `afkType`, generated `skillAttackFor` | `{ talent }` | compounding |
  | `talent-resets.check.reset` | `builds/reset-candidate` | preset, both Builds, `resetItems`, Build status, tab-4 spend | `{ presetRole, wrongRolePoints, talents[], potionsOwned, fragmentsOwned }` | compounding |

  The two blocker Checks meet M3's blocker contract (M3 FR-7): the fix is a swap or a drag onto the bar (quick), everything it needs is in the save (fillable), and it lasts the stretch. They go through M3's `evaluateAfkSafety` pipeline like M3's own Checks. Build entries stay confidence L (tier 3 guides); only these two Checks, whose firing depends on game mechanics and not on a guide's order, are H.

  The engine applies FR-6 (suppression) and FR-19 (at most one blocker and two Goals) after the Detectors run, in `detectors.ts`, so each Detector stays independent and testable alone.

- **TR-9 Goal entries** (authored): `talent-presets.goal.pair` ("Both presets set up and spent", Milestones: other preset set up, then no points left behind) and `talents.goal.follow-build` ("Follow the <class> <role> build", Milestone: steps met / total applicable, e.g. 7 of 19). Their `title` values are "Talent presets" and "Talents" (M10 `Goal.title`).
- **TR-10 Generated facts** (ADR 0007, rebuilt at every parser re-sync from Toolbox `talents.json`, `items.json`, `quests.json`, `gemShop.json`):
  - one fact per talent: rawName, `skillIndex`, name, tab, class line, default max, `funcX/x1/x2`, `isAttack` (`AFKactivity == 0` with `D` and `K` present: the test Toolbox's `getTalentEffectOnKills` uses, which excludes buffs and tools such as Firmly Grasp It, Strafe, Printer Sampling and Roll Da Dice), `skillAttackFor` (`AFKactivity` 1 = mining, 3 = choppin, 4 = fishing: Big Pick, Log On Logs, Worming Undercover), and a value table at levels 10/25/50/100 computed by Toolbox's growth function. That a skill attack helps AFK skilling only while on the bar is read from this game-data field (H on data); confirming the effect in `N.js` is a pre-build research task, like R9;
  - `talent-group.tab2-granting`: Back To Basics, Previous Points, Earlier Education;
  - `talent-group.bubble-capped`: the Bottles, Vessels and Flasks talents (TR-5);
  - the reset items `ResetCompleted` and `ResetFrag` (10 make 1);
  - the reset potion's Acquisition: the 9 W1–W3 quest sources (Promotheus ×3, Hamish ×1, Speccius ×1, Lord of the Hunt ×4) and the gem price (200 gems, 10 per week). It is stored as a fact for "Where do I get one?" in the reset Goal's Focus details (quest sources only); the gem price is never shown (FR-17).
- **TR-11 Priority List placement** (authored, D3). M9's Goals enter the Stage lists of LM §3: the empty or incomplete preset as **3e**, points left behind as part of **3h**, and core next steps (`talents.check.next-step` with `core`) and reset suggestions at **position 3** in every Stage from W1-early to W4-entry. W1-early's existing position 7 ("Talent core") is replaced by that position-3 item. Non-core next steps go at the bottom of every Stage's list. M2 owns the list files and currently places Talents at positions 4+ (M2 TR-13); this placement is a change request to M2, to land with M9's entries.

### Performance

- **TR-12** All M9 Detectors together take ≤ 5 ms per engine run for an 11-character account in the worker. That is O(characters × talents), about 11 × 2 × 60 lookups. The compiled Build entries add ≤ 60 KB to the Knowledge Base JSON.

### Security and privacy

- **TR-13** M9 stores nothing. It reads only the in-memory Account State and needs no network. Report this and Suggestions send the entry id, Knowledge Base version, game version, Stage, class and level (#11 item 15, ADR 0008), plus the rendered action text that M10 adds (M10 US-12). M9's action text may carry the one talent level or point total it is about ("at 13", "at least 115 points"); it never carries the full allocation, names (characters are `{char}` in templates, M10 R3) or other characters. A unit test renders every M9 template on both fixtures and checks the report body for names and for more than one talent level.
- **TR-14** Build entries cite public community builds by URL and author handle only. No player data enters the Knowledge Base. Fixture-derived numbers stay in tests that run locally (`fixtures/private/`) or in the scrubbed W2 save in CI.

### Tests

- **TR-15** Vitest, per Detector: fires / doesn't-fire on both private fixtures (local), on the scrubbed W2 save (CI) and on the 11 public saves (CI, no crash, classification coverage reported). Synthetic Account States cover the reset, attack-bar, Lv < 15 and failed-section cases. The golden Now-screen snapshot per fixture pins the summary table in §4. A CI schema check rejects a Build step whose talent rawName is missing from `generated/talents.json`, an unnumbered target, a `core` or `hardCap` flag outside the TR-5 lists, a `skillAttack` authored by hand, or a Build without a dated Source (`claimDate` and a `gameVersion` no later than that date).

## 6. States and edge cases

| State | Behaviour |
|---|---|
| Loading / no save yet | M9 does not run. |
| Broken parse or empty account | No advice (M1, M10). M9 never runs on a failed read. |
| `talents` section failed for one character | That character gets no M9 output. Detectors are listed in `diagnostics.failedDetectors` (US-8). |
| Raw `AttackLoadoutpre_<i>` unreadable | `other.attackBar = null`. FR-3 still fires from talent levels. Nothing that needs the inactive bar fires. |
| Class Lv < 15 | One preset. Only drift and attack bar (FR-2). |
| Beginner (Lv < 10) | Beginner Build: Gilded Sword and Sharpened Axe split, Sleepin' On The Job if AFK. |
| Beginner at Lv 15+ | "Not covered yet: Beginner talent builds" (FR-2, FR-21). |
| Base class, not yet subclassed (W2-early) | Stale, data-backed base-class Builds (D4). The subclass quest is M2's Goal, not M9's. |
| Just subclassed: tab 3 at 0 on both presets | The lower bound can't see it. The next step on tab 3 is still the first Build step (FR-11), so the player is pointed there if it is core; if it isn't, the FR-12a level-up signal shows it once history has a baseline. |
| Elite class (W4-entry) | Tabs 1–3 against the subclass Build. Tab 4 "Not covered yet". No reset suggestion, since a potion would also wipe tab 4 (FR-15 condition 5). |
| Account past W4-entry (`coverage: 'beyond'`) | No Build applies; M9 emits nothing and lists "Not covered yet: talent builds past World 4" (FR-21). |
| Journeyman line (Voidwalker included) | "Not covered yet: Journeyman talent builds". No Goals. |
| AFK Target with no role (COOKING, LABORATORY, DIVINITY, SPELUNKING, Nothing, `null`) | No wrong-preset check. The other rules still run. |
| Active preset `empty` or `incomplete` while AFK needs a role | Blocker if the other preset is that role (FR-3); otherwise the setup Goal names the active preset (FR-4). |
| Both presets the same role | No blocker; "Neither preset is set up for <role>" (FR-4). |
| Active preset `unclassified` (hybrid) | No blocker (FR-5). No drift on it (FR-11 needs a classified preset); only the setup and points-left-behind Goals. |
| Swap done in game but not yet saved | The blocker shows until the next cloud save. Switching character saves instantly (#5), and the "last cloud save" line covers it. |
| Player set up the empty preset and forgot to swap back | The next save shows a wrong-preset blocker (US-1), including while the new preset is still `incomplete` (FR-3): the system corrects itself. |
| Reset suggested, then swapped in game but not yet saved | FR-16's in-game check ("it shows <talent> at <level>") tells the player which preset is open before the potion is used. |
| Talent max raised by the Library or a bubble | `target: max` resolves from the save's `max`, so drift follows the raise. Bubble-capped talents themselves never drift (TR-5). |
| Stale patch: talent renamed, renumbered or rebalanced | The parser re-sync regenerates talent facts. A Build step pointing at a missing id fails CI on the re-sync PR. If one slips through, that step is skipped at runtime and the entry is reported in diagnostics. Builds go Stale by M11's rule (10 game versions behind, or flagged by the staleness pass, #17), and Stale Builds lose FR-15. Generated facts such as `isAttack`, `skillAttackFor` and the bubble-capped group are rebuilt from game data, so they follow a rebalance with no authoring. |
| Parser behind the game version | The banner comes from M10. M9 runs on whatever parsed, and Stale marks follow the patch tags. |
| Offline | No new saves. M9 output for the last good save stays on screen (M10). |
| Multiple tabs | The engine is pure, so every tab shows the same output. M9 has no state to conflict. |
| Second account in the same browser | One account per browser (#10). M9 is per Account State. |
| Pasted save (no history) | All M9 rules work without history, except FR-12a: non-core next steps never show (D6). |
| Contested Build (two Sources disagree) | Contested is per entry (M11 FR-6): the whole Build carries the badge, is never used for wrong-role points or FR-15, and its Goals are never the top action (#11 item 5). Contested entries can never back a blocker (M11 FR-6), which is why the two blocker Checks don't depend on a Build's order. |

## 7. Dependencies

| Module | M9 uses | Interface |
|---|---|---|
| M1 Sync & Account State | Talent and preset fields, raw inactive attack bar, reset items, `diagnostics.failedSections`, `FIELD_SOURCES` for provenance; `SaveHistory.previous` and `sessionStart` for FR-12a only | TR-3, TR-4 added through M1 TR-11 (`schemaVersion` bump, contract snapshot) |
| M2 Stage & Meta Path | Stage id (Build `appliesTo`, `stageAtLeast`), `coverage` (FR-21); Roles and their `activeFrom` stages (TR-5 conditions); Course Correction owns the Swap Token. **Change request:** M2 owns the Priority List files; TR-11 asks it to add M9's core next steps and resets at position 3 and non-core next steps at the bottom (D3), and to replace W1-early position 7 | `stage.id`, `coverage`; Meta Path Roles entry; list files |
| M3 AFK Safety | Combines M9's two blocker Checks with its own into the Verdict, through its blocker contract (FR-7) and `evaluateAfkSafety` pipeline; food and capping are M3's | M11 `CheckFinding` with `effect: blocker` and `fixHolds` |
| M4 Purpose & Milestones | None. M9 does not change Purpose; a wrong preset does not change what the activity serves | — |
| M5 Higher-leverage options | Nothing at MVP ship: M5 builds after M9, lists no M9 dependency, and computes hit chance only for the active fighting setup. `accuracyShort` is therefore always unknown at ship (TR-5), and no acceptance criterion depends on it. A later hit-chance slice would light it up | (later) read-only computed slice on the Account State |
| M6 Unspent & idle | M6 must not emit its own "unspent talent points" item (LM 3h); it references M9's `talent-presets.check.behind`. **Change request:** M6 FR-25 (`talent-presets.fill-second`, "Fill talent preset 2 …") ships first and is retired when M9 ships (`retired.replacedBy: talent-presets.check.empty`); its wording breaks D5 and it assumes the empty preset is always for skilling. Both modules write `systems/talent-presets.yaml`; M9 owns it from then on | entry ids, `retired` |
| M7 Spend Plan | None. Reset potions are never bought with gems by M9 | — |
| M8 Collections | None (star signs and constellations are M8's) | — |
| M10 Now screen UI | Renders M9 Goals in the standard Goal and Next Action components; "Not covered yet" list; Stale and Contested marks | M10 TR-2 `Goal`, `NextAction`, `notCovered` |
| M11 Knowledge tooling | `type: build` schema (TR-5, **change request**: M9's shape replaces M11's `BuildEntry`), id format, Stale rule (FR-19), blocker confidence rule (FR-7), Detector registry, generation of talent facts (TR-10), CI checks (TR-15), golden snapshots | KB schema, `Detector` signature |
| M12 Release | Knowledge Base version and "What's new" list Build changes | changelog |
| M13 Suggestions | Context fields (class, level, entry id) | ADR 0008 context |

## 8. Decisions

Ruled by Yasser on 2026-10-17 (PR #49): every recommendation accepted as written.

- **D1 - Attack bar: a blocker at 0 attacks, a Goal at 1.** An AFK fighter on its fighting preset with no counted attack on the bar gets a Verdict blocker; with exactly 1 it gets a `compounding` Goal. *Why:* attacks add to AFK damage only while on the bar, so an empty bar badly weakens the whole AFK Stretch, the kind of weak setup #10 lets the Verdict judge; one attack is merely suboptimal, and a blocker there would make Ready rare for no good reason. Touches FR-13, FR-19, US-5, TR-8.
- **D2 - Reset threshold: 30 wrong-role points, with a potion or 10 fragments already owned.** *Why:* 30 points is about 10 class levels' worth of one tab; both accounts own potions, so the suggestion can be acted on; counting only wrong-role points (the other role's Build talents plus hard-capped surplus) means a talent a guide forgot to list can never trigger a reset. Neither fixture reaches 30 today, which is right: their gaps are unspent points and missing presets, not bad allocations. Touches FR-15, US-6.
- **D3 - Placement: core next steps and resets at position 3 of every Stage's list; non-core next steps at the bottom.** *Why:* a core step changes AFK gains for the whole next Stretch and costs a few clicks, the definition of position 3 (free value: the points are already earned); non-core pointers are useful but low-stakes and would otherwise crowd the 3-Goal cap. Touches FR-12, TR-11.
- **D4 - Hunter and pre-subclass base classes ship only their data-backed steps, tagged Stale.** The Hunter Builds carry Idle Shooting to 50 (fighting) and Eagle Eye (skilling, PV 5.14); the Warrior, Archer and Mage Builds carry the 2026 common core (Gilded Sword, Sharpened Axe, the Idle fighting talent to 50; the class efficiency talent and Idle Skilling or Active AFK'er) plus the skill attack. Every such Build is Stale, so it never drives a reset. A current Hunter build is to be transcribed by Joseph or Yasser when they make one. *Why:* both accounts' next new character is a Hunter (PV ruling), so "Not covered yet" would leave it uncoached exactly when it matters, while the full 2021–22 order risks advising talents that have since changed. Touches the Build set table (TR-5), FR-1, FR-22, US-7.
- **D5 - On screen, presets are named by role: "your fighting preset", "your skilling preset", "your other preset".** The in-game label is added in brackets only after Yasser confirms it with a glance in game; until then no label is shown. *Why:* role names are what the player needs, and they don't break if the label reading (M confidence, from minified code) is wrong. Touches FR-3, FR-7, FR-16, FR-24.
- **D6 - Non-core "next talent points" appear only after a level-up with no spend since.** The pointer shows, as `compounding`, only when the character gained class levels since the last save before the current Play Session and the preset's spend did not change. Without that history (first save, pasted save) it never shows. Core next steps are unaffected. *Why:* every class level gives points to each unlocked tab (H), so a level-up with unchanged spend is a reliable sign of new points, and the pointer appears exactly when it is useful while leaving the Goal cap for real work otherwise. Touches FR-12, FR-23, TR-8, section 6.

## 9. Red-team notes

**R1. Wrong advice from a guide's omission or typo.** Tier-3 builds skip talents, and one 2026 build names a Warrior talent on an Archer tab.
- *Defence:* wrong-role points count only talents that appear in the other role's Build (FR-15), so a talent no Build mentions can never trigger a reset.
- Drift only ever points forward ("next points"). It never nags about points already spent inside the Build.
- Authors transcribe explicit targets, and CI checks every talent id against generated data (TR-5, TR-15). The Bowman typo is already corrected in the Build table.
- Every Build-driven Next Action is confidence L with a dated Source and Report this. Only the two blocker Checks are H, because they rest on game mechanics (the swap and the AFK attack code), not on a guide's order (TR-8).

**R2. The unspent-points inference is wrong.** The equal-budget assumption could break if a patch adds a per-preset point source, or if some other talent grants points to another tab.
- *Defence:* the numbers are lower bounds, always shown as "at least" (FR-10).
- The only adjustment is the H-sourced tab-2-granting group, which is generated.
- A contract test pins the exact zero on the W3-early Squire Lv 51's tab 2 (244 + 4 = 248), which is live evidence the model holds.
- The FR-9 threshold of 10 absorbs small noise. A per-patch staleness hit on the "Talents" System re-opens TR-7.

**R3. False wrong-preset blockers.** A hybrid preset (a Shaman fighting with Cranium Cooking feeding alchemy, a Barbarian mining-and-fishing preset) could be misread, and a false blocker turns Ready into "Fix before you leave".
- *Defence:* classification needs a 2× margin on role-tagged points that cover at least half the preset (TR-6), and `unclassified` never blocks (FR-5).
- The blocker fires only when the other preset is classified as the needed role (FR-3); otherwise the fix is a Goal (FR-4).
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
- *Defence:* M9 emits at most one blocker and two Goals per character (FR-19), suppresses everything else under a blocker (FR-6), and shows non-core pointers only after a level-up with no spend since (D6).
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

## 10. Red-team log

An independent red-team ran on 2026-10-17 against this spec (with D1–D6 folded in), the glossary, the ADRs, the character-builds dossier, PV and LM, Toolbox @ `6827d3f`, the game client `N.js`, the M1, M2, M3, M5, M6, M10 and M11 draft specs, and the private fixtures (aggregates only). Each finding was checked against that evidence before a verdict. It also recomputed every lower bound in US-2 and US-3, the reset-item counts and the two W3-early blockers, and found them all correct. 26 findings: P0 2, P1 11, P2 11, P3 2. Verdicts: fixed 23, fixed in part 2, deferred 1, rejected 0 (sub-points of #1, #12, #21 and #26 rejected, as noted).

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| 1 | P0 | A character AFK on an `empty` or `incomplete` active preset got no blocker and could show Ready, which is exactly the state FR-7 creates when the player forgets to swap back. | Fixed | FR-3 now fires when the active preset is not the needed role (other role, `empty` or `incomplete`) and the other preset is. FR-4 handles the rest; section 6 rows. Rejected: a Goal for an `unclassified` active preset, which adds noise for hybrids that are often deliberate. |
| 2 | P0 | "Bottle/vessel/flask talents are useless until the bubble passes 100" is wrong: N.js raises the max by `min(talent bonus, bubble level)`, so the points work from bubble level 1. Counting them as wrong-role could burn a potion on working points. | Fixed | Dropped `classBubbleAbove`. Bubble-capped talents (a generated group) never drift and never count as wrong-role, since the MVP has no bubble levels (TR-5, TR-10). |
| 3 | P1 | `isAttack` = "has D and K" counts buffs and tools (Firmly Grasp It, Strafe, Big Pick, Eagle Eye, Charge Syphon), so the 0-attack blocker would rarely fire. | Fixed | `isAttack` is `AFKactivity == 0`, Toolbox's own AFK-damage test (`getTalentEffectOnKills`), FR-13 and TR-10. The Printer Sampling and Roll Da Dice exception falls out of it. Fixture bar counts are unchanged. |
| 4 | P1 | FR-3 could say "swap to your skilling preset" when the other preset is `unclassified` or holds the same role. | Fixed | FR-3 requires the other preset to be classified as the needed role. A same-role pair gets FR-4's "Neither preset is set up for <role>" Goal. |
| 5 | P1 | Core next steps take position 3 as "free value" even when the preset has no unspent points (e.g. the W3-early Squire Lv 51's tab 2 lower bound is exactly 0). | Deferred | Changes how ruled D3 ranks things. Needs Yasser. |
| 6 | P1 | The W2-late golden misses a firing: the Squire Lv 43's inactive fighting preset has Idle Brawling at 0. Also, which preset's next step wins was undefined. | Fixed | FR-11 precedence (core first, then the preset the AFK Target needs), a new US-4 case, and W2-late core count 4 → 5 in the summary table. Verified on the fixture. |
| 7 | P1 | D4's sparse Builds can't reach the 60% overlap threshold, so Hunters and pre-subclass characters would be `unclassified` and get nothing. | Fixed | TR-6 classifies on role-tagged talent sums (the dossier's method), with a full `tags` list per Build independent of its steps (TR-5). |
| 8 | P1 | The blockers ignored M3's blocker contract: FR-4 ("set up a preset") isn't a quick fix; 0 attacks with none levelled isn't fillable; there was no `effect` or `fixHolds`. | Fixed | FR-4 is a Goal, not a blocker. The 0-attack blocker needs a levelled attack. Both blocker Checks declare `effect: blocker`, `fixHolds: true` and confidence H, and go through `evaluateAfkSafety` (TR-8, section 7). |
| 9 | P1 | Contradicts M11: id format, `BuildEntry` shape (`preset: 1\|2` clashes with D5), Source fields, `appliesTo` shape, blockers need confidence H, `stale` set only by the staleness pass. | Fixed | Ids renamed to `<system>.<type>.<slug>`. TR-5 uses M11's `Base`, `Source` and `AppliesTo`, with rawName talent refs. Replacing `BuildEntry` is a change request to M11. Blocker Checks are H, and D4's Stale is the `stale:` flag (FR-22). |
| 10 | P1 | `when` conditions need bubble levels and unlock flags nobody requested, so gated steps would silently count as met. | Fixed | Conditions cut to `stageAtLeast` (from M2's Stage and Role `activeFrom`) and `accuracyShort`; bubble conditions dropped (#2). No new Account State fields. |
| 11 | P1 | M6 FR-25 already emits the empty-second-preset Goal, as "preset 2" (against D5), always for skilling, in the same YAML file. | Fixed | Change request in section 7: M6's entry is retired, replaced by M9's when M9 ships, and M9 owns `talent-presets.yaml`. |
| 12 | P1 | A reset can land on the wrong preset after a swap the save hasn't seen yet; the potion can't be undone. | Fixed | FR-16 adds an in-game check ("it shows <talent> at <level>") before using the potion; section 6 row. Rejected: hiding the reset when the save is over 5 minutes old, which would hide it during most of a session, while the in-game check covers the same risk. |
| 13 | P1 | Staleness can't work: the 2021–22 guides' "v1.23" tag collides with today's v1.23, and the 2026-10 guides were stamped with 2.3.540, a patch released after them. | Fixed | TR-5: `gameVersion` is the version current on the guide's `claimDate`, and guides with only an in-game version string are never used as Sources (D4 already drops them). CI checks the date (TR-15). |
| 14 | P2 | The Archer line has no Idle Skilling or Active AFK'er, so the W2 Bowman's US-2 text and D4's Archer Build were wrong. | Fixed | US-2 names each class's real tab-1 steps (Bowman: Elusive Efficiency, then Quickness Boots), and so does the Build set table. Verified in `talents.json`. |
| 15 | P2 | `highend.json` isn't "all elite or later": it has a Voidwalker and a Lv-1,717 Beginner, master classes have 5 tabs, and M2 marks it `beyond`. | Fixed | US-7 rewritten. FR-2 and FR-21 list Lv 15+ Beginners and the Voidwalker as not covered; `beyond` accounts get nothing from M9; TR-3 allows tab 5. Verified on the save. |
| 16 | P2 | FR-14 misses fishing (Worming Undercover), and the skill attack's AFK effect is unverified. | Fixed in part | The skill attack per skill is generated from `AFKactivity` (1 mining, 3 choppin, 4 fishing; catching has none). Confirming the on-bar effect in `N.js` is a pre-build research task (TR-10). |
| 17 | P2 | US-6's "largest wrong-role allocation is 6 Gilded Sword points" was false under the old bubble rule. | Fixed | It holds again: bubble-capped talents no longer count (#2). |
| 18 | P2 | `core` and `hardCap` were left to authors, so a "1 point" step marked `hardCap` (Squire Shockwave Slash and Daggerang, 61 points over) would break US-6. | Fixed | TR-5 lists the only `core` steps (the Idle fighting talent to 50, the skill attack) and restricts `hardCap` to generated caps, never guide advice; CI enforces both (TR-15). |
| 19 | P2 | FR-12a compared "active" with "active" across a swap; baselines stored before the schema bump have no talents. | Fixed | Presets are matched by slot. A baseline without `talents` counts as no baseline. |
| 20 | P2 | Report this carries M10's action text, which holds talent levels, against TR-13's "never the allocation". | Fixed | TR-13 states what the action text may hold (one level or point total, no names) and adds a test. |
| 21 | P2 | Position-3 placement conflicts with M2's list ownership (Talents at 4+), and resets "don't belong" at position 3. | Fixed in part | Recorded as a change request to M2 (TR-11, section 7). Rejected: moving resets out of position 3, which Yasser ruled in D3. |
| 22 | P2 | M5 offers no hit chance to M9 (it builds after M9 and covers only the active fighting setup), so `accuracyShort` is always unknown. | Fixed | Section 7 and TR-5 say so: no accuracy step fires at ship, and no acceptance criterion depends on it. |
| 23 | P2 | The reset flow skips combining fragments, "(you have N)" is undefined with only fragments, and on elites the potion also wipes tab 4. | Fixed | FR-16 adds the combine step and the fragment wording. FR-15 condition 5 excludes characters with tab-4 points. |
| 24 | P2 | TR-6's "≥ 80% on both fixtures" quoted the dossier's tag-share metric, not TR-6's overlap metric. | Fixed | TR-6 now uses the dossier's metric (#7), with a fixture test pinning all 17 classifiable presets. |
| 25 | P3 | Nits: per-step Contested isn't representable; FR-18's "Focus provenance" had nowhere to live; the gem price display was undefined; `star` steps were unused; the `afkType` names were wrong; a `null` afkType had no rule. | Fixed | Contested is per Build (section 6). FR-18 goes to diagnostics. The Acquisition shows quest sources only. `star` dropped from the Build shape. Real `afkType` names, with `null` meaning no role. |
| 26 | P3 | The spec quotes per-character class, level and talent figures from private accounts while claiming "only aggregates". | Fixed | The Fixtures line now says exactly what is quoted (no names, saves gitignored). Rejected: rounding the numbers, since the goldens need exact values and no names are present. |

## Final rulings (Yasser, 2026-10-17)

These supersede anything above that conflicts with them.

> **In-game fact (Yasser, 2026-10-17):** the game just calls them "presets", with no per-preset label. **D5:** on screen, use role names only ("your fighting preset", "your skilling preset", "your other preset"), with no bracketed in-game label.

> **Ruled by Yasser (2026-10-17):** RT1: a core next step keeps position 3 only when that tab's unspent-points lower bound is above 0 or FR-12a's level-up signal fires. Otherwise it goes to the bottom of the list.
