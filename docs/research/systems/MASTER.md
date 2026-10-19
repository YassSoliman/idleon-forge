# M26 master: every W1-W4 mechanic, what ActiveOn has, and the build order

Verified 2026-10-19 against IdleOn Toolbox @6c37e3d (pin 6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1, game 2.3.540).
This file rolls up the six area syntheses (`synth/W1.md`, `W2.md`, `W3.md`, `W4.md`, `AW.md`, `CL.md`) and the eleven
account-wide maps that have no synthesis of their own (`maps/{talents,gem-shop,merit-tasks,achievements,dungeons,pets,
guild,family,skills,monster-afk,checklist}.json`). It adds no new game fact: every row points back to a map row, and the
map and dossier carry the Sources (code path#line or URL, tier 1-4, verified date, claim date). Where two areas
disagreed, the conflict and the call made here are in section 5. Test accounts are "the W2 test account" and "the W4
test account" only.

The spec built from this file is `M26-systems-w1-w4.md`. The sprite manifest is `SPRITES.md`. The glossary terms are
`GLOSSARY-ADDITIONS.md`. The scripts that built the tables are in `synth/final/` (`matrix_collect.py`,
`master_tables.py`, `sprites_collect.py`, `sprites_merge.py`, `aw2_extract.py`). Re-run them after a map changes.

## 1. The answer in one paragraph

ActiveOn already holds the data for 46% of the 1,418 W1-W4 mechanics (651 in Account State) and Toolbox parses
another 47% (673) that the adapter does not read yet. Only 94 mechanics (7%) need data that Toolbox does not have.
But only 22% of mechanics are shown in full and 21% are advised in full. So M26 is mostly view and advice work, not
parsing. The two places where that is not true are World 4 (0 mechanics advised; Rift, Tome and Sigils are not even in
the Systems registry) and the W3 "new homes" (Equinox, Death Note, Salt Lick, Atom Collider: data is toolbox-only). The
build order (revised after the red team of 2026-10-19) starts with the foundations every wave needs (Wave 0), then
the self-contained World 4 Systems (Wave 1), then the Alchemy and fires-today gaps that W2 and W3 players hit every
session, with each W4 hook folded into the page it belongs to (Wave 2), then the account-wide Systems that fire for
every stage (Wave 3), then W3 core and W1 core interleaved (Wave 4), W2 and the rest of W3 (Wave 5), the rest of W1
(Wave 6) and the late account-wide Systems and class lines (Wave 7).

## 2. Coverage counts

Definitions. **Mechanic**: one row of an area map (a thing the game does that a player can act on or see). **In
Account State (A)**: the adapter already exposes it. **Toolbox only (T)**: Toolbox parses or computes it; the adapter
does not read it. **Missing**: neither (raw save or game client only). **Shown / Advised**: what ActiveOn does today,
yes = in full, partial = part of it or under another System. CL rows are class-line talents and counters; most are
already advised through the M9 Builds, which is why CL leads.

| Area | Mechanics | In Account State (A) | Toolbox only (T) | Missing | Shown (yes / partial) | Advised (yes / partial) | Shown in full | Advised in full |
|---|---|---|---|---|---|---|---|---|
| W1 | 267 | 134 | 111 | 22 | 65 / 40 | 68 / 35 | 24% | 25% |
| W2 | 181 | 79 | 87 | 15 | 28 / 31 | 52 / 10 | 15% | 29% |
| W3 | 254 | 106 | 136 | 12 | 48 / 60 | 45 / 23 | 19% | 18% |
| W4 | 149 | 60 | 80 | 9 | 26 / 32 | 0 / 4 | 17% | 0% |
| AW | 407 | 168 | 206 | 33 | 70 / 72 | 60 / 81 | 17% | 15% |
| CL | 160 | 104 | 53 | 3 | 72 / 30 | 79 / 16 | 45% | 49% |
| **All** | 1418 | 651 | 673 | 94 | 309 / 265 | 304 / 169 | 22% | 21% |

Reading: W4 has the data (94% A or T) and almost no advice. W2 and W3 are about half toolbox-only, so most of their
work is an adapter slice per System before the page. W1 is the opposite: half its mechanics are already adapted, and
the gap is views and Checks. Draft entries written by the maps: 452 distinct ids in `kb-drafts/` plus 78 that still live only
in the eleven account-wide maps (Wave 0.5). Draft counts come from `work/count_drafts.py` (red team 2026-10-19): 461
records (entries, facts, amendments), 452 distinct ids, 318 distinct Detector and progress ids; it fails on 7 duplicate
and 6 malformed ids that Wave 0.5 fixes.

**Excluding the Deferred register.** 38 rows are W5+ content (N1) and are never built (Appendix B, `work/deferred.py`).
Coverage and effort are measured without them:

| Area | Mechanics | A | T | Missing | Shown (yes / partial) | Advised (yes / partial) | Shown in full | Advised in full |
|---|---|---|---|---|---|---|---|---|
| W1 | 262 | 134 | 107 | 21 | 65 / 40 | 68 / 35 | 25% | 26% |
| W2 | 177 | 79 | 83 | 15 | 28 / 31 | 52 / 10 | 16% | 29% |
| W3 | 240 | 106 | 122 | 12 | 48 / 59 | 45 / 23 | 20% | 19% |
| W4 | 142 | 59 | 76 | 7 | 26 / 31 | 0 / 4 | 18% | 0% |
| AW | 399 | 168 | 199 | 32 | 70 / 72 | 60 / 81 | 18% | 15% |
| CL | 160 | 104 | 53 | 3 | 72 / 30 | 79 / 16 | 45% | 49% |
| All | 1380 | 650 | 640 | 90 | 309 / 263 | 304 / 169 | 22% | 22% |

## 3. Per-System roll-up

75 Systems (one row per map topic; CL lines by class line). "Draft entries" counts entry ids in `kb-drafts/` for that
System's namespace (map only = still in `maps/<id>.json`). "Wave(s)" points at section 4.

| Area | System | Mechanics | Data A / T / - | Shown y / p / n | Advice y / p / n | Draft entries | Effort | Wave(s) | Home after M26 |
|---|---|---|---|---|---|---|---|---|---|
| W1 | Anvil (`anvil`) | 20 | 12 / 7 / 1 | 7 / 5 / 8 | 9 / 3 / 8 | 11 | M | 2, 6 | Anvil page (exists) |
| W1 | Bosses and keys (`boss-keys`) | 18 | 7 / 6 / 5 | 1 / 3 / 14 | 1 / 0 / 17 | 10 | L | 4 | new Boss Keys page |
| W1 | Bribes (`bribes`) | 14 | 7 / 7 / 0 | 4 / 2 / 8 | 6 / 5 / 3 | 5 | M | 4 | new Bribes page |
| W1 | Colosseum (`colosseum`) | 21 | 6 / 8 / 7 | 5 / 1 / 15 | 6 / 0 / 15 | 5 | L | 6 | new Colosseum page |
| W1 | Forge System (`forge`) | 15 | 4 / 10 / 1 | 1 / 2 / 12 | 1 / 2 / 12 | 9 | L | 2 | new Forge page |
| W1 | Minigames + Poppy (`minigames`) | 30 | 15 / 13 / 2 | 7 / 3 / 20 | 9 / 2 / 19 | 11 | L | 6 | Minigames page + new Poppy page |
| W1 | The Owl (Orion) (`owl`) | 13 | 0 / 12 / 1 | 0 / 0 / 13 | 0 / 0 / 13 | 8 | M | 4 | new Owl page |
| W1 | Post Office (`post-office`) | 17 | 5 / 9 / 3 | 0 / 4 / 13 | 3 / 2 / 12 | 9 | L | 4 | new Post Office page |
| W1 | Quests (`quests`) | 20 | 14 / 6 / 0 | 6 / 3 / 11 | 4 / 3 / 13 | 7 | L | 2, 6 | Character tab + new Quests page |
| W1 | Smithing (umbrella) (`smithing`) | 27 | 17 / 10 / 0 | 11 / 4 / 12 | 9 / 4 / 14 | 2 | L | 6 | Anvil / Forge / Gear pages |
| W1 | Stamps (`stamps`) | 18 | 12 / 6 / 0 | 3 / 7 / 8 | 5 / 5 / 8 | 8 | M | 1, 2 | Stamps page (exists) |
| W1 | Star Signs (`star-signs`) | 19 | 13 / 5 / 1 | 8 / 3 / 8 | 7 / 4 / 8 | 11 | L | 6 | Star Signs page (exists) |
| W1 | Statues (`statues`) | 20 | 11 / 8 / 1 | 3 / 3 / 14 | 0 / 1 / 19 | 7 | L | 4 | Statues page (exists) |
| W1 | Upgrade Vault (`upgrade-vault`) | 18 | 13 / 5 / 0 | 10 / 2 / 6 | 10 / 5 / 3 | 5 | M | 2, 6 | Vault page (exists) |
| W2 | Alchemy: bubbles (`alchemy-bubbles`) | 19 | 11 / 6 / 2 | 3 / 6 / 10 | 5 / 1 / 13 | 9 | L | 2 | Alchemy > Bubbles + Big bubbles tabs |
| W2 | Alchemy: cauldrons and Boosts (`alchemy-cauldrons`) | 14 | 5 / 9 / 0 | 3 / 2 / 9 | 5 / 0 / 9 | in alchemy-bubbles | M | 2 | Alchemy > Cauldrons tab |
| W2 | Alchemy: liquids and Liquid Shop (`alchemy-liquids`) | 16 | 9 / 6 / 1 | 4 / 3 / 9 | 9 / 0 / 7 | 5 | M | 2, (adapter 2.0) | Alchemy > Liquids tab |
| W2 | Alchemy: vials (`alchemy-vials`) | 24 | 13 / 10 / 1 | 4 / 6 / 14 | 8 / 3 / 13 | 8 | L | 2 | Alchemy > Vials tab |
| W2 | Arcade (`arcade`) | 13 | 2 / 10 / 1 | 1 / 1 / 11 | 1 / 1 / 11 | 6 | L | 5 | new Arcade page |
| W2 | Cards (`cards`) | 22 | 17 / 2 / 3 | 9 / 4 / 9 | 11 / 0 / 11 | 6 | M | 1 (feed), 2, 5 | Cards tab (exists) |
| W2 | Islands (`islands`) | 17 | 3 / 14 / 0 | 1 / 2 / 14 | 1 / 2 / 14 | 14 | L | 5 | new Islands page |
| W2 | Killroy (`killroy`) | 18 | 7 / 8 / 3 | 5 / 2 / 11 | 6 / 1 / 11 | 9 | L | 5 | new Killroy page |
| W2 | Obols (`obols`) | 22 | 9 / 11 / 2 | 0 / 1 / 21 | 6 / 0 / 16 | 10 | L | 5 | new Obols page |
| W2 | Weekly Battles and Ballot (`weekly-battles`) | 21 | 5 / 14 / 2 | 0 / 4 / 17 | 2 / 2 / 17 | 5 | L | 5 | new Weekly Battles page + Ballot tab |
| W3 | Armor Smithy (`armor-smithy`) | 13 | 7 / 6 / 0 | 3 / 7 / 3 | 6 / 0 / 7 | 4 | M | 5 | Armor Smithy page (exists) |
| W3 | Atom Collider (`atom-collider`) | 21 | 3 / 18 / 0 | 0 / 3 / 18 | 2 / 0 / 19 | 6 | M | 4 | new Atom Collider page |
| W3 | Bubba (`bubba`) | 16 | 12 / 3 / 1 | 10 / 3 / 3 | 8 / 2 / 6 | 8 | M | 5 | Bubba page (exists) |
| W3 | Cog Board (`cog-board`) | 19 | 7 / 10 / 2 | 3 / 5 / 11 | 1 / 3 / 15 | in construction | L | 5 | Construction > Cog Board tab |
| W3 | Construction (`construction`) | 16 | 11 / 5 / 0 | 6 / 5 / 5 | 3 / 5 / 8 | 12 | L | 2, 5 | Construction page (exists) |
| W3 | Death Note (`death-note`) | 15 | 3 / 12 / 0 | 1 / 5 / 9 | 2 / 1 / 12 | 8 | L | 4 | new Death Note page |
| W3 | Equinox (`equinox`) | 12 | 1 / 10 / 1 | 0 / 0 / 12 | 0 / 0 / 12 | 4 | M | 0, 4 | new Equinox page |
| W3 | Talent Book Library (`library`) | 10 | 6 / 3 / 1 | 1 / 4 / 5 | 5 / 0 / 5 | 4 | M | 5 | new Library page |
| W3 | Prayers (`prayers`) | 20 | 8 / 10 / 2 | 4 / 6 / 10 | 0 / 1 / 19 | 9 | L | 4 | Prayers page (exists) |
| W3 | 3D Printer (`printer`) | 17 | 11 / 6 / 0 | 4 / 6 / 7 | 5 / 4 / 8 | 5 | M | 5 | Printer page (exists) |
| W3 | Refinery (`refinery`) | 21 | 8 / 13 / 0 | 8 / 1 / 12 | 5 / 3 / 13 | 4 | M | 2 (adapter), 5 | Refinery page (exists) |
| W3 | Salt Lick (`salt-lick`) | 21 | 4 / 16 / 1 | 0 / 4 / 17 | 2 / 0 / 19 | 5 | M | 2 (adapter), 4 | new Salt Lick page |
| W3 | Shrines (`shrines`) | 13 | 6 / 7 / 0 | 2 / 2 / 9 | 1 / 0 / 12 | 5 | M | 4 | Shrines page (exists) |
| W3 | Trapping (`trapping`) | 20 | 8 / 10 / 2 | 3 / 5 / 12 | 2 / 3 / 15 | 11 | L | 5 | Trapping page (exists) |
| W3 | Worship and Tower Defense (`worship`) | 27 | 14 / 10 / 3 | 4 / 6 / 17 | 3 / 1 / 23 | 14 | L | 4 | Worship page (exists) + TD tab |
| W4 | Breeding (incl. Pet Arena) (`breeding`) | 29 | 14 / 15 / 0 | 8 / 6 / 15 | 0 / 0 / 29 | 11 | L | 0, 1 | Breeding page (exists) + Fence Yard tab |
| W4 | Cooking (`cooking`) | 27 | 13 / 13 / 1 | 6 / 9 / 12 | 0 / 0 / 27 | 11 | L | 1 | Cooking page (exists) |
| W4 | Elite classes and W4 bosses (`elite-classes`) | 20 | 11 / 7 / 2 | 2 / 5 / 13 | 0 / 3 / 17 | 12 | L | 1 | new Elite Classes page |
| W4 | Laboratory (`lab`) | 27 | 16 / 10 / 1 | 10 / 8 / 9 | 0 / 0 / 27 | 14 | L | 1 | Laboratory page (exists) |
| W4 | The Rift (`rift`) | 22 | 4 / 17 / 1 | 0 / 3 / 19 | 0 / 1 / 21 | 7 | L | 0, 1 | new Rift page |
| W4 | Sigils (`sigils`) | 14 | 2 / 11 / 1 | 0 / 2 / 12 | 0 / 0 / 14 | 7 | M | 2 | Alchemy > Sigils tab |
| W4 | Tome (`tome`) | 16 | 2 / 11 / 3 | 0 / 1 / 15 | 0 / 0 / 16 | 8 | L | 1 | new Tome page |
| AW | Achievements (`achievements`) | 17 | 1 / 16 / 0 | 0 / 1 / 16 | 0 / 0 / 17 | 7 (map only) | L | 7 | new Achievements page |
| AW | Daily & Weekly Checklist (`checklist`) | 47 | 26 / 19 / 2 | 19 / 4 / 24 | 31 / 0 / 16 | 6 (map only) | L | 1, 7 | Timeline > Daily & Weekly (exists) |
| AW | Class EXP and levelling (`classes`) | 17 | 8 / 8 / 1 | 2 / 5 / 10 | 4 / 3 / 10 | 19 | M | 3 | new Levelling page + Character Level tab |
| AW | Coins (`coins`) | 13 | 7 / 6 / 0 | 3 / 4 / 6 | 2 / 0 / 11 | 5 | L | 7 | new Coins page |
| AW | Drop rate (`drop-rate`) | 12 | 3 / 9 / 0 | 2 / 2 / 8 | 1 / 3 / 8 | 4 | M | 3 | new Drop Rate page |
| AW | Dungeons (`dungeons`) | 17 | 2 / 13 / 2 | 0 / 3 / 14 | 0 / 0 / 17 | 8 (map only) | L | 3 | new Dungeons page |
| AW | Event Shop (`event-shop`) | 10 | 1 / 6 / 3 | 1 / 1 / 8 | 1 / 0 / 9 | 2 | M | 7 | new Event Shop page |
| AW | Family (`family`) | 13 | 7 / 4 / 2 | 0 / 5 / 8 | 0 / 6 / 7 | 2 (map only) | M | 7 | new Family page |
| AW | Food and Golden Food (`food`) | 12 | 5 / 6 / 1 | 1 / 1 / 10 | 2 / 0 / 10 | 5 | M | 3 | new Food page + Gear tab strip |
| AW | Friend bonuses (`friend-bonuses`) | 11 | 1 / 8 / 2 | 0 / 1 / 10 | 0 / 0 / 11 | 5 | M | 7 | new Friend bonuses page |
| AW | Gem Shop (`gem-shop`) | 20 | 17 / 2 / 1 | 3 / 5 / 12 | 0 / 8 / 12 | 2 (map only) | M | 7 | new Gem Shop page |
| AW | Guild (`guild`) | 13 | 4 / 7 / 2 | 0 / 5 / 8 | 0 / 3 / 10 | 6 (map only) | M | 7 | new Guild page |
| AW | Task Board, Merit Shop, Task Unlocks (`merit-tasks`) | 19 | 10 / 8 / 1 | 2 / 3 / 14 | 0 / 10 / 9 | 8 (map only) | L | 2 | new Task Board page (3 tabs) |
| AW | AFK fighting and maps (`monster-afk`) | 32 | 17 / 14 / 1 | 9 / 7 / 16 | 7 / 9 / 16 | 8 (map only) | L | 3 | new AFK Setup page |
| AW | Pets and Pet Tournament (`pets`) | 23 | 5 / 16 / 2 | 4 / 1 / 18 | 0 / 5 / 18 | 8 (map only) | L | 7 | new Pet Park page |
| AW | Skills (efficiency, nodes, Mastery) (`skills`) | 25 | 10 / 7 / 8 | 8 / 1 / 16 | 0 / 10 / 15 | 8 (map only) + 1 (kb-drafts) | L | 1, 3 | Skills tab + new Skills page |
| AW | Stats and damage (`stats`) | 15 | 4 / 10 / 1 | 2 / 1 / 12 | 3 / 1 / 11 | 4 | L | 2 | Character Stats tab + Stats page |
| AW | Storage and carry (`storage`) | 14 | 7 / 7 / 0 | 1 / 4 / 9 | 1 / 7 / 6 | 9 | L | 3 | new Storage page |
| AW | Talents (points, resets, star books) (`talents`) | 25 | 14 / 9 / 2 | 5 / 9 / 11 | 0 / 11 / 14 | 30 (kb-drafts, CL) + 8 (map only) | L | 3 | Talent presets page + 2 tabs |
| AW | Town shops (`town-shops`) | 14 | 9 / 4 / 1 | 3 / 3 / 7 | 3 / 3 / 7 | 4 | M | 7 | new Town shops page |
| AW | Trophies, Nametags and Hats (`trophies-nametags`) | 13 | 0 / 13 / 0 | 0 / 0 / 13 | 0 / 0 / 13 | 9 | L | 7 | new Trophies page |
| AW | World-reached proxy (`worlds`) | 1 | 1 / 0 / 0 | 1 / 0 / 0 | 1 / 0 / 0 | 0 | S | 0 | none (engine rule) |
| CL | Barbarian line (`class-barbarian`) | 19 | 15 / 4 / 0 | 12 / 3 / 4 | 11 / 2 / 6 | see CL shared + talents/classes | L | 2, 7 | Class lines page + Build tab Class kit |
| CL | Bowman line (`class-bowman`) | 31 | 16 / 13 / 2 | 13 / 5 / 13 | 17 / 1 / 13 | see CL shared + talents/classes | L | 7 | Class lines page + Build tab Class kit |
| CL | Hunter line (`class-hunter`) | 18 | 11 / 7 / 0 | 7 / 4 / 7 | 8 / 3 / 7 | see CL shared + talents/classes | M | 7 | Class lines page + Build tab Class kit |
| CL | Beginner line (`class-journeyman`) | 23 | 15 / 8 / 0 | 5 / 2 / 16 | 1 / 7 / 15 | 14 | L | 4 | Class lines page + new Beginner line page |
| CL | Shaman line (`class-shaman`) | 24 | 18 / 6 / 0 | 11 / 8 / 5 | 14 / 0 / 10 | see CL shared + talents/classes | L | 2, 7 | Class lines page + Build tab Class kit |
| CL | Squire line (`class-squire`) | 24 | 13 / 11 / 0 | 11 / 3 / 10 | 15 / 0 / 9 | see CL shared + talents/classes | L | 2, 7 | Class lines page + Build tab Class kit |
| CL | Wizard line (`class-wizard`) | 24 | 16 / 7 / 1 | 13 / 5 / 6 | 13 / 4 / 7 | see CL shared + talents/classes | M | 2, 7 | Class lines page + Build tab Class kit |

## 4. M26 build order, in waves

Effort: **S** = wire an existing field into a view or an entry (about a day), **M** = a new adapter field from Toolbox
output plus a view and a few entries (a few days), **L** = a new System page with its adapter slice, several Detectors
and goldens, or data Toolbox does not hand over (a week or more). One item is one concern and usually one PR
(AGENTS.md); an L item may split into an adapter PR and a page PR. "Fires today" means a draft Check or Goal fires on
at least one private test save (map evidence), so the item has a real-account acceptance case.

**Revised after the red team of 2026-10-19** (spec section 16). Three rules shape the order now:
1. **A hook lands with its home page.** No item builds into a page that a later wave rebuilds or creates. W4 hooks in
   older Systems move to the wave of their home System (vials 42-51 to 2.3, third big-bubble slot to 2.2, Sigils to
   2.5, Task Board W4 board to 2.9, Armor Smithy W4 sets to 5.12, Star Signs D-1..D-7 to 6.1, card star cap view to
   5.6). Value feeds with no page (Ruby Cards star cap, Vial Mastery, Gilded Stamps, Skill Mastery) ship with the Rift
   adapter in 1.1, because they only read `account.rift`.
2. **Cross-link chips land with their target page.** The Lab "x2 on/off" chip ships in 1.2 only on pages that exist
   and are not rebuilt (Stamps, Printer, Refinery); the Bubbles, Vials and Sigils chips ship in 2.2, 2.3 and 2.5; the
   Death Note chip in 4.2.
3. **Value for every stage, early.** What already fires on the W2 test account (AFK Setup, Food, Storage, Skills,
   Class EXP, Dungeons trait pick, Talents, Drop rate) moves to Wave 3, ahead of the W3, W2 and W1 page waves; W1 core
   pages are interleaved with W3 core in Wave 4. Gem Shop, Guild, Friend bonuses, Trophies, Town shops and the Event
   Shop stay last.

Waves are ordered by player value and by what blocks what. Inside a wave, items with no arrow between them can be
built in parallel by different agents. Every wave starts with its red team, which runs only once every System FR in the
wave has its user story (spec section 4), and ends with a truth run on both private saves and the public and stage
fixtures, and a PR Preview for the owner. Rows of the Deferred register (Appendix B) are never built.

### Wave 0: foundations (blocks every later wave)

| # | Item | Why first | Effort |
|---|---|---|---|
| 0.1 | **Stage bands first.** `W4-mid` and `W4-late` with a cited detection rule, the "beyond" policy, and the draft stage remap (W4-early -> W4-entry; no W5+ stage) | About 45 drafts cite `W4-late`, which has no rule yet; nothing W4 is promoted before it (spec FR-3, R10) | M |
| 0.2 | KB schema: accept `status: draft` (Q1, owner yes); the compiler skips drafts | 581 draft rows use `status: draft`, which `schema.ts` (`active / contested / retired`) rejects | S |
| 0.3 | **Source tiers: keep the live ADR 0004 numbering** (1 game data via Toolbox, 2 wiki edited after the patch, 3 dated community guide, 4 anything else). A conversion script maps the research labels of the dossiers and drafts onto it; a drafts lint in CI fails on any unconverted tier. No bulk rewrite of the live KB | The M26 brief's 1-4 reading is not ADR 0004; renumbering would strip wiki-backed blockers (spec FR-2) | M |
| 0.4 | ADR 0004 amendment and schema change for a **game-client tier 1 Source** (Q10, owner yes): N.js citation with a stored excerpt hash and the in-client game version; until it merges, N.js-only claims are tier 4 and display only. Plus the **two-Source lint** for Priorities and Builds | 31 N.js tier-1 Sources fail the schema today; 19 conf-M Priorities rest on one Source (spec FR-2b, FR-2c) | M |
| 0.5 | **Draft conversion**, not copy: the drafts become loadable entries (progress refs, units, scopes, categories, `doneWhen`), amendments become edits to named live entries, facts move to `*.facts.yaml`, Sources fixed (permalinks, https, claimDate, no self-citations); merge plan for the 32 draft files whose names already exist in `systems/` and the 6 colliding ids; the account-wide map drafts (78 ids) join the same pass | 268 of 390 typed drafts fail `AuthoredEntry` today (spec FR-10) | L |
| 0.6 | Rift numbering: store and compare `Rift[0]`, display `Rift[0]+1` through one `riftLabel()`; one field `account.rift.level`; a lint fails on a bare number after "Rift" in player text | Five areas read the Rift; three drafts printed stored numbers (spec FR-4) | S |
| 0.7 | Engine "claimed by" dedupe: one card per thing when two Checks name it (cog-fill-square vs cog-seat-free, empty-active-slot vs slot-plan, golden-food overlaps, best-totem vs charge-caps, gift-pick vs megaflesh, unending-energy x2, friend slots x2, Lab weekly x2) | W3 #5, AW R2, section 5 | M |
| 0.8 | Unlock guards keyed on each System's own unlock fact (Rift quest, Lab tube, Breeding started, ...), `currentWorld` only as the fallback; registry rows `sigils`, `rift`, `tome`, `elite-classes`, `achievements`, `dungeons`, `family`, `food`, `storage`, `stats`, `coins`, `friend-bonuses`, `event-shop`, `trophies-nametags`, `town-shops`, `drop-rate`; fix `islands` (`islands/unlocked`), Poppy world (in-game check), `prayers` scope `both` | Raw counters tick on locked accounts; the W4 test account reads `currentWorld` 3 (spec FR-6) | S |
| 0.9 | Correctness fixes, one small PR each: Breeding egg timer / first-breed hint / multiplier indices; Ballot "Leading now" -> "Active now"; Equinox `unlocked` false positive (real unlock = Mirror, Equinox_Visitor, or any Dream Upgrade > 0); Refinery Throttle reads `maxLevel`; `FRONTIER_SECTIONS` misses `friendBonusStats`, `hatRack`, `gallery`; `minigames/daily-plays` Choppin step needs talent 463 > 0; Killroy room **regression test** (ActiveOn already gates room 2 on World 3). The Killroy Prime and Skill Mastery gates are **not** a fix: vendored Toolbox applies them ungated on purpose (`printer.ts#L101`); they wait on V2 | Live bugs found by the maps | S each |
| 0.10 | Sprite scaffolding: new grids `stats.ts`, `mobs.ts`, `npcs.ts`, `statues.ts` in `art/sprites/index.ts`; shared `status-pip`, `wave-flag`; a CI test that every sprite key a view references exists; a snapshot test per grid at 1x and 2x in light and dark | Sprites had no testable acceptance (spec section 10) | M |
| 0.11 | Fixtures: **stage fixtures** built by script (`w1-early`, `w3-mid` from `first.json`; see spec section 11); the fresh W4 save (owner, minutes) with a fallback to `first.json`, `fourth.json` and `highend.json` so Wave 1 is never blocked on it; both private fixtures re-parsed at the pin | No public fixture is below W4: `first.json` reads `currentWorld` 4, `fresh.json`, `second.json`, `third.json` and `fourth.json` read 6, the rest 7 | M |
| 0.12 | Completeness tests: every `systems.yaml` System has a `SYSTEM_HOMES` and a `pages.ts` entry; every Appendix A row maps to a field, a Check or a No-advice reason, or sits in the Deferred register; the draft count script fails on duplicate or malformed ids | G1 and G2 had no mechanical test | M |
| 0.13 | Size baseline: measure the largest public save's Account State against the 300 KB cap (M1 TR-16, raised in release 4; `contract.test.ts#L204`) and set each wave's byte budget (spec section 6) | About 450 new fields against roughly 45 KB of headroom at the last measurement | S |

### Wave 1: World 4 core (self-contained Systems)

Order inside the wave follows W4 synthesis 2.8: the Rift adapter first, because Elite classes, Tome and Lab read it.

| # | Item | What ships | Effort |
|---|---|---|---|
| 1.1 | **The Rift** (new System, new page) | `account.rift`, `account.skillTotals`; `rift.fact.levels` generated only from a traced Source (V1); Rift page (locked quest checklist, bonus ladder, this level, next 10 with class gates, 12 bonus cards, Skill Mastery grid); 7 drafts, 6 Detectors; "Open The Rift" W4 Welcome step. Value feeds with no page: Ruby Cards star cap (`cards.fact.star-cap`), Vial Mastery, Gilded Stamps, Skill and Smithing Mastery | L |
| 1.2 | **Laboratory** advice | real connection range, Line Width per character (`50 + 2 x Lab level` plus percent groups, read from `lab.playersCords`), souped tubes (C2 dispute carried), jewel multipliers, repository spares, weekly shop status; 13 drafts; 8 Detectors; tab upgrades; "Lab x2" chip on Stamps, Printer and Refinery only | L |
| 1.3 | **Breeding** advice + Fence Yard | 14 fields; generated 16-rung Pet Arena ladder (replaces `ARENA_WAVES`); Fence Yard tab; 11 drafts, 9 Detectors (`full-nest` fires on `first.json` and the fresh W4 save) | L |
| 1.4 | **Cooking** advice | kitchen upgrade costs and spices, meal stat and multiplier, ladles, `KITCHEN_AFK_TARGET` (pin from the fresh save, else `first.json`); 10 drafts (meal order display only), 10 Detectors | L |
| 1.5 | **Tome** (new System, new page) | `account.tome` keyed by metric name; 124 metric rows, milestone track, next unlocks; 8 drafts, 8 Detectors; pre-350 rows labelled "not counting yet" (Q3) | L |
| 1.6 | **Elite classes and W4 bosses** (new System, new page) | `characters[].eliteStep` (M until V8 and V44), `account.trollTask`; Eliteus ladder, tab-4 points, Bubonic tubes, Begone Troll!, Voidwalker; 8 drafts + `metapath.goal.elite` patch; 6 Detectors | L |
| 1.7 | W4 hooks on pages that exist and are not rebuilt (one PR each) | Gilded Stamps roll and banked on Stamps (S); Skill/Smithing Mastery on the Skills tab at displayed Rift 16 (S); Lab chip/jewel rotation checklist row (S) | S |

### Wave 2: the gaps W2 and W3 players hit every session

The owner's own question ("did you cover boosts first, then bubbles?") and every Check that fires on a test save
today, where its home page already exists.

| # | Item | What ships | Fires today | Effort |
|---|---|---|---|---|
| 2.0 | **Salt adapter slice** (no page) | `account.salts` (held in the chest and in Refinery storage; **this PR owns the salt-held field**), `account.saltLick` (11 upgrades, #6 rate term with provenance "game client") | n/a | M |
| 2.1 | **Alchemy cauldrons: Boosts board** | `CauldronState.brew/brewPerHour/newBubble/boosts/ivory`; Boosts board (display only for Speed, Cost, 2x Extra); `luck-odd`; revised `spend-brew` | both (brew banked) | M |
| 2.2 | **Alchemy bubbles grid + Big bubbles tab** | bubble grid per cauldron, `big` flag, unlocked milestones, third-slot parts and `third-slot` Goal (was 1.8), NBLB, Boron pay; Lab chip on Bubbles; 6 drafts + 4 amendments | both | L |
| 2.3 | **Alchemy vials shelf** | idx 0-85 catalogue (42-51 full opacity from W4, from 1.8; 52-85 grey later), vial multiplier and its four terms, green vials, ladder, Pickle Jar; Lab chip on Vials; 7 drafts | W4 test account (Shaman, 15 vials at 1) | L |
| 2.4 | **Alchemy liquids, Decant, Liquid Shop board** (after 2.0) | cap breakdown, Decant tracks, observed rate per liquid, Salt Lick #6 term, 18 shop items; 4 drafts (`bleach-first` excluded, N3) | both | M |
| 2.5 | **Sigils** (new System, Alchemy > Sigils tab; after 2.1-2.4) | `account.sigils`, `characters[].slots.sigil`, generated catalogue; Lab-gate banner, 4x6 board, ETA; Lab chip on Sigils; 7 drafts, 5 Detectors | `first.json`, `fourth.json` | M |
| 2.6 | **Stats and damage** adapter + Character Stats tab | `characters[].stats`, `characters[].combat` (worker); `stats.check.hit-chance-short`; `accuracyShort` wired in the Build engine | W4 test account Squire 36% hit | L |
| 2.7 | **Class kit shared layer** + Class lines page | `characters[].classKit` union (Q4 yes), `talentCooldowns`, `activeBuffs`; `builds/bubble-capped-talent`, `classes/cast-ready`, `builds/core-missing`; Idle Casting 0, Idle Brawling 0, Precision Power idle; Fuscia over Mage Is Best blocked on V42 | both | L |
| 2.8 | **Forge System page** | `account.forge`; 4x4 slot grid; fill-empty-slots, runs-out, collect-bars, Brimstone best ore (`brimstone-first-slots` excluded, N3) | both (6 of 6 slots idle on the W2 test account) | L |
| 2.9 | **Task Board page** (Tasks / Merit Shop / Unlocks), incl. the W4 board and daily (was 1.8) | `account.taskBoard`; claimable tiers, board-locked Goals, game-accurate unlock columns | W2 test account (W2 board closed with tiers waiting) | L |
| 2.10 | Fires-today quick wins on existing pages (one PR each) | `stamps.check.coins-outrun-caps` (both); `upgrade-vault.check.knockout-target` (both) and `baby-on-board-idle` (W2); `anvil.check.mat-points` (9 of 11 characters); `construction.check.bar-full-unpaid` and `slot-empty` (W4; after 2.0); `quests.goal.unique-quests` and `quest-talent-past-cap` (W4); Cards fixes (star cap from the 1.1 feed, boss x5 after a code check) | yes | S each |

### Wave 3: what fires for every stage (account-wide essentials)

These fire on the W2 test account today and serve W1-W4 players alike.

| # | Item | Effort |
|---|---|---|
| 3.1 | **AFK Setup** page (fighters table, better map, no-hit, prayer curses; the Unending Energy line waits for Prayers in 4.5) | L |
| 3.2 | **Food and Golden Food** page (golden unequipped fires on the W4 test account) | M |
| 3.3 | **Storage and carry** page (chest full fires on the W2 test account; pouch upgrade) | L |
| 3.4 | **Skills** account page (harvest chance display only until Q10/V40, node ladders, fishing kit, Mastery display, and the progression sub-FR: next tool tier, next door or portal, quest unlocks, Catching) | L |
| 3.5 | **Class EXP and levelling** page (lowest-level tie / idle; level bands; Speedna steps) | M |
| 3.6 | **Dungeons** page (rank, trait pick on both test accounts, credits idle, Flurbo spend) | L |
| 3.7 | **Talents**: Star books and Resets tabs, added levels, point sources | L |
| 3.8 | **Drop rate** page (loot farmer = best fighter; Clover Shrine claim waits for Shrines in 4.6) | M |

### Wave 4: World 3 core and World 1 core, interleaved

W3 Systems with no advice at all, then the W1 pages an early player meets first.

| # | Item | Effort |
|---|---|---|
| 4.1 | **Equinox** page (locked Mirror card, bar, 14 Dream Upgrades, clouds); 3 drafts + fact | M |
| 4.2 | **Death Note** page (W1-W4 pages, overkill and multikill, skull Goals; Lab chip); `account.deathNotePages` kept out of history | L |
| 4.3 | **Salt Lick** page on the 2.0 adapter (11 upgrades, salt held for buildings, #6 rate) | M |
| 4.4 | **Atom Collider** page (17 atoms, Hydrogen 90% cap, threshold; atom order display only) | M |
| 4.5 | **Prayers** advice (slots, souls, unlock-next, cheap levels, curse clashes; Unending Energy as a Contested next-action) | L |
| 4.6 | **Shrines** advice (idle shrine H, stack, Equinox total 140) | M |
| 4.7 | **Worship and Tower Defense** (Q7 yes: TD is a Worship tab) | L |
| 4.8 | **Bribes** page (sets, next buy, Bail gate; set order display only) | M |
| 4.9 | **Statues** wall (22 statue sprites, Town Marble, Monolith, Onyx) | L |
| 4.10 | **The Owl** page (restart, Mega Reset, Bonuses of Orion) | M |
| 4.11 | **Post Office** page (companies, streaks, Silver Pens contested, box thresholds) | L |
| 4.12 | **Boss Keys** page (key stock, daily coverage, first clears, mini bosses; key use display only) | L |
| 4.13 | **Beginner line** page (Q5 yes; Rocklyte / Cactolyte / Nebulyte ladders, daily casts) on the 2.7 layer | L |

### Wave 5: World 2 pages and the rest of World 3

| # | Item | Effort |
|---|---|---|
| 5.1 | **Obols** page (Family, Characters, Storage, Reroll & Combine; strict-dominance swap) | L |
| 5.2 | **Islands** page (locked how-to card first; Crystal 13-day peak, garbage, Shimmer; unlock order display only) | L |
| 5.3 | **Killroy** page (rooms with World 3 gate via `killroyWeeks`, run upgrades, Skull Shop and runner orders display only, Prime from the Rift) | L |
| 5.4 | **Weekly Battles** page + Ballot tab (schedule wrapped with `now`, tasks, trophy shop; no voting advice) | L |
| 5.5 | **Arcade** page (after `arcadeNextCost` is authored and checked upstream) | L |
| 5.6 | **Cards** Collection section (set tiers, total levels, star cap view, Mastery frees slots) | M |
| 5.7 | **Cog Board** (cells, flags, spare cogs, boost reach; board plan only with the seeded optimiser, Q6 yes) | L |
| 5.8 | **3D Printer** (empty active slot, sample-size levers and 90% cap, Go Brrr; Skill Mastery base 7 shown as Toolbox applies it, V2) | M |
| 5.9 | **Refinery** (salt balance, cycles, Throttle, move-storage) on the 2.0 adapter | M |
| 5.10 | **Trapping** (free slots after an in-game capacity check, set ladder, critters, Lord of the Hunt) | L |
| 5.11 | **Talent Book Library** page (speed, range ladder, hoarding, build) | M |
| 5.12 | **Armor Smithy** (19 sets incl. the W4 sets Lustre, Diabolical, Troll, Magma from 1.8; keep-before-upgrade; upgrade chain) | M |
| 5.13 | **Bubba** gaps (smoked meats, Spare Coins, gifts, dice, emulsify, Boon chips; gift and milestone orders display only) | M |

### Wave 6: the rest of World 1

| # | Item | Effort |
|---|---|---|
| 6.1 | **Star Signs** W1-W3 rework plus the W4 constellations D-1..D-7 and W4 signs (was 1.8) | L |
| 6.2 | **Colosseum** page (after the ticket reach-rule check in game) | L |
| 6.3 | **Minigames** Highscores tab + **Poppy** page | L |
| 6.4 | **Quests** account page (quest book, missable drops) | M |
| 6.5 | **Anvil** sections (hammers, products, speed ladder, expansions) and Smithing gear stones | M |
| 6.6 | **Upgrade Vault** remaining rows (Kill rows tab, Major Discount) | M |

### Wave 7: late account-wide Systems and class lines

| # | Item | Effort |
|---|---|---|
| 7.1 | **Coins** page (cash multi groups, levers ranked by computed gain, no real-money levers) | L |
| 7.2 | **Achievements** page (world tabs, exact-stack split, task tiers) | L |
| 7.3 | **Pet Park** page (Collection, Pet Mart, Tournament; tokens) | L |
| 7.4 | **Family** page (bonus grid, duplicate line) | M |
| 7.5 | **Guild** page (tasks claimed flag, bonus tree, join Goal) | M |
| 7.6 | **Gem Shop** page (what you own, with `gemShop.json` prices; 1-gem special; teleport cap) | M |
| 7.7 | **Friend bonuses** page (no friend name ever stored) | M |
| 7.8 | **Event Shop** page and owned chips on consumer pages | M |
| 7.9 | **Trophies and Nametags** page with the Hat Rack (Q7 yes); Gallery rows deferred (Appendix B) | L |
| 7.10 | **Town shops** page + "Town shop run" checklist row | M |
| 7.11 | **Daily & Weekly Checklist** additions (rows land with their owning Systems; Reset card; before-reset and week-ending Checks) | L |
| 7.12 | **Class lines**, one PR per line on the 2.7 layer: Barbarian (L), Squire (L), Bowman (L), Hunter (M), Wizard (M), Shaman (L) | L |

### Effort roll-up

Counted by item; Deferred register rows (Appendix B) are excluded.

| Wave | Items | S | M | L |
|---|---|---|---|---|
| 0 | 13 (+8 fixes in 0.9) | 5 | 7 | 1 |
| 1 | 6 + 3 hooks | 3 | 0 | 6 |
| 2 | 10 + 6 quick wins | 6 | 4 | 6 |
| 3 | 8 | 0 | 3 | 5 |
| 4 | 13 | 0 | 6 | 7 |
| 5 | 13 | 0 | 6 | 7 |
| 6 | 6 | 0 | 3 | 3 |
| 7 | 12 (class lines counted once) | 0 | 6 | 6 |

## 5. Cross-area conflicts and the calls made here

Both views stay in the area files and drafts; this table records which one the build follows and how sure we are.

| # | Conflict | Views | Call for M26 | Confidence |
|---|---|---|---|---|
| X1 | Rift numbering | contradictions-1 (N.js + wiki): game shows `Rift[0]+1`. rift map and metapath patch: label "Rift N" = `Rift[0]`, relabel role `rift-8` -> `rift-7` | Store and compare `Rift[0]`; every UI label is `Rift[0]+1` via `riftLabel()`; keep role ids, fix their text. Elite drafts that say "Rift 8 / 9" are rewritten to the displayed number | H |
| X2 | Unending Energy 10 h cap | prayers and monster-afk maps: hard blocker (curse text). contradictions-2: no code path enforces it | One entry `prayers.check.unending-overnight`, status Contested, next-action, "may stop" wording; `afk.check.unending-energy-cap` folds into it | M |
| X3 | Killroy room 2 | killroy map: adopt Toolbox's 2-room baseline. contradictions-1 verdict 4: Toolbox over-counts; room 2 needs World 3 finished | Keep ActiveOn's World 3 gate; room 3 nested inside it; regression test | H |
| X4 | Salt Lick #6 | Toolbox: capacity only. Game code: +1%/level liquid rate on all liquids, capacity via Bleach/Dragonic | Compute the rate in the adapter with provenance "game client"; liquids keep the observed-rate approach | H |
| X5 | Insider Trading | bribe text 5%, data value 8% | Use 8% (data); show "the in-game text says 5%" | H |
| X6 | Pet Arena placement | coins-cash text called it W2 | W4 Breeding (`accountOptions[89]`); one generated 16-rung ladder; merge `arena-wave` and `arena-next-wave` | H |
| X7 | Speedna steps | old text "first step 130%" | 116 / 130 / 145%; 115% exactly gives 0 (float rule) | H |
| X8 | Idle-fighting talent at 0 | talents map `talents.check.idle-talent-zero`; CL `talents.check.core-missing` and `classes.check.idle-casting-zero` | Keep CL's two ids (core-missing for Idle Brawling / Shooting, idle-casting-zero for the Mage line); idle-talent-zero becomes an amendment | H |
| X9 | Talent above its bubble cap | talents map `talents.check.bubble-raise`; CL D7 four entries on one detector | One Detector `builds/bubble-capped-talent`; four texts; bubble-raise retired | H |
| X10 | Golden food in storage | `food.check.golden-unequipped`, `afk.check.golden-food-idle`, `coins.check.golden-bread` | Food owns "equip what you hold"; afk and coins lines fire only when the food is on the wrong character | M |
| X11 | Empty friend slot | `friend-bonuses.check.free-slots`, `pets.check.friend-slot-empty` | friend-bonuses owns it; pets links | H |
| X12 | Lab weekly shop | `lab.check.weekly-chip/jewel` (W4), `lab.check.weekly-rotation` (checklist) | Lab owns the Checks; the checklist row reads them | H |
| X13 | Shrine off the AFK map | `shrines.check.idle` (W3), `shrines.check.off-afk-map` (monster-afk), `drop-rate.check.clover-shrine-farmer` | shrines.check.idle owns it; Clover Shrine suppresses it while the drop-rate check fires; off-afk-map retired. Verify `mapId 0` = not placed first | M |
| X14 | Daily-key coverage | quests `key-quest-every-character` vs boss-keys `unlock-daily` | Boss Keys owns it; Djonnut threshold > 5 vs > 6 kept as "check in game" | M |
| X15 | Duplicate drafts W1 | `anvil.goal.next-tab` twice; `anvil.check.empty-hammer` vs `hammers`; four Forge checks | Keep anvil-map next-tab (tab 7, stage-gated text); keep `hammers`; keep the forge map's pair | H |
| X16 | Elite overlaps | journeyman Nebulyte vs elite Voidwalker; Bubonic tubes x2; family-start x3 | The W4 elite entries own elite-specific ids; family map owns family-start rows | H |
| X17 | Field ownership | `account.rift.current/currentRift/level`; `account.storageChests` vs `account.storage.chestsUsed`; `characters[].mainStats` vs `.stats`; three drop-rate fields; Ivory per map | One owner field each: `account.rift.level`, `account.storage.chestsUsed`, `characters[].stats`, `characters[].dropRate`, `AlchemyState.ivory: boolean[4]` | H |
| X18 | Monster and NPC sprite grids | W1 `bosses.ts`, W2 `places.ts` ("open monsters.ts if more arrive"), CL `mobs.ts`/`npcs.ts`, W4 `classes.ts` for `npc-eliteus` | One `mobs.ts` (monsters, bosses, mini bosses) and one `npcs.ts` (every NPC figure) | design call |
| X19 | Stat glyph grid | W1/W2 `talents.ts`, AW `stats.ts` | One `stats.ts` for every `stat-*` glyph | design call |
| X20 | Equinox "unlocked" | Toolbox `equinox.unlocked` true without the Mirror | Adapter rule: Mirror owned, Equinox_Visitor, or any Dream Upgrade > 0 | H |
| X21 | Boss x5 card drop on unowned bosses | cards-view applies it; one N.js read says bosses are excluded | Change only after a second code read | L |

## 6. Open questions for the owner (batched)

1. Q1 `status: draft` in the schema, or flip at promotion (Wave 0.2)?
2. Q2 Stage registry past W4-entry: add W4-mid and W4-late now, or a "beyond" policy only (Wave 0.1)?
3. Q3 Tome before W4: show rows before Account LV 350 labelled "not counting yet" (corrected: Toolbox counts no Tome PTS below 350, `tome.ts#L44,#L54`), or hide until W4 (C31)?
4. Q4 One `characters[].classKit` union or one field per line (CL D6)?
5. Q5 Beginner line: its own page plus a Class lines card (proposed), or the card only?
6. Q6 Cog Board plan: allow Toolbox's randomised optimiser in the worker with a seeded `Math.random`, or leave the plan out?
7. Q7 Tower Defense as a Worship tab (proposed) or its own System; Hat Rack inside Trophies (proposed) or its own System?
8. Q8 Upstream reports to Toolbox (getKillRoy world gate, Salt Lick rate, Throttle maxLevel, Farsight y): each is an outbound message and needs a yes per message. None was sent. The Killroy Prime and Skill Mastery gates are no longer on the list: vendored Toolbox applies them ungated on purpose (`printer.ts#L101`), and only V2 can say whether the game gates them.

**Owner answers (2026-10-19).** The owner replied "Yes to all your questions". This file reads that as accepting each
recommended option: Q1 schema `status: draft`; Q2 W4-mid and W4-late now; Q3 Tome rows shown before Account LV 350
labelled "not counting yet" (the earlier "300" was wrong, see spec Q3); Q4 one `classKit` union; Q5 Beginner line
page plus card; Q6 seeded optimiser; Q7 TD as a Worship tab and Hat Rack inside Trophies. Q8 is not covered by a
blanket yes: each upstream message still needs its own yes. The spec section 13 lists the mapping for confirmation.

## 7. In-game checks (owner, credential-bound, minutes each)

Fresh save of the W4 test account; Poppy world (W1 vs W2 Secret Map); Colosseum ticket reach rule; Djonnut key
threshold; empty hammer slot; Megafeather cap; Silver Pen and streak; mini-boss counter reset; trap capacity on
2.3.540; finished Cog Board flag lifts itself; Unending Energy 10 h; Printer Go Brrr cooldown unit; Hat Rack
auto-deposit; Equinox Mirror drop text (1 in 10 vs 1 in 1000); Auto Refine behaviour; Pet Tournament team size.

## Appendix A. The full system x mechanic matrix (1,418 rows)

Columns as in section 2. **Advice today** is what ships now. **Proposed / draft** is filled where the area map pinned
draft ids to the row (W2, W4); every other area lists its drafts per System in its synthesis section 2 and in
`kb-drafts/<system>.yaml`. Rows marked `*` in Effort carry the System's effort because the map gave none per row.
Mechanic names are as the maps wrote them, sometimes cut at 110 characters.

| # | Area | System | Mechanic | Data | Shown | Advice today | Proposed / draft | Meta conf. | Effort |
|---|---|---|---|---|---|---|---|---|---|
| 1 | W1 | anvil | Production: hammers turn time into products (progress, amount, capacity, offline accumulation) | adapter | yes | yes |  | H | M* |
| 2 | W1 | anvil | Product catalogue: unlock by Smithing level, work per item, EXP per item (Thread best EXP per work) | toolbox-only | partial | no |  | H | M* |
| 3 | W1 | anvil | Hammer slots (base 1, Infinity Hammer +1, Hammer Hammer +1) | adapter | no | partial |  | H/L | M* |
| 4 | W1 | anvil | Speed formula and its sources (AGI factor, Anvil Zoomer stamp, Blacksmith Box, Anvil Statue, Production Revolution, Hammer Hammer, Bob Build Guy, Broken Time) | adapter | partial | yes |  | H | M* |
| 5 | W1 | anvil | Capacity (points x material bag capacity, 2e9 cap) | adapter | yes | yes |  | H/L | M* |
| 6 | W1 | anvil | EXP side: Exp points, Smithing EXP multiplier, Focused Soul / stamps / cards / box / mastery / Left Hand | adapter | partial | no |  | H/L | M* |
| 7 | W1 | anvil | Points from Smithing level | adapter | yes | yes |  | H | M* |
| 8 | W1 | anvil | Points from coins (600 max, cubic cost) | adapter | partial | yes |  | H/L | M* |
| 9 | W1 | anvil | Points from monster materials (cost item changes at thresholds; 700 cap per wiki) | toolbox-only | no | no |  | H/M | M* |
| 10 | W1 | anvil | Anvilnomics (bubble a4) cuts coin and mat point costs, 10% floor, Archer class multiplier | toolbox-only | no | no |  | H | M* |
| 11 | W1 | anvil | Acme Anvil (Archer talent) points; negative pool after a talent reset | toolbox-only | no | partial |  | M/L | M* |
| 12 | W1 | anvil | Unspent points (recomputed, stored value stale) | adapter | yes | yes |  | H | M* |
| 13 | W1 | anvil | Anvil Reset Whetstone respec | adapter | yes | yes |  | H/L | M* |
| 14 | W1 | anvil | Fill time against the Expected Return | adapter | yes | yes |  | H | M* |
| 15 | W1 | anvil | Blacksmith Box (Post Office): Smithing EXP, production speed, craft +1 slot | toolbox-only | no | no |  | H | M* |
| 16 | W1 | anvil | Anvil Expansions (crafting tabs 2-7) | adapter | partial | partial |  | H/M | M* |
| 17 | W1 | anvil | Anvil crafting side: Godly Creation, Sculpting/Guilding Tools, Onyx/Zenith Tools | toolbox-only | no | no |  | L | M* |
| 18 | W1 | anvil | Quick Deposit / Codex Quick Ref | missing | no | no |  | L | M* |
| 19 | W1 | anvil | Prisma'd Hammer Hammer / Anvilnomics | toolbox-only | no | no |  | H | M* |
| 20 | W1 | anvil | Production Revolution (Upgrade Vault 24) | adapter | yes | yes |  | H/L | M* |
| 21 | W1 | boss-keys | Boss key stock (Key1-Key5 held) | toolbox-only | no | no |  | H | L* |
| 22 | W1 | boss-keys | Daily-key bank (Dog Bone, Djonnut, Bellows) | adapter | yes | yes |  | H | L* |
| 23 | W1 | boss-keys | Daily-key coverage (characters earning each NPC's key) | adapter | no | no |  | M | L* |
| 24 | W1 | boss-keys | Key-paying NPC quests (Dog Bone 1-2, Djonnut 1-3, Bellows 1-4) | adapter | partial | no |  | H | L* |
| 25 | W1 | boss-keys | First clears and portal crystals | adapter | partial | no |  | M/L | L* |
| 26 | W1 | boss-keys | Boss difficulty selected (BossInfo) | toolbox-only | no | no |  | H | L* |
| 27 | W1 | boss-keys | Entry cost per difficulty | missing | no | no |  | M | L* |
| 28 | W1 | boss-keys | Boss stats and drops (materials, cards) | adapter | partial | no |  | L/H | L* |
| 29 | W1 | boss-keys | Amarok Slabs for Dog Bone quest 2 | adapter | no | no |  | M | L* |
| 30 | W1 | boss-keys | Merit shop: boss key drops (W1 #4) and boss gems (W2 #4) | adapter | no | no |  | M | L* |
| 31 | W1 | boss-keys | Mini-boss summon counts (Slush, Mush; Magmus/Spiritlord W5+) | toolbox-only | no | no |  | H/M | L* |
| 32 | W1 | boss-keys | Mini-boss summon items and other mini bosses (King Doot, Biggie Hours) | missing | no | no |  | L | L* |
| 33 | W1 | boss-keys | Mini-boss Death Note page (Multikill) | toolbox-only | no | no |  | M | L* |
| 34 | W1 | boss-keys | Baba Yaga / Dr Defecaus respawns | missing | no | no |  | H | L* |
| 35 | W1 | boss-keys | Non-NPC key sources (W4 has no daily NPC) | missing | no | no |  | H/L | L* |
| 36 | W1 | boss-keys | Boss achievements and boss-key EZ-Access | toolbox-only | no | no |  | L | L* |
| 37 | W1 | boss-keys | Troll missions / 3rd task vulnerability | missing | no | no |  | L | L* |
| 38 | W1 | boss-keys | Speedrun boss portals (BOSSING_VAIN) | toolbox-only | no | no |  | H | L* |
| 39 | W1 | bribes | Bribe ownership and set chain (BribeStatus, expansion bribes) | adapter | no | partial |  | H | M |
| 40 | W1 | bribes | Buy affordable book bribes (per-session spend) | adapter | yes | yes |  | M | S |
| 41 | W1 | bribes | Changing the Code (idx 15): second big-bubble slot | adapter | yes | yes |  | H | S |
| 42 | W1 | bribes | Insider Trading (idx 0): stamp coin cost -8% (code value, text says 5%) | toolbox-only | partial | yes |  | H | S |
| 43 | W1 | bribes | Fight/skill AFK bribes: Sleeping on the Job (3, +5 fight AFK), AFKeylogging (24, +2 skill AFK all skills), Double Exp Scheme (7, 2.2% x2 EXP per claim) | toolbox-only | no | partial |  | H | S |
| 44 | W1 | bribes | Set 4 combat/utility bribes: Photoshopped Dmg Range (20), Glitched Acc Formula (21), Firewalled Defence (22), Bottomless Bags (23), Guild GP Hack (25) | toolbox-only | no | partial |  | M | S |
| 45 | W1 | bribes | Low-value / text-mismatch bribes: Fossil Fuel Legislation (9: code 0.2% oil, text 80%), teleport bribes (11, 13: daily teleports, formula disputed) | toolbox-only | no | partial |  | H | S |
| 46 | W1 | bribes | W3 bribes with game-wide effects: Weighted Marbles (14, arcade ball rate), Taxidermied Cog Pouches (16, +4 cog slots), Guild VIP Fraud (17), Library Double Agent (18, Talent Library min book level +4) | toolbox-only | no | partial |  | H | S |
| 47 | W1 | bribes | The Art of the Bail (26): set 5 gate via Trash Island (Garbage Tuna) | toolbox-only | no | no |  | M | S |
| 48 | W1 | bribes | Sets 5-6 (idx 27-39) and The Art of the Grail / Flail (33, 40) | adapter | no | no |  | H | S |
| 49 | W1 | bribes | Code value vs description text (game applies data 'value') | adapter | no | no |  | H | S |
| 50 | W1 | bribes | Unlock: bribes open with Stamps at Mr Pigibank (class Lv 14) | adapter | yes | yes |  | M | S |
| 51 | AW | bribes | Insider Trading value (bribes[0]: stamp coin cost x (1 - 8/100); in-game text says 5%) | adapter | yes | yes |  | H | S |
| 52 | AW | bribes | Bribe catalogue: description text can differ from data value | toolbox-only | partial | yes |  | H | M |
| 53 | W1 | colosseum | Ticket balance (CYColosseumTickets) | adapter | no | yes |  | H | L* |
| 54 | W1 | colosseum | NPC daily ticket banks (Typhoon / Centurion / Lonely Hunter) and the reach rule | adapter | yes | yes |  | H/M | L* |
| 55 | W1 | colosseum | Duplicate Entries (Upgrade Vault row 52) | adapter | yes | yes |  | H/L | L* |
| 56 | W1 | colosseum | Ticket NPC quests (one-time ticket rewards, unlock of daily tickets) | toolbox-only | no | no |  | H | L* |
| 57 | W1 | colosseum | Post Office Cosmic Carrier ticket reward | missing | no | no |  | L | L* |
| 58 | W1 | colosseum | Arena entry cost 1/2/3/6/10/30 | missing | partial | no |  | M/H | L* |
| 59 | W1 | colosseum | Waves, final boss, all-waves-for-Gold rule | missing | no | no |  | M/L | L* |
| 60 | W1 | colosseum | Score multiplier and Time Bonus | missing | no | no |  | M/L | L* |
| 61 | W1 | colosseum | Chest tiers by score (8 slots per arena) | missing | no | no |  | L | L* |
| 62 | W1 | colosseum | High score per arena (account-wide best) | toolbox-only | no | no |  | H | L* |
| 63 | W1 | colosseum | Tome: Total Colosseum Score | toolbox-only | no | no |  | H | L* |
| 64 | W1 | colosseum | Score achievements (Colosseum_Contender, Sweet_Victory, Cool_Score!, Zero_G_Scorin') | toolbox-only | no | no |  | H | L* |
| 65 | W1 | colosseum | Centurion rank ladder (Centurion3-8) | toolbox-only | no | no |  | H/L | L* |
| 66 | W1 | colosseum | Royal Worm 'Royal Score' (48.5M) | toolbox-only | no | no |  | H/L | L* |
| 67 | W1 | colosseum | Guild tasks Play_W1_Colosseum / Play_W2_Colosseum | adapter | yes | yes |  | H | L* |
| 68 | W1 | colosseum | Star chart constellations A-8 (Dewdrop, 3 players) and B-5 (Sandstone, 4 players) | adapter | yes | yes |  | H | L* |
| 69 | W1 | colosseum | Task 'Begone, Skeleton!' (Xylobones in Chillsnap) | toolbox-only | no | no |  | H/L | L* |
| 70 | W1 | colosseum | Exclusions from AFK / portals | adapter | yes | yes |  | H | L* |
| 71 | W1 | colosseum | Class meta (Divine Knight W1-W4, Bubonic Conjurer W5-W6) | missing | no | no |  | L/M | L* |
| 72 | W1 | colosseum | Per-arena leaderboards (Toolbox w1Colo..w6Colo) | missing | no | no |  | H | L* |
| 73 | W1 | colosseum | Lonely_Hunter3 chest-opening quest (7 Bronze / 3 Silver / 1 Gold) | toolbox-only | no | no |  | H | L* |
| 74 | W1 | forge | Slots unlocked (New Forge Slot 0-16) | toolbox-only | no | no |  | H | L* |
| 75 | W1 | forge | Slot ore fill and idle slots (smelt cycle, leftover below Amount) | toolbox-only | no | no |  | H | L* |
| 76 | W1 | forge | Runs dry before the Expected Return | toolbox-only | no | no |  | H | L* |
| 77 | W1 | forge | Bars waiting in output | adapter | partial | partial |  | M | L* |
| 78 | W1 | forge | Ore capacity and its multipliers (Arcade 26, Godshard card, Forge Stamp, Forge_Cap_Smuggling bribe, Vault Beeg Forge, Vitamin D-licious, Smithing mastery, Beeg Beeg Forge) | toolbox-only | no | no |  | H | L* |
| 79 | W1 | forge | Forge Speed and slot speed | toolbox-only | no | no |  | H | L* |
| 80 | W1 | forge | Forge upgrades (6): levels, max, costs, buy order | toolbox-only | no | no |  | L | L* |
| 81 | W1 | forge | Barrels (speed and double-bar) and barrel use | toolbox-only | no | no |  | M | L* |
| 82 | W1 | forge | Brimstone slots (gem shop 104) | adapter | no | no |  | M | L* |
| 83 | W1 | forge | Fossil Fuel Legislation bribe (barrel use) | adapter | partial | partial |  | L | L* |
| 84 | W1 | forge | Extra-bar chance (Bar Bonanza, double-bar barrels, Brimstone) and stacking | missing | no | no |  | L | L* |
| 85 | W1 | forge | Forge EXP Gain + Fire/Cinder Forge cards (Smithing EXP) | toolbox-only | no | no |  | L | L* |
| 86 | W1 | forge | Puff Puff Go (AFK card drop chance) | toolbox-only | no | no |  | M | L* |
| 87 | W1 | forge | Archer SMELTIN' ERRYDAY (kill-driven forge progress) | toolbox-only | no | no |  | L | L* |
| 88 | W1 | forge | Glumlee tutorial quests (Tutorial Oil, Learning to Smelt) | adapter | yes | yes |  | H | L* |
| 89 | W1 | minigames | Skill-minigame daily play pool (Choppin, Mining, Fishing, Catching) | adapter | partial | yes |  | H/L | L* |
| 90 | W1 | minigames | Skill-minigame highscores | adapter | no | partial |  | H | L* |
| 91 | W1 | minigames | Highscore-scaled talents: CHOPPIN_IT_UP_EZ (463, Mage line) and BOBBIN_BOBBERS (116, Barbarian) | adapter | no | partial |  | H | L* |
| 92 | W1 | minigames | Tome row 75 Total Minigame Highscore (450 for 100 points) | toolbox-only | no | no |  | H | L* |
| 93 | W1 | minigames | Gem Shop Daily Minigame Plays (item 72, 900 gems for +16) | adapter | no | no |  | H | L* |
| 94 | W1 | minigames | Antifun Spirit prayer / Miniature Game star sign (reward multiplier) | missing | no | no |  | M/L | L* |
| 95 | W1 | minigames | Swishy Hoops: play and cooldown | adapter | yes | yes |  | M | L* |
| 96 | W1 | minigames | Swishy Hoops: points and upgrade costs | adapter | yes | yes |  | H/L | L* |
| 97 | W1 | minigames | Swishy Hoops: unlock ladder by total levels (COIN 12 / EXP 80 / SKILL 200) | adapter | no | no |  | H | L* |
| 98 | W1 | minigames | Throwy Darts: play and cooldown | adapter | yes | yes |  | M | L* |
| 99 | W1 | minigames | Throwy Darts: points, costs and spend order | adapter | yes | yes |  | H/M | L* |
| 100 | W1 | minigames | Throwy Darts: unlock ladder (TALENT 40 / VAULT 150 / SPEED 250) | adapter | no | no |  | H | L* |
| 101 | W1 | minigames | Baller (Hoops 40) and Nine Dart Finish trophies | missing | no | no |  | L | L* |
| 102 | W1 | minigames | Spiketrap Surprise: daily gem round | adapter | yes | yes |  | M/L | L* |
| 103 | W1 | minigames | Spiketrap best round for Tome row 12 (round 13 = 100 points) | adapter | partial | no |  | H | L* |
| 104 | W1 | minigames | Pen Pals highscore tiers (W3 Trapping) | toolbox-only | no | no |  | H | L* |
| 105 | W1 | minigames | Poppy unlock (W2 Secret Map) | adapter | partial | no |  | H/L | L* |
| 106 | W1 | minigames | Poppy bank and conversion (pendingFish) | adapter | yes | yes |  | H | L* |
| 107 | W1 | minigames | Poppy upgrades: levels, costs, unlock by run progress | toolbox-only | no | no |  | H | L* |
| 108 | W1 | minigames | Fish rate and catch interval | toolbox-only | no | no |  | H | L* |
| 109 | W1 | minigames | Fisheroo Reset (mini reset) | toolbox-only | no | no |  | H/L | L* |
| 110 | W1 | minigames | Fisheroo reset spirals (5 reset bonuses) | toolbox-only | no | no |  | H/L | L* |
| 111 | W1 | minigames | Greatest Catch and Megafish | toolbox-only | no | no |  | H | L* |
| 112 | W1 | minigames | Bonuses from Poppy (7 permanent stats) | toolbox-only | no | no |  | H | L* |
| 113 | W1 | minigames | Shiny fishing progress and multipliers | toolbox-only | no | no |  | H/M | L* |
| 114 | W1 | minigames | Tar Pit and Tartar fish | toolbox-only | no | no |  | H | L* |
| 115 | W1 | minigames | Orion the Owl | toolbox-only | no | no |  | H | L* |
| 116 | W1 | minigames | Bubba | adapter | yes | yes |  | H | L* |
| 117 | W1 | minigames | Colosseum scores and achievements | toolbox-only | no | yes |  | H/L | L* |
| 118 | W1 | minigames | Tome rows for Megafeathers / Megafish / Megaflesh (12 each = 250 points) | toolbox-only | no | no |  | H | L* |
| 119 | W1 | owl | Unlock and upgrade unlock gate (progress, nextLvReq) | toolbox-only | no | no |  | H/M | M* |
| 120 | W1 | owl | Feathers and feather rate | toolbox-only | no | no |  | H | M* |
| 121 | W1 | owl | Feather Generation (upgrade 0) | toolbox-only | no | no |  | H/L | M* |
| 122 | W1 | owl | Feather Multiplier (upgrade 2) | toolbox-only | no | no |  | H/L | M* |
| 123 | W1 | owl | Feather Cheapener (upgrade 3) | toolbox-only | no | no |  | H/L | M* |
| 124 | W1 | owl | Super Feather Production (upgrade 5) | toolbox-only | no | no |  | H/L | M* |
| 125 | W1 | owl | Super Feather Cheapener (upgrade 7) | toolbox-only | no | no |  | H/L | M* |
| 126 | W1 | owl | Bonuses of Orion (upgrade 1, never resets) | toolbox-only | no | no |  | H | M* |
| 127 | W1 | owl | Feather Restart (upgrade 4) | toolbox-only | no | no |  | H/M | M* |
| 128 | W1 | owl | Shiny Feathers (upgrade 6 + shiny count) | toolbox-only | no | no |  | H/L | M* |
| 129 | W1 | owl | The Great Mega Reset and Megafeathers (upgrade 8) | toolbox-only | no | no |  | H/M | M* |
| 130 | W1 | owl | Cross-system multipliers on feather rate and on Orion bonuses | toolbox-only | no | no |  | H | M* |
| 131 | W1 | owl | Away-time credit and 2hrOfOrionFeathers item | missing | no | no |  | L | M* |
| 132 | W1 | post-office | Unlock quest (Postboy Pablob, 5 Empty Boxes) | adapter | partial | yes |  | H | L* |
| 133 | W1 | post-office | Daily order board and refresh timer | adapter | partial | yes |  | M | L* |
| 134 | W1 | post-office | Per-company counters: total shipments, streak, shield | toolbox-only | no | no |  | M | L* |
| 135 | W1 | post-office | Streak bonuses (+1/+3/+5/+9 boxes at fixed streaks) | toolbox-only | no | no |  | M | L* |
| 136 | W1 | post-office | Silver Pens (skip an order, keep the streak) and Ink Blot | toolbox-only | no | no |  | M | L* |
| 137 | W1 | post-office | Box income and available points (orders + streak + vial + option slots) | adapter | partial | yes |  | M | L* |
| 138 | W1 | post-office | Slug Slurp vial (+2 box points per level, every character) | adapter | partial | no |  | M | L* |
| 139 | W1 | post-office | Box levels per character (24 boxes, 1 point = 1 level) | toolbox-only | no | partial |  | M | L* |
| 140 | W1 | post-office | Bonus thresholds and growth curves (bonus 2 from L26, bonus 3 from L101) | toolbox-only | no | no |  | H | L* |
| 141 | W1 | post-office | Box allocation order per class | toolbox-only | no | partial |  | M | L* |
| 142 | W1 | post-office | Which box bonuses are wired (multi-system lever) | toolbox-only | no | no |  | H | L* |
| 143 | W1 | post-office | Box reset item (Post Office Box Reseto Magnifico) | adapter | no | no |  | L | L* |
| 144 | W1 | post-office | Orders milestone task 'The Unstoppable USPS' | toolbox-only | no | no |  | H | L* |
| 145 | W1 | post-office | Tome delivery-box row | toolbox-only | no | no |  | H | L* |
| 146 | W1 | post-office | Order rewards (stones, foods, statues, keys, gems, potions) | missing | no | no |  | M | L* |
| 147 | W1 | post-office | Order contents and quantity growth (storage stockpiles) | missing | no | no |  | M | L* |
| 148 | W1 | post-office | Tab 2 (Charlie's Crates) gating, W5+ boxes, sailing relic box chance | missing | no | no |  | L | L* |
| 149 | W1 | quests | Quest record and status per character (M1, M21, M22) | adapter | partial | partial |  | H | M |
| 150 | W1 | quests | Account quest book: NPCs and steps by world, who finished each (M2, M4 reclaimable, M24 world-less NPCs) | toolbox-only | no | no |  | H | M |
| 151 | W1 | quests | Unique quest count and its milestones (M3, M10 Tome, M25 Equinox dream, achievements) | toolbox-only | no | no |  | H | S |
| 152 | W1 | quests | Quest-gated (missable) drops (M5, M23) | toolbox-only | no | no |  | M | S |
| 153 | W1 | quests | World gatekeepers and gate quests (M6, M24) | adapter | yes | yes |  | H | S |
| 154 | W1 | quests | Boss-key dailies and the 'every character' key quests (M7) | adapter | yes | partial |  | M | S |
| 155 | W1 | quests | Colosseum ticket dailies (M8) | adapter | yes | yes |  | H | S |
| 156 | W1 | quests | Unique-quest star talents: Quest Kapow, Studious Quester, Quest Chungus (M9, M26) | adapter | partial | no |  | H | S |
| 157 | W1 | quests | Special Talent Book quests (M13) | toolbox-only | no | no |  | M | S |
| 158 | W1 | quests | Omar Da Ogar bottle quests (M11) | toolbox-only | no | no |  | M | S |
| 159 | W1 | quests | Stamp quests (M14) | adapter | yes | yes |  | M | S |
| 160 | W1 | quests | Space rewards: inventory bags and storage chests (M15) | adapter | no | no |  | L | S |
| 161 | W1 | quests | Talent and star-talent resets, talent points (M12) | adapter | no | no |  | H | S |
| 162 | W1 | quests | AFK and time-gated Custom quests (M17, M22) | adapter | no | no |  | M | S |
| 163 | W1 | quests | Class quests (M18) | adapter | yes | yes |  | H | S |
| 164 | W1 | quests | Trophies and NPC tokens from quests (M19, M27) | toolbox-only | no | no |  | M | S |
| 165 | W1 | quests | Picnic Stowaway daily line (M16) | adapter | no | no |  | L | S |
| 166 | W1 | quests | Town unlocks by highest class level (C32) | adapter | yes | no |  | L | S |
| 167 | W1 | quests | Royal Worm 22-W4-quests meta quest, W4 NPCs (Gobo, Capital P, Oinkin, Monolith, Eliteus) (M27, Min-max W4) | adapter | partial | partial |  | M | M |
| 168 | W1 | quests | Seasonal / event NPCs (M20) | adapter | no | no |  | H | S |
| 169 | W1 | smithing | Anvil Produce: products, capacity, fill time | adapter | yes | yes |  | H | L* |
| 170 | W1 | smithing | Hammer count (base, Infinity Hammer, Hammer Hammer bubble) | adapter | partial | no |  | M | L* |
| 171 | W1 | smithing | Product choice (Thread for EXP vs recipe demand) | adapter | partial | no |  | M | L* |
| 172 | W1 | smithing | Anvil points: Speed / Capacity / Exp split | adapter | yes | yes |  | H | L* |
| 173 | W1 | smithing | Anvil coin points | adapter | yes | yes |  | H | L* |
| 174 | W1 | smithing | Monster-material anvil points | toolbox-only | no | no |  | L | L* |
| 175 | W1 | smithing | Anvil Reset Whetstone respec | adapter | yes | yes |  | H | L* |
| 176 | W1 | smithing | Acme Anvil Archer point trick / negative balance | adapter | no | no |  | M | L* |
| 177 | W1 | smithing | Smithing level, EXP and level gates | adapter | yes | partial |  | H | L* |
| 178 | W1 | smithing | Smithing EXP multiplier breakdown | toolbox-only | no | no |  | L | L* |
| 179 | W1 | smithing | Anvil tab expansions (Tabs 2-5 in W1-W4) | adapter | partial | partial |  | M | L* |
| 180 | W1 | smithing | Craft recipes and recipe unlock state | adapter | yes | yes |  | M | L* |
| 181 | W1 | smithing | Material pouches (anvil capacity base) | toolbox-only | no | no |  | M | L* |
| 182 | W1 | smithing | Gear ladder (W1-W4 sets and tools) | adapter | yes | yes |  | M | L* |
| 183 | W1 | smithing | Upgrade slots and upgrade stones | adapter | partial | no |  | M | L* |
| 184 | W1 | smithing | Godly Creation and Blacksmith Box +1 slot | toolbox-only | no | no |  | L | L* |
| 185 | W1 | smithing | Blacksmith Box (Post Office): Smithing EXP, Production Speed, +1 slot | toolbox-only | no | partial |  | L | L* |
| 186 | W1 | smithing | Archer Smithing talents (Focused Soul, Broken Time, Acme Anvil, Smeltin' Erryday, Yea I Already Know, Veins of the Infernal) | adapter | yes | partial |  | M | L* |
| 187 | W1 | smithing | Forge slots, ore loading, bars waiting | toolbox-only | no | no |  | H | L* |
| 188 | W1 | smithing | Forge upgrades (slots, ore capacity, speed, EXP gain, Bar Bonanza, Puff Puff Go) | toolbox-only | no | no |  | L | L* |
| 189 | W1 | smithing | Forge speed, Brimstone slots and barrels | toolbox-only | no | no |  | H | L* |
| 190 | W1 | smithing | Forge ore capacity | toolbox-only | no | no |  | H | L* |
| 191 | W1 | smithing | Armor-set Smithy: hire and register | adapter | yes | yes |  | M | L* |
| 192 | W1 | smithing | Set bonuses (19 sets) | adapter | yes | yes |  | H | L* |
| 193 | W1 | smithing | Skill Mastery (total Smithing 150/200/300...) | toolbox-only | no | no |  | H | L* |
| 194 | W1 | smithing | Offline production and Quick Deposit | adapter | yes | yes |  | H | L* |
| 195 | W1 | smithing | Smeltin' Erryday (Archer kills speed the Forge) | adapter | no | no |  | L | L* |
| 196 | W1 | stamps | Collection (own a stamp: shop, hand-in, quest, drop, Trash Island) | adapter | yes | yes |  | H | S |
| 197 | W1 | stamps | Level up with coins (below cap) | adapter | yes | yes |  | H | S |
| 198 | W1 | stamps | Max-level raise (material + coins, cap step m) | adapter | partial | yes |  | H | M |
| 199 | W1 | stamps | Carry capacity wall | adapter | partial | partial |  | H | S |
| 200 | W1 | stamps | Hydrogen Stamp Decreaser (W3 Atom Collider) | adapter | partial | yes |  | H | S |
| 201 | W1 | stamps | Gilded Stamps (Rift 26 Stamp Mastery) | adapter | partial | partial |  | H | S |
| 202 | W1 | stamps | Total stamp levels and Gilded chance | adapter | no | no |  | H | S |
| 203 | W1 | stamps | Skill-level falloff on skill stamps | toolbox-only | no | no |  | H | M |
| 204 | W1 | stamps | Stamp bonus value (growth curve + multipliers) | toolbox-only | no | no |  | H | M |
| 205 | W1 | stamps | Certified Stamp Book (Lab, W4) | adapter | partial | no |  | H | S |
| 206 | W1 | stamps | Cost reducers: Insider Trading, MatCostStamp vials, Envelope Pile sigil, Meritocracy | adapter | partial | partial |  | H | S |
| 207 | W1 | stamps | Daily free stamp levels (bundle, event shop, Summoning, Ninja Stamp Stack) | toolbox-only | no | no |  | M | S |
| 208 | W1 | stamps | Exalted stamps (W6 Windwalker Compass) | toolbox-only | no | no |  | H | M |
| 209 | W1 | stamps | Golden Apple Stamp as a golden-food multiplier (M21) | toolbox-only | no | no |  | H | S |
| 210 | W1 | stamps | Future-cost planning (next three raise tiers, minimum Hydrogen to fit carry) (M15) | adapter | no | partial |  | H | S |
| 211 | W1 | stamps | Bonus lookups and evaluation order (M16, M22) | toolbox-only | no | no |  | H | S |
| 212 | W1 | stamps | Live catalogue and unobtainable stamps (M17) | adapter | yes | yes |  | H | S |
| 213 | AW | stamps | Stamp Mastery / Gilded Stamp daily roll (code 25, shown Rift 26) | adapter | partial | partial |  | H | S |
| 214 | W1 | star-signs | Star Chart Points (unspent SCP) | adapter | yes | yes |  | H | S |
| 215 | W1 | star-signs | Constellation claim rule (claim-ready stars) | adapter | yes | partial |  | M | S |
| 216 | W1 | star-signs | Constellation types and W1-W3 list (A, B, C) | adapter | yes | yes |  | H | S |
| 217 | W1 | star-signs | W4 constellations (D-1..D-7) | adapter | no | no |  | H | M |
| 218 | W1 | star-signs | AFK-hours constellations and Time Candies | adapter | partial | partial |  | M | S |
| 219 | W1 | star-signs | The Telescope and its quest | adapter | yes | yes |  | H | S |
| 220 | W1 | star-signs | Star Chart tree: unlocking signs (Chronus, Hydron) | adapter | yes | yes |  | M | M |
| 221 | W1 | star-signs | Chart gates (Hydron at 24 nodes, Seraph at 58) | adapter | yes | yes |  | H | S |
| 222 | W1 | star-signs | Sign slots and the Cosmos signs | adapter | yes | yes |  | H | S |
| 223 | W1 | star-signs | Aligning signs per character (fit to AFK Target) | adapter | yes | partial |  | M | S |
| 224 | W1 | star-signs | Bonus resolution (what worn signs add) | toolbox-only | no | no |  | H | M |
| 225 | W1 | star-signs | Infinite Star Signs (Rift Infinite_Stars + shiny pets) | adapter | no | no |  | H | M |
| 226 | W1 | star-signs | Level-gated Major signs | toolbox-only | no | no |  | H | S |
| 227 | W1 | star-signs | Signs with downsides (negatives) | toolbox-only | no | partial |  | M | S |
| 228 | W1 | star-signs | New-character starter pick (The Fuzzy Dice) | adapter | partial | yes |  | L | S |
| 229 | W1 | star-signs | Character-count gates on constellations | adapter | partial | no |  | H | S |
| 230 | W1 | star-signs | Special sign effects (Gum Drop, Bob Build Guy, Mount Eaterest) | toolbox-only | no | no |  | H | S |
| 231 | W1 | star-signs | Silkrode Nanochip and Seraph Cosmos (W5+) | toolbox-only | no | no |  | H | S |
| 232 | W1 | star-signs | Completion trophy (all constellations) | missing | no | no |  | M | S |
| 233 | W1 | statues | Statue catalogue and per-level bonus | adapter | yes | no |  | H | L* |
| 234 | W1 | statues | Levels by deposit; account level = highest character | adapter | yes | no |  | H | L* |
| 235 | W1 | statues | Deposit EXP and progress to next level | toolbox-only | no | no |  | M | L* |
| 236 | W1 | statues | Town Marble quest unlocks depositing (per character) | adapter | partial | no |  | M | L* |
| 237 | W1 | statues | Statue items held (bags and chest) | adapter | no | no |  | H | L* |
| 238 | W1 | statues | Gold grade and its coin price | adapter | yes | partial |  | M/L | L* |
| 239 | W1 | statues | Split levels before Gold (only the highest survives Gold) | adapter | partial | no |  | L | L* |
| 240 | W1 | statues | Class statue talents (per character multiplier) | toolbox-only | no | no |  | H | L* |
| 241 | W1 | statues | Total bonus and the multiplier chain | toolbox-only | no | no |  | H | L* |
| 242 | W1 | statues | Monolith quest 1: 250 total statue levels and 17 types in inventory | adapter | no | no |  | H/M | L* |
| 243 | W1 | statues | Monolith quest 2: Onyx Tools for 20,000 Power statues | adapter | no | no |  | H | L* |
| 244 | W1 | statues | Onyx grade (20,000 stack of a Gold statue, x2 bonus) | adapter | partial | no |  | M/H | L* |
| 245 | W1 | statues | Monolith quest 3 and MONOLITHIALISM (100,000 statues looted) | missing | no | no |  | H/L | L* |
| 246 | W1 | statues | Deposit boosters: Startue EXP bubble and Skinny 0 Cal vial | adapter | no | no |  | H/L | L* |
| 247 | W1 | statues | Drop sources (Crystal mobs, bosses, chests, quests, weekly shop) | toolbox-only | no | no |  | H/M | L* |
| 248 | W1 | statues | Krunk quest 2 consumes 20 Power statues | adapter | no | no |  | H | L* |
| 249 | W1 | statues | Double statue drop | toolbox-only | no | no |  | H | L* |
| 250 | W1 | statues | Tome: Total Statue LV and Total Onyx | toolbox-only | no | no |  | H | L* |
| 251 | W1 | statues | Zenith grade, Zenith Market and Clusters (W7) | toolbox-only | no | no |  | H | L* |
| 252 | W1 | statues | Royal Guardian Statue Flair and Royal Statues | toolbox-only | no | no |  | H | L* |
| 253 | W1 | upgrade-vault | Unlock gate (total Vault levels) and next unlock | adapter | yes | yes |  | H | S |
| 254 | W1 | upgrade-vault | Row cost, ladders and cost to max | adapter | yes | yes |  | M | S |
| 255 | W1 | upgrade-vault | Idle coins (affordable open rows) | adapter | yes | yes |  | M | S |
| 256 | W1 | upgrade-vault | Major Discount (row 13) | adapter | yes | partial |  | M | S |
| 257 | W1 | upgrade-vault | W7 cost reducers (Darts, Cryosnake, Sushi) | toolbox-only | no | no |  | H | S |
| 258 | W1 | upgrade-vault | Per-row bonus and Vault Mastery multipliers | toolbox-only | no | partial |  | H | M |
| 259 | W1 | upgrade-vault | Max level (Pot Of Gold Pack, Glimbo) | adapter | yes | no |  | H | S |
| 260 | W1 | upgrade-vault | Kill slots and kill-scaled rows (14, 20, 27, 31, 48) | adapter | partial | yes |  | H | M |
| 261 | W1 | upgrade-vault | Skill/progress-scaled rows (17, 34, 35, 37, 41, 70) | toolbox-only | no | partial |  | H | S |
| 262 | W1 | upgrade-vault | Knockout! ladder (row 15, OptionsListAccount[338]) | toolbox-only | no | partial |  | M | M |
| 263 | W1 | upgrade-vault | One-off rows (7, 8, 9, 36, 44, 52) | adapter | yes | yes |  | H | S |
| 264 | W1 | upgrade-vault | Duplicate Entries before redeeming tickets (row 52) | adapter | yes | yes |  | H | S |
| 265 | W1 | upgrade-vault | Baby on Board lowest-level gate (row 12) | adapter | no | partial |  | H | S |
| 266 | W1 | upgrade-vault | Talent-point rows (1, 6, 40, 49, 51, 53) | adapter | partial | yes |  | M | S |
| 267 | W1 | upgrade-vault | System-multiplier rows W1-W4 (16, 18, 21, 23-26, 28-30, 38, 42, 43, 45-47, 50, 54-60) | adapter | yes | yes |  | L | S |
| 268 | W1 | upgrade-vault | Happy Doggy (row 19, no consumer) | adapter | yes | yes |  | H | S |
| 269 | W1 | upgrade-vault | Vault III rows 62-89 (W5-W6) | toolbox-only | no | no |  | L | S |
| 270 | W1 | upgrade-vault | Weapon Craft discrepancy (row 10) | adapter | yes | yes |  | L | S |
| 271 | W2 | alchemy-bubbles | Bubble levels and their value (curves addDECAY / decay / decayMulti / bigBase) | adapter | yes | yes |  | M | (sys L) |
| 272 | W2 | alchemy-bubbles | Level cost (materials + liquid, Bits, clamp 1e9) | adapter | partial | yes |  | H | (sys L) |
| 273 | W2 | alchemy-bubbles | Cost discounts (colour Bargain, Undeveloped Costs, Cost Boost, Barley Brew, Bar… | missing | no | partial |  | L | (sys L) |
| 274 | W2 | alchemy-bubbles | Small (passive) vs big (active) bubble flag | missing | no | no |  | H | (sys L) |
| 275 | W2 | alchemy-bubbles | Big-bubble slots and what each character wears | adapter | partial | yes |  | M | (sys L) |
| 276 | W2 | alchemy-bubbles | Big bubbles for parallel roles (Construction, Trapping, Worship) | adapter | no | no |  | M | (sys L) |
| 277 | W2 | alchemy-bubbles | Third big-bubble slot (Breeding arena wave 100) | adapter | no | no |  | H | (sys L) |
| 278 | W2 | alchemy-bubbles | Class multi bubbles (Warriors Rule, Archer Or Bust, Mage Is Best) | adapter | yes | yes |  | H | (sys L) |
| 279 | W2 | alchemy-bubbles | Cauldron multi bubbles #16 (Multorange, Premigreen, Severapurple) | adapter | partial | no |  | M | (sys L) |
| 280 | W2 | alchemy-bubbles | Bubbles unlocked (account tiers 10/20/40/60) | adapter | partial | no |  | M | (sys L) |
| 281 | W2 | alchemy-bubbles | No Bubble Left Behind (W4 Lab daily levels) | toolbox-only | no | no |  | M | (sys L) |
| 282 | W2 | alchemy-bubbles | Boron particle payment (W3 Atom Collider) | toolbox-only | no | no |  | M | (sys L) |
| 283 | W2 | alchemy-bubbles | Laaarrrryyyy (double-upgrade chance) | adapter | partial | no |  | L | (sys L) |
| 284 | W2 | alchemy-bubbles | Prowesessary cap | adapter | yes | yes |  | L | (sys L) |
| 285 | W2 | alchemy-bubbles | Upgrade Vault link (bubble levels to 100 each) | toolbox-only | no | no |  | H | (sys L) |
| 286 | W2 | alchemy-bubbles | Bubble catalogue (4 x 35, live entries) | adapter | partial | no |  | H | (sys L) |
| 287 | W2 | alchemy-bubbles | Prisma bubbles (W5+) | toolbox-only | no | no |  | H | (sys L) |
| 288 | W2 | alchemy-bubbles | Kattlekruk / Zenith Market daily bubbles (W5+) | toolbox-only | no | no |  | H | (sys L) |
| 289 | W2 | alchemy-bubbles | Grind Time daily from Coral Reef (W7) | toolbox-only | no | no |  | H | (sys L) |
| 290 | W2 | alchemy-cauldrons | Cauldron roster and unlocked-bubble run (Power, Quicc, High-IQ, Kazam) | adapter | yes | yes |  | H | S |
| 291 | W2 | alchemy-cauldrons | Brew bar and banked new-bubble rolls (progress, req per roll, attempts) | toolbox-only | partial | yes |  | H | S |
| 292 | W2 | alchemy-cauldrons | New-bubble odds and their multiplier (base, Luck, P2W New Bubble, Bubble Breakt… | toolbox-only | no | no |  | H | S |
| 293 | W2 | alchemy-cauldrons | Brew speed per cauldron (brew per hour, cauldron multiplier, per-brewer contrib… | toolbox-only | no | no |  | H | S |
| 294 | W2 | alchemy-cauldrons | Who brews where (seats, unassigned characters) | adapter | yes | yes |  | H | S |
| 295 | W2 | alchemy-cauldrons | Speed Boost (+5% cauldron brew per level, max 170) | toolbox-only | no | no |  | M | M |
| 296 | W2 | alchemy-cauldrons | Luck Boost (new-bubble odds x round(10(1+0.05L))/10; odd levels step +0.1x, eve… | toolbox-only | no | no |  | H | S |
| 297 | W2 | alchemy-cauldrons | Cost Boost (cuts bubble material cost; formula not in Toolbox) | toolbox-only | no | no |  | L | S |
| 298 | W2 | alchemy-cauldrons | 2x Extra Boost (+2% per level chance a Boost level lands twice) | toolbox-only | no | no |  | M | S |
| 299 | W2 | alchemy-cauldrons | Boost requirement and Pay 2 Win Boost Req (-70L/(L+100)%, -35% at 100) | adapter | partial | yes |  | H | S |
| 300 | W2 | alchemy-cauldrons | Roll-or-Boost switch point (brew per new bubble vs brew per Speed level) | toolbox-only | no | no |  | M | M |
| 301 | W2 | alchemy-cauldrons | Ivory Bubble Cauldrons (gem shop 105, max 4: +2 seats, x1.5 brew, x1.5 odds eac… | adapter | no | no |  | L | S |
| 302 | W2 | alchemy-cauldrons | Pay 2 Win cauldron Speed (cap 150) and New Bubble (cap 125) | adapter | yes | yes |  | L | S |
| 303 | W2 | alchemy-cauldrons | Bubble Breakthrough (Shaman talent 492, x new-bubble odds) | toolbox-only | no | no |  | M | S |
| 304 | W2 | alchemy-liquids | Liquid roster, unlock and cap-bar (Water, Liquid Nitrogen, Trench Seawater, Tox… | adapter | yes | yes | check.liquid-cap-other | H | S |
| 305 | W2 | alchemy-liquids | Seats on liquids (activity 4-7), 2x Alchemy EXP | adapter | yes | yes |  | M | S |
| 306 | W2 | alchemy-liquids | Capacity formula and its parts (base, Decant Cap, vial, P2W, Da Daily Drip, sta… | toolbox-only | partial | yes |  | H | S |
| 307 | W2 | alchemy-liquids | Liquid regeneration rate | missing | no | yes |  | M | S |
| 308 | W2 | alchemy-liquids | Decant (Cap and Rate tracks per liquid) | toolbox-only | no | no | check.decant-cap | M | S |
| 309 | W2 | alchemy-liquids | Pay 2 Win: liquid Regen and Capacity (coins) | adapter | yes | yes |  | M | S |
| 310 | W2 | alchemy-liquids | Pay 2 Win: order across cauldrons, liquids, vials, Player | adapter | yes | yes |  | L | S |
| 311 | W2 | alchemy-liquids | Liquid Shop: daily gem buys (One Measly Gem, A Pair of Gems) and daily resets | adapter | partial | yes |  | H | M |
| 312 | W2 | alchemy-liquids | Liquid Shop: Talent Points (Tab 2 and Tab 3, never reset) | adapter | partial | yes | check.talent-point-tab3 | M | S |
| 313 | W2 | alchemy-liquids | Bargain Tag (bubble material discount) | adapter | no | no | check.bargain-tag | M | S |
| 314 | W2 | alchemy-liquids | Bleach Liquid Cauldrons (Gem Shop GemP7) | adapter | no | no | check.bleach-first | M | S |
| 315 | W2 | alchemy-liquids | Ivory Bubble Cauldrons (Gem Shop GemP6) | adapter | no | no |  | L | S |
| 316 | W2 | alchemy-liquids | Dragonic Cauldron (limited Gem Shop GemP18) | toolbox-only | no | no |  | L | S |
| 317 | W2 | alchemy-liquids | Cap and regen from other Systems (vials, Da Daily Drip, Droplots/Drippy Drop st… | toolbox-only | no | yes |  | M | S |
| 318 | W2 | alchemy-liquids | Peculiar Vial sigil (W4 Lab, liquid regen) | toolbox-only | no | no |  | M | S |
| 319 | AW | alchemy-liquids | Skill Mastery alchemy tier (+5% all liquid cap) | toolbox-only | no | no |  | M | M |
| 320 | W2 | alchemy-vials | Vial catalogue and levels, W1-W3 band (idx 0-41) | adapter | partial | yes |  | H | (sys L) |
| 321 | W2 | alchemy-vials | Later vials (idx 42-85: W4 Liquid3 42-51, W5+ 52-85) | toolbox-only | no | no |  | H | (sys L) |
| 322 | W2 | alchemy-vials | Discovery roll (try a locked vial) | adapter | yes | yes |  | L | (sys L) |
| 323 | W2 | alchemy-vials | Daily vial attempts | adapter | yes | yes |  | H | (sys L) |
| 324 | W2 | alchemy-vials | Pay 2 Win vial Attempts (cap 15) and RNG (cap 45) | adapter | yes | partial |  | H | (sys L) |
| 325 | W2 | alchemy-vials | Level costs (item ladder + 3*L liquid) and milestones 4/5/10/13 | adapter | partial | yes |  | H | (sys L) |
| 326 | W2 | alchemy-vials | Bonus formula and per-vial effect (add / decay x multiplier) | toolbox-only | no | no |  | H | (sys L) |
| 327 | W2 | alchemy-vials | Vial multiplier stack | toolbox-only | no | no |  | H | (sys L) |
| 328 | W2 | alchemy-vials | Lab: My 1st Chemistry Set (x2 all vials) | adapter | partial | no |  | H | (sys L) |
| 329 | W2 | alchemy-vials | Upgrade Vault: Vial_Overtune (idx 42, max 3, +10%/lv) | toolbox-only | no | no |  | H | (sys L) |
| 330 | W2 | alchemy-vials | Rift: Vial_Mastery (+2% per level-13 vial) | toolbox-only | no | no |  | H* | (sys L) |
| 331 | W2 | alchemy-vials | Vote Ballot Meritocracy bonus 20 | toolbox-only | no | no |  | H | (sys L) |
| 332 | W2 | alchemy-vials | Virile Vials (Shaman talent 485): vials at level >= 4 | toolbox-only | no | partial |  | H | (sys L) |
| 333 | W2 | alchemy-vials | Talent-point vials (13, 22, 37, 52) | adapter | partial | partial |  | H | (sys L) |
| 334 | W2 | alchemy-vials | Brew-speed vials (0-3) | adapter | partial | yes |  | H | (sys L) |
| 335 | W2 | alchemy-vials | Liquid cap / regen vials (4, 8, 11, 38) | adapter | partial | yes |  | H | (sys L) |
| 336 | W2 | alchemy-vials | Barley Brew (9) bubble-cost discount | adapter | no | yes |  | M | (sys L) |
| 337 | W2 | alchemy-vials | Stamp-cost vials (18 Blue Flav decay, 59 Venison Malt) | adapter | no | no |  | H* | (sys L) |
| 338 | W2 | alchemy-vials | Other direct-stat vials (money, statue, card drop, efficiencies, W3/W4 skills) | toolbox-only | no | no |  | M | (sys L) |
| 339 | W2 | alchemy-vials | Tome: Total_Vial_LV | toolbox-only | no | no |  | H | (sys L) |
| 340 | W2 | alchemy-vials | Pickle Jar (20) and the Equinox challenge | adapter | no | no |  | H | (sys L) |
| 341 | W2 | alchemy-vials | Dashboard alerts and greenStacks option | adapter | yes | yes |  | H | (sys L) |
| 342 | W2 | alchemy-vials | Discovery roll formula / Next Vial hint | missing | no | no |  | L | (sys L) |
| 343 | AW | alchemy-vials | Vial Mastery (code 35, shown Rift 36): +2% per level-13 vial | toolbox-only | no | no |  | H | M |
| 344 | W2 | arcade | M1 Ball accrual rate | toolbox-only | no | no | goal.ball-rate, fact.rate-floor | H | (sys L) |
| 345 | W2 | arcade | M2 Max claim time and claim | adapter | yes | yes | check.balls-cap (amend) | H | (sys L) |
| 346 | W2 | arcade | M3 Other ball sources (Killroy packs, Gem Shop packs, buckets) | adapter | partial | partial | check.skulls | M | (sys L) |
| 347 | W2 | arcade | M4 Boards, buckets, launch, jackpots | toolbox-only | no | no | check.launch-balls | M | (sys L) |
| 348 | W2 | arcade | M5 Gold Ball gain multiplier | toolbox-only | no | no |  | H | (sys L) |
| 349 | W2 | arcade | M6 Shop rotation | toolbox-only | no | no | check.spend-gold-balls, priority.shop | M | (sys L) |
| 350 | W2 | arcade | M7 Shop level curves and effect size | toolbox-only | no | no |  | H | (sys L) |
| 351 | W2 | arcade | M8 Gold Ball cost per level (Gold Ball stamp discount) | missing | no | no |  | M | (sys L) |
| 352 | W2 | arcade | M9 Super (Lv 101) and Omega (Lv 102) levels | toolbox-only | no | no | check.cap-balls | H | (sys L) |
| 353 | W2 | arcade | M10 Companion doubling (Spirit Reindeer) | toolbox-only | no | no |  | H | (sys L) |
| 354 | W2 | arcade | M11 Tome inputs (total levels, jackpots) | toolbox-only | no | no |  | H | (sys L) |
| 355 | W2 | arcade | M12 Currencies | toolbox-only | no | no |  | H | (sys L) |
| 356 | W2 | arcade | M13 Shop bonus catalogue (74 bonuses) | toolbox-only | no | no |  | H | (sys L) |
| 357 | W2 | cards | M1 Card collection (copies per card, account-wide) | adapter | partial | yes | goal.total-levels | H | S |
| 358 | W2 | cards | M2 Card level / stars (copies > perTier x {1,4,9,25,484,15129}; Boss3B special) | adapter | yes | yes | check.capped-card-map, fact.star-cap | H | S |
| 359 | W2 | cards | M3 Cardifiers (Gem Shop 4/5/6-star lift) | toolbox-only | no | no |  | L | S |
| 360 | W2 | cards | M4 Equip slots (4 + Extra Card Slot purchases, max 8) | adapter | yes | yes |  | H | S |
| 361 | W2 | cards | M5 Card presets (2 + purchases, max 7; stores cards, not set) | adapter | yes | yes |  | M | S |
| 362 | W2 | cards | M6 Equipped bonus (bonus x Lv x chip x legend) and activity fit | adapter | yes | yes | check.wrong-side-cards | M | S |
| 363 | W2 | cards | M7 Passive cards (work from the collection) | adapter | partial | yes |  | H | S |
| 364 | W2 | cards | M8 Rift Skill Mastery (skill Lv >= 300, Rift >= 15: all owned skill cards count) | toolbox-only | no | no | check.mastery-frees-slots | H | M |
| 365 | W2 | cards | M9 Card Retirement (Vault 44: card-drop cards become passive) | adapter | no | no |  | H | S |
| 366 | W2 | cards | M10 Card sets (tier = floor(total Lv / size)) | adapter | yes | yes | goal.set-tier | H | S |
| 367 | W2 | cards | M11 One set per character | adapter | yes | yes |  | L | S |
| 368 | W2 | cards | M12 Drop chance (x5 when unowned, not bosses; x CardChanceMulti) | adapter | yes | yes |  | L | S |
| 369 | W2 | cards | M13 Drop-chance sources (bribe, star sign, vial, stamp, talents, guild, bubble,… | adapter | no | no |  | L | M |
| 370 | W2 | cards | M14 Gem Shop card packs | missing | no | no |  | L | S |
| 371 | W2 | cards | M15 Trapping / worship / fishing cards | missing | partial | no |  | L | S |
| 372 | W2 | cards | M16/M21 Lab chips 20/21 (double slot 0 / slot 7) | adapter | no | no |  | M | S |
| 373 | W2 | cards | M17 Legend talent 21 | missing | no | no |  | H | S |
| 374 | W2 | cards | M18 Total card levels (Tome) and cards found (Vault 70) | adapter | no | no | goal.total-levels | H | S |
| 375 | W2 | cards | M19 Toolbox dashboard alerts (set vs afkType, Blunder 50, passive) | adapter | yes | yes |  | H | S |
| 376 | W2 | cards | M20 Dungeon cards / Dungeons set | adapter | no | no |  | M | S |
| 377 | W2 | cards | M22 Passive cards in the account-wide sum (Massive Troll, Chaotic Chizoar, TV,… | adapter | partial | no |  | H | S |
| 378 | W2 | cards | Min-max by stage (card picks and set order) | adapter | yes | yes |  | L | S |
| 379 | W2 | islands | Access gate (Fishing 30, end of the Deepwater Docks) | adapter | no | yes |  | M* | (sys L) |
| 380 | W2 | islands | Island unlock state and unlock cost (6 islands) | toolbox-only | no | no |  | H* | (sys L) |
| 381 | W2 | islands | Message Bottles held and bottles per day | toolbox-only | no | no |  | H | (sys L) |
| 382 | W2 | islands | Bottle bonus ladder (Omar Da Ogar quests, Bottle_Service bribe, Trash bottle-ga… | toolbox-only | partial | partial |  | H* | (sys L) |
| 383 | W2 | islands | Trash Island: garbage accrual and the 100-per-collection cap | toolbox-only | no | no |  | H | (sys L) |
| 384 | W2 | islands | Trash shop (stamps, garbage-gain, bribe set, bottle-gain, Filthy Damage book, T… | toolbox-only | no | no |  | H* | (sys L) |
| 385 | W2 | islands | Rando Island (weekly guaranteed Random Event, Rando shop) | toolbox-only | no | no |  | H* | (sys L) |
| 386 | W2 | islands | Crystal Island (unclaimed days, giant crystal mobs, cap at 14) | toolbox-only | no | no |  | H | (sys L) |
| 387 | W2 | islands | Seasalt Island (legendary fish for W6 equips) | toolbox-only | no | no |  | H* | (sys L) |
| 388 | W2 | islands | Shimmer Island weekly trial | toolbox-only | no | no |  | H* | (sys L) |
| 389 | W2 | islands | Shimmer shop and Shimmer points | toolbox-only | no | no |  | H* | (sys L) |
| 390 | W2 | islands | Fractal Island hours and 8 bonus tiers | toolbox-only | no | no |  | H* | (sys L) |
| 391 | W2 | islands | Island unlock order | toolbox-only | no | no |  | M* | (sys L) |
| 392 | W2 | islands | Island-linked bribes (Art of the Bail, Random_Garbage, Bottle_Service) | adapter | yes | partial |  | H | (sys L) |
| 393 | W2 | islands | Island talent books (Filthy Damage, Rando Event Looty, DUMMY_THICC_STATS) | adapter | partial | no |  | H* | (sys L) |
| 394 | W2 | islands | Tome line 'DPS Record on Shimmer Island' | toolbox-only | no | no |  | H | (sys L) |
| 395 | W2 | islands | W5+ extensions (Shim Lantern multiplier, Fractal sailing/sneaking/W7 tiers, Sai… | toolbox-only | no | no |  | H | (sys L) |
| 396 | W2 | killroy | M1 Room availability (1/2/3 rooms) | adapter | partial | yes | check.room | M | (sys L) |
| 397 | W2 | killroy | M2 Rooms-done code (OLA[113]) | adapter | yes | yes | check.room | H | (sys L) |
| 398 | W2 | killroy | M3 Room class roll (this week and next, KillroySwap) | adapter | partial | yes | check.room | H | (sys L) |
| 399 | W2 | killroy | M4 Room monster roll (which map each room uses) | toolbox-only | no | no |  | H | (sys L) |
| 400 | W2 | killroy | M5-M6 Run upgrades (Timer, Talent Drops, Bonus Skulls, Faster Respawn, Dungeon… | toolbox-only | no | no | check.run-upgrades, priority.run-upgrades | M | (sys L) |
| 401 | W2 | killroy | M7 Skulls and Skull Shop weekly items (indices 0-9), Arcade packs | adapter | yes | yes | priority.skull-shop | M | (sys L) |
| 402 | W2 | killroy | M8-M9 Skull Shop permanent items (3rd room roll, artifact, nugget, crop, jade,… | toolbox-only | no | no | check.third-room | M | (sys L) |
| 403 | W2 | killroy | M11 Killroy Prime total -> Total Damage multiplier | toolbox-only | no | no | goal.prime | H | (sys L) |
| 404 | W2 | killroy | M11b Best kills per monster (KRbest) and Equinox 100-kill monsters | toolbox-only | no | no | check.equinox-kills | H | (sys L) |
| 405 | W2 | killroy | M12 Per-class best scores (OLA[204-206], Tome) | toolbox-only | no | no |  | H | (sys L) |
| 406 | W2 | killroy | M13 Equinox links: single-run kills 400/2000, Shades of K | toolbox-only | no | no | goal.equinox-run | H | (sys L) |
| 407 | W2 | killroy | M14 Royal Armory Weekly Skull Stipend (+2 starting skulls/level) | missing | no | no |  | H | (sys L) |
| 408 | W2 | killroy | M15 Quest skull gift (Killroy_Skulls item, 25 skulls) | missing | no | no |  | M | (sys L) |
| 409 | W2 | killroy | M16 Manual weekly reset for 400 gems (Airhorn) | missing | no | no |  | L | (sys L) |
| 410 | W2 | killroy | R1 Runner choice (class line, AoE, not the pusher) | adapter | yes | partial | priority.runner | M | (sys L) |
| 411 | AW | killroy | Killroy room 2 gate (World 3 finished = GenINFO[58] >= 4) | adapter | yes | yes |  | H | S |
| 412 | AW | killroy | Killroy room 3 (OLA[227], nested inside the room 2 gate) | adapter | yes | yes |  | M | S |
| 413 | AW | killroy | Killroy damage multiplier (KillroyDMG) | toolbox-only | no | no |  | H | M |
| 414 | W2 | obols | Obol Altar unlock (Bob Joe Pickle quest, NPC at highest class Lv 30, account-wi… | adapter | no | yes |  | H | (sys L) |
| 415 | W2 | obols | W2 obol drop merit (Monsters now drop Obols, 0-7, +5% each, x(1+L/20) injected… | adapter | no | yes |  | H | (sys L) |
| 416 | W2 | obols | Family slots (24: 12 circle, 4 square, 4 hexagon, 4 sparkle; gate = total class… | adapter | no | yes |  | H | (sys L) |
| 417 | W2 | obols | Personal slots (21 per character: 12 circle, 6 square, 2 hexagon, 1 sparkle; ga… | adapter | no | yes |  | H | (sys L) |
| 418 | W2 | obols | Slot shape rule (an obol fits only its own shape) | adapter | no | yes |  | M | (sys L) |
| 419 | W2 | obols | Lock refresh (a met gate still shows ObolLocked until the menu is opened) | adapter | no | no |  | L | (sys L) |
| 420 | W2 | obols | Obol Storage contents (4 shape rows) | adapter | no | yes |  | H | (sys L) |
| 421 | W2 | obols | Obol Storage capacity (rows 4*N_r; Salt Lick upgrade 1 and Gem Shop 'Obol Stora… | toolbox-only | no | no |  | M | (sys L) |
| 422 | W2 | obols | Per-obol stats, reroll bonuses and the rerolled flag | toolbox-only | no | no |  | H | (sys L) |
| 423 | W2 | obols | Obol stat totals per character (personal + family, positive only) | toolbox-only | no | no |  | H | (sys L) |
| 424 | W2 | obols | Obol catalogue (families, rarities Bronze>Silver>Gold>Platinum>Dementia, shapes… | toolbox-only | no | no |  | H | (sys L) |
| 425 | W2 | obols | Reroll (cost ceil(0.8*sell) fragments + coins; two passes; per-pass DR odds) | toolbox-only | no | no |  | M | (sys L) |
| 426 | W2 | obols | Combine (two identical obols, success 1/(4+ID), cost 2x reroll, failure may des… | toolbox-only | no | no |  | M | (sys L) |
| 427 | W2 | obols | Destroy for fragments (floor(1 + 0.2*A99) * sellPrice) and fragment balance | toolbox-only | no | no |  | H | (sys L) |
| 428 | W2 | obols | Achievements 83 'Obols Oh Boy!' (10 Silver equipped, +2% Arcade balls/hr) and 9… | toolbox-only | no | no |  | H | (sys L) |
| 429 | W2 | obols | Merit-injected rare drops (Bronze/Silver/Gold stat, skill, EXP, multikill, defe… | missing | no | no |  | L | (sys L) |
| 430 | W2 | obols | Boss and special obol drops (Gigafrog Pop, Amarok, Efaunt, Chizoar, Slush, Trol… | adapter | no | no |  | H | (sys L) |
| 431 | W2 | obols | Alchemy Liquid Shop obols (Mediocre, Decent, Grand; daily reset per wiki) | missing | no | no |  | M | (sys L) |
| 432 | W2 | obols | Gem Shop obol stacks and Hyper obols | toolbox-only | no | no |  | M | (sys L) |
| 433 | W2 | obols | W4 Tome obol count | toolbox-only | no | no |  | H | (sys L) |
| 434 | W2 | obols | Lab 'Spelunker Obol' (misnamed jewel multiplier) | adapter | partial | no |  | H | (sys L) |
| 435 | W2 | obols | W7 Menagerie obol multiplier, auto-trash and Silver Jelly (out of W1-W4 scope) | toolbox-only | no | no |  | H | (sys L) |
| 436 | W2 | weekly-battles | W-BEST Best difficulty beaten this server week (OLA[189]) | adapter | partial | yes | check.raid | H | (sys L) |
| 437 | W2 | weekly-battles | W-DAILY Daily raid attempt flag (OLA[190]) | adapter | no | no |  | H | (sys L) |
| 438 | W2 | weekly-battles | W-SCHED Server-week boss pick and 10-week preview (seed floor(GlobalTime/604800… | toolbox-only | no | no |  | H | (sys L) |
| 439 | W2 | weekly-battles | W-HP Boss HP per difficulty (x4 * x5^d) | toolbox-only | no | no |  | H | (sys L) |
| 440 | W2 | weekly-battles | W-TASKS Weekly tasks and thresholds (3 task types per boss, 15 slots) | toolbox-only | no | no |  | M | (sys L) |
| 441 | W2 | weekly-battles | W-ACTIONS Actions (22: 9 ATTACK, 8 BUFF, 5 MISC; 15 seeded triplets; restrictio… | toolbox-only | no | no |  | M | (sys L) |
| 442 | W2 | weekly-battles | W-TURNS One turn per character | adapter | partial | partial | check.raid | M | (sys L) |
| 443 | W2 | weekly-battles | W-TROPHY Trophy payout and balance | missing | no | no |  | M | (sys L) |
| 444 | W2 | weekly-battles | W-MISC MISC buffs this week (Class EXP c, damage g; each capped 150%) | toolbox-only | no | no |  | H | (sys L) |
| 445 | W2 | weekly-battles | W-SPILL Boss Battle Spillover star talent (+Drop Rate x difficulties beaten) | toolbox-only | no | no |  | H | (sys L) |
| 446 | W2 | weekly-battles | W-SHOP Trophy shop rotation (2 of 12 skins + 2 of 9 items per week) | toolbox-only | no | no |  | M | (sys L) |
| 447 | W2 | weekly-battles | W-WATCH Gold / Silver Pocketwatch (24 h shift / +-15 min reset shift) | toolbox-only | no | no |  | M | (sys L) |
| 448 | W2 | weekly-battles | W-EQX Equinox links: clouds 1 and 11 (+1 trophy per boss kill), 6 (all 5 diffic… | toolbox-only | no | no |  | H | (sys L) |
| 449 | W2 | weekly-battles | B-VOTED Vote cast this ballot week (OLA[309] vs floor((t+197860)/604800)) | adapter | partial | yes | check.vote | M | (sys L) |
| 450 | W2 | weekly-battles | B-WINNER Active bonus (last vote's winner) and its applied value | adapter | partial | partial | check.vote | H | (sys L) |
| 451 | W2 | weekly-battles | B-CANDIDATES This week's candidates and vote shares | toolbox-only | no | no |  | H | (sys L) |
| 452 | W2 | weekly-battles | B-MULTI Ballot multiplier and breakdown | toolbox-only | no | no |  | H | (sys L) |
| 453 | W2 | weekly-battles | B-FALLBACK Locked winner falls back to 1.25x damage | missing | no | no |  | M | (sys L) |
| 454 | W2 | weekly-battles | B-TABLE Bonus table (35 entries with world gates) | toolbox-only | no | no |  | H | (sys L) |
| 455 | W2 | weekly-battles | B-VOTER-RIGHTS Voter Rights (Equinox upgrade; cloud 35 +15 max LV) | toolbox-only | no | no |  | H | (sys L) |
| 456 | W2 | weekly-battles | B-MERIT Meritocracy (second ballot, W6 Spirit Village per code) | toolbox-only | no | no |  | H | (sys L) |
| 457 | W3 | armor-smithy | Smithy gate: 30-day wait or 2,000 gems (bun_c counts 1,500) | adapter | yes | yes |  | - | M |
| 458 | W3 | armor-smithy | Hire flag (OLA[380]) | adapter | yes | yes |  | - | M |
| 459 | W3 | armor-smithy | Registered sets (OLA[379]) | adapter | partial | yes |  | - | M |
| 460 | W3 | armor-smithy | Parts rule: all armour + N tools of the set's tool list + 0/1 weapon, on ONE character (P… | adapter | yes | yes |  | - | M |
| 461 | W3 | armor-smithy | Set catalogue: 19 sets, bonuses, piece/tool/weapon counts, World | toolbox-only | partial | yes |  | - | M |
| 462 | W3 | armor-smithy | Worn-in-full fallback: a set fully worn by the active character gives its bonus without r… | toolbox-only | no | no |  | - | M |
| 463 | W3 | armor-smithy | Bonus consumers: what each set feeds and how (additive / multiplier) | toolbox-only | partial | no |  | - | M |
| 464 | W3 | armor-smithy | Upgrade chain eats lower-set pieces (register before crafting the next tier) | adapter | partial | yes |  | - | M |
| 465 | W3 | armor-smithy | Next set to finish (closest unregistered set, the part to craft) | adapter | partial | no |  | - | M |
| 466 | W3 | armor-smithy | Registration order (which set first) | adapter | partial | no |  | - | M |
| 467 | W3 | armor-smithy | Secret set (membership items, gold food x1.25) | toolbox-only | no | no |  | - | M |
| 468 | W3 | armor-smithy | Model gaps: Marbiglass (+10% All Stat, no Toolbox consumer), Prehistoric (wiki 2x vs Tool… | toolbox-only | no | no |  | - | M |
| 469 | W3 | armor-smithy | Bundle bun_c as a gem shortcut | toolbox-only | partial | no |  | - | M |
| 470 | W3 | atom-collider | Particle currency (atoms) | toolbox-only | no | no |  | H | M |
| 471 | W3 | atom-collider | Particle generation from Storage overflow and threshold tier | toolbox-only | no | no |  | M (switch unknown), H (tier… | M |
| 472 | W3 | atom-collider | Collider building level (cost cut level/10 %) | adapter | partial | no |  | H | M |
| 473 | W3 | atom-collider | Upgrade cost formula and the cost-cut stack | toolbox-only | no | no |  | H | M |
| 474 | W3 | atom-collider | Atom max level | toolbox-only | no | no |  | H (20 base), M (Isotope +10… | M |
| 475 | W3 | atom-collider | Atoms available (11 base + 6 unlocks) | toolbox-only | no | no |  | M (index mapping) | M |
| 476 | W3 | atom-collider | Atom 0 Hydrogen | adapter | partial | yes |  | H | M |
| 477 | W3 | atom-collider | Atom 1 Helium | toolbox-only | no | no |  | H | M |
| 478 | W3 | atom-collider | Atom 2 Lithium | toolbox-only | no | no |  | M | M |
| 479 | W3 | atom-collider | Atom 3 Beryllium | toolbox-only | no | no |  | M | M |
| 480 | W3 | atom-collider | Atom 4 Boron | toolbox-only | no | no |  | H | M |
| 481 | W3 | atom-collider | Atom 5 Carbon | toolbox-only | no | no |  | H | M |
| 482 | W3 | atom-collider | Atom 6 Nitrogen | toolbox-only | no | no |  | H | M |
| 483 | W3 | atom-collider | Atom 7 Oxygen | toolbox-only | no | no |  | H | M |
| 484 | W3 | atom-collider | Atom 8 Fluoride | toolbox-only | no | no |  | H | M |
| 485 | W3 | atom-collider | Atom 9 Neon | toolbox-only | no | no |  | H | M |
| 486 | W3 | atom-collider | Atom 10 Sodium | toolbox-only | no | no |  | M | M |
| 487 | W3 | atom-collider | Atoms 11-16 Magnesium, Aluminium, Silicon, Phosphorus, Sulfur, Chlorine (W6/W7) | toolbox-only | no | no |  | H | M |
| 488 | W3 | atom-collider | Hydrogen day counter | adapter | partial | yes |  | M (counter meaning per Tool… | M |
| 489 | W3 | atom-collider | Other particle sinks and readers (Divinity gods, Caverns Bell, The_True_Lantern) | toolbox-only | no | no |  | H | M |
| 490 | W3 | atom-collider | Tome line: total atom levels | toolbox-only | no | no |  | H | M |
| 491 | W3 | bubba | Unlock and away time (YumYum Grotto door per character; away time only on a door characte… | adapter | yes | yes |  | M | S |
| 492 | W3 | bubba | Meat production rate (three flat slices x percent upgrades x happiness, dice, smoke, Hust… | adapter | yes | partial |  | M | M |
| 493 | W3 | bubba | Upgrade type unlocks (meat made this run opens types, cap 28) | adapter | yes | no |  | H | S |
| 494 | W3 | bubba | Upgrade costs, levels, prestige (free levels) and the run order | adapter | yes | yes |  | M | S |
| 495 | W3 | bubba | Cost discounts (Bargain, Cost Saver, Perma Sale, Rizz; W7 Minehead and Menagerie) | adapter | partial | yes |  | H | S |
| 496 | W3 | bubba | Megaflesh (prestige reset, 12 rows, Chromatic past 11) | adapter | yes | yes |  | M | S |
| 497 | W3 | bubba | Bubba Boon (never resets, 7 rotating account bonuses x Megaflesh multiplier) | adapter | yes | yes |  | M | S |
| 498 | W3 | bubba | Boon consumers in other systems (Construction build rate, Worship souls, Atom Collider co… | toolbox-only | partial | no |  | L | S |
| 499 | W3 | bubba | Happiness and pats (Happi Boi pats per hour, Buyer Grin, Real Love, Megaflesh 8 head star… | adapter | yes | yes |  | L | S |
| 500 | W3 | bubba | Gifts (Fun Gifts picks, passives, Open Gift triggers, Uber Gifts) | adapter | yes | partial |  | M | M |
| 501 | W3 | bubba | Frozen Dice (Dice Roll, More Dice, More Sides, Loaded Dice, Courage, Red Die, MF5 protect… | adapter | yes | no |  | M | M |
| 502 | W3 | bubba | Smoker and smoked meats (tier roll, 16h11m plateau, 5 meat tiers, 2X Smoke, Slabcakes, MF… | adapter | partial | yes |  | H | S |
| 503 | W3 | bubba | Charisma Chart (six attributes, training, XP, cap 120, Super Chart, emulsify) | adapter | yes | yes |  | M | M |
| 504 | W3 | bubba | Spare Coins (four coin tiers +1/+5/+25/+100%, Big Ol Coin, MF11 odds) | missing | no | no |  | L | S |
| 505 | W3 | bubba | Pet Arena Crucible meat multiplier (x(1+2) at crucible 10) | toolbox-only | no | no |  | H | S |
| 506 | W3 | bubba | W5-W7 extensions (Vault 65, Sushi 39, Jelly 58, Fountain, Companion 51, Menagerie cheapen… | toolbox-only | no | no |  | H | S |
| 507 | W3 | cog-board | Board squares: locked / open / cog / character | adapter | yes | partial |  | H | L |
| 508 | W3 | cog-board | Characters on board / Cog Shelf (save slots 96-107) / cog inventory | adapter | yes | yes |  | H | L |
| 509 | W3 | cog-board | Player cog build speed and EXP per character | adapter | partial | partial |  | H | L |
| 510 | W3 | cog-board | Squire builders on the board (max 2 Divine Knight) | adapter | partial | partial |  | L | L |
| 511 | W3 | cog-board | Board totals: Build Rate, Construction EXP, Flaggy Rate | adapter | partial | no |  | H | L |
| 512 | W3 | cog-board | Cog identity and stats (tier, kind, grade, a..k stats) | toolbox-only | no | no |  | H | L |
| 513 | W3 | cog-board | Boost shapes and what each boost cog reaches | toolbox-only | no | no |  | H | L |
| 514 | W3 | cog-board | Flags: placed, progress, per-hour, finish time | toolbox-only | no | no |  | H | L |
| 515 | W3 | cog-board | Square unlock costs (25 x flagsReqs, 25 .. 250M) and cheapest locked squares | toolbox-only | partial | no |  | H | L |
| 516 | W3 | cog-board | Cog inventory (spare cogs 108-227) and better-cog swaps | toolbox-only | no | no |  | H | L |
| 517 | W3 | cog-board | Cog Shelf cog production and collection (uncollected cogs raise next cost) | missing | partial | no |  | M | L |
| 518 | W3 | cog-board | Cog tier gates by highest Construction level (Nooby 1 / Decent 15 / Superb 40 / Ultimate … | adapter | yes | no |  | M | L |
| 519 | W3 | cog-board | Yin / Yang Zen cogs and Excogia 2x2 | toolbox-only | no | no |  | M | L |
| 520 | W3 | cog-board | Gem shop cog items: Zen Cogs 115, Cog Inventory 116, Tower slots 117, Fluorescent Flaggie… | adapter | no | no |  | H | L |
| 521 | W3 | cog-board | Toolbox board planner (optimizeSwapCurve, swap budgets 1/4/10/20) | toolbox-only | no | no |  | M | L |
| 522 | W3 | cog-board | Tiny Cog side columns and small cogs (W7, Research J8) | toolbox-only | no | no |  | H | L |
| 523 | W3 | cog-board | Jewel cogs (W5, CogCry0-5) | toolbox-only | no | no |  | M | L |
| 524 | W3 | cog-board | Equinox cog challenges (48 Ulti Double Cogs, 48 Jewel Cogs, Tier 6 Tiny Cog) | toolbox-only | no | no |  | H | L |
| 525 | W3 | cog-board | Refurbished Cog (Damaged Cog -> Construction 75) | missing | no | no |  | H | L |
| 526 | W3 | construction | Buildings: levels and max levels (27 buildings) | adapter | yes | partial |  | M | M |
| 527 | W3 | construction | Build phase: progress bar and build cost | adapter | yes | yes |  | H | S |
| 528 | W3 | construction | Salt payment (built level awaiting salt) | adapter | partial | partial |  | H | S |
| 529 | W3 | construction | Build slots (2 base, up to 8) | adapter | yes | partial |  | H | S |
| 530 | W3 | construction | Trimmed (gilded) build slots | toolbox-only | no | no |  | M | S |
| 531 | W3 | construction | Player build speed and Construction level | adapter | partial | partial |  | H | S |
| 532 | W3 | construction | Construction EXP | adapter | partial | no |  | H | S |
| 533 | W3 | construction | Cog Board: placement, seats and cogs | adapter | yes | yes |  | M | M |
| 534 | W3 | construction | Flags (open more board squares) | adapter | partial | no |  | M | S |
| 535 | W3 | construction | Cog Shelf and cog inventory | adapter | yes | yes |  | L | S |
| 536 | W3 | construction | Cog tiers by Construction level | adapter | yes | no |  | M | S |
| 537 | W3 | construction | Construct Mastery (Rift 40) | toolbox-only | no | no |  | H | S |
| 538 | W3 | construction | Extra max levels (Carbon atom, mastery, Gambit, coral, Sushi, Menagerie) | toolbox-only | no | no |  | H | S |
| 539 | W3 | construction | Per-building bonuses (Cost Cruncher, Chest Space, Automation Arm, towers, shrines) | toolbox-only | no | no |  | M | S |
| 540 | W3 | construction | Tiny cogs and W5-W7 extensions | toolbox-only | no | no |  | H | S |
| 541 | W3 | construction | Build order past W3-early | adapter | partial | partial |  | L | S |
| 542 | W3 | death-note | Kill ledger per monster (kills summed over characters) | adapter | partial | yes |  | H | L |
| 543 | W3 | death-note | Rank per monster and world point total | toolbox-only | partial | partial |  | H | L |
| 544 | W3 | death-note | Page membership (which monsters, which world) | adapter | partial | no |  | H | L |
| 545 | W3 | death-note | Mini-boss page (10 bosses, own ladder 100..1M) | toolbox-only | no | no |  | M | L |
| 546 | W3 | death-note | Death Note building (Lv 0 gate, +2 base multikill per level, max 51) | adapter | yes | yes |  | H | L |
| 547 | W3 | death-note | Overkill gate and damage tiers per fighter | toolbox-only | no | no |  | H | L |
| 548 | W3 | death-note | Multikill total (base + tiers x perTier) | toolbox-only | no | no |  | H | L |
| 549 | W3 | death-note | Base multikill sources (star sign, Purple Salt, Overkill stamp, building, achievements, g… | toolbox-only | no | no |  | M | L |
| 550 | W3 | death-note | Per-tier multikill sources (world rank, vial, Balance of Pain, cards, bubble, chip, arcad… | toolbox-only | no | no |  | M | L |
| 551 | W3 | death-note | Kill-per-Kill (how many ledger kills each kill counts for) | toolbox-only | partial | no |  | H | L |
| 552 | W3 | death-note | Eclipse skulls (>1B kills, Rift bonus) and damage bonus | toolbox-only | no | no |  | H | L |
| 553 | W3 | death-note | Tome kill digits | toolbox-only | no | no |  | M | L |
| 554 | W3 | death-note | Cross-system readers (Lab Fungi Finger Pocketer, Hole pts, Summoning, Menagerie) | toolbox-only | no | no |  | M | L |
| 555 | W3 | death-note | Skull achievements and Nebulyte quest step | toolbox-only | no | no |  | M | L |
| 556 | W3 | death-note | Where to farm next (cheapest points; spread fighters) | toolbox-only | partial | no |  | M | L |
| 557 | W3 | equinox | Unlock: Equinox Mirror (Bloodbone, map 117 Hell Hath Frozen Over, chance 0.1) | toolbox-only | no | no |  | H | M |
| 558 | W3 | equinox | Bar charge, requirement, time to full | toolbox-only | no | no |  | H | M |
| 559 | W3 | equinox | Fill rate and its multipliers (base 60/90 bundle; vial, clouds, Arcade, Emperor additive;… | toolbox-only | no | no |  | H | M |
| 560 | W3 | equinox | Dream Upgrades: levels, max, unlocked (14 slots) | toolbox-only | no | no |  | H | M |
| 561 | W3 | equinox | Upgrade unlock thresholds (12 unlock clouds: 0,2,5,7,10,13,17,20,23,28,31,36) | toolbox-only | no | no |  | H | M |
| 562 | W3 | equinox | Dream clouds: progress and visibility (first min(5, Dreams) unfinished by index) | toolbox-only | no | no |  | H | M |
| 563 | W3 | equinox | Cloud rewards (fill %, fill multipliers, +max level, one-offs: trophy, star talent Dreame… | toolbox-only | no | no |  | H | M |
| 564 | W3 | equinox | Downstream effects (Matching Scims damage, Faux Jewels Drop Rate, Symbols talent levels, … | adapter | no | no |  | H | M |
| 565 | W3 | equinox | Upgrade buy order / priority (Dreams first, Liquidvestment early, skip Food Lust / Lab Fu… | missing | no | no |  | L | M |
| 566 | W3 | equinox | Valley resources and their vials (Marble Ore, Willow Logs, Equinox Fish, Dream Particulat… | toolbox-only | no | no |  | M | M |
| 567 | W3 | equinox | Food Lust stacks and Metal Detector nugget counter | toolbox-only | no | no |  | H | M |
| 568 | W3 | equinox | Nightmare clouds (index >= 36, Research grid node 86, W7) and W5+ max-level sources (Summ… | toolbox-only | no | no |  | H | M |
| 569 | W3 | library | Checkout stock and clock | adapter | partial | yes |  | H | M |
| 570 | W3 | library | Checkout speed multiplier (tower, meal, atom, bubble, vial, stamp, achievement, superbit) | toolbox-only | no | no |  | H | S |
| 571 | W3 | library | Book level range and its upgrade ladder | adapter | partial | no |  | H | M |
| 572 | W3 | library | Talent book roll and Book Reservation System | adapter | no | yes |  | L | S |
| 573 | W3 | library | Book-eligible talents and per-character coverage | adapter | partial | yes |  | M | M |
| 574 | W3 | library | Held talent books (read, dominated) | adapter | partial | yes |  | M | S |
| 575 | W3 | library | Library building level and cap | adapter | yes | yes |  | H | S |
| 576 | W3 | library | Checkout Takeout achievement (1,000 checkouts) | toolbox-only | no | no |  | H | S |
| 577 | W3 | library | VIP Bookshelf (W4) | missing | no | no |  | L | S |
| 578 | W3 | library | W5+ extensions (Fury Relic, Gaming superbit, Construct Mastery, Summoning 'Library Max', … | toolbox-only | no | no |  | M | S |
| 579 | W3 | prayers | Prayer list, levels and unlock gates | adapter | yes | no |  | H | S |
| 580 | W3 | prayers | Equipped prayers per character | adapter | yes | no |  | H | M |
| 581 | W3 | prayers | Prayer slots (Wizard-line level thresholds + Gem Shop) | missing | no | no |  | M | S |
| 582 | W3 | prayers | Blessing / curse values by level | adapter | yes | no |  | H | S |
| 583 | W3 | prayers | Soul cost and souls held (unlock + level up) | toolbox-only | no | no |  | H | M |
| 584 | W3 | prayers | Unending Energy 10 h AFK cap | adapter | partial | no |  | M | S |
| 585 | W3 | prayers | Curse conflicts (stacked HP curses, Dimwit vs Proficiency, Zerg vs Ruck Sack) | adapter | partial | no |  | M | S |
| 586 | W3 | prayers | The Royal Sampler (printer sample size, locked while sampling) | adapter | partial | no |  | M | S |
| 587 | W3 | prayers | Tachion of the Titans and giant monsters | toolbox-only | partial | partial |  | M | S |
| 588 | W3 | prayers | Glitterbug curse on giant spawn chance | toolbox-only | no | no |  | M | S |
| 589 | W3 | prayers | Prayer effect consumers (EXP, drops, coins, accuracy, damage, crit, carry, AFK rate, shin… | toolbox-only | partial | no |  | H | S |
| 590 | W3 | prayers | Tome line: total prayer levels | toolbox-only | no | no |  | H | S |
| 591 | W3 | prayers | Achievement Soulslike (4 prayers equipped) | toolbox-only | no | no |  | H | S |
| 592 | W3 | prayers | No-prayer superbits (W5 Gaming) | toolbox-only | no | no |  | M | S |
| 593 | W3 | prayers | Toolbox worship alert (Unending Energy > 10 h) | toolbox-only | no | no |  | L | S |
| 594 | AW | prayers | Unending Energy 10 h AFK cap (prayer index 2) | adapter | partial | no |  | M | S |
| 595 | AW | prayers | Toolbox worship AFK alert (Unending Energy equipped and AFK > 10 h) | toolbox-only | no | no |  | M | M |
| 596 | AW | prayers | Prayer unlock waves and max levels (Unending Energy 51/50, Jawbreaker 101/50, Midas Minded 71... | adapter | yes | no |  | M | S |
| 597 | AW | prayers | Prayer cost scaling (calcPrayerCost, 2e9 cap, Royal Sampler steeper curve) | toolbox-only | no | no |  | H | M |
| 598 | AW | prayers | W5+ extensions (Gaming superbits with zero prayers, Crucible meat for W5+, later Bowman kits) | missing | no | no |  | L | L |
| 599 | W3 | printer | Building level and Player Slots (who prints) | adapter | yes | yes |  | H | M |
| 600 | W3 | printer | Stored sample slots (4 + More Sample Spaces) and full storage | adapter | partial | no |  | M | M |
| 601 | W3 | printer | Active (printing) slots and empty active slots | adapter | yes | partial |  | H | M |
| 602 | W3 | printer | Gem Shop: Crystal 3D Printer and More Sample Spaces | adapter | partial | partial |  | M | M |
| 603 | W3 | printer | Printer Sampling talent (Star Talent tab 2) | adapter | partial | partial |  | H | M |
| 604 | W3 | printer | Sample item and base size (taken from the AFK Target at sample time) | adapter | yes | yes |  | M | M |
| 605 | W3 | printer | Sample size percent, its 13 sources, and the 90% cap | adapter | partial | no |  | M | M |
| 606 | W3 | printer | Printer multiplier and day counters (Gold Relic, Winter, Legend, Companion, Compass, King… | adapter | no | yes |  | H | M |
| 607 | W3 | printer | Per-character Wired In (Lab) and Harriep/Arctis factors | toolbox-only | no | no |  | H | M |
| 608 | W3 | printer | Printer Go Brrr (Maestro talent 32) | toolbox-only | no | partial |  | H | M |
| 609 | W3 | printer | The Royal Sampler prayer (sample size, EXP curse, unequip lock) | adapter | partial | no |  | H | M |
| 610 | W3 | printer | Largest-sample records and Equinox sample challenges (1M, 1B, Red Frisbee) | toolbox-only | no | no |  | H | M |
| 611 | W3 | printer | Atoms from printing past the Atom Collider threshold | toolbox-only | no | no |  | M | M |
| 612 | W3 | printer | Taskboard 'Printer go Brrrr' total printed | toolbox-only | no | no |  | H | M |
| 613 | W3 | printer | Hoggindaz quests (Printer Sampling book, first sample) | adapter | yes | yes |  | M | M |
| 614 | W3 | printer | Re-sample rule (keep larger, resets Gold Relic/Winter/Legend days) | adapter | partial | yes |  | M | M |
| 615 | W3 | printer | W5+ extensions (Gold Relic forms, Harriep, Biggole Mole, Lolly Flower, Moon of Print, Sup… | toolbox-only | no | no |  | M | M |
| 616 | W3 | refinery | Salt unlock chain (salts 2-6 from chest, 40/150/300/500/750) | adapter | yes | yes |  | H (cost list, game code), M… | M |
| 617 | W3 | refinery | Salt recipes / fuel inputs | adapter | yes | yes |  | H | M |
| 618 | W3 | refinery | Per-cycle cost exponent and the W3 Salt merit (rank^1.5 vs rank^1.3) | toolbox-only | no | no |  | H (code); wiki reads it as … | M |
| 619 | W3 | refinery | Power per cycle (floor(min(250000, rank^1.3 x (1+companion35)))) | toolbox-only | no | no |  | H | M |
| 620 | W3 | refinery | Rank bar and PowerCAP | adapter | yes | yes |  | H | M |
| 621 | W3 | refinery | Cycle times and next-cycle timers (Combustion 900 s, Synthesis 3600 s, Polymerize 360000 … | toolbox-only | no | no |  | H | M |
| 622 | W3 | refinery | Refinery speed sources (additive %, Lab tubing x3, Legend talent) | toolbox-only | no | no |  | H (list), advice none (M at… | M |
| 623 | W3 | refinery | Auto Refine | adapter | yes | yes |  | M (advice), L (exact mechan… | M |
| 624 | W3 | refinery | Active toggle | adapter | yes | yes |  | H | M |
| 625 | W3 | refinery | Offline fill bounded by the bar's room | adapter | yes | partial |  | L (game-code note only) | M |
| 626 | W3 | refinery | Salt balance: predecessor output vs consumption, safe rank, printer limits | toolbox-only | no | partial |  | H (code), M (as advice) | M |
| 627 | W3 | refinery | Time to rank up (incl. Squire throttle cycles) | adapter | yes | no |  | M | M |
| 628 | W3 | refinery | Squire / Divine Knight Refinery Throttle (talent 130): extra cycles on cooldown | toolbox-only | no | no |  | H (mechanics), M (advice) | M |
| 629 | W3 | refinery | Squire Redox Rates (talent 131): build speed from Redox held | toolbox-only | no | no |  | H | M |
| 630 | W3 | refinery | Precision Power (talent 125): damage per total Refinery rank | toolbox-only | no | no |  | H | M |
| 631 | W3 | refinery | Salt Lick (spends salts; upgrade 2 = +2% Refinery speed per level) | toolbox-only | no | no |  | H | M |
| 632 | W3 | refinery | Refinery storage vs storage chest (unlocks and builds pay from chest only) | adapter | yes | partial |  | M | M |
| 633 | W3 | refinery | Printer interaction (salt materials, printing-slot supply) | toolbox-only | no | no |  | H | M |
| 634 | W3 | refinery | Total salt ranks (first 6 salts): Tome quantity | toolbox-only | no | no |  | H | M |
| 635 | W3 | refinery | Tasks 'Dying To Refine' and 'Why so Salty?' (25 ... 750,000 salts refined) | toolbox-only | no | no |  | H | M |
| 636 | W3 | refinery | Polymerization tab (salts 7-9, Research square 49) and W5+ speed | toolbox-only | partial | no |  | H | M |
| 637 | W3 | salt-lick | Salt Lick building and upgrade reveal (building level 0..11 = upgrades shown) | adapter | partial | yes |  | H | M |
| 638 | W3 | salt-lick | Upgrade #1 (idx 0) Printer sample size | toolbox-only | no | no |  | H | M |
| 639 | W3 | salt-lick | Upgrade #2 (idx 1) Obol storage | toolbox-only | no | no |  | M | M |
| 640 | W3 | salt-lick | Upgrade #3 (idx 2) Refinery speed | toolbox-only | no | no |  | H | M |
| 641 | W3 | salt-lick | Upgrade #4 (idx 3) Class and skill EXP | toolbox-only | no | no |  | H | M |
| 642 | W3 | salt-lick | Upgrade #5 (idx 4) Talent book max level | toolbox-only | no | no |  | H | M |
| 643 | W3 | salt-lick | Upgrade #6 (idx 5) Liquid capacity | toolbox-only | no | no |  | M (disputed: wiki says all … | M |
| 644 | W3 | salt-lick | Upgrade #7 (idx 6) Tower Defence points | toolbox-only | no | no |  | L (effect), H (numbers) | M |
| 645 | W3 | salt-lick | Upgrade #8 (idx 7) Move speed | toolbox-only | no | no |  | M | M |
| 646 | W3 | salt-lick | Upgrade #9 (idx 8) Multikill | toolbox-only | no | no |  | M | M |
| 647 | W3 | salt-lick | Upgrade #10 (idx 9) Total damage | toolbox-only | no | no |  | H | M |
| 648 | W3 | salt-lick | Upgrade #11 (idx 10) Cooking Mastery EXP | toolbox-only | no | no |  | H | M |
| 649 | W3 | salt-lick | Owned salt per upgrade (game's ItemsAndStorageOWNED) | toolbox-only | partial | no |  | H | M |
| 650 | W3 | salt-lick | Reserve salt for building payments | adapter | partial | no |  | M | M |
| 651 | W3 | salt-lick | Cost formula and cost to max | toolbox-only | no | no |  | M | M |
| 652 | W3 | salt-lick | Wiki infobox 'max 10' vs data 11 | toolbox-only | no | no |  | H | M |
| 653 | W3 | salt-lick | Multikill (#9) needs the Death Note | adapter | no | yes |  | L | M |
| 654 | W3 | salt-lick | #11 needs Rift 61 Cooking Mastery | missing | no | no |  | H | M |
| 655 | W3 | salt-lick | W5+ extensions | toolbox-only | no | no |  | H | M |
| 656 | AW | salt-lick | Salt Lick #6 (Spontaneity Salts): +1%/level liquid RATE on all liquids | toolbox-only | no | no |  | H | M |
| 657 | AW | salt-lick | Salt Lick #6 capacity: only inside the Bleach/Dragonic term | adapter | partial | no |  | H | S |
| 658 | W3 | shrines | Shrine catalogue and bonus formula (9 shrines, base + per level, x Chaotic Chizoar card) | adapter | yes | no |  | H | M |
| 659 | W3 | shrines | Where a shrine applies (same map; World Tour = same world; Moai Head = anywhere) | adapter | partial | no |  | H | M |
| 660 | W3 | shrines | Level-up rate per shrine (ShrineExpBonus; per character, summed) | toolbox-only | no | no |  | H | M |
| 661 | W3 | shrines | Rate sources (building level +10%/Lv, Crystal Shrine, Post Office Construction Container,… | toolbox-only | no | no |  | H (terms), M (Crescent buil… | M |
| 662 | W3 | shrines | Progress bar and hours to next level (ShrineHrREQ) | toolbox-only | no | no |  | L | M |
| 663 | W3 | shrines | Shrine buildings in Construction (index 18-26, salts, cost growth, max level 100 + extens… | adapter | yes | no |  | H | M |
| 664 | W3 | shrines | Unlock and placement: build -> appears in Blunder Hills town; move with Shrine Architect … | adapter | partial | yes |  | H | M |
| 665 | W3 | shrines | Crystal Shrine boosts other shrines on the character's map | adapter | no | no |  | H | M |
| 666 | W3 | shrines | Total shrine level (Equinox challenge 140) | adapter | no | no |  | H | M |
| 667 | W3 | shrines | Same-map total (achievement 'My Shrines, m'lord.') and Yondergreen quest 1 (4 shrines on … | toolbox-only | no | no |  | M (breakpoints), H (Yonderg… | M |
| 668 | W3 | shrines | Map-scoped consumers (damage, HP/DEF, carry, drop, EXP, crystal/giant spawn, respawn, AFK… | toolbox-only | no | no |  | H | M |
| 669 | W3 | shrines | Moving a shrine resets its progress (Jade Emporium removes the loss) | toolbox-only | no | no |  | L | M |
| 670 | W3 | shrines | W4-W7 extensions (Lab World Tour, Moai Head, Shrine Speed superbit, Jade no-loss move, Le… | toolbox-only | no | no |  | H | M |
| 671 | W3 | trapping | Placed traps and finished-trap timers | adapter | yes | yes |  | H | L |
| 672 | W3 | trapping | Free trap slots (set ID + Call Me Ash, max 8) | adapter | partial | no |  | M | L |
| 673 | W3 | trapping | Trap rows: duration, quantity, EXP vs shiny flag | toolbox-only | no | no |  | M | L |
| 674 | W3 | trapping | Trap set ladder (11 sets: level gate, craft recipe, stats) | adapter | partial | partial |  | H | L |
| 675 | W3 | trapping | Critter spots and efficiency requirement (bonus critters above requirement) | toolbox-only | no | no |  | L | L |
| 676 | W3 | trapping | Trapping efficiency | toolbox-only | no | no |  | H | L |
| 677 | W3 | trapping | Critters per trap and Trapping EXP per trap (snapshotted at placement) | toolbox-only | no | no |  | L | L |
| 678 | W3 | trapping | Shiny critters: chance per trap, Shiny Snitch bundles | toolbox-only | no | no |  | M | L |
| 679 | W3 | trapping | Eagle Eye collect-all (Hunter) | toolbox-only | no | partial |  | M | L |
| 680 | W3 | trapping | Trapper Drone and Trap Box Vacuum (rift) | adapter | partial | no |  | H | L |
| 681 | W3 | trapping | Lord of the Hunt quests 1-11 | adapter | partial | partial |  | H | L |
| 682 | W3 | trapping | Pen Pals minigame score tiers | toolbox-only | no | no |  | H | L |
| 683 | W3 | trapping | Critter stock and what it feeds (vials, stamps, crafts, pouches, LotH) | adapter | no | no |  | H | L |
| 684 | W3 | trapping | Trapping boosters elsewhere (Call Me Ash, Cuz I Catch Em All, trap vials, stamps, cards, … | adapter | partial | no |  | H | L |
| 685 | W3 | trapping | Magnesium atom day counter (reset when a trap is placed) | toolbox-only | no | no |  | H | L |
| 686 | W3 | trapping | Task Come ere Critters (+2% shiny per completion) | toolbox-only | no | no |  | H | L |
| 687 | W3 | trapping | Snapshot rule: re-place after an efficiency/talent gain | missing | no | no |  | L | L |
| 688 | W3 | trapping | Timers pause on the character-select screen | missing | yes | yes |  | L | L |
| 689 | W3 | trapping | Dementia set uses the trap slot (Natural Traps) | toolbox-only | no | no |  | M | L |
| 690 | W3 | trapping | Bubba boon: +base critters per trap | adapter | yes | no |  | M | L |
| 691 | W3 | worship | Charge pool per character (current, max, rate, time to full) | adapter | yes | yes |  | H | L |
| 692 | W3 | worship | Max charge and charge rate sources (cards, Post Office 18b, Prayday/Flowin stamps, Gospel… | toolbox-only | no | no |  | H | L |
| 693 | W3 | worship | Charge Syphon (Wizard) and the overflow timer | toolbox-only | no | no |  | M | L |
| 694 | W3 | worship | Skulls: equipped skull per character | adapter | partial | yes |  | H | L |
| 695 | W3 | worship | Skull ladder and recipes (Ceramic to Luciferian; Slush exception) | adapter | no | no |  | M | L |
| 696 | W3 | worship | Totem table and unlocks (W1-W4: Gorefest, Wakawaka, Acorn, Frosty, Clash of Cans) | adapter | yes | no |  | H | L |
| 697 | W3 | worship | WORSHIP claim: where to spend charge (EXP per charge) | adapter | no | no |  | H | L |
| 698 | W3 | worship | Never-played open totem pays nothing | adapter | partial | no |  | H | L |
| 699 | W3 | worship | Worship level and EXP multiplier | adapter | partial | no |  | H | L |
| 700 | W3 | worship | Worship efficiency and the Soul bonus above minEfficiency | toolbox-only | no | no |  | H | L |
| 701 | W3 | worship | Souls held (Forest, Dune, Rooted, Frigid, Squishy) | adapter | no | no |  | H | L |
| 702 | W3 | worship | Soul gain multipliers (Species Epoch, Arcade 24, Upgrade Vault 50, Dementia set, Bubba) | toolbox-only | no | no |  | H | L |
| 703 | W3 | worship | Soul cards (Max Charge, Charge Rate, starting TD points; 5% per claim) | adapter | no | no |  | M | L |
| 704 | W3 | worship | Tower Defense run: summon cost, waves, wave timer, 30-wave loop | missing | no | no |  | M | L |
| 705 | W3 | worship | Saved run: resume wave and points (TotemInfo[1], TotemInfo[2]) | missing | no | no |  | M | L |
| 706 | W3 | worship | Kill points (TD currency) and Salt Lick Dioxide Synthesis | toolbox-only | no | no |  | M | L |
| 707 | W3 | worship | Starting TD points sources (Crab Juice / Calcium Carbonate vials, Banked Pts stamp, Post … | toolbox-only | no | no |  | M | L |
| 708 | W3 | worship | Construction towers (Pulse Mage ... Voidinator): levels, salt cost, per-level bonus | adapter | partial | no |  | M | L |
| 709 | W3 | worship | In-run tower placement and upgrade costs | missing | no | no |  | L | L |
| 710 | W3 | worship | Prayer unlocks by best wave | adapter | partial | no |  | H | L |
| 711 | W3 | worship | Total waves (Totalizer at W5, Tome, Menagerie W7) | toolbox-only | no | no |  | H | L |
| 712 | W3 | worship | Equinox TD challenges and Slow Roast Wiz | toolbox-only | no | no |  | H | L |
| 713 | W3 | worship | TD and Soul achievements (Sad/Fat/Smirky Souls, wave-50 challenges) | toolbox-only | no | no |  | M | L |
| 714 | W3 | worship | Hoggindaz4 quest (first summon tutorial) | adapter | partial | partial |  | M | L |
| 715 | W3 | worship | Totem HP superbits, Soul multipliers W5+, bulk claim (W7) | toolbox-only | no | no |  | L | L |
| 716 | W3 | worship | Prayers equipped and the Unending Energy 10 h curse | adapter | yes | no |  | H | L |
| 717 | W3 | worship | Wizard as the Worship main (role) | adapter | yes | yes |  | M | L |
| 718 | W4 | breeding | Breeding skill level and EXP | adapter | yes | no | none (display) | H | S |
| 719 | W4 | breeding | Egg nest and capacity | adapter | yes | no | breeding.check.full-nest | H | S |
| 720 | W4 | breeding | Egg timer (banked egg time) | adapter | yes | no | breeding.check.full-nest | H | S |
| 721 | W4 | breeding | Egg rarity (Normal to Godshard) and rank-ups | toolbox-only | no | no | none | H | M |
| 722 | W4 | breeding | Hatching and species discovery | adapter | partial | no | breeding.goal.next-row | H | M |
| 723 | W4 | breeding | New-Mob chance | toolbox-only | no | no | breeding.goal.next-row | H | M |
| 724 | W4 | breeding | Failsafe counter | toolbox-only | no | no | none | H | M |
| 725 | W4 | breeding | Mob Power and the Mob store | toolbox-only | no | no | none (store cap unread) | M | M |
| 726 | W4 | breeding | Trash -> Dead DNA | adapter | yes | no | breeding.goal.egg-capacity | H | S |
| 727 | W4 | breeding | Upgrades (13): levels, unlocks, costs | adapter | yes | no | breeding.goal.egg-capacity | H | S |
| 728 | W4 | breeding | Multiplier-unlock upgrades at level 0 | adapter | partial | no | breeding.check.multiplier-unlock | H | M |
| 729 | W4 | breeding | Paint Bucket | adapter | partial | no | none (page note) | H | S |
| 730 | W4 | breeding | Gene Splicing and gene levels | toolbox-only | no | no | none | M | M |
| 731 | W4 | breeding | Breedability | toolbox-only | no | no | breeding.check.fence-empty | H | M |
| 732 | W4 | breeding | Shiny Mobs and shiny levels | toolbox-only | no | no | none (L order) | H | M |
| 733 | W4 | breeding | Shiny passives | toolbox-only | no | no | none (fact) | H | M |
| 734 | W4 | breeding | Fence Yard slots and occupants | toolbox-only | no | no | breeding.check.fence-empty | M | M |
| 735 | W4 | breeding | Territories: battles won, teams, forage speed | adapter | yes | no | breeding.check.idle-territory, breeding.goal.next-territory | H | S |
| 736 | W4 | breeding | Combat Mobs on forage teams | toolbox-only | no | no | breeding.check.combat-forager | H | M |
| 737 | W4 | breeding | Spices and daily claims | adapter | yes | no | (cooking.check.claim-spices) | M | S |
| 738 | W4 | breeding | Mob Arena best wave and wave bonuses | adapter | yes | no | breeding.goal.arena-wave | H | S |
| 739 | W4 | breeding | Crucible (W7 hard arena) | toolbox-only | no | no | defer (W7) | H | - |
| 740 | W4 | breeding | Egg rank-up and egg upgrades | adapter | partial | no | none | H | S |
| 741 | W4 | breeding | Beast Master talents | toolbox-only | no | no | none | M | M |
| 742 | W4 | breeding | Egg achievements 218/220/221/222 | toolbox-only | no | no | none | M | M |
| 743 | W4 | breeding | Royal Egg Cap / Fenceyard Space gems, W4 egg merit | toolbox-only | no | no | none | H | M |
| 744 | AW | breeding | Pet Arena is World 4 Breeding content; monster-cash waves 20 (+0.5) and 175 (+1) | adapter | partial | no |  | H | S |
| 745 | AW | breeding | Pet Arena bonus thresholds (full list, randomList[53]) | adapter | partial | no |  | H | S |
| 746 | AW | breeding | Pet Arena Crucible (hard arena, accountOptions[628], gated on Menagerie unlock 8) | toolbox-only | no | no |  | H | M |
| 747 | W4 | cooking | Kitchen table and status | adapter | yes | no | cooking.check.idle-kitchen | H | S |
| 748 | W4 | cooking | Kitchen purchase | adapter | yes | no | cooking.goal.next-kitchen | M | S |
| 749 | W4 | cooking | Meal speed per kitchen | adapter | partial | no | cooking.goal.kitchen-speed | H | M |
| 750 | W4 | cooking | Speed / Fire / Luck upgrade levels | adapter | yes | no | cooking.goal.kitchen-speed | H | S |
| 751 | W4 | cooking | Upgrade spice cost and which spice each upgrade takes | toolbox-only | partial | no | cooking.goal.kitchen-speed | M | M |
| 752 | W4 | cooking | Recipe (fire) speed | toolbox-only | no | no | none | M | M |
| 753 | W4 | cooking | Luck and new-recipe odds | toolbox-only | no | no | none | L | M |
| 754 | W4 | cooking | Recipe discovery: spices in a kitchen, possible meals | toolbox-only | partial | no | cooking.goal.discover-meal | M | M |
| 755 | W4 | cooking | NEW_MEAL gem shop purchase | adapter | no | no | none (gem opinion) | M | S |
| 756 | W4 | cooking | Meal table: level, copies, next level cost | adapter | yes | no | cooking.check.level-meal | H | S |
| 757 | W4 | cooking | Meal bonus value | toolbox-only | partial | no | cooking.priority.meals | H | M |
| 758 | W4 | cooking | Max meal level | adapter | yes | no | cooking.check.capped-meal | H | S |
| 759 | W4 | cooking | Plate tiers: Lv 11 | adapter | no | no | cooking.goal.diamond-meals | M | M |
| 760 | W4 | cooking | Cooking-feeding meals | toolbox-only | partial | no | cooking.priority.meals | M | M |
| 761 | W4 | cooking | Meals and spices as costs of Lab chips/jewels and Breeding u | toolbox-only | partial | no | (lab.check.weekly-*) | M | M |
| 762 | W4 | cooking | No Meal Left Behind | toolbox-only | no | no | defer (W5+) | H | - |
| 763 | W4 | cooking | Spice production and daily claims | adapter | yes | no | cooking.check.claim-spices | M | S |
| 764 | W4 | cooking | Spice sinks (kitchen upgrades, Kazam bubbles EGG_INK/DIAMOND | adapter | partial | no | none (display) | H | S |
| 765 | W4 | cooking | Ladles (held stack, +1 h per ladle to every kitchen) | adapter | partial | no | cooking.check.use-ladles | M | M |
| 766 | W4 | cooking | Cooking AFK target, Cooking skill level and ladle income | missing | no | no | cooking.check.afk-chef | M | L |
| 767 | W4 | cooking | Blood Berserker cooking talents | toolbox-only | no | no | (input to cooking.check.afk-chef) | H | M |
| 768 | W4 | cooking | Richelin Kitchen gem upgrade | adapter | no | no | none (gem opinion) | M | S |
| 769 | W4 | cooking | Lab jewels for cooking | adapter | partial | no | none (cross-link) | H | S |
| 770 | W4 | cooking | Cross-system meal speed sources | toolbox-only | no | no | none (speed sheet) | H | M |
| 771 | W4 | cooking | Cooking Mastery | toolbox-only | no | no | defer (Rift 60) | H | - |
| 772 | W4 | cooking | Ribbons (Grimoire / bundles / Event Shop) | toolbox-only | no | no | defer (W5+) | H | - |
| 773 | W4 | cooking | Achievements and Tome tasks fed by cooking | toolbox-only | no | no | none | M | M |
| 774 | W4 | elite-classes | Class tree and the elite promotion | adapter | yes | partial | elite-classes.check.eliteus, metapath.goal.elite (patch) | H | S |
| 775 | W4 | elite-classes | Eliteus quest steps | adapter | no | no | elite-classes.check.eliteus | H | M |
| 776 | W4 | elite-classes | Greenie Gang kill counter | missing | no | no | none (counter key missing) | L | L |
| 777 | W4 | elite-classes | Elite order (which character to promote first) | adapter | yes | partial | metapath.goal.elite (L order kept) | L | S |
| 778 | W4 | elite-classes | Elite family bonuses | toolbox-only | no | no | elite-classes.goal.family-start | H | M |
| 779 | W4 | elite-classes | Fourth talent tab and its points | adapter | partial | no | elite-classes.check.tab4-points | H | M |
| 780 | W4 | elite-classes | Symbols of Beyond and added talent levels | toolbox-only | no | no | none (display) | H | M |
| 781 | W4 | elite-classes | Elite specialty and AFK slot | adapter | partial | partial | none (metapath Roles keep it) | M | S |
| 782 | W4 | elite-classes | Bubonic Conjuror Purple and Green Tube coverage in the Lab | adapter | no | no | elite-classes.check.lab-tubes | H | M |
| 783 | W4 | elite-classes | Blood Berserker cooking talents | adapter | no | no | (cooking.check.afk-chef) | H | M |
| 784 | W4 | elite-classes | Elemental Sorcerer Polytheism second god | toolbox-only | no | no | defer (W5) | H | - |
| 785 | W4 | elite-classes | Rift class gates | toolbox-only | partial | no | (rift.check.class-gate) | H | M |
| 786 | W4 | elite-classes | Massive Troll fights | toolbox-only | no | no | (boss-keys) | M | M |
| 787 | W4 | elite-classes | Begone Troll! task | toolbox-only | no | no | elite-classes.goal.begone-troll | H | M |
| 788 | W4 | elite-classes | Massive Troll and Mutated Mush cards | adapter | partial | no | none | H | S |
| 789 | W4 | elite-classes | Mutated Mush stored spawns | toolbox-only | no | no | (boss-keys.check.mini-boss-capped) | M | M |
| 790 | W4 | elite-classes | Voidwalker quest line | adapter | no | no | elite-classes.goal.voidwalker | H | M |
| 791 | W4 | elite-classes | Elite Class Swap Token | missing | no | no | none (unavailable) | L | L |
| 792 | W4 | elite-classes | Duplicate elites | adapter | partial | no | none (both views) | L | S |
| 793 | W4 | elite-classes | W5+ promotions | adapter | no | no | defer (W5+) | H | - |
| 794 | W4 | lab | Lab access (System unlock on reaching W4 town; Gobo quest 5 | adapter | yes | no | lab.check.first-upload | H/L part | S |
| 795 | W4 | lab | Chip Repository opener | adapter | yes | no | lab.goal.open-repository | M | S |
| 796 | W4 | lab | Jewel Spinner opener | adapter | yes | no | lab.goal.open-spinner | M | S |
| 797 | W4 | lab | In-tube membership | adapter | yes | no | lab.check.first-upload | H | S |
| 798 | W4 | lab | Prism connection and player chain | adapter | yes | no | lab.check.not-connected | H | S |
| 799 | W4 | lab | Lab character drifted | adapter | no | no | lab.check.chain-broke | M | M |
| 800 | W4 | lab | Mainframe nodes lit | adapter | yes | no | lab.goal.light-next-node | H/L part | S |
| 801 | W4 | lab | Connection Range | toolbox-only | partial | no | (input to lab.goal.light-next-node) | H | M |
| 802 | W4 | lab | Line Width per character | adapter | partial | no | (input to lab.check.not-connected) | H | S |
| 803 | W4 | lab | Souped Up Tubes | toolbox-only | no | no | none (C2 Disputed) | M (Disputed part) | M |
| 804 | W4 | lab | Lab level per character | adapter | yes | no | (input to lab.check.empty-chip-slot) | H | S |
| 805 | W4 | lab | Lab efficiency and Lab EXP rate | toolbox-only | no | no | none (display) | M/L part | M |
| 806 | W4 | lab | Bubonic Conjuror tubes | toolbox-only | partial | no | elite-classes.check.lab-tubes | H/L part | M |
| 807 | W4 | lab | Rift Skill Mastery Lab tiers | toolbox-only | no | no | rift.goal.skill-mastery | M (Disputed part) | M |
| 808 | W4 | lab | Chip slots (7 per character at Lab 5/10/15/25/35/50/75) | adapter | yes | no | lab.check.empty-chip-slot | M | S |
| 809 | W4 | lab | Chip repository counts | toolbox-only | partial | no | lab.check.empty-chip-slot | H | M |
| 810 | W4 | lab | Weekly Lab shop rotation | adapter | yes | no | lab.check.weekly-chip, lab.check.weekly-jewel | H | S |
| 811 | W4 | lab | Gem shop Console Chip / Mainframe Jewel | toolbox-only | no | no | none | H | M |
| 812 | W4 | lab | Chip effects and who wears what | toolbox-only | partial | no | lab.priority.chip-picks | M | M |
| 813 | W4 | lab | Inert conditional chips | missing | no | no | lab.check.inert-chip | H | L |
| 814 | W4 | lab | Jewels owned and lit | adapter | yes | no | lab.check.jewel-unlit | H | S |
| 815 | W4 | lab | Jewel multipliers: Spelunker Obol x1.5, colour set doubling, | toolbox-only | no | no | none (fact) | H | M |
| 816 | W4 | lab | Jewel and node buy/chase order | adapter | no | no | none (L) | L | S |
| 817 | W4 | lab | Node consumers in other Systems | adapter | no | no | none (cross-link chips) | H | S |
| 818 | W4 | lab | Moving Lab characters for other work | adapter | partial | no | lab.check.chain-broke | H | M |
| 819 | W4 | lab | Viaduct of the Gods trade-off | adapter | partial | no | none (O) | L | S |
| 820 | W4 | lab | W5+ Lab gates | toolbox-only | partial | no | defer (W5+) | n/a | - |
| 821 | W4 | rift | Rift level counter and bonus unlock predicate | toolbox-only | no | no | rift.goal.next-bonus | H | M |
| 822 | W4 | rift | Unlock: Rift Ripper quest 'Entering The Rift...' | adapter | no | no | rift.check.unlock-quest | H | M |
| 823 | W4 | rift | Current task, quota and progress | toolbox-only | no | no | rift.check.afk-task, rift.check.active-task, rift.check.quota-done | M | M |
| 824 | W4 | rift | Class-gated score tasks | adapter | partial | partial | rift.check.class-gate (+ metapath.goal.elite) | H | M |
| 825 | W4 | rift | AFK Rift target | adapter | partial | no | rift.check.afk-task, rift.check.quota-done | H | M |
| 826 | W4 | rift | Character-count tasks | toolbox-only | no | no | rift.check.active-task | H | M |
| 827 | W4 | rift | 12 account bonuses | toolbox-only | no | no | rift.goal.next-bonus | H | M |
| 828 | W4 | rift | Skill Mastery | toolbox-only | no | no | rift.goal.skill-mastery | H | M |
| 829 | W4 | rift | Infinite Stars | adapter | partial | no | none (star-signs fit lists already) | H | S |
| 830 | W4 | rift | Eclipse Skulls | toolbox-only | no | no | none (fact) | H | M |
| 831 | W4 | rift | Stamp Mastery | toolbox-only | no | no | none (fact) | M | M |
| 832 | W4 | rift | Vial Mastery | toolbox-only | no | no | none (fact) | M | M |
| 833 | W4 | rift | Construct Mastery | toolbox-only | no | no | none (meter) | H | M |
| 834 | W4 | rift | Ruby Cards (Rift 45): card Lv 6 | toolbox-only | no | no | none (fact) | H | M |
| 835 | W4 | rift | Killroy Prime | toolbox-only | no | no | none (fact) | M | M |
| 836 | W4 | rift | Post-W4 bonuses: Trap Box Vacuum | toolbox-only | no | no | none (display) | M | M |
| 837 | W4 | rift | Tome: Rift Levels Completed | toolbox-only | no | no | (tome metric) | H | M |
| 838 | W4 | rift | Breeding bubble 'Petting the Rift' | toolbox-only | no | no | none (fact) | H | M |
| 839 | W4 | rift | Rift mob HP and level scaling | missing | no | no | none (L) | L | L |
| 840 | AW | rift | Rift display numbering (displayed Rift = Rift[0] + 1) | toolbox-only | no | no |  | H | M |
| 841 | AW | rift | Ruby Cards (code 45, shown Rift 46) | toolbox-only | no | no |  | H | M |
| 842 | AW | rift | Rift task progress (Rift[1] vs the current task) | toolbox-only | no | no |  | L | M |
| 843 | W4 | sigils | Sigil catalogue | toolbox-only | no | no | sigils.fact.catalogue | H | M |
| 844 | W4 | sigils | Per-sigil tier and progress | toolbox-only | no | no | sigils.check.ready | H | M |
| 845 | W4 | sigils | Lab gate: Mainframe bonus 12 'Sigils of Olden Alchemy' | adapter | partial | no | sigils.check.lab-off, sigils.goal.lab-connect | H | M |
| 846 | W4 | sigils | Assignment: which character charges which sigil | adapter | partial | no | sigils.check.seat-capped | H | M |
| 847 | W4 | sigils | Charging slots: only character index 0-9 charges | toolbox-only | no | no | sigils.check.slot-over-ten | H | M |
| 848 | W4 | sigils | Charge rate per sigil and ETA | toolbox-only | no | no | sigils.fact.speed (ETA) | H | M |
| 849 | W4 | sigils | Sigil speed and its sources | toolbox-only | no | no | sigils.fact.speed | H | M |
| 850 | W4 | sigils | Next cost and reachable cap | toolbox-only | no | no | sigils.check.seat-capped | H | M |
| 851 | W4 | sigils | Ready to level: progress >= nextCost, levels when the Sigils | toolbox-only | no | no | sigils.check.ready | M/L part | M |
| 852 | W4 | sigils | Unlock subtraction rule | missing | no | no | none (L) | L | L |
| 853 | W4 | sigils | Sigil bonus effects into other Systems | toolbox-only | no | no | none (display) | H | M |
| 854 | W4 | sigils | Tome / Menagerie metric: Total Sigil LV | toolbox-only | no | no | (tome.goal.metric-tier) | H | M |
| 855 | W4 | sigils | Unlock and Boost order | toolbox-only | no | no | none (L) | L | M |
| 856 | W4 | sigils | W5+ extensions | toolbox-only | no | no | defer (W5+) | M | - |
| 857 | W4 | tome | Tome score and 124-metric table | toolbox-only | no | no | tome.fact.score | H | M |
| 858 | W4 | tome | Account-level gate per metric | adapter | no | no | tome.goal.unlock-metric | H | M |
| 859 | W4 | tome | Curves, bar colours, required quantities | toolbox-only | no | no | tome.goal.metric-tier | M | M |
| 860 | W4 | tome | Purple pages: DMG bonus | toolbox-only | no | no | tome.fact.score | H | M |
| 861 | W4 | tome | Blue Tome Pages | toolbox-only | no | no | tome.check.blue-pages | M | M |
| 862 | W4 | tome | Red Tome Pages | toolbox-only | no | no | tome.check.red-pages | M | M |
| 863 | W4 | tome | Golden / Singed Tome | toolbox-only | no | no | none (fact) | H | M |
| 864 | W4 | tome | Tome bubbles and Chapter bubbles | toolbox-only | no | no | tome.goal.bubble-stack | H | M |
| 865 | W4 | tome | Tome bonus multiplier | toolbox-only | no | no | none (fact) | H | M |
| 866 | W4 | tome | Percentile rank and monthly nametags | toolbox-only | no | no | tome.check.claim-nametags | H | M |
| 867 | W4 | tome | Teh TOM vault upgrade | adapter | partial | no | none (fact) | H | S |
| 868 | W4 | tome | Statue quirk | toolbox-only | no | no | tome.fact.statue-character | H | M |
| 869 | W4 | tome | Top 0.1% wish and Menagerie nametag turn-in | missing | no | no | defer (W7) | H | - |
| 870 | W4 | tome | W7 Tome Epilogue lore bonuses | missing | no | no | defer (W7) | H | - |
| 871 | W4 | tome | Other consumers | missing | no | no | none (fact) | M | L |
| 872 | W4 | tome | Metric history drift | toolbox-only | no | no | none (fact) | M | M |
| 873 | AW | achievements | Slot layout and completion flag (420 slots, 70 per world, FILLERZZZ_ACH placeholders) | toolbox-only | no | no |  | H | L* |
| 874 | AW | achievements | Progress counter (AchieveReg counter or Steam counter) | toolbox-only | no | no |  | M | L* |
| 875 | AW | achievements | Steam gating, Steam-only gem and Time Candy rewards | toolbox-only | no | no |  | M | L* |
| 876 | AW | achievements | Status multiplier (getAchievementStatus) | toolbox-only | no | no |  | H | L* |
| 877 | AW | achievements | Total count, Tome and Gaming Superbit 0 | toolbox-only | no | no |  | H | L* |
| 878 | AW | achievements | Achievement task per world (count vs breakpoints, last tier unreachable) | toolbox-only | no | no |  | H | L* |
| 879 | AW | achievements | Arcade ball rate from achievements (24 entries, +47%) | toolbox-only | no | no |  | H | L* |
| 880 | AW | achievements | Total damage, crit and multikill (incl. dungeon-difficulty achievements) | toolbox-only | no | no |  | H | L* |
| 881 | AW | achievements | Class EXP, skill EXP / efficiency and respawn | toolbox-only | no | no |  | H | L* |
| 882 | AW | achievements | Talent points (95 in W1-W4) | adapter | partial | no |  | H | L* |
| 883 | AW | achievements | System bonuses W1-W4 (Library, Cooking, Breeding, Construction, Printer, Alchemy, Forge, golden food, obols, m | toolbox-only | no | no |  | H | L* |
| 884 | AW | achievements | Exact-stack achievements (25 in W1-W4) | toolbox-only | no | no |  | M | L* |
| 885 | AW | achievements | RNG-item unlocks, title backgrounds, EZ-Access, teleports, hat recipes | toolbox-only | no | no |  | H | L* |
| 886 | AW | achievements | Secret achievements | toolbox-only | no | no |  | H | L* |
| 887 | AW | achievements | AFK-accrued achievements (Hybernation 168 h, 1M kill trio, Crystal Champ) | toolbox-only | no | no |  | H | L* |
| 888 | AW | achievements | W5-W6 entries and their consumers (Sailing, Gaming, Divinity, Farming, Summoning, Sneaking) | toolbox-only | no | no |  | H | L* |
| 889 | AW | achievements | Data-only entries (no Toolbox consumer) | toolbox-only | no | no |  | H | L* |
| 890 | AW | checklist | Daily reset clock (per-account ShopRestock) | adapter | yes | yes |  | H | S |
| 891 | AW | checklist | Account weekly reset (OLA[39]) | adapter | yes | yes |  | H | S |
| 892 | AW | checklist | Server week (Thursday 00:00 UTC) and Ballot week (about Monday 17:02 UTC) | adapter | yes | yes |  | M | S |
| 893 | AW | checklist | Silver / Gold Pocketwatch (move the reset, extra daily pass) | toolbox-only | no | yes |  | L | S |
| 894 | AW | checklist | Random Event (one a day, hourly server roll) | adapter | yes | yes |  | H | S |
| 895 | AW | checklist | Random Event unique drops log | toolbox-only | no | no |  | M | S |
| 896 | AW | checklist | Random Event second loot roll (party size, Rando shop, Loot Table Tampering bribe) | toolbox-only | no | no |  | L | S |
| 897 | AW | checklist | Daily minigame plays | adapter | yes | yes |  | M | S |
| 898 | AW | checklist | Spiketrap daily gems | adapter | yes | yes |  | L | S |
| 899 | AW | checklist | Daily Merit task (9th task per world board) | adapter | yes | yes |  | H | S |
| 900 | AW | checklist | Guild daily and weekly tasks | adapter | yes | yes |  | H | S |
| 901 | AW | checklist | Post Office daily orders | adapter | yes | yes |  | H | S |
| 902 | AW | checklist | Vial attempts | adapter | yes | yes |  | M | S |
| 903 | AW | checklist | Liquid Shop daily gems | adapter | yes | yes |  | M | S |
| 904 | AW | checklist | Guaranteed daily crystal mobs | toolbox-only | no | no |  | H | S |
| 905 | AW | checklist | Daily boss-gem fights (World 2 merit) | toolbox-only | no | no |  | M | S |
| 906 | AW | checklist | Weekly Battle daily raid reset | adapter | partial | yes |  | H | S |
| 907 | AW | checklist | Pet free pull, Pet Mart gems, Pet Tournament registration | adapter | yes | yes |  | H | S |
| 908 | AW | checklist | Town vendor shop restock | adapter | no | no |  | M | S |
| 909 | AW | checklist | Dr Defecaus and Baba Yaga respawns | missing | no | no |  | L | S |
| 910 | AW | checklist | Insta-revive (1 per character per reset) | missing | no | no |  | L | S |
| 911 | AW | checklist | Picnic Stowaway daily quests | toolbox-only | no | no |  | L | S |
| 912 | AW | checklist | Glimmerwick Candle wish (event item) | toolbox-only | no | no |  | H | S |
| 913 | AW | checklist | Equinox bar full / challenge complete | toolbox-only | no | no |  | H | S |
| 914 | AW | checklist | Breeding eggs full | adapter | no | no |  | H | S |
| 915 | AW | checklist | Forge empty slots, Hat Rack hats | adapter | partial | yes |  | H | S |
| 916 | AW | checklist | Gem Shop daily and weekly restock limits | adapter | no | yes |  | H | S |
| 917 | AW | checklist | Boss keys (Forest Villa, Efaunt's Tomb, Chizoar's Cavern), 3-day bank | adapter | yes | yes |  | H | S |
| 918 | AW | checklist | Colosseum tickets (Typhoon, Centurion, Lonely Hunter), 3-day bank | adapter | yes | yes |  | H | S |
| 919 | AW | checklist | EZ-Access achievements and Auto Claim EZ Access | toolbox-only | no | no |  | L | S |
| 920 | AW | checklist | World teleports bank | toolbox-only | no | yes |  | M | S |
| 921 | AW | checklist | Arcade balls charging (48-58 h cap) | adapter | partial | yes |  | H | S |
| 922 | AW | checklist | Crystal Island days (cap 14; 13 days = 27 mobs, 14 = 15) | toolbox-only | no | yes |  | H | S |
| 923 | AW | checklist | Miniboss counters (Dilapidated Slush, Mutated Mush) | toolbox-only | no | yes |  | M | S |
| 924 | AW | checklist | Free daily levels: No Stamp / Bubble / Meal Left Behind, Ribbon roll, Kattlekruk | toolbox-only | no | no |  | H | M |
| 925 | AW | checklist | Hydrogen day counter (Atom Collider) | toolbox-only | no | yes |  | M | S |
| 926 | AW | checklist | Killroy rooms | adapter | yes | yes |  | H | S |
| 927 | AW | checklist | Killroy skulls (lost at the weekly reset) and the 50 arcade-pack weekly cap | adapter | yes | yes |  | H | S |
| 928 | AW | checklist | Weekly Battle | adapter | yes | yes |  | H | S |
| 929 | AW | checklist | Bonus Ballot vote | adapter | yes | yes |  | M | S |
| 930 | AW | checklist | Dungeon boosted runs, first-run 20x flag, Happy Hour windows | toolbox-only | no | yes |  | M | M |
| 931 | AW | checklist | Giant monsters weekly counter (Tachion of the Titans) | toolbox-only | no | no |  | H | S |
| 932 | AW | checklist | Lab Chip Repository and Jewel Spinner weekly rotation | adapter | partial | no |  | H | S |
| 933 | AW | checklist | Shimmer Island weekly challenge | toolbox-only | no | yes |  | H | S |
| 934 | AW | checklist | Tome monthly Nametag | toolbox-only | no | yes |  | L | S |
| 935 | AW | checklist | Seasonal events (event boxes, Event Shop) | toolbox-only | no | no |  | L | S |
| 936 | AW | checklist | Priority order when time is short | adapter | yes | yes |  | M | S |
| 937 | AW | classes | Class level, EXP and EXP-to-next (per character) | adapter | partial | yes |  | H | S |
| 938 | AW | classes | Class EXP multiplier total (getClassExpMulti value) | adapter | no | partial |  | H | S |
| 939 | AW | classes | Class EXP source breakdown (60+ named sources, additive vs multiplicative) | toolbox-only | no | no |  | H | M |
| 940 | AW | classes | Lowest-level character bonus (Merit Shop W1 row 2 + Upgrade Vault 12 + Superbit Noobie Gains) | toolbox-only | no | no |  | H | S |
| 941 | AW | classes | Level-banded Class EXP bonus (<10 +150, <30 +100, <50 +50) | adapter | no | no |  | H | S |
| 942 | AW | classes | Level-limited sources: Blunder Hills card set (<50), Meals Clexp (<120) | adapter | partial | yes |  | H | S |
| 943 | AW | classes | Luck term (expGainLUK, x Lucky Charms) | toolbox-only | no | no |  | H | M |
| 944 | AW | classes | Weekly boss MISC buff (weeklyBossesRaw.c, cap 150) | toolbox-only | no | no |  | H | M |
| 945 | AW | classes | W1-W4 account sources: Salt Lick Explosive Salts, EXP statue, stamps classxp, vial MonsterEXP... | toolbox-only | partial | partial |  | H | M |
| 946 | AW | classes | Multiplicative chain (equip 78/84, arcade Class_XP_multi, vial 7classexp, companions, W4... | toolbox-only | no | no |  | M | M |
| 947 | AW | classes | Best Class EXP map per character (EXP/h = kills/h x ExpGiven x multi) | adapter | partial | yes |  | M | S |
| 948 | AW | classes | Time Candy (hours held, per-candy hours, special candy ranges) | adapter | partial | partial |  | H | S |
| 949 | AW | classes | Level gates: personal obol slots, family obol slots | adapter | yes | yes |  | H | S |
| 950 | AW | classes | Class promotions (sub class, elite) and Beginner talent cap | adapter | yes | no |  | L | S |
| 951 | AW | classes | EXP Converter (skill EXP to Class EXP) and vial ClassEXPconvert | missing | no | no |  | L | L |
| 952 | AW | classes | Super (star) talent points from level 400+ | toolbox-only | no | no |  | H | M |
| 953 | AW | classes | Family class bonuses (thresholds 29/69/129, Bowmen active Class EXP) | toolbox-only | no | no |  | M | M |
| 954 | AW | coins | Coin wallet: bank + every character's coins | adapter | partial | yes |  | H | S |
| 955 | AW | coins | Cash multi per character (getCashMulti().cashMulti) | toolbox-only | no | no |  | H | M |
| 956 | AW | coins | Cash multi breakdown: ~22 multiplicative groups x one additive bracket | toolbox-only | no | no |  | H | M |
| 957 | AW | coins | Upgrade Vault cash rows (2 Monster Tax, 14 Bored to Death, 17 Mining Payday, 31 Dirty Money... | adapter | yes | yes |  | H | S |
| 958 | AW | coins | Cash bubbles: Penny of Strength / Dollar of Agility / Nickel of Wisdom (per 250 stat... | toolbox-only | partial | no |  | M | M |
| 959 | AW | coins | Gold armour set x1.5 (registered in the Armor Smithy, or worn by the logged-in character) | adapter | partial | no |  | M | S |
| 960 | AW | coins | Golden Bread (golden food, MonsterCash, additive bracket) | adapter | no | no |  | M | S |
| 961 | AW | coins | Base coins per monster and the AFK coin map (monsterCoinQuantity x kills x multi) | toolbox-only | no | no |  | L | M |
| 962 | AW | coins | Pecunia statue (Monster Cash term in the Pet Arena group; separate ground-coins term per wiki) | adapter | yes | no |  | L | S |
| 963 | AW | coins | Jawbreaker prayer (x coins, curse +monster HP; Worship Wakawaka War wave 101) | adapter | yes | no |  | L | S |
| 964 | AW | coins | Star talent Cash Money, Journeyman CHACHING!, COINS_FOR_CHARON, AMERICAN_TIPPER | adapter | partial | no |  | L | S |
| 965 | AW | coins | Real-money and event levers: cash bundle bun_y x3.5, event shop 9 / 20, companions 24 / 38 /... | toolbox-only | no | no |  | H | M |
| 966 | AW | coins | Other in-bracket and late terms (vials Dieter Drink, cards Money_from_Monsters, obols, Post... | toolbox-only | no | no |  | L | M |
| 967 | AW | drop-rate | Final drop rate per character (getDropRate().dropRate) | toolbox-only | partial | partial |  | H | M |
| 968 | AW | drop-rate | Best drop-rate character (getHighestDropRate) and best fighter | toolbox-only | no | no |  | H | M |
| 969 | AW | drop-rate | Additive base: LUK curve (1.4 x statCurve(LUK)) | toolbox-only | no | no |  | H | M |
| 970 | AW | drop-rate | Additive base: account-wide sources (Droppin' Loads, Golden Sixes, Gold Charm, arcade row 27... | toolbox-only | no | partial |  | H | M |
| 971 | AW | drop-rate | Additive base: per-character sources (gear and obols etcBonuses[2], talents ROBBINGHOOD /... | toolbox-only | no | partial |  | H | M |
| 972 | AW | drop-rate | Clover Shrine (map-scoped additive, +15% +3%/level) | adapter | yes | no |  | M | S |
| 973 | AW | drop-rate | Lab chip Grounded Processor (+0.6x while the base is under 5x) | adapter | partial | no |  | H | S |
| 974 | AW | drop-rate | Bundle terms bun_v (+2 flat) and bun_p (x1.2) | toolbox-only | no | no |  | H | M |
| 975 | AW | drop-rate | Siege Breaker (ARCHLORD extraDropRate multiplier) and Ninja Mastery +0.3 | toolbox-only | no | no |  | H | M |
| 976 | AW | drop-rate | Multiplier chain (cards Drop_Rate_Multi, Mama Troll, Mallay x1.3 cap, Santa Snake x1.01 cap... | toolbox-only | no | no |  | H | M |
| 977 | AW | drop-rate | Drop rate in material farming (Walkthrough supply) | adapter | yes | yes |  | H | S |
| 978 | AW | drop-rate | Drop rate and card drops (disputed) | toolbox-only | no | no |  | L | M |
| 979 | AW | dungeons | Dungeon Rank (lifetime credits -> rank, trait-set gates) | toolbox-only | no | no |  | H | S |
| 980 | AW | dungeons | Trait sets (9 sets, 28 bonuses, one pick per set) | toolbox-only | no | no |  | M | S |
| 981 | AW | dungeons | Flurbo stats (8 out-of-dungeon stats, cap 50) | toolbox-only | partial | no |  | H | S |
| 982 | AW | dungeons | Equinox: max 5 Flurbo stats | toolbox-only | no | no |  | H | S |
| 983 | AW | dungeons | Credits wallet and in-dungeon passives (8, cap 100) | toolbox-only | no | no |  | M | S |
| 984 | AW | dungeons | Credit-shop RNG items (48, rarity Common..Legendary) | toolbox-only | no | no |  | L | S |
| 985 | AW | dungeons | Boosted runs (12 free/week + 3 per booster; Happy Hour bulk) | toolbox-only | no | no |  | M | S |
| 986 | AW | dungeons | Weekly Dungeon Boosters (Gem Shop GemP15) | adapter | no | no |  | L | S |
| 987 | AW | dungeons | Keychains (Flurbo shop T1-T4, Gem Shop packs, Loot Dice rank gates) | toolbox-only | no | no |  | M | M |
| 988 | AW | dungeons | Flurbo star-talent chain and DUNGEONIC_DAMAGE | toolbox-only | partial | no |  | M | S |
| 989 | AW | dungeons | Dungeon cards (23, credit/Flurbo cards matter) | adapter | partial | no |  | M | S |
| 990 | AW | dungeons | Dungeon achievements (Pinch/Slap/Wallop, boss tiers) | toolbox-only | no | no |  | M | S |
| 991 | AW | dungeons | Equinox boss clears (Vengeful Grandfrogger 4th diff, Inevitable Snakenhotep, Caustic Glaciaxus) | toolbox-only | no | no |  | H | S |
| 992 | AW | dungeons | Killroy 'Dungeon Drops' upgrade (open-world mobs drop credits) | toolbox-only | no | no |  | L | S |
| 993 | AW | dungeons | Fractal Island 1.25x Credits and Flurbos | toolbox-only | no | no |  | H | S |
| 994 | AW | dungeons | Unconsumed save fields (Dungeon_CredMulti/FlurboMulti/CardMulti, Dungeon1_time, DungUpg[3]/[4]/[6], OptLacc[74 | missing | no | no |  | none | S |
| 995 | AW | dungeons | Dungeon equipment, weapons and enhancers | missing | no | no |  | L | S |
| 996 | AW | event-shop | Event Points balance | toolbox-only | no | no |  | H | M |
| 997 | AW | event-shop | Owned items (permanent boolean per id, letters string) | toolbox-only | no | no |  | H | M |
| 998 | AW | event-shop | Item catalogue (names, costs 12..275, effect text, world) | missing | no | no |  | M (ids/effects of parsed rows H; costs L | L |
| 999 | AW | event-shop | W1-W4 permanent bonuses that Toolbox applies (0 Golden Tome, 1 Stamp Stack, 2 Bubble Broth, 3... | toolbox-only | no | no |  | H | M |
| 1000 | AW | event-shop | Supreme Wiring (id 4) and the winter-event day counter OLA[323] | toolbox-only | yes | yes |  | H (formula); M on OLA[323] meaning (doss | M |
| 1001 | AW | event-shop | W1-W4-relevant items Toolbox does NOT parse (8 Extra Page, 12 Secret Pouch, 17 Another Page... | toolbox-only | no | no |  | L-M | M |
| 1002 | AW | event-shop | W5-W7 items bought with the same points (6, 15, 23, 25, 26, 29, 32-40, 42-46, 48, 55) | toolbox-only | no | no |  | H (parsed) / M (id 40 disputed, C34) | M |
| 1003 | AW | event-shop | Seasonal event live / stock rotation / points earn rate | missing | no | no |  | L | L |
| 1004 | AW | event-shop | Event cards (category Events, Y0-Y24) and the Gold Food cap | adapter | partial | no |  | H | S |
| 1005 | AW | event-shop | Unspent Event Points with an affordable item not owned | missing | no | no |  | M | L |
| 1006 | AW | family | Family level (sum of class levels) | adapter | partial | partial |  | H | M* |
| 1007 | AW | family | Character slots by family level (2-11) | adapter | partial | partial |  | H | M* |
| 1008 | AW | family | Family obol slots (24, gated by family level) | adapter | no | partial |  | H | M* |
| 1009 | AW | family | Per-class family bonus table (value, setter, curve) | toolbox-only | no | no |  | H | M* |
| 1010 | AW | family | Highest-wins and duplicate lines | adapter | partial | partial |  | H | M* |
| 1011 | AW | family | Stale class level in the family walk (StatList[4] vs Lv0) | missing | no | no |  | L | M* |
| 1012 | AW | family | Promotion gates for each bonus (9 / 29 / 69 / 129) | adapter | partial | partial |  | H | M* |
| 1013 | AW | family | THE_FAMILY_GUY talent (elite, x THE played character's own bonuses) | adapter | no | no |  | H | M* |
| 1014 | AW | family | Elemental Sorcerer added talent levels | toolbox-only | no | no |  | H | M* |
| 1015 | AW | family | Per-viewer table (which character's view to show) | toolbox-only | no | no |  | H | M* |
| 1016 | AW | family | Sub Class Swap Token and Class Redo | missing | partial | partial |  | M | M* |
| 1017 | AW | family | Family level gates elsewhere (Tome) | adapter | no | no |  | M | M* |
| 1018 | AW | family | Unconsumed stat bonuses (base-class STR/AGI/WIS/LUK, Bowman, Bubonic, Wind Walker) | toolbox-only | no | no |  | M | M* |
| 1019 | AW | food | M1 Food slots: 16-entry buffer per character, Blank entries, unlocked count | adapter | no | no |  | H for the buffer and its contents, L for | S |
| 1020 | AW | food | M1b Extra food slot sources: Gem Shop FOOD_SLOT (2 buys, 450 + 750 gems) and W3 Merit Shop row... | adapter | partial | yes |  | H (data); L (when to buy) | S |
| 1021 | AW | food | M2 Health food and auto-eat (Amount, Trigger 30-80%, Cooldown 10-60 s, heal multiplier) | adapter | yes | yes |  | H | S |
| 1022 | AW | food | M3 Boost food (potions, skill foods, bullets, event foods) and its multiplier | adapter | no | no |  | H (data); advice to match boost food to  | S |
| 1023 | AW | food | M4 Golden Food bonus per food (never consumed, log stack curve, summed per Effect, 17 foods) | toolbox-only | no | no |  | H (formula); the additive vs multiplier. | M |
| 1024 | AW | food | M4b Golden food owned but not equipped (bags and storage) | toolbox-only | no | no |  | H | M |
| 1025 | AW | food | M4c Golden food on a character that does not use its Effect (Ribs/Peanut on a... | adapter | no | no |  | M | S |
| 1026 | AW | food | M5 Golden Food multiplier (per character; family bonus, HAUNGRY_FOR_GOLD, gear/obols, Golden... | toolbox-only | no | no |  | H (structure); M for the Shaman family i | M |
| 1027 | AW | food | M5b Achievement 37 Nutty Crafter: craft 42 Golden Peanuts (+5% golden food multi, all... | toolbox-only | no | no |  | H (fact), M (worth doing now) | M |
| 1028 | AW | food | M6 Double Golden Food Drop (Tesseract, Palette, Big Fish; drop size) | toolbox-only | no | no |  | H | M |
| 1029 | AW | food | M7 Where golden foods drop (per-world drop sources, chests, Golden Peanut craft) | missing | no | no |  | M (per-world listing), H (numbers) | L |
| 1030 | AW | food | M8 Beanstalk (W6 Jade) stacks and achievements 380/383 | toolbox-only | no | no |  | H | M |
| 1031 | AW | friend-bonuses | M1 Entry storage (stat,level,name list; order = slot order) | toolbox-only | no | no |  | H | M |
| 1032 | AW | friend-bonuses | M2 Slot count (2 base + Spearfish + 2x Mr Pig + Event Shop 22, round, cap 20) | toolbox-only | no | no |  | H | M |
| 1033 | AW | friend-bonuses | M3 Multiplier (1 + Mr Pig bonus + 0.25 if Spearfish Pet Mart+; max 2.75x) | toolbox-only | no | no |  | H | M |
| 1034 | AW | friend-bonuses | M4/M5 Per-entry value and level scaling s(L) | toolbox-only | no | no |  | H | M |
| 1035 | AW | friend-bonuses | M6 Result shape: one value per stat, later duplicate overwrites earlier | toolbox-only | no | no |  | L | M |
| 1036 | AW | friend-bonuses | M7 Consumers (Damage, Class EXP, Skill Efficiency, Drop Rate, Skill EXP (no consumer), Coins... | toolbox-only | partial | no |  | H | M |
| 1037 | AW | friend-bonuses | M8/M13 Companion gates: Mr Pig #30 and Spearfish #44 (incl. Pet Bonus Token / simulated) | toolbox-only | no | no |  | H | M |
| 1038 | AW | friend-bonuses | M9 Event Shop item 22 Friendly Slot (+1 slot, cost 12, one-time) | toolbox-only | no | no |  | H | M |
| 1039 | AW | friend-bonuses | M10 Unlock gates | adapter | no | no |  | M | S |
| 1040 | AW | friend-bonuses | M11 Achievements 'Here Friend!' and 'Best Friend Forever!' | missing | no | no |  | H | L |
| 1041 | AW | friend-bonuses | M12 Offered-set rotation (server-driven: Extra Kills offered until 2026-10-12, More Coins... | missing | no | no |  | M | L |
| 1042 | AW | gem-shop | Gem balance | adapter | partial | partial |  | H | M* |
| 1043 | AW | gem-shop | Purchase counter and price formula (every row) | adapter | no | no |  | H | M* |
| 1044 | AW | gem-shop | Daily restock (counters reset each day: 13, 47-50, 54, 127, 128, 132, 136, 138, 140, 150, 151) | adapter | no | no |  | H | M* |
| 1045 | AW | gem-shop | Weekly restock (73, 74, 76, 121, 122, 134) and Subclass Swap migrations (75) | adapter | no | no |  | H | M* |
| 1046 | AW | gem-shop | Limited Specials (slots 87-94, rotating; 1-gem freebies recur) | adapter | no | no |  | M | M* |
| 1047 | AW | gem-shop | Inventory & storage: Backpack (55), Storage Chest (56), More Storage (109), Carry Capacity (58), Food Slot (59 | adapter | partial | no |  | M | M* |
| 1048 | AW | gem-shop | Daily Teleports (71): +13N per day, bank cap 100+160N | toolbox-only | no | no |  | M | M* |
| 1049 | AW | gem-shop | Daily Minigame Plays (72): 15 + 4N plays | adapter | yes | partial |  | M | M* |
| 1050 | AW | gem-shop | Talent / Star resets (73, 74), Pandoras Box (76), Subclass Swap (75), Class Redo (78) | adapter | no | partial |  | H | M* |
| 1051 | AW | gem-shop | Weekly Dungeon Boosters (84) | adapter | no | no |  | M | M* |
| 1052 | AW | gem-shop | Time Candy (47-50) and Cosmic Candy (54); mean AFK hours per gem | adapter | no | no |  | M | M* |
| 1053 | AW | gem-shop | Gacha and consumables: card packs, cardifier, arcade balls, keychains, obol stacks | adapter | no | no |  | H | M* |
| 1054 | AW | gem-shop | W1-2 Bonuses: Infinity Hammer (103), Brimstone Forge Slot (104), Ivory Bubble Cauldrons (105), Bleach Liquid C | adapter | partial | partial |  | H | M* |
| 1055 | AW | gem-shop | W3 Bonuses: Crystal 3D Printer (111), More Sample Spaces (112), Burning Bad Books (113), Prayer Slots (114), Z | adapter | partial | partial |  | H | M* |
| 1056 | AW | gem-shop | W4 Bonuses: Royal Egg Cap (119), Richelin Kitchen (120), Console Chip (121, weekly), Mainframe Jewel (122, wee | adapter | no | no |  | H | M* |
| 1057 | AW | gem-shop | Armor Smithy perma-unlock gate (ServerGemsReceived + 1500*bun_c >= 2000, or 30 days) | adapter | yes | partial |  | H | M* |
| 1058 | AW | gem-shop | Real-money gems and bundles (ServerGems, ServerGemsReceived, GemsPacksPurchased, bundles) | toolbox-only | no | no |  | H | M* |
| 1059 | AW | gem-shop | Past Limited Specials and non-shop gem sinks | missing | no | no |  | M | M* |
| 1060 | AW | gem-shop | Free gem sources: Pet Mart daily, Spiketrap, Liquid Shop gem, quests, task unlocks, achievements, social links | adapter | yes | partial |  | H | M* |
| 1061 | AW | gem-shop | Buy order / Spend Plan (Hammer vs Card Slots vs Printer; cauldrons; W3/W4 order) | adapter | partial | partial |  | L | M* |
| 1062 | AW | guild | Guild membership and unlock state | adapter | partial | no |  | M | M* |
| 1063 | AW | guild | Guild level and member cap | toolbox-only | no | no |  | H | M* |
| 1064 | AW | guild | Total GP accounting and unspent GP | toolbox-only | no | no |  | H | M* |
| 1065 | AW | guild | Guild bonus levels, values and costs (17 live bonuses) | toolbox-only | no | no |  | H | M* |
| 1066 | AW | guild | Bonus effects into other systems (Gold Charm, Star Dazzle, Rucksack, Multi Tool, Skilley Skillet, Coin Superch | toolbox-only | partial | no |  | H | M* |
| 1067 | AW | guild | Daily GP login grant and guild bribes | adapter | partial | partial |  | L | M* |
| 1068 | AW | guild | Daily guild tasks (5 per day, 10 GP) | adapter | partial | partial |  | H | M* |
| 1069 | AW | guild | Weekly guild tasks (4 per week, 30 GP) | adapter | partial | partial |  | H | M* |
| 1070 | AW | guild | Small-guild GP multiplier | toolbox-only | no | no |  | L | M* |
| 1071 | AW | guild | Claiming tasks (claimed flag, auto-claim) | missing | no | no |  | M | M* |
| 1072 | AW | guild | Members, Wanted Bonus and rank | toolbox-only | no | no |  | L | M* |
| 1073 | AW | guild | Weekly Guild Giftboxes and Guild Gifts bonus | toolbox-only | no | no |  | L | M* |
| 1074 | AW | guild | Weekly GP contest and guild achievements | missing | no | no |  | L | M* |
| 1075 | AW | merit-tasks | Task Board unlock per world (W1 Gary at level 14; W2 Desert_Davey2; W3 Iceland_Irwin1; W4 Nebula_Neddy1) | adapter | no | no |  | M | L* |
| 1076 | AW | merit-tasks | Ranked task tiers and claiming (8 tasks x 10 tiers per world, manual tap per tier) | toolbox-only | no | no |  | H | L* |
| 1077 | AW | merit-tasks | Reset-on-claim tasks (12 in W1-W4: Nakedknuckle, Pack Mule, Stamp Coolection, Such Rock, Maximum Efficiency, N | toolbox-only | no | no |  | M | L* |
| 1078 | AW | merit-tasks | Boss-feat tasks (Such Rock, Twilight Tombstone, Chill Out Big Boy!, Begone Troll!) and the merit recipe gate | toolbox-only | no | partial |  | M | L* |
| 1079 | AW | merit-tasks | Achievement tasks (slot 7: Achievement Hunter/Cowboy/Inuit/Astronaut) | toolbox-only | no | no |  | L | L* |
| 1080 | AW | merit-tasks | Per-tier non-merit bonus: Come 'ere Critters! (+2% shiny chance per tier) | toolbox-only | no | no |  | H | L* |
| 1081 | AW | merit-tasks | Daily tasks (slot 8; W1-W4 pools; reset at daily reset; base points only) | adapter | yes | partial |  | H | L* |
| 1082 | AW | merit-tasks | Task points and unlock points (cumulative Tasks[4][0]; f(n)=1+9n+2max(0,n-5)+7max(0,n-12)+11max(0,n-20)) | adapter | partial | partial |  | H | L* |
| 1083 | AW | merit-tasks | Unlocks tab columns and gating (7 columns 16/28/28/32/8/8/8; columns 2-7 open at 7/22/60/90/106/119 bought AND | adapter | no | partial |  | M | L* |
| 1084 | AW | merit-tasks | Unlock row contents (128 rows: class weapons/hats, rods/nets, pouches, tools, Time Candy, gems) | toolbox-only | no | no |  | H | L* |
| 1085 | AW | merit-tasks | Merits earned and unspent per world | adapter | partial | partial |  | H | L* |
| 1086 | AW | merit-tasks | Merit Shop rows and effects W1-W4 (29 priced rows; flat cost per level; hidden placeholder row 7 except W2 Arc | adapter | no | partial |  | H | L* |
| 1087 | AW | merit-tasks | Merit spending order per world | adapter | partial | partial |  | L | L* |
| 1088 | AW | merit-tasks | Star-talent cap rows (Goblet of Hemoglobin W1, Convert Better Darnit! W2, Telekinetic Storage W3, Spice Spilla | toolbox-only | no | no |  | M | L* |
| 1089 | AW | merit-tasks | World-scoped respawn rows and the W2 AFK-gains row (first N characters) | adapter | no | partial |  | H | L* |
| 1090 | AW | merit-tasks | Drop-unlock rows: W1 Boss keys (4%/lv), W2 World-boss gems (lv/12), W2 Obols (lv 1 required) | adapter | no | partial |  | M | L* |
| 1091 | AW | merit-tasks | Feeds into other systems: Tome (total tiers, W1 AFK-hours counter), Upgrade Vault 'Vault Tasks' (bought unlock | toolbox-only | no | no |  | H | L* |
| 1092 | AW | merit-tasks | Recipe-unlock crafting costs per level | missing | no | no |  | L | L* |
| 1093 | AW | merit-tasks | Meritocracy (vote ballot) is not merits | adapter | yes | partial |  | H | L* |
| 1094 | AW | monster-afk | Maps, monsters and AFK types | adapter | yes | yes |  | H | L* |
| 1095 | AW | monster-afk | Portal doors and per-character kill counters | adapter | yes | yes |  | H | L* |
| 1096 | AW | monster-afk | Kill-per-kill (kills one death counts for, toward portals and Death Note) | toolbox-only | no | no |  | H | L* |
| 1097 | AW | monster-afk | Overkill tiers and multikill | toolbox-only | no | no |  | H | L* |
| 1098 | AW | monster-afk | AFK Target set or not | adapter | yes | yes |  | H | L* |
| 1099 | AW | monster-afk | Fighting AFK gain rate and its sources | toolbox-only | no | partial |  | H | L* |
| 1100 | AW | monster-afk | Skilling AFK gain rate (cross-reference) | toolbox-only | no | no |  | H | L* |
| 1101 | AW | monster-afk | AFK time, Unending Energy 10 h cap, time candies, double claims | adapter | partial | no |  | M | L* |
| 1102 | AW | monster-afk | Kills per hour (spawn-limited vs kill-speed-limited) | adapter | partial | partial |  | H | L* |
| 1103 | AW | monster-afk | Survivability, food and deaths | adapter | yes | partial |  | H | L* |
| 1104 | AW | monster-afk | Accuracy and hit chance | adapter | partial | partial |  | H | L* |
| 1105 | AW | monster-afk | Mob respawn rate | toolbox-only | no | partial |  | M | L* |
| 1106 | AW | monster-afk | Drop rate | adapter | no | no |  | M | L* |
| 1107 | AW | monster-afk | Card drops on monster maps | adapter | yes | yes |  | H | L* |
| 1108 | AW | monster-afk | Crystal mobs and statues | toolbox-only | no | partial |  | H | L* |
| 1109 | AW | monster-afk | Shrines on maps | adapter | yes | no |  | M | L* |
| 1110 | AW | monster-afk | Prayers and their AFK curses (Zerg Rushogen, Ruck Sack, Unending Energy, monster-HP curses) | adapter | yes | no |  | H | L* |
| 1111 | AW | monster-afk | Boss arenas and keys (W1-W4 gates) | adapter | yes | yes |  | H | L* |
| 1112 | AW | monster-afk | Monster stat curve and the best EXP map | adapter | partial | partial |  | M | L* |
| 1113 | AW | monster-afk | AFK kill talents and attack speed | toolbox-only | partial | partial |  | H | L* |
| 1114 | AW | monster-afk | Skilling map doors (skill-level gated) | adapter | yes | yes |  | H | L* |
| 1115 | AW | monster-afk | Death Note kill ledger (kills summed over characters) | adapter | partial | yes |  | H | L* |
| 1116 | AW | monster-afk | Card AFK bonuses and star tiers (Chaotic Amarok, Amarok, Boop, Biggie Hours) | adapter | partial | partial |  | M | L* |
| 1117 | AW | monster-afk | Compass/Tesseract bought doors (unlockedPortals) | toolbox-only | no | no |  | H | L* |
| 1118 | AW | monster-afk | Multi-character door lock, Voidwalker speedrun, special respawn groups, Eclipse skulls (W5+) | toolbox-only | no | no |  | H | L* |
| 1119 | AW | monster-afk | Double AFK claim (Biggie Hours), Gum Drop candy chance, Double Exp Scheme bribe | missing | no | no |  | L | L* |
| 1120 | AW | monster-afk | Golden food on the AFK character (equip effect, multiplier, Beanstalk) | adapter | no | no |  | M | L* |
| 1121 | AW | monster-afk | Stat allocation: main stat and the accuracy stat per class | toolbox-only | no | no |  | M | L* |
| 1122 | AW | monster-afk | Giant mobs (spawn chance, Crescent Shrine, giant vial, Glitterbug curse) | toolbox-only | no | no |  | M | L* |
| 1123 | AW | monster-afk | Statue double drop (from crystal mobs) | toolbox-only | no | no |  | H | L* |
| 1124 | AW | monster-afk | Barbarian Zow Chow map list (not the portal list) | toolbox-only | no | no |  | H | L* |
| 1125 | AW | monster-afk | Compass medallions per AFK target (W6+) | toolbox-only | no | no |  | M | L* |
| 1126 | AW | pets | Pet ownership and activation (account-wide bonus once owned) | adapter | partial | partial |  | H | L* |
| 1127 | AW | pets | Pet catalogue (178 rows: 167 named non-champion pets, 9 Champions, 2 placeholders; effect, bonus, Pet+ bonus,  | toolbox-only | no | no |  | H | L* |
| 1128 | AW | pets | Per-pet bonus effects and the systems they feed | toolbox-only | no | no |  | H | L* |
| 1129 | AW | pets | Pet+ (Pet Mart+ upgrade level, CompLV2) | toolbox-only | no | no |  | H | L* |
| 1130 | AW | pets | Pet Bonus Token (max 2; base bonus of a non-owned pet; 2.3.540 wipe rule) | toolbox-only | no | no |  | H | L* |
| 1131 | AW | pets | Free daily pull | adapter | yes | partial |  | H | L* |
| 1132 | AW | pets | Treat gacha (wiki shows 4 tiers 70-250 crystals; a 5th, Jawbreaker, is Disputed; pity, odds) | missing | no | no |  | L | L* |
| 1133 | AW | pets | Pet Crystals and recycling duplicates | toolbox-only | no | no |  | M | L* |
| 1134 | AW | pets | Pet Mart daily offers (5 pets, list + discounted price) | toolbox-only | no | no |  | M | L* |
| 1135 | AW | pets | Pet Mart+ (upgrade offers; needs every base offer owned and 50 pets) | toolbox-only | no | no |  | L | L* |
| 1136 | AW | pets | Pet Mart free gems | adapter | yes | partial |  | M | L* |
| 1137 | AW | pets | Tournament registration | adapter | yes | partial |  | H | L* |
| 1138 | AW | pets | Tournament divisions, points and bracket | toolbox-only | no | no |  | M | L* |
| 1139 | AW | pets | Tournament power and duels | toolbox-only | no | no |  | M | L* |
| 1140 | AW | pets | Raids (daily PvE, raid registration; team strength = summed tourPower per wiki) | toolbox-only | no | no |  | L | L* |
| 1141 | AW | pets | Pet storage cap | toolbox-only | no | no |  | H | L* |
| 1142 | AW | pets | Follower pet (cosmetic) | toolbox-only | no | no |  | H | L* |
| 1143 | AW | pets | Spend Plan (which pet to buy with crystals, by stage) | toolbox-only | no | no |  | M | L* |
| 1144 | AW | pets | King Doot Divinity gate | toolbox-only | no | no |  | H | L* |
| 1145 | AW | pets | Paid bundles and gem shop pets | missing | no | no |  | L | L* |
| 1146 | AW | pets | Friend Bonus slots and multiplier (Mr Pig idx 30, Spearfish idx 44, event-shop bonus 22) | toolbox-only | no | no |  | H | L* |
| 1147 | AW | pets | Champions and no-bonus pets (tourPower 10, token refunds) | toolbox-only | no | no |  | H | L* |
| 1148 | AW | pets | W4 Breeding pets (cross-link only) | adapter | yes | partial |  | H | L* |
| 1149 | AW | skills | Skill levels and EXP curve (per character, 9 W1-W3 skills) | adapter | yes | partial |  | H | L* |
| 1150 | AW | skills | Skill Mastery (account total per skill, ranks 0-7 at 150/200/300/400/500/750/1000, gated by Rift 15) | toolbox-only | no | no |  | H | L* |
| 1151 | AW | skills | Skill efficiency (Mining, Choppin, Fishing, Catching) | adapter | no | no |  | H | L* |
| 1152 | AW | skills | Harvest chance vs node Defence (0 below 0.25x, 100% at ~10x) | missing | no | no |  | H | L* |
| 1153 | AW | skills | Items per hit (multi-drop) and All-skill Prowess | missing | no | no |  | H | L* |
| 1154 | AW | skills | Node ladders: ores, trees, bugs (Defence, base EXP, respawn) | toolbox-only | no | no |  | H | L* |
| 1155 | AW | skills | Better skill EXP per hit on an opened node (EXP x chance) | missing | no | no |  | M | L* |
| 1156 | AW | skills | Mine doors and fishing portals by skill level | adapter | yes | partial |  | H | L* |
| 1157 | AW | skills | Tool chains (pickaxe, hatchet, rod, net) and their equip levels | adapter | yes | partial |  | H | L* |
| 1158 | AW | skills | AFK gain rate for skilling (50% base + skill pool + all-AFK pool) | toolbox-only | no | partial |  | M | L* |
| 1159 | AW | skills | Skill EXP multiplier | toolbox-only | no | no |  | M | L* |
| 1160 | AW | skills | Fishing toolkit (bait + line depth weights, EXP/Speed/POW) | toolbox-only | no | no |  | M | L* |
| 1161 | AW | skills | Fishing pools and depth gates (Small/Medium/Large/Equinox; min efficiency per depth) | missing | no | no |  | H | L* |
| 1162 | AW | skills | Fishing hourly rate has no harvest-chance factor; deeper pools win on EXP | missing | no | no |  | M | L* |
| 1163 | AW | skills | Skill specialty class line (Warrior mining, Mage choppin, Barbarian fishing, Bowman catching, ...) | adapter | yes | partial |  | M | L* |
| 1164 | AW | skills | Skill minigames, highscores and Bobbin' Bobbers (fishing power from highscore) | adapter | yes | partial |  | M | L* |
| 1165 | AW | skills | Storage-scaled talents (Copper Ore, Oak Logs, Grass Leaves kept in storage) | toolbox-only | no | no |  | M | L* |
| 1166 | AW | skills | Smithy sets for skills (Copper +60% Mining/Choppin, Platinum +60% Fishing/Catching, Void AFK, Chizoar EXP) | adapter | yes | partial |  | M | L* |
| 1167 | AW | skills | Skill-gated quests (Glumlee Mining 11, Krunk Mining 20, Cactolyte Mining 32 / Smithing 35 / Choppin 33) | adapter | partial | partial |  | M | L* |
| 1168 | AW | skills | Smithing production (anvil products, points, Acme Anvil) | adapter | yes | partial |  | H | L* |
| 1169 | AW | skills | Multi-Ore chance and its cap | missing | no | no |  | L | L* |
| 1170 | AW | skills | Hourly harvest rate (hits per hour by skill speed) | missing | no | no |  | H | L* |
| 1171 | AW | skills | Skill Mastery card passive (rank > 2: every owned skill card counts) | toolbox-only | no | no |  | H | L* |
| 1172 | AW | skills | Catching nests (Butterfly, Sentient Cereal) attacked first, reset every 24h | missing | no | no |  | M | L* |
| 1173 | AW | skills | Other skill level gates (anvil tabs, cogs, totems, liquids, traps) | adapter | yes | partial |  | H | L* |
| 1174 | AW | stats | Base stats STR/AGI/WIS/LUK per character | toolbox-only | no | no |  | H (data); M (snapshot meaning) | M |
| 1175 | AW | stats | Stat points: per-level grant, unspent points, respec | missing | no | no |  | L | L |
| 1176 | AW | stats | Main stat and accuracy stat per class | toolbox-only | no | no |  | H | M |
| 1177 | AW | stats | Stat curves (getStatCurveValue and per-use variants: drop rate, class EXP, speed, crit, brew... | toolbox-only | no | no |  | H (formula); M (0.255 vs 0.297 constants | M |
| 1178 | AW | stats | Base damage: Weapon Power, main-stat damage, the 150 cap, flat adds, base softcaps 4k/15k | toolbox-only | no | no |  | H | M |
| 1179 | AW | stats | Per-X damage and % damage groups with softcap chains | toolbox-only | no | no |  | H | M |
| 1180 | AW | stats | Max hit, min hit and mastery (35% -> 80% cap) | toolbox-only | no | no |  | H | M |
| 1181 | AW | stats | Accuracy, hit chance and accuracy needed for 100% | adapter | partial | partial |  | H (rule); M (advice) | S |
| 1182 | AW | stats | Crit chance and crit damage | toolbox-only | no | no |  | H | M |
| 1183 | AW | stats | Max HP / Max MP | adapter | no | yes |  | H | S |
| 1184 | AW | stats | Defence, monster damage and survivability | adapter | yes | yes |  | H | S |
| 1185 | AW | stats | Movement speed (175% / 200% bands, Tiptoe) | toolbox-only | no | no |  | M | M |
| 1186 | AW | stats | Kills per hour, spawn cap, AFK gains, respawn, kill-per-kill | adapter | yes | yes |  | H (rule); L (spawnCapped heuristic) | S |
| 1187 | AW | stats | Stat-step bubbles (Power Trione per 250 main stat, cash bubbles per 250) | toolbox-only | no | no |  | H (rule); L (as advice) | M |
| 1188 | AW | stats | Stat allocation by stage (main stat first; accuracy stat only to reach 100% hit) | toolbox-only | no | no |  | M | M |
| 1189 | AW | storage | Storage Chest slot total and free slots | adapter | no | partial |  | H | S |
| 1190 | AW | storage | Storage chest items (InvStorageUsed) and quest chests | toolbox-only | no | no |  | H | M |
| 1191 | AW | storage | Chest_Space tower (+2 slots per level) | adapter | partial | no |  | H | S |
| 1192 | AW | storage | Gem shop storage and inventory (idx 55 Backpack, 56 Storage Chest, 58 Carry, 109 More Storage) | adapter | no | partial |  | M | S |
| 1193 | AW | storage | Upgrade Vault Storage Slots (33) and Carry Capacity (11) | toolbox-only | partial | partial |  | H | S |
| 1194 | AW | storage | Bundles and Event shop storage | toolbox-only | no | no |  | H | S |
| 1195 | AW | storage | Inventory slots and bags per character | adapter | no | partial |  | H | M |
| 1196 | AW | storage | Carry pouches (MaxCarryCap per class) | toolbox-only | no | no |  | H | M |
| 1197 | AW | storage | Per-slot carry cap (getItemCapacity) and multipliers | adapter | no | partial |  | H | M |
| 1198 | AW | storage | Prayers: Zerg Rushogen carry curse, Ruck Sack | adapter | partial | partial |  | H | S |
| 1199 | AW | storage | Telekinetic Storage and Extra Bags talents, star signs, bribe 23, guild Rucksack | toolbox-only | partial | partial |  | M | S |
| 1200 | AW | storage | Greenstacks | toolbox-only | no | no |  | H | S |
| 1201 | AW | storage | Exact-stack achievements | toolbox-only | no | no |  | H | S |
| 1202 | AW | storage | Skiller stack at carry cap with full bag | adapter | yes | yes |  | H | S |
| 1203 | AW | talents | Class tabs and talent levels (bought vs max) | adapter | yes | partial |  | H | L* |
| 1204 | AW | talents | Talent points per tab (exact budget, ADR 0010) | adapter | yes | partial |  | H | L* |
| 1205 | AW | talents | Point sources (every bonus term) | toolbox-only | no | no |  | H | L* |
| 1206 | AW | talents | Star tab points and star talents per preset | adapter | yes | partial |  | H | L* |
| 1207 | AW | talents | Star talent books (unlock state, sources) | adapter | partial | partial |  | M | L* |
| 1208 | AW | talents | Growth curves (value of a level, decay half-value) | toolbox-only | partial | no |  | H | L* |
| 1209 | AW | talents | Breakpoint talents (intervalAdd: pay only at multiples) | adapter | no | no |  | H | L* |
| 1210 | AW | talents | Max levels and their raises (stat talents, bottles, books, merits) | adapter | partial | partial |  | M | L* |
| 1211 | AW | talents | Added levels (AllTalentLV) and bans | toolbox-only | no | no |  | H | L* |
| 1212 | AW | talents | Symbols of Beyond (tab 4, +1 level to all talents above Lv 1) | adapter | no | no |  | M | L* |
| 1213 | AW | talents | Super talents (class Lv 400+, W7) | toolbox-only | no | no |  | H | L* |
| 1214 | AW | talents | Presets (two per character from Lv 15, free swap) | adapter | yes | partial |  | M | L* |
| 1215 | AW | talents | Attack bar and AFK damage factor | adapter | yes | partial |  | H | L* |
| 1216 | AW | talents | Cooldown and mana on AFK sustainability | toolbox-only | no | no |  | L | L* |
| 1217 | AW | talents | Idle fighting talent and AFK gain talents | adapter | partial | partial |  | H | L* |
| 1218 | AW | talents | Stat talents, accuracy and hit chance | toolbox-only | partial | partial |  | M | L* |
| 1219 | AW | talents | Active-buff talents (BuffsActive) | toolbox-only | no | no |  | H | L* |
| 1220 | AW | talents | Talent Point Reset Potions and Fragments | adapter | partial | partial |  | M | L* |
| 1221 | AW | talents | Free reset potions from quests | toolbox-only | no | no |  | H | L* |
| 1222 | AW | talents | Star Talent Reset Potion | missing | no | no |  | H | L* |
| 1223 | AW | talents | Slight Do-Over (Upgrade Vault #51, daily single-talent refunds) | adapter | partial | no |  | M | L* |
| 1224 | AW | talents | Sub Class Swap Token / Elite swap / Complete Class Redo | missing | no | no |  | M | L* |
| 1225 | AW | talents | Account-wide talent lookups (best of account, Maestro hands, Enhancement Eclipse) | toolbox-only | no | no |  | H | L* |
| 1226 | AW | talents | Library books (max above 100) | adapter | partial | partial |  | H | L* |
| 1227 | AW | talents | Elite tab 4 and master tab 5 | adapter | partial | no |  | L | L* |
| 1228 | AW | town-shops | Daily stock per item (remaining today) | adapter | no | partial |  | H | S |
| 1229 | AW | town-shops | Shop catalogue: what each town sells | toolbox-only | partial | no |  | H | M |
| 1230 | AW | town-shops | Buy price (4 x sellPrice) | toolbox-only | no | no |  | H | M |
| 1231 | AW | town-shops | Restock clock (daily reset) | adapter | yes | no |  | H | S |
| 1232 | AW | town-shops | Stock multipliers: Overstock bribe + Vendor Stamp (+ Sneaky Stealing) | adapter | no | partial |  | H | S |
| 1233 | AW | town-shops | Max stock today / bought today | missing | no | no |  | H | L |
| 1234 | AW | town-shops | Shop-only stamps (Target, Shield, Mana, Vitality, Vendor, Matty Bag, Clover) | adapter | yes | yes |  | M | S |
| 1235 | AW | town-shops | Talent Point Reset Fragments (daily) | adapter | partial | yes |  | M | S |
| 1236 | AW | town-shops | Anvil Reset Whetstone (Frostbite, 1/day, 1.2M) | adapter | yes | yes |  | H | S |
| 1237 | AW | town-shops | Inventory bags (Bummo, Capitalist Case, Wealthy Wallet, Prosperous Pouch), per character | toolbox-only | no | no |  | L | M |
| 1238 | AW | town-shops | Storage chests sold in towns | toolbox-only | no | no |  | L | M |
| 1239 | AW | town-shops | Upgrade stones I-III (daily capped) | adapter | no | no |  | L | S |
| 1240 | AW | town-shops | Quest and utility items sold in shops (Obol Altar item, Quest19/37/57/67/86/87/104... | adapter | partial | partial |  | M | S |
| 1241 | AW | town-shops | Positional pairing and list drift | adapter | n/a | n/a |  | H | S |
| 1242 | AW | trophies-nametags | Item pool and found (slab) counts | toolbox-only | no | no |  | H | M |
| 1243 | AW | trophies-nametags | Worn trophy / nametag slots (pre-Gallery) | toolbox-only | no | no |  | H | M |
| 1244 | AW | trophies-nametags | Worn premium hat slot and the gate switch | toolbox-only | no | no |  | H | M |
| 1245 | AW | trophies-nametags | Item stat lines (base stats + UQ1/UQ2) | toolbox-only | no | no |  | H | M |
| 1246 | AW | trophies-nametags | Trophy and nametag sources (quests, bundles, gem shop, Trash Island, Tome) | toolbox-only | no | no |  | M | M |
| 1247 | AW | trophies-nametags | Duplicate-trophy achievements (Two-Time Savior, Two Desserts) | toolbox-only | no | no |  | H | M |
| 1248 | AW | trophies-nametags | Hat Rack deposit and multiplier | toolbox-only | no | no |  | H | M |
| 1249 | AW | trophies-nametags | Hat Rack gate (map 50, YumYum Grotto) per character | toolbox-only | no | no |  | H | M |
| 1250 | AW | trophies-nametags | Gallery: podiums, tiers, multiplier, nametag stacks (W7) | toolbox-only | no | no |  | H | M |
| 1251 | AW | trophies-nametags | Silkrode Motherboard (lab chip 16) | toolbox-only | no | no |  | M | M |
| 1252 | AW | trophies-nametags | Held duplicates (sell-protection) | toolbox-only | no | no |  | H | M |
| 1253 | AW | trophies-nametags | Tome rows (Trophies/Nametags/Premium Hats Found) and monthly Tome nametags | toolbox-only | no | no |  | H | M |
| 1254 | AW | trophies-nametags | Gem shop nametags and hats (rotating) | toolbox-only | no | no |  | L | M |
| 1255 | AW | worlds | World-reached proxy (GenINFO[58] vs gatekeeper NPC dialogue) | adapter | yes | yes |  | M | S |
| 1256 | CL | class-barbarian | Class chain and talent tabs (Warrior -> Barbarian -> Blood Berserker) | adapter | yes | yes |  | H | S (polish) |
| 1257 | CL | class-barbarian | Promotion quests (Promotheus, Speccius, Eliteus) and class swap | adapter | yes | yes |  | H | S (polish) |
| 1258 | CL | class-barbarian | Main stat STR and accuracy from WIS (hit chance) | adapter | partial | no |  | H | S |
| 1259 | CL | class-barbarian | Talent points per tab (incl. Warrior class bubble and Back To Basics) | adapter | yes | yes |  | H | S (polish) |
| 1260 | CL | class-barbarian | Max levels, Talent Book Library and added levels | adapter | partial | no |  | H | S |
| 1261 | CL | class-barbarian | Presets, attack bar and cooldowns | adapter | yes | yes |  | H | S (polish) |
| 1262 | CL | class-barbarian | Family bonuses of the line (Warrior STR, Barbarian Weapon Power, BB Total Damage) | toolbox-only | no | no |  | H | M |
| 1263 | CL | class-barbarian | Rage Basics damage/defence talents (Gilded Sword, Sharpened Axe, Meat Shank, CritiKill, stat t… | adapter | yes | yes |  | H | S (polish) |
| 1264 | CL | class-barbarian | AFK and efficiency talents (Idle Brawling, Idle Skilling, Brute Efficiency) | adapter | yes | yes |  | M | S (polish) |
| 1265 | CL | class-barbarian | Warrior tab attacks and passives | adapter | yes | yes |  | H | S (polish) |
| 1266 | CL | class-barbarian | Warrior mining kit (Big Pick, Copper Collector, Motherlode, Tool Proficiency, Haungry For Gold… | adapter | yes | yes |  | H | S (polish) |
| 1267 | CL | class-barbarian | Barbarian attacks and No Pain No Gain | adapter | yes | partial |  | M | S (polish) |
| 1268 | CL | class-barbarian | Apocalypse Zow and the Zow count (maps at 100k kills) | toolbox-only | no | partial |  | H | M |
| 1269 | CL | class-barbarian | Barbarian support talents (Fistful of Obol, Strongest Statues, Str Summore, Beefy Bottles, Bac… | adapter | yes | yes |  | M | S (polish) |
| 1270 | CL | class-barbarian | Barbarian fishing kit (Worming Undercover, Bobbin' Bobbers cap, All Fish Diet, Catching Some Z… | adapter | yes | yes |  | H | S (polish) |
| 1271 | CL | class-barbarian | Blood Berserker attacks and damage talents (tab 4) | adapter | partial | no |  | M | S |
| 1272 | CL | class-barbarian | Blood Berserker cooking and family talents (Taste Test, Apocalypse Chow, Waiting To Cool, Over… | toolbox-only | no | no |  | H | M |
| 1273 | CL | class-barbarian | Squire vs Barbarian subclass choice | adapter | yes | yes |  | M | S (polish) |
| 1274 | CL | class-barbarian | Death Bringer (W5+, tab 5) and Apocalypse Wow | toolbox-only | no | no |  | H | defer (W5+) |
| 1275 | AW | class-bowman | Speedna step ladder (Bowman talent 290): steps = floor(min(speed/100 - 1, 10) / 0.15) | toolbox-only | no | partial |  | H | M |
| 1276 | AW | class-bowman | Movement-speed pipeline feeding Speedna (getPlayerSpeedBonus, 175%/200% branches) | toolbox-only | no | no |  | H | M |
| 1277 | AW | class-bowman | Other per-X damage terms next to Speedna (Looty Mc Shooty, Paperwork Great, hole schematic 57... | toolbox-only | no | no |  | H | M |
| 1278 | CL | class-bowman | Class path and promotions (Beginner -> Archer -> Bowman -> Siege Breaker; no master above SB) | adapter | partial | yes |  | H | S |
| 1279 | CL | class-bowman | Talent tabs, ids and levels (tab 1 Calm Basics, 2 Archer, 3 Bowman, 4 Siege Breaker) | adapter | yes | yes |  | H | S (polish) |
| 1280 | CL | class-bowman | Talent point budget per tab (Previous Points +1 tab-2 point/lv, Fast Boi Talent 5+L per tab) | adapter | yes | yes |  | H | S (polish) |
| 1281 | CL | class-bowman | Max levels and cap raises: Featherweight = 100 + min(Velocity Vessels, Archer or Bust level);… | adapter | partial | no |  | M | S |
| 1282 | CL | class-bowman | Calm Basics damage and stat talents (Gilded Sword, Sharpened Axe, Fist of Rage, Quickness Boot… | adapter | yes | yes |  | H | S (polish) |
| 1283 | CL | class-bowman | AFK attack bar factor (each attack: D x (1 + min(1, L/(L+100)))); Strafe and Pirate Flag do no… | adapter | yes | yes |  | H | S (polish) |
| 1284 | CL | class-bowman | Active buffs: Strafe (move speed) and Extendo Rangeo (accuracy) count only while active | toolbox-only | no | no |  | M | M |
| 1285 | CL | class-bowman | Movement speed (food, Featherweight, stamps, active Strafe, statue, star sign, gear, cards, AG… | toolbox-only | no | no |  | H | M |
| 1286 | CL | class-bowman | Speedna: + talent% damage per 15% move speed above 100% (floor, capped at +1000%) | toolbox-only | no | yes |  | H | M |
| 1287 | CL | class-bowman | Veins of the Infernal: x(1 + talent% x min(100, Smithing)/10 /100) | adapter | partial | yes |  | H | S |
| 1288 | CL | class-bowman | Weapon power and damage (High Polymer Limbs, Sharpened Axe, Gilded Sword, Have Another!) | toolbox-only | partial | yes |  | H | M |
| 1289 | CL | class-bowman | Accuracy (STR is the accuracy stat) and Extendo Rangeo accuracy | toolbox-only | partial | yes |  | M | M |
| 1290 | CL | class-bowman | Idle Shooting and the AFK fighting gain | adapter | yes | yes |  | H | S (polish) |
| 1291 | CL | class-bowman | Bowman economy talents: Shoeful of Obol, Shwifty Statues (Speed/Anvil/Ol' Reliable statues), A… | adapter | yes | yes |  | H | S (polish) |
| 1292 | CL | class-bowman | Catching kit: Teleki'net'ic Logs (Oak Logs, Helium atom), Briar Patch Runner, Bug Enthusiast,… | adapter | yes | yes |  | M | S (polish) |
| 1293 | CL | class-bowman | Archer-tab skilling and anvil talents (Acme Anvil, Focused Soul, Broken Time; Smeltin' Erryday… | adapter | yes | yes |  | M | S (polish) |
| 1294 | CL | class-bowman | Presets: Damage preset for AFK fighting, Catching preset for skilling | adapter | yes | yes |  | H | S (polish) |
| 1295 | CL | class-bowman | Star talents used by the line (Will of the Eldest, Tick Tock, Attacks on Simmer, Tip Toe Quick… | adapter | yes | yes |  | M | S (polish) |
| 1296 | CL | class-bowman | Class bubbles: Archer or Bust (multiplies the other green bubbles for AGI characters), Fast Bo… | adapter | yes | yes |  | H | S (polish) |
| 1297 | CL | class-bowman | Family bonuses: Archer +AGI, Bowman +% active-fighting EXP (no Toolbox consumer), Siege Breake… | toolbox-only | no | no |  | H | defer (W5+) |
| 1298 | CL | class-bowman | Siege Breaker attacks: Cannonball, Suppressing Fire, Firebomb (enter the AFK bar with D/K) | adapter | yes | yes |  | H | S (polish) |
| 1299 | CL | class-bowman | Pirate Flag buff and Plunderous mobs; Plunder Ye Deceased | toolbox-only | no | no |  | M | M |
| 1300 | CL | class-bowman | Account-wide Siege Breaker talents: Archlord of the Pirates (EXP and drop x(1 + talent x lavaL… | toolbox-only | no | no |  | M | M |
| 1301 | CL | class-bowman | Siege Breaker personal talents: Stacked Skulls, Crew Rowing Strength, Skill Ambidexterity, Ada… | adapter | yes | no |  | M | S (polish) |
| 1302 | CL | class-bowman | Symbols of Beyond ~G: +1+floor(L/20) levels to every learned talent; itself banned from added… | toolbox-only | no | no |  | H | M |
| 1303 | CL | class-bowman | Rift gate: Pirate Flag score 75 at Rift 16, 22, 36, 65 | missing | no | no |  | L | defer (W5+) |
| 1304 | CL | class-bowman | Cooldowns and mana; Woah That Was Fast! cooldown divisor | toolbox-only | no | no |  | H | M |
| 1305 | CL | class-bowman | Subclass re-pick | missing | no | no |  | L | S (text only) |
| 1306 | CL | class-hunter | Class tree and promotions (Promotheus, Speccius, Eliteus) | adapter | yes | yes |  | H | S (polish) |
| 1307 | CL | class-hunter | Talent points per tab and two presets | adapter | yes | yes |  | H | S (polish) |
| 1308 | CL | class-hunter | Max levels and added levels (Agi Again, Visibility Vessels, Symbols of Beyond, god/family/etc.) | toolbox-only | partial | no |  | M | M |
| 1309 | CL | class-hunter | Calm Basics tab (Idle Shooting, Gilded Sword, Sharpened Axe, Elusive Efficiency, Featherweight… | adapter | yes | yes |  | H | S (polish) |
| 1310 | CL | class-hunter | Archer tab talents (Piercing Arrow, Kung Fu Kick, High Polymer Limbs, Veins, Have Another!, Ac… | adapter | yes | yes |  | L | S (polish) |
| 1311 | CL | class-hunter | Hunter tab talents (360 Noscope, Bear Trap, Uwu Rawrrr, Stop Right There, Looty Mc Shooty, Eag… | adapter | yes | yes |  | M | S (polish) |
| 1312 | CL | class-hunter | AFK attack-bar maths (K/D per attack, Have Another family) | adapter | yes | yes |  | M | S (polish) |
| 1313 | CL | class-hunter | Hunter-line damage terms (Veins x Smithing level, Looty Mc Shooty x slab, High Polymer Limbs,… | toolbox-only | no | no |  | M | M |
| 1314 | CL | class-hunter | Eagle Eye (collect and re-set every trap) | toolbox-only | no | partial |  | M | M |
| 1315 | CL | class-hunter | Trap placement snapshot: cast Eagle Eye from the trapping preset | adapter | no | no |  | M | S |
| 1316 | CL | class-hunter | Trapping efficiency and EXP terms (Invasive Species, Elusive Efficiency, Shroom Bait, Focused… | toolbox-only | no | partial |  | M | M |
| 1317 | CL | class-hunter | Shiny critters (Reflective Eyesight power per 10 Trapping levels) | toolbox-only | no | no |  | M | M |
| 1318 | CL | class-hunter | Smithing / anvil line (Acme Anvil, Broken Time, Focused Soul) | adapter | partial | yes |  | M | S |
| 1319 | CL | class-hunter | Family bonuses (Archer +AGI, Hunter +% all-skill efficiency from Lv 29, Beast Master +% AFK ga… | toolbox-only | no | no |  | M | M |
| 1320 | CL | class-hunter | Strafe is a movement buff, not an AFK damage talent | adapter | yes | yes |  | L | S (polish) |
| 1321 | CL | class-hunter | Beast Master tab 4 (Ballista, Boar Rush, Whale Wallop, Nacho Party, Have Yet Anotha One, Skill… | adapter | partial | no |  | L | S |
| 1322 | CL | class-hunter | Hunter vs Bowman subclass choice | adapter | partial | partial |  | L | S (text only) |
| 1323 | CL | class-hunter | Wind Walker (W5+, out of scope) | toolbox-only | no | no |  | none | defer (W5+) |
| 1324 | CL | class-journeyman | Beginner line and current class | adapter | yes | partial |  | H | S (polish) |
| 1325 | CL | class-journeyman | Journeyman promotion (Rocklyte quests 1-3) | adapter | no | partial |  | H | S |
| 1326 | CL | class-journeyman | Maestro promotion (Cactolyte quests 1-4) | adapter | no | partial |  | H | S |
| 1327 | CL | class-journeyman | Voidwalker promotion (Nebulyte quests 1-4) | adapter | no | partial |  | H | S |
| 1328 | CL | class-journeyman | Talent tabs and levels (Beginner/Journeyman/Maestro/Voidwalker) | adapter | yes | no |  | H | S (polish) |
| 1329 | CL | class-journeyman | Talent points tabs 1-3 (incl. JMan Was Better) | adapter | yes | partial |  | H | S (polish) |
| 1330 | CL | class-journeyman | Voidwalker tab 4 points and speedrun highscore | adapter | partial | no |  | H | S |
| 1331 | CL | class-journeyman | Class family bonuses | toolbox-only | no | no |  | M | M |
| 1332 | CL | class-journeyman | Star talent points (Star Player, Supernova Player) | adapter | yes | partial |  | H | S (polish) |
| 1333 | CL | class-journeyman | Daily casts: It's Your Birthday!, Printer Go Brrr, Void Trial Rerun | toolbox-only | no | partial |  | H | M |
| 1334 | CL | class-journeyman | Timed buffs: Gimme Gimme, Maestro Transfusion, Breakin' The Bank | toolbox-only | no | no |  | M | M |
| 1335 | CL | class-journeyman | Left Hand of Learning / Right Hand of Action coverage | toolbox-only | no | no |  | H | M |
| 1336 | CL | class-journeyman | Skillage Damage (lowest skill) | adapter | no | no |  | H | S |
| 1337 | CL | class-journeyman | Crystal Countdown stacks | toolbox-only | no | no |  | L | M |
| 1338 | CL | class-journeyman | Curse Of Mr Looty Booty damage trade | adapter | no | no |  | H | S |
| 1339 | CL | class-journeyman | Sleepin' On The Job and AFK talents (Reroll Pls, Cards Galore, Voidwalker family) | adapter | yes | yes |  | M | S (polish) |
| 1340 | CL | class-journeyman | Max-level raisers (Bliss N Chips, Colloquial Containers, Eternal STR/AGI/WIS/LUK) | adapter | partial | no |  | H | S |
| 1341 | CL | class-journeyman | Enhancement Eclipse steps | adapter | no | no |  | H | S |
| 1342 | CL | class-journeyman | Voidwalker account-wide eleven (Power Orb, Eternal stats, Exp Cultivation, Voodoo Statuficiati… | adapter | no | no |  | H | S |
| 1343 | CL | class-journeyman | Speedrun run (boss portals, Bossing Vain, Void Radius multikill) | toolbox-only | no | no |  | H | M |
| 1344 | CL | class-journeyman | Community talent builds by stage (Journeyman ~40/55/70, Maestro ~70/100/150) | adapter | no | no |  | L | S (text only) |
| 1345 | CL | class-journeyman | Added levels and super talents | toolbox-only | no | no |  | H | M |
| 1346 | CL | class-journeyman | Promotion quest rewards | toolbox-only | no | no |  | H | M |
| 1347 | CL | class-shaman | Class tree and promotions (Mage 31 -> Shaman 33 -> Bubonic Conjuror 36 -> Arcane Cultist 40; W… | adapter | yes | yes |  | H | defer (W5+) |
| 1348 | CL | class-shaman | Tab talent points (tab 2 3(L-6), tab 3 3(L-29), tab 4 3*min(L-89,100)+..., tab 5 3(L-249)) and… | adapter | yes | yes |  | H | S (polish) |
| 1349 | CL | class-shaman | Max talent level raises (Wis Wumbo -> Book of the Wise; Utmost Intellect; Fantasia Flasks -> F… | adapter | partial | no |  | H | S |
| 1350 | CL | class-shaman | Added talent levels (Symbols of Beyond, family, Arctis, achievements, Equinox, Grimoire, Tesse… | toolbox-only | no | no |  | H | M |
| 1351 | CL | class-shaman | Idle Casting (448): AFK fighting gain decay 20,50 (L50 10%, L100 13.3%) | adapter | yes | yes |  | M | S (polish) |
| 1352 | CL | class-shaman | Attack bar (Energy Bolt, Mini Fireball, Crazy Concoctions, Auspicious Aura, Sizzling Skull, Bu… | adapter | yes | yes |  | H | S (polish) |
| 1353 | CL | class-shaman | Attack cooldown divisor (WOAH, THAT WAS FAST! + Magician Starterpack) | toolbox-only | no | no |  | H | M |
| 1354 | CL | class-shaman | Damage passives (Overclocked Energy, Knowledge is Power, Power Overwhelming, Mana Overdrive, I… | adapter | yes | yes |  | M | S (polish) |
| 1355 | CL | class-shaman | Farsight (447): crit chance/damage; data has x 17,45 and y 33,45, Toolbox uses y for both (Dis… | adapter | yes | yes |  | M | S (polish) |
| 1356 | CL | class-shaman | Choppin kit (Log On Logs, Leaf Thief, Deforesting All Doubt, Inner Peace, Choppin It Up Ez, Sm… | adapter | yes | yes |  | M | S (polish) |
| 1357 | CL | class-shaman | Virile Vials (485): 12L/(L+100) % damage per vial at level > 3 | adapter | partial | yes |  | H | S |
| 1358 | CL | class-shaman | Bubble Breakthrough (492): +L% Alchemy EXP and new-bubble odds multiplier 1 + y/100 (y non-lin… | toolbox-only | no | no |  | M | M |
| 1359 | CL | class-shaman | Busy Brewin' (491): +1% brew speed per level for this character | adapter | partial | yes |  | M | S |
| 1360 | CL | class-shaman | Sharing Some Smarts (493): +L% Alchemy EXP (sharing with the cauldron unverified) | adapter | yes | yes |  | L | S (polish) |
| 1361 | CL | class-shaman | Cranium Cooking (490): one cast per ~22 h 13 min (80,000 s); each kill in the 10+floor(L/2) s… | toolbox-only | partial | no |  | M | M |
| 1362 | CL | class-shaman | Crazy Concoctions / Auspicious Aura / Sizzling Skull / Tenteyecle / Instant Invincibility | adapter | yes | yes |  | M | S (polish) |
| 1363 | CL | class-shaman | Occult Obols (486), Stupendous Statues (487), Wis Wumbo (488), Earlier Education (494) | adapter | yes | yes |  | H | S (polish) |
| 1364 | CL | class-shaman | Family bonuses: Mage +WIS (from Lv 9), Shaman golden food x(1+0.4n/(100+n)), Bubonic all stats… | toolbox-only | no | no |  | H | M |
| 1365 | CL | class-shaman | Smart Boi Talent and Mage is Best (High-IQ cauldron bubbles for the Mage line) | adapter | yes | yes |  | H | S (polish) |
| 1366 | CL | class-shaman | Bubonic Conjuror Lab kit: Purple Tube (line width for players at/right of the Bubonic), Green… | adapter | partial | no |  | H | S |
| 1367 | CL | class-shaman | Bubonic WIS / damage kit: Skill Wiz, Utmost Intellect, Memorial Skulls (off on W7 maps), Wired… | adapter | partial | no |  | L | S |
| 1368 | CL | class-shaman | Bubonic attacks and Plague Stricken (passive) | adapter | partial | yes |  | H | S |
| 1369 | CL | class-shaman | Main stat WIS and the stat values (WIS, AGI accuracy) | toolbox-only | no | no |  | H | M |
| 1370 | CL | class-shaman | Arcane Cultist (master, tab 5) and Elemental Sorcerer extensions | adapter | partial | no |  | M | defer (W5+) |
| 1371 | CL | class-squire | Class line and promotion chain (Warrior -> Squire -> Divine Knight; Royal Guardian W5+) | adapter | partial | yes |  | H | defer (W5+) |
| 1372 | CL | class-squire | Talent tabs, ids and levels (tab 3 = Squire, tab 4 = Divine Knight; DK keeps the Squire tab) | adapter | yes | yes |  | H | S (polish) |
| 1373 | CL | class-squire | Talent points per tab (3*(L-29) for tab 3; 3*min(L-89,100)+... for tab 4) | adapter | yes | yes |  | H | S (polish) |
| 1374 | CL | class-squire | Max level and Library books; STR Summore (+max Fist of Rage) and Blocky Bottles (+max Meat Sha… | adapter | partial | yes |  | H | S |
| 1375 | CL | class-squire | Presets and resets; Squire <-> Barbarian swap token | adapter | yes | yes |  | M | S (polish) |
| 1376 | CL | class-squire | Accuracy and hit chance (WIS is the Warrior line accuracy stat; 100% at 1.5x Defence) | toolbox-only | partial | yes |  | H | M |
| 1377 | CL | class-squire | Warrior attacks and strength talents (Power Strike, Whirl, Double Strike, Firmly Grasp It, Str… | adapter | yes | yes |  | H | S (polish) |
| 1378 | CL | class-squire | Warrior mining kit (Big Pick, Copper Collector, Motherlode Miner, Tool Proficiency, Tempestuou… | adapter | yes | yes |  | H | S (polish) |
| 1379 | CL | class-squire | Squire attacks and buffs (Shockwave Slash, Daggerang, Bricky Skin, Balanced Spirit) | adapter | yes | yes |  | M | S (polish) |
| 1380 | CL | class-squire | Mastery Up (mastery = min(0.8, 0.35 + (bubble + card + talent + gear)/100)) | toolbox-only | no | no |  | M | M |
| 1381 | CL | class-squire | Precision Power (damage % per total Refinery rank, only when accuracy >= 2.25x target Defence) | toolbox-only | no | no |  | H | M |
| 1382 | CL | class-squire | Fistful Of Obol / Shieldiest Statues (Power, Mining, Defence, Thicc Skin statues) | adapter | yes | yes |  | H | S (polish) |
| 1383 | CL | class-squire | Refinery Throttle (3 + floor(L/8) cycles per cast, cooldown 72,000 s; summed over every Squire… | toolbox-only | no | no |  | H | M |
| 1384 | CL | class-squire | Redox Rates (build speed % per power of 10 Redox Salts in storage) | toolbox-only | no | no |  | H | M |
| 1385 | CL | class-squire | Sharper Saws (Construction EXP %) | toolbox-only | no | yes |  | H | M |
| 1386 | CL | class-squire | Super Samples (3D Printer sample size; Toolbox counts 0) | toolbox-only | no | no |  | M | M |
| 1387 | CL | class-squire | Back To Basics (+1 tab-2 point per level) | adapter | yes | yes |  | H | S (polish) |
| 1388 | CL | class-squire | Family bonuses: Warrior +STR (Lv 9+), Squire +% HP (Lv 29+, decay 40/100), Divine Knight +% Re… | toolbox-only | no | yes |  | H | M |
| 1389 | CL | class-squire | Divine Knight attacks and buffs (Knightly Disciple, Mega Mongorang, Divine Intervention, Orb o… | adapter | yes | no |  | L | S (polish) |
| 1390 | CL | class-squire | King of the Remembered (printer multiplier from Orb of Remembrance kills) and Orb score / Rift… | toolbox-only | no | no |  | H | defer (W5+) |
| 1391 | CL | class-squire | Gaming talents (Gamer Strength, Undying Passion, 1000 Hours Played, Bitty Litty) | toolbox-only | no | no |  | H | defer (W5+) |
| 1392 | CL | class-squire | DK shared elite talents (Charred Skulls, Skill Strengthen, Overblown Testosterone, The Family… | toolbox-only | no | no |  | H | M |
| 1393 | CL | class-squire | Class EXP | adapter | yes | yes |  | H | S (polish) |
| 1394 | CL | class-squire | Star talent tab | adapter | yes | yes |  | H | S (polish) |
| 1395 | CL | class-wizard | Class line and promotion chain (Beginner -> Mage -> Wizard -> Elemental Sorcerer; Spiritual Mo… | adapter | partial | yes |  | H | S |
| 1396 | CL | class-wizard | Talent tabs, ids and max levels (Savvy Basics, Mage, Wizard, Elemental Sorcerer; 15 each) | adapter | yes | yes |  | H | S (polish) |
| 1397 | CL | class-wizard | Max-level raisers: Book of the Wise (Wis Wumbo, Utmost Intellect, Eternal WIS), Overclocked En… | adapter | partial | no |  | H | S |
| 1398 | CL | class-wizard | Talent points per tab (Smart Boi Talent bubble +N to tabs 1-4 for classIndex >= 31; Earlier Ed… | adapter | yes | yes |  | H | S (polish) |
| 1399 | CL | class-wizard | Savvy Basics shared talents (Gilded Sword, Sharpened Axe, Mana Booster, Health Booster, Quickn… | adapter | yes | yes |  | H | S (polish) |
| 1400 | CL | class-wizard | Mage-only tab 1: Idle Casting (Fighting AFK gains), Overclocked Energy (damage per power of 10… | adapter | yes | partial |  | H | S (polish) |
| 1401 | CL | class-wizard | Mage attacks and the attack-bar AFK rule (Energy Bolt, Mini Fireball; Teleport D=K=1) | adapter | yes | yes |  | H | S (polish) |
| 1402 | CL | class-wizard | Mage tab damage passives (Knowledge Is Power, Power Overwhelming, Mana Overdrive, Individual I… | adapter | yes | yes |  | M | S (polish) |
| 1403 | CL | class-wizard | Mage tab Choppin utility (Log On Logs, Leaf Thief, Deforesting All Doubt, Inner Peace, Free Me… | adapter | yes | yes |  | H | S (polish) |
| 1404 | CL | class-wizard | Wizard tab attacks (Ice Shards, Floor Is Lava, Tornado, Speedy Book, Mana Is Life) | adapter | yes | yes |  | H | S (polish) |
| 1405 | CL | class-wizard | Wizard tab passives (Paperwork Great..., Occult Obols, Staring Statues, Wis Wumbo, Fuscia Flas… | adapter | yes | partial |  | H | S (polish) |
| 1406 | CL | class-wizard | Wizard tab Worship (Charge Syphon, Sooouls, Bless Up, Nearby Outlet) | adapter | partial | partial |  | H | S |
| 1407 | CL | class-wizard | Elemental Sorcerer attacks (Meteor Shower, Lightning Barrage, Radiant Chainbolt, Dimensional W… | adapter | yes | yes |  | H | S (polish) |
| 1408 | CL | class-wizard | Elemental Sorcerer passives and Divinity (Symbols of Beyond ~P, Utmost Intellect, Skill Wiz, T… | toolbox-only | no | no |  | H | M |
| 1409 | CL | class-wizard | Added talent levels (Symbols of Beyond, ES family, Arctis, achievement 291, companion, ninja m… | toolbox-only | no | no |  | H | M |
| 1410 | CL | class-wizard | Class family bonuses (Mage +Total WIS from Lv 9; Wizard +star points from Lv 29; ES +talent le… | toolbox-only | no | no |  | H | M |
| 1411 | CL | class-wizard | MP/WIS damage stack (WIS with Knowledge Is Power + Smarter Spells; Overclocked Energy and Name… | toolbox-only | no | no |  | H | M |
| 1412 | CL | class-wizard | Magician Starterpack post-office box (+base MP, +% MP, faster cooldowns); mana cost of attacks | toolbox-only | partial | yes |  | H | M |
| 1413 | CL | class-wizard | Bubble interactions (Smarter Spells, Wand Pawur, Hyperswift, All For Kill, Mage Is Best, Smart… | adapter | yes | yes |  | H | S (polish) |
| 1414 | CL | class-wizard | Presets, attack bar and Super Talents | adapter | yes | yes |  | H | S (polish) |
| 1415 | CL | class-wizard | Star talents for the Mage line (Star Player, Stonks!, Attacks On Simmer; Wizard family star po… | adapter | yes | yes |  | H | S (polish) |
| 1416 | CL | class-wizard | Accuracy and hit chance (AGI is the Mage-line accuracy stat; stop Quickness Boots at 100% hit) | toolbox-only | partial | partial |  | M | M |
| 1417 | CL | class-wizard | Farsight crit chance: game reads x, Toolbox reads y | toolbox-only | no | no |  | M | M |
| 1418 | CL | class-wizard | W5+ extensions (Divinity gods, Polytheism, God's Chosen Children past 10 gods, Spiritual Monk… | missing | no | no |  | H | defer (W5+) |

## Appendix B. Deferred register (red team 2026-10-19)

Rows of Appendix A that are W5+ content (spec N1). **grey later** = drawn greyed "later" on a page that needs it for
context, never advised; **omit** = not drawn. Both are excluded from coverage percentages and effort roll-ups, and the
matrix-completeness test (Wave 0.12) accepts a row listed here as mapped. Rows that mix W1-W4 and W5+ parts (for
example vials idx 42-85, worn trophy slots, Lab jewel multipliers) stay in scope; only their W5+ part is greyed.
Generated by `work/deferred.py`; edit the lists there.

| # | Area | System | Mechanic | Flag |
|---|---|---|---|---|
| 148 | W1 | post-office | Tab 2 (Charlie's Crates) gating, W5+ boxes, sailing relic box chance | grey later |
| 208 | W1 | stamps | Exalted stamps (W6 Windwalker Compass) | grey later |
| 231 | W1 | star-signs | Silkrode Nanochip and Seraph Cosmos (W5+) | grey later |
| 251 | W1 | statues | Zenith grade, Zenith Market and Clusters (W7) | grey later |
| 269 | W1 | upgrade-vault | Vault III rows 62-89 (W5-W6) | grey later |
| 287 | W2 | alchemy-bubbles | Prisma bubbles (W5+) | grey later |
| 288 | W2 | alchemy-bubbles | Kattlekruk / Zenith Market daily bubbles (W5+) | grey later |
| 289 | W2 | alchemy-bubbles | Grind Time daily from Coral Reef (W7) | grey later |
| 395 | W2 | islands | W5+ extensions (Shim Lantern multiplier, Fractal sailing/sneaking/W7 tiers, Sai… | grey later |
| 487 | W3 | atom-collider | Atoms 11-16 Magnesium, Aluminium, Silicon, Phosphorus, Sulfur, Chlorine (W6/W7) | grey later |
| 489 | W3 | atom-collider | Other particle sinks and readers (Divinity gods, Caverns Bell, The_True_Lantern) | omit |
| 505 | W3 | bubba | Pet Arena Crucible meat multiplier (x(1+2) at crucible 10) | grey later |
| 522 | W3 | cog-board | Tiny Cog side columns and small cogs (W7, Research J8) | grey later |
| 523 | W3 | cog-board | Jewel cogs (W5, CogCry0-5) | grey later |
| 554 | W3 | death-note | Cross-system readers (Lab Fungi Finger Pocketer, Hole pts, Summoning, Menagerie) | omit |
| 568 | W3 | equinox | Nightmare clouds (index >= 36, Research grid node 86, W7) and W5+ max-level sour | grey later |
| 578 | W3 | library | W5+ extensions (Fury Relic, Gaming superbit, Construct Mastery, Summoning 'Libra | omit |
| 592 | W3 | prayers | No-prayer superbits (W5 Gaming) | omit |
| 598 | AW | prayers | W5+ extensions (Gaming superbits with zero prayers, Crucible meat for W5+, later | omit |
| 615 | W3 | printer | W5+ extensions (Gold Relic forms, Harriep, Biggole Mole, Lolly Flower, Moon of P | omit |
| 636 | W3 | refinery | Polymerization tab (salts 7-9, Research square 49) and W5+ speed | grey later |
| 655 | W3 | salt-lick | W5+ extensions | grey later |
| 711 | W3 | worship | Total waves (Totalizer at W5, Tome, Menagerie W7) | grey later |
| 715 | W3 | worship | Totem HP superbits, Soul multipliers W5+, bulk claim (W7) | grey later |
| 739 | W4 | breeding | Crucible (W7 hard arena) | grey later |
| 746 | AW | breeding | Pet Arena Crucible (hard arena, accountOptions[628], gated on Menagerie unlock 8 | grey later |
| 784 | W4 | elite-classes | Elemental Sorcerer Polytheism second god | omit |
| 793 | W4 | elite-classes | W5+ promotions | grey later |
| 820 | W4 | lab | W5+ Lab gates | grey later |
| 856 | W4 | sigils | W5+ extensions | grey later |
| 869 | W4 | tome | Top 0.1% wish and Menagerie nametag turn-in | omit |
| 870 | W4 | tome | W7 Tome Epilogue lore bonuses | grey later |
| 888 | AW | achievements | W5-W6 entries and their consumers (Sailing, Gaming, Divinity, Farming, Summoning | grey later |
| 1030 | AW | food | M8 Beanstalk (W6 Jade) stacks and achievements 380/383 | omit |
| 1125 | AW | monster-afk | Compass medallions per AFK target (W6+) | omit |
| 1144 | AW | pets | King Doot Divinity gate | omit |
| 1213 | AW | talents | Super talents (class Lv 400+, W7) | grey later |
| 1250 | AW | trophies-nametags | Gallery: podiums, tiers, multiplier, nametag stacks (W7) | grey later |
