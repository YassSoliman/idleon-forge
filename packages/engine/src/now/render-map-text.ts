// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-9: the golden snapshots' `## Map` section, owned by area M: the bands with their gates, the
// frontier ring, who stands where, each overlay's one ring, and how many maps carry door kills. Characters
// are C1…Cn plus class and level, never a name (M11 TR-15).
import type { MapPlaceView } from '../map/view';

export const MAP_NOT_BUILT = 'Not built yet (M21 area M: the Map place).';

export function renderMapText(
  view: MapPlaceView | null,
  opts: { label: (index: number) => string; classOf: (index: number) => string },
): string {
  if (!view) return '(no map: no current world or no Knowledge Base)';
  const who = (i: number) => `${opts.label(i)} ${opts.classOf(i)}`;
  const out: string[] = [view.summary];
  for (const b of view.worlds) {
    const head = b.beyond ? `${b.heading} · ${b.line}` : `${b.heading} [${b.state}] · ${b.line}`;
    out.push(`- ${head}`);
    if (b.gate) {
      const lines = b.gate.lines.map((l) => l.text).join('; ');
      out.push(
        `  - gate ${b.gate.boss} (${b.gate.state}${b.gate.lit ? ', next' : ''})${lines ? `: ${lines}` : ''}`,
      );
    }
    const here = b.nodes.filter((n) => n.here.length);
    for (const n of here)
      out.push(`  - ${n.name} (${n.state}): ${n.here.map((h) => who(h.index)).join(', ')}`);
  }
  const f = view.frontier;
  out.push(
    f
      ? `- Frontier: ${f.map}${f.to ? ` to ${f.to}` : ''} · ${f.who ? who(f.who.index) : 'nobody'} · ${f.killsText}${f.when ? ` · ${f.when}` : ''} · ${f.step}`
      : '- Frontier: none',
  );
  for (const o of view.overlays) out.push(`- Overlay ${o.label}: ${o.marked.length} maps · ${o.ringText}`);
  const withDoors = Object.values(view.sheets).filter((s) => s.doors.length).length;
  out.push(`- Door kills on ${withDoors} of ${view.maps.length} maps`);
  return out.join('\n');
}
