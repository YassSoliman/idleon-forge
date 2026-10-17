# M1 Sync & Account State

Spec for [#29](https://github.com/YassSoliman/idleon-forge/issues/29), part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). First module in the build order (M1 → M11 → M2 → M10 → M13 → M3 → M6 → M4 → M7 → M8 → M9 → M5, with M12 alongside), so every other module reads what this one produces.

Terms follow [`GLOSSARY.md`](../../GLOSSARY.md). Decisions this spec rests on: [ADR 0001](../adr/0001-gpl3-and-fork-toolbox-parsers.md) (pinned Toolbox parsers), [ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md) (deterministic advice), [ADR 0005](../adr/0005-toolbox-numbers-not-our-formulas.md) (Toolbox numbers), [ADR 0006](../adr/0006-client-only-spa-parsing-in-a-worker.md) (client-only SPA, parsing in a Web Worker), [ADR 0008](../adr/0008-worker-for-suggestions.md) (the Suggestions Worker never sees saves), and the resolutions of [#5](https://github.com/YassSoliman/idleon-forge/issues/5) (logins and live sync), [#4](https://github.com/YassSoliman/idleon-forge/issues/4) (parser fork), [#9](https://github.com/YassSoliman/idleon-forge/issues/9) (fixtures), [#10](https://github.com/YassSoliman/idleon-forge/issues/10) (Now screen), [#14](https://github.com/YassSoliman/idleon-forge/issues/14) (architecture), [#16](https://github.com/YassSoliman/idleon-forge/issues/16) (hypothetical math) and [#17](https://github.com/YassSoliman/idleon-forge/issues/17) (LLM and provenance).

**Status of the code.** Slice 1, [PR #28](https://github.com/YassSoliman/idleon-forge/pull/28) (`feat/slice-1-live-sync`), already builds most of M1. Each requirement below is tagged:

- **[built]**: in PR #28 and matching this spec. The spec documents it so that later changes are measured against it.
- **[change]**: in PR #28 but needs a fix or extension.
- **[gap]**: not built yet.
- **[later]**: specified for its interface only; not in the MVP.

**Verified 2026-10-17:** a real Google device-code sign-in worked locally for Yasser. Not yet recorded: live-sync latency (Cloud Save to updated screen), a session restore after a full browser restart, and Joseph's sign-in on his own browser. TR-20 turns these into acceptance checks.

---

## 1. Purpose

M1 is how ActiveOn knows what is happening in the player's account. The player signs in once with the Google account they play IdleOn with. From then on, every time the game cloud-saves (about every 4 minutes of play, or instantly on switching character or pressing Cloud Save), ActiveOn reads the save, turns it into a typed **Account State** in the background without freezing the page, and keeps a short history of those snapshots in the browser. When the save can't be read (a game patch the parser hasn't caught up with, Lava rotating its login, a bad paste), M1 says so plainly, never lets advice run on a broken read, and offers the raw-JSON paste as a fallback. Every later module (Stage, AFK Safety, Purpose, Spend Plan, the Now screen) reads only what M1 hands it.

## 2. Scope / Out of scope

**In scope**

- Google device-code sign-in to the game's Firebase project; session persistence and restore; sign-out.
- The live, read-only `onSnapshot` listener on the save and the side reads the parsers need.
- The raw-JSON paste fallback (Toolbox's **Copy for support** envelope, or a bare save).
- The vendored, pinned Toolbox parsers (`packages/toolbox-parsers`), run in a Web Worker with a frozen clock.
- The typed Account State adapter (`packages/account-state`) and its contract tests, including the rules for growing it as later modules need fields.
- Save history in IndexedDB (30 days), with a "Clear my data" control, Play Session detection and the queries other modules need (previous state, usual gap between Play Sessions).
- Freshness: last cloud save age, the active character, offline and stale states.
- Patch awareness: game build, save format, parser pin, and the "game updated, parser not caught up yet" banner.
- All failure states: unconfigured build, sign-in errors, wrong Google account, sync errors, empty or broken parse, shape changes.
- Fixtures: Toolbox's 11 public saves, Yasser's W2 save and Joseph's W3 save (local), and scrubbed copies for CI.
- A worker-side compute channel reserved for hypothetical math ([#16](https://github.com/YassSoliman/idleon-forge/issues/16), used by M5).

**Out of scope**

- **Steam sign-in** [later]: both MVP users log in with Google; Steam is later. Section TR-6 reserves the interface so it can be added without reworking the session code.
- Email/password and Apple sign-in (Apple needs a proxy Worker; [#5](https://github.com/YassSoliman/idleon-forge/issues/5)).
- More than one signed-in account per browser, viewing friends' accounts, comparing accounts ([#10](https://github.com/YassSoliman/idleon-forge/issues/10) item 16). Joseph uses his own browser.
- Any write to Firebase, Firestore or the game client. Background sync when the tab is closed, push notifications, any server of ours in the data path.
- Advice of any kind: Verdicts, Goals, Next Actions and done detection belong to the engine and M3–M10. M1 only supplies the states they compare.
- Expected Return UI (M10). M1 supplies `usualGapSeconds()`, the number the default comes from.
- The weekly parser re-sync GitHub Action and deploy pipeline (M12). M1 owns the `sync-parsers` script and the contract tests the Action runs.
- Domain move from `*.workers.dev` (the map's "Domain name and branding"). See red-team note R9.

## 3. Functional requirements

**Sign-in and session**

- **FR-1 [built]** A signed-out player sees "Sign in with Google". Pressing it requests a device code and shows the code, a Copy button, a link to `google.com/device`, and a countdown to expiry.
- **FR-2 [built]** ActiveOn polls Google at the interval Google gives (5 s by default), adds 5 s on `slow_down`, keeps going through `authorization_pending` and dropped requests, and stops with a clear message on `access_denied`, `expired_token` or local expiry. Cancel stops polling at once.
- **FR-3 [built]** On approval, ActiveOn exchanges Google's `id_token` for a Firebase session with `signInWithCredential` and shows "Signed in as <email>". Google tokens are not kept.
- **FR-4 [built]** The session persists in this origin's IndexedDB (localStorage as fallback) and restores on reload without asking the player again, until they sign out.
- **FR-5 [change]** If the signed-in Google account has no IdleOn characters, ActiveOn says "No characters found for this account. Is this the Google account you play with?" and offers Sign out. (Built as a sync error; must also offer Sign out in the same message.)
- **FR-6 [built]** Sign out ends the Firebase session, stops the listener, and clears the in-memory Account State and last good state. Save history is kept (see FR-21 and D2).
- **FR-7 [built]** A build without the `VITE_*` sign-in values shows "Live sign-in isn't set up in this build" and opens the paste fallback.

**Live sync**

- **FR-8 [built]** While signed in, ActiveOn listens to the save document `_data/{uid}` and, on each change, reads the side data (character names, server vars, companion, guild, tournament) and assembles the parser input the way Toolbox does. Everything is a read.
- **FR-9 [built]** A snapshot that arrives while an older one is still being read wins; the older one is dropped.
- **FR-10 [change]** Snapshot bursts (switching characters quickly) never queue more than one parse behind the one running. The newest pending snapshot replaces any older pending one. (Today the UI drops stale results but the worker still parses every request.)
- **FR-11 [gap]** If the save has more characters than the names read at sign-in (a character was created mid-session), ActiveOn re-reads the names before parsing.
- **FR-12 [gap]** If the listener fails with a transient error, ActiveOn retries with backoff (2 s, 10 s, 30 s, then every 2 min) and shows "Reconnecting…" with the age of the last good save. If it fails with `permission-denied` or `unauthenticated`, ActiveOn shows "Your sign-in has expired. Sign in again." and offers Sign in.

**Parsing and the Account State**

- **FR-13 [built]** Every save is parsed in a Web Worker. The page stays responsive during a parse; while a newer save is parsing, the current screen stays visible (no flicker back to "Reading your save…").
- **FR-14 [built]** Parsing is deterministic: the same save and the same `now` give the same Account State.
- **FR-15 [built]** An empty parse (Toolbox's silent failure), a save with no character data, or a changed output shape is a hard failure: the screen shows "Can't read your save right now", what kind of failure it is, the age and time of the last good save, and the paste box. No characters and no advice are shown from it.
- **FR-16 [change]** A parse where some parser sections failed is not a hard failure, but the Account State lists those sections in a structured form so that any Detector depending on them returns Unknown rather than a confident answer. (Today they are only text warnings.)
- **FR-17 [gap]** Side reads that failed (guild, companion, tournament, server vars) are listed in the Account State the same way, for the same reason.
- **FR-18 [built]** A bare save pasted without character names numbers characters "Character 1…" and shows a one-line warning.
- **FR-19 [gap]** The Account State names the **active character**: the character whose own save time is the newest and within 30 s of the account's last cloud save. If no character qualifies (character select, or a burst that left them tied), it is null. M10 uses it to open that character's row.

**Paste fallback**

- **FR-20 [built]** Without signing in, a player can paste Toolbox's "Copy for support" JSON or a bare save, and see the same character list as live sync. Non-JSON or non-save text shows "That doesn't look like an IdleOn save." A later good paste or live save recovers the screen. The header says "pasted" next to the save age.

**History**

- **FR-21 [gap]** Each new live Account State that parsed cleanly is stored in IndexedDB, keyed by account and cloud-save time, for 30 days. A repeat of the same cloud save (another tab, a re-delivered snapshot) is stored once.
- **FR-22 [gap]** History is per account: a different Google account signing in on the same browser never sees or mixes with the previous account's history.
- **FR-23 [gap]** A "Clear my data" control deletes this browser's save history, preferences and "Not for me" choices for the signed-in account, and offers to sign out too. After it, nothing from that account remains in this origin's storage except the Firebase session (and not that either, if the player also signs out).
- **FR-24 [gap]** History answers, for the engine and M10: the previous clean Account State, the Account State at the start of the current Play Session, all states since a given time, the list of Play Sessions, and the usual gap between Play Sessions (the median of the last 10 gaps, null with fewer than 3).
- **FR-25 [gap]** If IndexedDB is unavailable (some private windows) ActiveOn still works, with history kept in memory for the tab, and says once "History can't be saved in this browser window."

**Freshness and patch awareness**

- **FR-26 [built]** The header shows "last cloud save Ns ago", ticking every second. After 4 minutes with no new save during live sync, it adds "No new save for a while: switch character in the game to refresh."
- **FR-27 [change]** If the last cloud save is older than 30 minutes when ActiveOn opens, the hint reads "Open the game and switch character to refresh" instead (the game is probably closed).
- **FR-28 [gap]** When the browser is offline, the header says "Offline" and the save age keeps counting; the listener resumes on its own when the connection returns.
- **FR-29 [gap]** The Account State carries the game's server build, the save format version, and the parser pin (commit and game version). When the save's build or format is newer than any this parser pin has parsed cleanly, and that save has failed sections or failed outright, ActiveOn shows "The game updated and our save reader hasn't caught up yet." A newer build that parses cleanly only shows a quiet line in the footer (see D3).

## 4. User stories

Fixtures used below. Real saves never leave `fixtures/private/` (gitignored); CI runs the public and scrubbed ones (TR-17).

| Fixture | What it is |
|---|---|
| `public/toolbox-raw.json` | Toolbox's demo account (W7, 11 characters), a "Copy for support" envelope |
| `public/*.json` | The other 10 Toolbox public saves (W4–W7) |
| `private/yasser.raw.json` | Yasser's W2 account, 5 characters (Barbarian 60, Wizard 56, Bowman 54, Shaman 44, Squire 43) |
| `private/joseph.raw.json` | Joseph's W3 account, the second fixture: 6 characters (Squire 85, Wizard 73, Bowman 60, Barbarian 56, Shaman 54, Squire 51), Worlds 1–2 finished |
| `scrubbed/w2.json`, `scrubbed/w3.json` | Scrubbed copies of the two real saves for CI (TR-17, D1) |

**US-1. Sign in once.** As a player in a Play Session, I want to sign in with the Google account I play with, so that ActiveOn can see my account without me exporting anything.

- Given a configured build and no session / When I press Sign in with Google / Then a code, a Copy button, a `google.com/device` link and "code expires in 30m" appear, and nothing else is requested.
- Given a device code is showing / When Google answers `authorization_pending` three times, then an `id_token` / Then ActiveOn shows "Signed in as <email> · waiting for your save…".
- Given a device code is showing / When I press Cancel / Then polling stops (no further token requests) and Sign in with Google is back, with no error.
- Given a device code is showing / When Google answers `access_denied` / Then "Sign-in was declined on the Google page." appears under the Sign in button.

**US-2. Stay signed in.** As a player starting a Play Session, I want ActiveOn to remember me, so that I can open it and go.

- Given I signed in yesterday on this browser / When I open ActiveOn / Then I see "Checking for a saved sign-in…" for under 2 s, then my characters, with no code to type.
- Given I signed out / When I reload / Then I see Sign in with Google and no characters.

**US-3. See my account live.** As a player in a Play Session, I want the list to update by itself when the game cloud-saves, so that what I see matches the game.

- Given signed in with `yasser.raw.json` as the current save / When the listener delivers it / Then 5 character rows appear, each with class, level, what it is doing and its map, and the footer reads "World 2 · game build 142 · parser targets 2.3.540".
- Given `joseph.raw.json` is delivered / When the engine runs / Then 6 rows appear, both Squires listed, and the footer reads World 3.
- Given a save is showing / When a newer save arrives and parses / Then the rows update in place without the "Reading your save…" state replacing them.
- Given three saves arrive within 2 s (character switching) / When they are processed / Then at most two parses run and the screen ends on the newest one.

**US-4. Know how fresh it is.** As a player in a Play Session, I want to know how old the data is and how to refresh it, so that I don't act on an old picture.

- Given a save whose last cloud save was 30 s ago / When the screen renders / Then the header reads "last cloud save 30s ago".
- Given live sync and no new save for 4 min 1 s / When the clock ticks / Then the hint "switch character in the game to refresh" appears.
- Given I open ActiveOn and the latest save is 9 h old / When it renders / Then the hint reads "Open the game and switch character to refresh".
- Given the browser goes offline / When 2 min pass / Then the header shows "Offline" and the age keeps rising; when it comes back online, the next save updates the screen without a reload.

**US-5. Know who I'm playing.** As a player in a Play Session, I want ActiveOn to know which character I'm on, so that the right row is open.

- Given `yasser.raw.json` / When the adapter runs / Then `activeCharacterIndex` is 0 (that character's save time equals the account's).
- Given `joseph.raw.json` / When the adapter runs / Then `activeCharacterIndex` is 5.
- Given a save where no character's save time is within 30 s of the account's / When the adapter runs / Then `activeCharacterIndex` is null and no row opens on its own.

**US-6. Never get advice from a broken read.** As a player in a Play Session, I want a clear message when my save can't be read, so that I never follow advice built on bad data.

- Given a save from which Toolbox's parser silently returns an empty account (the adapter test's save with `Lv0_*` and `EquipOrder_*` removed) / When it is parsed / Then "Can't read your save right now" appears with "A game update may have changed it", and no character rows are shown.
- Given a good save was showing 3 min ago / When the next save fails / Then the message also shows "Last good save: 3m ago (<time>)" and the paste box.
- Given an adapter field was renamed upstream (simulated: `class` removed from a character) / When parsed / Then the kind is "shape" ("This needs a fix on our side") and the error names the field path.
- Given a save whose `obols` section failed but the rest parsed / When the adapter runs / Then the rows show normally and `diagnostics.failedSections` contains `obols`.

**US-7. Paste instead.** As a player whose sign-in is broken, I want to paste my save from Toolbox, so that I can still use ActiveOn.

- Given no sign-in config / When I open ActiveOn / Then the paste box is open and explains Toolbox's **Copy for support**.
- Given I paste `public/toolbox-raw.json` / When I press Read this save / Then 11 rows appear within 3 s and the header says "pasted · last cloud save …".
- Given I paste `hello` / When I press Read this save / Then "That doesn't look like an IdleOn save." appears and no rows.
- Given I paste the `data` object of `yasser.raw.json` alone (no names) / When parsed / Then 5 rows named "Character 1"…"Character 5" and the warning "Character names are not in this save" appear.

**US-8. History, kept on my machine.** As a player starting a Play Session, I want ActiveOn to remember earlier saves, so that it can tell me what changed since last time and how long I usually stay away.

- Given saves at 10:00, 10:04 and 10:08, then nothing until 18:30, then 18:30 and 18:34 / When history is queried / Then there are 2 Play Sessions, the gap is 8 h 22 min, and the Account State at the start of the current Play Session is the 18:30 one.
- Given the same cloud save is delivered twice (two tabs) / When stored / Then history holds one record for it.
- Given history from 31 days ago / When ActiveOn opens / Then those records are gone.
- Given Yasser's history exists on this browser / When another Google account signs in here / Then that account's history is empty.
- Given history exists / When I press Clear my data and confirm / Then history, preferences and "Not for me" choices are gone, and a reload shows no "since last time" data.

**US-9. Told when the game patched.** As a player right after a game update, I want to know if ActiveOn can't keep up yet, so that I trust or distrust it correctly.

- Given the parser pin has parsed build 142 cleanly / When a save with build 143 parses with failed sections / Then the banner "The game updated and our save reader hasn't caught up yet" appears above the rows.
- Given the same / When a build-143 save parses with no failed sections / Then no banner; the footer reads "game build 143 · parser targets 2.3.540".

**US-10. The wrong Google account.** As a player with more than one Google account, I want to be told I picked the wrong one, so that I'm not staring at an empty screen.

- Given I sign in with a Google account that has no IdleOn characters / When the listener starts / Then "No characters found for this account. Is this the Google account you play with?" appears with a Sign out button.

## 5. Technical requirements

### Package boundaries

- **TR-1 [built]** Packages and their only allowed dependencies:

  | Package | Contents | May import |
  |---|---|---|
  | `packages/toolbox-parsers` | Vendored Toolbox parsers at the `UPSTREAM` pin, `parseSave`, envelope normalization, frozen clock | nothing of ours |
  | `packages/account-state` | `toAccountState`, types, contract tests, fixtures, scrubber (TR-17) | `toolbox-parsers` (types and, in tests, runtime) |
  | `packages/sync` | Google device-code flow, Firebase session, save listener, envelope assembly, history store (TR-11) | `toolbox-parsers` (types only), `account-state` (types only), `firebase` |
  | `apps/activeon` | UI, the parse Web Worker, state hook | all of the above; **runtime** import of `toolbox-parsers` only inside `src/worker/` |

  A Biome or lint rule (or a test that greps the built main chunk for the Toolbox licence banner) fails CI if the UI thread bundle includes the parser runtime. [gap: the check]

- **TR-2 [built]** Every source file starts with `// SPDX-License-Identifier: GPL-3.0-only`. Vendored files keep their upstream header. `vendor/` is never hand-edited.

### Parser and worker

- **TR-3 [built]** `parseSave(envelope, { now })` freezes the global `Date` to `now` for the synchronous parse, captures Toolbox's `console.error` reports into `failedSections` and `error`, and returns `{ account, characters, failedSections, error, meta: { now, saveVersion, capturedAt, parserGameVersion } }`.
- **TR-4 [change]** Worker protocol (`apps/activeon/src/worker/protocol.ts`) grows to:

  ```ts
  export type WorkerRequest =
    | { id: number; type: 'parse'; input: ParseInput; now: number }
    // Reserved for M5 (#16): run a Toolbox function on a modified copy of a character from the
    // last clean parse, e.g. getMaxDamage with another mapIndex/targetMonster/afkType.
    | { id: number; type: 'what-if'; query: WhatIfQuery; now: number };

  export type ParseResponse =
    | { id: number; ok: true; state: AccountState; ms: number }
    | { id: number; ok: false; kind: ParseFailureKind; message: string; ms: number };

  export type ParseFailureKind = 'input' | 'empty' | 'shape' | 'crash' | 'timeout';
  ```

  The worker keeps the last clean Toolbox output (the ~4–5 MB parsed object) in memory for `what-if` requests; only the Account State crosses to the UI thread. `WhatIfQuery` is defined by M5's spec; M1 only reserves the message type.
- **TR-5 [change]** Parser client: one long-lived worker; **at most one parse in flight and one pending** (latest replaces pending, superseded callers resolve with `{ superseded: true }`); a parse that takes longer than 15 s resolves as `timeout`, and the worker is terminated and recreated. A worker `error` event fails everything in flight as `crash` [built] and also recreates the worker [gap].

### Sign-in and sync

- **TR-6 [built, extend later]** Session API (`packages/sync/src/session.ts`): `createSession(config)`, `onUserChanged(session, cb)`, `signInWithGoogleDevice(session, { onDeviceCode, signal })`, `signOut(session)`. Firebase auth uses `initializeAuth` with `[indexedDBLocalPersistence, browserLocalPersistence]` on a named app `activeon`. Popup and redirect sign-in are not used (our origin is not on the game project's authorised domains). **[later]** Steam adds `signInWithSteamReturnUrl(session, url)`: validate the `legendsofidleon.com/steamsso/` prefix, POST the five OpenID fields to `asil`, then `signInWithCustomToken`; the rest of M1 is unchanged because everything downstream keys on the Firebase `uid`.
- **TR-7 [built]** Config only from `VITE_*` build variables (`readSyncConfig`); blanks count as missing; no value is committed. The Google client secret is a GitHub environment secret in production even though it is public upstream.
- **TR-8 [built, change]** `listenToSave(session, uid, { onEnvelope, onError })`:
  - bootstrap reads RTDB `_uid/{uid}` and Firestore `_vars/_vars`; empty names → the "wrong account" error [built];
  - `onSnapshot(doc(firestore, '_data', uid))` with no metadata changes; on each snapshot, read `_comp/{uid}`, `_usgu/{uid}/g`, `_guild/{id}`, `_tournament/{uid}`, `_T_RES_UID/{uid}`, `_TOURNAMENT/_TOURNAMENT`; newest snapshot wins [built];
  - [gap] re-read `_uid/{uid}` when the save has more character slots than names (FR-11);
  - [gap] re-read `_vars/_vars` at most every 30 min, and whenever `CSver` changes;
  - [gap] report which side reads returned an error (not "absent") in `SideReadReport`, passed through the envelope to the Account State (FR-17);
  - [gap] classify listener errors: `permission-denied` and `unauthenticated` → `auth-expired`; others → `transient` with the FR-12 backoff.
- **TR-9 [gap]** Read budget on the game's Firebase: at most 1 listener and 7 side reads per cloud save per tab, no polling. Toolbox does the same per save, so ActiveOn is never a heavier client than the tool the game's community already uses.

### Account State

- **TR-10 [built, change]** The Account State shape (`packages/account-state/src/types.ts`). Built fields are unchanged; additions marked:

  ```ts
  export interface AccountState {
    /** Bumped whenever a field is added, renamed or changes meaning. [gap] */
    schemaVersion: number;
    /** The `now` the save was parsed at (epoch ms). */
    asOf: number;
    account: AccountSummary;
    characters: CharacterState[];
    /** Index of the character being played at the last cloud save, or null (FR-19). [gap] */
    activeCharacterIndex: number | null;
    /** Structured, machine-readable problems with this read (FR-16, FR-17). [gap] */
    diagnostics: ParseDiagnostics;
    /** Human-readable warnings, for display only. [built] */
    warnings: string[];
  }

  export interface ParseDiagnostics {
    /** Toolbox parser sections that threw and fell back, e.g. "obols". */
    failedSections: string[];
    /** Side reads that errored (not merely absent). */
    failedSideReads: Array<'charNames' | 'serverVars' | 'companion' | 'guild' | 'tournament'>;
    /** Character slots skipped for lack of data. */
    skippedCharacters: number[];
    /** True when names were missing and characters are numbered. */
    unnamed: boolean;
    parserPin: { commit: string; gameVersion: string };
    source: 'live' | 'paste';
  }

  export interface AccountSummary {
    currentWorld: number | null;           // [built]
    finishedWorlds: number[];              // [built]
    lastCloudSave: number | null;          // [built] from TimeAway.GlobalTime
    secondsSinceLastSave: number | null;   // [built]
    gameVersion: {
      serverBuild: number | null;          // [built] _vars.GameVERSION, e.g. 142
      saveVersion: number | null;          // [built] CSver, e.g. 34.05
      parserTarget: string;                // [built] e.g. "2.3.540"
    };
  }

  export interface CharacterState {
    index: number; name: string; class: string; level: number;          // [built]
    afkType: KnownAfkType | (string & {}); afkTarget: string | null;    // [built]
    currentMap: string | null; foodStacks: FoodStack[];                 // [built]
    /** From PTimeAway_<i>; the newest one marks the active character. */
    secondsSinceLastSave: number | null;                                 // [built]
  }
  ```

  The Account State must be structured-cloneable (no functions, Maps or class instances) and under 1 MB serialized for an 11-character account.
- **TR-11 [gap]** **Growing the Account State.** Detectors (M11 onward) read only the Account State, never Toolbox output. When a module needs a field:
  1. add it to `types.ts` with a doc comment naming its Toolbox source path;
  2. read it in `adapter.ts` only, failing with `AccountShapeError` if a present value has the wrong type, and returning `null` (not a default) when the save lacks it;
  3. add it to `FIELD_SOURCES` (`Record<string, string>`, Account State path → Toolbox path), which the engine uses to record the save fields behind each Next Action ([#14](https://github.com/YassSoliman/idleon-forge/issues/14) item 4, [#17](https://github.com/YassSoliman/idleon-forge/issues/17));
  4. bump `schemaVersion` and update the contract snapshot, with a one-line reason in the PR.

  A field depending on a parser section listed in `diagnostics.failedSections` must be readable as "unknown" by Detectors: `FIELD_SECTIONS` maps each field to the Toolbox section(s) it comes from, so `isKnown(state, path)` can answer.
- **TR-12 [gap]** Active character: Toolbox's own rule (`getBestActiveCharacter`) is the newest `PTimeAway_<i>`. M1 adds a confidence bound: the newest character counts only if its save time is within 30 s of `TimeAway.GlobalTime` and no other character is within 1 s of it. Checked against both real fixtures (TR-17): Yasser's save marks slot 0 (0 s off), Joseph's marks slot 5 (0 s off, nearest other 23 s off).
- **TR-13 [built]** Hard errors: `EmptyAccountError` (empty `account`, or no character with data) and `AccountShapeError` (a read field has the wrong type; message names the path). Worker maps them, plus `InvalidSaveInputError`, to `input`/`empty`/`shape`/`crash`.

### History

- **TR-14 [gap]** IndexedDB database `activeon`, version 1, owned by `packages/sync/src/history.ts`:

  ```ts
  /** One stored snapshot. Key: [uid, lastCloudSave]. */
  export interface SaveRecord {
    uid: string;               // Firebase uid; stays on this device
    lastCloudSave: number;     // epoch ms, from the save itself
    receivedAt: number;        // epoch ms, local clock
    schemaVersion: number;
    state: AccountState;
    /** gzip (CompressionStream) of the raw envelope; kept only on the newest record and on the
     *  last record of each Play Session, so a later parser fix or schema bump can re-derive. */
    rawGzip?: Blob;
  }

  export interface PlaySession { start: number; end: number; saves: number }

  export interface SaveHistory {
    put(uid: string, state: AccountState, raw: RawSaveEnvelope): Promise<void>; // idempotent per key
    latest(uid: string): Promise<SaveRecord | null>;
    previous(uid: string, before: number): Promise<SaveRecord | null>;
    sessionStart(uid: string, at: number): Promise<SaveRecord | null>;
    since(uid: string, from: number): Promise<SaveRecord[]>;
    playSessions(uid: string, from?: number): Promise<PlaySession[]>;
    usualGapSeconds(uid: string): Promise<number | null>;
    clear(uid: string): Promise<void>;
    prune(now: number): Promise<void>;  // drops records older than 30 days; runs on open
  }
  ```

  Object stores: `saves` (key `[uid, lastCloudSave]`, index `[uid, receivedAt]`) and `meta` (per uid: highest build and save format parsed cleanly at each parser pin, for FR-29). Preferences ("Not for me", Expected Return choice) stay in localStorage, namespaced by uid, and are cleared by `clear(uid)`.
- **TR-15 [gap]** Play Session rule: consecutive stored saves belong to one Play Session while the gap between their `lastCloudSave` times is under 15 minutes (the game saves every ~4 minutes during play). `usualGapSeconds` is the median gap between the last 10 Play Sessions, null with fewer than 3. Only clean, live saves are stored (see D2 for pastes). Records are written only when `lastCloudSave` is newer than the latest stored one, or new for that key.
- **TR-16 [gap]** Storage budget: under 50 MB per account for 30 days. Estimate: the raw envelopes are ~0.3–0.4 MB (both real saves), ~50–80 KB gzipped, kept on ~1 record per Play Session; Account State records are small today and capped at 1 MB each by TR-10. If `navigator.storage.estimate()` reports under 100 MB free, raw blobs beyond the newest are dropped first.

### Fixtures and tests

- **TR-17 [change]** Fixtures:
  - `packages/account-state/fixtures/public/`: Toolbox's 11 public saves, unmodified, refreshed by `pnpm sync-parsers` [built].
  - `fixtures/private/yasser.raw.json` and `fixtures/private/joseph.raw.json` (gitignored, local only): **Joseph's save is the second fixture**, giving a W3, 6-character, two-Squire account next to Yasser's W2, 5-character one. Both are "Copy for support" envelopes and pass the contract tests locally today [built].
  - [gap] `packages/account-state/fixtures/scrubbed/w2.json` and `w3.json`, produced by `pnpm scrub-fixture <in> <out>`: character names replaced by `<Class> <slot>`, and `uid`, email, guild id and members, companion, tournament, `accountCreateTime`, `lastUpdated` and any player name inside the save removed or replaced. A test fails if any string from the source's `charNames` or guild member list appears in the output. Committing `w3.json` needs Joseph's OK (D1).
- **TR-18 [built, extend]** Tests (Vitest):
  - contract tests over every public, scrubbed and (locally) private fixture: valid Account State, no warnings other than skipped stubs, shape snapshot without names [built for public and private];
  - determinism: same save and `now` give equal output; a later `now` moves the ages [built];
  - device flow: pending, `slow_down`, expiry, cancel, rejection [built]; `access_denied` [gap];
  - envelope assembly and config [built];
  - worker handler: paste envelope, bare save, live envelope [built]; coalescing, timeout and worker restart [gap];
  - history: idempotent put, pruning at 30 days, per-uid isolation, Play Session splitting, usual gap, clear [gap] (with `fake-indexeddb`);
  - active character on both real fixtures and a synthetic tie [gap];
  - user stories in section 4 become the golden tests (M11's harness runs them).
  - Tests never print names or values from private fixtures.

### Performance

- **TR-19** Budgets on a mid-range desktop (measured in the production build, headless Chrome):
  - parse + adapt in the worker: p95 ≤ 1.5 s for W1–W4 saves, ≤ 2.5 s for the largest public save [today ~1 s for `toolbox-raw.json`];
  - UI thread: no task over 50 ms caused by a save arriving (only structured-clone of the Account State and a React render);
  - main chunk ≤ 300 KB gzipped [today 265 KB]; [gap] lazy-load Firebase so paste-only visits skip ~250 KB;
  - worker chunk loads once and is cached (immutable hashed filename); ~6.3 MB today;
  - history `put` ≤ 50 ms; `playSessions` over 30 days ≤ 100 ms;
  - first characters on screen after a restored session: ≤ 3 s after the save snapshot arrives.

### Verification on real accounts

- **TR-20 [gap]** Before M1 is marked done, record in the PR (time measurements only, no account data):
  1. Yasser: press Cloud Save in game, time until the screen updates (target: under 10 s). Repeat 3 times.
  2. Yasser: quit the browser fully, reopen ActiveOn: characters appear without a code.
  3. Joseph: sign in with Google on his own browser, see 6 rows, and pass the same two checks.
  4. Both: leave ActiveOn open through one full Play Session; history shows one Play Session with the right number of saves.

### Security and privacy

- **TR-21 [built]** Read-only: no Firestore, RTDB or Functions write is ever called. A test greps `packages/sync/src` for `setDoc`, `updateDoc`, `addDoc`, `deleteDoc`, `set(`, `update(`, `push(`, `httpsCallable` and fails on any hit (Steam's `asil` call, when it comes, is a read-only token exchange and will be the one allow-listed exception). [gap: the test]
- **TR-22** Nothing leaves the browser except the reads themselves: no analytics, no error reporting service, no save or token sent to any server of ours. The Suggestions Worker (M13) receives only what `reportContext(state)` returns: Stage (from M2), `gameVersion`, `parserPin`, `diagnostics.failedSections`, and the class and level of the character in question. Never names, `uid`, email or the save. [gap: `reportContext`]
- **TR-23 [change]** Console hygiene: in production builds, Toolbox `console.error` messages passed through by `parseSave` are truncated to 200 characters and never include an object dump, so a player's save can't end up in a screenshot of DevTools or a pasted log.
- **TR-24 [built]** The paste stays in the tab: pasted text is sent only to the worker, never stored. The email address is shown only in the signed-in line.
- **TR-25 [gap]** Content Security Policy on the static site: `script-src 'self'`, `worker-src 'self'`, `connect-src` limited to `oauth2.googleapis.com`, `*.googleapis.com`, `*.firebaseio.com` (and their WebSocket forms), `frame-ancestors 'none'`. Served by the Worker static-assets headers file (M12 deploys it).

## 6. States and edge cases

| State or case | What the player sees | How M1 handles it |
|---|---|---|
| Build not configured | "Live sign-in isn't set up in this build", paste box open | FR-7 [built] |
| Restoring session | "Checking for a saved sign-in…" | `onAuthStateChanged` fires once; if it hasn't in 5 s, show Sign in with a note [gap] |
| Signed out | Sign in with Google, paste box closed | [built] |
| Device code showing, tab in background | Code stays; approval is picked up | Browsers throttle background timers to about once a minute; polling still completes, at worst a minute late. Accepted. |
| Code expires (30 min) | "The sign-in code expired." | FR-2 [built] |
| Wrong Google account | "No characters found… Is this the Google account you play with?" + Sign out | FR-5 [change] |
| Signed in, waiting for first save | "Signed in as … · waiting for your save…" | [built]; if none in 15 s, add "Is the game's cloud save on?" [gap] |
| Parsing first save | "Reading your save…" | [built] |
| Parsing a newer save | Current rows stay | FR-13 [built] |
| Snapshot burst | Ends on newest | FR-10, TR-5 [change] |
| Empty parse | "Can't read your save right now · A game update may have changed it" + last good + paste | FR-15 [built] |
| Shape change | Same, kind "shape" | FR-15 [built]; the weekly re-sync PR's contract tests should catch it first (M12) |
| Partial parse (failed sections) | Rows show; affected Detectors say Unknown | FR-16 [change] |
| Failed side reads | Rows show; guild/companion-dependent Detectors say Unknown | FR-17 [gap] |
| Game patched, parser behind | Banner "The game updated and our save reader hasn't caught up yet" | FR-29 [gap] |
| Game patched, parser still fine | Footer only | FR-29, D3 |
| New character mid-session | New row with its name | FR-11 [gap] |
| Character slot with no data | Skipped, warning | [built] |
| Bare paste, no names | "Character 1…", warning | FR-18 [built] |
| Paste while signed in | Pasted state shows with "pasted"; the next live save replaces it | [built]; pastes are not stored in history (D2) |
| Offline | "Offline", age keeps rising | FR-28 [gap]; Firestore reconnects on its own |
| Listener transient error | "Reconnecting…" + last good age | FR-12 [gap] |
| Token revoked or expired | "Your sign-in has expired. Sign in again." | FR-12 [gap] |
| Lava rotates the OAuth client or Firebase key | Sign-in fails with Google's error; "Paste your save instead" is offered | Paste fallback [built]; M12 owns updating the `VITE_*` values |
| Game closed when ActiveOn opens | Old age, "Open the game and switch character" | FR-27 [change] |
| Local clock wrong | Ages clamp at 0 [built]; if the save appears more than 2 min in the future, a note "Your computer's clock looks off" [gap] |
| Multiple tabs | Each tab listens and parses; history stores each cloud save once; sign-out in one tab signs out all (Firebase auth syncs across tabs) | FR-21, TR-15. Accepted cost: one extra listener's reads per extra tab |
| Second account on same browser | Previous account's history is hidden, not deleted; "Clear my data" removes the current account's | FR-22 [gap] |
| IndexedDB unavailable | Works; "History can't be saved in this browser window" once | FR-25 [gap] |
| Storage nearly full | Older raw blobs dropped first | TR-16 [gap] |
| Worker fails to load (old browser, CSP) | "Something went wrong while reading the save" | TR-5 [built]; recreate [gap] |
| Parse hangs | After 15 s, timeout; worker recreated | TR-5 [gap] |
| History older than 30 days | Pruned on open | TR-14 [gap] |
| Schema bump between visits | Old records still readable; fields they lack read as unknown; newest record re-derived from its raw blob | TR-11, TR-14 [gap] |
| Origin changes (domain move) | Signed out, history gone | R9; accepted for the MVP |

## 7. Dependencies

M1 depends on no other module. It depends on IdleOn Toolbox (pinned fork), the game's Firebase project and Google OAuth client, and Firebase JS SDK ≥ 12.

What other modules get from M1:

| Module | Uses | Interface |
|---|---|---|
| M2 Stage & Meta Path | worlds, classes, levels, later Meta Path milestone fields | `AccountState`, TR-11 growth process |
| M3 AFK Safety | AFK Target, map, food, timers; usual gap for the Expected Return default; `isKnown` for Unknown Verdicts | `AccountState`, `SaveHistory.usualGapSeconds`, `diagnostics` |
| M4 Purpose & Milestones | kill counts and progress fields (added via TR-11); progress since the Play Session started | `AccountState`, `SaveHistory.sessionStart` |
| M5 Higher-leverage options | Toolbox's damage math on hypothetical copies of a character | worker `what-if` message (TR-4) |
| M6 Unspent & idle, M7 Spend Plan, M8 Collections, M9 Builds | their System fields (added via TR-11) | `AccountState` |
| M10 Now screen UI | sign-in states, save states, freshness, active character, offline, patch banner, "since last time", done detection inputs | `useActiveOn()` state (`AuthState`, `SaveState`, `lastGood`), `activeCharacterIndex`, `SaveHistory.previous` |
| M11 Knowledge tooling | fixtures and `accountStateOf(fixture, now)` for "fires on save X" tests; `FIELD_SOURCES` for provenance | `packages/account-state/test/helpers.ts` (to be exported as a test util) |
| M12 Release | `pnpm sync-parsers`, contract tests, `VITE_*` config, CSP headers | scripts and docs in `packages/toolbox-parsers`, `docs/setup/` |
| M13 Suggestions | safe context to attach | `reportContext(state)` (TR-22) |

## 8. Open decisions for Yasser

❓ D1 - Joseph's scrubbed save in the public repo: #14 already approved a scrubbed copy of Yasser's W2 save for CI. Should a scrubbed copy of Joseph's W3 save also be committed (public repo, GPL), or should it stay local-only so CI covers only W2 plus Toolbox's W4–W7 saves?
➡️ Commit both scrubbed copies, but only after Joseph says yes. CI otherwise has no W3 account at all, and W3 is where most MVP advice lands (Construction, Worship, Trapping). The scrubber removes names, uid, guild, companion and tournament data, and a test checks that no name survives. What stays is game progress, which is not personal, but it is his account, so it is his call.

❓ D2 - Pasted saves in history: when a player pastes a save (because Lava rotated its login, say), should that Account State be stored in history like a live one, or never stored?
➡️ Never store pastes in the MVP. A paste can be any account (a friend's, Toolbox's demo), so storing it would mix accounts and break done detection and the usual-gap number for the signed-in player. Both MVP users sign in. If a long login outage ever forces days of paste-only use, revisit with "store pastes whose save matches the last live account".

❓ D3 - How loud is a game update? When the game's build is newer than any this parser pin has read cleanly, should ActiveOn (a) always show a banner, (b) show a banner only when that save also has failed sections or fails outright, and otherwise a quiet footer note, or (c) say nothing unless the parse fails?
➡️ (b). The game patches every 1–2 weeks and Toolbox usually keeps up within days, so an always-on banner would be noise most of the time and teach both of you to ignore it. A failed section on a new build is the real signal that advice may be wrong, and it is exactly when the banner earns its place. Note that the save's build (`GameVERSION`, 142 today) and the parser's game version (2.3.540) are different numbering schemes and can't be compared directly; that's why the rule is "newer than any build this pin parsed cleanly", tracked in history.

❓ D4 - Sign-out and history: should signing out also delete that account's history on this browser, or keep it until "Clear my data"?
➡️ Keep it, and offer a "Also clear my data on this browser" checkbox on the sign-out confirmation, unchecked by default. Sign-out is often just a fix-it step (the wrong Google account, a stuck session), and wiping 30 days of history then would quietly reset the usual-gap default and "since last time". Each of you uses your own browser, so a shared computer isn't the MVP case. Clear my data stays one tap away.

## 9. Red-team notes

**R1. Advice from a half-read save.** A parser section fails after a patch (say obols), the rest parses, and a Detector reads `0` from the missing system and tells the player to go do something they've already done. *Defence:* failed sections and failed side reads are structured in `diagnostics` (FR-16, FR-17); the adapter returns `null` for missing fields, never a default (TR-11); `FIELD_SECTIONS` + `isKnown()` make every dependent Detector return Unknown. A golden test with one section forced to fail must produce Unknown, not a Next Action.

**R2. Silent total failure.** Toolbox swallows its own errors and returns an empty account, so a broken patch could render an empty roster that looks like "nothing to do". *Defence:* empty account or zero characters is a hard `EmptyAccountError` (FR-15, built and tested with a real save stripped of `Lv0_*` and `EquipOrder_*`). The UI never renders rows from a failed parse.

**R3. Stale screen mistaken for live.** The game only saves every ~4 minutes, or not at all when it's closed; the player acts on a picture that's 20 minutes old. *Defence:* the save age is always visible and ticks (FR-26); hints after 4 minutes and at open (FR-27); offline state (FR-28). Done detection (engine) only fires from a save newer than when the Next Action was shown, so an old save can't mark things done.

**R4. The wrong character's row opens.** In a burst of character switching, several characters have recent save times; picking "the newest" could pick one the player has already left. *Defence:* the 30 s / 1 s confidence bound (TR-12), null when unsure, and the next save (switching triggers one) corrects it. Checked against both real fixtures: Joseph's burst left the others 23–130 s behind.

**R5. Privacy leak through the public repo or a bug report.** The repo is public; a real save, character name or uid slips into a fixture, snapshot, test log, Suggestion or DevTools screenshot. *Defence:* real saves only in gitignored `fixtures/private/`; snapshots drop names [built]; the scrubber's own test fails if any source name survives (TR-17); tests never print private values; `reportContext` allow-lists what M13 may send (TR-22); console output is truncated (TR-23); D1 asks Joseph before his scrubbed save goes public.

**R6. Lava breaks the login for everyone.** Sign-in rides on Lava's Google client ID and secret and its Firebase key; a rotation or an App Check rollout breaks every community tool at once. *Defence:* the paste fallback needs no login and runs the same parser (FR-20); the sign-in error offers it; config is build-time `VITE_*`, so a fix is a variable change and a redeploy, not code (M12). Nothing we build depends on an endpoint Toolbox doesn't also depend on.

**R7. Being a bad guest on Lava's Firebase.** Many open tabs, retry storms after an outage, or extra polling could look like abuse and get the project's usage throttled. *Defence:* no polling, one listener per tab, at most 7 side reads per save (TR-9), the same as Toolbox; backoff capped at one try every 2 minutes (FR-12); the burst coalescing in TR-5 limits worker load but not reads, which is accepted because each read corresponds to a real save.

**R8. History that grows, mixes or lies.** 30 days of 4-minute saves bloats IndexedDB; two accounts on one browser mix; a pasted friend's save poisons done detection; a schema bump makes old records unreadable. *Defence:* raw envelopes kept only on ~1 record per Play Session, gzipped, with a 50 MB budget and quota check (TR-16); keys include `uid` (FR-22); pastes are never stored (D2); `schemaVersion` on each record, missing fields read as unknown, newest record re-derivable from its raw blob (TR-11, TR-14). The usual-gap number needs at least 3 Play Sessions before it replaces the 8 h default.

**R9. Moving the domain wipes everyone.** Firebase sessions and IndexedDB history live per origin; moving from `*.workers.dev` to a Forge domain signs both users out and drops their history. *Defence:* accepted for the MVP (two users, one sign-in each, history rebuilds in days). The map already says to decide the domain before public alpha; this spec adds that the decision should also pick paths over subdomains if Mods are to share one sign-in.

**R10. A parse that never ends, or a page that freezes.** The 6 MB parser bundle patches built-in prototypes and can hang or throw outside a request; on the UI thread it would freeze the page. *Defence:* parsing only in the worker, and a CI check that the main chunk never contains the parser runtime (TR-1); a 15 s timeout with worker recreation (TR-5); performance budgets measured in the production build (TR-19).

**R11. "It worked once on Yasser's machine."** Only one real Google sign-in has been done, on one browser. Session restore after a full restart, Joseph's sign-in on his own machine and real save latency are unverified. *Defence:* TR-20 makes all four live checks part of M1's definition of done, recorded in the PR as timings only.
