# Equinox (W3 Dreams): system dossier

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540) vendored in `packages/toolbox-parsers/vendor/`. Format: `docs/research/SYSTEM-DOSSIER.md`. Source tiers per ADR 0004: 1 = game data / Toolbox parser, 2 = Toolbox logic and dashboard, 3 = IdleOn wiki (idleon.wiki), 4 = public community guides. Prior N.js research counts as tier 4 unless re-confirmed in tier 1. Every claim carries a confidence in brackets, H/M/L; **Disputed** marks a claim one verification lens refuted, with both views. Revised 2026-10-19 after two adversarial verdict sets (source lens, game-data lens). Claim numbers [Cn] map to the claim list the verifiers used. Paths starting `packages/` are in the reference checkout; `TB` = `packages/toolbox-parsers/vendor/`.

**Research limits:** web search budget was exhausted and reddit.com was not fetchable, so community priority is carried from the earlier `priority-verification` research (which cites Reddit threads dated 2026-09-30 and 2026-10-14) and one AutoReview fetch; no new community source was opened. No Discord.

## Equinox

- **What it is:** an account-wide bar that fills with time. Each full bar buys one level of a Dream Upgrade; upgrades are unlocked and enlarged by completing "Dream cloud" challenges (77 in the data; wiki Nightmares section ranges agree). [C2] [C7] [C33] Confidence H (tier 1 data, tier 3 wiki).
- **Unlocks:** drop the Equinox Mirror (1 in 10 from Bloodbone; wiki tier 3, H), hold it to enter Equinox Valley (M). Real unlock signal for ActiveOn: Mirror owned or Dream[2] >= 1; Toolbox's own `unlocked` flag is a false positive (it is true whenever `Dream` and `WeeklyBoss` exist). [C1] [C31] Confidence H for the signal. **Disputed (map name):** this dossier said Bloodbone's map is "Hell Hath Frozen Over"; the wiki does not name the map and the repo's `systems.facts.yaml` says Frostbite Tundra. Both views kept, confidence L on the map; reconcile against game data before writing KB copy.
- **Scope:** account-wide (Dream array + WeeklyBoss `d_*` keys). Nothing is per-character. [C2] Confidence H.
- **Inputs to outputs:** time (and many multipliers) -> bar -> upgrade levels. Cloud challenges consume nothing; they are goals measured against other systems. [C4] [C5] Confidence H.
- **Goals and Milestones:** see "Upgrade unlock thresholds" and "Cloud catalogue" below. [H] Milestones: Equinox Dreams 1-5 (5 visible clouds); 1/2/3/4 "unlock" clouds open Resources / Shades / Liquidvestment / Matching Scims; bar-rate clouds 3 (+10%), 9 (+15%), 14 (+20%), 19 (+25%), 22 (+30%), 24 (+35%), 29 (+40%).
- **Feeds / fed by:** *fed by* time, Alchemy vial MARBLE_MOCHA (+5 per level), Arcade shop, Vote Ballot, Refinery, Dungeons, Killroy, Worship TD, Construction, Shrines, 3D Printer, Cooking, Gaming, Sneaking and many W5-W7 systems (cloud conditions). [H] *Feeds* damage (Matching Scims, Dreamer Damage star talent), Drop Rate (Faux Jewels, cloud 69), all talent levels (Symbols), Lab (Fuse, Liquidvestment), Cooking (Food Lust, cloud 33), Ballot (Voter Rights), Worship TD (Slow Roast Wiz), Killroy (Shades of K), Gaming (Metal Detector), Research (Nonstop Studies, clouds 71/72/76), Tome (completed cloud count), Class EXP (cloud 70). Further fill-rate sources found by verifiers and now in M2: Tome (Lore boss 8), Tesseract 37, Armory upgrade 76 (Farmer Joe), Legend Talent 35, Research G8, Companion 15, Cosmo, Event Shop, penguins. [C29] [C26] [C27] [C28] Confidence H (tier 1); C29 vial id 60 not individually inspected (M).
- **Per-session actions:** (1) if `Dream[0] >= requirement` and an unlocked upgrade is below max, spend (bar is clamped, so waiting wastes fill). (2) Look at the 5 visible clouds and flag any whose condition is met. (3) Before logging off, note time to full. **Capped state:** bar full. **Idle state:** all unlocked upgrades maxed, so only a new cloud helps. [C8] [C13] [C9] Confidence M: Toolbox does not clamp the charge in code, so the clamp (and "waiting wastes fill") is from N.js / wiki and unverified here; treat as L for exact overflow behaviour.
- **AFK Setup implications:** none; the Valley itself cannot be AFK'd, and the wiki says it "cannot be AFK'ed at" (tier 3, H). That standing in it pauses fill is the prior N.js read only, unverifiable in Toolbox (L). Do not park a character there. [C3]
- **Common mistakes:** not farming the Mirror; leaving a full bar; buying Food Lust / Laboratory Fuse / Shades of K early; not noticing only the first N uncompleted clouds in index order are visible, so one stuck cloud among the first five can block everything behind it. [C36] [C13] Confidence: the visibility rule H (tier 1); the "common mistakes" priority advice L (unverifiable community claim, tier 4, Reddit 2026-09-30 / 2026-10-14).
- **ActiveOn today:** no state, KB, detector or page; registry entry exists; `systems.facts.yaml` already has an Equinox unlock fact, and `v2-systems-moon` / `v2-time-moon` were found only in built dist, not in source (verify before relying on them). [C40] Confidence M.

## Mechanics catalogue

Up to end of W4. Field paths are Toolbox `account.equinox.*` unless stated; raw = idleon save keys `Dream` and `WeeklyBoss`.

### M1. The bar (charge)
- **Rule:** `Dream[0]` holds the current charge. Toolbox does not clamp it; the in-game clamp at the requirement is from N.js and unverified here. [C8] Confidence M (L for the clamp).
- **Requirement:** `(120 + 40n) x 1.02^n`, n = sum of all 14 upgrade levels (including Equinox Dreams). No rounding in Toolbox since 2.3.525; wiki still shows rounded values (163, 208, 255, ...). Both agree to within 1. [C7] Confidence H.
- **Cumulative cost:** 5 levels = 1,049; 10 = 3,356; 20 = 12,787; 30 = 30,791; 50 = 106,766; 81 (Dreams..Voter Rights, excluding Nonstop Studies' base 10) = 424,215; 91 (every base max of the 13 real upgrades, W1-W4) = about 617,332; 93 (adding Hmm...'s 2) = about 663,621. At 84/h: 12.5 h / 40 h / 152 h / 367 h / 1,271 h / 5,050 h (81) / about 7,349 h (91). At the 90/h bundle rate with no other boost: 11.7 h for the first five. **Disputed (C41):** the earlier text called 81 levels "all base maxes W1-W4"; the game-data lens showed that is only an intermediate point and the true all-base-max total is 91 levels. The 5/10/20/30/50 and 81-level figures themselves recompute correctly (the source lens recomputed all match). Confidence H on arithmetic.
- **Fields:** `currentCharge`, `chargeRequired`, `chargeRate`, `timeToFull` (epoch ms), `rawDream[0]`. [C9] Confidence H.
- **Unlock:** Mirror. **Caps:** requirement grows without bound; no level cap on total purchases other than upgrade max levels.

### M2. Fill rate
- **Rule:** `round(base x product)`, base 60/h or 90/h (bundle `bun_q`). [C4]
- **Multipliers (tier 1, `equinox.ts` L84-L155, H):** one additive group `(vial EqBar + cloudsBonus + Arcade + Emperor)/100`, multiplied by separate factors: Vote Ballot 32, Research G8 (node 86), Tome / Lore boss 8, Companion 15, Cosmo (majik t2 i5), Event Shop 3 (x0.5 per level), Legend Talent 35 (Obsolete No More), penguins `accountOptions[320]` (/10), Tesseract 37, Armory upgrade 76 (Farmer Joe), and five cloud multipliers (45: 1.03x, 49: 1.05x, 52: 1.06x, 59: 1.07x, 67: 1.07x) that are separate from the additive `cloudsBonus` list (clouds 3, 9, 14, 19, 22, 24, 29, 38, 40, 44, 46, 48, 51, 54, 56, 57, 60, 62, 63, 65, 68, 74 at +10 ... +250%). The `expression` string Toolbox exposes lists only a subset, so it is stale; the code is authoritative. Whether other sources exist beyond this list (the verifier cited shared-data entries near L6025 and L7494-7629, an "Equinox Maxim") is unconfirmed (L). The `breakdown` field gives Toolbox's labelled tree for UI. Early game (W3-W4) the live terms are: bundle, MARBLE_MOCHA vial, Arcade, Vote ballot, Event Shop, clouds 3/9/14/19/22/24/29, plus whatever Companion / Cosmo the account owns. [C5] [C6] [C42] Confidence H.
- **Arcade note:** the shared-data entry reads `+{% Equinox_Fill_Rate` with x1 = 0.75; the exact level scaling (linear vs. decay) was not read from the Arcade parser here, so the per-level value is M confidence. [C30]
- **Fields:** `chargeRate`, `breakdown`.

### M3. Dream Upgrades (14 slots)
- **Rule:** one level per full bar; level lives in `Dream[2 + index]`. Max level = base + cloud / summoning / superbit bonuses. [C10] [C11] [C15] [C16]
- **Fields:** `upgrades[{name, bonus, desc, lvl, maxLvl, unlocked}]`; use `getEquinoxBonus(upgrades, name)`.

| Idx | Upgrade | Effect per level | Base max | Needs completed unlock clouds | Max-level extras (cloud idx) | Consumer in Toolbox |
|---|---|---|---|---|---|---|
| 0 | Equinox Dreams | +1 visible cloud (max 5) | 5 | 0 | none | `equinox.ts` L67 |
| 1 | Equinox Resources | unlock a Valley resource (Marble, Willow, Fish, Particulate); own vial | 4 | 1 | none | vials |
| 2 | Shades of K | +1 Killroy end-of-run choice | 3 | 2 | none | Killroy |
| 3 | Liquidvestment | 9% of excess liquid into CAP/RATE | 4 | 3 | +3 (6), +4 (15) | Lab/Alchemy liquids |
| 4 | Matching Scims | +10% damage, own multiplier | 8 | 4 | +5 (12), +10 (18), +10 (34), +10 (39) | `damage.ts` L311/417 |
| 5 | Slow Roast Wiz | +1% tower dmg per second (after 10 s) | 5 | 5 | +6 (32) | Worship TD |
| 6 | Laboratory Fuse | +1 px Lab connection range | 10 | 6 | none | `lab.ts` L137 |
| 7 | Metal Detector | +1% nugget size per small nugget | 6 | 7 | winner bonus, superbit +10 | `gaming.ts` L445 (W5) |
| 8 | Faux Jewels | +5% Drop Rate, additive | 6 | 8 | +5 (21), +10 (26) | `character.ts` L2410 |
| 9 | Food Lust | Random Event boss kill: -20% Meal upgrade cost, stacks | 10 | 9 | +4 (25); cloud 33 makes it -42% per stack | `cooking.ts` L1047 |
| 10 | Equinox Symbols | +1 all talent levels | 5 | 10 | +4 (30) | `talents.ts` L369 |
| 11 | Voter Rights | +1% Ballot bonus multiplier | 15 | 11 | +15 (35) | `voteBallot.ts` L107 |
| 12 | Nonstop Studies | +3% Research EXP, own multiplier | 10 | 12 (the 12th unlock cloud, cloud 36, opens this) | +5/+5/+5/+5/+5/+5/+6/+6/+7/+8 (37,42,43,47,50,55,58,61,64,75) | `research.ts` L694 (W7) |
| 13 | Hmm... | none (bonus null; code forces 0) | 2 | 13 (unreachable: the unlock count maxes at 12) | none | none |

Individual consumer facts: [C19] [C20] [C21] [C22] [C23] [C24] [C25] [C18] [C43] [C44] [C35]; confidence H (tier 1, verified by both lenses; Equinox Fish vial not checked, M). Max-level extras per code: Liquidvestment index 3 uses only clouds 6 and 15; the Summoning winner bonus (`+{ Equinox Max LV`) applies to indices 4, 5, 7, 8, 9, 10, 11, 12 and the `Equinox_Unending` superbit (+10) to 4, 5, 7, 8, 9, 10, 11; Laboratory Fuse (6) gets neither. [C15] [C16] H.

**Disputed (C17), wiki max levels:** the wiki (tier 3) lists totals such as Liquidvestment 11, Matching Scims 43, Nonstop Studies 67, Voter Rights 55. The game-data lens reproduces Liquidvestment 11, Matching Scims 43, Faux Jewels 21 and Nonstop 67 from code with no superbit, but Slow Roast 21, Metal Detector 16, Food Lust 24 and Symbols 19 only with the +10 superbit, and Voter Rights 55 is not reproducible (code gives 30, or 40 with the superbit; the earlier note that 55 is computed is the source lens's view). Both views kept: wiki totals assume superbit and possibly winner bonus; confidence M for any wiki total, H for the code formula.

**Upgrade unlock thresholds (corrected C12, refuted by both lenses):** `UPGRADE_UNLOCK_CLOUDS` = clouds 0, 2, 5, 7, 10, 13, 17, 20, 23, 28, 31, 36 (12 entries), so the completed count `c` maxes at 12. Upgrade index k is unlocked when `k <= c`. Index 0 is always unlocked, any 4 completed unlock clouds unlock index 4 (Matching Scims), and the 12th unlock cloud (36, Research-G8-gated) opens index 12 (Nonstop Studies). Index 13 (Hmm...) can never unlock via this formula. Confidence H (tier 1, `equinox.ts` `UPGRADE_UNLOCK_CLOUDS`). AutoReview's phrase "New bonuses unlock in a set order, not tied to certain Dreams" is consistent (tier 4, M). [C37]

### M4. Clouds (challenges)
- **Rule:** 77 challenges (`equinoxChallenges`); progress in `WeeklyBoss.d_<i>`; complete = -1. Only the first `min(5, Dreams level)` incomplete ones, by index, are active; index >= 36 additionally needs Research grid node 86 (W7; the same node also adds its own fill multiplier). [C14] [C13] Confidence H. Per-cloud progress counters are stored in `WeeklyBoss.d_<i>`; the game's own progress source for each goal (e.g. kills in a run, refinery rank) lives in the owning system, and ActiveOn would need a detector per cloud (not mapped yet, L).
- **Fields:** `challenges[{label, goal, reward, current, active, locked}]`, `completedClouds` (note: counts every `d_` key equal to -1, including stray keys, H). [C39] The `idx >= 36` research gate is consistent with the data (verified; the "Nightmare" naming for those clouds is tier 3 wiki).
- **Reward classes:** (a) unlock next upgrade (12 clouds), (b) additive bar fill % (22 clouds), (c) bar fill multiplier x1.03-1.07 (5 clouds: 45, 49, 52, 59, 67), (d) +max level to an upgrade, (e) one-off system bonuses (trophy, star talent, Tick Tock cap, anvil recipe, TD starting points, Minehead, Sneaking, Exotic Market, Research grid, Ribbon, Drop Rate, Class EXP). [C6] [C26] Confidence H.
- **Dreamer Damage:** every completed cloud adds the star talent's value to damage; cloud 4 grants the talent. [C27] Confidence H. Other cross-system cloud rewards (41 Minehead, 53 Sneaking charms, 66 Exotic Market, 71-73 and 76 Research/Ribbon, 69 Drop Rate, 70 Class EXP) live in `EQUINOX_CLOUD`. H.

### M5. Valley resources and vials
- Equinox Resources levels 1-4 unlock Marble Ore, Willow Logs, Equinox Fish, Dream Particulate; each has its own Alchemy vial (no card). Vial 60 MARBLE_MOCHA (main item Marble) boosts bar fill. [C35] [C29] Confidence M (vials for Marble, Willow and Dream_Particulate exist; Equinox Fish not checked; the "unlocks a resource" wording is wiki-level, not read in code).
- Cloud 21 (Bobjoepickle vial to Lv 2) is a cheap +5 Faux Jewels max. H.
- Valley gathering and other Valley activities (Marble, Willow, Fish, Particulate collection, what each is used for) are not yet researched: L / open question.

### M6. Summoning, superbit and other max-level sources
- Summoning "Equinox Max LV" winner bonus applies to indices 4, 5, 7, 8, 9, 10, 11, 12; the `Equinox_Unending` superbit (+10) to 4, 5, 7, 8, 9, 10, 11 (not 12, not 3, not 6). Index 3 uses cloud-only extras. All W5+ (superbit Gaming, winner bonus Summoning). The earlier "3-11" range was wrong. [C15] Confidence H (tier 1).

### M7. Downstream flags (W5+ one-liners)
Gaming: Metal Detector, cloud 23 (15 chemical plants), palette clouds 49/57/70. Sneaking: clouds 34, 53, 75. Research / Spelunking: clouds 71, 72, 74, 76, G8 gate. Farming: stickers 52, 68. Summoning: Endless 47. Cavern clouds (Harp, Gambit, Dawg Den, Temple, Bolaia): 45, 46, 48, 50, 51. Clamworks W7: 38, 66. Minehead: 36, 41, 67. Sushi: 37, 64. Ribbons: 73. Exotic market: 66. All post-W4 and tracked only if the player is there. Confidence M (condition text is game data, H; world placement is my reading, L).

### M8. Other live state and missed mechanics (added in revision)
- **Food Lust stack counter:** `accountOptions[193]`, incremented by Random Event boss kills; the effective Food Lust level is `min(level, [193])` and Cooking reads it too (`cooking.ts` L1047-1055). H, tier 1.
- **Metal Detector nugget counter:** `accountOptions[192]`, nuggets since last upgrade, reset when a new best nugget is found (reset rule from N.js, L); read in `gaming.ts` L119. H for the read.
- **Liquidvestment** moves excess liquid into cauldron CAP/RATE (W2 Alchemy interplay), exact conversion formula not re-read (L).
- **Shades of K:** +1 Killroy run choice per level; the choice list itself is unresearched (L).
- **Wiki Dream Cloud # to Toolbox index:** wiki number = index + 1 (the catalogue's Wiki # column); the wiki's per-world numbering may differ for "Nightmare" clouds (L).
- **Nightmare clouds** (index >= 36) are locked behind Research grid node 86 (W7). H.
- **Hmm... (13):** permanently locked in Toolbox, purpose unknown (see open questions).

## Cloud catalogue (all 77)

Stage column is my reading of which world the condition lives in (L confidence); the label text is the game's, underscores replaced. [C33] Rows are tier 1 data (H), cross-checked against the wiki (tier 3).

| Idx | Wiki # | Challenge | Goal | Reward | Stage (my reading, L) |
|---|---|---|---|---|---|
| 0 | 1 | Greenstack 20 different items in your Storage Chest | 20 | Unlock next Equinox upgrade | W1-W4 |
| 1 | 2 | Get 400 kills in a single Killroy run. Why do they keep respawning anyway, are they stupid? | 400 | +1 Trophy per Weekly Battle boss kill forever | W1-W4 |
| 2 | 3 | Reach Lv 100 on all of your characters. Single character accounts, it's your time to shine! | 1 | Unlock next Equinox upgrade | W1-W4 |
| 3 | 4 | Reach a total Refinery Rank of 30 across all cycles | 30 | +10% Equinox Bar fill rate | W1-W4 |
| 4 | 5 | Get a single sample of 1 million or more of any item. 7 digit sample club, you in? | 1 | New Star Talent | W1-W4 |
| 5 | 6 | Reach wave 50 on first 6 Tower Defence Worship Summons | 6 | Unlock next Equinox upgrade | W1-W4 |
| 6 | 7 | Defeat all 5 difficulties of a Weekly BATTLE boss. RIP! | 1 | +3 Max LV for Equinox Upgrade 'Liquidvestment' | W1-W4 |
| 7 | 8 | Max out 5 stat upgrades within the Flurbo Shop of the Dungeon | 5 | Unlock next Equinox upgrade | W1-W4 |
| 8 | 9 | Defeat the Vengeful Grandfrogger, 4th difficulty, in a party with others or alone. | 1 | Tick Tock book from alchemy can now go up to Lv.200 | W1-W4 |
| 9 | 10 | Reach Lv 300 Construction on any character | 300 | +15% Equinox Bar fill rate | late W4 / unclear |
| 10 | 11 | Reach Lv 250 on all of your characters, every one of them. Yes, even the bad ones you neglect | 1 | Unlock next Equinox upgrade | W1-W4 |
| 11 | 12 | Greenstack 75 different items in your Storage Chest | 75 | +1 Trophy per Weekly Battle boss kill forever | W1-W4 |
| 12 | 13 | Get 100,000 sec of instant progress from a single use of Cranium Cooking talent | 100,000 | +5 Max LV for 'Matching Scims' Equinox Upgrade | W1-W4 |
| 13 | 14 | Reach a total shrine lv of 140 across all shrines | 140 | Unlock next Equinox upgrade | W1-W4 |
| 14 | 15 | Defeat the Inevitable Snakenhotep in a party with others or alone. That's the 3rd and final W2 Dungeon boss | 1 | +20% Equinox Bar fill rate | W1-W4 |
| 15 | 16 | Fill half of your cog board, at least 48 slots, with Ulti Double Cogs. | 48 | +4 Max LV for 'Liquidvestment' Equinox Upgrade | W1-W4 |
| 16 | 17 | Get a Lucky Lad trophy drop on a beginner type character | 1 | New Recipe in Anvil III for the 'Luckier Lad' trophy | W1-W4 |
| 17 | 18 | Reach a total Refinery Rank of 60 across all cycles | 60 | Unlock next Equinox upgrade | W1-W4 |
| 18 | 19 | Use a stack of 100,000 cooking Ladles in a single usage | 1 | +10 Max LV for 'Matching Scims' Equinox Upgrade | W1-W4 |
| 19 | 20 | Defeat the Caustic Glaciaxus in a party with others or alone. That's the 3rd and final W3 Dungeon boss | 1 | +25% Equinox Bar fill rate | W1-W4 |
| 20 | 21 | Reach round 115 in the Mob Arena, but only using a team of 4 Mobs or less | 115 | Unlock next Equinox upgrade | late W4 / unclear |
| 21 | 22 | Upgrade the Bobjoepickle vial to Lv 2. It will still do nothing, but one can dream! | 2 | +5 Max LV for 'Faux Jewels' Equinox Upgrade | W1-W4 |
| 22 | 23 | Reach Lv 500 on all of your characters. That's over half way to the fabled 9999! | 1 | +30% Equinox Bar fill rate | W1-W4 |
| 23 | 24 | Have 15 chemical plants just chillin' in your Gaming Garden all at once | 15 | Unlock next Equinox upgrade | W5-W6 |
| 24 | 25 | Get 2000 kills in a single Killroy run. Seems like a lot, but compared to your deathnote, it really isn't huh... | 2,000 | +35% Equinox Bar fill rate | W1-W4 |
| 25 | 26 | Get a total of 100 BILLION Green Mushroom deathnote kills. | 1 | +4 Max LV for 'Food Lust' Equinox Upg | W1-W4 |
| 26 | 27 | Get a single sample of 1 billion or more of any item. 10 digit sample club, you in? | 1 | +10 Max LV for 'Faux Jewels' Equinox Upgrade | late W4 / unclear |
| 27 | 28 | Reach wave 121 on first 6 Tower Defence Worship Summons | 6 | +200 Starting Points in Worship TD | late W4 / unclear |
| 28 | 29 | Greenstack 200 different items in your Storage Chest | 200 | Unlock next Equinox upgrade | late W4 / unclear |
| 29 | 30 | Successfully take a Red Frisbee sample at Wood Mushrooms. Yeah, it's possible | 1 | +40% Equinox Bar fill rate | late W4 / unclear |
| 30 | 31 | Get 100 5 star ruby cards. Or, get 1 500 star card. The latter does not exist. Sadly | 100 | +4 Max LV for 'Equinox Symbols' Equinox Upgrade | late W4 / unclear |
| 31 | 32 | Acquire all 10 Megafeathers from Orion the Great Owl, and all 12 Megafish from Poppy the Kangaroo Mouse | 22 | Unlock next Equinox upgrade | late W4 / unclear |
| 32 | 33 | Unlock 75 or more Portals on a single Voidwalker Speedrun | 75 | +6 Max LV for 'Slow Roast Wiz' Equinox Upgrade | late W4 / unclear |
| 33 | 34 | Reach a total Cooking Meal Upgrade Lv of 4242 across all meals | 4,242 | 'Food Lust' Equinox Upg now reduces cost by -42% per stack | W5-W6 |
| 34 | 35 | Find every type of hat in Sneaking, including the Funky Hat, which is a SUPER rare drop from the lobby floor... | 15 | +10 Max LV for 'Matching Scims' Equinox Upgrade | W5-W6 |
| 35 | 36 | Get at least 100 Killroy kills on HALF of monsters in World 1 through 6, as shown in Killroy Prime in Rift | 40 | +15 Max LV for 'Voter Rights' Equinox Upgrade | W5-W6 |
| 36 | 37 | Hit a bomb instantly while playing Mr. Minehead's Depth Charge 5 times | 5 | Unlock next Equinox upgrade | post-W7 (Research G8) |
| 37 | 38 | Create a Tier 25 Sushi at the Sushi Station | 25 | +5 Max LV for 'Nonstop Studies' Equinox Upgrade | post-W7 (Research G8) |
| 38 | 39 | Reach Worker Class Lv.3 or higher at The Clamworks in World 7 | 3 | +60% Equinox Bar fill rate | post-W7 (Research G8) |
| 39 | 40 | Reach Showdown 100 at the Emperor's Castle in World 6 | 100 | +10 Max LV for 'Matching Scims' Equinox Upgrade | post-W7 (Research G8) |
| 40 | 41 | Fill half of your cog board, at least 48 slots, with Jewel Cogs. They're unlocked from Duperbits in Gaming. | 48 | +65% Equinox Bar fill rate | post-W7 (Research G8) |
| 41 | 42 | Reach Lv 1000 on ALL your characters! | 1 | All Minehead opponents have 1 less Depth Charge | post-W7 (Research G8) |
| 42 | 43 | Reach LV. 30 for any Palette Colour in Gaming | 30 | +5 Max LV for 'Nonstop Studies' Equinox Upgrade | post-W7 (Research G8) |
| 43 | 44 | Reclaim at least 50 of the King Rat's missing crowns, as shown in your Gaming Logbook | 50 | +5 Max LV for 'Nonstop Studies' Equinox Upgrade | post-W7 (Research G8) |
| 44 | 45 | Complete 300 different Quests. This is the same value used by those Star Talents of yours on the 1st page! | 300 | +75% Equinox Bar fill rate | post-W7 (Research G8) |
| 45 | 46 | Help Bolaia, Student of Cavern Lore, reach Lv 200 or higher | 200 | 1.03x Equinox Bar fill rate, MULTI! | post-W7 (Research G8) |
| 46 | 47 | Level up your C String at The Harp in the Caverns to Lv 150 or higher | 150 | +90% Equinox Bar fill rate | post-W7 (Research G8) |
| 47 | 48 | Defeat 300 opponents in Endless Summoning | 300 | +5 Max LV for 'Nonstop Studies' Equinox Upgrade | post-W7 (Research G8) |
| 48 | 49 | Reach 10,000,000+ Total Points in the Gambit Cavern | 10,000,000 | +100% Equinox Bar fill rate | post-W7 (Research G8) |
| 49 | 50 | Reach LV. 60 for any Palette Colour in Gaming | 60 | 1.05x Equinox Bar fill rate, MULTI! | post-W7 (Research G8) |
| 50 | 51 | Reach Sanctum 25 in the Temple Cavern | 25 | +5 Max LV for 'Nonstop Studies' Equinox Upgrade | post-W7 (Research G8) |
| 51 | 52 | Get a score of 100,000,000 or more in The Dawg Den Cavern | 100,000,000 | +120% Equinox Bar fill rate | post-W7 (Research G8) |
| 52 | 53 | Collect 60 Stickers from Harvesting Megacrops in Farming | 60 | 1.06x Equinox Bar fill rate, MULTI! | post-W7 (Research G8) |
| 53 | 54 | Get a LV. 7 slot in Sneaking, using Symbols. This is the Green slot that comes after the Lv.6 White slot. | 7 | +100 Max possible LV for all Sneaking Charms | post-W7 (Research G8) |
| 54 | 55 | Have 16 or more Millionmega Gold Foods on the Beanstalk. You must complete Sad Urie's questline first... | 16 | +150% Equinox Bar fill rate | post-W7 (Research G8) |
| 55 | 56 | Acquire at least 8 Megaflesh from Bubba the Seal | 8 | +5 Max LV for 'Nonstop Studies' Equinox Upgrade | post-W7 (Research G8) |
| 56 | 57 | Find at least 1850 items, according to The Slab | 1,850 | +160% Equinox Bar fill rate | post-W7 (Research G8) |
| 57 | 58 | Reach LV. 82 for any Palette Colour in Gaming | 82 | +170% Equinox Bar fill rate | post-W7 (Research G8) |
| 58 | 59 | Reach a 200,000x or higher multiplier for Extra Bones, or Extra Tachyons. Your choice. | 200,000 | +6 Max LV for 'Nonstop Studies' Equinox Upgrade | post-W7 (Research G8) |
| 59 | 60 | Find a Nugget worth at least 1000Mx Bits Gain in Gaming. Yes, a BILLIONAIRE golden nugget... | 1,000,000,000 | 1.07x Equinox Bar fill rate, MULTI! | post-W7 (Research G8) |
| 60 | 61 | Acquire a Tier 6 Tiny Cog. Yes, a Tier 6 exactly. Tier 7 and up ain't it. | 1 | +185% Equinox Bar fill rate | post-W7 (Research G8) |
| 61 | 62 | Reach Lv. 1500 on any of your characters, you absolute legend | 1 | +6 Max LV for 'Nonstop Studies' Equinox Upgrade | post-W7 (Research G8) |
| 62 | 63 | Add either the Nine Dart Finish Trophy or the Baller Trophy to your Gallery | 1 | +190% Equinox Bar fill rate | post-W7 (Research G8) |
| 63 | 64 | Press THE BUTTON at least 200 times... actually, better make that 210 times! | 210 | +195% Equinox Bar fill rate | post-W7 (Research G8) |
| 64 | 65 | Create a Tier 54 Sushi at the Sushi Station | 54 | +7 Max LV for 'Nonstop Studies' Equinox Upgrade | post-W7 (Research G8) |
| 65 | 66 | Reclaim at least 70 of the King Rat's missing crowns, as shown in your Gaming Logbook | 70 | +200% Equinox Bar fill rate | post-W7 (Research G8) |
| 66 | 67 | Reach Worker Class Lv.8 or higher at The Clamworks in World 7 | 8 | +3 Exotic Market purchases per week | post-W7 (Research G8) |
| 67 | 68 | Hit a bomb instantly while playing Mr. Minehead's Depth Charge 500 times | 500 | 1.07x Equinox Bar fill rate, MULTI! | post-W7 (Research G8) |
| 68 | 69 | Collect 80 Stickers from Harvesting Megacrops in Farming | 80 | +220% Equinox Bar fill rate | post-W7 (Research G8) |
| 69 | 70 | Acquire at least 10 Megaflesh from Bubba the Seal | 10 | 1.05x Drop Rate multi | post-W7 (Research G8) |
| 70 | 71 | Reach LV. 100 for any Palette Colour in Gaming | 100 | 1.05x Class EXP multi | post-W7 (Research G8) |
| 71 | 72 | Find all 10 Grand Discoveries in Pebble Cove, the first Spelunking tunnel | 10 | All Research Grid bonuses are +1% bigger | post-W7 (Research G8) |
| 72 | 73 | Deliver the Unstable Reliquarium 7 times | 7 | All Research Grid bonuses are +1% bigger | post-W7 (Research G8) |
| 73 | 74 | Get a Rank 20 Ribbon. | 1 | Ribbons give +1% extra multi every 10 Ranks! | post-W7 (Research G8) |
| 74 | 75 | Discover every object across all Spelunking tunnels. Better do this now before the next tunnel comes out! | 90 | +250% Equinox Bar fill rate | post-W7 (Research G8) |
| 75 | 76 | Reach Sneaking Mastery VII | 7 | +8 Max LV for 'Nonstop Studies' Equinox Upgrade | post-W7 (Research G8) |
| 76 | 77 | Get at least 100 Killroy kills on ALL monsters in World 1 through 6, as shown in Killroy Prime in Rift | 80 | All Research Grid bonuses are +1% bigger | post-W7 (Research G8) |

## Min-max by stage

Priority evidence is thin: one community ordering (Reddit via the earlier verification, AutoReview Optional/Recommended split, one guide sheet), no per-stage guide found. Treat everything as opinion-tier 4 plus code arithmetic. Confidence L for all priority advice: the Reddit-sourced ordering and AutoReview split are unverifiable here; the wiki "compounding multipliers" advice (C34) is unverifiable in the fetched wiki text. [C36] [C37] [C38] [C34]

- **W3 early (Mirror just dropped):** spend the first bar on Equinox Dreams, then keep buying Dreams to 5 (cost 1,049 total; ~12.5 h at 84/h; H arithmetic). Visible clouds are index order: 0 Greenstack 20, 1 Killroy 400, 2 all chars Lv 100, 3 Refinery 30, 4 a 1M sample. Aim for cloud 3 (+10% rate) and the cheap unlock clouds first. [C7] [C41]
- **W3 mid:** Equinox Resources (needs 1 unlock cloud), then **Liquidvestment as soon as 3 unlock clouds are done**, ahead of Matching Scims. Next: Slow Roast Wiz or Equinox Symbols, then Matching Scims, then Faux Jewels. Unlock clouds in practice: 0 (greenstack 20), 2 (all Lv 100), 5 (TD wave 50 x6), 7 (Flurbo shop). [C36] [C12]
- **W3 late / W4:** Matching Scims (damage, own multiplier; clouds 12 and 18 are W4 cooking tasks), Faux Jewels (cloud 21 vial is cheap, cloud 26 needs a 1B sample), Equinox Symbols (cloud 30 needs 100 five-star ruby cards). Bar-rate clouds 14 (Snakenhotep), 19 (Glaciaxus), 9 (Construction 300) compound all later purchases. Community says (L, tier 4) skip **Food Lust** and **Laboratory Fuse** (and treat Shades of K as optional); the earlier W3 dossier's contrary advice is superseded. Disagreement note: the Toolbox data show Fuse and Food Lust have the highest base max (10), which is why they look attractive; the community reasoning is cost-per-benefit (confidence M for the data, L for the community ordering). [C36] [C37]
- **W4 end / W5 outline:** keep buying in the order above; Voter Rights and Metal Detector become relevant only with the W2 ballot and W5 Gaming. Switch effort to the fill-rate clouds (additive list in M2); multipliers 45/49/52/59/67 compound with everything, as the wiki advises. [C34] [C6]
- **Class differences:** none for the bar; Matching Scims helps all classes via the damage calculator. Voidwalker has a speedrun cloud (32, 75 portals). [C19] Confidence H for the cloud, M for the class claim.
- **No data for:** a per-stage upgrade order from a published guide; AutoReview's tier lists live in `progression_tiers.py` and were not read in this pass.

## Common detection rules (for ActiveOn)

1. `Dream[0] >= (120 + 40n) x 1.02^n` and some unlocked upgrade below max -> "spend the bar". [C7]
2. Mirror owned (or Dream[2] >= 1) is the unlock; do not use Toolbox `unlocked`. [C31]
3. First five incomplete clouds (when Dreams = 5) show the player's real goals; if all 5 are far from done, suggest raising Dreams first. [C13]
4. (M) A cloud whose goal is met but not yet marked -1: Toolbox only knows `current`, so completion is detectable from `current === -1` only; unmet-but-satisfied needs per-cloud detectors from other systems (future work).
5. Fill-rate rule: use the code multiplier list in M2, not Toolbox's stale `expression` string. H.

## Save and Toolbox fields

- `account.equinox.{unlocked, currentCharge, chargeRequired, chargeRate, timeToFull, challenges[], upgrades[], completedClouds, rawDream, breakdown}`; raw keys `Dream` (array) and `WeeklyBoss.d_*`. [C10] [C14]
- Helpers: `getEquinoxBonus(upgrades, name)`, `getCloudBonus(challenges, i)`, `EQUINOX_CLOUD` map (idx 33, 41, 53, 66, 69, 70, 71, 72, 73, 76). [C26]
- Cross-system options used: `accountOptions[193]` (Food Lust stacks), `[192]` (nuggets since upgrade), `[320]` (penguins). [C18] [C24] Confidence H.

## Sprites and art needs (to document, not built in this pass)

Existing: `sys-equinox`, `v2-systems-moon`, `v2-time-moon`. Needed for a dedicated Equinox view (document only; confidence M, whether the registry sprites exist in source is unverified): 14 Dream Upgrade icons (16x16), a cloud tile (done / active / locked / Nightmare), the Equinox Mirror item, and 4 Valley-resource icons (Marble Ore, Willow Logs, Equinox Fish, Dream Particulate). [C40]

## Open questions

1. Arcade `Equinox_Fill_Rate` per-level scaling (arcade parser not read). 
2. Exact stage placement of clouds 9, 20, 26-32 (several conditions live in W4-W5 systems).
3. No per-stage community guide found; AutoReview Recommended/Optional tier file not read.
4. Whether an in-valley fill pause is current behaviour (from N.js, prior research; not in Toolbox).
5. How Summoning "Equinox Max LV" scales (W6; `getWinnerBonus`).
6. Hmm... (index 13) is unreachable per Toolbox (unlock count maxes at 12); its purpose and whether the game ever unlocks it is unknown. Confirm in-game (L).
7. Other +% Equinox fill sources beyond M2 (shared-data entries near L6025 and L7494-7629) not mapped.
8. Per-cloud goal progress sources and Valley gathering/activities not researched.
9. Bloodbone map name (Disputed in Unlocks).

## Sources

Toolbox @6c37e3d: `parsers/world-3/equinox.ts`, `data/website-data/shared-data.json`, `vials.json`, consumers listed above; wiki https://idleon.wiki/wiki/Equinox (fetched 2026-10-19); prior research `research/w3-systems` (N.js v1.23, 2026-10-17), `research/priority-verification` (2026-10-17), `research/game-loop`; AutoReview `mysite/w3/equinox.py` @05ac449 (fetched 2026-10-19). Pre-patch flag: the wiki bar formula still shows rounding and its clouds are 1-based; both are post-2.3.525 differences, not errors.
