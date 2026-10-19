# Construction dossier (M26)

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). `V/` = `packages/toolbox-parsers/vendor/`. `TB/` = `V/parsers/`. `SD` = `V/data/website-data/shared-data.json`. Tiers: 1 game data/Toolbox code, 2 Toolbox logic, 3 wiki, 4 community. Prior research (`origin/research/w3-systems:docs/research/systems/w3-systems/construction.md`, 2026-10-17, game v1.23 client N.js) is cited as "prior"; its N.js offsets could not be re-read here and are flagged UNVERIFIED-HERE. Note the game client in the prior is v1.23, Toolbox pin is 2.3.540 (same build family; offsets shift each patch).

## Construction

- **What it is:** The W3 Squire-flavoured skill system. Characters and cogs on a 12x8 Cog Board produce Build Rate; Build Rate fills the progress bar of up to 2-8 queued buildings (27 buildings: 9 utilities, 9 wizard towers, 9 shrines); each finished level is then paid in Refinery salts. [C1][C4][C9]
- **Unlocks:** W3 Frostbite Tundra town Construction Table; Hoggindaz quest line (first salt toggle, "Constructing a Tower"). No level gate found in code or wiki. Construct Mastery needs Rift 40 [C28]. Cog tiers need Construction level 1/15/40/70 [C25].
- **Scope:** Both. Account-wide: building levels, progress, board, flags, slots, Total Build Rate. Per character: Construction level, build speed, EXP/h, which only count while the character sits on the board [C14][C15][C17].
- **Inputs -> outputs:** In: character time on the board (free, does not stop AFK), cogs, flags, salts. Out: building levels (bonuses in the Mechanics catalogue), Construction EXP, cogs from the shelf. [C4][C6][C31]
- **Goals and Milestones:**

| Milestone | Value | Source |
|---|---|---|
| 3D Printer | Lv = characters (max 11) | [C2][C31] |
| Build slots | 2 base, 4 with merit, 8 with gems+merit | [C9][C10] |
| Cog tiers | Lv 15 / 40 / 70 | [C25] |
| Construct Mastery (Rift 40) | total levels 500/750/1000/1250/1500/2500 | [C27] |
| Cost Cruncher | Lv 60 = -69% salt | [C6] |
| Chest Space | Lv 25 = +52 slots total | [C31][C34] |
| Total levels | feeds Tome (W4) | [C32] |

- **Feeds / fed by:** Feeds 3D Printer, Salt Lick, Library, Death Note, storage, Trapping, Worship, Shrines, Atom Collider, Automation Arm systems. Fed by Refinery salts, Alchemy (Carpenter bubble, vials), stamps, post office, guild, obols, achievements, arcade, vote, Upgrade Vault, Bubba, Squire talents, Helium atom, W7 menagerie. [C14][C15][C16]
- **Per-session actions:** pay every finished bar; keep all build slots busy; collect shelf cogs; move finished flags; put every character on the board or shelf. Idle = all slots busy and bars paid; capped = bar full but salt short. [C9][C13][C18]
- **AFK Setup implications:** none beyond fuelling the salt the next payment needs (Refinery). Board placement is free. Queue long builds before a long AFK Stretch. [C14][C6]
- **Min-max by stage:** see the section below.
- **Common mistakes:** a built bar left unpaid (salt inactive); empty build slots; trusting wiki material-cost text (**Disputed**, see C8); Printer level below character count; characters off the board; finished flags left placed. Detect via `account.towers.data[].progress/inProgress/nextLevel`. [C7][C8][C13]
- **Save and Toolbox fields:** see catalogue.
- **Sources:** inline.

## Mechanics catalogue

### M1 Buildings (27)
Index/name/max/salt/base (from `SD#towers`; salt-to-max = base x sum(L+1) over max levels; build Lv1 and last from `randomList.json[13]`). [C1][C2][C3][C5]

| # | Building | Max | +extra max | Salt (base) | Salt to max | Build Lv1 | Build last |
|---|---|---|---|---|---|---|---|
| 0 | 3D Printer | 11 | - | Redox 3 | 198 | 2.6 | 4.3K |
| 1 | Talent Book Library | 101 | +100 at 1000 total | Redox 6 | 30,906 | 200 | 3.1B |
| 2 | Death Note | 51 | - | Explosive 10 | 13,260 | 2.25K | 70M |
| 3 | Salt Lick | 11 | - | Explosive 20 | 1,320 | 12K | 12.3M |
| 4 | Chest Space | 25 | - | Explosive 25 | 8,125 | 25K | 7.8M |
| 5 | Cost Cruncher | 60 | - | Spontaneity 20 | 36,600 | 60K | 22.9M |
| 6 | Trapper Drone | 15 | +35 at 500 | Spontaneity 30 | 3,600 | 100K | 1.15B |
| 7 | Automation Arm | 5 | - | Spontaneity 50 | 750 | 150K | 38M |
| 8 | Atom Collider | 200 | - | Nullo 10 | 201,000 | 50M | 1.05e19 |
| 9 | Pulse Mage | 50 | wizard extra | Redox 2 | 2,550 | 5 | 21M |
| 10 | Fireball Lobber | 50 | same | Redox 4 | 5,100 | 100 | 117M |
| 11 | Boulder Roller | 50 | same | Explosive 4 | 5,100 | 700 | 108M |
| 12 | Frozone Malone | 50 | same | Explosive 7 | 8,925 | 5K | 240M |
| 13 | Stormcaller | 50 | same | Spontaneity 5 | 6,375 | 40K | 1.0B |
| 14 | Party Starter | 50 | same | Spontaneity 9 | 11,475 | 125K | 2.3B |
| 15 | Kraken Cosplayer | 50 | same | Dioxide 7 | 8,925 | 400K | 6.8B |
| 16 | Poisonic Elder | 50 | same | Purple 10 | 12,750 | 1M | 11.4B |
| 17 | Voidinator | 50 | same | Nullo 20 | 25,500 | 3.5M | 50.6T |
| 18 | Woodular Shrine | 100 | shrine extra | Redox 2 | 10,100 | 10 | 24M |
| 19 | Isaccian | 100 | same | Redox 5 | 25,250 | 250 | 255M |
| 20 | Crystal | 100 | same | Explosive 4 | 20,200 | 1K | 180M |
| 21 | Pantheon | 100 | same | Explosive 7 | 35,350 | 7.5K | 359M |
| 22 | Clover | 100 | same | Spontaneity 5 | 25,250 | 40K | 1.2B |
| 23 | Summereading | 100 | same | Spontaneity 10 | 50,500 | 200K | 4.3B |
| 24 | Crescent | 100 | same | Dioxide 12 | 60,600 | 2M | 42.9B |
| 25 | Undead | 100 | same | Purple 14 | 70,700 | 7M | 87.7B |
| 26 | Primordial | 100 | same | Nullo 10 | 50,500 | 60M | 304B |

Per-level effects (`SD#towers[].costInc` first value): Printer +1 player slot; Library +5% checkout speed; Death Note +2% Multikill; Salt Lick +1 upgrade; Chest Space +2 storage slots (+2 base); Cost Cruncher -1% (-10% base); Drone +10% critters; Arm +1 automated system; Collider -0.1% atom cost; Pulse Mage +15% dmg; Fireball +20; Boulder +25; Frozone +1.5% range; Stormcaller +30; Party Starter +4% range; Kraken +3% spawn; Poisonic +15; Voidinator +0.7% range; every shrine +10% level-up rate. [C31] Chest Space slots are `2 * towers.data[4].level` added in `TB/storage.ts#L81`. [C34] Wizard-tower second bonus is a Worship upgrade-cost reduction (second `costInc`: 1.4-1.7%). [C31]

### M2 Build phase (progress bar)
`getBuildCost`: Printer `2(L+1)^2 * 1.3^(L+1)`; others `randomList[13][index] * bonusInc^L`. Cost Cruncher does NOT reduce it. Progress lives at `TowerInfo[index+66]`; a bar is full when `progress >= buildCost`. Claiming a full bar resets progress to 0 (prior). [C4][C13][C35]

### M3 Salt payment
Per level: `floor(max(0.2, 1 - crunch) * saltBase * (L+1))`, crunch = 0.10 at Cruncher Lv1, +0.01 per extra level, 0.69 at Lv60 (N.js TowerSaltCost @7814440, UNVERIFIED-HERE). Paid from inventory and storage chest, not Refinery storage (prior; also `account-state/src/depth-types.ts#L63-67`). `nextLevel` flag = `TowerInfo[27+index] == level+1` means built-awaiting-payment. [C6][C13]

### M4 Build slots
Open slots = `2 + gemShop[117] (max 4) + ceil(W3 merit row 0 / 2)`; slots stored `TowerInfo[54..61]`; every slot receives the FULL Total Build Rate. [C9][C10][C11]

### M5 Trimmed (gilded) slots
First N slots build at `(3 + NitrogenAtom/100) * (1 + legendTalent33/100)` x; N = Minehead(18) cap1 + ceil(Sapphire Rhinestone/5) + Nitrogen atom 1 + Legend talent cap1 + Gambit(9) + Event shop(14), cap 8. All W4-W7 sources except Sapphire Rhinestone (W4 lab). [C12]

### M6 Player build speed
`3*(ConLv/2+0.7)^1.6 * (1+ConLv*Carpenter/100) * (1+(stamp + 0.25*PostOffice(Construction_Container) + guild + gear/obol(30, logged-in character) + min(5,5*ach153) + mastery + vial + arcade + vote + vault(48)*portalKills + bubba)/100) * winner*palette*turtle-vial * (1+REDOX_RATES*(Helium atom + lavaLog(Redox salt owned in storage + refinery))/100)`. The Redox Rates talent term scales with the Helium atom and the log of Redox salt held. [C14][C43]

### M7 Player Construction EXP
`(speed^0.7/2 + 2 + 6*ConLv) * multi`; multi adds Call Me Bob, Sharper Saws, Tempestuous Emotions, vial, Seesaw statue (index 18), stamps, vote, star sign, PO(+0.5/lvl past 100), times small-cog EXP and Yellow Jelly. [C15]

### M8 Cog Board
96 squares (12x8); CogOrder 0-95 board, 96-107 character rack, 108-227 inventory, 228-251 two 12-tall tiny-cog columns. Board sum = sum of cog Build Rate x (1+boost/100), EXP, Flaggy. Boost cogs add to neighbours by shape (Adjacent/Plus, Diagonal/X, Up, Down, Left, Right, Row, Column, Omni/Corner). Stat keys a=Build/HR, b=Exp/HR, c=Flaggy/HR, d=%Bonus Exp, e=%Build, f=%Player XP, g=%Flaggy, j=%Speed to Flags. [C17][C21][C22][C23]

### M9 Flags
A square opens when flag progress reaches `25 * flagsReqs[i]` (25 centre to 250M corners); tiny columns `5e6*(1+min(9,9*step)+max(0,10*(step-1)))*4^step`. Progress kept when a flag moves. Flaggy total x `(1+0.5*gem118)` (max 6 = 4x). [C18][C19][C20]

### M10 Tiny (small) cogs
Bonus `(25+25L^2)(1+L/5)` x2 flaggy, x4 build, x1 XP, flat-summed per type over the 24 side slots, applied as multiplier on board totals. W7 Research unlock. [C24]

### M11 Cog Shelf / production
Characters on the shelf make cogs; each held cog raises the next one's EXP need (wiki, prior "doubles"). Stats roll from the highest Construction level on the account; tiers by level. Gem shop: +4 cog inventory per buy (max 20), Zen Excogia 2x2 Yin square. [C25][C26][C36]

### M12 Construct Mastery (Rift 40, W4)
By total building levels T (`TB/world-3/construction.ts#L457-489`): refinery speed +floor(T/10)%; >=500 Drone +35 max; damage +2*floor((T-750)/10); >=1000 Library +100; build speed +5*floor((T-1250)/10); >=1500 shrines +100; >=2500 wizard towers +30. [C27][C28]

### M13 Extra max levels
Wizard (max 50): `round(2*CarbonAtomLv + mastery30 + 100*Gambit9)`; Library 101: mastery 100; shrines 100: mastery 100 + Sushi(58) + Menagerie boost 5, +100 for coral-reef-unlocked shrines (index 18+n); Drone 15: mastery 35. [C29][C30]

### M14 Cost Cruncher, Chest Space, Automation Arm
Cruncher in M3. Chest Space `2*level` slots. Arm: +1 automated system per level in order Forge Conveyor, Nutrient Neural Network, Miniature Soul Apparatus, Anvil Pipeline, Book Reservation System (wiki rev 2025-05-13). [C34][C37]

### M16 Gilded slot sources and Sapphire Rhinestone
N trimmed slots = min(1, Minehead upgrade 18) + ceil(Sapphire Rhinestone jewel bonus / 5) + (Nitrogen Construction Trimmer atom present ? 1 : 0) + min(1, Legend talent 33) + Gambit bonus 9 + Event shop bonus 14, rounded and capped at 8. Multiplier on those slots = (3 + Nitrogen/100) x (1 + Legend33/100). [C12][C44]

### M17 Special cogs and Excogia
Cog names: `CogY` = Yang Cog, `CogZ` = Omni Cog, `CogZA0n` = the four Excogia (Yin) pieces. An Excogia piece that is not part of an assembled 2x2 (piece order 0,1,12,13 offsets) carries no boost and is stripped. [C21][C45]

### M18 Flag indices and extra columns
FlagUnlock/FlagsPlaced index 0-95 = board, 96-107 = left extra column, 108-119 = right extra column (cog slots 228 and 240). A FlagUnlock value of -11 means the flag is complete (current = required). [C17][C18][C46]

### M19 Construction EXP multiplier tree
EXP multiplier = (1 + (Call Me Bob + Sharper Saws + Tempestuous Emotions + vial + statue 18 + stamps + vote 18 + star sign + post office 0.5*(lvl-100))/100) x ExtraConEXPmulti (small cogs x Yellow Jelly, since 2.3.540) + Sawsaw Salala flat 25 (non-logged-in characters only). Non-logged-in characters use a separate branch (no Tempestuous Emotions, no star sign total, raw Sharper Saws). [C15][C47]

### M20 Per-building growth rates and Excogia/Printer specials
Build cost growth `bonusInc` differs per building (e.g. Cost Cruncher 1.106, Library 1.18; Printer uses its own formula). Shrine +100 max level applies only when `unlockedCorals > index-18`. [C4][C29][C48]

### M15 W5+ extensions (one line each)
W5: Gambit trimmed slot and wizard levels; Jewel cogs (Gaming Superbits); coral reef +100 shrine levels. W6: Sapphire/lab jewels W4. W7: Tiny cogs, Legend talent 33, Sushi, Menagerie (Yellow Jelly EXP, build bonus), Minehead trimmed slot, Event shop. [C12][C29][C16]

## Min-max by stage

Priority orders do not have a single community consensus; the Knowledge Base `construction.fact.build-order` (W3-early) is Printer(chars), Death Note 1, Salt Lick 1, Library 2, Pulse Mage 1, Fireball 1. [C38]

- **W3 early (first salts, 2 slots):** build the 3D Printer first and max it to character count [C38][C39][C41]. Unlock initial flags, put characters on the board, turn on the first salt. [C39]
- **W3 early/mid, wiki order:** Cost Cruncher, Chest Space, then shrines, then utilities (Library, Death Note, Salt Lick). [C39]
- **Community gist order (CONFLICTS with wiki):** Printer, Salt Lick, Refinery, Library, Death Note, Trapper Drone, then towers/shrines. Confidence M for the first four; the wiki Cruncher-first rule is L (the Cruncher costs Spontaneity, salt 3, not available at W3 start) [C3][C40].
- **Cogs early:** Build Rate first, shift to XP% later (gist). Cluster boosters around one builder and never move them. [C40]
- **Cogs mid:** Construct-XP boosts around builders compound (r/idleon 2026-04-01, per prior, not re-read, opinion). Cap builders at 2 Squires/Divine Knights; others on shelf. [C40][C42]
- **W3 late:** Construction level to 70 for Ultimate cogs [C25]; Kraken/Poisonic/Voidinator need Dioxide/Purple/Nullo salts [C3]; Collider Lv1 and Primordial need Nullo [C3].
- **W4:** Rift 40 Construct Mastery, total levels to 500 / 1000 / 1250 [C27]; Sapphire Rhinestone trimmed slots [C12]; Carbon atom wizard levels past 50 [C29]; Gambit/Nitrogen later. [C12]
- **Gem shop:** Tower Building Slots (max 4) then Fluorescent Flaggies (max 6): each slot builds at full rate so slots are the cheapest rate multiplier (wiki; game text). [C9][C20]
- **Cost note:** buy Cost Cruncher before the big salt sinks (prior opinion, UNVERIFIED community support). [C6]

## Open questions
- Trimmed slot cap: Toolbox 8 vs wiki 6 (conflict, confidence M for 8). [C12]
- Per-character Construction EXP gating of cog stat tiers (missed mechanic): not yet traced to code; confidence L. [C25][C26]
- Superb cog unlock at Lv 67 reported locked on Reddit (2026-05-28). [C25]
- Gem shop slot cost: data 350 + increment 100 vs prior "350 each". [C9]
- Cost Cruncher total to max: our formula 36,600 vs wiki 18,900. [C6]
- Crescent Shrine +7.5% (v2.36 nerf per prior) not reflected in tower data (10). [C31]
- Does build progress past a full bar bank or get lost? (KB notes unsettled, L.) [C35]
- **Disputed** (C8): our earlier note said the wiki still lists materials for the Build phase; the source lens found the wiki says the Build phase is free of materials and only the upgrade-phase text may be stale. Code and v1.05 changelog agree materials are gone (H). [C7][C8]


## Claims

Verified 2026-10-19. Format: [Cn] claim. Source (tier).

- [C1] 27 buildings: indices 0-8 utilities, 9-17 wizard towers, 18-26 shrines; each has one salt in itemReq. Source: vendor/data/website-data/shared-data.json#towers (tier 1, verified 2026-10-19) Confidence: H
- [C2] Max levels: Printer 11, Library 101, Death Note 51, Salt Lick 11, Chest Space 25, Cost Cruncher 60, Drone 15, Arm 5, Collider 200, wizard towers 50, shrines 100. Source: vendor/data/website-data/shared-data.json#towers[].maxLevel (read 2026-10-19; game 2.3.540) (tier 1, verified 2026-10-19) Confidence: H
- [C3] Salt per building: Redox (Printer, Library, Pulse Mage, Fireball, Woodular, Isaccian), Explosive (Death Note, Salt Lick, Chest Space, Boulder, Frozone, Crystal, Pantheon), Spontaneity (Cruncher, Drone, Arm, Stormcaller, Party Starter, Clover, Summereading), Dioxide (Kraken, Crescent), Purple (Poisonic, Undead), Nullo (Collider, Voidinator, Primordial); base amounts per table. Source: vendor/data/website-data/shared-data.json#towers[].itemReq (tier 1, verified 2026-10-19) Confidence: H
- [C4] Build-phase requirement: Printer 2*(L+1)^2*1.3^(L+1); others randomList[13][index]*bonusInc^L; Cost Cruncher does not reduce it. Source: vendor/parsers/world-3/construction.ts#L433-L441 and vendor/data/website-data/randomList.json[13] (tier 1, verified 2026-10-19) Confidence: H
- [C5] Build bases (randomList[13]): 3,200,2250,12000,25000,60000,1e5,1.5e5,5e7,5,100,700,5000,40000,125000,4e5,1e6,3.5e6,10,250,1000,7500,40000,2e5,2e6,7e6,6e7. Source: vendor/data/website-data/randomList.json[13] (tier 1, verified 2026-10-19) Confidence: H
- [C6] Salt payment per level = floor(max(0.2,1-crunch)*saltBase*(L+1)); crunch 10% at Cruncher Lv1 +1% per level, 69% at Lv60; wiki says Cruncher total to max 18,900 vs formula 36,600 (disagree, confidence M for formula). Source: N.js TowerSaltCost @7814440 via prior research/w3-systems construction.md (2026-10-17) (UNVERIFIED-HERE); https://idleon.wiki/wiki/Cost_Cruncher (fetched 2026-10-19) (tier 1, verified 2026-10-19) Confidence: M
- [C7] Building material costs removed in v1.05 (2026-02-20); every building now costs salts only. Source: https://idleon.wiki/wiki/Changelog/2026 v1.05 via prior (not re-read 2026-10-19); SD#towers has only salt itemReq (tier 3, verified 2026-10-19) Confidence: H
- [C8] **Disputed.** Original claim: the wiki Construction page still describes materials for the Build phase and salts for the upgrade phase (stale vs v1.05). Source lens: the wiki says the Build phase needs no materials; materials appear only in the UPGRADE-phase text, which may be the stale part. Gamedata lens: not checked. Correction: do not call the wiki stale on Build; treat the upgrade-phase materials text as the possibly stale part. Source: https://idleon.wiki/wiki/Construction (fetched 2026-10-19) (tier 3, verified 2026-10-19) Confidence: L
- [C9] Open build slots = 2 + gem shop TOWER_BUILDING_SLOTS (globalIndex 117, max 4 purchases, cost 350 + 100 increment) + ceil(W3 merit row 0 / 2), max 8; slot contents at TowerInfo[54..61]. Source: packages/account-state/src/depth.ts#L148-L153; vendor/data/website-data/gemShop.json#L644-L653; N.js TowerBuildSlots @7815643 via prior (tier 1, verified 2026-10-19) Confidence: H
- [C10] **Disputed.** Text is right (4 levels, 3 merits each, 1st/3rd give +1 build slot, 2nd/4th +1 food slot) but the data pointer was wrong: gamedata lens says the W3 merit row is `shared-data.json#merits[2]` (parser reads `tasks[2][2][0]`), not merits[0], which is an inventory-bag merit. Correction: use merits[2]; the same correction applies to the 'merit row 0' wording in C9 and M4 (the row is the first W3 merit). Source: vendor/data/website-data/shared-data.json#merits[2] (tier 1, verified 2026-10-19) Confidence: H
- [C11] Each build slot receives the FULL Total Build Rate. Source: https://idleon.wiki/wiki/Construction (fetched 2026-10-19); gem shop text vendor/data/website-data/gemShop.json#L648 (tier 3, verified 2026-10-19) Confidence: H
- [C12] Trimmed (gilded) slots: first N slots build at (3 + Nitrogen atom/100)*(1+legend talent 33/100); N = Minehead(18) cap1 + ceil(Sapphire Rhinestone/5) + Nitrogen atom + legend talent cap1 + Gambit(9) + Event shop(14), capped at 8 in Toolbox; wiki says up to six (conflict, M). Source: vendor/parsers/world-3/construction.ts#L507-L552; https://idleon.wiki/wiki/Construction (fetched 2026-10-19) (tier 1, verified 2026-10-19) Confidence: M
- [C13] Save layout of TowerInfo: level at [index]; claimed-awaiting-payment at [index+27]; build slots [54..61]; progress at [index+66]; towers.totalLevels sums levels. Source: vendor/parsers/world-3/construction.ts#L398-L431 (tier 1, verified 2026-10-19) Confidence: H
- [C14] Player build speed = 3*(ConLv/2+0.7)^1.6 * (1+ConLv*Carpenter/100) * (1+sum of stamp, 0.25*Post Office, guild, gear/obol effect 30, achievement 153 (cap 5), Construct Mastery, vial, arcade, vote, upgrade vault, Bubba)/100 * winner/palette/turtle * Redox Rates talent with Helium atom; gear/obol uses the logged-in character. Source: vendor/parsers/character.ts#L3658-L3690 (tier 1, verified 2026-10-19) Gamedata lens: original summary omitted the 0.25*Construction_Container post-office term, the min(5,5*ach153) cap, the vault(48)*portal-kills term and the Redox Rates talent factor (scaled by Helium atom and log of Redox salt held); all now included in M6. Confidence: H
- [C15] Player Construction EXP/h = (speed^0.7/2 + 2 + 6*ConLv) * multiplier (Call Me Bob, Sharper Saws, Tempestuous Emotions, vial, Seesaw statue 18, stamps, vote, star sign, post office, small-cog EXP, Yellow Jelly, Sawsaw Salala). Source: vendor/parsers/character.ts#L3694-L3762 (tier 1, verified 2026-10-19) Confidence: H
- [C16] ExtraBuildSPDmulti = small-cog build total * companion 157 * menagerie build bonus * outpost rogue bonus; already baked into each Player_ cog's build rate (not reapplied). Source: vendor/parsers/world-3/construction.ts#L124-L139 (tier 1, verified 2026-10-19) Confidence: H
- [C17] Cog Board is 12x8=96 squares; CogOrder 0-95 board, 96-107 character rack, 108-227 inventory, 228-251 tiny-cog columns (12 each). Source: vendor/parsers/world-3/construction.ts#L85-L90; vendor/parsers/world-3/constructionOptimizer.ts#L7-L9 (tier 1, verified 2026-10-19) Confidence: H
- [C18] Flag requirement: board squares 25*flagsReqs[i]; extra columns 5e6*(1+min(9,9*step)+max(0,10*(step-1)))*4^step. Source: vendor/parsers/world-3/construction.ts#L359-L364; SD#gameTables.constructionFlagReq (tier 1, verified 2026-10-19) Confidence: H
- [C19] flagsReqs ranges 1 (centre) to 1e7 (corners), x25 = 25 to 250M. Source: vendor/data/website-data/shared-data.json#flagsReqs (tier 1, verified 2026-10-19) Confidence: H
- [C20] Fluorescent Flaggies gem (index 118, max 6) multiplies Total Flaggy Rate by 1+0.5*purchases. Source: vendor/parsers/world-3/construction.ts#L113-L114; vendor/data/website-data/gemShop.json#L655-L663 (tier 1, verified 2026-10-19) Confidence: H
- [C21] Cog stat keys: a Build/HR, b Exp/HR, c Flaggy/HR, d %Bonus Construct EXP, e %Build, f %Player XP, g %Flaggy, j %Speed to Flags; boost shapes Plus, X, Up, Down, Left, Right, Row, Column, Omni. Source: vendor/data/website-data/shared-data.json#cogKeyMap; vendor/parsers/world-3/cogstrution.ts#L38-L59 (tier 1, verified 2026-10-19) Confidence: H
- [C22] Board scoring: boost cogs add their % to target squares by shape; square build = buildRate*(1+boost/100); player XP boost needs the board EXP multiplier. Source: vendor/parsers/world-3/constructionOptimizer.ts#L165-L205 (tier 1, verified 2026-10-19) Confidence: M
- [C23] Totals: totalBuildRate, totalExpRate, totalFlaggyRate, totalPlayerExpRate come from evaluateBoard; account.construction.playersBuildRate sums Player_ cog build. Source: vendor/parsers/world-3/construction.ts#L115-L160 (tier 1, verified 2026-10-19) Confidence: M
- [C24] Tiny cog bonus = round(mult*(25+25L^2)*(1+L/5)), mult 2 flaggy, 4 build, 1 XP; summed over 24 side slots into a multiplier. Source: vendor/parsers/world-3/construction.ts#L183-L189,#L346-L355 (tier 1, verified 2026-10-19) Confidence: H
- [C25] Cog tiers by Construction level: Nooby 1, Decent 15, Superb 40, Ultimate 70; one Reddit user reported Superb locked at Lv 67 (2026-05-28), unresolved. Source: https://idleon.wiki/wiki/Construction (fetched 2026-10-19); https://www.reddit.com/r/idleon/comments/1tpzotw/how_to_unlock_superb_cogs/ via prior (tier 3, verified 2026-10-19) Confidence: M
- [C26] Cog stats roll from the highest Construction level on any character; Build Rate early, then shift to XP%. Source: https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa (rev 2026-09-18, fetched 2026-10-19) (tier 4, verified 2026-10-19) Confidence: L
- [C27] Construct Mastery by total building levels T: refinery speed floor(T/10)%; T>=500 Drone +35; damage 2*floor((T-750)/10); T>=1000 Library +100; build speed 5*floor((T-1250)/10); T>=1500 shrines +100; T>=2500 wizards +30. Source: vendor/parsers/world-3/construction.ts#L444-L489 (tier 1, verified 2026-10-19) Confidence: H
- [C28] Construct Mastery returns 0 below Rift 40 (rift.currentRift < 40). Source: vendor/parsers/world-3/construction.ts#L467-L472 (tier 1, verified 2026-10-19) Confidence: H
- [C29] Extra max levels: wizard 50 -> round(2*Carbon atom Lv + mastery 30 + 100*Gambit9); Library 101 -> +100 mastery; shrines 100 -> mastery + Sushi(58) + Menagerie(5), +100 more if coral reef unlocked index>=18; Drone 15 -> +35. Source: vendor/parsers/world-3/construction.ts#L491-L505 (tier 1, verified 2026-10-19) Confidence: H
- [C30] Wizard-tower levels above 50 are counted as wizardOverLevels (feeds Atom Collider damage); totalLevels feeds Tome. Source: vendor/parsers/world-3/construction.ts#L403-L412; vendor/parsers/world-3/atomCollider.ts#L44 (tier 1, verified 2026-10-19) Confidence: H
- [C31] Per-level building bonuses (costInc[0]): Printer +1 slot; Library +5% checkout; Death Note +2% Multikill; Salt Lick +1 upgrade; Chest +2 slots; Cruncher -1%; Drone +10%; Arm +1; Collider -0.1%; Pulse +15%; Fireball +20; Boulder +25; Frozone +1.5; Stormcaller +30; Party +4; Kraken +3; Poisonic +15; Voidinator +0.7; shrines +10 (Crescent data 10, prior says nerfed to 7.5 in v2.36, conflict). Source: vendor/data/website-data/shared-data.json#towers[].costInc; prior (Crescent) (tier 1, verified 2026-10-19) Confidence: M
- [C32] Tower Building Slots/total levels: Tome quantity uses account.towers.totalLevels. Source: vendor/parsers/world-4/tome.ts#L334 (tier 1, verified 2026-10-19) Confidence: H
- [C33] Death Note/Printer/Salt Lick unlocks: Salt Lick unlocked-upgrade count = Salt_Lick building level. Source: vendor/parsers/world-3/saltLick.ts#L13-L15 (tier 1, verified 2026-10-19) Confidence: H
- [C34] Chest Space gives 2 * level extra storage slots. Source: vendor/parsers/storage.ts#L81 (tier 1, verified 2026-10-19) Confidence: H
- [C35] Claiming a full bar resets progress to 0; whether time past a full bar is lost is not settled. Source: N.js @8779435 via packages/knowledge/systems/construction.yaml notes (UNVERIFIED-HERE) (tier 1, verified 2026-10-19) Confidence: L
- [C36] Gem shop adds +4 cog inventory per purchase (max 20) and Zen Excogia is a 2x2 Yin square; shelf cogs raise next cog EXP need. Source: prior (wiki Construction rev 2026-10-07; not re-read for gem); https://idleon.wiki/wiki/Construction (fetched 2026-10-19) (tier 3, verified 2026-10-19) Confidence: L
- [C37] Automation Arm unlocks in order: Forge Conveyor, Nutrient Neural Network, Miniature Soul Apparatus, Anvil Production Pipeline, Book Reservation System. Source: https://idleon.wiki/wiki/Automation_Arm rev 2025-05-13 via prior (older than current patch) (tier 3, verified 2026-10-19) Confidence: L
- [C38] KB build order W3-early: Printer(characters), Death Note 1, Salt Lick 1, Library 2, Pulse Mage 1, Fireball 1. Source: packages/knowledge/systems/construction.facts.yaml#L14-L26 (tier 3/4, verified 2026-10-19) **Disputed.** Source lens: the KB facts file is derived from wiki, gist and reddit, so it is tier 3/4 not tier 2; correction applied. Confidence: M
- [C39] Wiki recommended order: Printer first, then flags, characters, first salt, then Cost Cruncher, Chest Space, shrines, utilities (Library, Death Note, Salt Lick). Source: https://idleon.wiki/wiki/Construction (fetched 2026-10-19) (tier 3, verified 2026-10-19) Confidence: M
- [C40] Community gist order: 3D Printer (build and max first), Salt Lick, Refinery, Talent Book Library, Death Note, Trapper Drone, other towers and shrines; cluster Booster Cogs around one builder; cap at 2 Divine Knight builders; non-builders on shelf; also claims 'auto-refine ON for every salt' (contradicted by code per prior). Source: https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa (rev 2026-09-18, fetched 2026-10-19) (tier 4, verified 2026-10-19) Confidence: L
- [C41] Printer first: building it completes the Hoggindaz quest giving the Printer Sampling talent; r/idleon 2024-05-10 'unlocking all 3D printer slots first'. Source: https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa; https://www.reddit.com/r/idleon/comments/1cp1hjq/ via KB facts (tier 4, verified 2026-10-19) Confidence: L
- [C42] Construct-XP boost cogs around builders compound ('xp will always boost build rate'); opinion, thread not re-read. Source: https://www.reddit.com/r/idleon/comments/1s9aqlh/ (2026-04-01) via prior (tier 4, verified 2026-10-19) Confidence: L

- [C43] Redox Rates talent factor: `(1 + talent*(Helium - Talent Power Stacker atom + lavaLog(Redox salt in storage+refinery))/100)` multiplies player build speed. Source: vendor/parsers/character.ts#L3680-L3690 (tier 1, verified 2026-10-19) Confidence: H
- [C44] Gilded sources: Minehead upgrade 18 (cap 1), Sapphire Rhinestone ceil(jewel/5), Nitrogen atom (1), Legend talent 33 (cap 1), Gambit 9, Event shop 14; cap 8; Sapphire Rhinestone is lab jewel index 3. Source: vendor/parsers/world-3/construction.ts#L525-L552 (tier 1, verified 2026-10-19) Confidence: H
- [C45] Special cogs: CogY = Yang Cog, CogZ = Omni Cog; Excogia pieces (CogZA0n) outside an assembled 2x2 lose their boost. Source: vendor/parsers/world-3/cogstrution.ts#L52-L53; vendor/parsers/world-3/constructionOptimizer.ts#L32-L88; construction.ts#L108-L111 (tier 1, verified 2026-10-19) Confidence: H (exact Yang/Omni effects not traced: L)
- [C46] Flag indices: left extra column 96, right 108; FlagUnlock -11 = complete. Source: vendor/parsers/world-3/construction.ts#L89-L90,#L98,#L376 (tier 1, verified 2026-10-19) Confidence: H
- [C47] Construction EXP multiplier tree incl. ExtraConEXPmulti (small cogs x Yellow Jelly, since 2.3.540), Seesaw statue index 18, Sawsaw Salala star sign index 45 (flat +25, non-logged-in branch), Call Me Bob companion index 4. Source: vendor/parsers/character.ts#L3694-L3762; construction.ts#L124-L125 (tier 1, verified 2026-10-19) Confidence: H
- [C48] Shrine +100 max level applies only to shrines with `unlockedCorals > index-18`; per-building bonusInc growth rates (Cost Cruncher 1.106, Library 1.18) come from tower data. Source: vendor/parsers/world-3/construction.ts#L497-L503; SD#towers[].bonusInc (tier 1, verified 2026-10-19) Confidence: M (growth rates quoted from verifier, not re-read)
