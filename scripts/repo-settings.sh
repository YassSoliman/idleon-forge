#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
# Applies the GitHub repository settings M12 needs (docs/specs/M12-release.md TR-16, TR-18), so they
# live in the repo as code and can be re-applied or audited. Idempotent. Prints no secret.
#
#   scripts/repo-settings.sh            settings safe before the M12 PR merges
#   scripts/repo-settings.sh post-merge also require `PR title` and `Merge gate`, allow only the
#                                       listed actions and require SHA-pinned actions (run once the
#                                       M12 workflows are on main, or every open PR would block)
#   scripts/repo-settings.sh show       print the current state
#
# Needs `gh` logged in as a repository admin.
set -euo pipefail
REPO="${REPO:-YassSoliman/idleon-forge}"
PRODUCTION_URL="${PRODUCTION_URL:-https://activeon.idleon.workers.dev}"
GITHUB_ACTIONS_APP=15368   # integration id of the GitHub Actions app; pins required checks' source (RT-24)
phase="${1:-pre-merge}"

show() {
  gh api "repos/$REPO" --jq '{allow_merge_commit,allow_squash_merge,allow_rebase_merge,merge_commit_title,merge_commit_message,delete_branch_on_merge}'
  gh api "repos/$REPO/environments" --jq '.environments[]|{name,can_admins_bypass,deployment_branch_policy}'
  gh api "repos/$REPO/rulesets" --jq '.[]|{id,name,enforcement}'
  gh api "repos/$REPO/actions/permissions"
  gh api "repos/$REPO/actions/permissions/workflow"
  gh api "repos/$REPO/actions/permissions/fork-pr-contributor-approval"
}

checks_json() {
  local out='' name
  for name in "$@"; do
    out+="${out:+,}{\"context\":\"$name\",\"integration_id\":$GITHUB_ACTIONS_APP}"
  done
  printf '[%s]' "$out"
}

upsert_ruleset() { # <name> <json>
  local id
  id=$(gh api "repos/$REPO/rulesets" --jq ".[]|select(.name==\"$1\")|.id")
  if [ -n "$id" ]; then
    gh api -X PUT "repos/$REPO/rulesets/$id" --input - --jq '"updated ruleset \(.name) (\(.enforcement))"' <<<"$2"
  else
    gh api -X POST "repos/$REPO/rulesets" --input - --jq '"created ruleset \(.name) (\(.enforcement))"' <<<"$2"
  fi
}

main_checks() { # <check names...>
  upsert_ruleset main-checks "$(cat <<JSON
{"name":"main-checks","target":"branch","enforcement":"active","bypass_actors":[],
 "conditions":{"ref_name":{"include":["~DEFAULT_BRANCH"],"exclude":[]}},
 "rules":[
  {"type":"deletion"},{"type":"non_fast_forward"},
  {"type":"required_status_checks","parameters":{"strict_required_status_checks_policy":false,
    "do_not_enforce_on_create":false,"required_status_checks":$(checks_json "$@")}}]}
JSON
)"
}

pre_merge() {
  # TR-5 / D1: merge commits only, and the merge commit carries the PR title and body (What's-new:).
  gh api -X PATCH "repos/$REPO" -F allow_merge_commit=true -F allow_squash_merge=false \
    -F allow_rebase_merge=false -f merge_commit_title=PR_TITLE -f merge_commit_message=PR_BODY \
    -F delete_branch_on_merge=true --jq '"merge settings: merge=\(.allow_merge_commit) squash=\(.allow_squash_merge) rebase=\(.allow_rebase_merge) title=\(.merge_commit_title) body=\(.merge_commit_message) delete-branch=\(.delete_branch_on_merge)"'

  # TR-18 / FR-2: production stays main-only, and admins (and agents with admin credentials) can't bypass it.
  gh api -X PUT "repos/$REPO/environments/production" --input - --jq '"environment production: admin bypass \(.can_admins_bypass)"' <<'JSON'
{"can_admins_bypass":false,"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}
JSON
  gh variable set PRODUCTION_URL -R "$REPO" -e production -b "$PRODUCTION_URL"

  # TR-16: preview (all branches; the fork guard is in preview.yml, D4: no reviewers) and mirror (main only).
  gh api -X PUT "repos/$REPO/environments/preview" --input - --jq '"environment preview: created/updated"' <<'JSON'
{"deployment_branch_policy":null}
JSON
  gh api -X PUT "repos/$REPO/environments/mirror" --input - --jq '"environment mirror: created/updated"' <<'JSON'
{"can_admins_bypass":false,"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}
JSON
  gh api -X POST "repos/$REPO/environments/mirror/deployment-branch-policies" -f name=main -f type=branch \
    --jq '"environment mirror: branch \(.name)"' 2>/dev/null || echo "environment mirror: branch main (exists)"
  # Ruling N2: the Forge Bot app key lives only in forge-bot (main only), used by parser-sync's PR job.
  gh api -X PUT "repos/$REPO/environments/forge-bot" --input - --jq '"environment forge-bot: created/updated"' <<'JSON'
{"can_admins_bypass":false,"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}
JSON
  gh api -X POST "repos/$REPO/environments/forge-bot/deployment-branch-policies" -f name=main -f type=branch \
    --jq '"environment forge-bot: branch \(.name)"' 2>/dev/null || echo "environment forge-bot: branch main (exists)"

  # TR-18: first-time fork contributors wait for approval before any workflow runs.
  gh api -X PUT "repos/$REPO/actions/permissions/fork-pr-contributor-approval" \
    -f approval_policy=all_external_contributors
  echo "fork PR workflows: approval for all external contributors"
  # Appendix A step 12: SECURITY.md points reporters at private vulnerability reporting.
  gh api -X PUT "repos/$REPO/private-vulnerability-reporting" && echo "private vulnerability reporting: on"

  # TR-18 / D5: two rulesets. main-checks has NO bypass (RT-3); main-review lets the owner merge his own
  # and agents' PRs without an approval, in "pull requests only" mode, so nobody pushes to main directly.
  main_checks 'Lint, typecheck, test, build'
  upsert_ruleset main-review "$(cat <<'JSON'
{"name":"main-review","target":"branch","enforcement":"active",
 "bypass_actors":[{"actor_type":"RepositoryRole","actor_id":5,"bypass_mode":"pull_request"}],
 "conditions":{"ref_name":{"include":["~DEFAULT_BRANCH"],"exclude":[]}},
 "rules":[{"type":"pull_request","parameters":{"required_approving_review_count":1,
   "dismiss_stale_reviews_on_push":true,"require_code_owner_review":true,
   "require_last_push_approval":false,"required_review_thread_resolution":true,
   "allowed_merge_methods":["merge"]}}]}
JSON
)"
  # Rulesets replace the classic protection, so the two don't stack.
  if gh api "repos/$REPO/branches/main/protection" >/dev/null 2>&1; then
    gh api -X DELETE "repos/$REPO/branches/main/protection" && echo "classic protection on main: deleted"
  fi
}

post_merge() {
  main_checks 'Lint, typecheck, test, build' 'PR title' 'Merge gate'
  # TR-18 / TR-20 / RT-19: only these actions, each pinned to a full commit SHA.
  gh api -X PUT "repos/$REPO/actions/permissions" -F enabled=true -f allowed_actions=selected \
    -F sha_pinning_required=true
  gh api -X PUT "repos/$REPO/actions/permissions/selected-actions" --input - <<'JSON'
{"github_owned_allowed":true,"verified_allowed":false,
 "patterns_allowed":["pnpm/action-setup@*","cloudflare/wrangler-action@*"]}
JSON
  echo "actions: selected (actions/*, pnpm/action-setup, cloudflare/wrangler-action), SHA pinning required"
}

case "$phase" in
  pre-merge) pre_merge ;;
  post-merge) post_merge ;;
  show) show ;;
  *) echo "usage: $0 [pre-merge|post-merge|show]" >&2; exit 2 ;;
esac
