# GPL-3.0 licence, built on a pinned fork of IdleOn Toolbox's parsers

We parse the game save by vendoring IdleOn Toolbox's TypeScript parsers (GPL-3.0-only, ~48k lines, maintained within days of every game patch) rather than writing our own, which forces the Forge to be GPL-3.0. That is acceptable: the project is open source and free with no plans to charge, and rebuilding and maintaining a parser layer against a game that patches every 1–2 weeks is the single largest cost we can avoid. Toolbox accepts no PRs, so we keep a fork pinned to a commit with a documented re-sync process.

## Considered Options

- **Write our own parsers**: free licence choice, but months of work plus a permanent patch-chasing burden.
- **Reuse Idleon Efficiency / AutoReview code**: neither repo has a licence, so the code is not reusable.
