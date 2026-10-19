# M26 sprite manifest (deduplicated)

Verified 2026-10-19. Built by `synth/final/sprites_collect.py` and `sprites_merge.py` from the sprite sections of
`synth/W1.md`, `W2.md`, `W3.md`, `W4.md`, `AW.md`, `CL.md` and the `sprites` blocks of the eleven account-wide maps with
no synthesis (`maps/{talents,gem-shop,merit-tasks,achievements,dungeons,pets,guild,family,skills,monster-afk,checklist}.json`).
Re-run both scripts after a map changes; this file is their output plus the hand-written notes at the top.

**Rules (ADR 0009, M24 design brief).** Our own pixel art only, never a game sprite, never a traced or recoloured game
asset. Generic objects described in our own words; monsters, NPCs and pets are our own designs that only share a theme
with the game (a mushroom critter, a hooded figure). Masked-grid format in `apps/activeon/src/art/sprites/grids/*.ts`,
brand tokens only, palette swaps instead of new grids where a base exists, `shape-rendering="crispEdges"`. 16x16 unless
the description says otherwise (pips 5x5 to 10x10, overlays 8x8). Colour follows rule 7: coral = losing value now,
gold = do it, mint = done, blue = a timer, grey = later.

**Counts.** 599 proposals from the maps and syntheses -> **542 names** after merging and dropping the deferred ones (palette families such as
`dn-skull-*`, `egg-rarity-1..11` or the twelve W4 skill glyphs are one row each; counting every grid, palette and
glyph the build is about 700 cells). No proposal reused an existing name by accident: every row below is new, except
`sys-refinery`, which is an alias of `item-salt` today and gets its own drawing.

**New grid files** (register each in `art/sprites/index.ts`, Wave 0.8):
- `stats.ts`: every `stat-*` glyph (STR, AGI, WIS, LUK, accuracy, crit, HP, MP, speed, drop rate, class EXP, skill EXP,
  multikill, kills per hour, respawn, survival, softcap, lowest level, extra kills, drop multi). W1 and W2 had put some
  in `talents.ts`; one grid keeps them consistent (decision X19).
- `mobs.ts`: every monster, boss and mini boss figure (`crystal-mob`, `mob-generic`, `mob-giant`, `mob-greenie-genie`,
  `mob-green-mushroom`, `mob-plunderous`, `boss-amarok`, `boss-efaunt`, `boss-chizoar`, `boss-troll`, `mini-*`,
  `wb-boss`, `killroy-prime`). Replaces the proposed `bosses.ts` (W1) and the `places.ts` placement (W2) (decision X18).
- `npcs.ts`: every NPC figure (`npc-eliteus`, `npc-postboy`, `npc-rocklyte`, `npc-cactolyte`, `npc-nebulyte`,
  `npc-speccius`, `quest-npc`).
- `statues.ts`: the 22 W1-W4 statue figures on the shared `item-statue` plinth, with four grade palettes.

**Merges made here** (canonical name <- merged names; all areas then use the canonical name):

- `item-golden-food` <- `golden-bread`, `food-golden`
- `stat-luk` <- `stat-luck`, `boost-luck`
- `stat-speed` <- `stat-move-speed`
- `stat-accuracy` <- `stat-hit`, `talent-accuracy`
- `stat-mp` <- `stat-mana`
- `stat-multikill` <- `stat-kill-per-kill`, `dn-multikill`
- `item-bottle` <- `islands-bottle`
- `item-chest` <- `item-storage-chest`
- `item-inventory-bag` <- `item-backpack`, `item-bag`, `item-town-bag`
- `item-carry-pouch` <- `item-pouch`, `item-material-pouch`
- `anvil-whetstone` <- `item-whetstone`
- `item-reset-fragment` <- `talent-reset-fragment`
- `item-pocketwatch-gold` <- `pocketwatch-gold`
- `item-pocketwatch-silver` <- `pocketwatch-silver`
- `status-reset` <- `owl-restart`, `poppy-fisheroo-reset`, `task-reset`
- `item-ticket` <- `event-ticket`
- `status-pip` <- `sigil-pip`, `rift-mastery-pip`, `tome-tier-pip`, `task-tier-pips`, `tier-pip`, `trait-pip`, `bank-pip`
- `obol-slot-empty` <- `obol-slot-circle`, `obol-slot-square`, `obol-slot-hexagon`, `obol-slot-sparkle`
- `prayer-curse` <- `item-prayer-curse`
- `talent-cap-raise` <- `talent-max-raise`
- `wave-flag` <- `td-wave`, `colo-wave-flag`
- `friend-slot` <- `pet-friend-slot`
- `cog-yin` <- `item-zen-cog`
- `cog-flag-ring` <- `item-flaggy`, `cog-flag`
- `item-price-tag` <- `item-bargain-tag`, `pet-discount-tag`
- `mob-giant` <- `prayer-giant`
- `status-heart` <- `breeding-heart`, `pet-life-heart`
- `crystal-mob` <- `item-crystal-mob`
- `item-talent-book` <- `item-starbook`
- `item-dice` <- `vial-dice`
- Dropped, reuse instead: `talent-added-level(s)` -> existing `status-plus`; `sys-storage` -> the v2 glyph
  `v2-systems-chest`; `status-disputed` -> the existing Contested "sources disagree" badge.
- Grid conflicts settled: `charge-syphon` goes in `talents.ts` (it is a Wizard talent; W3 had `systems.ts`);
  `status-heart` and `wave-flag` in `status.ts`.

**Reused existing sprites (do not redraw).** `class-*` (19), `skill-*` (6, plus the aliases `skill-trapping`,
`-construction`, `-worship`, `-cooking`, `-breeding`, `-laboratory` until the W4 skill glyphs land), `talent-*` and
`talent-tab-1..4`, `gear-*` (8), `status-check/lock/clock/warning/full/empty/arrow/plus`, `cauldron-power/quicc/high-iq/
kazam`, `liquid-water/nitrogen/seawater/mercury`, every `item-*` in `items.ts` (ore, log, fish, bug, critter, soul,
monster-material, food, coin, gem, key, card-frame, star, vial, bubble, stamp, statue, shrine, prayer, salt, chip,
jewel, meal, pet-egg, spice), every `sys-*` in `systems.ts` (52, including `sys-lab`, `sys-rift`, `sys-tome`,
`sys-equinox`, `sys-salt-lick`, `sys-atom-collider`, `sys-death-note`, `sys-pet-arena`, `sys-territories`), `place-*`
(5). The v2 design art set (`apps/activeon/src/design/art/names.ts`) already has `v2-systems-chest`,
`v2-systems-telescope`, `v2-time-ticket`, `v2-character-pouch`, `v2-time-drumstick`, `v2-systems-cog`,
`v2-systems-salt`, `v2-systems-shrine`, `v2-map-flag`: decide once whether System pages may use v2 glyphs before
drawing `place-telescope`, `item-ticket`, `item-chest` and `item-carry-pouch` (W1 risk).

**Deferred (W5+, not drawn in M26).** `stamp-exalted`, `key-kruk`, `item-ribbon`, `class-death-bringer`,
`class-royal-guardian`, `class-wind-walker`, `class-arcane-cultist`, `polytheism-chip`, `mg-trophy-baller`,
`mg-trophy-nine-dart`.

**Columns.** *Wave* = the first build wave (MASTER.md section 4) whose views need the sprite, so the art can land one
wave ahead. *Used on* = the System pages, tabs and Now cards that draw it (map topic ids). *Proposed by* = the
areas whose maps asked for it. *Merged from* = names folded into it.


**Per wave** (re-tagged to the revised waves on 2026-10-19 by `work/sprite_waves.py`: a sprite's wave is the earliest wave whose page uses it): Wave 1: 57, 2: 77, 3: 50, 4: 135, 5: 106, 6: 25, 7: 92 (542); the old tags were Wave 1: 114, 2: 78, 3: 90, 4: 44, 5: 76, 6: 140. **Per-PR cap: 30 new names**; a page's required sprites (answer frame and first screen) land one PR ahead of it, the rest may follow (spec section 10).


## `systems.ts`: 177

| Name | Description | Used on | Wave | Proposed by | Merged from |
|---|---|---|---|---|---|
| `breeding-fence` | three-picket wooden fence, rail across, grass pixels at base (Fence Yard tab) | breeding | 1 | W4 |  |
| `chart-chronus` | Round emblem, hourglass in a ring of four stars, bronze | star-signs | 6 | W1 |  |
| `chart-hydron` | Round emblem, droplet with a star highlight, teal | star-signs | 6 | W1 |  |
| `chart-seraph` | Round emblem, winged star, pale gold (W5+, used now for the gate meter) | star-signs | 6 | W1 |  |
| `dream-dreams` | 16x16 sleeping crescent moon with 'z' sparkles (Equinox Dreams tile) | equinox | 4 | W3 |  |
| `dream-scims` | 16x16 two crossed curved scimitars with a small moon sparkle where they cross (Matching Scims tile) | equinox | 4 | W3 |  |
| `equinox-bar` | 9-slice meter frame: horizontal bar with a crescent-moon cap on the left and a sun disc on the right, violet-to-gold fill | equinox | 4 | W3 |  |
| `equinox-cloud` | 16x16 puffy dream cloud with a tiny star; palette states: lit lavender (active), gold with check (done), grey (upcoming), dark red-violet (Nightmare) | equinox | 4 | W3 |  |
| `lab-node` | 16x16 round socket, hex rim; lit = mint core + glow, off = hollow grey, next = gold dashed rim | lab | 1 | W4 |  |
| `lab-node-glyphs` | fourteen 8x8 glyphs inside lab-node, one per W4 node (paw, plug, looped pipe, bubble+arrow, rune circle, skull x2, shrine roof, aqueduct arch, stamp, ...) | lab | 1 | W4 |  |
| `lab-prism` | 16x16 white-blue triangular prism on a dark plinth splitting one ray into three coloured lines | lab | 1 | W4 |  |
| `lab-tube` | 12x16 glass capsule with cap and liquid line; purple swap + right arrow (Purple Tube), green swap + left arrow (Green Tube) | lab | 1 | W4 |  |
| `multi-drop` | Two stacked ore nuggets with a tiny 'x2' sparkle. | skills | 3 | AW/skills |  |
| `rift-bonus-node` | 12x12 swirl portal ring: violet lit, grey dotted ring locked | rift | 1 | W4 |  |
| `rift-gate-flag` | tattered black pirate flag, white crossed bones (SB Pirate Flag score) | rift | 1 | W4 |  |
| `rift-gate-orb` | glowing white orb, small skull mark, ring of 3 dots (DK Orb score) | rift | 1 | W4 |  |
| `rift-gate-wormhole` | purple spiral vortex, dark centre (ES Wormhole score) | rift | 1 | W4 |  |
| `rift-task-active` | portal ring with a yellow lightning bolt | rift | 1 | W4 |  |
| `rift-task-afk` | portal ring with crescent moon and "z" | rift | 1 | W4 |  |
| `rift-task-chars` | portal ring with three stick-figure heads | rift | 1 | W4 |  |
| `rift-task-score` | portal ring with a small trophy cup | rift | 1 | W4 |  |
| `rift-trap-vacuum` | small drone with a funnel sucking a trap box | rift | 1 | W4 |  |
| `set-crest-amarok` | shield in silver (i) with a wolf-ear pair on top and paper (k) fang dots; Amarok boss set | armor-smithy | 5 | W3 |  |
| `set-crest-chizoar` | shield in teal (t) with three spike tips along the top edge; Chizoar boss set | armor-smithy | 5 | W3 |  |
| `set-crest-copper` | 16x16 kite shield crest in bronze (z) with a small pickaxe notch at top; W1 Copper set | armor-smithy | 5 | W3 |  |
| `set-crest-dementia` | shield in majestic violet (m) with a swirl dot pattern; Dementia set | armor-smithy | 5 | W3 |  |
| `set-crest-diabolical` | shield in ruby (r) with two small horns on top; Diabolical set | armor-smithy | 5 | W3 |  |
| `set-crest-efaunt` | shield in paper/bone (k) with a rib-cage stripe pattern in dark; Efaunt boss set | armor-smithy | 5 | W3 |  |
| `set-crest-gold` | shield in gold (g) with a coin dot in the centre; Gold set | armor-smithy | 5 | W3 |  |
| `set-crest-iron` | same shield silhouette in stone (s) with riveted rim dots; Iron set | armor-smithy | 5 | W3 |  |
| `set-crest-later` | grey stone shield with a status-lock style keyhole; one shared chip for Secret and W5+ sets | armor-smithy | 5 | W3 |  |
| `set-crest-lustre` | shield in pink (n) with a sparkle highlight cluster; Lustre set | armor-smithy | 5 | W3 |  |
| `set-crest-magma` | shield in fire (f) with dark lava-drip dots at the base; Magma set | armor-smithy | 5 | W3 |  |
| `set-crest-platinum` | shield in platinum (p) with a hook-shaped highlight; Platinum set | armor-smithy | 5 | W3 |  |
| `set-crest-troll` | shield in leaf (l) with scale-row dots; Troll boss set | armor-smithy | 5 | W3 |  |
| `set-crest-void` | shield in dark (d) with a violet (m) crack across; Void set | armor-smithy | 5 | W3 |  |
| `sigil-tile` | 16x16 rounded stone tablet with carved rune circle; grey/blue/gold/cyan/violet/green by tier | sigils | 2 | W4 |  |
| `smithy-chain-arrow` | 16x16 hammer-on-arrow glyph (wood handle, silver head) pointing right, for the Upgrade chain 'consumes' link | armor-smithy | 5 | W3 |  |
| `sys-elite-classes` | shield crest, small gold crown above three rising chevrons, violet field | elite-classes | 1 | W4 |  |
| `sys-kitchen` | stove-top pot on a counter, lid ajar, two steam pixels; `cold` swap: grey pot, no steam | cooking | 1 | W4 |  |
| `sys-sigils` | small glowing rune tablet resting on a cauldron rim, sys-alchemy palette | sigils (Alchemy > Sigils tab) | 2 | W4 |  |
| `anvil-capacity` | Open crate brimming with grey blocks | anvil | 6 | W1 |  |
| `anvil-speed` | Tiny anvil with three trailing motion lines | anvil | 6 | W1 |  |
| `bld-automation-arm` | Jointed grey robot arm with a two-finger claw, base bolted down | construction | 2 | W3 |  |
| `bld-chest-space` | Open brown chest with a green plus sign above the lid | construction | 2 | W3 |  |
| `bld-cost-cruncher` | White salt crystal under a grey press plate with a red down-arrow | construction | 2 | W3 |  |
| `bld-trapper-drone` | Tiny four-rotor drone carrying a hanging net | construction | 2 | W3 |  |
| `bld-utility` | Small wooden workshop hut with a cog on its gable, the Utilities group | construction | 2 | W3 |  |
| `bld-wizard-tower` | Narrow grey stone tower with a purple pointed roof and a yellow star window, the Wizard towers group | construction | 2 | W3 |  |
| `cog-shelf` | Wooden wall shelf holding two small cogs, the Cog Shelf | cog-board, construction | 2 | W3 |  |
| `construct-mastery` | Stack of three bricks with a small violet rift swirl on top | construction | 2 | W3 |  |
| `forge-brimstone` | Sulphur-yellow brimstone shard frame with a small flame (overlay on forge-slot) | forge | 2 | W1 | `forge-brimstone (forge), sys-brimstone (smithing)` |
| `forge-slot` | Furnace mouth tile, brick arch; lit ember bed and cold grey idle states | forge | 2 | W1 |  |
| `recipe-scroll` | a rolled paper scroll tied with a red band, a tiny grey anvil mark on its face, for boss armor recipe rows | merit-tasks | 2 | AW/merit-tasks |  |
| `sys-town-shops` | market stall: red-and-cream striped awning over a wooden counter with two crates | recoloured), town-shops (the alchemy-liquids stall may share the base grid | 2 | AW |  |
| `task-point` | a small silver trophy cup with two handles and a tiny white plus spark at the top right | merit-tasks | 2 | AW/merit-tasks |  |
| `unlock-column` | a tall narrow parchment strip with stacked row ticks (filled = bought), paired with status-lock when the column is closed | merit-tasks | 2 | AW/merit-tasks |  |
| `vault-knockout` | Bare fist with a 4-point impact star | upgrade-vault | 2 | W1 |  |
| `vault-mastery` | Vault door with three stacked chevrons | upgrade-vault | 2 | W1 |  |
| `atom-badge` | a rounded square tile with a 1-2 letter element symbol slot and a small index number in the corner; per-atom row badge (text drawn over the frame) | atom-collider | 4 | W3 |  |
| `badge-wired-in` | 8x8 corner badge: plug with a lightning bolt; palette slots blue (2x Wired In), yellow (3x Harriep), purple (6x both) | printer | 5 | W3 |  |
| `bubba-megaflesh` | 16x16 thick glazed meat chunk with a gold four-point star badge; empty variant as grey outline; Chromatic variant with a rainbow rim | bubba | 5 | W3 |  |
| `bubba-pat` | 16x16 rounded flipper/paw outline over a small pink heart with two motion ticks | bubba | 5 | W3 |  |
| `bubba-smoker` | 16x16 small dark iron box smoker on legs with three grey smoke puffs rising | bubba | 5 | W3 |  |
| `cog-excogia` | 16x16 quarter-gear piece (one corner of a big 32x32 gear); four rotations join into the full Excogia when assembled | cog-board | 5 | W3 |  |
| `cog-jewel` | 16x16 faceted gem set in a gear ring; palette swap for Topaz/Ruby/Amethyst/Garnet/Emerald/Bluegem | cog-board | 5 | W3 |  |
| `cog-plain` | 16x16 eight-tooth gear with a hub hole; tier tint slot (bronze Nooby, silver Decent, gold Superb, violet Ultimate) | cog-board | 5 | W3 |  |
| `cog-tiny` | 8x8 small gear with a tier number pip, for the W7 side columns | cog-board | 5 | W3 |  |
| `cog-yang` | 16x16 light gear with a dark half-moon swirl and a faint aura ring | cog-board | 5 | W3 |  |
| `cog-yin` | 16x16 dark gear with a white half-moon swirl in the hub | cog-board, gem-shop | 5 | AW/gem-shop, W3 | `item-zen-cog` |
| `collider-threshold` | a horizontal bar of stacked crates with a red notch line across it and a small arrow spilling a dot past the line; storage threshold gauge | atom-collider | 4 | W3 |  |
| `dn-overkill-pip` | 4x6 red sword-tip pip; a row of them = damage tiers | death-note | 4 | W3 |  |
| `dn-pickle-page` | Green pickle on a torn page corner, for the (later) mini-boss tab | death-note | 4 | W3 |  |
| `dn-skull` | Base 12x12 rank skull with a dark eye pair and jaw notch; palette-swapped into the ladder below | death-note | 4 | W3 |  |
| `dn-skull-copper / -silver / -gold / -platinum / -diamond / -emerald / -lava` | Palette variants of dn-skull for ranks 1,2,3,4,5,7,10: copper brown, cool grey, gold, pale lilac-white, cyan with a sparkle pixel, green, orange-red with ember pixels | death-note | 4 | W3 |  |
| `dn-skull-eclipse` | Black skull with a thin crescent ring of rift purple behind it (rank 20, Rift) | death-note | 4 | W3 |  |
| `dn-skull-empty` | Dotted outline skull, no fill: rank 0 | death-note | 4 | W3 |  |
| `library-range-ruler` | 16x16 ruler with a bracket band over it and a small up-arrow at the right end, for the book level range bar header. | library | 5 | W3 |  |
| `library-shelf` | 32x12 wooden shelf segment with 5 spine slots; filled slots show coloured spines, empty slots a dark recess; tiles horizontally to show stored checkouts up to 20. | library | 5 | W3 |  |
| `library-vip-shelf` | 16x16 short shelf with gold trim and a velvet-rope post in front, for the locked VIP Bookshelf row. | library | 5 | W3 |  |
| `particle` | a glowing cyan dot with three thin elliptical orbit rings and two tiny electrons; the particle currency chip | atom-collider | 4 | W3 |  |
| `printer-bed` | 16x16 print-bed tile: grey frame with a nozzle over a small cube being built; lit variant has an orange nozzle tip and glowing layer line, idle variant is cold grey and empty | printer | 5 | W3 |  |
| `printer-crystal` | 16x16 sys-printer silhouette in faceted pale-cyan crystal with a second nozzle, for the Crystal 3D Printer upgrade | printer | 5 | W3 |  |
| `printer-go-brrr` | 16x16 printer front with three speed lines and stacked cubes popping out the top, for the Maestro burst | printer | 5 | W3 |  |
| `printer-sample` | 16x16 capped glass capsule with a tiny item silhouette inside and a teal liquid line; the stored-sample token | printer | 5 | W3 |  |
| `refinery-combustion` | a small orange-red flame over a dark grate; Combustion cycle chip | refinery | 5 | W3 |  |
| `refinery-polymerize` | three linked purple chain rings in a diagonal; Polymerize cycle chip | refinery | 5 | W3 |  |
| `refinery-synthesis` | a round flask with a green swirl and two bubbles; Synthesis cycle chip | refinery | 5 | W3 |  |
| `refinery-throttle` | a lever-style throttle handle pushed forward with two speed lines behind it, steel grey with a red knob | refinery | 5 | W3 |  |
| `salt-lick-blob` | a round pale-blue blobulyte with an open mouth and a pink tongue licking a white salt cube; page hero / empty state | salt-lick | 4 | W3 |  |
| `shrine-clover` | shrine with a four-leaf clover emblem, green on pale stone | shrines | 4 | W3 |  |
| `shrine-crescent` | dark shrine under a pale crescent moon with a tiny giant-skull mark | shrines | 4 | W3 |  |
| `shrine-crystal` | shrine topped by a floating cyan crystal with two sparkle pixels | shrines | 4 | W3 |  |
| `shrine-crystal-link` | a cyan beam linking two tiny shrine silhouettes, for 'Crystal speeds N shrines' | shrines | 4 | W3 |  |
| `shrine-isaccian` | stone shrine with a heart over a shield emblem, grey stone, pink heart | shrines | 4 | W3 |  |
| `shrine-pantheon` | column-fronted mini temple with a backpack emblem, sand stone | shrines | 4 | W3 |  |
| `shrine-primordial` | ancient cracked monolith with a glowing violet hourglass rune (AFK gain) | shrines | 4 | W3 |  |
| `shrine-summereading` | shrine with an open book and a small sun above it, yellow and cream | shrines | 4 | W3 |  |
| `shrine-undead` | mossy tomb-like shrine with a small skull and a circular respawn arrow | shrines | 4 | W3 |  |
| `shrine-woodular` | small wooden totem shrine with a crossed-swords emblem on its face, brown wood, red emblem | shrines | 4 | W3 |  |
| `shrine-world-tour` | a tiny shrine on a globe with a curved dotted travel arrow around it (Lab World Tour) | shrines | 4 | W3 |  |
| `skull-slush` | gear-skull in muddy grey-blue with a slush puddle under it (the slow-charging exception) | worship | 4 | W3 |  |
| `skull-wax / -ceramic / -horned / -prickle / -manifested / -glauss / -luciferian` | Palette and silhouette variants of the existing gear-skull: candle-wax cream with a drip; white glaze with a crack line; brown with two curled horns; green with thorn pixels; translucent violet with a glow outline; glassy teal with a shine… | worship | 4 | W3 |  |
| `sys-refinery (alias today)` | a squat stone furnace with a short chimney puffing one grey cloud and a white salt crystal on its hatch (replaces the item-salt alias) (replaces the item-salt alias in `SPRITE_ALIASES`) | refinery | 5 | W3 |  |
| `td-boulder-roller` | Brown ramp tower with a round grey boulder at the top | worship | 4 | W3 |  |
| `td-fireball-lobber` | Squat catapult tower with an orange fireball in the cup | worship | 4 | W3 |  |
| `td-frozone-malone` | Ice-crystal spire tower with a pale blue frost burst | worship | 4 | W3 |  |
| `td-kraken` | Tower wearing a purple squid hat with two tentacles curling outward | worship | 4 | W3 |  |
| `td-party-starter` | Tower with a disco ball top and confetti pixels | worship | 4 | W3 |  |
| `td-points` | Gold coin with a tiny tower silhouette stamped on it, the run's points | worship | 4 | W3 |  |
| `td-poisonic` | Green bubbling flask tower with a skull bubble | worship | 4 | W3 |  |
| `td-pulse-mage` | Small robed tower figure on a stone base with a blue ring pulse around its staff | worship | 4 | W3 |  |
| `td-stormcaller` | Dark tower with a cloud on top and a yellow zigzag bolt | worship | 4 | W3 |  |
| `td-voidinator` | Black obelisk tower with a violet swirl hole in its face | worship | 4 | W3 |  |
| `totem-acorn` | Totem carved from a tree stump with an acorn cap and leaf ears | worship | 4 | W3 |  |
| `totem-clash` | Stack of three dented tin cans with a bottle-cap crown, grey and red | worship | 4 | W3 |  |
| `totem-frosty` | Ice-blue totem block with icicles on the brim and a snowflake eye | worship | 4 | W3 |  |
| `totem-gorefest` | Squat wooden totem pole with a goblin face, two green eyes, a red feather on top | worship | 4 | W3 |  |
| `totem-wakawaka` | Sand-coloured stone totem with a wide grinning mouth and a sun disc | worship | 4 | W3 |  |
| `worship-charge` | Glowing purple orb with a lightning tick inside, the charge unit icon | worship | 4 | W3 |  |
| `bribe-book` | Closed ledger, dark cover, gold coin emblem, ribbon bookmark | bribes | 4 | W1 |  |
| `colo-arena-badge` | Round arena shield with an arch cut-out; 6 pal. (Dewdrop green ... Whimsical pink) | colosseum | 6 | W1 |  |
| `mg-darts` | Dartboard with one dart near the bullseye | minigames | 6 | W1 |  |
| `mg-hoops` | Basketball dropping into a hoop | minigames | 6 | W1 |  |
| `mg-penpals` | Envelope with a heart seal and a paw print | minigames | 6 | W1 |  |
| `mg-spiketrap` | Three floor spikes with a gem above | minigames | 6 | W1 |  |
| `owl-mega-reset` | Large starburst behind a feather, purple core | owl | 4 | W1 |  |
| `po-box-combat` | Crates: red with crossed swords, tan with a badge slot (skill-* overlay), teal with a gear, purple with a gold infinity | post-office | 4 | W1 |  |
| `po-box-myriad` | Crates: red with crossed swords, tan with a badge slot (skill-* overlay), teal with a gear, purple with a gold infinity | post-office | 4 | W1 |  |
| `po-box-skill` | Crates: red with crossed swords, tan with a badge slot (skill-* overlay), teal with a gear, purple with a gold infinity | post-office | 4 | W1 |  |
| `po-box-utility` | Crates: red with crossed swords, tan with a badge slot (skill-* overlay), teal with a gear, purple with a gold infinity | post-office | 4 | W1 |  |
| `po-company-alpine` | Parcel variants: leaf crate, ringed planet, slime sticker, upside-down sparkle, snowy mountain, star and rocket | post-office | 4 | W1 |  |
| `po-company-cosmic` | Parcel variants: leaf crate, ringed planet, slime sticker, upside-down sparkle, snowy mountain, star and rocket | post-office | 4 | W1 |  |
| `po-company-down-under` | Parcel variants: leaf crate, ringed planet, slime sticker, upside-down sparkle, snowy mountain, star and rocket | post-office | 4 | W1 |  |
| `po-company-dudes` | Parcel variants: leaf crate, ringed planet, slime sticker, upside-down sparkle, snowy mountain, star and rocket | post-office | 4 | W1 |  |
| `po-company-express` | Parcel variants: leaf crate, ringed planet, slime sticker, upside-down sparkle, snowy mountain, star and rocket | post-office | 4 | W1 |  |
| `po-company-simple` | Parcel variants: leaf crate, ringed planet, slime sticker, upside-down sparkle, snowy mountain, star and rocket | post-office | 4 | W1 |  |
| `po-crate-tab2` | Dark greyed crate with a padlock | post-office | 4 | W1 |  |
| `boss-gem` | a faceted pink gem with a tiny white skull notch in one corner | checklist | 7 | AW/checklist |  |
| `char-slot-empty` | a dashed-outline blob silhouette with a small '+' in the corner, an open unused character slot | family | 7 | AW/family |  |
| `do-over` | a small pointing hand pressing down with a short curved back-arrow above it (hold to refund) | talents | 3 | AW/talents |  |
| `event-box` | a small wrapped gift box with a ribbon, palette-swappable per season | checklist | 7 | AW/checklist |  |
| `event-candle` | a short purple candle with a twinkling star-shaped flame | checklist | 7 | AW/checklist |  |
| `family-bonus-arrow` | a short upward green chevron with a '+1' pixel numeral, the next-step marker | family | 7 | AW/family |  |
| `family-crest` | a shield split into four quadrants in the four line colours (grey, red, green, blue) for the family-level Big number | family | 7 | AW/family |  |
| `family-duplicate` | two overlapping blob silhouettes, the rear one greyed out, tag for a character that adds no bonus | family | 7 | AW/family |  |
| `frontier-flag` | Small pennant on a pole planted on a door arch; marks the frontier door on map rows and the Timeline | monster-afk | 3 | AW/monster-afk |  |
| `guild-bonus-node` | 16x16 hexagonal stone socket with an inner ring that fills clockwise for level progress, used as the bonus-tree node frame | guild | 7 | AW/guild |  |
| `guild-crest` | 16x16 heraldic shield split in two colours with a number plate at the bottom for the guild level | guild | 7 | AW/guild |  |
| `guild-giftbox` | 16x16 small wrapped box with a ribbon cross and a tiny tag, for weekly Guild Giftboxes and the Guild Gifts bonus | guild | 7 | AW/guild |  |
| `guild-gp` | 16x16 round token in gold with a small banner-flag emblem in the middle, the Guild Point currency mark | guild | 7 | AW/guild |  |
| `guild-members` | 16x16 three small head-and-shoulders silhouettes in a row, the middle one taller, for member count and slots | guild | 7 | AW/guild |  |
| `happy-hour` | a small round clock whose face is a smiling yellow sun | checklist | 7 | AW/checklist |  |
| `pet-crystal` | a faceted pale-violet crystal shard with a white glint, the Pet Crystal currency | pets | 7 | AW/pets |  |
| `pet-division-medal` | a round medal on a short ribbon; one grid palette-swapped bronze, silver, gold, diamond-cyan and master-purple | pets | 7 | AW/pets |  |
| `pet-mart-stall` | a little market stall with a striped awning and a paw sign, the Pet Mart header | pets | 7 | AW/pets |  |
| `pet-power` | a yellow lightning bolt over a small paw, tournament power | pets | 7 | AW/pets |  |
| `pet-raid-flame` | an orange-red flame over a crossed claw, the raid pill | pets | 7 | AW/pets |  |
| `pet-silhouette` | a generic sitting four-legged critter in flat dark grey with a '?' highlight, the unowned pet tile | pets | 7 | AW/pets |  |
| `re-frog` | a squat angry red-brown frog with slanted eyes | checklist | 7 | AW/checklist |  |
| `re-glacial` | a pale-blue ice shard helmet with a dark visor slit | checklist | 7 | AW/checklist |  |
| `re-grumblo` | a big round green brute head with heavy brows and one tooth | checklist | 7 | AW/checklist |  |
| `re-meteorite` | a grey rock with an orange flame trail toward the top-left | checklist | 7 | AW/checklist |  |
| `re-snake` | a coiled green snake with a red tongue | checklist | 7 | AW/checklist |  |
| `reset-sun` | a half sun rising over a flat horizon line with three short rays: the daily reset | checklist | 7 | AW/checklist |  |
| `reset-week` | a strip of seven small square pips in a row, one lit gold: the account week | checklist | 7 | AW/checklist |  |
| `star-reset-potion` | the reset-potion flask palette-swapped to gold liquid with a tiny white star instead of the arrow | talents | 3 | AW/talents |  |
| `symbols-of-beyond` | three small glyphs (red, green, purple) arranged in a triangle inside a thin ring | talents | 3 | AW/talents |  |
| `sys-achievements` | 16x16 gold trophy cup in front of an open scroll with three tick marks, the System and page icon | achievements | 7 | AW/achievements |  |
| `sys-checklist` | a clipboard with a metal clip and three short lines, the top two ticked green | checklist | 7 | AW/checklist |  |
| `sys-coins` | three-coin stack with a bold "x" spark top right | coins | 7 | AW |  |
| `sys-dungeons` | 16x16 stone arch gate with a dark opening and a torch on one side, group header for dungeon-linked achievements (reusable by a future Dungeons System) | achievements, dungeons | 3 | AW/achievements, AW/dungeons |  |
| `sys-event-shop` | festival stall with a gold star pennant; use a purple-and-gold awning so it does not read as sys-town-shops | event-shop (both maps drew a striped red-and-cream awning: recolour one) | 7 | AW |  |
| `sys-family` | three blob heads of different hat colours side by side under a small roof line, the Family system icon | family | 7 | AW/family |  |
| `sys-friend-bonuses` | two small figures side by side, one waving, tiny red heart above | friend-bonuses | 7 | AW |  |
| `sys-journeyman-line` | a small four-rung ladder with a lucky clover on the top rung | Beginner line page icon | 4 | CL |  |
| `sys-trophies` | gold two-handled cup on a dark stepped base, small star on the bowl | trophies-nametags | 7 | AW |  |

## `items.ts`: 143

| Name | Description | Used on | Wave | Proposed by | Merged from |
|---|---|---|---|---|---|
| `card-lv1` | item-card-frame silhouette with border colour by level: grey, bronze, silver, gold, platinum-blue, ruby, violet | cards | 5 | W2 |  |
| `card-lv2` | item-card-frame silhouette with border colour by level: grey, bronze, silver, gold, platinum-blue, ruby, violet | cards | 5 | W2 |  |
| `card-lv3` | item-card-frame silhouette with border colour by level: grey, bronze, silver, gold, platinum-blue, ruby, violet | cards | 5 | W2 |  |
| `card-lv4` | item-card-frame silhouette with border colour by level: grey, bronze, silver, gold, platinum-blue, ruby, violet | cards | 5 | W2 |  |
| `card-lv5` | item-card-frame silhouette with border colour by level: grey, bronze, silver, gold, platinum-blue, ruby, violet | cards | 5 | W2 |  |
| `card-lv6` | item-card-frame silhouette with border colour by level: grey, bronze, silver, gold, platinum-blue, ruby, violet | cards | 5 | W2 |  |
| `card-lv7` | item-card-frame silhouette with border colour by level: grey, bronze, silver, gold, platinum-blue, ruby, violet | cards | 5 | W2 |  |
| `card-mastery` | card frame with a rift swirl ring behind and a crown pip on top | cards | 5 | W2 |  |
| `card-passive` | card frame with a bold "P" on a pale circle top-left | cards | 5 | W2 |  |
| `card-set-badge` | three fanned card frames over a ribbon holding tier pips | cards | 5 | W2 |  |
| `card-unowned-x5` | dashed empty card outline with a tiny "x5" tag | cards | 5 | W2 |  |
| `egg-rarity-1..11` | item-pet-egg swaps: cream, copper, iron, gold, platinum, dementia magenta, void purple, lustre teal, starfire orange-red + star, dreadlo dark red, godshard white-gold with a light crack | breeding | 1 | W4 |  |
| `fishing-bait` | Curled pink worm on a silver hook. | skills | 3 | AW/skills |  |
| `fishing-line` | Wooden spool with wound line and a loose end. | skills | 3 | AW/skills |  |
| `item-battery` | cracked AA battery with a dim green bar (Rift Ripper quest row) | rift (Rift Ripper quest) | 1 | W4 |  |
| `item-dead-dna` | desaturated grey-violet double helix with two broken rungs | breeding | 1 | W4 |  |
| `item-dice` | pale six-sided die, slight tilt, three pips; vial discovery roll and Dungeon Loot Dice (vials' vial-dice merged) | killroy (merged), vials | 5 | W2 |  |
| `item-dream-particulate` | 16x16 small heap of glittering violet dust with three rising sparkles (Dream Particulate resource) | equinox | 4 | W3 |  |
| `item-gene` | bright teal-and-pink double helix with a sparkle pixel | breeding | 1 | W4 |  |
| `item-ladle` | wooden soup ladle, bowl bottom-left, handle up-right | cooking | 1 | W4 |  |
| `item-mirror` | 16x16 round hand mirror, silver rim and handle, a pale crescent moon reflected in a deep-violet glass | equinox | 4 | W3 |  |
| `item-mush-cap` | purple mushroom cap with pale spots (generic) | rift (Rift Ripper quest) | 1 | W4 |  |
| `item-plate-diamond` | white plate from above, cyan diamond glint at the rim (Lv 11) | cooking | 1 | W4 |  |
| `item-plate-void` | dark violet plate, pearl centre, thin gold rim (Lv 30 / max) | cooking | 1 | W4 |  |
| `item-recipe-card` | folded cream card with a bold question mark | cooking | 1 | W4 |  |
| `item-time-candy` | wrapped pink candy with twisted ends and a tiny clock face (shared: Crystal drops, Killroy Skull Shop) | islands, killroy, monster-afk, post-office (reward), star-signs | 3 | AW/monster-afk, W1, W2 |  |
| `item-trophy` | Two-handled gold cup; filled (done) and outline (not done) states | achievements, colosseum, quests, sigils, trophies collection, worn slot | 2 | AW, W1, W4 | `quests + colosseum (same)` |
| `item-wurm-tail` | segmented pink worm tail curl | rift (Rift Ripper quest) | 1 | W4 |  |
| `lab-chip-grounded / -conductive / -galvanic / -silkrode / -omega` | 12x12 chips: grey with ground symbol / copper with spark / teal with battery +- / pale with silk loop through a star / violet with our own arch glyph | lab | 1 | W4 |  |
| `lab-jewel-purple / -blue / -orange / -green / -black` | item-jewel palette swaps (violet, sapphire, pyrite orange, emerald, near-black with one glint) | lab | 1 | W4 |  |
| `node-bug` | Small winged bug over a tuft of grass with two motion dashes. | skills | 3 | AW/skills |  |
| `node-fish-pool` | Two concentric water ripples with a small fish fin breaking the surface. | skills | 3 | AW/skills |  |
| `node-ore` | Grey rock outcrop with three bright ore flecks; tinted per ore tier. | skills | 3 | AW/skills |  |
| `node-tree` | Short tree trunk with a three-lobe canopy and an axe notch; tinted per tree tier. | skills | 3 | AW/skills |  |
| `pickle-jar` | squat glass jar, green pickle inside, brown lid; also the Bob Joe Pickle altar chip (obols' item-pickle dropped) | obols (merged), vials | 5 | W2 |  |
| `rift-crown-vial` | vial with a tiny gold crown on the cork | rift | 1 | W4 |  |
| `rift-eldritch` | purple artifact shard with an eye (later-world tag) | rift | 1 | W4 |  |
| `rift-gilded-stamp` | stamp outline with a gold sheen stripe and sparkle | rift | 1 | W4 |  |
| `rift-ruby-card` | card frame with a red gem in the top corner | rift | 1 | W4 |  |
| `rift-skull-points` | bone-white skull over a violet swirl | rift | 1 | W4 |  |
| `rift-tear` | violet teardrop with a white highlight | rift | 1 | W4 |  |
| `sigil-pea-pod` | 12x12 green pea pod with three peas | sigils | 2 | W4 |  |
| `tome-nametag` | pale tag with a punched hole and string (proposed by the tome map) | tome, trophies nametag cells: draw once | 1 | AW, W4 |  |
| `tome-page-purple / -blue / -red` | loose book page with two text lines and a curled corner; purple (DMG), blue + gear dot (Skill Eff), red + coin dot (Drop Rate) | tome | 1 | W4 |  |
| `anvil-hammer` | Smith's hammer on a diagonal; lit (full colour) and unlit (outline) states | anvil | 6 | W1 | `anvil-hammer (anvil), sys-hammer (smithing)` |
| `anvil-whetstone` | Flat grey sharpening stone with a white glint stripe | anvil, town-shops | 6 | AW, W1 | `item-whetstone` |
| `cog-crate` | Open wooden crate with three cogs poking out, the cog inventory | construction | 2 | W3 |  |
| `item-anvil-product` | Spool of thread with a crossed nail; pal. per product tier | anvil | 6 | W1 | `item-craft-material (anvil), item-anvil-product (smithing)` |
| `item-anvil-tab` | Folded parchment tab with a hammer or anvil stamp and a numeral 2-7 | anvil | 6 | W1 | `anvil-tab (anvil), item-anvil-tab (smithing)` |
| `item-bar` | Metal ingot in 3/4 view; pal. copper / iron / gold / platinum / dementia | anvil, forge | 2 | W1 | `forge + smithing (same)` |
| `item-barrel` | Small oil drum, two hoops, a drip; pal. amber (speed) and green / red / violet (extra-bar) | forge | 2 | W1 | `forge + smithing (same)` |
| `item-bottle` | Corked bottle with a rolled note | islands, quests (Omar) | 2 | W1, W2 | `islands-bottle` |
| `item-carry-pouch` | belt pouch with a buckle; palette tiers grey / green / blue / purple / gold | anvil (Material Pouch), stamps (carry), storage carry matrix | 2 | AW, W1 | `item-material-pouch (stamps), item-pouch (smithing)`, `item-pouch` |
| `item-chest` | Wooden chest with an iron band and a lock plate | colosseum (chest ticks), event-shop (ids 10/11), gem-shop, gem-shop map: one sprite, quests (storage chests), storage | 2 | AW, AW/gem-shop, W1 | `item-storage-chest`, `v2-systems-chest exists in the v2 set` |
| `item-golden-food` | Palette variant of item-food: same plate shape in gold with a two-pixel white glint; marks golden food chips and the golden-food Check | coins (replaces the coins map's `golden-bread`), event-shop Gold Food bars (the stamps map's `item-golden-food`): one sprite, food, food (all 17 golden foods), monster-afk, stamps | 2 | AW, AW/monster-afk, W1 |  |
| `item-inventory-bag` | drawstring backpack, tan cloth, darker flap and strap; palette tiers brown / tan / gold / violet | event-shop Secret Pouch (gem-shop map's `item-backpack`): one sprite, gem-shop, quests (inventory bags), storage bags, town-shops (replaces `item-town-bag`) | 2 | AW, AW/gem-shop, W1 | `Distinct from item-pouch: no patch, used for inventory bags`, `item-backpack`, `item-bag` |
| `item-price-tag` | a small tilted price tag with a hole and string, gold rim, for Limited Specials slots; a red '1' ribbon variant for 1-gem freebies | gem-shop, liquids, pets | 7 | AW/gem-shop, AW/pets, W2 | `item-bargain-tag`, `pet-discount-tag` |
| `item-talent-book` | 16x16 closed hardback talent book, cover tinted per page (Beginner tan, Warrior red, Archer green, Mage blue) with a pale star emblem and page-edge stripe on the right. | islands, library, quests, weekly-battles (merged) | 2 | W1, W2, W3 |  |
| `item-ticket` | Admission ticket stub with a notched edge | colosseum, event-shop hero and Check, friend-bonuses Friendly Slot chip, quests | 2 | AW, W1 | `Reuse v2-time-ticket where the v2 set is allowed (colosseum map already does)`, `event-ticket` |
| `stamp-book-x2` | Closed book with a stamp imprint and an "x2" tag | stamps (Certified Stamp Book) | 2 | W1 |  |
| `stamp-gilded` | Gold stamp block, darker rim, two white sparkles | stamps | 2 | W1 |  |
| `stamp-tab-combat` | Stamp block with a crossed-sword glyph, red ink pad | stamps | 2 | W1 |  |
| `stamp-tab-misc` | Stamp block with a star or coin glyph, blue ink pad | stamps | 2 | W1 |  |
| `stamp-tab-skills` | Stamp block with a pickaxe glyph, green ink pad | stamps | 2 | W1 |  |
| `bubba-frozen-die` | 16x16 ice-blue cube in 3/4 view with white pips and a frosted top-left corner | bubba | 5 | W3 |  |
| `bubba-gift` | 16x16 square present with a cross ribbon and bow; six palette variants for the six gifts (red, yellow, blue, crimson, brown, purple) | bubba | 5 | W3 |  |
| `bubba-meat-slice` | 16x16 pink-red meat slab with a white fat stripe and darker rim, slight diagonal tilt | bubba | 5 | W3 |  |
| `bubba-smoked-meat` | 16x16 brown ham shank with a white bone end; five tier tints (tan, copper, red-brown, dark, gold-glazed) | bubba | 5 | W3 |  |
| `critter-shiny` | the item-critter blob silhouette in pale gold with two white four-point sparkles at its top-right | trapping | 5 | W3 |  |
| `item-critter-pouch` | a round drawstring pouch in green cloth with a small paw-print patch on the front | trapping | 5 | W3 |  |
| `item-golden-cheese` | a wedge of cheese in gold with three holes and a white shine pixel | shrines | 4 | W3 |  |
| `item-salt-tints` | palette swaps of item-salt per salt: Redox red, Explosive orange, Spontaneity yellow, Dioxide teal, Purple violet, Nullo near-black, Crosslink blue, Propagated green (one grid, 8 palettes) | refinery | 5 | W3 |  |
| `prayer-carry` | 16x16 bulging backpack with a strap. | prayers | 4 | W3 |  |
| `prayer-dungeon` | 16x16 ticket stub with a notched edge and a dot pattern (dungeon pass). | prayers | 4 | W3 |  |
| `prayer-exp` | 16x16 open book with a rising sparkle above it. | prayers | 4 | W3 |  |
| `soul-dune` | 16x16 soul flame in sand yellow/orange. | prayers | 4 | W3 |  |
| `soul-forest` | 16x16 wisp-shaped soul flame in leaf green with a darker core; palette swap of item-soul. | prayers | 4 | W3 |  |
| `soul-frigid` | 16x16 soul flame in icy pale blue with a white highlight. | prayers | 4 | W3 |  |
| `soul-rooted` | 16x16 soul flame in brown with a small root tail at the base. | prayers | 4 | W3 |  |
| `soul-squishy` | 16x16 soul flame in pink-purple, rounder blob outline. | prayers | 4 | W3 |  |
| `trap-box` | a small square wooden crate trap with a propped-open lid on a stick; neutral brown so the ladder can tint it per tier (cardboard tan to royal gold) | trapping | 5 | W3 |  |
| `currency-garbage` | crumpled grey trash bag with a brown tin can | islands | 5 | W2 |  |
| `currency-shimmer` | small golden shard with a white glint | islands | 5 | W2 |  |
| `item-arcade-ball` | silver pachinko ball, white top-left highlight, dark rim | arcade | 5 | W2 |  |
| `item-gold-ball` | same ball in gold, orange shade, sparkle pixel | arcade | 5 | W2 |  |
| `item-killroy-skull` | bone-white skull coin, red rim, crossed-dagger notch (distinct from gear-skull) | killroy | 5 | W2 |  |
| `item-omega-ball` | teal ball with a pixel omega mark | arcade | 5 | W2 |  |
| `item-pearl` | round pearl with white highlight; black and white palettes | killroy | 5 | W2 |  |
| `item-pocketwatch-gold` | round gold watch with crown stem and a +24 tick | checklist, weekly-battles | 5 | AW/checklist, W2 | `pocketwatch-gold` |
| `item-pocketwatch-silver` | same watch in grey with a small +- arrow | checklist, weekly-battles | 5 | AW/checklist, W2 | `pocketwatch-silver` |
| `item-royal-ball` | deep purple ball with a small white star | arcade | 5 | W2 |  |
| `item-ui-skin` | tiny window-frame swatch with wood-grain border, tinted per skin | weekly-battles | 5 | W2 |  |
| `killroy-room-door` | dark red arched wooden door, iron bands, tiny skull knocker | Killroy room strip | 5 | AW |  |
| `obol-circle` | four shape coins (raised rim + dot / bevelled square + diamond / thick-rim hex / four-point star token), each palette-swapped per rarity (bronze, silver, gold, platinum pale blue, dementia pink, hyper violet, boss dark red) | obols | 5 | W2 |  |
| `obol-fragment` | three small jagged silver-grey coin shards with a glint | obols | 5 | W2 |  |
| `obol-hexagon` | four shape coins (raised rim + dot / bevelled square + diamond / thick-rim hex / four-point star token), each palette-swapped per rarity (bronze, silver, gold, platinum pale blue, dementia pink, hyper violet, boss dark red) | obols | 5 | W2 |  |
| `obol-sparkle` | four shape coins (raised rim + dot / bevelled square + diamond / thick-rim hex / four-point star token), each palette-swapped per rarity (bronze, silver, gold, platinum pale blue, dementia pink, hyper violet, boss dark red) | obols | 5 | W2 |  |
| `obol-square` | four shape coins (raised rim + dot / bevelled square + diamond / thick-rim hex / four-point star token), each palette-swapped per rarity (bronze, silver, gold, platinum pale blue, dementia pink, hyper violet, boss dark red) | obols | 5 | W2 |  |
| `bribe-expansion` | Coin with a key bit on the right: the "Art of the ..." bribe | bribes | 4 | W1 |  |
| `crystal-portal` | Faceted gem on a portal ring; pal. Topaz, Quartz, Amethyst, Geode | boss-keys | 4 | W1 |  |
| `item-laurel` | Laurel wreath open at the top, gem at the bottom | colosseum (Centurion ranks) | 6 | W1 |  |
| `item-upgrade-stone` | Rounded faceted stone with a carved up-chevron; pal. by family | gear (smithing) | 6 | W1 |  |
| `key-boss` | Boss key, one grid + bow overlays; pal. forest-villa (bronze + leaf), efaunt (sand + tusk), chizoar (ice + snowflake), troll (moss + rust) | boss-keys | 4 | W1 | `key-forest-villa, key-efaunt, key-chizoar, key-troll` |
| `owl-feather` | Brown-grey quill feather on a diagonal | owl | 4 | W1 |  |
| `owl-feather-shiny` | owl-feather in pale gold with sparkles | owl | 4 | W1 |  |
| `owl-megafeather` | Wide plume in a round badge; 10 palettes (one per Megafeather) | owl | 4 | W1 |  |
| `po-delivery-box` | Brown parcel with a tape cross and a label | post-office | 4 | W1 |  |
| `po-empty-box` | Open, empty flat-packed box (unlock item) | post-office | 4 | W1 |  |
| `po-reset-box` | Parcel with a white reset arrow | post-office | 4 | W1 |  |
| `po-silver-pen` | Diagonal silver fountain pen, dark nib, glint | post-office | 4 | W1 |  |
| `poppy-bluefin` | Small blue fish facing right (Poppy currency) | poppy | 6 | W1 |  |
| `poppy-megafish` | Large fish in a round badge; 12 palettes | poppy | 6 | W1 |  |
| `poppy-shiny-fish` | poppy-bluefin in gold with sparkles | poppy | 6 | W1 |  |
| `poppy-tartar` | Dark fish with a tar drip | poppy | 6 | W1 |  |
| `statue-tools` | Hammer crossed with a chisel; pal. sculpting brown, guilding gold, onyx black, zenith cyan | statues | 4 | W1 |  |
| `boosted-run` | 16x16 paper ticket with a notched edge and a yellow lightning bolt: a boosted run. | dungeons | 3 | AW/dungeons |  |
| `coin-bank` | small iron strongbox with a coin half in the slot | coins bank pocket | 7 | AW |  |
| `coin-pile` | heap of gold coins with two highlight pixels | coins wallet total | 7 | AW |  |
| `companion-pig` | round pink pig face, front view, two nostrils, small ears (our own design) | friend-bonuses, pets map | 7 | AW |  |
| `companion-spearfish` | slim blue fish in profile with a long pointed nose | friend-bonuses, pets map | 7 | AW |  |
| `dungeon-credit` | 16x16 off-white round token with a tiny arched-door emboss and a grey rim: a Dungeon Credit. | dungeons | 3 | AW/dungeons |  |
| `flurbo` | 16x16 pink round jelly blob with a white shine dot and a small sparkle: a Flurbo. | dungeons | 3 | AW/dungeons |  |
| `food-beanstalk` | curling green vine, three leaves, one tiny gold bean at the top | food "Later" footer | 3 | AW |  |
| `food-golden-peanut` | single gold peanut shell with darker seam lines and a tiny sparkle | food Nutty Crafter goal | 3 | AW |  |
| `food-health` | sandwich wedge (tan bread, green leaf line) with a small red heart pixel above | food health rows | 3 | AW |  |
| `food-potion` | round-bottomed corked flask two-thirds full; palette red / orange / green / blue (life, strength, speed, mana) | food boost rows | 3 | AW |  |
| `gallery-podium` | three-step stone plinth, tiny trophy silhouette, four tier pips | trophies Gallery teaser | 7 | AW |  |
| `hat-rack` | wooden coat-stand, three curved pegs, one holding a small top hat | trophies Hat Rack header | 7 | AW |  |
| `item-crabby-cakey` | round golden crab cake with two tiny pincers | Bowman Speccius item | 7 | CL |  |
| `item-event-sticker` | round peel-off sticker with a curled corner and a tiny paw print | event-shop sticker rows | 7 | AW |  |
| `item-grass-leaf` | bright green blade-shaped leaf with a darker vein and tiny stem | Leaf Thief row | 7 | CL |  |
| `item-greenstack` | three stacked crates with a bright green rim glow | storage greenstacks | 3 | AW |  |
| `item-peanut` | tan double-lobed peanut shell with a darker waist line | Rocklyte meter | 4 | CL |  |
| `item-reset-fragment` | jagged pale-green glass shard of a round flask with a white glint | talent-resets, talents, town-shops | 3 | AW, AW/talents | `talent-reset-fragment` |
| `pet-portrait-ancient-golem` | a squat mossy stone golem with glowing amber eyes | pets | 7 | AW/pets |  |
| `pet-portrait-crystal-custard` | a wobbly yellow custard blob with crystal sparkles on top | pets | 7 | AW/pets |  |
| `pet-portrait-dedotated-ram` | a grey ram with curled horns and a tiny chest icon on its side | pets | 7 | AW/pets |  |
| `pet-portrait-flying-worm` | a pink segmented worm with small white wings | pets | 7 | AW/pets |  |
| `pet-portrait-gigafrog` | a big round green frog with a backpack strap (carry capacity) | pets | 7 | AW/pets |  |
| `pet-portrait-rift-jocund` | a grinning purple jester-faced wisp with a rift swirl behind | pets | 7 | AW/pets |  |
| `pet-portrait-rift-slug` | a dark teal slug with glowing rift-violet spots and antennae | pets | 7 | AW/pets |  |
| `pet-portrait-sheepie` | a fluffy white cloud-like sheep with a tiny black face, our own design | pets | 7 | AW/pets |  |
| `rng-orb` | 8x8 glass orb with a highlight, tinted by rarity via palette (grey, green, blue, purple, gold); dimmed when not found. | dungeons | 3 | AW/dungeons |  |

## `status.ts`: 85

| Name | Description | Used on | Wave | Proposed by | Merged from |
|---|---|---|---|---|---|
| `breeding-failsafe` | small white cloud with an upward green arrow | breeding | 1 | W4 |  |
| `breeding-shiny` | four-point yellow sparkle over our own round Mob-blob outline | breeding | 1 | W4 |  |
| `card-capped` | card frame with a check-in-lock badge lower right | cards | 5 | W2 |  |
| `card-preset-tab` | folder tab holding two card silhouettes (number by overlay text) | cards | 5 | W2 |  |
| `constellation-pip` | 8x8 star pip: filled gold (claimed), pulse ring (claim-ready), silver outline | star-signs | 6 | W1 |  |
| `constellation-world-badge` | 10x10 tag holding a letter A-D | star-signs | 6 | W1 |  |
| `gene-combat` | two crossed pixel swords (combat Mob on a forage team) | breeding | 1 | W4 |  |
| `gene-forager` | green leaf with footprint trail (forage-gene slot) | breeding | 1 | W4 |  |
| `lab-chip-slot` | 10x10 chip socket with pin stubs; empty dark / filled lit / locked with padlock | lab | 1 | W4 |  |
| `lab-souped-tube` | 8x8 badge: capsule with three rising orange bubbles | lab | 1 | W4 |  |
| `rift-number-badge` | violet swirl portal ring with a blank cream number plate below | gated chips, rift labels | 1 | AW |  |
| `sign-slot` | 8x8 slot ring: dashed grey (empty), solid gold (filled) | star-signs | 6 | W1 |  |
| `status-flame` | three-tongue orange/yellow flame, 8 px friendly (recipe fire progress) | cooking | 1 | W4 |  |
| `status-heart` | a chunky red heart, with an empty outline variant for a lost life | breeding, pets | 1 | AW/pets, W4 | `breeding-heart`, `pet-life-heart` |
| `status-infinite-star` | 8x8 star with an infinity loop | star-signs | 6 | W1 |  |
| `status-pip` | 5x5 diamond pip, filled or hollow; token-tinted for sigil tiers, Rift mastery, Tome bar tiers, Begone Troll! tiers | checklist, dungeons, elite-classes (Begone Troll!), merit-tasks, rift, sigils, tome | 1 | AW/checklist, AW/dungeons, AW/merit-tasks, W4 | `bank-pip`, `tier-pip`, `trait-pip` |
| `tome-bubble-stack` | three stacked bubbles with highlight dots and a small plus | tome | 1 | W4 |  |
| `tome-rank-laurel` | two green laurel branches around an empty centre | tome | 1 | W4 |  |
| `board-world-tab` | a small wooden signpost board with a blank number plate, palette-swapped per world (W1 grass green, W2 desert sand, W3 ice blue, W4 nebula purple) | merit-tasks | 2 | AW/merit-tasks |  |
| `build-slot` | Empty square frame with a small hammer in the corner, one build slot | construction | 2 | W3 |  |
| `build-slot-locked` | Build-slot frame dimmed with a padlock in the centre | construction | 2 | W3 |  |
| `build-slot-trimmed` | Build-slot frame with gold corner trims and a white sparkle, a trimmed slot | construction | 2 | W3 |  |
| `cog-boost-plus` | 8x8 overlay: a plus shape of four dots, a cog boosting its adjacent squares | cog-board, construction | 2 | W3 |  |
| `cog-flag-ring` | Small pennant flag on a pole inside a thin progress ring, a placed flag | cog-board, construction, gem-shop | 2 | AW/gem-shop, W3 | `item-flaggy` |
| `merit-token` | a round bronze token with a raised five-point star and a darker rim, distinct from the gold item-coin | merit-tasks | 2 | AW/merit-tasks |  |
| `seat-pip` | tiny stool silhouette, filled when seated, outlined when free | liquids | 2 | W2 |  |
| `source-quest` | rolled parchment scroll with a red wax seal | reusable by quests, trophies source tags | 2 | AW |  |
| `stamp-cap-raise` | Stamp block with a bold up-chevron above the handle | stamps | 2 | W1 |  |
| `status-regen` | droplet inside a circular refresh arrow | liquids | 2 | W2 |  |
| `status-reset` | Circular arrow, drawn over a base icon (owl-feather, poppy-bluefin) | merit-tasks, owl, poppy | 2 | AW/merit-tasks, W1 | `owl-restart (owl), poppy-fisheroo-reset (minigames)`, `task-reset` |
| `task-ready` | a clipboard with a bright green tick and a two-pixel glow outline, the 'Claim N' badge | merit-tasks | 2 | AW/merit-tasks |  |
| `bubba-boon-ring` | 16x16 ring split into 7 wedge segments, filled segments mint, empty dark, one highlighted for the next stack | bubba | 5 | W3 |  |
| `bubba-charisma-chart` | 16x16 hexagon radar outline with a filled irregular inner polygon in pink, six dot vertices | bubba | 5 | W3 |  |
| `library-ribbon` | 8x12 red bookmark ribbon with a forked tail, marking shelf slot 20 when Book Reservation is on. | library | 5 | W3 |  |
| `prayer-blessing` | 8x8 small upward chevron under a halo arc, green. | prayers | 4 | W3 |  |
| `prayer-curse` | 8x8 small downward chevron under a jagged arc, red. | monster-afk, prayers | 3 | AW/monster-afk, W3 | `item-prayer-curse` |
| `prayer-slot` | 12x12 stone socket: grey ring, empty dark centre (filled state draws the prayer icon inside). | prayers | 4 | W3 |  |
| `trap-shiny-row` | 8x8 badge: a white four-point sparkle on a purple circle, marks shiny-flag trap rows | trapping | 5 | W3 |  |
| `wave-flag` | Small pennant flag on a pole with a notch, for 'best wave' / 'saved at wave' tags | colosseum, worship | 4 | W1, W3 | `colo-wave-flag`, `td-wave` |
| `arcade-omega-pip` | ball with a teal triple chevron / crown (Lv 102) | arcade | 5 | W2 |  |
| `arcade-rotation` | two curved arrows chasing around a small ball (in-rotation badge) | arcade | 5 | W2 |  |
| `arcade-super` | ball with a single gold chevron above (Lv 101) | arcade | 5 | W2 |  |
| `ballot-candidate` | paper slip with a tick box; filled tick for your vote | weekly-battles | 5 | W2 |  |
| `killroy-ribbon` | short blue ribbon loop with a gold star knot (Talent Drops) | killroy | 5 | W2 |  |
| `killroy-up-dungeon` | small purple credit chip with a keyhole | killroy | 5 | W2 |  |
| `killroy-up-respawn` | tiny monster silhouette with a circular arrow | killroy | 5 | W2 |  |
| `killroy-up-skulls` | two stacked skull coins with a small plus | killroy | 5 | W2 |  |
| `obol-combine` | two small coins merging via a plus into one brighter coin | obols | 5 | W2 |  |
| `obol-reroll` | small coin circled by two curved arrows | obols | 5 | W2 |  |
| `obol-slot-empty` | dashed 1-px muted-grey shape outline (circle, square, hexagon, sparkle variants) | family, obols | 5 | AW/family, W2 | `obol-slot-circle`, `obol-slot-hexagon`, `obol-slot-sparkle`, `obol-slot-square` |
| `wb-action-attack` | red diagonal sword slash | weekly-battles | 5 | W2 |  |
| `wb-action-buff` | blue up chevron over a small potion | weekly-battles | 5 | W2 |  |
| `wb-action-misc` | green four-point sparkle | weekly-battles | 5 | W2 |  |
| `wb-difficulty-pip` | small shield with crossed swords, empty outline vs filled gold | weekly-battles | 5 | W2 |  |
| `boss-tier` | Shield chip with 1-3 pips; pal. grey Normal, purple Chaotic, gold top tier | boss-keys | 4 | W1 |  |
| `bribe-gated` | 8x8 coin pip behind an island tag: sold elsewhere | bribes | 4 | W1 |  |
| `bribe-pip` | 8x8 coin pip: filled gold (bought), outlined (available), grey with a padlock notch (locked) | bribes | 4 | W1 |  |
| `po-shield` | Small blue heater-shield pip | post-office | 4 | W1 |  |
| `po-streak` | Small orange flame badge | post-office | 4 | W1 |  |
| `statue-held-chip` | 8x8 bag with a number slot | statues | 4 | W1 |  |
| `ach-desktop-badge` | 8x8 corner badge: a tiny dark monitor with a blue screen on a stand, marks entries that complete only in the desktop (Steam) client; no Steam logo | achievements | 7 | AW/achievements |  |
| `ach-exact-stack` | 8x8 badge: two stacked crates with an equals sign beside them, marks 'exactly N' storage entries | achievements | 7 | AW/achievements |  |
| `ach-hat-recipe` | 12x12 small hat over a rolled recipe scroll, for hat recipe rewards | achievements | 7 | AW/achievements |  |
| `ach-rng-unlock` | 12x12 small treasure pouch with a question mark tag, for Dungeon RNG item unlocks | achievements | 7 | AW/achievements |  |
| `ach-secret` | 16x16 outline trophy with a white question mark on the cup, for secret entries | achievements | 7 | AW/achievements |  |
| `ach-teleport` | 12x12 violet swirl portal ring, for teleport rewards | achievements | 7 | AW/achievements |  |
| `ach-title-bg` | 12x12 tiny framed landscape (green hill, blue sky, sun), for title-screen background rewards | achievements | 7 | AW/achievements |  |
| `attack-slot` | an empty rounded square slot with a faint sword silhouette, the attack bar's empty state | talents | 3 | AW/talents |  |
| `cash-multi` | 8x8 gold "x" on a dark round chip | coins multiplicative chips, reusable for any "x" group chip | 7 | AW |  |
| `dungeon-rank` | 16x16 shield badge with a horizontal band for the rank number, stone grey with a gold edge. | dungeons | 3 | AW/dungeons |  |
| `family-guy-badge` | a tiny red heart over a house roof, marks a bonus buffed by THE_FAMILY_GUY | family | 7 | AW/family |  |
| `food-heart-trigger` | small heart half filled red with a line at the fill level | health food "eats under N% HP" | 3 | AW |  |
| `food-slot` | square tile with a rounded inner well and faint plate outline; empty state dashed | food strips | 3 | AW |  |
| `food-slot-plus` | food-slot tile with a small plus in the corner | food "More slots" pips | 3 | AW |  |
| `friend-slot` | rounded square card, gold border, small heart top left | event-shop Friendly Slot, friend-bonuses slot board, pets | 7 | AW, AW/pets | `pet-friend-slot` |
| `friend-slot-empty` | same square, dashed grey border, faint plus | friend-bonuses | 7 | AW |  |
| `level-badge` | small shield with "Lv" in two pixel letters and a star notch | classes milestones | 2 | AW |  |
| `pet-plus-badge` | a small gold rounded square with a white bold '+', the Pet+ corner badge | pets | 7 | AW/pets |  |
| `pet-token` | a round bronze coin stamped with a paw print, a thin gold rim; greyed variant for an empty slot | pets | 7 | AW/pets |  |
| `scope-account` | three tiny heads under one bracket, pale gold | drop-rate (account-wide source), reusable for any breakdown | 3 | AW |  |
| `scope-character` | one tiny head with a short underline, pale blue | drop-rate (per-character source) | 3 | AW |  |
| `shop-shelf-pip` | 8x8 crate pip: filled brown with a lid line / hollow outline | town-shops stock | 7 | AW |  |
| `status-restock` | two curved arrows chasing in a circle with a 1-letter badge slot (D daily / W weekly) in the middle | gem-shop | 7 | AW/gem-shop |  |
| `stock-bonus-gauge` | 16x4 segmented bar caps and fill tile; palettes bribe gold / stamp blue / achievement violet | town-shops | 7 | AW |  |
| `swap-token` | a round bronze coin with two curved arrows chasing each other around its face | talents | 3 | AW/talents |  |

## `stats.ts` (new grid): 20

| Name | Description | Used on | Wave | Proposed by | Merged from |
|---|---|---|---|---|---|
| `stat-accuracy` | crosshair: white ring, four ticks, red centre dot | Map badge, monster-afk, stats | 2 | AW, AW/monster-afk | `stat-hit` |
| `stat-agi` | green feather curving right with two motion lines | stats | 2 | AW |  |
| `stat-crit` | jagged yellow burst star with an orange core | stats | 2 | AW |  |
| `stat-hp` | chunky red heart, one white highlight pixel | stats | 2 | AW |  |
| `stat-luk` | four-leaf clover in two greens with a gold glint | bubbles, cauldrons, drop-rate LUK row, quests (Chungus LUK), same idea as quests' `stat-luck` and alchemy's `boost-luck`: draw once, stats | 2 | AW, W1, W2 | `boost-luck`, `stat-luck` |
| `stat-mp` | blue teardrop orb with a lighter inner swirl | stats | 2 | AW |  |
| `stat-softcap` | short upward arrow bending flat under a grey bar | Mallay/Santa Snake caps, drop-rate 5x chip tick, stats softcaps | 2 | AW |  |
| `stat-speed` | small brown boot with three speed lines trailing left | = salt-lick map's `stat-move-speed`: one sprite, Speedna gauge, salt-lick, stats | 2 | AW, W3 | `stat-move-speed` |
| `stat-str` | clenched fist, warm red-orange, white knuckle highlight | stats | 2 | AW |  |
| `stat-wis` | open blue book with a four-point sparkle | stats | 2 | AW |  |
| `stat-multikill` | three tiny skulls in a row under one sweeping slash arc; #9 row, reusable by Death Note/damage views | death-note, monster-afk, salt-lick | 3 | AW/monster-afk, W3 | `dn-multikill`, `stat-kill-per-kill` |
| `stat-class-xp` | Class EXP chip (shared; first proposed in maps/owl.json, W1) | islands, minigames (Hoops EXP), owl, statues, vault, weekly-battles | 4 | W1, W2 |  |
| `stat-drop-rate` | small loot sack with a green up-arrow (shared: weekly-battles Spillover, obols DR totals; other areas propose it too) | Character chip, also proposed by the arcade map: one sprite, arcade, drop-rate, friend-bonuses, owl, weekly-battles | 3 | AW, W1, W2 |  |
| `stat-skill-xp` | Pickaxe crossed with an up arrow | owl | 4 | W1 |  |
| `stat-drop-multi` | the stat-drop-rate pouch with a small gold "x" pip lower right | drop-rate multiplier block | 3 | AW |  |
| `stat-extra-kills` | small white skull with a green "+" | friend-bonuses | 7 | AW |  |
| `stat-kills-per-hour` | Short sword crossed over a tiny clock face; reads 'kills per hour' | monster-afk | 3 | AW/monster-afk |  |
| `stat-lowest-level` | three falling bars, shortest green with a tiny gold crown and up arrow | classes lowest-level marker | 2 | AW |  |
| `stat-respawn` | Circular arrow looping around a 4-pixel mob silhouette | monster-afk | 3 | AW/monster-afk |  |
| `stat-survival` | Pixel heart with a white plus; a cracked variant (one dark diagonal) for under 100% | monster-afk | 3 | AW/monster-afk |  |

## `talents.ts`: 28

| Name | Description | Used on | Wave | Proposed by | Merged from |
|---|---|---|---|---|---|
| `cranium-cooking` | skull-shaped cooking pot with green steam | Cranium Cooking tile and Timeline | 1 | CL |  |
| `charge-syphon` | Wizard hand drawing three small purple orbs along a curved line into the palm | Worship rows, worship | 4 | CL, W3 |  |
| `talent-eagle-eye` | a stylised yellow eye with a sharp brown brow-feather wedge above it and a tiny crosshair dot in the pupil | trapping | 5 | W3 |  |
| `archlord-coin` | gold coin stamped with crossed bones and a small up-arrow | Archlord multiplier | 7 | CL |  |
| `attack-cannonball` | round black cannonball with a lit fuse and a white shine dot | SB attack chips | 7 | CL |  |
| `attack-firebomb` | small round flask with an orange flame curling from its neck | SB attack chips | 7 | CL |  |
| `bm-ballista` | small wooden crossbow frame on two wheels, bolt loaded (low priority) | BM tab-4 block | 7 | CL |  |
| `bm-summon-whale` | round blue whale blob with a white spout (low priority: BM view only) | BM tab-4 block | 7 | CL |  |
| `buff-extendo` | bow with an extra-long arrow and a tiny crosshair at its tip | Extendo Rangeo chip | 7 | CL |  |
| `buff-strafe` | green boot with three white speed lines and a clock-hand arc | Strafe chip | 7 | CL |  |
| `cast-birthday-gift` | small wrapped present, ribbon cross, one candle flame pixel | It's Your Birthday! row | 4 | CL |  |
| `chow-pot` | squat cooking pot with steam curls and a tiny skull on the lid | Chow rows | 7 | CL |  |
| `eclipse-ring` | black disc with a thin bright crescent rim and ten ticks | Enhancement Eclipse track | 4 | CL |  |
| `hand-left` | open left palm in blue with a small book glyph above (skill EXP) | Hands matrix | 4 | CL |  |
| `hand-right` | open right palm in orange with a small gear glyph above (efficiency) | Hands matrix | 4 | CL |  |
| `orb-remembrance` | glowing violet orb with a curve of white tally ticks | DK orb kills | 7 | CL |  |
| `preset-swap` | two stacked cards with a curved two-way arrow | any swap step, trap-preset strip | 7 | CL |  |
| `speedna-ruler` | horizontal ruler with tall gold ticks and a small boot marker | Speedna gauge | 7 | CL |  |
| `talent-breakpoint` | short ruler bar with even notches, one lit yellow | Throttle / Zow / any intervalAdd talent | 7 | CL |  |
| `talent-cap-raise` | level bar with a bold end notch and an up-arrow lifting an extra segment past it | bubble-capped rows, every max-level raiser, talents | 3 | AW/talents, CL | `talent-max-raise` |
| `talent-curve` | a tiny line graph rising fast then flattening under a dashed cap line, one bright dot on the curve | talents | 3 | AW/talents |  |
| `talent-npng` | cracked red heart with a small up-arrow beside it | No Pain No Gain warning | 7 | CL |  |
| `talent-reset-potion` | a round-bottom corked flask with swirling purple liquid and a small white circular arrow on the glass | talents | 3 | AW/talents |  |
| `talent-tab-5` | master-tab emblem matching talent-tab-1..4: a five-point crown over a small shield, purple and gold | talents | 3 | AW/talents |  |
| `talent-veins` | anvil with a glowing red-orange vein running through it (one design; the bowman and hunter maps proposed variants) | Veins rows (Archer line) | 7 | CL |  |
| `void-portal` | dark violet oval portal ring, lighter swirl, stopwatch tick on top | speedrun panel | 4 | CL |  |
| `wormhole-swirl` | violet-black spiral disc with a small white star at centre | ES wormhole kills | 7 | CL |  |
| `zow-skull` | small horned skull with a red tally mark beneath | Zow count badge | 7 | CL |  |

## `alchemy.ts`: 24

| Name | Description | Used on | Wave | Proposed by | Merged from |
|---|---|---|---|---|---|
| `vial-crown` | small gold three-point crown badge (level 13) | vials | 1 | W2 |  |
| `vial-flask` | round-bottom corked flask, lower half filled; palette-swapped per liquid (water blue, nitrogen pale cyan, seawater teal, mercury silver-grey) | vials | 1 | W2 |  |
| `vial-green-ring` | 1-px bright green ring overlay (level 4+, Virile Vials) | vials | 1 | W2 |  |
| `vial-multiplier` | flask with a gold "x" sparkle beside it | vials | 1 | W2 |  |
| `vial-shelf` | wooden plank shelf strip with two brackets, tiles horizontally | vials | 1 | W2 |  |
| `boost-cost` | gold coin with a bold minus sign (kept distinct from item-bargain-tag) | bubbles, cauldrons | 2 | W2 |  |
| `boost-extra` | two overlapping small bubbles with a tiny "x2" pip | bubbles, cauldrons | 2 | W2 |  |
| `boost-speed` | cauldron silhouette with three horizontal speed lines behind it (cauldrons map's arrow-on-gold-badge variant dropped) | bubbles, cauldrons | 2 | W2 |  |
| `brew-drop` | wooden ladle tipping one thick purple-violet drop with two lighter bubble dots | bubbles (merged), cauldrons | 2 | W2 |  |
| `bubble-band-ring` | 1-px gold progress-ring overlay for % of max | bubbles | 2 | W2 |  |
| `bubble-big` | larger bubble, thick dark outline, socket notch at the bottom; same four palettes | bubbles | 2 | W2 |  |
| `bubble-slot` | empty round socket: dashed grey ring on a dark disc | bubbles | 2 | W2 |  |
| `bubble-small` | round translucent bubble, highlight arc top-left; palette-swapped per cauldron (orange, green, purple, yellow) | bubbles | 2 | W2 |  |
| `cauldron-bleach` | liquid cauldron with a white rim and two white sparkle dots | liquids | 2 | W2 |  |
| `cauldron-dragonic` | dark cauldron with a small red wing and green scale dots on the rim | liquids | 2 | W2 |  |
| `cauldron-ivory` | cream-white bubble cauldron with a gold rim line and two seat dots | cauldrons, liquids (merged) | 2 | W2 |  |
| `decant-cap` | liquid tube with a bold up-chevron on its rim | liquids | 2 | W2 |  |
| `decant-rate` | droplet with three speed lines trailing left | liquids | 2 | W2 |  |
| `liquid-shop` | small market stall with striped awning and hanging droplet sign | liquids | 2 | W2 |  |
| `nblb-gift` | bubble with an up chevron and a small calendar tick, daily free levels | bubbles | 2 | W2 |  |
| `new-bubble-roll` | translucent round bubble, white highlight, dark question mark | cauldrons | 2 | W2 |  |
| `bubble-breakthrough` | blue bubble with a white crack and a yellow spark bursting out | Breakthrough tile, odds chip | 7 | CL |  |
| `busy-brewin` | wooden spoon stirring a cauldron with three speed lines | Busy Brewin' tile, seat badge | 7 | CL |  |
| `liquid-rate-chip` | 12x12 droplet with a small upward arrow | Salt Lick rate chips | 7 | AW |  |

## `statues.ts` (new grid): 23

| Name | Description | Used on | Wave | Proposed by | Merged from |
|---|---|---|---|---|---|
| `statue-anvil` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-beholder` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-box` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-bullseye` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-cauldron` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-egg` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-ehexpee` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-exp` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-feasty` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-grade palettes` | Four palettes for every statue grid: stone grey, gold, onyx (black, violet edge), zenith (white, cyan glow) | statues | 4 | W1 |  |
| `statue-health` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-kachow` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-lumberbob` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-mining` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-mutton` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-oceanman` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-ol-reliable` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-pecunia` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-power` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-seesaw` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-speed` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-thicc-skin` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |
| `statue-twosoul` | One 16x16 figure per W1-W4 statue on the shared item-statue plinth (descriptions in maps/statues.json) | statues | 4 | W1 |  |

## `mobs.ts` (new grid): 16

| Name | Description | Used on | Wave | Proposed by | Merged from |
|---|---|---|---|---|---|
| `mob-greenie-genie` | green genie torso on a wisp tail, gold chain, sunglasses | elite-classes | 1 | W4 |  |
| `mob-giant` | mob-generic drawn one size up (16x16) with a three-point crown; giant chance line on the fighter sheet | monster-afk, prayers | 3 | AW/monster-afk, W3 | `prayer-giant` |
| `crystal-mob` | chunky cyan crystal blob with two dark eyes | islands, monster-afk, statues (drop sources) | 3 | AW/monster-afk, W1, W2 | `item-crystal-mob` |
| `killroy-prime` | skull with a small rift-purple crown | killroy | 5 | W2 |  |
| `wb-boss` | squat horned silhouette with one big eye, palette-swapped per boss (9 tints) | weekly-battles | 5 | W2 |  |
| `boss-amarok` | Our own designs: grey wolf head, sand elephant skull with tusks, ice-crystal creature, green troll behind a shield | boss-keys | 4 | W1 |  |
| `boss-chizoar` | Our own designs: grey wolf head, sand elephant skull with tusks, ice-crystal creature, green troll behind a shield | boss-keys | 4 | W1 |  |
| `boss-efaunt` | Our own designs: grey wolf head, sand elephant skull with tusks, ice-crystal creature, green troll behind a shield | boss-keys | 4 | W1 |  |
| `boss-troll` | Our own designs: grey wolf head, sand elephant skull with tusks, ice-crystal creature, green troll behind a shield | boss-keys | 4 | W1 |  |
| `mini-biggie-hours` | Melting snow mound, toxic mushroom, mummy head with a crown, cracked hourglass with eyes | boss-keys | 4 | W1 |  |
| `mini-king-doot` | Melting snow mound, toxic mushroom, mummy head with a crown, cracked hourglass with eyes | boss-keys | 4 | W1 |  |
| `mini-mush` | Melting snow mound, toxic mushroom, mummy head with a crown, cracked hourglass with eyes | boss-keys | 4 | W1 |  |
| `mini-slush` | Melting snow mound, toxic mushroom, mummy head with a crown, cracked hourglass with eyes | boss-keys | 4 | W1 |  |
| `mob-generic` | 12x12 round blob monster, two white eyes and a small mouth, one flat body colour (palette-swappable per world); fallback monster face for map rows | monster-afk | 3 | AW/monster-afk |  |
| `mob-green-mushroom` | generic green-capped mushroom critter with two dot eyes | Nebulyte 12M meter | 4 | CL |  |
| `mob-plunderous` | generic blob monster with a tiny black tricorn hat and gold glint | Plunderous kills | 7 | CL |  |

## `npcs.ts` (new grid): 7

| Name | Description | Used on | Wave | Proposed by | Merged from |
|---|---|---|---|---|---|
| `npc-eliteus` | front-facing hooded figure, dark green robe, gold sash, raised pointing hand | elite-classes | 1 | W4 |  |
| `quest-npc` | Hooded head with a yellow "!" bubble | quests | 2 | W1 |  |
| `npc-postboy` | Our own courier figure: cap, satchel, parcel | post-office | 4 | W1 |  |
| `npc-cactolyte` | green cactus-shaped figure, two arm stubs, same club badge | Maestro ladder | 4 | CL |  |
| `npc-nebulyte` | dark purple cloud figure dotted with white star pixels, club badge | Voidwalker ladder | 4 | CL |  |
| `npc-rocklyte` | grey boulder-shaped figure, stubby arms, tiny club badge | Journeyman ladder | 4 | CL |  |
| `npc-speccius` | front-facing sand-yellow robed figure with a scroll under one arm | subclass step on every card | 7 | CL |  |

## `places.ts`: 13

| Name | Description | Used on | Wave | Proposed by | Merged from |
|---|---|---|---|---|---|
| `place-telescope` | Brass telescope on a tripod on a branch, pointing at a star | star-signs | 6 | W1 | `Check v2-systems-telescope (v2 art set) first; reuse it if the v2 set may appear on System pages` |
| `island-crystal` | one shared tiny-island base (sand + water line) with a swapped top object: garbage heap with fish skeleton / purple question block / three pale-cyan crystals / icy island with teal wave and leaping fish / gold sparkle over a stone pedestal / magenta square spiral | islands | 5 | W2 |  |
| `island-fractal` | one shared tiny-island base (sand + water line) with a swapped top object: garbage heap with fish skeleton / purple question block / three pale-cyan crystals / icy island with teal wave and leaping fish / gold sparkle over a stone pedestal / magenta square spiral | islands | 5 | W2 |  |
| `island-rando` | one shared tiny-island base (sand + water line) with a swapped top object: garbage heap with fish skeleton / purple question block / three pale-cyan crystals / icy island with teal wave and leaping fish / gold sparkle over a stone pedestal / magenta square spiral | islands | 5 | W2 |  |
| `island-seasalt` | one shared tiny-island base (sand + water line) with a swapped top object: garbage heap with fish skeleton / purple question block / three pale-cyan crystals / icy island with teal wave and leaping fish / gold sparkle over a stone pedestal / magenta square spiral | islands | 5 | W2 |  |
| `island-shimmer` | one shared tiny-island base (sand + water line) with a swapped top object: garbage heap with fish skeleton / purple question block / three pale-cyan crystals / icy island with teal wave and leaping fish / gold sparkle over a stone pedestal / magenta square spiral | islands | 5 | W2 |  |
| `island-trash` | one shared tiny-island base (sand + water line) with a swapped top object: garbage heap with fish skeleton / purple question block / three pale-cyan crystals / icy island with teal wave and leaping fish / gold sparkle over a stone pedestal / magenta square spiral | islands | 5 | W2 |  |
| `obol-altar` | short stone pedestal with a round coin on top and a faint glow | obols | 5 | W2 |  |
| `monolith` | Dark upright slab with one glowing rune | statues (Monolith goals) | 4 | W1 |  |
| `statue-man` | Tall marble figure holding a chisel: the deposit spot marker | statues | 4 | W1 |  |
| `dungeon-crypt` | 16x16 sandstone sarcophagus lid with a coiled snake outline: Crypt of Snakenhotep. | dungeons | 3 | AW/dungeons |  |
| `dungeon-frog` | 16x16 green frog head with a tiny gold crown: Grandfrog's Gazebo. | dungeons | 3 | AW/dungeons |  |
| `dungeon-ice` | 16x16 pale blue ice block with a cracked corner and a frost glint: Glacial Basement. | dungeons | 3 | AW/dungeons |  |

## `classes.ts`: 1

| Name | Description | Used on | Wave | Proposed by | Merged from |
|---|---|---|---|---|---|
| `promotion-chain` | three ascending stone steps with a chevron climbing them and a small star on top | Class lines stepper header | 7 | CL |  |

## `gear.ts`: 3

| Name | Description | Used on | Wave | Proposed by | Merged from |
|---|---|---|---|---|---|
| `gold-set` | gold helmet over a gold chest-plate edge | coins Gold set lever | 7 | AW |  |
| `item-premium-hat` | short top hat with a coloured band and one bright gem pixel | trophies hat cells | 7 | AW |  |
| `keychain` | 16x16 metal key ring with a short chain and a small round charm. | dungeons | 3 | AW/dungeons |  |

## `skills.ts`: 2

| Name | Description | Used on | Wave | Proposed by | Merged from |
|---|---|---|---|---|---|
| `skill-mastery` | Round medal with a ribbon tail and a small star; rank shown by palette tint (bronze..cyan), 16x16. | skills | 3 | AW/skills |  |
| `skill-trapping, -construction, -worship, -cooking, -breeding, -laboratory, -sailing, -divinity, -gaming, -farming, -sneaking, -summoning` | trap box, hammer+brick, totem, pan, egg, flask, anchor, halo, controller, sprout, mask, summoning circle (shared with the skills map) | rift (Skill Mastery grid), skills | 1 | W4 |  |
