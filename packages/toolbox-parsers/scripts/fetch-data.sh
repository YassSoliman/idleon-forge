#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
# Rebuild vendor/data/ (Toolbox's game data: website-data/, its ambient types, the sprite manifest)
# from the commit pinned in UPSTREAM. It is ~9 MB of generated JSON-as-JS that churns by megabytes a
# month, so it is not committed; parsers/ and utility/ are. Runs before build and typecheck; a no-op
# when vendor/data/ already matches the pin.
#
# M12 TR-15 step 4: the result (fresh, cached or restored from a CI cache) must match UPSTREAM's
# dataDigest=, or the script fails. Only sync.sh, which is about to write a new digest, sets
# ALLOW_NEW_DATA_DIGEST=1.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/upstream.sh
read_pin

verify_digest() {
  local got
  got=$(node scripts/data-digest.mjs vendor/data)
  if [ -z "$dataDigest" ]; then
    [ "${ALLOW_NEW_DATA_DIGEST:-}" = 1 ] && return 0
    echo "error: UPSTREAM has no dataDigest= (vendor/data/ digest is $got); run pnpm sync-parsers" >&2
    exit 1
  fi
  if [ "$got" != "$dataDigest" ] && [ "${ALLOW_NEW_DATA_DIGEST:-}" != 1 ]; then
    echo "error: vendor/data/ digest $got does not match UPSTREAM dataDigest=$dataDigest" >&2
    echo "       (a stale or tampered cache? delete packages/toolbox-parsers/vendor/data and retry)" >&2
    exit 1
  fi
}

stamp=vendor/data/.commit
if [ -f "$stamp" ] && [ "$(cat "$stamp")" = "$commit" ]; then
  verify_digest
  exit 0
fi

echo "fetching Toolbox game data @ ${commit}"
checkout_upstream "$fetch_url" "$commit" /data/website-data/ /data/website-data.d.ts /data/sprite-manifest.json
if [ "$resolved" != "$commit" ]; then
  echo "error: fetched ${resolved}, expected ${commit}" >&2
  exit 1
fi

rm -rf vendor/data && mkdir -p vendor/data
cp -R .upstream/data/website-data vendor/data/website-data
cp .upstream/data/website-data.d.ts vendor/data/
cp .upstream/data/sprite-manifest.json vendor/data/
printf '%s' "$commit" > "$stamp"
verify_digest
echo "vendor/data/ ready ($(find vendor/data/website-data -type f | wc -l | tr -d ' ') files)"
