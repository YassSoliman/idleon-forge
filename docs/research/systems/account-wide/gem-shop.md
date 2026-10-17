# Gem Shop and Gems

Research date 2026-10-17, game v1.23 "Lumi Menagerie" (N.js Last-Modified 2026-10-17), IdleonToolbox commit `6827d3f`. `TB` below means `https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/`.

### Key findings

- **The save stores purchases as one flat array.** `GemItemsPurchased` maps to `account.gemShopPurchases`, a 300-slot array indexed by each item's `globalIndex` (H). Toolbox's parser passes it through unchanged and has no buy-order or "gems idle" logic, so ActiveOn has to bring its own Spend Plan. The gem balance is `GemsOwned`, which maps to `account.currencies.gems`.
- **The Limited Specials slots are reused.** Each rotation puts a new item into slots 87-94 (H). A non-zero count at 87-94 tells you a slot was bought in some rotation, not which item. Daily and weekly restock items probably hold per-period counts, not lifetime totals (M).
- **The wiki's Limited Specials are Stale.** The wiki Gem_Shop "September 18, 2026 – Current" Limited Specials (Insta Operation, Emerald Pendant, and so on) is the v1.22 lineup. In v1.23, N.js and Toolbox list a Stamina Battery freebie (1 gem, x2), Timeless Nametag, Research Papers, Diamond Horns, and W3-W6 Kill Rings (H). The wiki also lists Bottled Wind at 140 gems; the game data says 240.
- **Free gems for W1-W4 players are mostly one-time grants.** Data shows about 644 from quests, 935 from W1-W4 Task Unlocks and 160 from social links (H). Achievement gems (1,285 across the W1-W4 tabs, summing the `gems` field and excluding the 152 `FILLERZZZ_ACH` placeholder rows; corrected in assembly) are paid out **only on Steam** (H data flag plus wiki). Recurring income is small: Pet Mart up to 150 a day (mean about 26, M), Alchemy Liquid Shop gems, daily bosses, Arcade rolls, and event boxes.
- **What every community source buys first:** Infinity Hammer (300), then Extra Card Slots, then Carry Capacity, food and storage, then the W2 cauldrons, then the W3 Crystal 3D Printer and Tower Building Slots. Sources disagree on Brimstone Forge, Ivory Bubble Cauldrons, Souped Up Tube, Prayer Slots and Chest Sluggo (see the min-max section).
- **Never buy these for progress:** Time Candy, card packs, obol stacks, arcade balls and keychains. Every source ranks them D or F. Only buy talent, star or class resets to fix a mistake.
- **Account-detectable mistake: banked gems with zero purchases.** A real W2 account had a positive gem balance and all 300 purchase slots at 0. The W3 account had only Infinity Hammer, 2 Brimstone slots and 1 Bleach Liquid Cauldron. Both are "gems Stale" alerts.

## Gem Shop

- **What it is:** The premium shop. Gems buy permanent account-wide upgrades (the "Bonuses" tab, organised by world), capacity expansions, daily and weekly restocking consumables, card packs and other gacha items, and a rotating Limited Specials section. Gems themselves are a single account-wide currency.
- **Unlocks:** Available from account creation via the menu (no world gate). Many Bonuses-tab items only have an effect once their system is unlocked. Sigil Supercharge says sigils level only after reaching W4 (N.js item text, H). Conjuror Pts tells you to wait until Cosmo is rescued. Parallel Villagers and Resource Boost need W5 Caverns.
- **Scope:**
  - Account-wide: everything in the Bonuses tab, every Inventory & Storage expansion (they apply "to all your characters, even ones you haven't made yet"), Daily Teleports, Daily Minigame Plays, Card Presets and Extra Card Slot (H, item text).
  - Per character: Regular Talent Reset, Star Talent Reset, Pandoras Office Box, Subclass Swap Token and Complete Class Redo are used on one character (wiki Dailies N' Resets note). Time Candy is per character (AFK time for one character). Equipment items such as kill rings, nametags and premium hats are per character because they are worn.
- **Inputs → outputs:** Gems (free or bought) go in. Out come permanent multipliers and slots, plus consumables. A purchase's price is `base + increment × timesBought` (linear, H: matches wiki "Final"/"Total" columns, e.g. Item Backpack Space 200 → 325, total 1575).

### Gem Shop item table (v1.23, W1-W4 relevant, from `gemShop.json`, matches N.js gem shop array @14094509)

"Idx" is the index in `GemItemsPurchased`. "Last" is the price of the final purchase. Prices and limits are H. Effects are paraphrased from the in-game text.

**Usables: Inventory & Storage (account-wide)**

| Item | Idx | Base | +/buy | Max | Last | Total | Effect |
|---|---|---|---|---|---|---|---|
| Item Backpack Space | 55 | 200 | 25 | 6 | 325 | 1,575 | +4 inventory slots each, all characters |
| Storage Chest Space | 56 | 175 | 25 | 12 | 450 | 3,750 | +9 storage slots each |
| More Storage Space | 109 | 450 | 12 | 10 | 558 | 5,040 | +9 storage slots each; appears after the first set (community) |
| Carry Capacity | 58 | 150 | 25 | 10 | 375 | 2,625 | +25% carry cap per buy, all item types (TB `parsers/misc.ts#L700`) |
| Food Slot | 59 | 450 | 300 | 2 | 750 | 1,200 | +1 food slot, all characters |
| Card Presets | 66 | 250 | 160 | 5 | 890 | 2,850 | +1 card loadout preset, all characters |

**Usables: Dailies N' Resets**

| Item | Idx | Base | +/buy | Max | Total | Effect / restock |
|---|---|---|---|---|---|---|
| Daily Teleports | 71 | 120 | 40 | 10 | 3,000 | +13 teleports/day, banks up to 6 days (account) |
| Daily Minigame Plays | 72 | 150 | 50 | 4 | 900 | +4 minigame plays/day (account) |
| Regular Talent Reset | 73 | 200 | 0 | 10 | 2,000 | per character; restocks weekly |
| Star Talent Reset | 74 | 300 | 0 | 3 | 900 | per character; weekly |
| Subclass Swap Token | 75 | 500 | 250 | 2 | 1,250 | per character; stock refreshes each major update (wiki) |
| Pandoras Office Box | 76 | 250 | 0 | 1 | 250 | refunds Post Office boxes; weekly |
| Complete Class Redo | 78 | 999 | 0 | 1 | 999 | back to Lv1 Beginner; once ever |

**Usables: Cards / Goods & Services / Time Candy**

| Item | Idx | Cost | +/buy | Max | Effect |
|---|---|---|---|---|---|
| Extra Card Slot | 63 | 150 | 40 | 4 (total 840) | +1 card slot, all characters |
| Newbie / Ancient / Eternal / Galaxy / Smolderin / Spirit Card Pack | 64,65,65,69,61,70 | 200/425/600/650/690/720 | 0 | ∞ | random cards (wiki has pack odds) |
| 4 Star Cardifier | 67 | 325 | 0 | ∞ | 3★ card → 4★, your choice |
| Smol / Med / Biggy Arcade Balls | 79/80/81 | 100/275/1250 | 0 | ∞ | 30/100/500 balls |
| Weekly Dungeon Boosters | 84 | 275 | 40 | 11 (total 5,225) | +3 dungeon runs/week (12 free) |
| Tier 1/2/3 Keychain | 86/85/83 | 150/325/490 | 0 | ∞ | keychain fragments (random-stat keychain) |
| Just One Please / Baby's First Lolly / Kid in a Candy Store / Absolute Sugar Maniac | 47-50 | 40/80/150/270 | 0 | 4 each per day | Time Candy (1h; random 1-4h; 2-24h; 4-72h) |

**Bonuses: World 1 & 2 (account-wide)**

| Item | Idx | Base | +/buy | Max | Total | Effect |
|---|---|---|---|---|---|---|
| Infinity Hammer | 103 | 300 | 0 | 1 | 300 | 2 anvil productions at once |
| Brimstone Forge Slot | 104 | 100 | 0 | 16 | 1,600 | per forge slot: 50% faster smelt, +50% multi-bar (TB `parsers/world-1/forge.ts#L98`) |
| Ivory Bubble Cauldrons | 105 | 300 | 0 | 4 | 1,200 | +2 players, 1.5x brew speed, 1.5x new-bubble chance per cauldron |
| Bleach Liquid Cauldrons | 106 | 250 | 0 | 4 | 1,000 | +1 player, 1.5x liquid cap and regen; bought in order (TB `parsers/world-2/alchemy.ts#L155`) |
| Obol Storage Space | 57 | 125 | 0 | 12 | 1,500 | obol inventory slots |
| Quality / Marvelous Obol Stack | 107/108 | 250/550 | 0 | ∞ | – | 3 random obols (gacha) |
| Sigil Supercharge | 110 | 140 | 0 | 10 | 1,400 | +20% Sigil EXP each (sigils level from W4) |

**Bonuses: World 3**

| Item | Idx | Base | +/buy | Max | Total | Effect |
|---|---|---|---|---|---|---|
| Crystal 3D Printer | 111 | 875 | 0 | 1 | 875 | 2nd printer chamber on all characters |
| More Sample Spaces | 112 | 250 | 40 | 6 | 2,100 | +1 sample slot |
| Burning Bad Books | 113 | 250 | 75 | 4 | 1,450 | +5 minimum Talent Book level (TB `parsers/misc.ts#L318`) |
| Prayer Slots | 114 | 250 | 75 | 4 | 1,450 | +1 equipped prayer, all characters |
| Zen Cogs | 115 | 500 | 125 | 8 | 7,500 | 1 Yin + 1 Yang cog per buy |
| Cog Inventory Space | 116 | 100 | 40 | 20 | 9,600 | +4 cog inventory slots |
| Tower Building Slots | 117 | 350 | 100 | 4 | 2,000 | +1 parallel build slot, full build rate |
| Fluorescent Flaggies | 118 | 250 | 75 | 6 | 2,625 | +50% flaggy rate each (TB `parsers/world-3/construction.ts#L110`) |

**Bonuses: World 4 (outline)**

| Item | Idx | Base | +/buy | Max | Total | Effect |
|---|---|---|---|---|---|---|
| Royal Egg Cap | 119 | 350 | 50 | 5 | 2,250 | +1 egg cap, 1.10x new-mob chance each |
| Richelin Kitchen | 120 | 250 | 40 | 10 | 4,300 | kitchen n → 3x cook speed, 2x recipe speed, 40% cheaper (TB `parsers/world-4/cooking.ts#L758`) |
| Console Chip | 121 | 385 | 0 | 7/week | – | random lab chip (gacha) |
| Mainframe Jewel | 122 | 450 | 0 | 2/week | – | random unowned jewel |
| Souped Up Tube | 123 | 480 | 65 | 5 | 3,050 | 2 lab tubes each: 2x lab EXP, +30% line width (TB `parsers/world-4/lab.ts#L85`) |
| Mob Storage | 124 | 325 | 55 | 12 | 7,530 | +12 pet storage slots |
| Fenceyard Space | 125 | 275 | 45 | 6 | 2,325 | +2 fenceyard slots |
| New Meal | 126 | 250 | 0 | ∞ | – | unlock a meal you would otherwise get from spices |

**W5-W7 Bonuses and Oddities (out of scope, index only):** Davey Jones Training idx 8, Snehebatu Link 9, Novelty Jade Coins 10, King of All Winners 11, Miracle Chest 127, Chest Sluggo 129, Divinity Sparkie 130, Golden Sprinkler 131, Lava Sprouts 133, Ancient Artifact 134, Plot of Land 135, Pristine Charm 136, Shroom Familiar 137, Instagrow 139, Life Refill 140, W7 items 40-45, Caverns items 0-5. Daily time skips: Bottled Wind 128 (240), Gaming Fertilizer 132, Sand of Time 138, Compost Bag 150, Summoner Stone 151, Stamina Battery 13 (595). Premium stones and hat tools: 95-102. Toolbox's JSON swaps the "Time_Skips" and "Premium_Stones" section labels compared with the game and the wiki.

**Limited Specials, v1.23 (slots 87-94, rotate with updates):** Stamina Battery freebie (1 gem, x2, slot 87), Timeless Nametag (2,950, 40% damage multiplier), Research Papers (270, x50, W7), Diamond Horns (3,000, cosmetic), W3/W4/W5/W6 Kill Ring (590/685/810/925, x6 each, 1.30x portal-kill credit in that world). The W3 Kill Ring is the only W1-W4-relevant item in this rotation. It speeds up opening W3 portals but is a per-character equip. Several past specials (Toolbox `past_limited_specials`, also slots 87-94) were free 1-gem freebies, for example Edible Coins, Summer Cooler and Helpful Pocketwatch. **Always claim 1-gem freebies.**

**Gem packs (real money; brief):** Standard packs run from 200 gems for $1.99 up to Supernova at 6,500 gems for $29.99 (100-217 gems/USD). The Starter Pack ($4.99) gives 350 gems a day for 5 days, a Sheepie companion and +16 storage slots. The Auto-Loot Pack ($4.99) gives 900 gems, an auto-loot toggle, +5 inventory and +8 storage slots. The Gem Motherlode ($14.99) gives 350 gems a day for 12 days plus 100 Gem Envelopes. Rotating and seasonal packs all match or beat the "Mountain" ratio and add extras. Pet Mart bundles exist too (wiki Gem_Shop, edited 2026-10-14). The changelog notes that buying 4,000 or more gems across packs disables daily pack popups (v1.07, 2026-03-06).

- **Goals and Milestones:**

| Milestone | Cost | Why it matters |
|---|---|---|
| Infinity Hammer | 300 | doubles anvil throughput from day 1 |
| 1st-4th Extra Card Slot | 150/190/230/270 | +1 card bonus per slot on every character |
| Food Slot 1 / 2 | 450 / 750 | permanent extra food buff slot |
| Bleach Liquid Cauldron 1-4 | 250 each | liquid cap and regen, i.e. bubble levelling forever |
| Crystal 3D Printer | 875 | doubles 3D Printer sample output on all characters |
| Tower Building Slots 1-4 | 350-650 | parallel construction builds |
| Richelin Kitchen 1-n | 250 + 40n | W4 meal speed |
| 4,000 gems bought via packs | – | no daily pack popups (light spenders) |

- **Feeds / fed by:**
  - Feeds Anvil and Smithing (Infinity Hammer), the Forge (Brimstone), Alchemy bubbles and liquids, Sigils (W2 Alchemy), Cards (slots and presets), Storage and Carry Capacity (every skill's AFK Setup), Food (food slots), and Obols.
  - W3: 3D Printer, Construction (towers, cogs, flaggies), Worship and Prayers, Talent Book Library.
  - W4: Cooking, Breeding, Lab, Dungeons (boosters), Arcade (balls), Post Office (Pandora).
  - Fed by quests, Tasks (Task Unlocks pay gems; the Merit "World bosses can now drop gems"), Achievements (Steam only), Alchemy Liquid Shop, Arcade, Post Office, the Guild Giftbox, events, Pet Mart, daily bosses, and social links.
- **Per-session actions:**
  1. Claim any Limited Specials freebie (1 gem).
  2. Claim the Pet Mart free gems once you have Tournament access (daily).
  3. Buy the Alchemy Liquid Shop "One Measly Gem" and "A Pair of Gems" while they are cheap (they reset daily; Toolbox alert `alchemy.gems`, TB `utility/dashboard/account.js#L452`).
  4. Do the Picnic Stowaway daily quest and the Spikes minigame once a day (wiki Daily_Checklist).
  5. If the gem balance is at or above the next Spend Plan item's price, buy it.
  - **Idle state:** gems above the next priority purchase price with that purchase not yet made, or gems spent on F-tier consumables.
- **AFK Setup implications:** Carry Capacity and storage purchases raise AFK skilling caps across the board. Card slots and presets make card swaps between AFK Setups cheap. Daily Teleports cut active travel. Brimstone Forge and Infinity Hammer let W1 production AFK longer between checks.

### Free gem sources (approximate, from data)

| Source | Cadence | Amount | Confidence / source |
|---|---|---|---|
| Quest rewards (50 quests, mostly W1-W3 NPCs; largest: Scripticus 150, Postboy Pablob 75, Cactolyte 50, Desert Davey 50, Centurion 30) | one-time | ~644 total | H `quests.json`; wiki Gem page |
| Task Unlocks (Tasks tab, added automatically) | one-time | W1 160, W2 440, W3 240, W4 95 (W5-W7 +250) | H `taskUnlocks.json`; N.js `_customBlock_TaskStuff` @7269358 |
| Achievements | one-time, **Steam only** | W1 407, W2 264, W3 324, W4 290 (1,285; `gems` field, filler rows excluded) | H `achievements.json` (`steamExclusive`); wiki Achievements note |
| Discord / Twitch / YouTube links (title-screen buttons) | one-time | 50 / 50 / 60 | H N.js @5450807, @5451167, @15139173 |
| Pet Mart "Claim Free Gems" (Tournament) | daily | 10-150 × server var `GemPM_x` (=1 in sampled saves); mean ≈ 26 | H formula N.js `GemRewardfromPetMart` @10973869; mean M; added v1.07 (2026-03-06) |
| Alchemy Liquid Shop: One Measly Gem (1), A Pair of Gems (2) | daily, price rises per buy | a few/day | H N.js `A_PAIR_OF_GEMS` @14090406; wiki |
| Daily bosses: King Doot 5 gems (75%); Biggie Hours, Dilapidated Slush, Mutated Mush, Domeo Magmus, Demented Spiritlord via DropTable13, 4 gems | daily | ~4-5 each | wiki Gem sources (game-data module) |
| World bosses (Amarok, Efaunt, Chizoar, Troll... variants) after the Merit "World bosses can now drop gems" (+7%/purchase, 8 max) | per kill | 1 | H N.js @14800281. The wiki says "1/12 per level; first 150 boss fights", so the two disagree |
| Arcade balls | per ball | 1, 4, 16, 50, 250 (rare), 2,000 jackpot | H N.js `_customEvent_PachiStuff3` @9638809–9646344 |
| Post Office deliveries (Simple Shippin, Plan-it, Dudes Next Door…) | per order | 1-2 | wiki Gem sources |
| Guild Giftbox | weekly-ish | 25 (12.8%), 69 (1.2%) | wiki |
| Event boxes (~19% gem chance), Idle Skilling crossover events (300/550/700), Lava's stream drops | event | varies | wiki; Guide Sheet "Lava Streams" |
| Picnic Stowaway daily quest, Spikes minigame | daily | small (1 / unknown) | wiki Daily_Checklist, Gem page |
| Bonus Ballot | – | no gem effect found | wiki Bonus_Ballot checked |

The "IdleOn Guide Sheet" Gems tab (dated 2023-07-25, **Stale**) estimates about 429 free gems a week for a min-maxer, with up to 877 a week "if you are crazy" (colosseum farming, giants, W3/W4 minibosses, Cranium Alchemy). Treat these as order-of-magnitude figures only (L).

- **Min-max by stage (Spend Plan):**

  **Where the sources stand.**
  - The Discord tier list (shared on r/idleon 2026-01-25 and 2026-09-15; icons matched by me against Toolbox sprites, M):
    - S+: Infinity Hammer, Crystal 3D Printer, Extra Card Slot, Carry Capacity, King of All Winners.
    - S: Storage Chest Space, Food Slot, Tower Building Slots, Zen Cogs, Bleach Liquid Cauldrons, Divinity Sparkie, Legend Talent Pts, Instagrow, Shroom Familiar, Plot of Land.
    - B: Ivory Bubble Cauldrons, Brimstone, More Sample Spaces, Card Presets, Flaggies, Console Chip, Mainframe Jewel.
    - C: Royal Egg Cap, Daily Teleports, Chest Sluggo, Fenceyard, Sigil Supercharge, Weekly Dungeon Boosters, Mob Storage.
    - D: Souped Up Tube, Obol Storage, obol stacks, Burning Bad Books, Cog Inventory, New Meal, Subclass Swap.
    - F: candies, card packs, arcade balls, keychains, resets, Prayer Slots, time skips.
    - Its author is described as "not f2p".
  - Reddit 2026-01-18 thread "What is so good about the gem shop cauldron upgrades": the community splits. One camp says both cauldron types are S for early accounts ("people sleeping on alchemy"). The other says liquid is S and colored is high-A because "you can eventually unlock every bubble".
  - Reddit 2026-09-15: "Burning Bad Books is useless" once you use the max-book setting. "The W1 cauldron upgrades are all S tier."
  - Treyex tier list (Nov 2025, retitled Oct 2026, L, contains factual errors): ranks Brimstone, Souped Up Tube, Tower Slots and Sample Spaces S+, and ranks Obol Space F.

  **Free-to-play, ordered (W1 → W4).**
  1. Infinity Hammer (300). This is the universal first buy.
  2. Extra Card Slot #1-#2 (150, 190).
  3. Carry Capacity #1-#3 (150, 175, 200), plus Storage Chest Space as storage pressure appears.
  4. Extra Card Slot #3-#4 (230, 270).
  5. Once W2 Alchemy opens: Bleach Liquid Cauldrons #1-#4 (250 each, in order), then Ivory Bubble Cauldrons (300 each). Prioritise the colour your current bubbles need. Colored is contested; the early-account camp says buy it.
  6. Food Slot #1 (450).
  7. Brimstone Forge Slots, 2-4 at 100 each, only if bars are your bottleneck. This is contested: B on Discord, S+ in older lists.
  8. At W3 entry: Crystal 3D Printer (875). Save for it before reaching Construction and the 3D Printer.
  9. Tower Building Slots #1-#2 (350, 450).
  10. Food Slot #2 (750). Storage, Carry Capacity and Card Slots stay ongoing whenever they are the binding constraint.
  11. Late W3: More Sample Spaces (1-2) if you juggle samples. Flaggies or Zen Cogs only after the above.
  12. W4 outline: Richelin Kitchen #1-#3 (250, 290, 330), Royal Egg Cap (optional), Souped Up Tube (contested D vs S+). Wait on Mob Storage, Fenceyard and Console Chip.
  - Skip throughout: Time Candy, card packs, obol stacks, arcade balls, keychains, Burning Bad Books (if you use the max-book setting), resets, cosmetics.
  - Prayer Slots: the Discord list says F. Older guides valued them. Buy only if a specific prayer combination requires a third prayer.

  **Light spender.** Buy the Starter Pack and Auto-Loot Pack first; they have the best gems per dollar plus permanent storage and inventory. Then buy rotating packs that come with account bonuses. The Gem Motherlode beats every standard pack on ratio. Spend in the same order as the F2P list, but pull these forward: Food Slot #2, all 4 Ivory Cauldrons, 4+ Brimstone slots, and more Storage. Once W3/W4 are reached, add Daily Teleports #1 (cheap QoL) and Weekly Dungeon Boosters only if you run Dungeons. I found no 2025-10+ text source naming specific light-spender bundles. The 2025-12-12 "Gem shop and Bundle tier list" post is an image that could not be read (L).

  **Per class:** The order is the same for every class. The only exception is that Divine Knight colosseum gem farming is a guide-sheet gem *source* (Stale).

- **Common mistakes (and how to detect them from the save):**
  - **Banked gems with nothing bought.** Detect: `account.currencies.gems ≥ next-priority price` while `gemShopPurchases[103] == 0` (no Hammer), or `[63] < 4`.
  - **Spending on F-tier items.** Purchases persist only for capped items. Consumables are not traceable after use, so detect this from inventory (candies, card packs) or from tracking the gem balance over time.
  - **Skipping liquid cauldrons in W2.** Detect: `account.finishedWorlds.World1` true and `gemShopPurchases[106] == 0`.
  - **Reaching W3 without the Printer while gems exceed 875.** Detect: `[111] == 0`.
  - **Leaving free claims.** The Limited Specials freebie is untracked except through slot 87. Unclaimed Pet Mart days cannot be seen in Toolbox fields (`OptionsListAccount[516]` holds the last claim day per N.js, M).
  - **Talent resets bought "just in case".** They restock weekly, so there is never a reason to stockpile them.
- **Save and Toolbox fields:**
  - `GemItemsPurchased` (raw, JSON list) → `account.gemShopPurchases[idx]` (TB `parsers/index.ts#L162`, `parsers/gemShop.ts#L4-L10`).
  - `GemsOwned` → `account.currencies.gems` (TB `parsers/index.ts#L325`).
  - `GemsPacksPurchased`, `BundlesReceived` → `account.bundles` and `account.bundlesOwned` (TB `parsers/misc.ts#L621`).
  - `ServerGems` / `ServerGemsReceived` hold purchased gems pending or credited (N.js `SERVER_GEM_TOTAL` @15045456).
  - Server vars: `account.serverVars.GemPM_x` (Pet Mart multiplier), `GemBundleOffer*`.
  - Toolbox reads specific indices: 58 carry, 104 brimstone, 106 bleach, 109 storage, 110 sigil, 113 books, 118 flaggies, 119/125 breeding, 120 kitchens, 123 tubes.
  - Achievements: `account.achievements`. Task unlocks: `account.tasks[3]`.

### Sources

- Game data (v1.23, 2026-10-17): N.js `https://www.legendsofidleon.com/ytGl5oc/N.js`: gem shop array @14094509 (Limited Specials @14107596, Bottled Wind @14095726), `GemsOwned` grants @5450807/@5451167/@15139173 (social), @10973869 (Pet Mart), @9637332–9646344 (Arcade), @7269358 (Task unlocks), @14800281 (Merit world-boss gems), @14090406 (Liquid Shop), save write @6473483.
- Toolbox `6827d3f`: `TB/data/website-data/gemShop.json`, `TB/parsers/gemShop.ts#L4`, `TB/parsers/index.ts#L162`, `#L325`, `TB/parsers/misc.ts#L318`, `#L621`, `#L700`, `TB/parsers/world-1/forge.ts#L98`, `TB/parsers/world-2/alchemy.ts#L155`, `TB/parsers/world-3/construction.ts#L110`, `TB/parsers/world-4/cooking.ts#L758`, `TB/parsers/world-4/lab.ts#L85`, `TB/utility/dashboard/account.js#L452`, `TB/data/website-data/{achievements,quests,taskUnlocks}.json`.
- Wiki (via api.php, read 2026-10-17): https://idleon.wiki/wiki/Gem_Shop (last edit 2026-10-14; the Limited Specials section was last edited 2026-09-24 and is **Stale** for v1.23), https://idleon.wiki/wiki/Gems, https://idleon.wiki/wiki/Achievements, https://idleon.wiki/wiki/Daily_Checklist, https://idleon.wiki/wiki/Arcade, https://idleon.wiki/wiki/Changelog_2026 (v1.07 2026-03-06 Pet Mart gems and popups; v1.22 2026-09-19 Limited section). There is no v1.23 changelog on the wiki yet.
- Community:
  - "IdleOn Guide Sheet", Gems tab (dated 2023-07-25, Stale): https://docs.google.com/spreadsheets/d/e/2PACX-1vSCepYAs6sNDP4iq6MJNAG1pvFXzfC_3IQ7ttt5vfEEKAgQhIk4cQqnLRyeH6UyqDSuP4R-6WQeDmmP/pubhtml (gid 156750172).
  - Reddit r/idleon:
    - https://www.reddit.com/r/idleon/comments/1wgpxqv (2026-09-15, Discord tier list image and comments)
    - https://www.reddit.com/r/idleon/comments/1qmxivm (2026-01-25)
    - https://www.reddit.com/r/idleon/comments/1qg1tn5 (2026-01-18, cauldron debate)
    - https://www.reddit.com/r/idleon/comments/1pkw560 (2025-12-12, image not legible)
    - https://www.reddit.com/r/idleon/comments/1wxi25u (2026-10-04, limited specials question)
  - Treyex tier list (L): https://www.treyexgaming.com/idleon-gem-shop-tier-list/ (posted 2025-11-12).
- Saves (aggregate only): `fixtures/private/yasser.parsed.json` (W2) and `joseph.parsed.json` (W3).
