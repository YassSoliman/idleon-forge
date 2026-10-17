# Secrets runbook

Where every secret comes from, and how to hand it over **without pasting it anywhere visible** (chat, issues, commits). Values live only in a private file outside the repo; `scripts/push-secrets.sh` sends them to GitHub's `production` environment without printing them.

## 1. Create the private file (once)

```sh
mkdir -p ~/.config/idleon-forge
touch ~/.config/idleon-forge/secrets.env
chmod 600 ~/.config/idleon-forge/secrets.env
open -e ~/.config/idleon-forge/secrets.env   # or any editor
```

Write one `KEY=value` per line, no quotes, no spaces around `=`. Lines starting with `#` are ignored; empty values are skipped.

## 2. Where to find each value

### Needed now (deploy to workers.dev)

| Key | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → avatar (top right) → **My Profile → API Tokens → Create Token** → template **"Edit Cloudflare Workers"** → Account Resources: your account, Zone Resources: All zones (or none needed for workers.dev) → Continue → Create. Copy it once; Cloudflare won't show it again. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → **Workers & Pages** → the right-hand panel shows **Account ID** (also in the URL: `dash.cloudflare.com/<account id>/…`). |

Already set by Claude (public values copied from IdleOn Toolbox): the six `VITE_*` variables and the `VITE_GOOGLE_OAUTH_CLIENT_SECRET` secret.

### Needed later (M13 Suggestions Worker)

| Key | Where to get it |
|---|---|
| `TURNSTILE_SECRET_KEY` | Cloudflare dashboard → **Turnstile → Add widget** (domain: the workers.dev host) → copy the **Secret key**. The **Site key** is public and goes in as a variable instead. |
| `SUGGESTIONS_GITHUB_TOKEN` | GitHub → Settings → Developer settings → **Fine-grained tokens → Generate** → Repository access: only `YassSoliman/idleon-forge` → Permissions: **Issues: Read and write** (nothing else) → expiry 90 days. |

## 3. Push them

```sh
scripts/push-secrets.sh            # reads ~/.config/idleon-forge/secrets.env
```

It refuses to run unless the file is `chmod 600`, and prints only the key names it set. Then tell Claude "secrets are pushed"; it never needs to see the values.

## Rotating

Edit the file and run the script again; GitHub overwrites the old value. To revoke: Cloudflare → API Tokens → Roll/Delete, GitHub → Fine-grained tokens → Revoke.
