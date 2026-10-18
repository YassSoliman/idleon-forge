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
- **Stamps, acquisition only:** each obtainable stamp the account doesn't own, classified as *now*, *active*, *toward* or *later* (§5, TR-5). Routes are a stamp item already held, town shops, NPC quests (item hand-ins, buy-then-hand-in and custom quests), crafting one level deep for a quest item, and monster or skilling drops.
- **Cards:**
  - empty card slots, a missing or wrong card set, a passive card in a slot, the Blunder Hills set kept past Lv 50, and the active card preset not matching the AFK Target;
  - the authored per-class card lists (`cardList(class, stage)`) and the generated card Acquisitions that M4 reads for its card Purpose lines (M4 owns those lines);
  - card set tier progress.
- **Card presets:** which preset to switch to, or which empty preset to fill, for the character's AFK Target.
- **Obols:**
  - Obol Altar unlock;
  - stored obols with an empty slot of the same shape, family slots first;
  - the next family and personal slot unlocks (arithmetic on family level and character level);
  - obtainable obol sources by Stage, as Acquisition entries.
- **The generated Acquisition entries** for all four (ADR 0007), plus the authored Checks, Goals and Priority Lists around them (including the card lists M4 reads).

**Out of scope:**
- **Buying stamp levels with coins, and raising stamp caps with materials.** That is the M7 Spend Plan, including Hydrogen-atom batching and Gilded Stamps. M8 hands M7 one fact: a stamp that is collected but at Lv 0 (TR-5) is a spendable.
- **Merits** (the W2 "Monsters now drop Obols" merit) and **gems** (the gem count and the Crystal 3D Printer Goal) belong to M6. **Daily Liquid Shop obol buys** are "Not covered yet" in the MVP (M6 D6), and Gem Shop card slots, card presets, obol stacks and storage have no buy advice beyond M6's gem Goal. M8 shows them only as the reason a route is blocked ("obols don't drop until the W2 obol merit"). The Gem Shop first buy is Contested (PV 7.5).
- **Obol min-maxing:** rerolls, combining, the drop-rate best-in-slot ladder, destroying for fragments. The ladder is in the dossier; it becomes an M8 follow-up once the free-value fills are shipped (post-MVP, so no decision was needed).
- **Moving a character to another map for a card or a stamp drop.** That is a Higher-leverage option (M5). M8 only reports what the *current* activity yields.
- **Talent presets and builds** (M9). M8 checks only *card* presets.
- **W4+ collection systems:** Gilded and Exalted Stamps, Lab chip card boosts, 5★/6★ cards, W4+ card sets. Their stamps and cards count as *later*.
- **Writing a card-drop multiplier formula.** Toolbox doesn't compute `CardChanceMulti`, and ADR 0005 forbids writing it. Card ETAs use the base rate as a conservative ceiling.

## 3. Functional requirements

Stamps
- **FR-1** For every obtainable stamp, M8 computes one **acquisition status**: `owned`, `now`, `active`, `toward`, `later` or `unknown`, from the best of its routes, ranked `now` > `active` > `toward` > `later` (TR-5). `later` covers every obtainable, unowned stamp whose best route is not `now`, `active` or `toward`: an unreached world, a locked system, a quest two or more steps away, or a drop on a map no character is on. "Obtainable" means it is in the generated stamp list and not on the authored unobtainable list (TR-8).
- **FR-2** A stamp counts as **owned** (collected) when its `maxLevel > 0` or its `level > 0`; M7's `SpendInputs.stamps` list holds exactly these, Lv 0 included, and M8 reads it (M7 TR-2). A stamp with `maxLevel > 0` and `level == 0` is collected but gives nothing yet. M8 emits no action for it. It is a stamp below its cap, so M7's coin-level rule (M7 FR-20 scope) prices it; M8 only exposes the list (TR-5).
- **FR-2a** **Held stamp item:** an unowned stamp whose item (`Stamp*` rawName) is in a character's inventory or in chest storage is `now`. The Next Action is "Use the <stamp> you're carrying" on that character's row, or "Take the <stamp> from storage and use it" in the Account section. This beats every other route.
- **FR-3** A **shop** route is `now` when the shop's town is in a world the account has reached (world ≤ `currentWorld`), the stamp is in stock (raw `ShopStock` > 0, TR-15), and, when a price is known, some wallet (a character's `money` or the bank, as in M7 FR-2) covers it. If the price is missing from generated data (the pinned `shops` entries carry only `name` and `rawName`), the route is `now` with "costs coins" and no number, affordability is not checked, and confidence drops to M (TR-8). A stamp out of stock is `toward` with "sold out; the shop restocks".
- **FR-4** A **quest hand-in** route (`ItemsAndSpaceRequired`) is `now` when all of these hold:
  - the NPC's world is reached;
  - some character has the quest accepted (status 0), or can accept it (status −1 with the previous quest of that NPC done on that character). Status comes from `characters[].quests[<npc>][<key>]`; keys are strings and not always `1..n` (Fishpaste97 uses `'971'`, `'972'`), so the quest order comes from `quests.json`, never from key arithmetic;
  - every `itemReq` amount is held, counting unequipped items in chests, refinery storage and inventories;
  - the quest's `InventorySpacesNeeded` free slots exist on the chosen character (free slots = `inventorySlots` minus occupied inventory entries, TR-15).

  Equipped items never count (TR-6). A hand-in that consumes an item on the authored shared-resource list is still shown, ranked by the stamp Priority List, with the note "uses X, which also pays for Y" (D4).
- **FR-5** If a hand-in item is missing but its `crafts.json` recipe materials are all held, and some character's Smithing level is at least the item's `lvReqToCraft` (and the recipe is unlocked where the save records it), the route is still `now`. The Next Action names both steps and the crafting character: craft it, then hand it in. If the item is sold in a reached town's shop instead, the route is **buy then hand in** under FR-3's shop rules (the Bob Joe Pickle for the Obol Altar). Crafting is followed one level deep only.
- **FR-6** A **custom quest** route that needs hands-on play (kills against a timer, finding platforms, a minigame streak, inviting NPCs) is `active` when the quest is accepted or acceptable on some character. It is shown as an **Active Play suggestion** with an authored one-line "how" hint and time estimate, cited to the wiki (D2). It never touches a Verdict (#10 item 7). A `Custom` quest whose `customArray` is a threshold the save already measures (Papua Piggea 4: `Total_Stamp_Lv` 500) is not Active Play: it is `toward` with the gap ("333 of 500 stamp levels").
- **FR-7** **Look-ahead:** when a `now` or `active` quest's *next* quest on the same NPC is a hand-in whose items are already held, the suggestion adds "then: <next quest> gives <stamps> (items already held)". The look-ahead goes one step only.
- **FR-8** A route is `toward` when it is in a reached world and one of these holds: the quest is accepted or acceptable (FR-4) but its items are not all held; the stamp drops from some character's current AFK Target; the item is a refinery product; or a shop stamp is sold out. It shows the gap ("8 of 30 Redox Salts"). It gets an ETA only when the arithmetic is allowed: a fighting drop on the character's current AFK Target (ETA = remaining ÷ (`finalKillsPerHour` × generated drop chance), where `finalKillsPerHour` is the worker-computed Toolbox field M2 and M4 already expose; it is not in the parsed save), or a refinery product (from Toolbox refinery cycle output). A drop on a map no character is on has no ETA and is `later`. Skilling drops get no rate (#11 item 8). The D4 shared-resource note applies to `toward` routes too.
- **FR-9** `later` stamps (FR-1) are never listed one by one. The Collections Goal shows a count only ("23 more later"), and "show more" splits it into later worlds, earlier quests and drops nobody is farming.
- **FR-10** Placement follows #10 item 6:
  - routes that need a specific character (a quest accepted on that character, an item in that character's inventory) go on that character's row;
  - shop buys go in the Account section, with "from a character holding at least N coins".

  For a quest accepted or acceptable on several characters, M8 picks, in order: the one already carrying the items, then one with the free inventory slots the hand-in needs, then the highest class level, then the lower index. Shop buys are not tied to a character, because any character can withdraw coins from the bank; the action adds "withdraw from the bank first" only when no single character's coins cover the bundle (M7 D1).
- **FR-11** **Grouping (D1) and ranking (D5):** all `now` shop buys form one account Goal, "New stamps from town shops". Its single Next Action lists them grouped by town, towns in world order then shop index (one trip), and stamps within a town in stamp Priority List order. Each `now` quest hand-in is its own Goal on the chosen character's row. Both kinds of `now` Goal (and held stamp items, FR-2a) enter Leverage position 3 (free-value fills) on every Stage's list, as the new item 3i (3a–3h are taken); `active` and `toward` stamp Goals carry forward from earlier Stage lists to the end of the current one (D5).
- **FR-12** A stamp drop from a character's current AFK Target is a `toward` line under "show more" on that character's row ("this map can drop the X Stamp, within about N h at base rate"). It is never a Next Action. M4 does not consume stamp drops in the MVP; M8 exposes the route so M4 or M5 can later.

Cards and card presets
- **FR-13** **Empty slots** (FR-13 to FR-17 and FR-21 are M8's alone; M6 emits none of them, D6): a character with fewer real cards equipped than `4 + gemShopPurchases[63]` (Extra Card Slot, `GemP3`), while the account owns cards that fit its activity and aren't already in this character's slots, gets a Next Action to fill them. A card can be equipped on several characters at once, so cards on other characters still count as available. `cards.equippedCards` is always padded to 8 entries with `{legendBonus}` placeholders; only entries with a `cardName` count. The cards come from the activity's authored preset matrix, with the highest-level owned card first (TR-9).
- **FR-14** **Card set:** a character with no set, or with a set that doesn't fit its AFK Target, gets a Next Action to equip the best set for its activity at tier ≥ 1, per the authored set Priority List (TR-9). For fighters at Lv ≥ 50 the set is Yum Yum Desert, except the pusher (M2), which gets Frostbite while Toolbox's hit chance on its next map (M2's frontier hit chance) is below 100% and Frostbite is at tier ≥ 1 (D3). If Frostbite is at tier 0, or the hit chance is null, the pusher falls back to Yum Yum. Tier = `floor(Σ card levels in the set ÷ set size)`, from Toolbox `getCardSets` (Toolbox's equipped-set `stars` is this tier minus 1; TR-15).
- **FR-15** **Blunder Hills past Lv 50:** the Blunder Hills set equipped on a character at Lv ≥ 50 gives nothing. The Next Action swaps it per FR-14.
- **FR-16** **Passive card in a slot:** a passive card (its effect contains `(Passive)`) equipped in a slot gets a Next Action to replace it, because it works without being equipped.
- **FR-17** **Preset mismatch:** when the active preset's cards fit another activity (by effect keyword, TR-9) and another preset fits the AFK Target, the Next Action is "Switch to card preset N". When no preset fits, it is "Fill card preset N (empty) for <activity>, then switch to it". N is limited to unlocked presets: the 2 base presets (from class Lv 15) plus `gemShopPurchases[66]` (Card Presets, `GemQ9`); the save always holds 7 preset arrays, so the array length is never used. `selectedCardPreset` is 0-based, and texts show it plus 1. M8 never suggests overwriting a non-empty preset; with no empty unlocked preset, it suggests nothing.
- **FR-18** **Card data for M4:** M4 owns card Purpose lines, card Goals and their ETAs (M4 `cards.contribution.fight`, `cards.contribution.skill`, and the generated card ladders `cards.goal.<card>`). M8 supplies two inputs:
  - the authored `cardList(class, stage)` lists (`cards.priority.list-<class>`, `list: order`): the cards worth levelling for each class at each Stage, from the dossier preset matrix;
  - the generated card Acquisitions (base drop chance, set membership).

  M8 emits no card Purpose line of its own, so a card M4 judges not worth farming never shows from M8 either.
- **FR-19** **Set tier Goal:** for each set that a character uses or that FR-14 recommends, M8 shows "Set tier t: Σ s of (t+1)×size for tier t+1". The Next Action names the single card with the shortest ETA among the set's cards that drop on the current maps. When no card qualifies, it is not a Goal (a Goal always has one Next Action): it appears as a Milestone line under "show more".

Obols
- **FR-20** **Altar locked:** the Obol Altar quest (`Obol_Altar1`, 1 Bob Joe Pickle) is account-wide: it is done when any character's status is 1. When the highest character is Lv ≥ 30 and it isn't done, the Next Action is the hand-in, using FR-4 and the FR-5 buy-then-hand-in route (the pickle is sold in the YumYum Grotto shop and isn't craftable). The NPC's world comes from `npcPlacements` (map 50, W2), not from Toolbox's quest grouping, which files it under Blunder Hills. While the altar is locked, FR-21 and FR-22 don't fire; the obol Goal says "<k> stored obols wait for the Obol Altar".
- **FR-21** **Stored obols** (only once the altar is done, FR-20): for each obol in storage with an empty, unlocked slot of the same shape, M8 emits one Next Action per destination: "Equip <k> stored obols in family <shape> slots". Family slots are filled first, then personal slots. Within personal slots, characters are taken in Visit Order. Any stat beats an empty slot (PV 2.5, confirmed).
- **FR-22** **Next slot Milestones:** the obol Goal carries a Milestone for the next family slot and, per character, the next personal slot. Each is the lowest-gated slot the save still marks `ObolLocked*`, with its shape and gate (family level or character level). The gap is arithmetic, and there is no ETA. **Anomaly rule:** if that locked slot's gate is already met (the W3 fixture shows the family slot gated at 350 locked at family level 379), M8 shows no Milestone for it. It records a diagnostic and claims nothing, because the save's lock state and the gate table disagree, and M8 can't tell which is right.
- **FR-23** **Why obols aren't dropping:** while the W2 obol merit is at 0, the obol Goal says "regular monsters don't drop obols until the W2 merit 'Monsters now drop Obols'" (bosses and the Gigafrog drop theirs regardless, per `monsterDrops.json`). It links to M6's merit Goal `merit-shop.check.spend-w2` rather than issuing its own action (D6).

All modules' shared rules
- **FR-24** Every M8 Next Action has a Source label (#10 item 10). Generated entries cite Toolbox game data (tier 1) with the parser pin's game version. Authored orders cite their dossier and PV row, with their status (confirmed, unverified or contested).
- **FR-25** Done comes from the save (#10 item 8). A stamp action disappears when the next save shows it owned. A card action disappears when the slot, set or preset matches. An obol action disappears when the storage count drops and the slot fills.
- **FR-26** Unknown, never a guess: if any field a Detector needs comes from a parser section in `diagnostics.failedSections` (M1 TR-11 `isKnown`), that Detector returns Unknown, and nothing it would have said is shown. Each Detector's section list in TR-5 includes the sections Toolbox silently defaults to empty on failure (`storage`, `refinery`, `gemShopPurchases`, `currencies`, `shopStock`), so a failed read never becomes "you lack X" or a zero slot count.
- **FR-27** M8 adds nothing to the "Not covered yet" footer itself. M10 FR-26 lists unlocked Systems with no entries, so Gilded and Exalted Stamps appear there only once the account unlocks them.

## 4. User stories

Each story's acceptance criteria are written as **Given fixture / When engine runs / Then Now screen shows**. They double as golden-snapshot assertions (#13 item 4). "W2-late account" and "W3-early account" are the two private fixtures, with Stages per the Leverage model §1.3.

**US-1 Stamps I can grab right now.** As a player in a Play Session, I want to see which stamps I can get this session without any grinding, so that I collect free permanent bonuses before I go AFK.
- Given the W3-early account (17 stamps owned, 333 total stamp levels) / When the engine runs / Then the Account section has the Goal "New stamps from town shops" with one Next Action. It lists **Vitality Stamp** (Encroaching Forest Villas shop), then **Matty Bag Stamp** and **Clover Stamp** (Faraway Piers shop): towns in world and shop order, stamps in Priority List order within a town (Matty Bag is a carry stamp, so it comes first in its town).
- Given the W3-early account, where the Wizard Lv 73 carries 3 Duplogs Stamp items and the stamp is not collected / When the engine runs / Then the Wizard row shows "Use the Duplogs Stamp you're carrying" (FR-2a). Source: game data (Toolbox `shared-data.json` `shops`).
- Given the W2-late account (8 stamps owned, one of them at Lv 0) / When the engine runs / Then the same Goal lists **Vitality** (Encroaching Forest Villas), **Vendor Stamp** (YumYum Grotto), then **Matty Bag** and **Clover** (Faraway Piers), 4 in all. The Vendor Stamp appears here and not on the W3 account, because the W3 account already owns it.
- Given either fixture / When the engine runs / Then no stamp the account already owns appears in any M8 action, and no shop in an unreached world (W3 town on the W2 account) appears.

**US-2 A quest hand-in I didn't realise I could do.** As a player in a Play Session, I want to be told when I'm already holding what a stamp quest needs, so that I hand it in on the right character instead of discovering it weeks later.
- Given the W3-early account, where the Bowman (Lv 60) has Hamish quest 1 accepted and carries a Copper Chopper in its inventory / When the engine runs / Then the Bowman Lv 60 row shows "Give Hamish the Copper Chopper you're carrying → Tomahawk Stamp". The Wizard (Lv 73) also has a Copper Chopper, but equipped as its tool, so it is not mentioned anywhere.
- Given the W2-late account, where the Barbarian (Lv 60) has Hamish quest 1 accepted, no unequipped Copper Chopper is held, and 161 Oak Logs are in storage / When the engine runs / Then the Barbarian Lv 60 row shows "Craft a Copper Chopper at the Anvil (6 Oak Logs), then give it to Hamish → Tomahawk Stamp" (FR-5).
- Given the W3-early account, where the Squire (Lv 85) has Snouts quest 1 accepted and the account holds 17 of the 30 Redox Salts (8 in refinery storage, 9 in chest storage) / When the engine runs / Then that quest shows under "show more" as a `toward` line: "Snouts 1: 17 of 30 Redox Salts → Buckler Stamp", with an ETA from the refinery cycle. It is not a Goal or Next Action, and it carries the cost note "uses Redox Salts, which also pay for Construction" (D4).

**US-3 Short active quests for stamps.** As a player with spare time in a Play Session, I want stamp quests that need hands-on play to be offered as optional, so that I can do them when I have time without them blocking my log-off.
- Given the W3-early account / When the engine runs / Then "If you have time" lists:
  - **XxX Cattleprod XxX quest 2** on the Squire Lv 85 (accepted): "kill 30 Mafiosos and 18 Sand Castles before the timer runs out → Mason Jar Stamp + Fishhead Stamp", with its authored time estimate;
  - **Wellington quest 1** (accepted on the Wizard Lv 73, the Squire Lv 85 and the Barbarian Lv 56; offered on the Squire Lv 85, the highest level): "find the 3 hidden platforms → Brainstew Stamp + Arcane Stamp". It adds the look-ahead line "then: Wellington 2 gives Fly Intel and Holy Mackerel Stamps; you already hold the 2,500 High Steaks, Wakka Cherries and Singlecles", plus a carry-capacity caveat (TR-6).

  No Verdict changes because of either.
- Given the W2-late account / When the engine runs / Then "If you have time" lists **XxX Cattleprod XxX quest 1** (accepted on the Barbarian Lv 60, the Squire Lv 43 and the Bowman Lv 54; offered on the Barbarian Lv 60) → Lil' Mining Baggy Stamp + Catch Net Stamp, and **Wellington quest 1** (offered on the Barbarian Lv 60) → Brainstew + Arcane. The Wellington 2 look-ahead does *not* appear, because the account holds fewer than 2,500 of each Wellington 2 item.
- **Fixture totals (known members; the exact counts are computed by a script over the fixtures and pinned in the golden snapshot, never typed by hand):** W3-early: `now` includes 3 shop stamps, Tomahawk and the held Duplogs Stamp; 4 `active` from 2 quests (the 2 Wellington 2 stamps are a look-ahead, not a status); `toward` includes Buckler (Snouts 1), Manamoar (Mutton 2, accepted on the Squire Lv 51, 0 of 300 Corporatube Subs) and the Papua Piggea 4 stamp-level threshold if its NPC is reached. W2-late: `now` includes 4 shop stamps and Tomahawk via craft; 4 `active` from 2 quests; `toward` includes the Fist Stamp (Mutton 1 on the Squire Lv 43, needing 3 items it doesn't hold). Every other obtainable, unowned stamp is `later` (FR-1).

**US-4 How far I am in stamps.** As a player in a Play Session, I want one line saying how many stamps I have and how many are within reach, so that I know whether stamps are worth my time today.
- Given the W3-early account / When the engine runs / Then the Collections Goal header reads "Stamps 17 of 121 · N now · 4 with active play · N later" (counts from the golden snapshot, FR-1). N is the generated count of `later` stamps; the golden snapshot pins it.
- Given the W2-late account / When the engine runs / Then it reads "Stamps 8 of 121 · N now · 4 with active play · N later". The Bullseye Stamp at Lv 0 counts as owned and gets no M8 action; buying its levels is M7's (FR-2).

**US-5 Cards on every character.** As a player in a Play Session, I want every character to have its card slots and card set filled for what it's doing, so that no character goes AFK without free bonuses.
- Given the W2-late account (all 5 characters with no card set; the Shaman Lv 44, the Bowman Lv 54 and the Wizard Lv 56 with 0 cards; set tiers Blunder Hills 1, Yum Yum 1, Easy Resources 0) / When the engine runs / Then:
  - the Shaman Lv 44, Bowman Lv 54 and Wizard Lv 56 rows each show "Equip 4 cards" naming the cards from the fighting matrix;
  - the fighting Barbarian Lv 60, Bowman Lv 54 and Wizard Lv 56 rows show "Equip the Yum Yum Desert set (tier 1, +10% food effect)". The Barbarian Lv 60 is the pusher, but Frostbite is at tier 0, so it falls back to Yum Yum (FR-14);
  - the fighting Shaman Lv 44 row shows "Equip the Blunder Hills set (tier 1, +8% EXP below Lv 50)";
  - the mining Squire Lv 43 row shows no set action, because no skilling set is at tier 1. Its "show more" holds the Easy Resources tier Goal at "Σ 5 of 13".
- Given the W3-early account / When the engine runs / Then:
  - the Shaman Lv 54 row shows "Equip 4 cards";
  - the mining Squire Lv 51 row (3 of 4 slots filled) shows "Equip 1 more card", naming a skilling card such as Amarok even though the Barbarian Lv 56 also has it equipped (FR-13);
  - the Bowman Lv 60 row shows "Replace the Fire Forge card (passive, works unequipped) and fill 3 empty slots";
  - the fishing Barbarian Lv 56 and mining Squire Lv 51 rows show "Equip the Easy Resources set (tier 1, +8% skill efficiency)";
  - the fighting Wizard Lv 73, Bowman Lv 60 and Shaman Lv 54 rows show "Equip the Yum Yum Desert set (tier 2, +20% food effect)". The set tiers on this account are Blunder Hills 2, Yum Yum 2, Easy Resources 1 and Frostbite 1;
  - the Squire Lv 85 is the pusher (M2) on Thermonuclear Climb at a 36% hit chance (M5's fixture), and Frostbite is at tier 1, so its row shows "Equip the Frostbite Tundra set (tier 1)" instead of its Yum Yum set (D3). Until M2's frontier hit chance is available it keeps Yum Yum and gets no set action.

**US-6 The right card preset for the job.** As a player in a Play Session, I want to be told when a character's active card preset is for a different activity, so that a fighter isn't AFK on choppin cards.
- Given the W3-early account, where the fighting Wizard Lv 73 has its choppin preset (preset 2, `selectedCardPreset` 1) active and a fighting preset (preset 1) stored / When the engine runs / Then the Wizard row shows "Switch to card preset 1 (fighting)".
- Given the W2-late account, where the mining Squire Lv 43 is on a preset of combat cards and its preset 2 is empty / When the engine runs / Then the Squire row shows "Fill card preset 2 for Mining (Iron card first), then switch to it".
- Given either fixture / When the engine runs / Then no preset action appears on any character whose cards already fit its AFK Target.

**US-7 Card lists for M4.** As a player in a Play Session, I want a character's Purpose to count card progress only for cards worth having for its class, so that I know when to stop farming a map for its card.
- Given either fixture / When the engine runs / Then every class present has a `cards.priority.list-<class>` entry for the account's Stage, and M4's card Purpose lines (M4 US-5, US-6) read it. M8 itself emits no card Purpose line, so the W2-late Bowman Lv 54 on Green Mushrooms and the Shaman Lv 44 on Slimes show exactly what M4's golden snapshot pins.

**US-8 Spare obols into empty slots.** As a player in a Play Session, I want stored obols placed in empty slots, family slots first, so that obols I already own stop sitting idle.
- Given the W3-early account (Obol Altar quest accepted on the Wizard Lv 73 and the Squire Lv 85, done on no character; 4 Silver circle obols in storage; obol merit 7 of 7) / When the engine runs / Then the Squire Lv 85 row shows "Buy a Bob Joe Pickle at the YumYum Grotto shop and give it to the Obol Altar" (FR-20, highest level of the two). The obol Goal reads "4 stored obols wait for the Obol Altar". No stored-obol placement and no next-slot Milestone appear until a save shows the altar done.
- Given the W3-early account after the altar is done (6 unlocked family slots empty, 5 circles and 1 square) / When the engine runs / Then the Account section shows "Equip your 4 stored obols in family circle slots", with Source "game data" and PV 2.5 (confirmed), and "Family obols 0 of 6 filled". If the save still marks the family slot gated at 350 locked at family level 379, no next-family-slot Milestone appears (FR-22 anomaly rule).
- Given the W2-late account (1 Silver circle obol in storage; the same 6 family slots empty; obol merit 0) / When the engine runs / Then it shows "Equip your stored obol in a family circle slot" and the line "Regular monsters don't drop obols until the W2 merit 'Monsters now drop Obols'" (linking to M6). The next family slot is at family level 350 (93 to go).
- Given either fixture after the obol action is done (the next save shows storage empty and the slots filled) / When the engine runs / Then the action is gone and is listed under "done this session" (#10 item 8).

**US-9 No collections advice from a broken read.** As a player in a Play Session, I want collections advice withheld when part of my save didn't read, so that I'm never told to buy something I already have.
- Given the W3-early account with the `stamps` parser section forced to fail / When the engine runs / Then no stamp action appears, and the Collections Goal reads "Can't tell right now" (Unknown). Card and obol actions still appear.

## 5. Technical requirements

### Package boundaries
- **TR-1** M8 lives in `packages/engine/src/collections/`, with Detectors in `detectors/` and pure helpers in `routes.ts`. Its Knowledge Base entries live in `packages/knowledge/systems/{stamps,cards,card-presets,obols}.yaml` (authored) and in the M11 generator's output for those Systems (generated; M11 sets the path, e.g. `packages/knowledge/generated/<system>.json`; the authored fact tables in `systems/<system>.facts.yaml`, M11 TR-2). M8 imports only the `account-state` and `knowledge` types, plus the engine's Detector interface (M11). It never imports Toolbox at runtime.
- **TR-2** M8's Detectors run in the parse Web Worker with the rest of the engine (M10 TR-6). They read only the Account State, the save history, `now` and the Knowledge Base (#11 item 2).

### Knowledge Base entries (the #11 shape)

- **TR-3** **Generated entries (ADR 0007), one per item, regenerated at every parser re-sync:**

  | System | Entry type | Count (pin 6827d3f) | Generated from |
  |---|---|---|---|
  | `stamps` | Acquisition | 128 in data; 121 obtainable after the authored override (TR-8) | `stamps.json` (catalogue); `shared-data.json` `shops` (shop routes; the pinned entries have no world or price, so town → world comes from `npcPlacements` map worlds where a town map exists, else from the authored fact table `stamps.fact.shop-towns` with a Source, checked by a contract test against Toolbox's index → world mapping); `quests.json` (`rewards` with `rawName` `Stamp*`, plus `itemReq`, `customArray`, `Type`, `InventorySpacesNeeded`); `monsterDrops.json` (drop routes, `effectiveChance`); `crafts.json` (one-level craft for quest items); `items.json` (names, shop price if present) |
  | `cards` | Acquisition | about 150 W1–W3 plus boss cards; the W4+ ones as `later` | `cards.json`, `monsterDrops.json` (card entries with base chance), `shared-data.json` `cardSets` (set membership and size) |
  | `quests` (routes only) | route data inside the stamp entries | Obol Altar and every stamp-reward quest | `quests.json`; NPC world from `npcPlacements` |
  | `obols` | Acquisition | the W1–W3 obol sources | `monsterDrops.json` (boss and Gigafrog obols), `shared-data.json` `liquidsShop`, `obols` (personal and family slot gates and shapes), `gemShop.json` (marked `kind: gemShop`; info only) |
  | `card-presets` | Acquisition | 2 entries: base presets (Lv 15) and Gem Shop presets / card slots | `gemShop.json` (`GemP3` Extra Card Slot, index 63; `GemQ9` Card Presets, index 66) plus the authored Lv 15 gate (wiki, M; TR-8) |

  A generated entry looks like this (YAML view of the JSON the generator writes):

  ```yaml
  id: stamps.acquisition.stamp-a4
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
  | `stamps.check.held-now` | Check | FR-2a, a stamp item already held | dossier H |
  | `stamps.check.quest-toward` | Check | the gap template, the shared-resource note (D4) | dossier H |
  | `stamps.check.activeplay-<npc>-<n>` | Check (Active Play) | one per W1–W3 custom stamp quest: a one-line "how" hint and a time estimate, citing the wiki (D2). About 9 entries: Cattleprod 1–2, Wellington 1 and 3, Fishpaste97 2, Tiki Chief 2, Crystalswine 4 and 6, Snouts 3. Papua Piggea 4 is a measured threshold, so it is a `toward` route (FR-6) | wiki quest pages (tier 2), authored estimate (L) |
  | `stamps.priority.acquire` | Priority List (`list: order`) | the stamp order *within* M8: carry stamps (Matty Bag, Lil' Mining Baggy, Choppin' Bag, Mason Jar), then Anvil Zoomer, Fishing Rod, Catch Net, then the rest; ties broken by effort (shop < hand-in < craft-then-hand-in < active < toward) | dossier "Min-max by stage" (L); PV 3.6 **unverified** |
  | `stamps.fact.shop-towns` | Authored fact table (M11) | town → world for each shop index, only where generated map data can't give it (TR-3) | wiki town pages (tier 2) |
  | `stamps.fact.shared-resources` | Authored fact table (M11) | items a hand-in consumes that also pay for another System, with that System (D4): e.g. Redox Salts → Construction | W3 dossier (M) |
  | `stamps.fact.unobtainable` | Authored fact table (M11) | the wiki's list of 7 unobtainable stamps (Toolbox's list has a typo); M7 reads the same table | wiki Stamps (tier 2), rev. 2026-10-05 |
  | `cards.check.empty-slots` | Check | FR-13 | dossier H; PV 2.1 unverified (order) |
  | `cards.check.no-set` / `cards.check.set-mismatch` / `cards.check.blunder-50` / `cards.check.passive-slot` | Check | FR-14–FR-16 | dossier H (Toolbox `cardsAlert` rules) |
  | `cards.check.preset-mismatch` | Check | FR-17 | dossier M (keyword rule) |
  | `cards.priority.set-for-activity` | Priority List (`list: order`) | per `afkType`: FIGHTING Lv < 50: Blunder Hills > Yum Yum; FIGHTING Lv ≥ 50: Yum Yum > Frostbite (pusher rule, D3); MINING / CHOPPIN / FISHING / CATCHING: Easy Resources > Medium Resources | dossier (O); PV 2.2 **unverified** |
  | `cards.priority.matrix-<afk-type>` | Priority List (`list: order`) | the dossier's preset matrix: preferred card effects per activity, in order | dossier (O) |
  | `cards.priority.list-<class>` | Priority List (`list: order`) | `cardList(class, stage)` for M4's `cards.contribution.fight` (FR-18) | dossier preset matrix (O); PV 2.1 unverified |
  | `cards.goal.set-tier` | Goal | FR-19 | dossier H |
  | `obols.check.altar` | Check | FR-20 | dossier H |
  | `obols.check.stored` | Check | FR-21 | dossier H; PV 2.5 **confirmed** |
  | `obols.goal.slots` | Goal | FR-22, FR-23 | dossier H |

  M8 does not author Stage positions. M2 owns the per-Stage Priority Lists. M8's Goals enter them through the ids that the Leverage model already uses (3a `obols.check.stored`; 3b `cards.check.*`; W1-mid 5 and W2-early 11 `stamps.goal.collect`). Per D5, M2 places `stamps.check.shop-now`, `stamps.check.handin-now` and `stamps.check.held-now` at position 3 (as 3i, after the existing 3a–3h) on every Stage, and carries `stamps.check.quest-toward` and the Active Play stamp checks forward to the end of each later Stage list (`carryForward`); both are now in M2 TR-13. Per D6, M11's CI rule "one Check per fact id" keeps M6 from emitting the card and stored-obol Checks.

### Detectors

- **TR-5** Detectors, with inputs and outputs:

  | Detector id | Inputs (Account State paths, added via M1 TR-11) | Output |
  |---|---|---|
  | `stamps/status` | `stamps[rawName].{level,maxLevel}`; per-character quest status (TR-15); `holdings` (TR-6); `characters[].money` and the bank; shop stock; `account.currentWorld`; free inventory slots and carry capacity (TR-15); characters' Smithing levels; `finalKillsPerHour` per character (M2/M4 worker field); refinery cycle output; the generated stamp Acquisitions. Sections: stamps, quests, storage, refinery, inventories, currencies, shopStock | `StampAcquisition[]` (TR-7), one per obtainable stamp |
  | `stamps/lv0` | `stamps[rawName].{level,maxLevel}` | the list of collected Lv 0 stamps, for M7 |
  | `cards/slots` | `characters[].cards.equippedCards[]` (real entries only), `account.gemShopPurchases[63]`, `account.cards[*].{amount,stars,effect}`, `characters[].afkType`. Sections: cards, gemShopPurchases | per character: open slots and suggested cards |
  | `cards/set` | `characters[].cards.set`, `account.cardSetTotals` (Toolbox `getCardSets`), `characters[].{level,afkType}`, pusher index (M2), pusher's frontier hit chance (M2 field, D3) | per character: `{current, recommended, reason}` or none |
  | `cards/preset` | `characters[].{selectedCardPreset (0-based), cardPresets[][], afkType, level}`, `account.gemShopPurchases[66]` | per character: `switch(n)`, `fill(n)` or none |
  | `cards/list` | Stage id (M2), the class of each character, `cards.priority.list-<class>` | `cardList(class, stage)` for M4 |
  | `obols/state` | family slots `account.obols.list[]`, stored obols (raw `ObolInvOr`; TR-15), personal slots `characters[].obols.list[]`, `account.accountLevel`, `characters[].level`, `account.obolMeritLevel`, altar quest status on every character, highest level, shop stock for the pickle. Sections: obols, quests, shopStock | the altar action, the stored-obol placements, the next-slot Milestones |

  Every Detector is pure, `(ctx) => result`. Each has fires / doesn't-fire tests on both private fixtures (local only) and on the public and scrubbed CI saves (#14 item 7, #11 item 12).

- **TR-6** **Holdings rule.** `holdings(rawName)` = chest storage + refinery storage + every character's *inventory*, each counted once. Equipped gear, tools, food slots and obol slots are never counted. For a hand-in, the Next Action names where the items are ("in storage: take 30 to the Squire Lv 85"). For a hand-in, the chosen character must be able to carry it: it needs `ceil(N ÷ capacityPerSlot)` free inventory slots for each required item, using Toolbox's scaled `characters[].carryCapBags[].capacityPerSlot` for the item's type (not the raw `maxCarryCap`), plus `InventorySpacesNeeded`. If it can't, the action adds "needs N free slots for this; carry it in several trips or raise carry capacity", and a look-ahead (FR-7) carries the same caveat.

- **TR-7** **Types** (in `packages/engine/src/collections/types.ts`; the engine's `Goal`, `NextAction` and `ActivePlay` are M10 TR-2):

  ```ts
  export type AcqStatus = 'owned' | 'now' | 'active' | 'toward' | 'later' | 'unknown';

  export type Requirement =
    | { kind: 'item'; rawName: string; amount: number; held: number; where: HoldingPlace[];
        craft?: { materials: { rawName: string; amount: number; held: number }[] } }
    | { kind: 'coins'; amount: number | null; bestHolder: number | null } // CharacterState.index
    | { kind: 'custom'; desc: string; target: number; progress: number | null }
    | { kind: 'freeSlots'; amount: number }
    | { kind: 'smithing'; level: number }
    | { kind: 'stock'; inStock: boolean }
    | { kind: 'world'; world: number }
    | { kind: 'system'; id: string; label: string }; // e.g. the obol merit, the Altar

  export type HoldingPlace = 'storage' | 'refinery' | `inv:c${number}`;

  export interface RouteEval {
    routeIndex: number;                 // index into the Acquisition entry's routes[]
    kind: 'held' | 'shop' | 'quest' | 'buyThenQuest' | 'drop' | 'craft' | 'gemShop' | 'liquidShop' | 'other';
    status: Exclude<AcqStatus, 'owned'>;
    character: number | null;           // chosen character (FR-10), never a name
    requirements: Requirement[];
    etaSeconds: number | null;          // only where FR-8 allows
    lookAhead: { questIndex: number; rewards: string[] } | null; // FR-7
  }

  export interface StampAcquisition {
    entryId: string;                    // stamps.acquisition.<slug of rawName>
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
    cardLists: { classIndex: number; stage: string; entryId: string }[];
    obols: { altar: RouteEval | null; altarDone: boolean; placements: { from: 'storage'; to: 'family' | `c${number}`;
             shape: string; count: number }[]; nextFamilySlot: { levelReq: number; shape: string } | null };
  }
  ```

  `CollectionsResult` is internal to the engine. The Now screen gets only M10's `Goal`, `NextAction`, `ActivePlay` and show-more line objects, each with `provenance` naming the M8 entry ids and Account State fields used (#14 item 4, #17).

- **TR-8** **Generator rules** (an M11 generator plug-in for these Systems, run in the weekly parser-sync PR):
  1. Emit one Acquisition per stamp in `stamps.json`, card in `cards.json`, and obol source.
  2. Route world = the world of the shop's town (TR-3), the quest NPC's map from `npcPlacements` (never Toolbox's quest-grouping key), or the drop map (`mapDetails`).
  3. Write the craft recipe for every quest `itemReq` item that has one in `crafts.json` (one level deep).
  4. Apply the authored fact table `stamps.fact.unobtainable` after generation.
  5. Shop price: use the Toolbox shop or item price field if one exists at the pin; else write `price: null`. Verifying which field holds the buy price is a build task. `items.json` `sellPrice` is **not** assumed to be the buy price.
  6. Fail the generation (CI red) if a `Stamp*` reward rawName is not in `stamps.json`, or if any authored M8 entry references a generated id that no longer exists (M11 FR-5). The sync PR's diff (rule 7) names the authored entries to update.
  7. Diff output: the parser-sync PR lists added, removed and changed Acquisition routes, so that a patch moving a stamp is reviewed by a human (#14 item 11).

- **TR-9** **Card activity fit.** Fit is decided by the card's effect keywords, not by its category, because the Copper card sits in Easy Resources but gives accuracy. The keyword table is authored: `Mining`, `Choppin`, `Fishing`, `Catching`, `Skill`/`AFK gain` for skilling; damage, accuracy, STR/AGI/WIS/LUK, crit, weapon power and drop rate for fighting; drop rate counts for both. A preset "fits" an activity when most of its non-empty cards fit it. Ties count as fitting both.

- **TR-15** **Field map and traps.** M1 exposes these Account State fields (TR-11) from these Toolbox paths. Each has a fires / doesn't-fire test on both fixtures.

  | Account State field | Toolbox path or raw key | Trap |
  |---|---|---|
  | per-character quest status | `characters[].quests[<npc>][<key>]` (−1, 0, 1) | keys are strings, not always sequential; never use `account.quests…progress`, which misleads (M2) |
  | equipped cards | `characters[].cards.equippedCards[]` | padded to 8 with `{legendBonus}`; count only entries with `cardName` |
  | set tier | Toolbox `getCardSets` totals; equipped set `characters[].cards.cardSet` | `cardSet.stars` = tier − 1 |
  | active card preset | `characters[].selectedCardPreset` | 0-based; 7 arrays always present, unlocked count = 2 + `gemShopPurchases[66]` |
  | family and personal obol slots | `account.obols.list[]`, `characters[].obols.list[]` (`rawName` `Blank` = empty, `ObolLocked*` = locked; `shape`, `levelReq`) | lock state may lag the gate (FR-22) |
  | stored obols | raw `ObolInvOr` | the parsed `account.obols.inventory` came back empty on both fixtures although raw `ObolInvOr` holds 4 and 1 obols; M1 must read it correctly or mark it unknown |
  | shop stock | raw `ShopStock` | Toolbox's parsed `shopStock` keeps only a whitelist and drops the stamp items |
  | free inventory slots | `characters[].inventorySlots` minus non-blank `inventory[]` entries | no `freeInventorySlots` field exists |
  | carry capacity | `characters[].carryCapBags[].capacityPerSlot` | `maxCarryCap` is unscaled |
  | bank coins | `currencies.bankMoney` | never `rawMoney` (M7 FR-2) |
  | `finalKillsPerHour` | `CharacterState.fighting.finalKillsPerHour`, the worker-computed identity call (M4 TR-2) | not in the parsed save |

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
| **Broken section** (`stamps`, `cards`, `obols`, `quests`, `storage`, `refinery`, `currencies`, `gemShopPurchases` or `shopStock` in `failedSections`) | The Detectors depending on it return Unknown (FR-26). The Collections Goal says "Can't tell right now"; the other collections still run. A failed `quests` section makes every quest route `unknown` but leaves shop routes working; a failed `storage` or `refinery` makes every route that counts holdings `unknown`. |
| **New account before Mr Pigibank** (highest Lv < 14) | Stamps are `later` as a group: "Stamps open when a character reaches class Lv 14 (code checks 14; the wiki's 12 is stale)". No per-stamp lines. |
| **Before the Obol Altar** (highest Lv < 30) | The obol Goal is hidden; "Obols open at Lv 30" goes under "show more". |
| **Altar quest not done at Lv ≥ 30** (the W3 fixture) | FR-20 hand-in only; stored obols and slot Milestones wait for it. |
| **Shop stamp sold out** | `toward`, "sold out; the shop restocks" (FR-3). |
| **Stale patch** (save game version newer than the parser pin's) | M1 shows the "game updated" banner. Generated M8 entries are marked Stale and rank below fresh ones (#10 item 10). A stamp or card in the save that is missing from generated data is ignored, counted in `diagnostics`, and never crashes the run. |
| **Patch moves a stamp to another quest or shop** | Caught by TR-8 rule 7 in the parser-sync PR. Until it merges, the old route may be wrong; the Source label carries the game version, so "Report this" pinpoints it. |
| **Quest reward already owned** (Mutton 1 on the W3 account gives a Fist Stamp it owns) | Never shown as a stamp route. The quest may still matter for its other rewards; that's out of M8 scope. |
| **Item equipped, not stored** (the W3 Wizard Lv 73's Copper Chopper) | Not counted (TR-6). M8 never suggests unequipping. |
| **Items held but spread across places** | Summed (TR-6); the action names the places. |
| **Hand-in over one stack** (Wellington 2's 2,500 × 3) | Carry-capacity caveat (TR-6). |
| **Inventory full on the chosen character** | The route needs `InventorySpacesNeeded` free slots; if they're missing, the action says "free N inventory slots first". |
| **Quest accepted on several characters** | The FR-10 order picks one (holder, free slots, level); the others aren't mentioned. |
| **Coins on another character or in the bank** | Shop buys sit in the Account section; when no single character holds the known price, the action adds "withdraw from the bank first". With no known price, affordability isn't checked (FR-3). |
| **Obol slot marked locked although its gate is met** | No next-slot Milestone and a diagnostic (FR-22). |
| **No characters fighting** | No stamp-drop lines and no drop ETAs; Goals still work. |
| **Stamp item held but stamp not collected** | `now`, "use the <stamp>" (FR-2a). |
| **Second account in the same browser** | Not supported (#10 item 16); nothing in M8 is per-browser. |
| **Multiple tabs** | Each tab runs the pure engine on the same save; same output. |
| **Offline** | Last good save; M8 output unchanged until the next save. |
| **Player does the action mid-session** | Disappears on the next cloud save (≤ ~4 min, instant on character switch) and moves to "done this session". |
| **Player skips or hides an action** | M10 TR-3; M8 is unaffected. |

## 7. Dependencies

| Module | What M8 needs from it | Interface |
|---|---|---|
| **M1** Sync & Account State | New Account State fields via TR-11:<br>• `stamps` (level, maxLevel): one per-stamp list, M7's `SpendInputs.stamps` (every collected stamp, Lv 0 included);<br>• per-character quest status for stamp-reward NPCs;<br>• `holdings` sources (storage, refinery storage, inventories), free inventory slots;<br>• per-character `money`;<br>• `cards` (amount, stars, nextLevelReq, perTier, effect; one shared `account.cards` field with M4), per-character equipped cards, set, presets, `selectedCardPreset`;<br>• `gemShopPurchases[63]`;<br>• family and personal obol lists with shape and `levelReq`, obol storage;<br>• the obol merit level; `accountLevel`;<br>• card set totals (Toolbox `getCardSets`, precomputed in the adapter);<br>• `FIELD_SECTIONS` for each, plus `isKnown`. | `AccountState`, `isKnown`, `diagnostics.failedSections` |
| **M11** Knowledge tooling | The Detector interface and registry; the YAML schema (with `generated`, `target`, `routes`), authored fact tables (`stamps.fact.*`) and `list: order` Priority Lists; the generator plug-in hook for TR-8 (now in M11 TR-10); CI rules (sources required, dangling-id check); golden snapshot harness. | Detector `(ctx) => result`; generator plug-in API |
| **M2** Stage & Meta Path | The Stage id; the per-Stage Priority List positions for M8's Goals, including the new position 3i for `now` stamps on every Stage, and the carry-forward rule for earlier Stage items (D5), both now in M2 TR-13; the pusher's character index and its frontier hit chance (for D3, `account.frontier.fights[pusher].hitChance`, % 0..100). | `MetaPathResult.stage.id`, `MetaPathResult.list`, `MetaPathResult.pusher` (M2 TR-4a) |
| **M4** Purpose & Milestones | Owns card Purpose lines and card Goals; reads M8's `cardList(class, stage)` lists (`cards.priority.list-<class>`) and generated card Acquisitions (FR-18); supplies `finalKillsPerHour` for the current map through `CharacterState.fighting` (M4 TR-2; M8 reads the same field). | `cardList(class, stage)`, `Milestone` |
| **M6** Unspent & idle | Owns the obol merit and the gems. Liquid Shop daily obols are Not covered yet in the MVP (M6 D6), so FR-23 links only `merit-shop.check.spend-w2`. M6 must **not** also emit empty card-slot, card-set or stored-obol Checks (D6). | Goal id references |
| **M7** Spend Plan | Owns all stamp levelling and cap raises, including collected stamps at Lv 0 (below cap, so M7's coin-level rule covers them). M8 exposes `lv0ForSpendPlan` for M7's tests. Done in this pass: M7's W2-late table now counts the Bullseye Stamp (Lv 0 of 5) as a coin-level line (M7 fixture table, AC-3.1). | `string[]` of stamp rawNames |
| **M9** Builds | None directly. Talent-preset checks are M9's; M8's preset Check is only about cards. The texts must not collide ("card preset" vs "talent preset" everywhere). | — |
| **M10** Now screen UI | Renders M8's Goals, Next Actions, Active Play items and show-more lines; caps; "show more"; done this session. | M10 TR-2 types |
| **M5** Higher-leverage options | Its W3 fixture gives the Squire Lv 85's 36% hit chance used in US-5. May later use M8's card and stamp drop Acquisitions to propose "move to map X for its card". Not needed for the MVP. | Acquisition entries |
| **M3, M12, M13** | None beyond the shared engine. | — |

## 8. Decisions

Ruled by Yasser on 2026-10-17 (PR #50): every recommendation accepted as written.

- **D1 - Stamp actions are grouped by trip.** All `now` shop buys form one account Goal, "New stamps from town shops", whose single Next Action lists them grouped by town in stamp Priority List order. Each `now` quest hand-in is its own Goal on the chosen character's row. *Why:* a shop trip is one concrete instruction, so "one Next Action per Goal" still holds; one Goal per stamp would fill the 5-item account cap with stamps on day one; one Goal for all stamp work would hide character-specific hand-ins from the row where #10 item 6 puts them. Touches FR-10, FR-11, US-1, US-2, TR-4.
- **D2 - Custom stamp quests ship authored how-to hints.** Each of the ~10 W1–W3 custom stamp quests gets a one-line "how" hint and a time estimate, cited to the wiki. *Why:* the MVP bar is "no outside lookups", and "find the 3 hidden platforms" alone sends the player to Google; it is about 10 short entries, and quest locations rarely move between patches. Touches FR-6, US-3, TR-4.
- **D3 - Fighter card set at Lv 50+: Yum Yum by default, Frostbite only for the pusher while it misses.** The pusher (M2) gets Frostbite while Toolbox's hit chance on its next map is below 100%; every other fighter at Lv ≥ 50 keeps Yum Yum. *Why:* accuracy is the confirmed W1–W6 wall (PV cross-cutting 3), and Frostbite's +5% DEF and ACC per tier only matters while the pusher misses. Both card orders are unverified (PV 2.2), so the entry stays at confidence L. Touches FR-14, US-5, TR-4, TR-5. *Red-team note (#7):* the pusher falls back to Yum Yum when Frostbite is at tier 0 or the hit chance is unknown.
- **D4 - Hand-ins that eat contested resources are shown, with a note.** They appear as `now` or `toward` like any other route, ranked by the stamp Priority List, with "uses X, which also pays for Y". *Why:* honest and cheap; a buffer rule needs M7 to know the next Construction payment, which the MVP doesn't compute, and the player decides. Touches FR-4, FR-8, US-2, TR-4.
- **D5 - `now` stamps are position-3 free-value fills on every Stage.** The shop-buy Goal and held-item hand-in Goals join Leverage position 3 on every Stage list; `active` and `toward` stamp Goals carry forward from earlier Stage lists to the end of the current one. *Why:* a shop stamp or a held-item hand-in costs almost nothing, which is the definition of position 3; the W1 dossier calls stamps "the biggest W1 lever, under-used by both accounts"; otherwise neither fixture would see Vitality, Matty Bag, Clover or Tomahawk above the fold. Touches FR-11, TR-4, section 7 (M2). *Red-team note (#8):* 3c is already "big bubbles", so the stamps take the new 3i; M2 needs a carry-forward rule.
- **D6 - M8 owns every card, card-set, card-preset and stored-obol Check.** M6 owns only the obol merit, Liquid Shop and Gem Shop items, which M8 links to. *Why:* those Checks need M8's card-fit and shape logic, and two modules emitting "equip your obol" would duplicate rows; M11's CI enforces one Check per fact id. Touches FR-13–FR-17, FR-21, FR-23, TR-4, section 7 (M6).

## 9. Red-team notes

**R1. Telling the player to hand in an item they need.** The Copper Chopper is a tool. A craft material for a stamp hand-in might also be an upcoming cap-raise material. *Defence:* equipped items are never counted (TR-6). Hand-ins that consume a shared resource carry a cost note (D4). Stamp cap-raise materials are M7's; a future M7 rule can reserve them, and M8's holdings function is the shared point to do it.

**R2. Wrong "obtainable now" because the quest isn't actually available.** Toolbox's per-character status reads 0 for accepted, −1 for not started. An NPC may have extra gates the data doesn't encode (an earlier NPC, a map unlock). *Defence:* `now` needs status 0, or −1 with the previous quest done on the same character. Otherwise the route is at most `toward`. Both fixtures' quest routes were checked by hand against the hand analysis (US-2, US-3). A false `now` is the most likely class of Report, and TR-5's provenance names the exact quest index and fields.

**R3. Patch breakage: a stamp moves, a quest changes, a shop restocks.** *Defence:* the facts are generated (ADR 0007), so a re-sync fixes them with no human work. TR-8 rule 7 makes the change visible in the parser-sync PR. TR-8 rule 6 fails CI on dangling ids. Stale entries rank below fresh ones.

**R4. Toolbox's own data bugs leaking into advice.** Known cases: the unobtainable-stamp list typo; the trap and Equinox quirks (not M8's); the Toolbox "daily keys off by one" (not M8's); raw carry values that look unscaled. *Defence:* `stamps.fact.unobtainable` is an authored fact table with a tier-2 Source. The carry caveat degrades to "check carry capacity" at confidence M rather than inventing a number (TR-6).

**R5. Card advice that is opinion presented as fact.** The set and card orders are unverified (PV 2.1, 2.2). *Defence:* every card order entry is confidence L with "unverified" in its Source label. Only the mechanical checks (empty slot, passive card, Blunder past 50, set vs activity per Toolbox's own alert) are H. D3 keeps the pusher's set choice deterministic.

**R6. ETAs that mislead.** Card and stamp drop ETAs ignore drop-rate and card-drop multipliers that Toolbox doesn't compute. *Defence:* they are labelled "at base rate, likely sooner". They are computed only for fighting on the current map. They never drive a Verdict or a Next Action, only `toward` lines and gaps (FR-8, FR-12). Card ETAs are M4's (FR-18).

**R7. Flooding the Now screen.** About 100 unowned stamps, 200 cards and many obol slots could swamp the 3 + 5 caps. *Defence:* `later` items are a count, never a list (FR-9). Drops are never Next Actions (FR-12). Shop buys are bundled (D1). Everything else is ranked by M2's lists, with M10's caps and "show more".

**R8. Privacy leak through Report this or provenance.** Item counts and quest progress could fingerprint an account. *Defence:* TR-13 limits Report payloads to entry id, versions, Stage, class and level. Provenance stores field *paths*, not values, and it never leaves the device.

**R9. UX confusion between card presets and talent presets.** Both are "presets", both have a slot 1 and 2, and M9 also says "switch preset". *Defence:* M8's text always says "card preset". Its Detector ids are under `cards.` and M9's under `builds.`. M10's golden snapshots for both fixtures show the two lines distinctly; the W3 Wizard Lv 73 is the test case, since it may get both.

**R10. Promising an obol slot the player already "has".** (See red-team #1: on the W3 fixture the altar quest isn't done, which may explain the stale lock.) The W3 fixture marks a family slot locked even though its level gate is met, so a naive "next slot at 350" would tell the player something false. *Defence:* the FR-22 anomaly rule says nothing in that case and logs a diagnostic. The first build task is to check this against the game (the lock may only update when the player visits the altar). If it does, an authored "visit the Obol Altar to open it" Check can replace the silence.

**R11. Counting Bullseye wrong.** The dossier counted 8 stamps on the W2 account, but `level > 0` counts 7. *Defence:* FR-2 fixes the definition (`maxLevel > 0` or `level > 0`), and US-4 pins 8. The Lv 0 stamp goes to M7, so it is neither lost nor shown twice.

## 10. Red-team log

Independent red-team run on 2026-10-17 against this spec (with D1–D6 folded in), the glossary, the ADRs, Toolbox data at pin `6827d3f`, slice-1's vendored parsers, both private fixtures and the M2, M4, M5, M7, M10 and M11 draft specs. Each finding was checked against that evidence before a verdict. 30 findings: P0 1, P1 9, P2 14, P3 6. Verdicts: fixed 26, fixed in part with the rest deferred 1, rejected 3.

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| 1 | P0 | The W3 fixture never did the Obol Altar quest (status 0 on two characters, −1 on four, 0 obols equipped anywhere), so "equip your 4 stored obols" asks for the impossible. | Fixed | FR-20 is account-wide and gates FR-21/FR-22; US-8 W3 now expects the altar hand-in; §6 row. The Leverage model's W3 row ("equip the 4 stored obols") needs the same correction (deferred to its owner). Recorded in M2 TR-13, "Corrections to the Leverage model": 3a fires only once the Obol Altar quest is done. |
| 2 | P1 | The Bob Joe Pickle isn't craftable; it's sold in the YumYum Grotto shop, and Toolbox files the altar under Blunder Hills while `npcPlacements` puts it on map 50. | Fixed | `buyThenQuest` route (FR-5, TR-7); NPC world from `npcPlacements` (FR-20, TR-8 rule 2). |
| 3 | P1 | Stamp items already held aren't offered (the W3 Wizard Lv 73 carries 3 Duplogs Stamps; that stamp is uncollected). | Fixed | FR-2a `held` route, US-1 case, §6 row. |
| 4 | P1 | `toward`/`later` undefined for most stamps; hand totals untestable; Manamoar (Mutton 2 accepted, 0 of 300) missed. | Fixed | FR-1 makes `later` the remainder; FR-8 lists exactly what is `toward`; US-3 totals are script-computed and pinned in the golden snapshot. |
| 5 | P1 | US-2 says 8 of 30 Redox Salts; storage holds 9 more, so TR-6 gives 17. | Fixed | US-2 reads 17 of 30. |
| 6 | P1 | A card can be equipped on several characters at once (W2 fixture), so "unequipped cards" is the wrong model; the W3 Squire Lv 51 (3 of 4 slots) was missed. | Fixed | FR-13 counts cards not in this character's slots; padding rule; US-5 case. |
| 7 | P1 | D3 makes the W3 Squire Lv 85 (pusher, 36% hit) take Frostbite, but US-5 said no set action. | Fixed | US-5 expects Frostbite; FR-14 tier-0 and null fallback to Yum Yum (W2 pusher case). |
| 8 | P1 | D5's "3c" is already big bubbles, and M2 has no carry-forward. | Fixed | Stamps take the new 3i; the M2 row records the carry-forward rule M2 must add. |
| 9 | P1 | M4 already owns card Purpose lines and reads an M8 `cardList`; M8's US-7 contradicted M4 US-5. | Fixed | FR-18 and US-7 now supply `cardList(class, stage)` and Acquisitions only; `cards/list` replaces `mapCard`. |
| 10 | P1 | M7 has no Lv 0 stamp input, and its W2 table says "7 levelled, all at cap" while Bullseye is Lv 0 of 5. | Fixed in part | FR-2 and the M7 row state M7's below-cap coin rule covers it; correcting M7's fixture table is deferred to M7. Done in M7 (consistency pass). |
| 11 | P2 | `finalKillsPerHour` isn't in the parsed save; drops on maps nobody fights have no rate. | Fixed | FR-8 names the M2/M4 worker field; such drops are `later` with no ETA; TR-15. |
| 12 | P2 | Carry model wrong: Toolbox already gives scaled `carryCapBags[].capacityPerSlot`; the limit is slots × capacity. | Fixed | TR-6 requires `ceil(N ÷ capacityPerSlot)` free slots; look-ahead caveat. |
| 13 | P2 | Pinned shop entries have no price; the bank is in the save and is a wallet in M7. | Fixed | FR-3 "costs coins" without an affordability check; bank counted; §6 row rewritten. |
| 14 | P2 | Shop stock isn't checked, and Toolbox's parsed `shopStock` drops the stamp items. | Fixed | FR-3 reads raw `ShopStock`; sold out is `toward`; TR-15. |
| 15 | P2 | Shops carry no world; the town order in the bundle was undefined. | Fixed | TR-3 town → world source plus the `stamps.fact.shop-towns` fact table with a contract test; FR-11 town order; US-1 reordered. |
| 16 | P2 | Field-name traps (padded `equippedCards`, 0-based preset, `stars` = tier − 1, quest paths and keys, obol list names, no `freeInventorySlots`). | Fixed | New TR-15 field map; TR-5 inputs corrected. |
| 17 | P2 | Seven preset arrays always exist; locked presets could be suggested. | Fixed | FR-17 limits N to 2 + `gemShopPurchases[66]`. |
| 18 | P2 | Craft-then-hand-in ignores the Smithing level (Copper Chopper needs 15). | Fixed | FR-5 requires a character with the level; names the crafter. |
| 19 | P2 | Papua Piggea 4 is a measured threshold (`Total_Stamp_Lv` 500), not Active Play. | Fixed | FR-6 makes it `toward`; removed from the TR-4 Active Play list. |
| 20 | P2 | Bosses and the Gigafrog drop obols without the merit. | Fixed | FR-23 and US-8 say "regular monsters". |
| 21 | P2 | `toward` and set-tier items without a Next Action were called Goals. | Fixed | FR-19 and US-2 make them show-more lines or Milestones. |
| 22 | P2 | Broken-section rule missed sections Toolbox defaults to empty (`storage`, `refinery`, `currencies`, `gemShopPurchases`). | Fixed | FR-26, TR-5 section lists, §6 row. |
| 23 | P2 | "Another activity the character uses" can't be read from the save. | Fixed | FR-17 never overwrites a non-empty preset. |
| 24 | P2 | A renamed stamp turns the shared parser-sync PR red. | Rejected | M11 FR-5 requires dangling references to fail CI; the sync PR diff names what to update (TR-8 rule 6). |
| 25 | P3 | The 5× unowned-card multiplier is a game formula (ADR 0005). | Rejected | It is a documented constant used in arithmetic, and card ETAs are now M4's, which already uses it. |
| 26 | P3 | Shop buys need a coin holder, so M10 FR-17 would put them on a character row. | Fixed | With the bank as a wallet, any character can pay; FR-10 explains, keeping D1. |
| 27 | P3 | FR-27's footer contradicts M10 FR-26 (unlocked Systems only). | Fixed | FR-27 defers to M10 FR-26. |
| 28 | P3 | Index 63 is `GemP3` (Extra Card Slot); `GemQ9` is index 66. | Fixed | TR-3 and FR-13/FR-17 corrected. |
| 29 | P3 | Highest class level can pick a character without the items or slots. | Fixed | FR-10 order: holder, free slots, level, index. |
| 30 | P3 | The class and level roster plus exact counts could identify a private account. | Rejected | No names are published (TR-13), every spec uses class and level the same way, and exact counts are needed for the golden snapshots. |

## Consistency pass (2026-10-17)

- Ids follow M11: generated `stamps.acquisition.<slug>` (was `stamps.acq.<rawName>`), Detectors `stamps/status`, `stamps/lv0`, `cards/slots`, `cards/set`, `cards/preset`, `cards/list`, `obols/state`, ordering lists `stamps.priority.acquire`, `cards.priority.set-for-activity`, `cards.priority.matrix-<afk-type>`, `cards.priority.list-<class>` (`list: order`), authored fact tables `stamps.fact.shop-towns`, `stamps.fact.shared-resources`, `stamps.fact.unobtainable` (M7 reads the last one), and the held-item Check `stamps.check.held-now`.
- M2 now carries 3i and the carry-forward rule (M2 TR-13), and records the Obol Altar correction to the Leverage model's W3 obol row (red-team #1).
- M7 now counts the Bullseye Stamp at Lv 0 (red-team #10); M7's `SpendInputs.stamps` is the one per-stamp list and holds every collected stamp, Lv 0 included.
- M4 citations updated (`cards.contribution.fight`, `cards.goal.<card>`); `account.cards` is one field shared with M4; kill rates come from `CharacterState.fighting` (M4 TR-2).
- Liquid Shop daily obols are Not covered yet (M6 D6), so FR-23 links only the W2 merit Goal `merit-shop.check.spend-w2`.

## Cards view (owner request, 2026-10-18)

The owner asked for card presets that are "visualized and easy to understand per character, according to cards we already have", plus "a list of cards we should grind for optimal presets", limited to cards that are "appropriate and possible to get according to our world progress". This section adds that view. It supersedes R6's "card ETAs are M4's, current map only" **for this view only**. It still emits no Goal, Verdict or Next Action, so M4 (not built) keeps card Purpose lines and card Goals. This is the functional version; the visual design comes from the design track.

**What it shows.** `buildCardsView(state, kb)` in `packages/engine/src/collections/cards-view.ts` builds it. M8's module puts it on `EngineResult.cards` (plain data, typed in `cards-view-types.ts`).

- **CV-1 Presets, visualised.** Every unlocked card preset is shown as its slots: 4 plus the Gem Shop's Extra Card Slot (TR-3). A preset is one preset below Lv 15. Each slot shows the card's name, its level and stars, and its effect at that level (`bonus × level`, from `cards.json`). Empty slots stay visible. The preset in use is marked, using `equipped` because the stored preset can lag. Each preset gets the activities it fits by TR-9's keyword rule, and whether it fits the AFK Target. The active preset also shows the equipped card set, because the save stores one set per character.
- **CV-2 Best preset from owned cards.** There is one recommendation per activity: the AFK Target, then the character's first other active Role activity (M2 FR-7). It covers FR-13's pick of owned, non-passive cards that fit, and FR-14's set (D3's pusher rule included). It is shown as swaps ("Swap X → Y", "Add Y") against the preset that does that job:
  - the active preset when it fits, or when it is empty or has no clear fit;
  - otherwise a stored preset that fits ("Switch to card preset N");
  - otherwise an empty one ("Fill empty card preset N, then switch to it");
  - never a preset another activity's recommendation already claimed.

  The cards appear in the list's order, so US-6's "Iron card first" holds.
- **CV-3 Cards to grind.** These come from the class's card lists (`cardCandidates` for each of those activities, the same lists as `cardList`). Only cards below the base maximum (level 5) are listed, and only where:
  - the drop map is reachable by that character today: M14 TR-3's `supplyRates.reachable` (M5 TR-4's rule), skilling maps through any walked map of the world (M14 `supply.ts`), and only the world gate when the worker sent no reachable maps;
  - the map is at or before both the current world and the M2 Stage's world.

  Each line shows: the monster, map and world; the level and the next threshold (the first copy, then Toolbox `nextLevelReq`); the drop chance; the mean kills and hours for this character; the preset it improves; and who is already farming that map. Quick wins (a first copy, or 24 h or less) come first, then the list's order. There are at most 6 lines per character. Cards with no placeable map (bosses, crystal mobs, most trees and fish) are a count, never a guess.
- **CV-4 Account overview.** There is one row per character, e.g. "preset fits fighting ✓ · 2 empty slots · next grind: Frost Flake card (about 1.2 h)". A merged grind list follows, one line per card, with the characters it helps and the fastest one. Quick lines come first, then the cards that help the most characters. There are at most 10 lines.
- **CV-5 Links.** In the Now list, every card Goal (system `cards`) links to the Cards view: a character's Goal links to its Focus section, an account Goal to the overview. Until the per-character tab registry (`now/character-tabs.ts`, `feat/build-roadmap`) lands, the view is a collapsible section in Focus and in the Account section.

**ETA rule (ADR 0005).** Kills = 1 ÷ (chance × 5) for a first copy, plus (missing − 1) ÷ chance. The ×5 is the game's unowned-card rule (`LootDropOddsReset`, cards dossier, H). Hours = kills ÷ Toolbox `finalKillsPerHour` on that map for that character. That rate is M14 TR-3's supply rates, falling back to the current map's AFK rate. The chance is the drop table's base `effectiveChance`.
- **Not Drop Rate:** the game multiplies card entries by `CardChanceMulti` (≥ 1.2), not by Drop Rate, so Toolbox's `getDropRate` doesn't apply here.
- **Not `CardChanceMulti`:** Toolbox doesn't compute it, so every ETA is a mean at the base chance and a ceiling, labelled "at the base drop chance (likely sooner)".
- **Skilling cards** get no hours (M4 FR-6), only the chance.

**Data.** The new generated fact table is `cards.fact.drops` (`packages/knowledge/generators/card-drops.gen.ts`). It has one row per card: name, effect, bonus, perTier, set, best base chance with its monster, AFK type, and the real maps from `mapEnemiesArray`. It ships because `packages/engine/detectors/cards/slots.ts` names it, at about +48 KB of the bundle. The worker adds the grind candidates' fighting maps to M14's supply step (`cardLeavesForRates`), up to 12 maps, so their kill rates are computed in the same parse.

**Sources.** For players: [IdleOn Wiki: Cards](https://idleon.wiki/wiki/Cards) (drop chances, levels, presets, and that unowned cards drop far more often; opened 2026-10-18). Toolbox is the tier 1 provenance (`cards.json`, `monsterDrops.json`, `parsers/cards.ts` `calculateStars`). The ×5 and `CardChanceMulti` come from the cards dossier (`research/cards-obols`, N.js `LootDropOddsReset` and `CardChanceMulti`).

**Tests.** `packages/engine/test/collections/cards-view.test.ts` runs on the scrubbed saves in CI. It covers the ETA arithmetic, presets as slots, the Wizard's preset switch, the Squire's Iron-first fill, owned-only cards, one job per preset, reachability (no W4 card for the W3-early account even when the list ranks W4 cards first; no W3 card for W2-late), quick-first order, the overview, `EngineResult.cards`, and an unreadable loadout. The same stories on the private saves are in `cards-view.private.test.ts` (local only).
