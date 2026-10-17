# Parser spike: can Toolbox's parsers run as a standalone package? (2026-10-16)

Ticket: [#4](https://github.com/YassSoliman/idleon-forge/issues/4). The spike code is in [`spikes/parser-spike/`](../../spikes/parser-spike/) on this branch (never merged).

Upstream pin: IdleOn Toolbox `f1e4240a64b8e90ae21acb5dadc778cd66dc0f38` (committed 2026-10-16), which Toolbox's own patch notes tag as **Toolbox 3.3.95 / game 2.3.531**. Every claim below was checked against that commit unless a different commit is named. `T/` stands for `https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/`.

## Answer

- **Yes, and it is cheap.** I copied `parsers/` (113 .ts files, ~48k LOC) unmodified, along with `data/website-data/`, `utility/` and `polyfills.js`. With a ~50-line esbuild alias plugin and **6 shim files (10 lines of code in total)**, `parseData()` runs under plain Node 22 with no Next.js, React, MUI or Mantine.
- **Verified byte-identical to Toolbox's own pipeline.** With the clock frozen, the spike's output matched Toolbox's unmodified code run through its own Vitest setup, byte for byte, on 3 public saves. All 11 public saves shipped in the repo parse with 0 failed sections, in 0.3 to 1.1 s each.
- **What broke:** only 6 things, all outside the parse path. The broken ones were `@mantine/hooks`, `@components/constants`, `@utility/analytics`, `@utility/clipboard`, a lazy `import('../services/leaderboardInfo')` in `helpers.js` (a "copy for support" button), and one `window.gtag` ambient type. Typechecking also needed Toolbox's generated `data/website-data.d.ts`. With it, `tsc --strict` reports 0 errors; without it, 124.
- **No real save was needed to prove this.** Toolbox ships public saves: `data/raw.json` (Morta's own W7 account, refreshed 2026-08-29) and `__test__/fixtures/*.json` (10 saves, W4 to W7, dated 2025-03 to 2026-10). **Not verified:** an early-game account like Yasser's (W2) or Joseph's. The lowest fixture is W4, account level 602.
- **Input shape:** `parseData(data, charNames, companion, guildData, serverVars, accountCreateTime, tournament)`. `data` is the raw Firestore `_data/{uid}` document (~335 flat keys such as `AFKtarget_0` and `Lv0_0`). The other arguments are the RTDB and Firestore side reads. Missing side data degrades gracefully, and `{ data: {} }` parses to an empty account.
- **Output shape:** `{ account, characters[] }`. `account` has 104 top-level systems at this pin. Each character has ~70 fields, including the ones an AFK Setup needs: `afkTarget`, `afkType`, `afkTime`, `currentMap`, `targetMonster`, `skillsInfo`, `equipment`, `talents` and `activePrayers`. The output is typed `any` at the boundary. Toolbox does generate `Account` and `Character` interfaces (5.7k lines) from fixtures, but `parseData` does not return them.
- **Two traps the Account State builder must handle:**
  1. `parseData` swallows any throw and returns `{ account: {}, characters: [] }` after a `console.error`, so an empty account is the only failure signal.
  2. The output depends on `Date.now()` (timers), so ADR 0002 determinism needs an injected clock.
- **Re-sync works mechanically.** `scripts/sync.sh <sha>` re-vendors any commit and records the commit and game version in `UPSTREAM`. I tested it against pins from 2026-09-16 and 2026-10-09: both built, typechecked clean and parsed today's save. An early version of the script broke on those older pins because `utility/hit-chance.mjs` was only added this month. The fix was to copy the whole of `utility/` and let the bundler's import graph decide what gets bundled.
- **Maintenance cost: low per sync, but the output churns.** Upstream changed ~13k lines in `parsers/` in the last week (71 commits). Over one month the parsed output gained 77 field paths and lost or renamed 2 to 3 (measured to depth 2). Estimate: ~15 to 30 minutes per routine re-sync, plus occasional adapter fixes, which comes to roughly **1 hour a week** on average, with spikes after big game updates. That holds as long as an Account State adapter with fixture contract tests sits between the parser output and the advice engine.

## Details

### 1. What was built

```
spikes/parser-spike/
  UPSTREAM                 pinned repo + commit + Toolbox/game version (written by sync.sh)
  scripts/sync.sh          clone/fetch upstream, copy parsers/ utility/ data/website-data/ polyfills.js LICENSE,
                           prepend a GPL-3.0 origin header to every vendored source file
  scripts/build.mjs        esbuild: Toolbox path aliases -> vendor/, UI modules -> shims/;
                           emits dist/run.mjs (Node CLI) and dist/index.browser.mjs (ESM library)
  scripts/smoke.sh         parse every public save in the pinned upstream; fail on empty account / failed section
  shims/*.ts               6 stubs (below)
  src/index.ts             the package surface: polyfills + re-export parseData
  src/run.ts               CLI: parse a save, report keys/characters/failed sections/timing; SPIKE_NOW freezes the clock
  vendor/                  (gitignored) regenerated by sync.sh
```

The vendored code is not committed: it is 11 MB and regenerated from the pin. To reproduce, run `npm install && npm run sync && npm run build && npm run smoke && npm run typecheck`.

### 2. What broke, and the stubs

The parsers import UI-coupled modules through only one file: `@utility/helpers`, which 91 parser files import ([T/utility/helpers.js](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/utility/helpers.js), lines 1 to 6). None of the coupled functions in it are on the parse path:

| Import | Who uses it | Stub |
|---|---|---|
| `@mantine/hooks` `readLocalStorageValue` | `helpers.handleLoadJson` (manual JSON import UI) | returns `defaultValue` |
| `@components/constants` `drawerPages`, `simulatedCompanionsKey` | `helpers.shouldDisplayDrawer`, `handleLoadJson` | the two constants, copied |
| `@utility/analytics` `trackEvent`, `errorMessage` | `handleLoadJson` error path | no-op / `e.message` |
| `@utility/clipboard` `copyText` | `copyForSupport`, `copyRawData` (buttons) | no-op |
| `../services/leaderboardInfo` (dynamic import) | `helpers.copyForSupport` | returns `{}` |
| `window.gtag` (type only) | `parsers/index.ts` catch block, guarded by `typeof window` ([T/parsers/index.ts](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/index.ts) L117 to 126) | ambient `Window.gtag?` (mirrors [T/custom.ts](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/custom.ts)) |

The esbuild metafile shows what the bundle actually contains: 106 of the 113 parser files, **7 utility files** (`helpers`, `lavaRand`, `talentBans`, `spriteImages` plus `data/sprite-manifest.json`, `hit-chance.mjs`, `consts`, `wiki/growth.mjs`), all 31 website-data files and the 5 runtime shims. The other `node_modules` inputs are `core-js` polyfills, `date-fns` and `lodash.merge`.

Polyfills: Toolbox's [T/polyfills.js](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/polyfills.js) patches `String.prototype` and `Array.prototype` (e.g. `capitalize`, `toChunks`), and the parsers depend on those patches. The package has to import it, which mutates globals. That is acceptable inside our own app but impolite in a library others import, so flag it for the package-boundary decision.

Typecheck: Toolbox's [T/tsconfig.json](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/tsconfig.json) is `strict`, and its full program typechecks clean. A parsers-only program gives 122 errors, even inside Toolbox. The missing piece is the ambient `declare module '@website-data'` in [T/data/website-data.d.ts](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/data/website-data.d.ts) (12k lines, "Auto-generated"). With it vendored, the spike passes `tsc --strict` with 0 errors.

### 3. Running `parseData()` on raw saves

**Saves used (all public, shipped in the upstream repo):**

| File | Last touched | World | Account level | Chars | Result |
|---|---|---|---|---|---|
| [`data/raw.json`](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/data/raw.json) | 2026-08-29 ("refresh raw.json from a live game save") | 7 | 13,810 | 11 | PASS |
| `__test__/fixtures/latest.json` | 2026-10-11 | 7 | 13,811 | 11 | PASS |
| `latest-2026-08.json`, `multikill-pin.json` | 2026-10-10, 2026-08-29 | 7 | 13,810 | 11 | PASS |
| `highend.json`, `speedrun-rank1.json` | 2026-08-22, 2026-08-25 | 7 | 19,185 / 19,351 | 11 | PASS |
| `fresh.json` (despite the name: a W6 account) | 2026-08-22 | 6 | 1,013 | 4 | PASS |
| `second.json`, `third.json` | 2025-03-16 | 6 | 5,189 / 5,532 | 10 | PASS |
| `fourth.json` | 2025-03-16 | 6 | 477 | 4 | PASS |
| `first.json` | 2025-03-16 | 4 | 602 | 7 | PASS |

Fixtures directory: [T/__test__/fixtures](https://github.com/Morta1/IdleonToolbox/tree/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/__test__/fixtures). Toolbox's own test loader shows how each envelope maps onto arguments: [T/__test__/helpers/parsed-fixtures.js](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/__test__/helpers/parsed-fixtures.js).

PASS means the account is non-empty and no `section "…" failed` errors were logged. Toolbox wraps sections in [T/parsers/safeSection.ts](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/safeSection.ts) and its own `empty-account.test.js` uses the same signal.

**Parity check.** I installed Toolbox's full dependency tree. `npm ci` fails at this commit because the lockfile is out of sync (`Missing: yaml@2.9.1`), so I used `npm install`. I then ran its own `parseData` through Vitest with `Date` faked to 2026-10-16T12:00Z, and the spike with `SPIKE_NOW=2026-10-16T12:00:00Z`. The serialized output was **byte-identical** for `raw.json`, `fresh.json` and `highend.json`. Without the frozen clock, two spike runs on the same save differ, because time-based fields (timers, `timeAway`-derived values) move.

**Constructed and degraded saves.**

| Input | Result |
|---|---|
| `{ data: {} }` | parses: 104 empty-but-defined account keys, 0 characters (upstream guarantees this in `empty-account.test.js`) |
| one character's keys only (`*_0`, 60 keys) | parses: 1 character |
| `fresh.json` with a random 50% of keys dropped | **whole parse returns `{account:{}, characters:[]}`** (crash in `initializeCharacter`, swallowed) |
| `highend.json` with a random 10% of keys dropped | same: silent empty result |

A real cloud save is never missing random keys, so this is artificial. It still shows that the parser is all-or-nothing at the top: one unexpected shape returns an empty result rather than a partial Account State. Characters listed in `charNames` that have no data come back as 6-field stubs with no `level` (seen in `fresh.json` and `fourth.json`), and the adapter has to tolerate them.

**Portability.** The same code also bundles as a browser-platform ESM library: `dist/index.browser.mjs`, 6.2 MB minified, **0.85 MB gzipped**. It uses no Node built-ins, and loading it under Node parses `raw.json`. **Not verified:** running it inside a real browser tab or in `workerd`. The Workers Paid script limit is well above 0.85 MB gzipped, but the startup cost of parsing ~9 MB of JSON data inside an isolate is untested.

### 4. Output shape: what would feed an Account State

`parseData` returns `{ account, characters }` ([T/parsers/index.ts](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/index.ts) L105 to 116). The return is effectively `any`, because `processedData: any` is computed in 3 passes to resolve cross-parser dependencies. Typed interfaces `Account` and `Character` do exist in [T/parsers/generated-types.ts](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/generated-types.ts) (generated from fixtures, per [T/parsers/types.ts](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/parsers/types.ts)), and the raw save is typed as `IdleonData` in `generated-firebase-types.ts`. A full parse serializes to ~5 to 8 MB of JSON, so an Account State should be a projection of it, not a copy.

**Per character** (~70 fields; observed on `fresh.json`, char "One"):

| Field | Example value | Account State use |
|---|---|---|
| `name`, `class`, `classIndex`, `level` | "One", "Siege_Breaker", 478 | roster / Meta Path position |
| `afkTarget`, `afkType`, `afkTime` | "_", "Nothing", epoch ms | **AFK Setup**: what the character is doing now |
| `currentMap`, `mapIndex`, `targetMonster`, `nextPortal` | "Frostbite_Towndra", 100 | AFK map, portal progress |
| `skillsInfo` (`{skill: {level, exp, expReq, rank}}`) | mining 15, smithing 88 | skill AFK choices |
| `equipment`, `tools`, `food`, `inventory`, `obols`, `cards`, `cardPresets` | | gear checks |
| `talents`, `starTalents`, `talentPreset`, `starSigns`, `activePrayers`, `activeBuffs`, `postOffice` | | build checks |
| `anvil`, `worship`, `statues`, `equippedBubbles` | | per-character production |

**Account-wide** (104 keys at this pin). These look the most useful for the MVP: `currentWorld`, `finishedWorlds`, `accountLevel`, `charactersLevels`, `timeAway`, `quests`, `tasks`, `storage`, `currencies`, `stamps`, `statues`, `alchemy`, `bribes`, `forge`, `anvil`, `refinery`, `construction`, `towers`, `printer`, `traps`, `totems`, `prayers`, `shrines`, `saltLick`, `cooking`, `lab`, `breeding`, `deathNote`, `arcade`. The full key list is in the spike output (`node dist/run.mjs <save> --out x.json`).

### 5. Re-syncing with upstream after a game patch

Procedure, as implemented and tested:

1. Find the new upstream commit, preferably one whose `data/patch-notes.js` top entry names the new `gameVer`.
2. `bash scripts/sync.sh <sha>` re-vendors and rewrites `UPSTREAM` (commit, date, Toolbox version, game version).
3. `npm run build` fails loudly on any new import that is neither aliased nor shimmed. That failure is the cue for a new shim.
4. `npm run typecheck`, then `npm run smoke` (all public saves).
5. Run the Account State adapter's contract tests over the fixtures, plus our own scrubbed saves once they exist. These catch renamed or removed output fields.
6. Review `git -C .upstream diff <old>..<new> --stat -- parsers data/website-data utility` and open a PR.

Test runs against older pins:

| Pin | Toolbox parsers | Build | `tsc` | Parse today's `raw.json` | Account keys |
|---|---|---|---|---|---|
| `fb37eb7` (last before 2026-09-16) | 110 files | ok | 0 errors | ok | 102 |
| `98456e0` (last before 2026-10-09) | 111 files | ok | 0 errors | ok | 103 |
| `f1e4240` (2026-10-16, pin) | 113 files | ok | 0 errors | ok | 104 |

Output drift between those pins, comparing parsed `raw.json` paths to depth 2:

- From 2026-09-16 to now: account +77/−2, character +32/−1.
- From 2026-10-09 to now: account +45/−2, character +3/−1.
- Removed or renamed paths: `arcade.maxBalls`, `emperor.nextLevelBonus`, `character.addedLevelsBreakdown.categories`.
- New top-level systems: `bundlesOwned`, `jellyOperator`.

### 6. Upstream churn and maintenance cost

Measured with `git rev-list`/`git diff --shortstat` on the clone:

| Window | All commits | `parsers/` commits | `website-data/` commits | `parsers/` diff | `website-data/` diff |
|---|---|---|---|---|---|
| since 2026-09-16 | 356 | 117 | 14 | 96 files, +9,658/−5,540 | 12 files, +5,304/−1,480 |
| since 2026-10-09 | 119 | 71 | 8 | 93 files, +7,768/−5,263 | 4 files, +2,516/−153 |

The churn costs us almost nothing directly, because we copy unmodified code and never merge by hand. The real costs are:

- **Shim breakage** (rare): it needs a new UI import reachable from the parsers. Fixing it takes minutes, and the build error points at it.
- **Output-shape breakage** (weekly-ish, small): 2 to 3 removed or renamed paths a week, most of them outside AFK-relevant fields. The adapter's contract tests catch these.
- **Upstream lag after a game patch**: we inherit Toolbox's turnaround, historically within days (see [ecosystem research](2026-10-16-ecosystem.md)). Toolbox accepts no PRs ([T/README.md](https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/README.md)), so a parser bug we hit can only be patched locally or waited out.
- **Build-environment drift**: upstream declares `node >=24` and its lockfile does not satisfy `npm ci` at this pin. Our package needs only `core-js`, `date-fns` and `lodash.merge`, and runs on Node 22.

Rough total: **~1 hour a week** on average. One person can carry it, provided step 5 (the adapter contract tests) exists and the sync is scripted as above.

### 7. GPL-3.0

`sync.sh` keeps upstream's `LICENSE` beside the code and prepends a header to every vendored source file. The header names the origin repo and commit and says the files were copied unmodified with imports redirected at build time, which covers GPL-3.0 §5(a) notice of modification. The spike's own files are marked GPL-3.0-only, and the Forge repo is already GPL-3.0 ([ADR 0001](../adr/0001-gpl3-and-fork-toolbox-parsers.md)).

## For the decision tickets

- **Commit `vendor/` or regenerate it?** The spike regenerates it to keep this branch light. For the real package, committing `parsers/` and `utility/` (~3 MB of text) makes each re-sync a reviewable PR diff. `website-data/` (8.9 MB of JSON, several MB of churn a month) would bloat history, so consider regenerating that part from the pin, or using Git LFS.
- **Account State boundary:** keep it as a thin, typed projection over Toolbox's `account` and `characters`, with an injected clock. Treat an empty `account` as a hard error. Contract tests should run over public fixtures plus our scrubbed saves.
- **Early-game coverage gap:** no public fixture is below W4. Run the adapter on Yasser's W2 export as soon as the save-export ticket lands.
- **Where parsing runs:** the browser ESM bundle is 0.85 MB gzipped and the parse takes ~0.3 to 1 s on Node. Neither a browser nor a Worker has been tested yet.

## Sources

- IdleOn Toolbox at the pin: https://github.com/Morta1/IdleonToolbox/tree/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38. Files cited inline: `parsers/index.ts`, `parsers/safeSection.ts`, `parsers/types.ts`, `parsers/generated-types.ts`, `utility/helpers.js`, `polyfills.js`, `custom.ts`, `tsconfig.json`, `vitest.config.js`, `data/website-data.d.ts`, `data/raw.json`, `__test__/fixtures/`, `__test__/helpers/parsed-fixtures.js`, `README.md`.
- Toolbox patch notes for the version mapping (`'ver': '3.3.95', 'gameVer': '2.3.531', 'date': '16/10/2026'`): https://github.com/Morta1/IdleonToolbox/blob/f1e4240a64b8e90ae21acb5dadc778cd66dc0f38/data/patch-notes.js
- Older pins used for the re-sync test: https://github.com/Morta1/IdleonToolbox/tree/fb37eb7c1dc36fcf2d27fb51a43bf955fec6e399 and https://github.com/Morta1/IdleonToolbox/tree/98456e0da046b2e63f96c073411d8e287729a5c1
- Spike code and commands: `spikes/parser-spike/` on branch [`research/parser-spike`](https://github.com/YassSoliman/idleon-forge/tree/research/parser-spike/spikes/parser-spike).
- Earlier context: [2026-10-16 ecosystem research](2026-10-16-ecosystem.md), [ADR 0001](../adr/0001-gpl3-and-fork-toolbox-parsers.md), [ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md), [ADR 0004](../adr/0004-source-precedence.md).

All findings were verified on 2026-10-16 against game version 2.3.531. Fixture saves from 2025-03 are older than the current patch but still parse; they test robustness, not current mechanics.
