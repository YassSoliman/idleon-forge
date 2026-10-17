# System Dossiers: Laboratory (W4), Divinity (W5 outline), and class-to-skill affinity

- **Verified:** 2026-10-17, game v1.23 "Lumi Menagerie" (2026-10-16/17).
- **Ticket:** [#25](https://github.com/YassSoliman/idleon-forge/issues/25), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Format: [SYSTEM-DOSSIER.md](../../SYSTEM-DOSSIER.md). Terms: [GLOSSARY.md](../../../../GLOSSARY.md).
- **Pinned sources:**
  - Toolbox [@ 6827d3f2](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2) (2026-10-17, gameVer 2.3.540, covers v1.23).
  - `N.js` (Last-Modified 2026-10-17, `Luminous_Menagerie_v1.23` @14132571). That note lists no Lab or Divinity change relevant to W1–W5. It mentions a W7 "New Coral Kid divinity upgrades" item and hold-to-use Divinity Pearls (H).
  - idleon.wiki [Laboratory](https://idleon.wiki/wiki/Laboratory) (rev 2026-10-07) and [Divinity](https://idleon.wiki/wiki/Divinity) (rev 2026-10-15). Both are bot-data pages and **both predate v1.23**.

---

## Laboratory

- **What it is:**
  - A W4 town skill. A character AFK-ing on the **Laboratory** target is "uploaded" to the Mainframe.
  - Uploaded characters are light-beam nodes. They chain from the prism to each other within their **Line Width**, and they switch on a bonus node or jewel within its **connection range** (90 px base).
  - A character's Lab level also opens **chip** slots, whose bonuses work even when that character is not uploaded.
  - Bubonic Conjuror's specialty; Lab efficiency is WIS-based ([wiki Laboratory](https://idleon.wiki/wiki/Laboratory); [`parsers/world-4/lab.ts` `getLabEfficiencyParts` L413](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-4/lab.ts#L413)). (H)
- **Unlocks:** the Mainframe in W4 town, right of the portal (wiki). The chip and jewel shops depend on W4 shop buys (shadowstorm W4: "buying Pile of Processors chips (need 3), Strung Jewels everyday (need 7)… so you can unlock Chip Repository, Jewel Shop" (L)). (H for the location, L for the shop route)
- **Scope:** both.
  - **Per character:** Lab level and EXP, line width, chips.
  - **Account-wide:** which nodes and jewels are lit, the chip repository and the jewel rotation.
  - **In the tube** means `AFKtarget === 'Laboratory'`, **or** linked to the W5 god Arctis ([`lab.ts` L92](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-4/lab.ts#L92)). (H)
- **Inputs → outputs:**
  - AFK time in the Lab gives Lab EXP. The LABORATORY branch of `getAfkGain` ([`character.ts` L3545](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3545)) uses the skill AFK pool. **All Skill EXP% bonuses do not affect the Lab**; All Skill AFK% and Efficiency% do (wiki).
  - **Line Width** = `floor((50 + 2·LabLv) × (1.25 inside Sapphire Rhombol's 150 px) + meal px + min(cards, 50)) × (1 + Purple Tube, meal %, Conductive Motherboard chip, 20 × the arena wave-150 bonus, shiny Mallay, +30 if "souped") / 100` ([`getPlayerLineWidth` L320-351](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-4/lab.ts#L320-L351)).
  - **Lab level is what lets the chain reach farther nodes.** (H)

**Chip slots by Lab level** (Toolbox [`components/account/Worlds/World4/Chips.jsx` L8](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/components/account/Worlds/World4/Chips.jsx#L8)): **5, 10, 15, 25, 35, 50, 75** (7 slots). (H)

**Mainframe nodes** (game data [`shared-data.json` `labBonuses` L18020](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L18020); x = horizontal position on the board, a proxy for how far the chain must reach):

| Node | x | Effect (summary) | Feeds System |
|---|---|---|---|
| Animal Farm | 91 | +1% total damage per species bred | Breeding → damage |
| Wired In | 250 | Uploaded players print 2× at the 3D Printer | 3D Printer |
| Gilded Cyclical Tubing | 356 | Refinery cycles 3× faster | Refinery |
| Sigils of Olden Alchemy | 400 | Lets players in alchemy level Sigils | Alchemy Sigils |
| No Bubble Left Behind | 450 | Lowest 3 bubbles (Lv ≥ 5, first 15 per colour) +1 Lv per day | Alchemy Bubbles |
| Killer's Brightside | 538 | Kills count 2× for portals and Death Note | Portals, Death Note |
| Shrine World Tour | 651 | A shrine placed in town acts in every map of that world | Shrines |
| Viaduct of the Gods | 753 | Liquids ×5 capacity, −30% regen | Alchemy Liquids |
| Certified Stamp Book | 824 | All non-MISC stamps give 2× | Stamps |
| Spelunker Obol | 945 | Jewels 1.5× | Lab jewels |
| Fungi Finger Pocketer | 990 | +2% cash per 1M Green Mushroom kills | Coins |
| My 1st Chemistry Set | 1177 | All vials 2× | Alchemy Vials |
| Unadulterated Banking Fury | 1300 | +2% damage per green stack (≥ 10M) in storage | Storage → damage |
| Viral Connection | 1430 | All nodes and jewels +50% connection range | Lab |
| Artifact Attraction / Slab Sovereignty / Spiritual Growth / Depot Studies PhD | 1530–1950 | W5–W6 systems | Sailing, Slab, W6 skills, Farming |

**Chips** (game data `chips` [L3562](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L3562)). These are where **skill outputs from W1–W4 get spent in bulk**:

| Chip | Bonus | Cost (skill output · meal · spice) |
|---|---|---|
| Grounded Nanochip | +% total defence | Copper Ore 20K · Turkey of Thank 100 · Grasslands 100 |
| Grounded Motherboard | +% move speed (under 170%) | Oak Logs 30K · Egg · Grasslands |
| Grounded Software | +% accuracy | Goldfish 20K · Pie · Jungle |
| Grounded Processor | +% drop rate (under 5×) | Pocket Sand 10K · Frenk Fries · Jungle |
| Potato Chip | +% basic attack speed (1 per player) | Fly 20K · Corn · Encroaching Forest |
| Conductive Nanochip | +% Lab EXP | Veiny Logs 100K · Pizza · Tree Interior |
| Conductive Motherboard | +% line width | Gold Ore 100K · Corndog · Stinky Sewers |
| Conductive Software | +% fighting AFK gains (1 per player) | Crabbo 10K · Dango · Stinky Sewers |
| Conductive Processor | +% skilling AFK gains (1 per player) | Mosquisnow 100K · Croissant · Desert Oasis |
| Chocolatey Chip | crystal-mob chain chance (1 per player) | Pinion Spur 200K · Cheese · Beach Docks |
| Galvanic Nanochip / Motherboard / Software / Processor | respawn / +% all skill efficiency / +% damage / +base efficiency all skills | Sippy Straw 100K · Skelefish 250K · Dementia Ore 300K · Wurm Tail 100K, plus meals and spices |
| Wood Chip | +% multikill per tier | Cubed Logs 250K · Leek · Tundra Outback |
| Silkrode Nanochip / Motherboard / Software / Processor | doubles star signs / trophy / keychain / pendant MISC | Lugi Bracket, Squishy Soul, Fairy, Blobfish 2M each |
| Poker Chip, Omega Nanochip / Motherboard | weapon power; double the top-left / bottom-right card | PVC Pipe 2M; Fairy 10M; Kraken 10M |

- **Goals and Milestones:**

| Milestone | Reward | Source |
|---|---|---|
| Lab Lv 5 / 10 / 15 / 25 / 35 / 50 / 75 | Chip slot 1–7 | Chips.jsx L8 |
| Each Lab Lv | +2 px base line width | `getPlayerLineWidth` |
| Reach each node (table above) | That node's bonus | `labBonuses` |
| Total Lab Lv 700 / 1400 / 2100 | Free "Laboratory Bling" jewels (otherwise a W6 Jade Emporium buy) | wiki Laboratory jewel notes |
| Arena wave 150 (Breeding) | +20% line width for all players | Breeding dossier |
| Total Lab Lv 400 / 1000 | Rift Skill Mastery +10% / +25% all skill EXP | wiki |

- **Feeds / fed by:**
  - **Feeds:** see the node table (Refinery, Printer, Stamps, Vials, Bubbles, Sigils, Death Note, Shrines, damage).
  - **Consumes** large stacks of W1–W4 skill outputs through chips: Copper, Gold and Dementia ore; Oak, Veiny and Cubed logs; Goldfish, Skelefish; Fly, Mosquisnow, Fairy; Crabbo, Blobfish; Squishy Soul. It also consumes meals and spices.
  - **Fed by:** Bubonic Conjuror talents Purple Tube (line width to the right), Green Tube (Lab EXP to the left), Essence Transferral, Upload Squared, Wired In Power ([talents.json Bubonic_Conjuror](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json)); the Bloat Draft vial (Blobfish critter); Pretzel meal; Purple Rhombol jewel; shiny Mallay; Breeding arena; the Conductive chips.
- **Per-session actions:**
  - Check the chain is intact. Moving a character out of the Lab (by changing its AFK target) can break the chain for everyone downstream.
  - Buy chips and jewels when they rotate in. Toolbox alerts: `laboratory.chipsRotation` and `laboratory.jewelsRotation` ([`account.js` L949-1101](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/utility/dashboard/account.js#L949-L1101)).
  - Slot newly opened chip slots. (H)
- **AFK Setup implications:**
  - In W4 the Lab competes for every character's single AFK target.
  - Community W4 practice: "Throw everyone in lab and push your characters one by one", and "make sure every other character is afk in lab connected to Killer's Brightside" while one character pushes (shadowstorm W4 (L)).
  - For ActiveOn, the Lab is the default AFK target for any W4 character that is not the active pusher and not on a better skilling Goal.
  - Its Leverage comes from account-wide nodes (2× stamps, 2× vials, 3× refinery, 2× kills), not from that character's own gains.
  - **Moving one character out can switch off a node for the whole account**, so a Higher-leverage suggestion must check the chain.
- **Min-max by stage:**
  - **W4 entry:** upload all spare characters. Reach Killer's Brightside, Certified Stamp Book and My 1st Chemistry Set first: they double big W1–W3 systems. Buy W4 shop processors and Strung Jewels daily.
  - **Mid W4:** Lab levels on the characters at the end of the chain. Conductive Motherboard chips for line width. Viral Connection.
  - **Late W4 → W5:** link lab characters to Arctis, which keeps them "in the tube" while doing something else (no Lab EXP). See Divinity.
  - **Per class:** Bubonic Conjuror (Shaman line). Purple Tube and Green Tube depend on the Bubo's position in the chain: put the Bubo at the **left** end so Purple Tube widens everyone to its right (M: talent text; position effects not tested).
- **Common mistakes:**
  - (1) Leaving W4 characters fighting low-value maps instead of holding Lab nodes.
  - (2) A broken chain after pulling one character out.
  - (3) Empty chip slots at Lab Lv 5+.
  - (4) Not buying daily W4 shop jewel and processor items.
  - Detect them from `account.lab.{playersCords, playersChips, connectedPlayers, labBonuses[].active, jewels[].active}`.
- **Save and Toolbox fields:**
  - `account.lab.{playersCords[] {x,y,playerId,lineWidth,soupedUp}, playersChips[][], connectedPlayers, jewels[], chips[], labBonuses[], totalRawChips, currentRotation}`.
  - `characters[].afkTarget === 'Laboratory'`.
  - `characters[].skillsInfo.laboratory`.
  - Toolbox-computed: `getLab` (which nodes and jewels are connected), `getPlayerLineWidth`, `getLabEfficiency`. (H)

---

## Divinity (W5 outline)

- **What it is:** a W5 AFK skill. Characters meditate at the Altar in Magma Rivertown (AFK target `Divinity`) for Divinity EXP and account-wide **Divinity Points**. Points are spent on offerings to unlock 10 **gods**. Each character can **link** to one god for its Major and Minor bonus, and every god's **Blessing** is always active. Elemental Sorcerer's specialty ([wiki Divinity](https://idleon.wiki/wiki/Divinity), rev 2026-10-15). (H)
- **Unlocks:** W5 town. Out of W1–W4 scope except as preparation.
- **Scope:** both. Points, gods and blessings are account-wide. Divinity level, style and link are per character. Characters can unlink **twice per week**, plus a free re-link whenever a new god is unlocked (wiki "The Rewards"). (H)
- **Inputs → outputs:** AFK time at the altar gives Divinity points and EXP per **style**. In Toolbox, the DIVINITY AFK branch is a flat 1× rate ([`character.ts` L3562](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts#L3562)).

**Styles** (game data `divStyles` [L6588](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L6588); level requirements from the wiki):

| Style | Divinity Lv | Per hour |
|---|---|---|
| Kinesis | 0 | 1 Div, 1 EXP |
| Chakra | 5 | 2 Div, 2 EXP |
| Focus | 10 | 4 Div, 1 EXP |
| Mantra | 15 | 1 EXP to **all** characters |
| Vitalic | 25 | 2 Div, 7 EXP |
| TranQi | 40 | 3 EXP **even when not meditating** |
| Zen | 60 | 8 Div, 8 EXP |
| Mindful | 80 | 15 Div, 10 EXP |

**Gods that change W1–W4 AFK Setups** (game data `gods` [L11388](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json#L11388)):

| God (unlock order) | Major link bonus | Why a W4 player cares |
|---|---|---|
| Snehebatu (1st) | +30% AFK gains for all activities | Every AFK character should link here at first (2023 Guide Sheet Divinity tab (L), **Stale** but consistent with the data) |
| Arctis (2nd) | "This character is always active within the Lab Mainframe", but no Lab EXP | Frees Lab characters to fight or skill while keeping the chain. Toolbox `isInTube` honours it. The 2023 guide says to unlock it "ASAP" (L) |
| Goharut | Being connected to the Lab also counts as being at the Divinity Altar | A Lab character earns Divinity too |
| Harriep | This character prints 3× at the 3D Printer (stacks with Wired In) | Printer sampling |
| Omniphau | Non-candy AFK claims also progress Refinery, 3D Printer, Cooking and more by the AFK time | Long AFK Stretches |
| Nobisect | Kills count 2× for portals and Death Note | Same as Killer's Brightside |
| Purrmep / Flutterbis / Kattlekruk / Bagur | 2× Divinity (1 player) / Divinity Pearl skill EXP / daily bubble levels (1 player) / not yet active | Later |

- **Goals and Milestones:** style unlocks at Divinity Lv 5/10/15/25/40/60/80 (table); each god unlocked; then God Ranks (+10% Divinity gain per rank) once all are unlocked (wiki "The Process").
- **Feeds / fed by:**
  - **Feeds:** AFK gains (Snehebatu, Goharut minor), the Lab (Arctis, Goharut), 3D Printer (Harriep), the Refinery, Printer and Cooking via Omniphau, Alchemy Bubbles (Kattlekruk), Skill EXP (Flutterbis minor and Pearls).
  - **Fed by:** Elemental Sorcerer talents Shared Beliefs (+Divinity EXP for all, multiplicative) and Polytheism (a second god) ([talents.json Elemental_Sorcerer](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json)).
- **Per-session actions:** spend Divinity Points on offerings; level blessings. Toolbox's `getDivinityAlert` ([`characters.js` L272](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/utility/dashboard/characters.js#L272)) flags two style mistakes:
  - meditating at Lv ≥ 80 without Mindful;
  - not meditating at Lv ≥ 40 without TranQi.
- **AFK Setup implications** for a W4 → W5 transition:
  - Lab characters move to the altar first ("Once W5 is unlocked, move all your lab characters to meditate", 2023 Guide Sheet (L), **Stale**).
  - Unlock Arctis, then link the old Lab characters to Arctis so the Mainframe stays lit while they do other things.
  - At Divinity Lv 40, TranQi gives EXP without meditating.
- **Min-max by stage (W4 preparation):** Lab levels and chain layout carry straight over (Arctis and Goharut keep them useful). An Elemental Sorcerer (Wizard line) is the Divinity class.
- **Common mistakes:** staying on Kinesis or Focus after unlocking better styles, and forgetting a weekly unlink when a better god opens (wiki; Toolbox divinity alert).
- **Save and Toolbox fields:**
  - `account.divinity.{linkedDeities, linkedStyles, deities, blessingLevels, unlockedDeities, godRank, divinityPoints, unlocked}`.
  - `characters[].linkedDeity` (−1 = none).
  - `characters[].divStyle {name, divPerHour}`.
  - `characters[].skillsInfo.divinity`.
  - Toolbox: [`parsers/world-5/divinity.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-5/divinity.ts) (`isMajorDivinityActive` L304, `isMeditatingOnClaim` L338). (H)

---

## Class-to-skill affinity (all W1–W5 skills)

The wiki's [Skills](https://idleon.wiki/wiki/Skills) page (rev 2025-06-29, **Stale** by date, but this mapping has not changed) names one specialist per skill. Each line below is cross-checked against the skill-specific talents in Toolbox [`talents.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json) (searched 2026-10-17). A subclass and elite class also hold their parents' talent tabs, so the line inherits the specialty.

| Skill | Specialist class (wiki) | Line that inherits it | Skill talents found in talents.json (class) |
|---|---|---|---|
| Mining | Warrior | Barbarian, Squire, BB, DK, DB, RG | Warrior-tab Mining talents (see the Mining dossier) |
| Smithing | Archer | Bowman, Hunter, SB, BM, WW | Acme Anvil, Focused Soul, Godly Creation, Smeltin' Erryday (Archer line) |
| Choppin | Mage | Wizard, Shaman, ES, BC, AC | Log On Logs, Leaf Thief, Deforesting All Doubt, Choppin It Up Ez (Mage) |
| Fishing | Barbarian | Blood Berserker, Death Bringer | Worming Undercover, Bobbin' Bobbers, All Fish Diet, Catching Some Zzz's (Barbarian) |
| Alchemy | Shaman | Bubonic Conjuror, Arcane Cultist | Busy Brewin', Bubble Breakthrough, Sharing Some Smarts, Cranium Cooking, Stupendous Statues (Shaman) |
| Catching | Bowman | Siege Breaker | Teleki'net'ic Logs, Briar Patch Runner, Bug Enthusiast, Sunset on the Hives (Bowman). **Not Hunter.** |
| Trapping | Hunter | Beast Master | Eagle Eye, Invasive Species, Shroom Bait, Reflective Eyesight (Hunter) |
| Construction | Squire | Divine Knight, Royal Guardian | Redox Rates, Sharper Saws, Refinery Throttle, Super Samples (Squire) |
| Worship | Wizard | Elemental Sorcerer | Charge Syphon, Sooouls, Bless Up, Nearby Outlet (Wizard) |
| Cooking | Blood Berserker | Death Bringer | Tough Steaks, Taste Test, Apocalypse Chow, Waiting To Cool, Overflowing Ladle (BB) |
| Breeding | Beast Master | Wind Walker | I Dream Of Peace And Egg, Shining Beacon Of Egg, Curviture Of The Paw (BM) |
| Laboratory | Bubonic Conjuror | Arcane Cultist | Wired In Power, Purple Tube, Green Tube, Essence Transferral, Upload Squared (BC) |
| Divinity | Elemental Sorcerer | (Spiritual Monk, listed in game data but `released: false`) | Believer Strength, Polytheism, Shared Beliefs, God's Chosen Children (ES) |
| (all skills) | Journeyman / Maestro / Voidwalker | n/a | Maestro: Right Hand of Action, Left Hand of Learning (+efficiency and EXP for other characters with a lower skill Lv), Printer Go Brrr. Voidwalker: Species Epoch (critters and souls), Blood Marrow (meals) |

- **Maestro hands caveat:** a 2023 guide note says the Maestro Left/Right Hand talents "[do] not work for skills past W3" (IdleOn Guide Sheet, Divinity tab, 2023-07-25, **Stale**, not verified in code). Check `getTalentBonus(..., 'RIGHT_HAND_OF_ACTION')` call sites before relying on it.
- **Master-class inheritance** follows [classPromotions.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/classPromotions.json) (DB from BB, WW from BM, AC from BC, RG from DK; unreleased Spiritual Monk from ES and Infinilyte from Voidwalker). These are W6+ classes.

## Sources

- Toolbox @ [6827d3f2](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2):
  - [`parsers/world-4/lab.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-4/lab.ts), [`parsers/world-5/divinity.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/world-5/divinity.ts), [`parsers/character.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/parsers/character.ts) (L3545, L3562)
  - [`components/account/Worlds/World4/Chips.jsx`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/components/account/Worlds/World4/Chips.jsx), [`utility/dashboard/characters.js`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/utility/dashboard/characters.js), [`utility/dashboard/account.js`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/utility/dashboard/account.js)
  - [`data/website-data/shared-data.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/shared-data.json) (`labBonuses`, `chips`, `jewels`, `gods`, `divStyles`), [`talents.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/talents.json), [`classPromotions.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2/data/website-data/classPromotions.json)
- [N.js](https://www.legendsofidleon.com/ytGl5oc/N.js), Last-Modified 2026-10-17, `Luminous_Menagerie_v1.23` @14132571.
- idleon.wiki: [Laboratory](https://idleon.wiki/wiki/Laboratory) (2026-10-07), [Divinity](https://idleon.wiki/wiki/Divinity) (2026-10-15), [Skills](https://idleon.wiki/wiki/Skills) (2025-06-29). All pre-v1.23.
- Community (tier 3):
  - shadowstorm2204 "Idleon Complete Guide Sheet" [W4 tab](https://docs.google.com/spreadsheets/d/13izR4-8rod7O2wo-ecXZ2_R_01jyIc4GsQwODxaBEFs/htmlview) (pre-Royal Guardian, **Stale**).
  - "IdleOn Guide Sheet" [Divinity tab](https://docs.google.com/spreadsheets/d/e/2PACX-1vSCepYAs6sNDP4iq6MJNAG1pvFXzfC_3IQ7ttt5vfEEKAgQhIk4cQqnLRyeH6UyqDSuP4R-6WQeDmmP/pubhtml) (2023-07-25, **Stale**).
- Reddit not read (Arctic Shift rate-limited 2026-10-17). There are relevant threads, e.g. "Divinity vs Lab" (2026-09-01, id 1w4r1ow).
