# Dossier: Colosseum

Revised 2026-10-19 after two adversarial verification passes (source lens, game-data lens). Confidence tags: H = confirmed in tier 1 code/data, M = tier 3 wiki single-sourced or consistent with tier 1, L = unverifiable by both lenses. Verified against Toolbox pin 6c37e3d (game 2.3.540). Paths below are relative to `packages/toolbox-parsers/vendor/` ("V/"). Tiers: 1 game data / Toolbox code, 2 Toolbox dashboard logic, 3 wiki, 4 community. Wiki fetches were summarised by a fetch tool, so every tier-3 number is single-sourced unless stated; re-check against the in-game chest screen before shipping numbers into the Knowledge Base.

## Colosseum

- **What it is:** Six timed wave arenas (one per world W1 to W6). Each run costs Colosseum Tickets and pays Bronze / Silver / Gold chests by final score; Gold chests also need every wave cleared. [C20][C21][C22][C24]
- **Unlocks:** Each arena is a map: Dewdrop (Blunder Hills, 2nd screen), Sandstone (Yum-Yum Desert), Chillsnap (Frostbite Tundra; the game data map name is "Coldsnap_Colosseum"), Astro (Hyperion Nebula), Molten (Smolderin' Plateau), Whimsical (Spirited Valley). Map ids 36/68/115/164/215/265 [C17, H]. **Disputed [C34]:** the original dossier placed Astro at TV Outpost, Molten at Niagrilled Falls and Whimsical at Picnic Bridgeways; the source lens refuted this using idleon.wiki/wiki/Colosseum (tier 3) and the Centurion7 quest text in quests.json (tier 1, "Smoldering Plateau" for Molten); the game-data lens could not verify either way. Correction adopted: Astro Hyperion Nebula, Molten Smolderin' Plateau, Whimsical Spirited Valley (M; Dewdrop/Sandstone/Chillsnap locations match, M). Exact town-screen positions are not in Toolbox; confirm in game. Tickets: three NPCs (Typhoon W1, Centurion W2, Lonely Hunter W3) each pay 1 ticket a day after a first quest (H); Centurion needs World 1 finished and Lonely Hunter World 2 finished for ActiveOn's reach rule (H, account.js areKeysOverdue). [C5 H][C7 H][C9 H][C30 M]
- **Scope:** Tickets and high scores are account-wide (`CYColosseumTickets`, `FamilyValuesMap.ColosseumHighscores`). A score is a per-account best per arena, not per character. More characters finishing the NPC quests gives no extra daily tickets (M, consistent with code; wiki text unverified). [C2 H][C5 H][C19 H][C30 M]
- **Inputs to outputs:** Tickets (1/2/3/6/10/30, M) plus 5 minutes (Whimsical possibly 2:30, L, sources disagree) of kills give a score; score picks chests (M); chests give coins, gems, upgrade stones, materials, souls, stamps, followers, rare obols/pens (L, wiki only). Score also feeds the Tome (H), four achievements (H), a Royal Worm quest (H), Centurion rank quests (H) and a star-chart constellation (H). Toolbox also defines per-arena leaderboard categories `w1Colo`..`w6Colo` (icon data/TixCol, V/utility/leaderboardIcons.js:144-149, H). [C4][C10][C12][C13][C24][C43]
- **Goals and Milestones:** see tables in the Mechanics catalogue (chest thresholds per arena; achievement thresholds; Centurion rank ladder).
- **Feeds / fed by:** Fed by Typhoon, Centurion, Lonely Hunter day-banks, quest rewards, Post Office Cosmic Carrier (rare, L), the Upgrade Vault "Duplicate Entries" doubler (H). Feeds the Tome (Total Colosseum Score), Arcade-balls and cash achievements, EZ-Access, Guild Tasks (Play W1 / W2 Colosseum), Divinity Pearls / Holy Pearls rewards, Time Candy. [C4][C10][C13][C14][C16][C31]
- **Per-session actions:** Collect banked tickets before any NPC passes 3 days (the bank caps and further days are lost; H). Spend tickets on the highest-value arena the account can still gain chests in (L, inference); do the daily Guild Task arena run when the guild task is active (H). Idle/capped state: any reachable NPC with `daysSincePickup >= 3` (H). [C5][C7][C16]
- **AFK Setup implications:** Colosseum maps are excluded from AFK/portal targets, so it is an active-play item only; it never needs a character parked. Note: exclusion is by map name containing "Colosseum" in portals.ts, character.ts and grimoire.ts (H); the speedrun.ts reference (L197) is only a comment and does not name colosseums, so "excluded from speedrun time" is loose (L). [C18]
- **Min-max by stage:** see section below.
- **Common mistakes:** Letting NPC banks cap at 3 days; pressing through waves slowly (multiplier decays with enemies on screen); trying the fight with Mob-HP curses on; using Divine Knight orb in W5/W6 where it does not apply (M, wiki v2.08, pre-patch flag); forgetting that "Duplicate Entries" only doubles tickets redeemed from inventory (L, wiki Tips only). Multiplier decay and Mob-HP curse advice are L (not found by either lens). [C15 L][C23 L][C32 M][C33 L]
- **Save and Toolbox fields:** see Mechanics catalogue.

## Mechanics catalogue

M1. **Colosseum Ticket currency.** Item `TixCol`, "Colosseum_Ticket", account currency (hold-down in inventory to add; unlimited stack). Save field `CYColosseumTickets` -> `account.currencies.ColosseumTickets.totalAmount` (V/parsers/misc.ts:560, enhanceColoTickets return; line numbers approximate). ActiveOn: `account.colosseumTickets` (banks only) and `spend` input `colosseumTickets.balance` (CYColosseumTickets); ActiveOn `tickets-banked.ts` detector has fireAtDays 2 and bankCapDays default 3. Confidence H. [C5][C19][C36][C37]

M2. **NPC daily ticket bank (x3).** Typhoon / Centurion / Lonely Hunter each: 1 ticket per day, banks up to 3 days (tickets stop accruing after 3). Day counters live in `account.accountOptions[15]` (Typhoon), `[35]` (Centurion), `[56]` (Lonely Hunter); Toolbox: `totalAmount = min(daysSincePickup,3)`, `amountPerDay = 1`. Per-NPC `dialogThreshold` 3 / 4 / 6 is declared but the per-character count is commented out (not used). Parser: V/parsers/misc.ts:571-590 `account.currencies.ColosseumTickets.allTickets[]`. Confidence H (code); the wiki-side 3-day cap statement is M. [C5][C6][C30]

M3. **Reach rule.** NPC 0 always counts; NPC i counts only if `account.finishedWorlds.World<i>`; alert when `daysSincePickup >= 3` (V/utility/dashboard/account.js:2096-2111). The day counter keeps rising for an unreachable NPC (L, inferred, not tested). Alert help text in alertMeta.js. Confidence H. [C7][C8]

M4. **Duplicate Entries (Upgrade Vault idx 52).** Doubles tickets "whenever you get new colosseum tickets"; max level 1; vault unlock level 2470 total vault levels; data field x1 = 100,000,000 (H for the value; what x1 means is not confirmable from data, so the wiki's "1 Dementia Coin" cost is unreconciled, L; see open question). Per wiki Tips, only applies to tickets redeemed from inventory, not NPC / EZ-Access claims (L, unverified by either lens). Parser: V/parsers/misc/upgradeVault.ts:22-38, `account.upgradeVault.upgrades[52]`. Interplay: the doubler therefore interacts with the ticket sources above only through inventory redemption, never the NPC banks (L). [C14 H][C15 L]

M5. **Quest ticket rewards (one-time).** Typhoon1 "Surprise Attack": 1 ticket + 100 XP (kill 7 frogs per wiki). Centurion1 "Down the Mimic Hole": 1 ticket + 100 XP. Centurion2 "Which one of yous is the Mafia": 2 tickets, 2x 1HR candy, coins 10k (needs 2,500 Coconotnotto). Lonely Hunter2 "Skeleton? Skelegone": 2 tickets, 1HR candy (5 Xylobones). Lonely Hunter3 "Opening Chests": 2 tickets + Lonely Hunter Token (NPCtoken31); requires opening 7 Bronze, 3 Silver, 1 Gold chests in this colosseum (a chest-opening quest, so per-arena chests are a tracked mechanic). Data: V/data/website-data/quests.json (`Typhoon.1`, `Centurion.1-2`, `Lonely_Hunter.2-3`). Confidence H for all numbers (both lenses verified quests.json); the Lonely Hunter colosseum location is L. [C9][C11]

M6. **Post Office Cosmic Carrier.** Rare Colosseum Ticket reward (wiki: 1 in 547, available after 30 completed shipments). Not in Toolbox code or vendored post office data. Confidence L (unverifiable by both lenses). [C31]

M7. **Arena entry cost.** 1 / 2 / 3 / 6 / 10 / 30 tickets (Dewdrop, Sandstone, Chillsnap, Astro, Molten, Whimsical). Wiki-only (not in Toolbox); verified on the wiki by the source lens. Confidence M. [C20]

M8. **Waves, boss, gold rule.** 15 / 15 / 15 / 15 / 25 / 50 waves; final wave boss (Baba Yaga, Biggie Hours, Chillsnap boss, Mutated Mush, Domeo Magmus, Demented Spiritlord); Gold chests require clearing all waves. Wave counts and all-waves-for-Gold confirmed on the wiki by the source lens (M); boss names are L (unverified). [C21]

M9. **Score multiplier and time bonus.** "Next Round" skips ahead and raises the multiplier; more enemies on screen decays it faster; multi-kill combos raise it; clearing all waves with time left adds a Time Bonus. Exact formula is not in Toolbox (game code only); unknown. Qualitative description M (roughly confirmed by the wiki summary); Time Bonus detail L. Centurion5 quest text also says to finish with "lots of Time Remaining". [C23]

M10. **Chest tiers by score (per arena).** Eight chest slots per arena: Bronze x3, Silver x2, Gold x3 (see table). Thresholds at game 2.3.540 per wiki. Confidence L: neither lens could verify the arena pages (only the 25K/200K/2.5M/10M achievement and 200K/350K quest values corroborate, H). Re-check in game before shipping. [C24-C29]

| Arena | Bronze1 | Bronze2 | Silver1 | Gold1 | Silver2 | Gold2 | Bronze3 | Gold3 |
|---|---|---|---|---|---|---|---|---|
| Dewdrop | 0 | 10K | 10K | 50K | 160K | 200K | 320K | 450K |
| Sandstone | 0 | 25K | 60K | 125K | 960K | 500K | 800K | 1.13M |
| Chillsnap | 0 | 50K | 125K | 300K | 2M | 1.2M | 1.6M | 2.7M |
| Astro | 0 | 125K | 325K | 650K | 5.2M | 2.6M | 4M | 5.85M |
| Molten (25 waves) | 0 | 800K | 3M | 7M | 48M | 28M | 25.6M | 63M |
| Whimsical (50 waves) | 0 | 5M | 20M | 40M | 320M | 160M | 160M | 360M |

(Slot order within a row follows the wiki tables; Gold slots need all waves. Whimsical Bronze3 and Gold2 share 160M.)

M11. **High score storage.** `FamilyValuesMap.ColosseumHighscores` (legacy `FamValColosseumHighscores`): array, index 0 ignored, indices 1-6 = dewdrop, sandstone, chillsnap, astro, molten, whimsical. Parser V/parsers/highScores.ts:6,30,61-67 -> `account.highscores.coloHighscores[{name,score}]`. `calcColoTotalScore` = sum of six. NOT currently exposed in ActiveOn Account State (grep of account-state/src finds no coloHighscores). Confidence H. [C1][C2][C3][C38][C39]

M12. **Tome: Total Colosseum Score.** Tome entry x1=10, curve type 1 (log): `pointsPercent = 2.4*log10(q)/(2*log10(q)+10)`, max 200 pts base x3 (max percent 1.2 gives 240 cap in getMaxPointsForBonus); q = sum of six best scores. V/parsers/world-4/tome.ts:345, 251-253, 190-203; data shared-data `tome` entry Total_Colosseum_Score (data index 53, x1=10, x2=1 is the curve-type field, x3=200). Confidence H. [C4]

M13. **Achievements.** Colosseum_Contender (TaskAchA25): 25,000 in Dewdrop -> RNG item unlock. Sweet_Victory (B34): 200,000 Sandstone -> +2% Arcade balls/hr. Cool_Score! (C44): 2,500,000 Chillsnap -> W3 Colosseum EZ-Access + W3 Shops EZ-Access. Zero_G_Scorin' (D26): 10,000,000 Astro -> +5% cash from monsters. EZ-Access for W1 comes from Half_a_Mill-log (A43, 500k Veiny logs in storage), W2 from Super_Cereal (B33, 50k Sentient Cereal) (M, EZ-Access entries present, individual rewards not all checked). V/data/website-data/achievements.json. Confidence H for the four thresholds and rewards. [C13]

M14. **Centurion rank ladder (quest chain).** High Scorer (Centurion3: 200K score; 2x 2HR candy, 20k coins), Colosseum Champ (Centurion4: all 15 waves + 350K; candies, 50k), Colosseum GDQ (Centurion5: complete three arenas each with 180 s time remaining after all waves; 12HR candy, 30 gems, 100k; time-remaining based), Centurio Rank (Centurion6: win Astro, W4; 12HR candy + 5 Holy Pearls), Legatus Rank (Centurion7: win Molten, W5; 24HR candy + 6 Holy Pearls + 8 Divinity Pearls), Glorious Gladiator (Centurion8: win Whimsical, W6; Gladiator trophy, Trophy22). Data: quests.json `Centurion.3-8`. Confidence H (both lenses). Ranks 7 and 8 are W5/W6 content but sit in the same chain, so they gate Centurion reward completeness. The Lv55 requirement is L (wiki, unverified). Which three arenas count in Centurion5 is not stated in the data (L). [C10]

M15. **Royal Worm "Royal Score".** Quest `Royal_Worm.3`: get a colosseum score of 48,500,000 (reward 2 Holy Pearls). Reward also includes 40 Cooking Ladle. Which arena is unspecified in the quest text ("By arcade, he means colosseum"); Astro's top chest is 5.85M (per L wiki table), so this likely refers to a later arena or a total (open question, L). Confidence H for score/rewards. [C12]

M16. **Guild tasks.** "Play_W1_Colosseum" and "Play_W2_Colosseum", requirement 1, 10 GP each (shared-data `guildTasks`). Confidence H. [C16]

M17. **Star chart constellations.** A-8 "Clear the colosseum on 3 players" (map 36 Dewdrop, 4 pts); B-5 "Clear the colosseum on 4 players" (map 68 Sandstone, 3 pts). Data shared-data `constellations`. Confidence H. These are distinct clear-by-player-count challenges (3 players on Dewdrop, 4 on Sandstone), a separate mechanic from score. [C43]

M18. **Task "Begone, Skeleton!"** Defeat Xylobones in the Chillsnap colosseum (summoned by breaking the Skull Rock top right); breakpoint 10 (tasks.json). Lonely Hunter quest needs 5. Task text verified (H); breakpoint 10 unchecked (L). [C11][C40]

M19. **Exclusions.** Colosseum maps excluded from Toolbox portal lists, AFK-fighting detection, grimoire fight stats, and speedrun time (loose, see AFK Setup note). [C18]

M20. **Class meta.** Divine Knight best for W1-W4 (Orb of Remembrance drop multipliers + AoE); Bubonic Conjurer for W5-W6 where the orb does not apply (as of 2.08 / 2025-04). Pre-patch flag. Confidence: M for "orb does not affect W5/W6 colosseums as of v2.08" (wiki Colosseum page), L for the class recommendations. [C32]

M21. **Per-arena leaderboards.** Toolbox leaderboardIcons.js defines `w1Colo`..`w6Colo` categories (V/utility/leaderboardIcons.js:144-149, tier 1, H); ActiveOn does not track them.

M22. **Chest-opening counts as a tracked quest hook.** Lonely_Hunter3 needs 7 Bronze / 3 Silver / 1 Gold chests (M5); the Chillsnap Xylobone task (M18) is the other arena-specific objective. H.

W5+ extensions (one line each): Molten (W5, 25 waves, 10 tickets) and Whimsical (W6, 50 waves, 30 tickets) as above; Legatus / Glorious Gladiator ranks; wiki claims third Silver (W5) and third Gold (W5, W6) unattainable as of 2025-04-12 (pre-patch, may be stale, L); Compass labels one monster "W3 Colo" (rockS; compass.ts:284, H). [C21][C32][C41]

## Min-max by stage

W1 early (first 1-3 days): Do the Typhoon quest (7 frogs) the first day to start the daily ticket; pick up daily. Run Dewdrop (1 ticket): aim for Silver (10K) quickly then Gold (50K, all 15 waves). Achievement target 25,000 (RNG item unlock). Priority: bank Typhoon daily, then Dewdrop. [C9][C13][C24][C30]
W1 mid/late: Push Dewdrop gold slots 200K and 450K (needs full clears); farm cheap arena for Gold chest items. Fill Guild Task "Play W1 Colosseum" for 10 GP. Priority: Gold chests before Bronze repeat. [C16][C24]
W2 early: Finish World 1 so Centurion counts; do Centurion1-2 (3 tickets). Sandstone (2 tickets): Silver at 60K, Gold 125K; High Scorer quest needs 200K (also the Sweet_Victory achievement, +2% arcade balls). [C10][C13][C25]
W2 late: Chase 500K / 800K / 960K / 1.13M. Meet Cool Score and EZ-Access prerequisites (Super_Cereal 50k cereal). [C13][C25]
W3 early: Finish World 2 to include Lonely Hunter (4 tickets from his quests). Chillsnap (3 tickets) Gold at 300K; Colosseum Champ rank needs all 15 waves and 350K in one run. Do Skull-Rock Xylobones. [C11][C26]
W3 late: Chase 2.5M (Cool_Score!, gives W3 Colosseum EZ-Access) and the 2.7M last gold; Colosseum GDQ needs three arenas each cleared with 180 seconds left. [C10][C13]
W4: Astro (6 tickets, 263 enemies): 650K first Gold, 2.6M, 5.85M last; 10M achievement (+5% cash) is above the last chest so is a score-only goal. Win Astro for Centurio Rank (5 Holy Pearls). Royal Score (48.5M) is a later goal. Use Divine Knight for drops. [C10][C12][C13][C27][C32]
W5+ outline: Molten (10 tickets) wins Legatus (8 Divinity Pearls); Whimsical (30 tickets) Glorious Gladiator; use Bubonic Conjurer. Reality check: chest top slots may be unreachable. [C10][C28][C32]
Ticket economy (any stage): spend priority is ticket-per-chest value: cheaper arenas give chests at 1-3 tickets; Duplicate Entries only helps inventory redemption; never let a bank pass 3 days. No community source gives a strict ranking; this ordering is inference (L confidence). [C14][C15][C20]

## Common mistakes and detection from the save

- Banked tickets idle: `account.colosseumTickets[i].daysSincePickup >= 3` for a reachable NPC. [C5][C7]
- Never finished a first quest: day counter and tickets absent. [C9]
- High score zero for an owned arena: `highscores.coloHighscores[i].score === 0` (not yet in Account State). [C2]

## Sources

Claim ids [C1]-[C43] refer to the verified claim list; confidence tags inline. Source paths: V/parsers/highScores.ts, misc.ts, world-4/tome.ts, misc/upgradeVault.ts, utility/dashboard/account.js, alertMeta.js, data/website-data/{quests,achievements,tasks,shared-data}.json; idleon.wiki Colosseum, Colosseum/<Arena>, Typhoon, Centurion, Lonely_Hunter, Royal_Worm, Upgrade_Vault, Tips_and_Tricks, Post_Office; digitaltq.com Whimsical page.

## Open questions

1. Duplicate Entries cost: data x1 = 1e8 vs wiki "1 Dementia Coin" (x1 meaning unconfirmed).
2. Time limit: wiki 5 minutes for all vs digitaltq 2:30 for Whimsical.
3. Royal Score 48.5M: which arena or total?
4. Exact score multiplier formula (game code, not Toolbox).
5. Town-screen locations of Astro/Molten/Whimsical (C34 disputed; correction adopted).
5b. Pre-patch flag: W5/W6 chest unattainable and DK orb claims dated 2025-04-12 / v2.08.
6. Chest-slot ordering in the wiki tables differs slightly per page; confirm in game.
7. Dialog thresholds 3/4/6 in Toolbox unused: unlock NPC condition (quest done) not read from save.
