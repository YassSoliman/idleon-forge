#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
# Shared helpers for sync.sh and fetch-data.sh: a shallow, sparse checkout of IdleOn Toolbox at one
# commit in .upstream/ (gitignored). Only the blobs under the requested paths are downloaded.

read_pin() {
  repo=$(grep -E '^repo=' UPSTREAM | cut -d= -f2-)
  commit=$(grep -E '^commit=' UPSTREAM | cut -d= -f2-)
  dataDigest=$(grep -E '^dataDigest=' UPSTREAM | cut -d= -f2- || true)
  # repo= is the mirror (M12 D7). UPSTREAM_FETCH_URL fetches from elsewhere (upstream itself, when the
  # mirror is behind) without changing what UPSTREAM records.
  fetch_url="${UPSTREAM_FETCH_URL:-$repo}"
}

# checkout_upstream <repo> <commit-or-HEAD> <path>...   -> sets $resolved to the full commit SHA
checkout_upstream() {
  local url="$1" want="$2"
  shift 2
  if [ ! -d .upstream/.git ]; then
    git init --quiet .upstream
    git -C .upstream remote add origin "$url"
  else
    git -C .upstream remote set-url origin "$url"
  fi
  git -C .upstream sparse-checkout set --no-cone "$@"
  git -C .upstream fetch --quiet --depth=1 --filter=blob:none origin "$want"
  git -C .upstream -c advice.detachedHead=false checkout --quiet --force FETCH_HEAD
  resolved=$(git -C .upstream rev-parse HEAD)
}
