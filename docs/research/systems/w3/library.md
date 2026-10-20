# Talent Book Library - M26 dossier

Verified 2026-10-19. Game version 2.3.540, Toolbox pin 6c37e3d. `P` = `packages/toolbox-parsers/vendor/parsers/`, `D` = `packages/toolbox-parsers/vendor/data/website-data/`. Tiers: 1 game data/Toolbox code, 2 Toolbox logic/dashboard, 3 wiki, 4 community. Prior research: none in topics.json; the M15 spec (`docs/specs/M15-account-depth.md` F4, V4) and the w3-systems / account-wide / character-builds research branches were read and cross-checked against code. Web search budget was exhausted, so community coverage (tier 4) is thin: one progression gist; Reddit is unfetchable.

## Talent Book Library

- **What it is:** a W3 Construction building plus an account-wide stock of "checkouts". Each checkout lets you pick a class page and a talent and produces a talent book item whose level (101+) is a random roll; holding the book down raises that talent's max level for the one character who reads it. [C1][C2][C3][C4]
- **Unlocks (H, tier 1/3):** the Library is a Construction building (Construction is W3; Redox Salts to build). Checkouts accrue account-wide even before the building exists (the W2-late test account had 11 stored with the building at Lv 0; fixture claim unverifiable, confidence L, although code counts checkouts regardless of building level, H), so the first W3 session can show a pile. [C1][C5][C6]
- **Scope:** checkout stock, speed and level range are account-wide. A book is consumed on one character; max levels are per character and shared by both presets. [C5][C7][C8]
- **Inputs -> outputs:** time (and speed bonuses) in -> checkouts; a checkout (20 with Book Reservation) -> one book; one book read -> a raised talent max level on one character. [C4][C9][C10]
- **Goals and Milestones:**

| Milestone | Effect | Source |
|---|---|---|
| Library Lv 1 | building exists, +5% checkout speed per level | [C1][C11] |
| 1000 total building levels (Construct Mastery, rift 40) | Library building cap 101 -> 201 | [C12] |
| Achievement "Checkout Takeout" (1,000 checkouts) | +5 max book level, +30% checkout speed (H, tier 1) | [C13] |
| Stored checkouts >= 20 with Book Reservation System | next book guaranteed max level | [C10] |
| Atom "Oxygen - Library Booker" Lv >= 1 | max book level +10; min +1 per atom level | [C14] |

- **Feeds / fed by:** fed by Construction (Salt, building levels), Cooking (Fortune Cookie), Alchemy (bubble, vial), Stamps (Biblio), Atom Collider, Achievements, Gem Shop, Bribes, Task Shop merits, Salt Lick, Sailing (Fury Relic, W5), Summoning (W6), Gaming superbit (W5), Lab Automation Arm. Feeds talent max levels -> damage, AFK gains, skill efficiency (any book-eligible talent). [C11][C14][C15][C16]
- **Per-session actions:** if checkouts >= 1 (>= 20 with Reservation on), check out a book for the highest-leverage capped talent; read any held book that raises a character's max; do not let the stock sit high, since each stored checkout slows the next. Idle = 0 checkouts and no unread books. [C4][C9][C17]
- **AFK Setup implications:** none direct. The checkout clock is account-wide and runs while offline (`timeAway.BookLib`), but only once the game is closed for over 300 s is the AFK span added by Toolbox. [C5]
- **Min-max by stage:** see below.
- **Common mistakes:** checking out a talent that is not already filled to its current max (the extra levels cannot be used); checking out a stat talent (not allowed) or a talent no build uses; hoarding checkouts (time grows ~n^1.4); reading a lower-level book than the character already has; assuming Reservation also guarantees VIP bookshelf books. [C4][C9][C18][C19][C20]
- **Save and Toolbox fields:** see catalogue.
- **Sources:** inline per claim.

## Mechanics catalogue

### 1. Checkout generation (the clock)

- **Stock.** Base count = raw `OptLacc[55]` (`account.accountOptions[55]`); the clock fill = `timeAway.BookLib` plus the AFK span since `timeAway.GlobalTime` if that span exceeds 300 s; while the fill exceeds the time for the next checkout, spend it and add 1. Output `account.libraryTimes.{bookCount,next,breakdown,breakpoints}`; ActiveOn reads it in `readLibrary`. [C5]
- **Time for the next checkout** (game `BookReqTime`): `round( 4h * 3600 / M * (1 + 10 * n^1.4 / 100) )`, n = checkouts currently stored. Computed table at M = 1 (no bonuses): n=0 4.0 h; 1 4.4 h; 2 5.1 h; 5 7.8 h; 10 14.1 h; 16 23.4 h; 20 30.5 h; 40 74 h; filling 0->20 takes about 12 days at M = 1. [C4][C21]
- **Speed multiplier** `M = (1 + meal/100) * (1 + atom/100) * (1 + (5*towerLv + bubble + vial + stamp + achievement + superbit)/100)`. Terms:
  - tower: `Tower[1]` (raw `Tower`, `towers.data[Talent_Book_Library].level`), 5% per level, building cap 101 (201 with Construct Mastery). [C1][C11][C12]
  - meal: Fortune Cookie (`CookingMB34`, stat `Lib`, baseStat 4, needs 12,000,000 cooked), via `getMealsBonusByEffectOrStat(account, null, 'Lib')`, multiplicative. W4 Cooking. [C22]
  - atom: Oxygen - Library Booker (`atoms.atoms[7]`), value = level * baseBonus 2 (% speed), multiplicative; costs x1 1000, x2 1.24, x3 3250. W3 Atom Collider (Lab-adjacent). [C14]
  - bubble: IGNORE_OVERDUES (Kazam cauldron c13, decay x1 100, x2 60) via `getBubbleBonus`. [C23]
  - vial: CHONKER_CHUG (vial 30, stat `TalBookSpd`, add x1 1, needs Dune Soul + Liquid2 ...). [C24]
  - stamp: Biblio_Stamp (misc tree index 19, `StampC20`, stat `BookSpd`, add x1 1). [C25]
  - achievement: 30 * status of achievement 145 "Checkout Takeout" (+30%). [C13]
  - superbit: Gaming "Library_Checkouts" (index 12, +1% per Gaming Lv of the logged-in character, floor). W5. [C26]
- **Pre-patch note:** the wiki calls the time rise "exponential"; the code is a power law (n^1.4). Code wins (tier 1). [C21]

### 2. Book level roll

- **Min book level** = `round(101 + 5 * gemShopPurchases[113] + Library_Double_Agent bribe (4) + atomLevel)` (`getBookLvRange`, P/misc.ts). [C27]
- **Max book level** = `round(125 + Fury_Relic artifact bonus + summoning winner bonus '+{ Library Max' + 10 * min(atomLevel,1) + min(5, 5*status(achievement 145)) + saltLick[4] bonus + 2 * tasks[2][2][2])`. [C27]
- **Each source:** Gem Shop "BURNING BAD BOOKS" (global index 113, +5 min each, max 4 purchases, cost 250 + 75 per level; Gem Shop is account-wide); Bribe "Library Double Agent" (+4 min, 9,156,348 coins, NPC world3; BribeStatus[18]); Oxygen atom (+1 min per level, +10 max once Lv >= 1); Merit/Task Shop row Tasks[2][2][2] (+2 max per level, wiki x5 = +10); Salt Lick Spontaneity Salts (+2 max per level, max Lv 10 = +20); Achievement 145 (+5 max); Fury Relic sailing artifact (+25 base, W5); Summoning winner bonus id 19 "Library Max" on 13 enemy battles (W6). [C28][C29][C30][C31][C32][C33][C34]
- **Full-bonus extremes (wiki):** min 196, max 441 (our sum: 125 + 175 Fury (higher form) + 10 merit + 20 salt + 5 ach + 10 atom + about 96 summoning = 441). [C35]
- **The roll:** a checkout makes one random level in [min, max] (N.js @8875709, per M15); the distribution is not modeled by Toolbox (unverifiable here, confidence L). The wiki says "random number of the new max level". [C4][C36]
- **Reservation:** Lab Automation Arm 5th bonus, "Book Reservation System": with >= 20 stored, the next checkout is the highest level and spends 20. Save toggle `Lab[16][3] == 1`; costs 50 Spontaneity Salts base, 750 to max (Automation Arm). Not for VIP bookshelf books (this last clause is unverified: the wiki fetch and gist did not surface it, and Toolbox does not model Reservation; confidence L). Wiki text and 13 May 2025 revision confirmed (tier 3, H) but the revision predates the current patch; the toggle location `Lab[16][3]` comes from the M15 spec only (L). [C10][C19][C37]

### 3. Which talents are eligible

- Eligible = main-class talents with `skillIndex < 615` (star talents begin there) except indices `[10,11,12,23,75,79,86,87,266,267,446,447]` (STR/AGI/WIS/LUK talents and their Basics-tab pair; game `RANDOlist[16]`), which show "This Book is not Available". Code: `isBookEligibleTalent`, `BOOK_INELIGIBLE_INDICES` (P/talents.ts L447-L460). [C18]
- Pages: Beginner `TalentBook2`, Warrior `TalentBook3`, Archer `TalentBook4`, Mage `TalentBook5` (`talentLibraryBooks` in wikiTables lists order 3,4,5,2). `TalentBook1` is the "Special Talent Book" (Class ALL, no Library use found in code). [C38]
- Book item: item fields `Speed` = talent skill index, `Reach` = book level (inventory/storage item). ActiveOn `HeldBook`. Reading = hold it down; raises that talent's `SkillLevelsMAX` for the reader to the book level (only if higher). [C7][C39]

### 4. VIP Bookshelf (W4)

- Seven extra "VIP" talents unlock at VIP Library points of 1%, 10%, 30%, 75%, 125%, 500%, 1000%. Sources of VIP Library PTS in data: meals with effect `+{%_VIP_Library_PTS` (e.g. Garlic Bread, stat `VIP`, cookReq 175, baseStat 4) and the Pet Arena wave 5 "+25% Library VIP". Not in Toolbox parsers (no parser reads stat `VIP`), so ActiveOn cannot read it today. [C20][C40][C41]

### 5. W5+ extensions (one line each)

- Fury Relic (Sailing artifact): +25 max book level base; ancient/eldritch forms multiply. [C30]
- Gaming superbit Library_Checkouts: +1% checkout speed per Gaming level. [C26]
- Construct Mastery (rift 40): building cap 101 -> 201 at 1000 total building levels. [C12]
- W6 Summoning winner bonus "Library Max" (13 battles incl. rift/endless). [C34]
- Time Candy-style items: one data row grants "2 Library Checkouts" (candy bonus). [C42]

### 6. Additional verified mechanics (revision)

- **Achievement 145 gives two bonuses.** "Checkout Takeout" grants +5 Book Max LV and +30% checkout speed (additive group). Code caps 30 and 5. Tier 1, H. [C13] (`misc.ts` getBookLvRange, getTimeToNextBooks)
- **Toolbox breakpoints.** `getLibraryBookTimes` returns time to reach 16/18/20 stored (less current clock fill) and 0->20/40/60/80/100 checkouts (`libraryTimes.breakpoints`). Tier 1, H.
- **Time Candy.** Data row (`shared-data.json`, bonusName `Timecandy1`, x1 8, x3 2): "Get 2 Library Checkouts! It's put right into the library!". Drop/purchase sources not researched; confidence M for effect, L for sourcing. Tier 1.
- **Construct Mastery +100** applies only to the tower with maxLevel 101 (the Library); `getExtraMaxLevels`. Tier 1, H.
- **Fury Relic** baseBonus 25 for the base form; `artifacts.json` lists ancient/eldritch/sovereign/omnipotent/transcendent forms with doubled/tripled/quadrupled/quintupled/sixtupled text, so the max-level contribution scales with form (x2 to x6 on the base 25). The wiki-extreme figure of 175 above is not a clean multiple of 25 via this list; confidence L on the 441 reconstruction. Tier 1 for the data, `multiplier` fields are all 1 in the file.
- **Library building cost curve.** Index 1, maxLevel 101, bonusInc 1.18, costInc [5,30], Redox Salts x6 (`shared-data.json`). Usable as a build-priority input. Tier 1, H. [C1]
- **VIP points.** Meals with stat VIP (Garlic Bread, Sourish Fish, Orange, Sushi Roll) feed VIP Library PTS; no Toolbox parser consumes them, so ActiveOn cannot read the total. Pet Arena accrual maths unresearched (L).
- **Offline accrual.** Toolbox accrues while AFK > 300 s (`timeAway.BookLib` + span); no stated cap on stored checkouts in code. A real cap, if any, is unverified (L).
- **Not yet answered (open):** exact Book Reservation threshold semantics (>19 stored, spends 20) are spec-only (L); where players pick the talent in the class-page UI; Achievement 145 counter (1,000 checkouts) is not tracked as a Goal in ActiveOn.

## Min-max by stage

Honest note: there is little published stage-by-stage Library meta. The only dated community line found is tier 4; the rest is derived from the formulas (tier 1) and marked as derived.

- **W1 / W2:** no Library yet. Do nothing but know checkouts are banking silently; they cost nothing but slow the clock (derived from C4). Buy Library-related W1/W2 modifiers that exist already: Biblio Stamp, Chonker Chug vial, Burning Bad Books gem purchases when affordable (derived; low priority). [C4][C24][C25][C28]
- **W3 early:** build the Library (cheap, 6 Redox Salts base, +5% speed/level) after the 3D Printer, Death Note, Salt Lick per M15's authored list. First checkouts: a talent that is already at its max (100) on a build the character actually runs. "Prioritize efficiencies and pushing/skilling talents; you can't book main stats; only the MAX level upgrade matters" (tier 4, 2026-09-18). [C43][C44][C45]
- **W3 mid/late:** spend checkouts as they appear (do not go above ~5 stored: with 5 stored the next takes ~7.8 h and with 6 stored ~8.9 h at M=1); then lift min via Gem Shop 113 (x4), Double Agent bribe, merit row (Tasks[2][2][2] to 5), Spontaneity salt to 10, and speed via Library levels, Biblio stamp, Chonker Chug, Booker atom. Target the pusher's damage talents first (ActiveOn's D-5 order), then skilling efficiencies. [C28][C29][C31][C32][C45]
- **W4:** Fortune Cookie meal and Cooking; Booker atom; Book Reservation System (Automation Arm lvl 5) with 20 stored for a guaranteed max; **Disputed** (tier 4 gist 2026-09-18): the gist lists Arena milestones "R80 / R125 (Library VIP)" with R200 as the final breeding-progression goal; an earlier draft presented R80 alone. Both thresholds are community-sourced, confidence L (not in game data or Toolbox). VIP bookshelf talents unlock by VIP Library %. [C10][C22][C37][C40][C46]
- **Priority order that exists in sources:** none ranked beyond the gist's "efficiencies and pushing/skilling talents first" and the M15 rule "pusher first, then Role order" (project decision D-5, not a community source). [C45][C47]

## Gaps against ActiveOn today

- Done: checkout and read-book Checks (`library.check.checkout`, `library.check.read-book`, `packages/knowledge/systems/library.yaml`), state `account.library` (`depth.ts` `readLibrary`), engine `library.ts`, sprite `sys-library` in `apps/activeon/src/art/sprites/grids/systems.ts`. [C48]
- Not tracked: the min/max range upgrade ladder as Goals (Gem Shop 113, Double Agent bribe, merit row, Salt Lick Spontaneity, Booker atom); checkout speed contributors; VIP bookshelf; per-character book coverage / how many eligible talents sit below the max; the range is read but shown only as a number. No new sprites are needed (one `sys-library` sprite exists); a "book" item glyph would be a nice-to-have for per-book rows. [C48]
