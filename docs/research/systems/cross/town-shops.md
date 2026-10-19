# Town vendor shops (dossier)

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Paths below are relative to `packages/toolbox-parsers/vendor/` unless stated. Wiki figures are tier 3, fetched 2026-10-19 from https://idleon.wiki/wiki/Vendors (no claim date shown on the page; treat as current-patch but unverified).

## Town vendor shops

- **What it is:** Each town has an NPC shop with a fixed item list and a per-item stock that refills on the daily reset [C1][C22]. It is the only route to several stamps (Target, Shield, Mana, Vitality, Vendor, Matty Bag, Clover; W5+: Egg, Spice, Sigil, Refinery, Forge, Kruker), Talent Point Reset Fragments (W1-W4 towns), the daily Anvil Reset Whetstone, storage chests, inventory bags and upgrade stones [C5][C17][C18]. Buy price is in the single Coins currency up to W4; some W5+ prices use higher currencies and the data has no buy-price field (see M15).
- **Unlocks:** One shop per town, reached by walking there: Blunder Hills (W1), Encroaching Forest Villas (W1), YumYum Grotto (W2), Faraway Piers (W2), Frostbite Towndra (W3) [C6]. The Vendor Stamp lives in YumYum Grotto. The Overstock Regulations bribe needs "The Art of the Deal" bought first (wiki only, confidence L) [C13]. There is no level gate in the data; the gate is reaching the town. NOTE: IdleOn's world numbering of these towns follows the Toolbox shop key order; W4 (Hyperion/Outer World) is shop key 5 [C6].
- **Scope:** Account-wide stock (one `ShopStock` array per account, not per character) [C1]. Coins are account-wide too, so any character may buy.
- **Inputs to outputs:** Coins in; items out. Buy price = 4 x the item's `sellPrice` in `items.json` [C11]. Stock is a daily allowance: an item with stock 1 can be bought once per day [C16][C22].
- **Goals and Milestones:** Below, the stock multiplier levers. Each adds stock only after the next restock [C13]. The per-account restock time means a bribe bought today takes effect at that account's own next reset [C22].

| Lever | Effect | Cost | Source |
|---|---|---|---|
| Overstock Regulations bribe | +20% item quantity in all shops | 20,000 copper (2 gold) | [C13] |
| Sneaky Stealing secret achievement | +25% shop capacity, all town shops | free (walk to a hidden spot) | [C14] |
| Vendor Stamp (YumYum Grotto, 40 gold) | +35 x L/(100+L) % shop quantity, asymptote 35% | 400,000 copper to buy, then stamp upgrades | [C12] |

  How the three combine (additive or multiplicative) is not in Toolbox or the data [C15]; see Open questions.
- **Feeds / fed by:** Feeds Stamps (acquisition route) [C17], Obol Altar quest ingredient purchase [C20], Anvil respec (Whetstone) [C19], Talent Point resets (Reset Fragments) [C18], Storage and Inventory Bags (capacity), Statues (Power Statue item), Trapping (Cardboard Traps), Worship (Wax Skull), Fishing (lines, weights), Smithing (stone upgrades). Fed by Coins, Vendor/Overstock levers, and the daily reset clock `TimeAway.ShopRestock` [C9].
- **Per-session actions:** Before leaving town on a new day: buy every stamp or one-off the account does not own yet; buy the daily Reset Fragments if the account wants Talent Point Reset Potions (10 fragments = 1 potion) [C18]; buy the Anvil Whetstone only when a respec is planned [C19]. A shop item is "idle/capped" when its stock is 0 (sold out) until the next reset.
- **AFK Setup implications:** None. The shops are a town action, not an AFK activity.
- **Min-max by stage:** see the section below.
- **Common mistakes:** Buying a stamp's cheaper sibling out of order is harmless; the real mistakes are (a) not buying Vendor Stamp / Overstock early (note: max stock per item cannot be computed from code, see M16), which lowers every later daily allowance, (b) letting the one-per-day Reset Fragments or Whetstone lapse when the account will need them, (c) treating Toolbox's `shopStock` (whitelisted) as the full stock; it hides most stamps [C2][C24].
- **Save and Toolbox fields:** see Mechanics catalogue.
- **Sources:** inline [Cn].

## Mechanics catalogue

M1. **Shop table (what is sold, where).** `website-data/shared-data.json#shops` (also `@website-data` `shops`): 9 shops keyed 0-8, item counts 26, 14, 21, 13, 23, 17, 9, 13, 13 [C5]. Full W1-W4 lists:

| Key | Town | Items (index: name) |
|---|---|---|
| 0 | Blunder Hills | 0 Nomwich, 1 Hot Dog, 2 Cheezy Pizza, 3 Cue Tape, 4-7 Small Mana/Strength/Life/Speed Potion, 8 Crude Oil, 9-11 Weapon/Armor/Tool Stone I, 12 Pugilist Demise, 13 Power Statue, 14 Sculpting Tools, 15 Target Stamp, 16 Shield Stamp, 17 Mana Stamp, 18 Bummo Bag, 19/20/21 Storage Chest 2/6/7, 22 Basketball, 23 Darts, 24 Bottled Town Teleport, 25 Talent Point Reset Fragment |
| 1 | Encroaching Forest Villas | 0 Hot Dog, 1 Cheezy Pizza, 2 Cranberry Jam, 3 Average Strength Potion, 4 Small EXP Potion, 5 Armor Stone II, 6 Vitality Stamp, 7 Tarantulight, 8 Silver Antique, 9 Capitalist Case, 10/11 Storage Chest 8/12, 12 Bottled Town Teleport, 13 Reset Fragment |
| 2 | YumYum Grotto | 0 Kebab Sticks, 1 Meat Pie, 2 Saucy Weiner, 3 Golden Dubloon, 4 BobJoePickle, 5-7 Weapon/Armor/Tool Stone II, 8-10 Average Strength/Speed/Life Potion, 11 Wealthy Wallet, 12-15 Storage Chest 9/10/13/15, 16 Guilding Tools, 17 Vendor Stamp, 18 Bottled Town Teleport, 19 Reset Fragment, 20 Secret Map |
| 3 | Faraway Piers | 0 Copper Twine, 1 Wormie Weight, 2 Leafy Vines, 3 One Pound of Steel, 4 Dynamite, 5 Needledrop, 6 Not Dynamite, 7/8 Tool Stone I/II, 9 Matty Bag Stamp, 10 Clover Stamp, 11 Cattleprod Token, 12 Reset Fragment |
| 4 | Frostbite Towndra | 0 Mountain Bread, 1 Yeti Ham, 2 Sheepie Dairy, 3 Cardboard Traps, 4 Wax Skull, 5-7 Weapon/Armor/Tool Stone III, 8-10 Decent Strength/Speed/Life Potion, 11 Prosperous Pouch, 12-17 Storage Chest 16-21, 18 Bottled Town Teleport, 19 Reset Fragment, 20 Damaged Cog, 21 Bottled World Town Teleport, 22 Anvil Reset Whetstone |

  W5+ extensions (one line each): key 5 (Toolbox name Hyperion_Nebula / data name Outer_World_Town; 17 items, no Reset Fragment in data) sells Quest65/66 items, foods, DNA Splicer (DNAgun0), Stone W4/A4/T4, Potent potions, Sack of Success, Egg/Spice/Sigil stamps, Blue Tome Pages; key 6 (Magma Rivertown) foods, Magma Barrel, Stone W5/A5/T5, Refinery Stamp, Treasure Totebag, Red Tome Pages; key 7 (Spirit Village) BoneJoePickle, Crop Transfer Ticket, Nigiri, Dumpling, Plasma Barrel, Stone W8/A7/T7 (tier numbers skip), Forge Stamp, Rucksack of Riches, Storage Chest 26-28; key 8 (Shimmerfin Grove) Replica Trophy/Nametag, Taffy, Cookie, Fishbowl, Stone W9/A8/T8, Kruker Stamp, Loot Luggage, Storage Chest 29-30, Unstable Reliquarium [C5][C6].

M2. **Buy price rule.** price(copper) = 4 x `sellPrice` (`website-data/items.json#<rawName>.sellPrice`). Checked for every W1-W4 item against the wiki table; all match except Damaged Cog (priced in "dementia coins", a higher currency) [C11]. Coin denominations: 100 copper = 1 silver, 100 silver = 1 gold, 100 gold = 1 platinum [C11]. Examples: Target Stamp 400, Shield Stamp 1,600, Mana Stamp 6,000, Vitality Stamp 32,000, Vendor Stamp 400,000, Anvil Whetstone 1,200,000, Talent Point Reset Fragment 800, Bottled Town Teleport 200.

M3. **Daily stock (base).** Wiki stock per item (tier 3; unclear if base or with Vendor/Overstock) [C16]. Key limited items:

| Item | Stock/day | Town |
|---|---|---|
| Target / Shield / Mana Stamp | 1 each | Blunder Hills |
| Vitality Stamp | 1 | Forest Villas |
| Vendor Stamp | 1 | YumYum Grotto |
| Matty Bag / Clover Stamp | 1 each | Faraway Piers |
| Weapon / Armor / Tool Stone I | 12 / 24 / 16 | Blunder Hills |
| Armor Stone II | 6 (Forest) / 24 (Grotto) | |
| Weapon / Tool Stone II | 12 / 16 | YumYum Grotto |
| Weapon / Armor / Tool Stone III | 12 / 30 / 21 | Frostbite |
| Talent Point Reset Fragment | 1, 1, 2, 1, 3 (shops 0-4) | all |
| Anvil Reset Whetstone | 1 | Frostbite |
| Power Statue | 3 | Blunder Hills |
| Foods/potions | 400-750 (W1), 20,000-25,000 (W2-W3) | |

M4. **Restock clock.** The shop restocks on the daily reset. `TimeAway.ShopRestock` is a countdown in seconds to the next daily reset at `GlobalTime` (`parsers/generated-types.ts#L132`, adapter `account.dailyResetInSeconds`, `packages/account-state/src/adapter.ts#L365-L368`). Two ShopRestock readings within 1 h are the same reset (`packages/knowledge/systems/checklist.facts.yaml`) [C9]. The account week reuses it: `ShopRestock + 86400 x accountOptions[39]` (`parsers/misc.ts#L1875`) [C10].

M5. **Stock multipliers.** Vendor Stamp: `ShopQty`, func `decay`, x1=35, x2=100: bonus % = 35 x L / (100 + L), e.g. L=50 -> 11.7%, L=100 -> 17.5%, L=300 -> 26.3%, L=1000 -> 31.8% (`website-data/stamps.json#L2617-L2632`) [C12]. Overstock Regulations bribe (`shared-data.json#L1986-L1992`, bribes index 6, price 20,000, `effectName ShopQtyPct`, value 20, effective only after the next restock) [C13]. Sneaky Stealing achievement (`achievements.json#L4382`, index 306, rawName TaskAchE27, reward "25% Shop Capacity for all Town Shops", secret) [C14]. Toolbox contains no code that applies these to a stock number; the game does it server-side of the save [C15].

M6. **Save layout.** Raw `ShopStock` = array indexed by shop key; each entry an object keyed by item index (string) with remaining amount (string or number). `parseShops` pairs `Object.values(shopObject)[itemIndex]` with `shops[shopIndex].items[itemIndex]` and keeps items where amount > 0 AND `shopMapping[shopIndex][itemIndex]` [C1][C2]. Output path `accountData.shopStock` = array (per shop) of `{amount, name, rawName, shopName}` (`parsers/index.ts#L182`, `parsers/generated-types.ts#L339`).

M7. **Toolbox whitelist.** `shopMapping` (`parsers/shops.ts#L37-L47`): shop 0 -> items 3, 8, 13, 14, 17, 23 (Cue Tape, Crude Oil, Power Statue, Sculpting Tools, Mana Stamp, Darts); 1 -> 2, 8, 9, 13; 2 -> 0-10, 18, 19; 3 -> 12; 4 -> 0, 1, 2, 8, 9, 10, 19, 22; 5 -> 2, 3, 4, 8-11; 6 -> 0-5; 7 -> 0-7; 8 -> 2, 3, 5, 6, 7. It drops most stamps, stones I, bags and chests [C3][C24]. `getRawShopItems` returns the set of whitelisted rawNames.

M8. **ActiveOn adapter.** `packages/toolbox-parsers/src/shop-stock.ts` `shopStockAll` reads raw `ShopStock` for every item (no whitelist); `packages/account-state/src/collections.ts#L291-L299` folds it into `account.shopStock: Array<Record<rawName, amount>>` (`collections-types.ts#L79`). Provenance in `collections-fields.ts#L16,41,63` [C7][C8].

M9. **Town names mismatch.** Toolbox `shopNameMapping` (`shops.ts#L49-L59`) calls keys 5-8 Hyperion_Nebula, Smolderin'_Plateau, Spirited_Valley, Shimmerfin_Deep, while the data `shops[k].name` says Outer_World_Town, Magma_Rivertown, Spirit_Village, Shimmerfin_Grove. Use the data names (KB generators do, `packages/knowledge/generators/stamps.gen.ts#L82-L93`) [C4].

M10. **Talent Point Reset Fragment loop.** `ResetFrag` (sell 200, price 800): holding 10 converts to 1 Talent Point Reset Potion (`items.json` desc) [C18]. Base daily supply 8 across W1-W3 towns (1+1+2+1+3) [C16][C18]. Gem Shop sells the stronger talent resets separately (`gemShop.json`, weekly restock) and is a different system (Gem Shop dossier).

M11. **Anvil Reset Whetstone.** Frostbite shop idx 22, sell 300,000, price 1,200,000, stock 1/day; resets a character's spent Anvil points. Already used by `anvil.respec` (`packages/knowledge/systems/anvil.yaml#L93-L102`) [C19].

M12. **One-off quest/utility items.** Obol Altar quest ingredient is bought from whichever shop lists it in stock (`packages/engine/src/collections/obols.ts#L80-L100`) [C20]. Darts / Basketball / Secret Map / Golden Dubloon / Silver Antique / Damaged Cog / Cattleprod Token are quest items or minigame unlocks sold by shops (names in M1).

M13. **Bags and storage.** InvBag104-108/113-115 and InvStorage2-30 are single-stock items; price = 4 x sell. W1-W4 prices: Bummo 96c, Capitalist Case 99s96c, Wealthy Wallet 99g99s96c, Prosperous Pouch 99p99g99s96c; chests 2/6/7 = 8s/32s/1g40s, 8/12 = 2g20s/2g80s, 9/10/13/15 = 3g56s/10g/24g/40g, 16-21 = 60g/80g/1p40g/2p/3p20g/5p [C11][C16]. Whether bought items add inventory slots/storage vs. only unlock is covered by the Storage/Inventory dossier.

M14. **Non-stamp utility and quest-gated items.** Shops also sell: carry bags (InvBag104-108, 113-115 = keys 0-2, 4-8), storage chests (InvStorage2-30), fishing gear at Faraway Piers (Line1/5/10, Weight1/5/10/11), trap and worship starters at Frostbite (TrapBoxSet1, WorshipSkull1), smithing hammer chisels (SmithingHammerChisel keys 0, 2), potion and food stock, NPCtoken27 (Cattleprod Token, key 3), DNAgun0 (key 5), pickles (BobJoePickle key 2, BoneJoePickle key 7) and quest items sold as shop stock: Quest86/104 (key 0), Quest37 (1), Quest19/87 (2), Quest57/67 (4), Quest65/66/83 (5), Quest84 (6), Quest80 (7), Quest103/105 (8). The Quest items gate quests, so a quest tracker should resolve "buy X in town Y" from this table (the Obol Altar buy in M12 is one case). Sources: `shared-data.json#shops` (1). Confidence: H for presence; L for what each Quest item unlocks (not checked). Fishing, trapping and worship consumers belong to their own dossiers.

M15. **Prices at W5+.** `items.json` has only `sellPrice`; no buy-price field exists. The x4 rule is verified for W1-W4 coin items; the wiki shows higher currencies (dementia, void coins) for some W4+ items, so the currency per item at W5+ is not derivable from data. Confidence: M.

M16. **Positional pairing and stock maxima.** `ShopStock` stores only the remaining amount, paired to items by position (`Object.values(shopObject)[itemIndex]`, `parsers/shops.ts#L13-L28`). If a patch inserts or reorders shop items, amounts silently misalign; ActiveOn should pin the item list per game version and treat a changed list length as a parse warning. A bought-out item may appear as 0 or be absent from the object. Toolbox never applies Vendor Stamp, Overstock or Sneaky Stealing, so the maximum per item cannot be computed from code (C15). Confidence: H on the code facts, L on how the game represents sold-out items.

## Min-max by stage

Community meta for shops specifically is thin; the web-search budget was exhausted this session, so no tier-4 guide was fetched (see Open questions). What exists: wiki-level facts [C12-C14][C16] and the general "do your stamps" W1 meta (Idleon Academy, 2025-09-23, via `ux/m25-coverage.md` row Stamps; secondhand, not re-fetched) [C26]. The ordered lines below are DERIVED from the cited rules and prices, not community-sourced, and should be read as H on arithmetic, L on meta.

- **W1 early** (coins in copper/silver): 1) Buy Target (4s), Shield (16s), Mana (60s) Stamps in Blunder Hills the day you can afford each; they are 1-stock, so no rush but they never restock once owned [C16][C17]. 2) Buy Overstock Regulations (20,000 copper) as soon as "The Art of the Deal" is bought; it raises every later daily allowance for 2 gold [C13]. 3) Daily: pick up Reset Fragments [C18]. 4) Skip chests/bags until coins are plentiful; the Bummo Bag (96c) is the cheap exception [C11].
- **W1 mid:** Vitality Stamp (3g20s) in Forest Villas [C17]. Upgrade Stones I (12/24/16 per day) are the only capped gear sink; spend all of the day's stock on the gear being upgraded [C16].
- **W1 late / W2 early:** Reach YumYum Grotto, buy Vendor Stamp (40 gold) as the first W2 shop purchase: it is the only stamp that scales every shop's allowance, with diminishing returns (17.5% at L100, 26.3% at L300, cap 35%) [C12]. Go for the Sneaky Stealing secret achievement (+25%, free) [C14].
- **W2 mid:** Faraway Piers: Matty Bag Stamp (2g68s) and Clover Stamp (4g80s) [C17]. Weapon/Tool Stone II (12/16) and Armor Stone II (24) for gear upgrades [C16].
- **W2 late / W3 early:** Frostbite Towndra: Anvil Whetstone (1.2M) only when a respec split gains >=25% (existing rule) [C19]; stones III (12/30/21 stock); Cardboard Traps and Wax Skull (99 each, 2 gold) feed Trapping and Worship at their start [C16].
- **W3 mid/late:** Stock multipliers are maxed first (Vendor Stamp levels, bribe, achievement); then storage chests 16-21 as coins allow (60g to 5p, in numeric order) [C16].
- **W4 (Outer World Town, key 5 / Hyperion Nebula):** Stones W4/A4/T4, Potent potions, Egg/Spice/Sigil stamps (40p, 2 dementia, 28 dementia), Blue Tome Pages (40 void coins) [C5][C16]. W5+ towns continue the pattern: one stone set, a food pair, 1-3 stamps, 1 bag, chests (M1); the exact item lists are in shared-data and not uniform per town (C23).
- **Per class:** none; shop access is class-agnostic.

## Open questions

- How Vendor Stamp, Overstock (+20%) and Sneaky Stealing (+25%) combine, and whether the wiki's "stock" column is base or already boosted: not in Toolbox or data; needs a save comparison (ShopStock max amounts vs unmodified accounts) or the game's `ShopQty` call site.
- Exact base stock values vs. wiki figures are unverified in-game; in the save only the remaining amount is stored, not the max.
- Whether any restock happens other than the daily reset (the Gem Shop uses weekly and daily restocks; town shops: wiki says daily) [C22].
- World numbering for keys 5-8: Toolbox comment (`parsers/misc.ts#L1873`) calls Magma Rivertown "the World 5 town" while shop key 5's data name is Outer_World_Town and Toolbox's name map says Hyperion_Nebula; reconcile before labelling W5/W6 towns in the UI [C4][C6].
- Why does `shopMapping` whitelist only 6 of Blunder Hills' items (no stamps)? Toolbox's UI purpose, not a game rule; ActiveOn already bypasses it [C24].
- No tier-4 community guide on shop buy orders was reached this run (search budget exhausted); re-run to source an actual community buy order, and to find whether the "Vendor shop restock" checklist row should alert at reset time or at "stock for owned-and-wanted items".
- Checklist ownership: `checklist.facts.yaml` has a daily clock on `TimeAway.ShopRestock`; the item-level row ("buy what is in stock that you lack") is currently only `stamps.check.shop-now` (stamps) and the Obol Altar buy; there is no row for Reset Fragments, Whetstone or stones.
- Sprites: W5+ items lack ActiveOn sprites; Vendor Stamp, Reset Fragment, Whetstone, Storage Chest need icons if a Shops page is built (check `apps/activeon/src/art/sprites/grids/*.ts`).

## Claims and sources

Format: [Cn] text. Source (tier). Verified 2026-10-19, game 2.3.540 unless stated.

- [C1] getShops reads `idleonData.ShopStock` and calls parseShops. `parsers/shops.ts#L8-L11` (1). Confidence: H.
- [C2] parseShops returns one array per shop key (sorted), keeping only items with amount > 0 and whitelisted in shopMapping. `parsers/shops.ts#L13-L28` (1). Confidence: H.
- [C3] shopMapping whitelist indexes per shop key 0-8 as listed in M7. `parsers/shops.ts#L37-L47` (1). Confidence: H.
- [C4] shopNameMapping names for keys 5-8 (Hyperion_Nebula, Smolderin'_Plateau, Spirited_Valley, Shimmerfin_Deep) differ from data names (Outer_World_Town, Magma_Rivertown, Spirit_Village, Shimmerfin_Grove). `parsers/shops.ts#L49-L59` vs `data/website-data/shared-data.json#shops` (1). Confidence: H.
- [C5] shared-data has 9 shops (keys 0-8) with 26, 14, 21, 13, 23, 17, 9, 13, 13 items; item lists as in M1. `data/website-data/shared-data.json#shops` (1). Confidence: H.
- [C6] Keys 0-4 are Blunder Hills, Encroaching Forest Villas, YumYum Grotto, Faraway Piers, Frostbite Towndra (W1-W3 towns); key 5 is the W4-era Outer World Town per data; Toolbox comment calls Magma Rivertown "the World 5 town". `shared-data.json#shops`; `parsers/misc.ts#L1873` (1). Confidence: H.
- [C7] ActiveOn's `shopStockAll` reads every shop item because Toolbox's whitelist drops most stamps. `packages/toolbox-parsers/src/shop-stock.ts#L3-L7` (1, project code). Confidence: H.
- [C8] `account.shopStock` is `Array<Record<rawName, amount>>` built from `shopStockAll`. `packages/account-state/src/collections.ts#L291-L299`; `collections-types.ts#L79` (1, project code). Confidence: H.
- [C9] `TimeAway.ShopRestock` is a countdown in seconds to the next daily reset at GlobalTime; adapter exposes `account.dailyResetInSeconds`. `packages/account-state/src/adapter.ts#L365-L368`; `fields.ts#L60`; `parsers/generated-types.ts#L132` (1). Confidence: H.
- [C10] Toolbox derives its weekly seed from `GlobalTime + ShopRestock + 86400 x accountOptions[39]`. `parsers/misc.ts#L1875` (1). Confidence: H.
- [C11] Buy price equals 4 x item `sellPrice` for every W1-W4 shop item (e.g. Target Stamp 100 -> 4 silver; Whetstone 300,000 -> 1p20g; Vendor Stamp 100,000 -> 40g), matching the wiki table; Damaged Cog uses a higher currency. 100 copper = 1 silver, 100 silver = 1 gold, 100 gold = 1 platinum. `data/website-data/items.json#sellPrice` computed against https://idleon.wiki/wiki/Vendors (1 data + 3 wiki; wiki undated, fetched 2026-10-19). Confidence H for W1-W3 items; the x4 factor is inferred (no buy-price field in data, as `packages/knowledge/systems/stamps.yaml#L42` notes). Confidence: H.
- [C12] Vendor Stamp (StampC11, YumYum Grotto, 40 gold) gives `ShopQty` = 35 x L/(100+L) %; wiki: "+{35 x level / (100 + level)}% Shop Stock Quantity". `data/website-data/stamps.json#L2617-L2632`; `items.json#StampC11`; https://idleon.wiki/wiki/Stamps (1, 3). Confidence: H.
- [C13] Overstock Regulations bribe (index 6): +20% item quantity in all shops, price 20,000, takes effect only after shops restock; wiki: cost 2 Gold Coins, available after The Art of the Deal (the prerequisite is wiki-only, not checked in data or parser: confidence L for that part). `data/website-data/shared-data.json#L1986-L1992`; `parsers/world-1/bribes.ts` (done = BribeStatus[index] === 1); https://idleon.wiki/wiki/Bribes (1, 3). Confidence: H.
- [C14] Sneaky Stealing (secret achievement, TaskAchE27, index 306) rewards 25% Shop Capacity for all Town Shops; completion read from `AchieveReg`. `data/website-data/achievements.json#L4382-L4393`; `parsers/achievements.ts#L16-L30` (1); wiki Vendors page "Key Notes" (3). Confidence: H.
- [C15] Toolbox computes no shop quantity from these bonuses; "ShopQty" occurs only in data files. Grep of `parsers/**` (1). Confidence: H.
- [C16] Wiki stock (specific stone and food quantities were not individually verified; stamp stock 1 and the existence of the stock table are confirmed) and price table per shop item (stock 1 for stamps and chests; stones I 12/24/16; stones III 12/30/21; fragments 1/1/2/1/3; Whetstone 1; foods 400-25,000). https://idleon.wiki/wiki/Vendors (3), fetched 2026-10-19, patch unstated. Confidence: M.
- [C17] Shop-sold stamps (Egg/Spice/Sigil names inferred from stamp ids StampB41/B38/C12, not name-checked; Mana is StampA3, Kruker StampC26): Target, Shield, Mana (Blunder Hills), Vitality (Forest Villas), Vendor (YumYum Grotto), Matty Bag, Clover (Faraway Piers), Egg, Spice, Sigil (key 5), Refinery (key 6), Forge (key 7), Kruker (key 8). `shared-data.json#shops`; `packages/knowledge/generators/stamps.gen.ts#L82-L93` (1). Confidence: H.
- [C18] Talent Point Reset Fragment (ResetFrag) is sold in the five W1-W4 town shops (keys 0-4); keys 5-8 do not list it in shared-data (the wiki lists it for Outer World Town, key 5: **Disputed**, data wins, confidence M for key 5). 10 fragments convert to 1 Talent Point Reset Potion; price 800 copper (sellPrice 200 x4). `data/website-data/items.json#ResetFrag`; `shared-data.json#shops`; https://idleon.wiki/wiki/Vendors (1, 3). Confidence: H for keys 0-4 and price.
- [C19] Anvil Reset Whetstone: Frostbite Towndra, 1.2M coins, one a day, resets spent Anvil points. `items.json#Whetstone`; `packages/knowledge/systems/anvil.yaml#L93-L102` citing wiki Vendors row 23 (1, 3). Confidence: H.
- [C20] The Obol Altar quest's required item is located via `account.shopStock` and marked "buy" with the town. `packages/engine/src/collections/obols.ts#L80-L100` (1, project code). Confidence: H.
- [C21] Gem Shop talent resets restock weekly and are a separate system from town shops. `data/website-data/gemShop.json#L193-L203` (1). Confidence: L.
- [C22] Shops refill daily, at a reset time that is per-account, not global: wiki "Daily stock is refreshed at the daily reset, which is different for every account"; bribe text "Takes effect only after Shops restock". https://idleon.wiki/wiki/Vendors (3); `shared-data.json#L1988` (1). Confidence M that restock is exactly the account daily reset (inferred from ShopRestock naming). Confidence: M.
- [C23] Stones are not strictly one tier per town. Per shared-data: key 0 StoneW1/A1/T1; key 1 A2; key 2 W2/A2/T2; key 3 T1/T2; key 4 W3/A3/T3; key 5 W4/A4/T4; key 6 W5/A5/T5; key 7 W8/A7/T7; key 8 W9/A8/T8 (the W/A/T tiers skip numbers in keys 7-8). `shared-data.json#shops` (1). Confidence: H. (Corrected after verification; original "one tier per town" was refuted.)
- [C24] Toolbox's whitelist leaves out most stamps (e.g. Target, Shield, Vitality, Vendor, Matty Bag, Clover are not whitelisted). `parsers/shops.ts#L37-L47` against `shared-data.json#shops` (1). Confidence: H.
- [C25] `getRawShopItems` returns the whitelisted rawName set. `parsers/shops.ts#L30-L35` (1). Confidence: H.
- [C26] "Do your stamps" is W1 meta. Idleon Academy, 2025-09-23, via `ux/m25-coverage.md` (secondhand, not re-fetched this run; pre-2.3.540 possible) (4). Confidence: L.
