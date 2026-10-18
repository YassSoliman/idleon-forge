# M21 Redesign release: the Design Lab system, 1:1

**Status.** Build-ready spec, 2026-10-18. It covers one release: the whole ActiveOn app redrawn in the Design Lab's design system, with every pick, the owner's five overrides and each pick's critique note applied. It also adds two Build features (the full Build path, and Star Talents) and a new place, the Map. Terms follow [`GLOSSARY.md`](../../GLOSSARY.md). Decisions follow [ADRs 0001–0009](../adr/), mainly 0005 (Toolbox numbers), 0006 (client-only SPA, parsing in a Web Worker), 0007 (generated facts, authored judgment) and 0009 (our own art, never game art).

**Owner ruling (2026-10-18, in substance).** "All your design picks are top tier, I love them. Implement this entire design system, all your picks specifically, 1:1 in the app, and adapt all the functionality so it works like a charm. Even the ones you didn't pick look so good, so let's keep them all in our collection of design items, but go for mostly your picks." Overrides, where a runner-up or another variant wins:

| Component | Critique pick | Owner's choice |
|---|---|---|
| What's new (`flows.whats-new`) | Inline new dots | **Patch notes scroll** (runner-up) |
| Your suggestions (`flows.your-suggestions`) | Plain list | **Quest board on top, Plain list for the rest** |
| Empty states (`flows.empty`) | Next action empty | **Sleeping blob** (runner-up) |
| Loading / waiting (`flows.loading`) | Skeleton of the real layout | **Blob walking** (runner-up) |
| Everything else | the pick | the pick, with its critique note applied |

**Inputs.**
- The Design Lab, private (2026-10-18): `brief.md` (12 principles P1–P12), `tokens.css` (three directions), `critique.md` + `critique.json` (v1: 53 components, 146 variants) and `v2/critique.md` + `v2/critique.json` (v2 System views: 32 components, 106 variants), `inventory.json` and `v2/inventory.json`, `parts/` and `v2/parts/` (each component's HTML, CSS and JS) and `art/` (213 of our own pixel-art SVGs). That is 85 components and 252 variants in all. Phase F copies it to two places (TR-1): the data-free parts go into the repo, and the renders, which embed scrubbed save data, go to a local private folder.
- The app at `origin/main` `6dfaefc`, with M19 and M18 Gear & Tools merged (PR #116, which brought the `lazyPart` lazy-chunk pattern).
- The M9 Build view (M9 "Build view"), M17 views, M18, M19 and M20 specs. Research for the Star Talents (§5.3, Sources).

**How to read.** §3 is the design system as testable rules. §4 is the gap audit: every Design Lab component with what gets built, then every current app component with its design, and the components that had no design, with their design specified here. §5 holds the functional requirements by area, §6 the user stories, §7 the technical requirements, §8 states and edge cases, §9 the phase plan with file boundaries and effort. §11 lists the self-ruled decisions and the **Owner review** (at most five questions). §12 is our own adversarial pass; §13 the independent red-team log (0 P0, 8 P1, 16 P2, 9 P3; 31 fixed, 2 fixed in part).

## 1. Purpose

ActiveOn's advice is right, but it reads like a long list of cards. A player at a pause point has to scroll to find out whether they can log off, and the same sentence shows up on six characters. Players can't see a character's whole build, and most of the account's Systems are text, not pictures. This release puts the answer first: one count to bring to zero, then one next step with who, where and how long. Repeated jobs are grouped, and every System gets a picture with the step lit. It is all drawn in our own IdleOn-style pixel art and a calm, readable type system that works on a phone. For builds, every character shows its entire Build path on every tab and preset, the Star Talent tab included. The steps the known points pay for are coloured, and the steps after them stay visible with the running point total. So a player who just collected forty talent points from levels or the Vault knows at once where they go.

## 2. Scope

**In scope (one release, R-M21).**
- The design system in code: three token sets (Field Guide as the base, Quest Log accents, Command Board as the desktop layout), self-hosted fonts, our pixel art as a typed component library, and shared atoms (pills, the who-glyph chibis, buttons, chips, sheets, token lines, meters, formatters).
- Every current place, tab, System page, form and state redrawn to its Design Lab pick (or the owner's override), with the pick's critique note applied.
- The Design Lab concepts the app doesn't have yet: the pause points (Log in, Rounds, Log off), the Away card, the compact AFK strip on Now, the Parallel Slots grid, the Stamps, Statues and Vault System pages, and the **Map place** with its map sheet.
- **Full Build path** (owner request): every Build step, in order, per tab and per preset, colour-banded by what the known points pay for, with the cumulative points at each step.
- **Star Talents** (owner request): star-talent data per character and preset, sourced star Builds per class line and role, the same full-path display, and the Account State fields behind it.
- The collection: every variant, picked or not, kept in the repo's data-free Design Lab archive (TR-1).

**Out of scope.**
- A user-facing direction switch (Quest Log or Command Board as a skin). The token sets ship and are tested, but no switch (D-1).
- New advice beyond the Build features, the Map's door times and the one Star Talent Goal (D-13). Pictures that would need an engine rule nobody has written stay "not covered yet": the Prayer loadout, the Town map hub's in-game placement, and the bubble levelling for Worlds 4 and up.
- Game art of any kind (ADR 0009). The Design Lab's `ref/` sprites are never opened by a build agent and never copied.
- Elite (tab 4) and Super Talent Builds. They show as plain levels, as today (M9). Worlds 5 and up.
- Swipe gestures (the critique dropped every swipe variant as undiscoverable). Native share or image export (`flows.away-card` "Share image" is archived, not built).

## 3. The design system (rules every component is checked against)

The twelve Design Lab principles are requirements here. Each rule below has a test that a reviewer or CI runs. "Lab" means the Design Lab; `component.id` refers to its inventories.

### 3.1 Principles carried in as rules

| # | Rule | Test |
|---|---|---|
| DS-1 (P1) | On a 390 px phone, with any fixture, the Verdict count and the first Next Action are visible without scrolling. Nothing promotional, explanatory or developer-facing sits above them. | QA probe at 390 × 844 on the four fixtures (TR-16). |
| DS-2 (P2) | Each Goal shows exactly one Next Action. Each Walkthrough has exactly one NOW step. The save ticks steps done; there is no "mark done" button (the guild rows keep M20's manual tick, which is a fact the save can't show). | Unit test over `NowView` and the Walkthrough view: one `now` per Walkthrough. |
| DS-3 (P3) | Every action line carries who, where and how long, in that order. A **known** token shows; an unknown one is **hidden**, never printed as "place not given" or "time not known" (critique v1 #3, v2 #5). "Any character" is hidden too. Only the Walkthrough step and the Spend line may say "time not known", because there the time is the point. | View test: no rendered action line contains "place not given", "Any character" or "time not known" outside those two components. |
| DS-4 (P4) | Two levels, no more. Level 1 is the line. Level 2 is one sheet (the why sheet, the map sheet, a picture's tap sheet). Anything deeper (Walkthrough list, Requirement Tree, Spend Plan) opens as its own sheet or view, never a third inline disclosure. No native `<details>` nested inside another. | DOM test: no `details details`; no sheet opens a sheet inline. |
| DS-5 (P5) | Every warning carries its fix verb. Pill grammar: **colour = urgency, glyph = kind, text = the fix verb** ("Anvil full · collect"). A grey "fine" state exists. A cap that doesn't change the Verdict carries the word "optional". | Copy test over pill labels: each has a verb from the fix-verb list; Ready rows' caps carry "optional". |
| DS-6 (P6) | One time language (TR-6): a future moment is "in 14h 04m", a past one "8h 30m ago", effort "about 10m". Clock time ("around 20:10") is one tap away, or the default if the player sets it once in Settings. Time across characters is length on a shared axis, never rings. | Golden grep: no "about 14h" for a moment; one formatter module; a lint test that no component formats a duration itself. |
| DS-7 (P7) | The same Next Action on two or more characters is one grouped card with glyph chips. With three or more, the repeated pill is one roster-level finding that is also a filter. On the late-game fixture, no sentence appears more than twice on the first screen. | QA probe on `latest` (11 characters). |
| DS-8 (P8) | Places don't move. The Roster keeps the Visit Order frozen at session start (M10). Urgency moves by colour, rim and glyph, never by reordering. Status is never colour alone: glyph plus word too. | Greyscale QA shot: every Verdict still readable. |
| DS-9 (P9) | Hard caps: 3 Goals per character, 5 account Goals, 5 Spend lines, 3 pills per row, 7 log-off items, 3 rows in any list behind a picture. The rest sit behind "More (n)". In a ranked list, exactly one item is the winner and the rest are muted. | View tests on the caps; one `winner` per list. |
| DS-10 (P10) | Quiet controls. "Skip today" is one tap with a Zz mark and a "2 skipped today · show" line. "Not for me" is hold-to-confirm (1 s) and lives in the why sheet, saying what it changes. "Report this" is in the why sheet's overflow menu, never on a card face. A Source reads as one human line with a verified date ("IdleOn Wiki · checked 17 Oct"). | DOM test: a card face has at most one control. |
| DS-11 (P11) | The save is the checklist and is honest about its age. The save age sits next to the Verdict. A stale save changes the Verdict's wording: it says the save is old before it says anything is safe. | `scrubbed-w3-stale` story (US-3). |
| DS-12 (P12) | Pixel art is a signifier (what kind, what state, which world or tier), never wallpaper. It celebrates end states. It is ours (ADR 0009) and recolours through tokens. | Art guard test (TR-4): every rendered art id is in the library; the library imports only `docs/design-lab/art`. |

### 3.2 System rules from the critiques

| # | Rule | Source |
|---|---|---|
| DS-13 | **One who-glyph family.** Every place a character is drawn uses the one `WhoGlyph` atom (the "Family set" chibi on the blob ramp, critique v1 pick `now.class-portrait`, v2 issue 1). There is no per-group colour override. The map pin means *where* only; a who-glyph is never pin-shaped. There are no slot codes (C1–C6) on screen. | v1 #1, v2 #1 |
| DS-14 | **Pixel faces at 16 px and up only.** Pixelify Sans, Jersey 15, Silkscreen and VT323 never go below 16 px, never set body or why text, and are never letter-spaced on pills. | v1 #4 |
| DS-15 | **44 px targets.** Every control, link and row link is at least 44 × 44 px, or the whole row is the link. The known offenders get fixed: the header overflow button, the Focus strip's 30 px buttons, footer links, "#12" links, the payer chips (28 px), the "+2 sources" chip (24 px), the report overflow (32 px), checkbox rows (24 px), the NEW dots (18 px), the Sign out chip (32 px) and chevrons (20 px). | v1 #5, v2 contract |
| DS-16 | **No jargon on card faces.** No "tier 2", "Visit Order", "Stage" (the world badge says it), "parser targets" or mono-caps tags. There is one currency format: coins with a short suffix ("100M coins") from `formatCoins`, never tier names. Field paths appear only in a bug report's body. | v1 #6 |
| DS-17 | **Never repeat the row's own name** in its action ("Send Royal Guardian Lv 1,307 to …" under "Royal Guardian"). Never truncate a verb's object: wrap it, or group the rows. | v1 #7 |
| DS-18 | **A step is about 12 words with one verb.** The detail goes in the sheet. The Knowledge Base copy pass (#112) did most of this; FR-F9 checks the rest. | v2 #4 |
| DS-19 | **Units on every number** ("215 points", "45 levels behind", "1 of 4 slots"). No bare "215+" or "far". | v2 #10 |
| DS-20 | **Pictures label only the lit element and the best three.** Everything else shows its value in the tap sheet. No text under 12 px anywhere, except the 11 px legal line in the footer. | v2 #7 |
| DS-21 | **State classes are scoped to their component** (`.alchemy-pots .is-now`, never a bare `.is-now`). This is why the Star Chart's lit star was clipped in the Lab. | v2 #8 |
| DS-22 | **Desktop-only views have a named phone fallback.** World strip → Gate-first. Gear heat strip → worst-slot list. Card plan board → per-character card rack. Split desktop frame → Step first. | v2 #10 |
| DS-23 | **No invented numbers.** A Lab mock value ("~10 s", "+12% fish/h", the ghost of last session) ships only when the engine computes it. Otherwise the token is hidden (DS-3) or the variant waits (the Better fit "will give you" delta stays text until M5 computes a delta). | v1 #2 |
| DS-24 | **Data honesty on Build points.** Unspent points are lower bounds (M9 TR-7). Every number the Build path shows is "at least N" or a cumulative cost, never an exact "you have N". | M9 FR-10 |

### 3.3 Directions and tokens

- **Field Guide is the base** of the whole app (critique "Recommended direction"): warm paper by day, ink-blue slate by night. It has one coin-amber accent, teal for Ready and brick for Fix. Body, labels and why text are set in Atkinson Hyperlegible Next, numbers in JetBrains Mono (tabular), and the wordmark and section heads in Pixelify Sans. The radius is 12 px.
- **Quest Log accents**, scoped to these components only, as the critique lists them: the **NPC why** (our scout-hat guide blob and a navy speech box inside the why sheet), **pixel display headings** (Pixelify Sans 600–700 at 16 px and up for place and section headings), and **celebrations** (the parchment palette and pixel frame on the All set card, the Walkthrough-finished cheer, the campfire). They apply through `data-direction="quest"` on those subtrees, which picks up Quest Log's tokens there and nowhere else.
- **Command Board as the desktop power layout.** From 1000 px up, the components that have a Command Board layout use it (§4.1 "Also built"). That means lanes, the heat strip, the ledger, the two-column log-off list, the world strip, side panels and the split System page frame. They keep **Field Guide's colours and fonts** and take only Command Board's density and layout tokens (`--row-height: 40px`, `--lane-height`, `--axis-hour`, `--density: 0.75`). The critique says it plainly: "a layout, not a third skin".
- **All three token sets live in code** (`apps/activeon/src/design/tokens.css`), each scoped by `[data-direction]` with light and dark values. Each is contrast-tested in CI (TR-15). The root carries `data-direction="field"`.
- **Theme.** The app follows the system theme by default. Settings offers System / Light / Dark, which sets `data-theme` on the root, in the Lab's `:root[data-theme]` pattern. The Lab's per-frame `data-mode` attribute was only for side-by-side demos and isn't ported.
- **Direction switch: not now** (D-1). A dev-only `?direction=quest|board` query parameter exists for QA screenshots. It is read once, never stored, and never shown.

## 4. Gap audit

### 4.1 Every Design Lab component, and what gets built

The **Built** column names the variant the app implements: **P** is the pick, **O** the owner's override. The **Apply** column turns the pick's critique note ("Pick · why") into a requirement. **Also built** lists the variants the critique marks "keep as a state", "keep as the desktop layout" or "merge into the pick"; they are built as part of the pick. Every other variant (runner-ups not merged, and the drops) lives only in the collection archive (TR-1, D-2). **Area** is the PR that builds it (§9): F Foundation, N Now and flows, C Characters, S Systems, T Time, M Map and nav, I Integration.

**Now screen (v1 group `now`)**

| Lab component | Built | Apply | Also built | Area |
|---|---|---|---|---|
| `now.header` | P One-line header | The wordmark on the left and one save-age chip on the right ("save read 1 min ago", or "pasted · …", or "last good save · …"). Family level, versions, Suggest, Settings and Sign out move into one overflow menu, whose button is 44 px (the note's one sub-44 px target). | the states live, pasted, last good, reconnecting, "updating…" and stale, as chip text | N |
| `now.stage-badge` | P World crest | "World 3 · early" as a crest chip. One tap opens a sheet with the next Stage's steps (`stage.needs`), whose rows are 44 px tall (the note: checkbox rows under 44 px). | "Progress as pips", as the Command Board micro badge from 1000 px | N |
| `now.return-chips` | P Learned default, no picker | One line: "Back in about 8h · Change". Add the consequence sentence from "Chips with consequence": "Plans for 8h away · the anvil on Bowman 60 fills first, in 3h 40m". Change opens a sheet with the chips as a radio group. | "Clock time, set once", as a Settings preference | N |
| `now.verdict-banner` | P Counter that reaches zero | "2 fixes before you leave": a big number plus the sentence, with the first fix inline as a button row (who · where · fix). Fix times show **only when the Knowledge Base has a real `fixSeconds`** for that Check; otherwise the time token is hidden (DS-3, DS-23). At zero it reads "All set: safe to log off", with the campfire and the first fill time. | Its stale state uses the "Stale-first wording" ("Your save is 8h 28m old: press Cloud Save, then check again", with the verdict demoted to "last known: 2 fixes"). "Tappable segments" is the pager's dots | N |
| `now.roster` | P Grouped jobs on top | A "Same job on N characters" card collapses each repeated summary, and rows show a small marker instead of the sentence. Fix the name repeated in the action (DS-17). | "Needs a fix first, ready folded": Ready rows fold into one line of glyphs ("4 ready") when there are 6 or more characters. "Lanes" is the Command Board roster from 1000 px. "Portrait grid" (a Command Board overview idea) is archived: Characters' health matrix answers the same question | N |
| `now.roster-row` | P Three-token line | Line 1: who (WhoGlyph + "Bowman 60"), where (pin + map), how long. Line 2: the verb. The class glyph and the map glyph must differ (DS-13). The fix time follows the verdict-banner rule. | "Pill-free row with a cap count", as the 320 px layout ("2 full" coin stack) | N |
| `now.verdict-pill` | P Glyph stamp | Glyph plus word (✓ Ready, wrench Fix, ? Unknown, Zz Skipped). Long form only in Focus. No 8 px pixel caps: the stamp word is Atkinson 12 px bold. | — | F (atom), N |
| `now.cap-pills` | P Optional tag | Caps on a Ready row read "optional". Merge with "Account-level cap finding": at 3+ characters, one roster-level finding ("Anvil full on 6 · collect") that is also a filter, and rows show a marker only. | "Urgency + kind + verb" grammar (DS-5) as the pill anatomy | F (atom), N |
| `now.spend-chip` | P Fold into one spend card | One Spend card lists payers as glyph chips; no coin chip on rows. Payer chips are 44 px (the note says 28). | — | N |
| `now.verdict-strip` | P Pager with the next fix | "← prev" plus "Next: Barbarian 56 · fix", with dots for the count. "prev" is a quiet link, but still 44 px. | "Portrait strip": a tap on the dots opens it as a sheet of 44 px rows (never a long-press, which is undiscoverable) | N |
| `now.focus-card` | P Current-step hero | One step with who, where and how long, and a fill bar from the save. The mini-strip buttons become the pager (44 px). Fix times follow the banner rule. The pixel kicker is gone (DS-14). | "Before-you-leave checklist" is the Log off pause point (§5.1). "Bottom sheet" is the phone container for Focus from the Roster | N |
| `now.focus-identity` | P Plain "you are here" | One line: class, activity, map and "1 of 6 · 5 left". No extra art. | "Follow toast" ("Now playing Squire 51 · go") as the follow chip | N |
| `now.focus-purpose` | P Quest line | "Push World 3 · 19 of 15k kills · in 14h 04m" (DS-6, DS-19). | — | N |
| `now.focus-unknown` | P Hidden from the count | Unknown characters don't block All set and sit in their own fold. | "Magnifier note": the fold's line with "Suggest this" prefilled | N |
| `now.focus-better-fit` | P Quiet hint | A muted line under the step, shown only when M5 computes a real option (it does: `higherLeverage`). | "Will give you" stays text in the why sheet until M5 gives numbers (DS-23) | N |
| `now.focus-footer` | P Primary next | One big "Next: Barbarian 56 · 1 fix" button. | "Auto-advance prompt": when the save shows the fix done, the button pulses once and says "Done · next: …". "Session recap": Done this session, as a fold built from the real `done[]`, hidden when it is empty (the critique: the exports' `done[]` was empty and the Lab's lines were invented) | N |
| `now.info-lines` | P Fold into caps | Info lines become the "soon" state of the cap pills; one place for caps. | — | N |
| `now.class-portrait` | P Family set | The five family chibis (beginner, journeyman, warrior, archer, mage) on the blob ramp. Subclass letter badges are drawn at 12 px and **only where the glyph appears without its class word** (map markers, lane heads, glyph chips); otherwise they are dropped. | world tint on the chibi's frame (`--w1`…`--w7`). "Letter tile" (Command Board density) is archived; "Hat-swap blob" is the runner-up, archived | F |

**Cards (v1 group `cards`)**

| Lab component | Built | Apply | Also built | Area |
|---|---|---|---|---|
| `cards.goal-card` | P Action-only card | One sentence plus the three tokens, so five Goals fit on a phone. The why sits behind a tap on the card, not a "Why?" button on every face. | the kind as a 4 px left rule plus a small word ("Fix", "Grow"), from the brief's Field Guide goal-card treatment (brief §3.2, not a separate variant) | N |
| `cards.why-sheet` | P Bottom sheet, delta first | Opens on what you get ("will give you …", only when the entry has it), then who and where, the why, and the Sources. **Merged with "NPC speech"** (the Quest Log accent): the why paragraph is spoken by our guide blob in the navy speech box. The overflow (•••, 44 px) holds Report this and Not for me (hold to confirm). Desktop: a side panel. | "Inline expand, one level", as the desktop popover from 1000 px | N |
| `cards.source-label` | P Verified date | "IdleOn Wiki · checked 17 Oct", not the patch number. "+2 more" is a 44 px chip. | "One human line" as the label text | N |
| `cards.contested` | P Badge only | A "sources disagree" badge; both sides wait in the why sheet. | "Split card" layout inside the why sheet | N |
| `cards.action-controls` | P Zz snooze | Skip is free and quiet: a Zz mark and "2 skipped today · show". | "Hold to confirm Not for me" in the sheet; "Report in the overflow" in the sheet (44 px) | N |
| `cards.goal-details` | P Glyph chips | Who as glyph chips, with the map under each; one tap opens Focus. | — | N |
| `cards.goal-list` | P Ranked with one winner | One full card, then numbered muted lines. The winner's empty tokens are hidden (DS-3). | "More as a count chip" ("+14 more") | N |
| `cards.shared-job` | P One trip, map by map | Biggest stop first; the sentence said once. | — | N |
| `cards.walkthrough` | P Pinned current step | Only the current step on Now ("step 1 of 4 · 1,010 of 2,000 · in 2h 24m"); the full list opens as a sheet. | "Stepper with three-state needs" as the sheet's content; "By character" as a sheet tab | N |
| `cards.walkthrough-step` | P Progress bar step | Big tabular held/need and "990 to go"; drop-rate maths muted below. | "Equip token" folded in ("Use Printer Sampling"); "While you're there" when a second Goal shares the map | N |
| `cards.requirement-tree` | P Flat need list | Only the missing leaves, as "990 more". The full tree and other ways sit behind two buttons. | "Recipe card" tiles inside "full tree" | N |
| `cards.spend-plan` | P Best buy, then save up for | One "Best buy now", one "Save up for". One currency format (DS-16). | "Ledger table" from 1000 px; "By payer" as a sheet tab | N |
| `cards.spend-line` | P Split paragraph | Payer and cost on one line, "Bring first" chips under it. | — | N |
| `cards.builds` | P Named findings | "What is wrong, then the verb"; Verdict-changing rows first. | "In game now vs suggested", as the compare table in the finding's why sheet | C |
| `cards.printer-plan` | P Slot grid | "Forest Fibres → Megalodon Tooth" is the one change; other slots say "no change". | — | S (printer page) and N (its Goal) |
| `cards.account-section` | P Summary header | "Account · 0 fixes · 19 Goals" collapses the section; a blocker opens it. | "Daily strip" of seal tiles for today-only rows (feeds the Log in pause point) | N |
| `cards.if-you-have-time` | P Extra seal, muted | One muted list at the very bottom, one line each with the time. | "Time-boxed menu" from 1000 px | N |
| `cards.not-covered` | P One honest line | One sentence that says what we leave out and that it never changes the Verdict. | "Count chip" + sheet when the list is over 3 | N |

**Flows (v1 group `flows`)**

| Lab component | Built | Apply | Also built | Area |
|---|---|---|---|---|
| `flows.sign-in` | P Out of the way | Sign-in never sits above advice; a pasted save works meanwhile. Signed in, it lives in the header overflow menu. | "Code card" as the device-code state (the Sign out chip is 44 px). "Guide NPC onboarding" is archived: the critique keeps it for Quest Log's first run, a skin this release doesn't ship (D-1) | N |
| `flows.paste-save` | P Drop zone | One big target and three numbered steps. | "Clear failure" as its error state | N |
| `flows.loading` | **O Blob walking** | Our guide blob walks a 4-frame loop with named steps ("Reading your save · Working it out · Drawing your characters"), then the Cloud Save hint after 30 s. Reduced motion: frame 1, still. For a lazy chunk the blob shows only after 400 ms, at 32 px. | The skeleton (the pick) is kept *under* the blob, so nothing jumps when the answer lands (the pick's reason) | N (atom F) |
| `flows.empty` | **O Sleeping blob** | "Nothing to do now. Back in 8h 10m: the anvil on Bowman 54 fills first." The pick's rule stays: every empty state names the next thing to do. Small inline empties are one line with no art (Field Guide: one mascot on empty and error states). | — | N (atom F) |
| `flows.cant-read` | P Use last good | An explicit, labelled fallback to the last good save, never a silent swap. Field Guide's one mascot bust here is the gremlin. | "Gremlin" art only; its state chips are a Lab control, not built | N |
| `flows.cant-work-out` | P Fallback roster | Keeps the Roster's shape and order while advice is paused. **No slot labels**: use the who-glyph and class + level. | "Report prefilled" as its one button | N |
| `flows.stale` | P Stale-first banner | Save age is the first sentence and carries its fix. | "Faded board" (rows at 60% opacity on the art, never on text) with no clock watermark on text | N |
| `flows.banners` | P Toast once | One toast with Reload / Later, then a dot on the header overflow. Never a nag. | — | N |
| `flows.suggest-form` | P Kind picker first | Three big tiles (Idea, Something's wrong, Confusing), then one question. | — | N |
| `flows.report-form` | P Pick what's wrong | Four chips and an optional line. | "Two-tap public notice" text, minus the field list (DS-16) | N |
| `flows.your-suggestions` | **O Quest board on top, Plain list for the rest** | The 3 most recently changed suggestions are notes pinned to a board with DONE / PLANNED / FILED stamps; the stamps' words are 14 px Atkinson, not 12 px pixel (DS-14). Everything older is the plain list (date, title, status, the row is the link). | — | N |
| `flows.footer` | P Fan disclaimer | Who made it, who didn't (LavaFlame2), and that it is read-only. Every link 44 px (DS-15). Versions move to the header overflow. | — | N |
| `flows.clear-my-data` | P What it clears | "Goes / Stays" answers "will this touch my game?" before the button. | "Hold to clear" as the button (the checkbox row is 44 px) | N |
| `flows.whats-new` | **O Patch notes scroll** | A short scroll of up to 3 items with "Got it", once per release. It docks above the bottom bar as a 56 px tab ("What's new · 3") and opens on tap, so it never covers the Verdict (DS-1). | "and N more" link to every change | N |
| `flows.session-checklist` | P Auto tab | The three pause points (Log in, Rounds, Log off), picked from context and saying why; nothing to set (§5.1, FR-N6). | "Quest scroll" wax-seal ticks and the campfire ending as the Log off celebration; "Pilot checklist" from 1000 px | N |
| `flows.afk-timeline` | P Compact strip | One strip on Now: class marks where caps fill, a flag where you are back, one sentence under it. | "Lanes on phone" is the Timeline place (T); "Heat grid" (a Command Board power-session idea) is archived: Characters' matrix covers it | T (strip), I (placed on Now) |
| `flows.away-card` | P Scaled welcome | Nothing under 15 min away, one line up to 8 h, the full "While you were away" card after 8 h (FR-N7). | "Share image" is archived | N |

**Character pages (v2 group `character`)**

| Lab component | Built | Apply | Also built | Area |
|---|---|---|---|---|
| `character.overview` | P Health matrix | Characters × the tabs that publish health (Build, Gear, Cards, Signs, Skills), with one ringed fix. **Cells carry units**: "215 points", "45 levels behind", "1 of 4 slots". | "Class tree roster" as the overview's second block; "Roster ribbon of slots" folded into the overview header | C |
| `character.shell` | P Sticky identity strip | Chibi, "Squire 85", pin + place, Verdict glyph + word; the tab bar under it with one badge per tab; it shrinks on scroll. **Merge the 44 px prev / next arrows** from the runner-up. | "Level-gate ruler" on the Build tab only; "Menu-tile tabs" is archived (Quest Log skin) | C |
| `character.now-tab` | P Current step hero | Same as `now.focus-card`. One time format: "in 14h 04m" (DS-6). | "Purpose ladder" under the hero, folded to three rungs; "Before you leave strip" is the Log off state of the hero | N (Focus is Now's) |
| `character.build.class-path` | P Stepping stones | The next class lit with what it opens. At 390 px the "kill 10 genies"-style text goes into the step line, so no column wraps to nine lines. | — | C |
| `character.build.presets` | P Game-tab grid | Talent tabs as tiles filled to target, the next point outlined. **Tile order is the Build's step order** (the Lab marked it a mock). Reuse the side-by-side runner-up's mismatch banner on top ("Swap to your skilling preset"). | "Empty preset call-out" as the grid's empty state, grouped across characters; "Fill-to-target bars" become the **Build path** (§5.2) | C |
| `character.build.unspent` | P Tab badges | A count on each tab ("at least 12") and "Start here" on one; zero shows nothing. | — | C |
| `character.build.next-points` | P One step, then the rest | One line at full weight and two muted. The rest is not folded away: the owner's functional request 1 ("show the entire build") replaces the fold with the full Build path (§5.2, FR-C1). This is a functional change, not one of the four design overrides. | "Point budget meter" as the path's band marker ("at least 118 points end here") | C |
| `character.build.attack-bar` | P Slot row with ghosts | The bar as the game shows it, with a ghost in each gap. Its missing state shows only from real data (no mock). | "Missing only" as the Now line | C |
| `character.build.coming-up` | P Milestone ladder | Future unlocks as rungs above "you are here", with no Next pill. | "Folded footer" as its collapsed state | C |
| `character.cards.preset-rows` | P Card rack | Our own card frames with level pips, the worn preset ringed and the mismatch as the banner. Effect text goes in the tap sheet, not 11 px in the frame (DS-20). | "Compact chip row" on the overview and from 1000 px | C |
| `character.cards.best-swap` | P Before / after racks | Now rack, arrow, best-you-own rack, one sentence. Data comes from M8's engine output (`collections/cards-view.ts` already builds the best preset from owned cards as swaps), not the export. | "Inline diff" as the tab-badge state; "Card plan board" from 1000 px | C |
| `character.cards.grind` | P By map | Grind targets grouped by the map that drops them, with who needs them; nothing above the current world. | "Progress rings to next level" as the detail; "Later shelf" as the unreachable fold | C |
| `character.cards.set-progress` | P Set level bars | Sets as bars with set-level ticks, the worn one ringed, "Wear this" lit; no tier words. | "Set badge on the rack" in the rack header | C |
| `character.gear.paper-doll` | P Coloured silhouette | Built by M18. Apply here: units ("45 levels behind"), never "45 far". | "Gear heat strip" (the `gear` System page, from 720 px per M18) | C (restyle) |
| `character.gear.upgrade-path` | P Tool ladder per skill | Built by M18. Label the dots; say "holds none · best now: none yet" once, not three times. | "Set progress" as the Armor Smithy's locked state | C (restyle) |
| `character.skills.bars` | P Bar list with gate ticks | Nine bars with gate ticks and the AFK skill lit. | "Next gate first" as the text alternative for screen readers | C |
| `character.skills.role-training` | P Role matrix | The account Skill Grid with specialists starred, and "No one is built for Trapping". | "Slot pips only" on the identity strip | C |

**System pages (v2 group `systems`)**

| Lab component | Built | Apply | Also built | Area |
|---|---|---|---|---|
| `systems.hub` | P Stage report card | "What did I skip": length on one Stage axis, with the worst row open and its step. | "World bands of tiles" as the full index under it ("All Systems"), with "not covered yet" said once per band, not per tile (v2 #3) | S |
| `systems.page-frame` | P Step first | Phone: step, Stage meter, picture, folded order, Source. The step is at most two lines (DS-18). | "Split desktop" from 1000 px | S |
| `systems.alchemy` | P Cauldron pots | Built by M19. Restyle; the lit bubble is M19's pick. | "Liquid tubes" (runner-up, merged: M19 already draws it); "Vial shelf" labels only the best three (DS-20) | S |
| `systems.construction` | P Cog Board heat map | The 12 × 8 board with seats as chibis and the free square lit, using M20's seat rule. | "Salt chain diagram" is archived; "Build slots and order rail" as the folded order | S |
| `systems.stamps` | P Stamp book grid | Three tabs in game order, owned tiles with a level ring, the one to get first lit (M8's order). | "Next three ribbon" as the folded order; "Cap-raise planner" shows only the raises in M7's plan | S |
| `systems.star-chart` | P Constellation map | A world sky with the claimable star lit and "3 of 19 points to a 2nd sign", using M16's data. | "Sign slot strip" on the character's Signs tab, with "2nd slot at 19 points" said once above it | S (map), C (strip) |
| `systems.statues` | P Statue wall | 32 statues, Gold in gold, the next Gold lit (M7's statue item). "Price not checked" stays honest. | "Gold next" as the lit tile's sheet; "Spread chart" under the wall when a split exists | S |
| `systems.vault` | P Vault tower | Floors opened by total levels, "you are here", and the best buy lit (M7's Vault order). | "Next unlock gap" as the tower's header ("33 levels to open Special Talent") | S |
| `systems.worship-prayers` | P Charge tanks | Built by M20. Restyle; the "spend it" step is said once. | "Wave rulers" under the tanks; "Prayer loadout table" is **not built** (no engine rule, v2 #6) | S |

**Time and Map (v2 groups `time`, `map`, `nav`)**

| Lab component | Built | Apply | Also built | Area |
|---|---|---|---|---|
| `time.timeline` | P Lanes with a back-at marker | Built by M17. Restyle. At 390 px bar labels must not clip: a label that doesn't fit moves below its bar. | "Hatched waste" as the stale state (built); "Account lanes first" as the lower band (built) | T |
| `time.daily-weekly` | P Two-ring reset clock | Built by M20. Restyle. The bands become a picture: the day ring with reset ticks and three bands of pips, rows in a sheet capped at 3 per band. | "Bank pips calendar" as each banking row's pips; "Five-minute plan" as a filter chip row (5 / 15 / 30 min) | T |
| `time.parallel-slots` | P Slot grid | Characters × five slot columns (cauldron, traps, worship, Cog Board, printer), each cell a 16 px glyph, filled or dashed, with one NOW cell from M20's fill order. Cell words wrap, never "None …". The Now step is about 12 words. | "Unassigned tray" as its text partner and screen-reader list; "Per-slot strips" on each System page | T (grid), S (strips) |
| `map.world-map` | P Gate-first | Folded worlds, boss gates with keys and crystals, the frontier as a ring: "how far to the next world" on one phone screen (FR-M1). | "World strip" from 1000 px; "Overlay switcher" with exactly one overlay at a time, showing that overlay's one ring and greying the rest; "Vertical route" as the expanded world | M |
| `map.map-sheet` | P Bottom sheet | Who is here, door progress, the card and the Death Note, in that order. | "Side panel" from 1000 px; "Tooltip card" is archived | M |
| `nav.shell` | P Bottom bar, then rail | Five places, glyph + word, the same order as a rail from 720 px (M17 D-5). **Borrow the runner-up's rule:** only Now and Timeline carry badges. The locked-place state is not built: the Map is never locked (D-6). | — | M |

### 4.2 Every current app component, mapped

Everything in `apps/activeon/src/**` at `6dfaefc` (M18 merged in #116). "Gap" means the Lab has no design for it. Each gap gets a design in §4.3.

| App component (file) | States | Lab component → variant | Gap? |
|---|---|---|---|
| Header: wordmark, connection, Stage label, account level, save age, "updating…", Suggest, stale hint (`components/Header.tsx`) | live, pasted, last good, offline, reconnecting, updating, stale | `now.header` One-line + `now.stage-badge` crest + `flows.stale` | Overflow menu: **G1** |
| Expected Return chips (`now/Chrome.tsx` `ExpectedReturnChips`) | pressed, updating, learned | `now.return-chips` Learned default | — |
| Places nav, skip link, badges (`shell/Shell.tsx` `PlacesNav`) | bar under 720 px, rail from 720 px, badge | `nav.shell` | — |
| Banners: update, patch, stage-unknown, offline, all-set (`now/Chrome.tsx` `Banners`) | per kind, compact past 2 | `flows.banners` Toast once; all-set → `now.verdict-banner` at zero; offline → `now.header` chip | — |
| Progress bar and "fix N in Account" (`Chrome.tsx` `ProgressBar`) | segments, hidden | `now.verdict-banner` counter + `now.verdict-strip` pager dots | — |
| What's new card (`Chrome.tsx`, `now/release.ts`) | shown, dismissed, "and N more" | `flows.whats-new` **Patch notes scroll** | — |
| Preview badge (`App.tsx`, `Chrome.tsx`) | PR Preview only | — | **G2** |
| Waiting for the save; parsing (`Chrome.tsx` `Waiting`) | short, long (30 s) | `flows.loading` **Blob walking** | — |
| "Loading your choices…" (`Shell.tsx`) | prefs not ready | `flows.loading` (no blob under 400 ms) | — |
| Lazy chunk fallback and retry (`lazy-part.tsx`, #116) | loading, failed | `flows.loading` | Failed state: **G3** |
| Sign-in card (`components/SignIn.tsx`) | unconfigured, signed out, restoring, code shown, waiting, signed in, wrong account, error | `flows.sign-in` Out of the way + Code card | Wrong-account notice: covered by Code card's error line |
| Paste save (`components/PasteSave.tsx`, `App.tsx` fallback) | closed, open, busy, error | `flows.paste-save` Drop zone + Clear failure | — |
| Can't read (`components/CantRead.tsx`) | with or without last good | `flows.cant-read` Use last good | — |
| Can't work it out, advice boundary (`now/CantWorkOut.tsx`) | engine error, render error | `flows.cant-work-out` Fallback roster | — |
| Footer: versions, patch note, failed checks + Report, "can't remember", history note, links, credits (`App.tsx`) | signed in or not | `flows.footer` Fan disclaimer; versions → G1 | — |
| Clear my data (`components/ClearMyData.tsx`) | closed, confirm, clearing | `flows.clear-my-data` What it clears + Hold to clear | — |
| Follow chip "Now playing …" (`Shell.tsx`, `Focus.tsx`) | pending, tapped | `now.focus-identity` Follow toast | — |
| Live region (`Shell.tsx`) | — | (no visual) | — |
| Roster section and "to Characters" link (`now/Roster.tsx`) | — | `now.roster` Grouped jobs | — |
| Roster row: position, name, class, pill, playing, next up, where, caps, summary, Build and Cards chips, spend chip | ready, fix, unknown, skipped, playing | `now.roster-row` Three-token + `now.verdict-pill` + `now.cap-pills` + `now.spend-chip` | Row tab chips: **G4** |
| Focus card: strip, position, cloud-save tip, back line, hero, char tabs, info lines, verdict block, unknown block, blockers (`now/Focus.tsx`) | per Verdict | `now.focus-*`, `character.shell`, `character.now-tab` | Cloud-save tip: **G5** |
| Purpose block (`now/PurposeBlock.tsx`) | quest line, ladder, stop-here, details | `now.focus-purpose` Quest line + Purpose ladder | — |
| Goal list, hidden list, skipped undo (`now/parts.tsx` `GoalList`) | — | `cards.goal-list` Ranked winner + count chip | — |
| Next Action item: tag, text, milestone, why, Walkthrough, meta (`parts.tsx`) | — | `cards.goal-card` Action-only + `cards.why-sheet` | — |
| Source label, more Sources, stale (`parts.tsx` `SourceLabel`) | — | `cards.source-label` Verified date | — |
| Contested badge (`parts.tsx`) | — | `cards.contested` Badge only | — |
| Report this, confirm (`parts.tsx` `ReportThis`) | — | `cards.action-controls` Report in the sheet overflow | — |
| Skip today, Not for me (`parts.tsx` `ActionControls`) | — | `cards.action-controls` Zz + hold to confirm | — |
| Goal details (`parts.tsx` `GoalDetails`) | — | `cards.goal-details` Glyph chips | — |
| "See it" link (`parts.tsx` `SeeItLink`, M17) | — | — | **G6** |
| Cap pills and the open cap (`parts.tsx` `CapPills`) | full, soon, optional | `now.cap-pills` Optional tag | — |
| Walkthrough, tree, other ways (`now/walkthrough/*`) | — | `cards.walkthrough` Pinned + `walkthrough-step` + `requirement-tree` | — |
| Higher leverage, "How this was decided" (`Focus.tsx`) | option, note | `now.focus-better-fit` Quiet hint; the decision detail goes in the why sheet | — |
| Active play section (`Focus.tsx`) | — | `cards.if-you-have-time` Extra seal (the character's) | — |
| Done this session (`Focus.tsx`, `Account.tsx`) | — | `now.focus-footer` Session recap (fold) | — |
| Focus footer: Next, back, "Something confusing here?" | — | `now.focus-footer` Primary next | "Confusing" link: in the overflow (G1 pattern) |
| Account section: safety unknown, Fix before you leave, Goals, Done (`now/Account.tsx`) | — | `cards.account-section` Summary header | — |
| Spend Plan card (`Account.tsx`) | lines, skip, dismiss, more, skipped | `cards.spend-plan` + `cards.spend-line` | — |
| Daily & Weekly Checklist (`now/Checklist.tsx`, M20) | rings, bands, rows, fold, manual tick | `time.daily-weekly` Two-ring clock | — |
| Star Chart section in the Account (`now/signs/SignsPanel.tsx`) | — | `systems.star-chart` (moves to its System page; the Account keeps one summary line, D-9) | — |
| If you have time (`Account.tsx`) | — | `cards.if-you-have-time` | — |
| Not covered yet (`Account.tsx`) | — | `cards.not-covered` | — |
| Characters place: tiles with tab status lines (`characters/CharactersPlace.tsx`) | — | `character.overview` Health matrix | — |
| Builds overview (`now/BuildView.tsx` `BuildsOverview`) | collapsed, shared note | the matrix's Build column + the class tree block; "next 2–4 steps" per character (FR-C6) | — |
| Cards overview and merged grind list (`now/cards/CardsPanel.tsx`) | — | `character.cards.grind` By map (account) + matrix Cards column | — |
| Skill Grid (`now/SkillsTab.tsx` `SkillGrid`) | — | `character.skills.role-training` Role matrix | — |
| Character tab bar (`now/character-tabs.ts`, `Focus.tsx`) | 6 tabs (Now, Build, Gear, Cards, Signs, Skills) | `character.shell` Sticky strip | — |
| Build tab: status, class path, preset switch, preset panel, next points, attack bar, talent tables, coming up, quiet note (`now/BuildView.tsx`) | no build, mixed, empty, stale | `character.build.*` | Talent tables → Build path (§5.2) |
| Gear tab (`gear/GearTab.tsx`, #116) | — | `character.gear.*` | — |
| Cards tab (`now/cards/CardsPanel.tsx`) | — | `character.cards.*` | — |
| Signs tab (`now/signs/SignsTab.tsx`, #116) | — | `systems.star-chart` Sign slot strip | — |
| Skills tab (`now/SkillsTab.tsx`) | — | `character.skills.bars` + slot pips | — |
| Systems hub (`systems/SystemsHub.tsx`) | wasting, behind, ok, locked, not covered, can't tell | `systems.hub` Stage report card + World bands | — |
| Generic System page (`systems/SystemPage.tsx`) | — | `systems.page-frame` Step first | — |
| Star Signs page body (`SignsPanel.tsx`) | — | `systems.star-chart` Constellation map | — |
| Cog Board, Worship, Trapping, Cauldron seats bodies (`systems/SlotPictures.tsx`, M20) | — | `systems.construction`, `systems.worship-prayers`, `time.parallel-slots` Per-slot strips | Trapping strip: **G7** |
| Alchemy page: pots, vial shelf, tubes, Pay 2 Win grid (`alchemy/AlchemyLab.tsx`, M19) | — | `systems.alchemy` | Pay 2 Win grid: **G8** |
| Gear page, Armor Smithy page (`gear/GearPages.tsx`, #116) | — | `character.gear.paper-doll` heat strip, `upgrade-path` Set progress | — |
| Timeline place: board, lanes, ticks, back marker, stale hatch, lists, account band (`timeline/TimelinePlace.tsx`) | — | `time.timeline` | — |
| Suggest form: type, the three blanks, example, notice, Turnstile, preview, sending (`suggestions/Panel.tsx` `SuggestForm`) | — | `flows.suggest-form` Kind picker | Turnstile frame: **G9** |
| Report form (same panel, Report kind) | — | `flows.report-form` Pick what's wrong | — |
| Your suggestions (`Panel.tsx` `YourSuggestions`) | empty, list | `flows.your-suggestions` **Quest board + Plain list** | — |
| Outbox: offline, saved for later, unreachable; Ready to send (`Panel.tsx` `OutboxSender`, `SuggestionsProvider.tsx` `ReadyToSend`) | — | `flows.banners` Toast once (the same toast, kind "suggestion") | — |
| Add details (`Panel.tsx` `AddDetails`) | — | `flows.suggest-form` (its second question screen) | — |
| "Sign in to send", names unavailable (`Panel.tsx`) | — | `flows.suggest-form` notice line | — |
| *New:* Settings (theme, clock time, return default) | — | — | **G10** |
| *New:* Map place and map sheet | — | `map.world-map`, `map.map-sheet` | — |
| *New:* pause points, Away card, AFK strip, Parallel Slots grid, Stamps, Statues and Vault pages | — | `flows.session-checklist`, `flows.away-card`, `flows.afk-timeline`, `time.parallel-slots`, `systems.stamps`, `systems.statues`, `systems.vault` | — |
| *New:* the full Build path and Star Talents (owner request) | — | `character.build.presets` + `next-points` (extended) | **G11** |
| *New:* the Printer System page body (M14's plan) | — | `cards.printer-plan` Slot grid | — |

### 4.3 Designs for the gaps

Each gap is designed with existing atoms and the principles. No new visual language.

- **G1 Header overflow menu.** A 44 px "•••" button at the right end of the one-line header. It opens a sheet (phone) or a popover (desktop) listing, in order: account level ("Family level 1,234"), Settings, Suggest something, Your suggestions, Something confusing here?, versions ("ActiveOn 0.1.0 · knowledge #ec89 · game build 142"), the history note, and Sign out (signed-in) or Sign in. Every row is 44 px and has a 16 px glyph. A new update or a failed check puts one dot on the button (`flows.banners`: "then a dot"). P9, P10, DS-15.
- **G2 Preview badge.** On PR Previews only: a grey `Pill` atom, "Preview · PR #123", at the left of the header chip row. It never sits above the Verdict line on a phone; it takes the save-age chip's row. DS-1.
- **G3 Lazy chunk failed.** In place of the part: one line with the cracked-gear glyph (`flows-cracked-gear`), "Couldn't load this part.", and a 44 px "Try again" button. It never takes the whole place. P5.
- **G4 Roster row tab chips.** The row keeps **one** tab chip, the most useful one, at its right end: a 44 px chip with the tab's glyph and its health word ("Build · 40 points"). It shows only when that tab's `TabHealth.level` is `fix`, `behind` or `empty`, the most severe first, then by tab order (Build, Gear, Cards, Signs, Skills). This keeps M9's "Build chip on every row" findable without a third pill (DS-9). With nothing behind, there is no chip; the row itself opens the Character page.
- **G5 Cloud-save tip.** A muted line with the hourglass glyph under the identity line: "Tip: press Cloud Save in the game to lock this in." It shows only while the follow state is guessing, as M10 FR-14 rules.
- **G6 "See it" link.** A quiet 44 px link row with an arrow glyph at the end ("See it on the Alchemy page →") at the bottom of the why sheet, never on the card face (DS-10). On the target page, the highlighted element gets the `is-now` ring scoped to that component (DS-21).
- **G7 Trapping strip.** The per-slot strip pattern: one row per character with a trap-set glyph and one cell per trap, each cell filled by time to done against the Back marker (the Timeline's length rule, DS-6). "Collect now" is lit on the first trap that is done before the return. It is drawn from M20's existing `SystemPicture` data.
- **G8 Pay 2 Win grid.** The Vault-tower pattern turned sideways: one row per Pay 2 Win line in M19's order, each a bar of level against cap, with the cost in coins, and exactly one lit "next" bar (P9). Tap sheet: what it gives, the cost, the Source.
- **G9 Turnstile frame.** Cloudflare's widget is a third-party iframe we can't restyle. Wrap it in the form's card with one line above it, "Quick check that you're a person (Cloudflare)", in Field Guide body type, so it reads as part of the form. Reserve its 65 px height so nothing jumps.
- **G10 Settings sheet.** From the overflow menu. Three rows, each a segmented control (`SegmentedControl` atom, 44 px):
  1. Theme: System / Light / Dark.
  2. Times: In 2h 10m / Around 20:10 (the "Clock time, set once" variant; it changes the UI-formatted times, FR-F6).
  3. Back in: Learned / always ask.

  It stores to the existing preference namespace (M10 TR-8). There is no direction row (D-1).
- **G11 Full Build path and Star Talents.** Designed in §5.2 (the Build path list, the band marker, the star tab tile).

## 5. Functional requirements

Numbered by area. Each FR is testable. "Words" always come from the engine's view words (M10 red-team #5: the app adds no copy of its own beyond headings it is given), now split per area (TR-7).

### 5.0 Foundation (area F)

- **FR-F1 Tokens.** One token file holds the shared base (spacing, radii, type scale, motion, sizes, tier ramps, materials, world accents) and the three direction sets with light and dark values, ported from the Lab's `tokens.css`. The Google Fonts `@import` is removed (FR-F2). Every component reads semantic aliases (`--fg`, `--muted`, `--accent`, `--ok`, `--warn`, `--bad`, `--unk`, `--info`, each with `-soft` and `on-` variants), never raw hexes. The old names (`--coin`, `--coin-soft`) stay as aliases until Integration removes them (FR-I3).
- **FR-F2 Fonts, self-hosted.** Each font is an `@fontsource` package (all OFL-1.1, from `'self'`, so the CSP's `font-src 'self'` stays as it is):
  - Atkinson Hyperlegible Next (400, 600, 700), replacing Atkinson Hyperlegible (600 for Field Guide's labels, so nothing is faux-bolded);
  - JetBrains Mono (400, 600);
  - Pixelify Sans (500, 600, 700).

  The Lab's other faces (Jersey 15, Silkscreen, Tiny5, Geist, Geist Mono, VT323) belong to the Quest Log and Command Board **skins**, which this release doesn't ship (D-1). They are not added as dependencies; their token stacks fall back to the system fonts in the dev-only `?direction=` view. A direction switch, if it ever ships, adds them in its own PR.

  Only the `latin` subset files are imported (`@fontsource/<font>/latin-<weight>.css`), so each face is one woff2. A face is downloaded only when text uses it (the browser's `@font-face` rule). The first screen downloads Atkinson Hyperlegible Next 400 and 700, JetBrains Mono 400 and Pixelify Sans 500 and 600: one more file than today (TR-12 counts the bytes). The latin subset has no "→", "←" or "✓" in some faces; V-5 checks each, and a missing one is drawn as a 16-grid art glyph rather than falling back to another font.
- **FR-F3 Pixel art library.** All 213 SVGs in the Lab's `art/` are converted at build time into typed modules and drawn by one `<PixelArt name>` component (TR-4). The names are a union type. Recolouring works through ramp classes (`ramp="blob" | "bronze" | "gold" | …`, a world `w={1..7}`) and the Lab's `--px-*` slots. Animated pieces (23 of them: the blobs, campfire, gremlin, bell, hourglass, cheer, printer, the NOW stone) loop in stepped frames from `art.css` and stop on frame 1 under `prefers-reduced-motion`. Celebrations play once.
- **FR-F4 The who-glyph.** `<WhoGlyph cls level size badge?>` resolves a class to its family through `classes.fact.class-tree` (passed in the view as `classFamily`, so the UI imports no Knowledge Base). It draws the family chibi (a 16-grid motif) at 16, 32 or 48 px on the blob ramp, with a world tint on the frame (the inventory's `now.class-portrait` purpose: "tinted by world") and an optional 12 px subclass letter badge set in Atkinson Hyperlegible Next 700, never a pixel face (DS-14). The Lab's chibis carry a blink loop; it plays only on the character being played, never on every Roster row. It is the only way a character is drawn (DS-13).
- **FR-F5 Atoms.** One atom set used by every area (§7 TR-5 gives the props):
  - `Pill`: the Verdict stamp and cap pills, with the urgency, glyph, verb and optional grammar;
  - `Chip` and `GlyphChip`;
  - `Button`, `IconButton` and `LinkRow`, all 44 px;
  - `Sheet`: bottom sheet on a phone, side panel or popover from 1000 px, with a focus trap, Esc and return focus;
  - `TokenLine`: who · where · how long, which hides unknown tokens;
  - `Meter` (a fill bar with an aria label) and `Ring` (only for the daily and weekly rings);
  - `SegmentedControl` and `Tabs`;
  - `Badge` (a count, named in words for screen readers);
  - `Toast`;
  - `EmptyState` (the sleeping blob plus the next action) and `Loading` (the walking blob, its named steps and the skeleton under it);
  - `Seal` (the Fix / Spend / Grow / Extra kinds);
  - `StatusGlyph` (wasting, behind, ok, locked, not covered, can't tell);
  - `Speech` (the NPC speech box for the why);
  - `Section` (heading in the pixel display face, 16 px and up).
- **FR-F6 One time language.** Every duration, moment and age is printed by one module (`packages/knowledge/src/template.ts`, re-exported by `packages/engine/src/now/format.ts`):
  - a moment is `inSpan` "in 14h 04m", including estimates such as a door's ETA;
  - a clock time is `clockAt` "around 20:10";
  - an age is "8h 30m ago";
  - effort is `aboutDuration` "about 10m" (estimated task length only).

  The Knowledge Base template `{x:duration}` (today "about 5h" for a moment) is audited: a moment uses `{x:in}`, effort keeps `{x:duration}`. The Settings "Times" preference applies to every time the **UI** formats (the header, the return line, the counter's first-fill line, the Timeline, the AFK strip, the pause points, the Map's door time): these stay structured (`{ at: epoch ms }`) until the component formats them with `design/format.ts`. Times inside Knowledge Base sentences are rendered in the worker, which has no clock preference or timezone, so they stay relative ("in 3h 40m"); goldens render with a fixed UTC offset of 0. CI fails on a component that formats a duration itself (a grep for `toLocaleTimeString` and `/ 3600` in `apps/activeon/src`, TR-15).
- **FR-F7 One coin format.** `formatCoins` ("100M coins") is the only coin text. `coinTiers` may draw coin icons beside it, never instead of it. The golden scan fails on any tier word ("silver", "gold coins", "dementia") (TR-15).
- **FR-F8 The collection.** The Design Lab is kept in full (TR-1). The data-free part goes in the repo at `docs/design-lab/`: brief, both critiques with every variant's name, score, verdict and note, both inventories, tokens, and the art. The renders, which embed scrubbed save data, go to the local, gitignored `fixtures/private/design-lab/` (D-2).
- **FR-F9 Copy and data audits.** One pass over the Knowledge Base and the view words for DS-3 (hidden unknown tokens), DS-16 (jargon), DS-17 (the row's own name repeated), DS-18 (step length, at most 14 words, checked by a test with an allowlist for the five longest the copy pass kept) and DS-19 (units). It lands in F, because every area's goldens move with it.
- **FR-F10 Account State fields for this release**, in one schema bump (M1 TR-11) so area PRs never collide on `schemaVersion` (TR-3):
  - star points per character;
  - door kills left on every map per character;
  - statue levels;
  - the per-character statue split, if Toolbox exposes it (V-4).

### 5.1 Now and flows (area N)

- **FR-N1 First screen.** Top to bottom on a phone:
  1. the one-line header (save-age chip, crest, overflow);
  2. the stale-first banner, when the save is stale (M10's stale rule);
  3. the counter;
  4. the first fix button row;
  5. the pause-point control (FR-N6);
  6. the compact AFK strip (placed by Integration, FR-I1);
  7. the pause point's content (Rounds: grouped jobs, then the Roster).

  The Account summary header follows. Sign-in, paste and What's new never sit above the counter (DS-1).
- **FR-N2 The counter.**
  - The count is the number of Verdict blockers across characters and the account (each character's blocker counts once, an account blocker once), from `NowView.progress` and `account.blockers`.
  - The sentence is "N fix(es) before you leave", in Atkinson Hyperlegible Next 700 at 24 px, with the count as a large tabular number (JetBrains Mono 600, 40 px): Field Guide's own verdict treatment (brief §3.2). The save age is a muted line under it.
  - The first fix button is the first blocker in Visit Order, as a `TokenLine` (who · where · how long) plus its verb. It opens that character's Focus.
  - At zero: "All set: safe to log off", the campfire (the Quest Log celebration, parchment frame) and M3's first-fill line ("Back in 8h: the anvil on Bowman 60 fills first, in 3h 40m").
  - Unknown characters aren't counted; they sit in a fold ("2 we can't tell: see why").
- **FR-N3 Grouped jobs.** When Next Actions from the same entry show on 2 or more Roster rows, the Roster opens with one grouped card: "Same job on N characters". The grouping key is the entry id, not the rendered words: on `latest` the trap line reads "6 finished traps" on some rows and "7" on others.

  The card's sentence is the entry's new optional `groupText` template ("Collect and re-place your finished traps"). Without one, it is the shared text when every row's text is identical; when the texts differ and the entry has no `groupText`, the rows aren't grouped. Per-character numbers go on the chips ("Squire 51 · 6"). F authors `groupText` for every entry that fires on 3 or more characters on any golden fixture (a `kb check` rule lists them).

  The card holds the verb once, the characters as glyph chips (44 px, each opening its Focus) and the map-by-map trip order (`cards.shared-job`). The rows show a small marker in place of the sentence. A cap pill on 3 or more characters becomes one roster finding ("Anvil full on 6 · collect", a filter chip that dims the rows without it); the rows keep only the marker. On `latest` (11 characters), no sentence appears more than twice on the first screen (DS-7).
- **FR-N4 Roster rows.**
  - Line 1: `WhoGlyph` + class + level, then the pin + map, then the Verdict stamp.
  - Line 2: the verb (never the row's own name, DS-17), or the grouped-job marker.
  - Up to 3 pills, the rest as "+n"; a Ready row's caps read "optional".
  - One tab chip (G4), and no spend chip (the Spend card lists payers).
  - The row is one 44 px+ link to the Character page.
  - With 6 or more characters, Ready rows fold into one line of glyphs ("4 ready").
  - Under 360 px a row uses the cap-count layout.
- **FR-N5 Focus (the Character page's Now tab).**
  - The sticky identity strip (FR-C5), then the current-step hero: one step as a `TokenLine`, its fill bar from the save, and the pager ("← prev" / "Next: Barbarian 56 · fix", with dots).
  - Then the Purpose quest line ("Push World 3 · 19 of 15k kills · in 14h 04m"), with the Purpose ladder folded to three rungs.
  - Then the ranked Goal list (one winner, numbered muted lines, "+n more"), the quiet Better fit hint, the character's "If you have time" lines, the Done fold and the one Next button.
  - Info lines become the caps' "soon" state.
  - "Something confusing here?" moves to the overflow (G1).
- **FR-N6 Pause points** (`flows.session-checklist` Auto tab). A three-segment control: Log in · Rounds · Log off. One muted line says why the tab was picked ("Picked Log in: you were away 9h"). The player can switch; a manual pick holds for the rest of the Play Session (saves arrive every few minutes during play, so holding only until the next save would snap it back). The rules, first that applies:
  1. **Log in**: the Play Session (M1 `sessionStart`) began under 10 minutes ago, a previous Play Session exists, and it ended at least 1 hour before this one began. (Any gap of 15 minutes already starts a new Play Session, `PLAY_SESSION_GAP_MS`, so the hour is what makes it a real return.)
  2. **Log off**:
     - the Expected Return chips were changed this session, or
     - the count is 7 or under and every character with a Fix has been opened this session (the follow state's visited set), or
     - this Play Session is longer than the account's median of its last 10, minus 5 minutes (no history: never by time).
  3. **Rounds**: otherwise.

  What each one shows:
  - **Log in** shows the Away card (FR-N7) and a read-only list of up to 7 things that changed: limits that bound while away (Timeline bars that ended between the previous session and now, grouped by DS-7), daily resets passed (checklist rows reset since), and class levels gained per character since M9's baseline save ("+2 levels on Bowman 54 · new talent points: see Build").
  - **Rounds** is the counter, strip, grouped jobs and Roster.
  - **Log off** lists the unmet AFK Setup items (every Verdict blocker, at most 7, then "+n"). Each is ticked by the next cloud save (DO-CONFIRM, never by a tap). It ends on the Verdict: all ticked shows the wax-seal ticks and the campfire, "Safe to log off · back in 8h".
- **FR-N7 Away card** (`flows.away-card` Scaled welcome). Time away is the gap between the previous Play Session's last save and this session's first, from M1's SaveHistory.
  - Under 15 min: nothing.
  - 15 min to 8 h: one line ("Welcome back · away 1h 20m · 2 things filled"). The brief defines one line up to 2 h and the full card after 8 h; between 2 h and 8 h it stays one line, the smaller of the two, since the brief says nothing there.
  - Over 8 h: the full card, "While you were away · 9h 12m", with the levels gained, the filled limits, the resets and "Start with: …" (the first fix).

  A pasted save, or one with no history, shows nothing.
- **FR-N8 Why sheet.** A tap on a Goal card opens the sheet: "will give you" (when the entry has a delta), who and where, the why spoken by our guide blob (`Speech`), the Sources (verified date), the "sources disagree" sides, "How this was decided" (M5), "See it" (G6), and the overflow (Report this; Not for me, hold 1 s, saying what it changes). Skip today is the one control on the card face.
- **FR-N9 Spend Plan.** Best buy now (one winner), then Save up for, then at most 5 lines. Each line has the payer and cost on one line, "Bring first" chips under it, coins in one format, and payer chips 44 px. From 1000 px it becomes the ledger table (payer, cost, levels, status columns, a running total).
- **FR-N10 Account section.** A summary header ("Account · 0 fixes · 19 Goals") that a blocker opens. Inside: Fix before you leave, Goals (at most 5, ranked with one winner), the Spend Plan, the Daily & Weekly ring line (linking to the Time area's view), Done. The Star Chart section leaves the Account (D-9); one line links to the `star-signs` page.
- **FR-N11 Flows.**
  - Sign-in is out of the way: signed out with no save, it is the content; otherwise it lives in the overflow. The code card is its device-code state.
  - Paste is a drop zone with three numbered steps and the clear-failure error.
  - Waiting and parsing show the walking blob with named steps.
  - Empty states use the sleeping blob plus the next action.
  - Can't read offers a labelled "use your last good save", with the gremlin.
  - Can't work it out shows the fallback Roster with "Report this", prefilled.
  - Stale is the stale-first banner.
  - Banners are toasts, shown once and then a dot.
  - What's new is the docked patch-notes scroll.
  - Footer: the fan disclaimer, 44 px links.
  - Clear my data: Goes / Stays, then hold to clear.
- **FR-N12 Suggestions.** The kind picker (three tiles), then one question at a time (When I'm… / I want… / So that… / Example, as M13 asks), then the public notice, then Turnstile (G9). The report form is four "what's wrong" chips plus one optional line. Your suggestions has the 3 most recently changed as quest-board notes with stamps, then the plain list. Outbox states (offline, saved for later, can't reach) use the toast. All copy and the scrub stay M13's; only the layout changes.

### 5.2 Characters (area C), with the full Build path

- **FR-C1 The Build path** (owner request 1). For each preset and each talent tab a Build covers (tabs 1–3, and the star tab, §5.3), the Build tab lists **every Build step that applies to the character, in the order M9 spends points** (the tab's core steps first, then the Build's order, as `nextPoints` does today). Each step shows:
  - the talent name;
  - "current → goal" (the goal is `min(target, max in this save)`, "(its max for now)" when the max is lower);
  - a bar;
  - the **cumulative points** from now through this step, written "+40 → Veins of the Infernal".

  Steps are banded, and the band shows as colour **plus** glyph **plus** word (DS-8):
  - **done**: already at its goal. A compact ✓ row, muted, in its place in the order. It doesn't count.
  - **can add now**: its cumulative total is at most the tab's **known points** (FR-C2). Ok-soft fill, ok rule, a "+" glyph.
  - **part now**: the known points run out inside it. Half fill, "+12 of 40 now".
  - **next after these**: beyond the known points. A surface fill with a dashed rule, muted text at 4.5:1 or more (never lowered opacity), a "→" glyph and the cumulative total. These steps say what comes next, never that the player can't buy them (owner: "next after these, never can't").
  - **later**: not applicable yet: a `stageAtLeast` condition, or a star talent whose book isn't found. A lock glyph, the condition in words ("from World 3, early"), left out of the cumulative total.

  Two step kinds are not "later". An `accuracyShort` step is in the order as usual, with the condition as a note ("if your accuracy is short"), because M9 can't tell. A bubble-capped step needs no points (its level comes from the bubble): it shows as done-style with "set by a bubble", outside the totals.

  A **band marker** line sits between the last "can add now" or "part now" step and the first "next" one: "At least 118 points known · they end here". Below it, the running totals let a player who has more points in game read straight down to where theirs land (owner: "if we have 140, not 100, we need the next steps immediately").
- **FR-C2 Known points.**
  - Tabs 1–3: M9 TR-7's lower bound per tab.
  - The star tab: FR-C10.
  - With no lower bound (one preset, below class Lv 15) or a bound of 0: no "can add now" band. The marker reads "No unspent points known: the totals show where new points go." Every step is "next after these" with its cumulative total.

  Points are per tab: a tab's cumulative total never borrows another tab's points. The tab-2 grants from Back To Basics and similar talents stay M9's arithmetic (TR-7).
- **FR-C3 The tab grid** (`character.build.presets` pick). The preset's tabs as tiles: the tab name, a fill of spent against the Build's total target, a badge "at least 12" when known points exist (`character.build.unspent`), and "Start here" on the lead tab (M9's next step's tab). A tap selects the tile and shows its path below. From 1000 px, every tab's path shows side by side in columns (Command Board layout), with both presets side by side when the width allows (today's ≥1000 px rule). The mismatch banner ("Swap to your skilling preset before you leave") sits above the grid when M9's wrong-preset blocker fires.
- **FR-C4 One step, then the rest.** Above the grid, the preset's first spend line at full weight ("Put the next 84 points into Book of the Wise (to 100)") and the next two muted. Below them, the full path (FR-C1). Nothing folds away (the owner's override of the pick's fold).
- **FR-C5 Sticky identity strip** (`character.shell`). A 56 px strip with the `WhoGlyph`, "Squire 85", pin + map, the Verdict glyph + word, and 44 px prev / next arrows that keep the tab. Under it, the tab bar (Now, Build, Gear, Cards, Signs, Skills), one badge per tab from its health (FR-C7). On scroll it shrinks to the glyph and name. The level-gate ruler (preset 2 at 15, tab 3 at the subclass, the next gear tier) shows on the Build tab only.
- **FR-C6 Next 2–4 steps everywhere** (owner request 1, "the next 2–4 talents"):
  - The Builds overview line per character lists the lead tab's known points and its next steps with their running totals, all in that one tab (D-14): "Tab 2 · at least 118 · Book of the Wise +84 · Leaf Thief +184 · Deforesting All Doubt +284". It never adds totals across tabs.
  - The roster tab chip (G4) carries the first.
  - The Build cell of the health matrix reads "at least 118 points".
- **FR-C7 Health matrix** (`character.overview`). F declares one shared type in `packages/engine/src/now/view.ts`:

  ```ts
  interface TabHealth { level: 'fix' | 'behind' | 'empty' | 'ok' | 'unknown'; word: string } // word carries a unit: "at least 215 points"
  ```

  Each tab's engine view fills it per character: Build, Cards, Signs and Skills in C's view files, and Gear in `packages/engine/src/gear/` (also C's). `characterTabs` entries gain `health(view, index): TabHealth | null` beside the old free-text `status`, which keeps feeding the Characters tile until I removes it. Severity order: fix, behind, empty, unknown, ok. Rows are characters (WhoGlyph, class and level). Columns are the tabs that publish `health`. Each cell is a glyph plus a word **with a unit** ("at least 215 points", "45 levels behind", "1 of 4 slots", "ok"). The cell is a 44 px link to that tab. Exactly one cell is ringed as the fix: the most severe, ties broken by Visit Order, then tab order. The class tree block sits under it (`character.overview` runner-up), and the slot ribbon (family level to the next character slot) sits in the header.
- **FR-C8 The other tabs.**
  - Class path: stepping stones.
  - Attack bar: the slot row with ghosts, built from real data.
  - Coming up: the milestone ladder.
  - Cards: card rack, before / after racks, by-map grind list and set level bars.
  - Gear: M18's views restyled, with units.
  - Signs: the sign slot strip, with "2nd slot at 19 points" said once.
  - Skills: the bar list with gate ticks.
  - The Skill Grid on Characters becomes the role matrix.

  Every number has a unit (DS-19). Every list behind a picture caps at 3 rows (DS-9).

### 5.3 Star Talents (area C, owner request 2)

**What the "special tab" is (researched, 2026-10-18).**
- It is the **Star Talent tab**. The game data names its pages "Special Talent 1–4". The wiki calls it "Special Talents (also called Star Talents)". The game's reset item says "Star Tab". Toolbox says "Star Talents". The UI says **"Star talents"**.
- At game 2.3.540, four pages hold 43 talents (ids 615–658): 13, 13, 13 and 4. Toolbox's fifth page name is empty in the data.
- No page is gated. Each talent is locked until its **Special Talent Book** is found. The book sets that talent's max level for the whole account (`SM_` is identical on every character), so a locked talent has max ≤ 0.
- In Worlds 1–4, pages 1–2 are reachable from W1–W3 content. Page 3 is mostly W3 and later, and page 4 is late game.
- Upgrade Vault row 53, "Special Talent", is a source of star points. It opens at 2,530 total Vault levels: 33 levels away on the W3-early account (US-12). The star tile links to the Vault page when the row is the next unlock.
- **Super Talents** are a different, W7 system that adds levels to class talents. They stay out of scope.

Sources: the wiki's Special Talents page, Toolbox `parsers/talents.ts` and `character.ts`, the game data, and the research note listed in Sources.

- **FR-C9 Star data per character and preset** (FR-F10, TR-3).
  - For each character and each of its presets: the star talents' levels (already read, `talents.active.star` / `talents.other.star`), each talent's max, and the preset's **star point total**.
  - The total comes from Toolbox's `calcTotalStarTalent` called on that character alone. For the inactive preset, the call uses that preset's own talents, because Star Player, Supernova Player and Stonks! add points per preset. It is exposed as a `toolboxCalls` entry, never by editing `vendor/`.
  - The research verified on all 11 public fixtures that the one-character call equals the full call for the active character.
- **FR-C10 Star known points are exact** (unlike tabs 1–3). Unspent = total − the sum of star levels; the research verified it is exact, since star levels carry no free levels. The path's known points are this number. The tile and the status line read:
  - "over budget by about 201" when unspent is −3 or less. The points came from the other preset's Star Player or Stonks! (a known trick). It is shown as a fact, never a nudge, and with "about", because a patch can add a star-point source Toolbox hasn't modelled yet;
  - "all spent" from −2 to 1 (a small tolerance for the same reason);
  - "40 unspent" above 1.

  The bands are checked in that order.

  When the total can't be computed (a failed section, an old save), it falls back to M9 TR-7's lower bound against the other preset, read "at least N".
- **FR-C11 Star Builds** (Knowledge Base, authored per ADR 0007, with Sources). There are two class-agnostic entries of a new **star Build** shape (TR-8), kept apart from M9's class Builds so they never take part in preset classification or the `kb.build(line, role)` lookup. Every dated source gives the same star core across class lines:
  - `talents.build.star-fighting`
  - `talents.build.star-skilling`

  Mage lines (Wizard, Shaman and their elites) add nothing extra, because Stonks! is in both cores (see below). The steps, in spend order:
  - **Fighting:**
    1. Stonks! to 30 (each point returns at least one star point up to about 30, so it pays for itself);
    2. Will of the Eldest to its useful cap;
    3. Beginner Best Class to its useful cap;
    4. Tick Tock = Attacks on Simmer = Goblet of Hemoglobin (a tie: levelled together), each to its max;
    5. page 2: Printer Sampling 1 and Shrine Architect 1 (agreed by every source);
    6. Dungeonic Damage to its max, then Frothy Malk to its max, then Telekinetic Storage to 1 (the cheaper reading of the disagreement: Gameslikefinder says 1 point, Sir_Grimtide levels it; the note says so).
  - **Skilling:**
    1. Stonks! to 30;
    2. Tick Tock (to its max) = Will of the Eldest (to its useful cap) = Toilet Paper Postage (to 100, an authored cap: its max can reach tens of thousands, and it would otherwise swallow every point; only when its book is found);
    3. page 2: Printer Sampling 1 and Shrine Architect 1;
    4. Supersource to its max, **only when the preset serves Mining, Choppin, Fishing or Catching** (the game's own text; this overrides the community build that puts it first on Worship and Alchemy presets);
    5. Action Frenzy to its max, then Frothy Malk to its max, then Telekinetic Storage to 1.

  **Every step has a target.** The sources give only "1 point", "up to 30" and an order, so the remaining targets are an authored judgment (ADR 0007): "its max" is the book max in the save (`SM_`, often 100 to 104 early on), and the two caps above are written down with their reason. Attacks on Simmer's AFK effect stops at +25%, which its curve reaches only past level 50, its max, so "max" is also its useful cap.

  **Ties** are one path row: "Tick Tock = Attacks on Simmer = Goblet: +N, split evenly". Its need is the sum of the members' needs. Inside the row the members show their own current and goal. Under the known points, a part-paid tie spreads its points evenly. The same rule applies to M9's existing `tie` steps on tabs 1–3, which `nextPoints` ignores today; one `spendOrder` gives both lists.

  **What a preset serves.** A skilling preset serves the AFK skills its matched M9 class Build lists in `serves`. When M9 can't classify it, or the class Build lists none, the Supersource step shows with its condition in words ("only helps Mining, Choppin, Fishing and Catching") instead of being dropped.

  Sources:
  - Sir_Grimtide's five Toolbox builds (tier 3, updated 2026-10-10 to 10-15), the only builds with a star section;
  - Gameslikefinder (2026-05-26) and Powerupgaming (2025-11-10) tier lists (tier 3);
  - the wiki's Special Talents page (tier 2, for unlocks and effects);
  - Toolbox provenance (tier 1).

  The disagreements go in `notes` (Telekinetic Storage at 1 point vs levelled; Will of the Eldest rated from S+ to C). The Build is not Contested, because the steps every source shares are the core. Players who put 100 points into Printer Sampling (common on both private saves) see that step as done; that is never flagged as wrong (D-12).
- **FR-C12 Useful caps** (a new star-step target form, TR-8). Two star talents in the Builds stop helping before their max. Their target is the useful cap, worked out from save data:
  - Will of the Eldest: floor(best class level on the account ÷ 10). The rule is the game's own effect text ("+1 all stats per 10 levels of your best character", wiki, tier 2); Toolbox doesn't model it;
  - Beginner Best Class: floor(best Beginner-line level ÷ 10), from Toolbox `damage.ts`. It is 0, and the step shows as skipped with "no Beginner-line character yet", when the account has no Beginner, Journeyman, Maestro or Voidwalker.

  Stonks!'s 30 is a plain number target. **ADR 0005:** these are counts and a division on Account State, the same kind of save arithmetic as M9 TR-7's lower bound, not a damage or gain formula of our own; the Will of the Eldest rule cites its wiki text, and a patch that changes it is caught by the entry's staleness (M11 `isStale`). Each cap has a contract test on both private saves.
- **FR-C12a Stonks! returns points.** At its target of 30, Stonks! adds about 49 star points. The path asks the worker for the preset's total with Stonks! at its target (one more `starTotal` call on a copy, Toolbox's own numbers) and adds the difference to the known points from the Stonks! row on. The Stonks! row says so ("pays for itself: +49 points"). If the call fails, the row keeps the note and the totals after it say "about".
- **FR-C13 The star path.**
  - The star tab is one more tile in the tab grid, "Star talents", with its badge ("40 unspent").
  - Its path is FR-C1's list over the whole star budget, so the cumulative total runs across pages. Steps are grouped under page headings ("Page 1", "Page 2"), but the points are one pool.
  - A talent whose book isn't found yet is in the **later** band, with "find its book" and where the book comes from, from a fact table `talents.fact.star-books`. It is authored tier 2 (the wiki's book list, verified 2026-10-18), because Toolbox's data has no book sources; under ADR 0007 an authored fact table carries its Source and patch tag, and goes Stale like any other.
  - Talents with points the Build doesn't name are listed under the path, as for the other tabs.
- **FR-C14 Every character and preset.** The star tile and path show on both presets of every character, whatever the class, from class Lv 1, because star points start at Lv 1. The Builds overview line adds a second, star part when there are more than 1 unspent, with its own totals ("· Star talents · 40 unspent · Stonks! +30"). The Build column of the health matrix counts it too.
- **FR-C15 The empty star tab** (Owner review Q2). Both private saves have the common mistake the dossier names: one preset's star tab is empty while the other is spent (all 5 characters on the W2-late account, and 2 of 6 on the W3-early account).
  - Recommended: one account-level Goal, `talent-presets.check.star-empty`, at position 3 (free value). It reads "Spend your star points on the other preset too", with one line per character as details (#70 A5, the noise rule).
  - If the owner declines, the Build tab still shows the tile's "N unspent" badge, and nothing appears on Now.
  - If accepted, it is built in Phase I, not in C: the Detector goes in M9's `builds/` folder, the entry in `talent-presets.yaml`, its place in each Stage's Priority List at 3h (the free-value fill M9's preset Goals use), and it changes the `## Now` golden, which only I may touch once the areas have merged.
- **FR-C16 What stays out.** No star reset suggestions: the Star Talent Reset Potion costs gems, and M9 FR-17 never suggests gem buys. No warning for over-investment (Printer Sampling at 100 is a choice). No Super Talents.

### 5.4 Systems (area S)

- **FR-S1 Hub: the Stage report card** (`systems.hub` pick).
  - First, a **"Wasting now"** strip: the Systems whose status is wasting (they throw value away today, whatever the Stage), as glyph chips with their count ("7 Systems wasting"), each opening its page. They have no place on a Stage axis, so they don't get one.
  - Then the report card proper: one horizontal Stage axis (W1-early … W4-entry, from `STAGES`), and one row per System with a Stage Expectation the account is behind on (`EngineResult.behindSystems`, M15 F5), with a dot where the account is and a tick where the Stage expects it. The gap is drawn as length.
  - Rows run by gap, largest first. The worst row is open with its one step (a `TokenLine`). At most 5 rows show, then "All Systems (34)".
  - The hub's wasting count moves into the card's header ("3 Systems wasting"). The nav badge goes (FR-M8).
- **FR-S2 Hub: all Systems.** Under the report card, the world bands (M17's index, kept): tiles with the System's own 16 px glyph from the art library, the status glyph + word, and the unlock line on a locked tile ("Opens: beat Efaunt"). "Not covered yet" is said once per band ("4 here aren't covered yet"), not on each tile (v2 #3).
- **FR-S3 Page frame** (`systems.page-frame` Step first).
  - Phone, top to bottom: the step (at most two lines, a `TokenLine`), the Stage meter, the picture, the folded order (at most 3 rows, then "show all"), the Source.
  - From 1000 px: the split desktop layout, with the picture on the left and the step, order and the tapped element's sheet on the right.
  - The generic sections (every Next Action of the System, quick collects, Spend lines, how it opens, what ActiveOn checks) stay M17's, styled with the atoms.
- **FR-S4 New System page bodies**, each from data the engine already has, each a lazy part (`systems/pages.ts`):
  - **Stamps** (`stamps`): the stamp book grid, three tabs in game order. Owned tiles show a level ring (level of cap), unowned ones a silhouette with "how to get" in the tap sheet. The one lit tile is M8's first stamp to get (`stamps.goal.collect` / `stamps.check.*`). The folded order is the "next three" ribbon. Cap raises show only those in M7's plan.
  - **Statues** (`statues`): a wall of 32 statues with a tier border (none, Gold, Onyx) and the level (FR-F10). The next Gold is lit, from M7's statue item ("Price not checked" when M7 has no price). The spread chart (per-character levels) shows only if V-4 confirms Toolbox gives the split.
  - **Upgrade Vault** (`upgrade-vault`): the tower. Floors are rows grouped by unlock threshold, with a "you are here" line at `vault.totalLevels`. Rows above it are dimmed with their threshold. The one lit row is M7's first Vault buy. The header is the next unlock gap ("33 levels to open Special Talent", `vault.nextUnlock`).
  - **3D Printer** (`printer`): the slot grid of M14's Parallel Slot Plan ("Forest Fibres → Megalodon Tooth" is the one change, the others "no change").
- **FR-S5 Restyled bodies.**
  - Cog Board: the 12 × 8 heat map with seats as chibis and M20's free seat lit.
  - Worship: charge tanks, with "spend it" said once and wave rulers under them.
  - Trapping: G7.
  - Cauldron seats: a per-slot strip.
  - Alchemy: M19's pots and tubes. The vial shelf labels only the best three. The Pay 2 Win grid is G8.
  - Gear: the heat strip from 720 px, the worst-slot list under it.
  - Armor Smithy: set cards.
  - Star Signs: the constellation map, with the claimable star lit and "3 of 19 points to a 2nd sign" (M16 data). The Account's Star Chart section moves here (D-9).
- **FR-S6 Picture rules.** Every picture has exactly one lit element: the page's highlight (M17 FR-31), else the System's first Next Action, else none. Tapping any element opens one sheet with its value, next value, cost and Source. At most the lit element plus 3 others carry text labels (DS-20). State classes are scoped (DS-21).

### 5.5 Time (area T)

- **FR-T1 Timeline** (`time.timeline`). M17's lanes, Back marker, hatched stale band and account band, restyled. A bar label that doesn't fit inside its bar moves under it, never clipped ("Anvil fu…" at 390 px). Lane heads use the `WhoGlyph` with the badge letter.
- **FR-T2 Daily & Weekly** (`time.daily-weekly`). The two-ring reset clock: the day ring inside the week ring, with "now" and reset ticks. Beside it are three bands (no bank, banks, weekly) drawn as pip rows. Each band's rows open in a sheet (at most 3, then "show all"). Banking rows show 0–3 day pips, red on the last ("lost tomorrow"). A filter chip row (5 / 15 / 30 min, the "Five-minute plan") shows only rows whose `minutes` fit, no-bank rows first. It lives as a Timeline section (`#daily`). Now's Account keeps M20's one ring line, linking there.
- **FR-T3 Parallel Slots grid** (`time.parallel-slots`). A Timeline section (`#slots`). Rows are characters (WhoGlyph); columns are cauldron, traps, worship, Cog Board and printer, each with a count ("2 free"). Each cell is a 16 px slot glyph, filled or dashed. An empty cell names who should fill it (M20's `slots.priority.fill-order`), and exactly one cell is NOW. Its step is about 12 words. The unassigned tray is the screen-reader and text alternative (one line per slot kind, with characters said once).
- **FR-T4 Stale.** On a stale save, the hatched waste band covers the past, waste shows as stripes, and a repeated row reads "then the same on 5 more" (built in M17; restyled).
- **FR-T5 Compact AFK strip.** `AfkStrip`, exported for Now:
  - one strip on a shared axis from now to the Back marker;
  - a 16 px WhoGlyph at each character's first binding limit, outlined in Fix colour when it binds before the return;
  - a flag at Back;
  - one sentence under it: "3 limits bind before you're back: the anvil on Bowman 60 first, in 3h 40m".

  It is built from `TimelineBar` data, and a tap opens the Timeline. Area T builds it; Integration places it (FR-I1).

### 5.6 Map and nav (area M)

- **FR-M1 The Map place** (`map.world-map` Gate-first, phone):
  - One band per world, from W1 to the account's `currentWorld`, plus the next world dimmed. A finished world folds into one line ("W1 · 32 maps cleared · Amarok beaten").
  - The open world shows its boss gate as a big node: the boss, keys held and per day (M6), and the world crystal held for the gatekeeper (`worldCrystals`).
  - The frontier door is a ring filled by the best character's kills against the requirement, with "in 14h 04m" from M2's frontier fight (DS-6), or no time when nobody can fight there (DS-3).
  - Character markers (WhoGlyph, 16 px, with the badge letter) sit on their current map; a map shared by several characters stacks with a count.
  - A tap on any map node opens its sheet.
- **FR-M2 Map sheet** (`map.map-sheet` Bottom sheet, side panel from 1000 px), in this order:
  1. who is here (glyph chips);
  2. door progress per character ("Door 1 · 120 of 300 kills", from FR-F10's door kills);
  3. the map's card (from `cards.fact` drops: owned level, or "not yet", with its base drop chance);
  4. its Death Note kills against the next rank (`account.deathNote` and the generated Death Note ranks);
  5. the constellations on this map (M16 facts);
  6. a Walkthrough step here, if any ("Get 990 more Megalodon Teeth here").
- **FR-M3 Overlays** (overlay switcher). A segmented control: Route (default) · Constellations · Death Note · Cards. Exactly one at a time: the overlay's one ring is lit, the rest of the nodes are grey. Route shows the pusher's path doors and the maps of shown Walkthrough steps.
- **FR-M4 World strip** from 1000 px: four horizontal world bands of map nodes (our own signpost glyph), portal edges labelled with the kill requirement, and the frontier edge lit with its time. On a phone it falls back to Gate-first (DS-22).
- **FR-M5 Routes.** `#map` opens the Map place; `#map-<mapIndex>` opens it with that map's sheet open. An unknown map index opens `#map` with no sheet. The grammar lives in `shell/route.ts` (F adds it, TR-6).
- **FR-M6 Nav** (`nav.shell`). Five places, in this order: Now, Characters, Systems, Timeline, Map. Each is a glyph (the `v2-map-nav-*` art) plus a word. Bottom bar under 720 px, rail from 720 px (M17 D-5).
  - Badges only on **Now** (the counter's number) and **Timeline** (limits that bind before the return), named in words for screen readers. The Systems badge goes (D-7).
  - A Character page shows under the place it was opened from (M17 FR-4).
- **FR-M7 The map is facts, not advice.** It adds no Goals. Times and counts come from M2 (frontier), M6 (keys), M8 (cards), M14 (Walkthrough steps) and M16 (constellations), and the gates from an authored fact (TR-10). "See it on the map" links go into the Purpose quest line, the grind list, Walkthrough steps with a map, and constellations (FR-I1).

### 5.7 Integration (area I)

- **FR-I1 Cross-area wiring.** Place `AfkStrip` on Now (FR-N1 step 6). Add "See it on the map" links (FR-M7) and the Daily & Weekly link from Now's Account to `#daily`.
- **FR-I2 One golden pass.** Regenerate every golden and check each section's diff against its area's story outputs (TR-14).
- **FR-I3 Clean-up.** Remove the token aliases (`--coin*`), the old styles (`styles/now.css`, `styles/views.css` and the per-module CSS the atoms replace), the old `Glyph` SVGs in `Shell.tsx` and `@fontsource/atkinson-hyperlegible`. The bundle and CSS budgets must pass with margin (TR-12).
- **FR-I4 Release notes.** One What's new entry ("ActiveOn has a new look…", in the patch-notes scroll's three items: the new Now screen, the full Build path with Star Talents, and the Map).

## 6. User stories

These are the fixtures the stories use. Accounts are described by account, class and level, never by name. **W2-late** is `fixtures/scrubbed/scrubbed-w2.json`. **W3-early** is `scrubbed-w3.json`, whose golden clock leaves its save 8h 28m old. The four Toolbox public saves are **`latest`** (11 characters, World 4 entry), **`first`**, **`second`** and **`fourth`**. A "fresh" run sets `now = lastCloudSave + 60 s`.

### US-1 The answer first
*As a player at a pause point in a Play Session, I want one count and the first fix at the top, so that I know in three seconds whether I can log off.*
- **Given** W3-early, fresh, at 390 × 844 / **When** Now renders / **Then** the counter reads "2 fixes before you leave", and the first fix row reads "Bowman 60 · Sands of Time · Swap to your fighting preset". Both sit above the fold. The 2 Unknown characters (Shaman 54, Wizard 73) are in a fold and not counted.
- **Given** the same / **When** the line renders / **Then** it shows no time token. No `fixSeconds` exists for `talent-presets.check.wrong-preset`, so nothing reads "~10 s" or "time not known" (DS-3, DS-23).
- **Given** W2-late, fresh / **When** Now renders / **Then** the counter reads "2 fixes before you leave" (1 character + 1 account blocker), with the character's fix as the first row.

### US-2 One job, said once
*As a player with many characters, I want a repeated job shown once with who it is for, so that I don't read the same sentence six times.*
- **Given** W3-early / **When** Now renders / **Then** one roster finding reads "Anvil full on 6 · collect" and another "Worship full on 4 · spend". Each is a filter chip, and no row prints either pill's words.
- **Given** `latest` / **When** Now renders at 390 px / **Then** no sentence appears more than twice on the first screen. The trap job is one "Same job on N characters" card reading "Collect and re-place your finished traps", with one glyph chip per character carrying its own count ("6", "7").
- **Given** a grouped card / **When** a glyph chip is tapped / **Then** that character's Focus opens.

### US-3 An old save says so first
*As a player, I want to see that my save is old before I see "safe", so that I don't log off on stale advice.*
- **Given** W3-early at its golden clock (8h 28m old) / **When** Now renders / **Then** the first sentence is "Your save is 8h 28m old: press Cloud Save, then check again", and the counter is demoted to "last known: 2 fixes".
- **Given** the same / **When** the Timeline opens / **Then** the past is one hatched band, and a repeated row reads "then the same on 5 more".

### US-4 All set is a moment
*As a player, I want a clear end state, so that I log off with confidence.*
- **Given** `allSetW2`, a test fixture F adds to `apps/activeon/test/fixtures.ts`: W2-late with the Barbarian 60's food and the account blocker resolved / **When** Now renders / **Then** it reads "All set: safe to log off" with the campfire and M3's first-fill line, in the parchment frame.
- **Given** `prefers-reduced-motion: reduce` / **When** the campfire renders / **Then** it shows frame 1 and runs no animation (`getAnimations()` is empty).

### US-5 Pause points pick themselves
*As a player, I want the screen to know whether I just arrived, am doing rounds, or am leaving, so that I see the right list without setting anything.*
These use `historyOf(...)`, a test builder F adds to `packages/engine/test/helpers/` that makes `HistoryEntry` lists from a fixture with shifted clocks and changed levels.
- **Given** a history where the previous Play Session ended 9 h before this one started, and the session is 2 minutes old / **When** Now renders / **Then** "Log in" is picked, with "Picked Log in: you were away 9h". The full Away card shows the levels gained per character since M9's baseline, the limits that bound while away (grouped), and the resets passed: at most 7 rows.
- **Given** the same session 12 minutes later, with the count above 7 or a character with a Fix not yet opened / **When** a save arrives / **Then** "Rounds" is picked.
- **Given** every character with a Fix opened this session, and the count at 2 / **When** Now renders / **Then** "Log off" is picked. It lists the 2 unmet AFK Setup items, neither ticked.
- **Given** the next save shows both fixed / **When** it is parsed / **Then** both tick themselves, and the list ends with the wax seals, the campfire and "Safe to log off · back in 8h". No tap-to-tick control exists.
- **Given** a pasted save (no history) / **When** Now renders / **Then** no Away card shows, and the pause point is Rounds.

### US-6 The whole Build, with where my points land (owner request 1)
*As a player who just collected levels, I want every step of my Build with a running point total, so that I can spend points the app doesn't know about yet.*
- **Given** the W2-late Shaman Lv 44 on its skilling preset, whose lower bound is at least 118 points (M9 US-2) / **When** its Build tab opens / **Then** the selected tab's path lists every applicable step of the Shaman skilling Build in spend order. Each unmet step shows "+N → <talent>", with N the cumulative points from now. The steps whose total is at most 118 are "can add now"; the step that crosses 118 is "part now"; every later step is "next after these". The marker "At least 118 points known · they end here" sits between them.
- **Given** the same / **When** the path renders / **Then** the number of rows equals the Build's applicable steps for that tab (done steps included, as ✓ rows). No rendered path string contains "can't".
- **Given** the W3-early Squire Lv 85 with an empty second preset (at least 1,020 points) / **When** that preset is shown / **Then** each tab's path is "can add now" up to that tab's own lower bound. No tab borrows another's points.
- **Given** a character below class Lv 15 (one preset, no lower bound) / **When** its Build tab opens / **Then** there is no "can add now" band. The marker reads "No unspent points known: the totals show where new points go", and every unmet step is "next after these" with its total.
- **Given** any character / **When** the Builds overview renders on Characters / **Then** its line names the known points and up to the next 4 steps with their totals.

### US-7 Star talents on every character and preset (owner request 2)
*As a player, I want my Star talents planned like my other tabs, so that both presets get their star points.*
- **Given** `first` (7 characters) / **When** each Build tab opens / **Then** every active preset's "Star talents" tile reads "all spent" (one character has 1 point left, which counts as all spent).
- **Given** `fourth` / **When** the preset at −201 is shown / **Then** its tile reads "over budget by about 201". No Goal, nudge or warning appears.
- **Given** W2-late / **When** Characters renders / **Then** all 5 characters show one preset whose star tab is empty, with the tile reading "N unspent", where N is that preset's computed total. Its path starts at "Stonks! +30".
- **Given** the W3-early Wizard Lv 73's skilling preset, whose matched class Build serves Worship (Sir_Grimtide's Wizard/Worship build) / **When** its star path renders / **Then** it has no Supersource step.
- **Given** W3-early (no Beginner-line character on the account) / **When** a fighting star path renders / **Then** Beginner Best Class shows as skipped, with "no Beginner-line character yet".
- **Given** a copy of W2-late with one Build talent's max set to −1 (book not found) / **When** the path renders / **Then** the talent is in the later band, with "find its book" and the book's source.
- **Given** W2-late, and the owner accepts Q2 / **When** the engine runs / **Then** one account Goal reads "Spend your star points on the other preset too", with 5 details, at position 3.

### US-8 Every character at a glance
*As a player, I want to see who is set up wrong on which tab, so that I fix the worst first.*
- **Given** W3-early / **When** Characters renders / **Then** a 6 × 5 health matrix shows. The Squire 51's Build cell reads "at least 115 points", every cell has a unit, and exactly one cell is ringed.
- **Given** a cell / **When** it is tapped / **Then** that character's page opens on that tab.

### US-9 The Map
*As a player, I want to see how far I am from the next world and who is where, so that I know what the pusher's next door is.*
- **Given** W3-early / **When** `#map` opens / **Then**:
  - W1 and W2 are folded lines with their map counts and bosses;
  - the W3 band is open, with the frontier door as a ring on `frontier.mapName`, filled by the best character's kills, with the time from that fight's kill rate ("in 14h 04m", or no time when nobody can fight there);
  - six markers sit on their maps;
  - the W4 gate shows dimmed, never locked.
- **Given** the map of the W3-early Bowman 60 / **When** it is tapped / **Then** the sheet lists, in this order: who is here, door progress per character in kills, the map's card, its Death Note kills against the next rank, and its constellations.
- **Given** the Death Note overlay / **When** it is picked / **Then** exactly one overlay is on, and only its ring is lit.
- **Given** `#map-<index>` for a map not in the facts / **When** it loads / **Then** the Map opens with no sheet.

### US-10 The nav
*As a player, I want five stable places with only the badges that matter, so that the bar is calm.*
- **Given** W3-early / **When** the shell renders under 720 px / **Then** the bottom bar shows Now, Characters, Systems, Timeline and Map, each a glyph plus a word. Now carries "2", Timeline carries the number of `buildTimelineView` items marked `before` the return (the same items the Timeline outlines), and Systems carries none.
- **Given** 720 px or wider / **When** it renders / **Then** the same five sit in a rail, in the same order.

### US-11 Systems as a report card
*As a player, I want to see which Systems I'm behind on for my Stage, so that I learn what I'm skipping.*
- **Given** W3-early (its golden lists 7 wasting Systems, among them Talent presets, Companions and pets, and Minigames) / **When** Systems opens / **Then** the "Wasting now" strip shows those 7 as chips, and the report card's axis rows are the behind-for-your-Stage Systems, Cards and Obols among them (at most 5, then "All Systems"). The worst axis row is open with its one step.
- **Given** the world bands / **When** they render / **Then** "not covered yet" appears once per band, not on each tile.

### US-12 New System pictures
*As a player, I want the Vault, Statues, Stamps and Printer drawn as pictures with the next step lit, so that I see where my coins and samples should go.*
- **Given** W3-early / **When** `#system-upgrade-vault` opens / **Then** the tower's header reads "33 levels to open Special Talent", the "you are here" line sits at the account's total Vault levels, and exactly one row is lit (M7's first Vault buy).
- **Given** W2-late / **When** the same page opens / **Then** the header reads "56 levels to open Active Murdering".
- **Given** W3-early / **When** `#system-printer` opens / **Then** the slot grid shows exactly one changed slot, and every other slot reads "no change".

### US-13 Why, one tap away
*As a player, I want the reason and the Sources behind one tap, so that the card stays one line.*
- **Given** a Goal card / **When** it is tapped / **Then** a sheet opens with the delta first (when the entry has one), then who and where, the why spoken by our guide blob, and Sources as "IdleOn Wiki · checked 17 Oct". Esc closes it and focus returns to the card.
- **Given** any card face / **When** it is inspected / **Then** it carries at most one control (Skip today), and Report this sits in the sheet's overflow.

### US-14 Waiting, empty and broken
*As a player, I want waiting, empty and broken states that tell me what to do, so that I'm never staring at a blank screen.*
- **Given** a signed-in session with no save yet / **When** 30 s pass / **Then** the walking blob still names its step, and the Cloud Save hint appears.
- **Given** a lazy part that loads in under 400 ms / **When** it opens / **Then** no blob ever shows.
- **Given** a lazy part whose fetch fails / **When** it opens / **Then** one line, "Couldn't load this part.", shows with a 44 px "Try again", and the rest of the place still works.
- **Given** every Goal skipped / **When** Now renders / **Then** the sleeping blob says what to do next ("Nothing to do now. Back in 8h 10m: …").
- **Given** a broken newest save with a last good one / **When** it is parsed / **Then** the gremlin card offers "Use your last good save (from 09:12)" as a labelled choice. Nothing is swapped silently.

### US-15 What's new, without a nag
*As a player, I want the release notes once, without covering my answer.*
- **Given** a new release / **When** Now renders / **Then** a 56 px "What's new · 3" tab is docked above the bottom bar, and the counter is still above the fold. A tap opens the scroll. "Got it" dismisses it for this release.

### US-16 My suggestions
*As a signed-in player, I want to see what happened to what I filed.*
- **Given** 5 filed suggestions / **When** Your suggestions opens / **Then** the 3 most recently changed are notes on the quest board with their stamps, and the other 2 are plain list rows. Each row is a 44 px link.

### US-17 Accessibility holds
*As a player using a screen reader, reduced motion or greyscale, I want the same answers.*
- **Given** every place, in light and dark / **When** axe-core runs / **Then** there are no violations.
- **Given** the QA probe at 390 and 1280 px / **When** it measures interactive elements / **Then** none is smaller than 44 × 44 px, and no text node is under 12 px except the 11 px legal line.
- **Given** a greyscale screenshot of each place / **When** it is reviewed / **Then** every Verdict and every status can be read from glyph and word.

## 7. Technical requirements

- **TR-1 The Design Lab snapshot** (FR-F8, D-2). The Lab's durable private copy already sits at `/Users/yasser/Documents/Github/idleon-forge/fixtures/private/design-lab/` (copied 2026-10-18 from the session scratchpad, without `ref/`). F makes the public part from it:
  - **Public, committed:** `docs/design-lab/` with
    - `brief.md`, `critique.md`, `critique.json`, `inventory.json`, `tokens.css`;
    - `v2/critique.md`, `v2/critique.json`, `v2/inventory.json`;
    - `art/*.svg` and `art/README.md`;
    - a short `README.md` stating what it is, the date, the owner's ruling, the overrides and that it is reference material, not shipped code.

    Before committing, `/Users/yasser/Documents/Github/idleon-forge/fixtures/private/denylist.txt` (main checkout only; worktrees don't have it) is run over every copied file; it must find no names. F also writes `docs/design-lab/art/MANIFEST.json`: each SVG's file name and sha256, which the ADR 0009 guard reads (TR-4). The copy leaves out `index*.html`, `parts/`, `v2/parts/`, `data/`, `shots/`, `research/`, `build/`, `preview/`, `tmp-*` and **`ref/` (game sprites, never copied anywhere, ADR 0009)**.
  - **Private, local only:** the full Lab minus `ref/` is at `fixtures/private/design-lab/` (gitignored). That holds the parts' HTML, CSS and JS and the data renders. Build agents read the 1:1 markup there, from the main checkout's absolute path above, because worktrees don't contain ignored files.
- **TR-2 Layout of the design code** (`apps/activeon/src/design/`, owned by F):

  ```
  design/
    tokens.css        base + [data-direction] sets (field, quest, board), light/dark (FR-F1)
    base.css          element defaults: body, headings, focus ring, tap-min, type scale, reduced motion
    fonts.ts          the @fontsource latin imports (FR-F2)
    art/
      PixelArt.tsx    <PixelArt name ramp w size title? decorative?>
      art.css         ramp classes, slot fills, stepped frame keyframes, reduced-motion pause
      core.ts         generated: the main-chunk motifs (TR-12)
      generated/      generated: one module per Lab group (now, cards, flows, character, map, systems, time)
      names.ts        generated: the ArtName union
    who/WhoGlyph.tsx  FR-F4
    atoms/            FR-F5, one file per atom + atoms.css
    format.ts         re-exports the engine's formatters for components (no formatting of its own)
  ```

  `main.tsx` imports `design/fonts.ts`, `tokens.css`, `base.css` and `atoms.css` in that order, before any place CSS.
- **TR-3 Account State additions** (FR-F10), one `schemaVersion` bump in F (M1 TR-11, with `FIELD_SOURCES` and the contract snapshot), read only in `adapter.ts`:

  ```ts
  // characters[i].talents (M9 TR-3) gains:
  starPoints: { active: number | null; other: number | null };
  //   Toolbox calcTotalStarTalent on [c] for the active preset, and on c with the other preset's
  //   flattened talentPreset.flatTalents + flatStarTalents for the other (FR-C9). null when the call throws
  //   or a section it reads failed. Exposed as toolboxCalls.starTotal in packages/toolbox-parsers/src/calls.ts.
  // star TalentLevel.max is already SM_ (account-wide; <= 0 means the book isn't found).

  // characters[i] gains:
  doorKillsLeft: Record<number, number[]> | null;
  //   raw KLA_<i> (KillsLeft2Advance) for every map, unfloored, as M4's portalKillsLeft reads for the
  //   current map. Door kills done = requirement - value (never below 0).

  // account gains:
  statues: { index: number; name: string; level: number; grade: number; byCharacter: number[] | null }[] | null;
  //   Toolbox statues (level, StuG grade); byCharacter only if V-4 finds per-character levels in Toolbox.
  ```

  Nothing here is a name, and nothing leaves the browser (ADR 0006).
- **TR-4 Art pipeline** (FR-F3). `scripts/art/import.mjs` (Node 22, no dependencies) reads `docs/design-lab/art/*.svg`. The Lab uses at least four authoring styles:
  - rect runs with class fills defined in a `<style>` block (`now`, `cards`);
  - `<g fill="var(--px-*)">` groups (`v2-*`);
  - `<g style="fill:var(..)">` groups (55 of the 101 `v2-*` files);
  - per-colour `<path>` runs whose slot mapping (`--p1:var(--mat-blob-1)`, `--r1:var(--tier-gold-1)`, `--p2:var(--return-line)`) sits in the root `style` attribute (`flows`).

  The importer **parses** every `<style>` block and `style` attribute first, into the motif's slot-to-token map, its frame list and its frame timing (fps and order from the `@keyframes`). Only then does it drop them. The output per motif is `{ id, title, grid, frames: Array<Record<Slot, string>>, fps, slots: Record<Slot, TokenExpr> }`. Each frame's same-colour runs are merged into one `d` string. Nothing inline reaches the DOM (CSP `style-src 'self'`): the slot map becomes one generated ramp class per motif in `art.css`. An unknown style form fails the import, never passes silently.
  - The generated `.ts` files are committed. CI re-runs the import and fails on any diff.
  - `<PixelArt>` renders `<svg viewBox shape-rendering="crispEdges">` with `role="img"` and a `<title>`, or `aria-hidden` when `decorative` (a glyph beside its word). It draws at whole multiples of the motif's own grid only (a 16-grid motif at 16, 32, 48 or 64 px; a 24-grid one at 24 or 48; a 32-grid one at 32 or 64). The prop is `scale`, never a free pixel size.
  - Colours come from ramp classes in `art.css` that set `--p1…--p4`, `--px-*` and the eye tokens. Frames swap with `steps()` keyframes at 4 or 6 fps. `@media (prefers-reduced-motion: reduce)` pins frame 1.
  - **ADR 0009 guard** (a test): every generated id has a source file in `docs/design-lab/art/` listed in `MANIFEST.json` with a matching sha256. `art/README.md` states that every listed file is our own drawing; most files' `<title>` only names the object, so titles aren't the check. No path in the repo contains `design-lab/ref`.
- **TR-5 Atom contracts** (F). All atoms are typed, take no inline styles except CSS custom properties for lengths (bars, as the Timeline does today), and meet DS-15:

  ```ts
  type Urgency = 'fix' | 'soon' | 'fine' | 'optional' | 'unknown' | 'skipped';
  interface PillProps { urgency: Urgency; glyph: ArtName; verb: string; count?: number; filter?: { pressed: boolean; onToggle(): void } }
  interface WhoGlyphProps { family: ClassFamily; classLabel: string; level?: number; scale: 1 | 2 | 3; badge?: string; world?: number; animate?: boolean; decorative?: boolean } // 16-grid chibi at 16/32/48 px; animates only when `animate` (the playing character)
  interface TokenLineProps { who?: { family: ClassFamily; label: string } | null; where?: string | null; howLong?: string | null } // nulls are hidden (DS-3)
  interface SheetProps { open: boolean; title: string; onClose(): void; children: ReactNode; side?: 'auto' | 'bottom' | 'panel' } // focus trap, Esc, inert background, return focus
  interface MeterProps { value: number; max: number; label: string; tone?: 'ok' | 'fix' | 'muted' | 'accent'; dashed?: boolean }
  interface SegmentedControlProps<T extends string> { label: string; value: T; options: { value: T; label: string; glyph?: ArtName }[]; onChange(v: T): void } // a radio group
  interface EmptyStateProps { line: string; next?: ReactNode } // sleeping blob at 64 px
  interface LoadingProps { steps?: string[]; current?: number; hintAfterMs?: number; delayMs?: number } // walking blob over a skeleton
  ```

  `ClassFamily` (`beginner | journeyman | warrior | archer | mage`) is added to the view rows by the engine from `classes.fact.class-tree`, so the UI never imports the Knowledge Base (bundle guard).
- **TR-6 Formatters and routes** (F).
  - `packages/knowledge/src/template.ts` gains `{x:in}` (a moment, `inSpan`) and `{x:ago}`. `{x:duration}` stays for effort. Every `{x:duration}` used for a moment in `packages/knowledge/systems/*.yaml` moves to `{x:in}` (a codemod plus a check rule: an entry field named `*At`, `eta` or `fillsIn` must use `{x:in}`).
  - `shell/route.ts` adds (with `#map-<n>` checked **before** the existing `#<tab>-<index>` pattern, which it would otherwise match, and a test for it) `{ place: 'map'; mapIndex: number | null }` and `{ place: 'timeline'; section: 'daily' | 'slots' | null }`, with `#map`, `#map-<n>`, `#daily` and `#slots`. `KnownRoutes` gets `maps: readonly number[]`. `Place` gets `'map'`.
  - These are pure, total parse and format functions with table tests. F adds them so that areas T and M don't both edit the file.
- **TR-7 View words split** (F, no behaviour change). `packages/engine/src/now/view-words.ts` becomes `now/words/{shell,now,characters,systems,time,map}.ts`. `view-words.ts` re-exports them, so imports keep working. Each area edits only its own words file (§9).
- **TR-8 Build path and star Builds in the engine** (C).
  - **Schema** (`packages/knowledge/src/schema.ts`, an M9 TR-5 amendment). Class Builds are untouched: their `tabs[].tab` stays 1–3, so no `t.tab <= 3` or `lb.byTab` use breaks. A new entry shape sits beside them:

    ```ts
    StarBuildEntry = Base.extend({
      type: z.literal('build'),
      variant: z.literal('star'),          // class Builds keep variant 'afk'
      role: z.enum(['fighting', 'skilling']),
      steps: z.array(z.strictObject({
        talent: RawName, page: z.int().min(1).max(4),
        target: z.union([z.int().positive(), z.literal('max'), z.strictObject({ cap: z.enum(['best-level-tenth', 'best-beginner-tenth']) })]),
        tie: z.string().optional(), core: z.boolean().optional(),
        when: z.array(z.union([StepCondition, z.strictObject({ kind: z.literal('servesAny'), afk: z.array(AfkType) })])).optional(),
      })).min(1),
    })
    ```

    The Build loader keeps star Builds out of M9 TR-6's classification and out of `kb.build(line, role)`; a separate `kb.starBuild(role)` returns them. M9 TR-15's core-step check learns that Stonks! is the star Builds' core step.
  - **Roadmap** (`packages/engine/src/builds/roadmap.ts`):
    - one `spendOrder(tab, build, ctx)` function feeds both `nextPoints` and the path, so they never disagree;
    - `BuildTabView` gains `known: { kind: 'lower-bound' | 'exact' | 'none'; points: number | null; overBy: number | null }` and `path: BuildPathStepView[]`;
    - `BuildPresetView` gains `star: BuildTabView | null`.

    ```ts
    interface BuildPathStepView {
      key: string;
      talentId: number;
      label: string;
      page: number | null;          // star pages 1–4
      current: number;
      goal: number;                 // min(target or cap, max in this save)
      need: number;                 // 0 when done
      cumulative: number | null;    // points from now through this step; null for done / later
      band: 'done' | 'now' | 'part' | 'next' | 'later';
      partNow: number | null;       // 'part': the known points that land in this step
      core: boolean;
      condition: string | null;     // 'later': "from World 3, early", "find its book (Hoggindaz quest)"
      note: string | null;          // "its max for now", "useful up to 7 (best level 73)"
    }
    ```

  - **Words** in `now/words/characters.ts`: "can add now", "part now", "next after these", "later", "+{n} → {talent}", "At least {n} points known · they end here", "No unspent points known: the totals show where new points go", "all spent", "{n} unspent", "over budget by about {n}".
  - **Knowledge Base** (`packages/knowledge/systems/talents.yaml`): `talents.build.star-fighting` and `talents.build.star-skilling` (the `StarBuildEntry` shape) with the §5.3 Sources (tier 2–3 player-facing plus Toolbox provenance, #74). A new authored fact `talents.fact.star-books`: each star talent's book source, from the wiki, with a Source.
  - **Golden:** a new `## Builds` section from `renderBuildsText`. For each character and preset it lists the tile badges and the first 4 path steps with their bands.
- **TR-9 Map in the engine** (M). A worker module `packages/engine/src/map/` emits `EngineResult.map: MapResult | null` (an M10 TR-2 amendment, like M17's `systems`).

  ```ts
  interface MapResult {
    worlds: { world: number; state: 'done' | 'open' | 'next'; cleared: number; total: number;
              gate: { boss: string; bossMap: number | null; keysHeld: number | null; keysPerDay: number | null;
                      crystal: { item: string; held: number | null; need: number } | null } | null;
              maps: MapNode[] }[];
    frontier: { mapIndex: number; door: number; requirement: number; best: { characterIndex: number; killsLeft: number; etaMs: number | null } | null } | null;
    markers: { characterIndex: number; mapIndex: number }[];
    doors: Record<number, { characterIndex: number; door: number; done: number; requirement: number }[]>;
    overlays: { route: number[]; constellations: Record<number, string[]>;
                deathNote: Record<number, { kills: number; nextRank: string | null; nextAt: number | null }>;
                cards: Record<number, { cardId: string; level: number | null; baseChance: number | null }>; };
  }
  interface MapNode { mapIndex: number; name: string; kind: 'fight' | 'skill' | 'town' | 'other'; doors: { destination: number; requirement: number }[] }
  ```

  - **Inputs:**
    - `maps.fact.maps`, `portals.fact.world-routes` and `metapath.fact.world-gates` (all generated);
    - an authored `map.fact.boss-gates` (W1–W4 boss, boss map and key item, each with a wiki Source; it reuses `boss-keys` facts where they exist);
    - `account.frontier` (M2), `doorKillsLeft` (TR-3), `worldCrystals`, M6's key counts, `account.deathNote` with the generated Death Note ranks, M8's card holdings with `card-drops` facts, M16's constellation facts, and M14's shown Walkthrough steps.
  - **The ETA** is `killsLeft / finalKillsPerHour` from M2's fight row: arithmetic on Toolbox numbers (ADR 0005). It is null when the rate is 0.
  - **The view:** a pure `buildMapView` in `packages/engine/src/now/map-view.ts` joins names on the UI thread (M4 TR-9). It also produces a `## Map` golden section.
- **TR-10 System pictures** (S). M20's `SystemPicture` union gains `stamps`, `statues`, `vault`, `printer` and `p2w` kinds. A worker module `packages/engine/src/pictures/` builds them from Account State (`spend.stamps`, `account.statues`, `spend.vault`, the printer facts, `spend.p2w`). It takes the lit item from the existing module outputs: M8's stamp order, M7's statue and Vault lines, M14's printer plan, M19's Pay 2 Win order. `SYSTEM_HOMES` gains the `stamps`, `statues`, `upgrade-vault` and `printer` page ids. Each body is a `lazyPart` in `systems/pages.ts`.
- **TR-11 Session and Away** (N). A worker module `packages/engine/src/session/` reads the history entries (M1 `HistoryEntry`, full Account States) and emits `EngineResult.session`:

  ```ts
  interface SessionFacts {
    sessionStartedAt: number | null;
    previousSessionEndedAt: number | null;
    medianSessionMs: number | null;   // the last 10 Play Sessions; null with fewer than 3
    levelGains: { characterIndex: number; from: number; to: number }[];   // since M9's baseline save
  }
  ```

  A pure `buildSessionView(view, result, ui: { visited: number[]; returnChangedThisSession: boolean; manualTab: Tab | null })` in `packages/engine/src/now/session-view.ts` picks the pause point (FR-N6) and builds the Log in list and Away card (FR-N7) from `result.timeline` bars, `result.checklist` resets and `levelGains`, and the Log off list from the blockers. It needs no clock beyond `result.asOf`.
- **TR-12 Budgets** (M12 TR-12; the budgets never rise in this release).
  - **Baseline**, after #116: main chunk 281.1 KB gzip; first load 308.2 KB of 320 KB.
  - **Estimates added to the first load:**
    - atoms (including `SourceLabel`, `GoalList` and `Pill`, moved in from `now/`): about 4 KB;
    - the new Now components (counter, pager, grouped jobs, pause control, why sheet): about 6 KB net, after removing the old ones;
    - `AfkStrip`, which sits on the first screen and so can't be lazy without the layout jumping: about 2 KB;
    - core art with every frame: the five family chibis (two-frame blink), the walking blob (4 frames), the sleeping blob, the campfire, the gremlin, five nav glyphs, the four Verdict glyphs and the pill kind glyphs, about 30 motifs as merged paths: about 5 KB;
    - words and formatters: about 1 KB.

    That is about +18 KB, which would land at 326 KB, over the budget.
  - **Offsets**, required in the same PRs:
    1. **N** moves the Account section's body (Spend Plan, Done, the Daily & Weekly line, If you have time, Not covered yet) into a `now/account-parts` lazy part, prefetched when the browser is idle. Only the summary header stays in the first load (estimate −7 KB).
    2. **N** makes the Log in list, the Away card and the Settings sheet lazy (−3 KB).
    3. **F** checks V-1 (the ~60 KB of `re2js` in the first load from Firebase that sign-in never uses). If a supported import path drops it, F takes it (estimate −15 KB or more). If not, it is left alone.
  - **Without V-1** the sum is about 308 + 18 − 10 = 316 KB: inside the budget, with about 4 KB of headroom, not more. So the soft line below is the real limit, and V-1 is worth doing early.
  - **Target at release:** first load ≤ 316 KB without V-1 (≤ 301 KB with it), with no art beyond `core.ts` in it. F fills `core.ts` with the whole first-screen list above, so N and M never edit it; a later addition is a cross-module request for I.
  - **Fonts:** the first screen's font files (FR-F2's five) are measured by F and capped at that number + 10 KB by a new `firstPaintFontsRaw` budget line.
  - **New guards:**
    - `bundle-guards.ts` fails a build that puts `design/art/generated/*` or any place, tab or page body in the first load;
    - a CSS budget, `mainCssGzip` = F's measured value + 12 KB, enforced from Integration;
    - every PR's body reports its first-load delta, and one that crosses 317 KB must offset in the same PR.
- **TR-13 Lazy parts.** The `lazyPart` pattern from #116 is the only lazy mechanism.
  - The places Characters, Systems, Timeline and Map, every tab, and every page body are lazy. So are `now/account-parts`, `now/session`, Settings and the Suggestions panel (already lazy).
  - The shell prefetches every part when the browser is idle after the first result (as M17 TR-11 does for the Timeline).
  - The fallback is `<Loading delayMs={400} />`. Failure shows G3.
- **TR-14 Goldens and merge order.**
  - Each area changes only its golden sections: N `## Verdict changes`, `## Now` and `## Not covered yet`; C `## Builds`; S `## Systems`, `## Alchemy` and `## Gear`; T `## Timeline`; M `## Map`. `## Findings` is diagnostic and may move with any area; its diff is reviewed in I.
  - F's formatter change moves every section once, before the areas branch.
  - Area PRs merge one at a time. Each rebases on `main` and re-runs `pnpm kb golden -u`; the generated files resolve by regeneration, never by hand.
  - Integration regenerates once more and reviews the whole diff.
- **TR-15 CI checks added** (F, unless noted):
  - Contrast: `contrast.test.ts` reads `design/tokens.css` and checks every text pair (`--fg`, `--muted` and each status colour on `--bg`, `--surface`, `--sunk` and its own `-soft`) at 4.5:1, in all three directions × light and dark. Non-text pairs (rules, bars, rings against their background) are checked at 3:1.
  - A **CSS guard**, over the app's CSS (Field Guide plus the Quest Log accent subtrees; the dormant Command Board label token is ported at 16 px, not the Lab's 8 px): no `font-size` below 12 px outside `.legal`; the pixel families never below 16 px; no `letter-spacing` on `.pill`; `min-height: var(--tap-min)` on the interactive base selectors. Inline text links inside a sentence (Sources, "See it" inside text) are exempt, as WCAG 2.5.8 allows; DS-15's list is about standalone controls.
  - A **format guard**: no `toLocaleTimeString`, `toLocaleString` on a date, or hand-rolled `/ 3600` duration text in `apps/activeon/src` outside `design/format.ts`. An allowlist covers non-display arithmetic: `suggestions/context.ts` (the report's hours), `suggestions/client.ts` (the retry hours) and `worker/**`. F lands the guard with a **shrinking allowlist** that names today's display uses (`App.tsx`'s clock, `CantRead.tsx`, `suggestions/Panel.tsx`'s `timeText`, `src/format.ts`'s `formatAge`), so CI is green on F's merge. Area N moves them onto the formatter and deletes their allowlist lines; I checks the list holds only the non-display entries.
  - A **golden copy scan**: no "place not given", "Any character", "tier 2", "dementia", or "silver"/"gold coins" as currency.
  - The **ADR 0009 art guard** (TR-4).
  - **axe** on every place and state in jsdom, light and dark.
  - **DOM tests**: no nested `details`; one control per card face; one NOW per Walkthrough and per picture.
- **TR-16 The QA probe** (local, not CI). `scripts/qa/probe.mjs` drives the built app at 390 × 844 and 1280 × 900, light and dark, over the four fixture files (pasted). It uses Playwright, installed with `pnpm dlx`, so it is never a workspace dependency (AGENTS.md: no casual dependencies). It reports:
  - interactive elements under 44 × 44 px;
  - text nodes under 12 px;
  - horizontal page scroll;
  - whether the counter and first fix are above the fold;
  - greyscale screenshots;
  - running animations under reduced motion;
  - console errors;
  - a CSP report (the Preview's real headers, M12).

  Release needs zero findings, or each one waived in the QA PR with its reason. Inline links in running text are exempt from the 44 px check (WCAG 2.5.8).
- **TR-17 Accessibility specifics.**
  - Sheets are `role="dialog"` with `aria-modal`, a focus trap, Esc to close, and focus returned to the opener. The background is `inert`.
  - Segmented controls are radio groups.
  - The counter's number change is announced through the existing polite live region, once per save, never every second.
  - Every pixel glyph beside a word is `aria-hidden`. A glyph alone has a `<title>`.
  - The Build path's bands are announced in words: each row's accessible name includes "can add now" or "next after these".
  - The map's nodes are a list of buttons in world order, with the picture `aria-hidden`, following the Timeline's "two parts, one truth" rule.
  - Focus is visible: a 2 px `--focus` ring with a 2 px offset.
- **TR-18 Privacy and security.**
  - No new network origin, so the CSP is unchanged: fonts and art are files or modules from `'self'`.
  - Nothing new leaves the browser: the Map, Build and Session data stay in the worker and the UI.
  - The Design Lab snapshot passes the denylist scan (TR-1).
  - The Suggestions context gains the new places as screens. It maps `map` to M13's existing `other` screen, so nothing new is sent (M17 TR-12). A Suggest from a place defaults to the Idea kind, not Something's wrong (today `other` would default to wrong).

## 8. States and edge cases

| State | What the redesign does |
|---|---|
| Signed out, no save | Sign-in (the code card) is the content; the paste drop zone sits under it. No nav. |
| Waiting for the first save; parsing | The walking blob with named steps over a skeleton of the Now layout. The Cloud Save hint shows after 30 s. |
| Broken newest save | The gremlin card with a labelled "Use your last good save (from 09:12)". The header chip reads "last good save · …". Never a silent swap, and never advice from a broken parse (AGENTS.md). |
| Engine error / render error | The fallback Roster in the Roster's shape (who-glyph, class and level, no advice), with "Report this" prefilled. A throw in one lazy part shows G3 in that part only. |
| Empty | No characters, or every Goal skipped: the sleeping blob plus the next thing to do. An empty list inside a picture: one plain line, no art. |
| All set | The counter at zero with the campfire, in the parchment frame. "Unknown" characters never block it (`now.focus-unknown`). |
| Stale save (M10's rule) | Stale-first wording everywhere the Verdict shows: Now, Focus, the Log off list. The Timeline's hatched band. |
| Offline, reconnecting | The header chip says it ("Offline · showing your save from 09:12"); one toast, then a dot. |
| Update available, patch newer, parser behind | A toast once, then a dot on the overflow. Parser behind keeps M1 FR-29's banner wording, as a toast. |
| Pasted save | "pasted · …" chip. No history, so no Away card and no Log in. The pause point is Rounds or Log off only. |
| Second account / sign-out | The preference namespace switches (M10 TR-8). The pause-point UI state (visited, manual tab) resets with the account. |
| Two browser tabs | Each tab keeps its own pause-point state; preferences are shared through storage (unchanged M10 behaviour). |
| 320 px | Roster rows use the cap-count layout. The tab grid wraps to two rows. The map's world bands stay one column. Nothing scrolls the page sideways (only the Timeline board and the World strip scroll inside their frames). |
| 1000 px and wider | The Command Board layouts in §4.1's "Also built" column, with Field Guide colours. |
| Reduced motion | Every pixel loop pins frame 1. Celebrations show their last frame without playing. UI tweens are 0 ms. |
| Theme | System by default; the Settings override sets `data-theme`. Every direction token set has both modes. |
| Clock-time preference | Every moment shows "around 20:10" instead of "in 2h 10m". Ages and effort are unchanged. |
| W1 account | Map: W1 open plus the W2 gate, dimmed. Builds: one preset (no lower bound) below Lv 15; the star path from Lv 1. |
| Past World 4 | Builds keep M9's note ("not covered past World 4"). The Map folds W5 and up into "Worlds 5+ · not covered yet". The hub's later worlds stay folded. |
| Star total can't be computed | The star tile falls back to M9 TR-7's lower bound ("at least N"), or to "No unspent points known". |
| Star over budget | "over budget by N", as a fact; no Goal. |
| Star book not found | That step is in the later band, with the book's source. |
| `doorKillsLeft` missing (old save, failed section) | Map nodes show the requirement only; the sheet hides the door progress row (DS-3). |
| No frontier (M2 null) | No frontier ring; the open world shows its gate and markers only. |
| Lazy part fails | G3 in place, with "Try again". The place and the rest of the page keep working. |
| Fonts fail to load | The fallback stacks from the tokens (system UI, monospace). Layout holds, because pixel faces are only used at 16 px and up. |
| Preferences can't be stored | The footer's "Can't remember your choices in this browser." stays. Settings work for the session only. |
| Patch day (Toolbox re-sync) | Star pages and ids come from game data through the facts, so a new page or talent shows as plain levels until a Build names it. The art never depends on game data. A new System in the registry gets a generic tile glyph until it has its own. |

## 9. Phases, file boundaries and effort

**Step 0.** Done: PR #116 (M18, with `lazyPart`) merged as `6dfaefc`. This spec builds on its lazy chunks and its Gear views. The Design Lab has been copied to `/Users/yasser/Documents/Github/idleon-forge/fixtures/private/design-lab/` (without `ref/`), so the 1:1 source no longer depends on a temporary path (RT-8).

**Phase F: Foundation.** One PR, `feat/M21-foundation`. Everything else waits for it. It pre-creates every shared file, so the five area PRs never edit the same file.

| Owns | Files |
|---|---|
| Lab snapshot | `docs/design-lab/**` (new); `fixtures/private/design-lab/` (local, ignored) |
| Design code | `apps/activeon/src/design/**` (new); `scripts/art/import.mjs` (new); `apps/activeon/src/lazy-part.tsx` (its fallback becomes `<Loading delayMs={400}>`, and its failure state G3) |
| Wiring | `apps/activeon/src/main.tsx`; `apps/activeon/package.json`; `pnpm-lock.yaml`; `apps/activeon/src/styles/tokens.css` (becomes an alias shim) |
| Extraction (no visual change) | `apps/activeon/src/characters/CharacterShell.tsx` (new, the identity strip and tab bar lifted out of `now/Focus.tsx`, which then renders it) |
| Shared types and stubs | `packages/engine/src/result.ts` and `packages/engine/src/now/view.ts`: every new optional field and type (`EngineResult.session`, `.map`, `.classFamilies`; `SystemPicture`'s new kinds; `BuildTabView.known`, `.path`; `BuildPresetView.star`; `NowView.families`) declared once. Stub worker modules `packages/engine/src/{session,map,pictures}/module.ts` returning null, registered in `apps/activeon/src/worker/handle-request.ts` |
| Words split | `packages/engine/src/now/view-words.ts` → `now/words/*.ts` |
| Routes | `apps/activeon/src/shell/route.ts` (+ tests) |
| Formatters | `packages/knowledge/src/template.ts`; `packages/engine/src/now/format.ts`; the `{x:in}` codemod and the FR-F9 copy audit in `packages/knowledge/systems/*.yaml`; every golden |
| Account State | `packages/account-state/src/**` (TR-3: one schema bump); `packages/toolbox-parsers/src/calls.ts` (`starTotal`) |
| Guards and budgets | `apps/activeon/bundle-guards.ts`; `packages/release/src/budgets.ts`; new tests in `apps/activeon/test/` (contrast, CSS guard, format guard, art guard) |
| Shared UI pieces moved into atoms | `SourceLabel`, `GoalList`, `NextActionItem`'s meta row (from `now/parts.tsx`), `Pill` (from `now/Roster.tsx`), `StateGlyph` (from `gear/`) become `design/atoms/*`; the old files re-export them until I removes the re-exports. `signsStatus` moves from `now/signs/SignsPanel.tsx` into `now/signs/SignsTab.tsx` (C's). So no area imports another area's file for a shared piece |
| Chrome slot | `Shell.tsx` renders `<NowChrome s={s} />` from a new `now/chrome/NowChrome.tsx` (N's) in place of its direct `Banners`, `ProgressBar`, `WhatsNewCard` and live-region markup, and `session.ts` exposes `visited` (the follow state's set) and a `views` object with one slot per area builder (`sessionView`, `mapView`, `slotsView`, `afkStrip`), each calling a stub in that area's view file. After F, N never edits `Shell.tsx`, and areas edit only their own builder files |
| CSS split | `styles/now.css` and `styles/views.css` split by owner: `styles/now.css` (N), `characters/characters.css` (C, taking now.css L605–922's tab and Build rules), `systems/systems.css` (S), `timeline/timeline.css` (T, existing), `shell/shell.css` (M, the nav rules), `gear/gear.css` (C) and `systems/gear-pages.css` (S, the page rules), `signs.css` split into `signs-tab.css` (C) and `signs-page.css` (S) |
| Engine shared files | `packages/engine/src/now/index.ts` (the barrel: F adds every new export name once, pointing at the stub files), `packages/engine/package.json` (`exports` for `./map`, `./session`, `./pictures`), `packages/engine/src/golden.ts` and `packages/kb-tools/src/golden.ts` (the new `## Builds` and `## Map` sections, wired to stub renderers), `render-views-text.ts` split into `render-systems-text.ts` (S) and `render-timeline-text.ts` (T), `now/words/shared.ts` (`LINK_WORDS`, `STATUS_WORDS`, `WORLD_NAMES`, `PLACE_WORDS`: F-owned and frozen; a new shared word is a cross-module request for I) |
| Shared tests | `apps/activeon/test/{shell,now-screen,m18-view,m20-view}.test.tsx` are split by area into per-area files, so each area edits only its own tests |
| Optional entry fields | Check entries gain optional `fixSeconds` (D-10) and `groupText` (FR-N3): `packages/knowledge/src/schema.ts`, the Check entry only; `groupText` is authored in the YAML of the entries that fire on 3 or more characters |

**Phase A: five area PRs, built in parallel, merged in order.** Each branches from `main` after F merges and stays inside its boundary. They merge one at a time in the order **N, C, S, T, M**, each rebased on `main` with its goldens regenerated (TR-14). The order matters only for generated files and the golden `.md`s, which every area regenerates; source files have one owner each. A change needed outside it goes under "Cross-module requests" in its PR body for Integration (build-brief rule 1).

| Area | Branch | Owns (and nothing else) |
|---|---|---|
| **N Now and flows** | `feat/M21-now` | `apps/activeon/src/App.tsx`; `components/**`; `now/{NowScreen,Roster,Focus,parts,PurposeBlock,Account,Chrome,CantWorkOut,release,report,context,follow,prefs-store,open-keys}.*`; `now/chrome/**`; `now/walkthrough/**`; `now/account-parts/**`, `now/session/**`, `now/settings/**` (new); `suggestions/{Panel.tsx,SuggestionsProvider.tsx,suggestions.css}` (UI only; M13's logic files untouched); `styles/{app,now}.css`; engine `now/{build-now-view,render-text,session-view}.ts`, `now/words/now.ts`, `session/**`; the `## Now` and `## Not covered yet` golden sections |
| **C Characters** | `feat/M21-characters` | `apps/activeon/src/characters/**` (incl. `CharacterShell.tsx`, `characters.css`); `now/BuildView.tsx` (moves to `characters/build/`); `now/cards/**`; `now/signs/SignsTab.tsx`, `signs-tab.css`; `now/SkillsTab.tsx` (it stops importing `checklist.css`); `gear/GearTab.tsx`, `gear/gear.css`; `now/character-tabs.ts`; engine `builds/**`, `gear/**` (its `TabHealth`), `collections/cards-view.ts`, `now/{build-view,cards-view,skills-view}.ts`, `now/words/characters.ts`, `now/render-builds-text.ts` (new); `packages/knowledge/src/schema.ts` (Build parts only); `packages/knowledge/systems/{talents,talent-presets}.yaml`, `talents.facts.yaml` (`star-books`); the `## Builds` golden section |
| **S Systems** | `feat/M21-systems` | `apps/activeon/src/systems/**`; `alchemy/**`; `gear/GearPages.tsx` with `systems/gear-pages.css`; `now/signs/SignsPanel.tsx`, `signs-page.css` (the Star Chart body; it keeps exporting `StarChartSection` until I deletes it, so N's removal and S's restyle don't depend on each other); engine `now/{systems-view,system-homes,star-signs-view}.ts`, `now/render-systems-text.ts`, `now/words/systems.ts`, `pictures/**`; the `## Systems`, `## Alchemy` and `## Gear` golden sections |
| **T Time** | `feat/M21-time` | `apps/activeon/src/timeline/**` (incl. new `ParallelSlots.tsx`, `AfkStrip.tsx`); `now/Checklist.tsx`, `now/checklist.css` (keeping the `ChecklistSection` export name N's Account imports); engine `now/{timeline-view,checklist-view,slots-view}.ts`, `now/render-timeline-text.ts`, `now/words/time.ts`; the `## Timeline` golden section |
| **M Map and nav** | `feat/M21-map` | `apps/activeon/src/shell/{Shell.tsx,session.ts,shell.css}` (the nav and places only; after F, the chrome is N's `NowChrome` and the view slots belong to their areas); `apps/activeon/src/map/**` (new); engine `map/**`, `now/map-view.ts`, `now/words/{map,shell}.ts`; `packages/knowledge/systems/map.facts.yaml` (new); the `## Map` golden section |

**Phase I: Integration.** One PR, `feat/M21-integration`, after the five merge:
- place `AfkStrip` on Now;
- the "See it on the map" links (FR-M7);
- the Daily & Weekly link from the Account;
- the cross-module requests;
- the clean-up (FR-I3);
- the final goldens;
- the CSS budget on;
- the README spec-index rows for what shipped.

**Phase Q: QA.**
- The coordinator runs the TR-16 probe and the story checklist on a local build and on the PR Preview, including a real sign-in under the unchanged CSP (M12 TR-11).
- The owner walks through it on a phone.
- Fixes are small PRs inside the same area boundaries.

**Release.** One release, R-M21. The coordinator triggers Deploy by hand (batch rule: merges never deploy).

**Effort (agent-hours, honest ranges).** These include tests, goldens, the PR body and one review round. They do not include waiting for CI.

| Phase | Hours | Why that much |
|---|---|---|
| F Foundation | 12–16 | The art codegen across three SVG styles with a pixel-exact check (V-7); the tokens and fonts; about 15 atoms with tests; the Account State bump and `starTotal`; the formatter codemod with every golden; the shared stubs and guards; the `re2js` check |
| N Now and flows | 18–24 | The largest UI surface: counter, grouped jobs, rows, Focus, why sheet, pause points, Away card, Spend Plan, Account, all the flows, Suggestions layout, What's new, Settings, the session module and the budget offsets |
| C Characters | 16–22 | The path engine and schema, star Builds authored from the research, useful caps, the star call wired through, then the grid, path, matrix, strip and four tab restyles |
| S Systems | 12–16 | Report card, frame, four new pictures with their engine module, eight restyled bodies |
| T Time | 7–10 | Timeline restyle, the daily ring picture, the slots grid and its view, the AFK strip |
| M Map and nav | 12–16 | The map module with its facts, the view, Gate-first, the World strip, the sheet and overlays, five places and badges |
| I Integration | 4–6 | Wiring, clean-up, goldens, budgets |
| Q QA and fix rounds | 8–12 | Two probe passes, the Preview sign-in check, owner feedback fixes |
| **Total** | **89–122** | Wall-clock with five agents in parallel: about 1 day for F, 1.5 days for the areas (N is the critical path), 1 day for I and Q, so 3–4 days |

## 10. Dependencies

| Module | What M21 uses | Change requested |
|---|---|---|
| M1 | Account State, the field process (TR-11), `SaveHistory` and `HistoryEntry` (level gains, Play Session ends) | TR-3's fields, one schema bump |
| M2 | Stage, `frontier`, the roster, `worldCrystals` | none |
| M3 | Blockers, the first-fill line, `composeVerdict` | none |
| M4 | The Purpose quest line and ladder | none (the "in 14h 04m" format, through F's formatter) |
| M5 | `higherLeverage` (the quiet hint) | none |
| M6 | Key counts, checklist inputs | none |
| M7 | The Spend Plan, `spend.vault`, `spend.stamps`, `spend.statueGold`, `spend.p2w` | none |
| M8 | Cards, stamps order, card holdings | none |
| M9 | Roadmap, TR-7 lower bounds, the Build schema (TR-5) | Amend TR-5 (the star tab and caps, which reverses red-team #25's drop) and FR-17's note (star steps are shown, never reset) |
| M10 | `NowView`, `EngineResult`, preferences, the render-text golden | Amend TR-2 (`session`, `map`, `classFamilies`) and TR-13 (the font list) |
| M11 | Schema, facts, Sources (#74), goldens | Amend TR-2 (`fixSeconds`, `groupText`, the star `BuildStep`), plus the `{x:in}` template |
| M12 | Budgets, What's new, Previews, deploy | Amend TR-12 (the CSS budget, the first-load guard for art) |
| M13 | The Suggest and Report UI, the scene | `map` maps to `other` |
| M14 | Walkthrough view, printer plan | none |
| M15 | `behindSystems` (the report card) | none |
| M16 | Constellations, signs | none (the Star Chart moves page) |
| M17 | Shell, routes, hub, pages, Timeline, `SYSTEM_HOMES`, `characterTabs` | Amend FR-1 (five places, Map), FR-5 (badges on Now and Timeline only), D-1 (the Map is built) |
| M18 (#116, merged) | `lazyPart`, the Gear views | none |
| M19 | The Alchemy page | none (restyle) |
| M20 | Checklist, slots, skills, `SystemPicture` | Amend TR-6 (the new picture kinds; the Daily & Weekly full view moves to the Timeline's `#daily` section) |

## 11. Decisions and Owner review

### 11.1 Self-ruled decisions

- **D-1 No direction switch now.** The three token sets ship, scoped and contrast-tested, with a dev-only `?direction=` for QA. *Why:*
  - The critique made Field Guide the base, because it reads in three seconds in both themes.
  - Quest Log's pixel caps fail the read at 390 px (v1 #4).
  - Command Board "is a layout, not a look" (v1 #10), so it ships as the desktop layout anyway.
  - A switch would triple the QA matrix (3 directions × 2 themes × 2 widths) in the release that most needs a clean QA.

  Because the tokens are in place and tested, a later switch is a small PR: one Settings row and `data-direction` on the root.
- **D-2 The collection.** "Keep them all in our collection" means two copies:
  - the public `docs/design-lab/` archive, which records every variant with its name, score, verdict and note, the art and the tokens;
  - the private, full Lab with every rendered variant.

  The app builds the picks and overrides, plus the variants the critique marks as a state, a desktop layout or a merge (§4.1). The others stay in the collection, ready to be picked later. *Why:* the owner said "go for mostly your picks". The full renders embed scrubbed save data, so they can't be public (AGENTS.md: never commit account data). Owner review Q1 asks whether a live in-app catalogue is also wanted.
- **D-3 Command Board from 1000 px, in Field Guide's colours and fonts**, taking its density and layout tokens only. *Why:* the critique's "desktop and power-session layout of the chosen direction, not a third skin".
- **D-4 Fonts.** The latin subset of three families only: Atkinson Hyperlegible Next (replacing Atkinson Hyperlegible), JetBrains Mono, Pixelify Sans. The skin-only faces aren't dependencies until a skin ships (AGENTS.md: no casual dependencies). *Why:* the CSP stays `font-src 'self'`. The first screen downloads one more font file than today (Pixelify 600 for the pixel headings), which TR-12's font line counts.
- **D-5 Breakpoints.** The rail stays at 720 px (M17 D-5, already ruled), and the Command Board layouts start at 1000 px (the Lab's own breakpoint, and today's two-preset rule).
- **D-6 The Map is never locked.** The Lab marked "a place locked" as a mock. A W1 account sees W1 and the dimmed W2 gate, which is useful from day one.
- **D-7 Badges on Now and Timeline only.** The critique said to borrow this rule from the runner-up. The Systems wasting count moves into the hub's report card header, so it isn't lost.
- **D-8 Pause-point rules** (FR-N6): conservative, explained in one line, and overridable. A manual pick holds for the rest of the Play Session. The list ticks only from the save (DS-2). A manual pick holds for the Play Session.
- **D-9 The Star Chart leaves the Account section** for the `star-signs` System page, and the Account keeps one line. *Why:* the Account is a summary header with at most 5 Goals (P9), and the Lab's Star Chart is a System page picture.
- **D-10 Fix times.** Check entries gain an optional `fixSeconds`, but no value ships in this release, so every fix time is hidden (DS-3, DS-23). Filling them is Knowledge Base work for the top 15 Checks, after release (the critique's "fix the data" step).
- **D-11 The walking blob** shows for the save wait and parse (with named steps), and after 400 ms for a lazy part. It never flashes on a fast load.
- **D-12 Star Builds are class-agnostic**, follow the shared core of the dated sources, gate Supersource by skill, and cap the useful levels.
  - They never flag over-investment (Printer Sampling at 100 is a player's choice) and never suggest a Star Talent Reset Potion (gems, M9 FR-17).
  - Where sources disagree outside the core, the step order follows the newest per-preset build (Sir_Grimtide, 2026-10-15), and the disagreement is written in the entry's `notes`.
- **D-13 New advice is limited to:**
  - the Map's door times (facts with a kill rate);
  - the Build path (a display of M9's own Builds);
  - the star Builds;
  - at most one Star Talent Goal (Q2).

  Nothing else changes a Verdict or the Goal ranking.
- **D-14 The cumulative points start from zero per tab**, for the next unmet step on. Tabs never borrow from each other. The star tab is one pool across its pages. *Why:* that is how the game spends points (M9 TR-7, the research note), and it is what the owner reads: "+40 → Veins of the Infernal".
- **D-15 The sleeping blob is for screen-level empty states**; an empty list inside a view is one line. *Why:* Field Guide allows one mascot bust on empty and error states.
- **D-16 What's new docks as a tab** above the bottom bar instead of opening as a modal. *Why:* it keeps P1 (nothing promotional above the answer) while keeping the owner's Patch notes scroll.
- **D-17 Quest board for the 3 most recently changed suggestions**, the plain list for the rest (the owner's split, with "recent changes" as the line between the two parts).
- **D-18 One tab chip per Roster row** (G4). It keeps M9's findability rule within P9's caps.
- **D-19 Letter badges only where a who-glyph stands without its class word.**
- **D-20 One-shot cutover.** No "classic look" toggle; rollback is a redeploy of the previous build (M12). *Why:* two UIs would double every test and the budget. The area PRs keep `main` working and tested at every step, and Q checks the whole app before the one deploy.

### 11.2 Owner review

These are the genuine product calls, at most five, each with a recommendation.

- ❓ **Q1 The collection:** should the variants you didn't pick also live **in the app**, as a dev-only "Design catalogue" page (`#lab`) that renders every variant from real data? Or is the archive enough: the public `docs/design-lab/` (every variant's name, score, verdict, note, art and tokens) plus the private full Lab?
  ➡️ **The archive, with no live catalogue now.** Building all 252 variants as live components is about +40 agent-hours, and about half of them were dropped or superseded by the critique for good reasons. The archive keeps every one ready to promote later with its notes. A catalogue page can come later for just the built atoms if you'd like one.
- ❓ **Q2 Empty star tab as a Goal:** on both private saves, one preset's star tab is empty while the other is spent (all 5 characters on the W2-late account, 2 of 6 on the W3-early account). Should that become a Now Goal ("Spend your star points on the other preset too", one account line with per-character details, position 3 = free value)? Or should it stay a badge on the Build tab only?
  ➡️ **Yes, the one account-level Goal at position 3.** It is free value with an exact count, it is the dossier's named common mistake, and it costs nothing in game. The noise rule (#70 A5) keeps it to one line.
- ❓ **Q3 Our guide's name:** the NPC why shows our scout-hat blob, and the Lab's speech box has a name tag. What is the mascot called?
  ➡️ **"Scout"**, from its scout hat. It is short, readable at 16 px, and not an IdleOn NPC name (ADR 0009, no named NPCs). Or leave the tag off, and the speech box reads as the app's own voice.
- ❓ **Q4 Cutover:** ship the new look to everyone at once (D-20), or keep a "classic look" toggle for one release?
  ➡️ **At once.** One code path keeps the budgets and tests honest. The Preview QA plus your phone walk-through is the safety net, and rollback is one redeploy.

## 12. Red-team notes (own pass)

1. **A big redesign breaks a working app.** *Defence:* F changes nothing visible except tokens and fonts. Each area PR keeps the full test suite and goldens green. Q runs the probe on the built app and a Preview before the one deploy. Rollback is a redeploy (D-20).
2. **The first-load budget is blown** (the estimate lands at 322 KB before offsets). *Defence:* TR-12 names the offsets, assigns them to N and F, adds a guard against art and places in the first load, and has every PR report its delta, with a 316 KB line that forces an offset.
3. **Parallel PRs collide on shared files** (`result.ts`, `view-words.ts`, `route.ts`, the worker module list, `schemaVersion`, `Focus.tsx`'s shell). *Defence:* F pre-creates each one (types, stubs, the words split, routes, the schema bump, the `CharacterShell` extraction), and §9 gives every file one owner.
4. **The Lab's SVGs carry inline `<style>`**, which the CSP (`style-src 'self'`) would block. *Defence:* the codegen strips them. Fills and frames come from `art.css`. React style props carry only CSS custom properties, as the Timeline already does under this CSP.
5. **Wrong star advice.** Supersource on a Worship preset, Beginner Best Class with no Beginner-line character, Quest KAPOW! past the quests done. *Defence:* `servesAny` conditions, useful caps from save data, and a book-not-found band. The entries carry tier 2–3 player-facing Sources plus Toolbox provenance (#74), with contract tests on both private saves.
6. **"Next after these" reads as "can't buy".** *Defence:* the owner's words are the rule. The rows carry a "→" glyph and a running total, full text contrast (no lowered opacity), and a test that no path string says "can't".
7. **The pause point picks the wrong tab** and hides the Log off list. *Defence:* the rules are conservative and stated in one line, a manual pick holds for the Play Session, and Log off's list is also every blocker on Now (the counter), so nothing is hidden.
8. **The Lab snapshot leaks names or account data.** *Defence:* only the data-free parts go public, the denylist scan runs on every file, `ref/` is never copied, and the renders stay in `fixtures/private/`.
9. **Pixel fonts sneak below 16 px or onto body text.** *Defence:* the CSS guard (TR-15) fails the build.
10. **Lab mock numbers ("~10 s", "+12%") get copied in with the markup.** *Defence:* DS-23, the golden copy scan, and D-10 (no `fixSeconds` values in this release).
11. **Patch day changes the star pages or adds a System.** *Defence:* star data comes from game facts, and an unknown talent shows as plain levels. A new System gets a generic glyph, and the art never depends on game data.

## 13. Red-team log

An independent agent that had not seen this spec's drafting reviewed it on 2026-10-18 against the code at `6dfaefc`, the Design Lab (all 85 components checked against the critiques), the star research and the ADRs. It reported **0 P0, 8 P1, 16 P2 and 9 P3** findings. Each was verified against the code or the data before it was folded in. **31 were fixed, 2 fixed in part, none rejected.**

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| RT-1 | P1 | The area boundaries collide: `Shell.tsx` renders N's chrome, `session.ts` builds every view, `parts.tsx`/`Pill` are imported by C, S and T, plus the cross-imports, shared CSS, the engine barrel, golden plumbing, shared word groups and tests | Fixed | F moves the shared pieces into atoms, adds the `NowChrome` slot and the per-area view slots in `session.ts`, splits the CSS, the text renderers and the tests by owner, and owns the barrel, exports, golden wiring and `words/shared.ts`. Merge order N, C, S, T, M for the generated files (§9). Path corrected to `collections/cards-view.ts` |
| RT-2 | P1 | The format guard turns CI red on F's merge (existing display uses) | Fixed | A shrinking allowlist; N moves the display uses and deletes the lines (TR-15) |
| RT-3 | P1 | The ADR 0009 guard keyed on titles can't pass (183 of 213 have no provenance text) | Fixed | A sha256 `MANIFEST.json` written at copy, plus `art/README.md`'s statement (TR-1, TR-4) |
| RT-4 | P1 | Four authoring styles, not three; stripping styles loses slot maps and frame timing; 24 px isn't an integer scale of a 16-grid chibi | Fixed | The importer parses styles into slots, frames and fps first, and fails on unknown forms; scale is a multiple of each motif's grid; `WhoGlyph` takes `scale` (TR-4, TR-5) |
| RT-5 | P1 | The star steps have no targets; Toilet Paper Postage's max (tens of thousands) swallows the totals; `tie` is undefined in the path | Fixed | An explicit target per step (book max, 1, 30, useful caps, TPP capped at 100 with its reason); a tie is one path row with an even split, shared with tabs 1–3 through one `spendOrder` (FR-C11) |
| RT-6 | P1 | The health matrix and G4 rest on a severity nobody defines; today's status is free text ("118+") | Fixed | `TabHealth { level, word }` declared by F, filled per tab by C (Gear included); severity order and tie-break defined (FR-C7, G4) |
| RT-7 | P1 | US-11 contradicts FR-S1: 7 Systems are wasting on W3-early, and wasting Systems have no Stage position | Fixed | A "Wasting now" strip above the axis; axis rows are the behind Systems only; US-11 rewritten to the golden (FR-S1) |
| RT-8 | P1 | The only 1:1 source sits in a temporary session path | Fixed | Copied to `fixtures/private/design-lab/` (main checkout, ignored, without `ref/`) before this PR (§9 step 0, TR-1) |
| RT-9 | P2 | The budget leaves out `AfkStrip`, the animated frames and the fonts; `core.ts` would be shared | Fixed in part | +18 KB counted, a realistic 316 KB target without V-1 and about 4 KB of headroom stated plainly; `core.ts` filled once by F; a font-bytes budget line (TR-12). The headroom stays tight, which is said, not solved |
| RT-10 | P2 | Fonts added as dependencies ship nothing; Atkinson Next 600 is missing; Board's 8 px label fails the guard | Fixed | Only three families and the weights used; skin fonts wait for a skin; the board label is ported at 16 px (FR-F2, D-4, TR-15) |
| RT-11 | P2 | The star bands overlap at −201, and an exact "over budget" breaks if a patch adds a source | Fixed | Ordered bands with a tolerance of −2 to 1, and "about" on over budget (FR-C10) |
| RT-12 | P2 | Stonks! returns about 49 points, so the band marker lands too early | Fixed | A second `starTotal` call with Stonks! at its target adds the return to the known points from that row on (FR-C12a) |
| RT-13 | P2 | Useful caps are defined for quest talents no Build uses | Fixed | Dropped; V-9 now checks the two caps the Builds use (FR-C12) |
| RT-14 | P2 | The later band misfiles bubble-capped and `accuracyShort` steps | Fixed | Later is for stage gates and books only; accuracy shows as a note, bubble caps as "set by a bubble" (FR-C1) |
| RT-15 | P2 | The overview line adds totals across tabs | Fixed | One tab's totals only; star talents get their own part (FR-C6, FR-C14) |
| RT-16 | P2 | "Serves" is undefined for an inactive skilling preset | Fixed | From the matched class Build's `serves`; unknown keeps the step with its condition in words (FR-C11) |
| RT-17 | P2 | A wildcard class Build would pollute classification, and `tab: 'star'` breaks `tab <= 3` | Fixed | A separate `StarBuildEntry` (`variant: 'star'`), kept out of classification and `kb.build`; class Builds untouched (TR-8) |
| RT-18 | P2 | The star-empty Goal crosses boundaries | Fixed | Built in Phase I if Q2 is accepted, in M9's folder and lists (FR-C15) |
| RT-19 | P2 | The clock-time preference has no mechanism for Knowledge Base text | Fixed | It applies to the UI-formatted times, which stay structured; Knowledge Base sentences stay relative; goldens at UTC 0 (FR-F6, G10) |
| RT-20 | P2 | The ADR 0005/0007 tension is unacknowledged (Will of the Eldest rule, authored facts) | Fixed | The ADR 0005 reasoning, the wiki citation and staleness; authored tier-2 facts under ADR 0007 (FR-C12, FR-C13) |
| RT-21 | P2 | Stories need fixtures that don't exist; the 12-minute case is ambiguous; the Timeline badge count has no source | Fixed | `allSetW2` and `historyOf(...)` test builders added by F; named fixtures for each star case; the 12-minute case pinned; the badge counts `buildTimelineView`'s `before` items (US-4, 5, 7, 10) |
| RT-22 | P2 | A manual pause pick snaps back on the next save | Fixed | It holds for the Play Session (FR-N6, D-8) |
| RT-23 | P2 | Lab fidelity: the Jersey 15 numeral isn't a critique borrow, the Away card's middle tier is invented, archived Command Board ideas aren't named, the next-points change is mislabelled an override, two treatments are mis-sourced | Fixed | The Field Guide verdict type; Away tiers per the brief; Portrait grid, Heat grid, Letter tile and Guide NPC listed as archived with reasons; next-points marked a functional request; world tint and the 4 px rule cited to the brief and inventory |
| RT-24 | P2 | Mock-data traps: the empty recap, the best-swap source, chibis animating on every row | Fixed | The recap hides when empty; best-swap confirmed in `collections/cards-view.ts`; chibis animate only for the playing character (TR-5) |
| RT-25 | P3 | "Vault row 53 is late" contradicts W3-early being 33 levels away | Fixed | Reworded with the link to the Vault page (§5.3) |
| RT-26 | P3 | The Log in gap rule is always true at 15 minutes | Fixed | A previous session ending at least 1 hour before (FR-N6) |
| RT-27 | P3 | `#map-<n>` collides with the tab pattern | Fixed | Checked first, with a test (TR-6) |
| RT-28 | P3 | The latin subset may lack →, ← and ✓ | Fixed | V-5 checks each; missing ones become art glyphs (FR-F2) |
| RT-29 | P3 | `data-mode` vs `data-theme` | Fixed | `data-theme` only (§3.3) |
| RT-30 | P3 | `map` → `other` defaults Suggest to "wrong" | Fixed | Places default to Idea (TR-18) |
| RT-31 | P3 | The 44 px rule would flag inline text links | Fixed | Exempt per WCAG 2.5.8 (TR-15, TR-16) |
| RT-32 | P3 | The badge font is unnamed | Fixed | Atkinson Hyperlegible Next 700, never a pixel face (FR-F4) |
| RT-33 | P3 | "#116 merges first" is stale; the denylist path only works in the main checkout | Fixed | Rebased on `6dfaefc`; absolute denylist path (§9, TR-1) |

## Verify before build

Facts to settle in the first PR of their phase. They are facts, not product decisions.

- [ ] **V-1 (F)** Find where the ~60 KB of `re2js` in the first load comes from (#116's note), and whether a supported Firebase import path drops it. Take it if yes; leave it alone if not.
- [ ] **V-2 (F)** `toolboxCalls.starTotal`: one-character calls equal each preset's spend plus 0–1 on `first` and `second`, and reproduce `fourth`'s −201 (the research note). On both private saves, the active preset's total is at least its spend.
- [ ] **V-3 (F)** Raw `KLA_<i>` covers every map for every character, and its door order matches `maps.fact.maps` doors.
- [ ] **V-4 (F)** Does Toolbox expose per-character statue levels (the split the spread chart needs)? If not, `byCharacter` is null and the spread chart isn't built.
- [ ] **V-5 (F)** The `@fontsource/<font>/latin-<weight>.css` entry exists for the three families and seven weights at 5.3.0, and each latin file has "→", "←" and "✓" (else those are drawn as art glyphs).
- [ ] **V-6 (N)** Play Session ends and level gains from `HistoryEntry` match M1's `sessionStart` and M9's baseline rule.
- [ ] **V-7 (F)** Each generated motif renders pixel-identical to its Lab SVG at 2× in all three ramps (0 differing pixels in the probe).
- [ ] **V-8 (M)** The W1–W4 boss, boss map and key item for `map.fact.boss-gates`, from the wiki and the existing `boss-keys` facts.
- [ ] **V-9 (C)** The best Beginner-line level and the best class level read from Account State (`classIndex` through `classes.fact.class-tree`) match Toolbox's `damage.ts` Beginner Best Class cap on `first` and `second`.
- [ ] **V-10 (F, N)** The grouped-jobs key (the entry id) with `groupText` groups `latest`'s trap line into one card. The golden shows 6 or 7 finished traps per row; count the rows that carry it.

## Consistency with other specs

This spec amends, and the affected owners note it in their specs at build time:
- M9 TR-5 and red-team #25 (star steps come back);
- M10 TR-2 (`session`, `map`, `classFamilies`);
- M10 TR-13 (fonts);
- M11 TR-2 (`fixSeconds`, `groupText`, the star `BuildStep`, `{x:in}`);
- M12 TR-12 (the CSS budget and the first-load art guard);
- M17 FR-1 and FR-5, and D-1 (the Map place, badges);
- M20 TR-6 (new picture kinds; the Daily & Weekly view in the Timeline).

Where this spec and an older one disagree on a visual or layout point, this spec wins (it implements the owner's 2026-10-18 ruling). Where they disagree on advice, the older module's Final rulings win, except for the changes listed under D-13.

## Sources

- ActiveOn Design Lab (private, 2026-10-18): `brief.md`, `critique.md` and `critique.json` (v1), `v2/critique.md` and `v2/critique.json`, `inventory.json` and `v2/inventory.json`, `tokens.css`, `art/README.md`. The public copy goes in `docs/design-lab/` (TR-1).
- Owner ruling and overrides, 2026-10-18 (this spec's header).
- Star Talents research note, 2026-10-18 (agent research over the vendored Toolbox, game data and the web).
- IdleOn Toolbox, vendored at `6c37e3da` (game 2.3.540): `parsers/talents.ts` L116-117, L197-207, L567-612; `parsers/character.ts` L241-250, L410-431, L521-537, L1729-1742; `parsers/damage.ts` L745-752, L1156-1158; `parsers/world-7/legendTalents.ts` L225-253. Tier 1, provenance.
- [IdleOn Wiki: Special Talents](https://idleon.wiki/wiki/Special_Talents) (edited 2026-10-05, verified 2026-10-18). Tier 2.
- [IdleOn Wiki: Star Talent Reset Potion](https://idleon.wiki/wiki/Star_Talent_Reset_Potion) (edited 2026-10-05, verified 2026-10-18). Tier 2.
- Toolbox community builds by Sir_Grimtide, updated 2026-10-10 to 10-15: [ih5wAK](https://idleontoolbox.com/tools/builds/view?id=ih5wAK), [b0sGrY](https://idleontoolbox.com/tools/builds/view?id=b0sGrY), [K4c9A0](https://idleontoolbox.com/tools/builds/view?id=K4c9A0), [CngknO](https://idleontoolbox.com/tools/builds/view?id=CngknO), [qncFFv](https://idleontoolbox.com/tools/builds/view?id=qncFFv). Tier 3. The builds API had 126 builds on 2026-10-18; none has a star tab in its payload.
- [Gameslikefinder: IdleOn Special Talents guide](https://gameslikefinder.com/article/idleon-special-talents-guide/) (2026-05-26). Tier 3.
- [Powerupgaming: Legends of IdleOn tier list, best Special Talents](https://powerupgaming.co.uk/2025/11/10/legends-of-idleon-tier-list-best-special-talents/) (2025-11-10). Tier 3.
- [DigitalTQ: IdleOn Special Talents guide](https://www.digitaltq.com/wiki/idleon/special-talents-guide) (2026-09-10). Tier 3.
- [Steam discussion on star talent points](https://steamcommunity.com/app/1476970/discussions/0/3726197825943969559) (2022-12-27). Tier 4, old.
- Dossier `research/character-builds` (2026-10-17): Star talents, Talent resets, and the build orders.
- Repo: `apps/activeon/src/**` at `6dfaefc` (with PR #116, M18), `packages/release/src/budgets.ts`, `apps/activeon/public/_headers` (CSP), the goldens `packages/knowledge/golden/scrubbed-w3.md` and `scrubbed-w2.md`, and the M7 (AC-1.5), M9 (US-2, US-3, TR-7) and M17 specs.
