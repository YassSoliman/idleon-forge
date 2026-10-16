# Issue tracker: GitHub (`YassSoliman/idleon-forge`)

Use the `gh` CLI for all operations. Wayfinder maps, decision tickets and implementation issues for the Forge live in this repo's GitHub Issues. Pass `-R YassSoliman/idleon-forge` to `gh` when not running from a clone.

## Conventions

- **Create an issue**: `gh issue create -R YassSoliman/idleon-forge --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> -R YassSoliman/idleon-forge --comments`
- **List issues**: `gh issue list -R YassSoliman/idleon-forge --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> -R YassSoliman/idleon-forge --body "..."`
- **Apply / remove labels**: `gh issue edit <number> -R YassSoliman/idleon-forge --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> -R YassSoliman/idleon-forge --comment "..."`

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with
`gh pr view 42 -R YassSoliman/idleon-forge` and fall back to `gh issue view 42 -R YassSoliman/idleon-forge`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue on `YassSoliman/idleon-forge`.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> -R YassSoliman/idleon-forge --comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Destination / Notes /
  Decisions-so-far / Not-yet-specified / Out-of-scope body.
  `gh issue create -R YassSoliman/idleon-forge --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues
  endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put
  `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>`
  (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to `@me`.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation.
  Add an edge with
  `gh api --method POST repos/YassSoliman/idleon-forge/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`,
  where `<blocker-db-id>` is the blocker's numeric **database id**
  (`gh api repos/YassSoliman/idleon-forge/issues/<n> --jq .id`, _not_ the `#number` or `node_id`).
  GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate).
  Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of
  the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children
  (`gh issue list -R YassSoliman/idleon-forge --state open`, scoped to the map's sub-issues / task
  list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open
  issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> -R YassSoliman/idleon-forge --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> -R YassSoliman/idleon-forge --body "<answer>"`, then
  `gh issue close <n> -R YassSoliman/idleon-forge`, then append a context pointer (gist + link) to
  the map's Decisions-so-far.

