# Bribes - M26 dossier

Verified 2026-10-19. Game version 2.3.540, Toolbox pin 6c37e3d (`P` = `packages/toolbox-parsers/vendor/parsers/`, `D` = `packages/toolbox-parsers/vendor/data/website-data/shared-data.json`). Prior research: `origin/research/w1-systems:docs/research/systems/w1-systems/bribes.md` (N.js v1.23, 2026-10-17; "prior"). Corrections to prior are marked CORRECTION.

## Bribes

- **What it is:** 41 one-time, permanent, account-wide upgrades bought with coins from Mr Pigibank's book and (sets 5-6) other NPCs. They come in sets; the last bribe of a set ("The Art of the ...") opens the next set. [C1][C2]
- **Unlocks:** Opens together with Stamps at Mr Pigibank (account highest class Lv 14 in ActiveOn's `SINKS_OPEN_AT_LEVEL`). Set 1 is available from the start; sets 2-4 open by buying the previous set's expansion bribe; set 5 needs "The Art of the Bail" bought from the Garbage Tuna on Trash Island (W2); set 6 needs "The Art of the Grail" from the Jade Emporium (W6); "The Art of the Flail" is not purchasable. [C3][C4][C5][C6]
- **Scope:** Account-wide. Raw `BribeStatus[i]`: -1 locked, 0 available, 1 bought. Within an open set any order works. [C7][C8]
- **Inputs -> outputs:** Coins in, permanent bonus out. The number the game applies is `value` in the data, which can differ from the description text (Insider Trading text 5%, code 8; Fossil Fuel text "80%", code 0.2). [C9][C10][C11]
- **Goals and Milestones:** see tables below (set totals, per-bribe costs).
- **Feeds / fed by:** fed by coins. Feeds Stamps, shops, fight AFK, skill AFK, cards, teleports, Alchemy bubble slots, Construction cog inventory, Talent Library, Guild GP, Arcade, damage/accuracy/defence, carry capacity, Forge, Fishing, Star talent points, Sailing artifacts, Gaming, Divinity, Islands.
- **Per-session actions:** buy any affordable available bribe in sets 1-4 (permanent; the cost is tiny vs. income by the time it is affordable). Never leave an expansion bribe unbought. Trigger: `status == 0 && price <= coins`. ActiveOn does this in the Spend Plan (`bribeCandidates`). Idle state = every available book bribe is bought.
- **AFK Setup implications:** none directly. Fight/skill AFK bribes raise AFK gains for all characters.
- **Min-max by stage:** see section below.
- **Common mistakes:** leaving Changing the Code (1.5M) unbought once Alchemy is open; planning around description text instead of code values; expecting Fossil Fuel Legislation to matter (0.2% in code); assuming Toolbox distinguishes locked from available (it does not, `done` only). [C11][C12]
- **Save and Toolbox fields:** see Mechanics catalogue.
- **Sources:** inline per claim.

## Mechanics catalogue

Vendor split (the `npc` field in data): pigbank (Mr Pigibank's book), shops (shop NPCs: Fire Sale, Artificial Demand, Overstock), afk (AFK-themed NPC: Double Exp Scheme, Five Aces, Guild VIP Fraud, AFKeylogging, Guild GP Hack), smithing (Fossil Fuel, Godlier Creation, Forge Cap Smuggling), world3 (Weighted Marbles, Cog Pouches, Library Double Agent), fish (Bail, Random Garbage, Fishermaster, Bottle Service), world5 (Artifact Pilfering, Nugget Fabrication, Divine PTS Miscounting). So bribes are not all bought at Mr Pigibank. Source: `D` `bribes[*].npc`; tier 1; confidence H on the field, L on the in-game location names.

Set structure (index = position in `D.bribes` = index in raw `BribeStatus`; price = raw coin units). Currency tiers per wiki: 100 copper = 1 silver, 100 silver = 1 gold, 100 gold = 1 platinum, then Dementia/Void/Lustre... coins; the wiki lists the same totals as the data. [C13]

| # | Set | Bribe | Effect key | Code value | Price (coins) | Where bought |
|---|---|---|---|---|---|---|
| 0 | 1 | Insider Trading | StampCostPct | 8 | 750 | pigbank |
| 1 | 1 | Tracking Chips | StampDrop | 15 | 1,800 | pigbank |
| 2 | 1 | Mandatory Fire Sale | ShopCostPct | 7 | 3,200 | shops |
| 3 | 1 | Sleeping on the Job | FightAfkRate | 5 | 6,000 | pigbank |
| 4 | 1 | Artificial Demand | ShopSellPct | 10 | 9,000 | shops |
| 5 | 1 | The Art of the Deal | BribeExpansion | 6 | 15,000 | pigbank |
| 6 | 2 | Overstock Regulations | ShopQtyPct | 20 | 20,000 | shops |
| 7 | 2 | Double Exp Scheme | AfkDoubleEXP | 2.2 | 222,222 | afk |
| 8 | 2 | Tagged Indicators | StampDrop | 20 | 30,000 | pigbank |
| 9 | 2 | Fossil Fuel Legislation | OilConsume | 0.2 | 55,000 | smithing |
| 10 | 2 | Five Aces in the Deck | CardDropPct | 20 | 70,000 | afk |
| 11 | 2 | Fake Teleport Tickets | FreeTeleport | 3 | 99,000 | pigbank |
| 12 | 2 | The Art of the Steal | BribeExpansion | 13 | 200,000 | pigbank |
| 13 | 3 | Counterfeit Telepassports | FreeTeleport2 | 2 | 300,000 | pigbank |
| 14 | 3 | Weighted Marbles | ArcadeBallz | 10 | 725,000 | world3 |
| 15 | 3 | Changing the Code | BubbleSlot | 1 | 1,500,000 | pigbank |
| 16 | 3 | Taxidermied Cog Pouches | CogInve | 4 | 750,000 | world3 |
| 17 | 3 | Guild VIP Fraud | BonusType | 10 | 400,000 | afk |
| 18 | 3 | Library Double Agent | BonusType | 4 | 9,156,348 | world3 |
| 19 | 3 | The Art of the Fail | BribeExpansion | 20 | 25,000,000 | pigbank |
| 20 | 4 | Photoshopped Dmg Range | TotalDmg | 2 | 100,000,000 | pigbank |
| 21 | 4 | Glitched Acc Formula | TotalAcc | 2 | 300,000,000 | pigbank |
| 22 | 4 | Firewalled Defence | TotalDef | 2 | 700,000,000 | pigbank |
| 23 | 4 | Bottomless Bags | CarryCap | 5 | 1,200,000,000 | pigbank |
| 24 | 4 | AFKeylogging | SkillAFK | 2 | 20,000,000,000 | afk |
| 25 | 4 | Guild GP Hack | Guild2 | 10 | 2,500,000,000 | afk |
| 26 | 4 (closes; table label elsewhere says 5) | The Art of the Bail | BribeExpansion | 27 | 99,999,999 | fish |
| 27 | 5 | Random Garbage | RandoGarbo | 1 | 8e12 | fish |
| 28 | 5 | Godlier Creation | GodlyCreation | 1 | 12,121,212,121,212 | smithing |
| 29 | 5 | Fishermaster | FishingStats | 1 | 251,500,000,000 | fish |
| 30 | 5 | Muscles on Muscles | TotalDmgB | 2 | 2e16 | pigbank |
| 31 | 5 | Bottle Service | BottleMore | 10 | 4e13 | fish |
| 32 | 5 | Star Scraper | StarTalz | 33 | 3.3e15 | pigbank |
| 33 | 5 (closes; labelled 6 here) | The Art of the Grail | BribeExpansion | 34 | 99,999,999 | pigbank |
| 34 | 6 | Artifact Pilfering | New1 | 20 | 3e17 | world5 |
| 35 | 6 | Forge Cap Smuggling | New2 | 30 | 4.4e18 | smithing |
| 36 | 6 | Gold from Lead | New3 | 10 | 7.1e19 | pigbank |
| 37 | 6 | Nugget Fabrication | New4 | 20 | 3.5e20 | world5 |
| 38 | 6 | Divine PTS Miscounting | New5 | 30 | 5e21 | world5 |
| 39 | 6 | Loot Table Tampering | New6 | 20 | 1e23 | pigbank |
| 40 | 6 (closes; labelled 6) | The Art of the Flail | BribeExpansion | 41 | 99,999,999 | pigbank (not purchasable) |

Set labels follow ActiveOn's rule (set ends at each `The_Art_of_the_` bribe): idx 0-5 set 1, 6-12 set 2, 13-19 set 3, 20-26 set 4, 27-33 set 5, 34-40 set 6; the rows above for 26/33/40 are annotated accordingly, other rows in sets 5/6 use the older labelling (27-32 = set 5, 34-39 = set 6 are the content bribes). Source for the whole table: [C13]. Prices above 2^53 (~9e15, i.e. idx 30, 34-39 and some others) exceed double precision: the UI must use a tiered/abbreviated display, not exact integers. Confidence H. Expansion `value` (6, 13, 20, 27, 34, 41) is the index at which the next set starts; the game sets the next block of `BribeStatus` from -1 to 0 on purchase (prior, N.js; not re-verifiable in the vendored tree, nothing in Toolbox writes `BribeStatus`; confidence L-M, consistent with expansion values). [C5]
CORRECTION to prior: the data price for indices 26, 33, 40 is 99,999,999 (matches the wiki's "99P 99G 99S 99C"), not 100M; index 29 is 251.5B (prior rounded to 252B); index 28 is 12.12T. [C14]

Set totals (sum of prices): set 1 = 35,750 (about 35.8K); set 2 = 696,222 (about 0.70M, includes 222,222 for Double Exp Scheme); set 3 = 37,831,348 (about 37.8M); set 4 = 24,800,000,000 (24.80B) excluding The Art of the Bail (idx 20-25) or 24,899,999,999 (24.90B) including it (idx 20-26). Convention: sets 1-3 above include their closing expansion bribe, so by that rule Bail (idx 26) closes set 4 and the consistent set 4 total is 24.90B; set 5 (idx 27-33 by the same rule would include Grail) is stated by index: idx 27-32 = 23,360,372,712,121,212 (about 2.34e16); with Bail added (idx 26-32) = 23,360,372,812,121,211; set 6 idx 33-39 about 1.05e23 (dominated by Loot Table Tampering 1e23). Computed from the table. Set 1 has 6 bribes (idx 0-5); sets 2-6 have 7. [C15] Confidence H (arithmetic).

### Mechanics (formula, caps, unlock, field)

1. **Expansion chain** - buying an expansion bribe (5, 12, 19, 26, 33) unlocks the next set; 40 is a terminal stub. Set size is 7 for sets 2 and 3 per descriptions; sets as ActiveOn counts them end at each "The_Art_of_the_" name. Field: `account.bribes[i].done`, raw `BribeStatus[i]`. [C3][C5][C16]
2. **Insider Trading (0)** - stamp coin cost = `baseCoinCost * (1 - 8/100)` when `bribes[0].done` (the 8, not the displayed 5). `P world-1/stamps.ts:237-243`. [C9]
3. **Tracking Chips (1) / Tagged Indicators (8)** - stamp drop rate +15% and +20% additive-stacking ("stacks with previous"). Not computed by Toolbox. Game text only; confidence M. [C13][C17]
4. **Mandatory Fire Sale (2) / Artificial Demand (4) / Overstock Regulations (6)** - shop buy cost -7%, sell value +10%, shop quantity +20% (after restock). Not in Toolbox. [C13]
5. **Sleeping on the Job (3)** - +5 to the fighting AFK gain rate sum for each character. `P character.ts:3372` (`bribes?.[3]?.done ? value : 0`) feeding `character.ts:3385`. [C18]
6. **AFKeylogging (24)** - +2 added to the skill AFK gain rate for every skill type. `P character.ts:3338` and uses at 3415-3589. [C19]
7. **Double Exp Scheme (7)** - 2.2% chance for x2 EXP on each AFK claim. Not in Toolbox. [C13]
8. **Fossil Fuel Legislation (9)** - forge oil barrel use per cycle = `1 - value/100` = 0.998 (a 0.2% cut), not the 80% the text says. `P world-1/forge.ts:43,105-106`. Treat as near-zero. [C10]
9. **Five Aces in the Deck (10)** - card drop rate x1.20 everywhere. Not in Toolbox. [C13]
10. **Fake Teleport Tickets (11) / Counterfeit Telepassports (13)** - daily World Teleports: text +2 per 24 h capped at 6, then +4 per 24 h capped at 12. Prior records the UI formula as `1 + min(bribe11, 2) + bribe13 + 7*gem72` per day (from N.js, not in Toolbox). **Disputed / unverifiable:** no vendored parser reads `FreeTeleport`; data text (+2 cap 6; +4 cap 12) and the N.js formula are not reconciled. Confidence L. [C13][C20]
11. **Weighted Marbles (14)** - arcade ball seconds per ball = `4000 / (1 + (ballBonus + 10)/100)`. `P dungeons.ts:85`. [C21]
12. **Changing the Code (15)** - second Alchemy bubble slot for all characters; ActiveOn big-bubble slots = `1 + (Changing_the_Code done ? 1 : 0) + (Breeding arena max wave >= threshold ? 1 : 0)`. `account-state/src/unspent.ts:414-421`. Highest-leverage bribe. [C22]
13. **Taxidermied Cog Pouches (16)** - +4 cog inventory slots. Not in Toolbox. [C13]
14. **Guild VIP Fraud (17) / Guild GP Hack (25)** - daily login GP 10 -> 20 -> 30 for the guild. Not in Toolbox. [C13]
15. **Library Double Agent (18)** - Talent Library minimum book level = `round(101 + 5*gemShop[113] + 4 + atom7Level)`. `P misc.ts:316-323`. [C23]
16. **Photoshopped Dmg Range (20) / Muscles on Muscles (30)** - total damage +2 each, both additive in the damage formula. `P damage.ts:835-872`. [C24]
17. **Glitched Acc Formula (21)** - total accuracy +2. `P damage.ts:1018-1038`. [C24]
18. **Firewalled Defence (22)** - total defence multiplier `(1 + (shrine + 2)/100)`. `P damage.ts:1389-1426`. [C24]
19. **Bottomless Bags (23)** - carry capacity factor `(1 + (prayer + 5 + ram)/100)`. `P misc.ts:1161-1170`. [C25]
20. **Trash Island purchase flow** - Toolbox `islands.ts:185-187` lists "Unlock New Bribe Set" as a Trash Island upgrade whose `acquired` = `getBribeBonus(bribes, 'The_Art_of_the_Bail')`, i.e. buying the Bail bribe (via the Garbage Tuna, `npc: fish`) is the Trash Island upgrade. Random Garbage (27) is tied to garbage piles from the garbage-pile loop; Toolbox only reads garbage via `accountOptions[161]` for the Filthy Damage talent (`damage.ts:742-743`), not via the bribe. Confidence H on the Bail link, L on the pile loop details. [C26]
21. **The Art of the Bail set (26-32)** - 27 Random Garbage: event bosses drop Garbage Piles for the Garbage Tuna (no field); 28 Godlier Creation: Godly Creation talent cap +4 -> +12 (no Toolbox use); 29 Fishermaster: +25% fishing EXP (`25 * value`, `P character.ts:755-808`) and +15 fishing efficiency strengthen term (`P efficiency.ts:454`); 31 Bottle Service: bottles per day `floor(4 * (1 + (value + 10*base + 10*omar + bundle)/100))`, `P world-2/islands.ts:115-125`; 32 Star Scraper: +33 star talent points per character, `P talents.ts:592-610`. [C26]
22. **W6 set (34-39)** - Artifact Pilfering +20 artifact find chance (`P world-5/sailing.ts:701-714`); Forge Cap Smuggling x1.30 ore capacity inside `(1 + (bribe + vault)/100)` (`P world-1/forge.ts:171-199`); Gold from Lead +10% golden food (`P misc.ts:937-1022`); Nugget Fabrication +20% Gaming shovel nuggets, Divine PTS Miscounting +30% Divinity points, Loot Table Tampering x1.20 event boss drops (no Toolbox use). [C27]
23. **Toolbox lookup** - `getBribes` returns `bribes[]` = data rows + `done = (BribeStatus[i] === 1)`; `getBribeBonus(bribes, name)` returns `value` if done else 0. Locked (-1) and available (0) are not distinguished. `P world-1/bribes.ts:15-32`. [C7]

W5+ extensions (one line each): sets 5 and 6 above are the W5/W6-era sets (Trash Island in W2 gates set 5; Jade Emporium in W6 gates set 6); the Flail stub (index 40) hints at future sets (prior notes AutoReview marks it "Cannot be purchased as of 2.36"). [C6]

## Min-max by stage

Community meta for bribes is thin: no priority guide was found. The orders below are derived from price order and bonus value in code, not published advice. Confidence is M unless stated.

- **W1 early:** buy Insider Trading (750) before any big stamp spend, then Tracking Chips, Fire Sale, Sleeping on the Job, Artificial Demand, The Art of the Deal in price order. Total about 35.8K. [C28][C15]
- **W1 mid/late:** set 1 is done at about 36K; start set 2 in price order: Overstock (20K), Tagged Indicators (30K), Fossil Fuel (55K, near-useless value), Five Aces (70K), Fake Teleport (99K), The Art of the Steal (200K); buy Double Exp Scheme (222K) when spare. [C28][C10]
- **W2:** finish set 2 (about 0.70M), then save for Changing the Code (1.5M) ahead of other coin sinks once Alchemy is open; cheaper set 3 items (Counterfeit Telepassports 300K, Guild VIP Fraud 400K, Cog Pouches 750K, Weighted Marbles 725K) fit before it only if they do not delay it. [C22][C28]
- **W3:** finish set 3 (about 37.8M): Library Double Agent (9.16M) and The Art of the Fail (25M) last. [C28]
- **W4:** set 4 in price order: Photoshopped Dmg (100M), Glitched Acc (300M), Firewalled Def (700M), Bottomless Bags (1.2B), Guild GP Hack (2.5B), AFKeylogging (20B). The 20B skill AFK +2 is the last. [C28]
- **Later (W5+):** Bail (99,999,999) from the Garbage Tuna opens set 5; Fishermaster (251.5B) before the trillion-coin items if fishing; Star Scraper (3.3e15) is a one-time +33 star talent points; set 6 needs the W6 Jade Emporium unlock. [C26][C27]
- **Per class:** none; bribes are account-wide. Fishermaster matters only if you fish. [C7]
- Buying priority "stamps early / teleports mid / friction first" is NOT in the wiki (idleon.wiki/wiki/Bribes, edited 2026-10-05, has no priority advice); treat the ordering above as derived, confidence L-M. [C29]

## Claims

All verified 2026-10-19 unless noted. Tier 1 = game data/Toolbox code, 3 = wiki, 4 = community.

- [C1] 41 bribe entries exist in Toolbox's game data. Source: `D` `bribes` (indices 0-40); Toolbox @6c37e3d; tier 1; game 2.3.540.
- [C2] Each set's last bribe is a "The_Art_of_the_X" with effect `BribeExpansion`. Source: `D` `bribes[5,12,19,26,33,40]`; tier 1.
- [C3] Sets 2, 3, 4 open via The Art of the Deal / Steal / Fail (descriptions "Unlocks the next set of 7 Bribes"). Source: `D` `bribes[5,12,19]`; tier 1.
- [C4] (confidence M; wiki says bribes unlock alongside stamps, `npc=pigbank` in data for the main book) Mr Pigibank opens with Stamps; bribes sit at Mr Pigibank. Source: https://idleon.wiki/wiki/Bribes (page updated 2026-10-05) and `packages/knowledge/systems/systems.facts.yaml:59-65`; tier 3.
- [C5] Buying an expansion sets the next block of `BribeStatus` from -1 to 0 (BribeExpansion unlock loop). Source: prior research citing N.js v1.23 (2026-10-17); not in vendored tree, unverifiable; confidence L-M.
- [C6] Set 5 needs The Art of the Bail from the Garbage Tuna on Trash Island (W2); set 6 needs The Art of the Grail from the Jade Emporium (W6); The Art of the Flail has no further bribes. Source: `D` `bribes[26,33,40]` descriptions; https://idleon.wiki/wiki/Bribes (2026-10-05); tier 1/3; prior also cites AutoReview "Cannot be purchased as of 2.36" (tier 4).
- [C7] `BribeStatus` raw array; Toolbox sets `done = status === 1`, `getBribeBonus` returns value only if done. Source: `P world-1/bribes.ts:15-32`; tier 1.
- [C8] Status semantics -1/0/1 (locked/available/bought). Source: `packages/account-state/src/spend-types.ts:101-102` and prior (N.js); tier 2.
- [C9] Insider Trading code value is 8 (text says 5%); stamp coin cost uses `baseCoinCost * (1 - value/100)`. Source: `D` `bribes[0]`, `P world-1/stamps.ts:237-243`; tier 1.
- [C10] Fossil Fuel Legislation value is 0.2 and forge uses `1 - value/100` per cycle, although the text says 80%. Source: `D` `bribes[9]`, `P world-1/forge.ts:105-106`; tier 1. Wiki repeats the text claim (tier 3, https://idleon.wiki/wiki/Bribes); sources disagree, code wins; confidence H that code applies 0.2.
- [C11] The applied value is `value`, not the description number (general rule). Source: `D` `bribes` rows 0 and 9 vs. desc; tier 1.
- [C12] ActiveOn needs raw `BribeStatus` to distinguish locked from available. Source: `packages/account-state/src/spend.ts:196-215`; tier 1 (project code).
- [C13] Names, effect keys, code values, prices and buy NPCs as in the catalogue table. Source: `D` `bribes[0..40]`; tier 1. Wiki table (https://idleon.wiki/wiki/Bribes, 2026-10-05, tier 3) agrees on names, effects and costs when converted from silver/gold/platinum/Dementia notation.
- [C14] Prices for expansions 26, 33, 40 are 99,999,999; Fishermaster 251,500,000,000; Godlier Creation 12,121,212,121,212. Source: `D` `bribes[26,33,40,29,28]`; wiki "99 Platinum, 99 Gold, 99 Silver, 99 Copper"; tier 1/3. Differs from prior's 100M/252B (prior rounded).
- [C15] Set totals 35,750 / 696,222 / 37,831,348 / 24.80B (idx 20-25) or 24.90B incl. Bail. **Corrected** (earlier ~24.82B was wrong; refuted by both lenses). Source: sums of `D` `bribes[0-5]`, `[6-12]`, `[13-19]`, `[20-25]`, `[20-26]`; tier 1 (computed); confidence H.
- [C16] Set boundaries in ActiveOn: a set ends at a name starting `The_Art_of_the_`. Source: `packages/account-state/src/spend.ts:196-215`; tier 1 (project code).
- [C17] Stamp drop bonuses 15 and 20 stack ("Stacks with previous bribe of this type"). Source: `D` `bribes[1,8]` desc; tier 1. Toolbox does not use them.
- [C18] Sleeping on the Job adds `bribes[3].value` (5) to fight AFK rate. Source: `P character.ts:3372-3394`; tier 1.
- [C19] AFKeylogging adds `bribes[24].value` (2) to skill AFK rate for all skills. Source: `P character.ts:3338,3415-3589`; tier 1.
- [C20] (confidence L, unverifiable) Daily teleport formula `1 + min(bribe11,2) + bribe13 + 7*gem72` (from N.js per prior); descriptions say +2/cap 6 and +4/cap 12. Source: prior research (N.js v1.23, 2026-10-17); `D` `bribes[11,13]` desc; tier 1/2; confidence M (data text and formula not reconciled).
- [C21] Weighted Marbles adds its value (10) to the arcade ball recharge rate. Source: `P dungeons.ts:85`; tier 1.
- [C22] Changing the Code grants a 2nd bubble slot; ActiveOn counts `1 + code + arena`. Source: `D` `bribes[15]`, `account-state/src/unspent.ts:414-421`; tier 1.
- [C23] Library min book level includes `+ Library_Double_Agent value` (4). Source: `P misc.ts:316-323`; tier 1.
- [C24] Damage +2 (idx 20 and 30, both added), accuracy +2 (21), defence +2 (22, in shrine multiplier). Source: `P damage.ts:835-872, 1018-1038, 1389-1426`; tier 1.
- [C25] Carry capacity bribe 23 adds to the prayer term. Source: `P misc.ts:1161-1170`; tier 1.
- [C26] Set 5 effects as listed (Fishermaster 25 EXP / 15 eff multiplies value 1; Bottle Service in `floor(4*(1+bonus/100))`; Star Scraper +33 per character). Source: `P character.ts:755-808`, `P efficiency.ts:454`, `P world-2/islands.ts:115-125`, `P talents.ts:592-610`, `D` `bribes[27-32]`; tier 1.
- [C27] Set 6 effects as listed (Artifact Pilfering +20, Forge Cap x1.30, Gold from Lead +10). Source: `P world-5/sailing.ts:701-714`, `P world-1/forge.ts:171-199`, `P misc.ts:937-1022`, `D` `bribes[34-39]`; tier 1.
- [C28] Buy-in-price-order stage plan is derived, not a published guide (the knowledge yaml cites the wiki as tier 2; this dossier treats the wiki as tier 3). Source: `D` prices (tier 1) plus `packages/knowledge/systems/spend.yaml:112-146` (ActiveOn's own Stage items: Insider Trading, Changing the Code reserve, every-bribe), which cite the wiki; confidence M.
- [C29] **Refuted by source lens (the other lens did not test it)** - the wiki page has no buying-priority advice, so the claim is demoted to derived; kept only as a note. Source checked: https://idleon.wiki/wiki/Bribes (edited 2026-10-05); confidence L.

## Open questions

1. No community (tier 4) bribe priority guide was found via search; confirm whether r/idleon or Steam guides give an order (esp. Changing the Code vs. cheaper set 3 items).
2. (L) Reconcile the teleport bribes: data text (+2 cap 6, +4 cap 12) vs. the N.js formula `1 + min(b11,2) + b13 + 7*gem72`; verify against live daily teleport count.
3. Fossil Fuel Legislation: confirm 0.2% is a game bug and whether the next patch fixes it to 20%.
4. Currency tier names for 1e13+ coins (Lustre, Dreadlo, Starfire, Godshard, Sunder, Tydal) used by the wiki; needed for UI price text.
5. Re-verify that `BribeExpansion` purchase sets the next block from -1 to 0 (relies on prior's N.js read).
6. Which bribes are not read by Toolbox (1, 2, 4, 6-8, 10, 11, 13, 16, 17, 25, 27, 28, 37-39): ActiveOn can only show them as owned/not-owned, not quantify them.
7. Unlock level for Mr Pigibank (prior says class Lv 14); the Spend Plan constant `SINKS_OPEN_AT_LEVEL` should be confirmed.
8. Display of prices above 1e15 (tier handling / abbreviation) in the UI; double precision cannot hold exact values of idx 34-39.
9. Shop bribes (Fire Sale, Artificial Demand, Overstock) and the unconsumed effects (Double Exp Scheme, Guild VIP/GP Hack, Cog Pouches, Five Aces, stamp-drop bribes, Godlier Creation, Random Garbage, Nugget, Divine, Loot Table) have no Toolbox parser; ActiveOn can only show owned/not-owned.
10. Sprites: no new sprite needed for bribes beyond existing `systems.ts` glyph; confirm whether per-bribe icons are wanted.
