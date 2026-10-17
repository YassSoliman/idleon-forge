# M8 Collections

Spec for [#36](https://github.com/YassSoliman/idleon-forge/issues/36), part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Build order slot: M1 → M11 → M2 → M10 → M13 → M3 → M6 → M4 → M7 → **M8** → M9 → M5, with M12 alongside. Terms follow [`GLOSSARY.md`](../../GLOSSARY.md). Decisions follow ADRs [0002](../adr/0002-deterministic-advice-ai-built-knowledge.md) (deterministic advice), [0004](../adr/0004-source-precedence.md) (source precedence), [0005](../adr/0005-toolbox-numbers-not-our-formulas.md) (Toolbox numbers plus arithmetic) and [0007](../adr/0007-generated-facts-authored-judgment.md) (generated facts, authored judgment).

**Inputs this spec is built from:**
- The Leverage model (`research/leverage-model`, #26): Stages, the shared position-3 "free-value fills" block (3a obols, 3b cards), and the Stage list items for stamps and cards.
- The dossiers: W1 stamps (`research/w1-systems`, `stamps.md` and `stamps-table.md`, #20) and cards, card presets and obols (`research/cards-obols`, #19).
- The priority verification overlay (`research/priority-verification`, #27). It wins on conflicts. Relevant rows: PV 2.1–2.7 and PV 3.6.
- The Knowledge Base shape (#11), the Now screen rules (#10, #12), the architecture (#14) and the hypothetical-math spike (#16).
- The M1 and M10 drafts, for the Account State growth rule (M1 TR-11) and the engine output shape (M10 TR-2).
- Toolbox game data at the dossier pin `6827d3f` (gameVer 2.3.540): `data/website-data/quests.json` (`itemReq`, `rewards`, `customArray`), `shared-data.json` (`shops`, `obols`, `liquidsShop`, `cardSets`), `stamps.json`, `cards.json`, `monsterDrops.json`, `crafts.json`, `items.json` and `gemShop.json`.

**Fixture facts below are aggregates** from the two private parsed saves, read 2026-10-17. Characters are named by account, class and level only.

---

## 1. Purpose

Stamps, cards and obols are three collections that each give permanent power. Both MVP accounts leave a lot of that power unclaimed, partly because the player can't easily tell what is within reach. Collections answers two questions for every item the player doesn't have yet: **can I get it right now** (and if so, on which character and with what), or **what do I work toward** to get it (and how far away is it)? It also covers the loadout half of cards and obols: cards and card sets equipped to match each character's activity, and stored obols placed into empty slots, family slots first. In player terms: "4 stamps are yours for one trip to two town shops and one quest hand-in. Two quests you've already started would give you 4 more if you play them for a few minutes. Your 4 spare obols belong in your empty family slots."

## 2. Scope / Out of scope

**In scope (MVP, W1–W3 plus W4 entry):**
- **Stamps, acquisition only:** each obtainable stamp the account doesn't own, classified as *now*, *active*, *toward* or *later* (§5, TR-5). Routes are town shops, NPC quests (item hand-ins and custom quests), crafting one level deep for a quest item, and monster or skilling drops.
- **Cards:**
  - empty card slots, a missing or wrong card set, a passive card in a slot, the Blunder Hills set kept past Lv 50, and the active card preset not matching the AFK Target;
  - first copies and next levels of cards on a character's current map (supplied to M4 as Contributions);
  - card set tier progress.
- **Card presets:** which preset to switch to, or which empty preset to fill, for the character's AFK Target.
- **Obols:**
  - Obol Altar unlock;
  - stored obols with an empty slot of the same shape, family slots first;
  - the next family and personal slot unlocks (arithmetic on family level and character level);
  - obtainable obol sources by Stage, as Acquisition entries.
- **The generated Acquisition entries** for all four (ADR 0007), plus the authored Checks, Goals, Contributions and Priority Lists around them.

**Out of scope:**
- **Buying stamp levels with coins, and raising stamp caps with materials.** That is the M7 Spend Plan, including Hydrogen-atom batching and Gilded Stamps. M8 hands M7 one fact: a stamp that is collected but at Lv 0 (TR-5) is a spendable.
- **Merits** (the W2 "Monsters now drop Obols" merit), **daily Liquid Shop obol buys** and **Gem Shop purchases** (card slots, card presets, obol stacks, storage). These belong to M6 and M7. M8 shows them only as the reason a route is blocked ("obols don't drop until the W2 obol merit"). The Gem Shop first buy is Contested (PV 7.5).
- **Obol min-maxing:** rerolls, combining, the drop-rate best-in-slot ladder, destroying for fragments. The ladder is in the dossier; it becomes an M8 follow-up once the free-value fills are shipped (§8 lists none, because it's a post-MVP item).
- **Moving a character to another map for a card or a stamp drop.** That is a Higher-leverage option (M5). M8 only reports what the *current* activity yields.
- **Talent presets and builds** (M9). M8 checks only *card* presets.
- **W4+ collection systems:** Gilded and Exalted Stamps, Lab chip card boosts, 5★/6★ cards, W4+ card sets. Their stamps and cards count as *later*.
- **Writing a card-drop multiplier formula.** Toolbox doesn't compute `CardChanceMulti`, and ADR 0005 forbids writing it. Card ETAs use the base rate as a conservative ceiling.

## 3. Functional requirements

Stamps
- **FR-1** For every obtainable stamp, M8 computes one **acquisition status**: `owned`, `now`, `active`, `toward`, `later` or `unknown`, from the best of its routes (TR-5). "Obtainable" means it is in the generated stamp list and not on the authored unobtainable list (TR-8).
- **FR-2** A stamp counts as **owned** when its `maxLevel > 0` or its `level > 0`. A stamp with `maxLevel > 0` and `level == 0` is collected but gives nothing yet. M8 emits no action for it and flags it to M7 as a spendable (TR-5).
- **FR-3** A **shop** route is `now` when the shop's town is in a world the account has reached (world ≤ `currentWorld`) and some character holds the price in coins. If the price is missing from generated data, the action says "costs coins" with no number, and its confidence drops to M (TR-8).
- **FR-4** A **quest hand-in** route (`ItemsAndSpaceRequired`) is `now` when all of these hold:
  - the NPC's world is reached;
  - some character has the quest accepted (status 0), or can accept it (status −1 with the previous quest of that NPC done on that character);
  - every `itemReq` amount is held, counting unequipped items in chests, refinery storage and inventories;
  - the quest's `InventorySpacesNeeded` free slots exist on the chosen character.

  Equipped items never count (TR-6).
- **FR-5** If a hand-in item is missing but its `crafts.json` recipe materials are all held, the route is still `now`. The Next Action names both steps: craft it, then hand it in. Crafting is followed one level deep only.
- **FR-6** A **custom quest** route (kills against a timer, finding platforms, a minigame streak, inviting NPCs) is `active` when the quest is accepted or acceptable on some character. It is shown as an **Active Play suggestion** with an authored time estimate. It never touches a Verdict (#10 item 7).
- **FR-7** **Look-ahead:** when a `now` or `active` quest's *next* quest on the same NPC is a hand-in whose items are already held, the suggestion adds "then: <next quest> gives <stamps> (items already held)". The look-ahead goes one step only.
- **FR-8** A route whose requirements can be met within the account's reached worlds, but not yet, is `toward`. It shows the gap ("8 of 30 Redox Salts"). It gets an ETA only when the arithmetic is allowed: fighting drops (ETA = remaining ÷ (Toolbox `finalKillsPerHour` × generated drop chance)), or a refinery product (from Toolbox refinery cycle output). Skilling drops get no rate (#11 item 8).
- **FR-9** A stamp whose every route sits in an unreached world, or behind a locked system, is `later`. Such stamps are never listed one by one. The Collections Goal shows a count only ("23 more open up in later worlds").
- **FR-10** Placement follows #10 item 6:
  - routes that need a specific character (a quest accepted on that character, an item in that character's inventory) go on that character's row;
  - shop buys go in the Account section, with "from a character holding at least N coins".

  For a quest accepted on several characters, M8 picks the one with the highest class level.
- **FR-11** **Grouping (see D1):** all `now` shop buys form one account Goal, "New stamps from town shops". Its single Next Action lists them in Priority List order, grouped by town. Each `now` quest hand-in is its own Goal on the chosen character's row.
- **FR-12** A stamp drop from a character's current AFK Target is supplied to M4 as a Contribution ("this map can drop the X Stamp, within about N h at base rate"). It is never a Next Action.

Cards and card presets
- **FR-13** **Empty slots:** a character with fewer equipped cards than `4 + gemShopPurchases[63]`, while the account owns unequipped cards that fit its activity, gets a Next Action to fill them. The cards come from the activity's authored preset matrix, with the highest-level owned card first (TR-9).
- **FR-14** **Card set:** a character with no set, or with a set that doesn't fit its AFK Target, gets a Next Action to equip the best set for its activity at tier ≥ 1, per the authored set Priority List (TR-9, D3). Tier = `floor(Σ card levels in the set ÷ set size)`, from Toolbox `getCardSets`.
- **FR-15** **Blunder Hills past Lv 50:** the Blunder Hills set equipped on a character at Lv ≥ 50 gives nothing. The Next Action swaps it per FR-14.
- **FR-16** **Passive card in a slot:** a passive card (its effect contains `(Passive)`) equipped in a slot gets a Next Action to replace it, because it works without being equipped.
- **FR-17** **Preset mismatch:** when the active preset's cards fit another activity (by effect keyword, TR-9) and another preset fits the AFK Target, the Next Action is "Switch to card preset N". When no preset fits, it is "Fill card preset N (empty) for <activity>, then switch to it". M8 never suggests overwriting a non-empty preset that fits another activity the character uses.
- **FR-18** **Card Contributions for M4:** for each character's current AFK Target that drops a card, M8 emits a Contribution:
  - an unowned card is "first copy", with the 5× unowned bonus applied to the base chance;
  - an owned card below level 5 is "N of M copies for Lv k".

  The ETA comes from Toolbox kills per hour, for fighting only. The stop rule ("stop at Lv 5") is passed to M4 as the Milestone's `stopHere` flag (dossier rule 5, O).
- **FR-19** **Set tier Goal:** for each set that a character uses or that FR-14 recommends, M8 shows "Set tier t: Σ s of (t+1)×size for tier t+1". The Next Action names the single card with the shortest ETA among the set's cards that drop on the current maps. When no card qualifies, there is no Next Action and the line appears only under "show more".

Obols
- **FR-20** **Altar locked:** when the highest character is Lv ≥ 30 and the Obol Altar quest (`Obol_Altar1`, 1 Bob Joe Pickle) isn't done, the Next Action is the hand-in, and FR-4/FR-5 logic applies to the pickle.
- **FR-21** **Stored obols:** for each obol in storage with an empty, unlocked slot of the same shape, M8 emits one Next Action per destination: "Equip <k> stored obols in family <shape> slots". Family slots are filled first, then personal slots. Within personal slots, characters are taken in Visit Order. Any stat beats an empty slot (PV 2.5, confirmed).
- **FR-22** **Next slot Milestones:** the obol Goal carries a Milestone for the next family slot and, per character, the next personal slot. Each is the lowest-gated slot the save still marks `ObolLocked*`, with its shape and gate (family level or character level). The gap is arithmetic, and there is no ETA. **Anomaly rule:** if that locked slot's gate is already met (the W3 fixture shows the family slot gated at 350 locked at family level 379), M8 shows no Milestone for it. It records a diagnostic and claims nothing, because the save's lock state and the gate table disagree, and M8 can't tell which is right.
- **FR-23** **Why obols aren't dropping:** while the W2 obol merit is at 0, the obol Goal says "obols don't drop until the W2 merit 'Monsters now drop Obols'". It links to M6's merit Goal rather than issuing its own action.

All modules' shared rules
- **FR-24** Every M8 Next Action has a Source label (#10 item 10). Generated entries cite Toolbox game data (tier 1) with the parser pin's game version. Authored orders cite their dossier and PV row, with their status (confirmed, unverified or contested).
- **FR-25** Done comes from the save (#10 item 8). A stamp action disappears when the next save shows it owned. A card action disappears when the slot, set or preset matches. An obol action disappears when the storage count drops and the slot fills.
- **FR-26** Unknown, never a guess: if any field a Detector needs comes from a parser section in `diagnostics.failedSections` (M1 TR-11 `isKnown`), that Detector returns Unknown, and nothing it would have said is shown.
- **FR-27** "Not covered yet: Gilded and Exalted Stamps, obol min-maxing" appears in the Account section footer (#11 item 14).

## 4. User stories

Each story's acceptance criteria are written as **Given fixture / When engine runs / Then Now screen shows**. They double as golden-snapshot assertions (#13 item 4). "W2-late account" and "W3-early account" are the two private fixtures, with Stages per the Leverage model §1.3.

**US-1 Stamps I can grab right now.** As a player in a Play Session, I want to see which stamps I can get this session without any grinding, so that I collect free permanent bonuses before I go AFK.
- Given the W3-early account (17 stamps owned, 333 total stamp levels) / When the engine runs / Then the Account section has the Goal "New stamps from town shops" with one Next Action. It lists **Vitality Stamp** (Encroaching Forest Villas shop), then **Matty Bag Stamp** and **Clover Stamp** (Faraway Piers shop), in stamp Priority List order: Matty Bag is a carry stamp, so it comes first in its town. Source: game data (Toolbox `shared-data.json` `shops`).
- Given the W2-late account (8 stamps owned, one of them at Lv 0) / When the engine runs / Then the same Goal lists **Vitality**, **Matty Bag**, **Clover** and **Vendor Stamp** (Yum Yum Grotto shop), 4 in all. The Vendor Stamp appears here and not on the W3 account, because the W3 account already owns it.
- Given either fixture / When the engine runs / Then no stamp the account already owns appears in any M8 action, and no shop in an unreached world (W3 town on the W2 account) appears.

**US-2 A quest hand-in I didn't realise I could do.** As a player in a Play Session, I want to be told when I'm already holding what a stamp quest needs, so that I hand it in on the right character instead of discovering it weeks later.
- Given the W3-early account, where the Bowman (Lv 60) has Hamish quest 1 accepted and carries a Copper Chopper in its inventory / When the engine runs / Then the Bowman Lv 60 row shows "Give Hamish the Copper Chopper you're carrying → Tomahawk Stamp". The Wizard (Lv 73) also has a Copper Chopper, but equipped as its tool, so it is not mentioned anywhere.
- Given the W2-late account, where the Barbarian (Lv 60) has Hamish quest 1 accepted, no unequipped Copper Chopper is held, and 161 Oak Logs are in storage / When the engine runs / Then the Barbarian Lv 60 row shows "Craft a Copper Chopper at the Anvil (6 Oak Logs), then give it to Hamish → Tomahawk Stamp" (FR-5).
- Given the W3-early account, where the Squire (Lv 85) has Snouts quest 1 accepted and the account holds fewer than 30 Redox Salts (8 in refinery storage) / When the engine runs / Then that quest shows under "show more" as `toward`: "Snouts 1: 8 of 30 Redox Salts → Buckler Stamp", with an ETA from the refinery cycle. It is not a Next Action, and it carries the cost note "uses Redox Salts, which also pay for Construction" (D4).

**US-3 Short active quests for stamps.** As a player with spare time in a Play Session, I want stamp quests that need hands-on play to be offered as optional, so that I can do them when I have time without them blocking my log-off.
- Given the W3-early account / When the engine runs / Then "If you have time" lists:
  - **XxX Cattleprod XxX quest 2** on the Squire Lv 85 (accepted): "kill 30 Mafiosos and 18 Sand Castles before the timer runs out → Mason Jar Stamp + Fishhead Stamp", with its authored time estimate;
  - **Wellington quest 1** (accepted on the Wizard Lv 73, the Squire Lv 85 and the Barbarian Lv 56; offered on the Squire Lv 85, the highest level): "find the 3 hidden platforms → Brainstew Stamp + Arcane Stamp". It adds the look-ahead line "then: Wellington 2 gives Fly Intel and Holy Mackerel Stamps; you already hold the 2,500 High Steaks, Wakka Cherries and Singlecles", plus a carry-capacity caveat (TR-6).

  No Verdict changes because of either.
- Given the W2-late account / When the engine runs / Then "If you have time" lists **XxX Cattleprod XxX quest 1** (accepted on the Barbarian Lv 60, the Squire Lv 43 and the Bowman Lv 54; offered on the Barbarian Lv 60) → Lil' Mining Baggy Stamp + Catch Net Stamp, and **Wellington quest 1** (offered on the Barbarian Lv 60) → Brainstew + Arcane. The Wellington 2 look-ahead does *not* appear, because the account holds fewer than 2,500 of each Wellington 2 item.
- **Fixture totals, the hand analysis made exact:** W3-early: 4 stamps `now` (3 shop + Tomahawk), 4 `active` from 2 quests, 2 more one step behind, 1 `toward` (Buckler). W2-late: 5 `now` (4 shop + Tomahawk via craft), 4 `active` from 2 quests, Fist Stamp `toward` (Mutton 1 on the Squire Lv 43, needing 3 items it doesn't hold).

**US-4 How far I am in stamps.** As a player in a Play Session, I want one line saying how many stamps I have and how many are within reach, so that I know whether stamps are worth my time today.
- Given the W3-early account / When the engine runs / Then the Collections Goal header reads "Stamps 17 of 121 · 4 now · 4 with active play · N later". N is the generated count of `later` stamps; the golden snapshot pins it.
- Given the W2-late account / When the engine runs / Then it reads "Stamps 8 of 121 · 5 now · 4 with active play · …". The Bullseye Stamp at Lv 0 counts as owned, and it appears in M7's Spend Plan, not here.

**US-5 Cards on every character.** As a player in a Play Session, I want every character to have its card slots and card set filled for what it's doing, so that no character goes AFK without free bonuses.
- Given the W2-late account (all 5 characters with no card set; the Shaman Lv 44, the Bowman Lv 54 and the Wizard Lv 56 with 0 cards; set tiers Blunder Hills 1, Yum Yum 1, Easy Resources 0) / When the engine runs / Then:
  - the Shaman Lv 44, Bowman Lv 54 and Wizard Lv 56 rows each show "Equip 4 cards" naming the cards from the fighting matrix;
  - the fighting Barbarian Lv 60, Bowman Lv 54 and Wizard Lv 56 rows show "Equip the Yum Yum Desert set (tier 1, +10% food effect)";
  - the fighting Shaman Lv 44 row shows "Equip the Blunder Hills set (tier 1, +8% EXP below Lv 50)";
  - the mining Squire Lv 43 row shows no set action, because no skilling set is at tier 1. Its "show more" holds the Easy Resources tier Goal at "Σ 5 of 13".
- Given the W3-early account / When the engine runs / Then:
  - the Shaman Lv 54 row shows "Equip 4 cards";
  - the Bowman Lv 60 row shows "Replace the Fire Forge card (passive, works unequipped) and fill 3 empty slots";
  - the fishing Barbarian Lv 56 and mining Squire Lv 51 rows show "Equip the Easy Resources set (tier 1, +8% skill efficiency)";
  - the fighting Wizard Lv 73, Bowman Lv 60 and Shaman Lv 54 rows show "Equip the Yum Yum Desert set (tier 2, +20% food effect)". The set tiers on this account are Blunder Hills 2, Yum Yum 2, Easy Resources 1 and Frostbite 1;
  - the Squire Lv 85, which already has the Yum Yum set, gets no set action under the default rule (D3).

**US-6 The right card preset for the job.** As a player in a Play Session, I want to be told when a character's active card preset is for a different activity, so that a fighter isn't AFK on choppin cards.
- Given the W3-early account, where the fighting Wizard Lv 73 has its choppin preset (preset 2) active and a fighting preset (preset 1) stored / When the engine runs / Then the Wizard row shows "Switch to card preset 1 (fighting)".
- Given the W2-late account, where the mining Squire Lv 43 is on a preset of combat cards and its preset 2 is empty / When the engine runs / Then the Squire row shows "Fill card preset 2 for Mining (Iron card first), then switch to it".
- Given either fixture / When the engine runs / Then no preset action appears on any character whose cards already fit its AFK Target.

**US-7 Cards my map is already giving me.** As a player in a Play Session, I want a character's Purpose to show the card progress its map gives, so that I know when to stop farming a map for its card.
- Given the W3-early account, where the Squire Lv 85 fights Thermister and owns 0 Thermister cards / When the engine runs / Then its Purpose includes "Cards: first Thermister card". The ETA is computed as `1 ÷ (finalKillsPerHour × 0.0001 × 5)`, labelled "at base rate, likely sooner".
- Given the W2-late account, where the Bowman Lv 54 fights Green Mushrooms with 3 copies / When the engine runs / Then its Purpose includes "Cards: Green Mushroom 3 of 6 for Lv 2".
- Given the W2-late account, where the Shaman Lv 44 fights Slimes and the Slime card is Lv 5 / When the engine runs / Then no card Purpose line appears for it, because the stop rule has been reached.

**US-8 Spare obols into empty slots.** As a player in a Play Session, I want stored obols placed in empty slots, family slots first, so that obols I already own stop sitting idle.
- Given the W3-early account (4 Silver circle obols in storage; 6 unlocked family slots empty, 5 circles and 1 square; obol merit 7 of 7) / When the engine runs / Then the Account section shows "Equip your 4 stored obols in family circle slots", with Source "game data" and PV 2.5 (confirmed). The obol Goal reads "Family obols 0 of 6 filled". It shows **no** next-family-slot Milestone, because this save marks the family slot gated at 350 as locked although the family level is 379 (the FR-22 anomaly rule).
- Given the W2-late account (1 Silver circle obol in storage; the same 6 family slots empty; obol merit 0) / When the engine runs / Then it shows "Equip your stored obol in a family circle slot" and the line "Obols don't drop until the W2 merit 'Monsters now drop Obols'" (linking to M6). The next family slot is at family level 350 (93 to go).
- Given either fixture after the obol action is done (the next save shows storage empty and the slots filled) / When the engine runs / Then the action is gone and is listed under "done this session" (#10 item 8).

**US-9 No collections advice from a broken read.** As a player in a Play Session, I want collections advice withheld when part of my save didn't read, so that I'm never told to buy something I already have.
- Given the W3-early account with the `stamps` parser section forced to fail / When the engine runs / Then no stamp action appears, and the Collections Goal reads "Can't tell right now" (Unknown). Card and obol actions still appear.

## 5. Technical requirements

### Package boundaries
- **TR-1** M8 lives in `packages/engine/src/collections/`, with Detectors in `detectors/` and pure helpers in `routes.ts`. Its Knowledge Base entries live in `packages/knowledge/systems/{stamps,cards,card-presets,obols}.yaml` (authored) and in the M11 generator's output for those Systems (generated; M11 sets the path, e.g. `packages/knowledge/generated/<system>.json`). M8 imports only the `account-state` and `knowledge` types, plus the engine's Detector interface (M11). It never imports Toolbox at runtime.
- **TR-2** M8's Detectors run in the parse Web Worker with the rest of the engine (M10 TR-6). They read only the Account State, the save history, `now` and the Knowledge Base (#11 item 2).

### Knowledge Base entries (the #11 shape)

- **TR-3** **Generated entries (ADR 0007), one per item, regenerated at every parser re-sync:**

  | System | Entry type | Count (pin 6827d3f) | Generated from |
  |---|---|---|---|
  | `stamps` | Acquisition | 128 in data; 121 obtainable after the authored override (TR-8) | `stamps.json` (catalogue); `shared-data.json` `shops` (shop routes); `quests.json` (`rewards` with `rawName` `Stamp*`, plus `itemReq`, `customArray`, `Type`, `InventorySpacesNeeded`); `monsterDrops.json` (drop routes, `effectiveChance`); `crafts.json` (one-level craft for quest items); `items.json` (names, shop price if present) |
  | `cards` | Acquisition | about 150 W1–W3 plus boss cards; the W4+ ones as `later` | `cards.json`, `monsterDrops.json` (card entries with base chance), `shared-data.json` `cardSets` (set membership and size) |
  | `obols` | Acquisition | the W1–W3 obol sources | `monsterDrops.json` (boss and Gigafrog obols), `shared-data.json` `liquidsShop`, `obols` (personal and family slot gates and shapes), `gemShop.json` (marked `kind: gemShop`; info only) |
  | `card-presets` | Acquisition | 2 entries: base presets (Lv 15) and Gem Shop presets / card slots | `gemShop.json` (`GemQ9`, index 63, 66) plus the authored Lv 15 gate (wiki, M; TR-8) |

  A generated entry looks like this (YAML view of the JSON the generator writes):

  ```yaml
  id: stamps.acq.StampA4
  system: stamps
  type: acquisition
  generated: true
  target: { kind: stamp, rawName: StampA4, name: Tomahawk Stamp, tab: combat }
  routes:
    - kind: quest
      world: 1
      npc: Hamish
      questIndex: 0          # Hamish1, "The Hamazing Plot Twist"
      questType: ItemsAndSpaceRequired
      consumes: true
      inventorySpacesNeeded: 1
      requires:
        - { kind: item, rawName: EquipmentToolsHatchet3, name: Copper Chopper, amount: 1,
            craft: { materials: [ { rawName: OakTree, name: Oak Logs, amount: 6 } ] } }
      alsoRewards: [ { rawName: Experience3, amount: 100 } ]
  text: "{action} → {target}"
  sources:
    - { label: "game data (Toolbox quests.json)", url: "https://github.com/Morta1/IdleonToolbox/blob/6827d3f/data/website-data/quests.json", tier: 1, verifiedOn: 2026-10-17, gameVersion: 2.3.540 }
  appliesTo: { stages: all }
  confidence: H
  status: active
  ```

- **TR-4** **Authored entries** (hand-written judgment; each references generated entries by id):

  | id | Type | What it holds | Source / status |
  |---|---|---|---|
  | `stamps.goal.collect` | Goal | the header line (US-4) and the Milestone "stamps owned / obtainable" | W1 stamps dossier; AutoReview tiers (L) |
  | `stamps.check.shop-now` | Check → Goal FR-11 | the text templates for the shop bundle | dossier H |
  | `stamps.check.handin-now` | Check | the hand-in and craft-then-hand-in templates | dossier H |
  | `stamps.check.quest-toward` | Check | the gap template, the shared-resource note (D4) | dossier H |
  | `stamps.activeplay.<npc><n>` | Check (Active Play) | one per W1–W3 custom stamp quest: a one-line "how" hint and a time estimate, citing the wiki (D2). About 10 entries: Cattleprod 1–2, Wellington 1 and 3, Fishpaste97 2, Tiki Chief 2, Crystalswine 4 and 6, Snouts 3, Papua Piggea 4 | wiki quest pages (tier 2), authored estimate (L) |
  | `stamps.pl.acquire` | Priority List | the stamp order *within* M8: carry stamps (Matty Bag, Lil' Mining Baggy, Choppin' Bag, Mason Jar), then Anvil Zoomer, Fishing Rod, Catch Net, then the rest; ties broken by effort (shop < hand-in < craft-then-hand-in < active < toward) | dossier "Min-max by stage" (L); PV 3.6 **unverified** |
  | `stamps.unobtainable` | Fact override | the wiki's list of 7 unobtainable stamps (Toolbox's list has a typo) | wiki Stamps (tier 2), rev. 2026-10-05 |
  | `cards.check.empty-slots` | Check | FR-13 | dossier H; PV 2.1 unverified (order) |
  | `cards.check.no-set` / `cards.check.set-mismatch` / `cards.check.blunder-50` / `cards.check.passive-slot` | Check | FR-14–FR-16 | dossier H (Toolbox `cardsAlert` rules) |
  | `cards.check.preset-mismatch` | Check | FR-17 | dossier M (keyword rule) |
  | `cards.pl.set-for-activity` | Priority List | per `afkType`: FIGHTING Lv < 50: Blunder Hills > Yum Yum; FIGHTING Lv ≥ 50: Yum Yum > Frostbite (pusher rule, D3); MINING / CHOPPIN / FISHING / CATCHING: Easy Resources > Medium Resources | dossier (O); PV 2.2 **unverified** |
  | `cards.matrix.<afkType>` | Priority List | the dossier's preset matrix: preferred card effects per activity, in order | dossier (O) |
  | `cards.contrib.map-card` | Contribution | FR-18, consumed by M4 | dossier H; stop rule O |
  | `cards.goal.set-tier` | Goal | FR-19 | dossier H |
  | `obols.check.altar` | Check | FR-20 | dossier H |
  | `obols.check.stored` | Check | FR-21 | dossier H; PV 2.5 **confirmed** |
  | `obols.goal.slots` | Goal | FR-22, FR-23 | dossier H |

  M8 does not author Stage positions. M2 owns the per-Stage Priority Lists. M8's Goals enter them through the ids that the Leverage model already uses (3a `obols.check.stored`; 3b `cards.check.*`; W1-mid 5 and W2-early 11 `stamps.goal.collect`). D1 and D5 cover the gaps.

### Detectors

- **TR-5** Detectors, with inputs and outputs:

  | Detector id | Inputs (Account State paths, added via M1 TR-11) | Output |
  |---|---|---|
  | `collections.stampStatus` | `stamps[rawName].{level,maxLevel}`; `quests[npc][i].perCharacter[c].status`; `holdings` (TR-6); `characters[].money`; `account.currentWorld`; `characters[].freeInventorySlots`; Toolbox `finalKillsPerHour` per character (from M4's field); refinery cycle output; the generated stamp Acquisitions | `StampAcquisition[]` (TR-7), one per obtainable stamp |
  | `collections.stampLv0` | `stamps[rawName].{level,maxLevel}` | the list of collected Lv 0 stamps, for M7 |
  | `collections.cardSlots` | `characters[].cards.equipped[]`, `account.gemShopPurchases[63]`, `account.cards[*].{amount,stars,effect}`, `characters[].afkType` | per character: open slots and suggested cards |
  | `collections.cardSet` | `characters[].cards.set`, `account.cardSetTotals` (Toolbox `getCardSets`), `characters[].{level,afkType}`, pusher index (M2), pusher's next-map hit chance (M2/M5 field, D3) | per character: `{current, recommended, reason}` or none |
  | `collections.cardPreset` | `characters[].{selectedCardPreset, cardPresets[][], afkType}` | per character: `switch(n)`, `fill(n)` or none |
  | `collections.mapCard` | `characters[].{afkType, targetMonster}`, `account.cards`, generated card Acquisitions (base chance), `finalKillsPerHour` | `Contribution` records for M4 |
  | `collections.obols` | `account.obols.{family[], storage[]}`, `characters[].obols.personal[]`, `account.accountLevel`, `characters[].level`, `account.obolMeritLevel`, altar quest status, highest level | the altar action, the stored-obol placements, the next-slot Milestones |

  Every Detector is pure, `(ctx) => result`. Each has fires / doesn't-fire tests on both private fixtures (local only) and on the public and scrubbed CI saves (#14 item 7, #11 item 12).

- **TR-6** **Holdings rule.** `holdings(rawName)` = chest storage + refinery storage + every character's *inventory*, each counted once. Equipped gear, tools, food slots and obol slots are never counted. For a hand-in, the Next Action names where the items are ("in storage: take 30 to the Squire Lv 85"). For a hand-in over one stack, it adds the caveat "needs carry capacity for N <type> on that character" when Toolbox's carry-capacity value for that item type is below N. If no reliable Toolbox carry value exists (to verify at build: the fixtures' raw `maxCarryCap` values look unscaled), the caveat says "check carry capacity" and the confidence is M.

- **TR-7** **Types** (in `packages/engine/src/collections/types.ts`; the engine's `Goal`, `NextAction`, `ActivePlay` and `Contribution` are M10 TR-2 and M4):

  ```ts
  export type AcqStatus = 'owned' | 'now' | 'active' | 'toward' | 'later' | 'unknown';

  export type Requirement =
    | { kind: 'item'; rawName: string; amount: number; held: number; where: HoldingPlace[];
        craft?: { materials: { rawName: string; amount: number; held: number }[] } }
    | { kind: 'coins'; amount: number | null; bestHolder: number | null } // CharacterState.index
    | { kind: 'custom'; desc: string; target: number; progress: number | null }
    | { kind: 'freeSlots'; amount: number }
    | { kind: 'world'; world: number }
    | { kind: 'system'; id: string; label: string }; // e.g. the obol merit, the Altar

  export type HoldingPlace = 'storage' | 'refinery' | `inv:c${number}`;

  export interface RouteEval {
    routeIndex: number;                 // index into the Acquisition entry's routes[]
    kind: 'shop' | 'quest' | 'drop' | 'craft' | 'gemShop' | 'liquidShop' | 'other';
    status: Exclude<AcqStatus, 'owned'>;
    character: number | null;           // chosen character (FR-10), never a name
    requirements: Requirement[];
    etaSeconds: number | null;          // only where FR-8 allows
    lookAhead: { questIndex: number; rewards: string[] } | null; // FR-7
  }

  export interface StampAcquisition {
    entryId: string;                    // stamps.acq.<rawName>
    rawName: string;
    status: AcqStatus;
    best: RouteEval | null;
    others: RouteEval[];
    provenance: { entryIds: string[]; fields: string[] };
  }

  export interface CollectionsResult {
    stamps: { owned: number; obtainable: number; byStatus: Record<AcqStatus, number>;
              items: StampAcquisition[]; lv0ForSpendPlan: string[] };
    cards: { perCharacter: { index: number; slots: unknown; set: unknown; preset: unknown }[] };
    obols: { altar: RouteEval | null; placements: { from: 'storage'; to: 'family' | `c${number}`;
             shape: string; count: number }[]; nextFamilySlot: { levelReq: number; shape: string } | null };
    contributions: unknown[];           // M4's Contribution shape
  }
  ```

  `CollectionsResult` is internal to the engine. The Now screen gets only M10's `Goal`, `NextAction`, `ActivePlay` and `PurposeLine` objects, each with `provenance` naming the M8 entry ids and Account State fields used (#14 item 4, #17).

- **TR-8** **Generator rules** (an M11 generator plug-in for these Systems, run in the weekly parser-sync PR):
  1. Emit one Acquisition per stamp in `stamps.json`, card in `cards.json`, and obol source.
  2. Route world = the world of the shop's town, the quest NPC's map, or the drop map (`mapDetails`/`npcPlacements`).
  3. Write the craft recipe for every quest `itemReq` item that has one in `crafts.json` (one level deep).
  4. Apply `stamps.unobtainable` (authored) after generation.
  5. Shop price: use the Toolbox shop or item price field if one exists at the pin; else write `price: null`. Verifying which field holds the buy price is a build task. `items.json` `sellPrice` is **not** assumed to be the buy price.
  6. Fail the generation (CI red) if a `Stamp*` reward rawName is not in `stamps.json`, or if any authored M8 entry references a generated id that no longer exists.
  7. Diff output: the parser-sync PR lists added, removed and changed Acquisition routes, so that a patch moving a stamp is reviewed by a human (#14 item 11).

- **TR-9** **Card activity fit.** Fit is decided by the card's effect keywords, not by its category, because the Copper card sits in Easy Resources but gives accuracy. The keyword table is authored: `Mining`, `Choppin`, `Fishing`, `Catching`, `Skill`/`AFK gain` for skilling; damage, accuracy, STR/AGI/WIS/LUK, crit, weapon power and drop rate for fighting; drop rate counts for both. A preset "fits" an activity when most of its non-empty cards fit it. Ties count as fitting both.

### Storage
- **TR-10** M8 stores nothing of its own. Done detection and "done this session" use M1's save history. Skip and "Not for me" are M10 presentation state, keyed by `NextAction.key = <entryId>@<subject>`.

### Performance budgets
- **TR-11** All M8 Detectors together take ≤ 15 ms per engine run on an 11-character account in the worker. Routes are indexed by `rawName` once per Knowledge Base load, not per run.
- **TR-12** The generated M8 entries add ≤ 150 KB gzipped to the Knowledge Base bundle. About 450 entries are expected. Toolbox's raw data files are never shipped.

### Security and privacy
- **TR-13** No character names in M8 output or provenance. Subjects are `c<index>` (M10 TR-2). "Report this" on an M8 action sends the entry id, the Knowledge Base version, the game version, the Stage and the character's class and level (#11 item 15). It never sends item counts, coins or quest progress.
- **TR-14** No network. Wiki links in Source labels open in a new tab with `rel="noopener noreferrer"` (M10 TR-13).

## 6. States and edge cases

| State | Behaviour |
|---|---|
| **Loading** (no Account State yet) | M8 produces nothing; M10 shows its loading state. |
| **Empty account** (parse returned empty) | M1 hard error; no advice at all (#10 item 13). |
| **Broken section** (`stamps`, `cards`, `obols` or `quests` in `failedSections`) | The Detectors depending on it return Unknown (FR-26). The Collections Goal says "Can't tell right now"; the other collections still run. A failed `quests` section makes every quest route `unknown` but leaves shop routes working. |
| **New account before Mr Pigibank** (highest Lv < 14) | Stamps are `later` as a group: "Stamps open when a character reaches class Lv 14 (code checks 14; the wiki's 12 is stale)". No per-stamp lines. |
| **Before the Obol Altar** (highest Lv < 30) | The obol Goal is hidden; "Obols open at Lv 30" goes under "show more". |
| **Stale patch** (save game version newer than the parser pin's) | M1 shows the "game updated" banner. Generated M8 entries are marked Stale and rank below fresh ones (#10 item 10). A stamp or card in the save that is missing from generated data is ignored, counted in `diagnostics`, and never crashes the run. |
| **Patch moves a stamp to another quest or shop** | Caught by TR-8 rule 7 in the parser-sync PR. Until it merges, the old route may be wrong; the Source label carries the game version, so "Report this" pinpoints it. |
| **Quest reward already owned** (Mutton 1 on the W3 account gives a Fist Stamp it owns) | Never shown as a stamp route. The quest may still matter for its other rewards; that's out of M8 scope. |
| **Item equipped, not stored** (the W3 Wizard Lv 73's Copper Chopper) | Not counted (TR-6). M8 never suggests unequipping. |
| **Items held but spread across places** | Summed (TR-6); the action names the places. |
| **Hand-in over one stack** (Wellington 2's 2,500 × 3) | Carry-capacity caveat (TR-6). |
| **Inventory full on the chosen character** | The route needs `InventorySpacesNeeded` free slots; if they're missing, the action says "free N inventory slots first". |
| **Quest accepted on several characters** | The highest class level is chosen (FR-10); the others aren't mentioned. |
| **Coins on another character** | The shop action names "from a character holding ≥ N coins". If no single character can pay and the shared-money option is unknown, it is `toward`. |
| **Obol slot marked locked although its gate is met** | No next-slot Milestone and a diagnostic (FR-22). |
| **No characters fighting** | No card or stamp-drop Contributions; Goals still work. |
| **Second account in the same browser** | Not supported (#10 item 16); nothing in M8 is per-browser. |
| **Multiple tabs** | Each tab runs the pure engine on the same save; same output. |
| **Offline** | Last good save; M8 output unchanged until the next save. |
| **Player does the action mid-session** | Disappears on the next cloud save (≤ ~4 min, instant on character switch) and moves to "done this session". |
| **Player skips or hides an action** | M10 TR-3; M8 is unaffected. |

## 7. Dependencies

| Module | What M8 needs from it | Interface |
|---|---|---|
| **M1** Sync & Account State | New Account State fields via TR-11:<br>• `stamps` (level, maxLevel);<br>• per-character quest status for stamp-reward NPCs;<br>• `holdings` sources (storage, refinery storage, inventories), free inventory slots;<br>• per-character `money`;<br>• `cards` (amount, stars, nextLevelReq, effect), per-character equipped cards, set, presets, `selectedCardPreset`;<br>• `gemShopPurchases[63]`;<br>• family and personal obol lists with shape and `levelReq`, obol storage;<br>• the obol merit level; `accountLevel`;<br>• card set totals (Toolbox `getCardSets`, precomputed in the adapter);<br>• `FIELD_SECTIONS` for each, plus `isKnown`. | `AccountState`, `isKnown`, `diagnostics.failedSections` |
| **M11** Knowledge tooling | The Detector interface and registry; the YAML schema (with `generated`, `target`, `routes`); the generator plug-in hook for TR-8; CI rules (sources required, dangling-id check); golden snapshot harness. | Detector `(ctx) => result`; generator plug-in API |
| **M2** Stage & Meta Path | The Stage id; the per-Stage Priority List positions for M8's Goals (D5); the pusher's character index (for D3). | `stage.id`, `PriorityList`, `pusher` |
| **M4** Purpose & Milestones | Consumes M8's card and stamp-drop Contributions (FR-12, FR-18); supplies `finalKillsPerHour` for the current map (M8 reads the same field). | `Contribution`, `Milestone` |
| **M6** Unspent & idle | Owns the obol merit, the Liquid Shop daily obols and the gems. M8 links to its Goal ids for FR-23. M6 must **not** also emit empty card-slot, card-set or stored-obol Checks (D6). | Goal id references |
| **M7** Spend Plan | Takes `lv0ForSpendPlan` (collected stamps at Lv 0) as spendable lines; owns all stamp levelling and cap raises. | `string[]` of stamp rawNames |
| **M9** Builds | None directly. Talent-preset checks are M9's; M8's preset Check is only about cards. The texts must not collide ("card preset" vs "talent preset" everywhere). | — |
| **M10** Now screen UI | Renders M8's Goals, Next Actions, Active Play items and Purpose lines; caps; "show more"; done this session. | M10 TR-2 types |
| **M5** Higher-leverage options | May later use M8's card and stamp drop Acquisitions to propose "move to map X for its card". Not needed for the MVP. | Acquisition entries |
| **M3, M12, M13** | None beyond the shared engine. | — |

## 8. Open decisions for Yasser

❓ D1 - Grouping stamp actions: should "stamps you can get now" be (a) one account Goal whose single Next Action bundles every shop buy (grouped by town), with each quest hand-in as its own Goal on its character's row, (b) one Goal per stamp, or (c) one Goal for all stamp work, hand-ins included, showing only the top action?
➡️ (a). The glossary's "one Next Action per Goal" still holds, because a shop trip is one concrete instruction. Option (b) would fill the 5-item account cap with stamps on day one and push out higher-ranked items. Option (c) hides character-specific hand-ins from the row where #10 item 6 says they belong.

❓ D2 - How-to hints for custom stamp quests: should ActiveOn ship authored one-line "how" hints (e.g. where Wellington's three platforms are) plus a time estimate for the ~10 W1–W3 custom stamp quests, or only show the quest's own in-game text?
➡️ Ship the hints, cited to the wiki. The MVP success bar is "no outside lookups". Without hints, "find the 3 hidden platforms" sends the player straight to Google. It's about 10 short entries, and quest locations rarely change between patches.

❓ D3 - Card set for fighters at Lv 50+: should the pusher use (a) Yum Yum always, (b) Frostbite always from W3, or (c) Yum Yum by default and Frostbite only for the pusher while Toolbox's hit chance on its next map is below 100%?
➡️ (c). Accuracy is the confirmed W1–W6 wall (PV cross-cutting 3), and Frostbite's +5% DEF and ACC per tier only matters while the pusher misses. Everyone else keeps the higher-value Yum Yum. Both card orders are unverified (PV 2.2), so the entry stays at confidence L either way.

❓ D4 - Quest hand-ins that eat contested resources: Snouts 1 wants 30 Redox Salts, which are also W3's Construction currency. Should such hand-ins be (a) always shown as `toward`/`now` with a "uses X, also needed for Y" note, (b) shown only when the account holds the amount plus a buffer, or (c) never suggested automatically?
➡️ (a), ranked by the stamp Priority List, with the note. It's honest and cheap to build. A buffer rule needs M7 to know the next Construction payment, which the MVP doesn't compute. 30 salts is small next to what the account refines, and the player decides.

❓ D5 - Where new-stamp Goals rank on the W2-late and W3-early Priority Lists: the Leverage model places stamp collection only in W1-mid (item 5), W1-late (7) and W2-early (11). Neither fixture's Stage list mentions it. Should (a) unfinished items from earlier Stage lists carry forward to the end of the current list, (b) `now` stamps (shop buys and held-item hand-ins) join position 3 "free-value fills" on every Stage, with active and `toward` stamps carried forward as in (a), or (c) stamps stay off these lists?
➡️ (b). A shop stamp or a held-item hand-in costs almost nothing, which is the definition of position 3. The W1 dossier calls stamps "the biggest W1 lever, under-used by both accounts". Under (c), both fixtures would never see the Vitality, Matty Bag, Clover and Tomahawk stamps above the fold.

❓ D6 - Who owns the card and obol fills: Leverage position 3 (3a stored obols, 3b cards) could be claimed by M6 Unspent & idle as well as M8. Should M8 own every card, card-set, card-preset and stored-obol Check, with M6 owning only the merit, Liquid Shop and Gem Shop items it links to?
➡️ Yes, M8 owns them. They need M8's card-fit and shape logic. Two modules emitting the same "equip your obol" action would duplicate rows. M11's CI can enforce one Check per fact id.

## 9. Red-team notes

**R1. Telling the player to hand in an item they need.** The Copper Chopper is a tool. A craft material for a stamp hand-in might also be an upcoming cap-raise material. *Defence:* equipped items are never counted (TR-6). Hand-ins that consume a shared resource carry a cost note (D4). Stamp cap-raise materials are M7's; a future M7 rule can reserve them, and M8's holdings function is the shared point to do it.

**R2. Wrong "obtainable now" because the quest isn't actually available.** Toolbox's per-character status reads 0 for accepted, −1 for not started. An NPC may have extra gates the data doesn't encode (an earlier NPC, a map unlock). *Defence:* `now` needs status 0, or −1 with the previous quest done on the same character. Otherwise the route is at most `toward`. Both fixtures' quest routes were checked by hand against the hand analysis (US-2, US-3). A false `now` is the most likely class of Report, and TR-5's provenance names the exact quest index and fields.

**R3. Patch breakage: a stamp moves, a quest changes, a shop restocks.** *Defence:* the facts are generated (ADR 0007), so a re-sync fixes them with no human work. TR-8 rule 7 makes the change visible in the parser-sync PR. TR-8 rule 6 fails CI on dangling ids. Stale entries rank below fresh ones.

**R4. Toolbox's own data bugs leaking into advice.** Known cases: the unobtainable-stamp list typo; the trap and Equinox quirks (not M8's); the Toolbox "daily keys off by one" (not M8's); raw carry values that look unscaled. *Defence:* `stamps.unobtainable` is an authored override with a tier-2 Source. The carry caveat degrades to "check carry capacity" at confidence M rather than inventing a number (TR-6).

**R5. Card advice that is opinion presented as fact.** The set and card orders are unverified (PV 2.1, 2.2). *Defence:* every card order entry is confidence L with "unverified" in its Source label. Only the mechanical checks (empty slot, passive card, Blunder past 50, set vs activity per Toolbox's own alert) are H. D3 keeps the pusher's set choice deterministic.

**R6. ETAs that mislead.** Card and stamp drop ETAs ignore drop-rate and card-drop multipliers that Toolbox doesn't compute. *Defence:* they are labelled "at base rate, likely sooner". They are computed only for fighting on the current map. They never drive a Verdict or a Next Action, only Purpose lines and `toward` gaps (FR-8, FR-12, FR-18).

**R7. Flooding the Now screen.** About 100 unowned stamps, 200 cards and many obol slots could swamp the 3 + 5 caps. *Defence:* `later` items are a count, never a list (FR-9). Drops are never Next Actions (FR-12). Shop buys are bundled (D1). Everything else is ranked by M2's lists, with M10's caps and "show more".

**R8. Privacy leak through Report this or provenance.** Item counts and quest progress could fingerprint an account. *Defence:* TR-13 limits Report payloads to entry id, versions, Stage, class and level. Provenance stores field *paths*, not values, and it never leaves the device.

**R9. UX confusion between card presets and talent presets.** Both are "presets", both have a slot 1 and 2, and M9 also says "switch preset". *Defence:* M8's text always says "card preset". Its Detector ids are under `cards.` and M9's under `builds.`. M10's golden snapshots for both fixtures show the two lines distinctly; the W3 Wizard Lv 73 is the test case, since it may get both.

**R10. Promising an obol slot the player already "has".** The W3 fixture marks a family slot locked even though its level gate is met, so a naive "next slot at 350" would tell the player something false. *Defence:* the FR-22 anomaly rule says nothing in that case and logs a diagnostic. The first build task is to check this against the game (the lock may only update when the player visits the altar). If it does, an authored "visit the Obol Altar to open it" Check can replace the silence.

**R11. Counting Bullseye wrong.** The dossier counted 8 stamps on the W2 account, but `level > 0` counts 7. *Defence:* FR-2 fixes the definition (`maxLevel > 0` or `level > 0`), and US-4 pins 8. The Lv 0 stamp goes to M7, so it is neither lost nor shown twice.
