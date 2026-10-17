# M12 Release

Spec for [#40](https://github.com/YassSoliman/idleon-forge/issues/40), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **draft, not yet grilled or red-teamed.**

Grounded in:

- [#14](https://github.com/YassSoliman/idleon-forge/issues/14) (architecture, items 10 to 12);
- [#6](https://github.com/YassSoliman/idleon-forge/issues/6) and the hosting research (`docs/research/2026-10-16-hosting.md` on `research/hosting`);
- [#7](https://github.com/YassSoliman/idleon-forge/issues/7) and the open-source research (`docs/research/2026-10-16-oss-setup.md` on `research/oss-setup`);
- [#11](https://github.com/YassSoliman/idleon-forge/issues/11) (Knowledge Base versioning, item 13);
- [#13](https://github.com/YassSoliman/idleon-forge/issues/13) (M12 runs alongside every other module, and each module ships to the shared URL when done);
- the slice-1 code in PR [#28](https://github.com/YassSoliman/idleon-forge/pull/28): `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `apps/activeon/wrangler.jsonc`, `docs/setup/deploy.md`, `docs/setup/live-sign-in.md`, `packages/toolbox-parsers/scripts/sync.sh` and `UPSTREAM`.

Terms follow [`GLOSSARY.md`](../../GLOSSARY.md).

## 1. Purpose

M12 is how a change reaches a Play Session. A player (Yasser or Joseph) should always be running ActiveOn from one URL that holds the latest reviewed code, Knowledge Base and parser pin. When the game patches, ActiveOn should catch up within days through a reviewed PR, not through someone remembering to do it. When they open the app after a change, they should see in one glance what changed in the advice and the app since their last visit. Before any change lands, either of them can try it on its own preview URL. M12 also stamps every build with the versions (app, Knowledge Base, parser and game) that every Next Action, "Report this" and Suggestion refers to. A player can then say "this advice was wrong on knowledge 2026.10.21" and we know exactly what they saw.

## 2. Scope / Out of scope

**In scope**

- The production deploy on merge to `main`, through the GitHub `production` environment (already in PR #28; M12 hardens it).
- Worker Previews per same-repo PR (`wrangler preview --name pr-<N>`), with cleanup when the PR closes.
- The parser re-sync workflow: weekly on a schedule, plus a manual "sync now". It opens or updates one PR.
- Build stamping: `BuildInfo` (app build id, commit, channel, Knowledge Base version, parser pin and game version), emitted as `version.json` and compiled into the app.
- The generated changelog (`whats-new.json`) built from Conventional Commit history on `main`. Its data contract feeds the What's new panel that M10 renders.
- The Knowledge Base version scheme (#11, item 13).
- Detecting a stale tab ("a new version is out, reload").
- Repository governance for releasing: CODEOWNERS, branch protection, the required checks, the merge method, the PR title check and the PR template's release fields.
- Response headers for the static site (`_headers`): caching, CSP, `noindex`.
- Runbooks: the first-deploy checklist, the patch-day checklist, the per-PR release checklist and rollback.
- How Joseph gets and uses previews.

**Out of scope**

- **The What's new UI, footer and banners as screens.** M10 owns them; M12 supplies the data and the rules for what to show.
- **Generating Knowledge Base fact entries at re-sync** (ADR 0007). M11 owns the generator; M12 only calls it inside the sync workflow.
- **The Suggestions Worker's code and runtime secrets** (M13, ADR 0008). M12 only provides the deploy and preview pipeline that M13's Worker plugs into.
- **Previews for fork PRs.** Ruled out for the MVP in #6. Fork contributors run `pnpm dev` locally and attach screenshots. The gated `workflow_run` design in the hosting research §5 stays on file for later.
- **A custom domain and branding.** Per map #1, the app starts on `*.workers.dev` and the domain is picked before public alpha. D3 covers the one origin choice that cannot wait.
- **Semver releases, GitHub Releases, tags and npm publishing.** No package is published, and every merge is a release.
- **Analytics and error telemetry** (#14, item 13).
- **Notifications on deploy** (push, Discord). Players learn about changes through What's new.
- **Cloudflare Workers Builds.** It must never be connected: it would be a second deploy path outside the GitHub gates (#7).

## 3. Functional requirements

**Production deploy**

- **FR-1** Every push to `main` deploys ActiveOn to production at `https://activeon.<subdomain>.workers.dev` within 15 minutes (p95), with no manual step.
- **FR-2** Production deploys run only from `main`. A deploy job started from any other ref (including `workflow_dispatch` on a branch) is refused by the `production` environment's branch rule before it can read a secret.
- **FR-3** A deploy runs lint, typecheck, test and build first, and deploys nothing if any of them fails. The previous production version stays live.
- **FR-4** After deploying, the workflow fetches `<production URL>/version.json` and fails, with a visible red run, unless `commit` equals the commit it just deployed. It also checks that a deep link (`/some/deep/link`) returns 200 HTML.
- **FR-5** Deploys are serialized. If two merges land close together, they never deploy at once, and the final state of production is the newest `main` commit.
- **FR-6** The owner can roll production back to any earlier version in under 5 minutes, either from the documented runbook (`wrangler rollback`) or by merging a revert PR.

**Previews**

- **FR-7** Every PR whose head branch lives in `YassSoliman/idleon-forge`, drafts included, gets a Worker Preview named `pr-<N>`. A single PR comment, edited in place on each push, carries the Preview URL, the commit it serves and the `BuildInfo` versions.
- **FR-8** The Preview updates within 10 minutes (p95) of each push to the PR branch.
- **FR-9** The Preview is deleted when the PR is closed or merged.
- **FR-10** A PR from a fork gets CI (with no secrets) but no Preview, and no job in it can read a Cloudflare token.
- **FR-11** A Preview build shows a persistent "Preview of PR #N, not the live app" badge, so a tester never mistakes it for production.
- **FR-12** A Preview has working live sign-in (the same `VITE_*` config as production), so Joseph can test a PR against his real account.

**Parser re-sync**

- **FR-13** Once a week on a schedule, and whenever the owner presses "Run workflow" (optionally passing an upstream SHA), the parser sync workflow runs `pnpm sync-parsers <sha|HEAD>`.
- **FR-14** If `packages/toolbox-parsers/UPSTREAM` does not change, the run ends green and opens no PR.
- **FR-15** If it changes, the run opens a PR, or updates the existing one, from branch `chore/parser-sync`. The title is `chore(parsers): sync Toolbox to <sha7> (game <gameVersion>)`. The body holds:
  - the `UPSTREAM` diff;
  - the upstream compare link;
  - `git diff --stat` for `packages/toolbox-parsers/vendor` and the public fixtures;
  - the result of each check (typecheck, contract tests, build);
  - the snapshot changes;
  - the generated Knowledge Base diff summary from M11;
  - the write-call tripwire result (TR-14).
- **FR-16** A sync whose checks fail still opens the PR, labelled `area:parser` and `do-not-merge`, with the failing output summarized. A broken upstream is something to see, not something to hide.
- **FR-17** CI and a Preview run on the sync PR without a human having to push to it.
- **FR-18** Only a human merges a sync PR. Nothing auto-merges.

**Versions and What's new**

- **FR-19** Every build carries a `BuildInfo` (TR-4). The app exposes it to M10 (the footer), to "Report this" (#11, item 15) and to M13 (Suggestion context).
- **FR-20** The Knowledge Base version is derived from git history on `main` as `YYYY.MM.DD` or `YYYY.MM.DD.N` (TR-6). It changes only when a merge touches `packages/knowledge/`.
- **FR-21** Every build emits `whats-new.json` (TR-7): player-facing entries, newest first, grouped into **Advice changes** (Knowledge Base), **Game patch support** (parser syncs) and **App changes**.
- **FR-22** Developer-only changes (`chore`, `ci`, `docs`, `test`, `build`, `refactor`, `spec`) never appear in What's new, unless the PR carries a `What's-new:` line.
- **FR-23** The app shows "What's new since your last visit" at most once per new set of entries per browser, and never on a browser's very first visit (TR-8).
- **FR-24** A tab open on an older build learns about a newer production build within 15 minutes, or on its next focus, and shows a non-blocking "New version available, reload" banner. It never reloads by itself.

**Governance**

- **FR-25** Every PR title is a valid Conventional Commit, with type in `feat | fix | perf | refactor | docs | test | build | ci | chore | revert | spec` and an optional scope and `!`. A required check fails otherwise.
- **FR-26** `main` accepts changes only through PRs that pass the required checks. A PR from anyone other than the owner needs a code owner's approval, and an approval is dismissed when new commits are pushed.
- **FR-27** `.github/CODEOWNERS` exists, owns itself, and owns `.github/` with the owner alone.

## 4. User stories

Fixtures for these stories are repository states and HTTP responses, not saves: M12 has no Detectors. Each Given / When / Then doubles as a test. Most are scripted tests of the generator scripts (TR-4 to TR-8) or of the app's version logic; a few are manual checks on the first real deploy, marked **(manual)**.

**US-1 Merged work is live for my next session.**
As a player in a Play Session, I want every merged change to be live at the URL I already use, so that I never wonder whether I'm on the latest advice.

- Given a PR is merged to `main` at commit `C`, When the Deploy workflow finishes, Then `GET /version.json` on production returns `commit: C` and the footer on a reloaded tab shows the build id for `C`. **(manual on first deploy, automated by FR-4 afterwards)**
- Given a merge whose tests fail on `main`, When the Deploy workflow runs, Then it stops before `wrangler deploy` and `/version.json` still returns the previous commit.
- Given a `workflow_dispatch` of Deploy on branch `feat/x`, When the job starts, Then GitHub rejects it at the `production` environment and no secret is exposed to the run. **(manual, once)**

**US-2 I know the tab I'm using is out of date.**
As a player in a Play Session, I want to be told when a newer version is out while my tab is open, so that I don't spend a two-hour session on yesterday's advice, and I'm not interrupted mid-click either.

- Given a tab running build `A` and production `version.json` returning build `B`, When the tab regains focus or 15 minutes pass, Then the "New version available, reload" banner appears and the page does not reload.
- Given the same tab, When `version.json` fails (offline, 5xx or invalid JSON), Then no banner appears, no error is shown, and the next check runs on schedule.
- Given a tab running a **preview** build, When the check runs, Then it compares against the preview's own `version.json`, never against production.
- Given a tab whose lazily loaded chunk fails to load after a deploy (TR-10), When the failure is caught, Then the same banner appears with the text "ActiveOn was updated. Reload to continue". No blank screen and no advice from half-loaded code.

**US-3 I see what changed since last time.**
As a player in a Play Session, I want a short list of what changed in the advice and the app since my last visit, so that I trust new advice and notice when an old instruction was fixed.

- Given `lastSeenEntryId` = the id of entry `E5`, and `whats-new.json` holds `E1` to `E8` newest first, When the app loads, Then What's new lists `E1` to `E4` grouped as Advice changes / Game patch support / App changes, and `lastSeenEntryId` becomes `E1` once the panel is dismissed.
- Given no `lastSeenEntryId` (first ever visit, or storage cleared), When the app loads, Then no What's new panel appears and `lastSeenEntryId` is set to the newest entry.
- Given two tabs open, When What's new is dismissed in one, Then the other tab hides its panel (a `storage` event) and it is never shown twice.
- Given a merge titled `chore(ci): cache pnpm store` with no `What's-new:` line, When the feed is generated, Then it has no entry for that merge.
- Given a merge titled `fix(kb): stamp cap step uses materials, not coins` that touches `packages/knowledge/`, When the feed is generated, Then its entry is in **Advice changes** with the text "Stamp cap step uses materials, not coins".
- Given a merge with the PR body line `What's-new: Cards now show which set they complete`, When the feed is generated, Then the entry text is that line, whatever the title says.
- Given a merge with `What's-new: none`, When the feed is generated, Then it has no entry, whatever its type.
- Given a parser sync merge that changes `gameVersion` from `2.3.540` to `2.3.541`, When the feed is generated, Then **Game patch support** reads "Reads saves from game version 2.3.541".

**US-4 I can say exactly which advice I saw.**
As a player in a Play Session, I want every report I file to carry the exact versions I was running, so that a wrong instruction gets fixed instead of argued about.

- Given production built from a `main` whose newest `packages/knowledge/` change merged on 2026-10-21 (the second such merge that day), When BuildInfo is generated, Then `knowledge` = `2026.10.21.2`.
- Given a Preview of PR #57 built on that same `main` plus the PR's changes to `packages/knowledge/`, When BuildInfo is generated, Then `knowledge` = `2026.10.21.2+pr57`.
- Given BuildInfo is available, When "Report this" or a Suggestion is filed (M10 or M13), Then the attached context contains `app`, `knowledge`, `parsers.gameVersion` and `channel`, and nothing else from BuildInfo is needed to reproduce it.

**US-5 The game patched and ActiveOn catches up without anyone remembering.**
As a player in a Play Session, I want ActiveOn to track game patches on its own schedule, so that a patch doesn't leave me with "Can't read your save" for weeks.

- Given upstream Toolbox HEAD differs from the pinned commit, When the scheduled sync runs, Then a PR `chore(parsers): sync Toolbox to <sha7> (game <ver>)` is open within 30 minutes, with CI and a Preview running on it.
- Given upstream HEAD equals the pin, When the sync runs, Then no PR is opened and the run is green.
- Given an open sync PR at upstream commit `U1` and a new upstream commit `U2`, When the sync runs again, Then the same PR is updated to `U2` (branch force-pushed, title and body rewritten) and no second PR appears.
- Given upstream changes that break `pnpm test`, When the sync runs, Then the PR is still opened, labelled `do-not-merge`, and its body names the failing test files.
- Given the vendored diff adds a Firestore or RTDB write call (TR-14), When the sync runs, Then the PR is labelled `do-not-merge` and the body quotes each match.

**US-6 Joseph tries a change before it lands.**
As a player in a Play Session (Joseph), I want to open any PR's change on its own URL with my real account, so that I can say "this is right for my W3 account" before it affects my sessions.

- Given Joseph has write access and pushes branch `kb/w3-refinery` and opens PR #60, When the Preview workflow finishes, Then PR #60 has one comment with `https://pr-60-activeon.<subdomain>.workers.dev`, and that URL shows the "Preview of PR #60" badge.
- Given that Preview, When Joseph signs in with Google on it, Then live sync works exactly as on production. His production sign-in is untouched, because the Preview is a different origin with its own storage.
- Given PR #60 is merged or closed, When the cleanup job runs, Then the Preview URL stops serving PR #60's build.
- Given a fork PR #61, When workflows run, Then CI runs, no Preview is created, and no Cloudflare secret is available to any job.

## 5. Technical requirements

### TR-1 Workflow inventory

All workflows live in `.github/workflows/` and start with `# SPDX-License-Identifier: GPL-3.0-only`. Every workflow sets top-level `permissions: contents: read` and widens permissions per job only.

| File | Trigger | Environment | Purpose |
|---|---|---|---|
| `ci.yml` (exists) | `pull_request` (types `opened, synchronize, reopened, ready_for_review`), `push` to `main`, `workflow_dispatch` | none | lint → typecheck → test → build, plus the bundle budget (TR-12). The job name `Lint, typecheck, test, build` is a required check. |
| `pr-title.yml` (new) | `pull_request` (types `opened, edited, synchronize, reopened`) | none | FR-25, plus the `What's-new:` line's length (≤ 120 characters) and the D2 warning. A ~30-line inline script reading the title and body from `env:`, no third-party action. Its job name `PR title` is a required check. |
| `deploy.yml` (exists, amended) | `push` to `main`, `workflow_dispatch` | `production` | FR-1 to FR-5 |
| `preview.yml` (new) | `pull_request` (types `opened, synchronize, reopened, ready_for_review, closed`), `workflow_dispatch` (input `pr`) | `preview` | FR-7 to FR-12 |
| `parser-sync.yml` (new) | `schedule` (weekly, Monday 13:00 UTC), `workflow_dispatch` (input `ref`, default `HEAD`) | none (no Cloudflare secrets) | FR-13 to FR-18 |

The Preview check is deliberately **not** required: fork PRs never produce one.

### TR-2 `deploy.yml` amendments to PR #28's version

- Checkout with `fetch-depth: 0` and `filter: blob:none`, because BuildInfo and the changelog read history (TR-6, TR-7).
- Keep `concurrency: { group: deploy-production, cancel-in-progress: false }` (FR-5: GitHub keeps at most one pending run, the newest).
- Build with `VITE_DEPLOY_CHANNEL=production`. The build script runs `pnpm --filter @idleon-forge/release generate` before `vite build` (TR-3).
- Deploy with `pnpm exec wrangler deploy` (never `npx wrangler@latest`), so the lockfile's Wrangler runs.
- Add a smoke step (FR-4): `curl -fsS "$PRODUCTION_URL/version.json" | jq -e --arg c "$GITHUB_SHA" '.commit == $c'`, retried for up to 60 s, plus `curl -fsS -o /dev/null -w '%{http_code}' "$PRODUCTION_URL/some/deep/link"` equal to `200`.
- Variables and secrets as in the first-deploy checklist (§5, TR-16). `CLOUDFLARE_ACCOUNT_ID` moves from a secret to a repository variable: it is not sensitive, and both environments need it.

### TR-3 Package boundary: `packages/release`

A new private workspace package `@idleon-forge/release` (GPL-3.0-only), Node-only and build-time only. It contains:

- `src/types.ts`: `BuildInfo`, `WhatsNewFeed` and `WhatsNewEntry` (below). The app imports these with `import type` only.
- `src/build-info.ts` and `src/whats-new.ts`: pure functions over an injected list of commits (`{ sha, date, subject, body, files[] }`), the `UPSTREAM` contents and the environment. They are unit-tested with synthetic commit lists, with no git and no network.
- `src/git.ts`: the only module that shells out (`git log --first-parent main ...`). It is thin and untested beyond a smoke test.
- `bin/generate.ts`: writes `apps/<app>/public/version.json` and `apps/<app>/public/whats-new.json` (both gitignored), and prints BuildInfo for the app's Vite `define`.

`apps/activeon/vite.config.ts` defines `__BUILD_INFO__` from the same output, so the code and `version.json` can never disagree. Later Mods reuse the package with their own `--app` and `--paths` arguments.

### TR-4 `BuildInfo`

```ts
// SPDX-License-Identifier: GPL-3.0-only
export type Channel = 'production' | 'preview' | 'local';

export interface BuildInfo {
  schema: 1;
  /** Human build id, e.g. "2026.10.21-3f9c2ab"; "-dirty" suffix on local builds with changes. */
  app: string;
  /** Full commit SHA the build was made from. For previews, the PR head commit. */
  commit: string;
  /** ISO 8601 UTC, the commit's committer date (not wall-clock), so rebuilds are reproducible. */
  builtFrom: string;
  channel: Channel;
  /** Set only when channel === 'preview'. */
  pr?: number;
  /** Knowledge Base version, see TR-6. */
  knowledge: string;
  parsers: {
    toolboxCommit: string;   // UPSTREAM commit=
    toolboxVersion: string;  // UPSTREAM toolboxVersion=
    gameVersion: string;     // UPSTREAM gameVersion=; M1 compares this with the save's version
  };
}
```

- `version.json` is exactly this object. Its size is under 1 KB.
- BuildInfo holds no secret, no `VITE_*` value, no user data and no hostname beyond what the URL already says.

### TR-5 Merge method and history shape

- The repository allows **one** merge method, chosen in D1. The rest of this spec assumes the recommendation (merge commits) and reads history as `git log --first-parent main`, so each PR is one entry.
- The repository setting for the merge commit message is **"Pull request title and description"**, so the PR body (including any `What's-new:` line) lands in history and the generator never calls the GitHub API.
- If D1 goes to squash, only the setting name changes ("Default to pull request title and description"). The generator is identical, because first-parent history of squash merges is also one commit per PR.

### TR-6 Knowledge Base version

- `knowledge` = the committer date (UTC, `YYYY.MM.DD`) of the newest first-parent `main` commit that touches `packages/knowledge/`. A `.N` suffix is added when N ≥ 2 such commits share that date, N being its position that day.
- No `packages/knowledge/` change yet gives `0000.00.00`.
- On a preview, if the PR changes `packages/knowledge/` against its merge base, append `+pr<N>`.
- On a local build with uncommitted changes under that path, append `+local`.
- The version is a label, not a semver: nothing compares it except for equality. It goes in BuildInfo, in the footer (M10), in each Next Action's provenance (M11 and M4), and in Report this and Suggestion context.

### TR-7 `whats-new.json`

```ts
export type WhatsNewSection = 'advice' | 'game-patch' | 'app';

export interface WhatsNewEntry {
  /** The first-parent commit SHA (merge commit). Stable, unique, sortable via the feed's order. */
  id: string;
  /** ISO date (YYYY-MM-DD) of the commit, UTC. */
  date: string;
  pr?: number;
  section: WhatsNewSection;
  /** Player-facing, one line, ≤ 120 chars, no trailing period, no Markdown. */
  text: string;
}

export interface WhatsNewFeed {
  schema: 1;
  /** Newest first; at most 100 entries (older ones are dropped from the feed, not from git). */
  entries: WhatsNewEntry[];
}
```

The generator walks first-parent `main` history, newest first, and applies these rules in order:

1. The PR number comes from the merge subject (`Merge pull request #N`) or a `(#N)` suffix.
2. The **title** is the PR's Conventional Commit title: line 3 of a merge commit message, or the subject of a squash commit.
3. If the body has a `What's-new: none` line (case-insensitive key), the commit is skipped.
4. **Text:** taken from the `What's-new: <text>` line if present. Otherwise, for types `feat`, `fix` and `perf` only, the title's description with its first letter upper-cased. Otherwise the commit is skipped (FR-22).
5. **Section:**
   - `game-patch` if the commit changed `gameVersion=` in `packages/toolbox-parsers/UPSTREAM`. The text is generated as "Reads saves from game version `<new>`", which overrides any other text.
   - `advice` if the scope is `kb`, or if any changed file is under `packages/knowledge/`.
   - `app` otherwise.
6. Text longer than 120 characters is truncated to 119 characters plus "…", with a build warning naming the PR. A wording mistake never blocks a deploy; `pr-title.yml` catches it before merge (TR-1). Text is plain: the generator strips backticks and Markdown links.
7. Text never contains a character name or account data. This is enforced by review and by the existing AGENTS.md rule; the generator cannot check it.

The feed is regenerated on every build, so a fix to an old PR's wording is a follow-up PR with `What's-new:` on it, not a history rewrite.

### TR-8 What's new display rules (contract for M10)

- **Storage:** `localStorage["activeon.whatsNew.lastSeen"]` holds an entry id. Every read and write is wrapped in try/catch; if storage fails, What's new is never shown.
- **First visit** (key absent): write the newest id, show nothing.
- **Later visits:** show the entries before `lastSeen` in feed order, at most 10, then "and N more" linking to `https://github.com/YassSoliman/idleon-forge/commits/main`. If `lastSeen` is not in the feed (aged out past 100 entries), show the newest 10.
- **Dismiss** writes the newest id. A `storage` event closes the panel in other tabs.
- **Previews:** the panel works the same on previews (it is per origin, so Joseph sees fresh state). The badge from FR-11 is separate.
- "Clear my data" (M10) removes the key, so the next visit counts as a first visit.

### TR-9 Stale-tab detection

- The app fetches `/version.json` with `cache: 'no-store'` on `visibilitychange` to visible (at most once a minute) and every 15 minutes while visible.
- If `commit` differs from `__BUILD_INFO__.commit`, the app raises `updateAvailable` for M10 to render (FR-24).
- Failures are silent. The check makes no request when `navigator.onLine === false`.
- Preview builds hit their own origin's `version.json`, so they compare against the latest deploy of the same PR.

### TR-10 Chunk-load failure after a deploy

A new production version serves a new asset set; hashed chunks from the previous version may stop being served (M confidence, verify on the first redeploy, see the first-deploy checklist step 14). The parsing Web Worker chunk (~6.3 MB) and any lazily loaded module (for example the planned lazy Firebase) are the exposure.

- Dynamic imports and `new Worker(...)` failures caught by the app's loader raise `updateAvailable` with reason `chunk-load-failed` instead of throwing to a blank screen.
- The app never shows advice from a partially loaded engine. This follows the "never show advice from a broken parse" rule (#10, item 13).

### TR-11 `_headers` (in `apps/activeon/public/_headers`)

```
/index.html
  Cache-Control: no-cache
/version.json
  Cache-Control: no-store
/whats-new.json
  Cache-Control: no-cache
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/*
  X-Robots-Tag: noindex
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: <see below>
```

- **CSP:**
  - `default-src 'self'`;
  - `script-src 'self'`;
  - `worker-src 'self' blob:`;
  - `style-src 'self'`, plus the font host if the prototype's fonts stay remote;
  - `connect-src 'self'`, the Google OAuth endpoints, the Firebase Auth and Firestore endpoints, `wss://*.firebaseio.com https://*.firebaseio.com`, and M13's Worker origin once it exists;
  - `img-src 'self' data:`;
  - `frame-ancestors 'none'`;
  - `base-uri 'none'`;
  - `form-action 'none'`.
- The exact host list is generated from what `packages/sync` calls and checked in a Preview with a real sign-in before the first merge that adds it. A CSP that breaks sign-in is a P0 and is caught on the Preview, never in production.
- `noindex` on production stays until public alpha (§2, revisit then).
- `_headers` must stay under Cloudflare's 100-rule limit (hosting research §7).

### TR-12 Budgets (checked in `ci.yml`, failing the build)

| Budget | Limit | Why |
|---|---|---|
| Main JS chunk, gzipped | ≤ 320 KB (slice 1 is ~265 KB) | Page-load time at the start of a session |
| Parser worker chunk, raw | ≤ 8 MB (slice 1 is ~6.3 MB) | Catch an accidental second copy of the game data |
| Any single file in `dist/` | ≤ 20 MiB | Cloudflare's hard limit is 25 MiB per asset; fail with margin |
| File count in `dist/` | ≤ 5,000 | Cloudflare's limit is 100,000; a jump signals a broken build |
| `whats-new.json` | ≤ 64 KB | 100 short entries |
| Deploy workflow wall time | ≤ 15 min (job `timeout-minutes: 15`) | FR-1 |
| Preview workflow wall time | ≤ 10 min (`timeout-minutes: 12`) | FR-8 |

A budget is raised only by a PR that changes the number and says why.

### TR-13 `preview.yml`

- **Job `preview`:**
  - Runs when `github.event.action != 'closed' && github.event.pull_request.head.repo.full_name == github.repository`, or on a `workflow_dispatch`.
  - `environment: preview`, with `permissions: contents: read, pull-requests: write, deployments: write`.
  - `concurrency: { group: preview-pr-<N>, cancel-in-progress: true }`.
  - Builds with `VITE_DEPLOY_CHANNEL=preview` and `VITE_PR_NUMBER=<N>`.
  - Runs `pnpm exec wrangler preview --name pr-<N> --json`, reads `.preview.urls[0]`, and posts it with `gh pr comment <N> --edit-last --create-if-none`. The comment holds the URL, the commit and BuildInfo's `knowledge` and `gameVersion`.
  - `cloudflare/wrangler-action@v4` is an allowed alternative if it is pinned by commit SHA.
- **Job `cleanup`:**
  - Runs on `closed` from the same repo, in the same environment.
  - `pnpm exec wrangler preview delete --name pr-<N> --skip-confirmation`, tolerating "not found".
- **`workflow_dispatch`:** input `pr` (a number). The job resolves the PR's head ref with `gh pr view` and refuses if `headRepositoryOwner` is not `YassSoliman`, so a dispatch can never build fork code with secrets. The parser sync uses this to get a Preview (TR-15).
- **`apps/activeon/wrangler.jsonc`:** set `"preview_urls": true` and add the Previews block from the hosting research §1. Previews stay on `workers.dev` for good (free `noindex`, no wildcard certificate).
- **Wrangler** stays a devDependency at `^4.151.1`. A unit test in `packages/release` asserts that the resolved version is ≥ 4.136.3, so a lockfile downgrade fails CI.
- **Preview name:** `pr-<N>`. With the Worker named `activeon`, the label `pr-<N>-activeon` stays far under 63 characters for any realistic N.
- **Not used:** `pull_request_target`, and `workflow_run` with a checkout of PR code.

### TR-14 Write-call tripwire

Read-only toward the game is the project's first rule, and the vendored parsers are third-party code that ships to players' browsers next to their live Firebase session. A small script, `packages/toolbox-parsers/scripts/tripwire.mjs`, runs in CI and in the sync workflow.

- It scans `vendor/` and the built worker bundle for Firebase write APIs (`setDoc`, `updateDoc`, `addDoc`, `deleteDoc`, `writeBatch`, `runTransaction`, RTDB `set(`, `update(`, `push(`, `remove(` on a `ref`).
- It also scans for new network primitives (`fetch(`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`, `importScripts`).
- It compares the matches against an allowlist file of known, reviewed matches (with the upstream line and the reason each is safe, e.g. unreachable from `parsers/`).
- Any new match fails CI and labels a sync PR `do-not-merge`.
- This is a tripwire for review, not a proof. The human review of the vendor diff remains the gate (FR-18).

### TR-15 `parser-sync.yml`

The workflow runs in two jobs, so upstream code never runs with write access.

**Job 1, `sync`** (`permissions: contents: read`, no secrets):

1. Check out `main`. Run `pnpm install --frozen-lockfile`, then `pnpm sync-parsers ${{ inputs.ref || 'HEAD' }}`.
2. If `git diff --quiet packages/toolbox-parsers/UPSTREAM`, set the output `changed=false` and stop (FR-14).
3. Otherwise run `pnpm kb:generate` (M11's generator; skipped with a note until M11 lands), then `pnpm typecheck`, `pnpm test` (CI mode, so a snapshot mismatch fails and is recorded), `pnpm vitest run -u` (so the updated Account State snapshots land in the patch for review), `pnpm build` and the tripwire. Each runs with `continue-on-error`, and its exit code and last 50 lines are recorded.
4. Write `sync-report.md` (FR-15) and `sync.patch` (`git diff --binary` of the working tree), and upload both as an artifact.

**Job 2, `open-pr`** (`needs: sync`, `if: changed == 'true'`, `permissions: contents: write, pull-requests: write, actions: write`):

1. Check out `main`. Download the artifact and `git apply sync.patch`. **This job runs no repository scripts and no upstream code.**
2. Commit as `github-actions[bot]` with the PR title as the message, and force-push to `chore/parser-sync`.
3. `gh pr create` or `gh pr edit` with the report as the body, and apply the labels `area:parser`, plus `do-not-merge` when any check or the tripwire failed.
4. Pushes made with `GITHUB_TOKEN` do not start `pull_request` workflows. So the job dispatches `ci.yml` (`gh workflow run ci.yml --ref chore/parser-sync`) and `preview.yml` (`-f pr=<N>`). `workflow_dispatch` is the documented exception that `GITHUB_TOKEN` may trigger.
   - CI then reports `Lint, typecheck, test, build` on the branch head, which satisfies the required check. **(M: confirm on the first sync PR that the check attaches to the PR. If not, the fallback is that the reviewer clicks "Ready for review" on the draft sync PR, which fires `ready_for_review` under a human actor; that is why `ci.yml` and `preview.yml` list that type.)**
5. The PR is opened as a **draft**. Marking it ready is part of the human review.

Further rules:

- The scheduled run has `timeout-minutes: 30` and `concurrency: { group: parser-sync, cancel-in-progress: false }`.
- **Cadence:** weekly on Mondays at 13:00 UTC. The game patches every 1 to 2 weeks and Toolbox follows within days. The manual dispatch covers patch day, and the M1 "game updated, parser not caught up yet" banner tells players a sync is due.

### TR-16 Secrets, variables and environments (the target state)

| Name | Kind | Where | Used by | Notes |
|---|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | secret | **environment `production`** | `deploy.yml` | Production token (TR-17) |
| `CLOUDFLARE_API_TOKEN` | secret | **environment `preview`** | `preview.yml` | A separate token with the same scope, revocable on its own (D4) |
| `CLOUDFLARE_ACCOUNT_ID` | variable | repository | deploy, preview | Not sensitive |
| `PRODUCTION_URL` | variable | environment `production` | deploy smoke step | `https://activeon.<subdomain>.workers.dev` |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_GOOGLE_OAUTH_CLIENT_ID` | variables | repository | deploy, preview | Public game values (`docs/setup/live-sign-in.md`). Repository-level so both environments share one copy. |
| `VITE_GOOGLE_OAUTH_CLIENT_SECRET` | secret | repository | deploy, preview | Public by nature (it ships in every tool's bundle, ours included), but kept out of the repo and out of logs. Repository-level secrets are never given to fork PRs. |

- **No other secrets.** The sync workflow uses only `GITHUB_TOKEN`.
- **M13's Worker runtime secrets** (GitHub issue token, Turnstile secret) are set by the owner with `wrangler secret put` directly in Cloudflare and never pass through GitHub. Previews do not inherit production secrets (hosting research §2), so a Suggestions Worker preview cannot file real issues; M13 must make it fail closed.

### TR-17 Cloudflare API token scope

- Account API token, custom, on the one account only.
- **Account → Workers Scripts: Edit.** Add **Account → Account Settings: Read** only if `wrangler deploy` asks for it.
- No zone permissions, no KV, R2, D1 or Queues, no User permissions.
- An expiry of 12 months, with the renewal date written in `docs/setup/deploy.md`.
- **Verify** the minimal scope with a real `wrangler deploy` and `wrangler preview` (first-deploy checklist steps 3 and 13). If a permission is missing, add it, then record the final list in `docs/setup/deploy.md`.

### TR-18 Branch protection and CODEOWNERS (target state)

`.github/CODEOWNERS`:

```
# SPDX-License-Identifier: GPL-3.0-only
# Last matching pattern wins. Owners need write access.
*                     @YassSoliman
/packages/knowledge/  @YassSoliman @JoKhalil
/.github/             @YassSoliman
/packages/toolbox-parsers/  @YassSoliman
```

The `/packages/knowledge/` co-ownership is D6. The path is `packages/knowledge` (as in #14's package list), not `packages/knowledge-base` as in the open-source research.

Rules on `main`, as a ruleset if D5 goes that way, otherwise the existing classic protection plus these changes:

| Setting | Value | Why |
|---|---|---|
| Require a pull request | on, 1 approval | exists |
| Require review from Code Owners | on | exists. It only takes effect once CODEOWNERS exists. |
| Dismiss stale approvals on new commits | **on** (today: off) | An approval can't be reused for different code |
| Require approval of the most recent push | off | With two people, it would block the owner's own fix-ups (research §5) |
| Required status checks | **`Lint, typecheck, test, build`, `PR title`** (today: none) | FR-3, FR-25 |
| Require branches to be up to date | off | Two people with few conflicts; deploy re-runs tests on the merged result anyway |
| Require conversation resolution | on | Cheap; review comments can't be lost |
| Force pushes, deletions | blocked | exists |
| Bypass | D5 | |

Repository settings:

- **Merge method:** per D1, only that method enabled.
- **Merge commit message:** "Pull request title and description".
- **Automatically delete head branches:** on.
- **Actions → Workflow permissions:** "Read repository contents" by default, with "Allow GitHub Actions to create and approve pull requests" **on** (needed by TR-15).
- **Actions → Fork pull request workflows:** "Require approval for all external contributors".

### TR-19 PR template release fields

`.github/PULL_REQUEST_TEMPLATE.md` (from #7) gains two fields:

```
## What's new
<!-- One line players will see, ≤ 120 chars, or "none". Leave as-is to use the PR title for feat/fix/perf. -->
What's-new:

## Preview checked
<!-- Paste what you tried on the Preview URL, or "n/a" (fork PR / no UI change). -->
```

The generator treats an empty `What's-new:` line as absent.

### TR-20 Security and privacy

- No user data passes through any release path. BuildInfo and the feed are built from git, and no saves, tokens or names are involved.
- Only `deploy.yml` (production environment, `main` only) and `preview.yml` (preview environment, same-repo PRs only) read a Cloudflare token.
- **Anyone with write access can write a branch whose workflow uses the preview token** (D4). The preview token has the same Cloudflare power as production's, because Cloudflare cannot scope a token to previews. The practical rule: write access is granted only to people the owner would trust to deploy production.
- Pin third-party actions by commit SHA (the official `actions/*` and `pnpm/action-setup` may stay on major tags). Enable Dependabot for `github-actions` weekly.
- `gh pr comment` bodies are built from BuildInfo only, never from PR titles or branch names. That prevents script injection through `${{ }}` interpolation of untrusted fields; untrusted fields are passed through `env:` when they are needed at all.

## 6. States and edge cases

| Situation | Behaviour |
|---|---|
| **First visit ever** | No What's new (TR-8). Footer shows BuildInfo. |
| **Loading** | BuildInfo is compiled in, so the footer never waits. `whats-new.json` loads in the background, and if it fails nothing is shown. |
| **Offline** | Version checks are skipped (TR-9). What's new uses the cached feed or shows nothing. Not a release concern beyond that. |
| **Multiple tabs** | What's new closes everywhere on dismiss (`storage` event). Each tab runs its own version check and shows the banner on its own. |
| **Second account in the same browser** | What's new is per browser, not per account (M10 rules one account per browser anyway). |
| **Tab open across a deploy** | Banner (TR-9). A failed chunk load gets the banner with a reason, never a blank screen (TR-10). |
| **Deploy fails at `wrangler deploy`** | The previous version stays live (Wrangler uploads a version, then activates it). The run is red and GitHub emails the owner. |
| **Deploy succeeds but the smoke check fails** | The run is red. The owner decides: roll back (FR-6) or fix forward. No automatic rollback in the MVP, because a smoke-test false alarm (DNS propagation, a cache) would otherwise flap production. |
| **Cloudflare token expired or revoked** | Deploy and preview fail at the authentication step with a clear error. Runbook: create a new token (TR-17), replace the environment secret, re-run. |
| **Cloudflare outage** | Production keeps serving the last version, or not, which is outside our control. Deploys fail and are re-run manually. |
| **Two merges within a minute** | Concurrency queues them. GitHub replaces the pending run with the newest, so production ends on the newest commit (FR-5). |
| **`main` CI red but someone dispatches Deploy** | Deploy runs its own tests and stops (FR-3). |
| **Preview for a PR whose build fails** | No preview deploy. The comment is edited to "Preview build failed on `<sha7>`", and the previous preview stays up, marked stale in the comment. |
| **PR closed while a preview deploy is running** | `concurrency` with `cancel-in-progress` cancels the deploy, then cleanup runs. If an orphan survives, Cloudflare's 500-preview limit evicts the oldest (hosting research §7). The owner may delete orphans by hand. |
| **PR reopened** | `reopened` re-creates the preview under the same name. |
| **Fork PR** | CI only. No preview, no comment (a fork token can't comment). Contributor docs explain why. |
| **First-time contributor from a fork** | Workflows wait for the owner's approval (repository setting). |
| **Joseph's preview login** | Each `pr-<N>` origin has its own IndexedDB, so Joseph signs in once per PR. His production session is unaffected. |
| **Sync: no upstream change** | Green, no PR (FR-14). |
| **Sync: upstream broken** | PR with `do-not-merge` (FR-16). |
| **Sync: upstream force-pushed, deleted or made private** | `sync.sh` or `fetch-data.sh` fails. A scheduled-run failure emails the owner. **Builds also fail**, because `fetch-data.sh` rebuilds the game data from the pinned SHA on every cache miss. Mitigated by D7 (mirror). |
| **Sync: a PR is already open and a human pushed fix-ups to it** | The next scheduled run would force-push and erase them. Rule: if `chore/parser-sync` has commits not authored by `github-actions[bot]`, job 2 does not push. It comments "Sync skipped: this branch has manual commits; merge or close it first." |
| **Sync: a new upstream UI-coupled import** | The build fails in job 1. The PR opens as `do-not-merge` with the esbuild error, and the human adds a shim (UPSTREAM.md step 3). |
| **Schedules disabled** | GitHub disables scheduled workflows in a public repo after 60 days without activity. The M1 banner ("game updated, parser not caught up yet") is the player-visible backstop, and patch day is the manual dispatch. |
| **Game patch lands but Toolbox hasn't caught up** | Sync finds no change. M1 shows its banner. Nothing to release. |
| **Knowledge Base changed twice on one day** | `2026.10.21` then `2026.10.21.2` (TR-6). |
| **Revert PR of a Knowledge Base change** | The version moves forward (new date or suffix), never back. What's new shows the revert only if its `What's-new:` line says so. Reverts are type `revert`, which is skipped by default. |
| **A What's new text over 120 characters** | `pr-title.yml` also checks the `What's-new:` line's length and fails the PR. If one reaches `main` anyway (an admin bypass), the generator truncates it and warns (TR-7); it never blocks a deploy. |
| **Local build** | `channel: 'local'`, `knowledge` from local history (with `+local` if dirty), no version check (no production `version.json` at localhost). |
| **Shallow clone** (a contributor's `--depth=1`) | The generator detects a shallow repo, warns, and sets `knowledge` to `unknown` and an empty feed. It never fails a local build. CI always fetches full history. |

## 7. Dependencies

| Module | What M12 needs from it | What M12 gives it |
|---|---|---|
| **M1 Sync & Account State** | The save's game version, to compare with `BuildInfo.parsers.gameVersion` for the "parser not caught up" banner. M1 owns the comparison. | `BuildInfo.parsers` |
| **M10 Now screen UI** | Renders What's new (TR-8 rules), the footer, the update banner (`updateAvailable` and its reason), and the Preview badge (FR-11). | `__BUILD_INFO__`, `whats-new.json`, `useUpdateAvailable()` |
| **M11 Knowledge tooling** | `pnpm kb:generate` (deterministic, no network beyond the pinned Toolbox data) and its diff summary for the sync PR body. The `packages/knowledge/` path. The golden-snapshot diff on KB PRs (M11 posts it; M12 does not). | `BuildInfo.knowledge` for each entry's provenance; the sync workflow that runs the generator |
| **M13 Suggestions** | Its Worker as a second deployable: `apps/<suggestions-worker>/wrangler.jsonc`, a deploy job in `deploy.yml` filtered by path, its own preview handling, and runtime secrets set in Cloudflare (TR-16). | The pipeline; BuildInfo for Suggestion context |
| **M2 to M9** | Nothing directly. Their changes reach players through this pipeline, and their PRs carry `What's-new:` lines. | Previews for player review of each module |

The only shared interface is `@idleon-forge/release` (types only on the app side).

## 8. Open decisions for Yasser

❓ **D1 - Merge method**: how do PRs land on `main`? (a) Merge commits, with history read as `--first-parent` (atomic commits are kept, and each PR is one What's new entry). (b) Squash merge (one commit per PR, so the atomic commits AGENTS.md asks for disappear from `main`). (c) Rebase merge (atomic commits on `main`, but there is no PR boundary in history, so What's new would need the GitHub API at build time).
➡️ **(a) Merge commits.** It keeps the atomic Conventional Commits your agents and AGENTS.md already produce, still gives exactly one changelog line per PR, and needs no API call at build time. Squash is the fallback; the generator works the same either way (TR-5).

❓ **D2 - Who writes the player-facing What's new line**: (a) An optional `What's-new:` line in the PR body; if it is missing, `feat`, `fix` and `perf` PR titles are used as-is. (b) The line is required on every `feat`, `fix` and `perf` PR (the check fails without it). (c) No PR text: generate from titles only.
➡️ **(a), and the PR-title check prints a non-blocking warning when a `feat` or `fix` PR has no line.** Titles are written for developers ("feat(engine): rank compounding before spendables"), so a line helps. But making it mandatory adds a gate to every agent PR, and `What's-new: none` already covers the noise case.

❓ **D3 - The `workers.dev` subdomain before the first deploy**: the production URL is `activeon.<your-account-subdomain>.workers.dev`, and changing it later changes the origin, which signs every player out and wipes their history (hosting research §4). (a) Keep the account's current subdomain whatever it is. (b) Rename the account subdomain to something Forge-named (e.g. `idleon-forge`) before the first deploy. That changes the URL of every other `workers.dev` Worker on your account. (c) Skip `workers.dev` and buy the domain now.
➡️ **(b) if your account subdomain is personal (your name) and no other `workers.dev` URL you rely on would break; otherwise (a).** It is a 30-second check in Workers & Pages → your subdomain, and it is only cheap before anyone has state on the origin. (c) contradicts your 2026-10-16 ruling, so it is not recommended.

❓ **D4 - The preview token's blast radius**: Cloudflare cannot limit a token to previews, so any collaborator with write access could write a branch workflow that deploys production with the preview token. (a) Accept it: two tokens (production and preview environments) so either can be revoked alone, and write access only for people trusted with production (today Joseph). (b) Add a required reviewer (you) on the `preview` environment, so every preview deploy waits for your click. (c) No previews for anyone but you.
➡️ **(a).** Joseph is a co-owner of the MVP, and (b) would make him wait on you for every push, which defeats "Joseph tries a change before it lands". Revisit before granting write access to a third person.

❓ **D5 - Should you yourself be forced through PRs?** Today `enforce_admins` is off, so you, and every agent running with your `gh` credentials, can push straight to `main`, skipping CI and deploying untested code. (a) Keep classic protection (you can push to `main`). (b) Move to a ruleset whose bypass list holds you in **"pull requests only"** mode: you still merge your own PRs without an approval, but direct pushes to `main` are refused. The open-source research saw the rulesets API answer on this Free repo, but the docs disagree, so it needs a check in Settings. (c) Turn on `enforce_admins` (every one of your PRs then needs Joseph's approval).
➡️ **(b) if Settings → Rules offers it, else (a).** It closes the one path where an agent mistake lands untested on the live URL, at no cost to how you work. (c) makes Joseph a bottleneck.

❓ **D6 - Joseph's review powers**: (a) Joseph co-owns `/packages/knowledge/`: he can approve Knowledge Base PRs (yours, his, agents') and merge them, which deploys to production; code PRs still need you. (b) You own everything; Joseph's approval never counts and only you merge. (c) Joseph co-owns everything.
➡️ **(a).** It matches #11 ("only Yasser and Joseph merge [Knowledge Base changes] for now"), and the Knowledge Base is where his W3 account is the better judge. The map's rule "Yasser owns `main` and deploys" still holds for code, the parser and `.github/`.

❓ **D7 - A mirror of IdleOn Toolbox**: every cold build re-fetches Toolbox's game data at the pinned SHA from `github.com/Morta1/IdleonToolbox`. If upstream rewrites history, goes private or disappears, we can't build or deploy at all (only a 7-day CI cache stands in between). (a) Accept the risk. (b) Fork Toolbox to `YassSoliman/IdleonToolbox` (public, GPL-3.0 allows it), point `UPSTREAM`'s `repo=` at the fork, and have `parser-sync.yml` sync the fork from upstream before pinning, so every pinned SHA is preserved.
➡️ **(b).** It is one fork plus a one-line change, and it removes the only external dependency that can stop us shipping even a Knowledge Base fix. Toolbox accepts no PRs, so a public fork has no social downside; label it "mirror, not maintained".

## 9. Red-team notes

1. **A malicious or broken upstream commit ships to players' browsers next to their live game session.** Defences:
   - a human merges every sync (FR-18);
   - the sync runs upstream code only in a job with no write token and no secrets (TR-15);
   - the write-call and network tripwire (TR-14);
   - CSP `connect-src` limits where any code can send data (TR-11);
   - the Preview lets us sign in and watch network traffic before merging.

   Residual risk: a reviewer skims a 3,000-line vendor diff. The PR body puts the tripwire result and the files outside `parsers/` at the top.
2. **Same-repo write access equals a production deploy.** Any collaborator can edit `preview.yml` on a branch and use the preview token against production. Defences: two tokens (one is revocable alone), minimal token scope (TR-17), and write access only for production-trusted people (D4). This is stated plainly instead of implying previews are sandboxed.
3. **The owner's own credentials bypass every gate.** Agents run as Yasser, and Yasser is an admin. Defence: D5 (a ruleset with PR-only bypass). Until then, AGENTS.md's "never push to `main`" is the only guard, and it is prose, not enforcement.
4. **What's new lies or leaks.** A commit title can be wrong, jargon, or contain a character name. Defences:
   - only `feat`, `fix` and `perf` reach players by default (FR-22);
   - an explicit `What's-new:` line overrides the title (TR-7);
   - the length and Markdown checks (TR-7);
   - the AGENTS.md rule against names in commits, which review enforces. The generator cannot.

   A wrong entry is fixed forward with a `What's-new:` PR, never by rewriting history.
5. **A long Play Session on a stale tab gives yesterday's advice, or dies on a missing chunk.** Defences: the version check on focus and every 15 minutes (TR-9), chunk-load failures turned into the update banner (TR-10), no auto-reload mid-session, and `index.html` served `no-cache` so a reload always gets the new build.
6. **The sync PR never gets CI, so it sits unmerged or gets merged blind.** `GITHUB_TOKEN` pushes don't trigger workflows. Defences: dispatching `ci.yml` and `preview.yml` (TR-15, step 4); the `ready_for_review` fallback; and the required check, which blocks merge until CI is green (an admin bypass is a visible, deliberate act).
7. **Scheduled syncs stop silently.** GitHub disables cron after 60 days without activity. Defences: the M1 "parser not caught up" banner is player-visible, and patch day has a manual runbook. In practice, active development keeps the schedule alive.
8. **A CSP or header change breaks sign-in in production.** Defences: headers ship through the same Preview path, and TR-11 requires a real sign-in on a Preview before any header PR merges. Rollback (FR-6) takes under 5 minutes.
9. **A Knowledge Base version can't be reproduced.** If it came from wall-clock time or a counter file, two builds of the same commit would disagree. Defence: it is a pure function of first-parent git history (TR-6), unit-tested on synthetic histories. BuildInfo uses the commit date, not the build time.
10. **The pipeline depends on GitHub being the source of truth for Toolbox's data.** Defence: D7 (the mirror), plus the per-pin CI cache.

## Appendix A: first-deploy checklist for Yasser

Do these in order. Each step says where. Steps 1 to 10 are one-time setup; 11 to 15 verify it.

**Cloudflare** (dash.cloudflare.com)

1. **Workers & Pages → Overview → your `workers.dev` subdomain:** note it. Decide D3 now, before anything deploys. If renaming, do it here first.
2. **Workers & Pages → Account details:** copy the **Account ID**.
3. **Manage account → Account API tokens → Create token → Custom token**, twice:
   - `activeon-production`: Account → Workers Scripts → Edit, on this account only, expiring in 12 months;
   - `activeon-preview`: the same permissions, its own expiry.

   Copy each token once. Do **not** connect Workers Builds (Workers & Pages → the Worker → Settings → Builds must stay disconnected).

**GitHub** (github.com/YassSoliman/idleon-forge)

4. **Settings → Collaborators → Add people:** `JoKhalil` with **Write**. Joseph must accept the email invite. CODEOWNERS entries for him do nothing until he does.
5. **Settings → Secrets and variables → Actions → Variables (Repository):**
   - `CLOUDFLARE_ACCOUNT_ID` (from step 2);
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_GOOGLE_OAUTH_CLIENT_ID` (values from the table in `docs/setup/live-sign-in.md`, from Toolbox's public source at the pinned commit).
6. **Settings → Secrets and variables → Actions → Secrets (Repository):** `VITE_GOOGLE_OAUTH_CLIENT_SECRET`.
7. **Settings → Environments → New environment `production`:**
   - Deployment branches and tags: **Selected branches and tags → `main`**;
   - no required reviewers (every merge deploys);
   - leave "Allow administrators to bypass" **off**;
   - Environment secret: `CLOUDFLARE_API_TOKEN` = the `activeon-production` token;
   - Environment variable: `PRODUCTION_URL` = `https://activeon.<subdomain>.workers.dev`.
8. **Settings → Environments → New environment `preview`:**
   - Deployment branches: **All branches** (the fork guard is in the workflow);
   - no required reviewers (D4);
   - Environment secret: `CLOUDFLARE_API_TOKEN` = the `activeon-preview` token.
9. **Settings → Actions → General:**
   - Workflow permissions: **Read repository contents**, and tick **Allow GitHub Actions to create and approve pull requests**;
   - Fork pull request workflows: **Require approval for all external contributors**.
10. **Settings → General → Pull Requests:**
    - enable only the method from D1;
    - set its commit message to **Pull request title and description**;
    - tick **Automatically delete head branches**.

Then, once the M12 PR with CODEOWNERS and the new workflows is merged:

11. **Settings → Branches (or Rules → Rulesets, per D5) → `main`:**
    - turn on **Dismiss stale approvals**, **Require status checks** (`Lint, typecheck, test, build` and `PR title`, which appear after they have run once) and **Require conversation resolution**;
    - for D5 (b), create a ruleset on `main` with you in the bypass list as **"For pull requests only"**, then remove the classic rule so the two don't stack.
12. **Settings → Code security:** enable **Private vulnerability reporting** (from #7, needed by `SECURITY.md`).
13. **Actions → Deploy → Run workflow** on `main`. Then:
    - open `PRODUCTION_URL`;
    - check `/version.json` shows the `main` commit;
    - sign in with Google and confirm live sync, timing the first save-to-screen latency (still unmeasured, from #5).
14. **Verify assets roll over:** keep a tab open, merge any small PR, and wait for the deploy. In the old tab, the update banner appears within 15 minutes or on focus. Then force the parser worker to restart (the dev tools' "terminate worker", or reload with the network throttled) and confirm the chunk-load path shows the banner, not a blank screen (TR-10). Record the result in `docs/setup/deploy.md`.
15. **Open a throwaway same-repo PR:**
    - the Preview comment appears;
    - the badge shows "Preview of PR #N";
    - live sign-in works on the Preview;
    - closing the PR deletes the Preview.

    Then **Actions → Parser sync → Run workflow** once, to confirm it reports "no change" at the current pin.
16. **Calendar:** a reminder 11 months out to rotate both Cloudflare tokens (step 3) and update the two environment secrets.

## Appendix B: how Joseph gets previews

- **Once:** accept the collaborator invite (Appendix A step 4). He needs no Cloudflare account.
- **For his own changes:** clone `YassSoliman/idleon-forge` (not a fork), `git switch -c kb/<topic>`, push, and open a draft PR. Within about 10 minutes the PR has a comment with `https://pr-<N>-activeon.<subdomain>.workers.dev`. Each push updates the same URL.
- **For Yasser's or an agent's PRs:** watch the repo (Watch → All activity, or Custom → Pull requests), open the Preview link from the PR comment, and say on the PR what he tried ("Preview checked").
- **On a Preview:** a "Preview of PR #N" badge is always visible. It is a separate origin, so he signs in with Google once per PR, and his production sign-in and history are untouched. What's new there starts empty.
- **Reviews:** with D6 (a), his approval counts on Knowledge Base PRs and he can merge those. Code, parser and `.github/` PRs need Yasser.
- **Forks don't get previews:** if Joseph ever works from a fork, the Preview won't appear. Push branches to the main repo instead.

## Appendix C: release runbooks

**Every PR (author)**

- Conventional Commit title (the check enforces it).
- `What's-new:` line, or `none`, or leave it to the title.
- "Preview checked" filled in for anything a player sees.
- CI green.
- Knowledge Base PRs: Sources per ADR 0004, plus M11's golden-snapshot diff reviewed.

**Patch day (owner or Joseph)**

1. The game patches. Wait until Toolbox's repo shows a commit whose `data/patch-notes.js` names the new game version.
2. **Actions → Parser sync → Run workflow** (optionally pin the SHA).
3. On the sync PR, read in this order:
   - the tripwire result;
   - files outside `vendor/parsers/`;
   - the Account State snapshot changes;
   - the generated Knowledge Base diff;
   - the vendor diff stat.
4. Open the Preview, sign in, and check that both accounts' Now screens still make sense.
5. Mark the PR ready, wait for CI, and merge. Production deploys, and What's new shows "Reads saves from game version …".

**Rollback (owner)**

- **Fast:** from a laptop, `cd apps/activeon && pnpm exec wrangler deployments list`, then `pnpm exec wrangler rollback <version-id> -m "<reason>"`. Then open a revert PR so `main` matches production again. The next merge would otherwise redeploy the bad code.
- **Normal:** revert PR → merge → deploy.

**Token rotation:** create the new token (Appendix A step 3), replace the environment secret, re-run the last Deploy, and delete the old token.
