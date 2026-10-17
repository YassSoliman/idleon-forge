# Upgrade Vault

Research date 2026-10-17, game v1.23 "Lumi Menagerie" (N.js Last-Modified 2026-10-17), IdleonToolbox commit `6827d3f`. `TB` below means `https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/`. N.js offsets are `str.find` character offsets into `https://www.legendsofidleon.com/ytGl5oc/N.js` (v1.23). Confidence: H = read in code or data, M = inferred, L = community or secondhand.

### Key findings

- **No vault row is gated by kills.** Every row unlocks on one number: the account's total Vault levels (the sum of all 90 rows). The kill counts on Bean, Carrot, Branch, Poop and Sheepie maps only scale five rows' bonuses, one step per power of 10 (100, 1,000, 10,000 kills...) (H, N.js `VaultUpgUNLOCKED`, `VaultKillzTotal`). So every cheap level is "unlock fuel".
- **The table in v1.23 has 90 rows, unchanged from the Toolbox data and the wiki.** N.js `na.UpgradeVault` matches Toolbox `upgradeVault` row for row (H). The wiki page is bot-drawn from game data (last edit 2026-10-07, before v1.23), but no v1.23 change touches the vault, so it is not Stale for content (M).
- **Cost = `L + (x1 + L) * x2^L`** for the next level L. Major Discount (row 13) only discounts rows 0-32; rows 62+ pay an extra `1.1^(row-61)`. The W7 discounts (Darts minigame, Cryosnake pet, Sushi) cut every row (H, N.js `VaultUpgCost`). To reach 1,000 total levels by buying the cheapest level each time costs about 4.6M coins; 1,724 about 71M; 2,500 about 2.1B; 3,400 about 126B (M, simulation from game formulas, no W7 discounts).
- **The engine rows come first.** Major Discount (up to 4.2x cheaper rows 0-32), Vault Mastery I (up to 1.5x on the blue rows), the coin rows (Monster Tax plus the kill and skill-scaled coin rows) and capped cheap rows (Boss Decimation, Dirty Money, Baby on Board, Sleepy Time, Weapon Craft, Knockout!) give the most per coin. Buy one-off rows when they unlock: the three 777-coin class skill rows, Straight to Storage (3M), Card Retirement (50M) and Duplicate Entries (100M, buy it before you redeem Colosseum tickets).
- **Knockout! is the biggest W1-W3 damage row and it needs active play.** Each Knockout (a one-hit kill with no weapon on the current ladder target, 78 targets in order) adds row-15 bonus % to total damage. At 5 levels and the full ladder that is +390% before Vault Mastery (H, N.js). Toolbox has no alert for it.
- **Two Toolbox quirks matter.** (1) The game unlocks rows by count (row i is buyable when at least i+1 rows have unlock levels at or under your total), so at 75-79 total levels the game lets you buy Steel Guard (unlock 80) but not Evolving Talent (unlock 75). Toolbox flags them the other way round (H for the purchase check, M for what the UI shows). (2) Happy Doggy (row 19) has no gameplay read anywhere in N.js v1.23. Only the vault UI uses it, so level it only as unlock fuel (H for no read, M for "does nothing").
- **The vault is a quest gate.** Scripticus's class quest step "Buy Upgrades: 25" reads `VaultUpgTotal` (Vault levels), not talent points (H, N.js; this corrects a Reddit claim and an open question in another dossier).
- **Fixture sanity check (aggregate):** the W2 account had 1,724 total Vault levels (43 rows unlocked, next row Active Murdering at 1,780). The W3 account had 2,497 (53 unlocked, next row Special Talent at 2,530). Neither had any W7 cost reduction (cheaper factor 1.00x).

## Upgrade Vault

- **What it is:** An account-wide coin sink in the Codex. 90 permanent upgrades ("rows") are bought with coins. Each row unlocks once the account's **total Vault levels** (the sum of every row's level) reach that row's threshold. The rows boost combat, coins, Class EXP, talent points, W1-W3 systems (stamps, statues, anvil, forge, owl, alchemy, Poppy, construction) and later W4-W6 systems. Lava called it a catch-up system "directed at new players" (Changelog v2.27, 2025-02-03).
- **Unlocks:**
  - The vault is open from the start of the game. It sits in the Codex, Quik Ref tab, bottom right, and there is also a HUD shortcut (N.js `MenuType2=72` from Codex `MenuType 3` with `OptionsList[12]==2` @5354230; HUD button `_UIinventory15[61]` @11789422; H). The Lava NPC dialogue in W1 says "Go spend your coins at the Upgrade Vault!" until you buy your first levels (@20944832, H). Bonuses read 0 while you are in a Tutorial scene (`VaultUpgBonus` returns 0 when the scene name contains "Tutorial", @10883139, H).
  - Rows unlock by total Vault level (column `unlockLevel`, index 6 of each row). Exact rule (N.js `VaultUpgUNLOCKED` @10880927, H): the game counts how many rows have `unlockLevel <= total`. Row i can be seen and bought only when i is below that count. The list is sorted by threshold except rows 5 and 6 (80 and 75), so the only visible effect is at totals 75-79 (see Common mistakes).
  - **Content history:** Vault I (rows 0-32, W1-early W3) v2.27 on 2025-02-03. Vault II (rows 33-61, "29 new updates which boost ... World 2, World 3, and World 4") v2.29 on 2025-02-15 ([Changelog/2025](https://idleon.wiki/wiki/Changelog/2025)). Vault III (rows 62-89, W5-W6, 28 rows) v1.08 on 2026-03-13. The wiki shows that date as "March 13, 2025", a typo; Steam dates it 2026-03-13 ([Changelog/2026](https://idleon.wiki/wiki/Changelog/2026)). Glimbo's Swap Meet (W7) raises the max LV of some rows (Changelog/2026). Bullseye's max went from 200 to 500 in v1.01 (2025-11-15, Changelog/2025). A bug capping "Teh TOM" at 500 Tome score was fixed in v1.10 (2026-03-29, Changelog/2026). The v1.22 (2026-09-18) and v1.23 (2026-10-16) Steam patch notes do not mention the vault ([Steam news](https://store.steampowered.com/news/app/1476970)), and the v1.23 N.js table matches the Toolbox data (H).
- **Scope:** Account-wide. The save is one list of levels (`UpgVault`) shared by every character, and every bonus applies to every character. Exceptions: Baby on Board only boosts your lowest-level character (N.js sets `ExpGainLUK2` on the last player only, @4256258, H). Evolving Talent gives tab-2 points (Warrior, Archer, Mage lines). Stunning Talent gives tab-3 (subclass) points. The three skill rows (Massive Whirl, Rapid Arrows, Dual Fireballs) only change that class's skill. **Coins are spent from the character you are playing** (`Money` game attribute; the raw save holds `Money_<i>` per character plus `MoneyBANK`; H). The v1.07 Advanced Features toggle "money is shared between characters" (2026-03-06, Changelog/2026) changes this; how exactly is not verified (L).
- **Inputs → outputs:**
  - **Input: coins only.** The cost of the next level L of row i is `base = L + (x1 + L) * x2^L` (N.js `VaultUpgCost` @10879556; TB `parsers/misc/upgradeVault.ts#L190-L201`; H). Multipliers:
    - Rows 0-32: `max(0.001, 1/(1 + MajorDiscount/100) * Darts) * Companion99 * Sushi * base`. Major Discount bonus = 4 x its level.
    - Rows 33-89: `max(0.01, Darts) * Companion99 * Sushi * 1.1^max(0, i-61) * base`. **Major Discount does not apply here.**
    - `Darts = 1/(1 + OptionsListAccount[437]/100)`, the 3rd upgrade of the Darts minigame shop ("All Vault upgrades are }x Cheaper!", @12891777). `Companion99` = Cryosnake pet, 50% cheaper (75% upgraded). `Sushi` = Sushi Station bonuses 38/47 (W7). Each is floored at 0.1 (H). All three are W7 or pet content, so W1-W4 players pay `base` times the Major Discount factor.
    - The Major Discount effect table: 10 levels 1.4x cheaper (28.6% off), 20 levels 1.8x, 40 levels 2.6x, 60 levels 3.4x, 80 levels 4.2x (76.2% off); with the bundle (90 levels) 4.6x (H, arithmetic).
  - **Kill, skill and progress inputs (scale bonuses, never unlocks).** `VaultKillzTotal` (N.js @10885406; TB `upgradeVault.ts#L269-L322`; H) builds a 12-slot array:
    - Slots 0-3: total kills over all characters on map 14 Valley of the Beans (Bean), 24 Vegetable Patch (Carrot), 13 The Base of the Bark (Branch), 8 Poopy Sewers (Poop). A kill here = the map's portal requirement minus `KillsLeft2Advance`, so it keeps counting after the portal opens.
    - Slots 4-7: `floor(log10)` of each of those, 0 under 10 kills.
    - Slot 8: Taskboard recipes unlocked, from `Tasks[3]` (Toolbox's comment calls it "completed tasks", but `parsers/tasks.ts#L82` reads the same array as `unlockedRecipes`).
    - Slot 9: total bubble levels over the 4 cauldrons, each bubble capped at 100.
    - Slots 10-11: Sheepie kills on map 101 Steep Sheep Ledge, and their `floor(log10)`.
    - Other inputs: ores mined (`OptionsListAccount[340]`), fish caught (`[345]`) and bugs caught (`[346]`). These use the continuous `log10`, not floored (`getLOG` = `ln(max(x,1))/2.30259`, @4455448). Also Knockout ladder progress (`[338]`) and cards found.
  - **Outputs:** the per-row bonus. "Simple" rows give `level * x5`. Rows 0-31 are multiplied by `1 + VaultMastery/100`, rows 33-60 by `1 + VaultMasteryII/100`, rows 62-88 by `1 + VaultMasteryIII/100`. The exceptions are the simple rows: 1, 6-9, 13, 32, 33, 36, 40, 42-44, 49, 51-53, 57, 61, 64, 70, 73, 74, 76, 79, 85, 86, 88, 89. Row 0 adds +1 per level past 25, past 50 and past 100. Row 60 accelerates past 25/50/100/200/300/400/450 and gets `x(1 + floor(L/25)/5)` (N.js `VaultUpgBonus` @10883139; TB `upgradeVault.ts#L207-L250`; H). These match the wiki's blue, green and red highlights ([Upgrade_Vault](https://idleon.wiki/wiki/Upgrade_Vault), rev 2026-10-07).
  - **Max LV:** base `maxLevel` (index 4). +10 for every row with base max >= 2 if the account owns the Pot Of Gold Pack (bundle `bon_u`, $12.99, which also gives the Potluck pet; [Gem_Shop](https://idleon.wiki/wiki/Gem_Shop)). W7 Glimbo trades add more to certain rows (N.js `VaultUpgMaxLV` @10881366; TB `upgradeVault.ts#L157-L182`; H).
  - **Buying:** a level can be bought when the row is visible, below max LV, and the current character's Money >= cost. You can hold down the button to buy repeatedly (N.js `_event_OwlEvent` purchase block near @11737200, H; the mobile hold-down speed fix is in Changelog v2.28, 2025-02-08).

### Full upgrade table (game data v1.23)

Costs are raw coins before any discount, from `TB data/website-data/shared-data.json#L49465` (`upgradeVault`). This is identical to N.js `na.UpgradeVault` @14230753 (H). "Cost of LV 1" includes the `1.1^(i-61)` factor for rows 62+. Max LV is the base value, before the +10 bundle and Glimbo. "Mastery tier" = which Vault Mastery multiplies the row ("-" = not boosted). Per-level effects are the in-game text with `{` = `level * x5` (before Mastery).

| # | Upgrade | Unlock (total LV) | Max LV | Per LV (x5) | Base (x1) | Scale (x2) | Cost of LV 1 | Cost to max (pre-discount) | Mastery tier | Effect | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | Bigger Damage | 0 | 500 | 1 | 8 | 1.025 | 8 | 4.3e09 | VM I | +1 Damage per level; +1 more per level past 25, 50 and 100 | Combat (flat damage) |
| 1 | Natural Talent | 7 | 200 | 1 | 14 | 1.15 | 14 | 1.9e15 | - | +1 Talent Point (tab 1) per level | Talents tab 1 |
| 2 | Monster Tax | 13 | 500 | 2 | 10 | 1.05 | 10 | 3.85e14 | VM I | +2% coins dropped by monsters per level | Coins (MonsterCash additive pool) |
| 3 | Wicked Smart | 42 | 500 | 2 | 15 | 1.2 | 15 | 9.92e42 | VM I | +2% Class EXP per level | Class EXP |
| 4 | Bullseye | 49 | 500 | 1 | 25 | 1.15 | 25 | 7.7e33 | VM I | +1 Accuracy per level (max raised 200 to 500 in v1.01, 2025-11-15) | Combat (accuracy) |
| 5 | Steel Guard | 80 | 100 | 1 | 40 | 1.3 | 40 | 1.12e14 | VM I | +1 Defence per level | Combat (defence) |
| 6 | Evolving Talent | 75 | 200 | 1 | 90 | 1.18 | 90 | 3.75e17 | - | +1 Talent Point (tab 2, Warrior/Archer/Mage) per level | Talents tab 2 |
| 7 | Massive Whirl | 95 | 1 | 2 | 777 | 1.1 | 777 | 777 | - | Whirl is 2x as big and hits +2 more monsters | Warrior skill Whirl |
| 8 | Rapid Arrows | 97 | 1 | 1 | 777 | 1.1 | 777 | 777 | - | Piercing Arrow fires double arrows | Archer skill Piercing Arrow |
| 9 | Dual Fireballs | 99 | 1 | 1 | 777 | 1.1 | 777 | 777 | - | Fireball casts both directions | Mage skill Fireball |
| 10 | Weapon Craft | 115 | 5 | 10 | 170 | 7.5 | 170 | 6.35e05 | VM I | Crafted weapons +10% damage per level | Anvil-crafted weapons, damage |
| 11 | Carry Capacity | 130 | 100 | 5 | 200 | 1.35 | 200 | 9.14e15 | VM I | +5 carry capacity per slot per level | Inventory carry caps (all material types) |
| 12 | Baby on Board | 180 | 50 | 2 | 250 | 1.08 | 250 | 1.66e05 | VM I | +2% Class EXP for your lowest-level character per level | Class EXP (lowest char only) |
| 13 | Major Discount | 240 | 80 | 4 | 300 | 1.3 | 300 | 1.63e12 | - | All rows 0-32 cost 1/(1+4%/level) as much (80 levels: 4.2x cheaper) | Vault itself (rows 0-32 only) |
| 14 | Bored to Death | 280 | 10 | 5 | 300 | 4.5 | 300 | 3e08 | VM I | +5% coins per level per power of 10 of Bean kills (all chars, map 14) | Coins; fed by Bean kills |
| 15 | Knockout! | 330 | 5 | 1 | 1,000 | 6 | 1,000 | 1.56e06 | VM I | +1% total damage per level per Knockout on the 78-monster ladder | Combat (total dmg); fed by Knockouts |
| 16 | Stamp Bonanza | 370 | 100 | 2 | 500 | 1.2 | 500 | 2.46e11 | VM I | Sword/Heart/Target/Shield stamps (BaseDmg/HP/Acc/Def) x(1+2%/lvl) | Stamps |
| 17 | Mining Payday | 410 | 100 | 2 | 650 | 1.28 | 650 | 1.4e14 | VM I | +2% coins per level x log10(total ores mined) | Coins; fed by Mining |
| 18 | Drops for Days | 450 | 50 | 1 | 700 | 1.17 | 700 | 1.12e07 | VM I | +1% Drop Rate per level | Drop Rate |
| 19 | Happy Doggy | 480 | 100 | 2 | 800 | 1.25 | 800 | 1.76e13 | VM I | +2% Dog Happiness per level (no gameplay read found in N.js v1.23) | Unknown / none found |
| 20 | Slice N Dice | 550 | 100 | 2 | 900 | 1.1 | 900 | 1.36e08 | VM I | +2 base damage per level per power of 10 of Carrot kills (map 24) | Combat; fed by Carrot kills |
| 21 | Go Go Secret Owl | 600 | 100 | 5 | 400 | 1.1 | 400 | 6.74e07 | VM I | +5% Orion feathers/sec per level | Owl (Orion) |
| 22 | Boss Decimation | 630 | 25 | 1 | 1,150 | 1.12 | 1,150 | 1.56e05 | VM I | +1% boss damage per level | Bosses |
| 23 | Sleepy Time | 680 | 20 | 1 | 1,200 | 1.55 | 1,200 | 1.42e07 | VM I | +1% AFK gains (fighting and skilling) per level | AFK gains (all) |
| 24 | Production Revolution | 750 | 100 | 5 | 1,300 | 1.15 | 1,300 | 1.09e10 | VM I | +5% anvil production speed per level | Anvil production |
| 25 | Statue Bonanza | 810 | 50 | 2 | 1,500 | 1.28 | 1,500 | 1.27e09 | VM I | Power/Speed/Mining/Lumberbob statues x(1+2%/lvl) | Statues |
| 26 | Beeg Forge | 860 | 100 | 5 | 1,600 | 1.15 | 1,600 | 1.32e10 | VM I | +5% forge capacity per level | Forge |
| 27 | Stick Snapping | 900 | 50 | 1 | 1,800 | 1.13 | 1,800 | 6.37e06 | VM I | +1% total damage per level per power of 10 of Branch kills (map 13) | Combat; fed by Branch kills |
| 28 | Liquid Knowledge | 930 | 100 | 1 | 2,000 | 1.06 | 2,000 | 1.17e07 | VM I | +1% Alchemy EXP per level | Alchemy skill |
| 29 | Bug Knowledge | 950 | 100 | 1 | 2,100 | 1.06 | 2,100 | 1.23e07 | VM I | +1% Catching EXP per level | Catching skill |
| 30 | Fish Knowledge | 980 | 100 | 1 | 2,200 | 1.06 | 2,200 | 1.29e07 | VM I | +1% Fishing EXP per level | Fishing skill |
| 31 | Dirty Money | 1000 | 25 | 2 | 3,000 | 1.1 | 3,000 | 2.97e05 | VM I | +2% coins per level per power of 10 of Poop kills (map 8) | Coins; fed by Poop kills |
| 32 | Vault Mastery | 1050 | 50 | 1 | 1e04 | 1.65 | 1e04 | 1.16e15 | - | Blue rows (0-31 except 1,6-9,13) x(1+1%/lvl) | Vault itself |
| 33 | Storage Slots | 1100 | 24 | 1 | 5,000 | 4 | 5,000 | 4.71e17 | - | +1 Storage Chest slot per level | Storage |
| 34 | Recipe for Profit | 1140 | 50 | 1 | 8,000 | 1.35 | 8,000 | 7.55e10 | VM II | +1% coins per level per Taskboard recipe unlocked | Coins; fed by Tasks (Unlocks) |
| 35 | Schoolin' the Fish | 1210 | 20 | 1 | 1.5e04 | 1.5 | 1.5e04 | 9.98e07 | VM II | +1% Class EXP per level x log10(fish caught) | Class EXP; fed by Fishing |
| 36 | Straight to Storage | 1260 | 1 | 1 | 3e06 | 1.85 | 3e06 | 3e06 | - | AFK resources go straight to storage | Storage QoL |
| 37 | Bubble Money | 1320 | 10 | 1 | 3.6e04 | 1.7 | 3.6e04 | 1.03e07 | VM II | +1% coins per level per bubble level (each bubble counted to 100) | Coins; fed by Alchemy bubbles |
| 38 | Drip Drip Drip | 1400 | 20 | 5 | 5.5e04 | 1.35 | 5.5e04 | 6.34e07 | VM II | +5% liquid generation per level | Alchemy liquids |
| 39 | Active Learning | 1470 | 100 | 2 | 8.5e04 | 1.1 | 8.5e04 | 1.17e10 | VM II | Class EXP from kills while game is open x(1+2%/lvl) | Class EXP (active only) |
| 40 | Stunning Talent | 1540 | 100 | 1 | 1.2e05 | 1.14 | 1.2e05 | 4.21e11 | - | +1 Talent Point (tab 3, subclass) per level | Talents tab 3 |
| 41 | Bug Power En Masse | 1620 | 20 | 1 | 1.7e05 | 1.5 | 1.7e05 | 1.13e09 | VM II | +1% total damage per level x log10(bugs caught) | Combat; fed by Catching |
| 42 | Vial Overtune | 1700 | 3 | 10 | 2.45e05 | 25 | 2.45e05 | 1.59e08 | - | All vials x(1+10%/lvl) | Alchemy vials |
| 43 | Active Murdering | 1780 | 100 | 1 | 4e05 | 1.35 | 4e05 | 1.23e19 | - | Kills count x(1+1%/lvl) toward portals while game is open | Portals (active only) |
| 44 | Card Retirement | 1850 | 1 | 1 | 5e07 | 1 | 5e07 | 5e07 | - | Card Drop Rate cards become passive | Cards QoL |
| 45 | Go Go Secret Kangaroo Mouse | 1920 | 250 | 10 | 5.8e05 | 1.1 | 5.8e05 | 1.29e17 | VM II | +10% Bluefish for Poppy per level | Poppy (Kangaroo Mouse) |
| 46 | All Armoured Up | 2000 | 100 | 1 | 7e05 | 1.15 | 7e05 | 5.48e12 | VM II | All equipment DEF x(1+1%/lvl) | Combat (defence) |
| 47 | Daily Mailbox | 2080 | 10 | 1 | 1.1e06 | 2.5 | 1.1e06 | 6.99e09 | VM II | +1 Post Office box per day you play, per level | Post Office |
| 48 | Buildie Sheepie | 2160 | 20 | 2 | 1.5e06 | 1.65 | 1.5e06 | 5.16e10 | VM II | +2% construction speed per level per power of 10 of Sheepie kills (map 101) | Construction; fed by Sheepie kills |
| 49 | Quest KAPOW! | 2240 | 200 | 1 | 2.2e06 | 1.08 | 2.2e06 | 1.33e14 | - | Raises max LV of the Quest star talent to {bonus} | Star talents |
| 50 | Critters 'n Souls | 2320 | 300 | 1 | 3.5e06 | 1.06 | 3.5e06 | 2.28e15 | VM II | +1% Critters and Souls per level | Trapping, Worship |
| 51 | Slight Do-Over | 2400 | 20 | 1 | 5.5e06 | 2.1 | 5.5e06 | 1.39e13 | - | Refund one talent by holding it, {bonus} times per day | Talents QoL |
| 52 | Duplicate Entries | 2470 | 1 | 1 | 1e08 | 1 | 1e08 | 1e08 | - | Colosseum tickets received are doubled | Colosseum |
| 53 | Special Talent | 2530 | 150 | 1 | 1.5e07 | 1.08 | 1.5e07 | 1.93e13 | - | +1 Star Talent Point per level | Star talents |
| 54 | Kitchen Dream-mare | 2600 | 500 | 6 | 2.5e07 | 1.2 | 2.5e07 | 4.87e47 | VM II | Meal cooking speed x(1+6%/lvl) | Cooking (W4) |
| 55 | Lab Knowledge | 2700 | 100 | 1 | 4e07 | 1.1 | 4e07 | 5.51e12 | VM II | +1% Lab EXP per level | Lab (W4) |
| 56 | Foraging Forever | 2850 | 250 | 1 | 7e07 | 1.15 | 7e07 | 6.97e23 | VM II | +1% Foraging speed (breeding mobs) per level | Breeding spices (W4) |
| 57 | Teh TOM | 3000 | 500 | 2 | 1.12e08 | 1.25 | 1.12e08 | 1.28e57 | - | +2 Tome score per level | Tome (W4) |
| 58 | Pet Punchies | 3100 | 250 | 2 | 1.75e08 | 1.13 | 1.75e08 | 2.5e22 | VM II | +2% mob damage (pet battles) per level | Breeding fights (W4) |
| 59 | Breeding Knowledge | 3200 | 100 | 2 | 3e08 | 1.1 | 3e08 | 4.13e13 | VM II | +2% Breeding EXP per level | Breeding (W4) |
| 60 | Cooking Knowledge | 3300 | 500 | 2 | 6e08 | 1.14 | 6e08 | 1.21e38 | VM II | +2% Cooking EXP per level, accelerating past 25/50/100/200/300/400/450 and +20% per 25 levels | Cooking (W4) |
| 61 | Vault Mastery II | 3400 | 50 | 1 | 1.5e09 | 2 | 1.5e09 | 1.69e24 | - | Green rows (33-60 except QoL/simple ones) x(1+1%/lvl) | Vault itself |
| 62 | Speedy Sailing | 3800 | 100 | 1 | 1e10 | 1.33 | 1.1e10 | 8.09e22 | VM III | +1% sailing speed | Sailing (W5) |
| 63 | Artifact Find Chance | 3900 | 250 | 1 | 2.5e10 | 1.2 | 3.03e10 | 9.44e30 | VM III | +1% artifact find chance | Sailing (W5) |
| 64 | Skulltrick | 4050 | 100 | 1 | 4.5e10 | 1.33 | 5.99e10 | 4.41e23 | - | +1% kills count toward portals | Portals |
| 65 | Go Go Bubba the Seal | 4100 | 500 | 10 | 9e10 | 1.23 | 1.32e11 | 5.14e56 | VM III | Bubba meat slices x(1+10%/lvl) | Bubba the Seal (clicker) |
| 66 | Ocean Knowledge | 4300 | 100 | 1 | 1.5e11 | 1.33 | 2.42e11 | 1.78e24 | VM III | +1% Sailing EXP | Sailing (W5) |
| 67 | Sailing Loot | 4400 | 200 | 2 | 3e11 | 1.25 | 5.31e11 | 5.12e31 | VM III | +2% chest treasure | Sailing (W5) |
| 68 | Mega Bits | 4500 | 300 | 5 | 5.5e11 | 1.22 | 1.07e12 | 3.94e38 | VM III | Bits x(1+5%/lvl) | Gaming (W5) |
| 69 | Gamer Knowledge | 4650 | 100 | 1 | 8.5e11 | 1.33 | 1.82e12 | 1.34e25 | VM III | +1% Gaming EXP | Gaming (W5) |
| 70 | Collection Cashout | 4750 | 20 | 1 | 1.2e12 | 4 | 2.83e12 | 1.04e24 | - | +1% coins per card found | Coins; fed by Cards |
| 71 | Divinity Points | 4800 | 100 | 2 | 4.6e12 | 1.33 | 1.19e13 | 8.78e25 | VM III | +2% Divinity points | Divinity (W5) |
| 72 | Divine Knowledge | 4900 | 100 | 1 | 7.5e12 | 1.35 | 2.14e13 | 6.6e26 | VM III | +1% Divinity EXP | Divinity (W5) |
| 73 | Smarter Villagers | 5000 | 50 | 1 | 9e12 | 3.15 | 2.82e13 | 1.08e38 | - | +1% villager EXP | Hole villagers (W5) |
| 74 | Super Slab | 5100 | 20 | 1 | 1.5e13 | 15 | 5.18e13 | 1.23e36 | - | Slab bonuses x(1+1%/lvl) | Slab (W5) |
| 75 | Better Captains | 5200 | 100 | 1 | 2.5e13 | 1.35 | 9.49e13 | 2.93e27 | VM III | +1% captain EXP | Sailing (W5) |
| 76 | Big Blessings | 5300 | 30 | 1 | 4.5e13 | 3.5 | 1.88e14 | 1.58e30 | - | +1 Blessing max LV | Divinity (W5) |
| 77 | Farming Knowledge | 5700 | 100 | 1 | 1e14 | 1.33 | 4.59e14 | 3.38e27 | VM III | +1% Farming EXP | Farming (W6) |
| 78 | Croppius Evolvius | 5800 | 250 | 8 | 2.2e14 | 1.23 | 1.11e15 | 1.45e38 | VM III | Crop evo chance x(1+8%/lvl) | Farming (W6) |
| 79 | Properly Funded Research | 5900 | 10 | 1 | 4.5e14 | 40 | 2.5e15 | 6.73e29 | - | +1% Crop Depot bonuses | Farming (W6) |
| 80 | Raw Damage | 6000 | 500 | 2 | 2e15 | 1.5 | 1.22e16 | 2.72e104 | VM III | +2% damage (additive) | Combat |
| 81 | Finders Keepers | 6200 | 250 | 1 | 6.5e15 | 1.22 | 4.37e16 | 7.73e38 | VM III | +1% Jade | Sneaking (W6) |
| 82 | Sneaking Knowledge | 6400 | 100 | 1 | 1.5e16 | 1.3 | 1.11e17 | 9.17e28 | VM III | +1% Sneaking EXP | Sneaking (W6) |
| 83 | White Essentials | 6500 | 200 | 1 | 6.5e16 | 1.2 | 5.29e17 | 1.81e34 | VM III | +1% White Essence | Summoning (W6) |
| 84 | Summoning Knowledge | 6750 | 100 | 1 | 3e17 | 1.3 | 2.69e18 | 2.22e30 | VM III | +1% Summoning EXP | Summoning (W6) |
| 85 | Bigger Better Beans | 6900 | 50 | 2 | 2.5e18 | 2.5 | 2.46e19 | 1.3e39 | - | +2% Magic Beans | Night Market (W6) |
| 86 | 24 Karat Foods | 7000 | 50 | 1 | 4e19 | 4 | 4.33e20 | 1.83e50 | - | +1% Golden Food bonuses | Golden Food |
| 87 | Rest of the Essentials | 7100 | 200 | 1 | 2e20 | 1.2 | 2.38e21 | 8.17e37 | VM III | +1% other Essences | Summoning (W6) |
| 88 | Topheavy Charms | 7300 | 100 | 1 | 5e21 | 1.3 | 6.55e22 | 5.42e34 | - | +1 max LV for Sneaking Charms | Sneaking (W6) |
| 89 | Vault Mastery III | 7500 | 50 | 1 | 1.5e22 | 3.25 | 2.16e23 | 3.78e48 | - | Red rows (62-88 except simple ones) x(1+1%/lvl) | Vault itself |

### Coin cost curve

Rows' costs grow geometrically by `x2` per level, plus a linear term, so each row has a cheap head and an effectively infinite tail. Rows with `x2 <= 1.06` (Bigger Damage 1.025, Monster Tax 1.05, Liquid/Bug/Fish Knowledge 1.06) stay cheap the longest. Rows with `x2 >= 1.3` get steep within 20-40 levels (H, game data).

Cumulative raw cost (before discounts) to reach selected levels (M, computed from the game formula):

| Row | 25 | 50 | 100 | 200 | 300 | 500 |
|---|---|---|---|---|---|---|
| 0 Bigger Damage | 1.0K | 4.9K | 37.9K | 954K | 17.7M | 4.3B |
| 2 Monster Tax | - | 10.4K | 239K | 65.4M | 13.1B | 385T |
| 1 Natural Talent | 7.1K | 408K | 832M | 1.9e15 | - | - |
| 3 Wicked Smart | 16.5K | 2.7M | 45.1B | - | - | - |
| 4 Bullseye | 9.5K | 488K | 919M | 2.0e15 | - | - |
| 6 Evolving Talent | 37.6K | 2.9M | 15.7B | - | - | - |
| 13 Major Discount | 10: 13.1K, 20: 199K, 40: 40.4M, 60: 8.1B, 80: 1.63T | | | | | |
| 32 Vault Mastery | 10: 2.3M, 20: 345M, 30: 51.6B, 40: 7.7T, 50: 1.16e15 | | | | | |

Cheapest-first total (M, simulation: always buy the cheapest visible level, Major Discount applied, no W7 discounts). This is a floor on the coins needed to reach a total Vault level, and so on each unlock:

| Total Vault levels | Coins spent (floor) | What it unlocks around there |
|---|---|---|
| 25 | ~530 | Scripticus class-quest step "Buy Upgrades: 25" |
| 100 | ~6.2K | the three 777-coin class skill rows (95-99) |
| 250 | ~66K | Major Discount (240) |
| 500 | ~550K | Drops for Days (450), Happy Doggy (480) |
| 1,000 | ~4.6M | Dirty Money (1000), then Vault Mastery (1050) |
| 1,260 | ~10.6M | Straight to Storage |
| 1,724 | ~71M | (W2 fixture level) Vial Overtune (1700) |
| 1,850 | ~117M | Card Retirement |
| 2,497 | ~2.1B | (W3 fixture level) Duplicate Entries (2470) |
| 2,530 | ~2.4B | Special Talent |
| 3,400 | ~126B | Vault Mastery II |
| 4,000 | ~2.0T | W5 rows (Sailing, Gaming) |
| 5,000 | ~270T | Smarter Villagers and W5 Hole rows |

- **Goals and Milestones:**

| Milestone | Threshold | Why it matters | Confidence / source |
|---|---|---|---|
| Scripticus quest step | 25 total Vault levels | Needed to finish "Warrior, Archer or Mage?" (Scripticus8) | H, N.js `Buy_Upgrades:25` @15318113, progress = `VaultUpgTotal` @4963944 |
| Class skill rows | totals 95 / 97 / 99, 777 coins each | One-off skill upgrades for Warrior, Archer, Mage | H |
| Major Discount online | 240 total | Every later row 0-32 level gets cheaper | H |
| Major Discount 20 / 40 / 80 | 1.8x / 2.6x / 4.2x cheaper | Pays for itself fast on rows 0-32 | H |
| Knockout! row unlocked | 330 total | Starts the Knockout ladder (78 targets, mushG to w6d3) | H, `RANDOlist[104]`, TB `randomList.json` |
| Each Knockout | +row-15 bonus % total damage, per KO | Permanent damage; needs Knockout! at level 1 or more to progress | H, N.js @5245726 |
| Kill rows' steps | 10, 100, 1K, 10K, 100K, 1M ... kills on Bean (14), Carrot (24), Branch (13), Poop (8), Sheepie (101), summed over characters | Bonus steps only at each power of 10 | H, `VaultKillzTotal` |
| Bigger Damage 25 / 50 / 100 | per-level gain rises to 2, 3, 4 per level | The cheapest damage row gets better as it grows | H |
| Vault Mastery | 1,050 total, up to +50% (60 with bundle) on the blue rows | Multiplies most W1-W3 rows | H |
| Straight to Storage | 1,260 total, 3M | AFK resources go straight to storage | H |
| Card Retirement | 1,850 total, 50M | Card Drop Rate cards become passive, which frees card slots | H |
| Duplicate Entries | 2,470 total, 100M | Doubles Colosseum tickets received; hold ticket items until then | H, community advice in the W1 guide dossier |
| Vault Mastery II | 3,400 total | +50% on green rows 33-60 (W2-W4 systems) | H |
| Cooking Knowledge 25/50/100/200... | accelerating, +20% per 25 levels | W4 cooking EXP | H |

- **Feeds / fed by:**

  - **Fed by:**
    - **Coins** from AFK and active fighting: the only currency.
    - **Kill counts** on Valley of the Beans, Vegetable Patch, The Base of the Bark, Poopy Sewers (W1) and Steep Sheep Ledge (W3), from all characters. These are also Death Note and portal kills.
    - **Mining** (ores mined), **Fishing** (fish caught), **Catching** (bugs caught).
    - **Tasks / Taskboard Unlocks** (recipes unlocked), **Alchemy bubbles** (levels to 100), **Cards** (cards found).
    - **Knockouts**, which are active play.
    - **W7 sources** cut costs and raise max LVs: the Darts minigame, the Cryosnake pet, the Sushi Station, Glimbo trades, Research grid square 169, event shop item 40. So does the Pot Of Gold Pack (gem shop real-money bundle).
  - **Feeds:**
    - **Combat:** damage, accuracy, defence, boss damage, total damage %, crafted weapons.
    - **Coins:** a large share of the early MonsterCash additive pool. Monster Tax, Bored to Death, Mining Payday, Dirty Money, Recipe for Profit, Bubble Money and Collection Cashout all add in one sum (N.js @4045507).
    - **Class EXP** (Wicked Smart, Baby on Board, Schoolin' the Fish, Active Learning) and **Talents:** tab 1/2/3 points, Star Talent points, the Quest star talent max LV, daily talent refunds.
    - **W1 systems:** Stamps (Sword, Heart, Target, Shield), Statues (Power, Speed, Mining, Lumberbob), Anvil production, Forge capacity, Orion the Owl feathers, carry capacity (Toolbox `parsers/misc.ts#L1193`).
    - **W2 systems:** Alchemy EXP, liquids and vials; Catching and Fishing EXP; Poppy bluefish; Post Office boxes; Colosseum tickets.
    - **W3 systems:** Construction speed, Critters and Souls (Trapping and Worship), Storage slots.
    - **W4-W6 systems:** Cooking, Lab, Breeding, Tome, Sailing, Gaming, Divinity, Hole villagers, Farming, Sneaking, Summoning.
    - **Portal speed** while the game is open.
    - **Tome:** "Vault Upgrade bonus LV" is a Tome entry (N.js Tome list @14289527, M on what it measures).

- **Per-session actions:**

  1. **Spend coins on the vault every session** on the character holding them (each character's coins are separate unless the shared-money toggle is on). Check against the cheapest visible level: if the current character's coins exceed that cost, the vault is "Stale" (coins idle).
  2. **Priority inside a session:** first the newly unlocked one-off rows, then levels on the engine rows (Major Discount, Vault Mastery, coin rows), then cheap capped rows to max, then cheapest-first levels to reach the next unlock threshold. The in-game row text "Upgrade N more bonuses to unlock this..." shows the gap (N.js @11886900).
  3. **Do Knockouts when you can.** Unequip your weapon, go to the map of the current ladder target (shown in the Knockout! row as "Current Target"), and one-shot it. Each success is a permanent +bonus% damage. It only advances while Knockout! is level 1 or more.
  4. **Budget against the other coin sinks.** Stamps, bribes, Alchemy P2W, Town shop items and upgrade stones also need coins. Community advice is to spread spending and buy the coin multipliers early so the vault pays for itself (Reddit 2025-02-04, 2025-10-28).
  5. **Capped / idle states:** a row is done at `level >= maxLevel`. The vault as a whole is idle only when every visible row is maxed or unaffordable. The next unlock is `account.upgradeVault.nextUnlock`.

- **AFK Setup implications:**

  - **AFK fighting on your best coin-per-hour map** is what feeds the vault. Vault coin rows (Monster Tax and the scaled coin rows) raise the value of every fighting AFK Stretch.
  - **Kill-scaled rows reward kills on five specific maps, but only at each power of 10.** Parking a character on Bean, Carrot, Branch or Poop is worth it only to cross the next power of 10 cheaply (e.g. 9K to 10K), not as a steady AFK Setup. Community advice: this is "very candyable", so use Time Candy instead of AFK hours, and late-game Death Note and Death Bringer pushes cover it anyway (Reddit 2025-09-23, L).
  - **Skill-scaled rows (Mining Payday, Schoolin' the Fish, Bug Power en Masse) use log10 of lifetime totals.** They grow slowly. The in-game hint for Mining Payday is "Go do the mining on your 2nd player!" (game text). Normal skilling AFK feeds them; no dedicated setup is needed.
  - **Active-only rows:** Active Learning (Class EXP from kills) and Active Murdering (portal progress) only apply "while the game is open". Knockouts are active only. They favour active pushing in Play Sessions over AFK.
  - **Sleepy Time** (+1% AFK gains per level, max 20; 14.2M raw to max) raises every AFK Stretch. Buy it early in W2.

- **Min-max by stage (Spend Plan):**

  **Rules that hold at every stage (M, from the formulas; consistent with L community advice):**
  1. Every level is +1 toward the next unlock. When nothing high-value is affordable, buy the cheapest visible level.
  2. Engine rows first: Major Discount (rows 0-32 cost), Vault Mastery I/II (multiplies blue/green rows), and coin rows (more coins for everything).
  3. Buy one-off rows on unlock. They are cheap next to their effect.
  4. Max cheap capped rows: their whole cost is small.
  5. Buy combat rows when a wall needs them: Bullseye when accuracy is short (accuracy is "the #1 barrier between World 1 and World 6", Visme ebook 2025-09-23), Steel Guard and All Armoured Up when monsters hurt.
  6. Do not deep-level rows with no gameplay read (Happy Doggy) or with steep tails you do not need yet (Carry Capacity's 1.35x tail; Natural Talent and Bullseye past ~100).

  **Early W1 (total 0 to ~350, first characters, Blunder Hills maps 1-8)**

| Order | Row | Target | Why |
|---|---|---|---|
| 1 | Bigger Damage (0), Monster Tax (2), Natural Talent (1) | even levels to 25 total | Scripticus quest needs 25 levels; cheapest damage and coins; tab-1 points |
| 2 | Wicked Smart (3), Bullseye (4) | 20-40 each | Class EXP (talent points); accuracy for map walls |
| 3 | Massive Whirl (7), Rapid Arrows (8), Dual Fireballs (9) | buy all at 95-99 total | 777 coins each; skill upgrades per class; +3 unlock fuel |
| 4 | Evolving Talent (6), Steel Guard (5) | 10-25 | Tab-2 points once you have a class; defence |
| 5 | Weapon Craft (10) | max 5 (635K raw) | +50% crafted weapon damage; the Anvil works from anywhere since v2.27 |
| 6 | Baby on Board (12) | max 50 (166K raw) | +100% Class EXP for the lowest-level character; huge when making new characters |
| 7 | Major Discount (13) | 20 at once (199K raw), then keep it about 1/3 of your spend | Up to 4.2x cheaper rows 0-32 |
| 8 | Bored to Death (14) | 3-5 levels (8K-160K raw) | +5%/lvl coins per power of 10 of Bean kills |
| 9 | Knockout! (15) | 1 level at once, then 5 (1.56M raw) | Start the Knockout ladder |

  **Mid W1 to early W2 (total ~350 to ~1,100)**

| Order | Row | Target | Why |
|---|---|---|---|
| 1 | Monster Tax (2), Bigger Damage (0) | keep levelling (both stay cheap to 200+) | Coins and damage; both blue rows |
| 2 | Boss Decimation (22) | max 25 (156K raw) | Amarok and the W1/W2 bosses |
| 3 | Sleepy Time (23) | max 20 (14.2M raw) | +20% AFK gains, more with Vault Mastery |
| 4 | Drops for Days (18) | max 50 (11.2M raw) | +50% Drop Rate |
| 5 | Dirty Money (31) | max 25 (297K raw) | +50% coins per power of 10 of Poop kills |
| 6 | Stamp Bonanza (16), Statue Bonanza (25) | 25 each | Multiply the stamp and statue bonuses you already have |
| 7 | Go Go Secret Owl (21), Production Revolution (24), Beeg Forge (26) | 25-50 | W1 Owl, anvil and forge throughput |
| 8 | Slice N Dice (20), Stick Snapping (27), Mining Payday (17) | 25-50 | Kill and ore-scaled damage and coins |
| 9 | Liquid, Bug and Fish Knowledge (28-30) | 50 each when you start W2 skills (592K raw each) | Cheap 1.06x rows; W2 skill EXP |
| 10 | Vault Mastery (32) | 10 at once (2.3M raw), 20 when affordable | x1.1 to x1.2 on every blue row |

  **Late W2 (total ~1,100 to ~1,900)**

| Order | Row | Target | Why |
|---|---|---|---|
| 1 | Straight to Storage (36) | buy at 1,260 (3M) | AFK QoL, inventory |
| 2 | Bubble Money (37) | max 10 (10.3M raw) | +10% coins per bubble level (bubbles to 100 each); one of the largest W2 coin rows |
| 3 | Recipe for Profit (34) | 10-20 (437K-9.2M raw) | +1%/lvl coins per Taskboard recipe unlocked |
| 4 | Storage Slots (33) | 3-5 (105K-1.7M raw) | +1 chest slot each; the 4x tail gets steep |
| 5 | Drip Drip Drip (38) | 10-20 | Alchemy liquid; liquids gate bubble upgrades |
| 6 | Schoolin' the Fish (35), Active Learning (39) | 10 / 25 | Class EXP |
| 7 | Stunning Talent (40) | 25 | Tab-3 (subclass) points, once you have subclasses |
| 8 | Vial Overtune (42) | 1-2 (245K / 6.4M raw) | x1.1 / x1.2 all vials; the 3rd level is 159M |
| 9 | Active Murdering (43) | 10-25 | Faster portals while active |
| 10 | Card Retirement (44) | buy at 1,850 (50M) | Passive Card Drop Rate cards |
| 11 | Bug Power en Masse (41) | 5-10 | Total damage, log10 of bugs caught |

  **W3 (total ~1,900 to ~2,600)**

| Order | Row | Target | Why |
|---|---|---|---|
| 1 | Duplicate Entries (52) | buy at 2,470 (100M) | Doubles Colosseum tickets; do not redeem ticket items before you own it |
| 2 | Buildie Sheepie (48) | 5-10 (26M-343M raw) | Construction speed per power of 10 of Sheepie kills; W3's main bottleneck |
| 3 | Critters 'n Souls (50) | 25-50 | Trapping and Worship (W3) |
| 4 | All Armoured Up (46) | 25 (149M raw) | x1.25 equipment DEF for W3 defence walls |
| 5 | Go Go Secret Kangaroo Mouse (45) | 25 | Poppy bluefish (W2 clicker) |
| 6 | Daily Mailbox (47) | 3-5 (11M-71M raw) | +3 to +5 Post Office boxes per day |
| 7 | Quest KAPOW! (49) | 25-50 | Raises the Quest star talent's max LV |
| 8 | Slight Do-Over (51) | 1-3 | Daily single-talent refunds (also resets that talent's Super point, v1.03) |
| 9 | Special Talent (53) | at 2,530 | Star Talent points |
| 10 | Vault Mastery (32) | push toward 30 (51.6B raw) when rich | Late-W3 coin income can carry it |

  **W4 outline (total ~2,600 to ~3,400+)**

- New rows target W4 systems: Kitchen Dream-mare (54, cooking speed), Lab Knowledge (55), Foraging Forever (56) and Pet Punchies (58, breeding spices and fights), Teh TOM (57, Tome score), Breeding Knowledge (59), and Cooking Knowledge (60). Cooking Knowledge accelerates with level; a community member said cooking 100 is impractical without it (Reddit 2025-10-28, L).
- Goal: Vault Mastery II at 3,400 (about 126B coins of cheapest-first spending; M). It multiplies rows 33-60 (except the simple ones) by up to x1.5.
- W5-W6 rows (62-89) cost `1.1^(row-61)` more and get no Major Discount. They are out of reach in W4. Smarter Villagers (73) opens a village teleport that players used to reach W5 town early (Reddit 2026-04-25, 2026-05-08, L; Lava reportedly called it a "pro gamer move").

  **Per class**

- Warrior: Massive Whirl. Archer: Rapid Arrows. Mage: Dual Fireballs. They are cheap enough to buy all three for the unlock fuel anyway.
- Bullseye's hint names each class's accuracy stat: Warrior WIS, Archer STR, Mage AGI; Beginners are told to get a class (game text, H).
- Evolving Talent only helps characters with a class (tab 2). Stunning Talent only helps characters with a subclass (tab 3).
- Baby on Board only boosts the single lowest-level character. Its value peaks while you level new slots.

- **Common mistakes (and how to detect them from the save):**

| Mistake | Detect from Account State |
|---|---|
| Hoarding coins while vault levels are affordable | Some visible row (`upgrades[i].unlocked`, `level < maxLevel`) has `cost` below the current or richest character's `characters[].money` |
| Skipping Major Discount | `upgrades[13].level` low (under ~20) while `totalUpgradeLevels > 400` |
| Never starting the Knockout ladder | `upgrades[15].level >= 1` but `accountOptions[338]` (ladder progress) is 0 or stalled; or `upgrades[15].level == 0` with total >= 330 |
| Missing one-off rows | `upgrades[36]`, `[44]` or `[52]` `.level == 0` while the row is unlocked and affordable |
| Redeeming Colosseum tickets before Duplicate Entries | `upgrades[52].level == 0` and Colosseum ticket count is being spent (cross-check `account.currencies.ColosseumTickets`) |
| Levelling Happy Doggy deep | `upgrades[19].level` high (no gameplay read found) |
| Assuming Major Discount helps Vault II/III rows | Advice only; Major Discount affects rows 0-32 |
| Parking characters on kill maps forever | `vaultTotalKills[0..3]` and `[10]` far past a power of 10 with no next step near; better spent with candy |
| Leaving Vault Mastery at 0 after 1,050 total | `upgrades[32].level == 0` and `totalUpgradeLevels >= 1050` |
| Thinking the vault "disappeared" (W3-era reports) | Reddit 2025-04 and 2025-06 report a vault-hidden bug; check for the Codex Quik Ref entry (L) |

- **Save and Toolbox fields:**

  - **Raw save:**
    - `UpgVault`: a 100-slot list of levels; slots past 89 are unused (N.js save entry @6494512 and init @6290886, H).
    - `OptionsListAccount[330]`: set to 0.1 on first purchase (`330 + x3`, and every row's x3 is 0).
    - `OptionsListAccount[338]`: Knockout ladder progress. `[340]` ores mined, `[345]` fish caught, `[346]` bugs caught. `[437]` the Darts vault-discount upgrade.
    - `BundlesReceived.bon_u`: Pot Of Gold Pack.
    - `Research[12]`: Glimbo trades.
    - `Money_<i>` per character and `MoneyBANK`.
    - `KillsLeft2Advance` per character, `Tasks[3]`, `CauldronInfo` (H).
  - **Toolbox parsed (`account.upgradeVault`, built in TB `parsers/index.ts#L364`):**
    - `upgrades[]`: `name`, `x1`, `x2`, `x5`, `unlockLevel`, `maxLevel` (with bundle and Glimbo), `level`, `unlocked`, `cost` (next level, with all discounts), `costToMax`, `bonus` (with Mastery), `description` (placeholders resolved).
    - `totalUpgradeLevels`, `nextUnlock` (the first locked row), `vaultTotalKills` (the 12-slot `VaultKillzTOT` array above), `costReduction` (`totalMulti`, `cheaperFactor`, `breakdown`) (TB `parsers/misc/upgradeVault.ts#L14-L63`).
    - Other consumers read `getUpgradeVaultBonus(upgrades, i)`: `parsers/character.ts` (25 call sites), `damage.ts` (10), and the stamps, statues, owl, alchemy, kangaroo, anvil, forge, cooking, breeding, tome, sailing, gaming, divinity, farming, summoning and sneaking parsers (H, grep).
  - **Related fields:** `account.accountOptions[338|340|345|346|437]`, `account.currencies.money / rawMoney / bankMoney`, `characters[].money`, `characters[].kills[mapIndex]`.
  - **Toolbox gaps:**
    - No dashboard alert for idle coins vs vault cost, for Knockout progress, or for missing one-off rows (`utility/dashboard/*` has no vault logic, H). ActiveOn has to supply these.
    - `unlocked` uses the per-row threshold, not the game's count rule (rows 5/6 at totals 75-79).
    - The `vaultTotalKills[8]` comment says "completed tasks" but the value is Taskboard recipes unlocked (same array).
    - Toolbox's own test `__test__/parsers/live-verified-upgrade-vault.test.js` exists for live verification (not run here).

- **Sources:** see the consolidated list below. Every game-data claim was verified on v1.23 (N.js Last-Modified 2026-10-17) and Toolbox `6827d3f` (2026-10-17). Wiki and community claims carry their own dates; none is newer than v1.22. Nothing here was verified only on an older patch, except the community priority advice (2025-02 to 2026-09, Stale-risk L).

### Sources

1. Game client N.js v1.23, `https://www.legendsofidleon.com/ytGl5oc/N.js` (Last-Modified 2026-10-17). Symbols and offsets:
   - `na.UpgradeVault` @14230753 (the 90-row table)
   - `"VaultUpgCost"` @10879556, `"VaultUpgUNLOCKED"` @10880927, `"VaultUpgMaxLV"` @10881366, `"VaultUpgTotal"` @10882668, `"VaultUpgBonus"` @10883139, `"VaultKillzTotal"` @10885406
   - purchase handler in `ActorEvents_670._event_OwlEvent` (MenuType2 72) @11736470 to 11737900 and @11884587
   - save entry `addSaveEntryList("UpgVault")` @6494512
   - MonsterCash coin pool @4045507; damage pool with Knockout and Stick Snapping @4107477; Knockout progression @5245726
   - Knockout hint @11889561; Scripticus8 quest "Buy_Upgrades:25" @15318113 and its progress @4963944
   - `DartsUpgCost` @10951781 and the Darts shop text @12891777; Cryosnake `snakeB` pet @14269198
   - bundle `bon_u` text @14912615; `getLOG` @4455448; Lava dialogue @20944832
2. IdleonToolbox @ `6827d3f` (2026-10-17):
   - [parsers/misc/upgradeVault.ts](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc/upgradeVault.ts#L14-L322): `getUpgradeVault` L14, `parseUpgradeVault` L19-L63 (unlocked at L35), `getVaultCostReduction` L68, `getVaultUpgMaxLevel` L157, `getUpgradeCost` L190, `calcUpgradeVaultBonus` L207, `getVaultTotalKills` L269
   - [data/website-data/shared-data.json#L49465](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/shared-data.json#L49465) (`upgradeVault`)
   - [parsers/index.ts#L364](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/index.ts#L364)
   - [parsers/tasks.ts#L82](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/tasks.ts#L82)
   - [parsers/misc.ts#L1193](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L1193)
   - [parsers/class-specific/grimoire.ts#L148](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/class-specific/grimoire.ts#L148) (Knockout ladder target)
   - `data/website-data/randomList.json` (list 104, 78 Knockout targets), `data/website-data/companions.json` (index 99 Cryosnake), [pages/account/misc/upgrade-vault.jsx](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/pages/account/misc/upgrade-vault.jsx)
3. Wiki:
   - [Upgrade_Vault](https://idleon.wiki/wiki/Upgrade_Vault): bot-drawn from game data, last revision 2026-10-07 by BigCoight (before v1.23; content matches v1.23 data). Notes page [Data:Upgrade_Vault_Notes](https://idleon.wiki/wiki/Data:Upgrade_Vault_Notes) rev 2026-10-12.
   - [Changelog/2025](https://idleon.wiki/wiki/Changelog/2025): v2.27 2025-02-03, v2.28 2025-02-08, v2.29 2025-02-15, v1.01 2025-11-15, v1.03 2025-11-29.
   - [Changelog/2026](https://idleon.wiki/wiki/Changelog/2026): v1.07 2026-03-06, v1.08 2026-03-13 (shown as 2025, a typo), v1.10 2026-03-29.
   - [Gem_Shop](https://idleon.wiki/wiki/Gem_Shop): Pot Of Gold Pack (rev 2026-10-14 per the gem-shop dossier).
4. Steam patch notes, IdleOn news ([store.steampowered.com/news/app/1476970](https://store.steampowered.com/news/app/1476970)), scraped 2026-10-17: vault mentions on 2025-02-03, 2025-02-15, 2025-11-15, 2025-11-29, 2026-03-13, 2026-03-29. None in v1.22 (2026-09-18) or v1.23 (2026-10-16).
5. Community (tier 3, L):
   - Visme ebook "Idleon Academy: The beginning" by Nekow, 2025-09-23 ([link](https://my.visme.co/view/dwonr73g-idleon-academy-the-beginning)): "Prioritize Accuracy nodes in the Vault early", "Don't hoard your money, dump it into the Vault".
   - "Idleon Incomplete Guide" by shadowstorm2204 (undated, post-W7) ([htmlview](https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview)), W1 tab: "Vault is one of the strongest mechanic's in the game ... DONT IGNORE VAULT!!!"; W4 tab: "spend your coins on vault upgrades".
   - Reddit r/idleon:
     - [1oi1usb](https://www.reddit.com/r/idleon/comments/1oi1usb/) 2025-10-28: "focus on the money things inside the vault first" ([nlsggl1](https://www.reddit.com/r/idleon/comments/1oi1usb/comment/nlsggl1/)); buy enough to reach the QoL rows ([nlsdduw](https://www.reddit.com/r/idleon/comments/1oi1usb/comment/nlsdduw/), whose claim that "25 upgrades" means talent points is contradicted by N.js); cooking 100 needs Cooking Knowledge.
     - [1ihsy7j](https://www.reddit.com/r/idleon/comments/1ihsy7j/) 2025-02-04: spread spending, buy the coin multipliers, Major Discount and Vault Mastery are "meta" ([mazxsly](https://www.reddit.com/r/idleon/comments/1ihsy7j/comment/mazxsly/)).
     - [1notjfh](https://www.reddit.com/r/idleon/comments/1notjfh/) 2025-09-23: kill-map parking is "very candyable" ([nfuzloh](https://www.reddit.com/r/idleon/comments/1notjfh/comment/nfuzloh/)), little gain past 1B ([nfu8aln](https://www.reddit.com/r/idleon/comments/1notjfh/comment/nfu8aln/)).
     - [1svbcj5](https://www.reddit.com/r/idleon/comments/1svbcj5/) 2026-04-25 and [1t70ri1](https://www.reddit.com/r/idleon/comments/1t70ri1/) 2026-05-08: the Smarter Villagers teleport into W5.
     - [1lcnusb](https://www.reddit.com/r/idleon/comments/1lcnusb/) 2025-06-16 and [1jyaxsa](https://www.reddit.com/r/idleon/comments/1jyaxsa/) 2025-04-13: the vault-disappearing reports.
     - Arctic Shift comment searches for "major discount", "monster tax" and "vault" in 2025-2026 windows failed on rate limits on 2026-10-17. No newer priority list was found.
6. Fixtures (read only, aggregates only): `fixtures/private/yasser.parsed.json` (W2 account: 1,724 total levels) and `joseph.parsed.json` (W3 account: 2,497 total levels); raw `UpgVault` is a 100-slot list in both.
7. Computations: `aw-tmp/vault_costs.py`, `vault_greedy.py` and `vault_table.py` in the research scratchpad (formulas copied from N.js `VaultUpgCost` / `VaultUpgBonus`).
