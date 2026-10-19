# Drop rate multiplier (account and per character) - M26 dossier

Verified 2026-10-19. Game 2.3.540, Toolbox pin 6c37e3d. `P` = `packages/toolbox-parsers/vendor/parsers/`, `D` = `packages/toolbox-parsers/vendor/data/website-data/`. No KB file and no prior research exist for this topic. Counterpart of the coins-cash dossier (`getCashMulti`). Line numbers cite the vendored `character.ts` (approximate if the vendor file is re-synced).

## Drop rate multiplier

- **What it is:** One merged per-character stat, "Drop Rate" (`getDropRate`), that multiplies the chance and quantity of monster drops (also the AFK-claim drop roll; multikill then multiplies the result). It is a shown multiplier such as 7.4x. [C1][C2][C28]
- **Unlocks:** Always present (LUK curve). Sources open progressively W1-W4 (Archer ROBBINGHOOD, Post Office, stamps, cards, Clover Shrine, Midas Minded at Arena wave 71, Droppin' Loads bubble, Lab chip, Efaunt set, Equinox, vault). [C5][C10][C14][C16]
- **Scope:** Per character: LUK, gear, obols, talents, post office, equipped cards and card set, equipped prayers, golden food, star signs, Lab chip, and the Clover Shrine (only on the shrine's map). Account-wide: the rest (bubble, stamps, guild, vault, arcade, owl, companions, achievements, shiny pets, ballot, bundles). [C1][C13]
- **Inputs -> outputs:** Out: `dropRate` (final multiplier) plus a `breakdown`. [Confidence H] It feeds every loot-bound task: card/crystal/material farming ("kills = missing / (chance x qty x dropRate)"), Menagerie via `getHighestDropRate`, Button task 16 ("Have a Nx Drop Rate multi"). [C3][C27][C29]
- **Goals and Milestones:** Chip stops adding at 5x; Mallay x1.3, Santa Snake x1.01 and Mama Troll x1.5 (x1.7 upgraded) caps; Midas Minded level 50; Clover Shrine level 100. See catalogue. [C4][C7][C12]
- **Feeds / fed by:** Fed by cards, obols, pets/companions, shrines, prayers, stamps, alchemy (bubbles, vials), Lab chips, Post Office, guild, arcade, Upgrade Vault, owl, breeding shiny, golden food, star signs, achievements, bundles. Feeds monster-afk M13, card farming, Menagerie. [C1][C27]
- **Per-session actions:** Identify the DR character (`getHighestDropRate`) and park loot-bound AFK there; check the Clover Shrine is on the AFK map; check a Grounded Processor is not wasted (rate >= 5x); check Midas Minded is equipped on loot AFKers; check card slots hold DR cards. Idle/capped: chip slotted at >= 5x; shrine on a different map. [C4][C12][C27]
- **AFK Setup implications:** DR is map-dependent (Clover Shrine) and character-dependent; ActiveOn already evaluates `getDropRate` per (character, map) for the supply planner. Put the loot-bound character on the shrine map. [C12][C29]
- **Min-max by stage:** below.
- **Common mistakes:** Treating DR as one additive sum (it is an additive base, then bun_v, Siege Breaker, ninja flat, bun_p and ~20 multipliers); slotting the Grounded Processor when already >= 5x; Mallay/Santa Snake/Mama Troll caps ignored when valuing upgrades; Clover Shrine not on the AFK map; expecting Midas Minded without its curse (+% monster HP); assuming the Cove or Dungeons use this rate (the wiki says they do not). [C4][C7][C12][C34]
- **Save and Toolbox fields:** catalogue. **Disputed [C29]:** ActiveOn has no standalone `account.dropRate` or `characters[].dropRate`, but `dropRate` does exist as a per-(character,map) value in `packages/account-state/src/supply.ts#L127-L137` and as a field in `walkthrough-types.ts#L54`. Both views recorded; the gamedata lens's correction (supply rates and walkthrough types carry `dropRate`) is the more precise reading (H).
- **Sources:** inline.

## Mechanics catalogue

### Master formula (`P/character.ts#L2378-L2670`)

```
base      = 1.4*statCurve(LUK) + additive/100 + 1                 (#L2510)
chip      : if base < 5 and chip>0: base = min(5, base + chip/100)  (#L2368, #L2512)
+ bun_v   : +2                                                      (#L2517)
x extraDropRate = 1 + ARCHLORD_OF_THE_PIRATES*lavaLog(accountOptions[139])/100
            (game "AdditionExtraEXPnDR"; breakdown label "Siege Breaker") (#L2405, #L2522)
+ 0.3 Ninja Mastery (accountOptions[232] >= 1, W6), AFTER the extraDropRate multiply
x bun_p   : x1.2
x (1+tesseract/100)(1+royalStatue/100)(1+menagerie24/100)(1+cardMulti/100)(1+royalFamily/100)
  (1+0.3*glunkoCrystal168)(1+min(0.5,mamaTroll)+0.2*MamaLv2)(1+(sushi48+jelly14)/100)
  max(1,glimbo)(1+tomeMulti/100)(1+gear99/100)(1+minehead/100)(1+5*cloud69/100)   (#L2570-L2586)
x (1+charm/100)(1+gear91/100)(1+vial7drMulto/100)
x max(1, min(1.3,1+Mallay26)*(1+0.5*Glunko160)) x max(1, min(1.01, 1+SantaSnake50/2500))
```
Confidence H (source and gamedata lenses both confirm the chain; the original draft omitted extraDropRate and the ninja flat, now added). [C1][C2][C4][C7][C32]

### A. Additive base terms (all in "%" points inside `additive`)

| # | Source | Formula / value | Cap / max | Unlock / world | Parser path |
|---|---|---|---|---|---|
| A1 | LUK curve | `1.4 * statCurve(LUK)`; `<1000`: `((LUK+1)^0.37 - 1)/40`; `>=1000`: `(LUK-1000)/(LUK+2500)*0.5 + 0.297`. Asymptote 1.4*0.797 = +1.116x. | none (log-like) | always | `character.stats.luck`, `getStatCurveValue` (`P/misc.ts#L711`) [C2][C3] |
| A2 | Archer talent ROBBINGHOOD | `40*L/(L+65)` % | talent max | Archer base class (W1) | `getTalentBonus(flatTalents,'ROBBINGHOOD')` [C5] |
| A3 | Journeyman talent CURSE_OF_MR_LOOTY_BOOTY | `70*L/(L+100)` % drop, with a damage penalty alongside the DR (`y1 120, y2 100`; the penalty is the curse side of the talent, confirmed by the source lens) | talent max | Journeyman (W1-W2) | `getTalentBonus(flatTalents,'CURSE_OF_MR_LOOTY_BOOTY')` [C5] |
| A4 | Star talent BOSS_BATTLE_SPILLOVER | `25*L/(L+100)` % per weekly-boss difficulty defeated this week, times `accountOptions[189]` | talent max | Special Talent 4 | `getTalentBonus(flatStarTalents,...)`, `account.accountOptions[189]` [C5] |
| A5 | Post Office "Non Predatory Loot Box" | `50*L/(L+200)` %; box max level 400 (upgrade 2 gives +0.25 LUK per level) | L400 = +33.3% | Post Office (W2-W3) | `getPostOfficeBonus(postOffice,'Non_Predatory_Loot_Box',0)` [C6] |
| A6 | Gear stat (etcBonuses[2] "%_DROP_RATE") | Sum of equipped item UQ values, plus gallery/hat rack when active. 79 items carry it. W1-W4 examples: Efaunt Helmet 5 (Lv80), Chaotic Amarok Pendant 5 (Lv30), Molten Cloak 30, Strung Steamy 3, Skulled Helmet of the Divine 10 (Lv300), Devious Slippers 15 (Lv240), Cobalt Robe 60, Evergreen Robe 75, Corsair Uniform (stat 99 instead: 50). Higher: Emperor Kabuto 25, Robe/Tatters/Drip of the Gods 30/25/30. | per slot | drops and crafts W1-W4+ | `getStatsFromGear(character,2,account)` [C8] |
| A7 | Obols (etcBonuses[2]) | Per obol: Pop series 2/3/4/6/9; Luck series 5/7/10/15 (Silver/Gold/Platinum/Dementia Sixes); Lava obol 14; Ice Guard 8; Hyper Rare Drops 10; Frog 1. Summed over the family and character obol slots. | obol slots | Obols (W1-W4) | `getObolsBonus(character.obols, bonuses.etcBonuses[2])` [C8] |
| A8 | Bubble DROPPIN_LOADS | `40*L/(L+70)` % (Kazam cauldron `c1`) | level cap per Alchemy | W2 Alchemy | `getBubbleBonus(account,'DROPPIN_LOADS',false)`; `D/cauldrons.json` [C9] |
| A9 | Cards, Total_Drop_Rate (equipped) | `bonus * (stars+1)`: Crystal Carrot 5, Mimic 2, Bop Box 3.5, King Doot 6, Emperor 12, Giftmas Blobulyte 3, Mr Blueberry 3 per star; W5+ Mister Brightside 6, Minichief Spirit 8 | 8 equip slots | Cards (W1-W4) | `getCardBonusByEffect(equippedCards,'Total_Drop_Rate')`; `D/cards.json` [C10] |
| A10 | Card set CardSet25 (Events) / CardSet26 (Bosses) | Set bonus 7 (Events) / 6 (Bosses "Dmg, Drop, EXP"), scaled by set stars | equipped set | Cards | `character.cards.cardSet.bonus` for rawName CardSet25/26 [C10] |
| A11 | Passive cards (no slot needed) | `min(1.5*Lv(mini5a),10) + min(4*Lv(caveC)+6*Lv(caveD),100) + min(2*Lv(anni4Event1),20) + min(3*Lv(luckEvent1),25)` (Lv = stars+1) | 10 / 100 / 20 / 25 | Domeo Magmus card (W2 boss), cavern cards (W5), events | `getCardLevel(account.cards,rawName)` (#L2420-L2423) [C10] |
| A12 | Guild "Gold Charm" (idx 10) | `40*L/(L+50)` %; max level 50 = 20% | L50 | Guild, needs prereq idx0 L2 | `getGuildBonusBonus(account.guild.guildBonuses,10)` [C11] |
| A13 | Clover Shrine (shrine idx 4, global idx 22) | `(1 + Shrine_Effects_(Passive) card/100) * ((shrineLevel-1)*3 + 15)` % (the passive card multiplies the shrine bonus; 0 at shrine level 0); only while the character is on the shrine's map (or Shrine World Tour same world, or Moai Head artifact). L100 = 312% (confidence L for the level-100 max: base 15 and +3/level are H, but max level 100 is not present in shared-data or `shrines.ts`). Levels by claiming AFK on that map; build cost 5 Spontaneity Salts. | L100 | Shrines (W3 Hydra town) | `getShrineBonus(account.shrines,4,character.mapIndex,...)`; `P/world-3/shrines.ts#L128` [C12] |
| A14 | Prayer Midas_Minded (idx 7) | `round(20 + 20*(L-1)/10)` % (Math.round applied). Superbit path: with a superbit (No_more_Praying / Prayers_Begone / Prayers_Aint_Meta) and NO prayers equipped, the bonus is 0.2 of the rounded value per superbit (all three = 3/5ths) and the curse is 0 (`P/world-3/prayers.ts#L29-L60`). Curse `250 + 250*(L-1)/10` % max HP of all monsters; equipped per character; max level 50 (118%). | L50 | Arena wave 71 (Wakawaka War) | `getPrayerBonusAndCurse(character.activePrayers,'Midas_Minded',account)` [C13] |
| A15 | Sigil TROVE | 10 unlocked, 20 boosted, 30 jade, 100 ethereal, 150 eclectic % | tier 5 | Alchemy sigils (W2+) | `getSigilBonus(account.alchemy.p2w.sigils,'TROVE')` [C14] |
| A16 | Shiny pets "Drop_Rate" | +1% per shiny level for Slime (W1), Xylobone (W3), Choccie (W4); `round(baseValue*shinyLevel)` | shiny max level | Breeding (W4) | `getShinyBonus(account.breeding.pets,'Drop_Rate')` [C15] |
| A17 | Star sign Drop_Rate | Pirate Booty +5 (cost 2), Druipi Major +12 (cost 4) | equipped signs | Star Signs | `getStarSignBonus(character,account,'Drop_Rate')` [C16] |
| A18 | Stamp "Golden Sixes" (combat idx 37) | `20*L/(L+80)` %; item req Kraken (fish 8) | stamp max | Stamps (W3 fishing) | `getStampsBonusByEffect(account,'+{%_Drop_Rate')` [C17] |
| A19 | Arcade "+{% Drop" (shop idx 27) | `30*L/(L+100)` %; L100 = 15%; Lv101 x2, Lv102 x6; Spirit Reindeer companion (27) doubles ALL arcade shop bonuses including this one | L102 | Arcade (W2) | `getArcadeBonus(account.arcade.shop,'Drop_Rate').bonus` [C18] |
| A20 | Upgrade Vault 18 "Drops for Days" | `level * 1 * (1 + vault32/100)`, max level 50, unlock account level 450 | 50 base | Upgrade Vault | `getUpgradeVaultBonus(account.upgradeVault.upgrades,18)` [C19] |
| A21 | Owl "Super Feather Production" | `1 * ceil((upgradeLevel-4)/6) * multiplier` % | upgrade level | W1 Owl | `getOwlBonus(account.owl.bonuses,'Drop Rate')` (`P/world-1/owl.ts#L129`) [C20] |
| A22 | Ballot vote 27 | "+38% Drop Rate for all your characters" when selected in the weekly vote | vote week | W2 Ballot | `getVoteBonus(account,27)`; `D` `ninjaExtraInfo[38][81]` [C21] |
| A23 | Friend bonus 3 | `25 * min(1.5, 0.25 + L/(L+12000)*1.5)` %, L capped 30000; max 37.5 | 37.5 | Friend bonus slot | `getFriendBonus(account,3)` [C22] |
| A24 | Golden Cake and Golden Sugar Cookie (Golden food) | `amount * GFmulti * 0.05 * ln(1+qty) * (1 + ln(1+qty)/2.14)`; both foods share the `DropRatez` effect (`P/misc.ts#L1044`); equipped or on the Beanstalk; Jade `Gold_Food_Beanstalk` bonus adds a beanstalk-based golden food term | stack-size log | Golden food | `getGoldenFoodBonus('Golden_Cake',...)` [C23] |
| A25 | EFAUNT_SET armour set | +25% while the set is complete/unlocked (Efaunt Hat/Shirt/Pants/Shoes) | once | Armor Smithy (W3) | `getArmorSetBonus(account,'EFAUNT_SET')`; `D/shared-data.json equipmentSets[5]` [C24] |
| A26 | Equinox "Faux Jewels" | +5% per level, max level 6 = 30% | 30 | Equinox (W3) | `getEquinoxBonus(account.equinox.upgrades,'Faux_Jewels')` [C24] |
| A27 | Achievements 377 and 381 | 6% and 4% flat (377 Summoning GM, W6; 381 secret) | once each | Achievements | `getAchievementStatus(account.achievements,377/381)` [C25] |
| A28 | Tome bonus 2 | `2*floor((tomePoints-8000)/100)^0.7 * extra` %, gated by `accountOptions[197]==1` (Disputed: none; both lenses agree) | tome points | Tome (W4) | `account.tome.bonuses[2]` [C26] |
| A29 | Companions (additive) | Crystal Custard (3) +100/+130; Quenchie (22) +15/+20; Santa Snake (50) +25/+50; Clammie (111) +100/+150; Lucky Slug (158) +15/+20; Mama Troll (132) +100/+300 (additive and separate multiplier); Santa Snake and Mallay values per `companions.json` (Mallay data says upgraded 1.50x via upgradedBonus 0.5 but the code caps at 1.3 - Disputed between data (1.5) and code (1.3); code wins, tier 1, H) | upgraded values | gem-shop/event pets | `isCompanionBonusActive(account,i)`, `account.companions.list[i].bonus` [C27b] |
| A30 | Bundle `bun_v` | flat +2 (200%) after the chip, before Siege Breaker | once | Gem shop | `isBundlePurchased(account,'bun_v')` [C4] |

### B. Chip (the capped term)

Grounded Processor (chip idx 3): `+60%` ("if total is less than 5.00x"). `chipBonus = baseVal` of chips slotted for that player. Only added while `base < 5`; result is `min(5, base + 0.6)`. Cost: 10,000 Pocket Sand + 100 Frenk Fries + 100 Jungle spice; W4 Lab. Bonus applies before bun_v, extraDropRate and bun_p. Confidence H. [C4][C30]

### C. Multiplicative terms

| # | Source | Formula | Cap | Unlock | Path |
|---|---|---|---|---|---|
| C1 | Bundle `bun_p` | x1.2 | once | Gem shop | `isBundlePurchased(account,'bun_p')` [C4] |
| C2 | Card multi (Drop_Rate_Multi cards) | `1 + cardMulti/100` (W7 cards Coralcave Guardian, Mantaray, Ancientfish: +1 per star) | cards | W7 | `getCardBonusByEffect(...,'Drop_Rate_Multi')` [C10] |
| C3 | Mama Troll | `1 + min(0.5, bonus) + 0.2*Lv2`: x1.5, x1.7 upgraded | 1.7 | W6 pet | `mamaTrollLvl2 = isCompanionLvl2Active(account,132)` [C7] |
| C4 | Mallay (26) | `min(1.3, 1+bonus)`, so x1.3 at both levels | 1.3 | 4th-anniversary bundle `bon_e` | `list[26].bonus` [C7] |
| C5 | Santa Snake (50) | `max(1, min(1.01, 1+bonus/2500))` | 1.01 | gem/event pet | `list[50].bonus` [C7] |
| C6 | Crystal Glunko (168) | `1 + 0.3*bonus` (x1.3 / x1.45) | none | Cavern pet | `list[168]` [C7] |
| C7 | Glunko The Massive (160) | `1 + 0.5*bonus` (x1.5) | none | pet | `list[160]` [C7] |
| C8 | Tome multi (idx 7) | `3*floor(points/1000)^0.3*extra`, needs Event shop 27 | tome | Event shop + Tome | `account.tome.bonuses[7]` [C26] |
| C9 | Gear stat 99 | Corsair Uniform 50, Celebration Gown 200 | slot | W2+ | `getStatsFromGear(character,99,account)` [C8] |
| C10 | Gear stat 91 (DROP_RATE_MULTI) | Chains of Gilded Vaultguard cape 40; nametags Deadbones 25, Pot of Gold 30, Tome Legend 20, Reliquarium 20; hats 1-2 | slot | mixed | `getStatsFromGear(character,91,account)` [C8] |
| C11 | Pristine charm Cotton Candy | `1 + charm/100` | charm | W6 | `getCharmBonus(account,'Cotton_Candy')` [C31] |
| C12 | Vial 7drMulto | W7 vial (Ship in a Bottle) | W7 | | `getVialsBonusByStat(...,'7drMulto')` [C31] |
| C13 | Equinox challenge 69 | `5 * cloud69` (1.05x text), Bubba megaflesh | challenge | W3 Equinox | `getCloudBonus(account.equinox.challenges,EQUINOX_CLOUD.DROP_RATE)` [C24] |
| C14 | Royal Statue idx 1 | `1 + bonus/100` (0 without a Royal Guardian) | | W5+ | `getRoyalStatueBonus(account,1)` [C32] |
| C15 | Royal Guardian family bonus (classFamilyBonuses[16]) | `1 + bonus/100` | | W6 | `getCharacterFamilyBonus(character,CLASSES.Royal_Guardian)` [C32] |
| C16 | Menagerie boost 24 | `1 + bonus/100` | | W6 | `getMenagerieBoost(account,24)` [C32] |
| C17 | Minehead QTY0 | `1 + bonus/100` | | W5+ | `getMineheadBonusQTY(account,0)` [C32] |
| C18 | Tesseract map bonus 0 | `1 + bonus/100` | | W6 | `getTesseractMapBonus(...,0)` [C32] |
| C19 | Glimbo research grid 168 | `max(1, 1 + grid168[2]/100)`, needs level >= 1 | | W7 | `getResearchGridBonus(account,168,...)` [C32] |
| C20 | Sushi 48 (Unagi Nigiri) + Jelly 14 | `1 + (sushi+jelly)/100` | | W7 | `getSushiBonus`, `getJellyBonus` [C32] |
| C21 | Siege Breaker / extraDropRate | `1 + ARCHLORD*lavaLog(accountOptions[139])/100`, applied after bun_v and before the ninja flat and bun_p | scales with opt 139 | W6 | `character.ts#L2405` [C4][C32] |

### D. W5+ extensions (one line each)
Siege Breaker ARCHLORD (`6*L/(L+150)` talent, then `1 + talent*lavaLog(accountOptions[139])/100` multiplier) [C32]; Ninja Mastery +0.3 flat (accountOptions[232], after Siege Breaker, before bun_p); Grimoire 44; Legend talent 1; Spelunking 50; research grid 173; schematics (holes 46 and 82); Exotic Market 59; summoning winner bonus 9; Emperor bonuses 30/46; Royal Guardian GRADED_RATE (`3*L/(L+500)` multiplied by the total resource node grades, `character.ts#L2455-L2460`) and statue 1; Farming land rank 9, crop depot, Jade crop scientist; Measurement 15; Monument; Emperor card; Tesseract; Sushi/Jelly; Mama Troll/Glunko pets. [C32]

Confidence for section D: H for terms read in `character.ts`, M for exact per-term values not traced individually.

### E. Deliverables (design)
1. `characters[].dropRate`: `{ total, beforeChip, chipAdded, chipCapped, breakdown }` from `getDropRate`, evaluated on the character's own map (Clover Shrine). `account.dropRate` = `getHighestDropRate` plus `bestCharacterIndex`. [C27][C29]
2. Check `lab-chip-wasted`: `chip3 slotted && beforeChip >= 5` (identical to lab dossier "Grounded Processor inert >= 5x"); also warn when `beforeChip + 0.6 > 5` (partially wasted). [C4][C30]
3. LUK step: value of +100 LUK = `1.4*(c(L+100)-c(L))` x: at LUK 100: +0.056x; 250: +0.036x; 500: +0.024x; 1000: +0.019x; 2500: +0.0096x; 5000: +0.0043x; 10000: +0.0016x; 20000: +0.0005x. LUK contributes 0.158x at 100, 0.31x at 500, 0.42x at 1000, 0.63x at 2500, 0.79x at 5000, 0.92x at 10000. Rule: LUK is worth stacking only below ~2500; beyond that use additive sources. [C3]
4. Surface the multiplicative layer separately from the additive base in the breakdown: the ninja flat, extraDropRate and bun_p order matters for "what is +1 point worth" advice. Confidence M.
4b. Cross-links: monster-afk M13 (replace the one-line rule), cards, obols, pets (caps), lab, shrines, golden-food, post-office, guild, arcade, upgrade-vault, star-signs, prayers, stamps. [C27]
5. Sprites to add (document only; none built here): `ui-drop-rate` (clover leaf), `shrine-clover`, `chip-grounded` (variant of `item-chip` in `apps/activeon/src/art/sprites/grids/items.ts#L474`), `stat-luk` clover. Existing grids lack clover/luck art. Confidence H. [C33]

## Min-max by stage

No tier 3/4 drop-rate-specific upgrade order was retrievable this session (web search budget exhausted; wiki Drop Rate page fetched). The orders below are derived from the formulas (tier 1) and the wiki's stage hints (tier 3); confidence M/L. [C34]

- **W1 early:** LUK from stats and the Post Office Non Predatory Loot Box; equip any DR gear/obols; Archer ROBBINGHOOD / Journeyman CURSE talents; early cards (Crystal Carrot, Mimic); the wiki says "focus Luck and basic card drops (Mimic/Giftmas Blobulyte)". [C34][C5][C10]
- **W1 mid / W2:** Droppin' Loads bubble (Kazam), Golden Sixes stamp, arcade drop upgrade, Gold Charm guild, Efaunt/Amarok gear, Domeo Magmus passive card (cap 10), vote 27 when active. Max Midas Minded when unlocked at wave 71 only for loot AFK (curse raises monster HP). [C13][C9][C17][C18][C11]
- **W3:** Build the Clover Shrine on the AFK map you farm (biggest single early term: 15 + 3/level, so 42% at Lv10, 162% at Lv50); Equinox Faux Jewels; Efaunt set; Droppin' Loads and Post Office to cap; Golden Cake on loot AFKers. [C12][C24]
- **W4 / late W1-4:** Lab: Grounded Processor on characters under 5x (it adds +0.6x; skip when already at/above 5x, or if base+0.6 exceeds 5); shiny Slime/Xylobone/Choccie; Tome idx 2; vault 18; sigil TROVE jade/ethereal; Lucky/gear (Emperor Kabuto 25). Wiki mid game: "Emperor Kabuto helmet, trophy collection (Lucky Lad -> Luckier Lad)". [C4][C15][C14][C19][C34]
- **Multipliers (all stages):** buy `bun_p` (x1.2) and `bun_v` (+2) if you buy bundles; Mallay x1.3 is cheap value per % (cap), Mama Troll x1.5; each multiplier applies to the whole sum so they beat additive terms once base >= ~5x. [C7][C4]
- **Per class:** Archer: ROBBINGHOOD; Journeyman: CURSE_OF_MR_LOOTY_BOOTY (damage penalty); Royal Guardian W6: GRADED_RATE. [C5]

## Common mistakes and detection
1. `chipBonus>0 && beforeChip>=5` (wasted chip).
2. Clover Shrine level>0 but the farming character is on another map (`shrine.mapId != character.mapIndex` and no World Tour).
3. Midas Minded unlocked but unequipped on a loot AFKer; or equipped with the curse on a low-survivability character.
4. Loot AFK on a non-DR character while `getHighestDropRate` is higher.
5. Card slots hold non-DR cards on the DR character while passive-card caps are unfilled.

## Open questions
1. The wiki page and Toolbox may disagree on the LUK formula text (wiki summary "(LUK+1)^0.37-140" vs code `((LUK+1)^0.37-1)/40`). Code wins (tier 1, H, confirmed in `misc.ts#L711-L715`); wiki text is unverifiable here (L). [C3]
2. (Confidence L) The 2026-03-06 "Drop Rarity + Drop Chance merge" is only in patch-note research (tier 3, L); the wiki Drop Rate page did not mention it. The code no longer distinguishes Drop Rarity (`character.ts` comment "Drop_Rarity == e"). [C28]
3. Whether trophies (Luckiest Lad 777) apply only with the gallery active (`isGalleryActive`) and which world unlocks it. [C8]
4. Ballot 27's value 38 is the first numeric string beside its description; confirm the scaling. [C21]
5. Community upgrade-order sources (r/idleon, IdleOn Academy, efficiency sheets) not retrieved; web search quota ran out. [C34]
6. Whether the Lab "Grounded Processor" can be doubled by Silkrode/other chips or Nano chip boosts. [C30]

## Claims

- [C1] (tier 1, H, both lenses confirm) `getDropRate` returns `{dropRate, breakdown, expression}` combining an additive base with a multiplier chain. Source: `P/character.ts#L2378-L2670`, 2026-10-19, game 2.3.540.
- [C2] (tier 1, H) `dropRateBeforeChip = 1.4*luckMulti + additive/100 + 1`. Source: `P/character.ts#L2510`, 2026-10-19.
- [C3] (tier 1, H for the code curve confirmed at the 1000 switch; wiki part tier 3, L unverifiable) LUK curve: `<1000: ((LUK+1)^0.37-1)/40`; `>=1000: (LUK-1000)/(LUK+2500)*0.5+0.297`; computed values given in the catalogue. Source: `P/misc.ts#L711-L715`; wiki https://idleon.wiki/wiki/Drop_Rate (tier 3, text differs, M), 2026-10-19.
- [C4] (tier 1, H) `DR_CHIP_CAP = 5`; chip adds `min(5, base+chip/100)` only while `base < 5`; `bun_v` adds a flat 2 afterwards; then `extraDropRate` multiplies, then Ninja Mastery adds a flat 0.3, then `bun_p` multiplies by 1.2 (the original claim omitted the middle two steps; corrected per the source lens). Source: `P/character.ts#L2368, #L2512-L2530`, 2026-10-19.
- [C5] (tier 1, H) Talents: ROBBINGHOOD `x1 40, x2 65`; CURSE_OF_MR_LOOTY_BOOTY `x1 70, x2 100` (damage `y1 120, y2 100`); BOSS_BATTLE_SPILLOVER `x1 25, x2 100`; GRADED_RATE `x1 3, x2 500`; ARCHLORD `x1 6, x2 150`; all `decay` = x1*L/(L+x2). Source: `D/talents.json`; `D/../vendor/utility/wiki/growth.mjs#L34`, 2026-10-19; wiki https://idleon.wiki/wiki/Drop_Rate (tier 3, same numbers for Robbinghood/Looty).
- [C6] (tier 1, H) Post Office box 11 "Non_Predatory_Loot_Box": upgrade 0 `%_Drop_Rate x1 50 x2 200 decay`, upgrade 1 `_LUK x1 0.25`, max level 400. Source: `D/shared-data.json` postOffice[11]; `P/world-3/postoffice.ts#L33`, 2026-10-19.
- [C7] (tier 1, H) Caps: Mama Troll `1+min(0.5,bonus)+0.2*Lv2` (1.5/1.7), Mallay `min(1.3,1+bonus)`, Santa Snake `min(1.01, 1+bonus/2500)`; Glunko 160 and Crystal Glunko 168 uncapped. Source: `P/character.ts#L2572-L2586`; `D/companions.json` [3,22,26,50,111,132,158,160,168], 2026-10-19.
- [C8] (tier 1, H) Gear stat via `getStatsFromGear(character,2|91|99)`; items carry `UQ1txt/UQ2txt` "%_DROP_RATE" (79 items), "%_DROP_RATE_MULTI" (16), "%_BONUS_DROP_RATE" (2); values listed in catalogue (e.g. Efaunt Helmet 5, Evergreen Robe 75). Source: `D/items.json`; `P/items.ts#L69-L154`, 2026-10-19.
- [C9] (tier 1, H) Bubble DROPPIN_LOADS (kazam `c1`) `decay x1 40 x2 70`; cost Goldfish + Liquid1. Source: `D/cauldrons.json#L3189-L3200`; wiki https://idleon.wiki/wiki/Drop_Rate (tier 3, same formula), 2026-10-19.
- [C10] (tier 1, H) Cards: effect "Total_Drop_Rate" per-star bonuses (Crystal Carrot 5, Mimic 2, Bop Box 3.5, King Doot 6, Emperor 12, Giftmas Blobulyte 3, Mr Blueberry 3); card bonus = `bonus*(stars+1)`; set CardSet25 +7 / CardSet26 +6; passive-card caps 10/100/20/25. Source: `D/cards.json`; `P/cardMath.ts`; `P/character.ts#L2411-L2423`; `D/shared-data.json` cardSets, 2026-10-19.
- [C11] (tier 1, H) Guild bonus 10 "Gold_Charm" `decay x1 40 x2 50`, maxLevel 50, requires bonus 0 level 2. Source: `D/shared-data.json` guildBonuses[10], 2026-10-19.
- [C12] (tier 1, H for base 15, +3/level, map scoping, World Tour and Moai Head; L for max level 100, which is not in shared-data or `shrines.ts`) Clover Shrine = global shrine index 22, `baseBonus 15, bonusPerLevel 3`, max level 100, item req 5 Spontaneity Salts; bonus `(1+passiveCard/100)*((L-1)*3+15)`; applies only on the shrine's map, or same world with Shrine World Tour, or with Moai Head. Source: `D/shared-data.json` shrines[22], towers.Clover_Shrine; `P/world-3/shrines.ts#L33-L140`, 2026-10-19.
- [C13] (tier 1, H) Midas Minded: `x1 20 x2 250`, bonus `round(x1 + x1*(L-1)/10)`, superbit-only path gives 0.2 per superbit of the rounded value with curse 0, curse `x2 + x2*(L-1)/10`, maxLevel 50, unlockWave 71 (Wakawaka War). Source: `D/shared-data.json` prayers[7]; `P/world-3/prayers.ts#L28-L60`, 2026-10-19.
- [C14] (tier 1, H) Sigil TROVE bonuses 10/20/30/100/150 by unlock tier. Source: `D/shared-data.json` sigils; `P/world-2/alchemy.ts#L867`, 2026-10-19.
- [C15] (tier 1, H) Shiny "+{%_Drop_Rate" passive base 1 on Slime (W1), Xylobone (W3), Choccie (W4); value `round(baseValue*shinyLevel)`. Source: `D/petStats.json`; `P/world-4/breeding.ts#L153, #L320`, 2026-10-19.
- [C16] (tier 1, H) Star signs with Drop_Rate: idx 14 Pirate Booty +5 (cost 2), idx 76 Druipi Major +12 (cost 4). Source: `D/shared-data.json` starSigns, 2026-10-19.
- [C17] (tier 1, H) Stamp Golden Sixes (combat idx 37, StampA38): `decay x1 20 x2 80`, needs Kraken. Source: `D/stamps.json`, 2026-10-19.
- [C18] (tier 1, H) Arcade shop 27 "+{%_Drop_Rate" `decay x1 30 x2 100`; level 100 cap, 101 x2, 102 x6, companion 27 x2. Source: `D/shared-data.json` arcadeShop[27]; `P/world-2/arcade.ts#L21-L23, #L87-L100`, 2026-10-19.
- [C19] (tier 1, H) Upgrade Vault 18 "Drops_for_Days": `x5 1`, maxLevel 50, unlockLevel 450, scaled `(1+vault32/100)`. Source: `D/shared-data.json` upgradeVault[18]; `P/misc/upgradeVault.ts#L206-L250`, 2026-10-19.
- [C20] (tier 1, H, confirmed by gamedata lens) Owl "Drop Rate": `base 1, offset 4`, `bonus = base*multiplier*max(0,ceil((upgradeLevel-4)/6))`. Source: `P/world-1/owl.ts#L129-L139`, 2026-10-19.
- [C21] (tier 1, M) Ballot vote 27 text "Increases Drop Rate for all your characters by +{%" with value string 38. Source: `D/shared-data.json` ninjaExtraInfo[38][81-83]; `P/world-2/voteBallot.ts#L157`, 2026-10-19.
- [C22] (tier 1, H) Friend bonus 3: `25*scaling`, scaling `min(1.5, 0.25+L/(L+12000)*1.5)`, L capped 30000. Source: `P/misc.ts#L201-L232`, 2026-10-19.
- [C23] (tier 1, H) Golden Cake: `amount*GFmulti*0.05*lavaLog(1+qty)*(1+lavaLog(1+qty)/2.14)`; Beanstalk adds ranks. Source: `P/misc.ts#L1046-L1075`; items FoodG13, 2026-10-19.
- [C24] (tier 1, H) EFAUNT_SET bonus 25; Equinox Faux_Jewels +5 per level, maxLevel 6; Equinox challenge 69 reward 1.05x DR multi (`5*cloud`). Source: `D/shared-data.json` equipmentSets[5], equinoxUpgrades[8], equinoxChallenges[69]; wiki Drop Rate page (Faux Jewels +5%/level, tier 3), 2026-10-19.
- [C25] (tier 1, H) Achievement 377 (Summoning_GM, "Get 58 Career Wins within Summoning") gives 6%, 381 (secret) 4% Drop Rate for all characters. Source: `D/achievements.json`; `P/character.ts#L2413-L2414`, 2026-10-19.
- [C26] (tier 1, M) Tome idx 2 `2*floor((points-8000)/100)^0.7*extra` (needs `accountOptions[197]==1`); idx 7 `3*floor(points/1000)^0.3*extra` (needs Event shop 27). Source: `P/world-4/tome.ts#L216-L240`, 2026-10-19.
- [C27] (tier 1, H) `getHighestDropRate` = max over characters of `getDropRate().dropRate` (floor 1); only consumer is Menagerie; Button task 16 reads `getDropRate`. Source: `P/character.ts#L2375-L2376`; `P/index.ts#L383`; `P/world-7/button.ts#L360`, 2026-10-19.
- [C27b] (tier 1, H) Additive companions: values per `companions.json` (upgradedBonus); active-gated by `isCompanionBonusActive`. Source: `D/companions.json`; `P/character.ts#L2404-L2450`, 2026-10-19.
- [C28] (tier 3, L, unverifiable by both lenses) The 2026-03-06 patch merged Drop Rarity and Drop Chance into one Drop Rate stat; not confirmed on the wiki Drop Rate page. Source: monster-afk dossier C46 (patch notes), https://idleon.wiki/wiki/Drop_Rate, 2026-10-19.
- [C29] (tier 1, **Disputed**, M) Original claim: ActiveOn calls `getDropRate` per (character, map) only inside the supply planner; no `dropRate` field exists in Account State today. Gamedata lens refutes the "no field" part: `walkthrough-types.ts#L54` declares `dropRate` and `supply.ts#L127-L137` computes it per (character,map). Corrected view: there is no standalone account or character `dropRate`, but supply rates and walkthrough types carry it. Source: `packages/account-state/src/supply.ts#L127-L137`; `walkthrough-types.ts#L53-L54`, 2026-10-19.
- [C30] (tier 1, H) Chip 3 "Grounded_Processor": baseVal 60, stat `dr`, requirements 10,000 Pocket Sand + 100 Frenk Fries + 100 Jungle spice. Source: `D/shared-data.json` chips[3]; `P/world-4/lab.ts#L394-L398`, 2026-10-19.
- [C31] (tier 1, H) Pristine charm Cotton_Candy "}x_Drop_Rate" (W6); vial SHIPINABOTTLE "7drMulto" +0.1 per level (W7). Source: `D/shared-data.json` pristineCharms[3]; `D/vials.json`, 2026-10-19.
- [C32] (tier 1, H) W5+ terms: Siege Breaker ARCHLORD, Ninja Mastery +0.3 (accountOptions[232]), Grimoire 44, Legend talent 1, Spelunking 50, research grid 173/168, schematics 46/82, Exotic Market 59, summoning winner 9, Emperor 11/30/46, farming rank 9/crop depot, Tesseract, Sushi/Jelly, Royal Statue/family. Source: `P/character.ts#L2378-L2660`, 2026-10-19.
- [C33] (tier 1, H) Sprite grids include `item-chip` but no clover/luck/DR art. Source: `apps/activeon/src/art/sprites/grids/items.ts#L474`, 2026-10-19.
- [C34] (tier 3, L, unverifiable by both lenses) Wiki: Cove and Dungeons ignore these bonuses; early focus Luck and basic cards; mid Emperor Kabuto and trophies; late Farming Seed, Spelunking hardhat, Mama Troll/Crystal Custard, Luckiest Lad trophy (777%). Source: https://idleon.wiki/wiki/Drop_Rate (fetched via summarizer), 2026-10-19.

- [C35] (tier 1, H) Spirit Reindeer (companion 27) doubles all arcade shop bonuses, including the arcade drop rate (supersedes the loose "companion 27 x2" wording in C18). Source: `P/world-2/arcade.ts#L87-L100`, 2026-10-19.
- [C36] (tier 1, H) Multiplicative terms beyond the earlier list: Royal Statue idx 1, Menagerie 24, Tesseract map bonus 0, Minehead QTY0, Sushi 48 + Jelly 14, Glimbo grid 168 DR multi, Royal Guardian family bonus, Crystal Glunko card (0.3x per) and the Equinox cloud-69 multi. Source: `P/character.ts#L2556-L2586`, 2026-10-19.
- [C37] (tier 1, H) Royal Guardian GRADED_RATE (`3/500` decay) is multiplied by total resource node grades; the Archlord talent multiplier scales with `lavaLog(accountOptions[139])`. Source: `P/character.ts#L2405, #L2455-L2460`, 2026-10-19.
- [C38] (tier 1, H) Golden_Sugar_Cookie shares the `DropRatez` effect with Golden_Cake; Jade `Gold_Food_Beanstalk` adds a beanstalk-based golden food term. Source: `P/misc.ts#L1044-L1075`, 2026-10-19.
- [C39] (tier 1, H) Passive card caps are separate groups: mini5a 10, caveC+caveD 100, anni4Event1 20, luckEvent1 25 (restates C10 with gamedata confirmation). Source: `P/character.ts#L2411-L2423`, 2026-10-19.
- [C40] (tier 1, H) CURSE_OF_MR_LOOTY_BOOTY carries a damage penalty alongside its DR bonus. Source: `D/talents.json`, 2026-10-19.
