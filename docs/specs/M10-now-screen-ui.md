# M10 Now screen UI

Spec for [#38](https://github.com/YassSoliman/idleon-forge/issues/38). Status: **draft**, waiting on grilling and a red-team pass.

Grounded in:
- [#10 How the Now screen behaves](https://github.com/YassSoliman/idleon-forge/issues/10): the 16 decisions.
- [#12 Rough Now screen on fake data](https://github.com/YassSoliman/idleon-forge/issues/12): the A + B + C blend, Purpose, Higher-leverage option, Spend Plan.
- [#11 Knowledge Base shape](https://github.com/YassSoliman/idleon-forge/issues/11): Stale, Contested, Knowledge Base version, "Not covered yet", the Report this payload.
- [#14 Architecture](https://github.com/YassSoliman/idleon-forge/issues/14): the pure engine, the Web Worker, IndexedDB, patch awareness, "What's new".
- [#13 MVP cut](https://github.com/YassSoliman/idleon-forge/issues/13) and [ADR 0008](../adr/0008-worker-for-suggestions.md): the M13 Suggestion entry point.
- The prototype (`origin/prototype/now-screen`) and the slice-1 code (PR #28).

Terms are from [`GLOSSARY.md`](../../GLOSSARY.md) and used exactly: Verdict, Purpose, Milestone, Leverage, Spend Plan, Visit Order, AFK Target, Parallel Slot, Expected Return, Stale, Contested, Next Action, Goal, Active Play suggestion, Suggestion, Stage.

---

## 1. Purpose

The Now screen is the only thing a player looks at during a Play Session. It sits in a narrow window beside the game. At a glance it answers three questions: which characters are safe to leave for the coming AFK Stretch, which character to switch to next, and the one thing to do on that character right now, with a Source the player can check. M10 is the presentation layer only. It turns the engine's deterministic output into the Roster (one numbered row per character in Visit Order), a progress bar ("3 of 5 Ready", or "safe to log off"), and a Focus card for the character being played. It also owns the states around the advice (loading, can't read save, all set, game updated) and the small player controls (Expected Return, Skip today, Not for me, Report this, Suggest). It never decides what the advice is. That is the engine's job (M2–M9).

## 2. Scope / Out of scope

### In scope
- The screen shell: header (wordmark, cloud-save age, Expected Return chips), progress bar, banners, footer (versions, credits, Suggest, clear my data).
- **Roster** (variant A): one row per character, numbered in Visit Order, with a Verdict pill and one summary line.
- **Focus** (variant C), opened by tapping a row: Verdict with its reasons, Purpose with Milestones, up to 3 Goals with one Next Action each, the Higher-leverage line, Active Play suggestions, done this session, and "Next: switch to X →".
- **Account section:** up to 5 account Goals, the Spend Plan, "If you have time", and "Not covered yet".
- Source labels (links that open in a new tab), Stale and Contested badges.
- Player controls: Expected Return, Skip today, Not for me, Report this, the Suggestion entry point (opening M13's form), "show more".
- Freshness: "last cloud save Ns ago", the switch-character hint, a new-items count in the tab title, and the "game updated, parser not caught up" banner.
- "What's new since your last visit" (once per new version), and the Knowledge Base version in the footer.
- All screen states, accessibility (WCAG 2.2 AA), and responsive behaviour from 320 to 480 px of column.
- The **view-model contract** (`EngineResult` → `buildNowView` → `NowView`), plus a plain-text renderer used for the golden Now-screen snapshots.

### Out of scope
- Computing any advice: Verdicts (M3), Purpose and Milestones (M4), Higher-leverage options (M5), unspent and idle (M6), the Spend Plan (M7), Collections (M8), Builds (M9), Stage (M2). M10 renders their output and defines the shape it must take.
- Sign-in, the save listener, parsing, save history storage (M1). M10 consumes `SaveState` and `AccountState` as slice 1 already exposes them.
- The Suggestion form, its Worker and "Your suggestions" list (M13). M10 only provides the entry points and the context object.
- Generating the changelog and the Knowledge Base version string (M12, M11). M10 reads them.
- The pop-out overlay (Document Picture-in-Picture or the Steam overlay browser), the "Ask why" chat, notifications, analytics, other accounts, a mobile-first layout, and the in-game menu route ("Upgrade Vault: buy X, then Alchemy: …"). The layout must not prevent a later pop-out (TR-14).
- A manual Purpose override. Dropped in #12; wrong inferences go through Report this.

## 3. Functional requirements

**Layout**
- **FR-1** The screen is one centered column, at most 480 px wide (`--column`), at every viewport width. Nothing lays out in two columns.
- **FR-2** From top to bottom: header, banners (at most one of each kind, in the order of TR-11), progress bar, "What's new" card (when due), Roster or Focus, Account section, "If you have time", "Not covered yet", footer.
- **FR-3** The header shows the ActiveOn wordmark, a "last cloud save Ns ago" chip (marked "pasted" for pasted saves), and the Expected Return chips.

**Roster (A)**
- **FR-4** The Roster is an ordered list with one row per character, in the engine's Visit Order. Each row shows: its Visit Order number; the character's name, class and level; its AFK Target and map ("Mining Copper · Tunnels Entrance"); a "● playing" marker on the character currently being played; a Verdict pill; and one summary line.
- **FR-5** The summary line is, in priority order: the first Verdict blocker ("Food runs out in about 2h"); for Unknown, the reason ("What is this character for?" or "Can't tell from the save"); otherwise the top Next Action; otherwise "Nothing to do here".
- **FR-6** Tapping or activating a row opens that character in Focus.

**Verdict**
- **FR-7** The Verdict pill reads exactly "Ready", "Fix before you leave" or "Unknown". It is always shown as text, never as colour alone.
- **FR-8** The Verdict reflects only AFK safety against the current Expected Return plus whether the character serves a worthwhile Purpose (glossary). Unspent things never change it. M10 never computes it; it renders `verdict` from the engine as is, apart from the skip rule in D2.

**Progress bar (B)**
- **FR-9** Above the Roster, a segmented bar with one segment per character, in Visit Order and coloured by Verdict, plus a label: "N of M Ready", with "fix K before you leave" on the right. When the condition in FR-25 holds, the label becomes "safe to log off".

**Focus (C)**
- **FR-10** Focus shows one large card for one character:
  - a Verdict strip (one dot per character in Visit Order) for jumping between characters;
  - "k of M in your Visit Order", plus "you are on this character" when it is the one being played;
  - name, class, level, activity and map;
  - the Verdict block with every blocker;
  - the **Purpose** list;
  - up to 3 Goals, each with exactly one Next Action, the first one highlighted;
  - "show more (n)";
  - the Higher-leverage line, if any;
  - that character's Active Play suggestions;
  - "Done this session (n)";
  - a "Next: switch to <name> →" button.
- **FR-11** The Purpose list shows each Goal the current activity advances, with its current value, its next Milestone and, when the engine provides one, an ETA ("13k Poop kills · next 100k · about 40h"). When the engine marks `stopHere`, it shows "consider stopping here". A character whose Verdict is Unknown for lack of Purpose shows "What is this character for?" and the engine's single suggestion.
- **FR-12** "Next: switch to <name> →" moves Focus to the next character in Visit Order that has anything to do (a Verdict other than Ready, or at least one visible Goal). On the last one, it reads "Last one: check the Account list ↓" and scrolls to the Account section. It never touches the game.
- **FR-13** "← All characters" (and the browser Back button) returns to the Roster and puts keyboard focus back on the row the player opened.
- **FR-14** Auto-open and follow: see D1. Recommended behaviour: on first load, and whenever a new save shows the player switched character, Focus opens on the character being played. A save that does not change the played character never moves the view.

**Goals and Next Actions**
- **FR-15** Every Next Action shows: a category tag and Goal title ("Spend · Talents"); the action text; "Why: …"; a Source label; and the controls Skip today, Not for me and Report this.
- **FR-16** At most 3 Goals per character and 5 for the account are shown, in engine rank order. The rest sit behind "show more (n)". Verdict blockers are never hidden behind "show more", even if there are more than 3.
- **FR-17** An account-wide task that needs a specific character appears on that character, never in the Account section (the engine places it; M10 must not move it).

**Sources, Stale, Contested**
- **FR-18** The Source label reads `<source label> · <game version>` (for example "wiki · 2.3.540"). It is a link that opens the highest-precedence Source (ADR 0004) in a new tab. If the entry has more Sources, a "+n" control in Focus lists them all, each as a link with its tier and date verified.
- **FR-19** A Stale entry's label adds "· Stale" and uses the muted style. It stays visible; the engine already ranks it below fresh entries.
- **FR-20** A Contested entry carries a "sources disagree" badge and an expander that shows both sides, each with its own Sources. It is never shown as a Verdict blocker or as the first Goal (the engine guarantees this; M10 asserts it in a dev-mode check, TR-9).

**Higher-leverage option and Spend Plan**
- **FR-21** When the engine provides one, Focus shows a single Higher-leverage line ("Better fit: <other character> suits this XP and hits the same 100k Goal"), with its why, Source, Not for me and Report this. When the option names another character, tapping that name opens its Focus.
- **FR-22** The Spend Plan appears in the Account section as one Goal ("Spend coins"), whose Next Action is the first purchase. Expanding it shows the full ordered list. Each line shows the item, its cost, the running total, and an "affordable" or "short by X" mark checked against the coins in the save. It closes with "N of M affordable now".

**Account, Active Play, gaps**
- **FR-23** The Account section is headed "Account · any character" and lists account Goals under FR-15/16.
- **FR-24** "If you have time" lists the Active Play suggestions with their time estimate ("about 1h of hands-on play") and the character they apply to, if any. They never affect a Verdict or the progress bar.
- **FR-25** **All set:** when no character's Verdict is "Fix before you leave" (whether Unknown also blocks is D4), a banner says "All set: safe to log off", followed by when the first thing fills up or runs out ("First thing fills up in about 9h: <name>'s inventory"), or "Nothing fills up before you're back" when the engine reports nothing.
- **FR-26** "Not covered yet: <System>, <System>…" lists the Systems unlocked on the account that have no active Knowledge Base entries. It is one collapsed line at the end of the Account section, and expands to the full list.

**Controls**
- **FR-27** **Expected Return:** chips "2h 4h 8h 12h 24h", preceded by "Back in about". The default is the engine's learned value when save history exists, shown as its own chip if it isn't one of these (for example "≈6h"), otherwise 8h. Picking one re-runs the engine and updates every Verdict within the budget in TR-12. The choice holds for the current Play Session (TR-8).
- **FR-28** **Skip today** hides that Goal (and its Next Action) on that character until the skip expires (D3). The next-ranked Goal moves up into view. A "n skipped · undo" link at the end of the list brings it back.
- **FR-29** **Not for me** hides that Goal on that character until the game version changes (the next patch). It is listed under "Hidden until next patch (n) · undo" in Focus.
- **FR-30** **Report this** on any Next Action, Purpose line, Higher-leverage line or Spend Plan line: before M13 ships, it opens a pre-filled GitHub `kb-correction` issue in a new tab; after M13, it opens M13's Suggestion form with type "Something's wrong". Either way it attaches only the payload in TR-10 and says "This will be posted publicly on GitHub".
- **FR-31** **Suggestion entry point (M13):** a "Suggest" link in the footer opens M13's form with type Idea. Focus has a "Something confusing here?" link that opens it with type Confusing. Both pass a `SuggestionContext` (TR-10). While signed out, or in paste mode, they fall back to the GitHub `idea` issue form.

**Freshness and done**
- **FR-32** The cloud-save chip updates every second. After 240 s with no new save in live mode, it switches to the warning style and shows "No new save for a while: switch character in the game to refresh". (This exists in slice 1 and is kept.)
- **FR-33** A Next Action disappears when a later save confirms it is done. It then appears under "Done this session (n)" on its character, or in the Account section, struck through, with the time it was confirmed.
- **FR-34** While the tab is hidden, the document title becomes "(n) ActiveOn", where n is the number of Next Actions that have appeared since the tab was last visible. It resets to "ActiveOn" when the tab becomes visible. There is no sound and no pop-up.

**Patch and versions**
- **FR-35** When the save's game version is newer than the parser pin's target, a banner shows: "The game updated (2.3.541). ActiveOn's save reader hasn't caught up yet; advice may be off." Advice is still shown, since the parse succeeded.
- **FR-36** The footer shows the ActiveOn version, `knowledge <version>`, the game version from the save, and the parser target, plus the existing credits and the "Read-only" note.
- **FR-37** **What's new:** when the app version or the Knowledge Base version differs from the one last seen in this browser, a card shows "What's new since your last visit", in two lists: "ActiveOn" (app changes) and "Advice" (Knowledge Base changes). It shows once and is dismissed with "Got it". On the very first visit, nothing is shown and the current versions are recorded.

**Errors and data**
- **FR-38** **Can't read your save:** on any parse failure (input, empty, shape or crash) or a sync error, the screen shows "Can't read your save right now", the time of the last good save, and the raw-JSON paste box. No Roster, Focus, Account section or progress bar is rendered: advice is never shown from a broken parse.
- **FR-39** **Can't work out advice:** if the engine throws as a whole, the screen shows "Can't work out advice right now", the Roster with names and activities only (no Verdicts), and a Report this button that sends versions and the error class. If only some Detectors fail, the affected characters show Unknown ("Can't tell from the save") and the rest render normally.
- **FR-40** "Clear my data" in the footer opens a confirmation, then deletes save history (via M1), every M10 preference (TR-8), and signs out.

## 4. User stories

Fixtures. **Real saves:** the 11 Toolbox public saves in `packages/account-state/fixtures/public/` (CI), the scrubbed W2 save (CI), and `fixtures/private/*` (local only). **View fixtures:** hand-written `EngineResult` JSON files in `packages/engine/test/now/fixtures/` (`mid-session`, `all-set`, `contested`, `stale`, `no-purpose`, `blocker-overflow`, `spend-plan`, `higher-leverage-character`, `detector-failure`, `not-covered`). These are synthetic, contain no real names, and let M10 be tested before M3–M9 exist. Every "Then" below is asserted on `NowView` and/or the plain-text snapshot (TR-15), and on the rendered DOM where it says "screen".

**US-1 See who is safe to leave.**
As a player in a Play Session, I want one row per character with a clear Verdict, so that I know at a glance who still needs me.
- Given view fixture `mid-session` (5 characters: 1 Fix, 1 Unknown, 3 Ready) / When the Now screen renders / Then the Roster shows 5 rows numbered 1–5, row 1 shows "Fix before you leave" with its blocker as the summary line, row 2 shows "Unknown", and rows 3–5 show "Ready".
- Given the same fixture / When a screen reader reaches row 1 / Then its accessible name contains the number, name, class, level, activity, map, the Verdict text and the summary line.

**US-2 Know where to go next.**
As a player in a Play Session, I want the characters numbered in Visit Order with a "Next" button, so that I don't have to plan the order myself.
- Given `mid-session` with `visitOrder = [3,0,4,1,2]` / When the screen renders / Then row 1 is character index 3 and row 5 is index 2; M10 doesn't re-sort.
- Given Focus is open on Visit Order position 2 and position 3 is Ready with no visible Goals / When the player presses "Next: switch to …" / Then Focus opens position 4.
- Given Focus is on the last character with anything to do / When the screen renders / Then the button reads "Last one: check the Account list ↓".

**US-3 Focus on the character I'm playing.**
As a player in a Play Session, I want the screen to follow me when I switch character in the game, so that what I see matches where I am.
- Given the Roster is showing, and the latest save has character 2 being played / When a new save arrives in which character 4 is being played / Then Focus opens on character 4 (per D1) and "you are on this character" shows.
- Given Focus is open on character 1 (opened by hand) and character 2 is being played / When a new save arrives in which character 2 is still being played / Then Focus stays on character 1.

**US-4 Understand what a character is for.**
As a player in a Play Session, I want each character to show the Goals its current activity serves and the next Milestone, so that I trust a Ready Verdict and know when to stop.
- Given `mid-session`, where character 0 has the Purpose "Poop kills: 13,204 / next Milestone 100,000 / ETA 40h" plus "Fighting XP: too low for your level" / When Focus opens on character 0 / Then the Purpose list shows two lines: "13k Poop kills · next 100k · about 40h" and the XP line.
- Given `no-purpose` / When Focus opens on that character / Then the Verdict reads "Unknown: What is this character for?", followed by exactly one suggestion with a Source.
- Given a Purpose Goal with `stopHere: true` / When Focus opens / Then that line shows "consider stopping here".

**US-5 Do one thing at a time.**
As a player in a Play Session, I want at most 3 Goals per character, each with one Next Action, so that I'm never buried in a list.
- Given a character with 6 non-blocker Goals / When Focus opens / Then 3 Goals show, plus "show more (3)"; and after activating it, 6 show.
- Given `blocker-overflow` (4 blockers and 2 other Goals) / When Focus opens / Then all 4 blockers show, and "show more (2)".
- Given an account with 8 account Goals / When the screen renders / Then the Account section shows 5, plus "show more (3)".

**US-6 Check the Source.**
As a player in a Play Session, I want every Next Action to link to its Source, so that I can verify it in one click.
- Given a Next Action with Sources [wiki (tier 2, 2.3.540), guide (tier 3, 2.3.531)] / When the screen renders / Then the label reads "wiki · 2.3.540", its link has `target="_blank"` and `rel="noopener noreferrer"` and points to the wiki URL, and in Focus "+1" lists the guide as well.
- Given `stale` / When the screen renders / Then that label ends with "· Stale" in the muted style.
- Given a Source whose URL isn't `https:` / When the screen renders / Then the label shows as plain text with no link (TR-13).

**US-7 See when sources disagree.**
As a player in a Play Session, I want Contested advice marked and both sides shown, so that I can make the call myself.
- Given `contested` / When Focus opens / Then the entry shows a "sources disagree" badge, is not the first Goal, and its expander lists both sides with their own Source links.

**US-8 Tell the screen how long I'll be away.**
As a player in a Play Session, I want to tap how long I'll be away, so that the Verdicts judge what will fill up or run out in that time.
- Given no save history / When the screen first renders / Then the "8h" chip is pressed.
- Given the engine reports a learned Expected Return of 6h / When the screen renders / Then a "≈6h" chip is shown and pressed.
- Given the scrubbed W2 save where food runs out in 5h / When the player taps "8h" / Then within 300 ms that character turns "Fix before you leave"; and when they tap "4h", it turns back.

**US-9 Know when I'm done.**
As a player in a Play Session, I want a clear "safe to log off" message, so that I can stop without second-guessing.
- Given `all-set` with `firstFill = {label: "<name>'s inventory", at: now + 9h}` / When the screen renders / Then the banner reads "All set: safe to log off" and "First thing fills up in about 9h: <name>'s inventory", and the progress label reads "safe to log off".
- Given one character turns Fix in the next save / When the screen re-renders / Then the banner disappears and the label reads "4 of 5 Ready · fix 1 before you leave".

**US-10 See my progress confirmed.**
As a player in a Play Session, I want Next Actions to tick off by themselves when the game saves, so that I don't have to tick anything.
- Given a save with Next Action K visible on character 1 / When a later save arrives and the engine lists K in `doneThisSession` / Then K is gone from the Goals and appears under "Done this session (1)", struck through.

**US-11 Dismiss what doesn't apply.**
As a player in a Play Session, I want to skip or hide a Next Action, so that the list stays relevant.
- Given Goal G is visible on character 2 / When the player presses Skip today / Then G is hidden, the next Goal moves into view, "1 skipped · undo" appears, and a second open tab hides G within 1 s.
- Given G is hidden with Not for me at game version 2.3.540 / When a save with version 2.3.541 arrives / Then G is visible again.

**US-12 Report wrong advice.**
As a player in a Play Session, I want to report a wrong Next Action in two taps, so that it gets fixed for everyone.
- Given a Next Action from entry `stamps.cheapest-damage` on a Squire level 43, with Stage `W2-mid` / When the player presses Report this (pre-M13) / Then a new tab opens on `github.com/YassSoliman/idleon-forge/issues/new?template=kb-correction.yml&…`, and its body contains the entry id, Knowledge Base version, game version, Stage, "Squire", "43" and the action text, but no character name and no save data.

**US-13 Suggest something.**
As a player in a Play Session, I want a Suggest button always at hand, so that I can send an idea without leaving the game.
- Given a signed-in player in Focus on a Squire level 43 / When they press "Something confusing here?" / Then M13's form opens with type Confusing and context `{screen:'focus', className:'Squire', level:43, stage, versions}`, and no name.
- Given paste mode / When they press Suggest / Then the GitHub `idea` issue form opens in a new tab instead.

**US-14 Never get advice from a broken save.**
As a player in a Play Session, I want a clear error when ActiveOn can't read my save, so that I never act on wrong advice.
- Given a save that parses to an empty account / When the engine would run / Then the screen shows "Can't read your save right now", the last good save time and the paste box, and no Verdict pill exists in the DOM.

**US-15 Know when the game patched.**
As a player in a Play Session, I want to be told when the game is newer than ActiveOn's reader, so that I can weigh the advice.
- Given a save with game version 2.3.541 and a parser target of 2.3.540 / When the screen renders / Then the "game updated" banner shows, and the advice still renders.

**US-16 Learn what changed.**
As a player in a Play Session, I want a short "What's new" after an update, so that I know which advice changed.
- Given the last seen version is `knowledge 2026.10.17` and the current one is `knowledge 2026.10.24` / When the screen renders / Then the "What's new" card shows the Advice items between those versions, once; after "Got it", a reload doesn't show it again.
- Given a first-ever visit / When the screen renders / Then no "What's new" card shows.

**US-17 See what isn't covered.**
As a player in a Play Session, I want to know which Systems ActiveOn doesn't cover yet, so that I know where I'm on my own.
- Given `not-covered` lists Construction and Worship / When the screen renders / Then the Account section ends with "Not covered yet: Construction, Worship".

**US-18 Spend my coins in the right order.**
As a player in a Play Session, I want an ordered list of what to buy with my coins, so that I spend them well in one go.
- Given `spend-plan` with 4 items, the first 2 affordable / When the player expands "Spend coins" / Then the 4 lines show in order with their costs and running totals, lines 1–2 are marked affordable, lines 3–4 show "short by …", and the footer reads "2 of 4 affordable now".

**US-19 See a better option.**
As a player in a Play Session, I want to be told when another activity or character clearly does this job better, so that I don't waste an AFK Stretch.
- Given `higher-leverage-character`, where character 4 is the better fit for character 1's Goal / When Focus opens on character 1 / Then one Higher-leverage line names character 4 with its why and Source, and tapping the name opens Focus on character 4.

## 5. Technical requirements

### TR-1 Package boundaries
| Where | What |
|---|---|
| `packages/engine/src/result.ts` | `EngineResult` and its parts (TR-2), the contract M2–M9 produce. Plain data only. |
| `packages/engine/src/now/build-now-view.ts` | `buildNowView(result, prefs, ui): NowView`, pure (TR-3). |
| `packages/engine/src/now/format.ts` | Number, duration and age formatting shared by the components and the text renderer ("13k", "about 9h"). |
| `packages/engine/src/now/render-text.ts` | `renderNowText(view): string`, the golden snapshot format (TR-15). |
| `apps/activeon/src/now/` | React components (TR-4), hooks, and the preference store (TR-8). |
| `apps/activeon/src/worker/` | The existing parse worker, extended to run the engine (TR-6). |

The UI thread imports only types from `toolbox-parsers` (as in slice 1), and imports `engine/now/*` at runtime (small, pure). The engine's Detectors run in the worker.

### TR-2 The engine output M10 consumes
All times are epoch ms and all durations are seconds. Every advice-bearing object carries `provenance`, as #14 and #17 require.

```ts
export type VerdictKind = 'ready' | 'fix' | 'unknown';
export type Category = 'blocker' | 'compounding' | 'spendable' | 'nice';
/** 'account' or `c<index>`, where index is CharacterState.index. Never a name. */
export type Subject = 'account' | `c${number}`;

export interface SourceRef {
  label: string;            // "wiki", "game data", "Iacchus's class setups"
  url: string;              // must be https: to be rendered as a link (TR-13)
  tier: 1 | 2 | 3 | 4;      // ADR 0004
  verifiedOn: string;       // ISO date
  gameVersion: string;      // "2.3.540"
}
export interface Provenance { entryIds: string[]; fields: string[] }

export interface NextAction {
  /** Stable across saves for the same entry and subject: `${entryId}@${subject}`. Keys done/skip/dismiss. */
  key: string;
  entryId: string;
  text: string;             // template already filled by the engine
  why: string;
  sources: SourceRef[];     // ordered by ADR 0004 precedence; at least 1
  stale: boolean;
  contested: null | { sides: { text: string; sources: SourceRef[] }[] };
  confidence: 'H' | 'M' | 'L';
  provenance: Provenance;
}
export interface Milestone {
  unit: string;             // "Poop kills"
  current: number;
  next: number;
  etaSeconds: number | null;  // fighting only (ADR 0005); null for skilling
  stopHere: boolean;
}
export interface Goal {
  id: string;               // Goal entry id
  title: string;            // "Talents", "AFK Setup"
  system: string;
  category: Category;
  nextAction: NextAction;   // exactly one (glossary)
  milestone: Milestone | null;
}
export interface PurposeLine {
  goalId: string;
  title: string;
  worthwhile: boolean;
  milestone: Milestone | null;
  sources: SourceRef[];
  provenance: Provenance;
}
export interface Verdict {
  kind: VerdictKind;
  /** Keys of the Goals (category 'blocker') that make this 'fix', in rank order. */
  blockerKeys: string[];
  unknownReason: null | 'no-purpose' | 'cannot-tell' | 'not-covered';
  /** For 'no-purpose': the single suggestion. */
  suggestion: NextAction | null;
}
export interface HigherLeverage {
  kind: 'activity' | 'character';
  text: string;
  why: string;
  targetCharacter: number | null;   // CharacterState.index when kind === 'character'
  key: string;
  sources: SourceRef[];
  provenance: Provenance;
}
export interface ActivePlay { key: string; text: string; estimateSeconds: number; subject: Subject; sources: SourceRef[] }
export interface Done { key: string; text: string; confirmedAt: number }
export interface Fill { label: string; at: number; subject: Subject }

export interface CharacterResult {
  index: number;
  name: string;             // displayed only; never leaves the device (TR-10)
  classId: string; classLabel: string; level: number;
  activityLabel: string;    // "Mining Copper", "Fighting Poop", "Nothing"
  mapLabel: string | null;
  isPlaying: boolean;       // most recent per-character save (M1)
  verdict: Verdict;
  purpose: PurposeLine[];
  goals: Goal[];            // ranked, uncapped; blockers first
  higherLeverage: HigherLeverage | null;
  activePlay: ActivePlay[];
  doneThisSession: Done[];
  firstFill: Fill | null;
}
export interface SpendLine { key: string; label: string; cost: number; cumulative: number; affordable: boolean; sources: SourceRef[] }
export interface SpendPlan { currency: 'coins'; owned: number; lines: SpendLine[] }

export interface EngineResult {
  asOf: number;
  expectedReturn: { usedSeconds: number; learnedSeconds: number | null };
  stage: { id: string; label: string };
  characters: CharacterResult[];      // in save order
  visitOrder: number[];               // CharacterState.index values, worst Verdict first, then most to spend
  account: {
    goals: Goal[];                    // ranked, uncapped; the Spend Plan is not in here
    spendPlan: SpendPlan | null;
    activePlay: ActivePlay[];
    doneThisSession: Done[];
  };
  firstFill: Fill | null;             // earliest across the account
  notCovered: { systemId: string; label: string }[];
  versions: { knowledge: string; game: string | null; parserTarget: string; parserBehind: boolean };
  diagnostics: { failedDetectors: { detectorId: string; entryIds: string[]; message: string }[] };
}
```

Engine input, as an amendment to #14's signature: `(accountState, history, knowledge, now, { expectedReturnSeconds })`. Expected Return must be an input, because Verdicts depend on it. Skips and dismissals are **not** engine inputs: they're presentation (TR-3), so golden snapshots stay independent of browser state.

### TR-3 `buildNowView`
`buildNowView(result: EngineResult, prefs: NowPrefs, ui: { focus: number | null; expanded: Set<string>; now: number }): NowView` is pure and deterministic. It:
1. Drops Goals whose `nextAction.key` is skipped (unexpired) or dismissed (same game version), and counts them per subject.
2. Caps non-blocker Goals at 3 per character and 5 for the account, after step 1, unless that subject is in `ui.expanded`. Blockers are never capped.
3. Applies the D2 skip rule to Verdicts, and computes the progress segments and counts, `allSet` (FR-25 plus D4), and `nextInOrder` for Focus (FR-12).
4. Computes the "new since hidden" set (FR-34) from the previous key set, which the caller passes in `prefs.seenKeys`.

```ts
export interface NowView {
  progress: { ready: number; fix: number; unknown: number; total: number; segments: VerdictKind[]; label: string };
  allSet: null | { firstFillText: string };
  roster: RosterRow[];               // in Visit Order
  focus: FocusCard | null;
  account: { goals: GoalView[]; hiddenCount: number; spendPlan: SpendPlanView | null; done: Done[] };
  activePlay: (ActivePlay & { who: string | null })[];
  notCovered: string[];
  banners: Banner[];                 // TR-11 order
  expectedReturn: { chips: { seconds: number; label: string; pressed: boolean }[] };
  footer: { app: string; knowledge: string; game: string | null; parserTarget: string };
}
```
(`RosterRow`, `FocusCard`, `GoalView` and `SpendPlanView` are the matching EngineResult objects plus display strings and `hiddenCount`/`skippedCount`. The exact fields follow from FR-4 to FR-22 and are fixed in code review.)

### TR-4 Component tree
```
<App>                                  existing; owns useActiveOn()
  <ErrorBoundary fallback={<CantWorkOut/>}>
  <NowScreen save engine prefs>        picks the state (TR-11 / section 6)
    <Header>                           wordmark, <SaveAge/> (only it ticks every 1 s), <ExpectedReturnChips/>
    <Banners>                          <PatchBanner/> <OfflineBanner/> <AllSetBanner/>
    <ProgressBar/>
    <WhatsNew/>                        once per version
    {view.focus ? <Focus/> : <Roster/>}
      <Roster>  <ol> <RosterRow/>* </ol>
      <Focus>
        <VerdictStrip/>  <FocusHero/>  <VerdictBlock/>
        <PurposeList> <PurposeLine/>* </PurposeList>
        <GoalList> <GoalItem><NextActionView/></GoalItem>* <ShowMore/> <HiddenList/> </GoalList>
        <HigherLeverageLine/>  <ActivePlayList/>  <DoneList/>
        <NextButton/>  <BackLink/>  <ConfusingLink/>
    <AccountSection>
      <GoalList/>  <SpendPlanGoal><SpendPlanList/></SpendPlanGoal>  <DoneList/>
    <IfYouHaveTime/>
    <NotCoveredYet/>
  <CantRead/>                          existing; replaces everything above on a broken parse
  <Footer>                             versions, credits, <SuggestLink/>, <ClearMyData/>
```
`<NextActionView>` is the one shared component for a Next Action: tag, text, why, `<SourceLabel/>` (with `<ContestedBadge/>` and `<StaleMark/>`), and `<ActionControls/>` (Skip today, Not for me, Report this).

### TR-5 State and routing
- Focus is kept in the URL as `?c=<index>`, with `history.pushState`, so Back closes Focus. A bad or missing index falls back to the Roster.
- `useNow` moves from `<App>` into `<SaveAge>`, so the per-second tick re-renders only the chip, not the whole tree (slice 1 re-renders the whole app every second).

### TR-6 Where the engine runs
The engine runs **in the parse Web Worker**, right after a successful parse, because M5's hypotheticals call Toolbox math (`getMaxDamage` on a cloned character, #16), which lives in the worker bundle. The worker keeps the last parsed state, and re-runs only the engine (no re-parse) on a `{kind:'rerun', expectedReturnSeconds}` message. `EngineResult` must survive `structuredClone` (no functions, Maps, class instances or Dates). Extend `ParseResponse` with `result: EngineResult | { error: string }`.

### TR-7 Done, playing, session
- `isPlaying`, `doneThisSession` and `learnedSeconds` come from the engine and M1 (save history). M10 doesn't diff saves itself.
- **Play Session start**, used for Expected Return expiry and "Done this session": the first save after a gap of at least 60 min with no cloud save. The engine exposes this as `sessionStartedAt` (to be added to `EngineResult` by M1/M3 if they agree; otherwise M10 uses "app opened after a gap of at least 60 min").

### TR-8 Preferences (localStorage)
- Namespaced by account: `activeon:<uidHash>:` where `uidHash` is the first 12 hex characters of SHA-256(uid). Paste mode uses `activeon:paste:`. No uid, name or save data is stored in a key or value.
- Keys:
  - `expectedReturn` = `{seconds, chosenAt}`, valid until the next Play Session start;
  - `skips` = `{[key]: expiresAt}`;
  - `dismissals` = `{[key]: gameVersion}`;
  - `whatsNew` = `{app, knowledge}`, the versions last seen.
- Every read and write is wrapped in try/catch. If storage is unavailable, M10 works with in-memory defaults.
- Changes sync across tabs through the `storage` event (US-11, within 1 s).
- Expired skips, and dismissals from older game versions, are pruned on load. Each map is capped at 500 entries, oldest first out.

### TR-9 Invariants checked in development and tests
- Every `Goal` has exactly one `nextAction`, and every `NextAction` has at least one Source.
- No Contested entry is a blocker or the first non-blocker Goal.
- `visitOrder` is a permutation of the character indexes.
- `verdict.kind === 'fix'` ⇔ `blockerKeys.length > 0`.

They throw in tests, and log once in dev builds; production renders anyway.

### TR-10 Report this and Suggestion payloads
- **`ReportContext`** = `{entryId, actionText, knowledgeVersion, gameVersion, parserTarget, stage, className, level, appVersion, screen}`. `className` and `level` are empty for account items.
- **`SuggestionContext`** = `{screen: 'now'|'focus', className?, level?, stage, knowledgeVersion, gameVersion, appVersion}`, handed to M13's `openSuggestionForm(type, context, prefill?)`.
- **Never included:** character names, uid, email, save data, field values beyond the action text.
- Pre-M13 GitHub URLs are built with `URLSearchParams`, and the body is capped at 6,000 characters.

### TR-11 Screen states and banner order
The screen state is a pure function of `(SaveState, EngineResult | error)`:

`signed-out` → `waiting` → `parsing` → `broken` (FR-38) | `engine-error` (FR-39) | `ok`.

Banner order: patch (FR-35), offline (section 6), all set (FR-25). At most one of each.

### TR-12 Performance budgets
Measured in CI with the largest public save, on a desktop Chrome profile:
- `buildNowView` under 5 ms.
- First render of the Roster under 50 ms after the result arrives.
- Expected Return chip tap to updated Verdicts under 300 ms (engine re-run in the worker, plus render).
- Per-second tick under 2 ms.
- M10 adds at most 25 KB gzipped to the main chunk.
- No layout shift when the cloud-save age text changes (fixed-width tabular numerals).

### TR-13 Security
- All text is rendered as React text. No `dangerouslySetInnerHTML` anywhere in M10.
- Source URLs are rendered as links only if `new URL(u).protocol === 'https:'`; any other URL is plain text. (The Knowledge Base schema in M11 should also reject them.)
- External links use `target="_blank" rel="noopener noreferrer"`.
- **Self-host the three fonts** (all are OFL) instead of Google Fonts. Slice 1 calls fonts.googleapis.com, which sends every visit's IP to Google. That contradicts "nothing leaves the device" beyond the game's own Firebase.

### TR-14 Accessibility and responsive
- **WCAG 2.2 AA.**
- **Roster semantics:** the Roster is an `<ol>`; each row is a `<button>` whose accessible name is as in US-1.
- **Focus semantics:**
  - Focus is a region with an `<h2>` that receives focus when it opens.
  - Back restores focus to the row.
  - The Verdict strip is a `<nav>` with `aria-current`.
- **Live regions:**
  - The ticking age chip is **not** a live region. Slice 1's `aria-live` on the ticking header must be removed, or screen readers announce it every second.
  - One polite live region announces only Verdict changes and "All set".
- **Hit targets:** every control is at least 24×24 CSS px (2.5.8). The 12 px ghost buttons get padding.
- **Contrast fixes (light theme).** Measured on the current tokens:

  | Pair | Ratio | Needed |
  |---|---|---|
  | Source label (`--coin` on `--coin-soft`) | 3.24:1 | 4.5:1 |
  | Ready pill (`--ok` on `--ok-soft`) | 4.14:1 | 4.5:1 |
  | Unknown pill and Stale label (`--unk` on `--unk-soft`) | 4.02:1 | 4.5:1 |

  Darken these foregrounds until each pair passes 4.5:1. The dark theme passes as is (6.3–6.7:1).
- **Not colour alone:** Verdicts always carry their text, and the progress segments carry an `aria-label`.
- **Motion:** `prefers-reduced-motion` disables the Focus transition and the scroll animations.
- **Widths:**
  - Works from 320 CSS px (and at 400% zoom of a 1280 px window) up to 480 px, with no horizontal scroll.
  - At ~400 px (the overlay width from #8), long Verdicts wrap the summary line, never the pill.
  - No `position: fixed` element covers content, so a later Picture-in-Picture window works.
- **Keyboard:** Enter or Space opens a row; Esc closes Focus; ←/→ move through the Verdict strip.

### TR-15 Golden snapshots
`renderNowText(buildNowView(engine(fixture), emptyPrefs, {focus:null,…}))` yields a stable plain-text screen:

```
3 of 5 Ready · fix 1 before you leave
1. <c3> Squire lv43 · Mining Copper · Tunnels Entrance · FIX · Food runs out in about 2h
…
ACCOUNT
- Spend · Stamps: Upgrade … [wiki · 2.3.540]
```

It is committed per fixture under `packages/engine/test/now/__snapshots__/`. Names are replaced by `<c{index}>` in snapshots, so CI never writes a character name even for local private saves. Knowledge Base PRs show advice diffs through these files (#11.12). Component tests (Vitest + Testing Library + jsdom) cover the user stories on the view fixtures, and axe runs on each state.

## 6. States and edge cases

| State | What the Now screen shows |
|---|---|
| **Signed out, no paste** | Slice-1 sign-in plus the paste fallback. No advice shell. |
| **Waiting for first save** | Header ("no save yet"), then 3 skeleton rows and "Waiting for your save…". After 30 s: "Open the game, or switch character, to trigger a cloud save." |
| **Parsing / engine running** | First load: skeleton rows. Later saves: the current view stays, with no flicker, and a small "updating…" next to the age chip. A newer save supersedes an older parse (slice-1 sequence guard). |
| **Broken parse** (input / empty / shape / crash / sync error) | FR-38. Nothing advice-shaped renders, even with a last good save. |
| **Engine throws** | FR-39. Error boundary; names and activities only. |
| **Some Detectors fail** | Those characters show Unknown ("Can't tell from the save"). The `diagnostics` count shows in the footer: "2 checks failed · Report". |
| **Stale patch** (save newer than parser) | FR-35 banner; advice still shown. |
| **Knowledge Base entries Stale** | FR-19 marking; no banner. |
| **Nothing covered yet** (M10 ships before M3–M9) | Every Verdict is Unknown, with reason `not-covered` ("Not covered yet: AFK safety"). The progress bar is hidden while every Unknown is `not-covered`. "Not covered yet" lists every System. This is honest and expected during the build order. |
| **All Ready** | FR-25 banner; the progress bar label reads "safe to log off". |
| **Character with no AFK Target** (`afkType` Nothing) | Activity "Doing nothing"; the engine decides the Verdict (most likely Fix). |
| **New character created mid-session** | A new row appears in its Visit Order place. No skips carry over, because keys use the index. |
| **Character deleted or reordered** (indexes shift) | Skips and dismissals keyed to a missing index are pruned; a shifted index may misapply one skip until it expires. Accepted risk, see red team #7. |
| **Offline** (`navigator.onLine === false`, or the Firestore listener reports offline) | Banner: "Offline: showing your last save from 14:02." Advice stays, with its age; Report and Suggest fall back to "Copy report text". |
| **Save very old** (age > Expected Return) | The age chip turns to the warning style; advice is still shown, since the AFK Setup it judges is still in place. |
| **Paste mode** | The "pasted" chip; no "playing" marker and no auto-follow, since there is no live switch; the paste preference namespace; Suggest falls back to GitHub. |
| **Multiple tabs** | Each tab runs its own listener and worker (accepted cost). Preferences sync through `storage` events. Only M1 decides who writes save history. |
| **Second account** (sign out, then another Google account) | Preferences are namespaced by uid hash, so nothing carries over. The Focus URL param is dropped on sign-out. |
| **localStorage blocked** | In-memory preferences; a one-line note in the footer: "Can't remember your choices in this browser." |
| **11 characters** (the maximum) | The Roster stays one column; the Verdict strip wraps onto 2 lines (6 + 5) at 320 px. |
| **Very long names or labels** | Ellipsis on the activity · map line; the name wraps; the pill never shrinks. |
| **Learned Expected Return over 24 h** | Shown as its own chip ("≈30h"). |
| **Clock skew** (save time in the future) | Ages clamp at 0 (as slice 1 does); ETAs use the engine's `asOf`, never `Date.now()`. |
| **What's new data missing or corrupt** | The card is skipped silently; versions are still recorded. |

## 7. Dependencies

| Module | M10 needs | Interface |
|---|---|---|
| **M1 Sync & Account State** | `SaveState`, `lastGood`, `AccountState.account.gameVersion` in a **comparable form** (the server build is a number while the parser target is "2.3.540"; M1 must expose both as the same kind of version, or `parserBehind` can't be computed), per-character last-save times for `isPlaying`, save history for done, learned Expected Return and `sessionStartedAt`, and "clear my data". | `useActiveOn()`, `AccountState`, history API |
| **M11 Knowledge tooling** | Knowledge Base version string, System registry with display labels (for Not covered yet), Source schema incl. https-only URLs. | `@idleon-forge/knowledge` exports `version`, `systems` |
| **M2 Stage & Meta Path** | `stage` for the view and the report payload. | in `EngineResult` |
| **M3 AFK Safety** | Verdicts, blockers, `firstFill`, Expected Return as an input. | `Verdict`, `Fill` |
| **M4 Purpose & Milestones** | `purpose`, `Milestone`, `no-purpose` suggestion. | `PurposeLine` |
| **M5 Higher-leverage options** | `higherLeverage`. | `HigherLeverage` |
| **M6 Unspent & idle** | Goals and Next Actions of category spendable and compounding. | `Goal` |
| **M7 Spend Plan** | `spendPlan`. | `SpendPlan` |
| **M8 Collections, M9 Builds** | Goals and Next Actions; Contested items (for example 2nd Squire builds). | `Goal` |
| **M12 Release** | App version, plus `whats-new.json` = `[{version, date, kind: 'app'\|'advice', text}]` generated from Conventional Commits and Knowledge Base changes. | static asset |
| **M13 Suggestions** | `openSuggestionForm(type, context, prefill?)` and a signed-in check; M10 provides `SuggestionContext` and `ReportContext`. Until M13 ships, M10 uses the GitHub issue-form fallback. | function export from `apps/activeon/src/suggestions/` |
| **Repo setup (#7)** | Issue forms `kb-correction.yml` and `idea.yml` must exist with fields M10 can pre-fill. | GitHub issue forms |

The engine's ranking (#26) and the `EngineResult` shape are shared contracts. A change to TR-2 needs a note on this spec and on the producer module's spec.

## 8. Open decisions for Yasser

❓ D1 - Roster or Focus as the resting view, and does Focus follow the game? #10 says the played character's row "opens on its own"; #12 says tapping a row opens Focus. Options: (a) the Roster is always the resting view and the played row only gets a "● playing" marker; (b) Focus opens on the played character at load and **follows** each character switch the save reveals, and the player can go back to the Roster, which then stays put until the next switch; (c) Focus opens at load but never follows.
➡️ (b). The game cloud-saves instantly on a character switch, so when you change character in the game the screen arrives on that character's card by itself. That pairs with "Next: switch to X →" and is the closest thing to a guided session without touching the game. Saves that don't change the played character never move the view, so it doesn't fight you.

❓ D2 - Can a Verdict blocker be skipped? Options: (a) no controls on blockers except Report this; (b) Skip today is allowed and the character counts as Ready, with a "Ready · 1 skipped" pill, but Not for me is not offered on blockers; (c) Skip is allowed but the Verdict stays "Fix before you leave".
➡️ (b). A wrong blocker otherwise makes "All set" unreachable for the whole session, which is the failure the done bar most wants to avoid. Showing "1 skipped" keeps it honest, and refusing a patch-long Not for me on a safety warning stops it being silenced for weeks. Wrong blockers still go through Report this.

❓ D3 - How long does "Skip today" last? Options: (a) until local midnight; (b) until the account's next game daily reset (a per-account countdown, #15); (c) a fixed 12 h; (d) until the next Play Session starts.
➡️ (b), falling back to (a) if M1 doesn't expose the reset time. A Play Session often spans local midnight; the game's own reset is when dailies and keys come back, so "today" means the game's day. (d) is tempting but would bring a skipped item straight back after a short break.

❓ D4 - Does an Unknown Verdict block "All set: safe to log off"? Options: (a) strict, so every character must be Ready; (b) only "Fix before you leave" blocks, and the banner adds "(2 Unknown)"; (c) Unknown for `cannot-tell` blocks, but Unknown for `no-purpose` or `not-covered` doesn't.
➡️ (c). The banner promises safety to log off. "Can't tell from the save" is a genuine safety doubt, but "What is this character for?" is a Purpose question, not a safety one. And while M3–M9 are still being built, everything is `not-covered`, which under (a) would mean the banner never appears. The progress bar still reads "3 of 5 Ready · 2 Unknown", so nothing is hidden.

❓ D5 - Character names or class names on rows? The prototype showed only classes; real rows can show the in-game names. Options: (a) name, then class and level; (b) class and level only, with the name in Focus; (c) a toggle.
➡️ (a). Names are how players think of their characters ("switch to Grumbo"), and two Squires on Joseph's account are ambiguous by class alone. Names never leave the device (TR-10), and snapshots replace them (TR-15), so the only exposure is screen sharing, which is the player's choice.

## 9. Red-team notes

1. **A wrong blocker traps the session.** A buggy Check flags "Fix before you leave" on a correct setup, "All set" never shows, and the player stops trusting the screen. *Defence:* D2 (a skippable blocker that counts as Ready, shown as skipped), Report this on every blocker, the done bar's "no wrong Verdict blocker on either golden snapshot", and TR-15 snapshots in every Knowledge Base PR.
2. **Advice from a half-broken save.** Toolbox silently returns an empty account or falls back on sections, and the screen happily shows "All set". *Defence:* FR-38 renders nothing advice-shaped on any failure kind; partial Detector failures turn only those characters Unknown, with a footer count (FR-39); `AccountState.warnings` feed `cannot-tell`, never Ready.
3. **Privacy leak through reports.** A Report or Suggestion carries a character name, or the action text embeds one (for example "Switch to Grumbo"), into a **public** GitHub issue. *Defence:* TR-10's allow-list payload; the engine templates must refer to characters as `{char}` and M10 substitutes "<character>" in report text; a unit test greps every report body for every name in the fixture; the UI warns "posted publicly".
4. **Third-party leaks.** Google Fonts sees every visit; a malicious Knowledge Base PR adds a `javascript:` or tracking URL as a Source. *Defence:* self-hosted fonts (TR-13), https-only links with `noreferrer`, M11 schema validation, and CODEOWNERS review on `packages/knowledge`.
5. **The UI quietly re-ranks.** A component sorts or filters "for neatness", and the screen drifts from the engine and the golden snapshots. *Defence:* all ordering and capping lives in the pure `buildNowView`; components render arrays in order; TR-9 invariants; snapshots are built from `NowView`, not from the engine output.
6. **Patch breakage looks like advice.** After a game patch the parser is behind and numbers shift subtly; advice is confidently wrong. *Defence:* FR-35 banner whenever `parserBehind`; Stale marks per entry; requires M1 to make versions comparable (section 7). If M1 can't, the banner falls back to "the parser pin is N days old" (risk flagged).
7. **Keys drift.** Keys use the character index, so deleting a character shifts indexes and a skip lands on the wrong character. A Knowledge Base change that renames an entry id revives dismissed items. *Defence:* skips expire daily (D3); dismissals expire on the next patch anyway; M11 must keep entry ids stable, with renames via an alias list. Low impact by design.
8. **Auto-follow fights the player.** Focus jumps while the player reads another character. *Defence:* it follows only on a played-character **change** (D1), never on the 4-minute periodic save; a "Following the game · stop" toggle is a cheap addition if the first sessions show friction.
9. **Screen-reader and overlay misery.** The ticking age chip spams announcements; at 400 px the pill crushes the summary; the light theme's source label fails contrast. *Defence:* TR-14 removes `aria-live` from the ticker, measured contrast fixes, a 320–480 px test matrix, and axe in CI per state.
10. **Expected Return is ignored or misunderstood.** The player never taps it, the 8 h default hides an overnight 12 h fill, and they come back to a capped inventory. *Defence:* the learned default from history (FR-27), the chips always visible in the header, and the All set banner states the first fill time explicitly ("fills up in about 9h"), so a mismatch with real plans is obvious.
