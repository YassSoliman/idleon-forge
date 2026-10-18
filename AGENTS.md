# AGENTS.md

IdleOn Forge: open-source, **read-only** companion tools ("Mods") for Legends of IdleOn. The first
Mod is **ActiveOn**, an active-play coach. GPL-3.0-only. This file is for AI coding agents and
humans alike.

Read before changing anything:
- [`GLOSSARY.md`](GLOSSARY.md): the project's vocabulary. Use its terms in code, docs and commits
  (Account State, AFK Target, Mod, Now screen, Source, ...); avoid the words it lists under _Avoid_.
- [`docs/adr/`](docs/adr/): decisions and why. ADR 0004 (source precedence) and 0006 (client-only
  SPA, parsing in a Web Worker) matter most for code.
- [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md): how planning issues work.

## Commands

Node 22 (`.nvmrc`), pnpm 9 (`packageManager`). From the repo root:

```sh
pnpm install
pnpm dev            # builds the parser bundle, then runs ActiveOn on http://localhost:5173
pnpm lint           # Biome (lint + format check); `pnpm format` fixes
pnpm typecheck      # tsc in every package
pnpm test           # builds the parser bundle, then Vitest across all packages
pnpm build          # parser bundle + ActiveOn (apps/activeon/dist)
pnpm sync-parsers [<sha>|HEAD]   # re-vendor IdleOn Toolbox's parsers (see below)
```

Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` before every PR. One package:
`pnpm --filter @idleon-forge/account-state typecheck`, `pnpm vitest run --project @idleon-forge/sync`.

The first build downloads Toolbox's game data (~9 MB) for the pinned commit into
`packages/toolbox-parsers/vendor/data/` (gitignored), so it needs network once.

## Layout

| Path | What |
|---|---|
| `apps/activeon` | The ActiveOn app: Vite + React + TypeScript, plain CSS tokens. Parsing runs in `src/worker/` |
| `packages/toolbox-parsers` | IdleOn Toolbox's parsers, vendored at a pinned commit (`UPSTREAM`, `UPSTREAM.md`), bundled by esbuild. `parseSave(envelope, { now })` |
| `packages/account-state` | Typed adapter: Toolbox output -> Account State. Contract tests over `fixtures/public/` |
| `packages/sync` | Google device-code sign-in to the game's Firebase, `onSnapshot` listener on the save |
| `packages/truth` | Truth checks (M22): raw readers from the game client's own layouts, contradiction rules, suppression. Worker-only. Truth run: `docs/agents/truth-run.md` |
| `docs/setup/` | Sign-in config (`VITE_*`) and deploy setup |
| `fixtures/private/` | Real saves, **gitignored**, local only (`*.raw.json`) |

Data flow: `sync` (UI thread) -> envelope -> worker: `parseSave` -> `toAccountState` -> UI.
The UI thread must only `import type` from `@idleon-forge/toolbox-parsers`; its runtime is ~6 MB and
patches built-in prototypes, so it is loaded only inside the worker.

## Rules

- **Read-only toward the game, always.** Never write to Firebase/Firestore, never touch the game
  client, never automate input. Only reads, from the player's own signed-in session.
- **Never commit saves, tokens or config values.** Real saves live in `fixtures/private/` (ignored);
  `.env*` is ignored except `.env.example`. Never quote real character names or account data in code,
  tests, issues or PRs. Test against `packages/account-state/fixtures/public/` (Toolbox's public saves).
- **Never hand-edit `packages/toolbox-parsers/vendor/`.** Re-sync with `pnpm sync-parsers`, then fix
  the adapter in `packages/account-state`. New UI-coupled upstream imports get a stub in `shims/`.
- **Deterministic.** Anything that depends on time takes `now` as a parameter; `parseSave` freezes
  `Date` to it. No LLM at advice time (ADR 0002).
- **Cite Sources.** Every game fact or Knowledge Base entry carries a Source (URL + date or patch
  verified); research notes list Sources at the end. Follow ADR 0004 for which source wins.
- **Licence headers.** New source files start with `// SPDX-License-Identifier: GPL-3.0-only`
  (CSS: `/* ... */`). Vendored files keep their upstream origin header. GPL-3.0-only, not "or later".
- **Empty parse is an error.** Toolbox swallows its own failures and returns `{ account: {} }`; the
  adapter turns that into `EmptyAccountError`, and the UI shows "Can't read your save right now".
  Never show advice from a broken parse.
- **Stay in scope.** One concern per PR. Don't add dependencies casually; the app has no backend and
  should stay that way unless an ADR says otherwise.

## Commits and PRs

- Conventional Commits (`feat(sync): ...`, `fix(parsers): ...`, `chore(parsers): sync Toolbox to ...`).
  Small and atomic.
- Branch from `main`; never push to `main`. Open PRs as drafts; the owner reviews and merges.
- No AI attribution in commits, PR text or code comments (no `Co-Authored-By` trailers or "Generated
  with" footers).
- Re-sync PRs: include the `UPSTREAM` diff, the game version, and any snapshot changes in
  `packages/account-state/test/__snapshots__/` with a line on why each field moved.
