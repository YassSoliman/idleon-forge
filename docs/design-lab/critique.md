# ActiveOn Design Lab: adversarial critique

Scope: all 53 components and 146 variants in `index.html`, at 390 and 1280 px, light and dark, in Quest Log, Field Guide and Command Board. Scores (1-5, ten tests) per variant are in `critique.json`. Screenshots: `shots/crit/`, `shots/crit-sheets/`, `shots/recheck-*`, `shots/final2-*`.

Contract check: passed. No game sprites or bitmaps embedded, no real character names (checked against the private denylist and save name lists), no outside hosts except Google Fonts and plain links, no horizontal scroll at 390 or 1280, no console errors.

## Top 10 issues

1. **Who and where look alike.** The class glyph that says who is a pin-shaped mark sitting next to the red map pin that says where, and each group draws characters differently: chibi portraits on the Now screen, tiny weapon marks on Cards, other marks plus C1-C6 slot codes in Flows. *Fix:* One glyph family for who (the class chibi at 16 px), the map pin only for where, and no slot codes on screen.
2. **Invented numbers sit on the recommended variants.** '~10 s' and '~30 s' fix times, the ghost of last session, the better-fit '+12% fish/h', the session recap and the 8-step fill scale are not in any export. They are labelled as mocks, but they are on the counter banner, the step hero and the Roster row, the variants most likely to be built. *Fix:* Ship with real data or the words 'time not known'; get fix durations into the Knowledge Base before the build.
3. **Who / where / how long is often three empty tokens.** Most account Goals read 'any character · place not given · time not known'. The principle passes in form and fails in content: the line says nothing. *Fix:* Hide an unknown token instead of printing it, and file the missing places and times as Knowledge Base work.
4. **Pixel text is too small to read.** Quest Log draws kickers, pills and table heads in pixel caps at 8 to 11 px ('1 SKIPPED', 'BEFORE YOU LEAVE', 'GROW', ledger heads). Its letter-spaced pills squeeze the action text beside them to three or four words a line at 390 px. *Fix:* Pixel faces only at 16 px and up, never for body text or anything under 12 px; no letter-spaced caps on pills.
5. **Tap targets under 44 px.** The Focus mini-strip character buttons are 30 px on every Focus variant; footer links, '#12' links, the coin badge, NEW dots, checkbox rows and 'Sign out' chips are 18 to 32 px tall. *Fix:* A 44 px minimum on every control; make whole rows the link.
6. **Jargon and mixed units leak onto card faces.** 'tier 2, +20% All Food Effect', '1 dementia', 'Lv 1,307', and three currency formats in one Spend Plan list ('100M coins', '1 dementia', 'about 1 gold 26 silver'). Report form lists save field paths. *Fix:* One currency format (coins with a short suffix), no tier words, field paths only in the bug-report body.
7. **The same words repeat.** Roster rows say 'Send Royal Guardian Lv 1,307 to an AFK Target' under the Royal Guardian name; the self-ticking checklist repeats 'Equip the Yum Yum Desert set' per character; on Command Board the row truncates to 'Send Death Bringer Lv 1,292 to an AF...'. *Fix:* Never repeat the row's own name in its action, and never truncate the verb's object; group instead.
8. **Some variants break the one-next-step rule.** Path of stones marks two steps NOW; the character-sheet Focus pushes its hero step below the fold; kind-seal Goal cards keep a 'Why?' on every face. *Fix:* Exactly one NOW per Walkthrough, and the why behind the sheet, never on the face.
9. **Broken layouts.** Seven tall frames showed up to 500 px of blank space while their sheet was closed; the Stop-here line split ': 19 of 15k' onto its own line; 'Now screen' was titled twice. These three are fixed on this page. Still open: the progress-filled card's fill edge cuts through words, the faded-board clock watermark sits on text, the ledger's cost column clips at 390 px, and the three-blank form truncates its placeholders. *Fix:* Fixed here: blank frames, split line, double title. The rest are design calls for the spec.
10. **Command Board is a layout, not a look.** At 390 px Command Board reads as Field Guide in dark with mono numbers. Its real ideas (lanes, heat grid, ledger, pilot checklist, letter tiles) appear in a handful of components and need width. *Fix:* Make it the desktop and power-session layout of the chosen direction, not a third skin.

## Recommended pick per component

| Component | Pick | Runner-up | Why |
|---|---|---|---|
| `now.header` | One-line header (4.5) | Header that becomes the verdict | Puts the verdict about 60 px higher; the save age is the only extra. |
| `now.stage-badge` | World crest (4.1) | Needs as a Goal | Plain 'World 3, early' with its two steps one tap away. |
| `now.return-chips` | Learned default, no picker (4.7) | Chips with consequence | An opinionated default with one Change button; add the consequence line. |
| `now.verdict-banner` | Counter that reaches zero (4.3) | Per-character roll-up | Best 3-second answer; use real fix times or say 'time not known'. |
| `now.roster` | Grouped jobs on top (4.2) | Needs a fix first, ready folded | The only Roster that survives the late-game save without repeating a sentence 8 times. |
| `now.roster-row` | Three-token line (4.1) | Pill-free row with a cap count | Who, where and how long on every row, with the verb on line two. |
| `now.verdict-pill` | Glyph stamp (4.5) | Verdict with time | Passes the greyscale test; long form only in Focus. |
| `now.cap-pills` | Optional tag (4.3) | Urgency + kind + verb | 'Optional' ends the 'All set' vs 'Anvil full' contradiction; group 3+ characters. |
| `now.spend-chip` | Fold into one spend card (4.3) | Spend as the row's next step | One Spend card instead of a coin on every row. |
| `now.verdict-strip` | Pager with the next fix (4.4) | Progress strip | 'Next: Barbarian 56 · fix' is the one next step. |
| `now.focus-card` | Current-step hero (4.2) | Before-you-leave checklist | One current step with who/where/how long and a bar that fills from the save. |
| `now.focus-identity` | Plain "you are here" (4.2) | Portrait plate | One line, no extra art, position '1 of 6'. |
| `now.focus-purpose` | Quest line (4.3) | Milestone ladder | The long game in one line with real numbers. |
| `now.focus-unknown` | Hidden from the count (4.5) | Magnifier note | Unknowns don't block 'All set' and don't pretend. |
| `now.focus-better-fit` | Quiet hint (4.2) | Will give you | Never competes with the step; ship only with a real engine result. |
| `now.focus-footer` | Primary next (4.5) | Auto-advance prompt | One big Next button. |
| `now.info-lines` | Fold into caps (4.3) | Timeline tick | One place for caps, not two. |
| `now.class-portrait` | Family set (3.9) | Hat-swap blob | Recognisable family chibis, all ours; enlarge the letter badges. |
| `cards.goal-card` | Action-only card (4.4) | Kind seal, no mono tag | One sentence and three tokens, so five Goals fit on a phone. |
| `cards.why-sheet` | Bottom sheet, delta first (4.3) | NPC speech | Opens on what you get, then who/where, why and Sources. |
| `cards.source-label` | Verified date (4.5) | One human line | 'checked 17 Oct' is honest about age in plain words. |
| `cards.contested` | Badge only (4.3) | Split card | Keeps the card one line tall; both sides wait in the why. |
| `cards.action-controls` | Zz snooze (4.4) | Hold to confirm Not for me | Skip is free and quiet; hold-to-confirm lives in the sheet. |
| `cards.goal-details` | Glyph chips (4.3) | Self-ticking checklist | Who as glyph chips with the map under each. |
| `cards.goal-list` | Ranked with one winner (4.5) | Now / Before you log off / Next session | One winner, the rest muted and numbered. |
| `cards.shared-job` | One trip, map by map (4.5) | Batch card | One trip, map by map: 'where' for the whole batch, sentence said once. |
| `cards.walkthrough` | Pinned current step (4.5) | Stepper with three-state needs | Only the current step on the Now screen; the list is a sheet. |
| `cards.walkthrough-step` | Progress bar step (4.4) | Equip token | Big held/need and 'to go'; maths muted below. |
| `cards.requirement-tree` | Flat need list (4.4) | Recipe card | Only what's missing, as 'N more'. |
| `cards.spend-plan` | Best buy, then save up for (4.2) | One trip | One best buy, one save-up; fix the mixed currency formats. |
| `cards.spend-line` | Split paragraph (4.2) | Tier coins | Payer and cost on one line, 'Bring first' under it. |
| `cards.builds` | Named findings (4.3) | Spellbook pages | What is wrong, then the verb; Verdict-changing rows first. |
| `cards.printer-plan` | Slot grid (4.3) | Three-step mini Walkthrough | Shows the one slot that changes. |
| `cards.account-section` | Summary header (4.4) | Any-character tray | Collapses the 7,000 px Account section to one header. |
| `cards.if-you-have-time` | Extra seal, muted (4.3) | Time-boxed menu | Muted, at the bottom, one line each with the time. |
| `cards.not-covered` | One honest line (4.7) | Count chip | One honest sentence; never changes the Verdict. |
| `flows.sign-in` | Out of the way (4.6) | Code card | Sign-in never sits above advice. |
| `flows.paste-save` | Drop zone (4.4) | Clear failure | One big target; borrow the failure copy for errors. |
| `flows.loading` | Skeleton of the real layout (4.4) | Blob walking | Skeleton of the real layout, nothing jumps. |
| `flows.empty` | Next action empty (4.6) | Sleeping blob | Every empty state names the next thing to do. |
| `flows.cant-read` | Use last good (4.6) | Gremlin | Labelled fallback to the last good save, never a silent swap. |
| `flows.cant-work-out` | Fallback roster (4.5) | Report prefilled | Keeps the Roster's shape while advice is paused. |
| `flows.stale` | Stale-first banner (4.7) | Faded board | Save age first, with its fix. |
| `flows.banners` | Toast once (4.6) | Notification tray | One toast, then a dot. Never a nag. |
| `flows.suggest-form` | Kind picker first (4.5) | Three-blank sentence | Sort by kind first, then one question. |
| `flows.report-form` | Pick what's wrong (4.7) | Two-tap public notice | Four chips and an optional line. |
| `flows.your-suggestions` | Plain list (4.2) | Quest board | Scans in a second; make each row the link. |
| `flows.footer` | Fan disclaimer (4.5) | Plain footer | Says who made it, who didn't, and that it is read-only. |
| `flows.clear-my-data` | What it clears (4.5) | Hold to clear | Answers 'will this touch my game?' before the button. |
| `flows.whats-new` | Inline new dots (4.5) | Patch notes scroll | Changes explain themselves where they live. |
| `flows.session-checklist` | Auto tab (4.6) | Quest scroll | Picks the pause point from context; nothing to set. |
| `flows.afk-timeline` | Compact strip (4.4) | Lanes on phone | One strip with class marks and a 'back' flag fits a phone. |
| `flows.away-card` | Scaled welcome (4.6) | Share image | The welcome scales with time away. |

## Recommended direction: Field Guide

Field Guide is the base: it reads in three seconds in both themes, keeps body text readable, and puts pixel art only where it says what kind or what state. It is closest to today, so build risk is lowest.

- Borrow from **Quest Log**: the scout-hat guide (NPC speech) for the why, pixel display type for headings and end states at 16 px and up, parchment palette for celebrations. Its 8-11 px pixel caps and letter-spaced pills fail the read at 390 px.
- Borrow from **Command Board**: lanes, heat grid, ledger and the pilot checklist as the desktop / power-session layout. On a phone it reads as Field Guide in dark, so it is a layout, not a third skin.

## Fixed in index.html during this pass

- Seven tall demo frames left up to 500 px blank while their sheet was closed (count chip, action-only, flat needs, more chip, pinned step...): frames now collapse until a sheet opens.
- Stop-here flag: ': 19 of 15k portal kills' wrapped onto its own line; now one sentence.
- 'Now screen' was titled twice (shell header + part header); the duplicate is hidden.
- Pick badges filled (component bar and the What's next table), every variant badge shows Pick / Runner-up / Keep as a state / Drop with its score and one note, a Critique section and nav link were added, and the copy that promised the critique was updated.

Still open (design calls for the spec, not patched): progress-filled card's fill edge cuts words; faded-board clock watermark over text; ledger cost column clips at 390 px; three-blank form truncates placeholders; 30 px Focus mini-strip buttons and other sub-44 px targets; the sticky lab toolbar takes about 100 px on a phone; the page is ~150k px tall at 390 px.

## Next steps

1. Approve the direction: Field Guide as the base, with Quest Log's NPC why and pixel display type kept for headings, celebrations and the sign-in guide; Command Board becomes the desktop layout.
2. Go down the Pick column: keep each suggestion, choose another variant, or say none. Ties are marked runner-up so they can be merged (for example counter banner + stale-first wording, optional tag + account finding).
3. Fix the data before the build: real fix durations, places and times for account Goals in the Knowledge Base, one currency formatter, and no '~' estimates on card faces.
4. Lock the system rules into the spec: one who-glyph family, pixel type 16 px and up only, 44 px targets, no repeated names in actions, one NOW per Walkthrough.
5. Write the Now screen spec from the picks first (header, verdict banner, Roster, row, pill, caps, Focus), red-team it, then build it in small slices behind the current app.

Note: `index.html` edits are applied by `build/apply_critique.py` from `build/index.pre-critique.html`; if `build/assemble.py` regenerates the page, re-run `build/critique_json.py` then `build/apply_critique.py`.
