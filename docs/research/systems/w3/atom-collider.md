# Dossier: Atom Collider (W3 build, W4+ payoff)

Verified 2026-10-19 against Toolbox @6c37e3d, game version 2.3.540. Topic id `atom-collider`. Tiers: 1 = game data / Toolbox parsers, 2 = Toolbox logic and dashboard, 3 = idleon.wiki, 4 = community guides. "Computed" = derived here from the cited formula. Paths are relative to `packages/toolbox-parsers/vendor/` (abbrev. `V/`). Terminology note: the game and wiki call the currency "atoms"; Toolbox and the save call it `particles` ([C11]). This dossier says "particles" for the currency and "atom upgrade" for the 17 upgrades. Revised after two adversarial verification passes (source lens, game-data lens): no claim was refuted by either lens; 42 claims kept, 9 missed mechanics added (catalogue items 28-36). Confidence tags: H = confirmed in code/data (or wiki-corroborated), M = code-only, description-only or computed, L = unverifiable here (community gist [C35], prior-dossier note [C39]). Search budget was exhausted and Reddit is blocked from this environment, so tier 4 rests on ONE guide (the shnaps gist, self-declared through v1.21); see Open questions.

## Atom Collider

- **What it is:** A late-W3 Construction building that turns surplus stockpile in Storage into particles, which buy 17 account-wide atom upgrades (stamp discounts, talent power, damage, cooking, W6/W7 multipliers). It also lowers its own upgrade costs by 0.1% per building level. [C1][C11][C12][C15]
- **Unlocks:** Construction building index 8 (`Atom_Collider`), built with Nullo Salt (`Refinery6`, the 6th salt), 10 salt for the first level, building max level 200. 11 upgrades exist from the start (Hydrogen..Sodium); six more open through the Compass (2), Jelly Operator, Minehead, Sushi Station and Menagerie (1 each), all W6/W7. A W3 account therefore sees 11. Conversion of any Storage stack over 1,050M happens even with the building off or unbuilt (wiki, tier 3; wiki also confirms 10M -> 1 atom every 3-5 s, inventory excluded, 20 base +20 Compass +20 Event Shop max level; conf H). Extra atoms unlock one at a time in a fixed order whatever the source (Compass Magnesium, Compass Aluminium, Jelly, Minehead, Sushi, Menagerie; wiki, conf M). [C15][C6][C13]
- **Scope:** Account-wide. Particles are one account number; upgrade levels are one account array; the building level is account Construction state. [C11]
- **Inputs → outputs:** In: Storage stacks above a threshold (15M, 25M, 100M, 250M or 1.05B), 1 particle per 10M above it, plus Nullo Salt to build and raise the building. Out: particles, spent on the 17 atom upgrades, Boron-paid bubbles, some Divinity gods, the Caverns Bell, and read by one Sailing artifact. [C12][C14][C24][C32][C33]
- **Goals and Milestones:**

  | Milestone | Threshold | Reward | Source |
  |---|---|---|---|
  | Collider built | Lv 1 (10 Nullo) | atom upgrades buyable; upgrade costs -0.1% | [C15] |
  | Every 10 collider levels | Lv 10, 20 ... 200 | +1% cost cut each (max 20% at Lv 200) | [C3][C15] |
  | Atom max level 20 | default | cap of all atom upgrades | [C5] |
  | Atom max level 30 | Gaming superbit Isotope_Discovery | +10 (code only, not on the wiki; conf M) | [C5][C16] |
  | Atom max level up to 70 | Compass Atomic_Potential, Event Shop 28 (+20), Menagerie boost 17 | up to +20 / +20 / more | [C5][C17][C43] |
  | Hydrogen 90% | level x days since last stamp cap raise, capped | stamp cap-raise materials down 90% | [C7] |
  | Tome | total atom levels is a Tome line | Tome points | [C34] |

- **Feeds / fed by:** Fed by Storage overflow (3D Printer output, AFK farming), Nullo Salt (Refinery), Divinity[39] particle stock; cost cut by Neon atom, Atom Split bubble, Atomic Stamp, collider level, Atom_Redux superbit, Compass Atomic_Cost_Crash, Grimoire, Hot Pink palette, Bubba Boon, a merit-shop level. Feeds Stamps (Hydrogen, Aluminium), Talents (Helium), Alchemy (Lithium, Boron), Post Office (Beryllium), Construction (Carbon, Nitrogen), Library (Oxygen), Cooking (Fluoride), Damage (Neon), Gaming (Sodium), Trapping (Magnesium), Minehead, Sushi, Jelly Operator, Menagerie (Si, P, S, Cl). [C3][C7]-[C31]
- **Per-session actions:** Spend particles on the next priority upgrade ([Min-max](#min-max-by-stage)); check the threshold does not eat stockpiles you want (printed refinery fuel, Copper, Oak); before raising any stamp cap, check whether Hydrogen is near 90% (any raise resets it to 0). Idle state: particles accumulating with an affordable priority upgrade unspent. [C7][C14][C44]
- **AFK Setup implications:** None per character. Account-level: keep the threshold above the stacks you rely on (refinery fuel, bubble material), because the 1.05B auto-convert ignores the switch (wiki), and the gist advises leaving the collider off unless converting deliberately (gist claim: conf L, unverified). [C13][C35]
- **Min-max by stage:** see the section below.
- **Common mistakes:** (1) Raising a stamp cap the day before a large Hydrogen discount: detect `accountOptions[134]` low vs Hydrogen level high. (2) Low threshold (option 133 = 0, 15M) with refinery fuel or alchemy material stacks near 15M: they convert to particles. (3) Spending on Helium past ~level 10 (cost x10 per level, [C37]). (4) Treating a freshly unlocked atom as buyable at once: its first levels cost 30K to 10M particles (Mg..Cl). [C7][C14][C37]
- **Save and Toolbox fields:** see the mechanics catalogue.
- **Sources:** inline claim ids; full list in the structured return. Old-patch flags: wiki page rev 2026-10-07 (current); gist through v1.21 (about 2 patches old); prior repo dossier read N.js v1.23.

## Mechanics catalogue

All paths: `account.atoms.*` is the Toolbox section from `V/parsers/world-3/atomCollider.ts` (`getAtoms`). Raw save: `Atoms` (number[] of levels, index = atom index), `Divinity[39]` (particles).

1. **Particle currency.** Stock = `Divinity[39]` -> `account.atoms.particles`. Atom levels = `Atoms[i]` -> `account.atoms.atoms[i].level`. [C11]
2. **Particle generation (3D Printer overflow).** Per item: surplus above threshold, `atoms = surplus / 10e6` (1e7) shown by `printer.ts calcTotals` -> `account.printer.atom.atoms`. Toolbox models this for printed items only; the game converts any Storage stack. Threshold tier from `accountOptions[133]`: 0 -> 15M, 1 -> 25M, 2 -> 100M, 3 -> 250M, else 1.05B. Wiki: auto conversion of any Storage stack over 1,050M every 3-5 s, regardless of building state. [C12][C13][C14]
3. **Atom upgrade cost.** `cost(L) = base * (x3 + x1*L) * x2^L`, `base = 1 / (1 + R/100)`; floored only when `< 1e6`. `R = palette35 + stamp(Lower_Atom_Upgrade_Costs) + Neon bonus + 10*[Atom_Redux] + (grimoire51 + compass50) + bubble ATOM_SPLIT + colliderLevel/10 + 7*merit(tasks[2][4][6]) + Bubba atomCost`. Fields `cost`, `nextLeveCost`, `costToMax`. [C2][C3][C4]
4. **Atom max level.** `round(20 + 10*[Isotope_Discovery] + compass53 + (20*[EventShop 28] + menagerieBoost17))`; `account.atoms.atoms[i].maxLevel`; one cap for every atom. [C5]
5. **Atoms available.** `round(11 + min(1,compass47) + min(1,compass58) + min(1,jelly17) + min(1,minehead7) + min(1,sushi22) + [menagerie unlock16])` -> `account.atoms.totalAtomsAvailable`. Toolbox still lists all 17 atoms; it does not hide unavailable ones. [C6][C38]
6. **Collider building.** `account.towers.data[8].level` (max 200, +1.14 bonusInc, costInc [0.1, 0.1], 10 Nullo base), reduction `level/10` percent, continuous (not stepped: it feeds R as level/10, so Lv 15 gives 1.5%; the "every 10 levels" milestone row is a convenience, conf H). The 201K Nullo figure was not checked (conf L). [C15]
7. **Hydrogen (0), Stamp Decreaser.** baseBonus 1, x1 1, x2 1.35, x3 2. `value = min(90, level * 1 * accountOptions[134])` (days since last stamp cap raise per the Toolbox comment); exposed as `account.atoms.stampReducer`; scales stamp cap-raise material cost via `stampReducerVal = max(0.1, 1 - reduction/100)`. Reset to 0 by any cap raise. [C7][C45]
8. **Helium (1), Talent Power Stacker.** baseBonus 1, x1 0, x2 10, x3 10 (cost 10^L). Value = level; added to the `lavaLog(resource)` term of "power of 10" talents (Copper Collector, wood/critter/soul talents) in `character.ts#L3682-L3685`, `efficiency.ts#L286-L634`. [C25][C37]
9. **Lithium (2), Bubble Insta Expander.** baseBonus 1 (% chance of +1 extra level and the No Bubble Left Behind reach). Description only; Toolbox's `getNblbBubbles` does not read it. [C31]
10. **Beryllium (3), Post Office Penner.** baseBonus 7 (conversions per day, daily silver pen -> PO box). Description only in Toolbox. [C31]
11. **Boron (4), Particle Upgrader.** baseBonus 2 (uses per day). Bubble cost `>= 1e8` on the first ingredient (not Bits/W6) can be paid in particles: `floor(cost/1e9 * (bubbleIndex+1) * 1.04^bubbleIndex * 100)` (`alchemy.ts#L991-L1006`). Only the first ingredient (itemIndex 0) is eligible; the daily-use count is not modelled by the parser; Bits/W6 items, the salts themselves, FillerMaterial and bBar items are excluded (tier 1, conf H). [C24][C44]
12. **Carbon (5), Wizard Maximizer.** baseBonus 2. Value = `2 * account.towers.wizardOverLevels` (wizard damage %); level raises wizard tower max level by `round(2*level + mastery + gambit)` for towers with max 50 (`construction.ts#L491-L503`). [C8]
13. **Nitrogen (6), Construction Trimmer.** baseBonus 15. Trimmed slot multiplier `3 + atom/100`; level >= 1 adds a trimmed slot (cap 8 total). [C27]
14. **Oxygen (7), Library Booker.** baseBonus 2. Library checkout speed `(1 + value/100)`; min talent book level `+= level`; max `+= 10` once level >= 1 (`misc.ts#L319-L327`, `#L390`). [C26]
15. **Fluoride (8), Void Plate Chef.** baseBonus 1. `value = (1 + level/100)^(meals at Lv>=30)`, shown as `100*(x-1)` percent; cooking speed multiplier (`cooking.ts#L796-L867`). [C9]
16. **Neon (9), Damage N' Cheapener.** baseBonus 1. +1% total damage per level (`damage.ts#L340`), and `Neon level` percent off every atom cost. [C10]
17. **Sodium (10), Snail Kryptonite.** baseBonus 5: snail failure resets to nearest 5 up to Lv `value`. W5 Gaming snail. Not computed by Toolbox beyond `value`. Conf M. [C31]
18. **Magnesium (11), Trap Compounder.** baseBonus 1: critter gain +% per day since last trap placed, cap 60 days; `traps.ts#L131 = value * accountOptions[363]`. W3 trapping. `accountOptions[363]` = days since the last trap placement; the 60-day cap is in the in-game description only, NOT clamped in code. Requires Compass 47. [C28]
19. **Aluminium (12), Stamp Supercharger.** baseBonus 1: Exalted Stamp Doubler bonus `+value`% on top of the 100% base (`stamps.ts#L319-L339`). Requires Compass 58. [C29]
20. **Silicon (13), Minehead Currency Printer.** x(1 + value/100) Minehead currency (W7); confirmed `world-7/minehead.ts#L199` (read) and `#L258` (multiplier 'Atom Collider (Silicon)'). Conf H. [C30]
21. **Phosphorus (14), Sushi Bucks Generator.** x(1 + value/100) Sushi Bucks (W7). [C30]
22. **Sulfur (15), Jelly Bloodcell Juicer.** x(1 + value/100) Bloodcells (W7). [C30]
23. **Chlorine (16), Lumi Gainer.** baseBonus 2, additive to Menagerie hourly Lumi gain (W7). [C30]
24. **Other particle sinks/readers.** Divinity gods index not in {0,1,2,3,4,6,8} pay particles; Caverns Bell cost type index 4 is particles; The_True_Lantern artifact gives `baseBonus * lavaLog(particles)`. [C32][C33]
25. **Tome.** `calcTotalAtomLevels` (sum of all atom levels) is a Tome line (`tome.ts#L333`). [C34]
26. **Cost-cut sources (detail).** Palette 35 Hot Pink (gaming palette), Stamp C23 "Atomic_Stamp" (`AtomCost`), bubble `ATOM_SPLIT` (Kazam cauldron c24, decay x1 14 x2 40), Grimoire upgrade 51 `Death_of_the_Atom_Price`, Compass 50 `Atomic_Cost_Crash`, superbit `Atom_Redux` (-10%), Bubba Boon "Atom Cost" (id 7), merit shop `tasks[2][4][6]` at 7% per level. [C16]-[C23]
27. **W5+ extensions (one line each).** Sodium (W5 Gaming snail); Sailing artifact The_True_Lantern reads particles; Gaming superbits Atom_Redux/Isotope_Discovery; Compass (Windwalker) atoms 47/58 and cost/max-level nodes; W6 Spelunking-adjacent: none found; W7 Minehead (Silicon), Sushi (Phosphorus), Jelly (Sulfur), Menagerie (Chlorine, unlock 16, boost 17) atoms; Event Shop 28 (+20 max level). Chlorine/Sulfur/Sushi/Minehead/Jelly pieces were added v1.05-v1.23 per prior dossier changelog reading (tier 3-4, not re-verified; conf L). [C6][C30][C33][C39]

28. **Collider switch and threshold controls.** Player-facing ON/OFF switch plus a per-item threshold setting (`accountOptions[133]`, tiers above). Toolbox reads only the threshold (`printer.ts#L160`); the switch has no known save field. Wiki: the 1.05B tier converts even when off or unbuilt. Conf M.
29. **Hydrogen daily growth counter.** `accountOptions[134]` multiplies Hydrogen level x baseBonus (cap 90); per the Toolbox comment and description it counts days since the last stamp max-level upgrade and resets to 0 on one (read directly at `atomCollider.ts#L41`; the reset itself is not in code). Conf M. [C7]
30. **Stamp future-cost planning.** `stamps.ts#L165-L175` uses `atoms[0].baseBonus * atoms[0].level` as the per-day reduction increment (steps up to 90) when projecting future stamp cap-raise costs. Conf H. [C7][C45]
31. **Per-atom cost fields.** The parser exposes `cost`, `nextLeveCost` (level+1) and `costToMax` (sum from current level to `maxLevel`, `atomCollider.ts#L137-L143`) for every atom. Conf H. [C2]
32. **Lithium / Beryllium / Sodium in-game effects not modelled.** Lithium: No Bubble Left Behind (NBLB) bubbles get a chance (15% per description) of +1 extra level; the only code touch is `alchemy.ts#L1110` tagging NBLB `atomBubbles` with `lithium: true` (bubble index 30). Beryllium: converts silver pens to PO boxes daily (7 per day at Lv 1). Sodium: snail failure resets to the nearest 5, up to level 5x. Numbers come from descriptions only; no value consumers in the parser. Conf M. [C31]
33. **Carbon and other tower caps.** `applyMaxLevelToTowers` / `getExtraMaxLevels` (`construction.ts#L446-L503`): towers with max 50 gain `round(2*Carbon + wizard mastery + 100*gambit9)`; towers with max 101 (Talent Library), 100 (Shrine) and 15 (Trapper Drone) gain only from separate Construction Mastery (rift 40) paths, not from Carbon. Conf H. [C8]
34. **Unlock sources are specific.** Compass node 47 -> Magnesium, node 58 -> Aluminium, Jelly bonus 17, Minehead bonus 7, Sushi bonus 22, Menagerie unlock 16; 11 atoms are base. Toolbox only counts them; the atom-to-source mapping follows the wiki order (conf M). Max-level sources also include Menagerie boost 17 and Event Shop 28 (+20). [C6][C43]
35. **Particles as other currencies.** Particles are the Divinity god currency (gods not in {0,1,2,3,4,6,8}; Sailing gold 1) and Caverns Bell cost type 4; The_True_Lantern reads `lavaLog(particles)`. Conf H. [C32][C33]
36. **Collider tower feeds R continuously** (`level/10`), and all 17 atoms are listed regardless of availability (`atomsInfo.map`). Conf H. [C15][C38]

### Computed cost table (no reductions)

Costs in particles; from [C2] with `base = 1`; the sampled values were recomputed and confirmed (level L costs base*10*10^L for Helium). Conf H. Computed by this dossier. Cost to buy levels 1..20 / to reach 30:

| Idx | Atom | Lv 1 | to Lv 20 | to Lv 30 | Per level (max 20) |
|---|---|---|---|---|---|
| 0 | Hydrogen | 2 | 2.1e4 | 6.5e5 | 1 (days-scaled) |
| 1 | Helium | 10 | 1.1e20 | 1.1e30 | 1 (cost x10/level) |
| 2 | Lithium | 25 | 6.1e4 | 8.9e5 | 1 |
| 3 | Beryllium | 75 | 1.5e5 | 2.3e6 | 7 |
| 4 | Boron | 175 | 1.9e6 | 6.9e7 | 2 |
| 5 | Carbon | 500 | 1.9e6 | 3.3e7 | 2 |
| 6 | Nitrogen | 1,000 | 3.0e6 | 4.4e7 | 15 |
| 7 | Oxygen | 3,250 | 5.6e6 | 7.4e7 | 2 |
| 8 | Fluoride | 2,500 | 1.1e7 | 1.4e8 | 1 |
| 9 | Neon | 5,000 | 1.9e7 | 2.3e8 | 1 |
| 10 | Sodium | 12,000 | 2.4e11 | 3.7e14 | 5 |
| 11 | Magnesium | 30,000 | 1.1e10 | 1.9e12 | 1 |
| 12 | Aluminium | 200,000 | 1.3e10 | 8.6e11 | 1 |
| 13 | Silicon | 250,000 | 6.6e8 | 1.3e10 | 1 |
| 14 | Phosphorus | 400,000 | 7.8e9 | 4.7e11 | 1 |
| 15 | Sulfur | 1.5e6 | 6.7e10 | 5.8e12 | 1 |
| 16 | Chlorine | 1.0e7 | 3.4e12 | 7.6e14 | 2 |

## Min-max by stage

Only one community source was reachable (the gist, tier 4, through v1.21). Orders marked "computed" (conf M) are this dossier's cost-vs-effect ordering, not community consensus. Confidence is M overall, L where noted.

- **W1 early/mid/late:** The collider does not exist (needs Nullo, W3). Only action: do not feed Storage past 1.05B on anything you need, because conversion ignores the switch (wiki, conf H). Stockpiling for stamps is fine below it. [C13]
- **W2:** Same. Planning note: Hydrogen later halves-and-more stamp cap-raise cost, so batch cap raises behind a stamp-material plan rather than raising stamp caps one at a time (see Hydrogen). Source: computed from [C7].
- **W3 early/mid:** No collider yet. Aim for Nullo Salt (late W3) rather than over-ranking cheaper salts. Source: prior dossier [C39].
- **W3 late (collider Lv 1, 11 atoms):** Order: Hydrogen to 10-20 (total 21K to Lv 20, the cheapest big saving), then Helium only to the level where cost stays small (computed: cost 10^L, [C37]), then Lithium/Beryllium (cheap: 61K / 148K to Lv 20). The gist's order is "Hydrogen + Helium -> Boron -> Neon". Confidence M (tier 4, opinion). [C35][C36]
- **W4 early:** Boron (particle-paying for 100M+ bubbles; use the daily charges before leveling it, per gist), then Neon (damage and cheapens everything; self-sustaining, gist). Fluoride is situational: only while Cooking is active (gist), 10.7M to Lv 20. [C35][C24]
- **W4 mid/late:** Neon toward 20, then Carbon (wizard towers max level and damage) for Worship-heavy accounts, Nitrogen (+1 trimmed slot, +15% per level of the 3x trimmed boost) for Construction, Oxygen (Library). Order within these is computed from cost-to-20: Carbon 1.9M < Nitrogen 3.0M < Oxygen 5.6M < Fluoride 10.7M < Neon 18.8M. Source: [C36]; the stage assignment is a prior-dossier outline (tier 4, W4 per prior), confidence L.
- **W4 late / early W5:** Raise the cost cut stack first: collider building to 200 (-20%), Hot Pink palette, Atomic Stamp, Atom Split bubble (a stacked denominator, so each source has diminishing returns), then spend. Source: computed from [C3].
- **W5+ outline:** Max-level raises (Isotope_Discovery +10, Atomic_Potential, Event Shop +20) matter more than new atoms. Sodium reaches Lv 20 only at 2.4e11 particles (computed), so skip it until costs are cut. W6/W7 atoms (Mg..Cl) cost 1e10-1e12 to Lv 20 (computed); the multiplicative ones (Si, P, S) are "always relevant" per in-game text. [C1][C36]
- **Per class:** Only Carbon is class-specific (Wizard line damage bonus). Source: [C8].

## Open questions

1. No second community source or Reddit/Steam confirmation of the upgrade order; search quota was exhausted and Reddit blocked. Needs a later pass (tier 4 triangulation).
2. Does the collider ON/OFF switch have a save field? Not in the parsers; only the threshold (`accountOptions[133]`) is read.
3. Does `accountOptions[134]` count days since the last stamp max-level upgrade (Toolbox comment) or since login? Cross-check with game N.js.
4. Exact merit-shop item and its level cap for `tasks[2][4][6]` (7% per level); name not resolved here.
5. Which of the six unlock atoms maps to which index (the wiki order Mg, Al, Si, P, S, Cl matches the code unlock order, but Toolbox only counts them).
6. Compass `Atomic_Potential` value per level and cap (data x4 = 20 suggests +20 max).
7. Lithium, Beryllium, Sodium daily/trigger effects are not modelled by Toolbox, so ActiveOn cannot show their realised value (see catalogue item 32).
