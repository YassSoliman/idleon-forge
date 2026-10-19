# Armor-set Smithy (W3, account-wide set bonuses)

- **Topic id:** `armor-smithy`. **Verified:** 2026-10-19. **Game version:** 2.3.540 (Toolbox pin `6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1`).
- **Shorthand:** `V:` = `packages/toolbox-parsers/vendor/` in the reference checkout; `data:` = `V:data/website-data/`. Tier 1 = game data / Toolbox code, 2 = Toolbox logic / wiki, 3-4 = community (ADR 0004; the task brief ranks wiki tier 3, community tier 4, and that numbering is used here).
- **Prior research:** none for this topic id. The `smithing` dossier section "E" (M24) covers the unlock flag fields; this dossier re-reads them and adds the 19-set catalogue, every consumer of each bonus, and recipes.
- **Research limits (honest):** the web-search budget was exhausted and reddit.com was not fetchable, so Reddit claims below are carried from the Knowledge Base source records (`packages/knowledge/systems/armor-smithy.yaml`), not re-read. No community set-priority guide was found; the "Min-max" priorities are therefore derived from Tier 1 data and marked as inference with confidence L/M.
- **Existing ActiveOn coverage:** `armor-smithy.check.hire`, `armor-smithy.check.register` (W1-W3 sets only, 9 of 19), `armor-smithy.fact.sets` (generated), engine `packages/engine/src/gear/smithy.ts`, page `armor-smithy` (`system-homes.ts`, `pages.ts: w23Page('ArmorSmithyPage')`), sprite `sys-armor-smithy` (`grids/systems.ts`) and `gear-helmet` (`grids/gear.ts`). No sprites exist per set. Parser fields read: `account.armorSmithy` (`gear.ts readArmorSmithy`).

## System dossier

- **What it is:** an NPC in Frostbite Towndra (W3 town) that turns a once-registered equipment set into a permanent, account-wide passive bonus, so no character has to wear the set. There are 19 sets (Copper to Prehistoric plus the Secret set). [C1][C2][C3]
- **Unlocks:** the Smithy can be hired when `ServerGemsReceived + 1500 x (bundle bun_c owned) >= 2000` or when the account-day counter `OLA[381]` reaches 30 (`1 > round(30 - days)`). Hiring flag is `OLA[380]`. Wiki says to "Craft the whole set, equip the whole set, click on one equipped item in the set". The 30-day clock counts from account age, not from reaching W3 (M18 spec F-g finding on two fixtures). [C4][C5][C6][C7][C8]
- **Scope:** account-wide. The registered list is global; the register action and the "worn in full" fallback are evaluated on the one logged-in/most-recently-AFK character. [C9][C10]
- **Inputs -> outputs:** input is a full set (all armour pieces + N tools of the set's tool list + 0/1 weapon of the set's weapon list) on one character, then one click on a worn piece. Output: the set's `bonusValue` is read by `getArmorSetBonus` wherever a mechanic consumes it. Pieces are not consumed by registering (wiki reports the old set can then be deleted; Reddit thread title only, unverified here). [C11][C12][C13]
- **Goals and Milestones:** see the set table in the Mechanics catalogue. Headline gates: Smithy opens day 30 or 2,000 gems; the cheapest 9 sets (Copper to Chizoar) are W1-W3; Lustre/Diabolical/Troll are W3-W4 craft; Magma is W4; Kattlekruk and Marbiglass W5; Godshard W6; Emperor/Prehistoric W7 (W5+ noted in one line each). [C14]
- **Feeds / fed by:**
  - Fed by: Anvil crafts and Smithing level ([Smithing](smithing.md)), boss drops (Amarok, Efaunt, Chizoar, Troll, Kattlekruk), W3 salts/bars, Gem Shop / bun_c bundle, account age.
  - Feeds: Mining/Chopping/Fishing/Catching efficiency, Class EXP, accuracy/defence, coin drop, drop rate, Skill EXP, AFK gains, damage, monster respawn, Tome, Lab/Divinity EXP, talent levels, Summoning winners, Ribbons/Exalted stamps, gold food. [C15]
- **Per-session actions:** (1) before day 30 and below 2,000 gems: nothing; show countdown. (2) When openable and `OLA[380]` unset: hire. (3) For each unregistered complete set, wear it on one character and tap a piece. (4) Before a crafting upgrade consumes a set piece (Gold armour eats Copper pieces, Platinum eats Gold and Iron pieces, Void eats Dementia ...), register the lower set first or craft a spare. Idle state: Smithy hireable but not hired; any complete-but-unregistered set. [C16][C17]
- **AFK Setup implications:** none directly (registered bonuses apply to AFK chars). Void set (+10% AFK Gains) and Diabolical (respawn) matter for the AFK Target choice only after registering. Wearing a full set on the active char counts without registration. [C10][C18]
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:** (a) never pressing Unlock after day 30 (reddit reminder thread); (b) crafting Gold/Platinum/Void armour from Copper/Gold/Iron/Dementia pieces before registering, so the lower set can never be completed; (c) registering with the wrong character logged in (sets are counted on the logged-in character); (d) assuming Marbiglass `+10% All Stat` is modelled by Toolbox (no consumer found); (e) Prehistoric listed as 2x on the wiki but the one Toolbox consumer caps the set at 50. Detect from `account.armorSmithy.sets[].unlocked`. [C19][C20][C21][C22]
- **Save and Toolbox fields:** see catalogue section F.
- **Sources:** inline per claim; claim list at the end.

## Mechanics catalogue

### A. Smithy gate (unlock and hire)

**M1. Unlock condition.** Rule `isSmithyUnlocked = 2000 <= ServerGemsReceived + 1500*hasBun_c || 1 > Math.round(30 - Number(days))`, `days = accountOptions[381] ?? 0`. Cost: free to hire. Cap: none. Field: `account.armorSmithy.isSmithyUnlocked`, `.days`. Source: `V:parsers/world-3/armorSmithy.ts#getArmorSmithy`. [C4][C5]

**M2. Hired flag.** `smithyUnlocked = accountOptions[380]` (truthy once hired). Field `account.armorSmithy.smithyUnlocked`; Account State `armorSmithy.hired`, `canHire` (`packages/account-state/src/gear.ts readArmorSmithy`). [C6]

**M3. Bundle contribution.** `bun_c` counts as 1,500 gems toward the 2,000 threshold: `isBundlePurchased(account,'bun_c')` = `account.bundlesOwned.bun_c === true`. (`bun_c` also gives +16 storage in `V:parsers/storage.ts:83`.) Field `account.bundlesOwned.bun_c`. [C7]

**M4. Account-day counter.** `OLA[381]` is "days"; it equals account age on both fixtures (M18 finding). Wiki/Reddit report a 30-day timer the player must press Unlock on. [C8]

### B. Registration

**M5. Registered list.** `accountOptions[379]` is a comma string; the first element is dropped (`[, ...unlockedSets] = split(',')`), the rest are set names such as `COPPER_SET`. Field `account.armorSmithy.unlockedSets`, per-set `sets[].unlocked`. [C9]

**M6. Parts-on rule (`GetSetBonus "PartsOn"`).** `partsOn = armorPiecesWorn + min(requiredTools, toolsHeldFromSetToolList) + (requiredWeapon==1 && any set weapon worn ? 1 : 0)`, evaluated on `getBestActiveCharacter(characters)` (most recent `afkTime`, else highest `addedLevels`). Armour pieces are read from `character.equipment` (rawName), tools from `character.tools`. Field `V:parsers/world-3/armorSmithy.ts#getSetPartsOn`. [C10]

**M7. Parts-required rule.** `partsReq = armors.length + requiredTools + requiredWeapon`. `sets[].equipped = partsOn >= partsReq`. [C10]

**M8. Effective bonus.** `getArmorSetBonus(account,name)` returns `bonusValue` when the set is `unlocked || equipped`, else 0. So a set worn in full on the active character counts even if never registered. [C11]

**M9. Smithy list order.** Sets are sorted by `randomList[113]`: COPPER, IRON, AMAROK, GOLD, PLATINUM, EFAUNT, DEMENTIA, VOID, CHIZOAR, LUSTRE, DIABOLICAL, TROLL, SECRET, MAGMA, KATTLEKRUK, MARBIGLASS, GODSHARD, EMPEROR, PREHISTORIC. Source `data:randomList.json[113]`. [C12]

### C. Set table (all 19; `data:shared-data.json#equipmentSets`)

Armour pieces are always required; "T" = tools required out of the tool list, "W" = weapon required (1 of the four class weapons). Tool list is Pickaxe, Hatchet, Fishing Rod, Net, Trap set, Skull (where present). [C13]

| # | Set | Bonus (bonusValue) | Armour pieces | T | W | World |
|---|---|---|---|---|---|---|
| 1 | Copper | +60% Mining and Chopping Efficiency (Toolbox: mining only) | Helmet, Platebody, Platelegs | 1 | 0 | W1 |
| 2 | Iron | +25% Class EXP Gain | Helmet, Platebody, Platelegs | 1 | 0 | W1 |
| 3 | Amarok | +40% Accuracy and Defence | Helmet, Bodyplate, Hinds, Paws | 0 | 0 | W1 boss |
| 4 | Gold | 1.5x Coins Dropped (50) | Helmet, Platebody, Platelegs, Boots | 1 | 1 | W2 |
| 5 | Platinum | +60% Fishing and Catching Efficiency | Helmet, Platbody, Shins, Boots | 1 | 1 | W2 |
| 6 | Efaunt | +25% Drop Rate | Helmet, Ribcage, Hipilium, Broken Ankles | 0 | 0 | W2 boss |
| 7 | Dementia | +50% Critters and Souls gained | Helmet, Body, Shins, Boots | 2 | 1 | W3 |
| 8 | Void | +10% AFK Gains | Void Imperium Helmet, Platebody, Shardshins, Kicks | 2 | 1 | W3 |
| 9 | Chizoar | +40% All Skill EXP Gain | Helmet, Bodyplate, Scaled Leggings, Walkers | 0 | 0 | W3 boss |
| 10 | Lustre | +75% Total Damage | Veil, Chestplate, Scales, Shieldshoe | 2 | 1 | W4 |
| 11 | Diabolical | +20% Faster Monster Respawning | Headcase, Abdomen, Trimed Leg Guards, Toe Tips | 2 | 1 | W4 |
| 12 | Troll | 1.25x Higher Bonuses from Tome (25) | Thin Veil, Trollish Garb, Twisted Scales, Soles | 0 | 0 | W4 boss |
| 13 | Secret | 1.25x Gold Food effect (25) | Mark of Member, Mittens of the Gods (EquipmentPunching11), Member Hoodie, Club Member trophy, Vman Nametag | 0 | 0 | special |
| 14 | Magma | +100% Lab and Divinity EXP Gain | Magma Core Headdress, Wavemaille, Battleskirt, Lavarunners | 3 | 1 | W4 |
| 15 | Kattlekruk | +5 LV for all Talents | Skulled Helmet, Serrated Chest, Spiked Leggings, Devious Slippers, Eternal Flames (cape) | 0 | 1 | W5 |
| 16 | Marbiglass | +10% All Stat | Headdress, Tunic, Legplates, Soles | 4 | 1 | W5 |
| 17 | Godshard | 1.15x Higher Winners Bonuses from Summoning (15) | Crown, Robe, Tatters, Drip of the Gods | 6 | 1 | W6 |
| 18 | Emperor | Ribbons and Exalted Stamps give 1.2x more multi (20) | Kabuto, Sokutai Ho, Zubon, Geta, Opal ring, Bramble pendant, Gilded Wings cape | 0 | 0 | W7 |
| 19 | Prehistoric | 2x EXP Gain in all World 7 Skills (100) | Battlehair, Parka, Pantaloons, Bracers | 6 | 1 | W7 |

Tool and weapon rawNames per set are in the generated fact `packages/knowledge/generated/armor-smithy.facts.json`. Notes: Gold weapons are Bandage Wraps / Royal Bayonet / Spiked Menace / Starlight; each later set's weapon is the upgrade of the previous (Platinum: Enforced Slasher / Pharaoh Bow / Crows Nest, Dementia: Uninflated Glove / Ice Breaker / Blizzard Bow / Spriggly Storm). Wiki lists the same bonuses and part counts (Tier 3 agreement). [C1][C13][C23]

### D. Consumers: where each bonus applies (formula and Toolbox path)

| Set | Formula use | Path |
|---|---|---|
| COPPER | additive in Mining Efficiency `(... + 10*mastery + (vote + copperSet))/100` and Chopping/Mining breakdown | `V:parsers/efficiency.ts:280,303` (`getMiningEffParts`) |
| IRON | additive term in Class EXP multiplier | `V:parsers/character.ts:2122` (`getClassExpMulti`) |
| AMAROK | Accuracy: `* (1 + (chip+meal+kangaroo+vote+amarok)/100)`; Defence: additive in the DEF bracket | `V:parsers/damage.ts:1029,1046` (`getAccuracy`), `:1402,1431` (`getPlayerDefence`) |
| GOLD | multiplicative `(1 + gold/100)` in Cash multiplier (coins dropped) | `V:parsers/character.ts:2820,2863` (`getCashMulti`) |
| PLATINUM | additive in Fishing efficiency (and Catching) | `V:parsers/efficiency.ts:453` (`getFishingEffParts`) |
| EFAUNT | additive in Drop Rate | `V:parsers/character.ts:2441,2499` (`getDropRate`) |
| DEMENTIA | additive in Soul gain "foodGroup" (with Bubba) and in Trap critter gain | `V:parsers/world-3/worship.ts:131,143`; `V:parsers/world-3/traps.ts:132` |
| VOID | additive `(compass + voidSet)` in AFK Gains | `V:parsers/character.ts:3276,3286` (`getAfkGain`) |
| CHIZOAR | plain addition in All-Skills EXP | `V:parsers/character.ts:1692` (`getAllSkillsExp`) |
| LUSTRE | additive in `accountBonusMulti` of Damage % | `V:parsers/damage.ts:323,427` (`getDamagePercent`) |
| DIABOLICAL | additive respawn speed `monsterRespawn / (1 + total/100)`; **only counted when `isRift`** (rift map) and zeroed for World 7 | `V:parsers/character.ts:1840,1853` (`getRespawnRate`) |
| TROLL | `extraBonus = 1 + (grimoire17 + troll)/100` multiplies Tome bubble multi and Spelunking lore (Tome score) | `V:parsers/world-4/tome.ts:222`; `V:parsers/world-7/spelunking.ts:553` |
| SECRET | `(1 + (secret + 50*companion174)/100)` multiplier on Gold Food effect | `V:parsers/misc.ts:961` (`getGoldenFoodMulti`) |
| MAGMA | additive in Lab EXP and Divinity EXP (skill exp parts) | `V:parsers/character.ts:1143,1164,1268,1302` |
| KATTLEKRUK | flat added talent levels | `V:parsers/talents.ts:371,377` |
| MARBIGLASS | **no consumer in vendored parsers** (`grep MARBIGLASS_SET` empty) | none |
| GODSHARD | additive into Winner Bonus multiplier (Summoning) | `V:parsers/world-6/summoning.ts:303` (`getLocalWinnerBonus`) |
| EMPEROR | Ribbon: `floor(rank/4) * (emperor/4)` added to ribbon %; Exalted stamp: `100 + (... + emperor ...)` | `V:parsers/world-4/cooking.ts:248`; `V:parsers/world-1/stamps.ts:322,333` (`getExaltedStampBonus`) |
| PREHISTORIC | `Math.min(50, prehistoric)` in a W7 Research grid bonus | `V:parsers/world-7/research.ts:661` |

[C24]-[C41] (one claim per row, same order as the table, see claim list).

### E. Crafting and acquisition (recipes: `data:crafts.json`; equip levels `data:items.json`)

Every set is crafted at the Anvil except boss-drop-gated parts and the capes/trophy/nametag. Upgrade chain (each tier consumes the previous tier's piece): [C42]

- **Disputed (C42, confidence H for the correction).** The first draft said "Gold eats Copper pieces, Platinum eats Iron". The data lens found this incomplete: `crafts.json` shows Gold Helmet/Platebody/Platelegs consume the matching **Copper** piece and Gold Boots consume **Iron Boots**; Platinum Helmet/Platbody/Shins consume the matching **Iron** piece and Platinum Boots consume **Gold Boots** (so Platinum eats Gold and Iron pieces). Re-read and confirmed 2026-10-19 at `data:crafts.json` (Gold_Helmet, Gold_Platebody, Gold_Platelegs, Gold_Boots, Platinum_Helmet, Platinum_Platbody, Platinum_Shins, Platinum_Boots). The source lens did not refute it. Also: Amarok Paws consume Iron Boots (other Amarok pieces use Amarok Slabs plus bars/drops); Efaunt Helmet consumes Trimmed Rune Platelegs and Efaunt Trunculus consumes Bandage Wraps + Pharaoh Bow (a Gold/Platinum-tier weapon). [C42]
- Dementia -> Void armour (all four pieces); Void -> Chizoar armour (each piece uses the matching Void piece, confirmed in `crafts.json`) and Lustre armour (not re-checked); Lustre -> Diabolical; Troll pieces (boss scales + Starfire Bar) -> Magma; Magma -> Kattlekruk -> Marbiglass -> Godshard -> Emperor -> Prehistoric (verified by the data lens; Emperor Kabuto/Sokutai Ho/Zubon/Geta each consume the matching Godshard piece plus an Emperor Ribbon). Confidence H. [C43]
- Tools and weapons likewise upgrade the same-slot item of the previous set (e.g. Platinum Pickaxe consumes Gold Pickaxe). Weapons: Gold needs class T0 weapon, Platinum consumes Gold weapon, and so on. [C44]
- Amarok pieces need Amarok Slabs (W1 boss); Efaunt pieces need Ripped Tunic / Armor Upgrade Stone C (W2 boss); Chizoar needs Chizoar Spike (W3 boss); Troll needs Troll Scales (W4 boss); Kattlekruk needs Kruk Tooth (W5 boss). [C45]
- Equip-level range of armour per set: Copper 8, Iron 15, Amarok 35-40, Gold 30-35, Platinum 50-55, Efaunt 70-80, Dementia 65-70, Void 85-90, Chizoar 95-110, Lustre 110-115, Diabolical 130-135, Troll 180-190, Magma 210-230, Kattlekruk 240-300, Marbiglass 350-360, Godshard 500-510, Emperor 600, Prehistoric 650. [C46]
- Secret set: Mark of Member and Member Hoodie are craftable (consume Void Imperium Helmet/Platebody + Grandma Disguise / 2 Uninflated Gloves); Club Member trophy and Vman Nametag have no craft recipe (membership/special). Secret recipes consume Void set pieces. Kattlekruk and Emperor capes also have no craft recipe. Confidence H (data lens verified). The data lists Mittens of the Gods (godshard-tier weapon) as a Secret armour slot; flag as odd. [C47]

### E2. Additional mechanics found in verification (added 2026-10-19)

- **M10. Bonus type: multiplicative vs additive.** Troll, Gold, Godshard, Emperor, Prehistoric and Secret are multiplicative `x` bonuses; the rest are additive percent. Source `data:shared-data.json#equipmentSets` descriptions, consumers in section D. Tier 1, confidence H. [C50]
- **M11. Piece counts differ by set.** Emperor has 7 armour pieces (incl. ring, pendant, cape); Kattlekruk and Secret have 5; most sets have 4; Copper and Iron have 3. Tool counts per set vary: Godshard and Prehistoric 6, Magma 3, Marbiglass 4, Dementia/Void/Lustre/Diabolical 2, Copper/Iron/Gold/Platinum 1, others 0. `requiredTools` counts tools held from the set's own tool list; the weapon counts only if `requiredWeapon = 1`. Tier 1, confidence H. [C13][C51]
- **M12. Equipped-but-unregistered sets count.** `getArmorSetBonus` applies the bonus when the set is registered OR currently fully worn by the best active character, and that character is the single most recent-AFK one. Tier 1, confidence H. [C11]
- **M13. Resource-skill mapping.** In game text, Copper is "Mining and Chopping", Platinum "Fishing and Catching", Dementia "Critters and Souls". Toolbox wires Copper to mining efficiency only (`efficiency.ts:280`), so Chopping efficiency in Toolbox omits it (confidence M: possibly a Toolbox gap). Tier 1 plus game description. [C24]
- **M14. Wiki vs Toolbox on Diabolical.** Wiki describes Diabolical as a general monster-respawn bonus; Toolbox restricts it to rift maps. Both recorded, confidence L on which is right in game. [C34]
- **M15. Sets absent from `randomList[113]` sort last** in the Smithy list; the list currently has all 19. Tier 1, confidence M. [C12]
- **M16. Marbiglass is a live set** (+10% All Stat, 4 tools, 1 weapon) with no Toolbox consumer, so ActiveOn cannot compute its effect from Toolbox; show it as "registered/unregistered" only. Tier 1, confidence H. [C21]

### F. Save and Toolbox fields (exact paths)

| What | Raw / Toolbox path |
|---|---|
| Registered sets | `accountOptions[379]` (comma string, element 0 dropped) -> `account.armorSmithy.unlockedSets`, `sets[].unlocked` |
| Hired flag | `accountOptions[380]` -> `account.armorSmithy.smithyUnlocked` |
| Days | `accountOptions[381]` -> `account.armorSmithy.days` |
| Gems received | `idleonData.ServerGemsReceived` |
| Bundle | `account.bundlesOwned.bun_c` |
| Openable | `account.armorSmithy.isSmithyUnlocked` |
| Set definitions | `account.armorSmithy.sets[]` = `{setName, armors, tools, weapons, requiredTools, requiredWeapon, bonusValue, description, unlocked, equipped}` (`V:parsers/generated-types.ts:722`) |
| Active char | `getBestActiveCharacter(characters)`; pieces from `character.equipment[].rawName`, `character.tools[].rawName` |
| Effective bonus | `getArmorSetBonus(account, setName)` |
| ActiveOn | `account.armorSmithy` = `{canHire, hired, daysWaited, registered[]}` (`packages/account-state/src/gear-types.ts`) |

[C4][C6][C9][C10][C11]

### G. W5+ extensions (one line each)

- W5: Kattlekruk (+5 talent levels, needs 1 weapon, no tools) and Marbiglass (+10% All Stat, 4 tools; no Toolbox consumer). [C37][C41]
- W6: Godshard (1.15x Summoning winner bonuses, 6 tools). [C38]
- W7: Emperor (Ribbon/Exalted stamp multi, 7 pieces incl. ring, pendant, cape) and Prehistoric (W7 skill EXP; Toolbox caps at 50 at the Research site). [C39][C40]
- Secret set (gold food 1.25x) uses non-craftable account items. [C47]

## Min-max by stage

The community did not publish (in anything fetchable this session) a ranked set-registration order, so the order below is derived: raw `bonusValue`, the cost of keeping a set while upgrading, and which consumers matter at that stage. Confidence: M for ordering by cost-of-loss (Tier 1 chain), L for ordering by benefit (depends on build). [C48]

- **W1 early (before Smithy is open):** do not spend Copper/Iron pieces on Gold/Platinum armour until a spare Copper and Iron set exists or the Smithy is hired; Copper (+60% Mining/Chopping eff.) and Iron (+25% Class EXP) are the sets the upgrade chain eats first. Craft a spare third of each piece (cost is cheap bars/logs). Confidence M. [C42][C49]
- **W1 mid/late:** Amarok (no tools, 4 pieces, boss slabs) is the first no-tool set: +40% Accuracy and Defence. Register as soon as hired. Confidence M. [C13][C45]
- **W2 early/mid:** Gold (1.5x coins, needs weapon + tool) and Platinum (+60% fishing/catching) once Gold boots exist. Register Copper, Iron, Gold before crafting Platinum, since Platinum consumes Iron and Gold Boots. Confidence M. [C42]
- **W2 late:** Efaunt (+25% Drop Rate, no tools): likely the most broadly useful W2 bonus (inference). Confidence L. [C29][C48]
- **W3 early:** Hire the Smithy (day 30 / 2,000 gems; Reddit reminder). Register everything held: Copper, Iron, Amarok, Gold, Platinum, Efaunt. [C5][C16]
- **W3 mid:** Dementia (+50% souls/critters) then Void (+10% AFK Gains) - Void consumes all four Dementia armour pieces, tools and weapons, so register Dementia first. Confidence M. [C43]
- **W3 late:** Chizoar (+40% all skill EXP, no tools) and Lustre (+75% Total Damage) both consume Void pieces; register Void before crafting either, then pick the order that suits (EXP vs damage). Confidence M/L. [C43][C32]
- **W4:** Diabolical (respawn only counts in rift per Toolbox), Troll (1.25x Tome bonuses, no tools; Troll pieces also feed Magma, register before upgrading), then Magma (+100% Lab and Divinity EXP, 3 tools). Confidence M. [C34][C35][C36][C43]
- **W5+ outline:** Kattlekruk -> Marbiglass -> Godshard -> Emperor -> Prehistoric, each consuming the last. [C43]

Per class: only the weapon slot differs (Warrior/Archer/Mage/Beginner weapon lists); armour sets are class-agnostic ("ALL"), except Secret (BEGINNER class items). [C23]

## Common mistakes and save detection

- Smithy openable but not hired: `isSmithyUnlocked && !smithyUnlocked`. [C4][C6]
- Set parts all held but not registered: `sets[].unlocked == false` with parts in storage/bag/worn; the in-game register needs them worn on the logged-in character. [C10]
- Upgrade consumed a part of an unregistered set: part missing in inventory and `unlocked == false`. [C42]
- Registered by logging into a char that did not wear the set: nothing registered. [C10]

## Open questions

1. Is the 30-day counter (`OLA[381]`) truly account age from creation, or reset when W3 is reached? (two fixtures say account age).
2. Prehistoric: wiki says 2x, Toolbox caps at 50 in the Research grid only; are there other consumers not yet in Toolbox?
3. Marbiglass +10% All Stat: not modelled by Toolbox; does the game apply it via the stat formulas not vendored?
4. Diabolical respawn: is it really rift-only in game, or Toolbox gating?
5. Are armour pieces safe to delete/sell after registering? (Reddit title only, unverified.)
6. Secret set data includes Mittens of the Gods as a piece; is that intended?
7. Is `bun_c` 1,500 gems a gem-equivalent in the game, and does the 2,000 check use lifetime gems received?
8. Does registration need the Smithy hired first (`OLA[380]`)? Toolbox reads `OLA[379]` regardless.
9. No community priority order found; needs a human-free source (wiki Smithy NPC page, IdleOn Academy).
10. Sprite needs: per-set icons (19 sets) do not exist; only `sys-armor-smithy` and `gear-helmet`. Needed for the set cards in the Armor Smithy page.

## Claims

- [C1] Wiki lists 19 sets with these bonuses and part counts. https://idleon.wiki/wiki/Set_Bonuses (tier 3, verified 2026-10-19) Confidence M.
- [C2] Smithy makes set bonuses passive for all characters; unlocked in W3 town. https://idleon.wiki/wiki/Set_Bonuses (tier 3) Confidence M.
- [C3] 19 sets in equipmentSets. `data:shared-data.json#equipmentSets` (tier 1) Confidence H.
- [C4] isSmithyUnlocked formula. `V:parsers/world-3/armorSmithy.ts#getArmorSmithy` (tier 1) Confidence H.
- [C5] (tier-4 source; the Knowledge Base labels it tier 3, which is wrong) Smithy unlocks after 30 days or 2,000 gems. https://old.reddit.com/r/idleon/comments/1lq3xp3/ via KB `armor-smithy.yaml` (tier 4, claimed 2025-07-02, not re-read) Confidence L.
- [C6] OLA[380] hired flag. `V:parsers/world-3/armorSmithy.ts` (tier 1) Confidence H.
- [C7] bun_c counts as 1,500 gems. `V:parsers/world-3/armorSmithy.ts` (tier 1) Confidence H.
- [C8] OLA[381] = days, equals account age on fixtures. `docs/specs/M18-gear-tools.md` F-g (tier 2) Confidence M.
- [C9] OLA[379] comma list, first element dropped. `V:parsers/world-3/armorSmithy.ts` (tier 1) Confidence H.
- [C10] PartsOn/PartsReq rules, evaluated on getBestActiveCharacter. `V:parsers/world-3/armorSmithy.ts#getSetPartsOn` (tier 1); `V:parsers/talents.ts:197` (tier 1) Confidence H.
- [C11] getArmorSetBonus returns bonus if unlocked or equipped. `V:parsers/world-3/armorSmithy.ts` (tier 1) Confidence H.
- [C12] Smithy order = randomList[113]. `data:randomList.json` (tier 1) Confidence H.
- [C13] Set table values (bonusValue, requiredTools, requiredWeapon, pieces). `data:shared-data.json#equipmentSets` (tier 1) Confidence H.
- [C14] Set world mapping from recipes and equip levels. `data:crafts.json`, `data:items.json` (tier 1; world assignment is inference, M) Confidence M.
- [C15] Consumer list, see section D. `V:parsers/*` (tier 1) Confidence H.
- [C16] Register: craft, equip whole set, click one equipped item. https://idleon.wiki/wiki/Frostbite_Tundra (tier 3, claimed 2025-07-21) Confidence M.
- [C17] Recipes consume previous-tier pieces. `data:crafts.json` (tier 1) Confidence H.
- [C18] Void +10% AFK Gains. `V:parsers/character.ts:3276` (tier 1) Confidence H.
- [C19] Reminder to check Smithy. r/idleon 1lq3xp3 via KB (tier 4) Confidence L.
- [C20] (unverifiable, title only; KB tier label wrong) Delete old armour sets once registered. r/idleon 1vlwxx5 via KB (tier 4, claimed 2026-08-12, not re-read, M-L) Confidence L.
- [C21] Marbiglass has no consumer (both lenses: no consumer found). grep of `V:parsers` (tier 1) Confidence H.
- [C22] Prehistoric 2x on wiki, min(50) in Research. https://idleon.wiki/wiki/Set_Bonuses (tier 3) vs `V:parsers/world-7/research.ts:661` (tier 1); both recorded, confidence M for the code Confidence M.
- [C23] Weapon lists per class; armour class ALL. `data:crafts.json` (tier 1) Confidence H.
- [C24] Copper in Mining Efficiency. `V:parsers/efficiency.ts:280,303` (tier 1) Confidence H.
- [C25] Iron in Class EXP. `V:parsers/character.ts:2122` (tier 1) Confidence H.
- [C26] (cited lines are definitions rather than uses; claim holds) Amarok in Accuracy and Defence. `V:parsers/damage.ts:1029,1402` (tier 1) Confidence H.
- [C27] Gold multiplies coins. `V:parsers/character.ts:2863` (tier 1) Confidence H.
- [C28] Platinum in Fishing efficiency. `V:parsers/efficiency.ts:453` (tier 1) Confidence H.
- [C29] Efaunt in Drop Rate. `V:parsers/character.ts:2499` (tier 1) Confidence H.
- [C30] Dementia in souls and traps. `V:parsers/world-3/worship.ts:131`, `traps.ts:132` (tier 1) Confidence H.
- [C31] Void in AFK gains. `V:parsers/character.ts:3286` (tier 1) Confidence H.
- [C32] Lustre in damage. `V:parsers/damage.ts:427` (tier 1) Confidence H.
- [C33] Chizoar in All Skill EXP. `V:parsers/character.ts:1692` (tier 1) Confidence H.
- [C34] (wiki says general respawn bonus; Toolbox rift-only, both recorded) Diabolical respawn, rift-only, zero in W7. `V:parsers/character.ts:1840,1853,1876` (tier 1) Confidence H.
- [C34a] Efaunt priority is inference (no source ranks sets). (inference, L) Confidence L.
- [C35] Troll in Tome and Spelunking lore. `V:parsers/world-4/tome.ts:222`, `world-7/spelunking.ts:553` (tier 1) Confidence H.
- [C36] Secret and Magma consumers. `V:parsers/misc.ts:961`, `character.ts:1143,1268` (tier 1) Confidence H.
- [C37] Kattlekruk adds talent levels. `V:parsers/talents.ts:371` (tier 1) Confidence H.
- [C38] Godshard in Summoning winner bonus. `V:parsers/world-6/summoning.ts:303` (tier 1) Confidence H.
- [C39] (floor(rank/4) formula not opened by verifiers) Emperor in Ribbons and Exalted stamps. `V:parsers/world-4/cooking.ts:248`, `world-1/stamps.ts:322` (tier 1) Confidence M.
- [C40] Prehistoric capped at 50 in research. `V:parsers/world-7/research.ts:661` (tier 1) Confidence H.
- [C41] Marbiglass +10% All Stat per wiki. https://idleon.wiki/wiki/Set_Bonuses (tier 3) Confidence M.
- [C42] **Disputed.** Source lens: confirmed ("Confirmed"). Data lens: refuted as incomplete. Corrected: Gold consumes Copper pieces (Boots: Iron Boots); Platinum consumes Iron pieces (Boots: Gold Boots); Amarok Paws eat Iron Boots; Efaunt Helmet eats Trimmed Rune Platelegs. `data:crafts.json` (tier 1, H) Confidence H.
- [C43] Void, Chizoar, Lustre, Diabolical, Magma... chain consumes the previous set. `data:crafts.json` (tier 1) Confidence H.
- [C44] Tool and weapon chains. `data:crafts.json` (tier 1) Confidence M.
- [C45] Boss material gating (Amarok Slab, Ripped Tunic, Chizoar Spike, Troll Scales, Kruk Tooth). `data:crafts.json` (tier 1; boss attribution is inference) Confidence M.
- [C46] (verified in items.json) Equip level ranges. `data:items.json` (tier 1) Confidence H.
- [C47] Secret set pieces and crafts. `data:crafts.json`, `data:shared-data.json` (tier 1) Confidence H.
- [C48] Priority orders are derived from Tier 1, not a published community order. (inference; web search budget exhausted) Confidence L.
- [C49] M18 spec FR-18 warns that recipes eat unregistered pieces. `docs/specs/M18-gear-tools.md` FR-18 (tier 2) Confidence M.
- [C50] Multiplicative sets: Troll, Gold, Godshard, Emperor, Prehistoric, Secret; others additive. `data:shared-data.json#equipmentSets`, consumers in section D (tier 1). Confidence H.
- [C51] Piece/tool counts per set: Emperor 7 armour, Kattlekruk and Secret 5; tools Godshard/Prehistoric 6, Magma 3, Marbiglass 4. `data:shared-data.json#equipmentSets` (tier 1). Confidence H.
