# Dossier: Class, Archer to Bowman to Siege Breaker

Topic id `class-bowman`. Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Claims are numbered [C1]..[C50] and the Claims register at the end gives each one's Source and tier. Tier key (task scheme): 1 game data / Toolbox code, 2 Toolbox logic and dashboard, 3 wiki, 4 community. "Vendor" means `packages/toolbox-parsers/vendor/`. No real account data appears. Where sources disagree both views are given with a confidence (H/M/L).

Search note: the web search quota ran out before any Reddit, Steam or guide-sheet query [C49]. Tier 4 here is the Toolbox community builds API (read in full for every Archer-line build) plus the wiki. A human or later agent should add a Reddit pass (see open questions).

Revision 2026-10-19 (two adversarial lenses): no claim was refuted by both lenses, so none removed. C27 was refuted by the game-data lens only and is marked Disputed with the correction. C12's citation fixed to talents.ts#L446-L452. Unverifiable claims (C6, C30, C47, C49 and the cap parts of C12) carry confidence L or M. Missed mechanics added as C51-C60 and M24-M30. The tier-4 build claims (C35-C45) were verified by the source lens against the builds API; the game-data lens could not check them, hence confidence M.

## Archer, Bowman and Siege Breaker (the "Bowman line")

- **What it is:** the AGI line of the Archer family [C5]. Archer (Lv 10) is the base class; Bowman is the Speed/Catching subclass whose talents scale damage with movement speed; Siege Breaker is Bowman's only elite and a Sailing/EXP-and-drop support class with its own kill-per-kill and weapon-power talents [C1][C10][C11]. Hunter and Beast Master are the other Archer branch and are a separate dossier.
- **Unlocks:**
  - **Archer:** Promotheus on map 14 (Valley of the Beans), Lv 10, pick the class in quest Promotheus2; the quest gives 2 Talent Point Reset Potions [C2].
  - **Bowman:** Speccius on map 53 (Dessert Dunes): bring 100 Kebab Sticks and 50 Crabby Cakey (crabcakes drop), then pick the subclass (10,000 coins). Rewards 1 reset potion, 5 fragments, 2 two-hour candies [C3]. Talent points for the Bowman tab are backdated: 3 x (Lv - 29) arrive at once [C6].
  - **Siege Breaker:** W4, Eliteus on map 154 after the Greenie Gang; no choice (Bowman always gets Siege Breaker) [C4]. Tab 4 points start at class Lv 90 [C6].
- **Scope:** per character (talents, buffs, presets). Account-wide pieces: class family bonuses (best character per class line) [C26][C27], Expertly Sailed, Archlord of the Pirates and Unending Loot Search apply to every character [C28], Alchemy class bubbles help every Archer-line character [C31].
- **Inputs to outputs:** inputs are talent points (class levels, skill levels, Fast Boi Talent, Previous Points) [C6][C50], movement speed, Smithing level, AGI, bubbles. Outputs are damage (Speedna, Veins, Polymer Limbs, Gilded Sword), AFK rates (Idle Shooting, attacks on the bar), catching and anvil output, and for the elite Sailing EXP, drops and loot [C15][C18][C20][C23][C28].
- **Goals and Milestones:**

| Goal | Threshold | Why | Claim |
|---|---|---|---|
| Promotion to Archer | Lv 10 at Promotheus | tab 2 | [C2] |
| Presets usable | class Lv 15 | fight / skill split | [C6] |
| Bowman | Speccius, 100 Kebabs + 50 Crabby Cakey | tab 3 and Speedna | [C3] |
| First Speedna step | 116% move speed (1 step; exactly 115% gives 0 by float rounding); 130% = 2 steps | damage | [C15] |
| 145% move speed | 3 steps (ladder: 116% / 130% / 145% / 160% ...); community target | damage | [C15][C37][C39] |
| Smithing 100 | Veins of the Infernal full effect | x3.3 at talent Lv 100 | [C20] |
| Idle Shooting 50 / 100 | 10.0% / 13.3% AFK gain | AFK | [C8][C19] |
| Siege Breaker | Eliteus, class Lv 90 for tab 4 | elite tab | [C4][C6] |
| Family bonus starts | Bowman Lv 29, Siege Breaker Lv 69 | EXP / boat time | [C26] |
| Rift gate | Pirate Flag score 75 | Rift Lv 16, 22, 36, 65 | [C30] |

- **Feeds / fed by:** fed by Alchemy (Archer or Bust, Quicc bubbles, Fast Boi Talent) [C31], Stamps (move speed), Smithing level (Veins) [C20], Statues (Speed, Anvil, Ol' Reliable via Shwifty Statues) [C25], Library books [C12], star signs, food (move speed). Feeds Catching and Trapping efficiency [C23], Anvil [C24], Sailing (family travel time, Expertly Sailed, loot) [C27][C28], EXP and drop rate for the whole account (Archlord) [C28], Death Note and portal kills (Stacked Skulls) [C22].
- **Per-session actions:** (1) before AFK fighting, activate Strafe (and Extendo Rangeo for accuracy) because the Toolbox move-speed and accuracy numbers count only active buffs [C17][C40]; (2) check the active preset matches the AFK job; (3) keep Smithing leveling for Veins [C20]; (4) spend new points by the stage order below. A Strafe or Extendo that is about to lapse is a time-limited state, never a Verdict.
- **AFK Setup implications:** Bowman fights AFK on the Damage preset with Strafe and Extendo active and 4+ attacks on the bar [C18][C40]; between fights the Skilling preset serves Catching (the line's specialist job) [C36][C43]. Archer specialisation is Smithing, Bowman Catching, Siege Breaker Sailing [C34][C32].
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:** (1) levelling Featherweight past the point it matters (it saturates at 25% and is capped by Velocity Vessels / the bubble) [C8][C12]; (2) leaving Strafe off during AFK; (3) aiming for exactly 115% move speed: Speedna floor gives 0 steps there, the first step needs 116% [C15]; (4) low Smithing while Veins is high [C20]; (5) reading Idle Brawling (Warrior) off the Sir_Grimtide guide instead of Idle Shooting [C46]; (6) points in Velocity Vessels before the Archer or Bust bubble is high enough to raise the cap [C12]; (7) accuracy: STR is the accuracy stat, so Fist of Rage only until hit chance is 100% [C5].
- **Save and Toolbox fields:** see the catalogue; every line names the exact path.
- **Sources:** Claims register at the end.

## Mechanics catalogue (W1 to W4, with W5+ one-liners)

Paths: `char` = Toolbox `characters[i]`. ActiveOn mirrors them as `characters[].talents.{active,other}.tabs[].talents[]` and `.star[]`, with the attack bar and exact points (talent-types.ts) [C48].

### M1. Class path and promotions
- **Rule:** Beginner to Archer to Bowman to Siege Breaker [C1].
- **Unlock/cost:** Lv 10 Promotheus (map 14) [C2]; Speccius 100 Kebab Sticks + 50 Crabby Cakey (map 53) [C3]; Eliteus 10 Greenie Gang kills (map 154) [C4]. No master class above Siege Breaker [C1]. W5+: none; the Archer-line master (Wind Walker) belongs to Beast Master.
- **Fields:** `char.classIndex` (19/20/22), `char.class`, `char.talents[0..3].name` (Calm_Basics, Archer, Bowman, Siege_Breaker); `account.quests` Promotheus1-2, Speccius1-2, Eliteus1-2 [C1].

### M2. Talent tabs and point budget
- **Rule:** points per tab as in [C6]; Previous Points adds +1 tab-2 point per level, Fast Boi Talent adds `5 + L` points to every tab for Archers [C31][C50]. Levels are `baseLevel` (bought) plus added levels; added levels come from Symbols of Beyond ~G, god, family, achievement and others [C14].
- **Caps:** default 100; Library books raise except ids 10,11,12,266,267 etc.; ids banned from added levels include 374 [C12][C13].
- **Fields:** `char.talents[i].orderedTalents[]` (`talentId`, `level`, `baseLevel`, `maxLevel`), `char.flatTalents`, `char.maxBookLv`, raw `SkillLevels` / `SkillLevelsMAX` [C7].

### M3. Calm Basics talents (tab 1) as used by Archers
- **Rule:** see values [C8]. Gilded Sword and Sharpened Axe are linear and uncapped; Featherweight (move speed) and I See You (crit) saturate; Idle Shooting is the AFK-fight talent (id 268); Elusive Efficiency is the specialised-skill efficiency talent (id 263) [C8].
- **Stat talents:** Fist of Rage (STR, accuracy), Quickness Boots (AGI, main stat), Book of the Wise, Lucky Clover; no free stat points exist [C5][C8].
- **Fields:** `flatTalents` names GILDED_SWORD, SHARPENED_AXE, FEATHERWEIGHT, I_SEE_YOU, IDLE_SHOOTING, BROKEN_TIME, ELUSIVE_EFFICIENCY, QUICKNESS_BOOTS, FIST_OF_RAGE; `char.stats.agility/strength` from `PersonalValuesMap.StatList` [C8].

### M4. Archer tab: attacks and Strafe
- **Rule:** Piercing Arrow (5+floor(L/50) mobs), Kung Fu Kick (pushback), Strafe (active buff) [C9]. All three are attacks that count on the AFK attack bar when D/K is not 1 [C18].
- **Costs/limits:** Piercing Arrow cd 5 s, mana 5; Kick cd 7 s, mana 3; Strafe cd 30 s, mana 5, lasts 2+floor(L/15) min [C9].
- **Fields:** `char.talentsLoadout[]` (attack bar), `char.activeBuffs[]`, `char.cooldowns` [C17][C18].

### M5. Archer tab: damage passives
- **Rule:** High Polymer Limbs (weapon-power effect), Veins of the Infernal (x(1 + T*min(100,Smithing)/1000)), Have Another! (extra arrow chance, adds to AFK D), Hema Overdrive (HP/MP) [C9][C20][C21].
- **Fields:** `char.skillsInfo.smithing.level`, talents above [C20].

### M6. Archer tab: AGI and utility
- **Rule:** Garb of Un'agi'ng Quality (+1.5%/lv AGI from gear), Sanic Speed (+1 base AGI/lv), Robbinghood (drop rarity), Smeltin' Erryday (forge seconds per kill), Acme Anvil, Yea I Already Know, Godly Creation, Focused Soul (specialised-skill EXP) [C9].
- **Note:** Toolbox reads AGI from the save (`stats.agility`), so Garb/Sanic/Shoeful/Adaptation are already inside the number; Toolbox has no separate line for them [C28].
- **Fields:** `char.stats.agility`, anvil: `char.anvil`/anvil.ts consumers [C24].

### M7. Movement speed and Speedna
- **Rule:** move speed formula [C16]; Speedna steps `floor(min(ms/100-1,10)/0.15)` with the float behaviour in [C15]. Sources of speed: Featherweight, Strafe (active), food, stamps, statue, star sign, gear, cards, AGI curve [C16].
- **Caps:** soft cap tiers at 175% and 200% [C16]; Speedna term capped at +1000% [C15].
- **Fields:** `getPlayerSpeedBonus(character, characters, account)` result (ActiveOn reads it as movement speed); `char.activeBuffs` for Strafe [C16][C17].

### M8. Bowman attacks and buffs (tab 3)
- **Rule:** Homing Arrows, Magic Shortbow (attacks); Flax Instastring (procs a Shortbow on basic attacks, single target); Extendo Rangeo (buff); Woah That Was Fast! (cooldown reduction `ceil(cd / (1 + (talent + Magician Starterpack)/100))`) [C10][C22].
- **Fields:** `char.talentsLoadout`, `char.activeBuffs`, `getAttackCooldownDivisor` [C22].

### M9. Bowman economy talents
- **Rule:** Shoeful of Obol (obol AGI), Shwifty Statues (statue bonus), Agi Again and Adaptation Revelation (raise Quickness Boots cap), Velocity Vessels (raises Featherweight cap, bounded by the Archer or Bust bubble) [C10][C12][C25].
- **Fields:** `char.flatTalents[].maxLevel`, `account.alchemy.bubbles.quicc[1]` (Archer or Bust level), `account.statues` [C12][C25].

### M10. Catching and the Skilling preset
- **Rule:** catching efficiency formula [C23]; Briar Patch Runner, Ambidexterity, Teleki'net'ic Logs (Oak Logs stockpile and Helium atom), Elusive Efficiency; EXP: Bug Enthusiast, Focused Soul; AFK: Sunset on the Hives [C23][C24].
- **Fields:** `char.skillsInfo.catching.level`, `account.storage.list` (Oak Logs), `account.atoms`; Toolbox efficiency breakdown [C23].

### M11. Idle Shooting and the AFK attack bar
- **Rule:** AFK fighting gain base 0.4 plus additive terms including Idle Shooting [C19]; the attack-bar factor [C18]. Level 25 per attack on the bar gets about 1.2x of its D; level 100 about 1.5x [C18].
- **Fields:** `getAfkGain`, `char.afkType` (FIGHTING), `char.talentsLoadout` [C18][C19].

### M12. Weapon power, damage and accuracy
- **Rule:** damage formulas [C20][C21]; accuracy stat STR [C5]; Extendo Rangeo adds to accuracy [C17]; crit from AGI and I See You [C22].
- **Fields:** `getMaxDamage`, `char.stats.strength/agility`, Toolbox `hitChance` [C5][C17].

### M13. Class bubbles (Quicc cauldron)
- **Rule:** Archer or Bust (index 1) multiplies the other green bubbles for agility characters; the list of class-gated bubbles and Fast Boi Talent in [C31].
- **Fields:** `account.alchemy.bubbles.quicc[]`, `account.alchemy.bubblesFlat` [C31].

### M14. Family bonuses
- **Rule:** Archer +AGI, Bowman +% EXP when fighting actively, Siege Breaker -% minimum boat travel time [C26]. The family walk, The Family Guy and what Toolbox consumes are in [C27].
- **Fields:** `char.familyBonuses[className]`, `characters[].level` [C27].

### M15. Siege Breaker attacks
- **Rule:** Cannonball, Suppressing Fire, Firebomb are the elite's attacks (values [C11]); they enter the AFK attack bar with D/K [C18].
- **Fields:** `char.talentsLoadout`; Toolbox has no per-attack damage consumer for them [C28].

### M16. Pirate Flag and Plunderous mobs
- **Rule:** Pirate Flag buff (cooldown 490 s, 15 mana) lets kills spawn Plunderous mobs with xHP and bonus EXP and drops; Plunder Ye Deceased keeps coin drops, respawn and auto-loot for a few seconds after killing one [C11][C33]. The wiki says a flag holding over 100 coins can force a mob for 25 coins (carried) [C33].
- **Fields:** `char.activeBuffs` (PIRATE_FLAG); `account.accountOptions[139]` is probably the Plunderous kill counter [C29].

### M17. Account-wide Siege Breaker talents
- **Rule:** Archlord of the Pirates (EXP and drop multiplier scaling with the log of Plunderous kills), Expertly Sailed, Unending Loot Search, Captain Peptalk (account-wide) [C11][C28].
- **Fields:** `getHighestTalentAcrossCharacters(characters, 'ARCHLORD_OF_THE_PIRATES')` and peers [C28].

### M18. Siege Breaker personal talents
- **Rule:** Stacked Skulls (kill-per-kill scales with AGI/1000), Crew Rowing Strength (weapon power per 10 Sailing Lv), Skill Ambidexterity (AGI impact on skill efficiency, +AGI), Adaptation Revelation (+AGI%, Quickness cap) [C11][C22][C23].
- **Fields:** `char.skillsInfo.sailing.level`, `char.stats.agility` [C22].

### M19. Symbols of Beyond ~G
- **Rule:** +1+floor(L/20) levels to all talents above Lv 1 on the same character; the talent itself cannot be raised by added levels [C11][C13][C14].
- **Fields:** `char.talents[3].orderedTalents` (name contains SYMBOLS_OF_BEYOND_), `char.addedLevels` [C14].

### M20. Presets
- **Rule:** two presets per character from Lv 15, swap anywhere below class Lv 10,000; the Bowman line normally runs a Damage preset and a Catching preset [C6][C35][C36]. The earlier research found 2 of 11 test characters on the wrong preset; this class has an equal risk because the two jobs are so different.
- **Fields:** `char.selectedTalentPreset`, `char.talentPreset`, ActiveOn `talents.active/other` [C48].

### M21. Star talents used by the line
- **Rule:** the Bowman guide uses Will of the Eldest, Beginner Best Class, Tick Tock, Attacks on Simmer, Goblet of Hemoglobin (tab 1) and Dungeonic Damage, Frothy Malk, Telekinetic Storage (tab 2) [C35][C36].
- **Fields:** `char.flatStarTalents` [C36].

### M22. Rift gate
- **Rule:** Pirate Flag score 75 needed at Rift levels 16, 22, 36, 65 [C30]. W5+ extension: the gate exists only if one Siege Breaker is in the roster.

### M23. Cooldowns and mana
- **Rule:** attack mana costs and cooldowns in the talents table; cooldown divisor [C9][C10][C22].

### M24. Agility-gated and Archer-line-only bubbles (added in revision)
- **Rule:** beyond Bow Power, Shaquracy and Archer or Bust: Quick Slap, Quickdraw Quiver, Lil Big Damage, Bow Jack, Power Tritwo, Cheap Shot, Fly In Mind, Sanic Tools; Cuz I Catch Em All and Anvilnomics use the Archer-or-Bust multiplier [C52][C53].
- **Fields:** `account.alchemy.bubbles.quicc[]` [C52].

### M25. Move-speed extras (added in revision)
- **Rule:** stamps, food, Tip Toe Quickness star talent, Salt Lick, Grounded Motherboard, Tuft of Hair sigil feed the speed tiers that Speedna and Quick Slap read [C51].
- **Fields:** `char.flatStarTalents` (TIPTOE_QUICKNESS), `getPlayerSpeedBonus` [C51].

### M26. AGI feeders and character-level scaling (added in revision)
- **Rule:** Shoeful of Obol, Garb of Un'agi'ng Quality, Sanic Speed, Previous Points and Fast Boi Talent scale with level or points and feed AGI or the point budget [C57][C50][C56]. Lucky Clover and Quickness Boots matter on non-catching builds as stat talents [C8].

### M27. Archer-line branch sharing (added in revision)
- **Rule:** Hunter, Beast Master and Wind Walker share the Archer tab and Calm Basics; their family bonuses are consumed (Hunter efficiency.ts#L145, Beast Master character.ts#L3239) [C27]. Covered in the Hunter dossier.

### M28. Subclass re-pick (open)
- **Rule:** no re-pick quest found; see [C60] and open question Q9.

### M29. Unconsumed skilling talents
- **Rule:** Smeltin' Erryday, Yea I Already Know and Godly Creation have no Toolbox consumer [C55]; ActiveOn can only show the level.

### M30. Archlord account multiplier
- **Rule:** lavaLog(accountOptions[139]) on EXP and drop rate account-wide [C59]; Symbols of Beyond banned from added levels [C58].

### W5+ extensions (one line each)
- Sailing (W5): Siege Breaker is the Sailing specialist; the family bonus caps minimum boat time at 15 s, Expertly Sailed and Captain Peptalk apply to the roster [C27][C28].
- Pirate Flag Rift gates matter once the Rift opens in W5 [C30].
- Skill Ambidexterity also feeds trapping efficiency; Hunter shares the Archer tab [C23].
- Stacked Skulls is switched off from World 7 onwards in the kill-per-kill code [C22].
- No master class above Siege Breaker [C1].

## Min-max by stage

Stage lines use community builds (tier 4) checked against game data (tier 1). Older legacy 'Community Guide' builds (2026-04-26 import) are not used as authority [C47]. Where a build names a point count, it is the count the author wrote.

**W1 early (Archer, Lv 10 to about 35)**
- Sharpened Axe > Gilded Sword to 50 each, kept within 10 levels of each other; Fist of Rage only as needed for accuracy; Polymer Limbs 50, attacks 20, Strafe 1 (activate before AFK), Have Another 10, Veins 1 [C38]. (data check: Gilded Sword and Axe are linear, so they scale forever [C8].)
- Reach Crabcakes to choose the subclass [C38][C3].

**W1 mid / W2 early (Bowman, about Lv 35-50)**
- Featherweight to 5-20 first, then Gilded Sword > Sharpened Axe (100 each), Fist of Rage for accuracy [C39][C37].
- High Polymer Limbs 100, 1 point in each attack, Veins 15 and up, Speedna 70-90, Previous Points with extras [C39].
- Aim for 130% move speed (about 40 Strafe points; 2 Speedna steps, the first step already starts at 116%) and then 145% [C39][C15].

**W2 mid (about Lv 50-70)**
- Idle Shooting 50, Axe and Gilded 50, Piercing Arrow 50, Kick 25, Polymer 100, Veins 30, Homing Arrows 25, Magic Shortbow 50, Extendo 1, Speedna 60; keep Strafe and Extendo active [C40].
- Send spare points back to Strafe (145% = 3 Speedna steps) [C37].

**W2 late / W3 early (about Lv 70-90)**
- Idle Shooting 100, Axe and Gilded 75, Featherweight 20, Piercing 25, Kick 50, Strafe 100, Polymer 100, Veins 100, Homing 25, Shortbow 50, Speedna 100 [C41].
- Active variant: Axe and Gilded 100, Piercing 40 (hits 3 mobs), Have Another 50, Strafe about 85 for 145%, Previous Points 100 [C41].
- Veins now pays: at Smithing 100 and talent Lv 100 the multiplier is x3.33 [C20]. Raise Smithing.
- Skilling preset (Catching): Elusive Efficiency > Quickness Boots > Broken Time; Garb > Sanic Speed > Focused Soul; Acme Anvil > Yea I Already Know > Godly Creation; Teleki'net'ic Logs > Briar Patch Runner > Bug Enthusiast > Sunset > Agi Again > Shwifty Statues [C36].

**W3 mid / late (about Lv 90-150+)**
- All main talents about 100, Homing Arrows 100, Speedna 100, Quickness Boots 200, I See You 100 for boss killing; four move-speed foods plus boost-food effect [C44].
- Raise caps: Agi Again, Velocity Vessels (bounded by Archer or Bust bubble level), Library books [C12][C35].
- Catching preset: Sunset on the Hives, Briar Patch Runner, Teleki'net'ic Logs, Shwifty Statues, Agi Again, Shoeful; keep catching skill no higher than the Maestro's [C43].
- Class bubbles (Archer or Bust, Fast Boi Talent, Quickdraw Quiver, Bow Jack, Power Tritwo) are the biggest non-talent damage gain for this line [C31].

**Late W3 / endgame Bowman (about Lv 150+)**
- Attacks Lv 25 each is enough; more points into attacks and Have Another only if prayers raise mob HP; most passives about 160, Quickness Boots 260, Featherweight last (falls off at high level), Shoeful and Book of the Wise 100 [C42][C8].

**W4 (Siege Breaker)**
- Take the elite after the Greenie Gang; tab-4 points start at Lv 90 [C4][C6].
- Guide order for AFK: Archlord of the Pirates maxed, Suppressing Fire maxed, 1 point each in The Family Guy, Firebomb, Pirate Flag, Plunder Ye Deceased, Cannonball, Stacked Skulls and Symbols ~G; skill bar Pirate Flag, Homing Arrows, Suppressing Fire, Cannonball, Piercing Arrow, Firebomb, Extendo, Strafe [C45].
- Skilling preset tab 4: Symbols of Beyond > Adaptation Revelation > Skill Ambidexterity [C36].
- Rift level 16 needs a Pirate Flag score of 75 [C30].

**Where sources disagree**
- Wiki gives no talent priority for Siege Breaker [C33]; the only build is a 1-like W4 AFK guide [C45] (confidence L).
- Extendo Rangeo: wiki and talent text say px range plus accuracy; Toolbox applies its x value as accuracy percent [C17] (confidence M that Toolbox matches the game, because its accuracy numbers are tested against saves; unverified here).
- Move-speed targets: 130% (community mid-game) versus 145% (community, higher) [C39][C37]; the code makes 116% one step, 130% two and 145% three, so 145% is strictly better if affordable [C15].

## Common mistakes (detectable)
- Strafe or Extendo not active on an AFK Bowman: `activeBuffs` lacks them [C17].
- AFK fighting Bowman with Idle Shooting 0: `flatTalents[268].baseLevel == 0` [C19].
- Move speed that lands on exactly 115% (0 Speedna steps) or just under a 15% step: compute `floor((ms/100-1)/0.15)` with the float rounding of [C15].
- Veins of the Infernal levelled while Smithing is far below 100 [C20].
- Featherweight over the cap raise, or points in Velocity Vessels above the Archer or Bust bubble level [C12].
- Fewer than 2 attacks on the bar in the Damage preset [C18].
- Skilling preset not worn when AFK on Catching (preset drift) [C36].

## ActiveOn today and gaps
- **Has:** Archer and Bowman fighting/skilling build entries (confidence L) built from the Sir_Grimtide guide; presets, attack-bar and reset checks; class EXP contribution; class emblems for Archer, Bowman, Hunter, Beast Master, Siege Breaker; exact talent points [C48].
- **Lacks:** a Siege Breaker build entry (tab 4 order, skill bar); a move-speed / Speedna-step readout and a Strafe/Extendo "about to lapse" state; the Bowman line's Smithing-for-Veins nudge; Fast Boi Talent and Archer or Bust class-bubble entries in the Alchemy bubble plan; Pirate Flag Rift gate; Bowman and Siege Breaker family bonus readouts; Plunderous kill counter and Archlord value; a home page for the class line [C48].
- **Sprites needed (documented, not built here):** Strafe / Extendo Rangeo buff chips, a move-speed boot icon, Pirate Flag, Plunderous mob, Cannonball / Firebomb attack icons, Promotheus and Speccius NPC portraits, Crabby Cakey and Kebab Stick item icons; emblems already exist.

## Open questions
- Q1: which Extendo Rangeo value is accuracy percent in the game (x = 19.5+0.5L or y)?
- Q2: Plunder Ye Deceased interval: 7 (data) or 8 (text)?
- Q3: is `accountOptions[139]` the Plunderous kill counter; where does the game reset it?
- Q4: do Bowman active-EXP and Archer AGI family bonuses reach the game's EXP / AGI totals even though Toolbox has no line for them?
- Q5: Reddit / Steam / sheet pass for Bowman vs Hunter choice, 130% vs 145%, and Siege Breaker stage plan (search quota exhausted).
- Q6: is the exactly-115% = 0 Speedna steps float effect real in-game (same JS float behaviour assumed)?
- Q7: Captain Peptalk and Adaptation Revelation (AGI%) effect sizes in-game; not modelled in Toolbox.
- Q8: whether Speccius has a level gate (data shows none).
- Q9: is there any in-game way to re-pick Bowman or Siege Breaker without reset items [C60]?

## Claims register

Verified 2026-10-19 unless stated; claim dates are the page or build update dates given in the text. Tier: 1 game data / Toolbox code, 2 Toolbox logic, 3 wiki, 4 community.

| ID | Claim | Source | Tier | Conf |
|---|---|---|---|---|
| C1 | Archer line: Archer (index 19) promotes to Bowman (20) or Hunter (21). Bowman promotes only to Siege Breaker (22). Siege Breaker has no `promotesTo` in the data (no master class). Talent tabs: Calm_Basics, Archer, Bowman, Siege_Breaker. The Archer-line master class is Wind Walker (29), reached from Beast Master, not from Bowman. | packages/toolbox-parsers/vendor/data/website-data/classPromotions.json | 1 | H |
| C2 | Beginner to Archer: NPC Promotheus on map 14 (Valley_Of_The_Beans). Promotheus1 needs Lv 10 (rewards 500 coins, 5 Bottled Town Teleport); Promotheus2 'Select a New Class' (rewards 10 EXP, 2 Talent Point Reset Potions, 1 Basketball). Promotheus3/4 are side quests (House Monster, Baba Yaga). | packages/toolbox-parsers/vendor/data/website-data/quests.json (key Promotheus); shared-data.json npcPlacements | 1 | H |
| C3 | Archer to Bowman: NPC Speccius on map 53 (Dessert_Dunes). Speccius1: bring 100 Kebab Sticks and 50 Crabby Cakey (dropped by crabcakes, item DesertA3); rewards 2x 2-hr Time Candy, 1 Talent Point Reset Potion, 5 Reset Fragments. Speccius2 'Select a Sub Class': 10,000 coins. | packages/toolbox-parsers/vendor/data/website-data/quests.json (key Speccius); shared-data.json npcPlacements, mapNames | 1 | H |
| C4 | Bowman to Siege Breaker: Eliteus quests (NPC on map 154). Eliteus1 'The Greenie Gucci Gang' (defeat 10, reward 750,000,000 coins), Eliteus2 'Select an Elite Class' (150,964,823 coins). The picker offers exactly one elite per subclass, so Bowman always gets Siege Breaker. Detail lives in the elite-classes dossier. | packages/toolbox-parsers/vendor/data/website-data/quests.json (key Eliteus); dossiers/elite-classes.md [C1][C4] | 1 | H |
| C5 | Main stat is AGI for every Archer-line class; the accuracy stat is STR (getAccuracy maps main stat agility to accuracy stat strength). | packages/toolbox-parsers/vendor/parsers/talents.ts#L98-L104; packages/toolbox-parsers/vendor/parsers/damage.ts#L982-L990 | 1 | H |
| C6 | Unverifiable in vendored code (Toolbox only computes star-tab points; both lenses). Talent points per tab (carried from the earlier N.js reading, not re-traced this pass): tab 1 gets 3*(Lv-1), tab 2 3*(Lv-6), tab 3 3*(Lv-29), tab 4 3*min(Lv-89,100)+2*(Lv-189) past 189, plus skill-level and item sources. Bowman talents are therefore tab 3 and start paying out only past class Lv 29; Siege Breaker is tab 4 (class Lv 90+). | docs/research/systems/2026-10-17-character-builds.md (origin/research/character-builds) citing N.js _customBlock_TotalTalentPoints | 1 | L |
| C7 | Talent growth formulas: decay x1*L/(L+x2); add with x2=0 is x1*L; add with x2!=0 is quadratic; bigBase x1+x2*L; intervalAdd x1+floor(L/x2); decayMulti 1+x1*L/(L+x2). A talent never learned (level<=0) returns 0. | packages/toolbox-parsers/vendor/utility/wiki/growth.mjs#L11-L78; packages/toolbox-parsers/vendor/parsers/talents.ts#L36-L52 | 1 | M |
| C8 | Calm Basics (tab 1) Archer-line values: Gilded Sword add 1.5%/lv (no cap; 150% at Lv100); Sharpened Axe add 0.4 base WP/lv; Fist/Quickness/Book/Lucky Clover add 1 base STR/AGI/WIS/LUK per lv; Featherweight decay 25/40 % move speed (17.86 at Lv100, max 25); I See You decay 27/50 % crit (18.0 at Lv100); Idle Shooting decay 20/50 % AFK fight gains (13.33 at Lv100, 10.0 at Lv50); Broken Time decay 100/75 % town production speed; Elusive Efficiency add 1/0.02 (quadratic; 201 at Lv100) % efficiency in specialised skills; Bucklered Up decay 40/60 % DEF; Health/Mana Booster add (1,0.15)/(1,0.1); Star Player add 1 star point/lv. | packages/toolbox-parsers/vendor/data/website-data/talents.json (tab Calm_Basics) | 1 | H |
| C9 | Archer (tab 2) values: Piercing Arrow bigBase 125+2L % dmg, hits 5+floor(L/50) mobs, cd 5 s, 5 mana; Kung Fu Kick 25+L px, 60+2L % dmg, cd 7 s; Hema Overdrive add (0.4,0.01) % HP and MP; Strafe 5+0.3L % move speed for 2+floor(L/15) min, cd 30 s; Have Another! decay 120/40 % extra arrow (85.7 at Lv100, 100 at Lv200); Veins of the Infernal decay 35/50 % dmg per 10 Smithing Lv (cap Smithing 100); Garb of Un'agi'ng Quality 1.5%/lv more AGI from equips; High Polymer Limbs 1%/lv weapon-power effect; Sanic Speed +1 base AGI/lv; Robbinghood decay 40/65 % drop rarity; Smeltin' Erryday decay 50/80 % chance for 1+floor(L/60) forge s per kill; Acme Anvil 1+floor(L/15) anvil points; Yea I Already Know decay 5/90 % EXP start (cap 5+floor(L/10)); Godly Creation decay 50/75 %; Focused Soul 1%/lv specialised-skill EXP. | packages/toolbox-parsers/vendor/data/website-data/talents.json (tab Archer) | 1 | H |
| C10 | Bowman (tab 3) values: Homing Arrows 2+floor(L/15) arrows, 27+3L % dmg, cd 15 s, 18 mana; Magic Shortbow 2+floor(L/20) monsters, 47+3L % dmg, cd 6 s, 7 mana; Flax Instastring decay 40/50 % chance to spawn a Shortbow on basic attacks; Extendo Rangeo 19.5+0.5L, cd 30 s buff; Woah That Was Fast! decay 30/40 % lower talent cooldowns; Speedna decay 45/60 % dmg per 15% move speed above 100% (28.12 at Lv100, cap 1000% speed); Shoeful of Obol decay 135/80 % more AGI from obols; Shwifty Statues decay 100/50 % more from Speed/Anvil/Ol' Reliable statues; Agi Again +1 max Lv of Quickness Boots per lv; Velocity Vessels +1 max Lv of Featherweight per lv (capped by Archer or Bust bubble level); Teleki'net'ic Logs decay 20/70 % catching efficiency per power of 10 Oak Logs; Briar Patch Runner +0.5%/lv effect of AGI on catching; Bug Enthusiast +1.5%/lv catching EXP; Sunset on the Hives decay 20/60 % catching AFK gains; Previous Points +1 tab-2 point per lv. | packages/toolbox-parsers/vendor/data/website-data/talents.json (tab Bowman) | 1 | H |
| C11 | Siege Breaker (tab 4) values: Cannonball 600+6L % dmg (cd 4 s, 30 mana); Suppressing Fire 20+L % dmg, 4+floor(L/33) balls (cd 6 s); Firebomb 200+2L %, 5+floor(L/50) mobs (cd 38 s, cast 1.1 s); Pirate Flag x(10+floor(L/5)) Plunderous HP and +(800+20L)% EXP and drop (cd 490 s); Plunder Ye Deceased 20+floor(L/7) s of coin drops; Crew Rowing Strength decay 7/100 weapon power per 10 Sailing Lv; Stacked Skulls decay 40/100 % kill-per-kill per 1000 AGI; Skill Ambidexterity decay 60/80 % AGI impact on skill efficiency and 1+floor(L/2) AGI; Adaptation Revelation decay 15/100 % AGI and +1 max Lv Quickness Boots per lv; The Family Guy decay 40/100 % larger family bonuses; Unending Loot Search decay 85/150; Expertly Sailed decay 60/100 % Sailing EXP all characters; Captain Peptalk decay 80/100 % captain EXP; Archlord of the Pirates decay 6/150 % EXP and drop per power of 10 Plunderous kills (all characters); Symbols of Beyond ~G 1+floor(L/20) levels to all talents above Lv 1. | packages/toolbox-parsers/vendor/data/website-data/talents.json (tab Siege_Breaker) | 1 | H |
| C12 | Default talent max level is 100 (save key SM_<id> / SkillLevelsMAX). Exceptions in the Archer line: Featherweight (266) max = 100 + min(Velocity Vessels level, Archer or Bust bubble level); Quickness Boots (11) max = 100 + Agi Again + Adaptation Revelation (+ other sources, carried). The Talent Book Library raises other talents, but not ids 10,11,12,23,75,79,86,87,266,267,446,447. The default 100 and the cap-raising effects (Velocity Vessels, Agi Again, Adaptation Revelation) come only from talent text; no Toolbox code computes them (partly unverifiable, source and game-data lenses 2026-10-19). Featherweight and Quickness Boots cap parts rely on N.js, not in vendored code. | packages/toolbox-parsers/vendor/data/website-data/talents.json descriptions of 293/294/368; packages/toolbox-parsers/vendor/parsers/talents.ts#L446-L452 (list at L452); N.js via docs/research/systems/2026-10-17-character-builds.md | 1 | M |
| C13 | Talent 374 (Symbols of Beyond) and skill ids 49-59, 149, 505, 539 and above 614 are excluded from every 'added levels' source (super talents, symbols, family, god, etc.). | packages/toolbox-parsers/vendor/utility/talentBans.js#L9-L12 | 1 | H |
| C14 | Added talent levels (applied to every non-banned talent with level>=1): Arctis god, Symbols of Beyond (Siege Breaker tab-4 talent whose name contains SYMBOLS_OF_BEYOND_, 1+floor(L/20)), Elemental Sorcerer family bonus, achievement 291 (+1), companion 1, ninja mastery tier 3 (+5), Equinox Symbols, Grimoire 39, Kattlekruk set, Tesseract (cap 5), Timmy Talented superbit; super talents add 50 + legend/zenith bonus. | packages/toolbox-parsers/vendor/parsers/talents.ts#L305-L388 | 1 | H |
| C15 | Speedna adds `SPEEDNA * floor(min(moveSpeed/100 - 1, 10) / 0.15)` percent to the 'per X' damage group. Floating point matters: 115% gives 0 steps (0.9999999999999994), 116% (anything above 115%) gives 1, 130% gives 2, 145% gives 3, 160% gives 4, 205% gives 6. So exactly 115% is wasted and the first step starts at 116%; steps then land at 130% and 145% (re-run 2026-10-19 with node floor(), CORRECTION: an earlier version of this row said the first step was 130%). The term is capped at +1000% over base (1100% total in code; the wiki and talent text say 1000% speed). | packages/toolbox-parsers/vendor/parsers/damage.ts#L729-L734; node floor() check run 2026-10-19 | 1 | H |
| C16 | Move speed = 1 + (food + Featherweight + stamp + active Strafe + statue + star sign + gear + card + Feather Flight)/100 + agiTerm/2.2, where agiTerm = ((AGI+1)^0.4 - 1)/40 below 1000 AGI else (AGI-1000)/(AGI+2500)*0.5+0.371. Then: above 2.0 floor to 0.01; 1.75 to 2.0 adds TipToe Quickness, capped at 2; at or below 1.75 adds Salt Lick, Grounded Motherboard, TipToe and Tuft of Hair sigil, capped at 1.75. | packages/toolbox-parsers/vendor/parsers/character.ts#L3191-L3226 | 1 | H |
| C17 | Active-buff talents (Strafe, Extendo Rangeo) only count while in `activeBuffs`. Toolbox reads Strafe's x (percent move speed) into move speed and Extendo Rangeo's x (19.5+0.5L) as an accuracy percent multiplier. The talent text lists the first Extendo value as pixels of range, so which value is accuracy is unresolved. Strafe has AFKactivity -1 in the data (does not contribute to AFK attack math). | packages/toolbox-parsers/vendor/parsers/character.ts#L3197; packages/toolbox-parsers/vendor/parsers/damage.ts#L1012,L1030; talents.json lvlUpText of 273/288 | 1 | M |
| C18 | AFK attack bar: each attack on the bar with AFKactivity 0 and D (or K) not equal 1 multiplies AFK damage (kills) by D (K) * (1 + min(1, L/(L+100))); so Lv25 gives 1.2x and Lv100 1.5x of the talent's D. D/K by talent: Piercing Arrow 1.19/1.15, Homing Arrows 1.25/1.0, Magic Shortbow 1.2/1.1, Cannonball 1.5/1.0, Suppressing Fire 1.2/1.3, Firebomb 1.4/1.0. Have Another! adds directly to D as a percent. | packages/toolbox-parsers/vendor/parsers/damage.ts#L1288-L1310; talents.json K/D fields | 1 | H |
| C19 | Idle Shooting is one of the additive terms of the fighting AFK gain rate (base 0.4 plus family Voidwalker, Civil War box, Idle fighting talent, bribe, cards, gear, obols, prayers, chips, guild, star sign). | packages/toolbox-parsers/vendor/parsers/character.ts#L3365-L3395 | 1 | H |
| C20 | Veins of the Infernal is a separate damage multiplier: 1 + talent * (min(100, Smithing Lv)/10)/100. At talent Lv100 (23.33%) and Smithing 100 that is x3.33; at talent Lv50 (17.5%) and Smithing 50 it is x1.88. | packages/toolbox-parsers/vendor/parsers/damage.ts#L676-L679 | 1 | H |
| C21 | Weapon power term: ((WP * (1 + (STR talent + High Polymer Limbs + INT talent + cosmo bonus)/100) + Sharpened Axe)/3)^2, plus stat term and a stat-and-power term capped at 150. High Polymer Limbs is the Archer's 'weapon power effect' talent; Bow Power bubble multiplies bow WP for agility classes. | packages/toolbox-parsers/vendor/parsers/damage.ts#L889-L945, L1137-L1139 | 1 | H |
| C22 | Other Toolbox consumers: Hema Overdrive (max HP/MP), I See You (crit chance; AGI crit curve (AGI+1)^0.37 below 1000), Cheap Shot bubble, Stacked Skulls (kill-per-kill * AGI/1000, off from World 7), Crew Rowing Strength (WP, rounded to 0.1), Robbinghood (drop rate), Woah That Was Fast! (cooldown divisor 1 + (talent + Magician Starterpack)/100). | packages/toolbox-parsers/vendor/parsers/damage.ts#L1059,L1088,L1214-L1229,L1541-L1546,L1150; packages/toolbox-parsers/vendor/parsers/character.ts#L2386; packages/toolbox-parsers/vendor/parsers/talents.ts#L67-L71 | 1 | H |
| C23 | Catching efficiency = base (3 + power lines, AGI-based term (AGI*(1+Briar Patch/100))^0.6 * (1+Ambidexterity/100), stamps) times bonuses (1+level/200)(1+(AGI/100)^0.35*(1+Ambidexterity/100))(1+catching power)(1+Teleki'net'ic * (Helium atom + lavaLog(Oak Logs))/100)(1+Elusive Efficiency/100)... The Sanic Tools bubble, class bubble multiplier and Platinum set also apply. | packages/toolbox-parsers/vendor/parsers/efficiency.ts#L488-L560 | 1 | H |
| C24 | Catching EXP uses Focused Soul and Bug Enthusiast; catching AFK gain base is 0.5 plus Sunset on the Hives, Fly in Mind bubble, trapping, post office, gear and others. Anvil uses Acme Anvil (extra points), Broken Time (town speed) and Focused Soul; Alchemy brewing uses Broken Time. | packages/toolbox-parsers/vendor/parsers/character.ts#L701,L860-L861,L3516-L3535; packages/toolbox-parsers/vendor/parsers/world-1/anvil.ts#L86,L185,L204; packages/toolbox-parsers/vendor/parsers/world-2/alchemy.ts#L725 | 1 | H |
| C25 | Shwifty Statues adds to the Speed, Anvil and Ol' Reliable statue bonuses (talent value/100 added to the statue multiplier). | packages/toolbox-parsers/vendor/parsers/world-1/statues.ts#L150-L165 | 1 | H |
| C26 | Archer-line class family bonuses (classFamilyBonuses by class index): Archer +AGI intervalAdd x1=1,x2=5,from class Lv 9; Bowman +% EXP when fighting actively, decay 38/100 from class Lv 29 (6.6% at 50, 15.8% at 100, 24.0% at 200, 27.8% at 300); Hunter +% efficiency for all skills decay 30/100 from Lv 29; Siege Breaker +% faster minimum boat travel time decay 20/170 from Lv 69 (3.08% at 100, 8.70% at 200). The wiki shows Bowman and Archer family bonuses as +0 placeholders. | packages/toolbox-parsers/vendor/data/website-data/shared-data.json classFamilyBonuses[19..22]; packages/toolbox-parsers/vendor/parsers/family.ts#L16-L19; https://idleon.wiki/wiki/Bowman | 1 | H |
| C27 | **Disputed** (game-data lens refuted as incomplete; source lens did not). Original view: Toolbox consumes the Hunter and Siege Breaker family bonuses (efficiency.ts L145; sailing.ts L378) but has no consumer for the Bowman 'active EXP' or Archer 'AGI' family bonuses (no getCharacterFamilyBonus call for Bowman or Archer). Siege Breaker and Divine Knight bonuses are multiplied by the account's best The Family Guy; others only by the played character's own. Correction (game-data lens, tier 1): the Beast Master family bonus is also consumed (character.ts#L3239); Archer-line consumers are Hunter (efficiency.ts#L145), Beast_Master (character.ts#L3239) and Siege_Breaker (sailing.ts#L378, buffed by the account-best The Family Guy); Archer and Bowman have none. The "no consumer for Bowman/Archer" half is confirmed by both lenses. | packages/toolbox-parsers/vendor/parsers/family.ts#L24-L75; packages/toolbox-parsers/vendor/parsers/efficiency.ts#L145; packages/toolbox-parsers/vendor/parsers/world-5/sailing.ts#L377-L384 | 1 | M |
| C28 | Siege Breaker talents with Toolbox consumers: Expertly Sailed (Sailing EXP, best across characters, character.ts L1214), Archlord of the Pirates (EXP multiplier and drop-rate multiplier 1 + talent*lavaLog(accountOptions[139])/100, L2179 and L2404), Unending Loot Search (sailing loot multiplier, sailing.ts L594), Stacked Skulls, Crew Rowing Strength, The Family Guy. No consumer in Toolbox: Cannonball, Suppressing Fire, Firebomb, Pirate Flag, Plunder Ye Deceased, Skill Ambidexterity (catching/trapping only), Adaptation Revelation, Captain Peptalk. | packages/toolbox-parsers/vendor/parsers/character.ts#L1214,L2179,L2404; packages/toolbox-parsers/vendor/parsers/world-5/sailing.ts#L594; grep of parsers for talent names | 1 | H |
| C29 | Pirate Flag talent text says Plunder Ye Deceased gives '+1 sec every 8 lvs' but the data uses intervalAdd x2=7 (floor(L/7)). Treated as unresolved. accountOptions[139] appears to be the Plunderous kill counter (Archlord says per power of 10 kills); not independently confirmed (inference, no code names it). | packages/toolbox-parsers/vendor/data/website-data/talents.json 319, 328; packages/toolbox-parsers/vendor/parsers/character.ts#L2180 | 1 | M |
| C30 | Rift level gate: Siege Breaker needs a Pirate Flag score of 75 at Rift levels 16, 22, 36 and 65 (carried from the elite-classes dossier). | dossiers/elite-classes.md [C23] (exact level numbers not re-derived; the Pirate Flag score-75 Rift task appears 4 times in shared-data, partly verified) | 1 | L |
| C31 | Class bubbles: Archer or Bust (quicc cauldron index 1, decayMulti 2/50) multiplies the quicc bubbles with index 2-29 except index 16, excluding Construction/passz/ACTIVE/AllCharz stats, for agility-main-stat characters. Toolbox applies the class gate to Quickdraw Quiver (AGI damage effect), Bow Jack, Power Tritwo, Bow Power, Quick Slap, Shaquracy, Cheap Shot, Lil Big Damage, Dollar of Agility, Fly in Mind, Sanic Tools, Anvilnomics, Cuz I Catch Em All and Essence Boost; Premigreen (index 16) boosts indices 0,6,9,12,14 of the cauldron. Fast Boi Talent (a13) gives 5+L talent points to EACH tab, Archers only (not master classes). | packages/toolbox-parsers/vendor/parsers/world-2/alchemy.ts#L396-L470; packages/toolbox-parsers/vendor/data/website-data/cauldrons.json quicc; packages/toolbox-parsers/vendor/parsers/damage.ts#L107,L219,L349-L354,L907,L1137,L1222 | 1 | H |
| C32 | Wiki Bowman page (edited 2026-09-03): catching talents emphasised (Bug Enthusiast, Sunset on the Hives, Briar Patch Runner, Teleki'net'ic Logs); Speedna caps at 1000% speed; Flax Instastring works only on single targets; Magic Shortbow requires active combat to trigger against nearby enemies. | https://idleon.wiki/wiki/Bowman | 3 | M |
| C33 | Wiki Siege Breaker page (edited 2026-09-03): unlocked as the elite stage from Bowman; 15 talents; Pirate Flag Plunderous mobs have x(10+1 per 5 levels) HP and +(800+20 per level)% EXP and drop; killing them enables coin drops that respawn mobs; the effect persists beyond the 6-minute buff while the flag is active; no explicit talent priority given. | https://idleon.wiki/wiki/Siege_Breaker | 3 | M |
| C34 | Wiki Archer page (edited 2026-09-03): primary stat AGI, accuracy stat STR, weapon bows, specialisation Smithing; wiki build advice is to specialise in Smithing, Catching and Trapping; Garb of Un'agi'ng Quality up to 1.5% per level. | https://idleon.wiki/wiki/Archer | 3 | M |
| C35 | Toolbox community build 'Bowman/Catching' by Sir_Grimtide (29 likes, 5,211 views, created 2026-06-02, updated 2026-10-12, tags afk/damage/skilling/early-mid): DAMAGE preset tab 1 Gilded Sword > Sharpened Axe > 50 Idle fighting talent > Featherweight > Quickness Boots, then Fist of Rage (to accuracy need) > max Quickness Boots > Idle Shooting > Lucky Clover; tab 2 High Polymer Limbs > Strafe > Veins of the Infernal > 40 Piercing Arrow = 10 Kung Fu Kick, 40 Have Another! > Garb > Sanic Speed, optional Smeltin' Erryday or Robbinghood; tab 3 Speedna > Agi Again > Velocity Vessels (by bubble level) > Shwifty Statues > Previous Points, 50 Magic Shortbow = 20 Homing Arrows > 1 Flax Instastring > Shoeful of Obol; star tab 1 Will of the Eldest > Beginner Best Class (cap 10% of top level), Tick Tock = Attacks on Simmer = Goblet of Hemoglobin; star tab 2 Dungeonic Damage > Frothy Malk > Telekinetic Storage, 1 each Printer Sampling and Shrine Architect. | https://builds.idleontoolbox.workers.dev/api/builds/b0sGrY | 4 | M |
| C36 | Same build, SKILLING preset: tab 1 Elusive Efficiency > Quickness Boots > Broken Time (optional Star Player); tab 2 Garb > Sanic Speed > Focused Soul, Acme Anvil > Yea I Already Know > Godly Creation; tab 3 Teleki'net'ic Logs > Briar Patch Runner > Bug Enthusiast > Sunset on the Hives > Agi Again > Shwifty Statues (optional Shoeful of Obol); tab 4 Symbols of Beyond > Adaptation Revelation > Skill Ambidexterity; star tab 1 Tick Tock = Toilet Paper Postage = Will of the Eldest; star tab 2 Supersource > Action Frenzy > Frothy Malk > Telekinetic Storage. | https://builds.idleontoolbox.workers.dev/api/builds/b0sGrY | 4 | M |
| C37 | Anonymous 'Bowman Build' (6 likes, updated 2026-09-29, tags active/mid-game): Bowman's core is Speedna, aim for 145% move speed with Featherweight and Strafe; Featherweight to 20 first, then Gilded Sword > Sharpened Axe, extra into AGI or Broken Time; archer tab 1 point in each active skill, max High Polymer Limbs, 50 Have Another, 20 Veins; Strafe about 85 points; Bowman tab 1 point in active skills then max Speedna; STR as needed for accuracy. | https://builds.idleontoolbox.workers.dev/api/builds/KvgS3N | 4 | M |
| C38 | 'Archer / AFK (~35)' (updated 2026-06-12): reach the farthest zone (Crabcakes) to pick the subclass; Sharpened Axe > Gilded Sword to 50 each and within 10 levels of each other; Fist of Rage for accuracy; Archer tab: Polymer Limbs 50, active attacks 20, Strafe 1 (activate before AFK), Have Another 10, Veins 1. | https://builds.idleontoolbox.workers.dev/api/builds/rbLex2 | 4 | M |
| C39 | 'Bowman / Active (~50)' (updated 2026-08-05): Featherweight 5-20 > Gilded > Sharpened (100 each), Fist of Rage as needed, target 130% move speed (about 40 Strafe points) or ideally 145%; 1 point in each active; High Polymer Limbs 100; Veins 15; Speedna 70-90; Previous Points with extras. | https://builds.idleontoolbox.workers.dev/api/builds/AzC7Pk | 4 | M |
| C40 | 'Bowman / AFK (~70)' (updated 2026-10-02): Idle Shooting 50; Featherweight 5-20; Axe and Gilded 50; Piercing Arrow 50, Kung Fu Kick 25, High Polymer Limbs 100, Veins 30, Strafe with spare points; Homing Arrows 25, Magic Shortbow 50, Extendo Rangeo 1, Speedna 60; activate Strafe and Extendo before AFK; raise Smithing level (the build suggests producing 2/3x thread). | https://builds.idleontoolbox.workers.dev/api/builds/h5TEWG | 4 | M |
| C41 | 'Bowman / AFK (~90)' (updated 2026-10-08): Idle Shooting 100; Axe and Gilded 75; Featherweight 20; Piercing Arrow 25, Kung Fu Kick 50, Strafe 100, High Polymer Limbs 100, Veins 100; Homing Arrows 25, Magic Shortbow 50, Speedna 100, Extendo for accuracy. 'Bowman / Active (~90)' (updated 2026-08-23): Axe and Gilded 100, Featherweight 20, Piercing Arrow 40 (to hit 3 mobs), Have Another 50, Veins 100, Polymer 100, Strafe about 85 for 145%, Speedna 100, Previous Points 100. | https://builds.idleontoolbox.workers.dev/api/builds/tq1zPL; https://builds.idleontoolbox.workers.dev/api/builds/T9afQi | 4 | M |
| C42 | 'Bowman / AFK (~150)' (22 likes, updated 2026-10-19, endgame): attacks at Lv 25 each is enough to reach the damage cap (more points into attacks and Have Another if using prayers that raise mob HP); Axe, Gilded, Idle Shooting, Broken Time, Strafe, Garb, Polymer, Robbinghood, Veins, Focused Soul, Speedna, Shwifty, Agi Again all about 160; Quickness Boots 260; Featherweight last because it falls off at high level; Shoeful 100; Book of the Wise 100; level WIS and STR after other talents are maxed. | https://builds.idleontoolbox.workers.dev/api/builds/FEXoK0 | 4 | M |
| C43 | 'Catching Active / AFK 100+' (12 likes, updated 2026-10-09): use Buttered Toasted Butter; do not level catching above the Mman's (Maestro) catching level; tab 1 Elusive Efficiency > Quickness Boots (200) > Broken Time; tab 2 Sanic Speed > Garb > Focused Soul, Acme Anvil maxed, Robbinghood for rares, Smeltin' Erryday; tab 3 Sunset on the Hives, Briar Patch Runner, Teleki'net'ic Logs, Shwifty Statues, Agi Again, Shoeful. | https://builds.idleontoolbox.workers.dev/api/builds/1CzVlL | 4 | M |
| C44 | 'Bowman Boss Killer' (3 likes, updated 2026-05-31): needs 4 movement-speed foods plus boost-food effect (cards, Yum Yum Desert set, post office box, King of Food trophy), or the boss card set with only 3; all main talents 100, Homing Arrows 100, Speedna 100, Quickness Boots 200, I See You 100. Library order: Gilded > Sharpened > Featherweight > AGI > I See You; tab 2 High Polymer Limbs > Strafe > Veins > Sanic Speed > Garb; tab 3 Speedna > Homing Arrows > Agi Again > Shwifty Statues > Shoeful. | https://builds.idleontoolbox.workers.dev/api/builds/baHxc0 | 4 | M |
| C45 | 'Siege Breaker - AFK - W4' (1 like, updated 2026-10-17): tab 4 Archlord of the Pirates maxed, 1 point each in The Family Guy, Firebomb, Pirate Flag, Plunder Ye Deceased, Cannonball, Stacked Skulls, Symbols of Beyond ~G, Suppressing Fire maxed; Bowman tab Homing Arrows maxed, 1 Magic Shortbow, Flax Instastring and Extendo maxed, Speedna maxed; archer tab Piercing Arrow, Strafe, High Polymer, Sanic, Veins maxed, Have Another 14; skill bar order Pirate Flag, Homing Arrows, Suppressing Fire, Cannonball, Piercing Arrow, Firebomb, Extendo Rangeo, Strafe. | https://builds.idleontoolbox.workers.dev/api/builds/Z7fjwI | 4 | M |
| C46 | Build text names Idle Brawling (id 88, Warrior) on the Archer's tab 1 in the Sir_Grimtide guide; the Archer talent is Idle Shooting (268). | https://builds.idleontoolbox.workers.dev/api/builds/b0sGrY; packages/toolbox-parsers/vendor/data/website-data/talents.json | 4 | H |
| C47 | Builds tagged 'Community Guide' with updatedAt 2026-04-26 are the legacy import of the old curated list and carry 2021-22 era version tags; treat the ones that were not edited since (for example Bowman Active ~70/~50 and Hunter lines) as stale until a 2026 source agrees (carried from earlier research). | docs/research/systems/2026-10-17-character-builds.md; builds API createdAt 2026-04-26 | 4 | L |
| C48 | ActiveOn today: Knowledge Base has Archer, Bowman fighting and skilling build entries (talents.build.archer-*, bowman-*, confidence L) built from b0sGrY; no Siege Breaker build entry; no Speedna / move-speed / Strafe-uptime check; no Pirate Flag, Plunderous, family-bonus or Fast Boi Talent entry; class emblems exist for Archer, Bowman, Hunter, Beast Master, Siege Breaker; exact talent points are ported (talent-points-formula.ts). | packages/knowledge/systems/talents.yaml#L352-L520; apps/activeon/src/art/sprites/grids/classes.ts; packages/account-state/src/talent-types.ts | 1 | M |
| C49 | Search coverage for this dossier: the web search quota was exhausted before any Reddit, Steam or guide-sheet queries, so no Reddit/Steam/sheet Bowman or Siege Breaker thread was read. Wiki pages and the Toolbox community builds API were read directly on 2026-10-19. | session note | 4 | L |
| C50 | Previous Points gives +1 talent point to the Archer (tab 2) per level; Fast Boi Talent adds points to each tab for Archers. Both feed the point budget that Speedna, Veins and attack levels draw on. | packages/toolbox-parsers/vendor/data/website-data/talents.json 299; cauldrons.json a13 | 1 | H |
| C51 | Move-speed extras beyond Featherweight and Strafe: stamps, food, the Tip Toe Quickness star talent (tab 1-2 star, applied above 1.75 and in the 1.75 cap tier), Salt Lick, Grounded Motherboard chip and Tuft of Hair sigil feed the speed tiers, which are the input to Speedna and Quick Slap. | packages/toolbox-parsers/vendor/parsers/character.ts#L3191-L3226 (TIPTOE_QUICKNESS at L3214) | 1 | H |
| C52 | More agility-gated class bubbles (getBubbleBonus with mainStat === 'agility'): Quick Slap (base damage scales with speed above 110%, damage.ts#L907), Quickdraw Quiver (L107), Lil Big Damage (L219), Bow Jack (L349), Power Tritwo (L354), Cheap Shot (L1222), Fly In Mind (catching AFK, character.ts#L3522), Sanic Tools (skill tool efficiency, efficiency.ts#L500, L561); Tome Agility reported by the game-data lens, not traced here. | packages/toolbox-parsers/vendor/parsers/damage.ts; character.ts; efficiency.ts | 1 | H |
| C53 | Archer-or-Bust-gated bubbles that serve only the Archer line: Cuz I Catch Em All (trap shiny chance, traps.ts#L183-L184) and Anvilnomics (anvil cost reduction, anvil.ts#L164-L165), both gated on isArcher. | packages/toolbox-parsers/vendor/parsers/world-3/traps.ts#L184; world-1/anvil.ts#L165 | 1 | H |
| C54 | Eliteus quest coin rewards: 750,000,000 (Eliteus1) and 150,964,823 (Eliteus2); Eliteus stands on map 154. | packages/toolbox-parsers/vendor/data/website-data/quests.json (Eliteus); shared-data.json npcPlacements | 1 | H |
| C55 | Unconsumed Archer-tab skilling talents (no Toolbox consumer found): Smeltin' Erryday, Yea I Already Know, Godly Creation. ActiveOn cannot read their effect from Toolbox output. | grep of packages/toolbox-parsers/vendor/parsers (empty result, game-data lens) | 1 | M |
| C56 | Fast Boi Talent also grants talent points to the secret class, so it is not Archer-only (correcting the "Archers only (not master classes)" phrasing in C31). | packages/toolbox-parsers/vendor/data/website-data/cauldrons.json a13 (bigBase 5+L per tab) | 1 | M |
| C57 | Shoeful of Obol (obol AGI) and Garb of Un'agi'ng Quality (gear AGI) feed AGI, which drives Speedna's speed input, Stacked Skulls, Ambidexterity, Briar Patch and efficiency. Both are inside the saved stat, not separate Toolbox lines. | packages/toolbox-parsers/vendor/data/website-data/talents.json (tabs Archer, Bowman); parsers/character.ts#L3191-L3226 | 1 | M |
| C58 | Symbols of Beyond is read from tab 4 (the SB tab) for every class's added talent levels and is itself banned from added levels (talent 374). | packages/toolbox-parsers/vendor/parsers/talents.ts#L305-L388; vendor/utility/talentBans.js#L9-L12 | 1 | H |
| C59 | Account-wide Archlord workbench multiplier: lavaLog(accountOptions[139]) scales EXP and drop rate for every character, not only a talent display. | packages/toolbox-parsers/vendor/parsers/character.ts#L2179-L2184, L2404 | 1 | H |
| C60 | Speccius and Promotheus are one-time class picks in the data; no re-pick quest exists in quests.json for the Archer line (re-picking uses Talent Point Reset Potions and the class-change items outside this line). Subclass re-pick/reclaim is an open question. | packages/toolbox-parsers/vendor/data/website-data/quests.json (Speccius, Promotheus) | 1 | L |
