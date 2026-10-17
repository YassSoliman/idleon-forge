# W3 System Dossiers: Shrines, Prayers, Equinox, W3 bosses and keys, W3 quests (2026-10-17)

Part of ticket [#22](https://github.com/YassSoliman/idleon-forge/issues/22) (map [#1](https://github.com/YassSoliman/idleon-forge/issues/1)). Format: [`docs/research/SYSTEM-DOSSIER.md`](../../SYSTEM-DOSSIER.md). Construction, Worship, Trapping and the Death Note are in the sibling files of this folder and are linked here by name only.

**Versions read:**

- **Game client** `https://www.legendsofidleon.com/ytGl5oc/N.js`, Last-Modified **2026-10-17 01:42:35 GMT**, newest patch note `Luminous_Menagerie_v1.23` (the current patch). N.js is minified, so code is cited as **symbol + `@offset`** in that exact file. Offsets move with every patch; the symbol names do not.
- **IdleOn Toolbox** [@ 6827d3f (2026-10-17)](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1). Below, `TB:` means `https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/`.
- **idleon.wiki** via `api.php`, each page's last revision date given at the point of use (tier 2, ADR 0004).
- **Community:** the "Idleon Incomplete Guide" sheet's WORLD 3 tab (no date; post-W7, pre-Royal-Guardian, so 2025-11 to 2026-08), as catalogued on `research/community-guides`. Reddit (Arctic Shift) was rate-limited or timing out for the whole session (other agents were querying it in parallel), so **no Reddit opinion is cited**. Priority orders marked *(opinion)* are my reasoning from the game data, and need a human pass before they become Knowledge Base entries.
- **Confidence:** **H** = read directly in code or data. **M** = my reading of minified control flow, or a wiki claim I could not confirm in code.

## Answer

- **Shrines level only from AFK time claimed on their own map** (per character, per hour, times a multiplier), and moving one wipes its progress toward the next level. A shrine with no character AFK on its map never grows. The W3 fixture account has 2 shrines built, both sitting at level 1 in Blunder Hills town (map 0) where no character idles: a detectable Fix-before-you-leave. Levels are cheap early (6 character-hours to reach Lv 2, 295 to Lv 5), then exponential (11.5k to Lv 11). (H)
- **Prayer slots come only from your best Wizard-line character's class level** (Wizard, Elemental Sorcerer, Spiritual Monk; Shaman and Bubonic Conjuror do not count): 1 slot from Lv 1, 2 at Lv 60, 3 at 85, 4 at 110, 5 at 150, then 170, 200 and 250, plus up to 4 Gem Shop "Prayer Slots". (H)
- **Each prayer's curse grows exactly as fast as its blessing** (both are `x × (1 + (L−1)/10)`), so levelling never improves the trade-off. Level the prayers whose curse does not matter for how that character is used. The early costs are tiny (Lv 5 for 4,500 Forest Souls on Big Brain Time), and costs explode after Lv 5 (×1.12 per level, ×1.3 for The Royal Sampler). (H)
- **Unending Energy caps the character's AFK at 10 h.** It is the only AFK cap in the game. Never equip it when Expected Return is more than 10 h. (H)
- **Tachion of the Titans (2 levels, 620 Dune Souls in total) is a quest key:** giant monsters spawn only while it is equipped, and Snouts 3 and Bellows 3 need a giant kill. (H)
- **Equinox:** it unlocks via the Equinox Mirror, a 10% base drop from Bloodbone on Hell Hath Frozen Over. Its bar fills account-wide at 60/h (90/h with the bundle) and **stops at full**, so a full bar is wasted fill. The first 5 bars should all go to Equinox Dreams (more clouds visible at once). Clouds are shown in index order, and the Nth further upgrade unlocks after **any** N of the 12 "unlock" clouds are completed, not specific ones. (H)
- **Toolbox reports `equinox.unlocked = true` even on a W2 account**, so it cannot tell whether the mirror is owned. ActiveOn must not suggest "spend your Equinox bar" from that flag alone. (H)
- **The W3 boss is Chizoar, not Efaunt.** Efaunt is the W2 boss whose guaranteed Glacier Quartz opens W3. Every Chizoar kill, at any difficulty, drops one Galaxial Amethyst, which Carpenter Cardinal needs to open the W4 portal. Entry costs 1, 5 or 50 Chizoar's Cavern Keys (Normal, Chaotic, Blighted). (H for the drops, M for the key counts)
- **The best key source scales with characters:** every character that has finished Bellows' 3rd quest adds +1 key per day, and Bellows banks up to 3 days. The other sources are Dilapidated Slush (80% for 2 keys), Coldsnap Colosseum chests (4/10/18%) and a merit-based chance per Chizoar kill. (H)
- **The must-do W3 quests** are Hoggindaz 1–5 (they teach Refinery, Trapping, Construction, Worship and the Printer, and give the Printer Sampling and Shrine Architect talent books), Bellows 1–3 on every character (daily keys), Snouts and Crystalswine (6 stamps) and Carpenter Cardinal (W4 gate). Lord of the Hunt is the Trapping ladder. Yondergreen 5–7 are "idle exactly X h" quests that fit an AFK Setup when Expected Return matches. (H data, opinion on priority)

---

## Shrines

- **What it is:** nine placeable map buffs. Each gives everyone on its map a bonus, and levels up from the AFK time characters claim on that map.
- **Unlocks:** each shrine is a building in the third row of the Construction build menu (`towers` keys `Woodular_Shrine` … `Primordial_Shrine`, Construction indices 18–26). It costs salts from the Refinery: 2 Redox to 10 Nullo per level ([TB: data/website-data/shared-data.json L48930](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/shared-data.json#L48930)). Once built, a shrine appears in the top left of Blunder Hills town. It is moved by casting the **Shrine Architect** special talent, whose book is the reward for Hoggindaz quest 5 "Taking Samples" (see W3 quests). The talent text reads "Cast this talent to place shrines. You also charge them +{% faster" ([TB: data/website-data/talents.json, Special Talent 2 / SHRINE_ARCHITECT](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/talents.json); wiki [Construction §Shrines](https://idleon.wiki/wiki/Construction), rev 2026-10-07). (H data, M placement flow)
- **Scope:** account-wide. Shrine level, map and progress live in `ShrineInfo`, one row per shrine, and the bonus applies to any character on that map. The level-up rate is **per character**: each character on the map adds its own AFK time times its own multipliers (Shrine Architect star talent, golden food, Post Office box). (H)
- **Inputs → outputs:** Claiming AFK gains on a shrine's map adds `AwayTime × ShrineExpBonus / 3600` hours of progress to every built shrine there, and the shrine levels up each time progress reaches `ShrineHrREQ(level)` (N.js `ShrineExpBonus`/`ShrineHrREQ` in `_customBlock_WorkbenchStuff` @7818593, AFK loop @5584803). Moving a shrine sets its progress to 0, unless you have Emporium bonus 19 (a W6 Sneaking bonus) (@4645879). Bonus = `(1 + 5 × Chaotic-Chizoar-card-level / 100) × ((L − 1) × perLevel + base)`, and it is 0 while unbuilt (`_customBlock_Shrine` @7820782; [TB: parsers/world-3/shrines.ts L29-31](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/shrines.ts#L29-L31)). (H)

| # | Shrine | Bonus on its map | Base / +per Lv | Lv 5 | Lv 10 | Lv 20 | Build salt (per Construction level) |
|---|---|---|---|---|---|---|---|
| 0 | Woodular | +% Total Damage | 12 / +3 | 24% | 39% | 69% | Redox ×2 |
| 1 | Isaccian | +% Max HP and DEF | 12 / +3 | 24% | 39% | 69% | Redox ×5 |
| 2 | Crystal | +% Lv Up Rate of all shrines on this map | 20 / +4 | 36% | 56% | 96% | Explosive ×4 |
| 3 | Pantheon | +% Carry Capacity | 10 / +2 | 18% | 28% | 48% | Explosive ×7 |
| 4 | Clover | +% Drop Rate | 15 / +3 | 27% | 42% | 72% | Spontaneity ×5 |
| 5 | Summereading | +% ALL EXP gain | 6 / +1 | 10% | 15% | 25% | Spontaneity ×10 |
| 6 | Crescent | +% Crystal and Giant spawn chance (and active EXP, per its building text) | 50 / +7.5 | 80% | 117.5% | 192.5% | Dioxide ×12 |
| 7 | Undead | +% monster Respawn Rate | 5 / +1 | 9% | 14% | 24% | Purple ×14 |
| 8 | Primordial | +% AFK Gain Rate | 1 / +0.1 | 1.4% | 1.9% | 2.9% | Nullo ×10 |

Sources: [TB: shared-data.json `shrines`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/shared-data.json), `towers` (from L48623). The values are before the Chaotic Chizoar card multiplier. (H)

- **ShrineExpBonus multiplier** (per character): `(1 + 50% × superbit 8) × (1 + (Moai Head artifact + 15 × Construction rift mastery)/100) × (1 + ballot 19) × (1 + 10% × the shrine's Construction level) × (1 + (Crystal Shrine on this map + Post Office "Construction Container" + Golden Cheese + Shrine Architect talent + ShrineSpd vial)/100)` (@7818593; [TB: shrines.ts L66-110](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/shrines.ts#L66-L110)). **In W3 the levers are:** the shrine's own Construction level (+10% each), the Crystal Shrine on the same map, Shrine Architect levels, Golden Cheese (a Chizoar drop) and the Post Office box. (H)
- **Where a shrine applies:** on its own map; on any map in the same world with the lab "Shrine World Tour" (W4); everywhere with the Moai Head artifact (W5). It levels anywhere with legend talent 38 (W7) ([TB: shrines.ts L114-137](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/shrines.ts#L114-L137); `_customBlock_Shrine` @7820782). (H)

- **Goals and Milestones:** level thresholds. Hours below are the shrine-EXP needed, i.e. character-hours at a ×1.0 multiplier (`ShrineHrREQ(L) = 20(L−1) + 6L·1.63^(L−1)`, floored below Lv 20; @7818593). (H)

| Level step | Shrine-hours for this step | Cumulative from Lv 1 | Note |
|---|---|---|---|
| 1 → 2 | 6 | 6 | one character's overnight |
| 2 → 3 | 39 | 45 | |
| 3 → 4 | 87 | 132 | |
| 4 → 5 | 163 | 295 | ~2 days with 6 characters on the map |
| 5 → 6 | 291 | 586 | |
| 6 → 7 | 514 | 1,100 | |
| 7 → 8 | 907 | 2,007 | |
| 8 → 9 | 1,607 | 3,614 | |
| 10 → 11 | 5,053 | 11,517 | where W3 progress flattens |
| 15 → 16 | 84,394 | 196,707 | needs W4+ multipliers |
| 20 → 21 | 1,290,844 | 3,077,639 | |

  The Equinox cloud "total shrine level of 140 across all shrines" (an upgrade-unlock cloud, see Equinox) is a late Milestone, about 15.5 average per shrine. A Toolbox account achievement also counts total shrine levels (`calcShrineLevels`, [TB: shrines.ts L139-142](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/shrines.ts#L139-L142)).

- **Feeds / fed by:**
  - **Fed by:** Construction (builds the shrine, and each building level adds +10% level-up rate), Refinery salts, the AFK Setup (where characters idle), the Chaotic Chizoar card (shrine effects), Golden Cheese (Chizoar drop), Post Office, Alchemy vials, Vote Ballot, and later Lab (World Tour), Sailing (Moai Head), Gaming (superbit), Rift and Legend Talents.
  - **Feeds:** damage, HP, drop rate, EXP and respawn on the AFK map, so it feeds every fighting Goal there: kills for the Death Note and portals (via respawn), Trapping-adjacent Crescent giants and crystals (giants need the Tachion prayer), Yondergreen quest 1 ("Place 4 shrines in this map"), and the Equinox shrine-level cloud. (H)
- **Per-session actions:** (1) Check that every built shrine sits on a map where at least one character is AFK for the coming AFK Stretch. If not, move it with Shrine Architect, knowing that moving loses partial progress, so move just after a level-up. (2) Check whether a cheap Construction level-up of a shrine is available (another cluster's Spend Plan). **Capped or idle state:** a shrine on a map nobody AFKs on is idle. A shrine never caps (max level 100 for the building, no level cap found for the shrine itself). (H for mechanics, opinion for the routine)
- **AFK Setup implications:** shrines want **characters stacked on one map**. Pick the map most characters fight on (often the pusher's AFK map or a shared farming map) and place Woodular, Isaccian, Clover, Summereading and Crystal there. The Crystal Shrine has value only on a map that also holds other shrines. *(opinion from the mechanics)*
- **Min-max by stage** *(opinion; check with a human)*:
  - **Early W3 (first salts):** Woodular (Redox ×2) then Isaccian (Redox ×5), placed on the main fighting map and not left in town. Level both to 2–3 just by AFKing.
  - **Mid W3 (Explosive and Spontaneity salts):** Crystal on the same map, then Clover (drop rate) and Summereading (EXP). Pantheon only if carry capacity is the AFK limiter, which the AFK cap research identifies as the real cap on long AFK Stretches.
  - **Late W3 to W4:** Crescent on a giant-farming map with Tachion equipped, Undead for kill-count Goals (Death Note, portals), and Primordial is negligible (+1–3%). Level Shrine Architect for its +charge rate. In W4, Shrine World Tour removes the "all on one map" constraint within a world.
  - **Per class:** none in code. Isaccian matters most where the pusher is at risk of dying (melee Warrior lines), and Woodular is universal. *(opinion)*
- **Common mistakes:**
  - **Shrines left in town or on an empty map.** Detect: `account.shrines[i].shrineLevel > 0` and `mapId` not in `{characters[].mapIndex}` (the W3 fixture: two shrines at Lv 1 on map 0, no character there).
  - **Moving shrines often**, which loses progress: detect `progress` near 0 with a level that has not changed between saves.
  - **Crystal Shrine alone on a map.**
  - **Unbuilt shrines advertised as active:** Toolbox fixed a phantom Crystal bonus at level 0 (comment in shrines.ts L26-28).
- **Save and Toolbox fields:**
  - `account.shrines[]`: `{mapId, shrineLevel, name, bonus, progress, desc, worldTour, crystalShrineBonus, shrineTowerValue}`, where `shrineTowerValue` is the Construction building level.
  - `account.shrinesExpBonus.{total[9], breakdown}` is the per-shrine level-up rate summed over characters (zero on both fixtures).
  - Raw `ShrineInfo` = `[mapId, ?, x, level, progress]`.
  - Use Toolbox `getShrineBonus(shrines, i, mapIndex, cards, artifacts)` for "does this character get it" and `getShrineExpBonus` for the ETA. ETA to the next level = `(ShrineHrREQ(L) − progress) / total[i]` hours. That is arithmetic on a Toolbox number, except `ShrineHrREQ`, which Toolbox does not export, so it is a formula we would have to own (flag for ADR 0005). (H)
- **Sources:** N.js `_customBlock_Shrine` @7820782, `_customBlock_WorkbenchStuff("ShrineExpBonus"|"ShrineHrREQ")` @7818593, AFK shrine loop @5584803, placement @4645476–4645879; TB `parsers/world-3/shrines.ts`, `shared-data.json` (`shrines`, `towers`), `talents.json`; wiki [Construction](https://idleon.wiki/wiki/Construction) (rev 2026-10-07). All on v1.23.

## Prayers

- **What it is:** account-owned buffs bought with souls. Each character equips a few at once, and every prayer pairs a Blessing with a Curse.
- **Unlocks:** each prayer is gated on reaching a wave in a Worship Tower Defence zone (the `unlockZone` + `unlockWave` columns), then bought with souls. Souls are a drop from Worship. Prayer slots are covered under Scope. Wiki [Prayers](https://idleon.wiki/wiki/Prayers), rev 2026-10-03: "Unlock new prayers by reaching specific wave progression in the Worship Tower Defense." The wiki's note that "as of v1.50 prayers received a level cap" is old (2022) but matches the current `maxLevel`. (H data, M wave gate)
- **Scope:** **prayer levels are account-wide** (`PrayersUnlocked`). **Equipped prayers are per character** (`PrayersActive`). **Slots are account-wide**, set by the best Wizard-line character: the highest class level among classes 32, 34 and 35 (Wizard, Elemental Sorcerer, Spiritual Monk) compared against `RANDOlist[9]` = 1, 60, 85, 110, 150, 170, 200, 250, plus Gem Shop "PRAYER_SLOTS" (index 114, max 4 purchases, 250 gems +75 each) (N.js prayer UI @7733424 and @7673614; [TB: data/website-data/randomList.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/randomList.json) index 9; [gemShop.json L617](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/gemShop.json#L617)). The UI text is "Reach Lv X on a Wizard to activate more". (H)

| Best Wizard / ES / Spiritual Monk class level | 1 | 60 | 85 | 110 | 150 | 170 | 200 | 250 |
|---|---|---|---|---|---|---|---|---|
| Prayer slots (before gems) | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |

- **Inputs → outputs:** you spend souls (Forest, Dune, Rooted, Frigid, Squishy) to raise a prayer's level. Blessing and curse are both `round(x × max(1, 1 + (L − 1)/10))` (`_customBlock_prayersReal` @7822186; [TB: parsers/world-3/prayers.ts L25-64](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/prayers.ts#L25-L64)). Cost of the next level at level L: below L 6, `costMulti × (1 + (4 + i/25) × L)`. From L 6, `min(2e9, costMulti × (1 + (1 + i/20) × L) × 1.12^(L−5))`; The Royal Sampler (i = 9) uses `(2 + i/20)` and `1.3^(L−5)` (`WorshipStuff("PrayerCost")` @7763052; [TB: prayers.ts L67-76](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/prayers.ts#L67-L76), `gameTables.prayerCost` [shared-data.json L10187](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/shared-data.json#L10187)). **Late-game exception:** superbits 9, 39 and 53 (W5 Gaming) let a character with **no** prayers equipped get 20, 40 or 60% of every levelled prayer's blessing, without curses (Tachion excluded). (H)

All 19 live prayers (indices 19–24 are `Some_Prayer_Name0` placeholders, wave 999, not live). Costs are souls, computed from the formula above. (H)

| # | Prayer | Blessing L1 → max | Curse L1 → max | Soul | Unlock: TD zone, wave | Max Lv | Unlock cost (Lv 1) | Total to Lv 5 | Total to Lv 10 | Total to max |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | Big Brain Time | +30% → +177% Class EXP | +250% → +1475% monster Max HP | Forest | Goblin Gorefest w10 | 50 | 100 | 4,500 | 11,226 | 5.70M |
| 1 | Skilled Dimwit | +30% → +177% Skill Efficiency | −20% → −118% Skill EXP | Forest | Goblin Gorefest w25 | 50 | 300 | 13,620 | 34,470 | 17.9M |
| 2 | Unending Energy | +25% → +148% Class and Skill EXP | **Max AFK time 10 h** (fixed) | Forest | Goblin Gorefest w51 | 50 | 600 | 27,480 | 70,527 | 37.6M |
| 3 | Shiny Snitch | Shiny critters in bundles of 20 → 118 | Shiny chance ×15 → ×88 lower | Forest | Goblin Gorefest w81 | 50 | 1,000 | 46,200 | 120,189 | 65.4M |
| 4 | Zerg Rushogen | +5% → +14% AFK Gain Rate | −12% → −35% Carry Capacity | Forest | Goblin Gorefest w121 | 20 | 3,000 | 139,800 | 368,506 | 2.18M |
| 5 | Tachion of the Titans | Giant monsters can spawn on kill | (same) | Dune | Wakawaka War w11 | 2 | 100 | 620 (max) | | 620 |
| 6 | Balance of Precision | +30% → +177% Total Accuracy | −5% → −30% Total Damage | Dune | Wakawaka War w31 | 50 | 250 | 11,850 | 32,031 | 18.4M |
| 7 | Midas Minded | +20% → +118% Drop Rate | +250% → +1475% monster Max HP | Dune | Wakawaka War w71 | 50 | 700 | 33,460 | 91,539 | 53.5M |
| 8 | Jawbreaker | +40% → +236% monster Coins | +200% → +1180% monster Max HP | Dune | Wakawaka War w101 | 50 | 1,500 | 72,300 | 200,123 | 119M |
| 9 | The Royal Sampler | +15% → +44% 3D Printer sample size | −30% → −87% All EXP; remove all samples to unequip | Rooted | Acorn Assault w21 | 20 | 100 | 4,860 | 23,357 | 677k |
| 10 | Antifun Spirit | +700% → +1330% minigame reward multi | Minigames cost 9 → 17 plays | Rooted | Acorn Assault w41 | 10 | 600 | 29,400 | 83,223 (max) | 83,223 |
| 11 | Circular Criticals | +10% → +29% Crit Chance | −15% → −44% Crit Damage | Rooted | Acorn Assault w71 | 20 | 2,000 | 98,800 | 282,701 | 1.82M |
| 12 | Ruck Sack | +30% → +177% Carry Capacity | −15% → −88% AFK Gain Rate | Rooted | Acorn Assault w111 | 50 | 4,500 | 224,100 | 647,982 | 407M |
| 13 | Fibers of Absence | +30% → +177% kills for Death Note and portals | −15% → −88% Total Damage | Frigid | Frosty Firefight w21 | 50 | 100 | 5,020 | 14,664 | 9.32M |
| 14 | Vacuous Tissue | +100% Dungeon Credits and Flurbos | 2× Dungeon Passes per run | Frigid | Frosty Firefight w51 | 1 | 10 | 10 | | 10 |
| 15 | Beefy For Real | +20% → +98% Total Damage | −10% → −49% Defence and Accuracy | Frigid | Frosty Firefight w121 | 40 | 5,000 | 255,000 | 759,656 | 121M |
| 16 | Balance of Pain | +8% → +31% Multikill per damage tier | −15% → −58% Defence and Accuracy | Squishy | Clash of Cans w21 | 30 | 100 | 5,140 | 15,458 | 553k |
| 17 | Balance of Proficiency | +30% → +177% Skill EXP | −20% → −118% Skill Efficiency | Squishy | Clash of Cans w51 | 50 | 1,000 | 51,800 | 157,222 | 104M |
| 18 | Glitterbug | +30% → +117% chance giants summon 2 crystals | Giants 20% → 78% less likely | Squishy | Clash of Cans w131 | 30 | 7,000 | 365,400 | 1.12M | 40.8M |

Data: [TB: shared-data.json `prayers`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/shared-data.json); soul names from `items.json` (Soul1–5 = Forest, Dune, Rooted, Frigid, Squishy). The Worship TD zones belong to Worship. Clash of Cans is the W4 totem, so prayers 16–18 are a W4+ unlock (M, from zone naming).

- **Goals and Milestones:**
  - **Slots:** the best Wizard-line character reaching Lv 60, then 85, then 110 is the biggest step-up.
  - **Per prayer:** Lv 1 (owned), Lv 5 (the cheap curve ends; costs ×1.12 per level after that), and max where reachable (Tachion 2, Vacuous Tissue 1, Antifun 10).
  - **Unlocks:** wave Milestones in Worship TD (another dossier).
- **Feeds / fed by:**
  - **Fed by:** Worship (souls, TD waves), the Wizard-line class level, the Gem Shop, Gaming superbits (W5).
  - **Feeds:** Class EXP and Skill EXP and efficiency (every skill), drop rate, coins (Spend Plan), Death Note and portal kills (Fibers), the 3D Printer (Royal Sampler), Trapping shinies (Shiny Snitch), Dungeons (Vacuous Tissue), Arcade and other minigames (Antifun), giant monsters (Tachion; needed for Snouts 3, Bellows 3 and Crescent Shrine farming), and AFK (Zerg, Unending Energy). (H)
- **Per-session actions:**
  - Check each character's equipped prayers against its activity in the coming AFK Setup.
  - Check that **Unending Energy is not equipped when Expected Return is over 10 h.** Toolbox already raises this as `worshipAlerts` ([TB: utility/dashboard/characters.js](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/characters.js)).
  - Check that free slots are filled.
  - Spend souls on the next sub-Lv-5 level of an in-use prayer.
  - **Idle state:** unspent slots. Souls themselves do not cap. *(opinion for the routine)*
- **AFK Setup implications** *(opinion, from the blessing/curse data)*:
  - **Skillers:** Skilled Dimwit (efficiency up, EXP down), or Balance of Proficiency when the skill's level Milestone matters more than its output. Never both.
  - **Fighters on maps they one-shot:** Big Brain Time and/or Midas Minded. The monster HP curse costs nothing as long as kills stay one-hit. Check Toolbox's kills/hour before and after.
  - **Pushers (damage-limited):** Beefy For Real and Balance of Precision (W3 accuracy walls). Never Big Brain, Midas or Jawbreaker.
  - **Portal and Death Note kill grinders:** Fibers of Absence, if damage stays above the one-shot threshold.
  - **Giant-farming or giant quests:** Tachion of the Titans.
  - **Taking 3D Printer samples:** The Royal Sampler only while sampling. Its curse (−30% All EXP) cannot be removed until every sample is removed, so it is a deliberate commitment.
  - **Short AFK Stretches (≤ 10 h):** Unending Energy.
- **Min-max by stage** *(opinion)*:
  - **Early W3 (1 slot, Forest/Dune souls):** buy Tachion to Lv 2 (620 Dune) for the quests; Skilled Dimwit Lv 1–5 for skillers; Big Brain Time to Lv 5 for the EXP grind on overkill maps.
  - **Mid W3 (Wizard 60–85, 2–3 slots):** Unending Energy for daytime Play Session loops (≤ 10 h); Midas Minded on drop farmers; Fibers of Absence once Frosty Firefight wave 21 is reached; The Royal Sampler only during Printer sampling sessions.
  - **Late W3 to W4:** Beefy For Real (wave 121) and Balance of Precision for pushers; Balance of Pain (W4 multikill) and Vacuous Tissue for dungeon runs. Past Lv 5, level only the 2–3 prayers each character actually equips.
  - **W5+:** superbits make "no prayers equipped" a real option for passive blessings.
  - **Per class:** the Wizard line drives slots, so push its class level. Warrior pushers want Beefy and Precision. Hunter, Bowman and Shaman skillers want the skill prayers. No prayer is class-locked in code.
- **Common mistakes:**
  - **Prayers bought but not equipped.** The W3 fixture owns Big Brain Time and Skilled Dimwit at Lv 1, has 2 slots (best Wizard Lv 73), and every `characters[].activePrayers` is empty.
  - **Unending Energy on overnight AFK:** detect `activePrayers` includes `Unending_Energy` and `afkTime` or Expected Return > 10 h.
  - **EXP-or-drop curse prayers on a damage-limited pusher:** compare Toolbox's kills/hour or survivability.
  - **Levelling past Lv 5 before buying more prayers:** the cost jump.
  - **Thinking levels improve the ratio:** they don't.
  - **Royal Sampler left on:** a permanent −30% EXP.
- **Save and Toolbox fields:**
  - `account.prayers[]`: `{name, effect, curse, x1, x2, prayerIndex, soul, maxLevel, unlockZone, unlockWave, costMulti, totalAmount (souls owned), level}`.
  - `characters[].activePrayers[]` (equipped).
  - Use `getPrayerBonusAndCurse(activePrayers, name, account)` and `calcPrayerCost(prayer)` from [TB: prayers.ts](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/prayers.ts).
  - Slot count is **not** computed by Toolbox: derive it from `max(level of characters with class ∈ {Wizard, Elemental_Sorcerer, Spiritual_Monk})` against the 8 thresholds, plus `gemShopPurchases[114]` (a lookup table, not a formula).
- **Sources:** N.js `_customBlock_prayersReal` @7822186, `WorshipStuff("PrayerCost")` @7763052, the prayer menu @7673614 and @7733424, `_customBlock_AFKgains` (the Unending Energy 10 h clamp, per the [mechanics research](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md)); TB `parsers/world-3/prayers.ts`, `shared-data.json` (`prayers`, `gameTables.prayerCost`), `randomList.json`, `gemShop.json`; wiki [Prayers](https://idleon.wiki/wiki/Prayers) (rev 2026-10-03). v1.23.

## Equinox (W3 dreams)

- **What it is:** an account-wide bar that fills over time. Each full bar buys one level of a Dream Upgrade, and the upgrades are unlocked by completing Dream cloud challenges.
- **Unlocks:**
  - The **Equinox Mirror** (`Quest78`) is a **10% base drop** (before drop rate) from **Bloodbone** (`skele2`) on **Hell Hath Frozen Over** (W3 map 117) (N.js drop table `a.h.skele2` @14959602; [TB: monsterDrops.json L50913](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/monsterDrops.json#L50913)).
  - Holding the mirror enters Equinox Valley (map 120). Item text: "Hold down to enter the Equinox Valley map. You can later teleport there from the map once you unlock Dreams" (@16382965).
  - The wiki [Equinox](https://idleon.wiki/wiki/Equinox) (rev 2026-10-10) writes the drop as `Chancedisplay|0.1`, i.e. the same 1-in-10.
  - (H)
- **Scope:** account-wide. Bar, upgrades and clouds are in `Dream` and `WeeklyBoss.d_*`. (H)
- **Inputs → outputs:**
  - **Fill:** time only. It fills during AFK gains and every 5 s in play, **except while standing in Equinox Valley**. It is **clamped at the requirement**: `Dream[0] = min(BarFillReq, Dream[0] + rate × t)` (@5025107, @10629084).
  - **Rate:** 60/h, or 90/h with the bundle, times the vial, cloud and arcade boosts and many W4+ multipliers ([TB: parsers/world-3/equinox.ts L75-151](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/equinox.ts#L75-L151)). Both fixtures show 84/h.
  - **Requirement after n upgrades bought:** `(120 + 40n) × 1.02^n` ([TB: equinox.ts L153-154](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/equinox.ts#L153-L154)).
  - **Output:** one upgrade level per full bar.
  - (H)

| Upgrades owned (n) | 0 | 1 | 2 | 3 | 5 | 10 | 20 | 30 |
|---|---|---|---|---|---|---|---|---|
| Bar requirement | 120 | 163 | 208 | 255 | 353 | 634 | 1,367 | 2,391 |
| Hours at 84/h | 1.4 | 1.9 | 2.5 | 3.0 | 4.2 | 7.5 | 16.3 | 28.5 |

**Dream Upgrades** ([TB: shared-data.json `equinoxUpgrades`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/shared-data.json); max-level bonuses from `Dreamstuff("UpgMaxLV")` @10800315 and [equinox.ts L182-255](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/equinox.ts#L182-L255)). Columns: "Unlock #" is how many of the 12 unlock clouds must be done; "Base max" is the max level before cloud bonuses; "Max-level boosts" are clouds that add levels. (H)

| # | Upgrade | Per level | Base max | Max-level boosts | Unlock # | Useful from |
|---|---|---|---|---|---|---|
| 0 | Equinox Dreams | +1 cloud visible (max 5 active) | 5 | — | 0 (always) | W3, buy first |
| 1 | Equinox Resources | unlocks a gatherable resource in the valley (own vial, no card) | 4 | — | 1 | W3 |
| 2 | Shades of K | +1 choice at the end of each Killroy run | 3 | — | 2 | W3–W4 |
| 3 | Liquidvestment | +9% excess liquid into cap/rate (Lab liquids) | 4 | +3 (cloud 6), +4 (cloud 15) | 3 | W4 |
| 4 | Matching Scims | +10% Damage, **its own multiplier** | 8 | +5 / +10 / +10 / +10 (clouds 12, 18, 34, 39) | 4 | W3+, top damage pick |
| 5 | Slow Roast Wiz | +1% tower dmg per second in Worship TD | 5 | +6 (cloud 32) | 5 | W3 Worship |
| 6 | Laboratory Fuse | +1 px Lab connection range | 10 | — | 6 | W4 |
| 7 | Metal Detector | +1% nugget size per small nug | 6 | — | 7 | W5 |
| 8 | Faux Jewels | +5% Drop Rate (additive) | 6 | +5 (cloud 21), +10 (cloud 26) | 8 | any |
| 9 | Food Lust | −20% Meal cost per random-event boss kill, stacks | 10 | +4 (cloud 25) | 9 | W4 |
| 10 | Equinox Symbols | +1 all talent levels (talents with ≥ 1 point) | 5 | +4 (cloud 30) | 10 | any |
| 11 | Voter Rights | +1% Ballot bonus multiplier | 15 | +15 (cloud 35) | 11 | any |
| 12 | Nonstop Studies | +3% Research EXP, own multiplier | 10 | many W5–W7 clouds | 12 | W7 |
| 13 | Hmm... | — | 2 | — | — | — |

- **Unlock rule:** upgrade *k* is unlocked once `1 + (number completed among clouds {0, 2, 5, 7, 10, 13, 17, 20, 23, 28, 31, 36}) > k`. It is a count, so any of those clouds counts ("UpgUnlocked" @10800315; [TB: equinox.ts L179-183](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/equinox.ts#L179-L183)). (H)
- **Which clouds show:** the active clouds are the **first `min(5, Equinox Dreams level)` not-yet-completed challenges in index order** ("CloudsOwned" @10800315; [TB: equinox.ts L64-73](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/equinox.ts#L64-L73)). So you can only work on early-index clouds until you clear them. Clouds 36+ also need Research grid node 86 (W7). (H)

**W1–W4-reachable clouds** (out of 77; the others are W5–W7 content):

| Cloud | Challenge | Reward | Reachable |
|---|---|---|---|
| 0 | Greenstack 20 different items (10M+ each) in storage | unlock next | late W3/W4 |
| 1 | 400 kills in one Killroy run | +1 trophy per Weekly Battle kill | W3–W4 |
| 2 | All characters Lv 100 | unlock next | W3–W4 |
| 3 | Total Refinery rank 30 | +10% bar rate | mid–late W3 |
| 4 | One 3D Printer sample ≥ 1M | new Star Talent | W4+ |
| 5 | Wave 50 on the first 6 Worship TD summons | unlock next | W4–W5 |
| 6 | All 5 difficulties of a Weekly Battle boss | +3 Liquidvestment max | later |
| 7 | Max 5 stat upgrades in the Dungeon Flurbo shop | unlock next | W3–W4 (Dungeons) |
| 8 | Vengeful Grandfrogger, difficulty 4 | Tick Tock book to Lv 200 | Dungeons |
| 9 | Construction Lv 300 on any character | +15% bar rate | W5+ |
| 13 | Total shrine level 140 | unlock next | W5+ |
| 14 | Inevitable Snakenhotep (W2 dungeon final boss) | +20% bar rate | Dungeons |
| 17 | Total Refinery rank 60 | unlock next | W4–W5 |
| 19 | Caustic Glaciaxus (W3 dungeon final boss) | +25% bar rate | Dungeons |

Data: [TB: shared-data.json `equinoxChallenges`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/shared-data.json). The full 77-row list is in that file. (H for the data; reachability is opinion)

- **Goals and Milestones:** Equinox Dreams 1 → 5 (5 bars, about 15 h of fill total at 84/h); the first unlock cloud (any of 0/2/5/7) → Equinox Resources; 4 unlock clouds → Matching Scims; bar-rate clouds 3, 14 and 19 (+10/+20/+25%). (H)
- **Feeds / fed by:**
  - **Fed by:** time; the Refinery (clouds 3, 17); Dungeons (7, 8, 14, 19); Killroy (1); levels (2); Worship TD (5); Construction (9, 15); Shrines (13); the 3D Printer (4); Alchemy vial `EqBar`; Arcade.
  - **Feeds:** damage (Matching Scims, its own multiplier); drop rate (Faux Jewels; the community drop-rate guide lists "Faux Jewels (Equinox)" as a W3 drop-rate source); all talent levels (Equinox Symbols); Killroy (Shades of K); Worship TD (Slow Roast Wiz); Lab (Fuse, Liquidvestment); Cooking (Food Lust); Vote Ballot (Voter Rights); new valley resources with Alchemy vials. (H)
- **Per-session actions:** if `currentCharge ≥ chargeRequired` and some unlocked upgrade has `lvl < maxLvl`, spend the bar (a Next Action). Otherwise, check whether a visible cloud is completable now. **Capped state:** a full bar is capped and is wasting fill. **Idle state:** a full bar with no purchasable upgrade (Dreams maxed, nothing else unlocked) is harmless, and the right action is "complete a cloud". Both fixtures sit at 120/120 with Equinox Dreams at 0. (H)
- **AFK Setup implications:** none directly, since the valley "cannot be AFK'd at" (wiki) and filling pauses while you stand in it. Do not leave a character parked in Equinox Valley. (H)
- **Min-max by stage** *(opinion)*:
  - **W3 on unlock:** Dreams ×5 → Equinox Resources → Matching Scims once unlocked (own multiplier, +10% per level) → Faux Jewels → Equinox Symbols. Cheapest unlock clouds: 3 (Refinery rank 30) for bar rate; 7 (Flurbo shop) or 0 (greenstacks) for unlocks.
  - **W4:** Liquidvestment and Laboratory Fuse for Lab, Food Lust for Cooking.
  - **W5+:** the clouds' bar-rate stack.
  - No class differences.
- **Common mistakes:** not farming the Mirror (detect: no Equinox Dreams level while W3 is reached; Toolbox's `unlocked` flag is unreliable, see below); a full bar left unspent (`currentCharge == chargeRequired`); spending on low-value upgrades before Dreams 5; not realising clouds show in index order.
- **Save and Toolbox fields:**
  - `account.equinox.{unlocked, currentCharge, chargeRequired, chargeRate, timeToFull, challenges[{label, goal, reward, current (−1 = done), active, locked}], upgrades[{name, bonus, desc, lvl, maxLvl, unlocked}], completedClouds, rawDream, breakdown}`.
  - Use `getEquinoxBonus(upgrades, name)` and `getCloudBonus(challenges, i)`.
  - **Caveat:** `unlocked` is `!!WeeklyBoss && !!Dream`, true even on the W2 fixture ([TB: equinox.ts L48-55](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/equinox.ts#L48-L55)). Treat a Mirror in inventory or storage, or Equinox Dreams ≥ 1, as the real unlock signal, and report the flag to Toolbox. (H)
- **Sources:** N.js `_customBlock_Dreamstuff` @10800315, bar fill @5025107 and @10629084, Bloodbone drops @14959602, mirror item @16382965; TB `parsers/world-3/equinox.ts`, `shared-data.json` (`equinoxUpgrades`, `equinoxChallenges`), `monsterDrops.json`; wiki [Equinox](https://idleon.wiki/wiki/Equinox) (rev 2026-10-10); "Idleon Incomplete Guide" DROP RATE GUIDE tab (undated, 2025-11 to 2026-08). v1.23.

## W3 bosses and keys

- **What it is:** **Chizoar**, the W3 world boss in Chizoar's Cavern (map 114, entered from Crystal Basecamp), fought with Chizoar's Cavern Keys at three difficulties; plus the W3 miniboss **Dilapidated Slush**. **Efaunt is the W2 boss.** He is listed here only because his guaranteed **Glacier Quartz** (`Crystal2`, inserted into every Efaunt kill's drops, N.js @4809559) is the W3 gate. His dossier belongs to W2. (H)
- **Unlocks:**
  - Chizoar's Cavern is reached through W3 (Crystal Basecamp, map 113, portal 120,000 kills, [TB: shared-data.json `mapPortals`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/shared-data.json)).
  - Entry costs **1 key (Normal), 5 (Chaotic), 50 (Blighted)** (wiki [Chizoar](https://idleon.wiki/wiki/Chizoar), rev 2026-10-02; not confirmed in code, M). Difficulty is `BossInfo[2][0]` = 0/1/2 → `Boss3A/B/C` (N.js @4820000). (H)
  - Dilapidated Slush is summoned by dropping a crafted **Bucket of Slush** on the snow pile at Refrigeration Station. The pile regrows after at least 4 login-days, and the spawn count is `min(10, floor((days − 3)^0.55))` from `OptionsListAccount[96]` ([TB: parsers/misc.ts L1515-1553](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L1515-L1553); wiki [Dilapidated Slush](https://idleon.wiki/wiki/Dilapidated_Slush), rev 2026-10-03). (H formula, M summon flow)
- **Scope:** keys are account items (the "add to your account" key bag). Boss kills are made by one character. Bellows' daily keys count characters (see below). (H)
- **Inputs → outputs:** keys plus an active fight give 3 drop-table rolls, **one guaranteed Galaxial Amethyst** (`Crystal3`, inserted on every Chizoar kill regardless of difficulty, N.js @4820956), and a merit-based Key3 chance (`Tasks[2][0][4]/25` per kill, @4821915). (H)

| Version | HP | Signature drops (base chance) |
|---|---|---|
| Chizoar (Boss3A) | 20M | Chizoar Card 0.7%, Frozen Obol of Chizoar's Rage 0.08%, Chizoar's Blankie 0.1%, **Chizoar Spike 30%**, Golden Ham / Golden Cheese (via table), statues |
| Chaotic Chizoar (Boss3B) | 250M | **Chaotic Chizoar Card 0.4%** (+5% shrine effects per card level), Obol 0.2%, Blankie 0.32%, Spike ×3 40%, **Chizoar Stalagmite 20%**. Counts for Bill Brr 7 |
| Blighted Chizoar (Boss3C) | 2B | Blighted card 0.2%, Obol 1%, Blankie 1.4%, Blighted Chizoar Shard Cape 0.03%, Spike ×7 50%, Stalagmite ×2 50% |
| Dilapidated Slush (mini3a) | 12.5M | **Chizoar's Cavern Key ×2 at 80%**, Slush Card 20%, Slush Skull 0.9% (a Worship skull, see Worship), Slushy Obol 0.4%, time candies |

Data: [TB: monsterDrops.json `Boss3A` L51502, `mini3a` L55098](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/monsterDrops.json#L51502), monsters.json HP; N.js drop tables @14959602–14960648. (H)

**Chizoar's Cavern Key sources** (H unless marked):

| Source | Amount | Gate |
|---|---|---|
| Bellows, daily | **+1 per character that has finished Bellows' 3rd quest**, banked up to 3 days (`OptionsListAccount[80]`) | Bellows 1–3 (NPCdialogue Bellows > 8.5), N.js @9461875; wiki [Bellows](https://idleon.wiki/wiki/Bellows) rev 2026-10-01 |
| Bellows quests 1–3 | 1 + 2 + 2, once per character | see W3 quests |
| Dilapidated Slush | 2 keys at 80% per kill, up to 10 spawns per pile | Bucket of Slush |
| Coldsnap Colosseum chests | ChestA3 4%, ChestB3 10%, ChestC3 18% | Colosseum tickets (N.js @14980569) |
| Chizoar kill | `merit level / 25` chance | W3 merit task (`Tasks[2][0][4]`) |
| Post Office shipments | some boxes | wiki only (M) |

- **Goals and Milestones:**
  - First Chizoar kill (Hoggindaz 9, Galaxial Amethyst → Carpenter Cardinal → W4).
  - First Chaotic kill (Bill Brr 7; Chaotic card for +5% shrine effects per level).
  - Chizoar Spike ×25 + Purple Salt ×100 + Void Imperium Helmet + Blood Bone ×1000 → Chizoar Helmet, needed for the Tundra Misc Completion Token ([TB: crafts.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/crafts.json)).
  - Card stars on Chizoar, Chaotic Chizoar and Slush.
  - (H)
- **Feeds / fed by:**
  - **Fed by:** keys (Bellows, Slush, Colosseum, merits, Post Office), damage and survivability, food.
  - **Feeds:** W4 access (Carpenter Cardinal), Hoggindaz 9 and Bill Brr 7, Shrines (Chaotic card), Golden Cheese (shrine EXP), Cards, Obols, equipment (Blankie, Chizoar Helmet, Shard Cape), the Death Note's miniboss row (Slush), and the Worship skull (Slush Skull; the community guide warns "DONT EQUIP SLUSH SKULL").
- **Per-session actions:**
  - Claim Bellows' banked keys before 3 days pass: detect `accountOptions[80] ≥ 3` (wasted after that).
  - Spend keys when Toolbox damage beats the boss: Chaotic (5 keys) for the card once Normal is trivial.
  - Summon Slush when the pile is at a worthwhile count (`getMiniBossesData` `current`; max 10).
  - Idle signals: keys sitting unused while the boss is farmable; Bellows bank at 3; Slush pile at 10. *(opinion for thresholds)*
- **AFK Setup implications:** none. Bosses are active play (an Active Play suggestion, never a Verdict). The Colosseum is active too. (H)
- **Min-max by stage** *(opinion)*:
  - **Early W3:** finish Bellows 1–3 on the pusher first (needs Tachion for quest 3), then on every character for daily keys.
  - **Mid W3:** first Chizoar kill for the Amethyst, while holding it until Carpenter Cardinal.
  - **Late W3:** farm Chaotic for the card and Stalagmites. Slush whenever the pile has stacked.
  - **W4+:** Blighted for the cape and obol.
  - **Per class:** ranged classes have the easier time (wiki tactics). No code gate.
- **Common mistakes:**
  - **Only one character finishes Bellows:** detect the count of `characters[].npcDialog.Bellows > 8.5`. Both fixtures: 0.
  - **Bellows' bank left full:** both fixtures have `accountOptions[80] ≥ 3`, i.e. 5 and 4 days accrued with no eligible character, so nothing is lost yet.
  - **Equipping the Slush Skull.**
  - **Selling the Galaxial Amethyst or the boss tokens.**
- **Save and Toolbox fields:**
  - Key counts: storage/inventory `Key3`.
  - `account.accountOptions[80]` (Bellows days banked), `[96]` (days since the Slush pile was used).
  - `characters[].npcDialog.Bellows`.
  - Toolbox `getMiniBossesData(account)` ([TB: misc.ts L1533](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L1533)) for Slush.
  - `account.finishedWorlds.World3` (Toolbox: true once a character has talked to Carpenter Cardinal past the exit, [TB: parsers/quests.ts L27-43](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/quests.ts#L27-L43)).
  - Card levels: `account.cards` (`Boss3A`, `Boss3B`, `Boss3C`, `mini3a`).
  - (H)
- **Sources:** N.js Boss3 kill handler @4820000–4821915, Bellows daily keys @9461875, drop tables @14959602 and @14960648, Colosseum chests @14980569; TB `monsterDrops.json`, `monsters.json`, `crafts.json`, `parsers/misc.ts`, `parsers/quests.ts`, `shared-data.json` (`mapNames`, `mapPortals`); wiki [Chizoar](https://idleon.wiki/wiki/Chizoar) (2026-10-02), [Efaunt](https://idleon.wiki/wiki/Efaunt) (2026-10-02), [Dilapidated Slush](https://idleon.wiki/wiki/Dilapidated_Slush) (2026-10-03), [Bellows](https://idleon.wiki/wiki/Bellows) (2026-10-01). v1.23.

## W3 quests (Frostbite Tundra)

- **What it is:** the eleven Frostbite Tundra NPCs' quest chains. They teach the W3 systems and pay time candies, stamps, keys, gems, reset potions, two trophies and the W4 gate.
- **Unlocks:** each NPC is on a W3 map. The W3 Toolbox world group (index order) is: Hoggindaz (Frostbite Towndra) 0, Worldo (Inside the Igloo / Igloo's Basement) 1, Lord of the Hunt (Trappers Folley) 2, Lonely Hunter (Snowfield Outskirts) 3, Snouts (The Stache Split) 4, Shuvelle (Mamooooth Mountain) 5, Yondergreen (Signature Slopes) 6, Crystalswine (Cryo Catacombs) 7, Bill Brr (Overpass of Sound) 8, Bellows (Crystal Basecamp) 9. Carpenter Cardinal, the town gatekeeper, is outside the group ([TB: parsers/quests.ts L280-319](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/quests.ts#L280-L319); `npcPlacements`). No quest has a level requirement in data. (H)
- **Scope:** **per character** (`characters[].quests[NPC][i]`: 1 done, 0 in progress, −1 or absent not started). Rewards go to that character's inventory. Once-only account effects (stamps, trophies, tokens) need only one completion. Bellows' daily key counts per character. (H)
- **Inputs → outputs:** the full chains are below. "Custom" quests are tracked in-game; "Items" quests need items held, and are consumed unless noted ([TB: data/website-data/quests.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/quests.json), Hoggindaz from L6311). (H)

| NPC | # | Quest | Requirement | Key reward |
|---|---|---|---|---|
| **Hoggindaz** | 1 | Turn ON for what??? | Redox Combustion on, 24 h of fuel | 3 gems |
| | 2 | Trapping with the Lord | buy a trap, place one in the Jungle (needs Lord of the Hunt 1) | 1 h candy, 4 gems |
| | 3 | Constructing a Tower | 3D Printer and Wizard Defender built, 1 cog made (on this character) | **Printer Sampling talent book** |
| | 4 | Monke Tower Time! | summon Goblin Gorefest TD, place 4 towers | 1 h candy |
| | 5 | Taking Samples | take 2 Printer samples | **Shrine Architect talent book** |
| | 6–8 | Voter Recognition / Appeasement / Apathy | Shuvelle's, Yondergreen's, Bill Brr's votes | 3× 2 h, 2× 4 h, 1× 12 h candy |
| | 9 | Chizoar No More | defeat Chizoar | Hoggi Token, EXP balloons |
| | 10 | The Fresh Prince of the Tundra | Tundra NPC + Skills + Misc Completion Tokens | **Frost Prince trophy** |
| **Worldo** | 1 | Odd Jobs for Cold Hard Cash | 15 jobs in the Glacial Basement dungeon | dungeon card pack, 3 loot dice |
| | 2 | Can't Guard if you're Dead! | 12 Ice Guards in one run | pack, 4 dice |
| **Lord of the Hunt** | 1 | Pelt for the Pelt God | 10 Shrapshell, 12 Snake Skin, 1 Cardboard Trap | trap, 2× 12 h candy |
| | 2–10 | Froge → Crabbo → Scorpie → Mousey → Owlio → Pingy → Bunny → Dung Beat → Honker | 100 → 65,000 critters plus shiny variants | candies, 10 gems ×2, **Star Talent Reset Potion** (8), **4 Talent Point Reset Potions** (9), **Post Office Box Reseto Magnifico** (10) |
| | 11 | To Trap or not to Trap | hold 500 Crescent Scorpie, 250 Eternal Lord, 100 Diamond Duck (not consumed) | **Critter Baron trophy** |
| **Lonely Hunter** | 1–3 | Leaf / Skeletons / Opening Chests | leaves; 5 Xylobones; Colosseum chests 7/3/1 | candy, Colosseum tickets, token |
| **Snouts** | 1 | A Salty Fall | 30 Redox Salts | **Buckler Stamp** |
| | 2 | Gravity VS Salt | 50 Explosive Salts | **Feather Stamp, Purp Froge Stamp** |
| | 3 | Big Ol Chonker | kill a giant Stache (**needs Tachion of the Titans**) | **Talent III Stamp, Biblio Stamp** |
| | 4 | Mana Plox | 250 Decent Mana Potions | token, 4 h candy |
| **Shuvelle** | 1–7 | Mayoral Luck … Dig Diggily Dig | 6 tusks in time; 200 Mosquisnow; hold 8,000 tusks; Ice Age 3 DVD; shovel drops (quest-only drops) on 3 maps | dice, candies, 2,000 Sentient Cereal + 2,000 Jellyfish, **Shuvelle's Vote**, token |
| **Yondergreen** | 1 | Infrastructure Plan | **place 4 shrines on Signature Slopes** | dice |
| | 2–4 | Economic Policy / Big Tech / Legislative Action | 75 coins on ground; a 20-pen Printer sample; 4 Signed Contracts (active kills only) | dice, candy, **Yondergreen's Vote** |
| | 5–7 | No Snapping / Keep Away / Ad Solidarity | **idle exactly 4h10m at Stache / 9h33m at Flakes / 21h51m at Bop Boxes** (± a few minutes) | 4 h, 12 h, 24 h candy, token |
| **Crystalswine** | 4–6 | Melting the Snakes / Sunrunning / Global Warming | timed clears of Cryo Catacombs (20 / 59 / 168 mobs) | **Hermes Stamp** (4), token (5), **Avast Yar Stamp** + 24 h candy (6) |
| **Bill Brr** | 1–7 | Odd Damage … Hatin' on the Green One | puzzles; 5×1 h + 2×2 h candies; **Chaotic Chizoar kill** (7) | candies, gems, **Bill Brr's Vote** (4), token (7) |
| **Bellows** | 1 | Poking Some Eyes Out | 50 Neyeptunes, active | 1 key |
| | 2 | Eyexperience | 3,200 EXP from one Neyeptune kill | 2 keys |
| | 3 | Veyebing | kill a giant Neyeptune (**Tachion**) | 2 keys, **unlocks the daily key** |
| | 4 | Optometric Hoarder | hold 4 Black Lense + 14,000 Contact Lense | token |
| **Carpenter Cardinal** | 1 | Restoring Power … to a Portal | Galaxial Amethyst (from Chizoar) | Cosmic Time Candy, 1.5B coins, **W4 portal** |

Completion tokens (Anvil crafts, [TB: crafts.json L9872](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/crafts.json#L9872)):

- **NPC token** = Easy (Lonely Hunter + Hoggi + Snouts) + Med (Shuvelle + Yondergreen + Crystalswine) + Hard (Bellows + Bill Brr).
- **Skills token** = 12,500 Frigid Souls + 4 Jade Scarab + Refurbished Cog.
- **Misc token** = Chizoar Helmet + Neutron Ice Ring + 10 Nullo Salt + 60 Black Lense.

(H)

- **Goals and Milestones:** the W4 portal (Carpenter Cardinal); the 6 stamps (Snouts ×5 kinds, Crystalswine ×2); Bellows 3 per character; the Lord of the Hunt ladder (tracks Trapping); the Frost Prince and Critter Baron trophies; total distinct quests completed (`account.totalQuestsCompleted`), which drives the first-page Star Talents and the 300-quest Equinox cloud 44. (H)
- **Feeds / fed by:**
  - **Fed by:** Refinery (Hoggi 1, Snouts 1–2), Trapping (LotH), Construction (Hoggi 3), Worship TD (Hoggi 4), the 3D Printer (Hoggi 5, Yondergreen 3), Shrines (Yondergreen 1), Prayers (Tachion for Snouts 3 and Bellows 3), Chizoar, Dungeons (Worldo), Colosseum (Lonely Hunter).
  - **Feeds:** Stamps, Time Candy (AFK), Star Talents (Printer Sampling, Shrine Architect, plus the reset potion), talent resets, Post Office (the box reset), W3 bosses and keys, Equinox (quest count), and W4 access. (H)
- **Per-session actions:**
  - Any quest whose condition is already met in the Account State is a cheap Next Action: items held, a shrine count on the map, prayer owned.
  - **Yondergreen 5–7 are AFK-Setup-native:** when Expected Return ≈ 4h10m, 9h33m or 21h51m, suggest idling that character on that map.
  - Watch for "in progress" quests on characters that should be doing something else.
  - Idle state: none. Quests never expire. Shuvelle 1 ("FORFEIT the quest in the codex" if failed) is the only failure state.
  - *(opinion for the routine)*
- **AFK Setup implications:** Yondergreen 5–7 (exact-duration idle), Shuvelle 3 (hold 8,000 tusks, so AFK on Mamooooth Mountain until reached), Lord of the Hunt (trap placement, see Trapping), and Bellows 4 (14,000 Contact Lense from Neyeptunes, held). (H data, opinion)
- **Min-max by stage** *(opinion; the community W3 tab says "talk with Hoggindaz and complete his quests … please don't ignore his quests"; Incomplete Guide, undated, 2025-11 to 2026-08)*:
  - **Early W3:** Hoggindaz 1–5 on the first W3 character (they unlock the systems and both talent books); Lord of the Hunt 1 (traps); Snouts 1–2 (3 stamps).
  - **Mid W3:** Tachion → Snouts 3 and Bellows 1–3 on the pusher, then Bellows 1–3 on each other character (each adds +1 key per day for good); Crystalswine 4–6 (2 stamps); Yondergreen as AFK fits; the vote chain for Hoggi 6–8 candies.
  - **Late W3:** Chizoar → Hoggi 9 → Carpenter Cardinal (W4); Bill Brr 7 (Chaotic); keep the Lord of the Hunt ladder alongside Trapping.
  - **W4+:** the completion tokens and Frost Prince, Critter Baron.
  - **Per class:** none in data. Bill Brr's damage puzzles and the timed Crystalswine clears favour a high-damage pusher.
- **Common mistakes:**
  - **Skipping Bellows on alts:** lost daily keys forever.
  - **Selling NPC tokens:** the item text says DON'T SELL.
  - **Not using Tachion before the giant quests.**
  - **Forgetting Snouts' stamps:** detect from `characters[].quests.Snouts`.
  - **Leaving quest-only drops** (Shuvelle 5–7 shovels) on the table by finishing a quest on every character before collecting: Toolbox's `missableDrops` flags these ([TB: parsers/quests.ts L7-25](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/quests.ts#L7-L25)).
- **Save and Toolbox fields:**
  - `characters[].quests[NPC]` (index → status).
  - `account.quests.Frostbite_Tundra[]` = `{name, index, npcQuests[{Name, rewards, itemReq, customArray, completed[{charIndex, status}], progress[...], missableDrops}]}`. Both fixtures: Shuvelle 1 done on one character, nothing else in W3.
  - `characters[].npcDialog[NPC]`, `account.totalQuestsCompleted`, `account.finishedWorlds.World3`.
  - (H)
- **Sources:** TB `data/website-data/quests.json`, `parsers/quests.ts`, `crafts.json`, `items.json`, `monsterDrops.json`, `shared-data.json` (`npcPlacements`, `mapNames`); N.js Bellows dialogue @15502866–15504031; wiki [Hoggindaz](https://idleon.wiki/wiki/Hoggindaz) (2026-09-27), [Bellows](https://idleon.wiki/wiki/Bellows) (2026-10-01); "Idleon Incomplete Guide" WORLD 3 GUIDE tab (undated). v1.23.

---

## Flags for later tickets

- **Ticket wording:** "W3 bosses (Efaunt…)". Efaunt is W2. The W3 world boss is Chizoar.
- **ADR 0005 gap:** Toolbox computes shrine EXP rate and prayer cost, but not `ShrineHrREQ` (the time-to-next-shrine-level) or the prayer slot count. Both are small lookup or closed-form expressions. The decision ticket should rule whether we own them or upstream them to Toolbox.
- **Toolbox bug candidate:** `equinox.unlocked` is true on a pre-W3 account.
- **Fixture observations (aggregate):**
  - The W3 account: 2 shrines at Lv 1 parked in W1 town; 2 prayers owned at Lv 1 and 0 equipped (2 slots available); Equinox bar full with Dreams 0; no character past Bellows; 1 of about 60 W3 quests done.
  - The W2 account: nothing W3 yet.
- **Not verified in code:** key counts per Chizoar difficulty (1/5/50, wiki), Post Office key boxes, the exact Shrine Architect placement gate, and the TD-zone-to-world mapping for the prayer unlock column.
- **Reddit:** not reachable this session (rate-limited). The priority orders above are opinion pending a human or Reddit pass.

## Sources

- Game client: [legendsofidleon.com/ytGl5oc/N.js](https://www.legendsofidleon.com/ytGl5oc/N.js), Last-Modified 2026-10-17 01:42:35 GMT, v1.23 Luminous Menagerie. Symbols: `_customBlock_Shrine` @7820782; `_customBlock_WorkbenchStuff("ShrineExpBonus"|"ShrineHrREQ")` @7818593; AFK shrine loop @5584803; shrine placement @4645476; `_customBlock_prayersReal` @7822186; `_customBlock_WorshipStuff("PrayerCost")` @7763052; prayer menu @7673614 and @7733424 (slots: classes 32/34/35, `RANDOlist[9]`, `GemItemsPurchased[114]`); `_customBlock_Dreamstuff` @10800315; Equinox bar fill @5025107 and @10629084; Boss3 kill (Galaxial Amethyst, merit key) @4820000–4821915; Boss2 kill (Glacier Quartz) @4809559; Bellows daily key @9461875; drop tables `skele2`, `Boss3A`, `mini3a` @14959602–14960648; Colosseum chests @14980569; Equinox Mirror item @16382965; Bellows dialogue @15502866.
- IdleOn Toolbox [@ 6827d3f (2026-10-17)](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1): [`parsers/world-3/shrines.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/shrines.ts), [`parsers/world-3/prayers.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/prayers.ts), [`parsers/world-3/equinox.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/equinox.ts), [`parsers/quests.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/quests.ts), [`parsers/misc.ts` L1515-1553](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L1515-L1553), [`utility/dashboard/characters.js`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/characters.js), `data/website-data/{shared-data, quests, monsterDrops, monsters, items, crafts, talents, gemShop, randomList}.json`.
- idleon.wiki (tier 2; each page's latest revision, read 2026-10-17 via `api.php`): [Construction](https://idleon.wiki/wiki/Construction) 2026-10-07; [Prayers](https://idleon.wiki/wiki/Prayers) 2026-10-03 (its "v1.50" note is from 2022, but it agrees with the data); [Equinox](https://idleon.wiki/wiki/Equinox) 2026-10-10; [Chizoar](https://idleon.wiki/wiki/Chizoar) 2026-10-02; [Efaunt](https://idleon.wiki/wiki/Efaunt) 2026-10-02; [Dilapidated Slush](https://idleon.wiki/wiki/Dilapidated_Slush) 2026-10-03; [Bellows](https://idleon.wiki/wiki/Bellows) 2026-10-01; [Hoggindaz](https://idleon.wiki/wiki/Hoggindaz) 2026-09-27; [Worship](https://idleon.wiki/wiki/Worship) 2026-10-07. Page dates are not claim dates (see `research/meta-sources`). Every wiki claim used here was checked against code, except those marked M.
- Community (tier 3, cite only): "Idleon Incomplete Guide" by @shadowstorm2204, [htmlview](https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview), the WORLD 3 GUIDE and DROP RATE GUIDE tabs (undated; post-W7, pre-Royal-Guardian). This is **older than v1.23: Stale**.
- Prior Forge research: [mechanics](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md) (the Unending Energy 10 h clamp), [meta-sources](https://github.com/YassSoliman/idleon-forge/blob/research/meta-sources/docs/research/2026-10-16-meta-sources.md) (wiki date rules), `research/community-guides` (sheet catalogue).
