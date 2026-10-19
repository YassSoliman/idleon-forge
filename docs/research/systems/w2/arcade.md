# Dossier: Arcade (W2)

Revised 2026-10-19 after two adversarial verdict sets (source lens, game-data lens). Confidence H/M/L is given per claim; **Disputed** marks claims one lens refuted. Verified against Toolbox @6c37e3d, game version 2.3.540. Topic id `arcade`. Claim ids [C#] are listed with Source and tier in the structured return; the Source is also given inline here. Tiers: 1 = game data / Toolbox parsers, 2 = Toolbox logic and dashboard pages, 3 = idleon.wiki, 4 = public community guides. "Computed" means derived by this dossier from the cited formula, not read from a source.

## Arcade

- **What it is:** A pachinko minigame run by a clown NPC. Silver balls accrue over time (capped by a max claim time), you launch them into buckets that pay Gold Balls and other prizes, and Gold Balls buy permanent levels (1 to 100, then Super 101 and Omega 102) in the Arcade Shop. The shop holds 74 live bonuses, but only a rotating subset can be bought at one time. Confidence H (shop data and rotation code, tier 1). [C1][C2][C21][C29]
- **Unlocks:** Talk to the Clown at class Level 8 (game dialogue `LevelReq:8`, from the prior W2 dossier reading N.js; DigitalTQ also says Level 8). Location disagrees: the wiki and prior N.js reading say the Yum-Yum Desert (W2) town; DigitalTQ says Blunder Hills (W1). Confidence H for Level 8, M for the town (the Gem Shop pack text in `data/website-data/gemShop.json` L337 says "the clown in World 2 town", tier 1, which supports W2 and counters DigitalTQ; DigitalTQ is internally inconsistent). Also reachable from Quick Ref (wiki). [C27]
- **Scope:** Account-wide. Balls, Gold Balls, Royal balls, Omega balls are account options; shop levels are `ArcadeUpg` (account). The gold-ball multiplier reads the logged-in character's King Doot companion state. [C20][C22]
- **Inputs → outputs:** In: time (balls), plus ball-rate sources, plus launches. Out: Gold Balls (46.9% of launches land in a Gold Ball bucket per wiki, confidence M), money, gems, obol fragments, time candy, pachinko balls, portals to better boards, rare items. Gold Balls convert to permanent shop levels whose effects feed damage, EXP, drop rate, liquids, refinery, cooking, sigils and W5 to W7 systems. [C9][C14][C29][C30][C23]
- **Goals and Milestones:**

  | Milestone | Threshold | Reward | Source |
  |---|---|---|---|
  | Shop level cap | Lv 100 | **Disputed (corrected):** 53 of 74 live bonuses are `decay` (x2 = 100) and reach 50% of x1; 20 are linear `add` (x2 = 0) and reach 100 x x1; 1 is `intervalAdd` (idx 16). Confidence H (game-data lens recount, `shared-data.json` `arcadeShop`) | [C5] |
  | Super level | Lv 101, cost 5 Royal balls (wiki: 5 Cosmic Balls) | bonus x2 (confidence H) | [C2][C32] |
  | Omega level | Lv 102, cost 2 Omega balls (Menagerie unlock 6, v2.3.540) | bonus x6 (confidence H) | [C2] |
  | Ball stockpile bank | 48 h + up to 10 h from the Ball Timer stamp (stamp level 150 hits the 10 h cap) | claim cap (H) | [C13] |
  | Ball rate floor | bonus 122.2% reaches 1800 s per ball, nothing faster | 96 balls per 48 h, 116 per 58 h (H, computed) | [C12] |
  | Tome | arcade total upgrade levels; jackpots hit (`OLA[199]`) | Tome quantities (H, `tome.ts` L314, L372) | [C24] |

- **Feeds / fed by:**
  - Fed by: achievements (24 give Arcade balls/hr, 47% total), Ball Pickle Jar vial (+25% per vial level), W2 merit shop "more balls" (+5% per level, 5 levels), Arcade Ball stamp (up to 50%), Weighted Marbles bribe (+10%), Ball Timer stamp (claim hours), Gold Ball stamp (shop cost down to 0.6x), Killroy skull packs (10 balls per pack, 50 packs a week), Golden Yellow palette, Spheres of Gold, Gold Figleaf, Ballthezar, Hedgehog companion (+200% Gold Balls gained, 300% upgraded) and an event server variable (Gold Ball gain). Confidence H for parser-backed terms, M for the Killroy figures (wiki/community). [C11][C13][C15][C16][C17][C18][C19][C22][C34]
  - Feeds: consumers across `damage.ts`, `character.ts` and W2 to W7 parsers (table below), the Tome, and the Tab 1 Talent Point total. [C23][C24]
- **Per-session actions:** (1) Open the Arcade before the stockpile reaches the max claim time (the one existing ActiveOn check). (2) Launch all balls. (3) Spend Gold Balls on the best active, unmaxed rotation bonus. (4) Buy Killroy ball packs. Idle/capped state: time since last claim exceeds `getMaxClaimTime`. Gold Ball hoarding with an active unmaxed bonus is the second wasted state. Confidence M (ActiveOn-side claim C25 unverified by either lens, so L for the "one existing check" wording). [C14][C25][C34]
- **AFK Setup implications:** None. Expected Return matters: if the player returns after more than the max claim time, claim first.
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:** Letting balls cap (the W2 test account in prior research had balls capped for about 96 h and 0 shop levels bought). Buying bonuses that are not yet useful (Spelunking, Sushi) when the rotation offers a W2 to W4 bonus. Putting Gold Balls into low-value stat bonuses while Gold Ball Gain (cheapest, compounding) is in rotation. Confidence L for the test-account anecdote (internal research, unverifiable here), M for the rest. [C25][C35][C36]
- **Save and Toolbox fields:** see the Mechanics catalogue.
- **Sources:** listed per claim.

## Mechanics catalogue

Fields: `account.arcade.*` is the Toolbox parse of raw `ArcadeUpg` (shop levels) plus account options. `OLA[n]` = `accountOptions[n]`. Parser file: `packages/toolbox-parsers/vendor/parsers/world-2/arcade.ts` (abbrev `arcade.ts`) and `parsers/dungeons.ts`.

### M1. Ball accrual rate
- **Rule:** `secPerBall = 4000 / (1 + (achievements + Ball Pickle Jar vial + 5 x merit level + min(50, Arcade Ball stamp) + Weighted Marbles bribe) / 100)`. With 0 bonus: 4000 s per ball (1 h 6 m 40 s). [C11]
- Confidence H (tier 1, `dungeons.ts`).
- **Floor:** the claim never uses less than 1800 s per ball, so any rate bonus above 122.2% is wasted (computed: 4000/1800 = 2.222). Confidence H. [C12]
- **Caps:** Arcade Ball stamp `decay(50,100)` tends to 50 and is clamped at 50. Vial max level 13. Merit shop 5 levels (`bonusPerLevel` 5, `meritCost` 2). Confidence H. Gem Shop ball packs (Smol 30, Med 100, Biggy 500 arcade balls; `gemShop.json` L336-357) add balls but do not change the rate. [C16][C17][C18]
- **Unlock:** Arcade unlocked (class Lv 8). **Costs:** n/a (passive).
- **Field:** `getSecPerBall`, `getBallBonus` in `dungeons.ts` L84-108. Inputs: `account.achievements`, `account.alchemy.vials` (stat `arcadeBALLZ`), `account.tasks[2][1][7]`, `account.stamps` (effect `Arcade_Ball_recharge_rate`), `account.bribes` (`Weighted_Marbles`).

### M2. Max claim time and claim formula
- **Rule:** `maxClaim = ceil(3600 x (48 + min(10, Ball Timer stamp hours)))`. `ballsToClaim = floor(min(secondsAway, maxClaim) / max(secPerBall, 1800))`. Ball Timer stamp is `decay(12,30)`, so the 10 h clamp is reached at stamp level 150 (computed: 12L/(L+30) = 10 gives L = 150). Confidence H. At base rate 43 balls per 48 h, 52 per 58 h; at the floor 96 and 116. [C13][C14][C12]
- **Field:** `getMaxClaimTime`, `getArcadeBallsToClaim` (`dungeons.ts` L80-94); last claim time is `account.timeAway.Arcade` (seconds). ActiveOn: `account.afk.arcade = {lastClaimAt, maxClaimMs}` in `afk-facts.ts`. [C25]

### M3. Other ball sources
- Killroy Skull Shop: 4 skulls buy 10 balls, 50 packs a week; count in `OLA[417]` (`arcadePacksBought`). Buckets can return extra Pachinko balls (wiki 1.65% per ball; the Jackpot adds 250). Events can also grant balls. Confidence M (wiki/community; the 1.65% pachinko-ball overall figure is unverifiable, L). [C34][C29][C30]
- **Gem Shop ball packs (added, missed mechanic):** Smol 30, Med 100 (+20% value), Biggy 500 (+33% value) arcade balls, bought with gems. Source: `data/website-data/gemShop.json` L336-357, tier 1, 2026-10-19. Confidence H. They are a direct ball source that bypasses the claim cap logic; ActiveOn should not count them as time-based accrual.
- DigitalTQ (tier 4) says you start with 15 balls (confirmed against DigitalTQ itself, 1h6m per ball). Confidence M. [C28]

### M4. Boards, buckets and the launch
- Seven bucket tiers by colour; each pays Gold Balls (3, 6, 12, 75, 200, 500, 3000 at the rarest of each tier per wiki), portals up a tier (Copper, Silver, Gold, Dementia), resources, dice, obol fragments, time candy, gems, card packs and boat items. Overall per-ball odds (wiki): Golden Balls 46.9% (confirmed), money 36.6% (prior reading, L), gems 6.43% (confirmed), pachinko balls 1.65% (unverifiable, L). Confidence M. [C29][C30]
- **Bucket portal tier progression and Jackpots Hit (added):** portal buckets move the ball up a board tier (Copper, Silver, Gold, Dementia); the Jackpots Hit counter is `accountOptions[199]` (`tome.ts` L314). Confidence M for tiers (wiki), H for the counter.
- **Rare bucket drops (added, wiki, tier 3, confidence M):** Arcade Ball Stamp, Gold Ball Stamp, Ball Timer Stamp and The Red Boaty can drop from rare buckets. Odds not recorded.
- Red Dice (a 6 roll, 0.94% prior reading) opens the "Ballpit of Fire and Fury" (Lava Ballpit mini-game, 3 tilt options, pays Lava Balls); the developer-recommended tilt is Right. Confirmed on wiki and Games Finder (tiers 3-4). Confidence M. [C31]
- Jackpot bucket (Godshard): **Disputed (corrected).** The earlier "1/1,100 each" figure is not on the wiki page. Source lens correction: the Godshard bucket pays 2,000 gems, 3,000 Gold Balls and 250 Pachinko balls at 100% per bucket hit (wiki shows "1 in 1"); the odds of reaching that bucket are not recorded. Confidence M. `OLA[199]` counts jackpots hit (Tome, H). [C29][C24]
- Not in the save: bucket landing is skill/RNG during play, so ActiveOn can only track counts and balances.

### M5. Gold ball gain multiplier
- **Rule:** every Gold Ball prize is multiplied by `(1 + (Golden Yellow palette + Arcade shop #39 + Spheres of Gold (Arcane) + Gold Figleaf (Exotic Market) + Ballthezar + Hedgehog companion)/100) x (1 + ArcGballPCT/100)`. Ballthezar adds 50 when Coral Kid upgrade 0 is owned and King Doot is active. The event part is excluded from the Jackpot. Confidence H (parser). Note: the code comment cites a Summoning `ArcadeGballsExtraPCT` term that the parser does not apply; either the game applies it and Toolbox lacks it (possible gap) or the comment is stale. Confidence L on that gap. The Hedgehog term is `companions.list[36].bonus` (200, 300 upgraded; `companions.json`). Event multiplier `serverVars.ArcGballPCT` is typed in `generated-firebase-types.ts` L826; Ballthezar and King Doot interplay as written. [C22]
- **Field:** `account.arcade.goldBallMulti` (`arcade.ts` L50-78): palette index 15, arcade bonus 39, Tesseract bonus 16, Exotic Market 57, Companion 36, `serverVars.ArcGballPCT`.

### M6. Shop rotation
- Server variable `ArcadeBonuses` is an array of shop indices; `shop[i].active = ArcadeBonuses.includes(i)`, `rotationIndex = indexOf(i)`. Only active bonuses can be upgraded; levels are kept when a bonus rotates out (DigitalTQ). Wiki and DigitalTQ say 9 at a time, changing with game updates; the prior dossier saw 8 active on the 2026-10-17 saves. Count unresolved (Q1); code reads the array with no fixed length. Confidence M. [C21][C33]
- **Field:** `account.arcade.shop[].active`, `.rotationIndex` (from `serverVars.ArcadeBonuses`).

### M7. Shop level curves and effect size
- Per level L, bonus = `growth(func, L, x1, x2)`. `add`: x1 x L (x2 = 0). `decay`: x1 x L / (L + x2). `intervalAdd`: x1 + floor(L / x2). **Disputed (corrected):** of 74 live bonuses, 53 use `decay` with x2 = 100 (Lv 100 gives 50% of x1), 20 use `add` (x2 = 0, gives 100 x x1) and 1 uses `intervalAdd` (idx 16). Confidence H. Toolbox's `intervalAdd` returns 1 at level 0 for Tab 1 Talent Pt (a quirk, Q2; game gating unverifiable, L). Confidence H for formulas. Name-based lookup is unsafe: effect names repeat (Cash from Mobs idx 10/11, Artifact Find idx 32/66), so always address bonuses by index. Entries whose effect text starts with `}` (e.g. `}x_Jelly_Bloodcells`, `}x_hourly_Lumi_Gain`) are multiplier-style and display as 1 + bonus/100 (`formatArcadeEffect`). Tab 1 Talent Pt and Starting TD Pts (idx 15-16) are plain integers, not percents. [C3][C4][C5][C6]
- Final bonus = curve x (2 at Lv 101, 6 at Lv 102, else 1) x (2 if companion 27 is owned). [C3]
- Full per-bonus table below.

### M8. Gold ball cost per level
- `stampMath = max(0.6, 1 - GoldBallStamp% / 100)`. `cost(L) = round(stampMath x curve)`; curve by shop index: #39 Gold Ball Gain `5 + 3L`; #51, #54 `10 + 5L + L^1.43`; #70 and above `20 + 10L + L^1.92`; #62 to #69 `20 + 10L + L^1.69`; #55 to #69 except #60 and #61 `20 + 10L + L^1.83`; everything else `5 + 3L + L^1.3`. **Wording fix:** idx >= 62 uses L^1.69 below 70 and #70+ uses L^1.92; #55-61 (except 60 and 61) use L^1.83, so "#55 to #69" is misleading for 62-69 (they use 1.69). Confidence L: the shop cost curve (`arcade-shop.jsx`) is not vendored, so the curve is unverifiable in code (game-data lens); the source lens matched it to the wiki. [C7]
- Cost from Lv 0 to 100 (computed): Gold Ball Gain 15,350; base-curve bonuses 32,457 (19,472 at the 0.6 floor); Emperor and Prisma 55,201; #55+ tier 210,735; #62 tier 139,478; #70+ tier 284,977. All 74 bonuses together: 5,187,837 at full price. Matches the wiki's 32,457 / 19,472 / 15,350 / 55,201 / 139,478 / 284,977 (source lens recomputed all totals, 5,187,837 confirmed). Confidence M (cost curve not in vendored code). [C8][C9]
- **Gold Ball Stamp (`StampC5`):** `decay(40,100)`, so the discount tends to 40% and the 0.6 floor is only approached. Confidence H. [C10]

### M9. Super and Omega levels
- Lv 100 to 101 costs 5 Royal balls (`OLA[324]`); Lv 101 to 102 costs 2 Omega balls (`OLA[625]`, v2.3.540). The wiki calls the first currency "Cosmic Balls", sourced from events, and says they double a maxed bonus. Update: the Gem Shop item (`gemShop.json` L1969) reads "Gives you 5 Cosmic Balls, which is exactly enough to DOUBLE any ... Maxed Out bonuses ... in the Arcade's Gold Ball Shop", matching the 5 Royal-ball cost, so confidence H that Cosmic = Royal (Q5 resolved). Cosmic/Royal balls also come from events; Omega balls come from Menagerie. [C2][C32]
- **Field:** `getArcadeCapCost`, `ARCADE_SUPER_LEVEL`, `ARCADE_OMEGA_LEVEL` in `arcade.ts` L21-30.

### M10. Companion doubling
- `isCompanionBonusActive(account, 27)` doubles every shop bonus. Companion 27 is Spirit Reindeer (`companions.json`): "2.00x Gold Ball Shop Bonuses", upgraded variant 2.50x (`upgradedBonus` 1.5). The parser applies a flat 2, not the upgraded 2.5; confidence M that the upgraded variant matters in game. It stacks multiplicatively with Super (2x) to 4x, and with Omega 6x to 12x. Confidence H for 2x, L for upgraded handling. [C3]

### M11. Tome and totals
- Tome reads `arcade.totalUpgradeLevels` (sum of all levels, including Super and Omega counted as 101 and 102) and `OLA[199]` (jackpots). Confidence H. [C24]

### M12. Currencies
- `OLA[74]` balls, `OLA[75]` Gold Balls, `OLA[324]` Royal balls, `OLA[625]` Omega balls. `OLA[417]` Killroy packs. Confidence H. [C20][C34]

### M13. Shop bonus catalogue (all 74 live bonuses)

Columns: shop index, effect, curve `func x1, x2` (placeholders 74 to 79 are "who_knows" and unfilled), value at Lv 100 before Super, Omega and companion multipliers, Gold Balls from Lv 0 to 100 at full price, and the Toolbox parser file that reads it. Source for every row: `data/website-data/shared-data.json` `arcadeShop` and `rg getArcadeBonus parsers`. Confidence H for curves and Lv 100 values (rows with `add` are 100 x x1), M for costs. Placeholders 74-79 are `+{%_who_knows` decay 5/100. `getArcadeBonus` is used in 31 parser files. [C1][C5][C7][C23]

| # | Bonus | Curve | Lv 100 | Cost 0 to 100 | Consumer |
|---|---|---|---|---|---|
| 0 | + Base Damage | `add` 1, 0 | 100 | 32,457 | damage.ts |
| 1 | + Base Defence | `add` 0.2, 0 | 20 | 32,457 | damage.ts |
| 2 | + Total Accuracy | `decay` 60, 100 | 30 | 32,457 | damage.ts |
| 3 | + Mining EXP gain | `decay` 60, 100 | 30 | 32,457 | character.ts |
| 4 | + Fishing EXP gain | `decay` 60, 100 | 30 | 32,457 | character.ts |
| 5 | + Sample Size | `decay` 4, 100 | 2 | 32,457 | character.ts |
| 6 | + AFK Gains Rate | `decay` 4, 100 | 2 | 32,457 | character.ts |
| 7 | + Cap for all Liquids | `decay` 25, 100 | 12.5 | 32,457 | world-2/alchemy.ts |
| 8 | + Multikill per Tier | `decay` 10, 100 | 5 | 32,457 | damage.ts |
| 9 | + Catching EXP gain | `decay` 50, 100 | 25 | 32,457 | character.ts |
| 10 | + Cash from Mobs | `decay` 20, 100 | 10 | 32,457 | character.ts |
| 11 | + Cash from Mobs | `decay` 30, 100 | 15 | 32,457 | character.ts |
| 12 | + Class EXP gain | `decay` 20, 100 | 10 | 32,457 | character.ts |
| 13 | + Shiny Chance | `decay` 100, 100 | 50 | 32,457 | world-3/traps.ts |
| 14 | + Trapping EXP | `decay` 50, 100 | 25 | 32,457 | character.ts |
| 15 | + Starting TD Pts | `add` 1, 0 | 100 | 32,457 | none matched (see Q3) |
| 16 | + Tab 1 Talent Pt | `intervalAdd` 1, 10 | 11 | 32,457 | none matched in vendored parsers (see Q3) |
| 17 | + Weapon Power | `add` 0.07, 0 | 7 | 32,457 | damage.ts |
| 18 | + Skill EXP gain | `decay` 20, 100 | 10 | 32,457 | character.ts |
| 19 | + Base STR | `add` 1, 0 | 100 | 32,457 | none matched (see Q3) |
| 20 | + Base AGI | `add` 1, 0 | 100 | 32,457 | none matched (see Q3) |
| 21 | + Base WIS | `add` 1, 0 | 100 | 32,457 | none matched (see Q3) |
| 22 | + Base LUK | `add` 1, 0 | 100 | 32,457 | none matched (see Q3) |
| 23 | x Trapping Critters | `decay` 30, 100 | 15 | 32,457 | none matched (see Q3) |
| 24 | x Worship Souls | `decay` 30, 100 | 15 | 32,457 | world-3/worship.ts |
| 25 | + Refinery Speed | `decay` 30, 100 | 15 | 32,457 | world-3/refinery.ts |
| 26 | + Forge Capacity | `decay` 100, 100 | 50 | 32,457 | none matched (see Q3) |
| 27 | + Drop Rate | `decay` 30, 100 | 15 | 32,457 | character.ts |
| 28 | x Cooking Speed | `decay` 40, 100 | 20 | 32,457 | world-4/cooking.ts |
| 29 | + Lab EXP gain | `decay` 30, 100 | 15 | 32,457 | character.ts |
| 30 | + Breed Mob DMG | `decay` 40, 100 | 20 | 32,457 | none matched (see Q3) |
| 31 | + Nugget Regen | `decay` 30, 100 | 15 | 32,457 | none matched (see Q3) |
| 32 | + Artifact Find | `decay` 50, 100 | 25 | 32,457 | world-5/sailing.ts |
| 33 | + Sailing Loot | `decay` 30, 100 | 15 | 32,457 | world-5/sailing.ts |
| 34 | + W Ess gain | `decay` 40, 100 | 20 | 32,457 | none matched (see Q3) |
| 35 | + Jade gain | `decay` 50, 100 | 25 | 32,457 | none matched (see Q3) |
| 36 | + Farming EXP | `decay` 30, 100 | 15 | 32,457 | character.ts |
| 37 | + Divinity EXP | `decay` 40, 100 | 20 | 32,457 | character.ts |
| 38 | x Villager XP multi | `decay` 40, 100 | 20 | 32,457 | world-5/hole.ts |
| 39 | + Gold Ball Gain | `add` 1, 0 | 100 | 15,350 | `arcade.ts` getGoldBallMulti |
| 40 | + Deathbringer Bones | `add` 1, 0 | 100 | 32,457 | class-specific/grimoire.ts |
| 41 | + Equinox Fill Rate | `add` 0.75, 0 | 75 | 32,457 | world-3/equinox.ts |
| 42 | + Monument AFK | `add` 0.5, 0 | 50 | 32,457 | world-5/caverns/bravery.ts |
| 43 | x Sigil EXP gains | `add` 1, 0 | 100 | 32,457 | none matched (see Q3) |
| 44 | + Construction Build | `add` 2, 0 | 200 | 32,457 | character.ts |
| 45 | + Burger | `add` 1, 0 | 100 | 32,457 | none matched (see Q3) |
| 46 | + Total Damage | `add` 2, 0 | 200 | 32,457 | damage.ts |
| 47 | + Windwalker Dust | `add` 1, 0 | 100 | 32,457 | class-specific/compass.ts |
| 48 | x Medallion Chance | `add` 0.5, 0 | 50 | 32,457 | none matched (see Q3) |
| 49 | x Breedability Rate | `decay` 100, 100 | 50 | 32,457 | world-4/breeding.ts |
| 50 | + Arcane Tachyons | `add` 1, 0 | 100 | 32,457 | class-specific/tesseract.ts |
| 51 | + Emperor Bonuses | `add` 0.2, 0 | 20 | 55,201 | world-6/emperor.ts |
| 52 | + Sneaking XP multi | `decay` 100, 100 | 50 | 32,457 | character.ts |
| 53 | x Summon XP multi | `decay` 100, 100 | 50 | 32,457 | character.ts |
| 54 | + Prisma Bonuses | `decay` 10, 100 | 5 | 55,201 | class-specific/tesseract.ts |
| 55 | x Spelunking Amber | `decay` 50, 100 | 25 | 210,735 | world-7/spelunking.ts |
| 56 | + Spelunk XP multi | `decay` 30, 100 | 15 | 210,735 | none matched (see Q3) |
| 57 | + Daily Coral | `decay` 10, 100 | 5 | 210,735 | world-7/coralReef.ts |
| 58 | + Palette Luck | `decay` 50, 100 | 25 | 210,735 | world-5/gaming.ts |
| 59 | + Meritocracy Bonus | `decay` 10, 100 | 5 | 210,735 | world-2/voteBallot.ts |
| 60 | + Class XP multi | `decay` 50, 100 | 25 | 32,457 | character.ts |
| 61 | + Kruk Bubble LVs | `decay` 40, 100 | 20 | 32,457 | world-2/alchemy.ts |
| 62 | x Minehead Currency | `decay` 25, 100 | 12.5 | 139,478 | none matched (see Q3) |
| 63 | x Research XP | `decay` 20, 100 | 10 | 139,478 | none matched (see Q3) |
| 64 | + Megacrop Chance | `decay` 50, 100 | 25 | 139,478 | world-6/farming.ts |
| 65 | + New Crown Chance | `decay` 15, 100 | 7.5 | 139,478 | world-5/gaming.ts |
| 66 | + Artifact Find | `decay` 60, 100 | 30 | 139,478 | world-5/sailing.ts |
| 67 | x Sushi Bucks | `decay` 25, 100 | 12.5 | 139,478 | world-7/sushiStation.ts |
| 68 | x Fountain Speed | `decay` 30, 100 | 15 | 139,478 | world-5/caverns/the-fountain.ts |
| 69 | + Cook Mastery EXP | `decay` 100, 100 | 50 | 139,478 | world-4/cooking.ts |
| 70 | + Kingdom Resources | `decay` 6, 100 | 3 | 284,977 | class-specific/royalGuardian.ts |
| 71 | + Marble Drop Rate | `decay` 3, 100 | 1.5 | 284,977 | class-specific/royalGuardian.ts |
| 72 | x Jelly Bloodcells | `decay` 5, 100 | 2.5 | 284,977 | world-7/jellyOperator.ts |
| 73 | x hourly Lumi Gain | `decay` 40, 100 | 20 | 284,977 | world-7/menagerie.ts |

W5+ extensions (one line each): #38 Villager XP (Hole), #42 Monument AFK (Bravery), #32, #33, #66 sailing/artifacts, #58, #65 Gaming palette/crown, #59 Meritocracy (W7 ballot), #55-57, #67, #72, #73 W7 (Spelunking, Coral, Sushi, Jelly, Lumi), #51 Emperor (W6), #64 Megacrop (Farming), #68 Fountain, #70-71 Kingdom/Marble (Royal Guardian class), #62-63 Minehead/Research.

## Min-max by stage

All community priorities below are secondary to the rotation: only active bonuses can be bought (M6). Where the line is "computed" the order is derived from the cost and value tables here, not from a community source; confidence L unless stated.

- **W1 (early to late):** The Arcade is not available (Clown, class Lv 8, W2 town). Prepare: put stamp levels into Arcade Ball, Ball Timer, and Gold Ball stamps as stamps open, take the achievements that give "Arcade balls/hr" as they come (24 exist; e.g. a 200,000 Sandstone Colosseum score gives +2%). [C15][C18][C13][C10]
- **W2 early (first visit):** Unlock at Lv 8, launch everything, and open it at least once per max claim window (48 h; at the base rate that is 43 balls). Priority (community, tier 4): Gold Ball Gain first when in rotation (cheapest at 15,350 for +100%, and it compounds), else Weapon Power or Class XP multi for new players. [C35][C36][C11][C8]
- **W2 mid:** Raise the ball rate: Ball Pickle Jar vial, Weighted Marbles bribe, 5 merit levels (merit shop ranks "more balls" 6th of 9 in the W2 merit list per Incomplete Guide), stamps. Buy Killroy ball packs. Order (community plus computed): Gold Ball Gain, then Class XP multi, Liquid cap, Drop Rate, Weapon Power. [C38][C34][C35][C36]
- **W2 late:** Keep the rate near the 1800 s floor only if 96 balls per 48 h is worth the cost; further bonus beyond 122.2% is wasted. Spend Gold Balls continually; leaving Gold Balls above the next level cost with an active unmaxed bonus is the detectable mistake. [C12][C25]
- **W3:** Add Refinery Speed (15% for 32,457), Sample Size (only 2% at Lv 100, low value), Construction Build (+200%), Worship Souls, Trapping Critters, Equinox Fill Rate, Shiny Chance (to Lv 100 = +50%). Community S tier (gameslikefinder, 2026-10-19): Drop Rate 15%, Refinery Speed 15%, Construction Build 200%, Multikill 5%, plus Gold Ball Gain. [C36][C23]
- **W4:** Cooking Speed (x1.2), Cook Mastery EXP (+50%), Lab EXP (+15%), Breedability Rate, Total Damage (+200% for 32,457, base curve), Base Damage. Community S/A: Summoning XP multi (50%), Research XP (10%), Villager XP (W5, 20%). Prima bubble bonus (Prisma +5%) and Emperor (+20%, needs the W6 boss) are S+ but later. [C36][C23]
- **W5 and later (outline):** Gold Ball Gain, Prisma, Emperor (+20%), Lumi Gain, Meritocracy (+5%), Spelunking Amber (+25%) are the S+/S bonuses per gameslikefinder; everything else is purchased when the system opens. Cosmic/Royal balls double a maxed bonus. [C36][C32]

### Priority order (derived, one list)
1. Open the Arcade before the claim cap (always). 2. Gold Ball Gain (15,350 to max for +100% gain). 3. Drop Rate, Class XP multi, Total Damage, Refinery Speed (all 32,457 on the base curve). 4. Construction Build, Cook Mastery, Cooking Speed. 5. W5+ bonuses when the system opens (cost tiers 55,201 to 284,977). Items 3 and 4 are computed from cost and value; only item 2 has community confirmation (tier 4). [C8][C35][C36]

## Open questions
- Q1: How many entries does `ArcadeBonuses` hold? Wiki and DigitalTQ say 9; the prior dossier saw 8. Need `serverVars.ArcadeBonuses.length` from a live save.
- Q2: Is the Tab 1 Talent Pt bonus 1 at level 0 in the game, or does the game gate on level? Toolbox's `intervalAdd` gives `x1 + floor(L/10)` which is 1 at Lv 0.
- Q3: (count of 18 unverifiable, L) bonuses (e.g. Starting TD Pts, Base STR/AGI/WIS/LUK, Trapping Critters, Forge Capacity, Nugget Regen, Jade, W Ess, Burger, Medallion Chance, Sigil EXP, Spelunk XP, Minehead, Research XP, Breed Mob DMG) have no direct `getArcadeBonus(...)` call in the vendored parsers; check other access paths (account-state `talent-points`, index-based reads).
- Q4: Achievement #140 "Snowy Wonderland" is in `ballsBonuses` with +1% but its reward text lists only 25 gems.
- Q5: Whether the wiki's "Cosmic Balls" are Toolbox's "Royal balls".
- Q6: Gold Ball expected value per ball launched and the benefit of each board; bucket odds come only from the wiki bot table.
- Q7: Community per-stage order beyond Gold Ball Gain first is thin. Reddit thread 1txs94z could not be re-fetched directly (blocked), so it is cited through the prior priority-verification dossier.
- Q8: Does the game apply Summoning `ArcadeGballsExtraPCT` to Gold Ball prizes (code comment says yes, parser omits it)? Confidence L either way.
- Q9: Does the upgraded Spirit Reindeer (2.5x) apply in game? Parser uses a flat 2x.
- Q10: Odds and drop rates of the rare bucket drops (Arcade Ball, Gold Ball, Ball Timer stamps, The Red Boaty) are not recorded.
