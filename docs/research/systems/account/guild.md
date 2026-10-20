# Guild dossier (M26)

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Paths: `TB` = `packages/toolbox-parsers/vendor/parsers`, `DATA` = `packages/toolbox-parsers/vendor/data/website-data/shared-data.json` (keys `guildBonuses`, `guildTasks`). "Prior" = `origin/research/account-wide:docs/research/systems/account-wide/companions-guild-family.md` (N.js offsets there were not re-opened this pass; flagged "prior"). Confidence H/M/L in brackets. Revised after two adversarial verdict sets (source lens, game-data lens); **Disputed** marks a claim refuted by exactly one lens.

## Guild

- **What it is:** A player guild of up to 210 accounts [C1]. Members earn Guild Points (GP) from a daily login grant plus daily and weekly tasks [C12][C13] (login grant and bribe values: confidence L, not in Toolbox code; wiki only). Confidence H for the 210 cap [C1]. The guild leader spends GP on 17 guild-wide bonuses that every member receives in full [C6][C30]. Members also get at least 2 Guild Giftboxes per week [C29] (confidence L: wiki only, Tips and Bestone parts unverified).
- **Unlocks:** Any account can join a guild at any level; making one needs a character at Lv 30 [C28] (confidence L: N.js string from prior research, not re-opened; tier is really prior-research, not tier 1). The Toolbox treats "no guild document" as locked (`unlocked:false`, all bonuses level 0) [C25].
- **Scope:** Account-wide. **Disputed [C4]** (game-data lens refuted, source lens did not). View A (original): bonus levels, GP and members live in the RTDB guild doc (`guildData`) and the save only carries task progress. View B (correction, confidence H, `guild.ts` getGuildTotalPoints): save `Guild[0]` is an 18-entry array of per-bonus levels used only for the guild level calculation; `Guild[1..]` are task rows `[taskIndex, claimed, progress]`; displayed bonus levels and `totalGp` use `guildData.stats[0]` and `guildData.points` from RTDB. The firebase types themselves were not opened (L for that part) [C10].
- **Inputs → outputs:**
  - GP in: login 10 (20 / 30 with two bribes) [C12]; daily tasks 10 GP each, weekly 30 GP each [C11]; the small-guild bonus multiplies GP [C13] (L, direction unresolved). Rough account income about 60 GP/day plus 120 GP/week [C32] (M, arithmetic from verified task table; login 10 GP is wiki-only; weekly row count not fully verified).
  - GP out: the leader levels bonuses; level n to n+1 costs `gpBaseCost + n*gpIncrease` [C8] (H), gated by a prerequisite bonus at a minimum level [C7].
  - Guild level from `getGuildTotalPoints` (see M3: not identical to `totalGp`) [C2][C3] (H); level sets max members [C1].
  - Bonus effects (every member): see Mechanics catalogue [C14]-[C24].
- **Goals and Milestones:**

| Milestone | Why | Claim |
|---|---|---|
| Guild Lv 2 / 5 / 10 / 20 / 30 / 45 = 100 / 709 / 4,135 / 58,734 / 603,099 / 15,967,010 total GP | member cap 34 / 46 / 66 / 106 / 146 / 210 | [C2] |
| Guild Gifts Lv 2 | gate for Stat Runes, Gold Charm, Small-guild GP | [C7] |
| Gold Charm 4 then Star Dazzle 5 | gate for C2 Card Spotter, Craps | [C7] |
| C2 Card Spotter 8 then Bestone 5 | gate for Skilley Skillet | [C7] |
| Rucksack 5 | gate for Power of Pow and Multi Tool | [C7] |
| Bonus at Lv 10 | fraction of asymptote x1 is n/(n+x2) = 10/(10+x2): 1/6 for x2=50 bonuses, 9% Guild Gifts (x2=100), 1/3 Coin Supercharger (x2=20), 7.7% Skilley Skillet (x2=120). **Disputed [C5]**: original said 1/6 for all | [C5][C8] |

- **Feeds / fed by:** Feeds Talents (star points), Drop Rate, Carry Capacity, Skill Efficiency, Skill EXP, AFK gain rates, Construction build speed, Alchemy brew speed, weapon power, monster cash, Upgrade Stones (Bestone), Lab Jewels (Guild Gift item) [C14]-[C24][C29]. Fed by daily play: kills, boss kills, AFK claims, minigames, Colosseum, Post Office, Party Dungeon, cards, W1/W2 taskboard dailies [C11] (H) [C43] (L, unverified), and Bribes [C12] (L).
- **Per-session actions:** Claim every completed task in Codex > Guild (progress >= requirement and not yet claimed) [C10] (H) [C34] (L); the 3 fixed dailies cost little; the weekly "claim 5+ hour AFK gain" x35 and "defeat any boss" x20 should land through normal AFK rhythm [C11]. Capped state = all 5 dailies / 4 weeklies claimed.
- **AFK Setup implications:** "Defeat Monsters" (300) must be done actively; "Claim 5+ Hour AFK gain" rewards AFK Stretches of 5 h or more across all characters [C11].
- **Min-max by stage:** see the section below.
- **Common mistakes:** Not claiming (Toolbox discards the claimed flag in column 1 when parsing, so ActiveOn can only show "N of M met"; whether column 1 is truly a claimed flag is unverifiable from code, M) [C10]; leveling Bonus GP for small guilds past (members - 10) [C37] (L, depends on unresolved C13); leader sinking GP into Skilley Skillet or Coin Supercharger before cheap early bonuses [C38] (L, tier 4 opinion); discarding Guild Gifts needed for the Lab Jewel recipe [C29] (L).
- **Save and Toolbox fields:** Mechanics catalogue below.
- **Sources:** inline per claim, list at the end.

## Mechanics catalogue

Each entry: rule, caps, unlock, cost, field.

### M1. Guild membership and unlock state
- Rule: `getGuild(idleonData, guildData)` returns the locked default when `guildData` is null [C25]. Unlock = being in a guild. Join at any level; create at Lv 30 [C28].
- Field: `account.guild.unlocked`, `account.guild.id` (never read by ActiveOn). TB `guild.ts#L43-L88`.

### M2. Guild level and member cap
- Rule: level L needs total GP >= `100*(L-1)*1.21^(L-2)`; cap level 45; max members = 30 + 4*level, level capped at 45 (34 at Lv 2, 210 at Lv 45) [C1][C2] (H; values recomputed Lv2=100, Lv5=708.6, Lv10=4135.5, Lv20=58734, Lv30=603099, Lv45=15967010). The next-level threshold exposed as `levelReq` is `100*(n+1)*1.21^n` for current level n (H, `guild.ts`). The level input is `getGuildTotalPoints`, NOT `totalGp` (see M3).
- Field: `account.guild.level`, `.levelReq` (GP for next level), `.maxMembers`, `.totalGp`. TB `guild.ts#L58,L101-L119`.

### M3. Total GP accounting
- Rule: `totalGp = guildData.points + sum over bonuses of (n*base + inc*n*(n-1)/2)`; **the guild level is computed from `getGuildTotalPoints` = `guildData.points` + spend recomputed (Math.round closed-form cost) from the save's `Guild[0]` bonus levels, which can differ from `totalGp`** (which uses RTDB `stats[0]`) [C2][C3] (H, both lenses; the original text was imprecise).
- Field: `account.guild.totalGp`. TB `guild.ts#L70-L76,L90-L100,L152-L160`.

### M4. Guild bonus levels and value formula
- Rule: bonus level n from `guildData.stats[0][i]` (**Disputed [C4]**, see Scope; the save also carries levels in `Guild[0]`); value = `x1*n/(n+x2)` (func `decay`), asymptote x1 (not the value at max level), so half of x1 lands at n = x2. x2 is 50 for most bonuses, 100 Guild Gifts, 20 Coin Supercharger, 120 Skilley Skillet. **Disputed [C5]**: the "about 1/6 of cap at Lv 10" shorthand holds only for x2=50 [C5] (H). 18 entries, 17 live, Wait A Minute has maxLevel 0 (placeholder: bonus text `+{%_Nothing_Yet`, func add, x1=1, still gated by reqIndex 16) [C6] (H). Bonuses also carry map positions `xPos`/`yPos` usable for a tree layout (H, DATA).
- Field: `account.guild.guildBonuses[i].{level,x1,x2,func,maxLevel,reqIndex,reqLevel,gpBaseCost,gpIncrease}`; read through `getGuildBonusBonus(bonuses, i)` TB `guild.ts#L121-L125`.

### M5. Bonus catalogue (DATA `guildBonuses`; values computed from `x1*L/(L+x2)`; costs from [C8])

| i | Bonus | Effect | Max Lv | Prereq (idx, Lv) | Level cost | Value @10 / @25 / @max | GP to Lv10 / 25 / max | Toolbox consumer |
|---|---|---|---|---|---|---|---|---|
| 0 | Guild Gifts | +% chance of an extra weekly Guild Gift | 100 | none | 10+40n | 63.6% / 140% / 350% | 1,900 / 12,250 / 199,000 | none (not consumed) |
| 1 | Stat Runes | + all stats | 50 | 0, 2 | 20+60n | 6.7 / 13.3 / 20 | 2,900 / 18,500 / 74,500 | none |
| 2 | Rucksack | +% carry cap | 50 | 1, 4 | 20+70n | 11.7 / 23.3 / 35 | 3,350 / 21,500 / 86,750 | `misc.ts#L1154` |
| 3 | Power of Pow | + weapon power | 50 | 2, 5 | 20+80n | 1.7 / 3.3 / 5 | 3,800 / 24,500 / 99,000 | `damage.ts#L1127` |
| 4 | REM Fighting | +% fight AFK gain rate | 50 | 3, 8 | 30+90n | 1.7 / 3.3 / 5 | 4,350 / 27,750 / 111,750 | `character.ts#L3380` |
| 5 | Make or Break | +% town-skill production | 50 | 4, 10 | 30+100n | 5 / 10 / 15 | 4,800 / 30,750 / 124,000 | `character.ts#L3665`, `alchemy.ts#L716` |
| 6 | Multi Tool | +% total skill efficiency | 50 | 2, 5 | 20+80n | 5 / 10 / 15 | 3,800 / 24,500 / 99,000 | `efficiency.ts#L174` |
| 7 | Sleepy Skiller | +% skill AFK gain rate | 50 | 6, 8 | 30+90n | 1.7 / 3.3 / 5 | 4,350 / 27,750 / 111,750 | `character.ts#L3244` |
| 8 | Coin Supercharger | +% cash per world reached | 100 | 7, 5 | 30+120n | 6.7 / 11.1 / 16.7 | 5,700 / 36,750 / 597,000 | `character.ts#L2799,L2882` |
| 9 | Bonus GP for small guilds | +% GP if members <= threshold | 50 | 0, 2 | 10+10n | see [C13] | 550 / 3,250 / 12,750 | none (server-side GP) |
| 10 | Gold Charm | +% total drop rate | 50 | 0, 2 | 20+60n | 6.7 / 13.3 / 20 | 2,900 / 18,500 / 74,500 | `character.ts#L2394` |
| 11 | Star Dazzle | + star talent points | 50 | 10, 4 | 20+70n | 20 / 40 / 60 | 3,350 / 21,500 / 86,750 | `talents.ts#L578` |
| 12 | C2 Card Spotter | +% card drop rate | 50 | 11, 5 | 20+80n | 10 / 20 / 30 | 3,800 / 24,500 / 99,000 | none |
| 13 | Bestone | +% upgrade-stone success | 50 | 12, 8 | 30+90n | 2.7 / 5.3 / 8 | 4,350 / 27,750 / 111,750 | none |
| 14 | Skilley Skillet | +% EXP, all skills | 200 | 13, 5 | 40+150n | 2.3 / 5.2 / 18.8 | 7,150 / 46,000 / 2,993,000 | `character.ts#L1217` and 6 sibling sites |
| 15 | Craps | +% chance of an AFK reroll | 50 | 11, 5 | 20+80n | 4.7 / 9.3 / 14 | 3,800 / 24,500 / 99,000 | none |
| 16 | Anotha One | +% chance of 2x EXP on AFK claim | 50 | 15, 8 | 30+90n | 4.3 / 8.7 / 13 | 4,350 / 27,750 / 111,750 | none |
| 17 | Wait A Minute | nothing (max Lv 0) | 0 | 16, 5 | n/a | n/a | n/a | none |

Claims: [C5]-[C8], [C14]-[C24] (all H, game-data verified; the 'Toolbox consumer' column recomputed against grep of parsers). Unlock: leader pays GP once prereq level is met [C7]. All values apply to every member [C30].

### M6. Per-bonus consumer rules (how the game and Toolbox apply them)
- Skilley Skillet (14) is added into each skill's EXP-percent sum (7 skill EXP sites) [C17].
- Coin Supercharger (8) value is multiplied by `1 + floor(mapIndex/50)`, the world of the map the character is on [C15].
- Star Dazzle (11) uses `Math.floor(value)` in the star talent point sum [C16].
- Rucksack (2) feeds the all-caps carry multiplier `1 + (guild + telekinetic)/100` [C18].
- Gold Charm (10) in drop rate [C19]; Multi Tool (6) in efficiency [C20]; Sleepy Skiller (7) and REM Fighting (4) in AFK gain rates [C21]; Make or Break (5) in construction build speed and alchemy brew speed [C22]; Power of Pow (3) in weapon power [C23].
- Rucksack also feeds the carry-cap breakdown display line named 'Guild' (`misc.ts#L1172`, H).
- Not consumed by the Toolbox (7 of 17; indices 0,1,9,12,13,15,16): Guild Gifts, Stat Runes, Small-guild GP, C2 Card Spotter, Bestone, Craps, Anotha One [C24].

### M7. Daily GP login grant
- Rule: 10 GP on first login of the day; 20 with bribe "Guild VIP Fraud", 30 with "Guild GP Hack" (costs 400,000 and 2.5e9 coins) [C12]. Confidence L: wiki confirms the 10/20/30 GP, but login GP and bribe coin costs are not in the Toolbox parsers and could not be verified by either lens.
- Field: bribe state in `account.bribes[i].done` (index not re-verified here, open question Q3).

### M8. Daily tasks (5 per day, 10 GP each)
- Rule (H for table values, M for which pool entries rotate: rotation flags come from wiki and were not verified in data): 3 fixed (Defeat Monsters x300, W1 Daily Task x1, W2 Daily Task x1) + 2 rotating from the pool: Choppin minigame 20, Pick up item drops 300, Play W1 Colosseum 1, Play W2 Colosseum 1, Defeat a World Boss 1, Fishing minigame 4, Sign Post Office order 1, Catching minigame 11, Mining minigame 5, Play Party Dungeon 1 [C11].
- Save: `Guild[1..]` task rows `[taskIndex, claimedFlag, progress]` (first 5 daily, rest weekly; `slice(0,5)` / `slice(5)`); Toolbox maps `taskIndex` into DATA `guildTasks` and drops the claimed flag [C10].
- Field: `account.guild.guildTasks.daily[].{task,requirement,gp,progress}`. TB `guild.ts#L139-L150`.

### M9. Weekly tasks (4 per week, 30 GP each)
- Rule: 3 fixed (Defeat any Boss x20, Claim 5+ Hour AFK gain x35, Claim Guild Points x250) + 1 rotating (Collect Cards 25 / Defeat Crystal Mobs 5 / Defeat a Chaotic Boss 1 / Play Party Dungeons 4) [C11].
- Table notes (H, DATA `guildTasks`): idx 0-2 fixed daily (10 GP), 3-5 fixed weekly (30 GP), 6-15 daily pool of 10 (10 GP), 16-20 five daily `Filler` placeholders (req 15), 21-24 four rotating weekly (30 GP), 25 one weekly `Filler` (req 17). Fillers are placeholders and must not be shown as tasks.
- Field: `account.guild.guildTasks.weekly[]`. A task is met when `progress >= requirement` [C41] (L: ActiveOn files not opened by either lens).

### M10. Small-guild GP multiplier
- Rule: Bonus GP for small guilds: +`(100 - 200n/(n+50))`% GP if members <= `10 + n` [C13] (prior, N.js `contributeGP`; DATA gives x1=200, x2=50 and name "GP earned if guild has ] members or less"). Conflict: DATA decay on the bare formula gives 200n/(n+50), the opposite sign (33.3 at Lv 10); the prior's reading (high bonus at low level for tiny guilds, 0% by Lv 50) fits the cap-threshold behavior. Confidence L (neither lens could settle it; no parser consumes index 9; data entry x1=200, x2=50, text `+}%_GP_earned_if_your_guild_has_]_members_or_less`, max 50).
- Field: level in `account.guild.guildBonuses[9].level`.

### M11. Claiming and auto-claim
- Rule (confidence L: N.js only, unverified by both lenses): a completed task must be claimed in the Guild menu; claiming requires a guild (`OptionsListAccount[37]` non-empty); auto-claim when `OptionsListAccount[524] == 1`, origin unknown [C34].
- Field: not parsed by Toolbox (claimed flag dropped) [C10].

### M12. Wanted Bonus and members
- Rule: each member picks a Wanted Bonus (signal to the leader only, L: wiki, not directly rechecked) [C30]; Toolbox applies bonuses account-wide regardless of member. Member record `{a:name,d:level,e:gpEarned,f:wantedBonus,g:rank}` (H) [C31]; note `wantedBonus` resolves to the bonus object or -1, not a raw index. Rank (`g`) and per-member GP earned (`e`) are available for contribution tracking; rank-based permissions are unresearched (L).
- Field: `account.guild.members[].{name,level,gpEarned,wantedBonus,rank}`. ActiveOn reads only the member count (privacy) [C41].

### M13. Weekly Guild Giftboxes and Guild Gifts
- Rule: at least 2 Guild Giftboxes per week (L: wiki confirms, Tips/Bestone parts unverified) [C29]; Guild Gifts bonus adds chance of extra gifts: 700*n/(n+100) = 63.6 / 140 / 350 at Lv 10 / 25 / 100 (H) [C44]; the Guild Gift item is an ingredient in a Lab Jewel recipe (L). A weekly giftbox delivery plus extra-gift chance is a trackable item ActiveOn does not yet model.
- Field: Guild Gifts level `guildBonuses[0].level`; inventory counts elsewhere.

### M14. Guild GP weekly contest and achievements
- Rule: a tournament weekly challenge "Claim as much Guild GP this week as you can" exists [C26] (H, string confirmed); Steam achievements Guild Member (claim 500 GP) and Guild Higher-Up (contribute 3,000 GP) [C33] (L: N.js only, tier-1 label dubious).
- Field: `TB world-2/islands.ts#L33` list text only.

### W5+ extensions
- No W5+ guild bonuses or tasks exist in the 2.3.540 data (H): DATA has 18 bonuses and 26 task slots (25 indices plus idx 25 filler; 6 fillers total), none world-gated beyond Coin Supercharger's per-world multiplier [C6][C15]. Wait A Minute (max Lv 0) is a placeholder for a future bonus [C6]. Wiki notes a 7 Oct 2026 guild update with Guild Gifts max 100 (M; the '17 bonuses' count is data-verified, not wiki-verified) [C42].

## Min-max by stage

Tier of everything below is community or wiki except where cost math is derived from Toolbox data [C8]. Confidence L for the community/wiki advice items (unfetched or tier 4 opinion; [C36][C38][C39] unverifiable), H for cost-derived numbers. The leader controls spending; members' levers are choosing the guild and finishing tasks.

- **All stages, members:** pick an active guild with high Gold Charm, Star Dazzle, Multi Tool, Rucksack and Skilley Skillet already bought; expect a weekly GP minimum that takes minutes [C36][C38]. Active 30-member guilds earn about 16k GP/week vs about 1k solo [C39].
- **W1 early:** join any active guild (no level needed) [C28]; claim 3 fixed dailies and login grant; buy the 400,000-coin Guild VIP Fraud bribe when affordable (doubles login GP) [C12].
- **W1 mid/late (leader):** order 1) Guild Gifts to 2, 2) Gold Charm toward 10, 3) Star Dazzle (20 star points at Lv 10), 4) Stat Runes 4 then Rucksack [C38][C7].
- **W2 early/mid (leader):** Multi Tool (efficiency), C2 Card Spotter (cards), Make or Break once Alchemy matters [C38].
- **W2 late / W3 (leader):** Bestone, then Skilley Skillet (deep sink, 200 cap), Coin Supercharger as characters farm W3-W4 maps (scales with world) [C38][C15].
- **W3 late / W4:** keep at least 2 Guild Gifts for the Lab Jewel recipe [C29]; remaining value is Skilley Skillet and Coin Supercharger depth; bonus levels plateau [C38]; the 2.5e9-coin GP Hack bribe (30 login GP) is a long-term pick [C12].
- **Last / small:** REM Fighting, Sleepy Skiller, Craps, Anotha One, Power of Pow (all cap at 5-14%) [C38][C14].
- **Solo or guild <= 10 (L, depends on unresolved C13):** keep Bonus GP for small guilds at 0 except to grow the cap (members - 10); spread early levels to about 10 on cheap branches first, since Lv 10 gives about 1/6 of the cap for about 1/40 of max-out cost [C37][C5][C8] (Lv 10 is 1/6 of x1 only for x2=50 bonuses; see Disputed C5).
- **Priority check (derived, H):** cost-efficiency at Lv 10 favours Star Dazzle (20 points / 3,350 GP), Rucksack (11.7% / 3,350), Gold Charm (6.7% drop / 2,900); Skilley Skillet is the worst early (2.3% / 7,150) [C5][C8].

## Open questions

- Q1. Is the small-guild formula `100 - 200n/(n+50)` or plain decay (DATA x1=200, x2=50)? Needs `contributeGP` N.js re-read [C13].
- Q2. Do login-grant GP count toward "Claim Guild Points" x250? **Disputed [C35]**: wiki explicitly says daily sign-in GP does not count; prior code reading suggested yes; no Toolbox code settles it. Confidence L both ways.
- Q3. Which bribe indices are Guild VIP Fraud / GP Hack in `account.bribes`? Not re-verified.
- Q4. What sets `OptionsListAccount[524]` (auto-claim)? [C34]
- Q5. **Disputed [C40]** (source lens refuted, game-data lens did not). View A (original): wiki lists 9 rotating dailies and 8 weeklies. View B (source lens correction): wiki fetched 2026-10-19 lists 14 daily and 8 weekly tasks, so the original wiki counts mismatch unless the 14 includes the fixed ones (not stated). Data: 10 non-filler daily pool entries (idx 6-15) and 4 rotating weekly (21-24), plus 5 daily and 1 weekly Filler. Confidence L. Is the pool partitioned by slot?
- Q6. Community meta for guild priorities is thin (no tier-4 source fetched; web search budget exhausted this session); leader priority comes from prior research. Needs a Reddit/Steam pass [C38] (L).
- Q7. ActiveOn exposes only task met-counts; leader spend advisor and bonus view absent [C41] (L, unverified).
- Q8. Member ranks and guild permissions (who can spend GP, kick, etc.) are not researched; only the rank field is parsed (L).

## Sources

See per-claim sources in the claim list; verified 2026-10-19, game 2.3.540.
