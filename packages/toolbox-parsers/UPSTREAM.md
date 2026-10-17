# Upstream: IdleOn Toolbox

The save parsers in `vendor/` are **[IdleOn Toolbox](https://github.com/Morta1/IdleonToolbox)** by
**Morta1 and the IdleOn Toolbox contributors**. All credit for reading the game's save format goes to
them. IdleOn Forge redistributes their code under the same licence and changes none of it.

- **Pinned commit:** see [`UPSTREAM`](UPSTREAM) (`commit=`, with the date, Toolbox version and the game
  version Toolbox's patch notes tag it with). `pnpm sync-parsers` rewrites it.
- **Licence:** GPL-3.0-only. Upstream's licence text is kept beside the code in
  [`vendor/LICENSE`](vendor/LICENSE); IdleOn Forge is GPL-3.0-only as well ([ADR 0001](../../docs/adr/0001-gpl3-and-fork-toolbox-parsers.md)).
  This package's own files carry `SPDX-License-Identifier: GPL-3.0-only`.
- **Modifications (GPL-3.0 section 5(a)):** none to upstream's code. `scripts/sync.sh` prepends a
  three-line origin notice to every vendored source file, and at build time `scripts/build.mjs`
  redirects Toolbox's path aliases to `vendor/` and its six UI-coupled imports to the stubs in
  [`shims/`](shims/). It also redirects `@parsers/safeSection` to
  [`shims/safe-section.ts`](shims/safe-section.ts), which behaves the same and additionally reports
  each section's outcome, so a section is listed as failed only when its last pass failed. The built
  bundle opens with a licence banner naming upstream and the commit.
- **No endorsement:** Toolbox does not accept PRs and is not affiliated with IdleOn Forge. Report
  parser bugs you hit through ActiveOn to us, not to Toolbox, unless you can reproduce them on
  idleontoolbox.com.

## What is committed and what is rebuilt

| Path | Committed? | Why |
|---|---|---|
| `vendor/parsers/`, `vendor/utility/`, `vendor/polyfills.js`, `vendor/LICENSE` | Yes | ~3 MB of source; a re-sync is a reviewable diff |
| `vendor/data/` (`website-data/`, `website-data.d.ts`, `sprite-manifest.json`) | No, gitignored | ~9 MB of generated game data that churns by megabytes a month; `scripts/fetch-data.sh` rebuilds it from the pinned commit before every build and typecheck |
| `../account-state/fixtures/public/*.json` | Yes | Toolbox's 11 public saves, the contract-test inputs |
| `VERIFIED_BUILDS` | Yes | The highest `GameVERSION` and `CSver` among those saves that parse cleanly at this pin, written by `scripts/verified-builds.mjs` during the sync and shipped in the bundle as `verifiedBuilds` |

## Re-syncing after a game patch

1. Pick the commit: usually upstream `HEAD`, ideally one whose `data/patch-notes.js` names the new
   game version.
2. `pnpm sync-parsers HEAD` (or a SHA). It re-vendors, rewrites `UPSTREAM`, refreshes the public saves
   and rebuilds `vendor/data/`.
3. `pnpm typecheck && pnpm test && pnpm build`. A build error naming an unmapped alias means
   upstream added a UI-coupled import: add a stub in `shims/` and map it in `scripts/build.mjs`.
4. Review `git diff --stat`. Snapshot changes in `packages/account-state` show which Account State
   fields moved. Fix the adapter, never `vendor/`.
5. Open a PR titled `chore(parsers): sync Toolbox to <short-sha> (game <version>)`.

## The package surface

`parseSave(envelope, { now })` runs Toolbox's `parseData()` with the global `Date` frozen at `now`,
so the same save and the same `now` always give the same output. It never throws for a bad save:
like Toolbox, a failure returns an empty `account`, which `@idleon-forge/account-state` treats as a
hard error. Importing the bundle applies Toolbox's `String`/`Array` prototype polyfills, so ActiveOn
loads it only inside its parsing Web Worker ([ADR 0006](../../docs/adr/0006-client-only-spa-parsing-in-a-worker.md)).
