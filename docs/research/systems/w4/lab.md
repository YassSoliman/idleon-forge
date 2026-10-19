# Laboratory: system dossier (M26)

Verified 2026-10-19 against IdleOn Toolbox @ 6c37e3d (game 2.3.540). Paths are relative to `packages/toolbox-parsers/` in the fix-digits checkout unless they start `packages/`, `apps/` or `research/`. `LT` = `vendor/parsers/world-4/lab.ts`, `SD` = `vendor/data/website-data/shared-data.json`. Every `[Cn]` is registered with Source, tier (1 code/data, 2 Toolbox logic or ActiveOn repo, 3 wiki, 4 community) and date in the Claims register at the bottom. The earlier Lab dossiers (`research/w4-systems`, `research/skills`, Toolbox @ 6827d3f, 2026-10-17) were re-checked against the pinned code and data: all 18 node and 24 jewel rows, all 22 chips, the connection geometry and the rotation algorithm are unchanged. Three earlier statements were corrected here: the base connection range is 80 px, not 90 [C8]; the Rift mastery tiers are 150 and 200 total Lab levels, not 400 and 1,000 [C23]; and the move-speed chip is misindexed in Toolbox [C32]. N.js was not re-downloaded; N.js citations are carried from the 2026-10-17 read and marked so. Reddit was reachable through Arctic Shift this time, but thread dates were not returned reliably, so community claims are undated (flagged).

Revision 2 (2026-10-19) applied two adversarial verdict sets (source lens, game-data lens). No claim was refuted by both lenses, so none was removed. Four claims were refuted by one lens and are marked **Disputed** with both views: C2 (souped-tube keying), C17 (Black Diamond vs Line Width meals), C23 (Rift mastery owned-cards tier) and C25 (rotation reroll scope, corrected). Every claim now carries a confidence (H/M/L) in the register. Mechanics the verifiers found missing are added as M34-M46 and C57-C66.

## Laboratory

- **What it is:** a W4 town skill and board game. Characters whose AFK target is Laboratory sit in "tubes" on the Mainframe board and act as light-beam relays: a beam starts at a fixed prism, hops between characters within their Line Width, and lights fixed bonus nodes and bought jewels within the Connection Range of any lit character [C3][C4][C5][C6]. 14 W4 nodes (18 with W6) are account-wide multipliers on W1-W3 systems [C33]. Each character also has 7 chip slots of personal passives that work wherever it is [C27][C28]. Lab EXP levels the skill, which raises Line Width and opens chip slots [C12][C27].
- **Unlocks:** arrive in the W4 town (Outer World Town); Gobo's quest chain (Breeding 1-3, Cooking 4, Lab 5) teaches it and asks for one uploaded player and the first lit bonus; nothing in code gates by level [C55]. Chip Repository: hold a stack of 3 Pile of Processor Chips (W4 town shop); Jewel Spinner: hold 7 Strung Jewels (`accountOptions[91]` becomes 1 then 2) [C26]. Chip slots 1-7 at Lab level 5/10/15/25/35/50/75 [C27]. Nodes 14-17 and jewels 18-20 need W6 Jade Emporium buys (jewels 18-20 are also earnable free, one per 700 total Lab levels) [C24][C25]; jewels 21-23 are W7 and are consumed by the Grimoire, Compass and Tesseract [C7][C60]. Disputed: a wiki fetch summary calls the skill "exclusive to Bubonic Conjuror"; the code has no class gate, Bubonic Conjuror is the specialist class [C49] (confidence H for no gate).
- **Scope:** mixed. Account-wide: node and jewel effects, jewel ownership, the chip repository, the weekly rotation, souped-tube purchases. Per-character: Lab level, board position, Line Width, the 7 chip slots, and being in a tube. A node is on for the account only while the characters forming its chain are in tubes [C1][C5]. Chip bonuses apply only to the wearer [C31].
- **Inputs → outputs:** In: AFK time as Laboratory (Lab EXP) [C21][C22]; W1-W4 material stacks, 100 meals and 100 spices per chip and per jewel [C29][C35]; gems for optional shop items [C44]. Out: 18 node, 24 jewel and 22 chip effects (Mechanics catalogue). Lab level feeds Line Width (+2 px/level) and chip slots [C12][C27].
- **Goals and Milestones:**

  | Milestone | Reward | Claim |
  |---|---|---|
  | 2+ players chained to the prism | Animal Farm lit, Gobo 5 done | [C55] |
  | Hold 3 Processor Chips / 7 Strung Jewels | Repository / Spinner open | [C26] |
  | Lab Lv 5/10/15/25/35/50/75 per character | Chip slot 1..7 | [C27] |
  | Chain reaches ~400 | NBLB, Sigils (also Wired In 231, Gilded Tubing 333) | [C34] |
  | Chain reaches ~528 | Killer's Brightside | [C34] |
  | Chain reaches ~809 | Certified Stamp Book | [C34] |
  | Spelunker Obol lit (905) | Every jewel x1.5 | [C36] |
  | Chain reaches ~1115 | My 1st Chemistry Set | [C34] |
  | Chain reaches ~1267-1346 | Banking Fury, Viral Connection (+50% range) | [C34] |
  | Full colour group lit | Set jewel doubles (purple 3, blue 4, orange 4, green 5) | [C36] |
  | Total Lab levels 150 / 200 / 300 (Rift 15 done) | +25% Lab EXP / +10% Lab efficiency / all owned Lab cards count (**Disputed** for Lab EXP, see C23) | [C23] |
  | Total Lab levels 700 / 1,400 / 2,100 | Free Pure Opal jewel (18-20), if Bling known | [C24] |
  | Souped tubes 2/4/6/8/10 | +30% Line Width (keyed to Lab-AFK rank) and +30% Lab EXP per souped character, capped at +100% (keyed to raw player index). **Disputed**, see C2 | [C2][C44] |

- **Feeds / fed by:**
  - Feeds: Stamps (Certified Stamp Book), Alchemy vials (Chemistry Set), bubbles (NBLB, Pyrite Rhinestone), liquids (Viaduct), Sigils (Sigils of Olden Alchemy), Refinery (Gilded Tubing), 3D Printer (Wired In), Shrines (World Tour), portals and the Death Note (Killer's Brightside), damage (Animal Farm, Banking Fury, Pyrite Pyramite, Galvanic Software), coins (Fungi Finger), Cooking (Amethyst, Emerald Pyramite, Black Diamond Rhinestone), Breeding (Sapphire Rhombol, Emerald Rhinestone/Ulthurite), Construction (Sapphire Rhinestone), skilling (Emerald Navette, Galvanic chips), Star Signs/Trophy/Keychain/Pendant/Cards (Silkrode, Omega chips) [C41][C42]. W6-W7: Sailing artifacts, Slab, W6 skills, Crop Depot, master-class resources [C33][C42].
  - Fed by: Breeding (spices, species count, arena wave 150 +20% Line Width, shiny Line Width) [C19][C38]; Cooking (meals as costs and Lab buffs) [C17][C29]; Death Note (Green Mushroom kills) [C38]; Storage (green stacks) [C38]; W4 Merit Shop and Equinox and Summoning (range) [C9][C10][C11]; Bubonic Conjuror talents [C14][C15][C16]; cards [C18]; Rift mastery [C23]; Divinity gods Arctis/Goharut [C45].
- **Per-session actions:**
  1. Compare this week's rotation with what is owned; if a chip or jewel is unclaimed and affordable (materials + 100 meals + 100 spices), buy it [C25][C29]. Rollover is Thursday 00:00 UTC (`floor(GlobalTime/604800)`) [C25].
  2. Equip chips into any unlocked empty slot while the repository holds spares [C27][C43].
  3. Check every intended Lab character still has AFK target Laboratory and appears in `connectedPlayers` (a drifted character breaks everything past it) [C1][C5].
  4. After a Lab level-up or a new Line Width source, recheck the chain: wider beams may reach another node [C12].
  5. Idle/capped states: a character in a tube but not connected; an owned jewel unlit; Grounded Processor on a character already at 5x drop rate, Grounded Motherboard at 170% move speed (inert) [C28]; NBLB lit but no login that day [C39].
- **AFK Setup implications:** the Lab wants a dedicated group of characters AFK in tubes; they gain Lab EXP only. The leverage is account-wide (2x stamps, 2x vials, 3x refinery), so spare or off-meta characters go in first; Moving one out can switch a node off for the whole account, so any "do something else" suggestion must check the chain [C5][C41]. Chips help anywhere, so every character fills its slots. Souped Line Width goes to the earliest Lab-AFK characters in id order, but the Lab EXP soup bonus is keyed to the raw player index, so the two can land on different characters (**Disputed**, C2) [C2]. From W5, Arctis lets a character count as in the Lab while doing something else, and Goharut lets Lab time also earn Divinity [C45][C52].
- **Min-max by stage:** see the section below.
- **Common mistakes** (detectable from the save):

  | Mistake | Detection | Claim |
  |---|---|---|
  | Repository/Spinner never opened | `accountOptions[91]` < 1 / < 2 in W4 | [C26] |
  | Weekly chip or jewel skipped | `lab.currentRotation` vs this week; requirements met | [C25] |
  | Empty unlocked chip slots | `playersChips[c][i]` empty, Lab level >= threshold, `chips[].repoAmount > 0` | [C27][C43] |
  | Lab character drifted from Laboratory | intended char `afkTarget != 'Laboratory'`; `connectedPlayers` shorter than tubes | [C1][C5] |
  | Owned jewel unlit | `jewels[n].acquired && !active` | [C6] |
  | Inert conditional chips | drop rate >= 5x with Grounded Processor; move speed >= 170% with Grounded Motherboard | [C28] |
  | Viaduct lit too early | -30% liquid regen for x5 cap; only worth it when caps bind | [C33] |
  | Expecting All-Skill-EXP% to speed the Lab | the wiki and a community answer say it does not apply; Toolbox multiplies a separate account multiplier | [C21][C49][C51] |
  | Souped tubes assigned to wrong characters | Line Width soup goes to the first Lab-AFK ranks; Lab EXP soup to raw ids below slots x2 (**Disputed**, C2) | [C2] |

- **Save and Toolbox fields:** see the Fields table below.
- **Sources:** Claims register at the bottom.

## Mechanics catalogue

Letters: LW = Line Width, R = Connection Range, d = board distance [C3]. Board: prism at (43,229) [C4]. "Field" is the Toolbox-parsed path unless stated.

### A. Access and structure

| # | Mechanic | Rule | Caps / unlock / cost | Field |
|---|---|---|---|---|
| M1 | Lab access | Reach W4 town; Gobo 5 teaches it | no level gate [C55] | `characters[].skillsInfo.laboratory.level` (`Lv0[12]`) |
| M2 | Chip Repository | Hold 3 Pile of Processor Chips | `accountOptions[91] >= 1` [C26] | `account.accountOptions[91]`, `world4.ts` `repositoryOpen` |
| M3 | Jewel Spinner | Hold 7 Strung Jewels | `accountOptions[91] >= 2` [C26] | same; `spinnerOpen` |
| M4 | In-tube membership | AFK target Laboratory, or Arctis major (or a pocket Arctis, M42) | Line Width soup by Lab-AFK rank; Arctis-only chars by raw id [C1][C2][C63] | `characters[].afkTarget`, `account.lab.playersCords[]` |
| M5 | Board geometry | `d = .9604339*max + .397824735*min` | strict `<` comparisons [C3] | `LT#L289` |
| M6 | Prism connection | First tube player with `d(prism) < LW` | prism (43,229) [C4] | `account.lab.connectedPlayers` |
| M7 | Player chain | Unconnected tube player joins if `d < its own LW` of a connected one | repeats to fixpoint [C5] | `connectedPlayers[]` |
| M8 | Node/jewel lighting | Lit if connected player `d < R`; jewels must be owned | [C6] | `labBonuses[].active`, `jewels[].active` |
| M9 | Connection Range | `floor(80*(1+(PyriteRhombol+Viral)/100) + merit + fuse + summoning)` | merit 8 lv x1 px (2 merits each); Fuse 10 lv x1 px [C7][C9][C10][C11] | `LT#L293`; `account.tasks[2][3][4]`, `equinox.upgrades` |
| M10 | Fixed ranges | Spelunker, Viral (nodes), Pyrite Rhombol, Pure Opal Navette (jewels) 80; W7 jewels 100 | [C7] | `LT#L294-298` |
| M11 | Line Width | see C12; base `50 + 2*LabLv` | percent group +30 souped, +20 arena, +12 per Conductive Motherboard | `account.lab.playersCords[].lineWidth` |
| M12 | Sapphire Rhombol aura | x1.25 base LW within 150 px of the owned jewel | needs jewel owned, not lit [C13] | `jewels[5].acquired` |
| M13 | LW meals | Pancakes, Wild Boar +2 px per meal level (stat PxLine, skip every meal multiplier, including Black Diamond Rhinestone); Eel +1% (multiplied) | **Disputed**, see C17 | `account.cooking.meals` |
| M14 | LW card/arena/shiny | Crystal Custard px (cap 50); arena wave 150 +20%; shiny Line_Width_in_Lab | [C18][C19] | `cards`, `accountOptions[89]`, `breeding.pets` |
| M15 | Purple Tube | Bubo talent 535: LW % for players with x >= Bubo's x | decay x1=40 [C14] | `characters[].flatTalents` |
| M16 | Souped Up Tube | Each gem buy soups 2 tubes: +30% LW (by Lab-AFK rank), and +30% Lab EXP per souped character with the sum capped at +100% (by raw player index). **Disputed**, see C2 | 480 gems +65/buy, max 5 (10 tubes) [C2][C44] | `account.gemShopPurchases[123]`, `playersCords[].soupedUp` |

### B. Lab skill

| # | Mechanic | Rule | Caps | Field |
|---|---|---|---|---|
| M17 | Lab efficiency | C20 | none stated | `LT#L416 getLabEfficiencyParts` |
| M18 | Lab EXP rate | C21; efficiency term: below 1 it is (labEff/(10 x def))^0.25 with no prowess and no Inner Peace, at or above 1 it is floor(max(.,1)) with prowess and Inner Peace; min 0.1; Toolbox also multiplies by the All Skill EXP account multiplier while the wiki and a community answer say that does not apply (conflict, C21) | souped bonus capped at +100% | `character.ts#L1120` |
| M19 | Lab AFK gain | `0.5 + (TickTock + base + trapping + star sign + bribe)/100` x afkMulti | [C22] | `character.ts#L3548` |
| M20 | Green Tube | Bubo talent 536: Lab EXP % for players left of a Bubo | decay x1=60 [C15] | `talents.ts#L530` |
| M21 | Upload Squared | +% Lab EXP and efficiency, own character | decay x1=80 [C16] | `flatTalents` |
| M22 | Essence Transferral | x% of own Lab EXP also to the lowest-Lab-Lv player | not in any vendored parser [C16] | talents.json only |
| M23 | Wired In Power | + Weapon Power per 10 Lab levels | decay x1=7 [C16] | `damage.ts#L1153` |
| M24 | Lab EXP buffs | Garlicles Bread 2%, Sawdust 5%, Pretzel 7%; Gelatinous Cuboid card; Science Spare Parts (post office); Scienscion star sign +20%; Lab Tesstube sigil 8/20/35/70/100; Lab Knowledge vault (unlock lvl 2700, max 100); arcade +30 decay; stamp; vial; Matrix Evolved bubble; votes, lamp, vault 55, Magma set, palette (full list in M43) | [C17][C18][C21] | `character.ts#L1120-L1190` |
| M25 | Rift mastery | Lab rank (sum of Lab levels over characters): 150 -> +25% Lab EXP; 200 -> +10% efficiency; 300 -> all owned Lab cards count (**Disputed**: Toolbox's Lab EXP formula uses equipped cards only; the owned-cards tier is modelled only for mining, chopping, fishing, catching, trapping) | needs Rift 15; ranks 150/200/300/400/500/750/1000 [C23] | `account.totalSkillsLevels.laboratory.rank` |

### C. Chips

| # | Mechanic | Rule | Caps / cost | Field |
|---|---|---|---|---|
| M26 | Chip slots | 7 per character at Lab Lv 5/10/15/25/35/50/75 | [C27] | `account.lab.playersChips[charId][0..6]`; raw `Lab[1..]` |
| M27 | Chip ownership | Bought, never dropped; repository count per chip; equipped counts subtract | no max stated [C43] | `account.lab.chips[].repoAmount/amount/totalAmount`; raw `Lab[15]` |
| M28 | Stack rule | Chips 4,7,8,9,15-21 one per character; others stack | [C28] | `chips[].bool1` |
| M29 | Chip repository buy | material + 100 meal + 100 spice; one claim per slot per week | costs in [C29] | `lab.currentRotation`, raw `Lab[13]` |
| M30 | Weekly rotation | See C25: two chips, one jewel; the index reroll (21-23, or 18-20 without Bling, to max(1, idx-10)) applies to all three slots including chip slots | rollover Thu 00:00 UTC | `getChipsAndJewels(account, weeks)` (`cooking.ts#L1172`) |
| M31 | Gem Console Chip | random of 22, 385 gems, max 7/week | [C44] | `gemShopPurchases[121]` |
| M32 | Chip effects | The 22 in C28: def, move*, accuracy, drop*, attack speed, Lab EXP, LW, fighting AFK, skilling AFK, crystal chain, respawn, skilling efficiency, damage, base efficiency, multikill, star signs, trophy, keychain, pendant, weapon power, two card doublers (* conditional) | [C28] | `LT#L394 getPlayerLabChipBonus`, per-stat parsers [C31] |
| M33 | Modelling gaps | Chips 9 (crystal chain), 13 (+250 base efficiency) and 1 (misindexed) unread; move chip index bug | [C31][C32] | `character.ts#L3223` |

### D. Mainframe nodes (value x mult is bonusOn; jewel boosts add; Spelunker only multiplies jewels) [C33][C37]

| # | Node | Pos (d) | Effect and rule | Field |
|---|---|---|---|---|
| N0 | Animal Farm | 91,353 (138) | +1% damage per species bred (+0.5% with Purple Navette) [C38] | `labBonuses[0]`, `breeding.pets[].unlocked` |
| N1 | Wired In | 250,310 (231) | x2 printer samples for tube/Arctis chars [C41] | `labBonuses[1]` |
| N2 | Gilded Cyclical Tubing | 356,147 (333) | refinery cycles x3 [C41] | `labBonuses[2]` |
| N3 | No Bubble Left Behind | 450,220 (394) | daily lowest 3 (4 with Pyrite Rhinestone) bubbles +levels [C39] | `labBonuses[3]` |
| N12 | Sigils of Olden Alchemy | 400,390 (407) | enables Sigil charging [C40] | `labBonuses[12]` |
| N4 | Killer's Brightside | 538,362 (528) | kills x2 for portals/Death Note [C41] | `labBonuses[4]` |
| N5 | Shrine World Tour | 651,200 (595) | town shrine acts in all maps of the world [C41] | `labBonuses[5]` |
| N6 | Viaduct of the Gods | 753,113 (728) | liquid cap x5, regen -30% [C41] | `labBonuses[6]` |
| N7 | Certified Stamp Book | 824,377 (809) | non-MISC stamps x2 [C41] | `labBonuses[7]` |
| N8 | Spelunker Obol | 945,326 (905) | jewels x1.5; +50% Idle Skilling remembrance; 80 px fixed [C7][C36] | `labBonuses[8]` |
| N9 | Fungi Finger Pocketer | 990,148 (942) | +2% cash per 1M Green Mushroom kills (+1% Emerald Rhombol) [C38] | `labBonuses[9]` |
| N10 | My 1st Chemistry Set | 1177,163 (1115) | vials x2 [C41] | `labBonuses[10]` |
| N11 | Unadulterated Banking Fury | 1300,380 (1267) | +2% damage per green stack (+1% Black Diamond Ulthurite) [C38] | `labBonuses[11]` |
| N13 | Viral Connection | 1430,265 (1346) | +50% range for all except fixed-80; 80 px fixed [C7] | `labBonuses[13]` |
| W6 | N14-N17 | 1530-1950 | Artifact Attraction x1.5 (x1000 all max), Slab Sovereignty x1.25, Spiritual Growth +50% W6 EXP, Depot Studies PhD x1.30; W6 Jade buys [C33] | `labBonuses[14..17]` |

### E. Jewels (value is base; x Spelunker 1.5 when lit; 24 owned once each, one spinner buy per week) [C35][C36]

| # | Jewel | Pos | Effect | Cost (item + meal + spice) |
|---|---|---|---|---|
| J0 | Amethyst Rhinestone | 76,134 | cooking x1.5 speed, x2 with J1+J2 lit | 5 Strung Jewels, 2,000 Egg, 200 Grasslands |
| J1 | Purple Navette | 164,412 | Animal Farm +0.5%/species | 5 Googley Eyes, 2,000 Pie, 200 Jungle |
| J2 | Purple Rhombol | 163,218 | +40% Lab EXP all | 10 1-hr Time Candy, 2,000 Spaghetti, 200 Encroaching Forest |
| J3 | Sapphire Rhinestone | 246,110 | construction slot 1 x3 speed (slot 2 with all blue) | 10 Red Frisbee, 5,000 Garlic Bread, 400 Tree Interior |
| J4 | Sapphire Navette | 277,394 | +3% All Stat | 25 Woodular Circle, 5,000 Pizza, 400 Stinky Sewers |
| J5 | Sapphire Rhombol | 470,294 | +25% LW aura (owned); +25% Breeding EXP lit | 30 Golden Plop, 5,000 Pancakes, 400 Desert Oasis |
| J6 | Sapphire Pyramite | 490,112 | daily 2 lowest kitchen upgrades +1 | 2 Guild Giftbox, 5,000 Cabbage, 400 Beach Docks |
| J7 | Pyrite Rhinestone | 552,163 | NBLB +2 levels, 4 bubbles | 50 Glass Shard, 10,000 Dango, 1,500 Coarse Mountains |
| J8 | Pyrite Navette | 646,407 | non-consume chance x3, cap 90 to 98% | 2 Trimmed Rune Platelegs, 10,000 Octoplop, 1,500 Twilight Desert |
| J9 | Pyrite Rhombol | 680,319 | +30% range (not self), 80 px fixed | 50 Nuget Cake, 10,000 Canopy, 1,500 The Crypt |
| J10 | Pyrite Pyramite | 847,105 | x1.10 damage, x2 with all orange | 50 Ghost, 10,000 Cheese, 1,500 Frosty Peaks |
| J11 | Emerald Rhinestone | 998,404 | -28% egg incubation | 1 Baba Yaga Baby Eggs, 25,000 Eggplant, 5,000 Tundra Outback |
| J12 | Emerald Navette | 1079,233 | +200 base efficiency all skills, +10% action speed, x2 with all green | 80 Yellow Snowflake, 25,000 Wild Boar, 5,000 Crystal Caverns |
| J13 | Emerald Rhombol | 1085,121 | Fungi Finger +1%/1M | 120 Ice Age 3, 25,000 Riceball, 5,000 Pristalle Lake |
| J14 | Emerald Pyramite | 1167,390 | cooking +1% per 25 kitchen upgrade levels | 150 Black Lense, 25,000 Durian Fruit, 5,000 Nebulon Mantle |
| J15 | Emerald Ulthurite | 1300,208 | shiny passives level +30% faster | 200 Lost Batteries, 25,000 Bunt Cake, 5,000 Starfield Skies |
| J16 | Black Diamond Rhinestone | 1365,100 | all meals x1.16 (not the two PxLine Line Width meals, Pancakes and Wild Boar; Eel and Lab EXP meals are multiplied); force-lit during Line Width recalculation when owned but unlit (M34) | 300 Pearler Shell, 100,000 Leek, 10,000 Starfield Skies |
| J17 | Black Diamond Ulthurite | 1389,408 | Banking Fury +1%/stack | 10,000 Voodofish, 100,000 Pretzel, 10,000 Shores of Eternity |
| J18-J20 | Pure Opal (W6) | 1619-2040 | Slab +20%, all Mainframe x1.10 (80 px), Depot +10% | W6 materials; need Bling [C24][C25] |
| J21-J23 | W7 jewels | 1728-2042 | +50% Death Bringer Bones / Windwalker Dust / Arcane Cultist Tachyons, 100 px | 1,000 Dark Lantern, 10M Sticky Bun, 10,000 Bamboo Forest |

Set doubling and boosts: [C36][C37]. Raw owned flags `Lab[14]`; parsed `account.lab.jewels[]` `{acquired, active, bonus, multiplier, x, y}`.

### E2. Added by verification (revision 2)

| # | Mechanic | Rule | Claim | Field |
|---|---|---|---|---|
| M34 | Black Diamond Rhinestone force-light | While recalculating Line Width, an owned but unlit jewel 16 is temporarily set active, then restored, so meals get its multiplier in the width maths even when it is not in reach | [C57] | `LT#L170-L176` |
| M35 | Unconnected nodes use bonusOff | An unlit node returns `bonusOff`, not 0: Wired In 1, Gilded Tubing 1, Stamp Book 1 and Spelunker Obol 1 (neutral multipliers); other nodes 0 | [C58] | `LT#L286` |
| M36 | Pyrite Rhombol range scaling | The +30% range value is multiplied by the Spelunker Obol multiplier and doubles with the full orange set; the jewel must be lit | [C7][C59] | `LT#L293-L301` |
| M37 | Jewel 19 adds, others multiply | Pure Opal Navette adds its raw bonus to the Spelunker Obol value; every other jewel is multiplied by the Obol | [C59] | `LT#L196-L215` |
| M38 | Rotation reroll hits chips | Chip 21 becomes 11; chips 18-20 without Bling become 8-10; jewels 21-23 become 11-13; jewels 18-20 without Bling become 8-10 | [C25] | `cooking.ts#L1214-L1224` |
| M39 | W7 jewel consumers | Jewel 21 feeds the Grimoire (Deadly Wrath), 22 the Compass (North Winds), 23 the Tesseract (Eternal Energy); all are 100 px jewels | [C60] | `grimoire.ts#L267`, `compass.ts#L601`, `tesseract.ts#L388` |
| M40 | Wired In printer gate | Wired In doubles printer samples for a character AFK in the Lab or with Arctis's major bonus; board connection is not required | [C41][C61] | `printer.ts#L22-L26` |
| M41 | NBLB bubble count extras | Upgradeable bubble count = clamp(round(base + Pyrite Rhinestone + Amberite artifact + Merit), 3, 10); bundle, event shop and Tachyon Truth change the level gain | [C39][C62] | `alchemy.ts#L1069-L1130` |
| M42 | Pocket Arctis | Holes extraCalculations 29/30 holding Arctis count every character as in the lab for Divinity; pocket Goharut gives lab-time Divinity | [C63] | `divinity.ts#L277-L345` |
| M43 | Lab EXP additive sources | Post office, card, chip 5, Green Tube, Upload Squared, jewel 2, meals, stamps, vials, Matrix Evolved bubble, souped, gear, LAB_TESSTUBE sigil, mastery, star sign, arcade, vote 31, lamp, vault upgrade 55, Magma set, palette 27. Essence Transferral is not modelled | [C21][C64] | `character.ts#L1126-L1190` |
| M44 | Shiny Line Width source | Shiny pets with `Line_Width_in_Lab` add a percent to Line Width | [C19][C65] | `LT#L340` |
| M45 | Silkrode Motherboard (W7) | Chip 16 gives +10 Gallery multiplier for the wearer | [C30][C66] | `gallery.ts#L311` |
| M46 | Inner Peace talent | Counts toward Lab EXP only when the efficiency term is at least 1 | [C21] | `character.ts#L1147-L1160` |

### F. Gates in other worlds (one line each)

- **W5:** Arctis (always in the Mainframe, no Lab EXP), Goharut (Lab time also counts at the altar), Harriep (3x printer) [C45]; Artifact Attraction feeds Sailing [C33].
- **W6:** Jade Emporium Matrix nodes 14-17, Laboratory Bling, Spiritual Growth, Depot Studies; Pure Opal jewels [C24][C33].
- **W7:** W7 jewels 21-23 (Tesseract/Compass/Grimoire), chip text swaps (Silkrode) [C30][C42].

## Fields

| What | Where |
|---|---|
| Raw save | `Lab` array [C43] |
| Parsed | `account.lab.{playersCords, playersChips, connectedPlayers, jewels, chips, labBonuses, totalRawChips, currentRotation}` (`LT#L246`) |
| Per character | `characters[].skillsInfo.laboratory`, `characters[].afkTarget`, `flatTalents`, `playerId` |
| Account | `account.accountOptions[91]` (unlock stage), `account.accountOptions[89]` (arena wave), `account.gemShopPurchases[121..123]`, `account.tasks[2][3][4]` (merit range), `account.equinox.upgrades`, `account.rift.currentRift`, `account.totalSkillsLevels.laboratory.rank`, `account.cooking.{meals,spices}`, `account.breeding.pets`, `account.storage.greenStacks`, `account.deathNote[0].mobs[0].kills` |
| Computed by Toolbox (ADR 0005) | Line Width, chain, lit nodes/jewels with set and Spelunker multipliers, Lab efficiency/EXP, future rotations, chip bonus per character |
| ActiveOn today | `account.lab` (`LabState`) in `packages/account-state/src/world4-types.ts`; reads `LAB_CHIP_SLOTS = 7`, `OPT.labUnlocks = 91` [C47] |

## Min-max by stage

Priorities marked (O) are derived from the formulas and effects, not quoted from a guide. Everything else cites a source.

- **W1 (before the Lab exists):** nothing to do in the Lab. Bank the future inputs: Copper and Oak stacks (chip costs 20-30k) [C29]; the Lab is not reachable [C55]. (O: do not discard stack-able W1 materials once Lab chips are in sight.)
- **W2 / W3:** same; Alchemy bubbles, vials, stamps, Refinery are the systems the nodes will later double [C41]. Build them first; each is worth more once the Lab is lit.
- **W4 arrival (first hours):**
  1. Finish Gobo's quests Breeding, Cooking, Lab; "complete Gobo's questline first" [C54][C55].
  2. Buy 3 Processor Chips and 7 Strung Jewels at the town shop to open the Repository and Spinner [C26].
  3. Upload 2-3 spare characters to light Animal Farm and Wired In; add Gilded Tubing with the third [C34][C46][C55].
  4. Lab EXP is the early bottleneck: "alchemy, vials, stamps, dishes, Bubo far right, lab efficiency gear, proper card set, souped rings, post office" [C51].
- **Early W4 (priority order of nodes, O with data basis):**
  1. Killer's Brightside (528): community's own first goal ("double portal kills as quickly as I can") [C53] and "every other character AFK in lab connected to Killer's Brightside" while one pushes [C54].
  2. NBLB + Sigils (394/407) and Wired In + Gilded Tubing (231/333).
  3. Certified Stamp Book (809): doubles every non-MISC stamp, the largest single multiplier; needs about 5 chars at LW 150 or 4 at LW 200 [C34][C46].
  4. Chips: Conductive Nanochip (Lab EXP) and Conductive Motherboard (+12% LW) on Lab characters; Galvanic Software (+10% damage, stacks), Conductive Software on fighters; Galvanic Motherboard and Conductive Processor on skillers [C28][C50].
  5. Cook Pancakes for px Line Width [C17].
- **Mid W4:**
  1. Light Spelunker Obol (905) early: x1.5 on every owned jewel [C36].
  2. Jewel buy order (O): Pyrite Rhombol (+30% range, makes the whole board reachable), Sapphire Rhombol (LW aura, place a Lab character within 150 px), Purple Rhombol (+40% Lab EXP), Pyrite Pyramite (damage), Amethyst Rhinestone (cooking), then finish colour sets (purple 3, blue 4, orange 4, green 5) for the x2 [C35][C36]. The spice for Pyrite jewels (Coarse Mountains, 1,500) is the bottleneck [C53].
  3. Reach My 1st Chemistry Set (1115) [C34].
  4. Bubonic Conjuror placement: Bubo to the right of the others for Green Tube EXP ("Bubo far right"); Purple Tube favours players right of the Bubo, so they trade off [C14][C15][C51].
  5. Spend gems (optional): Souped Up Tubes on the earliest Lab-AFK ids [C2][C44].
  6. Reach Lab level 75 on core Lab characters (7th chip slot); community notes 75 as the stopping threshold [C27][C53].
- **Late W4:**
  1. Banking Fury (1267) and Viral Connection (1346); Viral +50% range lights what was out of reach [C7][C33].
  2. Complete orange and green sets; Black Diamond Rhinestone for meals [C35][C36].
  3. One-per-character chips on the main pusher: Silkrode (star signs), Poker Chip, Omega Nanochip/Motherboard [C28].
  4. Rift 15: get total Lab levels to 150 (+25% Lab EXP) then 200 (+10% efficiency) [C23].
  5. Grounded Processor only for characters below 5x drop rate [C28].
- **Per class (O):** Bubonic Conjuror: place and level Purple/Green Tube, Upload Squared on itself [C14][C15][C16]. Divine Knight / Elemental Sorcerer pushers: damage chips [C28]. Wizard-line: Smart Efficiency lifts Lab efficiency [C20].
- **W5+ outline:** pull Lab characters to the Divinity altar first, unlock Goharut, then return them to the Lab; Arctis keeps the board lit while characters do something else [C45][C52]. W6: buy Matrix nodes and Pure Opal jewels. W7: Tesseract jewels, chip text swaps [C24][C30][C33].

## Sprite and build notes (for ActiveOn)

- Existing: `sys-lab`, `item-chip`, `item-jewel` (generic). [C47]
- New sprites worth adding if the Lab page shows the board: one 16x16 per Mainframe node family (18), one per jewel colour (purple, blue, orange, green, black diamond, opal, W7; 7), chip family badges (Grounded, Conductive, Galvanic, Silkrode, Omega; 5), the prism, a souped-tube marker. These are art tasks, not research blockers.
- Detector candidates (needs Lab spec): nobody uploaded in W4; node in reach but not lit; Repository/Spinner not opened; weekly chip/jewel unclaimed and affordable; empty unlocked chip slot with spares; owned jewel unlit; drifted Lab character; inert conditional chip [C47][C48].

## Open questions

1. Toolbox mis-indexes the move-speed chip (index 15 vs 1) [C32]; confirm in game before ActiveOn copies the number.
2. Does the in-game Lab EXP formula apply the All-Skill-EXP multiplier? Toolbox multiplies by `getAllSkillExpMultiplier`; the wiki and a community answer say All Skill EXP% does not apply. Both views recorded, confidence L [C21][C49][C51].
3. Connection range base: data `range:90` vs code 80 [C8]; N.js was not re-read on the pinned patch.
4. Chip slot thresholds come from a non-vendored UI file at the previous pin [C27]; re-verify against N.js.
5. Galvanic Processor (+250 base efficiency) and Chocolatey Chip are not read by any parser [C31].
6. Community priority orders are thin and undated; no per-stage consensus guide for jewels was reachable (Idleon Academy and the Incomplete Guide sheet did not load; web search budget was exhausted).
7. Essence Transferral is unmodelled in Toolbox [C16].
8. How jewels 21-23 are acquired beyond the spinner is unconfirmed: the rotation rerolls them away [C25][C60].
9. Souped Lab EXP (raw player index) versus Line Width (Lab-AFK rank) keying is a Toolbox reading; confirm in game [C2].

## Claims register

Date verified for every row: 2026-10-19 (carried N.js rows verified 2026-10-17). Tier: 1 code/data, 2 Toolbox logic or ActiveOn repo, 3 wiki, 4 community. Game version 2.3.540; none of the claims is pre-patch except the undated community rows (C51-C54, C56), which are flagged.

| Claim | Tier | Conf | Source | Statement |
|---|---|---|---|---|
| [C1] | 1 | H | vendor/parsers/world-4/lab.ts#L93-L95; vendor/data/website-data/shared-data.json gods[1].majorBonus | A character is in a Lab tube when its AFK target is Laboratory, or when the Arctis major divinity is active for it (Arctis gives no Lab EXP: data text only, Toolbox does not implement a no-Lab-EXP clause). |
| [C2] | 1 | M | vendor/parsers/world-4/lab.ts#L88,L106-L115,L333; vendor/parsers/character.ts#L1136-L1138,L1157 | Souped-Up Tube: soupedUpSlots = gemShopPurchases[123] x 2. A Lab-AFK character is souped when its rank among Lab-AFK characters (in playerId order) is below that number; an Arctis-only character is souped by its raw playerId. **Disputed.** View A (first read): rank-based souping applies to both Line Width and Lab EXP. View B (game-data lens, character.ts#L1144): Line Width soup (+30% on the percent sum) uses the Lab-AFK rank (Arctis-only characters use raw playerId), but Lab EXP reads `playersCords.soupedUp`, which is raw playerId < soupedUpSlots, not the rank; the Lab EXP term is min(100, 4 x 30) = +100%. Correction adopted: Line Width +30% by rank among Lab-AFK ids; Lab EXP bonus keyed to raw player index < gemShop[123] x 2. |
| [C3] | 1 | H | vendor/parsers/world-4/lab.ts#L289-L291 | Board distance is octagonal: 0.9604339*max(|dx|,|dy|) + 0.397824735*min(|dx|,|dy|). |
| [C4] | 1 | H | vendor/parsers/world-4/lab.ts#L150-L155,L357-L366 | The prism sits at (43,229). The first in-tube player (in character order) whose distance to the prism is strictly below its own Line Width becomes the first connected player. |
| [C5] | 1 | H | vendor/parsers/world-4/lab.ts#L144-L189,L368-L377 | Player-to-player link: an unconnected tube player joins when its distance to a connected player is below the candidate's own Line Width. The loop repeats until no new connection appears. |
| [C6] | 1 | H | vendor/parsers/world-4/lab.ts#L380-L392 | A node lights when a connected player is strictly within the node's range; a jewel lights the same way but only if it is owned (acquired). Lighting is evaluated on the full board, so a lit node needs no minimum Lab level of its own. |
| [C7] | 1 | H | vendor/parsers/world-4/lab.ts#L165-L168,L293-L301 | Connection range = floor(80*(1+(Pyrite Rhombol bonus + Viral Connection bonus)/100) + W4 merit px + Equinox Laboratory Fuse px + Summoning win bonus). Fixed 80 px: Spelunker Obol and Viral Connection (nodes), Pyrite Rhombol and Pure Opal Navette (jewels). Fixed 100 px: the three W7 jewels (21-23). Pyrite Rhombol's percent is multiplied by Spelunker Obol's multiplier and the pyrite set doubling; the jewel must be lit. |
| [C8] | 1 | M | vendor/data/website-data/shared-data.json labBonuses[].range; vendor/parsers/world-4/lab.ts#L300; research/w4-systems lab dossier (N.js _customBlock_Labb @7971217) | The game data carries range:90 on most nodes and jewels, but Toolbox's code uses 80 as the base and ignores that field. Code and the earlier N.js read (80) win; treat 90 as a stale data field. range:90 is confirmed in labBonuses and jewels and lab.ts uses 80; N.js agreement is unverifiable here. |
| [C9] | 1 | H | vendor/data/website-data/shared-data.json merits[3][4]; vendor/parsers/world-4/lab.ts#L128 | W4 Merit Shop 'connection range' upgrade: +1 px per level, 8 levels, 2 merits each (read from tasks[2][3][4]). |
| [C10] | 1 | H | vendor/data/website-data/shared-data.json equinoxUpgrades 'Laboratory_Fuse' (~L8089); vendor/parsers/world-4/lab.ts#L137 | Equinox 'Laboratory Fuse': +1 px connection range per level, max level 10. |
| [C11] | 1 | H | vendor/data/website-data/summoningEnemies.json (bonusId 4); vendor/parsers/world-4/lab.ts#L138 | Summoning win-bonus '+{ Lab Con Range' (bonusId 4, 0.3 per win quantity on the listed enemies) adds px of range. |
| [C12] | 1 | H | vendor/parsers/world-4/lab.ts#L323-L355 | Line Width = floor((50 + 2*LabLv [x1.25 inside 150 px of an owned Sapphire Rhombol] + meal px + min(Crystal Custard card px, 50)) x (1 + (Purple Tube + meal % + Conductive Motherboard chips + 20 x arena wave-150 flag + shiny 'Line Width in Lab' + 30 if souped)/100)). |
| [C13] | 1 | H | vendor/parsers/world-4/lab.ts#L327-L332; vendor/data/website-data/shared-data.json jewels[5].effect | The Sapphire Rhombol Line Width aura needs the jewel owned, not lit. |
| [C14] | 1 | H | vendor/parsers/world-4/lab.ts#L129-L135,L342-L352; vendor/data/website-data/talents.json Bubonic_Conjuror.PURPLE_TUBE | Purple Tube (Bubonic Conjuror talent 535) adds Line Width % to every player whose x is >= the Bubo's x. Toolbox picks the Bubo with the highest Green Tube level (talent 536) and reads purple growth from talent 535 (with updatedCharactersData the value is the highest PURPLE_TUBE across characters, not that Bubo's own level) (decay: x1=40, x2=100). |
| [C15] | 1 | H | vendor/parsers/talents.ts#L530-L541; vendor/data/website-data/talents.json Bubonic_Conjuror.GREEN_TUBE | Green Tube (talent 536) gives Lab EXP % to any character that has a Bubo (class 36) with a strictly larger x on the board (the Bubo to its right); value is the highest Green Tube across characters; lab membership of the Bubo is not required (decay x1=60, x2=100). |
| [C16] | 1 | M | vendor/data/website-data/talents.json Bubonic_Conjuror; vendor/parsers/world-4/lab.ts#L432; vendor/parsers/damage.ts#L1153 | Other Bubonic Conjuror lab talents: Upload Squared (+% Lab EXP and Lab efficiency, that character only; decay x1=80), Wired In Power (+Weapon Power per 10 Lab levels), Essence Transferral (x% of the character's Lab EXP also goes to the lowest-Lab-level player; no vendored parser reads it). |
| [C17] | 1 | M | vendor/data/website-data/shared-data.json cookingMenu[8,11,22,25,35,40]; jewels[16].effect; vendor/parsers/world-4/lab.ts#L336-L337 | Lab meals (Cooking): Pancakes +2 px and Wild Boar +2 px Line Width (base per level), Eel +1% Line Width; Garlicles Bread +2%, Sawdust +5%, Pretzel +7% Lab EXP. **Disputed.** View A (first read): Black Diamond Rhinestone does not multiply the Line Width % meal. View B (cooking.ts#L205-L222): only stat PxLine meals (Pancakes, Wild Boar) skip every multiplier including Black Diamond Rhinestone, and scale as level x baseStat (2 px per level); Eel (LinePct) and the Lab EXP meals ARE multiplied. Correction adopted: Black Diamond multiplies Eel and Lab EXP meals but not the two PxLine Line Width meals. |
| [C18] | 1 | H | vendor/data/website-data/shared-data.json cardBonuses[79,83]; vendor/data/website-data/cards.json; vendor/parsers/world-4/lab.ts#L338 | Cards: Crystal Custard gives +px Line Width (passive, capped at 50 in the formula); Gelatinous Cuboid gives Lab EXP. |
| [C19] | 1 | H | vendor/data/website-data/shared-data.json arenaBonuses[13]; vendor/parsers/world-4/lab.ts#L305,L340 | Mob Arena wave 150 (arena bonus 13) gives +20% Line Width to all players; shiny pet 'Line Width in Lab' adds more. |
| [C20] | 1 | H | vendor/parsers/world-4/lab.ts#L416-L441 | Lab efficiency = (200 + WIS^0.6 x (1+Skill Wiz talent) + gear + Science Spare Parts post office + all-skill base) x (all-eff group x (1 + (Upload Squared + gear + 10 per Rift mastery rank>1)/100)) x Smart Efficiency. |
| [C21] | 1 | M | vendor/parsers/character.ts#L1120-L1190 | Lab EXP per hour of AFK: value = max(0.1, efficiencyTerm x allSkillExpMulti x (1+companion) x (1+legend) x (1+sushi) x (1+additive/100)), where efficiencyTerm = (labEff/(10 x Laboratory defence))^(0.25 + prowess), computed as: if (labEff/(10 x def))^(0.25+prowess) < 1 the term is (labEff/(10 x def))^0.25 (no prowess, no Inner Peace), otherwise floor(max(.,1)) with Inner Peace counted. Conflict: Toolbox multiplies by `getAllSkillExpMultiplier`, while the wiki and a Reddit answer say All Skill EXP% does not apply to the Lab (both views kept; L on that factor). Arctis is not gated in code. Additive terms: post office, card, chip 5, Green Tube, Upload Squared, Inner Peace (only when >=1), jewel 2, meals, stamps, vials, Matrix Evolved bubble, souped (<=100), gear, Lab Tesstube sigil, mastery 25, Scienscion star sign, arcade, vote, lamp, vault Lab Knowledge, Magma set, palette. |
| [C22] | 1 | H | vendor/parsers/character.ts#L3548-L3556 | Lab AFK gain rate = (0.5 + (Tick Tock + base AFK + trapping + star sign + bribe)/100) x afkMulti. |
| [C23] | 1 | M | vendor/parsers/misc.ts#L836-L851; vendor/parsers/world-4/lab.ts#L434-L435; vendor/parsers/character.ts#L1121-L1148 | Rift Skill Mastery: rank comes from the sum of a skill's levels across all characters; Lab rank >0 at 150 total levels gives +25% Lab EXP, rank >1 at 200 gives +10% Lab efficiency; rank >2 at 300 switches card bonuses to every owned copy; **Disputed for Lab**: the owned-cards tier is implemented via getSkillCardBonus only for mining/chopping/fishing/catching/trapping; the Lab EXP formula (character.ts#L1126) uses equipped cards only, while Line Width reads `account.cards` (all owned) regardless of rank. Rank thresholds, Rift >= 15, +25% EXP (rank>0) and +10% efficiency (rank>1) are confirmed. Needs Rift 15 cleared (currentRift >= 15). Ranks step at 150/200/300/400/500/750/1000. |
| [C24] | 1 | M | vendor/data/website-data/shared-data.json (Laboratory_Bling, ~L16771); vendor/parsers/world-4/lab.ts#L65-L71 | Jade Emporium 'Laboratory Bling' (Rift/Jade bonus) adds 3 jewels to the spinner, or grants one free jewel per 700 total Lab levels (as shown in Rift Skill Mastery). Toolbox does not auto-grant: ownership is read from Lab[14]. |
| [C25] | 1 | H | vendor/parsers/world-4/cooking.ts#L1172-L1232 | Weekly rotation: seed = floor(GlobalTime/604800). Chip slot 1 is drawn from chips 0..11 (22-10), slot 2 from all 22 chips, the jewel slot from all 24 jewels; duplicate draws are re-rolled. serverVars.ChipRepo (when not -1) overrides a slot. The clamp (idx 21-23, or 18-20 without Laboratory Bling, becomes max(1, idx-10)) runs for all three slots: chip 21 becomes 11 and chips 18-20 without Bling become 8-10, as well as jewels 21-23 -> 11-13 and jewels 18-20 -> 8-10 (**corrected**; the first draft said jewels only). Seed, mods (12/22/24) and duplicate reroll confirmed. |
| [C26] | 1 | M | research/w4-systems lab dossier (N.js @8274592, verified 2026-10-17 on v1.23); https://idleon.wiki/wiki/Pile_of_Processor_Chips; packages/account-state/src/world4.ts OPT.labUnlocks=91 | Chip Repository opens when a stack of 3 Pile of Processor Chips is held (accountOptions[91]=1); the Jewel Spinner opens at 7 Strung Jewels (accountOptions[91]=2). The wiki confirms: 'Collect 3 of these, then hold down on the stack of 3'. The item sells in the Outer World Town shop. N.js line refs are not in the vendored tree (unverifiable); OPT labUnlocks=91 is confirmed at world4.ts#L53. |
| [C27] | 2 | M | IdleonToolbox components/account/Worlds/World4/Chips.jsx#L8 @6827d3f (carried from research/w4-systems); packages/account-state/src/world4.ts LAB_CHIP_SLOTS=7 | Chip slots open at Lab level 5/10/15/25/35/50/75 (7 slots per character). Source is Toolbox's UI component, which is not vendored here, and was read at the earlier pin 6827d3f. |
| [C28] | 1 | H | vendor/data/website-data/shared-data.json chips[0..21] | There are 22 chips (indices 0-21). Chips 4,7,8,9,15-21 are 'Can Only Equip 1 per player' (bool1=1; flags only partly visible in verification, M); the other 11 stack. Values: Grounded Nanochip +10% defence; Motherboard +30% move speed if total <170%; Software +10% accuracy; Processor +60% drop rate if total <5x; Potato +20% basic attack speed; Conductive Nanochip +30% Lab EXP, Motherboard +12% Line Width, Software +15% fighting AFK, Processor +15% skilling AFK; Chocolatey 75% crystal-mob chain; Galvanic Nanochip +10% respawn, Motherboard +20% total skilling efficiency, Software +10% total damage, Processor +250 base efficiency all skills; Wood Chip +15% multikill per tier; Silkrode x4 doubles star signs, trophy, upper keychain, pendant MISC; Poker Chip 1.25x weapon power; Omega Nanochip/Motherboard double the top-left/bottom-right card. |
| [C29] | 1 | H | vendor/data/website-data/shared-data.json chips[].requirements; vendor/parsers/world-4/lab.ts#L400-L412 | Each chip costs a W1-W4 material stack plus 100 of one meal plus 100 of one pet spice (e.g. Grounded Nanochip: 20,000 Copper Ore + 100 Turkey of Thank + 100 Grasslands spice; Omega Nanochip: 10,000,000 Fairy + 100 Buncha Banana + 100 Starfield Skies). |
| [C30] | 1 | H | vendor/data/website-data/shared-data.json chips[15,16].extraDescription; vendor/parsers/world-4/lab.ts#L73-L80 | W7 swaps the text of some chips via extraDescription: Silkrode Nanochip doubles infinite star signs, Silkrode Motherboard gives +10% Gallery multi. |
| [C31] | 1 | H | vendor/parsers/damage.ts; vendor/parsers/character.ts; vendor/parsers/efficiency.ts#L123,L155; vendor/parsers/items.ts#L74-L76; vendor/parsers/starSigns.ts#L95 | Chip consumers in Toolbox: damage.ts (0 def, 2 acc, 4 atkspd, 12 dmg, 14 multikill, 19 weapon power), character.ts (3 drop rate, 5 Lab EXP, 7 fighting AFK, 8 skilling AFK, 10 respawn), efficiency.ts (11 total skilling efficiency), items.ts (16-18 MISC doubling), character.ts/ starSigns.ts/ misc.ts (15 star signs, 20-21 cards). No parser reads Galvanic Processor (13) or Chocolatey Chip (9); chip 1 is also never read under its own index (see C32). |
| [C32] | 1 | H | vendor/parsers/character.ts#L3223; vendor/data/website-data/shared-data.json chips[1],chips[15] | Likely Toolbox bug: the move-speed formula reads chip index 15 (Silkrode Nanochip) as 'groundedMotherboard'; Grounded Motherboard is index 1. (confirmed at character.ts#L3223) A save with Grounded Motherboard equipped will not show its move speed in Toolbox. |
| [C33] | 1 | H | vendor/data/website-data/shared-data.json labBonuses[0..17] | Mainframe node table (index, position, base bonus): 0 Animal Farm (91,353) 1%/species; 1 Wired In (250,310) x2; 2 Gilded Cyclical Tubing (356,147) x3; 3 No Bubble Left Behind (450,220) 1; 4 Killer's Brightside (538,362) x2; 5 Shrine World Tour (651,200); 6 Viaduct of the Gods (753,113) x5; 7 Certified Stamp Book (824,377) x2; 8 Spelunker Obol (945,326) 1.5; 9 Fungi Finger (990,148) 2%/1M; 10 My 1st Chemistry Set (1177,163) x2; 11 Banking Fury (1300,380) 2%/green stack; 12 Sigils of Olden Alchemy (400,390); 13 Viral Connection (1430,265) 50%; W6: 14 Artifact Attraction (1530,105) 50, 15 Slab Sovereignty (1630,365) 25, 16 Spiritual Growth (1790,250) 50, 17 Depot Studies PhD (1950,195) 30. |
| [C34] | 1 | H | vendor/data/website-data/shared-data.json labBonuses x,y; vendor/parsers/world-4/lab.ts#L289-L291,L357 | Distance from the prism (43,229) by the board formula: Animal Farm 138, Wired In 231, Gilded Tubing 333, NBLB 394, Sigils 407, Killer's 528, Shrine Tour 595, Viaduct 728, Stamp Book 809, Spelunker 905, Fungi 942, Chemistry Set 1115, Banking Fury 1267, Viral Connection 1346 (computed 2026-10-19 from C3). |
| [C35] | 1 | H | vendor/data/website-data/shared-data.json jewels[0..23] | Jewel table (index: position, bonus, cost = Strung Jewel-tier item + meal + spice): 24 jewels, the full list is in the Mechanics catalogue; costs scale from 5 Strung Jewels + 2,000 Egg + 200 Grasslands (Amethyst Rhinestone) to 100,000,000 Bill Jack Pep (Pure Opal Rhombol). |
| [C36] | 1 | H | vendor/parsers/world-4/lab.ts#L22-L26,L191-L203,L277-L282 | Jewel multipliers: every jewel's bonus x Spelunker Obol multiplier (except jewel 19, which adds its raw % to the Obol); four set jewels double when every partner is lit: 0 with {1,2}, 3 with {4,5,6}, 10 with {7,8,9}, 12 with {11,13,14,15}. Jewels 0,10,12 are the doubling carriers for purple (3), orange (4) and green (5); jewel 3 for blue (4). |
| [C37] | 1 | H | vendor/parsers/world-4/lab.ts#L20-L22,L205-L220 | Jewel boosts to node values: Animal Farm += Purple Navette, NBLB += Pyrite Rhinestone, Fungi Finger += Emerald Rhombol, Banking Fury += Black Diamond Ulthurite, Slab Sovereignty += Pure Opal Rhinestone, Depot Studies += Pure Opal Rhombol. |
| [C38] | 1 | H | vendor/parsers/world-4/lab.ts#L222-L235 | Animal Farm bonus = species unlocked in Breeding x per-species %; Banking Fury = green stacks (persistent GreenStacks registry, items >= 10M) x per-stack %; Fungi Finger = floor(Green Mushroom kills/1e6) x per-million %. |
| [C39] | 1 | M | vendor/parsers/world-2/alchemy.ts#L1030-L1110; vendor/data/website-data/shared-data.json labBonuses[3].description | No Bubble Left Behind: active if the node is lit (or bundle 's' / event shop). Upgraded bubbles = clamp(round(base + jewel + artifact + merit), 3, 10) where mainframe part = min(4, 2 + node value); only bubbles with level >= 2 and < 10,000 among the first 15 of each cauldron; the displayed level gain runs from max(1, nodeValue - 1) (min) to that +1 (max), plus bundle/event/talent extras (M confidence on the exact semantics). The in-game description text says 'at least level 5'; the parser filters level >= 2 (code wins). |
| [C40] | 1 | H | vendor/parsers/world-2/alchemy.ts#L887-L889,L962-L972; vendor/data/website-data/shared-data.json labBonuses[12].description | Sigils of Olden Alchemy (node 12) gates Sigil charging: with the node dark, chargeRate is 0; charging slots = 10; base 1 sigil XP per hour. |
| [C41] | 1 | H | vendor/parsers/index.ts#L234-L236; vendor/parsers/world-2/alchemy.ts#L181,L525; vendor/parsers/world-3/refinery.ts#L163-L165; vendor/parsers/world-3/printer.ts#L22-L26; vendor/parsers/world-3/shrines.ts#L37; vendor/parsers/damage.ts#L1534 | Node consumers: Certified Stamp Book multiplies all non-MISC stamps (index.ts applyStampsMulti); My 1st Chemistry Set doubles vials; Viaduct x5 liquid cap, -30% regen; Gilded Tubing x3 refinery cycle speed; Wired In x2 printer samples for characters AFK in the lab or on Arctis (stacks with Harriep x3); Shrine World Tour spreads town shrines; Killer's Brightside x2 kills for portals and Death Note. |
| [C42] | 1 | H | vendor/parsers/world-4/cooking.ts#L215,L745,L760; vendor/parsers/character.ts#L1072,L1130,L3642-L3643; vendor/parsers/damage.ts#L370; vendor/parsers/efficiency.ts#L126; vendor/parsers/world-3/construction.ts#L532; vendor/parsers/class-specific/grimoire.ts#L267 | Jewel consumers: cooking speed (Amethyst 0, Emerald Pyramite 14), meals (Black Diamond Rhinestone 16), Breeding EXP (Sapphire Rhombol 5), egg/ shiny speed (Emerald Ulthurite 15), Construction slot (Sapphire Rhinestone, ceil(bonus/3) slots), non-consume chance (Pyrite Navette 8), damage (Pyrite Pyramite 10), base efficiency (Emerald Navette 12), Lab EXP (Purple Rhombol 2), W7 jewels in Grimoire/Compass/Tesseract. |
| [C43] | 1 | H | vendor/parsers/world-4/lab.ts#L46-L52,L65-L71,L117-L127 | Raw Lab save array: [0] = x,y pairs per character; [1..n] = chip slots per character (-1 empty); [13] = this week's claimed [chip1,chip2,jewel]; [14] = jewel owned flags; [15] = repository chip counts. |
| [C44] | 1 | H | vendor/data/website-data/gemShop.json GemQ12-GemQ14 (globalIndex 121-123) | Gem shop: Console Chip 385 gems (max 7/week, random of 22), Mainframe Jewel 450 gems (max 2, random unowned jewel, no restock when all owned), Souped Up Tube 480 gems +65 per purchase (max 5, 2 tubes each). |
| [C45] | 1 | H | vendor/data/website-data/shared-data.json gods; vendor/parsers/world-5/divinity.ts#L318-L345 | Divinity gods touching the Lab: Arctis (always active in the Mainframe, no Lab EXP), Goharut (being connected to the Lab also counts as being at the Divinity Altar), Harriep (3x printer, works with Wired In). |
| [C46] | 1 | H | computed from vendor/parsers/world-4/lab.ts#L289-L301 and shared-data.json labBonuses | Derived best-case chain sizes (straight line, no jewel/range bonuses, range 80): players needed = ceil((distance - 80)/LineWidth). At Line Width 100: Stamp Book 8, Chemistry Set 11, Viral 13; at 150: 5, 7, 9; at 200: 4, 6, 7; at 300: 3, 4, 5. Computed 2026-10-19 from C3, C4, C7, C34. A real layout cannot beat this. |
| [C47] | 2 | H | packages/account-state/src/world4-types.ts#L11-L77; packages/account-state/src/world4.ts#L118-L162; packages/engine/src/now/system-homes.ts#L47; apps/activeon/src/art/sprites/grids/systems.ts#L1007; apps/activeon/src/art/sprites/grids/items.ts#L474-L495 | ActiveOn today: LabState (characters, nodes, jewels, repository/spinner flags, chips owned, weekly shop) is read from Toolbox in world4.ts; there is a read-only Laboratory page, sys-lab / item-chip / item-jewel sprites, and a system home mapping lab to the 'laboratory' page. There is no lab Knowledge Base file and no Lab Detector. |
| [C48] | 2 | H | scratchpad/ux/m25-coverage.md rows 36, 144, 270 | The M25 coverage audit lists Laboratory as shown with no advice, and asks for W4 Detectors: nobody uploaded, Lab node in reach, idle chip slots. |
| [C49] | 3 | M | https://idleon.wiki/wiki/Laboratory (fetched 2026-10-19; bot-generated page, last edit 2026-10-07 per earlier read) | Wiki Laboratory page lists the Mainframe bonuses in order of appearance, says Fuse / Pyrite Rhombol / Viral Connection / Conductive Motherboard / Pancakes / Wild Boar raise reach, says 'All Skill EXP% bonuses do not affect Laboratory' and that souped tubes give 2x Lab EXP. A fetch summary also claims the skill is 'exclusive to Bubonic Conjuror'; no code gate exists (L confidence for the class claim; the page's class line only says 'Class: Bubonic Conjuror'). The All Skill EXP% line and souped 2x line are confirmed. |
| [C50] | 3 | M | https://idleon.wiki/wiki/Mainframe (fetched 2026-10-19) | Wiki Mainframe page recommends Conductive Nanochip (Lab EXP), Conductive Motherboard (Line Width), Galvanic Motherboard (skilling efficiency) and Galvanic Software (damage); +2 px per Lab level; some chips are 1 per player. |
| [C51] | 4 | L | https://www.reddit.com/r/idleon/comments/17ueqih (post id 17ueqih; fetched via Arctic Shift 2026-10-19; thread date unverified, undated by the API response) | Community, r/idleon 'Tips on getting more lab exp?': 'Alchemy, alchemy vials, stamps, dishes, put your bubo far right in the lab, lab efficiency with lab ring/serrated rex ring & lab boots, proper card set'; 'Souped lab rings + upgraded scrubs + post office is also a major upgrade'; 'All Skill AFK% and All Skill Efficiency% also affect Laboratory. All Skill EXP% bonuses do not.' |
| [C52] | 4 | L | https://www.reddit.com/r/idleon/comments/1bk1cwj (post id 1bk1cwj; Arctic Shift 2026-10-19; thread date unverified) | Community, r/idleon W5 transition thread: 'Pull them out of lab and shove them onto div altar, and get bear asap'; 'Once you've unlocked Goharut, move your Divinity players [to] the lab'; 'train their divinity up until you unlock the God who makes it so being in the lab also gives divinity exp, then pop them back in the lab'. |
| [C53] | 4 | L | https://www.reddit.com/r/idleon/ ids 1fnyqwe, 1urbycv; Arctic Shift title searches 'lab', 'lab tips' 2026-10-19 (summaries, thread dates unverified) | Community, r/idleon: recurring question 'when to stop levelling lab (threshold around level 75)' (summary of several threads); 'trying to rush the pyrite gemstone in the rotation... don't think I can get enough of the Coarse Mountains spice' (spice is the jewel bottleneck); 'trying to unlock the double portal kills as quickly as I can [just reached W4]' (Killer's Brightside as the first goal). |
| [C54] | 4 | L | research/skills lab-divinity dossier (2026-10-17); https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview | Community guide (Idleon Incomplete Guide W4 tab, via earlier dossiers): do Gobo's questline first; 'Throw everyone in lab and push your characters one by one'; 'make sure every other character is afk in lab connected to Killer's Brightside' while one character pushes. Undated, post-W7, possibly outdated; not re-fetched (sheet did not render 2026-10-19). |
| [C55] | 1 | L | research/w4-systems lab dossier (N.js addDialogueFor Gobo @15554836, quest Gobo5 @15558669, verified 2026-10-17); vendor/data/website-data/shared-data.json labBonuses[0] | Gobo's quest 5 ('Upload_Player_to_Lab', 'Light_up_1st_Bonus') teaches the Lab after the Breeding and Cooking quests; nothing in code gates the Lab by level. Animal Farm (138 from the prism) is beyond 50 + 80, so one uploaded player cannot light it at Lab level 0. |
| [C56] | 4 | L | https://www.reddit.com/r/idleon/ ids 18mqh7i, 1lcd3kb (Arctic Shift 2026-10-19; low confidence) | Non-lab upload effects are not on the board: the 'blue power icon' for a non-uploaded character, and one thread reports a character left on the board edge disappearing after the Jade lab bonus; treat board coordinates as save data that can be rewritten by the game. |
| [C57] | 1 | H | vendor/parsers/world-4/lab.ts#L170-L176 | Black Diamond Rhinestone (jewel 16): when owned but not lit, it is set active during the Line Width recalculation and reset afterwards. Verified 2026-10-19. |
| [C58] | 1 | H | vendor/parsers/world-4/lab.ts#L286; vendor/data/website-data/shared-data.json labBonuses[].bonusOff | An unconnected node returns bonusOff instead of 0: Wired In 1, Gilded Tubing 1, Stamp Book 1, Spelunker Obol 1; other nodes 0. |
| [C59] | 1 | H | vendor/parsers/world-4/lab.ts#L196-L220,L293-L301 | Jewel 19 (Pure Opal Navette) adds its raw bonus to the Spelunker Obol value; every other jewel is multiplied by it. Pyrite Rhombol range scales with the Spelunker multiplier and pyrite set doubling. |
| [C60] | 1 | H | vendor/parsers/class-specific/grimoire.ts#L267; compass.ts#L601; tesseract.ts#L388 | W7 jewels: 21 Deadly Wrath feeds the Grimoire, 22 North Winds the Compass, 23 Eternal Energy the Tesseract. Acquisition beyond the spinner is not confirmed in code. |
| [C61] | 1 | H | vendor/parsers/world-3/printer.ts#L22-L26 | Wired In printer doubling is gated on the character being AFK in the lab or having Arctis's major bonus, not on board connection. |
| [C62] | 1 | H | vendor/parsers/world-2/alchemy.ts#L1069-L1130 | NBLB: the Laboratory Merit and the Amberite sailing artifact add to the upgradeable bubble count; bundle, event shop and Tachyon Truth change the level gain. |
| [C63] | 1 | H | vendor/parsers/world-5/divinity.ts#L277-L345 | Pocket Arctis (hole extraCalculations 29/30) places every character in the lab for Divinity; pocket Goharut gives lab-time Divinity. |
| [C64] | 1 | H | vendor/parsers/character.ts#L1126-L1190 | Lab EXP additive extras: Post Office, Matrix Evolved bubble, star sign, arcade, vote 31, lamp, vault 55, Magma set, palette 27, sigil LAB_TESSTUBE. Essence Transferral is not modelled. |
| [C65] | 1 | H | vendor/parsers/world-4/lab.ts#L340; vendor/parsers/generated-types.ts#L1123 | Shiny pet bonus 'Line Width in Lab' adds to Line Width; breeding detail belongs to the Breeding dossier. |
| [C66] | 1 | H | vendor/parsers/world-7/gallery.ts#L311 | Silkrode Motherboard (chip 16) gives +10 Gallery multiplier to the wearer in W7. |
