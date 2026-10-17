# Bribes (W1)

Part of the [W1 System Dossiers](../2026-10-17-w1-systems.md). The source pins are listed there.

## Bribes

- **What it is:** 41 one-time, permanent, account-wide upgrades bought with coins from Mr Pigibank's book (the Bribe tab next to Stamps). They come in sets. The last bribe of each set ("The Art of the …") opens the next set. (H: N.js `BribeDescriptions`, bribe purchase handler; Toolbox `parsers/world-1/bribes.ts`, `shared-data.json` `bribes`)
- **Unlocks:**
  - Set 1 opens with Stamps (Mr Pigibank, account highest class Lv 14; see [stamps.md](stamps.md)).
  - Sets 2–4 open by buying the previous set's expansion bribe.
  - Set 5 needs "The Art of the Bail", which is bought from the Garbage Tuna on Trash Island (W2 Islands).
  - Set 6 needs "The Art of the Grail" from the Jade Emporium (W6).
  - "The Art of the Flail" (index 40) cannot be bought ("I ain't got no more bribes").
  - (H for the mechanics: buying an expansion sets the next block of `BribeStatus` from −1 to 0. Unlock places from the game text and the wiki [Stamps#Bribes](https://idleon.wiki/wiki/Stamps#Bribes), rev. 2026-10-05.)
- **Scope:** account-wide. `BribeStatus[i]` is −1 (locked), 0 (available) or 1 (bought). Within an open set you can buy in any order. (H)
- **Inputs → outputs:** coins in; permanent bonuses out. The bonus the game applies is `BribeDescriptions[i][5]` (the "Value used by code" column below), **not** the number in the description:
  - **Insider Trading** says −5% stamp coin cost, but the code uses **8**. (H)
  - **Fossil Fuel Legislation** says oil is used "80% as often", but the code applies `ForgeCooldownBonus = 1 − 0.2/100`, a **0.2%** cut. (H: N.js `FoodBonuses("…ForgeCooldownBonus")`, mirrored by Toolbox `forge.ts`) This looks like a game bug or a units mismatch. Treat its value as near zero.
  - Fake Teleport Tickets / Counterfeit Telepassports change daily World Teleports (N.js daily routine; the UI shows `1 + min(bribe11, 2) + bribe13 + 7·gem72` per day).

| # | Set | Bribe | Effect (game text) | Value used by code | Price (coins) |
|---|---|---|---|---|---|
| 0 | 1 (open with Stamps) | Insider Trading | All stamps cost 5% less coins to upgrade. | 8 (StampCostPct) | 750 |
| 1 | 1 (open with Stamps) | Tracking Chips | Stamps drop +15% more often from monsters and resources that drop stamps. | 15 (StampDrop) | 1.8K |
| 2 | 1 (open with Stamps) | Mandatory Fire Sale | All shop items cost 7% less coins. | 7 (ShopCostPct) | 3.2K |
| 3 | 1 (open with Stamps) | Sleeping on the Job | Boosts fighting AFK Gains Rate by +5% | 5 (FightAfkRate) | 6K |
| 4 | 1 (open with Stamps) | Artificial Demand | Items sell to shops for +10% more than their normal value. | 10 (ShopSellPct) | 9K |
| 5 | 1 (open with Stamps) | The Art of the Deal | Unlocks the next set of 7 Bribes to be purchased. | 6 (BribeExpansion) | 15K |
| 6 | 2 | Overstock Regulations | Item Quantity in all shops increased by +20%. Takes effect only after Shops restock. | 20 (ShopQtyPct) | 20K |
| 7 | 2 | Double Exp Scheme | Whenever you claim AFK rewards, there is a 2.2% chance to get x2 EXP. | 2.2 (AfkDoubleEXP) | 222K |
| 8 | 2 | Tagged Indicators | Stamps drop +20% more often. Stacks with previous bribe of this type. | 20 (StampDrop) | 30K |
| 9 | 2 | Fossil Fuel Legislation | Oil Barrel consumption chance is reduced to 80% of the original chance. | 0.2 (OilConsume) | 55K |
| 10 | 2 | Five Aces in the Deck | Card drop rate boosted by 1.20x for all areas of the game. | 20 (CardDropPct) | 70K |
| 11 | 2 | Fake Teleport Tickets | Get +2 Map Teleport every 24 hours. Caps at 6, so being gone for 4 days only gives 6 tele. | 3 (FreeTeleport) | 99K |
| 12 | 2 | The Art of the Steal | Unlocks the next set of 7 Bribes to be purchased. | 13 (BribeExpansion) | 200K |
| 13 | 3 | Counterfeit Telepassports | You now get +4 Map Teleports every 24 hours, and caps at 12 before you need to login. | 2 (FreeTeleport2) | 300K |
| 14 | 3 | Weighted Marbles | +10% arcade balls recharge rate. You'll be drowning in balls in no time! | 10 (ArcadeBallz) | 725K |
| 15 | 3 | Changing the Code | Unlock the 2nd Alchemy Bubble slot for ALL players. Don't go tellin' Lava 'bout this one... | 1 (BubbleSlot) | 1.5M |
| 16 | 3 | Taxidermied Cog Pouches | +4 Cog Inventory slots. | 4 (CogInve) | 750K |
| 17 | 3 | Guild VIP Fraud | Logging in each day now contributes 20 GP to your guild, instead of the normal 10. | 10 (BonusType) | 400K |
| 18 | 3 | Library Double Agent | +4 minimum Lv for all Talent Books from the library, so you get more of the goood stuff. | 4 (BonusType) | 9.16M |
| 19 | 3 | The Art of the Fail | Unlocks the next set of 7 Bribes to be purchased. | 20 (BribeExpansion) | 25M |
| 20 | 4 | Photoshopped Dmg Range | Boosts Total Damage by +2%. | 2 (TotalDmg) | 100M |
| 21 | 4 | Glitched Acc Formula | Boosts Total Accuracy by +2% | 2 (TotalAcc) | 300M |
| 22 | 4 | Firewalled Defence | Boosts Total Defence by +2% | 2 (TotalDef) | 700M |
| 23 | 4 | Bottomless Bags | Boosts Carry Capacity by +5% | 5 (CarryCap) | 1.2B |
| 24 | 4 | AFKeylogging | Boosts Skill AFK Gains Rate by +2%. | 2 (SkillAFK) | 20B |
| 25 | 4 | Guild GP Hack | Logging in each day now contributes 30 GP to your guild, instead of 20. | 10 (Guild2) | 2.5B |
| 26 | 5 (needs Garbage Tuna, W2 Trash Island) | The Art of the Bail | Unlock the next Bribe Set from the Garbage Tuna on Trash Island in World 2 to buy. | 27 (BribeExpansion) | 100M |
| 27 | 5 (needs Garbage Tuna, W2 Trash Island) | Random Garbage | All random event bosses now drop Garbage Piles to give to the Garbage Tuna. | 1 (RandoGarbo) | 8T |
| 28 | 5 (needs Garbage Tuna, W2 Trash Island) | Godlier Creation | The Godly Creation talent now gives up to +12 Stat bonus, instead of up to +4 | 1 (GodlyCreation) | 12.1T |
| 29 | 5 (needs Garbage Tuna, W2 Trash Island) | Fishermaster | +25% Fishing EXP, and +15% Fishing Efficiency, now and forever. | 1 (FishingStats) | 252B |
| 30 | 5 (needs Garbage Tuna, W2 Trash Island) | Muscles on Muscles | Boosts Total Damage by +2% | 2 (TotalDmgB) | 2.00e16 |
| 31 | 5 (needs Garbage Tuna, W2 Trash Island) | Bottle Service | Bottles, used to buy maps to new islands, wash up at the docks +10% more often. | 10 (BottleMore) | 40T |
| 32 | 5 (needs Garbage Tuna, W2 Trash Island) | Star Scraper | Get +33 Star Talent points, right now, for all characters, no questions asked. | 33 (StarTalz) | 3.30e15 |
| 33 | 6 (needs Jade Emporium, W6) | The Art of the Grail | You must unlock the next Bribe set from the Jade Emporium in World 6 to buy this. | 34 (BribeExpansion) | 100M |
| 34 | 6 (needs Jade Emporium, W6) | Artifact Pilfering | Boosts Artifact find chance by a pleasantly large +20% | 20 (New1) | 3.00e17 |
| 35 | 6 (needs Jade Emporium, W6) | Forge Cap Smuggling | Boosts Forge Capacity by a smoking hot 1.30x | 30 (New2) | 4.40e18 |
| 36 | 6 (needs Jade Emporium, W6) | Gold from Lead | Boosts all Golden Food bonuses by +10% | 10 (New3) | 7.10e19 |
| 37 | 6 (needs Jade Emporium, W6) | Nugget Fabrication | Boosts the rate at which the Shovel generates Nuggets in Gaming by +20% | 20 (New4) | 3.50e20 |
| 38 | 6 (needs Jade Emporium, W6) | Divine PTS Miscounting | Boosts Divinity PTS gain rate by +30% | 30 (New5) | 5.00e21 |
| 39 | 6 (needs Jade Emporium, W6) | Loot Table Tampering | All items from Random Event Bosses are 1.20x more likely to drop than before. | 20 (New6) | 1.00e23 |
| 40 | 6 (needs Jade Emporium, W6) | The Art of the Flail | Look buddy, I ain't got no more bribes, maybe an associate of mine will sort it out later... | 41 (BribeExpansion) | 100M |

  Set totals: set 1 ≈ **35.8K**, set 2 ≈ **696K**, set 3 ≈ **37.8M**, set 4 ≈ **24.8B**, set 5 ≈ 2.34e16, set 6 ≈ 1.05e23 coins. Prices are raw coin values (copper units).

- **Goals and Milestones:**

| Milestone | Typical stage | Why it matters |
|---|---|---|
| Set 1 done (6 bribes, ~36K) | First W1 coins | Insider Trading (stamps −8% coins), +5% fight AFK, shop −7% |
| Set 2 done (~0.7M) | Late W1 / W2 | Double EXP chance on AFK claims, card drop ×1.2 (Five Aces), +teleports |
| **Changing the Code** (set 3, 1.5M) | W2 | **2nd active Alchemy bubble slot for every character.** The single highest-leverage bribe. |
| Set 3 done (~37.8M) | W2–W3 | Arcade balls +10%, cog slots +4, Talent Library min level +4 |
| Set 4 done (~24.8B) | W3–W4 | +2% total damage, accuracy and defence, +5% carry, +2% skill AFK |
| Sets 5–6 | W5+ | Endgame (Star Scraper +33 star talent points, Forge Cap ×1.3) |

AutoReview's bribe tiers are the same sets, labelled W1, W2, W3, W4, Trash Island and W6 (L: `bribes_progressionTiers`).

- **Feeds / fed by:** fed by coins (fighting income, shop sales; Artificial Demand +10% sell value). Feeds [Stamps](stamps.md) (coin cost, drop rate), shops (cost, stock), fighting and skill AFK rate, cards (Five Aces), teleports, Alchemy (bubble slot), Construction (cog inventory), Talent Book Library, guild GP, Arcade (W2), the Forge (cap, set 6), Sailing and Gaming (W5, set 6), and Divinity.
- **Per-session actions:** if an available bribe costs less than about 10–25% of current coins, buy it (it is permanent and cheap). Never leave an expansion bribe unbought once it is affordable. Toolbox has no bribe alert, so ActiveOn needs its own trigger: `bribes.some(b => statusRaw == 0 && price <= rawMoney)`.
- **AFK Setup implications:** none directly. "Sleeping on the Job" and "AFKeylogging" raise AFK gains for everyone.
- **Min-max by stage:**
  - **Early W1:** buy Insider Trading before any big stamp spend, then the rest of set 1.
  - **W2:** set 2. Then save for Changing the Code (1.5M) ahead of most other coin sinks once Alchemy is open.
  - **W3:** finish set 3.
  - **W4:** set 4 in price order. Photoshopped Dmg Range (100M) and Glitched Acc Formula (300M) come before the 20B AFKeylogging.
  - **Per class:** no differences, since bribes are account-wide.
- **Common mistakes:**
  - **An affordable bribe left unbought,** above all Changing the Code. Detect `BribeStatus[15] == 0` with `rawMoney ≥ 1.5M`.
  - **Planning around the text values** (5% stamps, 80% oil) instead of the code values.
  - Both fixtures had sets 1–3 complete (20 bribes); the W3 account also had 2 of set 4. This is a healthy example of what "done for the stage" looks like.
- **Save and Toolbox fields:**
  - Raw save `BribeStatus` (array of −1/0/1).
  - Parsed `account.bribes[]`: `{name, desc, npc, price, effectName, value, done}`. `done` is `status === 1`; Toolbox drops the 0-vs-−1 distinction, so ActiveOn needs the raw array (or the set logic) to tell "available" from "locked".
  - Helper `getBribeBonus(bribes, name)`.
- **Sources:** N.js v1.23 (2026-10-17): `BribeDescriptions`, `_customBlock_GetBribeBonus`, the bribe purchase handler (BribeExpansion unlock loop), `FoodBonuses` ForgeCooldownBonus, the daily teleport routine. Toolbox @ 6827d3f: [`parsers/world-1/bribes.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-1/bribes.ts), `data/website-data/shared-data.json` `bribes`, [`parsers/world-1/forge.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-1/forge.ts) (`OIL_BRIBE`). Wiki [Stamps#Bribes](https://idleon.wiki/wiki/Stamps#Bribes) (rev. 2026-10-05). AutoReview @ 05ac449 `bribes_progressionTiers` (comment: "The Art of the Flail" "Cannot be purchased as of 2.36").
