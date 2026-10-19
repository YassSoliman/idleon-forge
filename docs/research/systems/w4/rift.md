# Rift (M26 dossier)

Verified 2026-10-19. Ground truth: Toolbox @6c37e3d (game 2.3.540) vendored in `packages/toolbox-parsers/vendor/` (TB below) and the game client `N.js` (the checked-out copy in the m26 work dir; offsets are character offsets, same as the 2026-10-17 prior research). Prior research: `origin/research/w4-systems:docs/research/systems/w4-systems/2026-10-17-rift-sigils-tome-bosses-elite.md` (re-verified here; corrections noted). Wiki pages carry rev dates. Reddit was unreachable (WebFetch blocked, search budget exhausted), so the community layer is thin and flagged. No ActiveOn Knowledge Base file, detector or view exists for Rift today (`account.rift` is only read as a damage input).

## Rift

- **What it is:** [C1, conf H] an account-wide ladder of 65 completable challenge levels on map 166 ("The Rift"). Each level is one monster + one task; every 5th completed level unlocks a permanent account bonus (12 bonuses, a 13th "Rift Guy" is a placeholder). **Disputed (numbering, one lens):** the wiki (tier 3, rev 2026-10-07) says 66 challenges and labels bonus levels 1-based (Lv6, Lv11 ... Lv61); code/data (tier 1) has `riftInfo` with 70 entries, real tasks idx 0-64 (65), bonuses at idx 5..60 = `Rift[0]` 5..60. Mapping: wiki Level = `Rift[0]` + 1; the wiki's 66th is the cap-adjacent entry. Tier 1 wins for ActiveOn (use `Rift[0]`). Map 166 id itself is unverified by the data lens (conf L for the id). Conf H on counts.
- **Unlocks:** [C2, conf H] finish the Rift Ripper quest "Entering The Rift..." in The Untraveled Octopath (map 161, W4): consumes 5 Lost Batteries, 878 Purple Mush Cap, 592 Wurm Tail; rewards 50 Phone Box, 10 Gem Envelope, 3 Cosmic Time Candy. [C3, conf M] Below Rift 10 the in-game text says "WELCOME_TO_RIFT" (UI only). No class or level gate on entry; the class gates are on individual tasks.
- **Scope:** [C4, conf H] account-wide. Raw `Rift = [level, taskProgress, usernames]`; `Rift[2]` is a comma list of character usernames that already counted toward a per-character task.
- **Inputs → outputs:** active play or AFK kills on the Rift map; output = the 12 bonuses (below) plus Tome points, a Breeding bubble and Sailing/Cards/Cooking gates.
- **Goals and Milestones:** the full 65-level table and the bonus thresholds are in "Mechanics catalogue" (M2, M3).
- **Feeds / fed by:** fed by elite classes (DK/ES/SB), character count (3/4/11-char tasks), AFK kill rate, Death Note skull points, damage. Feeds W3 Trapping, Star Signs, all skills + Printer, Death Note, Stamps, Sailing, Vials, Construction/Refinery/Shrines/Talent Library, Cards, Killroy, Sneaking, Cooking, Breeding, Tome.
- **Per-session actions:** read `account.rift.currentRift` and the current task id; classify as Active-task (500-in-5-min, tears, mega monster, respawn race, Orb/Wormhole/Flag, skull points, 11 chars) or AFK-task (200k/1M/5M AFK kills). AFK-task: put the best AFK fighter on map 166. Never put AFK characters on the Rift on an active-task level. Finished AFK quota = idle state, reassign.
- **AFK Setup implications:** [C5, conf H] the AFK Rift target is the special monster key `riftAll`; its respawn base is a fixed 45 s and it gets the Diabolical Set respawn bonus instead of the world-based formulas.
- **Min-max by stage:** see below.
- **Common mistakes:** AFK on an active-task level; no DK/ES/SB so stuck at Rift 7/8/15; ignoring Skill Mastery thresholds a few levels away; forgetting that levels 59/63 need 11 characters.
- **Save and Toolbox fields:** see catalogue; core `account.rift.{currentRift,currentProgress,chars,list}` from `parsers/world-4/rift.ts#L8-L21`.
- **Sources:** inline per claim.

## Mechanics catalogue

Numbering: M-codes are mechanics, C-codes claims. "Rift index r" means `Rift[0]` while working on that level; wiki "Level" = r+1.

### M1. Level counter and unlock predicate
- [C6, conf H] `riftBonus(b)` unlocked iff `Rift[0] >= 5*(b+1)` (N.js @10784771). TB mirrors it: `isRiftBonusUnlocked` finds an entry in `riftInfo` whose `riftBonus` name matches and whose array index `<= currentRift` (`rift.ts#L23-L27`). The bonus entries sit at `riftInfo` indices 5,10,...,60 (`shared-data.json#L36565+`). So finishing the 5th task (r=4) sets `Rift[0]=5` and unlocks bonus 0.
- [C7, conf H] Parser: `currentRift = parseInt(Rift[0]) || 0`, `currentProgress = Rift[1] ?? 0`, `chars = Rift[2]` (`rift.ts#L14-L19`). `riftInfo` has 70 entries; indices 0-64 are real tasks, 65-69 are "You cannot progress further" so the max reachable `Rift[0]` is 65 (cap; data from `shared-data.json` `riftInfo`).
- [C8, conf M] Task id per level = `CustomLists.RiftStuff[4][Rift[0] mod 100]`; quota = `RiftStuff[5][taskId]`; completed iff `Rift[1] >= quota` (N.js `RiftStuff("Task")`, `("RiftCompleted")`, list at @14340734).

### M2. Task types and quotas
[C9, conf M] Task ids and quotas (N.js `RiftStuff[0]`, `[5]` @14340734): 0 = 500 kills in 5 min; 1 = 200,000 AFK kills; 2 = 3 Rift Tear drops in 60 min; 3 = self-healing mega monster on 4 chars; 4 = defeat all mobs before respawn on 3 chars; 5 = lava skull on 2 chars (unused now, removed per prior research, wiki Changelog/2025 v2.41); 6 = Orb score 180 on a Divine Knight; 7 = Pirate Flag score 75 on a Siege Breaker; 8 = Wormhole score 60 on an Elemental Sorcerer; 9 = cap; 10 = 1,000,000 AFK kills; 11 = 5,000,000 AFK kills; 12 = 5,000 skull points; 13 = 1,000 skull points; 14 = any kill on 11 chars; 15 = 12 chars (unused).
[C10, conf L] Progress is written by `ActionBlock("RiftTaskProgress", mode, task, value)`: `add` adds; `total` keeps the max (score tasks); `reset` zeroes; `name` counts a character once via `Rift[2]` (N.js @7945757). Tear drops: when Task = 2, each kill drops quest item `Quest74` with chance `Drop_Rarity/4000` (N.js @4543154).

[C11, conf H] Per-level task list (r = `Rift[0]`; derived from `riftInfo` and cross-checked with `RiftStuff[4]`), compressed by task id:
- r0 T0, r1 T2, r2 T4, r3 T0, r4 T3 | r5 T13, r6 T3, r7 T6 (DK), r8 T8 (ES), r9 T1 | r10 T2, r11 T12, r12 T0, r13 T4, r14 T10 | r15 T7 (SB), r16 T12, r17 T6 (DK), r18 T3, r19 T10 | r20 T4, r21 T7 (SB), r22 T12, r23 T0, r24 T11 | r25 T2, r26 T8 (ES), r27 T3, r28 T6 (DK), r29 T11 | r30 T13, r31 T0, r32 T1, r33 T4, r34 T11 | r35 T7 (SB), r36 T2, r37 T3, r38 T11, r39 T11 | r40 T4, r41 T12, r42 T6 (DK), r43 T8 (ES), r44 T11 | r45 T10, r46 T3, r47 T2, r48-r58 T11 (eleven 5M-AFK levels; r49 T11 included) | r59 T14 (11 chars), r60 T0, r61 T12, r62 T3, r63 T14 (11 chars), r64 T7 (SB).
- Monsters per level use the `riftN` families; mob HP rule in M4. Per-level monster names are in `riftInfo[i].monsterName`.

### M3. The 12 bonuses (unlock rift index → Rift[0] needed)
[C12, conf H] Bonus table (`riftInfo[*].riftBonus/riftDescription`, `shared-data.json#L36565+`; effects verified in N.js/TB):
| Bonus | Needs `Rift[0]` ≥ | Rule |
|---|---|---|
| Trap Box Vacuum | 5 | W3 trapper drone auto-collects traps every 24 h into Storage if space; EXP to the trap owner |
| Infinite Stars | 10 | first `5 + ShinyBonusS(Infinite_Star_Signs)` catalog star signs act as equipped on every char, no negatives (N.js `enabledStarSigns` @10781746; TB `starSigns.ts#L33-L38` `getInfiniteStarsCount`) |
| Skill Mastery | 15 | M5 |
| Eclipse Skulls | 20 | Death Note mob past 1e9 kills (game: DeathNoteRank ≥ 15 summed over players) counts as rank 20; +5% multiplicative DMG per eclipse skull, worlds 0-5 only (`deathNote.ts#L65-L90`) |
| Stamp Mastery | 25 (code `Rift[0] >= 25`; wiki/in-game display "Rift 26") | daily-login chance of 1% per 100 total stamp levels to receive a Gilded Stamp (-95% cost on one stamp upgrade), stackable (N.js `gildedStampChance` = GenINFO[106]/1e4, gate 25 @10781884; description `riftInfo[25]`) |
| Eldritch Artifact | 30 | Sailing can roll the Eldritch tier once the Ancient form is found (`sailing.ts#L240`, see C20) |
| Vial Mastery | 35 (Toolbox `index <= currentRift`, i.e. `Rift[0] >= 35`; wiki/in-game display "Rift 36") | each Lv13 (Gold Crown) vial: ×1.02 to all vial bonuses; TB: `vialMastery = 2 * (#vials with level >= 13)` inside the vial-multiplier additive group (`alchemy.ts#L529-L545`, `MAX_VIAL_LEVEL=13` `alchemy.ts#L52`) |
| Construct Mastery | 40 | M6 |
| Ruby Cards | 45 | cards can reach Lv 6 (5 star): `maxStars = 4 + (Rift>=45) + spelunking 6-star` (`cards.ts#L54-L58`; N.js `5starCards`) |
| Killroy Prime | 50 | DMG ×`1 + floor((Σ KRbest over Death Note mobs)^0.4)/100`, all characters (`misc.ts#L1582-L1600`; N.js `KillroyDMG`); `KillroyXtra` = 1 at Rift ≥ 50 adds an extra Killroy UI row |
| Sneak Mastery | 55 | Ninja Castle can be restarted on higher Mastery difficulty (more Jade/Sneaking EXP, new Mastery tier); difficulty freely switchable (`riftInfo[55]`) |
| Cooking Mastery | 60 | MASTERY shelf in Meal Menu; TB gates it on the presence of save data `CookMaster[1]` (`cooking.ts#L350-L353`); game text calls it "unlocked at Rift 61" (wiki 1-based numbering); a stale TB comment also says "Rift 61" while the data index is 60. Prior research adds +5 max Ribbon rank (wiki Changelog/2026 v1.17) |
| Rift Guy | 65 | placeholder, no effect (`RiftStuff[1]`) |

### M4. Mob HP and respawn
[C13, conf L] Rift mob HP = `5e6 * (1.11 + 0.02*min(1,R/10) + 0.08*min(1,max(0,R-10)/20) + 0.18*min(1,max(0,R-20)/23))^R`, R = `Rift[0]` (N.js `RiftStuff("mobHP")` @10780337). Base respawn 45 s (`mobRespBase`). Mob family cycles by `Rift[0] mod 70` (`RiftStuff("Mob")`).
[C14, conf H] TB respawn for AFK target `riftAll`: `45 / (1 + (DiabolicalSet + schematic + shrine + chip + gear + obols + starsign + achievement#44 + merit)/100)` (`character.ts#L1797-L1850`).

### M5. Skill Mastery (Rift ≥ 15)
[C15, conf H] Per-skill rank from the account-wide total of that skill's level across all characters: `<150`=0, 150=1, 200=2, 300=3, 400=4, 500=5, 750=6, ≥1000=7 (TB `getSkillRank`, `misc.ts#L833-L836`; N.js `skillLvRanks` loops 24 skills over `Lv0[i+1]` @10784858). Tier k (0-6) is active iff `Rift[0] >= 15` and `rank > k` (`isMasteryBonusUnlocked`, `misc.ts#L842-L844`; N.js `RiftSkillBonus`).
[C16, conf M] Per-skill tiers (prior research table, re-verified against call sites): T0 (150) +25% that skill's EXP; T1 (200) skill-specific efficiency/capacity (e.g. +10% efficiency for mining/chopping/fishing/catching/trapping/worship, `efficiency.ts#L277,L410,L451,L535,L588`; Smithing +25% forge ore capacity `forge.ts#L56,L174`; Alchemy +5% all liquid cap `alchemy.ts#L179-L180`; Construction +15% shrine LV-up rate `shrines.ts#L78`; Cooking +10 eff `cooking.ts#L161`; Lab +10 eff `lab.ts#L435`; Sailing/Divinity/Gaming/Farming/Sneaking/Summoning have their own tier-1 effects, e.g. `sailing.ts#L462`, `gaming.ts#L220`, `farming.ts#L1241`, `summoning.ts#L508`); T2 (300) all that skill's cards become passive (owned, not equipped) for the card-skills (`misc.ts#L846-L850`; Cooking excepted, `character.ts#L1017`).
[C17, conf H] Cross-skill sums ("RiftSkillETC", N.js @10787058; TB `getSkillMasteryBonusByIndex`, `misc.ts#L862-L880`): the accumulator starts at 7 and loops over skill indices 0-17, adding per skill that meets the tier. idx0: +5 per skill at rank>2 (300), skipping skill indices 0,2,3,5,6,8 = total DMG % (`damage.ts#L347`); idx1: +10 per skill at rank>3 (400) = Smithing EXP term (`character.ts#L1681`); idx2: +5 per skill at rank>4 (500), skipping the same indices = efficiency (`efficiency.ts#L162`); idx3: +1 per skill at rank>5 (750) = Printer (`printer.ts#L102`); idx4: +25 per skill at rank>6 (1000) = all-skill EXP (`character.ts#L1682`). Verifier correction: the skip list (0,2,3,5,6,8) applies to both the DMG (+5 @300) and the efficiency (+5 @500) terms via a shared else-branch; the 18-long array excludes Spelunking. IMPORTANT: these are summed per qualifying skill, not a single flat bonus; the wiki phrases them as flat ("+10% all skill EXP"). The base 7 is in the game code itself (`skillLvRanksDN2=7`). Confidence M on how the wiki wording maps to the per-skill sum.
[C18, conf H] Spelunking (W7) own tier rewards (`gameTables.riftSpelunkingMasteryRewards`, `shared-data.json#L9965`): +25% EXP, +30% efficiency, all cards passive, +15 max stamina, +3 daily page reads, +10% stamina regen, ×1.5 amber (W7 extension; code `spelunking.ts#L149,L394,L602,L1051,L1096`).
[C19, conf L] Lab Skill Mastery: Rift Skill Mastery "700 total Lab LV" gives one free Jewel at the Jewel Spinner (game text, `shared-data.json#L16777`).

### M6. Construct Mastery (Rift ≥ 40)
[C20, conf H] `getConstructionMasteryBonus(account, index, total = towers.totalLevels)`, thresholds `[250,500,750,1000,1250,1500,2500]` (`construction.ts#L444-L486`): refinery speed `floor(total/10)`% with NO 250 gate in code (wiki states 250; N.js `ConstMasteryBonus` @7795518 agrees with code); DMG `2*floor((total-750)/10)`%; build speed `5*floor((total-1250)/10)`%; trapper drone +35 max LV at ≥500; Talent Library +100 max LV at ≥1000; all shrines +100 max LV at ≥1500; wizard towers +30 max LV at ≥2500. Applied via `getExtraMaxLevels` (`construction.ts#L490+`).

### M7. Cross-system hooks
[C21, conf H] Breeding "Petting the Rift" bubble (cauldron c19, Kazam; x1=15, x2=50 decay): "+% Shiny mob chance for every new Rift level you reach"; Toolbox multiplies by `currentRift` in the new-pet chance (`breeding.ts#L290-L299`; `cauldrons.json#L3727`).
[C22, conf H] Tome metric "Rift Levels Completed": x1=49, type 2 (linear `min(1, q/49)`), max 500 PTS, quantity = `rift.currentRift` (`shared-data.json#L47901`; `tome.ts#L254-L256,L337`). So full 500 Tome points at Rift ≥ 49.
[C23, conf H] Sailing Eldritch tier: TB reads `account?.rift?.[0]` (`sailing.ts#L205,L240,L266`), but `account.rift` is the object `{list,currentRift,...}`, so `[0]` is undefined and the Eldritch gate is likely always false in Toolbox. Treat as a probable Toolbox bug; the game rule is `Rift[0] >= 30`. Confidence M (not run on a save).
[C24, conf M] Companions: Rift Spooker (`cooking.ts#L361`), Rift Stalker (`research.ts#L751`), Rift Hivemind (`tesseract.ts#L580`) are pets/companions whose names reuse Rift monsters; they are Gem-shop/event companions, not Rift progression.
[C25, conf L] `RiftStuff("HoopsRewardType")` reads Hoops score GenINFO[99] (score ≥ 40 → type 6, N.js @10781048); it is a hoops-score lookup, not a Rift-progress value (earlier wording that it is "gated by Rift" was loose); minor, mark for the Minigames dossier.

### W5+ extensions (one line each)
- W5: Eldritch Artifact tier (Rift 30), Gaming/Sailing/Divinity tier-1 mastery effects, Tome points.
- W6: Sneak Mastery (Rift 55), Farming/Summoning/Sneaking skill mastery effects.
- W7: Spelunking skill mastery tiers (C18); Rift Stalker companion; Tome.
- The Rift caps at 65; more levels are promised in-game ("there will be more").

## Min-max by stage

Community-meta caveat: no Reddit access this run; the only community source is the undated "Idleon Incomplete Guide" sheet as quoted in the prior research (tier 4). Items below marked (T1) derive from code, (T4) from that sheet.

- **W1 early/mid/late:** [C26, conf M] Rift is not reachable (needs the W4 quest). Nothing to track except planning: skill levels earned now count toward Skill Mastery totals later (account-wide sum, `misc.ts#L833`). (T1)
- **W2 / W3:** [C27, conf L] same; builds toward 150/200/300 per skill. A W3 account at account level 379 already earns Tome points but `Rift` stays 0 (prior research). (T1/T2)
- **W4 early:** [C28, conf L] do Rift Ripper once Purple Mush Cap and Wurm Tail are farmed (C2). Levels 1-8 need no elite except r7 (DK) and r8 (ES): get Divine Knight and Elemental Sorcerer first; target Rift 10 (Infinite Stars) then 15 (Skill Mastery). Levels needing classes: DK r7,17,28,42; ES r8,26,43; SB r15,21,35,64 (C11). (T1 for gates, T4 for "elites first" ordering)
- **W4 mid:** [C29, conf L] after 15, get each skill past 150 then 200 (cheap on a 6-10 character account); 300 frees card slots for the six card skills. Prioritise skills by value: EXP tiers help whichever skills you level; DMG +5% per skill at 300. Do active tasks with the community-named classes: "500 mobs in X minutes" with DK/ES/Bubonic Conjuror and "Rift tears" with ES (T4, prior research).
- **W4 late:** [C30, conf L] push to 20 (Eclipse Skulls: only matters for mobs near 1e9 kills), 25 (Stamp Mastery; displayed as Rift 26 in game and on the wiki), then AFK-grind levels 24-34 with the best AFK fighter (Blood Berserker is the community's best AFK class, T4). Rift 35 (displayed Rift 36) Vial Mastery rewards maxed Gold Crown vials; Rift 40 Construct Mastery pays out as total building levels grow.
- **Post-W4 outline:** [C31, conf H] 45 Ruby Cards, 49 for full Tome points, 50 Killroy Prime (DMG), 55 Sneak Mastery, 60 Cooking Mastery needs 11 characters (levels 59/63 task 14) so it is unreachable with ≤10 characters (T1 via `RiftStuff[4]` ids + [5] quota 11).
- **Priority order by bonus value (proposed, T2 judgement):** [C32, conf L] Skill Mastery (15) > Infinite Stars (10) > Killroy Prime (50) > Construct Mastery (40) > Stamp Mastery (25) > Ruby Cards (45) > Vial Mastery (35) > rest. Flag: this ordering is the analyst's, no community source gives one.

## Per-class notes
- [C33, conf H] DK (class idx 12), SB (22), ES (34) verified in `classes` array (`shared-data.json#L4193`); score tasks are the only class gates. Orb/Pirate Flag/Wormhole scores are in-Rift minigame scores written with `total` mode, so they persist (best, not cumulative).

## Open questions
1. Does the per-skill summation in "RiftSkillETC" match the wiki's flat wording in play (e.g. is the in-game "+10% all skill EXP" really +10 per skill)? Needs a live-save diff.
2. Is the Sailing `rift?.[0]` bug live (Eldritch tier ignored)? Needs a save with Rift ≥ 30.
3. Wiki 250-total gate for Refinery Speed vs code no-gate.
4. Community priority order and class advice (Reddit/guide sheets) not collected.
5. What triggers `Rift[0]` increment (UI action vs auto) after RiftCompleted.
6. 11-character requirement vs. the 12th slot / Rift Guy task 15 (unused).

## Added mechanics (from verifier gaps, 2026-10-19)

- **M8. Wiki 19-skill table vs 18-skill array** [C34, conf H]: the wiki mastery table lists 19 skills; TB/N.js `RiftSkillETC` loops indices 0-17 (18 skills). The 19th is Spelunking (idx 18, W7), which has its own 7-tier table (`riftSpelunkingMasteryRewards`, see C18) and is outside the cross-skill sums. Only skills with level > 0 count toward rank. Source: `misc.ts#L817-L844`, `shared-data.json#L9965` (tier 1, 2026-10-19).
- **M9. Wiki vs code level numbering** [C35, conf H]: wiki Lv N = `Rift[0]` N-1 for bonus levels (wiki Lv6..61 vs data 5..60). Always store `Rift[0]`; display wiki numbers only as a label. Source: `shared-data.json` riftInfo idx, wiki Rift page rev 2026-10-07 (tier 3).
- **M10. Infinite Stars count** [C36, conf H]: count = 5 + Shiny pet bonus `Infinite_Star_Signs` (`getInfiniteStarsCount`, `starSigns.ts#L33-L38`), applied to the first N catalog signs in fixed catalog order, active once `Rift[0] >= 10`. Source: TB, tier 1.
- **M11. Ruby Cards detail** [C37, conf H]: `maxStars = round(4 + riftFiveStar + spelunkingSixStar)`, `riftFiveStar = currentRift >= 45 ? 1 : 0` (`cards.ts#L56-L59`); the 5-star eligible list is in `accountOptions[155]`.
- **M12. Killroy Prime scope** [C38, conf H]: sums `KRbest` only over Death Note mobs (summoning trial keys excluded), applies to all characters (`misc.ts#L1585-L1590`). The extra UI row flag `KillroyXtra`/`KillroyXtra2` is N.js-only (conf L; N.js absent in the data lens).
- **M13. Eclipse Skulls detail** [C39, conf H]: Death Note rank 20 above 1e9 kills; counted for worlds 0-5 only; TB damage bonus `5 x count` (`deathNote.ts#L65-L90`).
- **M14. Skill Mastery tier 2 and Cooking** [C40, conf H]: tier 2 makes all owned cards of that skill passive (`getSkillCardBonus`), except Cooking which stays equipped-only (`character.ts#L1017`).
- **M15. Tier-1 consumers** [C41, conf H]: worship talent 445 gating, Gaming, Sailing, Lab, Cooking efficiency +10, Construction shrine speed, Alchemy liquid cap, Smithing forge cap (call sites in C16).
- **M16. Unparsed bonuses** [C42, conf M]: Stamp Mastery (daily Gilded Stamp roll) and Trap Box Vacuum have no TB parser, only `riftDescription` text; ActiveOn can only show them as unlocked/locked from `Rift[0]`, not simulate them.
- **M17. Respawn extras** [C43, conf H]: Rift respawn also uses W1 merit idx 0 and achievement 44 plus the Diabolical Set (see C14). Tear drop item is `Quest74` (N.js @4543154, conf M; N.js not re-checked by the data lens).
- **M18. Cooking Mastery subsystem** [C44, conf M]: unlocked by bonus idx 60; separate state `CookMaster` (level/exp) parsed in `cooking.ts#L65-L75` (`getCookingMastery`). `riftDescription` is empty in data, so the effect text comes from the wiki / the +5 max Ribbon rank note (C12). Effect values not re-derived (open question).
- **M19. Sneak Mastery** [C45, conf L]: description `riftInfo[55]` says higher-difficulty Ninja Castle restarts give extra Jade/Sneaking EXP and a new mastery tier; 8 difficulty tiers per the verifier note, effect per tier not located in TB (unverified).

## Verification summary
No claim was refuted by both lenses. No claim was refuted by either lens as false; the single **Disputed** item is the C1 level-count/numbering (wiki 66, 1-based vs data 70 entries / 65 real). Unverifiable claims (N.js-only or undated tier-4) were downgraded to conf L.


## Resolution note: Rift numbering (contradictions-1)

- Both numberings are right. Code/Toolbox use 0-based `Rift[0]` and riftInfo index (Stamp Mastery 25, Vial Mastery 35, Ruby Cards 45, Trap Box 5 ...); the game UI draws `"WELCOME_TO_RIFT_"/"YOU'RE_IN_RIFT_"/"ENJOY_YOUR_STAY_IN_RIFT_" + (Rift[0]+1)` (N.js offset 8924838-8925100) and the wiki lists every bonus as `code + 1` (Trap Box 6, Infinite Stars 11, Skill Mastery 16, Eclipse 21, Stamp Mastery 26, Eldritch 31, Vial Mastery 36, Construct 41, Ruby 46, Killroy Prime 51, Sneak 56, Cooking 61; idleon.wiki/wiki/Rift fetched 2026-10-19). Gate = reaching that Rift (entering it), i.e. finishing the previous displayed Rift's task. Sources: N.js `gildedStampChance` gate `25 > Rift[0]` @10781884, `5starCards` `45 > Rift[0]` @10781444; Toolbox `world-4/rift.ts#L24-L28` (`index <= currentRift`). Confidence H (code), H (wiki offset consistent for all 13 bonuses).
