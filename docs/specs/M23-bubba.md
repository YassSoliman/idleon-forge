# M23 Bubba

Spec for the owner's request of 2026-10-18 ("would be epic"): a module for **Bubba**, the third clicker, part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **ready for owner review**. An independent reviewer red-teamed it, and every confirmed P0, P1 and P2 is fixed (section 10). Three product questions are open for the owner (section 8.1). Every other question is self-ruled with research (section 8.2). Terms follow [`GLOSSARY.md`](../../GLOSSARY.md), and decisions follow [ADRs 0001–0009](../adr/).

**Why this exists.** Bubba is the only W3 System that pays seven permanent, account-wide bonuses (Construction Build Rate, Critters, Souls, Total Damage, All Kills, Class EXP, Atom Cost) from a screen most players open and forget. ActiveOn covers Orion and Poppy only as a "convert your fish" line (M6 FR-18), and doesn't cover Bubba at all. Both private fixtures show the gap:
- **W3-early account.** Bubba is running (Megaflesh 3, Boon level 11), but the Charisma Chart is training an attribute that is already at its maximum. At the save, more than 50 levels of Charisma XP are banked. The next Megaflesh, about 20 hours away, wipes them.
- **W2-late account.** Bubba is still locked.

The owner also allocates Charisma levels and sees them as bonuses on his account. Those levels only boost Bubba. The account bonuses come from Bubba Boon, multiplied by Megaflesh. The page has to make that difference obvious (FR-22).

**Decisions this spec rests on:**
- ADRs:
  - [0002](../adr/0002-deterministic-advice-ai-built-knowledge.md): deterministic advice.
  - [0004](../adr/0004-source-precedence.md): game data first, then the wiki, then guides.
  - [0005](../adr/0005-toolbox-numbers-not-our-formulas.md): Toolbox numbers plus arithmetic, no formulas of ours. The three numbers Toolbox doesn't compute are requested from the Toolbox fork (X1), and they are hidden until it lands.
  - [0006](../adr/0006-client-only-spa-parsing-in-a-worker.md): Toolbox runs only in the worker.
  - [0007](../adr/0007-generated-facts-authored-judgment.md): tables generated, order authored.
  - [0009](../adr/0009-game-art.md): our own pixel art.
- Owner rules:
  - [#74](https://github.com/YassSoliman/idleon-forge/issues/74): a player-readable Source on every entry.
  - [#70](https://github.com/YassSoliman/idleon-forge/issues/70) A5 and M21 DS-25: account-wide means one account Goal.
  - M15's principles P1–P7.
  - "Features need a home": every output is reachable from the Now screen in at most 2 taps, and the System page is the home.
  - M21's design system: DS-1 to DS-25, Phase F's atoms, and area S's page frame.
- The owner's brief for this module (2026-10-18):
  - production first;
  - discounts only when they pay back;
  - Boon to 7;
  - Megaflesh early;
  - Boon bonuses ranked by Stage;
  - Charisma Chart as a first-class part.

**Patch.** Game v1.23 (Toolbox gameVer 2.3.540), parser pin `6c37e3d` (`packages/toolbox-parsers/UPSTREAM`). Bubba shipped in v1.02 "Big Bubba" (2025-11-23). v1.03 (2025-11-29) reduced the cost scaling of several upgrades ([wiki Changelog/2025](https://idleon.wiki/wiki/Changelog/2025)). No later patch note changes Bubba's numbers. The one exception is a display fix for Chromatic Megaflesh, which the Toolbox data carries in `randomList`. Guides from before 2025-11-29 are Stale on costs. `N.js` (the client served on 2026-10-18, Last-Modified 2026-10-17, 26.4 MB, `https://www.legendsofidleon.com/ytGl5oc/N.js`) was read for every mechanic in section 3.0. Offsets are character offsets that shift every patch, so each offset is cited with its symbol: `_customBlock_Bubbastuff`, the `ActorEvents_713` window and `_customEvent_Bubbathings`.

**Fixtures.** Acceptance criteria name the two private fixtures by account only:
- the **W2-late account** (5 characters, `currentWorld` 2);
- the **W3-early account** (6 characters, `currentWorld` 3).

CI runs the same assertions on `fixtures/scrubbed/scrubbed-w2.json` and `scrubbed-w3.json`, which carry the same `Bubba` record. Toolbox's public `latest.json` and `highend.json` cover the late features (Smoker, emulsify, Spare Coins), and `fresh.json` covers the empty record. Values were read on 2026-10-18 by local scripts. The golden clock is the one the existing goldens use (W3-early: 2026-10-17 16:12:33 UTC, about 7 h 28 m after its save).

## 1. Purpose

Bubba the Chonky Seal runs a meat market in the Codex. It makes Meat Slices every second, even while you're away. You spend them on 28 upgrades, then you buy a **Megaflesh** that resets almost all of it for a permanent bonus. One upgrade, **Bubba Boon**, never resets, and each level adds a slice of seven bonuses that work everywhere in IdleOn. A player at a pause point wants a short answer: **"Is there anything in Bubba worth a minute right now?"** Is the Smoker at its best quality, is a Megaflesh ready, would a Boon level open a new account bonus, is the Charisma Chart training something that can't level any more, and is the hourly pat worth it right now? The player also wants a page that shows the whole thing: what Bubba already gives the account, what the next Megaflesh and Boon level buy, and when they'll be affordable. M23 gives the first as one account Goal with one Next Action. It gives the second as a Bubba System page. It reads only the save and never touches the game.

## 2. Scope / Out of scope

### Ownership (who builds what)

M23 is a **new small module** with its own folders.

| # | Feature | Folder that builds it | Entries and Detectors | Ships |
|---|---|---|---|---|
| F1 | **Bubba facts and Account State**: the fields, the unlock rule, the generated tables | `packages/account-state/src/bubba.ts`, `bubba-types.ts`; `packages/knowledge/generators/bubba.gen.ts` | `bubba.fact.upgrades`, `bubba.fact.megaflesh`, `bubba.fact.boon`, `bubba.fact.charisma`, `bubba.fact.gifts` (generated); `bubba.fact.unlock` (authored) | Phase 1 |
| F2 | **Unlock and start**: the System opens; the "not started" and "restart" Goals | `packages/knowledge/systems/bubba.yaml`, `detectors/bubba/` | `bubba.check.start`; Detectors `bubba/unlocked`, `bubba/start` | Phase 1 |
| F3 | **Run Checks**: Megaflesh, Boon, Smoker, pat then gift | same | `bubba.check.megaflesh`, `bubba.check.boon`, `bubba.check.smoker`, `bubba.check.pat-gift`; Detectors of the same names | Phase 1 |
| F4 | **Charisma Chart**: the idle-training Check, what the next level buys, the training order, emulsify | same, and `packages/engine/src/bubba/` | `bubba.check.charisma-idle`, `bubba.priority.charisma`; Detector `bubba/charisma-idle` | Phase 1 |
| F5 | **Priority Lists**: the run order and the Boon bonus ranking by Stage | `packages/knowledge/systems/bubba.yaml`, `metapath.yaml` (tier rows only) | `bubba.priority.run`, `bubba.priority.boon-bonuses` | Phase 1 |
| F6 | **One account Goal, Timeline bars** | `packages/engine/src/bubba/` | engine module `bubba` (groups F2–F4, emits `TimelineBar`s) | Phase 1 |
| F7 | **The Bubba System page** | `apps/activeon/src/bubba/` (lazy chunk) | none (views add no advice) | Phase 1 |
| F8 | Dice reroll timing, gift picks per Megaflesh, Spare Coins, the per-character offline rule (V-3), the Tome's Megaflesh row | same folders | added entries | Phase 2 |

### In scope

- The unlock rule, and the start of Bubba on an account that has it but has never bought 1st Slice.
- The post-reset stall: after a Megaflesh, 1st Slice is back at level 0 and Bubba makes nothing until it is bought again.
- Megaflesh, Bubba Boon, the Smoker, the hourly pats with Open Gift, and the Charisma Chart (training, maxed attributes, emulsify).
- The run order: which upgrades come first, and when a discount pays back. It is a page order, not a Now Goal per upgrade (D-4).
- Bubba's seven account bonuses: what they are now, which one the next Boon level adds, and how much each matters at the player's Stage.
- The System page, the Timeline bars and the hub tile.

### Out of scope (and who owns it)

- **Orion and Poppy.** M6 FR-18 keeps Poppy. Orion stays "not covered yet" (M6 D6). A shared "Clickers" page is Phase 2 of whichever module covers Orion (D-11).
- **Writing to the game or automating clicks.** Never (AGENTS.md). Every line tells the player what to tap.
- **Funny 2hr Slice** (the Time Candy item that resets happiness) and the Menagerie's Bubba Cheapener (W7). They're shown in the cost breakdown only as Toolbox includes them.
- **The Daily & Weekly Checklist.** Nothing in Bubba resets daily or weekly. The pats and the Dice Roll price reset hourly, which would distort the today ring (M20 FR-6). M23 adds no rows (D-6).
- **The Tome's Megaflesh row** (Tome entry 108, W4). Phase 2, with whatever covers the Tome.

## 3. Functional requirements

### 3.0 Facts settled for this spec (from N.js and Toolbox)

These are game facts, not judgment. Each one is tier 1 provenance, and the player-readable Source is the wiki page where it agrees (FR-27).

- **F-a Unlock.** `Bubbastuff("BubbaUnlocked") = KillsLeft2Advance[50][0] <= 0` (N.js @11150786). Map 50 is **YumYum Grotto**, and its door 0 leads to map 100, **Frostbite Tundra**, the W3 town (Toolbox `mapPortalDestinations[50] = [100, 51, 0]`). So Bubba opens for a character once **that character** has gone through the door from YumYum Grotto into World 3. You open it in the Codex, where Orion is (wiki Changelog v1.02: "Find them in your Codex, where Orion normally is!"; Steam thread 2025-11-24: "after i beat W2 Boss and Enter W3 i got instantly Baba in my Codex"). The rule is per character because `KillsLeft2Advance` is the logged-in character's KLA. ActiveOn already stores it as `characters[].doorKillsLeft` (M21 FR-F10). The W3-early account has 0 left on all 6 characters, and the W2-late account has 1 left on all 5.
- **F-b Production.** Toolbox `bubba.meatsliceRate` is **per minute** (`60 × MeatsliceRate`). Meat is added every second the game runs, but only once 1st Slice is above level 0 (`runPeriodically(1000)`, N.js @13089703). Away time is added at the same rate on login (`AFKcode("Forge", b)` branch, N.js @5027621, gated on `BubbaUnlocked`). Projected meat at `now` = `meatSlices + meatsliceRate / 60 × max(0, now − lastCloudSave) / 1000`, which is Toolbox's own timer arithmetic (`Etc.jsx` L51). Any cap on the away seconds is V-1.
- **F-c Upgrades.** There are 28 (`bubbaUpgrades`). An upgrade type opens once the meat produced this run (`bubba.progress`, raw `[0][4]`) reaches `MeatProdREQ(t)`. Toolbox gives `totalUpgTypesAvailable`, each upgrade's `level`, `prestige` (free levels that don't raise the cost), `cost` and `bonus`. Costs are game-exact (Toolbox's `live-verified-bubba.test.js` matches all 28 against the running game).
- **F-d What Megaflesh resets.** Buying Megaflesh (`_customEvent_Bubbathings`, `DN5 == 8`, N.js @13074365) does these things:
  - sets every upgrade to level 0 **except Bubba Boon (3), Megaflesh (8) and Fun Gifts (9)**;
  - sets every prestige to 0;
  - sets meat to 1 (**leftover meat is lost**);
  - clears happiness, gift picks, meat produced, pats used (to −50 with Megaflesh 8), the Charisma selection, **Charisma XP**, emulsify, Spare Coins, **all six Charisma levels**, the dice and the smoked meats.

  It keeps the pat timer `[0][13]` and the Smoker timer `[0][14]`. So the research claim that Boon is "the only upgrade that never resets" is wrong: Megaflesh and Fun Gifts persist too.
- **F-e Megaflesh tiers.** There are 12 rows (`generalSpelunky[38]`, names `[42]`). Rows 1–11 are bought once each. Row 12, Chromatic, stacks once per Megaflesh past 11 (`MegafleshOwned(11) = MF − 11`). Its effects in order:
  1. +1% Meat per total upgrade level;
  2. account bonuses ×1.20;
  3. pick 2 gifts;
  4. account bonuses ×1.40;
  5. +1 die, +5 sides, and worse rerolls are ignored;
  6. emulsify;
  7. account bonuses ×1.60;
  8. start each run with 50 pats;
  9. 70% chance of a free Smoker level;
  10. account bonuses ×1.80;
  11. double odds for Dollars, Quarters and Nickels;
  12. account bonuses ×(2 + (MF − 12)/5).

  The multiplier is `1 + 20 × (rows 2, 4, 7, 10 owned + the Chromatic count)/100` (Toolbox `getBubbaBonuses`). The Megaflesh 9 text says 75%, but the code rolls `.7 > random` (N.js @13078120), so M23 prints the game's own text and never the number.
- **F-f Bubba Boon.** Upgrade index 3 costs `(16·L + 3.22^3 · 10^L) × x1` before discounts, so **each level costs about 10× the last**. Bonus `i` (1 = Build Rate … 7 = Atom Cost) has `ceil((L − (i − 1))/7)` stacks, each worth `generalSpelunky[33][i]` (10, 5, 5, 15, 1, 4, 3 %), × the Megaflesh multiplier × (1 + companion 51). So levels 1 to 7 each **open one new bonus**, and level `L + 1` always adds one stack of bonus `(L mod 7) + 1`. The player can't choose which. Toolbox gives each bonus's current total (`bubba.bonuses`). It is read by `character.ts` (Build Rate, Class EXP), `damage.ts` (Total Damage, All Kills), `worship.ts` (Souls) and `atomCollider.ts` (Atom Cost). Critter Gain has no reader in Toolbox at this pin (V-4).
- **F-g Charisma Chart (training, not points).**
  - **Unlock.** It opens with the Charisma upgrade (index 6), `T_FeatureUnlocked(1)`.
  - **Training.** The player **taps one attribute to train it**. Raw `[0][6]` is the selected attribute, 1-based, and 0 means none. XP `[0][8]` grows by `CharismaTraitSPD` per second, folded in from the pending seconds `[0][7]` whenever the Bubba window ticks (N.js @12950547). XP accrues whatever is selected.
  - **Levelling.** When XP ≥ `CharismaTraitREQ`, the selected attribute gains 1 level, but only below 120 (N.js @12952762; the panel says "Your selected Attribute (Hustle) is MAX LEVEL!"). It levels once per tick, so banked XP levels a newly selected attribute in quick succession.
  - **Cost.** `CharismaTraitREQ = 20 × (1 + T/20) × 1.03^T`, where **T is the total of all six levels** (N.js @11143888). Every level makes the next one dearer, **whichever attribute it goes into**. That is why picking is an allocation, and why the owner reads them as "stat points".
  - **Speed.** `CharismaTraitSPD = (1 + Charisma upgrade bonus/100) × (1 + Numbahs gift passive/100)`.
  - **Emulsify.** From Megaflesh 6, tapping the already-selected attribute emulsifies it: raw `[0][15]` = that attribute, and it gives 3× (N.js @12987760).
  - **Effects.** All six only change Bubba:
    - Hustle: +10% Meat per level, ×;
    - Rizz: −2% upgrade costs per level;
    - Joy: +5% happiness per level;
    - Courage: +1% dice luck per level;
    - Mindful: +0.1% chance of a free level per level (`DoubleLVchancePCT`);
    - Savvy: +1% chance of an extra Spare Coin per level (`SpareCoins_QTYfound`).

    Each is × (1 + Super Chart bonus/100), and × 3 when emulsified (`generalSpelunky[35–37]`, `CharismaBonus`, N.js @11144345).
  - **Coins.** Savvy's coins are **Bubba's Spare Coins** (pennies to dollars that multiply meat), not IdleOn coins.
  - **No account bonuses.** No Charisma attribute is read outside Bubba, in N.js or in Toolbox. Toolbox computes only Hustle, Rizz and Joy, and leaves out Courage, Mindful and Savvy.
  - **Reset.** **All six levels reset at every Megaflesh** (F-d).
- **F-h Pats.**
  - **Size.** Happi Boi (index 1) allows `DailyPetting = ceil(log2(max(1, RealLV₁)) + min(RealLV₁, 3))` pats per hour (N.js @11142898). Each pat adds `DailyPet_HappinessQTY` happiness, and raw `[0][5]` counts the pats used this hour.
  - **Refill.** When the pat timer `[0][13]` reaches 3600 s and the window ticks, `[0][5] = min([0][5], 0)`, Dice Roll's price resets (`[1][12] = 1`) and the timer restarts (N.js @12952360). The timer keeps counting while you're away (F-b), so after an hour away the pats are full again on opening. **Pats left** = `DailyPetting − [0][5]` before a due refill, and `DailyPetting − min([0][5], 0)` after one.
  - **Decay.** Happiness decays by `max(1, H/13)` per second (`HappinessLoss`, N.js @11143646), so a pat's happiness is gone within about a minute. Pats pay only when something uses them right away. **Open Gift** (index 10) triggers your gifts, and Beeg Slice adds 1,200 s of meat at the current, happiness-boosted rate (`DN5 == 10`, N.js @13076246). So "pat, then Open Gift" is the play (wiki: Beeg Slice "Generates 20 minutes of Meat Slices when triggered"; gameslikefinder 2026-05-27: patting "a few seconds before this reset timer you can double the amount of times you can pat").
- **F-i Smoker.**
  - **Unlock.** It opens once 16 upgrade types are available (index 15; Toolbox `smokerUnlocked`).
  - **Timer.** Smoke time `[0][14]` grows with the pending seconds whenever the window ticks (N.js @12950547). Toolbox's `smokerSeconds = [0][14] + [0][7]` includes the part not yet folded in.
  - **Claim.** Buying a Smoker level smokes one meat of tier `floor(5 · rand^max(0.1, 9 − 10t/(7200 + t)))` and resets the timer (N.js @13087711, @13078120). With Megaflesh 9, a 70% free roll leaves the timer running.
  - **Cap.** The exponent bottoms out at t = 58,254.5 s (**16 h 10 m 55 s**, Toolbox `SMOKER_MAX_QUALITY_SECONDS`), so waiting longer gains nothing.
- **F-j Dice and gifts (Phase 2, page only in Phase 1).** Dice Roll's price resets hourly with the pats (F-h). From Megaflesh 5, a reroll that would lower the total is discarded (N.js @13086210), so rerolls are risk-free from then on. Gift picks are `[0][2]` and `[0][3]`, 1-based into `generalSpelunky[39]` (Beeg Slice, Beach Ball, Numbahs, Red Die, Slabcakes, Surprise Box).

### 3.1 The System and its home (F1, F7)

- **FR-1 Registry.** `systems.yaml` gains:
  - id `bubba`, name "Bubba", `world: 3`, `scope: account`;
  - `dossier`: this spec;
  - `unlocked: { id: bubba/unlocked }`;
  - `unlockFact: systems.fact.unlocks`.

  `systems.facts.yaml` gains its unlock text: "Opens for a character once it has gone through the YumYum Grotto door into Frostbite Tundra (World 3). Open it in the Codex, where Orion is". Its Sources are the wiki Changelog/2025 (v1.02), the Steam thread of 2025-11-24, and the Toolbox `Funny_2hr_Slice` item text ("Bubba's Arctic Market, unlocked in World 3 and accessed via Orion and Poppy").
- **FR-2 Unlock Detector.** `bubba/unlocked` (milestone) reads `characters[].doorKillsLeft`.
  - `yes`: any character has `doorKillsLeft[50][0] === 0`.
  - `no`: every readable character has `> 0`.
  - `unknown`: the field is unknown on every character.

  The map and door come from `bubba.fact.unlock` (`{ map: 50, door: 0, leadsTo: 100 }`, authored with the N.js citation). A generator cross-check fails CI if `maps.fact.maps` stops saying that map 50's door 0 leads to Frostbite Tundra.
- **FR-3 Home.** `SYSTEM_HOMES.bubba = { page: 'bubba' }`, and `SYSTEM_PAGES.bubba` is a `lazyPart` chunk, `apps/activeon/src/bubba/BubbaPage.tsx` (M17 TR-7, M21 FR-S3). The Systems hub shows the tile in the World 3 band with its own 16 px glyph (`systems-bubba`, a new motif: a round seal holding a meat slice, our own drawing, ADR 0009). A locked tile reads "Opens: go through YumYum Grotto's door into World 3". Every Bubba Goal's "See it" opens the page, and the hub tile opens it too. Both are within 2 taps of Now ("features need a home").

### 3.2 Start and restart (F2)

- **FR-4 Not started (account Goal).** When `bubba/unlocked` is `yes` and the record shows no progress ever (1st Slice level 0, Megaflesh 0, Boon 0, meat ≤ 1), `bubba.check.start` fires with:
  - text: "Start Bubba: open the Codex, tap Bubba, buy 1st Slice";
  - why: "Bubba makes Meat Slices even while you're away, and its Boon adds 7 permanent bonuses to your whole account";
  - category `compounding`, effort 60 s.

  It is one account Goal (DS-25), never a line per character.
- **FR-5 Restart after a Megaflesh.** When Megaflesh ≥ 1 and 1st Slice is at level 0, the same entry fires with the restart text: "Buy 1st Slice again: Bubba makes nothing until you do". Its why is "Megaflesh set every upgrade back to 0, 1st Slice included", and its urgency is `losing-now` (F-b: no production at all). This case makes the System **wasting** (M17 FR-17).
- **FR-6 Which character opens it.** When fewer than all characters have the door open, the Next Action names one that has it, the last-played one if it qualifies (`lastPlayedCharacterIndex`), else the highest level. For example: "on your Squire Lv 85". A character that hasn't opened the door sees Bubba locked in its Codex (F-a).

### 3.3 Run Checks (F3)

- **FR-7 Megaflesh.** `bubba.check.megaflesh` fires when the Megaflesh upgrade is open (`totalUpgTypesAvailable > 8`) and the projected meat (F-b) ≥ its `cost`.
  - **Text:** "Buy Megaflesh {n}: {effect}", where the effect is the next row's short label, authored beside the game's text in `bubba.fact.megaflesh` (for example "account bonuses 1.40x"). The game's own text ("Bubba's IdleOn Bonuses are now all 1.40x higher") is in the why sheet.
  - **Details**, in order:
    1. "First spend the leftover {surplus} meat on Bubba Boon": only when FR-9's surplus rule holds;
    2. "Then buy 1st Slice right away to restart";
    3. "Charisma levels and XP reset too": only when Charisma has levels.
  - Category `spendable`, urgency none (nothing is lost by waiting, except the run's growth).
  - An infinite or non-finite cost (the price overflows at high levels, Toolbox registry note) never fires, and the page reads "out of reach".
- **FR-8 Boon to 7.** While Boon < 7, `bubba.check.boon` fires when the projected meat ≥ the Boon `cost`.
  - **Text:** "Buy Bubba Boon {L+1}: adds {bonus} to your whole account". The bonus comes from F-f and `bubba.fact.boon`, for example "+10% Construction Build Rate".
  - **Why:** "Each of the first 7 levels opens a new permanent bonus, and Boon never resets".
  - Category `spendable`.
- **FR-9 Boon past 7: the surplus rule.** From Boon 7 on, the Boon Check fires only together with FR-7: when a Megaflesh is affordable and `projected meat − Megaflesh cost ≥ Boon cost`. The surplus is lost at the reset (F-d). It is shown as FR-7's first detail, not as its own Goal. Further Boon levels from the same surplus are added while they fit, then Fun Gifts if it is below its cap of 6 (F-d: it persists too). The detail reads, for example, "First buy Boon 12 (+1.2% All Kills) with the leftover". The bonus's Stage rating is FR-17's tag ("matters a lot now"). D-3 sets this rule, and Q3 asks the owner to confirm it.
- **FR-10 Smoker at max quality.** `bubba.check.smoker` fires when `smokerUnlocked` and the projected smoke time (`smokerSeconds + elapsed since the save`) ≥ 58,254 s, and the Smoker `cost` ≤ the projected meat.
  - **Text:** "Claim the Smoker: buy a Smoker level now".
  - **Why:** "Smoked meat quality stops rising after 16h 11m of smoking, so waiting longer only wastes time".
  - Category `spendable`, urgency `losing-now` (the System is wasting).
  - When the Smoker isn't affordable, the Check stays silent and the page shows "Smoker at max quality · needs {cost − meat} more meat".
- **FR-11 Pat, then Open Gift.** `bubba.check.pat-gift` fires when all of these hold:
  - Happi Boi ≥ 1;
  - pats left ≥ 1 (F-h, from X1's `patsPerHour`);
  - Open Gift is open and affordable at the projected meat;
  - at least one gift is picked.

  **Text:** "Pat Bubba {n} times, then buy Open Gift right away".

  **Details:**
  - "Pats refill in {in}: pat {n} more first for a bigger gift": only when the refill is due within 10 minutes of `now` (the double pat, F-h);
  - "His happiness fades within a minute".

  Category `nice`, effort 60 s. Without X1, `{n}` is hidden and the text reads "Pat Bubba until he stops, then buy Open Gift right away" (DS-3). Pats on their own are never a Now Goal (D-5, Q1). The page shows them (FR-23).

### 3.4 Charisma Chart (F4)

- **FR-12 Idle training.** `bubba.check.charisma-idle` fires when the Charisma Chart is open and either no attribute is selected (`[0][6] == 0`) or the selected one is at 120.
  - **Text:** "Train {attribute} in Bubba's Charisma Chart: tap it once", where the attribute is FR-14's next pick.
  - **Why:** "{selected} is at its max of 120. XP keeps banking, and the next Megaflesh wipes it". When nothing is selected, the why is "No attribute is training".
  - **Details:** "About {k} levels of XP are waiting": only with X1's `charismaLevelsBanked`, else hidden.
  - Category `compounding`. Urgency is `banked`, or `losing-now` when FR-7 also fires (a Megaflesh now would wipe the bank).
- **FR-13 What the next level buys.** For each attribute the page shows its level of 120 and its effect now and after one more level: `perLevel × (1 + Super Chart bonus/100) × (3 if emulsified)`. For example, "Rizz 0 → 1: costs −2.06%". This is arithmetic on game data (`generalSpelunky[37]`) and Toolbox's Super Chart `bonus`, like M19's bands. With X1, the time to the next level of the selected attribute is `(xpReq − xp) / xpPerSec`, shown as "next level in 4m". Without X1 it is hidden.
- **FR-14 Training order (`bubba.priority.charisma`, authored).** The first attribute below 120 in the band for the account's Megaflesh count:
  - **Megaflesh 0–2:** Hustle, then Rizz, then Joy.
  - **Megaflesh 3–5:** Hustle, Rizz and Joy, aiming for about 45 / 15 / 15 at Megaflesh 3, and Hustle and Rizz at max by Megaflesh 4.
  - **Megaflesh 6 and up:** Mindful first (to 120, emulsified), then Rizz, Hustle, Joy; Courage last.
  - **Megaflesh 9 and up:** add Savvy to about 20.

  The bands are per run, because the levels reset (F-g). Sources: gameslikefinder (2026-05-27, tier 3, low trust) for the targets per Megaflesh, and vortexgaming.io (undated, tier 3) for "level Rizz first" at Megaflesh 1–4 and the 120 cap. The two agree that production attributes come first and Mindful matters late, so the confidence is **L**. That is why the order is shown as a muted suggestion on the page, and only drives FR-12's attribute name (D-7, Q2).
- **FR-15 Emulsify.** From Megaflesh 6 (row 6 owned), when nothing is emulsified (`[0][15] == 0`), the page reads "Emulsify: double-tap your training attribute to make it 3x". The pick is FR-14's (Mindful from Megaflesh 6). When the emulsified attribute isn't FR-14's pick, the page only notes "Emulsified: Hustle (the guide suggests Mindful from Megaflesh 6)". Emulsify is never a Now Goal (D-8).

### 3.5 Priority Lists (F5)

- **FR-16 The run order (`bubba.priority.run`, authored, `list: order`).** These are ordered tiers. Inside a tier, the cheapest open upgrade comes first.
  1. **Restart:** 1st Slice when its level is 0 (FR-5).
  2. **Megaflesh** when affordable, after the surplus rule (FR-7, FR-9).
  3. **Boon below 7** (FR-8).
  4. **Production:** 1st, 2nd and 3rd Slice; Good, Great and Best Meat; Crossover (once Poppy has fish).
  5. **Feature openers at their first level:** Happi Boi, Charisma, Fun Gifts, Open Gift, Dice Roll, Smoker, Spare Coins.
  6. **Discounts, only when they pay back:** Bargain, Cost Saver, Perma Sale.
  7. **Everything else** (Buyer Grin, Super Chart, More Dice, More Sides, Uber Gifts, Real Love, Loaded Dice, 2X Smoke, Big Ol Coin), cheapest first.

  **The payback test** is arithmetic on Toolbox numbers. A discount's next level multiplies every later cost by `(1 + B/100)/(1 + (B + x3)/100)`, where B is its current `bonus`. It **pays back** when its cost ≤ that saving on the rest of this run's spend, and the rest of the run's spend is taken as the next Megaflesh `cost`. That is a lower bound, because Megaflesh dominates the run (its price rises 125× a level). The rule is our own and is cited as the owner's brief. The idea that discounts are worth it only before a big purchase is common clicker practice, but no Bubba Source gives a rule, so the confidence is M.

  The order drives only the page's folded "Next buys" (at most 3 rows, DS-9). It never produces a Now Goal per upgrade (D-4).
- **FR-17 Boon bonuses by Stage (`bubba.priority.boon-bonuses`, authored, keyed by Stage, ties allowed).** It rates each of the seven bonuses `high`, `mid` or `low` for the account's Stage.

  | Stage | high | mid | low |
  |---|---|---|---|
  | W3-early | Build Rate, Total Damage | Class EXP, Critter Gain, Soul Gain | All Kills, Atom Cost |
  | W3-mid | Build Rate, Total Damage | Soul Gain, Critter Gain, Class EXP, All Kills | Atom Cost |
  | W3-late, W4-entry | Build Rate, Atom Cost, Total Damage | Soul Gain, Critter Gain, Class EXP, All Kills | — |

  - **Why:** Construction is the W3 hub (Leverage model, W3-early item 5). Worship and Trapping are W3-mid's Systems, and the Atom Collider is W3-late's (Leverage model, Stage table). Damage pushes in every Stage. All Kills is +1% a stack, which is small next to the others' 4–15%. Sources: the Leverage model, `research/priority-verification`, and Toolbox's readers (F-f). Confidence M.
  - **Where it shows:** as a tag on the page's bonus strip, and in FR-8 and FR-9's text ("matters a lot now" for `high`). It changes no purchase rule: the next bonus is fixed by the rotation (F-f).

### 3.6 Engine output (F6)

- **FR-18 One account Goal.** The engine module `bubba` (`after: true`) collects the firing Bubba Checks and emits **one account Goal**, "Bubba". Its single Next Action is the highest-ranked firing Check in `bubba.priority.visit`:
  1. restart;
  2. Smoker;
  3. Megaflesh with the Boon surplus;
  4. Boon below 7;
  5. Charisma idle;
  6. pat then gift;
  7. start.

  The other firing Checks are its details ("also in Bubba: Smoker at max quality"), at most 2, then "+n more · see Bubba". The Goal's category, urgency and Sources are its Next Action's. Skip today and Not for me act on the whole Goal (one System, one card, DS-25). The page still lists every finding.
- **FR-19 Ranking on Now.** The Goal sits in the Stage Priority Lists (M2):
  - restart, Smoker and Charisma idle (when `losing-now`) join `metapath.priority.free-value-fills`;
  - start, Megaflesh, Boon and pat then gift join a new tier after `construction.check.build-next` in `metapath.priority.w3-early`, `w3-mid`, `w3-late` and `w4-entry`.

  So Bubba never outranks the W3 engine (Construction, Death Note, salts), and a free stall-fix sits with the other free fills.
- **FR-20 Timeline bars (account lane "Bubba").**
  - **Megaflesh affordable:** kind `production`, `at` = `now + (cost − projected meat) / rate`.
  - **Smoker at max quality:** kind `time-cap`, `at` = `now + (58,254 − projected smoke time)`.
  - **Pats refill:** kind `timer`, `at` = `now + (3600 − timer)`, only while Happi Boi ≥ 1 and pats left < `patsPerHour`. It shows the next refill only.
  - **Boon {L+1} affordable:** kind `production`, while Boon < 7.

  `effect` is `'next-action'` while the matching Check fires, else `'info'`. A bar whose `at` is more than 365 days away, or not finite, is untimed with "out of reach" (Toolbox shows "A long time"). All are account bars, so they never touch a character Verdict.
- **FR-21 Determinism and fail closed.** The same Account State, Knowledge Base and `now` give byte-identical output. A Check that reads an unknown field is `unknown` with a diagnostic (M11), and nothing is offered from an unknown cost or meat. `EmptyAccountError` gives no M23 output. A `bubba` section failure in Toolbox (`safeSection`) makes `account.bubba` unknown, and the page shows "Can't read Bubba from this save".

### 3.7 The Bubba System page (F7)

- **FR-22 Two kinds of bonus, said plainly.** The page has two clearly separated parts:
  - **"Bubba's bonuses to your account"**: the seven Boon bonuses with their current totals ("+24% Build Rate"). It also says "Permanent. From Bubba Boon, boosted by Megaflesh ({x}x now)".
  - **"Inside Bubba"**: everything else, with the line "These boost Bubba's meat only, and reset at every Megaflesh". The Charisma Chart section repeats it under its heading: "Charisma boosts Bubba only. Your account bonuses come from Boon".
- **FR-23 Layout** (M21 FR-S3, step first on a phone, split from 1000 px; Phase F atoms only):
  1. **The step:** the Goal's Next Action as a `TokenLine` (who · where · how long), or "Nothing to do in Bubba right now" with the next Timeline time ("Megaflesh 4 in about 20h"). This is the page's one lit element (FR-S6).
  2. **Bonus strip:** seven `Chip`s in rotation order with their totals and FR-17's tag. The next Boon level's chip is outlined, with "Lv 12 adds +1.2% All Kills · {cost} meat · {in}". Only the lit chip and the top three by Stage rating carry labels (DS-20), and a tap opens a `Sheet` with the per-stack value and the Toolbox readers.
  3. **Megaflesh track:** 11 pips plus a Chromatic count, owned ones filled. The next pip has its effect text and a `Meter` showing projected meat against cost ("90B of 245B · in about 13h").
  4. **This run:** meat per minute, projected meat, the next upgrade type ("More Dice opens at 2.98T meat made this run"), and the folded "Next buys" (FR-16, at most 3 rows, then "show all").
  5. **Side panels** in a grid (two columns from 720 px):
     - **Pats:** pips N of N, refill time, and the double-pat tip.
     - **Smoker:** a `Meter` to 16h 11m, "claim at max", and the guide's note that claiming every ~13 h trades a little quality for more meats (gameslikefinder, L).
     - **Charisma Chart:** six bars of 120, the training one marked with a who-glyph-free "training" `StatusGlyph`, the emulsified one marked "3x", FR-13's next-level line, FR-14's suggestion muted with its confidence, and FR-15.
     - **Gifts:** the picked ones by name.
     - **Dice:** count and sides, page only.

  Locked parts show "Opens at {upgrade}", from `totalUpgTypesAvailable`.
  - **Source line:** "IdleOn Wiki · checked 18 Oct" (DS-10).
- **FR-24 Locked, not started and broken.**
  - **Locked:** M17's generic page with the unlock text (FR-1) and a `PixelArt` locked seal.
  - **Not started:** an `EmptyState` (the sleeping blob) and FR-4's step.
  - **Unknown:** "Can't read Bubba from this save" (M10's wording style). It shows no numbers.
- **FR-25 Words.** All text comes from the engine's view words (`now/words/bubba.ts`) or the entries. Times use the one time language (`inSpan`, M21 FR-F6), and meat uses one number formatter with a short suffix ("245B meat", "1.33T meat"). It never uses coin tiers, because meat is not coins (FR-F7).

### 3.8 All features

- **FR-26 Stage gate.** No M23 output exists before the unlock (FR-2). On a W1 or W2 account the tile is locked with its unlock line.
- **FR-27 Sources.** Every entry carries a player-readable tier 2 Source (the IdleOn Wiki Bubba page, or Changelog/2025 for the patch facts) and its tier-1 provenance (Toolbox `parsers/clickers/bubba.ts` at the pin, plus the N.js symbol). Judgment rows carry their community Source and confidence.
- **FR-28 Account-wide.** Every M23 Goal is an account Goal. A per-character fact (which character opens Bubba, FR-6) is a detail, never a character card (DS-25).

## 4. User stories

**US-1. Is Bubba worth a minute?** As a player in a Play Session, I want one line telling me the most useful thing to do in Bubba, so that I don't open it for nothing.
- **Given** the W3-early account at the golden clock (projected meat about 90B; Megaflesh 4 costs 245B; Boon 11; Smoker locked; Hustle selected at 120; 776K Charisma XP at the save) **When** the engine runs **Then** the Account section has one "Bubba" Goal. Its Next Action is "Train Rizz in Bubba's Charisma Chart: tap it once", with the why "Hustle is at its max of 120. XP keeps banking, and the next Megaflesh wipes it". With X1 it adds the detail "About 53 levels of XP are waiting" (at the save; the golden pins the exact number). Megaflesh and Boon don't fire, the pat-gift Check doesn't fire (Open Gift costs 100B, more than the projected 90B), and no character card mentions Bubba.
- **Given** the W2-late account **When** the engine runs **Then** there is no Bubba output, and the hub's World 3 band shows the Bubba tile locked: "Opens: go through YumYum Grotto's door into World 3".
- **Given** the W3-early account mutated to 1st Slice 0, Megaflesh 0, Boon 0 and meat 0 **When** the engine runs **Then** the Goal reads "Start Bubba: open the Codex, tap Bubba, buy 1st Slice", category `compounding`.

**US-2. Don't let the Smoker sit.** As a player, I want to know when the Smoker has reached its best quality.
- **Given** `latest.json` (smoke time 341,380 s at the save; Smoker cost about 3.8 × 10^14 against about 10^22 meat) **When** the engine runs **Then** the Bubba Goal's Next Action is "Claim the Smoker: buy a Smoker level now", urgency `losing-now`, and the hub marks Bubba **wasting**.
- **Given** `highend.json` (smoke time 17,523 s) **When** the engine runs **Then** the Smoker Check is silent, and the Timeline's Bubba lane has "Smoker at max quality" in about 11 h 18 m from the save.

**US-3. Megaflesh, with nothing wasted.** As a player, I want to Megaflesh as soon as I can, spending the leftover on what survives.
- **Given** the W3-early account mutated to 260B meat **When** the engine runs **Then** the Next Action is "Buy Megaflesh 4: account bonuses 1.40x". The details are "Then buy 1st Slice right away to restart" and "Charisma levels and XP reset too". There is no Boon detail, because the 15B surplus is less than Boon 12's 1.33T.
- **Given** the same account mutated to 1.6T meat **When** the engine runs **Then** the first detail is "First buy Boon 12 (+1.2% All Kills) with the leftover".
- **Given** the W3-early account unmutated **When** the Timeline renders **Then** the Bubba lane shows "Megaflesh 4 affordable" about 12 h 52 m after the golden clock.

**US-4. Boon to 7.** As a new Bubba player, I want each Boon level that opens a new account bonus.
- **Given** the W3-early account mutated to Boon 4 with 100M meat (Boon 5 costs well under that, F-f) **When** the engine runs **Then** the Next Action is "Buy Bubba Boon 5: adds +1% All Kills to your whole account". The page's bonus strip outlines All Kills, tagged `low` at W3-early.

**US-5. Pat, then gift.** As a player, I want the hourly pats used where they count.
- **Given** `latest.json` (Happi Boi 145 + 15 prestige, so 11 pats an hour; −10 used, a refill due; Open Gift affordable; two gifts picked) **When** the engine runs with X1 **Then** a Bubba detail reads "Pat Bubba 21 times, then buy Open Gift right away" (the Smoker is the Next Action, FR-18).
- **Given** the W3-early account at the golden clock **When** the page renders **Then** the Pats panel shows "10 of 10 ready" and no pat Goal fires.

**US-6. My account bonuses, not my Charisma.** As the owner, I want to see which Bubba bonuses reach my account and which only help Bubba.
- **Given** the W3-early account **When** the player opens the Bubba page **Then** "Bubba's bonuses to your account" lists "+24% Build Rate, +12% Critter Gain, +12% Soul Gain, +36% Total Damage, +1.2% All Kills, +4.8% Class EXP, −3.6% Atom Cost" with "boosted by Megaflesh (1.2x now)". The Charisma section is headed "Charisma boosts Bubba only. Your account bonuses come from Boon" and shows Hustle 120 of 120 (training, max), the other five at 0, and "Rizz 0 → 1: costs −2.06%" (Super Chart 3).

**US-7. Home in two taps.** As a player, I want to find Bubba on purpose.
- **Given** any unlocked fixture **When** the player taps Systems, then the Bubba tile **Then** the page opens, and from a Bubba Goal "See it" opens the same page.

## 5. Technical requirements

### TR-1 Package boundaries

| Package | Files |
|---|---|
| `packages/account-state` | `src/bubba.ts` and `bubba-types.ts`, plus `bubba-fields.ts` for provenance (M1 TR-11) |
| `packages/knowledge` | `systems/bubba.yaml` and `systems/bubba.facts.yaml`; `detectors/bubba/{unlocked,start,megaflesh,boon,smoker,pat-gift,charisma-idle}.ts`; `generators/bubba.gen.ts` |
| `packages/engine` | `src/bubba/` (`module.ts`, `visit.ts`, `timeline.ts`, `views.ts`) |
| `apps/activeon` | `src/bubba/` (the lazy page) and `src/now/words/bubba.ts` |

The UI never imports `toolbox-parsers`. The page reads only `view.bubba`.

### TR-2 Account State (one schema bump; `null` when the `bubba` section fails or the record is absent)

```ts
export interface BubbaState {
  meat: number;                 // Toolbox meatSlices, at the save
  ratePerMin: number;           // Toolbox meatsliceRate (per minute)
  produced: number;             // Toolbox progress (meat made this run)
  nextTypeAt: number;           // Toolbox progressReq
  types: number;                // Toolbox totalUpgTypesAvailable (1..28)
  levels: number[];             // 28, Toolbox upgrades[i].level
  prestige: number[];           // 28, Toolbox upgrades[i].prestige (free levels)
  costs: number[];              // 28, Toolbox upgrades[i].cost; non-finite stored as -1
  megaflesh: number;            // Toolbox megafleshOwned
  bonuses: [number, number, number, number, number, number, number]; // Build, Critter, Soul, Damage, Kills, EXP, Atom
  smoker: { unlocked: boolean; seconds: number };     // Toolbox smokerUnlocked, smokerSeconds
  pats: { used: number; timer: number; perHour: number | null };      // raw [0][5], [0][13]; X1
  charisma: {
    levels: [number, number, number, number, number, number];         // raw [3]
    selected: number;           // raw [0][6], 0 = none, 1..6
    emulsified: number;         // raw [0][15], 0 = none
    xp: number;                 // raw [0][8]
    levelsBanked: number | null; // X1
    xpReq: number | null;        // X1
    xpPerSec: number | null;     // X1
  };
  gifts: [number, number];      // raw [0][2], [0][3]
}
// AccountSummary
bubba?: BubbaState | null;
```

- **Sources.** Toolbox paths for the parsed values, and `RawKeySpec('Bubba', 'json')` for the raw indices, the way M6's `account.poppy` and M21's `doorKillsLeft` read raw keys (`bubba-fields.ts`). Reading a raw save value is not a formula. The formulas behind `perHour`, `levelsBanked`, `xpReq` and `xpPerSec` stay with Toolbox (X1).
- **Size.** About 1.3 KB per save: 84 numbers in the three 28-arrays, mostly short integers; costs at full precision about 600 B. The largest public save, `highend.json`, is at 351.9 KB under the 360 KB history guard (M21 TR-3), so this stays under it. The contract test's comment gains an "M23 TR-2" line, and the build PR measures it. If it would pass, costs keep only the entries for open upgrades (`index < types`) and the rest are -1.
- **Not stored.** Descriptions, names and the megaflesh text are game data in the fact tables (TR-3).

### TR-3 Fact tables (ADR 0007)

| id | Origin | Contents | Source |
|---|---|---|---|
| `bubba.fact.upgrades` | generated from `bubbaUpgrades` | index, name, `x1`–`x4` (`x4 = 999` means no cap), which persist through Megaflesh (3, 8, 9), the run-order tier (authored column) | Toolbox `shared-data.json`; wiki Bubba |
| `bubba.fact.megaflesh` | generated from `generalSpelunky[38]`, `[42]` | 12 rows: name, effect text (with `@` as a line break); the account-bonus multiplier rows (2, 4, 7, 10, 12) | same |
| `bubba.fact.boon` | generated from `generalSpelunky[33]` and Toolbox's bonus map | 7 bonuses: key, name, per-stack %, negative flag (Atom Cost) | same |
| `bubba.fact.charisma` | generated from `generalSpelunky[35–37]` | 6 attributes: name, per-level value, effect label, cap 120 (authored, N.js) | same; N.js `CharismaTraitREQ` |
| `bubba.fact.gifts` | generated from `generalSpelunky[39–41]` | 6 gifts: name, passive and trigger text | same |
| `bubba.fact.unlock` | authored | `{ map: 50, door: 0, leadsTo: 100 }`, cross-checked against `maps.fact.maps` | N.js `BubbaUnlocked` |

The authored entries in `bubba.yaml` are the seven Checks (TR-4), `bubba.priority.run`, `bubba.priority.visit`, `bubba.priority.charisma` and `bubba.priority.boon-bonuses`. Size is about 6 KB raw, inside the Knowledge Base headroom left after M18 and M19 (about 65 KB raw, README).

### TR-4 Entries (#11 shape; **A** = authored)

| Entry id | Type | Detector | `doneWhen` | Notes |
|---|---|---|---|---|
| `bubba.check.start` | check (account) **A** | `bubba/start` | `account.bubba.levels[0]` higher | FR-4, FR-5 (two texts, `values.mode`) |
| `bubba.check.megaflesh` | check (account) **A** | `bubba/megaflesh` | `account.bubba.megaflesh` higher | FR-7, FR-9 details |
| `bubba.check.boon` | check (account) **A** | `bubba/boon` | `account.bubba.levels[3]` higher | FR-8 |
| `bubba.check.smoker` | check (account) **A** | `bubba/smoker` | `account.bubba.smoker.seconds` lower | FR-10 |
| `bubba.check.pat-gift` | check (account) **A** | `bubba/pat-gift` | `account.bubba.levels[10]` higher | FR-11 |
| `bubba.check.charisma-idle` | check (account) **A** | `bubba/charisma-idle` | `account.bubba.charisma.selected` changed | FR-12 |
| `bubba.priority.run`, `.visit`, `.charisma`, `.boon-bonuses` | priority **A** | — | — | FR-16–FR-18 |
| `bubba/unlocked` | milestone Detector | — | — | FR-2 |

Every Detector declares `examples` (M11): fires, silent and unknown, on `scrubbed-w3`, `latest`, `highend`, `fresh` and the mutations in section 4. Every entry sets `affectsVerdict: false`.

### TR-5 Engine output (M10 TR-2 additions, built in the worker)

```ts
export interface BubbaResult {
  unlocked: 'yes' | 'no' | 'unknown';
  started: boolean;
  projectedMeat: number;                 // F-b at now
  step: { key: string; entryId: string } | null;     // the Goal's Next Action (FR-18)
  bonuses: Array<{ key: BoonKey; total: number; stacks: number; rating: 'high' | 'mid' | 'low'; next: boolean }>;
  boonNext: { level: number; key: BoonKey; addPct: number; cost: number | null; at: number | null } | null;
  megaflesh: { owned: number; next: { row: number; text: string; cost: number | null; at: number | null } | null; multiplier: number };
  run: { ratePerMin: number; nextType: { name: string; at: number } | null; nextBuys: Array<{ index: number; name: string; cost: number; tier: number }> };
  pats: { left: number | null; perHour: number | null; refillAt: number | null } | null;
  smoker: { seconds: number; maxAt: number | null; atMax: boolean; cost: number } | null;
  charisma: null | {
    attrs: Array<{ index: number; name: string; level: number; nowPct: number; nextPct: number; training: boolean; emulsified: boolean; suggested: boolean }>;
    nextLevelAt: number | null; banked: number | null; emulsifyOpen: boolean;
  };
  gifts: string[];
}
// EngineResult addition
bubba?: BubbaResult | null;
```

`buildNowView` passes it through as `view.bubba`, and the lazy chunk only formats it.

### TR-6 X1: the Toolbox fork export (cross-repo request)

One small commit to the owner's fork (`YassSoliman/IdleonToolbox`, the repo `UPSTREAM` pins). It adds four outputs to `parseBubba`:
- `patsPerHour` (`getDailyPetting`, already in the file but not exported);
- `charismaXpReq` (`CharismaTraitREQ`);
- `charismaXpPerSec` (`CharismaTraitSPD`);
- `charismaLevelsBanked`: how many levels the banked XP buys for the next selected attribute at the current total, capped by 120 − that attribute's level. The game's own loop applies one REQ per level.

Each comes with a `live-verified` test in the fork's style. Then `pnpm sync-parsers` picks it up. Until then the four fields are `null`, and every line that needs them hides that token (DS-3): the Checks still fire with the words that don't need the numbers. This keeps ADR 0005: the formulas live in Toolbox, and M23 does arithmetic only.

### TR-7 Cross-module wiring

- **M2:** the tier rows of FR-19 in four Stage lists and `free-value-fills`.
- **M17:**
  - the registry row (FR-1);
  - `SYSTEM_HOMES.bubba`;
  - `SYSTEM_PAGES.bubba`;
  - the `systems-bubba` glyph in the `systems` art group;
  - the account lane "Bubba" is a normal `account:bubba` Timeline lane (M17 TR-5).
- **M21:** the page uses only Phase F atoms and the area S frame. It adds two motifs (`systems-bubba` and `bubba-seal` for the locked page) through the art importer, each pixel-tested (V-7's test).
- **M6:** none. Poppy's line stays. M23's Crossover row in FR-16 reads `account.poppy` only to know whether Poppy has fish (`unlocked`).

### TR-8 Performance and budgets

- **Worker.** The module is ≤ 1 ms: about 28 cost comparisons and FR-9's loop of at most 10 Boon levels.
- **Main chunk.** +0.2 KB at most (the `SYSTEM_PAGES` stub and view words). The page is a lazy chunk of about 6 KB gzip, measured by `check-budgets` in the build PR.
- **Knowledge Base.** +6 KB raw.
- **Account State.** +1.3 KB per save (TR-2).

### TR-9 Storage, security and privacy

M23 stores nothing new, and skips and dismissals use M10's store. Nothing leaves the device. Tests and goldens print no names. The W3-early numbers in this spec are aggregates of the scrubbed fixture, which is public already.

### TR-10 Tests

- **Detector examples** (TR-4).
- **Contract test:** `account.bubba` is null on `first`, `second`, `third` and `fourth` (no Bubba record) and filled on the others, and the size guard holds (TR-2).
- **Rotation:** for Boon levels 0–30, the bonus added by level `L + 1` is `(L mod 7) + 1`, and the stack count matches Toolbox's bonus divided by the per-stack value × multiplier (F-f).
- **Surplus rule** (FR-9): never spends below the Megaflesh cost, and stops at Fun Gifts' cap.
- **Payback** (FR-16): a discount whose cost exceeds its saving on the Megaflesh is never in "Next buys".
- **Projection** (F-b): with `now` = `lastCloudSave`, the projected meat equals `meat`, and it rises linearly after.
- **Goldens:** a `## Bubba` section in the Now text snapshot (step, details, bonus strip, Megaflesh next, Charisma lines) on the four fixtures.

## 6. States and edge cases

| State | Behaviour | Where |
|---|---|---|
| No `Bubba` key in the save (old saves, public `first`–`fourth`) | `account.bubba` null. If the unlock Detector says `yes`, the page reads "Can't read Bubba from this save" | FR-21 |
| Record present, all zeros, door not open (W2-late) | Locked tile, no output | FR-26 |
| Record all zeros, door open | Start Goal | FR-4 |
| Just Megaflesh'd (1st Slice 0) | Restart Goal, `losing-now` | FR-5 |
| Some characters haven't opened the door | Next Action names one that has; V-3 notes their logins may skip offline meat | FR-6, V-3 |
| Stale save (M1) | Projections run from `lastCloudSave` to `now`, so a stale save still says "Megaflesh affordable" correctly if the rate held. DS-11's age wording applies | F-b |
| Game open on Bubba now | Saves every few minutes; projection adds only seconds | F-b |
| Cost overflow (`Infinity`) at high levels | Stored as -1, "out of reach", never fires | FR-7, TR-2 |
| Megaflesh 12+ (Chromatic) | Track shows "Chromatic × n"; the next row is Chromatic again | F-e |
| Boon cost past 1e300 | Same as overflow | FR-20 |
| Charisma attribute above 120 (gifts can push past, per the vortexgaming guide; Numbahs' trigger adds +1 LV) | Shown as its level; it counts as maxed for training (the game stops training at ≥ 120) | FR-12 |
| X1 not landed | Counts hidden, Checks still fire | TR-6 |
| Two tabs, second account | M1 handles both; nothing M23-specific | M1 |
| Patch changes the rules (the costs in v1.03) | M12's weekly re-sync re-runs the fork's live-verified tests. The generator cross-checks (`bubba.fact.unlock`, the persistent upgrade list 3/8/9) fail CI if the data moves | TR-3 |

## 7. Dependencies

| Module | What M23 uses | Interface |
|---|---|---|
| M1 | Account State, `isKnown`, `lastCloudSave`, `lastPlayedCharacterIndex`, raw-key reads | `AccountState`, `RawKeySpec` |
| M2 | Stage, Priority Lists, `compareGoals` | `stage`, `metapath.priority.*` |
| M10 | Goals, account section, view words | `Goal`, `NowView` |
| M11 | Detector contract, generators, examples, goldens | `defineDetector` |
| M12 | Weekly re-sync | `pnpm sync-parsers` |
| M17 | Registry, homes, System page, Timeline lanes, hub | `SYSTEM_HOMES`, `SYSTEM_PAGES`, `TimelineBar` |
| M21 | Atoms, art importer, formatter, area S frame | Phase F |
| M6 | `account.poppy.unlocked` (Crossover row) | Account State |
| Toolbox fork | X1 (TR-6) | `account.bubba` |

## 8. Owner review

### 8.1 Questions for the owner (at most 3)

❓ Q1 - Pats on Now: should ActiveOn ever say "pat Bubba" on its own every hour, or only "pat, then Open Gift" when a gift is affordable?
➡️ Only the combo. Happiness fades within about a minute (`HappinessLoss = max(1, H/13)` per second), so a pat with nothing to spend on right away is worth almost nothing. An hourly line would be the noisiest item on Now. The page always shows the pats and the refill time.

❓ Q2 - Charisma training order: the only Bubba-specific Sources are two tier 3 guides (one low-trust). Should FR-12's Check name the attribute to train from that order, or just say "train an attribute that isn't maxed" and leave the order to the page?
➡️ Name it, with the guide's confidence on the page. Both guides agree on the direction (production attributes first, Mindful from Megaflesh 6). A named tap is the one-verb step DS-18 asks for, and naming the wrong one of two good attributes costs little, because levels reset every run.

❓ Q3 - Boon past 7: buy more Boon levels only with the leftover before a Megaflesh (FR-9), or also whenever one is affordable mid-run?
➡️ Only with the leftover. Mid-run, every meat spent on Boon delays the Megaflesh, which grows the whole run's production 1.2x to 2x. Leftover meat is otherwise lost at the reset (F-d). Boon's cost rises 10x a level and Megaflesh's 125x, so the leftover keeps up: it pays for about two Boon levels per Megaflesh. The Stage rating shows how good the next one is.

### 8.2 Self-ruled decisions (with research)

- **D-1 New module, own page.** Bubba is a whole System with seven sub-systems and its own resource. A section on another page would be unfindable ("features need a home"). *Why:* the owner's rule; M18 and M19's precedent.
- **D-2 Unlock is per character, shown per account.** The game's rule is the logged-in character's door (F-a). The account counts as unlocked when any character qualifies, and FR-6 names that character. *Why:* DS-25, plus a real per-character fact.
- **D-3 Megaflesh as soon as affordable.** No guide argues for holding: gameslikefinder's per-Megaflesh income figures (10M/min at MF3 up to 3Q/min at MF8) describe when the next one comes, not a reason to wait. Megaflesh rows 2, 4, 7 and 10 raise the account bonuses, and row 1 multiplies meat by total levels. Holding gains nothing permanent, because the meat resets anyway. *Why:* the owner's brief ("Megaflesh early"); F-d. Q3 covers the only judgment in it.
- **D-4 No Goal per upgrade.** A Bubba visit buys dozens of upgrades with "hold to upgrade fast". One Now line per upgrade would be noise against DS-9. The run order lives on the page's "Next buys". *Why:* DS-9, DS-25.
- **D-5 Pats only in the combo.** See Q1. Self-ruled for the build, with the recommendation as the default. Changing it later is one Detector switch.
- **D-6 No checklist rows.** Nothing in Bubba resets daily or weekly. Hourly rows would never be "done" and would drag the today ring (M20 FR-6). *Why:* M20's band definitions.
- **D-7 The Charisma order is page-first.** Its confidence is L (FR-14). It names FR-12's attribute (Q2) but never creates its own Goal. *Why:* ADR 0004's tier rules; a low-trust Source shouldn't push a Now Goal.
- **D-8 Emulsify is page-only.** It's one tap that the game itself explains in the Megaflesh 6 text. As a Goal it would show up once per run and then be done. *Why:* noise.
- **D-9 Stage rating changes no purchase.** The next Boon bonus is fixed by rotation (F-f), so the rating only explains value. *Why:* honesty (DS-23: no invented numbers or choices).
- **D-10 Ask the fork for four numbers instead of writing formulas.** The owner maintains the fork, the change is about 30 lines with live-verified tests, and ADR 0005 forbids our own game formulas. *Why:* ADR 0005; TR-6.
- **D-11 Orion stays out.** It is M6 D6's "not covered yet". A shared clicker page waits for an Orion spec. *Why:* one concern per PR (AGENTS.md).
- **D-12 Meat is not coins.** Meat uses a plain short-suffix number ("245B meat"), never `formatCoins` or coin tiers. *Why:* M21 FR-F7 reserves coin text for IdleOn coins. Spare Coins are named "Spare Coins" so no one reads them as IdleOn money.

## 9. Red-team notes (author's own pass)

1. **Wrong unlock.** "Reach World 3" (the research's guess) would fire the start Goal on a character that can't open Bubba. *Defence:* the game's own rule (F-a, N.js `BubbaUnlocked`), the W2-late and W3-early door counts, and a CI cross-check on map 50.
2. **Stale meat.** The save's meat is old the moment it's saved. *Defence:* projection from `lastCloudSave` (F-b), the same arithmetic as Toolbox's own timer. V-1 checks for an away cap.
3. **Telling the owner Charisma helps his account.** *Defence:* FR-22's two-part page and the explicit Charisma heading line, US-6, and F-g's evidence that nothing outside Bubba reads Charisma.
4. **Noise.** Seven Checks could put seven Bubba lines on Now. *Defence:* one account Goal (FR-18); pats only in the combo (D-5); no per-upgrade Goals (D-4).
5. **Wasting the leftover at Megaflesh.** *Defence:* FR-9's surplus detail, F-d's evidence.
6. **Invented numbers.** Banked levels and pats per hour need game formulas. *Defence:* X1, hidden until it lands (DS-3, DS-23).
7. **Patch day.** A cost rebalance like v1.03 moves every number. *Defence:* all costs come from Toolbox at engine time; the fork's live-verified tests fail on drift; the generator cross-checks.
8. **Smoker "max quality" when not affordable.** A claim you can't pay for is a dead end. *Defence:* FR-10 stays silent and the page says how much is missing.
9. **Losing banked Charisma XP to a Megaflesh.** *Defence:* FR-12's urgency rises to `losing-now` when FR-7 fires, and FR-7's detail warns.

## 10. Red-team log

(Filled after the independent review.)

## Verify before build

- **V-1 Away cap.** Is the away seconds `b` passed to `AFKcode("Forge", b)` capped (as some other AFK gains are)? If so, F-b's projection caps at it. Check N.js at the login caller.
- **V-2 X1 lands.** The fork commit and its live-verified tests, then `pnpm sync-parsers`.
- **V-3 Per-character offline gain.** `BubbaUnlocked` gates the away-time block on the logged-in character. Does logging in on a character that hasn't opened the YumYum Grotto door skip Bubba's offline meat for that login? This needs one save pair on a test account. If so, Phase 2 adds a detail to FR-6.
- **V-4 Critter Gain reader.** Toolbox has no reader for Bubba's Critter Gain at this pin, so M23 shows the total but no "affects" line until one exists.
- **V-5 Charisma above 120.** Confirm on a live save whether gifts can push an attribute past 120 (the vortexgaming guide says so; the game's level-up stops at 120, but the Numbahs trigger adds +1 LV directly).

## Phases and effort

- **Phase 1, one PR after X1.** About 3.5–4.5 agent-days, plus one owner review:
  - adapter and fields: 0.5 day;
  - entries, seven Detectors, generators and examples: 1 day;
  - engine module and Timeline: 0.5–1 day;
  - the page and two motifs: 1–1.5 days;
  - goldens and QA probe: 0.5 day.
- **X1** is about 0.5 day in the fork.
- **Phase 2:** dice, gift picks per Megaflesh, Spare Coins, V-3 and the Tome row, about 1.5 days.

## Glossary additions (land with the build PR)

- **Megaflesh**: Bubba's full reset; each one is a permanent bonus, and it wipes every upgrade except Boon, Megaflesh and Fun Gifts. _Avoid_: prestige, rebirth.
- **Bubba Boon**: the Bubba upgrade whose levels add Bubba's seven account bonuses in rotation; never resets. _Avoid_: Ring of Greed (the game's internal name), RoG.
- **Charisma Chart**: Bubba's six trainable attributes; they boost only Bubba and reset at every Megaflesh. _Avoid_: stat points, attributes (bare).

## Sources

- **Game client:** `N.js`, served 2026-10-18 (Last-Modified 2026-10-17): `_customBlock_Bubbastuff` (`BubbaUnlocked`, `DailyPetting`, `CharismaTraitREQ`, `CharismaTraitSPD`, `CharismaBonus`, `HappinessLoss`, `SpareCoins_*`, `Dice_*`), the Bubba window tick (`ActorEvents_713`), `_customEvent_Bubbathings` (Megaflesh reset, Smoker, Open Gift), `AFKcode` (away time), `runPeriodically(1000)` (online meat). Tier 1.
- **IdleOn Toolbox** at `6c37e3d`: `parsers/clickers/bubba.ts`; `components/dashboard/Etc.jsx` L51 and L67 (Megaflesh and Smoker timers); `__test__/parsers/live-verified-bubba.test.js` (costs, bonuses and rate matched against the live game, 2026-10-11); `scripts/entity-graph/registry/world-7/bubba-upgrade.mjs` (the Megaflesh keep list); `shared-data.json` `bubbaUpgrades`, `generalSpelunky[33–42]`, `mapPortalDestinations`. Tier 1.
- **IdleOn Wiki:** [Bubba the Chonky Seal's Arctic Market of Meats](https://idleon.wiki/wiki/Bubba) (last edited 2026-10-07, opened 2026-10-18); [Changelog/2025](https://idleon.wiki/wiki/Changelog/2025) v1.02 and v1.03; [Codex](https://idleon.wiki/wiki/Codex) (Quick Ref). Tier 2.
- **Steam community:** [where is Bubba which world?](https://steamcommunity.com/app/1476970/discussions/0/690867902968120321/), 2025-11-24. Tier 3, the unlock corroboration.
- **gameslikefinder:** [Idleon Bubba Seal Guide](https://gameslikefinder.com/article/idleon-bubba-guide/), 2026-05-27. Tier 3, low trust: Charisma targets, gift picks, double pat, Smoker every ~13 h, income per Megaflesh.
- **vortexgaming.io:** [IdleOn: Bubba's Guide to Megaflesh 1-6](https://vortexgaming.io/en/postdetail/624145), undated. Tier 3: training by tapping, the 120 cap, Rizz first.
- **IdleOn Forge:** Leverage model (`research/leverage-model`), priority verification (`research/priority-verification`), M6, M17, M20 and M21 specs.
