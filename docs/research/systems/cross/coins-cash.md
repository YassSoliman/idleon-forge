# Coins and cash multiplier - M26 dossier

Verified 2026-10-19 (revised after two adversarial verdict sets; no claim was refuted by either lens). Game 2.3.540, Toolbox pin 6c37e3d. `P` = `packages/toolbox-parsers/vendor/parsers/`, `D` = `packages/toolbox-parsers/vendor/data/website-data/`. No prior research exists for this topic (no KB file, no prior ref). All "Toolbox" paths below are relative to `P`.

## Coins and cash multiplier

- **What it is:** Coins are the main currency, dropped by every monster (base amount per monster type, times the per-character "cash multi") and spent on stamps, bribes, shops, Anvil points, Pay 2 Win, Upgrade Vault and more. The cash multi is a product of about 25 factors. [C1, H][C2, H]
- **Unlocks:** Coins from the start. The multi's sources open progressively (Pecunia statue and Penny of Strength in W1-W2; Jawbreaker prayer needs Arena wave 101; Collection Cashout vault needs account level 4750). [C3, H][C13, H][C23, M]
- **Scope:** Per-character multi (gear, obols, cards, talents, post office, map index in Guild term, prayers, golden food, bubbles by main stat), built from many account-wide terms. The coin wallet is account-wide in practice: bank + every character's inventory coins. [C1, H][C29, M]
- **Inputs -> outputs:** Kills (base `monsterCoinQuantity[monster]`) x cash multi -> coins. Coins -> sinks (see catalogue). [C27, H][C1, H]
- **Goals and Milestones:** Hard caps/steps: three of the four pet terms are capped at x5 each (`Math.min(4, bonus)`); Pet Arena (W4 Breeding) wave 20 and 175 steps; achievements 5/10/20%; the Gold armour set x1.5 (+50%); bundle +250%. Table in catalogue. [C4, H][C8, H]
- **Feeds / fed by:** Fed by Alchemy (bubbles, vials), Cooking (meals), Sailing (Maneki Kat), Divinity (Harriep), Upgrade Vault, Companions, Pet Arena (W4 Breeding), Research, Sushi, Farming (crop depot), Lab, Statues, Cards, Talents, Post Office, Guild, Arcade, Dungeons (Flurbo), Achievements, Kangaroo, Ballot, Gambit. Feeds every coin sink: Stamps, Bribes, Anvil points, Alchemy Pay 2 Win, Vault, kitchens/construction, Smithy, shops, Spend Plan. [C1, H][C30, M]
- **Per-session actions:** Check wallet vs cheapest affordable sink (Spend Plan). Check the coin-farming character wears the money gear / Gold set and has Jawbreaker + Penny/Dollar/Nickel matching its main stat. Idle state: wallet far above every affordable sink (coins capped in value only by what the sinks cost). [C33, M]
- **AFK Setup implications:** Coin income is highest on the deepest fight map the character can clear; AFK fighting pays `monsterCoinQuantity` of the AFK target's map monster. Put the coin-sink-bound character (e.g. stamp or bribe gate) on the highest-`monsterCoinQuantity` map it can AFK. [C27, H] (derivation; see Open questions on AFK coin formula.)
- **Min-max by stage:** see section below.
- **Common mistakes:** Treating the cash multi as additive (it is ~25 multiplicative factors); forgetting the main-stat gate on the three cash bubbles (only the bubble matching the class main stat is multiplied, and each applies per 250 of that stat); wearing the Gold set pieces only partially; not buying the bundle-type permanent x3.5; Jawbreaker curse (monster HP) ignored. [C3, H][C1, H]
- **Save and Toolbox fields:** see catalogue. Note: `getCashMulti` is exported but nothing in the vendored parsers calls it, so ActiveOn's Account State does not contain a cash multi today. [C28, M]
- **Sources:** inline per claim.

## Mechanics catalogue

Line-cite note: the final additive bracket is at `character.ts#L2869-L2894` per the source lens and `L2893-2917` per the game-data lens (same terms, cites drift with the vendored file); treat line numbers as approximate (confidence H on contents, L on lines).

Final formula (`character.ts#L2767`; a second copy of the same formula as a code-export string sits at `character.ts#L2981-3008`, not a separate mechanic; `getCashMulti(character, account, characters)`), group order as in code. The multi is `cashMulti = prod(factors) * (1 + bigAdditive/100)` where `bigAdditive` is the 20-term sum at the end. [C1, H][C2, H]

### Multiplicative factors (each is its own multiplier)

| # | Factor | Formula / value | Cap / max | Unlock | Field (parser path) |
|---|---|---|---|---|---|
| 1 | Cash bubbles | `(1 + (PennyStr*floor(STR/250) + DollarAgi*floor(AGI/250) + NickelWis*floor(WIS/250))/100)`. Each bubble: `decay` x1=18, x2=30; bubble gets the class main-stat multiplier only if it matches the class main stat. | bubble level cap per Alchemy | W2 Alchemy (power / quicc / high-iq cauldrons) | `getBubbleBonus(account,'PENNY_OF_STRENGTH'\|'DOLLAR_OF_AGILITY'\|'NICKEL_OF_WISDOM')`; `account.alchemy.bubblesFlat`; `character.stats`; data `D/cauldrons.json` [C3, H] |
| 2 | Companion 24 Cool Bird | `1 + min(4, bonus)`; bonus 3 (4x) base, 5 (6x) upgraded | max x5 | Companion owned | `account.companions.list[24].bonus`, `isCompanionBonusActive(account,24)`; `D/companions.json` [C4, H] |
| 3 | Companion 38 Balloonfish | `1 + bonus` (3 base, 5 upgraded), NO cap in code | none | Companion owned | `account.companions.list[38].bonus` [C4, H] |
| 4 | Companion 45 Equinox Broadbass | `1 + min(4, bonus)`; bonus 0.5 / 1.5 upgraded | x5 | Companion | `...list[45].bonus` [C4, H] |
| 5 | Companion 159 Potluck | `1 + min(4, bonus)`; 1.5 / 3 upgraded | x5 | Companion | `...list[159].bonus` [C4, H] |
| 6 | Event shop 9 | `1 + 0.5*owned` (wiki: "Coin Stacking" 1.50x) | 1 purchase | Event shop | `getEventShopBonus(account, 9)`; `account.accountOptions[311]` letter string [C5, H] |
| 7 | Event shop 20 | `1 + 0.6*owned` (wiki: "Government Subsidy" 1.60x) | 1 purchase | Event shop | `getEventShopBonus(account, 20)` [C5, H] |
| 8 | Bonus-money gear | `1 + stat77/100` | gear | item stat 77 | `getStatsFromGear(character, 77, account)` [C6, H] |
| 9 | Sushi 18 | `1 + sushi18/100` (comment: Tobo Twins) | sushi level | W7 Sushi Station | `world-7/sushiStation.ts getSushiBonus(account,18)` [C26, H] |
| 10 | Sushi 37 | `1 + sushi37/100` (Aji Sashimi) | sushi level | W7 | `getSushiBonus(account,37)` [C26, H] |
| 11 | Research | `1 + (grid149 + grid169)/100`; Glimbo Linguistics baseBonus 15 (maxLv 1), Glimbo BOGO Offer baseBonus 10 (maxLv 2) | grid max | W7 Research | `world-7/research.ts getResearchGridBonus(account,149,0)+(…169,0)` [C25, H] |
| 12 | Extra-money gear | `1 + stat100/100` (wiki: Corsair Uniform "300% Extra Money") | gear | item stat 100 | `getStatsFromGear(character, 100, account)` [C6, H][C31, M] |
| 13 | Gold armour set | `1 + bonusValue/100`, `GOLD_SET` bonusValue 50 ("}x coins"); needs armour set unlocked or equipped | x1.5 | Armor Smithy (W3) | `world-3/armorSmithy.ts getArmorSetBonus(account,'GOLD_SET')`; `D/shared-data.json equipmentSets` [C6, H] |
| 14 | Gambit | `1 + gambit7/100` | gambit level | W5 caverns | `world-5/caverns/gambit.ts getGambitBonus(account,7)` [C26, H] |
| 15 | Cash bundle | `1 + 250*hasBundle/100` = x3.5 | once | Gem-shop bundle `bun_y` ($9.99) | `isBundlePurchased(account,'bun_y')` [C7, H] |
| 16 | Dust Walker | `1 + max(1, DUSTWALKER)*lavaLog(accountOptions[362])/100`; talent x1=30 x2=250 decay; "per POW 10 dust collected" | talent level | Wind Walker (W6 class) | `getHighestTalentAcrossCharacters(characters,'DUSTWALKER')`, `account.accountOptions[362]` [C17, H] |
| 17 | Meal+artifact+kangaroo+ballot | `1 + (meal + Maneki + kangaroo + vote)/100` | see rows below | W4 / W5 / W2 / W2 | see sub-rows |
| 18 | Arena+friend+statue | `1 + (0.5*arena20 + friend5 + 1*arena175 + statue19/100)` (friend and arena enter as fractions) | | W4 Breeding Pet Arena (waves 20 and 175; corrected from 'W3+'), friend bonus | see sub-rows |
| 19 | Lab+vault34+vault37 | `1 + (lab9 + RecipeForProfit*vaultKills[8] + BubbleMoney*totalBubbleLevelsTill100)/100` | | W4 Lab, Vault | see sub-rows |
| 20 | Charm | `1 + charm/100`; Gumball_Necklace "}x Money from Monsters" x1=3 x2=16 x3=40 | charm level | W6 Sneaking pristine charm | `world-6/sneaking.ts getCharmBonus(account,'Gumball_Necklace')` [C26, H] |
| 21 | Prayer | `1 + prayer/100`; Jawbreaker x1=40 x2=200 decay, maxLevel 50, unlockWave 101 (Wakawaka War), curse +% max HP for all monsters | lvl 50 | Arena wave 101 | `getPrayerBonusAndCurse(character.activePrayers,'Jawbreaker',account).bonus`; per-character, must be equipped [C13, H] |
| 22 | Divinity + crop depot | `1 + (harriepMinor + cropDepot)/100` | | W5 Divinity / W6 Farming | `world-5/divinity.ts getAccountMinorDivinityBonus(account,characters,GOD_INDEX.Harriep)`, `account.farming.cropDepot.cash.value` [C14, H] |

Sub-rows of factor 17: Meal `getMealsBonusByEffectOrStat(account,null,'Cash')` (Salad cookReq 25 baseStat 3; Bunt Cake cookReq 3,000,000 baseStat 7; bonus = level x baseStat x multipliers) [C9, H]. Maneki Kat artifact = highest character class level x baseBonus 2 (Sailing artifact, W5; `world-5/sailing.ts#L856`). `artifacts.json` also lists ancient/eldritch/sovereign/omnipotent form multipliers for Maneki_Kat (descriptions: main bonus doubled/tripled/quadrupled, data field `ancientMultiplier`/`eldritchMultiplier` = 1); `getArtifact` applies `formMultiplier = acquired` for upgraded forms, but the Maneki_Kat branch reads `bonus = highestLevel * baseBonus` and the upgraded-form scaling for it was not traced (confidence L) [C10, H]. Kangaroo "Cash" base 3 [C26, H]. Ballot `getVoteBonus(account,34)` only if the bonus is selected [C26, H].
Sub-rows of factor 18: Pet Arena (W4 Breeding) bonus thresholds: wave 20 = "1.5X MONSTER CASH" (+0.5), wave 175 = "2X MONSTER CASH" (+1), `account.accountOptions[89]` vs `randomList[53]` entries 5 and 14 [C8, H]. Friend bonus index 5 `account.friendBonusStats.bonuses[5].value` [C26, H]. Statue 19 PECUNIA [C11, H].
Sub-rows of factor 19: Lab bonus 9 Fungi Finger Pocketer: +2% per 1M Green Mushroom kills [C12, H]. Vault 34 (Recipe for Profit) multiplies `vaultKills[8]` and vault 37 (Bubble Money) multiplies `totalBubbleLevelsTill100`; both sit in the lab group (`character.ts#L2869`), NOT in the final additive bracket. The "per Task Board recipe" wording comes from the in-game description only; the `vaultKills[8]` feed was not traced [C23, M].

### Additive terms inside the final `(1 + sum/100)` bracket

| Term | Formula | Cap / max | Unlock | Field |
|---|---|---|---|---|
| Star talent CASH_MONEY | decay x1=70 x2=50 ("all monsters drop +% more coins") | talent lvl | Special Talent 1 (star talents) | `character.flatStarTalents` [C17, H] |
| Vials | DIETER_DRINK: `add` x1=1 x2=0, stat MonsterCash, ingredient Bean Slices | vial level | W2 Alchemy vials | `getVialsBonusByEffect(account.alchemy.vials,null,'MonsterCash')` [C15, H] |
| Gear | stat 3 | | | `getStatsFromGear(character,3,account)` [C6, H] |
| Obols | etcBonuses[3] | | | `getObolsBonus(character.obols, bonuses.etcBonuses[3])` [C6, H] |
| Cards | equipped cards effect `Money_from_Monsters` | | | `getCardBonusByEffect(character.cards.equippedCards,'Money_from_Monsters')` [C16, H] |
| Molti card | `7 * CardLv('w5b1')` | | W5 | `getCardLevel(account.cards,'w5b1')` [C16, H] |
| CHACHING! | Journeyman talent decay x1=50 x2=100 | | Journeyman line | `getTalentBonus(character.flatTalents,'CHACHING!')` [C17, H] |
| Flurbo | Dungeon Flurbo stat Monster_Cash decay x1=75 x2=100 | | Dungeons | `getDungeonFlurboStatBonus(account.dungeons.upgrades,'Monster_Cash')` [C21, H] |
| Arcade 10 | decay x1=20 x2=100 | arcade max | Arcade | `getArcadeBonus(account.arcade.shop,10)` [C20, H] |
| Arcade 11 | decay x1=30 x2=100 | | | `getArcadeBonus(...,11)` [C20, H] |
| Post Office | Utilitarian Capsule 3rd upgrade `%_Cash_from_Mobs` decay x1=39 x2=200, maxLevel 400, level tiers 24.9/99.9/400.1 | 400 | Post Office | `getPostOfficeBonus(character.postOffice,'Utilitarian_Capsule',2)` [C18, H] |
| Guild | Coin Supercharger decay x1=20 x2=20, maxLevel 100, needs guild bonus 7 at level 5; multiplied by `1 + floor(mapIndex/50)` (world reached) | 100 | Guild | `getGuildBonusBonus(account.guild.guildBonuses,8)`, `character.mapIndex` [C19, H] |
| COINS_FOR_CHARON | talent decay x1=25 x2=75 times multikill tiers | | star talent | `getTalentBonus(character.flatStarTalents,'COINS_FOR_CHARON') * getMaxDamage(...).multiKillTiers` [C17, H] |
| AMERICAN_TIPPER | decay x1=80 x2=100 times cooking level / 10 | | star talent | `character.skillsInfo.cooking.level` [C17, H] |
| Golden Bread | `amount * goldenFoodMulti * 0.05 * lavaLog(1+qty) * (1 + lavaLog(1+qty)/2.14)`; item Effect MonsterCash; equipped food slot or Sneaking beanstalk | | W1 food | `getGoldenFoodBonus('Golden_Bread',…)` in `misc.ts#L1046` [C24, H] |
| Vault Mining Payday (17) | bonus x `lavaLog(accountOptions[340])` (ores mined) | max 100 | vault | [C23, M] |
| Achievements | 5 x ach235 + 10 x ach350 + 20 x ach376 | one-off | Astro Colosseum score 10M / reach W6 / 25 Summoning wins | `getAchievementStatus(account.achievements, 235\|350\|376)` [C22, H] |
| Vault Monster Tax (2) | flat bonus | max 500 | | [C23, M] |
| Vault Bored to Death (14) | bonus x `vaultKills[4]` (kill-counter index 4; "POW 10 bean-type kills" is description-derived, confidence L) | max 10 | | [C23, M] |
| Vault Dirty Money (31) | bonus x `vaultKills[7]` (kill-counter index 7; "poop kills" is description-derived, confidence L) | max 25 | | [C23, M] |
| Ninja extra cash | `accountOptions[420]` | | W6 Sneaking | [C26, H] |
| Vault Collection Cashout (70) | bonus x number of cards collected | max 20 | account level 4750 | [C23, M] |

### Base drop and other coin mechanics

- **Base coins per monster:** `D/shared-data.json monsterCoinQuantity[monsterRawName]` (367 entries). Examples: `mushG` 5, `frogG` 35, `poopSmall` 480, `ratB` 550 (W1); `jarSand` 310 ... `snailZ` 670 (W2); `sheep` 730 ... `eye` 1075 (W3); `mushP` 1100, `w4a2` 1260, `w4b1` 2100, `w4c3` 4500, `w4c4` 5000 (W4); `w5a1` 6000 (W5). Bosses: `Boss2A` 4000, `Boss3A` 4000, `Boss4A/B/C` 1e6/5e6/2e7. Toolbox reads this table for bone/medallion/tachyon types and in `grimoire.ts#L119`; it never multiplies it by the cash multi, so the "per-kill coins = base x cash multi" product is the in-game rule, not computed in Toolbox (confidence M). [C27, H]
- **Wallet:** `rawMoney = MoneyBANK + sum(Money_i)`, `bankMoney = MoneyBANK`; `getCoinsArray` splits into denominations; `index.ts#L320-327`. Other currencies from `getCurrencies` (`misc.ts#L516`): candies, WorldTeleports, KeysAll, ColosseumTickets, ObolFragments, SilverPens, GoldPens, delivery box counters, minigame plays. [C29, M]
- **Coin sinks:** Bribes (sets 1-4 cost 35,750 / 696,222 / 37,831,348 / 24,899,999,999 coins; set 4 includes the 99,999,999 "Art of the Bail"); Stamps (gold cost `getGoldCost`, `world-1/stamps.ts#L88`, checked against `rawMoney`); Anvil points (`world-1/anvil.ts`, `anvilUpgradeCost`); Pay 2 Win; Upgrade Vault; shops; Divinity/Bell/Button check `rawMoney` as an affordability gate. [C30, M]
- **W5+ extensions (one line each):** Molti card (W5) +7/level; Maneki Kat artifact (W5 Sailing); Gambit (W5 caverns); Divinity Harriep (W5); Sushi Station and Research Glimbo grid (W7); Crop Depot cash (W6 Farming); Wind Walker DUSTWALKER and Sneaking charm/ninja term (W6); Pocket Divinity, King Doot or `accountOptions[425]` make Harriep (and Goharut) apply to every character (`divinity.ts#L368-L382`); Bribe sets beyond 4 exist (41 bribes in total); the "set 5: 8e12 .. 2e16" figure is not backed by a verifier and is confidence L; set grouping of 6/7/7/7 is inferred, there is no set field in data. [C14, H][C17, H][C26, H][C30, M]

### Missed mechanics added after verification

- **Pecunia coins-on-ground:** wiki states the Pecunia statue has a separate coins-dropped-on-ground term `1 + 0.6*level/(100+level)`, distinct from the Monster Cash term `75*level/(100+level)%`. Source: idleon.wiki Pecunia statue / Coins page, tier 3, 2026-10-19; the ground-coin term is not in the cash multi formula (confidence M).
- **Wiki-listed sources only referenced as getters:** Gumball Necklace charm, Bonus Ballot (wiki +52%), Crop Scientist depot cash, Gambit are all in the code bracket (`character.ts#L2818-L2825`); their unlock chains (Sneaking pristine charm, ballot selection, crop depot, Gambit caverns) are not traced here (confidence M, tier 1 for presence, 3 for numbers).
- **Sushi 18/37:** `world-7/sushiStation.ts` computes `uniqueSushi` from the tracking array (`raw[5]`, entries >= 0, lines ~73-96); a bonus is active only when `uniqueSushi > index`; wiki gives 1.2x/1.4x for the two sushi (confidence M).
- **Harriep minor bonus:** `getMinorDivinityBonus(character, account, slot, characters, loggedInCharacter)` is summed over characters by `getAccountMinorDivinityBonus` (`divinity.ts#L368-L382`); Goharut shares the all-characters rule (`character.ts#L3269`). Harriep is godIndex 3 (confidence H); exact minor-bonus scaling not re-derived (L).
- **Premium gear:** stat 77/100 sources (premium hats, Corsair Uniform "300% Extra Money", Marbiglass etc.) are not enumerated here; wiki-only, confidence L.
- **Cash-linked coin sinks (data `shared-data.json` bribes, ~L1938-1990):** Insider Trading (price 750; code value 8, so stamp coin cost x (1 - 8/100), tier 1, confidence H, `bribes[0]` + `world-1/stamps.ts#L237-L243`, see bribes.md C9 and stamps.md C6; the in-game description text says 5% and is stale), Mandatory Fire Sale (3200, shop items 7% less), Artificial Demand (9000, sell +10%), The Art of the Deal (15000, unlocks next set of 7 bribes), Overstock Regulations (20000, shop quantity +20%). Bribe prices are in gems? no: prices here are the data `price` field (coins), tier 1, confidence M. Anvil/stamp/statue cost scaling not detailed (L).
- **Glimbo trades (BOGO):** research grid 169 baseBonus 10 maxLv 2 is the BOGO Offer; coin-vs-cash distinction as above (M).

## Min-max by stage

No community source gives a single ordered cash-multi priority list; the closest is the wiki's coin-farming page (tier 3) plus the formula itself. The ordering below ranks by size of multiplicative step and unlock timing; the ranking is derived by me from the code (tier 1 data, derived order, confidence L-M).

- **W1 early:** Wear any "bonus money" gear; level the PECUNIA statue (wiki: "Focus on the Pecunia Statue"); equip money cards; stamp/bribe coins are the main sink. Buy the Arena/early talents (CHACHING!) as the Journeyman path allows. [C32, L][C11, H][C17, H]
- **W1 mid/late:** Get Golden Bread and keep it equipped; first Penny of Strength (Warrior/Barbarian main stat STR) and Dieter Drink vial once Alchemy opens; Post Office Utilitarian Capsule levels. [C24, H][C15, H][C3, H][C18, H]
- **W2:** Alchemy bubbles (Penny/Dollar/Nickel matching main stat), vials, Kangaroo "Cash", Jawbreaker needs Wakawaka War (W2 Arena) wave 101. The Pet Arena multiplier steps (waves 20 and 175) are W4 Breeding content, not W2/W3 (CORRECTION). [C3, H][C8, H][C13, H]
- **W3:** Gold armour set from the Armor Smithy is a flat x1.5 for one character; Guild Coin Supercharger scales with the world reached (+1 multiplier slot per 50 map indexes); Gambit/Bundle if owned. [C6, H][C19, H]
- **W4 (outline):** Meals (Salad, Bunt Cake) via Cooking; Lab bonus Fungi Finger Pocketer; Upgrade Vault Monster Tax, Bored to Death, Recipe for Profit, Bubble Money; COINS_FOR_CHARON and AMERICAN_TIPPER star talents; Maneki Kat and Harriep arrive in W5. Wiki W4-5 tip: stack meals, pet arena (1.5x-2x), Harriep. [C9, H][C12, H][C23, M][C31, M]
- **Cross-stage (biggest levers by size):** companions (each up to x5, four of them), cash bundle (x3.5), event shop (x1.5, x1.6), Gold set (x1.5), Pet Arena wave 175 (+1, W4 Breeding). Pet terms are the largest per-item steps. [C4, H][C5, H][C6, H][C7, H][C8, H]

## Open questions

See the Return schema `openQuestions`.
