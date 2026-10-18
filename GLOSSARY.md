# IdleOn Forge

An open-source family of read-only companion tools ("mods") for Legends of IdleOn. ActiveOn, the active-play coach, is the first.

## The Forge

**Forge**:
The umbrella project and repository holding every IdleOn companion tool and their shared parts.
_Avoid_: platform, suite

**Mod**:
One standalone tool in the Forge, read-only toward the game, never touching the client or the save.
_Avoid_: plugin, addon, cheat

**ActiveOn**:
The Mod that coaches a player through a Play Session, telling them what to do next and why.
_Avoid_: companion, assistant (as a proper name)

## Playing

**Play Session**:
A stretch where the player is actively at the game, as opposed to AFK; usually 15–30 minutes, sometimes hours of active play.
_Avoid_: login, run

**AFK Stretch**:
The hours between Play Sessions when characters progress unattended on whatever they were last set up to do.
_Avoid_: idle time, offline

**AFK Setup**:
The end state of a Play Session: every character on its best AFK Target and every Parallel Slot filled, with stocked resources spent.
_Avoid_: loadout, AFK config

**AFK Target**:
The one activity a character progresses while away, one of the game's AFK types (Fighting, Mining, Choppin, Fishing, Catching, Cooking, Lab, Divinity, Spelunking).
_Avoid_: AFK activity, job

**Parallel Slot**:
A per-character assignment that runs alongside the AFK Target (traps, a cog-board seat, worship charge, an alchemy cauldron); empty ones are lost value.
_Avoid_: side job, secondary AFK

**Stage**:
An account-level label (e.g. W2-mid) derived from the Account State using Meta Path milestones; Priority Lists are keyed by Stage, and per-character differences come from class and level filters instead.
_Avoid_: progress level, tier, phase

**Family level**:
The sum of every character's class level; it opens character slots and family obol slots.
_Avoid_: account level, total level

**Stage Expectation**:
A Meta Path row saying which fix of ours should no longer be firing by a given Stage (e.g. every card slot filled by W1-mid); the earliest unmet one from a Stage before the current one becomes the "Behind for your Stage" Goal.
_Avoid_: tier, rating, grade, placement

**Role**:
The job the Meta Path assigns a class (e.g. Squire = Construction carry, Wizard = Worship), used to judge Purpose and better-fit suggestions.
_Avoid_: archetype, specialization

**Meta Path**:
The single reference route through the game (class choices, character order, per-world milestones) that the community currently considers most efficient; all advice measures progress against it.
_Avoid_: build guide, playstyle, meta (bare)

## Advice

**Knowledge Base**:
The curated, versioned body of game facts, build orders and priorities that all advice derives from; every entry cites a Source.
_Avoid_: database, wiki, rules (as a whole)

**System**:
One distinct game mechanic with its own state and rewards (e.g. Stamps, Alchemy Bubbles, Card presets, the Owl minigame); the unit the Knowledge Base is organised by.
_Avoid_: feature, mechanic, module

**System Dossier**:
The cited, deep research write-up of one System in the standard format, from which its Knowledge Base entries are built.
_Avoid_: guide, wiki page, notes

**Source**:
The cited origin of a Knowledge Base entry (game data, wiki page, community guide), with the date it was last verified.
_Avoid_: reference, link

**Account State**:
A normalized snapshot of one player's whole account (all characters and account-wide systems) at the moment of a cloud save.
_Avoid_: save, profile, data

**Next Action**:
One concrete, cited instruction the player can carry out in the game right now, with a one-line why.
_Avoid_: tip, suggestion, recommendation

**Goal**:
A milestone on the Meta Path that takes more than one Next Action to reach, from minutes to several Play Sessions; it always shows exactly one Next Action, the one that moves it forward.
_Avoid_: quest (in-game quests are a different thing), task, project

## The Now screen

**Now screen**:
ActiveOn's working view during a Play Session, and the place it opens on: one row per character plus an Account section.
_Avoid_: dashboard, home, feed

**Verdict**:
A character's state for the coming AFK Stretch, one of Ready (safe to leave and serving a worthwhile Purpose), Fix before you leave, or Unknown (no Purpose found, the data can't tell, or the activity isn't covered yet).
_Avoid_: status, health, score

**Purpose**:
The set of Goals a character's current activity is advancing, each with its next Milestone; always derived from the Account State, never typed in by the player.
_Avoid_: intent, job, role

**Milestone**:
A threshold within a Goal (e.g. 10k, then 100k kills of one monster) at which its reward steps up; the point where ActiveOn may suggest stopping and moving on.
_Avoid_: tier, checkpoint

**Leverage**:
How much a Goal is worth pursuing now, ranked from Sources and the Meta Path; a Higher-leverage option is a different activity or character that advances more, or more valuable, Goals.
_Avoid_: value, efficiency, ROI

**Expected Return**:
How long the player expects to be away, used to judge what will fill up or run out before the next Play Session.
_Avoid_: AFK timer, session length

**Visit Order**:
The suggested order to switch through characters in a Play Session: worst Verdict first, then most to spend.
_Avoid_: route, queue

**Active Play suggestion**:
An optional Goal that needs hands-on play (often an hour or more); it never affects a Verdict.
_Avoid_: active goal, grind task

**Spend Plan**:
The ordered list of purchases that stocked currency should go to right now (Upgrade Vault, stamps, other coin sinks), with each cost checked against what the account has.
_Avoid_: shopping list, budget

**Stale**:
Said of a Knowledge Base entry verified on a patch older than the current one; still shown, ranked below fresh entries.
_Avoid_: outdated, expired

**Roster**:
The Now screen's list view: one numbered row per character in Visit Order, each with its Verdict and one summary line.
_Avoid_: character list, overview

**Focus**:
The Now tab of a Character page: Verdict, Purpose, up to three Goals and "Next: switch to …". Keyboard focus is always written out as "keyboard focus".
_Avoid_: detail view

**Verdict strip**:
The row of labelled links at the top of Focus, one per character in Visit Order, for jumping between characters.
_Avoid_: dots, tabs

**Account section**:
The part of the Now screen for account-wide Goals any character can do: stockpile blockers first, then Goals, the Spend Plan and "Not covered yet".
_Avoid_: global tasks, shared list

## Views

**Character page**:
One character's page, with tabs (Now, which is its Focus, then Build, Cards and later ones); reached from the Roster, the Characters grid, the Timeline or a link.
_Avoid_: profile, character sheet, detail view

**Systems hub**:
The place listing every game System as a tile, grouped by world, each marked wasting, behind, ok or locked (or honestly "not covered yet" or "can't tell"), with how a locked one opens.
_Avoid_: dashboard, overview, catalogue

**System page**:
The page for one System: its status, every Next Action for it across characters and the account, its Timeline bars, how it opens and what ActiveOn does and doesn't check there; it adds no advice of its own.
_Avoid_: system view, guide page, wiki page

**Timeline**:
The place showing, for each character and each account System, when each limit binds (a bag fills, food runs out, a cap is reached) against the Expected Return, with anything that binds before the return marked and linked to its fix.
_Avoid_: schedule, Gantt, AFK timer

## Walkthroughs

**Walkthrough**:
The ordered steps that take one Goal from where the account is now to done (what to farm, buy, craft and hand in, by whom, where), with progress on each step.
_Avoid_: guide, step plan, quest log

**Requirement Tree**:
Everything a Goal's target needs, broken down from the target to raw materials and gates (an anvil tab, a skill level, a quest accepted), with quantities multiplied down each branch.
_Avoid_: recipe tree, dependency graph, crafting tree

**Demand**:
What every shown Walkthrough still needs, item by item, after subtracting what the account holds, with holdings given to the higher-ranked Goal first.
_Avoid_: shopping list, needs, shortfall (bare)

**Supply**:
One way to get an item for a Walkthrough (a monster drop on a map, a skilling node, anvil production, a shop, the 3D Printer), with its place and, where the numbers allow, how long it takes for each character.
_Avoid_: source (that is a citation), route, farm spot

**Bottleneck**:
The part of a Walkthrough expected to take longest, which starts first, even before the steps that come earlier in the tree.
_Avoid_: long pole, blocker (that is a Verdict term), critical path

**Parallel Slot Plan**:
What each character's Parallel Slot should be doing to feed the Demand (first the 3D Printer: which sample to print, take or keep), and when to change it.
_Avoid_: slot plan (bare; that is the Meta Path's character slots), printer schedule, rotation

## Knowledge Base entries

**Entry**:
One versioned, cited unit of the Knowledge Base, of one of the types below.
_Avoid_: rule (bare), record, row

**Contribution**:
An entry linking an activity (an AFK Target or Parallel Slot) to a Goal it advances; Purpose is derived from Contributions.
_Avoid_: link, mapping

**Check**:
An entry that detects a problem or opportunity in the Account State and turns it into a Verdict blocker or a Next Action.
_Avoid_: alert, rule, trigger

**Detector**:
The small, tested piece of code a Check or Contribution points to that reads the Account State; the entry around it holds all the human-facing words, numbers and Sources.
_Avoid_: rule function, handler

**Priority List**:
An ordered, Source-backed list for one stage (ties allowed), used to rank Goals, the Spend Plan and Leverage; a System may also keep its own ordering list (merit rows, gem buys). Never numeric weights.
_Avoid_: tier list, weights, score

**Build**:
An entry giving the talent order for one class line and one preset role (fighting or skilling).
_Avoid_: spec, loadout

**Acquisition**:
An entry describing how to obtain something (a stamp, card, obol, item) and what it needs.
_Avoid_: unlock guide, how-to

**Contested**:
The status of an entry whose Sources disagree; shown with both sides and a "sources disagree" badge, never as a Verdict blocker or the top action.
_Avoid_: disputed, uncertain

## Feedback

**Suggestion**:
A player's in-app request (Idea, Something's wrong, or Confusing) written as When I'm… / I want… / So that…, filed as a GitHub issue and turned into a user story, a spec change, a Knowledge Base entry, or a wontfix.
_Avoid_: feedback, ticket, feature request
