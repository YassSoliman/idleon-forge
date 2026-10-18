# M22 Truth checks

Infra. Invariants checked on every parse against the save itself, and a local truth run that diffs
the rendered app against a real save. Owner request 2026-10-18. Terms: **Truth check**, **Truth run**
([`GLOSSARY.md`](../../GLOSSARY.md)).

## 1. Purpose

On production the Build view told the owner his Hunter (slot 6) had "No points waiting in tab 1;
next: Idle Shooting (to 100)". He had about 70 unspent points there, and Idle Shooting was already at
100. Our QA compared the app with our own parse, so a misread passed every check. M22 finds bugs of
this kind proactively, on every player's save, and on the owner's real current save on demand.

## 2. Scope

In:
- **Layer 1**, in the parse worker, every parse, every player: independent raw readers, a facts table,
  a registry of contradiction rules, suppression of only the advice a violation touches, a local report,
  and a `?debug=truth` hook.
- **Layer 2**, local and dev-only: a read-only capture of the signed-in player's envelope, a runner
  (headless checks + Playwright on `wrangler dev`) that diffs the DOM against the raw save, and the
  procedure in [`docs/agents/truth-run.md`](../agents/truth-run.md).

Out: fixing the bugs it finds (each gets its own fix; the Build one is on `fix/build-points`); exact
unspent counts on screen (still M9's lower bounds, FR-10); any network call; any write to Firebase.

## 3. Functional requirements

- **FR-1 Raw readers.** `packages/truth/src/raw/read.ts` reads, from the envelope's own keys only:
  per character, class (`CharacterClass_<i>` → `ja.ClassNames`), class level (`Lv0_<i>[0]`), the preset
  in use (`PlayerStuff_<i>[1]`), both presets' talent levels (`SL_<i>` = live, `SLpre_<i>` = the other,
  per the game's save loader), each tab's 15 talents (`ja.TalentOrder`, tabs from `ReturnClasses`),
  points spent per tab and on star talents (615–679), max levels (`SM_<i>`), coins (`Money_<i>`), bag
  counts (`InventoryOrder_<i>` + `ItemQTY_<i>`); account-wide the bank (`MoneyBANK`) and the chest
  (`ChestOrder` + `ChestQuantity`, first 25 slots compared). Layouts come from the game client N.js
  (`game-data.ts` cites each table and function by offset), never from Toolbox's mapping.
- **FR-1a Points left, as a floor.** Per preset and tab, and the star tab: the game's own
  `_customBlock_TotalTalentPoints` with only the terms the save holds directly (class level, the nine
  first skill levels, `CYTalentPoints`, achievements via `AchieveStatus`). Every term left out is a
  bonus, never a cost, so the true value is at least ours. It is a check, never advice: it is never
  shown as a number (ADR 0005 stands for advice).
- **FR-2 Rules**, one file each in `packages/truth/src/rules/`, listed in `index.ts`:
  - `raw-matches-state`: every raw fact equals the Account State's.
  - `same-fact-everywhere`: one fact key, one value on every surface (the Build view's level, tab spend,
    talent rows and path; the character header; the Spend Plan's wallets).
  - `star-total-floor`: the Account State's star point total is never below the game's floor.
  - `next-not-at-target`: a Build next step never takes a talent to a level the save already has; a tab's
    first step starts from the save's level; a Build path step (M21 FR-C1) shown done is done in the
    save, and one still to do is not at its goal yet; M9's "Next talent points" Goal likewise (only when
    the talent is at target on every preset, so no false alarm).
  - `no-points-vs-unspent`: "No points waiting" never coexists with points left in that tab, by the raw
    floor or by the engine's own lower bound (10 or more points P1, fewer P2; held back). Since #120 the
    Build says "No unspent points known here" when its lower bound is 0; that claims nothing false, so
    when the raw floor proves points are there it is reported as P2 with `hold: false` and left on screen.
  - `affordable-within-wallet`: a `buy` line never costs more than its payer carries (`move-coins` may add
    the bank); a payer's buy-now lines never add up to more than it can pay; transfers never exceed the bank.
- **FR-3 On a violation**: only the touched items become "Can’t be sure of this one right now" (Build
  next-points lines, the overview's "next: X", a talent row's note, talent Goals and their per-character
  details, Spend Plan lines). Replaced in the worker, on a copy of the result, so every view agrees and
  the main thread carries no truth code. The report (violations, what was held back, timing) goes back
  with every parse; the facts table and raw facts only when the page asks (`truthDetail`). Never sent
  anywhere.
- **FR-4 Hook**: with `?debug=truth`, `window.__activeonTruth` gives `report()`, `violations()`,
  `facts()`, `log()`, `envelope()`, `saveEnvelope()`, plus a "Save my envelope locally" button. A lazy
  chunk; without the flag the main thread runs one regex per page load.
- **FR-5 Capture**: `saveEnvelope()` downloads the envelope the page already read as
  `live-<date>.raw.json`, for `fixtures/private/` (gitignored). Read-only: no Firebase call, no game call.
- **FR-6 Runner** `scripts/truth/run.mjs`: headless (Vitest over the real worker), then Playwright on
  `wrangler dev` (production headers): paste the time-shifted save, open every character's Build, Gear
  and Cards tabs, read points spent per tab, talent levels, next-points lines, "points unspent", class
  level; diff against the raw facts; write markdown and JSON. Class and slot only.

## 4. User stories (each is a test)

- **US-1** Given a save whose tab has points left / When the Build says "No points waiting" there / Then
  the rule fires and only that line reads "Can’t be sure…" (`rules.test.ts`, `truth.test.ts`).
- **US-2** Given a Build line "to 54" / When the save already has the talent at 54 / Then it fires (the
  Idle Shooting case) (`rules.test.ts`).
- **US-3** Given a deliberately corrupted Account State (wrong preset points) / When the worker checks it /
  Then `raw-matches-state` fires on that preset and tab, and only that character's items are held back
  (`rules.test.ts`, `truth.test.ts` on the scrubbed W2 save).
- **US-4** Given any public or scrubbed save / When parsed / Then the raw readers agree with the Account
  State on every fact (`truth.test.ts`, 11 saves).
- **US-5** Given `?debug=truth` / When a save is read / Then the hook returns the report, the facts and the
  envelope, and the download never calls the network (`truth-hook.test.ts`).
- **US-6** Given a cost above the payer's coins on a `buy` line / Then it fires and that line is held back.

## 5. Technical requirements

- **TR-1** `@idleon-forge/truth` (workspace package, no external dependency). The worker imports it; the
  page only `import type`s `@idleon-forge/truth/types`.
- **TR-2** `checkTruth({ envelope, state, result })` never throws; a failure is `report.error` and holds
  nothing back. About 5–8 ms per parse on the largest public save.
- **TR-3** Budget: first load 316.6 KB gzip after (316.5 before); the code is in the worker chunk.
- **TR-4** After a patch, `node packages/truth/scripts/extract-n.mjs <N.js>` exits 1 if the copied tables moved.

## 6. Self red-team

| # | Risk | Verdict |
|---|---|---|
| 1 | The floor is our port of a game formula (ADR 0005). | Kept: it is never shown, only used to doubt a line; it is a lower bound by construction (only additive terms dropped). A patch that adds a subtracted term would break it: the extract script and every truth run would show it as new violations on active, fully spent presets. |
| 2 | Independence is partial: the raw readers and Toolbox read the same keys. | Accepted: the mapping is independent (N.js, not Toolbox); a key both misread is Layer 2's job (DOM vs raw) and the live captures'. |
| 3 | Over-suppression: 1 unspent point hides a useful pointer. | Narrowed: only a false claim is held back; a hedged line is reported, not held (`hold: false`). Q1 asks what to show instead. |
| 4 | The rules read Build lines by text ("No points waiting", "(to N)"); a copy change silently disables them. | Fixed in part: tests pin detection on synthetic lines. Cross-area request: `talentId` and `to` on `BuildNextPoint` (result.ts is frozen). |
| 5 | The Build hotfix (#120) changes the lines. | Happened mid-build: "No points waiting" became "No unspent points known here" for a 0 lower bound. Tests are invariants ("no contradicted line survives"), not today's count, so they held; the rule now also reports the hedged line. |
| 6 | Privacy: the report holds coins and item counts; the hook holds the envelope with names. | Device-only, never sent; facts and envelope only under `?debug=truth`; the download is user-initiated; the file goes to the gitignored `fixtures/private/`; runner output is class and slot only. |
| 7 | Cost on every parse. | ~5–8 ms and one `structuredClone` only when something is held back; the facts table crosses the worker boundary only on request. |
| 8 | The engine re-run (Expected Return change) skipped the checks. | Fixed: the handler keeps the last envelope and state and checks every re-run too. |
| 9 | Gear, Cards and Alchemy numbers have no raw reader yet. | Deferred: the runner opens those tabs and checks level and render only. New readers are one file each. |

## 7. Needs Yasser

- **Q1** Where the save proves points are waiting but M9's lower bound is 0, the Build now says "No
  unspent points known here". Show the floor instead ("At least 50 points waiting in tab 3, from your
  save")? It would be the first use of a ported game formula in advice (ADR 0005), so it needs a ruling.

## 8. First truth run (2026-10-18)

Run on the scrubbed W2-late and W3-early saves (`fixtures/scrubbed/`) and, locally, on the private saves
they were made from. The raw readers agree with the Account State on every fact. On `main` before #120,
`no-points-vs-unspent` fired 5 times, all on a tab 3 "No points waiting" line where both presets spend
the same in tab 3, so M9's lower bound is 0 while the save has points left (one tab has 50); the runner,
on the same build with the rules switched off, found the same 5 lines on the page, so Layer 2 confirms
Layer 1. After #120 the same 5 lines read "No unspent points known here" and are reported as P2. The
Hunter case can't reproduce on these files (neither has a Hunter); it needs a live capture
([truth-run.md](../agents/truth-run.md)).

## Sources

- Game client N.js, https://www.legendsofidleon.com/ytGl5oc/N.js (Last-Modified 2026-10-17, read
  2026-10-18, server build 142): `ja.ClassNames`, `ja.TalentOrder`, `_customBlock_TotalTalentPoints`,
  `_customBlock_ReturnClasses`, `_customBlock_AchieveStatus`, the save loader (`SL_`, `SLpre_`, `CY*`).
  Offsets in `packages/truth/src/game-data.ts`.
- M9 spec TR-7 (lower bounds), M21 TR-3 (star totals).
