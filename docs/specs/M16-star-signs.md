# M16 Star Signs and constellations

Spec for the owner's request of 2026-10-17 (fill 3f, the last W1–W3 gap the AutoReview deep dive found: "Star Signs … sit under Not covered yet"), part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **ready for owner review**: red-teamed by an independent reviewer and fixed (section 10). Every open question is self-ruled with a researched recommendation (section 8, "Owner review"), because the owner was away. Terms follow [`GLOSSARY.md`](../../GLOSSARY.md); decisions follow [ADRs 0001–0008](../adr/).

**Why this exists.** The owner asked which star sign his new Hunter should wear, which showed he did not know constellations exist. Both private fixtures have only the 4 free starter signs, 1 sign slot per character, and 0 or 1 of 49 constellations done. Only 1 of their 11 characters can even reach the Telescope where signs are changed. Toolbox lists constellations and shows a "missing star signs" alert; nobody says *which constellation to do next, on which character, and what to wear*. M16 does.

**Decisions this spec rests on:**
- [ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md) (deterministic advice), [0004](../adr/0004-source-precedence.md) (game data first), [0005](../adr/0005-toolbox-numbers-not-our-formulas.md) (Toolbox numbers plus arithmetic, no formulas of ours), [0006](../adr/0006-client-only-spa-parsing-in-a-worker.md) (Toolbox code only in the worker), [0007](../adr/0007-generated-facts-authored-judgment.md) (generated facts, authored judgment).
- [#74](https://github.com/YassSoliman/idleon-forge/issues/74) (every entry links a player-readable tier 2–4 Source; tier-1 game data stays as provenance).
- [#70](https://github.com/YassSoliman/idleon-forge/issues/70) A5 (a Goal that would repeat across characters is one account line with per-character details).
- **M15's owner principles P1–P7** (ruled 2026-10-17), adopted unchanged: P1 one Next Action per Goal; P2 never a target above the next Stage; P3 every line says who, where and how long; P4 breakdowns behind "why" / "show details"; P5 one global ranking (`compareGoals`, M2 TR-14); P6 no tier jargon; P7 every warning carries its fix.
- M14 (Walkthroughs): the Walkthrough view (`WalkthroughView`, M10 TR-2), `holdingsOf`, the reachability rule and FR-18's "never move" rules are reused, not copied (TR-6).

**Patch.** Game v1.23 (Toolbox gameVer 2.3.540), parser pin `6c37e3d` (`packages/toolbox-parsers/UPSTREAM`). `N.js` read 2026-10-17 (the client served that day, 26.4 MB). Offsets are character offsets in that file and shift every patch; the symbol names (`StarQuests`, `SSignInfoUI`, `_customBlock_ProgressStarsign`, `StarSignProg`, `AccountWideQuests`) do not.

**Fixtures.** Acceptance criteria use the two private fixtures, by account, class and level only: the **W2-late account** (5 characters: Barbarian 60, Squire 43, Shaman 44, Bowman 54, Wizard 56; `currentWorld` 2) and the **W3-early account** (6 characters: Wizard 73, Squire 51, Bowman 60, Squire 85, Barbarian 56, Shaman 54; `currentWorld` 3). CI runs the same assertions on `fixtures/scrubbed/scrubbed-w2.json` and `scrubbed-w3.json`. Values were read on 2026-10-17 by local scripts (section 11) and are quoted as aggregates; exact text is pinned by the golden snapshots.

## 1. Purpose

Star signs are small permanent bonuses each character wears; constellations are the challenges that pay the Star Chart Points that unlock them. A W1–W3 player usually leaves the whole System at zero: the game never says the Telescope sits at the top of the big tree behind three kill-gated doors, that one character's visit opens constellations for the whole account, where the stars are, or that a second sign slot exists. M16 turns it into a short, opinionated plan: **open the way to the Telescope on one character and start the System**; **do these constellations next** (each a Goal with a Walkthrough: where the star is, what the challenge is, which characters can do it, step by step); **unlock these signs in this order** (Chronus Cosmos first, so every character wears two); and **wear this sign on this character** for its AFK Target, as one account line with per-character details. It reads only the save; it never touches the game.

## 2. Scope / Out of scope

### Ownership (who builds what)

M16 is a **new small module** with its own folders (D-1). It reuses other modules' interfaces and asks three small changes of their owners (section 7).

| # | Feature | Owner | Folder that builds it | Entries and Detectors | Ships |
|---|---|---|---|---|---|
| F1 | Telescope start: open the tree, A-2, hand in the quest | **M16** | `packages/engine/src/starsigns/`, `packages/knowledge/systems/star-signs.yaml` | `star-signs.goal.telescope`; engine Detector `star-signs/telescope` | Phase 1 |
| F2 | Constellations to clear next, each with a Walkthrough | **M16** (engine step); the view is **M10**/**M14**'s `WalkthroughView` | `packages/engine/src/starsigns/constellations.ts`, `walkthrough.ts` | `star-signs.goal.constellation` (one family, one instance per constellation); engine Detector `star-signs/constellations` | Phase 1 (claim, visit, level, candy, task kinds); Phase 2 (AFK-hours through M14's planner) |
| F3 | Star Chart plan and per-character signs | **M16** | `packages/engine/src/starsigns/signs.ts` | `star-signs.goal.signs`, `star-signs.priority.chart-order`, `star-signs.priority.fit-*`; engine Detector `star-signs/signs` | Phase 1 |
| F4 | Challenge constellations as Active Play | **M16** | same | `star-signs.check.activeplay-challenge` | Phase 1 |
| — | Account State fields | **M16** adapter additions (M1 TR-11 growth); `Telescope` added to the gate-NPC list **M2** owns | `packages/account-state/src/starsigns.ts`; one line in `account-state/src/types.ts` `GATE_NPCS` | — | Phase 1 |
| — | Fill 3f in the free-value block | **M2** (owns every list file) | `metapath.yaml` `metapath.priority.free-value-fills` | the three Goal ids above | Phase 1 |
| — | Tree-map kill rates | **M14** worker (`supply.ts`) | adds the three tree maps to the supply maps for characters who have not opened them | — | Phase 1 |
| — | Facts: constellations, the Star Chart tree, rules | **M16**, authored tier 1 (N.js) with a CI cross-check against Toolbox data (TR-3) | `packages/knowledge/systems/star-signs.facts.yaml` | `star-signs.fact.constellations`, `star-signs.fact.chart`, `star-signs.fact.rules` | Phase 1 |

### In scope
- **F1.** Until the Telescope quest "I'm Seeing Stars!" is handed in: one Account Goal that walks the account there: open the tree on one character (three kill-gated doors), talk to the Telescope, do A-2 (1 h AFK there, or a 1-hour Time Candy), click the star, talk to the Telescope again to hand in the quest. The hand-in gives every character the Telescope's dialogue, so constellations everywhere work for the whole account.
- **F2.** For W1–W3 constellations the account can do now: a Goal per constellation, capped (D-2), each with a Walkthrough built from game data and the save: the map and world, what the challenge is, how many characters it needs and which have done it, which characters can do the rest, and the steps in order.
- **F3.** One Account Goal for star signs: spend Star Chart Points in the authored chart order (D-5), in one trip where it can, and the sign each character should wear for its current AFK Target and slot count (D-6, D-7), with per-character details. A character that cannot reach the Telescope gets "opens after about N kills" instead of a swap, and a new character gets "pick The Fuzzy Dice when you create it".
- **F4.** Constellations that test fight skill (a boss under 20 s, a colosseum clear, a Worship wave, killing all monsters before a respawn) as "If you have time" Active Play suggestions, never a ranked Goal and never a Verdict input (D-3).

### Out of scope (and who owns it)
- **W4+ constellations (D-1 … F-9) and the Seraph chart.** Never shown below Stage W4-entry (P2). On a W4-entry account they go under "Not covered yet" (M10 FR-26) until a later PR.
- **Infinite Stars (Rift 10), shiny-pet Infinite Star slots, the Silkrode Nanochip, Seraph Cosmos.** W4+ multipliers. An account M2 flags `coverage: 'beyond'` gets no F3 Goal; a W4 spec owns the rest.
- **Hydron chart fit signs** (Sawsaw Salala for the builder, Trapezoidburg for the trapper, Preys Bea for the worshipper, The Fiesty …): Phase 2 (section 12). Phase 1 plans the Hydron chart only up to Hydron Cosmos (the third slot).
- **AFK-hours constellations by moving a character for hours** (B-3, B-7, C-4 without a short enough candy): Phase 2, through M14's planner (FR-12). Phase 1 shows them as "Later" details only.
- **Opening the tree for every character.** Phase 1 opens it for one character (F1) and, for sign alignment, only names the kills each other character needs (FR-18). Assigning those kills is Phase 2 (M14's planner).
- **Damage or survivability maths for challenges.** ActiveOn does not predict a 20-second boss kill (ADR 0005). F4 names candidates by class level, labelled as such (D-11).
- **Boss keys and colosseum tickets themselves.** M6 owns collecting them; M16 only says what a step spends and what the account holds.
- **Writing to the game.** Every step is something the player does.

## 3. Functional requirements

### Facts settled for this spec (section 11, V1–V11)

- **F-a The Star Chart is a tree.** Every sign is a chart node with a parent node and a cost (`SSignInfoUI` rows `[signIndex, x, y, parent, cost]`). A sign can be unlocked only when its parent is unlocked and the account's unspent points cover its cost; unlocking subtracts the cost from `OptionsListAccount[40]` and sets `StarSignsUnlocked[sign] = 1` (`N.js` @7552743, @7681006). The four starters cost 0.
- **F-b Chronus Cosmos costs 19 points from scratch, not 3.** Its path is Dwarfo Beardus → Hipster Logger → Pack Mule → Pirate Booty → All Rounder → Fatty Doodoo → Robinhood → Ned Kelly → Chronus Cosmos, at 2 each and 3 for the Cosmos. The character-builds dossier's "A-2 → 3 SCP → Chronus Cosmos" read the sign's own cost only.
- **F-c The Hydron chart opens at 24 unlocked chart nodes.** The Star Sign screen counts unlocked nodes among the first 64 (node 0 always counts) and opens chart 2 above 23 and chart 3 above 57 (@7554573, @7735821). With the 4 starters, that is 20 bought Chronus signs, whichever they are. Hydron Cosmos (third slot) then costs 14 along All Rounderi → Centaurii → Murmollio → Strandissi → Wispommo → Pokaminni → Gor Bowzor → Hydron Cosmos.
- **F-d Slots.** 1 sign per character, 2 once Chronus Cosmos is unlocked, 3 once Hydron Cosmos is (Toolbox `starSignsAlerts` `maxStarSigns`; wiki Star Signs).
- **F-e Signs are changed only at the Telescope, by each character.** The Star Sign screen opens only on map 31 (Where the Branches End, the top of the big tree in W1) at the Telescope (@5315002); it was removed from the quick-reference menu (Reddit [1pxfpp2](https://www.reddit.com/r/idleon/comments/1pxfpp2/), 2025-12-28: "starsigns are only accessible through the top of the tree"). Aligning writes the playing character's own list (@7553600). Unlocking is account-wide and needs only one character there.
- **F-f The Telescope is behind three kill-gated doors.** Valley of the Beans → Jungle Perimeter (3,000 kills) → The Base of the Bark (2,500) → Hollowed Trunk (5,000) → Where the Branches End (`maps.fact.maps` doors; door kills are per character). On the fixtures, 1 of 11 characters has opened it; the others need about 5,000–7,600 kills (section 11).
- **F-g A new character picks its first sign at creation** among the starters (wiki Star Signs: "When you first create a character you have a choice of several starting Star Signs").
- **F-h Constellation types** (`StarQuests` rows `[map, x, y, min, max, players, points, text, type]`, `N.js` `na.StarQuests`; `_customBlock_ProgressStarsign` @6610274):
  - type 0 "reach this star": clicking the star records the character when its class index is within `[min, max]` (0–99 any class; 18–30 the Archer line; 31–43 the Mage line);
  - type 1 "reach Lv N on K players": clicking records it when the character's class level ≥ N;
  - type 3 "AFK here for H hours": recorded when one AFK claim of at least H hours is collected on that map (@5579936). A Time Candy of at least H hours used while AFK there counts; several candies never add up (wiki Star Signs). The game refuses a candy while the AFK Target is Laboratory, Cooking or nothing, on non-AFK maps, or while moving (@8201286), and the candy credits the map the character stands on (@5580046), so the character must be AFK on a monster there;
  - type 4 event constellations, recorded by game events: Dr. Defecaus killed (A-5), a Dewdrop or Sandstone Colosseum clear (A-8, B-5), Amarok killed in under 20 s (A-9), Efaunt killed by a Beginner-line class (B-6), a Sheepie killed with no weapon equipped (C-2), Trapping ≥ 15 on entering Trappers Folley (C-3), Worship wave ≥ 11 on Rollin' Tundra (C-5), a Bloodbone killed (C-8) (call sites in section 11, V3).
- **F-i Who has done it.** `StarSignProg[i] = [letters, done]`. A character's letter is `Number2Letter[slot]`, with `_` for slot 0, then `a`, `b`, … (V4). A character is recorded once.
- **F-j Claiming.** A constellation completes only when a character **clicks its star** while `letters.length ≥ players` and `done = 0`; that sets `done = 1` and adds its points to `OptionsListAccount[40]` (@9737537). An event or AFK constellation whose characters are all recorded pays nothing until someone visits the star ("claim-ready").
- **F-k The Telescope dialogue gate, and the account-wide hand-in.** A star responds to a click only when the playing character's `NPCdialogue.Telescope ≥ 1` (@9731251). The Telescope's first quest "I'm Seeing Stars!" asks for A-2; handing it in (the Telescope's dialogue line 4) is an **account-wide quest** (`AccountWideQuests` `Telescope4`, @14925015): it marks the quest done and sets `NPCdialogue.Telescope = 9999` on every other character that exists then (@6172997). It needs 2 free bag slots and pays 2 two-hour and 2 four-hour Time Candies and 10 gems (Toolbox `quests.json` "Telescope"). A character created later has no dialogue until it talks to the Telescope itself (V9). Event and AFK progress are recorded without the dialogue.
- **F-l Points.** Each constellation pays its `points` once (Toolbox `constellations[].points`); doing it on more characters gives nothing (Reddit [1s6hn93](https://www.reddit.com/r/idleon/comments/1s6hn93/), 2026-03-29). W1 pays 37, W2 32, W3 39.

### Reach (used by every feature)

- **FR-0 Reachable.** A map is **reachable** for a character by M14's rule exactly (`supplyRates.reachable[c]`, M14 TR-3 and its build notes): the current map; every map where the character has kills past the door; each such door's destination; a skilling map once the character walks any map of its world; and a town of a world ≤ `currentWorld`. A map with doors the character has not opened is not reachable, and the step names the next door and the kills left on it ("The Base of the Bark: 2,500 more kills at Jungle Perimeter"). A boss arena (End of the Road for Amarok, Efaunt's Tomb) counts as reachable for a character holding or able to withdraw its key, since it is entered with the key; a colosseum follows V7. When `supplyRates` is `unavailable`, reach is unknown: steps read "if you can reach it" and are never claimed done (M14 FR-33).

### F1 Telescope start

- **FR-1 When.** From Stage W1-mid, while the Telescope quest is not handed in on the account (`Telescope1` not completed on any character): one Account Goal "Start Star Signs: the Telescope", category `compounding`, urgency `banked`, position 3f. It replaces every F2 and F3 Goal (they need the hand-in); F3's per-character details ride on it (FR-18).
- **FR-2 The way there.** F1 picks one **opener**: the character with the fewest kills left on the tree doors (F-f) that M14 FR-18 does not exclude from moving (the pusher on its push, a Role holder on its Role activity, a Lab or Cooking character); ties go to the higher kill rate at the next door's map (Toolbox `finalKillsPerHour`, from the tree maps M14's worker adds, X3), then the lower index. If every character is excluded, the opener is the one with the fewest kills left, with "when it's free".
- **FR-3 Next Action**, the first step not done:
  1. **open**: "Move your <class Lv> to <map> (W1): <n> more kills open <next map>, about <t> at its kill rate"; after the last door the step is "walk up to Where the Branches End". The why says "the Telescope is at the top of the big tree; you open it once, on this one character".
  2. **talk**: "On your <class Lv>: talk to the Telescope at Where the Branches End and take its quest".
  3. **A-2**: "Stand on a monster there and use a 1-hour Time Candy, then click star A-2 on the bottom-right branch, then send it back to <AFK Target>", using the smallest held candy of 1 to `maxCandyHours` hours (FR-9); with none, "stay AFK there for at least 1 hour, then click star A-2".
  4. **hand in**: "Talk to the Telescope again to hand in "I'm Seeing Stars!" (free 2 bag slots first): every character can then use constellations".
  How long: the open step uses the kill-rate hours; the others "about 6 minutes" (TR-5).
- **FR-4 Why.** "Constellations pay Star Chart Points that unlock star signs. After this, <n> constellations are ready, worth <p> points: <what they reach>." `<what they reach>` is "enough for Chronus Cosmos: 2 signs on every character" when `p` plus banked points covers the remaining Chronus Cosmos cost (FR-15), else "<p> of the <r> points still needed for Chronus Cosmos". `n` and `p` come from F2's candidates computed as if the quest were handed in, counting the quest's reward candies.

### F2 Constellations to clear next

- **FR-5 Candidates.** A constellation is a candidate when all hold (P2, D-12):
  1. it is not `done`;
  2. its world (A = 1, B = 2, C = 3) is ≤ the Stage's world (`STAGE_DEFINITIONS[stage].world`) and ≤ `account.currentWorld`; D and later are never candidates in Phase 1;
  3. the account has at least `players` characters;
  4. for a class-gated star (Archer, Mage) the account has a character of that line; for B-6 a Beginner or Journeyman-line character;
  5. F1 is done (the quest is handed in).
- **FR-6 Kinds.** Each candidate gets the first kind that applies:
  - **claim**: `letters.length ≥ players` (F-j). One visit by a character with the Telescope dialogue, preferring a recorded one (it has proven it can reach the map), plus what the map needs to enter: a Forest Villa Key for Amarok's arena (A-9), an Efaunt's Tomb Key for B-6, and for A-8 and B-5 "enter with a ticket if the game asks" until V7 is settled;
  - **visit**: type 0 or type 1, and enough characters not yet recorded can do it now (class range met; for type 1 class level ≥ N; the map reachable, FR-0) to reach `players`;
  - **task**: a type 4 constellation that is a plain action, with its gate met on enough characters and the map reachable: C-3 (Trapping ≥ 15, then enter Trappers Folley), C-2 (unequip the weapon, kill one Sheepie at Steep Sheep Ledge, put it back), C-8 (kill one Bloodbone at Hell Hath Frozen Over);
  - **candy**: type 3 with H ≤ `values.maxCandyHours` (default 4, D-4), the account holds enough Time Candies of H to `maxCandyHours` hours (`Timecandy1` 1 h, `Timecandy2` 2 h, `Timecandy3` 4 h; never the random `Timecandy7`–`9` or the 12 h+ ones) for the characters still missing, and enough of them can reach the map and use a candy (not Lab, Cooking or no AFK Target, F-h);
  - **afk-hours**: type 3 otherwise (Phase 1: "Later" details only, FR-11);
  - **challenge**: the other type 4 constellations (F4, FR-13);
  - **not yet**: none of the above: no output, except FR-11's "Later" line.
- **FR-7 Goals.** Claim, visit, task and candy candidates become Goals `star-signs.goal.constellation@<name>` ("Constellation A-1: Blunder Hills, Lv 30 on 4 characters"), category `compounding`, urgency `banked`, position 3f, cost `{ unit: 'hours', amount: effortSeconds / 3600 }` (TR-5). **Selection:** M16 emits the constellation Goals with the lowest effort, ties by more points, then lower world, then name in natural order (A-2 before A-10), up to `values.maxM16Goals` (default 2) **Account Goals for M16 in total**, the Star Signs Goal counting as one when it has a Next Action (D-2). Their **display order** is the shared comparator's (M2 TR-14: cheaper first, then its later steps, then entry id); M16 never re-orders. The rest go into F3's details as "Also ready: B-4 (5 points, about 8 min), A-3 (3, about 8 min)".
- **FR-8 Walkthrough.** Each Goal carries a `WalkthroughView` (M10 TR-2 `Goal.walkthrough`), built by M16 (TR-6), with one step per character action, each with `subject` (the character), `progress`, the wiki location link and the text:
  - **talk** (only for a character with no Telescope dialogue, i.e. created after the hand-in): "talk to the Telescope at Where the Branches End first", or, when it cannot reach it, the character is not assigned (FR-9);
  - **visit**: "go to <map> (W<n>), click the star, then go back to <AFK Target>";
  - **task**: the task's own words, then "go back to <AFK Target>";
  - **candy**: "withdraw a <H>-hour Time Candy" (only when it sits in storage), then "go to <map> (W<n>), stand on a monster, use the candy, click the star, then go back to <AFK Target>";
  - **claim**: "withdraw 1 <key>" when the key is an item in storage, then "spend it to enter <arena>, click the star".
  The collapsed line reads "<name>: <recorded> of <players> characters · about <t>". The Goal's Next Action is the first not-done step (P1). Recorded characters are listed ticked.
- **FR-9 Who does it.** For visit, task and candy kinds, the assigned characters are the first `players − recorded` eligible, not-yet-recorded characters in this order: not excluded by M14 FR-18 (so a free character goes before the pusher or a Role holder); then the playing character (M1 `lastPlayedCharacterIndex`); then the lower index. An FR-18-excluded character is still eligible when no one else is: a visit takes minutes and the step sends it back (P7). Lab and Cooking characters are never assigned a candy step (F-h). Candies: the smallest covering candy first, from the assigned character's bag before storage, so a 4-hour candy is never spent on a 2-hour star while 2-hour ones are held.
- **FR-11 Later.** Afk-hours candidates, and type 1 stars where **every** missing character is within `values.levelGap` (default 5) levels, appear only as F3 details under "Later", one line each, never as Goals in Phase 1: "B-3: AFK 4 h in The Grandioso Canyon on 2 more characters (1 of 3)"; "B-8: Lv 65 on 4; your Bowman Lv 60 is 5 levels short, and 1 more character after it" is shown only when that last character is also within the gap.
- **FR-12 Phase 2: AFK constellations as M14 jobs.** An afk-hours candidate becomes an M14 job `{ kind: 'afk-hours', mapIndex, hours, characters }` that M14's planner assigns under its FR-17/FR-18/FR-21, so a free character spends one AFK Stretch on the map; the tree doors for alignment (FR-18) become kill jobs the same way. Not in Phase 1.
- **FR-13 Challenges (F4).** Each challenge candidate with the map reachable by at least one not-recorded character is one "If you have time" Active Play suggestion `star-signs.check.activeplay-challenge@<name>`: "<challenge in plain words> on <k> more characters (<recorded> of <players>)", "try with your <class Lv>, your highest-level character not yet recorded" (D-11), what it spends ("1 Forest Villa Key each"), and "a few minutes per try". At most `values.maxChallenges` (default 1), the one closest to done (most recorded, then most points). It never ranks among Goals and never touches a Verdict.
- **FR-14 Done.** A constellation Goal is done when a later save has `done = 1` (Done this session, M10 FR-33). A step is done when its character's letter appears, or for talk when `npcDialog.Telescope ≥ 1`. F1's steps are done by door kills (KillsLeft at or below 0), the dialogue, A-2's `done`, and the quest's completion.

### F3 Star Chart plan and per-character signs

- **FR-15 Chart order.** `star-signs.priority.chart-order` (`list: order`, authored, D-5) lists Chronus and Hydron chart nodes in the order to unlock them, in four legs:
  1. **Chronus Cosmos** (19 points from scratch): Dwarfo Beardus, Hipster Logger, Pack Mule, Pirate Booty, All Rounder, Fatty Doodoo, Robinhood, Ned Kelly, Chronus Cosmos;
  2. **open the Hydron chart**: Pie Seas, Shoe Fly, The Fallen Titan, Activelius, Gum Drop, Mount Eaterest, Miniature Game, Muscle Man, Fast Frog, Smart Stooge, Lucky Larry (18 more after leg 1). Leg 2 is skipped as soon as 24 nodes are unlocked by any route (F-c), counted from the save;
  3. **Hydron Cosmos** (14 more): All Rounderi, Centaurii, Murmollio, Strandissi, Wispommo, Pokaminni, Gor Bowzor, Hydron Cosmos;
  4. **fit signs**: Bob Build Guy, The Big Comatose, Silly Snoozer, The Big Brain, Sir Savvy, Grim Reaper, The OG Skiller, Blue Hedgehog, then any leg-2 item left (Phase 2 adds Hydron fit signs).
  The **next sign** is the first item not unlocked whose parent is unlocked and, for Hydron nodes, whose chart is open. A leg's **remaining cost** is the sum of its not-yet-unlocked items. Never listed: The Forsaken, Mr No Sleep (D-7), Seraph chart signs (P2).
- **FR-16 Slots and fit.** For each character: `slots` from F-d; its **activity** is its AFK Target's type (M1 `afkType`), or, when it has none, the AFK type of its first active M2 Role (D-8). The set to wear is the first `slots` unlocked, non-infinite signs of `star-signs.priority.fit-<activity>` (D-6, D-7):
  - `fit-fighting`: Silly Snoozer, Pirate Booty, All Rounder, Fatty Doodoo, The Fallen Titan, Gum Drop, then the starters;
  - `fit-mining`: Dwarfo Beardus, The Big Comatose, The OG Skiller, Sir Savvy, Pack Mule, then the starters;
  - `fit-choppin`: Hipster Logger, then the same skill tail;
  - `fit-fishing`: Pie Seas, then the same skill tail;
  - `fit-catching`: Shoe Fly, then the same skill tail;
  - **the starter tail of every list**: The Fuzzy Dice, The Buff Guy, The Book Worm, Flexo Bendo.
  Other activities (Cooking, Lab, Divinity, …) get no recommendation: "no sign advice for <activity> yet".
- **FR-17 The Goal.** One Account Goal `star-signs.goal.signs`, "Star signs: <Next Action headline>", category `compounding`, urgency `banked`, position 3f. Its Next Action is the first that applies (P1); **who** is always a character that can reach the Telescope (F-e, FR-0):
  1. **Unlock** (one trip): the next sign is affordable **and** either the banked points cover the rest of the current leg, or no constellation Goal is shown this run (no more points are coming this session): "On your <class Lv> at the Telescope: unlock <sign>[, <sign> …] (<cost> of your <n> points)", listing every sign the points buy in order; plus "and align <sign>" when that character's own fit set gains one. Otherwise the details say "Bank your points: after <shown constellations> you can unlock up to <sign> in one trip";
  2. **Empty slot**: a character that can reach the Telescope wears fewer signs than its slots: "On your <class Lv>, at the Telescope: align <sign> in your empty slot";
  3. **Better fit**: a character that can reach the Telescope lacks a recommended **non-starter** sign it could wear: "On your <class Lv>, at the Telescope: swap <worn> for <sign> (<activity>)".
  When none applies, the Goal renders as an Account info line ("Star signs: <milestone line>") with its details and no action (as M15 F3), and it does not count toward `maxM16Goals`.
- **FR-18 Details (P4).** Behind "show details":
  - **the milestone line**: "<banked + ready> points ready, <remaining cost> needed for <Chronus Cosmos | opening the Hydron chart | Hydron Cosmos>", with what it gives ("2 signs on every character");
  - **one line per character**: "<class Lv> (<activity>): wear <A>[ + <B>]", counting as unlocked any sign this Goal's own Next Action unlocks; then "✓" when it matches; "(wearing <C>; swap next time it's at the Telescope)" when only starters differ and it can reach the Telescope; "(wearing <C>; it can change signs after about <n> kills to reach the Telescope)" when it cannot; and, while the account has 1 slot, "after Chronus Cosmos: <A> + <B>" from the same list against leg-1 signs, adding "<sign> once unlocked" when the first leg-2 sign in its list (Pie Seas, Shoe Fly) would rank higher;
  - "**Next character**: pick The Fuzzy Dice when you create it" while the account has a free or upcoming character slot (M2's next-character Goal or M15 F3) (F-g);
  - "Also ready" constellations beyond the cap (FR-7) and "Later" items (FR-11).
  Starter-to-starter swaps are **never** a Next Action (D-6).
- **FR-19 Infinite Stars.** A sign with `isInfiniteStar` counts as worn by everyone and is skipped in fit lists. On `coverage: 'beyond'` accounts F3 emits nothing.

### All features

- **FR-20 Gates.** Nothing before Stage W1-mid. A failed `starSigns` or `constellations` section, or a missing `pointsUnspent`, makes the affected Detector `unknown` (M11 TR-4), with no Goal: never advice from a broken parse.
- **FR-21 Sources (#74).** Every M16 entry carries the wiki [Star Signs](https://idleon.wiki/wiki/Star_Signs) page (tier 2, edited 2026-10-05, after the current major patch of 2026-08-26) and its tier-1 provenance (`N.js` symbols, Toolbox `shared-data.json` `starSigns` / `constellations`). Constellation steps add [Constellation Locations](https://idleon.wiki/wiki/Constellation_Locations) with the anchor (`#A-1`) for the star's picture (tier 4, edited 2024-08-17, labelled with that date). F1 adds [Telescope](https://idleon.wiki/wiki/Telescope) (tier 2, 2026-09-27) and the tree maps' wiki pages (M14 TR-9). F3's "unlock them all, then wear what fits the job" cites Reddit [1v7nja9](https://www.reddit.com/r/idleon/comments/1v7nja9/) (2026-07-27: "the most important thing is making sure you actually unlock them all"; "Just unlock them and pick what fits best for each character at the time"). No GitHub file is ever the only Source.
- **FR-22 Not a blocker.** No M16 output is a Verdict blocker or changes a Verdict (`affectsVerdict: false`).
- **FR-23 Determinism.** The same Account State, Knowledge Base, Expected Return and `now` give byte-identical output (M14 FR-32).
- **FR-24 Names.** Outputs carry character indices; names are joined in the UI (M14 TR-13). No template has a name slot.

## 4. User stories

Unless a story says otherwise, `now` is the fixture's last cloud save and the Expected Return is 8 h. "Shows" means the `EngineResult` holds the Goal with that text; every Then is also a golden-snapshot line.

**US-1 Start the System (W2-late).** As a player in a Play Session, I want to be told the Telescope and constellations exist and how to get there, so that I stop leaving free bonuses at zero.
- Given the W2-late account (no character has opened Where the Branches End: one character is about 5,000 kills from it at Hollowed Trunk, the other four about 7,500 at The Base of the Bark and Hollowed Trunk; the quest not handed in; small Time Candies in storage) / When the engine runs / Then the Account section holds "Start Star Signs: the Telescope" whose Next Action is an open step on the opener (FR-2: the closest character M14 FR-18 does not exclude), naming the map, the kills left and "about <t> at its kill rate", position 3, category `compounding`.
- And its why reads "… After this, 6 constellations are ready, worth 23 points: enough for Chronus Cosmos" (A-9 claim, B-4, B-1, A-1, A-3, and A-7 with two-hour candies; with A-2's 3 points, 26).
- And no `star-signs.goal.constellation@*` and no `star-signs.goal.signs` Goal shows (FR-1); the Telescope Goal's details hold one line per character, each "wear The Fuzzy Dice" with "(… it can change signs after about <n> kills to reach the Telescope)" where it wears another starter, and "after Chronus Cosmos: Pirate Booty + All Rounder" for the four fighting characters and "Dwarfo Beardus + Pack Mule" for the Squire Lv 43 (Mining).
- Given the W2-late account mutated so the opener stands at Where the Branches End with the dialogue / When the engine runs / Then the Next Action is the A-2 step with the 1-hour candy, then "send it back to <AFK Target>".
- Given that state with A-2 done / When the engine runs / Then the Next Action is "Talk to the Telescope again to hand in "I'm Seeing Stars!" (free 2 bag slots first): every character can then use constellations".

**US-2 What to clear next (W3-early).** As a player in a Play Session, I want the next constellations named with who goes where, so that I can clear them in minutes.
- Given the W3-early account (quest handed in; every character has the dialogue; 3 points banked; small Time Candies held; A-1, A-3, A-7, B-1, B-4 untouched) / When the engine runs / Then exactly 2 constellation Goals show, B-1 "The Mimic Hole, reach the star on 3 characters" (4 points, 3 visits) and A-7 "Winding Willows, AFK 2 h on 2 characters" (3 points, 2 two-hour candies), both about 6 min, in the comparator's order (equal cost, so entry id: A-7 first, FR-7).
- And B-1's Walkthrough lists 3 visit steps on characters not excluded by M14 FR-18, each "go to The Mimic Hole (W2), click the star, then go back to <AFK Target>", with the Constellation Locations link, collapsed as "B-1: 0 of 3 characters · about 6 min".
- And A-7's Walkthrough uses the two smallest covering candies (two-hour ones), never a four-hour one (FR-9), on characters that can reach Winding Willows.
- And the Star Signs line is an info line (its only possible action, an unlock, waits: FR-17.1) whose details hold "Bank your points: after B-1 and A-7 you can unlock up to Pack Mule in one trip", "Also ready: B-4 (5 points), A-1 (3), A-3 (3)" and the milestone line "21 points ready, 19 needed for Chronus Cosmos" (3 banked + 18 ready).
- And no Goal names C-6 (needs 9 characters, the account has 6) or C-1 (nobody is Lv 90), and no D-row constellation appears anywhere (P2).

**US-3 Claim what's already earned.** As a player, I want to know when a constellation is done but not claimed, so that I collect its points.
- Given the W2-late account mutated so the Telescope quest is handed in / When the engine runs / Then "Constellation A-9: End of the Road, claim it" shows among the constellation Goals, with Next Action "On your <class Lv>: withdraw 1 Forest Villa Key, spend it to enter Amarok's arena, click the star" on a character already recorded (4 recorded of 3 needed, F-j), about 3 minutes.
- Given the W3-early account (A-9: 2 of 3 recorded) / When the engine runs / Then A-9 is not a Goal; when it is the challenge closest to done, "If you have time" holds "Kill Amarok in under 20 seconds on 1 more character (2 of 3); try with your <class Lv>, your highest-level character not yet recorded; spends 1 Forest Villa Key" (FR-13), never naming a recorded character.

**US-4 Which sign on which character.** As a player, I want one line telling me what each character should wear, so that I never wonder again and never get nagged about tiny swaps.
- Given the W3-early account (4 starters, 3 points, 1 slot each; only the Wizard Lv 73 reaches the Telescope; the Squire Lv 51 mines) / When the engine runs / Then the details hold "Squire Lv 51 (Mining): wear The Fuzzy Dice (…; it can change signs after about 7,500 kills to reach the Telescope) · after Chronus Cosmos: Dwarfo Beardus + Pack Mule", and "Wizard Lv 73 (Fighting): wear The Fuzzy Dice (wearing The Book Worm; swap next time it's at the Telescope) · after Chronus Cosmos: Pirate Booty + All Rounder"; nothing about a starter swap is a Next Action.
- Given the same account with the constellation Goals done and 21 points / When the engine runs / Then the Next Action is "On your Wizard Lv 73 at the Telescope: unlock Dwarfo Beardus, Hipster Logger, …, Chronus Cosmos (19 of your 21 points)" (one trip, FR-17.1), the only character that can reach it.
- Given a new Hunter at class level 12 fighting AFK on a starters-only account / When the engine runs / Then its line reads "Hunter Lv 12 (Fighting): wear The Fuzzy Dice · after Chronus Cosmos: Pirate Booty + All Rounder", and, before it existed, the details held "Next character: pick The Fuzzy Dice when you create it".
- Given an account with Chronus Cosmos unlocked where a character that reaches the Telescope wears only 1 sign / When the engine runs / Then the Next Action is "On your <class Lv>, at the Telescope: align <sign> in your empty slot".

**US-5 Spend points in a sensible order.** As a player, I want the next signs chosen for me, so that I reach a second and third slot fast.
- Given an account with Chronus Cosmos unlocked, 13 unlocked nodes and 2 points / When the engine runs / Then the milestone line reads "2 points ready, 18 needed for opening the Hydron chart" and the next sign is Pie Seas.
- Given an account with Chronus Cosmos unlocked and 24 nodes unlocked by another route / When the engine runs / Then the next sign is All Rounderi (leg 2 skipped, F-c).
- Given the chart-order list / When CI runs / Then every item's parent appears earlier in the list or is a starter (TR-3).

**US-6 Broken or partial data.** As a player, I want no star-sign advice from a broken read.
- Given a save whose `constellations` section failed / When the engine runs / Then no M16 Goal shows and the diagnostics hold `star-signs/constellations: unknown`.
- Given a synthetic save with a letter in `StarSignProg` for a slot that holds no character / When the engine runs / Then progress uses the letters' length (the game's rule) and no step is assigned to that slot.

## 5. Technical requirements

### TR-1 Package boundaries
Engine logic in `packages/engine/src/starsigns/` as pure functions (no I/O, clock or randomness): `telescope.ts` (F1), `constellations.ts` (FR-5–FR-13), `walkthrough.ts` (`WalkthroughView`s), `signs.ts` (FR-15–FR-19), `module.ts`. It imports types from `@idleon-forge/account-state`, compiled entries from `@idleon-forge/knowledge`, `MetaPathResult` from M2, `holdingsOf` and FR-18's predicate from M14 (`isMoveExcluded`, request X2). It never imports `toolbox-parsers`. The adapter part lives in `packages/account-state/src/starsigns.ts`. The engine step runs after M2 and M14's supply rates, before M10's merge.

### TR-2 Account State additions (M1 TR-11 growth; null when the section fails)
```ts
// AccountSummary
starSigns?: null | {
  unlocked: string[];                 // Toolbox account.starSigns[].starName where unlocked
  infinite: string[];                 // where isInfiniteStar
  pointsUnspent: number | null;       // raw OptLacc[40] (F-a); null when OptLacc fails
  telescopeQuestDone: boolean | null; // Telescope1 completed on any character (M8 FR-4's quest-status rule)
  constellations: Array<{
    name: string;                     // "A-1"
    rawIndex: number;                 // StarSignProg index (Toolbox constellations[].rawIndex)
    done: boolean;                    // Toolbox constellations[].done
    letterCount: number;              // completedChars.length, the game's progress count
    recorded: number[];               // slots decoded from the letters ('_' = 0, 'a' = 1, …; V4); unknown letters dropped
  }>;
};
// CharacterState
starSigns?: string[] | null;          // Toolbox characters[].starSigns[].starName (aligned, '_' dropped)
// npcDialog gains 'Telescope' (GATE_NPCS in account-state/src/types.ts, request X1)
// door kills: the raw KillsLeft2Advance the reachability rule already reads (M14 TR-3)
// Time Candies and boss keys: storageItems / inventoryItems via holdingsOf (no new field)
```
The raw letters string is not kept in the Account State, only its length and the decoded slots. About 2 KB on both fixtures.

### TR-3 Fact tables (ADR 0007)
| id | Origin | Contents | Source |
|---|---|---|---|
| `star-signs.fact.constellations` | authored tier 1, CI-checked | per W1–W3 constellation: name, `rawIndex`, `mapIndex`, world, type, `min`/`max` (class range, level, hours), `players`, `points`, kind hint (task or challenge for type 4), the plain-words challenge, the enter requirement (key rawName or ticket), the wiki anchor | `N.js` `na.StarQuests` and the `ProgressStarsign` call sites (V3); wiki Star Signs (tier 2) |
| `star-signs.fact.chart` | authored tier 1, CI-checked | per chart node 0–63: sign name, parent node, cost, chart | `N.js` `SSignInfoUI`; wiki Star Signs chart (tier 2) |
| `star-signs.fact.rules` | authored tier 1 | the 24- and 58-node chart gates (F-c), slots (F-d), Telescope-only alignment (F-e), the tree route (F-f), the account-wide hand-in (F-k), the candy limits (F-h) | `N.js` offsets in section 11 |

**CI** (M11 TR-10 style), every parser sync: each constellation row's `mapIndex`, `points`, `players` and **requirement text** equal Toolbox `constellations` at the pin (the text carries the hours, levels and class line, so a changed number fails); each chart node's sign, cost and `tree` equal Toolbox `starSigns`; `chart-order` is parent-first; the route doors equal `maps.fact.maps`. The parent tree itself has no Toolbox copy: it is an authored tier-1 fact re-verified by M11's staleness pass on every major patch (the N.js offsets are in its Source), like M14's printer rules. A row Toolbox adds that has no fact is ignored (fail closed).

### TR-4 Entries (#11 shape; **A** authored)
| Entry id | Type | Detector | A/G | Position | Notes |
|---|---|---|---|---|---|
| `star-signs.goal.telescope` | goal | `star-signs/telescope` (engine) | A | 3f | FR-1–FR-4 |
| `star-signs.goal.constellation` | goal (family, instance key `@<name>`) | `star-signs/constellations` (engine) | A | 3f | FR-5–FR-14 |
| `star-signs.goal.signs` | goal | `star-signs/signs` (engine) | A | 3f | FR-15–FR-19 |
| `star-signs.check.activeplay-challenge` | check (`activePlay: true`) | `star-signs/constellations` | A | "If you have time" | FR-13 |
| `star-signs.priority.chart-order` | priority (`list: order`) | — | A | — | FR-15 |
| `star-signs.priority.fit-fighting`, `-mining`, `-choppin`, `-fishing`, `-catching` | priority (`list: order`) | — | A | — | FR-16 |
| `values.maxM16Goals` 2, `maxCandyHours` 4, `levelGap` 5, `maxChallenges` 1, `talkSeconds` 180, `visitSeconds` 180, `claimSeconds` 60, `candySeconds` 60 | values | — | A | — | judgment (D-2, D-4), reviewed in the KB PR |

Templates have no free-text string slots (M11 FR-27): map, sign, class and activity are lookups.

### TR-5 Effort (ADR 0005: arithmetic on authored values and Toolbox rates)
`effortSeconds` of a constellation Goal = Σ over its not-done steps: `talkSeconds` per talk; `visitSeconds` per visit or task (a round trip: there, click, back); `visitSeconds + candySeconds` per candy step; `visitSeconds + claimSeconds` per claim. F1's open step: kills left ÷ Toolbox `finalKillsPerHour` on that map for the opener (M14 TR-3), "about … on average"; with no rate, the kills only. Rendered with M10's duration format. Phase 2 AFK jobs cost `{ unit: 'hours', amount: H }`.

### TR-6 Walkthrough reuse
M16 fills M10's `WalkthroughView` directly (`targetId`, `collapsed`, `steps` with `subject`, `progress` and `text`, `tree` as indented gate lines, `otherWays` for the challenge alternative, `caveats`), without M14's item expander: a constellation is a party of characters, not an item tree. No M14 type changes. Holdings of `Timecandy1…3`, `Key1` and `Key2` come from `holdingsOf` (M14 TR-11), so storage and bags are counted once.

### TR-7 Performance
Engine step ≤ 5 ms for 11 characters. The worker adds at most 3 tree maps to M14's supply-map set per character that has not opened them (inside M14 TR-8's 150 ms budget, measured in the build PR). Facts add ≤ 15 KB gzipped to the compiled Knowledge Base.

### TR-8 Storage, security and privacy
M16 stores nothing; dismissals are M10's (`star-signs.goal.constellation@A-1`). Report this sends M13's `ReportContext` with the entry id and instance only. Nothing leaves the device. Tests use synthetic letter strings, never fixture strings.

### TR-9 Sources and links
The Constellation Locations anchors (`#A-1` … `#C-8`) are checked to exist by the weekly wiki-link check (M14 TR-9); a missing anchor falls back to the page, never to a GitHub link.

### TR-10 Tests
Detector and engine tests per user story on both private fixtures (local) and the scrubbed and public fixtures (CI); the letter decoder on synthetic strings (`'_cb'` → [0, 3, 2]); chart-order parent-first; the Hydron-gate count on a synthetic 24-node set; the candy chooser (a 4-hour candy is kept when 2-hour ones cover the star); the comparator order of two equal-cost constellation Goals; goldens for both scrubbed fixtures.

## 6. States and edge cases

| State | Behaviour |
|---|---|
| Loading, offline, multiple tabs, second account | M10's states; M16 adds nothing |
| Broken parse / `EmptyAccountError` | No M16 output (FR-20) |
| `starSigns` or `constellations` section failed | Detector `unknown`; no Goal; diagnostics line |
| `supplyRates` unavailable | Reach unknown: "if you can reach it", nothing claimed done; F1's open step shows kills without hours (FR-0, TR-5) |
| Stale patch / parser behind | M1 banner; TR-3's CI catches changed constellation or chart data in the sync PR |
| A letter for a slot with no character | Counts toward the letters' length, never assigned a step (US-6) |
| Fewer characters than `players` | Not a candidate; C-6 (9) is hidden on 6-character accounts |
| Character created after the hand-in | Has no Telescope dialogue (V9): it gets a talk step before any click, or is not assigned when it cannot reach the Telescope |
| Lab or Cooking character | Never given a candy step; never moved to open the tree (M14 FR-18) |
| No Time Candy, or only 12 h+ or random candies | The candy kind does not apply (D-4); the star drops to afk-hours (Later) |
| Candy in a bag vs storage | Smallest covering candy first, the assigned character's bag before storage (FR-9) |
| Boss key held as an item vs already redeemed | `holdingsOf('Key1')` / `Key2` counts items; redeemed account keys come from M6's boss-key field when present, else "check in game" |
| Bag full for the quest hand-in | F1's step says "free 2 bag slots first" (F-k) |
| Infinite Stars present (W4+) | Infinite signs skipped (FR-19); `coverage: 'beyond'` → no F3 |
| Hydron chart already open by another route | Leg 2 skipped (FR-15, US-5) |
| Skip today / Not for me | Keys per instance; the next candidate fills the cap next run |
| A constellation done between saves | Done this session (FR-14); the next candidate fills the cap |

## 7. Dependencies and cross-module requests

| Module | What M16 uses | Interface or request |
|---|---|---|
| **M1** | Account State, `lastPlayedCharacterIndex`, `afkType`, diagnostics | TR-2 growth through M1 TR-11 |
| **M2** | Stage, `STAGE_DEFINITIONS`, `currentWorld`, Roles, pusher, `compareGoals`, the next-character Goal | **X1:** add `'Telescope'` to `GATE_NPCS` (`packages/account-state/src/types.ts`; the separate list in `knowledge/generators/quests.gen.ts` is the gate chain's and stays as is). **X4:** in `metapath.priority.free-value-fills`, replace the 3f "Not covered yet" note with the three M16 Goal ids |
| **M10** | `Goal.walkthrough`, "If you have time", "Not covered yet", duration format, caps | unchanged; the README's "Not covered yet" keeps only W4+ constellations and Infinite Stars |
| **M11** | schema (goal families, `list: order`, values), fact tables, CI | TR-3's cross-check is a new kb test, no schema change |
| **M14** | `holdingsOf`, `supplyRates.reachable`, kill rates, FR-18's exclusions | **X2:** export FR-18's predicate as `isMoveExcluded(c, ctx)`. **X3:** add the three tree maps (The Base of the Bark, Jungle Perimeter's door map, Hollowed Trunk) to the supply-map set for characters that have not opened them. Phase 2: job kinds `afk-hours` and door kills (FR-12) |
| **M6** | boss-key and ticket counts when present | read-only |

## 8. Owner review (self-ruled; the owner was asleep)

Each question was ruled by the author with the recommendation below, so the build can start; each is also one line under "Star Signs" in the batched review queue. The owner confirms or overturns in the review release.

- **D-1 Module home.** Options: M8 Collections, M9 Builds, a split like M15, or a new module. ➡️ **New small module M16**, own folders. *Why:* the System spans an account-wide chart, per-character alignment and party Walkthroughs; M8 and M9 are built and owned by other agents; splitting would scatter one System's rules over three folders. M16 asks three small changes of M2 and M14 (section 7).
- **D-2 How many M16 Goals at once.** ➡️ **At most 2 Account Goals from M16 in total** (constellations first, quickest; the Star Signs Goal counts only when it has a Next Action); the rest as "Also ready" details. *Why:* the Account section shows 5 Goals (M10 FR-16), all M16 Goals sit at position 3 with small costs, and three would crowd out Refinery and Construction fills.
- **D-3 Which constellations are Goals.** ➡️ **Claim, visit, task, level-click and candy kinds** are Goals; AFK-hours ones are "Later" details until M14's planner takes them (Phase 2); fight-skill challenges (boss timers, colosseums, waves, clear-before-respawn) are "If you have time" only. *Why:* the first five take minutes and are certain; moving a character for 4–16 h competes with its Purpose, which only the planner judges; challenges depend on fight skill ActiveOn cannot predict (ADR 0005).
- **D-4 Time Candy.** ➡️ Only the 1, 2 and 4-hour candies, the smallest that covers the star, never the random or 12 h+ ones. *Why:* small candies are common and low value; the big ones are worth more as catch-up.
- **D-5 Chart order.** ➡️ **Chronus Cosmos (19) → the 11 cheapest signs that open the Hydron chart (18), including the four +8-stat signs → Hydron Cosmos (14) → fit signs.** *Why:* game code opens chart 2 at 24 unlocked nodes (F-c), so the 1-point stat signs the wiki calls "skip" are the cheapest route to the third slot; game data wins (ADR 0004). This also corrects the dossier's "3 points to Chronus Cosmos".
- **D-6 Starter signs.** ➡️ **The Fuzzy Dice on every character while only starters exist**, and at character creation; a starter-to-starter swap is a detail, never a Next Action. *Why:* +3 talent points help any build and any new character; the alternatives are +1% or +3 of a stat; a trip up the tree is not worth that.
- **D-7 Fit lists.** ➡️ Fighting: Silly Snoozer, Pirate Booty, All Rounder, Fatty Doodoo, The Fallen Titan, Gum Drop. Each skill: its own sign, then The Big Comatose, The OG Skiller, Sir Savvy, Pack Mule. One fighting list for pushers and AFK fighters. Never The Forsaken (−80% HP) or Mr No Sleep (−6% AFK gain). *Why:* AFK gain and drop rate are what an AFK Stretch earns; skill signs give +5% efficiency and +20% multi-drop (Toolbox `starSigns`); community: "pick what fits best for each character at the time" (Reddit 1v7nja9).
- **D-8 Activity or Role.** ➡️ The **current AFK Target** picks the list; the first active Role only when there is no AFK Target. *Why:* a sign only helps what the character does now.
- **D-9 Rank.** ➡️ All M16 Goals at **position 3f**, `compounding`, `banked`, quickest first by the shared comparator. *Why:* the Leverage model put constellations at 3f; points never expire.
- **D-10 Telescope dialogue.** ➡️ Treat it as **account-wide after the quest hand-in**, per character only for characters created later. *Why:* the hand-in is an `AccountWideQuests` entry that sets every character's dialogue (F-k); the W3-early save shows all 6 characters with it though 5 never entered the tree.
- **D-11 Challenge candidates.** ➡️ Name "your highest-level character not yet recorded", labelled as such; no time prediction. *Why:* no Toolbox number predicts a 20-second boss kill.
- **D-12 Stage gating.** ➡️ World ≤ both the Stage's world and `currentWorld`; never D+ before W4-entry; hide stars needing more characters than the account has, a class line it lacks, or levels nobody is near. *Why:* P2, and the owner's "don't show W4+ constellations to a W3-early account".
- **D-13 Opening the tree.** ➡️ F1 sends **one** character up the tree (the closest one M14 FR-18 allows) as a Next Action; for the others, Phase 1 only says how many kills each needs to change its own signs. *Why:* one opener unlocks constellations and the chart for the whole account; ~7,500 kills per extra character is worth it only after Chronus Cosmos gives two real signs, and choosing who should spend an AFK Stretch on it is the planner's call (Phase 2).
- **D-14 One trip for unlocks.** ➡️ Unlock only when the banked points finish the current leg or no more points are coming this session; then unlock everything the points buy at once. *Why:* only characters that reached the top of the tree can unlock, and each trip costs minutes.

## 9. Red-team notes (author's own pass)

1. **Wrong milestone cost.** The dossier said Chronus Cosmos costs 3. *Defence:* F-b from `SSignInfoUI`; tests pin 19 from the fact table; chart order is parent-first in CI.
2. **Sending a player to a Telescope he cannot reach.** *Defence:* F-f and FR-0: alignment and unlocks name only characters that reach it; F1 opens the way first.
3. **"Claim" missing.** Event constellations with enough characters still pay nothing. *Defence:* the claim kind (FR-6).
4. **Pulling the pusher off its push.** *Defence:* FR-2 and FR-9 prefer free characters (M14 FR-18); visits are round trips; AFK-hours wait for the planner (D-3).
5. **Noise.** *Defence:* at most 2 M16 Goals (D-2), one signs line with details (#70 A5), starter swaps never a Next Action (D-6).
6. **Patch day.** *Defence:* TR-3's CI on numbers and requirement text; new rows ignored; the parent tree re-verified on majors.
7. **Spending a valuable candy.** *Defence:* D-4 and FR-9's smallest-first rule.
8. **A negative sign recommended.** *Defence:* D-7's exclusions; Fatty Doodoo's −3% move speed is the only minus, ranked 4th.
9. **Privacy.** *Defence:* indices only; the letters string is not kept (TR-2); synthetic test strings (TR-8).

## 10. Red-team log

An independent reviewer (no access to the author's reasoning) checked the first draft against `N.js`, Toolbox data, the engine code and both private saves: 22 findings (2 P0, 3 P1, 11 P2, 6 P3). The author re-checked each against the evidence before ruling.

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| 1 | P0 | The Telescope sits behind ~10,500 tree kills; almost no character can reach it, so "about 6 minutes" and every alignment step were impossible | fixed | Confirmed in `maps.fact.maps` (3,000 / 2,500 / 5,000 doors) and both saves (1 of 11 characters). New F-f, FR-0, FR-2–FR-3 open step, FR-17 names only characters that reach it, FR-18 kills line, D-13, X3 |
| 2 | P0 | Handing in the Telescope quest gives every character the dialogue; the draft never handed it in and asked for per-character talks | fixed | Confirmed `AccountWideQuests` `Telescope4` flag 0 → `NPCdialogue = 9999` on others (@6172997). F-k, FR-1 gates on the hand-in, FR-3 step 4, D-10 reversed |
| 3 | P1 | The challenge candidate named a character already recorded on A-9 | fixed | FR-13 and US-3: highest level **not yet recorded** |
| 4 | P1 | US-2's display order could not come from the shared comparator (equal cost falls to entry id) | fixed | FR-7 splits selection (M16) from display order (comparator); US-2 now expects A-7 first |
| 5 | P1 | A candy changes where the character is AFK; Lab and Cooking characters cannot use one | fixed | F-h candy limits (@8201286, @5580046); candy steps end "go back to <AFK Target>"; no candy steps for Lab/Cooking |
| 6 | P2 | Candy choice could burn a 4-hour candy on a 2-hour star; candy items not listed | fixed | FR-6 lists `Timecandy1–3`; FR-9 smallest covering first; TR-10 test |
| 7 | P2 | Some "challenges" are plain tasks, and challenges ignored reach (A-5's map is unopened on both saves) | fixed | New task kind (C-2, C-3, C-8); FR-13 needs a reachable map; A-5 hidden on both fixtures |
| 8 | P2 | The milestone line mixed unspent points with from-scratch costs | fixed | FR-15 remaining cost per leg; FR-18 and US-5 reworded |
| 9 | P2 | The chart order ignored a Hydron chart opened by other purchases | fixed | FR-15 counts unlocked nodes and skips leg 2; US-5 case |
| 10 | P2 | CI missed hours, levels, class ranges, types and the parent tree | fixed | TR-3 also checks requirement text and `tree`; parents re-verified by the staleness pass |
| 11 | P2 | Reach rule differed from M14's for skilling maps | fixed | FR-0 adopts M14's rule exactly |
| 12 | P2 | B-6 needs Efaunt's key, keys need a withdraw step, claims should prefer recorded characters | fixed | FR-6 and FR-8 |
| 13 | P2 | The level-gap line hid that more characters are needed | fixed | FR-11 shows it only when every missing character is within the gap |
| 14 | P2 | The unlock action named no one and spent points one sign at a time | fixed | FR-17.1 names a character at the Telescope and batches (D-14) |
| 15 | P2 | M16 could take 3 of the 5 Account slots | fixed | D-2: at most 2 M16 Goals in total |
| 16 | P2 | The spec quoted private data beyond class and level | fixed in part | Worn signs, letters, storage and key counts removed or turned into aggregates; synthetic test strings; the raw letters are not kept in the Account State. Class, level, activity and kills-left aggregates stay, as in M14 and M15 |
| 17 | P3 | Efforts ignored the trip back and preferred busy high-level characters | fixed | `visitSeconds` is a round trip (180 s); FR-9 prefers free characters |
| 18 | P3 | Challenges had no time estimate; "never a Goal" clashed with the glossary | fixed | "a few minutes per try"; "never ranks among Goals" |
| 19 | P3 | "after Chronus Cosmos" disagreed with the stories about Pie Seas | fixed | FR-18 adds "<sign> once unlocked"; stories aligned |
| 20 | P3 | Name tie-break sorted A-10 before A-2 | fixed | natural order (FR-7) |
| 21 | P3 | Wrong cross-module targets (`GATE_NPCS` file; `WalkthroughView` has no kind) | fixed | X1 names `types.ts`; TR-6 fills `WalkthroughView` as is, so the old M14 type request was dropped |
| 22 | P3 | Status claimed a red-team that wasn't there yet; glossary words "phase" and "job"; A-10 and B-2 missing; null `supplyRates` undefined | fixed | Status updated; chart "legs"; "job" only as M14's term; section 11 lists the Mage stars; FR-0 and section 6 cover `unavailable` |

Counts: P0 2 fixed; P1 3 fixed; P2 10 fixed, 1 fixed in part; P3 6 fixed. None rejected; none deferred.

## 11. Worked examples (private fixtures, by class and level)

Read on 2026-10-17 by local scripts over `fixtures/private/*` (not committed). Reach uses M14's rule over `maps.fact.maps` and the saves' door kills.

### 11.1 W2-late account
- **State:** 4 starters, 0 points, 1 slot each, 3 of 5 already wearing The Fuzzy Dice. Nobody has the Telescope dialogue or has opened Where the Branches End: the Barbarian Lv 60 has about 5,000 kills left at Hollowed Trunk; the other four about 7,500 (The Base of the Bark, then Hollowed Trunk). A-9 already has 4 characters recorded, unclaimed. Small Time Candies and Forest Villa Keys are in storage.
- **Now:** F1 only. The opener is the closest character M14 FR-18 does not exclude: the Barbarian Lv 60 (about 5,000 kills) unless M2 makes it the pusher on its push, in which case one of the four at about 7,500 kills, the one with the best kill rate there. The golden pins which.
- **After the hand-in:** A-2 3 points (1-hour candy), then ready A-9 claim 5, B-4 Slamabam Straightaway on 4 (5), B-1 The Mimic Hole on 3 (4), A-1 Blunder Hills town on 4 (3), A-3 Valley of the Beans on 4 (3), A-7 Winding Willows 2 h on 2 with two-hour candies (3): **26 points**, Chronus Cosmos (19) plus Pie Seas, Shoe Fly and The Fallen Titan. The quest also pays 2 two-hour and 2 four-hour candies.
- **Not yet:** A-4 (only one character has opened Tucked Away), A-6 (no Archer-line character has opened Freefall Caverns), A-10 and B-2 (Mage stars: neither mage has opened Echoing Egress or Faraway Piers; the details name the doors), B-8 (nobody at Lv 65). Later: B-3 and B-7 (4 h and 8 h). Hidden: A-5 (The Office unopened), B-6 (no Beginner-line character), every C row (`currentWorld` 2).
- **Signs:** everyone The Fuzzy Dice now. After Chronus Cosmos the four fighting characters Pirate Booty + All Rounder and the Squire Lv 43 (Mining) Dwarfo Beardus + Pack Mule, each line noting the kills its character needs to reach the Telescope.

### 11.2 W3-early account
- **State:** 4 starters, 3 points banked, 1 slot each. The quest is handed in, so all 6 characters have the dialogue; only the Wizard Lv 73 has opened the tree (the other five need about 7,500–7,600 kills). Unfinished progress on A-8, A-9, B-3, B-5, B-7 and C-2.
- **Constellation Goals (2):** A-7 Winding Willows 2 h on 2 with two-hour candies (3 points) and B-1 The Mimic Hole on 3 (4), both about 6 min, A-7 first by entry id.
- **Also ready:** B-4 Slamabam on 4 (5), A-1 Blunder Hills on 4 (3), A-3 Valley of the Beans on 4 (3). Ready total 18 + 3 banked = **21 ≥ 19: Chronus Cosmos this session**, unlocked in one trip by the Wizard Lv 73.
- **Task (later this session):** C-2 (barehanded Sheepie) needs 2 more characters; its kind is task when two non-recorded characters reach Steep Sheep Ledge (only one does today: Later).
- **Later:** B-3 (2 more, 4 h; it becomes a candy Goal when two 4-hour candies are held), B-7 (2 more, 8 h), C-4 (16 h on 3), B-8 (the Bowman Lv 60 is 5 levels short, but a fourth character is not near: not shown). Hidden: C-1 (nobody Lv 90), C-6 (9 characters), C-7 (nobody reaches Crystal Basecamp), A-5 (The Office unopened). Challenge: A-9, 1 more character under 20 s, "try with your Bowman Lv 60", the highest-level character not yet recorded.
- **Star Signs line:** an info line now ("Bank your points: after A-7 and B-1 you can unlock up to Pack Mule in one trip"); per-character lines: everyone The Fuzzy Dice now; after Chronus Cosmos the four fighting characters Pirate Booty + All Rounder, the Squire Lv 51 (Mining) Dwarfo Beardus + Pack Mule, the Barbarian Lv 56 (Fishing) Pack Mule + The Fuzzy Dice, "Pie Seas once unlocked". Only the Wizard can change signs today; the other five lines carry their kills-to-Telescope note.

### 11.3 Verify results (settled before build)
- **V1 Chart tree and costs:** `SSignInfoUI` dumped; costs match Toolbox `starSigns` on all 64 nodes; the leg sums are 19, 18 and 14.
- **V2 Unlock rule:** buyable only when the parent's sign is unlocked; needs `OLA[40] ≥ cost` (@7552743, @7681006).
- **V3 Constellation events:** A-5 `poopBig` (@4576730), A-8 / B-5 colosseum (@5512156), A-9 `_BossKillTimer < 20` (@4794885), B-6 `CharacterClass < 5` (@4805580), C-2 weapon slot `Blank` on `sheep` (@4583483), C-3 Trapping ≥ 15 on entering (@23789763), C-5 wave ≥ 11 (@7693874), C-8 `skele2` (@4584366), AFK claims (@5579936), clicks (@9731251).
- **V4 Letters:** `Number2Letter` is indexed by slot with images offset by one (`Number2Letter[tab + 1]`, @7679874), and the W3-early save records A-2 on slot 0 as `_` (its quest status is set only there): `_` = slot 0, `a` = slot 1. The build asserts the decoder on both fixtures.
- **V5 Telescope-only alignment:** menu 24 opens only on map 31 at the Telescope (@5315002).
- **V6 Second slot:** unlocking Chronus Cosmos appends an empty slot to the playing character's list (@7553600); slot counts use the account rule (F-d).
- **V7 Settled (build, 2026-10-18):** no. The colosseum menu is the only way in; it needs and spends `ColosseumInfo[n][3]` tickets (1 for Dewdrop, A-8; 2 for Sandstone, B-5) before it switches scene (N.js @5497170, `ColosseumInfo` @14032574). A claim step says "spend 1 Colosseum Ticket to enter".
- **V8 Hydron gate:** chart 2 needs more than 23 unlocked nodes among the first 64 (@7554573).
- **V9 Settled (build, 2026-10-18):** yes. `_customEvent_NewCharStuffs` (@19908843) gives a new character every account-wide quest that slot 0 has completed, with `NPCdialogue = 9999`, and a load pass (@19867677) syncs them across characters. FR-8's talk step stays as a guard and fires only when a save shows a character without the dialogue.
- **V10 Tree route:** doors 3,000 / 2,500 / 5,000 in `maps.fact.maps`; KillsLeft per character on both saves.
- **V11 Candy limits:** refused for Lab, Cooking and no AFK Target, on non-AFK maps and while moving (@8201286); credits the current map (@5580046).

### 11.4 Build notes (Phase 1, 2026-10-18)
- **Account State is compact** (M1 TR-16's 300 KB cap): signs are game StarSigns ids, constellations are `claimed` plus `progress` (unclaimed with letters), the tree route is three numbers. `star-signs.fact.chart` maps ids to names.
- **Chart order and fit lists live on `star-signs.goal.signs` as comma lists**, not Priority Lists: a Priority List holds entry ids, and signs are not entries. CI checks them parent-first, the leg costs (19, 18, 14) and the 24-node gate.
- **Kills to the Telescope** count all three doors. On the fixtures the four W2-late characters off the tree need about 7,500 (the Wizard Lv 56) or about 10,400 (Jungle Perimeter's door still shut), and the W3-early five about 10,300–10,500; the 7,500–7,600 above left out Jungle Perimeter's door.
- **W2-late opener:** the Barbarian Lv 60 (about 4,990 kills) is M2's pusher, so FR-2 picks the Wizard Lv 56 (2,500 at The Base of the Bark, then 5,000), with its kill rate from the tree maps (X3).
- **One trip buys everything the points cover** (D-14): with 21 points after the constellations the Wizard Lv 73 unlocks through Chronus Cosmos and Pie Seas, not stopping at 19. The "Bank your points" line counts banked points too (W3-early: "up to All Rounder").
- **C-3** (Trapping 15 on 5) is never a task yet: Trapping level is not in the Account State.
- **Effort** is 3 min per visit, plus 1 per candy or claim: W3-early's A-7 is about 8 min, B-1 about 9.

## 12. Phased build plan

| Phase | Ships |
|---|---|
| **1** (README step 8c, after M14 Phase 1 and M15 Phase 1) | Facts and CI cross-check; Account State fields; X1–X4; F1 with the open step; F2 claim, visit, task, level and candy kinds with Walkthroughs; F3 with chart legs 1–4 and the five fit lists; F4 |
| **2** (after M14 Phases 2–3) | AFK-hours constellations and tree doors as M14 jobs (FR-12); Hydron fit signs per Role; bigger candies by owner choice |
| **3** (with a W4 spec) | D constellations, Infinite Stars, Silkrode Nanochip, Seraph |

## Sources

- Game code: [`N.js`](https://www.legendsofidleon.com/ytGl5oc/N.js), read 2026-10-17 at game 2.3.540 (`na.StarQuests`, `SSignInfoUI`, `_customBlock_ProgressStarsign`, `AccountWideQuests`, the Star Sign screen and candy handlers; offsets in section 11) (tier 1).
- IdleOn Toolbox at `6c37e3d`: `parsers/starSigns.ts`, `parsers/character.ts` (`starSigns`), `utility/dashboard/characters.js` (`starSignsAlerts`), `data/website-data/shared-data.json` (`starSigns`, `constellations`, map doors), `quests.json` ("Telescope"), `items.json` (Time Candy, boss keys) (tier 1).
- IdleOn Wiki: [Star Signs](https://idleon.wiki/wiki/Star_Signs) (edited 2026-10-05), [Telescope](https://idleon.wiki/wiki/Telescope) (2026-09-27), [Constellation Locations](https://idleon.wiki/wiki/Constellation_Locations) (2024-08-17), [Amarok](https://idleon.wiki/wiki/Amarok) (boss keys) (tier 2 / 4).
- Reddit r/idleon: [1v7nja9](https://www.reddit.com/r/idleon/comments/1v7nja9/) "Which star signs should I align in which situations?" (2026-07-27); [1pxfpp2](https://www.reddit.com/r/idleon/comments/1pxfpp2/) "Star Sign quick ref?" (2025-12-28); [1s6hn93](https://www.reddit.com/r/idleon/comments/1s6hn93/) "Constellation Question" (2026-03-29) (tier 4).
- Repo research: `research/character-builds` Star signs section (corrected by F-b, F-c); `research/skills` (skill stats and signs); `research/leverage-model` fill 3f; `research/priority-verification` 1.6.
