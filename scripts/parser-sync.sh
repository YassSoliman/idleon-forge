#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
# Job 1 of .github/workflows/parser-sync.yml (M12 TR-15): re-vendor Toolbox at REF, run every check,
# and write sync.patch + sync-report.md for job 2. Runs upstream code, so it runs with no secrets and a
# read-only token. Every failure is recorded instead of stopping the run: a broken upstream is
# something to see in a PR, not something to hide (FR-16).
#
# Env: REF (HEAD or a 40-char SHA), MIRROR_OK (true|false), GH_TOKEN (read-only), GITHUB_OUTPUT,
#      OUT (output dir, default ./sync-out).
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
OUT="${OUT:-$PWD/sync-out}"
mkdir -p "$OUT"
UPSTREAM_REPO=Morta1/IdleonToolbox
P=packages/toolbox-parsers
output() { [ -n "${GITHUB_OUTPUT:-}" ] && echo "$1=$2" >>"$GITHUB_OUTPUT"; echo "output $1=$2"; }

# The paths a sync may change (RT-1). Job 2 refuses a patch touching anything else.
ALLOWLIST=(
  "$P/vendor/parsers" "$P/vendor/utility" "$P/vendor/polyfills.js" "$P/vendor/LICENSE"
  "$P/UPSTREAM" "$P/VERIFIED_BUILDS" "$P/SYNC-FAILED"
  "packages/account-state/fixtures/public" "packages/account-state/test/__snapshots__"
)
[ -d packages/knowledge/generated ] && ALLOWLIST+=("packages/knowledge/generated")

REF="${REF:-HEAD}"
if ! [[ "$REF" =~ ^(HEAD|[0-9a-f]{40})$ ]]; then
  echo "::error::ref must be HEAD or a 40-character commit SHA"; output changed false; exit 1
fi

key() { grep -E "^$1=" "$2" | cut -d= -f2-; }
cp "$P/UPSTREAM" "$OUT/UPSTREAM.before"

data_listing() { # path<TAB>bytes<TAB>sha256 for every file under vendor/data
  (cd "$P/vendor/data" 2>/dev/null && find . -type f ! -name .commit | LC_ALL=C sort | while read -r f; do
    printf '%s\t%s\t%s\n' "${f#./}" "$(wc -c <"$f" | tr -d ' ')" "$( (sha256sum "$f" 2>/dev/null || shasum -a 256 "$f") | cut -d' ' -f1)"
  done)
}
bash "$P/scripts/fetch-data.sh" >/dev/null 2>&1 && data_listing >"$OUT/data.before"

alarm=''
if [ "${MIRROR_OK:-false}" != true ]; then
  export UPSTREAM_FETCH_URL="https://github.com/$UPSTREAM_REPO"
  alarm='**Mirror out of date: this pin may not be fetchable after merge.** Job 0 (mirror) failed; this sync resolved from upstream directly. Fix the mirror (see the run) before merging.'
fi

# --- 1. sync.sh under a wrapper, so a death is recorded, not fatal.
pnpm sync-parsers "$REF" >"$OUT/sync.log" 2>&1
sync_rc=$?

# --- 2. Pin provenance: the commit must be on upstream main, not only in some fork (RT-7).
sha=$(key commit "$P/UPSTREAM")
# compare/<sha>...main is "ahead" when main contains sha (or "identical" when sha is main's head);
# a commit only in a fork gives "diverged" or an error. (The spec's "behind" is the inverse.)
status=$(gh api "repos/$UPSTREAM_REPO/compare/$sha...main" --jq .status 2>/dev/null || echo error)
if [ "$status" != ahead ] && [ "$status" != identical ]; then
  echo "::error::$sha is not on upstream main (compare status: $status); not opening a PR"
  git checkout -q -- . && git clean -qfd -- "$P" packages/account-state
  output changed false
  exit 1
fi

# --- 3. Did anything the app ships change? A new commit= alone (UI churn upstream) is not a change (FR-14).
changed=false
[ $sync_rc -ne 0 ] && changed=true
[ -n "$(git status --porcelain -- "$P/vendor" "packages/account-state/fixtures/public")" ] && changed=true
for k in dataDigest toolboxVersion gameVersion; do
  [ "$(key "$k" "$OUT/UPSTREAM.before")" != "$(key "$k" "$P/UPSTREAM")" ] && changed=true
done
if [ $changed = false ]; then
  echo "No ship-relevant change at $sha (upstream HEAD may have moved outside the vendored paths)."
  git checkout -q -- .
  output changed false
  exit 0
fi
data_listing >"$OUT/data.after"

# --- 4. Checks. Each records its exit code and last 50 lines; none stops the run.
declare -a names codes
run_check() { # <name> <command...>
  local name="$1"; shift
  "$@" >"$OUT/check-$name.log" 2>&1
  local rc=$?
  names+=("$name"); codes+=("$rc")
  echo "check $name: exit $rc"
}
if [ $sync_rc -eq 0 ]; then
  if node -e 'process.exit(require("./package.json").scripts?.["kb:generate"] ? 0 : 1)'; then
    run_check kb-generate pnpm kb:generate
  else
    echo "kb:generate not defined yet (M11); skipped" >"$OUT/check-kb-generate.log"
  fi
  run_check typecheck pnpm typecheck
  run_check test env CI=true pnpm test
  run_check snapshots pnpm vitest run -u
  run_check build pnpm build
  run_check tripwire node "$P/scripts/tripwire.mjs"
fi

failed=false
[ $sync_rc -ne 0 ] && failed=true
[ -n "$alarm" ] && failed=true
for rc in "${codes[@]}"; do [ "$rc" -ne 0 ] && failed=true; done
tripwire_rc=0
for i in "${!names[@]}"; do [ "${names[$i]}" = tripwire ] && tripwire_rc=${codes[$i]}; done

new_sha7=${sha:0:7}
game=$(key gameVersion "$P/UPSTREAM")
title="chore(parsers): sync Toolbox to $new_sha7 (game $game)"

# --- 5. The failure marker keeps the required Merge gate red until a human fixes it (RT-16).
rm -f "$P/SYNC-FAILED"
if [ $failed = true ]; then
  {
    echo "This sync failed a check. Merge gate stays red while this file exists."
    echo "Fix the cause on chore/parser-sync and delete this file in the same commit."
    [ -n "$alarm" ] && echo "- mirror out of date (job 0 failed)"
    [ $sync_rc -ne 0 ] && echo "- sync.sh exited $sync_rc"
    for i in "${!names[@]}"; do [ "${codes[$i]}" -ne 0 ] && echo "- ${names[$i]} exited ${codes[$i]}"; done
  } >"$P/SYNC-FAILED"
fi

# --- 6. The patch (allowlisted paths only; new upstream files included, RT-5) and the report.
for path in "${ALLOWLIST[@]}"; do
  if [ -e "$path" ] || [ -n "$(git ls-files -- "$path")" ]; then git add -A -- "$path"; fi
done
git diff --cached --binary >"$OUT/sync.patch"

old_sha=$(key commit "$OUT/UPSTREAM.before")
{
  echo "<!-- parser-sync -->"
  echo "Automated parser sync (M12 TR-15). **Draft until reviewed.** Read in this order (Appendix C): tripwire, files outside \`vendor/parsers/\`, the \`vendor/data/\` summary, snapshots, the Knowledge Base diff, the vendor diff stat. Mark ready only after that; it starts the Preview."
  echo
  [ -n "$alarm" ] && { echo "> $alarm"; echo; }
  echo "## Tripwire"
  if [ $sync_rc -ne 0 ]; then echo "Not run (sync.sh failed)."
  elif [ "$tripwire_rc" -eq 0 ]; then echo "Clean: no new write, network or storage call in the vendored sources."
  else echo "**New matches (do-not-merge):**"; echo '```'; grep '::error' "$OUT/check-tripwire.log" | sed 's/^::error [^:]*::/  /' | head -60; echo '```'
  fi
  echo
  echo "## Checks"
  echo "| Check | Result |"; echo "|---|---|"
  echo "| sync.sh | $([ $sync_rc -eq 0 ] && echo pass || echo "**fail** (exit $sync_rc)") |"
  for i in "${!names[@]}"; do echo "| ${names[$i]} | $([ "${codes[$i]}" -eq 0 ] && echo pass || echo "**fail** (exit ${codes[$i]})") |"; done
  for i in "${!names[@]}"; do
    [ "${codes[$i]}" -ne 0 ] || continue
    echo; echo "<details><summary>${names[$i]}: last 50 lines</summary>"; echo; echo '```'; tail -50 "$OUT/check-${names[$i]}.log"; echo '```'; echo "</details>"
  done
  if [ $sync_rc -ne 0 ]; then
    echo; echo "<details><summary>sync.sh: last 50 lines</summary>"; echo; echo '```'; tail -50 "$OUT/sync.log"; echo '```'; echo "</details>"
  fi
  echo
  echo "## UPSTREAM"
  echo '```diff'; diff -u "$OUT/UPSTREAM.before" "$P/UPSTREAM" | tail -n +3; echo '```'
  echo "Upstream compare: https://github.com/$UPSTREAM_REPO/compare/$old_sha...$sha"
  echo
  echo "## Files outside vendor/parsers/"
  echo '```'; git diff --cached --stat=120 -- . ":(exclude)$P/vendor/parsers" | tail -40; echo '```'
  echo
  echo "## vendor/data/ (gitignored; the only view of the game data)"
  node -e '
    const fs=require("fs");const rd=(f)=>{try{return new Map(fs.readFileSync(f,"utf8").trim().split("\n").filter(Boolean).map(l=>{const [p,b,h]=l.split("\t");return [p,{b:+b,h}]}))}catch{return new Map()}};
    const a=rd(process.argv[1]),b=rd(process.argv[2]);const rows=[];
    for(const [p,v] of b){const o=a.get(p);if(!o)rows.push(`added   ${p} (${v.b} B)`);else if(o.h!==v.h)rows.push(`changed ${p} (${v.b-o.b>=0?"+":""}${v.b-o.b} B)`)}
    for(const [p,o] of a) if(!b.has(p)) rows.push(`removed ${p} (${o.b} B)`);
    console.log(rows.length?"```\n"+rows.join("\n")+"\n```":"No change.");' "$OUT/data.before" "$OUT/data.after"
  echo
  echo "## Account State snapshots"
  echo '```'; git diff --cached --stat=120 -- packages/account-state/test/__snapshots__ | tail -20; echo '```'
  echo "Add a line per moved field on why it moved (AGENTS.md)."
  echo
  echo "## Knowledge Base"
  if [ -s "$OUT/check-kb-generate.log" ]; then tail -30 "$OUT/check-kb-generate.log"; else echo "No generator output."; fi
  echo
  echo "## Vendor diff stat"
  echo '```'; git diff --cached --stat=120 -- "$P/vendor" "packages/account-state/fixtures/public" | tail -60; echo '```'
} >"$OUT/sync-report.md"
git reset -q

output changed true
output failed "$failed"
output title "$title"
echo "report: $OUT/sync-report.md ($(wc -c <"$OUT/sync-report.md" | tr -d ' ') bytes), patch: $(wc -c <"$OUT/sync.patch" | tr -d ' ') bytes"
