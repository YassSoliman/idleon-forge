# Achievements, Tasks and the Merit Shop

Research date 2026-10-17, game v1.23 "Lumi Menagerie" (N.js Last-Modified 2026-10-17), IdleonToolbox commit `6827d3f`. `TB` below means `https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/`. N.js locations are `function or symbol @character offset` in `https://www.legendsofidleon.com/ytGl5oc/N.js`. Confidence: H = read in game code or data, M = inferred, L = community or secondhand.

### Key findings

- **Merits are not scarce in the long run; ordering is what matters.** Each world's Task Board pays 118 to 120 merits if fully ranked (H). Maxing every W1-W4 Merit Shop row costs only 85 / 89 / 72 / 75 merits (H, from `TaskShopDesc`). An account that finishes its tasks can buy everything. So the Spend Plan only has to answer "what first". Unspent merits are always a mistake, and the save shows them directly (`Tasks[4][w+1]`).
- **Priority buys:** W1: 1 level of Goblet of Hemoglobin, then the Amarok recipes as their gates open, then respawn and lowest-character EXP. W2: 1 level of Obol drops first (no monster obols drop without it), then world-boss gems, then AFK gains for N characters. W3: the Build/Food slot row, Talent Book Library +2, Printer sample size. W4: No Bubble Left Behind +1/day as soon as the Lab bonus exists.
- **Task rewards are never automatic.** A tier has to be tapped on the board ("Tap to Complete!", H). For 12 of the 32 W1-W4 tasks, claiming a tier resets progress to 0, so progress past the requirement is lost (H). The Unlocks tab also has to be bought by hand. The W3 test account had 10 unlock points owned but unspent. The W2 test account had 12 W1 merits unspent and 2 unlocks unclaimed.
- **The daily task (W1-W4 only) pays unlock points, never merits** (H). It rerolls at the daily reset. W1 dailies pay 2-5 points, W2 4-6, W3 4-8, W4 4-6. Toolbox already alerts when one is not done.
- **Achievements: 60 of the W1-W4 achievements (all of the gem-paying ones) only complete on the Steam client.** The game advances Steam achievements and pays their gems only when `isElectron()` is true (H). These pay 1,285 gems plus Time Candy across W1-W4 (H, `achievements.json`; this excludes the 30-gem `FILLERZZZ_ACH` placeholder rows). A web or mobile player gets none of these gems. They also get fewer Achievement-task tiers, because completed achievements are what those tasks count.
- **Lasting achievement stat bonuses are small, but some are cheap and permanent:** +2/3/5/5% total damage per dungeon boss difficulty, the arcade-ball % achievements (24 of them, +47% in total, H), Checkout Takeout (+5 max talent-book level), S-M-R-T (-10% bubble costs), Golden Obolden (+20% obol fragments), plus talent-point grants (Tab 1-4 and Star). Equinox Visitor also opens the Equinox Valley.
- **Achievement tasks cannot be maxed on the current patch.** W1 has 63 real achievements but its last tier asks for 70. W4 has 33 but its tiers go to 70 (H). The highest achievable tier is 8 in W1-W3 and 6 in W4, or fewer without Steam.
- **Unlocks tab:** 128 one-time unlocks in 7 columns (recipes, pouches and 1,185 gems in total, H). An unlock point is earned at cumulative task points `1+9n+2·max(0,n-5)+7·max(0,n-12)+11·max(0,n-20)` (H). Column k+1 opens at 7 / 22 / 60 / 90 / 106 / 119 unlocks bought (wiki, bot-drawn from game data) and also needs anvil tab k+1 owned (H).

## Achievements

- **What it is:** An account-wide list of goals per world, opened from the button in the top left. The list has 420 slots: 70 per world for W1-W6, of which 63 / 55 / 50 / 33 / 32 / 35 are real; the rest are `FILLERZZZ_ACH` placeholders (H, `achievements.json`; N.js `RegAchieves` @14708598). Each finished achievement pays a one-time reward or a permanent bonus. It also counts toward that world's Achievement task and the W4 Tome.
- **Unlocks:** Available from account creation. Each world's tab shows from the start, and the goals only become doable once that world's content is reached (wiki [Achievements](https://idleon.wiki/wiki/Achievements); its content was last edited 2025-02-26 and an infobox was added by a bot on 2026-10-03, so the notes are Stale-risk while the data matches N.js v1.23).
- **Scope:** Account-wide. One `AchieveReg` array serves all characters (H). Bonuses with "for all characters" wording apply to every character. Some triggers are per character (for example "Reach level 20 on any character"), but completion is account-wide.
- **Inputs → outputs:**
  - **Inputs:** gameplay events. Each achievement has a counter in `AchieveReg[i]` that becomes `-1` when done (N.js `_customBlock_Reg_ach_add_status` @7782263; H).
  - **Reward types (W1-W4, H from `achievements.json`):**
    - Gems plus Time Candy: **Steam only**, 60 achievements.
    - Permanent % stat bonuses, read through `AchieveStatus` (N.js @7785374). It returns 1 for most achievements, 5 for indexes 4, 27, 37, 44, 107, 109 and 117, 10 for 108, and 20 for 99, 104 and 112.
    - Arcade balls/hr %.
    - Talent points.
    - "RNG item unlock": adds an item to the Dungeon RNG-item pool (`UnlockinRNGitems`/`DungUpg[0]`, H).
    - Title-screen backgrounds (cosmetic).
    - EZ-Access: remote access to a town's shops, Colosseum or boss key.
    - Teleports.
    - Hat recipes: Acorn Hat, Nuget Cake Hat, HONK Hat.
  - **Steam mechanics (H, N.js `_customBlock_steamachieve` @7776650):** `SteamAchieve[d]` counts up on any platform, but it only completes when `u.isElectron()` is true, which means the Steam desktop client. On completion it drops the gems and candy (`SteamAchieveDrops`) and adds +2 to the linked `AchieveReg` entry (`AchSteam2Reg`), which completes it. The wiki says the same: "Steam Exclusive achievements ONLY give rewards on the Steam platform. Some ... will also only register as complete on Steam." v2.35 (2025-04-01) made "all 275 achievements unlockable on Steam" as Steam-store achievements ([Changelog/2025](https://idleon.wiki/wiki/Changelog/2025)). That patch did not change the in-game gem rule.
- **Goals and Milestones:**

  | World | Real achievements | Steam-only (gems) | Non-Steam reachable | Steam gems | Achievement-task tier reqs (count done) | Max tier reachable (Steam / non-Steam) |
  |---|---|---|---|---|---|---|
  | W1 | 63 | 26 | 37 | 407 | 10,15,20,25,30,40,50,60,70 (9 tiers) | 8 (60) / 5 (30) |
  | W2 | 55 | 13 | 42 | 264 | 5,10,15,20,25,30,40,50,60,70 | 8 (50) / 7 (40) |
  | W3 | 50 | 15 | 35 | 324 | 5,...,70 | 8 (50) / 6 (30) |
  | W4 | 33 | 6 | 27 | 290 | 5,...,70 | 6 (30) / 5 (25) |

  Source: H, `achievements.json`, `tasks.json`, N.js `_event_TASKS` @7254340, which counts `AchieveReg==-1` and non-filler per 70-slot block. The "non-Steam reachable" column assumes Steam-only achievements never complete off Steam (M).

- **Lasting bonuses worth chasing (W1-W4).** Reward text is from game data (H). Indexes are `AchieveReg` positions.

  | Idx | Achievement | Requirement (short) | Permanent reward | Feeds | Difficulty / note |
  |---|---|---|---|---|---|
  | 4 | Hitting the Mark | 15 yellow in a row, Choppin minigame | +5% Choppin EXP, all chars | Choppin | easy, early |
  | 27 | Minecart Maniac | Hit a yellow vein, Mining minigame | +5% Mining EXP | Mining | easy |
  | 37 | Nutty Crafter | Craft 42 Golden Peanuts | +5% Gold Food bonus | Golden food | mid W1 |
  | 40 | Decked Out in Gold | Full golden set + Defenders Dignity | +3% Arcade balls/hr | Arcade | early |
  | 44 | Two-Time Savior | Equip Blunder Hero trophy + 1 more in inventory | +5% respawn, W1 mobs | AFK kills W1 | needs 2 trophies |
  | 54 | Heyo! | Say Hi to 250 different people, one session | +5 Tab 1 talent pts, +1% balls | Talents | needs a busy server |
  | 57, 61, 124, 188 | Dungeon Pinch / 2 minute meal / Dungeon Slap / Capitalist Win | dungeon feats | +1%, +3%, +2%, +5% Class EXP | Class EXP | Dungeons |
  | 58-60, 62 | Big Frog Angry ... Big Mad | Grandfrogger difficulties 1-4 | +2/+3/+5/+5% total damage outside dungeons (TB `parsers/damage.ts#L383`) | Damage | Dungeons |
  | 74 | Golden Fly | Small golden hoop, Catching minigame | +5% Catching efficiency (capped 5, TB `parsers/efficiency.ts#L521`) | Catching | easy |
  | 76, 78 | Wassup Yo! / Buzz Buzz | 100 Hi's / exactly 2,500 Flies | +2 / +3 Tab 2 talent pts | Talents | easy |
  | 99 | Golden Obolden! | 15 Golden obols equipped | +20% Obol fragments | Obols | mid |
  | 104 | Ink Blot | Use 101 silver pens | 20% chance to keep silver pens | Post Office | mid |
  | 107, 117 | Threadin' the Needle / Fish Aint Biting (secret) | Catching lava hoop / secret | +5% Catching / Fishing EXP | Skills | |
  | 108 | S-M-R-T | Smarty Boi bubble Lv 50 | -10% bubble upgrade costs | Alchemy | strong, W2-W3 |
  | 109 | Two Desserts! | YumYum Sheriff trophy + 1 more | +5% respawn, W2 mobs | AFK kills W2 | |
  | 112 | Vial Junkee | 10 vials Lv 9 | +20% Sigil charge speed | Sigils (W4 Lab) | late |
  | 113 | Fruit Salad | Exactly 1,000,000 Fruit Flies | +5% catching speed | Catching | |
  | 119-121 | Tomb Raider / Defiler / Completionist | Snakenhotep difficulties 1-3 | +2/+3/+5% total damage | Damage | Dungeons |
  | 122, 123, 148 | Wazzzzam! / Just Passing By / Too Cute To Live | Snakenhotep rooms; Poofs in 20s | +6% / +2% / +5% Multikill | Multikill | |
  | 145 | Checkout Takeout | Check out 1,000 talent books | +5 talent-book max level, +30% library charge rate (TB `parsers/misc.ts#L325`, `#L393`) | Talent Book Library | **high value** |
  | 153, 163 | Cog in the System / Geared for Success | 20 grey / 40 yellow cogs on board | +5% build speed / +5% Construction EXP | Construction | |
  | 158 | Saharan Skull | Gold skull on every W2 Deathnote mob | +1% printer sample rate | 3D Printer | Death Note |
  | 159 | Fat Souls | Exactly 10,000 Dune Souls | +15 starting TD points | Worship | |
  | 166, 170 | Entangled Compounds / I Constructed! | Refinery rank 3 / 900 building upgrades | +5 / +10 Tab 3 talent pts | Talents | |
  | 184 | Dungeon Wallop | 25,000 single hit in a dungeon | +4% crit chance outside dungeons | Damage | |
  | 185-187 | Boss / Manager / Kingpin Defeated | Glaciaxus difficulties 1-3 | +2/+3/+5% total damage | Damage | Dungeons |
  | 189 | Equinox Visitor | Equinox Mirror (1/1000 Bloodbone drop) | +4% total damage; the mirror opens Equinox Valley | Equinox (W3) | **high value** |
  | 212, 216, 219, 230, 239-242 | Bottle Capital / Bland Dish / I LOVE These Mobs / Hunned Times a Day / True King, Pirate, Emperor / Veritable Master | stacks, cooking, breeding, spice claims, 1M orb/plunder/wormhole kills | 10 Star pts; 6 Tab 1; 10 Tab 3; 8 Tab 2; 10/15/12 Tab 4 (+1% dmg on Pirate); 1 Void pt | Talents | W4 |
  | 218, 220-222 | I Like This Mob / Shiny / Gilded Shells / Barley Lost | breeding | 1.2x faster breedability; +10% incubator; 1.1x egg rarity; +5% mob fight dmg | Breeding | W4 |
  | 224, 225, 233 | Cabbage Patch / Le Pretzel Bleu / Best Plate | 5 kitchens on cabbage; 8 on pretzels; void plate | +10% / +20% meal cooking speed; -10% meal upgrade cost | Cooking | W4 |
  | 235 | Zero G Scorin' | 10M Astro Colosseum | +5% cash from monsters | Coins | W4 |

- **Arcade-ball achievements (H, N.js `AchBallzBonuses` @14526956).** These 24 entries add a total of +47% to Arcade ball rate:
  - +1% each: 46, 47, 49, 54, 77, 116, 140, 154.
  - +2% each: 76, 83, 98, 103, 146, 151, 227, 229, 232, 234.
  - +3% each: 40, 80, 115, 160, 213.
  - +4%: 171.

  One quirk: the code grants the 1% at index **140** (Snowy Wonderland, "Reach World 3"). The 1% text sits on 144 (Sad Souls), and 144 is not in the code list (H). Toolbox mirrors the code (`TB parsers/dungeons.ts#L93`).
- **Feeds / fed by:**
  - **Feeds:** this world's Achievement task (merits and unlock points); the Tome (W4), where "total achievements" is a metric (`TB parsers/world-4/tome.ts#L291`); Arcade ball rate; damage, Class EXP and skill EXP; the Talent Book Library; Alchemy bubble costs; Construction; Breeding and Cooking; Dungeons (RNG items).
  - **Fed by:** Dungeons (14 W1-W3 achievements), minigames, Storage (exact-stack achievements), Death Note, Colosseum, bosses, Refinery and Construction cogs.
- **Per-session actions:**
  - There is nothing to claim: bonuses apply as soon as the achievement completes.
  - Each session, check whether a cheap one is one step away. Exact-stack achievements need exactly N of an item in storage; split a bigger stack to hit the number. Minigame-score ones need minigame plays.
  - On Steam, check the in-game list after milestones (levels 20/40/60/80/100/125, new worlds, crystal kills).
  - An achievement is in a capped state once every reachable one in a world is done.
- **AFK Setup implications:**
  - Hybernation (+3% balls) needs one character left AFK for 168 h. Pick a spare character that will not be visited for a week.
  - Crystal Champ (2,000 crystal kills, Steam) is helped by the W4 crystal merit and crystal spawn rate.
  - "1M Orb / Plunder / Wormhole kills" (+37 Tab 4 pts) accumulate from multikill talents while AFK fighting. That is a reason to give those talents' users an AFK fighting slot in W4.
- **Min-max by stage:**
  - **Early W1:** the minigame ones (4, 27, 74 later) and the exact-stack ones at copper, oak and iron. Decked Out in Gold. Do Heyo!/Wassup Yo! when a server is busy. On Steam, collect the character-count and level gem achievements (2nd, 4th and 8th character; levels 20-125).
  - **Mid W1-W2:** dungeon boss difficulties (total damage stacks additively), Nutty Crafter, Two-Time Savior, Two Desserts, Golden Obolden, S-M-R-T as soon as Smarty Boi can reach Lv 50.
  - **Late W2-W3:** Checkout Takeout (1,000 library checkouts; it accumulates passively), the construction cog ones, Saharan Skull (Death Note), Equinox Visitor (farm Bloodbones, 1/1000), Glaciaxus difficulties, Capitalist Win.
  - **W4 outline:** breeding and cooking speed achievements (Cabbage Patch / Le Pretzel early in Cooking), Bottle Capital (10 Star pts), the 1M kill talent-point trio, Zero G.
  - **Per class:** the system has no class dependence. Kill-count achievements are fastest on whichever class farms that map.
- **Common mistakes:**

  | Mistake | How to detect from the save |
  |---|---|
  | Playing only on web or mobile and missing ~1,285 achievement gems (M on recoverability: the Steam client is free; whether old one-shot triggers re-fire on Steam is unverified) | All 60 entries with `steamIndex` have `AchieveReg != -1` and `SteamAchieve[steamIndex] >= 0`. The W2 test account had 0 of 60 done; the W3 Steam account had 24. |
  | Ignoring achievements altogether | Count `account.achievements[].completed` per 70-slot block against the reachable numbers above. The W2 test account had 5 completed in total. |
  | Thinking an exact-stack achievement is impossible because the stack is too big | `currentQuantity` stays at 0 for a stack achievement while storage holds more than N of the item |
  | Leaving dungeon damage achievements undone | indexes 58-62, 119-121, 185-187 not `-1` |

- **Save and Toolbox fields:**
  - Raw save: `AchieveReg` (array of 420; `-1` = done, otherwise a progress counter) and `SteamAchieve` (Steam counters; `-1` = done).
  - Toolbox: `account.achievements[i]` = static data plus `completed` and `currentQuantity` (`TB parsers/achievements.ts#L12-L28`). `getAchievementStatus(achievements, i)` returns the game's multiplier 0/1/5/10/20 (`#L30-L52`). `calcTotalAchievements` (`#L55`) feeds the Tome.
  - World block = `floor(i/70)`.
- **Sources:** N.js `_customBlock_AchieveStatus` @7785374, `_customBlock_Reg_ach_add_status` @7782263, `_customBlock_steamachieve` @7776650, `AchBallzBonuses` @14526956, `RegAchieves` @14708598, `_event_TASKS` @7254340 (v1.23, 2026-10-17, H). `TB data/website-data/achievements.json`, `TB parsers/achievements.ts`, `TB parsers/damage.ts#L383-L400`, `TB parsers/dungeons.ts#L93-L105`, `TB parsers/world-4/tome.ts#L290-L299`. Wiki [Achievements](https://idleon.wiki/wiki/Achievements) (content 2025-02-26, Stale-risk on notes). [Changelog/2025](https://idleon.wiki/wiki/Changelog/2025) v2.35 (2025-04-01). Fixtures `yasser.parsed.json` / `joseph.parsed.json` (aggregate counts only).

## Tasks (Task Board, Daily Tasks, Unlocks)

- **What it is:** An account-wide Task Board per world. Each world has 8 ranked tasks of 9-10 tiers and one daily task (W1-W4). Ranking a tier pays **merits** for that world's Merit Shop and **task points** (the wiki calls them "Task Trophies"). Task points become unlock points for the shared **Unlocks** tab: anvil recipes, skill pouches, gems and Time Candy. "Everything you do with tasks is shared between all your characters" (wiki Tasks).
- **Unlocks (H, N.js `_event_TASKS` @7255021; wiki [Tasks](https://idleon.wiki/wiki/Tasks), revised 2026-10-03):**
  - **W1:** talk to Grasslands Gary in W1 town at level 14 (and with a class, per an old guide).
  - **W2:** Desert Davey, quest `Desert_Davey2`. The wiki says level 50; its 2026-01-05 edit says "Davey wants level 50, not 35 anymore".
  - **W3:** Iceland Irwin, quest `Iceland_Irwin1`.
  - **W4:** Nebula Neddy, quest `Nebula_Neddy1`.
  - **W5-W7:** Lava Larry, Spirit Sungmin, Wavey Wayne. W7 was added in v1.21 on 2026-09-05.
- **Scope:** Fully account-wide. Progress, levels, merits and unlocks live in one `Tasks` structure (H).
- **Inputs → outputs (H, N.js task rank-up @7263511):**
  - **Claiming a tier:** requires progress ≥ the tier requirement, then a tap on the task ("Tap_to_Complete!" @7276505). It pays:
    - **Task points** `floor(x + (w+1) × level)`, added to `Tasks[4][0]`. `x` is the task's base (W1 5, Achievement Hunter 2, W2 10, Maximum Efficiency 11, W3 15, Chill Out 17, W4 10). `w` is the 0-based world, and `level` is the tier being claimed, counted from 0.
    - **Merits** `1 + floor(level/5)` (`TaskStuff("MeritsGiven")` @6597194; `TB parsers/tasks.ts#L9`). That is 1 merit for tiers 1-5 and 2 for tiers 6-10, so a 10-tier task pays 15 merits.
  - **Reset flag:** if the task's flag field `split("|")[1] == 1`, progress resets to 0 on claim (H). Affected tasks: Nakedknuckle Boxing, Pack Mule Crafter, Such Rock Very Dog Wow, Maximum Efficiency, Twilight Tombstone, My Shrines m'lord, Chill Out Big Boy!, Firing Up Le Grill, Dishin' Out Some Meals, Cracking Eggs, Mob Bullet Bursting, Begone Troll!. All other tasks are cumulative.
  - **Daily task:** pays its base `x` in task points and **0 merits** (N.js `8!=this._DummyNumber` guard; `TB parsers/tasks.ts#L49-L59`).
  - **Unlocks:**
    - Each unlock point lets you buy one row. A row gives up to two rewards (recipe, recipe, or gems).
    - Points owned = the largest `n` with `1+9n+2·max(0,n-5)+7·max(0,n-12)+11·max(0,n-20) ≤ Tasks[4][0]` (`TaskStuff("UnlockPtsOwned"/"UnlockPtsFORMULA")` @6596443; `TB parsers/tasks.ts#L106-L137`).
    - The first unlock needs 10 points, the 7th 68, the 22nd 325, the 60th 1,427, the 119th 3,138 and the 128th 3,399.
    - Unlocks are not consumed from `Tasks[4][0]`. Available = owned - bought (`TaskStuff("AvailableUnlocks")`). Rows can be bought in any order inside an open column (save shows non-contiguous 1s).
- **Goals and Milestones: W1-W4 ranked tasks.** "Pts" is task points per tier, first to last. Merits are 15 per 10-tier task.

  | World | Task | Counts | Tier requirements (1 → 10) | Pts/tier | Resets on claim |
  |---|---|---|---|---|---|
  | W1 | Faceless Deathmachine | total monster kills | 2k, 10k, 20k, 100k, 500k, 2M, 6M, 12M, 25M, 50M | 5-14 | no |
  | W1 | Just One More Before Bed | level-ups (class and skill) | 30, 70, 150, 300, 600, 1.2k, 2.5k, 8k, 15k, 25k | 5-14 | no |
  | W1 | Super Explosive Gameplay | AFK hours claimed | 10, 70, 300, 1k, 2.5k, 8k, 20k, 60k, 140k, 250k | 5-14 | no |
  | W1 | Nakedknuckle Boxing | unarmed active kills of a set mob | Bored Bean 50, Slime 50, Carrotman 100, Gigafrog 150, Poop 200, Rat 250, Nutto 300, Amarok 5, Baba Yaga 5, Dr Defecaus 5 | 5-14 | **yes** |
  | W1 | Pack Mule Crafter | different items crafted without chest, town exit or drops | 3, 8, 14, 24, 34, 45, 55, 70, 90, 110 | 5-14 | **yes** |
  | W1 | Stamp Coolection | stamp upgrades | 15, 40, 150, 300, 500, 800, 1.25k, 1.8k, 3k, 5k | 5-14 | no |
  | W1 | Such Rock Very Dog Wow | Amarok feats | kill; 5 kills; boxing gloves; no damage; chars 1-4 in order; Chaotic; Chaotic no weapon or helmet; Chaotic on 6 chars in order; Nightmare; Nightmare with 0 talent pts | 5-14 | **yes** |
  | W1 | Achievement Hunter | W1 achievements done | 10, 15, 20, 25, 30, 40, 50, 60, 70 (9 tiers, 13 merits) | 2-10 | no |
  | W2 | Road to Max Damage | single hit | 600 … 999,999 | 10-28 | no |
  | W2 | Investing in... bubbles? | total bubble levels | 15, 60, 130, 300, 650, 1.2k, 2.7k, 5k, 10k, 16k | 10-28 | no |
  | W2 | Avast, Bankruptcy Ho! | Golden Dubloons bought | 5, 20, 75, 200, 700, 2.2k, 6k, 10k, 25k, 100k | 10-28 | no |
  | W2 | Maximum Efficiency | N skills at ≥ efficiency E | 2@500, 2@1.5k, 3@3k, 3@5k, 4@10k, 4@25k, 5@50k, 5@250k, 6@1M, 6@5M | 11-29 | **yes** |
  | W2 | No Time to Brews! | sum of 4 cauldron speeds /hr | 30 … 150k | 10-28 | no |
  | W2 | The Unstoppable USPS | Post Office orders | 10, 25, 50, 75, 110, 180, 275, 500, 750, 1,111 | 10-28 | no |
  | W2 | Twilight Tombstone | Efaunt feats | kill; 7 kills; no helmet or shirt; under 2 min; 6 chars in order; all arms of Chaotic; Chaotic no damage; Nightmare; Nightmare <120 s; Nightmare no helmet or weapon | 10-28 | **yes** |
  | W2 | Achievement Cowboy | W2 achievements done | 5, 10, 15, 20, 25, 30, 40, 50, 60, 70 | 10-28 | no |
  | W3 | Why so Salty? | salts refined | 25 … 2M | 15-42 | no |
  | W3 | Poof, Cogone! | cogs trashed | 10 … 8k | 15-42 | no |
  | W3 | My Shrines, m'lord. | total shrine levels on one map | 4, 12, 24, 35, 48, 70, 86, 100, 120, 150 | 15-42 | **yes** |
  | W3 | Printer go Brrrr | resources printed | 5k … 100M | 15-42 | no |
  | W3 | The True TD Wizard | sum of Worship best waves | 25 … 500 | 15-42 | no |
  | W3 | Come 'ere Critters! | traps collected (+2% shiny chance per tier) | 10 … 30k | 15-42 | no |
  | W3 | Chill Out Big Boy! | Chizoar feats | kill; 5 kills; no helmet, shirt or pants; before 2nd ice orbs; 8 chars in order; Chaotic; Chaotic no damage; Nightmare; Nightmare before 3rd orbs; Nightmare on 4 chars in order | 17-44 | **yes** |
  | W3 | Achievement Inuit | W3 achievements done | 5 … 70 | 15-42 | no |
  | W4 | Firing Up Le Grill | fire when finishing a recipe | 200 … 1.75B | 10-46 | **yes** |
  | W4 | Dishin' Out Some Meals | a set meal to Lv | Turkey 2, Salad 5, Garlic Bread 7, Cabbage 10, Sawdust 14, Bunt Cake 17, Mutton 20, Massive Fig 23, Giant Tomato 27, BillJack Pepper 30 | 10-46 | **yes** |
  | W4 | Cracking Eggs | breed a set mob N times | Squirrel 5 … Hedgehog 1,500 | 10-46 | **yes** |
  | W4 | Mob Bullet Bursting | dmg in a 5 s breeding-battle window | 200 … 300M | 10-46 | **yes** |
  | W4 | Light 'em Up Up Up | lab features lit at once | 4 … 42 | 10-46 | no |
  | W4 | Consolidating Chips | chips equipped across players | 4 … 70 | 10-46 | no |
  | W4 | Begone Troll! | Troll feats | kill; 20 mindgames; no failed mindgame; 5 chars in order; Chaotic; Chaotic on 6 chars; Chaotic within 10 mindgames; Nightmare; Nightmare on 10 chars; Nightmare within 5 mindgames with red boxing gloves | 10-46 | **yes** |
  | W4 | Achievement Astronaut | W4 achievements done | 5 … 70 | 10-46 | no |

  Source: H, `TB data/website-data/tasks.json` = N.js `TaskDescriptions` @14774331; matches wiki [Tasks/Blunder Hills](https://idleon.wiki/wiki/Tasks/Blunder_Hills) (bot-drawn from game data, revised 2026-10-15) and the W2-W4 subpages (2026-10-07). Per-world totals if fully ranked: **merits W1 118 / W2 120 / W3 120 / W4 120**, **task points W1 719 / W2 1,530 / W3 2,300 / W4 2,240** (H, computed in `aw-tmp/tasks_summary.py`). The Achievement tasks cannot be fully ranked; see the Achievements section.

- **Daily tasks (H, `tasks.json` slots 8+; reset in the daily-reset routine @15114293):**
  - At each daily reset, for W1-W4 only, the game zeroes `Tasks[1][w][8]` and `Tasks[0][w][8]` and rolls a new random daily for `Tasks[5][w]`, retrying so it differs from yesterday's.
  - Pool sizes and point ranges:
    - **W1:** 28 dailies, 2-5 pts. Chop or mine N of an ore or log; say "hi" to Funguy; "sit noob" over Amarok's rubble; sell an Amarok key; drop a leaf on Stiltzcho; wear a Gem Shop hat (or type the bypass phrase); send a friend bonus; deposit a statue; smelt 25 iron bars; craft set items.
    - **W2:** 17 dailies, 4-6 pts. Fish or catch N of a type; trash 2 obols; 300 pickups; 69 active kills of a desert mob; "Take a Breather" is a free rest day.
    - **W3:** 17 dailies, 4-8 pts. Collect a critter; Tower Defence kills; make 4 cogs; check out Star Player; refine any salt; 69 active kills.
    - **W4:** 2 dailies. Defeat 1 Crystal monster (4 pts); defeat 1 Miniboss (6 pts).
  - The old W1 newbie guide notes that the guild's daily "World 1 Task" refers to this daily ([newbie guide gdoc](https://docs.google.com/document/d/1D9xRQ36p79FOzyKpf3wvWohKnO2pt47JgpPXeLnwmjc), author note "not updated in 2 years", L).
- **Unlocks tab (H, N.js `TaskUnlocks` @14684840; wiki [Tasks/Unlocks](https://idleon.wiki/wiki/Tasks/Unlocks), bot-drawn 2026-10-07):**

  | Column | Opens after (unlocks bought, wiki) | Also needs (H) | Rows | Gems in column | Highlights |
  |---|---|---|---|---|---|
  | 1 | start | — | 16 | 160 | Steel Axe, Birch Longbow, Quarterstaff (early class weapons), Militia/Thief/Top hats, copper and iron fishing rods and nets plus small pouches, Blunderbag (inventory bag), Sleek Shank, Steel Band |
  | 2 | 7 | Anvil tab 2 | 28 | 440 | Gold and Platinum tools plus Average/Sizable skill pouches, Bullet/FMJ, Sandy Satchel, desert armor, skill boots, Sizable Food and Material pouches |
  | 3 | 22 | Anvil tab 3 | 28 | 240 | Dementia and Void Imperium tools plus Big/Large pouches, traps and skulls with critter/soul pouches, Deuscythe / Blackhole Bow / Grey Gatsby, Shivering Sack, Large Food/Material pouches |
  | 4 | 60 | Anvil tab 4 | 32 | 95 | Lustre and Starfire tools plus Massive/Volumetric pouches, Diabolical set, Peeper Pouch, Volumetric Food/Matty pouches |
  | 5 | 90 | Anvil tab 5 | 8 | 70 | 2/4/12/24 hr Time Candy, gems |
  | 6 | 106 | Anvil tab 6 | 8 | 140 | Bramble of the Emperor pendant, gems |
  | 7 | 119 | Anvil tab 7 | 8 | 40 | gems |

  The "also needs" column comes from `TaskStuff("UnlockColumnsOpened")` @6598249: column `b+2` opens when `GenINFO[20][b] - RecipesUnlocked ≤ 0` **and** `AnvilTabsOwned > b+1`. The threshold array itself was not located in N.js; the 7/22/60/90/106/119 values are the wiki's (M-H).

- **Feeds / fed by:**
  - **Fed by:** almost every W1-W4 system. Kills and AFK hours; Stamps; Anvil crafting; Bosses (Amarok, Efaunt, Chizoar, Troll and their Chaotic/Nightmare modes); Alchemy bubbles and cauldrons; Post Office; Skills efficiency; Refinery; Cogs and Construction; Shrines; 3D Printer; Worship TD; Trapping; Cooking; Breeding; Lab; Achievements.
  - **Feeds:** the Merit Shop (below); anvil recipes and pouches (Anvil and Smithing, Inventory and Storage); gems (Gem Shop); Time Candy; the Tome (total tasks completed and total AFK hours claimed, `TB parsers/world-4/tome.ts#L290`, `#L299`); the Guild daily task.
- **Per-session actions:**
  1. Open each unlocked world's board. Opening it refreshes the Achievement-task counts (`_event_TASKS`).
  2. Tap every ready tier. On reset-flag tasks, claim the moment a tier is ready, because further progress before claiming is wasted.
  3. Do the W1-W4 daily tasks. Most take under a minute.
  4. Spend merits (see Merit Shop).
  5. Buy any available unlock in an open column.
  - **Capped or idle states:** a ready tier left unclaimed on a reset-flag task; available unlocks > 0 with an unbought row in an open column; unspent merits ≥ the cheapest unmaxed affordable row.
- **AFK Setup implications:**
  - Faceless Deathmachine and Super Explosive Gameplay advance on any AFK, so they need no setup.
  - Active-only tasks need a deliberate Play Session, not an AFK Setup: Nakedknuckle (unarmed active kills), Pack Mule (a full inventory of materials, then craft without opening the chest), the boss-feat tasks, and the W2/W3 "69 active kills" dailies.
  - Before an AFK Stretch, a Pack Mule attempt or a boss chain ("chars 1-N in order") should be finished or abandoned, because walking out of town breaks Pack Mule.
- **Min-max by stage:**
  - **Early W1:** rank the easy tiers at once. Nakedknuckle 1-5 (unequip your weapon, kill beans/slimes/carrots/frogs/poops), Stamp Coolection, Just One More, the first Pack Mule tiers using [the wiki's Pack Mule guide](https://idleon.wiki/wiki/Tasks/Blunder_Hills/Pack_Mule_Guide) (2026-10-15), Such Rock tiers 1-2 (first Amarok kill and 5 kills). Spend unlock points on column 1 class weapons and pouches first, then Blunderbag. Get to 7 unlocks plus anvil tab 2 to open column 2.
  - **Mid W1-W2:** Such Rock tiers 3-6 unlock Amarok recipes 2-5, so these are Goals with real value. Unlock W2 tasks (Desert Davey quest and level 50). Rank USPS and bubbles passively, and Maximum Efficiency as skills grow. Twilight Tombstone tiers 2-6 gate the Efaunt recipes. Buy column 2 tools and pouches as your skill tiers need them. Its 12 rows of 25 gems are free gems.
  - **Late W2-W3:** Iceland Irwin's quest opens W3 tasks. Printer and Refinery tasks grow passively. My Shrines and Chill Out gate the Chizoar recipes; "8 chars in order" needs 8 characters. Push for 22 unlocks plus anvil tab 3.
  - **W4 outline:** Neddy's quest. Cooking, Breeding and Lab tasks progress with those systems. Begone Troll! gates the Troll recipes. Column 4 opens at 60 unlocks.
  - **Per class:** none material. The "chars 1-N in order" boss tiers need low-index characters strong enough to kill the boss.
- **Common mistakes:**

  | Mistake | How to detect from the save |
  |---|---|
  | Never opening the board, so ready tiers sit unclaimed | `tasksDescriptions[w][i].stat >= requirement` with `level < maxLevel` (both test accounts had W1 tiers ready or nearly ready, aggregate) |
  | Overshooting a reset-flag task | the same check on a reset-flag task; any excess above `requirement` is lost on claim |
  | Unspent unlocks | `taskUnlocks.unlockPointsOwned - taskUnlocks.unlockedRecipes > 0` and an open column with an unbought row (W3 test account: 26 owned / 16 bought; W2 test account: 9 / 7) |
  | Skipping dailies | `tasksDescriptions[w][8].level === 0` for an unlocked world (Toolbox alert `account.General.tasks`, `TB utility/dashboard/account.js#L87-L100`) |
  | Not unlocking a world's board | world reached, but `QuestComplete` lacks `Desert_Davey2` / `Iceland_Irwin1` / `Nebula_Neddy1`, and `Tasks[1][w]` is all 0 (the W2 test account had the W2 board locked) |
  | Free merits left on easy tiers (Nakedknuckle 1-4, Pack Mule 1-3) | `Tasks[1][0][3] == 0` or `Tasks[1][0][4] == 0` late into W2 (both test accounts) |

- **Save and Toolbox fields:**
  - Raw save `TaskZZ0..TaskZZ5` = `Tasks[0..5]`:
    - `[0][w][i]` = progress.
    - `[1][w][i]` = tier level; slot 8 is the daily (1 = done).
    - `[2][w][j]` = Merit Shop levels.
    - `[3][col][row]` = unlocks (0/1).
    - `[4][0]` = cumulative task points; `[4][w+1]` = **unspent merits of world w**.
    - `[5][w]` = today's daily index.
  - Toolbox (`TB parsers/tasks.ts#L21-L93`):
    - `account.tasks` = raw.
    - `account.tasksDescriptions[w][0..8]` = `{name, stat, level, maxLevel, requirement, meritReward}`; slot 8 is today's daily, resolved.
    - `account.taskUnlocks` = `{taskUnlocksList, unlockedRecipes, unlockPointsOwned, currentPoints, pointsReq}`.
    - `calcTotalTasks` feeds the Tome.
- **Sources:**
  - N.js (v1.23, 2026-10-17, H): `_customBlock_TaskStuff` @6596443, task rank-up @7263511, "Tap_to_Complete!" @7276505, `_event_TASKS` @7254340, `TaskDescriptions` @14774331, `TaskUnlocks` @14684840, daily reset @15114293.
  - Toolbox: `TB parsers/tasks.ts`, `TB data/website-data/tasks.json`, `taskUnlocks.json`, `TB utility/dashboard/account.js#L87`.
  - Wiki: [Tasks](https://idleon.wiki/wiki/Tasks) (2026-10-03), [Tasks/Blunder Hills](https://idleon.wiki/wiki/Tasks/Blunder_Hills) (2026-10-15), [Tasks/Yum Yum Desert](https://idleon.wiki/wiki/Tasks/Yum_Yum_Desert) (2026-10-12), [Tasks/Frostbite Tundra](https://idleon.wiki/wiki/Tasks/Frostbite_Tundra) and [Tasks/Hyperion Nebula](https://idleon.wiki/wiki/Tasks/Hyperion_Nebula) (2026-10-07), [Tasks/Unlocks](https://idleon.wiki/wiki/Tasks/Unlocks) (2026-10-07). All are before v1.23 (2026-10-16), but the data was cross-checked against v1.23 N.js and matches.

## Merit Shop

- **What it is:** The second tab of each world's Task Board. That world's merits buy permanent account upgrades: respawn, EXP, AFK gains, drop unlocks, star-talent max levels, boss armor recipes, and system slots and caps (H, N.js `TaskShopDesc` @14798640).
- **Unlocks:** Each shop opens with its world's Task Board (see Tasks). The boss-recipe row also needs that world's boss task tiers.
- **Scope:** Account-wide. Star-talent max-level rows write `SkillLevelsMAX` for every character in `PlayerDATABASE` (N.js `_customEvent_TaskShopPurchase` @7441806, H). You still spend each character's star talent points to use the higher cap.
- **Inputs → outputs:**
  - **Price:** flat per level, `TaskShopDesc[w][j][6]`, paid from `Tasks[4][w+1]`. No scaling (H, purchase handler @7265799).
  - **Max level:** `TaskShopDesc[w][j][5]`.
  - **Recipe rows** (flag `num1=1`) also need `Tasks[1][w][6] ≥ 2 + levels already bought`, meaning the boss task at tier 2 for the first recipe and one more tier per purchase (H; wiki says the same). Recipes come in a fixed order: Shoes, Pants, Torso, Helmet, then the accessory.
  - **Placeholder rows:** each world has one ("IDK_YET", cost text `cost`). They are not shown in W1, W3 or W4 (wiki shows 7 rows there and 8 in W2).
- **Goals and Milestones: every W1-W4 Merit Shop row (H, v1.23):**

  | W | Row | Upgrade | Max | Cost/lv | Total | At max | Gate / note | Priority |
  |---|---|---|---|---|---|---|---|---|
  | 1 | 0 | Inventory Bag B/C/E/F/H applied to everyone, if character 1 has it | 5 | 1 | 5 | bags B, C, E, F, H shared | character 1 must have used each bag (quest rewards) | mid; strong with many characters |
  | 1 | 1 | Blunder Hills mobs respawn +2%/lv | 10 | 1 | 10 | +20% | also used for Rift maps (`TB parsers/character.ts#L1828`) | high early |
  | 1 | 2 | +4%/lv EXP for the lowest-level character | 12 | 1 | 12 | +48% | only if strictly lower than every other character; a tie gets nothing (`TB parsers/character.ts#L1926`) | high while adding characters |
  | 1 | 3 | Goblet of Hemoglobin max Lv = 5×lv | 10 | 2 | 20 | Lv 50 | star talent: heal on kill, works AFK | **first: 1 level** |
  | 1 | 4 | Bosses can drop Boss Keys, "4% per purchase" | 10 | 1 | 10 | +40% (text) | data field says 7; the text is static, so the real per-level value is unverified (M) | mid if farming Amarok |
  | 1 | 5 | Amarok recipes: Paws, Hinds, Bodyplate, Helmet, Chaotic Amarok Pendant | 5 | 2 | 10 | full set | Such Rock tier 2/3/4/5/6 | **high, the moment each gate opens** |
  | 1 | 6 | W1 minibosses +30%/lv chance to drop new Star Talents | 6 | 3 | 18 | +180% | Baba Yaga and Dr Defecaus drop no books at all without ≥1 level (wiki note) | 1 level early, rest mid |
  | 2 | 0 | Monsters drop Obols, +5%/lv drop rate | 7 | 1 | 7 | +35% | level 1 is required for any monster obol drops | **first: 1 level** |
  | 2 | 1 | Yum-Yum Desert mobs respawn +2%/lv | 10 | 1 | 10 | +20% | | mid |
  | 2 | 2 | +2% AFK gains for your first N characters | 10 | 1 | 10 | chars 1-10 | flat +2% per covered character (`TB parsers/character.ts#L3234`) | high, up to character count |
  | 2 | 3 | Convert Better, Darnit! max Lv = 5×lv | 10 | 1 | 10 | Lv 50 | star talent (EXP Converter boost) | low-mid |
  | 2 | 4 | World bosses can drop gems, +7%/lv | 8 | 1 | 8 | 56% | first 150 bosses per day ([Bosses](https://idleon.wiki/wiki/Bosses); Toolbox alert `gemsFromBosses`, `TB utility/dashboard/account.js#L242`) | **high: daily gems** |
  | 2 | 5 | Efaunt recipes: Broken Ankles, Hipilium, Ribcage, Helmet, Trunculus | 5 | 2 | 10 | full set | Twilight Tombstone tier 2-6 | high as gates open |
  | 2 | 6 | W2 minibosses +30%/lv Star Talent drop | 8 | 3 | 24 | +240% | | mid |
  | 2 | 7 | +5%/lv Arcade ball gain | 5 | 2 | 10 | +25% | adds to the achievement arcade % (`TB parsers/dungeons.ts#L102`) | mid |
  | 3 | 0 | Purchases 1 and 3: +1 Build Slot; purchases 2 and 4: +1 Food Slot | 4 | 3 | 12 | +2 build, +2 food | Construction build queue; food slots for all characters | **first** |
  | 3 | 1 | Frostbite Tundra mobs respawn +2%/lv | 10 | 1 | 10 | +20% | | mid |
  | 3 | 2 | +2/lv max Lv of Talent Library books | 5 | 2 | 10 | +10 | (`TB parsers/misc.ts#L327`) | **high** |
  | 3 | 3 | Telekinetic Storage max Lv = 5×lv | 10 | 1 | 10 | Lv 50 | deposit-anywhere star talent plus carry cap | 1 level early (QoL) |
  | 3 | 4 | +0.5%/lv Printer Sample Size | 10 | 1 | 10 | +5% | (`TB parsers/character.ts#L3020`) | **high** |
  | 3 | 5 | Chizoar recipes: Walkers, Scaled Leggings, Bodyplate, Helmet, Caustic Scarf | 5 | 2 | 10 | full set | Chill Out Big Boy! tier 2-6 | as gates open |
  | 3 | 6 | Refinery salt costs don't scale beyond power output, +1 salt type/lv | 5 | 2 | 10 | 5 salts | (`TB parsers/world-3/refinery.ts#L42`) | high once Refinery runs |
  | 4 | 0 | First +1/lv kills each day spawn a Crystal monster | 3 | 3 | 9 | 3/day | crystal kills feed the W4 daily task and Crystal achievements (`TB parsers/misc.ts#L257`) | mid |
  | 4 | 1 | Hyperion Nebula mobs respawn +2%/lv | 10 | 1 | 10 | +20% | | mid |
  | 4 | 2 | +1/lv Nest egg capacity | 2 | 6 | 12 | +2 | (`TB parsers/world-4/breeding.ts#L181`) | high once Breeding starts |
  | 4 | 3 | Spice Spillage max Lv = 20×lv | 5 | 1 | 5 | Lv 100 | claim all spices on 1 hr+ AFK claims | mid (QoL for Cooking) |
  | 4 | 4 | +1/lv Lab connection range | 8 | 2 | 16 | +8 | (`TB parsers/world-4/lab.ts#L125`) | high early Lab |
  | 4 | 5 | Troll recipes: Soles, Twisted Scales, Trollish Garb, Thin Veil | 4 | 2 | 8 | full set | Begone Troll! tier 2-5 | as gates open |
  | 4 | 6 | +1/lv bubbles upgraded by No Bubble Left Behind per day | 3 | 5 | 15 | +3/day | needs the Lab bonus (`TB parsers/world-2/alchemy.ts#L1101`) | **first, once the Lab bonus is active** |

  Totals to max: W1 85, W2 89, W3 72, W4 75 merits. Merits available if every reachable tier is ranked: W1 116 (110 off Steam), W2 116 (114), W3 116 (112), W4 112 (110). These are M, worked out from the highest Achievement-task tier you can reach. Every row is affordable in the end.

- **Feeds / fed by:**
  - **Fed by:** that world's Task Board only (merits).
  - **Feeds:**
    - Star Talents (Goblet, Convert Better, Telekinetic, Spice Spillage).
    - AFK fighting (respawn, AFK gains).
    - Obols (W2 row 0).
    - Gems (W2 row 4).
    - Boss armor via Anvil recipes; Amarok gear is the community's carry set to about W4 ([shnaps gist](https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa), checked through v1.21 / 2026-09-18, L).
    - Arcade, Construction, Talent Book Library, 3D Printer, Refinery, Breeding, Lab, Alchemy (No Bubble Left Behind), and Character leveling (lowest-character EXP).
- **Per-session actions:**
  - Whenever `Tasks[4][w+1]` is at least the cost of the next row in the Spend Plan, buy it.
  - After claiming a boss-task tier, check whether a new recipe row opened.
  - A shop is capped when every shown row is at max.
- **AFK Setup implications:**
  - W1-W4 respawn rows raise AFK kills on every map in that world. Buy them for the world where your AFK fighters sit.
  - The W2 AFK-gains row covers only the first N character slots in account order. Buy levels up to your character count.
- **Min-max by stage (Spend Plan order):**
  - **W1 (early):**
    1. Goblet of Hemoglobin ×1 (sources: old newbie guide "1 point into Hemoglobin", L; gist, L).
    2. Respawn to 10.
    3. Lowest-level EXP and Boss Keys alternately.
    4. Amarok recipes the moment each Such Rock tier lands.
    5. One level of W1 Star Talent drops.
    6. Goblet to 5-10.
    7. The Bag row. It is the old guide's "last priority", but it costs only 5 merits and helps every character once character 1 has bags B-H, so it moves up on accounts with many characters (M).
  - **W2 (mid):**
    1. Obol drops ×1 immediately.
    2. World-boss gems to 8.
    3. AFK gains up to character count.
    4. Efaunt recipes as gated.
    5. Respawn, Arcade, Convert Better, Star Talents.

    The gist's order ("W2 Obol Drop Rate (1pt)") agrees on the first buy.
  - **W3 (late):**
    1. Build/Food slot row.
    2. Talent Library +2 to 5.
    3. Printer Sample to 10.
    4. Telekinetic ×1, then Salt row as Refinery tiers grow.
    5. Chizoar recipes as gated.
    6. Respawn.

    The gist says "Telekinetic Storage (1pt) + Library" (L).
  - **W4 outline:**
    1. No Bubble Left Behind ×3 as soon as the Lab bonus exists (gist: "W4 No Bubble Left Behind (early!)", L).
    2. Lab range.
    3. Egg capacity.
    4. Crystal row.
    5. Spice Spillage.
    6. Troll recipes.
    7. Respawn.
  - **Per class:** star-talent rows help every class. Hemoglobin is most valuable on low-sustain AFK fighters (M).
- **Common mistakes:**

  | Mistake | How to detect from the save |
  |---|---|
  | Hoarding merits | `Tasks[4][w+1] ≥ min(cost of unmaxed rows)`. The W2 test account had 12 W1 merits unspent. |
  | No obol merit in W2 | W2 board unlocked and `Tasks[2][1][0] == 0` |
  | No boss-gem merit | `Tasks[2][1][4] == 0` (Toolbox only alerts when it is above 0) |
  | Buying the W2 AFK-gains row beyond character count | `Tasks[2][1][2] > number of characters` (wasted merits; M) |
  | Missing the W3 slot row or the Library row | `Tasks[2][2][0] < 4` or `Tasks[2][2][2] < 5` once W3 tasks pay enough merits |
  | Raising a star-talent cap but never spending star points into it | `Tasks[2][0][3] > 0` but the character's Goblet talent level is 0 (per-character talent data; field mapping left to the talent dossier) |

- **Save and Toolbox fields:**
  - `Tasks[2][w][j]` = row level.
  - `Tasks[4][w+1]` = unspent merits.
  - Toolbox `account.meritsDescriptions[w][j]` = `{descLine1, totalLevels, meritCost, extraStr, bonusPerLevel, level, description}` (`TB parsers/tasks.ts#L64-L73`). The static data is in `TB data/website-data/shared-data.json` key `merits`; its `meritCost: null` marks the hidden placeholder rows.
- **Sources:**
  - N.js (v1.23, 2026-10-17, H): `TaskShopDesc` @14798640, purchase handler @7265799, `_customEvent_TaskShopPurchase` @7441806.
  - Toolbox: `TB parsers/tasks.ts`, `TB parsers/character.ts#L1828`, `#L1926`, `#L3020`, `#L3234`, `TB parsers/misc.ts#L257`, `#L327`, `TB parsers/world-3/refinery.ts#L42`, `TB parsers/world-4/lab.ts#L125`, `TB parsers/world-4/breeding.ts#L181`, `TB parsers/world-2/alchemy.ts#L1101`, `TB parsers/dungeons.ts#L102`, `TB utility/dashboard/account.js#L242`.
  - Wiki: [Tasks/Blunder Hills](https://idleon.wiki/wiki/Tasks/Blunder_Hills) (2026-10-15), [Tasks/Yum Yum Desert](https://idleon.wiki/wiki/Tasks/Yum_Yum_Desert) (2026-10-12), [Tasks/Frostbite Tundra](https://idleon.wiki/wiki/Tasks/Frostbite_Tundra) and [Tasks/Hyperion Nebula](https://idleon.wiki/wiki/Tasks/Hyperion_Nebula) (2026-10-07), [Bosses](https://idleon.wiki/wiki/Bosses) (2026-02-06, Stale-risk).
  - Community (L): [shnaps progression gist](https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa) (checked through v1.21 / 2026-09-18; Stale-risk for v1.23); [Legends of Idleon Newbie Guide](https://docs.google.com/document/d/1D9xRQ36p79FOzyKpf3wvWohKnO2pt47JgpPXeLnwmjc) (author note: not updated in 2 years; Stale).
  - Reddit (Arctic Shift) was queried on 2026-10-17 but returned "Too many requests" and timeouts on every attempt, so no Reddit claim is used.

### Sources

- Game client N.js v1.23 "Luminous_Menagerie", Last-Modified 2026-10-17: `https://www.legendsofidleon.com/ytGl5oc/N.js`. Offsets: `_customBlock_TaskStuff` @6596443 (`MeritsGiven` @6597194, `UnlockColumnsOpened` @6598249); `_event_TASKS` @7254340; task rank-up @7263511; Merit purchase @7265799; "Tap_to_Complete!" @7276505; `_customEvent_TaskShopPurchase` @7441806; `_customBlock_steamachieve` @7776650; `_customBlock_Reg_ach_add_status` @7782263; `_customBlock_AchieveStatus` @7785374; `AchBallzBonuses` @14526956; `TaskUnlocks` @14684840; `RegAchieves` @14708598; `TaskDescriptions` @14774331; `TaskShopDesc` @14798640; daily reset @15114293.
- IdleonToolbox @6827d3f (2026-10-17): `parsers/tasks.ts`, `parsers/achievements.ts`, `parsers/damage.ts#L383`, `parsers/dungeons.ts#L93`, `parsers/character.ts#L1828`, `#L1926`, `#L3020`, `#L3234`, `parsers/misc.ts#L257`, `#L325`, `#L327`, `#L393`, `parsers/efficiency.ts#L521`, `parsers/world-2/alchemy.ts#L1101`, `parsers/world-3/refinery.ts#L42`, `parsers/world-4/lab.ts#L125`, `parsers/world-4/breeding.ts#L181`, `parsers/world-4/tome.ts#L290`, `utility/dashboard/account.js#L87`, `#L242`, `data/website-data/achievements.json`, `tasks.json`, `taskUnlocks.json`, `shared-data.json` (`merits`, `ballsBonuses`). All at `https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/<path>`.
- idleon.wiki (revision dates checked 2026-10-17): [Achievements](https://idleon.wiki/wiki/Achievements) (content 2025-02-26, bot infobox 2026-10-03; Stale-risk for notes); [Tasks](https://idleon.wiki/wiki/Tasks) (2026-10-03); [Tasks/Blunder Hills](https://idleon.wiki/wiki/Tasks/Blunder_Hills) (2026-10-15); [Tasks/Yum Yum Desert](https://idleon.wiki/wiki/Tasks/Yum_Yum_Desert) (2026-10-12); [Tasks/Frostbite Tundra](https://idleon.wiki/wiki/Tasks/Frostbite_Tundra) (2026-10-07); [Tasks/Hyperion Nebula](https://idleon.wiki/wiki/Tasks/Hyperion_Nebula) (2026-10-07); [Tasks/Unlocks](https://idleon.wiki/wiki/Tasks/Unlocks) (2026-10-07); [Tasks/Blunder Hills/Pack Mule Guide](https://idleon.wiki/wiki/Tasks/Blunder_Hills/Pack_Mule_Guide) (2026-10-15); [Bosses](https://idleon.wiki/wiki/Bosses) (2026-02-06); [Changelog/2025](https://idleon.wiki/wiki/Changelog/2025) (v2.35, 2025-04-01); [Changelog/2026](https://idleon.wiki/wiki/Changelog/2026) (v1.21 W7 Taskmaster, 2026-09-05; v1.05 daily-task fixes, 2026-02-20). All wiki edits predate v1.23 (2026-10-16); the task and merit data was cross-checked against v1.23 N.js and matches.
- Community (L): shnaps "Legends of IdleOn Step-by-Step Progression Guide" gist, https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa (verified through v1.21 / 2026-09-18). "Legends of Idleon Newbie Guide", https://docs.google.com/document/d/1D9xRQ36p79FOzyKpf3wvWohKnO2pt47JgpPXeLnwmjc (author says not updated in 2 years). The IdleOn Guide Sheet and the Antho and Arkh sheet have no Merit, Task or Achievement tabs (checked 2026-10-17).
- Real saves (read-only; aggregate counts only): `fixtures/private/yasser.parsed.json` (W2 account), `fixtures/private/joseph.parsed.json` (W3 account).
- Analysis script: `$S/aw-tmp/tasks_summary.py` (per-world merit and point totals).
