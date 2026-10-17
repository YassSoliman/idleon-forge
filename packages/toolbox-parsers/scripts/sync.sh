#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
# Re-vendor IdleOn Toolbox's parsers at one upstream commit.
#
# Usage (from the repo root): pnpm sync-parsers [<commit> | HEAD]
#   no argument  re-vendor the commit already pinned in UPSTREAM (repairs a dirty vendor/)
#   <commit>     pin that commit
#   HEAD         pin upstream's current default-branch HEAD
#
# Afterwards: `pnpm test` (contract tests over the refreshed public saves), then review
# `git diff --stat packages/toolbox-parsers/vendor` and open a PR. Never hand-edit vendor/.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/upstream.sh
read_pin
want="${1:-$commit}"

fixtures=../account-state/fixtures/public
checkout_upstream "$fetch_url" "$want" \
  /parsers/ /utility/ /polyfills.js /LICENSE \
  /data/website-data/ /data/website-data.d.ts /data/sprite-manifest.json /data/patch-notes.js \
  /data/raw.json /__test__/fixtures/
commit="$resolved"

# Committed, so a re-sync is a reviewable diff: parsers/, all of utility/ (esbuild bundles only what
# parsers/ reach; a new UI-coupled import fails the build loudly, which is the cue for a new shim),
# the prototype polyfills the parsers rely on, and upstream's licence.
rm -rf vendor/parsers vendor/utility vendor/polyfills.js vendor/LICENSE
mkdir -p vendor
cp -R .upstream/parsers vendor/parsers
cp -R .upstream/utility vendor/utility
cp .upstream/polyfills.js vendor/polyfills.js
cp .upstream/LICENSE vendor/LICENSE

# GPL-3.0 section 5(a): every vendored source file carries its origin and a notice that it was
# redistributed by IdleOn Forge, with UI-coupled imports redirected at build time.
header="// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ ${commit}.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
"
find vendor/parsers vendor/utility vendor/polyfills.js -type f \( -name '*.ts' -o -name '*.js' -o -name '*.mjs' \) |
  while read -r f; do
    { printf '%s' "$header"; cat "$f"; } >"$f.tmp" && mv "$f.tmp" "$f"
  done

# Toolbox's public saves feed the Account State contract tests (see fixtures/public/README.md).
mkdir -p "$fixtures"
find "$fixtures" -name '*.json' -delete
cp .upstream/data/raw.json "$fixtures/toolbox-raw.json"
cp .upstream/__test__/fixtures/*.json "$fixtures/"

# The game version this commit targets is the newest entry of Toolbox's own patch notes.
gamever=$(grep -m1 -oE "'gameVer': '[^']+'" .upstream/data/patch-notes.js | grep -oE "[0-9][0-9.]+")
tbver=$(grep -m1 -oE "'ver': '[^']+'" .upstream/data/patch-notes.js | grep -oE "[0-9][0-9.]+")
date=$(git -C .upstream log -1 --format=%cs)
printf 'repo=%s\ncommit=%s\ncommitDate=%s\ntoolboxVersion=%s\ngameVersion=%s\n' \
  "$repo" "$commit" "$date" "$tbver" "$gamever" >UPSTREAM

rm -f vendor/data/.commit
ALLOW_NEW_DATA_DIGEST=1 bash scripts/fetch-data.sh
# Pin vendor/data/ by content (M12 TR-15 step 4); fetch-data.sh verifies it from now on.
printf 'dataDigest=%s\n' "$(node scripts/data-digest.mjs vendor/data)" >>UPSTREAM

# The builds this pin parses cleanly ship in the bundle (M1 FR-29): build, measure, rebuild.
node scripts/build.mjs
node scripts/verified-builds.mjs
node scripts/build.mjs
echo "vendored $(find vendor/parsers -name '*.ts' | wc -l | tr -d ' ') parser files @ ${commit} (Toolbox ${tbver}, game ${gamever}, ${date})"
echo "next: pnpm test && git diff --stat -- packages/toolbox-parsers packages/account-state/fixtures"
