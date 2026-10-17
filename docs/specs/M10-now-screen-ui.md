# M10 Now screen UI

Spec for [#38](https://github.com/YassSoliman/idleon-forge/issues/38). Status: **ready**. Section 8 ruled by Yasser on 2026-10-17 (every recommendation accepted); red-teamed, see section 10; red-team follow-ups R1–R5 and M3 D3 ruled on 2026-10-17 (D6–D9, section 8).

Grounded in:
- [#10 How the Now screen behaves](https://github.com/YassSoliman/idleon-forge/issues/10): the 16 decisions.
- [#12 Rough Now screen on fake data](https://github.com/YassSoliman/idleon-forge/issues/12): the A + B + C blend, Purpose, Higher-leverage option, Spend Plan.
- [#11 Knowledge Base shape](https://github.com/YassSoliman/idleon-forge/issues/11): Stale, Contested, Knowledge Base version, "Not covered yet", the Report this payload.
- [#14 Architecture](https://github.com/YassSoliman/idleon-forge/issues/14): the pure engine, the Web Worker, IndexedDB, patch awareness, "What's new".
- [#13 MVP cut](https://github.com/YassSoliman/idleon-forge/issues/13) and [ADR 0008](../adr/0008-worker-for-suggestions.md): the M13 Suggestion entry point.
- The prototype (`origin/prototype/now-screen`) and the slice-1 code (PR #28).

Terms are from [`GLOSSARY.md`](../../GLOSSARY.md) and used exactly: Verdict, Purpose, Milestone, Leverage, Spend Plan, Visit Order, AFK Target, Parallel Slot, Expected Return, Stale, Contested, Next Action, Goal, Active Play suggestion, Suggestion, Stage. Terms local to this spec (to be added to the glossary with the M10 build): **Roster** (the list view), **Focus** (the one-character card view; keyboard focus is always written out as "keyboard focus"), **Verdict strip** and **Account section**.

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
- **FR-3** The header shows the ActiveOn wordmark, a "last cloud save Ns ago" chip (marked "pasted" for pasted saves), the Expected Return chips, and the "Suggest" control (M13 FR-1).

**Roster (A)**
- **FR-4** The Roster is an ordered list with one row per character, in the engine's Visit Order. The order is frozen for the Play Session (D6). Each row shows: its Visit Order number; the character's name, then class and level (D5); its AFK Target and map ("Mining Copper · Tunnels Entrance"); a "● playing" marker on the character currently being played (live mode, and only while the last save is under 30 min old; see FR-14); a Verdict pill; and one summary line.
- **FR-5** The summary line is, in priority order: the first Verdict blocker ("Food runs out in about 2h"); for Unknown, the reason ("What is this character for?" or "Can't tell from the save"); otherwise the top Next Action; otherwise "Nothing to do here".
- **FR-6** Tapping or activating a row opens that character in Focus.

**Verdict**
- **FR-7** The Verdict pill reads exactly "Ready", "Fix before you leave" or "Unknown", or "Ready · n skipped" when the character counts as Ready only because n blockers were skipped (D2), or "Unknown · skipped" when a `cannot-tell` Unknown was skipped (D7). It is always shown as text, never as colour alone.
- **FR-8** The Verdict reflects only AFK safety against the current Expected Return plus whether the character serves a worthwhile Purpose (glossary). Unspent things and account stockpiles (D9) never change it. M10 never computes it; it renders `verdict` from the engine as is, apart from the skip rules in D2 and D7.

**Progress bar (B)**
- **FR-9** Above the Roster, a segmented bar with one segment per character, in Visit Order and coloured by Verdict, plus a label: "N of M Ready", followed by "fix K before you leave", "U Unknown" and "fix S in Account" (unskipped account stockpile blockers, D9) when non-zero (D4). Segments follow the frozen order (D6) and stand for characters only; account stockpiles get no segment. When the condition in FR-25 holds, the label becomes "safe to log off", still followed by "U Unknown" when any remain.

**Focus (C)**
- **FR-10** Focus shows one large card for one character:
  - a Verdict strip (one labelled item per character in Visit Order, TR-14) for jumping between characters;
  - "k of M in your Visit Order · n left", where n counts characters not yet visited this Play Session that still have something to do (FR-12), plus "you are on this character" when it is the one being played;
  - after an auto-follow, a one-line "Left <name>: n done · <its Verdict>" with a "← back" link, so the result on the character just left is never lost (FR-14);
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
- **FR-12** "Next: switch to <name> →" names the first character in Visit Order, counted from the top and skipping the one on screen, that has **not been visited** this Play Session and has anything to do (a Verdict other than Ready, or at least one visible Goal). A character is visited once it has been the played character in this Play Session (from M1's `activeCharacterIndex`; in paste mode, once the player has opened its Focus). Pressing it opens that character's Focus. Visit Order here is the order frozen for the Play Session (D6), so the target never jumps because a save reshuffled the engine's ranking. So Next always leads to the worst unvisited character, wherever Focus opened, and switching in the game to a different character than suggested only marks that one visited. When no such character is left, it reads "Last one: check the Account list ↓" and scrolls to the Account section. It never touches the game.
- **FR-13** "← All characters" (and the browser Back button) returns to the Roster and puts keyboard focus on the row of the character that was in Focus, however it was opened.
- **FR-14** **Focus follows the game (D1).**
  - *Signal.* The played character is M1's `activeCharacterIndex` (newest per-character save stamp, null when unsure). A "switch" is a save whose non-null `activeCharacterIndex` differs from the last non-null one. Null never moves the view.
  - *First load.* In live mode, when the last save is under 30 min old, Focus opens on the played character. Otherwise (game probably closed, M1 FR-27) the Roster shows, with no "● playing" marker and no "you are on this character".
  - *Follow.* On a switch, Focus moves to the newly played character, whether the player was on the Roster or on another character's Focus, and shows the "Left <name>" line (FR-10). A save that does not change the played character never moves the view; if the player went back to the Roster, it stays there until the next switch.
  - *Never mid-interaction.* If keyboard focus is inside the Focus card, an expander or "+n" list is open, or a confirmation or the M13 form is open, the card is not swapped. A "Now playing <name> · go" chip appears at the top of Focus instead, and the switch is announced (TR-14). Following never moves keyboard focus or calls `window.focus()`, and keeps the scroll anchored (no jump of the Account section).
  - *History.* Auto-follow and first load use `history.replaceState`; only player-initiated opens push (TR-5).
  - *Gate.* Before D1 is built, M1 or M10 records a live A → B → C switch and commits the scrubbed snapshot sequence as a fixture (US-3). If the switch save shows the character just left as newest, follow only from the next save that confirms the change.
  - *No opt-out.* There is no "Following the game · stop" toggle in this release (D8). The never-mid-interaction rule above is the only guard.
  - Paste mode never auto-opens or follows (section 6).

**Goals and Next Actions**
- **FR-15** Every Next Action shows: a category tag and Goal title ("Spend · Talents"); the action text; "Why: …"; a Source label; and the controls Skip today, Not for me and Report this.
- **FR-16** At most 3 Goals per character and 5 for the account are shown, in engine rank order. The rest sit behind "show more (n)". Verdict blockers, and account stockpile blockers (D9), are never hidden behind "show more", even if there are more than 3 or 5.
- **FR-17** An account-wide task that needs a specific character appears on that character, never in the Account section (the engine places it; M10 must not move it).

**Sources, Stale, Contested**
- **FR-18** The Source label reads `<source label> · <game version>` (for example "wiki · 2.3.540"). It is a link that opens the highest-precedence Source (ADR 0004) in a new tab. If the entry has more Sources, a "+n" control in Focus lists them all, each as a link with its tier and date verified.
- **FR-19** A Stale entry's label adds "· Stale" and uses the muted style. It stays visible; the engine already ranks it below fresh entries.
- **FR-20** A Contested entry carries a "sources disagree" badge and an expander that shows both sides, each with its own Sources. It is never shown as a Verdict blocker or as the first Goal (the engine guarantees this; M10 asserts it in a dev-mode check, TR-9).

**Higher-leverage option and Spend Plan**
- **FR-21** When the engine provides one, Focus shows a single Higher-leverage line ("Better fit: <other character> suits this XP and hits the same 100k Goal"), with its why, Source, Not for me and Report this. When the option names another character, tapping that name opens its Focus.
- **FR-22** The Spend Plan appears in the Account section as one Goal ("Spend coins"), whose Next Action is the first purchase. Expanding it shows the full ordered list. Each line shows the item, its cost, the running total, and an "affordable" or "short by X" mark checked against the coins in the save. It closes with "N of M affordable now".

**Account, Active Play, gaps**
- **FR-23** The Account section is headed "Account · any character" and lists account Goals under FR-15/16. Account stockpile blockers (M3 FR-24/FR-25, `account.blockerKeys`) lead it, under a "Fix before you leave" sub-heading, in engine rank order and uncapped (D9). They never change any character's Verdict or Roster row. Skip today is offered on them and Not for me is not, as for character blockers (D2).
- **FR-24** "If you have time" lists the Active Play suggestions with their time estimate ("about 1h of hands-on play") and the character they apply to, if any. They never affect a Verdict or the progress bar.
- **FR-25** **All set:** when no character's Verdict is "Fix before you leave", no character is Unknown with reason `cannot-tell` that was not skipped (D4, D7), and no account stockpile blocker is firing unskipped (D9), a banner says "All set: safe to log off", adds "(n skipped)" when any character blocker, `cannot-tell` Unknown or account stockpile blocker was skipped to get there (D2, D7, D9), and is followed by when the first thing fills up or runs out ("First thing fills up in about 9h: <name>'s inventory"), or "Nothing fills up before you're back" when the engine reports nothing. **Exception:** while any character is Unknown `not-covered` because AFK safety itself is not covered (M3 not shipped, or not covering it), the banner never says "safe to log off". It reads "Nothing ActiveOn checks needs fixing · AFK safety isn't covered yet", and the progress label does not switch to "safe to log off". This wording stays until AFK safety is covered (D4, R1). D4 still holds: `not-covered` does not block the banner.
- **FR-26** "Not covered yet: <System>, <System>…" lists the Systems unlocked on the account that have no active Knowledge Base entries. It is one collapsed line at the end of the Account section, and expands to the full list.

**Controls**
- **FR-27** **Expected Return:** chips "2h 4h 8h 12h 24h", preceded by "Back in about". The default is the engine's learned value when save history exists, shown as its own chip if it isn't one of these (for example "≈6h"), otherwise 8h. Picking one re-runs the engine and updates every Verdict within the budget in TR-12. The choice holds for the current Play Session (TR-8).
- **FR-28** **Skip today** hides that Goal (and its Next Action) on that character until the next local midnight or the end of the Play Session in which it was skipped, whichever is later (D3). The session ends when M1 starts a new one (M1 TR-15: 15 min or more with no cloud save). The next-ranked Goal moves up into view. A "n skipped · undo" link at the end of the list brings it back. Skip today is also offered on:
  - Verdict blockers; skipping every blocker of a character makes it count as Ready, shown as "Ready · n skipped" (D2);
  - an Unknown `cannot-tell` Verdict, in the Verdict block in Focus; the character then shows "Unknown · skipped" and no longer blocks "All set" (D7). It stays Unknown in the progress count;
  - account stockpile blockers (D9).
- **FR-29** **Not for me** hides that Goal on that character until the save's game build changes (the next patch); a save with no known build keeps it hidden. It is listed under "Hidden until next patch (n) · undo" in Focus. It is never offered on a Verdict blocker, a `cannot-tell` Unknown or an account stockpile blocker (D2, D7, D9).
- **FR-30** **Report this** on any Next Action, Purpose line, Higher-leverage line or Spend Plan line: before M13 ships, it opens a pre-filled GitHub `kb-correction` issue in a new tab; after M13, it opens M13's Suggestion form with type "Something's wrong". Either way it attaches only the payload in TR-10 and says "This will be posted publicly on GitHub".
- **FR-31** **Suggestion entry point (M13):** the "Suggest" control in the header (FR-3) opens M13's form with type Idea. Focus has a "Something confusing here?" link that opens it with type Confusing. Both pass a `SuggestionContext` (TR-10). Signed-out and paste-mode behaviour is M13's (FR-7/D6: shown disabled, "Sign in to send suggestions"). Before M13 ships, both open the GitHub `idea` issue form. Suggest stays available on the "Can't read your save" screen (M13 section 6).

**Freshness and done**
- **FR-32** The cloud-save chip updates every second. After 240 s with no new save in live mode, it switches to the warning style and shows "No new save for a while: press Cloud Save or switch character in the game to refresh" in a `role="status"` element that announces once. (Slice 1 has the 240 s hint; the wording and role are new.) If the last save is over 30 min old at open, M1 FR-27's "Open the game and switch character to refresh" applies.
- **FR-33** A Next Action disappears when a later save confirms it is done. It then appears under "Done this session (n)" on its character, or in the Account section, struck through, with the time it was confirmed.
- **FR-34** While the ActiveOn window doesn't have focus (`!document.hasFocus()`, which covers a visible window beside the game, not only a hidden tab), the document title becomes "(n) ActiveOn", where n is the number of Next Actions that have appeared since the window last had focus. It resets to "ActiveOn" on focus. There is no sound and no pop-up.

**Patch and versions**
- **FR-35** The patch rule is M1's (M1 D3(b)): when the save's game build is newer than any build this parser pin parsed cleanly **and** the save has failed sections, a banner shows: "The game updated (build 143). ActiveOn's save reader hasn't caught up yet; advice may be off." Advice is still shown, since the parse succeeded. A newer build with no failed sections gets only the footer note. (The save carries a build number, not "2.3.x"; the two can't be compared, so M10 never computes this itself and reads `parserBehind` from M1.)
- **FR-36** The footer shows the ActiveOn version, `knowledge <version>`, the game build from the save ("game build 143"), and the parser target ("parser targets 2.3.540"), plus the existing credits and the "Read-only" note.
- **FR-37** **What's new:** follows M12's contract (M12 FR-21, TR-7). When `whats-new.json` has entries newer than `lastSeenEntryId`, a card shows "What's new since your last visit", grouped as **Advice changes**, **Game patch support** and **App changes**. It shows once and is dismissed with "Got it", which sets `lastSeenEntryId` to the newest entry. On the very first visit, nothing is shown and `lastSeenEntryId` is set to the newest entry. A stale tab shows M12 FR-24's "New version available, reload" banner (TR-11).

**Errors and data**
- **FR-38** **Can't read your save:** on any parse failure (input, empty, shape or crash), the screen shows "Can't read your save right now", the time of the last good save, and the raw-JSON paste box. No Roster, Focus, Account section or progress bar is rendered: advice is never shown from a broken parse. A **sync error** (listener or token problem, with the last good save intact) is treated like Offline (section 6): the last good advice stays, with its age and a banner, because nothing about that save is broken.
- **FR-39** **Can't work out advice:** if the engine throws as a whole, the screen shows "Can't work out advice right now", the Roster with names and activities only (no Verdicts), and a Report this button that sends versions and the error class. If only some Detectors fail, the affected characters show Unknown ("Can't tell from the save") and the rest render normally.
- **FR-40** "Clear my data" in the footer opens a confirmation, then deletes save history (via M1), every M10 preference (TR-8), tells other open tabs to drop theirs (TR-8), and offers to sign out too (M1 FR-23).

## 4. User stories

Fixtures. **Real saves:** the 11 Toolbox public saves in `packages/account-state/fixtures/public/` (CI), the scrubbed W2 save (CI), and `fixtures/private/*` (local only). **View fixtures:** hand-written `EngineResult` JSON files in `packages/engine/test/now/fixtures/` (`mid-session`, `all-set`, `contested`, `stale`, `no-purpose`, `blocker-overflow`, `spend-plan`, `higher-leverage-character`, `detector-failure`, `not-covered`, `cannot-tell`, `account-stockpile`). These are synthetic, contain no real names, and let M10 be tested before M3–M9 exist. Every "Then" below is asserted on `NowView` and/or the plain-text snapshot (TR-15), and on the rendered DOM where it says "screen".

**US-1 See who is safe to leave.**
As a player in a Play Session, I want one row per character with a clear Verdict, so that I know at a glance who still needs me.
- Given view fixture `mid-session` (5 characters: 1 Fix, 1 Unknown, 3 Ready) / When the Now screen renders / Then the Roster shows 5 rows numbered 1–5, row 1 shows "Fix before you leave" with its blocker as the summary line, row 2 shows "Unknown", and rows 3–5 show "Ready".
- Given the same fixture / When a screen reader reaches row 1 / Then its accessible name contains the number, name, class, level, activity, map, the Verdict text and the summary line.

**US-2 Know where to go next.**
As a player in a Play Session, I want the characters numbered in Visit Order with a "Next" button, so that I don't have to plan the order myself.
- Given `mid-session` with `visitOrder = [3,0,4,1,2]` / When the screen renders / Then row 1 is character index 3 and row 5 is index 2; M10 doesn't re-sort.
- Given Focus is open on Visit Order position 2, positions 1 and 2 are visited, and position 3 is Ready with no visible Goals / When the player presses "Next: switch to …" / Then Focus opens position 4.
- Given Focus auto-opened on position 7 of 11 at load, and nothing is visited yet / When the screen renders / Then the button names position 1, and the card reads "7 of 11 in your Visit Order · 10 left" (minus any with nothing to do).
- Given the button names position 1 / When the next save shows the player switched to position 5 instead / Then Focus follows to 5, position 5 is visited, and the button still names position 1.
- Given every other character with anything to do is visited / When the screen renders / Then the button reads "Last one: check the Account list ↓".
- Given the Play Session opened with `visitOrder = [3,0,4,1,2]` / When a later save in the same session reports `visitOrder = [0,3,4,2,1]` / Then the Roster, the progress segments and Next still use [3,0,4,1,2], while each row's Verdict updates (D6); and when a save starts a new Play Session, the new session's first `visitOrder` is used.
- Given the frozen order [3,0,4,1,2] / When a save adds character 5 / Then it is appended as row 6; and when character 1 is deleted, its row drops out and the rest keep their order (D6).

**US-3 Focus on the character I'm playing.**
As a player in a Play Session, I want the screen to follow me when I switch character in the game, so that what I see matches where I am.
- Given the Roster is showing, and the latest save has character 2 being played / When a new save arrives in which character 4 is being played / Then Focus opens on character 4 (per D1) and "you are on this character" shows.
- Given Focus is open on character 1 (opened by hand) and character 2 is being played / When a new save arrives in which character 2 is still being played / Then Focus stays on character 1.
- Given the recorded switch fixture sequence (FR-14 gate) A → B → C / When the snapshots arrive in order / Then Focus lands on B, then C, each within one save of the switch, and never moves back to A.
- Given Focus on character 2 follows a switch from character 2 to 4 / When it renders / Then character 4's card shows "Left <c2>: n done · <c2's Verdict> · ← back", and the history length is unchanged (replaceState).
- Given keyboard focus is on a Skip today button in character 2's card / When a save shows a switch to character 4 / Then the card stays on character 2, a "Now playing <c4> · go" chip appears, keyboard focus does not move, and the live region announces it once.
- Given a save where `activeCharacterIndex` is null / When it arrives / Then the view does not move.
- Given the app opens and the last save is 45 min old / When the screen renders / Then the Roster shows, with no "● playing" marker.
- Given any state / When the screen renders / Then there is no "Following the game" toggle (D8).

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
- Given every character is Unknown `not-covered` for AFK safety (M3 not shipped) / When the screen renders / Then no text contains "safe to log off", and the banner reads "Nothing ActiveOn checks needs fixing · AFK safety isn't covered yet" (R1).

**US-10 See my progress confirmed.**
As a player in a Play Session, I want Next Actions to tick off by themselves when the game saves, so that I don't have to tick anything.
- Given a save with Next Action K visible on character 1 / When a later save arrives and the engine lists K in `doneThisSession` / Then K is gone from the Goals and appears under "Done this session (1)", struck through.

**US-11 Dismiss what doesn't apply.**
As a player in a Play Session, I want to skip or hide a Next Action, so that the list stays relevant.
- Given Goal G is visible on character 2 / When the player presses Skip today / Then G is hidden, the next Goal moves into view, "1 skipped · undo" appears, and a second open tab hides G within 1 s.
- Given G is hidden with Not for me at game build 142 / When a save with build 143 arrives / Then G is visible again; and when a save with an unknown build arrives, G stays hidden.
- Given G was skipped at 21:00 and the Play Session ends at 22:30 (no cloud save for 15 min after the last one) / When the clock passes 22:30 / Then G stays hidden; and when it passes local midnight, G is visible again, without needing a new save (TR-5 timer) (D3).
- Given G was skipped at 23:30 in a Play Session that runs until 01:10 / When the clock passes local midnight / Then G stays hidden; and when the session ends (15 min after the last cloud save), G is visible again (D3).
- Given G was skipped in a session that ended, and a new Play Session starts before midnight / When the screen renders / Then G is still hidden until midnight (D3).

**US-12 Report wrong advice.**
As a player in a Play Session, I want to report a wrong Next Action in two taps, so that it gets fixed for everyone.
- Given a Next Action from entry `stamps.cheapest-damage` on a Squire level 43, with Stage `W2-mid` / When the player presses Report this (pre-M13) / Then a new tab opens on `github.com/YassSoliman/idleon-forge/issues/new?template=kb-correction.yml&…`, and its body contains the entry id, Knowledge Base version, game build, Stage, "Squire", "43" and the action text, but no character name and no save data; and the whole URL is at most 7,500 bytes.

**US-13 Suggest something.**
As a player in a Play Session, I want a Suggest button always at hand, so that I can send an idea without leaving the game.
- Given a signed-in player in Focus on a Squire level 43 / When they press "Something confusing here?" / Then M13's form opens with type Confusing and a `SuggestionContext` from `packages/suggestions` with `screen: 'character'`, class Squire, level 43, Stage and versions, and no name.
- Given paste mode, after M13 ships / When they look at Suggest / Then it is disabled with "Sign in to send suggestions" (M13 D6); before M13 ships, it opens the GitHub `idea` issue form in a new tab.

**US-14 Never get advice from a broken save.**
As a player in a Play Session, I want a clear error when ActiveOn can't read my save, so that I never act on wrong advice.
- Given a save that parses to an empty account / When the engine would run / Then the screen shows "Can't read your save right now", the last good save time and the paste box, and no Verdict pill exists in the DOM.

**US-15 Know when the game patched.**
As a player in a Play Session, I want to be told when the game is newer than ActiveOn's reader, so that I can weigh the advice.
- Given M1 reports a save on build 143, newer than any build the pin parsed cleanly, with failed sections (`parserBehind: true`) / When the screen renders / Then the "game updated (build 143)" banner shows, and the advice still renders.
- Given build 143 with no failed sections / When the screen renders / Then no banner shows, and the footer reads "game build 143 · parser targets 2.3.540".

**US-16 Learn what changed.**
As a player in a Play Session, I want a short "What's new" after an update, so that I know which advice changed.
- Given `lastSeenEntryId` = E5 and `whats-new.json` holds E1–E8 newest first / When the screen renders / Then the card lists E1–E4 grouped as Advice changes / Game patch support / App changes, once; after "Got it", a reload doesn't show it again.
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

**US-20 Get past a wrong blocker.**
As a player in a Play Session, I want to skip a blocker I know is wrong, so that one bad Check doesn't keep me from "safe to log off".
- Given `blocker-overflow` reduced to one character with a single blocker B / When the player presses Skip today on B / Then the pill reads "Ready · 1 skipped", the character counts as Ready in the progress bar, and B offers Report this but no Not for me (D2).
- Given that character has 2 blockers and only one is skipped / When the screen renders / Then the pill still reads "Fix before you leave".

**US-21 "All set" ignores Purpose questions, not safety doubts.**
As a player in a Play Session, I want "safe to log off" to mean safe, so that I can trust it.
- Given 4 Ready characters and 1 Unknown `no-purpose` / When the screen renders / Then the "All set" banner shows and the label reads "safe to log off · 1 Unknown" (D4).
- Given 4 Ready and 1 Unknown `cannot-tell` / When the screen renders / Then no "All set" banner shows.
- Given view fixture `cannot-tell` (4 Ready and 1 Unknown `cannot-tell`) / When the player presses Skip today in that character's Verdict block / Then its pill reads "Unknown · skipped", the "All set" banner shows with "(1 skipped)", the label reads "safe to log off · 1 Unknown", and the block offers Report this but no Not for me (D7).

**US-22 Account stockpiles block "All set".**
As a player in a Play Session, I want account-wide stockpiles that cap to stop "safe to log off", so that the message stays true even when no character needs me.
- Given view fixture `account-stockpile` (5 Ready characters, and account blockers "Claim Arcade balls" and "Spend Water", as in M3 US-6) / When the screen renders / Then the Account section starts with a "Fix before you leave" sub-heading holding both blockers, above every other account Goal; no "All set" banner shows; the label reads "5 of 5 Ready · fix 2 in Account"; and every Roster pill reads "Ready" (D9).
- Given the same fixture with 7 other account Goals / When the screen renders / Then both blockers and 5 other Goals show, plus "show more (2)".
- Given the player skips both account blockers / When the screen renders / Then the "All set" banner shows with "(2 skipped)", and neither blocker offers Not for me (D9, D2).

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

The UI thread imports only types from `toolbox-parsers` (as in slice 1), and imports the view layer at runtime through its own package entry, `@idleon-forge/engine/now`, which must import no Detector and nothing from `toolbox-parsers`. The engine's Detectors run in the worker. A lint rule (no deep or barrel imports of the engine root from `apps/activeon/src` outside the worker) and a CI check that greps the built main chunk for the Toolbox licence banner enforce it (same check as M1's).

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
  isPlaying: boolean;       // index === EngineResult.activeCharacterIndex
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
  activeCharacterIndex: number | null;  // from M1; null when unsure, never moves the view
  sessionStartedAt: number | null;      // from M1 SaveHistory.sessionStart (TR-7)
  expectedReturn: { usedSeconds: number; learnedSeconds: number | null };
  stage: { id: string; label: string };
  characters: CharacterResult[];      // in save order
  visitOrder: number[];               // CharacterState.index values, worst Verdict first, then most to spend; M10 freezes it per Play Session (D6)
  account: {
    goals: Goal[];                    // ranked, uncapped, stockpile blockers first; the Spend Plan is not in here
    /** Keys of account Goals (category 'blocker') from M3's account-level Checks, in rank order (D9). Never part of a character Verdict. */
    blockerKeys: string[];
    spendPlan: SpendPlan | null;
    activePlay: ActivePlay[];
    doneThisSession: Done[];
  };
  firstFill: Fill | null;             // earliest across the account
  notCovered: { systemId: string; label: string }[];
  versions: { knowledge: string; gameBuild: number | null; parserTarget: string; parserBehind: boolean };  // parserBehind per M1 D3(b)
  diagnostics: { failedDetectors: { detectorId: string; entryIds: string[]; message: string }[] };
}
```

Engine input, as an amendment to #14's signature: `(accountState, history, knowledge, now, { expectedReturnSeconds })`. Expected Return must be an input, because Verdicts depend on it. Skips and dismissals are **not** engine inputs: they're presentation (TR-3), so golden snapshots stay independent of browser state.

### TR-3 `buildNowView`
`buildNowView(result: EngineResult, prefs: NowPrefs, ui: { focus: number | null; expanded: Set<string>; visited: Set<number>; leftFrom: number | null; frozenOrder: number[] | null; now: number }): NowView` is pure and deterministic. It:
0. Resolves the display order (D6): `ui.frozenOrder` with indexes no longer in `characters` removed and new indexes appended in `result.visitOrder` order; or `result.visitOrder` when `ui.frozenOrder` is null (golden snapshots pass null). This only replays an order the engine produced; it never ranks.
1. Drops Goals whose `nextAction.key` is skipped (unexpired, TR-8) or dismissed (same game build, or unknown build), and counts them per subject.
2. Caps non-blocker Goals at 3 per character and 5 for the account, after step 1, unless that subject is in `ui.expanded`. Character blockers and account stockpile blockers are never capped.
3. Applies the skip rules to Verdicts (D2 for blockers, D7 for a `cannot-tell` Unknown, keyed `unknown@c<index>`), and computes the progress segments and counts, the unskipped account blocker count (D9), `allSet` (FR-25 plus D4, D7, D9), and `nextInOrder` for Focus (FR-12).
4. Computes the "new since unfocused" set (FR-34) from the previous key set, which the caller passes in `prefs.seenKeys`.
5. Computes `nextInOrder` and "n left" from `ui.visited` (the set of indexes that were the played character since `sessionStartedAt`, kept by the caller in session state), and the "Left <name>" line from `ui.leftFrom`.
6. Returns `nextExpiry`, the earliest time a skip can expire or the session can end (the later of a skip's midnight and the current session's possible end, last cloud save + 15 min), so the caller can schedule a rebuild (TR-5).

```ts
export interface NowView {
  progress: { ready: number; fix: number; unknown: number; total: number; segments: VerdictKind[]; label: string };
  allSet: null | { firstFillText: string; skipped: number };
  roster: RosterRow[];               // in Visit Order
  focus: FocusCard | null;
  account: { blockers: GoalView[]; goals: GoalView[]; hiddenCount: number; skippedBlockers: number; spendPlan: SpendPlanView | null; done: Done[] };
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
- Focus is kept in the URL as `?c=<index>`. Player-initiated opens (a row, the strip, Next, a Higher-leverage name) use `history.pushState`; auto-follow and first load use `history.replaceState`, so a session never piles up history entries. Back always returns to the Roster. On reload, a valid `?c=` wins over first-load auto-open; following resumes on the next switch. A bad or missing index falls back to the Roster.
- Time-driven changes don't wait for a save: the caller sets one `setTimeout` for `view.nextExpiry`, and rebuilds the view once a minute for time-relative strings ("about 9h").
- `useNow` moves from `<App>` into `<SaveAge>`, so the per-second tick re-renders only the chip, not the whole tree (slice 1 re-renders the whole app every second).

### TR-6 Where the engine runs
The engine runs **in the parse Web Worker**, right after a successful parse, because M5's hypotheticals call Toolbox math (`getMaxDamage` on a cloned character, #16), which lives in the worker bundle. Every parse request carries the current `expectedReturnSeconds`, so the first result never flips on load. The worker keeps the last parsed state and the engine's Expected-Return-independent output, and on a `{kind:'rerun', expectedReturnSeconds}` message re-runs only the Expected-Return-dependent stage (M3's Verdicts, `firstFill`, Visit Order), not M5's hypotheticals. Re-runs are coalesced (newest wins) and queue behind a parse in flight; meanwhile the chips show the new choice pressed and "updating…" appears (`role="status"`). `EngineResult` must survive `structuredClone` (no functions, Maps, class instances or Dates). Extend `ParseResponse` with `result: EngineResult | { error: string }`.

### TR-7 Done, playing, session
- `isPlaying`, `doneThisSession` and `learnedSeconds` come from the engine and M1 (save history). M10 doesn't diff saves itself.
- **Play Session start**, used for Expected Return expiry, "Done this session" and the visited set: M1's rule (M1 TR-15: a gap of 15 min or more between cloud saves starts a new Play Session), exposed through `SaveHistory.sessionStart` and passed through as `EngineResult.sessionStartedAt`. M10 has no rule of its own.
- **Frozen Visit Order (D6):** on the first `EngineResult` of a Play Session (a `sessionStartedAt` not seen before), the caller stores its `visitOrder` with that `sessionStartedAt` (TR-8) and passes it as `ui.frozenOrder` for every later result with the same `sessionStartedAt`, including after a reload or an Expected Return change. A new `sessionStartedAt` replaces it. A null `sessionStartedAt` (paste mode, no history) freezes on the first result of the page load.

### TR-8 Preferences (localStorage)
- Namespaced by account: `activeon:<uidHash>:` where `uidHash` is the first 12 hex characters of SHA-256(uid). Paste mode uses `activeon:paste:<h>:`, where `h` is a 12-hex hash of the pasted account's character names (computed and kept on the device only), so two pasted accounts don't share choices.
- The first advice render waits for preferences to load (the hash is async), so skipped items never flash. No uid, name or save data is stored in a key or value.
- Keys:
  - `expectedReturn` = `{seconds, chosenAt}`, valid until the next Play Session start;
  - `skips` = `{[key]: {midnightAt, sessionStartedAt}}`, where `midnightAt` is the next local midnight after the skip and `sessionStartedAt` is the Play Session it was made in. A skip is active while `now < midnightAt` or that Play Session is still the current one (D3). Keys are `NextAction.key` for Goals and blockers, and `unknown@c<index>` for a skipped `cannot-tell` Unknown (D7);
  - `visitOrder` = `{sessionStartedAt, order}`, the frozen order of the current Play Session (D6, TR-7);
  - `dismissals` = `{[key]: gameBuild}`; a save whose build is null leaves dismissals as they are;
  - `whatsNew` = `{lastSeenEntryId}` (M12).
- Every read and write is wrapped in try/catch. If storage is unavailable, M10 works with in-memory defaults.
- Changes sync across tabs through the `storage` event (US-11, within 1 s). Writes re-read the map and merge per key, so two tabs don't lose each other's skips. "Clear my data" also posts `cleared` on a `BroadcastChannel('activeon')`; other tabs drop their in-memory preferences and stop writing.
- Expired skips, a `visitOrder` from an older Play Session, and dismissals from older game versions, are pruned on load. Each map is capped at 500 entries, oldest first out.

### TR-9 Invariants checked in development and tests
- Every `Goal` has exactly one `nextAction`, and every `NextAction` has at least one Source.
- No Contested entry is a blocker or the first non-blocker Goal.
- `visitOrder` is a permutation of the character indexes.
- `verdict.kind === 'fix'` ⇔ `blockerKeys.length > 0`.
- Every `account.blockerKeys` entry is the key of an `account.goals` item with category `'blocker'`, those Goals come first in `account.goals`, and no account key appears in any character's `verdict.blockerKeys` (D9).

They throw in tests, and log once in dev builds; production renders anyway.

### TR-10 Report this and Suggestion payloads
- `ReportContext`, `SuggestionContext`, the name scrub and the issue-body renderer are owned by M13's `packages/suggestions` (M13 TR-1). M10 imports them and does not redefine them. M10 supplies the inputs: `outputKind`, entry and Detector ids and field paths from `provenance`, `stale`, `contested`, the screen (`'now'`, `'character'` or `'account'`), class and level, Stage and versions.
- Report text is rendered with M13's anonymous renderer (characters as "<Class> lv <n>"), and any account character name left in free text becomes `[character]` (M13 FR-6).
- **Never included:** character names, uid, email, save data, field values beyond the rendered text (unless the player opts in under M13 D3).
- Pre-M13 GitHub fallback: the same renderer, URLs built with `URLSearchParams`, and the whole encoded URL capped at 7,500 bytes (GitHub rejects much longer new-issue URLs); the action text is truncated first.

### TR-11 Screen states and banner order
The screen state is a pure function of `(SaveState, EngineResult | error)`:

`signed-out` → `waiting` → `parsing` → `broken` (FR-38) | `engine-error` (FR-39) | `ok`.

Banner order: new version available (M12 FR-24), patch (FR-35), offline or sync error (section 6), all set (FR-25). At most one of each. At 320 px, when more than two show, only the first two are expanded and the rest collapse to one line each.

### TR-12 Performance budgets
Measured with the largest public save (11 characters). Engine timings are `vitest bench` runs in Node, kept apart from render timings so shared CI runners don't flake; CI fails at 2× the budget and logs anything over it:
- `buildNowView` under 5 ms.
- First render of the Roster under 50 ms after the result arrives (jsdom-free, in a headless Chrome run).
- The Expected-Return-only re-run (TR-6) under 150 ms in Node; chip tap to updated Verdicts under 300 ms end to end when no parse is in flight.
- `EngineResult` for 11 characters under 200 KB as JSON, so `structuredClone` stays cheap.
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
  - Focus is a region with an `<h2>`. The `<h2>` receives keyboard focus when the **player** opens Focus; an auto-follow never moves keyboard focus (FR-14).
  - Back puts keyboard focus on that character's row.
  - The Verdict strip is a `<nav>` holding a plain list of links, one per character, each with a visible label ("3 · <name>") and an accessible name ("<name>, Fix before you leave"), and `aria-current="true"` on the one in Focus. Tab moves between them; there are no arrow-key bindings (screen readers in browse mode capture arrows).
- **Live regions:**
  - The ticking age chip is **not** a live region. Slice 1's `aria-live` on the ticking header must be removed, or screen readers announce it every second.
  - One polite live region carries **one batched sentence per result**, debounced by about 1 s: the auto-follow ("Now on <name>"), how many Verdicts changed and which, and "All set". Nothing is announced while the window lacks focus.
- **Hit targets:** every control is at least 24×24 CSS px (2.5.8). The 12 px ghost buttons get padding.
- **Contrast fixes (light theme).** Measured on the current tokens:

  | Pair | Ratio | Needed |
  |---|---|---|
  | Source label (`--coin` on `--coin-soft`) | 3.24:1 | 4.5:1 |
  | Ready pill (`--ok` on `--ok-soft`) | 4.14:1 | 4.5:1 |
  | Unknown pill and Stale label (`--unk` on `--unk-soft`) | 4.02:1 | 4.5:1 |

  Darken these foregrounds until each pair passes 4.5:1. The dark theme passes as is (6.3–6.7:1).
- **Not colour alone:** Verdicts always carry their text, and the progress segments carry an `aria-label`. Segment and strip colours meet 3:1 against the background and against each other where adjacent (1.4.11).
- **Expected Return chips** are a radio group (`role="radiogroup"`, arrow keys within it), not `aria-pressed` buttons.
- **Motion:** `prefers-reduced-motion` disables the Focus transition and the scroll animations.
- **Widths:**
  - Works from 320 CSS px (and at 400% zoom of a 1280 px window) up to 480 px, with no horizontal scroll.
  - At ~400 px (the overlay width from #8), long Verdicts wrap the summary line, never the pill.
  - No persistent `position: fixed` chrome covers content, so a later Picture-in-Picture window works. Player-opened dialogs (the M13 form, Clear my data) are exempt.
  - At 320 px, "Ready · 2 skipped" plus the longest class label fits without horizontal scroll (checked in the width matrix).
- **Keyboard:** Enter or Space opens a row; Esc closes Focus.

### TR-15 Golden snapshots
`renderNowText(buildNowView(engine(fixture), emptyPrefs, {focus:null,…}))` yields a stable plain-text screen:

```
3 of 5 Ready · fix 1 before you leave
1. <c3> Squire lv43 · Mining Copper · Tunnels Entrance · FIX · Food runs out in about 2h
…
ACCOUNT
- Spend · Stamps: Upgrade … [wiki · 2.3.540]
```

It is committed per **public or view fixture** under `packages/engine/test/now/__snapshots__/`. Snapshots of `fixtures/private/*` saves are written to the gitignored `__snapshots__/private/`, and CI fails if a committed snapshot names a private fixture: even without names, Stage, levels and coin amounts from a friend's account must not reach the public repo. Names are replaced by `<c{index}>` in every snapshot. Knowledge Base PRs show advice diffs through these files (#11.12). Component tests (Vitest + Testing Library + jsdom) cover the user stories on the view fixtures, and axe runs on each state.

## 6. States and edge cases

| State | What the Now screen shows |
|---|---|
| **Signed out, no paste** | Slice-1 sign-in plus the paste fallback. No advice shell. |
| **Waiting for first save** | Header ("no save yet"), then 3 skeleton rows and "Waiting for your save…". After 30 s: "Open the game, or switch character, to trigger a cloud save." |
| **Parsing / engine running** | First load: skeleton rows. Later saves: the current view stays, with no flicker, and a small "updating…" next to the age chip. A newer save supersedes an older parse (slice-1 sequence guard). |
| **Broken parse** (input / empty / shape / crash) | FR-38. Nothing advice-shaped renders, even with a last good save. Suggest stays available. |
| **Engine throws** | FR-39. Error boundary; names and activities only. |
| **Some Detectors fail** | Those characters show Unknown ("Can't tell from the save"). The `diagnostics` count shows in the footer: "2 checks failed · Report". |
| **Stale patch** (new build with failed sections, M1 D3(b)) | FR-35 banner; advice still shown. A new build with no failed sections gets the footer note only. |
| **Game build unknown** (`_vars` side read failed) | Footer shows "game build ?"; dismissals are kept as they are; no patch banner. |
| **Knowledge Base entries Stale** | FR-19 marking; no banner. |
| **Nothing covered yet** (M10 ships before M3–M9) | Every Verdict is Unknown, with reason `not-covered` ("Not covered yet: AFK safety"). The progress bar is hidden while every Unknown is `not-covered`. "Not covered yet" lists every System. This is honest and expected during the build order. |
| **All Ready** | FR-25 banner; the progress bar label reads "safe to log off". |
| **All Ready, account stockpile firing** | No All-set banner; the Account section leads with "Fix before you leave"; the label adds "fix S in Account"; every pill stays Ready (D9). |
| **Visit Order reshuffles mid-session** | The Roster, segments and Next keep the order frozen at the Play Session's start; Verdicts and summaries update in place (D6). |
| **Character with no AFK Target** (`afkType` Nothing) | Activity "Doing nothing"; the engine decides the Verdict (most likely Fix). |
| **New character created mid-session** | A new row is appended at the end of the frozen Visit Order (D6); it takes its ranked place from the next Play Session. No skips carry over, because keys use the index. |
| **Character deleted or reordered** (indexes shift) | Skips and dismissals keyed to a missing index are pruned; a shifted index may misapply one skip until it expires. Accepted risk, see red team #7. |
| **Offline or sync error** (`navigator.onLine === false`, the Firestore listener reports offline, or a sync error with a good last save) | Banner: "Offline: showing your last save from 14:02." (or "Can't reach your save right now: showing your last save from 14:02."). Advice stays, with its age; Report and Suggest fall back to "Copy report text". |
| **Game closed** (last save over 30 min old at open) | Roster, not Focus; no "● playing" marker; M1 FR-27's hint. Following starts with the first switch. |
| **Save very old** (age > Expected Return) | The age chip turns to the warning style; advice is still shown, since the AFK Setup it judges is still in place. |
| **Paste mode** | The "pasted" chip; no "playing" marker and no auto-follow, since there is no live switch; "visited" means opened by hand (FR-12); the paste preference namespace (TR-8); Suggest per M13 D6. |
| **Multiple tabs** | Each tab runs its own listener and worker (accepted cost). Preferences sync through `storage` events. Only M1 decides who writes save history. |
| **Second account** (sign out, then another Google account) | Preferences are namespaced by uid hash, so nothing carries over. The Focus URL param is dropped on sign-out. |
| **localStorage blocked** | In-memory preferences; a one-line note in the footer: "Can't remember your choices in this browser." |
| **11 characters** (the maximum) | The Roster stays one column (11 rows, one summary line each). The Verdict strip items wrap as many to a line as fit their labels, at most 3 lines at 320 px, and the strip never scrolls sideways. |
| **Played a different character than Next suggested** | Focus follows the game; that character becomes visited; Next still names the worst unvisited one (FR-12). |
| **Very long names or labels** | Ellipsis on the activity · map line; the name wraps; the pill never shrinks. |
| **Learned Expected Return over 24 h** | Shown as its own chip ("≈30h"). |
| **Clock skew** (save time in the future) | Ages clamp at 0 (as slice 1 does); ETAs use the engine's `asOf`, never `Date.now()`. |
| **What's new data missing or corrupt** | The card is skipped silently; versions are still recorded. |

## 7. Dependencies

| Module | M10 needs | Interface |
|---|---|---|
| **M1 Sync & Account State** | `SaveState`, `lastGood`, `activeCharacterIndex`, the game build and M1's "newer than any build parsed cleanly" flag for `parserBehind` (M1 D3), save history for done, learned Expected Return, `SaveHistory.sessionStart` (M1 TR-15), "clear my data" (M1 FR-23). **Gaps for M1:** a request to expose the account's game daily-reset time (R3; D3 uses local midnight until a later ruling replaces it), and the recorded A → B → C switch fixture (FR-14 gate). | `useActiveOn()`, `AccountState`, `SaveHistory` |
| **M11 Knowledge tooling** | Knowledge Base version string, System registry with display labels (for Not covered yet), Source schema incl. https-only URLs. | `@idleon-forge/knowledge` exports `version`, `systems` |
| **M2 Stage & Meta Path** | `stage` for the view and the report payload. | in `EngineResult` |
| **M3 AFK Safety** | Verdicts, blockers, `firstFill`, Expected Return as an input, and the account-level stockpile blockers (M3 FR-24/FR-25) as `account.blockerKeys` per M3 D3 (D9 here). | `Verdict`, `Fill`, `AfkSafetyResult.account` |
| **M4 Purpose & Milestones** | `purpose`, `Milestone`, `no-purpose` suggestion. | `PurposeLine` |
| **M5 Higher-leverage options** | `higherLeverage`. | `HigherLeverage` |
| **M6 Unspent & idle** | Goals and Next Actions of category spendable and compounding. | `Goal` |
| **M7 Spend Plan** | `spendPlan`. | `SpendPlan` |
| **M8 Collections, M9 Builds** | Goals and Next Actions; Contested items (for example 2nd Squire builds). | `Goal` |
| **M12 Release** | App version, `whats-new.json` per M12 TR-7 (entries with ids, newest first, in three groups), and the "New version available, reload" signal (M12 FR-24). | static assets |
| **M13 Suggestions** | `openSuggestionForm(type, context, prefill?)`, the signed-in check, and the `ReportContext` / `SuggestionContext` types, builders and name scrub from `packages/suggestions` (M13 TR-1). M10 supplies the inputs (TR-10). Until M13 ships, M10 uses the GitHub issue-form fallback. | `packages/suggestions`, `apps/activeon/src/suggestions/` |
| **Repo setup (#7)** | Issue forms `kb-correction.yml` and `idea.yml` must exist with fields M10 can pre-fill. | GitHub issue forms |

The engine's ranking (#26) and the `EngineResult` shape are shared contracts. A change to TR-2 needs a note on this spec and on the producer module's spec.

## 8. Decisions

D1–D5 ruled by Yasser on 2026-10-17 (PR #44): every recommendation accepted as written. The red-team follow-ups R1–R5 and the M3 D3 alignment were ruled the same day (PR #44) and are folded into D3, D4 and D6–D9.

- **D1 - Focus is the resting view and follows the game.** Focus opens on the played character at load and moves to each newly played character a save reveals; the player can go back to the Roster, which then stays put until the next switch. Saves that don't change the played character never move the view. *Why:* the game cloud-saves on a character switch, so the screen arrives on the right card by itself; with "Next: switch to X →" it is the closest thing to a guided session without touching the game. Touches FR-10, FR-12, FR-14, US-3, TR-5.
- **D2 - Blockers can be skipped, not dismissed.** Skip today is allowed on a Verdict blocker; a character whose every blocker is skipped counts as Ready, shown as "Ready · n skipped". Not for me is never offered on a blocker; Report this always is. *Why:* a wrong blocker otherwise makes "All set" unreachable for the session; "n skipped" keeps it honest; refusing a patch-long dismissal stops a safety warning being silenced for weeks. Touches FR-7, FR-8, FR-28, FR-29, US-20, TR-3.
- **D3 - Skip today lasts until local midnight or the end of the Play Session, whichever is later** (R3, replacing the original "next game daily reset, else local midnight"). M1 is asked to expose the account's daily-reset time (section 7). *Why:* a Play Session often spans local midnight, and a skip made at 23:30 should not come back at 00:00 in the middle of that session; "until next session" alone would bring an item straight back after a short break before midnight. Touches FR-28, TR-3, TR-8, US-11, section 7.
- **D4 - Only "Fix before you leave" and Unknown `cannot-tell` block "All set".** Unknown for `no-purpose` or `not-covered` does not. *Why:* the banner promises safety; "can't tell from the save" is a safety doubt, "what is this character for?" is not, and during the build order everything is `not-covered`, so a strict rule would never show the banner. The progress label still shows the Unknown count. Touches FR-9, FR-25, US-21, TR-3. *Red-team note (#1), confirmed as R1:* the rule stands, but while AFK safety itself is `not-covered` the banner drops the words "safe to log off" (FR-25), since nothing has checked safety yet. The softer wording stays until AFK safety is covered.
- **D5 - Rows show the character's name, then class and level.** *Why:* players think in names ("switch to Grumbo"), and two Squires are ambiguous by class alone. Names never leave the device (TR-10) and snapshots replace them (TR-15). Touches FR-4, US-1.
- **D6 - Visit Order is frozen for the Play Session (R2).** The Roster, the progress segments and Next use the engine's `visitOrder` from the session's first result; later saves update Verdicts and summaries in place but never reorder rows. New characters are appended; deleted ones drop out. A new Play Session takes the engine's order afresh. *Why:* a list that reshuffles on every save makes "Next" and the row numbers unreliable mid-session (red team #3); freezing replays an engine order, so ranking stays engine-owned (section 9 #5). Touches FR-4, FR-9, FR-12, TR-2, TR-3, TR-7, TR-8, US-2, section 6.
- **D7 - Skip today is allowed on an Unknown `cannot-tell` (R4).** The skipped character shows "Unknown · skipped", stays Unknown in the progress count, and no longer blocks "All set", which then counts it in "(n skipped)". Not for me is never offered on it; Report this always is. The skip follows D3. *Why:* one Detector that can't read a section on patch day would otherwise make "All set" unreachable for the session with no way past it (red team #11); the skip is visible and short-lived. Touches FR-7, FR-25, FR-28, FR-29, TR-3, TR-8, US-21.
- **D8 - No "Following the game" toggle yet (R5).** Focus-follows-game (D1) ships with no opt-out; the never-mid-interaction rule (FR-14) is the guard. *Why:* the toggle is a cheap later addition if the first sessions show friction; shipping it now adds a setting nobody has asked for. Touches FR-14, US-3, section 9 #8.
- **D9 - Account stockpiles block "All set" but never a Verdict (M3 D3).** M3's account-level stockpile blockers (Arcade balls, liquids at cap) lead the Account section under "Fix before you leave", uncapped, and "All set" needs none of them firing unskipped. They never change any character's Verdict, pill or Roster row, and get no progress segment; the label adds "fix S in Account". Skip today and Report this are offered, Not for me is not, as for character blockers (D2). *Why:* saying "safe to log off" while the Arcade has been full for 48 h is false (M3 US-6), and pinning a stockpile on an unrelated character would make it "Fix before you leave" for something it has nothing to do with. Touches FR-8, FR-9, FR-16, FR-23, FR-25, FR-28, FR-29, TR-2, TR-3, TR-9, US-22, sections 6 and 7.

## 9. Red-team notes

1. **A wrong blocker traps the session.** A buggy Check flags "Fix before you leave" on a correct setup, "All set" never shows, and the player stops trusting the screen. *Defence:* D2 (a skippable blocker that counts as Ready, shown as skipped), Report this on every blocker, the done bar's "no wrong Verdict blocker on either golden snapshot", and TR-15 snapshots in every Knowledge Base PR.
2. **Advice from a half-broken save.** Toolbox silently returns an empty account or falls back on sections, and the screen happily shows "All set". *Defence:* FR-38 renders nothing advice-shaped on any failure kind; partial Detector failures turn only those characters Unknown, with a footer count (FR-39); `AccountState.warnings` feed `cannot-tell`, never Ready.
3. **Privacy leak through reports.** A Report or Suggestion carries a character name, or the action text embeds one (for example "Switch to Grumbo"), into a **public** GitHub issue. *Defence:* TR-10's allow-list payload; the engine templates must refer to characters as `{char}` and M10 substitutes "<character>" in report text; a unit test greps every report body for every name in the fixture; the UI warns "posted publicly".
4. **Third-party leaks.** Google Fonts sees every visit; a malicious Knowledge Base PR adds a `javascript:` or tracking URL as a Source. *Defence:* self-hosted fonts (TR-13), https-only links with `noreferrer`, M11 schema validation, and CODEOWNERS review on `packages/knowledge`.
5. **The UI quietly re-ranks.** A component sorts or filters "for neatness", and the screen drifts from the engine and the golden snapshots. *Defence:* all ordering and capping lives in the pure `buildNowView`; components render arrays in order; TR-9 invariants; snapshots are built from `NowView`, not from the engine output.
6. **Patch breakage looks like advice.** After a game patch the parser is behind and numbers shift subtly; advice is confidently wrong. *Defence:* FR-35 banner whenever `parserBehind`; Stale marks per entry; requires M1 to make versions comparable (section 7). If M1 can't, the banner falls back to "the parser pin is N days old" (risk flagged).
7. **Keys drift.** Keys use the character index, so deleting a character shifts indexes and a skip lands on the wrong character. A Knowledge Base change that renames an entry id revives dismissed items. *Defence:* skips expire at the first local midnight after the session ends at the latest (D3); dismissals expire on the next patch anyway; M11 must keep entry ids stable, with renames via an alias list. Low impact by design.
8. **Auto-follow fights the player.** Focus jumps while the player reads another character. *Defence:* it follows only on a played-character **change** (D1), never on the 4-minute periodic save; never while the player is interacting with the card (FR-14, a "Now playing · go" chip instead); never steals keyboard focus; uses `replaceState`. A "Following the game · stop" toggle remains a cheap addition if the first sessions show friction; it is not in this release (D8, R5).
9. **Screen-reader and overlay misery.** The ticking age chip spams announcements; at 400 px the pill crushes the summary; the light theme's source label fails contrast. *Defence:* TR-14 removes `aria-live` from the ticker, measured contrast fixes, a 320–480 px test matrix, and axe in CI per state.
10. **Expected Return is ignored or misunderstood.** The player never taps it, the 8 h default hides an overnight 12 h fill, and they come back to a capped inventory. *Defence:* the learned default from history (FR-27), the chips always visible in the header, and the All set banner states the first fill time explicitly ("fills up in about 9h"), so a mismatch with real plans is obvious.

## 10. Red-team log

Independent red-team run on 2026-10-17 against this spec, the glossary, the ADRs, slice-1 code (PR #28), the prototype and the M1, M12 and M13 draft specs (PRs #43, #45, #42). Each finding was checked against that evidence before a verdict. 26 findings: P0 1, P1 16, P2 7, P3 2. Verdicts after the 2026-10-17 rulings: fixed 25, fixed in part with the rest deferred 1 (#11, Stale-per-patch semantics to M11), deferred 0, rejected 0 (one sub-point of #18 rejected). Every item that needed Yasser is ruled:

| Ruling | Item | Outcome |
|---|---|---|
| R1 | #1 wording | Keep the softer wording until AFK safety is covered (FR-25, D4). |
| R2 | #3 freeze Visit Order | Frozen per Play Session (D6). |
| R3 | #8 D3 fallback | Skip lasts until local midnight or the end of the Play Session, whichever is later; M1 asked to expose the daily-reset time (D3, section 7). |
| R4 | #11 skipping a `cannot-tell` Unknown | Allowed (D7). |
| R5 | #6 follow toggle | Not in this release (D8). |
| M3 D3 | Account stockpiles | Block "All set", lead the Account section, never change a Verdict (D9). |


| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| 1 | P0 | "All set: safe to log off" shows while AFK safety isn't checked at all (every Unknown is `not-covered` during the build order, and D4 lets that through). | Fixed | FR-25 exception: no "safe to log off" wording while AFK safety is `not-covered`; US-9 case; D4 kept. Ruled R1: softer wording kept until AFK safety is covered. |
| 2 | P1 | D1 assumes the switch save reveals the new character; the newest-`PTimeAway` rule (Toolbox `talents.ts`, M1) was only checked on static fixtures. | Fixed | FR-14 signal is M1's `activeCharacterIndex`, null never moves; a recorded A → B → C switch fixture gates the build, with a follow-on-next-save fallback; US-3 case. |
| 3 | P1 | "Next" counts from wherever Focus auto-opened, so the worst characters are never reached; Visit Order reshuffles on every save. | Fixed | FR-12: Next names the worst **unvisited** character from the top; "n left" counter; visited set from `activeCharacterIndex`; US-2 cases. Ruled R2: Visit Order frozen per Play Session (D6, TR-3, TR-7, TR-8). |
| 4 | P1 | The save that confirms work on A also moves Focus to B, so A's result is lost. | Fixed | "Left <name>: n done · Verdict · ← back" line on the new card (FR-10, FR-14), announced. |
| 5 | P1 | `pushState` on every auto-follow fills history and breaks Back; reload vs auto-open undefined. | Fixed | TR-5: `replaceState` for auto-follow and first load; Back always to the Roster; a valid `?c=` wins on reload. |
| 6 | P1 | Auto-follow can unmount the control in use, drop keyboard focus and jump the scroll (WCAG 2.4.3). | Fixed | FR-14 never swaps the card mid-interaction ("Now playing · go" chip), never moves keyboard focus, anchors scroll; TR-14. Ruled R5: no stop toggle in this release (D8). |
| 7 | P1 | Contradicts M1: 60 vs 15 min session rule, `isPlaying` vs `activeCharacterIndex`, banner rule and comparable versions (M1 D3), Clear my data and sign-out. | Fixed | TR-2, TR-7, FR-35, FR-36, FR-40, US-15 and section 7 now consume M1's rules and fields; banner text uses the build number. |
| 8 | P1 | M1 exposes no daily reset, so D3's local-midnight fallback is the real rule and brings skips back mid-session. | Fixed | Ruled R3: a skip lasts until local midnight or the end of the Play Session, whichever is later (D3, FR-28, TR-8, US-11); M1 asked to expose the daily-reset time (section 7). |
| 9 | P1 | Contradicts M13: Suggest placement, signed-out behaviour, screen enum, context shapes, name placeholder, overlay, broken-parse Suggest. | Fixed | TR-10 imports M13's `packages/suggestions` types and scrub; FR-3, FR-31, US-13, TR-14 and section 6 follow M13. |
| 10 | P1 | Contradicts M12: three What's new groups and `lastSeenEntryId`; the reload banner is missing. | Fixed | FR-37, TR-8, US-16 adopt M12's contract; TR-11 adds the reload banner and the 320 px rule for stacked banners. |
| 11 | P1 | Patch day: every entry turns Stale at once, Not for me revives, `cannot-tell` blocks All set with no way past it, null build undefined. | Fixed in part | Dismissals keyed to the game build and kept when it is null (TR-8, section 6). Stale-per-patch semantics deferred to M11 (they are the glossary's and the Knowledge Base's); ruled R4: Skip today allowed on a `cannot-tell` Unknown (D7, US-21). |
| 12 | P1 | Golden snapshots of private saves could be committed to the public repo. | Fixed | TR-15: private snapshots go to a gitignored folder; CI fails on any committed private-fixture snapshot. |
| 13 | P1 | Skip expiry and time-relative text never re-render without a save. | Fixed | TR-3 returns `nextExpiry`; TR-5 sets a timer and rebuilds once a minute; US-11. |
| 14 | P1 | 300 ms Expected Return budget unrealistic (full engine re-run, worker contention); first result flips on load. | Fixed | TR-6: Expected Return in every parse request, re-run only the dependent stage, coalesced; TR-12 splits Node bench from render, adds a 200 KB result cap. |
| 15 | P1 | Verdict strip as `<nav>` + arrow keys doesn't work in browse mode; dots are colour-only; "6 + 5" wrap contradicts the prototype. | Fixed | TR-14: list of labelled links, `aria-current`, Tab only; FR-10; section 6 wrap rule rewritten. |
| 16 | P1 | One save or chip tap can flip many Verdicts, queueing many announcements; auto-follow isn't announced. | Fixed | TR-14: one batched, debounced sentence per result, silent while unfocused. |
| 17 | P1 | Opening with the game closed lands on a stale "you are on this character" card. | Fixed | FR-14 and FR-4: auto-open and "● playing" only when the last save is under 30 min old (M1 FR-27); section 6 row; US-3 case. |
| 18 | P2 | Skipped blockers make All set and Visit Order look dishonest. | Fixed | FR-25 adds "(n blockers skipped)". Moving skipped-Ready characters down the order rejected: ordering stays engine-owned (section 9 #5). |
| 19 | P2 | A transient sync error blanks all advice, while offline keeps it. | Fixed | FR-38 and section 6 treat a sync error with a good last save like offline. |
| 20 | P2 | Account work has no refresh path but "switch character", which triggers a follow. | Fixed | FR-32 names the in-game Cloud Save button; FR-14 anchors scroll. |
| 21 | P2 | The 6,000-character body cap ignores URL encoding; long GitHub URLs fail. | Fixed | TR-10 caps the encoded URL at 7,500 bytes, truncating action text first; US-12. |
| 22 | P2 | One barrel import could pull the 6 MB parser into the main chunk (ADR 0006, 25 KB budget). | Fixed | TR-1: separate `@idleon-forge/engine/now` entry, lint rule and main-chunk CI check. |
| 23 | P2 | Clear my data and cross-tab writes race; shared paste namespace; skipped items flash before preferences load. | Fixed | TR-8: BroadcastChannel `cleared`, per-key merge, hashed paste namespace, first render waits for preferences. |
| 24 | P2 | The tab-title count never fires beside the game, because the window stays visible. | Fixed | FR-34 counts while `!document.hasFocus()`. |
| 25 | P3 | Roster, Focus, Verdict strip and Account section aren't glossary terms; "Focus" collides with keyboard focus. | Fixed | Section header lists them as local terms, to be added to the glossary with the build; "keyboard focus" spelt out. |
| 26 | P3 | WCAG details: 1.4.11 for segments, `role="status"` for the hint, radio group for chips, pill fit at 320 px. | Fixed | TR-14 and FR-32. |

