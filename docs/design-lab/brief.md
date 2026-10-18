# ActiveOn Design Lab: design brief

Date: 2026-10-18. Inputs: `research/games.md` (12 game companion tools), `research/industries.md`
(9 product categories), `research/visual-language.md` (measured IdleOn look, palettes, fonts, pixel
guide), `research/ui-audit.md` (49 components, 20 UX problems at `969267e`) and the four view-model
exports in `data/`. Vocabulary follows the repo's `GLOSSARY.md` (Now screen, Roster, Focus, Verdict,
Verdict strip, Goal, Next Action, Walkthrough, Spend Plan, Build, Source, Expected Return, Visit
Order, AFK Setup, AFK Stretch, Play Session, Parallel Slot).

Scope rulings: this is a private design exploration. Nothing in the app or repo changes. Real data comes
only from the scrubbed exports, which use slot and class labels (Char1, "Bowman 60"), never real names.
All art is our own IdleOn-style pixel art (ADR 0009); game sprites in `ref/` are references only and are
never embedded.

Citation key used below: **G#** = `games.md` ranked pattern #, **I#** = `industries.md` ranked pattern
#, **VL§** = `visual-language.md` section, **A#** = `ui-audit.md` UX problem #. Owner principles are
quoted as **OP**.

---

## 1. The job, in one sentence

At a pause point in a Play Session, tell the player in 3 seconds whether it is safe to log off and, if
not, the one next thing to do, for which character, where, and how long it takes.

The audit's headline problem is that the current screen never gives that answer at the top. On a phone,
the first "what do I do" sits about 400 px down, under the wordmark, three chip rows, a developer
sign-in card and a 12 px progress label (A1, A2). Every principle below is a way of fixing that without
losing the depth that power players use.

---

## 2. Design principles (12)

Each principle is written as a rule a component can be checked against. The "Test" line is how a
reviewer checks a mock.

### P1. Answer first
The top of the Now screen is a single verdict sentence plus one count that must reach zero ("2 fixes
before you leave"), and then the first Next Action. Nothing promotional, explanatory or developer-facing
sits above it.
- Traced to: Melvor CanIIdle, a yes/no per thing (G7); YNAB's "Ready to Assign" counter (I2); Apple
  Live Activities, one heavy line that grows only when there is more to say (I10); Paimon.moe's
  unfocused front door as the anti-pattern (games §15.5); audit A1, A2.
- Test: on a 390 px phone, with any of the four data files, the verdict and the first action are both
  visible without scrolling, and a stranger can say aloud what to do.

### P2. One next step, and it is the product
Every Goal shows exactly one Next Action. The Focus card leads with one current step that fills as the
save shows progress and gets replaced when the save proves it is done. There is no "mark done" button.
- Traced to: Zygor and RestedXP's single current-step frame with auto-advance (G1); Duolingo's single
  path (I3); Quest Helper's pinned current-step overlay (games §1.2); OP "one next step per Goal".
- Test: no card shows two imperative sentences at the same weight.

### P3. Who, where, how long, every line
Each action line carries three tokens in a fixed order: a class glyph with a slot or level ("Bowman 60"),
a map pin with the place ("The Mimic Hole"), and a duration ("about 10 min"). If one of the three is
unknown, the line says so; it does not silently drop it.
- Traced to: OP "every line says who, where, how long"; RestedXP's Active Item button, the one thing to
  use as an inline token (games §3.1); Melvor ETA and TimeRemaining (G10); audit A13, the inconsistent
  who/where.
- Test: count the who/where/time tokens on every visible action line; any missing token is a defect
  unless shown as "time unknown".

### P4. Two levels, no more
Level 1 is the action line. Level 2, behind a single labelled tap ("Why?"), holds the why, the "will
give you" delta, the Sources and the controls. Anything deeper (Walkthrough, Spend Plan, Requirement
Tree) opens as its own sheet or view, never as a third inline disclosure.
- Traced to: NN/g progressive disclosure, which finds usability drops beyond two levels (I6); Path of
  Building's "Allocating this will give you:" deltas (G4); OP "the why sits behind a tap"; audit A7 (the
  why is always visible and doubles card height) and A16 (native `<details>` nested three deep).
- Test: no tap target reveals another tap target that reveals content inline.

### P5. Every warning carries its fix
A warning is never just a state. Pill grammar is **colour = how urgent, pixel icon = what kind, text =
the fix verb** ("Anvil full · collect"). There is a neutral grey "fine, nothing to do" state, so empty
never reads as alarm. Caps that do not affect the Verdict are visibly marked optional.
- Traced to: YNAB's Available pills and icons (I5); DIM Loadout Analyzer's named findings with one
  action (G3); NN/g's guidance that validations must say how to fix (games §15.4, I-§9); Toolbox's "X is
  full" as the anti-pattern; audit A14 (an "All set" banner next to six "Anvil full" pills, with nothing
  saying they are optional).
- Test: every pill, banner and Fix line contains a verb the player can do in game.

### P6. Time is one language
Every duration uses the same format everywhere: relative by default ("in 2h 10m"), with clock time one
tap away ("around 20:10"), set once as a preference. Time-until-full and time-until-out-of-input appear
side by side. When time is compared across characters, it is drawn as length on a shared axis, never as
rings.
- Traced to: HoYoLAB Real-Time Notes and RuneLite Time Tracking (G5); Android Live Updates' rule of the
  same format collapsed and expanded (I10); NN/g on length and position for quantities (I-§9);
  ServiceTitan and Samsara lanes (I4); audit A18 (the return chips have no context).
- Test: grep the mock for duration strings; one pattern only.

### P7. One job, many characters: group it
When the same Next Action appears on several characters, it collapses into one grouped card ("Collect
and re-place traps · 7 characters") with the characters as glyph chips, and the rows show only a small
marker. Repeated pills fold into one roster-level finding that is also a filter.
- Traced to: DIM findings as filter pills (G3); RestedXP location batching (G12); ServiceTitan status
  badges that are filters (I7); audit A5 (in the late-game save, 7 of 11 rows carry the same traps line
  and all 11 carry the same two pills).
- Test: with `data/latest.json`, no sentence appears more than twice on the first screen.

### P8. Stable places; state by colour plus glyph plus word
The Roster keeps one order through the session (Visit Order computed when the session starts, then held
still), so a player learns where each character is. Urgency moves as colour, rim and icon, not as row
reordering. Status is never colour alone: always a glyph and a word too.
- Traced to: Home Assistant's fixed grid for spatial memory (I9); NN/g on colour blindness and
  preattentive cues (I-§9); VL§3.3 ("status is never carried by colour alone"); audit A15 (no avatar or
  class glyph to anchor the eye).
- Test: greyscale the mock; every Verdict is still readable.

### P9. Hard caps and one winner
Each surface shows a fixed maximum (3 Goals per character, 5 account Goals, 5 Spend lines, 3 pills per
row, 7 log-off items) with the rest behind "More (n)". Inside a ranked list, exactly one item is the
highlighted winner ("Best buy now") and the rest are muted.
- Traced to: Streaks' deliberate cap (I14); Things' Today view (I11); Cookie Monster's single green best
  buy, with the seven-colour legend as the overwhelm (G6, games §15.3); aviation and WHO checklists of 5
  to 9 items (I1); audit A4 (account cards outrank character work) and A6 (controls on every card).
- Test: count the highlight colour per list; it must be one.

### P10. Quiet, kind controls
"Skip today" is free slack: one tap, a small Zz mark, and the Goal returns tomorrow without nagging.
"Not for me" is hold-to-confirm and says what it changes ("We won't suggest Worship on Squire 85").
"Report this" lives in the Why sheet, not on the card face. Sources read as one human line ("IdleOn Wiki:
Worship"), with credits and versions behind it.
- Traced to: Duolingo's Streak Freeze as slack (I12); YNAB's Zz snoozed state (I-§2b); Streaks'
  hold-to-complete (I-§1c); Fitbod swaps that teach the coach (I-§4b); Zygor's "skip to next incomplete"
  (G11); audit A6 (three controls plus a two-line Source on every card) and A11 (credits and parser
  versions on every card).
- Test: the card face carries at most one control; Report is at least one tap deep.

### P11. The save is the checklist, and it is honest about age
Play Sessions have named pause points: Log in, Rounds, Log off. The log-off list shows only unmet AFK
Setup items and ticks them itself after the next cloud save. The save's age sits next to the verdict,
and a stale save changes the verdict's wording, not just a hint line.
- Traced to: aviation's DO-CONFIRM and WHO's pause points (I1); HoYoLAB's honest "about a 1-hour delay"
  (games §8.3); Paimon.moe's plain caveats (games §6.3); Melvor Welcome Back scaled to time away (G14);
  AGENTS.md's "empty parse is an error"; audit A14 (the stale save says "All set").
- Test: render `data/scrubbed-w3-stale.json`; the top of the screen must say the save is old before it
  says anything is safe.

### P12. Earned delight in our own pixel art
Pixel art is a signifier (what kind of thing, which world, which tier), not wallpaper. It celebrates
end states: a campfire when everyone is set, a small cheer when a Walkthrough finishes, a gremlin when
the save can't be read. All art is ours, drawn to the house style, and recolours through tokens.
- Traced to: Quest Helper's opt-in celebration (G15); Duolingo's milestone animations (I-§1b); RestedXP
  theme packs as texture sets over one layout (games §3.4); VL§1 and VL§5 (grid, outline, palette
  limits); ADR 0009 and the LavaFlame2 findings (VL§2).
- Test: each pixel motif on screen answers "what kind" or "what state"; none is decorative only.

Two cross-cutting rules sit under all twelve:
- **Phone first.** Design at 390 px and check at 320 px. Wider screens get more columns, not a wider
  column (A19). Tap targets are 44 px or more.
- **No tier jargon, player's words.** No "Visit Order", "Stage", "parser targets" or mono-caps tags on
  the card face (A11, A12). The Stage shows as a world badge; what the next Stage needs is one tap away.

---

## 3. One component set, three directions

All three directions render **the same components from the same view model** (`NowView`, see
`inventory.json`). A direction is a token set (`tokens.css`, scoped by `[data-direction]`) plus a small
number of signature treatments, where the same component switches one rendering slot (frame, speech
bubble, lane). That is the RestedXP theme-pack lesson (games §3.4): skins over one layout, so the advice
engine and the component logic never fork.

| | Quest Log | Field Guide | Command Board |
|---|---|---|---|
| Token scope | `[data-direction="quest"]` | `[data-direction="field"]` | `[data-direction="board"]` |
| One-line intent | Feels like the game's own quest panel | A calm, well-made companion app | Every character at a glance, for power sessions |
| Density | Comfortable | Comfortable | Compact (about 1.6x the rows per screen) |
| Display font | Pixelify Sans 600-700 | Pixelify Sans 500 (wordmark and heads only) | Geist 600, with Silkscreen column heads |
| Body font | Atkinson Hyperlegible Next | Atkinson Hyperlegible Next | Geist |
| Numbers | Jersey 15 (big), JetBrains Mono | JetBrains Mono, tabular | Geist Mono, tabular; VT323 session clock |
| Corners | Notched pixel corners (clip-path), radius 0 | Soft radius 12 px | Tight radius 4 px |
| Default theme | Dark (night panel); parchment light | Follows system | Dark |
| Hero view | Quest board Now screen with NPC speech why | Answer-first Now screen | AFK Timeline |

### 3.1 Quest Log (IdleOn-native)

**Intent.** Make ActiveOn feel like a panel the game forgot to ship. The coach is a guide NPC: our own
mascot, a round-eyed blob in a scout hat. It speaks the why in a navy speech box, and the Now screen
reads like a quest board.

**Mood.** Night-time game panel: deep navy, a steel bevel, a bright accent rule, gold coin accent, white
pixel caps with dark outlines. By day it turns to parchment and ink. Goofy and warm, never grimdark.
Measured from the game's frames (VL§1.3, VL§1.4) and rebuilt in CSS, not copied.

**When a player chooses it.** Players who love the game's look and want ActiveOn to feel like part of it;
younger and casual players for whom the NPC voice makes advice friendlier; anyone sharing a screenshot in
the community Discord. It is the most "IdleOn" and the least dense.

**Signature component treatments**
- *Verdict banner*: a framed quest panel titled in outlined pixel caps ("ALL SET" / "2 FIXES LEFT"). The
  all-set state shows a 32 px campfire with a "zZ" loop at 4 fps; the fix state shows a bell with a wrench.
  The count is set in Jersey 15 at 32 px.
- *Back in about chips*: hourglass glyph chips that look like the game's tab tiles (a pixel-rounded
  tile, a white caps label with an outline); the pressed chip gets the accent rule underneath.
- *Roster rows*: each row is a mini panel with a 24 px class portrait in a world-coloured frame at the
  left, a Verdict stamp in Silkscreen ("READY" / "FIX"), and cap pills drawn as item icons with a count
  badge.
- *Focus card*: a quest scroll. The current step is the lit line with a red-to-green fill bar (G1); the
  Purpose is shown as "Quest: 19 portal kills · next 15k".
- *Goal cards*: quest entries with a kind seal (Fix = bell, Spend = coin stack, Grow = star pip,
  Extra = chest). Tapping "Why?" opens the **NPC speech box**: a navy box with a 1 px gap ring, a stepped
  pixel tail and a Silkscreen name tag. It holds the why, a "will give you" line, and Sources as small
  signposts.
- *Walkthrough*: a path of stepping stones between map signposts (Duolingo path, I3); NOW is the lit
  stone, AFTER stones are dim; finishing it plays the cheer.
- *Spend Plan*: a merchant's ledger, with the best buy stamped in gold and tier coins as pixel coins.
- *Flows*: the "Can't read your save" gremlin, the sleeping blob for empty, a quest-scroll Session
  Checklist with wax-seal ticks.

**Guardrails.** Pixel fonts only at 16 px and up, or at their 8 px grid; body and why text stay in
Atkinson (VL§4). No game logo, no traced sprites, no named NPCs (VL§2, VL§5.6). Motion stays at 2-4 frame
loops and stops under `prefers-reduced-motion`.

### 3.2 Field Guide (calm modern companion)

**Intent.** The default. Closest to today's app, but answer-first and far more polished: a quiet,
trustworthy coach a parent could read over a shoulder. The pixel accents are small and meaningful.

**Mood.** Warm paper by day, ink-blue slate by night; generous white space; one coin-amber accent;
teal for Ready and brick for Fix. It feels like a well-made field notebook. It is not cream with a serif
and terracotta: the type is a humanist sans, and the pixel wordmark gives it its character.

**When a player chooses it.** Most players, most of the time: a quick check on a phone before logging
off, with no learning curve and the least visual noise. It is the safe default for new players and for
anyone who finds pixel styling hard to read.

**Signature component treatments**
- *Verdict banner*: a full-width sentence card in Atkinson 700 at 24 px ("2 fixes before you leave"),
  with the count as a large tabular number, save age as a muted line ("save read 1 min ago"), and the
  first Next Action inline as a primary button-row (P1). It grows to show per-character one-liners only
  on tap (G7).
- *Back in about chips*: a segmented control with one sentence of context ("Plans for 8h away · Anvil
  on Bowman 60 fills first, around 01:40").
- *Roster rows*: a 16 px class glyph, name, class and level, then a Verdict word with a glyph (check /
  wrench / question). Cap pills are compact chips with a 16 px icon, a severity colour and the fix verb.
  The Spend chip shrinks to a coin icon with a count (A8).
- *Focus card*: a sheet-style card with the current step on top (who / where / how long), a thin progress
  fill, then up to 3 Goal cards. Account content is not appended below (A3).
- *Goal cards*: a kind marker as a 4 px left rule plus a small word ("Fix", "Grow"), never mono caps
  (A12). The why sits in a bottom sheet on a phone and a popover on desktop.
- *Walkthrough*: a vertical stepper with three-state requirement checks (have / in storage, go get it /
  missing; G2), real progress bars for held/need, and steps grouped by map (G12).
- *Spend Plan*: a table-like list; payer, cost, levels and status in fixed columns; one "Best buy now"
  row highlighted (G6); "save up for" shows the wait.

**Guardrails.** One accent colour; pixel art only at icon size, in the wordmark and in the one NPC bust on
empty and error states. No gradients, no glass.

### 3.3 Command Board (dense, glanceable)

**Intent.** A dispatch board for the account. For a long Play Session with many characters, it answers
"who needs me first, who is idle, what overflows before I'm back" by position and length, not by
reading (I4, G13).

**Mood.** Dark control room: near-black, crisp 1 px lines, tabular numbers, one amber accent, status
colours used sparingly and always with a glyph. Calm under load: it is dense, not noisy. Light mode is a
clean grey ops sheet.

**When a player chooses it.** Late-game players with 8 to 11 characters (the `latest.json` case), players
on a desktop or tablet who keep ActiveOn open next to the game, and anyone doing a long "rounds" session
who wants the whole account on one screen.

**Signature component treatments**
- *Header*: status count badges that are filters ("0 Ready · 10 Fix · 1 Unknown"; I7), the save age as a
  live mono timer, and the Expected Return as a draggable "back at" marker on the timeline axis.
- *Verdict banner*: a single status strip ("10 to fix · first overflow now · Arcade balls") with the
  count in Geist Mono.
- *Roster*: the **AFK Timeline**. One lane per character, a class glyph at the lane head, and bars to each
  cap on a shared axis from now to the Expected Return. Anything that overflows before the return marker
  gets a red outline. An "Unassigned" tray holds idle characters and empty Parallel Slots (I8).
- *Roster rows (list mode)*: a grid of compact rows in fixed columns: slot, class and level, Verdict
  glyph, AFK Target icon, first cap with time, and the next action truncated to one line.
- *Grouped findings*: shared jobs and repeated caps sit in a findings bar that doubles as a filter
  ("Anvil full · 11"; G3, P7).
- *Goal cards*: rows, not cards. The why opens a side panel on desktop and a sheet on a phone, with a
  "will give you" delta in green and red (G4).
- *Spend Plan*: a ledger table with a running total column per payer and a mini bar for cost against
  coins held.
- *Session Checklist*: a two-column pilot checklist ("Traps · 7 characters ........ 3 left").

**Guardrails.** Still phone-usable: on a phone the lanes stack, time runs left to right inside a
horizontally scrollable strip that snaps to "now", and the page body never scrolls sideways. The
"simulate all" wall is the anti-pattern (games §15.2): show the winner and the runner-up, not every
metric.

---

## 4. New view concepts (from research)

1. **Session Checklist** (Log in / Rounds / Log off). Three pause points (I1, aviation and WHO). Log
   in is a READ-DO list of what changed while the player was away. Rounds holds the Goals. Log off is a
   DO-CONFIRM list of unmet AFK Setup items (7 at most), which ticks itself after the next cloud save and
   ends on the verdict. The tab is picked from context, so there is no switch to set (P11).
2. **AFK Timeline** (a dispatch board for characters). Lanes per character, bars to each cap, a "now"
   line and a "back at" marker; whatever overflows before the return is outlined. It is Command Board's
   hero view, and the other two directions use it as a compact strip (I4, G5, G13).
3. **Away card** (a Live Activity-style return summary). One heavy line ("Back in about 2h 10m"),
   rotating through the next cap on each character; segments show how many characters are still
   working. On return it scales to the time away: nothing under 15 min, one line up to 2 h, a full
   "While you were away" card after 8 h (I15, G14).

## 5. What we will not do

Settings longer than the product; "simulate all" walls; rainbow legends; alerts without a fix; a front
door made of unrelated cards (games §15). Also no streak guilt (I-§1b): ActiveOn is casual-first.
