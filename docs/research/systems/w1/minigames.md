# Dossier: Minigames (W1 to W4, plus the three idle clickers)

Topic id `minigames`. Verified 2026-10-19 against IdleOn Toolbox `6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1` (Toolbox 3.3.96, game version 2.3.540) read from the vendored tree under `packages/toolbox-parsers/vendor/`. Prior research (`research/account-wide:docs/research/systems/account-wide/minigames.md`, 2026-10-17) supplied the N.js (game client) offsets for formulas Toolbox does not carry (Hoops cost, cooldowns, Spiketrap, Colosseum chests, skill-minigame reward). Those N.js claims are tier 1 by ADR 0004 but were **carried, not re-read here** (the client was not re-downloaded); they are tagged "N.js v1.23" in their Source and the version gap (v1.23 vs 2.3.540 in `UPSTREAM`) is an open question. Wiki and community pages were fetched 2026-10-19. Confidence: H read in code or data, M inferred, L prose only or unverifiable here (every claim in the index carries one). Revised 2026-10-19 after two adversarial verifier passes (source lens and game-data lens): no claim was refuted by either lens, so none was removed or marked Disputed; one correction applied (C42); all N.js-only, wiki-only and community claims are held at confidence L; claims C75 to C90 added from the verifiers' missed-mechanics lists. Account State fields are written `OLA[n]` for `account.accountOptions[n]`.

## Minigames

- **What it is:** Three families. (1) **Skill minigames** (Choppin, Mining in W1; Fishing, Catching in W2) spend a shared daily play pool for resources plus highscore Milestones. (2) **Cooldown point shops** (Swishy Hoops, Throwy Darts, both W1): free, escalating cooldown, score = points, points buy permanent account bonuses. (3) **Idle clickers** (Orion W1, Poppy W2, Bubba from the W3 town): currency accrues offline, spent on permanent real-game bonuses with prestige resets (Megafeather, Megafish, Megaflesh). One-offs: Spiketrap Surprise (hourly, gems daily), Pen Pals (W3, free highscore bonuses), the four Colosseums (ticket-gated). W4 adds no new minigame beyond the Astro Colosseum. [C1] [C9]
- **Unlocks:** Skill minigames with the skill; Hoops/Darts with the W1 town-shop items or maps [C26]; Spiketrap via Vegetable Patch portal or chat phrase [C28]; Orion [C29] [C30]; Poppy via the W2 Secret Map [C40]; Bubba [C55]; Colosseums via tickets [C66]
- **Scope:** Account-wide throughout: plays pool, highscores, all point shops, all three clickers, Spiketrap flag. Only the skill-minigame reward multiplier is per character (star sign, prayer, talents). Colosseum runs are per character, tickets and highscores account-wide.
- **Inputs -> outputs:**
  - Skill minigames: plays -> resource + EXP, formula in the catalogue. [C2]
  - Hoops/Darts: time (cooldown) + skill -> points -> permanent bonuses [C22] [C23]
  - Clickers: offline seconds -> feathers/fish/meat -> upgrades -> prestige -> permanent multipliers on Class XP, damage, Drop Rate, AFK Gains, Cash, Build Rate, Critter/Soul gain.
- **Goals and Milestones:**

| Goal / Milestone | Threshold | Reward | Claim |
|---|---|---|---|
| Choppin score | 20 (Funguy), every 25 | Fur Shirt recipe; Mage talent +Total DMG per 25 | [C13] |
| Fishing score | up to talent cap | Barbarian +1 Fishing Power per point | [C14] |
| Hoops total levels | 12 / 80 / 200 | COIN / EXP / SKILL unlock | [C19] |
| Hoops game | 40 points | Baller trophy | [C24] |
| Darts total levels | 40 / 150 / 250 | TALENT / VAULT / SPEED unlock | [C20] |
| Darts game | 9 bullseyes in a row | Nine Dart Finish trophy | [C24] |
| Spiketrap best round | 3 (W1 task), 13 | 4 gems, 38 gems, Tome full credit | [C27] [C11] |
| Pen Pals | 25 ... 225 in steps of 25 | Trapping EXP, Eff, Shiny, Critter gain, Skill AFK | [C15] |
| Total Minigame Highscore | 450 | Tome row, 100 points | [C10] |
| Megafeathers / Megafish / Megaflesh | 10 (+12 Megafish) / 12 | W3 Equinox Dream; Tome 250 points each | [C54] [C12] |
| Colosseum scores | 25k / 200k / 2.5M / 10M | achievements incl. +5% Cash, W3 EZ-Access | [C64] |

- **Feeds / fed by:** Feeds: damage (Hoops/Darts DMG, Orion, Poppy, Bubba, Mage talent), coins, Class EXP, all-skill efficiency, Upgrade Vault cost (Darts VAULT), talent points (Darts TALENT), Drop Rate/AFK (Orion, Nine Dart Finish), Tome, Equinox, Construction/Trapping/Worship/Atom Collider (Bubba), Trapping (Pen Pals). Fed by: Gem Shop (plays), Star Signs (Miniature Game), Worship prayer (Antifun Spirit) [C8], Event Shop 24 (+50% Hoops/Darts points), Event Shop 52 (Fishmaxxing) [C49], Upgrade Vault (Orion 21, Poppy 45, Bubba 65), Meritocracy, and W5+ sources [C72]
- **Per-session actions:** Each Play Session: play Darts and Hoops when off cooldown (about 2 minutes each), spend all points, open Poppy to convert the bank, spend Orion/Poppy/Bubba currency, reset when the prestige is affordable, enter Spiketrap if the session crosses :00 and the daily flag is set. Skill-minigame plays are use-it-or-lose-it but low Leverage. Idle/capped states: unspent Hoops/Darts points, an off-cooldown game, `OLA[7]==1` at the top of the hour, pending Poppy fish, Colosseum tickets near the 3-day cap, an affordable Mega prestige.
- **AFK Setup implications:** None directly. Hoops/Darts items work from any map. Chasing a skill highscore needs a character with harvest chance above 5%. [C6]
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:** Unspent Darts/Hoops points (the W2 test account had 29 Darts and 7 Hoops points with 0 levels, per prior research); buying Daily Minigame Plays (900 gems) [C3]; Antifun Spirit "for minigames" [C8]; pushing Bonuses of Orion before multiplier Megafeathers [C53]; judging Poppy affordability from `OLA[267]` instead of fish plus bank [C44]; zero Megafish after several Fisheroo Resets (the W2 and W3 test accounts); stopping Pen Pals one step short (`OLA[99] % 25 >= 20`); trusting Toolbox's Hoops cost [C17]
- **Save and Toolbox fields:** [C69] Parsed: `account.highscores.{coloHighscores,minigameHighscores}`, `account.owl`, `account.kangaroo`, `account.bubba`, `account.currencies.minigamePlays`, `account.currencies.penPals`, `account.tome`. ActiveOn adapter today: [C70]
- **Sources:** all claims below; see the Sources list at the end.

## Mechanics catalogue

Format: mechanic - rule/formula - caps - unlock - cost - field.

### A. Skill minigames (Choppin, Mining, Fishing, Catching)
1. **Daily play pool** - [C2] Cap: 5 base, up to 21 with all 4 gem purchases. Cost per attempt [C4] Field `OLA[33]`; `GemItemsPurchased[72]`. Gem Shop item: [C3]
2. **Reward formula** - [C5] No cap except the EXP half-level cap. Unlock: skill usable, harvest chance > 5% for Choppin/Mining/Catching [C6] Field: none stored (computed at play).
3. **Reward multiplier** - [C7] Star sign Miniature Game costs 2 constellation points (wiki, L). Talents: [C13] [C14]
4. **Antifun Spirit** - [C8]
5. **Highscores** - one per game, account-wide: `FamilyValuesMap.MinigameHiscores[0..3]` (chopping, fishing, catching, mining). [C9] [C10]
6. **Game rules (wiki, L-M)** - Choppin: tap in the green (1) or yellow (2) zone, bounces speed it up. Mining: slam copper 1, platinum 2, starfire/yellow vein 3. Fishing: green 1, eel 2 (after 3 greens), squid 3 (3 more), whale 5 (7 more), whale resets the streak. Catching: hoops orange 1, green 2, gold 3, lava 10. Source: wiki Choppin, Mining, Fishing, Catching and Fishing_Minigame pages (2026-10-03/06 bot edits; prose undated, Stale-risk).
7. **One-time milestones** - Funguy Choppin 20; 15 yellow in a row (+5% Choppin EXP); yellow vein slam (+5% Mining EXP); Goldric Hoopsies (15 in a row or 90 total: 4 gems + 2 Tool Upgrade Stone III + 10k Catching EXP); Whattso fishing quest chain; golden/lava hoop achievements; Steam "beat the developer" scores 141 / 103 / 67 / 128 (25 gems each). Source: Toolbox `data/website-data/achievements.json`, `quests.json` (tier 1), prior research.

### B. Swishy Hoops
8. **Play** - 3 lives; Basketball item or the Valley of the Beans hoop. [C26]
9. **Cooldown and daily counters** - [C21] Fields `OLA[243]` gate, `[423]` cooldown s, `[424]` plays today.
10. **Points** - `OLA[418]`; Baller needs 40 in one game. [C24]
11. **Shop** - four upgrades, levels `OLA[419..422]`. [C19] No max level found. Toolbox: [C17] [C22]
12. **Derived path** - [C73]

### C. Throwy Darts
13. **Play** - [C25] Darts item or Winding Willows (W1, Baby Boa map).
14. **Cooldown** - same table as Hoops; fields `OLA[439]` cooldown, `[440]` plays, `[441]` gate. [C21]
15. **Shop** - levels `OLA[435..438]`, points `OLA[434]`, best `OLA[442]`. [C20] [C18] [C23]
16. **Derived path** - [C74]

### D. Spiketrap Surprise
17. **Daily gem round** - [C27] Cap 40 gems/day. Fields `OLA[7]` flag, `OLA[201]` best. The round is seeded by the hour number so the pattern is identical for everybody (M).

### E. Pen Pals (W3 Trapping)
18. **Highscore bonuses** - [C15] [C16] Free and unlimited; no play pool. Field `OLA[99]`; Toolbox `currencies.penPals`.

### F. Orion the Owl (W1 clicker)
19. **Unlock** - [C29] [C30]
20. **Upgrades** - [C31]
21. **Cost** - [C32]
22. **Feather rate** - [C33]
23. **Offline accrual** - [C38]
24. **Resets** - Feather Restart (x3 rate per restart, x5 with Pristine) and Great Mega Reset. [C37]
25. **Bonuses of Orion (permanent)** - [C34]
26. **Megafeathers** - [C35] Tome and Equinox links: [C54]
27. **Fields** - [C36]

### G. Poppy the Kangaroo Mouse (W2 clicker)
28. **Unlock** - [C40]
29. **Upgrades** - [C41]
30. **Cost** - [C42]
31. **Fish rate and bank** - [C43] [C44]
32. **Bonuses from Poppy (permanent)** - [C45]
33. **Fisheroo Reset spirals and shiny fishing** - [C48]
34. **Megafish** - [C46]
35. **Tar Pit** - [C47]

### H. Bubba the Chonky Seal (Codex clicker, W3 unlock)
36. **Unlock** - [C55]
37. **Upgrades and unlock curve** - [C56]
38. **Cost** - [C57]
39. **Meat rate** - [C58]
40. **Bubba Boon and Megaflesh (permanent)** - [C59]
41. **Sub-systems** - [C60] Cross-link: [C61]

### I. Colosseums (Dewdrop W1, Sandstone W2, Chillsnap W3, Astro W4)
42. **Chest thresholds** - [C63] Per-colosseum rows (A; B; C), from the prior research: Dewdrop 0/10k/320k; 10k/160k; 50k/200k/450k. Sandstone 0/25k/800k; 60k/960k; 125k/500k/1.125M. Chillsnap 0/50k/1.6M; 125k/2M; 300k/1.2M/2.7M. Astro 0/125k/4M; 325k/5.2M; 650k/2.6M/5.85M. (N.js v1.23, tier 1, carried.)
43. **Tickets** - [C66] Tickets cost 1/2/3/6 per run.
44. **Achievements and fields** - [C64] [C65]

### H2. Added in revision (verifier-listed gaps; claims C75 to C90)
49. **Minigame reward bonus on talents** - CHOPPIN_IT_UP_EZ (463) and BOBBIN_BOBBERS (116) both also grant +% Minigame Rewards, feeding MinigameMulti. [C75]
50. **Bubba prestige and realLV** - every Bubba bonus uses realLV = level + Bubba[2][i]. [C76]
51. **Bubba Happiness and daily petting** - [C77]
52. **Bubba Dice** - [C78]
53. **Bubba Smoker** - [C79]
54. **Bubba Spare Coins and Gifts** - [C80] [C81]
55. **Bubba Megaflesh details** - [C82]
56. **Poppy shiny bank and shiny rate** - [C83]
57. **Poppy Fishing Buddy, Tartar rate, fish per minute** - [C84] [C85] [C86]
58. **Orion Shiny Feathers and Restart multiplier** - [C87]
59. **Colosseum score storage** - [C88]
60. **Pen Pals tier gates** - [C89]
61. **Not yet researched (open gaps)** - Mining Cart / Catching trophies as separate items, the Pen Pals play loop itself (how plays are earned and scored), Post Office and delivery-box currencies (silver/gold pens), Spiketrap and skill-minigame trophies, and non-listed play-pool sources (Vault, achievements, class-level-5 step beyond C2). [C90]

### J. W5+ extensions (one line each)
45. POiNG highscore `account.gaming.poingHighscore` and the Gaming Log minigame (W5). [C72]
46. Molten (25 waves) and Whimsical (50 waves) Colosseums, highscore indices 4 and 5 (W5/W6). Same source.
47. Jelly Operator, Sushi Station, Minehead, Monuments (W7/W6 Hole) and Menagerie cheapener boosts 16/18/20 for the clickers. Same source.
48. Fountain, Gambit, Pet Arena, Meritocracy 12, Legend talent 26 and companion 51 multiply the clicker rates and bonuses (W4-W7). [C33]

## Min-max by stage

Most minigame systems have no formal community meta; where none exists the line is labelled "derived" (own arithmetic on the cited formula) and the confidence is stated.

**W1 early** (class level under about 40, no Megafeather yet)
- Buy the Basketball and Darts items; play each whenever off cooldown, spend cheapest levels first: Hoops DMG to 12 (12 points) opens COIN; Darts DMG to 40 (128 points) opens TALENT. [C73] [C74] (derived, M)
- Funguy Choppin score 20 and the Mining yellow-vein achievement; skip further skill plays. [C13]
- Unlock Orion at once and take the first Megafeathers in one or two active sittings. [C53] (L)
- Spiketrap daily if online at :00; round 3 for the W1 task. [C27]

**W1 mid / late**
- Hoops order: DMG and COIN (1 point per level to level 20), SKILL once 200 total levels are bought, EXP last (costs 3+). [C19] (derived, M)
- Darts order: DMG to 40, TALENT while levels cost under about 15 points, DMG to 150 total, then VAULT before SPEED. [C20] (derived, M; no published community order found)
- Orion: mega-reset as soon as it is available; do not spend on Bonuses of Orion before the multiplier Megafeathers; per run buy until the next point costs more waiting than you will tolerate. [C53] (L)
- Mage: push Choppin in steps of 25. [C13] Colosseum: Dewdrop 25k only. [C64]

**W2 early** (Poppy unlocked)
- Buy the Secret Map early. [C40] Open Poppy each session so the bank converts. [C44]
- Pre-first-reset order: bluefin upgrades unlocked, Fishy Discount, Fisheroo Investing; first reset at 12-17 reset points. [C51] [C52] (L, tier 4)
- Barbarian: Fishing highscore up to the BOBBIN BOBBERS cap. [C14] Catching: Hoopsies (90 total hoops is enough), Whattso quests.

**W2 mid / late**
- Reset spirals: shiny capped at 100, Tartar at 250, the rest 1:1:4 bluefin : cheaper : higher-reset-bonuses. [C50] (L; two independent community sources agree, no code verification)
- Greatest Catch is the open Goal on the test accounts (0 Megafish after several Fisheroo Resets). Push to 10-12 Megafish before W3. [C54]
- Sandstone Colosseum 200k. [C64]

**W3**
- Bubba unlocks on opening the W2 to W3 portal; buy Bubba Boon early for Build Rate, Critter and Soul gain, then Megaflesh like Orion. [C55] [C62] (L)
- Pen Pals: 125 (Critter gain) early, then 225. [C15] (derived order, M)
- 10 Megafeathers and 12 Megafish for the Equinox Dream. [C54] Poppy: do not mini-reset as eagerly as Orion (Reddit 1fv1vsg, L).
- Do not buy Daily Minigame Plays; skip Antifun Spirit unless time matters more than output. [C8] Chillsnap 2.5M for EZ-Access. [C64]

**W4**
- Clickers become passive: one visit a day, mega-reset when affordable, 12 of each Mega for the Tome (250 points each). [C12] Total Minigame Highscore 450 for 100 Tome points; spend headroom where cheapest. [C10]
- Astro Colosseum 10M (+5% Cash). [C64] Colosseum loot farming pays only with high Drop Rate (W5-W6). [C68]
- Bubba Atom cost (-3% per stack) matters from W4. [C59]

## Sprite needs

Existing grids in `apps/activeon/src/art/sprites/grids/systems.ts`: `sys-minigames`, `sys-owl`, `sys-colosseum`, `sys-poppy`, `sys-bubba`. Proposed new sprites if the module is built: `mg-darts`, `mg-hoops`, `mg-spiketrap`, `mg-penpals`, `mg-megafeather`, `mg-megafish`, `mg-megaflesh`, `mg-orion-feather`, `mg-poppy-bluefin`, `mg-poppy-tartar`, `mg-meat-slice`, `mg-baller-trophy`, `mg-nine-dart-trophy`. The task text asked for sprites "as needed"; this dossier is research-only, so they are listed, not drawn.

## Open questions

- Gaps flagged by verifiers and not yet researched with a Source: see [C90]. Pen Pals play loop, skill-minigame trophies, Post Office pens, other play-pool sources.
- Orion/Poppy/Bubba OLA indices 266 to 267 and 436, 438 (Darts TALENT/SPEED) are game-side only; Toolbox does not read them.
- Version gap: prior N.js offsets are v1.23 while the pinned Toolbox is tagged 2.3.540; Toolbox comments show Megafeather/Megafish thresholds changed in 2.3.540 (10th Megafeather = OLA[262]-9). Hoops/Darts costs, cooldowns and Spiketrap should be re-read from a 2.3.540 client.
- Orion unlock location: Valley of the Beans secret portal (N.js hint) vs Grand Owl Perch in Blunder Hills (wiki, existing KB fact).
- Hoops upgrade max levels and whether SKILL/TALENT have caps are unknown.
- Hoops/Darts: does Darts SPEED really exceed the movement-speed cap (low-value claim is M)?
- Poppy 1:1:4 ratio and the 24 h reset rule have no code or simulator verification.
- Whether Darts TALENT points count toward the tab-1 point total as read by the class talent code is untested.
- Spiketrap seed determinism (per-hour pattern) could support a precomputed guide but is unverified.
- Bubba Megaflesh reset contents and the Charisma target numbers are community-only.

## Sources

Tier 1: Toolbox @6c37e3d: `parsers/highScores.ts`, `world-1/owl.ts`, `world-2/kangaroo.ts`, `clickers/bubba.ts`, `world-3/traps.ts`, `world-4/tome.ts`, `damage.ts`, `efficiency.ts`, `character.ts`, `misc.ts`, `misc/upgradeVault.ts`; data `shared-data.json`, `gemShop.json`, `talents.json`, `achievements.json`, `randomList.json`. N.js v1.23 offsets via prior research (carried). Tier 2: idleon.wiki Minigames, Orion, Poppy pages (fetched 2026-10-19), Secrets, Baller, Nine_Dart_Finish, Basketball, Darts, Colosseum_Ticket. Tier 4: gameslikefinder Poppy guide (2026-08-15), Reddit threads cited per claim, Steam threads. No pre-patch claim is relied on without a flag; wiki Colosseum (2025-08-28) and Fishing_Minigame (2023) prose are Stale-risk.

## Claim index

- [C1] Skill-minigame plays are one account-wide pool in accountOptions[33]; Toolbox exposes it as currencies.minigamePlays. Source: packages/toolbox-parsers/vendor/parsers/misc.ts#L567. Tier 1. Verified 2026-10-19. Confidence H.
- [C2] Daily refill assigns OLA[33] = 5 + 4*GemItemsPurchased[72] (assign, not add; no banking). Earlier same-reset step writes max(OLA[33], 8+4g) (20+4g under class level 5); the later loop appears to overwrite it (M). Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) @15116058, @15092085. Tier 1. Verified 2026-10-19. Confidence L.
- [C3] Gem Shop item "Daily Minigame Plays" (globalIndex 72): +4 plays/day per purchase, max 4 purchases, cost 150 gems + 50 per purchase (150+200+250+300 = 900 gems for +16). Source: packages/toolbox-parsers/vendor/data/website-data/gemShop.json (Pdaily1). Tier 1. Verified 2026-10-19. Confidence H.
- [C4] A skill-minigame attempt costs 1 + max(0, AntifunCurse-1) plays and only starts if OLA[33] > max(0, curse-1). Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) @3734235, @3735359. Tier 1. Verified 2026-10-19. Confidence L.
- [C5] Skill-minigame reward = k * min(harvestChance,1) * (1+MultiOre%) * 60/(SkillSpeed+0.4) * (1+(score/d)^p) * OreValue * MinigameMulti; EXP part capped at max(12, half the EXP to next level). (k,d,p): Choppin 2,30,0.8; Mining 7,22,0.5; Fishing 10,10,0.4; Catching 10,17,0.7. Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) @3941600, @3943128, @5730407, @5718024, @5724505. Tier 1. Verified 2026-10-19. Confidence L.
- [C6] Choppin, Mining and Catching pay nothing unless harvest chance at the node is above 5%; Fishing has no such gate. Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) @3943128, @5730407, @5718024. Tier 1. Verified 2026-10-19. Confidence L.
- [C7] MinigameMulti = 1 + (star sign "Miniature Game" 30% + Antifun Spirit bonus [+ talent 116 BOBBIN BOBBERS for Fishing])/100. Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) @4203946, @4221783, @4229207. Tier 1. Verified 2026-10-19. Confidence M.
- [C8] Antifun Spirit prayer: +700*(1+(L-1)/10)% minigame reward, curse 9*(1+(L-1)/10) plays per attempt; net 0.89x per play at L1, 0.84x at L10 (saves time, loses value). It needs Worship wave 41 (Acorn Assault). Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) @14533537; prayer constants in prior research (Toolbox world-3/prayers.ts#L47-L48 at 6827d3f). Tier 1. Verified 2026-10-19. Confidence M.
- [C9] Skill-minigame highscores live in FamilyValuesMap.MinigameHiscores (or FamValMinigameHiscores): Toolbox maps index 0 chopping, 1 fishing, 2 catching, 3 mining, then appends pen pals (OLA[99]), poing (account.gaming.poingHighscore), hoops (OLA[242]), darts (OLA[442]), spiketrap (OLA[201]) as account.highscores.minigameHighscores[]. Source: packages/toolbox-parsers/vendor/parsers/highScores.ts#L6-L58. Tier 1. Verified 2026-10-19. Confidence H.
- [C10] Tome "Total Minigame Highscore" quantity = sum of the first 5 minigameHighscores entries (chopping, fishing, catching, mining, pen pals); Tome row 75 needs 450 for its 100 points. Poing, hoops, darts and spiketrap are not in the sum. Source: packages/toolbox-parsers/vendor/parsers/highScores.ts#L79-L81; packages/toolbox-parsers/vendor/data/website-data/shared-data.json tomeData[75]. Tier 1. Verified 2026-10-19. Confidence H.
- [C11] Tome row 12 "Best Spiketrap Surprise round" reads OLA[201], full credit at round 13 (100 points). Source: packages/toolbox-parsers/vendor/parsers/world-4/tome.ts#L301; packages/toolbox-parsers/vendor/data/website-data/shared-data.json tomeData[12]. Tier 1. Verified 2026-10-19. Confidence H.
- [C12] Tome rows 85/86/108 give 250 points each for 12 Megafeathers (OLA[262]), 12 Megafish (OLA[279]) and 12 Megaflesh (Bubba[1][8]). Source: packages/toolbox-parsers/vendor/data/website-data/shared-data.json tomeData[85,86,108]; packages/toolbox-parsers/vendor/parsers/world-4/tome.ts#L386-L400. Tier 1. Verified 2026-10-19. Confidence H.
- [C13] Mage talent CHOPPIN_IT_UP_EZ (id 463) gives +x% Total Damage per 25 points of the Choppin highscore: bonus * floor(choppingScore/25). Source: packages/toolbox-parsers/vendor/parsers/damage.ts#L680-L683; packages/toolbox-parsers/vendor/data/website-data/talents.json. Tier 1. Verified 2026-10-19. Confidence H.
- [C14] Barbarian talent BOBBIN_BOBBERS (id 116) gives +1 Fishing Power per Fishing highscore point, capped by the talent value. Source: packages/toolbox-parsers/vendor/parsers/efficiency.ts#L443; packages/toolbox-parsers/vendor/data/website-data/talents.json. Tier 1. Verified 2026-10-19. Confidence H.
- [C15] Pen Pals tier n bonus applies once OLA[99] >= 25*(n+1); values come from randomList[59] = [5,5,15,5,1,15,5,1,1] mapped to Trapping EXP, Trap Eff, Shiny, Trapping EXP, Critter gain, Shiny, Trap Eff, Critter gain, Skill AFK across highscores 25..225. Source: packages/toolbox-parsers/vendor/parsers/character.ts#L3627-L3635; packages/toolbox-parsers/vendor/data/website-data/randomList.json[59]. Tier 1. Verified 2026-10-19. Confidence H.
- [C16] Pen Pals tier effects are read in trapping EXP (index 0,3), efficiency (1,6), trap shiny/open bonus (2,5) and AFK skill gain (8). Source: packages/toolbox-parsers/vendor/parsers/character.ts#L926-L927, #L3360; packages/toolbox-parsers/vendor/parsers/efficiency.ts#L597; packages/toolbox-parsers/vendor/parsers/world-3/traps.ts#L196. Tier 1. Verified 2026-10-19. Confidence M.
- [C17] Toolbox getHoopsData reads OLA[419..422] as levels, unlock thresholds [0,12,80,200], but prices Hoops with the Darts formula and marks upgrades "unlocked" when level > 0 (wrong: the game unlocks by total levels). Source: packages/toolbox-parsers/vendor/parsers/highScores.ts#L102-L119. Tier 1. Verified 2026-10-19. Confidence H.
- [C18] Toolbox getDartsData reads OLA[435..438], unlock thresholds [0,40,150,250], costs DMG/VAULT floor(2+L/12), TALENT floor(3+4L), SPEED floor(5+20L). Source: packages/toolbox-parsers/vendor/parsers/highScores.ts#L83-L100. Tier 1. Verified 2026-10-19. Confidence H.
- [C19] Game Hoops costs: DMG floor(1+L/20), COIN floor(1+L/20), EXP floor(3+L/8), SKILL floor(1+L/20); unlock by total levels 0/12/80/200. Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) HoopsUpgCost @10951556, @13114838. Tier 1. Verified 2026-10-19. Confidence L.
- [C20] Game Darts costs match Toolbox: DMG floor(2+L/12), TALENT floor(3+4L), VAULT floor(2+L/12), SPEED floor(5+20L); unlock by total levels 0/40/150/250. Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) DartsUpgCost @10951781, @13115458. Tier 1. Verified 2026-10-19. Confidence M.
- [C21] Hoops and Darts cooldown after the n-th play of the day: 90, 180, 300, 480, 720, then 900 s (index min(6, plays)); ticks offline; plays, cooldown and gate flag are zeroed at the daily reset. Points per play = score * (1 + 0.5*EventShopOwned[24]). Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) @9610662, @9597088, @9626243, @15097122, @9593229. Tier 1. Verified 2026-10-19. Confidence L.
- [C22] Hoops bonuses are read by: DMG OLA[419] (damage), COIN OLA[420] (coins), EXP OLA[421] (Class EXP), SKILL OLA[422] (all-skill efficiency). Source: packages/toolbox-parsers/vendor/parsers/damage.ts#L361; packages/toolbox-parsers/vendor/parsers/character.ts#L2844, #L2124; packages/toolbox-parsers/vendor/parsers/efficiency.ts#L161. Tier 1. Verified 2026-10-19. Confidence H.
- [C23] Darts bonuses: DMG OLA[435] (damage, damage.ts), VAULT OLA[437] makes every Upgrade Vault cost 1/(1+L/100); TALENT OLA[436] and SPEED OLA[438] are game-side only (not read by Toolbox). Source: packages/toolbox-parsers/vendor/parsers/damage.ts#L373; packages/toolbox-parsers/vendor/parsers/misc/upgradeVault.ts#L72, #L196. Tier 1. Verified 2026-10-19. Confidence M.
- [C24] Baller trophy (Hoops, 40 points in one game) gives +3 to every stat, 3% All Stats, 3% All AFK Gain; Nine Dart Finish (9 bullseyes in a row) gives Weapon Power 9, DEF 50, 9% Drop Rate multi, 9% AFK Gains multi. Source: https://idleon.wiki/wiki/Baller; https://idleon.wiki/wiki/Nine_Dart_Finish (bot data, 2026-10). Tier 2. Verified 2026-10-19. Confidence L.
- [C25] Darts: 3 lives; gray 1, tan 2, green 3, bullseye 5; every 3rd bullseye in a row +1 life +5 points, every 9th +2 lives +20 and the trophy; wind changes every 6th scoring hit. Source: https://idleon.wiki/wiki/Minigames (read 2026-10-19). Tier 2. Verified 2026-10-19. Confidence H.
- [C26] Hoops plays are free; while DMG level < 3 the first 5 points are free before misses cost lives. Item "Basketball" (W1 town shop / Promotheus "Three Right Answers") starts a game from anywhere; Darts item likewise (W1 town shop / Funguy "Mushroom Munchies"). Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) @9589241; https://idleon.wiki/wiki/Basketball; https://idleon.wiki/wiki/Darts. Tier 2. Verified 2026-10-19. Confidence L.
- [C27] Spiketrap Surprise: round begins at the top of every hour; gems = min(40, 2(r-1)+max(r-4,0)+max(r-8,0)) for best round r (r=3:4, 5:9, 10:26, 13:38, 15+:40); paid on exit only while daily flag OLA[7] is set; daily reset sets OLA[7]=1; best round OLA[201]. Wiki says 30-gem cap (contradicted by code). Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) @23176343-@23179907, @15120221, @15262694; wiki https://idleon.wiki/wiki/Secrets (2026-10-07, "up to 30 gems"). Tier 1. Verified 2026-10-19. Confidence L.
- [C28] Spiketrap is entered via the portal in Vegetable Patch (W1) or by typing "If u love me let me go" in chat. Source: https://idleon.wiki/wiki/Secrets (2026-10-07); https://idleon.wiki/wiki/Worlds. Tier 2. Verified 2026-10-19. Confidence L.
- [C29] Orion: game hint text says the secret portal is on the "Bored Beans" map (Valley of the Beans, W1); accrual needs Feather Generation level >= 1. Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) @11889346, @5026030. Tier 1. Verified 2026-10-19. Confidence L.
- [C30] Orion: wiki and the existing KB fact say reach the Grand Owl Perch map in Blunder Hills and follow the HOOT popups. DISAGREES with the N.js hint; both recorded, confidence M on location, H that it is a W1 secret. Source: https://idleon.wiki/wiki/Orion_the_Great_Horned_Owl%27s_Feather_Enterprise (read 2026-10-19); packages/knowledge/systems/systems.facts.yaml#L82. Tier 2. Verified 2026-10-19. Confidence L.
- [C31] Orion upgrades (owlData x1, x2, unlock progress x3): Feather Generation 5,1.1,100; Bonuses of Orion 350,25,1000; Feather Multiplier 500,1.11,2500; Feather Cheapener 3000,1.16,30000; Feather Restart 1e6,14,750000; Super Feather Production 2e6,1.12,1e7; Shiny Feathers 5e6,1.4,2.5e8; Super Feather Cheapener 5e7,1.27,5e9; Great Mega Reset 2.5e11,20,1e11. Source: packages/toolbox-parsers/vendor/data/website-data/shared-data.json owlData. Tier 1. Verified 2026-10-19. Confidence H.
- [C32] Orion cost: common = x1 * 1/(1+10*L257/100) * 1/(1+20*L261/100) * 1/(1+Mega2*L254/100) * Menagerie cheapener(16); upgrade 0 = common*L254*max(1.05, x2-0.025*Mega8)^L254, others common*x2^L. Level of upgrade i is OLA[254+i]; unlocked when progress OLA[263] > x3. Source: packages/toolbox-parsers/vendor/parsers/world-1/owl.ts#L37-L87. Tier 1. Verified 2026-10-19. Confidence H.
- [C33] Feather rate = (1+9*Mega0)(1+Fountain/100)(1+4*PetArena)(1+Vault21/100)(1+Meritocracy12/100)(1+Gambit8/100) * (L254 + 5*L259 + 2*Mega4*L257 + 4*Mega4*L261) * (1+5*L256/100) * (3+2*Mega6)^L258 * (1+L264*L260/100). Source: packages/toolbox-parsers/vendor/parsers/world-1/owl.ts#L95-L108. Tier 1. Verified 2026-10-19. Confidence H.
- [C34] Bonuses of Orion (level L = OLA[255]): six stats each get ceil((L-offset)/6) stacks of +5% Class XP, +10 Base DMG, +2% Total DMG, +4% Skill XP, +1% Drop Rate, +2 All Stats (offsets 0..5), times (1+MegaBonus)(1+Legend talent 26)(1+companion 51); MegaBonus = +100 per Megafeather 2,4,6,8, +100 for the 10th, +50 per Megafeather past the 10th. Source: packages/toolbox-parsers/vendor/parsers/world-1/owl.ts#L109-L144. Tier 1. Verified 2026-10-19. Confidence H.
- [C35] Megafeathers (OLA[262]): 1 Maple x10 feathers; 2 Amethyst bonuses x2; 3 Frostraven 1% cheaper per Feather Generation level; 4 Phoenix bonuses x3; 5 Obsidian cheapeners add +2/+4 feathers/s per level; 6 Evergreen x4; 7 Pristine restart x5 not x3; 8 Lavathian x5; 9 Midas Feather Generation cost grows 25% slower; 10th Fractal and beyond: bonuses x6, +0.5x each further. Pinned Toolbox counts the 10th as OLA[262]-9 (changed in 2.3.540). Source: packages/toolbox-parsers/vendor/parsers/world-1/owl.ts#L21-L31, #L146-L154, #L168-L172. Tier 1. Verified 2026-10-19. Confidence H.
- [C36] Orion save fields: OLA[253] feathers, [254..261] upgrade levels (254 gen, 255 Bonuses, 256 mult, 257 cheap, 258 restarts, 259 super prod, 260 shiny, 261 super cheap), [262] Megafeathers, [263] run progress, [264] shiny feathers; parsed to account.owl {upgrades,bonuses,feathers,progress,nextLvReq,megaFeathers,featherRate,restartMulti}. Source: packages/toolbox-parsers/vendor/parsers/world-1/owl.ts#L34-L166. Tier 1. Verified 2026-10-19. Confidence M.
- [C37] Restart zeroes OLA 253 (to 5), 254, 256, 257, 259, 260, 261, 263; Mega Reset also zeroes 258 and 264. Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) @12257587. Tier 1. Verified 2026-10-19. Confidence L.
- [C38] Orion accrues offline: OLA[253] += OwlFeatherRate * seconds away; no cap found (M). Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) @5026030. Tier 1. Verified 2026-10-19. Confidence L.
- [C39] Toolbox already alerts when a Feather Restart or Mega Reset is affordable (dashboard account alerts). Source: utility/dashboard/account.js#L402-L417 at 6827d3f (prior research; file not in vendored tree). Tier 2. Verified 2026-10-19. Confidence L.
- [C40] Poppy: buy the Secret Map at the bottom of the W2 town shop (Yum-Yum Grotto vendor), use it on the palm tree on the Crabcake map to reach The Oasis. Source: https://idleon.wiki/wiki/Poppy_the_Kangaroo_Mouse%27s_Fish_Pond (read 2026-10-19); https://gameslikefinder.com/article/idleon-poppy-guide/ (2026-08-15). Tier 2. Verified 2026-10-19. Confidence L.
- [C41] Poppy upgrades (poppyBonuses x1, x2, unlock progress x3): Tasty Fishbait 4,1.06,100; Quick Reeling 150,1.2,500; Shiny Lure 500,3.5,2500; Bonuses from Poppy 1e4,3,3e4; Fishy Discount 3e4,1.13,2.5e5; Juicy Worm 1.5e5,1.07,3e6; Fisheroo Reset 4e7,20,2.5e7; Fishing Buddy 1.2e9,7.5,6e8; Lightning Quickness 6e8,1.12,4e9; Fisheroo Investing 7.5e9,1.7,1.4e10; Multihook 2e10,1.12,8e10; Greatest Catch 1.5e12,15,4e11. Source: packages/toolbox-parsers/vendor/data/website-data/shared-data.json poppyBonuses. Tier 1. Verified 2026-10-19. Confidence H.
- [C42] Poppy cost = base(1+L268 for upgrade 0) * 1/(1+10*L272/100) * 1/(1+3*Fishmaxxing) * 1/(1+15*L300/100) * 1/(1+5*Mega10*L304/100) * 1/max(1,ResetBonus2) * Menagerie cheapener(18) * x1 * x2^L; level of upgrade i = OLA[268+i]; unlocked when progress OLA[280] > x3. **Corrected (game-data verifier):** upgrade 0 has an extra base factor (1+OLA[268]) and is always unlocked (i===0) regardless of OLA[280]; the Fishmaxxing factor is 1/(1+3*f) with f = Event Shop 52; the last upgrades share the mega counters (Fisheroo Reset level is OLA[274], Greatest Catch level is OLA[279], the Megafish count). Source: packages/toolbox-parsers/vendor/parsers/world-2/kangaroo.ts#L51-L79. Tier 1. Verified 2026-10-19. Confidence H.
- [C43] Fish per catch = (1+min(5,L275)) * max(1,1+0.5(L275-5)*Mega5) * ResetBonus0 * (1+Vault45/100)(1+PetArena)(1+Gambit)(1+Jelly20)(1+Fountain)(1+Meritocracy12/100)(1+4*Fishmaxxing) * (10*L268 + 100*L297 + 1000*L304 + 50*L273 + 200*L278) * ShinyMulti * (1+8*L299/100); catch interval 30/(1+5*L269/100) s. Source: packages/toolbox-parsers/vendor/parsers/world-2/kangaroo.ts#L84-L101. Tier 1. Verified 2026-10-19. Confidence H.
- [C44] Poppy catches bank offline into OLA[288] (bluefin), [289] (shiny), [305] (tartar) and convert to fish only when the Poppy menu is open; Toolbox exposes pendingFish and totalFish. Source: packages/toolbox-parsers/vendor/parsers/world-2/kangaroo.ts#L103-L121. Tier 1. Verified 2026-10-19. Confidence H.
- [C45] Bonuses from Poppy (level L = OLA[271]): ceil((L-offset)/7) stacks of +3% Fishing Eff, +3 DEF, +5% Fishing XP, +2% Accuracy, +2% Total DMG, +0.5% AFK Gains, +3% Cash, times (1+Legend 26)(1+Megafish bonus)(1+companion 51); Megafish bonus = +50 for Megafish 2,4,7,9, +50 for the 12th, +25 per Megafish past 12. Source: packages/toolbox-parsers/vendor/parsers/world-2/kangaroo.ts#L151-L183. Tier 1. Verified 2026-10-19. Confidence H.
- [C46] Megafish (OLA[279]; 12 listed): 1 Tar Pit first 3 upgrades; 2 bonuses x1.5; 3 two more reset spirals and +5 points per Fisheroo Reset; 4 x2; 5 next 3 Tar upgrades and Tartar x3; 6 Fishing Buddy +50% bluefin and shiny speed per level past 5; 7 x2.5; 8 final 2 Tar upgrades and Tartar x3; 9 x3; 10 Tasty Fishbait boosts shiny speed 1%/level; 11 King Worm makes upgrades 5% cheaper per level; 12 and beyond bonuses x(higher). Source: packages/toolbox-parsers/vendor/parsers/world-2/kangaroo.ts#L23-L36. Tier 1. Verified 2026-10-19. Confidence H.
- [C47] Tar Pit: tar upgrades unlocked = min(8, 3*Mega1 + 3*Mega5 + 2*Mega8); tar upgrades x1/x2/x6: Super Yummy Bait 1/1.15, Bonus Catching 1/1.1, Bluefin Frenzy 1/1.2, Fishy Reductions 4/1.15, Super Tarbait 2/1.15, Tarrific Resets 3/2, Mongo Multipliers 2/1.1, King Worm 5/1.2; levels OLA[297..304]; Tartar fish OLA[296]. Source: packages/toolbox-parsers/vendor/parsers/world-2/kangaroo.ts#L110-L140; packages/toolbox-parsers/vendor/data/website-data/shared-data.json poppyTarBonuses. Tier 1. Verified 2026-10-19. Confidence H.
- [C48] Fisheroo Reset spirals (OLA[291..295]): bluefin x(1+0.4n), shiny speed/luck x(1+0.3n), cheaper x(1+0.15n), other-reset-bonuses x(1+0.04n), Tartar x(1+0.2n); every spiral except the 4th also gets the 4th spiral bonus multiplier. Shiny multipliers OLA[281..286] use bases 30,50,100,150,250,500 with ln(amount). Fisheroo resets counted in OLA[274], Megafish OLA[279]. Source: packages/toolbox-parsers/vendor/parsers/world-2/kangaroo.ts#L142-L149, #L266-L300. Tier 1. Verified 2026-10-19. Confidence H.
- [C49] Toolbox alerts on Fisheroo Reset, Greatest Catch and shiny-progress thresholds; Event Shop 52 "Fishmaxxing" (seasonal) gives x5 fish and 75% cheaper upgrades. Source: packages/toolbox-parsers/vendor/parsers/world-2/kangaroo.ts#L49-L58; utility/dashboard/account.js#L671-L694 at 6827d3f (prior research). Tier 2. Verified 2026-10-19. Confidence M.
- [C50] Community Poppy allocation: shiny speed capped at 100, Tartar at 250, the rest 1:1:4 for bluefin : cheaper : higher-reset-bonuses; initial split 5 blue / 25 yellow / 5 green / 5 red / 25 black before the caps are reached; reset when buying Fisheroo Investing + Tarrific Resets takes over 24 h; Fisheroo Reset after a week otherwise. Source: https://gameslikefinder.com/article/idleon-poppy-guide/ (2026-08-15); Reddit https://www.reddit.com/r/idleon/comments/1j5yhp6/ (2025-03-07) and /1thql9o/ (2026-05-19) via prior research. Tier 4. Verified 2026-10-19. Confidence L.
- [C51] Community pre-first-reset Poppy order: unlock all bluefin upgrades, then Fishy Discount and Fisheroo Investing; with Tar Pit open max Bonus Catching (lvl 72) and Mongo Multipliers (lvl 80), then Super Tarbait and Tarrific Resets; collect all 6 shiny multipliers. Source: https://gameslikefinder.com/article/idleon-poppy-guide/ (2026-08-15, low-trust aggregator). Tier 4. Verified 2026-10-19. Confidence L.
- [C52] Wiki Poppy upgrade priority list: Tasty Fishbait, Quick Reeling, Fishy Discount, Fishing Buddy, Multihook; first reset suggested at 12-17 reset points; "upgrade until the next point takes longer than you are willing to wait, then reset". Source: https://idleon.wiki/wiki/Poppy_the_Kangaroo_Mouse%27s_Fish_Pond (read 2026-10-19); search-result snippet of Reddit https://reddit.birdcat.cafe/r/idleon/comments/1jtwjk0/how_often_do_i_do_a_reset (page 404 on fetch, undated). Tier 4. Verified 2026-10-19. Confidence L.
- [C53] Community Orion advice: mega-reset as soon as available; per run upgrade until the next point takes longer than you will wait; first Megafeathers in one or two active sittings; do not pour feathers into Bonuses of Orion before the multiplier Megafeathers; endgame rule: upgrade each until cost equals feathers/sec. Source: Reddit https://www.reddit.com/r/idleon/comments/1fv1vsg/ (2024-10-03), /1h3x0yk/ (2024-12-01), /1p0kuqz/ (2025-11-18), via prior research (not re-fetched). Tier 4. Verified 2026-10-19. Confidence L.
- [C54] 10 Megafeathers and 12 Megafish are needed for the W3 Equinox "Dream" challenge to unlock the next Equinox upgrade. Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) @14324253. Tier 1. Verified 2026-10-19. Confidence L.
- [C55] Bubba is gated by KillsLeft2Advance[50][0] <= 0 (the active character has opened the W2 town portal 0 to map 100, the W3 town); it appears in the Codex, no map. Source: packages/knowledge/systems/bubba.facts.yaml#L1-L16; packages/toolbox-parsers/vendor/data/website-data/shared-data.json mapPortalDestinations[50]. Tier 1. Verified 2026-10-19. Confidence M.
- [C56] Bubba has 28 upgrade types (bubbaUpgrades x1,x2,x3 per-level bonus,x4 max level); max level 999 except Fun Gifts 6, More Dice 6, More Sides 9. Upgrade i unlocks when lifetime meat Bubba[0][4] >= 50*(2.8+i/3.55)^(i-min(1,floor(i/4))). Source: packages/toolbox-parsers/vendor/data/website-data/shared-data.json bubbaUpgrades; packages/toolbox-parsers/vendor/parsers/clickers/bubba.ts#L25-L58. Tier 1. Verified 2026-10-19. Confidence H.
- [C57] Bubba cost = x1 * ((i+1)^2*L + (2.4+i/3.65)^i * x2^L) divided by (1+Minehead5/100)(1+bonus of upgrades 4, 18, 26)(1+Charisma1/100) and the Menagerie cheapener(20). Source: packages/toolbox-parsers/vendor/parsers/clickers/bubba.ts#L135-L160. Tier 1. Verified 2026-10-19. Confidence H.
- [C58] Meat slice rate = (upg0+upg7+upg23 bonus) * (1+% upgrades 2,11,19,24) * Happiness * Dice * SmokedMeat * Charisma0 * PetArena * Megaflesh1 * Gift passive * SpareCoins * Vault65 * Sushi39 * Jelly58 * Fountain. Source: packages/toolbox-parsers/vendor/parsers/clickers/bubba.ts#L186-L222. Tier 1. Verified 2026-10-19. Confidence H.
- [C59] Bubba Boon (upgrade 3, Bubba[1][3], never resets) cycles 7 account bonuses: +10% Build Rate, +5% Critter gain, +5% Soul gain, +15% Total DMG, +1% All Kills, +4% EXP multi, -3% Atom cost, each ceil((L-(ring-1))/7) stacks times (1+20*(Megaflesh 2,4,7,10,12 owned)/100)(1+companion 51); Megaflesh = Bubba[1][8]. Source: packages/toolbox-parsers/vendor/parsers/clickers/bubba.ts#L102-L130, #L303-L330; packages/toolbox-parsers/vendor/data/website-data/shared-data.json generalSpelunky[33,38]. Tier 1. Verified 2026-10-19. Confidence H.
- [C60] Bubba sub-systems: Happiness pats (Bubba[0][1],[0][5],[0][13]; refills hourly), Charisma chart (Bubba[3], trained attribute [0][6], emulsified [0][15]), gifts ([0][2],[0][3]), dice (Bubba[4]), smoker ([0][14] banked + [0][7] pending), spare coins ([0][9..12]); no mini resets, only Megaflesh. Source: packages/toolbox-parsers/vendor/parsers/clickers/bubba.ts#L60-L90, #L160-L260. Tier 1. Verified 2026-10-19. Confidence M.
- [C61] Bubba "Crossover" (upgrade index 25) gives Meat Slice production per power of 10 of Poppy fish; Meat rate also reads lavaLog of OLA[267] (upgrade 24). Source: packages/toolbox-parsers/vendor/parsers/clickers/bubba.ts#L186-L196; packages/toolbox-parsers/vendor/data/website-data/shared-data.json bubbaUpgrades[24,25]. Tier 1. Verified 2026-10-19. Confidence M.
- [C62] Community Bubba Charisma targets per run: Rizz then Hustle to 120 for Megaflesh 1-6 (video guide, 2025-12-13); later runs 80/100/30/0/120/20 style splits (aggregator, 2026-05-27). Source: packages/knowledge/systems/bubba.facts.yaml#L18-L35. Tier 4. Verified 2026-10-19. Confidence L.
- [C63] Colosseum chests: chest A for e=0..2 with score > A*e^5, chest B for e=0..1 with score > B*(e+1)^4, chest C (full clear) for b=0..2 with score > C*(b+1)^2; rows A,B,C per colosseum (Dewdrop 1 ticket, Sandstone 2, Chillsnap 3, Astro 6); waves per colosseum [15,15,15,15,25,50]. Source: N.js v1.23 offset (carried from prior research research/account-wide minigames.md, 2026-10-17; not re-read here) @5492440, @5512825, @14032574. Tier 1. Verified 2026-10-19. Confidence L.
- [C64] Colosseum achievements: Dewdrop 25k (RNG item unlock), Sandstone 200k (+2% Arcade balls/hr), Chillsnap 2.5M (W3 Colosseum and Shops EZ-Access), Astro 10M (+5% Cash). Source: packages/toolbox-parsers/vendor/data/website-data/achievements.json (#24, #103, #183, #235). Tier 1. Verified 2026-10-19. Confidence H.
- [C65] ColosseumHighscores: Toolbox drops raw index 0, then maps dewdrop, sandstone, chillsnap, astro, molten, whimsical. Source: packages/toolbox-parsers/vendor/parsers/highScores.ts#L6, #L61-L67. Tier 1. Verified 2026-10-19. Confidence H.
- [C66] Colosseum tickets: one per day per NPC (Typhoon W1, Centurion W2, Lonely Hunter W3), banking 3 days; Toolbox keeps day counters in currencies.ColosseumTickets; Astro (W4) tickets come from the Cosmic Carrier Post Office order. Source: packages/knowledge/systems/colosseum.yaml; packages/toolbox-parsers/vendor/parsers/misc.ts#L560 (currency read; earlier L568 was drift; NPC and 3-day-bank facts are not in the parser); https://idleon.wiki/wiki/Colosseum_Ticket. Tier 1. Verified 2026-10-19. Confidence M.
- [C67] Community: most players report Hoops highscores of 15-39, 40 (Baller) very hard; Darts "8 in a row" common. Source: https://www.reddit.com/r/idleon/comments/1pjhplf/ (2025-12-10) via prior research. Tier 4. Verified 2026-10-19. Confidence L.
- [C68] Community: farm Colosseums for gold food only at high Drop Rate, mostly W5-W6; in W1-W4 take only the achievement scores. Source: https://www.reddit.com/r/idleon/comments/1pc5rot/ (2025-12-02), /1pipwqc/ (2025-12-09) via prior research. Tier 4. Verified 2026-10-19. Confidence L.
- [C69] Account-option indices used by this system: 7 spiketrap daily flag, 33 plays, 99 pen pals, 201 spiketrap best, 242 hoops best, 243 hoops gate, 418 hoops points, 419-422 hoops levels, 423 hoops cooldown, 424 hoops plays, 434 darts points, 435-438 darts levels, 439 cooldown, 440 plays, 441 gate, 442 darts best, 253-264 Orion, 267-305 Poppy. Source: packages/toolbox-parsers/vendor/parsers/highScores.ts#L38-L55; prior research OLA table (N.js v1.23). Tier 1. Verified 2026-10-19. Confidence M.
- [C70] ActiveOn today: account.minigames holds plays, 4 skill highscores, Darts/Hoops {points, levels, nextCosts, cooldown, playsToday, bestScore} and Spiketrap {gemsAvailableToday, bestRound}; account.poppy holds only {unlocked, pendingFish}; Orion (account.owl) is parsed by Toolbox but read only as damage input; Bubba has its own page; Colosseum has only the ticket detector. Source: packages/account-state/src/unspent-types.ts#L60-L80, #L178-L180; packages/knowledge/systems/*.yaml. Tier 1. Verified 2026-10-19. Confidence M.
- [C71] Existing KB entry minigames.check.hoops-spend deliberately shows no Hoops price because the Toolbox Hoops cost is too low; this dossier supplies the game formula. Source: packages/knowledge/systems/minigames.yaml (hoops-spend notes). Tier 1. Verified 2026-10-19. Confidence M.
- [C72] W5+ extensions: Toolbox also parses POiNG (account.gaming.poingHighscore), Molten and Whimsical Colosseums (highscore indices 4,5), Jelly Operator, Sushi Station, Minehead and Monuments; Menagerie boosts 16/18/20 cheapen the first Orion/Poppy/Bubba upgrade; Legend talent 26, companion 51, Pet Arena, Gambit, Fountain and Meritocracy 12 feed the clickers. Source: packages/toolbox-parsers/vendor/parsers/highScores.ts#L40-L42; packages/toolbox-parsers/vendor/parsers/world-1/owl.ts#L4-L15; packages/toolbox-parsers/vendor/parsers/world-2/kangaroo.ts#L4-L17. Tier 1. Verified 2026-10-19. Confidence H.
- [C73] Derived: cheapest-first Hoops spend needs 12 points for 12 DMG levels (COIN unlocks), about 120 points for 80 total levels (40 DMG + 40 COIN, EXP unlocks), about 576 points for 200 total levels (SKILL unlocks); EXP costs 3+ so only becomes worth it late. Source: Derivation from claim hoops_cost (floor(1+L/20), floor(3+L/8)) computed 2026-10-19. Tier 1. Verified 2026-10-19. Confidence H.
- [C74] Derived: Darts DMG to 40 levels costs 128 points (TALENT unlocks); cheapest-first reaches 150 total levels (VAULT unlocks) at about 1,140 points, 250 total at about 1,710; TALENT level k costs 3+4(k-1), so only the first few levels are cheap. Source: Derivation from claim darts_cost computed 2026-10-19. Tier 1. Verified 2026-10-19. Confidence H.

- [C75] Talent 463 CHOPPIN_IT_UP_EZ and talent 116 BOBBIN_BOBBERS each also grant a "+% Minigame Rewards" line, which feeds the MinigameMulti term of C7; the dossier previously listed only their damage and Fishing Power effects. Source: packages/toolbox-parsers/vendor/data/website-data/talents.json (skillIndex 463, 116); packages/toolbox-parsers/vendor/parsers/damage.ts#L680-L683. Tier 1. Verified 2026-10-19. Confidence H (text) / L (exact reward formula, game-side).
- [C76] Bubba prestige: Bubba[2][i] is added to the level to give realLV = round(level + prestige); every Bubba bonus, cost and unlock uses realLV, not raw level (C56 to C59 should be read with realLV). Source: packages/toolbox-parsers/vendor/parsers/clickers/bubba.ts#L60-L61, #L174-L185. Tier 1. Verified 2026-10-19. Confidence H.
- [C77] Bubba Happiness bonus = 1 + 10*(log2(h) + 25*log(h) + h^0.75)/100 with h = Bubba[0][1]; daily petting count = ceil(log2(realLV1) + min(realLV1, 3)); daily pet happiness comes from upgrades 5 and 20, Charisma 2 and gift 1. Source: packages/toolbox-parsers/vendor/parsers/clickers/bubba.ts#L188-L192, #L311-L320, #L380-L381. Tier 1. Verified 2026-10-19. Confidence H (formula) / M (daily-source list).
- [C78] Bubba Dice: up to 8 dice at Bubba[4][i]; each non-zero die multiplies the running total (min 1) by min(v,6) + max(v-6,0)/2.5; Dice multiplier = 1 + total/100. Source: packages/toolbox-parsers/vendor/parsers/clickers/bubba.ts#L233-L243. Tier 1. Verified 2026-10-19. Confidence H.
- [C79] Bubba Smoker: Bubba[5][0..4] hold counts of smoked-meat tiers that multiply the meat rate; smoke-tier roll saturates at SMOKER_MAX_QUALITY_SECONDS = 0.89*7200/0.11 s; the Smoker unlocks at upgrade index 15; banked seconds are Bubba[0][14] plus pending Bubba[0][7]. Source: packages/toolbox-parsers/vendor/parsers/clickers/bubba.ts#L112 and the smoker helpers in the same file. Tier 1. Verified 2026-10-19. Confidence M (constant read; unlock index from verifier, not independently re-read).
- [C80] Bubba Spare Coins: Bubba[0][9..12] are four coin counts with weights 1, 5, 25, 100 that feed the spare-coin meat multiplier. Source: packages/toolbox-parsers/vendor/parsers/clickers/bubba.ts (spare coins helper). Tier 1. Verified 2026-10-19. Confidence M.
- [C81] Bubba Gifts: passive gift bonus is capped at 5x (giftValue * min(5, 1 + upgrade17/100)); two selected gifts live in Bubba[0][2] and Bubba[0][3]; the selected Charisma trait Bubba[0][15] counts triple. Source: packages/toolbox-parsers/vendor/parsers/clickers/bubba.ts#L225-L231. Tier 1. Verified 2026-10-19. Confidence H (cap) / M (slots).
- [C82] Bubba Megaflesh: Megaflesh 1 gives a meat multiplier of 1 + totalLevels/100 (per owned count); the 12th and further Megaflesh bonus is 2 + (M-12)/5; Megaflesh indices 1,3,6,9,11 (Megaflesh 2,4,7,10,12) add 20 each to the Bubba Boon bonus (C59). Source: packages/toolbox-parsers/vendor/parsers/clickers/bubba.ts#L55, #L72-L101, #L276-L283. Tier 1. Verified 2026-10-19. Confidence H.
- [C83] Poppy shiny bank: OLA[289] accrues against shinyReq = 7200/(1 + 4*OLA[276]/100); shiny rate derives from OLA[270] (Shiny Lure), Fisheroo reset bonus 1 and Megafish 10. Source: packages/toolbox-parsers/vendor/parsers/world-2/kangaroo.ts#L146-L148. Tier 1. Verified 2026-10-19. Confidence H.
- [C84] Poppy Fishing Buddy (OLA[275]) multiplies fish per catch by (1+min(5,L)), plus 0.5 per level past 5 once Megafish 6 is owned, which also boosts shiny rate. Source: packages/toolbox-parsers/vendor/parsers/world-2/kangaroo.ts#L84-L101. Tier 1. Verified 2026-10-19. Confidence H.
- [C85] Poppy Tartar fish interval = 1800 / (1 + 0.05*OLA[301]) / ResetBonus4 / Jelly 39 / Megafish 5 and 8 (each 1+2). Source: packages/toolbox-parsers/vendor/parsers/world-2/kangaroo.ts#L110-L120. Tier 1. Verified 2026-10-19. Confidence M.
- [C86] Poppy fish per minute = 60 / catchInterval * catch quantity; Toolbox exposes fish/minute and avgResetPoints (total reset points / total resets). Source: packages/toolbox-parsers/vendor/parsers/world-2/kangaroo.ts#L200-L244. Tier 1. Verified 2026-10-19. Confidence H.
- [C87] Orion Shiny Feathers: OLA[264] (shiny feathers) times upgrade 6 level OLA[260] adds (1 + shiny*L260/100) to the feather rate; Restart multiplier restartMulti = (3 + 2*Mega6)^(OLA[258] + 1) is computed and exposed. Source: packages/toolbox-parsers/vendor/parsers/world-1/owl.ts#L107, #L143, #L163. Tier 1. Verified 2026-10-19. Confidence H.
- [C88] Colosseum scores are stored in FamilyValuesMap.ColosseumHighscores (fallback FamValColosseumHighscores) with raw index 0 dropped (see C65). Source: packages/toolbox-parsers/vendor/parsers/highScores.ts#L30. Tier 1. Verified 2026-10-19. Confidence H.
- [C89] Pen Pals bonus tiers are gated by OLA[99] >= 25*(tier+1), nine tiers from 25 to 225; the tier value is randomList[59][tier] (see C15). Source: packages/toolbox-parsers/vendor/parsers/character.ts#L3627-L3635. Tier 1. Verified 2026-10-19. Confidence H.
- [C90] Not covered, flagged by both verifiers: Mining Cart and Catching minigame trophies and rewards as separate items; the Pen Pals minigame play loop (plays, scoring); Post Office and delivery-box currencies (silver/gold pens); Spiketrap and skill-minigame trophies/cosmetics beyond Baller and Nine Dart Finish; other daily-play sources (Vault, achievements, the class-level-5 step) beyond C2. Source: none yet (verifier gap list, 2026-10-19). Tier n/a. Confidence L; research outstanding.
