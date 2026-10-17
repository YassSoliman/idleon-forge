# System Dossiers: cross-cutting account systems and dailies (2026-10-17)

Ticket: [#24](https://github.com/YassSoliman/idleon-forge/issues/24), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Format: [`SYSTEM-DOSSIER.md`](../SYSTEM-DOSSIER.md). Terms: [`GLOSSARY.md`](../../../GLOSSARY.md). Precedence: [ADR 0004](../../adr/0004-source-precedence.md).

**Patch:** game v1.23 "Lumi Menagerie" (2026-10-16/17), read from the game client `N.js` (Last-Modified 2026-10-17) and IdleOn Toolbox at [`6827d3f`](https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1) (2026-10-17). The wiki is used per claim, dated by revision. Anything verified only on an older patch is flagged Stale-risk in the part files.

The cluster is large, so it is split into six files under [`account-wide/`](account-wide/):

| File | Systems |
|---|---|
| [`resets-dailies-events.md`](account-wide/resets-dailies-events.md) | Daily and weekly resets, Weekly bosses, Boss keys, Happy Hours, Daily Checklist, Events |
| [`achievements-tasks-merit.md`](account-wide/achievements-tasks-merit.md) | Achievements, Tasks (Task Board, Daily Tasks, Unlocks), Merit Shop |
| [`upgrade-vault.md`](account-wide/upgrade-vault.md) | Upgrade Vault (all 90 rows, unlock rule, cost curve, Spend Plan) |
| [`gem-shop.md`](account-wide/gem-shop.md) | Gem Shop and free gem income (F2P and light-spender buy order) |
| [`companions-guild-family.md`](account-wide/companions-guild-family.md) | Pets (Companions), Guild, Family bonuses |
| [`minigames.md`](account-wide/minigames.md) | Catalogue of every W1–W4 minigame, plus one section per minigame |

## Answer

- **Three clocks drive every reset.** Daily is a per-account countdown (`ShopRestock`), so it is set by account-creation time and is never UTC midnight. Weekly rides on the daily reset (`OptionsListAccount[39]`) and covers Killroy, guild weeklies, giant mobs, dungeon runs and weekly Gem Shop limits. Server-global timers on the Unix week (Thursday 00:00 UTC) cover the Weekly Battle boss, Happy Hours and hourly Random Events; the Bonus Ballot rolls Monday at about 17:02 UTC.
- **Catch-up is uneven.** Boss keys and Colosseum tickets bank at most 3 days and teleports 10. Minigame plays, the daily Random Event, guild login GP and boss gem drops don't bank at all. Killroy skulls are wiped every weekly reset. ActiveOn's Daily Checklist should rank these unbanked items first.
- **Upgrade Vault rows unlock on total Vault levels, not on kills.** Bean, Carrot, Branch, Poop and Sheepie kills only scale five bonuses, one step per power of 10. Spend Plan: Major Discount, then Vault Mastery, then the coin rows, then cheap capped rows to max, then one-off rows as they unlock. Knockout! is the biggest W1–W3 damage row. Toolbox has no Vault alerts, so ActiveOn must supply them. The fixtures hold 1,724 levels (W2) and 2,497 (W3).
- **Merits are plentiful, so only the buy order matters.** Each world pays about 112–120 merits, and maxing W1–W4 costs 85/89/72/75. Buy first: W1 Goblet; W2 Obol drops (without it, monsters drop no obols); W3 Build and Food slots; W4 No Bubble Left Behind. Rewards must be claimed by hand, and 12 of 32 tasks reset on claim, so progress past the target is lost.
- **Free gems are mostly one-time.** About 644 come from quests, 935 from Task Unlocks, 160 from social links, and 1,285 from achievements, which pay out only on the Steam client. Recurring income is small, mostly the Pet Mart daily.
- **Gem Shop buy order:** Infinity Hammer, then Card Slots and Carry Capacity, then food and storage, then the W2 cauldrons, then the W3 Crystal 3D Printer and Tower Building Slots. Never buy candy, card packs, obols, balls or resets for progress. The wiki's Limited Specials list is the Stale v1.22 lineup.
- **Pets (Companions) are account-wide, with a daily free pull since v1.20.** Strong early pets: Rift Slug, Crystal Custard, Ancient Golem, Flying Worm, Gigafrog. Join an active guild rather than solo: maxing every guild bonus costs about 5.1M GP, and one account earns about 540 GP a week.
- **Family bonuses take the highest-level character of each class line, so duplicate classes add nothing.** Family level, the sum of all character levels, unlocks character slots and Family obol slots. This matters for Course Correction of an account with two of one class.
- **Minigames come in three kinds.** Skill minigames share 5 plays a day; the pool is reset each day, not added to, so unused plays are lost. Hoops and Darts are free on a cooldown. Idle clickers (Orion, Poppy, Bubba) build up offline. Darts has the highest Leverage, then Orion and Poppy, then Hoops; the 900-gem extra plays are a poor buy. Toolbox has no alerts for any of these.
- **Both real saves show the same leak: stocked resources left unspent.** That covers banked gems with no purchases, unspent merits and unlocks, unspent Darts and Hoops points, unclaimed pet pulls, and no Pet Mart claims. These are cheap, deterministic Next Actions for the MVP.

## Corrections and gaps a later ticket must know

- **Toolbox discrepancies:**
  - The Upgrade Vault unlock rule is wrong at 75–79 total levels.
  - "Has voted" checks the server's winning bonus, not the player's own vote (`OLA[308]`/`[309]`).
  - The giant-mob chance leaves out the Tachion of the Titans requirement.
  - Djonnut key characters are counted at dialogue > 6, but the game uses > 5.
  - Hoops upgrade costs reuse the Darts formula.
  - `guild.unlocked` is always true; read `accountOptions[37]` or `guild.id` instead.
  - Parsed guild tasks drop the claimed flag.

  Read the raw save field where these matter.
- **Wiki staleness:**
  - Gem Shop Limited Specials show the v1.22 lineup.
  - The Bottled Wind price is wrong: the wiki says 140, the game says 240.
  - Spiketrap pays up to 40 gems a day, not the wiki's 30.
  - The Colosseum page dates from 2025-08.
  - Changelog/2026 has no v1.23 entry yet.
- **Rotating Gem Shop slots 87–94** are reused by every Limited Specials rotation. A purchase count there says a slot was bought, not which item.
- **Poppy's offline catches** only become fish when the menu opens. A raw save read undercounts them.
- **Possible game bug:** the daily auto-claim adds Chizoar's keys to the Forest Villa key slot.
- **Unverified:**
  - the Boss Keys merit's per-level value;
  - the Unlocks column thresholds (7/22/60/90/106/119 come from the wiki);
  - whether login GP counts toward "Claim Guild Points";
  - the world-boss gems merit (code says +7% per purchase, the wiki says 1/12 per level).
- **Weak community sourcing:** the Reddit archive (Arctic Shift) was rate-limited throughout, and the guide sheet's Gems tab is from 2023. Priority orders marked M are inferred and need a human pass before they become Knowledge Base entries.
- **Achievement gem totals were corrected during assembly.** An early count of about 2,474 included 152 `FILLERZZZ_ACH` placeholder rows. Summing the `gems` field in `achievements.json` gives 1,285 (W1 407, W2 264, W3 324, W4 290).

## Method

Six researchers each wrote one part from the sources in ADR 0004 order:
1. Toolbox data and parsers, plus the v1.23 game client `N.js`, cited by symbol and character offset.
2. idleon.wiki through `api.php`, with revision dates.
3. The published community guide sheets.
4. Reddit through the Arctic Shift API.

They read the two private fixtures only for field names and aggregate checks; no character names or save contents are included. The parts were then cross-checked and the index assembled. Each part ends with its own Sources list, with a URL or code location for every claim.

## Sources

See the `### Sources` section of each part file. The primary anchors are:

- IdleOn Toolbox @ 6827d3f (2026-10-17): https://github.com/Morta1/IdleonToolbox/tree/6827d3f2afcaa63336446f2a08c92e0e060cbcd1 (`data/website-data/`, `parsers/`, `utility/dashboard/`)
- Game client v1.23: https://www.legendsofidleon.com/ytGl5oc/N.js (Last-Modified 2026-10-17)
- Reset mechanics: https://github.com/YassSoliman/idleon-forge/blob/research/mechanics/docs/research/2026-10-17-mechanics.md
- idleon.wiki API: https://idleon.wiki/api.php
- Arctic Shift Reddit archive: https://arctic-shift.photon-reddit.com/
