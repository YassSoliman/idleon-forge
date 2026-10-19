# Game art: the real game sprites, in one folder the GPL doesn't cover

**Superseded 2026-10-19 by the owner's ruling below.** The original 2026-10-17 decision ("no game art
is committed to this repo, ever") is kept at the end for the record.

## The ruling (2026-10-19)

ActiveOn uses **the game's own sprites** for the things the game draws: items (gear, materials, stamps,
statues), cards, talents, bubbles, vials, class icons and monsters. Our own pixel art stays for UI
chrome the game has no sprite for (pips, status glyphs, places, the blob avatars) and is the fallback
whenever a game sprite is missing.

The owner's words: "we re-use in-game art, override that ADR, Toolbox uses real sprites, let's do the
same." IdleOn Toolbox, the community tool our parsers come from, ships the game's sprites in its own
public GPL-3.0 repository and serves them from its own site, and has done so for years; ActiveOn does
the same, for the same kind of fan-made, read-only companion tool.

## The rules that make it safe to do in a GPL repository

1. **One folder, clearly not ours.** Every game image lives in `apps/activeon/public/game-art/` and
   nowhere else. Its `NOTICE.md` says: "Legends of IdleOn art © LavaFlame2. Not covered by this
   repository's GPL-3.0 licence. Used as IdleOn Toolbox does, for a fan-made, read-only companion
   tool." The README's Licence section points at it, so the GPL never claims these files and a fork
   inherits the notice.
2. **Copied by script, from the pin.** `scripts/game-art/sync.mjs` copies the files from Toolbox's image
   folder at the commit pinned in `packages/toolbox-parsers/UPSTREAM` (one sparse, shallow fetch),
   renames each to the id ActiveOn already holds (item rawName, card rawName, talent skillIndex,
   bubble rawName, vial level, class index, monster rawName) and writes `manifest.json`. Never
   hand-add, edit or redraw a file in that folder; a parser re-sync re-runs the script.
3. **Only what we draw.** The seven kinds above, byte for byte (Toolbox's PNGs are already palette-
   compressed). No backgrounds, UI frames, fonts, music or animations.
4. **Self-hosted, lazy, never bundled.** Served from our own origin (CSP `img-src 'self'` unchanged),
   `loading="lazy"`, never imported into JS, so the first-load budget doesn't move. No runtime
   hotlinking of Toolbox's site, the wiki or any other third party.
5. **Always a fallback.** `<GameIcon>` draws our own sprite when an id names no file or the file fails,
   so a new item the pin doesn't have yet never leaves a hole.
6. **Credited and removable.** "Not affiliated with or endorsed by LavaFlame2" stays in the README. If
   LavaFlame2 asks us to remove or change the use, we do so at once: the folder can go in one commit and
   every icon falls back to our own art.

## What is and isn't established (Sources)

- IdleOn Toolbox's repository (GPL-3.0) commits about 17,000 game PNGs under `public/data/` and about
  400 monster folders under `public/monsters/`, served from idleontoolbox.com; its README carries no
  separate art licence or credit line. Checked at commit 6c37e3d, 2026-10-19:
  <https://github.com/Morta1/IdleonToolbox>.
- We have **not** found written permission from LavaFlame2 for fan tools to use the game's art, and
  the research pass that ADR 0009 called for was stopped by this ruling before it covered the game's
  terms. The decision rests on the owner's judgment and long-standing community practice, not on a
  licence. Toolbox's practice is precedent, not permission.

Ruled by the owner on 2026-10-19 (M25).

## The original decision (2026-10-17, superseded)

IdleOn's art (sprites, icons, fonts, UI frames) belongs to LavaFlame2. Our repo is public and GPL-3.0, and committing the game's art there would publish it under a licence we can't grant. So **no game art is committed to this repo, ever**. ActiveOn's production UI uses **original pixel art in the IdleOn style** that we draw ourselves (SVG or PNG generated from a pixel grid in the repo, like the bot avatars in `docs/setup/bot-avatars/`), which we can license under GPL-3.0.

Real game sprites may be used **only in private design explorations** (unshared Claude artifacts, local mockups) that are never committed or published, to compare our art against the real thing.

We considered loading the game's own icons at runtime from a third party, the way IdleOn Toolbox does (not committed here). That stays **open**: a research pass on LavaFlame2's stated stance on fan tools using game art decides it. If it's allowed, a later amendment can permit runtime loading for item and monster icons, never committed and always credited. Until then: our own art only.

Ruled by the owner on 2026-10-17 while starting the UI/UX design track ("ActiveOn Design Lab").
