# Dossier: Shrines (W3)

Verified 2026-10-19 against Toolbox @6c37e3d (pin 6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1), game version 2.3.540. Topic id `shrines`. Claim ids [C#] are listed with Source and tier in the structured return; the Source is also given inline. Tiers: 1 = game data / Toolbox parsers, 2 = Toolbox logic and dashboard, 3 = idleon.wiki, 4 = public community guides. "Computed" = derived by this dossier from the cited formula. Paths `vendor/...` mean `packages/toolbox-parsers/vendor/...` in the fix-digits checkout. Prior research: `origin/research/w3-systems:docs/research/systems/w3-systems/shrines-prayers-equinox-bosses-quests.md` (N.js symbols from game v1.23, 2026-10-17); where I rely on it for a game-client fact I say so.

**Honesty note on community sources.** Reddit was unreachable (WebFetch blocked) and the web-search budget was exhausted, so there is no tier-4 community quote in this dossier. The only external source read is idleon.wiki (tier 3, fetched 2026-10-19, summarised by the fetch tool, so treat exact wording as M confidence). Priority orders below are marked *(computed)* when derived from the formulas.

## Shrines

- **What it is:** nine placeable map buffs ("shrines"). Each gives every character on its map a bonus, and levels up from the AFK time characters claim on that map. A shrine is also a Construction building (index 18 to 26) that is bought with Refinery salts and multiplies the shrine's level-up speed. [C1][C20][C5]
- **Unlocks:** build the shrine in Construction (needs the matching salt from the Refinery: Redox, Explosive, Spontaneity, Dioxide, Purple, Nullo); place it by casting the **Shrine Architect** star talent, whose book is the reward of Hoggindaz quest 5 "Taking Samples" (take 2 Printer samples). A newly built shrine sits in the top left of Blunder Hills town until moved. Yondergreen quest 1 asks for 4 shrines placed in that map. [C20][C24][C25][C26]
- **Scope:** account-wide state (`ShrineInfo`, one row per shrine; level, map, progress), but the bonus applies per character by that character's map, and the level-up rate is summed per character. [C4][C5][C19]
- **Inputs → outputs:** In: AFK time claimed on the shrine's map (each character adds `AwayTime × rate / 3600` shrine-hours), plus salts for the building. Out: a map-scoped % bonus that grows by a fixed step per shrine level. [C2][C5][C27]
- **Goals and Milestones:** see "Mechanics catalogue" (level bar costs) and:

| Milestone | Where | Value |
|---|---|---|
| 4 shrines placed on the map | Yondergreen quest 1 "Infrastructure Plan" | reward 1 Dungeon Loot Dice [C26] |
| Total shrine level 140 | Equinox challenge cloud | unlocks the next Equinox upgrade [C35] |
| 200 total Construction skill levels (Rift Skill Mastery tier 2) | adds Shrine LV-up rate | +15% as a multiplier term [C8] |
| 1500 total Construction building levels (Construct Mastery) | Rift 40 | +100 max building level on all shrine buildings [C22] |

- **Feeds / fed by:**
  - Fed by: Construction (building level, +10% rate each), Refinery salts, AFK Setup (where characters idle), Chaotic Chizoar card, Golden Cheese (W3 super drop table), Post Office "Construction Container", Alchemy vial "Dreamy Drink", Vote Ballot bonus 19, W4 Lab "Shrine World Tour", W5 Sailing "Moai Head" artifact and Gaming superbit "Shrine Speed", W6 Jade Emporium "Shrine Collective Bargaining Agreement", W7 Legend Talent "Shrine World Order Bill". [C3][C6][C7][C9][C12][C13][C15][C16][C18][C36]
  - Feeds: damage, HP/DEF, carry capacity, drop rate, all EXP, giant/crystal spawn, respawn rate and AFK gain rate on the shrine's map; those feed every farming Goal there. Also Equinox (total level 140) and Yondergreen 1. [C30][C35][C26]
- **Per-session actions:** (1) Every built shrine should stand on a map where at least one character is AFK for the coming stretch (or in town with World Tour, or you own Moai Head/Legend 38 for the applicable half). (2) Move a shrine only just after a level-up (moving drops the bar, unless the Jade Emporium bonus is owned). (3) Spend salts on shrine building levels in cheapest-per-gain order. **Idle state:** a built shrine whose map holds no AFK character never gains progress. A shrine has no found level cap. [C17][C24][C29][C36]
- **AFK Setup implications:** stack characters on one map that holds all placed shrines; the rate is per character, so N characters AFK there level shrines N times faster. The Crystal Shrine only helps other shrines on its own map. *(computed from C5, C11)*
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:** shrines left in town with no World Tour (detect: `shrines[i].shrineLevel > 0` and `mapId` not in any character's map, and not a town placement covered by World Tour); moving shrines repeatedly; Crystal Shrine alone on a map; treating an unbuilt shrine as active (fixed upstream, see C2/C33); assuming a shrine holds a map-id of the same world as the character (World Tour compares worlds only). [C18][C19][C33]
- **Save and Toolbox fields:** see catalogue.
- **Sources:** inline per claim.

## Mechanics catalogue

Parser file for all of this: `vendor/parsers/world-3/shrines.ts` (hereafter `shrines.ts`). Catalog data: `vendor/data/website-data/shared-data.json` keys `shrines` (L38358) and `towers`.

### M1. Shrine catalogue and bonus formula
- **Rule:** nine live shrines (global index 18 to 26; local index 0 to 8). Bonus on the map = `(1 + ChaoticChizoarCard/100) × ((L − 1) × bonusPerLevel + baseBonus)` where `L` is the shrine's level; 0 when `L = 0`. [C1][C2]
- **Values (pre-card):** [C1]

| Local idx | Shrine | Effect (on its map) | base | per level | Lv 5 | Lv 10 | Lv 20 | Lv 50 |
|---|---|---|---|---|---|---|---|---|
| 0 | Woodular | +% Total Damage | 12 | 3 | 24 | 39 | 69 | 159 |
| 1 | Isaccian | +% Max HP and DEF | 12 | 3 | 24 | 39 | 69 | 159 |
| 2 | Crystal | +% level-up rate of all shrines on the map | 20 | 4 | 36 | 56 | 96 | 216 |
| 3 | Pantheon | +% Carry Capacity | 10 | 2 | 18 | 28 | 48 | 108 |
| 4 | Clover | +% Drop Rate | 15 | 3 | 27 | 42 | 72 | 162 |
| 5 | Summereading | +% ALL EXP gain | 6 | 1 | 10 | 15 | 25 | 55 |
| 6 | Crescent | +% Crystal and Giant spawn chance (building text also says Active EXP) | 50 | 7.5 | 80 | 117.5 | 192.5 | 417.5 |
| 7 | Undead | +% monster Respawn Rate | 5 | 1 | 9 | 14 | 24 | 54 |
| 8 | Primordial | +% AFK Gain Rate | 1 | 0.1 | 1.4 | 1.9 | 2.9 | 5.9 |

  (Computed values.) The wiki's per-level text (e.g. Woodular `⌊9 + 3 per level⌋`) is the same line at the wiki's own offset: `12 + 3(L−1) = 9 + 3L`. [C34]
- **Cap on shrine level:** none found in code, Toolbox sums them unbounded. A late public fixture holds levels around 349, an early one 4 to 7, a mid one 20 to 22. [C29]
- **Chaotic Chizoar card (Boss3B):** effect `+{% Shrine_Effects_(Passive)`, base 5, +1.5 per tier in `cards.json`; Toolbox reads it through `getCardBonusByEffect(account.cards, 'Shrine_Effects_(Passive)')`. [C3]
- **Field:** `account.shrines[i].{mapId, shrineLevel, name, rawName ('ConTowerB'+(18+i)), bonus, progress, desc, worldTour, crystalShrineBonus, shrineTowerValue}` from `parseShrines`; raw `ShrineInfo` (or JSON string `Shrine`) rows are `[mapId, ?, x, level, progress, 0]`. [C4]

### M2. Where a shrine applies to a character
- **Rule (`getShrineBonus`):** returns the shrine's bonus if its level > 0 and (character is on `mapId`, OR World Tour applies, OR the Moai Head artifact is owned); else 0. [C19]
- **World Tour (W4 Lab bonus index 5 `Shrine_World_Tour`):** applies if `floor(playerMap/50) === floor(shrineMap/50)`; the game does not check that the shrine is in town (verified live 2026-10-11 per Toolbox comment: map 315 applied on 330). The lab text says town placement. [C18]
- **Moai Head (W5 Sailing artifact):** "Get bonuses from all shrines from any map! You must be in same map/world to level them up though." [C7][C19]
- **Field:** `account.lab.labBonuses[name='Shrine_World_Tour'].active`; `account.sailing.artifacts`.

### M3. Level-up rate (ShrineExpBonus), per character per shrine
- **Rule (`getShrineExpBonus`):** for each character and each built shrine that is applicable (below), add
  `rate = (1 + 0.5·SuperbitShrineSpeed) × (1 + (MoaiHeadForm + 15·ConstructRankFlag)/100) × (1 + Ballot19/100) × (1 + 10·TowerLevel/100) × (1 + (CrystalShrineBonusOnCharMap + PostOfficeConstructionContainer + GoldenCheese + ShrineArchitect + VialShrineSpd)/100)`
  to `total[shrineIndex]`. Rates are in "shrine-hours per real AFK hour". [C5]
- **Applicable to the EXP loop (`isGlobalApplicable`):** shrine level > 0 AND (World Tour same world OR same map OR Legend Talent 38). Note this differs from the bonus rule: Moai Head does not let a shrine level on another map. [C17]
- **Terms:**
  - Superbit `Shrine_Speed` (Gaming superbit index 8): "All shrines level up +50% faster than normal". [C6]
  - Moai Head form: Ancient +100%, Eldritch +200% ("All shrines level up +100%/+200% faster!"), via `getArtifactFormBonus`. Higher forms exist in artifact data (`ARTIFACT_FORM_KEYS`, sailing.ts#L330): Sovereign +300%, Omnipotent +400%, and Transcendent/Verisimilitude keys; base (unacquired/base) form gives 0. The last two values were not read this pass (confidence L). [C7] Confidence H for 100/200/300/400.
  - Construct skill rank flag: `isMasteryBonusUnlocked(rift, constructionRank, 1)`: 0 before Rift 15; else 1 when Construction skill rank > 1 (200 total Construction levels); worth ×1.15. Wiki: "+15% Shrine LV up rate" at 200. [C8]
  - Ballot 19: the selected Vote Ballot bonus value (0 if not selected). [C9]
  - Tower level term: `10 × the shrine building's level` percent, so a Lv-10 Woodular building doubles level-up speed. **Disputed (tier 1 vs tier 3):** wiki says Crescent gets 7.5 not 10 (the prior W3 dossier tags it "nerfed v2.36"); Toolbox code (`shrines.ts#L93`) applies 10 to all nine with no Crescent exception, confirmed by both verifiers; the wiki claim itself is unverified (L). Both views kept. Confidence M that the code is right and the wiki/tooltip value is stale or applies to the bonus-per-level (7.5) rather than the rate. [C10]
  - Crystal term: the Crystal Shrine bonus as it applies to the character's own map (`getShrineBonus(..., idx 2, characterMap, ...)`), so it also counts for a character whose World Tour or Moai Head delivers it. Additive with the next four. [C11]
  - Post Office box `Construction_Container`, second upgrade `%_Shrine_Charge_Rate`: `75·n/(n+200)` where `n = boxLevel − 24.9` (floored at 0); box max 400, so about 49% at 376 and under 75% always. [C12]
  - Golden Cheese (golden food `FoodG8`, Effect `ShrineEffect`, base Amount 20): bonus = `20 × goldenFoodMulti × 0.05 × log(1+qty) × (1 + log(1+qty)/2.14)` (lavaLog), only while equipped (or Jade "Gold Food Beanstalk"). Wiki: "levels up shrines 20% faster". [C13]
  - Shrine Architect star talent (`SHRINE_ARCHITECT`): "+{% Charge Rate", `50·L/(L+50)`, cooldown 6, so max under 50%. [C14]
  - Vial "Dreamy Drink" (vial 63, stat `ShrineSpd`, func add, x1 3.5): `3.5 × vialLevel` percent. [C15]
- **Fields:** `account.shrinesExpBonus.{total[9], breakdown[shrineIndex][{name,value}]}`; characters: `character.mapIndex`, `character.postOffice`, `character.flatStarTalents`, `character.food`. [C32]

### M4. Progress to the next level (the "hours" bar)
- **Rule (from game client, prior dossier, NOT in Toolbox; unverifiable here, confidence L; the formula was not re-read from N.js. Public fixtures are consistent with it: a level-7 shrine had progress ~19 vs requirement ~905, a level-349 one ~7e76 vs ~2e77):** shrine-hours needed to go from level L to L+1: `ShrineHrREQ(L) = 20(L−1) + 6·L·1.63^(L−1)` (N.js `_customBlock_WorkbenchStuff("ShrineHrREQ")` @7818593, floored/adjusted below L 20 per the prior note; I could not re-read the minified file this session). Computed: [C27][C28]

| Step | Hours | Cumulative from Lv 1 |
|---|---|---|
| 1→2 | 6 | 6 |
| 2→3 | 40 | 46 |
| 3→4 | 88 | 133 |
| 4→5 | 164 | 297 |
| 5→6 | 292 | 589 |
| 9→10 | 2,851 | 6,469 |
| 10→11 | 5,053 | 11,523 |
| 15→16 | 84,394 | 196,714 |
| 20→21 | 1,290,844 | 3,077,648 |
| 25→26 | 18.6 M | 45.0 M |

  The computed rows depend on the unverified formula (confidence L); spot checks of Lv2 6, Lv3 ~46, Lv4 ~133 match it. (Prior dossier rounds slightly differently, e.g. 39/87/163; the difference is rounding of the same formula.) ETA to next level = `(ShrineHrREQ(L) − progress) / total[i]` hours; Toolbox exports `total[i]` but not `ShrineHrREQ`. [C27][C32]
- **Moving a shrine** (wiki/client claim, tier 3, unverified, confidence L; consistent with the Jade upgrade text) zeroes `progress`, keeps level. Jade Emporium upgrade "Shrine Collective Bargaining Agreement" removes the loss. [C24][C36]
- **Field:** raw `ShrineInfo[i][3]` level, `[4]` progress; parsed `shrines[i].progress`. Raw rows are `[mapId, ?, x, level, progress, 0]`; idx 1 is an unknown field and idx 2 the x position. Caveat on scale: late-game fixtures hold progress values near 1e76, so the field is not a plain hour counter at high level and the exact level-up requirement is unverified (confidence L). In fixtures the key sits under `data/Shrine` as a JSON string, not top-level. [C4]

### M5. Building (Construction side)
- **Rule:** shrine buildings are Construction towers 18 to 26, `maxLevel 100` before extras, salt per Refinery tier. Toolbox build-cost helper: `cost(level) = RANDOlist[13][index] × bonusInc^level`. Bases (index 18 to 26): 10, 250, 1,000, 7,500, 40,000, 200,000, 2,000,000, 7,000,000, 60,000,000. `bonusInc`: 1.16, 1.15, 1.13, 1.115, 1.11, 1.106, 1.106, 1.10, 1.09. Salt types and `itemReq.amount`: Redox 2/5, Explosive 4/7, Spontaneity 5/10, Dioxide 12, Purple 14, Nullo 10. The role of `itemReq.amount` against the `RANDOlist` base is not settled by Toolbox (see open questions). [C20][C21]
- **Max level extension (`getExtraMaxLevels`):** for `maxLevel 100` towers: Construct Mastery SHRINE_LV tier (+100 at 1500 total levels, Rift ≥ 40) + Sushi bonus 58 + Menagerie boost 5; shrine buildings (index ≥ 18) also +100 more when `coralReef.unlockedCorals > index − 18` (W7 Coral Reef). Wiki lists "Max Level 200" for every shrine, which equals 100 + the +100 mastery/coral tier. [C22][C23]
- **Field:** `account.towers.data[i].{level, maxLevel, progress, inProgress}`, `account.towers.totalLevels`, raw `TowerInfo[18..26]`. [C21][C22]

### M6. Where each bonus is consumed (so detectors can attribute)
Woodular (0): damage.ts L324. Isaccian (1): damage.ts L1097 and L1388 (HP, defence). Crystal (2): shrines.ts only. Pantheon (3): misc.ts L1156 (carry capacity). Clover (4): character.ts L2398 (drop rate). Summereading (5): character.ts L1666 and L2159 (EXP). Crescent (6): character.ts L3086 (crystal spawn) and misc.ts L902 to 912 (giant spawn chance, with Glitterbug prayer and giant-mob vial). Undead (7): character.ts L1813 (respawn). Primordial (8): character.ts L3277 (AFK gain). All use `getShrineBonus`. [C30]

### M7. W5+ and later extensions (one line each)
- W5 Moai Head artifact: bonuses from every map, and +100%/+200% level-up speed in Ancient/Eldritch form. [C7]
- W5 Gaming superbit "Shrine Speed": +50% level-up speed. [C6]
- W6 Jade Emporium "Shrine Collective Bargaining Agreement": moving no longer loses EXP. [C36]
- Vote Ballot bonus 19: the string "Boosts Shrine EXP gain by a staggering }x" is the 20th chunk (ballot index 19) of `ninjaExtraInfo[38]` (`voteBallot.ts#L133` chunks the list by 3; string at L29481 of the data file). It is already modelled as the `(1 + Ballot19/100)` term at `shrines.ts#L83`; it is NOT a missing multiplier. Corrects earlier claim C37. [C37 corrected, C9] Confidence H.
- W7 Legend Talent 38 "Shrine World Order Bill": shrines gain EXP from AFK gains in any world. [C16]
- W7 Coral Reef: +100 max building level per unlocked coral. [C22]
- Rift Construct Mastery 1500: +100 max level for all shrines. [C22]

### M8. Missed mechanics (added after adversarial review)
- **Crystal Shrine applies on the character's map:** its term in M3 is evaluated at the character's own map, not the levelled shrine's map, so a shrine can be boosted by a Crystal Shrine on another map via World Tour or Moai delivery. [C11] Confidence H (code).
- **Per-character AFK-claim loop:** `isGlobalApplicable` is checked per shrine per character and the rates are summed per shrine; the per-character split is exposed as `shrinesExpBonus.breakdown`. [C17][C32] Confidence H.
- **Per-shrine tower level:** every parsed shrine row exposes `shrineTowerValue` (the Construction building level feeding the `10 x` term). [C4][C10] Confidence H.
- **Golden Cheese path:** `goldenFoodMulti` scales the food; the Jade "Gold_Food_Beanstalk" bonus (misc.ts#L1060-1071, with beanstalk rank) lets the food count when not equipped. [C13] Confidence M (formula read by one lens, drop chance not re-checked).
- **Crescent Active EXP:** the building description also says it boosts Active EXP; Toolbox models only crystal and giant spawn. Not modelled upstream. [C31] Confidence H.
- **Consumers beyond the table:** Isaccian feeds Max HP and DEF (damage.ts#L1097, #L1388); Woodular feeds the account total-damage multiplier; Summereading feeds both the display (character.ts#L1666) and the EXP calc (#L2159). Local index passed by consumers: Crescent 6, Pantheon 3, Clover 4, Summereading 5, Undead 7, Primordial 8. [C30] Confidence H.
- **Research bonuses:** `research.json` (L841, L1695) has "+{ Max Build LVs for all Shrines in Construction" and "+{ Max LV for all Shrines in Construction". No parser in the vendored Toolbox reads them (grep found only the data strings), so whether they add to `getExtraMaxLevels` beyond the Mastery, Sushi and Menagerie terms is unknown. Confidence L. Open question for a game-client check.
- **Achievement "My_Shrines,_m'lord.":** `tasks.json` L799, "In a single map, have the total lv of all shrines be at least {", with breakpoints (reported by the data verifier) 4, 12, 24, 35, 48, 70, 86, 100 and up. Useful as a per-map goal (stack all shrines on one map). Breakpoints not re-read by me; confidence M.
- **Max level:** all nine towers have `maxLevel` 100 (before extras). Confidence H. Wiki "Max 200" is tier 3, unverified (L).

## Confidence per claim
H: C1 C2 C3 C4 C5 C6 C7 (100/200/300/400) C9 C11 C12 C13 C14 C15 C16 C17 C18 C19 C20 C21 C22 C25 C26 C29 C30 C31 C32 C33 C35 C36.
M: C8 (code confirmed at misc.ts#L842-844; wiki and rift-dossier parts unverified), C10 (Disputed, see M3).
L (unverifiable): C23 (wiki Max 200), C24 (move loses progress), C27 (ShrineHrREQ formula), C28 (derived from C27), C34 (wiki per-level text and Crystal-first priority).
Removed/corrected: C37 (refuted by both lenses; replaced by the Vote Ballot 19 correction in M7).

## Min-max by stage

No tier-4 meta was retrievable (see honesty note). The orders below come from the formulas and the one wiki priority line. *(computed)* means derived here, please validate with a human pass.

- **W1 (early/mid/late):** nothing to do; shrines do not exist until W3 (Construction, Refinery and the Shrine Architect book are W3 content). Detector should show "not unlocked" until the Hoggindaz chain is reached. [C25]
- **Early W3 (first Redox, Hoggindaz 5 done):** build Woodular (Redox, cheapest base 10) and Isaccian; place both on the map most characters AFK on; every Woodular building level is +10% level-up speed multiplicatively, which dominates early. *(computed from C5, C21)*. Wiki order: "Crystal Shrine first" because it speeds all others on the map; computed check: Crystal's level-up term sits in an additive group with Post Office, Cheese, Architect and vial, so at Crystal Lv 1 (20%) it is worth about +20% on top of base, less than a +10% building level on a shrine you already have (cheap while 10×1.16^L is small). Both orders are close; confidence M. [C34][C11]
- **Mid W3 (Explosive and Spontaneity salts):** Crystal, then Clover (drop) and Summereading (EXP) on the main grind map; Pantheon only if carry capacity limits AFK. Equip Shrine Architect talent levels (50L/(L+50)) and fill the Post Office box past level 25 (75L/(L+200)). Hit total shrine level 140 for the Equinox unlock (about 15.5 average over 9, or more on fewer high-level shrines). [C12][C14][C35]
- **Late W3:** Crescent (Dioxide) on a giant/crystal map with the Tachion prayer for giants; Undead for kill-count Goals; Golden Cheese equipped on every character that AFKs there (drops from the W3 super drop table, e.g. Chizoar bosses at 0.0024 effective). Chaotic Chizoar card for +5% (+1.5 per tier) shrine effects. Primordial last (+1 to +3% AFK gain, salt cost is the highest). [C13][C3][C1]
- **W4:** Lab "Shrine World Tour": place shrines in town so they act in every map of the world; removes the one-map constraint (levels also in all maps of that world). Rift 15+ with 200 Construction levels: +15%. [C18][C8]
- **W5+ outline:** Moai Head (any-map bonuses, +100/+200% speed), Shrine Speed superbit (+50%), Jade Emporium no-loss move, Legend 38 (any world levelling), Construct Mastery 1500 and Coral Reef for +100 max levels each. [C6][C7][C16][C22][C36]
- **Per class:** no class-specific rule in code. Isaccian helps classes that die; Woodular helps everyone. *(computed)*

## Sprites needed (for the build phase)

Existing: one generic `item-shrine` sprite (`apps/activeon/src/art/sprites/grids/items.ts`) and a design-lab `v2-systems-shrine.svg`. Needed for per-shrine rows: nine shrine icons (one per shrine, tinted by salt colour), plus small icons for Golden Cheese and the Crystal link. [Observed by reading the repo; no claim number]
