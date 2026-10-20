# Trophies, nametags and premium hats (dossier, M26)

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). Paths below are relative to `packages/toolbox-parsers/vendor/` in the reference checkout (abbrev. `V/`). Tiers: 1 = game data/Toolbox code, 2 = Toolbox logic, 3 = wiki, 4 = community. Web search budget was exhausted this session, so tier 4 community sources are NOT covered (see Open questions); Min-max lines are derived from tier 1 numbers and tier 3 wiki.

## Trophies, nametags and premium hats

- **What it is:** Cosmetic-slot gear with real stats. 25 Trophies (equipment tab 2, one worn per character), 39 Nametags, and 96 Premium Helmets (Type PREMIUM_HELMET) [C1]. Before the W7 Gallery / W3 Hat Rack unlock they are just worn items giving their own stat lines. After unlock, worn copies stop counting; instead Trophies and Nametags are deposited in the account-wide Gallery and hats in the Hat Rack, each scaled by a multiplier [C2][C3].
- **Unlocks:** Worn-item behaviour is available from the start (trophy level reqs vary 1-600 [C4]). Gallery bonuses require the character to have cleared map index 250 (Spirit_Village per mapNames; the wiki calls the access point Codfrey / Shimmerfin) [C5][C6]. Hat Rack requires clearing map index 50 (YumYum_Grotto) [C7]. Both gates are checked per character; until cleared, TotalStats reads worn items and gives no gallery/rack bonus [C3].
- **Scope:** Account-wide once deposited (Gallery and Hat Rack apply to all characters that cleared the gate); per-character before that (worn slot). Tome counts (Trophies/Nametags Found, Premium Hats Found) are account-wide [C8].
- **Inputs -> outputs:** Inputs: obtained items (quests, events, gem shop, bundles, Tome, minigames), podium slots, Gallery Bonus Multi. Outputs: Weapon_Power, STR/AGI/WIS/LUK, Defence and up to two special lines (UQ1/UQ2, e.g. %_DROP_RATE, %_DAMAGE_MULTI, %_ALL_AFK_GAIN) fed into getStatsFromGear [C3][C9].
- **Goals and Milestones:** see tables in Mechanics catalogue (podium tiers, nametag stack multipliers, Tome milestones).
- **Feeds / fed by:** Fed by Tome rank (monthly nametags), Glimmerwick wish pity, Killroy shop, Clam Work, Jade Emporium, Sailing Deathskull artifact, Gem shop, Companions, Lab chip, Sushi, cards, bubbles. Feeds Tome score (3 metrics), damage (post-softcap EtcBonuses 72/75/104), drop rate, AFK gains, class EXP. Hat Rack is the W3 counterpart (extension: W7 Spelunk save array).
- **Per-session actions:** Check un-deposited trophies in inventory, empty podium slots, claimable Tome nametags this month, duplicate nametags (each duplicate raises the stack multiplier), a free podium upgrade source (event shop, bundles), and un-deposited premium hats.
- **AFK Setup implications:** None directly; the stats are passive. Worn trophy matters only on characters that have not cleared the gallery gate.
- **Min-max by stage:** see section below.
- **Common mistakes:** Throwing away duplicate nametags (each extra raises the multiplier up to 5) [C10]; leaving a high-value trophy in the 48 inventory slots at 0.3x instead of on a podium [C11]; forgetting the monthly Tome nametag claim; not depositing hats once the rack is available [C12].
- **Save and Toolbox fields:** see Mechanics catalogue.
- **Sources:** inline per claim; claims list at the end.

## Mechanics catalogue

1. **Item pool.** TROPHY 25 (Trophy1-25), NAMETAG 39, PREMIUM_HELMET 96, plus REPLICA_TROPHY 26 and REPLICA_NAMETAG 44 (display copies) [C1]. Field: `account.gallery.allTrophies / allNametags`, `account.hatRack.allPremiumHelmets`.
2. **Worn-item stat lines (pre-gate).** Each item has Weapon_Power/STR/AGI/WIS/LUK/Defence plus UQ1/UQ2 text+value; `getStatFromEquipment` returns the base stat if present, else UQ1+UQ2 when the name matches [C9]. Trophy/nametag/premium-hat items are skipped in equipment/tools sums when the gate is cleared [C3]. Level requirements `lvReqToEquip` e.g. King_of_Food 65, Blunder_Hero 50, Club_Maestro 70, Frost_Prince 120, One_of_the_Divine 450, Nebula_Royal 320, Heroic_Spirit 600 [C4].
3. **Gallery stat set.** Only these base stats scale in deposits: Weapon_Power, STR, AGI, WIS, LUK, Defence (`gameTables.galleryBonusStats`) plus UQ1/UQ2 [C13].
4. **Trophy slots.** Save array `rawSpelunk[16]` (field `Spelunk` in the save). Indices 0-47 = "inventory" trophies, each worth 0.3 x GalleryBonusMulti; indices 48+ = podium slots, count = PodiumsOwned [C11][C14].
5. **Podium count (`getPodiumsOwned`).** `min(19, 1 + ceil(Spelunk[13][4]/4) + min(1, JadeEmporium "Another_Gallery_Podium") + gemShopPurchases[40] + 2*[Lore bonus 5 unlocked] + min(2, Deathskull artifact bonus) + EventShop[26])` [C15]. Gem shop item GALLERY_SHOWCASES (globalIndex 40): max 6 purchases, 690 gems base cost [C16].
6. **Podium tier multipliers.** Tier 1 = 1.0x, Lv2 = 1.5x, Lv3 = 2.0x, Lv4 = 2.5x, all times GalleryBonusMulti; tiers are assigned from the top slots down (Lv4 first) [C11]. Lv4 count = min(1, companion 28 RIP_Tide) + min(1, RIP_Tide upgraded flag) + EventShop[29] + Deathskull (floor(acq/6) capped 1 + floor(acq/7) capped 1) + bundle `ban_m` [C17]. Lv3+ count = floor(gem purchases/3) + min(1, floor(Deathskull acquired/5)) + Lv4 [C17]. Lv2+ count = 2*ClamWork(0) + min(2, KillroyShop[3]) + companion 42 + floor(gem purchases/2) + Lv3+ + LegendTalent 9 + Deathskull term [C17].
7. **Gallery Bonus Multi (`getGalleryBonusMulti`).** `1 + (3*Spelunk[13][4] + (labchip16 ? 10 : 0) + 3*ClamWork(7) + KillroyShop(3) + min(20, bubble CODFREY_RULZ_OK) + min(cardLv w7a11, 10) + companion 49 (Bubba the Seal, 30 / 50 upgraded) + Sushi(54)) / 100` [C18].
8. **Nametag stacking.** Save array `rawSpelunk[17][i]` = copies deposited of nametag i (index 6 maps to `EquipmentNametag6b` Trash Tuna). Multiplier by copies owned: 1 -> 1.0, 2 -> 1.6, 3 -> 2.0, 4 -> 2.3, 5+ -> 2.5 (index capped at 4), times GalleryBonusMulti [C10][C19].
9. **Aggregation.** Bonus per stat name = sum over deposited items of value x multiplier, exposed as `account.gallery.trophyBonuses[]`, `nametagBonuses[]` ({name, value}); per-character versions at `character.gallery.*` (lab chip is per character). `getGalleryBonus(account, name, character)` = trophy + nametag value [C20].
10. **Tome count metrics.** `calcTrophiesFound` / `calcNametagsFound` count slab (`looty.lootyRaw`) entries whose name includes "Trophy" / "EquipmentNametag" [C21]. Tome entries: Trophies_Found x1=22, curve type 2 (linear, capped at 1.0), 700 pts max; Nametags_Found x1=20, curve 2, 700 pts; Premium_Hats_Found x1=75, curve 2, 700 pts, driven by hats deposited on the rack [C8][C22]. So 22 unique trophies, 20 unique nametags, 75 hats max out these rows.
11. **Monthly Tome nametags.** Rank tiers 0-6 (Top 50%, 25%, 10%, 5%, 1%, 0.5%, 0.1%) each unlock one nametag EquipmentNametag22..28; claimable count = rewardTier + 1 minus claimed. `accountOptions[447]` = claimed this period, `[448]` = month stamp (period = floor(GlobalTime / 2628000) s, roughly 30.4 days); mismatch resets claimed to 0 [C23][C24]. Gated by serverVars TomeOn = 1.
12. **Glimmerwick wish pity.** Quest114 wish can grant the Top 0.1% Tome nametag. Odds by tome tier top: 6 -> 1/30, 5 -> 1/40, 4 -> 1/50, 3 -> 1/60, 2 -> 1/70, 1 -> 1/80, 0 -> 1/90, unranked -> 1/120; guaranteed after 1/chance failures (`accountOptions[490]` = attempt counter) [C25].
13. **Trophy sources (tier 1 data).**
   - Quest rewards: Trophy6 Blunder Hero (Scripticus12, 3 Blunderhills completion tokens); Trophy1 King of Food (Picnic_Stowaway12, 30 Picnic Tokens); Trophy3 Club Member (Rocklyte3, "Become a Journeyman"); Trophy13 Club Maestro (Cactolyte4, "Become a Maestro"); Trophy11 YumYum Sheriff (Cowbo_Jones15, 3 desert tokens); Trophy22 Gladiator (Centurion8, finish Whimsical Colosseum W6); Trophy15 Frost Prince (Hoggindaz10); Trophy10 Critter Baron (Lord_of_the_Hunt11, many Shinies); Trophy17 One of the Divine (Tired_Mole3, Kattlekruk cape on Nightmare); Trophy19 Nebula Royal (Royal_Worm9, 25,000 Crystal Custards); Trophy23 Heroic Spirit (Potti7, Emperor Showdown 50) [C26].
   - Bundles: Trophy8 Trailblazer (bun_a), Trophy14 Beach Bro (bun_f) [C27].
   - Others per wiki only: Baller (Swishy Hoops 40+), Luckier Lad (Smithing recipe), Luckiest Lad (fishing enemy drops), Lucky Lad (monster drops), Master of Nothing (Fractal Island AFK, 1 in 100000 per hr of Nothing AFK per Toolbox islands bonus), Megalodon (fishing minigame), Nine Dart Finish (Throwy Darts), Ultra Unboxer (Guild Giftbox), Idle Skiller (crossover event), Dice Dynamo (special talents) [C28][C29]. Trophy4 I Made This Game and Trophy7 Original Gamer are unobtainable/legacy and excluded from the slab count [C30].
14. **Nametag sources.** Gem shop (cost gems; maxPurchases mostly 1): Nametag13 Timeless 2950 (Limited Specials), Nametag8 Summer Shovel 900 (max 2), Nametag3 Balling 750, Nametag12 Megafeather 850, Nametag19 Aethermoon 4000, Nametag5 Spring Flowers 490, Nametag10 3rd Anni 1000, Nametag11 Nightshade 750 [C31]. Bundles: Nametag1 Riftwalker (bun_n), Nametag7 Island Adventurer (bun_p), Nametag13 (bun_t), Nametag19 (bun_w), Nametag37 Grand Egg (ban_c), Nametags 15/16/17/20/31 (ban_j) [C27]. Quest: Nametag4 Vman (Nebulyte4, "Become a Voidwalker") [C26]. Trash Island shop: Nametag6b Trash Tuna [C32]. Monthly Tome: Nametag22-28 (mechanic 11). Seasonal/event (wiki): Falloween, Cropfall, Snowflake, Deadbones, anniversaries [C29].
15. **Nametag highlights by stat line (data).** Nametag41 All That Glitters: +250% XP from monsters, +50% class EXP multi, 50 LUK; Nametag12/13 Megafeather/Timeless: +20/+40 % damage multi; Nametag28 Tome Legend: +20 drop-rate multi and +20 AFK gains multi; Nametag19 Aethermoon: +80% all AFK gain; Nametag37 Grand Egg: +25% AFK gains multi, +25% bigger damage, 20 WP, 40 each stat, 70 DEF; Nametag31 Gingerbread: +30% damage multi, +50% total damage; Nametag33 Pot of Gold: +30 drop rate multi, +100% money [C33].
16. **Trophy highlights (data).** Trophy25 Luckiest Lad +777% drop rate; Trophy17 One of the Divine +42% drop rate, +35% total damage; Trophy23 Heroic Spirit +10% AFK gains multi, +20% damage multi; Trophy22 Gladiator +10% damage multi; Trophy24 Nine Dart Finish +9% drop rate multi, +9% AFK gains multi; Trophy18 Master of Nothing +10% all AFK, +70% skill exp; Trophy13 Club Maestro +35% skill EXP; Trophy19 Nebula Royal +50% skill EXP; Trophy20 Luckier Lad +50% drop rate [C34].
17. **Silkrode Motherboard (lab chip 16).** In-game text: doubles MISC bonuses of the equipped trophy; Toolbox applies it as a x2 on equipment slot 10's UQ/etc bonuses pre-gate and +10 to Gallery Multi post-gate [C18][C35].
18. **Premium helmets: Hat Rack (W3 area, saves in Spelunk[46]).** Rack multiplier `HatrackBonusMulti = 1 + (hatCount + companion 31 Wild Boar (15 / 25 upgraded) + 10*EventShop(30) + Minehead(21) + Sushi(36)) / 100` where hatCount = hats deposited, so every deposited hat adds +1%; all hat stats and UQ lines are multiplied by it. Only items with Type PREMIUM_HELMET, typeGen aHelmetMTX and lvReqToCraft != 69420 are eligible (tournament cosmetic hats 136-138 are not) [C36][C37]. Fields: `account.hatRack.{bonusMulti, hatBonuses, hatsUsed, allPremiumHelmets, totalHats}`.
19. **Premium hat highlights (data).** EquipmentHats127 Seal Team Skipper +100% drop rate; Hats114 True Crown +150% class EXP multi; Hats132 Time Traveler Top Hat +30 class EXP multi and +30 bonus kills; Hats115 Celebration Mane / Hats124 Alpine Beanie +10 damage multi; Hats81 Siege Captain Cap +10% drop; Hats112 Deathbringer Hood +25% extra bones; Hats122 Arcanist Crown +25% extra tachyons; Hats118 Windwalker Hood +25% dust multi [C38].
20. **Damage pipeline hook.** Trophy/nametag/hat sums enter post-softcap multipliers via getStatsFromGear(72, 75, 104) (%_DAMAGE_MULTI, %_DAMAGE_BONUS, etc.) [C39]. The Prisma multiplier (tesseract.ts getPrismaMulti) adds +10 if Trophy23 was ever found via hasItemDropped; it is a Prisma bonus, not a Tesseract upgrade [C40].

21. **Replica Trophy/Nametag items.** REPLICA_TROPHY (26) and REPLICA_NAMETAG (44) are display items (lvReq 1) and are in GALLERY_ITEM_TYPES, so once the gallery is active worn replicas stop giving their own stats. The Gallery only reads Trophy<N> and EquipmentNametag<N> ids, so replicas add nothing to it [C43]. Confidence M.
22. **Equip vs deposit.** Only one trophy is worn at a time (equip tab 2); depositing into Spelunk[16] is separate. Achievements TaskAchB40 (Two Desserts) and TaskAchA45 Two-Time Savior (equip Blunder Hero with another in inventory, reward 5% faster Blunder Hills respawn) test duplicate-trophy conditions, and limited trophies are excluded from "My First Trophy" [C44][C42]. Confidence M.
23. **Gate fallback.** isMapClearedBy returns true when `character.kills` is absent, so the gate check is permissive on partial data [C45]. Confidence H.
24. **Spelunk[16] layout and podium grades.** Indices 0-47 are inventory trophies (0.3x), 48+ are podiums (empty slots exist), count capped at 19. Gallery podium grades are Featured / Masterpiece / World Class (wiki names for Lv2/3/4) and the Deathskull artifact gives a Featured slot. Grade sources: event shop 29 (Lv4), Deathskull artifact acquired >=5/6/7, Pet Mart+ companion 28 CompLV2 flag, legend talent 9, clam work 0, killroy shop 3 [C46][C17]. Confidence M.
25. **Multiplier inputs by index.** HatrackBonusMulti: event shop 30, Minehead 21, Sushi 36. GalleryBonusMulti: event shop 26, Clam Work 7, Killroy shop 3, Sushi 54. These need save fields in Account State [C18][C36][C47]. Confidence M.
26. **Tome Premium_Hats_Found** counts rack deposits (hatRack.totalHats = Spelunk[46].length), not slab finds, unlike trophies/nametags; each deposited hat also adds +1% to HatrackBonusMulti [C8][C36]. Confidence H.
27. **Hat acquisition and bonus ordering.** Gem shop rotating hats with "+1 Hat Rack multi" (Dainty Brim, Celebrate Mane, Strawberry), the Hat Premiumifier (rawName Ht, 250 gems, globalIndex 100) and the Premium Hat Swapper Stone. Gem shop nametags and hats carry firstSeen/lastSeen, so "buyable now" needs a freshness flag. Hat bonus totals are ordered by HAT_BONUS_ORDER (base stats first, then etcBonuses by id). Tournament hats (Hats136-138, lvReqToCraft 69420) are excluded from the rack [C48][C36]. Confidence M.
28. **Tome nametag gating.** Claim requires serverVars.TomeOn === 1; available = rewardTier + 1 - claimed. Wiki reset interval: 30 days ~ 10h (Tome page) vs code 2628000 s (about 30.4 days) [C23]. Confidence M.
29. **Silkrode details.** Chip 16 also gives +10 Gallery Bonus Multi only when a character is passed. It doubles only the UQ/etc bonus of the slot, and only on the pre-gate worn-item path [C35]. Research grid 172 Well_Dressed multiplies the first MISC bonus of the attire slot (15) in getStatsFromGear [C49]. Confidence M.
30. **Unobtainable event items.** Event nametags and capes such as Lava's Awesome Nametag are unobtainable now (wiki Nametags page, tier 3, 2026-10-19, undated). Confidence L.

### W5+ extensions (one line each)
- W5 Sailing: Deathskull artifact adds trophy podium slots and tiers; sailing artifact text "+1/+2 Gallery slots for Trophies" [C15][C41].
- W6: Trophy22 Gladiator quest needs the W6 colosseum; Nametag34 Emerald gives +25% kills in World 6 [C26][C33].
- W7: Gallery, Clam Work, Killroy, sushi, cards, lore and Spelunk all feed the multiplier; Nametag36/42 give %_KILLS_IN_WORLD_7 [C18][C33].
- Hat Rack (W7 Spelunk save, `world-3/hatRack.ts`): described in mechanic 18, extension only [C36].

## Min-max by stage

The wiki gives no ordered meta; community (tier 4) sources were not reachable this session. The ordering below is derived from tier 1 numbers and labelled as derivation, confidence L-M.

- **W1 early:** Wear any trophy you have; the "My First Trophy" achievement needs one equipped (reward 25 gems + 4hr candy) [C42]. Quest trophies reachable early: Blunder Hero (W1, level 50) and Club Member (W2 Journeyman, level 1) [C26][C4]. Derived confidence L.
- **W1 mid/late:** King of Food (65), Club Maestro (70, +35% skill EXP), YumYum Sheriff (90) as levels allow [C4]. Pick by character job: skill-EXP trophy on skillers, Lucky Lad/Luckier Lad for drop rate on farmers.
- **W2:** Luckier Lad (+50% drop rate, Smithing recipe) is the strongest early drop trophy [C34][C29]. Cheap gem shop nametags: Balling (+40% drop, 750 gems), Spring Flowers (+15% skill EXP, 490), Megafeather (+20% dmg multi, 850) [C31]. Derived.
- **W3:** Frost Prince, One of the Divine (+42% drop, +35% total damage, level 450) and Nebula Royal. Hat Rack opens at YumYum_Grotto clear (map 50), after which every owned hat gives its stats times the rack multi, so deposit all premium hats [C7][C36]. Derived.
- **W4:** Tome unlocks the monthly nametag stream (Top 50% needs the lowest tier); Nametags Found and Trophies Found give up to 700 Tome points each at 20 and 22 unique items [C22][C23]. Gladiator/Heroic Spirit come with later worlds.
- **W5-W6 outline:** Gladiator (+10% damage multi), Heroic Spirit (level 600). Gallery access (map 250) is the real step change since podium trophies scale 1.0x-2.5x [C11][C5].
- **W7 gallery priority (derivation from formulas):** (a) Put the highest-value trophies on the highest-tier podiums; Luckiest Lad (777% drop) and One of the Divine are top on a Lv4 slot. (b) Raise stack counts of the best nametags toward 5 copies (2.5x) only where the extra copy is cheap (Tome and gem-shop duplicates); going 1->2 copies is +0.6x, 4->5 only +0.2x [C19]. (c) Raise Gallery Bonus Multi (Clam Work, Bubba, cards, bubble cap 20, card cap 10) since it multiplies everything [C18]. Slot sources order by effort: event shop, gem shop (6 buys, 690 gem base), Deathskull artifact, Jade Emporium [C15][C16].

## Claims

(see structured output for the full list with sources and tiers; ids C1-C42)

- [C1] Item counts in items.json: PREMIUM_HELMET 96, REPLICA_NAMETAG 44, NAMETAG 39, REPLICA_TROPHY 26, TROPHY 25. Source: V/data/website-data/items.json (Type field), T1, 2026-10-19, game 2.3.540. Confidence H.
- [C2] Gallery and Hat Rack replace worn-item stats for TROPHY/NAMETAG/REPLICA_* and PREMIUM_HELMET. Source: V/parsers/items.ts#L11,L82-L100 (T1). Confidence H.
- [C3] Until the character clears the unlock map, TotalStats reads worn items and gives no gallery/rack bonus. Source: V/parsers/items.ts#L82-L86 (T1). Confidence H.
- [C4] Level requirements: King_of_Food 65, Blunder_Hero 50, YumYum_Sheriff 90, Club_Maestro 70, Frost_Prince 120, Idle_Skiller 99, One_of_the_Divine 450, Nebula_Royal 320, Heroic_Spirit 600, most others 1. Source: V/data/website-data/items.json (lvReqToEquip) (T1). Confidence H.
- [C5] GALLERY_UNLOCK_MAP = 250; isGalleryActive = map cleared. Source: V/parsers/world-7/gallery.ts#L80-L83 (T1). Confidence H.
- [C6] **Disputed (real source disagreement, kept both views).** mapNames[250] = Spirit_Village; the wiki says access is via Codfrey (Shimmerfin Grove) after Shimmerfin Deep. Sources: V/data/website-data/shared-data.json mapNames (T1) vs https://idleon.wiki/wiki/Gallery (T3). Disagree on naming; confidence L on the exact map. Confidence L.
- [C7] HAT_RACK_UNLOCK_MAP = 50 (YumYum_Grotto). Source: V/parsers/world-3/hatRack.ts (HAT_RACK_UNLOCK_MAP), shared-data.json mapNames (T1). Confidence H.
- [C8] Tome entries Trophies_Found (x1 22, x2 2, x3 700), Nametags_Found_ (20, 2, 700), Premium_Hats_Found_ (75, 2, 700). Source: V/data/website-data/shared-data.json tomeData (T1). Confidence H.
- [C9] getStatFromEquipment returns base stat else UQ1+UQ2 when names match. Source: V/parsers/items.ts#getStatFromEquipment (T1). Confidence H.
- [C10] Nametag multiplier depends on copies deposited; wiki says max 5 per type with 100/160/200/230/250%. Sources: V/parsers/world-7/gallery.ts#getNametagMultiplier (T1); https://idleon.wiki/wiki/Gallery (T3). Agree, H. Confidence H.
- [C11] Inventory trophies 0.3x; podium Lv1/2/3/4 = 1/1.5/2/2.5x times GalleryBonusMulti. Source: V/parsers/world-7/gallery.ts#L98-L127 (T1); wiki gives tiers 30/100/150/200/250% (T3). Agree, H. Confidence H.
- [C12] Hat Rack stats multiplied by HatrackBonusMulti. Source: V/parsers/world-3/hatRack.ts#getHatBonuses (T1). Confidence H.
- [C13] galleryBonusStats = Weapon_Power, STR, AGI, WIS, LUK, Defence. Source: V/data/website-data/shared-data.json (T1). Confidence H.
- [C14] Trophies in Spelunk[16] (48 inventory + podiums); nametags Spelunk[17]; hats Spelunk[46]. Source: gallery.ts#getTrophyBonuses, hatRack.ts (T1). Confidence H.
- [C15] getPodiumsOwned formula (cap 19). Source: gallery.ts#getPodiumsOwned (T1); wiki lists Deathskull +1, gem shop +1 per buy, Skuumbus +2, Legend Talent (T3). Confidence H.
- [C16] Gem shop GALLERY_SHOWCASES: globalIndex 40, cost 690, max 6; text 30% -> 100%, every 2nd boost 150%, every 3rd 200%. Source: V/data/website-data/gemShop.json (T1). Confidence H.
- [C17] Lv2/Lv3/Lv4 podium count formulas. Source: gallery.ts#getLv2/3/4PodiumsOwned (T1). Confidence M.
- [C18] GalleryBonusMulti formula. Source: gallery.ts#getGalleryBonusMulti (T1). Confidence H.
- [C19] galleryNametagMultipliers = [1, 1.6, 2, 2.3, 2.5]. Source: shared-data.json gameTables (T1). Confidence H.
- [C20] Aggregation and per-character gallery objects. Source: gallery.ts#getCharacterGalleryBonuses, getGalleryBonus (T1). Confidence H.
- [C21] calcTrophiesFound/calcNametagsFound count slab entries by substring. Source: V/parsers/items.ts#L330-L346 (T1). Confidence H.
- [C22] Curve type 2 is linear capped at 1. Source: V/parsers/world-4/tome.ts#calcPointsPercent (T1). Confidence M.
- [C23] Tome nametag claim logic and period. Source: V/parsers/world-4/tome.ts#L96-L110,L143-L151 (T1). Wiki: Top 50/25/10/5/1/0.5/0.1%, reset about 30 days (T3, https://idleon.wiki/wiki/Tome). Confidence H.
- [C24] **Disputed (real source disagreement).** Wiki lists a different count source: another wiki page says Tome-series nametags are no longer obtainable; Toolbox 2.3.540 still computes monthly claims. Sources: https://idleon.wiki/wiki/Nametags (T3) vs tome.ts (T1). Confidence M for Toolbox (newer code). Confidence M.
- [C25] Glimmerwick wish chances. Source: tome.ts#getTomeWishChance (T1). Confidence M.
- [C26] Quest trophy/nametag rewards. Source: V/data/website-data/quests.json (T1). Confidence M.
- [C27] Bundle contents. Source: shared-data.json itemSources.bundles (T1). Confidence H.
- [C28] Fractal Island: 1 in 100000 chance for Trophy per hour of Nothing AFK. Source: V/parsers/world-2/islands.ts#L47 (T1). Confidence H.
- [C29] Acquisition of other trophies and event nametags. Sources: https://idleon.wiki/wiki/Trophies and /Nametags (T3), checked 2026-10-19, undated pages. Confidence L.
- [C30] filteredLootyItems includes Trophy4 and Trophy7; wiki marks them unobtainable. Sources: parseMaps.ts#L242-L268 (T1); wiki Trophies (T3). Confidence M.
- [C31] Gem shop nametag prices. The numbers are nametag ids, NOT gemShop globalIndex (globalIndex values collide at 88-94 in gemShop.json). Summer Shovel max purchases 2. Most are rotating entries (lastSeen 2.3.493-2.3.523, before 2.3.540), so not all are buyable now. Source: V/data/website-data/gemShop.json (T1). Confidence M.
- [C32] Trash Island shop sells Nametag6b. Source: shared-data.json itemSources.trashIsland (T1); islands.ts#L205 (T1). Confidence H.
- [C33] Nametag stat lines. Source: items.json (T1). Confidence M.
- [C34] Trophy stat lines. Source: items.json (T1). Confidence M.
- [C35] Silkrode chip: text in shared-data.json chips (index 16); used in items.ts (+10 gallery in gallery.ts). Source: items.ts, shared-data.json (T1). Confidence H.
- [C36] HatrackBonusMulti formula and eligibility. Source: hatRack.ts#getHatRackBonusMulti, isHatRackEligible (T1). Confidence H.
- [C37] Hat deposit eligibility filter mirrors the game's N.js:118436. Source: hatRack.ts comment (T2). Confidence M.
- [C38] Premium hat stat lines. Source: items.json (T1). Confidence M.
- [C39] Post-softcap damage uses getStatsFromGear 72/75/104. Source: V/parsers/damage.ts#L478-L486 (T1). Confidence H.
- [C40] Prisma multiplier (tesseract.ts getPrismaMulti, not a Tesseract upgrade) adds +10 if Trophy23 was ever found (hasItemDropped). Source: class-specific/tesseract.ts#L577 (T1). Confidence H.
- [C41] Sailing artifact strings mention Gallery slots for Trophies. Source: V/parsers/world-5/sailing.ts#L957-L959 (T1). Confidence H.
- [C42] Achievement "My First Trophy!" TaskAchB23 and "Two-Time Savior". Source: V/data/website-data/achievements.json (T1). Confidence H.
- [C43] Replicas are in GALLERY_ITEM_TYPES; gallery reads only Trophy<N>/EquipmentNametag<N>. Source: items.ts#L11, gallery.ts (T1). Confidence M.
- [C44] TaskAchB40 Two Desserts and TaskAchA45 duplicate-trophy conditions; limited trophies excluded from My First Trophy. Source: achievements.json (T1). Confidence M.
- [C45] isMapClearedBy returns true when character.kills missing. Source: items.ts (T1). Confidence H.
- [C46] Spelunk[16] layout, podium cap 19, grade sources. Source: gallery.ts (T1); wiki Gallery (T3). Confidence M.
- [C47] Multiplier inputs: event shop 26/30, Minehead 21, Sushi 36/54, Clam Work 7, Killroy shop 3. Source: gallery.ts, hatRack.ts (T1). Confidence M.
- [C48] Gem shop hats, Hat Premiumifier (Ht, 250 gems, globalIndex 100), firstSeen/lastSeen, HAT_BONUS_ORDER. Source: gemShop.json, hatRack.ts (T1). Confidence M.
- [C49] Research grid 172 Well_Dressed on slot 15 MISC bonus. Source: items.ts getStatsFromGear (T1). Confidence M.

## Open questions
- Community meta (tier 4: r/idleon, guides) could not be fetched; web search budget exhausted. Min-max is derived, not community-verified.
- Which map is the real Gallery gate: Toolbox says index 250 (Spirit_Village by mapNames), wiki says Shimmerfin Deep/Codfrey.
- Source of Lucky Lad, Ultra Unboxer, Dice Dynamo, Idle Skiller is wiki-only; no tier 1 item source found.
- "+1 Trophy per Weekly Battle boss kill" reward text in shared-data.json (Killroy-related task list) is unclear: possibly a Trophy currency, not a gear trophy.
- Whether Tome nametags are still obtainable (wiki conflict, see C24).
- Existing ActiveOn KB has no gallery, nametag or hat rack entries (only weekly-battles mentions); a Tome nametag claim detector is a gap.
