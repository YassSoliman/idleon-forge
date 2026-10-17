#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
# Pushes deploy secrets from a private local file to the GitHub `production` environment without
# ever printing them. The file lives OUTSIDE the repo; see docs/setup/secrets-runbook.md.
#   Usage: scripts/push-secrets.sh [path]   (default: ~/.config/idleon-forge/secrets.env)
set -euo pipefail
FILE="${1:-$HOME/.config/idleon-forge/secrets.env}"
REPO="${REPO:-YassSoliman/idleon-forge}"
ENVIRONMENT="${ENVIRONMENT:-production}"
[ -f "$FILE" ] || { echo "No secrets file at $FILE (see docs/setup/secrets-runbook.md)"; exit 1; }
perm=$(stat -f '%Lp' "$FILE" 2>/dev/null || stat -c '%a' "$FILE")
[ "$perm" = "600" ] || { echo "Refusing: $FILE must be chmod 600 (is $perm)"; exit 1; }
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in ''|\#*|LOCAL_*) continue ;; esac   # LOCAL_* keys stay on this machine, never pushed
  key="${line%%=*}"; val="${line#*=}"
  [ -n "$val" ] || { echo "skip $key (empty)"; continue; }
  printf '%s' "$val" | gh secret set "$key" -R "$REPO" --env "$ENVIRONMENT" >/dev/null
  echo "set $key"
done < "$FILE"
