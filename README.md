# IdleOn Forge

Open-source, read-only companion tools ("Mods") for [Legends of IdleOn](https://www.legendsofidleon.com/).

The first Mod is **ActiveOn**: a coach that sits next to the game during a play session and tells you, per character, what to do next and why, so every character is set up right before you go AFK. *Play the game, not the spreadsheet.*

> Status: **planning**. The way to the MVP is being charted as a [Wayfinder map](../../issues?q=label%3Awayfinder%3Amap) of decision tickets in this repo's Issues.

## Principles

- **Read-only, always.** Never writes to your save or touches the game client.
- **Every piece of advice cites its source** (game data, wiki, community guides; most official and most recent wins).
- **Deterministic advice.** AI helps build the knowledge base; it never makes things up at play time.
- **Your login stays in your browser.**

## Read first

- [`GLOSSARY.md`](GLOSSARY.md): the project's vocabulary.
- [`docs/adr/`](docs/adr/): decisions and why we made them.
- [`docs/research/`](docs/research/): research findings.

## Credits

Save parsing builds on [IdleOn Toolbox](https://github.com/Morta1/IdleonToolbox) by Morta1 (GPL-3.0). Advice draws on the [IdleOn wiki](https://idleon.wiki) and community guides, each cited where used.

## License

[GPL-3.0](LICENSE). Not affiliated with or endorsed by LavaFlame2.
