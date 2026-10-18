// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 FR-9 to FR-11 (docs/specs/M20-skills-parallel-slots.md D-4): the few reset items that become Now
// output. A Random Event live now or within 20 minutes and Killroy skulls about to be wiped while away
// are Goals (position 1 by urgency); Killroy's rooms and the Weekly Battle are "If you have time"; the
// rest are checklist rows only. Also M20's two Timeline bars (TR-6.3). Pure.
import type { AccountState } from '@idleon-forge/account-state';
import type { ModuleGoal } from '../core/module';
import type { MetaPathResult } from '../metapath/types';
import { aboutDuration } from '../now/format';
import type { ActivePlay, TimelineBar } from '../result';
import { ENTRY, goalOf, type M20Knowledge, numberValue, say, sourcesOf, who } from '../slots/kb';
import { accountWeekEnd, accountWeeksSinceSave, resetsSinceSave, serverWeekOf } from './clocks';
import { killroyRoomDone, killroyRunner } from './rows';

export interface ResetOutput {
  goals: ModuleGoal[];
  activePlay: ActivePlay[];
  timeline: TimelineBar[];
}

const human = (s: string) => s.replace(/_/g, ' ');

export function buildResetGoals(
  state: AccountState,
  kb: M20Knowledge,
  meta: MetaPathResult | null,
  now: number,
  expectedReturnMs: number,
): ResetOutput {
  const out: ResetOutput = { goals: [], activePlay: [], timeline: [] };
  const a = state.account;
  const world = a.currentWorld ?? 0;
  const rolled = (resetsSinceSave(state, now) ?? 0) >= 1;
  const timelineWords = (id: string) => {
    const v = kb.entries[id]?.values;
    return typeof v?.timelineKind === 'string' && typeof v.timelineWhat === 'string'
      ? { kind: v.timelineKind as TimelineBar['kind'], what: v.timelineWhat }
      : null;
  };

  // ---- the Random Event (FR-9, US-10) ----
  const re = a.randomEvents;
  if (re && (!re.doneToday || rolled)) {
    const reachable = re.schedule.filter((e) => e.world >= 1 && e.world <= Math.max(1, world));
    const live = reachable.find((e) => e.at <= now && now < e.at + 3_600_000);
    const soonMs = numberValue(kb, ENTRY.randomEvent, 'soonMinutes', 20) * 60_000;
    const soon = live ? null : reachable.find((e) => e.at > now && e.at - now <= soonMs);
    const ev = live ?? soon;
    const key = `${ENTRY.randomEvent}@account`;
    if (ev) {
      const text = live
        ? say(kb, ENTRY.randomEvent, 'live', { map: human(ev.map), event: human(ev.event) })
        : say(kb, ENTRY.randomEvent, 'soon', {
            map: human(ev.map),
            event: human(ev.event),
            eta: aboutDuration((ev.at - now) / 1000),
          });
      const goal = goalOf(
        kb,
        ENTRY.randomEvent,
        key,
        text,
        say(kb, ENTRY.randomEvent, 'why'),
        [],
        ['account.randomEvents'],
      );
      if (goal)
        out.goals.push({
          goal,
          rank: {
            urgency: 'lost-before-return',
            deadline: ev.at + 3_600_000,
            framePosition: 1,
            cost: { unit: 'hours', amount: 180 / 3600 },
          },
        });
    }
    const next = live ?? reachable.find((e) => e.at > now);
    const words = timelineWords(ENTRY.randomEvent);
    if (next && words)
      out.timeline.push({
        barId: key,
        key,
        entryId: ENTRY.randomEvent,
        system: 'random-events',
        subject: 'account',
        ...words,
        at: next.at,
        untimed: false,
        effect: 'info',
        fixHolds: true,
      });
  }

  // ---- Killroy (FR-10, FR-11) ----
  const k = a.killroy;
  const weeks = accountWeeksSinceSave(state, now);
  const weekEnd = accountWeekEnd(state, now);
  if (k && world >= 2 && weeks !== null) {
    const classes = weeks === 0 ? k.roomClasses[0] : weeks === 1 ? k.roomClasses[1] : null;
    for (let r = 1; r <= k.roomsOpen; r++) {
      if (weeks === 0 && killroyRoomDone(k.doneCode, r)) continue;
      const cls = classes?.[r - 1];
      if (!cls) continue;
      const runner = killroyRunner(state, kb, meta, cls);
      if (!runner) continue;
      out.activePlay.push({
        key: `${ENTRY.killroyRoom}@room-${r}`,
        text: say(kb, ENTRY.killroyRoom, 'line', { class: cls, who: who(runner) }),
        estimateSeconds: 120,
        subject: 'account',
        sources: sourcesOf(kb, ENTRY.killroyRoom),
      });
    }
    if (weeks === 0 && k.skulls > 0 && weekEnd !== null) {
      const key = `${ENTRY.killroySkulls}@account`;
      const left = Math.max(0, 50 - k.arcadePacksBought);
      if (weekEnd < now + expectedReturnMs) {
        const text = say(kb, ENTRY.killroySkulls, left > 0 ? 'line' : 'line-no-packs', { n: k.skulls });
        const details =
          left > 0
            ? [{ subject: 'account' as const, text: say(kb, ENTRY.killroySkulls, 'packs', { left }) }]
            : [];
        const goal = goalOf(
          kb,
          ENTRY.killroySkulls,
          key,
          text,
          say(kb, ENTRY.killroySkulls, 'why'),
          details,
          ['account.killroy', 'account.resets'],
        );
        if (goal)
          out.goals.push({
            goal,
            rank: {
              urgency: 'lost-before-return',
              deadline: weekEnd,
              framePosition: 1,
              cost: { unit: 'hours', amount: 90 / 3600 },
            },
          });
      }
      const words = timelineWords(ENTRY.killroySkulls);
      if (words)
        out.timeline.push({
          barId: key,
          key,
          entryId: ENTRY.killroySkulls,
          system: 'killroy',
          subject: 'account',
          ...words,
          at: weekEnd,
          untimed: false,
          effect: 'next-action',
          fixHolds: true,
        });
    }
  }

  // ---- the Weekly Battle (FR-9, FR-16, D-19) ----
  const wb = a.weeklyBattle;
  const savedWeek = a.resets?.serverWeekOfSave ?? null;
  if (wb && world >= 2 && savedWeek !== null) {
    const best = savedWeek === serverWeekOf(now) ? wb.bestDifficulty : 0;
    if (best < 1)
      out.activePlay.push({
        key: `${ENTRY.weeklyBattle}@account`,
        text: say(kb, ENTRY.weeklyBattle, 'line'),
        estimateSeconds: 60 * Math.max(1, state.characters.length),
        subject: 'account',
        sources: sourcesOf(kb, ENTRY.weeklyBattle),
      });
  }
  return out;
}
