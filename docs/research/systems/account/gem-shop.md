# Gem Shop (dossier, M26)

Verified 2026-10-19. Game version 2.3.540 (wiki/community label "v1.23 Lumi Menagerie"). Toolbox pin `6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1`.

Abbreviations used in Sources (all tier-1 unless marked):
- `GS` = `packages/toolbox-parsers/vendor/data/website-data/gemShop.json` (Toolbox game data, 2.3.540).
- `TP/<file>` = `packages/toolbox-parsers/vendor/parsers/<file>`.
- `N.js@<offset>` = the game client script `https://www.legendsofidleon.com/ytGl5oc/N.js`, character offset in the copy read 2026-10-19 (26,391,628 bytes). It is game code, so tier 1.
- `Prior` = `origin/research/account-wide:docs/research/systems/account-wide/gem-shop.md` (research 2026-10-17). Prior's community links (Reddit, Treyex, Guide Sheet) were NOT re-fetched this run (Reddit blocks the fetch tool; the web-search budget was exhausted); they are carried forward and flagged "carried".

## Gem Shop

- **What it is:** The premium account-wide shop. Gems buy permanent upgrades (the Bonuses tab, by world), capacity expansions, daily and weekly restocking consumables, gacha packs, and a rotating Limited Specials row. [C1] The save holds one flat array, `GemItemsPurchased`, indexed by each item's `globalIndex`; the price of the next copy is `round(purchased[idx] * costIncrement + cost)`. [C2]
- **Unlocks:** No world gate on buying; many items only act once their system exists (Sigil Supercharge needs W4, Conjuror Pts need Cosmo rescued, Parallel Villagers / Resource Boost need W5 Caverns). [C3]
- **Scope:** Almost everything is account-wide (backpack, storage, carry cap, food slot, card slots/presets, teleports, minigame plays, all Bonuses). Per-character items are talent/star/class resets, Subclass Swap, Pandoras Box, equipment (kill rings, nametags), and Time Candy (applied to one character). [C4]
- **Inputs -> outputs:** Gems in; permanent multipliers, slots and unlocks out. **Disputed (C5):** the Gem Shop is the main gem sink but not the only one. Source lens: N.js has other `GemsOwned` decrements (-400 at @4299642; -600/-1200/-1800/-3500 at @11763682-11764758, which add 2/5/10/20 to OLA[325]); gamedata lens did not test it. Unspent gems are still idle value for shop purposes. See M14. [C5, conf M]
- **Feeds / fed by:**
  - Feeds Anvil (Infinity Hammer), Forge (Brimstone), Alchemy (Ivory/Bleach cauldrons, Sigils), Cards (slots, presets, packs), Storage/Carry, Food, Obols, 3D Printer, Construction (towers, cogs, flaggies), Prayers, Talent Book Library, Cooking (Richelin), Breeding, Lab (tubes), Arcade, Dungeons, Post Office.
  - Fed by quests, Task Unlocks, Steam achievements, social links, Pet Mart daily claim, Liquid Shop, daily bosses, Merit-gated world-boss drops, Arcade, Post Office, events and real-money packs (see Free gem sources).

### Mechanics catalogue

Price rule for every row: `price_n = cost + costIncrement * n` for the (n+1)-th buy (n = current count); total = `cost*max + inc*max*(max-1)/2` [C2]. Field for all rows: `account.gemShopPurchases[idx]` (TP/gemShop.ts#L4-L10, TP/index.ts#L165, `GemItemsPurchased` raw save key). Balance: `account.currencies.gems` from `GemsOwned` (TP/index.ts#L328).

**M1. Purchase counter and price formula.** Counter persists per index; price as above; buying checks `GemsOwned >= price`, then subtracts and increments. [C2]

**M2. Daily restock.** At the daily reset the game zeroes counters 47, 48, 49, 50 (Time Candies), 54 (Cosmic Candy), 127 (Miracle Chest), 128 (Bottled Wind), 132 (Gaming Fertilizer), 136 (Pristine Charm), 138 (Sand of Time), 140 (Life Refill), 150 (Compost Bag), 151 (Summoner Stone), 13 (Stamina Battery). [C6] So for these the array holds "bought today", not lifetime.

**M3. Weekly restock.** At the weekly reset the game zeroes 73 (Regular Talent Reset), 74 (Star Talent Reset), 76 (Pandoras Box), 121 (Console Chip), 122 (Mainframe Jewel), 134 (Ancient Artifact). [C7] Subclass Swap (75) is zeroed by one-off migrations on certain updates, not a schedule. [C8]

**M4. Limited Specials (87-94).** Eight slots reused each rotation; a non-zero count means a slot was bought in some rotation, not which item. [C9] Current lineup (2.3.540): Stamina Battery 1 gem x2, Timeless Nametag 2,950 x1, Research Papers 270 x50, Diamond Horns 3,000 x1, W3/W4/W5/W6 Kill Rings 590/685/810/925 x6 each (1.30x kill credit for portal opening in that world). [C10] The wiki now lists the same lineup (updated since the prior run, which found it stale). [C11] 1-gem "freebie" specials recur (Edible Coins, Summer Cooler, Helpful Pocketwatch, Freebie, Stamina Battery). [C12]

**M5. Inventory and storage (usables).**
- Item Backpack Space idx 55: 200 +25, max 6 (1,575): +4 slots per buy, sets `InvBagsUsed` 20-25 to 4. [C13]
- Storage Chest Space idx 56: 175 +25, max 12 (3,750): +9 chest slots each. [C14]
- More Storage Space idx 109: 450 +12, max 10 (5,040): +9 slots each; `ChestSlotsOwned += 9*N[109]`. Toolbox reads this at TP/storage.ts#L88-L89. [C15]
- Carry Capacity idx 58: 150 +25, max 10 (2,625): each buy `x(1 + 0.25*N)` on every material/item cap, additive among buys, multiplicative with stamps/star signs. Toolbox TP/misc.ts#L703 and #L1186. Max = 3.5x. [C16]
- Food Slot idx 59: 450 +300, max 2 (1,200): `FoodSlotsOwned = 2 + N[59] + floor(Tasks[2][2][0]/2)` (Merit). Max from gems 4 slots. [C17]
- Card Presets idx 66: 250 +160, max 5 (2,850): preset count `2 + N[66]`. [C18]
- Extra Card Slot idx 63: 150 +40, max 4 (840; prices 150/190/230/270): card slots per character `4 + N[63]`. [C19]
- Obol Storage Space idx 57: 125, max 12 (1,500): obol circle slots `5 + ceil(saltLick/4) + N[57]`, with square/hexagon/sparkle every 2nd/3rd buy. [C20]

**M6. Dailies and resets.**
- Daily Teleports idx 71: 120 +40, max 10 (3,000): daily grant is `+13*N`, with a banked-teleport cap `100 + 160*N` (max 1,700). Cap/gain is `cap/(13N) = 12.3 + 7.7/N` days, so about 20 days at N=1 and about 13 days at N=10 (source lens verified the formula at N.js@15117000; gamedata lens cannot confirm it because N.js is not vendored and the item text says 6 days claimable). The wiki/prior figure of 6 days disagrees. [C21, conf M]
- Daily Minigame Plays idx 72: 150 +50, max 4 (900): `15 + 4*N[72]` minigame plays (OptionsListAccount push at account init). [C22]
- Regular Talent Reset idx 73: 200, max 10; Star Talent Reset idx 74: 300, max 3; Pandoras Office Box idx 76: 250, max 1; all weekly restock (M3). [C23]
- Subclass Swap Token idx 75: 500 +250, max 2 (1,250). [C24]
- Complete Class Redo idx 78: 999, max 1; sets one character back to Lv 1 Beginner. [C25]
- Weekly Dungeon Boosters idx 84: 275 +40, max 11 (5,225). Game code adds `(8 + 2*N[84]) * min(2, ceil(-OLA[39]/7))` to OptionsListAccount[76] at the weekly roll, while the item text says "+3 runs per week, 12 free". The two disagree. [C26]

**M7. Time Candy and skips.** Just One Please idx 47 (40, 1h), Baby's First Lolly 48 (80; 34% 1h/33% 2h/33% 4h), Kid in a Candy Store 49 (150; 50% 2h/25% 4h/18% 12h/7% 24h), Absolute Sugar Maniac 50 (270; 33% 4h/40% 12h/22% 24h/4% 72h), each max 4 per day; Cosmic Candy idx 54 (325, effectively unlimited, mean 24h, up to 500h, daily restock). [C27] Mean AFK hours per gem (derived from the stated odds): about 0.025 / 0.029 / 0.039 / 0.053 for the four fixed tiers, so Sugar Maniac (0.053) is the best fixed tier; Cosmic Candy (mean 24h / 325 = 0.074 h/gem) is better overall but is not a fixed tier. [C28, conf M]

**M8. Gacha and consumables.** Card packs: Newbie 64 (200), Ancient 65 (425), Eternal 65 (600), Galaxy 69 (650), Smolderin 61 (690), Spirit 70 (720); 4 Star Cardifier 67 (325); Arcade balls Smol 79 (100 = 30), Med 80 (275 = 100), Biggy 81 (1,250 = 500); Keychains T1/T2/T3 86/85/83 (150/325/490 = 40/120/300 fragments); Quality Obol Stack 107 (250), Marvelous Obol Stack 108 (550). [C29] Quality stack: 70% silver / 30% gold, 1 gold guaranteed; Marvelous: 65% gold / 25% platinum / 10% dementia, 1 platinum+ guaranteed. [C30]

**M9. World 1-2 Bonuses.**
- Infinity Hammer idx 103: 300, max 1: two anvil productions at once; stacks with other +1 hammer sources. [C31]
- Brimstone Forge Slot idx 104: 100 each, max 16 (1,600): per slot smelt +50% faster and +50% multi-bar chance, multiplying with forge upgrades. Toolbox reads it at TP/world-1/forge.ts#L101. [C32]
- Ivory Bubble Cauldrons idx 105: 300, max 4 (1,200): +2 assignable players, 1.5x brew speed, 1.5x new-bubble chance per cauldron. [C33]
- Bleach Liquid Cauldrons idx 106: 250, max 4 (1,000), must be bought in order: +1 player, 1.5x liquid cap and regen. Toolbox: `bleachLiquidCauldron > cauldronIndex` gives bonus `0.5 + saltLick/100` (TP/world-2/alchemy.ts#L158-L166). [C34]
- Sigil Supercharge idx 110: 140, max 10 (1,400): +20% sigil EXP per buy (TP/world-2/alchemy.ts#L879-L895); sigils only level from W4. [C35]

**M10. World 3 Bonuses.**
- Crystal 3D Printer idx 111: 875, max 1: big-slot count `1 + N[111]` (second printer chamber on all characters). The game once refunded 375 gems to owners at a price change (migration), so the price has moved before. [C36]
- More Sample Spaces idx 112: 250 +40, max 6 (2,100): sample slots `4 + N[112]`. [C37]
- Burning Bad Books idx 113: 250 +75, max 4 (1,450): min Talent Book level `101 + 5*N + bribe + atom` (TP/misc.ts#L318-L322). [C38]
- Prayer Slots idx 114: 250 +75, max 4 (1,450): equipped-prayer count `+N[114]` on all characters. [C39]
- Zen Cogs idx 115: 500 +125, max 8 (7,500): premium Yin/Yang cogs in the cog board. [C40]
- Cog Inventory Space idx 116: 100 +40, max 20 (9,600): `min(120, 23 + bribe + vials + 4*N[116])` cog inventory slots. [C41]
- Tower Building Slots idx 117: 350 +100, max 4 (2,000): `TowerBuildSlots = 2 + N[117] + ceil(Tasks[2][2][0]/2)`; each slot builds at the full rate. [C42]
- Fluorescent Flaggies idx 118: 250 +75, max 6 (2,625): flaggy rate `1 + 0.5*N` (TP/world-3/construction.ts#L113-L114). [C43]

**M11. World 4 Bonuses.**
- Royal Egg Cap idx 119: 350 +50, max 5 (2,250): egg capacity `3 + upgrade + N[119] + Merit`, cap 15; new-mob breed chance `x(1 + 0.10*N)`, additive per buy in code even though the item text says 1.10x per buy (TP/world-4/breeding.ts#L184, #L288-L296). [C44]
- Richelin Kitchen idx 120: 250 +40, max 10 (4,300): kitchens `0..N-1` are Richelin (`kitchenIndex < N[120]`, a flat `+2` in the kitchen speed formula; text: 3x meal speed, 2x new-recipe speed, 40% cheaper) (TP/world-4/cooking.ts#L761-L764). [C45]
- Console Chip idx 121: 385, max 7 per week, random lab chip among 22. Mainframe Jewel idx 122: 450, max 2 per week, random unowned jewel. [C46]
- Souped Up Tube idx 123: 480 +65, max 5 (3,050): `2*N` souped tubes (2x lab EXP, +30% line width) (TP/world-4/lab.ts#L88). [C47]
- Mob Storage idx 124: 325 +55, max 12 (7,530): 12 pet-storage slots per buy. [C48]
- Fenceyard Space idx 125: 275 +45, max 6 (2,325): `fenceSlots = 5 + base + 2*N[125]` (TP/world-4/breeding.ts#L75). [C49]
- New Meal idx 126: 250, repeatable: unlock a meal otherwise gained from spices. [C50]

**M12. Armor Smithy gate (gem-linked).** The Smithy's "PermaUnlockAfford" is true when `ServerGemsReceived + 1500*(bun_c bundle) >= 2000` or the account is 30 days old. Real-money gems count, shop spending does not. (TP/world-3/armorSmithy.ts#L55). [C51]

**M13. Real-money gems and packs.** `ServerGems` / `ServerGemsReceived` hold purchased gems. **Disputed (C52):** the earlier claim that 4,000 purchased gems disables daily pack popups is not supported; the cited N.js@8093 is the loader preamble. The only confirmed behaviour (N.js@6355231-6355394) is that `ServerGemsReceived > 3999` resets account flag OLA[26] and calls cleanMarkedFiles; state 4 is the Ban_ path. Gamedata lens: field names verified, popup rule unverifiable. [C52, conf L] Bundles are tracked in `GemsPacksPurchased` / `BundlesReceived` -> `account.bundles` (TP/misc.ts#L621-L653). [C52b, conf H] Pack ratios: Mountain of Gems 200 gems/USD. **Disputed (C53):** the prior range 210-278 gems/USD excludes wiki rows (Valenslime Day Pack 300, Lil Squirrel 250, Sacred Methods 275, Supernova 216.67); special packs span at least 250-300 gems/USD. [C53, conf M]

**M14. Missed mechanics added this revision.**
- Past Limited Specials that matter for W1-4 (slots 87-94 are reused; `past_limited_specials` rows, GS): Dragonic Cauldron (slot 93, 969 gems, 2x liquid cap on liquid cauldrons, W2); Equinox Penguins (765, max 3, +10% Equinox bar fill each, W3); 5-Star Cardifier (486 x10) and 6-Star Cardifier (880 x6); Exalted Stamps (1,100); Elite Class Swap (900); Hyper Obols (Circle 425, Square 625); Cosmic Time Candy (395) and `72_HOUR_CANDY_MAYBE` (170); Cosmic Balls (790); Emerald Bling Pendant and stat hats. Cosmic Candy is permanent at 325 (idx 54) and also a past special at 395. Arcane Rock restocks daily. [C92, conf H for prices, M for effects]
- Premium equipment (Time_Skips/Premium_Stones sections, GS): Premium Stones STR/AGI/WIS 200 and LUK 175 (idx 95-98); Hat Premiumifier 250 (100), Premium Hat Swapper 25 (101), Premium Stone Refund 30 (102). [C93, conf H]
- Chat rings idx 24-31 (250-2,500 gems, GS `etc` section). [C94, conf H]
- Premium consumables with daily or limited stock: idx 128 (240), 132 (290), 138 (110), 150 (295), 151 (95), 13 (595); Miracle Chest idx 127 (275, daily) and Life Refill idx 140 (60 +9, daily) and weekly Ancient Artifact idx 134 (690) are only covered by the reset lists in M2/M3. [C95, conf H]
- Obol Storage Space text says +4 slots, but code adds per-shape slots on a 1st/2nd/3rd-buy cadence (see C20). [C96, conf M]
- Bundle interactions: bundles `bon_a`, `bon_w`, `bon_x`, `bon_y` feed carry capacity and storage (TP/misc.ts, TP/storage.ts); `bun_c` unlocks the Armor Smithy (see M12). [C97, conf H]
- Non-shop gem sinks: a 400-gem unlock (N.js@4299642) and 600/1,200/1,800/3,500 tiers adding 2/5/10/20 to OLA[325] (N.js@11763682-11764758). [C98, conf M]
- `ServerGemsReceived > 3999` resets OLA[26] (see M13). [C99, conf M]
- W5-W7 permanent items live in the same array: Davey Jones, Snehebatu Link, Chest Sluggo, Gallery Showcases, Legend Talent Pts and others (see W5+ line). Many N.js-derived formulas (resets, teleport bank, slot counts) are not in the vendored data and are unverifiable from data alone.

**W5+ extensions (one line each; indices read by Toolbox).** Caverns 0-5 (2h Lantern 160/day, Parallel Villagers 780 x5, Resource Boost 420 +15 x10 giving `1 + N/2` on Well/Harp, Conjuror Pts 330 +15 x12, Opal 250 x60 at 4/day); Davey Jones Training idx 8; Snehebatu Link idx 9 (950 once); Novelty Jade Coins idx 10; King of All Winners idx 11 (+10% winner bonuses); Premium time skips 128/132/138/150/151/13; Miracle Chest 127; Chest Sluggo 129; Divinity Sparkie 130 (+25% div pts/EXP); Golden Sprinkler 131; Lava Sprouts 133; Ancient Artifact 134; Plot of Land 135; Pristine Charm 136; Shroom Familiar 137 (1.4x essence); Instagrow 139; Life Refill 140; W7 items 40-45 (Gallery Showcases, More Coral, Legend Talent Pts, Super Auto Mode, Bling Bags, Professional Papers). [C54] Note: Toolbox in this pin reads Parallel Villagers from `Holes[23]` (`parallelVillagersGemShop`), not `gemShopPurchases[1]`. [C55]

### Free gem sources

- **Quests:** 50 reward rows pay 644 gems in total (Scripticus 150, Postboy Pablob 75, Cactolyte 50, Desert Davey 50, Snake Jar 36, Loominadi 33, Centurion 30...). [C56]
- **Achievements:** 1,285 gems across the non-filler rows of `achievements.json`, every one flagged `steamExclusive`. [C57]
- **Task Unlocks:** one-time gem rewards, W1 160, W2 440, W3 240, W4 95 (W5 70, W6 140, W7 40), recomputed from `taskUnlocks.json` by the gamedata lens. [C58]
- **Social links:** Discord 50, Twitch 50, YouTube 60, one time. Two +50 grants are corroborated at N.js@5450842 and @5451202; the YouTube 60 is unverified. [C59]
- **Pet Mart daily claim:** with `r` the shop-day seed value in [0,1): `gems = min(500, min(150, max(10, 10 + floor(130*r^10) + 10*r)) * GemPM_x)`, rounded; mean about 26 at `GemPM_x = 1`. Last claimed day is `OptionsListAccount[516]`. [C60]
- **Alchemy Liquid Shop:** "One Measly Gem" (1) and "A Pair of Gems" (2), daily, price rises per buy (Prior, carried, M). [C61]
- **Daily bosses / drops:** **Disputed (C62):** the earlier numbers (world boss about 3%, chests 5-80%, Guild Giftbox 25 or 69 gems) do not match the wiki Gems page, which lists chests at 30-45%, Guild Giftbox 12.8% down to 2.6%, four Post Office routes, and different boss-rate wording. King Doot 5 gems at 75% and event boxes about 19% are unverified. The page tables must be re-extracted before ActiveOn quotes any rate. [C62, conf L]
- **Arcade balls:** 1, 4, 16, 50, 250 and a 2,000 jackpot per ball (Prior, N.js, carried). [C63]
- **Stale estimate:** the 2023 Guide Sheet puts a min-maxer at about 429 free gems a week, up to 877 (carried, L). [C64]

### Goals and Milestones

| Milestone | Gems | Why |
|---|---|---|
| Infinity Hammer | 300 | 2x anvil throughput from day 1 |
| Extra Card Slot 1-4 | 150/190/230/270 | +1 card slot per buy, all characters |
| Carry Capacity 1-3 | 150/175/200 | +25% all caps each |
| Food Slot 1 / 2 | 450 / 750 | permanent food slots |
| Bleach Cauldron 1-4 | 250 each | liquid cap and regen |
| Ivory Cauldron 1-4 | 300 each | bubble speed, new-bubble chance |
| Crystal 3D Printer | 875 | second printer chamber |
| Tower Building Slot 1-4 | 350/450/550/650 | parallel builds |
| Richelin Kitchen 1-n | 250 + 40n | W4 cooking |

### Per-session actions

1. Claim any 1-gem Limited Specials freebie. 2. Claim the Pet Mart gems daily. 3. Buy the Liquid Shop gem lines. 4. Do the Spiketrap minigame and Picnic Stowaway daily. 5. If `gems >= price(next Spend Plan item)`, buy it. **Idle state:** gems at or above the next planned price with the item not bought, or a restock item whose counter is below max at the daily/weekly reset (M2, M3) while its effect is wanted. [C65]

### AFK Setup implications

Carry Capacity and storage raise every skilling AFK cap; Food Slots add buff slots for long AFKs; Card slots/presets make per-activity card swaps cheap; Brimstone slots and the Hammer let forging and smithing AFK longer; Daily Teleports cut active travel. [C66]

### Min-max by stage

Community meta is thin and partly contested; sources are tier 3 unless marked and are carried from Prior (not re-fetched).

- **W1 early:** Infinity Hammer first is the common first buy (AutoReview S tier, Discord list S+). [C67] Counter-view (r/idleon 2026-10-04): Extra Card Slots and the 3D Printer first, the hammer "no longer necessary". Confidence M, contested. [C68] Then Extra Card Slot 1-2 and Carry Capacity 1-3. [C69]
- **W1 mid:** Card Slot 3-4, Storage Chest Space as pressure builds, Brimstone slots only if bars bottleneck (B on the Discord list, S+ on the Treyex list; contested, L). [C70] Banked-gem alert: gems >= 300 with `purchased[103] == 0`. [C71]
- **W1 late / W2 entry:** Bleach Liquid Cauldrons 1-4 then Ivory Cauldrons; the community splits on which colour first (one camp: both S early; other: liquid S, coloured high-A) (r/idleon 2026-01-18). [C72] "The W1 cauldron upgrades are all S tier" (r/idleon 2026-09-15). [C73] Food Slot 1.
- **W2 mid/late:** Complete the cauldrons, Food Slot 1 then 2, Storage, Sigil Supercharge is C (waits on W4). [C74] Detect: `finishedWorlds.World1` and `purchased[106] == 0`. [C75]
- **W3 early:** Crystal 3D Printer (875): both sides of the first-buy debate agree once you hold the hammer or reach W3 (r/idleon 2026-07-06). [C76] Save for it before touching other W3 items; Tower Building Slot 1-2 next (Discord S). [C77]
- **W3 late:** Tower Slots 3-4, More Sample Spaces 1-2 (B), Zen Cogs and Flaggies only after (S and B). Burning Bad Books is "useless" if you use the max-book setup (r/idleon 2026-09-15). [C78] Prayer Slots rated F on the Discord list; buy only for a specific third-prayer build. [C79]
- **W4:** Richelin Kitchens 1-3 (250/290/330), Royal Egg Cap optional (C), Souped Up Tube contested (D on Discord, S+ on Treyex, L); wait on Mob Storage, Fenceyard, Console Chip (B), Mainframe Jewel (B). [C80]
- **Never for progress:** Time Candy, card packs, obol stacks, arcade balls, keychains, resets (F or D on every list); resets restock weekly so never stockpile. [C81]
- **Light spender:** pack value first (rotating special packs, then Starter/Auto-Loot); same Spend Plan order but pull forward Food Slot 2, all Ivory Cauldrons and 4+ Brimstone slots (Prior synthesis, M). [C82]
- **Discord tier list (S+ then S):** S+ Infinity Hammer, 3D Printer, Extra Card Slot, Carry Capacity, King of All Winners; S Storage Chest, Food Slot, Tower Slots, Zen Cogs, Bleach cauldrons (r/idleon 2026-01-25 and 2026-09-15; icon mapping by Prior, M). [C83]
- **Per class:** the order is the same for every class. [C84]

### Common mistakes

Banked gems with nothing bought (a real W2 test account had gems and all 300 slots at 0); buying F-tier consumables; skipping Bleach cauldrons in W2; reaching W3 with 875+ gems and no printer (`purchased[111] == 0`); missing 1-gem freebies and the Pet Mart claim; stockpiling talent resets; buying coloured vs liquid cauldrons out of order (Bleach must be in order). [C85]

### Save and Toolbox fields

- `GemItemsPurchased` -> `account.gemShopPurchases[idx]` (TP/gemShop.ts#L4-L10, TP/index.ts#L165; ActiveOn alias `account.gemPurchases`, `packages/account-state/src/unspent-fields.ts#L21`). [C86]
- `GemsOwned` -> `account.currencies.gems` (TP/index.ts#L328). `ServerGemsReceived` is read at TP/world-3/armorSmithy.ts#L55. Pet Mart server var `GemPM_x` (TP/generated-firebase-types.ts#L851), Pet Mart shop day in `TP/world-7/tournament.ts#L141-L146`. [C87]
- Toolbox-consumed indices: 58 carry, 104 brimstone, 106 bleach, 109 storage, 110 sigil, 113 books, 118 flaggies, 119 and 125 breeding, 120 kitchens, 123 tubes, plus W5+ 2, 5, 8, 9, 11, 40-45, 129-131, 133, 135-139 (Toolbox also reads 130 in character.ts). [C88]
- Indices Toolbox does **not** read (the game does): 55, 56, 57, 59, 63, 66, 71, 72, 84, 103, 105, 111, 112, 114-117, 121-122, 124 (grep-confirmed). ActiveOn must compute their effects itself. [C89]
- ActiveOn today: three `gem-shop/unspent` Checks (contested, printer-progress, printer-buy) in `packages/knowledge/systems/gem-shop.yaml`, detector `packages/knowledge/detectors/gem-shop/unspent.ts`, Pet Mart claim detector `pets/mart-gems.ts`; no Gem Shop page and no buy-order (coverage audit row 156, task 1.7). [C90]

### Sprite needs

`item-gem` exists (`apps/activeon/src/art/sprites/grids/items.ts#L204`). A Gem Shop page wants new small sprites for: Infinity Hammer, Brimstone slot, Ivory and Bleach cauldrons, Crystal 3D Printer, card slot, carry capacity bag, food slot, Tower slot, Richelin kitchen, Time Candy, Pet Mart claim. [C91]

### Sources

Tier 1: `GS`, `TP/*` files above, N.js offsets cited per claim. Tier 2: https://idleon.wiki/wiki/Gem_Shop and https://idleon.wiki/wiki/Gems (read 2026-10-19). Tier 3 (carried from Prior, 2026-10-17): r/idleon 1wgpxqv (2026-09-15), 1qmxivm (2026-01-25), 1qg1tn5 (2026-01-18), 1wxi25u (2026-10-04), 1uopts0 (2026-07-06); Treyex https://www.treyexgaming.com/idleon-gem-shop-tier-list/ (2025-11-12, L); IdleOn Guide Sheet Gems tab (2023-07-25, stale).

### Open questions

- Dungeon Boosters: code `8 + 2N` vs item text `+3 / 12 free`. [OQ1]
- Daily Teleports bank: code gives about 13-20 days (N=10 to N=1), wiki says 6. [OQ2]
- (Resolved) `taskUnlocks` W1-W4 total 935 recomputed OK. Open: wiki Gems page drop rates need re-extraction. [OQ3]
- World boss gem drop rate: wiki 3% / 1 per 150 fights vs Prior "+7% per Merit buy, 8 max". [OQ4]
- Which first buy: Hammer vs Card Slots/Printer; need a sourced simulation of value per gem. [OQ5]


### Claim register (source per claim)

- [C1] tier 1, verified 2026-10-19: N.js@23047054 (purchase handler); GS (vendor data, 2.3.540) Confidence H.
- [C2] tier 1, verified 2026-10-19: N.js@23047054 (purchase handler); GS (vendor data, 2.3.540) Confidence H.
- [C3] tier 1, verified 2026-10-19: GS item descs (Sigil Supercharge, Conjuror Pts, Parallel Villagers) Confidence H.
- [C4] tier 1, verified 2026-10-19: GS descs; idleon.wiki/wiki/Gem_Shop (Dailies note, carried) Confidence M.
- [C5] tier 1, verified 2026-10-19: N.js@23047054 (purchase handler); GS (vendor data, 2.3.540) Confidence L. **Disputed (source lens: other sinks exist).**
- [C6] tier 1, verified 2026-10-19: N.js@15117507-15118205 (daily reset block) Confidence H.
- [C7] tier 1, verified 2026-10-19: N.js@15128444-15128550 (weekly reset block) Confidence H.
- [C8] tier 1, verified 2026-10-19: N.js@6340332, 6345097, 6355561 (DoOnceREAL migrations zero idx 75) Confidence H.
- [C9] tier 1, verified 2026-10-19: GS usables.Limited_Specials (idx 87-94); GS past_limited_specials (reuse of slots) Confidence H.
- [C10] tier 1, verified 2026-10-19: GS usables.Limited_Specials (idx 87-94); GS past_limited_specials (reuse of slots) Confidence H.
- [C11] tier 2, verified 2026-10-19: https://idleon.wiki/wiki/Gem_Shop fetched 2026-10-19 Confidence H.
- [C12] tier 1, verified 2026-10-19: GS past_limited_specials (firstSeen/lastSeen 2.3.43-2.3.523, cost 1) Confidence H.
- [C13] tier 1, verified 2026-10-19: GS idx55; N.js@19847805 Confidence H.
- [C14] tier 1, verified 2026-10-19: GS idx56 Confidence H.
- [C15] tier 1, verified 2026-10-19: GS idx109; N.js@8199509; TP/storage.ts#L88-L89 Confidence H.
- [C16] tier 1, verified 2026-10-19: GS idx58; N.js@4130182; TP/misc.ts#L703, #L1186 Confidence H.
- [C17] tier 1, verified 2026-10-19: GS idx59; N.js@15245505 Confidence M.
- [C18] tier 1, verified 2026-10-19: GS idx66; N.js@7495925 Confidence M.
- [C19] tier 1, verified 2026-10-19: GS idx63; N.js@7486834 Confidence M.
- [C20] tier 1, verified 2026-10-19: GS idx57; N.js@15238518 Confidence M.
- [C21] tier 1, verified 2026-10-19: GS idx71; N.js@15117000-15117500 (WorldTeleports min(cur+13N, 100+160N)); wiki/prior say 6 days Confidence M.
- [C22] tier 1, verified 2026-10-19: GS idx72; N.js@6184096 Confidence M.
- [C23] tier 1, verified 2026-10-19: GS idx73,74,76; N.js@15128444 Confidence H.
- [C24] tier 1, verified 2026-10-19: GS idx75 Confidence H.
- [C25] tier 1, verified 2026-10-19: GS idx78 Confidence H.
- [C26] tier 1, verified 2026-10-19: N.js@15127000 (OLA[76] += (8+2N[84])*min(2,ceil(-OLA[39]/7))) vs GS idx84 desc Confidence M.
- [C27] tier 1, verified 2026-10-19: GS idx47-50, 54 (odds in desc; ratios derived) Confidence H.
- [C28] tier 1, verified 2026-10-19: GS idx47-50, 54 (odds in desc; ratios derived) Confidence M.
- [C29] tier 1, verified 2026-10-19: GS usables.Cards/Goods_&_Services, bonuses idx107-108 Confidence H.
- [C30] tier 1, verified 2026-10-19: GS usables.Cards/Goods_&_Services, bonuses idx107-108 Confidence H.
- [C31] tier 1, verified 2026-10-19: GS idx103 Confidence H.
- [C32] tier 1, verified 2026-10-19: GS idx104; TP/world-1/forge.ts#L101 Confidence H.
- [C33] tier 1, verified 2026-10-19: GS idx105 Confidence H.
- [C34] tier 1, verified 2026-10-19: GS idx106; TP/world-2/alchemy.ts#L158-L166 Confidence H.
- [C35] tier 1, verified 2026-10-19: GS idx110; TP/world-2/alchemy.ts#L879-L895 Confidence H.
- [C36] tier 1, verified 2026-10-19: GS idx111; N.js@7816657 (PrinterBigSlots 1+N[111]); N.js@6350164 (375-gem refund migration) Confidence M.
- [C37] tier 1, verified 2026-10-19: GS idx112; N.js@7816657 Confidence M.
- [C38] tier 1, verified 2026-10-19: GS idx113; TP/misc.ts#L318-L322 Confidence H.
- [C39] tier 1, verified 2026-10-19: GS idx114; N.js@7733424 Confidence M.
- [C40] tier 1, verified 2026-10-19: GS idx115; N.js@23127191 Confidence M.
- [C41] tier 1, verified 2026-10-19: GS idx116; N.js@7795385 Confidence M.
- [C42] tier 1, verified 2026-10-19: GS idx117; N.js@7815716 Confidence M.
- [C43] tier 1, verified 2026-10-19: GS idx118; TP/world-3/construction.ts#L113-L114 Confidence H.
- [C44] tier 1, verified 2026-10-19: GS idx119; TP/world-4/breeding.ts#L184, #L288-L296 Confidence H.
- [C45] tier 1, verified 2026-10-19: GS idx120; TP/world-4/cooking.ts#L761-L764 Confidence H.
- [C46] tier 1, verified 2026-10-19: GS idx121-122; N.js@15128444 (weekly zero) Confidence M.
- [C47] tier 1, verified 2026-10-19: GS idx123; TP/world-4/lab.ts#L88 Confidence H.
- [C48] tier 1, verified 2026-10-19: GS idx124 Confidence M.
- [C49] tier 1, verified 2026-10-19: GS idx125; TP/world-4/breeding.ts#L75 Confidence H.
- [C50] tier 1, verified 2026-10-19: GS idx126 Confidence M.
- [C51] tier 1, verified 2026-10-19: TP/world-3/armorSmithy.ts#L55 Confidence H.
- [C52] tier 1, verified 2026-10-19: N.js@8093 (4000-gem popup text); TP/misc.ts#L621-L653 (bundles); Prior Confidence L. **Disputed (source lens: popup claim unsupported; only OLA[26] reset).**
- [C53] tier 2, verified 2026-10-19: https://idleon.wiki/wiki/Gem_Shop fetched 2026-10-19 Confidence M. **Disputed (source lens: range is 250-300+).**
- [C54] tier 1, verified 2026-10-19: GS oddities/bonuses idx 0-13, 40-45, 127-151 Confidence H.
- [C55] tier 1, verified 2026-10-19: TP/world-5/hole.ts#L100, #L137, #L661 Confidence H.
- [C56] tier 1, verified 2026-10-19: quests.json (vendor data), summed PremiumGem rewards = 644 over 50 rows Confidence H.
- [C57] tier 1, verified 2026-10-19: achievements.json (vendor data): sum of gems, filler excluded = 1285, all steamExclusive Confidence H.
- [C58] tier 1, verified 2026-10-19: Prior (N.js and data, carried, not re-verified 2026-10-19) Confidence H.
- [C59] tier 1, verified 2026-10-19: Prior (N.js and data, carried, not re-verified 2026-10-19) Confidence M.
- [C60] tier 1, verified 2026-10-19: N.js@10973870 GemRewardfromPetMart; N.js (OptionsListAccount[516] write) Confidence M.
- [C61] tier 1, verified 2026-10-19: Prior (N.js and data, carried, not re-verified 2026-10-19) Confidence L.
- [C62] tier 2, verified 2026-10-19: https://idleon.wiki/wiki/Gems fetched 2026-10-19 Confidence L. **Disputed (source lens: numbers contradict wiki tables).**
- [C63] tier 1, verified 2026-10-19: Prior (N.js and data, carried, not re-verified 2026-10-19) Confidence H.
- [C64] tier 4, verified 2026-10-19: IdleOn Guide Sheet Gems tab 2023-07-25 (carried, stale) Confidence L.
- [C65] tier 2, verified 2026-10-19: Derived from M1-M3 and Prior per-session list Confidence L.
- [C66] tier 2, verified 2026-10-19: Derived from M1-M3 and Prior per-session list Confidence M.
- [C67] tier 3, verified 2026-10-19: Prior: AutoReview S tier gist / Discord tier list (r/idleon 1wgpxqv, 2026-09-15), carried Confidence L.
- [C68] tier 3, verified 2026-10-19: https://www.reddit.com/r/idleon/comments/1wxle7j/comment/pdw6ghp/ (2026-10-04), carried via KB yaml Confidence L.
- [C69] tier 3, verified 2026-10-19: Prior synthesis from Discord tier list and gem-shop.yaml; detection rules derived from GS indices Confidence L.
- [C70] tier 3, verified 2026-10-19: Prior: Discord list and Treyex https://www.treyexgaming.com/idleon-gem-shop-tier-list/ (2025-11-12, L), carried Confidence L.
- [C71] tier 3, verified 2026-10-19: Prior synthesis from Discord tier list and gem-shop.yaml; detection rules derived from GS indices Confidence L.
- [C72] tier 3, verified 2026-10-19: https://www.reddit.com/r/idleon/comments/1qg1tn5 (2026-01-18), carried Confidence L.
- [C73] tier 3, verified 2026-10-19: https://www.reddit.com/r/idleon/comments/1wgpxqv (2026-09-15), carried Confidence L.
- [C74] tier 3, verified 2026-10-19: Prior synthesis from Discord tier list and gem-shop.yaml; detection rules derived from GS indices Confidence L.
- [C75] tier 3, verified 2026-10-19: Prior synthesis from Discord tier list and gem-shop.yaml; detection rules derived from GS indices Confidence L.
- [C76] tier 3, verified 2026-10-19: https://www.reddit.com/r/idleon/comments/1uopts0/comment/ovu2pju/ (2026-07-06), carried via KB yaml Confidence L.
- [C77] tier 3, verified 2026-10-19: Prior synthesis from Discord tier list and gem-shop.yaml; detection rules derived from GS indices Confidence L.
- [C78] tier 3, verified 2026-10-19: https://www.reddit.com/r/idleon/comments/1wgpxqv (2026-09-15), carried Confidence L.
- [C79] tier 3, verified 2026-10-19: Prior synthesis from Discord tier list and gem-shop.yaml; detection rules derived from GS indices Confidence L.
- [C80] tier 3, verified 2026-10-19: Prior: Discord list and Treyex https://www.treyexgaming.com/idleon-gem-shop-tier-list/ (2025-11-12, L), carried Confidence L.
- [C81] tier 3, verified 2026-10-19: Prior synthesis from Discord tier list and gem-shop.yaml; detection rules derived from GS indices Confidence L.
- [C82] tier 3, verified 2026-10-19: Prior synthesis (wiki pack ratios + tier list) Confidence L.
- [C83] tier 3, verified 2026-10-19: https://www.reddit.com/r/idleon/comments/1qmxivm (2026-01-25), 1wgpxqv, carried Confidence L.
- [C84] tier 3, verified 2026-10-19: Prior synthesis from Discord tier list and gem-shop.yaml; detection rules derived from GS indices Confidence L.
- [C85] tier 3, verified 2026-10-19: Prior synthesis from Discord tier list and gem-shop.yaml; detection rules derived from GS indices Confidence L.
- [C86] tier 1, verified 2026-10-19: TP/gemShop.ts, TP/index.ts, TP/*grep of gemShopPurchases indices; unspent-fields.ts#L21 Confidence H.
- [C87] tier 1, verified 2026-10-19: TP/gemShop.ts, TP/index.ts, TP/*grep of gemShopPurchases indices; unspent-fields.ts#L21 Confidence H.
- [C88] tier 1, verified 2026-10-19: TP/gemShop.ts, TP/index.ts, TP/*grep of gemShopPurchases indices; unspent-fields.ts#L21 Confidence H.
- [C89] tier 1, verified 2026-10-19: TP/gemShop.ts, TP/index.ts, TP/*grep of gemShopPurchases indices; unspent-fields.ts#L21 Confidence H.
- [C90] tier 1, verified 2026-10-19: packages/knowledge/systems/gem-shop.yaml; detectors/gem-shop/unspent.ts; ux/m25-coverage.md row 156 Confidence H.
- [C91] tier 1, verified 2026-10-19: apps/activeon/src/art/sprites/grids/items.ts#L204 (item-gem) Confidence H.
- [C52b] tier 1, verified 2026-10-19: TP/misc.ts#L621-L653 (bundles). Confidence H.
- [C92] tier 1, verified 2026-10-19: GS past_limited_specials (gemShop.json section [4]). Confidence H for prices, M for effects.
- [C93] tier 1, verified 2026-10-19: GS Time_Skips section idx 95-102. Confidence H.
- [C94] tier 1, verified 2026-10-19: GS etc section idx 24-31. Confidence H.
- [C95] tier 1, verified 2026-10-19: GS Premium_Stones section; N.js@15117507-15118205. Confidence H.
- [C96] tier 1, verified 2026-10-19: source lens, item text vs code. Confidence M.
- [C97] tier 1, verified 2026-10-19: TP/misc.ts, TP/storage.ts (bon_a/w/x/y, bun_c). Confidence H.
- [C98] tier 1, verified 2026-10-19: N.js@4299642, @11763682-11764758. Confidence M.
- [C99] tier 1, verified 2026-10-19: N.js@6355231-6355394. Confidence M.
