# Resets, Dailies, Weekly Bosses, Boss Keys, Happy Hours and Events

Research date 2026-10-17, game v1.23 "Lumi Menagerie" (N.js Last-Modified 2026-10-17). Builds on [the mechanics note](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md) (daily reset = `TimeAway.ShopRestock`; weekly = `OptionsListAccount[39]`; Happy Hours server-global).

Shorthand used in this file:
- `TB` = `https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/` (Toolbox commit 6827d3f, 2026-10-17).
- `N.js @n` = character offset in `https://www.legendsofidleon.com/ytGl5oc/N.js` (v1.23, Last-Modified 2026-10-17). I cite a symbol or string next to each offset, because offsets move with every patch.
- `OLA[n]` = `OptionsListAccount[n]`, which Toolbox parses as `account.accountOptions[n]`.
- Confidence: **H** means I read it in code or data. **M** means I inferred it from minified control flow. **L** means community or wiki prose only.

### Key findings

- **Three clocks, not one.** (1) The **per-account daily** reset is `ShopRestock`, a countdown anchored to account creation time and shiftable with Pocketwatches. (2) The **per-account weekly** reset rides on it via `OLA[39]`. It covers Killroy, guild weekly tasks, giant-mob odds, dungeon boosted runs and weekly Gem Shop limits. (3) **Server-global** timers run on the Unix week, which starts Thursday 00:00 UTC. They cover the Weekly Battle boss rotation, Happy Hours, hourly Random Events, the Bonus Ballot (rolls Monday about 17:02 UTC) and Meritocracy (Thursday about 17:02 UTC, W7 only) (H).
- **Catch-up is uneven.** Boss keys and Colosseum tickets bank **at most 3 days** at their NPC. World teleports catch up for only 10 missed days. Island day counters cap at 10, 13 or 14 days. Minigame plays, the Random Event, guild login GP, guaranteed crystals, boss gem drops and the Weekly Battle raid reset do **not** bank at all (H). For most W1–W3 dailies, one Play Session every 3 days loses only the no-bank items.
- **Killroy skulls are wiped at the weekly reset.** They reset to the W7 Royal Armory stipend, which is 0 before W7 (`OLA[105] = max(ArmoryUpgBonus, 0)`, H). Spend them every week. Community consensus is Arcade balls first (capped at 50 purchases a week), then refinery cycles.
- **Weekly Battles:** 35 trophies a week (6+7+7+7+8), plus 1 per kill for each of 2 Equinox clouds. They drop only on a new weekly best difficulty. The boss, its tasks, actions and trophy shop are server-seeded, so the **next 10 weeks are predictable** (Toolbox `getWeeklyBoss`). The once-a-day "reset the raid" **wipes the week's MISC buffs** (Class EXP and damage, each capped at 150%) (H/M).
- **Happy Hour boosted runs only work in a party of 3 or more.** During the 1-hour window, the first Happy Hour run of each account week can spend up to 20 boosted runs at once (`OLA[93]`). Later ones spend up to 3. The current server list holds 17 windows a week (H).
- **Boss key output is "characters who finished the NPC quest, per day".** Forest Villa keys come from Dog Bone, Efaunt keys from Djonnut, Chizoar keys from Bellows. So every character that finishes those quest lines adds +1 key a day (H). Possible game bug: the **daily auto-claim** credits Bellows' keys to the Forest Villa Key slot (`KeysAll[0]`), not Chizoar's (`[2]`). The manual EZ-Access claim drops the right key (M).
- **Random Events** run on one server-wide hourly seed. There is a 21.3% chance per hour of Meteorite, Mega Grumblo, Glacial Guild, Snake Swarm or Angry Frogs on a W1–W3 map, and you can complete **one per account per daily reset** (`OLA[137]`). Toolbox can list the next 100 hours (H).

## Daily and weekly resets

- **What it is:** The account's reset clocks and everything they refill. The daily routine runs once per reset trigger, and some sub-steps repeat once per missed day. The weekly routine runs inside the daily loop when the weekly counter goes negative. Separately, some systems roll on server-global timers.
- **Unlocks:** From account creation. A new account sets `ShopRestock = 86400` and `PostOfficeRefresh = 86400` (N.js @22111047), so the first daily reset lands 24 h after creation, and that time of day sticks. Each item below is gated by its own System.
- **Scope:** Account-wide clocks (`TimeAway` is per account). A few refills are per character: minigame plays and the insta-revive are written to every character's `PersonalValuesMap` (N.js daily loop @15114421, H).
- **Inputs → outputs:** Input: wall-clock time. Online, `ShopRestock` drops by 1 each second. On login it drops by the seconds away (`_customBlock_AwayTimers`, N.js @6463127). **Silver Pocketwatch** moves it ±900 s. **Gold Pocketwatch** does −86400 and `OLA[39] += 1`, which forces an extra daily reset without moving the weekly reset. Output: the refills listed in the catalogue below.

  How the routine runs (all H, N.js):
  1. **Trigger** `if (0 >= ShopRestock)` (@15079903). The steps here run **once**, however many days were missed: guild login GP, Random Event flag, crystal and boss-gem counters, Post Office day, Merit-task reroll, Lab and Hole items and similar.
  2. **Daily loop** `for (_DailyRepeatINDEX = 0; ShopRestock <= 0;)` (@15114421). It runs **once per missed day** (`ShopRestock += 86400` each pass). It covers shop restock, key and ticket day counters, teleports, minigame plays, vial attempts, Liquid Shop stock, Picnic Stowaway daily quests, the weekly-boss raid flag and island day counters. Some steps are capped by pass index: `_DailyRepeatINDEX < 10` for teleports, `< 5` for the miniboss day counters, `< 100` for coral. There are safety clamps at −110 and −1100 days. Each pass ends with `OLA[39] -= 1`.
  3. **Weekly block** `if (0 > OLA[39])` (after the loop, @≈15125300). It runs **once**, then adds 7 until `OLA[39] ≥ 0`.

- **Goals and Milestones:**

  | Milestone | Why it matters | Detect |
  |---|---|---|
  | Know the reset time | Every daily Goal is timed off it. | `timeAway.ShopRestock − (now − timeAway.GlobalTime)` s (Toolbox [`hoursUntilDailyReset`, TB utility/helpers.js#L655](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/helpers.js#L655)) |
  | Reset aligned with the player's routine | A reset that falls just before the usual Play Session makes every daily collectable in one visit. Silver Pocketwatch moves it 15 min per use (2 trophies in the Weekly Battle shop, when it rotates in). | Compare the reset clock time with the player's usual session hours. |
  | Visit at least every 3 days | Keys and tickets bank 3 days at most. | `OLA[16]`, `[31]`, `[80]` (keys) and `OLA[15]`, `[35]`, `[56]` (tickets) ≥ 3 |
  | Before the weekly reset: spend Killroy skulls, finish guild weeklies, use boosted runs | Skulls are wiped. Other weeklies are lost. | Weekly reset at `ShopRestock + 86400·OLA[39]` s |

  **Catalogue: everything that resets daily or weekly (W1–W4).**

  | Item (System) | Cadence and clock | Catch-up cap | What to do | Save field (H unless marked) |
  |---|---|---|---|---|
  | Vendor shops restock (W1–W4 town shops) | Daily, account | No bank. Stock is rebuilt to `ShopQTY × ShopQtyBonus`. | Buy the tracked items (Toolbox `shops` alert). | `account.shopStock` ([TB account.js#L148](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/account.js#L148)) |
  | Forest Villa Key (Dog Bone, W1) | Daily, account. +1 per character whose Dog Bone dialogue is > 5. | **3 days** at the NPC | Walk to Dog Bone (or use EZ Access) on a character that finished his quests. | `OLA[16]` days since; `currencies.KeysAll[0]` |
  | Efaunt's Tomb Key (Djonnut, W2) | Daily. +1 per character whose Djonnut dialogue is > 5. The character collecting needs > 6. | 3 days | Same. | `OLA[31]`; `KeysAll[1]` |
  | Chizoar's Cavern Key (Bellows, W3) | Daily. +1 per character whose Bellows dialogue is > 8.5. | 3 days | Same. | `OLA[80]`; `KeysAll[2]` |
  | Colosseum Tickets (Typhoon W1, Centurion W2, Lonely Hunter W3) | Daily. **1 per NPC per day**, not per character. | 3 days each | Collect from each NPC. | `OLA[15]`, `[35]`, `[56]`; `currencies.ColosseumTickets` |
  | World teleports | Daily +22. Bribe Fake Teleport Tickets adds 2 + Counterfeit Telepassports. Gem Shop Daily Teleports adds 13 per purchase. | 10 missed days. The total is clamped to `100 + 160 × purchases` when the daily top-up runs. | Spend them, because they stop accruing at the cap. | `currencies.WorldTeleports` |
  | Daily minigame plays | Daily, **set** (not added) to 5 + 4 per Gem Shop "Daily Minigame Plays" | None (M on the exact base) | Use them on the W1–W2 minigames. | `OLA[33]` / `currencies.minigamePlays` |
  | Insta-revive | Daily, 1 per character | None | n/a | per-character `PersonalValuesMap.InstaRevives` |
  | Random Event | One completion per daily reset | None | See **Events**. | `OLA[137]` (0 = not done today) |
  | World-boss gem drops (needs W2 Merit "World bosses can drop gems") | Daily, first 150 boss kills | None | Kill daily or weekly bosses up to 150 to farm gems. | `OLA[195]` (+4 per kill; available = (600 − OLA[195]) / 4) ([TB account.js#L243](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/account.js#L243)) |
  | Guaranteed crystal mobs | Daily | None | Kill until used up (W1–W3 accounts usually have 0. Sources are the Shiny Beacon sigil, a W4 Merit and an achievement). | `OLA[101]` against `getGuaranteedCrystalMobs` ([TB misc.ts#L253](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L253)) |
  | Daily Merit/Task (the 9th task in each world) | Daily reroll (`Tasks[0][w][8] = Tasks[1][w][8] = 0`) | None | See Achievements/Tasks. | `tasksDescriptions[w][8]` (Toolbox `tasks` alert) |
  | Guild login GP | Daily, once per reset: +10 GP (20 with the Guild VIP Fraud bribe, 30 with Guild GP Hack), plus a Ballot GP bonus if that bonus won | None | Log in. | n/a (server-side guild) |
  | Guild daily tasks | Daily reroll | None | See Companions/Guild/Family. | `guild.guildTasks.daily` |
  | Guild weekly tasks and weekly guild gifts | Weekly, account | None | Same. | `guild.guildTasks.weekly`; `OLA[41]` = 2 + Guild Gifts bonus |
  | Post Office daily orders | Daily, once per reset (completed orders roll new; streak shields tick) | None | See Post Office (W2). | `postOfficeShipments`, `timeAway.PostOfficeRefresh` |
  | Alchemy vial attempts, Liquid Shop daily stock (incl. "A Pair of Gems") | Daily | None | See Alchemy (W2). Buying the Liquid Shop gems is free daily gem income. | `CauldronP2W[5][0]`, `CauldronInfo[10]` |
  | Picnic Stowaway daily quest line (W1 Froggy Fields) | Daily (quests index ≥ 20 reset) | None | Golden food, Picnic Tokens and a gem ([wiki Quests Blunder Hills](https://idleon.wiki/wiki/Quests_Blunder_Hills)). | `NPCdialogue.Picnic_Stowaway` |
  | Dr Defecaus (W1 sewers boss) | Daily, re-armed by the reset (`MonsterRespawnTime[149] = 2`) | None | Kill once a day if wanted. | Not in the cloud save. Toolbox infers it from Death Note kills ([TB bossRespawns.js](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/bossRespawns.js#L1-L9)). |
  | Baba Yaga (W1 Birch Enclave) | 80,400 s (22.3 h) after a kill, wall clock | n/a | Same. | Same |
  | Weekly Battle raid reset | **Daily** (`OLA[190]` → 0) | None | See **Weekly bosses**. | `OLA[190]` |
  | Island Expeditions day counters (W2) | Daily +1. Caps: 10 (main, unless a 161 upgrade), 13, 14 (Crystal Island). | Capped | See W2 Islands. | `OLA[160]`, `[170]`, `[171]` |
  | Dilapidated Slush (W3) and Mutated Mush (W4) minibosses | Daily day counters, only for the first 5 passes of a catch-up. The boss count is `min(10, ⌊(d−3)^0.55⌋)` and `min(8, ⌊(d−3)^0.5⌋)`. | Count cap 10 / 8 | Kill when the count is worth it. Slush drops Chizoar keys ([wiki Chizoar](https://idleon.wiki/wiki/Chizoar)). | `OLA[96]`, `[98]` ([TB misc.ts#L1533](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L1533)) |
  | Glimmerwick Candle wish (event item) | Daily | None | One wish a day while you hold it. | `OLA[492]`, `[491]` |
  | Daily Gem Shop limits (time-candy packs, Miracle Chest, Bottled Wind, etc.) | Daily | None | See Gem Shop. | `gemShopPurchases[13, 47–50, 54, 127, 128, 132, 136, 138, 140, 150, 151]` (and `[0]`) |
  | Weekly Gem Shop limits (talent resets, Pandora's Office Box, Console Chip, Mainframe Jewel, Ancient Artifact) | Weekly, account | None | Same. | `gemShopPurchases[73, 74, 76, 121, 122, 134]` |
  | Killroy runs, skulls, Arcade-ball purchases (50 a week) | Weekly, account. Room selection is seeded on the account's weekly boundary. | **Skulls wiped** | See Killroy below. | `OLA[113]` rooms done, `OLA[105]` skulls, `OLA[417]` ball buys |
  | Dungeon boosted runs | Weekly +12, +3 per Gem Shop "Weekly Dungeon Boosters". If ≥ 7 days overdue, extra `(8 + 2·purchases) × min(2, ⌈overdue/7⌉)`. | Partial | Use them in Happy Hours (see below). | `OLA[76]` ([TB dungeons.ts#L43](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/dungeons.ts#L43)) |
  | 20× Happy Hour flag | Weekly, account | n/a | First Happy Hour party run of the week. | `OLA[93]` (1 = available) |
  | Giant-monster spawn odds | Weekly reset of the counter | n/a | Only with the Tachion of the Titans prayer. See **Events**. | `OLA[57]` giants this week |
  | Divinity link reset (W5) | Weekly | n/a | Out of scope (W5) | `Divinity[38] = 2` |
  | Weekly Battle boss and trophy shop | **Server week** (Thursday 00:00 UTC) | n/a | See **Weekly bosses**. | `OLA[191]` week id, `OLA[189]` best difficulty |
  | Bonus Ballot | Server, rolls about Monday 17:02:20 UTC | n/a | Vote once a period (free). | `OLA[308]` my vote (0 = none), `OLA[309]` ballot week |
  | Happy Hours | Server, fixed list (seconds of the Unix week) | n/a | See **Happy Hours**. | `serverVars.HappyHours` |
  | Random Event schedule | Server, hourly | n/a | See **Events**. | `serverVars.RandEvntHr` |

  **Not reset items** (the brief asked about them): **Silver Pens** are drops (e.g. world bosses, [wiki Amarok](https://idleon.wiki/wiki/Amarok)). The W3 Atom Collider's Beryllium atom spends them daily to make PO Boxes (`AtomBonuses(3)` pens consumed per daily pass, N.js trigger block, H). **Obol Fragments** (`currencies.ObolFragments`) have no daily or weekly component in the reset code. **Daily login rewards:** no login-streak calendar exists in the reset code. A purchased pack credits +350 gems per daily pass while `OLA[44] > 0` (M: a paid daily-gems pack). "Daily Pack popups" are Gem Shop advertising (`AdvancedOptions`, N.js @14559784).

- **Feeds / fed by:** Fed by: Silver/Gold Pocketwatch (**Weekly bosses** trophy shop), Gem Shop (Daily Teleports, Daily Minigame Plays, Weekly Dungeon Boosters), bribes (teleports, guild GP). Feeds: **Boss keys**, Colosseum, Killroy, Dungeons and **Happy Hours**, guild GP, gems (boss drops, Liquid Shop, Picnic), Post Office, Alchemy, Island Expeditions, Achievements/Tasks.
- **Per-session actions:** At session start, compute time to the daily and weekly reset. If daily < Expected Return, do this period's no-bank items now (Random Event, raid reset, Liquid Shop gems, boss-gem kills). If weekly < 24 h, spend skulls and boosted runs and finish guild weeklies. Collect keys and tickets whenever days-since ≥ 1 and the session passes the NPC (or EZ Access is unlocked). **Idle or capped states:** keys or tickets at 3 days; teleports at the cap; island counters at their caps; skulls > 0 within 24 h of the weekly reset.
- **AFK Setup implications:** None directly. The reset does not change AFK gains. A Play Session just before the reset can collect today's no-bank items, then collect again after the reset, which doubles the dailies for one sitting. A Pocketwatch can line this up.
- **Min-max by stage:**
  - *Early W1:* Finish the Dog Bone quests on **every** character (each adds +1 Forest Villa Key a day) and Typhoon's for tickets. Do the Picnic Stowaway dailies. Vote in the Ballot from W2 on.
  - *Mid (W2):* Djonnut quests on every character, Centurion tickets, Liquid Shop gems daily, the W2 Merit for boss gems, Weekly Battles once all characters can take a turn, and Killroy weekly. Use Silver Pocketwatches to put the reset at the start of your usual session.
  - *Late (W3):* Bellows quests on every character, Lonely Hunter tickets, EZ-Access achievements (see **Boss keys**), Atom Collider pens to PO Boxes, Slush miniboss.
  - *W4 outline:* Mutated Mush weekly miniboss, Astro Colosseum (6 tickets, no daily ticket NPC; tickets come from the Post Office Cosmic Carrier, [wiki Colosseum Ticket](https://idleon.wiki/wiki/Colosseum_Ticket)), Troll's Enclave Key (Key4, no daily NPC in Toolbox's map), and the server-weekly Chip Repository and Jewel Spinner (per Toolbox [Etc.jsx#L149](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/components/dashboard/Etc.jsx#L149)).
  - *Per class:* none, except who collects the keys. The collecting character must itself have finished the NPC's quest (dialogue threshold, H).
- **Common mistakes:**

  | Mistake | Detect from the save |
  |---|---|
  | Assuming the reset is at UTC midnight or local midnight | Always derive it from `ShopRestock` and the snapshot age. |
  | Letting keys or tickets bank for more than 3 days (the extra days are lost) | `OLA[16, 31, 80, 15, 35, 56] ≥ 4`. A real W2 account had two key counters and two ticket counters at 4. |
  | Only the main character finished Dog Bone, Djonnut or Bellows | `KeysAll[i].amountPerDay < characters.length` ([TB misc.ts#L599](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L599)) |
  | Unspent Killroy skulls at the weekly reset | `OLA[105] > 0`, weekly reset < 24 h. A real W3 account held unspent skulls. |
  | Never voting in the Bonus Ballot | `OLA[309] ≠ ⌊(GlobalTime + 197860) / 604800⌋` or `OLA[308] == 0`. A real W2 account had never voted. |
  | Teleports sitting at the cap | `WorldTeleports ≥ 100 + 160·gemShopPurchases[71]` |

- **Save and Toolbox fields:** `timeAway.{ShopRestock, GlobalTime, PostOfficeRefresh}`. `accountOptions[39]` (`WEEKLY_RESET_SHOP`, [TB account-options-enum.js#L18](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/account-options-enum.js#L18)). The OLA indices in the catalogue. `currencies.{KeysAll, ColosseumTickets, WorldTeleports, minigamePlays, SilverPens, ObolFragments}` ([TB misc.ts#L513](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L513)). Toolbox display: `dailyReset = now + ShopRestock·1000`, `weeklyReset = now + (ShopRestock + 86400·OLA[39])·1000` ([TB Etc.jsx#L71-L72](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/components/dashboard/Etc.jsx#L71-L72)). These do not subtract the snapshot age, so ActiveOn should. Toolbox notes ShopRestock drifts by a few seconds between saves, so treat resets within 1 h as the same one ([TB bossRespawns.js#L22](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/bossRespawns.js#L22)).
- **Sources:** N.js v1.23 (2026-10-17): the trigger block @15079903, the daily loop @15114421, the weekly block after it, `_customBlock_AwayTimers` @6463127, Pocketwatch use @8275789, new-account init @22111047. Toolbox 6827d3f as linked. [Mechanics note](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md) (2026-10-17). [wiki Daily_Checklist](https://idleon.wiki/wiki/Daily_Checklist), last edited 2026-03-24 (**Stale-risk**, before v1.22/v1.23; it agrees with the code for W1–W4).

## Weekly bosses

- **What it is:** Weekly Battles (W2 Yum-Yum Desert). A turn-based raid where each of your characters takes one turn choosing one of 3 actions (ATTACK, BUFF or MISC) against a weekly boss with 5 difficulties. Beating a difficulty pays Trophies for a rotating shop ([wiki Weekly_Battles](https://idleon.wiki/wiki/Weekly_Battles), bot-drawn from game data, edited 2026-10-07).
- **Unlocks:** W2, Yum-Yum Desert (wiki, M on the exact gate). Turns = number of characters (`GetPlayersUsernames.length`, N.js weekly boss UI @≈11272900, H), so accounts with few characters get fewer actions.
- **Scope:** Account-wide raid state, server-global boss.
- **Inputs → outputs:** Inputs: one turn per character. Each turn's POW rises when that character meets the boss's per-turn **task** (e.g. Choppin LV 60, Worship LV 50, Class LV 175, 5-digit kills of a mob, Material Carry Cap 10k; Toolbox [`getTaskQuantity`, TB weeklyBosses.ts#L137](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-2/weeklyBosses.ts#L137)). Outputs:
  - **Trophies** on first clearing each difficulty this week: `⌊6 + (diff+1)/3⌋` plus Equinox cloud bonuses, so 6, 7, 7, 7 and 8 = **35 a week** (N.js trophy drop @≈11295332, H; matches the wiki). Each of two Equinox clouds adds +1 per kill forever: "400 kills in a single Killroy run" and "Greenstack 75 different items" (wiki; N.js Equinox text @14320499).
  - **MISC buffs for the rest of the week:** Class EXP (`WeeklyBoss.c`, capped at 150%) and damage (`WeeklyBoss.g`, capped at 150%) (Toolbox [TB character.ts#L1946](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/character.ts#L1946), [TB damage.ts#L466](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/damage.ts#L466)).
  - The Star Talent **Boss Battle Spillover** gives +Drop Rate per difficulty beaten this week (`OLA[189]`, [TB character.ts#L2385](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/character.ts#L2385)).
- **Goals and Milestones:**

  | Milestone | Reward |
  |---|---|
  | Difficulty 1 / 2 / 3 / 4 / 5 beaten this week | 6 / 7 / 7 / 7 / 8 trophies (35 total) |
  | Defeat all 5 difficulties once | Equinox challenge reward "+3 Max LV for Equinox Upgrade" (N.js Equinox list @14320499) |
  | Equinox clouds (Killroy 400 kills; 75 greenstacks) | +1 trophy per boss kill each, forever |
  | MISC Class EXP or DMG buffs | Up to +150% each, until the server week rolls |

  Bosses (9, game data `weeklyBosses`): Eclectic Lazlo, Decibop Box, Mutalius Cuboid, Jupiteye Major, The Nugenator, Fat Eggplonk, Mollo Gomm, Unit T-31, SWR Containment. HP grows per difficulty (e.g. Lazlo 200 → 9,140) (wiki).

  **Trophy shop (2 UI skins + 2 items each week, seeded):**

  | Item | Price | Priority |
  |---|---|---|
  | **Gold Pocketwatch** (an extra full daily reset now) | 50 | High when it rotates in. It is a whole extra day of keys, tickets, minigame plays, teleports, vial attempts, shop restock, Random Event and the rest. |
  | Killroy Skulls ×25 | 14 | High (25 skulls; spend them the same week) |
  | Silver Pocketwatch (±15 min reset) | 2 | Buy a few to align the reset with your routine. |
  | Trophy / Death Starbook (random max LV ≤ 100) | 25 | Medium |
  | Gold Food ×100, Statues ×1000 (type depends on world reached) | 12 | Medium early (statues). See W1 Statues. |
  | Pink Headband | 999 | Long-term cosmetic or stat goal |
  | The Crow Perch | 125 | Cosmetic |
  | UI skins | 15–60 | Cosmetic, lowest |

- **Feeds / fed by:** Fed by: skill levels, class level, kill counts and carry cap across all characters (the tasks); Equinox (W3). Feeds: Killroy (skulls), **Daily and weekly resets** (Pocketwatches), Statues, Golden Food, Star Talents, Equinox challenges, Class EXP and damage for the week.
- **Per-session actions:** Once a week after the server rollover (Thursday 00:00 UTC), run the raid with every character. If not all 5 difficulties fell, the **daily raid reset** (`OLA[190] == 0`) lets you retry from the start with the same choices. Trophies drop only for difficulties above `OLA[189]`. Idle state: `OLA[189] == 5`, nothing more to earn this week ([TB account.js#L624-L639](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/account.js#L624-L639)).
- **AFK Setup implications:** None. It takes a few minutes of active play. The MISC Class EXP buff makes the week's fighting AFK slightly better. It is account-wide and needs no setup.
- **Min-max by stage:**
  - *Early W2:* With few characters you may only clear 1–2 difficulties. Pick MISC Class EXP when the boss can't be beaten anyway. Spend trophies on Killroy skulls and Silver Pocketwatches.
  - *Mid and late W2–W3:* Plan the action order from Toolbox's predicted triplets (it shows 15 turns × 3 choices). Raise POW by meeting each turn's task, e.g. level Choppin to 60 on the character whose turn asks for it. Buy Gold Pocketwatches whenever they rotate in.
  - *W3+:* The Equinox clouds add +2 trophies per kill.
  - *W4 outline:* Laboratory and Divinity tasks appear (e.g. Unit T-31 asks for Lab LV 60 and Divinity LV 50).
- **Common mistakes:**

  | Mistake | Detect |
  |---|---|
  | Using the daily raid reset after casting MISC: it deletes every single-letter `WeeklyBoss` key, **including the `c`/`g` buffs** | Before the reset, `weeklyBossesRaw.c` or `.g > 0`. After it they are gone (N.js raid reset @≈11296600, M that `c`/`g` are in `Number2Letter`). |
  | Skipping the week (trophies don't bank) | `OLA[189] < 5` at server rollover |
  | Thinking a reset gives trophies again | Trophies only on new weekly best (`OLA[189]`) |

- **Save and Toolbox fields:** `accountOptions[185]` turn, `[186]` boss HP, `[187]` current difficulty, `[189]` best difficulty this week, `[190]` raid reset used today, `[191]` server-week id. `weeklyBossesRaw` (`WeeklyBoss` map; `c` and `g` buffs; `d_*` keys). Toolbox [`getWeeklyBoss`, TB weeklyBosses.ts#L59](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-2/weeklyBosses.ts#L59) predicts the next N weeks (seed `⌊GlobalTime/604800⌋ + i`: boss, shop, actions, tasks).
- **Sources:** N.js v1.23: "There_will_be_a_new_boss_in" @11270725 (604800-mod timer), the week rollover check `OLA[191] != ⌊GlobalTime/604800⌋` @≈11680650, "Reset_the_raid_back_to_the_start…" @11272914, "Wait_until_tomorrow_for_another_reset._Same_time_that_your_shop_resets" @11273052, trophy drop @≈11295332. Toolbox as linked. [wiki Weekly_Battles](https://idleon.wiki/wiki/Weekly_Battles) (2026-10-07).

## Boss keys

- **What it is:** Keys open the W1–W3 world-boss rooms: **Amarok** (W1 End of the Road, Forest Villa Key), **Efaunt** (W2 Efaunt's Tomb, Efaunt's Tomb Key) and **Chizoar** (W3 Chizoar's Cavern, Chizoar's Cavern Key). Each boss has 3 difficulties that cost more keys ([wiki Amarok](https://idleon.wiki/wiki/Amarok), [Efaunt](https://idleon.wiki/wiki/Efaunt), [Chizoar](https://idleon.wiki/wiki/Chizoar), bot data, edited 2026-10-02).
- **Unlocks:** Daily keys need the NPC's quest line finished on a character: Dog Bone (W1), Djonnut (W2), Bellows (W3). **EZ Access** (claim from the panel without walking) unlocks per world through achievements (achievements.json, H):

  | World | Keys EZ-Access achievement | Tickets and Shops EZ-Access achievement |
  |---|---|---|
  | W1 | Platinum 200G: a stack of exactly 200,000 Platinum Ore in storage | Half a Mill-log: exactly 500,000 Veiny Logs |
  | W2 | Skill Master (secret) | Super Cereal: exactly 50,000 Sentient Cereal |
  | W3 | Top Cogs: 78 cogs, all purple | Cool Score!: 2,500,000+ in Chillsnap Colosseum |

  The Advanced Option **"Auto Claim EZ Access"** then claims keys and tickets automatically at the start of each day (`AdvancedOptions` @14559784; daily call `GiveAllEZaccessFR` when `OLA[526] == 1`, @7941977).
- **Scope:** Keys are an account currency (`CurrenciesOwned.KeysAll`). The daily amount scales per character.
- **Inputs → outputs:** In: days elapsed × characters with the quest done (capped at 3 days banked). Keys also drop from Colosseum chests (Dewdrop, Sandstone, Chillsnap), Post Office shipments, and Dilapidated Slush (Chizoar keys) (wiki). Out: a boss fight per key spend.

  | Boss | Key cost N / Chaotic / 3rd tier | HP (N / C / 3rd) | Notable drops |
  |---|---|---|---|
  | Amarok | 1 / 5 / 30 (Radiant) | 60K / 8M / 100M | Desert Topaz (W2 portal), Amarok Card (+2.5% Skill AFK, about 1 in 25), Chaotic card (+2.5% Fighting AFK, 1 in 50), Radiant card (+3 Weapon Power, 1 in 50), Granite Obol of Amarok's Stare, Amarok Slab entry, Silver Pens |
  | Efaunt | 1 / 5 / 40 (Gilded) | 4M / 30M / 400M | Glacier Quartz (W3 portal), Efaunt Card (+5% monster EXP, 1 in 40), Chaotic (+3.75% Skill EXP, 1 in 62.5), Gilded (+15 Star Talent Pts passive, 1 in 50), Skeletal Obol of Efaunt's Gaze |
  | Chizoar | 1 / 5 / 50 (Blighted) | 20M / 250M / 2B | Galaxial Amethyst (W4 portal), Chizoar Card (+8% Cog Build Spd passive, 1 in 143), Chaotic (+5% Shrine Effects passive, 1 in 250), Blighted (+1.5% All Stat, 1 in 500), Frozen Obol of Chizoar's Rage |

  (Wiki bot tables. The wiki prints odds as "1 in 254%", meaning 1 in 25 = 4%. L/M on the exact odds, H that the data is bot-drawn.)
- **Goals and Milestones:**

  | Milestone | Why |
  |---|---|
  | First kill of each boss | Portal item to the next world |
  | Every character has finished Dog Bone, then Djonnut, then Bellows | +1 key a day per character for each key type |
  | Boss card levels (see Cards/Obols) | Passive or equipped bonuses. The Chizoar cards are passive. |
  | EZ-Access achievements | No walking, and auto-claim |
  | 150 boss kills a day with the W2 boss-gem Merit | Daily gem income |

- **Feeds / fed by:** Fed by: NPC quest lines, Colosseum, Post Office, the Slush miniboss, **Daily and weekly resets**. Feeds: Cards, Obols, world progression (portal items), gems (W2 Merit), Silver Pens (then Atom Collider PO Boxes), Slab.
- **Per-session actions:** Collect the banked keys (`daysSincePickup ≥ 1`). Spend keys on the highest difficulty you can kill quickly and safely for card and gem farming. Without the gem Merit, spend them whenever you want cards. Stop at 150 kills a day once the gem Merit is bought (`OLA[195] ≥ 600`).
- **AFK Setup implications:** None. Boss rooms are active. Keys bank only at the NPC (3 days), but keys already collected keep without limit, so there is no AFK pressure.
- **Min-max by stage:**
  - *Early W1:* Kill Amarok normal for the Desert Topaz. Farm the Amarok card early, because Skill AFK gain applies to every skilling character.
  - *W2:* Efaunt for the Glacier Quartz and the Efaunt card (+5% monster EXP). Buy the W2 boss-gem Merit, then turn the daily key flow into gem kills.
  - *W3:* Chizoar card (passive Cog Build Speed, a W3 Construction lever) and the chaotic card (passive Shrine effects). Kill Slush when its count is high for extra keys.
  - *W4 outline:* Massive Troll and Troll's Enclave Key (Key4).
  - *Per class:* wiki tactics. Warriors fight Amarok from the lower platform; Archers and Mages from the upper platform. Efaunt arm order: Bottom Left first, then Top Right if melee.
- **Common mistakes:**

  | Mistake | Detect |
  |---|---|
  | One character finished the key quest | `KeysAll[i].amountPerDay` < number of characters |
  | Keys banked past 3 days | `KeysAll[i].daysSincePickup ≥ 4` |
  | Hoarding keys while the boss-gem Merit is owned | `tasks[2][1][4] > 0`, `OLA[195] < 600` and `KeysAll[i].amount` high ([TB account.js#L243](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/account.js#L243)) |
  | With Auto Claim on, Chizoar keys seem to "not arrive" | Forest Villa keys rise instead (possible game bug: the auto-claim adds Bellows' count to `KeysAll[0]`, N.js @≈7943885, M) |

- **Save and Toolbox fields:** `currencies.KeysAll[0..4]` with `amountPerDay`, `daysSincePickup` and `totalAmount = min(days, 3) × perDay` ([TB misc.ts#L599](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L599); keysMap [TB parseMaps.ts#L110](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/parseMaps.ts#L110)). Toolbox `areKeysOverdue` alerts at ≥ 3 days ([TB account.js#L2070](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/account.js#L2070)). One small Toolbox mismatch (M): it counts Djonnut characters with dialogue > 6, but the game counts > 5 (with the collecting character > 6, `_event_keydrops` @22996154).
- **Sources:** N.js v1.23: Dog Bone drop @≈22413335, Djonnut `_event_keydrops` @22996154, Bellows @≈23743452, EZ board @≈9459000 (drops Key1/Key2/Key3 correctly), `GiveAllEZaccessFR` @7941977. Toolbox `data/website-data/achievements.json` (indices 34, 42, 102, 118, 173, 183). Wiki boss pages (2026-10-02).

## Happy Hours

- **What it is:** Server-wide one-hour windows when **Dungeon** boosted runs can be spent several at once for multiplied rewards ([wiki Dungeons](https://idleon.wiki/wiki/Dungeons), edited 2026-10-07: "you can use 3 or 20 boosted runs at once").
- **Unlocks:** Dungeons (W1 entrance below Picnic Stowaway, Froggy Fields; wiki). Boosted runs come weekly.
- **Scope:** The schedule is server-global. The 20× flag and boosted runs are per account.
- **Inputs → outputs:** The server var `HappyHours` is a list of seconds-of-week end times on the Unix week (Thursday 00:00 UTC). A 0 entry is replaced by a seeded random time ≈ Monday 10:00 UTC (`381600 + 1000·rand`). The window is active while `0 < end − (GlobalTime mod 604800) < 3600` (`DungeonStat("TimeToEndOfNextHappyHour")` @7825292, H). During a window, entering a dungeon with a **party of ≥ 3** spends `min(20, runs−1)` passes when `OLA[93] == 1` (then sets it to 0). Otherwise it spends `min(3, runs−1)` (N.js dungeon start @≈9279648, H). Rewards scale by the number of passes ("Use N passes at once for Nx rewards!", @≈8951015). Boosted-run items can't be used in a dungeon during a Happy Hour (@8269098).

  Current list (both fixtures, 2026-10-17; converted to UTC start–end):

  | # | UTC window | # | UTC window |
  |---|---|---|---|
  | 1 | Thu 01:46–02:46 | 10 | Sun 04:46–05:46 |
  | 2 | Thu 10:06–11:06 | 11 | Sun 13:06–14:06 |
  | 3 | Thu 21:13–22:13 | 12 | Sun 18:40–19:40 |
  | 4 | Fri 08:20–09:20 | 13 | Mon 00:13–01:13 |
  | 5 | Fri 19:26–20:26 | 14 | Mon 19:40–20:40 |
  | 6 | Sat 02:23–03:23 | 15 | Wed 02:13–03:13 |
  | 7 | Sat 09:20–10:20 | 16 | Wed 16:06–17:06 |
  | 8 | Sat 17:40–18:40 | 17 | Wed 21:58–22:58 |
  | 9 | Sat 23:13–Sun 00:13 | | |

  Read the live list from `serverVars.HappyHours`, because Lava can change it.
- **Goals and Milestones:**

  | Milestone | Detect |
  |---|---|
  | Use the weekly 20× run | `OLA[93] == 1` and `OLA[76] ≥ 21` before the account's weekly reset |
  | Never let boosted runs overflow unspent | `OLA[76]` vs the weekly +12 (+3 per Gem Shop booster) |

- **Feeds / fed by:** Fed by: **Daily and weekly resets** (boosted runs, the 20× flag), Gem Shop (Weekly Dungeon Boosters), the Bonus Ballot (a "1.5x Dungeon Credit and Flurbo" week, [wiki Bonus_Ballot](https://idleon.wiki/wiki/Bonus_Ballot)). Feeds: Dungeons (loot dice, credits and flurbos; see that System).
- **Per-session actions:** If a Happy Hour overlaps the Play Session and `OLA[76] > 1`, form a party of 3+ and run a dungeon. Do the first such run in the week with ≥ 21 passes for the 20×. An Active Play suggestion, never a Verdict.
- **AFK Setup implications:** None. Party play is active and needs other players (M: the party size reads the live party list).
- **Min-max by stage:** *W1–W3:* Save the weekly passes for a Happy Hour that fits your schedule. Spend 20 on the first. The rest at 3× each is still better than 1× solo. *W4+:* Unchanged.
- **Common mistakes:**

  | Mistake | Detect |
  |---|---|
  | Running boosted runs solo or outside a Happy Hour (1× per pass) | `OLA[76]` falling without `OLA[93]` changing |
  | Missing the 20× because the party was under 3 | `OLA[93]` still 1 at the weekly reset |
  | Timing by local time (the schedule is UTC) | n/a |

- **Save and Toolbox fields:** `serverVars.HappyHours`. `accountOptions[76]` boosted runs, `[93]` 20× available. Toolbox [`calcHappyHours`, TB dungeons.ts#L119](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/dungeons.ts#L119) (UTC modulo; note that it ignores the 0-entry random case) and dashboard timer ([TB Etc.jsx#L46](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/components/dashboard/Etc.jsx#L46)).
- **Sources:** N.js v1.23 @7825292, @≈9279648, @≈8951015, @8269098. Toolbox as linked. [wiki Dungeons](https://idleon.wiki/wiki/Dungeons) (2026-10-07). [wiki Daily_Checklist](https://idleon.wiki/wiki/Daily_Checklist) ("Dungeons x20 Happy Hour", weekly; Stale-risk, 2026-03-24).

## Daily Checklist

- **What it is:** The derived routine ActiveOn's Now screen can show in its Account section: each row is a check against the Account State with one Next Action. It is not an in-game system. It consolidates the items above and the other Systems' dailies.
- **Unlocks:** Each row appears only when its System is unlocked (gate column).
- **Scope:** Account section of the Now screen. Per-character rows (AFK Setup) belong to the other dossiers.
- **Inputs → outputs:** In: Account State plus the time to the daily and weekly reset and the Expected Return. Out: an ordered list of Next Actions.
- **Goals and Milestones:** "Checklist clear for this reset", meaning every row that applies is done.

  **Every session** (order = Visit Order hint; "no-bank" rows first when the reset falls before the Expected Return):

  | # | Check | Gate | Signal (needs action when…) | Next Action | Lost if skipped |
  |---|---|---|---|---|---|
  | 1 | Random Event today | W1 | `OLA[137] == 0` and an event is live or due this session (Toolbox `getRandomEvents`) | Teleport to the event map and kill it. | Today's event (no bank) |
  | 2 | Keys banked | Dog Bone, Djonnut, Bellows quests | `KeysAll[i].daysSincePickup ≥ 1` (urgent at ≥ 3) | Claim at the NPC or EZ Access. | Days past 3 |
  | 3 | Colosseum tickets banked | Typhoon, Centurion, Lonely Hunter quests | `ColosseumTickets.allTickets[i].daysSincePickup ≥ 1` (urgent ≥ 3) | Claim. | Days past 3 |
  | 4 | Shop restock | W1+ | Tracked items still in `shopStock` | Buy them. | That day's stock |
  | 5 | Liquid Shop gems and vial attempts | W2 Alchemy | Toolbox `alchemy.gems`, `vialsAttempts` | Buy or roll. | Today's |
  | 6 | Post Office orders | W2 | Toolbox `postOffice.dailyShipments` | Complete orders. | Streak or shield |
  | 7 | Weekly Battle | W2 | `OLA[189] < 5` (and `OLA[190] == 0` for a retry) | Run the raid (all characters). | Week's trophies |
  | 8 | Boss gem kills | W2 Merit bought | `OLA[195] < 600` | Spend keys on bosses. | Today's gems |
  | 9 | Bonus Ballot | W2 YumYum Grotto | `OLA[309] ≠` current ballot week | Vote. | This period's vote weight (M) |
  | 10 | Guild daily tasks | Guild joined (`OLA[37]`) | Toolbox `guild.daily` | See Companions/Guild/Family. | GP |
  | 11 | Daily Merit tasks | W1+ | 9th task per world level 0 | See Achievements/Tasks. | Daily merit points |
  | 12 | Minigame plays | W1 | `OLA[33] > 0` | Play them. | No bank |
  | 13 | Picnic Stowaway dailies | W1 | quest index ≥ 20 not done | Turn in. | Golden food and gem |
  | 14 | Dr Defecaus / Baba Yaga | W1 | Toolbox `bossRespawns` (inferred) | Kill. | One kill |
  | 15 | Teleports near cap | W1 | `WorldTeleports ≥ cap − 22` | Use some. | Overflow |
  | 16 | Islands claim | W2 Islands | Toolbox `islands.unclaimedDays` / `crystalIsland` | See W2 Islands. | Days past cap |
  | 17 | Slush or Mush count | W3 / W4 | `getMiniBossesData().maxed` | Kill. | Count stops growing |

  **Weekly** (show when the weekly reset < max(24 h, Expected Return)):

  | Check | Signal | Next Action |
  |---|---|---|
  | Killroy runs | `OLA[113]` below the room-complete code (21 for 2 rooms after W3, 321 for 3; Toolbox [TB account.js#L643](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/account.js#L643)) | Run each room on the shown class. |
  | Killroy skulls | `OLA[105] > 0` | Spend them: Arcade balls (≤ 50 buys a week, `OLA[417]`), then refinery cycles or library checkouts. |
  | Boosted runs and 20× | `OLA[93] == 1`, `OLA[76] > 1` | Schedule a Happy Hour party run. |
  | Guild weekly | Toolbox `guild.weekly` | See Guild. |
  | Weekly Gem Shop limits | per Gem Shop dossier | See Gem Shop. |

- **Feeds / fed by:** Fed by every System above. Feeds the Now screen Account section and Visit Order.
- **Per-session actions:** As in the tables. A row is **Stale** (in the Glossary sense) if the Account State snapshot predates the most recent reset. Then recompute with `ShopRestock − (now − GlobalTime)`. A negative value means the reset already happened in-game, and the counters will read as reset once the next save arrives.
- **AFK Setup implications:** None. Checklist rows never change a character's Verdict. They are Account-section Next Actions or Active Play suggestions.
- **Min-max by stage:** *Early W1:* rows 1–4 and 11–15. *W2:* add 5–10 and 16. *W3:* add 17 and Killroy's 2nd room (after W3 per Toolbox; the wiki says "after reaching World 4"). *W4:* add Mutated Mush and the W4 Systems.
- **Common mistakes:** Treating the checklist as a fixed clock time (it is per account). Showing banked rows (keys, tickets) as urgent at 1 day; they are only urgent at ≥ 3.
- **Save and Toolbox fields:** As per row. Toolbox's tracker names, for reuse: `tasks`, `guild.daily/weekly`, `shops`, `etc.{randomEvents, keys, miniBosses, bossRespawns, gemsFromBosses, dailyCrystals, glimmerwickCandle}`, `postOffice.dailyShipments`, `weeklyBosses.{daily, trophy}`, `killRoy.{general, skulls, underHundredKills}`, `alchemy.{gems, vialsAttempts}`, `islands.*` ([TB baseTrackers.js](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/baseTrackers.js#L15-L232)).
- **Sources:** Toolbox `utility/dashboard/account.js` and `baseTrackers.js` @6827d3f. [wiki Daily_Checklist](https://idleon.wiki/wiki/Daily_Checklist) (2026-03-24, Stale-risk). Reddit r/idleon ["Best Killroy upgrade? (I'm in W3)"](https://reddit.com/r/idleon/comments/1skfgco/best_killroy_upgrade_im_in_w3/) (2026-04-13; consensus "arcade balls… if left use on refinery"; "skulls not spent are gone").

### Killroy (weekly; part of the reset catalogue)

Killroy's Slaughterhouse (Killroy NPC, YumYum Grotto, W2) is a weekly timed kill challenge in 2 rooms (a 3rd from a 1%-per-buy Skull Shop unlock, `OLA[227]`). Each room fixes a class (Beginner, Warrior, Archer or Mage) and a monster, seeded on the **account's own** weekly boundary: `⌊(GlobalTime + ShopRestock + 86400·OLA[39]) / 604800⌋ + 50·room + serverVars.KillroySwap` (N.js @≈4334290, H; Toolbox [`getKillRoyClasses` TB misc.ts#L1861](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L1861), which can show the next 20 weeks). Kills drop Skulls for the Skull Shop: time candy, pearls, crystal mob, loot dice, **10 Arcade balls for 4 skulls, 50 times a week** ("Hey now! I've only got so many balls... Come back next week!" @4322651, `OLA[417]` reset weekly), library checkouts, a refinery cycle, mob eggs and ladles ([wiki Killroy's Slaughterhouse](https://idleon.wiki/wiki/Killroy%27s_Slaughterhouse), 2026-10-05). Room upgrades are permanent (base timer 100 s, +1 s per level, and so on). Killroy kills summed over Death Note mobs give a damage multiplier `1 + ⌊kills^0.4⌋/100` ([TB misc.ts#L1582](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L1582)). **Weekly reset:** `OLA[113] = 0` (rooms), `OLA[105]` (skulls) = the Royal Armory stipend (0 before W7), `OLA[417] = 0` (H). Priority: run every room every week on a character of the shown class with high multikill. Spend skulls on balls until 50 buys, then the rest. ActiveOn's Next Action: "Spend N Killroy skulls before the weekly reset in X h".

## Events

- **What it is:** Two kinds of non-routine content. (1) **Random Events:** in-world, server-scheduled hourly spawns on W1–W3 maps (Meteorite, Mega Grumblo, Glacial Guild, Snake Swarm, Angry Frogs). Related: **Giant Monsters**, weekly-throttled random spawns behind a prayer. (2) **Seasonal or limited events:** server-toggled periods with daily box drops, an event minigame, Event Points and an Event Shop.
- **Unlocks:** Random Events: from the start (W1 maps are in the pool). The teleport prompt shows only if today's event isn't done ([wiki Random_Events](https://idleon.wiki/wiki/Random_Events), prose dates to v1.73; tables bot-drawn, 2026-10-07). Giant Monsters: need the W3 Worship prayer **Tachion of the Titans** active (`prayersReal(5,0) > 5` in `"GiantMob"` @4050782, H; prayer text "Giant_Monsters_can_now_spawn_on_Monster_Kill"). Seasonal: whenever `serverVars.EventActive` names an event.
- **Scope:** The schedules are server-global. Completion limits are per account.
- **Inputs → outputs:**
  - **Random Event type** each hour: seed `⌊GlobalTime/3600⌋ + RandEvntHr`, roll `r`. `r < .045` Meteorite (maps W1+W2+W3), `< .087` Mega Grumblo (W1+W2), `< .129` Glacial Guild (W3), `< .171` Snake Swarm (W1+W2), `< .213` Angry Frogs (W1). Otherwise none (21.3% total). The map comes from seed +1 over `RANDOlist[68..70]` (`m._customBlock_RandomEvent` @10768107, H; Toolbox [`getRandomEvents` TB misc.ts#L1075](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L1075)). **Reward:** unique drops: Meteorhead and Meteorite Ring (Meteorite); Grumbie the Hatchet Hammer (Grumblo); Ice Guard Helmet and Vigilant Obol of Ice Guard (Glacial); Skewered Snek (Snakes); Grumpy Obol of the Grandfrogger (Frogs). Shared drops: Black or Holy Pearl 12%, EXP balloons 30%, Loot Dice 1–3 at 40%, Gold Food Coupons 1–3 at 40% (twice), statues 5–20 at 20% (twice), plus world-specific materials (wiki). **Second loot roll** chance = `⌊100·party^0.177 + 5·OLA[166] + bribe Loot Table Tampering⌋/100 − 1`: 0% solo, about 50% at 10 players, +5% per Rando Island purchase, +20% bribe (`"PtySizeLootBonus"`, H). On kill, `OLA[137] = 1` except on your own Rando Island (`"BossKilledNice"` @10775905). Toolbox lists collected unique items ([`getRandomEventItems` TB misc.ts#L1508](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L1508)).
  - **Giant Monsters:** per kill, while fewer than 5 giants spawned this week, chance `1 / ((100 + 50·(n+1)²) · (1 + Glitterbug curse%)) · (1 + (Crescent shrine + GiantMob vial)%)`. After 5 it collapses steeply. `n = OLA[57]` resets weekly (per account). The Glitterbug prayer trades lower giant odds for crystal mobs from giants (H; Toolbox [`getGiantMobChance` TB misc.ts#L895](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L895) omits the Tachion gate).
  - **Seasonal events (2025–2026 cadence, wiki Changelogs):** Giftmas (2025-12-08 to 12-31), Valenslimes (2026-02-26), Goldrush (2026-03-17 to 03-27), 5th Anniversary (2026-04-17), Summer Break (2026-06-21), Cropfall (2026-08-26). Typical loop: **collect 50 event boxes a day from any monster kills** (which also gives +1 free Event Play), play the event minigame in W1 town for Event Points, nametags and gold or cosmic balls, and spend Event Points at the Event Shop NPC in W1 town. Event plays and points carry over between events, and Event Shops stay open between events ([wiki Changelog_2026](https://idleon.wiki/wiki/Changelog_2026), [Changelog_2025](https://idleon.wiki/wiki/Changelog_2025)). In code, the daily counter message is "That's_all_50_daily_…_collected,_you've_earned_a_FREE_PLAY" (N.js, H). Event Shop bonuses owned are letters in `OLA[311]` (Toolbox [`getEventShopBonus` TB misc.ts#L1935](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L1935)). Some, like the vote buttons, feed the Bonus Ballot multiplier. Summer events add daily NPC quests (Coastiolyte: open 15 Summer Coolers, defeat Plasti Dougs and Mr Blueberrys), which the daily loop resets (H, quests.json and N.js loop).
- **Goals and Milestones:**

  | Milestone | Why |
  |---|---|
  | 1 Random Event per day | Loot dice, gold food coupons, statues, pearls, and chances at unique gear and obols |
  | All unique Random Event items collected | Toolbox `getRandomEventItems` count |
  | 50 event boxes per day during a seasonal event | +1 free Event Play plus box loot (gems, hats, cards) |
  | Event Shop collection | Permanent account bonuses (e.g. Ballot vote multiplier) |

- **Feeds / fed by:** Random Events feed Dungeons (loot dice), Golden Food, Statues, Obols, pearls (EXP). Giant Monsters feed crystal mobs (with Glitterbug). Seasonal events feed Gem Shop gems, cosmetics and the Event Shop permanent bonuses (Ballot, Meritocracy, etc.). Fed by: Rando Island (W2 Islands, +5% second roll each), bribes, party size, Worship prayers (W3).
- **Per-session actions:** If `OLA[137] == 0` and an event is live (`date ≤ now < date + 1 h`) or starts within the session, accept the teleport and kill it. If an event isn't up, show the next event time and map from Toolbox's 100-hour list. During a seasonal event, check whether today's 50 boxes are done (M: the save field for the daily box counter isn't mapped yet; read it from Toolbox later or via `serverVars.EventActive` plus the event items). **How to detect a seasonal event:** `serverVars.EventActive` (a W2 fixture showed `"WeeklyDealz"`, a Gem Shop deal mode; the code also checks values like `"CropFun"` and `"ValOn"`, N.js @7823516, @11905759, H).
- **AFK Setup implications:** Random Events need a short active detour, after which the character returns to its AFK Setup. Giant Monsters: equip Tachion of the Titans on a fighting AFK character only while `OLA[57] < 5`. After that it is a wasted prayer slot (M on the value threshold). During seasonal events, the 50 daily boxes drop from monster kills, so a fighting AFK character collects them over the AFK Stretch (L, from changelog wording "collect… from defeating any monster").
- **Min-max by stage:**
  - *W1:* Do every Random Event. Party chat groups up for 50% double loot, which matters for loot dice before Dungeons.
  - *W2:* Buy Rando Island loot% upgrades (W2 Islands) and the Loot Table Tampering bribe.
  - *W3:* Glacial Guild appears on W3 maps. Use Tachion of the Titans for giants up to 5 a week.
  - *W4 outline:* No new Random Event types in the pool (maps are W1–W3 only).
  - *Seasonal, all stages:* Do the 50 boxes daily. Prioritise Event Shop items that are permanent account bonuses over cosmetics.
- **Common mistakes:**

  | Mistake | Detect |
  |---|---|
  | Doing the event on your own Rando Island and thinking it used the daily | `OLA[137]` stays 0 (Rando kills don't set it) |
  | Running Tachion of the Titans all week | `OLA[57] ≥ 5` and the prayer is still equipped |
  | Assuming events are personal or random per player | They are one server schedule. Toolbox can predict them. |
  | Forgetting event plays carry over, so wasting them | n/a (L) |

- **Save and Toolbox fields:** `accountOptions[137]` (event done today), `[57]` (giants this week), `[166]` (Rando loot buys), `[310]` event currency, `[311]` event shop letters. `serverVars.{RandEvntHr, EventActive, EventOddz, EventFun}`. `looty.lootyRaw` for unique items. Toolbox dashboard "next event" tile ([TB Etc.jsx#L45](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/components/dashboard/Etc.jsx#L45)) and `etc.randomEvents` alert ([TB account.js#L190](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/account.js#L190)).
- **Sources:** N.js v1.23 @10768107, @10775905, @4050782, @7823516, @11905759. Toolbox as linked. [wiki Random_Events](https://idleon.wiki/wiki/Random_Events) (2026-10-07; prose from v1.73, Stale-risk on the drop odds, though the tables are bot-drawn), [wiki Changelog_2026](https://idleon.wiki/wiki/Changelog_2026), [Changelog_2025](https://idleon.wiki/wiki/Changelog_2025).

### Sources

- Game client [N.js](https://www.legendsofidleon.com/ytGl5oc/N.js), v1.23 "Luminous_Menagerie", Last-Modified 2026-10-17. Symbols and strings: `_customBlock_AwayTimers` @6463127, daily trigger `0>=ShopRestock` @15079903, daily loop `_DailyRepeatINDEX` @15114421 and weekly block after it, Pocketwatch use @8275789, new-account init @22111047, `GiveAllEZaccessFR` @7941977, `cb.AdvancedOptions` @14559784, `_event_keydrops` (Djonnut) @22996154, Dog Bone @≈22413335, Bellows @≈23743452, Typhoon tickets `_event_OnActor2` @≈20937979, EZ-Access board @≈9459000, `"TimeToEndOfNextHappyHour"` @7825292, dungeon pass spend @≈9279648, Happy-Hour item block @8269098, `m._customBlock_RandomEvent` @10768107, `"BossKilledNice"` @10775905, `"GiantMob"` @4050782, Killroy room seed @≈4334290, Killroy ball cap @4322651, Weekly Battle strings @11270725, @11272914, @11273052, week rollover @≈11680650, trophy drop @≈11295332, raid reset @≈11296600, Equinox challenge list @14320499, Ballot vote `OLA[308]/[309]` @≈11766234, `eventStatus` @7823516.
- IdleOn Toolbox [@ 6827d3f (2026-10-17)](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1): `parsers/misc.ts` (L253, L513, L568, L599, L895, L1075–L1131, L1508, L1533, L1582, L1861, L1935), `parsers/dungeons.ts` (L43, L77, L119), `parsers/world-2/weeklyBosses.ts` (L59, L137), `parsers/world-2/voteBallot.ts`, `parsers/parseMaps.ts` L110, `parsers/character.ts` (L1946, L2385), `parsers/damage.ts` L466, `utility/dashboard/account.js` (L127–L340, L624–L667, L2070), `utility/dashboard/baseTrackers.js`, `utility/dashboard/bossRespawns.js`, `utility/helpers.js` L655, `components/dashboard/Etc.jsx` (L45–L72, L147–L151), `data/account-options-enum.js` L18, `data/website-data/{achievements,gemShop,quests,shared-data}.json`.
- IdleOn wiki (via api.php, read 2026-10-17; last-edit dates): [Weekly_Battles](https://idleon.wiki/wiki/Weekly_Battles) 2026-10-07, [Random_Events](https://idleon.wiki/wiki/Random_Events) 2026-10-07, [Dungeons](https://idleon.wiki/wiki/Dungeons) 2026-10-07, [Killroy's_Slaughterhouse](https://idleon.wiki/wiki/Killroy%27s_Slaughterhouse) 2026-10-05, [Bonus_Ballot](https://idleon.wiki/wiki/Bonus_Ballot) 2026-10-09, [Amarok](https://idleon.wiki/wiki/Amarok), [Efaunt](https://idleon.wiki/wiki/Efaunt), [Chizoar](https://idleon.wiki/wiki/Chizoar) 2026-10-02, [Colosseum](https://idleon.wiki/wiki/Colosseum) 2025-08-28 (Stale-risk), [Colosseum_Ticket](https://idleon.wiki/wiki/Colosseum_Ticket), [Daily_Checklist](https://idleon.wiki/wiki/Daily_Checklist) 2026-03-24 (Stale-risk), [Bosses](https://idleon.wiki/wiki/Bosses), [Quests_Blunder_Hills](https://idleon.wiki/wiki/Quests_Blunder_Hills), [Multi_Meritocracy](https://idleon.wiki/wiki/Multi_Meritocracy) (W7, out of scope), [Changelog_2025](https://idleon.wiki/wiki/Changelog_2025), [Changelog_2026](https://idleon.wiki/wiki/Changelog_2026).
- Reddit r/idleon (Arctic Shift API): ["Best Killroy upgrade? (I'm in W3)"](https://reddit.com/r/idleon/comments/1skfgco/best_killroy_upgrade_im_in_w3/) 2026-04-13 (pre-v1.22, Stale-risk; the "skulls lost weekly" claim is confirmed in code); ["PSA: …multiplied skulls from Merit on killroy"](https://reddit.com/r/idleon/comments/1wuolvv/psa_bout_half_a_day_left_for_multiplied_skulls/) 2026-10-01 (W7 Meritocracy context).
- Real parsed saves (field-name and sanity checks only, not quoted): W2 and W3 fixtures confirmed `serverVars.HappyHours` (17 entries), `OLA[191] = 2963` (server week), `OLA[309]` matching `⌊(GlobalTime+197860)/604800⌋` when voted, and key and ticket `daysSincePickup` values up to 5.
