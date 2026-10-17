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
The end state of a Play Session: every character assigned to its best activity (map, skill, production) for the coming AFK Stretch, and stocked resources spent.
_Avoid_: loadout, AFK config

**Meta Path**:
The single reference route through the game (class choices, character order, per-world milestones) that the community currently considers most efficient; all advice measures progress against it.
_Avoid_: build guide, playstyle, meta (bare)

## Advice

**Knowledge Base**:
The curated, versioned body of game facts, build orders and priorities that all advice derives from; every entry cites a Source.
_Avoid_: database, wiki, rules (as a whole)

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
ActiveOn's single working view during a Play Session: one row per character plus an Account section.
_Avoid_: dashboard, home, feed

**Verdict**:
A character's AFK-safety state, one of Ready, Fix before you leave, or Unknown; it judges only whether the character can be left for the AFK Stretch, never what is left to spend.
_Avoid_: status, health, score

**Expected Return**:
How long the player expects to be away, used to judge what will fill up or run out before the next Play Session.
_Avoid_: AFK timer, session length

**Visit Order**:
The suggested order to switch through characters in a Play Session: worst Verdict first, then most to spend.
_Avoid_: route, queue

**Active Play suggestion**:
An optional Goal that needs hands-on play (often an hour or more); it never affects a Verdict.
_Avoid_: active goal, grind task

**Stale**:
Said of a Knowledge Base entry verified on a patch older than the current one; still shown, ranked below fresh entries.
_Avoid_: outdated, expired
