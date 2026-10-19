# Alchemy: Liquids, Liquid Shop, Pay 2 Win, Ivory and Bleach cauldrons

Dossier for the M26 research workflow. Verified 2026-10-19 against IdleOn Toolbox pin 6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1 (game 2.3.540). Path shorthand: `TB:` = `packages/toolbox-parsers/vendor/` in the idleon-forge checkout (upstream `https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/`). Earlier research (`origin/research/w2-systems`, pinned to Toolbox 6827d3f2) was re-checked against the newer pin; differences are called out. Confidence H/M/L after claims where sources disagree or only one weak source exists.

## Alchemy Liquids (liquid cauldrons, decant, Liquid Shop, Pay 2 Win, Ivory and Bleach cauldrons)

- **What it is:** four liquid cauldrons that fill a bar over time up to a cap [C1][C4]. Liquid is the second ingredient of every bubble and vial level and the currency of the Liquid Shop [C35]. Pay 2 Win (coins) and the Gem Shop's Ivory (bubble cauldrons) and Bleach (liquid cauldrons) add speed, capacity and seats.
- **Unlocks:** Water Drops at Alchemy 1, Liquid N2 at 20, Trench H2O at 35, Toxic Hg at 80 (highest Alchemy level on the account) [C2]. Liquid Shop 2 opens with Trench at 35 [C38]. Each character must first visit the W2 town cauldron (see the alchemy-bubbles dossier).
- **Scope:** liquids, caps, decant levels, Pay 2 Win and the shop are account-wide. Only the seat (activity 4 to 7) is per character [C5].
- **Inputs to outputs:** time plus seated characters make liquid [C25]. Liquid is spent on bubbles (`base + floor(L/20)` per level) and vials (`3 x level`) [C39], on decant upgrades [C26], and in the shop [C35].
- **Goals and Milestones:**

  | Threshold | What happens | Claim |
  |---|---|---|
  | Alchemy 1 / 20 / 35 / 80 | Water / N2 / Trench / Toxic Hg open | [C2] |
  | P2W Regen Lv 100, Capacity Lv 80 per liquid | Regen max +200%, Capacity max +80 flat | [C31][C33] |
  | Bleach 1st..4th (Gem Shop, in order) | 1.5x cap and 1.5x regen for liquid 1..4, +1 seat | [C19] |
  | Dragonic (limited Gem Shop) | 2x cap, 1.3x regen on the 1st free slot | [C20] |
  | Spontaneity Salt Lv 100 | +100% liquid rate and cap per wiki/data text; Toolbox applies it to capacity only, on Bleach/Dragonic liquids (disputed, M17) | [C23][C54][C55] |
  | Peculiar Vial sigil tiers (W4 Lab) | +15/25/35/50/65% regen | [C22] |
  | Viaduct of the Gods (W4 Lab) | x5 cap, -30% regen | [C15] |
  | Shop Talent Point Tab 2 / Tab 3 (never reset) | permanent talent points | [C37] |
- **Feeds / fed by:** feeds Alchemy Bubbles, Vials, obols, gems, talent points, Menagerie shells. Fed by vials (Barium Mixture, Tea With Pea, 40-40 Purity caps; Jungle Juice regen) [C10], the Da Daily Drip bubble [C12], stamps [C13], Arcade [C14], meals [C16], alchemy mastery [C17], Salt Lick [C23], sigils [C22], Lab [C15] and the Gem Shop [C18][C19][C20].
- **Per-session actions:** spend any liquid near cap before leaving, since the bar stops filling when full [C4]. Buy the day's first One Measly Gem and A Pair of Gems (price still at base) [C36][C40]. Buy a Talent Point when Water allows [C37]. Buy Bargain Tags before a large bubble upgrade [C40]. Seat a character on any unstaffed unlocked liquid [C5][C6]. Hold Decant on Cap/Rate to convert spare liquid to permanent levels [C26][C29]. Capped state: `account.alchemy.liquids[i] >= account.alchemy.liquidCauldrons[i].maxLiquid`.
- **AFK Setup implications:** a liquid seat is a Parallel Slot, alongside the AFK Target. It earns the seated character 2x Alchemy EXP versus a bubble cauldron [C6], and a character cannot be in a bubble cauldron and a liquid at once [C7]. Bleach adds +1 seat per bought cauldron [C19].
- **Min-max by stage:** see "Min-max by stage" below.
- **Common mistakes:** liquid sitting at cap; daily gem buys missed; Talent Point never bought; Gem Shop Bleach bought out of order or all four at once (community says only the first matters early) [C19]; Player P2W upgrades not raised after Alchemy level-ups [C34]; relying on Toolbox's `liquids` alert, which cannot fire at this pin [C41].
- **Save and Toolbox fields:** see "Mechanics catalogue" (each mechanic lists its exact path).
- **Sources:** all claims below; Toolbox is tier 1/2 per ADR 0004.

## Mechanics catalogue

Paths are in `TB:parsers/world-2/alchemy.ts` unless stated. "W5+" notes are single lines at the end of each mechanic.

### M1. Liquid roster and cap-bar
- **Rule:** four liquids in save order Water Drops, Liquid N2, Trench H2O, Toxic Hg [C1]. Bar stops filling at `maxLiquid` [C4].
- **Unlock:** highest Alchemy level 1/20/35/80 [C2]. Not located in Toolbox code; the game gate is a gap (open question 1).
- **Field:** current amounts `account.alchemy.liquids[0..3]` (raw `CauldronInfo[6]`) [C3]; cap `account.alchemy.liquidCauldrons[i].maxLiquid` [C8].
- **W5+:** none new; Toxic Hg is used by W6+/W7 vials and the Luminous Shell shop item [C37].

### M2. Seats (assignment)
- **Rule:** `CauldronJobs1[charIndex]` is the activity: 0..3 bubble cauldron, 4..7 liquid 0..3, >= 100 sigil, -1 none [C5]. Seated liquid characters speed regen and earn 2x Alchemy EXP [C6]; a character cannot be in a bubble cauldron and a liquid at once [C7].
- **Seat count:** base one seat per cauldron is not parsed; Bleach adds +1 [C19]; Ivory (bubble cauldrons) adds +2 [C21].
- **Field:** `account.alchemy.activities[i].{activity,index}`; `account.alchemy.p2w.liquids[i].players` [C5].
- **Code quirk:** `liquidMapping` only maps liquids 0..2 (activities 4..6), so `p2w.liquids[3].players` (Toxic Hg, activity 7) is always empty [C5].
- **W5+:** sigil activities (>= 100) use the same array.

### M3. Liquid capacity formula
- **Rule:** `maxLiquid = ceil((1 + bleach/dragonic + (meal% + 5 x mastery)/100) x Viaduct x (10 + decantCap + vial + P2Wcap + DaDailyDrip x max((AlchLvTotal/25)^0.3, 0) + stamp + ceil(arcade)))` [C8].
- **Components:** base 10; decant Cap level `round(level)` [C9]; vial per-liquid cap [C10]; P2W Capacity level (+1 per level, max 80) [C11]; Da Daily Drip bubble [C12]; stamp [C13]; Arcade [C14]; Viaduct [C15]; meal [C16]; mastery [C17]; Bleach/Dragonic/Salt Lick [C18].
- **Field:** `liquidCauldrons[i].maxLiquid` and `.maxLiquidBreakdown`.
- **W5+:** Black Diamond Rhinestone jewel and the Spelunker obol/lab gem multiplier scale the meal term [C16]; the alchemy-mastery tier is a Rift (W4+) unlock [C17].

### M4. Liquid regeneration
- **Rule:** Toolbox does not compute a regen rate; only the modifiers are listed in data [C25]. Known modifiers: P2W Regen level (`decay 400/100`, up to +200) [C33], Jungle Juice vial +1% per vial level [C10], Drippy Drop stamp [C13], Peculiar Vial sigil [C22], Spontaneity Salt [C23], Bleach 1.5x [C19], Dragonic 1.3x [C20], Viaduct -30% [C15], Decant Rate level [C26].
- **Field:** no parsed rate. ActiveOn observes Water per hour from consecutive saves (`packages/knowledge/detectors/alchemy/liquid-cap.ts`) [C25].
- **W5+:** none found.

### M5. Decant (Cap and Rate)
- **Rule:** each liquid cauldron has a Cap track and a Rate track; spending liquid fills `progress` toward `req(L+1) = floor(1.6 + (1.25 x (L+1))^1.8)` and raises the level [C26][C27]. Cap level gives `+round(level)` flat cap [C9]. The Rate level effect formula is not in Toolbox (open question 2).
- **Cap:** no max level in Toolbox for decant (open question 3).
- **Field:** `liquidCauldrons[i].decantCap.{level,progress,req}`, `.decantRate.{level,progress,req}`; raw: `account.alchemy.cauldronsInfo.slice(18)`, entry `[i*4]` = Cap `[progress, level]`, `[i*4+1]` = Rate [C26] (raw `CauldUpgLVs`/`CauldUpgXPs` or `CauldronInfo[8]`).
- **Cumulative requirement:** levels 1..50 cost 31,418 progress, 1..100 cost 215,550 (derived from the formula) [C27].

### M6. Pay 2 Win: liquids (Regen, Capacity)
- **Rule and costs:** Regen cost of Lv L to L+1 `round(2500 x (1.19 - 0.135L/(100+L))^L)`, max 100; Capacity `round(3500 x (1.2 - 0.13L/(100+L))^L)`, max 80 [C31].
- **Effect:** Regen `decay(400,100)` = `400L/(L+100)`, so +200 at Lv 100; Capacity `add(1,0)` = +L [C33].
- **Unlock:** a liquid's upgrades are bought with coins; the liquid itself must be unlocked [C2].
- **Field:** `account.alchemy.p2w.liquids[i].{regen,capacity}.{level,cost,costToMax}`; raw `CauldronP2W[1]` (pairs per liquid: regen, capacity) [C30].
- **Totals (derived):** to max one liquid's Regen ~2.79e9 coins, Capacity ~1.27e9; first 50 levels cost 1.77e7 (Regen) and 3.75e7 (Capacity) [C32].

### M7. Pay 2 Win: cauldrons (bubble side, cross-reference)
- **Rule:** Speed (max 150, cost `2500 x (1.15 - 0.117L/(100+L))^L`), New Bubble (max 125, `3200 x (1.18 - 0.145L/(100+L))^L`), Boost Req (max 100, `3750 x (1.2 - 0.14L/(100+L))^L`) [C31]. Effects: Speed `add(3,0.2)` = +2715% at 150; New Bubble `decayMulti(2.5,100)` = x2.39 at 125; Boost Req `decay(70,100)` = -35% at 100 [C33].
- **Field:** `p2w.cauldrons[i].{speed,newBubble,boostReq}`; raw `CauldronP2W[0]` (3 per cauldron) [C30].

### M8. Pay 2 Win: vials and player
- **Vials:** Attempts max 15 (daily attempts = `3 + level`), RNG max 45 (`decay(700,30)` = +420% at 45) [C33][C34]. Field `p2w.vials.{attempts,rng}`, `p2w.vialsAttempts.{current,max}`; raw `CauldronP2W[2]` and `[5][0]` [C30].
- **Player:** Alchemy Speed `decay(35,100)` (17.5 at Lv 100, asymptote 35) and Extra EXP `add(1,0.1)` (605 at Lv 100); the max level equals the highest Alchemy level on the account (AutoReview counts 2 x that for two upgrades) [C34]. Field `p2w.player.{speedLv,extraExpLv,speed,extraExp}`; raw `CauldronP2W[3]`.

### M9. Liquid Shop
- **Rule:** price of the next buy `round(x1 x x2^bought)` [C36]; `bought` is `account.alchemy.multiplierArray[index]` (raw `CauldronInfo[10]`) [C36]. All items reset every 24 h except the Talent Points, Small Donation and Luminous Shell [C37]. Data table (index, item, x1, x2) [C35]:

  | Idx | Item | x1 | x2 | Currency (wiki) |
  |---|---|---|---|---|
  | 0 | Mediocre Obols | 10 | 2.2 | Water |
  | 1 | Weak Upg Stone | 5 | 2.1 | Water |
  | 2 | Distilled Water | 1 | 1.37 | Water |
  | 3 | One Measly Gem | 5 | 7.5 | Water |
  | 4 | Star Book | 50 | 1.3 | Water |
  | 5 | Exp Balloon | 15 | 2.8 | Water |
  | 6 | Small Donation | 1 | 2 | Water |
  | 7 | Decent Obols | 20 | 2.5 | Water + N2 |
  | 8 | Talent Point (Tab 2) | 3 | 1.3 | Water + 1 N2 |
  | 9 | Grand Obols | 5 | 2.2 | N2 + Trench |
  | 10 | Bargain Tag | 1 | 1.19 | 1 N2 + 1 Trench base |
  | 11 | Dense Water | 1 | 1.37 | Trench |
  | 12 | A Pair Of Gems | 5 | 10.5 | Trench |
  | 13-15 | Empty Space | 1/10/1 | 1 | none |
  | 16 | Luminous Shell | 100000 | 3.7 | Toxic Hg (never resets) |
  | 17 | Talent Point (Tab 3) | 3 | 1.27 | Trench (Shop 2) |
  Currencies are from the wiki and prior research; the Toolbox table has only x1/x2 (open question 4). Entries 16 and 17 are not in the earlier 6827d3f2 research [C37].
- **Field:** `account.alchemy.multiplierArray[]` (counts); catalogue `TB:data/website-data/shared-data.json#liquidsShop`.

### M10. Bargain Tag
- **Rule:** each tag discounts the next bubble upgrade; Toolbox's cost function takes a `bargainTag` factor (also applied to Bits bubbles) [C40]. Magnitude (-25% per tag, stacking to -90% in 8 buys) is from earlier research, not re-derived (open question 5).
- **Field:** shop count index 10; discount factor is an input to `getBubbleUpgradeCost(...)`.

### M11. Ivory Bubble Cauldrons (Gem Shop `GemP6`)
- **Rule:** up to 4 purchases (one per colour), each: +2 seats on that cauldron, 1.5x brew speed, 1.5x new-bubble chance [C21]. Gem price: 300 in game data and wiki; community tier list says 300 to 450 [C21].
- **Field:** `account.accountOptions[32]` is a digit string, one 0/1 digit per cauldron (`isIvoryCauldron`, `IVORY_CAULDRON_MULTI = 1.5`) [C21]; `account.gemShopPurchases[105]` is the purchase counter in the Gem Shop table (globalIndex 105).

### M12. Bleach Liquid Cauldrons (Gem Shop `GemP7`)
- **Rule:** up to 4 purchases, bought in order for liquid 1..4, each +1 seat, 1.5x cap and 1.5x regen on that liquid [C19].
- **Field:** `account.gemShopPurchases[106]` (count); applies to liquid `i` when `count > i` [C18].
- **Gem price:** 250 in game data and wiki, 500 in two community tier lists (conflict, open question 6) [C19].

### M13. Dragonic Cauldron (limited Gem Shop `GemP18`)
- **Rule:** one purchase of the rotating Limited Special; makes the 1st (then 2nd, 3rd, 4th) liquid cauldron Dragonic: 2x cap, 1.3x regen [C20].
- **Field:** `account.accountOptions[123]` = count; liquid `i` is Dragonic when `> i` [C18]. Past limited run in data: 969 gems, seen 2.3.34 to 2.3.42 [C20].

### M14. Cap-side sources (stamps, Arcade, bubble, vials, meals, Lab, mastery, Salt Lick)
- **Rules and fields:** see [C10] to [C17], [C23]. Fields: `account.alchemy.vials[i].level`, `account.alchemy.bubbles.kazam[7]` (Da Daily Drip), `account.arcade.shop`, stamps (`Droplots`, `Drippy Drop`), `account.lab.labBonuses[6]`, `account.rift`, `account.saltLick`, meals.

### M15. Sigil: Peculiar Vial (W4 Lab, outline)
- **Rule:** +15/25/35/50/65% regen of all liquids at unlock/boost/jade/ethereal/eclectic tiers; unlock cost 17,000 Sigil EXP, boost 120,000, jade 750,000, ethereal 15,000,000, eclectic 3.5e11 [C22]. Charging needs seating a character on the sigil (activity >= 100) [C5]. W4 Lab "Sigils of Olden Alchemy" gate is per earlier research (not re-verified).
- **Field:** `account.alchemy.p2w.sigils[i].{progress,unlocked,characters}` (raw `CauldronP2W[4]`).

### M16. Toolbox alerts relevant to liquids
- Bargain Tag unbought, gems unbought, liquids near full, vial attempts, vial upgradeable, P2W affordable [C41]. The liquids alert maps `liquidCauldrons` objects into `max` and compares a number with an object, so it does not fire at this pin [C41].

### M17. Salt Lick #6 "Spontaneity Salts" (W3, RESOLVED: capacity via Bleach/Dragonic branch only, rate +1%/level on all liquids)
- **Rule (Toolbox view, tier 1):** `saltLickBonus = baseBonus x level = 1 x level` (0..100), read as `getSaltLickBonus(account.saltLick, 5)` [C54]. It is used ONLY to build `bleachLiquidBonus` for liquid `i`: if Bleach covers `i` (`gemShopPurchases[106] > i`) the term is `0.5 + sl/100`; if Dragonic covers `i` (`accountOptions[123] > i`) the term is `1` when Bleach is absent (Salt Lick ignored) or `2 + sl/100` when Bleach is also present; with neither, the term is 0 and Salt Lick adds nothing [C55]. That term is `secondMath`'s first summand, so it scales the whole cap sum: `maxLiquid = ceil((1 + bleachDragonic + (meal + 5 x mastery)/100) x thirdMath)` [C8][C55].
- **Worked effect at Lv 100 (derived):** Bleach only: factor 1.5 -> 2.5 (+67% over Lv 0, +100 percentage points of base cap). Bleach + Dragonic: 3 -> 4. Dragonic only or no Bleach: unchanged [C56].
- **Rate:** Toolbox does not model it, but the game does: N.js `LiquidHRrate` adds `SaltLick(5)` (percent) to every liquid's regen multiplier [X2]. Resolved in contradictions-1 [X2] from N.js: the game applies `SaltLick(5)` in TWO places. (1) Capacity: only inside the bleach/Dragonic term `CauldStatDN1bb` (`0.5+SL/100`; Dragonic alone 1; both `SL/100+2`; neither 0), N.js `LiquidCap` @5116234-5116555, exactly as Toolbox. (2) Rate: `LiquidHRrate` @5121626-5122463 adds `SaltLick(5)` into the additive percent group `(1+(research speed + StampBonus LiquidSpd + SaltLick(5) + Sigil 20 + Summoning vault 38)/100)` in all three branches (Bleach+Dragonic x1.95, Bleach x1.5, neither x1), so +1% liquid rate per level applies to ALL liquids regardless of Bleach. Toolbox models only the capacity half (a Toolbox gap, rate is not computed in alchemy.ts). Confidence H (game code).
- **Cost:** Spontaneity salt (Refinery3), base 10, x1.122 per level, max 100; cost-to-max about 8.2M (geometric sum, derived) [C23][C56].
- **Fields:** raw `SaltLick[5]` (level), building gate `TowerInfo[3] > 5`; parsed `account.saltLick[5].{level, unlocked}`; output `account.alchemy.liquidCauldrons[i].maxLiquid` [C54].
- **Disputed record (both views kept, no pick):**
  - View A (game data description, wiki, original dossier): "+{% Liquid rate and Capacity for all liquids in Alchemy": all four liquids, rate AND capacity, independent of Bleach/Dragonic. Source: `shared-data.json saltLicks[5].desc` (T1 text) and https://idleon.wiki/wiki/Salt_Lick (T2). Confidence M [C57].
  - View B (Toolbox code): capacity only, only through the Bleach/Dragonic multiplier branch. Source: alchemy.ts#L159-L170, #L187 (T1). Confidence M. The code could mirror the real client (the bleach term is `0.5 + sl/100` in-game style) or be a Toolbox modelling shortcut [C55][C57].
  - **Resolution (2026-10-19, N.js):** both views are partly right. View A is right for RATE (all liquids), View B is right for CAPACITY (bleach/Dragonic term only). ActiveOn should model capacity as View B and may claim +1% rate per level on all liquids (H). See [X2].

### W5+ extensions (one line each)
- Toxic Hg feeds W6/W7 vials (Liquid4) and the Luminous Shell shop item (Menagerie, W7) [C37].
- Prisma bubbles, Kattlekruk bubble levels and Black Diamond Rhinestone (meal multiplier) are W5+ and covered by the alchemy-bubbles dossier [C16].
- Alchemy mastery (Rift) adds +5% cap at Alchemy 200 [C17].

## Min-max by stage

Priority orders below; sources noted per line. No source orders Pay 2 Win tiers 3 to 5; those are L confidence.

- **W1 (before Alchemy 1):** nothing to do; Alchemy needs W2. Hoard Copper/Oak/Spore Cap for bubbles (see alchemy-bubbles).
- **W2 early (Alchemy 1 to ~19, Water only):** (1) put a low-value character on Water [C6]. (2) Raise Player P2W after each Alchemy level (cheap) [C34][C42]. (3) Level Water Regen and Capacity early: "Early on, it's beneficial to level up the rate and cap of these cauldrons" (wiki, tier 2) [C43]. (4) Decant Cap/Rate with spare liquid [C26]. (5) Buy the day's first One Measly Gem [C36]. (6) Spend Water on bubbles/vials before cap [C4].
- **W2 mid (Alchemy 20 to 34):** open N2; buy Talent Point (Tab 2) whenever affordable (never resets) [C37]; buy Bargain Tags before the most expensive bubble upgrade [C40]; Barium Mixture and Tea With Pea vials for cap [C10]. Gem Shop: Bleach #1 is the most valued liquid purchase ("S Tier, first purchase is the most important, only buy others when bottlenecked", tier 4, 2026-09-01) [C19]; the other tier list also ranks it S [C19].
- **W2 late / W3 (Alchemy 35 to 79):** open Trench and Shop 2; buy A Pair Of Gems daily and Talent Point (Tab 3) [C36][C37]; Trench funds most W3 bubble levels and vials 31+ [C39]; raise Trench Regen/Cap and N2 Regen/Cap before Water beyond need [C43, order L]. AutoReview's order for P2W: bubble-cauldron upgrades, then liquid upgrades, then vials, with Player upgrades after each level-up, "before Mid W5" [C42].
- **W3 additions:** Spontaneity Salt (Salt Lick #6) for +1% per level, up to 100 (cap on Bleach liquids per Toolbox; rate effect unverified, see M17) [C23][C54]; Droplots and Drippy Drop stamps [C13]; Da Daily Drip bubble (Kazam) [C12].
- **W4:** Peculiar Vial sigil and the Viaduct of the Gods Lab bonus (x5 cap but -30% regen: only worth it if cap, not regen, is the bottleneck) [C15][C22]; open Toxic Hg at Alchemy 80 for W6+ content [C2]; alchemy mastery at Alchemy 200 (+5% cap) [C17]; Dragonic if the limited special rotates back [C20]. The Bubo/Bubba class path unlocks bubble slots naturally, making Ivory "short-term value" (tier 4, C tier) [C21].
- **Per class:** no class-specific liquid mechanics found; class matters for bubble-class multipliers only (alchemy-bubbles).

## Open questions
0. (M17) Does Spontaneity Salts raise liquid rate in-game, and does it apply to liquids with no Bleach/Dragonic? Toolbox says capacity-only and Bleach/Dragonic-only; data text says all liquids rate+cap. Needs N.js.
1. Where does the game gate liquid unlocks (1/20/35/80)? Wiki and AutoReview say Alchemy level; not found in Toolbox code.
2. Decant Rate effect per level and base liquid regen per hour per seated character: not in Toolbox or the wiki text fetched. Needs N.js (game client) read.
3. Is there a max decant level for Cap/Rate?
4. Liquid Shop currencies per item: only the wiki lists them; Toolbox has x1/x2 only.
5. Bargain Tag magnitude (-25% per tag, stacking to -90%): earlier research only; confirm in N.js.
6. Bleach gem price: 250 (game data, wiki) vs 500 (two community tier lists, 2026-09-01); Ivory 300 vs 300 to 450 (escalating?). Data shows `costIncrement 0`.
7. Why Toolbox applies Salt Lick only inside the Bleach/Dragonic branches, and why both together give x3 not x2.5 (code reads as written).
8. Ballot bonus +25% liquid regen (earlier research) not re-verified.

## Claims and Sources

All verified 2026-10-19. T = tier per ADR 0004. `TB:` = `packages/toolbox-parsers/vendor/` (pin 6c37e3d, game 2.3.540). Wiki = idleon.wiki. Claim date for wiki pages = page revision seen 2026-10 (post-2.3.5xx; not pre-patch); community guides dated as shown.

- [C1] Four liquids in save order: Water Drops, Liquid N2, Trench H2O, Toxic Hg. Source: TB:parsers/world-2/alchemy.ts#L63-L68 (`LIQUID_INFO`). T1. Confidence H.
- [C2] Liquid unlocks at highest Alchemy level 1 / 20 / 35 / 80. Source: https://idleon.wiki/wiki/Alchemy (T2); https://raw.githubusercontent.com/TwoSpookyBoos/IdleOnAutoReviewBot/main/mysite/w2/alchemy_p2w.py (T3); https://www.digitaltq.com/wiki/idleon/alchemy (T4). No gate in Toolbox code (checked alchemy.ts). Confidence M.
- [C3] Current liquid amounts are `alchemy.liquids = CauldronInfo[6]`. Source: TB:parsers/world-2/alchemy.ts#L117 (`liquids: alchemyRaw?.[6]`). T1. Confidence H.
- [C4] A liquid stops filling when its bar is full, so liquid should be spent often. Source: https://idleon.wiki/wiki/Alchemy (T2). Confidence M.
- [C5] Activity values: 4..7 = liquid 0..3 (`activity < 100 && activity >= 4`); `liquidMapping` is `{0:4,1:5,2:6}` only, so liquid 3 never lists players. Source: TB:parsers/world-2/alchemy.ts#L241-L242, L280, L555. T1. Confidence H.
- [C6] A character assigned to a liquid speeds it up and earns 2x Alchemy EXP versus a bubble cauldron. Source: https://idleon.wiki/wiki/Alchemy (T2). Confidence M.
- [C7] A character can only be assigned to a liquid if not assigned to a bubble cauldron. Source: https://www.digitaltq.com/wiki/idleon/alchemy (T4). Confidence M.
- [C8] `maxLiquid = ceil((1 + secondMath) x thirdMath)`, `thirdMath = Viaduct x (10 + brew + vial + p2wCap + firstMath + stamp + ceil(arcade))`, `secondMath = bleachDragonic + (meal + 5 x mastery)/100`, `firstMath = DaDailyDrip x max((totalAlchLv/25)^0.3, 0)`. Source: TB:parsers/world-2/alchemy.ts#L148-L225. T1. Confidence H.
- [C9] Decant Cap contributes `round(level)` flat cap for liquids (index >= 4 branch of `getCauldronBrewBonus`). Source: TB:parsers/world-2/alchemy.ts#L232-L238. T1. Confidence H.
- [C10] Vials: Barium Mixture (idx 4, Liquid1Cap, +3/level), Tea With Pea (idx 11, Liquid2Cap, +3), 40-40 Purity (idx 38, Liquid3Cap, +1), Jungle Juice (idx 8, LiquidRegen, +1% per level); no Liquid4Cap vial in data. Source: TB:data/website-data/vials.json entries 4, 8, 11, 38; stat lookup TB:parsers/world-2/alchemy.ts#L173. T1. Confidence H.
- [C11] P2W Capacity is `add(1,0)` = +1 cap per level, max level 80. Source: TB:data/website-data/shared-data.json `p2w[1][1]`; TB:parsers/world-2/alchemy.ts#L75-L84 (`liquidsCapacity: 80`), #L182. T1. Confidence H.
- [C12] Da Daily Drip (Kazam bubble c7): `decay(30,100)`, raises max cap of every liquid, scales with combined Alchemy level of all characters. Source: TB:data/website-data/cauldrons.json (kazam c7); TB:parsers/world-2/alchemy.ts#L186. T1. Confidence H.
- [C13] Stamps: Drippy Drop (skills 14, +% liquid regen speed) and Droplots (skills 15, +cap for all liquids, effect key `Cap_for_all_Liquids_in_Alchemy`). Source: TB:data/website-data/stamps.json; TB:parsers/world-2/alchemy.ts#L183. T1. Confidence H.
- [C14] Arcade shop gives `+{ Cap for all Liquids`, `decay(25,100)`, rounded up. Source: TB:data/website-data/shared-data.json `arcadeShop`; TB:parsers/world-2/alchemy.ts#L184. T1. Confidence H.
- [C15] Lab bonus Viaduct of the Gods (index 6): x5 max capacity for all liquids but -30% regen (on 5, off 1). Source: TB:data/website-data/shared-data.json `labBonuses[6]`; TB:parsers/world-2/alchemy.ts#L187. T1. Confidence H.
- [C16] Meal bonus `Liquid12` applies to liquids 1-2 and `Liquid34` to 3-4; scaled by the Black Diamond Rhinestone jewel (Lab). Source: TB:parsers/world-2/alchemy.ts#L176-L178. T1. Confidence H.
- [C17] Alchemy mastery second tier (Rift) gives +5% all liquid cap at Alchemy 200 (code comment). Source: TB:parsers/world-2/alchemy.ts#L179-L180. T1. Confidence M.
- [C18] Bleach count `gemShopPurchases[106] > i` adds 0.5 (+SaltLick[5]/100) to the cap multiplier; Dragonic `accountOptions[123] > i` sets 1 (or 2 + SaltLick/100 if both). Spontaneity Salt (salt lick index 5) enters only through these branches. Source: TB:parsers/world-2/alchemy.ts#L158-L170. T1. Confidence H. Verifier note: Bleach alone gives 0.5 + salt/100, Dragonic alone gives 1 with no salt term, both together give 2 + salt/100 (so the 'both' case is a 3x multiplier on cap, 1 + 2), see [C44].
- [C19] (price conflict recorded in both views) Bleach Liquid Cauldrons (`GemP7`, globalIndex 106): max 4 purchases, +1 player slot, 1.5x liquid cap, 1.5x regen, must be bought in order (1st = Water, 2nd = N2). Price: 250 gems in game data and wiki; 500 in DigitalTQ (undated) and gameslikefinder (2026-09-01, "S Tier, first purchase is the most important, only purchase other cauldrons when you are bottlenecked"). Source: TB:data/website-data/gemShop.json (GemP7); https://idleon.wiki/wiki/Gem_Shop (T2); https://www.digitaltq.com/wiki/idleon/gem-shop-tier-list (T4); https://gameslikefinder.com/article/legends-of-idleon-gems/ (T4); https://steamcommunity.com/app/1476970/discussions/0/3127163422377944192 (T4, 2021, pre-patch for cost). Confidence on price L, on order M.
- [C20] Dragonic Cauldron (`GemP18`, limited special, globalIndex 93, 969 gems, seen 2.3.34 to 2.3.42): 2x cap, 1.3x regen on the first non-Dragonic liquid. Source: TB:data/website-data/gemShop.json `past_limited_specials`; https://idleon.wiki/wiki/Alchemy (T2). Confidence H (data), rotation timing unknown.
- [C21] Ivory Bubble Cauldrons (`GemP6`, globalIndex 105): max 4 purchases, +2 players on the cauldron, 1.5x brewing, 1.5x new-bubble chance; owned per colour via `OptionsListAccount[32]` digit string; 300 gems per data/wiki, 300-450 per gameslikefinder (2026-09-01, "C Tier, low priority, can be unlocked naturally with the Bubo class path"), DigitalTQ rates all three cauldron items S. Source: TB:data/website-data/gemShop.json; TB:parsers/world-2/alchemy.ts#L651-L654, L666, L770; https://idleon.wiki/wiki/Gem_Shop (T2); https://gameslikefinder.com/article/legends-of-idleon-gems/ (T4); https://www.digitaltq.com/wiki/idleon/gem-shop-tier-list (T4). Tier lists disagree (S vs C); confidence L.
- [C22] Peculiar Vial sigil boosts regen of all liquids +15/25/35/50/65%; costs 17,000 / 120,000 / 750,000 / 15,000,000 / 350,000,000,000 Sigil EXP. Source: TB:data/website-data/shared-data.json `sigils` PECULIAR_VIAL; https://idleon.wiki/wiki/Sigils (T2). T1. Confidence H.
- [C23] Salt Lick "Spontaneity Salts" (index 5): +1% liquid rate (all liquids, N.js LiquidHRrate) and capacity (bleach/Dragonic term only, N.js LiquidCap) per level; the data description text says both without the capacity restriction, max 100, base cost 10, x1.122. Source: TB:data/website-data/shared-data.json `saltLicks[5]`. T1. Confidence H.
- [C24] Existing ActiveOn KB orders Pay 2 Win as Player, liquids, vials, cauldrons, boost req at confidence L (no source orders tiers 3-5); a liquid-cap check exists and observes Water rate from saves because Toolbox has none. Source: packages/knowledge/systems/alchemy-p2w.yaml (`alchemy-p2w.priority.order`); packages/knowledge/detectors/alchemy/liquid-cap.ts header. T1 (repo). Confidence L.
- [C25] Toolbox computes no liquid regen rate; regen modifiers exist as data only (P2W regen, Jungle Juice, Drippy Drop, Peculiar Vial, Spontaneity, Bleach, Dragonic, Viaduct). Source: absence in TB:parsers/world-2/alchemy.ts (grep "regen"/"Liquid" yields only cap code, #L148-L225); TB:data/website-data/vials.json idx 8; stamps.json; sigils; https://idleon.wiki/wiki/Alchemy (T2, rate not listed). T1 (absence). Earlier research also lists a Ballot bonus #12 +25% regen: unverified here. Confidence H.
- [C26] Decant tracks live in `cauldronsInfo.slice(18)`: per liquid, entry `[i*4]` is Cap `[progress, level]`, `[i*4+1]` is Rate; `cauldronsInfo` is `CauldUpgLVs`/`CauldUpgXPs` or flattened `CauldronInfo[8]`. Source: TB:parsers/world-2/alchemy.ts#L148-L156, L828-L838. T1. Confidence H.
- [C27] Decant requirement for next level `floor(1.6 + (1.25 x level)^1.8)`; e.g. L1 = 3, L10 = 95, L20 = 329, L50 = 1,709, L100 = 5,950; levels 1..50 total 31,418 and 1..100 total 215,550 (derived). Source: TB:parsers/world-2/alchemy.ts#L227-L229. T1. Confidence H.
- [C28] Decant Cap is the only decant effect Toolbox applies (flat cap by level); no Rate effect or max level is read. Source: TB:parsers/world-2/alchemy.ts#L227-L238 (only `decantCap` feeds `maxLiquid`). T1 (absence). Confidence H.
- [C29] Decant button spends generated liquid on the chosen Cap/Rate boost; holding it upgrades continuously and "quite quickly". Source: https://idleon.wiki/wiki/Alchemy (T2); https://www.digitaltq.com/wiki/idleon/alchemy (T4). Confidence M.
- [C30] `CauldronP2W` layout: `[cauldrons(3 per cauldron), liquids(2 per liquid: regen, capacity), vials(attempts, rng), player(speed, extraExp), sigils, remainingAttempts]`. Source: TB:parsers/world-2/alchemy.ts#L244-L246, L284-L298. T1. Confidence H.
- [C31] P2W cost of Lv L to L+1 and max levels: liquid Regen `round(2500 x (1.19 - 0.135L/(100+L))^L)` max 100; liquid Capacity `round(3500 x (1.2 - 0.13L/(100+L))^L)` max 80; cauldron Speed `2500 x (1.15 - 0.117L/(100+L))^L` max 150; New Bubble `3200 x (1.18 - 0.145L/(100+L))^L` max 125; Boost Req `3750 x (1.2 - 0.14L/(100+L))^L` max 100; vials Attempts 15, RNG 45. Source: TB:parsers/world-2/alchemy.ts#L75-L84, L315-L330. T1. Confidence H.
- [C32] Derived coin totals: Regen Lv0->100 about 2.79e9, Capacity Lv0->80 about 1.27e9, cauldron Speed 4.53e9, New Bubble 6.53e9, Boost Req 7.64e9 (each per cauldron); Regen L50 cost 2.18e6, Capacity L50 5.06e6. Source: computed from [C31] formulas, 2026-10-19. T1 (derived). Confidence H.
- [C33] P2W effect curves: cauldron Speed `add(3,0.2)` (2715 at Lv 150), New Bubble `decayMulti(2.5,100)` (2.39 at 125), Boost Req `decay(70,100)` (35% at 100), liquid Regen `decay(400,100)` (200 at 100), Capacity `add(1,0)`, vial Attempts `add(1,0)`, RNG `decay(700,30)` (420 at 45), Player Speed `decay(35,100)`, Player Extra EXP `add(1,0.1)`. Wiki agrees on 2715%, 2.39x, 35%, 420% maxima. Source: TB:data/website-data/shared-data.json `p2w`; TB:utility/wiki/growth.mjs; https://idleon.wiki/wiki/Alchemy (T2). T1. Confidence H.
- [C34] Vial attempts per day `3 + P2W attempts level` (max 18); Player upgrades cap at the highest Alchemy level on the account; AutoReview counts Player upgrades as 2x highest Alchemy level. Source: TB:parsers/world-2/alchemy.ts#L294-L297; https://idleon.wiki/wiki/Alchemy (T2); AutoReview alchemy_p2w.py (T3, 2026-09-23). Confidence M.
- [C35] Liquid Shop table (18 entries, indices 0-17) with x1/x2 as in M9, including Luminous Shell (100000, x3.7) and Talent Point Tab 3 (3, x1.27) at indices 16-17. Source: TB:data/website-data/shared-data.json `liquidsShop`. T1. Confidence H.
- [C36] Shop price `round(x1 x x2^bought)`; `bought = alchemy.multiplierArray[index]` (raw `CauldronInfo[10]`). One Measly Gem 5 Water x7.5; A Pair Of Gems 5 Trench x10.5. Source: TB:utility/dashboard/account.js#L445-L460; TB:parsers/world-2/alchemy.ts#L116; https://idleon.wiki/wiki/Alchemy (T2). T1. Confidence H.
- [C37] Shop prices of all items except the Talent Points and Small Donation reset every 24 h; Luminous Shell (Menagerie shell, base 100K Toxic Hg x3.7) never resets; Talent Point (Tab 3, 3 Trench x1.27) lives in Liquid Shop 2; Talent Point (Tab 2) costs 3 Water + 1 N2 x1.3. Source: https://idleon.wiki/wiki/Alchemy (T2, revision 2026-10); https://www.digitaltq.com/wiki/idleon/alchemy (T4). Confidence M.
- [C38] Liquid Shop 1 sells Water items and the Tab 2 Talent Point; Shop 2 (Trench H2O, Alchemy 35) sells Grand Obols, Bargain Tag, Dense Water, Tab 3 Talent Point. Source: https://idleon.wiki/wiki/Alchemy (T2); earlier research research/w2-systems (T3, pinned to 6827d3f2). Confidence M.
- [C39] Bubble liquid cost is `base + floor(level/20)` with no discounts; vial liquid cost is `3 x vial level`. Source: TB:parsers/world-2/alchemy.ts#L137; TB:utility/dashboard/account.js#L489-L492. T1. Confidence H.
- [C40] Bargain Tag is a discount factor on the next bubble upgrade cost; Toolbox alerts when the shop's Bargain Tag price is still 1 (unbought today). Magnitude -25% per tag to -90% is earlier research, unverified here. Source: TB:parsers/world-2/alchemy.ts#L129-L144; TB:utility/dashboard/account.js#L447-L453. T1 for factor existence, L for magnitude.
- [C41] Toolbox alchemy alerts: bargainTag, gems (price == 5), liquids (>= threshold%, default 90), sigils, vials, vialsAttempts, p2wUpgrades (affordable with `currencies.rawMoney`). The liquids alert maps `liquidCauldrons` objects as `max`, so it never fires at this pin. Source: TB:utility/dashboard/account.js#L445-L542; TB:utility/dashboard/baseTrackers.js#L133-L148; packages/knowledge/detectors/alchemy/liquid-cap.ts header. T1. Confidence M.
- [C42] AutoReview P2W priority: bubble-cauldron upgrades, liquid cauldron upgrades, vial upgrades, then Player upgrades; advice "Try to purchase the basic upgrades before Mid W5, and Player upgrades after each Alchemy level up!"; totals 1,500 cauldron + 180 per unlocked liquid + 60 vial. Source: https://raw.githubusercontent.com/TwoSpookyBoos/IdleOnAutoReviewBot/main/mysite/w2/alchemy_p2w.py (T3, repo state 2026-10-19; earlier research cited 2026-09-23). Confidence M.
- [C44] Bleach and Dragonic stack: with both owned for a liquid, the cap multiplier term is `2 + saltLick/100` (total cap factor 3x+ before meals/mastery); Dragonic alone gives 1 (2x) and ignores Salt Lick; Bleach alone gives `0.5 + saltLick/100`. Source: TB:parsers/world-2/alchemy.ts#L158-L170. T1. Confidence H. (Resolves open question 7 as code behaviour; the in-game intent is unverified.)
- [C45] Bubble-cauldron brew cap (index < 4 branch of `getCauldronBrewBonus`) uses a different decay (90/100) than the liquid decant branch (`round(level)`); only the liquid branch matters for `maxLiquid`. Source: TB:parsers/world-2/alchemy.ts#L232-L238. T1. Confidence M (branch read by one lens only).
- [C46] Decant Rate level has no read effect in Toolbox; only Cap feeds `maxLiquid`. Source: TB:parsers/world-2/alchemy.ts#L227-L238. T1 (absence). Confidence H for Toolbox, L for the real game effect (open question 2).
- [C47] Black Diamond Rhinestone (Lab jewel) and the Spelunker obol multiplier scale the meal term of the cap formula. Source: TB:parsers/world-2/alchemy.ts#L176-L178. T1. Confidence M (jewel names from the verifier, not re-traced).
- [C48] The vial upgrade alert derives the liquid index with `name.split('\\d')[1]`, a literal-string split that never matches a digit, so the parsed index falls back to 0 and the alert tests every vial against liquid 0. Treat Toolbox's vial-upgradeable alert as unreliable. Source: TB:utility/dashboard/account.js#L489. T1. Confidence M.
- [C49] Bubble liquid ingredient and cost: each bubble item in `cauldrons.json` names its liquid (Liquid1 to Liquid4) and base cost; cost per level is `base + floor(level/20)` [C39]. Toxic Hg (Liquid4) is also consumed by W7 vials, not only bubbles, and the Luminous Shell shop item. Source: TB:data/website-data/cauldrons.json; TB:data/website-data/vials.json; TB:parsers/world-2/alchemy.ts#L137. T1. Confidence M (W7 vial names from verifier, not itemised here).
- [C50] Vial unlock: drop the item on the cauldron and roll; daily attempts `3 + P2W attempts level` cap how many rolls happen, success chance scales with the RNG upgrade (+420% at Lv 45). Source: [C33][C34]; https://idleon.wiki/wiki/Alchemy (T2). Confidence M. Per-roll flow consumption is not modelled.
- [C51] Spontaneity Salts is a Refinery salt lick: levels cost salt spent in the Refinery (base 10, x1.122) and the bonus is only live when the Refinery salt lick is levelled, so it is a salt sink as well as a liquid buff. Source: [C23]; TB:data/website-data/shared-data.json `saltLicks[5]`. T1. Confidence M.
- [C52] Wiki Bargain Tag: -25% per tag, capped at -90% (8 purchases), with a rising tag price. Toolbox only exposes the factor (see [C40]); both views recorded, magnitude from tier 2 wiki. Source: https://idleon.wiki/wiki/Alchemy (T2, 2026-10). Confidence M.
- [C53] Toolbox liquid shop alerts fire when Bargain Tag price is 1 and when A Pair Of Gems price is 5 (the base prices), meaning unbought today. Small Donation (quest, 4 buys), Star Book and Exp Balloon are plain `x1 x x2^bought` shop items without special parsing. Source: TB:utility/dashboard/account.js#L445-L460. T1. Confidence M.
- [C43] Wiki advice: "Early on, it's beneficial to level up the rate and cap of these cauldrons"; liquids are also used for the liquid cauldron decant, the shop and vials, so choose a use. Source: https://idleon.wiki/wiki/Alchemy (T2). Confidence M.
- [C58] Missed-mechanics cross-check (verifiers, 2026-10-19): capacity base, Da Daily Drip `(alchemy level/25)^0.3` scaling, Black Diamond Rhinestone on Liquid12/Liquid34 meals, rift alchemy-mastery +5% cap, and 4 decant slots per liquid from `cauldronsInfo.slice(18)` are all already covered by [C8], [C12], [C16], [C17], [C26]. Source: TB:parsers/world-2/alchemy.ts#L148-L225, L828-L838. T1. Confidence H.
- [C54] Salt Lick #6 bonus is `baseBonus (1) x level` via `getSaltLickBonus(account.saltLick, 5)`; level clamped to maxLevel 100 and unlocked when `index < TowerInfo[3]`. Source: TB:parsers/world-2/alchemy.ts#L159; TB:parsers/world-3/saltLick.ts#L14-L32, #L42-L47. T1. Claim date 2026-10-19 (game 2.3.540). Confidence H.
- [C55] Salt Lick #6 enters `maxLiquid` only inside the bleach/Dragonic term: Bleach `0.5 + sl/100`; Dragonic alone `1`; both `sl/100 + 2`; neither 0; the term feeds `secondMath` and multiplies `thirdMath`. Source: TB:parsers/world-2/alchemy.ts#L160-L170, #L187-L189 (`maxLiquid`). T1. Claim date 2026-10-19. Confidence H (as written); Confidence M that it mirrors the game.
- [C56] Derived: at Lv 100, Bleach-only cap factor goes 1.5 to 2.5 (before meals/mastery), Bleach+Dragonic 3 to 4, Dragonic-only and no-Bleach unchanged; cost to max about 8.2M Spontaneity salt (`10 x (1.122^100 - 1)/0.122`). Source: computed from [C55] and TB:data/website-data/shared-data.json `saltLicks[5]`. T1 (derived). Claim date 2026-10-19. Confidence H for the cap factors and the 8.18M geometric sum (both lenses recomputed); Confidence M for the cost formula itself (the per-level cost `10 x 1.122^l` is read from data fields, not parser code, so one lens could not verify it independently; wiki shows 8.19M to max).
- [C57] **Disputed.** View A: Spontaneity Salts gives "+{% Liquid rate and Capacity for all liquids in Alchemy" (all liquids, rate and capacity). View B: Toolbox applies it to capacity only and only on Bleach/Dragonic liquids; no rate use exists in the parsers. Source: View A TB:data/website-data/shared-data.json `saltLicks[5].desc` (T1 text) and https://idleon.wiki/wiki/Salt_Lick (T2, seen 2026-10); View B TB:parsers/world-2/alchemy.ts#L159-L187 (T1). Claim date 2026-10-19. Confidence M both; resolution needs the game client. Cross-ref: salt-lick.md [C22]. Verifier status: neither lens refuted this; the wiki side was unverifiable offline (L for the wiki wording), and the dispute is superseded for rate by the N.js resolution in M17/[X2].
