# Amarok, W1 keys, W1 system-gating quests, and the Arcade pointer

Part of the [W1 System Dossiers](../2026-10-17-w1-systems.md). The source pins are listed there.

## Amarok (W1 boss) and Forest Villa Keys

- **What it is:** the World 1 boss, fought in a key-gated arena at End Of The Road (Blunder Hills), in three difficulties. Killing him gives the **Desert Topaz**. Builder Bird needs it to open the **portal to World 2**. (H: Toolbox `quests.json` `Builder_Bird` 1 "Restoring Power to the Portal" needs `Desert_Topaz`; wiki [Amarok](https://idleon.wiki/wiki/Amarok), rev. 2026-10-02, bot data)
- **Unlocks:**
  - You need **Forest Villa Keys** to enter: Normal 1, Chaotic 5, Radiant (formerly "Nightmare") 30. (wiki, bot data)
  - **Dog Bone** (the ghost by the boss door) gives 6 keys for quest 1 ("Why he Die???", 3 Wood Board Bones) and 5 for quest 2 ("Bow Wow going Dow..n!", 25 Amarok Slabs).
  - After that, the game text says: "Come talk to me every day, and I'll give you another key! I'll keep track up to 3 days … for every character you make that makes it this far, I'll give you an additional key per day … I'll give you all the keys the first time you tap me!" (H: N.js `addDialogueFor("Dog_Bone")`)
  - In code, a character counts once its Dog Bone dialogue is past 5 (Toolbox `enhanceKeysObject`: `amountPerDay = #characters with npcDialog.Dog_Bone > 5`, `totalAmount = min(daysSincePickup, 3) × amountPerDay`, days counter `OLA[16]`).
  - Other key sources: Dew Drop Colosseum chests, and Post Office rewards (Simple Shippin, Plan-it Express, Down Undelivery; see [post-office.md](post-office.md)).
  - **Builder Bird** appears once any character reaches class Lv 17 (H: N.js NPC gate). The **Scripticus** tutorial quest 11 asks you to kill Amarok and recover the town gem.
- **Scope:**
  - Keys are an **account** currency (`currencies.KeysAll[0]`).
  - The daily key **income** scales with the number of characters that have done Dog Bone's quests.
  - Kills and the W2 portal: the portal quest is Builder Bird's. Each character walks to W2 through the portal once it is open (M).
- **Inputs → outputs:**
  - **In:** keys and an active fight (bosses are not AFK content).
  - **Out (Normal):** Desert Topaz (once per kill), 500 coins, Magic Meatloaf (1/20; Picnic Stowaway's quest 9 item), **Amarok Card** (1/25, +2.5% Skill AFK gain rate), Amarok Slab (1/3.33, crafting material for **Amarok gear**), Granite Obol of Amarok's Stare (1/1,430), the Anvil Zoomer Stamp (1/833), plus Super Drop Table rolls (Silver Pen 1/3,580, talent books, …).
  - **Chaotic:** 8M HP; Chaotic Amarok Card +2.5% Fighting AFK gain (1/50).
  - **Radiant:** 100M HP; Radiant Amarok Card +3 Weapon Power.
  - (wiki bot tables; the "1 in 254%" display means "1 in 25, 4%".)
- **Goals and Milestones:**

| Milestone | Why |
|---|---|
| First Amarok kill → Desert Topaz → Builder Bird | **W2 portal** (progression gate) |
| Dog Bone quests done on every character | +1 key/day per character, banked 3 days |
| 25 Amarok Slabs | Dog Bone quest 2 (+5 keys); Amarok gear crafts |
| Amarok gear (boots, pants and chestplate first; the helmet needs 5 Woodular Circles; the pendant needs Distilled Water and Chaotic Slabs) | Defence and upgrade slots, "you are gonna use this armor until late w5 or even world 6" (Incomplete Guide, **Stale**) |
| Amarok Card 1★ … (card tiers) | +Skill AFK (cards dossier) |
| Tiki Chief quest 4: 5 boss kills, and 1 kill in under 30 s | Tiki Chief Token, Mystery Upgrade Stones |
| Chaotic, then Radiant | Better cards and slabs; late |

- **Feeds / fed by:**
  - **Fed by:** keys (Dog Bone, Colosseum, Post Office), fighting power (every damage System: [Stamps](stamps.md), [Statues](statues.md), [Post Office](post-office.md) Civil War, Orion damage), and food.
  - **Feeds:** the W2 unlock (every W2 System), Amarok gear (survivability for pushing W2–W3), the Skill or Fighting AFK cards, and Dog Bone's own quests. Amarok Slabs are also a Dudes Next Door order item.
- **Per-session actions:**
  1. Tap Dog Bone (from any character) to collect banked keys before 3 days pass. Toolbox's `keys` alert fires at 3+ days; ActiveOn should fire at 2.
  2. With keys and the damage, run Amarok kills as an **Active Play suggestion**.
  - **Idle or capped state:** 3 days of keys banked, which caps.
- **AFK Setup implications:** none, since bosses need active play. Indirectly, a new character should be walked to Dog Bone and through his first quest early, so it adds +1 key/day.
- **Min-max by stage:**
  - **Late W1:** reach the boss room (Scripticus quest 10), do Dog Bone quest 1, kill Amarok on your strongest character, and open W2.
  - **W2:** farm Normal Amarok for Slabs and gear. Do Dog Bone on every character as each one arrives.
  - **W3:** Chaotic for the card and the pendant.
  - **Per class:** the wiki's tactics say Warriors stay on the lower platform (melee range, only the stomp to dodge) and Archers and Mages use the upper platform.
- **Common mistakes:**
  - **Dog Bone's quests done on only one character.** Detect `KeysAll[0].amountPerDay < #characters that have reached the boss area`. In the fixtures, `amountPerDay` was 4 on the W2 account and 2 on the W3 account.
  - **Keys left uncollected for 3+ days** (`daysSincePickup ≥ 3`).
  - **Stockpiling keys** instead of using them for slabs and cards.
- **Save and Toolbox fields:**
  - `account.currencies.KeysAll[]` (`{amount, name 'Forest_Villa_Key', rawName 'Key1', amountPerDay, daysSincePickup, totalAmount}`; index 0 is Amarok), `accountOptions[16]` (days since the Dog Bone pickup), `characters[i].npcDialog.Dog_Bone`, `characters[i].quests` / `account.quests.Blunder_Hills[]` (`{name, index, npcQuests}`).
  - Boss kill counts sit in the kill and achievement data (cross-cutting dossier, [#24](https://github.com/YassSoliman/idleon-forge/issues/24)).
- **Sources:** N.js v1.23 (2026-10-17): `addDialogueFor("Dog_Bone")` (daily key text), NPC spawn gates (Builder Bird `17 > highest Lv`). Toolbox @ 6827d3f: [`parsers/misc.ts`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/parsers/misc.ts) `enhanceKeysObject`, `quests.json` (`Dog_Bone`, `Builder_Bird`, `Scripticus`, `Tiki_Chief`), `baseTrackers.js` (`keys`). Wiki: [Amarok](https://idleon.wiki/wiki/Amarok) (rev. 2026-10-02), [Dog Bone (NPC)](https://idleon.wiki/wiki/Dog_Bone_(NPC)) (rev. 2026-09-27). Idleon Incomplete Guide W1 tab (**Stale**; Amarok gear notes). r/idleon ["No daily Amarok keys coming in?"](https://www.reddit.com/r/idleon/comments/1wkqz14/) (2026-09-19: "Talk to blue NPC near boss room"; another reply says keys can be claimed from the Ez Access shops tab with an achievement. **Unverified**, so check it before encoding).

## W1 quests and town unlocks that gate Systems

Not a System in itself. This is the gate table the other dossiers' **Unlocks** rows depend on. "Highest Lv" means the highest class level of any character on the account. (H unless marked: N.js GrasslandaTown init `OLA[247–251]` thresholds and NPC spawn gates; Toolbox `quests.json`.)

| Gate | Requirement (code) | Opens | Per character? |
|---|---|---|---|
| Storage Chest (W1 town) | Highest Lv ≥ 7, then buy (OLA[247]) | Shared storage | account |
| Scripticus quests 1–13 | Tutorial chain: craft gear, mining cert (Glumlee), choose a class (Promotheus), Stiltzcho, boss room, Amarok, Blunder Hero trophy; quest 13 has you create a 2nd character at Lv 8 | Inventory bags, Blue Tee recipe, 150 gems, the flow to every W1 System | per character |
| Woodsman | First character Lv ≥ 11 | Choppin pouch, Old Hatchet | per character |
| Glumlee 1–3 | Mine copper, smelt a bar, buy 2 Forge upgrades | Mining Certificate, Junk Pickaxe, Tutorial Oil ([forge.md](forge.md)) | per character |
| **Promotheus 1** | **Class Lv 10** | First class (Warrior / Archer / Mage) | per character |
| **Mr Pigibank** | Highest Lv ≥ 14, buy (OLA[248]), quest "buy a stamp from the town shop" | **Stamps and Bribes** ([stamps.md](stamps.md), [bribes.md](bribes.md)) | account |
| Hamish 1–3 | Copper Chopper, Purple Tupacband, 50 Slime Sludge | Tomahawk Stamp, Choppin' Bag Stamp, **Storage Chest 1** | per character |
| Builder Bird | Highest Lv ≥ 17; quest needs the Desert Topaz | **W2 portal** | account |
| **Forge** | Highest Lv ≥ 18, buy (OLA[249]) | [Forge](forge.md) | account |
| **Town Marble** | Highest Lv ≥ 22, buy (OLA[250]); quest: Sculpting Tools from the town shop | **Statues** ([statues.md](statues.md)) | the quest is per character (wiki) |
| Grasslands Gary | Highest Lv ≥ 28, buy (OLA[251]) | **Tasks** (Task Board unlocks, many anvil recipes) | account |
| Obol Altar | Highest Lv ≥ 30; quest: BobJoePickle from the town shop | **Obols** (cards and obols dossier, [#19](https://github.com/YassSoliman/idleon-forge/issues/19)) | quest scope unverified |
| Krunk 1–3 | Ores, bars, 20 Power Statues; logs, nails, thread | **Storage Chest 3**, Speed Statues | per character |
| Sprout 1–4 | 500 Stick + 1,500 Iron Ore … | 12 Thicc Skin Statues … | per character |
| Stiltzcho 1–6 | Timed kills; AFK at Spores 4 h / Frogs 8 h / Slimes 16 h | Speed Statues, Time Candy | per character |
| Picnic Stowaway | Scripticus dialogue ≥ 32. Quests 1–3 are one-off; **quests 4–12 are a daily line** (reset each day, at dialogue 20) | Golden Jam/Kebabs/Meat Pie, Picnic Tokens → King of Food trophy | **per character daily** (Toolbox `picnicDaily` alert) |
| Tiki Chief 1–4 | Planks + nails; 3 flyers; 5,000 Goblins; Amarok 5 kills, 1 in < 30 s | 50 Kachow Statues, **Questin Stamp** | per character |
| Dog Bone 1–2 | 3 Wood Board Bones; 25 Amarok Slabs | Keys, then **+1 key/day for this character** | per character |
| Funguy, Bushlyte, Rocklyte, Cactolyte | Peanuts, skill levels, Journeyman | Golden Peanut recipe, Toilet Paper Postage talent book, Time Candy, gems | per character |
| Grand Owl Perch (map 42) | Reach the map | [Orion](owl.md) | account |
| Postboy Pablob (W2) | Highest Lv ≥ 50; 5 Empty Boxes (Anvil Tab 2) | [Post Office](post-office.md) | account |

- **For ActiveOn:** a character-level Goal "finish NPC X's quests" should come from the parsed `characters[i].quests` and `npcDialog`. An account-level gate ("highest Lv ≥ 14 → buy Mr Pigibank") comes from `max(characters[].level)` plus the OLA flag. The fixtures show the account flags already set. The missing per-character quests (Dog Bone, Town Marble) are where the value is.
- **Stale claims to avoid:**
  - Stamps open at "class level 12" (wiki and guide): the code says 14.
  - The wiki's "bought for 10 / 20" prices for town NPCs: I did not verify the currency or units.
  - Pre-2025 smelt times (see [forge.md](forge.md)).
  - "Eliteus is W3": he is W4 (mechanics research).
- **Sources:** N.js v1.23 (2026-10-17): GrasslandaTown scene init (`OLA[247]`–`[251]` with thresholds 7/14/18/22/28), the NPC actor spawn block (Woodsman, Builder Bird, Mr Pigibank, Town Marble, Grasslands Gary, Obol Altar, Postboy Pablob, Picnic Stowaway), `_event_Stamps` / `_event_Forge` / `_event_Statue` / `_event_Tasks` building handlers. Toolbox @ 6827d3f: [`data/website-data/quests.json`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/data/website-data/quests.json), [`utility/dashboard/characters.js`](https://github.com/Morta1/IdleonToolbox/blob/6827d3f2afcaa63336446f2a08c92e0e060cbcd1/utility/dashboard/characters.js) (`questsAlerts` / picnic daily). Wiki: [Mr Pigibank](https://idleon.wiki/wiki/Mr_Pigibank), [Town Marble](https://idleon.wiki/wiki/Town_Marble), [Quests](https://idleon.wiki/wiki/Quests).

## Arcade (pointer only)

The Arcade is **not a W1 System**. It is reached through the juggling clown in the **Yum-Yum Desert (W2)** town ([wiki Arcade](https://idleon.wiki/wiki/Arcade), rev. 2026-10-17). The W2 dossier ([#21](https://github.com/YassSoliman/idleon-forge/issues/21)) covers it.

W1 links into it:
- three Misc stamps (Arcade Ball Stamp, Gold Ball Stamp, Ball Timer Stamp; [stamps-table.md](stamps-table.md));
- the Weighted Marbles bribe (+10% ball rate; [bribes.md](bribes.md));
- Arcade shop bonus 26, which raises Forge ore capacity ([forge.md](forge.md)).

v1.23 (2026-10-16) added an OMEGA Arcade upgrade tier paid in Omega Balls from the W7 Menagerie (N.js patch notes).
