# ActiveOn Design Lab v2: System views critique

Scope: the "System views" section of `index.html`: 32 components, 106 variants, at 390 and 1280 px, light and dark, Field Guide (phone) and Command Board (desktop). Each variant is scored 1-5 on v1's ten tests plus an eleventh, "shows the system visually, not as a list of cards". Scores per variant are in `v2/critique.json`. Screenshots: `shots/v2/`, re-check shots `shots/v2crit/`. Verdicts: 32 pick, 31 runner-up, 31 keep as a state or desktop layout, 12 drop.

Contract check: passed after fixes. No horizontal scroll at 390 or 1280 in any theme or direction, no tap target under 44 px, no console errors, no game sprites, no real character names (classes and levels only), no slot codes, one currency format (coins with M or B). No pixel face under 16 px in the product views (only the lab's own 11 px "Pick" chip, as in v1). Fixed on this page: a second who-glyph family, one tier-jargon line, four broken layouts.

## Verdict

The pictures are real; the steps are still text. The owner's ask lands where the picture carries the step: Health matrix, card rack and before/after swap, by-map grind list, Cog Board, charge tanks, statue wall, Vault tower, AFK lanes, slot grid. It misses where a list came back under a new name, where the engine's step is a five-line sentence, and where the picture cannot light a choice because the engine has none yet (which bubble, which Prayer, which gear). Those are data and Knowledge Base work, not design.

## Top issues

1. **Two who-glyph families, again.** The Systems group drew the class chibi in the bronze ramp, so on Worship, Statues, Vault and Alchemy the same Squire 51 is a brown face in a hat, while Characters, Time and Map show the blue-helmet chibi. Same drawing, different colour ramp: the v1 rule 'one who-glyph family' broke across groups. *Fix:* Fixed here: the Systems chibis use the blob ramp the other groups use. In the build, one shared chibi component with no per-group colour override.
2. **Lists came back under new names.** Constellation board (26 rows), Needs-you (sorted cards), Earns-until (six cards), Vault cheapest, Stamp cap planner (21 rows), gear slot list, Grouped by Role. Each is the card stack the owner rejected, regrouped. *Fix:* Keep the picture as level 1 and put any list behind it as a sheet capped at three rows. These seven are dropped or kept only as a folded detail.
3. **The same sentence, five or six times.** 'Stopped: anvil full' and 'Collect Thread from the anvil' on six Earns-until cards; '2nd slot at 19 points' on six sign rows; 'empty. Equip anything you hold.' on five gear rows; 'Not covered yet: ActiveOn shows the save, no advice' on five hub cards. *Fix:* Say it once at the group level ('6 characters: anvil full, collect Thread'), as Hatched waste already does with 'then the same on 5 more'.
4. **The engine's step is a paragraph.** The lit step on the system pages is a five-line engine sentence: 'Collect your Redox Salts from the Refinery's storage into the chest, then check the 3D Printer in the Build menu: it upgrades when you have enough', 'Put Printer Sampling on the attack bar and use it, set the new Megalodon Tooth sample active in place of Forest Fibres, then go back'. It fails the 3-second read on the views that are otherwise the strongest. *Fix:* Cap a step at about 12 words with one verb; the rest goes into the sheet. This is Knowledge Base copy work before the build.
5. **Who, where, how long is three empty tokens on most system steps.** Nearly every system Next step reads 'Any character · <place> · time not known'. It is honest, and it is v1's issue 3 at scale: the token line says nothing. *Fix:* Hide 'Any character' and an unknown time instead of printing them; file fix durations for the top 15 gaps as Knowledge Base work.
6. **The pictures can't light the choice yet.** Alchemy's cauldron columns light no bubble (the levelling order is 'not covered'), the Prayer loadout's lit slot is 'Mock advice', the gear doll's gap rule is a mock, Cog Board seat advice is specced but not shipped, Star Signs advice waits on M16. The views show the waste side well and the choice side, the atlas's central gap, only as placeholders. *Fix:* Ship each picture with its engine rule, not before: M19 bubble order, M9 Prayers, M18 gear gap, M3 cog-seat-free, M16 Star Signs.
7. **Small text inside the pictures.** 289 text nodes under 12 px at 390, almost all inside the new pictures: 87 vial cells each printing '2%', bubble names under the cauldron columns, slot-grid cells, Hub tile states. No pixel face is under 16 px (only the lab's own 'Pick' chip), so the hard rule passes, but the pictures are hard to read on a phone. *Fix:* Label only the lit element and the best three; everything else gets its value in the tap sheet.
8. **Broken layouts on four variants.** The Star Chart's one lit star was clipped off the top of the sky (a generic is-now rule overrode its position); the rising bubbles covered 'Start here' on the cauldron pots; the points pouch's Next pill stretched into a full-width bar; Parallel Slots cells were cut to 'None ...' and 'Off th...' and the five-minute plan to 'Play one roun...' at 390. *Fix:* Fixed here and re-checked headless. In the build, scope every state class (is-now) to its component.
9. **One time, two formats.** The same frontier door is 'about 14h' on the character Now tab and '14h 04m of AFK' on the Map and the nav shell; the hub says 'about 1 h' with a space. P6 asks for one language. *Fix:* One duration formatter: 'in 14h 04m' everywhere, rounded only by the formatter.
10. **Cryptic cell words and duplicates.** Health matrix cells say '215+', 'far', '1 of 4' with no unit; the paper doll says '45 far'. Skill grid row duplicates the Role matrix, Gate ruler duplicates the Level ruler, Per-tab checklist duplicates One step. Several desktop-only variants (World strip, Card plan board, Gear heat strip, Side panel) only make sense at 1280. *Fix:* Units on every number ('215 points', '45 levels behind'); drop the duplicates; mark the four desktop views as Command Board's layout, with a named phone fallback each.

## Recommended pick per component

| Component | Pick | Runner-up | Why |
|---|---|---|---|
| `character.overview` | Health matrix (4.2) | Class tree roster | One grid answers who is set up wrong on which tab; give the cells units. |
| `character.shell` | Sticky identity strip (4.4) | Prev / next character rail | Who, where, Verdict and badged tabs in one strip that stays on screen. |
| `character.now-tab` | Current step hero (4.4) | Purpose ladder | One step with who, where and a time from the save; the ladder goes under it. |
| `character.build.class-path` | Stepping stones (4.3) | Branch of the class tree | A path with the next class lit and what it opens. |
| `character.build.presets` | Game-tab grid (4.1) | Side-by-side diff | Tabs as tiles filled to target, with the preset-mismatch banner on top. |
| `character.build.unspent` | Tab badges (4.3) | Spent / waiting bar | A count on each tab, 'Start here' on one, nothing extra. |
| `character.build.next-points` | One step, then the rest (4.2) | Point budget meter | One line at full weight, two muted, the rest folded. |
| `character.build.attack-bar` | Slot row with ghosts (4.4) | Missing only | The bar as the game shows it, a ghost in the gap. |
| `character.build.coming-up` | Milestone ladder (4.2) | Unlock chips | Future unlocks as rungs above 'you are here'. |
| `character.cards.preset-rows` | Card rack (4.5) | Compact chip row | Our own card frames with the worn preset ringed and the mismatch as the banner. |
| `character.cards.best-swap` | Before / after racks (4.3) | Three rows: now, own, reach | Now rack, best-you-own rack, one sentence: presets from cards you own. |
| `character.cards.grind` | By map (4.5) | Grind queue | Grind targets grouped by the map that drops them, for your world. |
| `character.cards.set-progress` | Set level bars (4.2) | Card wall by set | Sets as bars with set-level ticks, 'Wear this' lit, no tier words. |
| `character.gear.paper-doll` | Coloured silhouette (4.3) | - | A mannequin with each slot coloured by levels behind; add units. |
| `character.gear.upgrade-path` | Tool ladder per skill (4.1) | Tier ladder | Tool ladders on one skill axis show a better tool is already allowed. |
| `character.skills.bars` | Bar list with gate ticks (4.4) | Next gate first | Nine bars with gate ticks and the AFK skill lit. |
| `character.skills.role-training` | Role matrix (4.2) | Specialist card | The account Skill Grid with specialists starred and the gap named. |
| `systems.hub` | Stage report card (4.4) | Town map hub | 'What did I skip' as length on one Stage axis, worst row open. |
| `systems.page-frame` | Step first (4.3) | Picture first | Step, Stage meter, then the picture; cap the step at two lines. |
| `systems.alchemy` | Cauldron pots (4.5) | Liquid tubes | Pots with bubbles rising to the expected new bubbles, the richest lit. |
| `systems.construction` | Cog Board heat map (4.5) | Salt chain diagram | The Cog Board with the free seat lit: free value at no AFK cost. |
| `systems.stamps` | Stamp book grid (4.3) | Next three ribbon | The Stamp Book grid with the stamp to get first lit. |
| `systems.star-chart` | Constellation map (4.3) | Sign slot strip | A world sky with the claimable star lit and progress to a 2nd sign. |
| `systems.statues` | Statue wall (4.5) | Spread chart | 32 statues as a wall, Gold in gold, the next Gold lit. |
| `systems.vault` | Vault tower (4.4) | Next unlock gap | Floors opened by total levels with the best buy lit. |
| `systems.worship-prayers` | Charge tanks (4.6) | Wave rulers | Six charge tanks and one 'spend it' step said once. |
| `time.timeline` | Lanes with a back-at marker (4.5) | Hatched waste | Lanes to each cap on one axis with the Back marker. |
| `time.daily-weekly` | Two-ring reset clock (4.3) | Five-minute plan | A day ring over three bands: no bank, banks, weekly. |
| `time.parallel-slots` | Slot grid (4.1) | Unassigned tray | Characters by five slots with column counts. |
| `map.world-map` | Gate-first (4.6) | Vertical route | Folded worlds and boss gates with the frontier ring on one phone screen. |
| `map.map-sheet` | Bottom sheet (4.5) | Tooltip card | Who is here, door progress, card and Death Note in one sheet. |
| `nav.shell` | Bottom bar, then rail (4.2) | Now in the middle | Five places, glyph plus word, one badge each; rail on desktop. |

Dropped: Grouped by Role (`character.overview`); Gate ruler (`character.build.class-path`); Points pouch (`character.build.unspent`); Per-tab checklist (`character.build.next-points`); Bar vs build (`character.build.attack-bar`); Preset carousel (`character.cards.preset-rows`); Slot list by gap (`character.gear.paper-doll`); Skill grid row (`character.skills.bars`); Needs-you list (`systems.hub`); Constellation board (`systems.star-chart`); Cheapest first (`systems.vault`); Earns-until list (`time.timeline`).

## Which system pages to build first

- **1. Shell and Systems hub.** Bottom bar with five places (rail on desktop) plus the hub as a Stage report card with the town map under it. Cheap, uses existing Checks, and removes the wall of cards first (atlas build step 1).
- **2. Timeline.** AFK lanes with the Back marker, Hatched waste as the stale state, the daily ring with its three bands. M3 and M6 already compute the caps; the views are the best-scoring in the lab.
- **3. Parallel Slots grid.** Characters by cauldron, traps, worship, Cog Board and printer, with the free slot lit. Atlas gap #2, pure free value, data already parsed.
- **4. Characters: overview, Cards and Build.** Health matrix, card rack plus the before/after swap and the by-map grind list, talent tab grid with the mismatch banner. Answers the owner's builds, presets and cards ask; needs the M8 card preferences moved from the export into the engine.
- **5. Construction (Cog Board) and Worship (charge tanks).** Both pictures are ready and their waste Checks ship; build with M3 cog-seat-free and the skull ladder.
- **6. Map.** Gate-first on the phone, World strip on desktop, bottom sheet per map. Data exists (M2 push, generated portals).
- **7. Alchemy, Statues, Vault, Stamps.** Pots and tubes, the statue wall, the Vault tower, the Stamp Book. Build each with its ordering rule (M19, M7, M8), not before.
- **8. Star Chart and Prayers.** Wait for M16 and the Prayers rules; until then the hub shows them as 'not covered yet'.

## Fixed in index.html during this pass

- Systems chibis now use the same blob ramp as Characters, Time and Map: one who-glyph family across the page.
- Star Chart: the lit star (A-1) sits in the sky again instead of being clipped off its top edge.
- Cauldron pots: the rising bubbles no longer cover the 'Start here' label.
- Points pouch: the Next pill is a pill again, not a full-width bar.
- Parallel Slots grid and per-slot chips wrap at 390 instead of cutting words to 'None ...'; five-minute plan chips wrap instead of 'Play one roun...'.
- Copy: 'tier 2, +20% All Food Effect' is now 'set level 2, +20% food effect'; '6 of 4 characters are Lv 30+' is now 'You have 6 at Lv 30+'.
- Every v2 component's Pick badge and the What's next table carry the pick; every variant has a score and a note.

Still open (design and data calls for the spec): run-on engine step text; empty who/time tokens; 289 text nodes under 12 px at 390 inside pictures; two time formats for the same door; cryptic cell words ('215+', 'far'); the hub's town-map tiles show state as glyph and colour only; timeline lane labels clip at 390; Barbarian name touches the slot-grid cell.

Note: `index.html` edits are applied by `build/apply_critique_v2.py` from `build/index.pre-v2crit.html` (data in `build/critique_v2_data.py` and `build/critique_v2_*.json`). If `build/assemble_v2.py` regenerates the page, delete the pre-v2crit copy and re-run the apply script. Re-check: `node build/shoot-v2.cjs <tag> noshoot` and `node build/crit-v2-probe.cjs`.
