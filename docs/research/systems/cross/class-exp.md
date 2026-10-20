# Class EXP and character levelling (class-exp)

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Paths are relative to `packages/toolbox-parsers/vendor/` (TB = `parsers/`, DATA = `data/website-data/`). Tier 1 = code/data, 4 = community/wiki. Community meta is thin and flagged. Revised 2026-10-19 after two adversarial verdict sets; every claim carries a confidence (H = code and data agree, M = one tier-1 source or partly verified, L = disputed or unverifiable).

## Class EXP

- **What it is:** Class EXP is the XP that levels a character (skill index 0 of `Exp0`/`ExpReq0`). Every kill (and every AFK kill) pays `monster base EXP x getClassExpMulti`. [C1] `getClassExpMulti` (character.ts#L1909) is the single owner of every Class EXP source; today ActiveOn splits them across talents, salt-lick, weekly-battles, monster-afk with no owner.
- **Unlocks:** Always on from level 1. Gates that ride on character level are in the catalogue (promotions, obol slots, super talent points, level-banded multipliers).
- **Scope:** Per character: level, exp, expReq, talents, equipment, food, star signs, cards, prayers, shrine-by-map, AFK target (shiny medallion). Account-wide: everything else (stamps, vials, bubbles, companions, salt lick, arcade, achievements, Upgrade Vault, merit shop, bundles).
- **Inputs to outputs:** kills x base monster EXP x `value` (below). Time Candy converts AFK hours into the same gains. Output: levels, which gate obol slots, star talent points (L400+), promotions, and talent points.
- **Goals and Milestones:** see "Level gates" table.
- **Feeds / fed by:** fed by salt-lick (Explosive Salts), weekly-battles (`weeklyBossesRaw.c`), star-signs, cards, stamps, vials, bubbles (Grind Time), arcade, companions, divinity (Omniphau, Coral Kid), sailing/islands (shimmer), W7 (button, sushi, Research grid, Zenith, Royal Statue). Feeds: Skill EXP is separate (see EXP CONVERTER, below). Level feeds obols, super talents, "lowest-level character" family comparison, Hexagon/Square obol slots.
- **Per-session actions:** (a) keep the lowest-level character on the best EXP map while the lowest-level bonus applies; (b) spend Time Candy on the character whose current map has the best EXP/h; (c) check unspent levels (obol slots, talent points) after each level-up; (d) swap in Class EXP gear/food/prayers for levelling AFK.
- **AFK Setup implications:** the lowest-level character should AFK a high-kill map with the EXP multiplier stack on; characters over L120 lose Meal "Clexp"; over L50 lose Blunder Hills card set 0 and the level bonus.
- **Common mistakes:** [see Common mistakes below].
- **Sources:** inline per claim; numbered list in the Claim index.

## Mechanics catalogue

All paths are Toolbox unless stated. `value` is the returned multiplier:

`value = workbench x (1 + L3/100) x L5 x (1 + equip78/100) x ( luckExpGain + equip4 + postOffice + food + starSign + vial(MonsterEXP) + bubble(GRIND_TIME) + card(44) + L2 + statue10 + starTalent(JUST_EXP) + shrine5 + saltLick3 + prayers + flurbo + achievements + arcade + sigil + shiny + msa + talent(EXP_CULTIVATION) + passiveCard + L6 ) / 100 + 1`  [C2]

Here L2/L3/L5/L6 are the code's `expGainLUK2/3/5/6` buckets. Additive-% terms all sit in the big sum (one denominator), so each extra source adds `x%` to that sum; the L5 chain and workbench/L3/equip78 multiply the whole thing. [C2]

### M1 Base level curve (EXP needed per level)
- Rule: `ExpReq(t) = (15 + t^1.9 + 11t) x (1.208 - min(0.164, 0.215t/(t+100)))^t - 15`, skillIndex 0 (class). Other skills use different curves (index 2: `(15+t^2+13t)(1.225-min(0.114,0.135t/(t+50)))^t - 26`, 8: piecewise, 9: `(15+t^1.3+6t)(1.17-min(0.07,..))^t-26`, rest `(15+t^2+15t)(1.225-min(0.18,..))^t-30`). Computed from the formula: t=1 ~17.6; t=29 ~6.9e4; t=49 ~1.2e6; t=99 ~1.0e8; t=199 ~7.0e9; t=299 ~4.8e10; t=400 ~2.8e12. [C3][C4]
- The live per-character requirement is stored by the game: `character.skillsInfo.character` = {level, exp, expReq} from `Lv0[0]`, `Exp0[0]`, `ExpReq0[0]` (character.ts#L392-L408; ActiveOn already reads `characters[].classExp`). [C5]
- Other skill curves (per-skillIndex, misc.ts#L882): index 2, index 8 (split at level 71), index 9 and a default exist; only index 0 is class. Confidence H.
- Cap: no hard level cap found in Toolbox; super-talent points count to level 2400 (+20 max) which implies levels beyond 1000 are intended. Open question.

### M2 Luck term (`expGainLUK`)
- `luck < 1000: (( luck+1 )^0.37 - 1)/30`, else `(luck-1000)/(luck+2500) x 0.8 + 0.3963`. Enters the sum as `expGainLUK x (1 + LUCKY_CHARMS talent/100)/1.8`. Field: `character.stats.luck`. Wiki (outdated flag) lists Luck at L100/200/300/400 as 0.11/0.15/0.18/0.20. [C6]

### M3 Level-banded bonuses (additive, L2)
- `level < 10: +150`, `< 30: +100`, `< 50: +50`, else 0. Field: `character.level`. [C7]
- Blunder Hills card set (CardSet0): its bonus only when `level < 50` (wiki: 8/16/24/32% at card star tiers). [C8]
- Meals "Clexp" bonus only when `level < 120` (`getMealsBonusByEffectOrStat(account, null, 'Clexp')`). [C9]

### M4 Lowest-level character bonus (merit + vault + superbit)
- Condition: Merit Shop upgrade at `account.tasks[2][0][2] > 0` AND this character's level strictly below every other character's (tie gets nothing). [C10]
- Gives: **Disputed.** Code (character.ts#L1927) hardcodes `3 x meritLevel` (12 levels, max +36%); game data (DATA shared-data.json `merits[0][2]`: totalLevels 12, meritCost 1, `bonusPerLevel` 4) gives 4 x 12 = +48%, which matches the wiki. Both tier 1; which the live game applies is unresolved (confidence L). ActiveOn must follow Toolbox's number (ADR 0005) but flag the mismatch. The bonus also adds Upgrade Vault bonus index 12 into L2, plus Superbit "Noobie Gains" (+50) into L3 (multiplicative `(1+L3/100)`). [C10][C11]
- Wiki: "Merit Shop offers +48% exp for your lowest character" (tier 4). Earlier draft treated this as stale and let code win; the verifiers showed the data supports 48 (see Disputed above). Confidence L on 36 vs 48. [C12]
- Confidence: lowest-level condition H; per-level value L.

### M5 Weekly boss battles (`weeklyBossesRaw.c`)
- `min(150, weeklyBossesRaw.c)` added to L2 when nonzero. Field: `account.weeklyBossesRaw.c`. [C13]

### M6 Divinity minor god Omniphau
- `getCharacterMinorDivinityBonus(character, account, GOD_INDEX.Omniphau, characters)` added to L2. Field: `account.divinity` + character god link. [C14]

### M7 Card set 5 (CardSet26)
- If the character's equipped card set is `CardSet26`, its bonus goes to L2. Field: `character.cards.cardSet`. [C15]

### M8 Bundle bun_q
- `+20` into L3 if purchased. Field: `account` bundles (`isBundlePurchased(account,'bun_q')`). [C16]

### M9 ExpGainLUK4 (collected, then added into L6)
- Compass bonus 51, Schematic (Hole) t47 i0, Winner bonus "+{% Class EXP", Grimoire upgrade 24, Upgrade Vault 3, Upgrade Vault 35 x `lavaLog(accountOptions[345])`, Schematic t83 i40. [C17]

### M10 L5 multiplicative chain (all multiply)
- Shiny Medallion: `max(1, SHINY_MEDALLIONS talent)` when the character's AFK target has an acquired medallion (`account.compass.medallions`). [C18]
- Companions (active ones): Panda `1+9c37`, Chippy `1+c33`, Glunko `1+4c160`, Mr Pig `1+c32`, Crystal Glunko `1+0.4c168`, Whale `1+c34`, Eggroll `1+c145`, Baby Troll `1 + min(0.5,c128) + 0.25 if Pet Mart+ lv2`, Santa Snake `clamp(1+c50/2500, 1, 1.01)`. Fields: `account.companions.list[i].bonus`. [C19]
- Breeding Pet Arena Crucible (`20 x getPetArenaCrucBonus 15`), Menagerie boost 23, Jelly Operator 30 and 62. [C20]
- Research Grid 130+131+132+152, Sticker 0, Superbit 63 "Experienced Gamer" (x1.1), Zenith Market 9. [C21]
- Equip stat 84 "% BONUS CLASS EXP", Arcade "Class_XP_multi", Vial `7classexp`, `SLAYER_ABOMINATOR talent ^ totalKilledAbominations` (Titan kills, `account.compass.totalKilledAbominations`). [C22]
- Tesseract Arcane Map Multi 1, Spelunk Big Fish 4, Dancing Coral 3, Coral Kid Upgrade 2 raised to `max(0, divinity.godRank)`, Card set 12, Bubba RoG expMulti, Sushi RoG 15 (Tobiko Temaki), Equinox cloud challenge 70 (x5), Hole Fountain 0/16, Royal Statue 3. [C23]
- Meritocracy 27 is gated: the term collapses to 1 when the `Classy_Discoveries` superbit is locked (character.ts#L2103-L2105). Combined with Superbit 24 "Classy Discoveries" x `1.03^rocksFound` (2.3.540 dropped the old `5 x (opt464 - 8)` term). The CardSet26/CardSet25 reference near character.ts#L2395 belongs to a different function and is not part of this formula. [C24][C15]

### M11 L6 additive bundle
- `2 x springEvent1 card stars`, Companions 3 / 50 / 47 / 111, Shimmer (`accountOptions[179] x islands.allShimmerBonus`), Golden Nigiri, Owl "Class XP", Vote 15, Monument (hole t1 i6), L4, Iron armor set, Exotic Market 50, `accountOptions[421]`, Stamps "classxp", Friend bonus 1, Button bonus 8. [C25]

### M12 Main additive sum items
- Equipment stat 78 (multiplier) and 4 (additive), Post Office "Box of Unwanted Stats" (box 2), Food "ClassEXP", Star sign "Class_EXP_Gain", Vial "MonsterEXP", Bubble GRIND_TIME, Card effect 44, Statue 10 (EXP statue, DATA statues `bonus 0.1`/level), Star talent JUST_EXP, Shrine 5 (only on its map, depends on `mapIndex`), Salt Lick index 3 "Explosive Salts" (`baseBonus 0.2 x level`, maxLevel 100, so up to +20%), Prayers Big Brain Time + Unending Energy minus Royal Sampler curse, Dungeon Flurbo "Class_Exp", Achievements 57 (x1), 357 (x20), 61 (x3), 124 (x2), 188 (x5), 286 (x25), Arcade "Class_EXP_gain", Sigil METAL_EXTERIOR, Shiny pet "Class_EXP", MSA totalizer class exp, talent EXP_CULTIVATION, Passive card "Class_EXP_(Passive)". [C26][C27]
- Workbench: `1 + ARCHLORD_OF_THE_PIRATES talent x lavaLog(accountOptions[139]) / 100`. [C28]

### M13 EXP CONVERTER (Skill EXP to Class EXP)
- Star talent `EXP_CONVERTER` (DATA talents.json) converts skill EXP into Class EXP; Vial `ClassEXPconvert` (DATA vials.json L188-190: "you'll get {% more Class EXP"). Not in `getClassExpMulti`, and Toolbox has no parser for either (confirmed by grep of parsers/). Conversion rate: unknown. Confidence M on existence, L on scaling. [C29]

### M14 Time Candy
- Items (DATA items.json `Timecandy1..10`, Type TIME_CANDY, `lvReqToCraft` 88): 1, 2, 4, 12, 24, 72 h exact; Steamy 10 min to 24 h (Toolbox min/max 1/6 to 24 h); Spooky 20 min to 12 h (1/3 to 12); Cosmic 5 to 500 h, 24 h average (54% 5-10h, 25% 10-25h, 18% 25-100h, 2.1% 100-499h, 0.4% 500h); Spirit 24 h, only usable in World 6. [C30]
- Effect: "instantly get N hours of AFK gains" for what the character is doing now, so it yields Class EXP at the current AFK map's rate x the AFK EXP multiplier. Stock count: `getCurrencies` (misc.ts#L515-L560) sums guaranteed hours across storage + inventories, and min/max for special candies. [C31]

### M15 Level gates (character level)
| Gate | Value | Source |
|---|---|---|
| Obol slot unlock levels, character slots 0..20 | 32, 0, 105, 40, 60, 25, 130, 152, 48, 190, 250, 140, 210, 170, 112, 98, 70, 80, 120, 180, 90 | [C32] |
| Family obol slots 0..23 | 60,250,200,350,100,1250,400,650,900,1500,1150,1200,2500,2000,2100,3000,5000,1750,400,160,875,700,470,80 | [C32] |
| Super (star) talent points | `min(20, floor(max(0, level-400)/100) + (Epi lore boss defeated ? 1 : 0))` minus purchased | [C33] |
| Level-banded Class EXP | <10 +150, <30 +100, <50 +50 | [C7] |
| Class promotion tree | Beginner -> Warrior/Archer/Mage -> sub class -> elite (e.g. Warrior -> Barbarian/Squire -> Blood Berserker/Divine Knight -> Death Bringer/Royal Guardian); Journeyman -> Maestro -> Voidwalker; Infinilyte and Spiritual Monk exist but are unreleased (no talents) | [C34] |
| Promotion levels | NOT found in Toolbox data. Family bonus counts from Lv29 (sub class) and Lv69 (elite) per wiki. Exact promotion quest levels and the "Town Marble 22" gate: OPEN | [C35] |
| Beginner talent cap | Before promoting, Beginner is limited to 10 talents (15 after) | [C36] |
| Lowest-level comparison | needs strict less-than across all characters | [C10] |

### M16 Family class bonuses and extra feeders (missed in first pass)
- `classFamilyBonuses` (DATA, read in parsers/family.ts#L17) holds exact thresholds `x3` (29/69/129) with growth(decay, level - x3), so family bonus levels come from data, not just the wiki's Lv29/Lv69 (supersedes the C35 "OPEN" thresholds for the family bonus only; promotion quest levels remain open). The Bowmen "actively fighting" Class EXP family bonus is in data but is NOT modelled in `getClassExpMulti`. Confidence M.
- World 7 Clam Work also yields a class-EXP multiplier (parsers/world-7/clamWork.ts#L85 `getClamClassExpMulti`) and Button bonuses 8 and 15 feed the formula. Confidence M (bonus 15 not re-read).
- Super talent points are read per preset from `account.spelunking.talentSpelunkArrays` at `playerId + 12*preset` (parsers/talents.ts#L338-L343). Confidence M.
- Coral Kid uses `divinity.godRank` as exponent; Crucible, Menagerie and Jelly terms depend on W5-W6 systems. Confidence H.

### W5+ extensions (one line each)
- W5 (Sailing/Gaming/Divinity): Shimmer, Coral Kid, Dancing Coral, Omniphau, Compass medallions + Titan kills (`SLAYER_ABOMINATOR`), Sushi, Equinox, Spelunk rocks: all feed the multiplier above. [C23]
- W6: Spirit Time Candy (only candy usable in W6) and Summoning/Farming stay out of the formula except Zenith. [C30]
- W7: Button bonus 8, Research Grid, Zenith Market 9, Royal Statue 3, Super talents at L400+ ; `world-7/button.ts#L356` calls `getClassExpMulti`. [C21][C33]

## Min-max by stage

Priority orders below are derived from the formula, not from a ranked community list (search budget exhausted; treat as M/L confidence). [C37]

- **W1 early (L1-30):** The level bands give +150%/+100% additive, so levelling is cheap: do not spend Time Candy yet. Buy the Merit Shop "lowest-level" upgrade (3 or 4 EXP per level, disputed; 1 merit each) once alts exist. Equip Class EXP gear (stat 78/84). [C7][C10]
- **W1 mid (30-50):** keep the Blunder Hills card set 0 equipped (<50 only). Upgrade EXP Statue (Town Marble statue `EXP`, effect CLASS_EXP). Buy Explosive Salts at the Salt Lick when W3 opens. [C8][C26]
- **W1 late / W2:** stamps "classxp" and Vial `7classexp` (Mimic Tooth region), Grind Time bubble: all additive or multiplicative, bubble and vial grow with Alchemy. Use candy on the lowest-level character only when the lowest-level bonus applies (strict minimum). [C22][C26]
- **W2 late / W3 early:** Arcade "Class_XP_multi" (multiplicative) and "Class_EXP_gain" (additive); Prayers Big Brain Time; Star Signs; Post Office box 2; Achievements 61/124/188/286 (flat). [C22][C26]
- **W3 late:** Salt Lick Explosive Salts (+0.2% per level, max +20%), Shrine 5 on its map, Companions (multiplicative, large: Panda x(1+9c)), Weekly boss `c` (cap +150). [C13][C19][C26]
- **W4:** Meal "Clexp" for characters under L120, Jelly Operator, Crucible, Menagerie, Golden Nigiri, Bubba RoG. [C9][C20]
- **Afterwards (W5+):** the multiplicative chain (L5) dominates: companions, Titan kills `^` talent, Sushi, Equinox x5, Spelunk `1.03^rocks`. [C23][C24]
- **Per class:** no class-specific Class EXP rule found except talents (JUST_EXP star talent, SHINY_MEDALLIONS, EXP_CULTIVATION, ARCHLORD_OF_THE_PIRATES for Siege Breaker, SLAYER_ABOMINATOR, LUCKY_CHARMS). Bowmen family bonus gives active Class EXP at Lv101 (wiki, outdated flag). [C26][C38]

## Common mistakes
- Treating a tied-lowest-level character as getting the merit/vault/superbit bonus (it does not). [C10]
- Leaving Blunder Hills card set equipped past L50 or forgetting meals only help below L120. [C8][C9]
- Assuming the lowest-level merit is exactly +36% or +48%: code says 3 per level, data says 4 per level. Disputed, use Toolbox's value and flag. [C10][C12]
- Trusting an empty parse: guard with `EmptyAccountError` as elsewhere.

## Save and Toolbox fields
- `characters[i].level`, `characters[i].skillsInfo.character` ({level, exp, expReq}) from `Lv0/Exp0/ExpReq0` (character.ts#L392). [C5]
- `characters[i].stats.luck`, `.afkTarget`, `.cards.cardSet`, `.flatTalents`, `.flatStarTalents`, `.postOffice`, `.activePrayers`, `.starSigns`, `.mapIndex`.
- `account.tasks[2][0][2]` (lowest-level merit), `account.weeklyBossesRaw.c`, `account.saltLick[3]`, `account.accountOptions[345|179|421|139]`, `account.companions.list[i].bonus`, `account.compass.{medallions,totalKilledAbominations}`, `account.divinity.godRank`, `account.spelunking.discoveriesCount`, `account.islands.allShimmerBonus`, `account.hole.holesObject`, `account.upgradeVault.upgrades`, `account.arcade.shop`, `account.alchemy.vials`, `account.stamps`, `account.cards`, `account.owl.bonuses`. [C2]
- Computed: `getClassExpMulti(character, account, characters)` (ADR 0005: use Toolbox's number, do not re-derive); ActiveOn: `packages/account-state/src/purpose.ts#L84` already calls it for `classExpMulti`, `expPerKill`. [C39]

## Open questions
1. Promotion levels and the "Town Marble 22" gate: not in Toolbox data or wiki pages reachable (Barbarian/Blood_Berserker pages are silent). Need game data (`ClassPromotionChoices`) or an in-game check.
2. Hard level cap (Toolbox shows none).
3. Exact per-level EXP statue and Salt Lick numbers beyond the baseBonus listed; ranking of sources by actual contribution needs a worked account.
4. Community "best levelling map by stage" list and candy usage meta: no sourced list reached (search budget exhausted).
5. How skill-EXP conversion (EXP CONVERTER) scales; not in Toolbox.

## Confidence summary
H: C1-C5, C7-C9, C13-C18, C24-C26, C28, C30-C31, C33, C39. M: C19-C23, C27, C29, C32, C34, C35, C38. L: C6 wiki half, C10 per-level value, C11/C12 (disputed 36 vs 48), C36, C37 (author derivation), C21 detail. Not individually verified: C19-C22, C34.

## Claim index
C1 character.ts#L1909 getClassExpMulti (tier 1). C2 character.ts#L2160-L2215 final `value` chain (1). C3 misc.ts#L882 getExpReq (1). C4 computed from C3 (1). C5 character.ts#L392-L408; purpose-fields.ts (1). C6 character.ts#L1916-L1924; wiki Game_Mechanics_AFK (1/4, outdated). C7 character.ts#L1954 (1). C8 character.ts#L1944; wiki (1/4). C9 character.ts#L1947 (1). C10 character.ts#L1927-L1942 (1). C11 DATA shared-data.json merits[0][2], Superbit Noobie_Gains (1). C12 idleon.wiki/wiki/Game_Mechanics_AFK, outdated flag (4). C13 character.ts#L1948-L1952 (1). C14 character.ts#L1957 (1). C15 character.ts#L1960 (1). C16 character.ts#L1963-L1966 (1). C17 character.ts#L1969-L1986 (1). C18 character.ts#L1993-L1997 (1). C19 character.ts#L1999-L2040 (1). C20 character.ts#L2041-L2066 (1). C21 character.ts#L2010-L2030 (1). C22 character.ts#L2068-L2080 (1). C23 character.ts#L2082-L2125 (1). C24 character.ts#L2128-L2140 (1). C25 character.ts#L2142-L2170 (1). C26 character.ts#L2172-L2205 (1). C27 DATA stamps.json (classxp), vials.json (7classexp), cards.json (1). C28 character.ts#L2196-L2198 (1). C29 DATA vials.json ClassEXPconvert (1). C30 DATA items.json Timecandy1-10 (1). C31 misc.ts#L515-L560 (1). C32 DATA shared-data.json `obols.character/family[*].levelReq` (1). C33 world-7/legendTalents.ts#L224-L257 (1). C34 DATA classPromotions.json (1). C35 idleon.wiki/wiki/Classes, fetched 2026-10-19 (4). C36 same (4). C37 author derivation (n/a, M/L). C38 idleon.wiki/wiki/Game_Mechanics_AFK (4, outdated). C39 packages/account-state/src/purpose.ts (repo).
