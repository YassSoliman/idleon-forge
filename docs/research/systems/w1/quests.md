# Quests and gate quests

Dossier for M26. Verified 2026-10-19 against Toolbox @ 6c37e3d (game 2.3.540). Paths below are relative to `packages/toolbox-parsers/vendor/` in the fix-digits worktree unless stated. Source tiers: 1 = game data / Toolbox code, 2 = Toolbox logic/dashboard, 3 = IdleOn wiki, 4 = community guides. "Quest key" means NPC name + index, e.g. `Dog_Bone2`.

## Quests (NPC quests and world gate quests)

- **What it is:** about 349 scripted quest steps given by 95 NPCs across seven worlds plus 19 world-less town/event NPCs. Each step is either an item hand-in or a "Custom" objective the game checks itself. [C1] [C2]
- **Unlocks:** every NPC stands in a town or map and gets reached by walking. Town-building NPCs are gated by the highest class level on the account; W2/W3/W4/W5 are gated by the gatekeeper NPC's quest (needs a world crystal for W2-W4 gates). [C10] [C11] [C32]
- **Scope:** progress is per character (`QuestComplete_{i}`), but many rewards are account-wide (stamps, storage chests, keys per day scale with characters). The account "unique quests" count is the union across characters. [C3] [C6]
- **Inputs to outputs:**
  - In: items, kills, minigame scores, skill levels, time AFK (the "Custom" types). [C1] [C31]
  - Out: Time Candy, gems, EXP balloons, stamps, inventory bags and storage chests, boss keys and Colosseum tickets, talent/star-talent resets, talent points, Special Talent Books, trophies, class unlocks. [C27] [C28] [C29] [C14] [C21]
  - Plus three passive scalers of the unique quest count: Quest Kapow, Studious Quester, Quest Chungus talents, the Tome row, the Omar Da Ogar bottle bonus, one weekly-battle stat. [C17] [C18] [C19] [C22] [C24] [C25]
- **Goals and Milestones:**

| Milestone | Effect | Claim |
|---|---|---|
| 25 unique quests (account) | Achievement "Do What You're Told", 8 gems | [C23] |
| 75 / 150 unique quests on one character | Achievements B-o-B to Help (16 gems), Simpin' for NPC's | [C23] |
| 323 unique quests | Tome "Unique Quests Completed" row reaches 100% (500 Tome points; linear below) | [C22] |
| Dog Bone 2, Djonnut 2, Bellows 3 done on a character | +1 key/day for that character, banked up to 3 days | [C12] [C15] [C16] |
| Typhoon, Centurion, Lonely Hunter dialogue reached | +1 Colosseum ticket/day each, banked up to 3 days; Toolbox declares per-character thresholds (3/4/6) but does not use them (see M8) | [C13] |
| Omar Da Ogar quests 1-6 (any character) | +10% bottle bonus each, up to +60% | [C24] |
| 22 W4 quests (Royal Worm 8) | Royal Worm "Normie Bidding" quest | [C26] |

- **Feeds / fed by:**
  - Fed by: every system whose objective a Custom quest checks (Stamps, Statues, Alchemy vials, Divinity, Sneaking, Colosseum, Pets, Cooking, Lab, Refinery, Construction). [C1]
  - Feeds: Stamps, Boss Keys, Colosseum tickets, Islands, Tome, talent points and resets, inventory space, damage/efficiency/LUK talents, World Gates (Meta Path). [C28] [C14] [C13] [C24] [C22] [C27] [C29] [C17]
- **Per-session actions:**
  - Collect the boss-key and Colosseum-ticket dailies before 3 days bank (cap). Key pile scales with qualifying characters; tickets do not. [C12] [C13]
  - Hand in any quest whose items are already held (Walkthrough "Hand ... to NPC" steps already do this for W1-3). [C36]
  - Idle or capped state: a banked key/ticket pile at 3 days. [C12]
- **AFK Setup implications:** a few Custom quests need a specific AFK target for a duration (Stiltzcho 4 h Spores, 8 h Frogs, 16 h Slimes). Others need active play (Bellows 1 per the wiki). [C31] [C16]
- **Min-max by stage:** see the dedicated section below.
- **Common mistakes:**
  - Finishing a quest that gates a drop on every character, losing the drop forever (the 16 quest-linked drops). Detect from `quests[npc][...]` status 1 on all characters. [C9]
  - Doing "once per account" reward quests on every character (waste), or skipping "every character" quests (inventory bags, key dailies, Picnic dailies). [C37] [C29] [C12]
  - Leaving boss keys uncollected for 3+ days. [C12]
  - Treating the reclaimable quests as unfinished: raw 0 is ambiguous; the later-quest-completed rule resolves it. [C7]
- **Save and Toolbox fields:** see the Mechanics catalogue. Main: `characters[i].quests`, `characters[i].questComplete`, `characters[i].questCompleted`, `characters[i].npcDialog`, `account.quests`, `account.totalQuestsCompleted`, `account.accountOptions[16|31|80]`. [C3] [C5] [C6] [C12]
- **Sources:** inline per claim; claim list in the Claims index.

## Mechanics catalogue

For each: rule/formula, caps, unlock, costs, field. "Parser" paths are in `parsers/`; game data in `data/website-data/`.

### M1. Quest record and status
- Rule: save key `QuestComplete_{i}` is a map `"<NPC><index>" -> status`. `getPlayerQuests` splits each key on the digits into `{npc: {index: status}}`; keys containing `Fishpaste` are forced to NPC `Fishpaste97` (its indices are 971 and 972). Status: -1 not started, 0 accepted, 1 done (ActiveOn Account State comment). [C3] [C4]
- Field: `characters[i].quests` (parsed map), `characters[i].questComplete` (raw map), `characters[i].questCompleted` (count of status 1). [C3] [C5]

### M2. Account quest view
- Rule: `getQuests(characters)` groups quest definitions by world via `worldNpcMap`, attaches `completed[]` (`{charIndex, status:1}`) and `progress[]` (the single "marker" quest per character) to each step, sorts NPCs by index. Completed = `completed[]`, never `progress[]`. [C8]
- Field: `account.quests.<World>[] = {name, index, npcQuests[]}`; world keys `Blunder_Hills`, `Yum_Yum_Desert`, `Frostbite_Tundra`, `Hyperion_Nebula`, `Smolderin'_Plateau`, `Spirited_Valley`, `Shimmerfin_Deep`; world-less NPCs have no entry (dropped by the `if (!worldName) return` guard). [C8] [C2]

### M3. Unique quest count
- Rule: `calcTotalQuestCompleted` = number of distinct quest keys with status 1 on any character. No cap in code; the data has 349 steps (2 of type None). [C6] [C1]
- Field: `account.totalQuestsCompleted`. Used by Quest Kapow, Studious Quester, Chungus, Tome, a weekly-battle stat. [C6] [C25]

### M4. Reclaimable quests
- Rule: 40 steps carry `Reclaimable`. A raw status 0 on a reclaimable step counts as done if any later step of the same NPC is status 1. Complete Class Redo re-opens Promotheus2 and Scripticus8 on its own. [C7]

### M5. Quest-gated drops
- Rule: a monster drop tagged `questLink` rolls only while that quest is in progress (status 0). 16 quest keys are linked: Dog_Bone1, Funguy3, Goldric3, Loominadi1, Mutton2/3/4, Papua_Piggea1/2, Picnic_Stowaway2, Shuvelle5/6/7, Stiltzcho2, TP_Pete2, XxX_Cattleprod_XxX3. Toolbox exposes `missableDrops` for greenstackable ones. [C9]
- Field: `account.quests.*.npcQuests[].missableDrops`.

### M6. World gatekeepers
- Rule: world N "finished" when any character has talked to the NPC (`npcDialog[npc]` truthy): W1 Builder_Bird, W2 Constructor_Crow, W3 Carpenter_Cardinal, W4 Muhmuguh, W5 Lafu_Shi; W6 is account option 408 > 0. Quests: Builder_Bird1 hands in Desert Topaz, Constructor_Crow1 Glacier Quartz, Carpenter_Cardinal1 Galaxial Amethyst. [C10] [C11]
- Field: `account.finishedWorlds`, `characters[i].npcDialog`.

### M7. Boss-key dailies
- Rule: `totalAmount = min(daysSincePickup, 3) * amountPerDay`, `amountPerDay` = number of characters whose `npcDialog[npc] > dialogThreshold`. Dog Bone threshold 5 (days at `accountOptions[16]`), Djonnut 6 (`[31]`), Bellows 8.5 (`[80]`). Initial key quests: Dog Bone 6 + 5, Djonnut 5 + 5 + 5, Bellows 1 + 2 + 2, Tired Mole (W5) 10 + 25. [C12] [C14]
- Wiki trigger: Dog Bone after quest 2, Djonnut after quest 2, Bellows after quest 3. [C15] [C16]
- Field: `account.currencies.KeysAll[i] = {amount, amountPerDay, daysSincePickup, totalAmount}`.

### M8. Colosseum ticket dailies
- Rule: same shape as M7. Differs from M7 in one respect: the thresholds 3 / 4 / 6 and day counters `[15]` (Typhoon, W1), `[35]` (Centurion, W2), `[56]` (Lonely Hunter, W3) are declared in `enhanceColoTickets`, but the threshold is NOT applied: the `getAmountPerDay` call is commented out, `amountPerDay` is fixed at 1 and `totalAmount = min(daysSincePickup, 3)`. Do not model a per-character threshold or per-character multiplier for tickets from Toolbox. (Correction from both verifier lenses, confidence H.) Quest rewards: Typhoon1 1 ticket, Centurion1 1, Centurion2 2, Lonely Hunter 2 and 3 each 2. [C13]
- Field: `account.currencies.ColosseumTickets`-style enhanced list from `enhanceColoTickets`.

### M9. Unique-quest scalers
- Quest Kapow (Special Talent, skill 658): damage % = `min(uniqueQuests, 5 * lvl)` (growth `add`, x1=5, x2=0, so cap = 5 per talent level). [C17]
- Studious Quester (skill 617): all-skill efficiency % = `min(0.1 * uniqueQuests, 0.4 * lvl)`. [C18]
- Quest Chungus (skill 618): +1 LUK per quest, cap `4 * lvl` (talents.json x1=4). No vendored Toolbox parser applies this LUK bonus; `index.ts#L310-L312` is only a comment, so ActiveOn must compute it itself. [C19]
- Max talent level and book source not in data (open question). [C20]
- Field: `characters[i].flatStarTalents`, `account.totalQuestsCompleted`.

### M10. Tome row
- Rule: row "Unique Quests Completed" has x1=323, x2=2 (linear curve): `pct = min(1, q / 323)`, `points = ceil(pct * 500)`; counts only when `accountLevel >= tomeLvReq`. [C22]
- Field: `account.tome.tome[]`, quantity from `calcTotalQuestCompleted`.

### M11. Omar Da Ogar bottles
- Rule: each of Omar's 6 quests completed by any character adds +10 to the bottle bonus: `bottlesPerDay = floor(4 * (1 + (bribe + 10*opt164 + 10*omarQuests + bundle)/100))`. Counts Omar steps with any completion; bonus also includes the bribe, `accountOptions[164]*10` and bundle `bun_p` (30). [C24]
- Field: `account.quests.Yum_Yum_Desert[Omar_Da_Ogar].npcQuests[].completed`.

### M12. Resets and talent points
- Talent Point Reset Potions: Hamish2 (1), Promotheus2 (2), Promotheus3 (1), Speccius1 (1 + 5 fragments), Lord of the Hunt 9 (4). Star Talent Reset Potions: Builder Bird 1 (3), Lord of the Hunt 8 (1). Post Office reset box: Lord of the Hunt 10. Talent points: Walupiggy2 (4 Special tab + 3 Tab 3), Walupiggy3 (3 Tab 2). [C27]

### M13. Special Talent Book
- Rule: nine steps reward `TalentBook1`, and the data names the book: Scripticus11 WILL_OF_THE_ELDEST, Glumlee4 EXP_CONVERTER, Picnic_Stowaway9 CRYSTALS_4_DAYYS, Rocklyte3 TOILET_PAPER_POSTAGE, Wellington4 STONKS, Hoggindaz3 PRINTER_SAMPLING, Hoggindaz5 SHRINE_ARCHITECT, Monolith3 MONOLITHIALISM, Royal_Worm1 STUDIOUS_QUESTER. [C21]

### M14. Stamp rewards
- Rule: quests hand out stamps directly. Counts of stamp items rewarded: W1 10, W2 12, W3 7, W4 6, W5 6, W6 5, W7 5. Hand-in quests also consume stamps (Papua_Piggea1 StampA8, 2 StampC3, 3 several; Papua4 needs total stamp level 500). [C28]

### M15. Space rewards (bags and chests)
- Inventory bags: Scripticus4 (InvBag1), 8 (InvBag2), 9 and 10 (InvBag3), Promotheus4 (InvBag4), Cowbo_Jones8/10/13 (InvBag5/6/8). Storage: Hamish3, Krunk2, Cowbo_Jones2, Mutton1, Snake_Jar2, Hoov4 (W6). [C29]

### M16. Daily repeatable line: Picnic Stowaway
- Rule: quests 1-3 one-off, 4-12 a daily line per character (daily-reset part carried from prior research, N.js, confidence L; not in the vendored data; the pin has a different Toolbox ref 6827d3f in that research). Data confirms steps 4-10 are one-off item hand-ins, step 11 grants Picnic Token (Quest9), step 12 needs 30 tokens. 'King of Food' is not named in the data. Rewards Golden Jam/Kebabs/Meat Pie, Picnic Token (Quest9) from step 11, King of Food trophy (step 12, 30 tokens). [C30]

### M17. Time-gated and AFK quests
- Stiltzcho 4/5/6: AFK at Spores 14400 s, Frogs 28800 s, Slimes 57600 s. Bellows 1: 50 Neyeptune kills (wiki: active only). [C31] [C16]

### M18. Class quests
- Promotheus1 reach Lv 10, Promotheus2 select class, Speccius2 subclass (W2), Eliteus2 elite class (W4), Masterius2 master class (W6), Rocklyte3 Journeyman, Cactolyte4 Maestro, Nebulyte4 Voidwalker. [C33]

### M19. Trophies
- Trophy quests: Scripticus12 (Blunder Hero), Picnic12 (King of Food), Cowbo_Jones15, Hoggindaz10, Lord_of_the_Hunt11, Rocklyte3, Cactolyte4, Royal_Worm9, Centurion8 (W6 Colosseum), Tired Mole 3, Potti7. Trophies feed the Tome. [C35]

### M20. Seasonal/event NPCs (world-less)
- Giftmas Blobulyte, Loveulyte, Egggulyte, Coastiolyte, Falloween Pumpkin, Bubbulyte: event-only; they count toward the unique total once done. [C1] [C2]

### M21. Raw status semantics and quest markers
- Rule: raw `QuestComplete` value 1 = done, 0 = accepted / in progress; only status 1 counts anywhere (unique count, achievements, talents). Status 0 drives drop gating (M5) and the single "marker" quest per character in `getQuests`. Quests are not strictly linear: steps carry `NextIndex` / `NoSpaceIndex` branching and `InventorySpacesNeeded`, which is why the marker logic exists. Repeatable or non-sequential quests produce one marker per character. [C39] [C8]
- Confidence H (tier 1: `parsers/quests.ts`, quests.json, read 2026-10-19).

### M22. Custom objective targets
- Rule: "Custom" steps carry `customArray` targets (kills within a time limit, AFK seconds, a level, a class selection). The save exposes only 0/1 for these, never partial progress, so ActiveOn can show the objective text but not a progress bar. Example: TP_Pete has a timed kill objective (40 poops in 200 s; forfeit via the Codex). [C40]
- Confidence M for the TP_Pete numbers (source lens, not independently recounted); H for the 0/1-only save exposure.

### M23. Missable quest drops (warn-before-finish)
- Rule: `getMissableQuestDrops` collects, per `questLink` quest key, only drop items that are greenstackable and not in `unrealisticGreenstackItems`. Finishing a linked quest on every character permanently ends that drop (M5), so ActiveOn should warn before the last character finishes it. Exposed as `missableDrops` on each step. [C9] [C41]
- Confidence H (tier 1: `parsers/quests.ts#L17-L27`, L108). The "rolls only while in progress" semantics come from a code comment (confidence M).

### M24. World-less gatekeeper NPCs
- Rule: 19 NPCs (39 steps), including gatekeepers such as Builder_Bird, have no world in `worldNpcMap`, so `getQuests` skips them (`if (!worldName) return`). Gate state therefore needs `npcDialog` and `isWorldFinished` (M6), not `account.quests`. `isWorldFinished` uses `npcDialog` of the gatekeeper (a counter separate from QuestComplete) and `accountOptions[408]` for W6. [C2] [C10]
- Confidence H.

### M25. Equinox dream: 300 different quests
- Rule: Equinox dream goal "Complete 300 different Quests" (goal 300) rewards +75% Equinox bar fill rate. The label says it is the same value as the three quest Star Talents. Note the Tome row uses 323, not 300 (M10). [C42]
- Confidence H (tier 1: `data/website-data/shared-data.json#L7886-L7890`, verified 2026-10-19).

### M26. Star-talent scope of quest bonuses
- Rule: the quest talents are star talents (`flatStarTalents`), so they apply only to characters that have them. Quest Kapow and Studious Quester are applied in the damage and efficiency parsers; Quest Chungus LUK is not applied in any vendored parser (M9). The Tome row and Studious Quester share the account-wide unique count (`TomeQTY[4]`), with Tome points gated by account level. [C17] [C18] [C19] [C22]
- Confidence H for scope; M for the `TomeQTY[4]` index (gamedata lens only).

### M27. Quest reward consumables
- Rule: 28 steps grant `NPCtoken*` items; many quests also grant consumables (time candy, EXP balloons, gems, Pearls, Holy Pearls), plus Compost Bag (Quest81) and Cooking Ladle from W4+ NPCs. Royal_Worm8's 22-W4-quests requirement is a cross-quest meta objective (custom `W4_Quests_Done` = 22), reward 72HR candy + 6 Holy Pearl. [C34] [C26]
- Confidence M (28 count verified; Compost Bag / Ladle item names not individually rechecked).

### W5+ extensions (one line each)
- W5: Smolderin' Plateau has 6 NPCs/18 steps (Slargon, Pirate Porkchop stamps, Poigu Divinity levels 25/50/80, Muhmuguh gate, Lava Larry, Tired Mole keys). [C2]
- W6: 7 NPCs/28 steps (Hoov Sneaking levels, Woodlin Elder, Potti, Sussy Gene, Masterius, Spirit Sungmin, Lafu Shi gate). [C2]
- W7: 6 NPCs/12 steps (Snootie and Bloo Radley stamps, Zenelith 1M statues). [C2]

## Min-max by stage

Community material on quests is thin: one dated guide plus the wiki; no ranked order exists, so the order below is derived from the data and labelled as such. Confidence M unless stated.

- **W1 early (to Lv 14):** follow the Scripticus tutorial chain, which pays bags and the first class; do Promotheus1 at class Lv 10. Pick up Glumlee1-3. (Derived; data rewards.) [C33] [C29]
- **W1 mid (Lv 14 to 28):** Mr Pigibank quest (opens Stamps and Bribes), Hamish 1-3 (Tomahawk and Choppin' Bag stamps, Storage Chest 1), Mutton 1-4 (stamps, Storage 5), Papua Piggea, Tiki Chief 2 (Questin Stamp). Guide: "stamp unlocks complete once on a single character". [C28] [C37] [C32]
- **W1 late:** Dog Bone 1-2 on EVERY character that reaches him (each adds +1 key/day), Typhoon (ticket daily), Krunk (Storage 3), Stiltzcho 1-6, Picnic Stowaway dailies, Scripticus 10-11 (Amarok, Special Talent Book), Builder Bird. Guide: boss keys and Colosseum tickets are the priority repeats. [C12] [C13] [C37] [C21]
- **W2:** Cowbo Jones chain (bags E, F, H and Storage 4), Fishpaste97 (two stamps), Wellington (3 stamp quests plus Special Talent Book), Cattleprod (3 stamp quests), Djonnut keys, Centurion tickets, Omar Da Ogar (+10% bottles per quest), Speccius subclass, Walupiggy treasure hunts (talent points), Constructor Crow gate. Guide: Cowbo Jones and Fishpaste97 first. [C28] [C29] [C24] [C27] [C37]
- **W3:** Hoggindaz 1-9 (two Special Talent Books, Chizoar), Bellows keys, Lonely Hunter tickets, Snouts and Crystalswine stamps, Lord of the Hunt critter chain (resets, Post Office reset box), Carpenter Cardinal gate. Guide: Hoggindaz gives the Printer Sampling special talent. [C28] [C27] [C21]
- **W4:** Gobo (pet/lab/cooking intro, Mob Eggs), Capital P (three stamps via Party Points 200/1400/10000), Oinkin (three stamps), Monolith (Special Talent Book, onyx statue), Royal Worm (Special Talent Book, 22-W4-quests quest), Eliteus (elite class), Muhmuguh gate. Guide: Royal Worm gives Studious Quester. [C28] [C21] [C26] [C33]
- **Any stage:** finish quest-linked drop quests only after farming the drop on every character that needs it. [C9]

## Open questions

1. Resolved: the book-to-talent mapping is in the game data (see M13) and matches the guide. Remaining: whether a character needs the book to use each talent in the save (not checked). [C21]
2. Max level of Quest Kapow / Studious Quester / Chungus (so the real caps are known). [C20]
3. Exact quest per daily key trigger: Toolbox dialogue thresholds vs wiki quest numbers for Dog Bone and Bellows. [C12] [C16]
4. Picnic Stowaway daily rule is carried from prior research; the pin has no `picnicDaily` alert in parsers. [C30]
5. Crystalswine quests 1-3 are absent from quests.json; are they hidden or unimplemented? [C2]
6. Whether Spelunking `getAllEff` uses a per-character `questCompleted` rather than the account count (code comment only). [C18]

## Claims index

- [C1] (confidence H) `data/website-data/quests.json` holds 95 NPC entries and 349 quest steps (217 Custom, 130 ItemsAndSpaceRequired, 2 None). Source: `data/website-data/quests.json` (counted 2026-10-19), tier 1.
- [C2] (confidence H) Steps per world via `worldNpcMap`: Blunder Hills 21 NPCs/86 steps; Yum Yum Desert 17/79; Frostbite Tundra 10/58; Hyperion Nebula 9/29; Smolderin' Plateau 6/18; Spirited Valley 7/28; Shimmerfin Deep 6/12; world-less 19/39. Source: `parsers/quests.ts` worldNpcMap + quests.json, tier 1.
- [C3] (confidence H) Per-character quests read from `QuestComplete`: `character.quests = getPlayerQuests(char?.QuestComplete)`. Source: `parsers/character.ts#L458`, `parsers/quests.ts` getPlayerQuests, tier 1.
- [C4] (confidence H) Keys containing `Fishpaste` are mapped to NPC `Fishpaste97` (quest indices 971, 972). Source: `parsers/quests.ts` getPlayerQuests, tier 1.
- [C5] (confidence H) `questComplete` is the raw map and `questCompleted` counts status === 1. Source: `parsers/character.ts#L549-L552`, tier 1.
- [C6] (confidence H) `calcTotalQuestCompleted` counts each quest once if any character has status 1; stored as `account.totalQuestsCompleted`. Source: `parsers/misc.ts#L1841-L1850`, `parsers/index.ts#L313`, tier 1.
- [C7] (confidence H) 40 steps are `Reclaimable`; raw 0 counts as completed if a later step of the same NPC is 1; Complete Class Redo re-opens Promotheus2 and Scripticus8. Source: `parsers/quests.ts#L56-L66`, quests.json, tier 1.
- [C8] (confidence H) `getQuests` attaches `completed[]` and `progress[]` per step, groups by world, sorts NPCs by index; one marker quest per character. Source: `parsers/quests.ts#L46-L110`, tier 1.
- [C9] (confidence H) 16 quest keys gate drops (`questLink`); drops roll only while the quest is in progress, so finishing it on every character loses them. Source: `parsers/quests.ts#L11-L24`, `data/website-data/monsterDrops.json`, tier 1.
- [C10] (confidence H) World gatekeepers: W1 Builder_Bird, W2 Constructor_Crow, W3 Carpenter_Cardinal, W4 Muhmuguh, W5 Lafu_Shi, W6 accountOptions[408]. Source: `parsers/quests.ts#L26-L42`, tier 1.
- [C11] (confidence H) Gate quest hand-ins: Builder_Bird1 Desert Topaz (reward 2 Small EXP balloons, 2500 coins, 3 Star Talent Reset Potions); Constructor_Crow1 Glacier Quartz (3 Medium EXP balloons, 250,000 coins); Carpenter_Cardinal1 Galaxial Amethyst (1 Cosmic Time Candy, 1.5B coins). Source: quests.json, tier 1.
- [C12] (confidence H) Boss keys: `totalAmount = min(daysSincePickup,3) * amountPerDay`; Dog_Bone threshold 5 / `accountOptions[16]`, Djonnut 6 / `[31]`, Bellows 8.5 / `[80]`. Source: `parsers/misc.ts#L602-L621`, tier 1.
- [C13] (confidence H) Colosseum tickets: day counters Typhoon `[15]`, Centurion `[35]`, Lonely_Hunter `[56]`; thresholds 3/4/6 are declared but unused (`getAmountPerDay` commented out, `amountPerDay` fixed 1, `totalAmount = min(days,3)`). Verified by both lenses 2026-10-19. Source: `parsers/misc.ts#L571-L576`, tier 1.
- [C14] (confidence H) Key quest rewards: Dog Bone 6+5 keys (+Dog Bone Token), Djonnut 5+5+5 (+token), Bellows 1+2+2, Tired Mole 10+25 (Kruk's Volcano). Source: quests.json, tier 1.
- [C15] (confidence M) Wiki: Djonnut gives daily keys after quest 2, holds up to 3 days, other characters' completions add to the same pickup. Source: https://idleon.wiki/wiki/Djonnut (rev. 2026-09-27, read 2026-10-19), tier 3.
- [C16] (confidence M) Wiki: Bellows daily key unlocks after his third quest (Veyebing, needs Tachion of the Titans prayer); quest 1 needs active kills; keys store 3 days. Toolbox threshold 8.5 is dialogue index, not the quest number (disagreement not resolved, confidence M). Source: https://idleon.wiki/wiki/Bellows (rev. 2026-10-01, read 2026-10-19), tier 3.
- [C17] (confidence H) Quest Kapow: "+1% Damage per completed quest on any character", cap +5 x level; `min(totalQuests, talentBonus)`. Source: `parsers/damage.ts#L751-L753`, talents.json (skill 658), tier 1.
- [C18] (confidence H) Studious Quester: +0.10% all-skill efficiency per quest, cap 0.4 x level; `min(0.1*totalQuests, talentBonus)`. Source: `parsers/efficiency.ts#L150-L184`, talents.json (617), tier 1.
- [C19] (confidence M) Quest Chungus: +1 LUK per quest, cap 4 x level. Source: `data/website-data/talents.json` (skill 618, x1=4), tier 1. Correction: `parsers/index.ts#L310-L312` is a comment only; no Toolbox parser applies the LUK bonus.
- [C20] (confidence M) Max level of the three quest talents is not in the vendored data. Source: absence in `data/website-data/talents.json`, tier 1.
- [C21] (confidence H) Nine steps reward the Special Talent Book (TalentBook1): Scripticus11 (WILL_OF_THE_ELDEST), Glumlee4 (EXP_CONVERTER), Picnic_Stowaway9 (CRYSTALS_4_DAYYS), Rocklyte3 (TOILET_PAPER_POSTAGE), Wellington4 (STONKS), Hoggindaz3 (PRINTER_SAMPLING), Hoggindaz5 (SHRINE_ARCHITECT), Monolith3 (MONOLITHIALISM), Royal_Worm1 (STUDIOUS_QUESTER). A guide claims Picnic Stowaway to Crystals 4 Dayys, Hoggindaz to Printer Sampling, Royal Worm to Studious Quester (confirmed by game data, which names each book; upgraded to H). Source: quests.json (tier 1); https://gameslikefinder.com/article/idleon-best-quests/ (updated 2026-05-13, tier 4).
- [C22] (confidence H) Tome row "Unique Quests Completed": x1=323, x2=2, x3=500; `pct=min(1,q/323)`, `points=ceil(pct*x3)`, counts when account level >= tomeLvReq. Source: `data/website-data/shared-data.json`, `parsers/world-4/tome.ts#L254-L256`, tier 1.
- [C23] (confidence H) Achievements: TaskAchA14 "Do What You're Told" 25 unique quests (8 gems); TaskAchB16 75 unique on one character (16 gems); TaskAchC33 150 on one character. Source: `data/website-data/achievements.json`, tier 1.
- [C24] (confidence H) Omar Da Ogar: each of his quests completed adds +10 to the island bottle bonus; `bottlesPerDay = floor(4*(1+bonus/100))`. Source: `parsers/world-2/islands.ts#L113-L125`, tier 1.
- [C25] (confidence H) Weekly boss stat 16 reads `account.totalQuestsCompleted`. Source: `parsers/world-2/weeklyBosses.ts#L156-L157`, tier 1.
- [C26] (confidence H) Royal Worm 8 "Normie Bidding" requires 22 W4 quests done; Royal Worm 1 reward is a Special Talent Book. Source: quests.json, tier 1.
- [C27] (confidence H) Quest resets/points: Hamish2, Promotheus2 (x2), Promotheus3, Speccius1 (+5 fragments), Lord of the Hunt 9 (x4) give Talent Point Reset Potions; Builder_Bird1 (x3) and Lord of the Hunt 8 give Star Talent Reset Potions; Lord of the Hunt 10 a Post Office reset box; Walupiggy2/3 give Talent Point tabs. Source: quests.json, tier 1.
- [C28] (confidence M) Stamp items rewarded by quests: W1 10, W2 12, W3 7, W4 6, W5 6, W6 5, W7 5. Source: quests.json (counted 2026-10-19), tier 1.
- [C29] (confidence H) Inventory bag and storage rewards: bags from Scripticus 4/8/9/10, Promotheus4, Cowbo_Jones 8/10/13; storage from Hamish3, Krunk2, Cowbo_Jones2, Mutton1, Snake_Jar2, Hoov4. Source: quests.json, tier 1. Per-character vs account scope of bags/chests is community-stated (C37), not in data.
- [C30] (confidence L) Picnic Stowaway quests 4-12 are a daily line per character; quest 11 gives Picnic Token, 12 needs 30 tokens for King of Food. Source: quests.json (rewards, tier 1); daily-reset claim from prior research `research/w1-systems:docs/research/systems/w1-systems/amarok-and-quests.md` (N.js v1.23, 2026-10-17, tier 1, not re-verified here).
- [C31] (confidence H) Stiltzcho 4/5/6 AFK thresholds 14400 s, 28800 s, 57600 s (Spores, Frogs, Slimes). Source: quests.json, tier 1.
- [C32] (confidence L) Town unlock levels (highest class level): storage 7, stamps/Mr Pigibank 14, forge 18, statues 22, tasks 28; wiki "class level 12" for stamps is stale. Source: prior research `amarok-and-quests.md` (N.js, 2026-10-17), tier 1, carried not re-verified.
- [C33] (confidence H) Class quests: Promotheus1 Lv 10; Speccius2 subclass; Eliteus2 elite class; Masterius2 master class; Rocklyte3 Journeyman; Cactolyte4 Maestro; Nebulyte4 Voidwalker. Source: quests.json, tier 1.
- [C34] (confidence M) Final quests of many NPCs reward an NPC Token (`NPCtoken*`), a Quest-type item tracked in the Slab and used in crafts. Source: quests.json, `data/website-data/slab.json`, `data/website-data/crafts.json`, tier 1.
- [C35] (confidence M) Trophy quests: Scripticus12, Picnic_Stowaway12, Cowbo_Jones15, Hoggindaz10, Lord_of_the_Hunt11, Rocklyte3, Cactolyte4, Royal_Worm9, Centurion8, Tired_Mole3, Potti7; trophies count toward the Tome via `calcTrophiesFound`. Source: quests.json, `parsers/world-4/tome.ts#L24`, tier 1.
- [C36] (confidence M) ActiveOn today: `GATE_QUEST_NPCS` = Dog_Bone, Djonnut, Hoggindaz, Bellows, Gobo; generator `quests.gen.ts` emits Acquisitions for NPCs in W1-W3 only (`MAX_WORLD = 3`); no dedicated quests page, quests appear only as Walkthrough steps and the Meta Path gate chain. Source: `packages/knowledge/generators/quests.gen.ts`, `packages/account-state/src/types.ts#L153`, `ux/m25-coverage.md` line 88, tier 4 (project code).
- [C37] (confidence L) Guide: most quests once per account (stamps, storage chests, special talents); repeat on all characters the inventory bag quests, gem/Time Candy/equipment quests; boss keys and Colosseum tickets are a priority as they give an initial and a daily reward; Mr Pigibank, Hamish, Mutton, Fishpaste97, Cowbo Jones named as top. Source: https://gameslikefinder.com/article/idleon-best-quests/ (updated 2026-05-13, pre-v1.20 patch, flag stale), tier 4.
- [C38] (confidence M) Wiki Quests page lists seven world regions and a Secrets page for hidden quests. Source: https://idleon.wiki/wiki/Quests (rev. 2026-09-18), tier 3.
- [C39] (confidence H) QuestComplete raw value 1 done, 0 accepted; only 1 counts; steps have NextIndex/NoSpaceIndex branching and InventorySpacesNeeded; one marker per character. Source: `parsers/quests.ts`, quests.json, tier 1, 2026-10-19 (gamedata lens).
- [C40] (confidence M) Custom steps carry `customArray` objectives (timed kills, AFK seconds, level, class); save exposes only 0/1; TP_Pete: 40 poops in 200 s, forfeit via Codex. Source: quests.json, tier 1, 2026-10-19 (both lenses).
- [C41] (confidence H) `getMissableQuestDrops` filters to greenstackable, realistic items; finishing on all characters ends the drop. Source: `parsers/quests.ts#L17-L27`, tier 1.
- [C42] (confidence H) Equinox dream "Complete 300 different Quests": +75% Equinox bar fill rate. Source: `data/website-data/shared-data.json#L7886-L7890`, tier 1, 2026-10-19.
