# System Dossiers: W3 Construction cluster (2026-10-17)

Part of ticket [#22](https://github.com/YassSoliman/idleon-forge/issues/22) (World 3 account systems). This file covers **Construction** (build rate, build slots, every building), the **Refinery and salts**, the **3D Printer**, the **Salt Lick**, **Cogs and the Cog Board** and the **Atom Collider**. Worship, Trapping, the Death Note, Shrines and the other W3 Systems have their own files and are only linked here by name.

**Patch and sources.** Current patch is **v1.23 Luminous Menagerie** (2026-10-16/17). Sources, highest trust first (ADR 0004):

- **Game client** `N.js` (Last-Modified 2026-10-17 01:42 GMT, newest patch note `Luminous_Menagerie_v1.23`). Cited as `symbol @offset`. Offsets shift each patch; the symbol names stay.
- **IdleOn Toolbox** at [`6827d3f` (2026-10-17)](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1). Shortened below to `TB:<path>#L`. All links resolve to `https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/<path>`.
- **idleon.wiki** through `api.php`. The revision date is given for each page. Its tables are bot-generated, but some prose and templates are older than the patch. Each conflict is flagged.
- **Community opinion** (shnaps' gist, rev. 2026-09-18, self-declared "through v1.21"; Reddit). Labelled *opinion*.

Every number below that ActiveOn would show must come from Toolbox (ADR 0005). Formulas are quoted only so the Knowledge Base can explain why, never so we can recompute them.

## Answer

- **Building upgrades now cost salts only.** The material costs were removed in v1.05 (2026-02-20). In the game's `TowerInfo` table every building's material is `Blank` with base 0. The wiki's per-building "material / matbase" fields, and its "needs materials in storage" prose, are **stale**. So the whole Construction economy is build rate (time) plus refinery salts.
- **Each level is two steps.** A **build phase** fills from Total Build Rate: every build slot gets the full rate, and there are 2 base slots plus up to 4 from the gem shop and 2 from the W3 merit. Then a **salt payment** is due: `floor(saltBase × (level+1) × Cost-Cruncher factor)`. A finished build that cannot be paid **blocks that building**. The W3 fixture has exactly this: two buildings sit fully built but unpaid, one because its salt (Explosive) is not even switched on.
- **Construction XP and build rate come only from characters placed on the Cog Board or the Cog Shelf.** This works whatever the character is doing for its AFK activity. Construction level drives a character's own build rate, its flaggy rate and the cog tier it can make (Nooby Lv 1, Decent 15, Superb 40, Ultimate 70), so Construction-EXP cogs around your builders compound.
- **Two Squires/Divine Knights is the community "builder" meta** (*opinion*, gist 2026-09-18). Squire talents make that character the best builder: Redox Rates gives build speed per power of 10 Redox Salts, plus Sharper Saws, Super Samples and Refinery Throttle. An account with two Squires (the W3 fixture has two) is **well placed** for Construction, not off-meta.
- **Refinery: ranking a salt up needs a *manual* Refine with a full power bar.** In code, Auto Refine turns power into salt whenever there is any power and never ranks up (`_customEvent_RefineryStuff @7727375` vs the rank-up click `@7640085`). So Auto Refine ON means a steady salt flow and no rank-ups. The gist's "turn auto-refine ON for every salt, no downside" is **wrong for salts you want to rank**.
- **Salt costs grow faster than salt output.** Materials cost `floor(rank^1.5)`, while power per cycle is `floor(rank^1.3)`. Each salt also eats the salt before it, so over-ranking a higher salt starves the lower one. The W3 Salt Merit (5 levels, salts 2 to 6) prices salt inputs at `rank^1.3`. Toolbox's `getSaltsBalance` already computes the max safe rank per salt, and that should drive the Next Action.
- **3D Printer: building level = number of characters that can print** (data max 11, which matches the 11th character slot). Each character samples with the Printer Sampling star talent. Sample size is capped at **90%** of that character's AFK rate for the resource. A character's output then flows passively and account-wide. Printers left unbuilt and characters with no sample are the cheapest W3 wins.
- **Salt Lick has 11 upgrades, all priced in salt** (v1.17, 2026-06-06). Building level = number of upgrades unlocked. The wiki infobox still says max 10. Early priorities (*opinion plus value*): Printer Sample Size (+10% max), Refinery Speed (+200% max), Multikill (+30% max) and Talent-book max level (+20 max).
- **The Atom Collider is built in W3 (it needs Nullo Salt, the 6th salt) but pays off from W4.** It turns stored stacks above a chosen threshold (15M to 1.05B) into atoms, at 10M per atom. Over 1.05B it converts even when off or unbuilt. Atoms buy 11 base upgrades, max Lv 20. For a W3 account the only near-term pick is **Hydrogen** (stamp max-level costs fall up to 90%).
- **Toolbox already ships the Next Action triggers.** The dashboard alerts cover flags finished, buildings ready to pay, salts running out of fuel, salts ready to rank up, salt over-rank and room to rank, and printer items about to become atoms (`TB:utility/dashboard/account.js#L700-L830`). They are gated on World 2 being finished.

---

## Construction (build rate, slots and buildings)

- **What it is:** The Squire's specialized skill at the Construction Table in W3 town. Characters (and cogs) on the Cog Board produce **Build Rate**, which fills the build bars of queued buildings. A building's level then has to be **paid for in refinery salts**. There are 27 buildings: 9 utilities, 9 wizard towers (for Worship) and 9 shrines (for Shrines). ([wiki Construction](https://idleon.wiki/wiki/Construction), rev. 2026-10-07; `na.TowerInfo @14519175`)
- **Unlocks:** You reach W3 Frostbite Tundra town. The Hoggindaz questline walks you through it: "Turn ON for what???" switches on the first salt (the code completes `Hoggindaz1` when you toggle salt 0 on, `@7640085`), and "Constructing a Tower" and "Monke Tower Time!" follow (`TB:data/website-data/quests.json` `Hoggindaz`). No level gate was found. Construction Mastery needs **Rift 40** (W4): the game's `ConstMasteryBonus @7795518` returns 0 while `Rift[0] < 40`. The wiki says "clearing Rift 41", which is the same thing counted the other way.
- **Scope:** **Both.**
  - Account-wide: the building levels, build progress, the board, the flags and Total Build Rate.
  - Per character: each character's own Construction level, build speed and EXP/h. These count only while the character is placed on the board or shelf.
  - Squire talents raise **only that Squire's** contribution (`PlayerBuildSpd @7807516` reads that player's `SkillLevels[131]`).
- **Inputs → outputs:**
  - **In:** character time on the board or shelf (free: it does not stop their AFK activity), and salts (Refinery).
  - **Out:** building levels with the bonuses listed in the table below, Construction EXP for each character, and cogs (from the shelf).
  - **Build-phase requirement** (`TowerBuildReq @7814058`, `TB:parsers/world-3/construction.ts#L430-L438`): the 3D Printer needs `2·(L+1)²·1.3^(L+1)`. Every other building needs `RANDOlist[13][i] × scale^L`.
  - **Salt payment** (`TowerSaltCost @7814440`): `floor(max(0.2, 1 − crunch) × saltBase × (L+1))`. Cost Cruncher sets `crunch`: 10% at Lv 1, then +1% per extra level, up to 69% at Lv 60. The 80% floor is never reached. Cruncher does **not** reduce the build phase.
  - **Material payment** (`TowerMatCost @7814856`): the base is 0, so it is always 0. This has been true since v1.05 ([Changelog/2026](https://idleon.wiki/wiki/Changelog/2026) v1.05: "Construction 'material' costs are no longer. They now just got salts from the refinery.").
  - **Build slots** (`TowerBuildSlots @7815643`): `2 + gem "Tower Building Slots" (max 4, 350 gems each) + ceil(W3 merit #1 / 2)`. The merit gives +1 slot on its 1st and 3rd purchases. Every slot builds at the **full** Total Build Rate.
  - **Trimmed (gold) slots** (`TotalGildedSlots @7794674`, `TB:construction.ts#L527-L551`): the first N slots build at 3× the rate or more. The sources are all W4 or later: Sapphire Rhinestone (lab jewel), the Nitrogen atom, Gambit, a Legend talent, an Event Shop item and Minehead. The cap is 8.

### Buildings (game data, v1.23)

"Bonus/level" is the in-game text. "Max" is the base max level, and "+extra" is raised max levels and their sources. "Salt to max" assumes no Cost Cruncher. "Build Lv1" and "Build last" are the build-phase requirements, in build-rate units, for the first and last level.

| # | Building | Bonus per level | Max | +extra (source) | Salt | Salt base | Salt to max | Build Lv1 | Build last |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 3D Printer | +1 player slot printing | 11 | — | Redox | 3 | 198 | 2.6 | 4.3K |
| 1 | Talent Book Library | +5% checkout refresh speed | 101 | +100 (Construct Mastery 1000) | Redox | 6 | 30.9K | 200 | 3.1B |
| 2 | Death Note | +2% Multikill bonus (all worlds) | 51 | — | Explosive | 10 | 13.3K | 2.25K | 70M |
| 3 | Salt Lick | +1 upgrade available | 11 | — | Explosive | 20 | 1.32K | 12K | 12.3M |
| 4 | Chest Space | +2 storage chest slots (+2 base) | 25 | — | Explosive | 25 | 8.1K | 25K | 7.8M |
| 5 | Cost Cruncher | −1% building salt cost (−10% base) | 60 | — | Spontaneity | 20 | 36.6K | 60K | 22.9M |
| 6 | Trapper Drone | +10% critters from all traps; remote traps | 15 | +35 (Construct Mastery 500) | Spontaneity | 30 | 3.6K | 100K | 1.15B |
| 7 | Automation Arm | +1 automated system | 5 | — | Spontaneity | 50 | 750 | 150K | 38M |
| 8 | Atom Collider | atom upgrade costs −0.1% per level | 200 | — | Nullo | 10 | 201K | 50M | 1.05E19 |
| 9 | Pulse Mage | +15% dmg / +1.4% cheaper Worship upgrades | 50 | +2/Carbon atom Lv, +30 (Mastery 2500), Gambit | Redox | 2 | 2.6K | 5 | 21M |
| 10 | Fireball Lobber | +20% dmg / +1.5% | 50 | same | Redox | 4 | 5.1K | 100 | 117M |
| 11 | Boulder Roller | +25% dmg / +1.6% | 50 | same | Explosive | 4 | 5.1K | 700 | 108M |
| 12 | Frozone Malone | +1.5% range / +1.6% | 50 | same | Explosive | 7 | 8.9K | 5K | 240M |
| 13 | Stormcaller | +30% dmg / +1.7% | 50 | same | Spontaneity | 5 | 6.4K | 40K | 1.0B |
| 14 | Party Starter | +4% range / +1.7% | 50 | same | Spontaneity | 9 | 11.5K | 125K | 2.3B |
| 15 | Kraken Cosplayer | +3% spawn rate / +1.6% | 50 | same | Dioxide | 7 | 8.9K | 400K | 6.8B |
| 16 | Poisonic Elder | +15% dmg / +1.6% | 50 | same | Purple | 10 | 12.8K | 1M | 11.4B |
| 17 | Voidinator | +0.7% range / +0.8% | 50 | same | Nullo | 20 | 25.5K | 3.5M | 50.6T |
| 18 | Woodular Shrine | +10% shrine level-up rate | 100 | +100 (Mastery 1500), Sushi, Menagerie, Coral Reef | Redox | 2 | 10.1K | 10 | 24M |
| 19 | Isaccian Shrine | +10% | 100 | same | Redox | 5 | 25.2K | 250 | 255M |
| 20 | Crystal Shrine | +10% | 100 | same | Explosive | 4 | 20.2K | 1K | 180M |
| 21 | Pantheon Shrine | +10% | 100 | same | Explosive | 7 | 35.4K | 7.5K | 359M |
| 22 | Clover Shrine | +10% | 100 | same | Spontaneity | 5 | 25.2K | 40K | 1.2B |
| 23 | Summereading Shrine | +10% | 100 | same | Spontaneity | 10 | 50.5K | 200K | 4.3B |
| 24 | Crescent Shrine | +7.5% (nerfed v2.36) | 100 | same | Dioxide | 12 | 60.6K | 2M | 42.9B |
| 25 | Undead Shrine | +10% | 100 | same | Purple | 14 | 70.7K | 7M | 87.7B |
| 26 | Primordial Shrine | +10% | 100 | same | Nullo | 10 | 50.5K | 60M | 304B |

Sources:

- Columns and bonus text: `na.TowerInfo @14519175`, mirrored in `TB:data/website-data/shared-data.json` `towers` (fields `maxLevel`, `bonusInc` = scale, `costInc` = bonus per level, `itemReq` = salt).
- Build bases: `RANDOlist[13]` (`TB:data/website-data/randomList.json` index 13).
- Extra levels: `ExtraMaxLvAtom @7797576` and `TB:construction.ts#L488-L502`.
- The wizard-tower damage and range bonuses belong to the Worship tower defence. The shrine level-up rate feeds Shrines. See those dossiers.

**Wiki conflicts (flagged):**

- The infoboxes for 3D Printer and Salt Lick say max **10**; game data says **11**. The wiki page dates are 2026-10-14 and 2026-10-07, but the 11th Salt Lick upgrade arrived in v1.17, and the infobox values are older than that.
- Most building pages still list a material and a matbase. Some are dated 2023-11-21 (Pulse Mage, Boulder Roller, Chest Space, Cost Cruncher). These are **stale since v1.05**.

### Automation Arm systems (in unlock order, 1 per level)

Forge Conveyor Belt (refills forge slots) → Nutrient Neural Network (AFK food refill from storage) → Miniature Soul Apparatus (remote Worship totems with best wave 10+, for souls) → Anvil Production Pipeline → Book Reservation System (spends 20 Library checkouts for a max-level book). Source: [wiki Automation Arm](https://idleon.wiki/wiki/Automation_Arm) (rev. **2025-05-13**, older than the current patch; the names match current play reports, but recheck after a patch).

### Construct Mastery (W4 Rift 40+, by total building levels)

| Total building levels | Bonus | Source |
|---|---|---|
| any (from Rift 40) | +1% refinery speed per 10 total levels | `ConstMasteryBonus` index 0 |
| 500 | Trapper Drone +35 max levels | index 3 |
| 750 | +2% damage per 10 levels above 750 | index 1 |
| 1000 | Talent Book Library +100 max levels | index 4 |
| 1250 | +5% build speed per 10 levels above 1250 | index 2 |
| 1500 | all Shrines +100 max levels | index 5 |
| 2500 | wizard towers +30 max levels | index 6 |

Thresholds `[250,500,750,1000,1250,1500,2500]` come from `_GenINFO[112]` (`TB:construction.ts#L440-L486`). The 250 threshold has no bonus in code.

- **Goals and Milestones:**

  | Goal | Milestone | Why |
  |---|---|---|
  | 3D Printer | level = number of characters (up to 11) | every level is one more character printing |
  | Salt Lick | Lv 11 | unlocks all 11 upgrades |
  | Build slots | 4 (base 2 + merit) | the cheapest parallel build rate; gems add up to +4 |
  | Chest Space | 25 | +52 storage slots in total |
  | Cost Cruncher | ~30 to 60 | −39% to −69% salt per building level |
  | Death Note | 51 | +102% base Multikill (feeds Death Note) |
  | Trapper Drone | 1, then 15 | remote traps (Trapping) |
  | Automation Arm | 3 (MSA), 5 | MSA lets you farm souls from anywhere |
  | Total building levels | 500 / 1000 / 1500 (W4+) | Construct Mastery unlocks |

- **Feeds / fed by:**
  - **Feeds:** 3D Printer, Salt Lick, Talent Book Library (talent max levels), Death Note (base Multikill), storage chest, Trapping (Drone), Worship (towers, the MSA arm), Shrines, the Atom Collider, the Forge (Conveyor Belt), Anvil, food (AFK refill).
  - **Fed by:**
    - Refinery salts (every payment).
    - Cogs and the board (build rate).
    - Alchemy: the Carpenter bubble ("+% build speed per Construction level") and the Shinyfin Stew and Turtle Tisane vials.
    - Stamps: the Gear Stamp (build speed) and Saw Stamp (EXP).
    - Obols of Construction, the Post Office, the Guild, the Arcade, the Bonus Ballot (+40% build and EXP), the Seesaw statue, the Sawsaw Salala star sign, achievements.
    - W4+: Construct Mastery, Upgrade Vault, Menagerie.

    Sources: [wiki Construction "Bonuses"](https://idleon.wiki/wiki/Construction) (bot table, rev. 2026-10-07) and `PlayerBuildSpd @7807516`.
- **Per-session actions:**
  - (1) Pay every building whose bar is full. Toolbox alert `construction.buildings`: `progress >= getBuildCost`.
  - (2) Keep **every build slot busy**. An empty slot wastes the full build rate.
  - (3) Re-queue so cheap levels never block expensive ones.
  - **Idle state:** all slots full and every finished bar paid.
  - **Capped state:** a finished bar you cannot pay because the salt is short. The building waits and its slot is wasted until you pay.
- **AFK Setup implications:**
  - Characters on the board keep building whatever their AFK activity, so **put every character with a Construction level on the board or shelf**.
  - Before a long AFK Stretch, queue long builds in every slot.
  - Check that the salt the next payment needs is running and fuelled.
- **Min-max by stage:**

  *Order synthesised from game data plus the gist (2026-09-18) and the wiki "Getting Started" (opinion where noted).*

  - **Early W3:** build the 3D Printer first and get it to one level per character. Then Pulse Mage and Fireball Lobber (Hoggindaz quests, Worship), the Talent Book Library, the first shrines (Woodular, Isaccian, Crystal, all Redox/Explosive), Death Note and Salt Lick.
  - **Mid W3:** Salt Lick to 11, Chest Space, Cost Cruncher (bought before the big salt sinks), Trapper Drone Lv 1, Automation Arm to 3 (MSA), Boulder Roller, Frozone and Stormcaller for Worship waves, then Clover, Pantheon and Summereading shrines.
  - **Late W3:** Death Note toward 51, Kraken, Poisonic and Voidinator (they need Dioxide, Purple and Nullo), Atom Collider Lv 1, Crescent, Undead and Primordial shrines.
  - **W4+ outline:** total building levels toward the Construct Mastery tiers, trimmed slots (lab Sapphire Rhinestone, Nitrogen atom), wizard towers past 50 (Carbon atom), Library/Shrine/Drone extra levels.
  - **Per class:**
    - Squire/Divine Knight are the builders: their talents raise their own build and EXP rates.
    - Every other class still builds at the same base rate per Construction level.
    - Warrior's "Tempestuous Emotions" adds specialized-skill EXP.
- **Common mistakes (detectable):**
  - A built bar left unpaid: `towers.data[i].progress >= getBuildCost(...)` while the needed salt is not `active`. The W3 fixture has 2 of these.
  - Empty build slots: fewer `inProgress` buildings than the slot count.
  - Following the wiki's material costs (stale).
  - Leaving the 3D Printer level below the character count: `towers.data[0].level < characters.length`.
- **Save and Toolbox fields:**
  - `account.towers.data[]`: `{name, index, level, maxLevel, progress, inProgress, slot, bonusInc, itemReq}`. Apply `applyMaxLevelToTowers` (`TB:construction.ts#L443`) for raised maxima.
  - `account.towers.totalLevels`, `wizardOverLevels`, `buildMultiplier`.
  - `account.construction.totalBuildRate`, `totalExpRate`, `totalFlaggyRate`, `totalPlayerExpRate`, `playersBuildRate`, `extraBuildSpeedMulti`.
  - Per character: `characters[].constructionSpeed`, `constructionExpPerHour`, `skillsInfo.construction.level`.
  - Gem shop: `account.gemShopPurchases[117]` (build slots), `[118]` (Fluorescent Flaggies).
  - W3 merits: `account.tasks[2][2][0..7]`.
  - Toolbox numbers: `getBuildCost`, `getTotalGildedSlots`, `getTrimmedBuildSpeed`, `getConstructionMasteryBonus`. The closest-building timer is in `TB:components/dashboard/Etc.jsx#L73-L90`.
  - Example: the W3 fixture had 12 total building levels and a 419/h Total Build Rate.
- **Sources:** cited inline. N.js symbols: `na.TowerInfo`, `WorkbenchStuff("TowerBuildReq"|"TowerSaltCost"|"TowerMatCost"|"TowerBuildSlots"|"TotalGildedSlots"|"ConstMasteryBonus"|"ExtraMaxLvAtom"|"PlayerBuildSpd"|"PlayerConExp")`. Wiki pages: Construction (2026-10-07), the building pages (2023-11-21 to 2026-10-14), Changelog/2026 (to v1.22). The gist is rev. 2026-09-18.

---

## Refinery and salts

- **What it is:** The machine left of the Construction Table. Each active salt runs **cycles** that burn fuel (materials, and from salt 2 on, the previous salt) and add **power**. Power becomes salt items when you **Refine**. Refining with a **full** power bar also **ranks the salt up**, which raises power per cycle. Salts pay for every building, the Salt Lick, crafting and alchemy. ([wiki Construction "Refinery"](https://idleon.wiki/wiki/Construction), rev. 2026-10-07)
- **Unlocks:** You reach W3 town, and the first salt is free. Each later salt is unlocked by spending the **previous** salt from storage: Explosive 40, Spontaneity 150, Dioxide 300, Purple 500, Nullo 750, Crosslink 10K, Propagated 100K (wiki table; the code charges `Refinery<n>` from storage, `@7643805`). The tabs are Combustion (salts 1–3), Synthesis (4–6) and Polymerization (7–9). Polymerization is a W7 Research unlock ("Polymer Refinery"); its salts need W5–W7 materials.
- **Scope:** **Account-wide.** The only per-character parts are the Squire's Refinery Throttle (an active skill with a 20 h cooldown, `cooldowns[130]`) and the Divine Knight family bonus, which is account-wide once the class exists.
- **Inputs → outputs:**

  | # | Salt | Fuel per cycle at rank 1 (from storage) | Tab and base cycle |
  |---|---|---|---|
  | 1 | Redox | 10 Spore Cap, 5 Copper Ore | Combustion 15 min |
  | 2 | Explosive | 10 Bullfrog Horn, 5 Forest Fibres, 2 Redox | Combustion |
  | 3 | Spontaneity | 50 Pocket Sand, 30 Goldfish, 40 Fly, 2 Explosive | Combustion |
  | 4 | Dioxide Synthesis | 10 Floof Ploof, 2 Dune Soul, 1 Scorpie, 1 Spontaneity | Synthesis 60 min |
  | 5 | Purple | 25 Cracked Glass, 5 Bloach, 5 Sentient Cereal, 5 Mousey, 2 Dioxide | Synthesis |
  | 6 | Nullo | 50 Contact Lense, 5 Void Bar, 5 Wispy Lumber, 5 Flycicle, 5 Frigid Soul, 2 Purple | Synthesis |
  | 7 | Crosslink (W5+) | 10 Light Lantern, 2 Breezy Soul, 1 Tuttle, 1 Nullo | Polymerize 100 h |
  | 8 | Propagated (W7) | 25 Equinox Flesh, 5 Caulifish, 5 Litterbug, 5 Prehistrium Bar, 2 Crosslink | Polymerize |
  | 9 | Anionic (W7) | 50 Magmaspike, then placeholders "Not_Yet" | Polymerize (not released) |

  Fuel source: `RefineryInfo @14807912` and `TB:shared-data.json` `refinery`. Cycle times come from `CycleInitialTime @7774314`: `900 × 4^tab × 25^max(0,tab−1)` s, divided by the speed bonuses (`TB:refinery.ts#L145-L177`).

  - **Per cycle:** power `+= min(250000, floor(rank^1.3) × (1+Panda companion))` (`PowerPerCycle @7774207`).
  - **Fuel scaling:** materials cost `floor(rank^1.5) × base`. Salt inputs also cost `rank^1.5`, unless the W3 merit covers that salt; then they cost `rank^1.3` (`CostsMulti @7773677`, `TB:refinery.ts#L271-L274`).
  - **Power cap per rank:** 50, 50, 200, 800, 3K, 8K, 14K, 20K, 30K, 40K, 50K, 65K, 80K, 100K, 200K … 1M from rank 22 (`RANDOlist[18]`, `TB:refinery.ts#L82-L85`).
  - **Refine:** turns power into `floor(power)` salt in one of **8 refinery storage slots** (`@7727375`). It needs a free slot or one already holding that salt.
  - **Auto Refine:** a toggle, stored as `0.01` or `0`. When on, it refines at any power, so the bar **never fills and the salt never ranks up**. Only a **manual** Refine at `power >= PowerCAP` ranks up (`@7640085`).

- **Goals and Milestones:**

  | Rank | Cost × | Power/cycle | Power cap | Cycles to rank | Efficiency |
  |---|---|---|---|---|---|
  | 1 | 1 | 1 | 50 | 50 | 100% |
  | 2 | 2 | 2 | 200 | 100 | 100% |
  | 3 | 5 | 4 | 800 | 200 | 80% |
  | 5 | 11 | 8 | 8K | 1K | 72.7% |
  | 10 | 31 | 19 | 50K | 2.6K | 61.3% |
  | 13 | 46 | 28 | 100K | 3.6K | 60.9% |
  | 22 | 103 | 55 | 1M | 18.2K | 53.4% |
  | 23+ | … | … | 1M (flat) | falling | — |

  From the [wiki rank table](https://idleon.wiki/wiki/Construction) (bot, rev. 2026-10-07), which agrees with `RANDOlist[18]` and the formulas.

  - **The real goal is balance, not the highest rank.** Toolbox `getSaltsBalance` (`TB:refinery.ts#L336-L414`) gives `maxSafeRank` per salt: the highest rank whose input cost still fits the previous salt's output, or the printer's output for printed materials.
  - **Merit Milestones:** the W3 "Salt Merit" gets 1 level per salt type, 5 in total, 2 merit points each.

- **Feeds / fed by:**
  - **Feeds:** every Construction payment, the Salt Lick, crafting and alchemy recipes, Squire "Precision Power" (+damage per refinery rank, if accuracy is 1.5× the cap), and Redox Rates (build speed per power of 10 Redox).
  - **Fed by:** 3D Printer (prints the fuel), AFK farming (Spore Cap, Copper, Frog, desert and W3 mobs, fish, bugs, critters, souls), Smithing (Void Bar), Trapping (critters), Worship (souls).
  - **Speed bonuses:** Red Malt vial, Salt Lick (Explosive), the Divine Knight family bonus, Pipe Gauge sigil, the Refinery stamp, Arcade, Bonus Ballot (+50%).
  - **W4+ speed:** shiny pets, Lab "Gilded Cyclical Tubing" 3×, Legend talent, Construct Mastery, Research.

  Sources: `TB:refinery.ts#L110-L143` and the [wiki bonus table](https://idleon.wiki/wiki/Construction).
- **Per-session actions:**
  - (1) **Manually Refine** every salt whose bar is full (Toolbox alert `rankUp`).
  - (2) Check **fuel time** for each active salt (alert `materials`, with lead-time `matsThreshold`).
  - (3) Empty the 8 refinery storage slots into the chest when they are near full.
  - (4) Use **Refinery Throttle** on each Squire/DK when its cooldown is up. It gives 3+ instant cycles, which still cost fuel.
  - (5) Re-check salt balance after any rank-up (alerts `saltBalance`: over-ranked or room to rank).
  - **Idle state:** every unlocked salt is active and fuelled for the Expected Return, nothing is waiting at full power, and storage slots are free.
- **AFK Setup implications:**
  - Put printer samples and AFK farmers on the **fuel materials** of your active salts, Spore Cap and Copper first.
  - Before a long AFK Stretch, make sure fuel lasts the Expected Return. `getSaltMatsTimeLeft` gives the hours.
  - Turn Auto Refine **ON** only for a salt you need as a currency right now and do not plan to rank.
- **Min-max by stage:**
  - **Early W3:** Redox and Explosive. Keep them **ranked above** the higher salts. Unlock Spontaneity at 150 Explosive. Buy the Salt Merit levels as merit points allow.
  - **Mid W3:** Dioxide and Purple. Watch that the Synthesis salts' 1 h cycles do not drain Combustion salts faster than they refill.
  - **Late W3:** Nullo, needed for the Atom Collider, Voidinator and Primordial Shrine. It needs Void Bars (Smithing) and W3 souls and bugs.
  - **W4+ outline:**
    - A Divine Knight (family bonus).
    - Lab Gilded Cyclical Tubing (3×).
    - Shiny pets for speed.
    - Rift 40 Construct Mastery.
    - The Polymerization tab (W7).
  - **Per class:**
    - Squire/DK: Refinery Throttle, Precision Power.
    - DK family: refinery speed `50·lv/(150+lv)%`.
- **Common mistakes (detectable):**
  - **Auto Refine ON on a salt you want to rank.** Detect `salts[i].autoRefinePercentage > 0` with `refined` never near `powerCap`.
  - **A salt unlocked but inactive** while a building waits on it (`active == 0`).
  - **Over-ranking a higher salt**, so it starves the one below (`getSaltsBalance` `isDeficit` or `rank > maxSafeRank`).
  - **No fuel**: `hasMissingMats`.
  - **Reading "power" as "salt".** The gist and the Toolbox field name call salt-in-progress "refined".
  - In the W3 fixture, salt 2 was unlocked and inactive while a building waited for it, and salt 1 was on Auto Refine at rank 1.
- **Save and Toolbox fields:**
  - `account.refinery.salts[]`: `{saltName, rawName, rank, refined (= power), powerCap, active, autoRefinePercentage, unlocked, cost[].{rawName, quantity, totalAmount}}`.
  - `account.refinery`: `refinerySaltTaskLevel` (merit level), `timePastCombustion`, `timePastSynthesis`, `timePastPolymerize`, `totalLevels`, `refineryStorage[]`.
  - Toolbox functions: `getRefineryCycles` (cycle times plus Squire throttle cycles and cooldowns), `calcTimeToRankUp`, `getSaltsBalance`, `getSaltMatsTimeLeft`, `calcResourceToRankUp`, `hasMissingMats` (`TB:parsers/world-3/refinery.ts`).
- **Sources:** cited inline. N.js symbols: `Refinery("PowerCAP"|"CostsMulti"|"PowerPerCycle"|"CycleInitialTime"|"FuelCalc"|"RewardPct")` at @7773490 to @7776616, `_customEvent_RefineryStuff` (auto-refine pass @7727375), the refinery click handler (toggle @7642193, rank-up @7640085, unlock @7643805). Wiki: [Changelog/2025](https://idleon.wiki/wiki/Changelog/2025) v2.41 (2025-07-06), "Auto Refine… ON… will refine into salt whenever it has any Power", which agrees with the code. The gist (2026-09-18) "no downside" claim **disagrees** with the code.

---

## 3D Printer

- **What it is:** The first Construction building. Each character takes **samples** of a resource it is AFK-gathering, using the Printer Sampling star talent. The printer then produces that sample's amount **every hour, forever**, into the account. ([wiki 3D Printer](https://idleon.wiki/wiki/3D_Printer), rev. 2026-10-14)
- **Unlocks:**
  - You build it in Construction. Each building level unlocks one more character's printer, up to 11 (data max 11; the wiki says 10).
  - The **Printer Sampling** talent book (Special Talents tab 2, `skillIndex 635`) comes from Hoggindaz quest 5 "Taking Samples" (`TB:quests.json`; wiki).
- **Scope:** **Both.** The samples and their sizes are **per character**, because each character samples its own AFK rate. The output and the multipliers are account-wide.
- **Inputs → outputs:**
  - **In:** a sample = `sampleSize% × the character's current AFK rate for that resource`.
    - Sample size is the talent's base of about 10%, plus bonuses, **capped at 90%** (`SampleSizeBONUS @7815869`: `min(0.9, …)`).
    - Bonuses: Printer Sampling talent, Salt Lick Redox (+0.5%/lvl), Squire "Super Samples", Achievement 158, Sample It bubble, vial, the "Royal Sampler" prayer, the Sample stamps, the W3 merit (+0.5%/lvl to 5%), the Maestro family bonus (`classFamilyBonuses[3]`, capped at 5% in `SampleSizeBONUS`), Arcade, the Post Office box.
  - **Slots:**
    - Stored samples: `4 + gem "More Sample Spaces" (max 6)` (`PrinterSampleSlots @7816582`).
    - Printing chambers: `1 + gem "Crystal 3D Printer"` (875 gems, max 1), so 2 at most (`PrinterBigSlots @7816684`).
  - **Out:** printed resource per hour = sample × the printer multiplier (`AdditionExtraPrinting @7816783`, `TB:printer.ts#L90-L154`). All terms in the multiplier are W4+:
    - Gold Relic: +2%/day since the last sample.
    - Divine Knight "King of the Remembered".
    - Skill mastery and the Lolly Flower charm.
    - Vote, event, companion, Compass.
    - On top of that: Lab "Wired In" 2× (while AFK in the lab) and Harriep major 3×.
- **Goals and Milestones:**

  | Goal | Milestone |
  |---|---|
  | Printer building level | = number of characters (up to 11) |
  | Sample size | 90% cap |
  | Chambers | 2 (Crystal 3D Printer gem) |
  | W4+ | Wired In 2×, Harriep 3× (6× together) |

- **Feeds / fed by:**
  - **Feeds:** Refinery fuel, Smithing and Anvil materials, stamps (material costs), the Post Office (order materials), Alchemy bubble costs, the Atom Collider (stacks above the threshold become atoms).
  - **Fed by:** each character's AFK gain rate per skill or monster: skill efficiency, AFK-gain bonuses, the Death Note and Multikill for monster materials, Salt Lick, merits, Prayers (Royal Sampler).
- **Per-session actions:**
  - (1) **Re-sample** any character whose current AFK rate for its printed resource has grown, for example after a level-up, better gear or more Multikill. Compare the sample's `value` with what a new sample would take.
  - (2) Fill every unlocked character's printing chamber.
  - **Idle state:** every printing chamber of every unlocked character is active.
  - Maestro "Printer Go Brrr" prints hours instantly, as a daily active skill.
- **AFK Setup implications:**
  - Take samples while the character is on its **best** AFK target for that resource.
  - The gist's "snapshot" trick: wear max-efficiency gear, sample, then switch gear (*opinion*, unverified mechanic).
  - Point samples at the fuel your refinery and stamp upgrades need. The wiki tip is "point the printer at refinery fuel" ([Tips and Tricks](https://idleon.wiki/wiki/Tips_and_Tricks), rev. 2025-12-24).
- **Min-max by stage:**
  - **Early W3:** max the printer to your character count, and sample Spore Cap and Copper for Redox first. After that, sample each character's own skill resource.
  - **Mid W3:** stack sample size (Salt Lick Redox, W3 merit, Super Samples on Squires), then re-sample everything.
  - **Late W3:** buy the Crystal 3D Printer if you spend gems. Use the second chamber for a second resource.
  - **W4+ outline:**
    - Lab Wired In.
    - Divine Knight King of the Remembered.
    - Gold Relic: sample less often, because its bonus resets on a new sample.
    - Harriep.
    - Atom thresholds.
- **Common mistakes (detectable):**
  - Characters with no active sample: every `printer[c][slot].item == 'Blank'` while active. In the W3 fixture, 2 of 6 characters had no sample.
  - Printer level below the character count.
  - Stale low samples on a character whose AFK rate has since grown. This needs AFK-rate data: compare `printer[c].value` with the character's AFK rate.
- **Save and Toolbox fields:**
  - `account.printer[charIndex][]`: `{item, value (raw sample/h), active (printing chamber), boostedValue (after multipliers), breakdown}`. There are 12 entries per character: 10 stored, then 2 printing.
  - `characters[].printerSample`.
  - `account.accountOptions[125]`: days since the last sample (Gold Relic).
  - Gem shop: `account.gemShopPurchases[111]` (Crystal Printer), `[112]` (sample spaces).
  - Toolbox functions: `getPrinterMulti`, `calcTotals` (per-item totals and atom overflow), `isPrinterWiredIn` (`TB:parsers/world-3/printer.ts`).
- **Sources:** cited inline. Talent data: `TB:data/website-data/talents.json` (PRINTER_SAMPLING 635, SUPER_SAMPLES 133, PRINTER_GO_BRRR 32, KING_OF_THE_REMEMBERED 178). Merit: `TB:shared-data.json` `merits[2][4]`. Gem shop: `TB:data/website-data/gemShop.json` (111, 112).

---

## Salt Lick

- **What it is:** A building where salts buy permanent account bonuses. ([wiki Salt Lick](https://idleon.wiki/wiki/Salt_Lick), rev. 2026-10-07)
- **Unlocks:** You build it in Construction. It needs Explosive Salt, so you need salt 2. Each building level makes one more upgrade available, in table order (`TB:saltLick.ts#L11-L12`).
- **Scope:** **Account-wide.**
- **Inputs → outputs:** upgrade *n* at level *L* costs `baseCost × increment^L` of its salt (wiki formula; data in `na.SaltLicks @14541173`). All upgrades have been salt-only since v1.17 (2026-06-06), which also added upgrade 11 ([Changelog/2026](https://idleon.wiki/wiki/Changelog/2026)).

  | # | Salt | Bonus per level | Max | Max bonus | Cost Lv1 | Growth | Cost to max |
  |---|---|---|---|---|---|---|---|
  | 1 | Redox | +0.5% printer sample size | 20 | +10% | 5 | 1.5× | 33.2K |
  | 2 | Redox | +4 obol storage slots (Circle → Square → Hex → Sparkle) | 8 | +32 | 10 | 2.3× | 6.0K |
  | 3 | Explosive | +2% refinery speed (all cycles) | 100 | +200% | 5 | 1.15× | 39.1M |
  | 4 | Explosive | +0.2% class and skill EXP | 100 | +20% | 10 | 1.2× | 4.1B |
  | 5 | Spontaneity | +2 talent-book max level (Library) | 10 | +20 | 5 | 2.2× | 11.1K |
  | 6 | Spontaneity | +1% alchemy liquid rate and capacity | 100 | +100% | 10 | 1.122× | 8.2M |
  | 7 | Dioxide | +5% Worship tower-defence points | 10 | +50% | 5 | 2.1× | 7.6K |
  | 8 | Dioxide | +0.4% move speed (not above 170%) | 25 | +10% | 10 | 1.4× | 112K |
  | 9 | Purple | +3% Multikill rate, all worlds | 10 | +30% | 5 | 2.2× | 11.1K |
  | 10 | Purple | +0.1% total damage | 250 | +25% | 10 | 1.04× | 4.5M |
  | 11 | Nullo | +1% Cooking Mastery EXP (Rift 61) | 100 | +100% | 100 | 1.22× | 197B |

  Levels are clamped to the max on load (`TB:saltLick.ts#L20`). The bonus is `level × baseBonus` (`SaltLick @7821904`).

- **Goals and Milestones:** the "Max" column above. The cheap caps are #1, #2, #5, #7 and #9, each costing about 6K to 33K of its salt.
- **Feeds / fed by:**
  - **Feeds:** 3D Printer, Obols (storage), the Refinery (speed: a loop), class and skill EXP, the Talent Book Library, Alchemy liquids, the Worship tower defence, Multikill and the Death Note's value, damage, W4 Cooking Mastery.
  - **Fed by:** Refinery salts, and the Salt Lick's own Construction level.
- **Per-session actions:**
  - Spend spare salt on the next cheapest priority level, but **only from salt not needed for queued building payments**. The Spend Plan has to reserve building payments first.
  - **Idle state:** every unlocked upgrade is either capped or unaffordable.
- **AFK Setup implications:** none directly. Upgrade #3 shortens refinery cycles, so fuel runs out sooner. Re-check fuel time after buying it.
- **Min-max by stage (*opinion*, from value per salt):**
  - **Early W3:** #1 Printer Sample (cheap, compounds), #2 Obol slots (cheap QoL), then #3 Refinery Speed, kept rising in step with Explosive production.
  - **Mid W3:** #5 talent-book max level and #9 Multikill (cheap caps), then #6 liquids, #7 tower-defence points.
  - **Late W3:** #10 Damage and #4 EXP as long-term sinks.
  - **W4+ outline:** #11 once you reach Rift 61 Cooking Mastery.
- **Common mistakes (detectable):**
  - Salt Lick built but upgrades left at 0: `saltLick[i].unlocked && level == 0`. The W3 fixture has the building at 0.
  - Spending Explosive on #4 EXP while buildings wait for Explosive.
  - Following guides that list non-salt W3 materials as costs (out of date since v1.17).
- **Save and Toolbox fields:** `account.saltLick[]`: `{name, rawName, desc, baseCost, increment, baseBonus, maxLevel, level, unlocked, totalAmount (owned salt, chest + inventory + refinery slots)}`. `getSaltLickBonus(saltLick, index)` (`TB:parsers/world-3/saltLick.ts`).
- **Sources:** cited inline. The wiki Salt Lick infobox (max 10) is **older than v1.17**.

---

## Cogs and the Cog Board (Cogstruction, flags)

- **What it is:** The Construction screen's 12 × 8 **Cog Board**. Characters and cogs placed on it add Build Rate, Flaggy Rate and Construction EXP. Boost cogs multiply their neighbours, in an area set by their shape. The **Cog Shelf** turns characters' production into new cogs. **Flags** unlock board squares. ([wiki Construction "Cogs", "Flags"](https://idleon.wiki/wiki/Construction), rev. 2026-10-07; `TB:constructionOptimizer.ts#L1-L80`)
- **Unlocks:**
  - The board comes with Construction. The center 8 squares start open.
  - **Cog tiers** you can make, by Construction level (wiki):

    | Cog tier | Construction level |
    |---|---|
    | Nooby | 1 |
    | Decent | 15 |
    | Superb | 40 |
    | Ultimate | 70 |

  - Cog stats scale with the **highest** Construction level on the account.
  - **Later unlocks:** Tiny Cog side columns (W7 Research J8, v1.05), Jewel Cogs (Gaming Duperbits, W5+), Zen Yin/Yang cogs (gem shop, 500 gems, max 8).
  - **Open question:** a Reddit user (2026-05-28) reports Superb still locked at Construction Lv 67 ([post](https://www.reddit.com/r/idleon/comments/1tpzotw/how_to_unlock_superb_cogs/)). The wiki's level gate may be incomplete.
- **Scope:** **Both.**
  - Account-wide: the board, cogs, flags and the totals.
  - Per character: each character's square or shelf placement, Construction level, build speed and EXP/h. Boost cogs give "+% Player Construct XP" only to characters in their area.
- **Inputs → outputs:**
  - **Characters:**
    - Base build speed: `3·(ConLv/2 + 0.7)^1.6`, times the Carpenter bubble and the other multipliers (`PlayerBuildSpd @7807516`).
    - EXP/h: `(buildSpd^0.7/2 + 2 + 6·ConLv)` times the bonuses (`PlayerConExp @7810585`).
  - **Cogs:** base stats are Build Rate/h, Flaggy Rate/h and %Construct EXP. **Boost** shapes are Adjacent, Diagonal, Up, Down, Left, Right, Row, Column and Corner ("Omni"). The boost kinds are %Build Rate, %Flaggy Rate, %Player Construct XP and %Speed to Flags ("%Nothing" is a dud). The roll chances per tier are in the wiki tables (`cogKeyMap`, `TB:shared-data.json`).
  - **Flags:** a square opens when its flag progress reaches `25 × flagsReqs[i]`. Costs run from 25 next to the center to 250M at the corners. Tiny-cog columns cost 5M up to 8E22 (`getFlagReq`, `TB:construction.ts#L354-L361`; `FlagReq @7794445`). Progress is kept even if the flag is moved.
  - **Totals:** Total Flaggy Rate is multiplied by `1 + 0.5 × gem "Fluorescent Flaggies"` (max 6, so 4×). Tiny cogs multiply the build, EXP and flaggy totals.
  - **Shelf:** each uncollected cog **doubles** the progress needed for the next one (wiki).
- **Goals and Milestones:**

  | Goal | Milestone |
  |---|---|
  | Board squares | the inner ring (25 to 60 flaggy each), then the 100 to 375 rings, then ~1M+ outer squares |
  | Construction level | 15 (Decent), 40 (Superb), 70 (Ultimate cogs) |
  | Builders | 2 Squires/DKs, each surrounded by inward-pointing boost cogs |
  | Gem/W7 | Fluorescent Flaggies, Zen Excogia (4 Yin in a 2×2 square), Tiny Cog columns |

- **Feeds / fed by:**
  - **Feeds:** Construction build rate, which drives every building, and so the 3D Printer, Salt Lick, Death Note and the rest. It also gives every character Construction EXP (skill levels count for Skill Mastery in W4+).
  - **Fed by:**
    - Alchemy: Cogs For Hands and Sippy Cup bubbles (cog production), Bubonic Burp (cog inventory).
    - The Chizoar card (W3 boss, +8% cog build speed per tier).
    - The Taxidermied Cog Pouches bribe.
    - Gem shop: cog inventory (+4 per purchase, max 20).
    - Squire talents, Redox Salt stock (Redox Rates), the Helium atom (extra powers of 10 for Redox Rates).
- **Per-session actions:**
  - (1) **Collect shelf cogs** (they double each other's cost).
  - (2) Trash or replace weak cogs, and place better ones. The Toolbox optimizer gives the swaps.
  - (3) Move flags off finished squares (Toolbox alert `construction.flags`: placed and `currentAmount == requiredAmount`).
  - (4) Put any new character on the board or shelf.
  - **Idle state:** no finished flag still placed, the shelf collected, and no empty usable square.
- **AFK Setup implications:**
  - **Every character goes on the board or shelf** before an AFK Stretch. It costs nothing against their AFK activity (wiki: placing characters is "the primary way to acquire character experience in Construction").
  - Put flags on the cheapest locked squares next to open ones, so they finish during the AFK Stretch.
- **Min-max by stage:**
  - **Early W3:** open the inner rings first. Favour Build Rate cogs, plus Flaggy until about 30 squares are open.
  - **Mid W3:** builders (Squires/DKs) on squares where boost cogs reach them. **Construct-EXP boosts around builders** compound (wiki, and a Reddit thread 2026-04-01, *opinion*: "Still xp. Xp will always boost build rate"). Characters that are not builders go on the shelf to make cogs.
  - **Late W3:** push Construction level toward 70 for Ultimate cogs, and keep only the best cogs.
  - **W4+ outline:** Fluorescent Flaggies and Zen cogs if you spend gems. Jewel cogs (W5) and Tiny cogs (W7) after that. Trimmed slots (W4 lab).
  - **Per class:** Squire/DK: two builders is the *opinion* meta (gist 2026-09-18: "Cap Divine Knights at 2… construction only needs two builders"). Every other class is equally good on the shelf.
- **Common mistakes (detectable):**
  - Characters with a Construction level who are on neither the board nor the shelf.
  - Finished flags left in place.
  - A full cog inventory (`spareCogs` with no `Blank`), which stalls the shelf.
  - Boost cogs pointing at empty squares or at other cogs that need no boost. Toolbox's optimizer gain shows this: `optimizeSwapCurve` and `bestValuePlan` against the current board.
  - In the W3 fixture, 2 characters were on the board and 3 flags placed, with 23 of 96 squares open.
- **Save and Toolbox fields:**
  - `account.construction.board[96]`: `{currentAmount, requiredAmount, flagPlaced, cog: {name, stats.{a,b,c,d,e,f,g,j}, originalIndex}, flagSpeed, affects, affectedBy}`.
  - Also: `baseBoard`, `spareCogs` (CogOrder 96–227: 96–107 the character rack, then the inventory), `leftColumn` and `rightColumn` (tiny cogs, 228–251), `smallCogs.{upgrades, spares, freeSlots}`, `boardMultipliers`, `cogstruction.{cogData, empties}` (CSV for the external Cogstruction optimizer).
  - Toolbox numbers: `evaluateBoard`, `optimizeArrayWithSwaps`, `optimizeSwapCurve`, `bestValuePlan`, `getCogDisplayName`, `getSmallCogUpgrades` (`TB:parsers/world-3/construction.ts`, `constructionOptimizer.ts`).
- **Sources:** cited inline. The wiki's cog tier, boost and jewel tables are bot-generated (rev. 2026-10-07). Changelog/2026: v1.05 tiny cogs, v1.07 Cog-Stats viewer and trimmed info, v1.16 board fix. Changelog/2025: v1.00 Yang buff, v2.31 flag progress shown.

---

## Atom Collider

- **What it is:** The last Construction building. It **converts stored resources into atoms**: 1 atom per 10M of a storage stack above the chosen threshold. Atoms buy account-wide atom upgrades. Atoms are also spent on Boron bubble upgrades, a Divinity blessing and the Caverns Bell. ([wiki Atom Collider](https://idleon.wiki/wiki/Atom_Collider), rev. 2026-10-07)
- **Unlocks:**
  - Construction building #8, which needs **Nullo Salt**, the 6th salt, so late W3. The build phase starts at 50M build. It goes to Lv 200; each level makes atom upgrades 0.1% cheaper (`AtomCost @10766700`: `TowerInfo[8]/10`).
  - **11 atoms** are available at first (Hydrogen to Sodium). Up to 6 more unlock from the Compass, Jelly Operator, Minehead, Sushi and Menagerie (`AtomsAvailableAtAll @10764165`), all W6–W7.
  - Max level is 20, raised by a Gaming superbit, the Compass, the Event Shop and Menagerie (`AtomMaxLv @10764820`).
- **Scope:** **Account-wide.** The W3 build is the only W3 part. Nearly all the value is **W4+**.
- **Inputs → outputs:**
  - **In:** storage stacks above the threshold. The threshold cycles through 15M, 25M, 100M, 250M and 1.05B (`OptionsListAccount[133]`, `TB:atomCollider.ts#L148-L151`). Stacks **over 1.05B convert even when the collider is off or not built** (wiki; v1.03 made this more frequent).
  - Atom cost: `(x3 + x1·L) × x2^L`, divided by the reductions: Neon, the Atom Split bubble, the collider level, stamps, the W5 merit, superbit, Compass, Grimoire, Bubba (`TB:atomCollider.ts#L114-L133`).

  | Atom | Effect | Lv1 cost | Cost to Lv 20 | Stage it matters |
  |---|---|---|---|---|
  | Hydrogen: Stamp Decreaser | stamp max-lv cost −(lvl)%/day, up to 90%, reset on upgrade | 2 | 21K | **W3+** |
  | Helium: Talent Power Stacker | +1 "power of 10" per level for POW-10 talents | 10 | ×10 per level | W3+ (Redox Rates) |
  | Lithium: Bubble Insta Expander | No Bubble Left Behind covers all bubbles, +chance | 25 | 61K | W4 (lab) |
  | Beryllium: Post Office Penner | silver pens → PO boxes daily | 75 | 148K | W3+ |
  | Boron: Particle Upgrader | pay atoms for bubbles costing 100M+ | 175 | 1.9M | W4+ |
  | Carbon: Wizard Maximizer | wizard towers +2 max lv/level; +2% wizard dmg per tower lv over 50 | 500 | 1.9M | W3/W4 (Worship) |
  | Nitrogen: Construction Trimmer | +1 trimmed slot; +15%/lvl trimmed speed | 1K | 3.0M | W4+ |
  | Oxygen: Library Booker | Library refresh speed and min/max book level | 3.25K | 5.6M | W4+ |
  | Fluoride: Void Plate Chef | cooking speed per Lv 30+ meal | 2.5K | 10.7M | W4 (Cooking) |
  | Neon: Damage N' Cheapener | +1% damage and −1% atom costs per level | 5K | 18.8M | W4+ |
  | Sodium: Snail Kryptonite | snail fail resets to nearest 5 | 12K | 239B | W5 (Gaming) |
  | Mg, Al, Si, P, S, Cl | traps, stamp doublers, Minehead, Sushi, Jelly, Lumi | 30K–10M | — | W6–W7 unlocks |

  Data: `TB:shared-data.json` `atomsInfo`. Costs are before any reduction.

- **Goals and Milestones:** the collider at Lv 1. Hydrogen 1 → 10 → 20 (cheap). Then the gist's priority (*opinion*, 2026-09-18): "Hydrogen + Helium → Boron → Neon".
- **Feeds / fed by:**
  - **Feeds:** stamps (Hydrogen), talents (Helium), Alchemy (Lithium, Boron), the Post Office (Beryllium), Worship towers (Carbon), Construction (Nitrogen trimmed slots), the Talent Book Library (Oxygen), Cooking (Fluoride), damage (Neon), Gaming (Sodium), Trapping (Magnesium).
  - **Fed by:** storage overflow from the 3D Printer and AFK farming.
- **Per-session actions:**
  - Spend atoms on the next priority upgrade.
  - Check that the threshold keeps the resources you are saving. Toolbox's `printer.atoms` alert flags printed items about to cross it; its default exclusions are refinery fuel, Copper, Oak, Spore Cap, Fly and Goldfish (`TB:printer.ts#L204-L215`).
- **AFK Setup implications:** the gist advises leaving the collider OFF and setting thresholds, so long AFK Stretches do not burn stockpiles (*opinion*). In code, stacks over 1.05B convert regardless.
- **Min-max by stage:**
  - **W3:** build Lv 1 once Nullo flows, then Hydrogen first (it cuts stamp max-level costs, a big W1–W3 coin and material sink). A few Helium levels if Squires run Redox Rates.
  - **W4+ outline:** Boron and Neon, Lithium with the lab, Carbon for Worship, Nitrogen for trimmed slots, Fluoride with Cooking.
- **Common mistakes (detectable):**
  - Collider ON with a low threshold, eating printed refinery fuel. Detect `accountOptions[133] == 0` while the refinery fuel stacks sit near 15M.
  - Upgrading a stamp max level the day before a big Hydrogen discount, since the discount resets on any stamp max-lv upgrade. Detect from `atoms.stampReducer`.
- **Save and Toolbox fields:**
  - `account.atoms.particles`: the atom currency, stored at `Divinity[39]`.
  - `account.atoms.atoms[]`: `{name, level, maxLevel, cost, nextLeveCost, costToMax, value, bonus}`.
  - `account.atoms.totalAtomsAvailable`, `stampReducer`.
  - `account.towers.data[8].level` (collider level), `account.accountOptions[133]` (threshold).
  - Toolbox functions: `getAtoms`, `getAtomBonus`, `getAtomColliderThreshold`, `calcTotals` in printer.ts (atoms per item).
  - In the W3 fixture, the collider is unbuilt and there are 0 atoms.
- **Sources:** cited inline. The wiki Atom Collider page (rev. 2026-10-07) uses "atoms"; Toolbox's field calls them `particles`; the gist uses both. Changelog/2025 v1.03 (2025-11-29): more frequent conversion over 1050M. Changelog/2026: v1.05 (2026-02-20) added the Depth Charge atom and v1.22 (2026-09-19) the Jelly Operator atom.

---

## Sources

**Game client**

[legendsofidleon.com/ytGl5oc/N.js](https://www.legendsofidleon.com/ytGl5oc/N.js), Last-Modified 2026-10-17 01:42:35 GMT, v1.23 `Luminous_Menagerie_v1.23`. Offsets are from `str.find` on this exact file.

| Symbol | Offset |
|---|---|
| `na.TowerInfo` | @14519175 |
| `na.SaltLicks` | @14541173 |
| `RefineryInfo` | @14807912 |
| `Refinery("PowerCAP")` | @7773490 |
| `Refinery("CostsMulti")` | @7773677 |
| `Refinery("PowerPerCycle")` | @7774207 |
| `Refinery("CycleInitialTime")` | @7774314 |
| `Refinery("RewardPct")` | @7776616 |
| `WorkbenchStuff("FlagReq")` | @7794445 |
| `WorkbenchStuff("TotalGildedSlots")` | @7794674 |
| `WorkbenchStuff("ConstMasteryBonus")` | @7795518 |
| `WorkbenchStuff("ExtraMaxLvAtom")` | @7797576 |
| `WorkbenchStuff("ExtraBuildSPDmulti")` | @7806820 |
| `WorkbenchStuff("ExtraConEXPmulti")` | @7807358 |
| `WorkbenchStuff("PlayerBuildSpd")` | @7807516 |
| `WorkbenchStuff("PlayerConExp")` | @7810585 |
| `WorkbenchStuff("TowerBuildReq")` | @7814058 |
| `WorkbenchStuff("TowerSaltCost")` | @7814440 |
| `WorkbenchStuff("TowerMatCost")` | @7814856 |
| `WorkbenchStuff("TowerBuildSlots")` | @7815643 |
| `WorkbenchStuff("SampleSizeBONUS")` | @7815869 |
| `WorkbenchStuff("PrinterSampleSlots")` | @7816582 |
| `WorkbenchStuff("PrinterBigSlots")` | @7816684 |
| `WorkbenchStuff("AdditionExtraPrinting")` | @7816783 |
| `SaltLick` | @7821904 |
| `AtomCollider` | @10764165 |
| `AtomMaxLv` | @10764820 |
| `AtomBonuses` | @10765143 |
| `AtomCost` | @10766700 |
| Refinery click handler: auto-refine toggle | @7642193 |
| Refinery click handler: rank-up | @7640085 |
| Refinery click handler: salt unlock | @7643805 |
| `_customEvent_RefineryStuff` auto-refine pass | @7727375 |

**IdleOn Toolbox** [@ 6827d3f (2026-10-17)](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1)

- [`parsers/world-3/construction.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/construction.ts): L82–87 board indices, L174–198 small cogs, L285–341 small-cog upgrades, L354–361 flag req, L389–438 towers and build cost, L440–502 mastery and extra levels, L527–551 trimmed slots.
- [`constructionOptimizer.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/constructionOptimizer.ts)
- [`cogstrution.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/cogstrution.ts)
- [`refinery.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/refinery.ts): L39–99 parse, power cap and power per cycle; L110–177 speed and cycle times; L251–274 rank-up and cost; L336–472 balance and fuel time.
- [`printer.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/printer.ts): L31–88 parse, L90–154 multi, L155–215 atoms and exclusions.
- [`saltLick.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/saltLick.ts)
- [`atomCollider.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/world-3/atomCollider.ts)
- [`utility/dashboard/account.js` L700–830](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/account.js#L700-L830) (alerts)
- [`components/dashboard/Etc.jsx` L73–90](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/components/dashboard/Etc.jsx#L73-L90)
- `data/website-data/{shared-data,randomList,talents,quests,gemShop}.json`: towers, refinery, saltLicks, atomsInfo, flagsReqs, gameTables.constructionFlagReq, cogKeyMap, merits, classFamilyBonuses.

**idleon.wiki** (CC BY-NC-SA 3.0, read through `api.php` on 2026-10-17)

| Page | Revision date | Note |
|---|---|---|
| [Construction](https://idleon.wiki/wiki/Construction) | 2026-10-07 | bot tables current; some prose stale |
| [3D Printer](https://idleon.wiki/wiki/3D_Printer) | 2026-10-14 | max 10 is stale |
| [Salt Lick](https://idleon.wiki/wiki/Salt_Lick) | 2026-10-07 | max 10 is stale |
| [Atom Collider](https://idleon.wiki/wiki/Atom_Collider) | 2026-10-07 | |
| [Talent Book Library](https://idleon.wiki/wiki/Talent_Book_Library) | 2026-10-12 | |
| [Automation Arm](https://idleon.wiki/wiki/Automation_Arm) | **2025-05-13** | older than the current patch |
| [Trapper Drone](https://idleon.wiki/wiki/Trapper_Drone) | 2024-01-19 | **older; material stale** |
| [Death Note](https://idleon.wiki/wiki/Death_Note) | 2025-11-14 | |
| [Chest Space](https://idleon.wiki/wiki/Chest_Space), [Cost Cruncher](https://idleon.wiki/wiki/Cost_Cruncher), the 9 tower pages | 2023-11-21 | **materials stale** |
| the 9 shrine pages | 2026-10-05 | |
| [Changelog/2026](https://idleon.wiki/wiki/Changelog/2026) | — | to v1.22, 2026-09-19 |
| [Changelog/2025](https://idleon.wiki/wiki/Changelog/2025) | — | |
| [Tips and Tricks](https://idleon.wiki/wiki/Tips_and_Tricks) | 2025-12-24 | |

**Community (opinion, tier 3)**

- shnaps, [IdleOn progression gist](https://gist.github.com/shnaps/161a370ed795e6141e0553eb30ddc8fa), rev. 2026-09-18, self-declared "through v1.21". Used for the builder meta, atom priority and the build order. Its auto-refine claim is contradicted by the code.
- Reddit r/idleon through the Arctic Shift API:
  - ["Should the boost cogs around your DK's be construct xp or build rate?"](https://www.reddit.com/r/idleon/comments/1s9aqlh/should_the_boost_cogs_around_your_dks_be/) (2026-04-01)
  - ["How to unlock superb cogs?"](https://www.reddit.com/r/idleon/comments/1tpzotw/how_to_unlock_superb_cogs/) (2026-05-28)
  - ["Construction and Refinery?"](https://www.reddit.com/r/idleon/comments/1vq7e2t/construction_and_refinery/) (2026-08-16), which asks the auto-refine question; its comments were rate-limited and not read.

**Account State examples:** aggregate figures only, from the W3 fixture `fixtures/private/joseph.parsed.json` (not committed).
