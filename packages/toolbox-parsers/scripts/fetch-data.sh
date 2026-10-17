#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
# Rebuild vendor/data/ (Toolbox's game data: website-data/, its ambient types, the sprite manifest)
# from the commit pinned in UPSTREAM. It is ~9 MB of generated JSON-as-JS that churns by megabytes a
# month, so it is not committed; parsers/ and utility/ are. Runs before build and typecheck; a no-op
# when vendor/data/ already matches the pin.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/upstream.sh
read_pin

stamp=vendor/data/.commit
if [ -f "$stamp" ] && [ "$(cat "$stamp")" = "$commit" ]; then
  exit 0
fi

echo "fetching Toolbox game data @ ${commit}"
checkout_upstream "$repo" "$commit" /data/website-data/ /data/website-data.d.ts /data/sprite-manifest.json
if [ "$resolved" != "$commit" ]; then
  echo "error: fetched ${resolved}, expected ${commit}" >&2
  exit 1
fi

rm -rf vendor/data && mkdir -p vendor/data
cp -R .upstream/data/website-data vendor/data/website-data
cp .upstream/data/website-data.d.ts vendor/data/
cp .upstream/data/sprite-manifest.json vendor/data/
printf '%s' "$commit" > "$stamp"
echo "vendor/data/ ready ($(find vendor/data/website-data -type f | wc -l | tr -d ' ') files)"
