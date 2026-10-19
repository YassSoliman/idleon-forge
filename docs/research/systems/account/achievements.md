# Achievements

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Paths: `V` = `packages/toolbox-parsers/vendor`, `D` = `V/data/website-data`, `P` = `V/parsers`. Prior research (`research/account-wide:docs/research/systems/account-wide/achievements-tasks-merit.md`, N.js v1.23, Toolbox 6827d3f) was re-checked against the pinned data; counts match. N.js-only facts (Steam gating) are carried from that dossier and marked "prior". Web search budget was exhausted during this run, so community sources (tier 4) are thin; this is flagged in Open questions. Revised after two adversarial verification passes (source lens, game-data lens): no claim was refuted by both lenses; two claims (C3, C41) are marked **Disputed**; every claim now carries a confidence (H/M/L) in the Sources section; seven missed mechanics were added (M26-M32).

## Achievements

- **What it is:** an account-wide list of goals, opened from the button in the top left. 420 slots, 70 per world for W1-W6, of which 63 / 55 / 50 / 33 / 32 / 35 are real; the rest are `FILLERZZZ_ACH` placeholders [C1]. Each pays a one-time reward or a permanent bonus that applies the moment it completes; nothing is claimed [C2].
- **Unlocks:** **Disputed.** Prior view: available from account creation, goals become doable as each world's content is reached [C3]. Source-lens view: the wiki page (edited 2026-10-03) contains no 'always available' statement. Correction: treat "available from the start" as unverified (confidence L); the data only shows that goals are tied to content in each world.
- **Scope:** account-wide. One `AchieveReg` array serves all characters; per-character triggers ("reach level 20 on any character") complete the account entry [C4].
- **Inputs -> outputs:** inputs are gameplay events and storage states. Outputs are of eight kinds: Steam gems and Time Candy, permanent % stat bonuses, Arcade ball %, talent points, RNG-item unlocks (dungeon pool), title-screen backgrounds, EZ-Access / teleports / hat recipes, and counts toward the world's Achievement task and the Tome [C5][C6][C7].
- **Goals and Milestones:**

| World | Real | Steam-exclusive (gems) | Reachable off Steam | Steam gems | Secret | Achievement-task tiers (count) |
|---|---|---|---|---|---|---|
| W1 | 63 | 26 | 37 | 407 | 8 | 10,15,20,25,30,40,50,60,70 |
| W2 | 55 | 13 | 42 | 264 | 4 | 5,10,15,20,25,30,40,50,60,70 |
| W3 | 50 | 15 | 35 | 324 | 1 | same as W2 |
| W4 | 33 | 6 | 27 | 290 | 3 | same as W2 |
| W5 / W6 | 32 / 35 | 0 / 0 | all | 0 | 4 / 5 | same as W2 |

  [C8][C9][C10]. Reconcile with Steam: the wiki changelog says v2.35 (2025-04-01) made 275 achievements unlockable on Steam (from 68), but the data has only 60 `steamIndex` values (0-60, index 50 unused, idx 11 holds steamIndex 0) among W1-W4 entries. The 275 is the Steam-side achievement count (it includes non-gem ones and likely the W5/W6 entries that need no Steam gating); the 60 is the number of entries whose progress runs on the Steam counter. The exact mapping is not in the vendored data (confidence L) [C8][C41]. The last tier (70) is unreachable in every world because no world has 70 real entries [C11]. Highest reachable tier: W1 8 (Steam) or 5 (not), W2 8 / 7, W3 8 / 6, W4 6 / 5 [C11].
- **Feeds / fed by:** feeds the world's Achievement task (merits, unlock points), the Tome (total achievements count), Gaming, Arcade ball rate, damage, Class EXP, skill EXP, respawn, Talent Book Library, Cooking, Breeding, Construction, Printer, Forge, talent points [C12]. Fed by Dungeons, minigames, Storage, Death Note, Colosseums, Refinery, Construction, Sailing, Farming, Summoning.
- **Per-session actions:** nothing to claim. Check for cheap near-complete entries: exact-stack storage ones, minigame scores, skull sets. List the Steam-only entries not done when the player is on Steam. An achievement list is capped when every reachable entry in a world is `-1`.
- **AFK Setup implications:** Hybernation (idx 80) needs one character AFK 168 h. 1M Orb / Plunder / Wormhole kills (idx 239-241, +37 Tab 4 points) accrue from multikill AFK fighting. Crystal Champ (idx 175, 2000 crystal kills) rewards crystal-spawn gear [C13].
- **Min-max by stage:** see the section below.
- **Common mistakes:** playing on web/mobile and missing the Steam gem entries; exact-stack achievements missed because the stack is larger than N; dungeon difficulty damage achievements left undone; not knowing that W1-W4 Achievement tasks can never reach their last tier [C7][C11][C14].
- **Save and Toolbox fields:** see the Mechanics catalogue header and the Sources section.

## Mechanics catalogue

M1. **Slot layout and completion flag.** `account.achievements` is a 420-long array mapped 1:1 from `D/achievements.json` [C1]. `completed = AchieveReg[i] === -1` [C4]. World block = `floor(i/70)` (W1 0-69, W2 70-139, W3 140-209, W4 210-279, W5 280-349, W6 350-419) [C1]. Save field `AchieveReg` (counter or -1). Toolbox path `account.achievements[i].completed` (`P/achievements.ts#L22-L30`).

M2. **Progress counter.** `currentQuantity = steamIndex ? SteamAchieve[steamIndex] : AchieveReg[i]`, shown only when not completed and >= 0 [C15]. Save field `SteamAchieve[steamIndex]`. Path `account.achievements[i].currentQuantity`. Note the Steam counter is the useful progress for Steam-linked entries because their `AchieveReg` entry sits at 0 until the Steam side finishes. Edge case: the code tests `steamIndex ?` for truthiness, so idx 11 (steamIndex 0) falls through and reads `AchieveReg[11]` instead of `SteamAchieve[0]` [C15].

M3. **Steam gating (prior).** `SteamAchieve[d]` counts up on every platform, but completion and the gem/candy drop only run when `isElectron()` is true. Completion adds +2 to the linked `AchieveReg` entry, so Big Mobs Eek (quantity 5) is not completed by that +2 alone [C16]. 60 entries carry `steamIndex` (0-60, unique) and `steamExclusive: true` [C8].

M4. **Gem and Time Candy rewards.** `gems` and `candy {rawName, quantity}` per entry, W1-W4 only. 407+264+324+290 = 1,285 gems; 31 entries also drop Time Candy [C9]. Reward text and `gems` disagree on five rows: Anothervil Expansion (text 30, field 20), A Family of Me! (20 vs 25), Large Fortune (25 vs 20), and Milky Wayfarer / Mutant Massacrer (text "Some Gems and Candy", fields 50 and 30) [C17]. Treat the `gems` field as truth (M confidence). Reward-text sums and `gems` sums can differ, so compute gem totals from the `gems` field only; 29 gems entries have no candy and 31 have both.

M5. **Status multiplier.** `getAchievementStatus(list, i)` = 0 if not completed, else 5 for idx 4, 27, 37, 44, 107, 109, 117; 10 for idx 108; 20 for idx 99, 104, 112; otherwise 1 [C18]. Consumers multiply this by a per-site constant. Path `P/achievements.ts#L30-L52`.

M6. **Total count.** `calcTotalAchievements` counts `completed` entries. It feeds the Tome (`P/world-4/tome.ts#L294`) and sets the Gaming bonus count (`P/world-5/gaming.ts#L352`) [C19].

M7. **Arcade ball rate.** `getBallBonus` adds the second value of each pair in `ballsBonuses` when status === 1. 24 entries, total +47%. Data `D/shared-data.json#ballsBonuses`, code `P/dungeons.ts#L93-L105`. Pairs: +1% idx 46, 47, 49, 54, 77, 116, 140, 154; +2% idx 76, 83, 98, 103, 146, 151, 227, 229, 232, 234; +3% idx 40, 80, 115, 160, 213; +4% idx 171 [C20]. Quirk (**code-vs-text mismatch**; the pair list has 24 entries but 25 rows carry Arcade text): the 1% is granted at idx 140 (Reach World 3) in code, while the text "1% Arcade balls/hr" sits on idx 144 (Sad Souls), which is not in the list [C20]. Also, the code list contains idx 80 (Hybernation), 115 and 160 at +3, matching text.

M8. **Total damage.** `P/damage.ts#L386-L403`. Added together: Grandfrogger idx 58/59/60/62 = 2/3/5/5; Snakenhotep 119/120/121 = 2/3/5; Glaciaxus 185/186/187 = 2/3/5; Equinox Visitor 189 = 4; True Pirate 240 = 1 (W4 total 40). W5+: 280 +1, 297 +3, 303 +2, 364 +2, 354 +4, 375 +3 (+15) [C21]. Data text says "outside of dungeons" for the dungeon-difficulty rewards; the code adds them to the general total-damage sum (see Open questions). Idx 384 and 371 add a final 1.01x each (`damage.ts#L490`).

M9. **Class EXP.** `P/character.ts#L2165-L2208`: idx 57 +1%, 61 +3%, 124 +2%, 188 +5% (W1-W4 sum 11); 357 +20% (W6), 286 +25% (W5), up to idx 6 term at L2172 [C22].

M10. **Skill EXP and skill speed.** Idx 4 Choppin +5%, 27 Mining +5%, 117 Fishing +5%, 107 Catching +5% (status 5 each, `P/character.ts#L609-L908`). Idx 74 is catching power/efficiency (not EXP), capped at +5 (`P/efficiency.ts#L524`). Idx 113 Fruit Salad +5% catching speed is data-only in Toolbox (no consumer). Efficiency: idx 351 +10% catching and 352 +10% choppin efficiency (`efficiency.ts#L417/L540`). Idx 370 feeds a Sneak EXP term (`character.ts#L1499`). W5 idx 283 +10% / 284 +20% / 294 +10% All Skill EXP (`character.ts#L1677-L1716`); W6 idx 359 +15%, 356 +15% Farming, 360 +10% Farm EXP [C23].

M11. **Respawn.** `P/character.ts#L1821-L1859`: idx 44 (Two-Time Savior) +5% faster respawn for W1 mobs, idx 109 (Two Desserts) +5% for W2, idx 308 +2% for W5. Requirement for 44 and 109 is "trophy equipped and a second in the inventory" (quantity 2) [C24]. W7 uses `0.65 * (common + achievement)` scaling.

M12. **Talent points.** Formula in ActiveOn's own port `packages/account-state/src/talent-points-formula.ts#L100`: Tab 1 `5*A54 + 6*A216`; Tab 2 `2*A76 + 3*A78 + 8*A230`; Tab 3 `5*A166 + 10*A170 + 8*A219` (**Disputed:** the game's reward text for idx 219 says 10 Tab 3 points while the code uses 8; both recorded, confidence L; if the text is right W1-W4 Tab 3 is 25, not 23) [C25]; Tab 4 `10*A292 + 10*A295 + 10*A239 + 15*A240 + 12*A241`; Star `10*A212 + 20*A289 + 20*A305`; plus 1 Void pt on idx 242 [C25]. W1-W4 totals: Tab 1 11, Tab 2 13, Tab 3 23, Tab 4 37 (W4 only), Star 10, Void 1 = 95. W5 adds Tab 4 20 and Star 40. Save field `AchieveReg` (read raw, `talent-points.ts#L66`).

M13. **Talent Book Library.** Idx 145 Checkout Takeout (1000 checkouts): +5 book max level (`P/misc.ts#L328`, capped 5) and +30% library charge rate (`misc.ts#L396`, capped 30) [C26]. Idx 291 Maroon Warship (W5): +1 level to all talents (`P/talents.ts#L365`).

M14. **Cooking.** Idx 224 Cabbage Patch +10% and 225 Le Pretzel Bleu +20% meal speed, with Troll card total capped at +100% (`P/world-4/cooking.ts#L765-L812`). Idx 233 Best Plate: meal level cost divided by `min(5, max(1, 1 + 10*status/100))`, i.e. -10% (`cooking.ts#L1047-L1053`) [C27].

M15. **Breeding.** Idx 218: breedability multiplier "1.2x faster" (`P/world-4/breeding.ts#L430`: `20 * status`). Idx 221: egg rarity 1.1x (`breeding.ts#L351`). Idx 220 +10% incubator and 222 +5% mob fight damage are data-only in this Toolbox [C28].

M16. **Construction and Printer.** Idx 153 +5% build speed (`P/character.ts#L3668`, `min(5, 5*status)`); idx 163 +5% Construction EXP (data); idx 158 +1% printer sample rate (`character.ts#L3019`, `min(1, status)`) [C29].

M17. **Alchemy.** Idx 112 Vial Junkee: +20% sigil charge speed (status 20, `P/world-2/alchemy.ts#L878-L907`). Idx 108 S-M-R-T: -10% bubble upgrade costs; status is 10, but no Toolbox consumer for idx 108 was found in the pinned parsers [C30].

M18. **Forge and storage-adjacent.** Idx 281 Vitamin D-licious (W5): +50% Forge ore capacity (`P/world-1/forge.ts#L54,L173`). Idx 37 Nutty Crafter: +5% golden food (`P/misc.ts#L931`, status 5). Idx 99 Golden Obolden: +20% obol fragments. Idx 104 Ink Blot: 20% chance to keep a silver pen [C31].

M19. **Dungeon-linked achievements.** Dungeons grant 14 W1-W3 achievements: idx 57-62, 119-124, 184-188. Idx 184 Dungeon Wallop (25,000 single hit): +4% crit chance outside dungeons (`P/damage.ts#L1216`). Idx 122/123/148: +6%, +2%, +5% Multikill (`damage.ts#L1626-L1640`; idx 148 capped at 5) [C32].

M20. **Exact-stack achievements.** Require exactly N of an item in the Storage Chest: 9 in W1, 7 in W2, 6 in W3, 3 in W4. Reward types: RNG-item unlock, BG, EZ-Access, Arcade %, talent points (Buzz Buzz +3 Tab 2, Bottle Capital +10 Star) [C33].

M21. **RNG-item unlock.** 32 W1-W4 entries unlock an item in the Dungeon RNG pool (11 / 10 / 6 / 5) [C34].

M22. **Cosmetic and access rewards.** Title-screen backgrounds (5 / 4 / 5 / 3), EZ-Access to a world's Colosseum, shops or boss key (2 / 2 / 2 / 1 per world), teleports (Forest Villa, Deep Mining, Djonnuttown), hat recipes (Acorn at idx 56, Nuget Cake at 110, HONK at 179) [C35]. Idx 189 Equinox Mirror also opens Equinox Valley (+4% total damage) [C36].

M23. **Secret achievements.** 8 / 4 / 1 / 3 (W1-W4). Several carry real rewards (idx 46, 47, 49 Arcade %; 115, 116 Arcade; 117 Fishing EXP; 118 W2 boss key; 216 Tab 1 talent points; 242 Void point) [C37].

M24. **Achievement Task link.** One task per world (`D/tasks.json`: Achievement Hunter / Cowboy / Inuit / Astronaut / Promethean / Theist / Diver) counts that block's completed entries against the tier list above [C38].

M25. **W5+ extension (one line each).**
  - W5 (idx 280-349): 32 real, none Steam-gated; Sailing artifacts and boats (idx 287-291, 300-301, 309-310), Divinity gods (292-294), Gaming (296-299), 3 Star-tab and 2 Tab-4 talent grants, Class EXP 25%, All Skill EXP 10-20% [C39].
  - W6 (350-419): 35 real; Farming overgrowth (355-357, 363-365), Sneaking (366-370), Summoning (372-377, 379), Beanstalk golden food (380, 383), All Stat 1% (362), 6% drop rate (377) [C39].
  - W7: 7 Achievement-task entries exist (`tasks.json` has a seventh list), but `achievements.json` has no W7 block yet [C40].

M26. **Gaming bit gain and Superbit 0 (achievement count multiplier).** `calcSuperbitBonus` index 0 filters completed achievements and returns `Pow(1.03, count)` as a multiplier (`P/world-5/gaming.ts#L350-L353`); the same count is also pushed into the Tome (`tome.ts#L294`). Idx 296 and 307 each add a 1.05x factor to gaming bit gain (`gaming.ts#L256, L291`). This means every extra achievement is worth about +3% of that Superbit once bought [C19][C42].

M27. **Sailing loot-pile chest slots.** Idx 287 and 290 add chest slots (`P/world-5/sailing.ts#L83`) [C43].

M28. **Money from monsters.** Idx 235 (5%), 350 (10%) and 376 (20%) feed the monster-money bonus (`P/character.ts#L2808-L2810`) [C44].

M29. **Golden Food and crystal spawns.** Idx 380 (+2%) and 383 (+3%) add to all golden food (`P/misc.ts#L938-L939`); idx 285 grants +4 guaranteed daily crystal mob spawns (`misc.ts#L261`) [C45].

M30. **W6 farming, summoning, sneaking.** Idx 355, 363, 365 (farming: 5% each on growth and 15% on overgrowth, `P/world-6/farming.ts#L249/L559/L771/L1269`), 373 and 379 (summoning, `world-6/summoning.ts#L300-L301`), 368 (sneaking +5%, `sneaking.ts#L544`) [C46].

M31. **Steam-linked completion detail.** Steam-index 0 (idx 11) is treated as "no Steam link" by the truthiness test, so it reads AchieveReg. A finished Steam achievement adds +2 to the linked AchieveReg entry [C15][C16].

M32. **Data-only entries.** Idx 108 (S-M-R-T, -10% bubble cost, status 10), 113 (Fruit Salad), 220, 222, 99 and 104 have no Toolbox consumer; ActiveOn should show them as "applies in-game, not modelled" [C28][C30][C31].

## Min-max by stage

There is no class dependence. The community meta found is thin; ordering below is derived from reward size and effort from the data (tier 1) with tier 3 hints where available [C41].

- **W1 early:** **Disputed** [C41]: an earlier pass cited Another Me!, Classy!, Rookie Player as the wiki's early priorities, but that text was not found on the Achievements page (confidence L); treat them only as cheap gem entries on Steam. Minigame hits Hitting the Mark (idx 4), Minecart Maniac (27), Golden Fly (74). Decked Out in Gold (40, +3% balls). Exact-stack ones at copper 500 / oak 1500 / iron 2000 / sticks 20k / fibers 20k (idx 6, 8, 16, 22, 23). Teleport rewards (idx 41, 45, 114) are also cheap early utility [C35]. Do Heyo! / Wassup Yo! on a busy server (idx 54 gives 5 Tab 1 points) [C20][C25].
- **W1 mid/late:** Grandfrogger difficulties 1-4 (idx 58-62: +15% total damage, +4 Class EXP points via 61), Nutty Crafter (37), Two-Time Savior (44, needs two trophies), Steam level/character-count gem entries.
- **W2 early/mid:** Golden Obolden (99), S-M-R-T (108) once Smarty Boi can reach 50, Ink Blot (104), Buzz Buzz (78, +3 Tab 2), Two Desserts (109), Vial Noob/Connoisseur then Vial Junkee (112), Snakenhotep 1-3 (+10% damage), Wazzzzam / Just Passing By (+8% multikill), Dungeon Slap (124).
- **W3:** Checkout Takeout (145, best value: +5 book levels, +30% library charge), Cog set (153, 163), Saharan Skull (158), I Constructed! / Entangled Compounds (170, 166: +15 Tab 3), Glaciaxus 1-3 (+10% damage), Capitalist Win (188, +5% Class EXP), Equinox Visitor (189, 1/1000 drop, +4% damage and unlocks Equinox Valley) [C26][C36].
- **W4 outline:** Cabbage Patch then Le Pretzel Bleu (224, 225), Plate achievements (231-233), Bottle Capital (212, +10 Star pts), I LOVE These Mobs (219), Hunned Times a Day (230, +8 Tab 2), the three 1M kill trio (239-241, +37 Tab 4), Zero G Scorin' (235), Veritable Master (242).
- **Steam-only gem entries:** biggest single gem rewards: Hibernating Gamer 100 (idx 236), Milky Wayfarer 50 (210), Mobless 50 (223), Meet the Dev 40 (53), Mutant Massacrer 30 (237). Sort by effort, then pick up on Steam [C9].
- **Tier-4 note:** no community priority list could be fetched this run (search budget exhausted); treat the ordering above as derived, not consensus (confidence L for ordering, H for reward values).

## Sources

All verified 2026-10-19.

Each claim: text | source | tier. Verified 2026-10-19. Pre-patch flag: tier-3 wiki claims dated 2025-04-01 or earlier are pre-patch relative to 2.3.540.

- [C1] 420 slots; real counts per 70-slot block W1-W6 are 63/55/50/33/32/35; the rest are FILLERZZZ_ACH | packages/toolbox-parsers/vendor/data/website-data/achievements.json (counted 2026-10-19) | tier 1
- [C2] Achievements apply as soon as complete; nothing to claim | prior: N.js _customBlock_Reg_ach_add_status @7782263 (v1.23, 2026-10-17); P/achievements.ts | tier 1
- [C3] **Disputed.** Claim: wiki says the page is always available. Source lens: page fetched (edited 2026-10-03), no 'always available' statement found. Game-data lens: unverifiable (not game data). Correction: unverified | https://idleon.wiki/wiki/Achievements (edited 2026-10-03) | tier 3
- [C4] Completion is account-wide: completed = AchieveReg[i] === -1 | packages/toolbox-parsers/vendor/parsers/achievements.ts#L22-L30 | tier 1
- [C5] Reward kinds: gems/candy (Steam), % bonuses, Arcade %, talent points, RNG item unlock, title BG, EZ-Access, teleport, hat recipe | packages/toolbox-parsers/vendor/data/website-data/achievements.json rewards field | tier 1
- [C6] Achievements count toward world Achievement task and the Tome | packages/toolbox-parsers/vendor/parsers/world-4/tome.ts#L294; data/website-data/tasks.json | tier 1
- [C7] Missing the Steam gem entries on non-Steam platforms is the main loss; detect via steamIndex entries not completed | prior: N.js _customBlock_steamachieve @7776650; achievements.json steamExclusive | tier 1
- [C8] Steam-exclusive entries: W1 26, W2 13, W3 15, W4 6, W5 0, W6 0; 60 steamIndex values, unique, 0-60 | packages/toolbox-parsers/vendor/data/website-data/achievements.json | tier 1
- [C9] Gem totals by gems field: W1 407, W2 264, W3 324, W4 290 = 1285; 31 entries drop Time Candy | packages/toolbox-parsers/vendor/data/website-data/achievements.json | tier 1
- [C10] Secret achievements per world: W1 8, W2 4, W3 1, W4 3, W5 4, W6 5 | packages/toolbox-parsers/vendor/data/website-data/achievements.json secretAchievement | tier 1
- [C11] No world has 70 real entries so the 70 tier is unreachable; max tier W1 8/5, W2 8/7, W3 8/6, W4 6/5 (Steam/non-Steam) | derived from achievements.json real counts vs tasks.json breakpoints; non-Steam column assumes Steam entries never complete off Steam (M) | tier 1
- [C12] Achievement entries feed damage, Class EXP, skill EXP, respawn, library, cooking, breeding, construction, printer, forge, gaming, talents | packages/toolbox-parsers/vendor/parsers/ (grep getAchievementStatus, 2026-10-19) | tier 1
- [C13] Hybernation needs one character AFK 168h (+3% balls); Crystal Champ needs 2000 crystal kills; 1M kill trio gives 37 Tab 4 points | achievements.json idx 80, 175, 239-241 | tier 1
- [C14] Exact-stack achievements fail silently if the stack is larger; wiki says use split stack | https://idleon.wiki/wiki/Achievements (edited 2026-10-03) | tier 3
- [C15] currentQuantity = SteamAchieve[steamIndex] for Steam-linked entries else AchieveReg[i], only when not completed and >=0 | packages/toolbox-parsers/vendor/parsers/achievements.ts#L22-L30 | tier 1
- [C16] Steam counter counts on all platforms but completion/drop requires isElectron(); completion adds +2 to linked AchieveReg | prior: N.js _customBlock_steamachieve @7776650 (v1.23); achievements.ts comment L24-L25 | tier 1
- [C17] Reward text and gems field disagree on 5 rows: Anothervil 30 vs 20, A Family of Me 20 vs 25, Large Fortune 25 vs 20, Milky Wayfarer and Mutant Massacrer 'Some Gems and Candy' vs 50 and 30 | achievements.json idx 55, 142, 161, 210, 237 (scripted compare) | tier 1
- [C18] getAchievementStatus returns 5 for idx 4,27,37,44,107,109,117; 10 for 108; 20 for 99,104,112; else 1; 0 if not done | packages/toolbox-parsers/vendor/parsers/achievements.ts#L30-L52 | tier 1
- [C19] calcTotalAchievements counts completed entries; Gaming uses the same count | packages/toolbox-parsers/vendor/parsers/achievements.ts#L55; world-5/gaming.ts#L352 | tier 1
- [C20] Arcade ball bonus: 24 entries totalling +47%; code grants 1% at idx 140 while text sits on 144 | packages/toolbox-parsers/vendor/data/website-data/shared-data.json#ballsBonuses; parsers/dungeons.ts#L93-L105 | tier 1
- [C21] Total damage achievements: 58/59/60/62=2/3/5/5, 119-121=2/3/5, 185-187=2/3/5, 189=4, 240=1; W5+ adds 280,297,303,364,354,375 | packages/toolbox-parsers/vendor/parsers/damage.ts#L386-L403 | tier 1
- [C22] Class EXP achievements: 57 +1, 61 +3, 124 +2, 188 +5, 357 +20, 286 +25 | packages/toolbox-parsers/vendor/parsers/character.ts#L2165-L2208 | tier 1
- [C23] Skill EXP/speed achievements (Choppin 4, Mining 27, Fishing 117, Catching 107/74/113 (113 data-only, 74 is catching power); efficiency 351/352 +10%; 370 Sneak; W5 283/284/294; W6 356/359/360) | packages/toolbox-parsers/vendor/parsers/character.ts#L609-L908, #L1677-L1716; efficiency.ts#L524; achievements.json | tier 1
- [C24] Respawn: idx 44 W1, 109 W2, 308 W5 mobs; 44 and 109 need two trophies (quantity 2) | packages/toolbox-parsers/vendor/parsers/character.ts#L1821-L1859; achievements.json | tier 1
- [C25] Talent point grants by tab per achievement (54:5, 216:6; 76:2, 78:3, 230:8; 166:5, 170:10, 219:8 in code but 10 in reward text, both recorded; 292/295/239:10, 240:15, 241:12; 212:10, 289/305:20) | packages/account-state/src/talent-points-formula.ts#L100; achievements.json rewards | tier 1
- [C26] Checkout Takeout: +5 book max level and +30% library charge rate | packages/toolbox-parsers/vendor/parsers/misc.ts#L328, #L396 | tier 1
- [C27] Cooking: idx 224 +10%, 225 +20% meal speed (Troll cap 100%); idx 233 divides meal level cost by 1.1 | packages/toolbox-parsers/vendor/parsers/world-4/cooking.ts#L765-L812, #L1047-L1053 | tier 1
- [C28] Breeding: idx 218 breedability 1.2x, idx 221 egg rarity 1.1x; 220 and 222 data-only | packages/toolbox-parsers/vendor/parsers/world-4/breeding.ts#L351, #L430 | tier 1
- [C29] Construction idx 153 min(5,5*status) build speed; printer idx 158 min(1,status) | packages/toolbox-parsers/vendor/parsers/character.ts#L3668, #L3019 | tier 1
- [C30] Vial Junkee idx 112 gives sigil speed (status 20); no Toolbox consumer found for idx 108 S-M-R-T | packages/toolbox-parsers/vendor/parsers/world-2/alchemy.ts#L878-L907; grep of parsers 2026-10-19 | tier 1
- [C31] Forge idx 281 +50% ore capacity; golden food idx 37 status 5; Golden Obolden 99 and Ink Blot 104 are data-only | packages/toolbox-parsers/vendor/parsers/world-1/forge.ts#L54,#L173; misc.ts#L931 | tier 1
- [C32] Dungeon-linked achievements idx 57-62, 119-124, 184-188; multikill 122/123/148; crit 184 | packages/toolbox-parsers/vendor/parsers/damage.ts#L1216, #L1626-L1640; achievements.json | tier 1
- [C33] Exact-stack entries: W1 9, W2 7, W3 6, W4 3 | packages/toolbox-parsers/vendor/data/website-data/achievements.json (desc contains 'exactly' and 'Storage') | tier 1
- [C34] RNG-item unlock entries: W1 11, W2 10, W3 6, W4 5 | packages/toolbox-parsers/vendor/data/website-data/achievements.json rewards | tier 1
- [C35] Title BGs 5/4/5/3, EZ-Access 2/2/2/1, teleports (idx 41, 45 and 114: Forest Villa, Deep Mining, Djonnuttown) and hat recipes (idx 56, 110, 179) | packages/toolbox-parsers/vendor/data/website-data/achievements.json rewards | tier 1
- [C36] Equinox Visitor idx 189: Equinox Mirror 1/1000 Bloodbone drop, +4% total damage, opens Equinox Valley | achievements.json idx 189; damage.ts#L393 | tier 1
- [C37] Secret achievements with real rewards (46,47,49,115,116 Arcade; 117 Fishing EXP; 118 W2 boss key; 216 Tab 1 pts; 242 Void pt) | achievements.json | tier 1
- [C38] Achievement tasks per world: Hunter/Cowboy/Inuit/Astronaut/Promethean/Theist/Diver; W1 breakpoints 10-70 (9), others 5-70 (10) | packages/toolbox-parsers/vendor/data/website-data/tasks.json | tier 1
- [C39] W5 and W6 achievement groups as listed (32 and 35 real, none Steam-gated) | packages/toolbox-parsers/vendor/data/website-data/achievements.json idx 280-419 | tier 1
- [C40] tasks.json has a seventh Achievement task (Diver, Shimmerfin) but achievements.json has 420 slots (6 worlds) | packages/toolbox-parsers/vendor/data/website-data/tasks.json, achievements.json | tier 1
- [C41] **Disputed (priorities half).** Steam v2.35 (2025-04-01) made 275 achievements unlockable on Steam, from 68 before (confirmed on Changelog/2025; pre-patch relative to 2.3.540: no, same era). The 'early priorities Another Me!/Classy!/Rookie Player' half was not found on the Achievements page and is dropped. Reconcile 275 vs the 60 steamIndex values in the data (see Goals table) | https://idleon.wiki/wiki/Achievements ; https://idleon.wiki/wiki/Changelog/2025 (verified 2026-10-19; claim date 2025-04-01) | tier 3
- [C42] Gaming Superbit 0 multiplier is Pow(1.03, completed count); idx 296 and 307 add 1.05x each to bit gain | packages/toolbox-parsers/vendor/parsers/world-5/gaming.ts#L256, #L291, #L350-L353 | tier 1
- [C43] Sailing chest slots from idx 287 and 290 | packages/toolbox-parsers/vendor/parsers/world-5/sailing.ts#L83 | tier 1
- [C44] Monster money bonus from idx 235 (5%), 350 (10%), 376 (20%) | packages/toolbox-parsers/vendor/parsers/character.ts#L2808-L2810 | tier 1
- [C45] Golden food idx 380/383 (+2%/+3%); crystal mob guarantee idx 285 (+4 daily); star talent level idx 291 (+1 all talents) | packages/toolbox-parsers/vendor/parsers/misc.ts#L261, #L938-L939; talents.ts#L365 | tier 1
- [C46] W6 achievement consumers: farming 355/363/365, summoning 373/379, sneaking 368 | packages/toolbox-parsers/vendor/parsers/world-6/farming.ts#L249,#L559,#L1269; summoning.ts#L300-L301; sneaking.ts#L544 | tier 1

## Confidence (per claim, added after verification)

H: C1, C4, C5, C6, C8, C9, C10, C12, C13, C15, C17, C18, C19, C20, C21, C22, C24, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35, C36, C37, C38, C39, C40, C42, C43, C44, C45, C46.
M: C2 (prior N.js not vendored), C7 (prior N.js), C11 (non-Steam column is an assumption), C14 (wiki 'use split stack' confirmed, wiki tier), C16 (N.js part unverifiable, comment confirms), C23 (113 data-only; corrected), C25 (idx 219 8 vs 10 mismatch, treat as L for that value).
L: C3 (Disputed, unverified), C41 priorities half (Disputed, dropped); C41 v2.35 half is M.
