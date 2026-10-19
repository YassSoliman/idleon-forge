# Event Shop and seasonal events (dossier, verified 2026-10-19, game 2.3.540, Toolbox @6c37e3d)

Paths below are relative to `packages/toolbox-parsers/vendor/` (P = `parsers/`). Wiki = https://idleon.wiki/wiki/Event_Shop (tier 3, fetched 2026-10-19, lists events through Cropfall 2026). Wiki names are mapped to Toolbox ids by matching effect text to the parser use; the wiki table's own row numbers are NOT the ids (the page's first rows duplicate later ones).

## Event Shop

- **What it is:** an account-wide shop bought with seasonal Event Points. Every purchase is a permanent flag; Toolbox reads which are owned and applies them as inputs to ~25 other systems. [C1][C2][C3]
- **Unlocks:** available whenever a seasonal event is running; items rotate in per event (each item is listed against the events that stocked it). No unlock gate is known. [C4][C5]
- **Scope:** account-wide (OptionsListAccount). Nothing per-character. [C1]
- **Inputs -> outputs:** Event Points (OLA[310]) -> owned-letters string (OLA[311]) -> bonuses in W1-W7 formulas (catalogue). [C1][C6]
- **Goals and Milestones:** none; per-item costs 12..275 points (catalogue). [C4]
- **Feeds / fed by:** fed by seasonal events; feeds Tome, Stamps, Alchemy bubbles, Equinox, Printer, AFK gains, Voting, Storage, Statues, Construction, Summoning (W5), Friend slots, Post Office, Cooking, Sailing, W7 systems. [C7]
- **Per-session actions:** when an event is live: spend points in priority order; between events: nothing. Flag "unspent Event Points" and "affordable item not owned". [C6][C4]
- **AFK Setup implications:** none directly; item 5 raises AFK gains for all characters. [C13]
- **Common mistakes:** buying 1x-use items first instead of multiplicative ones; not knowing an item is account-wide permanent. Detectable: OLA[311] letters vs OLA[310] points. [C6]

## Mechanics catalogue

Encoding [C1][C2]: `getEventShopBonus(account, id)` returns 1 if letter `number2letter[id]` appears in `accountOptions[311]`, else 0 (P/misc.ts#L1938-1941; `utility/helpers.js#L75` for the letter table: index 0 "_", 1 "a" ... 27 "A"...). Currency is `accountOptions[310]` (P/misc.ts#L1937 comment). Every bonus is a boolean, no levels. Cost is from the wiki (tier 3, not in game data in the vendor tree). "Parsed" = Toolbox applies it; "NOT PARSED" = id inferred from wiki order, no Toolbox use.

| id | Name (wiki) | Cost | Rule / formula | Toolbox path |
|---|---|---|---|---|
| 0 | Golden Tome | 35 | unlocks Tome DMG-multi bonus type | P/world-4/tome.ts#L225 [C8] |
| 1 | Stamp Stack | 30 | +3 stamp level-ups per day | P/world-1/stamps.ts#L66-72 (STAMPS_PER_DAY_EVENT=3) [C9] |
| 2 | Bubble Broth | 20 | turns No Bubble Left Behind on, +2 to NBLB bubble level (wiki text says "+5 LVs random bubble"; code says +2: disagreement, code wins) | P/world-2/alchemy.ts#L1056,L1075 [C10] |
| 3 | Equinox Enhancement | 15 | equinox bar fill rate multi (wiki 1.5x) | P/world-3/equinox.ts#L81 [C11] |
| 4 | Supreme Wiring | 45 | Printer x(1 + 2*OLA[323]*owned/100): +2% per day since last sample reset | P/world-3/printer.ts#L123,L153 [C12] |
| 5 | Sleepy Joe Armstrong | 25 | +20 added in the AFK gains additive sum | P/character.ts#L3258,L3297 [C13] |
| 6 | Village Encouragement | 40 | W5 villager EXP/hr (wiki 1.25x) | P/world-5/hole.ts#L627 [C14] |
| 7 | Gilded Vote Button | 35 | +17 to Ballot bonus multi | P/world-2/voteBallot.ts#L103,L115 [C15] |
| 8 | Extra Page | 20 | +1 Card filter page | NOT PARSED [C16] |
| 9 | Coin Stacking | 15 | x1.5 money (1 + 0.5*owned) | P/character.ts#L2813,L2856 [C17] |
| 10 | Storage Chest | 20 | +12 storage slots | P/storage.ts#L94,L107 [C18] |
| 11 | Storage Vault | 40 | +16 storage slots | P/storage.ts#L95,L108 [C18] |
| 12 | Secret Pouch | 30 | +3 inventory slots | NOT PARSED [C16] |
| 13 | Ribbon Connoisseur | 60 | unlocks/boosts the W4 daily Ribbon Shelf (+3 ribbons/day) | P/world-4/cooking.ts#L564-565 [C19] |
| 14 | Golden Square | 23 | +1 Gilded (Trimmed) construction slot, 3x speed; slots capped by MAX_GILDED_SLOTS | P/world-3/construction.ts#L539 [C20] |
| 15 | Summoning Star | 50 | +10 Gambit Summoning Doublers (W5) | P/world-5/caverns/gambit.ts#L14-15,L36 [C21] |
| 16 | Royal Vote Button | 35 | +13 more ballot multi (30 total with id 7) | P/world-2/voteBallot.ts#L104,L115 [C15] |
| 17 | Another Page | 50 | +1 Card filter page | NOT PARSED [C16] |
| 18 | Extra Exaltedness | 35 | +1 Exalted Stamp use (compass remaining-uses term) and feeds getExaltedStampBonus; wiki also says +20% Exalt bonus | P/class-specific/compass.ts#L411; P/world-1/stamps.ts#L323 [C22] |
| 19 | Smiley Statue | 90 | all statues x1.30 (a multiplier on the statue stack) | P/world-1/statues.ts#L113 [C23] |
| 20 | Government Subsidy | 17 | x1.6 monster money (1 + 0.6*owned) | P/character.ts#L2814,L2857 [C17] |
| 21 | Automated Mail | 15 | +5 Post Office boxes per day | NOT PARSED [C16] |
| 22 | Friendly Slot | 12 | +1 Friend Bonus slot (cap 20) | P/misc.ts#L152 [C24] |
| 23 | Fossil Meritocracy | 45 | +20 Meritocracy (W7) bonus, additive | P/world-2/voteBallot.ts#L42,L47,L61 [C25] |
| 24 | Bonus Points | 20 | x1.5 Hoops/Darts arcade-shop points | NOT PARSED [C16] |
| 25 | Coolral | 30 | Coral Reef daily gain x1.3 | P/world-7/coralReef.ts#L298,L315 [C26] |
| 26 | Plain Showcase | 35 | +1 Gallery trophy slot, total capped at 19 | P/world-7/gallery.ts#L332-339 [C27] |
| 27 | Singed Tome | 125 | unlocks Tome Drop-rate multi bonus | P/world-4/tome.ts#L226 [C8] |
| 28 | Higgs Boson | 150 | atom max level +20 | P/world-3/atomCollider.ts#L70-72 [C28] |
| 29 | Worldclass Showcase | 180 | +1 Grade-4 Gallery podium | P/world-7/gallery.ts#L373-377 [C27] |
| 30 | King of the Rack | 35 | Hat Rack multi +10 | P/world-3/hatRack.ts#L45,L49 [C29] |
| 31 | Omega Bubble | 90 | Kattlekruk daily bubbles x(1 + 0.5*owned) | P/world-2/alchemy.ts#L1184,L1189 [C30] |
| 32 | Legend Scroll | 25 | +2 Legend Talent points (W7) | P/world-7/legendTalents.ts#L201-202 [C31] |
| 33 | Kaleidoscope | 35 | +1 Kaleidoscope (Research) | P/world-7/research.ts#L303 [C32] |
| 34 | Magnifying Glass | 25 | +1 Magnifier (Research) | P/world-7/research.ts#L491,L498 [C32] |
| 35 | Keen Observations | 33 | +3 daily observation rolls | P/world-7/research.ts#L313 [C32] |
| 36 | Shape Obsession | 200 | +1 Research grid shape (cap 10) | P/world-7/research.ts#L219 [C32] |
| 37 | Rift Guy Sticker | 75 | +30 added to the W6 sticker bonus group: (1 + (grid68 + 30*owned)/100) | P/world-6/farming.ts#L483-487 [C16] |
| 38 | Glimbo Coupon | 60 | Glimbo trade cost x(1-25*owned/100), floor 0.1 | P/world-7/minehead.ts#L354 [C33] |
| 39 | Tiny Cog Twins | 175 | Tiny Cogs per day x2 | P/world-7/research.ts#L358 [C32] |
| 40 | Glimbo VIP Pass | 199 | **Disputed (see C34).** On flagged Glimbo vault upgrades max LV = base + bundle + round((1 + grid169Lv + owned) * trades): +1 extra LV per trade (1 -> 2 only when grid169 is 0) | P/misc/upgradeVault.ts#L165-172 [C34] |
| 41 | Golden Registrant | 15 | 1000 Gold Balls on Grand Tournament registration | NOT PARSED [C16] |
| 42 | Glass Dice | 35 | crystal mob spawn: (5*owned + product)/2000 | P/character.ts#L3099,L3113 [C35] |
| 43 | Magnate Exotica | 170 | +8 Exotic Market max purchases; free-purchase chance min(80, 30*owned)% | P/world-6/farming.ts#L281-284 [C16] |
| 44 | Minehead Money | 35 | Minehead currency x2 flat | P/world-7/minehead.ts#L208-209 [C36] |
| 45 | Sushi Stackz | 20 | Sushi Station currency x(1+100*owned/100) = x2 | P/world-7/sushiStation.ts#L245,L252 [C36] |
| 46 | Research Registrant | 150 | tournament registration banks 12h research gains; Toolbox treats as 1.5x rate | P/world-7/research.ts#L203,L222 [C32] |
| 47 | Monumental Reverence | 175 | +100 LVs for all Monument bonuses daily | NOT PARSED [C16] |
| 48 | Noble Sluggo ("Purple Chest Slugs" in code) | 90 | artifact find x1.5^owned | P/world-5/sailing.ts#L730-731 [C37] |
| 49 | Doggie Sticker | 250 | sticker odds x2 daily until found | NOT PARSED [C16] |
| 50 | 6 Star Cardifiers | 200 | 8 usable 6-star cardifiers | NOT PARSED [C16] |
| 51 | Elegant Ribbons | 190 | new ribbons 25% chance of +1 tier | P/world-4/cooking.ts#L578 [C19] |
| 52 | Fishmaxxing | 275 | Poppy (Kangaroo): 5x fish, 75% cheaper: cost / (1 + 3*owned) | P/world-2/kangaroo.ts#L50,L56 [C38] |
| 53 | Dough Roller | 50 | flat x2 meal cooking speed | P/world-4/cooking.ts#L754 [C39] |
| 54 | Bejeweled Ladle | 250 | +5 Purple and Yellow Cooking Mastery PTS | P/world-4/cooking.ts#L364 [C39] |
| 55 | Boat Discount | 100 | sailing boat upgrade cost x 1/(1+0.43*owned) (wiki: 30% cheaper) | P/world-5/sailing.ts#L548 [C37] |

W5+ extensions (in table above): 6, 15, 48, 55 (W5); 37, 43 (W6 farming); 23/25/26-29/32-36/38-40/44-46 (W7). Not W1-W4 systems but they spend the same currency.

### Seasonal events (card-bearing)
- Event cards live in category "Events" (Y0-Y24) in `data/website-data/cards.json`. Each has a per-tier step and a passive/active effect. [C40]
- Gold Food effect: `cropfallEvent1` (Bort The Cornhusk, +Gold_Food_Effect (Passive), base 4, per tier 6) and `anni5Event1` (IdleOn 5th Anniversary, base 5, per tier 6) are each capped separately at 50 and summed (max +100): `min(calcCardBonus,50)` per card. P/misc.ts#L947-954 [C41]
- Other event cards: Giftmas (xmasEvent..4), Valenslimes/love (loveEvent..3), Easter (EasterEvent1-2), Summer (SummerEvent1-2), Spring (springEvent1-2), Falloween (fallEvent1), Anniversary 4/5, Luck (luckEvent1-2). [C40]
- Winter/Giftmas day counter OLA[323] feeds Supreme Wiring (id 4). [C12]
- Event shop letters are NOT cleared by Toolbox between events (no code path): treated as permanent (confidence M; wiki states no deadline). [C1][C5]
- `accountOptions[323]` (Winter event counter) is a separate event-progress option used only by the Printer id-4 formula; ribbons have several unlock paths (grimoire, bundles, id 13) and id 51 is a separate input. [C12][C19]
- **Per-event stock rotation (missed, confidence L):** the wiki lists stock per event (Summer Break, Giftmas, Valenslimes Day, Anniversary, Cropfall, Goldrush, 2024-2026). The per-event item lists and the Goldrush event are not captured in this dossier; research task open. The vendored data holds no event schedule or points-earn rate, so "event live" cannot be derived from the save. Source: https://idleon.wiki/wiki/Event_Shop (tier 3, 2026-10-19), grep vendor/data (tier 1). [C45]

## Min-max by stage

No community ordering sources were reachable (web search budget exhausted, wiki event pages 404). The ordering below is derived from the formulas and flagged tier 3-derived, confidence L-M. [C42]

- **W1 early / mid / late:** Storage Chest (10) and Vault (11) slots, Coin Stacking (9) and Government Subsidy (20) x1.5/x1.6 money, Stamp Stack (1) (+3 stamp levels/day is the best returns per point in W1-W2). Smiley Statue (19) is the best W1 pick once points allow (90). [C43]
- **W2:** Bubble Broth (2), Gilded then Royal Vote Button (7,16), Omega Bubble (31) when Kattlekruk is reached. [C43]
- **W3:** Equinox Enhancement (3), Golden Square (14), Higgs Boson (28, 150), King of the Rack (30), Supreme Wiring (4) if you take new Printer samples rarely. [C43]
- **W4:** Dough Roller (53), Ribbon Connoisseur (13), Golden Tome (0) then Singed Tome (27), Elegant Ribbons (51), Bejeweled Ladle (250). [C43]
- **Universal:** Sleepy Joe (5) +20 AFK gains, Friendly Slot (22, only 12 points). [C43]

## Per-session / UI implications for ActiveOn
- No Account State field currently exposes OLA[310]/[311] (grep of `packages/account-state/src` found no use; confidence H); a typed `eventShop: { points, owned: number[] }` field is required before any detector can exist. [C44]
- Checklist: event cards (Gold Food) already enter via `getGoldenFoodMulti`; a seasonal "event live / points unspent" row has no Knowledge Base owner yet (`checklist.yaml` has none). [C44]

## Save and Toolbox fields
- `account.accountOptions[310]` event points; `[311]` owned-letters string; `[323]` winter-event day counter. [C1][C12]
- Parser entry: `getEventShopBonus` P/misc.ts#L1938. [C1]

## Common mistakes
See above.

## Sources
Listed per claim below. All verified 2026-10-19, game 2.3.540. Wiki items are post-2.3.5xx as the page lists events through Cropfall 2026.

## Claims

[C1] Event Shop ownership is read as a boolean: 1 if the letter number2letter[id] occurs in accountOptions[311], else 0; no levels. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/misc.ts#L1938-1941 (tier 1, verified 2026-10-19, game 2.3.540)
[C2] number2letter maps id 0 to '_', 1 to 'a', ... 27 to 'A' etc., so ids 0-55 each have a single character. (confidence H) Source: packages/toolbox-parsers/vendor/utility/helpers.js#L75 (tier 1, verified 2026-10-19, game 2.3.540)
[C3] accountOptions[310] is the event currency (Event Points). (confidence H) Source: packages/toolbox-parsers/vendor/parsers/misc.ts#L1937 (tier 1, verified 2026-10-19, game 2.3.540)
[C4] Event Shop items cost Event Points, 12 to 275 each, and each item lists the seasonal events that stocked it (Summer Break, Giftmas, Anniversary, Valenslimes Day, Goldrush, Cropfall). (confidence L) Source: https://idleon.wiki/wiki/Event_Shop (tier 3, verified 2026-10-19, game 2.3.540)
[C5] Items rotate between events; the wiki does not state a purchase deadline or reset for owned items (permanence assumed, not confirmed). (confidence L) Source: https://idleon.wiki/wiki/Event_Shop (tier 3, verified 2026-10-19, game 2.3.540)
[C6] Bonuses are only active if the id's letter is owned; absent OLA[311] returns 0 for all. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/misc.ts#L1939 (tier 1, verified 2026-10-19, game 2.3.540)
[C7] Event Shop ids are consumed by parsers in storage, character, upgradeVault, compass, equinox, hatRack, printer, construction, atomCollider, hole, sailing, tome, cooking, gambit, voteBallot, kangaroo, alchemy, gallery, minehead, coralReef, legendTalents, sushiStation, research, statues, stamps. (confidence H) Source: grep getEventShopBonus packages/toolbox-parsers/vendor/parsers (2026-10-19) (tier 1, verified 2026-10-19, game 2.3.540)
[C8] ids 0 and 27 gate the Tome DMG-multi (Golden Tome) and Drop-multi (Singed Tome) bonus types. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-4/tome.ts#L225-226 (tier 1, verified 2026-10-19, game 2.3.540)
[C9] id 1 gives +3 stamp level-ups per day (STAMPS_PER_DAY_EVENT=3), alongside bundle +5 and Summoning winner bonus. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-1/stamps.ts#L64-72 (tier 1, verified 2026-10-19, game 2.3.540)
[C10] id 2 turns No Bubble Left Behind on and adds +2 to the NBLB level; wiki describes it as '+5 LVs for a random bubble every day' (sources disagree, code preferred, confidence M). Source: packages/toolbox-parsers/vendor/parsers/world-2/alchemy.ts#L1056-1058,L1075 ; https://idleon.wiki/wiki/Event_Shop (tier 1, verified 2026-10-19, game 2.3.540)
[C11] id 3 is Equinox Enhancement, a bar fill rate term in the Equinox calc (wiki: 1.5x). (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-3/equinox.ts#L81 ; https://idleon.wiki/wiki/Event_Shop (tier 1, verified 2026-10-19, game 2.3.540)
[C12] id 4 multiplies Printer output by 1 + 2*OLA[323]*owned/100, OLA[323] being days since the last sample. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-3/printer.ts#L123,L153 (tier 1, verified 2026-10-19, game 2.3.540)
[C13] id 5 adds 20 to the additive AFK gains sum (+20% AFK gains). (confidence H) Source: packages/toolbox-parsers/vendor/parsers/character.ts#L3258,L3297 (tier 1, verified 2026-10-19, game 2.3.540)
[C14] id 6 boosts W5 villager EXP per hour (wiki 1.25x). (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-5/hole.ts#L627 ; https://idleon.wiki/wiki/Event_Shop (tier 1, verified 2026-10-19, game 2.3.540)
[C15] id 7 adds 17 and id 16 adds 13 to the ballot bonus multiplier (30 together). (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-2/voteBallot.ts#L103-125 (tier 1, verified 2026-10-19, game 2.3.540)
[C16] Corrected after verification (refuted by both lenses): ids 37 and 43 ARE consumed in Toolbox (37: +30 to W6 sticker bonus, 43: +8 Exotic Market purchases and min(80,30*owned)% free). Unused in Toolbox: 8, 12, 17, 21, 24, 41, 47, 49, 50 (Extra Page, Secret Pouch, Another Page, Automated Mail, Bonus Points, Golden Registrant, Monumental Reverence, Noble Sluggo-like/Doggie Sticker; names and effects from wiki order, id mapping inferred, confidence L-M). Wiki effects: 8/17 +1 Card filter page each, 12 +3 inventory slots, 21 +5 Post Office boxes/day, 24 1.5x Hoops/Darts PTS, 41 Gold Balls on Grand Tournament registration, 47 +100 LV Monument bonuses daily, 49 2x sticker odds, 50 8 usable 6-star cardifiers. Note: a verifier listed id 49 as Noble Sluggo (1.5x artifact find) while this dossier maps id 48 to it via sailing.ts#L730-731; the id 48/49 mapping is unresolved, confidence L. Source: packages/toolbox-parsers/vendor/parsers/world-6/farming.ts#L281-284,L483-487 (tier 1); https://idleon.wiki/wiki/Event_Shop (tier 3, verified 2026-10-19, game 2.3.540). Confidence H for 37/43, L-M for the rest.
[C17] ids 9 and 20 are x(1+0.5) and x(1+0.6) money multipliers (wiki: Coin Stacking 1.5x all coins, Government Subsidy 1.6x monster coins). (confidence H) Source: packages/toolbox-parsers/vendor/parsers/character.ts#L2813-2857 (tier 1, verified 2026-10-19, game 2.3.540)
[C18] ids 10 and 11 add 12 and 16 storage slots. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/storage.ts#L94-108 (tier 1, verified 2026-10-19, game 2.3.540)
[C19] id 13 is one of several unlock paths for the daily Ribbon Shelf (also grimoire, bundles) and id 51 is Elegant Ribbons in the daily ribbon inputs and id 51 is Elegant Ribbons in the daily ribbon inputs. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-4/cooking.ts#L564-578 (tier 1, verified 2026-10-19, game 2.3.540)
[C20] id 14 adds a Gilded construction slot, total capped at MAX_GILDED_SLOTS. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-3/construction.ts#L532-541 (tier 1, verified 2026-10-19, game 2.3.540)
[C21] id 15 adds 10 Gambit Summoning Doublers (EVENT_SHOP_DOUBLERS=10). (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-5/caverns/gambit.ts#L14-15,L36 (tier 1, verified 2026-10-19, game 2.3.540)
[C22] id 18 adds 1 to the remaining Exalted Stamp uses and also feeds getExaltedStampBonus (wiki: +20% Exalt bonus). (confidence H) Source: packages/toolbox-parsers/vendor/parsers/class-specific/compass.ts#L405-412 ; world-1/stamps.ts#L323 (tier 1, verified 2026-10-19, game 2.3.540)
[C23] id 19 multiplies every statue by 1 + 0.3 (wiki: 1.30x forever). (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-1/statues.ts#L113,L121 (tier 1, verified 2026-10-19, game 2.3.540)
[C24] id 22 adds 1 Friend Bonus slot, slots capped at 20. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/misc.ts#L147-153 (tier 1, verified 2026-10-19, game 2.3.540)
[C25] id 23 adds 20 to the Meritocracy multiplier. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-2/voteBallot.ts#L42-47 (tier 1, verified 2026-10-19, game 2.3.540)
[C26] id 25 multiplies Coral Reef daily gain by 1.3. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-7/coralReef.ts#L298,L315 (tier 1, verified 2026-10-19, game 2.3.540)
[C27] ids 26 and 29 add a Gallery trophy slot (cap 19) and a Grade-4 podium. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-7/gallery.ts#L328-339,L370-377 (tier 1, verified 2026-10-19, game 2.3.540)
[C28] id 28 adds 20 to atom max level. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-3/atomCollider.ts#L70-72 (tier 1, verified 2026-10-19, game 2.3.540)
[C29] id 30 adds 10 to the Hat Rack bonus multi. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-3/hatRack.ts#L45-49 (tier 1, verified 2026-10-19, game 2.3.540)
[C30] id 31 multiplies Kattlekruk bubble levels by 1.5. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-2/alchemy.ts#L1184-1194 (tier 1, verified 2026-10-19, game 2.3.540)
[C31] id 32 adds 2 Legend Talent points. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-7/legendTalents.ts#L201-202 (tier 1, verified 2026-10-19, game 2.3.540)
[C32] ids 33, 34, 35, 36, 39, 46 are W7 Research effects: +1 Kaleidoscope, +1 Magnifier, +3 daily rolls, +1 shape (cap 10), Tiny Cogs x2, registrant 1.5x rate. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-7/research.ts#L203-358,L487-498 (tier 1, verified 2026-10-19, game 2.3.540)
[C33] id 38 cuts Glimbo trade cost by 25%, floored at 0.1x. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-7/minehead.ts#L354 (tier 1, verified 2026-10-19, game 2.3.540)
[C34] **Disputed** (gamedata lens refuted, source lens verified as +1 -> 2 consistent with wiki). Original view: id 40 makes Glimbo trades add +2 rather than +1 vault max LV. Code view: for flagged Glimbo upgrades, max LV = base + bundle + round((1 + grid169Lv + eventShop40) * trades), so id 40 adds +1 extra LV per trade on top of whatever grid 169 gives (not a flat +2). Correction: +1 extra max LV per trade on flagged upgrades. Confidence M. Source: packages/toolbox-parsers/vendor/parsers/misc/upgradeVault.ts#L165-172 (tier 1, verified 2026-10-19, game 2.3.540)
[C35] id 42 adds 5 to the crystal spawn numerator over 2000 (Glass Dice); wiki says +50% crystal spawn chance, units reconcile only via the product term (code verified, wiki units unreconciled, confidence M). Source: packages/toolbox-parsers/vendor/parsers/character.ts#L3099,L3113 (tier 1, verified 2026-10-19, game 2.3.540)
[C36] ids 44 and 45 double Minehead and Sushi Station currency. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-7/minehead.ts#L208-209 ; sushiStation.ts#L245-252 (tier 1, verified 2026-10-19, game 2.3.540)
[C37] ids 48 (artifact find x1.5) and 55 (boat upgrade cost x1/1.43) are W5 Sailing effects. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-5/sailing.ts#L548,L730-731 (tier 1, verified 2026-10-19, game 2.3.540)
[C38] id 52 Fishmaxxing divides Poppy upgrade cost by 1+3*owned (75% off) and gives 5x fish. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-2/kangaroo.ts#L48-56 (tier 1, verified 2026-10-19, game 2.3.540)
[C39] ids 53 and 54 are a flat 2x meal speed and +5 Purple and Yellow Cooking PTS. (confidence H) Source: packages/toolbox-parsers/vendor/parsers/world-4/cooking.ts#L364,L754 (tier 1, verified 2026-10-19, game 2.3.540)
[C40] Event cards (Y0-Y24, category 'Events') cover Giftmas, Love, Easter, Summer, Spring, Falloween, Luck, Cropfall and Anniversary 4/5, e.g. xmasEvent +Total Drop Rate, SummerEvent2 +Catching EXP. (confidence H) Source: packages/toolbox-parsers/vendor/data/website-data/cards.json (tier 1, verified 2026-10-19, game 2.3.540)
[C41] cropfallEvent1 (base 4, per tier 6) and anni5Event1 (base 5, per tier 6) each give Gold Food Effect (Passive), each capped at 50 separately, summed (max 100). (confidence H) Source: packages/toolbox-parsers/vendor/parsers/misc.ts#L947-954 ; cards.json (tier 1, verified 2026-10-19, game 2.3.540)
[C42] Priority orders below are derived from formula magnitude and costs, not from a sourced community ranking; no community meta source was reachable this run. (confidence L) Source: derived; wiki event pages 404, web search quota exhausted (2026-10-19) (tier 3, verified 2026-10-19, game 2.3.540)
[C43] Early-game picks (storage, coin multipliers, Stamp Stack, Smiley Statue) and later picks (vote buttons, Equinox, Higgs Boson, Tomes, Dough Roller) are ordered by effect size per cost (confidence L). Source: derived from the catalogue claims C8-C39 (tier 3, verified 2026-10-19, game 2.3.540)
[C44] Account State exposes no event points/owned field and the Knowledge Base has no Event Shop or event-live checklist row. (confidence H) Source: grep packages/account-state/src, packages/knowledge/systems/checklist*.yaml (2026-10-19) (tier 1, verified 2026-10-19, game 2.3.540)
[C45] Per-event stock rotation, the Goldrush event, and event schedule/points rate are absent from vendored data; only wiki lists them (confidence L, open research). Source: https://idleon.wiki/wiki/Event_Shop (tier 3, verified 2026-10-19, game 2.3.540)
