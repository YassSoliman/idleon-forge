# System Dossiers: character builds (2026-10-17)

Ticket: [#18](https://github.com/YassSoliman/idleon-forge/issues/18), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Format: [`SYSTEM-DOSSIER.md`](../SYSTEM-DOSSIER.md). Terms: [`GLOSSARY.md`](../../../GLOSSARY.md).

Systems covered, one section each: **Talents** (tabs, points, max levels, the attack bar), **Talent presets**, **Stat talents**, **Talent resets and class swaps**, **Star talents**, **Star signs**, **Equipment and tools**, **Food and potions**. Then two cross-System sections the ticket asks for: **Build orders per class and per preset**, and **Preset drift detection**.

**Sources and patch.** Current patch is game v1.23 (Luminous Menagerie, 2026-10-16/17).

- **Game client `N.js`** (tier 1): `https://www.legendsofidleon.com/ytGl5oc/N.js`, Last-Modified 2026-10-17 01:42:35 GMT, 26,391,628 bytes, newest patch note `Luminous_Menagerie_v1.23`. Same file and method as the [mechanics research](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md). Cited as `symbol @offset`. Offsets move every patch; symbol names do not.
- **IdleOn Toolbox** (tier 1, game data plus parsers): [Morta1/IdleonToolbox @ 6827d3f](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1) (2026-10-17 19:14 +0300, patch notes through 2.3.540). Links below are relative to that commit and abbreviated `TB:path#Lx`.
- **Toolbox community builds API** (tier 3): `https://builds.idleontoolbox.workers.dev/api/builds` (public reads, URL from Toolbox `.env.production`). Each build has a creation and an update date; I record both.
- **idleon.wiki** (tier 2): each page's last-edit timestamp from the MediaWiki API, read 2026-10-17. Many pages are bot-generated from game data.
- **Community sheet** (tier 3, stale): Fibster/Tetsu "Talents guide", last changelog entry 2024-07-12.
- **Reddit:** the Arctic Shift API returned HTTP 429 for the whole session, so there is **no Reddit pass** in this dossier. A human or a later agent should do one (see the open questions at the end).
- **Saves:** I read Yasser's (World 2, 5 characters) and Joseph's (World 3, 6 characters) parsed fixtures for field names and aggregate checks only. Nothing from them is quoted.

Confidence labels: **H** means read directly in code or data. **M** means my reading of minified code or a single tier-3 source. **L** means inference.

## Answer

- **Points.** Talent points are per character and per tab. Every class level gives +3 points to each unlocked tab: tab 1 from Lv 1, tab 2 after Lv 6, tab 3 after Lv 29, tab 4 after Lv 89. Skill levels add more: +1 per skill level to tab 1, +1 per 2 skill levels to tabs 2–3, +1 per 5 to tab 4. Most talents cap at Lv 100 until the W3 Talent Book Library raises the cap. Most passives follow `x1·L/(L+x2)`, so the first `x2` levels buy half the cap. (H, `_customBlock_TotalTalentPoints`; this corrects the wiki's "tab 4 above Lv 50")
- **Presets.** Each character has **2 talent presets**. A preset is a complete talent allocation plus its own attack bar, star talents included, and each one spends the **full** point budget on its own. Swapping is free, unlimited and instant. The click handler opens it from class Lv 15, and it works on any map below class Lv 10,000, so the "Must be in Town" text never applies in practice. Card presets are a separate System. (H)
- **Use them as a pair:** preset A for fighting and preset B for the character's Skilling job. Before leaving, put the character on the preset that matches its AFK activity. **5 of the 11 characters in our two saves have a completely empty second preset.** 2 of the 11 are AFK on the wrong preset: a fighter left on its skilling preset, and a fisher left on its fighting preset. (H on the fixtures)
- **Stat talents.** There are no free stat points. The four tab-1 stat talents (Fist of Rage, Quickness Boots, Book of the Wise, Lucky Clover) are the only manual stat lever. Put points into your **main stat**, and into the **accuracy stat** only until you hit 100%. Accuracy comes from WIS for Warriors, STR for Archers, AGI for Mages and LUK for Beginners. You reach a 100% hit chance on monsters at accuracy = 1.5 × the monster's Defence. Squire's Precision Power needs 2.25 × Defence. (H, Toolbox `getAccuracy`, `hit-chance.mjs`)
- **Resets.** A **Talent Point Reset Potion** refunds all non-star talents, on the **active preset only**. You get 9 from W1–W3 quests, or buy them at 200 gems (10 per week). 10 Fragments make 1 potion. The **Sub Class Swap Token** (gem shop, 500 gems, +250 per purchase, 2 in stock, restocks each major update) swaps a subclass within its class, for example Squire to Barbarian. It wipes both presets and both attack bars. It is the cheapest fix for an account with two of one subclass. The Upgrade Vault's **Slight Do-Over** (unlocks at 2,400 total vault levels) refunds one talent per level per day. (H)
- **The biggest damage gap is outside talents.** Both saves have **0–1 of 49 constellations** done and only the 4 starter star signs. So **no character has a second star-sign slot**. Doing constellation A-2 (AFK 1 h on "Where the Branches End", which is also the Telescope quest) gives 3 points. That is exactly the cost of **Chronus Cosmos**, which gives 2 star-sign slots to every character. (H on data, H on the fixtures)
- **Gear and tools are badly behind.** Characters at Lv 43–85 wear armor with level requirements of 8–40, and 6 of 11 have 2–5 empty armor slots. 6 of 11 characters have **no tools equipped**. Tools add their STR/AGI/WIS/LUK to combat stats, so all tool slots should always be filled. Armor and tool tiers go Copper (Lv 3–8), Iron (8–15), Gold (15–35), Platinum (20–55), Dementia (25–70), Void (30–90), then Chizoar (W3, up to Lv 110). (H)
- **Food.** **Golden foods are never consumed**, and their bonus grows with the log of the stack size. Boost foods (potions) are consumed by chance. The fighting check before leaving is: at least one health food, plus damage and HP potions. Most characters in our saves carry 0–2 foods. (H)
- **The best current per-preset build orders** are Sir_Grimtide's guides in the Toolbox community builds (created 2026-06, edited 2026-10-10 to 10-15, most liked). They exist for Barbarian, Squire, Bowman, Shaman and Wizard. The common core is: tab 1 Gilded Sword → Sharpened Axe → 50 in the AFK-fighting talent; 1 or 25 points in each attack (25 for AFK). Older "Community Guide" builds are tagged game v1.23/1.40b, which means 2021–22. Treat those as **Stale**. (tier 3)
- **For ActiveOn:** classify each preset as fighting or skilling from where its points sit. Then flag four Fix-before-you-leave cases: the active preset doesn't match the AFK activity; the other preset is empty; an AFK-fighting talent is at 0 on a fighting preset; attacks are missing from the attack bar. Every rule reads `characters[].{selectedTalentPreset, talents, talentPreset, talentsLoadout, afkType}`.

## Talents

- **What it is:** each character's skill tree. Up to four class tabs, plus Star tabs. Points bought here are the main lever on damage, AFK rates and skill efficiency.
- **Unlocks:** tab 1 at character creation (Beginner, or "Rage/Calm/Savvy Basics" after class choice). Tab 2 with the first class (Promotheus, class Lv 10). Tab 3 with the subclass (Speccius, W2). Tab 4 with the elite class (Eliteus, **W4**, so outside W1–W3). Gates are from the [mechanics research](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md#3-subclass-and-elite-class-gates). Points start flowing to a tab only after its class level offset (below). (H)
- **Scope:** per character. Max levels (`SkillLevelsMAX`) are per character but shared by both presets. Library books raise them. (H)
- **Inputs → outputs:** class levels, skill levels and talent-point bonuses go in. Bonuses come out, per the growth formulas below.

**Points per tab** (`_customBlock_TotalTalentPoints @4370453`, H):

| Tab | From class levels | From skill levels (the 9 W1–W3 skills, `Lv0[1..9]`) | Main extra sources |
|---|---|---|---|
| 1 (Basics) | 3 × (Lv − 1) | +1 per skill level (sum of skills − 3) | Talent-point currency items, star sign **The Fuzzy Dice (+3)**, Talent I stamp, vials (Tab1Pts), achievements, arcade, Flurbo shop, Upgrade Vault "Natural Talent" (+1/lv) |
| 2 (class) | 3 × (Lv − 6) | +1 per 2 skill levels (floor each) | **Back To Basics / Previous Points / Earlier Education** (tab 3 talents: +1 tab-2 point per level), Talent II stamp, vault "Evolving Talent" |
| 3 (subclass) | 3 × (Lv − 29) | same as tab 2 | Talent III stamp, vault "Stunning Talent", achievements |
| 4 (elite, W4) | 3 × min(Lv − 89, 100) + 2 × (Lv − 189) past 189 | +1 per 5 skill levels | Talent IV stamp, tasks |
| Star | Lv − 1 | +1 per skill level | Star Player (tab 1), Stonks! (star), Star Talent stamp, cards. See Star talents |

- The wiki's [Category:Talent Points](https://idleon.wiki/wiki/Category:Talent_Points) (edited 2025-04-17) says tab 4 counts "only class levels above 50". The code says above 89. **The code wins** (ADR 0004).
- **Class bubbles add points to every tab:** `AlchBubbles.TalWarrior/TalArchers/TalWiz` is added to the bonus of all four tabs (H). See the Alchemy Bubbles System.

**Max level.** The default is 100 for almost every talent (`SM_` in the save). Exceptions, from the start of `TotalTalentPoints` (H):

| Talent (tab 1) | Max level | Raised by |
|---|---|---|
| Fist of Rage | 100 + Str Summore + tab-4 talent 143 + bonus | Barbarian/Squire "Str Summore" |
| Quickness Boots | 100 + Agi Again + … | Bowman/Hunter "Agi Again" |
| Book of the Wise | 100 + Wis Wumbo + … | Wizard/Shaman "Wis Wumbo" |
| CritiKill / Meat Shank (Warrior) | 100 + min(Beefy/Blocky Bottles, Warrior cauldron bubble level) | Barbarian "Beefy Bottles", Squire "Blocky Bottles" |
| Featherweight / I See You (Archer) | 100 + min(Velocity/Visibility Vessels, Archer cauldron) | Bowman, Hunter |
| Overclocked Energy / Farsight (Mage) | 100 + min(Fuscia/Fantasia Flasks, Mage cauldron) | Wizard, Shaman |
| Everything else | 100, until the **Talent Book Library** (W3 Construction) gives books of Lv 101–125 at first | W3 |

These "bottle/vessel/flask" talents are only worth points once the matching class bubble is levelled past 100, because the raise is capped by the bubble level (H). The Library cannot raise the stat talents or the bottle-linked talents. The game excludes indices `[10,11,12,23,75,79,86,87,266,267,446,447]` (TB:[parsers/talents.ts L448-449](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/talents.ts#L448-L449); wiki [Talent Book Library](https://idleon.wiki/wiki/Talent_Book_Library), edited 2026-10-12).

**Growth formulas** (TB:[utility/wiki/growth.mjs L9-60](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/wiki/growth.mjs#L9-L60), H). Each talent has `x1, x2, funcX` in `talents.json`.

| funcX | Value at level L | What it means for points |
|---|---|---|
| `decay` | x1·L/(L+x2) | Approaches x1. Half of it at L = x2, two-thirds at 2·x2. **Most passives.** |
| `add` (x2 = 0) | x1·L | Linear, never saturates (Gilded Sword 1.5%/lv, Sharpened Axe 0.4/lv) |
| `add` (x2 ≠ 0) | quadratic | Superlinear (Health Booster, Brute/Elusive/Smart Efficiency) |
| `bigBase` | x1 + x2·L | Attack talents. Damage % grows linearly |
| `intervalAdd` | x1 + floor(L/x2) | Breakpoints only (Apocalypse ZOW +1% per 33 levels, Refinery Throttle every 8) |

Values of key talents at Lv 10/25/50/100/150, computed from the data above (H):

| Talent | 10 | 25 | 50 | 100 | 150 | Cap |
|---|---|---|---|---|---|---|
| Idle Brawling / Idle Shooting / Idle Casting (% AFK fight gains) | 3.3 | 6.7 | 10.0 | 13.3 | 15.0 | 20 |
| Idle Skilling / Active AFK'er (% AFK skill gains) | 4.0 | 7.7 | 11.1 | 14.3 | 15.8 | 20 |
| Sleepin' On The Job (Beginner) | 3.5 | 7.0 | 10.5 | 14.0 | 15.8 | 21 |
| Gilded Sword (% damage) | 15 | 37.5 | 75 | 150 | 225 | none |
| Sharpened Axe (base weapon power) | 4 | 10 | 20 | 40 | 60 | none |
| Meat Shank (% dmg per power of 10 HP) | 11.1 | 23.8 | 38.5 | 55.6 | 65.2 | 100 |
| Overclocked Energy (% dmg per power of 10 MP) | 16.7 | 35.7 | 57.7 | 83.3 | 97.8 | 150 |
| Speedna (% dmg per 15% move speed over 100%) | 6.4 | 13.2 | 20.5 | 28.1 | 32.1 | 45 |
| Double Strike (% double-hit) | 18.3 | 36.7 | 55.0 | 73.3 | 82.5 | 110 |
| Have Another! (% extra arrow) | 24.0 | 46.2 | 66.7 | 85.7 | 94.7 | 120 |
| Paperwork, Great… (% dmg per 10 stamps) | 6.4 | 14.0 | 23.3 | 35.0 | 42.0 | 70 |
| Virile Vials (% dmg per green vial) | 1.1 | 2.4 | 4.0 | 6.0 | 7.2 | 12 |
| Precision Power (% dmg per refinery rank) | 1.2 | 2.6 | 4.2 | 6.1 | 7.2 | 11 |
| Veins of the Infernal (% dmg per 10 Smithing Lv, capped at Lv 100) | 5.8 | 11.7 | 17.5 | 23.3 | 26.2 | 35 |
| Brute/Elusive/Smart Efficiency (% skill efficiency) | 11.1 | 31.5 | 75.5 | 201 | 376.5 | none |
| Haungry for Gold (% golden food) | 6.1 | 13.1 | 21.2 | 30.6 | 35.9 | 55 |

- **The attack bar (`AttackLoadout`).** Attack talents add to AFK fighting **only while on the bar**. Each one multiplies AFK damage by `D × (1 + L/(L+100))`, so Lv 25 gives +20% of its max and Lv 100 gives +50%. The kill-rate factor `K` is clamped to [1, 2.2]. AFK attack multipliers from the star talent Attacks on Simmer and the All For Kill bubble are each capped at +25%. Double Strike, Have Another! and Have Another… Again! add directly (TB:[parsers/damage.ts L1288-1308](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/damage.ts#L1288-L1308), game `_customBlock_afkAttackBonses @4430036`, H). This is why AFK builds put 20–55 points in each attack and active builds put 1.
- **Goals and Milestones:**

| Milestone | Why it matters | Detect |
|---|---|---|
| Class Lv 10 | Tab 2 (first class) | `characters[].class` |
| Class Lv 15 | Talent presets usable | `characters[].level` |
| Subclass (W2) | Tab 3, points backdated: 3 × (Lv − 29) arrive at once | class index 8/9/20/21/32/33 |
| Idle fighting talent 50 | 10% of its 20% cap | flatTalents id 88/268/448 |
| Class bubble > 100 | Bottle/vessel/flask talents start to matter | Alchemy Bubbles System |
| Talent Book Library (W3) | Max level above 100 | `characters[].maxBookLv` |
| Apocalypse ZOW 33/66/99/132 | +1% dmg per 100k-kill monster each step | `characters[].zow` |

- **Feeds / fed by:** fed by class levels, skill levels, Stamps (Talent I–IV), Alchemy vials and class bubbles, Upgrade Vault, Achievements, the Talent Book Library, Arcade, Flurbo shop and Star signs (The Fuzzy Dice). It feeds damage, kills per hour, AFK gains, skill efficiency, the Anvil (Acme Anvil), the Forge (Smeltin' Erryday), Alchemy (Cranium Cooking, Busy Brewin', Bubble Breakthrough), Refinery (Refinery Throttle), Construction (Redox Rates, Sharper Saws), Worship (Charge Syphon, Nearby Outlet, Sooouls), Trapping (Eagle Eye) and the 3D Printer (Printer Sampling, Super Samples).
- **Per-session actions:** spend new points; points only rise. Check that the active preset matches the activity. Check that attack talents are on the bar for AFK fighting.
- **AFK Setup implications:** the AFK activity decides the preset (see Talent presets). Fighting needs the attacks on the bar plus the Idle fighting talent. Skilling needs the skill's tab-2 and tab-3 talents, and the skill attack (Big Pick, Log On Logs) on the bar where one exists.
- **Min-max by stage:** see Build orders.
- **Common mistakes** (each detectable):
  - Idle fighting talent at 0 on a fighting preset: 6 of the 8 characters AFK fighting in our saves (`flatTalents[88|268|448].baseLevel == 0` while `afkType == "FIGHTING"`).
  - Points spread across many `decay` talents above 2·x2 while linear Gilded Sword / Sharpened Axe sit below 50.
  - Points in bottle/vessel/flask talents before the class bubble passes 100.
  - Attacks levelled but not on the attack bar.
- **Save and Toolbox fields:**
  - `SL_<n>` → `characters[].talents` / `flatTalents`, with `baseLevel` = bought and `level` = with added levels.
  - `SM_<n>` → `maxLevel`.
  - `AttackLoadout` → `talentsLoadout`.
  - Spent points per tab = sum of `baseLevel` over `talents[tab].orderedTalents` (my arithmetic).
  - `account.talentPoints` (`CYTalentPoints`) is the item-granted bonus currency, not points left.
  - Toolbox does **not** compute points remaining per tab. ActiveOn would have to port `TotalTalentPoints`, which ADR 0005 forbids. So "unspent points" can only be **inferred** by comparing presets (see Preset drift detection) (H).
  - Damage, kills/hr, hit chance and accuracy come from `getMaxDamage` in TB:parsers/damage.ts (ADR 0005).
- **Sources:** N.js `_customBlock_TotalTalentPoints @4370453`, `_customBlock_afkAttackBonses @4430036`. TB:[data/website-data/talents.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/talents.json), [parsers/talents.ts](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/talents.ts), [parsers/character.ts L238-250](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/character.ts#L238-L250), [utility/wiki/growth.mjs](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/wiki/growth.mjs). Wiki [Classes](https://idleon.wiki/wiki/Classes) (2026-10-13), [Talent Book Library](https://idleon.wiki/wiki/Talent_Book_Library) (2026-10-12), [Upgrade Vault](https://idleon.wiki/wiki/Upgrade_Vault) (read 2026-10-17), [Category:Talent Points](https://idleon.wiki/wiki/Category:Talent_Points) (2025-04-17, **Stale** on tab 4).

## Talent presets

- **What it is:** two complete, swappable talent setups per character. Each holds the talent levels, star talents included, plus that preset's attack bar.
- **Unlocks:** every character from class **Lv 15**. The click handler requires `15 <= Lv0[0]` and `14 < Lv0[0]`. The "0"/"1" labels are drawn at Lv 30+ (M on the label reading) (`@7345400–7346900`, `@6862828`). They were added in game v0.23 ("Talent Presets are HERE! Swap between different talent loadouts with a single tap!", patch-notes table `@14407653`). (H)
- **Scope:** per character. Two presets, a fixed count; I found no purchase that adds more. The gem-shop "CARD_PRESETS" item is for **card** presets only (H).
- **Inputs → outputs:** nothing is consumed. Swapping copies the live `SkillLevels` and `AttackLoadout` into slot `PlayerStuff[1]`, sets `PlayerStuff[1] = b`, then loads slot `b`. Both presets draw on **the same point budget independently**: available points are recomputed as earned minus what the live preset spends (`TotalTalentPoints` subtracts `d`, the current spend). So each preset can spend every point (H).
- **Where it works:** the swap runs if `CurrentMap % 50 == 0` (a town) **or** class level < 10,000. In practice that is everywhere. The "Must be in Town to change Preset" text only shows in a branch W1–W3 players never reach. Swaps are blocked during the Wind Walker Compass Tempest, the Arcane Cultist Tesseract, and one class-29 challenge mode (W6+ only) (H for code, M for "never reached").
- **Goals and Milestones:**

| Milestone | Value |
|---|---|
| Lv 15 | Presets usable. Set up preset 2 right away |
| Subclass | Re-plan both presets: tab 3 adds the subclass's skill talents |
| Every new Purpose (new AFK skill) | The skilling preset follows the character's AFK skill |

- **Feeds / fed by:** fed by all of Talents. It feeds the AFK Setup directly: the preset decides AFK gains for the chosen activity. Star talents are per preset too. Card presets (Cards System) are separate and swap separately.
- **Per-session actions:** after changing a character's AFK activity, swap to the matching preset before leaving. Spend new points on **both** presets.
- **AFK Setup implications:** fighting AFK goes on the **fighting preset** (attacks on the bar, Idle fighting talent). Skilling AFK goes on the **skilling preset** (efficiency, Idle Skilling, the skill's tab-2/3 talents, the skill attack on the bar).
- **Min-max by stage:**
  - **Early (Lv 15–30):** preset 1 is fighting. Preset 2 is the class's Skilling job (Warrior mining, Archer catching or smithing, Mage choppin).
  - **Mid (subclass):** add the subclass Skilling job (Barbarian fishing, Squire refinery/construction, Bowman catching, Hunter trapping, Shaman alchemy, Wizard worship).
  - **Late:** the community "set it up on a new preset" trick. A preset stores levels above the current max, so a book-raised level is kept on one preset while the other is reallocated (tier 3, Fibster/Tetsu sheet; M).
- **Common mistakes:**
  - Second preset never set up. 5 of 11 characters in our two saves have `talentPreset` all zeros.
  - AFK on the wrong preset. 2 of 11.
  - Spending new points on only one preset, which leaves the other behind.
- **Save and Toolbox fields:**
  - `PlayerStuff_<n>[1]` → `characters[].selectedTalentPreset` (0 or 1).
  - The active preset → `characters[].talents`, `flatTalents`, `starTalents`, `talentsLoadout`.
  - The other preset → `characters[].talentPreset.{talents, flatTalents, addedLevels}`, from save keys `SLpre_<n>` (a sparse map) and `AttackLoadoutpre_<n>`.
  - Toolbox applies the other preset's added levels with `otherPresetIndex` (TB:[parsers/character.ts L407-418, L527-536](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/character.ts#L407-L418)). Note: Toolbox parses **no attack bar for the inactive preset**, and `AttackLoadoutpre_<n>` is unparsed (H). The raw value is still in the save if ActiveOn needs it.
- **Sources:** N.js preset swap `@7345726`, preset save `AttackLoadoutpre @6492696` / `"SLpre"+ @6493501`, load `@19896536`, UI `Must_be_in_Town @6863138`, V0.23 patch note `@14407653`. TB: as above. Tier 3: Toolbox community builds (below) all write DAMAGE PRESET / SKILLING PRESET.

## Stat talents

- **What it is:** Fist of Rage (+STR), Quickness Boots (+AGI), Book of the Wise (+WIS), Lucky Clover (+LUK). They sit on tab 1, give +1 base stat per level, and are linear. They are the only manual stat lever. There is **no free stat-point allocation** ([mechanics research §4](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md#4-manual-stat-allocation)). Each class tab adds a +1 base-stat talent of its own (Absolute Unit, Sanic Speed, Individual Insight) and an "equipment gives X% more" talent ('Str'ess Tested Garb and its siblings). (H)
- **Unlocks:** at character creation. The max goes past 100 through the tab-3 talents Str Summore, Agi Again and Wis Wumbo.
- **Scope:** per character, per preset.
- **Inputs → outputs:** tab-1 points in, stats out. Stats feed damage (main stat × Strength in Numbers / Knowledge is Power / Lucky Hit, plus the class stat bubble), accuracy (secondary stat), and the class's skill efficiency.

| Class line | Main stat (damage) | Accuracy stat | Source |
|---|---|---|---|
| Warrior, Barbarian, Squire | STR | WIS | TB:[parsers/talents.ts L84-111](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/talents.ts#L84-L111), [parsers/damage.ts L981-992](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/damage.ts#L981-L992) (game `_customBlock_PlayerAccTot @3806916`) |
| Archer, Bowman, Hunter | AGI | STR | same |
| Mage, Wizard, Shaman | WIS | AGI | same |
| Beginner, Journeyman | LUK | LUK | same |

- **Hit chance** (TB:[utility/hit-chance.mjs L17-23](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/hit-chance.mjs#L17-L23), game `HitChancePCT`, H):
  - Monsters: `floor(min(100·(0.95r − 0.425), 100))`, where r = accuracy / Defence. Below r = 0.5 there is no hit at all. **100% at r = 1.5.**
  - Resources (ores, trees, fish, bugs): 100% at r ≈ 1.98, starting at r = 0.25.
  - Squire's **Precision Power** only adds damage if accuracy ≥ 2.25 × Defence (TB:[parsers/damage.ts L702-706](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/damage.ts#L702-L706)).
- **Goals and Milestones:**

| Milestone | Rule |
|---|---|
| 100% hit on the AFK target | Raise the accuracy-stat talent only until `hitChance == 100` for `targetMonster` |
| Precision Power (Squire) | Accuracy ≥ 2.25 × Defence, otherwise its points are wasted |
| Stat talent max (100) | Only Str Summore / Agi Again / Wis Wumbo raise it |

- **Feeds / fed by:** feeds damage, accuracy, HP/MP and skill efficiency. Stats also come from equipment and tools, star signs, cards, obols, stamps, bubbles, family bonuses and golden food (Golden Grilled Cheese Nomwich, +all stats).
- **Per-session actions:** none, unless the AFK target changed. A tougher map can drop hit chance below 100%.
- **AFK Setup implications:** the farthest monster you can reach with 100% hit and no deaths is usually the best AFK fighting target. Two community builds updated 2026-09/10 say this (Squire AFK, Shaman AFK). (tier 3)
- **Min-max by stage:**
  - **Early:** leave stat talents alone. Gilded Sword and Sharpened Axe give more damage.
  - **Mid:** put just enough into the accuracy-stat talent to reach 100% hit on the AFK target. Then raise the main-stat talent, after the build's priority talents.
  - **Skilling preset:** the main-stat talent raises the class skill's efficiency (Fist of Rage on a mining Warrior, Quickness Boots on a catching Archer, Book of the Wise on a choppin Mage).
- **Common mistakes:**
  - Points in the accuracy stat past 100% hit.
  - Points in the wrong class's stat.
  - Believing old guides that mention "stat points".
  - Detect with Toolbox `hitChance` (100 with surplus) together with the level of the accuracy-stat talent (`flatTalents[10|11|12]`).
  - Caution: `characters[].stats` is the `PVStatList` **cache**, written only for the character that was played at the save. For other characters it can be stale. One fixture character's cached level trailed its real level by 16 (H on the fixture). Use Toolbox-computed values only for the logged-in character, or treat them as approximate.
- **Save and Toolbox fields:** `characters[].flatTalents` (skillIndex 10–13), `characters[].stats`, and Toolbox `getMaxDamage` → `playerInfo.accuracy`, `hitChance`.
- **Sources:** as cited. Tier 3, consistent: Fibster/Tetsu "Talents guide" (2024-07-12): "WIS gives accuracy for Warriors, only put as much as you need to reach 100% accuracy", with matching lines for Archer (STR) and Mage (AGI).

## Talent resets and class swaps

- **What it is:** the ways to take spent talent points back, or to change subclass.
- **Unlocks / items** (H unless noted):

| Tool | Effect in code | Source and cost |
|---|---|---|
| **Talent Point Reset Potion** (`ResetCompleted`) | Sets every talent with index < 615 to 0, on the live `SkillLevels` **and the active preset only**. Star tab untouched. Recomputes available points (`@8180016–8186300`) | Quests: Promotheus "Three Right Answers" ×2, "Slovakian Scare" ×1; Hamish "Should We Tell Him?" ×1; Speccius "More like 'Sleepius' lmao" ×1; Lord of the Hunt "Rollin' Thunder!" ×4. That is **9 from W1–W3 quests**. Gem shop "REGULAR_TALENT_RESET" 200 gems, 10/week, restocks weekly. Event boxes ([wiki](https://idleon.wiki/wiki/Talent_Point_Reset_Potion), bot data, 2026-10-05) |
| **Talent Point Reset Fragment** | 10 → 1 potion (needs a free inventory slot) | Drops (items.json) |
| **Star Talent Reset Potion** (`ResetCompletedS`) | Sets indices 615–694 to 0 on the active preset (`@8187823`) | Gem shop 300 gems, 3/week |
| **Slight Do-Over** (Upgrade Vault #51) | Hold down on a talent to refund it, 1 per vault level per day, max level 20 | Unlocks at **2,400 total vault upgrades**. Wiki [Upgrade Vault](https://idleon.wiki/wiki/Upgrade_Vault). The 2025-11-29 patch v1.03 notes it also refunds Super Talent points |
| **Sub Class Swap Token** (`ClassSwap`) | Allowed for classes 8/9, 20/21, 32/33 only (subclass → its sibling). Sets **every** talent < 615 to 0 on the live levels **and both presets**, and clears **both** attack bars (`@8256524`). Star talents kept | Gem shop "SUBCLASS_SWAP_TOKEN" 500 gems, +250 per purchase, 2 in stock, "Stock refreshes after each major update". Rare event boxes. The wiki's note "Refunds spent Tab 3 Talent Points" ([page](https://idleon.wiki/wiki/Sub_Class_Swap_Token), 2026-10-05) **understates it**: code resets all tabs |
| **Elite Class Swap** (`ClassSwapB`) | Elite → sibling elite (W4+) | Gem shop 900 gems. Toolbox marks it `lastSeen 2.3.40`, so it may no longer be sold (M) |
| **Complete Class Redo** (`ClassSwapC`) | Back to a Lv 1 Beginner; "Nothing else resets". Requires empty equipment slots | Gem shop 999 gems, max 1 per account |

- **Scope:** potions act on one character's active preset. Tokens act on one character (both presets).
- **When to reset (decision rules, my synthesis from the code above, L where marked):**
  1. **Don't reset for a different activity:** use the other preset (it's free).
  2. **Reset when** a preset's allocation is obsolete. Examples: after the subclass, when tab-1 points went into Beginner-era talents; after a build guide changed (the Apocalypse ZOW breakpoint, or Veins capped at Smithing 100 in 2025); or when the accuracy stat is far past 100% hit.
  3. **Reset the other preset first, then swap, then reset again,** because a potion resets **only the active preset** (H). Fixing both presets costs 2 potions.
  4. **Wrong subclass** (e.g. two Squires where the Meta Path wants a Squire and a Barbarian): one **Sub Class Swap Token** turns the extra Squire into a Barbarian with all talents refunded. Since the token wipes both presets, plan both builds before using it. Joseph's two-Squire account is the case in point, and the Course Correction ticket on the map should weigh this (H for mechanics, L for advice).
  5. **Spend free quest potions before gem potions.** Promotheus and Speccius quests are on every W1–W2 path.
- **Feeds / fed by:** fed by quests, the Gem shop and the Upgrade Vault. Feeds Talents and Talent presets.
- **Per-session actions:** none routine. One Slight Do-Over refund a day, if unlocked. The W3 fixture account has Slight Do-Over at level 1; the W2 account has not unlocked it (1,724 total vault levels) (H).
- **AFK Setup implications:** none directly.
- **Common mistakes:**
  - Using a reset potion on the wrong preset.
  - Using the swap token without a plan for both presets.
  - Burning gem resets when quest potions are in the inventory.
- **Save and Toolbox fields:** potion counts are in inventory and storage (`characters[].inventory`, `account.storage`, rawNames `ResetCompleted`, `ResetCompletedS`, `ResetFrag`, `ClassSwap`). Slight Do-Over is `account.upgradeVault.upgrades[51]`. Gem purchases are `account.gemShopPurchases`.
- **Sources:** N.js `"ResetCompleted"== @8180016`, `"ResetCompletedS"== @8187823`, `"ClassSwap" @8256524`. TB:[data/website-data/gemShop.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/gemShop.json), items.json. Wiki pages above. Wiki [Changelog 2025](https://idleon.wiki/wiki/Changelog_2025) (v1.03, 2025-11-29).

## Star talents

- **What it is:** the "Special Talent" pages. Account-flavoured talents bought with star talent points. Pages 1–2 matter in W1–W3.
- **Unlocks:** from the start. Star Player (tab 1) and Stonks! give extra points.
- **Scope:** per character, **per preset** (indices ≥ 615 sit inside `TalPresetLISTS`, H).
- **Inputs → outputs:** star points come from class Lv − 1, plus total skill levels, plus bonuses. Toolbox computes this for the logged-in character (`calcTotalStarTalent`, TB:[parsers/talents.ts L564-612](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/talents.ts#L564-L612)).

| Talent (index) | Effect | Use |
|---|---|---|
| Will of the Eldest (620) | +1 all stats per 10 levels of your best character | Fighting, first |
| Beginner Best Class (616) | +1 base WP per 10 levels of your best Beginner | Fighting. Only up to best Beginner level / 10 |
| Tick Tock (621) | +AFK gains, fighting and skills (decay 8,50) | Both presets |
| Attacks on Simmer (624) | Attacks boost AFK more (decay 40,100; its effect is capped at 25% in AFK math) | Fighting |
| Goblet of Hemoglobin (627) | Heal % per kill, counts AFK | Fighting survivability |
| Stonks! (622) | Gives Special Talent Points | "Up to 30 points" (tier 3) |
| Dungeonic Damage (638), Frothy Malk (631: boost food +%), Telekinetic Storage (634: carry cap) | page 2 | Fighting |
| Printer Sampling (635), Shrine Architect (639) | 1 point each; Printer Sampling goes on the attack bar | Both |
| Supersource (636), Action Frenzy (637) | +base efficiency, +skill speed | Skilling |
| Toilet Paper Postage (625) | Skill-efficiency stamps ×bonus | Skilling |

- **Goals and Milestones / Per-session / Common mistakes:** spending star points on the skilling preset and leaving the fighting preset's star tab empty, or the other way round. Detect from `flatStarTalents` on both presets. Star-talent books drop from W1/W2 minibosses until both Lv 100 versions are found (wiki Changelog 2025).
- **Save and Toolbox fields:** `characters[].starTalents`, `flatStarTalents`, and the other preset's `talentPreset.flatStarTalents`. Point total: `calcTotalStarTalent` (account-level, active character).
- **Sources:** talents.json "Special Talent 1–3". Build priorities: Sir_Grimtide builds (tier 3, below).

## Star signs

- **What it is:** passive bonuses aligned per character, unlocked with Star Chart Points (SCP) that come from completing Constellations.
- **Unlocks:** the **Telescope quest** at the top of the big tree in Blunder Hills. Its text: "Go complete Constellation A-2 … on the bottom right branch, then the telescope will be usable!" (Toolbox `quests.json` → "Telescope"). New characters pick one of 4 starter signs (H).
- **Scope:** unlocks and SCP are account-wide (`account.starSigns`, `account.constellations`). Alignment is per character (`PVtStarSign_<n>`). Constellations need several characters each.
- **Inputs → outputs:** Constellation completions (kills, AFK hours, level counts, "reach this star on N players") give SCP. Signs give stats, %damage, AFK gains, carry cap, drop rate, skill efficiency and EXP.

**Slots** (H on mechanics; data from the [wiki Star Signs](https://idleon.wiki/wiki/Star_Signs) bot table, edited 2026-10-05):

| Unlock | SCP | Effect |
|---|---|---|
| Start | — | 1 sign per character |
| **Chronus Cosmos** (chart 1) | 3 | **2 signs** per character |
| **Hydron Cosmos** (chart 2) | 2 | **3 signs** per character |
| Seraph Cosmos (chart 3, W5+) | 11 | ×1.10 sign bonuses per 20 Summoning Lv |
| Silkrode Nanochip (W4 Lab) | — | Doubles that character's positive sign bonuses (TB:[parsers/starSigns.ts L65-89](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/starSigns.ts#L65-L89)) |
| Infinite Stars (Rift 10, W4) | — | First 5+ catalog signs always active, without their negatives |

**W1–W3 signs worth aligning** (chart 1: Chronus, chart 2: Hydron; costs in SCP):

| Sign | Cost | Effect | Best for |
|---|---|---|---|
| The Buff Guy / Flexo Bendo / The Book Worm / The Fuzzy Dice | 0 | +1% dmg +3 STR / +2% speed +3 AGI / +1% class EXP +3 WIS / **+3 talent points** +3 LUK | starters |
| Dwarfo Beardus, Hipster Logger, Pie Seas, Shoe Fly | 2 each | +5% efficiency +20% multi-drop for Mining, Choppin, Fishing, Catching | skilling preset |
| Pirate Booty | 2 | +5% drop rate | fighting |
| Mount Eaterest | 2 | +10% food not consumed, +15% all food effect | potion-heavy fighters |
| All Rounder | 2 | +4 all stats | fighting |
| Silly Snoozer / The Big Comatose | 3 | +2% fight / skill AFK gain | AFK |
| The OG Skiller | 4 | +5% carry, +1% skill AFK, +2% skill prowess | skilling |
| The Forsaken | 4 | −80% HP, −50% DEF, **+6% fight AFK** | only if survivable |
| Gum Drop | 2 | 15% chance of a Time Candy on 8 h+ AFK claims | any |
| Muscle Man / Fast Frog / Smart Stooge / Lucky Larry | 1 | +8 stat | "Skip unlocking this to save points" (wiki) |
| Chart 2: Strandissi/Agitagi/Wispommo (+3% main stat), Centaurii (+10% accuracy), Pokaminni (+15% card drop), Cullingo (+15% multikill), The Bulwark (+20% dmg, −12% speed), The Fiesty (+6% dmg), The Overachiever (+15% dmg, −7% fight AFK), Grim Reaper Major (+4% respawn if Lv > 60), S. Snoozer Major (+4% fight AFK if Lv > 100) | 1–5 | | fighting |

**Constellations reachable in W1–W3** (A = W1, B = W2, C = W3; from the wiki table, H as bot data):

| Id | Map | Requirement | SCP |
|---|---|---|---|
| A-1 | Blunder Hills | Lv 30 on 4 players | 3 |
| **A-2** | Where the Branches End | **AFK here 1+ hour** (one claim) | **3** |
| A-3 | Valley of the Beans | Reach the star on 4 players | 3 |
| A-4 | Tucked Away | Reach on 3 players | 4 |
| A-5 | The Office | Defeat Dr. Defecaus on 3 players | 5 |
| A-6 / A-10 | Freefall Caverns / Echoing Egress | Reach as an Archer / as a Mage | 3 / 4 |
| A-7 | Winding Willows | AFK 2+ h on 2 players | 3 |
| A-8 | Dewdrop Colosseum | Clear the colosseum on 3 players | 4 |
| A-9 | End of the Road | Amarok in < 20 s on 3 players | 5 |
| B-1 / B-4 | The Mimic Hole / Slamabam Straightaway | Reach on 3 / 4 players | 4 / 5 |
| B-2 | Faraway Piers | Reach as a Mage | 4 |
| B-3 / B-7 | Grandioso Canyon / Up Up Down Down | AFK 4+ h on 3 / AFK 8+ h on 3 | 4 / 3 |
| B-5 | Sandstone Colosseum | Clear on 4 players | 3 |
| B-6 | Efaunt's Tomb | Efaunt as a Beginner-line class | 5 |
| B-8 | YumYum Grotto | Lv 65 on 4 players | 4 |
| C-1 … C-8 | Frostbite Tundra | Lv 90 on 6 (6); barehanded sheepie on 4 (4); Trapping 15 on 5 (4); AFK 16 h on 3 (4); wave 11 on 4 (5); AFK 10 h on 9 (5); reach on 6 (6); bloodbone on 4 (5) | 4–6 |

AFK constellations need **one** claim of at least that length. A single Time Candy of at least that length works, but several candies do not add up (wiki note) (H as wiki text).

- **Goals and Milestones:** A-2 → 3 SCP → **Chronus Cosmos (2 slots)**. That is one hour of AFK, and the cheapest damage step in W1 (L, synthesis). Next, any 2 more SCP → **Hydron Cosmos (3 slots)**. Then fill slots per preset role.
- **Feeds / fed by:** fed by AFK time, kills, Colosseum, bosses and character count. Feeds damage, AFK gains, drop rate, skill efficiency, talent points (The Fuzzy Dice) and food (Mount Eaterest).
- **Per-session actions:** when a character's activity changes, re-align its signs (skilling signs on skillers, damage and AFK signs on fighters). When a constellation's requirement is met, go press it. Spend new SCP.
- **AFK Setup implications:** a fighter AFKing 8 h+ benefits from Gum Drop. AFK fighters want Silly Snoozer, and The Forsaken if they don't die. Skillers want their skill's sign plus The Big Comatose.
- **Min-max by stage:**
  - **Early W1:** A-2 → Chronus Cosmos. Use the free signs: Buff Guy on Warriors, Fuzzy Dice when points are short.
  - **Late W1/W2:** Hydron Cosmos; Pirate Booty, All Rounder, Silly Snoozer, skill signs.
  - **W3:** chart-2 damage signs (The Fiesty, Bulwark, Overachiever only if active), Grim Reaper Major.
  - **W4+:** Silkrode Nanochip, Infinite Stars.
- **Common mistakes:**
  - Never doing the Telescope quest. **Both of our saves have 0–1 of 49 constellations and only the 4 starter signs** (`account.constellations[].done`, `account.starSigns[].unlocked`).
  - A sign that doesn't fit the activity.
  - Spending SCP on the +8-stat signs.
  - Leaving The Forsaken on a character that dies.
- **Save and Toolbox fields:** `characters[].starSigns` (aligned, from `PVtStarSign_<n>`), `account.starSigns[]` (`unlocked`, `isInfiniteStar`), `account.constellations[]` (`done`, `completedChars`), `account.rawConstellationsDone`. Bonuses via `getStarSignBonus(character, account, effect)` (TB:[parsers/starSigns.ts L89](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/starSigns.ts#L89)). Account-wide sign effects apply only on the active character (Toolbox comment, wiki).
- **Sources:** wiki [Star Signs](https://idleon.wiki/wiki/Star_Signs) (2026-10-05, bot data). TB starSigns.ts, quests.json "Telescope".

## Equipment and tools

- **What it is:** worn equipment (8 core slots: helmet, weapon, shirt, pendant, pants, ring, shoes, ring, plus premium and cosmetic slots) and **tool** slots (pickaxe, hatchet, rod, net, trap set, worship skull …).
- **Unlocks:** most W1–W3 gear is crafted at the **Anvil** (Smithing tab N = world N), or dropped by bosses. Equip level is the class level (`lvReqToEquip`).
- **Scope:** per character. Recipes and anvil production are account-wide (Anvil System).
- **Inputs → outputs:** materials and coins in. Out: Defence, Weapon Power, STR/AGI/WIS/LUK, % bonuses (UQ1), plus upgrade slots for stamps and stones (Smithing). **Tool stats count toward combat stats.** Toolbox's gear sum adds tools' stats to the character's stats. Only the tools' weapon power (which is skill power) is excluded from combat WP (TB:[parsers/items.ts L106-113](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/items.ts#L106-L113), [parsers/damage.ts L1127](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/damage.ts#L1127)) (H).

**Armor tiers** (lvReqToEquip / Defence, from items.json; all crafted, H):

| Tier (world) | Helmet | Body | Pants | Shoes | Notes |
|---|---|---|---|---|---|
| Copper (W1) | 8 / 7 | 8 / 10 | 8 / 6 | 8 / 2 | |
| Iron (W1) | 15 / 10 | 15 / 16 | 15 / 11 | 15 / 4 | |
| Gold (W1) | 35 / 15 | 35 / 20 | 35 / 16 | 30 / 8 | |
| Amarok (W1 boss) | 38 / 20 | 35 / 25 | 40 / 18 | 35 / 10 | Chaotic Amarok Pendant Lv 30: +20% total dmg |
| Platinum (W2) | 55 / 25 | 50 / 30 | 50 / 23 | 50 / 15 | |
| Dementia (W2–3) | 70 / 34 | 70 / 40 | 70 / 28 | 65 / 22 | |
| Efaunt (W2 boss) | 80 / 38 | 80 / 50 | 75 / 32 | 70 / 18 | Efaunt Trunculus ring Lv 80 |
| Void Imperium (W3) | 90 / 46 | 90 / 55 | 90 / 38 | 85 / 30 | |
| Chizoar (W3 boss) | 110 / 60 | 105 / 70 | 100 / 52 | 95 / 48 | Chizoar's Caustic Scarf Lv 120: +40% total dmg |

Class-specific W1–W2 pieces (Lv 40): Viking Cap / Studded Hide (Warrior), Sleek Coif / Feral Leathering (Archer), Witch Hat / Furled Robes (Mage). They carry +10–20% skill efficiency, which suits skilling presets.

**Weapons** (crafted; Lv / WP):

| Warrior (spear) | Archer (bow) | Mage (wand) | Beginner (fists) |
|---|---|---|---|
| Steel Axe 11/15 | Birch Longbow 12/15 | Quarterstaff 12/16 | The Stingers 6/11 |
| Royal Bayonet 30/20 | Spiked Menace 30/17 | Starlight 30/23 | Bandage Wraps 25/20 |
| Enforced Slasher 50/26 | Pharaoh Bow 50/23 | Crows Nest 50/30 | Uninflated Glove 50/27 |
| The Ice Breaker 75/33 | Blizzard Bow 75/30 | Spriggly Storm 75/36 | Eclectic Ordeal 85/32 |
| Deuscythe 90/40 | Blackhole Bow 90/36 | Grey Gatsby 90/43 | Knuckle Sabers 110/38 |
| Slimsharp Fin 110/48 | Shardsure Leif 110/44 | Skullslip Hallow 110/51 | |

Non-crafted drops with higher WP exist (Steel Spear Lv 25 / 40 WP, Frozen Impaler 45/66, Blood Screamer 55/87, Carrot Launcher 18/22) (H, items.json).

**Tools** (Lv / skill power), from the wiki [Tools](https://idleon.wiki/wiki/Tools) (2026-10-03) and items.json:

| Tool | Copper | Iron | Gold | Plat | Dementia | Void | Lustre (W4) |
|---|---|---|---|---|---|---|---|
| Pickaxe | 3/6 | 8/10 | 15/13 | 25/16 | 37/19 | 45/24 | 55/30 |
| Hatchet | 4/7 | 8/10 | 15/14 | 20/18 | 25/23 | 30/26 | 40/29 |
| Fishing rod | 4/8 | 9/13 | 15/19 | 25/25 | 33/30 | 40/36 | 45/43 |
| Bug net | 4/9 | 10/14 (Reinforced) | 15/20 | 20/26 | 25/31 | 30/37 | 40/45 |
| Trap set | Silkskin 5, Wooden 15, Natural 20, Steel 30, Meaty 40, Royal 48 | | | | | | |
| Worship skull | Ceramic 10, Horned 25, Prickle 35, Manifested 40, Glauss 50 | | | | | | |

- **Goals and Milestones:** each armor or weapon tier at its level requirement. Every tool slot filled. Boss sets (Amarok → Efaunt → Chizoar) are W1/W2/W3 Milestones, and their materials come from boss kills.
- **Feeds / fed by:** fed by the Anvil (Smithing), boss drops and monster drops. Upgrade slots are filled from Stamps / Smithing stones. Feeds damage, Defence, accuracy, survivability, skill efficiency and AFK kill rates. Armor set bonuses come from the W3 Armor Smithy (a separate System).
- **Per-session actions:** after a level-up, check whether a higher tier is now wearable and craftable. Craft it at the Anvil.
- **AFK Setup implications:** the AFK skill's tool must be equipped for skilling (it sets skill power). Fill every other tool slot anyway, for their stats.
- **Min-max by stage:**
  - **W1:** Copper → Iron at Lv 8/15, Amarok set at Lv 35–40.
  - **W2:** Platinum Lv 50–55, then Dementia Lv 65–70, then Efaunt.
  - **W3:** Void Imperium Lv 85–90, then Chizoar Lv 95–110.
  - Tools: always the highest your level allows.
- **Common mistakes** (both saves):
  - Characters at Lv 43–85 wear **armor with max level requirement 8–40**.
  - **2–5 empty armor slots** on 6 of 11 characters, mostly Bowmen and Wizards.
  - **6 of 11 characters have no tool equipped at all.**
  - Detect: `characters[].equipment[0..7]` with an empty `rawName == "Blank"`, `max(lvReqToEquip)` ≪ `level`, `characters[].tools[*].rawName == "Blank"`.
- **Save and Toolbox fields:** `EquipOrder_<n>` / `EquipQTY_<n>` / `EMm0_<n>` / `EMm1_<n>` → `characters[].equipment` (index 1 = weapon), `characters[].tools`. Upgrade stones are in each item's `stoneData`. Stats come from Toolbox `getStatsFromGear`. Recipes are in `crafts.json`, and `account.anvil`.
- **Sources:** TB [items.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/items.json), [crafts.json](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/crafts.json), parsers/character.ts L343-376, items.ts. Wiki [Tools](https://idleon.wiki/wiki/Tools) (2026-10-03), [Weapons](https://idleon.wiki/wiki/Weapons) (2026-10-03), [Armor](https://idleon.wiki/wiki/Armor) (2026-09-23).

## Food and potions

- **What it is:** consumables in the character's food slots. **Health food** is auto-eaten below an HP threshold. **Boost food** (the potions) gives a bonus while equipped and has a chance to be consumed. **Golden food** is never consumed and its bonus scales with stack size.
- **Unlocks:** from the start. Extra food slots: Gem shop "FOOD_SLOT" (450 gems, max 2, "4 food slots will be added FOR FREE … scattered across the game"); the W3 Frostbite merit (2nd and 4th purchase: +1 food slot) (`@14800879`). I did not verify the base slot count. Toolbox's `characters[].food` is a 16-entry buffer, not the unlocked count (M).
- **Scope:** per character. Golden food bonuses read that character's own slots.
- **Inputs → outputs:**

| Kind | Examples (W1–W3) | Mechanic |
|---|---|---|
| Health food | Nomwich 20 HP · Hot Dog 50 · Peanut 80 (below 75% HP, 20 s) · Cheezy Pizza 125 · Cranberry Jam 200 · Kebab Sticks 300 · Meat Pie 500 · Saucy Weiner 700 · Mountain Bread 750 · Yeti Ham 1000 · Sheepie Dairy 1500 · Magic Meatloaf 2000 (below 30%, 10 s) | Eaten below 50% HP (unless stated), with a cooldown. Keeps an AFK fighter alive. Toolbox `getHealthFoodBonus` gives HP per hour |
| Boost (potions) | Strength (base dmg 50/150/400/1000), Life (base HP 75/200/400/800), Speed (move speed 10/15/17/20%), Mana regen, EXP (30–90% class EXP), Bullets (WP), skill foods (Icing Ironbite mining, Saucy Logfries choppin, Slurpin Herm fishing, Buttered Toasted Butter catching, Critter Numnums, Soulble Gum) | "1% chance to be consumed every time you defeat a monster" (speed: every 10 m walked; bullets 15%). The bonus is multiplied by the food-effect bonus (gear, stamps, Mount Eaterest, Frothy Malk) |
| Golden food | Golden Peanut (mining eff), Golden Jam (+max HP%), Golden Kebabs (+total dmg), Golden Meat Pie (+DEF), Golden Nomwich (+base dmg), Golden Ham (+skill EXP), Golden Bread (+mob coins), Golden Ribs (fishing eff), Golden Cheese (shrines) | "Golden foods are never consumed". Bonus = Amount × multi × 0.05 × log10(1 + qty) × (1 + log10(1 + qty)/2.14) (TB:[parsers/misc.ts L1043-1068](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts#L1043-L1068)) |

- **Goals and Milestones:**
  - Golden food stacks: each ×10 adds about +0.05 × Amount × multi × (1 + …). The jump from 1 to 10, then 100, then 1,000 (log steps) is where the reward steps up.
  - Golden Peanut is craftable (Smithing tab 1) and is the mining preset's golden food.
  - Haungry for Gold (Warrior tab 2) raises every golden food. The Beanbie Major sign (chart 3, W5+) does too.
- **Feeds / fed by:** fed by monster drops (W1–W3 maps), the Anvil (Peanut, Golden Peanut, Bullets, Buttered Toasted Butter), Gift boxes and the Post Office (food boxes). Feeds survivability (AFK deaths), damage, AFK kill rates and skill efficiency. AFK food running out is one of the real limits on AFK length (`AFKfoodsTimeRedux`, [mechanics §1](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md#1-maximum-afk-hours)).
- **Per-session actions:** before leaving, check that each fighter has a health food stack that will last the Expected Return, and that boost-food stacks won't run out. Move golden food to the characters whose activity it boosts (Golden Peanut → miner).
- **AFK Setup implications:** a fighter with no health food on a map where it takes damage risks dying, which loses AFK time. A fighter wants Strength/Life potions plus Golden Kebabs/Nomwich/Jam. A skiller wants its skill boost food plus its skill golden food. Tier-3 builds dated 2026 say: "If you're low on defense, by this point equipping food to stay alive is normal and expected."
- **Min-max by stage:**
  - **W1:** Peanuts (craft) as health food; Strength and Life potions from drops; Golden Peanut on the miner.
  - **W2:** Kebab Sticks and Meat Pie; Speed potions for Bowmen (Speedna); Golden Kebabs on fighters.
  - **W3:** Mountain Bread, Yeti Ham, Sheepie Dairy; stack golden foods in hundreds.
- **Common mistakes:**
  - Empty food slots: 3 of 11 characters carry no food, the rest carry 1–2.
  - Golden food on a character it doesn't help.
  - Event foods eaten instead of kept for sampling. A 1.40b community note says to keep mining event food for the 3D Printer; treat it as **Stale**.
  - Detect: `characters[].food[*].Type` (HEALTH_FOOD / BOOST_FOOD / GOLDEN_FOOD), `amount`.
- **Save and Toolbox fields:** `EquipOrder_<n>[2]` / `EquipQTY_<n>[2]` → `characters[].food` (`rawName`, `amount`, `Type`, `Effect`, `Amount`, `Cooldown`). `getFoodBonus`, `getGoldenFoodBonus`, `getHealthFoodBonus`, `getPlayerFoodBonus` (food effect %), and `characters[].nonConsumeChance`.
- **Sources:** TB items.json, [parsers/misc.ts](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts), [parsers/character.ts L361-371](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/character.ts#L361-L371). Wiki [Food](https://idleon.wiki/wiki/Food) (2026-09-13, bot data). N.js gem shop `GemP8 @14102179`, merit `@14800879`.

## Build orders per class and per preset

How to read: `→` means "then", `=` means "split evenly", numbers are target levels, and "max" means 100 (or the book cap). Primary source: the most-liked current builds in the [Toolbox community builds](https://idleontoolbox.com/tools/builds) (tier 3). For each class I give the **current** build (2026 edits) first and older material as Stale. Talent names match `talents.json`. Where a guide disagrees with game data, the data wins and I say so.

**Common core for every fighting preset** (all 5 Sir_Grimtide builds, edited 2026-10-10 to 10-15):

1. Tab 1: **Gilded Sword → Sharpened Axe → 50 in the Idle fighting talent** (Idle Brawling / Idle Shooting / Idle Casting) → the class's tab-1 damage talent (Meat Shank / Featherweight / Overclocked Energy) → Health or Mana Booster → main-stat talent. The accuracy-stat talent only "according to accuracy needed".
2. Tab 2: about 25 points in each AFK attack. Active players put 1 point in each attack and max the passives.
3. Star tab 1: Will of the Eldest → Beginner Best Class (to best Beginner Lv / 10) → Tick Tock = Attacks on Simmer = Goblet of Hemoglobin.
4. Star tab 2: Dungeonic Damage → Frothy Malk → Telekinetic Storage. 1 point each in Printer Sampling and Shrine Architect.

**Common core for every skilling preset:** tab 1 = class efficiency talent (Brute / Elusive / Smart Efficiency) → Idle Skilling / Active AFK'er → main-stat talent. Star tab 1: Tick Tock = Toilet Paper Postage = Will of the Eldest. Star tab 2: Supersource → Action Frenzy → Frothy Malk → Telekinetic Storage, plus Printer Sampling and Shrine Architect.

### Beginner (Lv 1–10) and the class choice

- **One preset only** (presets unlock at Lv 15, class change at 10). Split points between **Gilded Sword and Sharpened Axe**. Add Sleepin' On The Job if AFK (community build "EARLY GAME DMG UNTIL SPECIFIC CLASSES", updated 2026-05-14).
- The Lv 10 class choice and the order of classes follow the Meta Path (a separate decision ticket). Journeyman/Maestro/Voidwalker builds exist (Toolbox "Journeyman AFK (~40/55/70)", v1.40b, **Stale**). That line is outside this cluster's W1–W3 build scope.

### Warrior (Lv 10 → subclass)

| Preset | Order | Source |
|---|---|---|
| Fighting | Rage Basics: Sharpened Axe 50, Gilded Sword 40, Meat Shank 20. Warrior: AFK → Power Strike 20, Whirl 20, Double Strike 10, Firmly Grasp It 1, Carry A Big Stick 50. Active → 1 each, Carry A Big Stick 100, Double Strike first | "Warrior / AFK (~35)" and "Active (~35)", v1.23, **Stale** but matches the 2026 core |
| Skilling (mining) | Rage Basics: Brute Efficiency 80, Idle Skilling 50. Warrior: Big Pick 50 (**on the attack bar**), Copper Collector 15, Motherlode Miner 15, Firmly Grasp It 1 | "Mining Active/AFK (Warrior) 30+", v1.23, **Stale** |

### Barbarian (subclass; fishing specialist)

| Preset | Order | Source |
|---|---|---|
| **Damage** | Tab 1: Gilded Sword → Sharpened Axe → 50 Idle Brawling → Meat Shank → Health Booster → Fist of Rage; Book of the Wise only for accuracy. Tab 2: 25 Power Strike = 25 Whirl = 45 Double Strike = 1 Firmly Grasp It → Carry A Big Stick → Strength In Numbers → Health Overdrive → 'Str'ess Tested Garb = Absolute Unit; extra points into Firmly Grasp It. Tab 3: 25 Bear Swipe = 25 Axe Hurl → (No Pain No Gain **only from W4**, "you need enough base HP to avoid one shot") → Str Summore → Apocalypse ZOW (breakpoints only) → Back To Basics → Monster Decimator → Fistful of Obol = Strongest Statues | Sir_Grimtide "Barbarian/Fishing", created 2026-06-01, **updated 2026-10-12**, 40 likes ([ih5wAK](https://idleontoolbox.com/tools/builds/view?id=ih5wAK)) |
| **Skilling (fishing)** | Tab 1: Brute Efficiency → Idle Skilling → Fist of Rage (Star Player optional). Tab 2: Absolute Unit → Firmly Grasp It → 'Str'ess Tested Garb → Haungry For Gold → Tempestuous Emotions. Tab 3: Worming Undercover → Bobbin' Bobbers → All Fish Diet → Catching Some Zzz's → Str Summore → Strongest Statues; Fistful of Obol, or Back To Basics if tab 2 needs points | same |
| Alt. skilling (mining + fishing) | Brute Efficiency 100, Idle Skilling 100, Fist of Rage / Lucky Clover priority; Big Pick, Copper Collector, Motherlode Miner, Tool Proficiency 50; Worming Undercover 50, All Fish Diet 100, Catching Some Zzz's 50 | Ibn_Yafith "Barb Mining / Fishing", updated 2026-10-15 ([RjrEMb](https://idleontoolbox.com/tools/builds/view?id=RjrEMb)) |

Rules from data: Apocalypse ZOW's damage per counted monster goes up only at Lv 33/66/99/132, and it counts one monster type per level. So match its level to the number of monster types killed 100k times (`characters[].zow`) (H, `intervalAdd` 2,33 and `y = add 1`). Monster Decimator doubles kill counts toward portals and Death Note / ZOW, so it is worth more while pushing 100k kills.

### Squire (subclass; refinery and construction)

| Preset | Order | Source |
|---|---|---|
| **Damage** | Tab 1 as Barbarian, then Idle Brawling → Fist of Rage → Lucky Clover. Tab 2: 54 Power Strike = 54 Whirl = 45 Double Strike = 1 Firmly Grasp It → Carry A Big Stick → Strength In Numbers → Health Overdrive → 'Str'ess Tested Garb = Absolute Unit; extra into Firmly Grasp It / Haungry For Gold. Tab 3: **Precision Power** ("required 150% accuracy", which is 2.25 × Defence in code) → Str Summore → Back To Basics; 1 point each Shockwave Slash = Daggerang = Bricky Skin; Blocky Bottles (scales on the bubble) | Sir_Grimtide "Squire/Mining+Construction", updated 2026-10-10 ([CngknO](https://idleontoolbox.com/tools/builds/view?id=CngknO)) |
| **Skilling (mining + construction)** | Tab 1: Brute Efficiency → Idle Skilling → Fist of Rage → Health Booster → Lucky Clover. Tab 2: Big Pick → Copper Collector → Tool Proficiency → Motherlode Miner → Health Overdrive → Absolute Unit → Haungry For Gold (with many Golden Peanuts and Jam); 1 Firmly Grasp It. Tab 3: **Refinery Throttle → Redox Rates → Sharper Saws** → Shieldiest Statues → Str Summore | same, and the anonymous "Mining / Construction" (updated 2026-10-11, [SFipox](https://idleontoolbox.com/tools/builds/view?id=SFipox)) agrees |
| AFK combat (late) | Health Booster/Sharpened Axe/Gilded Sword 160, Fist of Rage 260, Meat Shank 260, Idle Brawling 160; Power Strike = Whirl 55, Double Strike 41; Precision Power 160, Refinery Throttle 160 (**in multiples of 8**: it is `intervalAdd` 3,8) | RyuNumber1 "Squire AFK Combat", updated 2026-10-02 ([xqKgSd](https://idleontoolbox.com/tools/builds/view?id=xqKgSd)) |

Squire note: Refinery Throttle auto-triggers refinery cycles and is the reason to own one Squire (see the Refinery System). A second Squire stacks the throttle, but the community sheet says "I hope you dont have 3 of them" (Fibster/Tetsu, 2024, **Stale**). Owning two Squires is not wasted. It does cost the Barbarian's fishing and ZOW roles (L), which is the input to Course Correction.

### Archer (Lv 10 → subclass)

| Preset | Order | Source |
|---|---|---|
| Fighting | Calm Basics: Sharpened Axe 50, Gilded Sword 50, Fist of Rage for accuracy. Archer: Piercing Arrow 20, Kung Fu Kick 20, Strafe 1, Have Another! 10, Veins of the Infernal 1, High Polymer Limbs 50 | "Archer / AFK (~35)", v1.40b, **Stale** |
| Skilling (catching or smithing) | Elusive Efficiency → Quickness Boots → Broken Time; Garb of Un'agi'ng Quality → Sanic Speed → Focused Soul; **Acme Anvil → Yea I Already Know → Godly Creation** for anvil and smithing | Sir_Grimtide Bowman skilling (below); the Fibster sheet: Archer "is best at smithing … Smeltin' Erryday … works AFK" (Stale) |

### Bowman (subclass; catching)

| Preset | Order | Source |
|---|---|---|
| **Damage** | Tab 1: Gilded Sword → Sharpened Axe → 50 **Idle Shooting** → Featherweight → Quickness Boots → Fist of Rage (accuracy) → max Quickness Boots → Lucky Clover. Tab 2: High Polymer Limbs → Strafe → Veins of the Infernal → 40 Piercing Arrow = 10 Kung Fu Kick → 40 Have Another! → Garb of Un'agi'ng Quality → Sanic Speed; then Smeltin' Erryday or Robbinghood. Tab 3: **Speedna** → Agi Again → Velocity Vessels (bubble-capped) → Shwifty Statues → Previous Points → 50 Magic Shortbow = 20 Homing Arrows → 1 Flax Instastring → Shoeful of Obol | Sir_Grimtide "Bowman/Catching", updated 2026-10-12 ([b0sGrY](https://idleontoolbox.com/tools/builds/view?id=b0sGrY)). The guide writes "Idle Brawling" on tab 1, but that talent is Warrior-only. The Archer talent is **Idle Shooting** (id 268) |
| **Skilling (catching)** | Elusive Efficiency → Quickness Boots → Broken Time; Garb of Un'agi'ng → Sanic Speed → Focused Soul; Acme Anvil → Yea I Already Know → Godly Creation; Teleki'net'ic Logs → Briar Patch Runner → Bug Enthusiast → Sunset on the Hives → Agi Again → Shwifty Statues | same |
| Speed rule | Speedna gives damage per 15% move speed above 100%. Aim for about 145% move speed (Featherweight to 20, then Strafe about 85) | anonymous "Bowman Build", updated 2026-09-29 ([KvgS3N](https://idleontoolbox.com/tools/builds/view?id=KvgS3N)) |

Data notes: Veins of the Infernal caps at **Smithing Lv 100** (2025 patch; talents.json text "Capped at Smithing Lv 100"). Teleki'net'ic Logs scales per power of 10 Oak Logs in storage, so it wants an Oak Log stockpile.

### Hunter (subclass; trapping)

No 2026-edited Hunter build exists on Toolbox; all are "Community Guide" v1.23/1.40b. **Stale.**

| Preset | Order | Source |
|---|---|---|
| Fighting (AFK) | Calm Basics: Sharpened Axe and Gilded Sword 25–75+, Fist of Rage for accuracy, Idle Shooting 50. Archer: Piercing Arrow 25, Kung Fu Kick 25, Strafe 1–25, Veins of the Infernal 50, High Polymer Limbs 50–100. Hunter: 360 Noscope 25–30, Bear Trap 25–30, Have Another… Again! 25, **Looty Mc Shooty** 20 → 100 (damage per 50 unique items found) | "Hunter / AFK (~50/~70)", v1.40b |
| Skilling (trapping) | Quickness Boots 100 → 200, Elusive Efficiency 100+; Garb of Un'agi'ng 100, Sanic Speed 100, Acme Anvil, Yea I Already Know, Godly Creation, Focused Soul 100; **Eagle Eye** 100+ (collect and set all traps, EXP to every player), Invasive Species, Shroom Bait 100, Reflective Eyesight | "Hunter Trapping (~70/~100)", v1.23 |

The Fibster sheet (2024) notes that Eagle Eye "Should be maxed whenever claiming traps … QoL to have it even on fighting preset", and that shiny odds apply when you claim, not when you set (**Stale**, M).

### Mage (Lv 10 → subclass)

| Preset | Order | Source |
|---|---|---|
| Fighting | Savvy Basics: Sharpened Axe 50, Gilded Sword 40, Overclocked Energy 20, Quickness Boots for accuracy. Mage: AFK → Energy Bolt 25, Mini Fireball 25, Power Overwhelming 50. Active → 1 each, Knowledge Is Power, Power Overwhelming 100, Individual Insight | "Mage / AFK (~35)", v1.23, **Stale** |
| Skilling (choppin) | Smart Efficiency 80, Active AFK'er 50; **Log On Logs** 50 (on the bar), Leaf Thief 15, Deforesting All Doubt 50 | "Woodcutter Active/AFK (Mage) 30+", v1.23, **Stale** |

### Wizard (subclass; worship)

| Preset | Order | Source |
|---|---|---|
| **Damage** | Tab 1: Gilded Sword → Sharpened Axe → 50 Idle Casting → Overclocked Energy → Mana Booster → Quickness Boots (accuracy) → Book of the Wise → Idle Casting → Farsight → Lucky Clover. Tab 2: Power Overwhelming → Knowledge Is Power = Mana Overdrive → 10 Energy Bolt = 40 Mini Fireball → Unt'wis'ted Robes (if gear WIS is high) or Individual Insight → Choppin It Up Ez. Tab 3: **Paperwork, Great…** (dmg per 10 stamps) → Wis Wumbo → 20 each Ice Shards = Floor Is Lava = Tornado = Mana Is Life → Fuscia Flasks (bubble-capped) → Earlier Education → Nearby Outlet → Occult Obols. Star: up to 30 in Stonks! | Sir_Grimtide "Wizard/Worship", updated 2026-10-13 ([qncFFv](https://idleontoolbox.com/tools/builds/view?id=qncFFv)) |
| **Skilling (choppin + worship)** | Tab 1: Smart Efficiency → Active AFK'er → Book of the Wise → Mana Booster → Lucky Clover. Tab 2: Log On Logs → Leaf Thief → Deforesting All Doubt → Individual Insight → Unt'wis'ted Robes → Mana Overdrive (Free Meal optional). Tab 3: **Charge Syphon → Sooouls → Nearby Outlet** → Wis Wumbo → Staring Statues → Earlier Education | same |

### Shaman (subclass; alchemy)

| Preset | Order | Source |
|---|---|---|
| **Damage** | Tab 1 as Wizard (… Book of the Wise → Farsight → Idle Casting → Lucky Clover). Tab 2 as Wizard. Tab 3: **Virile Vials** (dmg per green vial) → Wis Wumbo → Earlier Education → 20 Crazy Concoctions = 20 Auspicious Aura = 20 Sizzling Skull → Fantasia Flasks (bubble-capped) → Cranium Cooking → Busy Brewin'. Star: up to 30 Stonks! | Sir_Grimtide "Shaman/Alchemy", updated 2026-10-15 ([K4c9A0](https://idleontoolbox.com/tools/builds/view?id=K4c9A0)) |
| **Skilling (alchemy + choppin)** | Tab 1: Smart Efficiency → Book of the Wise → Active AFK'er. Tab 2: Log On Logs → Leaf Thief → Deforesting All Doubt → Individual Insight → Mana Overdrive → Inner Peace. Tab 3: **Bubble Breakthrough → Busy Brewin' → Sharing Some Smarts** → Wis Wumbo → Earlier Education | same |
| AFK alt. | Idle Casting 100 (13% AFK); attacks 25 each; Virile Vials 100; spread extra between Knowledge Is Power and Individual Insight; Earlier Education when tab 2 is short | anonymous "Build Shaman", updated 2026-10-06 ([aCmcE6](https://idleontoolbox.com/tools/builds/view?id=aCmcE6)) |

Cranium Cooking ("kill → seconds of alchemy progress") goes on the **fighting** attack bar while AFK fighting. The Shaman's fights then feed the cauldrons (H on talent text). One fixture Shaman has it on the bar.

### Elite class outline (W4+, for planning only)

Elite tabs come from Eliteus on W4 map 154 ([mechanics §3](https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md#3-subclass-and-elite-class-gates)). Tab-4 points start at class Lv 90. The **Elite Class Swap** may no longer be sold, so the subclass you pick in W2 decides the elite class (M).

| Subclass → elite | Tab 4 highlights (talents.json) | Role cue (Sir_Grimtide skilling tab 4, 2026) |
|---|---|---|
| Barbarian → Blood Berserker | Symbols of Beyond ~R, Overblown Testosterone, Skill Strengthen, Apocalypse Chow, cooking talents | Cooking ("Mostly Cooking skills") |
| Squire → Divine Knight | Orb of Remembrance, King of the Remembered, Gamer Strength | Statue and rare-bag farming (Stale sheet) |
| Bowman → Siege Breaker | Symbols of Beyond ~G, Adaptation Revelation, Skill Ambidexterity, Archlord of the Pirates | Sailing |
| Hunter → Beast Master | Whale Wallop, Shining Beacon of Egg, I Dream of Peace and Egg | Breeding |
| Wizard → Elemental Sorcerer | Polytheism, Wormhole Emperor, Symbols of Beyond ~P | Divinity, multikill |
| Shaman → Bubonic Conjuror | Purple Tube, Green Tube, Essence Transferral, Upload Squared | Lab |

## Preset drift detection

A preset has **drifted** when it no longer serves the job it exists for, or when it disagrees with the build order for its role. All rules below read Toolbox fields only (ADR 0005). Thresholds are proposals for the decision tickets (L) unless marked.

**Step 1: classify each preset's role** from where its points sit. Fighting-tagged talents: Gilded Sword 6, Sharpened Axe 5, the Idle fighting talents 88/268/448, the class tab-1 damage talents 86/266/446, and the tab-2/3 attacks and damage passives. Skilling-tagged talents: the efficiency talents 85/263/445, Idle Skilling / Active AFK'er 89/449, and the skill talents of tabs 2–3. Role = the larger sum. On our 11 characters this split cleanly: every non-empty preset was at least 80% one role, and most were above 95% (H on fixtures).

**Step 2: rules** (each a candidate Fix-before-you-leave Next Action):

| # | Rule | Fields | Fixture hits (of 11) |
|---|---|---|---|
| D1 | Active preset's role ≠ AFK activity (`afkType` FIGHTING vs a skill) | `selectedTalentPreset`, `talents`, `afkType` | 2 |
| D2 | Other preset empty (all `baseLevel` 0) and class Lv ≥ 15 | `talentPreset.talents` | 5 |
| D3 | AFK fighting with the Idle fighting talent at 0 | `flatTalents[88/268/448]`, `afkType` | 6 of 8 fighters |
| D4 | AFK fighting with fewer than 2 attack talents on the bar (Printer Sampling and Roll Da Dice don't count) | `talentsLoadout` | 1 |
| D5 | One tab of the active preset has far fewer points than the same tab on the other preset (e.g. 0 vs 115). Points were likely left unspent after a reset or swap | per-tab `baseLevel` sums | 1 |
| D6 | Skilling preset without that skill's attack on the bar (Big Pick for mining, Log On Logs for choppin) | `talentsLoadout`, `afkType` | 0 |
| D7 | Accuracy-stat talent levelled while `hitChance == 100` with surplus (needs Toolbox damage) | `flatTalents[10/11/12]`, `getMaxDamage` | not computed |
| D8 | Talent above the build's target while a higher-priority talent is below its target (needs a per-class template in the Knowledge Base) | template diff | not computed |
| D9 | Bottle/vessel/flask talent levelled while its class bubble ≤ 100 | `flatTalents`, bubbles | not computed |

- **Template diff (D8).** Encode each build above as an ordered list of (talentId, targetLevel) per preset role. The drift score is the number of priority inversions: a talent at its target while an earlier one is below. The Next Action names the first under-target talent. A reset is suggested only when inversions waste ≥ X points that can't be reached by new points within the next few levels (L).
- **Never suggest a reset for D1 or D2:** the fix is a swap (D1) or spending on the empty preset (D2). Resets are for D7/D8, when the points are locked in the wrong talents.
- **Unspent points:** Toolbox does not compute available talent points, so D5 is a proxy. A true check would need `TotalTalentPoints` ported, which ADR 0005 forbids. It would have to come from Toolbox upstream.

## Code vs wiki vs community

- **Tab-4 points:** the code says above class Lv 89; the wiki category page (2025-04-17) says above Lv 50. The code wins.
- **Sub Class Swap Token:** the code resets all non-star talents on both presets; the wiki says "Refunds spent Tab 3 Talent Points". The code wins.
- **Preset swap "Must be in Town":** the text exists, but the code allows a swap on any map below class Lv 10,000.
- **Sir_Grimtide Bowman build:** names Idle Brawling (Warrior) on the Archer tab 1. The Archer equivalent is Idle Shooting.
- **The Toolbox "Community Guide" builds** (imported 2026-04-26 from the old curated `data/builds.json`) carry version tags v1.23 and v1.40b. Those are the 2021–22 game versions. Several still match current talent data, but treat them all as **Stale** until a 2026 source agrees.

## Open questions

- **Reddit pass not done** (Arctic Shift rate-limited, HTTP 429). Search `comments/search?subreddit=idleon&body=talent preset|chronus|idle brawling|reset potion` for 2026 threads.
- Base number of food slots per character, and the full list of free food-slot sources in W1–W3 (only the Gem shop and the W3 merit are confirmed).
- Whether star-tab pages 2–3 need an unlock.
- Whether the gem-shop Elite Class Swap is still sold (Toolbox `lastSeen 2.3.40`).
- How to read `AttackLoadoutpre_<n>`, the inactive preset's attack bar, which Toolbox does not parse. Needed for rule D4 on the inactive preset.

## Sources

- Game client: [legendsofidleon.com/ytGl5oc/N.js](https://www.legendsofidleon.com/ytGl5oc/N.js), Last-Modified 2026-10-17 01:42:35 GMT, `Luminous_Menagerie_v1.23`. Symbols and offsets cited inline.
- IdleOn Toolbox [@ 6827d3f (2026-10-17)](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1): `parsers/{talents,character,damage,items,misc,starSigns}.ts`, `utility/hit-chance.mjs`, `utility/wiki/growth.mjs`, `data/website-data/{talents,classPromotions,items,crafts,gemShop,quests}.json`, `data/builds.json` (legacy curated builds), `.env.production`.
- Toolbox community builds API, read 2026-10-17: [ih5wAK](https://idleontoolbox.com/tools/builds/view?id=ih5wAK), [CngknO](https://idleontoolbox.com/tools/builds/view?id=CngknO), [SFipox](https://idleontoolbox.com/tools/builds/view?id=SFipox), [xqKgSd](https://idleontoolbox.com/tools/builds/view?id=xqKgSd), [b0sGrY](https://idleontoolbox.com/tools/builds/view?id=b0sGrY), [KvgS3N](https://idleontoolbox.com/tools/builds/view?id=KvgS3N), [K4c9A0](https://idleontoolbox.com/tools/builds/view?id=K4c9A0), [qncFFv](https://idleontoolbox.com/tools/builds/view?id=qncFFv), [aCmcE6](https://idleontoolbox.com/tools/builds/view?id=aCmcE6), [RjrEMb](https://idleontoolbox.com/tools/builds/view?id=RjrEMb), [0mzeGL](https://idleontoolbox.com/tools/builds/view?id=0mzeGL). Create and update dates are inline. Ranked by likes.
- idleon.wiki, last-edit dates read 2026-10-17: [Classes](https://idleon.wiki/wiki/Classes) 2026-10-13, [Talent Book Library](https://idleon.wiki/wiki/Talent_Book_Library) 2026-10-12, [Star Signs](https://idleon.wiki/wiki/Star_Signs) 2026-10-05, [Talent Point Reset Potion](https://idleon.wiki/wiki/Talent_Point_Reset_Potion) 2026-10-05, [Sub Class Swap Token](https://idleon.wiki/wiki/Sub_Class_Swap_Token) 2026-10-05, [Special Talents](https://idleon.wiki/wiki/Special_Talents) 2026-10-05, [Tools](https://idleon.wiki/wiki/Tools) 2026-10-03, [Weapons](https://idleon.wiki/wiki/Weapons) 2026-10-03, [Armor](https://idleon.wiki/wiki/Armor) 2026-09-23, [Food](https://idleon.wiki/wiki/Food) 2026-09-13, [Upgrade Vault](https://idleon.wiki/wiki/Upgrade_Vault), [Changelog 2025](https://idleon.wiki/wiki/Changelog_2025), [Category:Talent Points](https://idleon.wiki/wiki/Category:Talent_Points) 2025-04-17 (**Stale**).
- Community sheet: "Talents guide" by Fibster / Tetsu, [pubhtml](https://docs.google.com/spreadsheets/d/e/2PACX-1vST3HcgBgeq8H9jztaMhUXZAAAHl120PvDVo_48qJpn6n9qnpa-TWmuG_kN9cmtr66M-OtO482XIOAk/pubhtml), last changelog entry 2024-07-12 (**Stale**). Used only to corroborate.
- Fixtures (read only, not committed): `fixtures/private/yasser.parsed.json` (W2), `joseph.parsed.json` (W3). Only aggregate counts are reported.
