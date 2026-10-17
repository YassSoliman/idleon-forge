# Pets (Companions), Guild and Family bonuses

Research date 2026-10-17, game v1.23 "Lumi Menagerie" (Toolbox calls it 2.3.540; N.js Last-Modified 2026-10-17), IdleonToolbox commit `6827d3f`. `TB` below means `https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/`. N.js locations are given as `symbol @offset` (python `str.find` on the 26 MB client). Confidence: H = read in code or data, M = inferred, L = community or secondhand.

### Key findings

- **Pets are a big account-wide boost that W1-W4 players mostly ignore.** The game renamed Companions to Pets on 2026-02-20 (v1.05). Every owned pet's bonus applies to all characters (H). Several gacha pets are among the strongest W1-W4 boosts in the game: Rift Slug (+25 levels to all talents), Crystal Custard (+100% drop rate and class EXP), Ancient Golem (10x total damage), Flying Worm (+30 talent points) and Gigafrog (+25% carry capacity). The sample W2 and W3 accounts own only 2 and 4 pets, all minor ones, and have opened only 3 and 5 pet boxes in their lifetime (H, fixture aggregates).
- **The free pet pull is daily now, and missing it is the easiest mistake to detect.** v1.20 (2026-08-26) changed the free pull from weekly to daily. The `_comp` field `t` is a deadline anchor: the pull is claimable when `t + 594,000,000 ms` is in the past (H, `TB utility/helpers.js#L1178-L1185`). Toolbox's `freeCompanion` alert uses exactly that check. A Pet Bonus Token (up to 2 per account) grants any pet's base bonus without owning the pet. Both sample accounts have 0 tokens (`OptionsListAccount[605]`, `[615]`).
- **Guild bonuses are free stats, but only if you are in an active guild.** There are 17 levelable bonuses with `decay` curves (half the cap at level 50, or 100/120/20 for some), costing `base + level × increment` GP per level (H, N.js `levelUpGuild` @7380855). Maxing every bonus costs 5,091,250 GP. One account earns about 540 GP a week (with no bribes), and a solo guild of 10 or fewer members doubles that. A solo guild therefore needs years. The sample W2 account is in no guild (`OptionsListAccount[37] == ""`), so its guild tasks track progress but can never pay out.
- **Never level "Bonus GP for small guilds" in a guild of 10 or fewer.** In-game code: GP × (1 + (100 − 200·L/(L+50))/100) when members ≤ L + 10 (H, `contributeGP` @7756747). Level 0 already gives +100% for up to 10 members. Each level lowers the percentage and raises the member cap by 1.
- **Family bonuses come from the highest-level character in each class line, and duplicates add nothing.** Each character contributes the family bonus of every class in its line (base, subclass, elite, master), all at its own level. The highest raw value per class wins (H, `TB parsers/family.ts#L49-L68`). To cover the W1-W4 family set you need one character in each of the six subclasses plus a Journeyman line. The sample W3 account has two Squires and no Hunter, so it gets no +% all-skill efficiency family bonus.
- **"Family level" is the sum of all character levels.** It unlocks character slots (2nd at 8 total, 6th at 300, 7th at 500, 11th at 5,000; wiki Character_Creation, revised 2026-10-07) and the 24 Family obol slots (level requirements 60 to 5,000, H `shared-data.json` `obols.family`). Toolbox exposes it as `account.accountLevel` (`TB parsers/index.ts#L301`).
- **Toolbox reads pets and guilds from Firebase RTDB, not the save document.** Pets come from `_comp/{uid}`, the guild id from `_usgu/{uid}/g`, and guild points and members from `_guild/{id}` (H, `TB firebase/index.js#L139-L157`). Guild bonus levels and task progress come from the cloud save key `Guild`. Toolbox's `guild.unlocked` is always true when signed in, so use `guild.id` or `accountOptions[37]` to tell whether the player is in a guild.

## Pets (Companions)

- **What it is:** A collection of pets. Each owned pet gives a fixed account-wide bonus "always active for all characters once obtained" (wiki Pets, rev 2026-10-11). One pet can also be set as the visible follower (`_comp.e`). Pets also form your team for the daily Grand Tournament and Raids (PvP and PvE pet battles, where only one copy of each pet counts).
- **Unlocks:** From the start of the game. You get pets from Doggy, the corgi in Blunder Hills (W1) town, and the Pet Park map. There is also a teleport button under Happy Doggy in the Upgrade Vault (wiki Pets "Obtaining", rev 2026-10-09). Tournament registration needs at least one owned pet; Toolbox gates its `tournamentRegister` alert on owning any pet (M, `TB utility/dashboard/account.js#L273`). One exception: King Doot's bonus is 0 until Divinity is Lv 2 or higher, because `_customBlock_Companions(0)` returns 0 when `Lv0[14] < 2` (H, N.js @10790346).
- **Scope:** Account-wide bonuses. Pets are owned per account and stored server-side in RTDB `_comp/{uid}`, not in the save document. Tradeable versus untradeable is per copy.
- **Inputs → outputs:**
  - **Ways to get pets on the current patch (wiki Pets / Pet_Mart, changelog 2026):**
    - *Free daily pull* at Doggy (weekly until v1.20, daily since 2026-08-26). The "Legacy" button gives pulls from the older Legacy set. Free pets give 0 Pet Crystals when recycled.
    - *Treats bought with Pet Crystals.* Treats have 5 food tiers for Legacy and 4 for the newer sets. Higher tiers raise the rare odds and the price: Legacy Broccoli 100 → Jawbreaker 250 crystals, and later tiers unlock after 5/13/23/38 pets bought. Newer sets have pity: Rare guaranteed at 10 treats of tier 2, Unique at 20, Mythic at 30. King Doot is guaranteed within 200 treats. Unlocking Legacy tier 5 removes the Legacy common pets from the pool.
    - *Pet Mart* in the Tournament lobby. It offers 5 server-chosen pets a day for Pet Crystals, sometimes discounted by 10/15/20/30/50%, always tradeable. **Pet Mart+** sells the upgraded "+" version of a pet you already own. It appears when you own every pet in the day's Mart offer and hold at least 50 pets (wiki Pet_Mart, created 2026-10-14). Prices come from the server's `_TOURNAMENT` doc fields `I/B/A` and `LI/LB/LA` (H, `TB parsers/world-7/tournament.ts#L117-L141`).
    - *Pet Mart daily free gems* (up to about 150 a day). These are claimable when the server shop day `S` is greater than `OptionsListAccount[516]` and the server var `GemPM_x` is at least 0.1 (H, `TB utility/dashboard/account.js#L264-L271`). Both sample accounts have `[516] = 0`, meaning they have never claimed.
    - *Raids* (v1.20) win pets, and raid reward pets become obtainable elsewhere after the raid ends.
    - *Paid packs:* the `bin_*` "evolving" bundles give a specific pet plus gems and Pet Crystals. Examples: Cryology $3.99 with Cryosnake and 500 crystals; King Doot pack $9.99 with 1,000 crystals (H, website-data bundles).
    - *Exclusive pets* come only from their source (giveaways, bundles, events) or from trading.
  - **Pet Crystals:** the `_comp.s` field. You get them by recycling tradeable copies (the "Recycle" column below; recycling your last copy removes its bonus and asks for confirmation) and from paid packs. A steady free-to-play crystal income other than recycling was **not found** (unknown).
  - **Pet+ upgrade:** costs Pet Crystals. It swaps the bonus to `upgradedBonus` and the tournament power to `upgradedTourPower`. An upgrade applies once any copy has level ≥ 1. Tradeable copies are upgraded first and stay tradeable (H, `TB parsers/misc.ts#L1397-L1474`; changelog v1.20). Only pets in the wiki's "Pet+ Release Dates" list have been offered so far (19 by 2026-10-06). Data has `upgradeCost` for most pets, but the Mart decides which ones are actually on offer.
  - **Pet Bonus Token** (item `Quest119`, "Pet_Bonus_Token"): grants one chosen pet's **base** bonus as if you owned it. You use it from the Trade popup by double-clicking a player. It is refunded if you later get the pet, and it is refunded for Glunko Supreme and Champion pets. An account has at most 2 tokens: `OptionsListAccount[605]` (v1.19 Summer event) plus `[615]` (the v1.20 "+1 for everyone" drop) (H, N.js `PetBonusTokensOwned` @10978993). The chosen pet indices are in `[606]`. The game wipes `[606]` if it lists more pets than tokens owned (H, `TB parsers/misc.ts#L1416-L1436`). The `Quest119` drop code sits in the monster-kill routine next to event drops and needs `[615] == 0` (N.js @3469401). Whether it can still drop outside an event is **unverified** (M).

### Pet table (v1.23, from `companions.json`, regenerated for 2.3.540 on 2026-10-17)

"Idx" is the index into `account.companions.list` and the game's `CompanionDB`. "Set" and "Tier-1 odds" come from wiki Pets (rev 2026-10-11, one patch old, so Stale-risk for odds). The Pet Mart price is the wiki's full list price; the server can discount it. Recycle is the Pet Crystals you get for a tradeable non-free copy (data `filler`). The Pet+ cost is data `upgradeCost`, and only pets actually rotated into Pet Mart+ can be bought. Placeholder rows ("Not officially in the game") and the 9 Champion pets (no bonus, 10 tournament power) are left out. Of the 178 data rows, 100 are real pets. "W1-W4 value" is this dossier's rating (M).

| Idx | Pet | Set | Tier-1 odds | Base bonus | Pet+ bonus | Pet+ cost | Pet Mart price | Recycle | W1-W4 value |
|---|---|---|---|---|---|---|---|---|---|
| 0 | King Doot | Legacy | 0.28% | All Divinities from World 5 count as Active | All Divinities count as Active, and 1.25x Divinity PTS gain | 3000 | - | 2000 | W5+ (Divinity) |
| 1 | Rift Slug | Legacy | 1% | +25 Lv for all Talents | +35 Lv for all Talents | 2500 | 3,500 | 450 | **High** all stages (+25 talent LV) |
| 2 | Dedotated Ram | Legacy | 2.5% | You can use Storage Chest anywhere in Quickref | Use Storage Chest from anywhere, and +30% Carry Capacity | 2100 | 1,600 | 150 | **High** QoL (storage from Quickref) |
| 3 | Crystal Custard | Legacy | 2.5% | +100% Drop Rate and Class Exp | +130% Drop Rate and Class Exp | 1750 | 1,250 | 150 | **High** (DR + class EXP) |
| 4 | Sheepie | Legacy | 11.11% | All big bubbles in Alchemy count as equipped | - | 1500 | 375 | 10 | **High** from W2 (Alchemy) |
| 5 | Molti | Legacy | 11.11% | +5% All Skill Efficiency | +8% All Skill Efficiency | 1400 | 350 | 10 | Med (skill eff.) |
| 6 | Bored Bean | Legacy | 11.11% | +5% AFK Gains Rate for Fighting and Skills | +8% AFK Gains Rate for Fighting and Skills | 1200 | 325 | 10 | Med-High (AFK rate) |
| 7 | Slime | Legacy | 15.09% | +25% Golden Balls earned in Arcade for Upgrades | +50% Golden Balls earned in Arcade for Upgrades | 1000 | 275 | 5 | Low-Med W2 (Arcade) |
| 8 | Sandy Pot | Legacy | 15.09% | +15 Base All Stats (STR/AGI/WIS/LUK) | +20 Base All Stats (STR/AGI/WIS/LUK) | 800 | 260 | 5 | Med early (base stats) |
| 9 | Bloque | Legacy | 15.09% | +20% All Skill EXP | +30% All Skill EXP | 700 | 250 | 5 | Med (skill EXP) |
| 10 | Frog | Legacy | 15.09% | +10% Total Damage | +15% Total Damage | 600 | 240 | 5 | Med (damage) |
| 11 | Glunko Supreme | Spectacular | — | Only 100 of these exist in IdleOn... | - | - | - | 1 | None |
| 12 | Ancient Golem | Fallen Spirits | 0.2% | 10x Total Damage | 15x Total Damage | 4700 | 3,800 | 1000 | **High** (10x damage) |
| 13 | Samurai Guardian | Fallen Spirits | 0.4% | 3x Villager EXP and +25 Opals | 4x Villager EXP and +33 Opals | 3800 | 3,300 | 250 | W5+ (Caverns) |
| 14 | Rift Jocund | Fallen Spirits | 0.4% | 2x Kills for Opening Portals and Deathnote | 3x Kills for Opening Portals and Deathnote | 3400 | 2,900 | 250 | **High** (portal/Death Note kills) |
| 15 | Leek Spirit | Fallen Spirits | 1.33% | 3.50x faster Equinox Bar Fill Rate | 5.00x faster Equinox Bar Fill Rate | 2900 | 1,250 | 100 | **High** from W3 (Equinox) |
| 16 | Crystal Capybara | Fallen Spirits | 1.33% | 1.75x Lab EXP and Divinity EXP Gain | 2.00x Lab EXP and Divinity EXP Gain | 2800 | 1,200 | 100 | W4 (Lab), W5 (Divinity) |
| 17 | Biggole Mole | Fallen Spirits | 1.33% | 3d Printer samples grow +1%/day for 100 days | 3d Printer samples grow +2%/day for 100 days | 2700 | 1,150 | 100 | **High** from W3 (3D Printer) |
| 18 | Gigafrog | Fallen Spirits | 5% | +25% Carry Capacity for all item types | +35% Carry Capacity for all item types | 2200 | 600 | 10 | **High** early (carry cap) |
| 19 | Mashed Potato | Fallen Spirits | 5% | +5% Ballot Bonus Multi (World 2 feature) | +8% Ballot Bonus Multi (World 2 feature) | 1900 | 550 | 10 | Low-Med W2 (Ballot) |
| 20 | Flying Worm | Fallen Spirits | 5% | +30 Talent Points for all classes | +40 Talent Points for all classes | 1800 | 500 | 10 | **High** (+30 talent points) |
| 21 | Poisonic Frog | Fallen Spirits | 26.66% | +15% Defence | +20% Defence | 1500 | 150 | 5 | Low (defence) |
| 22 | Quenchie | Fallen Spirits | 26.66% | +15% Drop Rate | +20% Drop Rate | 1400 | 125 | 5 | Med (DR) |
| 23 | Green Mushroom | Fallen Spirits | 26.66% | +15% Accuracy | +20% Accuracy | 1300 | 100 | 5 | Low-Med early (accuracy) |
| 24 | Cool Bird | Exclusive | — | 4x Coins from Mobs | 6x Coins from Mobs | 2500 | - | 500 | **High** (4x coins) |
| 25 | Axolotl | Exclusive | — | +50% AFK Gains | +70% AFK Gains | 2500 | - | 500 | **High** (+50% AFK gains) |
| 26 | Mallay | Exclusive | — | 1.30x Drop Rate | 1.50x Drop Rate | 2900 | - | 500 | **High** (1.3x DR) |
| 27 | Spirit Reindeer | Exclusive | — | 2.00x Gold Ball Shop Bonuses | 2.50x Gold Ball Shop Bonuses | 3200 | - | 500 | **High** W2 (Arcade shop) |
| 28 | RIP Tide | Exclusive | — | +30% AFK gains for World 7 skills, and +1 Worldclass Showcase Slot in Gallery | +40% AFK gains for World 7 skills, and +2 Worldclass Showcase Slots in Gallery | 4500 | - | 500 | W7 |
| 29 | Squirrel | Exclusive | — | 1.50x Kills for Opening Portals and Deathnote | 1.75x Kills for Opening Portals and Deathnote | 2700 | - | 100 | **High** (portal kills) |
| 30 | Mr Pig | Exclusive | — | 2x Friend Bonuses, +2 Friend Bonus Slots, Auto Loot, Storage Quickref Usage, Infinite Teleporting | 2.5x Friend Bonuses, +3 Friend Bonus Slots, Auto Loot, Storage Quickref Usage, Infinite Teleporting | 3500 | - | 100 | **High** QoL + friend bonuses |
| 31 | Wild Boar | Exclusive | — | +15% Hat Rack Bonus Multi | +25% Hat Rack Bonus Multi | 3900 | - | 100 | Med from W3? (Hat Rack, M) |
| 32 | Whale | Exclusive | — | 2x Class EXP gain and 2x All Skill EXP gain | 2.5x Class EXP gain and 2.5x All Skill EXP gain | 2800 | - | 100 | **High** (2x class + skill EXP) |
| 33 | Chippy | Exclusive | — | 2x Total Damage, and 2x Class EXP gain | 2.5x Total Damage, and 2.5x Class EXP gain | 2500 | - | 100 | **High** (2x dmg, 2x class EXP) |
| 34 | Bunny | Exclusive | — | 3x Class EXP gain | 4x Class EXP gain | 2200 | - | 100 | **High** (3x class EXP) |
| 35 | Panda | Exclusive | — | 2x Refinery Salts produced (affects POW produced in Refinery) | 3x Refinery Salts produced (affects POW produced in Refinery) | 2500 | - | 100 | **High** W3 (Refinery) |
| 36 | Hedgehog | Exclusive | — | +200% Gold Balls gained from the Arcade, | +300% Gold Balls gained from the Arcade, | 2600 | - | 100 | Med W2 (Arcade) |
| 37 | Whallamus | Shallow Waters | 0.2% | 10x Class EXP and +10 Legend Talent PTS | 15x Class EXP and +15 Legend Talent PTS | 4900 | 3,400 | 1000 | **High** (10x class EXP; legend PTS are W7) |
| 38 | Balloonfish | Shallow Waters | 0.4% | 4x Coins from monsters, and 4x Masterclass drops | 6x Coins from monsters, and 6x Masterclass drops | 3800 | 3,100 | 250 | **High** (4x coins) |
| 39 | Pufferblob | Shallow Waters | 0.4% | +50% Meritocracy Bonus Multi (World 7 feature) | +75% Meritocracy Bonus Multi (World 7 feature) | 3500 | 2,750 | 250 | W7 |
| 40 | Shellslug | Shallow Waters | 1.33% | 1.75x Daily Reef Coral (World 7 feature) | 2.00x Daily Reef Coral (World 7 feature) | 2800 | 1,250 | 100 | W7 |
| 41 | Crystal Cuttlefish | Shallow Waters | 1.33% | +40% Ballot Bonus Multi (World 2 feature) | +50% Ballot Bonus Multi (World 2 feature) | 2700 | 1,200 | 100 | Med W2 (Ballot) |
| 42 | Eamsy Earl | Shallow Waters | 1.33% | +1 Grade for 2 Gallery Showcases (World 7 feature) | +1 Grade for 3 Gallery Showcases (World 7 feature) | 2600 | 1,150 | 100 | W7 |
| 43 | Litterfish | Shallow Waters | 5% | 1.25x Artifact Find chance (World 5 feature) | 1.50x Artifact Find chance (World 5 feature) | 1900 | 600 | 10 | W5+ |
| 44 | Spearfish | Shallow Waters | 5% | +1 Friend Bonus slot | +1 Friend Bonus slot and +25% Friend Bonuses | 1800 | 550 | 10 | Med (friend slot) |
| 45 | Equinox Broadbass | Shallow Waters | 5% | 1.50x Coins from monsters | 2.50x Coins from monsters | 1750 | 500 | 10 | Med (coins) |
| 46 | Mafioso | Shallow Waters | 26.66% | +15% faster Alchemy Brew Speed | +25% faster Alchemy Brew Speed | 1200 | 150 | 5 | Med W2 (brew speed) |
| 47 | Baby Boa | Shallow Waters | 26.66% | +10% Class EXP | +15% Class EXP | 900 | 125 | 5 | Low (+10% class EXP) |
| 48 | Purp Mushroom | Shallow Waters | 26.66% | +5% Golden Food bonus | +7% Golden Food bonus | 600 | 100 | 5 | Low-Med (golden food) |
| 49 | Bubba the Seal | Exclusive | — | +30% Gallery Bonus Multi (World 7 feature) | +50% Gallery Bonus Multi (World 7 feature) | 4500 | - | 5 | W7 |
| 50 | Santa Snake | Exclusive | — | +25% Class EXP, +25% Drop Rate, 1.01x Class EXP, and 1.01x Drop Rate | +50% Class EXP, +50% Drop Rate, 1.01x Class EXP, and 1.01x Drop Rate | 450 | - | 0 | Med (EXP/DR) |
| 51 | Santas Little Helper | Exclusive | — | 3x bonuses from Orion, Poppy, and Bubba (and all future Clickers) | 5x bonuses from Orion, Poppy, and Bubba (and all future Clickers) | 2900 | - | 100 | **High** W1 (3x Orion) |
| 52 | Jellofish | Exclusive | — | 1.50x Research EXP gain (World 7 feature) | 1.80x Research EXP gain (World 7 feature) | 2500 | - | 1 | W7 |
| 53 | Koi Fish | Exclusive | — | 100x Gaming Bits gained (World 5 feature) | 200x Gaming Bits gained (World 5 feature) | 2800 | - | 1 | W5 |
| 54 | Neonscale | Exclusive | — | +1 new Research Shape, shows up after you get Research LV. 20 | +1 new Research Shape, and a new 1.15x Research EXP multi | 3900 | - | 1 | W7 |
| 55 | Pirate Deckhand | Exclusive | — | Multiplies ALL Research Grid bonuses by 1.15x (World 7 feature) | Multiplies ALL Research Grid bonuses by 1.25x (World 7 feature) | 4100 | - | 1 | W7 |
| 56 | Magni Pufferfin | Exclusive | — | 25x Sailing Loot, 100x Captain EXP, and 5x Artifact Find Chance | 100x Sailing Loot, 400x Captain EXP, and 20x Artifact Find Chance | 4750 | - | 1 | W5 |
| 57 | Dreadnaught Captain | Exclusive | — | Glimbo's Swap Meet's prices are 5.00x cheaper (World 7 feature) | Glimbo's Swap Meet's prices are 15.00x cheaper (World 7 feature) | 5900 | - | 1 | W7 |
| 87 | Rift Spooker | Exclusive | — | 3x Cooking Mastery EXP gain and +5 PTS for Cooking Mastery | 4x Cooking Mastery EXP gain and +7 PTS for Cooking Mastery | 3000 | - | 1 | W4 late (Cooking Mastery) |
| 88 | Rift Hivemind | Exclusive | — | +50% Prisma Bubble bonus multi and +5 Prisma Bubbles | +75% Prisma Bubble bonus multi and +7 Prisma Bubbles | 3500 | - | 1 | Late (Prisma bubbles) |
| 99 | Cryosnake | Exclusive | — | All Upgrade Vault upgrades are 50% cheaper! | All Upgrade Vault upgrades are 75% cheaper! | 1500 | - | 1 | **High** W1+ (Upgrade Vault 50% cheaper) |
| 109 | Gelatinous Cuboid | Exclusive | — | 10x Farming Sticker find chance | 20x Farming Sticker find chance | 2500 | - | 1 | W6 |
| 111 | Clammie | Exclusive | — | +100% Class EXP and Drop Rate | +150% Class EXP and Drop Rate | 1200 | - | 1 | **High** (class EXP + DR) |
| 126 | Ricecake | Exclusive | — | 4x Summoning EXP gain | 7x Summoning EXP gain | 2700 | - | 1 | W6 |
| 128 | Baby Troll | Exclusive | — | +100% Class EXP and 1.50x Class EXP Multi | +300% Class EXP and 1.75x Class EXP Multi | 1500 | - | 1 | **High** (class EXP) |
| 132 | Mama Troll | Exclusive | — | +100% Drop Rate and 1.50x Drop Rate Multi | +300% Drop Rate and 1.70x Drop Rate Multi | 3500 | - | 1 | **High** (DR) |
| 135 | Royal Egg | Exclusive | — | 2x LVs for Monuments Bonuses when selecting Rewards! | 3x LVs for Monuments Bonuses when selecting Rewards! | 4300 | - | 1 | W5+ |
| 141 | Coralcave Guardian | Exclusive | — | 3x Resources from Outposts for Royal Guardian | 5x Resources from Outposts for Royal Guardian | 4400 | - | 1 | W7 |
| 143 | Boomy Mine | Exclusive | — | 20x total Spelunking POW, and 2x Minehead Currency Gain! | 30x total Spelunking POW, and 3x Minehead Currency Gain! | 3700 | - | 1 | W7 |
| 145 | Eggroll | Exclusive | — | 3x Class EXP gain | 4x Class EXP gain | 3000 | - | 1 | **High** (3x class EXP) |
| 147 | Mantaray | Exclusive | — | All bonuses from The Button in W7 are 1.50x bigger | All bonuses from The Button in W7 are 1.75x bigger | 2750 | - | 1 | W7 |
| 148 | Glowfish | Exclusive | — | Both +200 and 1.20x Max Stamina for Spelunking! | Both +500 and 1.50x Max Stamina for Spelunking! | 3500 | - | 1 | W7 |
| 153 | Rift Stalker | Exclusive | — | +10 Research PTS, +20% Research AFK Gains, 2x Research EXP Gain, and +1 Magnifier | +15 Research PTS, +30% Research AFK Gains, 3x Research EXP Gain, and +1 Magnifier | 4500 | - | 1 | W7 |
| 154 | Glimbo | Exclusive | — | 1.60x Kills multi, and 2x Artifact Find Chance for Sailing! | 2x Kills multi, and 3x Artifact Find Chance for Sailing! | 2800 | - | 1 | W5 (Sailing) (M) |
| 155 | Vanillie | Exclusive | — | +2500% additive Gold Food bonus effect | +4000% additive Gold Food bonus effect | 3000 | - | 1 | **High** (Gold Food) |
| 156 | Valenslime | Exclusive | — | +15% Total Damage | +25% Total Damage | 500 | 1,400 | 1 | Med (damage) |
| 157 | Mechanical Mouse | Exclusive | — | 2x Construction Build Speed | 3x Construction Build Speed | 2100 | - | 1 | **High** W3 (Construction) |
| 158 | Lucky Slug | Exclusive | — | +15% Drop Rate | +20% Drop Rate | 1250 | 1,500 | 1 | Med (DR) |
| 159 | Potluck | Exclusive | — | 2.5x Coins from Mobs | 4x Coins from Mobs | 2000 | - | 1 | **High** (coins) |
| 160 | Glunko The Massive | Spectacular | — | 3x Total Damage, 5x Class EXP gain, 1.5x Drop Rate | 5x Total Damage, 9x Class EXP gain, 2x Drop Rate | 5400 | - | 1 | **High** (dmg, EXP, DR) |
| 161 | Poppy | Spectacular | — | 2x bonuses from Bonus Ballot and Multi Meritocracy | 2.5x bonuses from Bonus Ballot and Multi Meritocracy | 5800 | - | 1 | **High** W2 (Ballot), W7 |
| 162 | Wickerlight Spirit | Exclusive | — | All meals are 5x cheaper to level up, and give 1.25x higher bonuses! | All meals are 8x cheaper to level up, and give 1.40x higher bonuses! | 3000 | - | 1 | **High** W4 (Meals) |
| 163 | Smoke Devil | Exclusive | — | 100x Jade Gain, 40x Ninja Stealth, and 2.50x Sneaking EXP | 150x Jade Gain, 60x Ninja Stealth, and 3.25x Sneaking EXP | 3750 | - | 1 | W6 |
| 167 | Abacus Frog | Exclusive | — | Thanks a million for rescuing me from the Fortune Mill! | Thanks a million for rescuing me from the Fortune Mill, for real! | 1000 | - | 1 | None |
| 168 | Crystal Glunko | Exclusive | — | 1.50x Damage, 1.40x Class EXP, 1.30x Drop Rate, and 1.20x extra Kills | 1.75x Damage, 1.60x Class EXP, 1.45x Drop Rate, and 1.30x extra Kills | 4000 | - | 1 | **High** (dmg/EXP/DR/kills) |
| 169 | Bin Goosey | Spectacular | — | All daily ribbons have a 50% chance to be +1 Tier, 40% for +3 Tiers, and 10% for +5 Tiers | All daily ribbons have a 50% chance to be +1 Tier, 40% for +4 Tiers, and 10% for +8 Tiers | 5900 | - | 1 | Late (ribbons, M) |
| 170 | Magician Grub | Exclusive | — | 1.25x Total Damage | 1.35x Total Damage | 2500 | - | 1 | **High** (1.25x damage) |
| 171 | Armadillo | Exclusive | — | +100% additive Crystal Monster Spawn chance | +175% additive Crystal Monster Spawn chance | 4400 | - | 1 | **High** (crystal mob spawns) |
| 172 | Imperial Ogre | Exclusive | — | +20% Marble and Parchment drop rate for Royal Guardians | +35% Marble and Parchment drop rate for Royal Guardians | 5500 | - | 1 | Royal Guardian (late) |
| 173 | Pipsqueak | Spectacular | — | The lord of amber herself is keeping her bonus a secret... for now... | Bonus still unknown... for now... | 7200 | - | 1 | None yet |
| 174 | Verminous | Spectacular | — | +10000% additive Gold Food bonus effect and 1.50x multiplier to Gold Food | +20000% additive Gold Food bonus effect and 2x multiplier to Gold Food | 6800 | - | 1 | **High** (Gold Food) |

- **Goals and Milestones:**

| Milestone | What changes | Detect from the save |
|---|---|---|
| First pet | Tournament registration available; the `tournamentRegister` alert fires daily | `companions.list.some(acquired)` |
| Each new pet | Its bonus applies account-wide | `companions.list[i].acquired` |
| Own all 11 Legacy pets | Legacy set complete. Higher treat tiers come from buying, not from owning | Count of acquired in idx 0-10 |
| 50 pets owned | Pet Mart+ can appear (it also needs every pet in the day's Mart offer) | Count of acquired ≥ 50 |
| Pet+ on a pet | Bonus switches to the "Pet+ bonus" column | `companions.list[i].upgraded` |
| 1 or 2 Pet Bonus Tokens used | Base bonus of a pet you do not own | `companions.tokens.used/owned` |

- **Feeds / fed by:**
  - Feeds Talents (Rift Slug +25 levels, Flying Worm +30 points), Damage (Frog, Ancient Golem, Crystal Glunko, Magician Grub), Drop Rate and Class EXP (Crystal Custard, Clammie, Trolls), Carry Capacity (Gigafrog, Ram+), Storage (Ram, Mr Pig), Alchemy (Sheepie: all big bubbles count as equipped; Mafioso brew speed), Arcade (Slime, Hedgehog, Spirit Reindeer), Bonus Ballot (Mashed Potato, Crystal Cuttlefish, Poppy), Owl/Orion clickers (Santas Little Helper), Upgrade Vault (Cryosnake 50% cheaper), Portals and Death Note (Squirrel, Rift Jocund), the 3D Printer (Biggole Mole), Refinery (Panda), Equinox (Leek Spirit), Construction (Mechanical Mouse), Gold Food (Purp Mushroom, Vanillie, Verminous) and Meals (Wickerlight Spirit).
  - Fed by: Pet Crystals (recycling, packs), Tournament and Raids, events, and gems indirectly through packs.
  - Pet Mart is also a source of free gems for the Gem Shop System.
- **Per-session actions:**
  1. **Claim the free daily pull** when `freeClaimAnchor + 594e6 ms ≤ now`. Compare against real time, not the save's `GlobalTime` (H, `TB utility/helpers.js#L1180-L1184`).
  2. **Register for the Tournament** each day. Registering locks today's team (`OptionsListAccount[511] ≤ tournamentDay` means not yet registered). Do the same for an active Raid (`[611]`).
  3. **Claim the Pet Mart free gems** when offered (`[516] < S`).
  4. Look at the day's Pet Mart rotation for a target from the Spend Plan below, and buy it if the Pet Crystals cover it.
  5. Recycle duplicate tradeable copies for Pet Crystals. Never recycle the last copy, and free pulls give 0.
  6. Idle or capped state: nothing to claim, and either no Spend Plan target is in today's Mart or crystals are short.
- **AFK Setup implications:** None directly, because pets are passive. Pets that multiply AFK gains (Axolotl +50%, Bored Bean +5%) or class EXP raise the value of every AFK Setup. Dedotated Ram and Mr Pig remove trips to the storage chest during a Play Session.
- **Min-max by stage (M unless cited):**
  - **Free-to-play in every stage:** claim the daily pull, register for the Tournament, and claim the Pet Mart gems every day. These cost nothing.
  - **Pet Crystal Spend Plan for W1-W4.** Buy targeted pets from the Pet Mart rather than gambling on treats, cheapest high-impact first: Sheepie 375 (from W2 Alchemy) → Flying Worm 500 → Gigafrog 600 → Crystal Custard 1,250 → Dedotated Ram 1,600 → Rift Jocund 2,900 (W1-W3 portal pushing) → Rift Slug 3,500 → Ancient Golem 3,800. Leek Spirit (1,250) and Biggole Mole (1,150) go up once W3 Equinox and the 3D Printer are running.
  - **Pet Bonus Token target:** pick something you cannot realistically pull or buy, because the token is refunded if you later get the pet. For W1-W4 combat and leveling, the strongest base bonuses on exclusives are Glunko The Massive (3x damage, 5x class EXP, 1.5x drop rate) and Mr Pig (2x friend bonuses, +2 friend slots, auto loot, storage anywhere, infinite teleports). Reddit commenters in June 2026 favoured King Doot, but its bonus is 0 before Divinity Lv 2 (W5). Do not spend the token on Abacus Frog, Pipsqueak or Glunko Supreme, which have no bonus (Reddit 1uc0az9, 2026-06-21, L).
  - **Gem buyers:** the cheap `bin_*` packs (Cryosnake $3.99: Upgrade Vault 50% cheaper; Clammie $4.99: +100% class EXP and drop rate) are the best value per dollar for an early account. This is the one place pets touch real money; it is never a requirement.
  - **W4 outline:** Crystal Capybara (Lab EXP), Wickerlight Spirit (meals), Pet+ on high-impact pets once you own 50+ pets and Mart+ appears. W5+ pets (King Doot, Samurai Guardian, sailing and W7 pets) are out of scope here.
- **Common mistakes (and detection):**

| Mistake | Detection |
|---|---|
| Not claiming the daily free pull | `companions.freeClaimAnchor + 594e6 < now`. Lifetime `totalBoxesOpened` (`_comp.x`) far below days played (sample accounts: 3 and 5) |
| Never claiming Pet Mart gems | `accountOptions[516] == 0` or `< tournament.global.S` |
| Not registering for the Tournament | `accountOptions[511] ≤ tournamentDay` with any pet owned |
| Unused Pet Bonus Token | `companions.tokens.remaining > 0` |
| Token spent on a pet with no bonus or an off-world bonus (e.g. W7 pets on a W2 account) | `tokens.usedIndices` checked against the table's W1-W4 value |
| Recycling the last copy of a useful pet | Pet absent from `list[i].acquired` after previously being owned (needs history) |
| Treat-gambling crystals instead of buying targets | Not visible in the save (M) |

- **Save and Toolbox fields:**
  - RTDB `_comp/{uid}` (fetched by Toolbox at `TB firebase/index.js#L139`; type `CompanionData`, `TB parsers/generated-firebase-types.ts#L789-L803`). Fields:
    - `l`: owned copies, each the string `"idx,tradable(1/0),?,?,level"`.
    - `e`: current follower `"idx,..."`.
    - `t`: free-claim anchor. It is not the claim time; it reads about 5.9 days old by design.
    - `s`: Pet Crystals.
    - `x`: total boxes opened.
    - `p`: pet storage cap (default 60).
    - `d`: dead legacy field.
    - `o`, `ub`, `y`, `z22`, `z23`, `zm`: meaning unknown.
  - Save `OptionsListAccount`:
    - `[605]`, `[615]`: token grants.
    - `[606]`: token-used pet list.
    - `[516]`: Pet Mart gems last claimed shop day.
    - `[496]`: tournament day.
    - `[511]`: tournament registered-through day.
    - `[611]`: raid registered-through day.
  - Parsed `account.companions` (`getCompanions`, `TB parsers/misc.ts#L1382-L1495`):
    - `list[i]` = `{acquired, viaToken, simulated, copies, tradableCount, nonTradableCount, upgradedCount, level, upgraded, bonus, tourPower, ...companions.json row}`
    - `totalBoxesOpened`, `currentCompanion`, `freeClaimAnchor`, `petCrystals`, `maxStorage`
    - `tokens {owned, used, remaining, usedIndices}`
  - Formulas test `isCompanionBonusActive(account, idx)` = `acquired` (owned or via token) and `isCompanionLvl2Active` = acquired with level ≥ 1, the game's `CompLV2` (`TB parsers/misc.ts#L1497-L1506`; N.js `_customBlock_Companions` @10790346 and `_customBlock_CompLV2` @10790729).
  - Tournament Pet Mart: `account.tournament.petMart {shopDay, petCrystals, offers[], plusOffers[]}`.
  - Toolbox alerts (`TB utility/dashboard/account.js#L258-L290`): `freeCompanion`, `petMartGems`, `tournamentRegister`, `raidRegister`.
- **Sources:** see consolidated list (S1-S12, S20-S24).

## Guild

- **What it is:** A player guild of up to 210 accounts. Members earn Guild Points (GP) from daily and weekly tasks plus a daily login grant. The leader spends GP on 17 guild-wide bonuses that every member gets in full, whichever bonus they mark as "Wanted" (wiki Guilds, rev 2026-10-07). Being in a guild also gives at least 2 Guild Giftboxes every week.
- **Unlocks:** You can join a guild at any level. Creating one needs a character at Lv 30: N.js shows "You're not in a guild yet. You can join someone else's at any time, or make your own after reaching Lv. 30!" (H, @6179945). The menu is Codex → Guild (Reddit 1vayhx0, 2026-07-30, L).
- **Scope:** Account-wide. All characters share one guild membership, and the guild's bonus levels are copied into the save as `Guild[0]`. Guild level, GP and member list live server-side in RTDB `_guild/{id}`.
- **Inputs → outputs:**
  - **GP in (per member account):**
    - Daily login: 10 GP, raised to 20 by the bribe *Guild VIP Fraud* and to 30 by *Guild GP Hack* (N.js @14028362 and @14029229; costs 400,000 and 2.5e9 coins).
    - The Bonus Ballot can add GP when its GP bonus is active (`VotingBonusz 4`).
    - Daily tasks: 5 per day, 10 GP each.
    - Weekly tasks: 4 per week, 30 GP each.
    - All GP passes through `contributeGP`, which applies the small-guild multiplier (H, N.js @15080684 and @7756747).
    - A completed task must be claimed in the Guild menu. Claiming requires being in a guild (`OptionsListAccount[37]` non-empty). Tasks auto-claim only when `OptionsListAccount[524] == 1`, whose source is unknown (H, N.js @7414199 and @7495504).
  - **Rough income per account:** about 60 GP a day plus 120 GP a week, so about 540 a week without bribes and about 680 with GP Hack. Double that if the guild has 10 or fewer members and the small-guild bonus is still at level 0 (M, arithmetic).
  - **GP out:** the leader levels bonuses. The next level costs `gpBaseCost + currentLevel × gpIncrease`, and the prerequisite bonus must have reached its required level (H, N.js `levelUpGuild` @7380855, `TB parsers/guild.ts#L149-L158`).
  - **Guild level** comes from total GP (unspent plus spent). Level L needs `100·(L−1)·1.21^(L−2)` total GP, up to a cap of 45. Max members = 30 + 4 × level (H, N.js `GuildMaxMembers` @6601164; `TB parsers/guild.ts#L55` and `#L108-L116`).
  - **Weekly Guild Giftboxes:** at least 2, plus extra chances from Guild Gifts. Contents include 25 or 69 gems, EXP potions, upgrade stones, Time Candy and a 0.2% trophy (wiki Guilds drop table). The Guild Gift item is also a Lab Jewel recipe ingredient, so save at least 2 (wiki Tips_and_Tricks, rev 2025-12-24).
  - **Achievements:** Guild Member (claim 500 GP) and Guild Higher-Up (contribute 3,000 GP), both Steam-exclusive gems (N.js @14712891).

### Guild bonuses (v1.23, `shared-data.json` `guildBonuses`, matches N.js `na.GuildBonuses` @14512390)

Value = `x1·L/(L+x2)` (`decay`). "Lv-up cost" is the GP for the next level at level L. "GP to Lv 10/25/max" is cumulative. Toolbox reads each value with `getGuildBonusBonus` (`TB parsers/guild.ts#L118-L122`).

| # | Bonus | Effect | Max Lv | Prereq | Lv-up cost | @Lv10 | @Lv25 | @Max | GP to Lv10 / 25 / max | Used by (Toolbox) |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | Guild Gifts | +% chance for an extra weekly Guild Gift | 100 | none | 10+40·L | 63.6% | 140% | 350% | 1,900 / 12,250 / 199,000 | weekly giftboxes |
| 1 | Stat Runes | + total all stats | 50 | Guild Gifts 2 | 20+60·L | 6.7 | 13.3 | 20 | 2,900 / 18,500 / 74,500 | stats |
| 2 | Rucksack | +% total carry cap | 50 | Stat Runes 4 | 20+70·L | 11.7% | 23.3% | 35% | 3,350 / 21,500 / 86,750 | `misc.ts#L1151` carry cap |
| 3 | Power of Pow | + weapon power | 50 | Rucksack 5 | 20+80·L | 1.7 | 3.3 | 5 | 3,800 / 24,500 / 99,000 | `damage.ts#L1124` |
| 4 | REM Fighting | +% fight AFK gain rate | 50 | Power of Pow 8 | 30+90·L | 1.7% | 3.3% | 5% | 4,350 / 27,750 / 111,750 | `character.ts#L3377` |
| 5 | Make or Break | +% production in town skills | 50 | REM Fighting 10 | 30+100·L | 5% | 10% | 15% | 4,800 / 30,750 / 124,000 | construction build speed, alchemy brew speed |
| 6 | Multi Tool | +% total skill efficiency | 50 | Rucksack 5 | 20+80·L | 5% | 10% | 15% | 3,800 / 24,500 / 99,000 | `efficiency.ts#L171` |
| 7 | Sleepy Skiller | +% skill AFK gain rate | 50 | Multi Tool 8 | 30+90·L | 1.7% | 3.3% | 5% | 4,350 / 27,750 / 111,750 | `character.ts#L3241` |
| 8 | Coin Supercharger | +% cash "for each world reached" | 100 | Sleepy Skiller 5 | 30+120·L | 6.7% | 11.1% | 16.7% | 5,700 / 36,750 / 597,000 | monster cash. The game multiplies by `1+floor(CurrentMap/50)`, i.e. by the world of the map the character is on (H, N.js @4045296) |
| 9 | Bonus GP for small guilds | +(100 − 200·L/(L+50))% GP if members ≤ 10+L | 50 | Guild Gifts 2 | 10+10·L | +66.7% (≤20) | +33.3% (≤35) | 0% (≤60) | 550 / 3,250 / 12,750 | `contributeGP` |
| 10 | Gold Charm | +% total drop rate | 50 | Guild Gifts 2 | 20+60·L | 6.7% | 13.3% | 20% | 2,900 / 18,500 / 74,500 | `character.ts#L2391` |
| 11 | Star Dazzle | + star talent points | 50 | Gold Charm 4 | 20+70·L | 20 | 40 | 60 | 3,350 / 21,500 / 86,750 | `talents.ts#L575` |
| 12 | C2 Card Spotter | +% card drop rate | 50 | Star Dazzle 5 | 20+80·L | 10% | 20% | 30% | 3,800 / 24,500 / 99,000 | cards |
| 13 | Bestone | +% stone upgrade success | 50 | C2 Card Spotter 8 | 30+90·L | 2.7% | 5.3% | 8% | 4,350 / 27,750 / 111,750 | upgrade stones (the only source of this, per wiki Tips_and_Tricks) |
| 14 | Skilley Skillet | +% skill EXP, all skills | 200 | Bestone 5 | 40+150·L | 2.3% | 5.2% | 18.8% | 7,150 / 46,000 / 2,993,000 | `character.ts` skill EXP (7 sites) |
| 15 | Craps | +% chance of an AFK reroll | 50 | Star Dazzle 5 | 20+80·L | 4.7% | 9.3% | 14% | 3,800 / 24,500 / 99,000 | AFK claim |
| 16 | Anotha One | +% chance of 2x EXP on AFK claim | 50 | Craps 8 | 30+90·L | 4.3% | 8.7% | 13% | 4,350 / 27,750 / 111,750 | AFK claim |
| 17 | Wait A Minute | nothing (max level 0) | 0 | Anotha One 5 | - | - | - | - | - | none |

### Guild tasks (`shared-data.json` `guildTasks`, N.js `ja.GuildGPtasks` @14157183; rotation flags from wiki Guilds)

| Slot | Task | Requirement | GP | Rotates |
|---|---|---|---|---|
| Daily (3 fixed) | Defeat Monsters (must be active) / W1 Daily Task / W2 Daily Task (the bottom-right taskboard task) | 300 / 1 / 1 | 10 each | No |
| Daily (2 rotating) | Choppin, Fishing, Catching or Mining minigame score (20/4/11/5), Pick up 300 item drops, Play W1 Colosseum or W2 Colosseum (entering counts), Defeat a World Boss, Sign a Post Office order, Play a Party Dungeon (must complete) | varies | 10 each | Yes |
| Weekly (3 fixed) | Defeat any Boss (20, minibosses count) / Claim a 5+ hour AFK gain (35 claims across characters) / Claim Guild Points (250) | as listed | 30 each | No |
| Weekly (1 rotating) | Collect 25 cards / Defeat 5 crystal mobs / Defeat 1 Chaotic boss / Play 4 Party Dungeons | as listed | 30 | Yes |

The wiki says login GP does not count toward "Claim Guild Points". In N.js the login grant calls `TaskProgress(0,5,"Guild",n)`, the same call that task claims use to advance task 5. **Conflict: the code suggests login GP does count** (M).

### Guild level thresholds (total GP, `TB parsers/guild.ts#L98-L116`)

| Guild Lv | 2 | 3 | 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 (cap) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Total GP | 100 | 242 | 709 | 4,135 | 16,685 | 58,734 | 192,431 | 603,099 | 1,833,987 | 5,456,431 | 15,967,010 |
| Max members | 34 | 38 | 46 | 66 | 86 | 106 | 126 | 146 | 166 | 186 | 210 |

Example: the sample W3 account's guild has 23 members, about 172k total GP, guild level 24 and bonuses at levels 6-30 (H, fixture aggregate).

- **Goals and Milestones:**

| Milestone | Why |
|---|---|
| Join any active guild | Instant access to every bonus the guild has already bought, plus weekly giftboxes |
| Guild Gifts Lv 2 | Unlocks the Stat Runes, Gold Charm and small-guild branches |
| Gold Charm 4 → Star Dazzle 5 → Craps 8 / C2 5 → Bestone 8 → Skilley Skillet 5 | The prerequisite chain to the skill EXP and AFK-luck bonuses |
| Stat Runes 4 → Rucksack 5 → Multi Tool 8 → Sleepy Skiller 5 → Coin Supercharger; Rucksack 5 → Power of Pow 8 → REM Fighting 10 → Make or Break | The prerequisite chain to efficiency, AFK and production |
| Bonus level 50 (= x2) | Half of the cap. Past this point cost per level keeps rising while value per level falls |

- **Feeds / fed by:**
  - Feeds: Talents (star points), Drop Rate, Cards, Carry Capacity, Skill Efficiency and EXP, AFK gains (fight and skill, rerolls, 2x EXP claims), Alchemy brew speed and Construction build speed, Upgrade Stones (Bestone), Lab Jewels (Guild Gift items), and gems (giftboxes).
  - Fed by: daily play (task actions), AFK claims, Colosseum, Post Office, minigames, Party Dungeons, World Bosses, Bribes (W1 Mr. Pigibank), and the Bonus Ballot.
- **Per-session actions:**
  1. Log in each day (the GP is automatic).
  2. Open Codex → Guild and claim every completed task. Raw `Guild[i]` has progress ≥ requirement and claimed flag `[1] == 0`.
  3. Clear the 2 rotating dailies when cheap. Entering a Colosseum or signing a Post Office order takes seconds.
  4. Each week, make sure the 35 five-hour AFK claims and 20 boss kills land. They are normally free from the AFK rhythm.
  5. A leader spends GP following the priority below.
  6. Capped state: all tasks claimed for the day or week.
- **AFK Setup implications:** "Claim 5+ Hour AFK gain" rewards AFK Stretches of 5 hours or more across characters. "Defeat Monsters" must be done actively, so finish it at the start of a Play Session (one active map clear of 300 kills).
- **Min-max by stage (M; the cost and value math is H):**
  - **Everyone, W1 onward: join an active guild rather than going solo.** A 30-member active guild earns about 16k GP a week, against about 1k for a solo player even with the doubler. The leader's choices matter more than anything you do. Pick a guild whose bonus levels are already high (Gold Charm, Star Dazzle, Multi Tool, Rucksack, Skilley Skillet) and that is not dead: members' `gpEarned` should be growing week to week. Many good guilds ask for a weekly GP minimum, which "only takes a few minutes a week" (wiki Tips_and_Tricks). A solo player in a Reddit thread (1ufjxji, 2026-06-25) reported 180k GP after years and "not even 25% maxed".
  - **Solo or small guild (10 or fewer):** keep Bonus GP for small guilds at **0**. Level it only when you need room for more members, and then only to (members − 10). Spread levels to about 10 each on the cheap early branches before going deep, because the decay curves give 1/6 of the cap at level 10 for 1/40 of the max-out cost.
  - **Leader priority for a W1-W4 guild (M):**
    1. Guild Gifts 2 (gate).
    2. Gold Charm (drop rate, every stage).
    3. Star Dazzle (20 star points at Lv 10 is a large early boost).
    4. Stat Runes 4 → Rucksack (carry cap, early inventory pain).
    5. Multi Tool (efficiency for every skill).
    6. C2 Card Spotter (cards feed W1-W3 card sets).
    7. Bestone (gear upgrades), then Skilley Skillet (skill EXP, cap 200, late sink).
    8. Make or Break once W2 Alchemy and W3 Construction matter.
    9. Coin Supercharger once characters farm W3-W4 maps (the multiplier scales with world).
    10. REM Fighting, Sleepy Skiller, Craps and Anotha One are small; fill them last.
    11. Guild Gifts beyond 2 only when gems and Jewels matter (W4 Lab).
  - **Members:** set your Wanted Bonus to the top of that list that is not yet high. It is only a signal to the leader.
  - **W4 outline:** Guild Gift items for Lab Jewels. Bonus levels plateau, so the remaining value is in Skilley Skillet and Coin Supercharger depth.
- **Common mistakes (and detection):**

| Mistake | Detection |
|---|---|
| Not in a guild | `accountOptions[37] == ""`, RTDB `_usgu/{uid}/g` null, Toolbox `guild.id` undefined and `members` empty. Do **not** use `guild.unlocked`, which is always true when signed in (`TB firebase/index.js#L150-L157` always builds `guildData`) |
| Completed tasks left unclaimed | Raw `Guild[1..9]`: `[2] ≥ requirement` and `[1] == 0`. Toolbox's `guildTasks` drops the claimed flag, so ActiveOn must read the raw value |
| Leveling "Bonus GP for small guilds" while at 10 or fewer members | Bonus 9 level > 0 with members ≤ 10 |
| Sitting in a dead guild | Member `gpEarned` flat across snapshots; guild total GP not rising (needs history) |
| Skipping the 3 fixed daily tasks | Daily `Defeat_Monsters` progress < 300 at reset (sample W2 account: 105) |
| Not buying the guild bribes once coins allow (+10 / +20 GP a day) | Bribe status (Bribes System) |

- **Save and Toolbox fields:**
  - Save `Guild` (JSON string). `[0]` = 18 bonus levels (the game reads values from `GuildTasks[0][i]`, N.js `_customBlock_GuildBonuses` @7756202). `[1..5]` = daily tasks and `[6..9]` = weekly tasks, each `[taskIndex, claimedFlag, progress]`.
  - Save `OptionsListAccount[37]` = guild name (empty if not in a guild).
  - RTDB `_usgu/{uid}/g` = guild id.
  - RTDB `_guild/{id}`:
    - `p` = unspent GP.
    - `m` = members map `{a: name, d: level, e: gpEarned, f: wanted bonus index, g: rank, b/c: unknown}` (`TB parsers/guild.ts#L124-L134`).
  - Firestore `_guildStat/{id}` `{stats, n, i}` is used only for Toolbox's guild leaderboards.
  - Parsed `account.guild` = `{unlocked, id, guildBonuses[i].{name, level, func, x1, x2, maxLevel, reqIndex, reqLevel, gpBaseCost, gpIncrease}, guildTasks.{daily[5], weekly[4]}.{task, requirement, gp, progress}, members[], maxMembers, level, levelReq, totalGp}` (`TB parsers/guild.ts#L57-L85`).
  - Toolbox has no guild alert. ActiveOn needs its own "tasks claimable" and "not in a guild" checks.
- **Sources:** see consolidated list (S1, S13-S19, S21-S23).

## Family bonuses

- **What it is:** Each class gives a "family bonus" to every character on the account. Its size scales with the level of the highest-level character whose class line contains that class (wiki Classes, rev 2026-10-13). Separately, "Family level" (Total Family LV) is the sum of all character levels. It unlocks character slots and Family obol slots.
- **Unlocks:** A class's family bonus starts when a character holds that class: at promotion (base classes Lv 10, threshold `x3` = 9), at subclass Lv 30 (`x3` = 29), at elite Lv 70 (`x3` = 69) and at master Lv 130 (`x3` = 129). The amount counts from `level − x3` (H, N.js `FamilyBonsuesREAL` @6532779, `TB parsers/family.ts#L13-L18`).
- **Scope:** Account-wide. One value per class is applied to all characters, including the giver. The one character-specific part is the elite talent **THE FAMILY GUY** (talent 144, on Blood Berserker, Divine Knight, Siege Breaker, Beast Master, Elemental Sorcerer and Bubonic Conjuror): "+{x}% larger Family Bonuses ... from bonuses given by this player", `decay` 40/100, so at most +40%. It amplifies that player's family bonuses only while **that player is the one being played**. The exceptions are the Divine Knight (refinery) and Siege Breaker (boat travel) bonuses, which always use the account's best Family Guy because those systems are account-wide (H, `TB parsers/family.ts#L19-L68`).
- **Inputs → outputs:** Character class and level go in; the per-class bonuses below come out. The game rebuilds `DNSM.FamBonusQTYs` (keyed `2 × classIndex`) for the played character. It walks characters in save order and, for each one, every class in its line. A character overwrites a class's stored value only if its raw value is higher (H, `TB parsers/family.ts#L41-L68`).

### Family bonus table (v1.23, `shared-data.json` `classFamilyBonuses`, matches N.js `ja.ClassFamilyBonuses` @13876472; wiki Classes agrees)

`decay`: `x1·n/(n+x2)`. `intervalAdd`: `x1 + floor(n/x2)`. `decayMulti`: `1 + x1·n/(n+x2)` (a multiplier). Here n = level − x3. Values are at the given character level (H, computed with `TB utility/wiki/growth.mjs#L9-L75`).

| Class (idx) | Bonus | Curve (x1, x2, x3) | Lv 50 | Lv 100 | Lv 150 | Lv 200 | Lv 250 | Cap | Used by (Toolbox) |
|---|---|---|---|---|---|---|---|---|---|
| Warrior (7) | + total STR | intervalAdd 1/5, 9 | 9 | 19 | 29 | 39 | 49 | none (+1 per 5 Lv) | stats |
| Archer (19) | + total AGI | intervalAdd 1/5, 9 | 9 | 19 | 29 | 39 | 49 | none | stats |
| Mage (31) | + total WIS | intervalAdd 1/5, 9 | 9 | 19 | 29 | 39 | 49 | none | stats |
| Journeyman (2) | + total LUK | intervalAdd 1/5, 9 | 9 | 19 | 29 | 39 | 49 | none | stats |
| Barbarian (8) | + weapon power | decay 25/100, 29 | 4.34 | 10.38 | 13.69 | 15.77 | 17.21 | 25 | `damage.ts#L1142` |
| Squire (9) | +% total HP | decay 40/100, 29 | 6.94 | 16.61 | 21.9 | 25.24 | 27.54 | 40% | `damage.ts#L1090` |
| Bowman (20) | +% EXP when fighting actively | decay 38/100, 29 | 6.6 | 15.78 | 20.81 | 23.98 | 26.16 | 38% | class EXP |
| Hunter (21) | +% efficiency, all skills | decay 30/100, 29 | 5.21 | 12.46 | 16.43 | 18.93 | 20.65 | 30% | `efficiency.ts#L142` |
| Wizard (32) | + star talent points | intervalAdd 1/6, 29 | 4 | 12 | 21 | 29 | 37 | none (+1 per 6 Lv) | `talents.ts#L573` |
| Shaman (33) | x higher golden food bonuses | decayMulti 0.4/100, 29 | 1.07x | 1.17x | 1.22x | 1.25x | 1.28x | 1.4x | `misc.ts#L923` |
| Maestro (3) | +% 3D Printer sample size | decay 6/100, 29 | 1.04 | 2.49 | 3.29 | 3.79 | 4.13 | 6% | `character.ts#L3022` |
| Blood Berserker (10) | +% total damage | decay 20/180, 69 | - | 2.94 | 6.21 | 8.42 | 10.03 | 20% | `damage.ts#L328` |
| Divine Knight (12) | +% refinery speed | decay 50/150, 69 | - | 8.56 | 17.53 | 23.31 | 27.34 | 50% | `world-3/refinery.ts#L121` (account-best Family Guy) |
| Siege Breaker (22) | +% faster minimum boat travel | decay 20/170, 69 | - | 3.08 | 6.45 | 8.7 | 10.31 | 20% | `world-5/sailing.ts#L375` (account-best Family Guy) |
| Beast Master (25) | +% all skill AFK gains | decay 5/180, 69 | - | 0.73 | 1.55 | 2.11 | 2.51 | 5% | `character.ts#L3236` |
| Elemental Sorcerer (34) | + levels for all talents above Lv 1 (floored) | decay 20/350, 69 | - | 1.63 | 3.76 | 5.45 | 6.82 | 20 | `character.ts#L519` |
| Bubonic Conjuror (36) | +% all stats | decay 5/180, 69 | - | 0.73 | 1.55 | 2.11 | 2.51 | 5% | stats |
| Voidwalker (4) | +% fighting AFK gains | decay 5/250, 69 | - | 0.55 | 1.22 | 1.72 | 2.1 | 5% | `character.ts#L3363` |
| Death Bringer (14) | +% kill per kill | decay 60/800, 129 | - | - | 1.53 | 4.89 | 7.88 | 60% | `damage.ts#L1528` |
| Royal Guardian (16) | +% drop rate multiplier | decay 10/800, 129 | - | - | 0.26 | 0.82 | 1.31 | 10% | `character.ts#L2556` |
| Wind Walker (29) | x coins from mobs | decayMulti 1.4/800, 129 | - | - | 1.04x | 1.11x | 1.18x | 2.4x | coins |
| Arcane Cultist (40) | +% total damage multiplier | decay 12/800, 129 | - | - | 0.31 | 0.98 | 1.58 | 12% | `damage.ts#L529` |

Beginner has no family bonus. Infinilyte and Spiritual Monk have data rows but are unreleased (`classPromotions.json` `released: false`). The game's display order is `ClassFamilyBonusDISPorder` = [7,19,31,2,8,9,20,21,32,33,3,10,12,22,25,34,36,4,14,16,26,29,38,40,5] (N.js @13878609).

### Family level unlocks

| Total Family LV | 8 | 30 | 70 | 150 | 300 | 500 | 750 | 1,100 | 1,500 | 5,000 |
|---|---|---|---|---|---|---|---|---|---|---|
| Character slot | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th | 9th | 10th | 11th |

Source: wiki Character_Creation, rev 2026-10-07. Toolbox's `newCharacters` alert implements the 5th → 11th thresholds (`TB utility/dashboard/account.js#L216-L240`). There are 24 Family obol slots, unlocking at account level 60, 80, 100, 160, 200, 250, 350, 400 (×2), 470, 650, 700, 875, 900, 1,150, 1,200, 1,250, 1,500, 1,750, 2,000, 2,100, 2,500, 3,000 and 5,000 (H, `shared-data.json` `obols.family`). Toolbox's `familyObols` alert flags empty unlocked slots (`TB utility/dashboard/account.js#L249-L256`).

- **Goals and Milestones:**

| Milestone | Effect |
|---|---|
| Each class promotion (Lv 10 / 30 / 70 / 130) | That class's family bonus turns on, for the account |
| Each subclass line represented once (Barbarian, Squire, Bowman, Hunter, Wizard, Shaman) + Journeyman line | Full W1-W3 family set |
| Character at about x2 + x3 levels (e.g. subclass Lv 129, elite Lv 219-419) | Half of that bonus's cap |
| Total Family LV 300 / 500 / 750 / 1,100 / 1,500 | 6th to 10th character slot |
| Family obol thresholds | New Family obol slot (fill it the same day) |

- **Feeds / fed by:**
  - Feeds: base stats and damage (all combat Systems), HP, class EXP, skill efficiency and AFK (all skills), star talent points, golden food (Gold Food), 3D Printer (W3), Refinery (W3), Sailing (W5), Talent levels (ES), and multikill (W6+).
  - Fed by: character leveling (class EXP sources: Pets, Guild, cards, Bowman's own bonus) and new character slots (Family level).
  - It reinforces itself: more characters means more Family level, which means more slots and obol slots.
- **Per-session actions:**
  - No direct action.
  - When a character crosses a promotion level, promote at once: the family bonus is 0 until the class is held.
  - Fill any newly unlocked Family obol slot.
  - When a character slot unlocks, make the missing class line.
  - Nothing here is idle; the only "capped" case is a fully covered class set.
- **AFK Setup implications:**
  - The family set wants every subclass line on the account, so AFK Setups should keep low characters leveling (e.g. a new Hunter on an EXP-dense map) rather than parking them.
  - Family bonuses on percentage stats grow fastest in a character's first 100 levels past the threshold. Bringing a new line to Lv 100 beats pushing a main from 200 to 250 for family value.
  - Play the character with THE FAMILY GUY when you want its bonuses amplified for that play (M).
- **Min-max by stage (M; the curves are H):**
  - **Early W1 (characters 1-3):** make Warrior, Archer and Mage. The wiki Classes page recommends exactly this, then a second W/A/M trio. Promote at Lv 10 and Lv 30 at once.
  - **Mid W1-W2 (characters 4-6):** pick the subclass your first trio did not, so all six subclasses are covered (e.g. Barbarian + Squire, Bowman + Hunter, Wizard + Shaman). Hunter (+% all-skill efficiency) and Squire (+% HP) are the most commonly skipped. Wizard's +1 star point per 6 levels is uncapped.
  - **Late W2-W3 (character 7+):** Journeyman (LUK). Maestro adds +% 3D Printer sample size, plus its own talents that give skill EXP and efficiency to the rest of the family when their skill levels are lower (N.js talent text @13894821). Elites at Lv 70:
    - Divine Knight for refinery speed (W3 Refinery). Its value uses the account-best Family Guy.
    - Blood Berserker for total damage.
    - Elemental Sorcerer for talent levels.
    - Beast Master and Bubonic Conjuror for small AFK or stat percentages.
  - **W4 outline:** keep every elite line moving toward about 200, where most elite bonuses reach 40-50% of cap. Masterclasses (Lv 130+) belong to W5-W7 dossiers.
  - **Per class:** a second character of a class line you already have adds **nothing** to family bonuses. Only make it for a non-family reason, such as a second Barbarian for fishing.
- **Common mistakes (and detection):**

| Mistake | Detection |
|---|---|
| Duplicate class line (wasted slot for family purposes) | Two `characters[].class` sharing a subclass, e.g. the sample W3 account's two Squires |
| Missing a subclass line | No character whose class line contains Hunter, Squire, Bowman, Barbarian, Wizard, Shaman or Journeyman (the sample W2 account lacks Hunter and Journeyman) |
| Not promoting at Lv 30 / 70 | `characters[].level ≥ 30` while the class is still a base class; ≥ 70 while still a subclass |
| Unfilled Family obol slots | Toolbox `familyObols` alert (`obols.list` entries without `displayName` where `accountLevel ≥ levelReq`) |
| Missing a character slot | Toolbox `newCharacters` alert (count vs `accountLevel` thresholds) |

- **Save and Toolbox fields:**
  - Inputs are only `characters[].class` and `characters[].level` (save `CharacterClass_i`, `Lv0_i[0]`) plus the THE_FAMILY_GUY talent levels.
  - Parsed `characters[i].familyBonuses`: a map from class name to value as that character sees it (`TB parsers/character.ts#L518`). Read it with `getCharacterFamilyBonus(character, CLASSES.X)` (`TB parsers/family.ts#L70-L71`).
  - `getFamilyBonusesOfActive` gives account-level values for the Refinery and Sailing (`TB parsers/family.ts#L76-L79`).
  - Family level = `account.accountLevel` (`TB parsers/index.ts#L301`).
  - Family obols = `account.obols.list` with `levelReq`.
- **Sources:** see consolidated list (S1, S25-S30).

### Sources

All game-data citations are v1.23 / 2.3.540 and were verified 2026-10-17 unless noted.

- S1. IdleonToolbox at commit 6827d3f (2026-10-17). The 2.3.540 update commit 15ce8a53 regenerated `companions.json` and `shared-data.json`. https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1
- S2. `TB data/website-data/companions.json` (178 rows).
- S3. `TB parsers/misc.ts#L1382-L1506` (getCompanions, isCompanionBonusActive, isCompanionLvl2Active).
- S4. `TB firebase/index.js#L139-L157` (RTDB `_comp`, `_usgu`, `_guild` fetch).
- S5. `TB parsers/generated-firebase-types.ts#L779-L803` (GuildData, CompanionData).
- S6. `TB utility/helpers.js#L1178-L1185` (free-claim anchor + 594e6 ms).
- S7. `TB utility/dashboard/account.js#L216-L290` (newCharacters, familyObols, freeCompanion, petMartGems, tournamentRegister, raidRegister).
- S8. `TB parsers/world-7/tournament.ts#L117-L141` (Pet Mart offers, prices in Pet Crystals).
- S9. Toolbox website-data bundles (the `bin_*` evolving packs, with pet index, gems and crystals).
- S10. N.js (v1.23, Last-Modified 2026-10-17), https://www.legendsofidleon.com/ytGl5oc/N.js: `_customBlock_Companions` @10790346 (King Doot needs Divinity Lv ≥ 2), `_customBlock_CompLV2` @10790729, `PetBonusTokensOwned` @10978993, Quest119 token drop @3469401.
- S11. Wiki Pets (formerly Companions), https://idleon.wiki/wiki/Pets, rev 2026-10-11, one patch before v1.23. Used for set membership, treat odds, Pet Mart list prices and Pet+ release dates. Stale-risk for odds and prices.
- S12. Wiki Pet_Mart, https://idleon.wiki/wiki/Pet_Mart, created 2026-10-14 (v1.22). Gives the Pet Mart+ condition and the shop day 240 rotation.
- S13. `TB parsers/guild.ts#L40-L158` and `TB data/website-data/shared-data.json` (`guildBonuses`, `guildTasks`).
- S14. N.js guild code: `na.GuildBonuses` @14512390, `ja.GuildGPtasks` @14157183, `_customBlock_GuildBonuses` @7756202, `_customBlock_contributeGP` @7756747, `levelUpGuild` call @7380855, login GP and bribes @15080684, task claims @7414199 and @7495504, `GuildMaxMembers` and level requirement @6601164, Coin Supercharger map multiplier @4045296, Lv 30 creation text @6179945, bribes @14028362 and @14029229, achievements @14712891.
- S15. Wiki Guilds, https://idleon.wiki/wiki/Guilds, rev 2026-10-07 (bot-drawn from game data; task rotation and giftbox table). Wiki Guild_Bonuses (same module).
- S16. Wiki Tips_and_Tricks, https://idleon.wiki/wiki/Tips_and_Tricks, rev 2025-12-24 (guild advice, Guild Gift jewel use). Stale-risk, but the mechanics are unchanged in code.
- S17. Reddit r/idleon "Is it possible to max out everything in a guild by yourself?", 2026-06-25, https://www.reddit.com/r/idleon/comments/1ufjxji/ (solo guild experience, L).
- S18. Reddit r/idleon "Guild bribes", 2026-07-30, https://www.reddit.com/r/idleon/comments/1vayhx0/ (Codex → Guild location; bribes from Mr. Pigibank, L).
- S19. Sangy and waktu "Legends of Idleon Newbie Guide" (Google Doc, self-described as not updated in 2 years, **Stale**): join at any level, create at Lv 30 (confirmed by N.js).
- S20. Reddit r/idleon "What companion pet should I get", 2026-06-21, https://www.reddit.com/r/idleon/comments/1uc0az9/ (Pet Bonus Token choices, L).
- S21. Reddit r/idleon "Daily free pet?", 2026-08-26, https://www.reddit.com/r/idleon/comments/1vzenw8/ (weekly to daily change, timer now 23 h, L).
- S22. Wiki Changelog_2026, https://idleon.wiki/wiki/Changelog_2026 (cached; covers up to v1.22, 2026-09-19): v1.05 rename to Pets, v1.19 Pet Bonus Token, v1.20 daily free pet, Pet Mart+, Raids, +1 token, v1.21 token refunds for Champion pets, v1.22 Champion Earls and new Pet Mart+ types. **No v1.23 entry** in the wiki yet.
- S23. Real parsed saves (W2 and W3 accounts, aggregates only): `/Users/yasser/Documents/Github/idleon-forge/fixtures/private/*.parsed.json`.
- S24. Reddit r/idleon "What do you think the best pet companion is and why?", 2026-06-20, https://www.reddit.com/r/idleon/comments/1uba5hn/ (Ram, Sheepie and Mr Pig QoL value, L).
- S25. `TB parsers/family.ts#L1-L79` and `TB parsers/character.ts#L518`.
- S26. `TB data/website-data/shared-data.json` `classFamilyBonuses`, `obols.family`; `TB data/website-data/classPromotions.json` (class indices); `TB data/website-data/talents.json` (THE_FAMILY_GUY, talent 144).
- S27. N.js `v._customBlock_FamilyBonsuesREAL` @6532779, `ja.ClassFamilyBonuses` @13876472, `ja.ClassFamilyBonusDISPorder` @13878609.
- S28. Wiki Classes, https://idleon.wiki/wiki/Classes, rev 2026-10-13 (family bonus formulas; "only the highest level character will provide the bonus"; recommended first six characters).
- S29. Wiki Character_Creation, https://idleon.wiki/wiki/Character_Creation, rev 2026-10-07 (character slot unlocks by Total Family Level).
- S30. `TB utility/wiki/growth.mjs#L9-L75` (growth curves `decay`, `intervalAdd`, `decayMulti`).
