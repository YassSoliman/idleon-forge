# Minigames (W1–W4)

Research date 2026-10-17, game v1.23 "Lumi Menagerie" (N.js Last-Modified 2026-10-17). Companion to the Resets, Dailies, Weekly Bosses, Boss Keys, Happy Hours and Events dossier (`resets-dailies-events.md`), which owns the reset clocks. This file owns what each minigame costs, pays and unlocks.

Shorthand used in this file:
- `TB` = `https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/` (Toolbox commit 6827d3f, 2026-10-17).
- `N.js @n` = character offset in `https://www.legendsofidleon.com/ytGl5oc/N.js` (v1.23, Last-Modified 2026-10-17). A symbol or string is named next to each offset, because offsets move with every patch.
- `OLA[n]` = `OptionsListAccount[n]`, which Toolbox parses as `account.accountOptions[n]`.
- Confidence: **H** = read in code or data. **M** = inferred from minified control flow. **L** = community or wiki prose only.
- Wiki pages were read through `api.php` on 2026-10-17. Most of them were edited 2026-10-03 to 10-07, but those edits were bot table regenerations. The hand-written prose can be much older, and the Colosseum page is from 2025-08-28 (Stale-risk).

### Key findings

- **There are three kinds of minigame, with different economics.** (1) **Skill minigames** (Choppin and Mining in W1, Fishing and Catching in W2) share one daily pool of **5 plays, +4 per Gem Shop purchase**. The pool is reset (not added to) every day and does not bank (H). (2) **Cooldown minigames:** Swishy Hoops and Throwy Darts (W1, added 2025-11-06). They are free, with an escalating cooldown after each play (90 s up to 15 min) that clears at the daily reset. Each one-point score buys permanent account bonuses (H). (3) **Idle clickers:** Orion the Owl (W1), Poppy the Kangaroo Mouse (W2) and Bubba the Chonky Seal (Codex, unlocks at W3). They produce currency offline and you spend it on permanent stat bonuses and Mega resets (H). Spiketrap Surprise (W1, hourly, gems once a day), Pen Pals (W3, free, highscore bonuses) and the Colosseum (ticket-gated) are one-offs.
- **Highest Leverage for an active W1–W3 player:** Throwy Darts (+% damage, +Talent Points for tab 1, cheaper Upgrade Vault; the Nine Dart Finish trophy gives **9% Drop Rate multi and 9% AFK Gains multi**). Next come Orion and Poppy (cheap permanent Class XP, damage, Drop Rate and AFK bonuses), then Swishy Hoops (+% damage, coins, Class EXP, all-skill efficiency; Baller trophy at 40 points). **Skill minigame plays are low Leverage.** At developer-highscore scores one play pays roughly 9 to 51 minutes' worth of that skill's harvest. Their value is in one-time highscore Milestones (quests, achievements, Tome, two class talents) (H formula, M interpretation).
- **The Gem Shop "Daily Minigame Plays" (900 gems for +16 plays a day) is a poor buy for W1–W4.** The Antifun Spirit prayer (+700% reward, but each attempt costs 9 plays) **loses value per play** (0.89x to 0.84x per play vs 1.0x without it). It only saves time (H formula).
- **Plays and cooldowns never bank.** The skill-minigame pool is overwritten each day. Hoops and Darts cooldowns and play counters reset daily. The Spiketrap gem flag is set to 1 each day. The W2 test account had **29 unspent Darts points and 7 unspent Hoops points with 0 upgrade levels**. Unspent points are the most common detectable mistake (H, save).
- **Spiketrap Surprise pays up to 40 gems a day, not 30 as the wiki says.** The payout is `min(40, 2·(round−1) + max(round−4,0) + max(round−8,0))`, so round 10 pays 26 and round 13 pays 38. It runs at the top of each hour, and a round-1 death keeps you eligible (H, N.js @23179637).
- **Bubba unlocks when the active character has opened the W2→W3 town portal** (`KillsLeft2Advance[50][0] <= 0`, N.js @11150785; H for the condition, M for the reading). The wiki only says "in your Codex".
- **The Colosseum is low Leverage in W1–W4** except for its achievements: Dewdrop 25k → RNG item unlock, Sandstone 200k → 2% Arcade balls/hr, Chillsnap 2.5M → W3 Colosseum and Shops EZ-Access, Astro 10M → 5% Cash. The real chest score thresholds are in this file (H). Community: farm it once Drop Rate is high (L).
- **Toolbox gaps:** Toolbox has no dashboard alert for minigame plays, Hoops or Darts cooldowns, unspent Hoops or Darts points, or the Spiketrap daily. Its Hoops upgrade costs reuse the Darts cost formula, which is wrong (H, TB `parsers/highScores.ts#L99-L110` vs N.js `HoopsUpgCost` @10951556).

## Summary table

"Leverage" is for an active W1–W3 player (Meta Path stage W1–W3, outline W4). Saves: `OLA[n]` = `account.accountOptions[n]`.

| Minigame | World / location | Unlock | Cost per play / plays per day / recharge | Rewards | Leverage | Save field |
|---|---|---|---|---|---|---|
| Choppin minigame | W1, any tree | Choppin skill; 5% efficiency (harvest chance) needed for any reward | 1 shared play (9–17 with Antifun). Pool of 5 + 4×gem purchases, reset daily, no bank | Logs, leaves, Choppin EXP (capped at half a level). Highscore drives the Mage talent CHOPPIN IT UP EZ, the Funguy quest (20), achievements (15 yellows; 141+ Steam) and the Tome | Low per play; Medium once for highscore Milestones | `FamilyValuesMap.MinigameHiscores[0]`, `OLA[33]` |
| Mining minigame | W1, any ore node | Mining skill; 5% harvest chance | Shared pool | Ore, Mining EXP (half-level cap). Achievements: yellow vein slam; 103+ (Steam) | Low | `MinigameHiscores[3]` |
| Fishing minigame | W2, fishing spots | Fishing skill | Shared pool | Fish, Fishing EXP. Highscore drives Barbarian BOBBIN' BOBBERS (+1 Fishing Power per point, capped) and the Whattso quests (Megalodon trophy, Bobber Challenge Scroll) | Low; Medium for a Barbarian | `MinigameHiscores[1]` |
| Catching minigame | W2, bug nests | Catching skill | Shared pool | Bugs, Catching EXP. Goldric "Hoopsies" (15 in a row or 90 total) gives 4 gems and Tool Upgrade Stone III; Golden and Lava hoop achievements | Low | `MinigameHiscores[2]` |
| Swishy Hoops | W1 Valley of the Beans (shop there); Basketball item anywhere | Basketball from the W1 town shop or Promotheus "Three Right Answers" | Free. Cooldown after the n-th play of the day: 90, 180, 300, 480, 720, then 900 s. Ticks offline; cleared at daily reset | Ball Points = score (+50% with Event Shop bonus 24). Shop: +1% DMG, Coins, Class EXP, All-skill efficiency per level. Baller trophy at 40 in one game | High (cheap: about 1 point per level early) | `OLA[242]` best, `[418]` points, `[419..422]` levels, `[423]` cooldown s, `[424]` plays today |
| Throwy Darts | W1 Winding Willows (Baby Boa map, shop there); Darts item anywhere | Darts from the W1 town shop or Funguy "Mushroom Munchies" | Free. Cooldown 90, 180, 300, 480, 720, then 900 s; same rules as Hoops | Bart Points = score. Shop: +1% DMG, +1 tab-1 Talent PT, Vault ×(1+0.01·L) cheaper, +1% move speed. Nine Dart Finish trophy (9 bullseyes in a row): 9% DR multi, 9% AFK multi | **Highest** | `OLA[442]` best, `[434]` points, `[435..438]` levels, `[439]` cooldown, `[440]` plays |
| Spiketrap Surprise | W1, portal in Vegetable Patch (or type "If u love me let me go") | None | Free; starts at the top of every hour; gems once per daily reset | Gems `min(40, 2(r−1)+max(r−4,0)+max(r−8,0))`. W1 task (round 3), Tome (round 13 = full), Steam achievement (13) | Medium (free gems if online at :00) | `OLA[201]` best round, `OLA[7]` daily gem flag |
| Orion the Owl | W1, secret portal on Valley of the Beans | Find the portal | Idle; feathers accrue offline | Permanent +Class XP, Base DMG, Total DMG, Skill XP, Drop Rate, All Stat. Megafeathers multiply them | High (minutes per session) | `OLA[253..264]` |
| Poppy the Kangaroo Mouse | W2, The Oasis | Buy the Secret Map (bottom of the W2 town shop) | Idle; catches bank offline and convert when the menu opens | Permanent Fish Eff, DEF, Fishing XP, Accuracy, Total DMG, AFK Gains, Cash. Megafish multiply them | High | `OLA[267..305]` |
| Bubba the Chonky Seal | Codex (no map) | Active character has the W2→W3 town portal open | Idle; no mini resets | Permanent Build Rate, Critter gain, Soul gain, Total DMG, All Kills, XP multi, Atom cost | Medium (W3+) | raw `Bubba`; TB `account.bubba` |
| Colosseum | Dewdrop W1 (Froggy Fields), Sandstone W2 (Mimic Hole), Chillsnap W3 (Snowfield Outskirts), Astro W4 (TV Outpost) | Tickets from the Typhoon, Centurion and Lonely Hunter quests; Astro tickets from the Cosmic Carrier | 1 / 2 / 3 / 6 tickets. 1 ticket per NPC per day, banks 3 days | Chests by score (thresholds below), keys, achievements, Tome | Low (achievements only) | `FamilyValuesMap.ColosseumHighscores[1..4]`, `currencies.ColosseumTickets` |
| Pen Pals | W3, any trapping platform with critters | Trapping | Free, unlimited, no plays used | Cumulative at highscore 25…225: Trapping EXP/Efficiency, Shiny chance, Critter gain, +1% Skill AFK | Medium once (reach 225) | `OLA[99]` |
| Worship Tower Defence | W3 totems | Worship | Worship charge | See the Worship skill dossier | (skill) | `TotemInfo` |
| Seasonal event minigame | W1 town | Event active | Event plays (50 boxes a day → +1 free play) | Event Points, nametags, balls | See the resets dossier | `OLA[311]` (shop) |

Not minigames: **Mr Pigibank** is the W1 stamp NPC (quest "A Pig and his Stamps", unlocks Stamps and Bribes, [wiki Mr_Pigibank](https://idleon.wiki/wiki/Mr_Pigibank)). The **Arcade** (W2) is a ball-spending upgrade system covered by the W2 systems dossier. W4 adds no new minigame beyond the Astro Colosseum. The Tome (W4) is where minigame highscores pay out again. Out of scope (W5+): POiNG and the Log minigame (Gaming), Monuments (Hole), Sushi, Minehead, Jelly Operator, Molten and Whimsical Colosseums.

## Skill minigames: shared rules and the daily plays pool

- **What it is:** Four active minigames, one per W1–W2 harvesting skill. You start one from the skill node your character is standing at. Each attempt spends plays from one account-wide pool and pays that skill's resource plus EXP, scaled by score. The best score per minigame is kept account-wide.
- **Unlocks:** As soon as the skill is usable. Choppin and Mining are in W1; Fishing and Catching in W2 ([wiki Minigames](https://idleon.wiki/wiki/Minigames)). Choppin, Mining and Catching pay nothing unless the character's harvest chance at that node is above 5% (`ChanceToHarvest > .05`, N.js @3943128 and @5730407, H). Fishing has no such gate (N.js @5718024 sets the chance term to 1, H).
- **Scope:** The play pool is account-wide (`OLA[33]`). Patch note "Minigame plays are now ACCOUNT WIDE, not per player. Gem refunds have been given!" (N.js @14399922, H). The legacy `PersonalValuesMap.MinigamePlays` is still written for each character (N.js @15116058) but is not what gets spent. Highscores are account-wide (`FamilyValuesMap.MinigameHiscores`). The reward multiplier is per character: the playing character's star sign, prayer and talents apply.
- **Inputs → outputs:**
  - **Pool refill (H):** the daily loop sets `OLA[33] = 5 + 4·GemItemsPurchased[72]` once per missed day. It assigns, it does not add, so unused plays are lost (N.js @15116058). An earlier step in the same reset writes `max(OLA[33], 8 + 4·g)`, or `20 + 4·g` when class level is below 5 (N.js @15092085). It looks like the later loop overwrites this. Both test saves show base 5 (M).
  - **Cost per attempt (H):** `1 + max(0, AntifunCurse − 1)` plays, where the curse is 0 without the prayer. The attempt only starts if `OLA[33]` exceeds `max(0, curse − 1)` (N.js @3734235, @3735359).
  - **Reward (H):** `k × min(harvestChance,1) × (1 + MultiOre%) × 60/(SkillSpeed + 0.4) × (1 + (score/d)^p) × OreValue × MinigameMulti`. The EXP part is capped at `max(12, 0.5 × EXP to next level)`, which is half a level (Choppin @3943128, Mining @5730407).

    | Minigame | k | d | p | Score multiplier at dev highscore | N.js |
    |---|---|---|---|---|---|
    | Choppin | 2 | 30 | 0.8 | 141 → ×4.45 (about 9 "minutes of chopping") | @3941600 |
    | Mining | 7 | 22 | 0.5 | 103 → ×3.16 (about 22) | @5730407 |
    | Fishing | 10 | 10 | 0.4 | 67 → ×3.14 (about 31) | @5718024 |
    | Catching | 10 | 17 | 0.7 | 128 → ×5.11 (about 51) | @5724505 |

    The "minutes" reading treats `60/(speed+0.4)` as actions per minute (M). Choppin also drops `min(2 + score·multi/20, 9)` reward piles, with leaves mixed in up to `min(ceil(score·multi/50), 4)` (N.js @3944003, H). Trees drop leaves based on the world ([wiki Choppin](https://idleon.wiki/wiki/Choppin)).
  - **MinigameMulti (H):** `1 + (StarSign "Miniature Game" 30% + Antifun Spirit bonus [+ talent 116 BOBBIN' BOBBERS for Fishing])/100` (N.js `MiningMinigame` @4203946, `FishingMinigame` @4221783, `CatchingMinigame` @4229207). Star sign 4b "Miniature Game" costs 2 constellation points ([wiki Star_Signs](https://idleon.wiki/wiki/Star_Signs)).
  - **Antifun Spirit prayer (W3 Worship, unlocks at wave 41 Acorn Assault):** bonus `700·(1+(L−1)/10)`%, curse `9·(1+(L−1)/10)` plays per attempt (TB [`parsers/world-3/prayers.ts#L47-L48`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/prayers.ts#L47-L48); N.js @14533537). At level 1 that is ×8 for 9 plays, 0.89x per play. At level 10 it is ×14.3 for 17 plays, 0.84x per play. So it **costs value and saves time**. With the base 5 plays you cannot even afford one attempt.
- **Goals and Milestones:**

  | Milestone | Minigame | Reward | Source |
  |---|---|---|---|
  | Score 20 | Choppin | Funguy "Videogame Highscores are COOL!" → Fur Shirt recipe | TB data `quests.json` (Funguy) |
  | Score exactly 12 | Choppin | Advances a Walupiggy quest step | N.js @3941600 (M which NPC) |
  | 15 yellow sections in a row | Choppin | Achievement "Hitting the Mark": +5% Choppin EXP | TB `achievements.json` #4 |
  | Score while the leaf is at hyperspeed | Choppin | Secret achievement: +1% Arcade balls/hr | #49 |
  | 141+ / 103+ / 67+ / 128+ | Choppin / Mining / Fishing / Catching | Steam-only "beat the developer": 25 gems and time candy | #39, #38, #88, #89 |
  | Slam a yellow vein (3 points) | Mining | +5% Mining EXP | #27 |
  | 1,000 fish across all plays | Fishing | Title-screen background | #93 |
  | Whale, then the Megalodon | Fishing | Whattso quest line; Bobber Challenge Scroll; Megalodon trophy (catch 2 whales in a row, miss the 3rd, then catch the behemoth) | `quests.json` Whattso; [wiki Fishing_Minigame](https://idleon.wiki/wiki/Fishing_Minigame) (prose 2023, Stale-risk) |
  | Golden hoop (3 points); Lava hoop (after 25 in a row) | Catching | +5% Catching Efficiency; +5% Catching EXP | #74, #107 |
  | 15 hoops in a row, or 90 total | Catching | Goldric "Hoopsies": 4 gems, 2× Tool Upgrade Stone III, 10k Catching EXP | `quests.json` Goldric |
  | Sum of the 4 skill highscores + Pen Pals | all | Tome "Total Minigame Highscore": 450 for full points (100) | N.js @5754635 (`TomeQTY[76]`); [wiki The_Tome](https://idleon.wiki/wiki/The_Tome) |
  | Every 25 Choppin points | Choppin | Mage CHOPPIN IT UP EZ: +x% damage per 25 points | TB [`parsers/damage.ts#L680-L683`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/damage.ts#L680-L683) |
  | Each Fishing point | Fishing | Barbarian BOBBIN' BOBBERS: +1 Fishing Power per point, up to the talent cap | TB [`parsers/efficiency.ts#L439-L440`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/efficiency.ts#L439-L440) |

- **Feeds / fed by:** Fed by: Gem Shop (Daily Minigame Plays), Star Signs (Miniature Game), Worship prayers (Antifun Spirit), class talents. Feeds: Choppin, Mining, Fishing and Catching resources and EXP; Quests (Funguy, Whattso, Goldric); Achievements; Tasks (W1 log-chopping tasks say "Minigames will probably make this easier", TB `tasks.json`); The Tome (W4); Mage and Barbarian damage and Fishing Power.
- **Per-session actions:** The pool is lost at the next reset, so it is "use it or lose it". It is only worth hands-on time while a highscore Milestone in the table above is still open, or for the Choppin and Fishing talent scaling. Otherwise ignore it. Idle state: `OLA[33] > 0` at the end of a day is a minor loss, not a Verdict issue. Toolbox shows the count (TB [`parsers/misc.ts#L564`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L564)) but has no alert.
- **AFK Setup implications:** None directly. To chase a highscore, use a character with harvest chance above 5% at the node, ideally with Miniature Game equipped. The character returns to its AFK target afterwards.
- **Min-max by stage:**
  - *Early W1:* get Choppin 20 (Funguy) and the Mining yellow-vein achievement. Equip Miniature Game only on a character you will actually use for plays.
  - *Mid W1–W2:* Mage: push the Choppin highscore in 25-point steps (damage). Barbarian: push the Fishing highscore up to the BOBBIN' BOBBERS cap. Do the Catching Goldric quest (90 total hoops is enough), Golden and Lava hoops, and the Whattso fishing quests.
  - *Late W3:* skip Antifun Spirit unless you value time over output. Do not buy Daily Minigame Plays.
  - *W4 outline:* the Tome credits the sum of highscores up to 450, so the cheapest Tome points are the minigame with the most headroom.
- **Common mistakes:** Buying Daily Minigame Plays (`gemShopPurchases[72] > 0`). Equipping Antifun Spirit "for minigames" (the prayer is in a character's prayers while `OLA[33] < 9`). Playing on a character with harvest chance at or below 5%, which pays nothing.
- **Save and Toolbox fields:** `accountOptions[33]` (TB enum `MINIGAME_PLAYS`, [`data/account-options-enum.js#L15`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/account-options-enum.js#L15)). Raw `FamValMinigameHiscores` or `FamilyValuesMap.MinigameHiscores` with index 0 chop, 1 fish, 2 catch, 3 mine. Toolbox `account.highscores.minigameHighscores` ([`parsers/highScores.ts#L4`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/highScores.ts#L4), `#L28`); `getMinigameScore` (`parsers/misc.ts#L1378`); `calcMinigameTotalScore` sums the first 5 entries (`highScores.ts#L76-L78`). Gem purchases: raw `GemItemsPurchased[72]`.
- **Sources:** N.js offsets above (v1.23). TB files above. Wiki [Minigames](https://idleon.wiki/wiki/Minigames) (2026-10-07; prose undated), [Choppin](https://idleon.wiki/wiki/Choppin), [Mining](https://idleon.wiki/wiki/Mining), [Fishing](https://idleon.wiki/wiki/Fishing), [Catching](https://idleon.wiki/wiki/Catching) (all 2026-10-03/06 bot edits), [Prayers](https://idleon.wiki/wiki/Prayers).

## Choppin minigame

- **What it is:** Tap while the moving marker is over green (1 point) or yellow (2 points; also slows the game). Each bounce off the sides speeds it up ([wiki Choppin](https://idleon.wiki/wiki/Choppin), L).
- **Unlocks:** Any tree, W1 onward (Oak Tree in Spore Meadows is the first). Harvest chance must be above 5%.
- **Scope:** Shared account pool and account highscore (`MinigameHiscores[0]`); per-character multiplier.
- **Inputs → outputs:** 1 shared play → logs + leaves + Choppin EXP. Formula and k=2, d=30, p=0.8 in the shared section (H).
- **Goals and Milestones:** Score 20 (Funguy), 15 yellows in a row, the hyperspeed-leaf secret, 141+ (Steam), every 25 points (Mage talent).
- **Feeds / fed by:** Choppin, the Mage damage talent, the Tome. Fed by Miniature Game and Antifun.
- **Per-session actions:** Only while chasing the Milestones above.
- **AFK Setup implications:** None.
- **Min-max by stage:** Early: 20. Mage builds: push the score in 25-point steps. Late: Tome headroom.
- **Common mistakes:** Not clicking repeatedly on the opening green pass (wiki strategy note, L).
- **Save and Toolbox fields:** `MinigameHiscores[0]`; TB `getMinigameScore(account,'chopping')`.
- **Sources:** As in the shared section.

## Mining minigame

- **What it is:** Jump and slam onto ore nodes (copper 1, platinum 2, starfire or yellow vein 3 points) while avoiding pits, at rising speed ([wiki Mining](https://idleon.wiki/wiki/Mining), L).
- **Unlocks:** Any ore node in W1+. Harvest chance must be above 5%. You can replay after leaving the ore pile without re-entering the map (2022 change, [wiki Changelog_2022](https://idleon.wiki/wiki/Changelog_2022)).
- **Scope:** Shared pool; `MinigameHiscores[3]`.
- **Inputs → outputs:** Ore + Mining EXP; k=7, d=22, p=0.5 (H).
- **Goals and Milestones:** Yellow-vein slam (+5% Mining EXP), 103+ (Steam).
- **Feeds / fed by:** Mining; the Tome.
- **Per-session actions:** One-off achievement only.
- **AFK Setup implications:** None.
- **Min-max by stage:** Get the yellow-vein achievement early; otherwise skip.
- **Common mistakes:** Spending daily plays here for ore. One play is about 20 minutes of mining at a top score (M).
- **Save and Toolbox fields:** `MinigameHiscores[3]`.
- **Sources:** As above.

## Fishing minigame

- **What it is:** Hold to charge, release to cast onto fish (green 1, eel 2, squid 3, whale 5), avoiding mines. Streaks unlock the bigger fish: eels after 3 greens, squid after 3 more, the whale after 7 more. Catching the whale resets the streak ([wiki Fishing](https://idleon.wiki/wiki/Fishing), L).
- **Unlocks:** W2 fishing spots. No harvest gate (H).
- **Scope:** Shared pool; `MinigameHiscores[1]`.
- **Inputs → outputs:** Fish + Fishing EXP; k=10, d=10, p=0.4. The multiplier includes the Barbarian talent BOBBIN' BOBBERS (H).
- **Goals and Milestones:** Whattso chain (The Whaley Hard Minigame, Bobbin' Bobbers, The Biggest Fish in the Sea), Megalodon trophy, 1,000 total fish, 67+ (Steam), Barbarian Fishing Power cap.
- **Feeds / fed by:** Fishing, Barbarian Fishing Power, the Tome.
- **Per-session actions:** Barbarian: until the talent cap. Others: quest steps only.
- **AFK Setup implications:** None.
- **Min-max by stage:** W2: the Whattso quests. Barbarian: Fishing Power.
- **Common mistakes:** Missing a cast breaks the streak, and the streak is what spawns the high-value fish (L).
- **Save and Toolbox fields:** `MinigameHiscores[1]`; TB `efficiency.ts#L439-L440`.
- **Sources:** As above; quests from TB `data/website-data/quests.json` (Whattso).

## Catching minigame

- **What it is:** A Flappy-Bird clone. Fly through hoops (orange 1, green 2, gold 3, lava 10); hitting the ground or a ring edge ends the run ([wiki Catching](https://idleon.wiki/wiki/Catching), L).
- **Unlocks:** W2 bug nests. Harvest chance must be above 5%.
- **Scope:** Shared pool; `MinigameHiscores[2]`.
- **Inputs → outputs:** Bugs + Catching EXP; k=10, d=17, p=0.7 (H).
- **Goals and Milestones:** Goldric Hoopsies (15 in a row or 90 total), Golden hoop, Lava hoop (25 in a row first), 128+ (Steam).
- **Feeds / fed by:** Catching, Quests, Achievements, the Tome.
- **Per-session actions:** Quest and achievements only. The 90-total route finishes Hoopsies without skill.
- **AFK Setup implications:** None.
- **Min-max by stage:** W2: Hoopsies, then Golden hoop. Lava hoop is optional.
- **Common mistakes:** The Quest Helper UI blocks the play area (wiki tip, L).
- **Save and Toolbox fields:** `MinigameHiscores[2]`; Goldric quest progress in `QuestStatus`.
- **Sources:** As above.

## Swishy Hoops (basketball)

- **What it is:** A W1 basketball minigame with 3 lives. Each point scored becomes one Ball Point, spent at the shop in Valley of the Beans on four permanent account bonuses ([wiki Minigames](https://idleon.wiki/wiki/Minigames)). It replaced an older once-a-day basketball "Daily Trial" (2024) in v1.00 "World 7" (2025-11-06, [wiki Changelog_2025](https://idleon.wiki/wiki/Changelog_2025)).
- **Unlocks:** Play at the hoop in Valley of the Beans (W1, "Bored Bean" map), or use the **Basketball** usable item anywhere, even in Auto mode. The item comes from the W1 town shop or the Promotheus quest "Three Right Answers" ([wiki Basketball](https://idleon.wiki/wiki/Basketball); TB `quests.json`). While DMG upgrade level is below 3 you get 5 free points before misses cost lives (N.js @9589241, H).
- **Scope:** Account-wide (all `OLA`).
- **Inputs → outputs (H):**
  - **Play gate:** playable when `OLA[243] == 0`. Otherwise the item says "You have to wait another N seconds" (N.js @8247667).
  - **Cooldown:** when a game ends, `OLA[423] = [90,90,180,300,480,720,900,900][min(6, OLA[424])]` seconds, where `OLA[424]` counts the day's plays and is increased at game start (N.js @9610662, @9597088). So after the 1st, 2nd, 3rd, 4th, 5th and 6th+ plays of a day you wait 90, 180, 300, 480, 720 and 900 s.
  - The cooldown ticks online and offline (N.js @5028753 and @15078786). The daily reset zeroes `OLA[243]`, `[423]` and `[424]` (N.js @15097122). After the 6th play that is about 4 plays an hour at most.
  - **Points:** `OLA[418] += score × (1 + 0.5·EventShopOwned[24])` (darts twin at N.js @9593229; hoops display @9591202).
  - **Shop** (unlock by **total levels bought** across the four upgrades, `"0,12,80,200"`, N.js @13114838 and @12886361):

    | Upgrade | Effect per level | Cost (points) for next level at level L | Unlocks at total levels |
    |---|---|---|---|
    | DMG | +1% damage to monsters (`OLA[419]`, added into the damage sum, N.js @4112699) | `floor(1 + L/20)` | 0 |
    | COIN | +1% coins from monsters (`OLA[420]`, N.js @4046009) | `floor(1 + L/20)` | 12 |
    | EXP | +1% Class EXP from kills (`OLA[421]`, N.js @4262149) | `floor(3 + L/8)` | 80 |
    | SKILL | +1% efficiency for all skills (`OLA[422]`, N.js @4192297) | `floor(1 + L/20)` | 200 |

    Costs from `HoopsUpgCost` (N.js @10951556). The **Baller** trophy needs **40 points in one game** (reward type switches at score ≥ 40, `HoopsRewardType` N.js @10781047). Baller gives +3 to every stat, 3% All Stats and 3% All AFK Gain ([wiki Baller](https://idleon.wiki/wiki/Baller)).
- **Goals and Milestones:**

  | Milestone | Why |
  |---|---|
  | 12 total levels | COIN unlocks |
  | 80 total levels | EXP unlocks |
  | 200 total levels | SKILL (all-skill efficiency) unlocks |
  | Best score 40 | Baller trophy |

- **Feeds / fed by:** Feeds: damage, coins (→ Stamps, Upgrade Vault and other coin sinks), Class EXP, all skilling efficiency, trophies (Trophies System). Fed by: Event Shop bonus 24 (+50% points; seasonal events, see the resets dossier).
- **Per-session actions:** Play once whenever the cooldown is up (`OLA[423] <= 0`, i.e. `OLA[243] == 0`), then spend all points (`OLA[418] >= next cost`). Cheapest-first works because DMG, COIN and SKILL cost about 1 point a level for their first 20 levels.
- **AFK Setup implications:** None. The item works from any map, so nobody has to move.
- **Min-max by stage:**
  - *Early W1:* buy the Basketball item. Spend on DMG until COIN opens at 12 total.
  - *Mid:* keep DMG, COIN and SKILL level (each is 1 point a level until level 20). EXP costs 3+ points from the start, so buy it after the cheap levels.
  - *Late W3:* the 200-level SKILL unlock, then the Baller trophy attempts.
  - *W4:* same, with points scaling with skill only.
- **Common mistakes:** Unspent points (`OLA[418] > cost`; the W2 test save had 7 points and 0 levels). Never buying the item, so you have to walk to the map. Treating it as once a day (pre-2025 design).
- **Save and Toolbox fields:** `OLA[242]` best (TB enum `HOOPS_SCORE`, [`account-options-enum.js#L152`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/account-options-enum.js#L152)), `[243]` on-cooldown flag, `[418]` points, `[419..422]` levels, `[423]` cooldown seconds, `[424]` plays today. Toolbox `getHoopsData` ([`parsers/highScores.ts#L99-L116`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/highScores.ts#L99-L116)) **uses the Darts cost formula**. Use the N.js `HoopsUpgCost` above instead. Toolbox does not read `OLA[418]`.
- **Sources:** N.js offsets above; [wiki Minigames](https://idleon.wiki/wiki/Minigames) ("every few minutes", prose undated); [Changelog_2025](https://idleon.wiki/wiki/Changelog_2025) v1.00; Reddit "what is your highest score on the hoops minigame" (2025-12-10, [1pjhplf](https://www.reddit.com/r/idleon/comments/1pjhplf/)): most players report 15–39, and 40 is called very hard (L).

## Throwy Darts

- **What it is:** A W1 darts minigame with 3 lives. The aim sweeps automatically and you tap to throw. Rings score gray 1, tan 2, green 3 and red (bullseye) 5. Gray stops scoring after the 10th scoring hit and tan after the 26th. Every 3rd bullseye in a row gives +1 life and +5; every 9th gives +2 lives, +20 and the trophy. Wind changes every 6th scoring hit ([wiki Minigames](https://idleon.wiki/wiki/Minigames) gameplay tables, L–M). Points are spent at the shop in Winding Willows. Added in v1.00 (2025-11-06).
- **Unlocks:** Play in Winding Willows (W1, Baby Boa map), or use the **Darts** item anywhere. The item comes from the W1 town shop or Funguy's "Mushroom Munchies" ([wiki Darts](https://idleon.wiki/wiki/Darts); N.js patch note @14418923 "buy it in World 1 Town shop").
- **Scope:** Account-wide.
- **Inputs → outputs (H):** Cooldown `[60,90,180,300,480,720,900,900][min(6, OLA[440])]` after each game, with the counter increased at start, so in practice 90 s up to 900 s, exactly like Hoops (N.js @9626243, @9611700). Gate flag `OLA[441]`. Points `OLA[434] += score × (1 + 0.5·EventShopOwned[24])` on exit (N.js @9593229). Shop (`DartsUpgCost` N.js @10951781; unlocks at total levels `"0,40,150,250"` N.js @13115458):

  | Upgrade | Effect per level | Cost at level L | Unlocks at total levels |
  |---|---|---|---|
  | DMG | +1% extra damage (`OLA[435]`, in a damage multiplier, N.js @4112699) | `floor(2 + L/12)` | 0 |
  | TALENT | +1 Talent Point for tab 1 (`OLA[436]`, N.js @4378160) | `floor(3 + 4L)` | 40 |
  | VAULT | All Upgrade Vault costs ×1/(1 + L/100) (`OLA[437]`, `VaultUpgCost` N.js @10879565; TB [`upgradeVault.ts#L69`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc/upgradeVault.ts#L69)) | `floor(2 + L/12)` | 150 |
  | SPEED | +1% movement speed (`OLA[438]`, N.js @4136227) | `floor(5 + 20L)` | 250 |

  **Nine Dart Finish** (9 bullseyes in a row): Weapon Power 9, DEF 50, **9% Drop Rate multi, 9% AFK Gains multi** ([wiki Nine_Dart_Finish](https://idleon.wiki/wiki/Nine_Dart_Finish), bot data).
- **Goals and Milestones:**

  | Milestone | Why |
  |---|---|
  | 40 total levels | TALENT opens (+1 tab-1 point each; cost rises by 4 per level) |
  | 150 total levels | VAULT opens: every vault upgrade cheaper, compounding with the Upgrade Vault Spend Plan |
  | 250 total levels | SPEED opens (expensive; movement speed is capped elsewhere, so low value, M) |
  | 9 bullseyes in a row | Nine Dart Finish trophy |

- **Feeds / fed by:** Feeds: damage, Talents (tab 1), the **Upgrade Vault** (cost multiplier), movement, Drop Rate and AFK via the trophy. Fed by Event Shop bonus 24.
- **Per-session actions:** Same as Hoops. Play when `OLA[439] <= 0`, then spend `OLA[434]`.
- **AFK Setup implications:** None.
- **Min-max by stage:**
  - *Early W1:* buy the item and play it every Play Session. DMG to 40 total opens TALENT.
  - *Mid:* split between TALENT (early levels are cheap: 3, 7, 11…) and DMG until 150 total; then VAULT.
  - *Late W3 / W4:* VAULT before SPEED. Attempt the trophy whenever a run is at 6+ bullseyes in a row.
  - Class: none. The tab-1 points help every class.
- **Common mistakes:** Unspent points (the W2 test save had 29 points and 0 levels). Skipping Darts because "minigames are low value" when this one feeds the Vault.
- **Save and Toolbox fields:** `OLA[442]` best (TB enum `DARTS_SCORE`, `#L153`), `[434]` points, `[435..438]` levels, `[439]` cooldown, `[440]` plays, `[441]` flag. TB `getDartsData` ([`highScores.ts#L80-L97`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/highScores.ts#L80-L97)) has the right costs, but leaves the VAULT description placeholder unfilled and does not read `OLA[434]`.
- **Sources:** As above. Reddit (2025-12-10, [1pjhplf](https://www.reddit.com/r/idleon/comments/1pjhplf/)): "8 in a row on darts", "quick access items to both in W1 town" (L).

## Spiketrap Surprise

- **What it is:** A W1 survival room ringed by spikes that fire in patterns. You survive rounds, and the reward is gems once per day ([wiki Secrets](https://idleon.wiki/wiki/Secrets)).
- **Unlocks:** The portal in Vegetable Patch (W1), or type "If u love me let me go" in chat to teleport ([wiki Secrets](https://idleon.wiki/wiki/Secrets), [Worlds](https://idleon.wiki/wiki/Worlds) "BG1 – Spike Surprise").
- **Scope:** Account-wide flag and highscore.
- **Inputs → outputs (H):** A round starts at the top of every hour (`3600 − GlobalTime % 3600` countdown), seeded by the hour number (`makeRandom(GlobalTime/3600)`). Each round lasts about 13 s (N.js @23176343–@23179352). The seed is the same for every player that hour, so the pattern is deterministic per hour and could be precomputed like Random Events (M). Gems = `min(40, 2·(r−1) + max(r−4,0) + max(r−8,0))` for the best round r. They are paid when you leave, as `ceil(n/2)` gem drops, and only while the daily flag `OLA[7]` is set (N.js @23179637, @15262694). The daily reset sets `OLA[7] = 1` if it is 0 (N.js @15120221). Dying in round 1 does not touch the flag, so you can retry.

  | Best round | 2 | 3 | 5 | 10 | 13 | 15+ |
  |---|---|---|---|---|---|---|
  | Gems | 2 | 4 | 9 | 26 | 38 | 40 |

- **Goals and Milestones:** Round 3 (W1 task "Spiketrap Strikeout", TB `tasks.json` [0][21]); round 13 (Tome full credit, 100 points, [wiki The_Tome](https://idleon.wiki/wiki/The_Tome); Steam achievement "Spike Minigame Master": 20 gems and a 4 hr candy).
- **Feeds / fed by:** Gems (→ Gem Shop), Tasks, the Tome.
- **Per-session actions:** If a Play Session crosses :00 and the daily gems are unclaimed (`OLA[7] == 1`), enter before the hour. It is the only minigame tied to wall-clock time.
- **AFK Setup implications:** It occupies the active character for the round, about 1–3 minutes (M).
- **Min-max by stage:** Every stage: do it daily for gems if convenient. Push to 13 once for the Tome.
- **Common mistakes:** Believing the 30-gem cap from the wiki and stopping at round 10. Not knowing about the chat shortcut.
- **Save and Toolbox fields:** `OLA[201]` best round (TB enum `SPIKE_MINIGAME_ROUNDS`, `#L237`; TB `minigameHighscores` "spiketrap"); `OLA[7]` daily gem flag / pending gems. Toolbox has no alert.
- **Sources:** N.js offsets above; wiki [Secrets](https://idleon.wiki/wiki/Secrets) (2026-10-07; says "up to 30 gems", contradicted by code), [Daily_Checklist](https://idleon.wiki/wiki/Daily_Checklist) (2026-03-24, Stale-risk), [Tips_and_Tricks](https://idleon.wiki/wiki/Tips_and_Tricks).

## Orion the Great Horned Owl's Feather Enterprise

- **What it is:** An idle clicker. Feathers are generated every second, online and offline. You spend them on 9 upgrades. One of them, **Bonuses of Orion**, never resets and grants real-game stats. Feather Restarts (mini resets) and The Great Mega Reset (Megafeathers) multiply progress ([wiki Orion](https://idleon.wiki/wiki/Orion_the_Great_Horned_Owl%27s_Feather_Enterprise)).
- **Unlocks:** "Orion the Owl can be found in the SECRET portal on the Bored Beans map" (Valley of the Beans, W1) (N.js hint @11889346, H). Then follow the HOOT popups. Accrual needs Feather Generation level ≥ 1 (`OLA[254] > 0`, N.js @5026030). Later it is reachable from the Codex quick-ref (v1.02, [Changelog_2025](https://idleon.wiki/wiki/Changelog_2025)).
- **Scope:** Account-wide.
- **Inputs → outputs (H):**
  - **Offline accrual:** `OLA[253] += OwlFeatherRate × seconds away (+ shiny gen)`, and progress `OLA[263]` grows likewise (N.js @5026030). No cap was found on this path (M).
  - **Feather rate** (TB [`owl.ts#L92-L105`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-1/owl.ts#L92-L105)): `(gen + 5·superProd + Obsidian terms) × (1+5%·mult) × (3+2·Pristine)^restarts × (1+shiny%) × 10 (Maple) × vault "Go Go Secret Owl" × W5/W7 terms`.
  - **Upgrades:** cost and unlock thresholds below (unlock = run progress `OLA[263]` above x3). Costs are `x1 × x2^level` after cheapeners; Feather Generation is `x1·L·max(1.05, x2 − 0.025·Midas)^L` (TB `owl.ts#L41-L47`, game `Summoning:OwlCost`).

    | # | Upgrade | x1 | x2 | Unlock (progress) | Resets on |
    |---|---|---|---|---|---|
    | 0 | Feather Generation (+1/s per level) | 5 | 1.1 | 100 | Restart |
    | 1 | **Bonuses of Orion** | 350 | 25 | 1,000 | never |
    | 2 | Feather Multiplier (+5%) | 500 | 1.11 | 2,500 | Restart |
    | 3 | Feather Cheapener | 3,000 | 1.16 | 30,000 | Restart |
    | 4 | Feather Restart (×3^(resets+1)) | 1e6 | 14 | 750,000 | Mega |
    | 5 | Super Feather Production (+5/s) | 2e6 | 1.12 | 1e7 | Restart |
    | 6 | Shiny Feathers | 5e6 | 1.4 | 2.5e8 | Mega |
    | 7 | Super Feather Cheapener (20%) | 5e7 | 1.27 | 5e9 | Restart |
    | 8 | The Great Mega Reset (+1 Megafeather) | 2.5e11 | 20 | 1e11 | — |

    Data: TB `data/website-data/shared-data.json` `owlData`. The reset code zeroes 253 (to 5), 254, 256, 257, 259, 260, 261 and 263; Mega also zeroes 258 and 264 (N.js @12257587, H).
  - **Bonuses of Orion:** level L gives each of 6 stats `ceil((L − offset)/6)` stacks, in the cycle +5% Class XP, +10 Base DMG, +2% Total DMG, +4% Skill XP, +1% Drop Rate, +2 All Stat. All are multiplied by `(1 + MegaBonus)(1 + Legend talent 26)(1 + companion 51)`. MegaBonus = +100% each for Megafeathers 2, 4, 6 and 8, plus +100% for the 10th and +50% per Megafeather beyond it (TB `owl.ts#L106-L138`).
  - **Megafeathers** (10 named, then Fractal repeats): Maple ×10 feathers; Amethyst ×2 bonuses; Frostraven 1% cheaper per Feather Generation level; Phoenix ×3; Obsidian cheapeners add feathers/s; Evergreen ×4; Pristine restart ×5; Lavathian ×5; Midas slower Feather Generation cost growth; Fractal ×6, then +0.5x each.
- **Goals and Milestones:**

  | Milestone | Why |
  |---|---|
  | Feather Restart unlock (750k progress) | First mini reset; each restart multiplies the rate by 3 (5 with Pristine) |
  | Megafeather 1 (Maple) | ×10 feather rate |
  | Megafeathers 2/4/6/8/10 | Orion bonuses ×2 → ×6 |
  | 10 Megafeathers **and** 12 Poppy Megafish | W3 Equinox "Dream" challenge unlocks the next Equinox upgrade (N.js @14324253) |
  | Megafeathers 12 | Tome "Megafeathers Earned" full credit (12 → 250 points, [wiki The_Tome](https://idleon.wiki/wiki/The_Tome)) |
  | ~19 Megafeathers | Community soft goal; later resets take days or weeks (Reddit 2025-11, L) |

- **Feeds / fed by:** Feeds: Class XP, damage, Skill XP, Drop Rate and All Stat (Character builds), the Equinox (W3), the Tome. Fed by: Upgrade Vault "Go Go Secret Owl" (vault 21), and later-world sources (Pet Arena, Gambit, Fountain, Meritocracy, Legend talents, companion 51, Menagerie cheapener boost 16; all W4+ or W7, out of scope).
- **Per-session actions:** Open Orion, hold-buy upgrades. Toolbox alerts when a Feather Restart or Mega Reset is affordable (TB [`utility/dashboard/account.js#L402-L417`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/account.js#L402-L417)). Mega Reset as soon as it is available (community consensus, Reddit [1fv1vsg](https://www.reddit.com/r/idleon/comments/1fv1vsg/) 2024-10-03, L). Endgame rule of thumb: upgrade each one until its cost equals feathers/sec, then wait (Reddit [1p0kuqz](https://www.reddit.com/r/idleon/comments/1p0kuqz/) 2025-11-18, L).
- **AFK Setup implications:** None; it accrues while the game is closed.
- **Min-max by stage:**
  - *Early W1:* unlock it immediately. Get the first Megafeathers in one or two active sittings (Reddit [1h3x0yk](https://www.reddit.com/r/idleon/comments/1h3x0yk/), 2024-12, L).
  - *Mid W2:* aim for 10 (Fractal) before W3 for the Equinox dream. Buy "Go Go Secret Owl" in the Upgrade Vault Spend Plan.
  - *Late W3:* 12+ for the Tome; Bonuses of Orion levels as feathers allow.
  - *W4:* passive; one visit a day.
- **Common mistakes:** Stopping at a few Megafeathers. Pouring feathers into Bonuses of Orion before the multiplier Megafeathers (Reddit, L). Detect: `OLA[262] < 10` once in W3; `OLA[255]` high with `OLA[262]` low.
- **Save and Toolbox fields:** `OLA[253]` feathers, `[254..261]` upgrade levels (254 gen, 255 Bonuses, 256 mult, 257 cheap, 258 restarts, 259 super prod, 260 shiny, 261 super cheap), `[262]` Megafeathers, `[263]` run progress, `[264]` shiny feathers. Toolbox `account.owl` (`parsers/index.ts#L361`).
- **Sources:** N.js offsets; TB [`parsers/world-1/owl.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-1/owl.ts); wiki Orion page (2026-10-07 bot tables); Reddit as cited. Both test saves had 12 Megafeathers.

## Poppy the Kangaroo Mouse's Fish Pond

- **What it is:** The W2 idle clicker. Bluefin fish are caught every ~30 s; clicking the pond gives +1 fish (throttled). There are 12 upgrades plus Fisheroo Resets that grant reset points for five "reset spiral" bonuses, a Tar Pit (Tartar fish, 8 upgrades) and Greatest Catch (Megafish) ([wiki Poppy](https://idleon.wiki/wiki/Poppy_the_Kangaroo_Mouse%27s_Fish_Pond)).
- **Unlocks:** Buy the **Secret Map** at the bottom of the W2 town shop. It guides you to The Oasis (map 73) and then teleports you there (N.js hint @11890603, H; wiki).
- **Scope:** Account-wide.
- **Inputs → outputs (H):** Offline seconds bank into `OLA[288]` (bluefin) and `[289]` (shiny), and Tartar into `[305]`. They convert into fish only when the Poppy menu is open. All banked catches convert at once (N.js `_event_Kangaroo` @11932855; TB [`kangaroo.ts#L100-L105`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-2/kangaroo.ts#L100-L105)), so nothing is lost. The raw `OLA[267]` understates what you can afford until you open the menu.
  - **Upgrades** (x1, x2, unlock progress): Tasty Fishbait (4, 1.06, 100); Quick Reeling (150, 1.2, 500); Shiny Lure (500, 3.5, 2.5k); **Bonuses from Poppy** (10k, 3, 30k; never resets); Fishy Discount (30k, 1.13, 250k); Juicy Worm (150k, 1.07, 3M); Fisheroo Reset (40M, 20, 25M); Fishing Buddy (1.2B, 7.5, 600M); Lightning Quickness (600M, 1.12, 4B); Fisheroo Investing (7.5B, 1.7, 14B); Multihook (20B, 1.12, 80B); Greatest Catch (1.5T, 15, 400B) (TB `shared-data.json` `poppyBonuses`).
  - **Bonuses from Poppy:** 7-stat cycle `ceil((L − offset)/7)` stacks of +3% Fishing Efficiency, +3 DEF, +5% Fishing XP, +2% Accuracy, +2% Total DMG, +0.5% AFK Gains, +3% Cash. Multiplied by +50% for each of Megafish 2, 4, 7 and 9, +50% for the 12th and +25% per Megafish beyond it (TB `kangaroo.ts`).
  - **Megafish** unlock the Tar Pit upgrades (1st: 3, 5th: 3 more, 8th: the last 2) and the other bonuses listed on the wiki.
- **Goals and Milestones:**

  | Milestone | Why |
  |---|---|
  | Bonuses from Poppy unlock (30k progress) | Permanent stats start |
  | Fisheroo Reset (25M progress) | Reset points into spirals (bluefin, shiny, cheaper, other-resets, tartar) |
  | Megafish 1 | Tar Pit opens |
  | 12 Megafish | W3 Equinox dream (with 10 Megafeathers); Tome "Megafish Earned" full credit at 12 |

- **Feeds / fed by:** Feeds: Fishing, AFK Gains, Total DMG, Cash, the Equinox, the Tome, and Bubba's "Crossover" upgrade (+5% meat per power-of-10 of Poppy fish). Fed by: Upgrade Vault "Go Go Secret Kangaroo Mouse" (vault 45), Event Shop 52 "Fishmaxxing" (×5 fish, upgrades 75% cheaper; seasonal), and later-world sources.
- **Per-session actions:** Open Poppy to convert the bank and spend. Fisheroo Reset when the reset is affordable. Toolbox alerts on fisheroo reset, greatest catch and a shiny-progress threshold (TB [`account.js#L671-L694`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/account.js#L671-L694)).
- **AFK Setup implications:** None.
- **Min-max by stage:**
  - *W2:* unlock as soon as you can afford the map. Reset spiral allocation, per the Discord guide quoted on Reddit (2025-03-07 [1j5yhp6](https://www.reddit.com/r/idleon/comments/1j5yhp6/), restated 2026-05-19 [1thql9o](https://www.reddit.com/r/idleon/comments/1thql9o/), L): **shiny speed caps at 100, Tartar at 250, the rest 1:1:4 bluefin : cheaper : higher-reset-bonuses**.
  - *Mid–late W3:* work toward 12 Megafish for the Equinox. Unlike Orion, do not mini-reset as eagerly (Reddit [1fv1vsg](https://www.reddit.com/r/idleon/comments/1fv1vsg/), L).
  - *W4:* passive.
- **Common mistakes:** Judging affordability from `OLA[267]` without the bank (use TB `totalFish`). Over-investing the capped spirals. Both test saves (W2 and W3) had **0 Megafish** after 3–4 Fisheroo Resets, so Greatest Catch is the open Goal (detect `OLA[279] == 0` with `OLA[274] > 0`).
- **Save and Toolbox fields:** `OLA[267]` fish; `[268..279]` upgrade levels (274 = Fisheroo resets, 279 = Megafish); `[280]` progress; `[281..286]` shiny multipliers; `[288]`/`[289]`/`[305]` banks; `[291..295]` reset spirals; `[296]` Tartar fish; `[297..304]` Tar upgrades. Toolbox `account.kangaroo` (`fish`, `pendingFish`, `totalFish`, `megaFish`, `resetBonuses`).
- **Sources:** As cited; [Changelog_2026](https://idleon.wiki/wiki/Changelog_2026) v1.20 (Meritocracy now boosts Poppy fish gain; W7 Ballot, out of scope).

## Bubba the Chonky Seal's Arctic Market of Meats

- **What it is:** The third idle clicker, added in v1.02 "Big Bubba" (2025-11-23). Meat Slices are produced every second. Upgrades unlock six sub-features (Happiness pats, Charisma chart, gifts, dice, smoker, spare coins). **No mini resets:** a run lasts until the next Megaflesh ([Changelog_2025](https://idleon.wiki/wiki/Changelog_2025); [wiki Bubba](https://idleon.wiki/wiki/Bubba_the_Chonky_Seal%27s_Arctic_Market_of_Meats)).
- **Unlocks:** In the Codex, "where Orion normally is". The game gates it on `KillsLeft2Advance[50][0] <= 0` (N.js `BubbaUnlocked` @11150785, H). Map 50 is the W2 town, and its portal 0 leads to the W3 town (TB `shared-data.json` `mapPortalDestinations["50"] = [100,51,0]`). So the logged-in character must have opened the W2→W3 portal (M). The W2 test save had 1 there (locked) and the W3 save 0.
- **Scope:** Account-wide (raw `Bubba` array).
- **Inputs → outputs:** Upgrade types unlock as lifetime meat reaches `50·(2.8 + i/3.55)^(i − min(1, floor(i/4)))` (TB [`clickers/bubba.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/clickers/bubba.ts) `getMeatProdREQ`). **Bubba Boon** (never resets) cycles 7 bonuses: +10% Build Rate, +5% Critter gain, +5% Soul gain, +15% Total DMG, +1% All Kills, 4% XP multi, −3% Atom cost. Megaflesh 2, 4, 7, 10 and 12 multiply them ×1.2 to ×2+ (wiki).
- **Goals and Milestones:** Each Megaflesh; 12 for Tome "Megaflesh Earned" full credit ([wiki The_Tome](https://idleon.wiki/wiki/The_Tome)); the Smoker (meat multiplier that grows with waiting).
- **Feeds / fed by:** Feeds: Construction (W3), Trapping critters, Worship souls, damage, kills (Death Note and portals), Class EXP, Atom Collider (W4+ cost). Fed by: Poppy fish (Crossover), Upgrade Vault, and later-world sources.
- **Per-session actions:** Pat Bubba (Happi Boi gives a few pats per hour), buy upgrades, collect the smoker. Toolbox timers exist for Megaflesh and max smoker (TB `utility/dashboard/alertMeta.js#L1161-L1162`).
- **AFK Setup implications:** None.
- **Min-max by stage:** *W3:* unlock on arrival and buy Bubba Boon early for Build Rate and Critter and Soul gain. *W4:* Atom cost. Community: aim for steady Megaflesh like Orion (Reddit [1pgn3jh](https://www.reddit.com/r/idleon/comments/1pgn3jh/), 2025-12-07, L).
- **Common mistakes:** Not knowing it exists (it has no map). Players in W3 with an all-zero `Bubba[0]`.
- **Save and Toolbox fields:** raw `Bubba` (`[0][4]` lifetime meat, `[1][8]` Megaflesh count, read by the Megaflesh-owned helper at N.js @11150294, H); Toolbox `account.bubba` (`megafleshOwned`, `upgrades`, `bonuses`, `smokerSeconds`).
- **Sources:** As cited. Several Bubba cost and scaling fixes landed in Toolbox recently (TB `data/patch-notes.js`), so treat older Toolbox numbers as Stale.

## Colosseum (Dewdrop, Sandstone, Chillsnap, Astro)

- **What it is:** A ticket-entry arena. You have 5 minutes for the waves (15 waves in each of the W1–W4 Colosseums; the last includes a boss), and chests drop by score. "Next Round" raises the score multiplier, and multi-kills and a time bonus for a full clear add to it ([wiki Colosseum](https://idleon.wiki/wiki/Colosseum), 2025-08-28, Stale-risk; wave counts `[15,15,15,15,25,50]` from N.js `ColosseumWaves` @14032574, H).
- **Unlocks:** Dewdrop at Froggy Fields (top right, 1 ticket); Sandstone at The Mimic Hole (2); Chillsnap at Snowfield Outskirts (3); Astro at TV Outpost (6) (N.js `ColosseumInfo` @14032574 column 3, H). Tickets: one per day per NPC after the Typhoon (W1), Centurion (W2) and Lonely Hunter (W3) quests, banking 3 days. W4 has no NPC; Astro tickets come from the Cosmic Carrier Post Office order (see the resets dossier and [wiki Colosseum_Ticket](https://idleon.wiki/wiki/Colosseum_Ticket)).
- **Scope:** Tickets and highscores are account-wide; the run is per character.
- **Inputs → outputs (H, N.js @5492440 and @5512825):** For a run with score S and Colosseum row (A, B, C):
  - Chest A drops for each `e = 0..2` with `S > A·e^5`.
  - Chest B for each `e = 0..1` with `S > B·(e+1)^4`.
  - Chest C (only after a full clear, in the time-bonus branch) for each `b = 0..2` with `S > C·(b+1)^2`.
  - Chest "HP" grows with S^0.16, S^0.12 and S^0.09.

  | Colosseum | Tickets | Chest A at | Chest B at | Chest C (full clear) at | Achievement |
  |---|---|---|---|---|---|
  | Dewdrop | 1 | >0, >10k, >320k | >10k, >160k | >50k, >200k, >450k | 25k → "Colosseum Contender" (RNG item unlock) |
  | Sandstone | 2 | >0, >25k, >800k | >60k, >960k | >125k, >500k, >1.125M | 200k → "Sweet Victory" (+2% Arcade balls/hr) |
  | Chillsnap | 3 | >0, >50k, >1.6M | >125k, >2M | >300k, >1.2M, >2.7M | 2.5M → "Cool Score!" (W3 Colosseum + Shops EZ-Access) |
  | Astro | 6 | >0, >125k, >4M | >325k, >5.2M | >650k, >2.6M, >5.85M | 10M → "Zero G Scorin'" (+5% Cash) |

  Achievements from TB `achievements.json` #24, #103, #183, #235. The W1/W2 Colosseum EZ-Access comes from storage-stack achievements (#42, #102).
- **Goals and Milestones:** The achievement scores above; the full-clear Chest C tiers; the Tome "Total Colosseum Score"; the W3 task "Begone, Skeleton!" (Xylobones from the Skull Rock, TB `tasks.json`).
- **Feeds / fed by:** Feeds: chest loot (keys per the resets dossier, gold food, world items), Achievements, the Tome, quests (Centurion records a time). Fed by: Drop Rate, damage and AoE (Divine Knight Orb of Remembrance works in W1–W4 Colosseums per the wiki, L), move speed, the ticket NPCs and Post Office.
- **Per-session actions:** Claim tickets before the 3-day bank caps (resets dossier). Spend them only for an achievement score or when Drop Rate makes the loot worth it.
- **AFK Setup implications:** Uses the active character; no AFK effect.
- **Min-max by stage:**
  - *W1–W2:* Dewdrop 25k and Sandstone 200k for the achievements; bank the rest.
  - *W3:* Chillsnap 2.5M (EZ-Access).
  - *W4:* Astro 10M (+5% Cash). The community says to farm Colosseums for gold food only at high Drop Rate, mostly W5–W6 (Reddit [1pc5rot](https://www.reddit.com/r/idleon/comments/1pc5rot/) 2025-12-02, [1pipwqc](https://www.reddit.com/r/idleon/comments/1pipwqc/) 2025-12-09, L).
- **Common mistakes:** Letting tickets cap. Turning on curses that add mob HP (wiki tip). Leaving auto-attack on so it wastes the best skills (wiki tip, L).
- **Save and Toolbox fields:** raw `FamValColosseumHighscores` or `FamilyValuesMap.ColosseumHighscores` (index 1..6; Toolbox drops index 0, TB [`highScores.ts#L58-L64`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/highScores.ts#L58-L64)); `currencies.ColosseumTickets.allTickets[].daysSincePickup`.
- **Sources:** As cited; [wiki Colosseum](https://idleon.wiki/wiki/Colosseum) (2025-08-28, Stale-risk; its sub-pages do not exist).

## Pen Pals (Trapping minigame)

- **What it is:** A W3 sorting minigame. Critters come out of a center hole and you drag them to their corner. Corners are assigned in the order the critters first appear. A wrong corner costs one of your trap lives ([wiki Trapping](https://idleon.wiki/wiki/Trapping)). Added in v1.53 (2022-04-04).
- **Unlocks:** Trapping (W3); playable on any platform with critters.
- **Scope:** Account-wide highscore.
- **Inputs → outputs:** Free and unlimited. It uses no minigame plays and drops nothing (wiki, L; no `OLA[33]` reference in its handler, M). Highscore `OLA[99]` (N.js `_customEvent_TrappinMG` @5711530, H). The bonus for tier n applies once `OLA[99] >= 25·(n+1)` (`TrapMGbonus` H; TB [`traps.ts#L193`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/traps.ts#L193)).
- **Goals and Milestones:**

  | Highscore | 25 | 50 | 75 | 100 | 125 | 150 | 175 | 200 | 225 |
  |---|---|---|---|---|---|---|---|---|---|
  | Bonus | +5% Trapping EXP | +5% Trap Eff | +15% Shiny | +5% Trapping EXP | +10% Critter gain | +15% Shiny | +5% Trap Eff | +10% Critter gain | +1% Skill AFK |

- **Feeds / fed by:** Trapping (critters → Alchemy vials, Construction), Skill AFK, the Tome (it counts in Total Minigame Highscore).
- **Per-session actions:** One active push to 225, then never again.
- **AFK Setup implications:** None.
- **Min-max by stage:** Early W3: 125 (Critter gain); then 225.
- **Common mistakes:** Stopping just short of a 25-step. Detect `OLA[99] % 25 >= 20` (the W3 test save had 96).
- **Save and Toolbox fields:** `OLA[99]`; TB `minigameHighscores` "pen pals".
- **Sources:** As cited; [Changelog_2022](https://idleon.wiki/wiki/Changelog_2022).

## Worship Tower Defence (pointer)

- **What it is:** W3 Worship's active part: spend charge to defend a totem in waves, earning souls. It is a skill system, not a daily minigame.
- **Unlocks:** Worship (W3).
- **Scope:** Per character (charge) and account (totem best waves).
- **Inputs → outputs:** Charge → souls and prayer unlock waves (Antifun Spirit at Acorn Assault wave 41).
- **Goals and Milestones:** Best wave per totem; see the Worship skill dossier.
- **Feeds / fed by:** Prayers (including Antifun Spirit, which affects this file), Souls.
- **Per-session actions / AFK Setup implications / Min-max by stage / Common mistakes:** Covered by the Worship skill dossier (another agent).
- **Save and Toolbox fields:** `TotemInfo`; TB `parsers/world-3/worship.ts`.
- **Sources:** [wiki Worship](https://idleon.wiki/wiki/Worship); [Changelog_2026](https://idleon.wiki/wiki/Changelog_2026) v1.20 (damage overflow fix).

## Seasonal event minigame (pointer)

- **What it is:** A rotating W1-town event game (e.g. Pots o' Gold in v1.09 Goldrush, 2026-03-17; Buried Treasure averaging about 2.41 Event Points a play) that pays Event Points, nametags and balls.
- **Unlocks:** Only while an event is live.
- **Scope:** Account.
- **Inputs → outputs / Goals / Per-session / AFK / Min-max / Mistakes:** Owned by the resets dossier, "Random and seasonal events" section (50 event boxes a day → +1 free play, plays carry over between events). The only link here is Event Shop bonus 24, which gives +50% Hoops and Darts points (N.js @9589241, @9593229).
- **Save and Toolbox fields:** `OLA[311]` (Event Shop letters), TB `getEventShopBonus`.
- **Sources:** [Changelog_2026](https://idleon.wiki/wiki/Changelog_2026).

### Current-patch notes (v1.23, 2026-10-16/17)

- No W1–W4 minigame rule changed in v1.23 that this research could find. The wiki changelog stops at v1.22, and the N.js v1.23 strings found concern the W7 Menagerie. The W7 Menagerie adds "clicker cheapener" boosts 16, 18 and 20 that make the first upgrade of Orion, Poppy and Bubba cheaper (TB `owl.ts#L11-L12`, `kangaroo.ts#L13-L14`, `bubba.ts#L12`), which is out of scope.
- Recent relevant changes: v1.00 (2025-11-06) added Hoops and Darts as point shops. v1.02 (2025-11-23) added Bubba. v1.20 (2026-08-26) fixed Meritocracy not boosting Poppy. Hoops and Darts mechanics were verified in v1.23 N.js. Wiki prose on Spiketrap gems (30) and on the Colosseum is Stale.

### Sources

- Game client N.js v1.23 (`https://www.legendsofidleon.com/ytGl5oc/N.js`, Last-Modified 2026-10-17), offsets as cited: plays refill @15116058, @15092085, spend @3735359, patch notes @14399922 and @14418923, gem shop row @14103138, skill reward formulas @3941600, @3943128, @3944003, @5718024, @5724505, @5730407, minigame multis @4203946, @4221783, @4229207, Hoops @8247667, @9589241, @9591202, @9597088, @9610662, @10951556, @13114838, Darts @9593229, @9611700, @9626243, @10951781, @13115458, bonuses @4046009, @4112699, @4136227, @4192297, @4262149, @4378160, @10879565, cooldown ticks @5028753, @15078786, daily clear @15097122, Spiketrap @23176343–@23179907, @15120221, @15262694, Owl @5026030, @11889346, @12257587, Poppy @11890603, @11932855, Bubba @11150785, @11150294, Equinox dream @14324253, Tome @5754635, Colosseum @14032574, @5492440, @5512825, Pen Pals @5711530, Antifun @14533537.
- IdleonToolbox commit 6827d3f (2026-10-17): `parsers/highScores.ts`, `parsers/world-1/owl.ts`, `parsers/world-2/kangaroo.ts`, `parsers/clickers/bubba.ts`, `parsers/world-3/prayers.ts`, `parsers/world-3/traps.ts`, `parsers/misc.ts`, `parsers/misc/upgradeVault.ts`, `parsers/damage.ts`, `parsers/efficiency.ts`, `parsers/index.ts`, `data/account-options-enum.js`, `utility/dashboard/account.js`, `utility/dashboard/alertMeta.js`, `data/website-data/{achievements,tasks,quests,talents,gemShop,shared-data}.json`, `data/patch-notes.js`.
- IdleOn wiki (api.php, read 2026-10-17; last edit in brackets): [Minigames](https://idleon.wiki/wiki/Minigames) (2026-10-07), [Choppin](https://idleon.wiki/wiki/Choppin), [Mining](https://idleon.wiki/wiki/Mining) (2026-10-06), [Fishing](https://idleon.wiki/wiki/Fishing), [Catching](https://idleon.wiki/wiki/Catching) (2026-10-03), [Fishing_Minigame](https://idleon.wiki/wiki/Fishing_Minigame) (prose 2023-04-25, Stale-risk), [Orion](https://idleon.wiki/wiki/Orion_the_Great_Horned_Owl%27s_Feather_Enterprise), [Poppy](https://idleon.wiki/wiki/Poppy_the_Kangaroo_Mouse%27s_Fish_Pond), [Bubba](https://idleon.wiki/wiki/Bubba_the_Chonky_Seal%27s_Arctic_Market_of_Meats), [Trapping](https://idleon.wiki/wiki/Trapping), [Secrets](https://idleon.wiki/wiki/Secrets) (all 2026-10-07 bot edits), [Colosseum](https://idleon.wiki/wiki/Colosseum) (2025-08-28, Stale-risk), [Colosseum_Ticket](https://idleon.wiki/wiki/Colosseum_Ticket), [Basketball](https://idleon.wiki/wiki/Basketball), [Darts](https://idleon.wiki/wiki/Darts), [Nine_Dart_Finish](https://idleon.wiki/wiki/Nine_Dart_Finish), [Baller](https://idleon.wiki/wiki/Baller), [Prayers](https://idleon.wiki/wiki/Prayers) (2026-10-03), [Star_Signs](https://idleon.wiki/wiki/Star_Signs), [The_Tome](https://idleon.wiki/wiki/The_Tome) (2026-10-12), [Worlds](https://idleon.wiki/wiki/Worlds) (2026-10-04), [Mr_Pigibank](https://idleon.wiki/wiki/Mr_Pigibank) (2026-10-05), [Daily_Checklist](https://idleon.wiki/wiki/Daily_Checklist) (2026-03-24, Stale-risk), [Tips_and_Tricks](https://idleon.wiki/wiki/Tips_and_Tricks), [Changelog_2022](https://idleon.wiki/wiki/Changelog_2022), [Changelog_2024](https://idleon.wiki/wiki/Changelog_2024), [Changelog_2025](https://idleon.wiki/wiki/Changelog_2025), [Changelog_2026](https://idleon.wiki/wiki/Changelog_2026).
- Reddit r/idleon via Arctic Shift (read 2026-10-17): [1fv1vsg](https://www.reddit.com/r/idleon/comments/1fv1vsg/) (2024-10-03), [1h3x0yk](https://www.reddit.com/r/idleon/comments/1h3x0yk/) (2024-12-01), [1j5yhp6](https://www.reddit.com/r/idleon/comments/1j5yhp6/) (2025-03-07), [1p0kuqz](https://www.reddit.com/r/idleon/comments/1p0kuqz/) (2025-11-18), [1pc5rot](https://www.reddit.com/r/idleon/comments/1pc5rot/) (2025-12-02), [1pgn3jh](https://www.reddit.com/r/idleon/comments/1pgn3jh/) (2025-12-07), [1pipwqc](https://www.reddit.com/r/idleon/comments/1pipwqc/) (2025-12-09), [1pjhplf](https://www.reddit.com/r/idleon/comments/1pjhplf/) (2025-12-10), [1thql9o](https://www.reddit.com/r/idleon/comments/1thql9o/) (2026-05-19), [1x3h8su](https://www.reddit.com/r/idleon/comments/1x3h8su/) (2026-10-11; Orion bonus differences come from a pet, W7 legend talents and the W5 Gambit, out of scope).
- Account State fixtures (field names and aggregate values only): W2 and W3 parsed saves under `fixtures/private/`.
- Related dossier: `resets-dailies-events.md` (same folder) for reset timing, ticket banking and events.
