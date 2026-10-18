# Truth run: checking ActiveOn against a real, current save

A **truth run** (see [`GLOSSARY.md`](../../GLOSSARY.md)) takes one real save, runs the truth checks
headlessly, renders the app with that save, opens every character's Build, Gear and Cards tabs, reads
the numbers off the page and diffs them against the save itself. It finds the bugs our own-parse QA
can't: when the app and the QA both read the save the same wrong way, every check passes. Spec:
[M22](../specs/M22-truth-checks.md).

Everything here is local and read-only toward the game. Nothing writes to Firebase, nothing touches
the game client, nothing is sent anywhere. Saves stay in `fixtures/private/` (gitignored). Reports
name characters by slot and class only.

## 1. Capture the owner's latest save (owner's own Chrome)

This needs the owner's signed-in session, so the orchestrator does it in the owner's Chrome, never
in a fresh browser profile. It takes about a minute.

1. Open ActiveOn with the debug flag in the owner's Chrome:
   - after the release that ships M22: `https://activeon.idleon.workers.dev/?debug=truth`;
   - before that, the PR's Preview: `https://pr-<N>-activeon.idleon.workers.dev/?debug=truth`
     (Cloudflare Access asks for the owner's account first).
2. If the page shows **Sign in with Google**, sign in as usual. Wait until the Now screen shows the
   characters (the live save has been read; the header shows how long ago it was saved).
3. Click **Save my envelope locally** (bottom-left corner). Chrome downloads
   `live-<YYYY-MM-DD>.raw.json` into `~/Downloads`. If Chrome asks whether the site may download a
   file, allow it.
   - Same thing from the DevTools console or a browser-automation JavaScript call:
     `window.__activeonTruth.saveEnvelope()` (returns the file name, or `null` if no save was read yet).
   - The in-app Layer 1 result is there too: `window.__activeonTruth.report().violations`, and
     `console.table(window.__activeonTruth.facts())` for the facts table.
4. Move the file into the private fixtures (never anywhere else, never into a commit, issue or PR):
   `mv ~/Downloads/live-<YYYY-MM-DD>.raw.json /Users/yasser/Documents/Github/idleon-forge/fixtures/private/`

The file is the owner's whole save, character names included. It is gitignored by
`fixtures/private` and `*.raw.json`.

## 2. Run it

From the repository root, once per session:

```sh
pnpm install
pnpm build                                   # builds the parser bundle and the app with the checks
(cd apps/activeon && pnpm exec wrangler dev --port 8799)   # production headers, leave it running
```

Playwright is not a repo dependency. Install it once somewhere outside the repo and point the runner
at it:

```sh
npm i --prefix /tmp/pw playwright && npx --prefix /tmp/pw playwright install chromium
export PLAYWRIGHT=/tmp/pw/node_modules/playwright/index.js
```

Then:

```sh
node scripts/truth/run.mjs --out <scratchpad>/truth fixtures/private/live-<YYYY-MM-DD>.raw.json
# or every private save at once:
node scripts/truth/run.mjs --out <scratchpad>/truth fixtures/private/*.raw.json
```

`--serve` builds and starts `wrangler dev` itself; `--no-browser` runs only the headless half. The
headless half alone is `TRUTH_SAVE=<save> TRUTH_OUT=<file> pnpm exec vitest run --project
@idleon-forge/activeon test/truth-run.test.ts` (skipped when `TRUTH_SAVE` is unset, so CI never
reads a private save).

## 3. Read the report

`<out>/truth-run.md` (and `truth-run.json`) has, per save:

- **Violations (Layer 1)**: what the in-app truth checks found and held back. Each is a bug in the
  parse, the adapter or a module: the player now sees "Can't be sure of this one right now" there.
- **DOM vs raw (Layer 2)**: every number on the page that differs from the save after the checks ran.
  These are bugs the checks missed. Each one should become a new rule in `packages/truth/src/rules/`.

Rank each finding P0–P3 (P0: wrong advice that costs the player, shown with confidence; P1: a wrong
number or line a player acts on; P2: a wrong detail or a small count; P3: wording), file it, and
re-run after the fix. Report by class and slot only, never by name.

## 4. After a game patch

The raw readers copy two tables from the game client (class names, `TalentOrder`). Download the new
`N.js` (see `packages/truth/src/game-data.ts` for the URL) outside the repo and run
`node packages/truth/scripts/extract-n.mjs <path/to/N.js>`: it exits 1 when the tables changed.
