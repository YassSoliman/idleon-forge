# Cards: system dossier (M26)

Verified 2026-10-19 against Legends of IdleOn game client `N.js` (fetched 2026-10-19) and IdleOn Toolbox @ 6c37e3d (game version 2.3.540). Format: `docs/research/SYSTEM-DOSSIER.md` plus a Mechanics catalogue. Source precedence per ADR 0004. Claim tags `[C#]` resolve in the Claims register at the end (source, tier 1-4, claim date where known). Tiers: 1 game data / Toolbox code, 2 Toolbox logic / ActiveOn repo, 3 wiki, 4 community. Web search budget was exhausted during this run, so community coverage is one public guide gist plus earlier research; see Open questions.

Revised 2026-10-19 after two adversarial verification passes (source lens, game-data lens): four claims were refuted by the game-data lens and are marked **Disputed** (C31, C32, C37, C45), C23/C11/C22 gained corrections, and every claim now carries a confidence (H/M/L; L = could not be verified from vendored data or code).

Builds on the earlier dossier (`research/cards-obols:docs/research/systems/2026-10-17-cards-obols.md`). Corrections to it, found by reading the code again: (a) the 5x unowned bonus is skipped for **boss** cards (`CardsZ*`), not event cards [C26]; (b) Spelunking is a **World 7** skill, not W5 [C22]; (c) the Lv 15 preset gate is wiki-only, the code only knows 2 + purchases [C2] [C3]. The N.js-derived claims (C1/C2 purchase bases, C20, C25, C26, C29, C36) could not be re-verified by the verifiers and are confidence L or M accordingly.

## Cards

- **What it is:** Monsters, resource nodes, bosses, critters, souls and events drop collectible cards. Copies stack into levels (stars). Each equipped card gives `bonus x level` of one stat; cards tagged (Passive) work from the collection. One card set per character adds a bracket bonus. [C5] [C12] [C15]
- **Unlocks:** Available from the start; no unlock step. Level 6 (5-star) needs Rift 45 (code) / "Rift 46" (wiki); Level 7 (6-star) needs the third Spelunking lore boss (W7). [C7] [C8]
- **Scope:** Collection and passive bonuses are account-wide. Equipped cards, presets and the equipped set are per character; slot and preset counts are bought account-wide in the Gem Shop. [C5] [C1] [C2]
- **Inputs -> outputs:** Kills and AFK kills (monsters, bosses, crystal mobs), skilling nodes, trapping, worship, dungeons, Gem Shop packs, event shops -> copies -> levels -> stat bonuses, set bonuses, passive bonuses. Chance per kill is the base chance x5 when unowned x CardChanceMulti. [C26] [C25] [C30] [C33]
- **Goals and Milestones:**
  - Card levels: copies needed = perTier x {1, 4, 9, 25, 484, 15129} for Lv 2 to 7 (strict >). [C6]
  - Set tiers: floor(sum of Lv / set size) with sizes in the Mechanics catalogue. [C19] [C21]
  - Slots 4 -> 8 and presets 2 -> 7 via Gem Shop. [C1] [C2]
  - Skill Mastery (skill level 300 with Rift >= 15): all owned cards of that skill count. [C16]
- **Feeds / fed by:** Fed by: Card Drop Chance sources (Five Aces bribe, Pokaminni star sign, Anearful vial, Card Stamp, Cards Galore, Cardiovascular!, Card Spotter guild bonus, Card Champ bubble, Gigafrog/Snelbie/Sir Stache cards) [C27] [C28]. Feeds: damage, drop rate, EXP, accuracy, skill efficiency/speed/AFK gain, Crystal mob spawn, Tome total card levels, Upgrade Vault Collection Cashout [C18] [C17] [C23] [C31]. Lab chips 20 and 21 and Legend talent 21 multiply equipped cards (W4 and W7). [C13] [C14]
- **Per-session actions:** (1) Empty slots: fewer equipped than 4 + purchases. (2) Passive card sitting in a slot. (3) Set missing or wrong for the activity; Blunder Hills at Lv >= 50. (4) Active preset not matching AFK activity. (5) Any card crossing a level since the last save. (6) Unowned first copies on the current map (5x). Idle/capped: all cards on the AFK map already at the account's star cap. [C24] [C26] [C7]
- **AFK Setup implications:** Fighters wear damage/base-stat/drop cards plus a fight set (Blunder Hills below Lv 50; Yum Yum then Frostbite after); skillers wear efficiency/speed/away-gain cards plus Easy Resources (Medium Resources when levelling). Card farmers add Gigafrog, Snelbie, Sir Stache. Once a skill reaches the Mastery threshold its cards stop needing slots. [C21] [C28] [C16]
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:** empty slots; no set equipped; a passive card wearing a slot; Blunder Hills past Lv 50; fight set on a skiller or the reverse; wrong preset after switching activity; using pre-v1.08 drop advice; spending gems on packs before Extra Card Slot. [C24] [C46] [C34]
- **Save and Toolbox fields:** Mechanics catalogue column "Field".
- **Sources:** Claims register.

## Mechanics catalogue

Numbers are for game 2.3.540. "Field" gives the Toolbox parser path (`parsers/` under the vendored Toolbox) and raw save key.

| # | Mechanic | Rule / formula | Caps | Unlock | Costs | Field |
|---|---|---|---|---|---|---|
| M1 | Card collection | copies per card, account-wide | none | start | drops | `account.cards[displayName].amount` (raw `Cards0`) [C5] |
| M2 | Card level | copies > perTier x {1,4,9,25,484,15129} | Lv 5; Lv 6 / 7 gated; Chaotic Chizoar (Boss3B) uses 1.5 x (i+1+floor(i/3))^2, dropping the 16 and 100 terms, so it needs far fewer copies at high levels | Lv 6: Rift[0] >= 45; Lv 7: Spelunk lore boss 3 | none | `cards[].stars` (0-based), `nextLevelReq`; `cards.ts#calculateStars`, `cardMath.ts` [C6] [C9] [C7] |
| M3 | Cardifier | lifts one chosen card to Lv 5 / 6 / 7 | 5-star: 10 buys, 6-star: 6 buys; **5/6-star cardifiers are past limited specials (lastSeen 2.3.531 / 2.3.530 < game 2.3.540), availability time-limited** | Gem Shop | 325 / 486 / 880 gems | `accountOptions[155]` (5-star list), `[603]` (6-star list), `gemShopPurchases[67,91,92]` [C11] [C10]; floors apply regardless of star cap or natural copies, only amount > 0 |
| M4 | Equip slots | 4 + purchases | 8 | Gem Shop | 150 gems +40 each, 4 buys | `gemShopPurchases[63]`, raw `CardEquip_N` [C1] [C4] |
| M5 | Card presets | 2 + purchases; stores cards only, set is separate | 7 | wiki: Lv 15; code: always | 250 gems +160, 5 buys | `characters[].cardPresets[]`, `selectedCardPreset` (`PlayerStuff[2]`), `gemShopPurchases[66]` [C2] [C3] |
| M6 | Equipped bonus | bonus x Lv x chipBoost x legendBonus | n/a | n/a | n/a | `cardMath.ts#calcCardBonus`; `characters[].cards.equippedCards[]` [C12] |
| M7 | Passive cards | "(Passive)"/"(P)" effects work unequipped; counted at Lv only | n/a | own the card | none | `cards.ts#getCardBonusByEffect(account.cards, effect)` [C15] |
| M8 | Rift Skill Mastery | skill level >= 300 (rank > 2) and Rift >= 15: all owned cards of the skill count | per skill | W4 Rift + skill level | none | `misc.ts#getSkillCardBonus`, `isMasteryBonusUnlocked` [C16] |
| M9 | Card Retirement (Vault 44) | Card Drop Rate cards become passive | Lv 1 | Vault unlock level 1850 | 50,000,000 | `shared-data.upgradeVault[44]` [C17] |
| M10 | Card sets | tier = floor(sum Lv / size); bonus = round(tier x base) | effective 5 (6/7 later) | own cards | none | `cards.ts#getCardSets` (Toolbox), `characters[].cards.cardSet` {rawName, bonus, stars}; Toolbox also applies CardSet4/6/8/9 [C19] [C21] [C23] |
| M11 | One set per character | CSetEq holds one key | 1 | start | none | raw `CSetEq_N` [C20] |
| M12 | Drop chance | entry x5 if unowned (not bosses) x CardChanceMulti | n/a | n/a | n/a | not in Toolbox; game `CardChanceMulti` [C26] [C25] |
| M13 | Drop-chance sources | additive group x (1 + Cardiovascular!) + 1.2 base | n/a | various | various | bribe 10, star sign 41, vial, stamp C9, talents 28 / 628, guild 12, bubble kazam c18 [C27] |
| M14 | Gem Shop packs | Newbie 3 cards, Ancient and up 4 cards, boss slot rules | unlimited | Gem Shop | 200 to 720 gems | `gemShop.json CardPack1-7` [C33] [C35] |
| M15 | Trapping/worship/fishing cards | trap: (4 x hours)^0.62 x multi; fishing/soul sources not in Toolbox data | n/a | W3 trapping/worship | n/a | prior dossier [C36] [C37] |
| M16 | Lab chips 20 / 21 | double the card in slot 0 / slot 7 | one each per player | W4 Lab | 10M Fairy / Kraken + meals + spices | `character.ts#L440-L451`, `account.lab.playersChips` [C13] [C12] |
| M17 | Legend talent 21 | multiplies equipped card bonuses | 15 base value | W7 | n/a | `getLegendTalentBonus(account, 21)` [C14] |
| M18 | Total card levels | sum of Lv over owned cards. Tome counts total Lv; Vault 70 Collection Cashout counts distinct owned cards (two different stats) | n/a | n/a | n/a | `cards.ts#calcCardsLevels`; Tome, Vault 70 [C18] [C17] [C52] |
| M20 | Dungeon cards | Dungeon Card Chance (Lava Slimer, Grumblo, Glaciaxus), Dungeon Credits (Chromatium Frog, Forlorn Grandfrogger, Golden Glaciaxus), Dungeon Flurbos (Rotting Grandfrogger, Inevitable Snakenhotep); Dungeons set is CardSet7; the dashboard flags CardSet7 in both fight and skill modes | n/a | W-dungeons | n/a | `cards.json` effects `Dungeon_*`; `utility/dashboard/characters.js#L357-L366` [C53] |
| M21 | Omega chip slots | chips boost only the 8 slots Toolbox keeps; the game stores 12 CardEquip entries. Slot 0 / 7 position-to-UI mapping not verified | 8 | W4 Lab | n/a | `character.ts#L440-L451` [C12] [C4] |
| M22 | Passive cards in the account-wide sum | Many W1-W4 passives: Massive Troll (kitchen speed), Chaotic Chizoar (shrine effects), TV (breeding EXP), Soda Can (star talent pts), Flombeige (crit chance), Crystal Custard (line width), Godshard; later Crystal Capybara (+3 skill efficiency per Lv, W5) | n/a | own the card | none | `cards.ts#getCardBonusByEffect(account.cards, ...)` [C15] [C38] [C54] |
| M19 | Dashboard alerts | set vs afkType, Blunder Hills at Lv 50, passive card equipped | n/a | n/a | n/a | `utility/dashboard/characters.js#cardsAlert` [C24] |

W5+ extensions, one line each: W5 Smolderin' Plateau set and Gem pack [C50]; W6 Spirited Valley set and Spirit pack [C50]; W7 Shimmerfin Deep set, Spelunking cards (Lv 7 gate) and Legend talent 21 [C14] [C7]; Hard Resources set needs Spelunking cards [C22]; late cards have perTier up to tens of millions [C50].


### Set sizes and tier thresholds (W1-W4 relevant)

| Set | Cards | Bonus per tier | Sum of Lv for tier 1 / 2 / 3 / 4 / 5 |
|---|---|---|---|
| Blunder Hills (W1) | 16 | 8% EXP below Lv 50 | 16 / 32 / 48 / 64 / 80 |
| Yum Yum Desert (W2) | 14 | 10% All Food Effect | 14 / 28 / 42 / 56 / 70 |
| Easy Resources (W1-W2 skilling) | 13 | 8% Skill Efficiency | 13 / 26 / 39 / 52 / 65 |
| Medium Resources (W2-W4 skilling) | 31 | 5% Skill EXP | 31 / 62 / 93 / 124 / 155 |
| Frostbite Tundra (W3) | 16 | 5% DEF and ACC | 16 / 32 / 48 / 64 / 80 |
| Hyperion Nebula (W4) | 14 | 6% Crit Chance | 14 / 28 / 42 / 56 / 70 |
| Hard Resources | 36 | 2% Skill AFK Gain | needs W5-W7 cards |
| Dungeons / Bosses / Events | 23 / 29 / 25 | 5% credits / 6% Dmg-Drop-EXP / 7% Drop Rate | 23 / 29 / 25 per tier |

Sizes and bonuses [C21]; tiers by [C19].

## Min-max by stage

Hard facts first, then opinion. "Contested" notes where sources differ (ADR 0004 amendment: judgment entries are contested when two or more post-patch sources disagree). Only one community guide (rev. 2026-09-18) was re-read this run; the earlier dossier's AutoReview reading (2026-09-23) is carried as tier 4, not re-fetched.

| Stage | Priority (in order) | Source |
|---|---|---|
| W1 early (Lv 1-30) | 1. Fill every card slot on every character; any card beats none. 2. Equip class main-stat card (Warrior Wode Board, Archer Carrotman, Mage Slime/Walking Stick, Journeyman Red Mushroom). 3. Bored Bean for base damage, Glublin for % HP. 4. Blunder Hills set at sum Lv 16 (tier 1 = 8% EXP, only below Lv 50). 5. Kill each new map until its card is owned (5x first copy). | [C44] [C21] [C26] (order is opinion, tier 4 where guide-sourced: [C40]) |
| W1 mid/late (Lv 30-50) | 1. Amarok card on every skiller (skill AFK gain; boss cards skip the 5x so farm via kills only). 2. Wood Mushroom (accuracy) if accuracy-gated. 3. Crystal Carrot (+5% drop rate, perTier 3; Crystal Cattle and Custard are perTier 10) and Poop card (spawn chance). 4. Gigafrog on whoever hunts cards plus Pokaminni. 5. Buy Extra Card Slot before any pack. | [C40] [C31] [C32] [C34] [C42] |
| W2 | 1. Yum Yum set for fighters at Lv 50+ (14 cards, 10% food effect per tier). 2. Easy Resources set on every skiller (13 cards, 8% efficiency per tier, cheap). 3. Efficiency cards per skill: Iron, Birch Tree, Hermit Can, Butterflies. 4. Fighting: Dr Defecaus, Mimic, Pincermin, Mashed Potato (crit damage), Crystal Crabal. 5. Snelbie on the card farmer. 6. Chaotic Amarok / Boop on fighters (fight AFK). | [C21] [C28] [C32] (card picks from cards.json effects, tier 1; order tier 4) |
| W3 | 1. Frostbite set on pushers while accuracy/DEF gate maps; otherwise Yum Yum. 2. Snowman and Bloodbone (+3% total damage each), Bloodbone to 3-star per the guide. 3. Dedotated Ram (+2 WP), Xylobone (crit), Thermister (crit dmg), Sir Stache (card drop), Bop Box (drop rate). 4. Skillers: Medium Resources for levelling, efficiency/speed cards (Void, Toilet, Skelefish, Mosquisnow). 5. Trapping (Crabbo, Dung Beat) and Worship soul cards on those characters. | [C41] [C28] [C44] [C23] |
| W4 | 1. Hyperion Nebula cards: 13 cards at 1 in 50,000 base each, perTier 15-30, so expect long farms; prioritise flat main-stat (Flying Worm WIS, Biggole Wurm AGI, Octodar STR, +12 each) and Choccie (+2.5 WP). 2. Chaotic Troll (+10% all skill efficiency) on skillers. 3. Rift 45 (Lv 6 / 5-star) for already high-copy cards; consider 5-star Cardifier. 4. Skill Mastery at skill level 300 frees skill-card slots. 5. Lab chips 20/21 when buildable. 6. Max Extra Card Slot (8) then presets. | [C48] [C49] [C7] [C16] [C13] [C42] |

Per class: card effects are class-neutral; only the main-stat card changes ([C44]). Contested: the community guide advises "max card slots" at S tier but gives no cost; the Gem Shop file gives 150 gems +40 (4 buys), a total of 780 gems ([C1]). The Frostbite-vs-Yum-Yum choice for fighters is ActiveOn's own heuristic, confidence L ([C47]).

## Appendix A: W1-W4 card table (base chances before x5 and CardChanceMulti)

| Idx | Card | Set | Effect | Bonus | perTier | Base chance (top source) |
|---|---|---|---|---|---|---|
| A0 | Green Mushroom | Blunder Hills | Base HP | 12 | 5 | 1 in 500 (mushG) |
| A1 | Red Mushroom | Blunder Hills | Base LUK | 3 | 10 | 1 in 10 (mushR) |
| A2 | Frog | Blunder Hills | Base MP | 10 | 6 | 1 in 333 (frogG) |
| A3 | Bored Bean | Blunder Hills | Base Damage | 7 | 7 | 1 in 250 (beanG) |
| A4 | Slime | Blunder Hills | Base WIS | 2 | 8 | 1 in 20 (slimeG) |
| A5 | Baby Boa | Blunder Hills | Move Spd | 1 | 9 | 1 in 43 (snakeG) |
| A6 | Carrotman | Blunder Hills | Base AGI | 2 | 10 | 1 in 50 (carrotO) |
| A7 | Glublin | Blunder Hills | Total HP | 2 | 10 | 1 in 56 (goblinG) |
| A8 | Wode Board | Blunder Hills | Base STR | 2 | 10 | 1 in 50 (plank) |
| A9 | Gigafrog | Blunder Hills | Card Drop Chance | 5 | 10 | 1 in 100 (frogBIG) |
| A10 | Poop | Blunder Hills | Crystal Mob Spawn Chance | 10 | 10 | 1 in 16,667 (poopSmall) |
| A11 | Rat | Blunder Hills | Critical Chance | 1 | 10 | 1 in 20,000 (ratB) |
| A12 | Walking Stick | Blunder Hills | Base WIS | 5 | 10 | 1 in 16,667 (branch) |
| A13 | Nutto | Blunder Hills | Money from Monsters | 5 | 10 | 1 in 20,000 (acorn) |
| A14 | Crystal Carrot | Blunder Hills | Total Drop Rate | 5 | 3 | 1 in 100 (Crystal0) |
| A16 | Wood Mushroom | Blunder Hills | Total Accuracy | 5 | 10 | 1 in 10,000 (mushW) |
| B1 | Sandy Pot | Yum Yum Desert | EXP Conversion from Talent | 12 | 10 | 1 in 100 (jarSand) |
| B2 | Mimic | Yum Yum Desert | Total Drop Rate | 2 | 10 | 1 in 111 (mimicA) |
| B3 | Crabcake | Yum Yum Desert | To not consume Food | 5 | 10 | 1 in 125 (crabcake) |
| B4 | Mafioso | Yum Yum Desert | Base AGI | 5 | 10 | 1 in 143 (coconut) |
| B5 | Sand Castle | Yum Yum Desert | Total Accuracy | 4 | 10 | 1 in 167 (sandcastle) |
| B6 | Pincermin | Yum Yum Desert | Weapon Power | 1 | 10 | 1 in 200 (pincermin) |
| B7 | Mashed Potato | Yum Yum Desert | Critical Damage | 3 | 10 | 1 in 250 (potato) |
| B8 | Tyson | Yum Yum Desert | Base STR | 5 | 10 | 1 in 500 (steak) |
| B9 | Moonmoon | Yum Yum Desert | Monster EXP While Active | 8 | 10 | 1 in 1,000 (moonman) |
| B10 | Sand Giant | Yum Yum Desert | Minimum Damage | 2 | 10 | 1 in 1,000 (sandgiant) |
| B11 | Snelbie | Yum Yum Desert | Card Drop Chance | 8 | 10 | 1 in 1,000 (snailZ) |
| B12 | Dig Doug | Yum Yum Desert | Base LUK | 6 | 10 | 1 in 25 (shovelR) |
| B13 | Crystal Crabal | Yum Yum Desert | EXP from monsters | 2 | 3 | 1 in 125 (Crystal1) |
| B14 | Bandit Bob | Yum Yum Desert | Money from Monsters | 1 | 1 | not in monsterDrops.json |
| C1 | Copper | Easy Resources | Base accuracy | 4 | 10 | 1 in 5,000 (Copper) | H (cost, max, index); M (4 + purchases base, N.js) |
| C2 | Iron | Easy Resources | Total Mining Efficiency | 5 | 10 | 1 in 7,692 (Iron) | H (cost, max, index); M (2 + purchases base, N.js) |
| C3 | Gold | Easy Resources | Mining EXP | 5 | 10 | 1 in 9,091 (Gold) | L |
| C16 | Fire Forge | Easy Resources | Smithing EXP (Passive) | 4 | 10 | not in monsterDrops.json | H (thresholds not rechecked) |
| C4 | Oak Tree | Easy Resources | Base Defence | 3 | 10 | 1 in 2,500 (OakTree) | M |
| C5 | Birch Tree | Easy Resources | Total Choppin Efficiency | 5 | 10 | 1 in 3,448 (BirchTree) | H |
| C6 | Jungle Tree | Easy Resources | Choppin EXP | 5 | 10 | 1 in 4,762 (JungleTree) | H |
| C7 | Forest Tree | Easy Resources | EXP Conversion from Talent | 8 | 10 | 1 in 5,882 (ForestTree) | H (code); M (wiki Rift 46 equivalence) |
| C8 | Goldfish | Easy Resources | Total MP | 3 | 10 | not in monsterDrops.json | M |
| C9 | Hermit Can | Easy Resources | Total Fishing Efficiency | 5 | 10 | not in monsterDrops.json | H |
| C10 | Jellyfish | Easy Resources | Fishing EXP | 5 | 10 | not in monsterDrops.json | H |
| C11 | Flies | Easy Resources | Monster EXP While Active | 4 | 10 | 1 in 2,381 (Bug1) | M |
| C12 | Butterflies | Easy Resources | Total Catching Efficiency | 5 | 10 | 1 in 3,333 (Bug2) | H |
| D2 | Plat | Medium Resources | Mining Away Gains | 2 | 10 | 1 in 12,500 (Plat) |
| D1 | Dementia | Medium Resources | Mining Speed | 4 | 10 | 1 in 16,667 (Dementia) |
| D3 | Void | Medium Resources | Total Mining Efficiency | 6 | 10 | 1 in 16,667 (Void) |
| D4 | Lustre | Medium Resources | Mining Speed | 5 | 10 | 1 in 16,667 (Lustre) |
| D16 | Cinder Forge | Medium Resources | Smithing EXP (Passive) | 7 | 10 | not in monsterDrops.json |
| D7 | Palm Tree | Medium Resources | Choppin Away Gains | 2 | 10 | 1 in 9,091 (PalmTree) |
| D5 | Toilet Tree | Medium Resources | Choppin Speed | 4 | 10 | 1 in 8,333 (ToiletTree) |
| D6 | Stump Tree | Medium Resources | Total Accuracy | 3 | 10 | 1 in 7,692 (StumpTree) |
| D8 | Saharan Foal | Medium Resources | Choppin Away Gains | 2.5 | 10 | 1 in 10,000 (SaharanFoal) |
| F2 | Wispy Tree | Medium Resources | Choppin Speed | 6 | 10 | 1 in 10,000 (Tree7) |
| F13 | Alien Tree | Medium Resources | Total Choppin Efficiency | 8 | 10 | 1 in 100,000 (AlienTree) |
| F12 | Cubed Tree | Medium Resources | Choppin Speed | 7 | 10 | 1 in 25,000 (Tree8) |
| D11 | Bloach | Medium Resources | Fishing Away Gains | 2 | 10 | not in monsterDrops.json |
| F20 | Skelefish | Medium Resources | Total Fishing Efficiency | 8 | 8 | not in monsterDrops.json |
| F21 | Shark | Medium Resources | Fishing Speed | 4 | 10 | not in monsterDrops.json |
| F22 | Manta Ray | Medium Resources | Fishing EXP | 10 | 10 | not in monsterDrops.json |
| F23 | Kraken | Medium Resources | Fishing Away Gains | 3 | 10 | not in monsterDrops.json |
| D10 | Sentient Cereal | Medium Resources | Catching EXP | 5 | 10 | 1 in 3,571 (Bug3) |
| D9 | Fruitflies | Medium Resources | Catching Away Gains | 2 | 10 | 1 in 4,000 (Bug4) |
| F8 | Mosquisnow | Medium Resources | Total Catching Efficiency | 7 | 10 | 1 in 4,000 (Bug5) |
| F9 | Flycicle | Medium Resources | Catching Away Gains | 2.5 | 10 | 1 in 4,000 (Bug6) |
| F14 | Bumble Bee | Medium Resources | Total Catching Efficiency | 8 | 10 | 1 in 20,000 (Bug7) |
| D17 | Forest Soul | Medium Resources | Defence from Equipment | 3 | 3 | not in monsterDrops.json |
| D18 | Dune Soul | Medium Resources | Starting Pts in Worship | 4 | 3 | not in monsterDrops.json |
| F3 | Rooted Soul | Medium Resources | Starting Pts in Worship | 6 | 3 | not in monsterDrops.json |
| F10 | Frigid Soul | Medium Resources | Max Charge | 7 | 4 | not in monsterDrops.json |
| D19 | Froge | Medium Resources | Shiny Critter Chance | 3 | 4 | not in monsterDrops.json |
| D20 | Crabbo | Medium Resources | Trapping Efficiency | 5 | 4 | not in monsterDrops.json |
| D21 | Scorpie | Medium Resources | Trapping EXP | 5 | 4 | not in monsterDrops.json |
| F4 | Mousey | Medium Resources | Shiny Critter Chance | 5 | 4 | not in monsterDrops.json |
| F5 | Owlio | Medium Resources | EXP from monsters | 1.25 | 4 | not in monsterDrops.json |
| E0 | Sheepie | Frostbite Tundra | Defence from Equipment | 3 | 11 | 1 in 100 (sheep) |
| E1 | Frost Flake | Frostbite Tundra | Base STR | 7 | 12 | 1 in 125 (flake) |
| E2 | Sir Stache | Frostbite Tundra | Card Drop Chance | 9 | 13 | 1 in 250 (stache) |
| E3 | Bloque | Frostbite Tundra | Base AGI | 7 | 14 | 1 in 500 (bloque) |
| E4 | Mamooth | Frostbite Tundra | Total HP | 3.5 | 15 | 1 in 1,000 (mamoth) |
| E5 | Snowman | Frostbite Tundra | Total Damage | 3 | 15 | 1 in 2,000 (snowball) |
| E6 | Penguin | Frostbite Tundra | Base WIS | 7 | 15 | 1 in 3,333 (penguin) |
| E7 | Thermister | Frostbite Tundra | Critical Damage | 4 | 15 | 1 in 10,000 (thermostat) |
| E8 | Quenchie | Frostbite Tundra | Base LUK | 7 | 17 | 1 in 10,000 (glass) |
| E9 | Cryosnake | Frostbite Tundra | MP regen rate | 5 | 17 | 1 in 10,000 (snakeB) |
| E10 | Bop Box | Frostbite Tundra | Total Drop Rate | 3.5 | 17 | 1 in 10,000 (speaker) |
| E11 | Neyeptune | Frostbite Tundra | Total Accuracy | 5 | 17 | 1 in 10,000 (eye) |
| E14 | Dedotated Ram | Frostbite Tundra | Weapon Power | 2 | 20 | 1 in 10,000 (ram) |
| E12 | Xylobone | Frostbite Tundra | Critical Chance | 1 | 15 | 1 in 100 (skele) |
| E13 | Bloodbone | Frostbite Tundra | Total Damage | 3 | 15 | 1 in 10,000 (skele2) |
| E15 | Crystal Cattle | Frostbite Tundra | EXP from monsters | 3 | 10 | 1 in 125 (Crystal2) |
| G1 | Purp Mushroom | Hyperion Nebula | Money from Monsters | 8 | 15 | 1 in 50,000 (mushP) |
| G2 | TV | Hyperion Nebula | Breeding EXP (Passive) | 5 | 17 | 1 in 50,000 (w4a2) |
| G3 | Donut | Hyperion Nebula | Defence from Equipment | 4 | 18 | 1 in 50,000 (w4a3) |
| G4 | Demon Genie | Hyperion Nebula | Crystal Mob Spawn Chance | 15 | 19 | 1 in 50,000 (demonP) |
| G6 | Soda Can | Hyperion Nebula | Star Talent Pts (Passive) | 5 | 20 | 1 in 50,000 (w4b2) |
| G5 | Flying Worm | Hyperion Nebula | Base WIS | 12 | 21 | 1 in 50,000 (w4b1) |
| G7 | Gelatinous Cuboid | Hyperion Nebula | Lab EXP gain | 4 | 22 | 1 in 50,000 (w4b3) |
| G8 | Choccie | Hyperion Nebula | Weapon Power | 2.5 | 23 | 1 in 50,000 (w4b4) |
| G9 | Biggole Wurm | Hyperion Nebula | Base AGI | 12 | 24 | 1 in 50,000 (w4b5) |
| G10 | Clammie | Hyperion Nebula | Multikill per tier | 1.5 | 26 | 1 in 50,000 (w4c1) |
| G11 | Octodar | Hyperion Nebula | Base STR | 12 | 27 | 1 in 50,000 (w4c2) |
| G12 | Flombeige | Hyperion Nebula | Critical Chance (Passive) | 1.5 | 28 | 1 in 50,000 (w4c3) |
| G13 | Stilted Seeker | Hyperion Nebula | All Stat | 0.5 | 30 | 1 in 50,000 (w4c4) |
| G14 | Crystal Custard | Hyperion Nebula | Line Width (Passive) | 2 | 10 | 1 in 125 (Crystal3) |
| Z0 | Baba Yaga | Bosses | Money from Monsters | 10 | 1.5 | 1 in 33 (babayaga) |
| Z1 | Dr Defecaus | Bosses | Total Damage | 5 | 1.5 | 1 in 33 (poopBig) |
| A15 | Boop | Bosses | Fighting AFK gain rate | 1 | 1 | 1 in 667 (poopD) |
| Z2 | Amarok | Bosses | Skill AFK gain rate | 2.5 | 1.5 | 1 in 25 (wolfA, 4%); the GrasslandsBoss row is 1 in 22 (4.5%) [C32] |
| Z4 | Chaotic Amarok | Bosses | Fighting AFK gain rate | 2.5 | 1.5 | 1 in 50 (wolfB) |
| Z14 | Radiant Amarok | Bosses | Weapon Power | 3 | 10 | 1 in 50 (wolfC) |
| Z5 | Biggie Hours | Bosses | Double AFK claim chance | 3 | 1.5 | 1 in 42 (babaHour) |
| Z6 | King Doot | Bosses | Total Drop Rate | 6 | 1.5 | 1 in 25 (babaMummy) |
| Z3 | Efaunt | Bosses | EXP from monsters | 5 | 1.5 | 1 in 40 (Boss2A, 2.5%); 1 in 2,000,000 is the EfauntArm row [C32] |
| Z7 | Chaotic Efaunt | Bosses | Skill EXP | 3.75 | 1.5 | 1 in 62 (Boss2B) |
| Z15 | Gilded Efaunt | Bosses | Star Talent Pts (Passive) | 15 | 11 | 1 in 50 (Boss2C) |
| Z12 | Dilapidated Slush | Bosses | Money from Monsters | 12 | 5 | 1 in 5 (mini3a) |
| Z8 | Chizoar | Bosses | Cog Build Spd (Passive) | 8 | 1.5 | 1 in 143 (Boss3A) |
| Z9 | Chaotic Chizoar | Bosses | Shrine Effects (Passive) | 5 | 1.5 | 1 in 250 (Boss3B) |
| Z16 | Blighted Chizoar | Bosses | All Stat | 1.5 | 12 | 1 in 500 (Boss3C) |
| Z13 | Mutated Mush | Bosses | Cooking EXP gain | 6 | 5 | 1 in 5 (mini4a) |
| Z10 | Massive Troll | Bosses | Kitchen Speed (Passive) | 6 | 2 | 1 in 250 (Boss4A) |
| Z11 | Chaotic Troll | Bosses | All Skill Efficiency | 10 | 2 | 1 in 500 (Boss4B) |
| Z17 | Blitzkrieg Troll | Bosses | Total Damage | 7 | 4 | 1 in 333 (Boss4C) |

Source and values: [C30]. Fishing, soul and critter cards show no Toolbox drop entry; bug/catching cards and Forge card Godshard (2e-6) do [C37]. W1 'Red Mushroom 1 in 10' etc. are the base entries; multiply the chance by 5 when unowned (not bosses) and by CardChanceMulti [C26] [C25].

## Sprite needs

Existing: `sys-cards` (systems grid) and `item-card-frame` (items grid). New sprites that the Cards view would need: star-tier borders (Lv 2 Bronze to Lv 7 Majestic), set-bracket badges, passive (P) marker, preset slots 1-7, unowned (5x) marker. Art style per the existing 16-grid files in `apps/activeon/src/art/sprites/grids/`.

## Open questions

- How does the 4-star Cardifier (Gem Shop index 67) persist in the save? Toolbox only reads lists for 5-star and 6-star (accountOptions 155/603); a 4-star pick may raise the copy count in Cards0. Needs a fixture diff.
- Is the character Lv 15 requirement for card presets real? Code reads `2 + GemItemsPurchased[66]` with no level check; wiki says Lv 15. Check the preset UI branch.
- Does the applied set bonus cap at tier 5 (6 with the 6-star flag)? The UI's next-tier target is capped, the applied round(tier x base) is not in the code read. Matters once Lv 6 / 7 cards exist (W4+).
- Fishing, soul, critter and Forge card drop sources are absent from Toolbox monsterDrops.json; need the N.js fishing/worship/trapping read to model ETAs (trapping formula is from the prior dossier only).
- Which card bonus ids feed `CardBonusREAL(12)` and `EtcBonuses(26)` (the obol/equipment card-drop term)? Not decoded this run.
- Resolved by verification: `CardSet12` does not exist in `cardSets`; the Shimmerfin Deep (Class EXP) set is CardSet10, so Toolbox's CardSet12 term is a dead read (always 0) [C23].
- Cardifier availability: GemQ18/Q19 are past limited specials (lastSeen below game 2.3.540). Does the live shop still sell them, and on what schedule? Needs an in-game or changelog check [C11].
- Pack opening odds and the guaranteed-boss logic: CardPack3/5/6/7 descriptions are placeholders in game data, and the logic sits in N.js only; rarities are not data-readable [C33].
- Dungeon card drop mechanics (card chance and credits cards) were catalogued from `cards.json` effects only; the dungeon drop formula is unresearched [C53].
- `calculateAmountToNextLevel` groups terms differently from `calculateStars` and does not special-case Boss3B; equal for stars 0-5 but Chaotic Chizoar's displayed next-level target may be wrong at high levels [C55].
- Wiki says 'Rift 46' where the code says Rift[0] >= 45; the wiki's Rift page and the code probably index differently (confidence M that they match).
- Community coverage is thin: web-search budget ran out. No Reddit r/idleon thread, IdleOn Academy page or Steam guide was read this run; the min-max order beyond the shnaps gist (rev. 2026-09-18) and the earlier AutoReview reading is unverified. Re-run with search access to add per-stage consensus and card-farming ETAs from the community.
- Map-by-map card locations (which map drops which card) were not extracted; monsterDrops.json keys by monster and the map join failed. Needed for 'kill here for card X' advice.
- Sprite art for star borders is not designed yet (see Sprite needs).

## Claims register

| Id | Claim | Source | Tier | Conf |
|---|---|---|---|---|
| C1 | A character equips round(4 + Extra Card Slot purchases) cards; the Extra Card Slot Gem Shop item (GemP3, global index 63) costs 150 gems +40 per buy, max 4 buys, so 4 to 8 slots, for all characters. | https://www.legendsofidleon.com/ytGl5oc/N.js (card UI init, `GemItemsPurchased[63]`, offset 7486834 in the copy fetched 2026-10-19); https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/gemShop.json GemP3 | 1 | H (cost, max, index); M (4 + purchases base, N.js) |
| C2 | A character has 2 + Card Presets purchases presets; the Card Presets Gem Shop item (GemQ9, global index 66) costs 250 gems +160 per buy, max 5 buys, so 2 to 7 presets, for all characters. | https://www.legendsofidleon.com/ytGl5oc/N.js (`GemItemsPurchased[66]`, offset 7495925); https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/gemShop.json GemQ9 | 1 | H (cost, max, index); M (2 + purchases base, N.js) |
| C3 | The wiki says card presets unlock at character Lv 15 (2 presets of 4 slots each); no Lv 15 gate was found in the game code read (the preset count in code is 2 + purchases). | https://idleon.wiki/wiki/Cards (fetched 2026-10-19; edit date not shown) | 3 | L |
| C4 | Each character's equipped cards are the save array CardEquip_N (default 12 entries, 'B' = empty); Toolbox keeps only the first 8. The chosen preset index is PlayerStuff[2] and the saved presets are CardPreset_N. | https://www.legendsofidleon.com/ytGl5oc/N.js (CardEquip_ loader, offset 19886896); https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/cards.ts#L167-L172; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/character.ts#L410-L436 | 1 | M |
| C5 | The collection is the account-wide save map Cards0 (rawName -> copies). Equipped cards (CardEquip_N) and the equipped set (CSetEq_N, a one-key map setRawName -> bonus) are per character. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/cards.ts#L14-L18, L152-L165; https://www.legendsofidleon.com/ytGl5oc/N.js (`Cards[0]`/`Cards[3]` save, offsets 4409819, 6485747) | 1 | H |
| C6 | A card reaches Lv k+2 (k = 0..maxStars-1) when copies > perTier x (k+1 + floor(k/3) + 16 floor(k/4) + 100 floor(k/5))^2, so the multipliers of perTier are 1, 4, 9, 25, 484, 15129 for Lv 2..7. The comparison is strict (>). Lv 1 needs 1 copy. Stars = Lv - 1. | https://www.legendsofidleon.com/ytGl5oc/N.js (`CardLv`, offset 4079185); https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/cards.ts#L20-L52; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/cardMath.ts#L8-L14 | 1 | H |
| C7 | The star cap is round(4 + Rift 5-star flag + Spelunking 6-star flag): Lv 5 by default, Lv 6 once Rift[0] >= 45, Lv 7 once Spelunk[0][2] >= 1 (the third Spelunking lore boss). | https://www.legendsofidleon.com/ytGl5oc/N.js (`RiftStuff("5starCards")` offset 10781444, `Spelunk("6starCards")` offset 11090050); https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/cards.ts#L54-L59 | 1 | H (code); M (wiki Rift 46 equivalence) |
| C8 | The wiki states the Lv 6 (5-star Ruby) unlock as 'Rift 46' (guide says 'Rift milestone 46'); the code gate is Rift[0] >= 45. Same event: the game UI draws Rift[0]+1 (N.js @8924838), so wiki "Rift 46" = code `Rift[0] >= 45` (resolved in contradictions-1 [X1], confidence H); recorded as both. | https://idleon.wiki/wiki/Rift and https://idleon.wiki/wiki/Cards (fetched 2026-10-19); https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa (rev. 2026-09-18) | 3 | M |
| C9 | Chaotic Chizoar (Boss3B) ignores perTier: it levels at copies > 1.5 x (i + 1 + floor(i/3))^2 (so 1.5, 6, 13.5, ... copies). | https://www.legendsofidleon.com/ytGl5oc/N.js (`CardLv`, offset 4079185); https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/cards.ts#L23-L26 | 1 | H |
| C10 | Cardifier picks floor one chosen card at 5-star (Lv 6) via accountOptions[155] (comma list of rawNames) and at 6-star (Lv 7) via accountOptions[603], but only if the card is owned. No Toolbox list exists for the 4-star Cardifier (Lv 5); how it is stored is not read (open question). | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/cards.ts#L30-L52, L60-L63 | 1 | H |
| C11 | Gem Shop cardifiers: 4-star (GemQ17, 325 gems, index 67, unlimited); 5-star (GemQ18, 486 gems, index 91, max 10); 6-star (GemQ19, 880 gems, index 92, max 6). Each purchase lifts one chosen card one star. **Availability caveat (game-data lens):** GemQ18 (firstSeen 2.3.34, lastSeen 2.3.531) and GemQ19 (firstSeen 2.3.522, lastSeen 2.3.530) are past limited specials, below game 2.3.540, so they may be retired or time-limited; only GemQ17 has no lastSeen. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/gemShop.json (GemQ17-19; GemQ18 lastSeen 2.3.531, GemQ19 lastSeen 2.3.530, firstSeen 2.3.522 per the file) | 1 | M |
| C12 | An equipped card gives bonus x Lv x chipBoost x legendBonus, where chipBoost is 2 for the Omega Nanochip / Omega Motherboard chip on slot 0 / slot 7 (else 1) and legendBonus = 1 + Legend talent 21 / 100. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/cardMath.ts#L16-L19; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/character.ts#L440-L451 | 1 | H |
| C13 | Lab chip 20 Omega Nanochip doubles the card in the top-left slot and chip 21 Omega Motherboard the bottom-right slot (one each per player); they need 10,000,000 Fairy / Kraken plus W4 cooking meals and W5 spices. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/shared-data.json `chips[20]`, `chips[21]` | 1 | H |
| C14 | Legend talent 21 'Flopping a Full House' (x1 5, x2 15) multiplies actively equipped card bonuses, stacking with the Lab chips. W7 system. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/shared-data.json `legendTalents[21]` | 1 | H |
| C15 | Cards whose effect text ends '(Passive)' or '(P)' give their bonus from the collection without being equipped; Toolbox sums them over account.cards (level only, no chip/legend boost). The dashboard flags such a card in a slot as wasted. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/cards.ts#L132-L138; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/utility/dashboard/characters.js#L379-L383; https://idleon.wiki/wiki/Cards | 1 | H |
| C16 | Rift Skill Mastery: once Rift >= 15 and a skill's rank > 2 (skill level >= 300; ranks break at 150/200/300/400/500/750/1000), every owned card of that skill counts as if equipped (Toolbox getSkillCardBonus). The wiki repeats Level 300 for Mining and other skills. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/misc.ts#L835-L850; https://idleon.wiki/wiki/Rift (fetched 2026-10-19) | 1 | H (thresholds not rechecked) |
| C17 | Upgrade Vault #44 'Card Retirement' (max Lv 1, unlockLevel 1850, 50,000,000 base cost) makes the cards that give Card Drop Rate bonuses passive. Vault #70 'Collection Cashout' gives +% coins per card found. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/shared-data.json `upgradeVault[44]`, `[70]`; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/misc/upgradeVault.ts#L27, L153 | 1 | H (Card_Retirement); M (Collection_Cashout text) |
| C18 | Total card levels (sum of Lv of every owned card) feeds a Tome quantity. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-4/tome.ts#L289; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/cards.ts#L174-L177 | 1 | H |
| C19 | A card set's tier is floor(sum of its cards' Lv / number of cards in the set) and the equipped bonus is round(tier x base). Unowned cards count 0. The set UI caps the next-tier target at min(5 + 6-star flag, tier) + 1 but the applied value is not capped in the code read. | https://www.legendsofidleon.com/ytGl5oc/N.js (set build offsets 7493000-7494800 and apply 7494487-7494746); https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/cards.ts#L95-L118 | 1 | M |
| C20 | Each character equips exactly one card set (CSetEq_N holds one key); picking another set deletes the previous key. | https://www.legendsofidleon.com/ytGl5oc/N.js (set click handler, offset 7340834-7341345) | 1 | L |
| C21 | Set sizes and base bonus per tier: Blunder Hills 16 cards, 8% EXP if below Lv 50; Yum Yum Desert 14, 10% All Food Effect; Easy Resources 13, 8% Skill Efficiency; Medium Resources 31, 5% Skill EXP; Frostbite Tundra 16, 5% DEF and ACC; Hard Resources 36, 2% Skill AFK Gain Rate; Dungeons 23, 5% more Dungeon Credits; Bosses 29, 6% Dmg/Drop/EXP; Events 25, 7% Drop Rate; Hyperion Nebula (W4) 14, 6% Crit Chance; Smolderin' Plateau (W5) 17, 2% Fight AFK Gain Rate; Spirited Valley (W6) 15, 6% Multikill per Tier; Shimmerfin Deep (W7) 25, 10% Class EXP (Multi). | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/shared-data.json `cardSets`; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/cards.json (counts per category) | 1 | H |
| C22 | Hard Resources has 36 cards, which include 7 Spelunking cards (F41-F51 range; Spelunking is a World 7 skill in Toolbox: parsers/world-7/spelunking.ts; the 7 count was not rechecked) plus W5+ resource cards with perTier up to 4,000,000 (the earlier figure of 5,000 understated it), so a W1-W4 account cannot reach its first tier (needs all 36 owned). | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/cards.json (category Hard_Resources); https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-7/spelunking.ts | 1 | M |
| C23 | Toolbox applies set bonuses by rawName: CardSet0 EXP below Lv 50, CardSet1 food effect, CardSet2 skill efficiency, CardSet3 skill EXP, CardSet5 skill AFK gain, CardSet25/26 drop and damage and EXP. It also applies CardSet4, 6, 8 and 9 (damage.ts, character.ts). It reads a 'CardSet12' bonus (class EXP multiplier) from account.cards.cardSets, an object that getCards never builds; CardSet12 does not exist in cardSets (the Class EXP / Shimmerfin Deep set rawName is CardSet10), so that term is always 0 (a Toolbox gap). | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/character.ts#L1661, L1944, L1960, L2077-L2093, L2395, L3173, L3246; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/efficiency.ts#L168 | 1 | H |
| C24 | The Toolbox dashboard alerts: Blunder Hills set at Lv >= 50; fighting with a skilling set (CardSet2/3/5/7; CardSet7 Dungeons is flagged in both fight and skill modes); skilling with a fighting set (CardSet4/6/8/7/26 ...); a passive card equipped. It does not alert on empty slots (commented out). | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/utility/dashboard/characters.js#L343-L383 | 1 | H |
| C25 | CardChanceMulti = 1.2 + (Five Aces bribe + Pokaminni star sign + equipped Card Drop cards + Anearful vial + Card Stamp + Cards Galore talent + guild Card Spotter + obol/equipment card-drop % + Card Champ bubble) / 100 x (1 + Cardiovascular! talent / 100). Toolbox has no function for it. | https://www.legendsofidleon.com/ytGl5oc/N.js (`CardChanceMulti`, offset 4055229); Toolbox grep for carddrop in parsers/ and utility/ returned no match | 1 | L |
| C26 | At drop-table load every drop entry whose item id contains 'Cards' is multiplied by 5 when the account owns 0 copies, except ids containing 'CardsZ' (boss cards, cardIndex Z*), which skip the 5x; every Cards entry then gets x CardChanceMulti. | https://www.legendsofidleon.com/ytGl5oc/N.js (`LootDropOddsReset`, offset 6511155; second copy of the loop at offset 5894 of that block) | 1 | L |
| C27 | Multiplier components: Five Aces in the Deck bribe +20 (70,000 coins); Pokaminni star sign +15 (not in dungeons); Anearful vial +2 per level; Card Stamp (StampC9) +1 per level; Cards Galore (Journeyman talent, decay 50/100); Cardiovascular! (Star talent 628, decay 60/60, multiplicative); C2 Card Spotter guild bonus (decay 60/50, max Lv 50); Card Champ bubble (Kazam c18, decay 100/40, costs Strung Jewels spice). | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/shared-data.json (`bribes[10]`, `starSigns[41]`, `guildBonuses[12]`), vials.json, stamps.json, talents.json, cauldrons.json `kazam[18]` | 1 | M |
| C28 | Card Drop Chance cards (equipped, +bonus x Lv): Gigafrog W1 +5, Snelbie W2 +8, Sir Stache W3 +9 (all perTier 10/10/13), Egggulyte (Easter event) +1; in bonus id 12 'Card_Drop_Chance'. Lava Slimer / Grumblo / Glaciaxus dungeon cards raise Dungeon Card Chance separately. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/cards.json | 1 | H |
| C29 | Since Toolbox omits CardChanceMulti, an ActiveOn ETA built from base chances is a floor. The multiplier is at least 1.2 for every account (and 1.4 with only the Five Aces bribe), so real ETAs are at most 1/1.2 of the base-rate figure. | https://www.legendsofidleon.com/ytGl5oc/N.js (`CardChanceMulti`, offset 4055229; bribe 10 value 20) | 1 | L |
| C30 | Base card chances (monsterDrops.json, before x5 and CardChanceMulti) range from 1 in 10 (Red Mushroom) and 1 in 20 (Slime) in W1 to 1 in 16,667 to 20,000 for Poop, Walking Stick, Rat and Nutto, 1 in 10,000 for most W3 cards, and 1 in 50,000 for each of the 13 W4 Hyperion Nebula cards. Full list in Appendix A. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/monsterDrops.json (rawName CardsA0.. CardsG14) | 1 | H |
| C31 | **Disputed.** Crystal mobs carry one card each (Carrot 1%, Crabal 0.8%, Cattle 0.8%, Custard 0.8% base). Original view: low perTier (3) for all W1-W3 crystal cards, cheapest to level. Game-data lens (cards.json): only Crystal Carrot and Crystal Crabal are perTier 3; Crystal Cattle (W3) and Crystal Custard (W4) are perTier 10. Correction adopted: Carrot and Crabal are the cheap ones; the Poop card raises Crystal Mob spawn chance (+10% per Lv). | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/monsterDrops.json; cards.json (Crystal0-3) | 1 | H |
| C32 | **Disputed.** Original view: Amarok 4.5%, Efaunt 1 in 2,000,000. Game-data lens (monsterDrops.json): Amarok (wolfA) CardsZ2 = 4%; the 4.5% row is GrasslandsBoss; Efaunt (Boss2A) CardsZ3 = 2.5%; the 1 in 2,000,000 (5e-7) row belongs to EfauntArm ('Error'). Correction adopted. Boss-card base chances (no unowned 5x): Amarok 4%, King Doot 4%, Efaunt 2.5%, Baba Yaga and Dr Defecaus 3%, Biggie Hours 2.4%, Chaotic Amarok 2%, Chaotic Efaunt 1.6%, Chizoar 0.7%, Chaotic Chizoar 0.4%, Massive Troll 0.4%, Blitzkrieg Troll 0.3%, Chaotic Troll 0.2%; Boop 0.15% (poopD, per the earlier read, not rechecked); Dilapidated Slush and Mutated Mush (minibosses) 20%; Glunko 99%. W1-W3 boss perTier is 1.5 (Boop 1) (Radiant Amarok 10, Gilded Efaunt 11, Blighted Chizoar 12 are later), so few copies level them. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/monsterDrops.json; cards.json (category Bosses) | 1 | H |
| C33 | Gem Shop packs: Newbie 200 gems (3 cards, 15% chance of a boss card; Lv 1/2/3 at 50/35/15%), Ancient 425 (4 cards, 40% boss; Lv 1-4 at 26/30/27/17%), Eternal 600, Galaxy 650 (4th card always a boss per wiki), Smolderin 690 (W5), Spirit 720 (W6). | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/gemShop.json CardPack1-7; https://idleon.wiki/wiki/Gem_Shop (fetched 2026-10-19) | 1 | M |
| C34 | Wiki: buy Extra Card Slot before card packs; Eternal and Galaxy packs always include a boss as the fourth card. | https://idleon.wiki/wiki/Gem_Shop (fetched 2026-10-19; edit date not shown) | 3 | L |
| C35 | Community: when a boss card pack is opened and both the normal and chaotic version of a boss are already Silver (Lv 3) or better, the pack grants a guaranteed higher-tier copy, so bank duplicates to Silver before opening. | https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa (rev. 2026-09-18, not code-verified) | 4 | L |
| C36 | Trapping card chance on collect is (4 x hours)^0.62 x CardChanceMulti > 100 x rand, so long traps beat many short ones; critter and soul cards come from trapping and worship respectively. (Prior dossier read of N.js offset 8036646, not re-derived 2026-10-19.) | https://github.com/YassSoliman/idleon-forge/blob/research/cards-obols/docs/research/systems/2026-10-17-cards-obols.md (N.js @8036646, @7589965) | 3 | L |
| C37 | **Disputed.** Original view: fishing, soul, critter and Forge cards have no entries in monsterDrops.json. Game-data lens: fishing, soul and critter own-card rows are indeed absent, but bug/catching cards (C11, C12, D9, D10, F8, F9, F14, F15, F26 ...) and the Forge card Godshard (F39, 2e-6) do have rows. Correction adopted: fish, soul and critter cards have no rows; catching cards and Godshard do. Fishing, soul and critter sources are not data-readable from Toolbox. Only the prior dossier's note that fishing AFK shows '1 in X hr' from .0015 x CardChanceMulti x kills/h is known. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/monsterDrops.json (grep of C8-C10, D11, F20-F23 returns no entries); prior dossier | 1 | H |
| C38 | Toolbox's skill-efficiency breakdown lists the Chaotic Troll card (+10% All Skill Efficiency, equipped), CardSet2 and Crystal Capybara (3 x Lv, passive) as separate terms, so stacking those three is additive. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/efficiency.ts#L156-L206 | 1 | H |
| C39 | Event cards carry the Egggulyte (+1% card drop) and seasonal Drop Rate cards; the Events set (25 cards, +7% Drop Rate per tier) and Bosses set (29, +6% Dmg/Drop/EXP per tier) contain W1-W7 content and are never completed in W1-W4. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/cards.json, shared-data.json `cardSets` | 1 | H |
| C40 | Early W1 account-wide cards named by the progression guide: Wood Mushroom (accuracy) for an early Elemental Sorcerer, Amarok (skill AFK gain) on all characters, Gigafrog (card drop) paired with Pokaminni while farming cards. | https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa (rev. 2026-09-18) | 4 | L |
| C41 | Mid game (W3-W4) from the same guide: Glunko and Crystal mob cards for weapon power, Bloodbone pushed to 3-star, and a W3 card pack to help the accuracy gates for W4 entry. | https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa (rev. 2026-09-18) | 4 | L |
| C42 | The same guide's gem-shop buying order ends '... extra card slot (max it)'; the prior research recorded AutoReview ranking Extra Card Slot in its S tier (not re-fetched, the raw file URL returned 404 on 2026-10-19). | https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa; prior dossier citing AutoReview @05ac449 progression_tiers.py | 4 | L |
| C43 | Community card-farming setup: full drop-rate gear and obols in personal and family slots, Pokaminni star sign (not effective in dungeons), farmer on an Elemental Sorcerer or Siege Breaker. | https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa (rev. 2026-09-18) | 4 | L |
| C44 | Class main-stat base cards: Warrior STR (Wode Board W1, Tyson W2, Frost Flake W3, Octodar W4), Archer AGI (Carrotman, Mafioso, Bloque, Biggole Wurm), Mage WIS (Slime, Walking Stick, Penguin, Flying Worm), Journeyman LUK (Red Mushroom, Dig Doug, Quenchie, Fire Spirit W5). Slime +2 WIS at perTier 8, Walking Stick +5 WIS at perTier 10. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/cards.json | 1 | H |
| C45 | **Disputed.** Original view: Toolbox applies Base_ card effects in the stat breakdown. Game-data lens: no vendored Toolbox code applies Base_STR/AGI/WIS/LUK card effects (getTotalCardBonusById is unused). My check: damage.ts does apply equipped-card Base_Damage, Base_accuracy, Base_MP and Base_HP via getCardBonusByEffect (L909, L997, L1051, L1078), but not the four main stats. Correction: Toolbox applies some Base_ effects, not Base_STR/AGI/WIS/LUK. Base-stat cards give flat base stats that scale through the class main stat, so they are most valuable when the stat is the class main stat (game logic, not Toolbox-verified). | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/character.ts (cardBonus terms for Base_ effects); cards.json | 2 | L |
| C46 | The wiki changelog records a v1.08 (2026-03-13) buff to W1-W3 card drops, so older drop-rate guides are pre-patch. | https://idleon.wiki/wiki/Changelog/2026 (as cited by the prior dossier, not re-fetched 2026-10-19) | 3 | L |
| C47 | Per-activity preset logic (fight vs skill cards, set vs afkType) is encoded in ActiveOn as keyword matching on card effect text, not as Toolbox data; the set-per-activity order is marked unverified (confidence L) in the Knowledge Base. | packages/knowledge/systems/cards.yaml and cards.facts.yaml | 2 | L |
| C48 | W4 cards (Hyperion Nebula, prefix G): 13 monster cards each at base 1 in 50,000 with perTier 15-30 (Purp Mushroom 15 ... Stilted Seeker 30), plus Crystal Custard (0.8%, perTier 10). Effects: Base_WIS/AGI/STR 12 (Flying Worm, Biggole Wurm, Octodar), Weapon Power 2.5 (Choccie), Multikill/tier 1.5 (Clammie), All Stat 0.5 (Stilted Seeker), Money 8 (Purp Mushroom), plus passive Breeding EXP (TV), Star Talent Pts (Soda Can), Crit Chance (Flombeige). | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/cards.json, monsterDrops.json | 1 | H |
| C49 | W4 bosses: Massive Troll (Kitchen Speed passive 6), Chaotic Troll (+10% All Skill Efficiency, perTier 2), Blitzkrieg Troll (+7 Total Damage, perTier 4); Mutated Mush (Cooking EXP 6, perTier 5). | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/cards.json (Z10, Z11, Z17, Z13) | 1 | H |
| C50 | W5+ extensions: Smolderin' Plateau (H, 17 cards), Spirited Valley (I, 15), Shimmerfin Deep (J, 25) with perTier from 25 up to 40,000,000 copies; late resource cards (Godshard 400, Prehistrium 5,000, Ancient Seaweed 1,000, Fractalfly 1,000, Tuttle 50, Deepsea Soul 250). | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/cards.json | 1 | H |
| C51 | Event cards (cardIndex Y*) come from seasonal events and event shops; they follow the normal drop rule (5x when unowned) but only exist while an event table is live. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/cards.json (category Events); https://www.legendsofidleon.com/ytGl5oc/N.js (`LootDropOddsReset`) | 2 | M |
| C52 | Collection Cashout (Vault 70) counts distinct owned cards (cards found), while the Tome counts the total of Lv; they are two different stats. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/misc/upgradeVault.ts#L153; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-4/tome.ts#L289 | 1 | M (verifier-listed; text unchecked) |
| C53 | Dungeon cards: Dungeon Card Chance on Lava Slimer, Grumblo, Glaciaxus; Dungeon Credits on Chromatium Frog, Forlorn Grandfrogger, Golden Glaciaxus; Dungeon Flurbos on Rotting Grandfrogger, Inevitable Snakenhotep. The Dungeons set (CardSet7, 23 cards, +5% credits) is flagged by the dashboard in both fight and skill modes. Dungeon drop formulas are not researched. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/cards.json (effects Dungeon_*); https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/utility/dashboard/characters.js#L357-L366 | 1 | M |
| C54 | Passive cards counted from the whole collection include Massive Troll, Chaotic Chizoar, TV, Soda Can, Flombeige, Crystal Custard and Godshard in W1-W4/forge, and Crystal Capybara (+3 Skill Efficiency per Lv, W5, perTier 15). Rift Skill Mastery (C16) additionally counts owned skilling cards from the whole collection per skill. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/cards.json; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/efficiency.ts#L156-L206 | 1 | H |
| C55 | Toolbox's calculateAmountToNextLevel uses a different grouping, (s+1) + floor((s+1)/4) + 16 floor((s+1)/5) + 100 floor((s+1)/6), than calculateStars (i+1 + floor(i/3) + 16 floor(i/4) + 100 floor(i/5)). They give the same multipliers (1, 4, 9, 25, 484, 15129) for stars 0-5, and calculateAmountToNextLevel has no Boss3B special case, so the displayed next-level target for Chaotic Chizoar can be wrong at high levels. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/cardMath.ts#L8-L14; https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/cards.ts#L20-L26 | 1 | M (own arithmetic check) |
| C56 | Card packs: CardPack3/5/6/7 descriptions in gemShop.json are placeholders and CardPack4 is absent, so pack rarities and guaranteed-boss logic are not data-readable; the logic is in N.js, not re-derived. | https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/data/website-data/gemShop.json | 1 | M |
