#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
# Local, read-only live checks for ActiveOn (never commit outputs):
#   1) records the raw save document each time it changes (A -> B -> C character-switch fixture, M10 FR-14 gate)
#   2) keeps the original ID token, lets it expire, and tests the game's Firestore at +1, +5, +15 min (M13 TR-4 gate)
# Config comes from the gitignored apps/activeon/.env.local (the game's public client values). Prints statuses only.
import json, os, sys, time, base64, urllib.request, urllib.parse, urllib.error, pathlib

ENV = pathlib.Path(os.environ.get("ACTIVEON_ENV", pathlib.Path(__file__).resolve().parents[2] / "apps/activeon/.env.local"))
OUT = pathlib.Path(__file__).resolve().parents[2] / "fixtures/private/live-checks"
RECORD_SECONDS = int(os.environ.get("RECORD_SECONDS", "600"))   # switch-recording window
cfg = dict(l.split("=", 1) for l in ENV.read_text().splitlines() if "=" in l and not l.startswith("#"))
OUT.mkdir(parents=True, exist_ok=True)

def post(url, data, form=True):
    body = urllib.parse.urlencode(data).encode() if form else json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/x-www-form-urlencoded" if form else "application/json"})
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        return json.load(e)

def log(msg):
    print(time.strftime("%H:%M:%S"), msg, flush=True)

# 1. Google device-code sign-in
dc = post("https://oauth2.googleapis.com/device/code", {"client_id": cfg["VITE_GOOGLE_OAUTH_CLIENT_ID"], "scope": "email profile"})
log(f"SIGN IN: open {dc.get('verification_url', 'https://www.google.com/device')} and enter code {dc['user_code']}")
interval = dc.get("interval", 5)
while True:
    time.sleep(interval)
    t = post("https://oauth2.googleapis.com/token", {
        "client_id": cfg["VITE_GOOGLE_OAUTH_CLIENT_ID"], "client_secret": cfg["VITE_GOOGLE_OAUTH_CLIENT_SECRET"],
        "device_code": dc["device_code"], "grant_type": "urn:ietf:params:oauth:grant-type:device_code"})
    if "id_token" in t: break
    if t.get("error") == "slow_down": interval += 5
    elif t.get("error") not in ("authorization_pending",): log(f"sign-in failed: {t.get('error')}"); sys.exit(1)

fb = post(f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key={cfg['VITE_FIREBASE_API_KEY']}", {
    "postBody": f"id_token={t['id_token']}&providerId=google.com", "requestUri": "http://localhost",
    "returnSecureToken": True}, form=False)
id_token, uid = fb["idToken"], fb["localId"]
exp = json.loads(base64.urlsafe_b64decode(id_token.split(".")[1] + "==="))["exp"]
log(f"signed in; ID token expires at {time.strftime('%H:%M:%S', time.localtime(exp))}")

DOC = f"https://firestore.googleapis.com/v1/projects/{cfg['VITE_FIREBASE_PROJECT_ID']}/databases/(default)/documents/_data/{uid}"
def get_doc(tok):
    req = urllib.request.Request(DOC, headers={"Authorization": f"Bearer {tok}"})
    try:
        r = urllib.request.urlopen(req); return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        return e.code, None

# 2. Record every save change during the window
log(f"RECORDING for {RECORD_SECONDS // 60} min: switch characters A -> B -> C now, ~20 s apart")
last, n, end = None, 0, time.time() + RECORD_SECONDS
while time.time() < end:
    code, doc = get_doc(id_token)
    if code == 200 and doc and doc.get("updateTime") != last:
        last = doc["updateTime"]; n += 1
        (OUT / f"save-{n:02d}.json").write_text(json.dumps({"seenAt": time.time(), "updateTime": last, "doc": doc}))
        log(f"save #{n} recorded (updateTime {last})")
    time.sleep(3)
log(f"recording done: {n} saves in {OUT}")

# 3. Expired-token checks at +1, +5, +15 minutes past expiry (no refresh)
results = {}
for mins in (1, 5, 15):
    wait = exp + mins * 60 - time.time()
    if wait > 0:
        log(f"waiting {int(wait // 60)} min for the +{mins} min check")
        time.sleep(wait)
    code, _ = get_doc(id_token)
    results[f"+{mins}min"] = code
    log(f"expired token +{mins} min -> HTTP {code} ({'REFUSED, good' if code in (401, 403) else 'ACCEPTED, raise the margin'})")
(OUT / "token-expiry-result.json").write_text(json.dumps({"checkedAt": time.time(), "results": results}))
log("ALL DONE")
