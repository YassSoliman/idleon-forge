# Dossier: Party Dungeons (account-wide Dungeon meta-progression)

Topic id `dungeons`. Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Claims [C1]..[C46] (C15 unused). Revised 2026-10-19 after two adversarial verdict sets: no claim was refuted by both lenses (nothing removed); C36 item counts are Disputed between lenses; every claim now carries H/M/L confidence in the register are registered at the end with Source and tier. Tier: 1 game data / Toolbox code, 2 Toolbox logic, 3 wiki (idleon.wiki), 4 community. Paths are relative to `packages/toolbox-parsers/vendor/` (V/). Where sources disagree both views are given with confidence (H/M/L).

## Dungeons

- **What it is:** Instanced party content with three dungeons: Grandfrog's Gazebo (W1 frogs), Crypt of Snakenhotep (W2 desert) and Glacial Basement (W3 ice) [C1][C2]. Runs pay Dungeon Credits (white) and Flurbos (pink). Credits buy in-run RNG items and in-run passives; Flurbos buy permanent out-of-dungeon account stats, keychains and star talents [C3][C4]. A dungeon rank (from lifetime credits) unlocks trait sets [C8][C9]. There is no W4 dungeon in the data (W5+ extension: none found, see Open questions).
- **Unlocks:** Introduced in v1.30 [C1]. Exact unlock quest/level is not in the data; a quest named "The Desert Dungeon Prequest" exists [C32]. Not verified (confidence L).
- **Scope:** Account-wide. Credits, Flurbos, ranks, and all shop levels live in the account save. Runs per week are account-wide (12 free + 3 per Gem Shop booster) [C13].
- **Inputs -> outputs:**
  - **In:** weekly runs (boosted runs), party kills. Mobs drop credits/flurbos at per-monster chances; bosses drop them at 0.8 [C5][C6]. Party size multiplies drop rate by sqrt(n) (up to 3.16x for 10) [C14] (wiki only, M).
  - **Out (permanent, outside dungeons):** Flurbo shop stats: Weapon Power, Talent Points, Class EXP, Skilling EXP, Monster Cash, Accuracy, Defence, AFK Gains [C3][C20]. Star talent DUNGEONIC_DAMAGE scales with log10 of lifetime credits [C22]. Tome scores Dungeon Rank [C23]. Keychains (Gem Shop or Flurbos) give equip bonuses [C16][C17]. Cards in the "Dungeons" category (23) [C18].
  - **Out (in-dungeon only):** credit-shop RNG items [C7], passives [C10], traits [C9]. These do not affect the open world (Toolbox never reads them outside `insideUpgrades`/`rngItems` listing) [C19].
- **Goals and Milestones:**

| Milestone | Threshold | Reward | Claim |
|---|---|---|---|
| Rank 5/10/15/20/25/30/35/40/50 | lifetime credits 28 / 230 / 1,310 / 5,000 / 15,000 / 36,500 / 85,000 / 200,000 / 1.2M | Trait set unlocks (Beginner ... Endothelium) | [C8][C9] |
| Max rank 87 | 1e16 lifetime credits | Tome points | [C8][C23] |
| Max 5 Flurbo stats | 5 stat upgrades maxed (level 50) | Equinox: unlock next upgrade | [C24] |
| Beat Vengeful Grandfrogger (4th diff) | 1 | Equinox: Tick Tock book cap to Lv 200 | [C24] |
| Beat Inevitable Snakenhotep / Caustic Glaciaxus | 1 each | Equinox bar fill +20% / +25% | [C24] |
| Dungeon damage achievements | single hit 100 / 1,000 / 25,000 | +1% / +2% Class EXP, +4% crit chance (outside dungeons) | [C25] |

- **Feeds / fed by:** Fed by Gem Shop (boosters, keychains) [C13][C16], Arcade/rank-agnostic. Feeds: damage (Weapon Power, Accuracy, DUNGEONIC_DAMAGE), Defence, Class EXP, Monster Cash, AFK Gains, talent points [C20][C21][C22], Equinox challenges [C24], Tome [C23], Cards system [C18], Fractal Island bonus 1.25x credits and flurbos (200 cost) [C26]. See also Stamps/Cards/Talents/Equinox/Tome dossiers.
- **Per-session actions:** Spend weekly runs (they reset weekly); use Happy Hour windows to burn boosted runs in bulk [C14]. Spend banked Flurbos on the next Flurbo stat below cap 50. Spend credits on passives up to cap 100 (credits cap per level) [C11]. Idle/capped state: all 8 Flurbo stats at level 50, Flurbos unspent, or unspent weekly runs.
- **AFK Setup implications:** none for dungeon play; the AFK Gains Flurbo stat (+5% at max) adds to AFK gains for every character [C20].
- **Min-max by stage:** below.
- **Common mistakes:** Dumping Flurbos on keychains before Flurbo stats [C28] (star talents first is implied by their level gates, not an explicit wiki line; M); ignoring that RNG items and passives reset to nothing outside dungeons [C19]; not rank-farming to open trait sets; skipping the account-wide Gem Shop weekly booster.
- **Save and Toolbox fields:** Mechanics catalogue.
- **Sources:** Claims register.

## Mechanics catalogue

Save keys: `DungUpg` (JSON array) and `OptLacc` (account options array). Parsed by `parsers/dungeons.ts#getDungeons` into `accountData.dungeons` [C5].

1. **Dungeon upgrade array (DungUpg).** `DungUpg[0]` = credit-shop RNG item levels, `[1]` = in-dungeon passive levels, `[2]` = trait selections (list of global bonus indices), `[5]` = Flurbo stat levels [C5]. `[3]`,`[4]` unused by Toolbox (unknown).
2. **Credit-shop RNG items (48).** `account.dungeons.rngItems[i]` = entry of `dungeonCreditShop` + `level` (from `DungUpg[0][i]`). Fields: name, bonus key, rarity, baseValue, increment, maxLevel. Rarities: 20 Common, 12 Uncommon (Sucker_Punch..Vampire_Fangs), 8 Rare (Dead_Book..3_of_a_Kind), 5 Epic (Angelite..Coin_Flip), 3 Legendary (Horn_of_the_Foal 600%/+15 crit, Stone_of_the_Bulwark, Triad_of_Manafine); maxLevel 4-30 per item. Value per level: `baseValue + increment*(level-1)` per wiki text for Helping Heart/Horn [C7][C29]. Rarity-based cost scale in `wikiTables.dungeonRngUpgCost` (scale 0.7, power 1.5, powerRate 0.05, rarityBase 1, rarityRoot 4, pivot 2.348) [C12] (parameters only; Toolbox does not consume them, exact formula unverified).
3. **In-dungeon passives (8), "insideUpgrades".** `account.dungeons.insideUpgrades[i].level` from `DungUpg[1][i]`. Effect = `growth(func, level, x1, x2)`: Max_HP add 1; Max_MP add 1; Base_Damage decay 100/100; Total_Dmg decay 250/100; Crit_Chance decay 50/100; Move_Speed decay 70/100; Block_Chance decay 50/100; Drop_Rarity decay 150/100 [C10]. `decay` = `x1*L/(L+x2)` [C27]. Level cap 100 for credit stats (`dungeonPassiveCaps.credits`), yielding max HP/MP +100, BaseDmg +50, TotalDmg +125%, Crit +25%, Move +35%, Block +25%, Drop +75% [C11][C3]. Cost params `dungeonPassiveCost.credits` base 2, scale 1.5, exponent 1.04, rate 1.024, pivot 60, nudge 0.01, every 1000 [C12] (wiki mentions cost step-ups past levels 50/100: M [C3]).
4. **Flurbo stats (8), out-of-dungeon.** `account.dungeons.upgrades[i].level` from `DungUpg[5][i]`. Order: Weapon_Power decay 50/80; Talent_Pts add 1; Class_Exp decay 45/100; Skilling_Exp decay 90/100; Monster_Cash decay 75/100; Accuracy add 1; Defence add 1; AFK_Gains decay 10/50 [C20]. Cap level 50 (`dungeonPassiveCaps.flurbos`) gives: WepPow 19.23, Talent Pts +50, Class EXP +15%, Skilling EXP +30%, Monster Cash +25%, Accuracy +50, Defence +50, AFK Gains +5% [C11][C3]. Cost params `dungeonPassiveCost.flurbos` base 1, scale 1.7, exponent 1.05, rate 1.027, pivot 30, nudge 0.01, every 1000 [C12].
   - Consumers: Weapon_Power `parsers/damage.ts` L1124, Accuracy L1017, Defence L1395; Class_Exp `parsers/character.ts` L2164; Monster_Cash L2794; AFK_Gains L3267; Talent_Pts `parsers/talents.ts` L579 [C21]. Skilling_Exp is NOT consumed anywhere in Toolbox (the only Class_Exp-like skill use at `character.ts` L1675 reads `getDungeonStatBonus(upgrades,'Class_Exp')`, i.e. the same Flurbo class-exp stat as a skill-EXP term) [C21] (possible Toolbox gap, confidence M).
5. **Traits (9 sets, 28 bonuses).** `account.dungeons.statBoosts[set].bonuses[j].isActive` = global bonus counter in `DungUpg[2]` [C5]. Sets and rank gates: Beginner 5, Kinda Cool 10, Strategery 15, Da Cred 20, Drop Drip 25, Cash Money 30, ChOiIiCe 35, Royale 40, Endothelium 50; one active per set, switchable at the entrance (wiki) [C9][C3].
6. **Credits / Flurbos / boosted runs.** `dungeons.credits = OptLacc[72]`, `flurbos = OptLacc[73]`, `boostedRuns = OptLacc[76]` [C5]. Lifetime credits earned `progress = OptLacc[71]` [C5].
7. **Rank.** `rank` = index of first `randomList[29]` entry that `progress` is still below (reaching a requirement exactly counts as the next rank); `rankReq` = next threshold; 87 entries (0..86) so max rank 87 [C8].
8. **Drops.** Per monster `monsterDrops` give `DungCredits1` (credits) and `DungCredits2` (Flurbo edition) at chances: W1 mobs 0.012-0.04 / 0.0014-0.025, W2 mobs 0.012-0.03 / 0.0017-0.006, W3 Ice Guard 0.2 / 0.08; every boss form (frogGR..GR4, snakeZ..Z3, iceBossZ..Z3) 0.8 / 0.8 [C6]. Trait "Da Cred" adds +30% credit and +30% Flurbo drop chance [C9].
9. **Weekly runs / Gem Shop (runs reset weekly; 12 free) [C46].** WEEKLY_DUNGEON_BOOSTERS (GemP15, 275 gems, +40 per purchase, max 11): +3 runs/week each over 12 free [C13]. Happy Hour allows bulk use of 3 or 20 boosted runs [C14]. Keychain gems: Tier 1 150 gems = 40 fragments, Tier 2 325 = 120, Tier 3 490 = 300 [C16]. `Dungeon_Loot_Dice` (GemP16) needs Rank 10 for Tier 2 and Rank 20 for Tier 3 keychains [C39] (cited from items.json, not gemShop.json).
10. **Keychains.** 25 keychain stat definitions (`dungeonKeychains`, three tier values each, e.g. EquipmentKeychain10 Total Damage 1.5/2.5/3 %) [C17]. Toolbox stone logic: a keychain's stone replaces its UQ entry (`parsers/items.ts` L21-L33) [C17]. Flurbo-shop keychain prices (wiki): T1 50, T2 500, T3 3,000, T4 1,000,000 Flurbos; T4 awards no keychain, a pure sink [C28][C37] (wiki only, M; the Gem Shop route is data-verified). Dungeon_Loot_Dice (items.json GemP16) rolls keychains: Rank 10 for Tier 2, Rank 20 for Tier 3 [C39].
11. **Flurbo-shop star talents, pendants, rings.** Chain Supersource 15 -> Dungeonic Damage 50 -> Milkyway Candies 80 -> Action Frenzy 200 -> Mega Crit 400 Flurbos, each needing the previous at Lv 70/80/90/100 [C28] (wiki only, M). DUNGEONIC_DAMAGE (talent 638, star talent): `x1=15,x2=100,decay`; damage bonus = talent bonus * `lavaLog(OptLacc[71])` [C22].
12. **Cards (Dungeons category, 23).** Frog/desert/ice cards: Poisonic Frog +Base Dungeon MP, Globohopper block, King Frog base damage, Lava Slimer card chance, Chromatium Frog +Dungeon Credits 2.5, Eldritch Croaker and Grandfrogger RNG-orb start, Rotting Grandfrogger +Flurbos 4, Forlorn Grandfrogger +Credits 5, Vengeful Grandfrogger move speed, Target HP, Grumblo card chance, Beefie money, Lazlo RNG rarity, Cactopunk boss dmg, Crescent Spud MP regen, Snakenhotep drop rate, Enraged Snakenhotep total dmg, Inevitable Snakenhotep +Flurbos 5, Ice Guard MP regen, Glaciaxus card chance, Golden Glaciaxus +Credits 8, Caustic Glaciaxus total dmg 8 [C18]. Credit/flurbo cards are the ones that matter for meta.
13. **Island bonus.** Fractal Island: 1.25x Dungeon Credits and Flurbos, cost 200 [C26].
14. **Tome.** Tome entry "Dungeon_Rank" (x1 30, x2 0, x3 250 pts max): points `ceil(250*(1.7q/(q+30))^0.7)` [C23].
15. **Equinox challenges.** Max 5 Flurbo stats; beat 4th-diff Grandfrogger; beat Inevitable Snakenhotep; beat Caustic Glaciaxus [C24].
16. **Achievements.** Dungeon_Pinch (100 dmg hit), Dungeon_Slap (1000), Dungeon_Wallop (25000), 2_minute_meal, Big_Frog_*/Tomb_*/Boss tier clears, Wazzzzam!, Just_Passing_By, Capitalist_Win (1000 jobs): rewards are class EXP, total damage, crit chance, multikill [C25].
17. **Dungeon items.** DUNGEON_ITEM/EVAPORATE items and credits currencies are not storable in the Storage Chest (excluded from greenstack) [C30].
18. **Guild tasks.** "Play_Party_Dungeon" (1) and "Play_Party_Dungeons" (4) give 10 / 30 GP [C31].
19. **W5+ extensions:** none found; "Dungeon_Cove" in Sailing is an island unrelated to the dungeon [C33]. Crystal Glunko Cove strips a "(Dungeon)" suffix from item names only [C34].

## Additional mechanics (added after verification)

20. **Dungeon equipment.** Armor/jewelry Types HELMET, SHIRT, PANTS, SHOES, PENDANT, RING (5 tiers each) plus DUNGEON_KEY-style DUNGEON_ITEM (8), DUNGEON_EVAPORATE (1), CURRENCY (5). Enhancers DungEnhancer0/1/2 (Weapon/Armor/Jewelry) reroll a random enhancement, replacing the old one [C38]. Confidence H for existence, L for drop sources/rates (not in data).
21. **Loot-type bias traits.** Trait bonuses shift drops between enhancers and equipment (25%) and weapons vs armor/jewelry (25%) [C40].
22. **Card stat labels.** Dungeon cards use BaseDungeonHP/MP/Damage, DungeonBossDmg, DungeonMPregen, DungeonDropRate, DungeonCardChance, DungeonMoney; these are in-dungeon effects (not read in the open world) [C42][C19].
23. **Unconsumed save fields.** Dungeon_CredMulti, Dungeon_FlurboMulti, Dungeon_CardMulti, Dungeon1_time exist in the save type; Toolbox ignores them. Other credit/flurbo multiplier texts exist (L29466, L34521) [C41][C45]. A tracker should not display these until their meaning is confirmed (L).
24. **Boss forms and difficulty.** Grandfrogger has four forms (Grandfrogger, Rotting, Forlorn, Vengeful), Snakenhotep an Enraged form and Glaciaxus a Golden form; difficulty tiers (4+) gate Equinox clears [C2][C24][C46].
25. **Unlock text and maps.** "Mobs can drop Dungeon Credits now" unlock and the Grandfrog's Backyard/Gazebo maps [C43]. "(Dungeon)" variant resources such as Tree7D exist [C44].

## Min-max by stage

Community meta coverage is thin: Reddit was not fetchable and the web search budget was exhausted, so the lines below are wiki recommendations plus data-derived value-per-cost reasoning. Confidence L-M.

- **W1 early (before rank 5):** Run the free weekly runs. Credit passives first: Max HP/MP, then Base Damage and Total Dmg (largest scalers) [C10][C3]. RNG items: Rabbit Paw and drop-rate items early [C35]. Flurbo stats: Weapon Power and Talent_Pts first (flat, uncapped benefit) [C20] (derived).
- **W1 mid (rank 5-15):** Pick traits as sets open: Beginner then Kinda Cool (guaranteed starting RNG items) [C9]. Flurbo order (derived from value per level, M): Talent_Pts (+1 per level), Weapon_Power, Class EXP, Defence/Accuracy. Wiki ranks Star Talents before keychains [C28].
- **W1 late / W2 (rank 15-30):** Da Cred (rank 20) before Drop Drip. Craft cards that raise credit/flurbo gain (Chromatium, Forlorn Grandfrogger, Rotting Grandfrogger) [C18]. Max 5 Flurbo stats for the Equinox unlock [C24]. Beat Vengeful Grandfrogger on 4th difficulty and Inevitable Snakenhotep for Equinox gains [C24].
- **W3 (rank 30-40):** Cash Money, ChOiIiCe, Royale traits. Finish Caustic Glaciaxus [C24]. DUNGEONIC_DAMAGE star talent via Flurbo chain [C28].
- **W4 (rank 40-50+):** Endothelium (rank 50, needs 1.2M lifetime credits) gives specialised builds [C9][C8][C3]. Fractal Island 1.25x multiplier (cost 200 in Fractal currency) [C26]. Gem Shop boosters: buy as gems allow (275 + 40 each, +3 runs) [C13]. Tome: rank raises points with diminishing returns [C23].
- **Per class:** Not differentiated in sources; weapons are per-class dungeon weapons (Spear/Bow/Wand/Fisticuff families) [C36].

## Common-mistake detectors (save-based)

- Unspent Flurbos while any Flurbo stat < 50; `dungeons.flurbos > 0` [C5].
- Boosted runs unused: `dungeons.boostedRuns > 0` near weekly reset [C5].
- Rank below next threshold with weekly runs unspent.
- Missing Equinox unlock: fewer than 5 Flurbo stats at level 50 [C24].

## Open questions

- Dungeon unlock quest and level requirements (not in data).
- Exact credit/Flurbo cost formulas: parameters exist in `wikiTables` but no consumer; need the game source mapping of `dungeonPassiveCost`.
- `DungUpg[3]`, `[4]` contents; `OptLacc[74..75]`.
- Whether Skilling_Exp Flurbo stat is applied anywhere (Toolbox does not).
- Whether any W4+ dungeon exists on game 2.3.540.
- Credit-per-run and runs-per-hour economics: no source.
- Community upgrade-order guides (Reddit/Steam/IdleOn Academy) were not retrievable; priority orders here are wiki/derived.

## Claims register

| Id | Claim | Source | Tier | Verified | Confidence |
|---|---|---|---|---|---|
| C1 | Dungeons introduced v1.30; three dungeons (Gazebo, Crypt of Snakenhotep, Glacial Basement) | https://idleon.wiki/wiki/Dungeons | 3 | 2026-10-19 | M |
| C2 | Dungeon bosses: Grandfrogger, Snakenhotep, Glaciaxus with Inevitable/Caustic forms as 3rd W2/W3 bosses. Full forms: Grandfrogger, Rotting, Forlorn, Vengeful (4); Snakenhotep also has an Enraged form; Glaciaxus a Golden form (gamedata verifier). Boss list in the dossier body is incomplete, not wrong | V/data/website-data/shared-data.json L7736, L7761; monsterDrops keys | 1 | 2026-10-19 | H |
| C3 | Wiki: credit passive and Flurbo stat values and caps (Max HP 100 ... Drop 75; WepPow 19.2, TalPts 50, ClassEXP 15, SkillEXP 30, Cash 25, Acc 50, Def 50, AFK 5) | https://idleon.wiki/wiki/Dungeons | 3 | 2026-10-19 | M |
| C4 | Credits buy RNG items/passives; Flurbos buy keychains, star talents, pendants, rings | https://idleon.wiki/wiki/Dungeons ; https://idleon.wiki/wiki/Dungeon_Credits_Shop | 3 | 2026-10-19 | M |
| C5 | getDungeons parses DungUpg[0]=rng items, [1]=inside upgrades, [2]=trait picks, [5]=Flurbo stats; OptLacc 71 progress, 72 credits, 73 flurbos, 76 boosted runs; index.ts L209 | V/parsers/dungeons.ts#L21-L65; V/parsers/index.ts#L209 | 1 | 2026-10-19 | H |
| C6 | Drop chances for DungCredits1/2 per monster; bosses 0.8 | V/data/website-data/monsterDrops.json (frogP.. iceBossZ3) | 1 | 2026-10-19 | H |
| C7 | 48 credit-shop RNG items with rarity, baseValue, increment, maxLevel | V/data/website-data/shared-data.json L6622-L7103 | 1 | 2026-10-19 | H |
| C8 | Rank = first randomList[29] entry progress is below; list has 87 entries; thresholds as tabled | V/parsers/dungeons.ts#L52-L58; V/data/website-data/randomList.json[29] | 1 | 2026-10-19 | H |
| C9 | Nine trait sets with rank gates 5,10,15,20,25,30,35,40,50 and their bonuses | V/data/website-data/shared-data.json L7338-L7420 | 1 | 2026-10-19 | H |
| C10 | dungeonStats (8 passives) func/x1/x2 | V/data/website-data/shared-data.json L7272-L7337 | 1 | 2026-10-19 | H |
| C11 | dungeonPassiveCaps credits 100, flurbos 50 | V/data/website-data/wikiTables.json L1983-L1986 | 1 | 2026-10-19 | H |
| C12 | dungeonRngUpgCost and dungeonPassiveCost parameters | V/data/website-data/wikiTables.json L1955-L1982 | 1 | 2026-10-19 | H |
| C13 | WEEKLY_DUNGEON_BOOSTERS: +3 runs/week, 12 free, cost 275 +40, max 11 | V/data/website-data/gemShop.json L374-L382 | 1 | 2026-10-19 | H |
| C14 | Happy Hour bulk-use of 3 or 20 boosted runs; party droprate sqrt(n) | https://idleon.wiki/wiki/Dungeons | 3 (unverifiable in vendored code/data) | 2026-10-19 | L |
| C16 | Keychain gem shop items 150/325/490 gems for 40/120/300 fragments; Loot Dice rank 10/20 tier gates | V/data/website-data/gemShop.json L383-L412 (gem packs); V/data/website-data/items.json GemP16 Dungeon_Loot_Dice description (rank 10/20 gate; not in gemShop.json) | 1 | 2026-10-19 | H |
| C17 | dungeonKeychains stat table (25 keychains); stone replaces UQ entry | V/data/website-data/shared-data.json L7170-L7271; V/parsers/items.ts#L21-L33 | 1 | 2026-10-19 | H |
| C18 | 23 Dungeons-category cards and effects | V/data/website-data/cards.json (category "Dungeons") | 1 | 2026-10-19 | H |
| C19 | Only Flurbo stats (upgrades) feed damage/EXP/etc.; insideUpgrades, rngItems, statBoosts not read by any other parser | grep of V/parsers for account.dungeons usage | 1 | 2026-10-19 | H |
| C20 | dungeonFlurboStats func/x1/x2 | V/data/website-data/shared-data.json L7104-L7169 | 1 | 2026-10-19 | H |
| C21 | Flurbo stat consumers: damage.ts L1017/L1124/L1395, character.ts L1675/L2164/L2794/L3267, talents.ts L579 | V/parsers/ files named | 1 | 2026-10-19 | H |
| C22 | DUNGEONIC_DAMAGE talent 638 x1 15 x2 100; damage = bonus*lavaLog(OptLacc[71]) | V/data/website-data/talents.json L5913; V/parsers/damage.ts#L745-L747 | 1 | 2026-10-19 | H |
| C23 | Tome Dungeon_Rank entry x1 30 x3 250; points formula | V/data/website-data/shared-data.json tomeData[17]; V/parsers/world-4/tome.ts#L242-L248, L306 | 1 | 2026-10-19 | H |
| C24 | Equinox challenges tied to dungeons | V/data/website-data/shared-data.json L7700-L7765 | 1 | 2026-10-19 | H |
| C25 | Dungeon achievements and rewards | V/data/website-data/achievements.json (Dungeon_Pinch, Dungeon_Slap, Dungeon_Wallop, TaskAchA58-A63, B50-B55, C45-C49) | 1 | 2026-10-19 | M |
| C26 | Fractal Island 1.25x credits and flurbos cost 200 | V/parsers/world-2/islands.ts#L48 | 1 | 2026-10-19 | H |
| C27 | growth(decay)=x1*L/(L+x2); add=x1*L when x2=0 | V/utility/wiki/growth.mjs#L12-L40 | 1 | 2026-10-19 | H |
| C28 | Flurbo shop: keychains T1 50, T2 500, T3 3000, T4 1,000,000 (no keychain awarded, pure sink); star talent chain; pendants/rings; "star talents first" is implied by the star-talent level gates, not an explicit wiki advice line | https://idleon.wiki/wiki/Dungeon_Flurbo_Shop | 3 | 2026-10-19 | M |
| C29 | Helping Heart value 3+0.2*(L-1); Horn crit dmg 600+15*(L-1) | https://idleon.wiki/wiki/Dungeon_Credits_Shop | 3 | 2026-10-19 | M |
| C30 | DUNGEON_ITEM/EVAPORATE and DungCredits excluded from greenstack | V/parsers/misc.ts#L451-L458 | 1 | 2026-10-19 | H |
| C31 | Guild tasks Play_Party_Dungeon(s) 10/30 GP | V/data/website-data/shared-data.json L12553, L12598 | 1 | 2026-10-19 | H |
| C32 | Quest "The_Desert_Dungeon_Prequest" exists | V/data/website-data/quests.json L3816 | 1 | 2026-10-19 | H |
| C33 | Dungeon_Cove is a Sailing island | V/data/website-data/shared-data.json L16195 | 1 | 2026-10-19 | H |
| C34 | Crystal Glunko Cove only strips "(Dungeon)" suffix | V/parsers/world-5/caverns/crystal-glunko-cove.ts#L95 | 1 | 2026-10-19 | H |
| C35 | Prioritise Rabbit Paw and drop-rate items early; balance offense/defence | https://idleon.wiki/wiki/Dungeons | 3 | 2026-10-19 | L |
| C36 | Dungeon weapons exist per class family (Spear [key DungWeaponSword]/Bow/Wand/Fisticuff [Punch], tiers A-F, I-V). **Disputed counts:** source lens counts Type SPEAR 33, BOW 30, WAND 30, FISTICUFF 30 (my recount of items.json Type agrees); gamedata lens counted Punch 30 and others 31 by key prefix. Correction: use the Type counts (33/30/30/30); tier labelling not fully checked | V/data/website-data/items.json (DungWeapon*) | 1 | 2026-10-19 | M |
| C37 | Tier 4 flurbo-shop keychain costs 1,000,000 Flurbos and awards no keychain (pure sink) | https://idleon.wiki/wiki/Dungeon_Flurbo_Shop | 3 | 2026-10-19 | M |
| C38 | Dungeon equipment item Types HELMET/SHIRT/PANTS/SHOES/PENDANT/RING (5 each), 8 DUNGEON_ITEM, 1 DUNGEON_EVAPORATE, 5 CURRENCY, 1 LOOT_DICE; DungEnhancer0/1/2 = Weapon/Armor/Jewelry Enhancer (reroll a random enhancement, replacing the old one) | V/data/website-data/items.json (Type counts for Dung*/GemP16; DungEnhancer0-2 desc) | 1 | 2026-10-19 | H |
| C39 | Dungeon_Loot_Dice (GemP16, LOOT_DICE): hold to roll anywhere; Rank 10 needed for Tier 2 keychains, Rank 20 for Tier 3 (so keychain tiers are rank-gated; per-tier stat values in C17) | V/data/website-data/items.json GemP16 | 1 | 2026-10-19 | H |
| C40 | Trait set effects include "Dungeon Credits/Flurbos drop +30% more often from mobs and bosses" (Da Cred) and loot-type bias traits (enhancers vs equipment 25%, weapons vs armor/jewelry 25%) | V/data/website-data/shared-data.json L7371-L7382 | 1 | 2026-10-19 | H |
| C41 | Save fields Dungeon_CredMulti, Dungeon_FlurboMulti, Dungeon_CardMulti, Dungeon1_time exist in the firebase type (Toolbox does not consume them; meaning not documented) | V/parsers/generated-firebase-types.ts#L835-L837 | 1 | 2026-10-19 | L |
| C42 | Stat label keys: BaseDungeonHP/MP/Damage, DungeonBossDmg, DungeonMPregen, DungeonDropRate, DungeonCardChance, DungeonMoney (the 23 Dungeons-category cards map to these; effects apply in-dungeon only) | V/data/website-data/shared-data.json L43998-L44010 | 1 | 2026-10-19 | M |
| C43 | Unlock text "Mobs can drop Dungeon Credits now" (misc.ts) and map entries Grandfrog's Backyard / Grandfrog's Gazebo (map ids 39/40) | V/parsers/misc.ts#L1617; V/data/website-data/shared-data.json L24512-L24513 | 1 | 2026-10-19 | H |
| C44 | Dungeon-variant resource items named "(Dungeon)" exist (e.g. Tree7D, rawName Tree7D); Crystal Glunko Cove only strips the suffix (C34) | V/data/website-data/items.json L28199 | 1 | 2026-10-19 | M |
| C45 | Other credit/flurbo multipliers: shared-data text "Boosts Dungeon Credit and Flurbo gain by }x" (L29466) and "+100% Dungeon Credits and Flurbos" (L34521); not located in Toolbox consumers beyond Fractal Island (C26) | V/data/website-data/shared-data.json L29466, L34521 | 1 | 2026-10-19 | L |
| C46 | Weekly boosted-run reset, 12 free runs, +3 per booster, Happy Hour bulk-use 3/20 (see C13/C14); boss difficulty tiers (4+) tie to Equinox clears (C24, e.g. 4th difficulty Vengeful Grandfrogger) | V/data/website-data/shared-data.json L7706 (Equinox label); https://idleon.wiki/wiki/Dungeons | 1/3 | 2026-10-19 | M |
