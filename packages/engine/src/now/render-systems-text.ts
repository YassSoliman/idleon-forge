// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 TR-10: the golden snapshots' `## Systems` section, one line per tile:
// `<world> · <name> · <status> · <reason>`, then "Needs you" and the other gaps. Plain text from the
// view model only, so a Knowledge Base PR that changes a status shows it in its golden diff.
// M21 TR-14: owned by area S.
import type { SystemsView, TileView } from './view';

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
