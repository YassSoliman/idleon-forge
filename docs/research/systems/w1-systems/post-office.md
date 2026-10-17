# Post Office (W2-unlocked, covered here per ticket #20)

Part of the [W1 System Dossiers](../2026-10-17-w1-systems.md). The source pins are listed there. **Stage note:** the Post Office opens in W2, not W1. The ticket put it in this cluster, and the W2 ticket ([#21](https://github.com/YassSoliman/idleon-forge/issues/21)) does not list it.

## Post Office

- **What it is:** daily delivery orders from 6 shipping companies. You fill them with items from storage. Each completed order gives 1 delivery box, and order streaks give bonus boxes. **Each character** spends the account's boxes on its own 24 upgradeable "boxes" (shipments), and each box has 3 bonus tiers. (H: Toolbox `parsers/world-3/postoffice.ts`; N.js `_customBlock_PostOfficeINFO`; wiki [Post Office](https://idleon.wiki/wiki/Post_Office), rev. 2026-10-07)
- **Unlocks:**
  - **Postboy Pablob** (W2 town) appears once any character reaches **class Lv 50**. (H: N.js NPC gate `50 > HighestLvPlayer` → recycle actor)
  - His quest "Signed, Sealed and Lost in the Post" needs **5 Empty Boxes** crafted from **Anvil Tab 2**, which needs Smithing Lv 15 and the Tab 2 expansion. Rewards: 10,000 class EXP, 75 gems, 5 × 2 h Time Candy. (wiki)
  - Upgrade tab 2 (Charlie's Crates) opens once enough total orders unlock all 3 tab-2 order columns. Crate of the Creator, Chefs Essentials and Myriad Crate come from the Pet Arena (W4). Scurvy C'arr'ate, Box of Gosh and Gaming Lootcrate come from Sailing (W5). (wiki)
- **Scope:** **orders and box income are account-wide; box spending is per character.** `PostOfficeINFO("AvailablePoints")` = `DeliveryBoxComplete + DeliveryBoxStreak + OLA[347] + (BoxPoints vial + OLA[131])` minus *that character's* spent points. Every character therefore has the **whole account total** to spend. More characters means more total bonus from the same orders. (H)
- **Inputs → outputs:**
  - **In:** items from the storage chest (no need to carry them).
    - Simple Shippin: W1/W2 skilling resources (Copper/Iron/Gold Ore, bars, logs, Thread, Trusty Nails, Boring Brick, fish, bugs).
    - Plan-it Express: crafted gear (Farmer Brim … Platinum Boots).
    - Dudes Next Door: W1/W2 monster drops (Spore Cap … Ripped Tunic, including 2 Amarok Slabs).
    - Down Undelivery: 1-in-20K rare drops.
    - Alpine Suppliers: W3 drops.
    - Cosmic Carrier: W4 drops.
    - The amount asked grows with the streak (no further growth after streak 100). (wiki)
  - **Rhythm:** completed orders reset every 24 h. An uncompleted order can be reset for free after 3 days plus its shield days. A Silver Pen skips an order without breaking the streak and adds 1 shield day. (wiki)
  - **Out:** 1 box per order. Streak bonuses: +1 at 5, 10, 15, 25, 30, 35, 45, 55 …; +3 at 20, 40, 60, 80 …; +5 at 50 and 150; +9 at 100 and 200. (wiki) Each order also rolls company rewards: upgrade stones, golden foods, Power/Feasty/Kachow/Cauldron/Beholder/Bullseye/EhExPee/Seesaw Statues, **Forest Villa Keys** and Efaunt's Tomb Keys, Chizoar's Cavern Key, gems, potions.
  - **Box bonuses:** Bonus 1 from level 0. Bonus 2 from level 25 (50 on the 800-cap boxes, 100 on Myriad). Bonus 3 from level 100 (200 on the 800-cap boxes, 300 on Myriad). The cap is 400 for 20 boxes, 800 for 3 and 100,000 for Myriad. (H: Toolbox `postOffice[].upgradeLevels`, `maxLevel`)

| Box (tab) | Bonus 1 (max) | Bonus 2 (max) | Bonus 3 (max) |
|---|---|---|---|
| Civil War Memory Box (1) | +1 Base Damage/lv (400) | % Fight AFK Gains (8.48) | % Crit Chance (6) |
| Locally Sourced Organs (1) | Base Max HP (201) | % Max HP (37.5) | % Faster Respawns (18) |
| Magician Starterpack (1) | Base Max MP (134) | % Max MP (37.5) | % Faster Cooldowns (10.2) |
| Box of Unwanted Stats (1) | Base Accuracy (100) | Base Defence (113) | % Monster EXP (18.5) |
| Dwarven Supplies (1) | % Mining Efficiency (33.3) | % Prowess Effect (28.6) | % Mining AFK Gain (9.47) |
| Blacksmith Box (1) | % Smithing EXP (33.3) | % Anvil Production Speed (48.9) | % to Craft +1 Slot (20) |
| Taped Up Timber (1) | % Choppin Efficiency (33.3) | % Prowess (28.6) | % Choppin AFK Gain (9.47) |
| Carepack From Mum (1) | % Not Consume Food (15.3) | % Health Food Effect (19.6) | % Boost Food Effect (18) |
| Sealed Fishheads (1) | % Fishing Efficiency (33.3) | % Prowess (28.6) | % Fishing AFK Gain (9.47) |
| Potion Package (1) | % Brewing Speed (46.7) | % Alchemy EXP (42.9) | Cranium Cook Time (30) |
| Bug Hunting Supplies (1) | % Catching Efficiency (33.3) | % Prowess (28.6) | % Catching AFK Gain (9.47) |
| Non Predatory Loot Box (1) | % Drop Rate (33.3) | LUK (93.8) | % Crystal Mob Spawn (39) |
| Deaths Storage Unit (2) | Weapon Power (14.7) | % Basic Atk Speed (10.7) | % Total Damage (9) |
| Utilitarian Capsule (2) | % Printer Sample Size (3.33) | % Multikill per Tier (9.78) | % Cash from Mobs (23.4) |
| Lazzzy Lootcrate (2) | % 2× AFK XP chance (20) | % AFK EXP if 36 h+ (22.8) | % AFK Cash if 36 h+ (21) |
| Science Spare Parts (2) | Lab Efficiency (1.6K) | % Lab EXP (28.6) | Base LUK (18) |
| Trapping Lockbox (2) | % Trapping Efficiency (33.3) | % Trapping EXP (32.6) | % Critters Trapped (27) |
| Construction Container (2) | % Base Build Rate (100) | % Shrine Charge Rate (48.9) | % Construction EXP (150) |
| Crate of the Creator (Pet Arena) | % Worship Efficiency (33.3) | % Max Charge (130) | Starting Worship Pts (54) |
| Chefs Essentials (Pet Arena) | Cooking Efficiency (1.6K) | % Cooking EXP (39.1) | % 2× Ladle Drop (52.8) |
| Myriad Crate (Pet Arena) | Base All Stat (333) | Base All Efficiency (833) | % All Skills EXP (83.3) |
| Scurvy C'arr'ate (Sailing) | % AFK counts for Sailing (5.33) | AGI (150) | % Total Damage (15) |
| Box of Gosh (Sailing) | % Divinity EXP (50) | WIS (150) | % Divinity Gain (18) |
| Gaming Lootcrate (Sailing) | % AFK counts for Gaming (9.33) | STR (150) | % Total Damage (15) |

  (Values are from the wiki's bot tables; the formulas are in Toolbox `shared-data.json` `postOffice`. Most decay curves give about 75% of their max at 200 boxes, per the wiki.)

- **Goals and Milestones:**

| Milestone | Meaning |
|---|---|
| Post Office unlocked | Postboy quest done (W2, Lv 50 plus Anvil Tab 2) |
| Each streak multiple of 5 / 20 / 50 / 100 | Bonus boxes (above) |
| Box level 25 / 100 on a box | Bonus 2 / Bonus 3 unlock |
| Box 200 → 400 | ~75% → 100% of the decay bonuses |
| All 3 tab-2 columns unlocked | Charlie's Crates (tab 2) |
| Total orders ≥ 400 × boxes wanted | A character can max everything (community: "eventually you get a bunch passively and just max everything") |

- **Feeds / fed by:**
  - **Fed by:** storage stockpiles of skilling resources (Mining, Choppin, Fishing, Catching skills), Anvil products ([anvil-smithing.md](anvil-smithing.md)), Forge bars ([forge.md](forge.md)), crafted gear (Smithing), and monster drops (fighting AFK across W1–W4). Also the BoxPoints vial (Alchemy) and Silver Pens (drops).
  - **Feeds:** per-character damage and survivability (Civil War, Organs, Starterpack, Unwanted Stats, Deaths Storage), skill efficiency and AFK gains (Dwarven, Timber, Fishheads, Bug Hunting, Trapping, Construction), Anvil speed and Smithing EXP (Blacksmith Box), food (Carepack), Alchemy (Potion Package), Drop Rate and Crystal mobs (Non Predatory Loot Box → [statues.md](statues.md)), AFK EXP and cash (Lazzzy), and statues, keys and gold food from the order rewards ([amarok-and-quests.md](amarok-and-quests.md)).
- **Per-session actions:**
  1. Complete every company's order you can fill from storage. This is a daily; Toolbox's `dailyShipments` alert covers it, with an option to alert only at 0 shields.
  2. Spend unspent boxes on **every** character (Toolbox character alert `unspentPoints`).
  3. Use a Silver Pen on an order you cannot fill, to protect a long streak.
  - **Idle state:** orders not done today; boxes unspent on any character.
- **AFK Setup implications:** the Post Office wants **stockpiles**. Keep skilling characters producing the W1/W2 resources and anvil products that Simple Shippin and Dudes Next Door ask for. AFK fighting on W1–W4 maps fills the drop orders. The higher the streak, the bigger the asked amounts, so stockpiles must grow with it.
- **Min-max by stage** (per character, community opinion):

| Character | Box order (wiki "usual orders") |
|---|---|
| Barbarian | 200 Civil War → 200/400 Sealed Fishheads → 400 Civil War |
| Squire | 200 Civil War → 200/400 Dwarven Supplies / Construction Container → 400 Civil War |
| Shaman | 200 Civil War → 200/400 Taped Up Timber / Potion Package → 400 Civil War |
| Wizard | 200 Civil War → 200/400 Taped Up Timber / Carepack (food) → 400 Civil War |
| Bowman | 200 Civil War → 200/400 Bug Hunting / Blacksmith Box → 400 Civil War |
| Hunter | 200 Civil War → 400 Trapping Lockbox / Blacksmith Box → 400 Civil War |
| Maestro (Journeyman line) | 200 Civil War → 400 Non Predatory Loot Box (drop) → 400 Civil War |

  - **W2 (first boxes):** with few boxes, Civil War first on the fighters. Put a character's first 25 boxes into its main skill box, to reach Bonus 2 (Prowess or Production Speed). r/idleon 2026-06-06: "Focus on class ones first. Later you will get more than enough boxes … don't worry about spending them wrong".
  - **W3:** keep streaks. Alpine Suppliers asks for W3 drops.
  - **W4+:** Pet Arena crates, Myriad Crate (cap 100K) as the endless sink.
- **Common mistakes:**
  - **Never unlocking it.** Detect highest class Lv ≥ 50 with `postOfficeShipments[*].totalShipments == 0`. Both MVP fixtures (W2 and W3) are in this state: zero shipments, negative streaks.
  - **Boxes left unspent on alts.** Detect `characters[i].postOffice.unspentPoints > 0`.
  - **Breaking a long streak** instead of using a Silver Pen (`currencies.SilverPens`).
  - **Spending a fighter's boxes on a skill box it never uses.**
- **Save and Toolbox fields:**
  - Raw `PostOfficeInfo0` (orders), `PostOfficeInfo1` (per company `[totalShipments, streak, shield]`), per-character `POu_N` (spent points per box), `CYDeliveryBoxComplete`, `CYDeliveryBoxStreak`, `CYDeliveryBoxMisc`, `OLA[131]`, `OLA[347]`.
  - Parsed `account.postOfficeShipments[]` (`{index, totalShipments, streak, completedAnOrder, shield}`), `account.currencies.{DeliveryBoxComplete, DeliveryBoxStreak, DeliveryBoxMisc, SilverPens}`, `characters[i].postOffice.{boxes[], totalOrders, totalPointsSpent, unspentPoints}`.
  - Helper `getPostOfficeBonus(character.postOffice, boxName, bonusIndex)`.
  - Toolbox comment: the saved `DeliveryBoxMisc` only refreshes when the Post Office is opened, so Toolbox rebuilds it.
- **Sources:** N.js v1.23 (2026-10-17): `_customBlock_PostOfficeINFO` ("AvailablePoints", "BonusAmount", "SpecificBonus"), NPC spawn gate for `Postboy_Pablob`. Toolbox @ 6827d3f: [`parsers/world-3/postoffice.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/postoffice.ts), `shared-data.json` `postOffice`, `baseTrackers.js` (World 2 → postOffice; characters → postOffice). Wiki [Post Office](https://idleon.wiki/wiki/Post_Office) (rev. 2026-10-07; quest, streak table, companies, rewards, the per-class "usual orders"). r/idleon [1tyi01h](https://www.reddit.com/r/idleon/comments/1tyi01h/) (2026-06-06) and [1u6ej7n](https://www.reddit.com/r/idleon/comments/1u6ej7n/) ("finally done w/ post office", 2026-06-15, not read in detail).
