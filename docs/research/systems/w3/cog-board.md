# Dossier: Cog Board (M26, topic `cog-board`)

Verified 2026-10-19 against IdleOn Toolbox @6c37e3d (`TB:` = `packages/toolbox-parsers/vendor/`), game 2.3.540. Tiers per ADR 0004: 1 game data/Toolbox code, 2 Toolbox logic, 3 wiki, 4 community. Cited wiki page: idleon.wiki/wiki/Construction (bot-generated tables, fetched 2026-10-19, page revision 2026-10-07 per prior research). Test accounts only; no real names. Revised 2026-10-19 after two adversarial verdict sets (source lens, game-data lens): no claim was refuted by either lens, so none removed or marked Disputed; three claims got corrections (C29, C33, C36); unverifiable claims are confidence L. Confidence tags (H/M/L) follow each claim id as `[Cn/H]`.

## Cog Board

- **What it is:** [C1/H] A 12x8 (96 square) board in the W3 Construction screen. Characters ("player cogs") and crafted cogs placed on it add Build Rate, Flaggy Rate and Construction EXP; boost cogs multiply neighbours by shape. A second tab, the Cog Shelf, turns shelved characters into new cogs.
- **Unlocks:** [C24/M] with Construction (W3). Cog tier gates by highest Construction level on the account: Nooby 1, Decent 15, Superb 40, Ultimate 70 (wiki). Wiki confirms tier levels 1/15/40/70 (tier 3, M); the Reddit report of Superb locked at Lv 67 is unverifiable (tier 4, L). Squares beyond the start region open by Flaggy progress [C13/H]; the two 12-slot Tiny Cog side columns need Research grid J8 (W7) [C33/L]. Correction: wiki's daily J8 Tiny cog covers tiers T1-T10 only; T11 is unconfirmed (wiki, tier 3, M); the code multiplier table does include T11 (H).
- **Scope:** Account-wide board, cogs, flags; per-character placement (board / shelf / rack / inventory), Construction level, build speed, EXP/h [C2/H][C18/H][C19/H].
- **Inputs -> outputs:** Inputs: character Construction level and build-speed multipliers, cogs, flaggy rate. Outputs: Total Build Rate (fills building build bars), Total Flaggy Rate (opens squares), Construction EXP for characters on board/shelf, Sailing Artifact input (W5, uses de-multiplied `playersBuildRate`, see W5+ extensions) [C36/H].
- **Goals and Milestones:**

| Goal | Value | Cite |
|---|---|---|
| Cog tiers | Con Lv 1 / 15 / 40 / 70 | [C24/M] |
| Refurbished Cog | Con Lv 75 (Damaged Cog from Town Shop, hold to convert) | [C32/H] |
| Fluorescent Flaggies | 6 buys, +50% flaggy each (4x total) | [C10/H][C12/H] |
| Zen cogs | 8 buys, 1 Yin + 1 Yang each | [C12/H] |
| Excogia | 4 Yin in a 2x2 square | [C22/M] |
| Equinox challenge: 48 Ulti Double Cogs on board | +4 max Lv Liquidvestment | [C31/H] |
| Equinox challenge: 48 Jewel Cogs on board | +65% Equinox bar fill | [C31/H] |
| Equinox challenge: Tier 6 Tiny Cog | +185% Equinox bar fill | [C31/H] |

- **Feeds / fed by:** Feeds every building build bar (Construction, 3D Printer, Salt Lick, Death Note, towers, shrines), Construction skill level (feeds Skill Mastery), Sailing artifact [C36/M], Equinox bar [C31/H]. Fed by Carpenter bubble, stamps, guild, vials, arcade, Bubba, Redox Rates (Squire) etc. into character build speed [C18/H]; Gem shop [C12/H]; Menagerie (W7) [C20/H]; Chizoar card, Cogs For Hands/Sippy Cup bubbles (prior research, unverified here).
- **Per-session actions:** collect shelf cogs promptly (each uncollected cog raises the next cog's cost) [C28/M]; slot new/better cogs; move finished flags off done squares; seat every new character on board or shelf; claim Jewel/Tiny cogs daily if unlocked [C29/M][C33/L]. Idle state: no placed flag on a completed square, shelf empty, no free open square, no character in the rack/inventory.
- **AFK Setup implications:** Board/shelf placement is independent of the character's AFK activity; seat every character before an AFK Stretch (prior research, wiki).
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:** characters in rack/inventory (earn nothing there); finished flag left placed; shelf not collected; boost cogs aimed at empty squares or at other boosters; Yin pieces broken up (loose pieces lose their boost [C22/M]); small cogs in main-board squares (they only fit side columns [C17/H]); full cog inventory.
- **Save and Toolbox fields:** see catalogue; main: `idleonData.CogMap/CogOrder/FlagUnlock/FlagsPlaced` -> `account.construction.*` [C3/H].
- **Sources:** inline per claim; claims list at the end.

## Mechanics catalogue

### M1 Board geometry and storage
- Rule: [C1/H] 12 columns x 8 rows, `BOARD_SIZE`=96. [C2/H] `CogOrder` index map: 0-95 board (row-major from the top-left; game y is flipped, `(7-y)*12+x`), 96-107 character rack, 108-227 cog inventory, 228-239 left Tiny column, 240-251 right Tiny column.
- Field: `account.construction.baseBoard[0..95]`, `.board[]` (decorated), `.spareCogs`, `.leftColumn`, `.rightColumn`; raw `CogO`/`CogM`/`FlagU`/`FlagP` [C3/H].
- Note: in `FlagUnlock`, value -11 means complete [C13/H].

### M2 Cog stat keys
- [C4/H] `cogKeyMap`: a Build Rate/hr, b Construct Exp/hr (player cogs), c Flaggy Rate/hr, d %Bonus Construct EXP, e %Build Rate (boost), f %Player Construct XP (boost), g %Flaggy Rate (boost), h shape (string), i unused, j %Speed to Flags (boost), k "%Nothing" dud.
- Field: `account.construction.board[i].cog.stats.{a..k}`.

### M3 Boost shapes (area of effect)
- [C5/H] Offsets from the booster at (x,y), clipped to the board: adjacent = 4 orthogonal; diagonal = 4 diagonal; up = 3x2 block directly above (rows +1,+2, cols x-1..x+1); down, left, right mirror; row = rest of row (11); column = rest of column (7); corners = (+-2,+-2); around = the 12 squares with |dx|+|dy|<=2 excluding the centre; everything = all other 95 squares. Wiki names: Adjay, Diggle, Uppy, Downer, Leff, Rite, Rowow, Collumm, Omni(Corner) [C26/M]. `around`/`everything` are in the parser; which cogs carry them (Yang Mongo/Excogia) is inferred, see open questions.
- Field: `cog.stats.h`, `board[i].affects/affectedBy`.

### M4 Boost maths
- [C6/H] For each square: `buildRate = a * (1 + sum(e of every booster reaching it)/100)`; same for flaggy (`c` with `g`); boosts from multiple boosters add, then multiply the target's base. Negative results clamp to 0.
- [C8/H] Board `totalExpRate` = plain sum of every `d` (not shape-boosted); `totalFlaggyRate` and `totalBuildRate` sum the boosted values.
- Field: `account.construction.totalBuildRate/totalExpRate/totalFlaggyRate`.

### M5 Player cogs (characters on the board)
- [C18/H] Character build speed `PlayerBuildSpd = 3*(ConLv/2+0.7)^1.6 * (1+ConLv*Carpenter/100) * (1 + (stamps + 0.25*PostOffice(Construction_Container) + guild + gear/obols + min(5,5*achv153) + ConstructMastery + vial + arcade + vote + upgradeVault48*portalKillsLog + bubba)/100) * winner * palette25 * turtle vial * (1 + REDOX_RATES*(Helium atom + lavaLog(Redox salt))/100)`. Field `characters[].constructionSpeed`.
- [C19/H] EXP/h `= (buildSpd^0.7/2 + 2 + 6*ConLv) * ConExpMulti`; ConExpMulti = (1 + (CallMeBob + Sharper Saws + Tempestuous + vial + statue18 + stamp + vote + starsign + 0.5*(PostOffice-100))/100) * smallCogXP * (1+YellowJelly/100) (+25 Sawsaw flat if logged out). Field `characters[].constructionExpPerHour`.
- [C7/H] The player cog's board EXP = `constructionExpPerHour * (1 + sum f of boosters/100) * (1 + totalExpRate/100)`, floored when under 1e6. Field `board[i].cog.stats.b`, total `totalPlayerExpRate`.
- [C20/H] `playersBuildRate` = sum of Player_ cogs' `a` (already includes ExtraBuildSPDmulti = small-cog build x companion157 x Menagerie x Outpost Rog bonus).

### M6 Cog Shelf (cog crafting)
- [C28/M] Characters placed on the Shelf produce cogs from Construction EXP; each cog sitting uncollected makes the next cost more (wiki: "doubles/triples"). Prior research states doubling; exact curve is not in Toolbox.
- [C24/M] Stats roll off the account's highest Construction level; number of stat rolls by tier: Nooby 1, Decent 2, Superb 3, Ultimate 4 (wiki).
- Fields: none in Toolbox for shelf progress (open question). Inventory: `account.construction.spareCogs` [C2/H].

### M7 Cog tiers, grades, naming
- [C21/H] Raw id decode (TB `getCogDisplayName`): tier char 0 Nooby, 1 Decent, 2 Superb, 3 Ulti, Z Yin (Zen), Y Yang, S Tiny, C Crystal (Topaz, Ruby, Amethyst, Garnet, Emerald, Bluegem); chars 5-6 = shape (boost cogs) or grade (plain: Cog, Average, Spur, Stacked, Deckered, Double, Trips, Trabble, Quad, Penta; default "Mongo").
- [C25/M][C27/M] Boost-cog chance by tier: Nooby 10%, Decent 25%, Superb 10%, Ultimate 10% (wiki). Shape odds [C26/M]: Nooby adjacent/diagonal 50/50; Decent 40/40 + up/down/left/right 5 each; Superb 30/30 + udlr 8 each + row 4 + column 4; Ultimate udlr 15 each + row 16 + column 19.2 + omni 4.8. Boost kind odds [C27/M]: %Build Nooby 100/Decent 70/Superb 65/Ult 50; %Flaggy Decent 30/Superb 14/Ult 15; %Player XP Superb 10.5/Ult 10.5; %Speed to Flags Ult 24.5; %Nothing Superb 10.5. Strength ranges 5-65% (wiki, bot tables; verify per-tier ranges against N.js).

### M8 Flags and square unlock
- [C13/H] A board square index i needs `25 * flagsReqs[i]` flaggy progress. Min 25 (16 squares carry the lowest value), max 250,000,000 at the corners. Progress is stored per index in `FlagUnlock` (-11 = done); `FlagsPlaced` lists indices a flag currently sits on (the game permits limited flags; count not found in code, open question).
- [C9/H] A placed flag grows by `totalFlaggyRate * (1 + sum j of boosters/100)` per hour (`flagSpeed = flagSpeedBoost * totalFlaggyRate`); flagSpeedBoost is 0 for squares with no flag.
- [C10/H] `totalFlaggyRate` x (1 + 50*N/100) with N = gem shop index 118 purchases (Fluorescent Flaggies, max 6).
- Fields: `account.construction.board[i].{currentAmount,requiredAmount,flagPlaced,flagSpeed}`.

### M9 Tiny Cog side columns (W7 extension, in-scope to track)
- [C14/H] Extra flag requirement: `5e6*(1+min(9,9*s)+max(0,10*(s-1)))*4^s`, s = flagIdx-96 (96..119): left column 96..107 runs 5e6 to 2.3e15; right column 108..119 runs 1.0e16 to 8.1e22. Wiki says up to 1.23T; code and prior research say 8E22, code wins (tier 1) [C14/H].
- [C16/H] Tiny cog level L (0-based; display "T{L+1}"): base = (25+25L^2)(1+L/5); flaggy +round(2*base)%, build +round(4*base)%, XP +round(base)%. Multiplier = 1 + bonus/100. Checks: T1 1.5x/2x/1.25x, T11 flaggy 152.5x, build 304x, XP 76.75x, matching the wiki table [C33/L].
- [C17/H] Totals: sum of bonuses across the 24 side slots by type -> xp multiplies `totalExpRate` and ConExpMulti; build multiplies ExtraBuildSPDmulti; flaggy small cogs are listed but their effect on totals is deliberately not applied in Toolbox (baked into player cogs, TB comment). Small cogs only fit side columns; an unlocked square needs `!flagPlaced`.
- Fields: `leftColumn`, `rightColumn`, `smallCogs.{upgrades,spares,freeSlots}`, `boardMultipliers`.

### M10 Zen cogs, Yin/Yang, Excogia
- [C12/H] Gem shop "ZEN_COGS" (idx 115): 500 gems, +125 per buy, max 8; each buy = 1 Yin + 1 Yang. Yin: best base stats, no boost area; Yang: best surround effects (Yang Mongo, high build% and Player XP%).
- [C22/M] Excogia: four Yin pieces CogZA00..03 placed in a 2x2 (A00 top-left, A01 right of it, A02 below A00, A03 below A01) activate a board effect; loose pieces have boost stats (h,e,f) stripped by the game. Wiki: +5% build, +20% Player Construct XP (as printed; treat as M confidence).
- Field: names in `CogO`; `getAssembledExcogiaSlots`.

### M11 Cog inventory and building slots (gem shop)
- [C12/H] Cog inventory space idx 116: 100 gems +40/buy, max 20, +4 slots each (80). Tower building slots idx 117: 350 +100, max 4. Also bribe "Taxidermied Cog Pouches" +4 inventory slots (shared-data; the bribe value is unverifiable in code, L) [C12/H].

### M12 Jewel cogs (W5 extension)
- [C23/H][C29/M] Crystal ids CogCry0..5 = Topaz, Ruby, Amethyst, Garnet, Emerald, Bluegem. Unlock: Spelunking 2nd lore boss (lore-boss gate unverified in code, L) -> Gaming Duperbits "Jewel_Cogs" (source array `superbitsUpgrades[33]`, page 2, shown as Duperbits in game; correction from game-data lens) (daily claim when collecting Ultimate cogs with 5+ left; extra claims from "Cog_Lover"). Stats: build or XP only, boost row/column/none; boost % ranges Ruby 53-63, Amethyst 76-86, Garnet 99-109, Emerald 122-132, Bluegem 145-155; Topaz none [C30/M].

### M13 Refurbished Cog
- [C32/H] Damaged Cog (Town Shop) holds to become a Refurbished Cog at Construction Lv 75. Stats of the result are not in Toolbox (open question).

### M14 Construction-related account multipliers on the board
- [C35/H] Trimmed (gilded) build slots: up to 8 slots, each gets x(3 + Nitrogen atom/100) x legend talent; sources Minehead 18, Sapphire Rhinestone, atom, Legend talent 33, Gambit 9, Event shop 14. Field: `getTotalGildedSlots`, `getTrimmedBuildSpeed`.
- [C34/H] Construct Mastery (Rift 40): total building levels thresholds 250/500/750/1000/1250/1500/2500: build speed +5%*floor((total-1250)/10) feeds M5.

### W5+ extensions (one line each)
- W5: Jewel cogs (M12); Sailing artifact uses `lavaLog(playersBuildRate / extraBuildSpeedMulti * lanternShare) * baseBonus`, NOT the raw baked rate [C36/H, correction from both lenses; TB:parsers/world-5 sailing artifact code]. W6: none found. W7: Tiny cogs (Research J8), Menagerie Yellow Jelly (ConExp) and build bonus, Outpost Rog factor [C20/H], Legend talent 33, Equinox challenges listed in the table [C31/H].

## Additional mechanics (added after verification, 2026-10-19)

### M15 Excogia assembly rules (code detail)
- Rule: pieces `CogZA00..03` must sit in an unclaimed 2x2 anchored at piece 0; offsets are +0, +1, +12, +13. The anchor cannot be in the last column or last row; a block whose squares are already claimed by an earlier block is skipped. Anything else with an Excogia name is "loose" and has `h/e/f` stripped. A square is only ever moved whole by the optimizer. Source: `TB:parsers/world-3/constructionOptimizer.ts` lines 43-78 (`excogiaPieceIndex`, `isExcogiaAnchor`, `findExcogiaBlocks`, `stripExcogiaBoost`, `getAssembledExcogiaSlots`), tier 1, verified 2026-10-19. Confidence H.

### M16 Construct Mastery, all tiers (rift 40)
- Rule: `getConstructionMasteryBonus(index)` from total building levels `T` (thresholds 250/500/750/1000/1250/1500/2500), requires rift >= 40: 0 refinery speed `floor(T/10)` (no level gate); 1 damage `2*floor((T-750)/10)`; 2 build speed `5*floor((T-1250)/10)` (feeds M5); 3 trapper drone max level +35 at T>=500; 4 talent library max level +100 at T>=1000; 5 shrine level +100 at T>=1500; 6 wizard tower level +30 at T>=2500. Source: `TB:parsers/world-3/construction.ts` lines 444-487, tier 1. Confidence H. Note refinery speed and damage never clamp below 0 via the max(0,..) only for tiers 1-2.
- Wizard tower over-levels: `applyMaxLevelToTowers` adds `getExtraMaxLevels` (Carbon Wizard Maximizer atom, mastery tier 6) to tower max level (same file, line 446-454, tier 1, H). Which towers (9-17) benefit above level 50 is from the source lens only (M).

### M17 Character-speed extras not in M5
- `ExtraBuildSPDmulti` = (1 + small-cog build bonus/100) x (1 + companion 157/100) x (1 + Menagerie ConstBuildBONUS[0]/100) x max(1, Outpost Rog bonus 0); `ExtraConEXPmulti` = small-cog XP multi x (1 + Menagerie ConstBuildBONUS[1]/100). Source: `TB:parsers/world-3/construction.ts` lines 124-131, tier 1, H. Per-character speed also has Winner bonus 13 / Winz Lantern, a palette bonus, turtle vial, Helium atom and Redox salt terms (gamedata + source lens, M; see `characters[].constructionSpeed` breakdown); gear/obol term uses the logged-in character (gamedata lens, M). EXP term also includes Warriors Rule and a flat Sawsaw Salala (gamedata lens, M). Player cog EXP applies `expMulti` before the small-cog multiplier (gamedata nuance, M).

### M18 Character cogs and the optimizer
- Rule: characters (`Player_<name>`) occupy board squares and rack slots 96-107; they score well on the board so the optimizer takes `maxCharacters` (cap on characters seated) and `maxSwaps`; spare cog pool = board slots first, then spare cogs (`normalizeCogs`). `optimizeSwapCurve` runs budgets `DEFAULT_SWAP_BUDGETS = [1,4,10,20]` plus unlimited; `bestValuePlan` picks the best-value step; `getBoardAtStep` replays the move list (displaced cogs swap into freed squares). Source: `TB:parsers/world-3/constructionOptimizer.ts` lines 221-254, 365-385, 831-933, tier 1, H. Trade-off: seating more characters raises build rate but the rack (12 slots) and cog production on the shelf compete; no dashboard-side guidance was verified (L).

### M19 Flag placement indices and side columns
- Rule: only a placed flag gets `j` boost; flag indices 0-95 are the main board, 96-107 the left extra column and 108-119 the right extra column (flag cost M9), while cog indices for those columns are 228-239 and 240-251. `getSmallCogUpgrades(cogsOrder, sideSlots)` returns `{upgrades, spares, freeSlots}` suggestions. Source: `TB:parsers/world-3/construction.ts` lines 154, 288, tier 1, H (gamedata lens, M for the index mapping text).

### M20 Gem shop classification and tower slots
- Yang (`CogY`) vs Yin (`CogZ`/`CogZA0x`) classification used by Zen cog items (gamedata lens, M). Tower building slots: gem shop idx 117, 350 gems +100 per buy, max 4 (already in M11 [C12/H]); the first N slots are trimmed/gilded, N = `getTotalGildedSlots` capped at 8, sources Minehead 18, Sapphire Rhinestone (ceil(jewel/5)), Nitrogen Construction Trimmer atom, Legend talent 33, Gambit 9, Event shop 14 (`TB:parsers/world-3/construction.ts` lines 525-541, tier 1, H).

### M21 Names, export and inventory paging
- Shape cog names: Adjay (adjacent), Diggle (diagonal), Leff, Rite, Uppy, Downer, Sniper (corners), Collumm, Rowow, Omni (wiki + gamedata lens, M). Damaged Cog -> Refurbished Cog is the Quest57 item chain (gamedata lens, M, [C32/H] for the text). Cogstruction CSV export classes (Plus/X/Up/Down/Left/Right/Row/Col/Omni, empties) and the flagged cog inventory paging (15 per page, 3 wide, `cogSlotLabel`) are reported by the verifiers from Toolbox UI code, not re-checked here (L).

## Min-max by stage

Priority orders with community sources are thin; the ones that exist are all tier 4 and dated.

- **W1 (pre-W3):** Not available; Construction is W3. Nothing to do.
- **W2:** Not available.
- **W3 early (Con Lv < 15):** [C37/L] "focus Build Rate early (XP% later). Unlock the full board (flaggies on cheapest unlocks)" (shnaps gist 2026-09-18, tier 4, M). Put every character on the board or shelf [C37/L]. Prior research: open inner rings first, favour Build Rate cogs, flaggy cogs until ~30 squares open (tier 4, dated 2026-10-17 research, L).
- **W3 mid (Con 15-40):** [C37/L] "all Squires on the board, rest on shelf -> surround each Squire with inward-pointing directional cogs"; cap at 2 Divine Knight builders. Gem-shop priority (derived from C12 data, no community source found): Fluorescent Flaggies before Zen/Cog inventory only if flaggies are the bottleneck. Reddit (2026-04-01 via prior research): "Still xp. Xp will always boost build rate" (tier 4, opinion, L): put Construct-EXP boosts around builders.
- **W3 late (Con 40-70+):** Push Construction level to 70 for Ultimate cogs; the stats scale off the single highest level on any character [C37/L][C24/M]. Keep Yang Mongo cogs by Squires and Yin Excogia outside their zones [C37/L]. Trash weak cogs; use Toolbox optimizer plans (budget 1/4/10/20 swaps) [C40/H].
- **W4:** Trimmed slots from the W4 Lab jewel [C35/H], Construct Mastery as total building levels rise [C34/H]; no cog-specific community order found (open question). Refurbished Cog at Lv 75 [C32/H].
- **W5+ outline:** Jewel cogs (48 on board = Equinox reward [C31/H]), Tiny cog columns (W7), Menagerie.
- **Per class:** Squire/DK builders: max 2 DK [C37/L]; other classes shelf.

## Existing ActiveOn coverage [C39/L]
- Detector `construction.check.cog-seat-free` (shelf vs free square) and `account.cogBoard` (squares, characterAt, three totals). No placement advice, flag management, small cogs, inventory or optimizer integration. `constructionOptimizer.ts` is vendored but unused.
- No cog sprites exist in `apps/activeon/src/art/sprites/grids/` (alchemy, classes, gear, items, places, skills, status, systems, talents only).
- **Sprite needs (new):** 9 boost-shape glyphs (adjacent, diagonal, up/down/left/right, row, column, omni); cog tier badges (Nooby, Decent, Superb, Ultimate); Yin and Yang cogs; Excogia 2x2; jewel cogs x6; Tiny cog; flag; shelf icon; locked/open square tiles.

## Claims

C1-C40 (C11 unused). Confidence: H = C1-C10, C12, C13, C14, C16-C21, C23, C31, C32, C34, C35, C40; M = C22, C24-C30, C33 correction noted, C36 (H after correction); L = C33 (research grid unverified), C37, C38, C39. Disputed: none.

## Open questions
1. How many squares start open (data shows 16 squares at the minimum 25 requirement; prior research says 8)?
2. Max flags placeable at once and how the cap grows.
3. Exact Shelf cost curve (doubling vs tripling) and cog-making EXP formula; not in Toolbox.
4. Per-tier stat-strength ranges and Yin/Yang/Excogia exact stats; wiki tables are bot-generated, needs N.js check.
5. Is Superb really gated at Con Lv 40 (Reddit reports not at 67)?
6. Which cogs carry `around`/`everything` shapes (likely Yang/Excogia).
7. Wiki Tiny column cap (1.23T) vs code (8e22).
8. Stats of Refurbished Cog.
9. Community priority orders for W4 and for gem-shop spending are not found; Reddit/Academy fetch was blocked and web search budget exhausted.
