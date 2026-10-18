# ActiveOn pixel art: house style and motif list

Our own IdleOn-style pixel art for the Design Lab, and for anything we might ever share. It follows
ADR 0009 (never commit game art; our originals for anything shareable) and the measurements in
`../research/visual-language.md` (sections 1 and 5). Game sprites in `../ref/` are private references:
look at them to understand the feel, then close them. **Never trace, eyedrop or embed them.**

## 1. Rules for every piece

**Grids and scale**
- UI glyphs are 16x16. Feature motifs (Goal seals, Focus, Walkthrough) are 24x24. Illustrations
  (empty, error, mascot, celebration) are 32x32, 48x48 at most. This is deliberately not the game's 36x36
  icon grid.
- Render at integer scale only. 2x is the default (`--icon-16: 32px`, `--icon-24: 48px`,
  `--icon-32: 64px`); a 16 px glyph may sit inline at 1x. Never scale to a fraction.
- Author pieces as inline SVG `<rect>` grids, one rect per run of pixels, with
  `shape-rendering="crispEdges"` and the `.lab-px-art` class. Fills are CSS variables, never hexes, so
  one drawing recolours by direction, tier and world.

**Colour**
- Every piece uses a four-slot ramp: `--px-outline`, `--px-shadow`, `--px-base`, `--px-hi`. The
  ramps are the tier ramps (`--tier-bronze-*` … `--tier-majestic-*`) or the materials (`--mat-wood-*`,
  `--mat-stone-*`, `--mat-leaf-*`, `--mat-blob-*`, `--mat-fire-*`) in `../tokens.css`. Eyes use
  `--mat-eye-white` and `--mat-eye-pupil`.
- At most 6 colours per 16 px glyph, 8 per 24 px motif and 12 per 32 px illustration, counting the
  outline.
- Shift hues: shadows go cooler (toward blue or violet), highlights warmer (toward yellow). There is no
  pillow shading, no gradient inside a sprite and no anti-aliasing. 2x2 checker dither is allowed only on
  32 px and larger backgrounds.

**Line and light**
- Use one 1 px outline in the material's darkest tone (hue-shifted, not black). Pure `--px-ui-ink` is
  allowed only on 16 px UI glyphs, where crispness beats warmth.
- Outline selectively: on 24 px and larger pieces, drop the outline on the lit top-left edge. Add
  interior lines only where they separate parts.
- Light comes from the top-left: a 3-tone ramp plus at most one specular cluster.
- Keep slopes clean (1:1, 1:2, 2:1) with no stray single-pixel jaggies. Silhouettes must read at 1x.
  "Rounded" means a 1-2 px notch, never a curve.

**Character**
- Cute and goofy, like the game: big round eyes (2x2 white, 1 px pupil), stubby blobby bodies, objects
  that smile.
- Draw generic things only. Never recreate a named IdleOn NPC, monster, boss, class sprite, item, logo or
  wordmark. "An anvil" is fine; "the game's anvil sprite" is not.
- The guide NPC is our own mascot: a round-eyed blob in a scout hat (blob ramp). It is the only
  recurring character.

**Motion**
- Use 2-4 frame loops at 4-6 fps with stepped timing (`--px-steps-4`, `--px-frame-4fps`): a 1 px bob, a
  blink, a flicker. Never tween pixel art.
- Every loop pauses under `prefers-reduced-motion` (`--px-anim-state`). Celebrations play once
  (`--dur-celebrate`) and never loop.

**Meaning (principle P12)**
Each piece on screen must answer "what kind of thing", "what state" or "which world or tier". If it
answers none of these, cut it.

**Per-direction use**
| | Quest Log | Field Guide | Command Board |
|---|---|---|---|
| Where art appears | Everywhere it means something: seals, portraits, frames, mascot, celebrations | Icon size only, plus the wordmark and one mascot bust on empty and error states | 16 px glyphs in columns and lanes; no illustrations except the error gremlin |
| Default ramp | bronze (warm) | blob (cool) | stone (neutral) |
| Scale | 2x, 3x for heroes | 1x inline, 2x in cards | 1x in grid cells |

**File convention (when drawn)**
`art/<group>/<motif>-<grid>.svg`, for example `art/now/anvil-16.svg`. Each SVG uses
`viewBox="0 0 16 16"`, carries no width or height, and has a `<title>` naming what it shows. Each group
also keeps a `sheet.html` contact sheet of its motifs at 1x, 2x and 4x in all three directions.

## 2. Motifs each design group must draw

Grid sizes are the authored sizes. "States" are the variants that must exist as separate frames or
recolours. Numbers in brackets refer to the list of 20 in visual-language.md section 6.

### Group "now" (Now screen: header, Stage badge, chips, verdict, Roster, caps, Verdict strip, Focus)
| Motif | Grid | States | Used by |
|---|---|---|---|
| ActiveOn wordmark (pixel lettering, our own) | 8 px cap height | light, dark | `now.header` |
| Hourglass / pixel clock [10] | 16 | idle, 2-frame sand | `now.return-chips`, save-age fuse |
| Campfire with "zZ" [11] | 24, 32 | 3-frame flicker loop | `now.verdict-banner` all-set |
| Warning bell with wrench [12] | 16, 24 | still, 2-frame ring | `now.verdict-banner` fix, Fix pill |
| Verdict glyphs: check, wrench, question, stale clock | 16 | ready, fix, unknown, stale | `now.verdict-pill`, strip, segments |
| World crest, W1-W7 (a generic shield, recoloured by `--w1`…`--w7`) | 16 | 7 world recolours | `now.stage-badge`, map tags |
| Map pin / signpost [13] | 16 | default, "you are here" | `now.focus-identity`, Walkthrough |
| Class portraits: warrior, archer, mage, journeyman, beginner silhouettes, plus a subclass badge | 16, 24, 32 | idle, playing (1 px bob), greyed | `now.class-portrait`, rows, strip, timeline lanes |
| AFK Target icons: crossed swords [19], pickaxe, axe, rod [18], net, pot, flask, lotus, lamp | 16 | active, idle | `now.roster-row`, timeline |
| Cap kind icons: anvil [1], worship skull [2], trap [3], chest [15] | 16 | full, soon, fine | `now.cap-pills` |
| Pixel fill bar (8 segments) | 8 x 32 | 0-8 filled, in ok, warn, bad | cap gauge, current step |
| Coin, by tier ramp [6] | 16 | bronze, silver, gold, platinum, ruby, majestic | `now.spend-chip` |

### Group "cards" (Goal cards, why, Sources, actions, Walkthrough, Spend Plan, Builds, Printer, Account, Not covered)
| Motif | Grid | States | Used by |
|---|---|---|---|
| Kind seals: bell (Fix), coin stack (Spend), star pip (Grow) [20], chest (Extra) [15] | 24 | 4 kinds, plus a skipped seal with a "Zz" overlay | `cards.goal-card` |
| Guide NPC mascot bust [17] | 32 | talk (2-frame mouth), think, cheer | `cards.why-sheet` (Quest Log speech box) |
| Speech tail (stepped, 3 steps) | 8 x 8 | left, right | `.lab-speech` |
| Source signposts: book (wiki), gear (calculated), scroll (our research) | 16 | default, stale (greyed) | `cards.source-label` |
| Trust pips | 8 | 1-4 filled | `cards.source-label` |
| "Sources disagree" crossed signposts | 16 | — | `cards.contested` |
| Zz snooze mark | 8 | — | `cards.action-controls` |
| Quest scroll with checkbox [14] | 16, 24 | open, ticked | `cards.walkthrough-step` |
| Path stones | 16 | done, now (lit, 2-frame glow), after (dim), blocked | `cards.walkthrough` |
| Requirement marks: have (check), elsewhere (chest with an arrow), missing (cross) | 16 | 3 states | `cards.walkthrough-step`, `cards.requirement-tree` |
| Item tile frame (blank tile with a count badge; contents are generic, ours) | 24 | have, missing (red outline) | `cards.requirement-tree` |
| Coin stack by tier [6] and a merchant's ledger | 16, 24 | best buy (gold stamp), save up for, rest | `cards.spend-plan`, `cards.spend-line` |
| Spellbook with bookmark [16] | 24 | in use, suggested | `cards.builds` |
| 3D printer with a cube [4] | 24 | idle, printing (2-frame) | `cards.printer-plan` |
| Card with tier pips [7], stamp [8], cauldron [9], pet egg [5] | 16, 24 | tier recolours | Goal seals by System |
| Magnifying glass | 16, 24 | — | `cards.not-covered`, `now.focus-unknown` |
| Small cheer (confetti burst, plays once) | 32 | 4 frames | Walkthrough finished |

### Group "flows" (sign-in, paste, loading, empty, error, stale, forms, footer, What's new, new views)
| Motif | Grid | States | Used by |
|---|---|---|---|
| Broken-save gremlin | 32 | 2-frame shrug | `flows.cant-read`, `flows.cant-work-out` |
| Sleeping blob (mascot asleep) | 32 | 2-frame breathe | `flows.empty` |
| Walking blob | 32 | 4-frame walk | `flows.loading` |
| Device-code key / padlock | 24 | locked, open | `flows.sign-in` |
| Clipboard with a page | 24 | empty, filled | `flows.paste-save` |
| Faded clock ("as of") watermark | 24 | — | `flows.stale` |
| Lightbulb (Idea), cracked gear (Something's wrong), question cloud (Confusing) | 24 | — | `flows.suggest-form`, `flows.report-form` |
| Notice board with pinned notes and stamps (planned, done, won't do) | 32 | — | `flows.your-suggestions` |
| Patch-notes scroll | 24 | — | `flows.whats-new` |
| Wax seal tick | 16 | unticked, ticked | `flows.session-checklist` |
| Door in / door out (log in, log off pause points) | 24 | — | `flows.session-checklist` tabs |
| Timeline marks: now line cap, "back at" flag, overflow spark | 8, 16 | — | `flows.afk-timeline` |
| Moon and stars (away), sunrise (back) | 24 | — | `flows.away-card` |
| Fan-made badge (a generic hammer on an anvil; no game marks) | 16 | — | `flows.footer` |

## 3. Review checklist for any drawn piece
1. On the right grid, at integer scale, with `crispEdges` rendering.
2. Colours come only from token ramps, within the colour limit, with hue-shifted shading.
3. Not traced, not eyedropped, not a named game thing. Compare it against nothing in `../ref/` while
   drawing.
4. Answers "what kind", "what state" or "which world or tier".
5. Reads at 1x in all three directions, light and dark.
6. Any loop has 2-4 frames, stepped timing, and pauses under reduced motion.

## 4. Added for the app (M21 Phase F, 2026-10-18)
Every file listed in `MANIFEST.json` is our own drawing (ADR 0009); most `<title>`s only name the
object, so the manifest, not the titles, is what the app's art guard test checks. These were drawn for
the app in the house style above:
- `ui-theme-sun.svg`, `ui-theme-moon.svg`: the header's light/dark toggle (owner addition). A pixel sun
  with rays on the gold ramp and a crescent moon with a star on the silver ramp; 16 grid, 2 frames at
  4 fps (the rays shift, the star twinkles), still under reduced motion.
- `ui-arrow-right.svg`, `ui-arrow-left.svg`, `ui-check.svg`: "→", "←" and "✓", because the latin font
  subsets the app ships don't have those characters (M21 V-5). 16 grid, `currentColor`, so they take the
  text colour.

Fixes to Lab files on import (no pixel changes):
- `v2-systems-cauldron.svg`, `v2-time-cauldron.svg`: the brew fills with `var(--pot-liquid, …)`, as
  `v2-systems-pot-24.svg` already did, so each cauldron's colour can set it (owner addition: Power
  orange, Quicc green, High-IQ purple, Kazam yellow).
- `cards-zz.svg`, `cards-speech-tail-left.svg`, `cards-speech-tail-right.svg`: an empty `svg{}` style
  block removed (the repo's linter rejects empty blocks).

`node scripts/art/import.mjs --manifest` rewrites `MANIFEST.json`; a person runs it only when adding a
drawing of our own.
