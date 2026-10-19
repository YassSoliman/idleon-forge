# Weekly Battles & Bonus Ballot (dossier)

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Path prefix `TB` = `packages/toolbox-parsers/vendor`. Tiers: 1 = game data / Toolbox code, 2 = Toolbox dashboard, 3 = wiki, 4 = community. Game-data file `TB/data/website-data/shared-data.json` is cited as `shared-data`.

## Weekly Battles (W2)

- **What it is:** A turn-based raid at Yum-Yum Desert. Each character takes one turn and picks ATTACK, BUFF or MISC against a server-seeded weekly boss with 5 difficulties; clearing a new best difficulty pays Trophies for a seeded shop [C1][C14][C20].
- **Unlocks:** World 2, Yum-Yum Desert [C39] (M). The exact quest/map gate is not in Toolbox (open question). One turn per character, so a 1-character account gets 1 action [C20].
- **Scope:** Boss, tasks, actions and shop are server-global (same for everyone, derived from `floor(GlobalTime/604800)`) [C3]. Progress (`OLA[189]`, `OLA[190]`, `WeeklyBoss.*`) is account-wide. Task quantities are per turn character, except Completed Quests which is account-wide [C10].
- **Inputs -> outputs:** In: one turn per character per attempt; per-turn task thresholds (levels, stats, kill digits) raise that turn's POW [C9][C10]. Out: Trophies on a new weekly best difficulty (6/7/7/7/8 = 35; wiki only, M) [C14], MISC buffs (Class EXP, damage; each capped at 150%) [C16], Boss Battle Spillover drop rate [C17], Equinox progress [C15].
- **Goals and Milestones:**

  | Milestone | Reward | Claim |
  |---|---|---|
  | Difficulty 1/2/3/4/5 beaten this week | 6/7/7/7/8 Trophies (35) | [C14] |
  | All 5 difficulties once (Equinox cloud 6) | +3 Max LV Liquidvestment | [C15] |
  | Equinox clouds 1 (400 Killroy kills in one run), 11 (Greenstack 75 items) | +1 Trophy per boss kill each, forever | [C15] |
  | Equinox cloud 15 (48 Ulti Double Cogs) | +4 Max LV Liquidvestment | [C41] |
  | `OLA[189]` = 5 | Dashboard stops alerting; Spillover at max | [C13][C17] |

- **Feeds / fed by:** Fed by skill levels, character stats, class level, quest count, kill counts (see catalogue). Feeds: Killroy skulls, Statues, Gold Food, Pocketwatches (daily resets), Starbooks, drop rate (Spillover), Class EXP/damage (MISC), Equinox clouds [C15][C7][C16][C17]. Links to Resets/Dailies, Killroy, Equinox, Statues.
- **Per-session actions:** Once per daily reset (`OLA[190]` = 0): run the battle. First attempt of the server week: reach difficulty 5. Check shop for Gold Pocketwatch / Skulls. Idle/capped state: `OLA[189]` = 5 and raid used today [C13].
- **AFK Setup implications:** None directly. Task thresholds reward leveling the skills named in the week's boss (e.g. Choppin 60, Worship 50), so the boss preview (10 weeks ahead, deterministic) can steer which skill to AFK [C9][C3].
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:** (1) Skipping the daily attempt: the community says extra daily attempts are the main trophy source after the first clear [C22]. (2) Running the daily reset after MISC buffs are set, which wipes them (M) [C21]. (3) Letting a seeded Gold Pocketwatch rotate out unbought. (4) Treating wiki/guide shop prices as current; game data differs [C8]. Detect: `OLA[189] < 5` late in the server week; `OLA[190] == 0` at session end.
- **Save and Toolbox fields:** see catalogue "Fields" column and the field summary below.
- **Sources:** inline in the claims; all verified 2026-10-19.

### Mechanics catalogue (Weekly Battles)

| # | Mechanic | Rule / formula | Caps | Unlock | Costs | Field / parser path |
|---|---|---|---|---|---|---|
| W1 | Server week seed | `seed = floor(GlobalTime/604800)`; week i uses `LavaRand(seed+i).rand()*1000 = random` [C3] | n/a | n/a | n/a | `account.timeAway.GlobalTime`; `TB/parsers/world-2/weeklyBosses.ts` `getWeeklyBoss` |
| W2 | Boss pick | `bossId = clamp(floor(random/1000*9))` over 9 bosses [C3][C1] | 9 bosses | W2 | n/a | `weeklyBosses` in shared-data |
| W3 | Boss HP | `x4 * x5^d`, d = difficulty index 0..4 (`OLA[187]` selected). Lazlo 200/520/1352/3515/9140 [C2] | 5 difficulties | n/a | n/a | `accountOptions[187]`; `getBossMaxHp` |
| W4 | Tasks | 15 task slots per fight; each draws 1 of the boss's 3 task ids via `LavaRand(round(random+3i))` [C4]. Thresholds in [C9][C40] | 15 | n/a | n/a | `getTasksIds`, `weeklyBossesTasks` |
| W5 | Task quantity | Per turn character; see [C10]/[C11]/[C12]. Meeting threshold raises POW (exact POW curve not in Toolbox: open question) | n/a | n/a | n/a | `getTaskQuantity` |
| W6 | Actions | 22 actions: 9 ATTACK, 8 BUFF, 5 MISC; 15 triplets of 3 choices per fight, no repeat within the last 9 drawn [C5][C18] | 1 action per character | n/a | n/a | `weeklyBossesActions` |
| W7 | Turn count | One turn per character on the account [C20] | n chars | n/a | n/a | `characters.length` |
| W8 | Trophies | 6/7/7/7/8 on new best difficulty only, +1 per boss kill per active Equinox cloud [C14][C15] | 35 base/week | n/a | n/a | `OLA[189]`; `WeeklyBoss.d_*` |
| W9 | Daily raid reset | `OLA[190]` flag clears each daily reset; wipes week MISC buffs (M) [C13][C21] | 1/day | n/a | n/a | `accountOptions[190]` |
| W10 | MISC buffs | Class EXP `WeeklyBoss.c`, damage `WeeklyBoss.g`, each `min(150, v)` [C16] | 150% each (x2.5 dmg) | n/a | n/a | `weeklyBossesRaw.c/.g` |
| W11 | Boss Battle Spillover | Star talent: +Drop Rate x `OLA[189]`; talent x1=25, x2=100, decay [C17] | 5 diffs | star talent | Starbook 25 Trophies | `character.ts` `BOSS_BATTLE_SPILLOVER` |
| W12 | Trophy shop | 2 of 12 UI skins + 2 of 9 items per week, seeded [C6][C7] | per-week | n/a | prices [C7] | `getShopItems`; `weeklyBossesShop` |
| W13 | Equinox links | Clouds 1, 11 (+1 trophy/kill), 6 (+3 Liquidvestment max LV) [C15] | n/a | Equinox | n/a | `TB/parsers/world-3/equinox.ts` |
| W14 | Weekly-boss save blob | `WeeklyBoss` JSON: `c`, `g`, `d_<cloud>` (-1 = cloud done) [C19] | n/a | n/a | n/a | `account.weeklyBossesRaw` |

W5+ extensions: none to the raid itself; later worlds only add inputs (e.g. Spelunking/Armory bonuses feed Max Damage digits via `getMaxDamage`) and the Killroy skulls spend (W7 Armory stipend) [C21].

### Weekly Battle trophy shop (game data)

| Item | Price (Trophies) | Note |
|---|---|---|
| Gold Pocketwatch | 60 | shifts time +24h, triggering daily bonuses/resets incl. raid attempt [C7][C22][C50] |
| Killroy Skulls x25 | 14 | [C7] |
| Trophy / Death Starbook (random max LV <=100) | 25 each | Spillover needs the Trophy-family book per guide [C23][C51] |
| Gold Food x100 / Statues x1000 | 12 | [C7] |
| Silver Pocketwatch (+/-15 min reset shift) | 2 | [C7][C50] |
| Pink Headband | 999 | one-off cosmetic [C7] |
| Crow Perch | 125 | [C7] |
| UI skins (12 types) | 15-60 | cosmetic [C7] |

## Bonus Ballot (W2)

- **What it is:** A weekly vote at the YumYum Grotto. The winning bonus becomes a worldwide bonus for all characters, scaled by your personal Ballot multiplier [C26][C27][C36].
- **Unlocks:** World 2 (YumYum Grotto) [C36]. One vote per week; "free" is not stated by the wiki (L).
- **Scope:** Account-wide; the winner is server-global.
- **Inputs -> outputs:** In: one vote. Out: winning bonus value x `voteMulti` [C27][C28]. If the winner needs a later-world feature you lack, the game substitutes a 1.25x damage bonus (wiki, M; Toolbox does not model it) [C31].
- **Goals and Milestones:** Multiplier steps: Voter Rights (+1%/lvl), Voter Integrity (+6%/lvl, max 5), Democracy FTW +25, Crystal Cuttlefish +40, Mashed Potato +5, Gilded +17 / Royal +30 [C30][C29].
- **Feeds / fed by:** Fed by Equinox, Caverns Cosmo, Summoning, Legend Talent, Event Shop, companions, Palette, Sushi [C28]. Feeds ~35 systems: damage, skill EXP/efficiency, printer, alchemy, cooking, sigils, gaming, divinity, sailing, sneaking, drop rate, summoning, farming, lab, equinox, refinery, cash [C25].
- **Per-session actions:** If `OLA[309]` != current ballot week, vote (30 s). Never a Goal (D-4); ActiveOn does not advise votes (existing KB rule) [C37]. Idle state: ballot week rolled, no vote.
- **AFK Setup implications:** None.
- **Min-max by stage:** see below.
- **Common mistakes:** Never voting (a real W2 account had never voted, per prior dossier); not owning the Royal/Gilded button; assuming the active bonus applies when its world gate is unmet [C31].
- **Save and Toolbox fields:** `serverVars.{voteCategories, votePercent, voteCat2, votePercent2}`, `accountOptions[308]` (my vote), `[309]` (ballot week), `account.voteBallot.*` [C26][C32].
- **Sources:** inline.

### Mechanics catalogue (Bonus Ballot)

| # | Mechanic | Rule / formula | Caps | Unlock | Costs | Field / path |
|---|---|---|---|---|---|---|
| B1 | Weekly options | `voteCategories = [winner, ...candidates]` (candidates shown ~3), `votePercent[i]` per candidate share [C26] | 1 vote/wk | W2 | free | `serverVars.voteCategories/votePercent` |
| B2 | Bonus table | 35 entries (value, world gate) from `ninjaExtraInfo[38]`; indices 0 and 1 are both the 1.25x damage entry [C25] | n/a | gate values 0/3/4/5/6 | n/a | `account.voteBallot.bonuses` |
| B3 | Applied value | `bonus = value x voteMulti`; only the `selected` index applies [C27] | n/a | n/a | n/a | `getVoteBonus(account, idx)` |
| B4 | Ballot multiplier | `(1+Poppy/100)(1+MeritBonus9/100)(1+(Cuttlefish+Equinox+Cosmo+SummonWin+17*EvShop7+13*EvShop16+MashedPotato+Palette+LegendTalent22+Sushi50)/100)` [C28] | none | various | Event Shop pts | `voteBallot.voteMulti` |
| B5 | Clock | ballot week = `floor((t+197860)/604800)`; vote `OLA[308]`, last week `OLA[309]` [C32] | n/a | n/a | n/a | `accountOptions[308/309]` |
| B6 | Fallback | Locked winner -> 1.25x damage [C31] | n/a | n/a | n/a | not parsed |
| B7 | Voter Rights | Equinox upgrade; cloud 35 (Killroy 100 kills on half of W1-W6 mobs) gives +15 max LV [C34] | n/a | Equinox | n/a | `equinox.upgrades` |
| B8 | Bonus list | Per-index bonuses and consumers: see [C25] and the table below | | | | |

W5+ extension (one line each): Meritocracy (second ballot, `voteCat2`, own multiplier [C45], feeds ballot multiplier via bonus 9 [C46]) unlocks at Spirit Village, W6 per code (community says W7) [C33]; Cosmo "Voter Integrity" (Caverns, W5) +6%/lvl max 5 [C30]; Summoning win bonus and Sushi (W7) feed `voteMulti` [C28].

### Ballot bonuses (index: value, world gate, consumer parser)

0,1 damage x1.25 g0; 2 STR/AGI/WIS/LUK +15% g0; 3 Def+Acc +30% g0 (damage.ts); 4 Guild GP +30 g0; 5 Kill-per-Kill x1.2 g0; 6 AFK gain +15% g0; 7 Mining +42% g0; 8 Fishing +50% g0; 9 Choppin +38% g0; 10 Catching +46% g0; 11 3D Printer x1.2 g3; 12 Alchemy liquid +25% g0; 13 Cooking +63% g4; 14 Dungeon credit/flurbo x1.5 g0; 15 Class EXP +60% g0; 16 Breeding +50% g4; 17 Sigil EXP x1.8 g4; 18 Construction +40% g3; 19 Shrine EXP x1.53 g3; 20 Sailing artifact find x1.31 g5; 21 Gaming new species x1.8 g5; 22 Gold nuggets +75% g5; 23 Divinity x1.6/+60% g5; 24 Sailing captain x1.5 g5; 25 Sneaking x1.65/+65% g6; 26 Golden Food +30% g0; 27 Drop Rate +38% g0; 28 Summoning +40%/x1.4 g6; 29 Farming +40% g6; 30 Trapping/Worship +54% g3; 31 Lab EXP +90% g4; 32 Equinox fill x1.4 g3; 33 Refinery +50% g3; 34 Cash +52% g0 [C25]. (Stat texts: `}x` = multiplier, `{%` = percent.)

## Min-max by stage

Community meta is thin; most Weekly Battle meta lives in the Discord spreadsheet (out of scope, tier-excluded). Lines below are the closest sourced guidance.

- **W1 (pre-unlock):** Nothing to do. Plan skills toward W2 thresholds (Choppin/Mining 60, Worship/Fishing/Catching/Alchemy 50) because they recur across bosses [C9].
- **W2 early (unlocked, few characters):** Clear difficulty 1-2 each week with whatever turns you have; with 1-3 characters you get 1-3 actions, so reaching difficulty 5 is unlikely [C20]. Buy: Statues x1000 (12) early, Silver Pocketwatch (2) to align the reset [C23][C7]. Vote damage/stat/XP bonuses (options 0-3, Class EXP 15) [C35].
- **W2 mid:** Fight on every daily reset, not just once a week [C22]. Priority (guide order, prices re-based to game data): Boss Battle Spillover talent book (Trophy-family, 25) -> Gold Pocketwatch (60 in game data) -> Silver Pocketwatch (2) -> Statues (12) -> Killroy Skulls x25 (14; spend the same week) -> Gold Food (12) [C23][C8]. Ballot: vote for what your active skill benefits (Mining 42, Fishing 50, Choppin 38, Catching 46) or Class EXP 60 [C35].
- **W2 late / W3:** Reach difficulty 5 every server week (35 trophies); `OLA[189]` also scales Spillover drop rate [C14][C17]. Pursue Equinox clouds 1 and 11 for +1 trophy per boss kill each, so a daily repeat pays more [C15]. Ballot: unlocked gates 3 (Printer, Construction, Shrine, Trapping/Worship, Equinox, Refinery): vote for the system you are actively scaling [C25][C35].
- **W4:** Cooking +63% and Lab +90% (gate 4), Breeding/Sigil EXP x1.8 (gate 4) become live; Event Shop Royal Vote Button (25 pts) beats Gilded (35 pts) on value [C29][C35].
- **W5+:** Gate-5 bonuses (Gaming species x1.8, Divinity x1.6, Artifact find) and Cosmo Voter Integrity; best highlighted by the wiki: Sigil EXP 1.8x, New Species 1.8x, Divinity 1.6x, Sneaking 1.65x [C35].
- **Per class:** no class-specific differences found; damage-related tasks use Max Damage digits for all classes [C10].

## Save and Toolbox fields summary

`accountOptions[187]` selected difficulty; `[189]` best difficulty this week (0-5); `[190]` raid reset flag (0 = available); `[191]` server week; `[308]` my vote; `[309]` ballot week; `[472]` Demonflesh (Meritocracy). `weeklyBossesRaw` (`c`, `g`, `d_*`). `serverVars.voteCategories/votePercent/voteCat2/votePercent2`. Parsed: `account.voteBallot`, `getWeeklyBoss(account, weeks)`. ActiveOn: `account.weeklyBattle` (OLA[189],[190]), `account.ballot` (OLA[309], `voteBallot.selectedBonus`); KB `weekly-battles.check.raid`, `ballot.check.vote`; detectors `weekly-battles/raid`, `checklist/rows`; clock `ballotWeekOf` in `packages/engine/src/checklist/clocks.ts`; sprite `sys-ballot` exists, no raid/trophy sprites verified [C37].

## Gaps and suggested ActiveOn work (for the spec phase)

Not parsed/surfaced today: the 10-week boss/tasks/shop preview, per-turn task thresholds met, trophy shop alerts (Gold Pocketwatch rotation), Equinox clouds 1/11, Spillover level, ballot winner + multiplier + world-gate fallback. A dedicated Weekly Battles view and sprites (boss, trophy, pocketwatch, ballot box) would be new art. Also unparsed: trophy balance and shop purchase state [C55], Meritocracy multiplier and bonus 9 [C45][C46], action restrictions [C48], Equinox cloud 15 [C41].

## Open questions

See the structured output.

## Claims

- [C1] 9 weekly bosses: Eclectic Lazlo, Decibop Box, Mutalius Cuboid, Jupiteye Major, The Nugenator, Fat Eggplonk, Mollo Gomm, Unit T-31, SWR Containment. Source: `TB/data/website-data/shared-data.json` weeklyBosses. Tier 1. Confidence: H.
- [C2] Boss HP = `x4 * x5^OLA[187]`; Lazlo 200/520/1352/3515/9140; Decibop 250/700/1960/5488/15366; Mutalius 300/810/2187/5905/15943; Jupiteye 400/1000/2500/6250/15625; Nugenator 100/370/1369/5065/18742; Eggplonk 600/1380/3174/7300/16790; Mollo 1000/1900/3610/6859/13032; Unit T-31 200/600/1800/5400/16200; SWR 350/910/2366/6152/15994. Source: `TB/parsers/world-2/weeklyBosses.ts#L18` + shared-data. Tier 1. Confidence: H.
- [C3] Seed `floor(GlobalTime/604800)` (+i for next weeks); `random = floor(LavaRand(seed+i).rand()*1000)`; `bossId = clamp(floor(random/1000*9))`; next 10 weeks predictable. Source: weeklyBosses.ts#L14,#L62. Tier 1. Confidence: H.
- [C4] Each boss has three task ids (x1..x3); 15 task slots each choose one with `LavaRand(round(random+3i))`. Source: weeklyBosses.ts#L22. Tier 1. Confidence: H.
- [C5] 22 actions (9 ATTACK, 8 BUFF, 5 MISC); 15 triplets, drawn without repeats against a recency list of 9. Source: weeklyBosses.ts#L61 + weeklyBossesActions. Tier 1. Confidence: H.
- [C6] Shop each week: 2 of 12 UI skins and 2 of 9 items, seeded from `random`. Source: weeklyBosses.ts#L33. Tier 1. Confidence: H.
- [C7] Shop prices in game data: Galaxy UI 50, Goldwood 60, Hardwood/Deadwood/Peachwood 15-20, others 20-40; Pink Headband 999; Killroy Skulls x25 14; Trophy Starbook 25; Death Starbook 25; Crow Perch 125; Gold Food x100 12; Statues x1000 12; Silver Pocketwatch 2; Gold Pocketwatch 60. Source: shared-data weeklyBossesShop. Tier 1. Confidence: H.
- [C8] Price disagreement: game data says Gold Pocketwatch 60 and Skulls 14 (H); prior ActiveOn research said 50 and 14; a community guide says 30 and 25 (likely pre-patch); wiki says pocketwatches 2-60. Source: shared-data weeklyBossesShop vs https://gameslikefinder.com/article/idleon-weekly-battle-guide/ vs https://idleon.wiki/wiki/Weekly_Battles (2026-10-07). Tier 1 (wins). Confidence: H.
- [C9] Task thresholds: Mining 60, Fishing 50, Choppin 60, Worship 50, Alchemy 50, Catching 50, Trapping 40, Cooking 35, Lab 60, Divinity 50, Construction 50, Class LV 175, Max HP 50000, Max MP 50000, Accuracy 200000, Defence 100000, Movement Speed 220, Material Carry Cap 10000, Completed Quests 100, kill digits 5 (Crabcake, Green Mushroom, Ram, Stiltmole, Choccie), Max Damage digits 7, plus task id 24 Construction LV 50 (used by SWR Containment x3). Source: shared-data weeklyBossesTasks. Tier 1. Confidence: H.
- [C10] Task quantity per turn character via `getTaskQuantity`; Completed Quests uses account-wide `totalQuestsCompleted`; Max Damage task uses `ceil(lavaLog(maxDamage))`; stats are read as if the turn character were logged in. Source: weeklyBosses.ts#L140. Tier 1. Confidence: H.
- [C11] Kill-digit tasks use `ceil(lavaLog(kills[idx]))` with idx: Crabcake 53, Green Mushroom 1, Ram 116, Stiltmole 205, Choccie 158. Source: weeklyBosses.ts#L140+. Tier 1. Confidence: H.
- [C12] Material Carry Cap task = `min(2.05e9, bCraft * (1+matStamps/100)(1+25*gemShop[58]/100)(1+(allStamps+starSign)/100)(1+extraBags/100)*allCap)`. Source: weeklyBosses.ts#L122. Tier 1. Confidence: H.
- [C13] `OLA[190]` is the daily raid-reset flag (0 = available, returns to 0 each daily reset); `OLA[189]` is best difficulty this week, max 5. Source: `TB/utility/dashboard/account.js#L627-L641`. Tier 2. Confidence: H.
- [C14] Trophies 6/7/7/7/8 on a new weekly best difficulty (35/week). Source: https://idleon.wiki/wiki/Weekly_Battles (edited 2026-10-07; matches prior N.js decode v1.23). Tier 3. Confidence: M.
- [C15] Equinox cloud 1 (400 Killroy kills in one run) and cloud 11 (Greenstack 75 items) each give +1 Trophy per weekly boss kill forever; cloud 6 (defeat all 5 difficulties) gives +3 Max LV Liquidvestment. Source: shared-data equinoxChallenges. Tier 1. Confidence: H.
- [C16] MISC Class EXP (`WeeklyBoss.c`) and damage (`WeeklyBoss.g`) are each capped at 150%. Source: `TB/parsers/character.ts#L1949`, `TB/parsers/damage.ts#L469-L470`. Tier 1. Confidence: H.
- [C17] Boss Battle Spillover (star talent, x1=25, x2=100, decay) gives +Drop Rate per difficulty beaten this week, multiplied by `OLA[189]`. Source: `TB/parsers/character.ts#L2388`, `#L2480`; talents.json BOSS_BATTLE_SPILLOVER. Tier 1. Confidence: H.
- [C18] Action data: ATTACK base 1000 x POW (wiki); BUFFs multiply later damage 25-150%; MISC adds Class EXP +30 / damage +10 per cast; some actions force the next 1-2 characters off ATTACK/BUFF or rewind turns. Source: shared-data weeklyBossesActions; https://idleon.wiki/wiki/Weekly_Battles. Tier 1. Confidence: M.
- [C19] Save key `WeeklyBoss` is a JSON string with `c`, `g` and `d_<n>` cloud counters (-1 = completed). Source: `TB/parsers/index.ts#L179`, `TB/parsers/world-3/equinox.ts#L62`. Tier 1. Confidence: H.
- [C20] One turn per character (`GetPlayersUsernames.length`). Source: prior research `research/account-wide:docs/research/systems/account-wide/resets-dailies-events.md` (N.js decode v1.23, 2026-10-17). Tier 1 (decoded game code, secondhand). Confidence: M.
- [C21] The daily raid reset wipes the week's MISC buffs (H/M); Killroy skulls are wiped weekly. Source: same prior research file. Tier 1, M confidence. Confidence: L.
- [C22] Community: fight with the daily attempt too; Gold Pocketwatch triggers the daily reset including the boss attempt; the Discord spreadsheet lists an optimal 5-difficulty order and a repeatable trophy/MISC order. Source: https://gameslikefinder.com/article/idleon-weekly-battle-guide/ (page updated 2026-01-20; its prices are pre-patch). Tier 4. Confidence: M.
- [C23] Community shop priority: Boss Battle Spillover book (25) first (aim level 80+), Gold Pocketwatch, Silver Pocketwatch, 1000 Statues, Killroy Skulls, Gold Food. Source: https://gameslikefinder.com/article/idleon-weekly-battle-guide/. Tier 4, prices there are stale [C8]. Confidence: M.
- [C24] Existing ActiveOn KB: `weekly-battles.check.raid` done when `OLA[189] >= 1`; boss rolls Thursday 00:00 UTC. Source: `packages/knowledge/systems/weekly-battles.yaml`. Tier 1 (our own, built from [C13]); note it should reflect the daily flag `OLA[190]` as well. Confidence: M.
- [C25] Ballot table `ninjaExtraInfo[38]` has 35 entries of (text, value, world gate), gates 0/3/4/5/6; indices 0 and 1 both 1.25x damage. Wiki lists 34 entries and "None" gates. Source: shared-data ninjaExtraInfo[38]; `TB/parsers/world-2/voteBallot.ts#L133`; https://idleon.wiki/wiki/Ballot. Tier 1 (wins; wiki disagrees). Confidence: H.
- [C26] `serverVars.voteCategories = [winner, ...candidates]`, `votePercent[i]` per candidate; `bonus.selected` true for the winner. Source: voteBallot.ts#L12-L14, #L133. Tier 1. Confidence: H.
- [C27] Applied bonus = table value x `voteMulti`; only the selected index returns non-zero in `getVoteBonus`. Source: voteBallot.ts#L133, getVoteBonus. Tier 1. Confidence: H.
- [C28] `voteMulti = (1+Poppy/100)(1+Meritocracy9/100)(1+(Cuttlefish+Equinox VoterRights+Cosmo+SummoningWin+17*EventShop7+13*EventShop16+MashedPotato+Palette+LegendTalent22+Sushi50)/100)`. Source: voteBallot.ts#L112. Tier 1. Confidence: H.
- [C29] Gilded Vote Button +17% (35 Event Points); Royal Vote Button +30% instead (25 Event Points); code encodes them as 17x + 13x. Source: https://www.digitaltq.com/wiki/idleon/event-shop; voteBallot.ts#L112. Tier 4 (cost), Tier 1 (values). Confidence: H (values), M (costs).
- [C30] Wiki multiplier sources: Voter Rights +1%/lvl, Voter Integrity +6%/lvl max 5, Democracy FTW +25%, Crystal Cuttlefish +40%, Mashed Potato +5%. Source: https://idleon.wiki/wiki/Ballot, https://www.digitaltq.com/wiki/idleon/bonus-ballot-guide. Tier 3. Confidence: M (Mashed Potato +5% L).
- [C31] If the winner is a feature you have not reached, the game replaces it with a 1.25x damage bonus; Toolbox does not model this. Source: https://idleon.wiki/wiki/Ballot (M). Tier 3. Confidence: M.
- [C32] Ballot week = `floor((GlobalTime+197860)/604800)` (rolls Monday ~17:02 UTC); `OLA[308]` my vote, `OLA[309]` last voted week. Source: prior research (N.js @11766234) and `packages/engine/src/checklist/clocks.ts#L12`. Tier 1. Confidence: M.
- [C33] Meritocracy (second ballot, `voteCat2`, 28 entries from `ninjaExtraInfo[41]`): needs map 250 cleared; base 25% until Demonflesh handed in (`OLA[472]=1`), then 100%; Toolbox comment says "Spirit Village (the World 6 town)". Source (code): voteBallot.ts#L31-L43, Tier 1. Source (community, not independently verified): https://www.digitaltq.com/wiki/idleon/multi-meritocracy-guide says W7, 26 bonuses, rolls Thursday, Tier 4. Code wins. Confidence: H (code), L (digitaltq 26 bonuses / W7 / Thursday).
- [C34] Equinox cloud 35 (100 Killroy kills on half of W1-W6 mobs) gives +15 Max LV to Voter Rights. Source: shared-data equinoxChallenges[35]. Tier 1. Confidence: H.
- [C35] Community voting guidance: vote what benefits current focus; damage/stat bonuses early; highest-value later bonuses Sigil EXP 1.8x, New Species 1.8x, Divinity 1.6x, Sneaking 1.65x. Source: https://idleon.wiki/wiki/Bonus_Ballot, https://www.digitaltq.com/wiki/idleon/bonus-ballot-guide. Tier 3-4. Confidence: L.
- [C36] Ballot is at YumYum Grotto, one free vote for one of 3 candidate buffs, bonus lasts until next ballot. Source: https://idleon.wiki/wiki/Ballot. Tier 3. Confidence: M ("free" not stated by wiki).
- [C37] ActiveOn state: KB `ballot.check.vote` (row only, never a Goal), fields `account.weeklyBattle`, `account.ballot`, detectors `weekly-battles/raid`, `checklist/rows`, sprite `sys-ballot`. Source: `packages/knowledge/systems/ballot.yaml`, `packages/account-state/src/slots-fields.ts#L21-L22`, `apps/activeon/src/art/sprites/grids/systems.ts#L728`. Tier 1. Confidence: H.
- [C38] Prior note: coverage audit lists Weekly Battles/Ballot as checklist-only (class A). Source: `scratchpad/ux/m25-coverage.md` line 114. Tier 1. Confidence: L.
- [C39] Weekly Battles are accessed from Yum-Yum Desert (W2). Source: https://idleon.wiki/wiki/Weekly_Battles. Tier 3. Confidence: M.

- [C40] Added: Task id 24 is Construction LV 50 (`statText` "Construction LV of {"); SWR Containment draws it as x3. Source: shared-data weeklyBossesTasks[24]. Tier 1. Confidence: H.
- [C41] Added: Equinox cloud 15 (fill at least 48 cog-board slots with Ulti Double Cogs) gives +4 Max LV for Liquidvestment, besides cloud 6's +3. Source: shared-data equinoxChallenges[15]. Tier 1. Confidence: H.
- [C42] Added: Shop collision re-roll. Item picks use `seed+36`/`seed+72` (skins) and `seed+10`/`seed+20` (items); the second skin retries `seed+l` (l=1..100) and the second item retries `seed+71k` (up to 710) while equal to the first. The final `k` (`extraSeed`) seeds the action draws, so shop outcomes shift the action RNG. Source: weeklyBosses.ts#L28-L58, #L66+. Tier 1. Confidence: H.
- [C43] Added: Carry-cap task detail. It uses the logged-in character's star sign and AllCap but the turn character's EXTRA_BAGS and bCraft, and skips AllCapBASE (Upgrade Vault and carry-cap bundles). Hard cap 2.05e9. Source: weeklyBosses.ts#L122. Tier 1. Confidence: H.
- [C44] Added: Equinox challenge slots: at most 5 clouds active at once (`min(5, dream[2])`); cloud index >= 36 is locked behind a Research grid 86 level. Source: `TB/parsers/world-3/equinox.ts`. Tier 1. Confidence: M (gamedata verifier's note; not re-read here). Clouds are 0-based indices; Toolbox tracks completion as `WeeklyBoss.d_<n>` = -1.
- [C45] Added: Meritocracy ballot (second table `ninjaExtraInfo[41]`, 28 entries, `voteCat2`/`votePercent2`) has its own multiplier: `meritocracyMult = (1+Poppy/100)(base + (5*ClamWork3 + Pufferblob companion 39 + Legend talent 24 + Arcade "Meritocracy_Bonus" + 20*EventShop23 + Sushi51 + Jelly33)/100)`, base 0.25 until `OLA[472]=1` then 1; 0 until map 250 cleared by any character. Source: voteBallot.ts#L24-L48. Tier 1. Confidence: H.
- [C46] Added: Interdependence. Meritocracy bonus index 9 (`getMeritocracyBonus`) is a factor `(1+m9/100)` in the Bonus Ballot `voteMulti` [C28], so the two ballots feed each other. Source: voteBallot.ts#L108-L118, #L162. Tier 1. Confidence: H.
- [C47] Added: MISC buffs and damage apply for the rest of the week via `WeeklyBoss.c` (Class EXP) and `WeeklyBoss.g` (damage), each read in character.ts/damage.ts with a 150 cap [C16]. MISC action data: tea break +30% Class EXP, chilly cheese +10% DMG, both for all characters. Source: shared-data weeklyBossesActions; character.ts#L1949; damage.ts#L469. Tier 1. Confidence: H.
- [C48] Added: Action restriction and replay mechanics (22 actions, data x3 = effect group, x4 = type 0 ATTACK/1 BUFF/2 MISC). Dual-wield: next character cannot ATTACK; random weapons: next 2 cannot ATTACK; gross fog: next cannot BUFF. Rewind: ATTACK combo and BUFF combo rewind a character at 3+ casts; punch (9+ ATTACK) and blackhole (9+ BUFF) rewind to character 1 once; MISC reminisce (2+ MISC) rewinds to character 1 once; joke gives the final character an extra turn. Retrigger: burn replays its damage on each later ATTACK; cursed ring replays on each later BUFF. Trip sets boss HP to 30%. Next-BUFF-2x and next-hit-2x actions exist. Source: shared-data weeklyBossesActions. Tier 1. Confidence: H on text; the exact simulation order is not in Toolbox (L).
- [C49] Added: Shop items flagged `x2 = 1` in game data are Pink Headband, Crow Perch, Silver and Gold Pocketwatch. Meaning of the flag is not in Toolbox (likely a one-per-purchase / non-stackable marker). Source: shared-data weeklyBossesShop[1]. Tier 1. Confidence: L (flag meaning).
- [C50] Added: Pocketwatches. Silver Pocketwatch: "alter your daily reset time forward or backward by 15 mins". Gold Pocketwatch: "shift time forward by 24 hours, triggering daily bonuses and resets". `accountOptions[39]` is added to the shop-restock clock as `86400 * OLA[39]` in the shop week seed, i.e. the Gold Pocketwatch's day shifts. Source: shared-data weeklyBossesShop; `TB/parsers/misc.ts#L1875`. Tier 1. Confidence: M (OLA[39] as the Gold Pocketwatch counter is inferred from its use).
- [C51] Added: Boss Battle Spillover is also sold as a Starbook (`Trophy_Starbook`/`Death_Starbook`, random max LV up to 100, 25 Trophies each); both rows share `TalentBook1`. Source: shared-data weeklyBossesShop[1]. Tier 1. Confidence: H.
- [C52] Added: Boss HP exponent. `OLA[187]` is the difficulty index used in `x4*x5^OLA[187]`. What increments it is not in Toolbox and the game may floor HP; both unverified. Skull tier per difficulty: `OLA[189]` capped at `MAX_WEEKLY_BOSS_SKULLS=5` [C13]. Source: weeklyBosses.ts#L19; account.js#L627. Tier 1/2. Confidence: L (increment source).
- [C53] Added: Dashboard alerts. Toolbox raises two separate alerts: daily raid available (`OLA[190]=0`) and trophy not maxed (`OLA[189] < 5`). Source: `TB/utility/dashboard/account.js#L627-L641`. Tier 2. Confidence: H.
- [C54] Added: Gem shop item 58 adds +25% carry cap per purchase and feeds the Material Carry Cap task [C12]. Source: weeklyBosses.ts#L122. Tier 1. Confidence: H.
- [C55] Added: Per-candidate ballot vote percentages are `serverVars.votePercent[i]`; Toolbox exposes the winner only through `selected`. Trophy counts and per-item shop purchase state are not in the vendored parsers, so ActiveOn cannot read them today. Source: voteBallot.ts#L12-L14. Tier 1. Confidence: M.
