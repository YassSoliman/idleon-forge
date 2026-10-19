## Family bonuses and character slots

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Paths: `V` = `packages/toolbox-parsers/vendor/` in the reference checkout; `TB` = `https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/`. Tiers: 1 game data/Toolbox code, 2 Toolbox dashboard, 3 wiki, 4 community. Confidence H/M/L. Note: tier numbering here follows the task brief (3 = wiki, 4 = community); prior ActiveOn research is cited as "prior" with the tier of its own underlying source.

- **What it is:** Every character you own passes a small permanent bonus to ALL your characters, set by its class line and its level. Separately, the sum of all character levels ("family level") opens new character slots and Family obol slots. [C1] [C2]
- **Unlocks:** Always on. A class's bonus starts at level 9 (base class: Warrior, Archer, Mage, Journeyman), 29 (subclass), 69 (elite), 129 (master) of the character holding it. [C3] Character slot 2 opens at family level 8. [C28]
- **Scope:** Account-wide. The bonus is computed per played character (Toolbox walks every character, then adds the played character's THE_FAMILY_GUY buff), so two characters can see different values for the same class. [C4] [C5] Family level is account-wide. [C26]
- **Inputs → outputs:** In: each character's class and class level (`Lv0_*`, class id). Out: one number per class (stats, %, talent levels, see catalogue), plus slot and obol-slot gates. [C4] [C26]
- **Goals and Milestones:**

| Family level | Opens |
|---|---|
| 8 / 30 / 70 / 150 | character slots 2 / 3 / 4 / 5 [C28] |
| 300 / 500 / 750 / 1,100 / 1,500 | slots 6 / 7 / 8 / 9 / 10 [C28] [C29] |
| 5,000 | slot 11 [C28] [C29] |
| 60 ... 5,000 | 24 Family obol slots (full table in catalogue M9) [C30] |

  Class level thresholds for each family bonus: 9 / 29 / 69 / 129. [C3]
- **Feeds / fed by:** Fed by character levels (class EXP). Feeds: Printer sample size (Maestro), Refinery speed (Divine Knight), Sailing min travel (Siege Breaker), damage/HP/WP (Barbarian, Squire, Blood Berserker, Arcane Cultist), drop rate (Royal Guardian), kills per kill (Death Bringer), efficiency (Hunter), talent points (Wizard), golden foods (Shaman), AFK gains (Voidwalker, Beast Master), added talent levels (Elemental Sorcerer). [C42] Family level also gates Tome bonuses (tome.ts L292 too) and a Menagerie quantity. [C27]
- **Per-session actions:** Check (a) a free slot is now open (family level at gate, fewer characters than slots), (b) a Family obol slot is open but empty, (c) a class line in the six W1-W4 subclasses plus Journeyman is missing, (d) which character in each line is the highest (do not level a duplicate line expecting more). Idle state: slot open and unused; obol slot open and empty. [C28] [C30] [C33]
- **AFK Setup implications:** Any character leveling its class (fighting AFK) raises family level; the lowest-level character in a line adds nothing to that line's bonus, so only the highest in each line matters for bonuses, while every character's level still counts toward family level. [C4] [C26]
- **Min-max by stage:** see section below.
- **Common mistakes:** Two characters of the same subclass (the second adds nothing to family bonuses). [C4] Forgetting the Journeyman line (Maestro printer, Voidwalker AFK, Journeyman luk). [C10] Not taking the 6th+ slot when family level allows (Toolbox warns). [C29] Reading the displayed bonus as the same on every character (see M13) (THE_FAMILY_GUY only buffs the played character's own, except Divine Knight and Siege Breaker values). [C5] Stopping at the class level before the bonus starts (a level-28 Squire gives 0). [C2] Waiting on a Sub Class Swap Token to "move" a bonus: the token only swaps within the same line. [C34]
- **Save and Toolbox fields:** see catalogue per mechanic. Core: `account.accountLevel`, `characters[].level`, `characters[].class`, `characters[].familyBonuses[<Class>]` (Toolbox parse, keyed by class name), `characters[].familyGuyWithoutFamily`. [C26] [C4]
- **Sources:** inline per claim, plus claim list at the end.

### Mechanics catalogue

Formula engine (all family bonuses): `bonus = growth(func, round(level - x3), x1, x2)` if `level >= x3` else 0; unrounded. [C2] [C5]
- `intervalAdd`: `x1 + floor(L / x2)` (uncapped).
- `decay`: `x1 * L / (L + x2)` (asymptote x1, never capped by a level).
- `decayMulti`: `1 + x1 * L / (L + x2)` (a multiplier starting at 1). [C5]

**M1. Walk and highest-wins rule.** For the played character, Toolbox walks all characters in save order and, for each, every class in its talent-tab line (e.g. a Blood Berserker covers Warrior, Barbarian, Blood Berserker). A class's stored value is replaced only when the new raw value is greater. So the best character in each line sets that line's value, and a higher-tier character also supplies the lower-tier family bonuses of its own line (a level-130 Death Bringer gives Warrior, Barbarian, Blood Berserker and Death Bringer all at level 130). Path: `V/parsers/family.ts#L52-L70`; stored at `characters[].familyBonuses` (`character.ts#L521`). [C4] [C6]

**M2. Class table.** Each playable class: bonus text, curve, x3 start (level), x1/x2, value examples. Path `V/data/website-data/shared-data.json` key `classFamilyBonuses` (42 rows, indexed by game class index; map via `classPromotions.json`). [C1] [C3] Rows C10-C31 below.

| Class (index) | Bonus | Curve x1/x2, from | Value at start+30 / L100 / L200 / L300 |
|---|---|---|---|
| Journeyman (2) | +N total LUK | intervalAdd 1/5, 9 | 7 / 19 / 39 / 59 [C10] |
| Warrior (7) | +N total STR | intervalAdd 1/5, 9 | same [C11] |
| Archer (19) | +N total AGI | intervalAdd 1/5, 9 | same [C12] |
| Mage (31) | +N total WIS | intervalAdd 1/5, 9 | same [C13] |
| Maestro (3) | +% printer sample size (Toolbox caps its use at 5 in the sample formula) | decay 6/100, 29 | 1.4 / 2.5 / 3.8 / 4.4 [C14] |
| Barbarian (8) | +N weapon power | decay 25/100, 29 | 5.8 / 10.4 / 15.8 / 18.3 [C15] |
| Squire (9) | +% total HP | decay 40/100, 29 | 9.2 / 16.6 / 25.2 / 29.2 [C16] |
| Bowman (20) | +% EXP when fighting actively | decay 38/100, 29 | 8.8 / 15.8 / 24.0 / 27.8 [C17] |
| Hunter (21) | +% efficiency for all skills | decay 30/100, 29 | 6.9 / 12.5 / 18.9 / 21.9 [C18] |
| Wizard (32) | +N star-tab talent points | intervalAdd 1/6, 29 | 6 / 12 / 29 / 46 [C19] |
| Shaman (33) | x higher bonuses from golden foods | decayMulti 0.4/100, 29 | 1.09 / 1.17 / 1.25 / 1.29 [C20] |
| Voidwalker (4) | +% fighting AFK gains | decay 5/250, 69 | 0.5 / 0.6 / 1.7 / 2.4 (from L100 values are at L-69) [C21] |
| Blood Berserker (10) | +% total damage | decay 20/180, 69 | 2.9 / 2.9 / 8.4 / 11.2 [C22] |
| Divine Knight (12) | +% Refinery speed | decay 50/150, 69 | 8.3 / 8.6 / 23.3 / 30.3 [C23] |
| Beast Master (25) | +% all-skill AFK gains | decay 5/180, 69 | 0.7 / 0.7 / 2.1 / 2.8 [C24] |
| Elemental Sorcerer (34) | +N levels to all talents above level 1 | decay 20/350, 69 | 1.6 / 1.6 / 5.5 / 8.0 (floored when applied) [C25] |
| Bubonic Conjuror (36) | +% all stats (STR, AGI, WIS, LUK) | decay 5/180, 69 | 0.7 / 0.7 / 2.1 / 2.8 [C35] |
| Siege Breaker (22) | +% faster minimum boat travel time | decay 20/170, 69 | 3.0 / 3.1 / 8.7 / 11.5 [C36] |
| Death Bringer (14) | +% kill per kill | decay 60/800, 129 | 2.2 (L159) / n/a / 4.9 / 10.6 [C37] |
| Royal Guardian (16) | +% drop rate multiplier | decay 10/800, 129 | 0.36 (L159) / n/a / 0.8 / 1.8 [C38] |
| Wind Walker (29) | x coins from mobs | decayMulti 1.4/800, 129 | 1.05 (L159) / n/a / 1.11 / 1.25 [C39] |
| Arcane Cultist (40) | +% total damage multiplier | decay 12/800, 129 | 0.43 (L159) / n/a / 0.98 / 2.1 [C40] |

(Values computed from the formula in M2 header, 2026-10-19; "n/a" = below the class threshold at L100.) Unreleased rows with a bonus: Infinilyte (idx 5, x3 129) and Spiritual Monk (idx 35); both have `released:false` in `classPromotions.json`. Beginner has no family bonus. [C41]

**M3. Where Toolbox applies each value** (so ActiveOn can reuse the number, ADR 0005): Elemental Sorcerer -> `character.ts#L521-L523` (talent added levels); Royal Guardian -> drop rate `character.ts#L2559`; Maestro -> printer sample `character.ts#L3025-L3036` with `Math.min(5, ...)`; Beast Master -> all-skill AFK `character.ts#L3239`; Voidwalker -> fighting AFK `character.ts#L3366`; Blood Berserker `damage.ts#L331`; Arcane Cultist `damage.ts#L530-L533` (FamBonusQTYs[80]); Squire total HP `damage.ts#L1093`; Barbarian weapon power `damage.ts#L1145`; Death Bringer `damage.ts#L1531`; Shaman `misc.ts#L922-L926` (feeds `getGoldenFoodMulti` together with the THE_FAMILY_GUY talent bonus); Hunter `efficiency.ts#L145`; Wizard `talents.ts#L576`; Divine Knight `world-3/refinery.ts#L124`; Siege Breaker `world-5/sailing.ts#L378`. [C42]
Not consumed anywhere in the pinned Toolbox parsers (value is computed in `familyBonuses` but no parser reads it): Journeyman, Warrior, Archer, Mage stat bonuses; Bowman EXP; Bubonic Conjuror all-stat; Wind Walker coins. (Verified by grep of `getCharacterFamilyBonus` call sites, 2026-10-19.) Open question Q1. [C43]

**M4. THE_FAMILY_GUY talent.** `decay`, x1=40, x2=100, skill index 144; present on Blood Berserker, Divine Knight, Siege Breaker, Beast Master, Elemental Sorcerer and Bubonic Conjuror. It raises family bonuses "given by this player" by `value%`. In Toolbox, when the played character is the one setting a class's bonus, that bonus is multiplied by `1 + value/100`; Divine Knight and Siege Breaker values use the best THE_FAMILY_GUY across all characters regardless of who is played. The talent's own level excludes the Elemental Sorcerer family levels. Paths: `V/data/website-data/talents.json` (per-class `THE_FAMILY_GUY`), `family.ts#L22-L42, L59-L65`, `character.ts#L515-L521`, `misc.ts#L924`. [C5] [C44]

**M5. Elemental Sorcerer added levels.** Floors to `+N` levels on all talents above level 1 for every character; fed back into `getTalentAddedLevels(..., familyEffBonus, ...)`. `character.ts#L522-L523`. [C25]

**M6. Family level.** Sum over characters of `PersonalValuesMap.StatList[4]` (class level); not capped by a slot count. Field `account.accountLevel` (`V/parsers/index.ts#L141-L144, L304`); ActiveOn: `account.accountLevel` from `Lv0_*` (`packages/account-state/src/fields.ts#L61, L126`). [C26]

**M7. Other consumers of family level.** Tome bonuses count points only when `accountLevel >= tomeLvReq` where `tomeLvReq = 40*i + 5*max(0,i-35) + 10*max(0,i-60) + 10*max(0,i-80) + 15*max(0,i-100) + 350` for the bonus's index `i` (`world-4/tome.ts#L44, L54`); family level is also entered as a Menagerie quantity (`world-7/menagerie.ts#L285`, W7, outside scope). [C27]

**M8. Character slots.** Thresholds (family level): 2nd 8, 3rd 30, 4th 70, 5th 150, 6th 300, 7th 500, 8th 750, 9th 1,100, 10th 1,500, 11th 5,000; 12th+ not available. The Toolbox dashboard alert (`newCharacters`) encodes only slots 6-11 (character count 5..10 vs total levels 300, 500, 750, 1,100, 1,500, 5,000), matching the wiki. Slot 2-5 values are wiki-only (Toolbox has no alert for them, see M16). Path: `V/utility/dashboard/account.js#L218-L246`. ActiveOn: `metapath.fact.family-slots` (authored). Slots may also be bought: see Q2. [C28] [C29]

**M9. Family obol slots (24).** Level requirements by slot index: 0:60 Circle, 1:250 Circle, 2:200 Square, 3:350 Circle, 4:100 Circle, 5:1250 Circle, 6:400 Hexagon, 7:650 Sparkle, 8:900 Hexagon, 9:1500 Circle, 10:1150 Square, 11:1200 Sparkle, 12:2500 Sparkle, 13:2000 Square, 14:2100 Circle, 15:3000 Hexagon, 16:5000 Sparkle, 17:1750 Hexagon, 18:400 Circle, 19:160 Circle, 20:875 Circle, 21:700 Square, 22:470 Circle, 23:80 Circle. Missing-obol alert: `!displayName && accountLevel >= levelReq` (`account.js#L252-L256`). Path: `V/data/website-data/shared-data.json` `obols.family`. [C30] [C45]

**M10. Class tree and swap.** Four lines: the Journeyman line (Beginner -> Journeyman -> Maestro -> Voidwalker -> ...), Rage (Warrior -> Barbarian/Squire -> Blood Berserker/Divine Knight -> Death Bringer/Royal Guardian), Calm (Archer -> Bowman/Hunter -> Siege Breaker/Wind Walker -> ...) and Savvy (Mage -> Wizard/Shaman -> Elemental Sorcerer/Bubonic Conjuror -> Arcane Cultist). Siege Breaker sits under Calm (Archer, Bowman, Siege Breaker), not Rage. **Disputed (C46):** the wiki calls the Journeyman line the "Secret" class in body text but labels its table row "Beginner"; `classPromotions.json` has `basicsTab` values Rage_Basics, Calm_Basics and Savvy_Basics only, so the path names (and "Secret") are wiki-only (tier 3, M). Data: `V/data/website-data/classPromotions.json` (`promotesTo`, `promotesFrom`, `talentTabs`, `released`). Sub Class Swap Token: swaps subclass within the same class line only (inference from the wiki wording "change sub class within your class", M), refunds Tab 3 talent points; sources: gem shop and events (Summer Cooler source no longer available). A rarer gem-shop Complete Class Redo Token re-opens the base class choice, which is otherwise permanent (wiki; Toolbox `quests.ts#L57` mentions Class Redo re-opening class-choice quests). [C34] [C46] [C49]

**M12. Placeholder and unreleased rows in `classFamilyBonuses`.** Index by the `classPromotions` index, never by row name or position. Rows 24 (named WIND_WALKER, decay 25/100 from 69), 35 (SPIRITUAL_MONK), 37 (FILLER decay) and 38/39/41 (FILLER txt) are placeholders and not the real Wind Walker row (index 29, decayMulti 1.4/800 from 129). Row 23 is MAYHEIM (decay 25/100 from 69), a named unreleased Archer-line family row that has no entry in `classPromotions.json`. Row 5 is INFINILYTE (add 1 from 129, unreleased); rows 0 and 1 are NO_FAMILY_BONUS. Path: shared-data.json `classFamilyBonuses`; `family.ts#L16-L20`. [C41] [C50]

**M13. Per-viewer bonus table.** The bonus table is not one account number. `getFamilyBonusesSeenBy` rebuilds it for the played character: THE_FAMILY_GUY multiplies a class's bonus only when the played character is the one setting it; Divine Knight and Siege Breaker use the account-best THE_FAMILY_GUY instead (`getAccountFamilyGuy`). The talent's level is read mid-walk with the stored Elemental Sorcerer bonus subtracted, which makes the Sorcerer bonus and the talent level circularly dependent (the Sorcerer bonus is whatever is stored at that point of the save-order walk). ActiveOn must therefore pick a viewer (the played or best-active character) before showing a number. Path: `family.ts#L22-L89`. In the game the bonus array (`FamBonusQTYs`) is indexed at 2 * class index (character.ts L2559 comment: Squire slot 18, Barbarian 16, Royal Guardian 32, Beast Master 50, Shaman 66, Arcane Cultist 80). A separate helper `getFamilyBonusBonus` (`family.ts#L9`) does a by-name lookup on the bonus rows and is not part of the class walk. [C4] [C44] [C51]

**M14. Unlock chain and Beginner limit.** A Beginner may only use 10 talents before choosing a main class; promotion quests gate when each family bonus can start (class levels 10 / 30 / 70 / 130 to promote, per wiki; bonus starts at 9 / 29 / 69 / 129), and the quest chain is not modelled here (tier 3, L). Source: https://idleon.wiki/wiki/Classes (edited 2026-10-13). [C52]

**M15. Family obol stats.** `obols.ts` adds an account-wide `familyBonus` on top of `personalBonus` for every obol stat, so filling a Family obol slot has a real stat effect beyond the missing-obol alert. Path: `V/parsers/obols.ts#L61-L118`. [C53]

**M16. Alert coverage gap.** The Toolbox `newCharacters` alert keys on an exact current character count of 5 to 10 plus total levels; it never covers the slot 2-5 gates (8 / 30 / 70 / 150) that the wiki lists, and it fires only for the next unopened slot. ActiveOn should derive slots 2-5 from the table in M8. [C29] [C28]

**M11. Pets and Guild bonuses** (separate systems, same account-wide spirit): see `companions-guild-family` prior research; out of this dossier. [C47]

**W5+ extensions (one line each):** more classes release over time (Infinilyte, Spiritual Monk flagged unreleased) [C41]; Family level is also a Menagerie quantity (W7) [C27]; 12th+ character slot "not yet available" [C28]; Divine Knight / Siege Breaker values feed W3 refinery and W5 sailing, the only bonuses already buffed account-wide by THE_FAMILY_GUY [C5].

### ActiveOn state today

Has: `account.accountLevel` (type `packages/account-state/src/types.ts#L241-L244`), slot gates fact, `metapath.goal.family-unlock` and "Next character" card (`packages/engine/src/metapath/family.ts`, `builds/next-character.ts`, `packages/knowledge/systems/metapath.yaml#L740-L835`). Lacks: no per-class family bonus value in Account State (Toolbox's `characters[].familyBonuses` is not adapted), no dedicated Family view, no check that an unused Family obol slot is open, no check that a class line is missing from the roster beyond next-character. [C48]

### Min-max by stage

Community (tier 4) priority sources could not be retrieved this session (web search budget was exhausted; the wiki Family page 404s). Orders below are derived from the Toolbox formulas and ActiveOn's existing roster research; treat as M confidence until community sources are added (Q3).

- **W1 early:** make characters up to the slot gates (8, 30, 70, 150); each new character's early levels are the cheapest family level (levels 1-9 give no bonus but still count for slots). Take one of each base class line to reach level 9 quickly for +stat bonuses (each is +1 at 9 and +1 per 5 levels, uncapped). [C28] [C3] (derived, M)
- **W1 mid:** get one character past 29 in a subclass: Squire (+HP, strongest early value: ~9% at L59) and Barbarian WP, Hunter all-skill efficiency (~7% at L59) and Bowman combat EXP (~9% at L59) have the largest early numbers per bonus type. [C15] [C16] [C17] [C18] (derived, M)
- **W1 late / W2:** Maestro line via Journeyman (Printer sample size, plus Voidwalker later); Wizard (+star talent points) and Shaman (golden foods). Journeyman is the only way to a Voidwalker/Maestro bonus. [C10] [C14] [C19] [C20] (derived, M)
- **W3:** Elite classes unlock at class level 69: Divine Knight (Refinery speed is the largest elite number: ~17.5% at L119), Elemental Sorcerer (+talent levels to everyone), Blood Berserker (damage), Beast Master (AFK). [C23] [C25] [C22] (derived, M)
- **W4:** Master classes at 129: Death Bringer, Royal Guardian, Wind Walker, Arcane Cultist, and Siege Breaker (an elite at 69). Their curves have x2=800, so they scale slowly for hundreds of levels; they are late-game investments. [C37]-[C40] [C36] (derived, M)
- **Roster rule (all stages):** one character per subclass line plus Journeyman; do not duplicate a subclass for family bonuses; use Sub Class Swap Token to change a duplicate's subclass inside its line. [C4] [C34] [prior: ActiveOn roster research, tier 3]

### Open questions

- Q1 Which Toolbox/game consumers exist for Journeyman/Warrior/Archer/Mage stat bonuses, Bowman EXP, Bubonic all-stat and Wind Walker coins (parsers do not apply them)? Needs N.js check.
- Q2 Are character slots 2-5 also available by gem-shop purchase, and does that alter the family-level path? Wiki Character_Creation lists only family levels.
- Q3 Community meta sources (Reddit r/idleon, IdleOn Academy, Efficiency guides) for class order were not fetched; add before finalising Min-max.
- Q4 Spiritual Monk and Infinilyte bonus values exist in data, but the classes are unreleased; re-check on the next patch.

### Claims

[C1] `classFamilyBonuses` (42 rows, name/func/x1/x2/x3) lives in `V/data/website-data/shared-data.json` line 4245, indexed by game class index (via `classPromotions`). Source: shared-data.json#L4245, tier 1, verified 2026-10-19, game 2.3.540. Confidence: H.
[C2] A family bonus is 0 below `x3`, else `growth(func, max(0, round(level - x3)), x1, x2, false)`. Source: `V/parsers/family.ts#L9-L20`, tier 1. Confidence: H.
[C3] x3 start levels are 9 (base classes), 29 (subclasses), 69 (elites), 129 (masters). Source: shared-data.json#classFamilyBonuses; wiki https://idleon.wiki/wiki/Classes (edited 2026-10-13), tier 1/3, agree. Confidence: H.
[C4] The bonus per class is the highest raw value across characters, each character contributing every class in its line at its own level. Source: `V/parsers/family.ts#L44-L70`, tier 1. Confidence: H.
[C5] Growth curves: intervalAdd = x1+floor(L/x2); decay = x1*L/(L+x2); decayMulti = 1+x1*L/(L+x2). Source: `V/utility/wiki/growth.mjs#L47-L56`, tier 1. Confidence: H.
[C6] A higher-tier character also supplies the lower-tier bonuses of its line (talentPagesMap = talentTabs). Source: `V/parsers/classDefinitions.ts#L31-L33`, `family.ts#L55`, tier 1. Confidence: H.
[C10] Journeyman: +total LUK, intervalAdd 1/5 from 9. Source: shared-data.json classFamilyBonuses[2], tier 1. Confidence: H.
[C11] Warrior: +total STR, intervalAdd 1/5 from 9. Source: classFamilyBonuses[7], tier 1; wiki /wiki/Classes tier 3. Confidence: H.
[C12] Archer: +total AGI, intervalAdd 1/5 from 9. Source: classFamilyBonuses[19], tier 1. Confidence: H.
[C13] Mage: +total WIS, intervalAdd 1/5 from 9. Source: classFamilyBonuses[31], tier 1. Confidence: H.
[C14] Maestro: +% printer sample size, decay 6/100 from 29; Toolbox applies Math.min(5, value). Source: classFamilyBonuses[3]; `character.ts#L3036`, tier 1. Confidence: H.
[C15] Barbarian: +weapon power, decay 25/100 from 29. Source: classFamilyBonuses[8], tier 1. Confidence: H.
[C16] Squire: +% total HP, decay 40/100 from 29. Source: classFamilyBonuses[9], tier 1. Confidence: H.
[C17] Bowman: +% EXP when fighting actively, decay 38/100 from 29. Source: classFamilyBonuses[20], tier 1. Confidence: H.
[C18] Hunter: +% efficiency for all skills, decay 30/100 from 29. Source: classFamilyBonuses[21]; `efficiency.ts#L145`, tier 1. Confidence: H.
[C19] Wizard: +star-tab talent points, intervalAdd 1/6 from 29. Source: classFamilyBonuses[32]; `talents.ts#L576`, tier 1. Confidence: H.
[C20] Shaman: higher golden-food bonuses, decayMulti 0.4/100 from 29. Source: classFamilyBonuses[33]; `misc.ts#L926`, tier 1. Confidence: H.
[C21] Voidwalker: +% fighting AFK gains, decay 5/250 from 69. Source: classFamilyBonuses[4]; `character.ts#L3366`, tier 1. Confidence: H.
[C22] Blood Berserker: +% total damage, decay 20/180 from 69. Source: classFamilyBonuses[10]; `damage.ts#L331`, tier 1. Confidence: H.
[C23] Divine Knight: +% Refinery speed, decay 50/150 from 69; buffed by account-best THE_FAMILY_GUY. Source: classFamilyBonuses[12]; `world-3/refinery.ts#L124`, tier 1. Confidence: H.
[C24] Beast Master: +% all-skill AFK gains, decay 5/180 from 69. Source: classFamilyBonuses[25]; `character.ts#L3239`, tier 1. Confidence: H.
[C25] Elemental Sorcerer: +levels to all talents above level 1, decay 20/350 from 69; floored and fed into talent added levels. Source: classFamilyBonuses[34]; `character.ts#L522-L523`, `family.ts#L35`, tier 1. Confidence: H.
[C26] Family level = sum of character class levels = `account.accountLevel`. Source: `V/parsers/index.ts#L304`; wiki Character_Creation, tier 1/3. Confidence: H.
[C27] Family level gates Tome bonuses (tomeLvReq formula) and feeds a Menagerie quantity. Source: `V/parsers/world-4/tome.ts#L44-L54`; `world-7/menagerie.ts#L285`, tier 1. Confidence: M.
[C28] Character slot family-level gates 8, 30, 70, 150, 300, 500, 750, 1,100, 1,500, 5,000 for slots 2-11; 12+ not yet available. Source: https://idleon.wiki/wiki/Character_Creation (edited 2026-10-07), tier 3 (H for slots 6-11, M for 2-5; 'slot 12+ not available' is unverifiable here). Confidence: M.
[C29] Toolbox `newCharacters` alert encodes 300/500/750/1,100/1,500/5,000 for slots 6-11 (character count 5..10). Source: `V/utility/dashboard/account.js#L218-L246`, tier 2; agrees with the wiki, resolving the earlier prior-research note on the 11th slot. Confidence: H.
[C30] Family obols: 24 slots with levelReq 60-5,000 (see M9). Source: shared-data.json `obols.family`, tier 1. Confidence: H.
[C31] Missing family-obol alert: no obol in slot and accountLevel >= levelReq. Source: `account.js#L252-L256`, tier 2. Confidence: H.
[C33] Roster coverage needs one character per subclass plus Journeyman; the sample W3 test account has two Squires and no Hunter. Source: prior research companions-guild-family.md (origin/research/account-wide), tier 3, 2026-10-17. Confidence: L.
[C34] Sub Class Swap Token: swaps subclass within the same class line only, refunds Tab 3 talent points; obtained from events or gem shop. Source: https://idleon.wiki/wiki/Sub_Class_Swap_Token (edited 2026-10-05), tier 3. Confidence: M.
[C35] Bubonic Conjuror: +% all stats, decay 5/180 from 69. Source: classFamilyBonuses[36], tier 1. Confidence: H.
[C36] Siege Breaker: +% faster min boat travel, decay 20/170 from 69; buffed by account-best THE_FAMILY_GUY. Source: classFamilyBonuses[22]; `world-5/sailing.ts#L378`, tier 1. Confidence: H.
[C37] Death Bringer: +% kill per kill, decay 60/800 from 129. Source: classFamilyBonuses[14]; `damage.ts#L1531`, tier 1. Confidence: H.
[C38] Royal Guardian: +% drop rate multiplier, decay 10/800 from 129. Source: classFamilyBonuses[16]; `character.ts#L2559`, tier 1. Confidence: H.
[C39] Wind Walker: coins from mobs multiplier, decayMulti 1.4/800 from 129. Source: classFamilyBonuses[29], tier 1. Confidence: H.
[C40] Arcane Cultist: +% total damage multiplier, decay 12/800 from 129. Source: classFamilyBonuses[40]; `damage.ts#L530-L533`, tier 1. Confidence: H.
[C41] Infinilyte and Spiritual Monk have family rows but `released:false`; Beginner has none; Mayheim also has an unreleased row (see M12). Source: `V/data/website-data/classPromotions.json`; `classDefinitions.ts#L16-L19`, tier 1. Confidence: H.
[C42] Parser call sites for each applied family bonus are listed in M3 (includes Squire L1093 and Barbarian L1145, omitted in the first draft). Source: grep of `getCharacterFamilyBonus` in `V/parsers`, tier 1, 2026-10-19. Confidence: H.
[C43] No Toolbox parser reads the Journeyman/Warrior/Archer/Mage stats, Bowman, Bubonic Conjuror or Wind Walker family values. Source: absence in grep of `V/parsers`, tier 1, confidence M (could be handled elsewhere in-game). Confidence: M.
[C44] THE_FAMILY_GUY: decay 40/100, skill 144, on Blood Berserker, Divine Knight, Siege Breaker, Beast Master, Elemental Sorcerer, Bubonic Conjuror. Source: `V/data/website-data/talents.json`, tier 1. Confidence: H.
[C45] Family obol shapes by slot are Circle, Square, Hexagon, Sparkle per M9. Source: shared-data.json `obols.family`, tier 1. Confidence: H.
[C46] **Disputed.** Original: classes form four paths (Rage, Calm, Savvy, Secret). Source lens: the wiki table (edited 2026-10-13) labels them Beginner (Journeyman line), Rage, Calm, Savvy; "Secret class" is body text only, and `classPromotions.json` has no path names. Game-data lens: `basicsTab` = Rage_Basics / Calm_Basics / Savvy_Basics confirmed, Journeyman line not a basicsTab. Correction: four lines, names come only from the wiki (tier 3). Source: https://idleon.wiki/wiki/Classes, `classPromotions.json`. Confidence: M.
[C47] Pets and Guild are covered in the account-wide research. Source: origin/research/account-wide:docs/research/systems/account-wide/companions-guild-family.md, tier 3. Confidence: L.
[C48] ActiveOn today: `account.accountLevel` exists; `characters[].familyBonuses` is not adapted; family unlock goal and next-character card exist. Source: `packages/account-state/src/types.ts#L241-L244`; `packages/engine/src/metapath/family.ts`; `packages/knowledge/systems/metapath.yaml#L805`, tier 1 (repo), verified 2026-10-19. Confidence: H.
[C49] Complete Class Redo Token (gem shop, rare) re-opens base class choice, which is otherwise permanent. Source: https://idleon.wiki/wiki/Classes, tier 3, verified 2026-10-19; `V/parsers/quests.ts#L57`, tier 1 (Class Redo mentioned). Confidence: M.
[C50] Rows 23 (MAYHEIM), 24 (named WIND_WALKER), 35, 37, 38, 39, 41 are placeholder/unreleased; real rows are found by `classPromotions` index. Source: shared-data.json classFamilyBonuses; `family.ts#L16-L17`, tier 1. Confidence: H.
[C51] The played-character walk (`getFamilyBonusesSeenBy`), account-best THE_FAMILY_GUY for Divine Knight and Siege Breaker, mid-walk Sorcerer subtraction, FamBonusQTYs = 2 * class index. Source: `V/parsers/family.ts#L22-L89`; `character.ts#L2559`, tier 1. Confidence: H.
[C52] Beginner is limited to 10 talents before a main class; promotion quests gate each tier. Source: https://idleon.wiki/wiki/Classes, tier 3, single source. Confidence: L.
[C53] Family obol slots add an account-wide `familyBonus` to obol stats. Source: `V/parsers/obols.ts#L61-L118`, tier 1. Confidence: H.
