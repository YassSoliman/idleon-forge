# Rift, Sigils, Tome, W4 bosses and elite classes

Part of ticket [#23](https://github.com/YassSoliman/idleon-forge/issues/23) (System Dossiers: World 4 account systems), map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Format: [SYSTEM-DOSSIER.md](../../SYSTEM-DOSSIER.md). Terms: [GLOSSARY.md](../../../../GLOSSARY.md). Precedence: [ADR 0004](../../../adr/0004-source-precedence.md). Numbers: Toolbox only, plus arithmetic ([ADR 0005](../../../adr/0005-toolbox-numbers-not-our-formulas.md)). Lab, Cooking and Breeding are covered in the sibling files of this folder. They are named here, not described.

**Verified 2026-10-17 against:**

- **Game client** `N.js` (`https://www.legendsofidleon.com/ytGl5oc/N.js`, Last-Modified 2026-10-17, sha256 prefix `42da3130082762cf`, newest patch entry `Luminous_Menagerie_v1.23` @14132571). It is minified Haxe, so I cite code by symbol plus character offset (`@offset`), as in [the mechanics research](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md). Offsets will shift with the next patch; the symbol names stay stable.
- **Toolbox** [Morta1/IdleonToolbox @ 6827d3f (2026-10-17 19:14 +0300)](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1). It is abbreviated **TB** below.
- **Wiki** pages, each with its last-revision date. Most are bot-generated from game data ("DATA" banner).
- **Community guide:** "Idleon Incomplete Guide" ("IDLEON COMPLETE GUIDE SHEET", by @shadowstorm2204, [sheet 13izR4…](https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview)). It has no date. It was edited after World 7 (2025-11-06) and before Royal Guardian (2026-08-25).
- **Reddit (Arctic Shift):** it returned "Too many requests" on every attempt during this session, so this file has **no Reddit input**. A human pass should add one.

Confidence: **H** means read in code or game data. **M** means my reading of minified control flow, or an inference. **C** means community opinion.

## Answer

- **The ticket's premise is wrong. The W4 boss is the Massive Troll, not Chizoar.** Chizoar is the **W3** (Frostbite Tundra) boss. His Galaxial Amethyst opens the W4 portal. The Massive Troll (Enclave a la Troll) drops the Magma Geode that opens W5. It has no daily attempt limit; entry costs 1 / 5 / 60 Troll's Enclave Keys for Normal / Chaotic / Blitzkrieg. Instead of attacking, the Troll runs minigames, and those stop after the "Begone Troll!" task tier 3. The W4 miniboss is the Mutated Mush, which is also a strong Mob Egg source. The W4 Colosseum is Astro (6 tickets, 15 waves). (H)
- **The elite class is not a choice. Each subclass has exactly one elite** (Barbarian → Blood Berserker, Squire → Divine Knight, Bowman → Siege Breaker, Hunter → Beast Master, Wizard → Elemental Sorcerer, Shaman → Bubonic Conjuror). The Meta Path question is only *when*. There is no level gate. You need the subclass, map 154 (W4 map 4, Outskirts of Fallstar Isle), and 10 kills of the buffed Greenie Gang. The community guide says to push every character to map 4 for its elite before anything else in W4. The Elite Class Swap Token, which switched within a base class, is no longer sold. (H, with order C)
- **The Rift has 65 completable levels.** A bonus unlocks after every 5th level: Trap Box Vacuum, Infinite Stars, Skill Mastery, Eclipse Skulls, Stamp Mastery, Eldritch Artifact, Vial Mastery, Construct Mastery, Ruby Cards, Killroy Prime, Sneak Mastery, Cooking Mastery. `Rift[0] ≥ 5·(n+1)` unlocks bonus *n*. (H)
- **The Rift is class-gated, which ties it to the elite unlock.** Levels 8, 18, 29 and 43 need a **Divine Knight** (Orb score 180). Levels 9, 27 and 44 need an **Elemental Sorcerer** (Wormhole 60). Levels 16, 22, 36 and 65 need a **Siege Breaker** (Pirate Flag 75). Level 60 needs **11 characters**, so Cooking Mastery is unreachable with 10 or fewer. (H)
- **Skill Mastery (Rift 15) is the biggest early Rift prize.** Each skill's *total level across all characters* pays out at 150 / 200 / 300 / 400 / 500 / 750 / 1000: +25% skill EXP, then efficiency, then passive skill cards at 300, then +10% all-skill EXP, and so on. Breadth across many characters is what counts. (H)
- **Sigils only charge while the Lab "Sigils of Olden Alchemy" bonus is connected** (`MainframeBonus(12)`). The base rate is **1 sigil EXP per hour per assigned character**, and only the first 10 character slots charge. Assignment uses the character's cauldron job slot, not its AFK target. A W4 account can reach only **Unlock** and **Boost**. Ionized needs W6 Jade Emporium, Ethereal needs W7 Spelunking, Eclectic needs W7 Research. Unlock subtracts its cost. Boost then needs `boostCost` of fresh EXP. (H)
- **In the code, sigil level-ups are applied only when the Sigils page is drawn.** Every Play Session should open Alchemy → Sigils so that finished sigils actually level and the next one is chosen. (M)
- **Tome:** 124 metrics, shown one by one as **account level** (the sum of all class levels) passes `350 + 40·i` (+5, +10, +10, +15 per index past 35, 60, 80 and 100). Purple pages give `10·⌊PTS/100⌋^0.7 %` DMG from the start. Blue pages, bought ×2 from the W4 shop, add Skill Efficiency above 4,000 PTS. Red pages, bought ×7 from the W5 shop, add Drop Rate above 8,000. (H)
- **The Tome pays out before W4.** Toolbox credits Tome points to a W3 save: a W3 account at account level 379 gets 273 PTS, which is +16% DMG. The game's `TomeBonus` has no visit gate either. So Tome advice applies from account level 350, not from reaching W4. Check this in game. (M)
- **For ActiveOn:** every number above is available from Toolbox, in `account.rift`, `account.alchemy.p2w.sigils`/`sigilSpeed`, `account.tome`, `account.totalSkillsLevels[*].rank` and `characters[].classIndex`. A "subclass in W4 without its elite" Verdict, a "sigil maxed for this tier, reassign" alert and a "next Rift task needs class X" Goal can all be computed deterministically. (H)

---

## The Rift

- **What it is:** an account-wide ladder of 65 challenge levels on map 166 (The Rift). Each level shows one monster and one task. Every 5 levels unlocks a permanent account bonus. Two of those bonuses (Skill Mastery and Construct Mastery) are themselves tiered systems.
- **Unlocks:** finish the **Rift Ripper** quest "Entering The Rift..." in **The Untraveled Octopath** (map 161, W4). It consumes 5 Lost Batteries, 878 Purple Mush Cap and 592 Wurm Tail, needs 3 free inventory slots, and rewards 50 Phone Box, 10 Gem Envelope and 3 Cosmic Time Candy. After that the Rift opens from the World Map (TB `quests.json` `Rift_Ripper`; [wiki Rift Ripper](https://idleon.wiki/wiki/Rift_Ripper), rev 2026-09-27). (H)
- **Scope:** account-wide. Progress is `Rift[0]` (current level index, which also counts completed levels) and `Rift[1]` (progress on the current task). `Rift[2]` records which characters have done a "on N characters" task. The tasks are per character only in that each listed class or character count has to do the task itself (TB [`parsers/world-4/rift.ts` L5-18](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-4/rift.ts#L5-L18)). (H)
- **Inputs → outputs:** active play, or AFK kills on the Rift map, depending on the task. Rift mob HP is `5E6 · (1.11 + 0.02·min(1,R/10) + 0.08·min(1,max(0,R−10)/20) + 0.18·min(1,max(0,R−20)/23))^R`, where R = `Rift[0]`. The base respawn is 45 s (N.js `_customBlock_RiftStuff` "mobHP", "mobRespBase" @10780337). Output is the 12 bonuses below. Task type and quota per level come from `CustomLists.RiftStuff[4]` (task id per level) and `[5]` (quota per task). Completion is `Rift[1] ≥ RiftStuff[5][Task]` (N.js `RiftStuff` "Task", "RiftCompleted"; list @14340734). (H)
- **Goals and Milestones:**

Task quotas (`RiftStuff[5]`): 500 kills in 5 min · 200,000 AFK kills · 3 Rift Tear drops in 60 min · the self-healing mega monster on 4 chars · all mobs killed before respawn on 3 chars · ~~a Lava-skull kill on 2 chars~~ (removed in v2.41, 2025-07-06) · Divine Knight Orb 180 · Siege Breaker Pirate Flag 75 · Elemental Sorcerer Wormhole 60 · 1,000,000 AFK kills · 5,000,000 AFK kills · 5,000 skull points · 1,000 skull points · any kill on 11 chars · (12 chars, unused).

| Level (wiki) | `Rift[0]` while on it | Monster | Task | Unlocks when done |
|---|---|---|---|---|
| 1 | 0 | Slime (5 M HP) | Defeat 500 monsters within 5 min. |  |
| 2 | 1 | Frog (5.56 M HP) | Collect 3 rift tear drops from mobs within 60 minutes. |  |
| 3 | 2 | Mr Blueberry (6.21 M HP) | Defeat all mobs before they respawn on 3 characters. |  |
| 4 | 3 | Mashed Potato (6.95 M HP) | Defeat 500 monsters within 5 min. |  |
| 5 | 4 | Rift Spooker (7.82 M HP) | Defeat the mega monster, who can self heal, on 4 chars. | **Trap Box Vacuum** |
| 6 | 5 | Bloque (8.82 M HP) | Get 1,000 skull points. Better skulls are worth more. |  |
| 7 | 6 | Quenchie (9.98 M HP) | Defeat the mega monster, who can self heal, on 4 chars. |  |
| 8 | 7 | Baby Boa (11.4 M HP) | Get an orb score of 180 on your Divine Knight. |  |
| 9 | 8 | Soda Can (13 M HP) | Get a wormhole score of 60 on your Elemental Sorcerer. |  |
| 10 | 9 | Rift Slug (14.8 M HP) | Kill 200,000 monsters while AFK. | **Infinite Stars** |
| 11 | 10 | Mamooth (17 M HP) | Collect 3 rift tear drops from mobs within 60 minutes. |  |
| 12 | 11 | Suggma (20 M HP) | Get 5,000 skull points. Better skulls are worth more. |  |
| 13 | 12 | Sand Castle (23.6 M HP) | Defeat 500 monsters within 5 min. |  |
| 14 | 13 | Gigafrog (28.1 M HP) | Defeat all mobs before they respawn on 3 characters. |  |
| 15 | 14 | Rift Spooker (33.7 M HP) | Kill 1,000,000 monsters while AFK. | **Skill Mastery** |
| 16 | 15 | Sandy Pot (40.7 M HP) | Get a pirate flag score of 75 on your Siege Breaker. |  |
| 17 | 16 | Frost Flake (49.5 M HP) | Get 5,000 skull points. Better skulls are worth more. |  |
| 18 | 17 | Octodar (60.6 M HP) | Get an orb score of 180 on your Divine Knight. |  |
| 19 | 18 | Neyeptune (74.6 M HP) | Defeat the mega monster, who can self heal, on 4 chars. |  |
| 20 | 19 | Rift Jocund (92.6 M HP) | Kill 1,000,000 monsters while AFK. | **Eclipse Skulls** |
| 21 | 20 | Molti (116 M HP) | Defeat all mobs before they respawn on 3 characters. |  |
| 22 | 21 | Floofie (167 M HP) | Get a pirate flag score of 75 on your Siege Breaker. |  |
| 23 | 22 | Moonmoon (246 M HP) | Get 5,000 skull points. Better skulls are worth more. |  |
| 24 | 23 | Carrotman (368 M HP) | Defeat 500 monsters within 5 min. |  |
| 25 | 24 | Rift Slug (561 M HP) | Kill 5,000,000 monsters while AFK. | **Stamp Mastery** |
| 26 | 25 | Clammie (869 M HP) | Collect 3 rift tear drops from mobs within 60 minutes. |  |
| 27 | 26 | Bored Bean (1.37 B HP) | Get a wormhole score of 60 on your Elemental Sorcerer. |  |
| 28 | 27 | Snowman (2.2 B HP) | Defeat the mega monster, who can self heal, on 4 chars. |  |
| 29 | 28 | Sand Giant (3.58 B HP) | Get an orb score of 180 on your Divine Knight. |  |
| 30 | 29 | Rift Hivemind (5.93 B HP) | Kill 5,000,000 monsters while AFK. | **Eldritch Artifact** |
| 31 | 30 | Green Mushroom (9.98 B HP) | Get 1,000 skull points. Better skulls are worth more. |  |
| 32 | 31 | Cryosnake (15.6 B HP) | Defeat 500 monsters within 5 min. |  |
| 33 | 32 | Dedotated Ram (24.4 B HP) | Kill 200,000 monsters while AFK. |  |
| 34 | 33 | Gelatinous Cuboid (38.8 B HP) | Defeat all mobs before they respawn on 3 characters. |  |
| 35 | 34 | Rift Spooker (62.2 B HP) | Kill 5,000,000 monsters while AFK. | **Vial Mastery** |
| 36 | 35 | Mafioso (101 B HP) | Get a pirate flag score of 75 on your Siege Breaker. |  |
| 37 | 36 | Cheese Nub (166 B HP) | Collect 3 rift tear drops from mobs within 60 minutes. |  |
| 38 | 37 | Flying Worm (275 B HP) | Defeat the mega monster, who can self heal, on 4 chars. |  |
| 39 | 38 | Fire Spirit (460 B HP) | Kill 5,000,000 monsters while AFK. |  |
| 40 | 39 | Rift Jocund (778 B HP) | Kill 5,000,000 monsters while AFK. | **Construct Mastery** |
| 41 | 40 | Ghost (1.33 T HP) | Defeat all mobs before they respawn on 3 characters. |  |
| 42 | 41 | Crescent Spud (2.3 T HP) | Get 5,000 skull points. Better skulls are worth more. |  |
| 43 | 42 | Penguin (4.01 T HP) | Get an orb score of 180 on your Divine Knight. |  |
| 44 | 43 | Tremor Wurm (7.06 T HP) | Get a wormhole score of 60 on your Elemental Sorcerer. |  |
| 45 | 44 | Rift Stalker (9.81 T HP) | Kill 5,000,000 monsters while AFK. | **Ruby Cards** |
| 46 | 45 | Lampar (13.7 T HP) | Kill 1,000,000 monsters while AFK. |  |
| 47 | 46 | Stiltmole (19 T HP) | Defeat the mega monster, who can self heal, on 4 chars. |  |
| 48 | 47 | Choccie (26.4 T HP) | Collect 3 rift tear drops from mobs within 60 minutes. |  |
| 49 | 48 | Stilted Seeker (36.7 T HP) | Kill 5,000,000 monsters while AFK. |  |
| 50 | 49 | Rift Hivemind (50.9 T HP) | Kill 5,000,000 monsters while AFK. | **Killroy Prime** |
| 51 | 50 | Sprout Spirit (70.8 T HP) | Kill 5,000,000 monsters while AFK. |  |
| 52 | 51 | Maccie (98.4 T HP) | Kill 5,000,000 monsters while AFK. |  |
| 53 | 52 | Rat (137 T HP) | Kill 5,000,000 monsters while AFK. |  |
| 54 | 53 | Frog (191 T HP) | Kill 5,000,000 monsters while AFK. |  |
| 55 | 54 | Rift Slug (265 T HP) | Kill 5,000,000 monsters while AFK. | **Sneak Mastery** |
| 56 | 55 | Donut (368 T HP) | Kill 5,000,000 monsters while AFK. |  |
| 57 | 56 | Baby Troll (511 T HP) | Kill 5,000,000 monsters while AFK. |  |
| 58 | 57 | Ricecake (710 T HP) | Kill 5,000,000 monsters while AFK. |  |
| 59 | 58 | Flombeige (986 T HP) | Kill 5,000,000 monsters while AFK. |  |
| 60 | 59 | Rift Spooker (1.38 Q HP) | Defeat any monster here on 11 chars. | **Cooking Mastery** |
| 61 | 60 | River Spirit (1.91 Q HP) | Defeat 500 monsters within 5 min. |  |
| 62 | 61 | Purgatory Stalker (2.65 Q HP) | Get 5,000 skull points. Better skulls are worth more. |  |
| 63 | 62 | Lantern Spirit (3.69 Q HP) | Defeat the mega monster, who can self heal, on 4 chars. |  |
| 64 | 63 | Mama Troll (5.12 Q HP) | Defeat any monster here on 11 chars. |  |
| 65 | 64 | Rift Jocund (7.12 Q HP) | Get a pirate flag score of 75 on your Siege Breaker. | **Rift Guy** (placeholder, no bonus) |
| 66 | 65 | Leek Spirit (9.89 Q HP) | You cannot progress further. But there will be more... (current cap) |  |

*HP from the bot-generated [wiki The Rift](https://idleon.wiki/wiki/The_Rift) (rev 2026-10-07). Monsters, tasks and bonuses from TB [`shared-data.json` `riftInfo` L36565](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/shared-data.json#L36565), cross-checked against N.js `RiftStuff` lists 1, 4 and 5. The bonus index rule is `riftBonus: Rift[0] >= 5*(b+1)` (N.js @10784771), mirrored by TB `isRiftBonusUnlocked` (`index <= currentRift`). (H)*

**Rift bonuses in detail**

| Unlocks after level | Bonus | Effect (game text) | Code check |
|---|---|---|---|
| 5 | Trap Box Vacuum | W3 trapper drone collects traps every 24 h into storage (if there is space). EXP goes to the trap's owner. | `riftInfo[5]` |
| 10 | Infinite Stars | The first `5 + Shiny bonus` catalog star signs count as equipped on every character, with no negatives. More come from Shiny pets (Breeding). | `RiftStuff("enabledStarSigns")` @10781746; TB [`starSigns.ts` L30-35](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/starSigns.ts#L30-L35) |
| 15 | Skill Mastery | Tiered per-skill bonuses from account total skill level (table below). | `RiftStuff("RiftSkillBonus,N")` @10786678 |
| 20 | Eclipse Skulls | Death Note Eclipse skull at 1,000,000,000 kills: 20 skull points, +5% multiplicative DMG each. | `RiftStuff("eclipseSkulls")` |
| 25 | Stamp Mastery | Every 100 total stamp levels gives +1% daily chance at a Gilded Stamp (−95% on one stamp upgrade's cost). They stack. | `RiftStuff("gildedStampChance")` @10781884 |
| 30 | Eldritch Artifact | Sailing (W5) can roll Eldritch artifacts once the Ancient form is found. | `riftInfo[30]` |
| 35 | Vial Mastery | Each Lv 13 (Gold Crown) vial gives ×1.02 to all vial bonuses. | `riftInfo[35]` |
| 40 | Construct Mastery | Tiered bonuses from total Construction building levels (table below). | `WorkbenchStuff("ConstMasteryBonus")` @7795518 |
| 45 | Ruby Cards | Cards can reach 5★ (Lv 6). | `RiftStuff("5starCards")` @10781444; TB [`cards.ts` L53](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/cards.ts#L53) |
| 50 | Killroy Prime | DMG multiplier `1 + ⌊(Σ best Killroy kills over Death Note mobs)^0.4⌋/100`, all characters. | `RiftStuff("KillroyDMG")` @10782104; TB [`misc.ts` L1582-1588](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L1582-L1588) |
| 55 | Sneak Mastery | Ninja Castle (W6) can be restarted on higher Mastery difficulty. | `riftInfo[55]` |
| 60 | Cooking Mastery | MASTERY shelf in the W4 Meal Menu, plus +5 max Ribbon rank. Added in v1.17 (2026-06-06). | [wiki Changelog/2026](https://idleon.wiki/wiki/Changelog/2026) |
| 65 | Rift Guy | Placeholder. Nothing to unlock yet. | `RiftStuff[1]` |

**Skill Mastery tiers** (rank from the account-wide total of that skill, over all characters: `<150`=0, 150, 200, 300, 400, 500, 750, 1000=7; tier *k* is active when rank > k). Source: N.js `RiftStuff("skillLvRanks")`, TB [`misc.ts` L833-875](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L833-L875), bonus text from [wiki The Rift](https://idleon.wiki/wiki/The_Rift). (H)

| Total skill LV | Mining / Chopping / Fishing / Catching / Trapping / Worship | Smithing | Alchemy | Construction | Cooking | Breeding | Laboratory |
|---|---|---|---|---|---|---|---|
| 150 | +25% that skill's EXP | +25% EXP | +25% EXP | +25% EXP | +25% EXP | +25% EXP | +25% EXP |
| 200 | +10% that skill's efficiency | +25% Forge ore capacity | +5% all liquid cap | +15% Shrine LV-up rate | +10% Cooking eff | +15% egg incubation speed | +10% Lab eff |
| 300 | **All that skill's cards become passive** (owned, not equipped) | +5% total DMG | +5% total DMG | +5% total DMG | +5% total DMG | +5% total DMG | +5% total DMG |
| 400 | +10% all skill EXP | same | same | same | same | same | same |
| 500 | +5% all skill efficiency | same | same | same | same | same | same |
| 750 | +1% Printer output | same | same | same | same | same | same |
| 1000 | +25% all skill EXP | same | same | same | same | same | same |

The 200 tier for W5+ skills is Sailing +15% boat speed, Divinity +15% points, Gaming ×1.15 bits, Farming ×1.15 crop evo, Sneaking ×1.10 jade, Summoning ×1.10 essence. Spelunking has its own column. In TB's sum (`getSkillMasteryBonusByIndex`) the "+5% total DMG at 300" tier skips skill indices 0, 2, 3, 5, 6 and 8, which are the card skills.

**Construct Mastery tiers** (total Construction building levels, from Rift 40). Source: N.js `WorkbenchStuff("ConstMasteryBonus")` @7795518, TB [`construction.ts` L454-486](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/construction.ts#L454-L486), [wiki](https://idleon.wiki/wiki/The_Rift). (H)

| Total LV | Bonus |
|---|---|
| 250 (wiki) | +1% Refinery speed per 10 total LV. **Code pays `⌊total/10⌋%` from Rift 40 with no 250 gate.** Toolbox comment agrees with the code. |
| 500 | +35 max LV for the trapper drone |
| 750 | +2% DMG per 10 total LV over 750 |
| 1000 | +100 max LV for the Talent Library |
| 1250 | +5% build speed per 10 total LV over 1250 |
| 1500 | +100 max LV for all shrines |
| 2500 | +30 max LV for all wizard towers |

- **Feeds / fed by:** **fed by** the elite unlock (DK, ES and SB tasks), character count (the 3, 4 and 11-character tasks), AFK kill rate (the 200k, 1M and 5M AFK tasks), Death Note skull points, and damage (mob HP grows ~1.1–1.4× per level). **Feeds** W3 Trapping (Trap Box Vacuum), Star Signs (Infinite Stars, raised further by Breeding Shiny pets), every skill and Printer (Skill Mastery), Death Note (Eclipse Skulls), Stamps (Gilded Stamps), W5 Sailing (Eldritch), Vials (Vial Mastery), W3 Construction, Refinery, Shrines and Talent Library (Construct Mastery), Cards (Ruby), Killroy (Killroy Prime), W6 Sneaking, Cooking (Cooking Mastery), and the Tome ("Rift Levels Completed", max 500 PTS at 49).
- **Per-session actions:** check `account.rift.currentRift` and the current task type. *Active* tasks (500 kills in 5 min, Tear drops, mega monster, respawn race, Orb, Wormhole, Pirate Flag) are an **Active Play suggestion**, never part of a Verdict. *AFK* tasks (200k, 1M, 5M kills) want one or more strong AFK fighters on the Rift map. Once the quota is met, the level completes and the next task starts, so "Rift AFK kill task finished" is an idle state that should trigger a reassignment.
- **AFK Setup implications:** on an AFK-kill level, the best AFK fighter (the community names Blood Berserker as best AFK; C) goes to the Rift map. On any other level, nobody should sit in the Rift.
- **Min-max by stage:**
  - **Early W4:** do the Rift Ripper quest once Purple Mush Cap and Wurm Tail farming allows it. Levels 1–7 need no elite. **Level 8 blocks without a Divine Knight**, and level 9 without an Elemental Sorcerer, so get those two elites first if Rift progress is the Goal. Target **Rift 10** (Infinite Stars, +5 always-on signs) and **Rift 15** (Skill Mastery).
  - **Mid W4:** after Rift 15, Skill Mastery 150/200 thresholds on every skill are cheap Goals. A 6–8-character account reaches 150 total on most skills quickly. The 300 card-passive tier on Mining, Chopping, Fishing, Catching, Trapping and Worship frees card slots (TB `getSkillCardBonus` switches to *owned* cards). Level 16 needs a Siege Breaker.
  - **Late W4 → W5:** Eclipse Skulls (20) and Stamp Mastery (25) are long Goals. 30+ is W5+ content (HP in the billions).
  - **Per class:** DK (Orb), ES (Wormhole) and SB (Pirate Flag) must be leveled enough to hit their score in the Rift. The community guide gives "500 MOBS IN X MINUTES – DK, ES, BUBO" and "RIFT TEARS – ES" as the classes to use (C).
- **Common mistakes:** sitting on an active-task level with AFK characters on the Rift map. Not having an elite DK, ES or SB and being stuck at 8, 9 or 16 (detect: `currentRift ∈ {7, 8, 15}` and no character with `classIndex` 12 (DK) / 34 (ES) / 22 (SB)). Ignoring Skill Mastery thresholds that are a few levels away (detect: `totalSkillsLevels[s].level` within ~10 of 150/200/300).
- **Save and Toolbox fields:** raw `Rift` → `account.rift.currentRift`, `.currentProgress`, `.chars`, `.list` (task text). Skill Mastery: `account.totalSkillsLevels[skill].level` and `.rank` (0–7). Construct total: `account.towers.totalLevels`. Killroy: `account.killroy.totalKills` and `.totalDamageMulti`. Star signs: TB `getInfiniteStarsCount`. Both fixtures (W2 and W3) have `currentRift = 0`.
- **Sources:** N.js `_customBlock_RiftStuff` @10780337 (v1.23, 2026-10-17); N.js `RiftStuff` CustomList @14340734; TB `rift.ts`, `misc.ts`, `construction.ts`, `cards.ts`, `starSigns.ts`, `quests.json` @6827d3f (2026-10-17); [wiki The Rift](https://idleon.wiki/wiki/The_Rift) (rev 2026-10-07; carries an "outdated: Cooking Mastery" banner, but the content includes it); [wiki Changelog/2025](https://idleon.wiki/wiki/Changelog/2025) v2.41 (lava-skull task removed); [Changelog/2026](https://idleon.wiki/wiki/Changelog/2026) v1.17 (Cooking Mastery). Community class tips: Idleon Incomplete Guide, WORLD 4 tab (undated, after 2025-11). Nothing here predates v1.23 in code.

---

## Sigils

- **What it is:** 24 passive Alchemy bonuses. Characters are assigned to a sigil, and the sigil charges with sigil EXP over time. Five tiers: Unlock, Boost, Ionized (Jade), Ethereal, Eclectic. Each tier is a permanent, account-wide bonus.
- **Unlocks:** the **Laboratory** mainframe bonus **"Sigils of Olden Alchemy"** (Lab bonus index 12, x 400 / y 390, range 90) must be connected. Without it no sigil charges (`0 != MainframeBonus(12)` guard, N.js @5848670; TB `SIGILS_LAB_BONUS_INDEX = 12` [`alchemy.ts` L883-886](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-2/alchemy.ts#L883-L886); lab text in `shared-data.json` `labBonuses[12]`). The Sigils tab sits in W2 Alchemy, but in practice it is a W4 System. (H)
- **Scope:** bonuses are account-wide and passive. Charging is **per character**: each of the first 10 character slots (by character index) charges the one sigil it is assigned to. The assignment is the character's cauldron job (`CauldronJobs[1][i] ≥ 100`, sigil = value − 100), so a sigil-charging character **cannot also brew a bubble cauldron or a liquid**. It does not use the AFK target, so the character can fight or skill at the same time (N.js loop @5848670 checks only the job value; TB [`alchemy.ts` L843-861](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-2/alchemy.ts#L843-L861)). (H for the job slot, M for "AFK target irrelevant")
- **Inputs → outputs:** time. Each charging character adds `SigilBonusSpeed × hours`. Speed is `(1 + (Vial Junkee achievement 20 + Pea Pod sigil + 20·gem-shop item 110 + SigSpd vial + Sigil stamp)/100) × (1+Summoning winner) × (1+Sushi 41) × (1+Arcade 43) × (1+Turtle vial) × (1+Ballot 17) × (1+Gaming palette 20) × (1+Legend talent 31)` (N.js `_customBlock_Labb` "SigilBonusSpeed" @7977557; TB `getSigilSpeed` [L889-924](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-2/alchemy.ts#L889-L924)). Of these, a W4 account can only have the achievement, Pea Pod, gem shop, stamp, vial, and Arcade bonus 43. **Unlocking subtracts `unlockCost` from progress. Later tiers fire when the remaining progress reaches `boostCost` / `jadeCost` / `etherealCost` / `eclecticCost`, and nothing is subtracted.** So the total time to Boost is `unlockCost + boostCost` (N.js sigil draw routine @5948440–5952000). The W5 Sailing artifact Chilled Yarn multiplies all sigil bonuses ×2 to ×5 (TB `applyArtifactBonusOnSigil` [L971-983](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-2/alchemy.ts#L971-L983)). (H)
- **Tier gates** (TB `getSigilTierUnlocks` [L926-934](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-2/alchemy.ts#L926-L934); N.js @5950378 / @5950981 / @5951801). (H)

| Tier (`unlocked` value) | Gate | Reachable on a W4 account? |
|---|---|---|
| Unlock (−1 → 0) | Lab bonus connected | yes |
| Boost (0 → 1) | none | yes |
| Ionized / "Jade" (1 → 2) | W6 Jade Emporium "Ionized Sigils" (`Ninja("EmporiumBonus",31)`) | no |
| Ethereal (2 → 3) | W7 Spelunking lore boss 7 (`Spelunk("DoWeHaveLoreN1",6)`) | no |
| Eclectic (3 → 4) | W7 Research grid bonus 128 ("GreenSigilsUnlocked"), added v1.05 2026-02-20 | no |

- **Goals and Milestones:** each sigil's Unlock and Boost. Costs are sigil EXP, which equals character-hours at speed 1. Bonuses are listed as Unlock / Boost / Ionized / Ethereal / Eclectic (TB [`shared-data.json` `sigils` L38414](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/shared-data.json#L38414); matches [wiki Alchemy § Sigils](https://idleon.wiki/wiki/Alchemy), rev 2026-10-05). (H)

| # | Sigil | Effect | Unlock cost | Boost cost | Unlock+Boost | Running total | Bonus U / B / I / Et / Ec |
|---|---|---|---|---|---|---|---|
| 1 | Big Muscle | +base STR | 2 | 100 | 102 | 102 | 10 / 20 / 40 / 100 / 200 |
| 2 | Pumped Kicks | +base AGI | 3 | 150 | 153 | 255 | 10 / 20 / 40 / 100 / 200 |
| 3 | Odd Litearture | +base WIS | 5 | 200 | 205 | 460 | 10 / 20 / 40 / 100 / 200 |
| 4 | Good Fortune | +base LUK | 8 | 300 | 308 | 768 | 10 / 20 / 40 / 100 / 200 |
| 5 | Plunging Sword | +base damage | 15 | 700 | 715 | 1,483 | 75 / 225 / 1000 / 5000 / 10000 |
| 6 | Wizardly Hat | +% mana regen | 24 | 1,250 | 1,274 | 2,757 | 10 / 20 / 30 / 50 / 60 |
| 7 | Envelope Pile | −% stamp MAX-LEVEL upgrade cost | 60 | 2,500 | 2,560 | 5,317 | 12 / 25 / 40 / 65 / 75 |
| 8 | Shiny Beacon | first N kills/day spawn a Crystal mob | 120 | 4,000 | 4,120 | 9,437 | 1 / 2 / 5 / 10 / 12 |
| 9 | Metal Exterior | +% Class EXP | 250 | 7,000 | 7,250 | 16,687 | 6 / 12 / 20 / 50 / 70 |
| 10 | Two Starz | +Star Talent points | 500 | 10,000 | 10,500 | 27,187 | 10 / 25 / 45 / 100 / 125 |
| 11 | Pipe Gauge | +% Refinery cycle speed | 700 | 12,000 | 12,700 | 39,887 | 10 / 20 / 30 / 60 / 75 |
| 12 | Trove | +% Drop rate | 1,300 | 14,000 | 15,300 | 55,187 | 10 / 20 / 30 / 100 / 150 |
| 13 | Pea Pod | all sigils charge % faster | 2,100 | 15,000 | 17,100 | 72,287 | 25 / 50 / 100 / 450 / 600 |
| 14 | Tuft Of Hair | +% move speed (if < 175%) | 3,000 | 25,000 | 28,000 | 100,287 | 3 / 6 / 10 / 15 / 20 |
| 15 | Emoji Veggie | +% golden food bonus | 4,500 | 33,000 | 37,500 | 137,787 | 10 / 25 / 40 / 60 / 80 |
| 16 | VIP Parchment | +% library VIP | 6,300 | 42,000 | 48,300 | 186,087 | 10 / 25 / 50 / 100 / 150 |
| 17 | Dream Catcher | +% all skill AFK gains | 7,000 | 50,000 | 57,000 | 243,087 | 1 / 2 / 4 / 10 / 15 |
| 18 | Duster Studs | +weapon power | 8,000 | 60,000 | 68,000 | 311,087 | 3 / 7 / 15 / 25 / 40 |
| 19 | Garlic Glove | −% kitchen upgrade cost | 9,000 | 70,000 | 79,000 | 390,087 | 15 / 35 / 60 / 90 / 95 |
| 20 | Lab Tesstube | +% Lab EXP | 12,000 | 80,000 | 92,000 | 482,087 | 8 / 20 / 35 / 70 / 100 |
| 21 | Peculiar Vial | +% liquid regen | 17,000 | 120,000 | 137,000 | 619,087 | 15 / 25 / 35 / 50 / 65 |
| 22 | Loot Pile | +% sailing chest treasure | 23,000 | 160,000 | 183,000 | 802,087 | 10 / 20 / 30 / 60 / 100 |
| 23 | Div Spiral | +% Divinity EXP | 26,000 | 200,000 | 226,000 | 1,028,087 | 10 / 30 / 50 / 100 / 150 |
| 24 | Cool Coin | +% Jade coin gain | 30,000 | 250,000 | 280,000 | 1,308,087 | 20 / 50 / 100 / 250 / 400 |

Ionized / Ethereal / Eclectic costs run from 50 K / 250 K / 10 M (Big Muscle) to 2 M / 20 M / 1 T (Cool Coin). They are in the same TB table. Arithmetic: 6 characters at speed 1.2 give 7.2 EXP/h, so all 24 unlocks (130,016 EXP) take about 750 days. A W4 account should expect to **unlock roughly the first 12–13 sigils and boost a handful**.

- **Feeds / fed by:** **fed by** the Lab (connection to bonus 12), the Vial Junkee achievement (10 vials at Lv 9 gives +20%), a Sigil stamp, the SigSpd vial, the Arcade, and the gem shop. Later: Summoning, Sushi, Ballot, Gaming palette, Legend talents, Jade Emporium, Spelunking, Research. **Feeds** base stats (all four), base damage and weapon power (damage), Stamps (Envelope Pile cuts max-level cost), Crystal mobs (Shiny Beacon), Class EXP, Star Talent points, Refinery, Drop rate, golden food, the Library, skill AFK gains, Kitchens (Garlic Glove), Lab EXP, Alchemy liquids, Sailing, Divinity, Sneaking, and the Tome ("Total Sigil LV", max 120, 500 PTS).
- **Per-session actions:** (1) open Alchemy → **Sigils**. In the client, a sigil only levels when this page is drawn and its progress is past the threshold (M), so an unopened page means finished EXP is not yet a bonus. (2) Any character whose sigil is at its tier cap for this account (Boost on W4) is **idle**. Its EXP still piles up as progress (H), but that progress is useless until W6. Reassign it. (3) Check the Lab connection to bonus 12 still holds. If no one is AFK in the Lab, sigils stop charging.
- **AFK Setup implications:** sigils compete with bubble cauldrons and liquid for each character's single cauldron job. Characters 11 and up are better left on cauldrons or liquid, since they cannot charge sigils at all (TB `SIGIL_CHARGING_SLOTS = 10`). The Lab Verdict for the account must keep bonus 12 connected while sigils are being charged.
- **Min-max by stage** (my reasoning from the cost table and effects, since I found no dated community sigil priority list; label it as such in the Knowledge Base):
  1. **Early W4:** put ~3–4 characters on sigils. Unlock 1→9 in order. They are cheap: 487 EXP total for all nine unlocks. Envelope Pile (stamps) and Metal Exterior (Class EXP) are the high-value ones.
  2. Unlock **Two Starz, Pipe Gauge, Trove, Pea Pod** (4,600 more). Pea Pod's +25%/+50% speeds up every later sigil.
  3. **Boost** in value order: Envelope Pile (−25% stamp max-level cost), Trove (+20% DR), Metal Exterior, Two Starz, Pea Pod (+50% speed), Plunging Sword. Skip boosting Big Muscle through Good Fortune (+10 base stat each) until later.
  4. **W5:** unlock Emoji Veggie, Dream Catcher, Garlic Glove (once Cooking upgrades are a coin sink) and Lab Tesstube. Get the Chilled Yarn artifact.
- **Common mistakes:** a character still on a sigil that has reached Boost (detect: `sigils[i].unlocked === 1`, `characters.length > 0`, and `getSigilTierUnlocks().jade === false`). Sigils "not moving" because the Lab bonus is disconnected (detect: `chargeRate === 0` with characters assigned). An 11th or 12th character assigned to a sigil (detect: `index ≥ 10` in `sigils[i].characters`). A sigil's finished EXP not yet turned into a level (detect: `progress ≥ nextCost` in the snapshot. That is a Next Action: "open the Sigils page").
- **Save and Toolbox fields:** raw `CauldronP2W[4]` (pairs of `[progress, tier]`, tier −1..4) → `account.alchemy.p2w.sigils[]` `{name, unlocked, progress, characters[], nextCost, chargeRate, bonus, …costs}`, `account.alchemy.p2w.sigilSpeed.value` (with breakdown), `totalEtherealSigils`, `totalEclecticSigils`. Assignment: raw `CauldronJobs[1]` → `account.alchemy.activities[]` (`activity ≥ 100`). Lab gate: `account.lab.labBonuses[12]`. Both fixtures: all 24 sigils at −1, speed 1.0 (no Lab yet).
- **Sources:** N.js `_customBlock_Labb` "SigilBonusSpeed" @7977557, the sigil charge loop @5848670, and the tier draw routine @5948440 (v1.23, 2026-10-17). TB `alchemy.ts` L836-983, `shared-data.json` `sigils`, `achievements.json` [`Vial_Junkee` L1646](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/achievements.json#L1646) @6827d3f. [Wiki Alchemy](https://idleon.wiki/wiki/Alchemy) (rev 2026-10-05; "Sigils" redirects there). [Changelog/2026](https://idleon.wiki/wiki/Changelog/2026) v1.05 (Eclectic tier; Tome sigil metric now 120) and v1.14 (Eclectic bonus fix). The Sigil Syrup (24 h of sigil EXP) is a W7 item, out of scope.

---

## Tome

- **What it is:** a W4 scoreboard of 124 account metrics. Each is converted to points (PTS) on its own curve, and the PTS sum is the Tome score. The score drives permanent DMG (always), Skill Efficiency and Drop Rate (after unlock items), the Tome bubbles, and a monthly nametag reward by global percentile.
- **Unlocks:** the Tome stands in **Outer World Town** (map 150, W4 town) ([wiki Tome](https://idleon.wiki/wiki/Tome); the page revision is 2024-03-16, but it transcludes current bot tables). Metric *i* (ordered) is counted only when **account level** (the sum of all characters' class levels, TB `parsers/index.ts` L301) is at least `350 + 40i + 5·max(0,i−35) + 10·max(0,i−60) + 10·max(0,i−80) + 15·max(0,i−100)` (TB [`tome.ts` L34-60](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-4/tome.ts#L34-L60)). The first is at 350. The game's `TomeBonus` (N.js @10901328) has **no "Tome visited" gate**. Toolbox credits PTS to a pre-W4 save, so the DMG bonus likely applies before W4 (M, check in game). Global ranking only counts players who have opened the Tome ([Changelog/2025](https://idleon.wiki/wiki/Changelog/2025) v1.00).
- **Scope:** account-wide. One quirk: the "Statue Total LV" metric reads the **logged-in character's** statue levels (TB `calcActiveCharacterStatueLevels`, "TomeQTY[1]"), so the score depends slightly on which character you are on. The Tome bubbles use the logged-in character's class cauldron multiplier. (H)
- **Inputs → outputs:** inputs are the 124 metrics. Each metric's PTS is `ceil(curve(qty, x1) · x3)`, where `x1` is the pivot and `x3` the PTS scale. Curves (`x2`): 0 `(1.7q/(q+x1))^0.7` (max ≈1.45·x3); 1 `2.4·log10(q)/(2·log10(q)+x1)` (→1.2·x3); 2 `min(1,q/x1)`; 3 lower-is-better `(1.2(6x1−q)/(7x1−q))^5`, 0 if q > 5·x1; 4 `(2m/(m+x1))^0.7`, m = min(q,x1) (TB [`calcPointsPercent` L239-275](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-4/tome.ts#L239-L275)). Outputs (TB [`getTomeBonus` L208-237](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-4/tome.ts#L208-L237); N.js `Summoning("TomeBonus")` @10901328), all multiplied by `(1 + (Grimoire upg 17 + Troll set)/100)`:

| Bonus | Formula | Unlock |
|---|---|---|
| Purple Tome Pages | +`10·⌊PTS/100⌋^0.7` % DMG | default |
| Blue Tome Pages | +`4·⌊(PTS−4000)/100⌋^0.7` % Skill Efficiency | buy **2** from the Outer World Town (W4) shop and drop them at the Tome (`OptionsListAccount[196]`) |
| Red Tome Pages | +`2·⌊(PTS−8000)/100⌋^0.7` % Drop Rate | buy **7** from the Magma Rivertown (W5) shop (`OLA[197]`) |
| Golden Tome / Singed Tome | ×(1+4·⌊PTS/1000⌋^0.4 %) DMG / ×(1+3·⌊PTS/1000⌋^0.3 %) DR | Event Shop |
| Tome STR / AGI / WIS bubbles, Crop / Stealth / Essence chapters | bubble value × ⌊(PTS−5000)/2000⌋ stacks | 28th–30th bubbles of each cauldron |
| Nametags | one per rank tier (Top 50%…0.1%), claimable every ~30 days | rank ≥ Top 50% |

Arithmetic on the purple formula: 1,000 PTS = +50% DMG, 2,000 = +81%, 3,000 = +108%, 4,000 = +132%, 6,000 = +176%, 8,000 = +215%. Blue pages at 6,000 PTS = +33% skill efficiency.

- **Goals and Milestones:** every metric with its account-level gate, pivot, curve and the quantity for each bar colour (silver 40%, gold 75%, blue 99.9% of the curve). For curve 3, the quantity is the *most* you may have. Computed with TB's own curve on TB `tomeData` + `ninjaExtraInfo[32]` order (TB [`shared-data.json` `tomeData` L47539](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/shared-data.json#L47539); quantities in `calcTomeQuantity` [L282-418](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-4/tome.ts#L282-L418)). (H)

| # | Account LV to show | Metric | Pivot (x1) | Curve | Max PTS | Qty for silver (40%) | gold (75%) | blue (99.9%) |
|---|---|---|---|---|---|---|---|---|
| 1 | 350 | Account LV | 7,000 | saturating | 2175 | 1,323 | 4,476 | 9,966 |
| 2 | 390 | Account Skills LV | 18,000 | saturating | 1740 | 3,401 | 11,509 | 25,626 |
| 3 | 430 | Total Talent Max LV  (Tap for more info) | 12,000 | saturating | 870 | 2,267 | 7,673 | 17,084 |
| 4 | 470 | Items Found | 1,800 | linear (capped) | 1300 | 720 | 1,350 | 1,799 |
| 5 | 510 | Total Bubble LV | 1,000,000 | saturating (capped) | 1750 | 156,132 | 495,891 | 997,148 |
| 6 | 550 | Stamp Total LV | 10,000 | saturating | 1450 | 1,889 | 6,394 | 14,237 |
| 7 | 590 | Cards Total LV | 1,344 | linear (capped) | 1000 | 538 | 1,008 | 1,343 |
| 8 | 630 | Statue Total LV | 2,300 | saturating | 870 | 435 | 1,471 | 3,275 |
| 9 | 670 | Total Achievements Completed | 266 | linear (capped) | 850 | 107 | 200 | 266 |
| 10 | 710 | Unique Quests Completed | 323 | linear (capped) | 500 | 130 | 243 | 323 |
| 11 | 750 | Total Tasks Completed | 470 | linear (capped) | 470 | 188 | 353 | 470 |
| 12 | 790 | Vault Upgrade bonus LV | 1,200 | linear (capped) | 1200 | 480 | 900 | 1,199 |
| 13 | 830 | Most Money held in Storage | 25 | log | 600 | 1,778,280 | 6.8e+20 | — |
| 14 | 870 | Most Spore Caps held in Inventory at once | 9 | log | 240 | 178 | 31,622,777 | 2.3e+22 |
| 15 | 910 | Total Colosseum Score | 10 | log | 240 | 317 | 215,443,470 | 7.1e+24 |
| 16 | 950 | Trophies Found | 22 | linear (capped) | 700 | 9 | 17 | 22 |
| 17 | 990 | Nametags Found | 20 | linear (capped) | 700 | 8 | 15 | 20 |
| 18 | 1030 | Premium Hats Found | 75 | linear (capped) | 700 | 30 | 57 | 75 |
| 19 | 1070 | Best Spiketrap Surprise round | 13 | linear (capped) | 100 | 6 | 10 | 13 |
| 20 | 1110 | Tournaments Registrations | 365 | linear (capped) | 365 | 146 | 274 | 365 |
| 21 | 1150 | Lava Dev Streams watched | 20 | linear (capped) | 250 | 8 | 15 | 20 |
| 22 | 1190 | Total Minigame Highscore | 450 | linear (capped) | 100 | 180 | 338 | 450 |
| 23 | 1230 | Total AFK Hours claimed | 2,000,000 | saturating | 508 | 377,778 | 1,278,701 | 2,847,253 |
| 24 | 1270 | DPS Record on Shimmer Island | 20 | log | 420 | 100,000 | 4.6e+16 | — |
| 25 | 1310 | Total Arcade Gold Ball Shop Upgrade LV | 6,800 | linear (capped) | 1200 | 2,720 | 5,100 | 6,794 |
| 26 | 1350 | Most Balls earned from LBoFaF | 1,000 | saturating | 218 | 189 | 640 | 1,424 |
| 27 | 1390 | Jackpots Hit in Arcade | 4 | linear (capped) | 80 | 2 | 3 | 4 |
| 28 | 1430 | Star Talent Points Owned | 2,500 | saturating | 290 | 473 | 1,599 | 3,560 |
| 29 | 1470 | Average kills for a Crystal Spawn | 30 | lower is better | 403 | 112 | 69 | 30 |
| 30 | 1510 | Dungeon Rank | 30 | saturating | 363 | 6 | 20 | 43 |
| 31 | 1550 | Highest Drop Rate Multi | 40 | saturating | 508 | 8 | 26 | 57 |
| 32 | 1590 | Constellations Completed | 49 | linear (capped) | 300 | 20 | 37 | 49 |
| 33 | 1630 | Unique Obols Found | 107 | linear (capped) | 250 | 43 | 81 | 107 |
| 34 | 1670 | Total Vial LV | 962 | linear (capped) | 600 | 385 | 722 | 962 |
| 35 | 1710 | Total Sigil LV | 120 | linear (capped) | 500 | 48 | 90 | 120 |
| 36 | 1750 | Post Office PO Boxes Earned | 20,000 | saturating | 435 | 3,778 | 12,788 | 28,473 |
| 37 | 1795 | Highest Killroy Score on a Warrior | 3,000 | saturating | 290 | 567 | 1,919 | 4,271 |
| 38 | 1840 | Highest Killroy Score on an Archer | 3,000 | saturating | 290 | 567 | 1,919 | 4,271 |
| 39 | 1885 | Highest Killroy Score on a Mage | 3,000 | saturating | 290 | 567 | 1,919 | 4,271 |
| 40 | 1930 | Megafeathers Earned from Orion | 12 | saturating | 363 | 3 | 8 | 18 |
| 41 | 1975 | Megafish Earned from Poppy | 12 | saturating | 363 | 3 | 8 | 18 |
| 42 | 2020 | Megaflesh Earned from Bubba | 12 | saturating | 363 | 3 | 8 | 18 |
| 43 | 2065 | Fastest Time to kill Chaotic Efaunt (in Seconds) | 10 | lower is better | 231 | 37 | 23 | 10 |
| 44 | 2110 | Largest Oak Log Printer Sample | 9 | log | 480 | 178 | 31,622,777 | 2.3e+22 |
| 45 | 2155 | Largest Copper Ore Printer Sample | 9 | log | 480 | 178 | 31,622,777 | 2.3e+22 |
| 46 | 2200 | Largest Spore Cap Printer Sample | 9 | log | 360 | 178 | 31,622,777 | 2.3e+22 |
| 47 | 2245 | Largest Goldfish Printer Sample | 9 | log | 360 | 178 | 31,622,777 | 2.3e+22 |
| 48 | 2290 | Largest Fly Printer Sample | 9 | log | 360 | 178 | 31,622,777 | 2.3e+22 |
| 49 | 2335 | Total Best Wave in Worship | 1,000 | saturating | 435 | 189 | 640 | 1,424 |
| 50 | 2380 | Best Non Duplicate Goblin Gorefest Wave | 120 | saturating | 290 | 23 | 77 | 171 |
| 51 | 2425 | Total Prayer Upgrade LV | 673 | linear (capped) | 200 | 270 | 505 | 673 |
| 52 | 2470 | Total Digits of all Deathnote Kills | 700 | saturating | 870 | 133 | 448 | 997 |
| 53 | 2515 | Most Giants Killed in a Single Week | 25 | saturating | 363 | 5 | 16 | 36 |
| 54 | 2560 | Total Refinery Rank | 120 | saturating | 653 | 23 | 77 | 171 |
| 55 | 2605 | Total Atom Upgrade LV | 150 | saturating | 580 | 29 | 96 | 214 |
| 56 | 2650 | Total Construct Buildings LV | 4,000 | saturating | 1305 | 756 | 2,558 | 5,695 |
| 57 | 2695 | Equinox Clouds Completed | 31 | linear (capped) | 750 | 13 | 24 | 31 |
| 58 | 2740 | Most Greenstacks in Storage | 150 | saturating | 870 | 29 | 96 | 214 |
| 59 | 2785 | Total Cooking Meals LV | 5,400 | saturating | 1088 | 1,021 | 3,453 | 7,688 |
| 60 | 2830 | Total Kitchen Upgrade LV | 8,000 | saturating | 290 | 1,512 | 5,115 | 11,390 |
| 61 | 2875 | Highest Power Mob | 5 | log | 180 | 18 | 14,678 | 2.7e+12 |
| 62 | 2930 | Fastest Time reaching Round 100 Arena (in Seconds) | 50 | lower is better | 208 | 186 | 115 | 50 |
| 63 | 2985 | Total Shiny Mob LV | 750 | saturating | 363 | 142 | 480 | 1,068 |
| 64 | 3040 | Total Mob Breedability LV | 500 | linear (capped) | 200 | 200 | 375 | 500 |
| 65 | 3095 | Total Lab Chips Owned | 100 | saturating | 218 | 19 | 64 | 143 |
| 66 | 3150 | Rift Levels Completed | 49 | linear (capped) | 500 | 20 | 37 | 49 |
| 67 | 3205 | Total Onyx Statues | 28 | linear (capped) | 450 | 12 | 21 | 28 |
| 68 | 3260 | Total Artifacts Found | 185 | linear (capped) | 1000 | 74 | 139 | 185 |
| 69 | 3315 | Total Boat Upgrade LV | 10,000 | saturating | 290 | 1,889 | 6,394 | 14,237 |
| 70 | 3370 | Gold Bar Sailing Treasure Owned | 14 | log | 240 | 3,163 | 464,158,883,362 | — |
| 71 | 3425 | Highest Captain LV | 25 | saturating | 218 | 5 | 16 | 36 |
| 72 | 3480 | Most Gaming Bits Owned | 80 | log | 480 | 1e+20 | — | — |
| 73 | 3535 | Total Gaming Plants Evolved | 100,000 | saturating | 290 | 18,889 | 63,936 | 142,363 |
| 74 | 3590 | Best Gold Nugget | 9 | log | 240 | 178 | 31,622,777 | 2.3e+22 |
| 75 | 3645 | Highest Immortal Snail LV | 50 | linear (capped) | 300 | 20 | 38 | 50 |
| 76 | 3700 | Rat King Crowns Reclaimed | 100 | linear (capped) | 400 | 40 | 75 | 100 |
| 77 | 3755 | God Rank in Divinity | 10 | saturating | 290 | 2 | 7 | 15 |
| 78 | 3810 | Fastest Time to Kill 200 Tremor Wurms (in Seconds) | 30 | lower is better | 173 | 112 | 69 | 30 |
| 79 | 3865 | Total Opals Found | 500 | saturating | 580 | 95 | 320 | 712 |
| 80 | 3920 | Total LV of Cavern Villagers | 200 | saturating | 508 | 38 | 128 | 285 |
| 81 | 3975 | Total Digits of all Cavern Resources | 500 | saturating | 1088 | 95 | 320 | 712 |
| 82 | 4040 | Total Resource Layers Destroyed | 150 | saturating | 508 | 29 | 96 | 214 |
| 83 | 4105 | Best Dawg Den score | 7 | log | 300 | 57 | 681,293 | 2.5e+17 |
| 84 | 4170 | Best Bravery Monument Round | 50 | saturating | 363 | 10 | 32 | 72 |
| 85 | 4235 | Best Justice Monument Round | 200 | saturating | 363 | 38 | 128 | 285 |
| 86 | 4300 | Best Wisdom Monument Round | 18 | linear (capped) | 250 | 8 | 14 | 18 |
| 87 | 4365 | Total Gambit Time (in Seconds) | 3,600 | saturating | 580 | 681 | 2,302 | 5,126 |
| 88 | 4430 | Best Pure Memory Round Reached | 13 | linear (capped) | 50 | 6 | 10 | 13 |
| 89 | 4495 | Total Crops Discovered | 120 | linear (capped) | 350 | 48 | 90 | 120 |
| 90 | 4560 | Total Golden Food Beanstacks | 30 | linear (capped) | 400 | 12 | 23 | 30 |
| 91 | 4625 | Highest Crop OG | 6 | log | 240 | 32 | 100,000 | 8.1e+14 |
| 92 | 4690 | Total Land Rank | 5,000 | saturating | 290 | 945 | 3,197 | 7,119 |
| 93 | 4755 | Largest Magic Bean Trade | 1,000 | saturating | 290 | 189 | 640 | 1,424 |
| 94 | 4820 | Farming Stickers Found | 150 | saturating | 435 | 29 | 96 | 214 |
| 95 | 4885 | Ninja Floors Unlocked | 12 | linear (capped) | 250 | 5 | 9 | 12 |
| 96 | 4950 | Jade Emporium Upgrades Purchased | 50 | linear (capped) | 700 | 20 | 38 | 50 |
| 97 | 5015 | Total Ninja Knowledge Upgrades LV | 5,000 | saturating | 725 | 945 | 3,197 | 7,119 |
| 98 | 5080 | Total Career Summoning Wins | 160 | saturating | 725 | 31 | 103 | 228 |
| 99 | 5145 | Total Summoning Upgrades LV | 10,000 | saturating | 290 | 1,889 | 6,394 | 14,237 |
| 100 | 5210 | Familiars Owned in Summoning | 600 | saturating | 218 | 114 | 384 | 855 |
| 101 | 5275 | Total Summoning Boss Stone victories | 28 | saturating | 435 | 6 | 18 | 40 |
| 102 | 5355 | Most DMG Dealt to Gravestone in a Weekly Battle | 300,000 | saturating | 290 | 56,667 | 191,806 | 427,088 |
| 103 | 5435 | Most Tottoise in Storage | 5 | log | 180 | 18 | 14,678 | 2.7e+12 |
| 104 | 5515 | Best Deathbringer Max Damage in Wraith Mode | 10 | log | 480 | 317 | 215,443,470 | 7.1e+24 |
| 105 | 5595 | Best Windwalker Max Damage in Tempest Mode | 10 | log | 480 | 317 | 215,443,470 | 7.1e+24 |
| 106 | 5675 | Best Arcane Cultist Max Damage in Arcanist Mode | 10 | log | 480 | 317 | 215,443,470 | 7.1e+24 |
| 107 | 5755 | Total Royal Statue LV | 100 | saturating | 870 | 19 | 64 | 143 |
| 108 | 5835 | Royal Guardian Outposts Built | 65 | linear (capped) | 650 | 26 | 49 | 65 |
| 109 | 5915 | Total Resource Grade | 1,000 | saturating | 870 | 189 | 640 | 1,424 |
| 110 | 5995 | Spirited Valley Emperor Boss Kills | 100 | linear (capped) | 400 | 40 | 75 | 100 |
| 111 | 6075 | Total Coral Reef upgrades | 37 | linear (capped) | 400 | 15 | 28 | 37 |
| 112 | 6155 | Total Spelunk Shop Upgrades LV | 2,000 | saturating | 725 | 378 | 1,279 | 2,848 |
| 113 | 6235 | Total Spelunk Discoveries made | 90 | linear (capped) | 300 | 36 | 68 | 90 |
| 114 | 6315 | Deepest Depth reached in a single Delve | 100 | saturating | 435 | 19 | 64 | 143 |
| 115 | 6395 | Biggest Haul in a single Delve | 25 | log | 360 | 1,778,280 | 6.8e+20 | — |
| 116 | 6475 | Highest leveled Spelunker | 200 | saturating | 290 | 38 | 128 | 285 |
| 117 | 6555 | Minehead Opponents Defeated | 40 | linear (capped) | 600 | 16 | 30 | 40 |
| 118 | 6635 | Total Research Grid Upgrades | 109 | linear (capped) | 750 | 44 | 82 | 109 |
| 119 | 6715 | Total Glimbo Trades | 1,500 | saturating | 580 | 284 | 960 | 2,136 |
| 120 | 6795 | Unique Sushi Created | 64 | linear (capped) | 800 | 26 | 48 | 64 |
| 121 | 6875 | Button Presses | 300 | saturating | 725 | 57 | 192 | 428 |
| 122 | 6955 | Successful Jelly Operations | 72 | linear (capped) | 800 | 29 | 54 | 72 |
| 123 | 7035 | Luminous Menagerie Rank | 50 | linear (capped) | 1200 | 20 | 38 | 50 |
| 124 | 7115 | Total Menagerie Boosts Upg LV | 700 | saturating | 1088 | 133 | 448 | 997 |

- **Feeds / fed by:** **fed by** almost every System. The heaviest early metrics are Account LV (2,175 max), Account Skills LV (1,740), Total Bubble LV (1,750), Stamp LV (1,450), Items Found (1,300), Vault Upgrade LV (1,200), Cards LV (1,000), Achievements (850) and Talent Max LV (870). W4 metrics: Cooking Meals LV, Kitchen LV, Highest Power Mob, Shiny LV, Breedability, Lab Chips, **Rift Levels** (500 at 49), and the Astro Colosseum via Total Colosseum Score. **Feeds** damage (every character), Skill Efficiency and Drop Rate (after the pages), the STR/AGI/WIS bubbles, and the W7 Coral Reef "Tome Epilogue". The W3 Troll armor set and Grimoire upgrade 17 multiply all Tome bonuses.
- **Per-session actions:** daily, buy Blue Tome Pages from the W4 town shop until 2 are dropped in (the community guide says "buy … Blue Tome Pages daily"; C). Monthly, claim nametags if `account.tome.nametagClaim.available > 0`. The Tome itself has no idle or capped state. Its Goals are the cheapest next PTS, i.e. the metric whose next colour step costs least.
- **AFK Setup implications:** none directly. The Tome rewards breadth (levels on every character, many skills), which supports "level every character" over "stack one".
- **Min-max by stage:**
  - **W3 (account LV 350–700):** only lines 1–9 are visible. Account LV, Account Skills LV, Talent Max LV, Items Found, Bubble LV, Stamp LV, Cards LV, Statue LV and Achievements are all things the Meta Path already raises. The Tome is a scoreboard here, not a Goal.
  - **W4:** buy the 2 Blue pages early (they pay only above 4,000 PTS, but they cost little). Cheap jumps: **Trophies, Nametags, Premium Hats** (700 PTS each, linear), Vault upgrade LV, Unique Quests, Tasks, the Spiketrap round (13), Rift Levels.
  - **W5+:** Red pages (7 from the W5 shop) once near 8,000 PTS. Tome bubbles from 7,000 PTS.
- **Common mistakes:** never buying the Blue pages (detect: `accountOptions[196] !== 1` once W4 is reached). Not claiming monthly nametags. Misreading the "lower is better" metrics (Crystal spawn kills, the Chaotic Efaunt time, Arena-100 time, Tremor Wurm time), where a smaller quantity is better.
- **Save and Toolbox fields:** `account.tome.tome[]` `{name, index, tomeLvReq, quantity, points, maxPoints, color, requiredQuantities{silver,gold,blue}}`, `account.tome.totalPoints`, `.bonuses[]` (DMG, Skill_Eff, Drop_Rate, STR, AGI, WIS, DMG_Multi, Drop_Multi), `.top` (rank tier from `serverVars.TomePct`), `.nametagClaim {available, claimed, rewardTier}`. Page unlocks: `account.accountOptions[196]` (blue), `[197]` (red). Nametag counters: `[447]`, `[448]`. Account level: `account.accountLevel`. Fixtures: W2 save account LV 257 (0 metrics visible); W3 save account LV 379, 1 metric, 273 PTS, +16.25% DMG per Toolbox.
- **Sources:** TB `tome.ts` L34-418, `shared-data.json` `tomeData`/`ninjaExtraInfo` @6827d3f (2026-10-17); N.js `Summoning("TomeBonus")` @10901328 and Tome UI `_event_Tome2` @5702741 / `TomeQTY` @5773330 (v1.23); [wiki Tome](https://idleon.wiki/wiki/Tome) (page rev 2024-03-16, transcluded data current); [Changelog/2025](https://idleon.wiki/wiki/Changelog/2025) (v2.35 2025-04-01 lower LV gates; v1.00 2025-11-06 11 new metrics, monthly nametags); [Changelog/2026](https://idleon.wiki/wiki/Changelog/2026) (v1.05 sigil metric 120; Jackpots capped at 4; v1.20, v1.22 new metrics). **The metric list changes almost every patch.** Re-pull `tomeData` from Toolbox each patch, never hard-code it.

---

## W4 bosses (Massive Troll, Mutated Mush) and the Astro Colosseum

- **What it is:** the **Massive Troll** is the W4 (Hyperion Nebula) World Boss, at Enclave a la Troll (map 165). The **Mutated Mush** is the W4 summonable miniboss. The **Astro Colosseum** is the W4 score arena. **Chizoar is the W3 boss** ([wiki Bosses](https://idleon.wiki/wiki/Bosses), [Chizoar](https://idleon.wiki/wiki/Chizoar) rev 2026-10-02). His **Galaxial Amethyst** opens the W4 portal through the Carpenter Cardinal quest ([wiki](https://idleon.wiki/wiki/Carpenter_Cardinal)). Chaotic Chizoar matters later in W4 as Nebulyte's quest 2 for the Voidwalker line (TB `quests.json` `Nebulyte`). (H)
- **Unlocks:** reach Enclave a la Troll with a **Troll's Enclave Key**. Keys come from Stilted Seekers (the guide cites the NPC: 1 in 15,000; C), the Mutated Mush (1 in 2), Astro Colosseum chests (Bronze 1/167, Silver 1/83.3), W2 Post Office shipments, and the boss itself once the merit "Bosses can now drop Boss Keys" is bought (1/25 per level) ([wiki Massive Troll](https://idleon.wiki/wiki/Massive_Troll), rev 2026-10-02; [Colosseum/Astro](https://idleon.wiki/wiki/Colosseum/Astro), rev 2026-10-07). Mutated Mush: drop Toxic Sludge or Radioactive Waste on the mushrooms on Spaceway Raceway's top platform. The first regrowth takes ≥ 4 days, and stored spawns accumulate (table below; [wiki Mutated Mush](https://idleon.wiki/wiki/Mutated_Mush), rev 2026-09-30). Astro Colosseum: TV Outpost (map 152), 6 Colosseum Tickets ([wiki Colosseum](https://idleon.wiki/wiki/Colosseum)). (H, from bot data)
- **Scope:** each fight is per character (keys come from the shared inventory or storage). Unlocks, task progress and the W5 portal are account-wide.
- **Inputs → outputs:**

| Fight | Entry | HP / EXP | Card (effect) | Key drops |
|---|---|---|---|---|
| Massive Troll (Normal) | 1 key | 80 M / 750 K | Massive Troll Card: +6% Kitchen Speed (passive), 1/250 | **Magma Geode** (W5 portal, 100%), Troll Scales 13%, Jagged Obol of Massive Trolling 1/5K, Golden Ribs, upgrade stones, statues |
| Chaotic Troll | 5 keys | 350 M / 30 M | Chaotic Troll Card: +10% All Skill Efficiency, 1/5,000 | as above, better rates |
| Blitzkrieg Troll | 60 keys | 2 B / 1 B | Blitzkrieg Troll Card: +7% Total Damage, 1/333 | as above |
| Mutated Mush | barrel on mushrooms | 120 M / 2 M, respawn 86.4 K s | Mutated Mush Card: +6% Cooking EXP, 1/5 | **Mob Egg 60%**, Troll key 50%, Cooking Ladle ×3 100%, Souped Lab Ring 0.8%, Time Candy |

Troll mechanics: it never attacks. It shields itself and hands out random minigame "missions" (kill everything in 25 s, don't hit a Green Mushroom, coin flip, dice, keep climbing on a count of 10, 100 damage lines, …). Winning a mission opens the shield. Losing one heals the Troll. After "Begone Troll!" **tier 3** (kill it without failing a minigame), it starts vulnerable for 5 attacks in every later fight. The task tiers are: 1. defeat it; 2. succeed at 20 minigames; 3. a flawless kill (TB [`tasks.json` L1199](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/tasks.json#L1199); [wiki Massive Troll](https://idleon.wiki/wiki/Massive_Troll)). World bosses also roll a Gem (1/12 per merit level, for the first 150 boss fights per day; wiki). There is **no daily attempt cap in the data**. The limit is keys. (H for tasks, M for "no cap" as a negative finding)

- **Goals and Milestones:**

| Goal | Milestone | Why |
|---|---|---|
| First Troll kill | 1 | Magma Geode → Architect Toucan → W5 portal |
| Begone Troll! | tier 1 / 2 (20 minigames) / 3 (flawless) | tier 3 removes the minigames for good |
| Troll cards | Massive (+6% kitchen spd) → Chaotic (+10% all skill eff) → Blitzkrieg (+7% DMG) | passive card bonuses, card LV for the Tome |
| Mutated Mush spawns | stored spawns 1/2/3/4/5/6/7/8 after 4/7/12/19/28/39/52/67 days (only days with a login count) | eggs for Breeding, ladles for Cooking |
| Astro Colosseum chests | 0 / 125 K / 325 K / **650 K (1st Gold)** / 2.6 M / 4 M / 5.2 M / 5.85 M points | gold chests need all 15 waves cleared; they drop Troll keys, Lustre bars and gems; feeds Tome "Total Colosseum Score" |

- **Feeds / fed by:** **fed by** damage and survivability (Troll HP), Colosseum tickets, and Post Office. **Feeds** W5 access (Magma Geode), Cooking (Mush ladles, Troll card kitchen speed), Breeding (Mob Eggs from the Mush and the Colosseum; the guide calls "killing Mutated Mush using droprate build and high orb with DK or doing World 4 Colosseum" the best egg sources, C), Cards, Obols, and the Tome.
- **Per-session actions:** use stored Mutated Mush spawns whenever a Toxic Sludge or Radioactive Waste is on hand. Spend Troll keys when a character can win. Run the Astro Colosseum with spare tickets (the wiki suggests a Divine Knight for Colosseum AoE; note that "Orb of Remembrance does not affect W5/W6 colosseums" as of v2.08). None of these block a Verdict. They are Active Play suggestions.
- **AFK Setup implications:** key farming is AFK. The guide says "Just AFK with Bloodberserker or use 1 1h candy to get some keys" on Stilted Seekers (C).
- **Min-max by stage:** early W4: don't chase the Troll. Get the elites and Lab first. Mid W4: farm Mush spawns for eggs and ladles. Late W4: kill the Troll once for the Geode, then clear Begone Troll tier 3 early so later key runs need no minigames. Chaotic and Blitzkrieg are for the card farm in W5+.
- **Common mistakes:** looking for "Chizoar" as the W4 boss (wrong world). Letting Mush spawns sit unused (they accumulate, but only up to 8 per the table). Fighting the Troll without reading its minigame line.
- **Save and Toolbox fields:** keys and Geode in inventory or storage (`account.storage`, `characters[].inventory`). Task tier: `account.tasks` (W4 task `[3][6]`). Colosseum: `account.highscores.coloHighscores[name='astro'].score`. The Tome metric "Fastest Time to kill Chaotic Efaunt" is `accountOptions[207]` (that is the W2 boss, not W4). Both fixtures: astro score 0.
- **Sources:** wiki bot pages [Massive Troll](https://idleon.wiki/wiki/Massive_Troll) (rev 2026-10-02), [Mutated Mush](https://idleon.wiki/wiki/Mutated_Mush) (rev 2026-09-30), [Colosseum/Astro](https://idleon.wiki/wiki/Colosseum/Astro) (rev 2026-10-07), [Chizoar](https://idleon.wiki/wiki/Chizoar) (rev 2026-10-02), [Bosses](https://idleon.wiki/wiki/Bosses); TB `tasks.json`, `quests.json`, `shared-data.json` `mapNames` @6827d3f; [Changelog/2025](https://idleon.wiki/wiki/Changelog/2025) (W4 colosseum chest money nerf; invisible Troll fix). Community: Idleon Incomplete Guide WORLD 4 tab ("WORLD 4 BOSS: MASSIVE TROLL"; undated, after 2025-11). I did not trace the boss-fight code in N.js. The drop tables are from the wiki's bot data, the second tier under ADR 0004.

---

## Elite class unlock (Eliteus)

- **What it is:** the third class promotion. Each subclass becomes its single elite. That adds a 4th talent tab, a third specialty skill (all four W4 skills plus the W5 ones belong to elites), an Elite family bonus, and the classes that some Rift tasks require.
- **Unlocks:** **Eliteus** stands on **Outskirts of Fallstar Isle (map 154, W4 map 4)**. Quest 1, "The Greenie Gucci Gang": talking to him spawns 10 buffed `demonP` genies, and you must kill all 10 on map 154. If you re-enter with ≥2 kills, the count is set to 10. Reward: 750 M coins. Quest 2, "Elite Class for the Elites in Class": the picker opens only for class 8/9/20/21/32/33 (the six subclasses). **There is no level requirement.** (N.js `addDialogueFor("Eliteus")` @15561142, `_event_CLASSADVANCE` @24187882 and @24204015, per [mechanics research](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md); TB [`quests.json` L9309](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/quests.json#L9309); [wiki Eliteus](https://idleon.wiki/wiki/Eliteus) rev 2026-09-27.) The Journeyman line's elite, **Voidwalker**, does **not** come from Eliteus. It comes from Nebulyte's 3-quest line in W4: 1M Death Note kills on every W1–3 monster, Chaotic Chizoar, and 12 M Green Mushrooms solo (TB `quests.json` `Nebulyte`). The guide recommends it for "late World 5 or even World 6" (C). (H)
- **Scope:** per character (each character promotes on its own). Unlocking W4 portals is account-wide, but each character must reach map 154 itself.
- **Inputs → outputs:** input is reaching map 154 and killing 10 Greenie genies. The output is the elite below. There is **no choice**: TB [`classPromotions.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/classPromotions.json) lists exactly one `promotesTo` per subclass. The **Elite Class Swap Token** (gem shop Limited Special, last sold 2025-06-23, "no longer available") let you swap *within a base class*, e.g. Divine Knight ↔ Blood Berserker ([wiki](https://idleon.wiki/wiki/Elite_Class_Swap_Token)). (H)

| Subclass (idx) | Elite (idx) | Skills (main → 3rd) | Elite family bonus (decay, x1/x2, above Lv 69) | W4-relevant elite talents | Rift tasks it serves | Later master class |
|---|---|---|---|---|---|---|
| Barbarian (8) | **Blood Berserker** (10) | Mining, Fishing, **Cooking** | +% Total Damage (20 / 180) | Taste Test (finish recipes), Apocalypse Chow (+Cooking EXP/eff per 1M-kill mob), Waiting To Cool (+Cooking AFK), Overflowing Ladle, Tough Steaks | AFK-kill levels (best AFK fighter, C) | Death Bringer (W6) |
| Squire (9) | **Divine Knight** (12) | Mining, Construction, **Gaming** | +% Refinery Speed (50 / 150) | Orb of Remembrance (+1% active EXP and DR per orb kill), Divine Intervention, King of the Remembered | **Orb 180**: levels 8, 18, 29, 43 | Royal Guardian (W7, 2026-08-25) |
| Bowman (20) | **Siege Breaker** (22) | Smithing, Catching, **Sailing** | +% Faster Minimum Boat Travel Time (20 / 170) | Pirate Flag (Plunderous mobs), Archlord of the Pirates | **Pirate Flag 75**: levels 16, 22, 36, 65 | none (no `promotesTo`) |
| Hunter (21) | **Beast Master** (25) | Smithing, Trapping, **Breeding** | +% All Skill AFK Gains (5 / 180) | I Dream Of Peace And Egg (3 eggs per 10 h AFK), Shining Beacon Of Egg (+Breeding EXP, any player), Curviture Of The Paw (×Mob Power, any player), Whale Wallop (incubator −3 s) | — | Wind Walker (W6) |
| Wizard (32) | **Elemental Sorcerer** (34) | Choppin, Worship, **Divinity** | **+N levels to all talents above Lv 1** (20 / 350) | Dimensional Wormhole, Wormhole Emperor (+DMG for all chars per POW-10 wormhole kills) | **Wormhole 60**: levels 9, 27, 44; Rift Tears (C) | Spiritual Monk (`released: false`) |
| Shaman (33) | **Bubonic Conjuror** (36) | Choppin, Alchemy, **Laboratory** | +% All Stat (5 / 180) | Purple Tube (+Line Width to players right of you in Lab), Green Tube (+Lab EXP to the left), Essence Transferral, Upload Squared | 500-kills-in-5-min (C) | Arcane Cultist (W6) |

*Talent text: TB [`talents.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/talents.json). Family bonus: TB `shared-data.json` `classFamilyBonuses` (indices 10, 12, 22, 25, 34, 36), applied as `growth(decay, round(Lv−69), x1, x2)` (TB [`family.ts` L6-16](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/family.ts#L6-L16)). Skills from the wiki class pages (rev Sept–Oct 2026). (H)*

- **Goals and Milestones:** one per subclass character: elite unlocked. Then elite class level 69+ starts its family bonus (the first point of the decay). Account-level Goals: **DK + ES + SB elites** unblock Rift 8, 9 and 16. BM, BB and BC elites carry the W4 skills Breeding, Cooking and Lab.
- **Feeds / fed by:** **fed by** subclass (W2 Speccius), W4 portal access (Chizoar → Galaxial Amethyst), damage enough for 10 buffed genies. **Feeds** the Rift (class-gated tasks), Cooking (BB talents), Breeding (BM egg and mob-power talents, account-wide), Lab (BC tubes and Line Width, the best Lab placements), Construction / Refinery (DK family bonus), all talents (ES family bonus), and later Sailing, Gaming and Divinity (W5).
- **Per-session actions:** none once done. Until then, any subclass character in an account that has reached W4 has the Goal "go to map 154, kill the Greenie Gang, take your elite", and that is its Next Action. Talent points for the new 4th tab are a Spend Plan item right after promotion.
- **AFK Setup implications:** after promotion, each elite's specialty decides its W4 AFK slot. The community guide puts everyone AFK in the Lab connected to "Killer's Brightside" while pushing. BB is the AFK fighter. DK and ES are the active pushers ("If you struggle with damage … Divine Knight instead of Elemental Sorcerer"; C).
- **Min-max by stage** (C, Idleon Incomplete Guide W4 tab, undated after 2025-11, plus the code facts above):
  1. On arrival in W4: "complete Gobo's questline (you can't progress portals without it)", then "push everyone to map 4 (Demon Genie map) and get your elite classes. Throw everyone in lab and push your characters one by one".
  2. The order within that is open. Code favours **DK and ES first** (Rift 8/9 and the strongest pushers), then **BC** (Lab connections), **BB** (AFK fighter, Cooking), **BM** (Breeding), **SB** (needed for Rift 16; its Sailing specialty waits for W5).
  3. Duplicate subclasses get duplicate elites. A second Squire becomes a second Divine Knight, which matches the community's "2 DK" endgame setups (Incomplete Guide: "2 DK for construction"; the older IdleOn Guide Sheet, dated 2023-07-25: 1 BB, 2 DK, 1 BM, 2 SB, 1 BC, 2 ES, 1 VW). Two Squires, as on the W3 fixture account, are therefore not a dead end in W4.
- **Common mistakes:** believing there is an elite choice to plan. Leaving a subclass un-promoted in W4 (detect: `characters[].classIndex ∈ {8, 9, 20, 21, 32, 33}` and the account has the W4 portal / `finishedWorlds` includes W3). Waiting for a "level requirement" that does not exist. Hunting for a swap token that is no longer sold.
- **Save and Toolbox fields:** `characters[].classIndex` and `.class`; quest state in raw `QuestComplete_N` (`Eliteus1`, `Eliteus2`) via TB `account.quests`; family bonuses via TB `family.ts`; `characters[].level`. Both fixtures: no elites (W2 and W3).
- **Sources:** N.js Eliteus and `_event_CLASSADVANCE` (v1.23, via the mechanics research, 2026-10-17); TB `quests.json`, `classPromotions.json`, `talents.json`, `family.ts`, `shared-data.json` @6827d3f; wiki [Eliteus](https://idleon.wiki/wiki/Eliteus) (rev 2026-09-27), [Classes](https://idleon.wiki/wiki/Classes), the six elite class pages (rev Sept–Oct 2026), [Elite Class Swap Token](https://idleon.wiki/wiki/Elite_Class_Swap_Token); community: [Idleon Incomplete Guide](https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview) WORLD 4 and INTRO tabs (undated, after 2025-11-06, before 2026-08-25); IdleOn Guide Sheet (`2PACX-1vSCepYAs6sNDP4iq6MJNAG1pvFXzfC_3IQ7ttt5vfEEKAgQhIk4cQqnLRyeH6UyqDSuP4R-6WQeDmmP`) Ideal Class Setup, **dated 2023-07-25, stale** (pre-W5 masters).

---

## Sources

| Source | Version / date | Used for |
|---|---|---|
| `N.js` game client, `https://www.legendsofidleon.com/ytGl5oc/N.js` | Last-Modified 2026-10-17, sha256 `42da3130082762cf…`, v1.23 Luminous Menagerie | `RiftStuff` @10780337, `riftBonus` @10784771, `RiftSkillBonus` @10786678, RiftStuff list @14340734, `ConstMasteryBonus` @7795518, `Labb SigilBonusSpeed` @7977557, sigil charge loop @5848670, sigil tier routine @5948440–5952000, `TomeBonus` @10901328, Tome UI @5699134 / @5702741 / @5773330 |
| [Morta1/IdleonToolbox @ 6827d3f](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1) | 2026-10-17 | `parsers/world-4/rift.ts`, `parsers/world-4/tome.ts`, `parsers/world-2/alchemy.ts`, `parsers/misc.ts`, `parsers/world-3/construction.ts`, `parsers/cards.ts`, `parsers/starSigns.ts`, `parsers/family.ts`, `parsers/index.ts`; `data/website-data/shared-data.json` (`riftInfo`, `sigils`, `tomeData`, `ninjaExtraInfo`, `labBonuses`, `classFamilyBonuses`, `mapNames`), `quests.json`, `tasks.json`, `achievements.json`, `classPromotions.json`, `talents.json` |
| [Mechanics research](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md) | 2026-10-17 | Eliteus gate offsets |
| [wiki The Rift](https://idleon.wiki/wiki/The_Rift) | rev 2026-10-07 | Rift HP, bonus text, Skill and Construct Mastery text |
| [wiki Rift Ripper](https://idleon.wiki/wiki/Rift_Ripper) | rev 2026-09-27 | Rift quest |
| [wiki Alchemy](https://idleon.wiki/wiki/Alchemy) (Sigils) | rev 2026-10-05 | sigil table, speed sources |
| [wiki Tome](https://idleon.wiki/wiki/Tome) | rev 2024-03-16 (transcluded data current) | page sources, bonus list |
| [wiki Massive Troll](https://idleon.wiki/wiki/Massive_Troll), [Mutated Mush](https://idleon.wiki/wiki/Mutated_Mush), [Colosseum/Astro](https://idleon.wiki/wiki/Colosseum/Astro), [Colosseum](https://idleon.wiki/wiki/Colosseum), [Chizoar](https://idleon.wiki/wiki/Chizoar), [Bosses](https://idleon.wiki/wiki/Bosses), [Carpenter Cardinal](https://idleon.wiki/wiki/Carpenter_Cardinal) | rev 2026-09-30 – 2026-10-07 | boss stats, drops, keys, waves |
| [wiki Eliteus](https://idleon.wiki/wiki/Eliteus), [Classes](https://idleon.wiki/wiki/Classes), [Blood Berserker](https://idleon.wiki/wiki/Blood_Berserker), [Divine Knight](https://idleon.wiki/wiki/Divine_Knight), [Siege Breaker](https://idleon.wiki/wiki/Siege_Breaker), [Beast Master](https://idleon.wiki/wiki/Beast_Master), [Elemental Sorcerer](https://idleon.wiki/wiki/Elemental_Sorcerer), [Bubonic Conjuror](https://idleon.wiki/wiki/Bubonic_Conjuror), [Voidwalker](https://idleon.wiki/wiki/Voidwalker), [Elite Class Swap Token](https://idleon.wiki/wiki/Elite_Class_Swap_Token) | rev Sept–Oct 2026 | elite specialties, swap token |
| [wiki Changelog/2025](https://idleon.wiki/wiki/Changelog/2025), [Changelog/2026](https://idleon.wiki/wiki/Changelog/2026) | rev 2026-09-27 | patch dates: v2.35, v2.41, v1.00, v1.05, v1.14, v1.17, v1.20, v1.22 |
| [Idleon Incomplete Guide](https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview) (@shadowstorm2204) | undated, after 2025-11-06 and before 2026-08-25, so **one or more patches stale** | W4 order, class roles, Troll keys, Blue pages |
| IdleOn Guide Sheet (`2PACX-1vSCepYAs6sNDP4iq6MJNAG1pvFXzfC_3IQ7ttt5vfEEKAgQhIk4cQqnLRyeH6UyqDSuP4R-6WQeDmmP`) | dated 2023-07-25, **stale** | old ideal elite roster only |
| Reddit via Arctic Shift | not reached (HTTP "Too many requests", 2026-10-17) | none |

**Possibly outdated or unverified:** (1) The pre-W4 Tome DMG bonus is a code reading; check it in game. (2) The "sigils level only when the page is drawn" reading (M) should be tested by comparing a save's `progress` against `unlocked` before and after opening the page. (3) Boss drop rates come from the wiki's bot data, not from N.js. (4) No dated community sigil or Tome priority list was found. The sigil order above is our reasoning. (5) There is no Reddit pass.
