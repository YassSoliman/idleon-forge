# Companions & pets (dossier)

Research date 2026-10-19. Game 2.3.540 (v1.23), IdleOn Toolbox @6c37e3d (pinned). Source tiers: 1 = game data / Toolbox code, 2 = Toolbox UI / wiki, 3 = prior research dossier, 4 = community. Confidence H/M/L noted where it is not tier 1. Dates: every claim verified 2026-10-19; wiki pages were fetched that day, wiki revisions are one patch old in places (Stale-risk flagged). No real character names or account data appear here.

## Pets (Companions)

- **What it is:** a collection of pets, each giving a fixed account-wide bonus once owned [C1]. The game renamed Companions to Pets in Feb 2026 (unverified, L); Toolbox keeps the old word [C2]. Pets also form your team for the daily Tournament and Raids [C3][C4].
- **Unlocks:** from the start of the game; the free pull, treat shop and Pet Mart are reached via Doggy / the Pet Park / Quick Ref (Tournament -> Pet Mart). No world gate is assumed for the Mart gem claim [C5]. King Doot specifically is inert until Divinity level 2 [C6].
- **Scope:** account-wide. Owned per account and stored in RTDB `_comp/<uid>`, not the save document [C7]. Tradeability is per copy [C8].
- **Inputs -> outputs:**
  - In: Pet Crystals [C9], treats [C10], free daily pull [C11], Pet Mart purchases [C12], raid drops [C4], paid bundles [C13], Pet Bonus Tokens [C14].
  - Out: about 167 named pets with account-wide bonuses (some are placeholders, see [C44]) (damage, drop rate, class/skill EXP, carry, talents, Vault/Refinery/Construction/Equinox/Printer/Alchemy/Arcade/Ballot multipliers, QoL). See the Mechanics catalogue.
- **Goals and Milestones:**

| Milestone | What changes | Detect from the save |
|---|---|---|
| First pet | Tournament registration alert is allowed [C15] | `companions.list.some(acquired)` |
| Each new pet | Its bonus applies account-wide [C1] | `companions.list[i].acquired` |
| Pet bought count 5/13/23/38 | Higher Legacy treat tiers unlock [C10] | server/prior only |
| 50 pets owned | Pet Mart+ can appear (also needs every pet in the day's offer owned) [C16] | count of `acquired` |
| A copy at level >= 1 | Bonus switches to the Pet+ column [C8] | `list[i].level`, `.upgraded` |
| Token spent | A non-owned pet's base bonus applies [C14] | `tokens.used/owned/remaining` |
| King Doot + Divinity 2 | Its effect starts [C6] | W5, out of scope |

- **Feeds / fed by:** feeds Talents [C17], Damage [C18], Class/Skill EXP [C19][C20], Drop Rate [C21], Coins [C22], Carry [C23], Upgrade Vault [C24], Alchemy [C25][C26], Arcade [C27], Ballot [C28], Orion/Poppy/Bubba clickers [C29], Portals and Death Note [C30], 3D Printer [C31], Refinery [C32], Equinox [C33], Construction [C34], Meals and Cooking [C35], Gold Food [C36], Lab [C37], friend slots [C38]. Fed by the Tournament/Raids, events, gems (via bundles).
- **Per-session actions:** (1) claim the free pull when due [C11]; (2) register for the Tournament (and Raid) [C15]; (3) claim Pet Mart gems [C39]; (4) check the day's Mart for a Spend Plan target [C12]; (5) recycle duplicate tradeable copies for crystals, never the last copy [C9]; (6) spend any unspent Pet Bonus Token [C14]. Idle/capped: nothing claimable and no target in the Mart.
- **AFK Setup implications:** none directly (passive). Pets that multiply AFK gains, class EXP or drops raise the value of every AFK setup [C20][C19]; Ram and Mr Pig remove storage trips [C38].
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes (and detection):**

| Mistake | Detection |
|---|---|
| Missing the daily pull | `freeClaimAnchor + 594e6 < now` [C11]; lifetime `totalBoxesOpened` far below days played [C40] |
| Never claiming Pet Mart gems | `OLA[516] < tournament.global.S` [C39] |
| Not registering for the Tournament | `OLA[511] <= tournamentDay` with a pet owned [C15] |
| Unused Pet Bonus Token | `tokens.remaining > 0` [C14] |
| Token on a no-bonus or wrong-world pet | `usedIndices` vs the table's rating [C41][C6] |
| Recycling the last copy | Pet vanishes from `acquired` (needs history) [C9] |
| Treat gambling instead of buying a target | Not visible in the save (M) |
| Wrong ratio of Pet+ priorities | Pet+ only applies from a copy at level >= 1 and Mart+ needs 50 pets [C16] |

- **Save and Toolbox fields:** see catalogue; summary [C7][C42].
- **Sources:** claim register at the end.

## Mechanics catalogue

Format: mechanic - rule/formula - caps/limits - unlock - cost - field path.

1. **Pet ownership and activation.** A pet is active iff `companions.list[idx].acquired` (owned copy, or token, or Toolbox simulation) [C1]. Cap: storage `_comp.p` default 60 [C43]. Field: `account.companions.list[]`, raw `_comp.l`.
2. **Pet database.** 178 rows: 167 named non-champion rows, 9 Champions and 2 nameless placeholders [C44]; every row has `bonus`, `upgradedBonus`, `tourPower`, `upgradedTourPower`, `upgradeCost`, `filler` (recycle). Field: `vendor/data/website-data/companions.json`.
3. **Bonus encoding.** Each call site converts `bonus` to a multiplier differently [C45].
4. **Pet+ (Mart+).** Level >= 1 on any copy swaps to the + bonus and power; extra `CompLV2` terms [C8]. Cost = `upgradeCost` Pet Crystals; unlock = Mart+ conditions [C16]. Field: `companions.list[i].level/.upgraded`, `_comp.l` field 4.
5. **Pet Bonus Token.** Up to 2; grants base bonus of chosen pets; wipe rule [C14][C46]. No + level [C47]. Fields: `OptionsListAccount[605],[615],[606]`.
6. **Free daily pull.** Anchor + 594,000,000 ms; server back-dates `t` by 511,200,000 on claim [C11]; free pets recycle for 0 crystals [C48]. Field: `companions.freeClaimAnchor` (`_comp.t`).
7. **Treat gacha.** Treat tiers priced in Pet Crystals (wiki shows four tiers, 70-250; a fifth is Disputed); tier unlock thresholds; pity [C10][C49]; odds [C50]. Not in Toolbox data (server-side).
8. **Pet Crystals and recycling.** `_comp.s`; recycle value = `filler` [C9]. Field: `companions.petCrystals`.
9. **Pet Mart.** 5 server-picked pets/day, list price + discounted price, discounts 10-50% [C12][C51]. Field: `account.tournament.petMart.offers[]`.
10. **Pet Mart+.** Needs all of the day's offer owned + 50 pets [C16]. Field: `petMart.plusOffers[]`.
11. **Pet Mart free gems.** Condition `S > OLA[516]` and `GemPM_x >= 0.1` [C39]. Fields: `OptionsListAccount[516]`, `tournament.global.S`, `serverVars.GemPM_x`.
12. **Tournament.** Daily; divisions and points; 1024 bracket; qualifying lives [C3]. Fields: `OptionsListAccount[495,496,493,498]`, `tournament.global.T`.
13. **Registration.** `OLA[511]` = day + 1 when registered [C15].
14. **Tournament power.** `tourPower` / `upgradedTourPower`; duel rule [C52].
15. **Raids.** Daily PvE, 3 difficulties, reward pets [C4]; registration `OLA[611]`, `global.RD/RC` [C15].
16. **Follower.** `_comp.e`, cosmetic [C53].
17. **King Doot gate.** Divinity level >= 2 [C6].
18. **Per-pet special formulas.** Santa Snake [C54]; Baby/Mama Troll [C55]; Mr Pig / Spearfish friend slots [C38]; Sheepie [C25]; Cryosnake [C24]; Gold Food [C36]; Biggole Mole [C31][C56]; Panda [C32]; Leek Spirit [C33]; Mechanical Mouse [C34]; Carry [C23]; Damage product [C18]; Class EXP [C19]; Drop Rate [C21]; Coins [C22]; Skill pets [C20]; Alchemy/defence/accuracy [C26]; Lab [C37]; Meals [C35]; Ballot [C28]; Arcade [C27]; Clickers [C29]; Portal kills [C30]; Talents [C17]; Hat Rack [C57].
19. **Bundles.** Paid pet packs [C13].
20. **Simulation.** Toolbox lets users tick unowned pets ("what if I owned this"); base bonus only [C47]. Not part of ActiveOn's Account State.
22. **Pet Mart+ economy.** Only `level >= 1` (CompLV2) is modelled; no level beyond 1 or cost curve is in Toolbox; `upgradeCost` is the Pet+ price [C63].
23. **Champion duels and tourPower stacking.** [C64]
24. **Tournament points and divisions.** `divisionPointReqs`, `divisionScales`; points shop not in Toolbox [C65].
25. **Gem and bundle shop.** Distinct from Pet Crystals [C66].
26. **Trade popup and tradable copies.** [C67]
27. **Raid season rotation.** [C68]
28. **Caps and unmodelled upgraded effects.** [C69][C70]
29. **Extra sinks.** Legend Talent PTS, Masterclass drops, Divinity EXP, kill chain, Villager EXP and Opals, crucible term [C71][C72]
30. **Friend Bonus slots and multiplier (Mr Pig idx 30, Spearfish idx 44).** Slots = `round(min(20, 2 + SpearfishBonus + 2*MrPigBonus + EventShop22))`, where each companion term applies only if acquired and `EventShop22` is 1 when option 311 contains the letter for event-shop bonus 22. Base account (no pets, no shop item) has 2 slots; Mr Pig adds 2 (3 with Pet+, bonus 1.5), Spearfish adds 1, the event-shop bonus adds 1 (max 7 with Pig Pet+, Spearfish and shop; the 20 cap is unreachable in W1-W4) [C73]. Multiplier = `1 + (100*MrPigBonus + 25*SpearfishLvl2)/100`: x1 none, x2 Pig, x2.5 Pig Pet+, +0.25 flat with Spearfish Pet+ (CompLV2, unscaled), so x2.75 at best [C74]. Only the first `slots` entries of the saved friend list are read; each entry is `statIndex,level,friendName` [C75]. Per-entry value = `base[stat] * scaling(level) * multiplier`, base = Damage 100, Class EXP 30, Skill Efficiency 50, Drop Rate 25, Skill EXP 30, Coins 40, Extra Kills 10; `scaling = min(1.5, 0.25 + 1.5*L/(L+12000))` with L capped to 30000 (so scaling runs 0.25 to 1.32 and the 1.5 cap is never hit) [C76]. Consumers: stat 0 Damage (damage.ts), 1 Class EXP (character.ts), 2 Skill Efficiency (efficiency.ts), 3 Drop Rate and 5 Coins (character.ts), 6 Extra Kills (damage.ts); stat 4 Skill EXP has no `getFriendBonus` call site in the pinned Toolbox [C77]. Field: `account.companions.list[30|44]`, raw `accountOptions[476]` (`stat,level,name;...`), `accountOptions[311]`, output `account.friendBonusStats.{slots,multiplier,bonuses[]}`. Friend names are real player names: never store or quote them (ActiveOn keeps only stat and level).
21. **Cross-system note.** W4 Breeding pets are a different system [C58].
- **W5+ extensions (one line each):** King Doot and Samurai Guardian (Divinity, Caverns villager EXP/Opals); Koi Fish (Gaming bits); Magni Pufferfin, Glimbo, Litterfish (Sailing, artifacts); Gelatinous Cuboid, Smoke Devil, Ricecake (W6 farming, sneaking, summoning); W7 pets (RIP Tide, Bubba the Seal, Pufferblob, Shellslug, Eamsy Earl, Jellofish, Neonscale, Pirate Deckhand, Dreadnaught Captain, Royal Egg, Coralcave Guardian, Boomy Mine, Mantaray, Glowfish, Rift Stalker, Wild Boar) [C59].

### Per-pet table (W1-W4 relevant and common pets)

[C59][C60]. Columns: idx, pet, effect text, bonus base -> + , tournament power base/+, Pet+ cost, recycle value, Toolbox sink, dossier rating (M).

| Idx | Pet | Effect | Bonus (base -> +) | Power | Pet+ cost | Recycle | Sink | W1-W4 value |
|---|---|---|---|---|---|---|---|---|
| 0 | King Doot | All Divinities from World 5 count as Active | 1 -> 1 | 165/240 | 3000 | 2000 | vendor/parsers/world-5/divinity.ts#L389 | W5+ (Divinity) |
| 1 | Rift Slug | +25 Lv for all Talents | 25 -> 35 | 125/180 | 2500 | 450 | vendor/parsers/talents.ts#L367 | High |
| 2 | Dedotated Ram | You can use Storage Chest anywhere in Quickref | 1 -> 1 | 120/170 | 2100 | 150 | vendor/parsers/misc.ts#L1164 | High (QoL) |
| 3 | Crystal Custard | {100% Drop Rate and Class Exp | 100 -> 130 | 110/150 | 1750 | 150 | vendor/parsers/character.ts#L2115,L2406 | High |
| 4 | Sheepie | All big bubbles in Alchemy count as equipped | 1 -> 1 | 80/130 | 1500 | 10 | vendor/parsers/world-2/alchemy.ts#L382 | High from W2 |
| 5 | Molti | {5% All Skill Efficiency | 5 -> 8 | 70/100 | 1400 | 10 | vendor/parsers/efficiency.ts#L165 | Med |
| 6 | Bored Bean | {5% AFK Gains Rate for Fighting and Skills | 5 -> 8 | 65/90 | 1200 | 10 | vendor/parsers/character.ts#L3270 | Med-High |
| 9 | Bloque | +20% All Skill EXP | 20 -> 30 | 50/75 | 700 | 5 | vendor/parsers/character.ts#L1687 | Med |
| 10 | Frog | +10% Total Damage | 10 -> 15 | 40/70 | 600 | 5 | vendor/parsers/damage.ts#L375 | Med |
| 12 | Ancient Golem | 10x Total Damage | 9 -> 14 | 150/230 | 4700 | 1000 | vendor/parsers/damage.ts#L511 | High |
| 14 | Rift Jocund | 2x Kills for Opening Portals and Deathnote | 1 -> 1.5 | 135/185 | 3400 | 250 | vendor/parsers/damage.ts#L1567 | High |
| 15 | Leek Spirit | 3.50x faster Equinox Bar Fill Rate | 2.5 -> 4 | 110/160 | 2900 | 100 | vendor/parsers/world-3/equinox.ts#L82 | High from W3 |
| 16 | Crystal Capybara | 1.75x Lab EXP and Divinity EXP Gain | 0.75 -> 1 | 110/160 | 2800 | 100 | vendor/parsers/character.ts#L1125 | W4 lab |
| 17 | Biggole Mole | 3d Printer samples grow {1%/day for 100 days | 1 -> 2 | 100/150 | 2700 | 100 | vendor/parsers/world-3/printer.ts#L107 | High from W3 |
| 18 | Gigafrog | {25% Carry Capacity for all item types | 25 -> 35 | 80/125 | 2200 | 10 | vendor/parsers/misc.ts#L1162 | High early |
| 19 | Mashed Potato | {5% Ballot Bonus Multi (World 2 feature) | 5 -> 8 | 70/120 | 1900 | 10 | vendor/parsers/world-2/voteBallot.ts#L99 | Low |
| 20 | Flying Worm | {30 Talent Points for all classes | 30 -> 40 | 60/100 | 1800 | 10 | vendor/parsers/talents.ts#L599 | High |
| 21 | Poisonic Frog | +15% Defence | 15 -> 20 | 55/80 | 1500 | 5 | vendor/parsers/damage.ts#L1400 | Low |
| 22 | Quenchie | +15% Drop Rate | 15 -> 20 | 50/70 | 1400 | 5 | vendor/parsers/character.ts#L2407 | Med |
| 23 | Green Mushroom | +15% Accuracy | 15 -> 20 | 30/60 | 1300 | 5 | vendor/parsers/damage.ts#L1019 | Low |
| 24 | Cool Bird (cap 5x, Pet+ adds nothing past it) | 4x Coins from Mobs | 3 -> 5 | 100/150 | 2500 | 500 | vendor/parsers/character.ts#L2821 | High |
| 25 | Axolotl | {50% AFK Gains | 50 -> 70 | 110/150 | 2500 | 500 | vendor/parsers/character.ts#L3271 | High |
| 26 | Mallay (capped 1.30x both levels) | 1.30x Drop Rate | 0.3 -> 0.5 | 100/150 | 2900 | 500 | vendor/parsers/character.ts#L2543 | High |
| 27 | Spirit Reindeer (flat 2x in Toolbox) | 2.00x Gold Ball Shop Bonuses | 1 -> 1.5 | 150/240 | 3200 | 500 | vendor/parsers/world-2/arcade.ts#L93 | High W2 |
| 29 | Squirrel | 1.50x Kills for Opening Portals and Deathnote | 0.5 -> 0.75 | 115/170 | 2700 | 100 | vendor/parsers/damage.ts#L1574 | High |
| 30 | Mr Pig | 2x Friend Bonuses, {2 Friend Bonus Slots, Auto Loot, Storage Quickref Usage, Infinite Teleporting | 1 -> 1.5 | 110/160 | 3500 | 100 | vendor/parsers/misc.ts#L143 | High QoL |
| 31 | Wild Boar | {15% Hat Rack Bonus Multi | 15 -> 25 | 170/250 | 3900 | 100 | vendor/parsers/world-3/hatRack.ts#L48 | Low |
| 32 | Whale | 2x Class EXP gain and 2x All Skill EXP gain | 1 -> 1.5 | 125/189 | 2800 | 100 | vendor/parsers/character.ts#L1642,L2004 | High |
| 33 | Chippy | 2x Total Damage, and 2x Class EXP gain | 1 -> 1.5 | 100/150 | 2500 | 100 | vendor/parsers/damage.ts#L512,character.ts#L2002 | High |
| 34 | Bunny | 3x Class EXP gain | 2 -> 3 | 80/130 | 2200 | 100 | vendor/parsers/character.ts#L2005 | High |
| 35 | Panda | 2x Refinery Salts produced (affects POW produced in Refinery) | 1 -> 2 | 110/155 | 2500 | 100 | vendor/parsers/world-3/refinery.ts#L94 | High W3 |
| 36 | Hedgehog | {200% Gold Balls gained from the Arcade, | 200 -> 300 | 100/160 | 2600 | 100 | vendor/parsers/world-2/arcade.ts#L60 | Low |
| 37 | Whallamus (14.5x upgraded in code; +10*bonus Legend PTS) | 10x Class EXP and {10 Legend Talent PTS | 1 -> 1.5 | 150/250 | 4900 | 1000 | vendor/parsers/character.ts#L2001 | High |
| 38 | Balloonfish | 4x Coins from monsters, and 4x Masterclass drops | 3 -> 5 | 130/200 | 3800 | 250 | vendor/parsers/character.ts#L2822 | High |
| 41 | Crystal Cuttlefish | {40% Ballot Bonus Multi (World 2 feature) | 40 -> 50 | 105/150 | 2700 | 100 | vendor/parsers/world-2/voteBallot.ts#L100 | Low |
| 44 | Spearfish | {1 Friend Bonus slot | 1 -> 1 | 75/120 | 1800 | 10 | vendor/parsers/misc.ts#L144,L157 | Low |
| 45 | Equinox Broadbass | 1.50x Coins from monsters | 0.5 -> 1.5 | 65/100 | 1750 | 10 | vendor/parsers/character.ts#L2823 | Med |
| 46 | Mafioso | +15% faster Alchemy Brew Speed | 15 -> 25 | 60/90 | 1200 | 5 | vendor/parsers/world-2/alchemy.ts#L729 | Med W2 |
| 47 | Baby Boa | +10% Class EXP | 10 -> 15 | 55/80 | 900 | 5 | vendor/parsers/character.ts#L2127 | Low |
| 48 | Purp Mushroom | +5% Golden Food bonus | 5 -> 7 | 50/70 | 600 | 5 | vendor/parsers/misc.ts#L941 | Low |
| 50 | Santa Snake | {25% Class EXP, {25% Drop Rate, 1.01x Class EXP, and 1.01x Drop Rate | 25 -> 50 | 60/80 | 450 | 0 | vendor/parsers/character.ts#L2022,L2408 | Low |
| 51 | Santas Little Helper | 3x bonuses from Orion, Poppy, and Bubba (and all future Clickers) | 2 -> 4 | 130/225 | 2900 | 100 | vendor/parsers/world-1/owl.ts#L117; world-2/kangaroo.ts#L158; clickers/bubba.ts#L274 | High W1 |
| 87 | Rift Spooker | 3x Cooking Mastery EXP gain and {5 PTS for Cooking Mastery | 1 -> 1.5 | 160/240 | 3000 | 1 | vendor/parsers/world-4/cooking.ts#L362 | W4 late |
| 99 | Cryosnake | All Upgrade Vault upgrades are 50% cheaper! | 50 -> 75 | 100/140 | 1500 | 1 | vendor/parsers/misc/upgradeVault.ts#L73 | High |
| 111 | Clammie | {100% Class EXP and Drop Rate | 100 -> 150 | 60/100 | 1200 | 1 | vendor/parsers/character.ts#L2128,L2447 | High |
| 126 | Ricecake | 4x Summoning EXP gain | 3 -> 6 | 160/225 | 2700 | 1 | vendor/parsers/(W6 summoning) | Low |
| 128 | Baby Troll (additive Class EXP not modelled) | {100% Class EXP and 1.50x Class EXP Multi | 100 -> 300 | 100/140 | 1500 | 1 | vendor/parsers/character.ts#L2026 | High |
| 132 | Mama Troll | {100% Drop Rate and 1.50x Drop Rate Multi | 100 -> 300 | 175/265 | 3500 | 1 | vendor/parsers/character.ts#L2451 | High |
| 145 | Eggroll | 3x Class EXP gain | 2 -> 3 | 180/275 | 3000 | 1 | vendor/parsers/character.ts#L2007 | High |
| 155 | Vanillie | {2500% additive Gold Food bonus effect | 2500 -> 4000 | 175/250 | 3000 | 1 | vendor/parsers/misc.ts#L942 | High |
| 156 | Valenslime | {15% Total Damage | 15 -> 25 | 60/90 | 500 | 1 | vendor/parsers/damage.ts#L376 | Low |
| 157 | Mechanical Mouse | 2x Construction Build Speed | 100 -> 200 | 110/175 | 2100 | 1 | vendor/parsers/world-3/construction.ts#L127 | High W3 |
| 158 | Lucky Slug | {15% Drop Rate | 15 -> 20 | 65/100 | 1250 | 1 | vendor/parsers/character.ts#L2448 | Low |
| 159 | Potluck | 2.5x Coins from Mobs | 1.5 -> 3 | 110/170 | 2000 | 1 | vendor/parsers/character.ts#L2824 | High |
| 160 | Glunko The Massive (upgradedBonus = bonus, upgraded effects not modelled) | 3x Total Damage, 5x Class EXP gain, 1.5x Drop Rate | 1 -> 1 | 230/350 | 5400 | 1 | vendor/parsers/damage.ts#L513; character.ts#L2003,L2544 | High |
| 161 | Poppy | 2x bonuses from Bonus Ballot and Multi Meritocracy | 100 -> 150 | 235/380 | 5800 | 1 | vendor/parsers/world-2/voteBallot.ts#L36 | High W2 |
| 162 | Wickerlight Spirit | All meals are 5x cheaper to level up, and give 1.25x higher bonuses! | 1 -> 1.6 | 165/245 | 3000 | 1 | vendor/parsers/world-4/cooking.ts#L218 | High W4 |
| 168 | Crystal Glunko | 1.50x Damage, 1.40x Class EXP, 1.30x Drop Rate, and 1.20x extra Kills | 1 -> 1.5 | 210/310 | 4000 | 1 | vendor/parsers/damage.ts#L514; character.ts#L2006,L2547 | High |
| 169 | Bin Goosey | All daily ribbons have a 50% chance to be +1 Tier, 40% for +3 Tiers, and 10% for +5 Tiers | 1 -> 1 | 250/380 | 5900 | 1 | vendor/parsers/world-4/cooking.ts#L579 | Low |
| 170 | Magician Grub | 1.25x Total Damage | 0.25 -> 0.35 | 130/225 | 2500 | 1 | vendor/parsers/damage.ts#L516 | High |
| 171 | Armadillo | {100% additive Crystal Monster Spawn chance | 100 -> 175 | 180/300 | 4400 | 1 | vendor/parsers/character.ts#L3097 | High |
| 174 | Verminous | +10000% additive Gold Food bonus effect and 1.50x multiplier to Gold Food | 1 -> 2 | 280/410 | 6800 | 1 | vendor/parsers/misc.ts#L945 | High |

## Min-max by stage

[C61] Everything here is a dossier rating (M) built on the formulas above, not a published community order.

- **All stages (free):** daily pull, Tournament registration, Mart gems [C11][C15][C39].
- **W1 early:** the cheapest high-value targets are Gigafrog (+25% carry, 600 list) [C23][C51] and Flying Worm (+30 talent points, 500) [C17][C51]. Use free pulls (they are free and each is a new bonus). Cryosnake ($3.99 bundle) halves Upgrade Vault costs [C24][C13].
- **W1 mid:** Crystal Custard (+100% class EXP and DR, 1,250) [C19][C21][C51]; Dedotated Ram (storage from Quick Ref, 1,600) [C23][C51].
- **W1 late:** Rift Jocund and Squirrel for portal/Death Note kills [C30]; Rift Slug (+25 talent levels, 3,500) [C17][C51]; Ancient Golem (10x damage, 3,800) [C18][C51].
- **W2 early:** Sheepie (all big bubbles active, 375) [C25][C51]; Mafioso brew speed [C26]; Spirit Reindeer / Hedgehog / Slime for Arcade [C27].
- **W2 mid-late:** Santas Little Helper for Orion, Poppy, Bubba [C29]; ballot pets (Crystal Cuttlefish, Mashed Potato, Poppy) [C28].
- **W3:** Panda (Refinery) [C32], Leek Spirit (Equinox) [C33], Mechanical Mouse (Construction) [C34], Biggole Mole (Printer) [C31].
- **W4:** Wickerlight Spirit (meals), Rift Spooker (Cooking Mastery), Crystal Capybara (Lab) [C35][C37]; Pet+ upgrades once you own 50+ pets and Mart+ appears [C16].
- **Community meta:** the wiki highlights Whale, Crystal Custard and Bubba the Seal [C62]. Reddit favoured King Doot as a token pick despite its Divinity gate [C41]. Token target rule: pick a pet you cannot realistically pull or buy, never a no-bonus pet [C46]. Per class: pets are class-agnostic except where a bonus is class-specific (none found in W1-W4).
- **Spend Plan (dossier, M):** Sheepie 375 -> Flying Worm 500 -> Gigafrog 600 -> Crystal Custard 1,250 -> Dedotated Ram 1,600 -> Rift Jocund 2,900 -> Rift Slug 3,500 -> Ancient Golem 3,800, with Leek Spirit / Biggole Mole once W3 systems run [C51].

## ActiveOn gap list and sprites

- Existing state [C42]. Missing: owned-pet list, Pet+ levels, tokens, crystals, Mart offers vs Spend Plan, a dedicated Pets view (rule: features need a home), per-pet advice.
- Sprites to add (not present in `grids/`): pet-crystal currency, pet-bonus-token item, pet-treat items (4 tiers seen on the wiki, 5 Disputed), Pet Mart / Doggy building, Pet+ badge, plus optional per-pet portraits for the Spend Plan targets (Sheepie, Flying Worm, Gigafrog, Crystal Custard, Dedotated Ram, Rift Jocund, Rift Slug, Ancient Golem). Existing: `sys-pets`, `sys-pet-tournament`, `sys-pet-arena`, `item-pet-egg` [C42].

## Open questions

1. Treat tier count (4 vs 5) and prices (70 vs 100 crystal floor) and exact pity numbers are wiki-only and one patch old [C10][C49].
2. Does the game apply Biggole Mole's + level at the Printer? [C56]
3. Rift Jocund + text (3x) vs data (2.5x) [C30].
4. Free-to-play Pet Crystal income beyond recycling [C9].
5. Can Quest119 tokens still drop outside events? [C46]
6. Slime and Sandy Pot have no Toolbox call site [C60].
7. Community upgrade orders for Pet+ were not found [C61].
8. Does the game honour the Cool Bird and Mallay caps with Pet+ the way Toolbox does, and do Glunko Massive upgraded effects apply in game? [C69][C70]
9. Friend Bonus: no wiki or community source was reachable this pass (idleon.wiki/wiki/Friends is 404, search budget exhausted), so the friend level source and whether Skill EXP (stat 4) is consumed in game are Toolbox-only [C76][C77].
10. Pet Mart+ levels beyond 1, the Tournament points shop and Raid season order are not in any source we hold [C63][C65][C68].

## Claim register

- **[C1]** (tier 1, confidence H, verified 2026-10-19) Every owned pet's bonus is 'always active for all characters once obtained': account-wide, no equip slot, no per-character scope. Toolbox's `isCompanionBonusActive(account, idx)` is just `account.companions.list[idx].acquired`.
  - Source: https://idleon.wiki/wiki/Pets (fetched 2026-10-19); packages/toolbox-parsers/vendor/parsers/misc.ts#L1500
- **[C2]** (tier 3, confidence L, verified 2026-10-19) The game renamed Companions to Pets on 2026-02-20 (v1.05); Toolbox code and data still say 'companion' everywhere. ActiveOn's Account State uses `pets` and `petMart`, Toolbox's parsed key is `account.companions`.
  - Source: Prior research docs/research/systems/account-wide/companions-guild-family.md (origin/research/account-wide, 2026-10-17, wiki changelog); packages/toolbox-parsers/vendor/parsers/index.ts#L157
- **[C3]** (tier 1 for code, tier 2 for wiki point values, confidence M, **Disputed**, verified 2026-10-19) Tournament: runs once a day; wins accumulate points per season; divisions Bronze, Silver, Gold, Diamond, Master (Toolbox `tournyStuff.divisionNames`, scales [200,200,180,170,160,...]). The wiki lists Bronze 0 / Silver 14 / Gold 73 points for the first three. The player's division index is `OptionsListAccount[495]`; the bracket always starts at 1024 (Open Qualification then Round of 1024 ... Final); qualifying matches have 3 lives.
  - **Disputed (source lens refuted the citation, fact stands):** tournament.ts#L37-69 holds only bracket-round naming, not the daily cadence or division names. Correction: division names are in shared-data.json `tournyStuff.divisionNames` (L48593-48599); the daily cadence comes from `getCurrentTournamentDay` / `OptionsListAccount[496]` (see [C15]).
  - Source: vendor/data/website-data/shared-data.json `tournyStuff.divisionNames` (L48593-L48599); vendor/parsers/world-7/tournament.ts `getCurrentTournamentDay` (L48); https://idleon.wiki/wiki/Tournament (fetched 2026-10-19)
- **[C4]** (tier 2, confidence L, **Disputed**, verified 2026-10-19) Raids (v1.20): daily PvE pet battles with three difficulties (Molten Mayhem, The Burning Tribunal, Hellfire and Fury) each over five seasons; loot is pets from that difficulty's table. They drop raid pets (Magician Grub, Imperial Ogre, Pipsqueak, Armadillo ...) which become obtainable elsewhere after the raid. Only one copy of each pet counts in battle.
  - **Disputed (source lens refuted):** an earlier draft said 'five seasonal items'. The wiki says each difficulty spans five SEASONS. Game-data lens: unverifiable, only RD/RC/OLA[611] registration appears in Toolbox. Confidence L.
  - Source: https://idleon.wiki/wiki/Tournament/Raids (fetched 2026-10-19); prior research companions-guild-family.md
- **[C5]** (tier 3, confidence L, verified 2026-10-19) Pet Mart access on a W2-late account was confirmed in game by the owner on 2026-10-17 (Codex -> Quick Ref -> Tournament -> Pet Mart), so no world gate is assumed for the gem claim.
  - Source: packages/knowledge/systems/pets.yaml (notes, M6 Final rulings #34). Tier is 3: it is a project yaml recording an owner in-game observation, not game data; unverifiable here.
- **[C6]** (tier 1, confidence H, verified 2026-10-19) King Doot (idx 0): its Divinity effect reads 0 while the active character's Divinity level (Lv0[14]) is under 2, so it is dead weight before W5 Divinity. Also: Coral Kid's first upgrade becomes 'Ballthezar' (+Gold Balls) once King Doot is owned.
  - Added by verification: the gate uses the logged-in character (`getBestActiveCharacter`, divinity.ts#L325/L369/L386), not an account-wide level.
  - Source: vendor/parsers/world-5/divinity.ts#L385-L392; vendor/parsers/world-2/arcade.ts#L56-L59
- **[C7]** (tier 1, confidence M, verified 2026-10-19) Pets are NOT in the Firestore save document. Toolbox reads RTDB `_comp/{uid}` (type CompanionData) with fields: `l` owned copies as strings `"idx,tradable(1/0),?,?,level"`; `e` follower `"idx,..."`; `t` free-claim anchor; `s` Pet Crystals; `x` total boxes opened; `p` storage cap (default 60); `d` dead legacy field. IdleOn Forge's sync package reads the same path `_comp/${uid}`.
  - Source: vendor/parsers/misc.ts#L1385-L1395, #L1487-L1494; vendor/parsers/generated-firebase-types.ts#L792; packages/sync/src/listen.ts#L167
- **[C8]** (tier 1, confidence H, verified 2026-10-19) Pet+ (Pet Mart+, patch 2.3.525): a pet whose best owned copy has level >= 1 uses `upgradedBonus` and `upgradedTourPower` instead of `bonus` and `tourPower`. `level` is field index 4 of each `_comp.l` copy string and the game keeps the max across owned copies. The game's `CompLV2` flag (`isCompanionLvl2Active` = acquired AND level >= 1) additionally drives extra terms that are not in `upgradedBonus` (Dedotated Ram +30 carry, Spearfish +25 friend bonuses, Baby Troll +0.25 class EXP multi, Mama Troll +0.2 drop multi, Bin Goosey ribbon tiers). Baby Troll and Mama Troll terms were not re-checked by the verifiers (L for those two).
  - Added by verification: per-copy `tradableCount` and `upgradedTradableCount` are tracked and Pet+ level is the max across owned copies (misc.ts#L1393-L1414, L1464).
  - Source: vendor/parsers/misc.ts#L1385-L1475, #L1506; vendor/parsers/misc.ts#L1164, #L157; vendor/parsers/character.ts#L2026-L2028, #L2454; vendor/parsers/world-4/cooking.ts#L579-L580
- **[C9]** (tier 1, confidence L, verified 2026-10-19) Pet Crystals live in `_comp.s` (exposed as `companions.petCrystals`) and the game gates Pet Mart purchases on it. Sources: recycling tradeable non-free copies (data `filler` per pet; the recycle=filler mapping is unverified because no parser code reads `filler`, so L: 5 for Frog-class commons up to 2000 for King Doot, 1000 for Ancient Golem/Whallamus, 450 Rift Slug), and paid packs. Recycling the last copy removes its bonus (wiki, confirmation prompt). No free-to-play crystal income other than recycling was found.
  - Source: vendor/parsers/world-7/tournament.ts#L117-L121; vendor/data/website-data/companions.json `filler`; https://idleon.wiki/wiki/Pets (fetched 2026-10-19)
- **[C10]** (tier 2, confidence L, **Disputed**, verified 2026-10-19) Treats are bought with Pet Crystals; the wiki page fetched in verification shows FOUR tiers: Broccoli 70, Canned Fish 130, Chocolate Coin 200, Ice Cream Sandwich 250. The earlier draft listed five (adding Jawbreaker, from prior research Legacy set: Broccoli 100 -> Jawbreaker 250). Both views kept; the fetch may have been truncated. Prior research (other view): Legacy Broccoli 100 -> Jawbreaker 250; higher Legacy tiers unlock after 5/13/23/38 pets bought; newer sets have 4 tiers. Tier prices are NOT in Toolbox data (server/N.js only), so price numbers are wiki-tier and the 70 vs 100 floor is an unresolved discrepancy.
  - Source: https://idleon.wiki/wiki/Pets (fetched 2026-10-19); prior research companions-guild-family.md (wiki rev 2026-10-11)
- **[C11]** (tier 1, confidence H, verified 2026-10-19) Free pull claimable when `companions.freeClaimAnchor + 594,000,000 ms <= now` (real clock, not the save's GlobalTime). The free pull went weekly -> daily (v1.20, 2026-08-26) without changing the formula: on a claim the server writes `t = claimTime - 511,200,000` so the deadline lands 23 h out; `t` therefore reads about 5.9 days stale by design. `_comp.d` is dead.
  - Source: vendor/utility/helpers.js#L1165-L1189; vendor/parsers/misc.ts#L1485-L1491; https://idleon.wiki/wiki/Pets (daily pull, 2026-10-19)
- **[C12]** (tier 1, confidence M, verified 2026-10-19) Pet Mart (in the Tournament lobby, reached from Quick Ref): the server doc `_TOURNAMENT` carries 5 pets per counter: `I/B/A` for the base shop (companion index, list price, today's discounted price) and `LI/LB/LA` for Pet Mart+. Prices are Pet Crystals. Wiki: 5 server-chosen pets a day, discounts 10/15/20/30/50%. The server price wins over `companions.upgradeCost`.
  - Source: vendor/parsers/world-7/tournament.ts#L116-L148; https://idleon.wiki/wiki/Pet_Mart (fetched 2026-10-19)
- **[C13]** (tier 3, confidence L, verified 2026-10-19) Paid `bin_*` bundles give a specific pet plus gems and Pet Crystals: Cryology (Cryosnake) $3.99 + 500 crystals; Clammie $4.99; King Doot pack $9.99 + 1000 crystals. Never a requirement.
  - Source: Prior research companions-guild-family.md (website-data bundles, 2026-10-17)
- **[C14]** (tier 1, confidence H, verified 2026-10-19) Pet Bonus Token: `OptionsListAccount[605]` and `[615]` are each a 0/1 grant, so at most 2 tokens (`tokensOwned = min(1,o605)+min(1,o615)`). `OptionsListAccount[606]` is the comma list of pet indices a token was spent on; each listed pet counts as acquired with its base bonus. Since 2.3.540 the game wipes `[606]` every 5 s if its element count exceeds `0.5 + tokensOwned`, so an over-long list grants nothing. A string `"0"` in [606] means token spent on index 0, a numeric 0 means empty. The token list is treated as empty-or-wiped when longer than the token count, and the token grant ignores the Pet+ level [C47].
  - Source: vendor/parsers/misc.ts#L1411-L1436, #L1424-L1432
- **[C15]** (tier 1, confidence H, verified 2026-10-19) Daily registration: registering sets `OptionsListAccount[511]` to tournamentDay + 1, so not-yet-registered is `o[511] <= tournamentDay`. The day is `max(o[496], tournament.global.T)`. The alert needs at least one owned pet. `OptionsListAccount[498]` counts registrations. W7 raid mirrors it with `o[611]` and `global.RD`, closed flag `global.RC`. Tournament day = `max(OLA[496], global.T)` (tournament.ts#L48).
  - Source: vendor/utility/dashboard/account.js#L273-L295; vendor/parsers/world-7/tournament.ts#L62-L69; packages/knowledge/systems/pet-tournament.yaml
- **[C16]** (tier 2, confidence L, verified 2026-10-19) Pet Mart+ (the upgraded '+' version of a pet) appears when you own every pet in the day's Mart offer AND at least 50 pets; the base pet must already be owned; the cost is the pet's `upgradeCost` (subject to the same discounts). Pet+ releases began 2026-08-25; only a subset of pets (19 by 2026-10-06 per prior research) has been offered.
  - Source: https://idleon.wiki/wiki/Pet_Mart and https://idleon.wiki/wiki/Pets (fetched 2026-10-19); prior research companions-guild-family.md
- **[C17]** (tier 1, confidence H, verified 2026-10-19) Rift Slug (1): +25 (35) talent levels to all talents, applied in the level-add sum in talents.ts. Flying Worm (20): +30 (40) star talent points. Both are among the strongest W1-W4 pets.
  - Source: vendor/parsers/talents.ts#L367, #L599
- **[C18]** (tier 1, confidence H, verified 2026-10-19) Damage pets: Frog (10) +10/+15 and Valenslime (156) +15/+25 Total Damage (pre-softcap block); Ancient Golem (12) 10x/15x, Chippy (33) 2x/2.5x, Glunko The Massive (160) 3x/5x, Crystal Glunko (168) 1.5x/1.75x, Magician Grub (170) 1.25x/1.35x in a post-softcap product `max(1, (1+gol)(1+chippy)(1+2*glunko)(1+0.5*crystalGlunko)(1+grub))`. Verifier: correct but incomplete, the full set is Frog, Valenslime, Ancient Golem (idx 12), Chippy, Glunko Massive (1+2b), Crystal Glunko (1+0.5b), Magician Grub (1+b).
  - Source: vendor/parsers/damage.ts#L375-L376, #L511-L517
- **[C19]** (tier 1, confidence H, verified 2026-10-19) Class EXP pets: Crystal Custard (3) +100/+130 additive; Whale (32), Chippy (33), Bunny (34), Whallamus (37; `1+9*bonus`, so 14.5x upgraded in code versus 15x in the text), Eggroll (145), Glunko The Massive (160), Crystal Glunko (168) in a multiplicative block `max(1, (1+9*comp37)...)`; Baby Boa (47) +10/+15 additive; Clammie (111) +100/+150 additive. Verifier addendum (game-data lens): Class EXP also uses Eggroll 145, Glunko Massive 160, Crystal Glunko 168, Baby Boa 47, Clammie 111, Baby Troll 128 and Santa Snake 50 (all listed here or in [C54][C55]); Clammie feeds both Class EXP and drop.
  - Source: vendor/parsers/character.ts#L2001-L2007, #L2115-L2128
- **[C20]** (tier 1, confidence L, verified 2026-10-19) Skill pets: Molti (5) +5%/+8% All Skill Efficiency; Bloque (9) +20/+30 Skill EXP; Whale (32) 2x/2.5x All Skill EXP (`AllSkillxpMULTI` excludes smithing, alchemy and construction); Bored Bean (6) +5/+8 AFK gains rate for fighting and skills; Axolotl (25) +50/+70 AFK gains.
  - Source: vendor/parsers/efficiency.ts#L165; vendor/parsers/character.ts#L1687, #L1642-L1650, #L3270-L3271
- **[C21]** (tier 1, confidence H, verified 2026-10-19) Drop Rate pets: Crystal Custard (3), Quenchie (22) +15/+20, Santa Snake (50), Clammie (111), Lucky Slug (158) +15/+20, Mama Troll (132), Mallay (26) 1.30x/1.50x, Glunko The Massive (160) 1.5x/2x, Crystal Glunko (168) 1.3x/1.45x.
  - Addendum: Santa Snake's drop term is `bonus/2500`, capped at 1.01x.
  - **Disputed (game-data lens refuted):** Mallay is clamped at `Math.min(1.3, 1+bonus)` (character.ts#L2585, #L2665), so it stays 1.30x when upgraded. Glunko The Massive drop is `1 + 0.5*bonus` and companions.json idx 160 has `bonus` 1 and `upgradedBonus` 1, so Toolbox gives 1.5x at both levels (the effect text says 2x upgraded). Crystal Glunko 1.30x/1.45x stands. Correction: Mallay 1.30x both levels, Glunko Massive 1.5x both levels in Toolbox.
  - Source: vendor/parsers/character.ts#L2406-L2408, #L2447-L2454, #L2543-L2547
- **[C22]** (tier 1, confidence L, verified 2026-10-19) Coin pets: Cool Bird (24) 4x/5x (capped, see Disputed), Balloonfish (38) 4x/6x, Equinox Broadbass (45) 1.5x/2.5x, Potluck (159) 2.5x/4x, all separate multipliers in `getCoinsMulti`.
  - **Disputed (game-data lens refuted):** the original text said Cool Bird 4x/6x. Cool Bird is clamped at `1 + Math.min(4, bonus)` (character.ts#L2852, #L2903, 'Max x5'), so upgraded (bonus 5) gives 5x, not 6x; the effect text says 6x. Balloonfish 4x/6x (uncapped), Broadbass 1.5x/2.5x and Potluck 2.5x/4x stand (Broadbass and Potluck share the min(4, bonus) clamp, see [C69]).
  - Source: vendor/parsers/character.ts#L2821-L2824
- **[C23]** (tier 1, confidence H, verified 2026-10-19) Gigafrog (18): carry capacity `(1 + bonus/100)` with 25 (35 upgraded); Dedotated Ram upgraded adds a flat +30 inside the prayer/bribe bracket. Ram base: 'Storage Chest anywhere in Quickref' (QoL, no formula).
  - Source: vendor/parsers/misc.ts#L1162-L1175
- **[C24]** (tier 1, confidence M, verified 2026-10-19) Cryosnake (99): every Upgrade Vault upgrade costs `max(0.1, 1 - bonus/100)` x, i.e. 50% cheaper (75% upgraded), stacking multiplicatively with Darts and Sushi discounts.
  - Source: vendor/parsers/misc/upgradeVault.ts#L68-L80, #L197
- **[C25]** (tier 1, confidence H, verified 2026-10-19) Sheepie (4): all big bubbles count as equipped (`getActiveBubbleBonus` returns the bubble bonus for any bubble) and also covers the Call Me Bob construction-EXP check.
  - Source: vendor/parsers/world-2/alchemy.ts#L381-L386; vendor/parsers/character.ts#L3692-L3705
- **[C26]** (tier 1, confidence L, verified 2026-10-19) Alchemy pets: Mafioso (46) +15/+25 brew speed; Sheepie (see above). Poisonic Frog (21) +15/+20 Defence, Green Mushroom (23) +15/+20 Accuracy.
  - Source: vendor/parsers/world-2/alchemy.ts#L729-L733; vendor/parsers/damage.ts#L1019, #L1400
- **[C27]** (tier 1, confidence H, verified 2026-10-19) Arcade pets: Spirit Reindeer (27) doubles Gold Ball Shop bonuses (`companionBonus = acquired ? 2 : 1`), Hedgehog (36) +200/+300% gold balls earned. Slime (7) 'Golden Balls +25/+50%' has no Toolbox call site. Hedgehog is idx 36. Verified: arcade.ts#L93 hardcodes x2 when active, so the upgraded 2.5x is not modelled (also true of Spirit Reindeer 27, Wickerlight 162 and the Santa Snake cap: none are Pet+ aware). Toolbox applies a flat 2x for Spirit Reindeer at both levels (arcade.ts#L93), so the upgraded 2.5x in companions.json is not modelled.
  - Source: vendor/parsers/world-2/arcade.ts#L60-L62, #L93; grep of vendor/parsers for `isCompanionBonusActive(.., 7)` returned nothing
- **[C28]** (tier 1, confidence H, verified 2026-10-19) Bonus Ballot / Meritocracy pets: Crystal Cuttlefish (41) +40/+50, Mashed Potato (19) +5/+8, Pufferblob (39) +50/+75 Meritocracy multi, Poppy (161) 2x/2.5x. Poppy (161) also feeds the meritocracy/ballot at voteBallot.ts#L36. Their sinks are vote ballot parsing (W2 weekly vote), meritocracy is W7.
  - Source: vendor/parsers/world-2/voteBallot.ts#L35-L36, #L99-L100
- **[C29]** (tier 1, confidence H, verified 2026-10-19) Santas Little Helper (51): the bonus multiplies Orion (Owl), Poppy (Kangaroo) and Bubba clicker bonuses as `(1 + bonus)` with bonus 2 (4 upgraded): 3x / 5x.
  - Source: vendor/parsers/world-1/owl.ts#L117-L121; vendor/parsers/world-2/kangaroo.ts#L158-L162; vendor/parsers/clickers/bubba.ts#L274
- **[C30]** (tier 1, confidence L, verified 2026-10-19) Portal and Death Note kill multipliers are factors in the KillPerKill product: Rift Jocund (14) `1 + bonus` (data 1 -> 2x; upgraded data 1.5 -> 2.5x while its effect text says 3x: a data vs text discrepancy) and Squirrel (29) `1 + bonus` (1.5x, 1.75x upgraded).
  - Source: vendor/parsers/damage.ts#L1519-L1522, #L1567-L1574; vendor/data/website-data/companions.json idx 14, 29
- **[C31]** (tier 1, confidence H, verified 2026-10-19) Biggole Mole (17): 3D Printer samples grow by `o[354]` days x 1% per day: `1 + o[354] * isCompanionBonusActive / 100` (o[354] is the days-since-sample counter, capped by the 100-day text).
  - Source: vendor/parsers/world-3/printer.ts#L107
- **[C32]** (tier 1, confidence M, verified 2026-10-19) Panda (35): Refinery Power per Cycle = `floor(min(250000, rank^1.3 * (1 + bonus)))`, so 2x salts base, 3x upgraded; the cap is 250,000 power and the max useful rank shrinks to `ceil((250000/(1+bonus))^(1/1.3))`.
  - Source: vendor/parsers/world-3/refinery.ts#L90-L102
- **[C33]** (tier 1, confidence L, verified 2026-10-19) Leek Spirit (15): Equinox Bar fill-rate multiplier `1 + bonus` (data 2.5 -> 3.5x, 4 -> 5x upgraded), applied at two places (the rate and a second `1 + 2.5*bonus` factor at line 172).
  - Source: vendor/parsers/world-3/equinox.ts#L82, #L113, #L141, #L172
- **[C34]** (tier 1, confidence L, verified 2026-10-19) Mechanical Mouse (157): construction build speed multiplier `(1 + bonus/100)` with bonus 100 (200 upgraded): 2x / 3x.
  - Source: vendor/parsers/world-3/construction.ts#L126-L131
- **[C35]** (tier 1, confidence L, verified 2026-10-19) Wickerlight Spirit (162): meals level up cheaper and give a higher bonus (data 1 -> 1.6 upgraded; effect text 5x cheaper / 1.25x bonus, 8x / 1.40x upgraded); Rift Spooker (87): 3x/4x Cooking Mastery EXP (+5/+7.5 PTS); Bin Goosey (169): daily ribbons +1/+3/+5 tier chances (+4/+8 upgraded).
  - Source: vendor/parsers/world-4/cooking.ts#L218, #L362-L365, #L579-L580, #L1049
- **[C36]** (tier 1, confidence L, verified 2026-10-19) Gold Food pets: Purp Mushroom (48) +5/+7 additive, Vanillie (155) +2500%/+4000% additive, Verminous (174) +10000%/+20000% additive AND a multiplicative 1.5x/2x. Cards cap separately (50 each).
  - Source: vendor/parsers/misc.ts#L941-L952
- **[C37]** (tier 1, confidence L, verified 2026-10-19) Crystal Capybara (16): Lab EXP gain `1 + bonus` (0.75 -> 1.75x; 1 -> 2x upgraded) in the lab skill EXP (character.ts#L1125) and Divinity EXP (character.ts#L1248).
  - Source: vendor/parsers/character.ts#L1125-L1182, #L1248-L1285
- **[C38]** (tier 1, confidence H, verified 2026-10-19) Mr Pig (30): Friend Bonus slots = min(20, 2 + (Spearfish bonus) + 2*(Mr Pig bonus) + event shop 22), Friend Bonus multiplier `1 + (100*MrPigBonus + 25*SpearfishLvl2)/100`. Plus auto loot, Storage Quick Ref, infinite teleports (effect text).
  - Source: vendor/parsers/misc.ts#L143-L158; vendor/data/website-data/companions.json
- **[C39]** (tier 1, confidence M, verified 2026-10-19) Pet Mart free gems: claimable when `tournament.global.S` (server shop day) > `OptionsListAccount[516]` AND server var `GemPM_x >= 0.1` (and S >= 1). Amount up to ~150 gems/day per prior research (unverified here).
  - Source: vendor/utility/dashboard/account.js#L264-L271; packages/account-state/src/unspent.ts#L306-L317; packages/knowledge/systems/pets.yaml
- **[C40]** (tier 1, confidence L, verified 2026-10-19) The sample W2 and W3 accounts own only 2 and 4 pets, all minor, and have opened 3 and 5 boxes lifetime (`_comp.x`); both have 0 Pet Bonus Tokens.
  - Source: Prior research companions-guild-family.md (fixture aggregates, 2026-10-17)
- **[C41]** (tier 4, confidence L, verified 2026-10-19) Community (Reddit r/idleon thread 1uc0az9, 2026-06-21): token players favoured King Doot but its bonus is 0 before Divinity level 2; do not token Abacus Frog, Pipsqueak, Glunko Supreme (no bonus).
  - Source: Prior research companions-guild-family.md citing https://www.reddit.com/r/idleon/ 1uc0az9 (2026-06-21; pre-patch for Pet+ and daily pull)
- **[C42]** (tier 1, confidence L, verified 2026-10-19) ActiveOn today: `account.pets {freeClaimAnchor, owned, sheepie}` and `account.petMart {unlocked, lastClaimedShopDay, currentShopDay, gemsOffered}` in unspent-types.ts; `petTournament {registeredThroughDay, day, registrationClosed, petsOwned}` in slots-types.ts; detectors `pets/free-pull`, `pets/mart-gems`, and a checklist row `pet-tournament.check.register`. Nothing tracks which pets are owned, Pet+ levels, tokens, crystals, or per-pet advice. Sprites that exist: `sys-pets`, `sys-pet-tournament`, `sys-pet-arena`, `item-pet-egg`.
  - Source: packages/account-state/src/unspent-types.ts#L87-L108; packages/account-state/src/slots-types.ts#L100-L108; packages/knowledge/detectors/pets/; apps/activeon/src/art/sprites/grids/systems.ts#L161, #L336, #L1073; grids/items.ts#L539
- **[C43]** (tier 1, confidence H, verified 2026-10-19) Pet storage cap is `_comp.p` (default 60); the game stores owned copies as separate strings (duplicates count against it).
  - Source: vendor/parsers/misc.ts#L1386
- **[C44]** (tier 1, confidence H, verified 2026-10-19) companions.json has 178 rows (index 0-177). Corrected by both verifiers (the earlier '100 real pets' was wrong): 176 rows carry a `name`; of those 9 are Champions (idx 150-152, 164-166, 175-177: tourPower 10, no upgradeCost) leaving 167 named non-champion rows; 2 rows (93 rawName `shovel`, 97 `slimmer`) are nameless 'Not_officially_in_the_game' placeholders. Some named rows (for example Lampar 121) carry the same placeholder effect text and must be ignored. Glunko Supreme (idx 11) also has tourPower 10. Groups: Legacy Pets idx 0-10, Fallen Spirits 12-23, Shallow Waters 37-48, Exclusive (50 idx), Special (11, 150-152, 160, 161, 164-166, 169, 173-177).
  - Source: packages/toolbox-parsers/vendor/data/website-data/companions.json; vendor/data/website-data/shared-data.json `companionGroups`
- **[C45]** (tier 1, confidence H, verified 2026-10-19) Multiplier-style pets store `bonus` as (multiplier - 1) or as a raw additive number, and each call site decides the form: Whale bonus 1 enters as `1 + companionBonus` (2x), Glunko The Massive bonus 1 enters as `1 + 2*bonus` (3x), Crystal Glunko 1.5 as `1 + 0.5*bonus`, Ancient Golem bonus 9 as `1 + 9` (10x). So the numeric data field cannot be shown to players without a per-pet formatter; the `effect` string is the player-facing text.
  - Source: vendor/parsers/damage.ts#L511-L517; vendor/parsers/character.ts#L1642; vendor/data/website-data/companions.json
- **[C46]** (tier 3, confidence L, verified 2026-10-19) Tokens are refunded if you later obtain the pet, and refunded for Glunko Supreme and Champion pets (they carry no real bonus). The token is used from the Trade popup by double-clicking a player. Whether the Quest119 token can still drop outside an event is unverified.
  - Source: Prior research companions-guild-family.md (N.js `PetBonusTokensOwned` @10978993, 2026-10-17); packages/toolbox-parsers/vendor/parsers/misc.ts#L1411
- **[C47]** (tier 1, confidence H, verified 2026-10-19) A Pet Bonus Token or the Toolbox 'what if I owned this pet' simulation only ever grants the BASE bonus; the + level of a token pet is always 0.
  - Source: vendor/parsers/misc.ts#L1453-L1456
- **[C48]** (tier 2, confidence L, verified 2026-10-19) Free-pull pets recycle for 0 Pet Crystals (wiki), and the wiki states the free pull happens at Doggy / the Pet Park; the 'Legacy' button pulls from the Legacy set.
  - Source: https://idleon.wiki/wiki/Pets (fetched 2026-10-19; the Legacy button detail from prior research, wiki rev 2026-10-11)
- **[C49]** (tier 2, confidence L, verified 2026-10-19) Pity: wiki says 'King Doot is guaranteed if not found within 200 treats'. Prior research adds newer-set pity (Rare guaranteed at 10 treats of tier 2, Unique at 20, Mythic at 30) and that unlocking Legacy tier 5 removes Legacy common pets from the pool. The latter numbers were read from the wiki one patch ago (rev 2026-10-11): Stale-risk.
  - Source: https://idleon.wiki/wiki/Pets (fetched 2026-10-19); prior research companions-guild-family.md
- **[C50]** (tier 2, confidence L, verified 2026-10-19) Wiki tier-1 odds per set (prior research table): Legacy 0.28% King Doot, 1% Rift Slug, 2.5% Dedotated Ram / Crystal Custard, 11.11% Sheepie / Molti / Bored Bean, 15.09% Slime / Sandy Pot / Bloque / Frog. Fallen Spirits 0.2% Ancient Golem ... 26.66% commons. Shallow Waters 0.2% Whallamus ... 26.66% commons. Not derivable from Toolbox.
  - Source: Prior research companions-guild-family.md pet table (wiki rev 2026-10-11)
- **[C51]** (tier 2, confidence L, verified 2026-10-19) Pet Mart base shop sells pets at the wiki's full price per pet (e.g. Sheepie 375, Flying Worm 500, Gigafrog 600, Crystal Custard 1,250, Dedotated Ram 1,600, Rift Slug 3,500, Ancient Golem 3,800). Exclusive pets mostly have no Mart price ('-').
  - Source: Prior research companions-guild-family.md pet table (wiki rev 2026-10-11, Stale-risk: prices not in game data)
- **[C52]** (tier 1, confidence H, verified 2026-10-19) Each pet has `tourPower` (10 for Champion/Glunko Supreme up to 480 for Pipsqueak; 650 upgraded) and `upgradedTourPower`; the game reads CompanionDB[9] for an upgraded copy and [7] otherwise. Toolbox leaderboard totals the tourPower of listed companion indices. Duels: a pet wins with its power over the two pets' combined power (wiki Raids), battles run frontline vs frontline, loser eliminated.
  - Source: vendor/parsers/misc.ts#L1469-L1473; vendor/parsers/world-7/tournament.ts#L113-L116; https://idleon.wiki/wiki/Tournament/Raids (fetched 2026-10-19)
- **[C53]** (tier 1, confidence H, verified 2026-10-19) One pet can be the visible follower (`_comp.e`, string 'idx,...'); this has no bonus effect.
  - Source: vendor/parsers/misc.ts#L1387-L1388
- **[C54]** (tier 1, confidence L, verified 2026-10-19) Santa Snake (50): Class EXP additive +25 (50 upgraded) in the ExpGainLUK6 sum, a 1.01x cap multi (`max(1,min(1.01,1+bonus/2500))`), and Drop Rate additive +25/+50 (`fourthCompanionDropRate`).
  - Source: vendor/parsers/character.ts#L2022, #L2025-L2028, #L2115-L2116, #L2408
- **[C55]** (tier 1, confidence L, verified 2026-10-19) Baby Troll (128): additive +100% (+300% upgraded) Class EXP plus a multiplier `1 + min(0.5,bonus) + 0.25*lvl2` (1.50x, 1.75x when upgraded). Mama Troll (132): additive +100% (+300%) Drop Rate plus a multiplier clamped to 1.50x (`min(0.5,bonus)`) with +0.2 when upgraded (1.70x). The multipliers are right, but Toolbox has no additive Class EXP term for Baby Troll (comp128 is used only in `babyTrollMulti`), so the +100/+300 Class EXP text is not modelled; Mama Troll's additive Drop Rate is applied.
  - Source: vendor/parsers/character.ts#L2022-L2030, #L2451-L2456; vendor/data/website-data/companions.json
- **[C56]** (tier 1, confidence H, verified 2026-10-19) Toolbox's printer line multiplies by the boolean `isCompanionBonusActive` rather than the pet's `bonus`, so an upgraded Biggole Mole (data +2%/day) would still read +1%/day. Either Toolbox under-counts or the game ignores the + level on this line; the pet's effect text says +2%/day. Unresolved. Verified: printer.ts#L107 multiplies `accountOptions[354]` by a boolean, so the upgraded 2%/day is not modelled.
  - Source: vendor/parsers/world-3/printer.ts#L107; vendor/data/website-data/companions.json idx 17
- **[C57]** (tier 1, confidence M, verified 2026-10-19) Wild Boar (31): Hat Rack bonus multiplier +15%/+25%, added to the hat count in `world-3/hatRack.ts#L48`.
  - **Disputed (source lens refuted, game-data lens confirmed):** the earlier text labelled this a W7 Spelunking system. The file is under `world-3/`, so the label was unsupported and is dropped. Correction: Hat Rack is a W3 system.
  - Source: vendor/parsers/world-3/hatRack.ts#L48
- **[C58]** (tier 1, confidence L, verified 2026-10-19) The W4 Breeding system ('breeding pets', Pet Arena, genes, shiny pets) is a different system from Companions. Data: petStats.json, shared-data `petGenes`/`petUpgrades`. It has its own topic (`breeding`) and sprites `sys-pet-arena`; do not merge it into this dossier. One cross-link: Breeding's Pet Arena crucible adds to class EXP and the Companions block (`getPetArenaCrucBonus(15)`).
  - Source: vendor/data/website-data/petStats.json; vendor/parsers/character.ts#L2031-L2033; apps/activeon/src/art/sprites/grids/systems.ts#L1073
- **[C59]** (tier 1, confidence H, verified 2026-10-19) The per-pet table below (bonus, Pet+ bonus, tourPower, upgrade cost, recycle value) is read directly from companions.json (game version 2.3.540); the 'W1-W4 value' column is this dossier's rating, not game data.
  - Source: packages/toolbox-parsers/vendor/data/website-data/companions.json
- **[C60]** (tier 1, confidence L, verified 2026-10-19) The 'Sink' column gives the Toolbox parser line where each pet's bonus is consumed; a pet with no sink listed has no Toolbox call site (Slime 7, Sandy Pot 8 base stats) so its effect is game-text only.
  - Source: packages/toolbox-parsers/vendor/parsers/ (greps of isCompanionBonusActive, 2026-10-19)
- **[C61]** (tier 4, confidence L, verified 2026-10-19) No community-published upgrade order for Pet+ purchases or for treat tiers was found: web search budget was exhausted in this run and the wiki pages fetched give only generic tips. The Pet Crystal spend order below is derived from Toolbox formulas and wiki Mart prices (dossier rating, M).
  - Source: https://idleon.wiki/wiki/Pets (fetched 2026-10-19); this dossier
- **[C62]** (tier 2, confidence L, verified 2026-10-19) Wiki tips: prioritise high-impact pets such as Whale (2x Class/Skill EXP), Crystal Custard (130% DR when upgraded) and Bubba the Seal (50-75% Gallery bonus when upgraded); match pets to your playstyle and world.
  - Source: https://idleon.wiki/wiki/Pets (fetched 2026-10-19)
- **[C63]** (tier 1 for code, tier 2 for wiki, confidence L, verified 2026-10-19) Pet Mart+ upgrade-level economy: Toolbox only distinguishes level 0 from level >= 1 (`isCompanionLvl2Active`); each pet has one `upgradeCost` in companions.json (the Pet+ price, which differs from the base list prices in [C51]). Whether higher levels exist is not in any source we hold.
  - Source: vendor/parsers/misc.ts#L1385-L1475, #L1506; vendor/data/website-data/companions.json `upgradeCost`
- **[C64]** (tier 1, confidence H for data, M for Raid stacking, verified 2026-10-19) Champion pets (idx 150-152, 164-166, 175-177) all have tourPower 10 (Glunko Supreme also 10); real pets range up to 480 base and 650 upgraded. Duel and stacking rules in Raids are wiki-only (see [C52]).
  - Source: vendor/data/website-data/companions.json; vendor/parsers/misc.ts#L1469-L1473; vendor/parsers/world-7/tournament.ts#L113-L116
- **[C65]** (tier 1 for data, confidence M, verified 2026-10-19) Tournament points: `shared-data.json` `tournyStuff` has `divisionPointReqs` [2,2,2,2,2,3,3,4,4,5,5] and `divisionScales` (starting 200,200,180,170,160). The points shop and its rewards are not in Toolbox data (unverified, L).
  - Verification: `divisionScales` has 8 entries, `divisionPointReqs` has 11, `divisionNames` has 5 (Bronze..Master), so the mapping between the three arrays is unresolved (L). Line references corrected: `divisionNames` L48593-L48599, `divisionPointReqs` from L48609; cite L48590-L48620.
  - Source: vendor/data/website-data/shared-data.json#L48590-L48620
- **[C66]** (tier 1/2 mix, confidence L, verified 2026-10-19) Gems and paid bundles are a separate shop from Pet Crystals: free Mart gems [C39] and `bin_*` bundles [C13] are server-side; Toolbox only reads `GemPM_x` and `OLA[516]`.
  - Note: account.js is tier 1/2 Toolbox code, not wiki tier 2; the wiki Pet Mart page says purchases use Pet Crystals only, so gems are a separate flow (`GemPM_x`, `OLA[516]`).
  - Source: vendor/utility/dashboard/account.js#L264-L271; https://idleon.wiki/wiki/Pet_Mart; prior research companions-guild-family.md
- **[C67]** (tier 1, confidence L, verified 2026-10-19) Trade popup and copy rules: each owned copy string in `_comp.l` carries a tradable flag (field 1); only tradable copies can be recycled for crystals; the Bonus Token is spent from the Trade popup [C46]. The cited code covers only the per-copy tradable flag (H); 'only tradable copies recycle' is wiki-only (the wiki says tradeable pets recycle) and unverified in code (L).
  - Source: vendor/parsers/misc.ts#L1385-L1395; vendor/parsers/misc.ts#L1411-L1436
- **[C68]** (tier 2, confidence L, verified 2026-10-19) Raid season rotation: the wiki describes five seasonal iterations; Toolbox only exposes today's raid registration (`OLA[611]`, `global.RD`, `global.RC`). Raid pets 170-173 exist in companions.json (Magician Grub 170, Armadillo 171 and others). Rotation order is not in any source we hold.
  - Source: https://idleon.wiki/wiki/Tournament/Raids (fetched 2026-10-19); vendor/parsers/world-7/tournament.ts#L62-L69; companions.json
- **[C69]** (tier 1, confidence H, **Disputed**, verified 2026-10-19) Caps: Cool Bird (24), Equinox Broadbass (45) and Potluck (159) use `1 + min(4, bonus)` so they cap at x5; Mallay (26) caps at 1.30x at both levels. Pet+ adds nothing past those caps.
  - **Disputed (game-data lens refuted the earlier wording):** the 5x cap applies to Cool Bird, Broadbass and Potluck only. Balloonfish (38) is `1 + bonus` with no cap (character.ts#L2852-L2855). Source lens: unverifiable in detail.
  - Source: vendor/parsers/character.ts#L2585, #L2665, #L2852-L2855, #L2903
- **[C70]** (tier 1, confidence H for Glunko, M for King Doot, verified 2026-10-19) Unmodelled upgraded effects: Glunko The Massive (160) has `upgradedBonus` equal to `bonus` (1), so Toolbox cannot reflect its upgraded 5x damage, 9x Class EXP and 2x Drop Rate; Baby Troll's +100/+300 Class EXP additive and King Doot's upgraded 1.25x Divinity PTS have no Toolbox call site.
  - Source: vendor/data/website-data/companions.json idx 0, 128, 160; vendor/parsers/character.ts; vendor/parsers/world-5/divinity.ts
- **[C71]** (tier 1, confidence H, verified 2026-10-19) Whallamus (37) also adds `10 * bonus` Legend Talent PTS (15 upgraded) in the legend talent total.
  - Source: vendor/parsers/world-7/legendTalents.ts#L191-L192, #L213
- **[C72]** (tier 1, confidence L, verified 2026-10-19) Other sinks: Balloonfish (38) multiplies Masterclass drops (misc.ts#L1782); Crystal Capybara (16) boosts Divinity EXP; Crystal Glunko (168) adds `1 + 0.2*bonus` extra kills; Glimbo (154, 1.6x/2x kills multi and Sailing artifact find, sailing.ts#L724-L725), Squirrel (29) and Rift Jocund (14) feed the kill-per-kill chain; Samurai Guardian (13) gives 3x/4x Villager EXP and +25/+33 opals (hole.ts#L631, menagerie.ts#L255); Pet Arena crucible Class EXP term is `20 * getPetArenaCrucBonus(15)`.
  - Source: vendor/parsers/misc.ts#L1782; vendor/parsers/character.ts#L1248; vendor/parsers/damage.ts#L1519-L1574; vendor/parsers/world-5/sailing.ts#L724; vendor/parsers/world-5/hole.ts#L631; vendor/parsers/world-7/menagerie.ts#L255; companions.json idx 13

- **[C73]** (tier 1, confidence H, verified 2026-10-19; game 2.3.540) Friend Bonus slots = `Math.round(Math.min(20, 2 + (Spearfish acquired ? bonus : 0) + 2*(Mr Pig acquired ? bonus : 0) + (getEventShopBonus(22) ? 1 : 0)))`. Mr Pig bonus 1 (base) or 1.5 (Pet+) so +2 or +3 slots; Spearfish bonus 1 (both tiers) so +1. Game effect text: Mr Pig "{2 / {3 Friend Bonus Slots", Spearfish "{1 Friend Bonus slot".
  - Source: vendor/parsers/misc.ts#L132-L157; vendor/data/website-data/companions.json idx 30, 44
- **[C74]** (tier 1, confidence H, verified 2026-10-19) Friend Bonus multiplier = `1 + (100*MrPigBonus + SpearfishLvl2Flag*25)/100`; effect text "2x" (Pig), "2.5x" (Pig Pet+), "+25% Friend Bonuses" (Spearfish Pet+, flat, unscaled, CompLV2 = acquired and level >= 1).
  - Source: vendor/parsers/misc.ts#L158-L162, #L1500-L1511; companions.json idx 30, 44
- **[C75]** (tier 1, confidence H, verified 2026-10-19) Friend bonus list is read from `accountOptions[476]`, a `;`-separated string of `statIndex,level,friendName`; `0` or empty means none; only the first `slots` entries are applied; later entries for the same stat overwrite earlier ones. Event-shop bonus ids are checked as letters in `accountOptions[311]`.
  - Source: vendor/parsers/misc.ts#L159-L190, #L1938-L1941
- **[C76]** (tier 1, confidence H, verified 2026-10-19) `getFriendBonusQuantity(stat, L)`: L clamped to 0..30000; `scaling = min(1.5, 0.25 + L/(L+12000)*1.5)`; base 100/30/50/25/30/40/10 for stats 0..6 (Total Damage, Class EXP, Skill Efficiency, Drop Rate, Skill EXP, more Coins, Extra Kills). Derived: scaling is 0.25 at L=0, 1.0 at L=12000, about 1.32 at L=30000.
  - Source: vendor/parsers/misc.ts#L132-L140, #L198-L225
- **[C77]** (tier 1, confidence M, verified 2026-10-19) Consumers of `getFriendBonus(account, i)`: i=0 damage.ts#L320; i=1 character.ts#L2126; i=2 efficiency.ts#L160; i=3 character.ts#L2444; i=5 character.ts#L2782; i=6 damage.ts#L1558. No call site for i=4 (Skill EXP) in the pinned parsers (grep over vendor/parsers).
  - Source: vendor/parsers/misc.ts#L225-L227 and the files listed

- **[C78]** (tier 2, confidence L, verified 2026-10-19) Added by verification, Raid combat sim and loot: Raids are a daily pet battle where each team's strength is the sum of its pets' `tourPower` (or `upgradedTourPower` for Pet+ copies); three named difficulties (Molten Mayhem, The Burning Tribunal, Hellfire and Fury), five seasons each, with raid pets (Magician Grub, Imperial Ogre, Pipsqueak) in each difficulty's loot table. Only registration state is in Toolbox; the sim, tables and season order are not (tracking them needs wiki data, tier 2).
  - Source: https://idleon.wiki/wiki/Tournament/Raids (fetched 2026-10-19); vendor/data/website-data/companions.json `tourPower`
- **[C79]** (tier 1, confidence M, verified 2026-10-19) Added by verification, tournament match history and qualification: the bracket tracks qualifying lives and a match history (hearts) per season; points requirements per division are in `divisionPointReqs` (see [C65]). Toolbox exposes lives and global day only; match history parsing was not re-read.
  - Source: vendor/parsers/world-7/tournament.ts#L37-L69; vendor/data/website-data/shared-data.json `tournyStuff`
- **[C80]** (tier 1, confidence H, verified 2026-10-19) Added by verification, kill-multiplier pets: Rift Jocund (14), Squirrel (29), Glimbo (154, bonus 0.6 -> 1: `1 + bonus` kills multi plus 2x Sailing artifact find, sailing.ts#L725) and Crystal Glunko (168, 0.2x extra kills) feed the kill chain in damage.ts#L1519-L1574.
  - Source: vendor/parsers/damage.ts#L1519-L1574; vendor/parsers/world-5/sailing.ts#L725; companions.json idx 14, 29, 154, 168
- **[C81]** (tier 1, confidence H, verified 2026-10-19) Added by verification, AFK and W7 pets: Axolotl (25, +50/+70 AFK gains) and Bored Bean (6, +5/+8 AFK gains rate) in character.ts#L3270-L3271; RIP Tide (28, +30/+40 AFK gains for W7 skills, also a Gallery showcase slot; character.ts#L3573, gallery.ts#L370); Shellslug (40, coral, coralReef.ts#L297); Eamsy Earl (42, gallery.ts#L345); Bubba the Seal (49, gallery.ts#L319); Samurai Guardian (13, Villager EXP and opals, `upgradedBonus` 1.34, hole.ts#L631, menagerie.ts#L255).
  - Source: the files cited; companions.json idx 6, 13, 25, 28, 40, 42, 49
- **[C82]** (tier 1, confidence H, verified 2026-10-19) Added by verification, token and simulation grants use the base bonus only, and the two nameless placeholder rows (93, 97) plus named placeholders (for example Lampar 121) must be ignored by any pet list; Slime and Sandy Pot have no Toolbox consumer ([C60]).
  - Source: vendor/parsers/misc.ts#L1425-L1456; companions.json idx 93, 97, 121
- **[C83]** (tier 2, confidence L, verified 2026-10-19) Added by verification, trackable treat mechanics: the pull odds per set ([C50]) and the King Doot pity (guaranteed within 200 treats, [C49]) can be tracked as a counter only if the treat count is stored; the save does not expose it (`_comp.x` is total boxes opened, which is the only usable proxy).
  - Source: https://idleon.wiki/wiki/Pets (fetched 2026-10-19); vendor/parsers/misc.ts#L1387-L1395
- **[C84]** (tier 2, confidence L, verified 2026-10-19) Added by verification, Pet Mart gems and Mart+: free Mart gems are keyed to the server var `GemPM_x` and `OLA[516]` ([C39]); Mart+ needs the whole day's offer owned and at least 50 pets ([C16]); each pet's Pet+ price is its `upgradeCost`, which is the only Pet+ sink Toolbox knows ([C63]).
  - Source: vendor/utility/dashboard/account.js#L264-L271; https://idleon.wiki/wiki/Pet_Mart
