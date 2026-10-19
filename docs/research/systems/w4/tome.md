# Dossier: Tome (W4)

Verified 2026-10-19 against Toolbox @6c37e3d (pin 6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1), game version 2.3.540. Topic id `tome`. Tiers: 1 = game data / Toolbox parsers, 2 = Toolbox logic / dashboard, 3 = idleon.wiki, 4 = public community guides. "Computed" = derived here by arithmetic from the cited formula. Paths: `TB` = `packages/toolbox-parsers/vendor`; `tome.ts` = `TB/parsers/world-4/tome.ts`; `SD` = `TB/data/website-data/shared-data.json`. Prior research (`research/w4-systems`, checked against Toolbox @6827d3f) agrees with this pin on every number I re-derived; its 124-row table was reproduced exactly. **Search budget note:** the web-search quota was exhausted and Reddit/Google Sheets were not fetchable, so tier 4 input is absent; see Open questions.

## Tome

- **What it is:** A W4 scoreboard of **124 account metrics**. Each metric turns a raw quantity into points (PTS) on its own curve; the PTS sum is the Tome score. The score pays permanent DMG, (with pages) Skill Efficiency and Drop Rate, (with Event Shop items) two multipliers, scaling for six Tome bubbles, the W7 "Tome Epilogue" lore bonuses, and a monthly nametag by global percentile rank. [C1][C3][C8][C9][C10][C11][C12][C21]
- **Unlocks:** The Tome stands in Outer World Town (W4 town). Each metric only counts once **account level** (sum of every character's class level) reaches a gate: `350 + 40·i + 5·max(0,i−35) + 10·max(0,i−60) + 10·max(0,i−80) + 15·max(0,i−100)` for display position i (0-based). Metric 1 shows at 350, metric 124 at 7115. [C2][C7][C27] The parser has **no "visited Tome in W4" gate**; it credits PTS to any save, so the DMG bonus likely applies to a pre-W4 account (code reading, confidence M; tier 1). [C31] **Gate:** the nametag claim is additionally gated by `serverVars.TomeOn === 1` (`nametagClaim.tomeUnlocked`, tome.ts#L144, tier 1, H). Confidence: gate formula H (tier 1, recomputed gate(0)=350, gate(123)=7115); wiki cross-check of the 'account level' wording M (tier 3).
- **Scope:** Account-wide, with one quirk: "Statue Total LV" sums the **logged-in character's** statue levels, so the score varies by which character is active; the Tome bubble values also use the logged-in character's class cauldron multiplier. [C19][C12]
- **Inputs → outputs:** Inputs are 124 quantities pulled from nearly every other system (catalogue below). Outputs: DMG, Skill Efficiency, Drop Rate, DMG Multi, Drop Multi, STR/AGI/WIS bubble stacks, Crop/Stealth/Essence chapter bubbles, W7 Tome Epilogue, nametags. [C8]-[C13][C21]
- **Goals and Milestones:** Bar colours per metric: bronze below 40% of the curve, silver ≥40%, gold ≥75%, blue ≥99.9%. Score milestones: 4,000 PTS (Blue pages start paying), 5,000 (first Tome-bubble stack needs 7,000), 8,000 (Red pages start paying), 7,000 / 9,000 / ... (one more bubble stack per 2,000). Max possible score is **65,900** PTS (computed from every metric's curve cap); the sum of max PTS of metrics visible by account LV 700 / 1,500 / 3,000 / 5,000 / 7,115 is 12,005 / 21,289 / 36,920 / 49,754 / 65,900. [C5][C6][C29]
- **Feeds / fed by:** Fed by almost every system (stamps, statues, cards, talents, quests, tasks, achievements, bubbles, vials, sigils, arcade, vault, W2-W7 minigames). Feeds damage, efficiency, drop rate, bubbles, spelunking lore, the button task 29, Menagerie. [C23][C22][C21]
- **Per-session actions:** (1) Once per account: buy 2 Blue Tome Pages in the W4 town shop and drop them on the Tome; later 7 Red pages from the Magma Rivertown shop. (2) Monthly: claim available nametags. (3) Spend effort on the cheapest next-PTS metric (Goals list). The Tome has no idle or capped state. [C9][C10][C16]
- **AFK Setup implications:** None directly; it rewards breadth (levels on every character, many skills, many systems touched).
- **Min-max by stage:** see the dedicated section.
- **Common mistakes:** Never buying the pages (detect `accountOptions[196] !== 1` / `[197] !== 1`); not claiming nametags; reading "lower is better" metrics backwards; forgetting vault upgrade Teh TOM and the Troll armor set / Grey Tome Book multipliers; assuming the score is character-independent (statues). [C9][C10][C14][C19][C26]
- **Save and Toolbox fields:** see the Mechanics catalogue.
- **Sources:** per claim, listed at the end.

## Mechanics catalogue

**Confidence key:** every `[Cn]` claim below was checked by two lenses (source, game data). No claim was refuted by both lenses, none by a single one outright. Unless a line says otherwise: formulas, tables and consumer paths are H (tier 1, recomputed); wiki-only and history items are M; community-opinion items are L. M3 curve forms and the metric table are H (formulas match tome.ts, caps recomputed to 65,900). M7/M8 shop details (item names exist in items.json; quest and shop location unverified) are M. M9 Event Shop details H for formulas, M for names. M11 H. M15 H. M16 H for formula, M for the bonus list text. M17 M.

**M1. Metric table (`tomeData`).** 124 entries `{name, info, x1, x2, x3, x4}`; x1 = pivot, x2 = curve id, x3 = PTS scale. Display order is `ninjaExtraInfo[32]` (the `index` entry is the display position). Path: `account.tome.tome[]` `{name, index, tomeLvReq, quantity, points, maxPoints, color, requiredQuantities{silver,gold,blue}}`. [C1]

**M2. Account-level gate.** Formula in Unlocks. A metric below its gate still shows quantity/points per row but adds **0** to `totalPoints`. Path: `account.accountLevel` (parsers/index.ts#L304). [C2][C3][C7]

**M3. Curves (x2).** q = quantity: 0 saturating `(1.7q/(q+x1))^0.7` (cap ≈1.45); 1 log `2.4·log10 q /(2·log10 q + x1)` (→1.2); 2 linear `min(1, q/x1)`; 3 lower-is-better `(1.2(6x1−q)/(7x1−q))^5`, 0 if q > 5·x1 (peak ≈1.151 at q=0); 4 `(2m/(m+x1))^0.7`, m=min(q,x1) (cap 1). PTS = `ceil(curve · x3)`. Max PTS per metric = `ceil(cap · x3)`. [C3][C4][C5]

**M4. Bar colour / required quantities.** Thresholds silver 0.4, gold 0.75, blue 0.999 of the curve; `requiredQuantities` solved by bisection on the same curve (for curve 3 it is the maximum you may have). [C6]

**M5. Quantity sources (TomeQTY).** `calcTomeQuantity` pushes 124 values, one per tomeData index. Full mapping in the metric table. Notable: lower-is-better time metrics are stored as `1e3 − option` (options 207, 218, 220) and Crystal Spawn kills as `1/option[202]`. [C25][C26]

**M6. Purple Tome Pages (DMG).** `+10·⌊PTS/100⌋^0.7 %` DMG, always on (`account.tome.bonuses[0]`), multiplied by `extraBonus`. Consumed in `damage.ts#L358`. [C8][C23]

**M7. Blue Tome Pages (Skill Efficiency).** `+4·⌊max(0,PTS−4000)/100⌋^0.7 %` times `extraBonus`, only if `accountOptions[196]===1`. Item `Blue_Tome_Pages` (Quest83) sold in the W4 Outer World Town shop; "drop a stack of 2 on the Tome". `bonuses[1]`, consumed in `efficiency.ts#L154`. [C9]

**M8. Red Tome Pages (Drop Rate).** `+2·⌊max(0,PTS−8000)/100⌋^0.7 %` times `extraBonus`, only if `accountOptions[197]===1`. Item `Red_Tome_Pages` (Quest84), stack of 7, Magma Rivertown (W5) shop. `bonuses[2]`, consumed in `character.ts#L2424`. [C10] (W5 item, noted only.)

**M9. Golden / Singed Tome (Event Shop).** DMG_Multi `4·⌊PTS/1000⌋^0.4 %` if Event Shop bonus 0 owned (Golden Tome); Drop_Multi `3·⌊PTS/1000⌋^0.3 %` if Event Shop bonus 27 owned (Singed Tome); both × `extraBonus`. Event Shop ownership: `accountOptions[311]` string contains `number2letter[id]`. `bonuses[6]`/`[7]`; DMG_Multi enters damage as `(1+(bonus+achievePost)/100)` multiplier (`damage.ts#L489-505`), Drop_Multi as `(1+tomeMulti/100)` (`character.ts#L2575`). [C11]

**M10. Tome bubbles (28th-30th of each cauldron).** `TOME_STRENGTH` (power #27, W8 stat STR), `TOME_AGILITY` (quicc #28, A9), `TOME_WISDOM` (high-iq #28, M9): bubble value × `⌊max(0,(PTS−5000)/2000)⌋` × `extraBonus`; stacks begin at 7,000. Chapter bubbles `CROP_CHAPTER` (power #29, crop evolution chance), `STEALTH_CHAPTER` (quicc #29), `ESSENCE_CHAPTER` (high-iq #29) use the same step rule (consumers: `world-6/farming.ts#L1229`, `sneaking.ts#L529`, `summoning.ts#L578`, tier 1, H). **Correction:** `getTomeBubbleMulti(PTS) = floor(max(0,(PTS-5000)/2000))` (tome.ts#L211, exported) is multiplied by the bubble value but, for the three chapter bubbles, **not** by `extraBonus` in those consumers; only the STR/AGI/WIS tome bubbles (tome.ts#L224) also multiply by `extraBonus` (tier 1, H). Class cauldron multiplier applied if the logged-in character's main stat matches. Path `account.tome.bonuses[3..5]`. [C12][C13]

**M11. Tome bonus multiplier (`extraBonus`).** `1 + (Grimoire upgrade 17 + Troll armor set)/100`. Grimoire 17 "Grey Tome Book": `level × 1` (not scaled by upgrade 36); cost x1=2000, x2=1.25 (bone type 1), unlock level 500. Troll set (hat 74, shirt 34, pants 8, shoes 34): +25 when unlocked or equipped. [C14]

**M12. Percentile rank and nametags.** `serverVars.TomePct` array: indices 0-6 are Top 50 / 25 / 10 / 5 / 1 / 0.5 / 0.1 percent; indices 7-11 are the extra ranks 60-95% (wiki v2.27). `top` = highest of 0-6 whose threshold < score (strict `>`), else the first of 7-11 with score >= threshold (tome.ts#L77-90, tier 1, H). **Tiers 7-11 give no nametag**: `rewardTier` is only set for top 0-6 (tome.ts#L149), so they are a rank label only. `tops` is re-sorted descending for output. One nametag per tier reached (`EquipmentNametag22..28`, Tome Apprentice ... Legend); `available = max(0, top+1 − claimedThisMonth)`; month = `⌊GlobalTime/2,628,000⌋`, compared to `accountOptions[448]`; claimed count `accountOptions[447]`. Percentiles refresh daily (v1.02). Path `account.tome.nametagClaim`, `.top`, `.tops`. [C15][C16][C17]

**M13. Top 0.1% wish.** Glimmerwick Candle (Quest114) wish grants the Top 0.1% Tome nametag; chance by tier: none 1/120, tier 0..6 → 1/90, 1/80, 1/70, 1/60, 1/50, 1/40, 1/30; pity counter `accountOptions[490]` hard-guarantees at the reciprocal. Menagerie jelly 6 turns in 12 Top 0.1% nametags (`nametagsRequired: 12`, deposited count `Spelunk[17][28]`) for a Top 0.01% Tome nametag (menagerie.ts#L452, tier 1, H). Wish odds computed from `getTomeWishChance` (tier 1, H). [C18]

**M14. Teh TOM (Upgrade Vault #57).** `level × 2` bonus, max level 500 (+ bundle/Glimbo extensions), unlock at 3,000 total vault levels. Feeds metric "Vault Upgrade bonus LV" (tomeData idx 81, x1 1200, linear): quantity `min(1500, vault bonus 57)`. Patch history (tier 3 wiki changelogs, fetched 2026-10-19, M): v1.05 capped the metric at +1200 PTS (the intended cap, = metric x3). v1.07 'Fixed Teh Tom Upgrade Vault bonus being incorrectly capped at 500 tome score': the bug was a wrongly applied **500** cap, not the 1200 cap, which remains. Code (tier 1, H): `x5=2`, `maxLevel 500`, `unlockLevel 3000`, quantity `min(1500, bonus)`, metric x1=x3=1200. [C20]

**M15. Statue quirk.** Quantity = sum of `StatueLevels_<playerId>[i][0]` of the best active character (fallback to account statue totals). [C19]

**M16. W7 Tome Epilogue (Coral Reef).** Coral Reef milestone 3 (`coralReef[2]`, threshold `rawLoreThreshold`) unlocks lore bonuses `generalSpelunky[21]` = `base|threshold` pairs; value `= extraBonus · base · p/(25+p)`, `p = ⌊max(0,PTS−threshold)/100⌋^0.7`. Eleven bonuses (bones, villager XP, dust, artifact find, amber, palette luck, tachyon, research XP, equinox, W7 skill) with bases 420/150/750/100/400/200/600/20/220/100/500 and thresholds 7000/1000/6000/3000/15000/12000/5000/16000/5000/17000/5000. [C21]

**M17. Other consumers.** Button task 29 "Have a Tome Score of at least {" (threshold 5000, exponent 1.011); Cavern/hole bonuses read tome quantities of Account LV and skills and the score; Menagerie reads `tome.totalPoints`. [C22]

**M18. Metric history.** Metric list changes nearly every patch (tier 3 wiki 2025/2026 changelogs, fetched 2026-10-19, M): v1.00 +11 metrics and 7 nametags, v1.10 arcade metric, v1.20 +3, v1.22 Jelly Operations metric (800 PTS), v2.35 +13, v2.41 +1; sigil metric 72→120 in v1.05. The earlier 'v1.04 +2' entry is **unverifiable** (2026 changelog has no v1.04 section; confidence L, dropped as a claim). Always re-pull `tomeData`. [C24][C34]

**M19. Lore Epilogue gate.** Each W7 lore bonus index i only pays when `spelunking.rawLoreThreshold > i` (spelunking.ts#L546, tier 1, H). Value recomputed from the live tome score, not cached lore (spelunking.ts#L538). [C21]

**M20. Recent metrics 115-123.** Glimbo trades, sushi, button presses (`accountOptions[594]`), Royal Statue LV, outposts built, resource grade, Jelly Operations (idx 121, 800 PTS), Menagerie rank and boost levels read newer account fields (`minehead`, `sushiStation`, `royalGuardian`, `jellyOperator`, `menagerieSave`); an older save lacking those fields yields 0 PTS for them (tier 1, M).

**W5+ extensions (one line each):** Red pages (W5 shop); Event Shop Golden/Singed Tome; Metrics 61-72 and 78+ read W5-W7 systems (sailing, gaming, divinity, farming, sneaking, summoning, Hole, Spelunking, Research, Sushi, Button, Royal Guardian, Jelly, Menagerie); Tome Epilogue (W7); Menagerie reads tome.totalPoints in its research summary (menagerie.ts#L301).

### Metric table (all 124, pinned data)

Columns: display position, tomeData index, metric, account-LV gate, pivot x1, curve, x3, max PTS, quantity for silver (40%) / gold (75%) / blue (99.9%), quantity source (`account.*` path in `calcTomeQuantity`). For "lower is better" rows the quantity is the *most* allowed. [C1][C2][C3][C25]

| # | idx | Metric | LV gate | Pivot | Curve | x3 | Max PTS | Silver | Gold | Blue | Quantity source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 5 | Account LV | 350 | 7,000 | saturating | 1500 | 2175 | 1,323 | 4,476 | 9,966 | `accountLevel` |
| 2 | 11 | Account Skills LV | 390 | 18,000 | saturating | 1200 | 1740 | 3,401 | 11,509 | 25,626 | `sum of totalSkillsLevels[skill].level excluding 'character'` |
| 3 | 3 | Total Talent Max LV  (Tap for more info) | 430 | 12,000 | saturating | 600 | 870 | 2,267 | 7,673 | 17,084 | `calcTalentMaxLevel(characters` |
| 4 | 65 | Items Found | 470 | 1,800 | linear (capped) | 1300 | 1300 | 720 | 1,350 | 1,799 | `looty?.lootyRaw?.length` |
| 5 | 22 | Total Bubble LV | 510 | 1,000,000 | saturating (capped) | 1750 | 1750 | 156,132 | 495,891 | 997,148 | `calcBubbleLevels(alchemy?.bubbles` |
| 6 | 0 | Stamp Total LV | 550 | 10,000 | saturating | 1000 | 1450 | 1,889 | 6,394 | 14,237 | `calcStampLevels(stamps` |
| 7 | 2 | Cards Total LV | 590 | 1,344 | linear (capped) | 1000 | 1000 | 538 | 1,008 | 1,343 | `calcCardsLevels(cards` |
| 8 | 1 | Statue Total LV | 630 | 2,300 | saturating | 600 | 870 | 435 | 1,471 | 3,275 | `calcActiveCharacterStatueLevels(characters, idleonData, account` |
| 9 | 7 | Total Achievements Completed | 670 | 266 | linear (capped) | 850 | 850 | 107 | 200 | 266 | `calcTotalAchievements(achievements` |
| 10 | 4 | Unique Quests Completed | 710 | 323 | linear (capped) | 500 | 500 | 130 | 243 | 323 | `calcTotalQuestCompleted(characters` |
| 11 | 6 | Total Tasks Completed | 750 | 470 | linear (capped) | 470 | 470 | 188 | 353 | 470 | `calcTotalTasks(tasks` |
| 12 | 81 | Vault Upgrade bonus LV | 790 | 1,200 | linear (capped) | 1200 | 1200 | 480 | 900 | 1,199 | `Math.min(1500, getUpgradeVaultBonus(upgradeVault?.upgrades, 57` |
| 13 | 8 | Most Money held in Storage | 830 | 25 | log | 500 | 600 | 1,778,280 | 6.81e+20 | unreachable | `accountOptions[198]` |
| 14 | 9 | Most Spore Caps held in Inventory at once | 870 | 9 | log | 200 | 240 | 178 | 3.16e+07 | 2.32e+22 | `accountOptions[208]` |
| 15 | 53 | Total Colosseum Score | 910 | 10 | log | 200 | 240 | 317 | 2.15e+08 | 7.09e+24 | `calcColoTotalScore(highscores?.coloHighscores` |
| 16 | 10 | Trophies Found | 950 | 22 | linear (capped) | 700 | 700 | 9 | 17 | 22 | `calcTrophiesFound(looty` |
| 17 | 107 | Nametags Found | 990 | 20 | linear (capped) | 700 | 700 | 8 | 15 | 20 | `calcNametagsFound(looty` |
| 18 | 109 | Premium Hats Found | 1030 | 75 | linear (capped) | 700 | 700 | 30 | 57 | 75 | `hatRack?.totalHats` |
| 19 | 12 | Best Spiketrap Surprise round | 1070 | 13 | linear (capped) | 100 | 100 | 6 | 10 | 13 | `accountOptions[201]` |
| 20 | 113 | Tournaments Registrations | 1110 | 365 | linear (capped) | 365 | 365 | 146 | 274 | 365 | `accountOptions[498]` |
| 21 | 106 | Lava Dev Streams watched | 1150 | 20 | linear (capped) | 250 | 250 | 8 | 15 | 20 | `accountOptions[443]` |
| 22 | 75 | Total Minigame Highscore | 1190 | 450 | linear (capped) | 100 | 100 | 180 | 338 | 450 | `calcMinigameTotalScore(highscores?.minigameHighscores` |
| 23 | 13 | Total AFK Hours claimed | 1230 | 2,000,000 | saturating | 350 | 508 | 377,778 | 1,278,701 | 2,847,253 | `tasks?.[0]?.[0]?.[2]` |
| 24 | 14 | DPS Record on Shimmer Island | 1270 | 20 | log | 350 | 420 | 100,000 | 4.64e+16 | 5.03e+49 | `accountOptions[172]` |
| 25 | 80 | Total Arcade Gold Ball Shop Upgrade LV | 1310 | 6,800 | linear (capped) | 1200 | 1200 | 2,720 | 5,100 | 6,794 | `arcade?.totalUpgradeLevels` |
| 26 | 79 | Most Balls earned from LBoFaF | 1350 | 1,000 | saturating | 150 | 218 | 189 | 640 | 1,424 | `accountOptions[222]` |
| 27 | 25 | Jackpots Hit in Arcade | 1390 | 4 | linear (capped) | 80 | 80 | 2 | 3 | 4 | `accountOptions[199]` |
| 28 | 15 | Star Talent Points Owned | 1430 | 2,500 | saturating | 200 | 290 | 473 | 1,599 | 3,560 | `calcTotalStarTalent(characters, account` |
| 29 | 16 | Average kills for a Crystal Spawn | 1470 | 30 | lower is better | 350 | 403 | 112 | 69 | 30 | `1 / accountOptions[202]` |
| 30 | 17 | Dungeon Rank | 1510 | 30 | saturating | 250 | 363 | 6 | 20 | 43 | `dungeons?.rank` |
| 31 | 18 | Highest Drop Rate Multi | 1550 | 40 | saturating | 350 | 508 | 8 | 26 | 57 | `accountOptions[200]` |
| 32 | 19 | Constellations Completed | 1590 | 49 | linear (capped) | 300 | 300 | 20 | 37 | 49 | `rawConstellationsDone` |
| 33 | 21 | Unique Obols Found | 1630 | 107 | linear (capped) | 250 | 250 | 43 | 81 | 107 | `calcObolsFound(looty` |
| 34 | 23 | Total Vial LV | 1670 | 962 | linear (capped) | 600 | 600 | 385 | 722 | 962 | `calcVialsLevels(alchemy?.vials` |
| 35 | 24 | Total Sigil LV | 1710 | 120 | linear (capped) | 500 | 500 | 48 | 90 | 120 | `calcSigilsLevels(alchemy?.p2w?.sigils` |
| 36 | 26 | Post Office PO Boxes Earned | 1750 | 20,000 | saturating | 300 | 435 | 3,778 | 12,788 | 28,473 | `currencies.DeliveryBoxComplete+DeliveryBoxStreak+DeliveryBoxMisc (each rounded)` |
| 37 | 27 | Highest Killroy Score on a Warrior | 1795 | 3,000 | saturating | 200 | 290 | 567 | 1,919 | 4,271 | `accountOptions[204]` |
| 38 | 28 | Highest Killroy Score on an Archer | 1840 | 3,000 | saturating | 200 | 290 | 567 | 1,919 | 4,271 | `accountOptions[205]` |
| 39 | 29 | Highest Killroy Score on a Mage | 1885 | 3,000 | saturating | 200 | 290 | 567 | 1,919 | 4,271 | `accountOptions[206]` |
| 40 | 85 | Megafeathers Earned from Orion | 1930 | 12 | saturating | 250 | 363 | 3 | 8 | 18 | `accountOptions[262]` |
| 41 | 86 | Megafish Earned from Poppy | 1975 | 12 | saturating | 250 | 363 | 3 | 8 | 18 | `accountOptions[279]` |
| 42 | 108 | Megaflesh Earned from Bubba | 2020 | 12 | saturating | 250 | 363 | 3 | 8 | 18 | `bubba?.megafleshOwned` |
| 43 | 30 | Fastest Time to kill Chaotic Efaunt (in Seconds) | 2065 | 10 | lower is better | 200 | 231 | 37 | 23 | 10 | `1e3 - accountOptions[207]` |
| 44 | 31 | Largest Oak Log Printer Sample | 2110 | 9 | log | 400 | 480 | 178 | 3.16e+07 | 2.32e+22 | `accountOptions[211]` |
| 45 | 32 | Largest Copper Ore Printer Sample | 2155 | 9 | log | 400 | 480 | 178 | 3.16e+07 | 2.32e+22 | `accountOptions[212]` |
| 46 | 33 | Largest Spore Cap Printer Sample | 2200 | 9 | log | 300 | 360 | 178 | 3.16e+07 | 2.32e+22 | `accountOptions[213]` |
| 47 | 34 | Largest Goldfish Printer Sample | 2245 | 9 | log | 300 | 360 | 178 | 3.16e+07 | 2.32e+22 | `accountOptions[214]` |
| 48 | 35 | Largest Fly Printer Sample | 2290 | 9 | log | 300 | 360 | 178 | 3.16e+07 | 2.32e+22 | `accountOptions[215]` |
| 49 | 37 | Total Best Wave in Worship | 2335 | 1,000 | saturating | 300 | 435 | 189 | 640 | 1,424 | `towers?.totalWaves` |
| 50 | 36 | Best Non Duplicate Goblin Gorefest Wave | 2380 | 120 | saturating | 200 | 290 | 23 | 77 | 171 | `accountOptions[209]` |
| 51 | 76 | Total Prayer Upgrade LV | 2425 | 673 | linear (capped) | 200 | 200 | 270 | 505 | 673 | `calcTotalPrayersLevel(prayers` |
| 52 | 38 | Total Digits of all Deathnote Kills | 2470 | 700 | saturating | 600 | 870 | 133 | 448 | 997 | `calcTotalKillsDigits(deathNote` |
| 53 | 54 | Most Giants Killed in a Single Week | 2515 | 25 | saturating | 250 | 363 | 5 | 16 | 36 | `accountOptions[217]` |
| 54 | 40 | Total Refinery Rank | 2560 | 120 | saturating | 450 | 653 | 23 | 77 | 171 | `refinery?.totalLevels` |
| 55 | 41 | Total Atom Upgrade LV | 2605 | 150 | saturating | 400 | 580 | 29 | 96 | 214 | `calcTotalAtomLevels(atoms?.atoms` |
| 56 | 42 | Total Construct Buildings LV | 2650 | 4,000 | saturating | 900 | 1305 | 756 | 2,558 | 5,695 | `towers?.totalLevels` |
| 57 | 39 | Equinox Clouds Completed | 2695 | 31 | linear (capped) | 750 | 750 | 13 | 24 | 31 | `equinox?.completedClouds` |
| 58 | 44 | Most Greenstacks in Storage | 2740 | 150 | saturating | 600 | 870 | 29 | 96 | 214 | `accountOptions[224]` |
| 59 | 50 | Total Cooking Meals LV | 2785 | 5,400 | saturating | 750 | 1088 | 1,021 | 3,453 | 7,688 | `calcTotalMeals(cooking?.meals` |
| 60 | 48 | Total Kitchen Upgrade LV | 2830 | 8,000 | saturating | 200 | 290 | 1,512 | 5,115 | 11,390 | `getTotalKitchenLevels(cooking?.kitchens` |
| 61 | 46 | Highest Power Mob | 2875 | 5 | log | 150 | 180 | 18 | 14,678 | 2.66e+12 | `calcHighestPower(breeding` |
| 62 | 47 | Fastest Time reaching Round 100 Arena (in Seconds) | 2930 | 50 | lower is better | 180 | 208 | 186 | 115 | 50 | `1e3 - accountOptions[220]` |
| 63 | 49 | Total Shiny Mob LV | 2985 | 750 | saturating | 250 | 363 | 142 | 480 | 1,068 | `breeding?.totalShinyLevels` |
| 64 | 51 | Total Mob Breedability LV | 3040 | 500 | linear (capped) | 200 | 200 | 200 | 375 | 500 | `breeding?.totalBreedabilityLv` |
| 65 | 52 | Total Lab Chips Owned | 3095 | 100 | saturating | 150 | 218 | 19 | 64 | 143 | `lab?.totalRawChips` |
| 66 | 45 | Rift Levels Completed | 3150 | 49 | linear (capped) | 500 | 500 | 20 | 37 | 49 | `rift?.currentRift` |
| 67 | 55 | Total Onyx Statues | 3205 | 28 | linear (capped) | 450 | 450 | 12 | 21 | 28 | `calcTotalOnyx(account` |
| 68 | 60 | Total Artifacts Found | 3260 | 185 | linear (capped) | 1000 | 1000 | 74 | 139 | 185 | `calcArtifactsAcquired(sailing?.artifacts` |
| 69 | 57 | Total Boat Upgrade LV | 3315 | 10,000 | saturating | 200 | 290 | 1,889 | 6,394 | 14,237 | `calcTotalBoatLevels(sailing?.boats` |
| 70 | 61 | Gold Bar Sailing Treasure Owned | 3370 | 14 | log | 200 | 240 | 3,163 | 4.64e+11 | 6.18e+34 | `sailing?.lootPile?.[0]?.amount` |
| 71 | 62 | Highest Captain LV | 3425 | 25 | saturating | 150 | 218 | 5 | 16 | 36 | `Math.max(0, ...(sailing?.captains?.map(({ level }: any) => level) || []` |
| 72 | 66 | Most Gaming Bits Owned | 3480 | 80 | log | 400 | 480 | 1e+20 | unreachable | unreachable | `gaming?.bits` |
| 73 | 59 | Total Gaming Plants Evolved | 3535 | 100,000 | saturating | 200 | 290 | 18,889 | 63,936 | 142,363 | `gaming?.totalPlantsPicked` |
| 74 | 64 | Best Gold Nugget | 3590 | 9 | log | 200 | 240 | 178 | 3.16e+07 | 2.32e+22 | `gaming?.bestNugget` |
| 75 | 63 | Highest Immortal Snail LV | 3645 | 50 | linear (capped) | 300 | 300 | 20 | 38 | 50 | `Math.max(gaming?.snailLevel, accountOptions[210]` |
| 76 | 111 | Rat King Crowns Reclaimed | 3700 | 100 | linear (capped) | 400 | 400 | 40 | 75 | 100 | `gaming?.ratKingCrownsClaimed` |
| 77 | 58 | God Rank in Divinity | 3755 | 10 | saturating | 200 | 290 | 2 | 7 | 15 | `divinity?.godRank` |
| 78 | 56 | Fastest Time to Kill 200 Tremor Wurms (in Seconds) | 3810 | 30 | lower is better | 150 | 173 | 112 | 69 | 30 | `1e3 - accountOptions[218]` |
| 79 | 93 | Total Opals Found | 3865 | 500 | saturating | 400 | 580 | 95 | 320 | 712 | `hole?.totalOpalsFound` |
| 80 | 84 | Total LV of Cavern Villagers | 3920 | 200 | saturating | 350 | 508 | 38 | 128 | 285 | `hole?.totalVillagersLevels` |
| 81 | 83 | Total Digits of all Cavern Resources | 3975 | 500 | saturating | 750 | 1088 | 95 | 320 | 712 | `hole?.totalResources` |
| 82 | 92 | Total Resource Layers Destroyed | 4040 | 150 | saturating | 350 | 508 | 29 | 96 | 214 | `hole?.totalLayerResources` |
| 83 | 91 | Best Dawg Den score | 4105 | 7 | log | 250 | 300 | 57 | 681,293 | 2.49e+17 | `hole?.holesObject?.extraCalculations?.[8]` |
| 84 | 87 | Best Bravery Monument Round | 4170 | 50 | saturating | 250 | 363 | 10 | 32 | 72 | `hole?.holesObject?.extraCalculations?.[73]` |
| 85 | 88 | Best Justice Monument Round | 4235 | 200 | saturating | 250 | 363 | 38 | 128 | 285 | `hole?.holesObject?.extraCalculations?.[74]` |
| 86 | 89 | Best Wisdom Monument Round | 4300 | 18 | linear (capped) | 250 | 250 | 8 | 14 | 18 | `hole?.holesObject?.extraCalculations?.[75]` |
| 87 | 82 | Total Gambit Time (in Seconds) | 4365 | 3,600 | saturating | 400 | 580 | 681 | 2,302 | 5,126 | `hole?.caverns?.gambit?.totalTime` |
| 88 | 94 | Best Pure Memory Round Reached | 4430 | 13 | linear (capped) | 50 | 50 | 6 | 10 | 13 | `Math.round(Math.min(12, accountOptions[353]) + 1` |
| 89 | 68 | Total Crops Discovered | 4495 | 120 | linear (capped) | 350 | 350 | 48 | 90 | 120 | `farming?.cropsFound` |
| 90 | 69 | Total Golden Food Beanstacks | 4560 | 30 | linear (capped) | 400 | 400 | 12 | 23 | 30 | `calcTotalBeanstalkLevel(sneaking?.beanstalkData` |
| 91 | 67 | Highest Crop OG | 4625 | 6 | log | 200 | 240 | 32 | 100,000 | 8.14e+14 | `Math.pow(2, accountOptions[219]` |
| 92 | 77 | Total Land Rank | 4690 | 5,000 | saturating | 200 | 290 | 945 | 3,197 | 7,119 | `farming?.totalRanks` |
| 93 | 78 | Largest Magic Bean Trade | 4755 | 1,000 | saturating | 200 | 290 | 189 | 640 | 1,424 | `parseFloat(accountOptions[221]` |
| 94 | 112 | Farming Stickers Found | 4820 | 150 | saturating | 300 | 435 | 29 | 96 | 214 | `farming?.totalStickers` |
| 95 | 72 | Ninja Floors Unlocked | 4885 | 12 | linear (capped) | 250 | 250 | 5 | 9 | 12 | `sneaking?.unlockedFloors` |
| 96 | 74 | Jade Emporium Upgrades Purchased | 4950 | 50 | linear (capped) | 700 | 700 | 20 | 38 | 50 | `sneaking?.totalJadeEmporiumUnlocked` |
| 97 | 99 | Total Ninja Knowledge Upgrades LV | 5015 | 5,000 | saturating | 500 | 725 | 945 | 3,197 | 7,119 | `sneaking?.totalNinjaUpgradeLevels` |
| 98 | 71 | Total Career Summoning Wins | 5080 | 160 | saturating | 500 | 725 | 31 | 103 | 228 | `summoning?.totalWins` |
| 99 | 70 | Total Summoning Upgrades LV | 5145 | 10,000 | saturating | 200 | 290 | 1,889 | 6,394 | 14,237 | `summoning?.totalUpgradesLevels` |
| 100 | 73 | Familiars Owned in Summoning | 5210 | 600 | saturating | 150 | 218 | 114 | 384 | 855 | `summoning?.familiarsOwned` |
| 101 | 96 | Total Summoning Boss Stone victories | 5275 | 28 | saturating | 300 | 435 | 6 | 18 | 40 | `summoning?.totalSummoningStonesKills` |
| 102 | 20 | Most DMG Dealt to Gravestone in a Weekly Battle | 5355 | 300,000 | saturating | 200 | 290 | 56,667 | 191,806 | 427,088 | `accountOptions[203]` |
| 103 | 43 | Most Tottoise in Storage | 5435 | 5 | log | 150 | 180 | 18 | 14,678 | 2.66e+12 | `calcTotalItemInStorage(storage?.list, 'Critter11A'` |
| 104 | 90 | Best Deathbringer Max Damage in Wraith Mode | 5515 | 10 | log | 400 | 480 | 317 | 2.15e+08 | 7.09e+24 | `accountOptions[356]` |
| 105 | 100 | Best Windwalker Max Damage in Tempest Mode | 5595 | 10 | log | 400 | 480 | 317 | 2.15e+08 | 7.09e+24 | `accountOptions[445]` |
| 106 | 101 | Best Arcane Cultist Max Damage in Arcanist Mode | 5675 | 10 | log | 400 | 480 | 317 | 2.15e+08 | 7.09e+24 | `accountOptions[446]` |
| 107 | 118 | Total Royal Statue LV | 5755 | 100 | saturating | 600 | 870 | 19 | 64 | 143 | `sum max(0, royalGuardian.royalStatues[].level)` |
| 108 | 119 | Royal Guardian Outposts Built | 5835 | 65 | linear (capped) | 650 | 650 | 26 | 49 | 65 | `royalGuardian?.outpostStats?.built` |
| 109 | 120 | Total Resource Grade | 5915 | 1,000 | saturating | 600 | 870 | 189 | 640 | 1,424 | `royalGuardian?.outpostStats?.totalNodeLevels` |
| 110 | 95 | Spirited Valley Emperor Boss Kills | 5995 | 100 | linear (capped) | 400 | 400 | 40 | 75 | 100 | `Math.round(accountOptions[369]` |
| 111 | 97 | Total Coral Reef upgrades | 6075 | 37 | linear (capped) | 400 | 400 | 15 | 28 | 37 | `spelunking?.coralReefLevels?.reduce((sum: number, level: number) => sum + level, 0` |
| 112 | 103 | Total Spelunk Shop Upgrades LV | 6155 | 2,000 | saturating | 500 | 725 | 378 | 1,279 | 2,848 | `spelunking?.totalUpgradeLevels` |
| 113 | 104 | Total Spelunk Discoveries made | 6235 | 90 | linear (capped) | 300 | 300 | 36 | 68 | 90 | `spelunking?.discoveriesCount` |
| 114 | 98 | Deepest Depth reached in a single Delve | 6315 | 100 | saturating | 300 | 435 | 19 | 64 | 143 | `Math.max(0, ...(spelunking?.bestCaveLevels || []` |
| 115 | 102 | Biggest Haul in a single Delve | 6395 | 25 | log | 300 | 360 | 1,778,280 | 6.81e+20 | unreachable | `Math.max(0, ...(spelunking?.biggestHauls || []` |
| 116 | 105 | Highest leveled Spelunker | 6475 | 200 | saturating | 200 | 290 | 38 | 128 | 285 | `spelunking?.highestSpelunkingLevelCharacter` |
| 117 | 110 | Minehead Opponents Defeated | 6555 | 40 | linear (capped) | 600 | 600 | 16 | 30 | 40 | `minehead?.opponentsBeat` |
| 118 | 114 | Total Research Grid Upgrades | 6635 | 109 | linear (capped) | 750 | 750 | 44 | 82 | 109 | `research?.gridPTSpent` |
| 119 | 115 | Total Glimbo Trades | 6715 | 1,500 | saturating | 400 | 580 | 284 | 960 | 2,136 | `minehead?.glimboTotalTrades` |
| 120 | 116 | Unique Sushi Created | 6795 | 64 | linear (capped) | 800 | 800 | 26 | 48 | 64 | `sushiStation?.uniqueSushi` |
| 121 | 117 | Button Presses | 6875 | 300 | saturating | 500 | 725 | 57 | 192 | 428 | `accountOptions[594]` |
| 122 | 121 | Successful Jelly Operations | 6955 | 72 | linear (capped) | 800 | 800 | 29 | 54 | 72 | `jellyOperator?.obstructionsDefeated` |
| 123 | 122 | Luminous Menagerie Rank | 7035 | 50 | linear (capped) | 1200 | 1200 | 20 | 38 | 50 | `Number((account as any)?.menagerieSave?.[0]?.[2]) || 0` |
| 124 | 123 | Total Menagerie Boosts Upg LV | 7115 | 700 | saturating | 750 | 1088 | 133 | 448 | 997 | `sum menagerieSave[3]` |
## Min-max by stage

No dated community priority list could be retrieved this session (no Reddit/Sheets access; search budget exhausted), so these orders are **computed from the Toolbox curves** (tier 1 data, computed) plus the wiki hint that early-unlock, high-PTS metrics are best and curve-2 (linear) metrics beat saturating ones [C28]. Treat as L-confidence advice (unverifiable opinion, wiki hint tier 3), flagged for a human community pass.

- **W1 early (account LV <350):** nothing counts yet; the Tome is not reachable. Just raise character levels (Account LV is the biggest single metric, 2,175 max). Because every metric is level-gated, **account level is the main early limiter**, not effort on individual metrics (tier 1 gates, H). [C2][C32]
- **W1 mid/late to W2 (LV 350-700):** only metrics 1-9 count: Account LV (2,175), Account Skills LV (1,740), Stamp LV (1,450), Items Found (1,300), Bubble LV (1,750), Cards LV (1,000), Statue LV (870), Talent Max LV (870), Achievements (850). Priority by PTS per effort: Items Found (linear to 1,800, silver at 720 gives 520 PTS of 1,300), Cards and Achievements (linear caps), then stamps and bubbles. Sum available at LV 700: 12,005 PTS. [C29][C33]
- **W3 (LV 700-1,500):** adds Unique Quests, Tasks, Vault LV (+ Teh TOM), then the 700-PTS linear trio Trophies / Nametags / Premium Hats found (needing only 9 / 8 / 30 for silver), Spiketrap round 13, Tournament registrations, Stream watched, Minigame highscore, Arcade shop LV (1,200), Star Talents. Cap at LV 1,500: 21,289 PTS. [C29][C33]
- **W4 (LV 1,470-3,000):** Buy 2 Blue pages immediately (pays above 4,000 PTS, 4·⌊(PTS−4000)/100⌋^0.7). Cheap linear metrics: Rift Levels (500 PTS at 49), Equinox clouds (750 at 31), Constellations (300 at 49), Obols (250 at 107), Sigils (500 at 120), Vials (600 at 962), Prayers (200 at 673), Breedability (200 at 500), Onyx statues (450 at 28). Saturating metrics (Cooking Meals LV, Construction LV, Refinery rank, Atom LV, Deathnote digits) pay mainly up to the silver-gold range. "Lower is better" metrics (Crystal Spawn kills, Chaotic Efaunt, Arena 100, Tremor Wurms) reward optimising the fight, not grinding. Sum at LV 3,000: 36,920 PTS. [C3][C29][C26]
- **W4 late / W5+ outline:** Red pages (7) at ~8,000+ PTS; push beyond 7,000 PTS for the first Tome-bubble stack (each +2,000 PTS = one more stack on three stat bubbles); Event Shop Golden/Singed Tome; Grey Tome Book and the Troll set to scale everything; Teh TOM vault upgrade (up to +1,000 listed PTS). [C10][C11][C12][C14][C20]
- **Per class:** no class split in the data; only the logged-in character's main stat decides whether the class-cauldron multiplier applies to the Tome STR/AGI/WIS bubble. [C12]
- **Reward value of score (computed):** 1,000 PTS = +50% DMG; 2,000 = +81%; 4,000 = +132%; 8,000 = +215%; 10,000 = +251%; 20,000 = +408%. Blue at 10,000 = +70%; 20,000 = +140%. Red at 10,000 = +16%; 20,000 = +57%. Bubble stacks at 7,000 / 9,000 / 15,000 / 25,000 = 1 / 2 / 5 / 10. DMG is concave, so the first thousand PTS matter most; nametags and bubbles reward the long tail. [C30]

## Sources (full list in the structured return)

Toolbox pin 6c37e3d: `tome.ts`, `parsers/index.ts`, `damage.ts`, `efficiency.ts`, `character.ts`, `world-7/spelunking.ts`, `world-7/button.ts`, `world-5/hole.ts`, `world-7/menagerie.ts`, `class-specific/grimoire.ts`, `world-3/armorSmithy.ts`, `world-2/alchemy.ts`, `data/website-data/shared-data.json`, `cauldrons.json`, `items.json`; wiki Tome (rev 2026-10-12), Changelog/2025, Changelog/2026 (fetched 2026-10-19); prior research `origin/research/w4-systems:docs/research/systems/w4-systems/2026-10-17-rift-sigils-tome-bosses-elite.md` (Toolbox @6827d3f, 2026-10-17).
