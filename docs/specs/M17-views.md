# M17 Views: navigation shell, Timeline and Systems hub

Spec for the owner's feedback of 2026-10-18 ("things are too linearly displayed, everything as cards, too simplified, not enough visuals, graphics, and seemingly lots of missing guidance"; "features need a findable home"), part of the map [#1](https://github.com/YassSoliman/idleon-forge/issues/1). Status: **ready for owner review**. Every open question is self-ruled with a researched recommendation (section 8, "Owner review"), because the owner was away. An independent reviewer red-teamed it and its findings are folded in (section 10). Terms follow [`GLOSSARY.md`](../../GLOSSARY.md); decisions follow [ADRs 0001–0009](../adr/).

**What this spec is, and is not.** M17 is the **functional information architecture**: which places exist, how you move between them, what each one shows and which existing module output feeds it. It is not the visual design. Layouts below are wireframes. Colour, type, art, motion and the pictures of each System come from the parallel **Design Lab** track (the owner's private design exploration: its brief's principles P1–P12, the "AFK Timeline" concept in its section 4, and the Command Board and Field Guide directions in its section 3). A Design Lab choice may restyle anything here. It may not add advice or change a rule in this spec.

**The rule that holds the whole spec together:** **advice stays in Next Actions. Views add "See it" links, pictures, counts and status words, and never new advice.** Every string a new view shows is either (a) text a module (M2–M16) already produced, rendered unchanged; (b) a registry or fact-table fact (a System's name, how it opens, with its Source); or (c) a fixed view word from one file of this spec (a status word, a count, a heading, a time). TR-9 makes this testable.

**Decisions this spec rests on:**
- [ADR 0002](../adr/0002-deterministic-advice-ai-built-knowledge.md) (deterministic advice), [0004](../adr/0004-source-precedence.md) (game data first), [0005](../adr/0005-toolbox-numbers-not-our-formulas.md) (Toolbox numbers, no formulas of ours), [0006](../adr/0006-client-only-spa-parsing-in-a-worker.md) (client-only SPA; the Knowledge Base and Toolbox code only in the worker), [0007](../adr/0007-generated-facts-authored-judgment.md) (generated facts, authored judgment), [0008](../adr/0008-worker-for-suggestions.md) (exactly what the Suggestions Worker may receive), [0009](../adr/0009-game-art.md) (our own pixel art only).
- [#74](https://github.com/YassSoliman/idleon-forge/issues/74) (player-readable tier 2–4 Sources) and [#70](https://github.com/YassSoliman/idleon-forge/issues/70) A5 (no line repeated on every character).
- **M15's owner principles P1–P7**, adopted unchanged (P2 never a target above the next Stage, P5 one global ranking, P6 no tier jargon, P7 every warning carries its fix).
- **M3 Final rulings R-PILL-1** (owner, 2026-10-17): quick-collect caps (a full anvil, worship charge, idle traps) are small pills, never blockers or Fix cards. M17 keeps them quiet in every view (FR-17, FR-25).
- The owner lesson of 2026-10-18 after the Build view (PR #97): **every feature needs a findable home, a view per concept, not only cards mixed into the Now list.**
- The bare-anchor tab links of the character tabs (`#build-<index>` in #97, `#cards-<index>` in #99).

**Inputs.** The System Atlas (private Design Lab research, 2026-10-18): a catalogue of about 100 W1–W4 Systems with each one's unlock, coverage and proposed view, and a five-place view architecture (Now, Characters, Systems, Timeline, Map; "Next Actions stay the product. Views are where they live"). The atlas is not in the repo; every fact this spec takes from it is restated below with a public Source or a code reference, or listed under verify-before-build. Also M3 (Expected Return, cap times, R-PILL-1), M6 (banks and urgency), M10 (the Now screen, `EngineResult`, `buildNowView`), M11 (the System registry `systems.yaml`, `coverage()`, fact tables, goldens), M15 F5 (Stage Expectations), and the Build (#97) and Cards (#99) tabs. Code read: `main` at `0ee73e0` (2026-10-18).

**Fixtures.** CI assertions use the committed scrubbed saves `fixtures/scrubbed/scrubbed-w2.json` (W2-late, 5 characters) and `scrubbed-w3.json` (W3-early, 6 characters), whose findings are pinned in `packages/knowledge/golden/scrubbed-w*.md` (knowledge `e96480ed`, read 2026-10-18). Characters are described by class and level only. The private fixtures repeat the same stories locally.

---

## 1. Purpose

Today ActiveOn is one long screen: a Roster, a Focus card, and an Account list that grows past 20 Goals on a W2-late account, with "Not covered yet" as one collapsed line at the end. A player can't find the Build view without being told, can't see when each character stops earning, and can't tell which game Systems ActiveOn checks, which it doesn't, and which haven't opened yet. M17 gives every feature a findable home. It adds a **navigation shell** with four places:
- **Now**: the session coach, as today.
- **Characters**: every character and its **Character page**, with the Now, Build and Cards tabs.
- **Systems**: a hub of every game System, grouped by world, each marked wasting, behind, ok or locked, each opening a **System page**.
- **Timeline**: one lane per character plus account lanes, with bars running to each cap against the "Back in about" marker, so the player sees what fills or runs out before they're back, and the fix for it.

Every view reads what the advice modules already compute. None of them invents advice.

## 2. Scope / Out of scope

### In scope
- **The navigation shell:** the places, a bottom bar on narrow windows and a side rail on wide ones, routing with bare `#anchors` only, history and Back, the session state lifted out of the Now screen so it survives place moves, per-place scroll kept, place titles and keyboard focus on arrival.
- **Characters:** a grid of every character in save order, linking to its Character page (today's Focus card and its tab registry, `apps/activeon/src/now/character-tabs.ts`). The Builds and Cards overviews move here from under the Roster.
- **The Systems hub:** one tile per game System in the M11 System registry, grouped by world, with a status (wasting, behind, ok, locked, plus the honesty states "can't tell" and "not covered yet"), counts and how a locked System opens; plus the gaps that are not whole Systems.
- **System pages:** one generic page per System showing its status, its Next Actions from every character and the account in engine order, its cap pills, its Timeline bars, its Spend Plan lines, how it opens, and what ActiveOn does and doesn't check there. Dedicated pictures replace the generic body later, System by System.
- **The Timeline:** lanes per character and per account System, bars to each time-bound limit, a "now" line and the "Back in about" marker; anything that binds before the return is outlined and linked to its fix.
- **"See it" links** from Next Actions on Now to the System page or Character page tab that shows them.
- **The data each view needs:** additive `EngineResult` fields (`systems`, `behindSystems`, `unknownFindings`, `Goal.urgency`, then `timeline` and `returnAt`), registry fields (`kind`, a link to an unlock fact), the pure view builders, and the text renderers for the golden snapshots.

### Out of scope (and who owns it)
- **The Map place** (the world route with every character on it). It needs map, portal and avatar data that M2, M4 and M14 don't export yet. A later M17 phase or its own spec. Until then there is no Map item (D-1).
- **Dedicated System pictures** (cauldron columns, the Cog Board, the Star Chart, the Stamp Book…). Each belongs to the module that owns that System's advice (M8, M16, and the proposed M18 Gear & Tools, M19 Alchemy, M20 Skills & Parallel Slots), with visuals from the Design Lab. M17 gives them the slot (TR-7).
- **New Character page tabs** (Gear, Skills): M18 and M20 register them in `character-tabs.ts`.
- **The Session Checklist** (Log in / Rounds / Log off, the daily and weekly clock): an M6 and M10 Now-screen concern, specced with M20.
- **Changing what Now shows:** the Roster, Focus, Account section, Verdicts, pills, caps and ordering stay M10's. M17 only moves the two overviews, adds "See it" links and the links into the new places (FR-31, FR-32).
- **Any new Check, Goal, ranking or Detector.** M17 owns none.
- **Active Play suggestions, Higher-leverage lines and `Verdict.suggestion` on System pages.** They carry no System today; they stay on Now and the Character page.
- **Notifications, a pop-out window, Settings.** As in M10.

## 3. Functional requirements

### The navigation shell
- **FR-1 Places.** The shell's places, in this order: **Now**, **Characters**, **Systems**, **Timeline**. Each has a label word and a glyph (Design Lab). **Phase 1 ships three** (Now, Characters, Systems). Timeline joins in Phase 2, when its data exists. Map is not shown, not even disabled, until it is built (D-1).
- **FR-2 Where the navigation sits.** In a viewport narrower than **720 px**, the places are a **bottom bar** of equal items. At 720 px and wider they are a **side rail** left of the content column. Both show the same items in the same order. Below a viewport height of **480 px** (a short overlay window), the bar sits in the page flow under the header, so it never covers content (D-5). The bottom bar respects `env(safe-area-inset-bottom)`.
- **FR-3 Never covers content.** The bottom bar reserves its own height at the end of the page, so the last line of every place scrolls clear of it. No other chrome is fixed. This narrows M10 TR-14's "no persistent `position: fixed` chrome" to "no fixed chrome that covers content" (D-5).
- **FR-4 Current place.** The current place is marked by more than colour: a filled glyph, a heavier label, and `aria-current="page"`. A Character page marks the place it belongs to (D-3): **Now** when it was opened from the Roster, the Verdict strip, "Next", auto-follow, first-load auto-open or a deep link; **Characters** when it was opened from the Characters grid. Opened from a System page or the Timeline, it marks the place it came from. On a Character page the marked item uses `aria-current="true"`, since it is the parent place, not the page itself.
- **FR-5 Badges.** The Now item carries the count M10's progress label already gives: K ("fix K before you leave") plus S ("fix S in Account"), when the sum is above zero. The Systems item carries the number of Systems that are **wasting** (FR-17). Characters and Timeline carry no badge. A badge has an accessible name ("Now, 3 to fix before you leave"). Zero shows nothing. Cap pills never count toward either badge (R-PILL-1).
- **FR-6 What stays global.** The header (wordmark, cloud-save age, the Expected Return chips, Suggest), the banners (in M10 TR-11's order), the progress bar and the footer are the same in every place. Picking an Expected Return chip in any place re-runs the engine (M10 TR-6), and every place updates.
- **FR-7 Routes are bare anchors.** The whole route lives in the URL fragment: one anchor, no query string, no path.

  | Anchor | Shows |
  |---|---|
  | none, `#now` | Now |
  | `#characters` | Characters |
  | `#<tab>-<index>` (`#now-3`, `#build-3`, `#cards-3`) | the Character page of `CharacterState.index` 3, on that tab |
  | `#systems` | the Systems hub |
  | `#system-<systemId>` (`#system-alchemy-bubbles`) | that System page |
  | `#timeline` | the Timeline (Phase 2) |

  Legacy and in-page anchors:
  - `?c=<i>` alone becomes `#now-<i>`.
  - `?c=<i>#<tab>-<i>` (today's tab links, `tabHref` in #97) becomes `#<tab>-<i>`. Both rewrites use `history.replaceState`, once on load. `?c=` is never written again (D-2).
  - `#builds` and `#cards` (today's overview anchors) open Characters and scroll to that overview.
  - An unknown anchor, an unregistered `<tab>`, an index with no character, a `systemId` not in the registry, or `#timeline` before Phase 2 opens Now. The URL is left as it was, so M10's in-page anchors (`#spend-plan`) still scroll.
- **FR-8 History.** A move the player makes adds one history entry with `pushState`: a navigation item, a tile, a lane head, a "See it" or Fix link, a Roster row, or a back link. A move the app makes uses `replaceState`: M10's auto-follow, the first-load auto-open, or a legacy rewrite. The browser Back button returns to the previous route. The Character page's "← back" link (and Esc, as M10 FR-14 has it) returns to the place it was opened from, or to Now for a page opened by a deep link (D-3).
- **FR-9 Following the game, inside the shell (D-4).**
  - **First-load auto-open** (M10 FR-14) happens only when the load's route is Now (no anchor, or `#now`). A deep link to any other place always wins.
  - **Auto-follow** moves the view only while the player is on **Now** or on a **Character page's Now tab**. Then a switch opens the newly played character's Now tab under M10 FR-14's rules (never mid-interaction, `replaceState`, keyboard focus never moves).
  - Anywhere else (Characters, Systems, a System page, the Timeline, a Build or Cards tab), a switch never moves the view. The shell shows M10's "Now playing <name> · go" chip at the top of the content, and the switch is announced once. "go" is a player move (`pushState`).
  - The visited set, the frozen Visit Order and "Next: switch to …" keep working through place moves (FR-10).
- **FR-10 Session state lives above the places.** The state that today lives inside `NowScreen` moves into the shell, so it isn't lost when Now is not shown:
  - the follow state (playing, left-from, visited) and the save handler that drives it;
  - the frozen Visit Order, including paste mode's in-memory order;
  - M10's `expanded` set ("show more", "show details");
  - the pending "Now playing · go" chip;
  - the single polite live region;
  - the current character tab (one value, as today: switching characters keeps the tab).

  Within one page load, coming back to a place restores its scroll position. Moving between places never re-runs the engine or the worker: every place re-renders from the same `EngineResult`. A reload restores only the route (FR-7) and M10's stored preferences (D-10).
- **FR-11 Arrival.** The header keeps the app's one `<h1>` (the wordmark). Each place has an `<h2>` title. On a player-initiated move, keyboard focus moves to that `<h2>` (on a Character page, M10 TR-14's Focus `<h2>`). The document title becomes "<Place> · ActiveOn". A Character page's title is "<Place it belongs to> · ActiveOn", never a character name, because titles land in synced browser history. M10 FR-34's "(n) " prefix still applies while the window lacks focus. A move the app makes changes neither keyboard focus nor scroll (M10 FR-14).
- **FR-12 When the shell shows.** The navigation shows only in M10's `ok` state (TR-11 there). Signed out, waiting, parsing for the first time, "Can't read your save" (M10 FR-38) and "Can't work out advice" (FR-39) render exactly as today, with no navigation. So no view ever shows anything advice-shaped from a broken parse or a failed engine. A deep link is kept in the URL and honoured once the state turns `ok`.

### Characters
- **FR-13 The grid.** Characters shows one tile per character in **save order** (the in-game slot order, so a tile never moves). Each tile shows:
  - the name, class and level (M10 D5);
  - the AFK Target and map (`activityLabel`, `mapLabel`);
  - the Verdict pill exactly as the Roster shows it (with "· n skipped");
  - its cap pills (M3 R-PILL-1), as on the Roster;
  - one status line per registered tab that publishes one (today the Build line from `BuildRoadmap.status`, and the Cards line from `NowView.cards`).

  A tile opens the Character page on its Now tab. Each tab line opens that tab.
- **FR-14 The overviews move here.** The Builds overview (#97, `BuildsOverview`) and the Cards overview (#99) render under the grid in Characters, unchanged, and no longer under the Roster on Now. The Roster's "Builds ↓" and "Cards ↓" heading links become one link, "Builds and cards → Characters" (D-7). The Build and Cards chips on each Roster row stay, and open the Character page tab as today.
- **FR-15 The Character page.** It is today's Focus card with its tab bar (`characterTabs`), opened on a route of FR-7, with the Account section, "If you have time" and "Not covered yet" under it exactly as Now renders them under Focus today. M17 changes only its route (`#now-<index>` replaces `?c=<index>`), its back link (FR-8) and its title (FR-11). Tabs added later register in `character-tabs.ts` as #97 describes, and get their anchor and their Characters status line from that one entry.

### The Systems hub
- **FR-16 Tiles.** The hub has one tile per **game** System in the M11 System registry (`packages/knowledge/systems.yaml`). Registry rows gain `kind: game | activeon` (TR-8). The `activeon` rows are ActiveOn's own concepts, not game Systems, and get no tile: `afk` (its home is the Timeline), `metapath` and `spend` (its home is the Spend Plan on Now). Tiles are grouped by the registry's `world`, in this order:
  - **Across worlds** (world 0: account-wide Systems and per-character ones such as Talents, Cards and Skills);
  - **World 1 · Blunder Hills**;
  - **World 2 · Yum-Yum Desert**;
  - **World 3 · Frostbite Tundra**;
  - **World 4 · Hyperion Nebula**.

  Inside a group, tiles keep registry order.
- **FR-17 Status.** Each tile has exactly one status, the first that applies. `buildSystemsView` (TR-5) computes it from the current `EngineResult` and the player's skips and dismissals:
  1. **locked**: the System's unlock Detector says `no` (M11 `systemUnlocked`).
  2. **wasting**: value is being lost before the return, and a fix exists. Either the System has a Verdict blocker or an account stockpile blocker (a Goal of that System with category `blocker`), or it has a Goal whose ranking urgency is `losing-now` or `lost-before-return` (M6 TR-9, carried on `Goal.urgency`, TR-2). **Cap pills never make a System wasting** (R-PILL-1).
  3. **behind**: the System has a Stage Expectation row that is behind (M15 FR-26) and whose fix is safe to follow (M15 FR-31), from `EngineResult.behindSystems` (D-9).
  4. **can't tell**: the System's unlock state is `unknown`, a Detector of one of its entries failed this run (`diagnostics.failedDetectors`), or one of its Checks returned `unknown` for a reason other than missing history (`EngineResult.unknownFindings`, TR-2: a failed parser section or a missing field).
  5. **not covered yet**: the System has no active or Contested authored entry (M11 `coveredSystems`, the same rule as M10's "Not covered yet" line).
  6. **ok**: none of the above. The tile says it as "Nothing to fix": nothing ActiveOn checks here needs fixing.

  Skips and dismissals:
  - A blocker or urgent Goal that the player skipped (Skip today) or dismissed (Not for me) doesn't make a System wasting. The tile adds "· n skipped" instead, as M10's "Ready · n skipped" does (D-8).
  - A behind row whose every fix finding is skipped or dismissed doesn't make the System behind.
  - **A locked System with a behind row** stays **locked**, adds "· behind for your Stage" to its reason, and stays out of "Needs you" (FR-21; R6 QA ruling: locked Systems never appear there). The Post Office on W3-early is this case: its row expects it by W2-late, and its unlock Next Action fires.
- **FR-18 Tile content.** Each tile shows the name, a glyph (Design Lab), and the status as a glyph plus a word (never colour alone). Under that is one reason line, built only from counts and fixed words (TR-9):

  | Status | Reason line |
  |---|---|
  | wasting | "2 to fix before you leave · 3 to do" |
  | behind | "Behind for your Stage · 3 to do" (M15's own words: no Stage label, no score, P6) |
  | ok | "Nothing to fix · 2 to do", or "Nothing to fix" |
  | can't tell | "Can't tell from the save" |
  | not covered yet | "Not covered yet", plus "· in the Spend Plan" when Spend Plan lines buy into the System (FR-22) |
  | locked | how it opens (FR-19) |

  Any status may append "· n full · collect" for the System's cap pills (anvil, worship, traps) that are full or fill before the return. That is the pill's own word, and the status doesn't change.

  Counts:
  - "To do" counts the System's Goals left after skips and dismissals. M10's display caps (3 per character, 5 for the account) are not applied: the hub counts everything that Now would show under "show more".
  - "To fix before you leave" counts the blockers and urgent Goals behind the wasting status.
- **FR-19 Locked Systems and how they open.**
  - A locked tile shows how the System opens, in condition form and never as an instruction. It reads at the precision of the unlock Detector that decides the state. For today's `worlds/reached` rows, that is the world ("Opens in World 2 · Yum-Yum Desert"), so the tile never promises a condition the state doesn't check.
  - The System page's "How it opens" section adds the precise in-game condition from the unlock fact (TR-8; "Postboy Pablob appears in the W2 town once a character reaches Lv 50"), with its Source and patch. A System whose own unlock Detector checks that condition (for example `post-office/unlocked`) shows the precise text on the tile too.
  - A locked System can have a firing Next Action of its own. On W3-early, `post-office.check.unlock` fires on the Squire 85 while `post-office/unlocked` says no. Such a System stays locked. Its tile adds "· 1 to do", and its page shows that Next Action under "How it opens".
- **FR-20 Which worlds show.**
  - World groups up to the account's highest reached world **plus one** are shown. "Highest reached world" is the highest world for which the registry's own `worlds/reached` Detector says yes. On a W3-early account the hub shows Across worlds, W1–W3, and W4 with its locked tiles.
  - Registry groups beyond that collapse into one line, "Later worlds: n Systems", that expands on tap. A locked next-world tile is information, never a target (P2). It has no Next Action unless a module already emits one.
  - An account past World 4 sees "Worlds 5–7: not covered yet" as the last group (from M2's pseudo gap, FR-21).
- **FR-21 "Needs you", and gaps that aren't Systems.**
  - **Needs you.** Above the world groups, a strip lists the wasting tiles, then the behind tiles, each in world-then-registry order, as compact chips that open the System page. It shows nothing when no tile is wasting or behind. The hub never ranks Systems against each other beyond these two buckets (D-11).
  - **Other gaps.** At the end of the hub, a group "Not covered yet: other gaps" lists the `notCovered` items that are not whole Systems, in M10 FR-26's order, as plain lines with no page: "Worlds 5–7", "AFK safety for Lab, Cooking and Breeding", "Refinery storage", "elite talent builds" and the like. So the hub carries everything M10's line does.
- **FR-22 Versions.** While `versions.parserBehind` is true (M1 D3(b)), every tile's reason adds "· may be out of date", and "Nothing to fix" becomes "Nothing to fix (may be out of date)". This matches M10 FR-35's banner and M5's paused comparisons.

### System pages
- **FR-23 The generic System page.** Every System in the hub has a page at `#system-<id>`, built from the same `EngineResult`. From top to bottom:
  1. **Header**: name, status and reason line (FR-17, FR-18).
  2. **Next Actions**: every Goal of this System from every character and the account, in engine order (characters in the frozen Visit Order, each character's Goals in its own rank order, then the account's). Each one:
     - renders with M10's Next Action component and the same keys, so Skip today, Not for me and Report this act on the same item as on Now;
     - is labelled with its character (name, class and level) or "Account".

     When M15 F5 moved this System's fix findings into the "Behind for your Stage" Goal (M15 FR-29), that Behind Goal shows here with its details, so its lines are never lost.
  3. **Quick collects**: the System's cap pills per character, as the Roster shows them.
  4. **On the Timeline** (Phase 2): this System's bars (FR-24), as a compact list linking to the Timeline.
  5. **In the Spend Plan**: the Spend Plan lines with a step whose `ref` belongs to this System (its entry-id prefix, for example `upgrade-vault.acquisition.*`), read-only, linking to the Spend Plan on Now.
  6. **How it opens**: the unlock fact and its Source (FR-19). It is open when the System is locked and collapsed otherwise. Always-open Systems read "Open from the start".
  7. **Coverage**:
     - A System with no authored entry reads "ActiveOn doesn't check <System> yet.", with a Suggest link (M13, type Idea).
     - A covered System lists what ActiveOn checks there: the titles of the System's active Checks that ran this run, each marked "checked: nothing to do" or "checked: see above". So the player sees what "Nothing to fix" covers.
  8. **Sources**: the System's player-facing wiki page (from its unlock fact), plus the Sources of the Next Actions shown.

  **When M2's Stage is unknown** (the "Can't tell where your account is on the route" banner), a System page shows only Verdict blockers and account stockpile blockers, as Now does (M10 §6). There are no other Goals and no Spend Plan lines, and the tile's "to do" count is hidden.
- **FR-23a Homes.** A System's **home** is its entry in the engine's data-only `SYSTEM_HOMES` table (TR-7) if it has one, otherwise its generic page. An entry can point a System at:
  - a Character page tab: Talents, Talent presets and Talent resets → Build; Cards → Cards. The System page still exists, and its header adds "See every character's <tab>", which links to that overview in Characters;
  - a dedicated page component (a later module's picture). It keeps the generic header, Next Actions and Coverage sections and replaces only the body between them.

### The Timeline (Phase 2)
- **FR-24 Bars.** A bar is one time-bound limit that a module already computed. The Timeline never computes a time of its own (D-18). Bars come from:
  - a Check finding with a time (`at`);
  - a passing Check with its next fill time (`nextAt`);
  - a cap pill (M3 R-PILL-1);
  - an M6 bank deadline.

  Each bar runs from now to the moment it binds and carries:
  - what binds, in the producer's words ("anvil", "Arcade balls", "health food");
  - a kind (storage, food, time cap, production cap, bank or timer), each with its own glyph and word ("full", "runs out", "stops", "caps", "lost", "ready");
  - the time, relative and clock ("in about 3h · 01:20", Design Lab P6).

  A bar whose time has passed is drawn as **full now** at the "now" line.
- **FR-25 Before the return.** A bar that binds at or before the return (`at ≤ returnAt`, or full now) is marked in one of three ways, depending on what its producer said:
  - **A blocker, or a Next Action whose fix holds**, is **outlined**, with the words "before you're back" (never colour alone) and a **Fix** link to its Next Action (FR-27). After its end, the rest of its row up to the return marker is hatched, so the lost hours read at a glance.
  - **A cap pill** is drawn with the pill's own label ("Anvil full · collect"), not outlined and not hatched. It has a "See it" link to the pill on its Character page (R-PILL-1).
  - **A limit whose fix doesn't hold** (M3 FR-7 (c): "it refills even if collected") is plain. It has no Fix link and no hatching, and carries the producer's text.

  A bar that binds after the return is plain.
- **FR-26 Present-state problems and untimed limits.**
  - A blocker with no time (no AFK Target, dies on its map, wrong preset, an unassigned cauldron) is a **"now" marker** at the start of its lane, outlined, with its Fix link.
  - A finding the producer can't time (`afk.check.low-food-untimed`, or health food without history, `unknown (needs-history)`) is listed at the end of its lane as "<what> · can't tell when", with no bar. Several untimed findings about the same `what` on one lane show once.
  - Nothing is ever drawn at a guessed time.
- **FR-27 Fix links.**
  - A Fix link opens where its Next Action is shown: the character's Character page on its Now tab, or the Account section on Now. It scrolls to that Next Action and highlights it.
  - If the Next Action sits under "show more" or inside a Behind Goal's details, the link expands those first.
  - If the Next Action was skipped or dismissed, the bar is drawn but not outlined, and reads "skipped" or "hidden until next patch". The link opens the same place, where M10's "n skipped · undo" is.
- **FR-28 Lanes.**
  - **Character lanes**: one per character, in the **frozen Visit Order of the Now screen** (M10 D6), so the lanes match the Roster's numbers. Each lane head shows the Visit Order number, name, class, level, AFK Target and the Verdict pill.
  - **Account lanes**: after a divider, one lane per System that has account bars (for example Arcade, Alchemy, Refinery, Colosseum), in world-then-registry order. A finding's subject decides its lane, so a character-level bank (boss keys on the Squire 85) sits on that character's lane.
  - A lane head opens its Character page (character lanes) or its System page (account lanes).
- **FR-29 The axis.**
  - The axis starts at now and ends at the later of now + 12 h and the return + 25 % of the Expected Return. It is capped at now + 48 h, except that it always reaches the return + 1 h, so the marker is always on the axis (D-16).
  - It shows a "now" line, the **"Back in about Nh · <clock>"** marker at `returnAt`, and hour ticks.
  - A bar that binds past the axis end is drawn to the edge with "later" and its time.
  - The Expected Return chips stay in the header (FR-6). Picking one moves the marker and re-flags every bar when the re-run result arrives.
- **FR-30 Narrow layout.**
  - Under 720 px, the lanes stack vertically. Each lane's bars become thin rails with the time text on the right, and the axis scrolls sideways **inside** the lane area only, snapped to "now". The scroll area is keyboard-focusable. The page itself never scrolls sideways.
  - Under 400 px, a lane may switch to its list form ("Earns until 03:40 · stops: carry full"), one row per bar in time order.

### Now, and "See it"
- **FR-31 "See it" links.**
  - Every Next Action on Now (Focus and the Account section) gets one quiet link, "See it: <System>", that opens its home (FR-23a) with that Next Action highlighted. This covers every game System, since every one has at least its generic page.
  - The "Behind for your Stage" Goal links to the System its row names (`behindSystems`, the `chosen` row).
  - `afk` Next Actions link to the Timeline from Phase 2.
  - `metapath` Goals other than Behind, and the Spend Plan, get none.
  - The link is never shown on the System page itself.
- **FR-32 Links into the new places.** On Now:
  - M10's "Not covered yet" line ends with "→ Systems";
  - from Phase 2, the "All set" banner's first-fill text ("First thing fills up in about 9h: …") links to the Timeline.

  Nothing else on Now changes.
- **FR-33 Same truth everywhere.** A Next Action, a Verdict, a skip or a dismissal is the same object in every place. Skipping a Next Action on a System page hides it on Now and on its Character page at once (same `NextAction.key`, M10 TR-8). The hub's counts and the navigation badges update in the same render.

### Data
- **FR-34 How Systems open, as facts.** How each game System opens is a Knowledge Base fact, not registry prose, so it is patch-tagged and can go Stale like any fact:
  - It lives in a fact table, `systems.fact.unlocks`: one row per game System with the in-game condition (≤ 120 characters, condition form), its world, the patch it was verified on, and at least one tier 2–4 player-readable Source whose page the PR author opened (#74). One of those Sources is the System's IdleOn Wiki page.
  - Rows already covered by `metapath.fact.town-unlocks` reference those rows instead of repeating them.
  - The table is authored tier 2 until Toolbox exposes the conditions as data (ADR 0007; M2's town-unlock precedent).
  - The registry row names its fact row (`unlockFact`). CI fails when a game System has no row, unless it is `unlocked: always`.
  - A Stale row renders with M10's Stale mark.
- **FR-35 Registry growth (Phase 3).** Phase 3 adds registry rows (and their unlock facts) for W1–W3 Systems the System Atlas found with no row today, so their tiles show "not covered yet" or "locked" honestly (D-12): Star Signs (M16 needs it anyway), Equipment, Achievements, Guild, Family bonuses, Killroy, Weekly Battles, Dungeons, Armor Smithy and Random Events. Each row follows FR-34 and is confirmed against its wiki page at the current patch first (verify list, section 7).

## 4. User stories

Fixtures as in the header. View-model criteria are asserted on the pure builders' output (TR-5, TR-6) and on the golden text (TR-10). "Screen" criteria run in Vitest with Testing Library. Layout criteria (sizes, scroll, bounding boxes) run in headless Chrome (TR-14).

**US-1 Find a feature's home.**
As a player in a Play Session, I want a bar with my places, so that I can find a feature without being told where it hides.
- Given `scrubbed-w3` at 390 px, after Phase 2 / When the app renders / Then a bottom bar shows exactly four items in the order Now, Characters, Systems, Timeline, with Now current (`aria-current="page"`), and no item named Map. After Phase 1 only, it shows the first three, and no Timeline item (headless Chrome).
- Given the same save at 1280 px / When the app renders / Then the same items render as a side rail, and there is no bottom bar (headless Chrome).
- Given a 400 × 420 px window / When the app renders / Then the place items sit in the flow under the header, and the last element's bounding box clears the viewport bottom at full scroll (headless Chrome).
- Given `scrubbed-w3` (fix 2 before you leave, nothing in Account) / When the app renders / Then the Now item's badge reads 2, with the accessible name "Now, 2 to fix before you leave".

**US-2 Deep links that survive a reload.**
As a player, I want every place to have a short link, so that a reload or a bookmark lands where I was.
- Given the URL `…/#system-refinery` / When the app loads `scrubbed-w3` / Then the Refinery System page shows, Systems is current, and the title is "Systems · ActiveOn".
- Given `…/#cards-2` / When it loads / Then the Character page of character index 2 opens on its Cards tab, and Now is current (a deep link, FR-4).
- Given `…/?c=3` / When it loads / Then the URL becomes `…/#now-3` by `replaceState`, the history length is unchanged, and character 3's Character page shows. Given `…/?c=3#build-3` / Then the URL becomes `…/#build-3` and the Build tab shows.
- Given `…/#builds` / When it loads / Then Characters shows, scrolled to the Builds overview.
- Given `…/#system-nonsense`, `…/#build-99` (no such character) or `…/#spend-plan` / When it loads / Then Now shows, and for `#spend-plan` the Spend Plan is scrolled into view as today.
- Given a live save under 5 minutes old and the URL `…/#system-refinery` / When it loads / Then the Refinery page stays, with no first-load auto-open (FR-9).
- Given any route / When the URL is inspected / Then it holds no query string and no path segment beyond the app's own.

**US-3 Back goes back.**
As a player, I want Back to undo my last move, so that exploring never loses my place.
- Given four player moves, Now → Systems → the Alchemy bubbles page → Characters / When the player presses browser Back three times / Then the screens are the Alchemy bubbles page, Systems, then Now, in that order.
- Given the player scrolled the Systems hub, opened the Anvil page, then pressed Back / When the hub shows / Then it is at the scroll position it had (headless Chrome).
- Given a Character page opened by the deep link `#build-1` / When the player presses "← back" / Then Now shows.

**US-4 Following the game where it helps, never where it would yank me.**
As a player in a Play Session, I want the screen to follow my character switches on Now, and leave me alone while I explore, so that I'm never pulled off a page I'm reading.
- Given the player is on Now's Roster, in live mode / When a save shows a switch to character 4 (M10 US-3's recorded fixture) / Then character 4's Now tab opens by `replaceState`, as M10 FR-14 says, and Now stays current in the navigation.
- Given the player is on the Systems hub, or on character 2's Build tab / When the same save arrives / Then the view stays, a "Now playing <c4> · go" chip shows at the top, keyboard focus doesn't move, the live region announces it once, and "go" opens character 4's Now tab (one `pushState`).
- Given the player went from Now to Systems, a switch save arrived there, and they came back to Now / When the screen renders / Then character 4 counts as visited, "Next: switch to …" skips it, and the Roster keeps its frozen order.

**US-5 See what each System needs at a glance.**
As a player, I want every System as a tile with a status word, so that I know where my account is losing value and where it's fine.
- Given `scrubbed-w3` with the 8 h return / When the hub renders / Then:
  - Talent presets is **wasting** (the Bowman 60 and Barbarian 56 blockers "Swap to your … preset before you leave"), with "2 to fix before you leave".
  - Anvil is **not** wasting. Its reason ends "· 6 full · collect" (all 6 anvils full now, cap pills).
  - Worship's reason ends "· 4 full · collect" (charge at 50 of 50 on 4 characters).
  - The Systems badge counts neither Anvil nor Worship.
- Given `scrubbed-w2` / When the hub renders / Then Arcade is **wasting** (the account blocker "Claim Arcade balls before you leave", cap now), and Anvil reads "· 1 full · collect" (the Barbarian 60's anvil) without being wasting.
- Given either scrubbed save / When the hub renders / Then the set of tiles marked **not covered yet** equals the whole-System items of that save's "Not covered yet" golden list. On `scrubbed-w3` those are Classes and subclasses, Portals and map doors, Skills doors and tools, Upgrade Vault, Bribes, Forge, Quests, Statues, The Owl, Alchemy Pay 2 Win, Islands, Atom Collider, Equinox, Prayers, Salt Lick and Shrines. Upgrade Vault's reason adds "· in the Spend Plan", because Vault lines are in the plan.
- Given every Next Action of a System that is a Verdict blocker on Now / When the hub renders / Then that System is wasting (an invariant over every public and scrubbed fixture).
- Given a System whose only blocker was skipped today / When the hub renders / Then that System is not wasting (unless something else makes it so), and its reason adds "· 1 skipped".
- Given any tile / When it is greyscaled / Then its status is still readable (glyph plus word; headless Chrome).

**US-6 Know what hasn't opened yet, without being nagged.**
As a W3-early player, I want next-world Systems shown greyed with how they open, so that I learn what's coming without a to-do list for it.
- Given `scrubbed-w3` / When the hub renders / Then:
  - a World 4 group shows Laboratory, Cooking and Breeding as **locked**, each reading "Opens in World 4 · Hyperion Nebula";
  - none of them has a "to do" count;
  - no World 5+ group exists.
- Given `scrubbed-w2` (highest world 2) / When the hub renders / Then World 3 shows with its tiles, and World 4 collapses to "Later worlds: 3 Systems".
- Given `scrubbed-w3` / When the Post Office tile and page render / Then:
  - the tile is **locked**, with the precise condition (its own Detector checks it), "· 1 to do" and "· behind for your Stage";
  - Post Office does not appear in "Needs you" (R6 QA ruling);
  - the page's "How it opens" shows the condition, its Source, and the Next Action in the entry's own words: "Finish Postboy Pablob's quest: 5 Empty Boxes from Anvil Tab 2".
- Given any unlock fact or view word / When it is linted (TR-9) / Then it starts with "Opens", "Needs" or is a fixed view word, and contains no word from the advice lexicon.

**US-7 See behind Systems, not a rating.**
As a player, I want Systems my account should have finished by now marked "behind", so that I know where to look, without a tier score.
- Given `scrubbed-w2` (Stage W2-late), where M15's seed table makes the Cards, Stamps, Talent presets and big-bubbles rows behind (`behind.test.ts`) / When the hub renders / Then:
  - the Systems of those rows' fixes (cards, stamps, talent-presets, alchemy-bubbles) read "Behind for your Stage", unless they are wasting;
  - "Needs you" lists them after the wasting tiles;
  - no text in the hub's content area contains a Stage label for a System, "Tier", "rated" or a score.
- Given a behind row whose fix is Contested or Stale (M15 FR-31) / When the hub renders / Then that System is not behind.
- Given the player pressed Not for me on every card line / When the hub renders / Then Cards is not behind.
- Given the Cards page on `scrubbed-w2` / When it opens / Then it shows the "Behind for your Stage: Cards" Goal with the other card lines as its details. Each card Next Action keeps Skip today, Not for me and Report this.

**US-8 One System, all its Next Actions.**
As a player, I want a System's page to collect every Next Action for it across characters, so that I can do one System in one pass.
- Given `scrubbed-w3` / When the Refinery page opens / Then it lists, in engine order, the account Goals of system `refinery` ("Get the fuel to run a Refinery salt…" and the Auto Refine line), each labelled "Account" with its Source, plus "How it opens" and "What ActiveOn checks here", where `refinery.check.fuel-runs-out` reads "checked: nothing to do".
- Given the Anvil page on `scrubbed-w3` / When it opens / Then "Quick collects" shows 6 "Anvil full · collect" pills, one per character, each linking to that Character page.
- Given the player presses Skip today on a Next Action on a System page / When they open Now / Then that Next Action is hidden there with "1 skipped · undo" (same key), and the hub's counts dropped by one in the same render.
- Given the Stage is unknown / When any System page opens / Then it shows only blockers, no Spend Plan lines, and no "to do" count (FR-23).

**US-9 Know the honest gaps.**
As a player, I want a System ActiveOn doesn't check to say so, so that I know I'm on my own there.
- Given `scrubbed-w3` / When the Equinox page opens / Then it reads "ActiveOn doesn't check Equinox yet.", shows its wiki link and a Suggest link, and shows no "Nothing to fix".
- Given a System where a Detector failed, or a Check returned `unknown` because its parser section failed / When the hub renders / Then its tile reads "Can't tell from the save" unless it is locked or wasting, and never "Nothing to fix".
- Given `scrubbed-w3` / When the hub renders / Then its last group lists the non-System gaps of the save's "Not covered yet" list, if any, as plain lines.
- Given `versions.parserBehind` is true / When the hub renders / Then every reason ends "· may be out of date".

**US-10 See when each character stops earning.** (Phase 2)
As a player about to log off, I want one lane per character with bars to each cap and my return marked, so that I see what fills before I'm back.
- Given `scrubbed-w3` with the 8 h return / When the Timeline renders / Then:
  - it has 6 character lanes in the Roster's frozen Visit Order, Bowman 60 first, as Roster row 1;
  - it shows a "Back in about 8h" marker;
  - every lane carries "Anvil full · collect" at the "now" line, drawn as a pill (not outlined), with "See it" opening that Character page at its pill;
  - the Bowman 60's lane starts with an outlined "now" marker for its wrong-preset blocker, with a Fix link.
- Given `scrubbed-w2` / When the Timeline renders / Then:
  - the Barbarian 60's lane starts with an outlined "now" marker for `afk.check.dies-fixable-by-food`, with a Fix link to "Equip or swap in Meat Pie…";
  - an Arcade account lane shows "Arcade balls · full now", outlined, with a Fix link to the Account section;
  - the Squire 43, Shaman 44, Bowman 54 and Wizard 56 anvils (`anvil.check.fill-time`, "full in about 1–6 h at current speed", fix doesn't hold through the return) are plain, with no Fix link and no hatching.
- Given a blocker bar at `returnAt + 1h` / When the player taps the 12h chip and the re-run arrives / Then the marker moves to 12 h, and that bar becomes outlined with "before you're back".
- Given `scrubbed-w3`, where the Wizard 73's health food can't be timed without history and its low-food Check fires untimed / When its lane renders / Then the lane lists "health food · can't tell when" once, with no bar.
- Given any bar / When a screen reader reaches its list item / Then it reads "<what> <kind word> in about <n>h, at <clock>, before you're back" (or "after you're back"), and a full-now item reads "<what> full now". The bar graphic is `aria-hidden` and holds no focusable element.
- Given 11 characters (the public `latest` save) at 390 px / When the Timeline renders / Then the page has no horizontal scroll (`document.documentElement.scrollWidth` equals `clientWidth`), and lanes scroll sideways only inside the lane area (headless Chrome).

**US-11 Get from the bar to the fix.** (Phase 2)
As a player, I want the outlined bar to take me to its fix, so that seeing a problem is one tap from solving it.
- Given an outlined account bar whose Next Action is the 6th account Goal (behind "show more") / When the player taps Fix / Then Now opens, "show more" expands, and that Next Action is scrolled to and highlighted.
- Given a blocker bar whose Next Action was skipped today / When the Timeline renders / Then the bar shows "skipped" and is not outlined, and Fix opens the Character page where "1 skipped · undo" is.

**US-12 "See it" from Now.**
As a player reading a Next Action on Now, I want a link to the place that shows its System, so that I can see the whole picture behind one line.
- Given the Shaman 54's Now tab (`scrubbed-w3`), with "Equip Level up gift in a big-bubble slot" (system `alchemy-bubbles`) / When it renders / Then the Next Action has "See it: Alchemy bubbles", and the link opens `#system-alchemy-bubbles` with that Next Action outlined.
- Given a talent-preset blocker on Now / When "See it" is pressed / Then that character's Build tab opens (a tab home).
- Given the "Behind for your Stage: Cards" Goal (`scrubbed-w2`) / When it renders / Then its "See it" opens the Cards System page.
- Given the Spend Plan, or the "next family unlock" Goal (`metapath`) / When it renders / Then it has no "See it" link.

**US-13 Never advice from a broken save, in any place.**
As a player, I want every place to refuse to guess when the save can't be read, so that I never act on a wrong status.
- Given a save that parses to an empty account / When the app renders / Then "Can't read your save right now" shows, and no navigation, tile, lane or status word exists in the DOM.
- Given an engine that throws as a whole / When the app renders / Then M10's "Can't work out advice" shows, with no navigation.
- Given M2's Stage is unknown (the "Can't tell where your account is on the route" banner) / When the hub renders / Then:
  - no tile is behind;
  - wasting still shows from blockers;
  - every unlocked, covered System without a blocker reads "Can't tell", not "Nothing to fix";
  - System pages follow FR-23's Stage-unknown rule.

## 5. Technical requirements

### TR-1 Package boundaries (and the file boundary for the build)
| Where | What | Phase |
|---|---|---|
| `apps/activeon/src/shell/` (new) | `Shell`: the navigation bar and rail, the place outlet, badges and the chip. `route.ts`: pure `parseRoute`/`formatRoute` (TR-3). `session.ts`: the session state lifted out of `NowScreen` (FR-10): follow state and its save handler, frozen order, `expanded`, the pending chip, the live region, the current tab, per-place scroll and the Character page's origin. | 1 |
| `apps/activeon/src/characters/` (new) | the Characters grid; the moved `BuildsOverview` and Cards overview mount here | 1 |
| `apps/activeon/src/systems/` (new) | `SystemsHub`, `SystemPage`, `pages.ts` (the component map for dedicated pages, keyed by the engine's `SYSTEM_HOMES`) | 1 |
| `apps/activeon/src/timeline/` (new) | `Timeline`, lanes and bars, lazy-loaded | 2 |
| `apps/activeon/src/now/NowScreen.tsx`, `follow.ts`, `character-tabs.ts`, `Focus.tsx`, `Roster.tsx`, `Account.tsx`, `App.tsx` | session state moves to the shell; `?c=` is retired and `tabHref` becomes `#<tab>-<i>`; the overviews move out; "See it" and the FR-32 links; the Suggestion `screen` mapping (TR-12) | 1 |
| `packages/engine/src/now/systems-view.ts`, `timeline-view.ts`, `system-homes.ts`, `view-words.ts`, `render-views-text.ts` (new) | pure `buildSystemsView`, `buildSystemPageView`, `buildTimelineView`, the data-only `SYSTEM_HOMES`, the view prose, `renderSystemsText` and `renderTimelineText`. All exported from `@idleon-forge/engine/now`, which still imports no Detector and nothing from `toolbox-parsers` (M10 TR-1) | 1 (systems), 2 (timeline) |
| `packages/engine/src/result.ts`, `core/module.ts`, `core/engine.ts` | the additive fields of TR-2 and their assembly; `Goal.urgency` copied from the module's rank hints | 1, 2 |
| `packages/engine/src/core/systems.ts` (new) | builds `EngineResult.systems` in the worker from the registry, `systemUnlocked`, `coveredSystems`, the unlock facts and the Checks that ran | 1 |
| `packages/engine/src/metapath/behind.ts` (M2) | emits every behind row after the FR-26 and FR-31 filters as `behindSystems` (today it returns only the weakest) | 1 |
| `packages/engine/src/afk/*` (M3), `unspent/index.ts` (M6) | emit `unknownFindings` (Phase 1) and `timeline` bars (Phase 2, TR-4) | 1, 2 |
| `packages/knowledge/systems.yaml`, `systems/systems.facts.yaml` (new), `src/schema.ts` | `kind`, `unlockFact`; the `systems.fact.unlocks` table (FR-34); the CI rule; the Phase 3 rows (FR-35) | 1, 3 |
| `packages/engine/src/golden.ts` | the `## Systems` and `## Timeline` sections (TR-10) | 1, 2 |

The M2, M3, M6 and M11 touch points are additive and listed here, so the M17 build PRs may make them. Each PR names them under "Cross-module changes" and adds a line to the owner spec's consistency section.

### TR-2 `EngineResult` additions (an M10 TR-2 amendment; all optional, and absent means "module not shipped")
```ts
export interface SystemSummary {
  /** Registry id (M11 SystemId), e.g. "alchemy-bubbles". */
  id: string;
  name: string;                       // registry `name`
  kind: 'game' | 'activeon';          // registry `kind` (FR-16)
  world: number;                      // registry `world`; 0 = across worlds
  scope: 'character' | 'account' | 'both';
  unlocked: 'yes' | 'no' | 'unknown'; // M11 systemUnlocked, worker side
  /** What decides `unlocked`: 'world' for worlds/reached rows, 'own' for a System-specific Detector, 'always'. */
  unlockBy: 'world' | 'own' | 'always';
  covered: boolean;                   // M11 coveredSystems
  /** The `systems.fact.unlocks` row (FR-34); null for always-open Systems. */
  unlock: { text: string; world: number; stale: boolean; sources: SourceRef[] } | null;
  /** The System's IdleOn Wiki page, from the unlock fact's Sources; https only (M10 TR-13). */
  wiki: string | null;
  /** The System's active authored Checks that ran this run (FR-23 Coverage). */
  checks: { entryId: string; title: string; fired: boolean }[];
}
export interface BehindSystem {
  systemId: string;                   // the fix entry's system (entry-id prefix), not the row's display name
  rowId: string;                      // StageExpectation id
  fixEntryId: string;
  /** NextAction keys of the fix findings, so skips and dismissals apply (FR-17). */
  findingKeys: string[];
  /** True for the one row M15 FR-27 chose for the Behind Goal this run. */
  chosen: boolean;
}
export interface UnknownFinding {
  entryId: string;
  subject: Subject;
  /** M11 UnknownReason; 'needs-history' is never emitted here. */
  reason: string;
}
export type TimelineKind = 'storage' | 'food' | 'time-cap' | 'production' | 'bank' | 'timer';
export interface TimelineBar {
  /** Unique per bar: `${key}#${slot}` when one entry fires more than once on a subject (anvil products). */
  barId: string;
  /** `${entryId}@${subject}`: the Next Action or cap pill key it belongs to (M10 TR-2); keys skips. */
  key: string;
  entryId: string;
  system: string;                     // registry id
  subject: Subject;
  kind: TimelineKind;                 // authored on the entry (values.timelineKind)
  /** The producer's own words ("anvil", "Arcade balls"): Fill.what or the entry's values.timelineWhat. */
  what: string;
  /** Epoch ms when it binds; null = a present-state problem (FR-26). */
  at: number | null;
  untimed: boolean;                   // FR-26 "can't tell when"; `at` is then null
  /** M3's role; 'pill' for a cap pill, 'info' for a passing Check's nextAt. Never recomputed. */
  effect: 'blocker' | 'next-action' | 'pill' | 'info';
  /** M3 FR-7 (c): would the fix hold through the return? false = plain bar, no Fix (FR-25). */
  fixHolds: boolean;
}
// On Goal (M10 TR-2), copied by the core from the module's RankHints:
urgency?: 'losing-now' | 'lost-before-return' | 'banked';
// On EngineResult:
systems?: SystemSummary[];            // registry order
behindSystems?: BehindSystem[];
unknownFindings?: UnknownFinding[];
timeline?: TimelineBar[];             // Phase 2
returnAt?: number;                    // M3 AfkSafetyResult.returnAt (M3 FR-4), Phase 2
```
- Producers contribute through `ModuleOutput.timeline?`, `ModuleOutput.behindSystems?` and `ModuleOutput.unknownFindings?`. The core concatenates them, drops anything whose subject names a character index not in `characters`, and sorts deterministically. Bars are sorted by subject (characters by index, then `account`), then `at` (nulls first), then `barId`.
- The core builds `systems` itself from the KnowledgePort (TR-1).
- Size: the additions stay under 30 KB as JSON for 11 characters, inside M10 TR-12's 200 KB cap. Each phase's PR measures this.

### TR-3 Routes
```ts
export type Route =
  | { place: 'now' }
  | { place: 'characters'; section: 'builds' | 'cards' | null }
  | { place: 'character'; index: number; tab: string }   // a registered character tab id
  | { place: 'systems' }
  | { place: 'system'; id: string }
  | { place: 'timeline' };
export function parseRoute(
  hash: string,
  search: string,
  known: { tabs: readonly string[]; systems: readonly string[]; indexes: readonly number[]; timeline: boolean },
): { route: Route; rewrite: string | null };
export function formatRoute(route: Route): string;   // '#now', '#build-3', '#system-refinery' …
```
- `parseRoute` is pure and total: any input gives a route (Now for anything unknown, FR-7). `rewrite` is the replacement fragment for a legacy `?c=`.
- Grammar:
  - `^#(now|characters|systems|timeline)$`;
  - `^#(builds|cards)$` (the overview sections);
  - `^#([a-z]+)-(\d+)$` (character tabs, as `parseTabHash` today);
  - `^#system-([a-z0-9-]+)$` (M11 SystemId).

  The forms can't collide: tab ids are lower-case letters only, and system anchors start with the literal `system-`. A test asserts that no registered tab id is `system` and that no element id in the app matches a place name.
- The shell is the only listener on `hashchange` and `popstate` (moved out of `NowScreen`), and the only writer of the fragment.

### TR-4 Timeline producers (Phase 2)
- **M3** emits:
  - a bar for every SafetyFinding with a non-null `at` (firing or not, with its `role` and `fixHolds`);
  - a bar for every passing Check with `nextAt` (the data M3 FR-11 already uses for `firstFill`);
  - a bar for every cap pill (`CapPill.at`, `effect: 'pill'`);
  - an `at: null` bar for every present-state blocker.

  A finding with `unknown (needs-history)` or from the untimed low-food Check gives `untimed: true`. M3 decides `effect` and `fixHolds`; M17 never re-derives the blocker rule.
- **M6** emits a `bank` bar for each by-urgency finding with a `deadline` (boss keys and Colosseum tickets: the moment the bank stops growing), and F1's `refinery.check.refine-full` time when its Detector reports one.
- **Kind and words are authored on the entry**, as flat `values` keys (the schema's `values` holds only numbers and strings, `schema.ts`): `timelineKind` (one of `TimelineKind`) and `timelineWhat`. They are reviewed in the producer's Knowledge Base PR like any entry text (M11 TR-19). The M17 Phase 2 PR adds a schema refinement that requires both on every entry that emits bars, and a lint for the `timelineKind` enum.
- **Which M3 Checks give a time at the pin** is a verify-before-build item (section 7). A Check that gives none shows as untimed until it does.

### TR-5 `buildSystemsView` and `buildSystemPageView`
`buildSystemsView(result: EngineResult, prefs: NowPrefs, ui: { now: number }): SystemsView` and `buildSystemPageView(result, prefs, nowView: NowView, ui: { now: number; id: string; highlight: string | null }): SystemPageView | null` are pure and deterministic (same input, byte-identical output). They live beside `buildNowView` and read `SYSTEM_HOMES` from the engine.
```ts
export type TileStatus = 'locked' | 'wasting' | 'behind' | 'cant-tell' | 'not-covered' | 'ok';
export interface Segment { text: string; origin: 'module' | 'fact' | 'name' | 'time' | 'view-word' | 'count' }
export interface TileView {
  id: string;
  name: string;
  status: TileStatus;
  statusWord: Segment;                // "Locked", "Wasting", "Behind", "Can't tell", "Not covered yet", "Nothing to fix"
  reason: Segment[];                  // FR-18, counts and view words only
  counts: { toDo: number | null; toFix: number; skipped: number; pillsFull: number };
  alsoBehind: boolean;                // a locked System with a behind row (FR-17)
}
export interface SystemsView {
  needsYou: { id: string; name: string; status: 'wasting' | 'behind' | 'locked' }[];
  groups: { world: number; heading: string; tiles: TileView[] }[];
  later: { label: string; tiles: TileView[] } | null;    // FR-20
  otherGaps: string[];                                    // FR-21, M10 notCovered items that aren't Systems
  wastingCount: number;                                   // the navigation badge (FR-5)
}
export interface SystemPageView {
  tile: TileView;
  goals: (GoalView & { who: string })[];                  // M10 GoalView, engine order (FR-23)
  pills: { subject: Subject; label: string; key: string }[];
  bars: TimelineBarView[];                                // Phase 2
  spendLines: { lineId: string; text: string }[];
  unlock: SystemSummary['unlock'];
  coverage: { covered: boolean; checks: { title: string; state: 'nothing-to-do' | 'see-above' }[] };
  tabHome: string | null;                                 // FR-23a
  wiki: string | null;
  highlight: string | null;                               // the NextAction.key to outline (FR-31)
}
```
Rules:
- Statuses follow FR-17's order.
- Skips and dismissals apply by `NextAction.key` through the same `NowPrefs` M10 uses.
- A Goal belongs to `goal.system`, except that the `metapath.goal.behind` Goal belongs to the `chosen` row's `systemId`. A Goal moved into the Behind Goal counts once, there.
- A cap pill's System is its key's entry-id prefix (`anvil.check.caps-before-return@c3` → `anvil`).
- Stage unknown (`result.stage.id === 'unknown'`): no behind, no "to do", and no non-blocker Goals or Spend Plan lines on pages (FR-23).
- Budget: each under 3 ms for 11 characters (`vitest bench`, TR-11).

### TR-6 `buildTimelineView` (Phase 2)
`buildTimelineView(result, prefs, nowView: NowView, ui: { now: number }): TimelineView` is pure. The caller passes the `NowView` it already built for Now, so Fix targets are found without building it again:
1. Lanes: character lanes follow `nowView.roster` (M10's display order, with the frozen order already applied). Account lanes are grouped by `bar.system`, in `systems` order.
2. Per bar:
   - `fullNow = at !== null && at <= now`;
   - `beforeReturn = fullNow || (at === null && !untimed) || (at !== null && at <= returnAt)`;
   - `state` (`open`, `skipped` or `dismissed`) comes from `NowPrefs` by `key`;
   - `outlined = beforeReturn && state === 'open' && (effect === 'blocker' || (effect === 'next-action' && fixHolds))`;
   - pills and bars whose fix doesn't hold are never outlined or hatched (FR-25).
3. The axis follows FR-29, from `now` and `result.returnAt`. Without `returnAt` (an engine without M3) there is no Timeline view, and the place says so (§6).
4. The Fix target follows FR-27. It is found in a key-to-location index built from `nowView`: `{ where: 'focus' | 'account' | 'pill'; subject; expand: 'show-more' | 'behind-details' | null }`.
5. `nextExpiry` is the earliest future `at`, so the caller re-renders when a bar turns full now (M10 TR-5's timer).
```ts
export interface TimelineBarView {
  barId: string;
  key: string;
  what: string;
  kindWord: string;
  at: number | null;
  untimed: boolean;
  fullNow: boolean;
  beforeReturn: boolean;
  outlined: boolean;
  hatched: boolean;
  effect: TimelineBar['effect'];
  state: 'open' | 'skipped' | 'dismissed';
  timeText: string;                   // "in about 3h · 01:20", "now", "can't tell when" (M10 format.ts)
  a11y: string;                       // US-10's sentence
  fix: { subject: Subject; key: string; where: 'focus' | 'account' | 'pill'; expand: 'show-more' | 'behind-details' | null } | null;
}
export interface TimelineView {
  axis: { start: number; end: number; returnAt: number; ticks: { at: number; label: string }[] };
  lanes: { id: Subject | `account:${string}`; heading: string; verdict: string | null; bars: TimelineBarView[]; untimed: TimelineBarView[] }[];
  empty: string | null;               // M10's "Nothing fills up before you're back" when nothing outlined
  nextExpiry: number | null;
}
```
Budget: under 3 ms for 11 characters, excluding `buildNowView` (budgeted by M10 TR-12).

### TR-7 `SYSTEM_HOMES`
- **The data table** lives in the engine, in `packages/engine/src/now/system-homes.ts`, so the golden harness can read it: `{ [systemId]: { tab?: string; page?: string; timeline?: true } }`. Phase 1 entries:
  - `talents`, `talent-presets` and `talent-resets`: `{ tab: 'build' }`;
  - `cards`: `{ tab: 'cards' }`;
  - from Phase 2, `afk`: `{ timeline: true }`.

  Hub membership comes from the registry's `kind`, not from this table.
- **The component map** (`apps/activeon/src/systems/pages.ts`) maps a `page` id to a React component. A later module adds its picture with one `page` entry in each file, in its own PR.
- **Tests** fail if `SYSTEM_HOMES` names a System that isn't in the registry, a tab that isn't registered, or a `page` with no component.

### TR-8 Registry and fact schema (an M11 TR-9 and TR-2b amendment)
- `SystemDef` gains:
  - `kind: 'game' | 'activeon'` (default `game`; `afk`, `metapath` and `spend` are `activeon`);
  - `unlockFact?: string`, the id of the row in `systems.fact.unlocks` or `metapath.fact.town-unlocks`.
- The new fact table `systems.fact.unlocks` (an authored tier-2 fact, M11 TR-2b) has rows `{ system, text, world, gameVersion, sources }`, with at least one tier 2–4 Source (#74). Its `isStale` follows M11 TR-11 like every fact.
- CI checks:
  - a game System that isn't `unlocked: always` has an `unlockFact` that resolves;
  - an `activeon` System has none;
  - `text` starts with "Opens" or "Needs" (TR-9).
- The worker reads the registry and facts through the KnowledgePort into `SystemSummary`.
- Adding a registry row changes `coverage()`, and so every golden's "Not covered yet" list. That is expected, and reviewed in the PR (M11 TR-15).

### TR-9 "No new advice", enforced
- **Scope:** the new views (Shell, Characters grid, Systems hub, System pages, Timeline). Now and the Character page's tabs keep M10's and their owners' rules.
- **Segments:** the view builders return text only as `Segment`s with an origin (TR-5): `module` (any field a module produced, such as `NextAction.text/why`, `Goal.title`, `GoalDetail.text`, `InfoLine.label`, `Fill.label/what`, `TimelineBar.what`, `SpendLine.text`, `SourceRef.label`, `BuildRoadmap.status`, the Cards overview lines, Walkthrough strings, Check titles in the Coverage list, which are rendered as titles under "checked", not as actions); `fact` (registry names, unlock facts); `name` (character name, class and level); `time` (`format.ts`); `count`; `view-word` (from `packages/engine/src/now/view-words.ts`, the only file allowed to hold view prose).
- **The test** renders the new views for every public and scrubbed fixture, collects every DOM text node, and asserts that each one equals a segment the builder returned, or is a label from `view-words.ts` used by the components (headings, "See it", "← back"). Shared M10 components inside a System page (the Next Action component) are exempt, because M10 owns them.
- **Lint:** `view-words.ts` and the unlock facts are checked against an advice lexicon: no leading imperative from the Next Action templates ("Equip", "Collect", "Claim", "Spend", "Buy", "Swap"…), and no "Tier", "rated", score or Stage label (P6).

### TR-10 Golden snapshots (an M11 TR-15 amendment)
- Each fixture's golden file gains a `## Systems` section (`renderSystemsText`): one line per tile, `<world> · <name> · <status> · <reason>`, then "Needs you" and the other gaps.
- From Phase 2 it also gains `## Timeline` (`renderTimelineText`): per lane `C<n> · <class> <level>`, then one line per bar, `<what> <kind word> · <time> · before/after · <effect> · fix <key or none>`.
- Characters are `C1…Cn`, as in `## Now`. Private fixtures go to the gitignored private golden folder only.
- A Knowledge Base PR that changes a status or a bar shows it in its golden diff.

### TR-11 Performance
- `parseRoute` runs in under 0.1 ms.
- A place switch renders in under 100 ms on the 11-character public save, in headless Chrome. There is no worker round trip (FR-10), and the Timeline chunk is prefetched when the browser is idle after the first result.
- `buildSystemsView`, `buildSystemPageView` and `buildTimelineView` each run in under 3 ms in Node for 11 characters. CI fails at 2×, as in M10 TR-12.
- The shell, hub and System page add at most **20 KB** gzipped to the main chunk. The Timeline is a separate chunk.
- The UI thread still imports nothing from `toolbox-parsers` or the Knowledge Base bundle (M10 TR-1's main-chunk check covers it).
- A badge count changing causes no layout shift (fixed-width numerals).

### TR-12 Security and privacy
- **The fragment** holds a place, a tab id, a character index or a System id, never a name. Browsers never send fragments to the server. Page titles never contain a name (FR-11).
- **Rendering:** all text is React text, with no `dangerouslySetInnerHTML`. Wiki and Source URLs render as links only when they are `https:` (M10 TR-13).
- **Suggestions and Report this:** the Suggestions Worker accepts exactly ADR 0008's context, and its validator rejects any unknown key or `screen` value (`workers/suggestions/src/validate.ts`). So M17 Phase 1 sends no new field, and maps the new places onto the existing enum:
  - Characters → `now`;
  - a Character page → `character`;
  - Systems and System pages → `account`;
  - Timeline → `now`.

  Adding `systems`, `system` and `timeline` screens, plus a System id (a game identifier), needs an ADR 0008 amendment and a Worker redeploy. That is a separate PR (D-14).

### TR-13 Accessibility and responsive
- **WCAG 2.2 AA.**
- **The navigation** is a `<nav aria-label="Places">` holding a list of links (not buttons and not a tablist, because they change the URL). Each item is at least 44 × 44 CSS px on the bottom bar and at least 24 × 24 elsewhere (2.5.8). `aria-current` follows FR-4. A "Skip to content" link comes before the navigation.
- **Headings:** one `<h1>` (the header wordmark), and an `<h2>` per place that receives keyboard focus on arrival (FR-11). The live region stays M10's single polite region, now owned by the shell.
- **Tiles** are links whose accessible name is "<System>, <status word>, <reason>". Status is glyph plus word plus colour (1.4.1). Badge and outline colours meet 3:1 (1.4.11).
- **Timeline bars** are CSS or SVG marked `aria-hidden="true"`, with no focusable element inside. Each lane is also a list of text items in time order (US-10's sentence), with real Fix and See it links. That list is what keyboard and screen-reader users navigate. The sideways-scrolling lane area has `tabindex="0"` and a label.
- **Motion:** `prefers-reduced-motion` turns off highlight pulses and the snap-scroll animation.
- **Widths:** the shell works from 320 CSS px, and at 400 % zoom of a 1280 px window, with no page-level horizontal scroll. Now and Character pages keep M10's 480 px column (980 px for the two-preset Build tab, #97). The hub and the Timeline may use up to 980 px at 1000 px and wider (D-6).

### TR-14 Tests
- **Unit:**
  - `parseRoute`/`formatRoute`: every row of FR-7, both legacy rewrites, the overview anchors, collisions and junk input;
  - `buildSystemsView` and `buildSystemPageView`: FR-17's order on hand-written view fixtures, skips and dismissals, Behind attribution, locked-and-behind, Spend Plan lines, Stage unknown, `parserBehind`;
  - `buildTimelineView`: the axis (including a return past 48 h), flags, outline rules per `effect` and `fixHolds`, Fix targets, skipped bars, untimed dedupe, determinism.
- **On the scrubbed and public fixtures in CI:** US-5 to US-9 and US-10's view-model assertions through the engine; US-5's blocker-implies-wasting invariant; the TR-9 provenance test.
- **Component tests** (Vitest, Testing Library, jsdom): US-2's routing, US-3's history order, US-4, US-11 to US-13; axe on every place and state.
- **Headless Chrome:** every layout criterion (US-1, US-3's scroll, US-5's greyscale, US-10's widths), and the width matrix at 320, 390, 480, 720 and 1280 px for no page-level horizontal scroll.
- **Private fixtures:** the private saves repeat the stories locally (`*.private.test.ts`), never committed with names or values.

## 6. States and edge cases

| State | What the shell and views show |
|---|---|
| Signed out, waiting, first parse, broken parse, engine throws | M10's screens, with no navigation (FR-12). A deep link stays in the URL and is honoured once the state turns `ok`. |
| Later saves parsing | The current place stays, with M10's "updating…". It re-renders when the result lands. |
| Stage unknown (M2 FR-3 banner) | Hub: no behind; wasting comes from blockers only; other unlocked covered Systems read "Can't tell"; System pages show blockers only (FR-23). Timeline: blockers' bars and markers still show, and bars of Goals M10 hides under this banner have no Fix link. |
| Some Detectors fail, or a section fails to parse | Their Systems read "Can't tell" unless locked or wasting (FR-17). Their bars are absent. The footer count stays M10's. |
| Account safety `unknown` (M3 FR-8) | The account lanes of the failed section show "Can't tell from the save", with no bars. |
| Game patched, parser behind | Every tile adds "· may be out of date" (FR-22); M10's banner shows in every place. |
| No AFK safety in the engine (no `returnAt`) | The Timeline place shows "The Timeline needs AFK safety, which isn't covered yet". |
| Nothing binds before the return | The Timeline shows every bar plain, with M10's "Nothing fills up before you're back", and no Fix links. |
| Save older than the Expected Return | A Timeline banner: "Your last save is 9h old: these times are projected from it." The bars are the producers' projections, and the view adds no correction. |
| Paste mode | Every place works on the pasted save, with no auto-follow (M10). The Timeline's "now" is the clock, and producers project from the save (M3 TR-7). |
| Offline or sync error | M10's banner in every place. Views keep the last good result. |
| Character added mid-session | A new Characters tile (save order) and a new last lane (M10 D6's append rule). |
| Character deleted (indexes shift) | A `#build-<i>` link to a missing index opens Now (FR-7). Bars and lanes for it drop. A bookmark only ever means "slot i of the signed-in account". |
| A System added to or removed from the registry by a new Knowledge Base | Its tile appears in its world group. A stale `#system-<id>` link to a removed System opens Now. |
| Account past World 4 | Groups up to W4, then "Worlds 5–7: not covered yet" (FR-20). |
| 11 characters, 50+ Systems | Hub tiles wrap in a grid, with no sideways scroll. The Timeline has 11 lanes plus account lanes on one axis. |
| Two tabs on different places | Each tab keeps its own route. Skips and dismissals sync through M10's `storage` events, so counts agree within 1 s. |
| Very long System names | An ellipsis inside the tile after two lines. The status word never truncates. |
| A return longer than the 48 h cap | The axis stretches to the return + 1 h (FR-29). |
| Clock skew (save in the future) | Ages clamp at 0. Bars use `at` from the producers, and the clock for "now" (M10 §6). |
| Map | Not present (D-1). |

## 7. Dependencies

| Module | M17 needs | Interface |
|---|---|---|
| **M10 Now screen** | `EngineResult`, `buildNowView`, `NowView`, `GoalView`, the Next Action component, `NowPrefs`, the frozen Visit Order, the follow rules (FR-14), the banners and states (TR-11), `format.ts`. M17 amends FR-1 (place widths), TR-5 (routing; `?c=` retired), TR-14 (fixed chrome that never covers content) and TR-2 (the new fields), moves the session state out of `NowScreen` into the shell, and moves the Builds and Cards overviews. | M10 TR-2, TR-3, TR-5, TR-8 |
| **M11 Knowledge tooling** | The System registry with `kind` and `unlockFact`, `systemUnlocked`, `coveredSystems`, the `systems.fact.unlocks` table (TR-8), and the golden sections (TR-10). | `systems.yaml`, `SystemDef`, fact tables, `coverage` |
| **M3 AFK Safety** | `returnAt`, findings with `at`, role and `fixHolds`, `nextAt` on passes, cap pills and present-state blockers, as `timeline` bars (TR-4); `unknownFindings`. | `AfkSafetyResult`, `ModuleOutput.timeline` |
| **M6 Unspent & idle** | Urgency on Goals (`Goal.urgency`), bank deadlines and F1's refine-full time as bars, and `unknownFindings`. | `RankHints.urgency`, `ModuleOutput.timeline` |
| **M2 / M15 F5** | Every behind row after the FR-26 and FR-31 filters, with its fix's finding keys and which row was chosen. | `ModuleOutput.behindSystems` |
| **M7 Spend Plan** | `SpendPlan.lines[].steps[].ref`, to place lines on System pages. | M7 TR-3 |
| **M8 Cards tab (#99), M9 Build tab (#97)** | Their tabs, overviews and status lines, unchanged. | `characterTabs`, `BuildRoadmap.status`, `NowView.cards` |
| **M13 Suggestions** | Nothing in Phase 1 (TR-12's mapping). Later: the `Screen` enum extension and a System id, with an ADR 0008 amendment. | `workers/suggestions/src/contract.ts`, `validate.ts` |
| **M16, M18–M21** | Each adds its System page picture or its Character page tab through `SYSTEM_HOMES` and `characterTabs`, and its registry rows. | TR-7 |
| **Design Lab** | The visual direction for the shell, tiles, status glyphs, the Timeline's bars and lanes, and the System page frame. | (private exploration) |

**Verify before build** (open facts, not product decisions):
- [ ] Which M3 Checks set `at` on a firing finding and `nextAt` on a pass at the pin (anvil, worship, traps, food, inventory, carry, Unending Energy, Arcade, liquids, refinery fuel). The rest ship as untimed bars (TR-4).
- [ ] Which M6 by-urgency Detectors set `deadline` and `urgency` (boss keys, Colosseum tickets, Post Office orders), and what the deadline means for each.
- [ ] The in-game unlock condition, world and wiki page for each game System in the registry, each page opened by the PR author (#74). Where the wiki and game data disagree, game data wins (ADR 0004).
- [ ] For FR-35's ten new rows: that each System still exists at game 2.3.540 (Dungeons and Random Events in particular), and which world it belongs to.
- [ ] The current size of `EngineResult` on the 11-character public save, before and after the new fields (M10 TR-12).

## 8. Owner review (self-ruled; the owner was asleep)

Each question was ruled with the recommendation below so the build can start. Each is also one line under "M17" in the batched review queue. The owner confirms or overturns them in the review release.

- **D-1 Which places, and Map.** Options: the atlas's five places, with Map disabled until built; four places; or tabs inside Now. ➡️ **Four places (Now, Characters, Systems, Timeline, with Timeline arriving in Phase 2), and no Map item until the Map is built.** *Why:* a disabled item fails the owner's own "findable home" test, because it's a dead end. The Map needs data models that M2, M4 and M14 don't export yet. Tabs inside Now would keep the single long screen the owner called too linear.
- **D-2 Routes.** Options: bare `#anchors`; `?c=` plus anchors (today); paths (`/systems/…`). ➡️ **Bare anchors only. `?c=` links are read once and rewritten, keeping their tab.** *Why:* it extends #97's anchor tabs to every place. A static Workers site needs no fallback routing for fragments. A fragment never reaches the server or its logs. One grammar is easier to test than two.
- **D-3 Where the Character page belongs.** Options: always Now (today's Focus); always Characters; the place it was opened from. ➡️ **The place it was opened from: Now for the Roster, Verdict strip, Next, auto-follow and deep links; Characters for the grid. "← back" returns there.** *Why:* during a Play Session the session coach stays the highlighted place, instead of flipping to Characters on every follow. Browsing from the grid still reads as Characters. The page is the same object either way, so nothing is duplicated.
- **D-4 Following the game outside Now.** Options: follow everywhere; follow only on Now and Character pages; never. ➡️ **Only on Now and on a Character page's Now tab, and first-load auto-open only on a Now route. Elsewhere, the "Now playing <name> · go" chip.** *Why:* M10 D1 is the session flow the owner chose. Pulling a player off a System page, the Timeline, or a Build tab mid-read is M10 FR-14's "never mid-interaction" harm on a larger scale.
- **D-5 Bottom bar, side rail and fixed chrome.** ➡️ **A bottom bar under 720 px wide and a side rail at 720 px and up. Below 480 px tall the bar sits in the flow under the header. The bar always reserves its own space.** *Why:* the side window beside the game is about 400 px wide (#8) and phones are 390, so both get a bar within thumb reach. 720 px fits a rail beside M10's 480 px column. Reserving space keeps M10 TR-14's real aim (nothing covers content, so a later pop-out works) while allowing the bar.
- **D-6 Column width per place.** ➡️ **Now and Character pages keep M10's 480 px column (980 px for the two-preset Build tab, as #97). The hub and the Timeline may widen to 980 px at 1000 px and up.** *Why:* a time axis and a tile grid read better wide, and #97 already set 980 px as the wide size. Now stays the narrow side-window coach.
- **D-7 Moving the Builds and Cards overviews off Now.** ➡️ **Yes, to Characters. The Roster keeps its per-row Build and Cards chips, plus one "Builds and cards → Characters" link.** *Why:* the overviews are for browsing, not session tasks. Moving them shortens Now (the owner's "too linear") without losing the one-tap entry from each row.
- **D-8 Skips, dismissals and pills on the hub.** ➡️ **A skipped or dismissed blocker never makes a System wasting, and the tile adds "· n skipped". Cap pills never make a System wasting or count toward a badge: they show as "· n full · collect".** *Why:* this is M10 D2's "Ready · n skipped" rule. And the owner ruled full anvils and worship "a little pill", not a warning (M3 R-PILL-1). Making them a red tile and a badge would undo that ruling.
- **D-9 "Behind" per System on the hub (amends M15's out-of-scope line, for the hub only).** M15 ruled that F5 names one System, never "a list of every lagging System" (M15 §2, red-team R7). Options: the hub marks only F5's chosen System; it marks every System with a behind row; it shows no behind at all. ➡️ **Every System with a behind row (M15 FR-26, with FR-31's safety filter and the player's skips) reads "Behind for your Stage" on its tile, as a plain word, with no Stage label, meter, score or ladder. Now keeps F5's single Goal.** *Why:* the owner now asks for the opposite of "too simplified". M15's worry was a Pinchy-style rating ladder (P6), and a status word without Stage labels or scores isn't one. The Goal list on Now is unchanged, so no noise is added there. **This is the ruling most likely to be overturned.** Overturning it means tiles read wasting, ok or locked, plus "behind" on F5's one chosen System. It is a one-line change in `buildSystemsView` (use only `chosen` rows).
- **D-10 Remember the last place across reloads.** ➡️ **No. A reload restores the URL's route only. A fresh open with no anchor is Now.** *Why:* Now is the session's front door (M10 D1). A player who closed the app on the Systems hub yesterday should open on "can I log off".
- **D-11 Hub order.** Options: ranked by need; by world in game order; alphabetical. ➡️ **World groups in registry (game) order, plus a "Needs you" strip of wasting tiles, then behind ones.** *Why:* a fixed grid builds spatial memory (Design Lab P8). Ordering Systems by urgency would be a second ranking beside `compareGoals` (M15 P5, M10 red-team #5).
- **D-12 Which Systems get tiles.** Options: only the registry; the atlas's ~100 Systems; the registry plus the atlas's medium- and high-impact gaps. ➡️ **The registry's game Systems (one source of truth with "Not covered yet"), grown in Phase 3 by ten W1–W3 Systems with no row today** (FR-35), each confirmed on its wiki page first. *Why:* a tile without a registry row could never be marked covered or locked consistently. The ten were chosen because the atlas rates them medium or high impact for a W2–W3 player, and they give honest "not covered yet" tiles where players are most often on their own.
- **D-13 How Systems open, as facts.** Options: prose in the registry; an authored fact table; wait for a generator. ➡️ **An authored tier-2 fact table, `systems.fact.unlocks`, patch-tagged and able to go Stale, reusing `metapath.fact.town-unlocks` where it already has the row. Condition form ("Opens at …"), never imperative. Tiles show only what their unlock Detector checks ("Opens in World 2").** *Why:* ADR 0007 says unlock levels are facts that rot when hand-copied. A fact table at least goes Stale visibly and has one home. Matching the tile to its Detector means a tile never promises a condition its locked state doesn't check.
- **D-14 Suggestion screens.** ➡️ **Phase 1 maps the new places onto the Worker's existing screens and sends nothing new. A later PR, with an ADR 0008 amendment and a Worker redeploy, adds `systems`, `system` and `timeline`, plus the System id.** *Why:* ADR 0008 fixes exactly what the Worker may receive, and its validator rejects unknown keys and screens today. Triage loses only the System id until then, and the Report payload already names the entry, which carries its System.
- **D-15 Generic System pages before the pictures.** Options: wait for each System's picture; ship generic pages now. ➡️ **Ship the generic page for every game System now. Pictures replace the body per System as M16 and M18–M21 ship.** *Why:* the owner's "findable home" problem is solved by the home, not the picture. The generic page already gathers a System's scattered Next Actions in one place.
- **D-16 Timeline axis.** ➡️ **From now to the later of now + 12 h and the return + 25 %, capped at now + 48 h, but always reaching the return + 1 h.** *Why:* short returns still show the next half day (what fills just after you're back). Long returns keep a little room past the marker. The cap keeps the bars readable, and the exception keeps the marker on the axis.
- **D-17 Lane order.** ➡️ **Characters in the Roster's frozen Visit Order, then account lanes by System in game order.** *Why:* lane numbers then match the Roster's, so "row 1" means the same character in both places all session (M10 D6). Characters uses save order instead because it is for browsing, not for the session.
- **D-18 The Timeline computes no time.** ➡️ **Only times a module supplied become bars. Untimed findings are listed as "can't tell when".** *Why:* ADR 0005 (Toolbox numbers, not our formulas) and M3's ownership of the blocker rule. A guessed bar would be new advice.
- **D-19 Order of the build.** ➡️ **M17 Phase 1 is the first build after release R5, before M16 and the M19 and M20 builds. Phase 2 (the Timeline) follows right after.** *Why:* every later System module needs a home for its picture. The hub is cheap, because it reads data that already exists. The atlas's own build order also puts the shell first and the Timeline second.

## 9. Red-team notes (author's own pass)

1. **Views quietly become a second advice engine.** A tile reason or a bar label starts saying "Collect your anvil". *Defence:* TR-9's segments, provenance test and lexicon lint. Only `view-words.ts` holds view prose. Bar words come from the entry (`timelineWhat`), reviewed with the entry.
2. **The hub disagrees with Now.** A System reads "Nothing to fix" while Now shows its blocker, or reads red while Now says "safe to log off". *Defence:* one `EngineResult` and one `NowPrefs`. US-5's invariant (a blocker on Now means wasting). Pills never make a System wasting (D-8). The not-covered set equals Now's list.
3. **"Behind" turns into a rating ladder.** *Defence:* D-9's plain word, with no Stage label and no meter. US-7 greps for Tier, rated, scores and Stage labels. Now still shows one Behind Goal.
4. **Auto-follow yanks the player.** *Defence:* FR-9 and D-4, plus US-4.
5. **Broken links after a patch or a deleted character.** *Defence:* `parseRoute` is total and falls back to Now (FR-7). TR-7 tests `SYSTEM_HOMES`.
6. **The bottom bar covers content in the side window.** *Defence:* FR-2's short-window rule, FR-3's reserved space, and US-1's bounding-box check.
7. **The Timeline shows a confident time the producer never computed.** *Defence:* D-18, the untimed list, and producers own `at` and `fixHolds`.
8. **Privacy through the URL, titles or Suggestions.** *Defence:* only indexes and ids in the fragment, titles without names, and no new Worker field (TR-12).
9. **Main-chunk bloat.** *Defence:* TR-11's 20 KB budget, the lazy Timeline, and the existing main-chunk Toolbox check.
10. **Locked next-world tiles read as targets.** *Defence:* FR-20 shows only the next world, with no to-do count, and unlock facts are in condition form (P2, D-13).

## 10. Red-team log

Independent red-team run on 2026-10-18 by a reviewer who had not seen the author's reasoning. Inputs: this spec, the glossary, the ADRs, sibling specs, the code at `0ee73e0` and the goldens. It found 32 issues: P0 1, P1 9, P2 15, P3 7. Each finding was checked against the cited code or document before a verdict. Final verdicts: 30 fixed, 2 fixed in part, 0 rejected, 0 deferred. D-9 remains the main owner question and is already in section 8.

| # | Sev | Finding | Verdict | How |
|---|---|---|---|---|
| RT-1 | P0 | System pages would show Goals and Spend Plan lines that M10 hides while the Stage is unknown. | Fixed | FR-23 Stage-unknown rule (blockers only, no Spend lines, no "to do"), TR-5 rule, US-8 and US-13 cases, §6 row. |
| RT-2 | P1 | "Wasting" from cap pills undid the owner's R-PILL-1 ruling (a full anvil is a pill, not a warning), so the hub disagreed with Now's "Ready". | Fixed | FR-17: pills never make a System wasting; FR-18 "· n full · collect"; FR-5 badge excludes pills; FR-25 pills drawn as pills; D-8; US-5 and US-10 rewritten. |
| RT-3 | P1 | Phase 1 couldn't pass its own stories: wasting depended on Phase 2 bars; the nav's Timeline item had no Phase 1 rule. | Fixed | Wasting now uses blockers plus `Goal.urgency` (Phase 1 data); pills come from `info[kind=cap]`; FR-1 ships three places in Phase 1; `afk` "See it" from Phase 2; US-10 and US-11 marked Phase 2. |
| RT-4 | P1 | The follow state, `expanded`, the frozen order, the chip and the live region live inside `NowScreen` and would die on a place switch. | Fixed | FR-10 lists the state lifted into the shell; TR-1 `shell/session.ts`; US-4 third case. |
| RT-5 | P1 | `values.timeline: { kind, what }` is invalid: entry `values` hold only numbers and strings. | Fixed | Flat keys `timelineKind`, `timelineWhat` plus a schema refinement (TR-4). |
| RT-6 | P1 | The golden harness can't import an app-side `SYSTEM_HOMES` holding React components. | Fixed | Split: data-only table in the engine, component map in the app (TR-7). |
| RT-7 | P1 | The "no new advice" test couldn't work (builder tags vs DOM text) and its allowed list missed strings the spec itself renders. | Fixed | TR-9 scoped to the new views, `Segment` with origin, DOM text nodes matched to segments, complete origin list, Coverage titles rendered as "checked". |
| RT-8 | P1 | Hand-authored unlock prose in the registry contradicts ADR 0007 and goes stale silently; `metapath.fact.town-unlocks` already holds some gates. | Fixed in part | Unlock conditions are now a patch-tagged fact table with Stale handling that reuses `metapath.fact.town-unlocks` (FR-34, TR-8, D-13). They stay authored, not generated, until Toolbox exposes them; that part is accepted, as in M2's precedent. |
| RT-9 | P1 | The registry CI rule can't be met by ActiveOn-only rows (`afk`, `metapath`, `spend`) or always-open rows; `spend` wasn't excluded from the hub. | Fixed | `kind: game | activeon` (FR-16, TR-8); always-open rows exempt; "Open from the start". |
| RT-10 | P1 | Sending a System id to the Suggestions Worker widens ADR 0008's fixed context; the Worker already rejects unknown keys and screens, so the "verify" was moot. | Fixed | Phase 1 sends nothing new and maps screens (TR-12); the enum and id need an ADR 0008 amendment later (D-14); verify item removed. |
| RT-11 | P2 | "Nothing to fix" while a parser section failed or Checks returned `unknown` without throwing. | Fixed | `unknownFindings` (TR-2) feed "Can't tell" (FR-17); `unlocked: unknown` reads "Can't tell"; US-9. |
| RT-12 | P2 | D-9 overrides M15; no skip handling for behind; US-7 ran only on a private save although `scrubbed-w2` has the same rows. | Fixed | Skips and dismissals apply to behind (`findingKeys`, FR-17); US-7 on `scrubbed-w2`; D-9 kept as the flagged owner question, with its one-line reversal. |
| RT-13 | P2 | A locked System that is also behind (the Post Office on W3-early) would disagree with Now. | Fixed | FR-17 "locked · behind for your Stage", listed in "Needs you"; US-6 case. |
| RT-14 | P2 | The `?c=` rewrite dropped the tab of #97's `?c=<i>#build-<i>` links; `#builds` and `#cards` would open Now after the overviews moved. | Fixed | FR-7 both rewrites and the overview anchors; TR-3 grammar; US-2 cases. |
| RT-15 | P2 | First-load auto-open could overwrite a deep link; auto-follow would pull a player off a Build tab; the nav would flip to Characters on every follow. | Fixed | FR-9 auto-open only on a Now route and follow only on Now or a Now tab; FR-4 and D-3 mark the place the page was opened from. |
| RT-16 | P2 | "See it" rules contradicted each other (`afk` vs `metapath`, "has a home" vs the generic page); the Behind Goal got no link. | Fixed | FR-23a defines a home; FR-31 lists who gets a link; Behind links to its chosen System; US-12 cases. |
| RT-17 | P2 | The Timeline builder couldn't find Fix targets from its signature, and its budget hid a `buildNowView` call. | Fixed | `nowView` passed in, key-to-location index (TR-6); budget excludes `buildNowView`. |
| RT-18 | P2 | The fallback `returnAt = asOf + usedSeconds` was anchored on the save time and mixed seconds and milliseconds. | Fixed | Fallback removed; no Timeline without `returnAt` (TR-6, §6). |
| RT-19 | P2 | Caps whose fix doesn't hold got "before you're back", hatching and a Fix link, against M3 FR-7 (c) and FR-11. | Fixed | `fixHolds` on `TimelineBar`; plain bar, no Fix, no hatching (FR-25, TR-6); US-10 W2 anvil case. |
| RT-20 | P2 | Bar keys weren't unique (anvil products, two big-bubble findings on one character). | Fixed | `barId` for identity, `key` for prefs; sort defined (TR-2). |
| RT-21 | P2 | The hub dropped M10's non-System gaps and showed late-world accounts nothing past W4. | Fixed | "Not covered yet: other gaps" group (FR-21) and "Worlds 5–7" (FR-20); US-9. |
| RT-22 | P2 | A precise unlock text could disagree with a world-level unlock Detector. | Fixed | Tiles show the Detector's precision; precise text on the page under "How it opens" (FR-19, `unlockBy`). |
| RT-23 | P2 | On patch day the hub stayed confidently "ok". | Fixed | FR-22 "may be out of date" while `parserBehind`; US-9; §6. |
| RT-24 | P2 | Layout criteria were assigned to jsdom, which has no layout. | Fixed | Layout criteria marked headless Chrome (US-1, US-3, US-5, US-10; TR-14). |
| RT-25 | P2 | Core inputs (the atlas, the Design Lab brief) are private and unverifiable from the repo. | Fixed in part | Header states the atlas is private, and that facts taken from it are restated or listed under verify-before-build; FR-35's rows are verified on the wiki before they land. Committing the atlas itself is left out (it is a private exploration whose content isn't scrubbed for the public repo). |
| RT-26 | P3 | Two `<h1>`s; Focus `<h2>` vs FR-11; `aria-current` on a parent; focusable links inside hidden bars; safe-area inset. | Fixed | FR-11 and TR-13 heading rules, FR-4 `aria-current="true"`, TR-13 bars with no focusable child and a focusable scroll area, FR-2 safe area. |
| RT-27 | P3 | A return past the 48 h cap had no marker position; Arcade cap wording; first Timeline switch could miss the budget. | Fixed | FR-29 and D-16 axis exception; Arcade wording removed; TR-11 prefetch. |
| RT-28 | P3 | Ambiguous "to do" rule; "capped or idle" wrong for presets; "three fields" listed four; "nothing new leaves" vs a System id; full-now screen-reader sentence. | Fixed | FR-18 rewritten; reason "to fix before you leave"; scope bullet; TR-12; US-10 sentence. |
| RT-29 | P3 | Stale metadata: golden hash, #99 merged, empty section 10, README ADR range, "tab per character". | Fixed | Golden hash, #99, section 10, FR-10's single tab, and the README's ADR range (now 0001–0009). |
| RT-30 | P3 | Save order for Characters vs Visit Order for lanes; boss keys on a character lane; "Account-wide" heading over per-character Systems. | Fixed | D-17's why explains the two orders; FR-28 says a finding's subject picks its lane; heading renamed "Across worlds". |
| RT-31 | P3 | No home for Active Play and Higher-leverage lines; Account section under a Character page unstated; locked System's own Goal count; duplicate untimed food. | Fixed | Out-of-scope line for those lines (no System); FR-15 keeps Now's sections under the page; FR-19 "· 1 to do"; FR-26 dedupe. |
| RT-32 | P3 | Page titles could carry a character name; US-7's grep would hit the header's Stage label; "shared bookmark" wording. | Fixed | Titles never carry a name (FR-11); US-7 limited to the content area; a bookmark means "slot i of the signed-in account" (§6). |

## Sources

- System Atlas, ActiveOn Design Lab research (private, 2026-10-18): the view architecture (five places, "Next Actions stay the product"), the AFK Timeline concept, the build order (shell, then Timeline), the master index and its coverage counts.
- Design Lab brief (private, 2026-10-18): principles P6 (time is one language), P8 (stable places; colour plus glyph plus word) and P9 (hard caps, one winner); section 3.3 (Command Board: the AFK Timeline as a lane board, the phone guardrail); section 4 (the AFK Timeline concept).
- Code on `main` `0ee73e0` (read 2026-10-18): `apps/activeon/src/now/character-tabs.ts`, `NowScreen.tsx`, `follow.ts`, `Roster.tsx`, `BuildView.tsx`, `App.tsx`; `packages/engine/src/result.ts`, `core/module.ts`, `afk/types.ts`, `metapath/behind.ts`; `packages/engine/test/metapath/behind.test.ts`; `packages/knowledge/systems.yaml`, `systems/metapath.facts.yaml`, `src/coverage.ts`, `src/schema.ts`; `workers/suggestions/src/contract.ts`, `validate.ts`.
- Goldens `packages/knowledge/golden/scrubbed-w2.md` and `scrubbed-w3.md` (knowledge `e96480ed`, game 2.3.540), read 2026-10-18.
- PRs [#97](https://github.com/YassSoliman/idleon-forge/pull/97) (Build view, tab registry) and [#99](https://github.com/YassSoliman/idleon-forge/pull/99) (Cards tab), read 2026-10-18.
- Specs M3 (FR-4, FR-7, FR-11, R-PILL-1), M10 (FR-1, FR-14, FR-26, TR-2, TR-5, TR-14, D1, D6), M11 (TR-2b, TR-9, TR-15), M13 (TR-3), M15 (F5, P1–P7).
