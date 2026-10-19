# M24: UX rework, every view

Status: building (umbrella PR). Owner review on the PR Preview before production.

## Why

The owner rated the shipped UX 4/10: every screen shows everything it knows, at the same weight, as sentences. M21 fixed the look; M24 fixes what goes where. Full-page captures of every view (1440 and 390 px) were audited, redesigned as full pages on a private design canvas, red-teamed, and QA'd before this build.

## The rules every view follows

1. **The answer sits in the first screen.** One framed block per page (`.a-frame`): what to do, how long, where.
2. **Pictures before sentences.** Talent book grids, a paper doll, card slots, meters, timers, our own pixel sprites (ADR 0009).
3. **Show the next three, not everything.** Lists stop at what matters now; the rest opens on demand. Tabs switch content.
4. **Say it once.** Save freshness lives in the top bar; Sources go in one quiet line per page.
5. **One way to move.** A character strip replaces prev, dots, arrows and "switch to" bars.
6. **Four type sizes, an 8-px rhythm.** 40 / 28 / 22 pixel display; 16 body, 14 secondary, 12 caps label.
7. **Colour means one thing.** Coral: losing value now. Gold: do it. Mint: done or fine. Blue: a timer. Grey: later.
8. **The footer is one line.** Paste and sign-in live in the menu and the first-run screen.

## Scope

- Every place (Now with its pause points, Characters, a character's six tabs, Systems and every System page, Timeline with its three tabs, Map with its four tabs), the Spend Plan, the Goals list, What's new, Suggestions, the menu, first run, loading, error and empty states, light and dark themes, phone and desktop.
- The whole build order on Build: every step to the end of the build, the line where the current points run out (points gained in game since the save keep reading down the list).
- Vials: every locked vial whose item the account holds anywhere (FR-11 without the top-three cap), and the vials still missing their item.
- World 4 (Laboratory, Cooking, Breeding): read-only System pages from the save. New advice Detectors for World 4 need their own spec and red team; they are out of scope here.
- A sprite kit of original pixel art (`apps/activeon/src/art/sprites/`).

## Not changing

Engine rules, Knowledge Base judgement and the advice itself, except where a view needs a field the engine already computes (whole build order, vial holdings). Read-only toward the game, client-only, the CSP.

## File ownership (area PRs into `feat/M24-ux`)

Filled in when the area PRs open; one owner per file, as in M21.
