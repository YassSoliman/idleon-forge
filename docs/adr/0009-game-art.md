# Game art stays out of the repo; production uses our own IdleOn-style pixel art

IdleOn's art (sprites, icons, fonts, UI frames) belongs to LavaFlame2. Our repo is public and GPL-3.0, and committing the game's art there would publish it under a licence we can't grant. So **no game art is committed to this repo, ever**. ActiveOn's production UI uses **original pixel art in the IdleOn style** that we draw ourselves (SVG or PNG generated from a pixel grid in the repo, like the bot avatars in `docs/setup/bot-avatars/`), which we can license under GPL-3.0.

Real game sprites may be used **only in private design explorations** (unshared Claude artifacts, local mockups) that are never committed or published, to compare our art against the real thing.

We considered loading the game's own icons at runtime from a third party, the way IdleOn Toolbox does (not committed here). That stays **open**: a research pass on LavaFlame2's stated stance on fan tools using game art decides it. If it's allowed, a later amendment can permit runtime loading for item and monster icons, never committed and always credited. Until then: our own art only.

Ruled by the owner on 2026-10-17 while starting the UI/UX design track ("ActiveOn Design Lab").
