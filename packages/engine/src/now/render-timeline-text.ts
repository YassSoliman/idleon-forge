// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-14: the `## Timeline` golden renderer, owned by area T.
import type { TimelineBarView, TimelineView } from './view';
import { TIMELINE_WORDS } from './words/time';

/**
 * M17 TR-10: the golden snapshots' `## Timeline` section. The axis, then per lane `C<n> · <class>
 * <level>` (or `Account · <System>`), then one line per bar:
 * `<label> · <time> · before/after · <effect> · fix <key or none>`, untimed bars last.
 */
export function renderTimelineText(
  view: TimelineView | null,
  opts: { label: (index: number) => string; classOf: (index: number) => string },
): string {
  if (!view) return '(no AFK safety)';
  const hours = (ms: number) => `${Math.round(ms / 360_000) / 10}h`;
  const out: string[] = [
    `Axis: now to +${hours(view.axis.end - view.axis.start)} · ${view.axis.backLabel}`,
    ...(view.stale ? [`Stale: ${view.stale.text}`] : []),
    ...(view.empty ? [view.empty] : []),
  ];
  const bar = (b: TimelineBarView) =>
    `- ${b.label} · ${b.timeText} · ${b.untimed ? 'untimed' : b.beforeReturn ? 'before' : 'after'} · ${b.effect}${
      b.outlined ? ' · outlined' : ''
    } · fix ${b.fix && b.fix.where !== 'pill' ? `${b.fix.key}${b.fix.expand ? ` (${b.fix.expand})` : ''}` : 'none'}${
      b.group?.first ? ` · ${TIMELINE_WORDS.sameOn(b.group.more.length)}` : ''
    }`;
  for (const lane of view.lanes) {
    const i = lane.index ?? -1;
    out.push(`${opts.label(i)} · ${opts.classOf(i)}`);
    out.push(...lane.bars.map(bar), ...lane.untimed.map(bar));
    if (lane.bars.length + lane.untimed.length === 0) out.push(`- ${TIMELINE_WORDS.nothingTimed}`);
    else {
      const all = [...lane.bars, ...lane.untimed];
      if (all.every((b) => b.group && !b.group.first))
        out.push(`- ${[TIMELINE_WORDS.inGroupAbove, ...new Set(all.map((b) => b.label))].join(' · ')}`);
    }
  }
  for (const lane of view.accountLanes) {
    out.push(`Account · ${lane.heading}`);
    out.push(...lane.bars.map(bar), ...lane.untimed.map(bar));
  }
  if (view.accountNote) out.push(`Account: ${view.accountNote}`);
  return out.join('\n');
}
