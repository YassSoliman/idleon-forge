# Upgrade Vault (dossier, M26)

Verified 2026-10-19 against Toolbox pin `6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1` (game 2.3.540). `V` = `packages/toolbox-parsers/vendor/`. `UV` = `V/parsers/misc/upgradeVault.ts`. Tiers: 1 game data/Toolbox code, 2 Toolbox logic/wiki-bot-from-data, 3 wiki, 4 community. Confidence H/M/L. Every claim now carries a confidence (H/M/L) after its tier. Revised 2026-10-19 after two adversarial verdict sets (source lens, game-data lens): no claim was refuted by both lenses, so none was removed; four claims carried corrections and are marked **Disputed/Corrected** (C2, C5, C7, C34); unverifiable external claims are L. Prior research (`origin/research/account-wide:docs/research/systems/account-wide/upgrade-vault.md`, 2026-10-17, game v1.23 N.js, Toolbox 6827d3f) was re-checked: the 90-row table in the pinned `V/data/website-data/shared-data.json` (`upgradeVault`) matches it on every unlock, max LV, x1, x2, x5 value (script-compared 2026-10-19). Client-side N.js claims in the prior are carried as tier 1 with "(prior)" because the pinned Toolbox code reproduces them.

## Upgrade Vault

- **What it is:** An account-wide coin sink in the Codex. 90 permanent upgrades ("rows") are bought with coins; each row unlocks when the account's total Vault levels reach its threshold. Rows boost combat, coins, Class EXP, talent points and W1-W6 systems. [C1][C2]
- **Unlocks:** Open from the start of the game (Codex, Quik Ref tab, plus a HUD button). No row is gated by kills, quests or world progress; the only gate is total Vault levels. The Scripticus class quest step "Buy Upgrades: 25" reads total Vault levels. Vault I (rows 0-32) shipped v2.27 2025-02-03; Vault II (33-61) v2.29 2025-02-15; Vault III (62-89) v1.08 2026-03-13. [C3][C4][C5][C6]
- **Scope:** Account-wide: one `UpgVault` level list applies to every character. Exceptions: Baby on Board boosts only the strictly-lowest-level character and only when the Merit-shop lowest-level upgrade level is above 0 (ties give nobody the bonus); Evolving Talent (tab 2) and Stunning Talent (tab 3) only help characters with a class or subclass; the three 777-coin rows change one class's skill. Coins are paid from the character you are playing (per-character `Money_<i>`); ActiveOn's spend reader also treats the Bank (`MoneyBANK`) as a wallet holder. [C7][C8][C84]
- **Inputs -> outputs:** Input is coins only. Output is a per-row bonus `level * x5` (plus Vault Mastery multipliers and a few special curves) that feeds damage, coins, EXP, talents and many system parsers (see Mechanics catalogue). Kill counts and skill totals scale seven rows but never unlock anything. [C9][C10][C11]
- **Goals and Milestones:**

| Milestone | Threshold (total Vault levels) | Note | Claim |
|---|---|---|---|
| Scripticus quest step | 25 | quest gate | [C6] |
| Natural Talent / Monster Tax unlock | 7 / 13 | first non-damage rows | [C12] |
| Wicked Smart / Bullseye | 42 / 49 | | [C12] |
| Class skill rows (Whirl, Arrows, Fireball) | 95 / 97 / 99 (777 coins each) | one-offs | [C12] |
| Weapon Craft / Carry Capacity / Baby on Board | 115 / 130 / 180 | | [C12] |
| Major Discount | 240 | cheaper rows 0-32 | [C13] |
| Knockout! | 330 | starts the 78-target ladder | [C14] |
| Sleepy Time | 680 | +AFK gains | [C12] |
| Dirty Money / Vault Mastery | 1000 / 1050 | | [C12] |
| Storage Slots / Straight to Storage | 1100 / 1260 | | [C12] |
| Card Retirement | 1850 | passive Card Drop Rate cards | [C12] |
| Duplicate Entries | 2470 | double Colosseum tickets | [C12] |
| Special Talent | 2530 | Star Talent points | [C12] |
| W4 rows (Kitchen, Lab, Foraging, Tome, Breeding, Cooking) | 2600-3300 | | [C12] |
| Vault Mastery II | 3400 | green rows x up to 1.5 | [C12] |
| Vault III rows begin | 3800 (Speedy Sailing) .. 7500 (Vault Mastery III) | W5-W6 | [C12] |

- **Feeds / fed by:** Fed by coins (all coin sources), kills on Bean (map 14), Carrot (24), Branch (13), Poop (8) and Sheepie (101) summed over all characters, ores mined, fish caught, bugs caught, Taskboard recipes unlocked, bubble levels, cards found, Knockout ladder progress. Feeds combat, coins, Class EXP, talents, Stamps, Statues, Anvil, Forge, Owl, Alchemy, Poppy, Post Office, Colosseum, Construction, Trapping/Worship, Storage, Cooking, Lab, Breeding, Tome, and W5-W6 systems. Cost reducers from W7 (Darts, Cryosnake pet, Sushi) and max-LV raisers (Pot Of Gold Pack, Glimbo trades). [C10][C15][C16]
- **Per-session actions:** (1) Spend idle coins: any visible, non-maxed row whose next-level cost is at or below the current character's coins is a missed purchase. (2) Buy newly unlocked one-off rows (Massive Whirl/Rapid Arrows/Dual Fireballs, Straight to Storage, Card Retirement, Duplicate Entries). (3) Do a Knockout when Knockout! is level 1 or more. (4) Capped/idle state: every visible row is maxed or unaffordable. [C17][C14]
- **AFK Setup implications:** AFK fighting on the best coin-per-hour map feeds the vault. Kill-scaled rows step only at powers of 10, so a character parked on Bean/Carrot/Branch/Poop/Sheepie matters only to cross the next 10^n. Active Learning and Active Murdering apply only while the game is open (active play). Sleepy Time raises AFK gains for every AFK stretch. [C18][C19][C20]
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:** hoarding coins; skipping Major Discount; never starting Knockout; missing one-off rows; redeeming Colosseum tickets before Duplicate Entries; deep-levelling Happy Doggy; assuming Major Discount helps rows 33+; forgetting Vault Mastery after 1050. Detection paths in the table in "Save and Toolbox fields". [C13][C21][C22][C23]
- **Save and Toolbox fields:** see below.
- **Sources:** inline per claim; claim list below.

## Mechanics catalogue

Format: mechanic - rule/formula - caps - unlock - cost - exact field.

1. **Unlock gate (total levels).** The only non-monotonic pair in the 90-row table is row 5 (80) -> row 6 (75) (script-checked 2026-10-19), so the two rules differ only for totals 75-79.  `totalUpgradeLevels = sum(UpgVault[i])` over all slots. Toolbox flags a row `unlocked` when `total >= unlockLevel`. The game instead counts rows with `unlockLevel <= total` and lets row i be bought only when i is below that count; the table is sorted except rows 5 (Steel Guard, 80) and 6 (Evolving Talent, 75), so totals 75-79 differ. ActiveOn's spend reader already uses the count rule (`open`). Field: `account.upgradeVault.totalUpgradeLevels`, `.upgrades[i].unlocked`; raw `UpgVault`. [C24][C25][C26]
2. **Cost of next level L of row i.** `base = L + (x1 + L) * x2^L`. Cost has only two branches in code (index < 33, else); the 33-61 and 62-89 "bands" come from the Mastery multiplier rows, and the extra `1.1^` growth starts at row 62. Rows 0-32: `max(0.001, 1/(1+MajorDiscountBonus/100) * dartsFactor) * companion99 * sushi * base`. Rows 33-89 (`1.1^max(0, i-61)`, so effectively from row 62): `max(0.01, dartsFactor) * companion99 * sushi * 1.1^max(0, i-61) * base`. Field: `upgrades[i].cost`, `.costToMax`, `.x1`, `.x2`. [C27][C28]
3. **Major Discount (row 13).** Bonus `4*level`; rows 0-32 cost `1/(1+bonus/100)`; max 80 -> 4.2x cheaper (76.2% off); 90 levels with the bundle -> 4.6x. Does not apply to rows 33+. Field: `upgrades[13]`. [C13][C27]
4. **W7 cost reducers.** Darts minigame shop `accountOptions[437]` (`1/(1+x/100)`), Cryosnake companion index 99 (50%, 75% upgraded; floor 0.1), Sushi Station bonus 38 or 47 (floor 0.1). All irrelevant before W7; surfaced as `upgradeVault.costReduction.cheaperFactor`. [C29]
5. **Per-row bonus ("simple" rows).** `level * x5` for rows 1, 6-9, 13, 32, 33, 36, 40, 42-44, 49, 51-53, 57, 61, 64, 70, 73, 74, 76, 79, 85, 86, 88, 89. Field: `upgrades[i].bonus`. [C30]
6. **Vault Mastery tiers.** Scopes are 0-31 (Mastery row 32), 33-60 (row 61), 62-88 (row 89). Rows 0-31 (non-simple) x`(1 + bonus32/100)`; rows 33-60 x`(1 + bonus61/100)`; rows 62-88 x`(1 + bonus89/100)`. Each Mastery row is +1% per level, max 50 (60 with bundle), so up to x1.5 (x1.6). Mastery rows themselves are simple. [C30][C31]
7. **Bigger Damage (0) curve.** `(level*1 + max(0,L-25) + max(0,L-50) + max(0,L-100)) * (1+VM_I/100)`: per-level gain rises to 2, 3, 4 past 25/50/100. Max 500. Feeds base damage flat. `parsers/damage.ts#L965`. [C32]
8. **Cooking Knowledge (60) curve.** Extra terms past 25 (x1), 50 (x1), 100 (x2), 200 (x3), 300 (x5), 400 (x7), 450 (x10), then x`(1 + floor(L/25)/5)`, then x`(1+VM_II/100)`. Max 500. Field `upgrades[60].bonus`; consumer `parsers/character.ts#L1012`. [C33]
9. **Max level.** Base `maxLevel`; +10 for every row with base max >= 2 when the Pot Of Gold Pack (`bon_u`) is owned; Glimbo trades (W7, `accountData.minehead.glimbo[].vaultIdx`) add `trades` (live max LV uses `trades` with no +1; the Minehead preview uses `trades+1`) (or `round((1+researchGrid169+eventShop40)*trades)` for flagged rows). Glimbo rows: Monster Tax (2), Wicked Smart (3), Major Discount (13), Go Go Secret Owl (21), Vault Mastery (32), Active Murdering (43), Kangaroo Mouse (45), Critters 'n Souls (50), Kitchen Dream-mare (54), Foraging Forever (56), Teh TOM (57), Pet Punchies (58), Vault Mastery II (61), Artifact Find Chance (63), Go Go Bubba (65), Mega Bits (68), Divinity Points (71), Better Captains (75), Finders Keepers (81), Bigger Better Beans (85), Rest of Essentials (87), Vault Mastery III (89). Glimbo also extends the three Mastery rows (32, 61, 89), whose base max is 50. Field `upgrades[i].maxLevel`. [C34][C35][C76]
10. **Kill slots (`VaultKillzTotal`).** `account.upgradeVault.vaultTotalKills[]`, 12 slots: 0-3 total kills over all characters on maps 14, 24, 13, 8 (map portal requirement minus `KillsLeft2Advance`, so counting continues after the portal opens); 4-7 `floor(log10)` of those (0 below 10 kills); 8 Taskboard recipes unlocked (`Tasks[3]`; Toolbox comment says "completed"); 9 `alchemy.totalBubbleLevelsTill100`; 10 Sheepie kills (map 101); 11 `floor(log10)` of those. [C36]
11. **Kill-scaled rows.** Bored to Death (14): `bonus * slot4` % coins (Bean). Slice N Dice (20): `bonus * slot5` flat base damage (Carrot). Stick Snapping (27): `bonus * slot6` % total damage (Branch). Dirty Money (31): `bonus * slot7` % coins (Poop). Buildie Sheepie (48): `bonus * slot11` % construction speed (Sheepie). Max levels 10/100/50/25/20. Consumers: `character.ts#L2891-2892`, `damage.ts#L850,L966`, `character.ts#L3673`. [C37]
12. **Skill/progress-scaled rows.** Mining Payday (17): `bonus * lavaLog(accountOptions[340])` % coins. Schoolin' the Fish (35): `bonus * lavaLog(accountOptions[345])` % Class EXP. Bug Power en Masse (41): `bonus * lavaLog(accountOptions[346])` % total damage. Recipe for Profit (34): `bonus * slot8` % coins. Bubble Money (37): `bonus * slot9` % coins. Collection Cashout (70): `bonus * cardsFound` % coins. All coin rows (2, 14, 17, 31, 34, 37, 70) sum into one additive pool inside the cash multiplier. `lavaLog` is the continuous log10. [C38][C39]
13. **Knockout! (15).** Each Knockout (one-hit kill of the current ladder target with no weapon equipped) advances `accountOptions[338]` by 1 along a 78-monster ladder (`randomList[104]`); total-damage % = `bonus15 * accountOptions[338]` (max level 5, so +5%/KO at max, before Mastery: +390% at 78 KOs). Progress only advances while the row is level >= 1. `damage.ts#L851`; `class-specific/grimoire.ts#L151` names the target. [C14][C40]
14. **Weapon Craft (10).** Max 5, +10%/level in the in-game text ("crafted weapons"); Toolbox's total-damage tree adds only `0.4 * bonus10`. Discrepancy flagged (open question 2). `damage.ts#L852`. [C41]
15. **Combat flat rows.** Bullseye (4) +1 accuracy/level (max 500); Steel Guard (5) +1 defence/level (max 100; `damage.ts#L1482`); All Armoured Up (46) equipment DEF x(1+bonus/100) (`damage.ts#L1449`); Boss Decimation (22) +1% boss damage; Raw Damage (80) +2%/level additive total damage, max 500 (`damage.ts#L863`). [C42]
16. **Coins.** Monster Tax (2) +2%/level coins, max 500, `character.ts#L2890`. [C43]
17. **Class EXP.** Wicked Smart (3) +2%/level; Baby on Board (12) +2%/level for the lowest-level character only (`character.ts#L1934,L1976`); Active Learning (39) x(1+bonus/100) while the game is open. [C44]
18. **Talents.** Natural Talent (1) +1 tab-1 point/level, max 200; Evolving Talent (6) +1 tab-2 point (W1 class lines), max 200; Stunning Talent (40) +1 tab-3 (subclass) point, max 100; Special Talent (53) +1 Star Talent point, max 150 (`talents.ts#L598`); Quest KAPOW! (49) raises the Quest star talent max LV, max 200; Slight Do-Over (51) N daily single-talent refunds, max 20. [C45]
19. **Class skills (one-off).** Massive Whirl (7), Rapid Arrows (8), Dual Fireballs (9); 777 coins each; max 1. [C46]
20. **Inventory/Storage QoL.** Carry Capacity (11) +5 per slot per level, max 100 (`parsers/misc.ts#L1196`); Storage Slots (33) +1 chest slot per level, max 24 (`storage.ts#L96`); Straight to Storage (36) one-off 3M; Card Retirement (44) one-off 50M; Duplicate Entries (52) one-off 100M; Daily Mailbox (47) +1 Post Office box per day played per level, max 10. [C47]
21. **W1 system multipliers.** Stamp Bonanza (16): Sword/Heart/Target/Shield stamps x(1+bonus/100) (`stamps.ts#L393`); Statue Bonanza (25): Power/Speed/Mining/Lumberbob statues (`statues.ts#L131`); Production Revolution (24) anvil speed (`anvil.ts#L186`); Beeg Forge (26) forge capacity (`forge.ts#L172`); Go Go Secret Owl (21) feathers/sec (`owl.ts#L90`); Drops for Days (18) +1% Drop Rate (`character.ts#L2432`); Sleepy Time (23) +1% AFK gains (`character.ts#L3280`). [C48]
22. **W2-W3 rows.** Liquid/Bug/Fish Knowledge (28/29/30) +1% skill EXP (`character.ts#L827/866/758`); Drip Drip Drip (38) +5% liquid generation; Vial Overtune (42) vials x(1+10%/level), max 3 (`alchemy.ts#L526`); Kangaroo Mouse (45) Poppy bluefish (`kangaroo.ts#L82`); Active Murdering (43) portal kills x(1+bonus/100) while active (`speedrun.ts#L140`); Critters 'n Souls (50) (`worship.ts#L134`); Buildie Sheepie (48). [C49]
23. **W4 rows.** Kitchen Dream-mare (54) cooking speed (`cooking.ts#L808`); Lab Knowledge (55) (`character.ts#L1142`); Foraging Forever (56) (`breeding.ts#L108`); Teh TOM (57) +2 Tome score/level, Toolbox clamps at 1500 (`tome.ts#L373`); Pet Punchies (58); Breeding Knowledge (59) (`character.ts#L1080`); Cooking Knowledge (60). [C50]
24. **Happy Doggy (19).** +2% Dog Happiness per level; no Toolbox consumer exists (no `getUpgradeVaultBonus(...,19)` call). Prior found no read in the game client either. Treat as unlock fuel only. [C51]
25. **W5+ extensions (one line each).** Sailing: Speedy Sailing 62, Artifact Find 63, Ocean Knowledge 66, Sailing Loot 67, Better Captains 75 (`sailing.ts`). Gaming: Mega Bits 68, Gamer Knowledge 69. Divinity: Divinity Points 71, Divine Knowledge 72, Big Blessings 76 (+max LV, `divinity.ts#L46`). Hole: Smarter Villagers 73 (`hole.ts#L682`). Slab: Super Slab 74. Bubba: Go Go Bubba 65 (`bubba.ts#L420`). Coins: Collection Cashout 70. Portals: Skulltrick 64 (`damage.ts#L1557` area). W6 Farming: 77 Knowledge, 78 Croppius Evolvius, 79 Properly Funded Research (`farming.ts`). Sneaking: 81 Finders Keepers, 82 Knowledge, 88 Topheavy Charms. Summoning: 83 White Essentials, 84 Knowledge, 87 Rest of Essentials. Beans 85, Golden Food 86 (`misc.ts#L955`), Raw Damage 80. [C52]
26. **Next-unlock preview / cost reduction headline.** `upgradeVault.nextUnlock` is the first row with `total < unlockLevel`; `costReduction.cheaperFactor` is the in-game "N.NNx cheaper" figure (excludes Major Discount). [C53]

27. **Unlock-rule difference rows (new).** Only rows 5 (Steel Guard, 80) and 6 (Evolving Talent, 75) are out of order, so totals 75-79 are the only ones where per-row (Toolbox) and count (game) rules differ. [C77]
28. **Rows with no Toolbox consumer (new, effect unverifiable from code).** 1, 4, 6-9, 13 (internal cost only), 19, 22, 38, 39, 40, 44, 47, 49, 51, 52, 58, 71, 75, 81. Treat their in-game text as tier 1 description only; ActiveOn must not model numeric effects for them. Confidence M. [C78]
29. **Description placeholders (new).** Knockout names its current target from option 338 via `randomList[104]`; Mining Payday uses option 340, Schoolin' the Fish 345, Bug Power 346; Recipe for Profit uses completed Taskboard tasks of W1-4; Bubble Money uses `totalBubbleLevelsTill100`; Knockout's "Total" and other counters are context-dependent (kills, cards, ores/fish/bugs). [C79]
30. **Glimbo cost competition (new).** Event Shop bonus 38 and Companion 57 reduce Glimbo trade cost (`minehead.ts`), a separate sink competing with vault max-level goals; the flag path scales trades by `(1 + Research grid 169 + Event Shop 40)`. [C80]
31. **Cost-reduction sources are exhaustive (new).** Only Darts (option 437), Companion 99, Sushi 38/47, and Major Discount for rows 0-32. Companion and Sushi floor 0.1; Darts has no floor of its own. [C81]
32. **Vault III (new).** Rows 62-89 (28 upgrades) boost W5/W6; Vault Mastery III (row 89, unlock 7500) multiplies rows 62-88. In scope only as consumers. [C82]

### Full upgrade table (90 rows)

The complete per-row table (name, unlock, max LV, x5, x1, x2, cost of level 1, cost to max, Mastery tier, effect) is in the prior dossier and is identical to `V/data/website-data/shared-data.json#upgradeVault` (checked). Selected values used for planning: [C12][C54]

| # | Row | Unlock | Max | x5 | x1 | x2 |
|---|---|---|---|---|---|---|
| 0 | Bigger Damage | 0 | 500 | 1 | 8 | 1.025 |
| 1 | Natural Talent | 7 | 200 | 1 | 14 | 1.15 |
| 2 | Monster Tax | 13 | 500 | 2 | 10 | 1.05 |
| 3 | Wicked Smart | 42 | 500 | 2 | 15 | 1.2 |
| 4 | Bullseye | 49 | 500 | 1 | 25 | 1.15 |
| 13 | Major Discount | 240 | 80 | 4 | 300 | 1.3 |
| 15 | Knockout! | 330 | 5 | 1 | 1000 | 6 |
| 32 | Vault Mastery | 1050 | 50 | 1 | 1e4 | 1.65 |
| 61 | Vault Mastery II | 3400 | 50 | 1 | 1.5e9 | 2 |
| 89 | Vault Mastery III | 7500 | 50 | 1 | 1.5e22 | 3.25 |

Cheapest-first coin floor to reach a total (own re-simulation 2026-10-19 from the pinned formulas, Major Discount bought as the greedy picks it, no W7 reducers, count-rule visibility): 25 levels about 534 coins; 100 about 6.2K; 250 about 66K; 500 about 550K; 1,000 about 4.6M; 1,260 about 10.6M; 1,724 about 71M; 1,850 about 117M; 2,497 about 2.1B; 2,530 about 2.4B; 3,400 about 126B; 4,000 about 2.0T; 5,000 about 270T. [C55]

## Min-max by stage

No single authoritative community priority list exists; the lines below combine formula-derived rules (M) with the few dated community statements found. DigitalTQ's page is dated 2026-03-25 but contains stale values (see C58), so treat it as L. [C56][C57][C58]

**Rules at every stage:** every level is +1 toward the next unlock, so when nothing better is affordable buy the cheapest visible level; engine rows first (Major Discount, Vault Mastery I/II, coin rows); buy one-off rows on unlock; max cheap capped rows; do not deep-level Happy Doggy. [C59][C60]

**W1 early (total 0 to ~350):** Bigger Damage, Monster Tax, Natural Talent evenly to 25 total levels (quest gate, cheapest damage/coins); Wicked Smart and Bullseye 20-40 each (DigitalTQ early list: Bigger Damage, Bullseye, Monster Tax, Natural Talent, Steel Guard); buy Massive Whirl/Rapid Arrows/Dual Fireballs when they unlock (777 each); Weapon Craft to max 5 (635K raw), Baby on Board to 50 (166K raw) while levelling new characters; Major Discount to about 20 (199K raw) as soon as it unlocks at 240; Knockout! 1 level at 330 then 5. Community: accuracy is the main wall between W1 and W6, so "prioritize accuracy nodes in the vault early" (Visme ebook 2025-09-23, L). [C61][C57][C62]

**W1 mid (350 to ~1,100):** Monster Tax and Bigger Damage keep going (both x2 <= 1.05, cheap to 200+); Boss Decimation max 25; Sleepy Time max 20; Drops for Days max 50; Dirty Money max 25; Stamp Bonanza and Statue Bonanza to 25; Owl/Anvil/Forge rows 25-50; Vault Mastery to 10-20 once 1050 is reached. Reddit 2025-10-28 advice: "focus on the money things inside the vault first" (L). [C63][C64]

**W2 (1,100 to ~1,900):** Straight to Storage at 1260 (3M); Bubble Money to 10 (10.3M raw); Recipe for Profit 10-20; Storage Slots 3-5 (4x tail is steep); Drip Drip Drip 10-20; Schoolin' the Fish and Active Learning; Stunning Talent once a subclass exists; Vial Overtune 1-2 (3rd level about 159M); Card Retirement at 1850 (50M); Liquid/Bug/Fish Knowledge to 50 when starting W2 skills. [C65]

**W3 (1,900 to ~2,600):** Duplicate Entries at 2470 (100M) and do not redeem Colosseum tickets before owning it; Buildie Sheepie 5-10 (Construction is the W3 bottleneck); Critters 'n Souls 25-50; All Armoured Up about 25; Kangaroo Mouse about 25; Daily Mailbox 3-5; Quest KAPOW!; Special Talent at 2530; push Vault Mastery toward 30 when coins allow. Reddit advice (2025-02-04): spread spending, buy coin multipliers, Major Discount and Vault Mastery are "meta" (L). [C66][C67]

**W4 (2,600 to ~3,400+):** W4 rows (Kitchen Dream-mare, Lab Knowledge, Foraging Forever, Pet Punchies, Breeding Knowledge, Teh TOM, Cooking Knowledge); goal Vault Mastery II at 3,400 (about 126B cheapest-first coins); one community reply says cooking level 100 needs Cooking Knowledge (Reddit 2025-10-28, L). Rows 62+ pay an extra 1.1^(row-61) and get no Major Discount, so they are out of reach in W4. [C68][C69]

**Per class:** Warrior Massive Whirl, Archer Rapid Arrows, Mage Dual Fireballs (buy all three anyway as unlock fuel); Bullseye's hint names the accuracy stat (Warrior WIS, Archer STR, Mage AGI, per prior); Baby on Board peaks while levelling new slots. [C70]

## Save and Toolbox fields

- Raw save: `UpgVault` (100-slot list, slots 0-89 used); `OptionsListAccount[338]` Knockout progress, `[340]` ores, `[345]` fish, `[346]` bugs, `[437]` Darts discount; `BundlesReceived.bon_u`; `Money_<i>`, `MoneyBANK`; `KillsLeft2Advance`; `Tasks[3]`; `CauldronInfo`. [C71]
- Toolbox: `account.upgradeVault` = `{ upgrades[] (name, x1, x2, x5, unlockLevel, maxLevel, level, unlocked, cost, costToMax, bonus, description), totalUpgradeLevels, nextUnlock, vaultTotalKills, costReduction }` built by `UV#L22` (`getUpgradeVault` at `UV#L17`; wired at `V/parsers/index.ts#L367`). Consumer helper `getUpgradeVaultBonus(upgrades, i)` (`UV#L206`). [C72]
- ActiveOn today: `account.vault` (kill slots, `purpose.ts#readVault`), Spend Plan vault rows 0-61 with count-rule `open` (`packages/account-state/src/spend.ts#L71`), detector `upgrade-vault/kill-row`, KB `packages/knowledge/systems/upgrade-vault.yaml` (kill-row contribution only), page `apps/activeon/src/systems/pages/VaultPage.tsx`. Not yet covered: Knockout ladder tracking, one-off row alerts, idle-coin alert, Vault II/III beyond row 61, W7 cost reducers in advice. [C73]
- Toolbox gaps: `unlocked` uses per-row threshold (rows 5/6 at 75-79); `vaultTotalKills[8]` comment says "completed tasks" but is recipes unlocked; no dashboard alert for vault. [C26][C36]
- Detection: idle coins = any `upgrades[i].unlocked && level < maxLevel && cost <= characters[].money`; Major Discount skipped = `upgrades[13].level < 20 && total > 400`; Knockout stalled = `upgrades[15].level >= 1 && accountOptions[338]` unchanged; missing one-offs = `upgrades[36|44|52].level == 0` when open; Vault Mastery idle = `upgrades[32].level == 0 && total >= 1050`. [C74]

## Sprites (for the build step)

Existing sprite grid `apps/activeon/src/art/sprites/grids/systems.ts` has a Vault system glyph. Per-row icons (90 rows) do not exist; a compact set of 6 family icons (damage, coins, EXP, talents, QoL, mastery) would cover the Vault page. [C75]

## Claims

- [C1] Rows are bought with coins and unlock on total Vault levels. Source: UV#L22-L40 (tier 1, 2026-10-19, 2.3.540) Confidence: H.
- [C2] **Disputed (source lens: paraphrase overstated).** Original: "catch-up system". Correction: the wiki v2.27 text says the vault is directed at new players and the next update will be more endgame content; quote it, do not call it a catch-up system. Source: https://idleon.wiki/wiki/Changelog/2025 (tier 3, claim 2025-02-03, via prior, M)
- [C3] Vault I v2.27 2025-02-03, Vault II v2.29 2025-02-15. Source: https://idleon.wiki/wiki/Changelog/2025 (tier 3, M; changelog dates not checkable against game data)
- [C4] Vault III v1.08 2026-03-13 (wiki page says March 13 2025 under the 2026 changelog; 2026-03-13 is inferred, not stated). Source: https://idleon.wiki/wiki/Changelog/2026 (tier 3, via prior, M)
- [C5] **Disputed (both lenses: boundaries loose).** Original claimed the cost formula has bands at 33 and 61. Correction: cost has two branches (index < 33 with Major Discount; else with `1.1^max(0,i-61)`, growth starting at row 62); Mastery scopes are 0-31, 33-60, 62-88 and Major Discount scope 0-32. The three Vaults are rows 0-32 / 33-61 / 62-89. Source: UV#L193-L204, UV#L210-L268 (tier 1, H)
- [C6] Scripticus step "Buy Upgrades: 25" reads total Vault levels, not talent points. Source: prior dossier, N.js v1.23 `Buy_Upgrades:25` @15318113 (tier 1, 2026-10-17, M; N.js not in vendored tree, consistent with sum of levels)
- [C7] **Disputed/Corrected (game-data lens).** Original: applies when the character is the lowest level. Correction: pays only the strictly-lowest-level character and only when the Merit-shop lowest-level upgrade level is above 0 (`isLowestLevel`). Source: V/parsers/character.ts#L1932-L1940 (tier 1, H)
- [C8] Coins spent are per character (`Money_<i>`); the shared-money Advanced Features toggle (v1.07, 2026-03-06) is unverified. Source: prior dossier; https://idleon.wiki/wiki/Changelog/2026 (tier 1/3, H on per-character wallets in spend.ts, L on toggle; wiki v1.07 2026-03-06 confirms the toggle exists) Confidence: H.
- [C9] Bonus is `level * x5` for simple rows. Source: UV#L210-L228 (tier 1, H)
- [C10] Kill slot inputs scale bonuses, not unlocks (`unlocked` only compares total levels). Source: UV#L38, UV#L272 (tier 1, H)
- [C11] Seven rows read kill or skill totals: 14, 20, 27, 31, 48 (kills) and 17, 35, 41 (skill totals), plus 34, 37, 70 (recipes, bubbles, cards). Source: V/parsers/character.ts#L2835-L2894, damage.ts#L345 (tier 1, H)
- [C12] Unlock thresholds, max LVs and x1/x2/x5 per row. Source: V/data/website-data/shared-data.json `upgradeVault` (tier 1, 2026-10-19; matches prior table) Confidence: H.
- [C13] Major Discount: cost factor `1/(1+bonus/100)` for rows 0-32 only; bonus = 4/level, max 80. Source: UV#L193-L204 (tier 1, H)
- [C14] Knockout! bonus = `bonus15 * accountOptions[338]` into total damage; ladder from `randomList[104]`. Source: V/parsers/damage.ts#L851; V/parsers/class-specific/grimoire.ts#L149-L154; UV#L14-L15 (tier 1, H)
- [C15] Pot Of Gold Pack (`bon_u`) +10 max LV on rows with base max >= 2. Source: UV#L160-L180 (tier 1, H)
- [C16] Darts, Cryosnake (companion 99) and Sushi (38/47) reduce vault cost. Source: UV#L71-L90, UV#L193-L204 (tier 1, H)
- [C17] Cost of next level uses current `level`, so affordability = `cost <= money`. Source: UV#L193-L204 (tier 1); spend reader packages/account-state/src/spend.ts#L71 (tier 1, H)
- [C18] Kill-parking is "very candyable" (Time Candy) rather than a steady setup. Source: https://www.reddit.com/r/idleon/comments/1notjfh/comment/nfuzloh/ (tier 4, 2025-09-23, L)
- [C19] Active Learning and Active Murdering apply while the game is open; portal formula uses vault 43. Source: V/parsers/class-specific/speedrun.ts#L138-L146 (tier 1); description text in shared-data.json (tier 1, H)
- [C20] Sleepy Time +1% AFK gains per level feeds the AFK gains pool. Source: V/parsers/character.ts#L3280 (tier 1, H)
- [C21] Row 36/44/52 are max-1 one-offs. Source: shared-data.json (tier 1, H)
- [C22] Duplicate Entries doubles new Colosseum tickets received. Source: shared-data.json description (tier 1); advice to hold tickets from prior W1-guide dossier (tier 4, L)
- [C23] Happy Doggy has no Toolbox consumer. Source: grep of V/parsers for index 19 (tier 1, 2026-10-19) Confidence: H.
- [C24] `totalUpgradeLevels` = sum of `UpgVault`. Source: UV#L23 (tier 1, H)
- [C25] Game unlock rule is a count of rows with `unlockLevel <= total`. Source: prior dossier, N.js `VaultUpgUNLOCKED` @10880927 (tier 1, 2026-10-17, H)
- [C26] Toolbox `unlocked` uses the per-row threshold; ActiveOn spend.ts uses the count rule. Source: UV#L38; packages/account-state/src/spend.ts#L82-L96 (tier 1, H)
- [C27] Base cost `L + (x1+L)*x2^L`, with `1.1^max(0,i-61)` for rows 33+ and floors 0.001 / 0.01. Source: UV#L193-L204 (tier 1, H)
- [C28] `costToMax` sums level costs from current to max. Source: UV#L182-L191 (tier 1, H)
- [C29] Reducer details and 0.1 floors. Source: UV#L71-L90 (tier 1, H)
- [C30] Simple-row list and Mastery tier ranges. Source: UV#L210-L268 (tier 1, H)
- [C31] Vault Mastery rows are +1%/level, max 50. Source: shared-data.json rows 32/61/89 (tier 1); https://idleon.wiki/wiki/Upgrade_Vault (tier 3, verified 2026-10-19) Confidence: H.
- [C32] Bigger Damage curve with thresholds 25/50/100. Source: UV#L222-L229; V/parsers/damage.ts#L965 (tier 1, H)
- [C33] Cooking Knowledge curve and `floor(L/25)/5` factor. Source: UV#L230-L245 (tier 1, H)
- [C34] **Disputed/Corrected (game-data lens).** Max LV with Glimbo and flag. Live max LV uses `trades` with no +1 (UV#L165-L174); minehead.ts#L355-L378 uses `trades+1` for its preview, a different offset. Source: UV#L160-L180; minehead.ts (tier 1, H)
- [C35] Glimbo vault indices list `research.json[26]`. Source: V/data/website-data/research.json (tier 1, 2026-10-19) Confidence: H.
- [C36] 12-slot `vaultTotalKills` layout. Source: UV#L272-L330 (tier 1, H)
- [C37] Kill-scaled row consumers. Source: V/parsers/character.ts#L2891-L2892, #L3673-L3674; V/parsers/damage.ts#L850, #L966 (tier 1, H)
- [C38] Skill-scaled row consumers using `lavaLog` of option slots 340/345/346. Source: V/parsers/character.ts#L1976-L1977, #L2893; V/parsers/damage.ts#L345 (tier 1, H)
- [C39] Coin rows add in one additive pool within cash multi. Source: V/parsers/character.ts#L2869-L2894 (tier 1, H)
- [C40] Knockout ladder has 78 targets (prior count from `randomList[104]`); max LV 5. Source: V/data/website-data/randomList.json; shared-data.json (tier 1, H)
- [C41] Toolbox applies `0.4 * bonus10` for Weapon Craft in total damage while the text says +10%/level. Source: V/parsers/damage.ts#L852 (tier 1, discrepancy) Confidence: H.
- [C42] Combat flat rows' consumers. Source: V/parsers/damage.ts#L863, #L1449, #L1482 (tier 1, H)
- [C43] Monster Tax coin consumer. Source: V/parsers/character.ts#L2890 (tier 1, H)
- [C44] Class EXP consumers. Source: V/parsers/character.ts#L1934, #L1976-L1980 (tier 1, H)
- [C45] Talent point consumers; Special Talent. Source: V/parsers/talents.ts#L598; shared-data.json descriptions (tier 1, H)
- [C46] 777-coin class skills, max 1. Source: shared-data.json rows 7-9 (tier 1, H)
- [C47] QoL row consumers. Source: V/parsers/misc.ts#L1196; V/parsers/storage.ts#L96, #L109 (tier 1, H)
- [C48] W1 multiplier row consumers. Source: V/parsers/world-1/stamps.ts#L393; statues.ts#L131; anvil.ts#L186; forge.ts#L172; owl.ts#L90 (tier 1, H)
- [C49] W2-W3 row consumers. Source: V/parsers/character.ts#L758-L866; world-2/alchemy.ts#L526; world-2/kangaroo.ts#L82; world-3/worship.ts#L134 (tier 1, H)
- [C50] W4 row consumers; Tome clamp 1500. Source: V/parsers/world-4/cooking.ts#L808; breeding.ts#L108; tome.ts#L373; character.ts#L1080, #L1142 (tier 1, H)
- [C51] Happy Doggy description only. Source: shared-data.json row 19; prior dossier (tier 1, H)
- [C52] W5+ row consumers. Source: V/parsers/world-5/*.ts, world-6/*.ts, misc.ts#L955 (tier 1, H)
- [C53] `nextUnlock` and `costReduction`. Source: UV#L52-L90 (tier 1, H)
- [C54] Table identical to prior. Source: script comparison against prior table, 2026-10-19 (tier 1, H)
- [C55] Cheapest-first floors. Source: own simulation 2026-10-19 from UV formulas (tier 1-derived, M); matches prior simulation
- [C56] No authoritative community priority list found. Source: web searches 2026-10-19 (tier 4, L)
- [C57] DigitalTQ early list: Bigger Damage, Bullseye, Monster Tax, Natural Talent, Steel Guard; mid: Wicked Smart, class skills, Carry Capacity, Major Discount; late: Vault Mastery series, W-specific, Raw Damage. Source: https://www.digitaltq.com/wiki/idleon/the-upgrade-vault (tier 4, page date 2026-03-25, fetched 2026-10-19, L)
- [C58] DigitalTQ states Major Discount reduces cost "by 3.85%" and Storage Slots "up to 11"; both disagree with data (4%/level, max 24). Source: same page vs shared-data.json (tier 4 vs tier 1; tier 1 wins; likely pre-patch text) Confidence: H on data side, L on external page.
- [C59] Every level counts toward the unlock total. Source: UV#L23, L38 (tier 1, H)
- [C60] Wiki: Monster Tax and Wicked Smart are early priorities; Vault Mastery essential. Source: https://idleon.wiki/wiki/Upgrade_Vault (tier 3, fetched 2026-10-19) Confidence: M.
- [C61] Early-W1 order and raw costs derived from formulas (Weapon Craft 6.35e5, Baby on Board 1.66e5, Major Discount 20 lv 1.99e5). Source: shared-data.json x1/x2 with UV formula (tier 1-derived, M)
- [C62] "Prioritize accuracy nodes in the vault early". Source: https://my.visme.co/view/dwonr73g-idleon-academy-the-beginning (tier 4, 2025-09-23, via prior, L)
- [C63] Mid-W1 row costs to max derived from formulas. Source: shared-data.json with UV formula (tier 1-derived, M)
- [C64] "focus on the money things inside the vault first". Source: https://www.reddit.com/r/idleon/comments/1oi1usb/comment/nlsggl1/ (tier 4, 2025-10-28, via prior, L)
- [C65] W2 row costs derived from formulas. Source: shared-data.json with UV formula (tier 1-derived, M)
- [C66] W3 row costs derived from formulas. Source: same (tier 1-derived, M)
- [C67] Spread spending; Major Discount and Vault Mastery "meta". Source: https://www.reddit.com/r/idleon/comments/1ihsy7j/comment/mazxsly/ (tier 4, 2025-02-04, via prior, L)
- [C68] W4 rows 54-60 unlock 2600-3300; Vault Mastery II at 3400, 1.5e9 x1. Source: shared-data.json (tier 1, H)
- [C69] Cooking 100 needs Cooking Knowledge. Source: https://www.reddit.com/r/idleon/comments/1oi1usb/ (tier 4, 2025-10-28, via prior, L)
- [C70] Class accuracy stat hint per class. Source: prior dossier, game text (tier 1, 2026-10-17, M)
- [C71] Raw save fields. Source: prior dossier (N.js v1.23) and UV#L22-L40 (tier 1, H)
- [C72] Toolbox account.upgradeVault shape and wiring. Source: UV#L17-L69; V/parsers/index.ts#L367 (tier 1, H)
- [C73] ActiveOn current coverage. Source: packages/account-state/src/spend.ts, purpose.ts; packages/knowledge/systems/upgrade-vault.yaml (tier 1, repo state 2026-10-19) Confidence: M.
- [C74] Detection rules derived from `account.upgradeVault` fields. Source: UV#L38-L50 (tier 1-derived, M)
- [C75] Existing vault glyph in grids/systems.ts; per-row icons absent. Source: apps/activeon/src/art/sprites/grids/systems.ts (grep 2026-10-19, M)
- [C76] Glimbo trades also extend max LV of Vault Mastery rows 32, 61, 89; the flag path scales trades by (1 + Research grid 169 + Event Shop 40). Source: V/parsers/world-7/minehead.ts#L355-L378; UV#L160-L180 (tier 1, 2026-10-19, H)
- [C77] `unlockLevel` is non-monotonic only at rows 5 (80) and 6 (75); per-row and count rules differ for totals 75-79 only. Source: shared-data.json `upgradeVault` (script-checked 2026-10-19, tier 1, H)
- [C78] No Toolbox consumer for rows 1, 4, 6-9, 13, 19, 22, 38, 39, 40, 44, 47, 49, 51, 52, 58, 71, 75, 81. Source: game-data verifier grep of V/parsers (tier 1, 2026-10-19, M)
- [C79] Description placeholders are context-dependent (options 338/340/345/346, randomList[104], Taskboard W1-4, totalBubbleLevelsTill100). Source: UV#L210-L330, grimoire.ts (tier 1, M)
- [C80] Event Shop 38 and Companion 57 reduce Glimbo trade cost, competing with vault max-level goals. Source: minehead.ts (tier 1, M)
- [C81] Vault cost reducers are only Darts (437), Companion 99, Sushi 38/47, and Major Discount (rows 0-32). Source: UV#L71-L90, UV#L193-L204 (tier 1, H)
- [C82] Vault III rows 62-89 exist; Vault Mastery III (row 89, unlock 7500) multiplies rows 62-88. Source: shared-data.json; UV#L210-L268 (tier 1, H)
- [C84] Bank (`MoneyBANK`) is a wallet in ActiveOn spend.ts alongside per-character coins. Source: packages/account-state/src/spend.ts#L67 (tier 1, 2026-10-19, H)

## Open questions

1. Does the shared-money Advanced Features toggle (v1.07) change which wallet pays for vault rows? Not verified.
2. Weapon Craft: game text says +10% per level on crafted weapons, Toolbox adds `0.4*bonus` to total damage. Which is the effect on gear damage?
3. Does Happy Doggy have any gameplay read after v1.23?
4. Exact order the community buys rows in W5+; no dated source found.
5. Whether the pinned-Toolbox `unlocked` flag (per-row threshold) should be corrected in the adapter for totals 75-79 (ActiveOn spend.ts already uses the count rule).
