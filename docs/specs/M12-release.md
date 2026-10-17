# M12 Release

Spec for [#40](https://github.com/YassSoliman/idleon-forge/issues/40), part of map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **decisions ruled by Yasser on 2026-10-17 (§8), red-teamed (§10), ready to build.**

Grounded in:

- [#14](https://github.com/YassSoliman/idleon-forge/issues/14) (architecture, items 10 to 12);
- [#6](https://github.com/YassSoliman/idleon-forge/issues/6) and the hosting research (`docs/research/2026-10-16-hosting.md` on `research/hosting`);
- [#7](https://github.com/YassSoliman/idleon-forge/issues/7) and the open-source research (`docs/research/2026-10-16-oss-setup.md` on `research/oss-setup`);
- [#11](https://github.com/YassSoliman/idleon-forge/issues/11) (Knowledge Base versioning, item 13);
- [#13](https://github.com/YassSoliman/idleon-forge/issues/13) (M12 runs alongside every other module, and each module ships to the shared URL when done);
- the slice-1 code in PR [#28](https://github.com/YassSoliman/idleon-forge/pull/28): `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `apps/activeon/wrangler.jsonc`, `docs/setup/deploy.md`, `docs/setup/live-sign-in.md`, `packages/toolbox-parsers/scripts/sync.sh` and `UPSTREAM`;
- on `main`: `docs/setup/secrets-runbook.md` and `scripts/push-secrets.sh` (how secrets reach the `production` environment without being printed);
- the live repository and Cloudflare state on 2026-10-17, recorded in §5 TR-16 and TR-18 ("today" columns).

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
- The Toolbox mirror `YassSoliman/IdleonToolbox` and the step that keeps it current (D7).
- Amending `docs/setup/secrets-runbook.md` and `scripts/push-secrets.sh` (on `main`) so they create the token TR-17 asks for and can seed the `preview` environment.

**Out of scope**

- **The What's new UI, footer and banners as screens.** M10 owns them; M12 supplies the data and the rules for what to show.
- **Generating Knowledge Base fact entries at re-sync** (ADR 0007). M11 owns the generator; M12 only calls it inside the sync workflow.
- **The Suggestions Worker's code and runtime secrets** (M13, ADR 0008). M12 only provides the deploy and preview pipeline that M13's Worker plugs into.
- **Previews for fork PRs.** Ruled out for the MVP in #6. Fork contributors run `pnpm dev` locally and attach screenshots. The gated `workflow_run` design in the hosting research §5 stays on file for later.
- **A custom domain and branding.** Per map #1, the app starts on `*.workers.dev` and the domain is picked before public alpha. D3 settles the one origin choice that cannot wait: production is `https://activeon.yasser-380.workers.dev` until then.
- **Semver releases, GitHub Releases, tags and npm publishing.** No package is published, and every merge is a release.
- **Analytics and error telemetry** (#14, item 13).
- **Notifications on deploy** (push, Discord). Players learn about changes through What's new.
- **Cloudflare Workers Builds.** It must never be connected: it would be a second deploy path outside the GitHub gates (#7).

## 3. Functional requirements

**Production deploy**

- **FR-1** Every push to `main` deploys ActiveOn to production at `https://activeon.yasser-380.workers.dev` (D3) within 15 minutes (p95), with no manual step.
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
- **FR-12** A Preview has working live sign-in (the same `VITE_*` config as production), so Joseph can test a PR against his real account. A Preview URL is public and guessable (RT-11); until Yasser rules on gating it, the rule is: never sign in on a Preview of code you haven't read the diff of, and never on a parser-sync Preview before the vendor diff and tripwire are reviewed (Appendix C).

**Parser re-sync**

- **FR-13** Once a week on a schedule, and whenever the owner presses "Run workflow" (optionally passing an upstream SHA), the parser sync workflow first brings the mirror `YassSoliman/IdleonToolbox` up to date with upstream (D7), then runs `pnpm sync-parsers <sha|HEAD>` against the mirror.
- **FR-14** If the sync changes nothing the app ships (the vendored tree, the public fixtures and the `vendor/data` tree hash are all unchanged), the run ends green and opens no PR, even when upstream's HEAD moved: Toolbox commits many times a week (100 commits since 2026-10-10), mostly UI churn the parsers never see.
- **FR-15** If it changes, the run opens a PR, or updates the existing one, from branch `chore/parser-sync`. The title is `chore(parsers): sync Toolbox to <sha7> (game <gameVersion>)`. The body holds:
  - the `UPSTREAM` diff;
  - the upstream compare link;
  - `git diff --stat` for `packages/toolbox-parsers/vendor` and the public fixtures;
  - the result of each check (typecheck, contract tests, build);
  - the snapshot changes;
  - the generated Knowledge Base diff summary from M11;
  - the write-call tripwire result (TR-14).
- **FR-16** A sync whose checks fail, or whose `sync.sh` itself dies, still opens the PR, labelled `area:parser` and `do-not-merge`, with the failing output summarized. A broken upstream is something to see, not something to hide. `do-not-merge` is enforced, not cosmetic: the required `Merge gate` check fails while the label is on (TR-1).
- **FR-17** CI runs on the sync PR without a human having to push to it. The sync PR's **Preview is not automatic**: it starts only when Yasser marks the draft ready after reading the vendor diff (RT-1), because a Preview build holds a Cloudflare token.
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
- **FR-26** `main` accepts changes only through PRs that pass the required checks. Direct pushes to `main` are refused for everyone, the owner and agents running with his credentials included (D5). The required checks have **no bypass at all**, the owner included, so `gh pr merge --admin` cannot ship a red PR (RT-3, TR-18). A PR from anyone other than the owner needs a code owner's approval, and an approval is dismissed when new commits are pushed.
- **FR-27** `.github/CODEOWNERS` exists, owns itself, and owns `.github/` with the owner alone. Joseph co-owns `packages/knowledge/` only (D6).
- **FR-28** PRs land as merge commits only (D1). Squash and rebase merges are disabled.
- **FR-29** The What's new line comes from an optional `What's-new:` line in the PR body, falling back to `feat`, `fix` and `perf` titles. The PR title check warns, without failing, when a `feat` or `fix` PR has no such line (D2).

## 4. User stories

Fixtures for these stories are repository states and HTTP responses, not saves: M12 has no Detectors. Each Given / When / Then doubles as a test. Most are scripted tests of the generator scripts (TR-4 to TR-8) or of the app's version logic; a few are manual checks on the first real deploy, marked **(manual)**.

**US-1 Merged work is live for my next session.**
As a player in a Play Session, I want every merged change to be live at the URL I already use, so that I never wonder whether I'm on the latest advice.

- Given a PR is merged to `main` at commit `C`, When the Deploy workflow finishes, Then `GET /version.json` on production returns `commit: C` and the footer on a reloaded tab shows the build id for `C`. **(manual on first deploy, automated by FR-4 afterwards)**
- Given a merge whose tests fail on `main`, When the Deploy workflow runs, Then it stops before `wrangler deploy` and `/version.json` still returns the previous commit.
- Given a `workflow_dispatch` of Deploy on branch `feat/x`, When the job starts, Then GitHub rejects it at the `production` environment and no secret is exposed to the run. **(manual, once)**

**US-2 I know the tab I'm using is out of date.**
As a player in a Play Session, I want to be told when a newer version is out while my tab is open, so that I don't spend a two-hour session on yesterday's advice, and I'm not interrupted mid-click either.

- Given a tab running build `A` and production `version.json` returning build `B`, When the tab regains focus or 15 minutes pass, Then the "New version available, reload" banner appears and the page does not reload. (After a rollback, `B` is older than `A`; the text is the same "A different version of ActiveOn is live. Reload to switch" for both directions, so it never claims an older build is new.)
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
- Given BuildInfo is available, When "Report this" or a Suggestion is filed (M10 or M13), Then the attached context contains `app`, `commit`, `knowledge`, `parsers.toolboxCommit`, `parsers.gameVersion` and `channel` (plus `pr` on a Preview), enough to rebuild exactly what the player ran.

**US-5 The game patched and ActiveOn catches up without anyone remembering.**
As a player in a Play Session, I want ActiveOn to track game patches on its own schedule, so that a patch doesn't leave me with "Can't read your save" for weeks.

- Given upstream Toolbox HEAD changes a vendored parser file, When the scheduled sync runs, Then a **draft** PR `chore(parsers): sync Toolbox to <sha7> (game <ver>)` is open within 30 minutes with CI running on it, and no Preview exists until Yasser marks it ready.
- Given upstream HEAD moved but only outside the vendored paths and `data/`, When the sync runs, Then no PR is opened and the run is green.
- Given a dispatch with `ref` = a commit that exists only in a third-party fork of Toolbox (reachable through GitHub's fork network), When job 1 resolves it, Then the run fails with "not on upstream main" and no PR is opened.
- Given a dispatch with `ref` = `HEAD; curl evil`, When the workflow starts, Then validation rejects it before any shell sees it.
- Given job 1's patch touches a path outside the sync allowlist (for example `apps/activeon/wrangler.jsonc` or `package.json`), When job 2 inspects it, Then job 2 pushes nothing and the run fails, naming the paths.
- Given the mirror's merge-upstream returns `merge_type: merge` or 409 (upstream rewrote history), When job 0 runs, Then job 0 goes red and the report says so; job 1 still runs against upstream directly and the PR body carries a "mirror out of date" alarm.
- Given an open sync PR at upstream commit `U1` and a new upstream commit `U2`, When the sync runs again, Then the same PR is updated to `U2` (branch force-pushed, title and body rewritten) and no second PR appears.
- Given upstream changes that break `pnpm test`, When the sync runs, Then the PR is still opened, labelled `do-not-merge`, its body names the failing test files, and the required `Merge gate` check is red.
- Given an open sync PR that Yasser has marked ready (out of draft), When the next scheduled sync finds a newer upstream, Then job 2 does not push and comments "Sync skipped: PR under review".
- Given the vendored diff adds a Firestore or RTDB write call (TR-14), When the sync runs, Then the PR is labelled `do-not-merge` and the body quotes each match.

**US-6 Joseph tries a change before it lands.**
As a player in a Play Session (Joseph), I want to open any PR's change on its own URL with my real account, so that I can say "this is right for my W3 account" before it affects my sessions.

- Given Joseph has write access and pushes branch `kb/w3-refinery` and opens PR #60, When the Preview workflow finishes, Then PR #60 has one comment with `https://pr-60-activeon.yasser-380.workers.dev`, and that URL shows the "Preview of PR #60" badge.
- Given that Preview, When Joseph signs in with Google on it, Then live sync works exactly as on production. His production sign-in is untouched, because the Preview is a different origin with its own storage.
- Given PR #60 is merged or closed, When the cleanup job runs, Then the Preview URL stops serving PR #60's build.
- Given a fork PR #61, When workflows run, Then CI runs, no Preview is created, and no Cloudflare secret is available to any job.

## 5. Technical requirements

### TR-1 Workflow inventory

All workflows live in `.github/workflows/` and start with `# SPDX-License-Identifier: GPL-3.0-only`. Every workflow sets top-level `permissions: contents: read` and widens permissions per job only.

| File | Trigger | Environment | Purpose |
|---|---|---|---|
| `ci.yml` (exists) | `pull_request` (types `opened, synchronize, reopened, ready_for_review`), `push` to `main`, `workflow_dispatch` | none | lint → typecheck → test → build, plus the bundle budget (TR-12). The job name `Lint, typecheck, test, build` is a required check. |
| `pr-title.yml` (new) | `pull_request` (types `opened, edited, synchronize, reopened, ready_for_review`; `ready_for_review` is how the bot-opened sync PR gets the check, RT-4) | none | FR-25, plus the `What's-new:` line's length (≤ 120 characters) and the D2 warning. A ~30-line inline script reading the title and body from `env:`, no third-party action. Its job name `PR title` is a required check. |
| `merge-gate.yml` (new) | `pull_request` (types `opened, synchronize, reopened, ready_for_review, labeled, unlabeled`) | none | Fails while the PR carries `do-not-merge`, or while the tree holds the sync's failure marker `packages/toolbox-parsers/SYNC-FAILED` (TR-15). Job name `Merge gate` is a required check. |
| `deploy.yml` (exists, amended) | `push` to `main`, `workflow_dispatch` | `production` (deploy job only) | FR-1 to FR-5 |
| `preview.yml` (new) | `pull_request` (types `opened, synchronize, reopened, ready_for_review, closed`), `workflow_dispatch` (input `pr`) | `preview` (deploy and cleanup jobs only) | FR-7 to FR-12 |
| `.github/dependabot.yml` (new) | weekly, ecosystem `github-actions` only | n/a | SHA bumps for pinned actions (TR-20), with `commit-message: { prefix: "ci", include: "scope" }` so the titles pass `PR title` (RT-20) |
| `parser-sync.yml` (new) | `schedule` (weekly, Monday 13:00 UTC), `workflow_dispatch` (input `ref`, default `HEAD`) | `mirror` for job 0 only; no Cloudflare secrets anywhere | FR-13 to FR-18 |

The Preview check is deliberately **not** required: fork PRs never produce one.

**Every workflow that holds a Cloudflare token follows one shape (RT-2, RT-26):**

- **`build` job:** runs in the environment (it needs the six `VITE_*` variables and the public-by-nature `VITE_GOOGLE_OAUTH_CLIENT_SECRET`), but **never names `CLOUDFLARE_API_TOKEN`**. GitHub exposes a secret only to a step whose workflow text references it, so nothing in this job can read the token. It runs install, tests and `vite build`, and uploads `dist/` as an artifact.
- **`deploy` job** (`needs: build`): checks out the **same commit**, restores **no cache**, runs `pnpm install --frozen-lockfile --ignore-scripts --filter @idleon-forge/activeon...` (no dependency lifecycle scripts), refuses to continue if `apps/activeon/wrangler.jsonc` has a `build` key (Wrangler would execute it), downloads `dist/`, and runs only `pnpm exec wrangler`. The token is named in that one step and nowhere else.

So no repository, upstream or dependency code runs earlier in the job that can see the token, and a poisoned `node_modules/.bin/wrangler` or cache entry from another job cannot reach it.

### TR-2 `deploy.yml` amendments to PR #28's version

- Split into the `build` and `deploy` jobs described under TR-1. Today's single job runs `pnpm install` and `pnpm test` (which executes the unreviewed `vendor/data` game data) in the same job as the token step; that is the RT-2 hole.
- The `build` job checks out with `fetch-depth: 0` and `filter: blob:none`, because BuildInfo and the changelog read history (TR-6, TR-7). Only the `build` job restores the `vendor/data` cache, and `fetch-data.sh` verifies the restored tree against `UPSTREAM`'s `dataDigest=` (TR-15) before trusting it. It does **not** use `setup-node`'s pnpm-store cache: the sync's job 1 runs upstream code on the default branch and could seed a cache entry that a later `main` run restores, and a poisoned store would end up in the production bundle (RT-2). A cold install costs about a minute.
- Keep `concurrency: { group: deploy-production, cancel-in-progress: false }` (FR-5: GitHub keeps at most one pending run, the newest).
- Build with `VITE_DEPLOY_CHANNEL=production`. The build script runs `pnpm --filter @idleon-forge/release generate` before `vite build` (TR-3).
- Deploy with `pnpm exec wrangler deploy` (never `npx wrangler@latest`), so the lockfile's exact Wrangler (4.151.1 today) runs, installed with `--ignore-scripts`.
- Add a smoke step (FR-4): `curl -fsS "$PRODUCTION_URL/version.json" | jq -e --arg c "$GITHUB_SHA" '.commit == $c'`, retried for up to 60 s, plus `curl -fsS -o /dev/null -w '%{http_code}' "$PRODUCTION_URL/some/deep/link"` equal to `200`.
- Variables and secrets stay where they already are: in the `production` environment (TR-16). `CLOUDFLARE_ACCOUNT_ID` stays an environment secret (it is not sensitive, but it already exists there and masking it in logs costs nothing), and the six `VITE_*` values stay environment variables. Nothing moves to repository level.

### TR-3 Package boundary: `packages/release`

A new private workspace package `@idleon-forge/release` (GPL-3.0-only), Node-only and build-time only. It contains:

- `src/types.ts`: `BuildInfo`, `WhatsNewFeed` and `WhatsNewEntry` (below). The app imports these with `import type` only.
- `src/build-info.ts` and `src/whats-new.ts`: pure functions over an injected list of commits (`{ sha, date, subject, body, files[] }`), the `UPSTREAM` contents and the environment. They are unit-tested with synthetic commit lists, with no git and no network.
- `src/git.ts`: the only module that shells out (`git log --first-parent --no-renames --name-only origin/main ...`). It always names `origin/main`, because `pull_request` and dispatch checkouts have no local `main` (RT-13). On a Preview it reads `origin/main` for history and `git diff --name-only $(git merge-base origin/main HEAD) HEAD` for the PR's own changes. It is thin and untested beyond a smoke test.
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
  /** Full commit SHA the build was made from. For previews, the PR head commit: preview.yml checks out
   *  `pull_request.head.sha` (or the dispatched PR's `headRefOid`), never the synthetic refs/pull/N/merge. */
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

- The repository allows **merge commits only** (D1). History is read as `git log --first-parent main`, so each PR is one entry and the atomic commits inside it stay on `main`.
- The merge commit message setting is **"Pull request title and description"** (API: `merge_commit_title=PR_TITLE`, `merge_commit_message=PR_BODY`). Today it is `MERGE_MESSAGE` / `PR_TITLE`, which would drop the PR body and every `What's-new:` line, so it must change before the first M12 merge (Appendix A step 10). The merge commit's subject is then `<PR title> (#N)` and its body is the PR body, so the generator never calls the GitHub API.

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

1. The PR number comes from the subject's ` (#N)` suffix (TR-5). For merges made before the setting changed, it comes from `Merge pull request #N`.
2. The **title** is the subject without its ` (#N)` suffix. For an old-format merge (`Merge pull request #N from …`), it is the first non-empty body line.
3. **Game patch first** (RT-12): if the commit changed `gameVersion=` in `packages/toolbox-parsers/UPSTREAM`, the entry is section `game-patch` with the generated text "Reads saves from game version `<new>`", whatever the type, title or `What's-new:` line. Stop here.
4. If the body has a `What's-new: none` line, the commit is skipped. The key match is case-insensitive, accepts a straight or curly apostrophe (`What's-new`, `What’s-new`), and tolerates CRLF line endings.
5. **Text:** taken from the `What's-new: <text>` line if present. Otherwise, for types `feat`, `fix` and `perf` only, the title's description with its first letter upper-cased. Otherwise the commit is skipped (FR-22). A parser sync that leaves `gameVersion` alone but changes generated files under `packages/knowledge/` gets the default text "Game facts refreshed from Toolbox `<toolboxVersion>`" in `advice` (RT-27), unless its PR says `What's-new: none`.
6. **Section:**
   - `advice` if the scope is `kb`, or if any changed file is under `packages/knowledge/`.
   - `app` otherwise.
7. Text longer than 120 characters is truncated to 119 characters plus "…", with a build warning naming the PR. A wording mistake never blocks a deploy; `pr-title.yml` catches it before merge (TR-1). Text is plain: the generator strips backticks and Markdown links.
8. Text never contains a character name or account data. This is enforced by review and by the existing AGENTS.md rule; the generator cannot check it.

The feed is regenerated on every build, so a fix to an old PR's wording is a follow-up PR with `What's-new:` on it, not a history rewrite.

### TR-8 What's new display rules (contract for M10)

- **Storage:** `localStorage["activeon.whatsNew.lastSeen"]` holds `{ id, date }` of the newest entry seen. Every read and write is wrapped in try/catch; if storage fails, What's new is never shown.
- **First visit** (key absent): write the newest id, show nothing.
- **Later visits:** show the entries before `lastSeen` in feed order, at most 10, then "and N more" linking to `https://github.com/YassSoliman/idleon-forge/commits/main`. If `lastSeen.id` is not in the feed, show only entries whose `date` is after `lastSeen.date`, at most 10. That covers both cases: an id aged out past 100 entries (show what is newer), and a production rollback to a build whose feed predates the id (nothing is newer, so nothing is shown, instead of 10 old entries presented as new, RT-27).
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
- Today `apps/activeon/src/worker/parser-client.ts` maps the Worker's `error` event to `kind: 'crash'`, which the UI shows as "Can't read your save" (RT-21). M12 changes that path: on a Worker `error` or a failed dynamic import, the client first fetches `/version.json` (`no-store`); if its `commit` differs from `__BUILD_INFO__.commit`, it raises `chunk-load-failed`, otherwise it keeps today's crash handling.
- In SPA mode Cloudflare may answer a missing hashed asset with `index.html` and status 200. A script or worker response with `Content-Type: text/html` is treated as a missing chunk. Verified on the first redeploy (Appendix A step 14).
- The app never shows advice from a partially loaded engine. This follows the "never show advice from a broken parse" rule (#10, item 13).

### TR-11 `_headers` (in `apps/activeon/public/_headers`)

```
/version.json
  Cache-Control: no-store
/whats-new.json
  Cache-Control: no-cache
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/assets/parse.worker-*
  Content-Security-Policy: default-src 'none'; script-src 'self'; connect-src 'none'
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
  - `worker-src 'self'` (no `blob:`; the parser worker is a same-origin module file);
  - `style-src 'self'`, plus the font host if the prototype's fonts stay remote;
  - `connect-src 'self'`, the Google OAuth endpoints, the Firebase Auth and Firestore endpoints, the game's own Realtime Database host only (`https://idlemmo.firebaseio.com wss://idlemmo.firebaseio.com` plus any `s-*` shard host the SDK is redirected to, found on the Preview), never `*.firebaseio.com`, which admits any project's database including an attacker's (RT-9); and M13's Worker origin once it exists;
  - `img-src 'self' data:`;
  - `frame-ancestors 'none'`;
  - `base-uri 'none'`;
  - `form-action 'none'`.
- The exact host list is generated from what `packages/sync` calls and checked in a Preview with a real sign-in before the first merge that adds it. A CSP that breaks sign-in is a P0 and is caught on the Preview, never in production.
- **The page CSP is not an exfiltration barrier on its own.** Firestore and Identity Toolkit hosts are shared by every Firebase project, so a page-level `connect-src` can't tell the game's project from an attacker's. The barrier for third-party code is the parser Worker's own policy and sandbox:
  - `/assets/parse.worker-*` is served with its own CSP, `connect-src 'none'` (a same-origin module Worker is governed by its own response's policy). The build asserts the worker chunk keeps that file-name pattern, so the rule can't silently stop matching. When two rules set the CSP header, Cloudflare sends both and the browser enforces both, which only narrows it (verify on the first Preview).
  - The worker's first import, before the vendored bundle is evaluated, deletes `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `indexedDB`, `caches`, `importScripts` and `BroadcastChannel` from `self`. The parsers get the save only as a `postMessage` envelope and need none of these. This keeps the Firebase session in IndexedDB (`firebaseLocalStorageDb`) out of reach of vendored code.
  - A unit test runs the worker bootstrap and asserts each of those globals is gone.
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

- **Shape:** a `build` job and a `deploy` job, per TR-1 (the token is named only in the `wrangler` step of `deploy`).
- **When it runs:**
  - on `pull_request` (not `closed`) when `github.event.pull_request.head.repo.full_name == github.repository` **and** `github.actor != 'dependabot[bot]'`. Dependabot runs get no environment secrets, so a Preview would only fail red (RT-20); Dependabot here bumps only action SHAs, which have no player-visible effect;
  - on `workflow_dispatch` with input `pr` (validated `^[0-9]+$`). The job reads `gh pr view <pr> --json isCrossRepository,headRepositoryOwner,headRefOid` and refuses unless `isCrossRepository == false` and the owner is `YassSoliman`, then checks out **`headRefOid`**, never the branch name (a push between the check and the checkout can't swap the code).
  - The parser-sync PR gets **no automatic Preview** (FR-17). Its first Preview comes from the `ready_for_review` event Yasser fires when he takes the draft out of review, after reading the vendor diff.
- **`build` job:** `environment: preview` (for the `VITE_*` values), `permissions: contents: read`. Checks out `pull_request.head.sha` with `fetch-depth: 0` and `filter: blob:none` (TR-3 needs `origin/main` history), restores no cache, builds with `VITE_DEPLOY_CHANNEL=preview` and `VITE_PR_NUMBER=<N>`, uploads `dist/`.
- **`deploy` job:** `environment: preview`, `permissions: contents: read, pull-requests: write, deployments: write`, `concurrency: { group: preview-pr-<N>, cancel-in-progress: true }`.
  - Runs `pnpm exec wrangler preview --name pr-<N> --ignore-base-config --json`, so settings changed in the Cloudflare dashboard can't alter what a Preview is. It reads the URL from the JSON. The field path (`.preview.urls[0]` in the hosting research) is unverified while `wrangler preview` is in open beta, so the step fails loudly if the field is missing rather than posting an empty link.
  - Posts one comment carrying the hidden marker `<!-- activeon-preview -->`, created or updated through the REST API by that marker. Never `gh pr comment --edit-last`, which would overwrite whichever `github-actions[bot]` comment came last (M11's snapshot diff, the sync's notices) (RT-14). The body holds the URL, the commit and BuildInfo's `knowledge` and `gameVersion`, nothing taken from PR text (TR-20).
  - `cloudflare/wrangler-action` is an allowed alternative if it is pinned by commit SHA.
- **Job `cleanup`:** runs on `closed` from the same repo, in the same environment, with the same deploy-job rules. `pnpm exec wrangler preview delete --name pr-<N> --skip-confirmation`, tolerating "not found".
- **`apps/activeon/wrangler.jsonc`:** set `"preview_urls": true` and add the Previews block from the hosting research §1. Previews stay on `workers.dev` for good (free `noindex`, no wildcard certificate). The setting is per Worker, so the 4 other Workers on the `yasser-380` subdomain are unaffected. It also exposes a version-preview URL for each production version; those serve the same reviewed code as production, so they add no new exposure.
- **Wrangler** stays a devDependency at `^4.151.1`, resolved to exactly 4.151.1 by `pnpm-lock.yaml` and installed with `--frozen-lockfile`. A unit test in `packages/release` asserts that the resolved version is ≥ 4.136.3, so a lockfile downgrade fails CI. Wrangler is upgraded only by a PR that changes the lockfile.
- **Preview name:** `pr-<N>`. With the Worker named `activeon`, the label `pr-<N>-activeon` stays far under 63 characters for any realistic N.
- **Not used:** `pull_request_target`, and `workflow_run` with a checkout of PR code.

### TR-14 Write-call tripwire

Read-only toward the game is the project's first rule, and the vendored parsers are third-party code that ships to players' browsers next to their live Firebase session. A small script, `packages/toolbox-parsers/scripts/tripwire.mjs`, runs in CI and in the sync workflow.

- It scans the **un-minified** `vendor/` sources (not the minified bundle, where `push(` and `set(` match thousands of times) for Firebase write APIs (`setDoc`, `updateDoc`, `addDoc`, `deleteDoc`, `writeBatch`, `runTransaction`, RTDB `set(`, `update(`, `push(`, `remove(` on a `ref`) and for imports of `firebase/*`.
- It also scans for network and storage primitives (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `importScripts`, `indexedDB`) and for dynamic property access on `self`, `globalThis` or `window` with a computed key (`self[...]`), the cheap way to hide a `fetch`.
- It compares the matches against an allowlist file of known, reviewed matches, keyed by file and a normalized line, with the reason each is safe.
- Any new match fails CI and labels a sync PR `do-not-merge`.
- This is a tripwire for review, not a proof, and it is easy to evade. The enforcing barrier is the parser Worker's sandbox (TR-11: own CSP, deleted network and storage globals). The human review of the vendor diff remains the gate (FR-18).

### TR-15 `parser-sync.yml`

The workflow runs in three jobs, so upstream code never runs with write access, and its output can change only an allowlisted set of paths.

**Job 0, `mirror`** (D7; `environment: mirror`, restricted to `main`; `permissions: {}`):

1. Runs no checkout and no repository or upstream code. Its only step is `gh api -X POST repos/YassSoliman/IdleonToolbox/merge-upstream -f branch=main`, authenticated with `MIRROR_TOKEN` (TR-16).
2. The response's `merge_type` must be `fast-forward` or `none`; anything else (`merge`) fails the job (RT-8). A 409 (conflict) fails it too. The mirror's own ruleset on `main` (require linear history, block force pushes and deletions) makes a non-fast-forward update impossible even if the API tried one, so the mirror keeps every commit we have ever pinned. A failure is the alarm, not a bug.
3. Upstream edits `.github/workflows/` every month or so, and a token without workflow permission can't move a branch over such commits. `MIRROR_TOKEN` therefore has **Contents: Read and write** and **Workflows: Read and write** on the mirror only; with Actions disabled on the mirror, workflow files there are inert. Confirm on the first upstream workflow change (M).

**Mirror repository rules** (`YassSoliman/IdleonToolbox`): a public fork of `Morta1/IdleonToolbox`, description "Mirror for IdleOn Forge, not maintained; use upstream". Actions **disabled** (upstream ships `.github/workflows/deploy.yml`, which must never run under our account), no secrets, no other collaborators, issues and wiki off, and the `main` ruleset above.

**Job 1, `sync`** (`needs: mirror`, `if: always() && needs.mirror.result != 'cancelled'`, `permissions: contents: read`, no secrets, **no cache**):

1. **Validate the input.** `inputs.ref` reaches the shell only through `env: REF: ${{ inputs.ref }}`, never through `${{ }}` in a `run:` line, and must match `^(HEAD|[0-9a-f]{40})$` (RT-7).
2. Check out `main`. Run `pnpm install --frozen-lockfile`, then `pnpm sync-parsers "$REF"`. `UPSTREAM`'s `repo=` points at the mirror `https://github.com/YassSoliman/IdleonToolbox` (D7). If job 0 failed, `sync.sh` resolves from upstream directly (`UPSTREAM_FETCH_URL` override; `repo=` is still written as the mirror) and the report opens with "Mirror out of date: this pin may not be fetchable after merge", which also sets the failure marker (step 6).
3. **Pin provenance.** GitHub serves any commit in a fork network by SHA, so a SHA that exists only in a third-party fork of Toolbox would otherwise fetch fine (verified on 2026-10-17 against a diverged fork). After resolving, the job requires `gh api repos/Morta1/IdleonToolbox/compare/<sha>...main --jq .status` to be `behind` or `identical`, meaning the commit is on upstream `main`. Otherwise it fails with "not on upstream main" and opens no PR.
4. **Data pin.** `sync.sh` now also writes `dataDigest=` into `UPSTREAM`: the SHA-256 of the sorted per-file SHA-256 listing of `vendor/data/`. `fetch-data.sh` recomputes it after every fetch **and every cache restore** and fails on a mismatch, so `vendor/data/` (gitignored, never in a diff) is pinned by content, and a poisoned cache entry can't pass as the real data (RT-2).
5. **Did anything ship-relevant change?** `changed=true` only if a vendored path, a public fixture, `dataDigest`, `toolboxVersion` or `gameVersion` changed. A new `commit=` alone (upstream UI churn) is `changed=false` and the run ends green (FR-14).
6. Otherwise run `pnpm kb:generate` (M11's generator; skipped with a note until M11 lands), then `pnpm typecheck`, `pnpm test` (CI mode, so a snapshot mismatch fails and is recorded), `pnpm vitest run -u` (so the updated Account State snapshots land in the patch for review), `pnpm build` and the tripwire. Each runs with `continue-on-error`, and its exit code and last 50 lines are recorded. `sync.sh` itself runs under a wrapper, so if it dies (a `patch-notes.js` format change, a missing fixture glob, a fetch error) the report still records why and the PR still opens (FR-16). **If any of these failed, the job writes `packages/toolbox-parsers/SYNC-FAILED`** (the failure summary). The `Merge gate` check fails while that file exists (TR-1), so committing `vitest -u` output can never turn a broken sync green (RT-16).
7. Stage with `git add -A -- <allowlist>` and write `sync.patch` from `git diff --cached --binary`, so new upstream files are included (RT-5). Write `sync-report.md` (FR-15), adding a per-file summary of `vendor/data/` changes (added, removed and changed files with byte deltas), the only view a reviewer gets of the game data. Upload both as an artifact.

**The sync allowlist** (RT-1): `packages/toolbox-parsers/vendor/parsers/**`, `vendor/utility/**`, `vendor/polyfills.js`, `vendor/LICENSE`, `packages/toolbox-parsers/UPSTREAM`, `packages/toolbox-parsers/SYNC-FAILED`, `packages/account-state/fixtures/public/*.json`, `packages/account-state/test/__snapshots__/**`, and M11's generated-output directory under `packages/knowledge/` once it exists.

**Job 2, `open-pr`** (`needs: sync`, `if: needs.sync.outputs.changed == 'true'`, `permissions: contents: write, pull-requests: write, actions: write`):

1. Check out `main`. Download the artifact. **Before applying,** list the patch's paths (`git apply --numstat`) and refuse, with a red run naming them, if any path is outside the allowlist or if `UPSTREAM`'s `repo=` line changed. Then `git apply`. **This job runs no repository scripts and no upstream code.**
2. **Don't overwrite review.** If an open sync PR exists and is **not a draft** (Yasser is reviewing it), or if `git log origin/main..origin/chore/parser-sync` has commits not authored by `github-actions[bot]`, the job pushes nothing and comments "Sync skipped: PR under review" or "Sync skipped: this branch has manual commits; merge or close it first" (RT-15).
3. Otherwise commit as `github-actions[bot]` with the PR title as the message, and force-push to `chore/parser-sync`.
4. Create the labels if missing (`gh label create area:parser … || true`, same for `do-not-merge`; neither exists on 2026-10-17, RT-6). Then `gh pr create --draft` or `gh pr edit` with the report as the body, capped at 60,000 characters (GitHub's limit is 65,536) with a link to the full report artifact, and apply `area:parser`, plus `do-not-merge` when any check or the tripwire failed.
5. Pushes made with `GITHUB_TOKEN` do not start `pull_request` workflows, so the job dispatches **only** `ci.yml` (`gh workflow run ci.yml --ref chore/parser-sync`); `workflow_dispatch` is the documented exception that `GITHUB_TOKEN` may trigger. It does **not** dispatch `preview.yml` (FR-17).
   - The required checks attach by name to the head commit. `Lint, typecheck, test, build` comes from the dispatched CI. `PR title` and `Merge gate` read the `pull_request` event and can't be dispatched, so they first run when Yasser marks the draft ready (`ready_for_review` is in both workflows' types), which also starts the Preview and re-runs CI under a human actor. **(M: confirm on the first sync PR that all three checks attach.)**
6. The PR stays a **draft** until Yasser has read it (Appendix C).

Further rules:

- The scheduled run has `timeout-minutes: 30` and `concurrency: { group: parser-sync, cancel-in-progress: false }`.
- **Cadence:** weekly on Mondays at 13:00 UTC. The game patches every 1 to 2 weeks and Toolbox follows within days. The manual dispatch covers patch day, and the M1 "game updated, parser not caught up yet" banner tells players a sync is due.
- **First real test before patch day:** Appendix A step 15 dispatches the sync with an older upstream `ref` once, so the PR-creation path (labels, body, checks) is exercised before it matters.

### TR-16 Secrets, variables and environments

Every value lives in an **environment**, never at repository level, so no workflow job outside an environment (CI, the PR title check, the sync jobs 1 and 2) can read any of them.

| Name | Kind | Environment | Today (2026-10-17) | Used by | Notes |
|---|---|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | secret | `production` | **exists** | `deploy.yml` | Production token. Created from the "Edit Cloudflare Workers" template per today's secrets runbook, so it is wider than TR-17: replace it with the TR-17 token (Appendix A step 3). |
| `CLOUDFLARE_ACCOUNT_ID` | secret | `production` | **exists** | `deploy.yml` | Not sensitive; kept as a secret where it already is. |
| `VITE_GOOGLE_OAUTH_CLIENT_SECRET` | secret | `production` | **exists** | `deploy.yml` build step | Public by nature (it ships in every tool's bundle, ours included), but kept out of the repo and out of logs. |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_GOOGLE_OAUTH_CLIENT_ID` | variables | `production` | **exist (all six)** | `deploy.yml` build step | Public game values (`docs/setup/live-sign-in.md`). |
| `PRODUCTION_URL` | variable | `production` | new | deploy smoke step | `https://activeon.yasser-380.workers.dev` (D3) |
| `CLOUDFLARE_API_TOKEN` | secret | `preview` | new | `preview.yml` | A **separate** token with the same scope, revocable on its own (D4). |
| `CLOUDFLARE_ACCOUNT_ID`, `VITE_GOOGLE_OAUTH_CLIENT_SECRET` | secrets | `preview` | new | `preview.yml` | Same values as production. |
| The six `VITE_*` variables | variables | `preview` | new | `preview.yml` build step | Copied from production (Appendix A step 8), so a Preview signs in exactly like production (FR-12). |
| `MIRROR_TOKEN` | secret | `mirror` (new, `main` only) | new | `parser-sync.yml` job 0 | Fine-grained, Contents and Workflows: Read and write on `YassSoliman/IdleonToolbox` only, 12-month expiry (D7, TR-15). |

- **Seeding:** `scripts/push-secrets.sh` already pushes secrets to `production` from `~/.config/idleon-forge/secrets.env` without printing them. M12 amends it so that `ENVIRONMENT=preview scripts/push-secrets.sh ~/.config/idleon-forge/preview.env` seeds the preview environment, and so that keys named `VITE_*` that do not end in `_SECRET` are set with `gh variable set` instead of `gh secret set` (they are variables in both environments).
- **No other secrets.** Jobs 1 and 2 of the sync workflow use only `GITHUB_TOKEN`.
- **M13's runtime secrets never enter GitHub.** Today's secrets runbook lists `TURNSTILE_SECRET_KEY` and `SUGGESTIONS_GITHUB_TOKEN` under "Needed later" in the same `secrets.env` that `push-secrets.sh` sends to `production`, which would put an issue-writing token next to the deploy job (RT-18). M12 moves those rows to a "`wrangler secret put` only, never in `secrets.env`" section, and `push-secrets.sh` refuses any key other than the TR-16 names.
- **M13's Worker runtime secrets** (GitHub issue token, Turnstile secret) are set by the owner with `wrangler secret put` directly in Cloudflare and never pass through GitHub. Previews do not inherit production secrets (hosting research §2), so a Suggestions Worker preview cannot file real issues; M13 must make it fail closed.

### TR-17 Cloudflare API token scope

- Account API token, custom, on the one account only.
- **Account → Workers Scripts: Edit.** Add **Account → Account Settings: Read** only if `wrangler deploy` asks for it.
- No zone permissions, no KV, R2, D1 or Queues, no User permissions.
- An expiry of 12 months, with the renewal date written in `docs/setup/deploy.md`.
- **Workers Scripts: Edit is account-wide.** It covers every Worker script on the account: at least the 4 other Workers on `yasser-380.workers.dev`, plus any Worker on the account that serves another domain through a route or custom domain. Either ActiveOn token can overwrite or delete all of them. Cloudflare cannot scope the permission to one script, so this is part of D4's accepted blast radius (TR-20), and moving the Forge to its own Cloudflare account is an open question for Yasser (RT-10).
- Until Appendix A step 3 replaces it, the existing production token (the "Edit Cloudflare Workers" template, which the runbook pairs with "All zones") also holds Workers Routes on every zone. Replacing it is the first M12 setup step, not a later clean-up.
- `docs/setup/secrets-runbook.md` today tells the owner to create the token from **My Profile → API Tokens** with the "Edit Cloudflare Workers" template. M12 rewrites that row to this section's custom **account** token, so the runbook and the spec give one instruction.
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

The `/packages/knowledge/` co-ownership is D6. The path is `packages/knowledge` (as in #14's package list), not `packages/knowledge-base` as in the open-source research. `JoKhalil` is not a collaborator yet (2026-10-17), so his entry does nothing until he accepts the Write invite (Appendix A step 4).

Rules on `main` move to **two rulesets** (D5). The rulesets API answers on this repository (`GET /repos/YassSoliman/idleon-forge/rulesets` returns `[]`), so option (b) is available. A bypass actor skips *every* rule in a ruleset, so a single ruleset with Yasser on its bypass list would let him, and every agent using his credentials, merge a red PR with `gh pr merge --admin` (RT-3). The checks therefore live in a ruleset nobody bypasses. Once both are active, the classic protection is deleted so the rules don't stack.

**Ruleset `main-checks`** (bypass list **empty**, the owner included):

| Setting | Value | Today (classic protection) | Why |
|---|---|---|---|
| Required status checks | **`Lint, typecheck, test, build`, `PR title`, `Merge gate`**, each pinned to the **GitHub Actions** app as its source | none | FR-3, FR-16, FR-25. Pinning the source stops anyone with write access posting a fake green status of the same name (RT-24) |
| Require branches to be up to date | off | off | Two people with few conflicts; deploy re-runs tests on the merged result anyway |
| Force pushes, deletions | blocked | blocked | |

**Ruleset `main-review`** (bypass: `YassSoliman` through the Repository admin role, mode **"For pull requests only"**):

| Setting | Value | Today (classic protection) | Why |
|---|---|---|---|
| Require a pull request | on, 1 approval | on, 1 | Also refuses direct pushes for everyone not bypassing; the PR-only bypass mode refuses them for Yasser too (FR-26) |
| Require review from Code Owners | on | on | Takes effect once CODEOWNERS exists |
| Dismiss stale approvals on new commits | **on** | off | An approval can't be reused for different code |
| Require approval of the most recent push | off | off | With two people, it would block the owner's own fix-ups (research §5) |
| Require conversation resolution | **on** | off | Cheap; review comments can't be lost |

The bypass on `main-review` exists because Yasser can't approve his own PRs and Joseph doesn't review code. It lets Yasser merge his own and agents' PRs without an approval, never without green checks. The cost: if GitHub Actions itself is down, nothing merges; production rollback (Appendix C) doesn't need a merge.

Repository settings:

| Setting | Target | Today |
|---|---|---|
| Merge methods | **merge commits only** (D1) | merge, squash and rebase all enabled |
| Merge commit message | **"Pull request title and description"** (`PR_TITLE` / `PR_BODY`) | `MERGE_MESSAGE` / `PR_TITLE` |
| Automatically delete head branches | on | off |
| Actions → Workflow permissions | "Read repository contents", plus "Allow GitHub Actions to create and approve pull requests" **on** (TR-15) | read; create-PRs off |
| Actions → Fork pull request workflows | "Require approval for all external contributors" | default |
| Actions → Allowed actions | **"Allow select actions"**: `actions/*`, `pnpm/action-setup`, `cloudflare/wrangler-action` only | all actions allowed |
| Actions → "Require actions to be pinned to a full-length commit SHA" | **on** | off (`sha_pinning_required: false`) |
| Environment `production` → "Allow administrators to bypass configured protection rules" | **off**, so the `main`-only rule binds the owner and his agents too (FR-2) | **on** |

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
- **Anyone with write access can write a branch whose workflow uses the preview token** (D4, accepted). The preview token has the same Cloudflare power as production's, because Cloudflare cannot scope a token to previews or to one Worker. That power covers ActiveOn production **and every other Worker on the account** (the 4 on `yasser-380.workers.dev` and any serving other domains, TR-17). The practical rule: write access is granted only to people the owner would trust to deploy production and to touch those Workers. Today that is Joseph only; revisit before a third person gets write access.
- Pin **every** action by full commit SHA, `actions/*` and `pnpm/action-setup` included (a moved tag runs in the same job as the build), enforced by the repository's SHA-pinning setting and the allowed-actions list (TR-18). Dependabot for `github-actions` keeps the SHAs current weekly (TR-1) (RT-19).
- Dependency install scripts never run in a job that names a token (`--ignore-scripts` in every `deploy` job, TR-1).
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
| **Fork PR** | CI only. No preview, no comment (a fork token can't comment). Contributor docs explain why. No secret or variable is reachable: every value is environment-scoped (TR-16), and no fork-triggered job runs in an environment. |
| **A stranger opens a Preview URL** | Preview URLs are public and sequential, and the repo is public. A stranger can load any Preview and sign in with their own account. Open question for Yasser (RT-11, final report); until ruled, previews of unreviewed code are the accepted state and FR-12's sign-in rule applies to us. |
| **First-time contributor from a fork** | Workflows wait for the owner's approval (repository setting). |
| **Joseph's preview login** | Each `pr-<N>` origin has its own IndexedDB, so Joseph signs in once per PR. His production session is unaffected. |
| **Sync: no upstream change** | Green, no PR (FR-14). |
| **Sync: upstream broken** | PR with `do-not-merge` (FR-16). |
| **Sync: upstream force-pushed, deleted or made private** | Builds keep working: `fetch-data.sh` reads the pinned SHA from the mirror (D7), which still holds it. Job 0's merge-upstream fails (force-push) or upstream disappears, the scheduled run goes red, and GitHub emails the owner. The owner decides whether to follow the rewritten upstream (re-point the mirror by hand) or stay pinned. |
| **Sync: the mirror itself is unreachable** | Same as an upstream outage before D7: cold builds fail until it is back; the 7-day CI cache covers warm ones. |
| **Sync: a PR is already open and a human pushed fix-ups to it** | The next scheduled run would force-push and erase them. Rule: if `origin/main..chore/parser-sync` has commits not authored by `github-actions[bot]`, job 2 does not push. It comments "Sync skipped: this branch has manual commits; merge or close it first." |
| **Sync: Yasser is mid-review when upstream moves** | Job 2 never pushes to a sync PR that is out of draft (TR-15). Yasser merges with `gh pr merge --merge --match-head-commit <reviewed sha>`, so a commit he didn't read can't ride along (RT-15). |
| **Sync: upstream is mid-update on patch day** (parsers updated, `patch-notes.js` not yet, or the reverse) | The PR title's game version comes from `patch-notes.js`, so it may name the old version. The patch-day runbook waits for a commit whose patch notes name the new version; a too-early sync PR is closed, not merged. |
| **Sync: `MIRROR_TOKEN` expired** | Job 0 fails; job 1 still runs against upstream and opens the PR with the failure marker, so the patch is visible but can't merge until the mirror is current (TR-15). |
| **Dependabot PR** | CI and `PR title` run (titles are `ci(deps): …`); no Preview (TR-13). |
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

## 8. Decisions

Ruled by Yasser on 2026-10-17 on PR #45: every recommendation accepted as written, plus the D3 detail in the PR comments.

- **D1 Merge method: merge commits only.** History is read as `git log --first-parent main` (TR-5). *Why:* it keeps the atomic Conventional Commits AGENTS.md asks for, still gives one changelog line per PR, and needs no GitHub API call at build time. Squash and rebase are disabled (FR-28, TR-18).
- **D2 The What's new line: optional `What's-new:` line in the PR body**, falling back to `feat`, `fix` and `perf` titles; the PR title check prints a non-blocking warning when a `feat` or `fix` PR has none (FR-29, TR-1, TR-7). *Why:* developer titles read badly to players, but a mandatory line would add a gate to every agent PR, and `What's-new: none` already covers the noise case.
- **D3 Keep the account's `workers.dev` subdomain `yasser-380`.** Production is `https://activeon.yasser-380.workers.dev` until a Forge domain is bought; Previews are `https://pr-<N>-activeon.yasser-380.workers.dev` (FR-1, TR-16, Appendix A). *Why:* 4 other Workers already live on `yasser-380`, and renaming it would move all of them; the recommendation said keep it in that case. Changing ActiveOn's origin later still signs every player out, so the domain move is planned for before public alpha, not after.
- **D4 Preview token blast radius: accepted.** Two Cloudflare tokens (`production` and `preview` environments) so either can be revoked alone, no required reviewer on `preview`, and write access only for people trusted with production, today Joseph (TR-16, TR-20). *Why:* a reviewer gate would make Joseph wait on Yasser for every push, which defeats "Joseph tries a change before it lands". Revisit before a third person gets write access.
- **D5 The owner goes through PRs too: a ruleset with Yasser on the bypass list in "For pull requests only" mode** (FR-26, TR-18). The rulesets API answers on this repo, so the "else (a)" fallback is not needed. *Why:* it closes the one path where an agent running as Yasser pushes untested code straight to the live URL, at no cost to how he works.
- **D6 Joseph co-owns `/packages/knowledge/`.** He can approve and merge Knowledge Base PRs, which deploys; code, parser and `.github/` PRs need Yasser (FR-27, TR-18, Appendix B). *Why:* it matches #11 ("only Yasser and Joseph merge Knowledge Base changes for now") and puts Knowledge Base review where Joseph's W3 account makes him the better judge.
- **D7 Mirror Toolbox at `YassSoliman/IdleonToolbox`.** `UPSTREAM`'s `repo=` points at the fork, and `parser-sync.yml` fast-forwards the fork from upstream before pinning (TR-15 job 0), so every pinned SHA is preserved. Labelled "mirror, not maintained", Actions disabled. *Why:* it removes the only external dependency that can stop us shipping even a Knowledge Base fix, for one fork and a one-line change; Toolbox accepts no PRs, so a public fork has no social downside.

## 9. Threat notes (drafting)

1. **A malicious or broken upstream commit ships to players' browsers next to their live game session.** Defences:
   - a human merges every sync (FR-18);
   - the sync runs upstream code only in a job with no write token and no secrets (TR-15);
   - the write-call and network tripwire (TR-14);
   - the parser Worker's own CSP (`connect-src 'none'`) and its deleted network and storage globals keep vendored code away from the network and the Firebase session (TR-11). The page CSP alone could not: Firebase hosts are shared by every project;
   - the sync can only change allowlisted paths, its output never runs next to a token before a human has read it, and `vendor/data` is pinned by digest (TR-15);
   - the Preview lets us sign in and watch network traffic before merging.

   Residual risk: a reviewer skims a 3,000-line vendor diff. The PR body puts the tripwire result and the files outside `parsers/` at the top.
2. **Same-repo write access equals a production deploy.** Any collaborator can edit `preview.yml` on a branch and use the preview token against production. Defences: two tokens (one is revocable alone), minimal token scope (TR-17), and write access only for production-trusted people (D4). This is stated plainly instead of implying previews are sandboxed.
3. **The owner's own credentials bypass every gate.** Agents run as Yasser, and Yasser is an admin. Defence: D5 (a ruleset with PR-only bypass) and the `production` environment's admin bypass turned off (TR-18). Until Appendix A step 11 is done, AGENTS.md's "never push to `main`" is the only guard, and it is prose, not enforcement.
4. **What's new lies or leaks.** A commit title can be wrong, jargon, or contain a character name. Defences:
   - only `feat`, `fix` and `perf` reach players by default (FR-22);
   - an explicit `What's-new:` line overrides the title (TR-7);
   - the length and Markdown checks (TR-7);
   - the AGENTS.md rule against names in commits, which review enforces. The generator cannot.

   A wrong entry is fixed forward with a `What's-new:` PR, never by rewriting history.
5. **A long Play Session on a stale tab gives yesterday's advice, or dies on a missing chunk.** Defences: the version check on focus and every 15 minutes (TR-9), chunk-load failures turned into the update banner (TR-10), no auto-reload mid-session, and `index.html` served `no-cache` so a reload always gets the new build.
6. **The sync PR never gets CI, so it sits unmerged or gets merged blind.** `GITHUB_TOKEN` pushes don't trigger workflows. Defences: dispatching `ci.yml` (TR-15, job 2 step 5); `ready_for_review`, which Yasser fires after reading the diff and which starts `PR title`, `Merge gate` and the Preview; and the required check, which blocks merge until CI is green (an admin bypass is a visible, deliberate act).
7. **Scheduled syncs stop silently.** GitHub disables cron after 60 days without activity. Defences: the M1 "parser not caught up" banner is player-visible, and patch day has a manual runbook. In practice, active development keeps the schedule alive.
8. **A CSP or header change breaks sign-in in production.** Defences: headers ship through the same Preview path, and TR-11 requires a real sign-in on a Preview before any header PR merges. Rollback (FR-6) takes under 5 minutes.
9. **A Knowledge Base version can't be reproduced.** If it came from wall-clock time or a counter file, two builds of the same commit would disagree. Defence: it is a pure function of first-parent git history (TR-6), unit-tested on synthetic histories. BuildInfo uses the commit date, not the build time.
10. **The pipeline depends on GitHub being the source of truth for Toolbox's data.** Defence: D7 (the mirror, fast-forward only, so a rewritten upstream cannot erase a pin), plus the per-pin CI cache.

## 10. Red-team log

On 2026-10-17 an independent reviewer that had not seen the drafting attacked the decisions-folded spec, with a focus on secrets in previews and forks, the supply chain and patch day. It returned 29 findings. Each one was checked against the slice-1 code (PR #28), `main`, the live GitHub API or Wrangler 4.151.1's help before its verdict. Counts: **P0 2, P1 9, P2 10, P3 8**. Verdicts: **27 fixed, 2 deferred** to a decision by Yasser (both with interim mitigations already in the spec), **0 rejected** in full. One sub-claim was rejected (RT-11).

| ID | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| RT-1 | P0 | The sync patch could touch any path (`wrangler.jsonc` `build`, `package.json`, `UPSTREAM` `repo=`), and the auto-dispatched Preview then ran it next to the Cloudflare token | Fixed | Path allowlist checked before `git apply`, `repo=` change refused, no automatic sync Preview, and `deploy` jobs refuse a `build` key (TR-1, TR-15, FR-17) |
| RT-2 | P0 | `vendor/data` is never reviewed, runs in the token-holding deploy job, and can be planted through main's cache | Fixed | Split `build` and `deploy` jobs, no cache or install scripts where the token is named, `dataDigest=` verified on every fetch and cache hit, and a data summary in the sync PR (TR-1, TR-2, TR-15) |
| RT-3 | P1 | A ruleset bypass skips required checks too, so the owner and agents could merge red PRs | Fixed | Two rulesets: `main-checks` with no bypass, `main-review` with Yasser's PR-only bypass (TR-18, FR-26) |
| RT-4 | P1 | `PR title` never runs on the bot-opened sync PR | Fixed | `ready_for_review` added to `pr-title.yml` and `merge-gate.yml`, and Yasser's ready click is part of the runbook (TR-1, TR-15, Appendix C) |
| RT-5 | P1 | `git diff --binary` drops new upstream files | Fixed | `git add -A -- <allowlist>` then `git diff --cached --binary` (TR-15 step 7) |
| RT-6 | P1 | The `area:parser` and `do-not-merge` labels don't exist (checked: not in the repo's labels), so `gh pr create --label` fails | Fixed | Job 2 creates them idempotently; Appendix A step 15 exercises the PR path with an older `ref` (TR-15) |
| RT-7 | P1 | `${{ inputs.ref }}` was interpolated into the shell, and GitHub's fork network serves third-party fork commits by SHA (the reviewer showed this live) | Fixed | `env:` plus regex validation, and a `compare/<sha>...main` provenance check against upstream (TR-15 steps 1 and 3, US-5) |
| RT-8 | P1 | merge-upstream can make a merge commit, and a Contents-only token can't move the branch over upstream workflow edits (upstream changed `.github/workflows` twice on 2026-10-07) | Fixed | `merge_type` must be `fast-forward` or `none`, a linear-history ruleset on the mirror, and Workflows: write on `MIRROR_TOKEN` (M: confirm on the first upstream workflow change) (TR-15, Appendix A steps 5 and 6) |
| RT-9 | P1 | Vendored code in the parser Worker can read the Firebase session in IndexedDB, and `*.firebaseio.com` plus shared Firebase hosts make `connect-src` no barrier | Fixed | Worker-only CSP `connect-src 'none'`, network and storage globals deleted before the vendored bundle loads, a pinned RTDB host, no `blob:`, and the tripwire run on un-minified sources (TR-11, TR-14) |
| RT-10 | P1 | Workers Scripts: Edit covers every Worker on the account, not just the 4 on `yasser-380`, and the existing template token also holds Routes on every zone | **Deferred** (needs Yasser) | Spec states the full blast radius and makes replacing the token the first setup step (TR-17, TR-20). Moving to a dedicated Cloudflare account is Yasser's call |
| RT-11 | P1 | Preview URLs are public and sequential, and serve unreviewed code with live sign-in | **Deferred** (needs Yasser) | Interim: never sign in on an unread diff, no sync Preview before review (FR-12, Appendix B, C). Whether to gate Previews (Cloudflare Access) is Yasser's call. Sub-claim rejected: version-preview URLs serve already-reviewed production code, so they add no exposure (TR-13) |
| RT-12 | P2 | Rule order skipped the "Game patch support" entry for `chore(parsers)` merges | Fixed | The game-patch rule runs first; curly apostrophes and CRLF are tolerated (TR-7) |
| RT-13 | P2 | `git log … main` fails on PR checkouts, and Previews built `refs/pull/N/merge`, not the head | Fixed | `origin/main`, `--no-renames`, `fetch-depth: 0`, and checkout of `head.sha` or `headRefOid` (TR-3, TR-4, TR-13) |
| RT-14 | P2 | `gh pr comment --edit-last` overwrites other bot comments | Fixed | A hidden-marker comment updated through the API (TR-13) |
| RT-15 | P2 | A sync force-push during review could land unread code | Fixed | No push once the PR is out of draft; merge with `--match-head-commit` (TR-15, §6, Appendix C) |
| RT-16 | P2 | `do-not-merge` was cosmetic, and `vitest -u` made CI green | Fixed | Required `Merge gate` check plus the `SYNC-FAILED` marker file (TR-1, TR-15, FR-16) |
| RT-17 | P2 | Patch-day dead ends: body over 65,536 characters, `sync.sh` dying under `set -e`, an expired mirror token blocking syncs, and upstream churn (100 commits since 2026-10-10) making a PR every week | Fixed | Body capped at 60,000 characters, a wrapper around `sync.sh`, job 1 runs when job 0 fails (with the marker set), and "changed" redefined by content (TR-15, FR-14) |
| RT-18 | P2 | The secrets runbook would put M13's issue-writing token in the `production` environment | Fixed | The runbook moves those keys to `wrangler secret put` only, and `push-secrets.sh` refuses non-TR-16 keys (TR-16) |
| RT-19 | P2 | Actions aren't SHA-pinned, and the repo allows every action (`sha_pinning_required: false`, confirmed) | Fixed | Pin everything, turn on the SHA-pinning setting, set an allowed-actions list, Dependabot for SHAs (TR-18, TR-20) |
| RT-20 | P2 | Dependabot titles fail `PR title`, and Dependabot Previews fail for lack of secrets | Fixed | A `ci` commit prefix in `dependabot.yml`, and no Preview for `dependabot[bot]` (TR-1, TR-13) |
| RT-21 | P2 | A chunk-load failure shows "Can't read your save" (confirmed: `parser-client.ts` maps `error` to `crash`) | Fixed | Check `/version.json` on a Worker error, and treat an HTML response for a script as a missing chunk (TR-10) |
| RT-22 | P3 | The `/index.html` header rule never matches `/` or deep links | Fixed | Rule dropped; Cloudflare's default revalidation applies (TR-11) |
| RT-23 | P3 | Joseph can't approve his own Knowledge Base PRs, and mixed-path PRs need Yasser | Fixed | Appendix B states it |
| RT-24 | P3 | Anyone with write access could post a fake green status for a required check | Fixed | Each required check's source pinned to the GitHub Actions app (TR-18) |
| RT-25 | P3 | `wrangler preview` is open beta; the JSON path is unverified; dashboard base config can override | Fixed | `--ignore-base-config`, and the step fails loudly on a missing URL field (TR-13) |
| RT-26 | P3 | pnpm 9 runs install scripts in the token job | Fixed | `--ignore-scripts` in every `deploy` job (TR-1) |
| RT-27 | P3 | What's new after a rollback; a misleading banner text; KB fact refreshes never announced | Fixed | `lastSeen` stores `{ id, date }`, a direction-neutral banner, a default "Game facts refreshed" entry (TR-7, TR-8, US-2) |
| RT-28 | P3 | Report context dropped `toolboxCommit` | Fixed | Added, with `commit` and `pr` (US-4) |
| RT-29 | P3 | The manual-commit guard scanned the whole branch; the dispatch trusted branch names | Fixed | `origin/main..chore/parser-sync`, `isCrossRepository == false`, and checkout of `headRefOid` (TR-13, TR-15, §6) |

## Appendix A: first-deploy checklist for Yasser

Do these in order. Each step says where. Steps 1 to 10 are one-time setup; 11 to 16 verify it. **Already done on 2026-10-17:** the `production` environment exists, locked to `main`, holding `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VITE_GOOGLE_OAUTH_CLIENT_SECRET` and the six `VITE_*` variables (pushed with `scripts/push-secrets.sh`). The steps below say what changes.

**Cloudflare** (dash.cloudflare.com)

1. **Subdomain:** nothing to do. It is `yasser-380` and stays (D3). Production will be `https://activeon.yasser-380.workers.dev`.
2. **Account ID:** already in `production`. Keep it at hand for the preview environment (step 8).
3. **Manage account → Account API tokens → Create token → Custom token**, twice (TR-17):
   - `activeon-production`: Account → Workers Scripts → Edit, on this account only, expiring in 12 months. It **replaces** the existing production token, which was made from the "Edit Cloudflare Workers" template and is wider than TR-17. Push it with `scripts/push-secrets.sh`, then delete the old token in Cloudflare;
   - `activeon-preview`: the same permissions, its own expiry.

   Copy each token once, straight into the `chmod 600` file the secrets runbook describes, never into chat. Do **not** connect Workers Builds (Workers & Pages → the Worker → Settings → Builds must stay disconnected).

**GitHub** (github.com/YassSoliman/idleon-forge)

4. **Settings → Collaborators → Add people:** `JoKhalil` with **Write**. Joseph must accept the email invite. CODEOWNERS entries for him do nothing until he does.
5. **Toolbox mirror (D7):** on `github.com/Morta1/IdleonToolbox`, **Fork** to `YassSoliman/IdleonToolbox` (all branches not needed; `main` only). On the fork: description "Mirror for IdleOn Forge, not maintained; use upstream"; Settings → Actions → **Disable actions**; Settings → General → untick Issues and Wiki; Settings → Rules → new branch ruleset on `main`: require linear history, block force pushes and deletions, empty bypass list (TR-15).
6. **Mirror token:** GitHub → Settings → Developer settings → Fine-grained tokens → Generate: `idleon-forge-mirror`, Repository access only `YassSoliman/IdleonToolbox`, Permissions **Contents: Read and write** and **Workflows: Read and write** (nothing else; Workflows is needed when upstream edits its workflow files, and is inert because Actions are off on the mirror), 12-month expiry. Then change `UPSTREAM`'s `repo=` to the mirror in the M12 PR.
7. **Settings → Environments → `production`** (exists):
   - Deployment branches: already **Selected branches → `main`**; keep it;
   - untick **"Allow administrators to bypass configured protection rules"** (today: ticked);
   - add the environment variable `PRODUCTION_URL` = `https://activeon.yasser-380.workers.dev`.
8. **Settings → Environments → New environment `preview`:**
   - Deployment branches: **All branches** (the fork guard is in the workflow);
   - no required reviewers (D4);
   - secrets `CLOUDFLARE_API_TOKEN` (the `activeon-preview` token), `CLOUDFLARE_ACCOUNT_ID`, `VITE_GOOGLE_OAUTH_CLIENT_SECRET`: write them to `~/.config/idleon-forge/preview.env` and run `ENVIRONMENT=preview scripts/push-secrets.sh ~/.config/idleon-forge/preview.env` (TR-16);
   - the six `VITE_*` variables, copied from production: `gh variable list -e production --json name,value -q '.[]|"\(.name)=\(.value)"' | while IFS='=' read -r k v; do gh variable set "$k" -e preview -b "$v"; done`.
   
   **New environment `mirror`:** Deployment branches **Selected → `main`**; secret `MIRROR_TOKEN` (step 6).
9. **Settings → Actions → General:**
   - Workflow permissions: **Read repository contents** (already), and tick **Allow GitHub Actions to create and approve pull requests**;
   - Fork pull request workflows: **Require approval for all external contributors**.
10. **Settings → General → Pull Requests:**
    - untick **Allow squash merging** and **Allow rebase merging**, leaving only merge commits (D1);
    - set the merge commit message to **Pull request title and description**;
    - tick **Automatically delete head branches**.

Then, once the M12 PR with CODEOWNERS and the new workflows is merged:

11. **Settings → Rules → Rulesets** on `main` (D5, TR-18), two of them:
    - `main-checks`: required checks `Lint, typecheck, test, build`, `PR title` and `Merge gate` (they appear after they have run once), each with source **GitHub Actions**; block force pushes and deletions; **empty bypass list**;
    - `main-review`: require a PR with 1 approval and Code Owner review, dismiss stale approvals, require conversation resolution; bypass list: you (Repository admin role), mode **"For pull requests only"**.

    Activate both, then delete the classic rule under Settings → Branches. Also under Settings → Actions → General: **Allow select actions** (`actions/*`, `pnpm/action-setup`, `cloudflare/wrangler-action`) and tick **Require actions to be pinned to a full-length commit SHA**.
12. **Settings → Code security:** enable **Private vulnerability reporting** (from #7, needed by `SECURITY.md`).
13. **Actions → Deploy → Run workflow** on `main`. Then:
    - open `https://activeon.yasser-380.workers.dev`;
    - check `/version.json` shows the `main` commit;
    - sign in with Google and confirm live sync, timing the first save-to-screen latency (still unmeasured, from #5).
14. **Verify assets roll over:** keep a tab open, merge any small PR, and wait for the deploy. In the old tab, the update banner appears within 15 minutes or on focus. Then force the parser worker to restart (the dev tools' "terminate worker", or reload with the network throttled) and confirm the chunk-load path shows the banner, not a blank screen (TR-10). Record the result in `docs/setup/deploy.md`.
15. **Open a throwaway same-repo PR:**
    - the Preview comment appears with `https://pr-<N>-activeon.yasser-380.workers.dev`;
    - the badge shows "Preview of PR #N";
    - live sign-in works on the Preview;
    - closing the PR deletes the Preview.

    Then **Actions → Parser sync → Run workflow** twice:
    - with no input, to confirm the mirror job is green and the sync reports "no change" at the current pin;
    - with `ref` = an older upstream commit on `main`, to exercise the PR path once: the labels get created, the draft PR opens with its report, CI attaches, and marking it ready brings `PR title`, `Merge gate` and the Preview. Then close that PR unmerged.
16. **Calendar:** a reminder 11 months out to rotate both Cloudflare tokens (step 3) and the mirror token (step 6), and update the environment secrets.

## Appendix B: how Joseph gets previews

- **Once:** accept the collaborator invite (Appendix A step 4). He needs no Cloudflare account.
- **For his own changes:** clone `YassSoliman/idleon-forge` (not a fork), `git switch -c kb/<topic>`, push, and open a draft PR. Within about 10 minutes the PR has a comment with `https://pr-<N>-activeon.yasser-380.workers.dev`. Each push updates the same URL.
- **For Yasser's or an agent's PRs:** watch the repo (Watch → All activity, or Custom → Pull requests), open the Preview link from the PR comment, and say on the PR what he tried ("Preview checked").
- **On a Preview:** sign in only on a PR whose diff he (or Yasser) has read; Preview URLs are public and run unreviewed code (FR-12). A "Preview of PR #N" badge is always visible. It is a separate origin, so he signs in with Google once per PR, and his production sign-in and history are untouched. What's new there starts empty.
- **Reviews:** under D6, his approval counts on Knowledge Base PRs written by Yasser or an agent, and he can merge those. His **own** Knowledge Base PRs still need Yasser's approval (GitHub never lets an author approve their own PR), and so does any PR that also touches a path outside `packages/knowledge/` (the last matching CODEOWNERS pattern wins, RT-23). Code, parser and `.github/` PRs need Yasser.
- **Forks don't get previews:** if Joseph ever works from a fork, the Preview won't appear. Push branches to the main repo instead.

## Appendix C: release runbooks

**Every PR (author)**

- Conventional Commit title (the check enforces it).
- `What's-new:` line, or `none`, or leave it to the title.
- "Preview checked" filled in for anything a player sees.
- CI green.
- Knowledge Base PRs: Sources per ADR 0004, plus M11's golden-snapshot diff reviewed.

**Patch day** (Yasser or Joseph runs steps 1 to 3 and may check the Preview in step 5; only Yasser marks ready, approves and merges, because `packages/toolbox-parsers/` is his alone under D6)

1. The game patches. Wait until Toolbox's repo shows a commit on `main` whose `data/patch-notes.js` names the new game version. A sync from before that is closed, not merged.
2. **Actions → Parser sync → Run workflow** (optionally pin the 40-character SHA). If job 0 (mirror) is red, read why first: a rewritten upstream needs a decision, an expired `MIRROR_TOKEN` needs rotating (Appendix A step 6) and a re-run.
3. On the **draft** sync PR, before any Preview exists, read in this order:
   - the tripwire result, and whether `SYNC-FAILED` is present;
   - files outside `vendor/parsers/`;
   - the `vendor/data/` change summary;
   - the Account State snapshot changes;
   - the generated Knowledge Base diff;
   - the vendor diff stat.
4. If it looks safe, Yasser marks the PR **ready for review**. That starts `PR title`, `Merge gate`, CI and the Preview. If adapter fixes are needed, push them to `chore/parser-sync` (this pauses later syncs on this branch until merge) and delete `SYNC-FAILED` in the same fix-up once tests pass.
5. Only now open the Preview, sign in, and check that both accounts' Now screens still make sense. Never sign in on a sync Preview before step 3 (FR-12).
6. Yasser approves and merges with `gh pr merge <N> --merge --match-head-commit <the sha he reviewed>`. Production deploys, and What's new shows "Reads saves from game version …".

**Rollback (owner)**

- **Fast:** from a laptop, `cd apps/activeon && pnpm exec wrangler deployments list`, then `pnpm exec wrangler rollback <version-id> -m "<reason>"`. Then open a revert PR so `main` matches production again. The next merge would otherwise redeploy the bad code.
- **Normal:** revert PR → merge → deploy.

**Token rotation:** create the new token (Appendix A step 3), replace the environment secret, re-run the last Deploy, and delete the old token.
