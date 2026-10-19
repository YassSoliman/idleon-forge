# Death Note dossier (M26)

Verified 2026-10-19 against Toolbox @6c37e3d (game 2.3.540). `V/` = `packages/toolbox-parsers/vendor/`; `TB/` = `V/parsers/`; `SD` = `V/data/website-data/shared-data.json`. Tiers: 1 game data/Toolbox code, 2 Toolbox logic/dashboard, 3 wiki, 4 community. Prior research: `origin/research/w3-systems:docs/research/systems/w3-systems/worship-trapping-death-note.md` (2026-10-17, game v1.23 client N.js offsets, UNVERIFIED-HERE at 2.3.540, but every number re-checked below against the 2.3.540 Toolbox code). Search budget was exhausted and Reddit blocked the fetcher, so no tier-4 community priority list could be retrieved: stage advice below is derived from tier-1 numbers and flagged so.

## Death Note

- **What it is:** An account-wide kill ledger. Each non-boss, non-crystal monster of Worlds 1-7 earns rank points at kill thresholds; a world's summed points become "+1% Multikill per damage tier" for fights in that world. A second page (mini-bosses) adds to every world. Multikill adds extra kills and extra base drops (base drop-table resource only, cards excluded, wiki tier 3, conf M) when a character's damage exceeds 2x the monster's HP (5x on W7+ maps, map index >= 300) and then each further power of that factor. Conf H. [C1][C2][C3][C14][C15]
- **Unlocks:** The ledger itself counts from the first kill (no gate in the parser) [C4]. It only pays once the Death Note building (W3 Construction, `Death_Note`, tower index 2) is Lv >= 1: the Toolbox kill-per-kill overkill gate is `0.5 < towersTwo` (i.e. building level > 0) [C16]. First level costs 10 Explosive Salts [C9]. The mini-boss page needs the W6 Jade Emporium upgrade "Revenge of the Pickle" per wiki [C25]; Toolbox does NOT gate it (see open questions).
- **Scope:** Kills are account-wide (summed over all characters). The kill ledger is account-wide and multikill works on both levels (wiki); the multikill VALUE is per character: it depends on the world the character fights in (`floor(mapIndex/50)`), that character's damage tier, accuracy and personal bonuses. [C4][C5][C17]
- **Inputs -> outputs:** In: kills of each page mob, from any character, AFK or active, multiplied by Kill-per-Kill sources. Out: rank points -> per-tier multikill -> extra kills (feeds the ledger again) and extra base resource drops; plus Eclipse Skull damage, Tome score, Lab, Hole, Killroy, Nebulyte quest, achievements. [C6][C18][C26-C33]
- **Goals and Milestones:**

| Kills (per mob) | Rank points | Skull (wiki) | Source |
|---|---|---|---|
| 25,000 | 1 | Copper | [C7][C24] |
| 100,000 | 2 | Silver | [C7][C24] |
| 250,000 | 3 | Gold | [C7][C24] |
| 500,000 | 4 | Platinum | [C7][C24] |
| 1,000,000 | 5 | Diamond | [C7][C24] |
| 5,000,000 | 7 | Emerald | [C7][C24] |
| 100,000,000 | 10 | Sapphire (wiki; the W5/W6 achievements call this tier Lava, conf M) | [C7][C24] |
| >1,000,000,000 (strictly) | 20 + 5% mult. damage | Eclipse (1B; needs Rift bonus Eclipse_Skulls) | [C8][C28][C24] |
| Mini-boss page: 100/250/1k/5k/25k/100k/1M | 1/2/3/4/5/7/10 | none | [C10] |

  Page maxima (without Eclipse): W1 15 mobs = 150, W2 11 = 110, W3 14 = 140, W4 13 = 130, W5 13 = 130, W6 14 = 140, W7 24 = 240; mini-bosses 10 x 10 = 100. [C11]
- **Feeds / fed by:** Fed by kills: Kill-per-Kill [C18], Killer's Brightside (Lab, x2 kills) [C20], Rift Jocund, Squirrel, Glimbo and Crystal Glunko companions [C21][C45], Royal Statue 2 (Extra Kills) [C46], Monster Decimator talent, world-band gear and Big Fish [C47], Nobisect major divinity (x2) [C22], Fibers of Absence prayer, Skulltrick vault upgrade [C19], bubble KILL_PER_KILL. Feeds: multikill, Rift Eclipse Skulls [C28], Tome kill digits [C29], Lab Fungi Finger Pocketer [C30], Hole Deathnote pts [C31], Killroy damage (reads Killroy's own KRbest records, not the Death Note ledger) [C32], Nebulyte quest [C33], Menagerie (W7) [C34], Summoning career wins [C35].
- **Per-session actions:** Check the building has a level and a build slot [C9]. Look for mobs within reach of their next threshold, and whether AFK fighters sit on a mob already past the threshold you care about while a sibling is just under one. Idle/wasted = a fighter on a mob far beyond its useful threshold (e.g. > 100M) with siblings under 25k. Capped = mob at >= 100M (or Eclipse). Visit the Death Note once for Nebulyte step 1. [C33]
- **AFK Setup implications:** Fighting AFK targets on page mobs the character overkills (damage >= 2x HP, or 5x on W7+ maps; accuracy > 1.5x Defence) so multikill actually fires [C16]. Spread characters across the lowest-ranked mobs of the world with the best multikill need; Barbarians feed both Death Note and Apocalypse kills. [C5]
- **Min-max by stage:** see section below.
- **Common mistakes:** Death Note building left at Lv 0 (ranks bank but the overkill gate stays shut) [C16]; building not in a Construction slot; farming a mob far past its next big jump while siblings sit under 25k; fighting a mob the character cannot overkill [C16]; forgetting Rift-gated Eclipse (>1B kills strictly) [C8]; assuming W1 kills help W3 multikill (only the world you fight in counts, plus the mini-boss page) [C15]. Detect from `account.deathNote[w].mobs[].kills`, `account.towers.data` (Death_Note level, inProgress), `account.towers.towersTwo`.
- **Save and Toolbox fields:** see catalogue.
- **Sprites needed (user request: build sprites for new things):** `sys-death-note` exists (`apps/activeon/src/art/sprites/grids/systems.ts`, ~L858). New: a 7-step skull ladder icon set (Copper, Silver, Gold, Platinum, Diamond, Emerald, Lava/Eclipse) plus Eclipse (Rift) badge, a mini-boss/pickle page icon, and a damage-tier pip. Names are wiki tier 3 [C24]; exact in-game names beyond Copper/Golden/Dementia/Lava are only confirmed by achievement text [C23].
- **Sources:** inline, tiered, all verified 2026-10-19.

## Mechanics catalogue

M1. **Kill ledger (per mob).** `kills[mapIndex] = mapPortals[map][0] - KillsLeft2Advance[map][0]` per character, summed over characters by `getAllCharactersKills`, looked up by `mapEnemies[rawName]`. Field: `characters[].kills[]` -> `account.deathNote[world].mobs[].{rawName,displayName,kills}`. Missing = 0. Note the per-character value is the portal requirement minus KillsLeft2Advance, not a raw counter. [C4]

M2. **Rank per mob.** `rank = last threshold <= kills` from `DEATH_NOTE_RANKS` [[25e3,1],[1e5,2],[25e4,3],[5e5,4],[1e6,5],[5e6,7],[1e8,10]]; if kills > 1e9 and Rift bonus `Eclipse_Skulls` unlocked -> 20. Field: world `rank` = sum over mobs: `account.deathNote["0".."6"].rank`. [C7][C8]

M3. **Page membership (W1-W4).** deathNote list (SD.deathNote, `world` 0-3): W1 (15) Green Mushroom, Red Mushroom, Frog, Bored Bean, Slime, Baby Boa, Carrotman, Glublin, Wode Board, Gigafrog, Poop, Rat, Walking Stick, Nutto, Wood Mushroom. W2 (11) Sandy Pot, Mimic, Crabcake, Mafioso, Sand Castle, Pincermin, Mashed Potato, Tyson, Moonmoon, Sand Giant, Snelbie. W3 (14) Sheepie, Frost Flake, Sir Stache, Bloque, Mamooth, Snowman, Penguin, Thermister, Quenchie, Cryosnake, Bop Box, Neyeptune, Dedotated Ram, Bloodbone. W4 (13) Purp Mushroom, TV, Donut, Demon Genie, Soda Can, Flying Worm, Gelatinous Cuboid, Choccie, Biggole Wurm, Clammie, Octodar, Flombeige, Stilted Seeker. Bosses and crystal mobs excluded. W5+: world 4 (13), 5 (14), 6 (24). Data index `world` 0-6 = W1-W7; `account.deathNote[world]`. [C11][C12]

M4. **Mini-boss page.** 10 mobs `ninjaExtraInfo[30]` (Glunko the Massive, Dr Defecaus, Baba Yaga, Biggie Hours, King Doot, Dilapidated Slush, Mutated Mush, Domeo Magmus, Demented Spiritlord, Verminous), kills from raw `Ninja[105][i]`, ranks from `MINI_BOSS_DEATH_NOTE_RANKS`. Field `account.deathNote.miniBosses.{rank,mobs}`. Bone Joe Pickle items in inventory credit `pickles+1` kills per mini-boss kill. W6 unlock per wiki. The mini-boss page has no Eclipse (20-point) equivalent; its max is 10 pts per boss. (conf H, code C10) [C10][C25][C36]

M5. **Death Note building.** Tower index 2, max Lv 51, `bonusInc` 1.23, `costInc` [2,50], first-level item cost 10 Explosive Salts (`Refinery2`). Build points cost `randomList[13][2] x 1.23^level` (`getBuildCost`, "2250" base). Each level adds `+2` base multikill in all worlds (`2 x towers.towersTwo`). No extra max-level sources apply (the max-level extender only matches maxLevel 50/101/100/15). Field `account.towers.data[name=Death_Note].{level,inProgress,progress,nextLevel,itemReq}`, `account.towers.towersTwo`, ActiveOn `account.buildings.deathNote`, `account.deathNoteBuilding`. [C9][C13][C16]

M6. **Overkill gate and damage tiers.** Overkill (the kill-per-kill gate) active iff `maxDamage >= (mapIndex>=300 ? 5 : 2) x monsterHP` AND `towersTwo > 0.5` (Death Note building level > 0) AND `accuracy > 1.5 x monster Defence`. Conf H, code verified, correction from the source lens applied. Tiers: starts at 1; tier N when `maxDamage >= 2 x HP x 2^N`... in code `tiers=i+2 if maxDamage >= exp*HP*exp^(i+1)`, i<50. Field: Toolbox `playerInfo.multiKillTiers`. [C16][C37]

M7. **Multikill total.** `base + tiers x perTier`; contribution counts only while overkilling. W7+ maps (index >= 300): both halves go through the diminishing curve (breakpoints 20/50/100/150/200/250). [C14][C37]

M8. **Base multikill (all worlds).** Star sign `Total_Multikill` (Cullingo 15 [C38]); Salt Lick Purple Salt (idx 8, 3 per level, max 10 = +30) [C39]; stamp `Overkill` = Multikill Stamp (+1/level, `add`) [C40]; Death Note building 2/level; gear etc 29 + obols; achievement 148 Too Cute To Live (+5, capped min(5,x)); achievement 122 Wazzzzam! (+6, 125 dungeon rooms); achievement 123 Just Passing By (+2, 30 rooms); Monolithialism talent x unique Onyx statues. [C41][C42]

M8b. **W7+ and base notes.** Overkill stamp (StampC19) and Slowergy Drink vial (stat Overkill) are the base multikill entry points for newer accounts. On map >= 300 both base and per-tier go through `getMultiKillDiminished` (breakpoints 20/50/100/150/200/250; top slope 1/50), and Clamworks (map 306) always uses the W7 page. Conf H. [C37]

M9. **Per-tier multikill.** `rank(world of fight) + miniBossRank` + vial `Overkill` (Slowergy Drink, Frigid Soul + Liquid3) + Void Radius y (Voidwalker/Infinilyte speedrunning only) + MASTER_OF_THE_SYSTEM x floor(speedrun highscore opt 158 / 5) + Arcade `Multikill_per_Tier` (x1=10, x2=100, decay) + artifact Trilobite Rock (base 25) + Mana Is Life y + lab chip 14 (Wood Chip, base 15) + gear etc 71 + obols + Hole measurement t=9 + card (Clammie 1.5 W4, Suggma 2, Woodlin Spirit 3, Sovereign Emperor 20) + star sign `Multikill_Per_Tier` (Killian Maximus 3) + prayer Balance of Pain (x1 8, maxLevel 30, curse -Def/Acc) + shiny pet + Post Office Utilitarian Capsule (stat 13b x1 15) + bubble MR_MASSACRE (c15, x1 90, decay) + card set CardSet9 (Spirited Valley, 6). [C14][C43]

M10. **Kill-per-Kill (KPK).** `labMulti x companions x royal statue x gear(etc 96,103) x (1+(worldGear+Death Bringer family+vote)/100) x Nobisect x (1 + additive/100)`; additive = STR/AGI/WIS stat talents (Charred/Stacked/Memorial Skulls per 1000 stat), Monster Decimator, multikill total (only while overkilling), bubble KILL_PER_KILL (a18), prayer Fibers of Absence (x1 30, x2 15, maxLevel 50, unlock wave 21), Bubblegum Law charm, exotic crop 56, legend talent 16, Bubba, Upgrade Vault 64 Skulltrick, friend bonus 6. Stat talents zeroed from W7 (map index >= 300; W6 maps 250-299 stay undiminished). Companion factors, all `1 + bonus`: Rift Jocund idx 14, Royal Statue 2, Crystal Glunko idx 168 (`1 + 0.2 x bonus`), Squirrel idx 29, Glimbo idx 154. World-band term: map 50-100 etc 70, 100-150 etc 68, 150-200 etc 69, 200-250 etc 73, 250-300 etc 90; map 300-349 uses advice Big Fish 3 + etc 105. Conf H. [C45][C46][C47] [C18][C19][C44]

M11. **Eclipse Skulls bonus.** Rift bonus `Eclipse_Skulls`: `5 x (count of mobs with rank >= 20)` over worlds 0-5 (not W7, not mini-bosses) = multiplicative damage. [C28]

M12. **Tome kill digits.** `sum over all pages and mobs of ceil(log10(kills))` (`calcTotalKillsDigits`; includes mini-boss page, since it iterates all deathNote keys). Field `account.tome`. [C29]

M13. **Cross-system readers.** Lab Fungi Finger Pocketer: floor(GreenMushroom kills/1e6) x 2% extra cash, separate from rank [C30]; Hole measurement 'Deathnote pts' = sum of world ranks 0-6 (no mini-bosses), multi i=99: /125 [C31]; Killroy (**Disputed**): original draft said page kills feed it; gamedata lens refuted: it is `1 + floor((sum of Killroy KRbest over death-note mobs)^0.4)/100`, Killroy's own best-kill records, not the ledger. Adopt the correction, conf M [C32]; Summoning careerWins per world [C35]; Menagerie uses mini-boss rank [C34].

M14. **Quests/achievements.** Nebulyte "Species Slayer": 1M kills on all 40 W1-W3 mobs (15+11+14) then visit Death Note [C33]. Skull achievements: Blunder Skull (Copper on all W1, reward RNG item unlock), Saharan Skull (Gold on all W2, +1% Printer Sample Rate), Blurple Skull (Dementia on all W3, 30 gems + 5 72hr candy), Lavathian Skulls (Lava on all W5, -2% W5 respawn), W6 is Donezo (Lava on all W6, 1.01x DMG) [C23]. Wiki naming differs: Copper/Golden/Dementia/Lava (achievements) vs Copper/Silver/Gold/Platinum/Diamond/Emerald/Sapphire/Eclipse (wiki); treat tier-3 skull names as medium confidence. No W4 skull achievement exists in data. [C23]

W5+ one-liners: W5 page (13 mobs, Hole pts, Lava skull achievement); W6 page (14 mobs, Lava achievement, Jade pickle mini-boss page); W7 (24 mobs) uses diminishing curve and exponent 5, KPK stat talents off; Eclipse bonus counts worlds 0-5 only. [C11][C28][C37]

## Min-max by stage

All lines are derived from tier-1 numbers unless a tier is given; no tier-4 priority list was retrievable (search quota exhausted, Reddit blocked), so confidence is M/L.

- **Rank cost per point (any world).** 25k = 1 pt (25k/pt), then +75k for +1, +150k for +1, +250k for +1, +500k for +1, then 4M kills for +2 (2M/pt), then 95M for +3, then 900M for +10 (rift). Cheapest points are always the first three ranks on every mob. Rule: raise the lowest mob first. [C7][C8] (derived, M)
- **W1 early (before W3):** Death Note does nothing yet (building needs W3 salts). Kill what you farm; target 25k Copper on each W1 mob; the Blunder Skull achievement needs Copper on all 15. Keep AFK on maps you overkill. [C16][C23] (M)
- **W1 mid/late:** Push W1 mobs to 100k-250k while levelling; each W1 point only helps fights in W1 maps. W1 is easy to maximize cheaply because kills are fast with high Kill-per-Kill. [C15][C44] (derived, M)
- **W2 early/mid:** Same ladder; Saharan Skull needs Gold (250k) on all 11 W2 mobs. [C23] (M)
- **W3 early:** Build the Death Note (10 Explosive Salts, then up to 13.3K to Lv 51 per wiki). Each level = +2 base multikill in every world, so building levels is the single flat gain independent of kills. [C9][C13] (H)
- **W3 mid:** Unlock Fibers of Absence (prayer, wave 21) for more kills; set Kill-per-Kill bubble; Purple Salt (Salt Lick idx 8) for +3 base per level, max +30; Multikill Stamp; Slowergy Drink vial (Frigid Souls). These raise multikill in all worlds. [C18][C39][C40][C43] (M)
- **W3 late / W4 entry:** 1M on all 40 W1-W3 mobs for Nebulyte step 1 (Voidwalker line); Blurple Skull needs Dementia on all W3. Balance of Pain prayer; MR_MASSACRE bubble; Utilitarian Capsule post office; Wood Chip lab chip; Arcade Multikill; W4 card Clammie (1.5). [C33][C43] (M)
- **W4:** Fill the W4 page (13 mobs x 10 = 130 pts max); start 100k+ on every W4 mob with high Kill-per-Kill sources (Lab Killer's Brightside x2, Rift Jocund companion 2x base / 2.5x upgraded in code (text says 3x, Disputed), Nobisect x2). Tome rewards digits: each extra digit of kills on any mob adds a point, so pushing every mob past 10^5/10^6 is worth Tome score. [C20][C21][C22][C29] (M)
- **W4+ outline:** Mini-boss page via Jade pickle; 5M Emerald where cheap; Eclipse (1B) only after the Rift bonus; W7 changes the curve. [C10][C25][C37]
- **Per class:** no class difference in the ledger. Barbarian benefits doubly (kills feed Apocalypse). Voidwalker/Infinilyte get Void Radius y during speedruns. Death Bringer family bonus feeds KPK. [C5][C14][C44]

## Open questions

1. Death Note building item cost scaling per level (wiki: 13.3K to max; data itemReq has only the Lv1 cost of 10; the Toolbox parser has no per-level item formula). ActiveOn only needs Lv0 -> Lv1.
2. Whether the mini-boss page is gated by the Jade upgrade in the game: Toolbox adds `miniBosses.rank` to per-tier multikill ungated, wiki says the upgrade is required.
3. Exact skull names above Gold in the game (wiki: Platinum/Diamond/Emerald; achievements: Dementia, Lava).
4. Community meta priority order (Reddit, Steam guides) could not be fetched; stage lines are derived.
5. Whether extra drops from multikill apply to all resource types; wiki says only the first (base) drop.

## Claims

Sources abbreviations: TB = `packages/toolbox-parsers/vendor/parsers/`.

- [C1] Death Note ranks give world multikill per damage tier. TB/damage.ts#L1656-L1693 (function starts L1656) (tier 1), 2026-10-19, game 2.3.540.
- [C2] Multikill gives extra kills only while overkilling. TB/damage.ts#L1599-L1606 (tier 1).
- [C3] Wiki: multikill affects base resource only. https://idleon.wiki/wiki/Multikill (tier 3, 2026-10-19).
- [C4] Kills per mob are summed over characters from `kills[map]`. TB/world-3/deathNote.ts#L38-L48 and TB/character.ts#L464-L466 (tier 1).
- [C5] Per-tier rank uses the world of the map, `floor(mapIndex/50)`. TB/damage.ts#L1657 (tier 1).
- [C6] Extra kills count in the ledger. TB/damage.ts#L1503-L1612 (tier 1, inferred); prior dossier (tier 4).
- [C7] DEATH_NOTE_RANKS thresholds. TB/world-3/deathNote.ts#L63 (tier 1).
- [C8] Eclipse: kills strictly > 1e9 and Rift bonus gives rank 20. TB/world-3/deathNote.ts#L66-L74 (tier 1).
- [C9] Building first-level cost 10 Explosive Salts, maxLevel 51. SD towers.Death_Note (tier 1); wiki https://idleon.wiki/wiki/Construction (tier 3).
- [C10] Mini-boss ranks [100,1]...[1e6,10]; kills from Ninja[105]. TB/world-3/deathNote.ts#L9-L22,L64 (tier 1).
- [C11] Per-world mob counts 15/11/14/13/13/14/24 and 10 minibosses. SD deathNote, ninjaExtraInfo[30] (tier 1).
- [C12] Page membership lists W1-W4. SD deathNote and monsters.json (tier 1).
- [C13] Death Note adds 2 base multikill per level. TB/damage.ts#L1620-L1640 (`2 * towers.towersTwo`) (tier 1); wiki https://idleon.wiki/wiki/Construction (tier 3).
- [C14] MultiKill = base + tiers x perTier. TB/damage.ts#L1741-L1752 (tier 1).
- [C15] Only the fought world's page counts, plus mini-bosses everywhere. TB/damage.ts#L1657-L1661 (tier 1).
- [C16] Overkill gate: maxDamage >= (mapIndex>=300 ? 5 : 2) x HP, `towersTwo > 0.5`, accuracy > 1.5 x Def. TB/damage.ts#L1511 (tier 1).
- [C17] Multikill value is per character (gear, obols, star signs, prayers, bubbles, talents); the wiki Multikill page says kills are account-wide and multikill applies at both levels. https://idleon.wiki/wiki/Death_Note, https://idleon.wiki/wiki/Multikill (tier 3, rev. 2025-11-14); TB/damage.ts#L1620-L1693 (tier 1).
- [C18] KPK formula. TB/damage.ts#L1503-L1612 (tier 1).
- [C19] Skulltrick vault upgrade index 64 (all monster kills count +% more for opening portals; additive term in kill-per-kill, text does not name Death Note). SD upgradeVault[64] (tier 1).
- [C20] Killer's Brightside x2 kills. SD labBonuses index 4 (tier 1).
- [C21] **Disputed.** Rift Jocund (idx 14): base 2x. Upgraded text says 3x but `upgradedBonus` = 1.5 and Toolbox applies `1 + bonus` = 2.5x. Record both views; code math 2.5x conf M, in-game text 3x conf L. Squirrel (idx 29) 1.5x/1.75x consistent. V/data/website-data/companions.json, TB/damage.ts#L1503-L1612 (tier 1).
- [C22] Nobisect major: 2x kills for portals and Deathnote. SD gods (tier 1).
- [C23] Skull achievements. V/data/website-data/achievements.json idx 147, 158, 168, 308, 384 (tier 1).
- [C24] Wiki skull names and thresholds: Copper, Silver, Gold, Platinum, Diamond, Emerald, Sapphire (100M), Eclipse (1B). https://idleon.wiki/wiki/Death_Note (tier 3, rev. 2025-11-14; pre-patch relative to 2.3.540 but thresholds match code; earlier draft mislabelled 100M).
- [C25] Mini-boss page via Jade "Revenge of the Pickle" (jadeUpgrades idx 7). SD jadeUpgrades (tier 1); wiki (tier 3).
- [C26] Eclipse Skulls multiply damage by 5 per skull. TB/world-3/deathNote.ts#L78-L93 (tier 1).
- [C27] Nebulyte quest requires 40 mobs at 1M. V/data/website-data/quests.json Nebulyte step 1 (tier 1).
- [C28] Eclipse bonus counts worlds 0-5 only. TB/world-3/deathNote.ts#L81-L82 (tier 1).
- [C29] Tome kills digits. TB/world-4/tome.ts#L330 and deathNote.ts#L95-L101 (tier 1).
- [C30] Lab Fungi Finger Pocketer uses Green Mushroom kills /1M. TB/world-4/lab.ts#L234 (tier 1).
- [C31] Hole 'Deathnote pts' = sum of world ranks, mini-bosses excluded. TB/world-5/hole.ts#L512-L514,L573-L576 (tier 1).
- [C32] **Disputed.** Original: Killroy multiplier from Death Note page kills. Gamedata lens: `getKillRoy` sums KRbest (Killroy records) over death-note mobs; multiplier `1 + floor(total^0.4)/100`. Correction adopted. TB/misc.ts#L1588-L1591 (tier 1).
- [C33] Nebulyte step 1 and visit Death Note. quests.json (tier 1).
- [C34] Menagerie reads mini-boss rank. TB/world-7/menagerie.ts#L282,L315 (tier 1).
- [C35] Summoning career wins per death-note world. TB/world-6/summoning.ts#L95-L121 (tier 1).
- [C36] Pickle credit `pickles+1` per kill. TB/misc/boneJoeCalculator.ts#L73-L75 (tier 1).
- [C37] Tier function and W7 exponent 5 and diminishing curve. TB/damage.ts#L1702-L1728 (tier 1).
- [C38] Cullingo star sign +15 Total Multikill; Killian Maximus +3 per tier. SD starSigns (tier 1).
- [C39] Purple Salt: 3 per level, max 10, idx 8. SD saltLicks[8], TB/world-3/saltLick.ts#L34-L40 (tier 1).
- [C40] Multikill Stamp (StampC19) `Overkill`, add x1=1. V/data/website-data/stamps.json (tier 1).
- [C41] Achievements 148/122/123 give 5/6/2 multikill. achievements.json (tier 1).
- [C42] Monolithialism talent per unique Onyx statue. TB/damage.ts#L1620-L1640, talents.json (tier 1).
- [C43] Per-tier source list and values (vial, arcade, artifact, chip, cards, prayer, post office, bubble, card set). TB/damage.ts#L1656-L1693 plus SD/cards.json/vials.json (tier 1).
- [C44] KPK source values (Fibers of Absence, KILL_PER_KILL bubble, stat talents). SD prayers, cauldrons.json, talents.json (tier 1).
- [C45] Added: companions feeding kill-per-kill: Rift Jocund idx 14 (`1+bonus`), Squirrel idx 29 (`1+bonus`), Glimbo idx 154 (1.6x base / 2x upgraded, `1+bonus`), Crystal Glunko idx 168 (`1+0.2 x bonus`, 1.2x/1.3x extra kills). companions.json; TB/damage.ts#L1556-L1562 (tier 1, 2026-10-19).
- [C46] Added: Royal Statue 2 (Extra Kills) multiplies kill-per-kill as `1 + statue/100`; 0 without a Royal Guardian. TB/damage.ts#L1553-L1556, class-specific/royalGuardian (tier 1).
- [C47] Added: world-band gear: etc 70/68/69/73/90 by map band 50-300; map 300-349 uses Big Fish (advice fish 3) + etc 105; gear multipliers etc 96 and 103. TB/damage.ts#L1495-L1522 (tier 1).
- [C48] Added: further additive kill-per-kill sources: Pristine Charm Bubblegum Law, Exotic Market 56, Legend Talent 16, Bubba (Ring of Greed) allKills, Friend Bonus type 6, Death Bringer family bonus (FamBonus 28), Voting bonus 5, Monster Decimator. TB/damage.ts#L1535-L1585 (tier 1).
- [C49] Added: W7+ (map index >= 300) diminished multikill curve and disabled stat talents; Clamworks uses the W7 page. TB/damage.ts#L1702-L1760 (tier 1).
- [C50] Added: per-tier source detail: Void Radius (Voidwalker/Infinilyte during speedrun only), Master of the System scaled by accountOptions[158]/5, Trilobite Rock, Mana Is Life, lab chip 14, Measurement 9, Balance of Pain, shiny pet, Utilitarian Capsule, CardSet9, Mr Massacre bubble. TB/damage.ts#L1656-L1700 (tier 1).
- [C51] Added: Overkill stamp and Slowergy Drink vial are base multikill sources. stamps.json, vials.json, TB/damage.ts#L1620-L1640 (tier 1).
- [C52] Added: Hole measurement 6 (Overkill Quantity Summation) uses summed ranks with /125 multiplier; Tome points from total kill digits. TB/world-5/hole.ts#L512-L576, TB/world-4/tome.ts#L330 (tier 1).

## Confidence per claim (H/M/L)

H: C1, C2, C4, C5, C7, C8, C9, C10, C11, C13, C14, C15, C16, C18, C19, C20, C22, C23, C26, C27, C28, C29, C30, C31, C33-C45 (except C36 H), C46-C52. M: C3 (wiki only, unverifiable in code), C12 (order confirmed, full membership not individually listed), C17, C21 (Disputed), C24 (wiki tier 3, rev 2025-11-14), C25 (Toolbox does not gate it), C32 (Disputed, correction adopted). L: C6 (inferred, not modelled by Toolbox). Min-max stage lines remain M/L as already flagged.
