# Merit Shop and Tasks (Task Board, Daily Tasks, Unlocks): system dossier

Verified 2026-10-19. Ground truth: Toolbox @6c37e3d (game 2.3.540 pin) data and parsers, cross-read against the game client N.js (Last-Modified 2026-10-17; offsets below are `symbol @character offset`). Claims are numbered [Cn: short source]; full sources and tiers are in the Claim register at the end. Confidence: H = read in game code or data, M = inferred or partly verified, L = unverifiable here or community. Every claim has its confidence in the register's Conf column; claims whose N.js offsets could not be re-checked by the verifiers are capped at M or L. Revised 2026-10-19 after two adversarial verdict sets: no claim was refuted; open items are marked. W5+ extensions are one line each. No real account data is quoted; "the W2 test account" / "the W3 test account" are aggregate only.

## Merit Shop and Tasks

- **What it is:** An account-wide Task Board per world: 8 ranked tasks (10 tiers each) plus one daily task, paying **merits** (spent in that world's Merit Shop tab) and **task points** (spent in the shared Unlocks tab as anvil recipes, pouches, gems and Time Candy). [C6: tasks.json + C1/C2 (computed)] [C3: N.js@7263511; TB tasks.ts#L62]
- **Unlocks:** W1 board: Grasslands Gary at level 14. W2: Desert Davey at level 50 plus quest `Desert_Davey2`. W3 `Iceland_Irwin1`, W4 `Nebula_Neddy1`, W5 `Lava_Larry1`, W6 `Spirit_Sungmin1`, W7 `Wavey_Wayne1`. [C9: N.js _event_TASKS@7254340] [C10: idleon.wiki/wiki/Tasks (2026-10-03)] Merit Shop rows unlock with their world's board; boss-armor rows additionally need the world's boss task tier. [C16: N.js purchase handler@7263400-7265800; shared-data.json merits]
- **Scope:** Fully account-wide. Progress, tiers, merit levels, unlocks and points live in one `Tasks` structure; star-talent rows lift the cap for every character, but star points are still spent per character. [C37: TB tasks.ts#L24-L95] [C18: N.js _customEvent_TaskShopPurchase@7441806]
- **Inputs → outputs:**
  - *Claim a tier* (manual tap, needs stat >= requirement): pays task points `floor(x + (w+1)*level)` and merits `1 + floor(level/5)`. [C4: N.js@7262300-7263500; tasks.json] [C2: N.js rank-up@7263511; tasks.json] [C1: TB tasks.ts#L12; N.js TaskStuff@6597194]
  - *Daily task:* base points only, 0 merits; resets at the daily reset. [C7: TB tasks.ts#L8,L45-L55; tasks.json] [C8: N.js daily reset@15114293; rank-up@7262300]
  - *Unlock points:* `f(n) = 1 + 9n + 2*max(0,n-5) + 7*max(0,n-12) + 11*max(0,n-20)` task points; 128 one-time rows in 7 columns. [C12: TB tasks.ts#L109-L140; N.js UnlockPtsFORMULA] [C14: taskUnlocks.json; TB tasks.ts#L77-L85]
  - *Merit Shop:* flat price per level (no scaling) from `Tasks[4][w+1]`. [C16: N.js purchase handler@7263400-7265800; shared-data.json merits]
- **Goals and Milestones:** see the Mechanics catalogue (task tiers, shop rows, unlock thresholds). Totals if fully ranked: merits W1 118 / W2-W4 120; task points W1 719 (L: **Disputed** base, 746 if Achievement Hunter base is 5, see C6/C45), W2 1,530, W3 2,300, W4 2,240. Cost to max every priced shop row: W1 85, W2 89, W3 72, W4 75. [C6: tasks.json + C1/C2 (computed)] [C36: shared-data.json merits (computed)] Merits are therefore not scarce in the long run; ordering is what matters. (M, derived)
- **Feeds / fed by:**
  - Fed by almost every W1-W4 system: kills, level-ups, AFK hours, Stamps, Anvil crafting, bosses (Amarok, Efaunt, Chizoar, Troll), Alchemy, Post Office, skill efficiency, Refinery, cogs, Shrines, 3D Printer, Worship, Trapping, Cooking, Breeding, Lab, Achievements. [C5: tasks.json filler2] [C11: N.js _event_TASKS@7254340]
  - Feeds Anvil recipes and pouches, gems, Time Candy, star talents, AFK fighting (respawn, AFK gains), Obols, boss gems, Arcade, Construction, Talent Book Library, 3D Printer, Refinery, Breeding, Lab, Alchemy (No Bubble Left Behind), character EXP. [C18: N.js _customEvent_TaskShopPurchase@7441806] [C20: TB character.ts#L1831-L1837; N.js@6503313]-[C35: TB alchemy.ts#L1104; N.js@11084182]
- **Per-session actions:** open each unlocked board (refreshes Achievement counters [C11: N.js _event_TASKS@7254340]); tap every ready tier, claiming reset-flag tasks the moment a tier is ready [C4: N.js@7262300-7263500; tasks.json]; do the four dailies; spend merits per the order below; buy any available unlock in an open column. Idle or capped states: ready tier unclaimed; unspent merits >= cost of the next row in the order; unlock points owned > bought with an unbought row in an open column; shop capped when every priced row is max. [C13: N.js TaskStuff AvailableUnlocks@6596443]
- **AFK Setup implications:** Faceless Deathmachine, Super Explosive Gameplay (AFK hours) and most passive tasks need no setup. Active-only tasks need a deliberate Play Session: Nakedknuckle (unarmed active kills), Pack Mule (craft N different items with no chest, town exit or drops), boss-feat tasks (chars 1..N in order), and the W2/W3 "69 active kills" dailies. The respawn rows raise AFK kills/hr only for the world where the fighters sit; the W2 AFK-gains row only covers the first N character slots in account order. [C20: TB character.ts#L1831-L1837; N.js@6503313] [C25: N.js AFKgainrates@4438530; TB character.ts#L3237]
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:** see table below.
- **Save and Toolbox fields:** see the dedicated section below.
- **Sources:** Claim register at the end.

## Mechanics catalogue (W1-W4; W5+ one line each)

Notation: `Tasks[a][w][i]`, w is 0-based (W1 = 0). All numbers H unless marked. Toolbox path = `packages/toolbox-parsers/vendor/<path>` in the pin.

### M1. Task tiers and claiming

| Rule | Detail | Field |
|---|---|---|
| Requirement | Tier k (0-based) needs `Tasks[0][w][i] >= breakpoints[k]` from `tasks.json`; the board advances `Tasks[1][w][i]` by 1 on tap. Max level = number of breakpoints (10; W1 Achievement Hunter 9; daily 1). | `account.tasksDescriptions[w][i] = {stat, level, maxLevel, requirement, meritReward}` (parsers/tasks.ts#L40-L65) |
| Merit reward | `1 + floor(level/5)` per claim (not for the daily). [C1: TB tasks.ts#L12; N.js TaskStuff@6597194] [C3: N.js@7263511; TB tasks.ts#L62] | `meritReward` |
| Task points | `floor(x + (w+1)*level)` added to `Tasks[4][0]`; x per task (W1 5, W2 10, W3 15, W4 10; Maximum Efficiency 11, Chill Out 17; dailies 2-8). [C2: N.js rank-up@7263511; tasks.json] | `account.tasks[4][0]` |
| Reset-on-claim | 12 tasks zero progress on claim (list in claim). [C4: N.js@7262300-7263500; tasks.json] [C5: tasks.json filler2] | `tasks.json` filler2 `|1|` |
| Achievement tasks | Slot 7 counts completed non-filler achievements of that world, refreshed only when the board opens. W1 oddity: data layout is shifted. [C11: N.js _event_TASKS@7254340] [C45: N.js TaskDescriptions; tasks.json] | `Tasks[0][w][7]` |

### M2. The 32 ranked W1-W4 tasks (requirements 1 to 10; from `tasks.json`)

| W | Task | Counts | Tier requirements | Resets |
|---|---|---|---|---|
| 1 | Faceless Deathmachine | total kills | 2k, 10k, 20k, 100k, 500k, 2M, 6M, 12M, 25M, 50M | no |
| 1 | Just One More Before Bed | level-ups (all chars) | 30, 70, 150, 300, 600, 1.2k, 2.5k, 8k, 15k, 25k | no |
| 1 | Super Explosive Gameplay | AFK hours claimed | 10, 70, 300, 1k, 2.5k, 8k, 20k, 60k, 140k, 250k | no |
| 1 | Nakedknuckle Boxing | active unarmed kills of: Bored Bean, Slime, Carrotman, Gigafrog, Poop, Rat, Nutto, Amarok, Baba Yaga, Dr Defecaus | 50, 50, 100, 150, 200, 250, 300, 5, 5, 5 | yes |
| 1 | Pack Mule Crafter | different items crafted, no chest/leaving town/drops | 3, 8, 14, 24, 34, 45, 55, 70, 90, 110 | yes |
| 1 | Stamp Coolection | stamp upgrades | 15, 40, 150, 300, 500, 800, 1250, 1800, 3000, 5000 | no |
| 1 | Such Rock Very Dog Wow | Amarok feats (kill; 5 kills; boxing gloves; no damage; chars 1-4 in order; Chaotic; Chaotic no weapon/helm; Chaotic 6 chars; Nightmare; Nightmare 0 talent pts) | 1,5,1,1,4,1,1,6,1,1 | yes |
| 1 | Achievement Hunter | W1 achievements done | 10,15,20,25,30,40,50,60,70 (9 tiers) | no |
| 2 | Road to Max Damage | single hit | 600, 2k, 6k, 25k, 50k, 100k, 200k, 400k, 750k, 999,999 | no |
| 2 | Investing in... bubbles? | total bubble levels | 15, 60, 130, 300, 650, 1.2k, 2.7k, 5k, 10k, 16k | no |
| 2 | Avast, Bankruptcy Ho! | Golden Dubloons bought | 5, 20, 75, 200, 700, 2.2k, 6k, 10k, 25k, 100k | no |
| 2 | Maximum Efficiency | N skills at efficiency E | 2@500, 2@1.5k, 3@3k, 3@5k, 4@10k, 4@25k, 5@50k, 5@250k, 6@1M, 6@5M | yes |
| 2 | No Time to Brews! | sum of 4 cauldron speeds /hr | 30, 100, 225, 400, 800, 1.5k, 6k, 12k, 50k, 150k | no |
| 2 | The Unstoppable USPS | Post Office orders | 10, 25, 50, 75, 110, 180, 275, 500, 750, 1111 | no |
| 2 | Twilight Tombstone | Efaunt feats (kill; 7 kills; no helmet/shirt; <2 min; 6 chars in order; all Chaotic arms; Chaotic no damage; Nightmare; Nightmare <120 s; Nightmare no helmet/weapon) | 1,7,1,1,6,1,1,1,1,1 | yes |
| 2 | Achievement Cowboy | W2 achievements | 5,10,...,70 (10 tiers) | no |
| 3 | Why so Salty? | salts refined | 25, 150, 600, 2.5k, 7k, 25k, 100k, 200k, 750k, 2M | no |
| 3 | Poof, Cogone! | cogs trashed | 10, 40, 120, 250, 500, 1k, 1650, 2500, 4500, 8000 | no |
| 3 | My Shrines, m'lord. | total shrine levels on one map | 4, 12, 24, 35, 48, 70, 86, 100, 120, 150 | yes |
| 3 | Printer go Brrrr | resources printed | 5k, 25k, 100k, 300k, 1M, 2M, 5M, 15M, 40M, 100M | no |
| 3 | The True TD Wizard | sum of Worship best waves | 25, 40, 70, 100, 130, 170, 220, 280, 370, 500 | no |
| 3 | Come 'ere Critters! | traps collected (+2% shiny chance per completion) | 10, 50, 200, 500, 1200, 2000, 4000, 8000, 15000, 30000 | no |
| 3 | Chill Out Big Boy! | Chizoar feats (kill; 5 kills; no helm/shirt/pants; before 2nd ice orbs; 8 chars in order; Chaotic; Chaotic no damage; Nightmare; Nightmare before 3rd orbs; Nightmare 4 chars in order) | 1,5,1,1,8,1,1,1,1,4 | yes |
| 3 | Achievement Inuit | W3 achievements | 5,...,70 | no |
| 4 | Firing Up Le Grill | fire when finishing a recipe | 200, 1k, 6k, 40k, 200k, 1M, 6M, 50M, 200M, 1.75B | yes |
| 4 | Dishin' Out Some Meals | a set meal to Lv: Turkey, Salad, Garlic Bread, Cabbage, Sawdust, Bunt Cake, Mutton, Massive Fig, Giant Tomato, BillJack Pepper | 2,5,7,10,14,17,20,23,27,30 | yes |
| 4 | Cracking Eggs | breed a set mob N times: Squirrel, Piggo, Mallay, Wild Boar, Mecho Mouse, Choccie, Cool Bird, Chippy, Panda, Hedgehog | 5,10,30,50,100,150,200,400,600,1500 | yes |
| 4 | Mob Bullet Bursting | damage in a 5 s Mob Battle window | 200, 1250, 4k, 15k, 80k, 400k, 2.5M, 10M, 75M, 300M | yes |
| 4 | Light 'em Up Up Up | Lab features lit at once | 4, 8, 12, 16, 21, 26, 32, 35, 37, 42 | no |
| 4 | Consolidating Chips | chips equipped across players | 4, 9, 15, 20, 26, 32, 40, 50, 60, 70 | no |
| 4 | Begone Troll! | Troll feats (kill; 20 mindgames; no failed mindgame; 5 chars in order; Chaotic; Chaotic 6 chars; Chaotic within 10 mindgames; Nightmare; Nightmare 10 chars; Nightmare within 5 mindgames with red boxing gloves) | 1,20,1,5,1,6,1,1,10,1 | yes |
| 4 | Achievement Astronaut | W4 achievements | 5,...,70 | no |

Source for the whole table: `data/website-data/tasks.json` (Toolbox pin). [C5: tasks.json filler2] [C6: tasks.json + C1/C2 (computed)] W5-W7: same structure (8 ranked tasks, 120 merits each, 2,600 / 2,960 / 3,320 points); W7 board added 2026-09-05 per prior research. [C6: tasks.json + C1/C2 (computed)] [C43: prior research achievements-tasks-merit.md]

### M3. Daily tasks

Slot 8, resolved via `Tasks[5][w]`; pool W1 28 / W2 17 / W3 17 / W4 2; W1-W4 only in the reset routine; pays base points only; counts for the guild daily "World 1 Task" per an old guide (L). [C7: TB tasks.ts#L8,L45-L55; tasks.json] [C8: N.js daily reset@15114293; rank-up@7262300]
- W1 pool (examples): chop N of a log type, mine N of an ore, say hi to Funguy, "sit noob" at Amarok rubble, sell a boss key to the tiki vendor, drop a leaf on Stiltzcho, wear a Gem Shop hat, send a friend bonus, deposit a statue, smelt 25 iron bars, craft set items; base 2-5. W2: fish/catch N of a type, trash 2 obols, 300 pickups, 69 active kills; "Take a Breather" is a free day; base 4-6. W3: collect a critter, Tower Defence kills, make 4 cogs, check out Star Player, refine any salt, 69 active kills; base 4-8. W4: defeat 1 Crystal monster (4 pts) or 1 Miniboss (6 pts). [C7: TB tasks.ts#L8,L45-L55; tasks.json]

### M4. Unlock points and the Unlocks tab

| Rule | Detail | Field |
|---|---|---|
| Points owned | largest n with `f(n) <= Tasks[4][0]`; thresholds n=1,7,22,60,90,106,119,128 need 10, 68, 325, 1,427, 2,297, 2,761, 3,138, 3,399 points. [C12: TB tasks.ts#L109-L140; N.js UnlockPtsFORMULA] | `account.taskUnlocks.unlockPointsOwned`, `.currentPoints`, `.pointsReq` (next requirement) |
| Available | owned minus bought; unlocks are never "spent" out of Tasks[4][0]. [C13: N.js TaskStuff AvailableUnlocks@6596443] | `unlockPointsOwned - unlockedRecipes` |
| Layout | 7 columns of 16/28/28/32/8/8/8 rows. [C14: taskUnlocks.json; TB tasks.ts#L77-L85] | `account.taskUnlocks.taskUnlocksList[col][row] = {unlocks, unlocked}` |
| Column gating | columns 2-7 open at 7/22/60/90/106/119 unlocks bought AND anvil tab 2-7 owned. [C15: N.js TaskStuff@6598249; wiki Tasks/Unlocks (2026-10-07)] [C41: idleon.wiki Tasks/Unlocks (2026-10-07)] | `unlockedRecipes`; AnvilTabsOwned (currency) |
| Contents (prior research) | col 1: early class weapons and hats, copper/iron rods and nets, small pouches, Blunderbag; col 2: gold/platinum tools, Sandy Satchel, skill boots, pouches; col 3: Dementia/Void tools, Large pouches, Shivering Sack; col 4: Lustre/Starfire tools, Massive pouches, Diabolical set; cols 5-7: Time Candy and gems. Gems per column 160 / 440 / 240 / 95 / 70 / 140 / 40 (prior, M). [C43: prior research achievements-tasks-merit.md] | `taskUnlocks.json` |

### M5. Merit Shop purchase rule

Flat price per level, max level per row, recipe rows gated by boss-task tier `>= 2 + current level`; recipes come in fixed order. [C16: N.js purchase handler@7263400-7265800; shared-data.json merits] [C19: N.js _customEvent_TaskShopPurchase@7441806; shared-data.json extraStr] A guard on `OptionsListAccount[34]` redirects to a popup. [C17: N.js purchase handler@7263400-7265800]

### M6. Merit Shop rows, W1-W4 (every priced row; levels/cost from `shared-data.json` key `merits`; effect from game code)

| W | Row | Max | Cost/lv | Total | Effect (formula) | Level field |
|---|---|---|---|---|---|---|
| 1 | 0 Inventory Bag | 5 | 1 | 5 | applies bag B/C/E/F/H to all characters if character 1 used it (wiki, data) [C40: idleon.wiki Tasks/Blunder_Hills (2026-10-15)] | `Tasks[2][0][0]` |
| 1 | 1 Respawn | 10 | 1 | 10 | Blunder Hills respawn +2%/lv [C20: TB character.ts#L1831-L1837; N.js@6503313] | `Tasks[2][0][1]` |
| 1 | 2 Lowest-level EXP | 12 | 1 | 12 | game 3%/lv vs shop text 4%/lv [C21: N.js@4256197; TB character.ts#L1907,L1929-L1935; wiki Tasks/Blunder_Hills] | `Tasks[2][0][2]` |
| 1 | 3 Goblet of Hemoglobin cap | 10 | 2 | 20 | SkillLevelsMAX[627] = 5*lv [C18: N.js _customEvent_TaskShopPurchase@7441806] | `Tasks[2][0][3]` |
| 1 | 4 Boss keys | 10 | 1 | 10 | key chance lv/25 per drop roll (4%/lv) [C22: N.js@4799914-4916146] | `Tasks[2][0][4]` |
| 1 | 5 Amarok recipes | 5 | 2 | 10 | Shoes, Pants, Torso, Helmet, Pendant; needs Such Rock tier 2..6 [C16: N.js purchase handler@7263400-7265800; shared-data.json merits] [C19: N.js _customEvent_TaskShopPurchase@7441806; shared-data.json extraStr] | `Tasks[2][0][5]` |
| 1 | 6 W1 miniboss star talents | 6 | 3 | 18 | chance 0.1*(1+0.3lv); Baba Yaga/Poop Big drop no books at lv 0 [C23: N.js@3476964,@3477899] | `Tasks[2][0][6]` |
| 2 | 0 Obols | 7 | 1 | 7 | monster obol drops, +5% of base per lv; lv 1 required [C24: N.js@6518309] | `Tasks[2][1][0]` |
| 2 | 1 Respawn | 10 | 1 | 10 | +2%/lv [C20: TB character.ts#L1831-L1837; N.js@6503313] | `Tasks[2][1][1]` |
| 2 | 2 AFK gains | 10 | 1 | 10 | +2% for the first lv characters [C25: N.js AFKgainrates@4438530; TB character.ts#L3237] | `Tasks[2][1][2]` |
| 2 | 3 Convert Better, Darnit! cap | 10 | 1 | 10 | SkillLevelsMAX[630] = 5*lv [C18: N.js _customEvent_TaskShopPurchase@7441806] | `Tasks[2][1][3]` |
| 2 | 4 World-boss gems | 8 | 1 | 8 | chance lv/12 per boss drop roll, counter < 600; text says 7%/lv [C26: N.js@4799243] | `Tasks[2][1][4]` |
| 2 | 5 Efaunt recipes | 5 | 2 | 10 | Shoes, Pants, Torso, Helmet, Ring; Twilight Tombstone tier 2..6 [C19: N.js _customEvent_TaskShopPurchase@7441806; shared-data.json extraStr] | `Tasks[2][1][5]` |
| 2 | 6 W2 miniboss star talents | 8 | 3 | 24 | as W1 [C23: N.js@3476964,@3477899] | `Tasks[2][1][6]` |
| 2 | 7 Arcade balls | 5 | 2 | 10 | +5%/lv ball gain [C27: TB dungeons.ts#L105; N.js@7827764] | `Tasks[2][1][7]` |
| 3 | 0 Build/Food slots | 4 | 3 | 12 | build slots ceil(lv/2), food slots floor(lv/2) [C28: N.js@7815772,@15245561] | `Tasks[2][2][0]` |
| 3 | 1 Respawn | 10 | 1 | 10 | +2%/lv [C20: TB character.ts#L1831-L1837; N.js@6503313] | `Tasks[2][2][1]` |
| 3 | 2 Talent Library | 5 | 2 | 10 | +2 max book Lv per lv [C29: TB misc.ts#L315-L330; N.js@7820464] | `Tasks[2][2][2]` |
| 3 | 3 Telekinetic Storage cap | 10 | 1 | 10 | SkillLevelsMAX[634] = 5*lv [C18: N.js _customEvent_TaskShopPurchase@7441806] | `Tasks[2][2][3]` |
| 3 | 4 Printer sample size | 10 | 1 | 10 | min(5, 0.5*lv)% [C30: TB character.ts#L3023-L3035; N.js@7816350] | `Tasks[2][2][4]` |
| 3 | 5 Chizoar recipes | 5 | 2 | 10 | Shoes, Pants, Torso, Helmet, Pendant; Chill Out tier 2..6 [C19: N.js _customEvent_TaskShopPurchase@7441806; shared-data.json extraStr] | `Tasks[2][2][5]` |
| 3 | 6 Refinery salt costs | 5 | 2 | 10 | cost exponent 1.3 not 1.5 for the first lv salts [C31: TB refinery.ts#L45; N.js@7773788] | `Tasks[2][2][6]` |
| 4 | 0 Crystal spawns | 3 | 3 | 9 | +1 guaranteed crystal kill/day per lv [C32: TB misc.ts#L257-L265; N.js@10946303] | `Tasks[2][3][0]` |
| 4 | 1 Respawn | 10 | 1 | 10 | +2%/lv [C20: TB character.ts#L1831-L1837; N.js@6503313] | `Tasks[2][3][1]` |
| 4 | 2 Nest egg capacity | 2 | 6 | 12 | +1 egg slot per lv [C33: TB breeding.ts#L184; N.js@7922026] | `Tasks[2][3][2]` |
| 4 | 3 Spice Spillage cap | 5 | 1 | 5 | SkillLevelsMAX[651] = 20*lv [C18: N.js _customEvent_TaskShopPurchase@7441806] | `Tasks[2][3][3]` |
| 4 | 4 Lab connection range | 8 | 2 | 16 | +1 range per lv [C34: TB lab.ts#L128] | `Tasks[2][3][4]` |
| 4 | 5 Troll recipes | 4 | 2 | 8 | Shoes, Pants, Torso, Helmet; Begone Troll tier 2..5 [C19: N.js _customEvent_TaskShopPurchase@7441806; shared-data.json extraStr] | `Tasks[2][3][5]` |
| 4 | 6 No Bubble Left Behind | 3 | 5 | 15 | +1 bubble per day per lv [C35: TB alchemy.ts#L1104; N.js@11084182] | `Tasks[2][3][6]` |

Hidden placeholder rows (`meritCost: null`, not shown): row 7 of each world. W3 row 7 (miniboss star-talent drops) has real text but a Blank icon, so it is a not-yet-released row, not a pure placeholder; W4 row 7 is named `IDK_YET`. (H, data) [C36: shared-data.json merits (computed)] Display text is built by `getMeritDescription` (parsers/tasks.ts#L16-L22) and exposed as `account.meritsDescriptions[w][j]`.
W5+ one-liners: W5 (Smoldering Plateau): Tab-4 talent points, respawn, loot-pile capacity, Stat Overload cap, Sailing/Divinity/Gaming EXP, Kattle recipes, atom upgrade cost; W6 (Spirited Valley): Tab-5 talent points, respawn, farming EXP/OG chance and land plots, Jade gain, Summoning winner bonuses, Emperor recipes; W7 (Shimmerfin Deep): Spelunking POW and stamina, respawn, Research points, Minehead currency, Nautilus recipes. [C38: shared-data.json merits; TB parsers]

### M7. Other mechanics touching the system

- Meritocracy (voting) is unrelated to merits. [C39: TB misc.ts#L257; voteBallot.ts]
- Achievement tasks cannot be fully ranked: W1 has 63 real achievements while its last tier asks for 70 (prior research, M). Steam-only achievements complete only on the Steam client. [C43: prior research achievements-tasks-merit.md]
- Test accounts in prior research had unspent merits and unclaimed unlocks (aggregate). [C47: prior fixtures note]

### M8. Additions from verification (missed mechanics)

- **Crafting costs per recipe level.** The wiki Blunder_Hills page lists the items to craft for each level of a task unlock (Fewest Materials / Lowest Level First views), so recipe-unlock rows carry anvil crafting costs per level that this dossier does not catalogue. Unresearched; L. [C40: idleon.wiki Tasks/Blunder_Hills (2026-10-15)]
- **Unlock row contents.** What each of the 128 task-unlock rows grants (taskUnlocks.json, columns 16/28/28/32/8/8/8) is only summarised in M4, not catalogued row by row. Gap for the spec phase. (H that the data exists, L for the summary) [C14: taskUnlocks.json]
- **Upgrade Vault.** The Vault's "Vault Tasks" bonus counts `tasks[3]` unlock flags equal to 1 per world (total bought unlocks) as a kill-counter input, so unlock purchases feed the Vault. (H) [C48: TB world-7/upgradeVault.ts]
- **Tome.** `tasks[0][0][2]` (W1 Super Explosive Gameplay AFK-hours counter) and `calcTotalTasks` (tiers of slots 0-7) both feed the Tome. (H) [C37: TB tasks.ts#L24-L95]
- **Per-tier non-merit bonuses.** Come 'ere Critters! (W3) gives +2% shiny chance per tier, consumed in world-3/traps.ts L181 via `tasks[1][2][5]`. Other tiers' non-merit bonuses exist in code (e.g. W6 `tasks[2][5][2]` farming/loot); the only W1-W4 one found is the shiny task. (H) [C49: TB world-3/traps.ts#L181]
- **Applied value vs row text.** Code multipliers differ from data `bonusPerLevel` for some rows (W5 EXP 10x vs data 5; W5 atom cost 7x vs data 5; W1 lowest-level EXP 3 vs 4), so never trust row text as the applied number; use the Toolbox consumer. (H) [C38][C21]
- **Reset-on-claim beyond W4.** W5-W7 each have one further reset-on-claim task (Kruk, Emperor, Nautilus) and 120-merit boards; the 12 resetting tasks in this dossier cover W1-W4 only. Generic reset-flag handling should read `filler2` rather than hardcode the 12. (H) [C5: tasks.json filler2]
- **W1 Achievement Hunter oddity.** The shifted data layout may change its base points and the W1 task-point total (see C6, C45). (L)

## Min-max by stage

Priority orders below are the closest thing to community meta; most per-row orders are internal prior research (tier 4) because the public community sources checked have no row-by-row merit order. [C42: shnaps gist (2026-09-18)] [C43: prior research achievements-tasks-merit.md] Where views differ both are shown.

**Task Board (all stages)**
1. Claim every ready tier by hand; on reset-flag tasks claim the moment a tier is ready. [C4: N.js@7262300-7263500; tasks.json]
2. Do the four dailies each reset (under a minute each; they feed unlock points only). [C7: TB tasks.ts#L8,L45-L55; tasks.json]
3. Spend unlock points; open columns by reaching 7 / 22 / 60 / 90 / 106 / 119 unlocks and owning the matching anvil tab. [C15: N.js TaskStuff@6598249; wiki Tasks/Unlocks (2026-10-07)]

**W1 early:** Task Board: Nakedknuckle tiers 1-5 (unequip weapon), Stamp Coolection, Just One More, first Pack Mule tiers, Such Rock tiers 1-2; unlock column 1 class weapons and pouches, then Blunderbag. [C43: prior research achievements-tasks-merit.md]
Merit Shop order (prior research, L/M): 1) Goblet of Hemoglobin x1 [C42: shnaps gist (2026-09-18)] [C43: prior research achievements-tasks-merit.md]; 2) respawn to 10; 3) lowest-level EXP and Boss Keys alternately (EXP matters while adding characters); 4) Amarok recipes the moment each Such Rock tier lands; 5) one level of W1 star-talent drops; 6) Goblet to 5-10; 7) Bag row (cheap at 5 merits, helps every character; the old guide ranks it last, prior research moves it up with many characters). [C43: prior research achievements-tasks-merit.md] [C40: idleon.wiki Tasks/Blunder_Hills (2026-10-15)]
**W1 late / W2 early:** Such Rock tiers 3-6 gate Amarok recipes 2-5; keep unlocking toward 7 unlocks plus anvil tab 2. [C19: N.js _customEvent_TaskShopPurchase@7441806; shared-data.json extraStr] [C15: N.js TaskStuff@6598249; wiki Tasks/Unlocks (2026-10-07)]

**W2 mid:** Task Board: unlock W2 via Desert Davey (level 50), rank USPS, bubbles, Maximum Efficiency passively; Twilight Tombstone tiers 2-6 gate Efaunt recipes. [C10: idleon.wiki/wiki/Tasks (2026-10-03)] [C19: N.js _customEvent_TaskShopPurchase@7441806; shared-data.json extraStr]
Merit Shop order, ActiveOn's current Check (internal PV 7.2): Obol x1, AFK gains up to character count, respawn, boss gems, Obol rate, arcade balls, Efaunt recipes; skip Convert Better. [C44: packages/knowledge/systems/merit-shop.yaml, task-board.yaml, task-unlocks.yaml]
Alternative order in prior dossier: Obol x1, boss gems to 8, AFK gains to character count, Efaunt recipes as gated, then respawn, arcade, Convert Better, star talents. Both agree on Obol x1 first; they differ on respawn versus boss gems (M). [C43: prior research achievements-tasks-merit.md]

**W3 late:** Task Board: Iceland Irwin quest; Printer and Refinery tasks grow passively; My Shrines and Chill Out gate Chizoar recipes (8 characters needed for "8 chars in order"); push to 22 unlocks plus anvil tab 3. [C9: N.js _event_TASKS@7254340] [C19: N.js _customEvent_TaskShopPurchase@7441806; shared-data.json extraStr]
Merit Shop: contested. View A (PV 7.3, gist 2026-09-18): Telekinetic Storage x1 and Talent Book Library first. View B (W3 dossier): Build/Food slot row first, then Library to 5, Printer to 10, Telekinetic x1, Salt row as Refinery tiers grow, Chizoar recipes as gated, respawn. The public gist only confirms the salt merit as a mid-late W3 buy. Confidence L either way. [C44: packages/knowledge/systems/merit-shop.yaml, task-board.yaml, task-unlocks.yaml] [C43: prior research achievements-tasks-merit.md] [C42: shnaps gist (2026-09-18)]

**W4:** Task Board: Neddy's quest; Cooking, Breeding and Lab tasks follow those systems; Begone Troll gates Troll recipes; column 4 at 60 unlocks. [C9: N.js _event_TASKS@7254340] [C15: N.js TaskStuff@6598249; wiki Tasks/Unlocks (2026-10-07)]
Merit Shop: No Bubble Left Behind x3 as soon as the Lab bonus exists (prior; gist per prior, L), then Lab range, Nest egg capacity, Crystal row, Spice Spillage, Troll recipes as gated, respawn. [C43: prior research achievements-tasks-merit.md] [C35: TB alchemy.ts#L1104; N.js@11084182]

**Per class:** no class dependence; "chars 1..N in order" boss tiers need low-index characters strong enough. Hemoglobin is most useful on low-sustain AFK fighters (M).

## Common mistakes and detection

| Mistake | Detection from the save |
|---|---|
| Never opening the board, ready tiers unclaimed | `tasksDescriptions[w][i].stat >= requirement` and `level < maxLevel` [C37: TB tasks.ts#L24-L95] |
| Overshooting a reset-flag task | same check on the 12 reset tasks; excess is lost [C5: tasks.json filler2] |
| Hoarding merits | `Tasks[4][w+1] >=` cost of the next unmaxed row [C37: TB tasks.ts#L24-L95] [C36: shared-data.json merits (computed)] |
| No Obol merit after W2 unlock | W2 board open and `Tasks[2][1][0] == 0` [C24: N.js@6518309] |
| No boss-gem merit | `Tasks[2][1][4] == 0` [C26: N.js@4799243] |
| W2 AFK-gains beyond character count | `Tasks[2][1][2] > characters.length` (wasted) [C25: N.js AFKgainrates@4438530; TB character.ts#L3237] |
| Missing W3 slot row or Library row | `Tasks[2][2][0] < 4` or `Tasks[2][2][2] < 5` [C28: N.js@7815772,@15245561] [C29: TB misc.ts#L315-L330; N.js@7820464] |
| Raised star-talent cap but no star points spent | `Tasks[2][w][3] > 0` and the character's talent level 0 [C18: N.js _customEvent_TaskShopPurchase@7441806] |
| Unspent unlock points | `unlockPointsOwned - unlockedRecipes > 0` with an unbought row in an open column [C13: N.js TaskStuff AvailableUnlocks@6596443] |
| Skipping dailies | `tasksDescriptions[w][8].level === 0` [C46: TB tasks.ts#L44-L65; task-board.yaml] |
| Board not unlocked | quest flag missing and `Tasks[1][w]` all 0 [C9: N.js _event_TASKS@7254340] |
| Free merits left on easy tiers | `Tasks[1][0][3]==0` or `[1][0][4]==0` late into W2 [C47: prior fixtures note] |

## Save and Toolbox fields

- Raw: `Tasks[0]` progress, `[1]` tiers (slot 8 daily), `[2]` merit levels, `[3]` unlocks, `[4][0]` cumulative task points, `[4][w+1]` unspent merits of world w, `[5][w]` today's daily index (raw keys `TaskZZ0..TaskZZ5`). [C37: TB tasks.ts#L24-L95]
- Toolbox (parsers/tasks.ts#L24-L95): `account.tasks`, `account.tasksDescriptions[w][0..8]`, `account.meritsDescriptions[w][j] = {descLine1, totalLevels, meritCost, extraStr, bonusPerLevel, level, description}`, `account.taskUnlocks = {taskUnlocksList, unlockedRecipes, unlockPointsOwned, currentPoints, pointsReq}`; `calcTotalTasks` counts tiers of slots 0-7 for the Tome. [C37: TB tasks.ts#L24-L95]
- Consumer parsers (ADR 0005, use Toolbox numbers where it computes them): respawn character.ts#L1831, lowest EXP character.ts#L1929, AFK gains character.ts#L3237, printer character.ts#L3023, Library misc.ts#L330, crystals misc.ts#L260, Refinery world-3/refinery.ts#L45, Lab world-4/lab.ts#L128, Breeding world-4/breeding.ts#L184, NBLB world-2/alchemy.ts#L1104, Arcade dungeons.ts#L105. [C20: TB character.ts#L1831-L1837; N.js@6503313]-[C35: TB alchemy.ts#L1104; N.js@11084182]
- ActiveOn today: Checks and detectors exist for unspent merits, daily tasks and unspent unlocks; per-row merit orders exist for W2 only. [C44: packages/knowledge/systems/merit-shop.yaml, task-board.yaml, task-unlocks.yaml]

## ActiveOn gaps and build notes (for the spec phase)

- Not yet systemised: per-tier claimable detector (ready-to-claim tiers, reset-flag urgency), tier-by-tier progress with ETA, recipe-row gate state (boss tier vs bought level), merit order Checks for W1/W3/W4 and rows by id, star-talent cap-vs-spent gap, column-gating state (bought vs threshold vs anvil tab). [C44: packages/knowledge/systems/merit-shop.yaml, task-board.yaml, task-unlocks.yaml]
- Sprites to create if a dedicated Merit/Tasks view is built: board tab icons per world, a merit coin, task-point trophy, unlock-column lock states, reset-flag warning badge; the game's own icon keys per row are in `merits[].icon` (e.g. TaskSa1, TaskSb3, SmithingRecipes1). [C36: shared-data.json merits (computed)]

## Open questions

See the structured output; summary: W1 Achievement Hunter point base; real EXP row value (3 vs 4); real boss-gem cap; option 34 purchase gate; GenINFO[20] column thresholds; whether NBLB merit works without the Lab bonus; community order W3/W4 unverified (search quota exhausted); item names behind AnvilCraftStatus indices.

## Claim register

| Claim | Tier | Conf | Verified | Source |
|---|---|---|---|---|
| C1 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/tasks.ts#L12 ; https://www.legendsofidleon.com/ytGl5oc/N.js _customBlock_TaskStuff 'MeritsGiven' @6597194 (game v1.23, file dated 2026-10-17) |
| C2 | 1 | M | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js task rank-up handler @7263400-7263700 ; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/tasks.json |
| C3 | 1 | H | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js @7263511 (guard 8!=DummyNumber) ; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/tasks.ts#L62 Line anchor imprecise: logic sits around tasks.ts L44-L65; game-side write unverifiable locally. |
| C4 | 1 | M | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js @7262300-7263500 ; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/tasks.json (filler2 field) |
| C5 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/tasks.json |
| C6 | 1 | H (W2-W7 and merits); L (W1 task points 719) | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/tasks.json ; computed 2026-10-19 with the formulas of C1 and C2 Verifier correction: W1 719 assumes Achievement Hunter base 2; if base is 5 (sibling pattern) W1 is 746, unconfirmed. |
| C7 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/tasks.ts#L8-L9,L45-L55 ; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/tasks.json |
| C8 | 1 | L | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js @15113900-15114300 and @7262300 Unverifiable locally (N.js not accessible to verifiers). |
| C9 | 1 | L | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js _event_TASKS @7254340 |
| C10 | 2 | M | 2026-10-19 | https://idleon.wiki/wiki/Tasks (last edited 2026-10-03, fetched 2026-10-19) |
| C11 | 1 | L | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js _event_TASKS @7254340 |
| C12 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/tasks.ts#L109-L140 ; https://www.legendsofidleon.com/ytGl5oc/N.js 'UnlockPtsFORMULA' in _customBlock_TaskStuff @6596443 |
| C13 | 1 | M | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js _customBlock_TaskStuff 'AvailableUnlocks' @6596443 |
| C14 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/taskUnlocks.json ; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/tasks.ts#L77-L85 |
| C15 | 1 | L | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js 'UnlockColumnsOpened' @6598249 ; https://idleon.wiki/wiki/Tasks/Unlocks (edited 2026-10-07) |
| C16 | 1 | M | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js @7263400-7265800 ; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/shared-data.json key 'merits' (num1,num2,num3) |
| C17 | 1 | L | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js @7264700-7265300 |
| C18 | 1 | M | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js _customEvent_TaskShopPurchase @7441806 |
| C19 | 1 | M | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js @7441806 ; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/shared-data.json merits extraStr |
| C20 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/character.ts#L1831-L1837 ; https://www.legendsofidleon.com/ytGl5oc/N.js @6503313 |
| C21 | 1 | H | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js @4255626-4256400 ; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/character.ts#L1907,L1929-L1935 ; https://idleon.wiki/wiki/Tasks/Blunder_Hills (2026-10-15) Code uses 3 per level for the strictly lowest class level; shop data/wiki say 4. Both recorded; code wins (tier 1) but real game value unconfirmed. |
| C22 | 1 | M | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js @4799914, @4810372, @4821765, @4908112, @4916146 |
| C23 | 1 | M | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js @3476964-3478400 |
| C24 | 1 | M | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js @6518309-6521300 |
| C25 | 1 | H | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js AFKgainrates @4438530 ; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/character.ts#L3237 |
| C26 | 1 | M | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js @4799243 ; shared-data.json bonusPerLevel 7 |
| C27 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/dungeons.ts#L105 ; https://www.legendsofidleon.com/ytGl5oc/N.js @7827764 |
| C28 | 1 | M | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js @7815772 and @15245561 |
| C29 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/misc.ts#L315-L330 ; https://www.legendsofidleon.com/ytGl5oc/N.js @7820464 |
| C30 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/character.ts#L3023-L3035 ; https://www.legendsofidleon.com/ytGl5oc/N.js @7816350 |
| C31 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/refinery.ts#L45 ; https://www.legendsofidleon.com/ytGl5oc/N.js @7773788 |
| C32 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/misc.ts#L257-L265 ; https://www.legendsofidleon.com/ytGl5oc/N.js @10946303 |
| C33 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-4/breeding.ts#L184 ; https://www.legendsofidleon.com/ytGl5oc/N.js @7922026 |
| C34 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-4/lab.ts#L128 |
| C35 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-2/alchemy.ts#L1104 ; https://www.legendsofidleon.com/ytGl5oc/N.js @11084182 |
| C36 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/shared-data.json key 'merits' ; computed 2026-10-19 |
| C37 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/tasks.ts#L24-L95 ; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/index.ts#L145-L173 |
| C38 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/shared-data.json ; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/character.ts#L1225 ; parsers/world-5/sailing.ts#L86 ; world-7/*.ts Note: some W5 code multipliers differ from data bonusPerLevel (EXP 10x vs data 5; atom cost 7x vs data 5), so row text is not always the applied value. |
| C39 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/misc.ts#L257 ; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-2/voteBallot.ts#L28 |
| C40 | 2 | M | 2026-10-19 | https://idleon.wiki/wiki/Tasks/Blunder_Hills (edited 2026-10-15, fetched 2026-10-19) |
| C41 | 2 | M | 2026-10-19 | https://idleon.wiki/wiki/Tasks/Unlocks (edited 2026-10-07, fetched 2026-10-19) |
| C42 | 4 | L | 2026-10-19 | https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa (updated 2026-09-18, fetched 2026-10-19; claimDate 2026-09-18) |
| C43 | 4 | L | 2026-10-19 | git origin/research/account-wide:docs/research/systems/account-wide/achievements-tasks-merit.md ; https://docs.google.com/document/d/1D9xRQ36p79FOzyKpf3wvWohKnO2pt47JgpPXeLnwmjc (stale) |
| C44 | 1 | M | 2026-10-19 | packages/knowledge/systems/merit-shop.yaml ; task-board.yaml ; task-unlocks.yaml ; detectors/merit-shop/unspent.ts |
| C45 | 1 | M | 2026-10-19 | https://www.legendsofidleon.com/ytGl5oc/N.js TaskDescriptions (Achievement_Hunter row) ; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/tasks.json W1 slot 7 Both lenses: data fields are shifted (filler1=5, x=2|0|Filler_lol); sibling achievement tasks use the world base, so true base likely 5; how the game parses it is unconfirmed. |
| C46 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/tasks.ts#L44-L65 ; packages/knowledge/systems/task-board.yaml |
| C47 | 4 | L | 2026-10-19 | prior research achievements-tasks-merit.md (the two test accounts, aggregate counts only) |
| C48 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-7/upgradeVault.ts (verifier-reported; line not recorded) |
| C49 | 1 | H | 2026-10-19 | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/traps.ts#L181 |
