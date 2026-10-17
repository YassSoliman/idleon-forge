# Release runbooks

How a change reaches a Play Session ([M12](../specs/M12-release.md)). Every merge to `main` is a
release: it deploys to `https://activeon.idleon.workers.dev`, and players see it in What's new.

## Repository settings as code

[`scripts/repo-settings.sh`](../../scripts/repo-settings.sh) applies and shows the GitHub settings
M12 needs (merge method, environments, rulesets, Actions policy). `scripts/repo-settings.sh show`
prints the live state; `scripts/repo-settings.sh post-merge` is run once after the M12 PR merges
(it adds the `PR title` and `Merge gate` required checks and the SHA-pinning policy).

| Ruleset | Rules | Bypass |
|---|---|---|
| `main-checks` | required checks `Lint, typecheck, test, build`, `PR title`, `Merge gate` (source: GitHub Actions); no force push, no deletion | **nobody**, the owner included |
| `main-review` | PR with 1 approval and Code Owner review, stale approvals dismissed, conversations resolved, merge commits only | the owner, **for pull requests only** |

## Every PR (author)

- Conventional Commit title (`PR title` enforces it).
- `What's-new:` line, or `What's-new: none`, or leave it empty to use a `feat`/`fix`/`perf` title.
  At most 120 characters, plain text, no character names or account data.
- "Preview checked" filled in for anything a player sees.
- CI green. Knowledge Base PRs: Sources per ADR 0004, plus M11's golden-snapshot diff reviewed.

Merges are merge commits whose message is the PR title and body, so the `What's-new:` line reaches
`main` and `whats-new.json` is built from git alone.

## Previews

- Every same-repo PR (drafts too) gets `https://pr-<N>-activeon.idleon.workers.dev` and one PR
  comment, edited in place on each push. The page shows "Preview of PR #N" (M10 renders the badge).
- Previews sit behind **Cloudflare Access**: the first visit asks for an email and sends a one-time
  PIN. Allowed: Yasser and Joseph (Zero Trust → Access → Policies → "Forge previews: Yasser and
  Joseph"). Production is not behind Access.
- Fork PRs, Dependabot PRs and the parser-sync PR while it is a draft get no Preview.
- Re-run a Preview by hand: Actions → Preview → Run workflow → `pr` = the PR number.

### For Joseph

1. Accept the collaborator invite (Write). No Cloudflare account needed.
2. Clone `YassSoliman/idleon-forge` (not a fork), `git switch -c kb/<topic>`, push, open a draft PR.
   About 10 minutes later the PR has the Preview link; each push updates it.
3. Open the link, enter your email, type the PIN Cloudflare sends.
4. Sign in to IdleOn on a Preview only for a PR whose diff you or Yasser have read. Each Preview is
   its own origin: you sign in once per PR, and your production sign-in is untouched.
5. Reviews: your approval counts on Knowledge Base PRs by Yasser or an agent. Your own PRs, and any
   PR touching paths outside `packages/knowledge/` (or inside its `detectors/`, `generators/`,
   `src/`) and `fixtures/scrubbed/`, need Yasser.

## Patch day

Only Yasser marks ready, approves and merges a sync PR (`packages/toolbox-parsers/` is his alone).

1. The game patches. Wait until Toolbox's `main` has a commit whose `data/patch-notes.js` names the
   new game version. A sync from before that is closed, not merged.
2. **Actions → Parser sync → Run workflow** (optionally a 40-character upstream SHA). If job
   `mirror` is red, read why: a 409 or `merge_type` other than fast-forward means upstream rewrote
   history (decide by hand); an expired `MIRROR_TOKEN` needs rotating, then re-run.
3. On the **draft** sync PR (opened by the Forge Bot), before any Preview exists, read in order: the
   tripwire result and whether `SYNC-FAILED` is present; files outside `vendor/parsers/`; the
   `vendor/data/` summary; the Account State snapshot changes; the Knowledge Base diff; the vendor
   diff stat.
4. If it looks safe, mark it **Ready for review**. That starts the Preview. If adapter fixes are
   needed, push them to `chore/parser-sync` (later syncs then skip this branch until it merges) and
   delete `SYNC-FAILED` in the same commit once tests pass. A new tripwire match is fixed by adding
   it, with the reason it is safe, to `packages/toolbox-parsers/scripts/tripwire-allowlist.json`.
5. Only now open the Preview, sign in, and check both accounts' Now screens.
6. Approve and merge with `gh pr merge <N> --merge --match-head-commit <the sha you reviewed>`.
   Production deploys and What's new shows "Reads saves from game version …".

## Rollback (owner)

- **Fast (under 5 minutes):** `cd apps/activeon && pnpm exec wrangler deployments list`, then
  `pnpm exec wrangler rollback <version-id> -m "<reason>"` (your wrangler login, IdleOn account).
  Then open a revert PR so `main` matches production again; the next merge would otherwise redeploy
  the bad code.
- **Normal:** revert PR → merge → deploy.

A red smoke check never rolls back by itself: decide between rollback and a fix forward.

## Token rotation

Calendar: 11 months after each token is created (see the table in [`deploy.md`](deploy.md#tokens-m12-tr-17)).

1. Create the new token exactly as [`secrets-runbook.md`](secrets-runbook.md) describes.
2. Push it: `ENVIRONMENT=<env> scripts/push-secrets.sh <file>`.
3. Re-run the last Deploy (production), a Preview (preview) or Parser sync (mirror).
4. Delete the old token.
