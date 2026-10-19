# Dossier: Class line Warrior, Barbarian, Blood Berserker

Topic id `class-barbarian`. Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Claims are numbered [C1]..[C74]; the Claims register at the end gives each one's Source and tier. Tier key: 1 game data / Toolbox code, 2 Toolbox dashboard or idleon.wiki, 3 earlier project research or Toolbox community builds, 4 public community guides. Where sources disagree both views are given with a confidence (H/M/L). "Vendor" means `packages/toolbox-parsers/vendor/`; `data` means `vendor/data/website-data/`; `parsers` means `vendor/parsers/`. No real account data appears.

Search note: the web-search budget was exhausted before the community pass, so tier-4 sources (Reddit, Steam, Fibster sheet) could not be re-read. Community lines are the Toolbox community builds fetched directly (tier 3) and the earlier project research carried forward (flagged). Pre-patch claims are flagged "Stale".

## Warrior / Barbarian / Blood Berserker (the Rage line)

- **What it is:** The STR line. Beginner promotes to Warrior, Warrior to Barbarian (or Squire), Barbarian to Blood Berserker (BB) [C1]. Each stage adds a talent tab: Rage Basics and Warrior, then Barbarian, then Blood Berserker [C2]. Specialist skills accumulate along the line: Warrior mining, Barbarian mining and fishing (Mining inherited from Warrior), BB mining, fishing and cooking [C42][C43]. Damage identity: Gilded Sword and Sharpened Axe on tab 1, STR scaling on tab 2, kill-count talents (Apocalypse Zow, Monster Decimator) on tab 3, cooking and family talents on tab 4 [C25][C41][C46][C47][C60].
- **Unlocks:**
  - Warrior: Promotheus quest 1 needs class level 10; quest 2 "Select a New Class" selects the class and REWARDS the player 2 Talent Point Reset Potions (plus Basketball, 10 XP); quest 1 (reach level 10) rewards 500 coins and 5 Bottled Town Teleport. **Disputed (resolved):** the earlier draft's "pays" read as a cost; `quests.json` lists these under rewards [C4].
  - Barbarian: Speccius quest 1 (100 Kebab Sticks, 50 Crabby Cakey; rewards 2 x 2-hour Time Candy, 1 Reset Potion, 5 Reset Fragments), then "Select a Sub Class", which REWARDS 10,000 coins (a reward, not a cost; ConsumeItems is false on Speccius1) [C5]. Neither the quest data nor the wiki states a level gate (open question Q1) [C5].
  - Blood Berserker: Eliteus, W4 map 154. Quest 1 kill 10 Greenie Gang (rewards 750,000,000 coins), quest 2 select the elite (rewards 150,964,823 coins); both amounts are rewards, not costs. A Barbarian has exactly one elite, so no choice (Barbarian promotesTo only Blood_Berserker) [C6][C1].
  - Death Bringer (W5+): promotes from BB [C1] (see W5+ extensions).
- **Scope:** per character for tabs, presets, points and kill counts. Account-wide for family bonuses (best character in each class line) [C22]. `THE_FAMILY_GUY`, `Overflowing Ladle`, `Apocalypse Chow` and `Taste Test` read across all BBs on the account [C58][C60].
- **Inputs to outputs:** class levels + skill levels + currency items + bubbles/stamps/vials/achievements make talent points per tab [C10][C11]. Points make talent levels (base 1..100, plus added levels) [C16][C19]. Talent levels make damage, kill-per-kill, AFK gains, skill efficiency and EXP [C25]-[C60]. Kill counts on every map feed Zow/Chow/Wow counts [C38].
- **Goals and Milestones:**

| Goal | Threshold | Why | Claim |
|---|---|---|---|
| Warrior | class lv 10 | tab 2 | [C4] |
| Presets usable | class lv 15 | second preset | [C55] |
| Subclass taken | Speccius quests | tab 3, points backdated 3 x (Lv-29) | [C5][C10] |
| Idle Brawling 50 | 50 pts | 10% of its 20% cap, build core | [C26][C63] |
| Apocalypse Zow breakpoints | Lv 33/66/99/132 | +1% per monster type per step | [C37] |
| Zow count | maps at 100k kills | each map adds Zow x dmg | [C38] |
| Chow count | maps at 1M kills (and 100M for Voidwalker) | cooking EXP/eff | [C38][C59] |
| Fist of Rage cap | 100 + Str Summore + Overblown | STR | [C15][C40][C51] |
| No Pain No Gain | from W4 on (build advice) | enough base HP | [C35][C63] |
| Elite taken | 10 Gang kills | tab 4, family bonus from lv 70 | [C6][C20] |

- **Feeds / fed by:** Fishing (Worming Undercover, Bobbin' Bobbers, All Fish Diet, Catching Some Zzz's) [C41]; Mining (Warrior tab) [C31]; Cooking (BB: Taste Test, Apocalypse Chow, Waiting To Cool, Overflowing Ladle, Tough Steaks) [C48][C49]; Portals and Death Note kill counts (Monster Decimator, Charred Skulls) [C36][C45]; Statues (Strongest Statues) [C39]; Obols (Fistful of Obol) [C39]; Golden Food (Haungry For Gold) [C31]; Alchemy bubbles (Warrior cauldron class bubbles, `TalWarrior`, Warriors Rule) [C13][C57]. Fed by Time Candy/Reset items (Speccius), kills (Zow/Chow), Cooking level (Tough Steaks), STR (Charred Skulls, Skill Strengthen).
- **Per-session actions:** Spend new points on both presets. (Specialist skills on the line: Warrior Mining; Barbarian Mining + Fishing; BB adds Cooking.) Keep Apocalypse Zow's level matched to its next breakpoint and to the current Zow count. Check the attack bar holds Power Strike, Whirl, Bear Swipe, Axe Hurl for a fighting preset. Check accuracy is at 100% hit on the AFK target but no higher. Idle state: unspent points, a preset left at zeros, an un-promoted subclass.
- **AFK Setup implications:** Fighting preset for any fighting AFK target, skilling preset for fishing (Barbarian), mining (Warrior) or cooking (BB). Fishing is the Barbarian's own AFK job; cooking is BB's [C42][C43][C63].
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:** (1) Points in WIS past 100% hit [C9]. (2) Taking No Pain No Gain before W4 HP can absorb double damage [C35][C63]. (3) Putting Apocalypse Zow points between breakpoints (it is `intervalAdd`; only 33/66/99/132 add [C37]). (4) Spending on Beefy Bottles / Str Summore before the bubble or STR can use the raised cap [C16][C40]. (5) Two Squires and no Barbarian on a roster that wants a fishing/Zow character (fix with one Sub Class Swap Token) [C7]. (6) Second preset never set up [C55].
- **Save and Toolbox fields:** see the mechanics catalogue.
- **Sources:** the register at the end.

## Mechanics catalogue (W1 to W4, with W5+ one-liners)

Notation: `char` is a parsed `characters[i]`. `flatTalents` is the list of all tab talents with `level` (base + added), `baseLevel`, `maxLevel`, `talentId`, `skillIndex`, `funcX/x1/x2`, `funcY/y1/y2`. Talent ids are `skillIndex` in `talents.json`. Growth functions: `decay` x1*L/(L+x2); `add` x1*L (x2=0) or quadratic; `bigBase` x1+x2*L; `intervalAdd` x1+floor(L/x2) [C17].

### Class and tab structure

#### M1. Class chain and tabs
- **Rule:** Warrior (index 7) from Beginner; Barbarian (8) and Squire (9) from Warrior; Blood Berserker (10) from Barbarian; Death Bringer (14) from BB [C1]. Tab lists: Barbarian = Rage_Basics, Warrior, Barbarian; BB adds Blood_Berserker; DB adds Death_Bringer [C2]. `checkCharClass(c, X)` is true when X is in c's tab list, so a BB counts as a Barbarian, and a Death Bringer counts as Barbarian and BB [C3].
- **Fields:** `characters[].class`, `.classIndex`; `talentPagesMap` (classDefinitions.ts L29-L31); `data/classPromotions.json` [C1][C2][C3].

#### M2. Promotion quests
- **Rule/cost:** Warrior at lv 10 [C4]. Barbarian via Speccius [C5]. BB via Eliteus [C6]. Class change afterwards: Sub Class Swap Token (gem shop, a limited stock each major update) swaps Barbarian and Squire; base class change needs the rare Complete Class Redo Token [C7].
- **Fields:** quest names `Promotheus1/2`, `Speccius1/2`, `Eliteus1/2`; `account.quests` / `QuestComplete_N` [C4][C5][C6].

#### M3. Main stat and accuracy
- **Rule:** the whole line has STR as main stat; accuracy comes from WIS (mapping strength to wisdom) [C8]. Monster hit chance = floor(min(100*(0.95r - 0.425), 100)) with r = accuracy/Defence; zero below r 0.5; 100% at r 1.5; resources use a gentler curve gated at r 0.25 and reaching 100% at r about 1.98 [C9].
- **Fields:** `char.stats.strength/wisdom`, `getAccuracy` (damage.ts L981-L995), `utility/hit-chance.mjs` [C8][C9].

#### M4. Talent points per tab
- **Formula (game TotalTalentPoints):** tab 1 = 3*(Lv-1) + (sum of nine skill levels - 3) + extras; tab 2 = 3*(Lv-6) + sum floor(skill/2) + extras; tab 3 = 3*(Lv-29) + sum floor(skill/2) + extras; tab 4 = 3*min(Lv-89,100) + max(0, 2*(Lv-189)) + sum floor(skill/5) + extras [C10][C11].
- **Extras that matter for this line:** Warrior class bubble `BUFF_BOI_TALENT` (`TalWarrior`, bigBase 5 + L, +talent points on each tab for Warrior-line characters, not Master class) [C13]; `BACK_TO_BASICS` (id 119) gives tab 2 extra points (+1 per level) [C14]; stamps Talent I-IV, vials Tab1-4Pts, achievements, Flurbo shop, shiny pet bonuses, Upgrade Vault [C10].
- **Wiki disagreement:** wiki says tab 4 counts "class levels above 50"; code and game port say 89. Code wins (confidence H) [C12].
- **Fields:** `account.talentPoints`, `char.level`, `char.skillsInfoArray`; port in `packages/account-state/src/talent-points-formula.ts` [C10].

#### M5. Max levels and added levels
- **Rule:** base cap is 100 per talent (`SM_<i>` save key -> `SkillLevelsMAX`); `createTalentPage` reads it as `maxLevel` (-1 when absent) [C15]. Raisers on this line: Str Summore (id 81, +1 max Lv of Fist of Rage per level), Overblown Testosterone (id 143, y = +L max Lv of Fist of Rage), Beefy Bottles (id 114, bubble-capped raise of CritiKill) [C16][C40][C51]. Talent Book Library books exist for talents under id 615 except the indices 10, 11, 12, 23, 75, 79, 86, 87, 266, 267, 446, 447 (so Fist of Rage, Book of the Wise, Meat Shank (86) and CritiKill (87) get no books) [C18].
- **Added levels** (to talents with base level >= 1 only; `applyTalentAddedLevels` also skips talents in `isTalentBannedForAllLevels` and applies a Royal Guardian (ids 225-239) added-level cap [C69]): god bonus (Arctis, ceil), Symbols of Beyond (talent 149, BB tab 4, the source of the symbol added levels: 1 + floor(L/20)) [C70], family (floor), achievement 291 (+1), companion 1, ninja mastery tier 3 (+5), Equinox symbols, Grimoire 39, Kattlekruk set, Tesseract (cap 5), Superbit Timmy Talented (floor((Lv-500)/100)), and +super-talent levels on up to chosen talents [C19].
- **Fields:** `char.addedLevels`, `.addedLevelsBreakdown`, `.talents[i].orderedTalents`, `.flatTalents`, `.maxBookLv` [C15][C19].

#### M6. Presets, bar and cooldowns
- **Rule:** two talent presets per character; levels come from `SL_<i>` (active) and `SLpre_<i>` (other), selected preset from `PlayerStuff_<i>[1]`, bar from `AttackLoadout_<i>` [C55]. Casts store ceil(cooldown / (1 + (WOAH_THAT_WAS_FAST + Magician_Starterpack post-office bonus)/100)) [C56].
- **Attack stats (talents.json):** Power Strike cd 3 mana 3 cast 0.45; Whirl cd 5 mana 5; Firmly Grasp It cd 30 mana 5; Bear Swipe cd 8 mana 20 cast 0.8; Axe Hurl cd 17 mana 15; Mocking Shout cd 600 mana 15; No Pain No Gain cd 30 mana 20; Worming Undercover cd 15 mana 15; BB: Fired Up cd 60 mana 15; Combustion cd 20 mana 20; Serrated Swipe cd 15 mana 25; Taste Test cd 200000 (once) [C29][C32]-[C35][C41][C44].
- **Fields:** `char.talentsLoadout`, `.selectedTalentPreset`, `.talentPreset`, `.talentPreset.flatTalents`, `.activeBuffs` [C55][C56].

#### M7. Family bonuses of the line
- **Formula:** `growth(func, max(0, round(level - x3)), x1, x2)`, 0 below x3 (the class level) [C20]. Rows (game class index in `classFamilyBonuses`): Warrior (7) +Total STR, intervalAdd x1 1, x2 5, from lv 9 (5 at lv 30, 19 at 100, 59 at 300). Barbarian (8) +Weapon Power, decay 25/100 from lv 29 (4.3 at 50, 10.4 at 100, 15.8 at 200, 20.6 at 500). Blood Berserker (10) +% Total Damage, decay 20/180 from lv 69 (2.9 at 100, 8.4 at 200, 14.1 at 500). Death Bringer (14) +% Kill per Kill, decay 60/800 from lv 129 (7.9 at 250, 19.0 at 500) [C20].
- **Walk:** every character in save order, every class in its line, keep the largest per class; `THE_FAMILY_GUY` multiplies only for the played character, and DK/SB use the account best [C21].
- **Consumers:** Barbarian weapon power damage.ts L1145; BB total damage L331; DB kill-per-kill L1531; Warrior STR not traced in the Toolbox parsers (stat code reads the save) [C20].
- **Fields:** `char.familyBonuses` keyed by class name, `getCharacterFamilyBonus(char, className)`, `classFamilyBonuses` in `shared-data.json` [C20][C21].

### Rage Basics tab (shared by Warrior, Barbarian, BB). Values at L25 / L50 / L100 (computed from x1,x2) [C17]

#### M8. Damage and defence
- **Gilded Sword (id 6):** `add` 1.5 per level, % damage to all monsters; 37.5 / 75 / 150. damage.ts L363 [C23].
- **Sharpened Axe (id 5):** `add` 0.4 base Weapon Power per level; 10 / 20 / 40. damage.ts L896 [C24].
- **Meat Shank (id 86):** `decay` 100/80, % damage per power of 10 of max HP; 23.8 / 38.5 / 55.6. damage.ts L826. Max-level raise: the wiki Warrior page credits the Blocky Bottles bubble with raising Meat Shank's max level (tier 2, M), while the talent text for Beefy Bottles names CritiKill/Warriors Rule and earlier research named Meat Shank; unresolved (see Q6) [C25][C72].
- **CritiKill (id 87):** `decay` 52/50, % crit damage; 17.3 / 26 / 34.7. damage.ts L1179. Raised by Beefy Bottles [C25][C16].
- **Bucklered Up (id 9):** `decay` 40/60, % total DEF; 11.8 / 18.2 / 25. damage.ts L1387 [C27].
- **Health Booster (id 0):** `add` 1, 0.15 (quadratic) flat HP, damage.ts L1085. Mana Booster (id 1) 1/0.1 MP. Star Player (id 8): +1 star tab talent point per level (x1 1) [C27].
- **Stat talents:** Fist of Rage (id 10, STR), Quickness Boots (11, AGI), Book of the Wise (12, WIS), Lucky Clover (13, LUK): `add` x1 = 1, +1 base stat per level (data: `add 1 0`). They get no Talent Book (ids 10-13 are in `BOOK_INELIGIBLE_INDICES`, 10/11/12 listed), so they are a late max-level point sink: only Fist of Rage's cap is raisable (Str Summore, Overblown Testosterone). WIS is the accuracy lever for this line [C8][C28][C71].

#### M9. AFK and efficiency
- **Idle Brawling (id 88):** `decay` 20/50, % Fighting AFK gain rate; 6.7 / 10 / 13.3. character.ts L3368 [C26].
- **Idle Skilling (id 89):** `decay` 20/40, % AFK gain for specialised skills; 7.7 / 11.1 / 14.3. character.ts L3357 [C26].
- **Brute Efficiency (id 85):** `add` 1 + 0.02 (quadratic) % efficiency of specialised skills; 31.5 / 75.5 / 201. efficiency.ts L274, L472; cooking.ts L169 [C26].

### Warrior tab

#### M10. Attacks
- **Power Strike (id 90):** damage 130 + 3L %, up to 2 monsters, cd 3, mana 3; 205 / 280 / 430 [C29].
- **Whirl (id 91):** damage 60 + 1.5L %, mobs hit 5 + floor(L/40), cd 5, mana 5; 97.5 / 135 / 210 [C29].
- **Firmly Grasp It (id 94):** temporary base STR 15 + L for 2 + floor(L/4) minutes, cd 30, mana 5; 40 / 65 / 115 STR, 8 / 14 / 27 min [C30].

#### M11. Passives
- **Double Strike (id 93):** `decay` 110/50 % chance a basic attack hits twice; 36.7 / 55 / 73.3. damage.ts L1302 [C30].
- **Health Overdrive (id 92):** `add` 0.5/0.02 % max HP; 19 / 50.5 / 151. damage.ts L1087 [C30].
- **Strength in Numbers (id 95):** `add` 0.75 per level, % to STR's effect on damage and HP; 18.8 / 37.5 / 75. damage.ts L100, L1086 [C30].
- **'STR'ess Tested Garb (id 96):** `add` 1.5 per level, % more STR from all equipment [C30].
- **Carry A Big Stick (id 97):** `add` 1 per level, % to Weapon Power's effect on damage. damage.ts L892 [C30].
- **Absolute Unit (id 98):** +1 base STR per level [C30].

#### M12. Mining and skill kit
- **Big Pick (id 100):** mining efficiency 150 + 15L %, cd 12, mana 10, AFK type buff (activity 1 = mining) [C31].
- **Copper Collector (101)** `decay` 20/70 per power of 10 Copper in storage; **Motherlode Miner (102)** `decay` 20/50 multi-ore chance; **Tool Proficiency (103)** `decay` 16/40 pickaxe power per 10 Mining levels (efficiency.ts L~250) [C31].
- **Haungry For Gold (id 99):** `decay` 55/80 % higher golden food bonuses. misc.ts L929 [C31].
- **Tempestuous Emotions (id 104):** `add` 1 per level % EXP for all specialised skills. character.ts L604, L750, L1019 [C31].

### Barbarian tab

#### M13. Attacks and buff
- **Bear Swipe (id 105):** damage 160 + L %, cd 8, mana 20, cast 0.8; the description says 5 monsters while the data also carries an unexplained x term 3 + floor(L/30) [C32] (Q4).
- **Axe Hurl (id 106):** damage 150 + L %, mobs hit 2 + floor(L/50), cd 17, mana 15 [C33].
- **Mocking Shout (id 107):** monsters pulled and healed L % HP every 0.5 s for 20 + 0.2L seconds, cd 600, mana 15 [C34].
- **No Pain No Gain (id 108):** buff, cd 30, mana 20. Reduces max HP by `decay` 100/30 % and raises damage by `decay` 100/50 %; you take double damage. Toolbox applies the x value (the HP figure) to both HP (damage.ts L1113) and damage (L423, L559), and doubles monster damage (L1353). The talent text assigns y to damage, so Toolbox may understate the damage side (Q3) [C35].

#### M14. Kill-count talents
- **Monster Decimator (id 109):** `decay` 100/50 % chance a kill counts double for portals and kill count; 33.3 / 50 / 66.7. Toolbox adds it as an additive term inside Kill per Kill (damage.ts L1549-L1562) [C36].
- **Apocalypse Zow (id 110):** x = 2 + floor(L/33) % damage per counted monster type; y = L types counted. Toolbox: x * (`char.zow.finished[0]` + 1) added to damage (damage.ts L699-L702), with no cap at y and an unexplained +1 (Q2) [C37]. Breakpoints: L33/66/99/132 raise x by 1 [C37][C62].
- **How `zow` is counted:** `getBarbarianZowChow(kills, [1e5])`; `kills[i] = |KLA_i[0] - mapDetails[i][0][0]|` for each map; counts maps whose monster AFK type is FIGHTING, excluding Copper/Iron/Starfire/Plat/Void/Filler/JungleZ and the boss/arena maps listed in the code and any Colosseum. `chow` thresholds [1e6, 1e8], `wow` [1e9] [C38].

#### M15. Support talents
- **Fistful of Obol (id 111):** `decay` 60/50 % more STR from Obols; 20 / 30 / 40. Toolbox does not read this talent by name (STR comes from the save) [C39].
- **Strongest Statues (id 112):** `decay` 100/50 % higher bonuses for the Power, Mining and Oceanman statues; 33.3 / 50 / 66.7. statues.ts L145-L148 [C39].
- **Str Summore (id 81):** +1 max Lv of Fist of Rage per level [C40].
- **Beefy Bottles (id 114):** raises CritiKill's max level by up to the level of the Warrior class bubble (talent text names "Warriors Rule"; earlier research said the Warrior cauldron bubble and CritiKill/Meat Shank) [C16].
- **Back To Basics (id 119):** extra tab-2 points (+1 per level) [C14].

#### M16. Fishing kit
- **Worming Undercover (id 115):** 9.3 + 0.7L % chance to instantly catch, cd 15, mana 15, AFK activity 4; 26.8 / 44.3 / 79.3 [C41].
- **Bobbin' Bobbers (id 116):** minigame reward 12 + 3L %; fishing power per highscore point capped at y = 5 + floor(L/3); efficiency.ts L443 uses min(highscore, y) [C41].
- **All Fish Diet (id 117):** `add` 1.5 per level % Fishing EXP; 37.5 / 75 / 150. character.ts L749 [C41].
- **Catching Some Zzz's (id 118):** `decay` 20/60 % fishing AFK gain; 5.9 / 9.1 / 12.5. character.ts L3359 [C41].
- **Class bubble multiplier:** Fishing power lines take `classBubbleMultiplier: mainStat === 'strength'`, so Warrior-cauldron bubbles use the Warriors Rule multiplier on this line [C57].

### Blood Berserker tab (W4)

#### M17. Attacks
- **Fired Up (id 135):** inflame for 7 + floor(L/15) s; basic attacks refresh it; cd 60, mana 15 [C44].
- **Combustion (id 136):** 300 + 1.5L %, mobs 13 + floor(L/20), cd 20, mana 20; needs inflamed [C44].
- **Serrated Swipe (id 137):** 40 + 0.4L %, mobs 2 + floor(L/50), cd 15, mana 25 [C44].
- **Ember Bear (138):** `decay` 250/100 claw multihit chance; max mobs hit 12. **Ferocity Strike (139):** `decay` 100/80 % chance to hit again [C44].

#### M18. Damage and kill talents
- **Tough Steaks (140):** `decay` 10/100 Weapon Power per 10 Cooking levels of this character. damage.ts L1148 [C45].
- **Charred Skulls (141):** `decay` 40/100 % Kill per Kill per 1000 STR. damage.ts L1540; switched off for World 7+ (`diminished`) [C45].
- **Overblown Testosterone (143):** `decay` 15/100 % STR; y adds +L max Lv to Fist of Rage [C51].
- **Skill Strengthen (142):** `decay` 60/80 % larger STR impact on skill efficiency; y = 1 + floor(L/2) STR. efficiency.ts L268, L449; cooking.ts L156 [C46].

#### M19. Cooking and family talents
- **Taste Test (145):** `decay` 100/100; finishes all recipes, kitchens keep that % of the fire; `cooldown` field is 200000 (s), i.e. effectively once per long period; in `relevantTalents` [C47][C73].
- **Apocalypse Chow (146):** `decay` 20/100 % Cooking EXP and efficiency per map at 1M kills; y = L maps counted; character.ts L1015, cooking.ts L149/L168 (default multiplier 1 when no map reaches 1M kills; the second threshold 1e8, Super Chow, feeds Voidwalker talent 146) [C48].
- **Waiting To Cool (147):** `decay` 20/60 % Cooking AFK rate. character.ts L3408 [C48].
- **Overflowing Ladle (148):** `decay` 100/80 % more AFK time from Ladles; the highest across all BBs is used (cooking.ts L1074-L1087) [C48].
- **The Family Guy (144):** `decay` 40/100 % larger family bonuses from this character; also read in misc.ts L924 [C22][C75].
- **Symbols of Beyond (149):** +1 + floor(L/20) levels to all talents above Lv 1 (added levels) [C19].
- **Voidwalker link:** Voidwalker talent 146 enhancement (at 125 points invested in Enhancement Eclipse) reads `getLastBloodBerserkerLine(...).chow.finished[1]` as 1.1^N where N is the count of maps at 100M kills [C59].
- **BB family bonus** is the Total Damage figure in M7 [C20].

### W5+ extensions (one line each)
- **Death Bringer (idx 14, tab 5, ids 195-209), growth per `talents.json` [C66][C74]:**
  - Wraith Form (195) decay 250/250, cd 5: enter/exit to collect Bones, + % Wraith DMG. Grimoire (196) decay 150/300, cd 3: opens the Grimoire, passive + % Bones found.
  - Sentinel Axes (197) bigBase 30 + 0.4L % bigger axes, hits 1 + floor(L/50) more mobs. Graveyard Shift (198) decay 3/200 Bones boost, y decay 600/120 faster mob respawn (x2 310).
  - Detonation (199) decay 200/300 % chance of a combustion explosion on horde kill, y decay 200/200 larger range. Marauder Style (200) and Bulwark Style (201) decay 50/250 per 100 Grimoire upgrades (Wraith DMG+Accuracy / Defence+HP).
  - Famine O' Fish (202) decay 4/200 crit chance and y 14/170 crit damage per POW 10 Fishing Efficiency. Built Different (203) add 5/level base STR.
  - Farming: Ribbon Winning (204) decay 300/300 extra ribbon chance, Mass Irrigation (205) decayMulti 50/300 Crop Evo chance, Agricultural 'Preciation (206) add 2/level Farming and Land Rank EXP, Dank Ranks (207) decayMulti 2/200 Land Rank DB bonus multiplier.
  - Wraith Overlord (208) decay 2/200 % damage multi for all characters per POW 10 bones ever collected (damage.ts L305). Apocalypse Wow (209) decay 2/200 % Gold Food effect per monster killed 1e9 times, account-wide [C66][C67].
- **Death Bringer family bonus:** +% Kill per Kill from lv 129 [C20].
- **Zow-counted kills in W5+:** the same `getBarbarianZowChow` runs on every FIGHTING map; Charred Skulls is zeroed from W7 [C45][C38].
- **Added levels rise** with W5-W7 sources (Equinox, Grimoire, Tesseract, Superbit) [C19].

## Min-max by stage

Ordering below follows the Toolbox community build "Barbarian/Fishing" (Sir_Grimtide), the most-liked current Barbarian build, with talent ids resolved against `talents.json` [C61][C62]. Older "Community Guide" builds are v1.23/1.40b and Stale [C65]. Where the build and the game data disagree, data wins (ADR 0004); both are noted.

### W1 early (Beginner to Warrior, Lv 1-30)
1. Beginner (Lv 1-9): put points into Gilded Sword and Sharpened Axe; Sleepin' On The Job for AFK (community build, 2026-05-14, M) [C64].
2. Take Warrior at Lv 10 (Promotheus) [C4]. At Lv 15 set up preset 2 [C55].
3. Fighting preset, Warrior (Stale v1.23 builds, but they match the 2026 core): Sharpened Axe 50, Gilded Sword 40, Meat Shank 20; Power Strike 20, Whirl 20, Double Strike 10, Firmly Grasp It 1, Carry A Big Stick 50 for AFK; for active play 1 each in attacks and Carry A Big Stick 100 [C65].
4. Skilling preset (mining): Brute Efficiency 80, Idle Skilling 50, Big Pick 50 on the attack bar, Copper Collector 15, Motherlode Miner 15, Firmly Grasp It 1 [C65].
5. Do not spend on stat talents unless accuracy is short [C28].

### W1 mid to late (Lv 30-60, before the subclass)
1. Tab 1 order: Gilded Sword, Sharpened Axe, Idle Brawling to 50, Meat Shank, Health Booster, Fist of Rage; Book of the Wise only until 100% hit on the AFK target [C63].
2. Tab 2: 25 Power Strike = 25 Whirl, Double Strike 45, Firmly Grasp It 1, then Carry A Big Stick, Strength in Numbers, Health Overdrive, 'STR'ess Tested Garb = Absolute Unit [C63].
3. Bubbles: raise the Warrior-cauldron `BUFF_BOI_TALENT` (+points on every tab) and the STR class bubbles (Farquad Force, Power Trione) [C13][C57].

### W2 (subclass, Barbarian)
1. Choose Barbarian over Squire when the roster has no fisher/Zow character; the wiki frames it as pure damage with risky No Pain No Gain, Squire as defence and multi-hit [C7]. One Sub Class Swap Token fixes a wrong pick (it wipes both presets, so plan both) [C7].
2. Tab 3 (damage preset): 25 Bear Swipe = 25 Axe Hurl; delay No Pain No Gain until W4; Str Summore; Apocalypse Zow to its next breakpoint only; Back To Basics; Monster Decimator; Fistful of Obol = Strongest Statues [C63].
3. Fishing preset: tab 1 Brute Efficiency then Idle Skilling then Fist of Rage (Star Player optional); tab 2 Absolute Unit, Firmly Grasp It, 'STR'ess Tested Garb, Haungry For Gold, Tempestuous Emotions; tab 3 Worming Undercover, Bobbin' Bobbers, All Fish Diet, Catching Some Zzz's, Str Summore, Strongest Statues; Fistful of Obol, or Back To Basics when tab 2 needs points [C63].
4. Alternative mining + fishing preset (Ibn_Yafith, updated 2026-10-15): Brute Efficiency 100, Idle Skilling 100, Fist of Rage / Lucky Clover priority, Big Pick / Copper Collector / Motherlode Miner / Tool Proficiency 50, Worming Undercover 50, All Fish Diet 100, Catching Some Zzz's 50 [C64].
5. Star talents (ids 616-640; orders from the cited build, M, not independently resolved against `talents.json` names this pass): damage preset 620 then 616 (capped at 10% of max), 621 = 624 = 627; tab 2: 638 then 631 then 634, 1 point each in 635 and 639 [C61].

### Squire line contrast
The Squire (index 9) branches from Warrior beside the Barbarian. Wiki framing: Squire is defence and multi-hit, Barbarian pure damage with the risky No Pain No Gain. Family bonuses count from lv 9/29/69 per the wiki, and `THE_FAMILY_GUY` boosts Barbarian/Squire family bonuses for the played character. The Squire/Royal Guardian talent detail belongs to its own dossier; this one does not itemise it (confidence M, tier 2) [C7][C22].

### W3
1. Talent Book Library (W3 Construction) raises max level past 100 for eligible talents [C18]. Fist of Rage, Book of the Wise and Meat Shank/CritiKill are not eligible [C18].
2. Apocalypse Zow: set level to the next breakpoint of 33/66/99/132 that matches the number of 100k-kill maps (`characters[].zow`) [C37][C62].
3. Fishing: Bobbin' Bobbers pays only up to min(highscore, y) so the cap and the minigame highscore both matter [C41].
4. Beefy Bottles only after the Warrior class bubble is above 100 [C16].

### W4 (Blood Berserker)
1. Take BB at Eliteus (map 154) [C6]. Tab 4 skilling preset (Sir_Grimtide): Symbols of Beyond (149) first, then Overblown Testosterone (143), then Skill Strengthen (142); optional cooking talents ("mostly Cooking skills") [C61].
2. Now take No Pain No Gain on the damage preset (base HP must survive double damage) [C35][C63].
3. Cooking AFK: Waiting To Cool, Taste Test, Apocalypse Chow (its x scales with maps at 1M kills), Overflowing Ladle, with Tough Steaks and Charred Skulls for damage [C45]-[C48]. The community lists three BB builds from BigRav01 (AFK W4, Skilling W4) and "The Build Thus Far" (2026-08-10), but their talent orders could not be read this pass (Q5) [C68].
4. The Family Guy grows the BB/Barbarian/Squire family bonuses for the played character; useful once the family bonuses are large [C22].
5. Keep one character on the BB line; extras only add through the account-best walks (Overflowing Ladle, Family bonus) [C21][C48].

### W5+ outline
Death Bringer branches off BB, with the Wraith/Grimoire kit and the 1e9-kill Apocalypse Wow [C66]. Planning data is in the dossier of the W5+ topics.

## Open questions
- Q1. The level requirement for the Speccius subclass quest is not in `quests.json` or the wiki; the earlier research says "W2". Confidence L. [C5]
- Q2. `damage.ts` uses `zow.finished[0] + 1` and does not cap at Apocalypse Zow's y (types counted = level). Is the +1 a Toolbox correction for a game term, or a bug? [C37]
- Q3. No Pain No Gain: Toolbox uses the x-variant for both HP and damage while the text maps y to damage. [C35]
- Q4. Bear Swipe's x term (3 + floor(L/30)) has no clear in-text use. [C32]
- Q5. Talent orders for the BigRav01 BB builds and the whichyadidya BB build were not retrieved (the API summariser returned none). [C68]
- Q6. Beefy Bottles' bubble: talent text says Warriors Rule and CritiKill; earlier research said the Warrior cauldron bubble level and CritiKill/Meat Shank. [C16]
- Q7. Fistful of Obol's effect is not read by name in the parsers. Does the STR stat from the save already include it? [C39]

- Q8. Which bubble raises Meat Shank's max level: Blocky Bottles (wiki Warrior page) or Warriors Rule/Beefy Bottles (talent text)? Not read in the parsers. Confidence L. [C16][C72]
- Q9. Star talents 616-640: names and growth were not itemised this pass. [C61]

## Claims register

| Id | Claim | Source | Tier | Verified / claim date | Conf |
|---|---|---|---|---|---|
| C1 | Warrior (7) from Beginner; Barbarian (8), Squire (9) from Warrior; Blood Berserker (10) from Barbarian; Death Bringer (14) from BB; each Barbarian has one promotion | `vendor/data/website-data/classPromotions.json` | 1 | 2026-10-19, game 2.3.540 | H |
| C2 | Tab lists: Barbarian = Rage_Basics, Warrior, Barbarian; BB adds Blood_Berserker; DB adds Death_Bringer | `classPromotions.json`; `vendor/parsers/classDefinitions.ts#L29-L31` | 1 | 2026-10-19 | H |
| C3 | `checkCharClass` is membership in the tab list, so DB counts as Barbarian and BB | `vendor/parsers/talents.ts` (`checkCharClass`, near L525) | 1 | 2026-10-19 | H |
| C4 | Promotheus1 needs level 10; Promotheus1 (level 10) rewards 500 coins + 5 Bottled Town Teleport; Promotheus2 selects a class and REWARDS 2 Talent Point Reset Potions, Basketball, 10 XP (**Disputed** by gamedata lens on wording; corrected) | `vendor/data/website-data/quests.json` (Promotheus) | 1 | 2026-10-19 | H |
| C5 | Speccius1: 100 Kebab Sticks + 50 Crabby Cakey -> 2 x 2HR Time Candy, 1 Reset Potion, 5 Reset Fragments; Speccius2 select sub class, 10,000 coins reward; no level gate stated | `quests.json` (Speccius); https://idleon.wiki/wiki/Speccius (edited 2026-09-27) | 1 / 2 | 2026-10-19 | M |
| C6 | Eliteus1: 10 Greenie Gang kills, 750,000,000 coins; Eliteus2 select elite, 150,964,823 coins (both coin amounts are rewards); one elite per subclass | `quests.json` (Eliteus); `classPromotions.json` | 1 | 2026-10-19 | H |
| C7 | Barbarian = pure damage incl. risky No Pain No Gain, Squire = defence and multi-hit; Sub Class Swap Tokens in Gem Shop each major update, Complete Class Redo Token rare; family bonuses count from lv 9/29/69. Earlier research: token 500 gems, wipes both presets | https://idleon.wiki/wiki/Classes (edited 2026-10-13); earlier research `origin/research/character-builds:docs/research/systems/2026-10-17-character-builds.md` | 2 / 3 | 2026-10-19; research 2026-10-17 | M |
| C8 | Main stat STR for Warrior, Barbarian, BB, DB; accuracy stat for strength is wisdom | `vendor/parsers/talents.ts#L88-L97`; `vendor/parsers/damage.ts#L981-L995` | 1 | 2026-10-19 | H |
| C9 | Monster hit chance floor(min(100(0.95r-0.425),100)), gate r 0.5, 100% at 1.5; resource curve gate 0.25, 100% at 1.98 | `vendor/utility/hit-chance.mjs` | 1 | 2026-10-19 | H |
| C10 | Talent points: tab1 3(Lv-1), tab2 3(Lv-6), tab3 3(Lv-29), tab4 3 min(Lv-89,100)+max(0,2(Lv-189)); extras from stamps, vials, achievements, Flurbo, shiny, vault | `packages/account-state/src/talent-points-formula.ts` (ports game `_customBlock_TotalTalentPoints`, N.js, 2.3.540) | 1 | 2026-10-19 | H |
| C11 | Skill terms: tab1 sum of nine skills -3; tab2/3 sum floor(skill/2); tab4 sum floor(skill/5) | same | 1 | 2026-10-19 | H |
| C12 | Wiki says tab 4 counts class levels above 50 (page edited 2025-04-17); code says 89; code wins | https://idleon.wiki/wiki/Talent_Points; `talent-points-formula.ts` | 2 vs 1 | 2026-10-19; pre-patch wiki | H |
| C13 | `BUFF_BOI_TALENT` (power cauldron index 13, stat TalWarrior, bigBase 5+L) adds talent points to each tab for Warrior-line, not Master class | `vendor/data/website-data/cauldrons.json` (power/13); `talent-points-formula.ts` (bubble term) | 1 | 2026-10-19 | H |
| C14 | Back To Basics (119): +1 tab-2 talent point per level; term `t119` on tab 2 | `talents.json` (Barbarian); `talent-points-formula.ts` | 1 | 2026-10-19 | H |
| C15 | Default max level 100 from `SM_<i>` -> `SkillLevelsMAX`; `maxLevel` -1 when absent; account max sums per skillIndex | `vendor/parsers/talents.ts#L(createTalentPage)`, `character.ts#L416`; prior research | 1 / 3 | 2026-10-19 | H |
| C16 | Beefy Bottles (114) x1=1: each level of 'Warriors Rule' bubble raises max Lv of CritiKill, up to +x. Earlier research: raises CritiKill/Meat Shank, capped by Warrior cauldron bubble level (disagreement, confidence L) | `talents.json` BEEFY_BOTTLES; earlier research (character-builds) | 1 / 3 | 2026-10-19 | L |
| C17 | Growth functions: decay x1*L/(L+x2); add x1*L or quadratic; bigBase x1+x2*L; intervalAdd x1+floor(L/x2) | `vendor/utility/wiki/growth.mjs#L9-L60` | 1 | 2026-10-19 | H |
| C18 | Books only for ids < 615 excluding 10,11,12,23,75,79,86,87,266,267,446,447 | `vendor/parsers/talents.ts` (`BOOK_INELIGIBLE_INDICES`) | 1 | 2026-10-19 | H |
| C19 | Added levels = god + Symbols + family + achievement 291 + companion 1 + ninja tier 3 (+5) + Equinox + Grimoire 39 + Kattlekruk + Tesseract (cap 5) + Superbit; applied only if base level >= 1; super talents add on top | `vendor/parsers/talents.ts` (`getTalentAddedLevels`, `applyTalentAddedLevels`) | 1 | 2026-10-19 | H |
| C20 | Family bonus rows: Warrior +Total STR intervalAdd 1/5 from 9; Barbarian +Weapon Power decay 25/100 from 29; BB +Total Damage decay 20/180 from 69; DB +Kill per Kill decay 60/800 from 129; consumers damage.ts L1145, L331, L1531 | `vendor/data/website-data/shared-data.json` (`classFamilyBonuses` idx 7,8,10,14); `vendor/parsers/family.ts#L12-L22`; `damage.ts` | 1 | 2026-10-19 | H |
| C21 | Family walk: each character in save order, each class in its line, keep largest; Family Guy only multiplies for the played character | `vendor/parsers/family.ts#L49-L74` | 1 | 2026-10-19 | H |
| C22 | The Family Guy (144) decay 40/100 % larger family bonuses from this player; DK/SB use the account best | `talents.json` Blood_Berserker; `family.ts` | 1 | 2026-10-19 | H |
| C23 | Gilded Sword (6) add 1.5/level % damage, used at damage.ts L363 | `talents.json`; `damage.ts#L363` | 1 | 2026-10-19 | H |
| C24 | Sharpened Axe (5) add 0.4/level base Weapon Power, damage.ts L896 | `talents.json`; `damage.ts#L896` | 1 | 2026-10-19 | H |
| C25 | Meat Shank (86) decay 100/80 per power of 10 max HP (damage.ts L826); CritiKill (87) decay 52/50 crit damage (L1179) | `talents.json`; `damage.ts` | 1 | 2026-10-19 | H |
| C26 | Idle Brawling (88) decay 20/50 (character.ts L3368); Idle Skilling (89) decay 20/40 (L3357); Brute Efficiency (85) add 1/0.02 (efficiency.ts L274) | `talents.json`; `character.ts`; `efficiency.ts` | 1 | 2026-10-19 | H |
| C27 | Bucklered Up (9) decay 40/60 DEF; Health Booster (0) add 1/0.15; Mana Booster (1); Star Player (8) +1 star point per level | `talents.json` Rage_Basics; `damage.ts#L1085,L1387` | 1 | 2026-10-19 | H |
| C28 | Stat talents 10-13 +1 base stat per level; accuracy talent only until 100% hit | `talents.json`; earlier research (character-builds, Stat talents) | 1 / 3 | 2026-10-19 | M |
| C29 | Power Strike (90) 130+3L, cd 3, mana 3; Whirl (91) 60+1.5L, mobs 5+floor(L/40), cd 5, mana 5 | `talents.json` Warrior | 1 | 2026-10-19 | H |
| C30 | Firmly Grasp It (94) STR 15+L for 2+floor(L/4) min cd 30; Double Strike (93) decay 110/50; Health Overdrive (92) add 0.5/0.02; Strength in Numbers (95) 0.75/lvl; 'STR'ess Garb (96) 1.5/lvl; Carry A Big Stick (97) 1/lvl; Absolute Unit (98) +1 STR | `talents.json` Warrior; `damage.ts#L100,L892,L1086,L1087,L1302` | 1 | 2026-10-19 | H |
| C31 | Big Pick (100) 150+15L cd 12; Copper Collector (101), Motherlode (102), Tool Proficiency (103); Haungry For Gold (99) decay 55/80 (misc.ts L929); Tempestuous Emotions (104) 1%/lvl skill EXP | `talents.json` Warrior; `misc.ts#L929`; `character.ts#L604` | 1 | 2026-10-19 | H |
| C32 | Bear Swipe (105): dmg 160+L, cd 8, mana 20, cast 0.8; x term 3+floor(L/30) | `talents.json` Barbarian | 1 | 2026-10-19 | H |
| C33 | Axe Hurl (106): dmg 150+L, mobs 2+floor(L/50), cd 17, mana 15 | `talents.json` Barbarian | 1 | 2026-10-19 | H |
| C34 | Mocking Shout (107): heal L% per 0.5 s for 20+0.2L s, cd 600, mana 15 | `talents.json` Barbarian | 1 | 2026-10-19 | H |
| C35 | No Pain No Gain (108): -HP decay 100/30, +damage decay 100/50, double damage taken; Toolbox uses x for HP (damage.ts L1113) and damage (L423, L559) and doubles monster damage (L1353) | `talents.json`; `damage.ts#L315,L423,L1113,L1353` | 1 | 2026-10-19 | M |
| C36 | Monster Decimator (109) decay 100/50 double-count chance; additive term of Kill per Kill (damage.ts L1549) | `talents.json`; `damage.ts#L1549-L1562` | 1 | 2026-10-19 | H |
| C37 | Apocalypse Zow (110): x = 2+floor(L/33), y = L; Toolbox: x*(zow.finished[0]+1) (damage.ts L699-702). Wiki gives the same formula (edited 2026-09-03) | `talents.json`; `damage.ts#L699-L702`; https://idleon.wiki/wiki/Apocalypse_Zow | 1 / 2 | 2026-10-19 | H |
| C38 | `getBarbarianZowChow`: kills = abs(KLA - mapDetails), FIGHTING maps only minus exclusions, thresholds zow 1e5, chow 1e6/1e8, wow 1e9 | `vendor/parsers/character.ts#L3042-L3073`, `#L488-L490` | 1 | 2026-10-19 | H |
| C39 | Fistful of Obol (111) decay 60/50 STR from obols (not read by name in parsers); Strongest Statues (112) decay 100/50 for Power, Mining, Oceanman (statues.ts L145-L148) | `talents.json`; `vendor/parsers/world-1/statues.ts#L145-L148` | 1 | 2026-10-19 | M |
| C40 | Str Summore (id 81): +1 max Lv of Fist of Rage per level | `talents.json` Barbarian | 1 | 2026-10-19 | H |
| C41 | Worming Undercover (115) 9.3+0.7L, cd 15, AFK activity 4; Bobbin' Bobbers (116) 12+3L, cap y=5+floor(L/3) (efficiency.ts L443); All Fish Diet (117) 1.5/lvl (character.ts L749); Catching Some Zzz's (118) decay 20/60 (L3359) | `talents.json`; `efficiency.ts#L443`; `character.ts#L749,L3359` | 1 | 2026-10-19 | H |
| C42 | Wiki infobox: Barbarian specialises in Mining and Fishing (Mining inherited from Warrior; Fishing skill 2); Warrior in Mining; 15 talents; Barbarian talents listed | https://idleon.wiki/wiki/Barbarian ; https://idleon.wiki/wiki/Warrior (edited 2026-09-03) | 2 | 2026-10-19; claim 2026-09-03 | M |
| C43 | Blood Berserker specialises in Mining, Fishing and Cooking (adds Cooking); obtained through Eliteus (wiki, edited 2026-09-03) | https://idleon.wiki/wiki/Blood_Berserker | 2 | 2026-10-19 | M |
| C44 | BB attacks: Fired Up (135) 7+floor(L/15) s cd 60; Combustion (136) 300+1.5L mobs 13+floor(L/20) cd 20; Serrated Swipe (137) 40+0.4L cd 15; Ember Bear (138); Ferocity Strike (139) | `talents.json` Blood_Berserker | 1 | 2026-10-19 | H |
| C45 | Tough Steaks (140) decay 10/100 WP per 10 Cooking lvls (damage.ts L1148); Charred Skulls (141) decay 40/100 per 1000 STR (L1540), zeroed from W7 | `talents.json`; `damage.ts#L1148,L1535-L1550` | 1 | 2026-10-19 | H |
| C46 | Skill Strengthen (142) decay 60/80, y=1+floor(L/2) STR (efficiency.ts L268, L449; cooking.ts L156) | `talents.json`; `efficiency.ts`; `world-4/cooking.ts#L156` | 1 | 2026-10-19 | H |
| C47 | Taste Test (145) decay 100/100 finishes recipes, kitchens keep % fire; listed in `relevantTalents` | `talents.json`; `talents.ts` (`relevantTalents`) | 1 | 2026-10-19 | H |
| C48 | Apocalypse Chow (146) decay 20/100 per 1M-kill map (character.ts L1015, cooking.ts L149/L168); Waiting To Cool (147) decay 20/60 (L3408); Overflowing Ladle (148) decay 100/80, highest BB (cooking.ts L1074-L1087) | `talents.json`; `character.ts`; `world-4/cooking.ts` | 1 | 2026-10-19 | H |
| C49 | BB cooking efficiency uses Brute Efficiency additively with Apocalypse Chow (cooking.ts L168-L169) | `vendor/parsers/world-4/cooking.ts#L168-L169` | 1 | 2026-10-19 | H |
| C51 | Overblown Testosterone (143) decay 15/100 STR, y adds +L max Lv to Fist of Rage | `talents.json` Blood_Berserker | 1 | 2026-10-19 | H |
| C55 | Presets: levels `SL_<i>`/`SLpre_<i>`, max `SM_<i>`, bar `AttackLoadout_<i>`, selected preset `PlayerStuff_<i>[1]`; presets usable at Lv 15 | `vendor/parsers/character.ts#L241-L260,L410-L431`; earlier research (character-builds) | 1 / 3 | 2026-10-19 | M |
| C56 | Cooldown = ceil(cd / (1 + (WOAH_THAT_WAS_FAST + Magician_Starterpack)/100)) | `vendor/parsers/talents.ts` (`getAttackCooldownDivisor`, `getTalentCooldown`) | 1 | 2026-10-19 | H |
| C57 | Class bubbles scale with `mainStat === 'strength'` (e.g. Farquad Force, Power Trione, Hearty Diggy, Shimmeron); Warriors Rule makes orange passive bubbles stronger for warrior classes | `cauldrons.json` power cauldron; `damage.ts#L100`; `efficiency.ts#L263` | 1 | 2026-10-19 | M |
| C58 | Overflowing Ladle and Family Guy are read as account-best across BBs | `cooking.ts#L1074`; `family.ts` | 1 | 2026-10-19 | H |
| C59 | Voidwalker enhancement of talent 146 uses `getLastBloodBerserkerLine(...).chow.finished[1]` as 1.1^N | `vendor/parsers/talents.ts` (`getVoidWalkerTalentEnhancements`) | 1 | 2026-10-19 | H |
| C60 | `getLastBloodBerserkerLine` is the last BB-line character in save order | `talents.ts` | 1 | 2026-10-19 | H |
| C61 | Toolbox build "Barbarian/Fishing" by Sir_Grimtide (id ih5wAK): created 2026-06-01, last updated 2026-10-19, 41 likes, ~5,500 views (live counter, 5,499 on re-check); damage and skilling presets with the star orders quoted above | https://builds.idleontoolbox.workers.dev/api/builds/ih5wAK | 3 | 2026-10-19 | M |
| C62 | Build tab-3 damage order: 25 Bear Swipe = 25 Axe Hurl, NPNG delayed to W4, Str Summore, Zow (breakpoint only), Back To Basics, Monster Decimator, Fistful = Strongest Statues | same build (ids 105,106,108,81,110,119,109,111,112) | 3 | 2026-10-19 | M |
| C63 | Build tab 1 damage: Gilded Sword, Sharpened Axe, 50 Idle Brawling, Meat Shank, Health Booster, Fist of Rage, WIS by accuracy; tab 2: 25/25/45/1 then Carry A Big Stick, STR in Numbers, Health Overdrive, Stress Garb = Absolute Unit; fishing preset order | same build | 3 | 2026-10-19 | M |
| C64 | Alt "Barb Mining / Fishing" by Ibn_Yafith (id RjrEMb) updated 2026-10-15; early game DMG build updated 2026-05-14 | earlier research (character-builds) | 3 | claims 2026-10-15; verified earlier 2026-10-17, not re-fetched | L |
| C65 | Older Warrior builds ("Warrior / AFK (~35)", "Mining Active/AFK (Warrior) 30+") are tagged v1.23 and Stale but match the 2026 core | earlier research (character-builds) | 3 | Stale | M |
| C66 | Death Bringer talents 195-209 (Wraith Form, Grimoire, Sentinel Axes, Wraith Overlord, Apocalypse Wow 1e9 etc.) | `talents.json` Death_Bringer | 1 | 2026-10-19 | H |
| C67 | Wraith Overlord multiplies damage via equinox kills (damage.ts L305) | `damage.ts#L305-L307` | 1 | 2026-10-19 | H |
| C68 | Other BB builds exist: BigRav01 "Blood Berserker - AFK - W4" (2026-09-20, 1 like), "- Skilling - W4" (2026-09-20), whichyadidya "The Build Thus Far" (2026-08-10); orders not retrieved | https://builds.idleontoolbox.workers.dev/api/builds | 3 | 2026-10-19 | L |
| C69 | `applyTalentAddedLevels` excludes `isTalentBannedForAllLevels` talents and applies a Royal Guardian (ids 225-239) added-level cap | `vendor/parsers/talents.ts#L149-L180,L408,L426`; `@utility/talentBans` | 1 | 2026-10-19 | H |
| C70 | Symbols of Beyond (149, BB tab) is the source of the symbol added levels (1+floor(L/20)) | `talents.json`; `talents.ts` | 1 | 2026-10-19 | H |
| C71 | Stat talents 10-13 are `add 1 0`; ids 10-12 are in `BOOK_INELIGIBLE_INDICES`, so they are a late max-level sink with only Fist of Rage's cap raisable | `talents.json`; `talents.ts#L452` | 1 | 2026-10-19 | H |
| C72 | Wiki Warrior page: Blocky Bottles bubble raises Meat Shank max level (disagrees with talent text naming Warriors Rule/CritiKill) | https://idleon.wiki/wiki/Warrior (as reported by source verifier) | 2 | 2026-10-19; not re-fetched | L |
| C73 | Taste Test (145) `cooldown` field 200000 | `talents.json` TASTE_TEST | 1 | 2026-10-19 | H |
| C74 | Death Bringer talent growth functions 195-209 as listed in W5+ section | `talents.json` Death_Bringer | 1 | 2026-10-19 | H |
| C75 | `THE_FAMILY_GUY` is also read in misc.ts L924; Chow default multiplier 1 with no 1M map, second threshold 1e8 feeds Voidwalker 146 | `vendor/parsers/misc.ts#L924`; `character.ts#L3042-L3073`; `talents.ts` | 1 | 2026-10-19 | H |
