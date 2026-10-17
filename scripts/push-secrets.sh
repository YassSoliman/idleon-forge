#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
# Pushes deploy values from a private local file to one GitHub environment without ever printing them.
# The file lives OUTSIDE the repo; see docs/setup/secrets-runbook.md.
#   Usage: [ENVIRONMENT=production|preview|mirror|forge-bot] scripts/push-secrets.sh [path]
#          (default path: ~/.config/idleon-forge/secrets.env)
# Only the names M12 TR-16 lists are accepted; anything else is refused, so a token meant for a Worker
# (Turnstile, the Suggestions App) can never land next to a deploy job (RT-18). LOCAL_* keys stay on this
# machine and are skipped. VITE_* keys not ending in _SECRET are public values and go in as variables.
set -euo pipefail
FILE="${1:-$HOME/.config/idleon-forge/secrets.env}"
REPO="${REPO:-YassSoliman/idleon-forge}"
ENVIRONMENT="${ENVIRONMENT:-production}"
[ -f "$FILE" ] || { echo "No secrets file at $FILE (see docs/setup/secrets-runbook.md)"; exit 1; }
perm=$(stat -f '%Lp' "$FILE" 2>/dev/null || stat -c '%a' "$FILE")
[ "$perm" = "600" ] || { echo "Refusing: $FILE must be chmod 600 (is $perm)"; exit 1; }

VITE_KEYS="VITE_FIREBASE_API_KEY VITE_FIREBASE_AUTH_DOMAIN VITE_FIREBASE_DATABASE_URL VITE_FIREBASE_PROJECT_ID VITE_FIREBASE_STORAGE_BUCKET VITE_GOOGLE_OAUTH_CLIENT_ID VITE_GOOGLE_OAUTH_CLIENT_SECRET"
case "$ENVIRONMENT" in
  production) allowed="CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID PRODUCTION_URL $VITE_KEYS" ;;
  preview) allowed="CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID $VITE_KEYS" ;;
  mirror) allowed="MIRROR_TOKEN" ;;
  forge-bot) allowed="FORGE_BOT_APP_ID" ;;   # the key itself: gh secret set FORGE_BOT_PRIVATE_KEY --env forge-bot < key.pem
  *) echo "Unknown environment $ENVIRONMENT"; exit 1 ;;
esac
is_variable() { case "$1" in VITE_*_SECRET) return 1 ;; VITE_*|PRODUCTION_URL|FORGE_BOT_APP_ID) return 0 ;; *) return 1 ;; esac; }

while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in ''|\#*|LOCAL_*) continue ;; esac
  key="${line%%=*}"; val="${line#*=}"
  case " $allowed " in *" $key "*) ;; *) echo "refuse $key (not a $ENVIRONMENT key; see TR-16)"; continue ;; esac
  [ -n "$val" ] || { echo "skip $key (empty)"; continue; }
  if is_variable "$key"; then
    gh variable set "$key" -R "$REPO" --env "$ENVIRONMENT" --body "$val" >/dev/null
    echo "set variable $key"
  else
    printf '%s' "$val" | gh secret set "$key" -R "$REPO" --env "$ENVIRONMENT" >/dev/null
    echo "set secret $key"
  fi
done < "$FILE"
