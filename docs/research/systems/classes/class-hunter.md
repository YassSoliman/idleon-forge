# Dossier: Class line Archer -> Hunter -> Beast Master

Topic id `class-hunter`. Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). "Vendor" = `packages/toolbox-parsers/vendor/`. Tier key: 1 game data / Toolbox code, 2 Toolbox dashboard or wiki, 3 Toolbox community builds and earlier project research, 4 community guides. Claims are [C1]..[C50]; each has its Source inline. Confidence H/M/L where sources disagree. No real account data: fixtures are "the W2 test account" / "the W3 test account". Web search budget was exhausted before the Reddit pass (see open questions); wiki pages were read by fetch.

## Archer -> Hunter -> Beast Master (class line)

- **What it is:** the Calm path. Archer (class 19) promotes to Bowman (20, catching) or Hunter (21, trapping); Hunter promotes to Beast Master (25, breeding); Beast Master promotes onward to Wind Walker (W5+) [C1]. Main stat AGI [C6] (H); the accuracy stat is read as STR by `getAccuracy` (agility main maps to strength accuracy) [C6] (M). The Archer line's specialised skills are Smithing, Catching and Trapping; the Hunter owns Trapping [C29][C30].
- **Unlocks:**
  - Archer: Promotheus quest 1 "I'm Ready, Promotion!" needs class Lv 10; quest 2 "Three Right Answers" picks the class (rewards 2 Talent Point Reset Potions) [C2].
  - Hunter/Bowman: Speccius quest 1 "More like 'Sleepius' lmao" (100 Kebab Sticks + 50 Crabby Cakey; rewards 2 two-hour Time Candies, 1 Reset Potion, 5 Reset Fragments), then quest 2 "Specialization Station" picks the subclass (the quest data lists 10,000 coins under its rewards field; whether that is paid or received is unverified, L) [C2][C32]. No level gate in the quest data; tab 3 points are backdated from class Lv 29 [C5].
  - Beast Master: Eliteus (W4 map 154). Quest 1 kill 10 Greenie Gang (rewards field value 750,000,000 coins), quest 2 picks the elite (rewards field value 150,964,823 coins); the coin amounts sit in the quest rewards arrays, not as costs (M); a Hunter can only become Beast Master [C1][C3]. Details in the `elite-classes` dossier.
- **Scope:** talents, presets, attack bar and class level are per character [C4]. Account-wide: Eagle Eye uses the best Hunter on the account [C17]; the family bonuses (best character per class in the line) [C22]; Shining Beacon of Egg and Curviture of the Paw read the best character on the account [C24].
- **Inputs to outputs:** talent points in, bonuses out (growth formulas [C7]). Points come from class levels and skill levels per tab [C5]. Outputs are damage and AFK fight rate [C11][C12][C14], trapping critters/EXP/shiny/efficiency [C16]-[C21], Smithing/anvil [C26], skill efficiency (family bonus) [C22], breeding and AFK gains (Beast Master) [C23][C24].
- **Goals and Milestones:**

| Milestone | Why | Claim |
|---|---|---|
| Class Lv 10, Promotheus | Archer, tab 2 | [C2] |
| Class Lv 15 | second talent preset | [C5] |
| Speccius done | Hunter, tab 3 (points backdated from Lv 29) | [C2][C5] |
| Idle Shooting 50 | 10% AFK fight gain rate (cap 20%) | [C11] |
| Attack talents 25 each | enough for the AFK damage curve (per builds) | [C12][C34] |
| Eagle Eye on the skilling preset | one cast collects/re-sets every character's traps | [C16][C17] |
| Reflective Eyesight / Trapping Lv 10 steps | shiny multiplier raised to a power that grows each 10 trapping levels | [C18] |
| Quickness Boots past 100 | needs Agi Again / Adaptation Revelation (Beast Master) levels | [C8] |
| Class Lv 29 / 69 / 89 | Hunter family bonus starts at 29, Beast Master's at 69, tab 4 at 89 | [C5][C22] |

- **Feeds / fed by:** fed by Smithing level (Veins) [C14], slab (Looty) [C14], Froge critters in storage (Invasive Species) [C19], statues (Straightshot) [C25], obols (Shoeful) [C25]. Feeds Trapping [C16]-[C21], Anvil/Smithing [C26], Breeding and AFK gains [C23][C24], kill-per-kill and Death Note [C23], all skill efficiency [C22].
- **Per-session actions:** swap to the skilling preset, cast Eagle Eye (cooldown 6 s) to collect and re-set all traps, swap back to the fighting preset before AFK [C16][C33]. Cast Strafe before going offline [C34]. Check the attack bar holds the Hunter attacks [C12].
- **AFK Setup implications:** a Hunter AFK-fights on a fighting preset (Idle Shooting, attacks on the bar) or sits on Trapping/Smithing on a skilling preset [C11][C33]. A Beast Master's AFK-gain family bonus helps every character [C22].
- **Min-max by stage:** see the section below.
- **Common mistakes:** (1) Setting traps on the fighting preset: trap efficiency, EXP and shiny chance are fixed at placement [C18][C31]. (2) Idle Shooting at 0 on an AFK-fighting preset [C11]. (3) Points in Featherweight / I See You expecting Library books: both are book-ineligible [C9]. (4) Points in Veins with Smithing below 100 and no plan to level it (value is per 10 Smithing levels, capped at Lv 100) [C14]. (5) Putting points in Strafe's duration when it is only a movement buff [C15]. (6) Following 2021-22 community builds as current [C34]. Detectable from `flatTalents[*].baseLevel`, `talentsLoadout`, `selectedTalentPreset`, `afkType` [C46].
- **Save and Toolbox fields:** see the catalogue (each line names the path) and [C46].
- **Sources:** per-claim in the register at the end.

## Mechanics catalogue (W1 to W4; W5+ one line each)

Notation: `char` = parsed `characters[i]`; talent rows are in `char.flatTalents[]` as `{name, skillIndex, level, baseLevel, maxLevel, funcX, x1, x2, funcY, y1, y2, ...}`; `getTalentBonus(char.flatTalents, name)` = growth(funcX, level, x1, x2) and is 0 for an unlearned talent [C7]. "L" is talent level (includes added levels [C10]). Values below are computed from `data/website-data/talents.json` with `utility/wiki/growth.mjs` [C7].

### M1. Class tree and promotions
- **Rule:** see [C1][C2][C3]. Tab lists: Archer = Calm_Basics+Archer; Hunter = +Hunter; Beast Master = +Beast_Master (`talentPagesMap`) [C1][C4].
- **Fields:** `char.classIndex`, `char.class` (character.ts L292-293); quests `Promotheus1/2`, `Speccius1/2`, `Eliteus1/2` (quests.ts) [C2].

### M2. Talent points and presets
- **Rule:** per tab 3x(Lv-1), 3x(Lv-6), 3x(Lv-29), 3x min(Lv-89,100)+... plus skill-level and item sources; two presets from Lv 15 [C5]. Account State already computes exact points (`CharacterTalents.active.talentPoints`) [C47].
- **Fields:** `char.talents`/`flatTalents` (active preset), `char.talentPreset.{talents,flatTalents}` (other), `char.selectedTalentPreset`, `char.talentsLoadout` (active attack bar) [C46].

### M3. Max levels and added levels
- **Rule:** base cap 100; `maxLevel` comes straight from the save (`SkillLevelsMAX`), Toolbox does not compute it [C8]. Hunter-line raisers: Agi Again (Hunter, +1 max to Quickness Boots per level), Adaptation Revelation (Beast Master, +1 once), Visibility Vessels (+1 max to I See You per "Archer or Bust" bubble level, up to its cap) [C8]. Library books raise others (W3) but exclude ids 10-12, 23, 75, 79, 86, 87, 266 (Featherweight), 267 (I See You), 446, 447 [C9].
- **Added levels** (account-wide into every learned talent): god, Symbols of Beyond, family, achievement, companion, equinox, grimoire, Kattlekruk set, tesseract (capped 5), ninja mastery, superbit, plus 50 (+) super-talent levels on chosen talents [C10]. Banned from added levels: ids 49-59, 149, 374 (Symbols of Beyond ~G), 505, 539 and all > 614 [C10].
- **Fields:** `flatTalents[].baseLevel` (bought), `.level` (with added), `.maxLevel`, `char.addedLevels`, `char.maxBookLv` [C8][C10].

### M4. Tab 1 (Calm Basics) talents [C4]
| id | Talent | Formula (funcX x1 x2) | Notes |
|---|---|---|---|
| 0 | Health Booster | add 1, 0.15 (quadratic) | L100 = +857 HP |
| 1 | Mana Booster | add 1, 0.1 | MP for attacks |
| 8 | Star Player | add 1, 0 | +1 star point per level |
| 9 | Bucklered Up | decay 40, 60 | total DEF |
| 5 | Sharpened Axe | add 0.4, 0 | +0.4 base Weapon Power per level (L100 = 40) |
| 6 | Gilded Sword | add 1.5, 0 | +1.5% damage per level (L100 = 150%) |
| 10/11/12/13 | Fist of Rage / Quickness Boots / Book of the Wise / Lucky Clover | add 1, 0 | +1 base STR/AGI/WIS/LUK per level |
| 263 | Elusive Efficiency | add 1, 0.02 | efficiency of specialised skills; superlinear (L50 = 75.5%, L100 = 201%) |
| 266 | Featherweight | decay 25, 40 | move speed %, cap 25; max raised by Velocity Vessels (Bowman); Library-ineligible |
| 267 | I See You | decay 27, 50 | crit chance %, cap 27; max raised by Visibility Vessels (Hunter) |
| 268 | Idle Shooting | decay 20, 50 | AFK fighting gain %, cap 20 (L50 = 10) |
| 269 | Broken Time | decay 100, 75 | production speed in town skills (anvil, alchemy); Calm_Basics, not Hunter-line [C28] |
- **Consumers in Toolbox:** Gilded Sword and Sharpened Axe (damage.ts, `getBaseDamage`), Idle Shooting (character.ts L3370, `getAfkGain`), I See You (damage.ts L1214), Featherweight (character.ts L3194, move speed), Broken Time (anvil.ts L185, alchemy.ts L725), Elusive Efficiency (efficiency.ts L529, L593), Health/Mana Booster (damage.ts) [C11][C14][C15][C21][C28].
- **Fields:** `getTalentBonus(char.flatTalents, 'GILDED_SWORD')` etc. [C46].

### M5. Archer tab (Archer talents, ids 270-284, 265)
| id | Talent | Formula | Notes |
|---|---|---|---|
| 270 | Piercing Arrow | bigBase 125, 2 (%dmg); mobs 5 + floor(L/50) | attack; cd 5 s, mana 5; K 1.15 D 1.19 |
| 271 | Kung Fu Kick | bigBase 25, 1; knockback 60 + 2L | attack; cd 7 s; K 1 D 1.15 |
| 272 | Hema Overdrive | add 0.4, 0.01 | +% max HP and MP |
| 273 | Strafe | bigBase 5, 0.3 (% move speed); minutes 2 + floor(L/15) | buff, cd 30 s; not an AFK-kill talent |
| 274 | Have Another! | decay 120, 40 | % chance of an extra arrow; AFK kill math only |
| 284 | Veins of the Infernal | decay 35, 50 (% per 10 Smithing Lv, Smithing capped at 100) | damage multiplier (see M8) |
| 276 | Garb of Un'agi'ng Quality | add 1.5, 0 | equipment gives +1.5% more AGI per level (L100 = 150%) |
| 277 | High Polymer Limbs | add 1, 0 | +1% to the effect of Weapon Power on damage per level |
| 278 | Sanic Speed | add 1, 0 | +1 base AGI per level |
| 279 | Robbinghood | decay 40, 65 | drop rate % |
| 280 | Smeltin' Erryday | decay 50, 80; seconds 1 + floor(L/60) | kill chance for instant forge seconds |
| 281 | Acme Anvil | intervalAdd 1, 15 | +1 anvil production point, plus 1 + floor(L/15) per 10 Smithing Lv |
| 282 | Yea I Already Know | decay 5, 90; cap 5 + floor(L/10) | start EXP per 250 AGI on specialised skill level-up |
| 283 | Godly Creation | decay 50, 75 | chance of a special bonus on anvil-crafted equipment |
| 265 | Focused Soul | add 1, 0 | +1% EXP for all specialised skills per level |
- **Consumers in Toolbox:** Piercing/Kung Fu via the attack-bar math [C12]; Have Another! [C12]; Veins damage.ts L676-679; High Polymer Limbs damage.ts L893; Hema Overdrive damage.ts L1059/L1088; Strafe character.ts L3197 (move speed when the buff is active); Robbinghood character.ts L2386; Acme Anvil anvil.ts L86; Focused Soul character.ts L701/L860/L919 and anvil.ts L204 [C14][C15][C26][C27]. **Not computed by Toolbox** (no consumer found): Smeltin' Erryday, Godly Creation, Yea I Already Know, Garb of Un'agi'ng Quality, Sanic Speed as a talent term (its +AGI reaches `char.stats.agility` via the game's save) [C26].

### M6. Hunter tab (ids 300-313, 291, 293, 299)
| id | Talent | Formula | Notes |
|---|---|---|---|
| 300 | 360 Noscope | bigBase 225, 3 (%dmg split among hits) | attack; cd 20 s, mana 25, range 200; K 1.2 D 1.3 |
| 301 | Bear Trap | traps 2 + floor(L/30); bigBase 150, 2 (%dmg) | attack; cd 9 s, mana 30; K 1.2 D 1.15 |
| 302 | Uwu Rawrrr | decay 55, 60 (seconds faster respawn) | buff cd 120 s; K 1 D 1 (no AFK-kill effect in Toolbox math) |
| 303 | Stop Right There | immobilise radius 150 + 1.5L px; seconds 4 + floor(L/20) | cd 60 s; used for W3 Tower Defence per builds |
| 304 | Have Another... Again! | decay 120, 40 | stacks with Have Another! |
| 305 | Looty Mc Shooty | decay 36, 100 (% damage per 50 items found) | see M8 |
| 291 | Shoeful of Obol | decay 135, 80 | obols give +% more AGI |
| 307 | Straightshot Statues | decay 100, 50 | Speed, Anvil and Bullseye statues give +% more bonus (statues.ts L156-159) |
| 293 | Agi Again | add 1, 0 | +1 max level of Quickness Boots per level |
| 309 | Visibility Vessels | add 1, 0 | +1 max level of I See You per "Archer or Bust" bubble level, up to its cap |
| 310 | Eagle Eye | bigBase 50, 0.25 (critters %); y: bigBase 40, 0.2 (EXP %) | see M9 |
| 311 | Invasive Species | decay 30, 80 | see M10 |
| 312 | Shroom Bait | add 1, 0 | +% Trapping EXP for self |
| 313 | Reflective Eyesight | decayMulti 2, 100 | shiny multiplier, repeats every 10 Trapping Lv (M11) [C57] |
| 303 notes | see [C51]-[C53], [C55] | | |
| 299 | Previous Points | add 1, 0 | +1 tab-2 (Archer) talent point per level |

### M7. AFK attack-bar maths (what the attack talents are for)
- **Rule:** each talent on the attack bar with `AFKactivity == 0` and K or D != 1 multiplies the AFK kill factors by `D or K x (1 + min(1, L/(L+100)))`; K total clamped [1, 2.2] elsewhere; the Idle bonuses, `Have Another!` and `Have Another... Again!` are added into D; star talent Attacks on Simmer and the All For Kill bubble each cap at +25% [C12].
- **Per-talent K/D (game data):** Piercing Arrow 1.15/1.19, Kung Fu Kick 1/1.15, Bear Trap 1.2/1.15, 360 Noscope 1.2/1.3, Uwu Rawrrr 1/1, Stop Right There 1/1; Beast Master: Ballista 1.1/1.3, Boar Rush 1.1/1.2, Whale Wallop 1.2/1.1, Nacho Party 1.1/1.1. Strafe (AFKactivity -1), Eagle Eye and Arena Spirit (-2) are excluded [C13].
- **Gap flag:** Toolbox sums only Have Another! and Have Another... Again! into D; the Beast Master clone "Have Yet Anotha One" (id 364) has no consumer, so Toolbox likely under-reports a Beast Master's AFK damage (M, my grep of damage.ts L1303-1308) [C12].
- **Fields:** `char.talentsLoadout[]` (rows with `K`, `D`, `AFKactivity`, `baseLevel`) [C46].

### M8. Hunter-line damage terms (Toolbox `getMaxDamage`, damage.ts)
- **Veins of the Infernal:** multiplier `1 + V x (min(100, Smithing Lv)/10)/100`, V = decay 35/50. At L100 V = 23.3%, at Smithing 100 that is +233% damage [C14].
- **Looty Mc Shooty:** `+ (36 x L/(L+100)) x items / 50` % damage, items = slab items found minus Gem/Cards entries (with a Toolbox-reproduced game quirk about royal statues). At L100 that is 18% per 50 items [C14].
- **High Polymer Limbs:** raises the Weapon Power effect on damage by `L`% [C14]. **Sharpened Axe** adds base Weapon Power; **Gilded Sword** is a straight damage %. Both are linear and never saturate [C7].
- **I See You:** crit chance %, decay 27/50 [C14]. Hit chance uses accuracy = STR for Archers: 100% at accuracy = 1.5 x Defence [C6].
- **Fields:** `char.skillsInfo.smithing.level`, `account.looty.lootyRaw`, `char.stats.strength/agility` (cached; stale for non-played characters per the earlier research) [C6][C46].

### M9. Eagle Eye (talent 310)
- **Rule:** cast (buff, cd 6 s, mana 2) to collect and re-set every character's traps. Critters collected = max(50, Eagle Eye + vial Trapovision + compass 42 + Magnesium atom x days + Dementia set + palette 12)% of normal; the EXP share each placer gets = max(40, min(Eagle Eye EXP, 99))% [C16][C17][C45]. Values: critters 62.5% at L50, 75% at L100, 85% at L140, 100% at L200; EXP 50/60/68/80% [C16].
- **Class gating in Toolbox:** if the viewed character is a Hunter-line character it uses the best Hunter's talent; otherwise the best across Hunters or the level-0 value [C17].
- **Fields:** `calcCrittersBonus` (traps.ts L122-156), `char.flatTalents[EAGLE_EYE]`, placed traps `char.PldTraps` -> `getTraps` [C17].

### M10. Trapping efficiency terms owned by the line
- **Invasive Species:** efficiency multiplier `1 + I x (Helium atom + lavaLog(Froge critters in storage))/100`, I = decay 30/80 (L100 = 16.7%) [C19].
- **Elusive Efficiency:** additive % (also applies to Catching) [C21]. **Shroom Bait:** +L% Trapping EXP for the placer only; **Focused Soul** +L% for all specialised skills [C20].
- **Skill Ambidexterity (Beast Master):** makes AGI count `x(1 + A/100)` in Catching and Trapping efficiency; A = decay 60/80 (+AGI, intervalAdd 1/2) [C23].
- **Fields:** efficiency.ts L510-523, L576-600; character.ts L918-945 [C19][C20][C23].

### M11. Shiny critters (Reflective Eyesight)
- **Rule:** shiny placement multiplier = stamps x task x bubble x vials x `max(1, R)^(1 + floor(Trapping Lv/10))`, R = 1 + 2L/(L+100) (L100 = x2.0, so Trapping 50 gives x2^6 = 64). Archer-line characters get the class multiplier on the "Cuz I Catch Em All" bubble. The chance is snapshotted when the trap is placed, then food, card, minigame and arcade bonuses apply when it is opened [C18][C47]. Chance >= 100% is guaranteed shiny; surplus buys nothing (qty needs Shiny Snitch prayer) [C18][C31].
- **Fields:** `getShinyChance` (traps.ts L178-250) [C18].

### M12. Smithing and anvil line
- **Rule:** Archer-line is the Smithing class; Acme Anvil adds anvil production points (+1 base then per 10 Smithing Lv); Broken Time and Focused Soul feed anvil speed and EXP; Veins reads Smithing Lv for damage [C14][C26][C28].
- **Fields:** `getAnvil` (anvil.ts L84-95), `calcAnvilExp` (L203) [C26].

### M13. Family bonuses (account-wide)
- **Archer:** +AGI, intervalAdd x1 1 / x2 5, from class Lv 9 (L30 +5, L100 +19, L200 +39) [C22].
- **Hunter:** +% efficiency for all skills, decay 30/100 from Lv 29 (Lv50 5.2%, Lv100 12.5%, Lv200 18.9%, Lv300 21.9%); consumer `getAllEffBreakdown` (efficiency.ts L145) [C22].
- **Beast Master:** +% all skill AFK gains, decay 5/180 from Lv 69 (Lv100 0.73%, Lv200 2.1%, Lv500 3.5%); consumer `getAfkGain` (character.ts L3239) [C22].
- **Walk:** best value per class across characters; THE_FAMILY_GUY (Beast Master tab 4) multiplies only for the played character [C22][C23].
- **Fields:** `char.familyBonuses[className]` (family.ts) [C22].

### M14. Beast Master tab 4 (W4, ids 315-374) [C4][C23][C24]
| id | Talent | Formula | Notes |
|---|---|---|---|
| 315 | Ballista | bigBase 75, 1.25; mobs 4 + floor(L/30) | attack cd 15 s, mana 150 |
| 361 | Boar Rush | bigBase 75, 1.5; HP 6 + floor(L/20) | summon cd 25 s |
| 362 | Whale Wallop | bigBase 30, 1; whales 7 + floor(L/17) | summon cd 45 s, mana 250 |
| 363 | Nacho Party | bigBase 50, 1; chips/min 15 + floor(L/13) | summon cd 30 s |
| 364 | Have Yet Anotha One | decay 120, 40 | extra arrow; see M7 gap |
| 365 | Animalistic Ferocity | decay 8, 100 | +Weapon Power per power of 10 Mob Power of the first stored mob (damage.ts L1152, L1160) |
| 366 | Stacked Skulls | decay 40, 100 | +% kill per kill per 1000 AGI; switched off from W7 (damage.ts L1541-1546) |
| 367 | Skill Ambidexterity | decay 60, 80 (+ AGI intervalAdd 1/2) | AGI efficiency impact |
| 368 | Adaptation Revelation | decay 15, 100 (+AGI %); +1 max Quickness Boots | |
| 144 | The Family Guy | decay 40, 100 | larger family bonuses, best on account (family.ts) |
| 370 | Arena Spirit | cd 86400 s; 5 + floor(L/17) minutes unlimited Mob Arena; passive mob dmg decay 30/100 | in Toolbox `relevantTalents` |
| 371 | I Dream of Peace and Egg | decay 100, 80 | % chance of 3 eggs per 10 h of AFK claims, up to 100 h; **not parsed by Toolbox** (text only) |
| 372 | Shining Beacon of Egg | decay 100, 100 | +% Breeding EXP; best character on account (character.ts L1071) |
| 373 | Curviture of the Paw | decayMulti 1.2, 100 | x egg Mob Power on hatch, capped x2.1 in code (breeding.ts L492-496) |
| 374 | Symbols of Beyond ~G | intervalAdd 1, 20 | +1 level to all talents above 1 per 20 levels; itself banned from added levels |
- **W5+ extension:** Beast Master promotes to Wind Walker (class 29 in game; Compass talents, `parsers/class-specific/compass.ts`) [C1][C48].

### M15. Wind Walker and W5+ (one line each)
- Wind Walker tab exists in data (`Wind_Walker`), releases W5+ systems (Compass, Tempest); out of W1-4 scope [C48].
- Arena Spirit, Stacked Skulls, Symbols of Beyond keep scaling into W5-W7 (Stacked Skulls diminished from W7) [C25].

## Min-max by stage

Orders are priority lists, first = spend first. Where a community build gives levels they are written in brackets. All builds are Toolbox community builds (tier 3) unless marked; "Community Guide" authored builds were imported 2026-04-26 from the old curated list (version tags 1.23/1.40b, i.e. the 2021-22 game) but their text was last updated 2026-10-02..19, so treat them as M confidence [C34].

**W1 early/mid (Archer, class Lv 10 to ~Lv 29, before Speccius):**
1. Tab 1: Sharpened Axe and Gilded Sword to 50 each, kept within ~10 levels of each other (Gilded is 1.5% per level, linear) [C34: rbLex2, tier 4, 2026-06-12].
2. Fist of Rage only as far as needed to reach the farthest killable monster (STR is the Archer's accuracy stat) [C6][C34].
3. Tab 2: High Polymer Limbs 50 (past 50 with spare points), Piercing Arrow 20 and Kung Fu Kick 20, 1 point in Strafe (cast before going AFK), then Have Another! 10; Veins 1 (rbLex2). The earlier research and the Bowman build agree on 1 point per attack first [C34][C49].
4. Idle Shooting 50 as soon as Gilded/Axe are in place (AFK gain 10% of a 20% cap) [C11][C33].
5. Goal of this stage: reach Crabcakes to take Speccius's quest and choose Hunter or Bowman. Hunter if the account wants Trapping and later Breeding; Bowman for Catching and Sailing [C30][C34].

**W2 (Hunter, tab 3 open; class Lv ~30-60):**
- Fighting preset (AFK build "Hunter / AFK ~50", 9vjYrC): Gilded and Axe 25, Idle Shooting 50, Fist of Rage for accuracy; Piercing Arrow 25, Kung Fu Kick 25, Strafe 1, High Polymer Limbs 50, Veins 50; Hunter tab: 360 Noscope 30, Bear Trap 30, Looty Mc Shooty 20 [C34, 2026-10-02, Community Guide].
- "~70" build (aYGzFD): Gilded and Axe 75, High Polymer Limbs 100, Strafe 25, Looty 100, 360 Noscope 25, Bear Trap 25, Have Another... Again! 25, spare points into Eagle Eye [C34, 2026-10-06].
- Skilling preset (trapping): Elusive Efficiency to 100, Quickness Boots up to 200 using Agi Again after the trapping talents are done; Focused Soul, Garb of Un'agi'ng 100, Sanic Speed 100, Acme Anvil, Yea I Already Know, Godly Creation; Eagle Eye 100, Invasive Species 100, Shroom Bait 100, Reflective Eyesight 100 ("Hunter Trapping ~100", vh8Z0k) [C34, 2026-10-15].
- Smithing: raise Smithing level because Veins pays +233% at Smithing 100 (L100); the build text says to produce 2-3x thread to level it [C14][C34].

**W3 (Hunter, Library open; Trapping online):**
- Always cast Eagle Eye from the skilling preset, then return to the damage preset: placement fixes efficiency, EXP and shiny chance [C18][C31][C33].
- Push Eagle Eye after the other trapping talents are at 100; build XVxy5U says "up to 140" [C33]. Poison Tincture vial, compass and atom raise the collect rate past what the talent shows [C17][C34].
- Priority within the trapping talents per XVxy5U: Eagle Eye -> Invasive Species -> Shroom Bait -> Reflective Eyesight (100 each first, then push Eagle Eye) [C33]. By the formulas Reflective Eyesight gives the largest per-point jump once Trapping Lv 10+ (power law) [C18].
- Stop Right There is the Hunter's Tower Defence talent (used in BigRav01's skilling builds) [C35].
- Damage preset core: Looty Mc Shooty, 25 each in 360 Noscope and Bear Trap, Agi Again, Straightshot Statues, Eagle Eye on the damage preset only up to 140 [C33].

**W4 (Hunter, Beast Master after Eliteus):**
- AFK fighting (BigRav01 Beast Master AFK, MDGrBz, 2026-10-13): tab 1 Gilded > Axe > Idle Shooting; Fist of Rage as needed; tab 2 High Polymer Limbs > Veins, Piercing Arrow 1, Strafe 1, Have Another! 14; tab 3 Looty > Bear Trap > Uwu Rawrrr > Have Another... Again! 14 > 360 Noscope; tab 4 Whale Wallop max, Ballista/Boar Rush/Nacho Party 1, Have Yet Anotha One 14, Symbols of Beyond ~G 1. Skill bar order: Uwu Rawrrr, Whale Wallop, Bear Trap, Piercing Arrow, Ballista, Nacho Party, Boar Rush, Strafe [C35].
- Skilling (BigRav01, 3gARZB): tab 4 for trapping: Symbols of Beyond ~G, Arena Spirit 1; for breeding: Shining Beacon of Egg, Curviture of the Paw, The Family Guy, Skill Ambidexterity at max [C35].
- Sir_Grimtide-style elite mapping (confidence L) from the earlier research: Hunter -> Beast Master = Breeding role [C49]. The Elite Class Swap may no longer be sold, so the subclass decides the elite [C49].
- Attack-bar rule for AFK builds: 25 points per attack talent is "enough to reach damage cap" (build text); K clamp 2.2 explains why [C12][C34].

**Per class note (Hunter vs Bowman, early choice):** Hunter focuses on single-target and mob hunting (Uwu Rawrrr respawn), Bowman on multi-strike; Hunter owns Trapping, Bowman Catching [C30]. Bowman-only talents (Speedna, Woah That Was Fast) have no Hunter equivalent [C4].

## Verification outcome (2026-10-19 revision)

No claim was refuted by either lens, so none was removed or marked Disputed. Wording was corrected where the lenses flagged it (coin values are rewards-field values, Straightshot fallback, Acme formula, Eagle Eye non-Hunter max rule, tab 4/5 point formulas, resource hit curve, Broken Time tab). Unverifiable claims (wiki, external builds, prior branch) carry confidence L. New claims [C51]-[C62] cover the verifiers' missed mechanics.

## Code vs wiki vs community

- **Shiny timing:** Toolbox code and the wiki (Trapping) say the shiny chance, efficiency and EXP are fixed when the trap is placed [C18][C31]. The 2024 Fibster sheet (carried from the earlier research, tier 3, pre-patch, M) said shiny odds apply when you claim. Code wins (H) [C36].
- **Eagle Eye above 100%:** the talent shows at most ~100% critters at L200, but guides say vial, compass and atom sources let collection exceed 100%. Code agrees: the sum of sources is floored at 50 and not capped [C17][C34] (H).
- **Tab 4 gate:** earlier wiki said Lv 50; code says Lv 89 [C5] (code wins, H).
- **Hunter build recency:** the Toolbox list labels the Hunter builds "Community Guide" with 2021-22 version tags but recent update dates; only XVxy5U (2026-10-19) is clearly current, and it has 0 likes [C33][C34] (M).
- **Have Another family:** code counts only two of three Have Another variants in AFK D [C12] (M, possible Toolbox gap).

## Claims register

[C1] Class tree: Archer 19 promotes to Bowman 20 and Hunter 21; Hunter 21 to Beast_Master 25; Beast_Master to Wind_Walker; tabs Calm_Basics, Archer, Hunter, Beast_Master. Source: `vendor/data/website-data/classPromotions.json` (Toolbox @6c37e3d). Tier 1. Verified 2026-10-19, game 2.3.540. Confidence H (re-verified by both lenses, 2026-10-19).
[C2] Promotheus quest 1 needs Lv 10, quest 2 picks class (2 Reset Potions); Speccius 1 = 100 Kebab Sticks + 50 Crabby Cakey (rewards 2 Time Candy 2 HR, 1 Reset Potion, 5 Reset Fragments), Speccius 2 picks subclass (10,000 coins). Source: `vendor/data/website-data/quests.json` Promotheus/Speccius. Tier 1. 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C3] Eliteus quest 1 defeat 10 Greenie Gang (rewards field 750,000,000 coins), quest 2 select elite (rewards field 150,964,823 coins); coin values are in the rewards arrays, cost direction unverified (confidence M). Source: `vendor/data/website-data/quests.json` Eliteus. Tier 1. 2026-10-19.
[C4] Each tab has 15 talents: Calm_Basics, Archer, Hunter, Beast_Master; skillIndex and formulas as in the catalogue. Source: `vendor/data/website-data/talents.json`. Tier 1. 2026-10-19. Confidence H (re-verified by both lenses, 2026-10-19).
[C5] Points per tab: 3x(Lv-1) tab 1, 3x(Lv-6) tab 2, 3x(Lv-29) tab 3, tab 4 from Lv 89 (3x min(Lv-89,100), then 2 per level after Lv 189), tab 5 (star-adjacent) from Lv 249 as 3x(Lv-249); presets from Lv 15; many bonus sources (stamps, vials, merit, Previous Points id 299) add to these. Confidence H for the tab formulas (gamedata lens read `packages/account-state/src/talent-points-formula.ts`). Source: earlier research docs/research/systems/2026-10-17-character-builds.md (game client `_customBlock_TotalTalentPoints`), origin/research/character-builds. Tier 3 (derived from tier-1 client code), game v1.23 era; Account State computes exact totals (ADR 0010, `packages/account-state/src/talent-types.ts`). 2026-10-19.
[C6] Archer line main stat agility; accuracy stat STR; hit chance 100% at accuracy 1.5x Defence on Monster targets (curve `floor(min(100*(0.95r-0.425),100))`, gate r>=0.5). Resource targets (Ore, Tree, Fish, Bug; Catching, Trapping-adjacent) use a different curve `6*(r-0.174)/(r-0.17+9.04)*100`, gate r>=0.25, 100% at 1.98x Defence. Confidence H for AGI main stat and monster curve, M for 'accuracy stat STR'. Source: `vendor/parsers/talents.ts#L99-L106` (mainStatMap); `vendor/utility/hit-chance.mjs`; earlier research stat section. Tier 1. 2026-10-19. Confidence H.
[C7] Growth curves: add (x2=0 linear; else quadratic), decay x1*L/(L+x2), decayMulti 1+decay, bigBase x1+x2*L, intervalAdd x1+floor(L/x2). Source: `vendor/utility/wiki/growth.mjs#L11-L58`. Tier 1. 2026-10-19. Confidence H (re-verified by both lenses, 2026-10-19).
[C8] maxLevel is read from the save `SkillLevelsMAX`, not computed; Agi Again +1 max Quickness Boots per level, Adaptation Revelation +1, Visibility Vessels +1 max I See You per Archer-or-Bust bubble level. Confidence H. Note: no parser computes these caps; they come from the save. Source: `vendor/parsers/character.ts#L416-L419`; talents.json texts for ids 293, 309, 368. Tier 1. 2026-10-19.
[C9] Talent Book Library excludes ids 10, 11, 12, 23, 75, 79, 86, 87, 266, 267, 446, 447 and anything >= 615. Source: `vendor/parsers/talents.ts#L445-L452` (BOOK_INELIGIBLE_INDICES). Tier 1. 2026-10-19. Confidence H (re-verified by both lenses, 2026-10-19).
[C10] Added-level sources and bans: god, Symbols, family, achievement, companion, equinox, grimoire, Kattlekruk, tesseract cap 5, ninja mastery, superbit; banned ids 49-59, 149, 374, 505, 539, >614. Source: `vendor/parsers/talents.ts#L331-L385`; `vendor/utility/talentBans.js`. Tier 1. 2026-10-19. Confidence H (re-verified by both lenses, 2026-10-19).
[C11] Idle Shooting (id 268) decay 20/50 = AFK fighting gain %, read in getAfkGain; L50 = 10%. Source: `vendor/parsers/character.ts#L3364-L3372`; talents.json. Tier 1. 2026-10-19. Confidence H (re-verified by both lenses, 2026-10-19).
[C12] AFK attack math: loadout talents with AFKactivity 0 multiply by K/D x (1+min(1,L/(L+100))); Have Another! and Have Another... Again! added to D; Attacks on Simmer and All For Kill each capped 25; Have Yet Anotha One (364) not read. Confidence H for the read talents and caps; Have Yet Anotha One having no parser consumer confirmed by the gamedata lens (H); whether that is a Toolbox gap is M. Source: `vendor/parsers/damage.ts#L1288-L1308`. Tier 1. 2026-10-19.
[C13] K/D values: Piercing 1.15/1.19, Kung Fu 1/1.15, Bear Trap 1.2/1.15, 360 Noscope 1.2/1.3, Ballista 1.1/1.3, Boar Rush 1.1/1.2, Whale Wallop 1.2/1.1, Nacho 1.1/1.1; Strafe AFKactivity -1, Eagle Eye and Arena Spirit -2. Source: talents.json. Tier 1. 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C14] Damage terms: Veins `1+V*(min(100,Smithing)/10)/100`; Looty `36*L/(L+100)*items/50`; High Polymer Limbs raises Weapon Power effect; I See You crit. Source: `vendor/parsers/damage.ts#L676-L679`, `#L717-L721`, `#L812-L821`, `#L893`, `#L1214`. Tier 1. 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C15] Strafe is a movement buff (5+0.3L %, 2+floor(L/15) minutes, cd 30 s) read via active buffs; Featherweight adds move speed. Source: `vendor/parsers/character.ts#L3190-L3200`; talents.json. Tier 1. 2026-10-19. Confidence H (re-verified by both lenses, 2026-10-19).
[C16] Eagle Eye: bigBase 50/0.25 critters %, y bigBase 40/0.2 EXP %, cd 6 s, mana 2; Confidence H (talents.json id 310, tier 1). Wiki text "Collect & set all traps, but only get {50 + 0.25 per level}% critters" is a separate tier 2 source and was not fetched by the verifiers (L). Source: talents.json id 310 (tier 1); https://idleon.wiki/wiki/Hunter (edited 2026-09-03, tier 2). 2026-10-19.
[C17] Collect rate = max(floor 50, Eagle Eye + Trapovision vial + compass + Magnesium atom + Dementia set + palette); EXP floor 40, talent EXP share capped 99; non-Hunter viewers use talentBonus = max(unlearned level-0 Eagle Eye value, best Hunter's), capped 99 for EXP. Confidence H. Source: `vendor/parsers/world-3/traps.ts#L103-L156`. Tier 1. 2026-10-19.
[C18] Shiny multiplier: stamps x task x Cuz I Catch Em All bubble (Archer class multiplier) x vials x max(1,R)^(1+floor(TrapLv/10)); placement snapshot, then open-time bonuses; >=100% guaranteed. Source: `vendor/parsers/world-3/traps.ts#L178-L262`. Tier 1. 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C19] Invasive Species multiplier `1 + I*(Helium atom + lavaLog(Froge critters in storage))/100`. Source: `vendor/parsers/efficiency.ts#L590-L592`. Tier 1. 2026-10-19. Confidence H (re-verified by both lenses, 2026-10-19).
[C20] Shroom Bait +L% Trapping EXP (placer), Focused Soul +L% specialised skill EXP. Source: `vendor/parsers/character.ts#L918-L945`; talents.json. Tier 1. 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C21] Elusive Efficiency (add 1/0.02) applies to Catching and Trapping efficiency. Source: `vendor/parsers/efficiency.ts#L529`, `#L593`. Tier 1. 2026-10-19. Confidence H (re-verified by both lenses, 2026-10-19).
[C22] Family bonuses: Archer +AGI (intervalAdd 1/5 from Lv 9), Hunter +% all-skill efficiency (decay 30/100 from Lv 29, efficiency.ts L145), Beast Master +% all skill AFK gains (decay 5/180 from Lv 69, character.ts L3239); best per class; Family Guy only played character. Source: `vendor/data/website-data/shared-data.json` classFamilyBonuses 19/21/25; `vendor/parsers/family.ts#L34-L66`. Tier 1. 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C23] Beast Master tab 4 effects: Skill Ambidexterity in Catching/Trapping efficiency, Stacked Skulls kill per kill (off from W7), Animalistic Ferocity Weapon Power per stored mob power, Family Guy. Source: `vendor/parsers/efficiency.ts#L510-L523`, `L576`; `damage.ts#L1152`, `#L1541-L1546`; family.ts. Tier 1. 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C24] Shining Beacon of Egg (best character, breeding EXP) and Curviture of the Paw (x egg power, capped 2.1); I Dream of Peace and Egg has no parser consumer. Source: `vendor/parsers/character.ts#L1071`; `vendor/parsers/world-4/breeding.ts#L488-L494`; grep of vendor/parsers found no I_DREAM reference. Tier 1. 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C25] Straightshot Statues boosts Bullseye, and Speed and Anvil statues (these two fall back to the Mage Shwifty talent when Straightshot is absent);  Shoeful of Obol +% AGI from obols (no consumer found in parsers). Source: `vendor/parsers/world-1/statues.ts#L150-L160`; talents.json. Tier 1. 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C26] Acme Anvil adds anvil points = own talent level + intervalAdd bonus x floor(Smithing level/10) (H); Smeltin' Erryday, Godly Creation, Yea I Already Know, Garb of Un'agi'ng Quality have no Toolbox consumer (the other four names have no grep hit in vendor/parsers, H). Source: `vendor/parsers/world-1/anvil.ts#L84-L95`; grep over `vendor/parsers`. Tier 1. 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C27] Robbinghood decay 40/65 drop rate, read in drop-rate calc. Source: `vendor/parsers/character.ts#L2386`. Tier 1. 2026-10-19. Confidence H (re-verified by both lenses, 2026-10-19).
[C28] Broken Time (a Calm_Basics talent, not Hunter-line) decay 100/75 production speed for town skills (anvil, alchemy). Source: `vendor/parsers/world-1/anvil.ts#L185`; `world-2/alchemy.ts#L725`. Tier 1. 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C29] Wiki: Hunter is an Archer subclass specialising in Trapping and Smithing, evolves to Beast Master; 15 talents. Source: https://idleon.wiki/wiki/Hunter, edited 2026-09-03. Tier 2. 2026-10-19. Confidence L (unverifiable by the data lenses: external page or branch not re-fetched).
[C30] Wiki Classes: Bowman = Catching, multi-strike; Hunter = Trapping, single-target and mob hunting with Uwu Rawrrr; Beast Master = Breeding with summons; Siege Breaker = Sailing. Source: https://idleon.wiki/wiki/Classes, edited 2026-10-13. Tier 2. 2026-10-19. Confidence L (unverifiable by the data lenses: external page or branch not re-fetched).
[C31] Wiki Trapping: trapping efficiency, EXP and shiny chance are saved when the trap is placed; Shiny Snitch is the only way to raise shiny quantity per trap; Eagle Eye re-places traps without removing them. Source: https://idleon.wiki/wiki/Trapping (page date not shown on fetch; KB records 2026-10-07). Tier 2. 2026-10-19. Confidence M (traps.ts placement-snapshot comments corroborate; wiki text itself unverified).
[C32] Wiki Speccius: quest 1 text and rewards; subclass adds a new set of 15 talents rather than replacing the class. Quest 1 text and rewards verified in quests.json (H); wiki edit date and the 'new set of 15 talents' text unverifiable (L). Source: https://idleon.wiki/wiki/Speccius, edited 2026-09-27. Tier 2. 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C33] Build XVxy5U "Hunter/Trapping" (anonymous, created 2026-10-19, 0 likes, description truncated at fetch): damage preset order and skilling preset (trap setting) order, Eagle Eye up to 140, swap preset before placing traps. Source: https://idleontoolbox.com/tools/builds/view?id=XVxy5U. Tier 3. 2026-10-19. Confidence L (unverifiable by the data lenses: external page or branch not re-fetched).
[C34] Community Guide builds crUlTp (~170), F7F2RS (~90), aYGzFD (~70), 9vjYrC (~50), vh8Z0k (trapping ~100), rbLex2 (Archer ~35): levels and orders quoted in Min-max. Source: https://idleontoolbox.com/tools/builds/view?id=<id>, API https://builds.idleontoolbox.workers.dev/api/builds; created 2026-04-26, updated 2026-06-12..2026-10-19. Tier 4 (imported guides, 2021-22 version tags per earlier research, so pre-patch risk). 2026-10-19. Confidence L (unverifiable by the data lenses: external page or branch not re-fetched).
[C35] BigRav01 Beast Master builds MDGrBz (AFK) and 3gARZB (skilling), created 2026-09-20, updated 2026-10-13. Source: https://idleontoolbox.com/tools/builds/view?id=MDGrBz and ?id=3gARZB. Tier 3. 2026-10-19. Confidence L (unverifiable by the data lenses: external page or branch not re-fetched).
[C36] 2024 Fibster/Tetsu sheet: Eagle Eye maxed when claiming; shiny odds apply when you claim, not set. Source: carried from docs/research/systems/2026-10-17-character-builds.md (origin/research/character-builds). Tier 4, claim dated 2024-07-12, pre-patch, contradicts [C18]. 2026-10-19. Confidence L (unverifiable by the data lenses: external page or branch not re-fetched).
[C45] Eagle Eye EXP share per placer = max(40, min(EXP talent, 99))%. Source: `vendor/parsers/world-3/traps.ts#L137-L156`. Tier 1. 2026-10-19. Confidence H (re-verified by both lenses, 2026-10-19).
[C46] Save fields: `characters[].{class, classIndex, flatTalents, talents, talentPreset, talentsLoadout, selectedTalentPreset, addedLevels, maxBookLv, familyBonuses, skillsInfo.smithing/trapping, afkType, targetMonster}`; raw `SkillLevels`, `SkillLevelsMAX`, `AttackLoadout`, `CharacterClass`, `PldTraps`. Source: `vendor/parsers/character.ts#L292-L298`, `#L416-L421`, `#L521-L545`; `world-3/traps.ts#L22-L40`. Tier 1. 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C47] Account State already carries both presets, attack bars and exact talent points per tab. Source: `packages/account-state/src/talent-types.ts`. Tier 1 (project code). 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C48] Wind Walker is the released next class after Beast Master with its own talent tab; Compass code in `parsers/class-specific/compass.ts`. Source: classPromotions.json; `vendor/parsers/class-specific/`. Tier 1. 2026-10-19. Confidence M (verified in part; details not fully re-diffed).
[C49] Earlier character-builds research: Bowman build puts 1 point in each attack first; elite mapping Hunter -> Beast Master = Breeding; Elite Class Swap may not be sold. Source: docs/research/systems/2026-10-17-character-builds.md, origin/research/character-builds. Tier 3, game v1.23 / Toolbox @6827d3f. 2026-10-19. Confidence L (unverifiable by the data lenses: external page or branch not re-fetched).
[C50] Existing KB already carries `talents.build.hunter-fighting` and `talents.build.hunter-skilling` (confidence L) from MDGrBz/3gARZB/jcQXsb/6w55Am. Source: `packages/knowledge/systems/talents.yaml` (L525-L615). Tier 1 (project). 2026-10-19. Confidence L (unverifiable by the data lenses: external page or branch not re-fetched).
[C51] Talent Stop Right There (id 303): immobilises monsters in radius bigBase 150/1.5 px for intervalAdd 4/20 seconds, cd 60 s, mana 40, AFKactivity 0, K=D=1 so it is skipped in AFK math. Source: talents.json id 303. Tier 1. 2026-10-19. Confidence H.
[C52] Uwu Rawrrr (302): mob respawn time faster by decay 55/60 seconds, cd 120 s, mana 30; K=D=1, no AFK-kill effect in Toolbox. Source: talents.json id 302. Tier 1. 2026-10-19. Confidence H.
[C53] Bear Trap (301): lays intervalAdd 2/30 traps, each bigBase 150/2 %dmg on trigger, cd 9 s, mana 30, K 1.2 D 1.15. Source: talents.json id 301. Tier 1. 2026-10-19. Confidence H.
[C54] Symbols of Beyond ~G (374, Beast Master tab): +intervalAdd 1/20 levels to all talents above level 1, consumed by getTalentAddedLevels; id 374 is itself banned from added levels. Source: talents.json id 374; `vendor/parsers/talents.ts#L331-L385`; `vendor/utility/talentBans.js`. Tier 1. 2026-10-19. Confidence H.
[C55] Previous Points (299, shown on the Hunter tab): +1 talent point for the Archer tab per level; counted in the talent-points formula as source t299. Source: talents.json id 299; `packages/account-state/src/talent-points-formula.ts`. Tier 1. 2026-10-19. Confidence H.
[C56] Arena Spirit (370): cd 86400 s, mana 20, unlimited Mob Arena entries for 5 + floor(L/17) minutes, passive mob damage decay 30/100; AFKactivity -2; listed in `relevantTalents` (talents.ts L549). Source: talents.json id 370; `vendor/parsers/talents.ts#L549`. Tier 1. 2026-10-19. Confidence H.
[C57] Reflective Eyesight (313) is the shiny chance exponent base R = decayMulti 2/100, applied again every 10 Trapping levels; Visibility Vessels (309) raises I See You max by Archer or Bust bubble levels; Cuz I Catch Em All bubble carries an Archer-class multiplier on shiny chance (min 1). Source: talents.json ids 313, 309; `vendor/parsers/world-3/traps.ts#L187-L189`. Tier 1. 2026-10-19. Confidence H.
[C58] Other Archer-tab talents not covered by K/D: Hema Overdrive (272) +% max HP and MP (add 0.4/0.01, damage.ts L1059/L1088); Sanic Speed (278) +1 base AGI per level; Piercing Arrow (270) pierces 5 + floor(L/50) monsters; Kung Fu Kick (271) knockback 60 + 2L px, cd 7 s, mana 3. Source: talents.json; `vendor/parsers/damage.ts`. Tier 1. 2026-10-19. Confidence H (talents.json) / M (consumer lines not re-read).
[C59] Star talents (skillIndex 615+) are a separate tab (Star Player 8 on tab 1 gives star points; Supernova, Stonks!) with their own point pool from `calcTotalStarTalent`; they are not class-specific and are excluded from the Talent Book Library and added levels (index >= 615). Star talents are read from `flatStarTalents`. Interactions between star signs and Archer-line talents beyond the star-sign point bonus were not found in the parsers. Source: `vendor/parsers/talents.ts#L447-L451`, `#L556-L609`. Tier 1. 2026-10-19. Confidence M.
[C60] Wind Walker talent tab (indices 420-434): Tempest Form, Compass, Spirit Ballista, Eternal Hunt, Some Commandments, Windborne, Elemental Mayhem, Pumpin' Power, Unreal Agility, Shiny Medallions, Price Recession, Sneaky Skilling, Generational Gemstones, Dustwalker, Slayer Abominator. Main stat agility (talents.ts L106). Compass code lives in `vendor/parsers/class-specific/compass.ts`. Source: talents.json Wind_Walker; `vendor/parsers/talents.ts#L106`. Tier 1. 2026-10-19. Confidence H for the list; the mechanics are out of W1-4 scope and not researched.
[C61] Beast Master breeding talents beyond Beacon and Curviture: the Beast_Master tab has no other egg-power, pet-damage or shiny-pet-chance talent in the parsers; I Dream of Peace and Egg (371, 3 eggs per 10 h of AFK claims up to 100 h) and Shoeful of Obol (291, obols give more AGI) have no Toolbox consumer. Source: grep of `vendor/parsers/**`; talents.json ids 371, 291. Tier 1. 2026-10-19. Confidence M (absence of a consumer, not the in-game effect).
[C62] Trapping box mechanics (slot counts, trap types, timers): not owned by this class line; see the `trapping` dossier. Toolbox reads placed traps from `PldTraps` via `getTraps`. Source: `vendor/parsers/world-3/traps.ts#L22-L50`. Tier 1. 2026-10-19. Confidence L (slot and timer values not researched here).

## Sprites and ActiveOn gaps (for the spec step)

- Existing sprites: `class-archer`, `class-bowman`, `class-hunter`, `class-beast-master` in `apps/activeon/src/art/sprites/grids/classes.ts`; `sys-trapping` per the trapping dossier.
- Candidate new sprites (not built here): Eagle Eye (talent), Strafe, shiny critter, Looty slab counter, Beast Master summon icons (Whale, Ballista). Our own emblems only (ADR 0009).
- Detectable rules for ActiveOn (all from Toolbox fields): Eagle Eye on neither preset while a Hunter exists and traps are idle; Idle Shooting 0 while AFK fighting; attack bar missing Hunter attacks; Reflective Eyesight bought before Trapping Lv 10; Veins invested with Smithing < 10; Agi Again unbought while Quickness Boots is at max; fighting preset active while traps are being placed (placement snapshot).

## Open questions

- Reddit and community-guide pass for 2026 Hunter/Beast Master meta not done (WebSearch budget spent); only Toolbox builds and wiki were read.
- Does Toolbox omit Have Yet Anotha One from AFK damage by design or by oversight (needs game-client check)?
- Exact duration, uses and in-game text of Strafe/Eagle Eye as buffs (character.ts only reads Strafe's % speed).
- Whether Visibility Vessels' "Archer or Bust" bubble cap equals 100 or the bubble level only (talent text says "up to").
- Hunter family bonus tier: confirm it multiplies skills the Hunter does not use (formula says all skills).
- XVxy5U description truncated at fetch; fetch the full build text for the rest of the skilling preset and the star talents.
- Wind Walker mechanics (Compass, Tempest) and trap slot counts/timers not researched here; star-sign interactions with Archer-line talents not found.
- Tier-1 check of I Dream of Peace and Egg and Shoeful of Obol in the game client (no Toolbox consumer).
