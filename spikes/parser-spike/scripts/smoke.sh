#!/usr/bin/env bash
# IdleOn Forge parser spike. Copyright (C) 2026 IdleOn Forge contributors. GPL-3.0-only.
# Parse every public save shipped in the pinned upstream (data/raw.json + __test__/fixtures/*.json)
# and fail if any returns an empty account or logs a failed parser section.
set -uo pipefail
cd "$(dirname "$0")/.."
fail=0
for f in .upstream/data/raw.json .upstream/__test__/fixtures/*.json; do
  out=$(node dist/run.mjs "$f" 2>/dev/null)
  summary=$(printf '%s' "$out" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s);console.log(`${r.ok&&!r.failedSections.length?"PASS":"FAIL"} ${r.ms}ms keys=${r.accountKeys} chars=${r.characters} failed=[${r.failedSections}]`)})')
  echo "$summary  $(basename "$f")"
  [[ $summary == PASS* ]] || fail=1
done
exit $fail
