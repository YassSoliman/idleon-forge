# System Dossiers: Worship, Trapping, Death Note (2026-10-17)

Part of ticket [#22](https://github.com/YassSoliman/idleon-forge/issues/22) (World 3 account systems). Format: [`SYSTEM-DOSSIER.md`](../../SYSTEM-DOSSIER.md). Terms: [`GLOSSARY.md`](../../../../GLOSSARY.md).

**Patch and sources.** Current patch is game v1.23 *Luminous Menagerie* (2026-10-16/17).
- **Game client:** `N.js` from `legendsofidleon.com/ytGl5oc/N.js`, Last-Modified 2026-10-17 01:42 GMT, newest patch note `Luminous_Menagerie_v1.23`. Findings are cited by symbol and `@offset` in that exact file (see the [mechanics research](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md) for how to fetch it). Offsets shift each patch, but the names stay stable.
- **Toolbox:** [Morta1/IdleonToolbox @ 6827d3f (2026-10-17)](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1). It is abbreviated **TB** below. Its links are to that commit.
- **Wiki:** idleon.wiki, read through `api.php` on 2026-10-17. The revision date of each page is given at the point where it is cited.
- **Confidence:** **H** means read directly in code or game data. **M** means my reading of minified control flow, or community opinion.

## Answer

- **Worship is gated by charge, not by minigame plays.** Each character banks its own charge (`PlayerStuff[0]`) at roughly 1.2–4.4 charge/h. Both starting a Tower Defence run (SUMMON) and the one-click **WORSHIP** claim cost the totem's charge requirement: 25, 40, 60 or 90 for the four W1–W3 totems. The WORSHIP claim pays Worship EXP and that totem's Soul, scaled by that totem's best wave. (H)
- **The skull sets max charge.** With no skull, max charge is floored at 50 and fills in about 38 h. Even the Wax Skull from the Frostbite Towndra vendor doubles the cap to 100, and later skulls reach 6,000. The W3 test save had **no skull on any of its 6 characters**. Stocking a skull is the first Worship Next Action for every character. (H)
- **The Worship Next Action:** spend charge before it caps (Toolbox alerts at 95%), using WORSHIP clicks on the totem with the best EXP per charge. Toolbox computes this per totem as "Exp Per Charge". Push waves only to cross Prayer-unlock Milestones (waves 10/25/51/81/121 on Goblin Gorefest, and so on). (H for the mechanics, M for the priority)
- **Trapping runs in real time, independent of what the character is doing.** Traps never compete with the AFK activity. The only AFK Setup rule is: every trap slot is filled, with a trap whose timer ends at or after the Expected Return. A character can place as many traps as its trap set's tier (1–7), +1 for everyone once Call Me Ash has at least one level. (H)
- **Toolbox's trap table has a mislabelled column.** For Silkskin, Steel and Royal traps, the third column is the **shiny multiplier**, and EXP is fixed at ×1 (`TrappingStuffs("TrapRareBonus"/"TrapEXPBonus")`). Use **Natural traps (EXP only), Cardboard, Wooden or Meaty traps for EXP**, and short Silkskin/Royal traps for shinies. A shiny rolls once per trap, so shorter traps give more rolls per hour. (H)
- **Base critters per trap = 10, +1 for each Lord of the Hunt quest from 2 to 11 (up to +10),** plus Trapper Drone levels, the Goosey Glug vial and other bonuses. Without a Hunter, collect rates are floored at 50% critters and 40% EXP, because Eagle Eye is missing. (H)
- **The Death Note does nothing until its Construction building is built.** Multikill needs Death Note building ≥ 1 (`0.5 < TowerInfo[2]`), max damage ≥ 2× the monster's HP, and accuracy > 1.5× its defence. **The W3 test save had the building at level 0, so it had no multikill at all.** (H)
- **Death Note ranks per mob:** 25k kills = 1 point, then 100k = 2, 250k = 3, 500k = 4, 1M = 5, 5M = 7 and 100M = 10, plus 20 points at more than 1B kills with the Rift's Eclipse Skulls. Each point adds +1% multikill per damage tier, **only in that world**. The miniboss page counts everywhere, but needs a W6 unlock. The W1, W2 and W3 pages max at 150, 110 and 140 points. (H)
- **W3 Milestones to track:** Copper skull (100k) on every W1 mob, Golden (500k) on every W2 mob, and Dementia (5M) on every W3 mob, for three achievements. The bigger one is **1M kills on all 40 W1–W3 mobs**, step 1 of the Nebulyte quest, which leads to the Voidwalker (Maestro elite, W4). (H)
- **The Death Note feeds** the Multikill per Tier stat, the Rift's Eclipse Skulls (+5% multiplicative damage each), Tome (kill digits), the Lab's Fungi Finger Pocketer (Green Mushroom kills / 1M), Hole measurements (W5) and the Menagerie (W7). Kills come from every character combined, including the extra kills from multikill and from the Fibers of Absence prayer. (H)

---

## Worship

- **What it is:** a World 3 skill specialised for the Wizard (efficiency from Wisdom). Each character banks Worship **charge** over time and spends it at a **totem**, either on a Tower Defence (TD) run or on a one-click WORSHIP claim that pays Worship EXP plus that totem's **Soul**. Wiki [Worship](https://idleon.wiki/wiki/Worship), revision 2026-10-07 (one patch before v1.23; its tables are module-generated). (H)
- **Unlocks:**
  - The first totem, Goblin Gorefest, is in **W1 Forest Outskirts** and needs Worship Lv 1. The rest unlock by **Worship level** (see the table below). (H: TB `shared-data.json` `totems`; [`parsers/world-3/worship.ts` L25-46](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/worship.ts#L25-L46) maps them to maps 26, 63, 30, 107, 155, 208, 259 and 308.)
  - The first skull, the **Wax Skull**, and Cardboard Traps are sold by the **Frostbite Towndra** (W3 town) vendor (H: TB `shared-data.json` `shops[4]`). Higher skulls are crafted at the Anvil from Souls and salts.
  - TD towers are W3 **Construction** buildings: Pulse Mage, Fireball Lobber, Boulder Roller, Frozone Malone, Stormcaller, Party Starter, Kraken Cosplayer, Poisonic Elder and Voidinator, each max Lv 50. A tower is usable in TD once its building is at level 1 or more (`WorshipStuff("isTowerUnlocked?")`: `1 <= TowerInfo[9+b]`, N.js @7757584). Building costs belong to the Construction dossier. (H)
- **Scope:**
  - **Per character:** charge, max charge, charge rate, the equipped skull (`EquipmentOrder[1][5]`), Worship level and efficiency, and active prayers. Each character has to WORSHIP on its own.
  - **Account-wide:** the best wave per totem (`TotemInfo[0]`), Souls (in Storage), TD tower levels (Construction), and the Prayers unlocked. (H)
- **Inputs → outputs:**
  - **In:** time (charge accrues during AFK and active play), the charge cost per totem, and active TD play to push waves. Starting TD points are `5 + Crab Juice vial + card 55 + arcade 15 + "WorshipPTS" stamps (Banked Pts) + Post Office box 18c + 200 × Equinox cloud 27` (N.js `_GenINFO[51]` @7571963, H).
  - **Out (the WORSHIP claim, `_customEvent_TrapStuff "ZZZ"` @7704485):**
    - Charge −= the totem's charge requirement.
    - Worship EXP = `floor(15·(totem+1)²·WorshipEXPmulti·WaveMulti^0.9)`.
    - Souls = `floor(5·(1+effBonus/100)·WaveMulti·(1+food+Dementia set+Bubba)/100…·Species Epoch·arcade·vault)`.
    - `WaveMulti = ((5+bestWave)/10)^2.6`, or 0 if the totem was never played.
    - `effBonus = floor(100·(eff/(10·minEff))^0.25)` when efficiency ≥ the totem's minimum efficiency, else 0.
    - Source: N.js `WorshipStuff("ExpRewards"/"SoulRewards"/"WaveMultiplier"/"EfficiencyBonusQTY")` @7760043–7761028; TB `getTotemExpReward`/`getSoulsReward` [L50-65, L135-144](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/worship.ts#L50-L144). (H)
  - **SUMMON:** costs the same charge (N.js @7571659). Wave records unlock Prayers and set WaveMulti. (H)
  - **Souls are spent on:** skulls (Anvil), Prayers (unlock and level costs, `WorshipStuff("PrayerCost")` @7763052), vials (Sippy Soul = Tab 2 talent points, Chonker Chug = Talent Library speed, Slowergy Drink = base multikill, Spook Pint, Oozie Ooblek, Refreshment, Octosoda), stamps (SpoOoky = Worship efficiency, Banked Pts, Hermes = AGI, Intellectostampo = WIS, Summoner Stone), Construction buildings (the Death Note needs Forest Souls) and Smithing recipes. Sources: TB `vials.json`, `stamps.json`, `crafts.json`; wiki Death Note template. (H)

**Totems** (TB `shared-data.json` `totems`, `prayers`; wiki `{{#invoke:Worship|totems}}`):

| # | Totem | Map (world) | Worship Lv | Charge per run/claim | Min eff. for bonus Souls | Soul | Prayer unlocks at best wave |
|---|---|---|---|---|---|---|---|
| 1 | Goblin Gorefest | Forest Outskirts (W1) | 1 | 25 | 60 | Forest | 10 Big Brain Time, 25 Skilled Dimwit, 51 Unending Energy, 81 Shiny Snitch, 121 Zerg Rushogen |
| 2 | Wakawaka War | Up Up Down Down (W2) | 10 | 40 | 250 | Dune | 11 Tachion of the Titans, 31 Balance of Precision, 71 Midas Minded, 101 Jawbreaker |
| 3 | Acorn Assault | The Roots (W1) | 30 | 60 | 1,000 | Rooted | 21 The Royal Sampler, 41 Antifun Spirit, 71 Circular Criticals, 111 Ruck Sack |
| 4 | Frosty Firefight | Rollin' Tundra (W3) | 40 | 90 | 3,000 | Frigid | 21 Fibers of Absence, 51 Vacuous Tissue, 121 Beefy For Real |
| 5 | Clash of Cans | Mountainous Deugh (W4) | 50 | 120 | 8,000 | Squishy | 21 Balance of Pain, 51 Balance of Proficiency, 131 Glitterbug |
| 6 | Citric Conflict | OJ Bay (W5) | 60 | 250 | 20,000 | Oozie | (none in data) |
| 7 | Breezy Battle | Above the Clouds (W6) | 80 | 500 | 150,000 | Breezy | (none in data) |
| 8 | Pufferblob Brawl | Puffpuff Overpass (W7) | 100 | 1,000 | 2,500,000 | Deepsea | (none in data) |

Base EXP per WORSHIP before multipliers is `15·(totem+1)²`: 15, 60, 135, 240, 375, 540, 735 and 960. Per charge that is 0.60, 1.50, 2.25, 2.67, 3.13, 2.16, 1.47 and 0.96. At equal best waves, Frosty Firefight is the best EXP per charge in W1–W3 and Clash of Cans is the best overall. Community reports agree: "Clash of Cans" is the best, and "even wave-pushed W4 is still the highest exp/charge" ([r/idleon, 2026-08-02](https://reddit.com/r/idleon/comments/1vdrtqi/best_worship_tower_for_highest_xp_gain/), M). The real ranking depends on your best waves. Use Toolbox's per-totem **Exp Per Charge** ([`components/account/Worlds/World3/Worship/Totems.jsx` L66](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/components/account/Worlds/World3/Worship/Totems.jsx#L66)). Do not hard-code it.

**Skulls** (TB `items.json`: `lvReqToEquip` is the Worship Lv to equip, `lvReqToCraft` is the max charge, `Speed` is the charge speed; recipes from `crafts.json`). The rates below come from TB `getChargeRate` with no other bonuses, at Worship Lv 1 and Lv 50. They are illustrative only: ActiveOn must read `characters[].worship.chargeRate` (ADR 0005).

| Skull | Worship Lv | Base max charge | Speed | Charge/h (Lv 1 / Lv 50) | Hours to fill at Lv 50 | Source / recipe |
|---|---|---|---|---|---|---|
| none (Blank) | — | 50 (floor) | 3 | 1.24 / 1.33 | 38 | — |
| Wax | 1 | 100 | 4 | 1.34 / 1.45 | 69 | Frostbite Towndra vendor |
| Ceramic | 10 | 200 | 5 | 1.48 / 1.61 | 124 | 250 Forest Soul + 5 Redox Salts |
| Horned | 25 | 400 | 5 | 1.48 / 1.61 | 248 | 1,200 Dune Soul + 25 Redox |
| Prickle | 35 | 750 | 6 | 1.65 / 1.82 | 411 | Horned + 7,000 Rooted Soul + 50 Redox |
| Manifested | 40 | 1,250 | 7 | 1.89 / 2.12 | 590 | Prickle + 8,000 Frigid Soul + 5 Dense Water |
| Glauss | 50 | 1,750 | 7 | 1.89 / 2.12 | 826 | Manifested + 40,000 Frigid + 1,000 Dioxide Synthesis |
| Luciferian | 60 | 2,500 | 8 | 2.23 / 2.55 | 982 | Glauss + 60,000 Squishy Soul |
| Slush | 10 | 1,000 | 2 (slower!) | 0.58 / 0.60 | 1,656 | 0.9% drop from **Dilapidated Slush** (the W3 miniboss `mini3a`, N.js drop table @14960581); only a crafting input |
| Dreadnaught | 70 | 3,000 | 9 | 2.72 / 3.22 | 931 | Slush + Luciferian + 125k Oozie + 10k Nullo |
| Cultist | 90 | 3,600 | 9 | 2.72 / 3.22 | 1,117 | Dreadnaught + 3M Oozie + 125k Spontaneity |
| Crystal Skull of Esquire Vnoze | 120 | 4,200 | 10 | 3.55 / 4.44 | 946 | Cultist + 5M Breezy + 50k Godshard Bar |
| Prehistoric | 150 | 6,000 | 10 | 3.55 / 4.44 | 1,351 | Crystal + 50k Deepsea + 5k Nullo |

- **Max charge** = `max(50, Max_Charge cards + Crate of the Creator (Post Office) + Charge Syphon buff + Max_Charge stamps + Gospel Leader bubble·floor(WorshipLv/10) + skull max charge·max(Call Me Pope,1))`.
  - The Gospel Leader bubble only counts for Wisdom-main classes (the Mage line).
  - Source: TB `getMaxCharge` [L146-159](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/worship.ts#L146-L159). (H)
- **Charge rate** rises with skull speed, Worship level, the Call Me Pope bubble (×, equipped), Charge_Rate cards and stamps, and the Wizard talent **Nearby Outlet** (×). Source: TB `getChargeRate` [L164-182](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/worship.ts#L164-L182). (H)
- **Wizard Charge Syphon** (talent 475): "Steal charge from all your players, giving you {% of it. +}% Max Charge for 1 Min". Toolbox's `getChargeWithSyphon` [L206-219](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/worship.ts#L206-L219) predicts the overflow time (`timers.General.syphonCharge`). (H)
- **In-run TD currency:** each kill pays points by enemy skull rank (`WorshipStuff("SkullCurrency")` @7761549, ×(1 + Salt Lick upgrade 6)). The totem has 5 HP, plus Gaming superbits (`TotemHPtotal`). (H)

- **Goals and Milestones:**

| Goal | Milestones | Reward | Source |
|---|---|---|---|
| Unlock totems | Worship Lv 10 / 30 / 40 (W1–W3); 50 / 60 / 80 / 100 (W4–W7) | New Soul type, better EXP per charge | TB `totems` (H) |
| Prayer unlocks | Best wave per totem, as in the totem table | Prayers (see the Prayers dossier) | TB `prayers.unlockWave` (H) |
| Skull upgrades | Worship Lv 10 / 25 / 35 / 40 / 50 / 60 / 70 / 90 / 120 / 150 | Max charge 200 → 6,000, faster rate | TB `items.json` (H) |
| Total waves (sum of best waves) | Every 10 waves | MSA Totalizer bonuses (W5 Gaming; ×1.75/×2/×1.5 with the Jade expanders), Tome entry | TB `getTotalizerBonuses` [L67-109](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/worship.ts#L67-L109); [`tome.ts` L326](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-4/tome.ts#L326) (H) |
| Achievements | "There Can Be Only 1" (wave 50 Wakawaka with ≤ 1 of each tower, Steam), "Fat Souls" (exactly 10,000 Dune Souls in storage: +15 TD starting points) | Gems, candy, TD points | N.js achievement table @14728514 (H) |
| Trapping + Worship ≥ 100 (Voidwalker) | Each combined level above 100 | Species Epoch: +% Critters and Souls | TB [L111-123](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/worship.ts#L111-L123) (H) |

- **Feeds / fed by:**
  - **Feeds:** Prayers (unlocks and Soul costs); Alchemy vials and stamps (Souls); Construction (Souls for buildings, for example the Death Note); Smithing (Soul recipes); Gaming MSA Totalizer and Tome (total waves); the Unending Energy AFK cap (via Prayers).
  - **Fed by:** Construction (TD tower buildings and the Salt Lick), Refinery salts (skull and tower costs), Alchemy (Call Me Pope, Gospel Leader, Crab Juice), Stamps, Cards, Post Office, Arcade, Upgrade Vault ("Critters 'n Souls"), Bubba, Equinox (cloud 27), Gaming superbits, the Dementia armour set, and the Wizard talents. (H)
- **Per-session actions:**
  1. For each character with `currentCharge ≥ chargeReq` of the best EXP-per-charge totem, go to that totem's map and WORSHIP until the charge is below the cost. Toolbox's "Worship charge full" alert fires at ≥ 95% of max ([`utility/dashboard/characters.js` L58-74](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/characters.js#L58-L74)).
  2. With a Wizard that has Charge Syphon, syphon everyone's charge into the Wizard first, then claim. Watch `timers.General.closestFullWorship`.
  3. When a Prayer-unlock wave is within reach, spend one charge cost on an active TD run.
  - **Capped or idle states:** charge at max means accrual is wasted, so the Verdict is Fix before you leave if the Expected Return exceeds the hours to fill. A character with no skull (max 50) caps within about 38 h. (H for the mechanics, M for the Verdict rule)
- **AFK Setup implications:** none for the AFK activity itself, since charge accrues regardless of activity (H, TB `getPlayerWorship` adds `chargeRate × hours AFK`, [L184-194](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/worship.ts#L184-L194)). Two indirect rules:
  - Never leave Unending Energy on a character with an Expected Return over 10 h.
  - Equip the best skull the Worship level allows before leaving, because max charge sets how long the character can stay away without waste.
- **Min-max by stage:**

| Stage | Priority order | Conf |
|---|---|---|
| Early W3 | 1) Buy a Wax Skull for **every** character (doubles the cap, and nothing else competes for it). 2) Push Goblin Gorefest to waves 10 and 25 (Big Brain Time, Skilled Dimwit). 3) WORSHIP charge on totem 1 for Forest Souls, then the Ceramic Skull (250 Forest Souls) for the main Wizard. 4) Build the Pulse Mage and Fireball Lobber towers to Lv 1+. | H (costs), M (order) |
| Mid W3 | Wizard: level Worship to 10 (Wakawaka) and 30 (Acorn). Learn Charge Syphon and Nearby Outlet. Equip Call Me Pope while claiming. Gorefest wave 51 (Unending Energy) and 81 (Shiny Snitch, for Trapping). Horned (Lv 25) and Prickle (Lv 35) skulls on the Worship mains. Souls → Sippy Soul vial (Tab 2 points) and Crab Juice vial (TD points). | M |
| Late W3 / pre-W4 | Worship 40: Frosty Firefight, the best EXP per charge in W1–W3; push to 21 for Fibers of Absence, which helps the Death Note. Manifested and Glauss skulls (Frigid Souls; Dense Water and Dioxide from the Refinery). Boulder Roller and Frozone Malone towers. Slowergy Drink vial (Frigid Souls, +base multikill). | M |
| W4+ outline | Clash of Cans (Lv 50) is the community's best EXP per charge. Totalizer (W5) rewards total waves across all totems. Luciferian and higher skulls need W5/W6 Souls. | M |
| Per class | **Wizard:** the Worship main (Wisdom efficiency, Gospel Leader, Charge Syphon, Nearby Outlet). **Others:** still bank their own charge, so they still need a skull and still claim. In TD, Hunters (Stop Right There, 360 No Scope) and Wizards (Ice Shards, Floor Is Lava, Tornado) bring crowd control (wiki "Class Usefulness"). **Voidwalker:** Species Epoch. | H (talents), M (TD usefulness) |

- **Common mistakes and how to detect them:**
  - **No skull:** `characters[i].tools[5].rawName === 'Blank'`, so `worship.maxCharge` is 50. The W3 test save had this on 6/6 characters.
  - **Charge left at cap:** `worship.currentCharge ≥ 0.95·worship.maxCharge`. 4 of the 6 W3 characters were at max.
  - **Only the Wizard ever claims:** the other characters show Worship Lv 1. Each has its own charge.
  - **Unending Energy with a long AFK:** an active prayer named `Unending_Energy` and AFK > 10 h. Toolbox `worshipAlerts` checks this.
  - **Grinding waves past the useful ones:** best waves above the next Prayer Milestone but with low EXP per charge. (M)
- **Save and Toolbox fields:**
  - `account.totems[]`: `{name, maxWave, waveMulti, expReward, map, monsterName, minEfficiency, skillReq, chargeReq}`, from raw `TotemInfo`.
  - `account.towers.totalWaves`, and `account.towers.data[9..17]` for TD tower levels (from `TowerInfo`), plus `account.towers.wizardOverLevels`.
  - `characters[].worship.{maxCharge, chargeRate, currentCharge}`. `currentCharge` is Toolbox's estimate of raw `PlayerStuff_N[0]` + rate × hours since the snapshot, capped at max.
  - `characters[].skillsInfo.worship.level`, `characters[].tools[5]` (the skull) and `characters[].activePrayers`.
  - Computed by Toolbox: `getTotemExpReward`, `getSoulsReward`, `getClosestWorshiper`, `getChargeWithSyphon`.
  - Example: a W3 account had one character at Worship 16 and the rest at 1, with a best wave of 41 on Gorefest only.
- **Sources:** inline above. Wiki [Worship](https://idleon.wiki/wiki/Worship) (rev. 2026-10-07, pre-v1.23 but module-generated; it agrees with the code). Reddit is opinion, dated: [Best Worship tower for highest XP gain? (2026-08-02)](https://reddit.com/r/idleon/comments/1vdrtqi/best_worship_tower_for_highest_xp_gain/), [Is there any trick to level up worship? (2026-06-23)](https://reddit.com/r/idleon/comments/1udx394/is_there_any_trick_to_level_up_worship/) ("start a summon, then spam balloons"), and [Worship sucks (2026-10-10)](https://reddit.com/r/idleon/comments/1x2leem/worship_sucks/) (title only, a sentiment signal).

---

## Trapping

- **What it is:** a World 3 skill specialised for the Hunter (efficiency from Agility). You place timed traps at critter spots. When collected, they give **critters** (crafting and Alchemy materials), Trapping EXP, and sometimes **shiny critters** (the "A" variants, for example Poison Froge). Wiki [Trapping](https://idleon.wiki/wiki/Trapping), rev. 2026-10-07. (H)
- **Unlocks:**
  - Start the **Lord of the Hunt** quest line (W3). Quest 1 needs 10 Shrapshell + 12 Snake Skin + Cardboard Traps, and rewards Cardboard Traps.
  - Cardboard Traps are sold by the **Frostbite Towndra** vendor. Equipping a trap set needs the Trapping level shown in the trap table below.
  - Critter spots need their map to be reachable. The **Trapper Drone** building (Construction #6, 15 levels) lets any character place and collect traps at any discovered spot.
  - Source: TB `quests.json` `Lord_of_the_Hunt`, `shops[4]`, `towers`. (H)
- **Scope:**
  - **Per character:** placed traps (`PldTraps_N`), the equipped trap set (`EquipmentOrder[1][4]`), Trapping level and efficiency, and the shiny chance (talent, food, prayer). A trap's efficiency, EXP and shiny multipliers are **snapshotted when it is placed** (wiki Tips; TB comment at `calcShinyMultiplier`).
  - **Account-wide:** critters in storage, base critters (quests, vials), the Eagle Eye collect rate (the best Hunter's), Pen Pals score (`OptionsListAccount[99]`) and the Trapper Drone. (H)
- **Inputs → outputs:**
  - **In:** a trap slot and real time. Timers keep running while the character does anything else. They do **not** tick on the character-select screen (wiki).
  - **Out per trap:** `critters = floor(Meal·SpeciesEpoch·Arcade 23·Vault 50 · BaseQTY · (1+effBonus/100) · trapQty)`. Here `effBonus = floor(100·(eff/(10·req))^0.25)` if eff ≥ the critter's required efficiency, else 0.
  - `BaseQTY = floor(10 + TrapperDrone lv + #LotH quests 2–11 done + Goosey Glug vial + star sign + Pen Pals (+1 at score 125, +1 at score 200) + …)`.
  - `EXP = BaseQTY·trapExp·critterExp·TrappingEXPmulti`.
  - The shiny chance rolls **once per trap**: `max(0.001, base·trapShiny·(1+stamps+2·"Come 'ere Critters!" task)·Cuz I Catch Em All·vials·ReflectiveEyesight^(1+floor(TrapLv/10)))`, ×(1 + food + cards + Pen Pals + arcade) on opening, then ÷ the Shiny Snitch curse. You get one shiny per trap, or a bundle with Shiny Snitch.
  - Source: N.js `TrappingStuffs("BaseQTY"/"TotalQTY"/"TotalEXP"/"TotalRareChance"/"RareBonusOnOpen")` @7763861–7771533; TB [`parsers/world-3/traps.ts` L175-246](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/traps.ts#L175-L246). (H)
  - **Number of traps** = the trap set's item ID (Cardboard 1 … Royal 7; Egalitarian through Prehistoric are also 7), **+1 once the Call Me Ash bubble has ≥ 1 level, even unequipped** (`TrappingStuffs("NumOfTrapsPlaceable")`: `CauldronInfo[1][11] > 0.5` @7772714; bubble text "+1 Placeable Trap ALWAYS"). Toolbox caps it at 8 ([`characters.js` L76-92](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/characters.js#L76-L92)). (H)
  - **Eagle Eye** (Hunter, talent 310) collects and resets every character's traps. It gives `max(50%, EagleEye + Poison Tincture vial + compass 42 + Magnesium atom + Dementia set + palette)` of the critters, and `max(40%, min(EagleEye EXP, 99))` of the EXP. A Hunter-less account gets the floors. Source: N.js `CollectAllPCT` @7765216; TB [L119-157](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/traps.ts#L119-L157). (H)

**Trap options** (N.js `TrapBoxInfo` @14807373 = TB `shared-data.json` `traps`, columns `[seconds, qty×, third, flag]`. **When flag = 1, the third column is the shiny multiplier and EXP is ×1**, per N.js `TrapEXPBonus`/`TrapRareBonus`. Toolbox names the third column `exp` and the flag `trapType`, which is misleading.) Per-hour figures are the multiplier divided by the hours.

| Trap (Trapping Lv to equip) | Duration | Critters × (/h) | EXP × (/h) | Shiny × (/h) |
|---|---|---|---|---|
| Cardboard (1) | 20 min / 1 h / 8 h / 20 h | 1 / 2 / 10 / 20 (3.0 / 2.0 / 1.25 / 1.0) | 1 / 2 / 8 / 15 (3.0 / 2.0 / 1.0 / 0.75) | — |
| Silkskin (5) | 20 min / 1 h / 8 h / 20 h / 40 h | 1 / 2 / 10 / 20 / 35 | 1 (flat) | 2 / 4 / 16 / 30 / 50 (6.0 / 4.0 / 2.0 / 1.5 / 1.25) |
| Wooden (15) | 3 h / 60 h / 120 h / 120 h / 120 h | 5 / 50 / 100 / **200** / 0 | 5 / 40 / 80 / 0 / **200** | — |
| Natural (20) | 8 h / 20 h / 43.9 h / 143.9 h | 0 | 40 / 75 / 120 / 350 (**5.0** / 3.75 / 2.73 / 2.43) | — |
| Steel (30) | 3 h / 60 h / 120 h / 20 h | 5 / 50 / 100 / 1 | 1 (flat) | 10 / 80 / 160 / 60 (3.33 / 1.33 / 1.33 / 3.0) |
| Meaty (40) | 1 h / 10 h / 30 h / 200 h | 3 / 15 / 40 / 220 | 3 / 12 / 30 / 200 | — |
| Royal (48) | 20 min / 1 h / 10 h / 40 h / 160 h / 672 h | 2 / 4 / 21 / 70 / 250 / 550 (6.0 … 0.82) | 1 (flat) | 4 / 8 / 38 / 125 / 375 / 1150 (**12** … 1.71) |
| Egalitarian (55), Forbidden (70), Containment of the Zrgyios (85), Prehistoric (100) | — | Same 7 trap types and 7 slots; they only raise the equip tier | | |

Wiki cross-check: the `{{#invoke:Trapping|boxes}}` first rows match (Silkskin 20 min "Shiny 2×", Steel 3 h "Shiny 10×", Royal 20 min "Shiny 4×").

**Critters** (TB `trappingInfo`; wiki Critters table). The base critter count is 10 per trap before bonuses. Shiny chance is the base % per trap, for the regular → shiny pair.

| Critter → shiny | Spot (map) | Eff. req. for bonus | EXP | Base shiny % | Main uses (vial / stamp / quest) |
|---|---|---|---|---|---|
| Froge → Poison Froge | Jungle Perimeter (W1) | 35 | 2 | 5 | LotH 2; Poison Froge → **Poison Tincture** vial (Eagle Eye +% critters), Silkskin Traps |
| Crabbo → Mutant Crabbo | Salty Shores (W2) | 400 | 8 | 3 | **Crab Juice** vial (TD points), Hidey Box stamp, Call Me Pope bubble cost; Mutant → Wooden Traps |
| Scorpie → Crescent Scorpie | The Ring (W2) | 1,500 | 25 | 2 | Purp Froge stamp (shiny ×); LotH 4 and 11 |
| Mousey → Nakeo Moleo | Rats Nest (W1) | 3,500 | 50 | 1 | **Bubonic Burp** vial (cog inventory), Spikemouth stamp; Nakeo → Natural Traps |
| Owlio → Minervowl | Hollowed Trunk (W1) | 8,000 | 80 | 0.6 | Shiny Crab stamp (shiny ×); Minervowl → Forbidden Traps |
| Pingy → Eternal Lord of the Undying Ember | The Stache Split (W3) | 15,000 | 125 | 0.3 | Eternal Lord → Steel Traps |
| Bunny → Purbunni | Thermonuclear Climb (W3) | 45,000 | 160 | 0.15 | **Bunny Brew** vial (Tab 3 points), Avast Yar stamp |
| Dung Beat → Jade Scarab | Efaunt's Tomb (W2) | 100,000 | 200 | 0.06 | Jade Scarab → Meaty Traps |
| Honker → Diamond Duck | Wam Wonderland (W3) | 200,000 | 260 | 0.02 | **Goosey Glug** vial (+base critter per trap) |
| Blobfish → Voodofish | Cocoa Tunnel (W4) | 500,000 | 350 | 0.003 | Bloat Draft vial (Lab EXP); 100k Blobfish → Royal Traps |
| Tuttle → Tottoise | Bamboo Laboredge (W6, needs Jade Emporium) | 10,000,000 | 900 | 0.001 | Turtle Tisane vial |

- The wiki lists Tuttle's shiny chance as 0.0001%. Toolbox data and the code floor (`max(0.001, …)`) give 0.001%. **Toolbox wins** (ADR 0004).

- **Goals and Milestones:**

| Goal | Milestones | Reward | Source |
|---|---|---|---|
| Lord of the Hunt quests 2–11 | Each completed quest (100 Froge … 65k Honker; quest 11: 500 Crescent Scorpie + 250 Eternal Lord + 100 Diamond Duck) | **+1 base critter per trap** each (up to +10, which doubles the base), plus candy, balloons, resets and the Critter Baron (quest 11) | N.js `BaseQTY` @7763861; TB `quests.json` (H) |
| Trap set tiers | Trapping 5 / 15 / 20 / 30 / 40 / 48 | +1 trap slot each (up to 7), new trap types | TB `items.json`, `crafts.json` (H) |
| Call Me Ash Lv 1 | ≥ 1 level | +1 trap on every character, permanently | N.js @7772714 (H) |
| Pen Pals minigame high score (`OLA[99]`) | 25 / 50 / 75 / 100 / 125 / 150 / 175 / 200 / 225 | +5% EXP, +5% eff., +15% shiny, +5% EXP, +1 base critter, +15% shiny, +5% eff., +1 base critter, +1% skill AFK | N.js `TrapMGbonus` @7773279 with `RANDOlist[59]` = [5,5,15,5,1,15,5,1,1]. The wiki says "10% critter gain" for the +1 critter steps, i.e. +1 on a base of 10. (H) |
| Efficiency per critter | eff ≥ req, then bonus `floor(100·(eff/10req)^0.25)`% | Bonus critters | N.js `EfficiencyBonusQTY` @7761028 (H) |
| Shinies for recipes | Poison Froge 1 (Silkskin), Mutant Crabbo 2 (Wooden), Nakeo 5 (Natural), Eternal Lord 6 (Steel), Jade Scarab 10 (Meaty) | The next trap tier | TB `crafts.json` (H) |

- **Feeds / fed by:**
  - **Feeds:** Alchemy vials (the critter vials above), Stamps, Bubble costs, Smithing (critters and shinies are in about 130 recipe slots, TB `crafts.json`), trap crafting, Lord of the Hunt rewards, Species Epoch (Voidwalker).
  - **Fed by:** Construction (Trapper Drone), Alchemy (Call Me Ash, Cuz I Catch Em All, Poison Tincture, Fur Refresher, Orange Malt, Goosey Glug), stamps (shiny, efficiency, EXP), Prayers (**Shiny Snitch**: shinies drop in bundles of 20+, but the chance is ×15+ lower), Meals (Critter), Arcade, Upgrade Vault, the Windwalker compass, the Atom Collider (Magnesium), the Dementia set, Gaming palette, Meritocracy, Menagerie (W7), Hunter talents. (H)
- **Per-session actions:**
  1. Collect every trap whose timer has passed. Toolbox's `trapsOverdue` lists them, and `timers.World 3.closestTrap` gives the next one. Loot the critters from the ground before leaving the map.
  2. Re-place traps in every free slot (`missingTraps`).
  3. With a Hunter, one Eagle Eye does everything at the collect rate. It also replaces the traps, which keeps the Call Me Ash extra slot.
  4. Re-place traps after any efficiency gain, because the efficiency is snapshotted.
  - **Idle state:** any unused trap slot, or any trap past its timer.
- **AFK Setup implications:** traps do **not** occupy the character, so put the character on its best other activity. Before leaving, fill every slot with the trap option that best fits the Expected Return. A trap that ends early sits idle, and a much longer trap gives fewer rolls per hour.
  - **Overnight EXP:** Natural 8 h (5.0 EXP×/h).
  - **Long critter AFK:** Wooden 120 h "200×" or Meaty 200 h.
  - **Short active sessions, for shinies:** Silkskin or Royal 20 min. (H for the multipliers, M for the policy)
- **Min-max by stage:**

| Stage | Priority | Conf |
|---|---|---|
| Early W3 | Cardboard Traps on **every** character (1 slot each). Level Call Me Ash to 1 (+1 trap for all). Do LotH quests 1–2 (Froge → Poison Froge). Use 20-min to 1-h traps while playing and 8–20 h overnight. Craft Silkskin at Trapping 5. | H (mechanics), M (order) |
| Mid W3 | Trapping 15: Wooden. Trapping 20: Natural, for overnight EXP. Push LotH quests 3–7 (each +1 base critter). Brew the Crab Juice, Poison Tincture and Bubonic Burp vials. With a Hunter, put Eagle Eye in a talent preset and collect for everyone. | M |
| Late W3 | Trapping 30: Steel (needs 6 Eternal Lord + Dense Water). Trapper Drone building. Shiny Snitch prayer only on the trapping run where its bundle beats the chance cut. LotH 8–10 (Bunny, Dung Beat, Honker). Build toward the Goosey Glug vial. | M |
| W4+ outline | Meaty (40) and Royal (48, 100k Blobfish from W4 Cocoa Tunnel). Lab and Breeding read shinies elsewhere (see their dossiers). Skill Mastery (Rift 16). The Tuttle spot needs W6 Sneaking. | M |
| Per class | **Hunter:** Eagle Eye, Invasive Species (+eff per power of 10 Froge in storage) and Reflective Eyesight (×shiny, re-applied every 10 Trapping levels) make it the trapping main. **Archers** get the class multiplier on Cuz I Catch Em All (TB `getBubbleBonus(…isArcher)`). **Everyone else** still traps with their own slots. | H |

- **Common mistakes and how to detect them:**
  - **No trap set equipped:** `characters[i].tools[4].rawName === 'Blank'` and `account.traps[i].length === 0`. The W3 test save had 0 traps placed on all 6 characters and Trapping Lv 1 everywhere.
  - **Unused slots:** `traps.length < trap set tier + (Call Me Ash ≥ 1)`.
  - **Overdue traps:** `trap.timeLeft < now`.
  - **No Hunter**, so Eagle Eye is on the floor: no character with `class` Hunter.
  - **Skipping Lord of the Hunt:** `characters[].quests` / `account.quests` show LotH steps not done.
  - **Using Silkskin, Steel or Royal for EXP:** these give EXP ×1. Check `trapData` against the "EXP" column.
  - **Shiny Snitch left on for normal traps:** it divides the shiny chance. Check `activePrayers`.
- **Save and Toolbox fields:**
  - `account.traps[charIndex][]`: `{name, rawName, crittersQuantity, trapType, trapExp, timeLeft, trapData}` from raw `PldTraps_N` (`[critterId, ?, elapsed, critterName, qty, trapType, trapTime, trapExp]`). Here `trapType` is the **trap box index 0–6** and `trapExp` is the snapshotted EXP. TB [`traps.ts` L19-43](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/traps.ts#L19-L43).
  - `characters[].tools[4]` (trap set) and `characters[].skillsInfo.trapping.level`.
  - Computed by Toolbox: `getTrapsBonuses` (collect rates per character), `getShinyChanceInfo` (shiny chance per critter per character), `calcTotalCritters`.
  - Alerts: `trapsAlerts` (`missingTraps`, `trapsOverdue`).
- **Sources:** inline above. Wiki [Trapping](https://idleon.wiki/wiki/Trapping) (rev. 2026-10-07, pre-v1.23; the Pen Pals and critter tables agree with the code except Tuttle's shiny %). Reddit [What's the best trap for shinnies? (2026-06-02)](https://reddit.com/r/idleon/comments/1tv639i/whats_the_best_trap_for_shinnies/), title only.

---

## Death Note

- **What it is:** an account-wide kill ledger for every non-boss, non-crystal monster in Worlds 1–7. Each mob earns points at kill Milestones. A world's points become **+1% Multikill per damage tier** for kills **in that world**. Multikill gives extra base drops and extra kills when your damage exceeds 2×, 4×, 8×… the monster's HP. Wiki [Death Note](https://idleon.wiki/wiki/Death_Note), rev. 2025-11-14. That is **older than v1.23**, but every number matches the v1.23 code. (H)
- **Unlocks:**
  - The **Death Note building** in W3 Construction (index 2, max Lv 51; first-level cost 10 Explosive Salts, plus 200 Forest Souls per the wiki template).
  - Kills are counted from account creation, but **multikill pays nothing until the building is at Lv ≥ 1**: `overKill` requires `0.5 < account.towers.towersTwo` (TB [`parsers/damage.ts` L1500-1511](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/damage.ts#L1500-L1511)).
  - Each building level also adds +2% base multikill in all worlds (`2 * towersTwo` in `getMultiKillBase`, [L1617-1636](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/damage.ts#L1617-L1636)).
  - The **miniboss page** needs the Jade Emporium "Revenge of the Pickle" (W6 Sneaking).
  - **Eclipse Skulls** need the Rift bonus "Eclipse_Skulls" (W4 Rift, `RiftStuff("riftBonus",3)`). (H)
- **Scope:** account-wide. Kills are summed over all characters (TB `getAllCharactersKills`, [`deathNote.ts` L35-45](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/deathNote.ts#L35-L45)). The multikill it grants depends on the world each character is fighting in (`floor(CurrentMap/50)`). Whether multikill triggers depends on each character's damage and accuracy. (H)
- **Inputs → outputs:**
  - **In:** kills, from any character, AFK or active. Multikill's extra kills and the Fibers of Absence prayer (+% kills for the Death Note and portals) also count.
  - **Out:** `MultiKill_perTier = DNrank[world] + DNrank[miniBosses] + Slowergy Drink vial + arcade + Trilobite Rock artifact + chips + gear/obols + Hole measurement + cards + star signs + Balance of Pain prayer + shiny pets + Post Office + bubble + card set …`. Source: N.js `WorkbenchStuff("MultiKill_perTier")` @7798615; TB `getMultiKillPerTier` [L1653-1693](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/damage.ts#L1653-L1693). (H)

**Ranks** (N.js `WorkbenchStuff("DeathNoteRank")` @7798307 = TB `DEATH_NOTE_RANKS` [L60-73](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/deathNote.ts#L60-L73)):

| Skull | Kills (normal mob) | Points | Kills (miniboss page) | Points |
|---|---|---|---|---|
| Skull 0 | 25,000 | 1 | 100 | 1 |
| Skull 1 (Copper) | 100,000 | 2 | 250 | 2 |
| Skull 2 | 250,000 | 3 | 1,000 | 3 |
| Skull 3 (Golden) | 500,000 | 4 | 5,000 | 4 |
| Skull 4 | 1,000,000 | 5 | 25,000 | 5 |
| Skull 5 (Dementia) | 5,000,000 | 7 | 100,000 | 7 |
| Skull 6 | 100,000,000 | 10 | 1,000,000 | 10 |
| Eclipse (Rift) | > 1,000,000,000 | 20, and +5% multiplicative total damage per Eclipse Skull on the W1–W6 pages | none | — |

The names Copper, Golden and Dementia come from the achievement texts. They map to points ≥ 2, 4 and 6 through the achievement check `rank >= round(2+2·world)` (N.js @5149599, M). The other names are not in the client.

**Pages** (TB `deathNote` = N.js `DeathNoteMobs`):

| Page | Mobs | Max points (without / with Eclipse) |
|---|---|---|
| W1 Blunder Hills | 15: Green Mushroom, Red Mushroom, Frog, Bored Bean, Slime, Baby Boa, Carrotman, Glublin, Wode Board, Gigafrog, Poop, Rat, Walking Stick, Nutto, Wood Mushroom | 150 / 300 |
| W2 Yum-Yum Desert | 11: Sandy Pot, Mimic, Crabcake, Mafioso, Sand Castle, Pincermin, Mashed Potato, Tyson, Moonmoon, Sand Giant, Snelbie | 110 / 220 |
| W3 Frostbite Tundra | 14: Sheepie, Frost Flake, Sir Stache, Bloque, Mamooth, Snowman, Penguin, Thermister, Quenchie, Cryosnake, Bop Box, Neyeptune, Dedotated Ram, Bloodbone | 140 / 280 |
| W4–W7 | 13 / 13 / 14 / 24 mobs | Outline only |
| Minibosses (W6 unlock) | Glunko the Massive, Dr Defecaus, Baba Yaga, Biggie Hours, King Doot, Dilapidated Slush, Mutated Mush, Domeo Magmus, Demented Spiritlord, Verminous | 100 (no Eclipse); **applies in every world** |

- **Goals and Milestones:**

| Goal | Milestone | Reward | Source |
|---|---|---|---|
| Build the Death Note | Building Lv 1, then up to 51 | Turns multikill on; +2% base multikill per level | TB `damage.ts` (H) |
| "Blunder Skull" achievement | Copper (≥ 100k) on all 15 W1 mobs | RNG item unlock | TB `achievements.json` #147 (H) |
| "Saharan Skull" achievement | Golden (≥ 500k) on all 11 W2 mobs | +1% Printer sample rate | #158 (H) |
| "Blurple Skull" (Steam) | Dementia (≥ 5M) on all 14 W3 mobs | 30 gems, 5 × 72 h candy | #168 (H) |
| Nebulyte quest 1, "Species Slayer" | **1M kills on all 40 W1–W3 mobs**, then visit the Death Note | Step toward Voidwalker (quest 4 "VMAN_ACHIEVED!": become a Voidwalker) | TB `quests.json` `Nebulyte`; N.js @5149599 (H) |
| Nebulyte quest 3 | 12M Green Mushroom kills by one character | Same chain | TB `quests.json` (H) |
| Fungi Finger Pocketer (W4 Lab) | Every 1M Green Mushroom kills | +2% cash from monsters each | TB [`world-4/lab.ts` L231](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-4/lab.ts#L231) (H) |
| Each next skull on the mob you farm | 25k → 100k → 250k → 500k → 1M → 5M → 100M | +1 to +3% multikill per tier in that world | as above (H) |

- **Feeds / fed by:**
  - **Feeds:** the multikill per tier stat, and through it base-resource drops and the kill counts for portals, Barbarian Apocalypses and the Death Note itself. Also the Rift Eclipse Skulls (total damage), Tome (sum of ceil(log10 kills) over all mobs, [`tome.ts` L327](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-4/tome.ts#L327)), the Lab, Hole "Deathnote pts" measurement (W5, [`world-5/hole.ts` L510-528](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-5/hole.ts#L510-L528)), the Menagerie (W7, miniboss rank), achievements and the Nebulyte quest.
  - **Fed by:** every fighting character's kills; Fibers of Absence (prayer); multikill itself, which compounds; the Construction building level; and the Slowergy Drink vial (Frigid Souls from Worship). (H)
- **Per-session actions:**
  - Rarely an action of its own. Check which mobs are closest to their next skull, and whether a character's AFK map is on a mob that has already passed the skull you care about. Visit the Death Note once for Nebulyte step 1.
  - **Idle state:** the building is at Lv 0 (nothing works), or the character's damage is below 2× the target's HP or its accuracy is ≤ 1.5× the target's defence, so multikill is off for that character. Toolbox exposes per-character kill-per-kill numbers through `getKillPerKill`. (H)
- **AFK Setup implications:** this is the main tie-breaker for **fight-AFK map choice**.
  - Among maps of similar value, prefer a mob just below its next skull, or one still under 1M while working toward Nebulyte.
  - Stop and move on at the Milestone. This is exactly the glossary's "13k Poop kills, next 100k, stop here" Purpose pattern.
  - For **multikill payout**, the character must overkill the mob, so AFK one map below its push map. (H for the mechanics, M for the policy)
- **Min-max by stage:**

| Stage | Priority | Conf |
|---|---|---|
| Early W3 | Build the Death Note building as soon as Explosive Salts allow; multikill is off until then. Keep AFKing fighters on maps they overkill. Aim for 25k → 100k on the W1 mobs you already farm (Blunder Skull). | H (gate), M (order) |
| Mid W3 | Slowergy Drink vial (Frigid Souls). Push W2 mobs to 500k (Saharan Skull, +1% Printer sample rate). Level the building alongside the other Construction priorities. | M |
| Late W3 / pre-W4 | Spread AFK across W1–W3 mobs toward **1M on all 40** (Nebulyte step 1). A long Goal of several Play Sessions, but it is the Voidwalker gate. Fibers of Absence on characters whose damage loss is acceptable. | M |
| W4+ outline | W4 Rift: Eclipse Skulls at 1B kills (20 points plus +5% damage each). Fungi Finger Pocketer in the Lab. Miniboss page at W6. From W7 (map ≥ 300) multikill tiers step by 5× HP rather than 2× (TB `damage.ts` `DIMINISHED_MULTIKILL_MAP_INDEX`). | H |
| Per class | Account-wide, with no class difference in the Death Note itself. Barbarians benefit doubly (more kills feed Apocalypse). The Voidwalker gate makes this a Journeyman/Maestro-line Goal. | H/M |

- **Common mistakes and how to detect them:**
  - **Building never built:** `account.towers.towersTwo === 0`, or `account.towers.data[2].level === 0`. The W3 test save had this, so it had **zero multikill on every character**.
  - **Farming a mob well past its skull** while a sibling sits just under one: compare `account.deathNote[w].mobs[].kills` with the rank thresholds.
  - **AFK on a map the character can't overkill:** Toolbox's kill-per-kill / overkill check is false.
  - **Expecting world-specific ranks to help elsewhere:** the W1 page only boosts W1 kills.
- **Save and Toolbox fields:**
  - `account.deathNote = { "0".."6": {rank, mobs:[{rawName, displayName, kills}]}, miniBosses: {rank, mobs} }`. Kills per mob are the sum over characters of `characters[].kills[mapIndex]`, from the game's `KillsLeft2Advance` against `MapDetails`. The miniboss kills come from raw `Ninja[105]`. Source: TB [`deathNote.ts` L5-33](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/deathNote.ts#L5-L33).
  - `account.towers.towersTwo` is the building level.
  - Computed by Toolbox: `getDeathNoteRank`, `getEclipseSkullsBonus`, `calcTotalKillsDigits`, `getMultiKillPerTier`, `getMultiKillBase`.
  - Example: a W3 account had a W1 page rank of 1 and 0 everywhere else. Its best W3 mob was at about 20k kills, under the first skull.
- **Sources:** inline above. Wiki [Death Note](https://idleon.wiki/wiki/Death_Note) (rev. 2025-11-14, **Stale** per page date, but its rank tables match the v1.23 code, so they are verified current).

---

## Sources

- Game client N.js (Last-Modified 2026-10-17 01:42 GMT, v1.23). Symbols:
  - Worship: `_customBlock_WorshipStuff` @7757584 (`ExpRewards` @7760043, `SoulRewards` @7760276, `EfficiencyBonusQTY` @7761028, `SkullCurrency` @7761549, `PrayerCost` @7763052), `WorshipBASEinfos` @14160577, the SUMMON charge deduction @7571659, the TD starting points @7571963, the WORSHIP claim `_customEvent_TrapStuff` @7704485.
  - Trapping: `_customBlock_TrappingStuffs` @7763816 (`BaseQTY` @7763861, `CollectAllPCT` @7765216, `TotalQTY` @7769865, `TotalRareChance` @7771533, `NumOfTrapsPlaceable` @7772714, `TrapMGbonus` @7773279), `TrapBoxInfo` @14807373, `TrappingInfo` @14806863.
  - Death Note: `WorkbenchStuff("DeathNoteRank")` @7798307, `MultiKill_perTier` @7798615, `OverkillQTY` @7803385, the Nebulyte/achievement Death Note check @5149599.
  - Other: the `mini3a` drop table @14960581, the achievement text table @14728514–14730192.
- IdleOn Toolbox [@ 6827d3f (2026-10-17)](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1):
  - Parsers: `parsers/world-3/{worship,traps,deathNote,construction}.ts`, `parsers/damage.ts`, `parsers/world-4/{tome,lab}.ts`, `parsers/world-5/hole.ts`.
  - Dashboard: `utility/dashboard/{characters,alertMeta,account}.js`, `components/account/Worlds/World3/Worship/Totems.jsx`.
  - Data: `data/website-data/{shared-data,items,crafts,vials,stamps,cauldrons,talents,quests,achievements,monsters,randomList}.json` (`totems`, `traps`, `trappingInfo`, `deathNote`, `towers`, `prayers`, `shops`, `ninjaExtraInfo[30]`, `labBonuses`).
- idleon.wiki via `api.php` (read 2026-10-17): [Worship](https://idleon.wiki/wiki/Worship) (rev. 2026-10-07), [Trapping](https://idleon.wiki/wiki/Trapping) (rev. 2026-10-07), [Death Note](https://idleon.wiki/wiki/Death_Note) (rev. 2025-11-14), and the modules `Worship|totems`, `Worship|towers`, `Worship|prayers` and `Trapping|boxes`. All are lower tier than the code (ADR 0004).
- r/idleon via the Arctic Shift API (opinion, tier 3, read 2026-10-17): [1vdrtqi (2026-08-02)](https://reddit.com/r/idleon/comments/1vdrtqi/best_worship_tower_for_highest_xp_gain/), [1udx394 (2026-06-23)](https://reddit.com/r/idleon/comments/1udx394/is_there_any_trick_to_level_up_worship/), [1x2leem (2026-10-10)](https://reddit.com/r/idleon/comments/1x2leem/worship_sucks/), [1tv639i (2026-06-02)](https://reddit.com/r/idleon/comments/1tv639i/whats_the_best_trap_for_shinnies/).
- Account State examples are aggregates from `fixtures/private/joseph.parsed.json` (W3) and `yasser.parsed.json` (W2), read locally and never committed.
