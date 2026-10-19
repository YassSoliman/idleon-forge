# Dossier: Class line Mage, Wizard, Elemental Sorcerer

Topic id `class-wizard`. Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Claims are numbered [C1]..[C60]; the Claims register at the end gives each one's Source and tier. Tier key (this task): 1 game data / Toolbox code, 2 Toolbox logic and dashboard, 3 IdleOn wiki, 4 community (Toolbox user builds, guides). "Vendor" means `packages/toolbox-parsers/vendor/`; "N.js" is the game client dump. Where sources disagree both views are given with a confidence (H/M/L). Every claim in the register now carries a confidence (H verified in tier-1 data or code, M partly verified or one-lens, L unverifiable in this pass). Revised 2026-10-19 after two adversarial verdict sets (source lens, game-data lens); **Disputed** marks a claim one lens refuted. No real account data appears.

Search note: the web-search budget was already spent, so Reddit, Steam, IdleOn Academy and public guide sheets were not re-searched. Community content (tier 4) comes from the Toolbox community builds already cached in the work dir (updated 2026-05 to 2026-10-19) and from the earlier character-builds research. Wiki pages were fetched directly (rev 2026-09-03 and 2026-10-07).

## Class line: Mage, Wizard, Elemental Sorcerer

- **What it is:** The WIS line. Beginner becomes Mage, Mage becomes Wizard (or Shaman), Wizard becomes Elemental Sorcerer (ES) [C1]. Mage specialises in Choppin, Wizard in Worship, ES in Divinity [C56][C57]. The line uses a wand, WIS for damage and AGI for accuracy [C3][C4]. Its identity is MP: Overclocked Energy turns max MP into damage, and four talents raise max MP, WIS or both [C14][C15][C16].
- **Unlocks:**
  - **Mage:** **Disputed (C5).** Scripticus8 is only the gate quest (reach Map 3, get a class, buy 25 upgrades); the Mage pick itself is made with Promotheus (quest Promotheus2, the class-choice quest listed in `quests.ts#L57`). Class level 10 per earlier research (L) [C5].
  - **Wizard:** Speccius in the Yum Yum Desert. Speccius1 (100 Kebab Sticks, 50 Crabby Cakey) then Speccius2 (pick the sub-class) [C6]. The level gate is not in the data (open question Q1). A community Mage build says "reach Crabcakes to choose your subclass" [C54].
  - **Elemental Sorcerer:** Eliteus on W4 map 154, no choice (one `promotesTo`), see dossier elite-classes [C1][C57].
  - **Each new tab starts every talent at max level 100** (client-only, confidence L) [C8].
- **Scope:** per character for talents. Account-wide pieces: the family bonuses (best character in the line) [C29], ES talents Wormhole Emperor, God's Chosen Children and Shared Beliefs (best talent across the roster) [C44], and the Eternal WIS Voidwalker talent that lifts Book of the Wise's cap account-wide [C24].
- **Inputs to outputs:** Talent points (by tab, from class level, skill levels, stamps, bubbles) in [C28]; damage, AFK kill rate, Worship charge, Choppin and Divinity efficiency out. MP and WIS in as the damage inputs [C14][C16].
- **Goals and Milestones:**

| Goal | Threshold | Why | Claim |
|---|---|---|---|
| Take Mage | Pass the Scripticus8 gate, then pick Mage at Promotheus2 | tab 2 | [C5] |
| Idle Casting 50 | 10% of a 14.3% cap | first AFK talent | [C19][C49] |
| Accuracy | 100% hit chance, no more AGI | cap AGI points | [C4] |
| Overclocked Energy | Lv 50 then 75 then 100 | damage per power of 10 MP | [C14][C52] |
| Family: Mage | Lv 9, then +1 WIS per 5 levels | passive | [C29] |
| Family: Wizard | Lv 29, then +1 star point per 6 levels | star points | [C29][C30] |
| Subclass | Speccius2 | tab 3 | [C6] |
| Attack talents | 25 each for AFK, 1 each for active | bar | [C20][C52][C53] |
| Max-level raisers | Wis Wumbo, Fuscia Flasks (cap = Mage Is Best bubble level) | Book of the Wise, Overclocked Energy | [C24][C25] |
| ES | Greenie Gang, map 154 | tab 4, family bonus from ES Lv 70 | [C29][C57] |

- **Feeds / fed by:** Fed by class levels, skill levels, stamps, the High-IQ cauldron bubbles [C47], the Smart Boi Talent bubble [C27], the Talent Book Library (not for 12, 446, 447) [C26], Voidwalker Eternal WIS [C24], Paperwork's stamp count [C33], Choppin minigame score [C32], Grass Leaves and Forest Souls in storage [C36], unlocked gods [C44]. Feeds damage, AFK kills, Choppin efficiency [C36], Worship charge [C38], statue bonuses [C39], star-tab talent points [C30], Divinity (Shared Beliefs, Believer Strength, Polytheism) [C43][C44], talent levels for the whole roster (ES family) [C29][C42].
- **Per-session actions:** Check the preset matches the activity (damage preset when AFK fighting, skilling preset when chopping or worshipping). Check attack talents are on the bar and levelled to about 25 [C20]. Re-aim AGI to just reach 100% hit chance [C4]. Spend new talent points. Move Charge Syphon use to a character that is full of charge [C38]. Never a Verdict on unspent points: remaining points are not in Toolbox (earlier research), though ActiveOn has its own point calculator.
- **AFK Setup implications:** Damage preset (Idle Casting, attacks on bar) for AFK fighting; skilling preset (Smart Efficiency, Active AFK'er, Log On Logs on the bar) for Choppin; Wizard worship preset (Charge Syphon, Sooouls, Nearby Outlet) for Worship [C50]. ES is the Divinity character [C57].
- **Min-max by stage:** see the section below.
- **Common mistakes:**
  1. Putting AGI points past 100% hit chance [C4].
  2. Idle Casting at 0 while AFK fighting [C19].
  3. Levelling attacks that are not on the bar, or levelling Teleport, Speedy Book, Mana Is Life and Log On Logs for AFK kills: they have D = K = 1 and add nothing [C20].
  4. Expecting a Library book to lift Book of the Wise, Overclocked Energy or Farsight: those three are excluded [C26].
  5. Buying Fuscia Flasks past the Mage Is Best bubble level: the cap is `min(Fuscia, bubble level)` [C25].
  6. Putting Occult Obols or Unt'wis'ted Robes before gear WIS is high: both multiply gear WIS [C40][C49].
  7. Skipping the Wizard in favour of a Shaman by accident: the sub-class pick is permanent short of a class redo (which quests Class Redo re-opens is Disputed, confidence L) [C7].
- **Save and Toolbox fields:** see the catalogue. Talents: `characters[].flatTalents[]` (`name`, `baseLevel` bought, `level` with added levels, `maxLevel`), `characters[].talents[0..3].orderedTalents`, `characters[].talentsLoadout` (attack bar), raw `SL_<id>`, `SM_<id>`, `AttackLoadout`. ActiveOn: `characters[].talents.tabs`, `.talentPoints`.
- **Sources:** the register at the end.

## Mechanics catalogue (W1 to W4, with W5+ one-liners)

Notation: `char` is a parsed `characters[i]`. "Field" is the exact Toolbox path. Formula notation follows [C13]; values are at L25 / L50 / L100 (base level, no added levels). The generic field for every talent is `char.flatTalents[name]` with `.baseLevel`, `.level`, `.maxLevel` (raw `SL_<id>`, `SM_<id>`), and the bonus function is `getTalentBonus(char.flatTalents, NAME)` (talents.ts#L31).

### M1. Class progression and choices
- **Rule:** Beginner, then Mage, then Wizard or Shaman, then ES or Bubonic Conjuror [C1]. Quests: Scripticus8 is the gate and Promotheus2 the base-class pick (Disputed, C5), Speccius1/2 for the sub-class, Eliteus for the elite [C5][C6][C57]. Class Redo re-opens Promotheus2 and Scripticus8 per Toolbox; Speccius2/Eliteus2 re-opening is unconfirmed by tier-1 code (Disputed, L) [C7].
- **Cap/unlock:** the Mage gate (Scripticus8) needs Map 3, a class and 25 upgrades; the level gate is not in the data [C5]. Sub-class level gate unverified (Q1). Elite has no level gate (elite-classes dossier).
- **Cost:** Speccius1 asks 100 Kebab Sticks and 50 Crabby Cakey, pays 2x 2 HR candy, 1 Talent Point Reset Potion, 5 Reset Fragments [C6].
- **Fields:** `char.class`, `char.classIndex` (31 Mage, 32 Wizard, 34 ES), `char.quests.Promotheus[2]`, `char.quests.Scripticus[8]`, `char.quests.Speccius[1..2]` [C1][C5][C6]. W5+: ES promotes to Spiritual Monk, unreleased (placeholder family bonus decay 25/100 from Lv 69, no tab) [C1][C61].

### M2. Tab layout and talent max level
- **Rule:** Mage line tabs are Savvy_Basics, Mage, Wizard, Elemental_Sorcerer, 15 talents each [C2]. Each new tab's talents start at max level 100 [C8]. The Library can raise most to 101-125+ [C26]. Three Mage-line talents have their own raisers (M3).
- **Fields:** `char.talents[0..3]`, `flatTalents[].maxLevel`, `char.talentPreset` (second preset) [C2].

### M3. Max-level raisers (Book of the Wise, Overclocked Energy, Farsight)
- **Rule:** Book of the Wise max = 100 + Wis Wumbo L + Utmost Intellect L + Eternal WIS [C24]. Overclocked Energy max = 100 + min(Fuscia Flasks L, Mage Is Best bubble level) [C25]. Farsight uses Fantasia Flasks (Shaman) the same way [C25]. Library books cannot lift 12, 446 or 447 [C26].
- **Cap:** the practical cap is the bubble level for 446 (a Mage Is Best bubble at 150 allows 250 only if Fuscia is also 150); Wis Wumbo 100 gives Book of the Wise 200 before ES [C24][C25].
- **Fields:** `flatTalents[BOOK_OF_THE_WISE|OVERCLOCKED_ENERGY].maxLevel`; bubble level `account.alchemy.bubbles['high-iq'][1].level` (Toolbox `getBubbleBonus(account,'MAGE_IS_BEST')`) [C25].

### M4. Talent points
- **Rule:** per tab from class level, skill levels and bonuses [C28]; the Smart Boi Talent bubble adds N points to each of tabs 1-4 for the Mage line [C27]; Earlier Education adds +1 per level to tab 2 [C27]; the Wizard family bonus adds star points [C30]; Star Player adds star points [C9].
- **Cost/cap:** 1 point = 1 level; Resets: Talent Point Reset Potion zeroes the active preset (index < 615), confidence L, not verifiable in data [C59].
- **Fields:** ActiveOn `characters[].talents.active.talentPoints` (own port of TotalTalentPoints), `account.talentPoints` (CYTalentPoints, item bonus); Toolbox star total `calcTotalStarTalent` [C30].

### M5. Tab 1 (Savvy Basics) shared talents
- **Health Booster** (0) add 1/0.15: 73.8 / 241 / 858 HP; **Mana Booster** (1) add 1/0.1: 57.5 / 177 / 605 base MP; **Sharpened Axe** (5) add 0.4/0: base WP 10 / 20 / 40; **Gilded Sword** (6) add 1.5/0: damage 37.5 / 75 / 150 %; **Star Player** (8) +1 star point per level; **Bucklered Up** (9) decay 40/60 total DEF: 11.8 / 18.2 / 25 %; **Quickness Boots** (11) +L base AGI (accuracy); **Book of the Wise** (12) +L base WIS; **Lucky Clover** (13) +L LUK; **Fist of Rage** (10) +L STR (useless for a mage) [C9][C13]. Fields: HP and MP in `getMaxHp`, `getMaxMp` [C15]; damage in `getBaseDamage`/`getDamagePercent` [C17].

### M6. Mage-only tab 1 talents
- **Smart Efficiency** (445) add 1/0.02: 31.5 / 75.5 / 201 % efficiency for specialised skills; Toolbox counts it 10x in one Skill Mastery branch [C36].
- **Overclocked Energy** (446) decay 150/80: 35.7 / 57.7 / 83.3 per power of 10 max MP; damage = log10(maxMp) x value in the additive group [C14]. Cap via Fuscia Flasks [C25].
- **Farsight** (447) decay 17/45 (crit chance) and 33/45 (crit damage): 6.07 / 8.95 / 11.7 % and 11.8 / 17.4 / 22.8 % [C18]. Toolbox uses y for both (Q2).
- **Idle Casting** (448) decay 20/50: 6.67 / 10.0 / 13.3 % Fighting AFK gains [C19].
- **Active AFK'er** (449) decay 20/40: 7.69 / 11.1 / 14.3 % skill AFK gains [C19].

### M7. Mage tab, attacks
- **Energy Bolt** (450) bigBase 200/3.5: 288 / 375 / 550 % damage, next basic attack, cooldown 8 s, cast 0.5, 4 mana, needs a wand. D 1.21, K 1.0 [C20][C22].
- **Mini Fireball** (451) bigBase 130/1.5: 168 / 205 / 280 %, cooldown 6, 6 mana. D 1.2, K 1.05 [C20][C22].
- **Teleport** (453) bigBase 25/1: 25+L pixels, cooldown 1 s, 2 mana; D = K = 1, so it adds nothing to AFK [C20][C22].
- **Attack-bar AFK rule:** each on-bar attack multiplies D and K by `(x)(1+min(1, L/(L+100)))`, K clamped 1 to 2.2 [C20]. Field `char.talentsLoadout`, per talent `AFKactivity`, `D`, `K` [C20].

### M8. Mage tab, damage passives
- **Knowledge Is Power** (455) add 1.5/0: 37.5 / 75 / 150 % more effect of WIS on damage [C16].
- **Power Overwhelming** (457) add 1.2/0: 30 / 60 / 120 % more effect of Weapon Power [C17].
- **Mana Overdrive** (452) add 0.5/0.02: +% max MP: 19 / 50.5 / 151 [C15].
- **You're Next** (454) basic attacks mark: chance decay 110/25 (55 / 73 / 88 %), marked take bigBase 35/1 % more (60 / 85 / 135 %). No Toolbox consumer [C41].
- **Individual Insight** (459) +L base WIS. **Unt'wis'ted Robes** (456) add 1.5/0: gear gives 37.5 / 75 / 150 % more WIS [C40].
- **Choppin It Up Ez** (463) x: +L % Choppin minigame rewards; y: decay 5.7/50 % damage per 25 minigame points (1.9 / 2.85 / 3.8) [C32].
- Fields: `damageFromStat`, `getBaseDamage`, `getMaxMp` [C15][C16][C17]; minigame score `account.minigame` (`getMinigameScore(account,'chopping')`) [C32].

### M9. Mage tab, Choppin utility
- **Log On Logs** (460) buff: intervalAdd 2/10 minutes (4 / 7 / 12) and bigBase 14/1.86 % more logs (60 / 107 / 200), cooldown 30 s, 5 mana, AFKactivity 3 [C22]. Put on the bar while chopping [C55].
- **Leaf Thief** (461) decay 25/70 % Choppin efficiency per power of 10 Grass Leaves in storage (6.6 / 10.4 / 14.7) [C36].
- **Deforesting All Doubt** (462) add 0.75/0: WIS effect on Choppin efficiency (+18.8 / 37.5 / 75 %) [C36].
- **Inner Peace** (464) add 1/0 % EXP for all specialised skills [C37].
- **Free Meal** (458) decay 53/40 chance food not consumed: 20.4 / 29.4 / 37.9 % (capped by bubble and jewel maths) [C35].

### M10. Wizard tab, attacks
- **Ice Shards** (465) bigBase 70/1: 95 / 120 / 170 %, three hits, freezes mobs, cooldown 10, 12 mana, needs a wand. D 1.3, K 1.1 [C20][C22].
- **Floor Is Lava** (466) 1+floor(L/40) volcanoes (x2 per cast) at bigBase 120/1 % (145 / 170 / 220). Cooldown 11, 25 mana. D 1.3, K 1.1 [C20][C22].
- **Tornado** (467) 20+0.3L % and lasts 4+floor(L/20) s (5 / 6 / 9). Cooldown 20, 30 mana. D 1.3, K 1.1 [C22].
- **Speedy Book** (468) 4 kills in 4 s gives 10+0.2L % attack rate (15 / 20 / 30 %) for 3+floor(L/15) s. No Toolbox consumer; D = K = 1 [C41][C20].
- **Mana Is Life** (469) x: 25+0.35L % of damage taken goes to MP (33.8 / 42.5 / 60); y: decay 40/100 Multikill per damage tier (8 / 13.3 / 20) while the 60 s buff runs [C34].

### M11. Wizard tab, passives
- **Paperwork, Great...** (470) decay 70/100 % damage per 10 stamps collected (14 / 23.3 / 35) x stamps/10 [C33]. Field `account.stamps` count via `calcStampCollected` [C33].
- **Occult Obols** (486) decay 135/80: obols give 32 / 52 / 75 % more WIS [C40].
- **Staring Statues** (472) decay 100/50: Exp, Lumberbob and Beholder statues +33 / 50 / 67 % more [C39].
- **Wis Wumbo** (488) +L max level for Book of the Wise [C24]. **Fuscia Flasks** (474) +L max level for Overclocked Energy, capped by the Mage Is Best bubble level [C25].
- **Earlier Education** (494) +1 talent point on tab 2 per level [C27].

### M12. Wizard tab, Worship
- **Charge Syphon** (475) active buff: steals x% of all characters' charge (bigBase 35/0.3: 42.5 / 50 / 65 %) and +y Max Charge for 1 min (bigBase 4000/1000: 29k / 54k / 104k). Cooldown 3600 s, 10 mana, AFKactivity -2 [C38][C22].
- **Sooouls** (476) decay 25/70 Worship efficiency per power of 10 Forest Souls in storage (6.6 / 10.4 / 14.7) [C36].
- **Bless Up** (477) add 1/0 % Worship EXP [C37].
- **Nearby Outlet** (478) decayMulti 1/100 charge-rate multiplier (1.2x / 1.33x / 1.5x), used as `max(x,1)` [C38].
- Fields: `char.worship.maxCharge/chargeRate/currentCharge`, `getChargeWithSyphon(characters)` (`bestWizard`, `bestChargeSyphon`) [C38].

### M13. Elemental Sorcerer, attacks
- **Meteor Shower** (495) bigBase 200/2.5 % (262 / 325 / 450) and 10+floor(L/7) meteors (13 / 17 / 24). Cooldown 12, 90 mana. D 1.2, K 1.2 [C22][C20].
- **Lightning Barrage** (496) bigBase 700/8 % to 2+floor(L/20) mobs. Cooldown 4, 40 mana, needs a wand. D 1.3 [C22][C20].
- **Radiant Chainbolt** (497) bigBase 50/4 %, bounces 3+floor(L/10). Cooldown 8, 50 mana. K 1.3 [C22][C20].
- **Dimensional Wormhole** (498) decay 17/70 % XP and drop per wormhole kill (4.5 / 7.1 / 10), lasts 43+0.2L s, cooldown 120, 100 mana. Wormhole kills are counted for Wormhole Emperor [C45][C44].
- **Chaotic Force** (499) decay 75/110 chance a basic attack spawns a Fireball, Tornado or Volcano (13.9 / 23.4 / 35.7). No Toolbox consumer [C41].

### M14. Elemental Sorcerer, passives and Divinity
- **Believer Strength** (500) decay 7/100: Weapon Power per 10 Divinity levels (1.4 / 2.3 / 3.5) [C44].
- **Memorial Skulls** (531) decay 40/100 % Kill-per-Kill per 1000 WIS (8 / 13.3 / 20); off from W7 [C44].
- **Skill Wiz** (532) x decay 60/80 % bigger WIS effect on skill efficiency (14.3 / 23.1 / 33.3), y +intervalAdd WIS [C36].
- **Utmost Intellect** (533) x decay 15/100 % WIS (3 / 5 / 7.5), y +L max level for Book of the Wise [C24].
- **The Family Guy** (144) decay 40/100 % bigger family bonuses [C46].
- **Polytheism** (505) decay 70/200 (7.8 / 14 / 23.3): second god, index `level % 10` [C43].
- **Shared Beliefs** (506) decay 100/100 % Divinity EXP for all (20 / 33 / 50), best on account [C44].
- **God's Chosen Children** (507) decay 10/200 % damage per unlocked god beyond 10 (W5+ state) [C44].
- **Wormhole Emperor** (508) decay 1.5/150, damage multiplier from log10(wormhole kills) (0.21 / 0.38 / 0.60 per log), best on account [C44].
- **Symbols of Beyond ~P** (539) intervalAdd 1/20: +1+floor(L/20) levels to all talents above Lv 1 (2 / 3 / 6) [C42].

### M15. Added talent levels
- **Rule:** level = base + added levels. Added: Arctis god bonus (ceil), Symbols of Beyond, achievement 291 (+1), ES family floor, companion, ninja mastery tier 3 (+5), Equinox, Grimoire, Kattlekruk set, Tesseract (cap 5), Superbit (+1 per 100 levels above 500) [C42]. ES family bonus: decay 20/350 from ES Lv 70: roughly 1.6 levels at Lv 100, 5.5 at Lv 200 [C29].
- **Fields:** `char.addedLevels`, `char.addedLevelsBreakdown`, `char.familyBonuses.Elemental_Sorcerer` [C42][C29].

### M16. Class family bonuses (Mage line)
- **Mage:** +Total WIS = 1 + floor((Lv-9)/5), from Lv 9 [C29]. No Toolbox consumer found (Q3) [C31].
- **Wizard:** +Star Tab Talent Points = 1 + floor((Lv-29)/6), from Lv 29. Counted in the star total (e.g. 6 at Lv 59) [C29][C30].
- **Shaman (same tree):** golden-food bonus 1 + 0.4 L/(L+100) from Lv 29 [C29].
- **ES:** see M15.
- **Fields:** `char.familyBonuses[className]`, `getCharacterFamilyBonus` [C30].

### M17. Skill, damage and bubble interactions (Mage line)
- **MP-based damage stack:** WIS (stat, with Knowledge Is Power and Smarter Spells), Power Overwhelming and Wand Pawur on the weapon, Overclocked Energy and Name I Guess on MP, Paperwork on stamps, Choppin It Up Ez on the minigame, Believer Strength on Divinity [C14][C16][C17][C32][C33][C44][C47].
- **Fields:** `char.stats.wisdom`, `playerInfo.maxMp`, `getMaxDamage`.

### M19. Magician Starterpack (post office) and MP-gated casting
- **Rule:** the Magician Starterpack post-office box gives per upgrade tier: +Base Max MP (intervalAdd 1/3), +% Max MP (add 0.1/0), and +% faster cooldowns (decay 17/200). Base MP feeds the max-MP sum, the % feeds the max-MP multiplier, and the cooldown value is the "box bonus 2" in the cooldown divisor [C15][C23][C62].
- **MP as a gate:** every attack talent has a mana cost (4 to 100 per cast); max MP is therefore both a damage input (Overclocked Energy) and the budget for the bar [C22][C14]. Mana regeneration is not modelled by Toolbox (no parser reference found), so any regen advice is unverified (L) [C62].
- **Fields:** `char.postOffice` via `getPostOfficeBonus(..., 'Magician_Starterpack', 0|1|2)` [C62].

### M20. Hema Overdrive, Wand Pawur, Smarter Spells, Hyperswift
- **Hema Overdrive** (an AGI-line talent) is added to Mana Overdrive in the max-MP percentage group, so it applies to a Mage too if learned [C15][C63].
- **Smarter Spells** bubble adds to Knowledge Is Power in the WIS-on-damage term (WIS main stat only). **Wand Pawur** adds weapon power for WIS or LUK main-stat classes. **Hyperswift** feeds the AFK kill-rate path (`getKillsPerHour`) for WIS main stat [C16][C63].
- **Wands:** the Mage line uses wands as weapons; the base damage stat and power are capped together (`min(150, 2*WP + stat term)`) and Power Overwhelming scales WP inside that term [C17][C63].
- **Fields:** `getBubbleBonus(account,'SMARTER_SPELLS'|'WAND_PAWUR'|'HYPERSWIFT')` [C63].

### M21. Presets, attack bar and Super Talents
- **Presets:** a character has two talent presets (`talentPreset`, selected preset id). Only the active preset's attack bar (`talentsLoadout`) drives AFK targeting, and Toolbox ties Super Talent spending to the selected preset [C20][C64].
- **Super Talents:** added levels come from the W7 Legend/Super Talents system (`getSuperTalentLeftToSpend`, `superTalentsInfo`); how it interacts with Mage-line talents beyond the added-level pipeline is not traced (L) [C42][C64].

### M22. Star talents for the Mage line
- **Star Player** (tab 1, id 8) and **Supernova Player** add star points; the star-tab talent **Stonks!** adds star points via `flatStarTalents`. Total star points also include stamps, guild, dungeon Flurbo, cards, a sigil and achievements 212, 289, 305; the Wizard family bonus is one summand [C9][C30][C65].
- **Attacks On Simmer** (star talent) adds to the AFK damage term, capped at 25 [C21]. Community builds put Stonks! to 30 first [C49].
- **Fields:** `char.flatStarTalents`, `calcTotalStarTalent(characters, account)` [C65].

### M23. Worship loop (Wizard)
- **Rule:** Charge Syphon takes a share of all characters' charge into the casting character and raises Max Charge for 1 minute, so it belongs on the character that has the most charge to steal and the largest cap [C38]. Totem interplay is a Worship dossier topic and was not re-traced here (L) [C66].

### M18. W5+ extensions (one line each)
- ES Divinity: god gaining, gods beyond 10 feed God's Chosen Children [C44]; Polytheism (second god) [C43].
- Spiritual Monk (ES promotion): unreleased; the data holds a family-bonus placeholder (decay 25/100, offset 69) but no talent tab [C1][C61].
- Arcane Cultist is the Shaman line's master class, not this line [C1].
- Memorial Skulls and the three stat talents are switched off from World 7 [C44].
- Mage/Wizard/ES have no master class of their own yet (Wizard line master = Spiritual Monk, unreleased) [C1].

## Min-max by stage

Priority orders below come from the most recent Toolbox community builds (tier 4, updated 2026-09-28 to 2026-10-19) checked against the formulas in the catalogue. Each line names its source. No Reddit or guide-sheet cross-check was possible this pass.

- **Principles that hold at every stage (code):** damage passives scale as `add` (linear) for Gilded Sword, Sharpened Axe, Knowledge Is Power and Power Overwhelming, so they are never wasted early; `decay` talents flatten (Overclocked Energy is 69% of cap at L50) [C13][C14]. Attack talents only help AFK while on the bar [C20]. Reach 100% hit chance and no more [C4].
- **W1 early (Beginner to Mage):** one point split into Gilded Sword and Sharpened Axe; ignore stats (community "Beginner damage build", already in the KB). Pass the Scripticus8 gate at Map 3 and pick Mage at Promotheus [C5].
- **W1 mid (Mage ~Lv 10-35):** damage preset: Sharpened Axe 50, Gilded Sword 40, Quickness Boots only for accuracy, Overclocked Energy 20; AFK: Energy Bolt 25, Mini Fireball 25, Power Overwhelming 50; active: attacks 1 point each, Knowledge Is Power, Power Overwhelming 100, Individual Insight. Goal is the Crabcakes zone to take a sub-class [C54]. Choppin alt: Smart Efficiency 80, Active AFK'er 50, Log On Logs 50, Deforesting 50, Leaf Thief 15 [C55].
- **W1 late / W2 early (Speccius, Wizard ~Lv 40-50):** take Wizard (not Shaman) for Worship and damage. Priorities: AFK ~50: Sharpened Axe, Gilded Sword, Overclocked Energy 25, Idle Casting 50, Energy Bolt/Mini Fireball 25, Power Overwhelming 60, Ice Shards/Floor Is Lava/Tornado 25, Paperwork 30, Earlier Education [C53]. Active ~50: Gilded Sword 70, Sharpened Axe 50, Overclocked Energy 70, attacks 1, Power Overwhelming 100, Paperwork 20, Earlier Education 100 (it pays tab 2 points) [C53].
- **W2 mid (~70):** AFK ~70: the four basics at 50 incl. Idle Casting, Mana Overdrive and Knowledge Is Power split with Individual Insight, Paperwork 30, Earlier Education [C53]. Active ~70: Sharpened Axe, Gilded Sword and Overclocked Energy 100, Paperwork 40 [C53].
- **W2 late / W3 (~90-150):** AFK ~90: Sharpened Axe 75, Gilded Sword 75, Overclocked Energy 75, Idle Casting 100, attacks 25, Power Overwhelming 100, Paperwork 50, Charge Syphon 1 point so soul gathering is easier [C52]. Priority switches to Overclocked Energy > Gilded Sword > Sharpened Axe after accuracy is met [C53]. 150+: Max Idle Casting; priority Quickness Boots > Book of the Wise > Sharpened Axe; attacks maxed; Paperwork then Mana Is Life, then Speedy Book, Fuscia Flasks (scales on the Mage Is Best bubble), Staring Statues [C51][C49].
- **W3 late (most-liked current build, 21 likes):** Gilded Sword > Sharpened Axe > 50 Idle Casting > Overclocked Energy > Mana Booster; tab 2 Power Overwhelming > Knowledge Is Power = Mana Overdrive > Energy Bolt 10 / Mini Fireball 40 > Unt'wis'ted Robes or Individual Insight > Choppin It Up Ez; tab 3 Paperwork > Wis Wumbo > 20 each Ice Shards, Floor Is Lava, Tornado, Mana Is Life > Fuscia Flasks > Earlier Education > Nearby Outlet > Occult Obols; star tab Stonks! to 30 [C49]. Skilling preset: Smart Efficiency > Active AFK'er > Book of the Wise; Log On Logs > Leaf Thief > Deforesting; Charge Syphon > Sooouls > Nearby Outlet; Wis Wumbo > Staring Statues [C50].
- **W4 (ES):** Eliteus on map 154 [C57]. ES tab 4 order per the wiki: Dimensional Wormhole, Chaotic Force, Shared Beliefs, Skill Wiz first (confidence M, wiki not consensus) [C58]. From the data: Utmost Intellect raises Book of the Wise's cap and so WIS; Symbols of Beyond ~P gives +1 level to every talent per 20 levels, usually the best late point [C42]; Wormhole Emperor and God's Chosen Children matter for damage only with many wormhole kills or more than 10 gods (W5+) [C44]. Combat ES builds (Combat ES, 10 likes; 420 ES AFK, 7 likes) exist; payloads not read [C58].
- **Per setup:** damage preset above; Worship preset for the W3 Wizard; ES on Divinity once W5 opens [C57].
- **Where sources disagree:** (1) the wiki ranks Worship talents first for a Wizard [C56], while the most-liked build ranks damage first and puts Worship in the skilling preset [C49][C50]; the build is more current and agrees with the code (damage multiplies, Worship is a skill preset); confidence M. (2) Crit chance uses x in the game and y in Toolbox [C18]; confidence H for the game.

## What ActiveOn has and lacks

- **Has:** talent builds `mage-fighting`, `mage-skilling` (flagged stale, data-backed core), `wizard-fighting`, `wizard-skilling` (from the 2026-10-13 build), class emblems for Mage, Wizard and ES, the shared attack-bar check, talent points and presets, worship charge-cap detectors [C48][C60].
- **Lacks:** (a) no ES build in the KB; (b) no Verdict for max-level raisers (Wis Wumbo needs Book of the Wise below its cap, Fuscia Flasks beyond the Mage Is Best level wastes points) [C24][C25]; (c) no accuracy-ceiling check feeding "stop AGI" (builds D7 exists in earlier research, not computed) [C4]; (d) no family-bonus readout for Wizard star points or ES levels [C29]; (e) no Polytheism or second-god guidance [C43]; (f) no Charge Syphon placement; (g) the FARSIGHT crit discrepancy affects the damage readout [C18]; (h) Free Meal, Leaf Thief and Sooouls conditions are not turned into advice [C35][C36].
- **Sprites needed (for later build, nothing built in this research task):** per-talent icons for the 14 key talents (Overclocked Energy, Idle Casting, Power Overwhelming, Knowledge Is Power, Paperwork, Charge Syphon, Wis Wumbo, Fuscia Flasks, Earlier Education, Dimensional Wormhole, Polytheism, Symbols of Beyond, Mana Is Life, Utmost Intellect); a wand item glyph; MP/Mana bar; Forest Soul and Grass Leaf storage glyphs; two-god (Polytheism) chip; wormhole mob [C60].

## Open questions

- Q1: Level gate for Speccius (sub-class) and for the Mage pick at Promotheus2. Neither is in `quests.json`; N.js was unavailable to both verifiers.
- Q2: FARSIGHT crit chance: game reads x (11.7% at L100), Toolbox reads y (22.8%). Is there an N.js crit-chance path that uses the y value? Report upstream if it is a Toolbox bug.
- Q3: Consumer of the Mage family bonus (+Total WIS). Does the game apply it in `TotalStats`, and does Toolbox miss it?
- Q4: Chaotic Force, You're Next, Speedy Book, Teleport and Occult Obols/Unt'wis'ted Robes/Individual Insight are not modelled by Toolbox (name search). Check whether stat code covers them under another name.
- Q5: Level gate and exact point split for tab 3 / tab 4 (earlier research says 3x(Lv-29), 3x(Lv-89); wiki says above 50). Needs a re-trace of `TotalTalentPoints`.
- Q6: Cap of Mage Is Best bubble in practice (bubble levels beyond 100 need Sigils/Bubble Breakthrough); how far can Overclocked Energy go?
- Q7: ES community builds: fetch payloads for `sAE4oV`, `dJLLSZ`, `Rqcctu`, `O7MPbO` (not cached).
- Q8: Reddit, Steam and IdleOn Academy cross-check not done (search budget spent).
- Q9: What does Dimensional Wormhole kill count (`accountOptions[152]`) look like early, and how fast does a typical ES push it?
- Q11: Does Class Redo re-open Speccius2 and Eliteus2 (Disputed, C7)? Needs N.js.
- Q10: Does the Wizard star-point family bonus reach other characters (family) or only itself? Walk implies best across roster.

## Claims register

| Cid | Claim | Source | Tier | Verified | Conf |
|---|---|---|---|---|---|
| C1 | Class tree: Beginner promotes to Warrior, Archer or Mage. Mage (index 31) promotes to Wizard (32) or Shaman (33). Wizard promotes to Elemental Sorcerer (34); ES promotes to Spiritual Monk (35), which is unreleased (no talent tab). Shaman goes to Bubonic Conjuror (36), then Arcane Cultist (40). | vendor/data/website-data/classPromotions.json | 1 | 2026-10-19 | H |
| C2 | Talent tabs per class: Mage = Savvy_Basics + Mage; Wizard = Savvy_Basics + Mage + Wizard; Elemental Sorcerer = those three + Elemental_Sorcerer (4 tabs). Each tab holds 15 talents. | vendor/data/website-data/classPromotions.json; vendor/data/website-data/talents.json (keys Savvy_Basics, Mage, Wizard, Elemental_Sorcerer, 15 entries each) | 1 | 2026-10-19 | H |
| C3 | Main (damage) stat of Mage, Wizard, Shaman, Bubonic Conjuror, Arcane Cultist and Elemental Sorcerer is WIS (wisdom). | vendor/parsers/talents.ts#L87-L114 (mainStatMap) | 1 | 2026-10-19 | H |
| C4 | The Mage line's accuracy stat is AGI (WIS is the damage stat). Put points in Quickness Boots only until hit chance is 100%. | docs prior research 2026-10-17-character-builds (origin/research/character-builds), citing Toolbox getAccuracy / hit-chance.mjs; wiki https://idleon.wiki/wiki/Wizard (rev 2026-09-03) says 'Wisdom as its main stat with Agility for accuracy' | 3 | 2026-10-19 | M |
| C5 | **Disputed.** View A (earlier dossier): Mage is chosen at Scripticus8. View B (verified, correction): Scripticus8 is a gate quest (customArray: reach Map 3, get a class, buy 25 upgrades; dialogue sends the player to Promotheus) and the Mage pick is quest Promotheus2 (quests.ts#L57). The level gate is not in the data; class Lv 10 comes from earlier project research (L). | vendor/data/website-data/quests.json (Scripticus 8, Promotheus 2); vendor/parsers/quests.ts#L57; prior research origin/research/character-builds:docs/research/systems/2026-10-17-character-builds.md (Tab 2 unlocks at class Lv 10) | 1 | 2026-10-19 | M |
| C6 | Subclass: NPC Speccius (Yum Yum Desert). Quest Speccius1 asks 100 Kebab Sticks and 50 Crabby Cakey (rewards 2x 2 HR Time Candy, 1 Talent Point Reset Potion, 5 Talent Point Reset Fragments). Quest Speccius2 'Specialization Station' is the sub-class pick (reward 10,000 coins). The level gate for the pick is not in the data file. | vendor/data/website-data/quests.json (Speccius 1, 2); vendor/parsers/quests.ts#L251-L254 | 1 | 2026-10-19 | H |
| C7 | **Disputed.** View A (earlier dossier, client N.js, not re-checkable): Class Redo re-opens Scripticus8, Speccius2 and Eliteus2. View B (Toolbox, tier 1): quests.ts#L57 lists Promotheus2 and Scripticus8 as the class-choice quests; Speccius2/Eliteus2 re-opening is unconfirmed. N.js unavailable, so both L. | game client N.js @8261300 (item-use handler for the redo item); vendor/parsers/quests.ts#L57 | 1 | 2026-10-19 | L |
| C8 | On promotion the game sets SkillLevelsMAX of each of the 15 talents of the new tab to at least 100, so a fresh talent starts with a max level of 100. | game client N.js @4783600 (class-choice handler: Math.max(SkillLevelsMAX, 100) over TalentOrder) | 1 | 2026-10-19 | L |
| C9 | Savvy_Basics (tab 1) talents: Health Booster 0, Mana Booster 1, Star Player 8, Bucklered Up 9, Sharpened Axe 5, Fist of Rage 10, Quickness Boots 11, Book of the Wise 12, Lucky Clover 13, Gilded Sword 6, then the Mage-only five: Smart Efficiency 445, Overclocked Energy 446, Farsight 447, Idle Casting 448, Active AFK'er 449. Formulas are listed in the catalogue. | vendor/data/website-data/talents.json (Savvy_Basics) | 1 | 2026-10-19 | H |
| C10 | Mage (tab 2) talents ids 450-464: Energy Bolt 450, Mini Fireball 451, Mana Overdrive 452, Teleport 453, You're Next 454, Knowledge Is Power 455, Unt'wis'ted Robes 456, Power Overwhelming 457, Free Meal 458, Individual Insight 459, Log On Logs 460, Leaf Thief 461, Deforesting All Doubt 462, Choppin It Up Ez 463, Inner Peace 464. | vendor/data/website-data/talents.json (Mage) | 1 | 2026-10-19 | H |
| C11 | Wizard (tab 3) talents: Ice Shards 465, Floor Is Lava 466, Tornado 467, Speedy Book 468, Mana Is Life 469, Paperwork Great... 470, Staring Statues 472, Fuscia Flasks 474, Charge Syphon 475, Sooouls 476, Bless Up 477, Nearby Outlet 478, Occult Obols 486, Wis Wumbo 488, Earlier Education 494. | vendor/data/website-data/talents.json (Wizard) | 1 | 2026-10-19 | H |
| C12 | Elemental Sorcerer (tab 4) talents: Meteor Shower 495, Lightning Barrage 496, Radiant Chainbolt 497, Dimensional Wormhole 498, Chaotic Force 499, Believer Strength 500, Memorial Skulls 531, Skill Wiz 532, Utmost Intellect 533, The Family Guy 144, Polytheism 505, Shared Beliefs 506, God's Chosen Children 507, Wormhole Emperor 508, Symbols of Beyond ~P 539. | vendor/data/website-data/talents.json (Elemental_Sorcerer) | 1 | 2026-10-19 | H |
| C13 | Growth curves: add (x2 = 0) = x1*L, add (x2 != 0) = (((x1+x2)/x2 + 0.5(L-1)) / (x1/x2)) * L * x1; decay = x1*L/(L+x2); decayMulti = 1 + x1*L/(L+x2); bigBase = x1 + x2*L; intervalAdd = x1 + floor(L/x2). Talent bonus is 0 when the talent is unlearned (level <= 0). | vendor/utility/wiki/growth.mjs#L13-L70; vendor/parsers/talents.ts#L31-L49 | 1 | 2026-10-19 | H |
| C14 | Overclocked Energy: damage % = log10(max MP) (lavaLog) x talent value, an additive term inside the 'damage from HP/MP' group. Talent value decay 150/80: 83.3 at L100. | vendor/parsers/damage.ts#L823-L883 (getDamageFromHpMp); talents.json id 446 | 1 | 2026-10-19 | H |
| C15 | Max MP = (10 + card Base_MP + stamps Base_MP + Mana Booster + WIS + Magician Starterpack box) x (1 + Mana Overdrive/100) x (1 + (Magician Starterpack % + card Total_MP)/100). Mana Booster is add 1/0.1 (605 MP at L100); Mana Overdrive is add 0.5/0.02 (151% at L100). | vendor/parsers/damage.ts#L1050-L1073 (getMaxMp); talents.json ids 1, 452 | 1 | 2026-10-19 | H |
| C16 | Knowledge Is Power adds to the effect of the main stat: damage from stat = WIS x (1 + (Knowledge Is Power + Smarter Spells bubble)/100), then raised to ^0.7 inside getDamageFromHpMp. The sum also includes STRENGTH_IN_NUMBERS and LUCKY_HIT, inert for the Mage line. Knowledge Is Power is add 1.5/0 (150% at L100). | vendor/parsers/damage.ts#L95-L113 and #L851; talents.json id 455 | 1 | 2026-10-19 | H |
| C17 | Power Overwhelming increases the effect Weapon Power has on damage (read as intWpTalent in the base damage). add 1.2/0 gives 120% at L100. Cap formula: min(150, 2*weaponPower + damageFromStat) (BASE_DAMAGE_STAT_AND_POWER_CAP); Power Overwhelming scales weaponPower inside the (WP*(1+t/100)+SharpenedAxe)/3 squared term. | vendor/parsers/damage.ts#L887-L897; talents.json id 457 | 1 | 2026-10-19 | H |
| C18 | Farsight adds Crit Chance (x: decay 17/45) and Crit Damage (y: decay 33/45). The game's CritChance function reads GetTalentNumber(1,447), the x value (11.72% at L100). Toolbox's getCritChance and getCritDamage both call getTalentBonus(..., 'FARSIGHT', true), so Toolbox's crit chance uses the y value (22.76 at L100). SOURCES DISAGREE. Data confirms Farsight x (17/45) is crit chance and y (33/45) crit damage (lvlUpText); Toolbox passes true (y) at damage.ts#L1178 (crit damage, correct) and #L1215 (crit chance, y). The game-client CritChance claim is unverifiable here (N.js unavailable). Confidence: Toolbox uses y for chance H; game reads x M. | game client N.js `_customBlock_CritChance` (GetTalentNumber(1,447)); vendor/parsers/damage.ts#L1178 and #L1215 (yBonus=true) | 1 | 2026-10-19 | M |
| C19 | Idle Casting (decay 20/50, 13.33% at L100, 10.0% at L50) adds to Fighting AFK gains in getAfkGain; Active AFK'er (decay 20/40, 14.29% at L100) adds to skill AFK gains. | vendor/parsers/character.ts#L3355-L3375; talents.json ids 448, 449 | 1 | 2026-10-19 | H |
| C20 | Attack talents on the attack bar multiply AFK damage (D) and kill rate (K): each factor is D (or K) x (1 + min(1, L/(L+100))), so L25 = 1.2x of its max, L100 = 1.5x. K is clamped to [1, 2.2]. Mage-line values (K/D): Energy Bolt 1/1.21, Mini Fireball 1.05/1.2, Ice Shards 1.1/1.3, Floor Is Lava 1.1/1.3, Tornado 1.1/1.3, Meteor Shower 1.2/1.2, Lightning Barrage 1/1.3, Radiant Chainbolt 1.3/1, Dimensional Wormhole 1/1. Talents with D = K = 1 (Teleport, Speedy Book, Mana Is Life, Log On Logs) contribute nothing to AFK kills. Only talents with AFKactivity === 0 and D/K !== 1 multiply the AFK terms. | vendor/parsers/damage.ts#L1259-L1318 (getKillsPerHour, getTalentEffectOnKills); talents.json fields K, D, AFKactivity | 1 | 2026-10-19 | H |
| C21 | The All For Kill bubble (High-IQ cauldron, bubble 9, decay 40/100) and the star talent Attacks On Simmer each add up to +25% to the D term; both are capped at 25 in Toolbox. | vendor/parsers/damage.ts#L1305-L1316; vendor/data/website-data/cauldrons.json (high-iq index 9) | 1 | 2026-10-19 | H |
| C22 | Attack talent stats (cooldown s / cast time s / mana): Energy Bolt 8/0.5/4 (200+3.5L %), Mini Fireball 6/0.85/6 (130+1.5L %), Teleport 1/0.5/2, Ice Shards 10/1.2/12 (70+L %, 3 hits + freeze), Floor Is Lava 11/0.95/25 (120+L %; 1+floor(L/40) volcanoes, x2 per cast), Tornado 20/0.95/30 (20+0.3L % for 4+floor(L/20) s), Mana Is Life 60/0.95/12, Meteor Shower 12/0.8/90, Lightning Barrage 4/0.55/40, Radiant Chainbolt 8/0.95/50, Dimensional Wormhole 120/0.95/100. Energy Bolt and Lightning Barrage and Ice Shards need a wand (inputReq 2). | vendor/data/website-data/talents.json (cooldown, castTime, manaCost, inputReq) | 1 | 2026-10-19 | H |
| C23 | Cooldown reduction: cast stores ceil(cooldown / (1 + (WOAH_THAT_WAS_FAST + Magician Starterpack box bonus 2)/100)). | vendor/parsers/talents.ts#L66-L76 | 1 | 2026-10-19 | H |
| C24 | Max level of Book of the Wise (talent 12) = 100 + Wis Wumbo (x, add 1/0 = +1 per level) + Utmost Intellect (y, add 1/0 = +1 per level) + Eternal WIS (Voidwalker talent 53, best on account). Wis Wumbo is on the Wizard and Shaman tab 3; Utmost Intellect on the ES and Bubonic Conjuror tab 4. | game client N.js @4370523 (TotalTalentPoints: SkillLevelsMAX[12]); talents.json ids 488, 533, 53 | 1 | 2026-10-19 | M |
| C25 | Max level of Overclocked Energy (446) = max(existing, 100 + min(Fuscia Flasks level, level of the 'Mage Is Best' bubble)). Farsight (447) uses Fantasia Flasks (Shaman talent 489) the same way. Mage Is Best is bubble index 1 of the High-IQ cauldron (cauldron index 2). | game client N.js @4371959 (SkillLevelsMAX[446], [447], CauldronInfo[2][1]); vendor/data/website-data/cauldrons.json (high-iq index 1) | 1 | 2026-10-19 | M |
| C26 | Talent Book Library can raise the max level of main-class talents (skillIndex < 615), range min 101 (+5 per gem-shop 113, +bribe, +atom) to max 125 (+relic, +winner bonus, +achievement, +salt lick, +2 per merit). Not eligible: ids 10, 11, 12, 23, 75, 79, 86, 87, 266, 267, 446, 447, so Book of the Wise, Overclocked Energy and Farsight cannot be raised by books. | vendor/parsers/misc.ts#L310-L331 (earlier citation talents.ts#L306-L316 was wrong: that is getHighestMaxLevelTalentByClass) | 1 | 2026-10-19 | H |
| C27 | Talent point bonus: bubble 'Smart Boi Talent' (High-IQ bubble 13, bigBase 5/1) adds +N talent points to each of tab 1-4 for classes >= 31 (the Mage line); it does not affect master classes. Earlier Education adds +1 point per level to the Mage tab (tab 2). | game client N.js @4373800 (TalentDLbonus: AlchBubbles.TalWiz for class >= 31); vendor/data/website-data/cauldrons.json (high-iq 13); talents.json id 494 | 1 | 2026-10-19 | M |
| C28 | Points per tab (from earlier project research of TotalTalentPoints): tab 1 = 3x(Lv-1) + skill levels; tab 2 = 3x(Lv-6); tab 3 = 3x(Lv-29); tab 4 = 3x min(Lv-89,100) + 2x(Lv-189) past 189; plus stamps, vault, achievements. The wiki says tab 4 counts levels above 50; code says above 89 and wins. | docs prior research origin/research/character-builds:docs/research/systems/2026-10-17-character-builds.md (Points per tab, N.js _customBlock_TotalTalentPoints @4370453; not re-traced this pass) | 1 | 2026-10-19 | L |
| C29 | Class family bonus (classFamilyBonuses by class index): Mage (31) +Total WIS intervalAdd 1/5/9 = 1 + floor((Lv-9)/5) from Lv 9; Wizard (32) +Star Tab Talent Points intervalAdd 1/6/29 = 1 + floor((Lv-29)/6) from Lv 29; Shaman (33) golden-food bonus decayMulti 0.4/100/29; Elemental Sorcerer (34) +levels to all talents above Lv 1, decay 20/350/69, first non-zero at Lv 70. Spiritual Monk (35) decay 25/100/69 is an unreleased placeholder. Bonus uses round(Lv - x3) and is the best across the roster. | vendor/data/website-data/shared-data.json (classFamilyBonuses [31]-[34]); vendor/parsers/family.ts#L9-L24 | 1 | 2026-10-19 | H |
| C30 | The Wizard family bonus is added to the star-tab talent point total as FamBonusQTYs[64] (getCharacterFamilyBonus(character, Wizard)). | vendor/parsers/talents.ts#L574-L576 (calcTotalStarTalent) | 1 | 2026-10-19 | H |
| C31 | No Toolbox consumer for the Mage family bonus '+Total WIS' was found in the vendored parsers (no read of the Mage family key, no 'TOTAL_WIS' string use). | grep of vendor/parsers and vendor/utility for CLASSES.Mage / TOTAL_WIS, 2026-10-19 | 1 | 2026-10-19 | M |
| C32 | Choppin It Up Ez: x = % minigame rewards (add 1/0), y = % damage per 25 points of the Choppin minigame highscore (decay 5.7/50, 3.80 per step at L100). Damage term = y x floor(chopping score / 25). | vendor/parsers/damage.ts#L683-L688; talents.json id 463 | 1 | 2026-10-19 | H |
| C33 | Paperwork, Great...: damage % = talent value (decay 70/100, 35 at L100) x stamps collected / 10. | vendor/parsers/damage.ts#L720-L727; talents.json id 470 | 1 | 2026-10-19 | H |
| C34 | Mana Is Life: x = % of damage taken is dealt to MP (monster damage / (1 + x/100) in the survivability calc); y = Multikill per damage tier while the buff is active (60 s cooldown). bigBase 25/0.35 for x, decay 40/100 for y. | vendor/parsers/damage.ts#L1321-L1330 and #L1667; talents.json id 469 | 1 | 2026-10-19 | H |
| C35 | Free Meal: chance food is not consumed = min(bubble cap, jewel multiplier x (Free Meal + Care Package + Crab Cake card + star sign + Bite But Not Chew bubble)). Free Meal is decay 53/40 (37.86% at L100). | vendor/parsers/character.ts#L3640-L3654 | 1 | 2026-10-19 | H |
| C36 | Smart Efficiency (add 1/0.02, 201% at L100) multiplies the total efficiency of specialised skills, and with Skill Mastery counts 10x in one branch. Skill Wiz (y) makes WIS count more for skill efficiency: WIS efficiency term = (WIS+1)^0.6 x (1 + Skill Wiz y/100). Deforesting All Doubt boosts the effect WIS has on Choppin efficiency (add 0.75/0). Leaf Thief = x% per power of 10 of Grass Leaves in storage, Sooouls = x% Worship efficiency per power of 10 Forest Souls in storage (both decay 25/70). | vendor/parsers/efficiency.ts#L377-L407, #L626-L637; vendor/parsers/world-4/lab.ts#L424-L437 | 1 | 2026-10-19 | H |
| C37 | Inner Peace (add 1/0): +% EXP for all specialised skills; Bless Up (add 1/0): +% Worship EXP. | vendor/parsers/character.ts#L660, #L972 | 1 | 2026-10-19 | H |
| C38 | Worship: Charge Syphon (cooldown 3600 s, 10 mana) steals x% (bigBase 35/0.3) of all your characters' charge and adds y (bigBase 4000/1000) Max Charge for 1 minute; Nearby Outlet is a charge-rate multiplier (decayMulti 1/100: 1.5x at L100) applied as max(x,1); Gospel Leader and Call Me Pope bubbles and the skull slot also set Max Charge/charge rate. | vendor/parsers/world-3/worship.ts#L148-L225; talents.json ids 475, 478 | 1 | 2026-10-19 | H |
| C39 | Staring Statues: Exp, Lumberbob and Beholder statues give +x% more bonus (decay 100/50, 66.67% at L100). | vendor/parsers/world-1/statues.ts#L160-L170; talents.json id 472 | 1 | 2026-10-19 | H |
| C40 | Occult Obols (decay 135/80): obols give +x% more WIS than listed. Untwisted Robes (add 1.5/0): equipment gives x% more WIS. Individual Insight: +L base WIS (add 1/0). No Toolbox parser read of Occult Obols, Unt'wis'ted Robes or Individual Insight by name was found, so Toolbox may apply them through the stats pipeline elsewhere or not at all. | vendor/data/website-data/talents.json ids 486, 456, 459; grep of vendor/parsers 2026-10-19 (no name match) | 1 | 2026-10-19 | M |
| C41 | You're Next (decay 110/25 chance, bigBase 35/1 % more damage), Speedy Book (bigBase 10/0.2 % attack rate for 3+floor(L/15) s after 4 kills in 4 s), Teleport (25+L px), Chaotic Force (decay 75/110 chance a basic attack makes a Fireball, Tornado or Volcano) have no Toolbox damage consumer; their effect is not in Toolbox's damage figure. | vendor/data/website-data/talents.json ids 454, 468, 453, 499; grep of vendor/parsers (no name match) | 1 | 2026-10-19 | M |
| C42 | Elemental Sorcerer Symbols of Beyond ~P: +1 + floor(L/20) levels to all talents above Lv 1. Added levels also come from god bonus Arctis, family bonus (ES floor), achievement 291, companion, ninja mastery, Equinox, Grimoire, Kattlekruk set, Tesseract (cap 5) and Superbit. | vendor/parsers/talents.ts#L336-L383 (getTalentAddedLevels); talents.json id 539 | 1 | 2026-10-19 | H |
| C43 | Polytheism: the second god index is SkillLevels[505] % 10 for an ES; the character gets that god's minor bonus as well as its linked god. Talent value decay 70/200 (23.33 at L100). | vendor/parsers/character.ts#L496-L505; talents.json id 505 | 1 | 2026-10-19 | H |
| C44 | Wormhole Emperor: damage multiplier 1 + talent x log10(wormhole kills, accountOptions[152]) / 100, highest talent on the account (decay 1.5/150, 0.60 at L100). God's Chosen Children: + max(0, unlocked gods - 10) x talent % damage (only past 10 gods, a W5+ state). Believer Strength: +talent Weapon Power per 10 Divinity levels of this character. Memorial Skulls: +talent % Kill-per-Kill per 1000 WIS (off from World 7). Shared Beliefs: Divinity EXP for all, best talent on the account. | vendor/parsers/damage.ts#L296-L320, #L425, #L1151-L1172, #L1542-L1546; vendor/parsers/character.ts#L1249 | 1 | 2026-10-19 | H |
| C45 | Dimensional Wormhole: decay 17/70 % XP and drop per wormhole kill, duration bigBase 43/0.2 s, cooldown 120 s, mana 100; also makes normal mobs respawn faster. | vendor/data/website-data/talents.json id 498 | 1 | 2026-10-19 | H |
| C46 | The Family Guy (144): decay 40/100 % bigger family bonuses from this player; account-wide best is used for the DK and SB bonuses. The ES family bonus is read mid-walk, so Family Guy's own level excludes it. | vendor/parsers/family.ts#L26-L69; talents.json id 144 | 1 | 2026-10-19 | H |
| C47 | High-IQ cauldron bubbles that serve the Mage line: Stable Jenius (+WIS all), Mage Is Best (x2 purple passives, caps Fuscia Flasks), Hocus Choppus (choppin eff per 10x max MP), Name I Guess (base damage per MP over 150), Matty Stafford (+Total Damage), Smart Boi Talent (talent points), Power TriThree (+damage per 250 WIS), Smarter Spells (WIS effect on damage), Wand Pawur (+weapon power from wands), All For Kill (AFK attacks), Call Me Pope and Gospel Leader (Worship), Essence Boost, Dmg of the Soul. | vendor/data/website-data/cauldrons.json (high-iq) | 1 | 2026-10-19 | M |
| C48 | Existing ActiveOn Knowledge Base: talents.yaml has builds talents.build.mage-fighting, mage-skilling (both flagged stale D4, confidence L, data-backed core only), wizard-fighting and wizard-skilling (confidence L, from the Sir_Grimtide build). There is no Elemental Sorcerer build, no Mage-line Verdict for max-level raisers, no Wizard family/star-point readout and no Polytheism guidance. | packages/knowledge/systems/talents.yaml#L620-L780; packages/knowledge/systems/classes.yaml | 1 | 2026-10-19 | M |
| C49 | Community build (Sir_Grimtide, Wizard/Worship, 21 likes, created 2026-06-02, updated 2026-10-13), damage preset: Tab 1 Gilded Sword > Sharpened Axe > 50 Idle Casting > Overclocked Energy > Mana Booster > Quickness Boots (accuracy) > Book of the Wise > Idle Casting > Farsight > Lucky Clover. Tab 2 Power Overwhelming > Knowledge Is Power = Mana Overdrive > 10 Energy Bolt = 40 Mini Fireball > Unt'wis'ted Robes (if gear WIS high) or Individual Insight > Choppin It Up Ez. Tab 3 Paperwork Great > Wis Wumbo > 20 each Ice Shards = Floor Is Lava = Tornado = Mana Is Life > Fuscia Flasks (scales on bubble level) > optional Earlier Education > Nearby Outlet > Occult Obols. Star tab 1: Stonks! up to 30; tab 2 Dungeonic Damage > Frothy Malk > Telekinetic Storage. | https://idleontoolbox.com/tools/builds/view?id=qncFFv (payload in scratchpad builds-detail.json) | 4 (KB labels the same URL tier 3) | 2026-10-19 | L |
| C50 | Same build, skilling preset: Tab 1 Smart Efficiency > Active AFK'er > Book of the Wise, optional Quickness Boots/Lucky Clover. Tab 2 Log On Logs > Leaf Thief > Deforesting All Doubt, then Individual Insight > Unt'wis'ted Robes > Mana Overdrive, optional Free Meal. Tab 3 Charge Syphon > Sooouls > Nearby Outlet, then Wis Wumbo > Staring Statues > Earlier Education. | https://idleontoolbox.com/tools/builds/view?id=qncFFv | 4 | 2026-10-19 | L |
| C51 | Community build 'Active/Afk Wizard (150+)' (29 likes, updated 2026-10-17): Savvy Basics max accuracy stat first, then max Idle Casting; priority Quickness Boots > Book of the Wise > Sharpened Axe, excess to Farsight and Mana Booster. Mage tab: Energy Bolt/Mini Fireball/Power Overwhelming max, excess equally Individual Insight and Knowledge Is Power, then Mana Overdrive, You're Next, Choppin It Up Ez. Wizard tab: max damage skills, then Paperwork, then Mana Is Life, then Speedy Book, Fuscia Flasks, Staring Statues. | https://idleontoolbox.com/tools/builds/view?id=8kt1td | 4 | 2026-10-19 | L |
| C52 | Community build 'Wizard / AFK (~90)' (17 likes, updated 2026-10-19): Sharpened Axe 75, Gilded Sword 75, Overclocked Energy 75, Idle Casting 100 ('13% AFK gain rate'), accuracy as needed; Energy Bolt 25, Mini Fireball 25, Power Overwhelming 100; Ice Shards/Floor Is Lava/Tornado/Mana Is Life 25, Paperwork 50, Charge Syphon, Earlier Education. 100+ means check out a book at the library. | https://idleontoolbox.com/tools/builds/view?id=4a0Ngm | 4 | 2026-10-19 | L |
| C53 | Community builds 'Wizard / AFK (~70)' and '(~50)': Sharpened Axe/Gilded Sword/Overclocked Energy/Idle Casting 50 (25 for ~50), Energy Bolt 25, Mini Fireball 25, Power Overwhelming 100 (60 for ~50), Ice Shards/Floor Is Lava/Tornado 25, Paperwork 30, Earlier Education. Active variants (~50/~70): attacks at 1 point, Overclocked Energy 70-100, Power Overwhelming 100, Paperwork 20-40, Earlier Education 100. | https://idleontoolbox.com/tools/builds/view?id=e2oBmh, ?id=4HKDoJ, ?id=zl3meI, ?id=yqCZZZ | 4 | 2026-10-19 | L |
| C54 | Community builds for the Mage before subclass (~35, updated 2026-05/09): Sharpened Axe 50, Gilded Sword 40, Quickness Boots for accuracy (reach Crabcakes to choose a subclass), Overclocked Energy 20, then AFK: Energy Bolt 25, Mini Fireball 25, Power Overwhelming 50; active: attacks 1 each, Knowledge Is Power, Power Overwhelming 100, Individual Insight. The build text says Sticks is a great leveling zone. | https://idleontoolbox.com/tools/builds/view?id=SfeypX, ?id=F4GFsP | 4 | 2026-10-19 | L |
| C55 | Community Mage choppin build (30+): Smart Efficiency 80, Active AFK'er 50, Log On Logs 50, Deforesting All Doubt 50, Leaf Thief 15 (more with many leaves). | https://idleontoolbox.com/tools/builds/view?id=K8mA0U | 4 | 2026-10-19 | L |
| C56 | Wiki Wizard page (rev 2026-09-03): 'a Mage subclass specializing in the Worship skill'; recommended order 'Worship talents first for specialization benefits, then defensive/utility talents'. Wiki Mage page (rev 2026-09-03): specialises in Choppin, wands as weapons, prioritise Knowledge Is Power and Power Overwhelming, develop Leaf Thief for Choppin. Wiki ES page (rev 2026-10-07): specialises in Divinity; Polytheism links two gods; Utmost Intellect stacks Book of the Wise levels; Symbols of Beyond +levels every 20. | https://idleon.wiki/wiki/Wizard; https://idleon.wiki/wiki/Mage; https://idleon.wiki/wiki/Elemental_Sorcerer | 3 | 2026-10-19 | L |
| C57 | Specialty skills: Mage = Choppin, Wizard = Worship, Elemental Sorcerer = Divinity (W5 skill; the ES unlock is W4). The ES elite itself is taken from Eliteus on map 154 after the Greenie Gang quest (see dossier elite-classes). | https://idleon.wiki/wiki/Mage; https://idleon.wiki/wiki/Wizard; https://idleon.wiki/wiki/Elemental_Sorcerer; dossiers/elite-classes.md C4 | 3 | 2026-10-19 | L |
| C58 | ES tab 4 priorities per the wiki (via elite-classes dossier): Dimensional Wormhole, Chaotic Force, Shared Beliefs, Skill Wiz first; this is wiki guidance (rev 2026-09-03 to 2026-10-07), not community consensus. Community ES builds exist (Combat ES 10 likes, 420 ES AFK 7 likes, created 2026-04/05) but their payloads were not cached. | dossiers/elite-classes.md (Min-max, W4 mid); https://idleontoolbox.com/tools/builds/view?id=sAE4oV, ?id=dJLLSZ | 3 | 2026-10-19 | L |
| C59 | Talent Point Reset Potion: Speccius1 gives 1 as a quest reward (see C6); the potion sets the active preset's talents with index < 615 to 0 (earlier project research, unverifiable in data, L). The Speccius1 reward is verified in quests.json. | vendor/data/website-data/quests.json; prior research (character-builds, Talent Point Reset Potion row) | 1 for the reward, 4 for the zeroing | 2026-10-19 | L |
| C60 | ActiveOn art: class emblems exist for Mage (class-mage), Wizard (class-wizard) and Elemental Sorcerer (class-elemental-sorcerer) in apps/activeon/src/art/sprites/grids/classes.ts; talents.ts has only five category glyphs (damage, afk, defence, skilling, utility). No per-talent icons exist. | apps/activeon/src/art/sprites/grids/classes.ts near L74, L247, L357 (cited lines are off by one); talents.ts | 1 | 2026-10-19 | H |
| C61 | Spiritual Monk (class 35) has a family-bonus placeholder, decay 25/100 with offset 69, but no talent tab in the data; the class is unreleased. | vendor/data/website-data/shared-data.json (classFamilyBonuses SPIRITUAL_MONK); classPromotions.json | 1 | 2026-10-19 | M |
| C62 | Magician Starterpack post-office box: +Base Max MP intervalAdd 1/3 (tiers at 24.9, 99.9, 400.1), +% Max MP add 0.1/0, +% Faster Cooldowns decay 17/200, max level 400. Used by getMaxMp (bonus 0 and 1) and the cooldown divisor (bonus 2). No mana-regeneration parser reference was found. | vendor/data/website-data/shared-data.json (postOffice Magician_Starterpack, ~L33618); vendor/parsers/damage.ts#L1056-L1057; vendor/parsers/talents.ts#L70 | 1 | 2026-10-19 | H (regen absence: L) |
| C63 | HEMA_OVERDRIVE is added to MANA_OVERDRIVE in getMaxMp; SMARTER_SPELLS bubble adds to the WIS stat effect; WAND_PAWUR bubble adds weapon power when main stat is WIS or LUK; HYPERSWIFT bubble feeds the AFK kill-rate path for WIS main stat. | vendor/parsers/damage.ts#L1058-L1063, #L109, #L1140-L1142, #L1269 | 1 | 2026-10-19 | H |
| C64 | Talent presets: the selected preset is passed to the added-level and Super Talent calculations; `getSuperTalentLeftToSpend(level, playerId, preset, account)` exists in world-7/legendTalents. Super Talent effects on Mage-line talents beyond added levels are not traced. | vendor/parsers/character.ts#L412-L413, #L518-L527 | 1 | 2026-10-19 | L |
| C65 | Star talent total = skill-level base + Star Player + Stonks! (flatStarTalents) + Supernova Player + Wizard family bonus + stamps, guild bonus 11, Flurbo, three capped cards, sigil TWO_STARZ and achievements 212, 289, 305. | vendor/parsers/talents.ts#L565-L590 (calcTotalStarTalent) | 1 | 2026-10-19 | H |
| C66 | Charge Syphon placement and totem interplay were not re-traced in this pass; see the Worship dossier. | vendor/parsers/world-3/worship.ts#L148-L225 | 1 | 2026-10-19 | L |

