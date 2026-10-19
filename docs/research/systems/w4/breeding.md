# Breeding (Mobs) - System dossier

Topic id `breeding`, World 4, account-wide. Verified 2026-10-19 against the vendored Toolbox parsers (pin `6c37e3d`, game data version in `vendor/`) and the live game client `N.js` (v1.23, Last-Modified 2026-10-17, local copy kept in the M26 scratchpad). Prior research: `research/w4-systems:docs/research/systems/w4-systems/2026-10-17-breeding.md`. Terms: `GLOSSARY.md`. Every factual claim is numbered [C#] with its Source and tier in the claims table at the end. Where this dossier corrects the prior research it says so under "Corrections to prior research".

**Naming.** The game calls bred creatures **Mobs** and the old Companions **Pets** [C1]. Toolbox keeps `pets`, `petUpgrades`, `PetDeadCell`. This dossier says "Mob".

## Breeding

- **What it is:** an account-wide W4 skill. Eggs arrive on a timer, are hatched into Mobs (or trashed for Dead DNA), and Mobs are used in three places: Territory forage teams (Spices for Cooking and the Lab), the Mob Arena and Crucible (account bonuses), and the Fence Yard (Breedability and Shiny levels). Hatching new species compounds Breeding EXP and unlocks account-wide Shiny passives [C18][C42].
- **Unlocks:** the skill starts at Lv 0 until the first breed, which is rigged to a Green Mushroom copy and the next to a Squirrel discovery [C3]. W2/W3/W4 Mob rows unlock by breeding W1 Red Mushroom / W2 Pincermin / W3 Penguin (GenINFO[108]=[4,6,8,8]) [C5]; the W4 row opens by the Massive Troll kill or by breeding W3 Penguin [C4][C5]. Upgrades unlock by Breeding Lv 1/5/10/15/20/25/30/40/50/60/70/80 [C23]; Mob Arena at Lv 8 [C52]; Shiny Mobs need Paint Bucket Lv 1 (Lv 40) [C34].
- **Scope:** Breeding Lv and EXP are shared by all characters [C2]. The logged-in character only matters for star signs (57a Breedabilli, 57b, 59) and the best-of-all-characters Beast Master talents [C16][C58]. Everything else (eggs, Mobs, upgrades, Fence Yard, Territories, Arena) is account-wide [C61].
- **Inputs → outputs:** time → eggs [C8]; eggs → Mobs / Dead DNA [C14][C17]; Dead DNA + Cooking meals → upgrades [C21]; Genes (DNA Splicer tool) → gene levels [C33]; forager Mobs in Territories → Spices [C48]; combat Mobs in Arena → account bonuses [C53]; pink/shiny Mobs in the Fence Yard → Breedability and Shiny progress [C44][C38][C41]; Breeding EXP → Breeding Lv → upgrade unlocks and Mob Power [C16].

### Goals and Milestones

| Milestone | Threshold | Reward | Source |
|---|---|---|---|
| Egg Capacity | upgrade Lv 5 (+gem, +merit) | nest holds 3 -> 8+ eggs | [C6] |
| Multiplier unlocks | buy Lv 1 each of Breedability, Rarity, Pastpresent, Failsafe | enables 2nd-5th chance multipliers and pink Mobs | [C24] |
| Fence slots | Fence Extension to 10 | yard 5 -> 15 (+2 per gem) | [C44] |
| Arena wave 35 | -50% Kitchen upgrade cost | Cooking | [C53] |
| Arena wave 100 | third large alchemy bubble | Alchemy | [C53] |
| Arena wave 125 / 200 | 6th Mob slot / Total Damage x1.4 | combat | [C53] |
| Shiny level 20 | ~2.69 M base progress days | cap; 30 with Menagerie unlock 11 | [C40] |
| Skill mastery (wiki) | total Breeding Lv 150 / 200 | +25% EXP / +15% egg speed | [C66] |

### Feeds / fed by

| Direction | System | Link |
|---|---|---|
| Fed by | Cooking | every upgrade costs a specific meal; meals boost egg speed, new-Mob chance (Npet), breedability (Breed), Mob damage, EXP; total kitchen levels power Overwhelmed Golden Egg [C21][C26] |
| Feeds | Cooking | Territory Spices discover meals; Arena 35 halves kitchen cost; Crucible 10x/20x cooking speed [C48][C53][C54] |
| Feeds | Lab | Spices buy chips; Arena 150 +20% line width; shiny Mallay +1% line width [C53][C60] |
| Fed by | Lab | Mainframe 105/111/115, Emerald Ulthurite jewel [C19][C8][C41] |
| Fed by | Alchemy / Stamps / Vault / Rift | vials NewPet/BreedXP/PetDmg, bubbles EggInc/NewPetRift, Egg and Nest Egg stamps, Upgrade Vault 56, Rift skill bonus 10 [C26][C19] |
| Feeds | Alchemy / Post Office / Library | third large bubble, three Post Office crates, Library VIP [C53] |
| Feeds | Combat / Talents / Sailing / Farming / Tome | Total Damage, multikill, drop rate, talent points, star signs, travel time, farming EXP, Tome counts [C60][C53] |
| Fed by | Gem shop / Merit shop | Royal Egg Cap (119), Fenceyard Space (125), W4 merit (egg slots) [C6][C44] |
| Fed by | W5-W7 | [C67] |

## Per-session actions

1. Hatch and clear the nest: a full nest stops production; eggs wait in a queue [C9]. Empty it before long AFK stretches (capacity x egg time = time to cap [C8]).
2. Trash everything that is not a top-Power forager, a combat Mob for the next Arena wave, or a pink/shiny copy: Dead DNA, EXP and Failsafe stacks come from trashing [C17][C15].
3. Spend Dead DNA + meals on the next upgrade (order below).
4. Claim Spices before the daily claim pool is exhausted; keep a Trasher in the yard at reset (+25 claims each) [C49].
5. After new Mobs or upgrades re-check forage teams (power, gene columns) [C45]; never place a Converter mid-fill (progress reset on placement per prior research; not re-verified).
6. Push the Arena to the next Milestone [C53].
7. Fence Yard: keep pink and shiny copies of the species whose level matters now; swap when a level completes [C44].
- Idle or capped states: nest full; unspent claims; forage team with 0 speed; empty yard slots; affordable upgrade unbought; multiplier-unlock upgrade still at 0 past its unlock Lv.

## AFK Setup implications

Breeding does not occupy a character's AFK slot: the egg timer and Territory progress run on account time (`OptionsListAccount[87]` is banked offline and replayed [C8], Territory progress advances with AFK seconds [C47]). Expected Return matters through nest capacity only. Arena Spirit (Beast Master) is the only per-character AFK interaction [C58].

## Mechanics catalogue

Fields are Toolbox `account.breeding.*` unless a raw path is given. "Game" refers to N.js.

| # | Mechanic | Rule / formula | Caps, unlock, cost | Field |
|---|---|---|---|---|
| M1 | Breeding skill | Shared level/EXP; EXP per action `(X + found^1.5 * 1.85^egg) * BreedingEXPmulti`, X=2/10/50 [C18][C19] | Lv 1.. ; shiny EXP biggest | `characters[].skillsInfo.breeding` (`Lv0[11]`,`Exp0[11]`) |
| M2 | Egg nest & timer | 7200 s / (1+bonuses/100); queue placement [C8][C9] | capacity 3 + upg(max 5) + gem + merit; 20 slots (15 practical) [C6][C7] | `eggs`, `eggCapacity`, `timeToNextEgg` (`Breeding[0]`, `OLA[87]`) |
| M3 | Egg rarity rank-up | when nest full, per egg `(0.29+0.005*RarityLv)^(1+r)*PetUpgBONUS5*(1+Legend32)` [C10][C11] | rarities 1-11 [C13]; needs Rarity Lv>=1 (Lv 20) [C12] | `eggs[]` |
| M4 | Hatching / species | offspring is next species with `TotalBreedChance`, else copy; pink 1/6 [C14] | needs free Stored-Mob slot | `speciesUnlocks` (`Breeding[1]`), `storedPets` |
| M5 | New-Mob chance | gem, vial/bubble, stamp, meal and Golden Egg factors x base x 5 multis [C26][C27][C28][C29][C30][C31][C32] | base 1/2 .. 1/7 M by species | `pets[w][i].breedingMultipliers` |
| M6 | Failsafe counter | +1 per non-new breed/trash, reset on new species; 5th multi [C15][C32] | cap 10 x Failsafe Lv (max 250) | `accountOptions[86]` |
| M7 | Mob Power | formula [C16]; Curviture of the Paw up to x2.1 | rises with Breeding Lv only | `eggsPowerRange`, `storedPets[].power` |
| M8 | Trash → Dead DNA | [C17] | 3-5 base, Crucible +25% each (x4) | `deadCells` (`Breeding[3][8]`) |
| M9 | Upgrades (13) | cost [C21]; effects [C20][C11]; max [C22]; unlock Lv [C23]; totals [C68][C69] | see Upgrades table | `petUpgrades[].level/maxLevel` (`Breeding[2]`) |
| M10 | Shattershell | [C37] | max 60% at Lv 10 | `petUpgrades[11]` |
| M11 | Gene Splicing / Gene boost | [C33]; 1st multi [C28] | gene level max 100; Genes `Breeding[3][0..3]` | `genetics`, `pets[w][i].level` |
| M12 | Breedability (pink) | progress per day = multi x copies; heart level from 2nd multi [C29][C38][C39] | Toolbox cap 9 hearts, wiki 10 | `pets[][].breedingLevel/breedingProgress` (`Breeding[13..16]`) |
| M13 | Shiny Mobs | toggle shiny mode; odds [C34][C35]; Paint Bucket level has no effect beyond gate [C36] | Lv 40 + Paint Bucket>=1 | `pets[][].shinyProgress` (`Breeding[22..25]`) |
| M14 | Shiny levelling | thresholds [C40]; speed [C41] | cap 20 (30 Menagerie 11) | `pets[][].shinyLevel`, `maxShinyLevel`, `shinyOverLevels` |
| M15 | Shiny passives | [C42][C60]; 68 Mobs [C43] | account-wide | `passivesTotals` |
| M16 | Fence Yard | [C44]; special genes: Eggshell lays eggs (not re-verified), Trasher +25 claims [C49] | 5 + upg(10) + 2 x gem | `rawFencePets`, `fencePetsObject` (`Pets[0..26]`) |
| M17 | Genes | [C59] | 34 genes in data | `pets[][].gene` |
| M18 | Territories / forage | [C45][C47][C46] | 26 live rows [C50] | `territories[].forageSpeed/reqProgress/team` (`Pets[27+]`,`Territory`) |
| M19 | Spices & claims | [C48][C49] | daily pool; Trasher +25 | `account.cooking.spices`, `accountOptions[100]` |
| M20 | Territory battles | [C51] | one win unlocks | `territories[]` |
| M21 | Mob combat | damage [C55]; HP [C56]; Blooming Axe +6%/lvl | slots 2-6 [C52] | n/a (combat) |
| M22 | Mob Arena | endless waves; bonuses [C53] | Lv 8 | `maxArenaLevel` (`OLA[89]`) |
| M23 | Crucible (W7) | [C54] | Menagerie unlock 8 | `maxCrucibleLevel` (`OLA[628]`) |
| M24 | Beast Master talents | [C58] | class talents | `characters[].talents` |
| M26 | Beast Master 371 | I Dream of Peace and Egg: chance of 3 eggs per 10 h of AFK claims, up to 100 h (gamedata lens, talents 370-373) | class talent | `characters[].talents` |
| M27 | Egg achievements | achievement 220 (6 nest eggs of rarity >= 2) feeds egg speed (C8); 221 (12 eggs of rarity >= 4) feeds PetUpgBONUS(5) (C11); how to earn them is not covered | achievements | `achievements` |
| M28 | Egg items | AutoUseAllEggies consumes egg items into the nest | needs free slots | n/a |
| M29 | Stored-Mob capacity | 3*GenINFO[18] stored Mobs; a full store blocks breeding | gate | `storedPets` |
| M30 | Breeding side effects | breeds/trashes advance task Tasks[1][3][2] vs RANDOlist[62], Gobo3 quest progress, and a Steam achievement on trash | tasks | n/a |
| M31 | Fence Yard accrual | progress accrues per copy of the Mob in the yard for breedability/shiny; DNA Splicer gene boosts raise Breeding[4..7] | per day | `fencePetsObject` |
| M32 | Gene effects (combat/utility) | not enumerated here: Boomer, Sniper, Amplifier, Rattler, Refiller, Eggshell, Lazarus, Heavyweight, Ninja, Fastihoop, Peapeapod (x2.5), Defender, Superboomer (see C55, C59); Eggshell behaviour unverified | per gene | `pets[][].gene` |
| M33 | Arena entry | entry limits per day; Arena Spirit (370) gives unlimited entries; wave 25 gating | Lv 8 | `maxArenaLevel` |
| M34 | Territory extras | secondary Spice slots Territory[row][5..8] from Looter; Converter 50% no-reset on claim; Mercenary doubles and Tsar x1.5 fight power in Toolbox teamFightPower though every live fightPower is 0 (C46); rows 25-26 (W7) powerReq 1e9/1.5e9 with undefined names, rows 27-28 Filler; genes 34/35 placeholders | W7 | `territories[]` |
| M25 | Merit/Gem extras | Royal Egg Cap: +1 slot, x1.1 chance each; Fenceyard Space +2 slots [C6][C44] | gem shop 119/125 | `gemShopPurchases` |

W5+ extensions (one line each): Lamp and Crop Scientist multiply Breedability and Shiny speed; Summoning win bonus 17 multiplies Shiny speed; Menagerie unlock 11 lifts shiny cap to 30 and unlock 8 opens the Crucible; Minehead raises Blooming Axe max by 3; Sailing artifact 24 adds daily shiny pity (`OLA[126]`); W7 Territories 25-26 [C67].

### Upgrades (computed)

| # | Upgrade | Unlock Lv | Max | Meal | Effect per level |
|---|---|---|---|---|---|
| 0 | No Upgrade Selected | n/a | 100 | none | Breeding EXP (code adds 2 per level) |
| 1 | Gene Splicing | 1 | 20 | Turkey of Thank | -4% gene-boost cost |
| 2 | Egg Capacity | 5 | 5 | Pie | +1 egg slot |
| 3 | Breedability Mobs | 10 | 10 | Corn | +25% Breedability speed; unlocks 2nd multi and pink Mobs |
| 4 | Fence Extension | 15 | 10 | Pancakes | +1 yard slot |
| 5 | Rarity of the Egg | 20 | 10 | Potato P Pastry | rank-up x(1+0.25L); unlocks 3rd multi |
| 6 | Blooming Axe | 25 | 10 (+3) | Cannoli | +6% Mob damage |
| 7 | Pastpresent Brood | 30 | 5 | Wild Boar | 4th multi factor 1+0.15L; unlocks 4th multi |
| 8 | Paint Bucket | 40 | 100 | Orange | gate for Shiny Mobs (stated +2% shiny chance unused [C36]) |
| 9 | Overwhelmed Golden Egg | 50 | 20 | Pretzel | (1+0.02L) per 100 kitchen levels |
| 10 | Failsafe Restitution Cloud | 60 | 25 | Eel | +10 max fail stacks; unlocks 5th multi |
| 11 | Shattershell Iteration | 70 | 10 | Buncha Banana | ceil(12 L^0.698)% two free eggs |
| 12 | Grand Martial of Shinytown | 80 | 300 | Bill Jack Pep | +5% Shiny level-up rate |

Costs and totals to max: [C68] [C69]

## Min-max by stage

Sources for ordering are the community/wiki lines below; facts come from the catalogue. Priority orders:

| Stage | Priority (each line sourced) |
|---|---|
| **W1 early / mid / late** | Breeding is not available (W4 town skill; unlocks with W4 access). Only prep: keep Cooking-relevant stamps and cards in mind [C62]. |
| **W2 / W3** | Not available; Toolbox alerts start only after World 3 is finished [C57]. |
| **W4 entry (Breeding Lv 1-20)** | Breed every egg (new species multiply EXP) [C18]; trash the rest. Order: Egg Capacity -> Breedability Lv 1 (Lv 10) -> Fence Extension (cheap) -> Rarity Lv 1 (Lv 20) [C65][C22]. AutoReview T1-T2: 3 then 7 territories, Arena to 3 then 15 [C63]. |
| **W4 mid (Lv 20-40)** | Pastpresent Lv 1 (Lv 30) and Blooming Axe for Arena; Arena to 35 (-50% kitchen cost) then 50 [C53]; 10 territories (T3), forager columns: Targeter stacked vertically, Borger under a Forager row, Fleeter/Miasma team multipliers [C45][C63]. Comps [C64]. |
| **W4 late (Lv 40-60)** | Paint Bucket Lv 1 at Lv 40, first shiny targets are Faster Shiny Lv Up Rate Mobs [C65][C63]; Overwhelmed Golden Egg at Lv 50 once kitchens have levels; Arena to 100 (third large bubble) and 125 (6th slot); 14 then 20 territories (T4-T5) [C63]. Failsafe (Lv 60) and Shattershell (Lv 70) after that [C23]. |
| **W5+** | Arena 200, 24 territories, shiny order by AutoReview tiers (meals, star signs, base efficiency, drop rate, refinery, multikill, artifact find), Grand Martial (Lv 80) [C63][C67]. |
| **Per class** | No class gate; Beast Master (Hunter line) provides Curviture of the Paw x up to 2.1, EXP, Arena Spirit [C58]. |

Caveat: these orders are community-informed (tier 3-4); the numbers they rest on are tier 1.

## Common mistakes (and detection)

| Mistake | Detect |
|---|---|
| Multiplier-unlock upgrades left at 0 past unlock Lv | `petUpgrades[i].level==0` while `skillsInfo.breeding.level >=` unlock; use game indices 3/5/7/10, not Toolbox `unlockedBreedingMulti` [C25] |
| Full nest left idle | all `eggs[0..eggCapacity-1] > 0` [C6] |
| Combat Mobs in forage teams | `team[].gene.abilityType==0` [C45][C46] |
| Hoarding low-Power Mobs | `storedPets[].power` far below `eggsPowerRange` [C16] |
| Unspent Spice claims / no Trasher | `accountOptions[100]` vs cap [C49] |
| Arena stalled before 35 / 100 | `maxArenaLevel` [C53] |
| Buying Paint Bucket past Lv 1 for shiny chance | level has no effect [C36] |
| Reading Toolbox breedability as 10 hearts | Toolbox caps at 9 [C39] |

## Corrections to prior research

1. Toolbox gates the 2nd-5th multipliers with off-by-one upgrade indices [C25].
2. Paint Bucket's "+2% base shiny chance" is not wired into the odds [C36].
3. EXP formula is `(X + found^1.5*1.85^egg)`, not a product with `(2+found^1.5)` [C18].
4. Rank-up chance per egg is `(0.29+0.005L)^(1+r)` (rarity-indexed) [C10][C70].
5. Shiny mode is a separate toggle with its own base chance and pity counter [C34][C35].

## Save and Toolbox fields

See catalogue column "Field" and [C61]. ActiveOn exposure today: [C62]. Needed additions for advice: `pets[][]` shiny/breedability levels, `unlockedBreedingMulti` (corrected indices), `maxCrucibleLevel`, `fencePetsObject`, `accountOptions[100]`. Toolbox-computed numbers should be used per ADR 0005, with the index bug in [C25] fixed in the adapter, not the vendor tree.

## Sprites needed (for M26 build)

Existing grids: `sys-breeding`, `sys-pet-arena` in `apps/activeon/src/art/sprites/grids/systems.ts` [C62]. New sprites proposed: 11 egg rarities (Normal..Godshard), Dead DNA, Gene (DNA strand), Spice, Shiny star, pink Breedability heart, Fence Yard, Territory marker, Mob gene icons for forage genes (Forager, Fleeter, Targeter, Borger, Miasma, Trasher).

## Open questions

- Wiki claims C1, C12, C65, C66 and AutoReview C63/C64 were not re-fetched this pass (no web access); confidence L/M.
- Gamedata and source lenses refuted no claim outright; corrections listed above (C3, C4, C5, C15, C23, C27, C48, C49, C55) came from the gamedata lens.
- Origin of the daily Spice claim cap constant (`GenINFO[115]` in the breeding actor); Toolbox uses 100.
- Fence Yard per-tick progress formula for Breedability and Shiny (read only through Toolbox `getTimeToLevel`).
- Whether a 10th breedability heart exists in code.
- Whether live 0.29 vs offline 0.30 rank-up base is intended.
- Territory Converter placement reset and Eggshell behaviour are from prior research, not re-read.
- Pre-v1.23 community sources (AutoReview) may not reflect Crucible/shiny-cap-30.

## Claims

| ID | Claim | Source | Tier | Conf |
|---|---|---|---|---|
| C1 | Since v1.05 (2026-02-20) the bred creatures are called Mobs and the old Companions are called Pets; Toolbox code and older guides still say pets. | idleon.wiki/wiki/Changelog_2026 v1.05 (prior research read 2026-10-17; patch 2026-02-20) | 3 | M |
| C2 | Breeding level and EXP are shared by all characters; it is a town skill, not a per-character AFK skill. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) string 'Breeding_Lv_and_EXP_are_shared between_all_characters' @14020687; PetQTYonBreed reads Lv0[11] @7926061 | 1 | H |
| C3 | BREED_RIG applies only when the parent is W1 species 0. RIG=1 (Exp0[11]==0, Lv 1) blocks a new species, so breed #1 is a forced Green Mushroom copy; RIG=2 (Exp < 5*BreedingEXPmulti, Lv 1) forces a new species (Squirrel) on the next breed, until Exp0[11] >= 5*BreedingEXPmulti. (Gamedata lens: imprecise original, corrected.) | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) _customBlock_Breeding BREED_RIG @7924600 | 1 | H |
| C4 | The W4 Mob row opens when the Massive Troll boss dies (Breeding[1][3]=1 if 0, _customEvent_TrollDed @4902900); it also opens by breeding W3 Penguin (see C5). Previously cited second-hand via prior research; Troll part now confirmed by the gamedata lens. | Prior research docs/research/systems/w4-systems/2026-10-17-breeding.md citing N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) @4903054 | 1 | H |
| C5 | The breed handler sets Breeding[1][world+1]=1 when parent idx+1 == GenINFO[108][world], GenINFO[108]=[4,6,8,8]: offspring W1 Red Mushroom opens W2, W2 Pincermin opens W3, W3 Penguin opens W4. Upgraded from wiki-only (tier 3) to code-verified. | N.js (legendsofidleon.com/ytGl5oc/N.js, game v1.23, verified 2026-10-19) breed handler @9873700; idleon.wiki/wiki/Breeding 'Unlocked From' | 1 | H |
| C6 | Nest capacity = 3 + Egg Capacity upgrade level + Royal Egg Cap gem purchases (GemItemsPurchased[119]) + W4 Merit (Tasks[2][3][2]). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) TotalEggCapacity @7921788; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L183-L184 | 1 | H |
| C7 | Breeding[0] holds 20 egg slots; Toolbox comment says the practical max is 15. | Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L181-L182 comment | 2 | M |
| C8 | Egg period = 7200 s / (1 + (Mainframe 111 + meal TimeEgg + bubble EggInc + 10*achievement 220 + 15*Rift skill bonus 10 + Summoning VotingBonus 16)/100). One egg is added per period when a slot is free; offline time (OptionsListAccount[87]) is banked and replayed. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) TotalTimeForEgg @7930253; egg tick @10095300 | 1 | H |
| C9 | A new egg goes into the first empty slot only if it is slot 0 or the previous slot is filled (the nest is a queue, eggs are rarity 1 when created). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) egg tick @10095300 (Breeding[0][q]+=1) | 1 | H |
| C10 | When the nest is full and Rarity of the Egg has been bought, each egg of rarity r>0 gets a rank-up roll: P = (0.29 + 0.005*RarityLv)^(1+r) * PetUpgBONUS(5) * (1+Legend talent-point bonus 32/100) in live play (0.30 base and no Legend term in the offline replay); first success raises that egg by 1, capped at 11. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) @9803000 (live) and @10095300 (offline) | 1 | H |
| C11 | PetUpgBONUS(5) = (1 + 0.25*RarityLv) * min(2, max(1, 1 + 0.1*achievement 221)). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) PetUpgBONUS @7934774; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L350-L352 | 1 | H |
| C12 | Egg rarity runs 1-11 (Normal, Copper, Iron, Gold, Platinum, Dementia, Void, Lustre, Starfire, Dreadlo, Godshard); Godshard was added in v2.29 (2025-02-15). | idleon.wiki/wiki/Breeding egg table; idleon.wiki/wiki/Changelog_2025 v2.29 (read 2026-10-17) | 3 | M |
| C13 | Wiki egg table (game-generated): base EXP 1.85, 3.42, 6.33, 11.71, 21.67, 40.09, 74.17, 137.21, 253.83, 469.59, 868.74 and Mob power cap 1.2x to 4.1x for rarities 1-11 (EXP base = 1.85^rarity). | idleon.wiki/wiki/Breeding rev 2026-10-14; EXP base verified against N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) GiveBreedEXP @7940680 | 3 | H |
| C14 | Breeding consumes the first egg and needs a free Stored-Mob slot. The selected species row/index is the 'parent': the offspring is the next species only if species idx+2 > Breeding[1][world] (not yet found) and rand < TotalBreedChance (or BREED_RIG==2); otherwise it is a copy of the selected species. Offspring type is Breedable (pink, type 4) with 1/6 chance if Breedability is owned, else the species' own gene. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) breed handler @9872500-9877000 (clean read) | 1 | H |
| C15 | Failsafe counter OptionsListAccount[86] increments by 1 (cap = PetUpgBONUS(10) = 10*FailsafeLv) on every non-new breed and trash, and is reset to 0 on a new species and also on shiny success; it feeds the 5th multi max(1,(fails+1)^0.3). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) @9874348 / 5thMulti @7933667 | 1 | H |
| C16 | Mob Power at hatch = (4*L+(L/2)^3)^0.85 * min(2.1,max(1,Curviture of the Paw talent 373 best across characters)) * (1+0.2*egg+0.3*floor((egg+1)/4)) * (min(1.2+L/12,4)*e^(-10*rand(0,max(0.1,1-(egg+4)/12*0.9)))+1), L = Breeding level. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) PetQTYonBreed @7926061; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L488-L511 | 1 | H |
| C17 | Trashing a Mob yields floor((randInt(3,5) + rand + HolesB_UPG52/100) * (1 + (Crucible bonuses 0+6+11+13)/4)) Dead DNA (stored in Breeding[3][8]); each trash also counts for the Failsafe counter and gives Breeding EXP. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) GeneticsPerTrashPet @7934435 | 1 | H |
| C18 | EXP per breed action = (X + TotPetsFound^1.5 * 1.85^eggRarity) * BreedingEXPmulti, with X = 2 (copy or trash), 10 (new species), 50 (shiny). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) GiveBreedEXP @7940680 | 1 | H |
| C19 | BreedingEXPmulti = max(0.1, AllSkillXP * (1 + (talent 372 + Mainframe 105 + meal BrExp + 2*'No Upgrade' lvl + min(5*card w4a2 lv,50) + stamp BreedExp + vial BreedXP + statue 21 + 25*Rift skill 10 + Summoning vote 16 + Summoning vault 59)/100)). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) SkillStats BreedingEXPmulti @4241906 | 1 | H |
| C20 | There are 13 upgrade slots in Breeding[2]: 0 'No Upgrade Selected' (description says +1% Breeding EXP/level but the code adds 2*level to the EXP percent sum; max 100), then Gene Splicing, Egg Capacity, Breedability Mobs, Fence Extension, Rarity of the Egg, Blooming Axe, Pastpresent Brood, Paint Bucket, Overwhelmed Golden Egg, Failsafe Restitution Cloud, Shattershell Iteration, Grand Martial of Shinytown. | Toolbox vendor/data/website-data/shared-data.json petUpgrades; N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) PetUpgBONUS @7934774 | 1 | H |
| C21 | Upgrade cost at level L: Dead DNA = baseMatCost*(1+L)*costMatScale^L and one Cooking meal count = baseCost*(1+L)*costScale^L (meal chosen by foodIndex). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) PetUpgCostREAL @7933898; Toolbox vendor/data/website-data/shared-data.json petUpgrades | 1 | H |
| C22 | Max levels: Gene Splicing 20, Egg Capacity 5, Breedability 10, Fence Extension 10, Rarity 10, Blooming Axe 10 (+Minehead bonus 3), Pastpresent 5, Paint Bucket 100, Overwhelmed Golden Egg 20, Failsafe 25, Shattershell 10, Grand Martial 300, No Upgrade 100. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) PetUpgMaxLV @7934216; Toolbox vendor/data/website-data/shared-data.json petUpgrades; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L53-L55 | 1 | H |
| C23 | Upgrades unlock at Breeding Lv 1/5/10/15/20/25/30/40/50/60/70/80 for slots Gene Splicing..Grand Martial (Mob Arena at Lv 8). There is no level array: the gate is a formula, grid index i needs Lv0[11] >= 5*i + 5*max(0,i-6); Arena needs Lv0[11] > 7. | N.js (game v1.23, verified 2026-10-19) @9881200, @10035600; idleon.wiki/wiki/Breeding Upgrade Tab (rev 2026-10-14) | 1 | H |
| C24 | The four breed-chance multipliers are gated by Breeding[2][3] (Breedability) -> 2nd, [5] (Rarity) -> 3rd, [7] (Pastpresent) -> 4th, [10] (Failsafe) -> 5th; the same flags make pink Mobs appear. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) GenINFO[53] init @10085477 and @10012049 | 1 | H |
| C25 | Toolbox unlockedBreedingMulti tests petUpgrades indices 2/4/6/9 (Egg Capacity, Fence Extension, Blooming Axe, Overwhelmed Golden Egg) instead of the game's 3/5/7/10, so Toolbox's per-species chance multipliers can read x1 or non-1 incorrectly. | Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L62-L67 vs N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) @10085477 | 1 | H |
| C26 | TotalBreedChance = (1+10*RoyalEggCap/100) * (1+(vial NewPet + bubble NewPetRift*Rift level)/100) * (1+stamp NewPet/100) * (1+meal Npet/100) * max(1,PetUpgBONUS(9))^(totalKitchenLevels/100) * BaseBreedChance * 1st*2nd*3rd*4th*5th multi. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) TotalBreedChance @7928068; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L266-L318 | 1 | H |
| C27 | BaseBreedChance (normal mode) = 1/max(1, RANDOlist[54][speciesPassiveIndex]) when the species is not yet found, else 1; RANDOlist[54] has 70 entries: 2,3,4,7,11,15,20,35,60,100,170,300,500,800,1250,1700,2550,3000,4000,5000 ... (7,000,000 is mid-list) ... last value 90,000,000,000. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) BaseBreedChance @7927168; Toolbox vendor/data/website-data/randomList.json[54] | 1 | H |
| C28 | 1st multi (Gene boost) = 1 + ceil(100*(geneLevel/10)^1.9)/100; gene level is capped at 100 in the UI. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) 1stMulti @7931950; breed UI @9872xxx | 1 | H |
| C29 | 2nd multi (Breedability) = 1 + ln(max(1,(breedProgress+1)^0.725)); breedability heart level = min(9,floor((multi2-1)^0.8)+1). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) 2ndMulti; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L241 | 1 | H |
| C30 | 3rd multi (Egg rarity) = 1 + 0.25*eggRarity^1.4 + (eggRarity/3)^6 using the first egg. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) 3rdMulti @7931950+ | 1 | H |
| C31 | 4th multi (Pastpresent) = 1 for W1; else 1 + 0.1*worldIdx + clamp(1+0.15*PastpresentLv,1,3) * (speciesFoundInPrevWorld / (n - n/2))^3. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) 4thMulti; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L274-L282 | 1 | H |
| C32 | 5th multi (Failure) = max(1,(failCounter+1)^0.3). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) 5thMulti @7933667 | 1 | H |
| C33 | Gene boost cost (Genes) = (10+(5+idx+geneLv)+max(idx-3,1)^1.7) * max(idx-5,1)^1.12 * (1.052+0.01*floor(geneLv/10))^geneLv * max(0.01, 1-4*GeneSplicingLv/100). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) GeneticCost @7929864 | 1 | H |
| C34 | Shiny breeding is a toggle available when Paint Bucket>0 and the selected species is fully found; in it a breed rolls TotalBreedChance (with the shiny BaseBreedChance); success gives a Shiny Mob (type 5, power 1, timer 60*randInt(1,5)) and resets OptionsListAccount[126]; failure trashes the egg for Dead DNA. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) @9872176 and @9876605 | 1 | H |
| C35 | Shiny BaseBreedChance = (1+OLA[126]/100) * (0.92^(idx+8*(world-1)) for world>=2) * (1e-6 + 0.002/max(1,RANDOlist[54][passiveIdx])). OLA[126] grows daily by Sailing artifact bonus 24. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) BaseBreedChance @7927168; daily reset @15093484 | 1 | H |
| C36 | PetUpgBONUS(8) (Paint Bucket '+2% base shiny chance', 1+2*lvl) has no caller in N.js; Paint Bucket level >0 only gates Shiny Mobs, the shiny odds do not scale with its level. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) grep of all PetUpgBONUS calls (indices 1,2,3,5,6,9,10,11,12 only; [2][8] read only as a gate @9852051/@9872176/@10043843) | 1 | H |
| C37 | Shattershell Iteration: after a breed shifts the queue, if slot 0 is empty and rand < ceil(12*lvl^0.698)/100 then slots 0 and 1 are both set to rarity 1 (two free eggs). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) @9878513; PetUpgBONUS(11) | 1 | H |
| C38 | Breedability speed multi = (1 + (25*BreedabilityLv + meal Breed + 20*achievement 218 + star sign 57a)/100) * (1+CropScientist bonus5/100) * (1+Lamp/100) * (1+Arcade 49/100). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) BreedabilitySpdMulti @7925083; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L421-L450 | 1 | H |
| C39 | Toolbox caps breedability hearts at 9 (MAX_BREEDABILITY_LEVEL); the wiki still shows 10 hearts (multi 1.00 to 16.59, 2.18 B days at 1x). | Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L226; idleon.wiki/wiki/Breeding | 2 | M |
| C40 | Shiny level L+1 needs progress > floor((1+L^1.6)*1.7^L); levels cap at 20, or 30 with Menagerie unlock 11 (19+10*owned thresholds). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) SpecialPassives Lv @7930582; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L215-L226 | 1 | H |
| C41 | Shiny progress speed multi = (1+(Mainframe 115 + shiny 'Faster Shiny Mob Lv Up Rate' totals + CropScientist + star sign 57b + 5*GrandMartialLv)/100) * (1+Summoning win bonus 17/100) * (1+10*shinyLevelsOver20/100) * (1+Lamp/100). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) ShinySpdMulti @7925607; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L452-L486 | 1 | H |
| C42 | A shiny passive = shinyLevel * RANDOlist[92][bonusType]; it applies account-wide (ShinyBonusS), not only to Mobs in the yard. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) ShinyBonusS @7922752; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L153 | 1 | H |
| C43 | There are 68 Mobs: W1 17, W2 17, W3 18, W4 16, each with a gene and a shiny passive. | Toolbox vendor/data/website-data/petStats.json | 1 | H |
| C44 | Fence Yard slots = 5 + Fence Extension level + 2 * Fenceyard Space gem (GemItemsPurchased[125]); it accepts only Breedable (type 4) and Shiny (type 5) Mobs plus special genes since v2.41 (2025-07-06). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) FenceYardSlots @7924186; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L75; idleon.wiki/wiki/Changelog_2025 v2.41 | 1 | M |
| C45 | Foraging speed per Mob: only abilityType 1 genes count (power). Forager x2 power; Targeter x5 if same slot in the territory above is Targeter; Opticular x3 if its power >= all 4; Borger x10 if previous territory has a Forager; then team x1.3 per Fleeter, x1.2 per Badumdum in previous/current/next territory, x1.5 per Flashy (no combat Mob) or Fastidious (>=1 combat Mob), x4 Miasma if all 4 genes differ; everything x(1+Upgrade Vault 56). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) Trekking @7904861 and TotalTrekkingHR @7907545; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L385-L406 | 1 | H |
| C46 | The AFK loop still checks TotalTrekkingFightPOW < FightPowREQ, but every live territory's fightPower is 0, so the gate never blocks foraging; combat Mobs contribute 0 forage power. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) _event_AFKTime @9771300; Toolbox vendor/data/website-data/shared-data.json territory | 1 | H |
| C47 | Territory fill requirement = (powerReq + fills) * (1+0.02/(Monolithic count/5+1))^fills; progress += seconds*HR/3600 while AFK or online. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) TotalTrekkingREQ @7910846; @9771300 | 1 | H |
| C48 | Each fill adds 1 of that territory's Spice (CookingSpice{row}); Alchemic rolls 50% per Alchemic Mob for +1; Looter (after >100 fills) rolls 1%/Looter for the next Spice and 0.2%/Looter for the one after, stored in Territory[row][5..8]; Converter (50%) skips the progress reset on claim. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) @9772300 and DontResetTrekProgChance @7915606 | 1 | H |
| C49 | Claiming Spices uses one daily claim per territory claimed (OptionsListAccount[100]); the daily reset sets it to 0 then subtracts 25 per Trasher Mob in Pets[0..26]; Toolbox treats the daily cap as 100 (maxNumberOfSpiceClicks); the game's base cap constant (GenINFO[115]) was not located, so the cap origin is unverified. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) @9794181, @10048249, @15097581; Toolbox vendor/parsers/world-4/cooking.ts#L1170 | 2 | M |
| C50 | 26 live territories (data rows 0-13 and 15-26; row 14 is the retired Arena row); visible rows are limited to min(20+Summoning[3][2], rows-3). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) maxTerritoryScroll @7926889; Toolbox vendor/data/website-data/shared-data.json territory | 1 | H |
| C51 | A territory is unlocked by winning its Mob battle once (battleName); enemy HP and attack come from shared-data territory enemies. | Toolbox vendor/data/website-data/shared-data.json territory; Toolbox Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L93-L137 | 1 | M |
| C52 | Mob Arena needs Breeding Lv 8; battle slots = 2 + arena bonuses at waves 2, 15, 50, 125 (Toolbox 4 extra slots to 6). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) PetBattleSlots @7924354; idleon.wiki/wiki/Breeding | 1 | H |
| C53 | Arena bonuses (wave: bonus): 2 slot3, 5 Library VIP +25%, 8 Total Damage x1.2, 12 Post Office crate, 15 slot4, 20 Monster Cash x1.5, 25 crate, 35 Kitchen upgrade cost -50%, 50 slot5, 65 crate, 80 VIP +60%, 100 third large bubble, 125 slot6, 150 Lab line width +20%, 175 Monster Cash x2, 200 Total Damage x1.4. | Toolbox vendor/data/website-data/shared-data.json arenaBonuses; randomList.json[53] | 1 | H |
| C54 | Crucible (hard arena, Menagerie unlock 8, best wave in OptionsListAccount[628]) pays 16 bonuses at waves 5-250 (Grey DNA x1.25 four times, Orion feather x5, Research EXP, Spelunking POW, Lumi, Cooking speed x10/x20, Poppy fish x4, Bubba meat x3, Class EXP x1.2). | Toolbox vendor/data/website-data/shared-data.json arenaBonuses type crucible; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L23-L35 | 1 | H |
| C55 | Mob damage (TotalDMG has further effects not listed here) = base power x gene effects (Fighter team x1.2 each, Cursory neighbours x1.5, Superboomer x1.4 ...) x random 0.7-1.3 x PetBonusDMG; PetBonusDMG = a GenINFO[118] term (omitted in earlier drafts) plus (1+BloomingAxe/100)(1+Palette 26/100)(1+10*shinyOver20/100)(1+Sushi RoG10/100)(1+(vial PetDmg+5*ach 222+meal PetDmg+star sign 59+arcade 30+vault 58)/100). | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) PetBonusDMG @7894092, TotalDMG @7896225 | 1 | H |
| C56 | Mob HP = (5*power)^0.8, x2 per Defstone on the team and x20 if the Mob itself is Borger. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) TotalHP @7894778 | 1 | H |
| C57 | Toolbox raises breeding dashboard alerts (shinies, breedability, eggs, eggsRarity) only once World 3 is finished. | prior research citing Toolbox utility/dashboard/account.js L952-L999 @6827d3f (not in vendored tree) | 2 | L |
| C58 | Beast Master talents (371 confirmed as the AFK-claim egg chance, see M26): Curviture of the Paw (373, x Mob power 1.2 decayMulti, best of all characters), Shining Beacon of Egg (372, Breeding EXP), Arena Spirit (370, unlimited Arena entries for minutes + Mob DMG), I Dream of Peace and Egg (371). | Toolbox vendor/data/website-data/talents.json skillIndex 370/373; prior research 2026-10-17-breeding.md | 2 | H |
| C59 | Gene indices: 0 Fighter, 1 Defender, 2 Forager, 3 Fleeter, 4 Breeder (pink), 5 Shiny, 6 Mercenary, 7 Boomer, 8 Sniper, 9 Amplifier, 10 Tsar, 11 Rattler, 12 Cursory, 13 Fastidious, 14 Flashy, 15 Opticular, 16 Monolithic, 17 Alchemic, 18 Badumdum, 19 Defstone, 20 Targeter, 21 Looter, 22 Refiller, 23 Eggshell, 24 Lazarus, 25 Trasher, 26 Miasma, 27 Converter, 28 Heavyweight, 29 Fastihoop, 30 Ninja, 31 Superboomer, 32 Peapeapod, 33 Borger. | Toolbox vendor/data/website-data/shared-data.json petGenes | 1 | H |
| C60 | Shiny passive types (base per shiny level): Faster Shiny Lv Up +3%, Infinite Star Signs +2, Total Damage +1%, Refinery speed +2%, All-meal bonus +1%, Drop Rate +1%, Multikill +1%, Base efficiency all skills +20, base STR/AGI/WIS/LUK +2, Critters per trap +1, Farming EXP +1%, Class EXP +1%, Skill EXP +2%, Artifact find +2%, Summoning EXP +1%, Talent points tabs 1-4 and Star +2, Lab line width +1%, Sail captain EXP +3%, Min travel time -1%. | Toolbox vendor/data/website-data/petStats.json; randomList.json[92] | 1 | H |
| C61 | Save paths: Breeding[0] eggs, [1] species found per world, [2] upgrade levels, [3] genes (0-3) and Dead DNA (8), [4..7] gene levels, [13..16] breedability progress, [22..25] shiny progress; Pets[0..26] fence, Pets[27+] territory teams (4 per row), PetsStored; Territory[i]=[progress,fills,?,spice,count,...]; OLA[87] egg timer, [89] arena best, [86] fail counter, [100] spice claims, [126] shiny pity, [628] crucible best. | Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L38-L213; N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) (offsets above) | 1 | H |
| C62 | ActiveOn today reads only BreedingState {level, eggs, eggCapacity, nextEggInSeconds, deadDna, arenaBestWave, speciesBred, territories, upgrades}; knowledge entry systems.yaml id 'breeding' is dossier-linked with no Detector, Goal or Check (M25 coverage audit lists breeding as not covered). | packages/account-state/src/world4-types.ts#L152-L177; packages/knowledge/systems.yaml#L438; scratchpad/ux/m25-coverage.md L35-L37 | 1 | H |
| C63 | AutoReview breeding tiers (community): T1 3 territories/3 slots/arena 3; T2 7/4/15; T3 10/4/50; T4 14/5/125; T5 20/6/200; T6 24 territories and shiny-speed Mobs first; T7+ drop rate, traps, refinery, sailing; T12 Infinite Star Signs at 45. | github.com/TwoSpookyBoos/IdleOnAutoReviewBot @05ac449 mysite/consts/progression_tiers.py breeding_progressionTiers (read 2026-10-19; pre-v1.23) | 4 | L |
| C64 | AutoReview arena team comps: wave 3 Mercenary/Fighter; wave 15 Mercenary+Cursory+Defender; wave 50 Rattler+Monolithic+Refiller+Borger/Defender; wave 125 Rattler+Looter+Badumdum+Refiller+Borger; wave 200 Rattler+Defender+Looter+Refiller+Badumdum+Borger. | IdleOnAutoReviewBot @05ac449 mysite/w4/breeding.py (prior research read 2026-10-17; pre-v1.23) | 4 | L |
| C65 | Wiki strategy: maximise egg capacity early, buy Breedability at Lv 10 to speed new-Mob discovery, Paint Bucket at Lv 40 for shinies, use higher rarity eggs once available. | idleon.wiki/wiki/Breeding (rev 2026-10-14; read 2026-10-19) | 3 | L |
| C66 | Wiki lists skill-mastery rewards from total Breeding level across characters: +25% Breeding EXP at 150 and +15% egg incubation speed at 200 (not verified in code). | idleon.wiki/wiki/Breeding (read 2026-10-19) | 3 | L |
| C67 | W5+ inputs: Lamp (Holes LampBonuses), Crop Scientist, Summoning win bonuses 17, Sushi RoG 10, Palette 26, Minehead (Blooming Axe max +3), Menagerie unlocks 8/11/20 (Crucible, shiny cap 30), Sailing artifact 24 (daily shiny pity), Lab Emerald Ulthurite jewel, W7 territories 25-26. | N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) ShinySpdMulti/BreedabilitySpdMulti/PetUpgMaxLV; Toolbox vendor/parsers/world-4/breeding.ts (pin 6c37e3d)#L4-L21 | 1 | H |
| C68 | Total Dead DNA to max (sum of formula): Gene Splicing 4.64K, Egg Capacity 991, Breedability 1.2K, Fence 4.27K, Rarity 8.38K, Axe 4.0K, Pastpresent 2.75K, Paint Bucket 10.5M, Golden Egg 20.3M, Failsafe 73.6K, Shattershell 15.6K, Grand Martial 1.22M, No Upgrade 14.4M. | Computed from Toolbox vendor/data/website-data/shared-data.json petUpgrades with the PetUpgCostREAL formula | 1 | H |
| C69 | Total meals to max: Gene 3.52B, Egg Cap 5.04B, Breedability 4.63B, Fence 33.8M, Rarity 43B, Axe 110B, Pastpresent 14.4B, Paint Bucket 30Q, Golden Egg 4.71Q, Failsafe 45Q, Shattershell 6.24Q; meals used: Turkey of Thank, Pie, Corn, Pancakes, Potato P Pastry, Cannoli, Wild Boar, Orange, Pretzel, Eel, Buncha Banana, Bill Jack Pep. | Computed from Toolbox vendor/data/website-data/shared-data.json petUpgrades and cookingMenu | 1 | H |
| C70 | The wiki's 'rank-up chance' column (Copper 1 in 37, Iron 1 in 123 ...) equals 0.3^(1+r) for egg rarity r, i.e. the chance for an egg OF that rarity to rise, not the chance of becoming it. | Derived: 0.3^3=1/37, 0.3^4=1/123 vs idleon.wiki/wiki/Breeding table and N.js (legendsofidleon.com/ytGl5oc/N.js, Last-Modified 2026-10-17, game v1.23, verified 2026-10-19) @10095300 | 2 | H |

Tier 1 = game data/code, 2 = Toolbox logic, 3 = wiki, 4 = community. All verified 2026-10-19.
