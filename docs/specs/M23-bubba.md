# M23 Bubba

Spec for the owner's request of 2026-10-18 ("would be epic"): a module for **Bubba**, the third clicker, part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **ready for owner review**. An independent reviewer red-teamed it: 28 findings (2 P0, 6 P1, 14 P2, 6 P3), every P0, P1 and P2 fixed (section 10). Three product questions are open for the owner (section 8.1). Every other question is self-ruled with research (section 8.2). Terms follow [`GLOSSARY.md`](../../GLOSSARY.md), and decisions follow [ADRs 0001–0009](../adr/).

**Why this exists.** Bubba is the only W3 System that pays seven permanent, account-wide bonuses (Construction Build Rate, Critters, Souls, Total Damage, All Kills, Class EXP, Atom Cost) from a screen most players open and forget. ActiveOn covers Poppy only as a "convert your fish" line (M6 FR-18), Orion not at all (M6 D6), and Bubba not at all. Both private fixtures show the gap:
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
| F4 | **Charisma Chart**: the idle-training Check, what the next level buys, the two community targets (Contested), emulsify | same, and `packages/engine/src/bubba/` | `bubba.check.charisma-idle`, `bubba.priority.charisma`; Detector `bubba/charisma-idle` | Phase 1 |
| F5 | **Priority Lists**: the run order and the Boon bonus ranking by Stage | `packages/knowledge/systems/bubba.yaml`, `metapath.yaml` (tier rows only) | `bubba.priority.run`, `bubba.priority.boon-bonuses` | Phase 1 |
| F6 | **One account Goal, Timeline bars** | `packages/engine/src/bubba/` | `bubba.goal.visit`; engine module `bubba` (groups F2–F4, emits `TimelineBar`s) | Phase 1 |
| F7 | **The Bubba System page** | `apps/activeon/src/bubba/` (lazy chunk) | none (views add no advice) | Phase 1 |
| F8 | Dice reroll timing, gift picks per Megaflesh, Spare Coins, the Tome's Megaflesh row | same folders | added entries | Phase 2 |

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
- **Funny 2hr Slice** (the usable item that adds 2 hours of meat and resets happiness, N.js @8495435) and the Menagerie's Bubba Cheapener (W7). They're shown in the cost breakdown only as Toolbox includes them.
- **The Daily & Weekly Checklist.** Nothing in Bubba resets daily or weekly. The pats and the Dice Roll price reset hourly, which would distort the today ring (M20 FR-6). M23 adds no rows (D-6).
- **The Tome's Megaflesh row** (Tome entry 108, W4). Phase 2, with whatever covers the Tome.

## 3. Functional requirements

### 3.0 Facts settled for this spec (from N.js and Toolbox)

These are game facts, not judgment. Each one is tier 1 provenance, and the player-readable Source is the wiki page where it agrees (FR-27).

- **F-a Unlock.** `Bubbastuff("BubbaUnlocked") = KillsLeft2Advance[50][0] <= 0` (N.js @11150786). Map 50 is **YumYum Grotto**, and its door 0 leads to map 100, the W3 town (`Frostbite_Towndra` in the game data, "Frostbite Tundra" in our player text; Toolbox `mapPortalDestinations[50] = [100, 51, 0]`). So Bubba opens for a character once **that character** has **opened** YumYum Grotto's door to World 3 (its kill requirement done; the W2-late account's raw `KLA_i[50]` is `[1, 0, 0]`). You open it in the Codex, where Orion is (wiki Changelog v1.02: "Find them in your Codex, where Orion normally is!"; Steam thread 2025-11-24: "after i beat W2 Boss and Enter W3 i got instantly Baba in my Codex"). The rule is per character because `KillsLeft2Advance` is the logged-in character's KLA. ActiveOn already stores it as `characters[].doorKillsLeft` (M21 FR-F10). The W3-early account has 0 left on all 6 characters, and the W2-late account has 1 left on all 5.
- **F-b Production.** Toolbox `bubba.meatsliceRate` is **per minute** (`60 × MeatsliceRate`). Meat is added every second the game runs, but only once 1st Slice is above level 0 (`runPeriodically(1000)`, N.js @13089703). Away time is added on login: the login loop calls `AFKcode("Forge", GlobalTime − TimeAway.Forge)` with **no cap** beyond a 10 s minimum, then sets `TimeAway.Forge` unconditionally (N.js @15027063, @15262417; the Bubba block is in the Forge branch, @5027621, gated on `BubbaUnlocked`). Two consequences:
  - **Happiness at zero.** The away block first decays happiness by `HappinessLoss × b`, which is effectively to 0, then adds meat at the rate. Toolbox's `meatsliceRate` uses the happiness in the save, so a save taken mid-patting inflates it (up to about 25×). Projections therefore use X1's `meatsliceRateBase`, the rate at happiness 0 (TR-6). Until X1 lands they use `meatsliceRate` only when raw happiness `[0][1]` is 0, and are hidden otherwise.
  - **Per-character loss.** The away time is consumed even when the logged-in character hasn't opened the door, so **logging in on such a character loses Bubba's away time for good** (FR-6).

  Projected meat at `now` = `meat + rateBase / 60 × max(0, now − lastCloudSave) / 1000`. It is a lower bound: talent 280's kill procs also feed this branch (N.js @4539622, @5572605). Every time is anchored at `lastCloudSave`, never at `now` minus a save-time timer.
- **F-c Upgrades.** There are 28 (`bubbaUpgrades`). An upgrade type opens once the meat produced this run (`bubba.progress`, raw `[0][4]`) reaches `MeatProdREQ(t)`. Toolbox gives `totalUpgTypesAvailable`, each upgrade's `level`, `prestige` (free levels that don't raise the cost), `cost` and `bonus`. Costs are game-exact (Toolbox's `live-verified-bubba.test.js` matches all 28 against the running game).
- **F-d What Megaflesh resets.** Buying Megaflesh (`_customEvent_Bubbathings`, `DN5 == 8`, N.js @13074365) does these things:
  - sets every upgrade to level 0 **except Bubba Boon (3), Megaflesh (8) and Fun Gifts (9)**;
  - sets every prestige to 0;
  - sets meat to 1 (**leftover meat is lost**);
  - clears happiness, gift picks, meat produced, pats used (to −50 with Megaflesh 8), the Charisma selection, **Charisma XP**, emulsify, Spare Coins, **all six Charisma levels**, the dice and the smoked meats.

  It keeps the pat timer `[0][13]` and the Smoker timer `[0][14]`. It clears the Smoker's level and its smoked meats, so a Smoker claim just before a Megaflesh is wasted, while the timer carries into the next run. So the research claim that Boon is "the only upgrade that never resets" is wrong: Megaflesh and Fun Gifts persist too.
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

  The multiplier is `1 + 20 × (rows 2, 4, 7, 10 owned + the Chromatic count)/100` (Toolbox `getBubbaBonuses`). M23 never computes it: X1 exports it (TR-6). The Megaflesh 9 text says 75%, but the code rolls `.7 > random` (N.js @13078120), so M23 prints the game's own text and never the number.
- **F-f Bubba Boon.** Upgrade index 3 costs `(16·L + 3.22^3 · 10^L) × x1` before discounts, so **each level costs about 10× the last**. Bonus `i` (1 = Build Rate … 7 = Atom Cost) has `ceil((L − (i − 1))/7)` stacks, each worth `generalSpelunky[33][i]` (10, 5, 5, 15, 1, 4, 3 %), × the Megaflesh multiplier × (1 + companion 51). So levels 1 to 7 each **open one new bonus**, and level `L + 1` always adds one stack of bonus `(L mod 7) + 1`. The player can't choose which. Toolbox gives each bonus's current total (`bubba.bonuses`). It is read by `character.ts` (Build Rate, Class EXP), `damage.ts` (Total Damage, All Kills), `worship.ts` (Souls) and `atomCollider.ts` (Atom Cost). Critter Gain has no Toolbox reader at this pin. In the game it is not a percent: trapping reads `(BoxRewards["16c"] + Bubba bonus 2) / 10` and adds it flat to the trap's base critters (N.js @7764650). So the page shows it as "+1.2 base critters per trap", not "+12%". The per-level delta the next Boon level adds is X1's `boonNextDelta`, at the current multiplier, never our formula.
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

    Each is × (1 + Super Chart bonus/100), and × 3 when emulsified (`generalSpelunky[35–37]`, `CharismaBonus`, N.js @11144345). M23 reads each attribute's bonus now and at +1 level from X1 (`charismaBonus`, `charismaBonusNext`). Rizz's value is the game's own "−{x}% Costs" figure: costs divide by `1 + x/100`, so the real cut is a little smaller, and the page uses the game's label.
  - **Coins.** Savvy's coins are **Bubba's Spare Coins** (pennies to dollars that multiply meat), not IdleOn coins.
  - **No account bonuses.** No Charisma attribute is read outside Bubba, in N.js or in Toolbox. Toolbox computes only Hustle, Rizz and Joy, and leaves out Courage, Mindful and Savvy.
  - **Reset.** **All six levels reset at every Megaflesh** (F-d).
- **F-h Pats.**
  - **Size.** Happi Boi (index 1) allows `DailyPetting = ceil(log2(max(1, RealLV₁)) + min(RealLV₁, 3))` pats per hour (N.js @11142898). Each pat adds `DailyPet_HappinessQTY` happiness, and raw `[0][5]` counts the pats used this hour.
  - **Refill.** When the pat timer `[0][13]` reaches 3600 s and the window ticks, `[0][5] = min([0][5], 0)`, Dice Roll's price resets (`[1][12] = 1`) and the timer restarts (N.js @12952360). The timer keeps counting while you're away (F-b), so after an hour away the pats are full again on opening. **Pats left** = `DailyPetting − [0][5]` before a due refill, and `DailyPetting − min([0][5], 0)` after one.
  - **Decay.** Happiness decays by `max(1, H/13)` per second (`HappinessLoss`, N.js @11143646), so a pat's happiness is gone within about a minute. Pats pay only when something uses them right away. **Open Gift** (index 10) triggers your gifts, and Beeg Slice adds 1,200 s of meat at the current, happiness-boosted rate (`DN5 == 10`, N.js @13076246). **Only Beeg Slice uses the boosted rate.** The other gifts' triggers are flat: Beach Ball +200 happiness, Numbahs +1 level to the selected attribute, Red Die a reroll, Slabcakes one smoked meat at the current smoke quality *without resetting the Smoker timer* (N.js @13087711), and Surprise Box +2 free levels. So "pat, then Open Gift" is the play **only when Beeg Slice is picked** (wiki: Beeg Slice "Generates 20 minutes of Meat Slices when triggered"). The double pat (gameslikefinder 2026-05-27: patting "a few seconds before this reset timer") works only seconds before the refill, since happiness halves in about 9 s at W3-early's levels. It is a page tip, never a Now line.
- **F-i Smoker.**
  - **Unlock.** It opens once 16 upgrade types are available (index 15; Toolbox `smokerUnlocked`).
  - **Timer.** Smoke time `[0][14]` grows with the pending seconds whenever the window ticks (N.js @12950547). Toolbox's `smokerSeconds = [0][14] + [0][7]` includes the part not yet folded in.
  - **Claim.** Buying a Smoker level smokes one meat of tier `floor(5 · rand^max(0.1, 9 − 10t/(7200 + t)))` and resets the timer (N.js @13087711, @13078120). With Megaflesh 9, a 70% free roll leaves the timer running, so the step becomes "buy Smoker levels until the timer resets". The Slabcakes gift smokes a meat at the current quality without a reset, so a player holding the timer at max on purpose is playing well, not wasting.
  - **Cap.** The exponent bottoms out at t = 58,254.5 s (**16 h 10 m 55 s**), so waiting longer gains nothing. M23 imports Toolbox's exported `SMOKER_MAX_QUALITY_SECONDS` and never types the number. The other constants (the 120 Charisma cap, the 3600 s pat hour, Beeg Slice's 1,200 s) come from X1 as named exports, so a patch that moves them moves them in one place (TR-6).
- **F-j Dice and gifts (Phase 2, page only in Phase 1).** Dice Roll's price resets hourly with the pats (F-h). From Megaflesh 5, a reroll that would lower the total is discarded (N.js @13086210), so rerolls are risk-free from then on. Gift picks are `[0][2]` and `[0][3]`, 1-based into `generalSpelunky[39]` (Beeg Slice, Beach Ball, Numbahs, Red Die, Slabcakes, Surprise Box).

### 3.1 The System and its home (F1, F7)

- **FR-1 Registry.** `systems.yaml` gains:
  - id `bubba`, name "Bubba", `world: 3`, `scope: account`;
  - `dossier`: this spec;
  - `unlocked: { id: bubba/unlocked }`;
  - `unlockFact: systems.fact.unlocks`.

  `systems.facts.yaml` gains its unlock text: "Opens for a character once it has opened YumYum Grotto's door to Frostbite Tundra (World 3). Open it in the Codex, where Orion is". Its Sources are the wiki Changelog/2025 (v1.02), the Steam thread of 2025-11-24, and the Toolbox `Funny_2hr_Slice` item text ("Bubba's Arctic Market, unlocked in World 3 and accessed via Orion and Poppy").
- **FR-2 Unlock Detector.** `bubba/unlocked` (milestone) reads `characters[].doorKillsLeft`.
  - `yes`: any character has `doorKillsLeft[50][0] === 0`.
  - `no`: every character is readable and has `> 0`.
  - `unknown`: otherwise (no character qualifies and at least one is unknown).

  The map and door come from `bubba.fact.unlock` (`{ map: 50, door: 0, leadsTo: 100 }`, authored with the N.js citation). A generator cross-check fails CI if `maps.fact.maps` stops saying that map 50's door 0 leads to map id 100 (by id, never by name).
- **FR-3 Home.** `SYSTEM_HOMES.bubba = { page: 'bubba' }`, and `SYSTEM_PAGES.bubba` is a `lazyPart` chunk, `apps/activeon/src/bubba/BubbaPage.tsx` (M17 TR-7, M21 FR-S3). The Systems hub shows the tile in the World 3 band with its own 16 px glyph (`systems-bubba`, a new motif: a round seal holding a meat slice, our own drawing, ADR 0009). A locked tile reads "Opens: open YumYum Grotto's door to World 3". Every Bubba Goal's "See it" opens the page, and the hub tile opens it too. Both are within 2 taps of Now ("features need a home").

### 3.2 Start and restart (F2)

- **FR-4 Not started (account Goal).** When `bubba/unlocked` is `yes` and the record shows no progress ever (1st Slice level 0, Megaflesh 0, Boon 0, meat ≤ 1), `bubba.check.start` fires with:
  - text: "Start Bubba: open the Codex, tap Bubba, buy 1st Slice";
  - why: "Bubba makes Meat Slices even while you're away, and its Boon adds 7 permanent bonuses to your whole account";
  - category `compounding`, effort 60 s.

  It is one account Goal (DS-25), never a line per character. While 1st Slice is 0 the production rate is 0, so FR-20 shows no "out of reach" bars; the page reads "Not making meat: buy 1st Slice".
- **FR-5 Restart after a Megaflesh.** When Megaflesh ≥ 1 and 1st Slice is at level 0, the same entry fires with the restart text: "Buy 1st Slice again: Bubba makes nothing until you do". Its why is "Megaflesh set every upgrade back to 0, 1st Slice included", and its urgency is `losing-now` (F-b: no production at all). This case makes the System **wasting** (M17 FR-17).
- **FR-6 Which character opens it, and logging in.** When fewer than all characters have the door open, the Next Action names one that has it, the last-played one if it qualifies (`lastPlayedCharacterIndex`), else the highest level. For example: "on your Squire Lv 85". A character that hasn't opened the door sees Bubba locked in its Codex (F-a). The login loop consumes Bubba's away time on any character but credits it only on one with the door open (F-b). So while some characters lack the door and Bubba is started, the page and the Goal's why sheet add: "Bubba collects your away time only when you log in on a character that has opened YumYum Grotto's door".

### 3.3 Run Checks (F3)

- **FR-7 Megaflesh.** `bubba.check.megaflesh` fires when the Megaflesh upgrade is open (`totalUpgTypesAvailable > 8`) and the projected meat (F-b) ≥ its `cost`.
  - **Text:** "Buy Megaflesh {n}: {effect}", where the effect is the next row's short label, authored beside the game's text in `bubba.fact.megaflesh` (for example "account bonuses 1.40x"). The game's own text ("Bubba's IdleOn Bonuses are now all 1.40x higher") is in the why sheet.
  - **Details**, in order:
    1. "First buy Boon {L+1} ({delta}) with the leftover". It repeats while Boon levels fit in the leftover (any Boon level, below or above 7), then covers Fun Gifts while it is below its cap of 6. It shows only when the leftover covers one (FR-9).
    2. "Then buy 1st Slice right away to restart".
    3. "Charisma levels and XP reset too": only when Charisma has levels.
  - Category `spendable`, urgency none (nothing is lost by waiting, except the run's growth).
  - **It silences the run Checks that a reset wipes.** While FR-7 fires, the Smoker (FR-10), Charisma idle (FR-12) and mid-run Boon (FR-8, FR-9's 10% case) Checks are silent. Their value is reset (F-d) or folded into detail 1. Pat then gift (FR-11) stays, because Beeg Slice grows the leftover.
  - A cost stored as `null` (overflow or non-finite, TR-2) is `unknown` and never fires. The page reads "out of reach".
- **FR-8 Boon to 7.** While Boon < 7, `bubba.check.boon` fires when the projected meat ≥ the Boon `cost`.
  - **Text:** "Buy Bubba Boon {L+1}: adds {delta} to your whole account". The delta is X1's `boonNextDelta` at the current Megaflesh multiplier, for example "+12% Build Rate" at Megaflesh 3. Without X1 the delta is hidden ("Buy Bubba Boon 5: adds All Kills to your whole account").
  - **Why:** "Each of the first 7 levels opens a new permanent bonus, and Boon never resets".
  - Category `spendable`.
- **FR-9 Boon past 7: the leftover and the 10% rule.** From Boon 7 on, the Boon Check fires in two cases:
  - **Leftover:** with FR-7, as its first detail, when `projected meat − Megaflesh cost ≥ Boon cost`. The leftover is lost at the reset (F-d). The detail also says "(+{delta after} after this Megaflesh)" when the next Megaflesh raises the multiplier.
  - **Cheap mid-run:** on its own, when FR-7 doesn't fire, the projected meat ≥ the Boon cost, and the Boon cost ≤ **10% of the next Megaflesh cost**. A buy that small delays the Megaflesh by at most a tenth of the run.

  **Why the 10%.** Boon's price rises about 10× a level and Megaflesh's about 125×. With the leftover alone, Boon stalls. On the W3-early account, Boon 12 costs 1.33T, 5.4× Megaflesh 4's 245B, so "Megaflesh as soon as affordable" never leaves enough. With the 10% rule:
  - Boon 12 becomes a buy in the Megaflesh 5 run (about 30T, so 1.33T is 4.4%);
  - Boon 13 and 14 become buys in the Megaflesh 6 run;
  - and so on: about two Boon levels per Megaflesh, each delaying it by under 10%.

  The bonus's Stage rating is FR-17's tag. Q3 asks the owner to confirm the threshold.
- **FR-10 Smoker at max quality.** `bubba.check.smoker` fires when all of these hold:
  - `smokerUnlocked`;
  - the projected smoke time (`smokerSeconds + (now − lastCloudSave)`) ≥ `SMOKER_MAX_QUALITY_SECONDS`;
  - the Smoker `cost` ≤ the projected meat;
  - Slabcakes is **not** a picked gift. With Slabcakes, a timer held at max feeds every Open Gift a top-quality meat, so holding it is the right play (F-i).
  - FR-7 is not firing (a claim before a reset is wiped, F-d).

  **Text:** "Claim the Smoker: buy a Smoker level now". From Megaflesh 9 it is "Claim the Smoker: buy Smoker levels until its timer resets" (the 70% free roll, F-i).

  **Why:** "Smoked meat quality stops rising after 16h 11m of smoking".

  Category `spendable`, **no urgency**. Like a quick-collect cap (R-PILL-1, M17 FR-17), it never makes Bubba wasting, because the only loss is time, not a resource. When the Smoker isn't affordable, the Check stays silent and the page shows "Smoker at max quality · needs {cost − meat} more meat".
- **FR-11 Pat, then Open Gift.** `bubba.check.pat-gift` fires when all of these hold:
  - Happi Boi ≥ 1;
  - pats left ≥ 1 (F-h);
  - Open Gift is open and affordable at the projected meat;
  - **Beeg Slice is one of the picked gifts** (raw `[0][2] == 1 || [0][3] == 1`). The other gifts' triggers ignore happiness (F-h).

  **Text:** "Pat Bubba {n} times, then buy Open Gift right away".

  **Detail:** "His happiness fades within seconds, so buy Open Gift straight after".

  Category `nice`, effort 60 s. **Pats left** comes from X1's `patsPerHour`. Without X1, the Check fires only when a refill is due (`lastCloudSave + (3600 − timer) × 1000 ≤ now`) and `[0][5] ≤ 0`, so at least one pat is certain. The text then reads "Pat Bubba until he stops, then buy Open Gift right away" (DS-3). In any other case it is `unknown`. Pats on their own are never a Now Goal (D-5, Q1), and the double pat is a page tip only (F-h).

### 3.4 Charisma Chart (F4)

- **FR-12 Idle training.** `bubba.check.charisma-idle` fires when all of these hold:
  - the Charisma Chart is open;
  - at least one attribute is below its max;
  - FR-7 is not firing;
  - no attribute is selected (`[0][6] == 0`), or the selected one is at its max (X1's `charismaMaxLevel`, 120 at this patch).

  - **Text:** "Train another attribute in Bubba's Charisma Chart: tap one that isn't maxed". It doesn't name the attribute, because FR-14 is Contested (Q2).
  - **Why:** "{selected} is at its max of 120. XP keeps banking until you pick another, and the next Megaflesh wipes it". When nothing is selected, the why is "No attribute is training".
  - **Details:** "About {k} levels of XP are waiting", where `k = min(X1's charismaLevelsBanked, max − level of the lowest attribute)`, computed at `now`. X1 exports the uncapped count from the projected XP. Hidden without X1.
  - Category `compounding`, urgency always `banked`. When every attribute is at max, it never fires.
- **FR-13 What the next level buys.** For each attribute the page shows its level of 120 and its bonus now and after one more level. Both come from X1 (`charismaBonus[i]`, `charismaBonusNext[i]`), in the game's own label ("Rizz 0 → 1: −2.06% Costs"). Without X1 only the levels show. With X1, the time to the next level of the selected attribute is `(xpReq − xpAtNow) / xpPerSec`, shown as "next level in 4m".
- **FR-14 Training targets (`bubba.priority.charisma`, authored, `status: contested`).** The page shows two community targets side by side, per run (the levels reset, F-g), each with its Source and confidence L:
  - **gameslikefinder** (2026-05-27, tier 3, low trust):
    - Hustle first;
    - about Hustle 45 / Rizz 15 / Joy 15 at Megaflesh 3;
    - Hustle and Rizz at max by Megaflesh 4;
    - from Megaflesh 6: Mindful 120 (emulsified), Rizz 100, Hustle 80, Joy 30;
    - from Megaflesh 9: Savvy 10–20.
  - **vortexgaming.io** (undated, tier 3): Rizz first, then Hustle, at Megaflesh 1–4.

  They disagree on the first attribute, so under ADR 0004's amendment the entry is **Contested**. The page shows the targets as "community targets", with each attribute's gap to them, and no Goal names an attribute (FR-12). The test is the rendered gap per attribute, not a pick.
- **FR-15 Emulsify.** From Megaflesh 6 (row 6 owned), when nothing is emulsified (`[0][15] == 0`), the page reads "Emulsify: double-tap your training attribute to make it 3x". The page adds "The gameslikefinder guide emulsifies Mindful from Megaflesh 6", with its Source. Emulsify is never a Now Goal (D-8).

### 3.5 Priority Lists (F5)

- **FR-16 The run order (`bubba.priority.run`, authored, `list: order`).** These are ordered tiers. Inside a tier, the cheapest open upgrade comes first.
  1. **Restart:** 1st Slice when its level is 0 (FR-5).
  2. **Megaflesh** when affordable, after the surplus rule (FR-7, FR-9).
  3. **Boon below 7** (FR-8).
  4. **Production:** 1st, 2nd and 3rd Slice; Good, Great and Best Meat; Crossover (once Poppy has fish).
  5. **Feature openers at their first level:** Happi Boi, Charisma, Fun Gifts, Open Gift, Dice Roll, Smoker, Spare Coins.
  6. **Discounts, only when they pay back:** Bargain, Cost Saver, Perma Sale.
  7. **Everything else** (Buyer Grin, Super Chart, More Dice, More Sides, Uber Gifts, Real Love, Loaded Dice, 2X Smoke, Big Ol Coin), cheapest first.

  **The payback test** uses X1's `discountNextRatio[i]`: the factor by which every later cost falls if discount `i` gains a level (the game's cost function, evaluated by Toolbox). It **pays back** when its cost ≤ `(1 − ratio) × the next Megaflesh cost`, the rest of this run's spend. That is a lower bound, because Megaflesh dominates the run (its price rises 125× a level). The rule is our own and is cited as the owner's brief. The idea that discounts are worth it only before a big purchase is common clicker practice, but no Bubba Source gives a rule, so the confidence is M.

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

- **FR-18 One account Goal.** The engine module `bubba` (`after: true`) collects the firing Bubba Checks and emits **one account Goal**, `bubba.goal.visit`, titled "Bubba". Its single Next Action is the highest-ranked firing Check in `bubba.priority.visit`:
  1. start or restart;
  2. Megaflesh, with its leftover details (it silences 3–5, FR-7);
  3. Boon (below 7, or the 10% rule);
  4. Smoker;
  5. Charisma idle;
  6. pat then gift.

  The other firing Checks are its details ("also in Bubba: Smoker at max quality"), at most 2, then "+n more · see Bubba". The Goal's category, urgency and Sources are its Next Action's. **Its key is stable**: `bubba.goal.visit@account`, whatever the Next Action. So Skip today and Not for me (M10, keyed by Goal key) hold for the whole Goal through the day, even when the top Check changes (one System, one card, DS-25). The page still lists every finding.
- **FR-19 Ranking on Now.** `bubba.goal.visit` is one static tier, `[bubba.goal.visit]`, inserted in four Stage lists:
  - `metapath.priority.w3-early`: after `[construction.check.build-next]`;
  - `w3-mid`, `w3-late`, `w4-entry`: after `[alchemy-bubbles.goal.level-next, alchemy-vials.goal.level-next]` (those lists have no Construction tier).

  Accounts past W4-entry use the W4-entry list (M2's last Stage). Inside the tier, M2's comparator orders by urgency (M6 TR-9), so a restart (`losing-now`) still ranks first among equals. Bubba never outranks the W3 engine (Construction, Death Note, salts).
- **FR-20 Timeline bars (account lane "Bubba").** Every `at` is in epoch ms, anchored at the save. `rate` is per minute, so it is divided by 60 to get meat per second.
  - **Megaflesh affordable:** kind `production`, `at = lastCloudSave + (cost − meat) / (rateBase / 60) × 1000`.
  - **Smoker at max quality:** kind `time-cap`, `at = lastCloudSave + (SMOKER_MAX_QUALITY_SECONDS − smokerSeconds) × 1000`.
  - **Pats refill:** kind `timer`, `at = lastCloudSave + (3600 − timer) × 1000`, only while Happi Boi ≥ 1. When that is ≤ `now`, there is no bar, and the page reads "Pats full when you open Bubba".
  - **Boon {L+1} affordable:** kind `production`, while Boon < 7 or the 10% rule applies.

  When the rate is 0 (not started, or just after a Megaflesh), there are no production bars (FR-4, FR-5).

  `effect` is `'next-action'` while the matching Check fires, else `'info'`. A bar whose `at` is more than 365 days away, or not finite, is untimed with "out of reach" (Toolbox shows "A long time"). All are account bars, so they never touch a character Verdict.
- **FR-21 Determinism and fail closed.** The same Account State, Knowledge Base and `now` give byte-identical output. A Check that reads an unknown field is `unknown` with a diagnostic (M11), and nothing is offered from an unknown cost or meat. `EmptyAccountError` gives no M23 output. A `bubba` section failure in Toolbox (`safeSection`) makes `account.bubba` unknown, and the page shows "Can't read Bubba from this save".

### 3.7 The Bubba System page (F7)

- **FR-22 Two kinds of bonus, said plainly.** The page has two clearly separated parts:
  - **"Bubba's bonuses to your account"**: a **text list** of the seven Boon bonuses with their current totals ("+24% Build Rate", or "+1.2 base critters per trap" for Critter Gain, F-f). It is not a picture, so DS-20's label cap doesn't apply. It also says "Permanent. From Bubba Boon, boosted by Megaflesh ({x}x now)", with the multiplier from X1's `megafleshMultiplier`.
  - **"Inside Bubba"**: everything else, with the line "These boost Bubba's meat only, and reset at every Megaflesh". The Charisma Chart section repeats it under its heading: "Charisma boosts Bubba only. Your account bonuses come from Boon".
- **FR-23 Layout** (M21 FR-S3, step first on a phone, split from 1000 px; Phase F atoms only):
  1. **The step:** the Goal's Next Action as a `TokenLine` (who · where · how long), or "Nothing to do in Bubba right now" with the next Timeline time ("Megaflesh 4 in 12h 52m", `inSpan`, DS-6). This is the page's one lit element (FR-S6).
  2. **Bonus list:** FR-22's seven lines in rotation order, each with FR-17's tag as a `Chip`. The next Boon level's line is marked "Lv 12 adds +1.2% All Kills · {cost} meat · in {span}". A tap opens a `Sheet` with the stack count and where the bonus applies (the Toolbox readers).
  3. **Megaflesh track:** 11 pips plus a Chromatic count, owned ones filled. The next pip has its effect text and a `Meter` showing projected meat against cost ("90B of 245B · in 12h 52m").
  4. **This run:** meat per minute, projected meat, the next upgrade type ("More Dice opens at 2.98T meat made this run"), and the folded "Next buys" (FR-16, at most 3 rows, then "show all").
  5. **Side panels** in a grid (two columns from 720 px):
     - **Pats:** pips N of N (the count is hidden without X1), the refill time, and two tips: "Pat, then Open Gift with Beeg Slice picked", and the double pat ("pat a few seconds before the refill, then again after").
     - **Smoker:** a `Meter` to 16h 11m, "claim at max", and the guide's note that claiming every ~13 h trades a little quality for more meats (gameslikefinder, L).
     - **Charisma Chart:**
       - six `Meter`s of 120;
       - a `Badge` on the training one ("training", or "max");
       - "3x" on the emulsified one;
       - FR-13's next-level line;
       - FR-14's two community targets, muted, with their confidence;
       - FR-15.
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
- **Given** the W3-early account at the golden clock **When** the engine runs **Then** the Account section has one "Bubba" Goal. Its Next Action is "Train another attribute in Bubba's Charisma Chart: tap one that isn't maxed", with the why "Hustle is at its max of 120. XP keeps banking until you pick another, and the next Megaflesh wipes it". With X1 it adds the detail "About 60 levels of XP are waiting" (the golden pins the exact number). Megaflesh and Boon don't fire, and the pat-gift Check doesn't fire (Beeg Slice is picked, but Open Gift costs 100B, more than the projected 90B). No character card mentions Bubba.
  - The fixture at the golden clock: projected meat about 90B; Megaflesh 4 costs 245B; Boon 11; Smoker locked; Hustle selected at 120; 776K Charisma XP at the save, about 1.02M at the golden clock (9.15 XP/s); gifts Beeg Slice and Beach Ball.
- **Given** the W2-late account **When** the engine runs **Then** there is no Bubba output, and the hub's World 3 band shows the Bubba tile locked: "Opens: open YumYum Grotto's door to World 3".
- **Given** the W3-early account mutated to 1st Slice 0, Megaflesh 0, Boon 0 and meat 0 **When** the engine runs **Then** the Goal reads "Start Bubba: open the Codex, tap Bubba, buy 1st Slice", category `compounding`, and the Timeline has no Bubba production bars.
- **Given** the W3-early account mutated to Megaflesh 4 and 1st Slice 0 **When** the engine runs **Then** the Goal reads "Buy 1st Slice again: Bubba makes nothing until you do", urgency `losing-now`, and the hub marks Bubba wasting.

**US-2. Don't let the Smoker sit, unless you mean to.** As a player, I want to know when the Smoker has reached its best quality, without being told to break a Slabcakes loop.
- **Given** `latest.json` (smoke time 341,380 s at the save; Smoker cost about 3.8 × 10^14 against about 10^22 meat; gifts Slabcakes and Surprise Box) **When** the engine runs **Then** the Smoker Check is silent, and the page's Smoker panel reads "At max quality · held for Slabcakes".
- **Given** `latest.json` mutated to gifts Beeg Slice and Surprise Box **When** the engine runs **Then** the Bubba Goal's Next Action is "Claim the Smoker: buy Smoker levels until its timer resets" (Megaflesh 12, so the 70% free roll applies), with no urgency, and the hub does **not** mark Bubba wasting.
- **Given** `highend.json` (smoke time 17,523 s) **When** the engine runs **Then** the Smoker Check is silent, and the Timeline's Bubba lane has "Smoker at max quality" at `lastCloudSave` + 11 h 18 m.

**US-3. Megaflesh, with nothing wasted.** As a player, I want to Megaflesh as soon as I can, spending the leftover on what survives. Each case sets `now` to the save time, so the meat is the mutated value.
- **Given** the W3-early account mutated to 260B meat **When** the engine runs **Then** the Next Action is "Buy Megaflesh 4: account bonuses 1.40x". The details are "Then buy 1st Slice right away to restart" and "Charisma levels and XP reset too". The Charisma idle Check is silent (FR-7). There is no Boon detail, because the 15B leftover is less than Boon 12's 1.33T.
- **Given** the same account mutated to 1.6T meat **When** the engine runs **Then** the first detail is "First buy Boon 12 (+1.2% All Kills, +1.4% after this Megaflesh) with the leftover".
- **Given** the W3-early account unmutated **When** the Timeline renders **Then** the Bubba lane shows "Megaflesh 4 affordable" at about the golden clock + 12 h 52 m.

**US-4. Boon to 7.** As a new Bubba player, I want each Boon level that opens a new account bonus.
- **Given** the W3-early account mutated to Boon 4 with 100M meat (Boon 5 costs well under that, F-f) **When** the engine runs with X1 **Then** the Next Action is "Buy Bubba Boon 5: adds +1.2% All Kills to your whole account" (Megaflesh 3's 1.2x). The page's bonus list marks All Kills, tagged `low` at W3-early.
- **Given** the W3-early account mutated to Boon 4, Megaflesh 0 and meat that covers Megaflesh 1 and Boon 5, 6 and 7 **When** the engine runs **Then** the Next Action is "Buy Megaflesh 1", and its first details buy Boon 5, 6 and 7 with the leftover (FR-7 detail 1, any Boon level).

**US-5. Pat, then gift, only with Beeg Slice.** As a player, I want the hourly pats used where they count.
- **Given** `latest.json` mutated to gifts Beeg Slice and Slabcakes (Happi Boi 145 + 15 prestige, so 11 pats an hour; −10 used; a refill is due; Open Gift affordable) **When** the engine runs with X1 **Then** the Bubba Goal carries the detail "Pat Bubba 21 times, then buy Open Gift right away". The Next Action is the Charisma idle Check (FR-18 order; the Smoker stays silent with Slabcakes).
- **Given** unmutated `latest.json` (Slabcakes and Surprise Box) **When** the engine runs **Then** the pat-gift Check is silent.
- **Given** the W3-early account at the golden clock **When** the page renders **Then** the Pats panel shows "10 of 10 · full when you open Bubba", and no pat Goal fires.

**US-6. My account bonuses, not my Charisma.** As the owner, I want to see which Bubba bonuses reach my account and which only help Bubba.
- **Given** the W3-early account **When** the player opens the Bubba page **Then** "Bubba's bonuses to your account" lists "+24% Build Rate, +1.2 base critters per trap, +12% Soul Gain, +36% Total Damage, +1.2% All Kills, +4.8% Class EXP, −3.6% Atom Cost", with "boosted by Megaflesh (1.2x now)". The Charisma section is headed "Charisma boosts Bubba only. Your account bonuses come from Boon". It shows:
  - Hustle 120 of 120 (training, max);
  - the other five at 0;
  - with X1, "Rizz 0 → 1: −2.06% Costs" (Super Chart 3);
  - both community targets with their gaps.

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
  ratePerMin: number;           // Toolbox meatsliceRate (per minute), at the save's happiness
  rateBase: number | null;      // X1 meatsliceRateBase: the rate at happiness 0 (F-b); null until X1
  happiness: number;            // raw [0][1]
  produced: number;             // Toolbox progress (meat made this run)
  nextTypeAt: number;           // Toolbox progressReq
  types: number;                // Toolbox totalUpgTypesAvailable (1..28)
  levels: number[];             // 28, Toolbox upgrades[i].level
  prestige: number[];           // 28, Toolbox upgrades[i].prestige (free levels)
  costs: (number | null)[];     // 28, Toolbox upgrades[i].cost; non-finite stored as null (unknown, never affordable)
  megaflesh: number;            // Toolbox megafleshOwned
  bonuses: [number, number, number, number, number, number, number]; // Build, Critter, Soul, Damage, Kills, EXP, Atom
  smoker: { unlocked: boolean; seconds: number };     // Toolbox smokerUnlocked, smokerSeconds
  pats: { used: number; timer: number; perHour: number | null };      // raw [0][5], [0][13]; X1
  charisma: {
    levels: [number, number, number, number, number, number];         // raw [3]
    selected: number;           // raw [0][6], 0 = none, 1..6
    emulsified: number;         // raw [0][15], 0 = none
    xp: number;                 // raw [0][8]
    levelsBanked: number | null; // X1, uncapped, at the save
    xpReq: number | null;        // X1
    xpPerSec: number | null;     // X1
    maxLevel: number | null;     // X1 (120 at this patch)
    bonus: number[] | null;      // X1, 6, each attribute's CharismaBonus now
    bonusNext: number[] | null;  // X1, 6, at +1 level
  };
  boonNextDelta: number | null;  // X1: the next Boon level's added %, at the current multiplier
  megafleshMultiplier: number | null; // X1
  discountNextRatio: [number, number, number] | null; // X1: Bargain, Cost Saver, Perma Sale
  gifts: [number, number];      // raw [0][2], [0][3]
}
// AccountSummary
bubba?: BubbaState | null;
```

- **Sources.** Toolbox paths for the parsed values, and `RawKeySpec('Bubba', 'json')` for the raw indices, the way M6's `account.poppy` and M21's `doorKillsLeft` read raw keys (`bubba-fields.ts`). Reading a raw save value is not a formula. Every formula behind the X1 fields stays with Toolbox (TR-6).
- **Size.** About 1.5 KB per save: 84 numbers in the three 28-arrays (mostly short integers; costs at full precision about 600 B) plus the X1 fields. The largest public save, `highend.json`, is at 351.9 KB under the 360 KB history guard (M21 TR-3), so this takes it to about 353.4 KB. That 8 KB headroom is shared with any other in-flight schema bump, so the build PR measures **every** public save after rebasing and adds an "M23 TR-2" line to the guard's comment. If the guard would be passed, costs keep only the entries for open upgrades (`index < types`) and the rest are null.
- **Not stored.** Descriptions, names and the megaflesh text are game data in the fact tables (TR-3).

### TR-3 Fact tables (ADR 0007)

| id | Origin | Contents | Source |
|---|---|---|---|
| `bubba.fact.upgrades` | generated from `bubbaUpgrades` | index, name, `x1`–`x4` (`x4 = 999` means no cap), which persist through Megaflesh (3, 8, 9), the run-order tier (authored column) | Toolbox `shared-data.json`; wiki Bubba |
| `bubba.fact.megaflesh` | generated from `generalSpelunky[38]`, `[42]` | 12 rows: name, effect text (with `@` as a line break), an authored short label per row ("account bonuses 1.40x"); the account-bonus multiplier rows (2, 4, 7, 10, 12) | same |
| `bubba.fact.boon` | generated from `generalSpelunky[33]` and Toolbox's bonus map | 7 bonuses: key, name, per-stack %, negative flag (Atom Cost) | same |
| `bubba.fact.charisma` | generated from `generalSpelunky[35–37]` | 6 attributes: name, per-level value, the game's effect label (the cap comes from X1, not this table) | same; N.js `CharismaTraitREQ` |
| `bubba.fact.gifts` | generated from `generalSpelunky[39–41]` | 6 gifts: name, passive and trigger text | same |
| `bubba.fact.unlock` | authored | `{ map: 50, door: 0, leadsTo: 100 }`, cross-checked against `maps.fact.maps` | N.js `BubbaUnlocked` |

The authored entries in `bubba.yaml` are the six Checks and `bubba.goal.visit` (TR-4), `bubba.priority.run`, `bubba.priority.visit`, `bubba.priority.charisma` and `bubba.priority.boon-bonuses`. Size is about 6 KB raw, inside the Knowledge Base headroom left after M18 and M19 (about 65 KB raw, README).

### TR-4 Entries (#11 shape; **A** = authored)

| Entry id | Type | Detector | `doneWhen` | Notes |
|---|---|---|---|---|
| `bubba.check.start` | check (account) **A** | `bubba/start` | `account.bubba.levels[0]` higher | FR-4, FR-5 (two texts, `values.mode`) |
| `bubba.check.megaflesh` | check (account) **A** | `bubba/megaflesh` | `account.bubba.megaflesh` higher | FR-7, FR-9 details |
| `bubba.check.boon` | check (account) **A** | `bubba/boon` | `account.bubba.levels[3]` higher | FR-8 |
| `bubba.check.smoker` | check (account) **A** | `bubba/smoker` | `account.bubba.smoker.seconds` lower | FR-10 |
| `bubba.check.pat-gift` | check (account) **A** | `bubba/pat-gift` | `account.bubba.levels[10]` higher | FR-11 |
| `bubba.check.charisma-idle` | check (account) **A** | `bubba/charisma-idle` | `account.bubba.charisma.selected` changed | FR-12 |
| `bubba.goal.visit` | goal (account, details) **A** | engine module `bubba` | — | FR-18; stable key `bubba.goal.visit@account` |
| `bubba.priority.run`, `.visit`, `.boon-bonuses` | priority **A** | — | — | FR-16–FR-18 |
| `bubba.priority.charisma` | priority **A**, `status: contested` | — | — | FR-14; page only |
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
  boonNext: { level: number; key: BoonKey; addPct: number | null; cost: number | null; at: number | null } | null;
  megaflesh: { owned: number; next: { row: number; label: string; text: string; cost: number | null; at: number | null } | null; multiplier: number | null };
  run: { ratePerMin: number; nextType: { name: string; at: number } | null; nextBuys: Array<{ index: number; name: string; cost: number; tier: number }> };
  pats: { left: number | null; perHour: number | null; refillAt: number | null } | null;
  smoker: { seconds: number; maxAt: number | null; atMax: boolean; heldForSlabcakes: boolean; cost: number | null } | null;
  charisma: null | {
    attrs: Array<{ index: number; name: string; level: number; nowPct: number | null; nextPct: number | null; training: boolean; emulsified: boolean; targets: Array<{ source: string; target: number | null }> }>;
    nextLevelAt: number | null; banked: number | null; emulsifyOpen: boolean;
  };
  gifts: string[];
  loginNote: boolean;                    // FR-6's away-time line
}
// EngineResult addition
bubba?: BubbaResult | null;
```

`buildNowView` passes it through as `view.bubba`, and the lazy chunk only formats it.

### TR-6 X1: the Toolbox fork export (cross-repo request)

One small commit to the owner's fork (`YassSoliman/IdleonToolbox`, the repo `UPSTREAM` pins). It adds these outputs to `parseBubba`, each a call to a function the game defines (cited by its `Bubbastuff` name):
- `patsPerHour` (`DailyPetting`; Toolbox's `getDailyPetting` already exists unexported);
- `meatsliceRateBase`: `MeatsliceRate` with happiness 0 (`HappinessBonus` at H = 0), per minute like `meatsliceRate`;
- `charismaXpReq` (`CharismaTraitREQ`), `charismaXpPerSec` (`CharismaTraitSPD`), `charismaMaxLevel` (120);
- `charismaLevelsBanked`: how many levels the banked XP buys at the current total, uncapped (one REQ per level, as the game's loop does). M23 caps it per attribute;
- `charismaBonus[6]` and `charismaBonusNext[6]` (`CharismaBonus` now and at +1 level, emulsify included);
- `boonNextDelta` (`BubbaRoG_Bonuses` of the next rotation's bonus at L + 1 minus at L) and `megafleshMultiplier` (`1 + Bubba_RoG_all/100`);
- `discountNextRatio[3]`: `UpgCost` of any upgrade with the discount at L + 1, divided by at L, for Bargain, Cost Saver and Perma Sale;
- named constants: `PATS_HOUR_SECONDS` (3600), `BEEG_SLICE_SECONDS` (1200), next to the existing `SMOKER_MAX_QUALITY_SECONDS`.

Each comes with a `live-verified` test in the fork's style (`latest.json`, the account that test already reads). Then `pnpm sync-parsers` picks them up. Until then the fields are `null`, every line that needs them hides that token (DS-3), and a Check whose firing condition needs one is `unknown` (FR-21), except the stated fallbacks (FR-11, F-b). This keeps ADR 0005: the formulas live in Toolbox, and M23 does arithmetic only (comparisons, sums, differences of Toolbox outputs, and time from rate).

### TR-7 Cross-module wiring

- **M2:** the `[bubba.goal.visit]` tier of FR-19 in four Stage lists.
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
- **Account State.** +1.5 KB per save (TR-2).

### TR-9 Storage, security and privacy

M23 stores nothing new, and skips and dismissals use M10's store. Nothing leaves the device. Tests and goldens print no names. The W3-early numbers in this spec are aggregates of the scrubbed fixture, which is public already.

### TR-10 Tests

- **Detector examples** (TR-4).
- **Contract test:** `account.bubba` is null on `first`, `second`, `third` and `fourth` (no Bubba record) and filled on the others, and the size guard holds (TR-2).
- **Rotation:** for Boon levels 0–30, the bonus added by level `L + 1` is `(L mod 7) + 1`, and the stack count matches Toolbox's bonus divided by the per-stack value × multiplier (F-f).
- **Leftover and 10% rules** (FR-7, FR-9): the leftover never spends below the Megaflesh cost, covers any Boon level, and stops at Fun Gifts' cap; the mid-run Boon fires only at ≤ 10% of the next Megaflesh cost; while FR-7 fires, the Smoker, Charisma idle and mid-run Boon Checks are silent.
- **Gift gates:** pat-gift fires only with Beeg Slice picked; the Smoker Check is silent with Slabcakes picked.
- **Timeline units** (FR-20): with `rateBase` = 60 per minute and `cost − meat` = 60, `at = lastCloudSave + 60,000 ms`.
- **Stable key** (FR-18): skipping the Goal, then changing which Check is on top, keeps it skipped.
- **Payback** (FR-16): a discount whose cost exceeds its saving on the Megaflesh is never in "Next buys".
- **Projection** (F-b): with `now` = `lastCloudSave`, the projected meat equals `meat`, and it rises linearly after; with `happiness > 0` and no X1, every projection is hidden.
- **Goldens:** a `## Bubba` section in the Now text snapshot (step, details, bonus strip, Megaflesh next, Charisma lines) on the four fixtures.

## 6. States and edge cases

| State | Behaviour | Where |
|---|---|---|
| No `Bubba` key in the save (old saves, public `first`–`fourth`) | `account.bubba` null. If the unlock Detector says `yes`, the page reads "Can't read Bubba from this save" | FR-21 |
| Record present, all zeros, door not open (W2-late) | Locked tile, no output | FR-26 |
| Record all zeros, door open | Start Goal | FR-4 |
| Just Megaflesh'd (1st Slice 0) | Restart Goal, `losing-now` | FR-5 |
| Some characters haven't opened the door | Next Action names one that has; the page warns that logging in on the others loses Bubba's away time | FR-6, F-b |
| Stale save (M1) | Projections run from `lastCloudSave` to `now` (no away cap, F-b), so a stale save still says "Megaflesh affordable" correctly if the rate held. DS-11's age wording applies | F-b |
| Save taken mid-patting (happiness > 0) | Projections use `rateBase`; without X1 they are hidden | F-b |
| Game open on Bubba now | Saves every few minutes; projection adds only seconds | F-b |
| Cost overflow (`Infinity`) at high levels | Stored as null, "out of reach", never fires | FR-7, TR-2 |
| Megaflesh 12+ (Chromatic) | Track shows "Chromatic × n"; the next row is Chromatic again | F-e |
| Boon cost past 1e300 | Same as overflow | FR-20 |
| Charisma attribute above 120 (gifts can push past, per the vortexgaming guide; Numbahs' trigger adds +1 LV) | Shown as its level; it counts as maxed for training (the game stops training at ≥ 120) | FR-12, V-5 |
| Every Charisma attribute at max | FR-12 never fires; the panel reads "All maxed this run" | FR-12 |
| Slabcakes picked, Smoker at max | No Smoker Check; "held for Slabcakes" | FR-10 |
| X1 not landed | Counts and deltas hidden; Checks that need an X1 number to fire are `unknown`, except the fallbacks | TR-6 |
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

❓ Q1 - Pats on Now: should ActiveOn ever say "pat Bubba" on its own every hour, or only "pat, then Open Gift" when Beeg Slice is picked and Open Gift is affordable?
➡️ Only the combo. Happiness halves in about 9 s (`HappinessLoss = max(1, H/13)` per second), and only Beeg Slice turns it into meat. A pat with nothing to spend on right away is worth almost nothing, and an hourly line would be the noisiest item on Now. The page always shows the pats and the refill time.

❓ Q2 - Charisma training targets: the only two Bubba guides (both tier 3, one low-trust) disagree on the first attribute (Hustle vs Rizz). Keep the entry Contested, so the Check says "train an attribute that isn't maxed" and the page shows both targets, or pick one guide so the Check names the attribute?
➡️ Keep it Contested. ADR 0004's amendment says a judgment entry whose Sources disagree is Contested, and the save can't settle it. The waste the Check catches (a maxed or empty selection) is real whatever the order, and the page gives both targets with their gaps. If the owner prefers one guide, it's a one-line status change.

❓ Q3 - Boon past 7: buy Boon levels mid-run when one costs at most 10% of the next Megaflesh (FR-9), as well as with the leftover before a reset? Or a different threshold?
➡️ 10%. The leftover alone stalls Boon: on the W3-early account, Boon 12 (1.33T) is 5.4× Megaflesh 4 (245B). At 10%, Boon still gets about two levels per Megaflesh (Boon rises about 10× a level, Megaflesh 125×), and each buy delays the Megaflesh by under a tenth of the run. A lower threshold (5%) gives about one level per Megaflesh; a higher one slows the Megaflesh that multiplies every Boon level already owned.

### 8.2 Self-ruled decisions (with research)

- **D-1 New module, own page.** Bubba is a whole System with seven sub-systems and its own resource. A section on another page would be unfindable ("features need a home"). *Why:* the owner's rule; M18 and M19's precedent.
- **D-2 Unlock is per character, shown per account.** The game's rule is the logged-in character's door (F-a). The account counts as unlocked when any character qualifies, and FR-6 names that character. *Why:* DS-25, plus a real per-character fact.
- **D-3 Megaflesh as soon as affordable, after the leftover.** No guide argues for holding. gameslikefinder's per-Megaflesh income figures (10M/min at MF3 up to 3Q/min at MF8) describe when the next one comes, not a reason to wait. Megaflesh rows 2, 4, 7 and 10 raise the account bonuses, and row 1 multiplies meat by total levels. Holding gains nothing permanent, because the meat resets anyway. Before it, the leftover goes to what survives (Boon, then Fun Gifts), and the run Checks a reset wipes go quiet (FR-7). *Why:* the owner's brief ("Megaflesh early"); F-d. Q3 covers the Boon threshold.
- **D-4 No Goal per upgrade.** A Bubba visit buys dozens of upgrades with "hold to upgrade fast". One Now line per upgrade would be noise against DS-9. The run order lives on the page's "Next buys". *Why:* DS-9, DS-25.
- **D-5 Pats only in the combo, with Beeg Slice.** See Q1. Self-ruled for the build, with the recommendation as the default. Changing it later is one Detector switch. The double pat needs timing to the second, so it is a page tip, not a Now line.
- **D-6 No checklist rows.** Nothing in Bubba resets daily or weekly. Hourly rows would never be "done" and would drag the today ring (M20 FR-6). *Why:* M20's band definitions.
- **D-7 The Charisma targets are Contested and page-only.** The two guides disagree (FR-14), so no Goal names an attribute (Q2). *Why:* ADR 0004's amendment on judgment entries.
- **D-8 Emulsify is page-only.** It's one tap that the game itself explains in the Megaflesh 6 text. As a Goal it would show up once per run and then be done. *Why:* noise.
- **D-9 Stage rating changes no purchase.** The next Boon bonus is fixed by rotation (F-f), so the rating only explains value. *Why:* honesty (DS-23: no invented numbers or choices).
- **D-10 Ask the fork for the numbers instead of writing formulas.** Every game formula M23 needs (pats per hour, the happiness-free rate, Charisma XP and bonuses, the Boon delta, the Megaflesh multiplier, the discount ratio, the constants) is one export from the fork. The owner maintains the fork, the change is about 80 lines with live-verified tests, and ADR 0005 forbids our own game formulas. *Why:* ADR 0005; TR-6.
- **D-11 Orion stays out.** It is M6 D6's "not covered yet". A shared clicker page waits for an Orion spec. *Why:* one concern per PR (AGENTS.md).
- **D-13 Smoker and Charisma never make Bubba wasting.** Their loss is time or a bank that survives until the reset, the class R-PILL-1 and M17 FR-17 keep off the wasting count. Only a stalled restart (no production at all) does. *Why:* M3's R-PILL rulings; M17 FR-17.
- **D-12 Meat is not coins.** Meat uses a plain short-suffix number ("245B meat"), never `formatCoins` or coin tiers. *Why:* M21 FR-F7 reserves coin text for IdleOn coins. Spare Coins are named "Spare Coins" so no one reads them as IdleOn money.

## 9. Red-team notes (author's own pass)

1. **Wrong unlock.** "Reach World 3" (the research's guess) would fire the start Goal on a character that can't open Bubba. *Defence:* the game's own rule (F-a, N.js `BubbaUnlocked`), the W2-late and W3-early door counts, and a CI cross-check on map 50.
2. **Stale meat.** The save's meat is old the moment it's saved. *Defence:* projection from `lastCloudSave` at the happiness-free rate (F-b); N.js shows no away cap.
3. **Telling the owner Charisma helps his account.** *Defence:* FR-22's two-part page and the explicit Charisma heading line, US-6, and F-g's evidence that nothing outside Bubba reads Charisma.
4. **Noise.** Seven Checks could put seven Bubba lines on Now. *Defence:* one account Goal (FR-18); pats only in the combo (D-5); no per-upgrade Goals (D-4).
5. **Wasting the leftover at Megaflesh.** *Defence:* FR-9's surplus detail, F-d's evidence.
6. **Invented numbers.** Banked levels and pats per hour need game formulas. *Defence:* X1, hidden until it lands (DS-3, DS-23).
7. **Patch day.** A cost rebalance like v1.03 moves every number. *Defence:* all costs come from Toolbox at engine time; the fork's live-verified tests fail on drift; the generator cross-checks.
8. **Smoker "max quality" when not affordable.** A claim you can't pay for is a dead end. *Defence:* FR-10 stays silent and the page says how much is missing.
9. **Losing banked Charisma XP to a Megaflesh.** *Defence:* FR-7's detail warns. (The first draft raised FR-12's urgency when a Megaflesh was ready; the red-team showed that inverted the value, RT-3.)

## 10. Red-team log

An independent reviewer, who had not seen the author's reasoning, read this spec, the glossary, the ADRs, M17, M20, M21, the vendored parser, its game data, the fixtures and the game client (`N.js`), and was asked to break it. It returned **28 findings: 2 P0, 6 P1, 14 P2 and 6 P3.** The author re-checked each against N.js, Toolbox or the fixtures.

**Counts.** Fixed: 2 P0, 6 P1, 14 P2 and 5 P3. Deferred: 1 P3. Rejected: none.

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| RT-1 | P0 | Pat, then Open Gift is wrong unless Beeg Slice is picked: only gift 1 uses the happiness-boosted rate (N.js @13076246); `latest` picks Slabcakes and Surprise Box | Fixed | FR-11 needs Beeg Slice; F-h lists each gift's trigger; US-5 rewritten with a mutation |
| RT-2 | P0 | The visit order put the Smoker and Boon-below-7 after a Megaflesh that wipes the Smoker's meats and sets meat to 1 | Fixed | FR-7 spends the leftover on any Boon level, then Fun Gifts, and silences Smoker, Charisma idle and mid-run Boon; FR-18 reordered; US-4 adds the Megaflesh 1 case |
| RT-3 | P1 | Charisma idle rose to `losing-now` exactly when a Megaflesh (which wipes the levels too) is the right step | Fixed | FR-12 is always `banked` and silent while FR-7 fires |
| RT-4 | P1 | The Smoker Check fights the Slabcakes loop (gift smokes at the current quality without a reset) and Megaflesh 9's free roll, and a time-only cap shouldn't make a System wasting | Fixed | FR-10 is silent with Slabcakes, uses "until its timer resets" from Megaflesh 9, and has no urgency (D-13); US-2 rewritten |
| RT-5 | P1 | A 10-minute double-pat window contradicts a ~9 s happiness half-life | Fixed | The double pat is a page tip only (F-h, FR-11, D-5) |
| RT-6 | P1 | Charisma bonus, Boon delta, Megaflesh multiplier and the discount ratio were our own formulas (ADR 0005) | Fixed | All four move to X1 (TR-6); FR-8, FR-13, FR-16 and FR-22 read them; hidden until X1 |
| RT-7 | P1 | The two Charisma guides disagree on the first attribute, so the entry is Contested and can't name a pick | Fixed | FR-14 is `status: contested`, shown side by side; FR-12 names no attribute; Q2 rewritten |
| RT-8 | P1 | Toolbox's rate uses the save's happiness; the away block decays it to 0 first, so a mid-pat save inflates every projection | Fixed | `rateBase` from X1 (happiness 0); without X1, projections only when raw happiness is 0 (F-b, TR-2) |
| RT-9 | P2 | Timeline `at` mixed a per-minute rate and epoch ms | Fixed | FR-20 writes each formula with `/60` and `× 1000`, anchored at `lastCloudSave`; TR-10 unit test |
| RT-10 | P2 | The pats bar could land in the past (timer > 3600) | Fixed | Anchored at the save; no bar when due, "full when you open Bubba" |
| RT-11 | P2 | A −1 cost sentinel fails open in `meat ≥ cost` | Fixed | Non-finite costs are null, read as unknown (TR-2, FR-7) |
| RT-12 | P2 | Bonus examples skipped the Megaflesh multiplier (+1% vs +1.2%) | Fixed | X1's `boonNextDelta` at the current multiplier, and "+x after this Megaflesh" (FR-8, FR-9, US-3, US-4) |
| RT-13 | P2 | FR-19 named a tier that exists only in `w3-early` and a conditional tier member | Fixed | One static `[bubba.goal.visit]` tier, placed per list; urgency orders inside it |
| RT-14 | P2 | FR-14's targets were untestable and "all maxed" undefined | Fixed | The test is the rendered gap per attribute; FR-12 never fires when all are maxed; states table row |
| RT-15 | P2 | "in about 20h" breaks DS-6 | Fixed | `inSpan` ("in 12h 52m") in FR-23 |
| RT-16 | P2 | FR-22 (all seven totals) clashed with DS-20 (label only four) | Fixed | The account bonuses are a text list, not a picture |
| RT-17 | P2 | FR-11 couldn't be evaluated without X1 | Fixed | A due-refill fallback, else `unknown` |
| RT-18 | P2 | Skips keyed by Next Action would let a skipped Bubba Goal come back | Fixed | Stable key `bubba.goal.visit@account` (FR-18, TR-4, TR-10) |
| RT-19 | P2 | V-1 and V-3 are settled by N.js: no away cap; logging in on a door-less character loses Bubba's away time | Fixed | F-b, FR-6's login line in Phase 1, V-1 and V-3 marked settled (author re-read N.js @15027063 and @15262417) |
| RT-20 | P2 | "Gone through" the door is wrong (opened); map 100 is `Frostbite_Towndra` in data | Fixed | "opened YumYum Grotto's door"; the cross-check is by map id |
| RT-21 | P2 | Hard-coded constants (120, 58,254 s, 3600 s, 1,200 s) escape patch-day checks | Fixed | Toolbox's `SMOKER_MAX_QUALITY_SECONDS` and X1's named constants (F-i, TR-6) |
| RT-22 | P2 | Q3's "two Boon levels per Megaflesh" didn't hold with the leftover alone | Fixed | Recomputed: leftover alone stalls; FR-9 adds the 10% mid-run rule with the arithmetic; Q3 asks the threshold |
| RT-23 | P3 | US-3's leftover ignored the projection | Fixed | US-3 sets `now` to the save time |
| RT-24 | P3 | Banked levels at the save, not now; Toolbox can't know the next attribute | Fixed | X1 exports the uncapped count; M23 caps it per attribute at `now`; US-1 says about 60 at the golden clock |
| RT-25 | P3 | "−2.06%" isn't the real cost cut | Fixed | The game's own label ("−2.06% Costs"), noted in F-g |
| RT-26 | P3 | Citation and wording nits: Etc.jsx doesn't project from the save; Orion has no line; Funny 2hr Slice adds meat; zero-rate bars; FR-2's mixed unknown; `StatusGlyph` has no "training"; Crossover's fish gate | Fixed in part | All fixed except Crossover: it keeps the Poppy-unlocked gate for the "Next buys" tier, because its value is already inside Toolbox's rate (deferred to Phase 2) |
| RT-27 | P3 | Critter Gain is flat base critters, not a percent | Fixed | F-f, FR-22, US-6, V-4 settled |
| RT-28 | P3 | The size headroom is shared with other schema bumps | Fixed | TR-2: measure every public save after rebasing |

**Checked and correct (per the reviewer):** the unlock rule, what Megaflesh keeps and resets, the Megaflesh 8 pats, the two timers carrying over, the Charisma XP cost, the 120 cap and the once-per-tick levelling, emulsify, the Smoker cap, the pat refill, the 70% roll, the Boon rotation, and every fixture number in sections 3 and 4. It found no privacy leak.

## Verify before build

- **V-1 Away cap: settled.** The login loop calls `AFKcode("Forge", GlobalTime − TimeAway.Forge)` with no cap beyond a 10 s minimum (N.js @15027063, @15262417). F-b projects with no cap.
- **V-2 X1 lands.** The fork commit and its live-verified tests, then `pnpm sync-parsers`.
- **V-3 Per-character away time: settled from N.js.** `TimeAway.Forge` is reset whichever character logs in, and the Bubba block inside runs only when that character has the door open. So logging in on a character without it loses that away time for good. FR-6 says so in Phase 1. One save pair on a test account would confirm it; not blocking.
- **V-4 Critter Gain: settled.** It is a flat +base critters per trap (`/10`, N.js @7764650), not a percent. The page says so (F-f). Toolbox's trapping parser doesn't read it at this pin, so its effect on trapping numbers elsewhere in ActiveOn is a Toolbox gap, not ours.
- **V-5 Charisma above 120.** Confirm on a live save whether gifts can push an attribute past 120 (the vortexgaming guide says so; the game's level-up stops at 120, but the Numbahs trigger adds +1 LV directly).

## Phases and effort

- **Phase 1, one PR after X1.** About 3.5–4.5 agent-days, plus one owner review:
  - adapter and fields: 0.5 day;
  - entries, seven Detectors, generators and examples: 1 day;
  - engine module and Timeline: 0.5–1 day;
  - the page and two motifs: 1–1.5 days;
  - goldens and QA probe: 0.5 day.
- **X1** is about 0.5–1 day in the fork (about 80 lines and its live-verified tests).
- **Phase 2:** dice reroll timing, gift picks per Megaflesh, Spare Coins and the Tome row, about 1.5 days.

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
