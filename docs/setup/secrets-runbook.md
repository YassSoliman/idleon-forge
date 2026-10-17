# Secrets runbook

Where every secret comes from, and how to hand it over **without pasting it anywhere visible** (chat, issues, commits). Values live only in private files outside the repo; `scripts/push-secrets.sh` sends them to one GitHub environment without printing them. Every value lives in an **environment**, never at repository level (M12 TR-16).

## 1. Create the private file (once)

```sh
mkdir -p ~/.config/idleon-forge
touch ~/.config/idleon-forge/secrets.env
chmod 600 ~/.config/idleon-forge/secrets.env
open -e ~/.config/idleon-forge/secrets.env   # or any editor
```

Write one `KEY=value` per line, no quotes, no spaces around `=`. Lines starting with `#` are ignored; empty values are skipped. Use one file per environment when values differ (for example `preview.env` for the preview token).

## 2. Where to find each value

### GitHub environments (pushed by the script)

| Key | Environment | Where to get it |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | `production`, `preview` (a **separate** token each, D4) | Cloudflare dashboard → **IdleOn** account → **Manage account → Account API tokens → Create token → Custom token**: permission **Account → Workers Scripts → Edit** only, account resources **IdleOn only**, expiry 12 months. Name it `activeon-production` or `activeon-preview`. Copy it once into the file; Cloudflare won't show it again. Not "My Profile → API Tokens", and not the "Edit Cloudflare Workers" template (it adds zone permissions). |
| `CLOUDFLARE_ACCOUNT_ID` | `production`, `preview` | Cloudflare dashboard → **Workers & Pages** → Account details → **Account ID** (IdleOn). |
| six `VITE_*` values (variables) and `VITE_GOOGLE_OAUTH_CLIENT_SECRET` (secret) | `production`, `preview` | Public game values, see [`live-sign-in.md`](live-sign-in.md). The script sets `VITE_*` keys as variables, except `*_SECRET`. |
| `PRODUCTION_URL` (variable) | `production` | `https://activeon.idleon.workers.dev` |
| `MIRROR_TOKEN` | `mirror` | GitHub → Settings → Developer settings → **Fine-grained tokens → Generate**: name `idleon-forge-mirror`, resource owner YassSoliman, **Only select repositories → `YassSoliman/IdleonToolbox`**, permissions **Contents: Read and write** and **Workflows: Read and write**, nothing else, expiry 12 months. |
| `FORGE_BOT_APP_ID` (variable), `FORGE_BOT_PRIVATE_KEY` (secret) | `forge-bot` (main only, used by the parser-sync PR job alone) | The Forge Bot GitHub App. The key is the `.pem` file: `gh secret set FORGE_BOT_PRIVATE_KEY -R YassSoliman/idleon-forge --env forge-bot < ~/.config/idleon-forge/forge-bot.pem`. |

```sh
scripts/push-secrets.sh                                              # production, from secrets.env
ENVIRONMENT=preview scripts/push-secrets.sh ~/.config/idleon-forge/preview.env
ENVIRONMENT=mirror  scripts/push-secrets.sh ~/.config/idleon-forge/mirror.env
```

It refuses to run unless the file is `chmod 600`, refuses any key that is not listed for that environment, and prints only key names. Then tell Claude "secrets are pushed"; it never needs to see the values.

### `wrangler secret put` only, never in `secrets.env` (M13)

The Suggestions Worker's runtime secrets never pass through GitHub, so an issue-writing token never sits next to a deploy job (RT-18). Set them straight in Cloudflare: `cd apps/<suggestions-worker> && pnpm exec wrangler secret put <NAME>`.

| Key | Where to get it |
|---|---|
| `TURNSTILE_SECRET_KEY` | Cloudflare → IdleOn → **Turnstile → Add widget** (domain: the workers.dev host) → copy the **Secret key**. The Site key is public. |
| The Suggestions App key and id | The GitHub App `idleon-forge-suggestions` (Issues only); kept local (`LOCAL_SUGGESTIONS_APP_ID`, `suggestions-app.pem`), see M13 TR-13. |

### Local-only (never pushed to GitHub)

Keys prefixed `LOCAL_` stay in the file and are skipped by the script. Use them for setup tokens that only an operator machine needs.

| Key | Where to get it |
|---|---|
| `LOCAL_CLOUDFLARE_ADMIN_TOKEN` | Cloudflare → **IdleOn account** → Account API tokens → Create Token → Custom: Account Resources **IdleOn only**; permissions **Workers Scripts: Edit**, **Turnstile: Edit**, **Access: Apps and Policies: Edit**, **Access: Organizations, Identity Providers, and Groups: Edit**, **Account Settings: Read**, **Account API Tokens: Edit**. Lets Claude Code create the Turnstile widget, the Preview Access gate, the Suggestions Worker and the preview token without clicks. Never goes to CI. |
| `LOCAL_FORGE_BOT_APP_ID` | The Forge Bot App id, for `scripts/forge-bot-token.sh` (agents open PRs as the bot). |

## Rotating

Edit the file and run the script again; GitHub overwrites the old value. To revoke: Cloudflare → Account API tokens → Roll/Delete, GitHub → Fine-grained tokens → Revoke. Full steps: [`release.md`](release.md#token-rotation).
