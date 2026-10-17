#!/usr/bin/env bash
# IdleOn Forge parser spike: vendor IdleOn Toolbox's parsers at the commit pinned in UPSTREAM.
# Copyright (C) 2026 IdleOn Forge contributors. Licensed GPL-3.0-only (see vendor/LICENSE).
#
# Usage: scripts/sync.sh [<commit>]   (no arg = the commit in UPSTREAM)
# Re-sync after a game patch: run with the new commit, rebuild, run the smoke parse, review
# `git -C .upstream diff <old>..<new> --stat -- parsers data/website-data utility`.
set -euo pipefail
cd "$(dirname "$0")/.."
eval "$(grep -E '^(repo|commit)=' UPSTREAM)"
commit="${1:-$commit}"

if [ ! -d .upstream/.git ]; then
  git clone --quiet --filter=blob:none "$repo" .upstream
fi
git -C .upstream fetch --quiet origin
git -C .upstream checkout --quiet "$commit"

rm -rf vendor && mkdir -p vendor/data
cp -R .upstream/parsers vendor/parsers
# All of utility/ is copied; esbuild only bundles what parsers/ actually reach (7 files at the
# pinned commit). A new UI-coupled import then fails the build loudly, which is the cue for a shim.
cp -R .upstream/utility vendor/utility
cp -R .upstream/data/website-data vendor/data/website-data
cp .upstream/data/website-data.d.ts vendor/data/   # ambient types for @website-data (typecheck only)
cp .upstream/data/sprite-manifest.json vendor/data/
cp .upstream/polyfills.js vendor/
cp .upstream/LICENSE vendor/LICENSE

# GPL-3.0 section 5(a): mark every vendored source file as modified-by-redistribution, with its origin.
header="// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ ${commit}.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
"
find vendor -type f \( -name '*.ts' -o -name '*.js' -o -name '*.mjs' \) | while read -r f; do
  { printf '%s' "$header"; cat "$f"; } > "$f.tmp" && mv "$f.tmp" "$f"
done

# Record the game version this commit targets (newest entry of Toolbox's own patch notes), for ADR 0004.
gamever=$(grep -m1 -oE "'gameVer': '[^']+'" .upstream/data/patch-notes.js | grep -oE "[0-9][0-9.]+")
tbver=$(grep -m1 -oE "'ver': '[^']+'" .upstream/data/patch-notes.js | grep -oE "[0-9][0-9.]+")
date=$(git -C .upstream log -1 --format=%cs)
printf 'repo=%s\ncommit=%s\ncommitDate=%s\ntoolboxVersion=%s\ngameVersion=%s\n' "$repo" "$commit" "$date" "$tbver" "$gamever" > UPSTREAM
echo "vendored $(find vendor/parsers -name '*.ts' | wc -l | tr -d ' ') parser files @ ${commit} (Toolbox ${tbver}, game ${gamever})"
