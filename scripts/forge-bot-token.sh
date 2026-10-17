#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
# Prints a 1-hour installation token for the Forge Bot GitHub App, so agents can push and open PRs
# as the bot (Yasser can then approve them). Reads LOCAL_FORGE_BOT_APP_ID from the private secrets
# file and the key from ~/.config/idleon-forge/forge-bot.pem. Usage: GH_TOKEN=$(scripts/forge-bot-token.sh) gh pr create ...
set -euo pipefail
CONF="$HOME/.config/idleon-forge"; set -a; . "$CONF/secrets.env"; set +a
python3 - "$LOCAL_FORGE_BOT_APP_ID" "$CONF/forge-bot.pem" <<'PY'
import sys,json,time,base64,subprocess,urllib.request
app,key=sys.argv[1],sys.argv[2]; b=lambda x: base64.urlsafe_b64encode(x).rstrip(b'=')
now=int(time.time()); h=b(json.dumps({"alg":"RS256","typ":"JWT"}).encode()); p=b(json.dumps({"iat":now-60,"exp":now+540,"iss":app}).encode())
jwt=(h+b'.'+p+b'.'+b(subprocess.run(["openssl","dgst","-sha256","-sign",key],input=h+b'.'+p,capture_output=True,check=True).stdout)).decode()
H={"Authorization":"Bearer "+jwt,"Accept":"application/vnd.github+json","User-Agent":"forge-bot"}
inst=json.load(urllib.request.urlopen(urllib.request.Request("https://api.github.com/app/installations",headers=H)))[0]["id"]
r=urllib.request.Request(f"https://api.github.com/app/installations/{inst}/access_tokens",method="POST",headers=H)
print(json.load(urllib.request.urlopen(r))["token"])
PY
