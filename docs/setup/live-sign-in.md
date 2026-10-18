# Live sign-in config (`VITE_*`)

ActiveOn signs players in to **the game's own Firebase project** with **the game's own Google OAuth
client**, exactly as IdleOn Toolbox and the other community tools do. Those values are public (they
ship in every tool's browser bundle), but they belong to LavaFlame2, not to us, so this repository
never commits them. The app reads them from `VITE_*` variables at build time.

Without them the app still builds and runs: sign-in shows "Live sign-in isn't set up in this build"
and the raw-JSON paste fallback works.

## Local development

```sh
cp apps/activeon/.env.example apps/activeon/.env.local   # .env.local is gitignored
# fill in the values below, then:
pnpm dev
```

## Where each value comes from

Copy them from IdleOn Toolbox's public source at the commit our parsers are pinned to (see
[`packages/toolbox-parsers/UPSTREAM`](../../packages/toolbox-parsers/UPSTREAM)); the links below are
at `6c37e3d`.

| Variable | Source |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` in Toolbox's [`firebase/config.js`](https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/firebase/config.js) |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain`, same file (the `idlemmo` project) |
| `VITE_FIREBASE_DATABASE_URL` | `databaseURL`, same file. A bare host is fine; `https://` is added |
| `VITE_FIREBASE_PROJECT_ID` | `projectId`, same file |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket`, same file (optional) |
| `VITE_GOOGLE_OAUTH_CLIENT_ID` | `client_id` in Toolbox's [`services/auth/google.js`](https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/services/auth/google.js) |
| `VITE_GOOGLE_OAUTH_CLIENT_SECRET` | `client_secret`, same file (the token-poll request body) |

In-app Suggestions (M13) add two more public build values, `VITE_SUGGESTIONS_URL` and
`VITE_TURNSTILE_SITE_KEY`, already filled in [`.env.example`](../../apps/activeon/.env.example); see
[`deploy.md`](deploy.md#suggestions-m13). They are ours, not the game's, and only work while signed in.

Why a "secret" in a browser app: Google requires `client_secret` on the device-flow token call even
for clients that cannot keep one ([Google's limited-input device docs](https://developers.google.com/identity/protocols/oauth2/limited-input-device)),
so every tool ships the game's. It is public in Toolbox's repository; we still keep it out of ours.
**Risk:** LavaFlame2 can rotate any of these at any time, which breaks sign-in for every tool at once.
The paste fallback keeps working when that happens.

The research behind this design, including live CORS probes of every endpoint, is
`docs/research/2026-10-16-auth-sync.md` on the
[`research/auth-sync`](https://github.com/YassSoliman/idleon-forge/tree/research/auth-sync) branch.

## What sign-in does

1. `POST https://oauth2.googleapis.com/device/code` with the client ID and scope `email profile`.
2. ActiveOn shows the user code and a link to `google.com/device`.
3. It polls `POST https://oauth2.googleapis.com/token` every 5 s (slower on `slow_down`) until the
   player approves, declines, or the 30-minute code expires.
4. It exchanges Google's `id_token` for a Firebase session (`signInWithCredential`). The session is
   stored in this origin's IndexedDB and lasts until sign-out.
5. It listens to Firestore `_data/{uid}` with `onSnapshot` and, on each cloud save, reads the side
   data the parsers need: RTDB `_uid/{uid}` (character names), `_comp/{uid}`, `_usgu/{uid}/g`,
   `_guild/{id}`, `_tournament/{uid}`, and Firestore `_vars/_vars`, `_T_RES_UID/{uid}`,
   `_TOURNAMENT/_TOURNAMENT`.

Everything is a read. No token or save ever reaches a server of ours (there is none).

## Production

The deploy workflow builds with the same names, from the GitHub **production** environment: the
client secret as an environment **secret** (`VITE_GOOGLE_OAUTH_CLIENT_SECRET`), the rest as
environment **variables**. See [`deploy.md`](deploy.md).
