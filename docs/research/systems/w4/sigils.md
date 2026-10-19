## Sigils

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Paths are relative to `packages/toolbox-parsers/vendor/` unless stated. T = source tier (1 game data and Toolbox parser code, 2 Toolbox logic/dashboard and wiki per ADR 0004 ordering as applied here, 4 community). Parser-code sources previously labelled T3 are relabelled T1 after verification. Confidence H/M/L follows each claim in the register. Web search budget was exhausted for this run, so tier 4 is thin: no dated community sigil priority list was found. Min-max below is labelled "derived" where it is our reasoning from tier 1 numbers.

- **What it is:** 24 passive account-wide Alchemy bonuses. Characters are parked on a sigil and it charges "sigil EXP" over time; each sigil has 5 tiers (Unlock, Boost, Ionized, Ethereal, Eclectic). [C1][C2][C3]
- **Unlocks:** the Laboratory mainframe bonus "Sigils of Olden Alchemy" (Lab bonus index 12) must be connected, or nothing charges. The Gem Shop text also says you must reach World 4 first. [C4][C5][C6]
- **Scope:** bonuses are account-wide. Charging is per character: only characters in slots 0-9 charge, and each uses its single cauldron job slot (so it cannot also brew a bubble cauldron or a liquid). [C7][C8]
- **Inputs -> outputs:** input is time x character count x Sigil speed. Output is a tier-up (a permanent bonus). Unlock subtracts its cost from progress; later tiers fire at the remaining progress >= tier cost (prior reading, M). [C9][C10][C11]
- **Goals and Milestones:**

| Milestone | Cumulative sigil EXP (Unlock+Boost, ordered) | Source |
|---|---|---|
| Unlock sigils 1-9 | 487 (unlocks only) | [C12] |
| Unlock sigils 1-13 (through Pea Pod) | 5,087 (unlocks only) | [C12] |
| Unlock + Boost sigil 7 (Envelope Pile) | 5,317 | [C12] |
| Unlock + Boost sigil 13 (Pea Pod) | 72,287 | [C12] |
| Unlock + Boost all 24 | 1,308,087 (150,887 unlock + 1,157,200 boost) | [C12] |
| Tome "Total Sigil LV" 120 (24 x 5 levels) | 500 Tome points | [C25] |
| Menagerie / Research metric "Sigil LVs" | counts (tier + 1) summed | [C26] |

- **Feeds / fed by:** fed by the Lab, Vial Junkee achievement, Gem Shop Sigil Supercharge, Pea Pod, Sigil stamp, Willow Sippy vial, Sushi Station, Arcade, Vote, Gaming palette, Summoning winner bonus, Turtle Tisane vial, Big Sig Fig legend talent, Chilled Yarn artifact (amplifies bonuses). Feeds base stats, damage, mana, stamps, crystal mobs, Class EXP, star talent points, Refinery, drop rate, golden food, Library, AFK gains, Kitchens, Lab EXP, liquids, Sailing, Divinity, Sneaking, Tome. [C13][C14][C15][C16][C27]
- **Per-session actions:** (1) open Alchemy -> Sigils so completed progress turns into levels (code reading, M); (2) check Lab bonus 12 is connected; (3) reassign characters whose sigil is at the tier cap this account can reach; (4) fill slots 0-9 only. Idle state: a sigil-parked character at the reachable cap or Lab disconnected (chargeRate 0). [C7][C11][C18]
- **AFK Setup implications:** sigil charging uses the cauldron job, not the AFK Target; the character can fight or skill at the same time. It trades off against bubble cauldron and liquid seats. [C7][C8]
- **Min-max by stage:** see below.
- **Common mistakes:** a character still seated on a sigil past its reachable tier cap; Lab bonus 12 disconnected; seating characters 11+ (never charge); not opening the Sigils page; forgetting Tome/Gem Shop speed. [C7][C11][C18][C21]
- **Save and Toolbox fields:** see Mechanics catalogue.

### Mechanics catalogue

| # | Mechanic | Rule / formula | Caps / unlock / costs | Field (exact path) |
|---|---|---|---|---|
| M1 | Sigil table | 24 sigils in fixed order (Big Muscle ... Cool Coin), each with unlockCost, boostCost, jadeCost, etherealCost, eclecticCost and 5 bonus values [C1][C12] | 5 tiers max; see table below | data `data/website-data/shared-data.json` `sigils[]`; `account.alchemy.p2w.sigils[]` |
| M2 | Per-sigil save state | `CauldronP2W[4]` is flat pairs `[progress, tier]`; tier -1 undiscovered, 0 Unlock, 1 Boost, 2 Ionized, 3 Ethereal, 4 Eclectic [C2] | tier max 4 | `parsers/world-2/alchemy.ts#L846-L865` -> `account.alchemy.p2w.sigils[i].{unlocked,progress,bonus}` |
| M3 | Lab gate | Lab bonus 12 "Sigils of Olden Alchemy" must be connected, base 1 sigil XP/h [C4] | connected in Lab | `alchemy.ts#L886-L887,L962` -> `account.lab.labBonuses[12]`; `account.alchemy.p2w.sigils[].chargeRate` is 0 when off |
| M4 | Assignment | Character's cauldron job `>= 100`, sigil index = job - 100 [C7] | one sigil per character | raw `CauldronJobs[1]` -> `account.alchemy.activities[].activity`; `p2w.sigils[i].characters[]` (`alchemy.ts#L850-L853`) |
| M5 | Charging slots | Only character index < 10 charges [C8] | `SIGIL_CHARGING_SLOTS = 10` | `alchemy.ts#L889,L965` |
| M6 | Charge rate | `chargeRate = (characters at idx<10) x sigilSpeed`, 0 if Lab off [C8][C9] | - | `p2w.sigils[i].chargeRate` (`alchemy.ts#L957-L972`) |
| M7 | Sigil speed | `(1+(Achv20 + PeaPod + 20*GemShop110 + Vial + Stamp)/100) x (1+Summoning) x (1+Sushi41) x (1+Arcade43) x (1+Turtle) x (1+Vote17) x (1+Palette20) x (1+Legend31)` [C9][C13] | additive group then 7 multipliers | `getSigilSpeed` `alchemy.ts#L892-L925` -> `account.alchemy.p2w.sigilSpeed.{value,breakdown}` |
| M8 | Speed: Vial Junkee | Achievement index 112, "10 vials at Lv 9", +20% [C13] | one-off | `achievements` index 112 |
| M9 | Speed: Gem Shop | Sigil Supercharge, item 110, +20% per purchase, 10 max, 140 gems (listed cost) [C14] | +200% max | `account.gemShopPurchases[110]`, `data/website-data/gemShop.json` |
| M10 | Speed: Sigil stamp | `+{%_Sigil_Charge_rate`, decay x1=40 x2=150, i.e. 40L/(150+L) [C15] | stamp max level | `getStampsBonusByEffect` `stamps.json` stamp 11 (C-tab) |
| M11 | Speed: vials | Willow Sippy (SigSpd, add, x1=4/level) additive; Turtle Tisane (`6turtle`) multiplicative [C13][C16] | vial level caps | `account.alchemy.vials`, `vials.json` 61, 74 |
| M12 | Speed: Pea Pod | sigil 13 bonus 25/50/100/450/600 % [C1] | additive in group | `getSigilBonus(..,'PEA_POD')` |
| M13 | Speed: later multipliers | Summoning winner "<x Sigil SPD", Sushi 41, Arcade 43, Vote 17, Palette 20, Legend 31 (Big Sig Fig x1=3 x2=150) [C13][C17] | W5+ mostly | respective parsers |
| M14 | Tier gates | Ionized: Jade Emporium `Ionized_Sigils` (x3=31, 500 coins); Ethereal: Spelunking lore boss 7 (`loreBosses[6].defeated`); Eclectic: Research grid 128 + lore boss 6 [C11] | W6 / W7 / W7 | `getSigilTierUnlocks` `alchemy.ts#L929-L936` -> `account.sneaking.jadeEmporium`, `account.spelunking.loreBosses`, `account.research.greenSigilsUnlocked` |
| M15 | Next cost | `nextCost`: tier -1 -> unlockCost; 0 -> boostCost; 1 -> jadeCost if gate; 2 -> etherealCost; 3 -> eclecticCost; else null [C10] | - | `getSigilNextCost` `alchemy.ts#L939-L955` -> `p2w.sigils[i].nextCost` |
| M16 | Unlock subtraction | Unlock spends `unlockCost`; later tiers do not subtract (prior N.js reading, not re-verified) [C11] | M confidence | no parser field; N.js |
| M17 | Level-up on page draw | Client only converts progress to a level when the Sigils page is drawn [C18] | M | no field; `progress >= nextCost` is the detector |
| M18 | Chilled Yarn | Artifact multiplies all sigil bonuses: `(1+artifactBonus) x (1+Meritocracy21/100)` [C19] | W5 Sailing | `applyArtifactBonusOnSigil` `alchemy.ts#L974-L985`, `parsers/index.ts#L287` |
| M19 | Ethereal count | `totalEtherealSigils` = tier 3 or 4; `totalEclecticSigils` = tier 4 [C20] | max 24 | `alchemy.ts#L292-L293` |
| M20 | Sigil bonus effects | Each sigil's bonus consumed by a parser (below) [C21] | - | `getSigilBonus` |
| M21 | Tome metric | Total Sigil LV = sum(tier+1), max 120, 500 PTS [C25] | 120 | `calcSigilsLevels` `alchemy.ts#L1017`, `world-4/tome.ts#L313` |
| M22 | Ethereal Prisma | +0.2 per ethereal sigil to Prisma multi [C22] | W7 | `tesseract.ts#L578-L579` |
| M23 | Eclectic true damage | `1 + grid127 x totalEclectic / 100` [C23] | W7 | `research.ts#L350-L353` |

Bonus consumers (M20): STR/AGI/WIS/LUK (sigils 1-4), Wizardly Hat, VIP Parchment, Peculiar Vial, Cool Coin have **no Toolbox parser**, data only [C21]. Parsed: Plunging Sword `damage.ts#L910`, Duster Studs `damage.ts#L1128`, Envelope Pile `world-1/stamps.ts#L281-L291` (cost divided by `1+bonus/100`), Shiny Beacon `misc.ts#L259` (guaranteed crystal mobs), Metal Exterior `character.ts#L2171`, Two Starz `talents.ts#L587`, Pipe Gauge `world-3/refinery.ts#L118`, Trove `character.ts#L2400`, Pea Pod speed, Tuft of Hair `character.ts#L3224` (speed cap 1.75), Emoji Veggie `misc.ts#L933`, Dream Catcher `character.ts#L3250`, Garlic Glove `world-4/cooking.ts#L939`, Lab Tesstube `character.ts#L1136`, Loot Pile `world-5/sailing.ts#L589`, Div Spiral `character.ts#L1253`. [C21]

**Sigil table** (tier 1 data, [C1][C12]; bonuses Unlock/Boost/Ionized/Ethereal/Eclectic; costs Unlock, Boost, Ionized, Ethereal, Eclectic):

| # | Sigil | Effect | Costs U / B | Ionized / Ethereal / Eclectic cost | Bonus U/B/I/Et/Ec | Cum U+B |
|---|---|---|---|---|---|---|
| 1 | Big Muscle | base STR | 2 / 100 | 50K / 250K / 10M | 10/20/40/100/200 | 102 |
| 2 | Pumped Kicks | base AGI | 3 / 150 | 60K / 300K / 20M | 10/20/40/100/200 | 255 |
| 3 | Odd Litearture | base WIS | 5 / 200 | 70K / 400K / 30M | 10/20/40/100/200 | 460 |
| 4 | Good Fortune | base LUK | 8 / 300 | 90K / 500K / 50M | 10/20/40/100/200 | 768 |
| 5 | Plunging Sword | base damage | 15 / 700 | 100K / 600K / 60M | 75/225/1000/5000/10000 | 1,483 |
| 6 | Wizardly Hat | mana regen % | 24 / 1,250 | 130K / 700K / 100M | 10/20/30/50/60 | 2,757 |
| 7 | Envelope Pile | -% stamp MAX-level cost | 60 / 2,500 | 160K / 1M / 250M | 12/25/40/65/75 | 5,317 |
| 8 | Shiny Beacon | first N kills/day spawn Crystal Mob | 120 / 4,000 | 200K / 1.4M / 70M | 1/2/5/10/12 | 9,437 |
| 9 | Metal Exterior | Class EXP % | 250 / 7,000 | 240K / 1.7M / 200M | 6/12/20/50/70 | 16,687 |
| 10 | Two Starz | star talent points | 500 / 10,000 | 280K / 2.2M / 300M | 10/25/45/100/125 | 27,187 |
| 11 | Pipe Gauge | Refinery speed % | 700 / 12,000 | 320K / 2.6M / 600M | 10/20/30/60/75 | 39,887 |
| 12 | Trove | drop rate % | 1,300 / 14,000 | 400K / 3M / 1.25B | 10/20/30/100/150 | 55,187 |
| 13 | Pea Pod | all sigils charge % faster | 2,100 / 15,000 | 420K / 3.5M / 2.5B | 25/50/100/450/600 | 72,287 |
| 14 | Tuft Of Hair | move speed % (if under 175%) | 3,000 / 25,000 | 450K / 4.3M / 6B | 3/6/10/15/20 | 100,287 |
| 15 | Emoji Veggie | golden food % | 4,500 / 33,000 | 480K / 5.5M / 12B | 10/25/40/60/80 | 137,787 |
| 16 | VIP Parchment | Library VIP % | 6,300 / 42,000 | 520K / 6.7M / 25B | 10/25/50/100/150 | 186,087 |
| 17 | Dream Catcher | all skill AFK gain % | 7,000 / 50,000 | 560K / 8.2M / 40B | 1/2/4/10/15 | 243,087 |
| 18 | Duster Studs | weapon power | 8,000 / 60,000 | 600K / 10M / 60B | 3/7/15/25/40 | 311,087 |
| 19 | Garlic Glove | -% kitchen upgrade cost | 9,000 / 70,000 | 650K / 12M / 100B | 15/35/60/90/95 | 390,087 |
| 20 | Lab Tesstube | Lab EXP % | 12,000 / 80,000 | 700K / 14M / 200B | 8/20/35/70/100 | 482,087 |
| 21 | Peculiar Vial | liquid regen % | 17,000 / 120,000 | 750K / 15M / 350B | 15/25/35/50/65 | 619,087 |
| 22 | Loot Pile | sailing chest treasure % | 23,000 / 160,000 | 900K / 16M / 500B | 10/20/30/60/100 | 802,087 |
| 23 | Div Spiral | Divinity EXP % | 26,000 / 200,000 | 1.2M / 17M / 700B | 10/30/50/100/150 | 1,028,087 |
| 24 | Cool Coin | Jade coin gain % | 30,000 / 250,000 | 2M / 20M / 1T | 20/50/100/250/400 | 1,308,087 |

W5+ extensions (one line each): W5 Chilled Yarn artifact (x2 to x5) multiplies all bonuses [C19]; W5 Sushi Station, W5 Arcade 43 and Gaming palette 20 add speed multipliers [C13]; W6 Jade Emporium "Ionized Sigils" opens tier 3 and Cool Coin pays Jade coins [C11]; W6 Summoning winner bonus and Vote 17 add speed [C13]; W7 Spelunking lore boss 7 opens Ethereal, which also feeds Prisma [C11][C22]; W7 Research grid 128 opens Eclectic and Research has a x Sigil-EXP multiplier [C11][C23][C24]; W7 Big Sig Fig legend talent multiplies speed [C13].

### Missed mechanics added after verification

- **Per-sigil effect table:** the Sigil table above lists effects and consumers for all 24; sigils 1-4, Wizardly Hat, VIP Parchment, Peculiar Vial, Cool Coin are data-only (M). Source: `shared-data.json` `sigils`, parsers cited above, T1, 2026-10-19.
- **Chilled Yarn forms:** data text "All the Sigils in alchemy give 2x their displayed bonus. Ancient will give 3x, not 4x" (`data/website-data/artifacts.json#L307-L313`, T1). Wiki lists 2/3/4/5 by form (T2). Both recorded; Toolbox code uses the artifact bonus field times Meritocracy 21. Confidence M.
- **Wiki priority values** for Peculiar Vial, Trove, Plunging Sword, Wizardly Hat: only names captured, bucketing not visible in the fetched text (L).
- **Lab geometry:** Lab bonus 12 must be connected in the mainframe chain with the player in range of the node; Toolbox only reads `labBonuses[12]` connected state (`alchemy.ts#L886-L887`, T1). The range/player rule is from prior research, L.
- **Summoning winner bonus:** "<x Sigil SPD" appears on five different Summoning enemies (`data/website-data/summoningEnemies.json` lines 229, 341, 495, 719, 1027, T1, H); the speed formula takes one summed Summoning multiplier.
- **Single EXP/hour:** total = chargingCharacters (idx<10) x base 1/h x (1 + additive/100) x seven multipliers (M7); Research "x Sigil EXP" and Big Sig Fig interplay is not modelled by Toolbox (L).
- **Pea Pod feedback:** Pea Pod is the only sigil feeding sigil speed (`getSigilBonus 'PEA_POD'`, H).
- **11th+ characters** and index >= 10 never charge (H); undiscovered (-1) counts 0 toward Tome Total Sigil LV (unlocked+1, H).
- **`getSigilBonus excludeEclectic`** returns the Ethereal value for tier-4 sigils; some consumers ignore Eclectic (`alchemy.ts#L867-L871`, H).
- **Gem Shop Supercharge** counter lives in `gemShopPurchases[110]` (H); Prisma gets +0.2 per Ethereal sigil (H).

### Min-max by stage

Community sourcing is weak (see Open questions). Entries marked "derived" come from the tier 1 cost and effect table, not a published community list.

- **W1-W3 (before Lab bonus 12):** nothing to do; sigils cannot charge. Build toward the Lab and the Vial Junkee achievement (+20% speed). Idleon Academy-style advice is "unlock all bubbles before sigils" (tier 4, as quoted in the M25 audit, not re-fetched). [C4][C13][C28]
- **Early W4 (Lab just connected):** derived: seat 3-4 characters, unlock sigils 1-9 in order (487 EXP total), they are cheap and include Envelope Pile and Metal Exterior. The wiki says to prefer the four stat sigils first, then Plunging Sword and Wizardly Hat for mid-game, with Peculiar Vial and Trove later (tier 2). [C12][C29]
- **Mid W4:** derived: unlock Two Starz, Pipe Gauge, Trove, Pea Pod (4,600 EXP), then Boost Pea Pod early because it raises every later charge by up to +50%. AutoReview's `sigils_progressionTiers` also lists Pea Pod early (tier 4 via the M25 audit, unfetched). Buy Gem Shop Sigil Supercharge if gems allow (+20% each). [C12][C14][C30]
- **Late W4:** derived boost priority by value per EXP: Envelope Pile (-25% stamp max cost), Trove (+20% DR), Metal Exterior, Two Starz, Pea Pod, Plunging Sword. Fill unlocks through sigil 13 (5,087 EXP) before expensive Boosts (7,000 to 15,000 each). Stamp 11 (Sigil stamp) and Willow Sippy vial are cheap speed. [C12][C15][C16]
- **W5+ outline:** unlock Emoji Veggie, Dream Catcher, Garlic Glove, Lab Tesstube once relevant systems matter; get Chilled Yarn; then Ionized (W6), Ethereal and Eclectic (W7) need hundreds of thousands to trillions of EXP, so speed multipliers dominate. [C11][C19]
- **Per class:** no class dependence in the mechanic; any character at index 0-9 charges. [C8]

### Open questions

1. Is the "unlock subtracts, later tiers don't" rule correct on 2.3.540? It comes from prior N.js reading @5948440 (game v1.23) and was not re-verified here. Toolbox only uses nextCost. (M)
2. Does a sigil really only level when the page is drawn? Test by comparing a save before/after opening the page. (M)
3. Gem Shop item 110 lists a flat 140-gem cost with costIncrement 0; the in-game price may rise per purchase. (L)
4. Prior dossier said all 24 unlocks cost 130,016; the table sums to 150,887. Corrected here. (H)
5. No dated community priority list found (search budget exhausted); Reddit and Idleon Academy not fetchable.
6. Does Lab bonus 12 stay connected without a character in the Lab? Prior research says it needs one; not re-derived here.
7. Tier-4 cost/bonus values changed in v1.05/v1.14 (Eclectic); re-pull `sigils` from Toolbox each sync.

### Claims register

[C1] 24 sigils, 5 bonus tiers each, with costs and bonuses in `data/website-data/shared-data.json` `sigils` (L38414). {T1, 2026-10-19, Toolbox 6c37e3d} Confidence H.
[C2] Save: `CauldronP2W[4]` flat pairs `[progress, tier]`, tier -1..4. {`parsers/world-2/alchemy.ts#L846-L865`, T1, 2026-10-19} Confidence H.
[C3] Wiki lists the five tiers Unlocked, Boosted, Ionized, Ethereal, Eclectic. {https://idleon.wiki/wiki/Alchemy, T2, 2026-10-19} Confidence M.
[C4] Lab bonus 12 "Sigils_of_Olden_Alchemy": level sigils by assigning players, base 1 sigil XP/hour. {`data/website-data/shared-data.json` labBonuses[12]; https://idleon.wiki/wiki/Laboratory, T1/T2, 2026-10-19} Confidence H.
[C5] Lab gate in code: `SIGILS_LAB_BONUS_INDEX = 12`, chargeRate 0 when not connected. {`parsers/world-2/alchemy.ts#L886-L887,L962-L970`, T1, 2026-10-19} Confidence H.
[C6] Gem Shop text: "you must reach World 4 before you can level up sigils". {`data/website-data/gemShop.json` item GemP17, T1, 2026-10-19} Confidence H.
[C7] **Disputed (inference):** source lens: the code only filters activity>=100; "shares the cauldron job slot" is inferred from the field, not stated. Gamedata lens: field confirmed (`CauldronJobs[1]`, index < character count). Correction: treat the slot-sharing as inferred, M. Assignment is `CauldronJobs[1]` activity >= 100, sigil = activity - 100; shares the cauldron job slot with bubbles/liquids. {`alchemy.ts#L850-L853`, T1, 2026-10-19} Confidence M.
[C8] Only characters with index < 10 charge. {`alchemy.ts#L888-L889,L965`, T1, 2026-10-19} Confidence H.
[C9] chargeRate = charging characters x sigilSpeed. {`alchemy.ts#L957-L972`, T1, 2026-10-19} Confidence H.
[C10] nextCost mapping per tier (unlockCost, boostCost, jade/ethereal/eclectic gated). {`alchemy.ts#L939-L955`, T1, 2026-10-19} Confidence H.
[C11] Correction: N.js unlock-subtract rule is unverifiable here (L). Tier gates: Jade Emporium Ionized_Sigils (cost x1=500), Spelunking `loreBosses[6].defeated`, Research grid 128 + lore boss 6. Unlock-subtracts rule from N.js @5948440 (v1.23, 2026-10-17, M, not re-verified). {`alchemy.ts#L929-L936`, `data/website-data/shared-data.json#L16717`, `parsers/world-7/research.ts#L350`, T1, 2026-10-19} Confidence M.
[C12] Cost sums computed from `sigils` data: unlock total 150,887; boost total 1,157,200; first 9 unlocks 487; first 13 unlocks 5,087; unlock+boost total 1,308,087. {computed from [C1], T1, 2026-10-19} Confidence H.
[C13] Sigil speed formula (additive: achievement 112, Pea Pod, 20 x GemShop 110, SigSpd vial, stamp; multipliers: Summoning, Sushi 41, Arcade 43, Turtle vial, Vote 17, Palette 20, Legend 31). {`alchemy.ts#L878-L925`, T1, 2026-10-19} Confidence H.
[C14] Gem Shop Sigil Supercharge: +20% per purchase, max 10, cost 140, index 110. {`data/website-data/gemShop.json` GemP17, T1, 2026-10-19} Confidence H.
[C15] Sigil stamp: `+{%_Sigil_Charge_rate`, decay x1=40 x2=150; wiki gives 40 x level / (150 + level). {`data/website-data/stamps.json` stamp "Sigil_Stamp"; https://idleon.wiki/wiki/Alchemy, T1/T2, 2026-10-19} Confidence H.
[C16] Correction (gamedata lens): Willow Sippy is additive, Turtle Tisane (`6turtle`) is multiplicative, not additive; achievement index 112 not independently mapped to achievements.json (L for the line number). Vials: Willow Sippy (SigSpd, +4 base) and Turtle Tisane (multiplicative Sigil SPD). Vial Junkee achievement (index 112): 10 vials at Lv 9 gives +20% sigil charging. {`data/website-data/vials.json` 61, 74; `achievements.json#L1646`, T1, 2026-10-19} Confidence H.
[C17] Big Sig Fig legend talent: x1=3 x2=150, multiplies sigil level-up speed; Summoning winner bonus "<x Sigil SPD" exists. {`data/website-data/shared-data.json#L18507`, `summoningEnemies.json#L229`; wiki says 1 to 4.5x, T1/T2, 2026-10-19} Confidence H.
[C18] Client levels sigils only when the Sigils page draws (reading of N.js @5948440, v1.23, M, not re-verified). {prior dossier docs/research/systems/w4-systems/2026-10-17-rift-sigils-tome-bosses-elite.md, T1 via prior, 2026-10-17} Confidence L.
[C19] **Disputed (values):** source lens: artifact data says 2x (Ancient 3x, "not 4x") while wiki lists 2/3/4/5 across forms; gamedata lens: Toolbox multiplies all 6 bonus fields. Both recorded, confidence M for forms above Ancient. Chilled Yarn artifact doubles displayed sigil bonuses (Ancient 3x per data text); Toolbox multiplier `(1+artifact) x (1+Meritocracy 21/100)`. Wiki states 2-5x. {`data/website-data/artifacts.json`; `alchemy.ts#L974-L985`; https://idleon.wiki/wiki/Alchemy, T1/T2, 2026-10-19} Confidence M.
[C20] totalEtherealSigils counts tier 3 or 4; totalEclecticSigils counts tier 4. {`alchemy.ts#L292-L293`, T1, 2026-10-19} Confidence H.
[C21] Negative claim (unparsed bonuses) only spot-checked, M. Bonus consumers listed in the Mechanics catalogue; base stat sigils 1-4, Wizardly Hat, VIP Parchment, Peculiar Vial and Cool Coin are not read by any vendored parser. {grep of `parsers/**`, T1, 2026-10-19} Confidence M.
[C22] Ethereal sigils add 0.2 each to Prisma multi. {`parsers/class-specific/tesseract.ts#L578-L579`, T1, 2026-10-19} Confidence H.
[C23] Eclectic true damage = 1 + research grid 127 x totalEclectic / 100. {`parsers/world-7/research.ts#L350-L353`, T1, 2026-10-19} Confidence H.
[C24] **Disputed (consumer):** data has the entry, but gamedata lens notes Toolbox `getSigilSpeed` includes no research multiplier, so the parser omits it (a Toolbox gap or an EXP-gain, not charge-rate, multiplier is unresolved, L). Research has a "x multiplier to all Sigil EXP gains" entry. {`data/website-data/research.json#L824`, T1, 2026-10-19} Confidence H.
[C25] Tome metric Total Sigil LV: cap 120, 500 PTS; sums tier+1. {`data/website-data/shared-data.json` tomeData; `alchemy.ts#L1017-L1020`, T1/T1, 2026-10-19} Confidence H.
[C26] Sigil level sum also feeds a Menagerie/requirement metric `sum(tier+1)`. {`parsers/world-7/menagerie.ts#L316`, T1, 2026-10-19} Confidence H.
[C27] Tome, stamps, refinery etc. read sigil bonuses (see consumer list). {parsers cited in the catalogue, T1, 2026-10-19} Confidence M.
[C28] "Unlock all bubbles before sigils" advice attributed to Idleon Academy. {M25 coverage audit `scratchpad/ux/m25-coverage.md` L109, T4, secondhand, not re-fetched} Confidence L.
[C29] Wiki priority: early stat sigils, mid Plunging Sword and Wizardly Hat, late Peculiar Vial and Trove. {https://idleon.wiki/wiki/Alchemy, T2, 2026-10-19; page revision date unknown} Confidence L.
[C30] AutoReview lists Pea Pod early in `sigils_progressionTiers`. {M25 audit L147, T4, secondhand, 2026-09-23 per audit} Confidence L.
