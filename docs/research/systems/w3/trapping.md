# Dossier: Trapping (W3)

Game version 2.3.540, Toolbox pinned 6c37e3d, verified 2026-10-19. Format: SYSTEM-DOSSIER.md. Claim numbers [Cn] resolve in the Claims register at the end. Confidence H = read in vendored code/data, M = prior N.js reading or derived, L = community only.

## Trapping

- **What it is:** a World 3 skill. Each character places up to 7 (8 with Call Me Ash) timed traps at critter spots; collecting gives critters, Trapping EXP and sometimes shiny critters. Traps run in real time with no character occupied. [C1] [C5]
- **Unlocks:** Lord of the Hunt quest 1 (Trappers Folley, Frostbite Tundra), then buy/equip a trap set; equip level per set is 1/5/15/20/30/40/48/55/70/85/100. Placing is gated by the equipped set, not by the quest being done on that character. Each critter spot needs its map reached, unless the Trapper Drone (Construction) is built. [C33] [C2] [C35] [C31]
- **Scope:** per character: placed traps, equipped set, Trapping level, efficiency, EXP and shiny multiplier (snapshotted at placement), boost food, Shiny Snitch. Account-wide: critter stock, LotH progress, Pen Pals score, vials, bubbles, stamps, drone level, Eagle Eye (best Hunter). [C18] [C12] [C17]
- **Inputs -> outputs:** in: a trap slot and real time (timers pause on character-select). Out per trap: critters, Trapping EXP, a shiny roll. Critters feed crafts, vials, stamps, bubbles, trap tiers, quests. [C15] [C16] [C43]
- **Goals and Milestones:** see tables below (trap tiers, LotH, Pen Pals, efficiency per critter).
- **Feeds / fed by:** feeds Alchemy vials (Poison Tincture, Fur Refresher/Orange Malt via shiny items, Goosey Glug, Crab Juice...), stamps (critters as upgrade cost), trap crafts, critter pouches, LotH rewards. Fed by Construction (Trapper Drone), Alchemy bubbles, Stamps, Post Office, Arcade, Atom Collider, Prayers, Meritocracy, Menagerie (W7), Hunter talents. [C27] [C24] [C25] [C40] [C39] [C41] [C42]
- **Per-session actions:** collect every finished trap (or one Eagle Eye cast), re-place all free slots, re-place after any efficiency gain (snapshot), choose duration to match the expected return. Idle state: any free slot or any trap past its timer. [C21] [C18] [C43]
- **AFK Setup implications:** traps do not occupy the character, so characters stay on their best other activity; the trap choice is only about duration vs absence. [C48] [C49]

## Mechanics catalogue

Format: rule/formula; caps; unlock; costs; field.

### T1. Trap placement and slots
- Placeable traps = set ID (1..7) + 1 if Call Me Ash bubble level >= 1 (even unequipped); cap 8. Sets 8-11 keep ID 7. [C5] [C4]
- Unlock: equip a TRAP_BOX_SET with enough Trapping level; no set = zero traps. Costs: Cardboard bought at the Frostbite Towndra shop (quest 1 also gives one).
- Fields: `characters[].tools[4].rawName` (trap set); Toolbox `account.traps[charIndex][]` from raw `PldTraps_N` (`name, rawName, crittersQuantity, trapType (0-6 index), trapExp, timeLeft, trapData`); ActiveOn `characters[].afk.traps.placed[]{critter,endsAt}`, `slots.trapSet`, `slots.trappingStarted`. [C1] [C51]

### T2. Trap sets (tiers)
- 11 sets; equip levels, power, AGI and upgrade slots in [C2]; extras (money, AFK gain, damage) in [C3].
- Craft chain: each set consumes the previous plus critters/salts ([C36]).
- Fields: items `TrapBoxSet1..11`; Toolbox `parsers/items.ts` L323.

### T3. Trap durations and multipliers
- Table rows in [C6]; flag semantics in [C7]. Pair per-hour numbers: [C47] [C48] [C49].
- Field: `account.traps[i][].trapData` (matched on trapTime within `shared-data.json#traps[trapType]`).

### T4. Critter spots and efficiency gate
- 11 species, requirement table in [C9]; bonus critters only if efficiency >= requirement: [C13]. Shiny variants: [C11].
- Fields: `trappingInfo` data; efficiency computed from `efficiency.ts` `getTrappingEffParts` (key 'trapping').

### T5. Trapping efficiency
- Formula and all inputs in [C12]; stamp [C27]; bubbles [C25]; talents [C26]; Post Office [C40]; mastery [C29]; cards [C28].
- Caps: none found in Toolbox beyond individual sources. Field: Toolbox efficiency breakdown, not in ActiveOn Account State yet.

### T6. Critters per trap (base quantity)
- BaseQTY and quantity multiplier in [C14] and [C15]; drone [C31]; Goosey Glug max level 13 [C24]. Pinned Toolbox computes only the Eagle Eye collect rate, not BaseQTY. [C21]

### T7. Trapping EXP
- [C16]; flat EXP x1 on shiny-flag traps; EXP shares: Eagle Eye gives each placer max(40, min(EagleEyeEXP, 99))%. [C21] [C7]

### T8. Shiny critters
- Per-trap roll formula [C17]; bundle size [C20]; Snitch [C19]; Reflective Eyesight [C26]; vials [C24]; tasks and food [C38]; arcade [C39]; cards [C28]; Pen Pals [C30].
- Chance >= 100% is guaranteed, extra buys nothing.
- Field: Toolbox `getShinyChanceInfo(account, characters)` -> per-character multiplier and per-critter chance.

### T9. Eagle Eye and collect-all
- [C21], [C22], [C23], [C44]. Collect rate sources include compass 42, Magnesium atom, Dementia set, Babby Blue palette ([C42], [C41]). Toolbox `getTrapsBonuses` gives max/min/per-character rates.

### T10. Trapper Drone and Trap Box Vacuum
- [C31], [C32]. Fields: `account.towers` (Construction), `account.rift`.

### T11. Lord of the Hunt
- 11 quests, requirements/rewards [C33] [C34]; each of quests 2-11 adds +1 base critter. Field: `characters[].quests.Lord_of_the_Hunt1..11`, account quest aggregation.

### T12. Pen Pals minigame
- Score thresholds and effects [C30]. Field: `accountOptions[99]` (OptionsListAccount[99]).

### T13. Skill mastery and cards
- [C29], [C28].

### T14. Tasks, food, pouches
- [C38], [C37].

### T15. Equipment-adjacent bonuses
- [C42]; obol type "Trapping Power" from Toolbox powerTypes (ObolBronzeTrapping...). 

### W5+ extensions (one line each)
- Tuttle spot (W6, 10,000,000 efficiency, 0.001% shiny) [C9]; Menagerie shiny multiplier (W7) [C20]; Gaming palette 12 and compass 42 (W5/W6) [C42]; rift Skill/Construct Mastery [C29] [C31]. [C46]

### Missed mechanics (added after adversarial verification)

- **[M1] Wooden Traps duplicate rows.** Three Wooden rows share trapTime 432000 s: (qty 100), (qty 200, third col 0), (qty 0, third col 200). `trapsInfo[trapType].find(trapTime)` always returns the first, so a placed Wooden trap cannot be told apart by timer alone. ActiveOn must key on the trap row index if the raw save exposes it, else treat Wooden 120 h as ambiguous. Source: vendor/data/website-data/shared-data.json#traps[2]; parsers/world-3/traps.ts L26-46. Tier 1, verified 2026-10-19. Confidence: H.
- **[M2] Dementia set depends on the trap slot.** DEMENTIA_SET lists TrapBoxSet4 (Natural Traps) among its tools with requiredTools 2 and requiredWeapon 1, bonusValue 50 (+% Critters and Souls). The equipped trap can therefore count toward the set; swapping to a higher trap set may drop the bonus. Source: shared-data.json#equipmentSets (DEMENTIA_SET); parsers/generated-types.ts L728-729. Tier 1, verified 2026-10-19. Confidence: M (set-matching code itself is game-client, not in the parser).
- **[M3] Account-wide trap-count task.** "Collect a total of N traps" (Come 'ere Critters, tasks[2][5]) adds +2% shiny per completion; it feeds the placement shiny multiplier (C17). Source: vendor/data/website-data/tasks.json#2/5. Tier 1, verified 2026-10-19. Confidence: H.
- **[M4] Critter pouch ladder beyond Massive.** Volumetric Critta (MaxCapBagTr7): 100,000 Blobfish + 800 Nullo Salt; Colossal (Tr8): 900,000 Blobfish + 5,000 Dioxide Synthesis; Gargantuan (Tr9): 1,500,000 Honker + 300,000 Explosive Salts; Herculean (Tr10): 5,555,555 Owlio; Enormous (Tr11): 1,500,000 Tuttle + 10,000 Purple Salt. Small and Sizable also cost Redox Salts (3 and 15). Source: vendor/data/website-data/crafts.json (MaxCapBagTr7..11). Tier 1, verified 2026-10-19. Confidence: H.
- **[M5] Critter Numnums consumption.** Boost food FoodTrapping1 (effect TrappingSpeedBoosts) is an on-open shiny bonus read from the opening character's food slot; consumption chance is a game-client rule and not in the parser. Source: parsers/world-3/traps.ts L178-257; tasks/items data. Tier 1 (bonus) / unverified (consume chance). Verified 2026-10-19. Confidence: M.
- **[M6] Pen Pals usage.** Only idx 0, 1, 2, 3, 5, 6 are read by the parser (EXP, eff, shiny, EXP, shiny, eff). Idx 4/7 base critter and 8 skill AFK are from list order only. Source: parsers/character.ts L914-927, L3360, L3628-3637; efficiency.ts L597; traps.ts L196. Tier 1, verified 2026-10-19. Confidence: H (used idx) / L (idx 4, 7, 8).
- **[M7] Skill AFK interactions.** Bunny card = +1 Skill AFK gain; Owlio card = monster EXP (not trapping); Containment and Prehistoric sets give +% all AFK gain (C3). Source: cards.json#CritterCard5,#CritterCard7; items.json#TrapBoxSet10..11. Tier 1, verified 2026-10-19. Confidence: H.
- **[M8] Trapper Drone remote use and Babby Blue.** Drone allows deploy/collect at any discovered critter location; Babby Blue palette (gamingPalette[12]) boosts drone critters only; collect-all is Hunter Eagle Eye (C21). Source: shared-data.json#gamingPalette[12],#towers.Trapper_Drone. Tier 1 (palette, tower) / Tier 2 wiki (remote deploy). Verified 2026-10-19. Confidence: M.
- **[M9] W5-W6 critters feed W3 gear.** Voodofish (Blobfish shiny) and Tottoise (Tuttle shiny) gate trap crafts 55-100 and pouches Tr7..Tr11; Tuttle (W6) feeds Enormous pouch. Source: crafts.json (C36, M4). Tier 1, verified 2026-10-19. Confidence: H.
- **[M10] Items not yet researched, flagged for follow-up.** Trap placement location rules (one trap per critter map node), upgrade stones on the trap sets (Upgrade_Slots_Left 1..7 in C2), the Pen Pals minigame play loop itself, and critter-shop items/cards beyond shiny chance were listed by the verifiers; the pinned Toolbox has no data for placement nodes or minigame play, so they stay unresolved. Confidence: L.

## Min-max by stage

All lines below are derived from tier-1 data unless marked; no community priority list could be retrieved this run. [C50]

| Stage | Priority order | Basis | Conf |
|---|---|---|---|
| W1 early | Nothing placeable; Trapping starts in W3. Bank Froge/Mousey/Owlio, Poison Froge for later crafts. Hidey Box/Spikemouth stamps cost critters; collect when found. | stamps [C27] | M |
| W2 mid/late | Same: critters from W2 spots (Crabbo, Scorpie, Dung Beat) are only reachable once a set is equipped, plan the trip. | [C9] | M |
| W3 early | 1) Do LotH quest 1 (Cardboard + candy). 2) Equip Cardboard on every character (1 slot). 3) Level Call Me Ash to 1 (+1 trap on all). 4) At Trapping 5 craft Silkskin (1 Poison Froge + 5 Redox). 5) Use 20 min to 1 h traps while active, 8 h or 20 h overnight. | [C33] [C5] [C36] [C47] | H data / M order |
| W3 mid | Wooden at 15, Natural at 20 for overnight EXP (5.0 EXP x per hour at 8 h). Push LotH 3-7 (+1 base critter each). Brew Poison Tincture, Fur Refresher, Orange Malt, Goosey Glug (needs Honker). Put Hunter Eagle Eye in a talent preset. | [C48] [C14] [C24] [C21] | M |
| W3 late | Steel at 30 (6 Eternal Lord). Build Trapper Drone (15 levels). Take LotH 8-11. Raise efficiency past each critter's requirement (bonus floor(100*(eff/10req)^0.25)). Shiny Snitch only for the run where bundle beats the divider. | [C31] [C13] [C19] | M |
| W4 | Meaty at 40 (10 Jade Scarab), Royal at 48 (100,000 Blobfish from Cocoa Tunnel). Royal 20 min / 1 h for shiny farming (12.0x/h), Wooden 120 h or Meaty 200 h for critter volume. Stack Reflective Eyesight levels (re-applies every 10 Trapping levels) and Cuz I Catch Em All. | [C47] [C49] [C26] [C25] | M |
| Per class | Hunter: Eagle Eye, Invasive Species, Reflective Eyesight. Archers get the class multiplier on Cuz I Catch Em All. Everyone else traps with own slots plus Hunter Eagle Eye collect. | [C26] [C17] | H data |

## Common mistakes and detection

- No trap set equipped: `characters[i].trapSet === null` and no placed traps. [C51]
- Free slots: placed count < set ID + (Call Me Ash >= 1). [C5]
- Finished traps sitting idle: `afk.traps.placed[].endsAt < now`.
- Using shiny-flag traps (Silkskin, Steel, Royal) for EXP: EXP is x1. [C7]
- Not re-placing after efficiency gain or talent/bubble swap: values are snapshotted. [C18]
- Leaving Shiny Snitch on for normal runs: divides shiny chance. [C19]
- Skipping Call Me Ash (+1 trap everywhere), LotH quests (+1 base critter each) and the drone. [C5] [C14]
- Closing on character-select: timers pause (wiki only, L). [C43]

## Save and Toolbox fields

- `account.traps[charIndex][]` (see T1); `characters[].tools[4]`; `characters[].skillsInfo.trapping.level`; `account.accountOptions[99]` (Pen Pals), `[363]` (Magnesium days); `account.alchemy.vials`, `account.stamps.skills`, `account.arcade.shop`, `account.towers`, `account.rift`, `account.voteBallot`, `account.tasks[1][2][5]` ('Come ere Critters!').
- Toolbox functions: `getTraps`, `getTrapsBonuses`, `getShinyChanceInfo`, `calcTotalCritters` (`parsers/world-3/traps.ts`), `getTrappingStuff('TrapMGbonus', i)` (`parsers/character.ts` L3628), trapping efficiency (`parsers/efficiency.ts` L553), trapping EXP (`parsers/character.ts` L914).
- ActiveOn today: [C51]

## Sprites needed (for the build team)

Add: 5 Critta pouch icons (Tr7..Tr11), Wooden-row marker. Existing: `sys-trapping`, `item-critter`. New candidates: 11 trap-set icons (or one per tier tinted), 11 critter + 11 shiny critter icons (22), Eagle Eye, Trapper Drone, Pen Pals, Lord of the Hunt. Grid files: `apps/activeon/src/art/sprites/grids/items.ts`, `systems.ts`.

## Open questions

- Exact rift level boundary for Trap Box Vacuum (riftInfo[5]) versus `currentRift` semantics.
- Eagle Eye talent max level and whether EXP cap 99 matters in practice (the cap applies only to the EXP rate, not the critter rate).
- Efficiency-bonus formula cap (N.js EfficiencyBonusQTY) not re-verified on 2.3.540.
- BaseQTY and critter-pouch effects are not in pinned Toolbox; need N.js check on 2.3.540.
- Community meta (Reddit, Academy, Steam) could not be fetched; needs a follow-up.


## Claims register

- **[C1]** Placed traps parse from raw PldTraps_N rows [critterId, _, timeElapsed, critterName, qty, trapTypeIndex, trapTime, trapExp]; rows with critterId -1 or no critterName are skipped; timeLeft = trapTime - timeElapsed.
  Source: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/traps.ts#L26-L46 (vendored packages/toolbox-parsers/vendor/parsers/world-3/traps.ts). Tier 1. Verified 2026-10-19. Confidence: H.
- **[C2]** Eleven trap sets exist, TrapBoxSet1..11 (Cardboard 1, Silkskin 5, Wooden 15, Natural 20, Steel 30, Meaty 40, Royal 48, Egalitarian 55, Forbidden 70, Containment of the Zrgyios 85, Prehistoric 100 = lvReqToEquip), with Weapon_Power 4/8/13/20/26/34/45/55/67/80/110, AGI 2/4/7/10/12/15/20/38/56/80/100 and Upgrade_Slots_Left 1/1/2/2/3/3/4/4/5/6/7.
  Source: packages/toolbox-parsers/vendor/data/website-data/items.json#TrapBoxSet1..TrapBoxSet11. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C3]** Forbidden has +15% money; Containment has +4% all AFK gain and +10% drop rate; Prehistoric has +6% all AFK gain and +5% damage (UQ1/UQ2 on the items).
  Source: packages/toolbox-parsers/vendor/data/website-data/items.json#TrapBoxSet9..11. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C4]** Items.json ID (the trap-set item ID, used by the game for placeable-trap count per prior N.js reading) is 1..7 for Cardboard..Royal and stays 7 for Egalitarian, Forbidden, Zrgyios, Prehistoric, so higher sets add no slots, only tier/stats.
  Source: packages/toolbox-parsers/vendor/data/website-data/items.json (ID field); prior research w3-systems (N.js) for NumOfTrapsPlaceable. Tier 1. Verified 2026-10-19. Verifier note (both lenses): the ID field values are confirmed; the game using it as the placeable count is N.js only, unverifiable in the pinned code (so M). Confidence: M.
- **[C5]** Placeable traps = the equipped set's ID (1..7) plus 1 if Call Me Ash bubble has at least 1 level, even if unequipped (CauldronInfo[1][11] > 0.5); bubble text 'Placeable Trap ALWAYS'. Max 8.
  Source: origin/research/w3-systems:docs/research/systems/w3-systems/worship-trapping-death-note.md (N.js v1.23 reading @7763861-7773279, verified 2026-10-17; NOT re-checked against pinned 2.3.540); packages/toolbox-parsers/vendor/data/website-data/cauldrons.json quicc[11] desc. Tier 1. Verified 2026-10-19. Verifier note: placeable-count logic is N.js, not in the pinned parser; cauldrons.json confirms the Call Me Ash desc "+1 Placeable Trap ALWAYS". Confidence: M.
- **[C6]** traps table (trapsInfo) rows are {trapTime seconds, quantity, exp, trapType flag}. Cardboard 20min/1h/8h/20h qty 1/2/10/20 exp 1/2/8/15; Silkskin 20min/1h/8h/20h/40h qty 1/2/10/20/35, third col 2/4/16/30/50; Wooden 3h/60h/120h/120h/120h qty 5/50/100/200/0, third col 5/40/80/0/200; Natural 8h/20h/43.9h/143.9h qty 0, third col 40/75/120/350; Steel 3h/60h/120h/20h qty 5/50/100/1, third col 10/80/160/60; Meaty 1h/10h/30h/200h qty 3/15/40/220, third col 3/12/30/200; Royal 20min/1h/10h/40h/160h/672h qty 2/4/21/70/250/550, third col 4/8/38/125/375/1150.
  Source: packages/toolbox-parsers/vendor/data/website-data/shared-data.json#traps. Tier 1. Verified 2026-10-19. Verifier note: all rows confirmed. Wooden has three rows with the same 432000 s trapTime (qty 100 / qty 200 with third col 0 / qty 0 with third col 200); the parser finds by trapTime and always returns the first, so ActiveOn cannot tell them apart from trapTime alone (see M1). Natural 158000 s = 43.9 h, 518000 s = 143.9 h; Royal 2419000 s = 671.9 h. Confidence: H.
- **[C7]** When trapType flag = 1 (Silkskin, Steel, Royal) the third column is a shiny-chance multiplier and EXP is x1; when flag = 0 it is the EXP multiplier. Toolbox names the third column 'exp' and the flag 'trapType', which is misleading.
  Source: origin/research/w3-systems:docs/research/systems/w3-systems/worship-trapping-death-note.md (N.js v1.23 reading @7763861-7773279, verified 2026-10-17; NOT re-checked against pinned 2.3.540) (N.js TrapEXPBonus/TrapRareBonus); data flags: shared-data.json#traps. Tier 1. Verified 2026-10-19. Verifier note: the 0/1 data flag per row is confirmed (1 = Silkskin, Steel, Royal); the shiny-vs-EXP semantics are N.js only (M). Confidence: M.
- **[C8]** Wiki trap list agrees with the data for the first rows: Silkskin x2 shiny at 20 min, Steel x10 shiny at 3 h, Royal x4 shiny at 20 min, Wooden 5x qty/EXP over 3 h.
  Source: https://idleon.wiki/wiki/Trapping (fetched 2026-10-19, no revision date shown; KB cites rev 2026-10-07). Tier 2. Verified 2026-10-19. Confidence: L.
- **[C9]** Eleven critter species with spot map, efficiency requirement, EXP and base shiny %: Froge (Jungle Perimeter) 35/2/5; Crabbo (Salty Shores) 400/8/3; Scorpie (The Ring) 1500/25/2; Mousey (Rats Nest) 3500/50/1; Owlio (Hollowed Trunk) 8000/80/0.6; Pingy (The Stache Split) 15000/125/0.3; Bunny (Thermonuclear Climb) 45000/160/0.15; Dung Beat (Efaunt's Tomb) 100000/200/0.06; Honker (Wam Wonderland) 200000/260/0.02; Blobfish (Cocoa Tunnel, W4) 500000/350/0.003; Tuttle (Bamboo Laboredge, W6) 10000000/900/0.001.
  Source: packages/toolbox-parsers/vendor/data/website-data/shared-data.json#trappingInfo; map names via #mapNames[mapId]. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C10]** Wiki lists Tuttle shiny chance as 0.0001% while Toolbox data says 0.001; data wins (ADR 0004).
  Source: origin/research/w3-systems:docs/research/systems/w3-systems/worship-trapping-death-note.md (N.js v1.23 reading @7763861-7773279, verified 2026-10-17; NOT re-checked against pinned 2.3.540) (wiki cross-check); data shared-data.json#trappingInfo[10]. Tier 1. Verified 2026-10-19. Confidence: M.
- **[C11]** Each critter has a shiny variant (rawName + 'A'): Poison Froge, Mutant Crabbo, Crescent Scorpie, Nakeo Moleo, Minervowl, Eternal Lord of the Undying Ember, Purbunni, Jade Scarab, Diamond Duck, Voodofish, Tottoise.
  Source: packages/toolbox-parsers/vendor/data/website-data/items.json#Critter1A..Critter11A. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C12]** Trapping efficiency = (10 + base) * ..., base = (trap-set power lines incl. Sanic Tools bubble, flat 4, statue 15, Slabo Critterbug, Endgame Eff II) + (agility+1)^0.6 * (1+Skill Ambidexterity/100) + TrappingEff stamp + all-skill base, times (1 + level/100) times Right Hand of Action times all-efficiency; then times (Call Me Ash bubble + 10*mastery tier 1) additive group, times Invasive Species multiplier, times (1 + sum of Elusive Efficiency talent, trapping card, Trap_Efficiency star sign, Post Office Trapping_Lockbox[0], Pen Pals idx 1 and 6)/100.
  Source: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/efficiency.ts#L553-L601. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C13]** Efficiency above a critter's requirement raises critters: effBonus = floor(100*(eff/(10*req))^0.25) percent when eff >= req, else 0 (N.js EfficiencyBonusQTY).
  Source: origin/research/w3-systems:docs/research/systems/w3-systems/worship-trapping-death-note.md (N.js v1.23 reading @7763861-7773279, verified 2026-10-17; NOT re-checked against pinned 2.3.540). Tier 1. Verified 2026-10-19. Unverifiable: N.js is not in the vendored files (L). Confidence: L.
- **[C14]** Base critters per trap = floor(10 + Trapper Drone level + number of Lord of the Hunt quests 2..11 completed + Goosey Glug vial (+1/level, max 13) + Critter Culture compass (idx 42) + star sign Trapezoidburg (+2) + Pen Pals (+1 at score 125, +1 at 200) + ...). Pinned Toolbox does not compute this; carried from the game-client reading.
  Source: origin/research/w3-systems:docs/research/systems/w3-systems/worship-trapping-death-note.md (N.js v1.23 reading @7763861-7773279, verified 2026-10-17; NOT re-checked against pinned 2.3.540) (N.js TrappingStuffs BaseQTY); vials.json#40; compass.json#42; shared-data.json#starSigns[44]. Tier 1. Verified 2026-10-19. **Disputed (partly):** the Trapper Drone desc reads "+{% Extra critters from all traps" and bonusInc 1.95 is a cost growth, so "Trapper Drone level" as a +1 base-critter term is not confirmed by data. Confirmed: vial 40 GOOSEY_GLUG (+1 base critter/level, needs Honker) and compass 42 Critter_Culture. The parser does not compute BaseQTY. Treat the full sum as L. Confidence: L.
- **[C15]** Critters per trap = floor(Meal * Species Epoch * Arcade 23 * Upgrade Vault 50 * BaseQTY * (1+effBonus/100) * trap quantity multiplier), plus Post Office Trapping_Lockbox[2] 'Critters Trapped', Dementia set, Magnesium atom days.
  Source: origin/research/w3-systems:docs/research/systems/w3-systems/worship-trapping-death-note.md (N.js v1.23 reading @7763861-7773279, verified 2026-10-17; NOT re-checked against pinned 2.3.540); packages/toolbox-parsers/vendor/data/website-data/shared-data.json#arcadeShop[23],#upgradeVault[50],#postOffice[16]. Tier 1. Verified 2026-10-19. Verifier note: arcadeShop[23] "x Trapping Critters", upgradeVault[50] (max 300), postOffice[16] and Dementia 50 are confirmed; the product itself is N.js only. Confidence: M.
- **[C16]** Trapping EXP per trap = BaseQTY * trap EXP mult * critter EXP * TrappingEXPmulti; the multiplier = AllSkillExpMulti * (1 + (Shroom Bait + Focused Soul + Happy Dude talents, stamps, trapping card, post office Trapping_Lockbox[1], Pen Pals idx 0 and 3, arcade Trapping_EXP, 25*mastery tier 0, vote 30, all-skill exp, Left Hand of Learning)/100), floored at 0.1.
  Source: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/character.ts#L914-L965; prior research w3-systems (N.js) for per-trap formula. Tier 1. Verified 2026-10-19. Verifier note: the multiplier lines match; the per-trap formula is N.js and unverifiable. Confidence: H.
- **[C17]** Shiny chance per trap, rolled once per trap: placement multiplier = (1 + (ShinyChance stamps + 2*'Come ere Critters!' completions)/100) * max(1,Cuz I Catch Em All bubble, Archer class multiplied) * (1 + (Fur Refresher + Orange Malt vials)/100) * Reflective Eyesight^(1+floor(TrappingLevel/10)); chance = max(0.001, base% * placement) * (1 + (boost food + Shiny Critter cards + Pen Pals idx 2 and 5 + arcade Shiny_Chance)/100) / Shiny Snitch divider. >=100 means guaranteed.
  Source: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/traps.ts#L178-L257. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C18]** Efficiency, EXP and the placement part of shiny chance are snapshotted when a trap is placed; later efficiency loss (talent reset, unequip) does not change an already placed trap. Cards, food, Pen Pals, arcade on-open bonuses apply when the trap is opened.
  Source: https://idleon.wiki/wiki/Trapping (fetched 2026-10-19, no revision date shown; KB cites rev 2026-10-07) (Tips); https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/traps.ts#L174-L179. Tier 2. Verified 2026-10-19. Verifier note: only the traps.ts comment that the placed value is a placement snapshot is confirmed; efficiency/EXP snapshot semantics unverifiable here (L). Confidence: L.
- **[C19]** Shiny Snitch prayer (prayer idx 3, max level 50, unlock Goblin Gorefest wave 81, x1=20, x2=15) makes shinies drop in bundles and divides shiny chance by (1+curse), rounded; it is the only way to raise shiny quantity per trap per the wiki.
  Source: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/traps.ts#L200-L218; packages/toolbox-parsers/vendor/data/website-data/shared-data.json#prayers[3]. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C20]** Shiny bundle size = round((1+Snitch bonus) * (1+Meritocracy[4]/100) * (1+Menagerie boost 13/100)); Meritocracy[4] text 'Multiplies how many Shiny Critters you get from Trapping by }x' (value 400 pre-mult), Menagerie 13 'All Shiny Critters are worth }x more' (W7).
  Source: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/traps.ts#L202-L218; packages/toolbox-parsers/vendor/data/website-data/shared-data.json#ninjaExtraInfo[41]; research.json[57][13]. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C21]** Eagle Eye (Hunter talent id 310, bigBase): collects and re-places every character's traps; critters % = 50 + 0.25*level, EXP % = 40 + 0.2*level (EXP capped at 99 in Toolbox); cooldown 6 s. Collect rate = max(50 floor, Eagle Eye + Poison Tincture vial + Critter Culture compass + Magnesium atom*days + Dementia set + Babby Blue palette) over 100; EXP floor 40.
  Source: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/traps.ts#L63-L160; packages/toolbox-parsers/vendor/data/website-data/talents.json#Hunter/EAGLE_EYE. Tier 1. Verified 2026-10-19. Caveat (gamedata lens): additive sources (vial, compass 42, Magnesium, Dementia, palette 12) apply to the CRITTER rate only. The EXP rate is max(40, min(Eagle Eye EXP, 99)) with no account-wide additions. The critter rate has no cap other than a 2e9 clamp. Confidence: H.
- **[C22]** A non-Hunter account still collects at the floors (50% critters, 40% EXP) and Eagle Eye uses the best Hunter's level; talent never drops below its level-0 value.
  Source: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/traps.ts#L136-L160. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C23]** Poison Tincture vial (id 28, stat TrapOvision, add x1=3, needs Poison Froge) gives +3% per level to Eagle Eye critters; max vial level 13.
  Source: packages/toolbox-parsers/vendor/data/website-data/vials.json#28; parsers/world-2/alchemy.ts#L52 (MAX_VIAL_LEVEL=13). Tier 1. Verified 2026-10-19. Confidence: H.
- **[C24]** Shiny vials: Fur Refresher (id 21, Shiny1, +2/level) and Orange Malt (id 33, Shiny2, +5/level), both additive multipliers (+1% = 1.01x); Goosey Glug (id 40, CritterBASED, +1 base critter/level, needs Honker).
  Source: packages/toolbox-parsers/vendor/data/website-data/vials.json#21,#33,#40. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C25]** Bubbles: Call Me Ash (quicc idx 11, bigBase 25+2/level % trapping efficiency when equipped, +1 placeable trap always); Cuz I Catch Em All (quicc 12, decayMulti x1=3 x2=100, shiny multiplier, Archers get class multi); Sanic Tools (quicc 6, decay 65/70, trap power %); Slabo Critterbug (quicc 21, decay 3/60, power per 100 slab items); Endgame Eff II (quicc 27).
  Source: packages/toolbox-parsers/vendor/data/website-data/cauldrons.json#quicc. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C26]** Talents: Reflective Eyesight (Hunter 313, decayMulti 2/100: x(1+2L/(L+100)) shiny, applied again every 10 trapping levels); Invasive Species (311, decay 30/80: eff % per power of 10 Froge in storage, Helium atom boosts); Shroom Bait (312, +1 EXP %/level, not shared via Eagle Eye); Species Epoch (Voidwalker 57, decay 10/200: % critters and souls per combined Trapping+Worship level above 100); Elusive Efficiency (263, +1/level eff, all specialized skills); Focused Soul (265, +1 EXP/level); Skill Ambidexterity (367, AGI weight).
  Source: packages/toolbox-parsers/vendor/data/website-data/talents.json; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/worship.ts#L114-L125. Tier 1. Verified 2026-10-19. Caveat: Species Epoch only counts characters with classIndex < 6 (beginner line, worship.ts L121) and uses the best single character's Trapping+Worship level above 100. Invasive Species power-of-10 count includes Froge in Storage (lavaLog) plus the Helium atom (Talent Power Stacker). Confidence: H.
- **[C27]** Trapping stamps (skills tree): Hidey Box idx 24 (+2 base trapping eff/level, Crabbo), Purp Froge 25 (+1 shiny %/level, Scorpie), Spikemouth 26 (+1 Trapping EXP %, Mousey), Shiny Crab 27 (+2 shiny %, Owlio); combat stamp Avast Yar (Bunny).
  Source: packages/toolbox-parsers/vendor/data/website-data/stamps.json#skills[24..27]. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C28]** Critter cards: Froge +3 shiny, Crabbo +5 eff, Scorpie +5 EXP, Mousey +5 shiny, Owlio +1.25 monster EXP, Pingy +6 shiny, Bunny +1 skill AFK, Dung Beat +7 eff, Honker +8 EXP, Blobfish +8 shiny, Tuttle +15 shiny (base values per star tier). From Skill Mastery tier 2 all owned cards count.
  Source: packages/toolbox-parsers/vendor/data/website-data/cards.json#CritterCard1..11; parsers/misc.ts#L846-L851. Tier 1. Verified 2026-10-19. Note: Owlio (monster EXP) and Bunny (+1 Skill AFK) are not trapping stats. Confidence: H.
- **[C29]** Trapping Skill Mastery (rift >= 15, skill rank): rank>0 gives +25% Trapping EXP; rank>1 gives +10% efficiency; rank>2 counts all owned cards (isMasteryBonusUnlocked bonusIndex 0/1/2).
  Source: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/misc.ts#L842-L851; parsers/efficiency.ts#L587; parsers/character.ts#L923. Tier 1. Verified 2026-10-19. Detail: isMasteryBonusUnlocked needs currentRift >= 15 and rank > index; rank 1 needs skill level >= 150 (rank 0 below 150, 1 at 150, 2 at 200, 3 at 300, then 400/500/750/1000). Mastery tier 2 uses all owned cards via getSkillCardBonus. Confidence: H.
- **[C30]** Pen Pals minigame high score (OptionsListAccount[99]) unlocks 9 cumulative tiers at 25 steps: +5% EXP, +5% eff, +15% shiny, +5% EXP, +1 base critter, +15% shiny, +5% eff, +1 base critter, +1% skill AFK (randomList[59]=5,5,15,5,1,15,5,1,1); wiki lists tiers at 25..225.
  Source: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/character.ts#L3628-L3637; packages/toolbox-parsers/vendor/data/website-data/randomList.json[59]; https://idleon.wiki/wiki/Trapping (fetched 2026-10-19, no revision date shown; KB cites rev 2026-10-07). Tier 1. Verified 2026-10-19. Caveat: tier order depends on randomList[59]; usage in code confirms EXP at idx 0 and 3, efficiency at 1 and 6, shiny at 2 and 5. Idx 4, 7, 8 (base critter, base critter, skill AFK) are NOT used by the parser (their meaning is carried from the list order only). Confidence: H.
- **[C31]** Trapper Drone (Construction building idx 6, max 15 levels, costs Spontaneity Salts 30 base, bonusInc 1.95, costInc 10/1) remotely places and collects traps at any discovered spot and adds +critters per level; Construct Mastery (rift 40) adds +35 levels when total building levels reach its threshold. Wiki: +10% critters per level shown, total +35% and 38.3K salts cost for max.
  Source: packages/toolbox-parsers/vendor/data/website-data/shared-data.json#towers.Trapper_Drone; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/construction.ts#L455-L506; https://idleon.wiki/wiki/Trapper_Drone. Tier 1. Verified 2026-10-19. Caveat: Construct Mastery adds +35 Drone levels only when total construction levels >= 500 and rift >= 40 (the 500 gate was omitted above). The 38.3K Spontaneity Salts max-cost total is a wiki figure and unverifiable here (L). Confidence: H.
- **[C32]** Rift bonus 'Trap Box Vacuum' (riftInfo[5], boss Bloque): the Trapper Drone collects traps automatically every 24 h and deposits critters into Storage if space; EXP goes to the placer.
  Source: packages/toolbox-parsers/vendor/data/website-data/shared-data.json#riftInfo[5]. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C33]** Lord of the Hunt (Frostbite Tundra, Trappers Folley) has 11 quests: 1 needs 10 Shrapshell, 12 Snake Skin, 1 Cardboard Traps (buy at town shop), gives Cardboard Traps + 2x 12h Time Candy; 2 Froge x100 + 1 Poison Froge; 3 Crabbo x250 + 1 Mutant; 4 Scorpie x500 + 2 Crescent; 5 Mousey x1000 + 2 Nakeo; 6 Owlio x1500 + 3 Minervowl; 7 Pingy x2500 + 4 Eternal Lord; 8 Bunny x4000 + 6 Purbunni; 9 Dung Beat x8000 + 10 Jade Scarab; 10 Honker x65000 + 1 Diamond Duck; 11 Crescent Scorpie x500 + Eternal Lord x250 + Diamond Duck x100 (Critter Baron).
  Source: packages/toolbox-parsers/vendor/data/website-data/quests.json#Lord_of_the_Hunt; https://idleon.wiki/wiki/Lord_of_the_Hunt. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C34]** LotH rewards: Medium XP balloons x5 (2), Large balloons x2 (4), 10 gems (5, 7), Star Talent Reset (8), 4 Talent Point Reset (9), Post Office Box Reseto Magnifico + 24h Time Candy (10), Critter Baron (11). Quests 2-11 each add +1 base critter per prior N.js reading.
  Source: packages/toolbox-parsers/vendor/data/website-data/quests.json#Lord_of_the_Hunt; prior research w3-systems (N.js). Tier 1. Verified 2026-10-19. Verifier note: rewards confirmed (quest 2 balloons, 4 large balloons, 5 and 7 gems, 8 Star Talent Reset, 9 four Talent Resets, 10 Post Office Reseto + 24h candy, 11 Critter Baron trophy). The +1 base critter per quest is N.js only (L). Confidence: M.
- **[C35]** Tracking Trapping start: quests.Lord_of_the_Hunt1 === 1 on the character; the first quest is not a per-character gate for placing (trap set is the gate).
  Source: packages/account-state/src/slots.ts#L190; packages/knowledge/systems/trapping.yaml (V2 note). Tier 1. Verified 2026-10-19. The "not a per-character gate" part is unverifiable. Confidence: M.
- **[C36]** Trap crafts: Silkskin = 1 Poison Froge + 5 Redox Salts; Wooden = 2 Mutant Crabbo + 20 Redox Salts; Natural = 5 Nakeo Moleo + 50 Redox Salts + Wooden Traps; Steel = 6 Eternal Lord + Natural Traps; Meaty = 10 Jade Scarab + Steel; Royal = 100,000 Blobfish + Meaty; Egalitarian = Royal + 100 Voodofish + 10,000 Nullo Salt; Forbidden = Egalitarian + 1,000 Minervowl + 250,000 Explosive Salts; Zrgyios = Forbidden + 25,000 Mutant Crabbo + 50,000 Godshard Bar; Prehistoric = Zrgyios + 1,000 Voodofish + 10,000 Purple Salt. Each tier consumes the previous set.
  Source: packages/toolbox-parsers/vendor/data/website-data/crafts.json. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C37]** Critter pouches (carry bags) are crafted from critters: Small 200 Froge + 3 Redox, Sizable 1,000 Crabbo + 15 Redox, Big 15,000 Mousey, Large 30,000 Pingy, Massive 100,000 Honker + 1,000 Dioxide Synthesis; Big/Large/Massive unlock via task rewards; larger Critta pouches in M4.
  Source: packages/toolbox-parsers/vendor/data/website-data/crafts.json; taskUnlocks.json. Tier 1. Verified 2026-10-19. Incomplete: pouches Tr7..Tr11 exist, see M4. Confidence: H.
- **[C38]** Task 'Come ere Critters!' (tasks idx 2/5): collect a total of N traps, +2% shiny chance per completion; Critter Collector A-D tasks reward for Froge/Scorpie/Mousey/Pingy; Critter Numnums food (FoodTrapping1, effect TrappingSpeedBoosts) raises shiny odds when opening a trap.
  Source: packages/toolbox-parsers/vendor/data/website-data/tasks.json#2/5,#2/8-11; taskUnlocks.json#2/3. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C39]** Arcade shop: idx 13 +Shiny Chance (decay 100/100), idx 14 +Trapping EXP (decay 50/100), idx 23 x Trapping Critters (decay 30/100).
  Source: packages/toolbox-parsers/vendor/data/website-data/shared-data.json#arcadeShop[13,14,23]. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C40]** Post Office Trapping_Lockbox (box 16, max 400): Trapping Efficiency (decay 50/200), Trapping EXP (50/200), Critters Trapped (45/200); extra tiers at levels 24.9, 99.9, 400.1.
  Source: packages/toolbox-parsers/vendor/data/website-data/shared-data.json#postOffice[16]. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C41]** Magnesium atom: critters from traps +x% per day since the last trap placement, capped at 60 days, reset when a new trap is placed (read from accountOptions[363]).
  Source: packages/toolbox-parsers/vendor/data/website-data/shared-data.json#atomsInfo[11]; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/traps.ts#L131. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C42]** Other critter/shiny multipliers: Dementia set (+50% critters and souls), Babby Blue palette (idx 12, Trapper Drone critters), Upgrade Vault 50 (Critters 'n Souls, max 300), Vote 30 (+Trapping and Worship EXP), Star sign Trapezoidburg (+2 critters/trap, +10% trap eff).
  Source: packages/toolbox-parsers/vendor/data/website-data/shared-data.json#equipmentSets[6],#gamingPalette[12],#upgradeVault[50],#starSigns[44]; ninjaExtraInfo[38]. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C43]** Toolbox treats missingTraps and trapsOverdue as dashboard alerts and caps placeable traps at 8; trap timers do not advance on the character-select screen (wiki).
  Source: packages/knowledge/systems/trapping.yaml (cites utility/dashboard/characters.js); https://idleon.wiki/wiki/Trapping (fetched 2026-10-19, no revision date shown; KB cites rev 2026-10-07). Tier 2. Verified 2026-10-19. Trap-timer pausing is wiki only (L). Confidence: M.
- **[C44]** Wiki: Eagle Eye 'Collect & set all traps, but only get {50 + 0.25 per level}% critters', mana 2, cooldown 6 s, EXP given to each player.
  Source: https://idleon.wiki/wiki/Hunter (fetched 2026-10-19). Tier 2. Verified 2026-10-19. Confidence: L.
- **[C45]** Wiki tip: low movement speed helps place traps closer together in cramped spots.
  Source: https://idleon.wiki/wiki/Trapping (fetched 2026-10-19, no revision date shown; KB cites rev 2026-10-07). Tier 2. Verified 2026-10-19. Confidence: L.
- **[C46]** W5+ extensions: Tuttle spot (Bamboo Laboredge, W6), Menagerie shiny multiplier (W7), Gaming palette and Compass bonuses (W5/W6), Skill Mastery and Construct Mastery rift bonuses, trap crafts 55-100 that need Voodofish (the Blobfish shiny).
  Source: packages/toolbox-parsers/vendor/data/website-data/shared-data.json (see claims above). Tier 1. Verified 2026-10-19. Wording fix: Voodofish is the Blobfish shiny and is needed for craft sets 8-11 (levels 55, 70, 85, 100); it is not a separate "gate". Confidence: M.
- **[C47]** Derived: Silkskin has the best per-hour shiny multiplier at 20 min (6.0x/h) and 1 h (4.0x/h); Royal 20 min is 12.0x/h and 1 h 8.0x/h (shiny mult / hours, flag=1 rows).
  Source: derived from packages/toolbox-parsers/vendor/data/website-data/shared-data.json#traps. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C48]** Derived: Natural 8 h gives the best EXP per hour of any trap row (40 EXP mult / 8 h = 5.0/h), then Cardboard 20 min (3.0/h), Meaty 1 h (3.0/h), Royal 20 min EXP is flat x1.
  Source: derived from packages/toolbox-parsers/vendor/data/website-data/shared-data.json#traps. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C49]** Derived: Wooden 120 h 'qty 200' row is 1.67 qty-mult/h, the best of the long (60 h and up) rows; Meaty 200 h gives 220 (1.1/h) but needs Trapping 40; Royal 672 h gives 550 (0.82/h).
  Source: derived from packages/toolbox-parsers/vendor/data/website-data/shared-data.json#traps. Tier 1. Verified 2026-10-19. Confidence: H.
- **[C50]** Prior research logged only a Reddit thread title ('What's the best trap for shinnies?', 2026-06-02); no community priority list could be fetched this run (Reddit blocked, web search budget exhausted, Idleon Academy host not resolvable), so Min-max below is derived from tier-1 data and flagged.
  Source: https://reddit.com/r/idleon/comments/1tv639i/whats_the_best_trap_for_shinnies/ (title only, via prior research w3-systems). Tier 4. Verified 2026-10-19. Unverifiable (web availability, not a game-data claim). Confidence: L.
- **[C51]** Current ActiveOn KB covers trapping with 4 checks (slots-and-timers, finishes-early, start, no-trap-set); detectors trapping/slots-and-timers and finishes-early exist; page 'trapping' exists; account-state exposes afk.traps (critter,endsAt), slots.trapSet and trappingStarted; critter counts, trap tiers, efficiency, shiny and Eagle Eye are not modelled.
  Source: packages/knowledge/systems/trapping.yaml; packages/account-state/src/afk-types.ts#L157, slots-types.ts#L48-L51; packages/engine/src/now/system-homes.ts#L29. Tier 1. Verified 2026-10-19. Confidence: H.
