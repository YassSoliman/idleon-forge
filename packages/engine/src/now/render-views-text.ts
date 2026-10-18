// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 TR-10: the golden snapshots' `## Systems` section, one line per tile:
// `<world> · <name> · <status> · <reason>`, then "Needs you" and the other gaps. Plain text from the
// view model only, so a Knowledge Base PR that changes a status shows it in its golden diff.
import type { SystemsView, TileView, TimelineBarView, TimelineView } from './view';
import { TIMELINE_WORDS } from './view-words';

const line = (t: TileView) =>
  `W${t.world} · ${t.name} · ${t.statusWord.text} · ${t.reason.map((r) => r.text).join('')}`;

export function renderSystemsText(view: SystemsView): string {
  const out: string[] = [];
  for (const g of view.groups) out.push(...g.tiles.map(line));
  if (view.later) out.push(`${view.later.label}: ${view.later.tiles.map((t) => t.name).join(', ')}`);
  if (view.beyond) out.push(view.beyond);
  out.push(
    `Needs you: ${view.needsYou.length ? view.needsYou.map((n) => `${n.name} (${n.status})`).join(', ') : '(none)'}`,
  );
  out.push(`Other gaps: ${view.otherGaps.length ? view.otherGaps.join(', ') : '(none)'}`);
  out.push(`Wasting: ${view.wastingCount}`);
  return out.join('\n');
}

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
