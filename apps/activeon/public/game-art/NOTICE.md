# Game art: not covered by this repository's licence

**Legends of IdleOn art © LavaFlame2. Not covered by this repository's GPL-3.0 licence. Used as IdleOn
Toolbox does, for a fan-made, read-only companion tool.**

Every image in this folder (`data/`, `etc/`, `monsters/`, `afk_targets/`, `npcs/`, `player-sprites/`)
is a sprite from the game Legends of IdleOn by LavaFlame2 (Lavaboots). IdleOn Forge does
not own it and does not license it: the GPL-3.0-only licence of the rest of this repository does not
apply to these files, and nothing in this repository grants any right to them. If you fork or
redistribute this repository, these files carry their owner's rights, not ours.

- **Where they come from:** [IdleOn Toolbox](https://github.com/Morta1/IdleonToolbox)'s image folder
  (its `public/` image folders, minus Toolbox's own site screenshots), at the Toolbox commit pinned in
  [`packages/toolbox-parsers/UPSTREAM`](../../../../packages/toolbox-parsers/UPSTREAM), mirrored with
  Toolbox's own folder and file names by
  [`scripts/game-art/sync.mjs`](../../../../scripts/game-art/sync.mjs). Each PNG is re-encoded as
  lossless WebP and checked pixel for pixel against the original; GIFs are copied as they are.
  `manifest.json` lists every file and the pin.
- **How ActiveOn uses them:** as icons beside the words they illustrate, served from ActiveOn's own
  origin, loaded lazily. ActiveOn never hotlinks another site's images.
- **Not affiliated with or endorsed by LavaFlame2.** If you are the rights holder and want these
  removed or credited differently, open an issue on this repository and we will act on it.

Why this folder exists, and its rules: [ADR 0009](../../../../docs/adr/0009-game-art.md).
