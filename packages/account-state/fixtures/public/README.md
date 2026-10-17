# Public saves from IdleOn Toolbox

These 11 saves are copied unmodified from [IdleOn Toolbox](https://github.com/Morta1/IdleonToolbox)
by Morta1 and contributors, licensed GPL-3.0-only, at the commit pinned in
[`packages/toolbox-parsers/UPSTREAM`](../../../toolbox-parsers/UPSTREAM). `pnpm sync-parsers` refreshes
them together with the parsers.

| File here | Upstream path |
|---|---|
| `toolbox-raw.json` | `data/raw.json` (Toolbox's demo account) |
| `first.json`, `second.json`, `third.json`, `fourth.json`, `fresh.json`, `highend.json`, `latest.json`, `latest-2026-08.json`, `multikill-pin.json`, `speedrun-rank1.json` | `__test__/fixtures/<same name>` |

They are already published in Toolbox's public repository. They feed the Account State contract
tests in [`../../test/`](../../test/).

**Never add a private save here.** Real saves go in the repository's `fixtures/private/*.raw.json`,
which is gitignored and only runs locally.
