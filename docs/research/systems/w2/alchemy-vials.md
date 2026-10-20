# Dossier: Alchemy, vials (`alchemy-vials`)

Research output for M26. Verified 2026-10-19 against Toolbox @6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1 (game version 2.3.540). Paths are relative to `packages/toolbox-parsers/vendor/` unless noted; `alch.ts` = `parsers/world-2/alchemy.ts`. Every claim has a number [Cn] and its Source inline (tier: 1 game data or Toolbox code, 2 Toolbox logic/dashboard, 3 wiki, 4 community). Revised after two adversarial verdict sets (source lens, game-data lens): confidence H/M/L is given per claim in the Confidence table at the end; **Disputed** marks claims one lens refuted. Test accounts are never named.

## Alchemy, vials

- **What it is:** 87 account-wide permanent stat vials (data indices 0-86) on the Vials tab of Alchemy. Each is discovered by dropping its ingredient on the cauldron NPC (a dice roll limited by daily attempts), then levelled 1 to 13 with that ingredient plus a liquid. Bonus per level is flat (`x1 * level`) or a saturating `decay` curve. [C1][C2][C5][C9] (T1 `data/website-data/vials.json`, `alch.ts#L52`; T3 https://idleon.wiki/wiki/Alchemy/Vials)
- **Unlocks:** Alchemy opens in W2. Water Droplets (Liquid1) vials are first; Liquid Nitrogen vials start at index 20, Trench Seawater at 31, Toxic Mercury at 64. Vials can be unlocked in any order. [C9][C25]
- **Scope:** account-wide. Levels live in `CauldronInfo[4]`; attempts and the two vial Pay 2 Win upgrades live in `CauldronP2W`. Virile Vials is a per-character Shaman talent that reads account vials. [C3][C11][C22]
- **Inputs → outputs:** In: ingredient (100 up to 1e9 per level), liquid (3 x current level), daily attempts, coins for Attempts and RNG. Out: about 80 distinct stat bonuses (brew speed, liquid cap/regen, bubble and stamp cost, talent points, efficiencies, XP, W4-W7 speeds, damage). [C6][C7][C23][C33][C34]
- **Goals and Milestones:**

| Level | Cumulative ingredient | Why it matters | Claim |
|---|---|---|---|
| 1 | unlock roll | bonus starts (x1 per level) | [C4] |
| 4 (green) | 3,600 | counts for Virile Vials (Shaman); "an important initial goal" | [C22][C40] |
| 5 | 13,600 | community "easy" threshold, under half the level 6 cost | [C8][C41] |
| 10 | 6,663,601 | community "do not exceed until endgame" | [C8][C41] |
| 13 | 1,131,663,601 and 234 liquid | Rift Vial Mastery counts it; Tome sums levels | [C8][C20][C26] |

  Account milestones: Pay 2 Win Attempts level 15 (18 a day), RNG level 45; Vault Vial_Overtune level 3 (x1.3); Lab My 1st Chemistry Set (x2). [C12][C13][C18][C19]
- **Feeds / fed by:** Fed by liquids (alchemy-liquids, P2W regen and cap), W1-W6 drops and bars, Lab bonus 10, Upgrade Vault 42, Vote Ballot Meritocracy, Rift Vial_Mastery. Feeds bubbles (Barley Brew cost), liquids (cap, regen), stamps (cost), post office (box points), talent points, Shaman damage, refinery, traps, cooking, breeding, lab, construction, sailing, farming, summoning, equinox, spelunking, menagerie, coral reef, sigils, the Tome. [C17][C29][C30][C31][C32][C34]
- **Per-session actions:** (1) spend today's attempts on locked vials whose ingredient is held (Toolbox alert fires only when `current > 0` and a level-0 vial's item is held); (2) level any vial whose next cost is covered by storage and liquid; (3) re-check after big material or liquid gains. Idle or capped state: attempts unused at the reset. [C15][C16][C35]
- **AFK Setup implications:** vials have no AFK slot. Liquid cauldron AFK feeds them (liquid cost 3 x L); farming the specific ingredients (see Min-max) is the AFK link. [C7]
- **Min-max by stage:** see below.
- **Common mistakes:** (a) letting daily attempts lapse; (b) **Disputed** [C42]: skipping a vial because a 2024 guide called it "useless". Source lens: the guide's useless vial is Pickle Jar (idx 20, BobJoePickle, stat Nothing), not the Nitrogen cap vial. Game-data lens: `Liquid2Cap` is consumed at `alch.ts#L165-173`, so Tea With Pea (11) does raise the Nitrogen cap. Correction: the only truly useless vial is Pickle Jar, and Nitrogen vials are worth levelling; (c) chasing level 13 before level 4/5 on every vial (cost steps ×2.5 to ×10); (d) forgetting the Pickle Jar vial does nothing but its level 2 is an Equinox quest. Detect (a) from `p2w.vialsAttempts.current > 0` with a held locked-vial item; (c) from `vials[].level` against the level 4 line. [C16][C27][C41][C42]
- **Save and Toolbox fields:** `account.alchemy.vials[i].level` (raw `CauldronInfo[4][i]`), `account.alchemy.p2w.vials.{attempts,rng}` (raw `CauldronP2W[2]`), `account.alchemy.p2w.vialsAttempts.{current,max}` (raw `CauldronP2W[5][0]`). [C3][C11][C12]
- **Sources:** inline per claim and listed at the end.

## Mechanics catalogue

Caps and costs come from code and data, not wikis.

1. **Vial catalogue and level.** 87 entries (indices 0-86) in `data/website-data/vials.json`; only entries with a `name` count (`isNamedVial`). Level 0 = locked; `MAX_VIAL_LEVEL = 13`. Save: raw `CauldronInfo[4][i]` to `account.alchemy.vials[i].level` (parseInt, default 0). [C1][C2][C3]
2. **Bonus formula.** `bonus = growth(func, level, x1, x2, false) * multiplier`, summed per `stat` (`getVialsBonusByStat`) or per effect text (`getVialsBonusByEffect`). `add` with x2=0 is `x1*level`; `decay` is `x1*level/(level+x2)`. Decay vials in W1-W4: Blue Flav (30, 7) and Choco Milkshake (50, 7). Field: `account.alchemy.vials[i].multiplier`. [C4][C5]
3. **Level cost, ingredient.** Level L to L+1 costs `vialCostsArray[L]` of `itemReq[0]`: 100, 1,000, 2,500, 10,000, 50,000, 100,000, 500,000, 1,000,001, 5,000,000, 25,000,000, 100,000,000, 1,000,000,000 (levels 2..13). Also `data/website-data/shared-data.json#vialCosts`. [C6]
4. **Level cost, liquid.** Also `3*L` of the vial's liquid (`itemReq[1]`: Liquid1 Water, 2 Nitrogen, 3 Seawater, 4 Mercury). Level 13 step costs 36; total to 13 is 234. [C7][C8]
5. **Cumulative table.** To level 4: 3,600; 5: 13,600; 6: 63,600; 7: 163,600; 8: 663,600; 9: 1,663,601; 10: 6,663,601; 11: 31,663,601; 12: 131,663,601; 13: 1,131,663,601 (derived sum, recomputed by both lenses; the wiki says "1.14 billion" material and 234 liquid per vial, not for all vials, and 1,131,663,601 rounds to 1.13, so the wiki figure is loose; trust the sum). [C8][C45]
6. **Discovery roll.** Each locked vial has `discoveryScore` (1 to 99). Dropping its item on the cauldron NPC is one roll; success unlocks permanently. The roll formula is not in the vendored parsers. Community: "you roll a dice and if you roll the required number, the Vial is permanently unlocked"; M19 reads the score as "Score+ N". Field: `vials.json[i].discoveryScore`. [C10][C38]
7. **Daily attempts.** Base 3, +1 per P2W Attempts level, cap level 15, so max 18. Parsed `p2w.vialsAttempts = {current: CauldronP2W[5][0], max: round(3 + CauldronP2W[2][0])}`. Refills at the daily reset and does not bank. [C11][C12][C35]
8. **Vial RNG ("epic gamer moment").** P2W level `CauldronP2W[2][1]`, cap 45 (wiki: 420% at 45). Extra rolls per drop; they use attempts but occasionally do not. Field: `p2w.vials.rng`. [C13]
9. **P2W pricing gap.** Toolbox prices cauldron and liquid P2W upgrades but not Attempts, RNG or Player upgrades; ActiveOn marks them unpriced. [C14]
10. **Vial multiplier stack.** `value = LabBonus10 * (1 + (2 * #vials at level>=13 [if Rift Vial_Mastery] + VaultBonus42)/100) * (1 + Meritocracy20/100)`, applied to every vial by `updateVials`. [C17][C18][C19][C20][C21]
11. **Lab: My 1st Chemistry Set (Lab bonus 10, W4).** x2 when active (bonusOn 2, bonusOff 1). [C18]
12. **Upgrade Vault: Vial_Overtune (index 42).** Max level 3, +10% per level (`level*x5`, x5=10), unlock at vault level 1700; x1.3 at max. [C19]
13. **Rift: Vial_Mastery (W4 Rift).** Each level-13 vial adds 2 to the additive group (game text says 1.02x each); code gate is `Rift[0] >= 35` (riftInfo index 35), which the wiki/game UI display as "Rift 36" (same event, display = code + 1; see rift.md resolution note). Gate: `isRiftBonusUnlocked(rift, 'Vial_Mastery')`. [C20]
14. **Vote Ballot Meritocracy bonus 20.** A weekly pick whose text is "All of your Vials give }x higher bonuses than normal" multiplies vials when selected. The index-to-text mapping is inferred (confidence M). [C21]
15. **Virile Vials (Shaman talent 485).** decay(12, 100)% damage per vial with level > 3. [C22]
16. **Talent-point vials.** Ramificoction (13) +1 Tab 1 per level; Sippy Soul (22) +1 Tab 2; Bunny Brew (37) +1 Tab 3; Ash Agua (52, W5 ingredient) +2 Tab 4. At level 13 that is 13/13/13/26 points before the multiplier (x2 with the Lab bonus). [C23]
17. **Brew-speed vials.** Copper Corona (0, Power), Sippy Splinters (1, Quicc), Mushroom Soup (2, Kazam), Spool Sprite (3, High-IQ): +3% brew speed per level of that cauldron, multiplied with P2W speed. [C29]
18. **Liquid vials.** Barium Mixture (4) +3 Water cap per level; Tea With Pea (11) +3 Nitrogen cap; 40-40 Purity (38) +1 Seawater cap; Jungle Juice (8) +1% regen for all liquids per level. No Mercury-cap vial exists in the data. [C30]
19. **Barley Brew (9). Disputed [C31].** Data (`vials.json` idx 9, stat `AlchBubbleCost`, x1=1) says -1% bubble upgrade cost per level, and `getBubbleUpgradeCost` accepts a `vialAndBubble` discount param (gamedata lens: consistent). Source lens: no vendored parser feeds the `AlchBubbleCost` stat into `getBubbleUpgradeCost` (`alch.ts#L134-144` only declares the optional param), so Toolbox itself does not apply the discount. ActiveOn should compute it from the vial level and not assume Toolbox shows it. Confidence M.
20. **Stamp cost vials.** Blue Flav (18) decay(30,7) percent cheaper stamp materials (19.5% at 13); Venison Malt (59) +2 per level read via `material_cost_for_stamps`. [C5][C32]
21. **Other W1-W4 stat vials.** See the Appendix: money, statue double, class-EXP convert, card drop, shop sell, weapon power, accuracy, EXP, box points, shiny chance, worship points, efficiencies, trap, library speed, cog inventory and speed, construction EXP, printer sample, multikill, giant mob, critters per trap, arcade balls, breeding, new pet, cooking, kitchen cost, lab EXP, all stats, pet damage. [C33][C34]
22. **Dashboard alerts.** "vials" (level 1-12, storage stack > cost, liquid > 3*L) and "vialsAttempts". [C15][C16]
23. **Tome.** `calcVialsLevels` = sum of all vial levels, fed to the Tome "Total_Vial_LV" objective. [C26]
24. **Equinox link.** Pickle Jar vial (20, "+50% Nothing") level 2 is a quest reward (+5 Max LV for Faux Jewels). [C27]
25. **W5+ extensions.** Later-world Liquid3 (Trench Seawater) vials are idx 42-63 (not 50-63; Pearl Seltzer is idx 49): breeding, pets, meals, TD points, Kraken, Divinity, Sailing, Gaming, Equinox, Sigil, Shrine, Construction. Liquid4 (Mercury) vials are idx 64-86: farming, summoning, sneaking, Turtle Tisane (74, x1=4, multiplicative on artifact find, used in `sailing.ts#L729`, and also sigil speed `alch.ts#L901`, cooking, construction), idx 75 a total damage multiplier (`damage.ts#L308`), idx 79 spelunking AFK, idx 81 coral, idx 86 Menagerie lumi. There is no Liquid4 cap vial. [C25][C33][C43]
26. **Level cap sentinel.** `vialCostsArray` has a 5E10 sentinel at index 13, so level 14 is never purchasable. [C6] (T1 `alch.ts#L989`)
27. **Dashboard `subtractGreenStacks`.** The "vials" alert has an optional setting that subtracts 1e7 from the stored quantity before comparing to cost. [C15] (T2 `account.js`)
28. **Lab bonus gating.** My 1st Chemistry Set only applies when its Lab node is active or connected (bonusOn 2 vs bonusOff 1); a disconnected node means x1. [C18]
29. **Meritocracy gating.** Applies only after the World 6 town unlock (map 250 cleared) and scales with vote share and many modifiers (Poppy, Clam Work, Companion, Arcade, Event Shop, Sushi, Jelly), so the vial multiplier from it is usually partial. Confidence M. [C21]
30. **Multiplier recompute order.** `updateVials` runs twice in `parsers/index.ts` (L237, L266); final display values include the multiplier. The in-game vial description also shows the lab-doubled value (community-observed, confidence L). [C17]
31. **Multiplicative W6/W7 vial stats.** Turtle Tisane (artifact find, sigil, cooking, construction), the `7dmg` total damage multiplier (`damage.ts#L308`) and `7drMulto` drop-rate multiplier combine multiplicatively with other sources, unlike additive vials. [C43]
32. **Construction link.** Vials affect Call Me Bob and construction speed (`character.ts#L3676-3699`). [C34]
33. **Direct-stat vials needing an effect view.** Dieter Drink (MonsterCash), Skinny 0 Cal (StatueDouble), Thumb Pow (ClassEXPconvert), Anearful (CardDrop), Gold Guzzle (ShopSell), Seawater (MultiKillPlay), Tail Time (WeaponPOW). Each needs wiring into an ActiveOn effect view; consumers are spread over efficiency, character, damage, misc, stamps, equinox, shrines, refinery, traps, postoffice, cooking, tome, breeding, gaming, sailing, summoning, farming, coralReef, spelunking, menagerie, dungeons, speedrun parsers. [C34]
34. **Later-world Liquid3 consumers (idx 42-49).** Capachino BreedXP (breeding), Donut Drink NewPet (chance to breed a new pet), Long Island Tea and Dreadnog MealCook (meal speed), Spook Pint RecCook, Calcium Carbonate TDpts (+11 TD start points per level). [C24][C43]
35. **Ball Pickle Jar (41).** A Liquid1 vial in the W3-ish range with stat `arcadeBALLZ` x1=25 (+325% arcade ball gain at 13): an out-of-order oddity, not in the Liquid3 block. [C25]
36. **Player upgrades.** `CauldronP2W[3]` (p2w.player) has levels and values but no cost in Toolbox; unpriced like Attempts and RNG. [C14]
37. **Pickle Jar gate.** Its level 2 is an Equinox challenge ("Upgrade the Bobjoepickle vial to Lv 2") whose reward is +5 Max LV for Faux Jewels; track it as a one-time goal. [C27]
38. **Vial Mastery progress meter.** Count of vials at level >= 13 (Gold Crown) feeds +2 per crowned vial in the additive group of the multiplier; ActiveOn can show it as a progress meter. [C20]
39. **Unknowns.** The discovery roll formula and the in-game "Next Vial" hint are not in the parsers (confidence L). [C10]

## Min-max by stage

No source orders every vial. Three independent opinions exist; where they disagree both are listed.

- **W1:** nothing to do (Alchemy opens in W2). Keep copper ore, oak logs, spore caps, thread: the first four vials cost 100 each at level 2. [C6][C29] (ours, confidence L)
- **W2 early:** unlock the four brew-speed vials, Barium Mixture, Jungle Juice, Barley Brew, then level each to 2. M19 FR-9 ordering, confidence L: no human source gives a W2-W3 vial order. Contrary view: "Don't invest much in vials early" (gameslikefinder alchemy guide, 2026-09-17, confidence L). [C36][C37]
- **W2 mid/late:** roll for the community "amazing value" set as you get items: Bean Slices (Dieter Drink, money), Floof Ploof, Jungle Logs (Jungle Juice), Poison Froge (Poison Tincture, Eagle Eye +3%), Goldfish (Seawater, portal kills). Stale detail: the guide says Floof Ploof gives double statue points, but current data has that on Skinny 0 Cal (Snake Skin) and Floof Ploof gives shiny chance. Source idleon.guide 2024-03-04, pre-patch, confidence M on items, L on tiers. [C33][C41]
- **W3 early:** bring every unlocked vial to level 4 (3,600 each), mandatory if a Shaman is on the account; then level 5 (13,600). Sources: wiki Vials (T3), gameslikefinder Shaman guide updated 2026-03-09 (T4), idleon.guide "upgrade all easy vials up to level 5 first" (T4, 2024-03-04). Confidence H on thresholds, M on "all vials". [C22][C40][C41]
- **W3 mid:** community "best of the best": Rats Tail (Tail Time, weapon power), Iron Bar (Barley Brew), Platinum Ore (Blue Flav; the guide's -3.75% per level predates the current decay curve), Snow Ball (Snow Slurry), Slowergy Drink (multikill; the guide's "Frigid Soul" name was not found on the page, **Disputed** [C41], confidence L), Kraken (Krakenade weapon power). Then cauldron speeds, efficiency vials, talent-point vials. idleon.guide 2024-03-04, pre-patch flag. [C41][C5]
- **W3 late:** do not push past level 10 before endgame (level 13 costs 1e9 each). Brew vials toward 8-10, Barley Brew toward 10, Tab 1-3 talent-point vials (+1 per level, permanent), cap vials when the cap binds. Confidence L. [C8][C23][C41]
- **W4:** unlock Lab My 1st Chemistry Set first (x2 on all vials, the largest multiplier), then Vault Vial_Overtune (x1.3), then Rift Vial_Mastery. Vial targets by effect: Choco Milkshake (kitchen cost), Long Island Tea and Dreadnog (meal cooking speed), Spook Pint (recipe speed), Donut Drink (new pet), Capachino (breeding EXP), Bloat Draft (lab EXP), Pearl Seltzer (all stats). Ours by effect text, confidence L. [C18][C19][C20][C33]
- **W5+ outline:** Turtle Tisane (multiplicative on four systems) is the standout; each level-13 vial adds 2% to the vial multiplier pool, so mass-levelling to 13 is an endgame loop. [C20][C43]

## Open questions

1. Exact discovery roll formula and Vial RNG semantics (not in the vendored parsers).
2. Vial Attempts and RNG coin costs are unpriced in Toolbox; wiki https://idleon.wiki/wiki/Alchemy/Pay_2_Win returned 404 on 2026-10-19.
3. Whether Meritocracy index 20 is the vial multiplier.
4. (Resolved 2026-10-19) Vial Mastery: code `Rift[0] >= 35` = displayed Rift 36. The N.js multiplier site was not located by name; Toolbox `isRiftBonusUnlocked` is the T1/T2 source.
5. Venison Malt (59) sign: data `add` with a "-%" text.
6. Whether Blue Flav's guide figure (-3.75% per level) predates a rebalance.
7. Sprites: no per-vial icon exists; only `item-vial` (items.ts#L324), liquids and cauldrons are drawn. Per-vial icons were not checked by the verifiers (confidence L).
8. Next Vial hint and the discovery roll formula (see mechanic 39).

## Current ActiveOn coverage

KB: `alchemy-vials.check.daily-attempts`, `alchemy-vials.priority.plan` (6-row order, confidence L), `alchemy-vials.goal.level-next`. Detector `packages/knowledge/detectors/alchemy-vials/attempts.ts`. Account State `alchemy.vialLevels` covers only indices 0-41. View: `alchemy-lab` page via SYSTEM_HOMES and `AlchemyTabs`. Gaps: no W4+ vials, no multiplier stack, no Gold Crown count, no Virile Vials link, no talent-point tracking, no vial sprites. [C24][C36][C44]

## Confidence table (after adversarial verification)

| Claim | Status | Conf |
|---|---|---|
| C1-C8, C11, C14-C20, C22-C27, C29, C30, C32 | verified by both lenses | H |
| C21 Meritocracy index 20 = vial multiplier | confirmed by parsing ninjaExtraInfo[41] idx 20 (value 50) | H (raised from M; the Open question 3 and mechanic 14 "inferred, M" note are superseded) |
| C9, C12 wiki parts, C13 (420%), C35 | wiki-confirmed, not code-checkable | M |
| C10 discovery roll | range 1-99 verified, formula unknown | L |
| C31 Barley Brew in bubble cost | **Disputed** | M |
| C41 idleon.guide set (Frigid Soul) | **Disputed**, pre-patch | L |
| C42 "useless vial" | **Disputed**, correction: Pickle Jar | M |
| C43 W5+ ranges | corrected to Liquid3 42-63 | H |
| C33 appendix table | spot-checked idx 0-63 vs vials.json, not row by row | M |
| C34 consumer list | grep-confirmed per parser file | H |
| C36, C37, C38, C40 community text | quotes confirmed; "as low as 1%" figure was not on the page and is not used | L-M |
| C44 coverage | partially checked | M |
| C45 wiki 1.14 billion | wiki figure loose; derived sum H | H |

Removed: nothing (no claim was refuted by both lenses).

## Appendix: vials 0-63 (per-level effect before the multiplier)

| # | Vial | Ingredient (raw) | Liq | Score | Stat | Per level | At L13 | Effect |
|---|---|---|---|---|---|---|---|---|
| 0 | Copper Corona | Copper | L1 | 1 | OrangeBrew | 3/lv | 39 | Orange bubble cauldron brew speed is increased by +N% |
| 1 | Sippy Splinters | OakTree | L1 | 10 | GreenBrew | 3/lv | 39 | Green bubble cauldron brew speed is increased by +N% |
| 2 | Mushroom Soup | Grasslands1 | L1 | 20 | YellowBrew | 3/lv | 39 | Yellow cauldron brew speed is increased by +N% |
| 3 | Spool Sprite | CraftMat1 | L1 | 30 | PurpleBrew | 3/lv | 39 | Purple cauldron brew speed is increased by +N% |
| 4 | Barium Mixture | CopperBar | L1 | 40 | Liquid1Cap | 3/lv | 39 | +N Water Droplet max capacity. Thats the 1st liquid type in Alchemy, b |
| 5 | Dieter Drink | Grasslands3 | L1 | 40 | MonsterCash | 1/lv | 13 | Monsters drop +N% more money. |
| 6 | Skinny 0 Cal | Jungle2 | L1 | 60 | StatueDouble | 2.5/lv | 32.5 | +N% chance to get double points when depositing statues. So like... if |
| 7 | Thumb Pow | CraftMat5 | L1 | 50 | ClassEXPconvert | 1/lv | 13 | When converting Skill EXP into Class EXP using the 'EXP CONVERTER' sta |
| 8 | Jungle Juice | JungleTree | L1 | 60 | LiquidRegen | 1/lv | 13 | +N% liquid regen rate for all liquid cauldrons. Yes, even the secret o |
| 9 | Barley Brew | IronBar | L1 | 65 | AlchBubbleCost | 1/lv | 13 | Alchemy bubble upgrade costs are N% lower for all bubbles! Even the gi |
| 10 | Anearful | Forest1 | L1 | 70 | CardDrop | 2/lv | 26 | +N% Card drop rate. Even works offline, just like it always has! What  |
| 11 | Tea With Pea | ToiletTree | L1 | 75 | Liquid2Cap | 3/lv | 39 | +N Liquid Nitrogen max capacity. Thats the 2nd liquid type in Alchemy, |
| 12 | Gold Guzzle | Gold | L1 | 83 | ShopSell | 1/lv | 13 | +N% Shop sell price. |
| 13 | Ramificoction | Forest3 | L1 | 84 | Tab1Pts | 1/lv | 13 | +N Talent Points for Tab 1. Shout out to that 1 person who'll make it  |
| 14 | Seawater | Fish1 | L1 | 87 | MultiKillPlay | 1/lv | 13 | +N% chance for 1 kill to count for 2 when trying to open new portals,  |
| 15 | Tail Time | Sewers2 | L1 | 91 | WeaponPOW | 0.5/lv | 6.5 | +N Weapon Power. This is gonna be OP in later worlds I can already tel |
| 16 | Fly In My Drink | Bug1 | L1 | 87 | baseACC | 3/lv | 39 | Eww go get me another one, I can't drink this! ...what, why are you lo |
| 17 | Mimicraught | DesertA2 | L1 | 90 | MonsterEXP | 1/lv | 13 | +N% EXP from monsters. Sorry, I know this is a lame bonus. Send me an  |
| 18 | Blue Flav | Plat | L1 | 93 | MatCostStamp | decay(30,7) | 19.5 | -N% material cost for stamps. You know how it's hard to increase stamp |
| 19 | Slug Slurp | Fish2 | L1 | 89 | BoxPoints | 2/lv | 26 | +N Post Office Box Points for every character, and easily the best bon |
| 20 | Pickle Jar | BobJoePickle | L2 | 99 | Nothing | 50/lv | 650 | +N% Nothing. Absolutely nothing, now and forever. It's a darn pickle,  |
| 21 | Fur Refresher | SnowA1 | L2 | 75 | Shiny1 | 2/lv | 26 | +N% higher Shiny Critter chance. This is a multiplier, so +1% from thi |
| 22 | Sippy Soul | Soul1 | L2 | 75 | Tab2Pts | 1/lv | 13 | +N Talent Points for Tab 2. |
| 23 | Crab Juice | Critter2 | L2 | 80 | TDpts | 4/lv | 52 | +N Starting points in Worship Tower Defence. Of course, a true balloon |
| 24 | Void Vial | Void | L2 | 80 | MinEff | 1/lv | 13 | +N% Mining Efficiency. |
| 25 | Red Malt | Refinery1 | L2 | 85 | RefSpd | 1/lv | 13 | +N% Refinery Cycle Speed. I just want to see you squirm a bit more as  |
| 26 | Ew Gross Gross | Bug5 | L2 | 86 | CatchEff | 1/lv | 13 | +N% Catching Efficiency. |
| 27 | The Spanish Sahara | SaharanFoal | L2 | 87 | ChopEff | 1/lv | 13 | +N% Choppin Efficiency. |
| 28 | Poison Tincture | Critter1A | L2 | 95 | TrapOvision | 3/lv | 39 | Eagle Eye Trap-O-Vision gives +N% more critters. |
| 29 | Etruscan Lager | SnowB2 | L2 | 88 | FishEff | 1/lv | 13 | +N% Fishing Efficiency. |
| 30 | Chonker Chug | Soul2 | L2 | 90 | TalBookSpd | 1/lv | 13 | +N% Talent Book Library checkout speed. |
| 31 | Bubonic Burp | Critter4 | L3 | 91 | CogInv | 1/lv | 13 | +N Cog Inventory spaces. DONT PANIC!!! I KNOW ITS ALARMING THAT A VIAL |
| 32 | Visible Ink | SnowB3 | L3 | 93 | ConsExp | 1/lv | 13 | +N% Construction Exp gain. |
| 33 | Orange Malt | Refinery2 | L3 | 95 | Shiny2 | 5/lv | 65 | +N% higher Shiny Critter chance. This stacks with the shiny chance fro |
| 34 | Snow Slurry | SnowB5 | L3 | 96 | SampleSize | 0.5/lv | 6.5 | +N% Printer sample size. My my there are a lot of these 'sample size'  |
| 35 | Slowergy Drink | Soul4 | L3 | 97 | Overkill | 1/lv | 13 | +N% Base Multikill per Multikill Tier for all worlds. Stack them skull |
| 36 | Sippy Cup | SnowC1 | L3 | 97 | CogSpd | 1/lv | 13 | +N% Cog production speed. |
| 37 | Bunny Brew | Critter7 | L3 | 98 | Tab3Pts | 1/lv | 13 | +N Talent Points for Tab 3. |
| 38 | 40-40 Purity | SnowC4 | L3 | 98 | Liquid3Cap | 1/lv | 13 | +N Trench Seawater max capacity. Thats the 3rd liquid type in Alchemy, |
| 39 | Shaved Ice | Refinery5 | L3 | 99 | GiantMob | 1/lv | 13 | +N% base Giant Monster spawn rate. |
| 40 | Goosey Glug | Critter9 | L3 | 99 | CritterBASED | 1/lv | 13 | +N base critter per trap. This is a sHONKingly good bonus, the aren't  |
| 41 | Ball Pickle Jar | BallJoePickle | L1 | 99 | arcadeBALLZ | 25/lv | 325 | +N% arcade ball gain rate, and those are balls blessed by Balljoepickl |
| 42 | Capachino | GalaxyA1 | L3 | 99 | BreedXP | 4/lv | 52 | +N% Breeding EXP gain |
| 43 | Donut Drink | GalaxyA3 | L3 | 99 | NewPet | 5/lv | 65 | +N% Chance to breed a new pet. Multiplicative, so +5% here would chang |
| 44 | Long Island Tea | Fish6 | L3 | 99 | MealCook | 6/lv | 78 | +N% Meal Cooking Speed |
| 45 | Spook Pint | Soul5 | L3 | 99 | RecCook | 5/lv | 65 | +N% New Recipe Cooking Speed |
| 46 | Calcium Carbonate | GalaxyB3 | L3 | 99 | TDpts | 11/lv | 143 | +N Starting Worship Pts. |
| 47 | Bloat Draft | Critter10 | L3 | 99 | LabXP | 3/lv | 39 | +N% Lab EXP gain. Strange, you'd think someone dumb enough to drink a  |
| 48 | Choco Milkshake | GalaxyB4 | L3 | 99 | Kcosts | decay(50,7) | 32.5 | -N% Kitchen Upgrading Cost. |
| 49 | Pearl Seltzer | GalaxyC1b | L3 | 99 | AllStatPCT | 0.5/lv | 6.5 | +N% All Stats. If you don't know what all stats means by now, you've p |
| 50 | Krakenade | Fish8 | L3 | 99 | WeaponPOW | 1/lv | 13 | +N Weapon Power. Unleash the kraken... |
| 51 | Electrolyte | GalaxyC4 | L3 | 99 | PetDmg | 2/lv | 26 | +N% Mob Team Damage |
| 52 | Ash Agua | LavaA1 | L3 | 99 | Tab4Pts | 2/lv | 26 | +N Talent Points for Tab 4 |
| 53 | Maple Syrup | Tree9 | L3 | 99 | DivXP | 2/lv | 26 | +N% Divinity EXP. Maple syrup helps you keep calm and meditate with th |
| 54 | Hampter Drippy | LavaA5b | L3 | 99 | SailXP | 2/lv | 26 | +N% Sailing EXP gain. Doesn't help level up captains, only yourself. S |
| 55 | Dreadnog | DreadloBar | L3 | 99 | MealCook | 2/lv | 26 | +N% Cooking Speed for meals. No, MEALS, not meel, dont cook him!! Stop |
| 56 | Dusted Drink | Bug10 | L3 | 99 | GameXP | 2/lv | 26 | +N% Gaming EXP. Cool. |
| 57 | Oj Jooce | LavaB3 | L3 | 99 | SailSpd | 2/lv | 26 | +N% Sailing Speed. If only there was a way to also lower the minimum s |
| 58 | Oozie Ooblek | Soul6 | L3 | 99 | GameBits | 2/lv | 26 | +N% Bits gained in Gaming. Cool. |
| 59 | Venison Malt | LavaC2 | L3 | 99 | MatCostStamp | 2/lv | 26 | -N% material cost for stamps. Have at it endgamers! |
| 60 | Marble Mocha | Marble | L3 | 99 | EqBar | 5/lv | 65 | +N% Faster Equinox Bar Fill Rate |
| 61 | Willow Sippy | Tree11 | L3 | 99 | SigSpd | 4/lv | 52 | +N% Faster Sigil Charge Rate |
| 62 | Shinyfin Stew | Fish13 | L3 | 99 | Contspd | 7/lv | 91 | +N% Construction Build Rate, so you can hit all those boosted max leve |
| 63 | Dreamy Drink | Bug11 | L3 | 99 | ShrineSpd | 3.5/lv | 45.5 | Shrines charge +N% faster, so this way they charge faster, compared to |

## Sources

- Toolbox pin https://github.com/Morta1/IdleonToolbox/tree/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1 (game 2.3.540), vendored locally.
- Wiki https://idleon.wiki/wiki/Alchemy/Vials (2026-09-29), https://idleon.wiki/wiki/Alchemy (opened 2026-10-19).
- Community https://idleon.guide/vials/ (2024-03-04, pre-patch), https://gameslikefinder.com/article/idleon-shaman-build-guide/ (2026-03-09), https://www.digitaltq.com/wiki/idleon/alchemy (2026-10-12), https://gameslikefinder.com/article/idleon-alchemy-guide/ (2026-09-17, via prior research).
- Repo `docs/specs/M19-alchemy.md`, `packages/knowledge/systems/alchemy-vials.yaml`, prior research `origin/research/w2-systems:docs/research/systems/2026-10-17-w2-systems.md`.
