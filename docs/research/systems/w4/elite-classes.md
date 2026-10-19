# Dossier: Elite classes and W4 bosses

Topic id `elite-classes`. Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Claims are numbered [C1]..[C42] (some ids unused); the Claims register at the end gives each one's Source and tier. Tier key: 1 game data / Toolbox code, 2 Toolbox dashboard or wiki, 3 earlier project research (carries its own tier), 4 community. Where sources disagree both views are given with a confidence (H/M/L). "Vendor" below means `packages/toolbox-parsers/vendor/`. Revised 2026-10-19 after two adversarial verdict sets (source and game-data lenses): no claim was refuted by both lenses, none by one, so nothing was removed or marked Disputed; confidence (H/M/L) was added to every claim in the register (inline [Cn] tags inherit it), unverifiable claims are L, and missed mechanics were added as M17-M22. No real account data appears; fixtures are called "the W2 test account" / "the W3 test account".

Search note: the web-search budget was spent before the community pass, and the Google-sheet guides cannot be fetched by the tools. Community lines (tier 4) are therefore carried from the earlier research and flagged as such.

## Elite classes (Eliteus) and the W4 bosses

- **What it is:** The third class promotion. Each of the six subclasses has exactly one elite [C1]. The elite adds a fourth talent tab [C3], a family bonus [C11], one W4 specialty skill [C22], and, for three of them, the class gate on certain Rift tasks [C23]. Around it sit the W4 combat gates: the Greenie Gang (the unlock fight), the Massive Troll (the W4 world boss) and the Mutated Mush (the W4 summoned mini boss) [C4][C25][C31].
- **Unlocks:**
  - **Elite:** talk to Eliteus on Outskirts of Fallstar Isle (map 154, W4 map 4) [C4]. Quest 1 "The Greenie Gucci Gang": kill 10 buffed Demon Genies, reward 750,000,000 coins. Quest 2 "Elite Class for the Elites in Class": pick the elite, reward 150,964,823 coins [C4]. Code facts carried from the game client: no level gate, the picker only opens for class 8/9/20/21/32/33, re-entering with 2 or more kills sets the count to 10 [C5] (tier 3, not re-traced this pass).
  - **Voidwalker is different.** It comes from Nebulyte's 3-quest line, not Eliteus: 1M Death Note kills on W1-W3 monsters, Chaotic Chizoar once, 12M Green Mushrooms solo [C8].
  - **Massive Troll:** arena map 165 (Enclave a la Troll) with a Troll's Enclave Key; 1 / 5 / 60 keys for Normal / Chaotic / Blitzkrieg [C29]. The first kill gives the W4-to-W5 portal item [C30].
  - **Mutated Mush:** drop Toxic Sludge or Radioactive Waste on the mushrooms at Spaceway Raceway; one Mush per mushroom [C31].
- **Scope:** Elite promotion is per character. Family bonuses are account-wide, taken from the best character in each class line [C12]. Talents marked "any player" (Beast Master breeding, Elemental Sorcerer Wormhole Emperor) work account-wide [C22]. Troll fights are per character, keys are shared [C29].
- **Inputs to outputs:** input is a subclass character, map 154, and enough damage to kill 10 buffed genies (the base Demon Genie has 1.6M HP, 4,225 defence [C7]; the Gang is "buffed" and its stats are not in the data). Output is the elite (no choice), its talent tab and its family bonus. The only way to change elite within a base class was the Elite Class Swap Token, last sold June 2025 and no longer available [C9].
- **Goals and Milestones:**

| Goal | Threshold | Why | Claim |
|---|---|---|---|
| Greenie Gang | 10 kills on map 154 | opens quest 2 | [C4] |
| Elite taken | classIndex in {10,12,22,25,34,36} | 4th tab, family bonus | [C1][C2] |
| Family bonus starts | elite class level 70 (formula uses level minus 69) | first non-zero point | [C10][C11] |
| Rift gates | Orb 180 (DK), Wormhole 60 (ES), Pirate Flag 75 (SB) | Rift levels 8/9/16 first | [C23] |
| Begone Troll | 10 tiers, see catalogue | cards, free attacks | [C28] |
| Mush spawns stored | 1/2/3/4/5/6/7/8 after 4/7/12/19/28/39/52/67 login-days | eggs, ladles, keys | [C31] |

- **Feeds / fed by:** Fed by the subclass (W2 Speccius), W3 boss clear and the W4 portal (Galaxial Amethyst) [C30], and damage. Feeds the Rift (class-gated tasks) [C23]; Cooking (BB) [C21]; Breeding and AFK gains (BM) [C16][C22]; Lab (BC) [C19]; Refinery and Construction (DK) [C17]; every talent (ES family bonus) [C14]; Sailing (SB) [C18]; Gaming (DK). Troll feeds the W5 portal, cards (kitchen speed, all skill efficiency, total damage) [C27], obols and stamps [C26]. Mush feeds Cooking (ladles), Breeding (eggs) and the Troll key supply [C31].
- **Per-session actions:** Until promoted, every subclass character in a W4 account has "go to map 154, kill the Greenie Gang, take your elite" as its Next Action. After promotion, spend the new 4th-tab talent points (Spend Plan). Spend stored Mush spawns when a Sludge or Waste is on hand. Spend Troll keys only on characters who can win the minigames. None of these is a Verdict.
- **AFK Setup implications:** after promotion the specialty picks the slot: BB cooks and is the AFK fighter [C21][C37]; BC sits in the Lab and sets the tube geometry [C19]; BM breeds [C22]; DK is the Gaming character [C22]; SB sails once W5 opens [C22]; ES worships and holds the second god [C20]. Key farming (Stilted Seekers) is AFK, with BB suggested by the community [C37].
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:** (1) Believing there is an elite choice [C1]. (2) Waiting for a level requirement [C5]. (3) Leaving a subclass un-promoted after W4 entry: ActiveOn's Goal only fires at stage W4-entry [C39], so later stages go silent. (4) Hunting the swap token [C9]. (5) Treating the Begone Troll task as 3 tiers when the data has 10 [C28]. (6) Looking for Chizoar as the W4 boss [C30]. (7) Putting a second Siege Breaker on the roster: the community roster has 2 SB [C38], ActiveOn's slot plan says never [C39]; flag as a source disagreement.
- **Save and Toolbox fields:** see the mechanics catalogue; every line names the exact path.
- **Sources:** the register at the end.

## Mechanics catalogue (W1 to W4, with W5+ one-liners)

Notation: `char` is a parsed `characters[i]`. Class indices are the game's `CharacterClass` [C2].

### M1. Class tree and the elite promotion
- **Rule:** `classPromotions` gives each class `index`, `promotesTo`, `promotesFrom`, `talentTabs`, `released` [C1]. Subclass to elite: Barbarian (8) to Blood Berserker (10); Squire (9) to Divine Knight (12); Bowman (20) to Siege Breaker (22); Hunter (21) to Beast Master (25); Wizard (32) to Elemental Sorcerer (34); Shaman (33) to Bubonic Conjuror (36). Each subclass has one entry in `promotesTo`, so no choice [C1].
- **Cap / unlock:** no level gate [C5]. Needs map 154 and the Gang [C4].
- **Cost:** none in items; Gang kills only. Rewards are coins [C4].
- **Fields:** `characters[].classIndex`, `.class` (character.ts L291-293) [C2]; quest state through `account.quests` / `QuestComplete_N`, names `Eliteus1`, `Eliteus2` (quests.ts `getQuests`) [C4]; class tree `classPromotions` from `data/website-data/classPromotions.json` [C1].

### M2. Line membership
- **Rule:** `checkCharClass(c, X)` is true when X is in `talentPagesMap[c]`, the tab list of c. So a Death Bringer counts as a Barbarian and Blood Berserker; a Royal Guardian counts as a Divine Knight and Squire [C3].
- **Why it matters:** family bonus walks, Refinery Throttle (Squire or DK, refinery.ts L193) and BB talents all use this [C3][C17].
- **Field:** `talentPagesMap` (classDefinitions.ts) [C3].

### M3. Class family bonus
- **Formula:** `growth(func, max(0, round(level - x3)), x1, x2)`; 0 when `level < x3`; `decay` is `x1*L/(L+x2)`; `decayMulti` (Wind Walker, Maestro-line style entries) is a multiplier-form variant, not `decay` [C10][C11]. `level` is the character's class level (`StatList[4]`) [C12].
- **Walk:** for each character in save order, for each class in its line, keep the largest bonus seen; THE_FAMILY_GUY multiplies it only for the played character, and DK and SB bonuses use the account's best Family Guy [C12].
- **Values at elite class level (decay, cap = x1):**

| Elite | Bonus | x1 / x2 / x3 | L70 | L100 | L150 | L200 | L300 | L500 | Consumer | Claim |
|---|---|---|---|---|---|---|---|---|---|---|
| Blood Berserker | +% Total Damage | 20/180/69 | 0.11 | 2.94 | 6.21 | 8.42 | 11.24 | 14.11 | damage.ts L331 | [C11][C13][C16] |
| Divine Knight | +% Refinery Speed | 50/150/69 | 0.33 | 8.56 | 17.53 | 23.31 | 30.31 | 37.09 | refinery.ts L124 | [C11][C13][C17] |
| Siege Breaker | +% faster min boat travel time | 20/170/69 | 0.12 | 3.08 | 6.45 | 8.70 | 11.52 | 14.34 | sailing.ts L378 | [C11][C13][C18] |
| Beast Master | +% All Skill AFK gains | 5/180/69 | 0.03 | 0.73 | 1.55 | 2.11 | 2.81 | 3.53 | character.ts L3239 | [C11][C13][C16] |
| Elemental Sorcerer | +N levels to all talents above Lv 1 | 20/350/69 | 0.06 | 1.63 | 3.76 | 5.45 | 7.95 | 11.04 | talents.ts L359-L376 | [C11][C13][C14] |
| Bubonic Conjuror | +% All Stat | 5/180/69 | 0.03 | 0.73 | 1.55 | 2.11 | 2.81 | 3.53 | stat code (not traced) | [C11][C13] |

- **Fields:** `char.familyBonuses` (record keyed by class name), `getCharacterFamilyBonus(char, className)`, `classFamilyBonuses` in `shared-data.json` [C11][C12].
- **W5+:** Death Bringer (idx 14) Kill per Kill 60/800/129; Royal Guardian (16) Drop Rate 10/800/129; Wind Walker (29) coins from mobs 1.4/800/129 (func `decayMulti`, not `decay`; the WW entry in `classFamilyBonuses` is index 29, index 24 is a separate filler-named WIND_WALKER row); Arcane Cultist (40) Total Damage Multiplier 12/800/129; Voidwalker (4) Fighting AFK Gains 5/250/69 (a W4 unlock, see M10); Infinilyte (5) and Spiritual Monk (35) are unreleased [C11][C42].

### M4. Fourth-tab talents and added levels
- **Rule:** each elite has 15 talents on its tab; the fourth tab is `char.talents[3]` [C22][C15]. Level = base level + added levels. Added levels sum: god bonus (Arctis), Symbols of Beyond, achievement 291, family (ES floor), companion 1, ninja mastery tier 3 (+5), Equinox, Grimoire, Kattlekruk set, Tesseract (cap 5), Superbit [C14].
- **Symbols of Beyond:** every elite has one (`intervalAdd` x1=1, x2=20: `1 + floor(level/20)` levels to all talents above Lv 1) [C15].
- **Fields:** `char.talents[3].orderedTalents`, `char.flatTalents`, `char.addedLevels`, `char.addedLevelsBreakdown` [C14]. Max level per talent: `maxLevel` from `SkillLevelsMAX` (talents.ts L127) [C14].
- **Max level cap:** no fixed per-talent cap in the data file; `maxLevel` is read from the save. Not verified as a number (open question Q3).

### M5. Blood Berserker (idx 10, Barbarian line, W4 skill Cooking)
- **Talents (ids):** Fired Up 135, Combustion 136, Serrated Swipe 137, Ember Bear 138, Ferocity Strike 139, Tough Steaks 140 (+x Weapon Power per 10 Cooking levels, decay 10/100), Charred Skulls 141, Skill Strengthen 142, Overblown Testosterone 143, The Family Guy 144, Taste Test 145 (decay 100/100: finishes all recipes, kitchens keep that % of the fire), Apocalypse Chow 146 (decay 20/100 Cooking EXP and efficiency per mob over 1M kills, up to a count), Waiting To Cool 147 (decay 20/60 Cooking AFK), Overflowing Ladle 148 (decay 100/80, ladle AFK time), Symbols of Beyond 149 [C22].
- **Code uses:** `getHighestOverflowingLadle` over all BBs (cooking.ts L1075); `getLastBloodBerserkerLine` is the last BB-line character, whose kill milestones feed Apocalypse Chow whoever holds it (talents.ts L527-L529); Taste Test (145) is in `relevantTalents` [C21].
- **W5+:** Death Bringer promotes from BB [C1].

### M6. Divine Knight (idx 12, Squire line, W4 skill Gaming)
- **Talents:** Knightly Disciple 165, Mega Mongorang 166, Divine Intervention 167 (decay 200/300 crit), Orb of Remembrance 168 (+1% active EXP and Drop Rate per mob kill shown above the orb; duration `30 + 0.4*L` s, cooldown 160), Imbued Shockwaves 169, Gamer Strength 170 (decay 7/100 Weapon Power per 10 Gaming levels), shared 141-144, Undying Passion 175, 1000 Hours Played 176 (decay 60/100 Gaming EXP all characters), Bitty Litty 177, King of the Remembered 178 (decay 5/150 printer output per POW-10 orb kills), Symbols 149 [C22].
- **Rift link:** Orb score 180 for Rift levels 8, 18, 29, 43 [C23].
- **Code:** refinery family bonus [C17]; `squires` list for Refinery Throttle includes DKs (refinery.ts L193).
- **W5+:** Royal Guardian promotes from DK [C1].

### M7. Siege Breaker (idx 22, Bowman line, W4 skill Sailing, W5 content)
- **Talents:** Cannonball 360, Suppressing Fire 316, Firebomb 317, Pirate Flag 318 (Plunderous mobs; `intervalAdd 10/5` HP multiplier and `bigBase 800/20` EXP and drop %), Plunder Ye Deceased 319, Crew Rowing Strength 320, Stacked Skulls 366, Skill Ambidexterity 367, Adaptation Revelation 368, The Family Guy 144, Unending Loot Search 325, Expertly Sailed 326 (decay 60/100 Sailing EXP all), Captain Peptalk 327, Archlord of the Pirates 328 (decay 6/150 EXP and Drop per POW-10 Plunderous kills, all characters), Symbols 374 [C22].
- **Rift link:** Pirate Flag score 75 for Rift levels 16, 22, 36, 65 [C23].
- **Family:** boat min travel time `max(15, 120/(1 + (family + shiny + legend)/100) - 4*gemShop8)` (sailing.ts L378-L384) [C18].
- **Wiki:** if the flag holds more than 100 coins, a guaranteed Plunderous mob costs 25 coins [C35].

### M8. Beast Master (idx 25, Hunter line, W4 skill Breeding)
- **Talents:** Ballista 315, Boar Rush 361, Whale Wallop 362, Nacho Party 363, Have Yet Anotha One 364, Animalistic Ferocity 365, shared 366-368 and 144, Arena Spirit 370, I Dream Of Peace And Egg 371 (decay 100/80: chance of 3 eggs per 10 h of AFK, to 100 h, no candy), Shining Beacon of Egg 372 (decay 100/100 Breeding EXP, any player), Curviture of the Paw 373 (decayMulti 1.2/100 mob power, any player), Symbols 374 [C22].
- **Family:** All Skill AFK gains in `getAfkGain` [C16].
- **W5+:** Wind Walker promotes from BM [C1].

### M9. Elemental Sorcerer (idx 34, Wizard line, W4 skill Divinity)
- **Talents:** Meteor Shower 495, Lightning Barrage 496, Radiant Chainbolt 497, Dimensional Wormhole 498 (decay 17/70 XP and drop per Wormhole kill; duration bigBase 43/0.2 s; cooldown 120; kills respawn a normal mob), Chaotic Force 499, Believer Strength 500, Memorial Skulls 531, Skill Wiz 532, Utmost Intellect 533, Family Guy 144, Polytheism 505 (decay 70/200: second god), Shared Beliefs 506 (decay 100/100 Divinity EXP all), God's Chosen Children 507 (decay 10/200 DMG all per God rank), Wormhole Emperor 508 (decay 1.5/150 DMG per POW-10 wormhole kills, all characters), Symbols 539 [C22][C35].
- **Polytheism:** `SkillLevels[505] % 10` is the second god index; `isGodEnabledBySorcerer(char, slot)` uses the same remainder (character.ts L496-L505, lab.ts L259) [C20].
- **Rift link:** Wormhole score 60 for Rift levels 9, 27, 44 [C23].
- **Family:** extra talent levels for all characters [C14].
- **W5+:** Spiritual Monk promotes from ES but is unreleased [C1].

### M10. Bubonic Conjuror (idx 36, Shaman line, W4 skill Laboratory)
- **Talents:** Chemical Warfare 525, Flatulent Spirit 526, Tampered Injection 527, Plague Stricken 528, Raise Dead 529, Wired In Power 530 (decay 7/100 per 10 Lab levels), shared 531-533 and 144, Purple Tube 535 (decay 40/100 Line Width to players at or right of the BC in the Lab), Green Tube 536 (decay 60/100 Lab EXP to players on the left), Essence Transferral 537 (decay 70/100 of own Lab EXP to the lowest Lab Lv player), Upload Squared 538 (decay 80/100 own Lab EXP and efficiency), Symbols 539 [C22].
- **Code:** `getBubonicGreenTube` and Purple Tube use `account.lab.playersCords` x positions (talents.ts L531-L541, lab.ts L335-L350) [C19].
- **W5+:** Arcane Cultist promotes from BC [C1]. The wiki says an enhancement later turns Green Tube into an all-skill AFK bonus [C35].

### M11. Voidwalker line (Journeyman, W4 unlock)
- **Rule:** Journeyman (2) to Maestro (3) to Voidwalker (4) [C1]. Voidwalker comes from Nebulyte: quest 1 Deathnote 1M kills on all W1-W3 monsters (reward 72 HR Time Candy), quest 2 kill Chaotic Chizoar (15 Gem Envelopes, Galaxy Card Pack), quest 3 kill 12,000,000 Green Mushrooms on that character (Smolderin Card Pack, 3 Cosmic Time Candy) [C8].
- **Step 4 (Nebulyte4 "VMAN_ACHIEVED!", Difficulty 1, Reclaimable):** custom step "Become_a_Voidwalker" x1, reward Vman Nametag (`EquipmentNametag4`). It completes by promoting to Voidwalker, not by a kill count [C8].
- **Quest 1 scope:** the Deathnote requirement is account-wide (quest text: "NOT kills just on your Maestro"). `customArray`: "Deathnote_1M_Kills" value 40 (40 monsters at 1M kills each) plus "Visit_Deathnote" x1. Quest 3 is the opposite: the character's own Green Mushroom kills (Monster Card personal count) [C8].
- **Voidwalker talent tab:** 15 talents in `talents.json` tab `Voidwalker`: Void Trial Rerun, Void Radius, Bossing Vain, Quad Jab, Enhancement Eclipse, Power Orb, Eternal STR/AGI/WIS/LUK, EXP Cultivation, Voodoo Statufication, Species Epoch, Master of the System, Blood Marrow. Enhancement Eclipse and Blood Marrow feed Cooking (cooking.ts L788-L860) [C22b].
- **Field:** quest state via `account.quests` (Nebulyte1..4) and Death Note kills `account.deathNote` [C8].

### M12. Rift class gates
- **Rule:** `riftInfo` is a 70-entry list. Class-bound tasks: Divine Knight Orb 180 at levels 8, 18, 29, 43; Elemental Sorcerer Wormhole 60 at 9, 27, 44; Siege Breaker Pirate Flag 75 at 16, 22, 36, 65. Level 60 and 64 need 11 characters; level 70 is the end (`YOU_CANNOT_PROGRESS_FURTHER`) [C23].
- **Fields:** `account.rift.currentRift`, `.currentProgress`, `.chars` (raw `Rift[2]`, unparsed; likely the per-class best scores, unverified) (rift.ts) [C23][C24].
- **Caveat:** whether `currentRift` is the 0-based index of the active task or a count of finished ones is not settled; Toolbox unlocks bonus at `index <= currentRift` [C24].

### M13. Massive Troll (W4 boss, Boss4A/B/C)
- **Stats:** Normal 80M HP, Chaotic 350M, Blitzkrieg 2B; defence 600 for all; `Damages [1000,1]` [C25]. The data `ExpGiven` is 12,000 for all three; the earlier research and wiki say 750K / 30M / 1B [C25] (disagreement, M).
- **Entry:** 1 / 5 / 60 keys (wiki; not in data) [C29]. Save: `BossInfo[3] = [difficulty, hp, defence]`, arena map 165 [C33].
- **Fight rule:** the Troll never attacks; it shields and gives mission minigames (14 types on the wiki), failing heals it [C29].
- **Drops:** coins 1M / 5M / 20M, Troll Scales 1x@13% / 2x@30% / 4x@50%, cards, Jagged Obol, statues, stamps, Mystery Upgrade Stone II, Talent Point Reset Fragments, Golden Ribs; Blitzkrieg also Cascading Scaled Cape of Krieg @0.025% [C26]. The Magma Geode is not in the drop table, so it is a scripted first-kill reward [C30].
- **Cards:** Massive Troll +6% Kitchen Speed (passive), Chaotic +10% All Skill Efficiency, Blitzkrieg +7% Total Damage [C27].
- **Begone Troll task (`tasks[3][6]`)**, 10 tiers, x=10: (1) defeat Normal; (2) succeed at 20 mindgames; (3) flawless kill (no failed mindgame); (4) defeat on 5 players in order from the first; (5) kill Chaotic; (6) Chaotic on 6 players in order; (7) Chaotic within the first 10 mindgames; (8) defeat Nightmare (Blitzkrieg); (9) Nightmare on 10 players in order; (10) Nightmare within 5 mindgames wearing the red boxing gloves. Breakpoints 1, 20, 1, 5, 1, 6, 1, 1, 10, 1 [C28]. The earlier dossier and the wiki describe only the first three tiers; the data has ten (H).
- **Third task reward:** wiki says later fights start vulnerable for 5 attacks [C29].

### M14. Mutated Mush (mini4a)
- **Stats:** 120M HP, defence 4,500, 2M EXP [C25]. Drops: Troll's Enclave Key @50%, Mob Egg @60%, Cooking Ladle x3 @100%, Mutated Mush Card @20% (+6% Cooking EXP), Apprentice Recipe 2%, Journeyman Recipe 0.8%, Armor Upgrade Stone C 4%, Gem x4, Time Candy 1 HR to 72 HR [C31].
- **Spawning:** barrel on the Purp Mushroom map; regrowth at least 4 days, counted in login-days; stored spawns 1..8 at 4/7/12/19/28/39/52/67 days [C31].
- **Key rate conflict:** data 0.5 per kill vs wiki 1 in 250 (boss-keys dossier C30); confidence L.

### M15. Demon Genie / Greenie Gang
- **Stats:** `demonP` Demon_Genie 1.6M HP, 4,225 defence, 4,800 EXP, 2,200 damage; drops Genie Lamp 16%, Lab Ring 4e-6, Demon Genie Card 2e-5 (+15% Crystal Mob Spawn Chance) [C7]. The Gang version is buffed; numbers unavailable. `demonP` also drops coins x1660 at 50% (`monsterDrops.json`, effectiveChance 0.5) [C7]. Respawn and spawn rules of the Greenie Gang: the wiki Eliteus page only restates the quest ("Defeat the Greenie Gang >= 10", difficulty 5) and gives no spawn, respawn or buffed-stat detail (tier 2, 2026-10-19); confidence L, still open (Q2).

### M16. Elite Class Swap Token
- **Rule:** hold the item to change elite within the base class (e.g. DK to BB); sold in the Limited Specials, last June 2025, no longer sold; sells for 1 copper [C9].

### M17. Rift bonuses attached to score tasks
- **Rule:** `riftInfo` entries carry `riftBonus` (reward unlocked when that Rift level is passed) at 0-based indices 5, 10, 15, ..., 60 (1-based 6, 11, ..., 61): Trap_Box_Vacuum (5), Infinite_Stars (10), Skill_Mastery (15), Eclipse_Skulls (20), Stamp_Mastery (25), Eldritch_Artifact (30), Vial_Mastery (35), Construct_Mastery (40), Ruby_Cards (45), Killroy_Prime (50), Sneak_Mastery (55), Cooking_Mastery (60). Elite-class gates therefore sit directly on rewards: index 15 and 35 are the Siege Breaker Pirate Flag 75 task and unlock Skill_Mastery and Vial_Mastery; index 60 (Cooking_Mastery, "defeat 500 monsters within 5 min") is not class-gated [C23b].
- **Offset:** class-gate level numbers in M12 are 1-based; the data array is 0-based. `isRiftBonusUnlocked` uses `index <= currentRift` [C24].

### M18. Death Bringer, Royal Guardian, Wind Walker, Arcane Cultist family and tabs
- **Family bonuses (x3 = 129, so the first point is at class level 130):** Death Bringer kill-per-kill 60/800, Royal Guardian drop rate 10/800, Wind Walker coins from mobs `decayMulti` 1.4/800, Arcane Cultist total damage multiplier 12/800 [C11].
- **Talent tabs (15 each):** Death Bringer (Wraith Form, Grimoire, ... Apocalypse Wow), Royal Guardian (Castle Convene, Royal Armory, ... Grand Vein, Graded Rate), Wind Walker (Tempest Form, Compass, ... Slayer Abominator), Arcane Cultist (Arcanist Form, Tesseract, ... Backup Energy). Grimoire and Tesseract feed the added-talent-level sum (M4). Royal Guardian talents get no extra `AllTalentLV` levels beyond the armory cap (game-data lens; cap formula not traced, confidence L) [C22c].

### M19. Super talents (spelunking) as a talent-level source
- **Rule:** `account.spelunking.talentSpelunkArrays[playerId + 12*presetIndex]` lists chosen talent indices (-1 and null skipped); each chosen talent gets `superTalentsInfo.bonus` added levels, applied per preset (talents.ts L336-L350, L402-L424). It is separate from, and on top of, the M4 sum [C14b].

### M20. Other class lines whose family bonuses stack with elite play
- Maestro (3): +% printer sample size 6/100/29; Voidwalker (4): Fighting AFK Gains 5/250/69; Wizard (32): +Star Tab talent points `intervalAdd` 1/6/29; Shaman (33): higher golden-food bonuses `decayMulti` 0.4/100/29 [C11b].

### M21. THE_FAMILY_GUY and the account-wide walk
- THE_FAMILY_GUY (id 144) sits in every elite tab; shared elite tab talents are 141-143 (BB/DK), 366-368 (SB/BM) and 531-533 (ES/BC). `getAccountFamilyGuy` finds the best Family Guy among DK and SB lines and subtracts the played character's Elemental Sorcerer family levels before applying it, to avoid a loop (family.ts L24-L51) [C12b].

### M22. Apocalypse Chow and Apocalypse Wow
- `getLastBloodBerserkerLine` (last BB-line character in save order; a Death Bringer counts) supplies the kill milestones for Apocalypse Wow (CalcTalentMAP[209]) and "49_4" whoever holds the talent (talents.ts L525-L529). Apocalypse Chow adds `getTalentBonus('APOCALYPSE_CHOW') * chows` to cooking efficiency (cooking.ts L168). The Voidwalker ENHANCEMENT_ECLIPSE bonus is a separate multiplier in cooking (L794-L860); whether it scales Apocalypse Chow itself is not traced (confidence L) [C21b].

## Min-max by stage

Priority orders below come from the code facts plus the quoted community guide, and each line says which. The community material is thin; no source ranks all six elites with a reason [C37][C38].

- **W1 early to late:** no elite exists. Nothing to do except keep one of each subclass alive so every elite slot is covered later [C39].
- **W2 late / W3 late:** reach subclass for every character; a second Squire is allowed (the community roster uses 2 DK) [C38][C39]. Pushing damage to survive 10 genies matters from W3 late.
- **W4 entry (first hour):**
  1. Finish Gobo's quest line so portals open, then "push everyone to map 4 (Demon Genie map) and get your elite classes", throw everyone into the Lab and push characters one by one (tier 4, carried; guide undated, after 2025-11-06) [C37].
  2. Order within that: the code ranks **DK, ES, BC, BB, BM, SB** [C39]. Why DK/ES first: they unblock Rift 8 and 9 [C23] and the community calls them the active pushers [C37]. SB is last because its specialty (Sailing) waits for W5 and its Rift gate is level 16 [C23]. The BC/BB/BM middle order is unverified (confidence L) [C39].
  3. Confidence: H that DK and ES unblock Rift 8/9; L for the remaining order.
- **W4 mid:**
  - Spend 4th-tab points in the order the wiki lists as best per class: DK 1000 Hours Played, Divine Intervention, Orb of Remembrance, Gamer Strength, Symbols [C35]; BC Upload Squared and Essence Transferral first [C35]; ES Dimensional Wormhole, Chaotic Force, Shared Beliefs, Skill Wiz [C35]; BM breeding trio Shining Beacon, Curviture, I Dream of Peace And Egg, then summons [C35]; BB inflamed core (Combustion, Serrated Swipe) then Skill Strengthen and Overblown Testosterone, plus cooking talents for a cook [C35]; SB combat first, Crew Rowing and Stacked Skulls mid, sailing talents late [C35]. All wiki lines (tier 2, rev 2026-09-03 to 2026-10-07), not community consensus.
  - Place the BC in the Lab so Purple Tube (right side) and Green Tube (left side) cover the others [C19].
  - Put BB on AFK fighting [C37]. Farm Mush spawns for eggs and ladles [C31]. Do not chase the Troll yet [C37 via boss dossier].
  - Reach Rift 10 and 15 using DK and ES elites [C23].
- **W4 late:** kill the Normal Troll once for the Magma Geode (W5 portal) [C30]; then tier 3 of Begone Troll (flawless) so later runs are easy [C28][C29]. Take Chaotic and Blitzkrieg for the cards when keys are spare (60 keys for Blitzkrieg) [C27][C29]. Take Voidwalker only late W5 or W6 per the guide [C37]. Pass Rift 16 with an SB [C23].
- **Per class (W4):** BB cook and AFK fight; DK Gaming plus Orb pusher; ES pusher plus second god; BM breeding; BC Lab; SB sailing prep [C35][C37].
- **W5+ outline:** SB Sailing talents, DK Gaming, ES Divinity pay off in W5; masters (Death Bringer, Royal Guardian, Wind Walker, Arcane Cultist) follow in W6-W7 [C1][C42].
- **Stale roster to ignore:** the 2023-07-25 guide sheet ideal setup was 1 BB, 2 DK, 1 BM, 2 SB, 1 BC, 2 ES, 1 VW (pre-W5 masters) [C38].

## What ActiveOn has and lacks

- **Has:** `metapath.goal.elite` (confidence L) and the `metapath/elite-pending` detector, firing only when the stage is exactly W4-entry, one Goal per un-promoted subclass character, ordered by `ELITE_ORDER` [C39]. A classes system with a class-EXP contribution only [C39]. Rift and Sigils have a separate research file [C23].
- **Lacks:** (a) no Goal after W4-entry for un-promoted characters; (b) no Greenie Gang progress or `Eliteus1/2` quest state; (c) no family-bonus Verdict or readout; (d) no 4th-tab Spend Plan; (e) no Rift class-gate Goal (needs a DK/ES/SB); (f) no Troll / Mush / Begone Troll tracking, keys beyond Key1-Key3 (boss-keys dossier) [C39]. A system home for elites does not exist.
- **Sprites:** class emblems exist for Divine Knight, Blood Berserker, Siege Breaker, Bubonic Conjurer, Elemental Sorcerer, Beast Master, Voidwalker (`apps/activeon/src/art/sprites/grids/classes.ts`) [C40]. New sprites needed: Eliteus (NPC), Greenie Gang genie, Massive Troll portrait, Mutated Mush, Troll's Enclave Key, Magma Geode, Demon Genie, tier chips Normal / Chaotic / Blitzkrieg, Orb / Wormhole / Pirate Flag score icons, Purple and Green Tube icons. No Death Bringer / Royal Guardian / Wind Walker / Arcane Cultist emblems (W5+).

## Open questions

- Q1: Source for a ranked elite order. None found; the order [DK, ES, BC, BB, BM, SB] stays L.
- Q2: Buffed Greenie genie stats (HP, defence) and the 10-kill counter save key.
- Q3: Talent max-level caps per elite talent; need `SkillLevelsMAX` formula and talent point sources.
- Q4: Meaning and save path of Orb, Wormhole and Pirate Flag "scores" (`Rift[2]`?).
- Q5: `currentRift` offset (0-based or a count).
- Q6: Troll EXP (12,000 in data vs 750K on the wiki) and Troll card rate (data 1 in 250 vs wiki 10x rarer).
- Q7: Do SB duplicates have value? Community roster says 2 SB, ActiveOn says never.
- Q8: Where is the Magma Geode granted in code, and is the Troll first-kill state a save key?
- Q9: Does the swap token change the character's subclass line or only the elite? Wiki says "within your class".
- Q10: Reddit and community guide re-verification (budget spent).

## Claims register

| Cid | Claim | Source | Tier | Verified | Conf |
|---|---|---|---|---|---|
| C1 | Each subclass has one `promotesTo`: Barbarian to Blood Berserker, Squire to Divine Knight, Bowman to Siege Breaker, Hunter to Beast Master, Wizard to Elemental Sorcerer, Shaman to Bubonic Conjuror; elites promote on to Death Bringer, Royal Guardian, (none), Wind Walker, Spiritual Monk (unreleased), Arcane Cultist; Voidwalker to Infinilyte (unreleased) | `vendor/data/website-data/classPromotions.json` | 1 | 2026-10-19 | H |
| C2 | Class indices: Barbarian 8, Squire 9, BB 10, DK 12, Bowman 20, Hunter 21, SB 22, BM 25, Wizard 32, Shaman 33, ES 34, BC 36, Voidwalker 4; saved as `characters[].classIndex` and `.class` | `vendor/data/website-data/classPromotions.json`; `vendor/parsers/character.ts#L291-L293` | 1 | 2026-10-19 | H |
| C3 | `checkCharClass` tests membership in the class's talent-tab list, so higher classes count as their lower lines; elite classes have 4 tabs | `vendor/parsers/classDefinitions.ts`; `vendor/parsers/talents.ts` (`checkCharClass`) | 1 | 2026-10-19 | H |
| C4 | Eliteus quests: Eliteus1 "The Greenie Gucci Gang" defeat the Gang x10, 750,000,000 coins; Eliteus2 "Elite Class for the Elites in Class" select an elite x1, 150,964,823 coins; NPC on Outskirts of Fallstar Isle (map 154) | `vendor/data/website-data/quests.json#L9309-L9360`; wiki https://idleon.wiki/wiki/Eliteus (rev 2026-09-27) | 1 | 2026-10-19 | H |
| C5 | No level requirement; picker only for classes 8/9/20/21/32/33; re-entry with 2 or more kills sets count to 10 (N.js offsets 15561142, 24187882, 24204015, v1.23) | docs/research/systems/w4-systems/2026-10-17-rift-sigils-tome-bosses-elite.md (origin/research/w4-systems) | 3 | 2026-10-19 (not re-traced) | L |
| C7 | Demon Genie (`demonP`): 1,600,000 HP, 4,225 defence, 4,800 EXP, damage 2,200; Genie Lamp 16%; Demon Genie Card 2e-5 gives +15% Crystal Mob Spawn Chance | `vendor/data/website-data/monsters.json`, `monsterDrops.json`, `cards.json` | 1 | 2026-10-19 | H |
| C8 | Nebulyte quests: Deathnote 1M kills on W1-W3 monsters; Defeat Chaotic Chizoar; 12,000,000 Green Mushrooms by that character | `vendor/data/website-data/quests.json#L10046-L10140` | 1 | 2026-10-19 | H |
| C9 | Elite Class Swap Token changes elite within your class (DK to BB); last sold June 2025; unavailable | https://idleon.wiki/wiki/Elite_Class_Swap_Token (rev 2026-10-05) | 2 | 2026-10-19 | L |
| C10 | `growth('decay')` is `x1*L/(L+x2)`; family bonus is 0 below x3 and uses `round(level - x3)` | `vendor/utility/wiki/growth.mjs#L34-L36`; `vendor/parsers/family.ts#L14-L19` | 1 | 2026-10-19 | H |
| C11 | `classFamilyBonuses` (x1/x2/x3): BB 20/180/69 Total Damage; DK 50/150/69 Refinery Speed; SB 20/170/69 Boat Travel; BM 5/180/69 All Skill AFK; ES 20/350/69 talent levels; BC 5/180/69 All Stat; DB 60/800/129; RG 10/800/129; WW 1.4/800/129; AC 12/800/129; VW 5/250/69 | `vendor/data/website-data/shared-data.json` key `classFamilyBonuses` | 1 | 2026-10-19 | H |
| C12 | Family walk keeps the best bonus per class across characters in save order; THE_FAMILY_GUY multiplies only the played character's own; DK and SB use the account's best Family Guy | `vendor/parsers/family.ts#L24-L75` | 1 | 2026-10-19 | H |
| C13 | Computed family values at class level 70/100/150/200/300/500: BB 0.11/2.94/6.21/8.42/11.24/14.11; DK 0.33/8.56/17.53/23.31/30.31/37.09; SB 0.12/3.08/6.45/8.70/11.52/14.34; BM and BC 0.03/0.73/1.55/2.11/2.81/3.53; ES 0.06/1.63/3.76/5.45/7.95/11.04 | computed from C10 and C11 | 1 | 2026-10-19 | H |
| C14 | Added talent levels = god + Symbols + achievement 291 + floor(ES family) + companion + ninja mastery 5 + Equinox + Grimoire + Kattlekruk set + Tesseract (cap 5) + Superbit | `vendor/parsers/talents.ts#L331-L400` | 1 | 2026-10-19 | H |
| C15 | Every elite tab has a SYMBOLS_OF_BEYOND talent, `intervalAdd` x1=1 x2=20, read from `talents[3]` | `vendor/data/website-data/talents.json`; `vendor/parsers/talents.ts#L361-L363` | 1 | 2026-10-19 | H |
| C16 | BB family bonus is read as Total Damage (FamBonusQTYs[20]); BM family bonus is read in `getAfkGain` (FamBonusQTYs[50]) | `vendor/parsers/damage.ts#L331`; `vendor/parsers/character.ts#L3239` | 1 | 2026-10-19 | H |
| C17 | DK family bonus feeds Refinery cycle speed (FamBonusQTYs[24]); squire list for Refinery Throttle includes DKs | `vendor/parsers/world-3/refinery.ts#L124`, `#L193` | 1 | 2026-10-19 | H |
| C18 | SB family bonus feeds `minimumTravelTime = round(max(15, 120/(1 + (fam + shiny + legend)/100) - 4*gemShop[8]))` | `vendor/parsers/world-5/sailing.ts#L378-L384` | 1 | 2026-10-19 | H |
| C19 | Purple Tube applies to players at x >= the BC; Green Tube applies when a BC sits to the right of the player; positions from `account.lab.playersCords` | `vendor/parsers/world-4/lab.ts#L335-L350`; `vendor/parsers/talents.ts#L531-L541` | 1 | 2026-10-19 | H |
| C20 | ES Polytheism second god index is `SkillLevels[505] % 10`, used in character parsing and Lab god checks | `vendor/parsers/character.ts#L496-L505`; `vendor/parsers/world-4/lab.ts#L258-L263` | 1 | 2026-10-19 | H |
| C21 | BB cooking: highest Overflowing Ladle over all BBs; Taste Test (id 145) in `relevantTalents`; last BB line character holds kill milestones for Apocalypse Chow | `vendor/parsers/world-4/cooking.ts#L1075-L1090`; `vendor/parsers/talents.ts#L527-L552` | 1 | 2026-10-19 | H |
| C22 | Elite talent lists, ids, formulas and descriptions for the six elite tabs | `vendor/data/website-data/talents.json` tabs Blood_Berserker, Divine_Knight, Siege_Breaker, Beast_Master, Elemental_Sorcerer, Bubonic_Conjuror | 1 | 2026-10-19 | H |
| C23 | `riftInfo` has 70 entries; class gates: DK Orb 180 at levels 8/18/29/43, ES Wormhole 60 at 9/27/44, SB Pirate Flag 75 at 16/22/36/65; levels 60 and 64 need 11 characters; Skill Mastery at 16 | `vendor/data/website-data/shared-data.json` key `riftInfo` | 1 | 2026-10-19 | H |
| C24 | Rift parse: `[currentRift, currentProgress, chars]`; bonus unlocked when `index <= currentRift` | `vendor/parsers/world-4/rift.ts` | 1 | 2026-10-19 | M |
| C25 | Boss4A/B/C: HP 80M / 350M / 2B, defence 600, ExpGiven 12,000, damage 1,000; mini4a Mutated Mush 120M HP, defence 4,500, EXP 2,000,000; earlier research quotes Troll EXP 750K / 30M / 1B from the wiki | `vendor/data/website-data/monsters.json`; docs/research/systems/w4-systems/2026-10-17-rift-sigils-tome-bosses-elite.md | 1 (conflict with 3) | 2026-10-19 | M |
| C26 | Troll drops: coins 1M/5M/20M; Troll Scales 1@13%, 2@30%, 4@50%; Jagged Obol 0.02%/0.08%/0.7%; statues 2.5%; Tripleshot Stamp 0.027%; Blackheart Stamp 0.018%; Cape of Krieg 0.025%; Reset Fragment 15% sub-table | `vendor/data/website-data/monsterDrops.json` Boss4A/B/C | 1 | 2026-10-19 | H |
| C27 | Cards: Massive Troll +6% Kitchen Speed, Chaotic +10% All Skill Efficiency, Blitzkrieg +7% Total Damage, Mutated Mush +6% Cooking EXP; drop chance 0.4% / 0.2% / 0.3% / 20% | `vendor/data/website-data/cards.json`, `monsterDrops.json` | 1 | 2026-10-19 | H |
| C28 | Task `tasks[3][6]` "Begone Troll!" has 10 tiers (defeat; 20 mindgames; flawless; 5 players in order; Chaotic; Chaotic on 6 players; Chaotic within 10 mindgames; Nightmare; Nightmare on 10 players; Nightmare within 5 mindgames with red gloves) | `vendor/data/website-data/tasks.json` (name `Begone_Troll!`) | 1 | 2026-10-19 | H |
| C29 | Troll entry 1/5/60 keys; HP 80M/350M/2B; it never attacks, gives mission minigames (14), failure heals; third challenge done flawlessly gives 5 free attacks later | https://idleon.wiki/wiki/Massive_Troll (rev 2026-10-02) | 2 | 2026-10-19 | L |
| C30 | First kill gives the portal crystal (Crystal4 Magma Geode); Galaxial Amethyst (from Chizoar) opens W4; Magma Geode is absent from the Boss4A drop table | boss-keys dossier [C14]; `vendor/data/website-data/monsterDrops.json` Boss4A | 1 | 2026-10-19 | L |
| C31 | Mutated Mush: Sludge or Radioactive Waste on the Purp Mushroom map; 4-day minimum regrowth in login-days; spawns 1..8 at 4/7/12/19/28/39/52/67 days; drops Key4 50%, Mob Egg 60%, Ladle x3 100%, Card 20%, Time Candy | https://idleon.wiki/wiki/Mutated_Mush (rev 2026-09-30); `vendor/data/website-data/monsterDrops.json` mini4a | 2 / 1 | 2026-10-19 | M |
| C33 | Save `BossInfo[3] = [difficulty, hp, defence]` for Troll; arena map 165; Troll key is Key4 | boss-keys dossier [C11]; `vendor/parsers/parseMaps.ts#L117` | 1 | 2026-10-19 | M |
| C35 | Wiki class pages: DK best talents (1000 Hours Played, Divine Intervention, Orb, Gamer Strength, Symbols) rev 2026-09-03; ES (Wormhole, Chaotic Force, Shared Beliefs, Skill Wiz; Wormhole mobs do not count for Death Note and respawn one mob each) rev 2026-10-07; SB (flag: more than 100 coins gives a guaranteed Plunder mob for 25 coins) rev 2026-09-03; BC (Upload Squared, Essence Transferral; later enhancement for Green Tube) rev 2026-09-03; BM (breeding trio) rev 2026-09-03; BB (inflamed core, cooking talents) rev 2026-09-03 | https://idleon.wiki/wiki/Divine_Knight, /Elemental_Sorcerer, /Siege_Breaker, /Bubonic_Conjuror, /Beast_Master, /Blood_Berserker | 2 | 2026-10-19 | L |
| C37 | Community guide: on arrival in W4 finish Gobo's quest line, push everyone to map 4 and take elite classes, throw everyone in the Lab; BB AFK fighter ("Just AFK with Bloodberserker"); DK instead of ES if damage is a struggle; Voidwalker late W5 or W6 | Idleon Incomplete Guide W4 tab, as quoted in docs/research/systems/w4-systems/2026-10-17-rift-sigils-tome-bosses-elite.md; guide undated, after 2025-11-06 | 4 (carried via 3) | not re-fetched (sheet unreadable by tools) | L |
| C38 | Old ideal roster 1 BB, 2 DK, 1 BM, 2 SB, 1 BC, 2 ES, 1 VW; dated 2023-07-25, stale; Incomplete Guide: "2 DK for construction" | IdleOn Guide Sheet `2PACX-1vSCepYAs6sNDP4iq6MJNAG1pvFXzfC_3IQ7ttt5vfEEKAgQhIk4cQqnLRyeH6UyqDSuP4R-6WQeDmmP`, via the same research file | 4 (carried via 3), pre-patch | not re-fetched | L |
| C39 | ActiveOn: `ELITE_ORDER` = DK, ES, BC, BB, BM, SB; `elitePending` returns nothing unless stage is W4-entry; Goal confidence L; slot plan says never a 2nd Siege Breaker; classes system has only a class-EXP contribution | `packages/engine/src/metapath/gate-chain.ts#L243-L270`; `packages/knowledge/systems/metapath.yaml#L708-L738`, `#L107`; `packages/knowledge/systems/classes.yaml` | 1 | 2026-10-19 | M |
| C40 | Emblem sprites exist for DK, BB, SB, BC, ES, BM, Voidwalker, Maestro and the base classes | `apps/activeon/src/art/sprites/grids/classes.ts` | 1 | 2026-10-19 | M |
| C42 | W5+ class lines: Death Bringer, Royal Guardian, Wind Walker, Arcane Cultist have talent tabs; Spiritual Monk and Infinilyte are unreleased | `vendor/data/website-data/classPromotions.json`; `vendor/parsers/classDefinitions.ts#L16-L26` | 1 | 2026-10-19 | H |
| C22b | Voidwalker tab has 15 talents incl. Enhancement Eclipse, Blood Marrow; Nebulyte4 "Become_a_Voidwalker" gives Vman Nametag; Nebulyte1 is account-wide (40 monsters at 1M plus Deathnote visit) | `vendor/data/website-data/talents.json` tab Voidwalker; `quests.json#L10046-L10170`; `vendor/parsers/world-4/cooking.ts#L788-L860` | 1 | 2026-10-19 | H |
| C22c | Death Bringer, Royal Guardian, Wind Walker, Arcane Cultist have 15-talent tabs; family x3 = 129; WW func is `decayMulti` | `talents.json`; `shared-data.json` `classFamilyBonuses` idx 14/16/29/40 | 1 | 2026-10-19 | H (RG armory cap L) |
| C23b | `riftBonus` rewards at 0-based riftInfo indices 5,10,...,60; Skill_Mastery at 15 and Vial_Mastery at 35 sit on SB Pirate Flag 75 tasks | `vendor/data/website-data/shared-data.json` key `riftInfo` | 1 | 2026-10-19 | H |
| C14b | Super talents: `talentSpelunkArrays[playerId + 12*presetIndex]` adds levels per preset | `vendor/parsers/talents.ts#L336-L350`, `#L402-L424` | 1 | 2026-10-19 | H |
| C11b | Maestro 6/100/29 printer sample; Wizard Star Tab points 1/6/29; Shaman golden foods decayMulti 0.4/100/29 | `shared-data.json` `classFamilyBonuses` idx 3/32/33 | 1 | 2026-10-19 | H |
| C12b | `getAccountFamilyGuy` over DK and SB, excluding ES family levels | `vendor/parsers/family.ts#L24-L51` | 1 | 2026-10-19 | H |
| C21b | Apocalypse Wow/Chow read the last BB-line character's kills; Eclipse multiplier path untraced | `vendor/parsers/talents.ts#L525-L529`; `vendor/parsers/world-4/cooking.ts#L168`, `#L794-L860` | 1 | 2026-10-19 | H / L |
| C7b | Demon Genie drops coins x1660 at 50%; Greenie Gang spawn/respawn rules absent from the wiki | `monsterDrops.json` demonP; https://idleon.wiki/wiki/Eliteus | 1 / 2 | 2026-10-19 | H / L |
