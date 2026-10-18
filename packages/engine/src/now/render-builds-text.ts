// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-8: the golden snapshots' `## Builds` section, owned by area C. For each character and preset:
// the tab tiles with their badges (FR-C3, the star tile included), then the first 4 path steps of the
// lead tab and of the star tab, each with its band and running total (FR-C1). Pure text.
import type { BuildPathStepView, BuildPresetView, EngineResult } from '../result';
import { CHARACTERS_WORDS, leadTab, pathMarker, tabBadge } from './words/characters';

export const BUILDS_NOT_BUILT = 'Not built yet (M21 area C: the Build path).';

const STEPS = 4;
const n = (x: number) => x.toLocaleString('en-US');

const stepLine = (s: BuildPathStepView): string => {
  const band = CHARACTERS_WORDS.buildPath.band[s.band];
  // A tie row's members' levels are in its note ("split evenly: …").
  const tie = s.note?.startsWith('split evenly') === true;
  const lv =
    s.band === 'done' || (s.band === 'later' && s.goal <= 0)
      ? `${n(s.band === 'done' ? s.goal : s.current)}`
      : tie
        ? `+${n(s.need)}`
        : `${n(s.current)} → ${n(s.goal)}`;
  const total =
    s.band === 'part' && s.partNow !== null
      ? ` · +${n(s.partNow)} of ${n(s.need)} now · +${n(s.cumulative ?? 0)}`
      : s.cumulative !== null
        ? ` · +${n(s.cumulative)}`
        : '';
  const extra = s.condition ?? s.note;
  return `${band}: ${s.label} ${lv}${total}${extra ? ` (${extra})` : ''}`;
};

function presetLines(p: BuildPresetView, lead: number | null): string[] {
  const tiles = [...p.tabs, ...(p.star ? [p.star] : [])].map((t) => {
    const badge = tabBadge(t);
    return `${t.name}${t.tab === lead ? ` [${CHARACTERS_WORDS.grid.startHere}]` : ''}${badge ? ` (${badge})` : ''}`;
  });
  const out = [`- ${p.heading}${p.active ? ` (${CHARACTERS_WORDS.grid.inUse})` : ''}: ${tiles.join(' · ')}`];
  for (const t of [p.tabs.find((x) => x.tab === lead), p.star]) {
    const path = t?.path ?? [];
    if (!t || path.length === 0) continue;
    out.push(`  - ${t.name}: ${pathMarker(t)}`);
    for (const s of path.slice(0, STEPS)) out.push(`    - ${stepLine(s)}`);
    if (path.length > STEPS) out.push(`    - and ${path.length - STEPS} more`);
  }
  return out;
}

export function renderBuildsText(
  result: EngineResult,
  opts: { label: (index: number) => string; classOf: (index: number) => string },
): string {
  const builds = result.builds ?? [];
  if (builds.length === 0) return 'No Build data.';
  const lines: string[] = [];
  for (const r of builds) {
    lines.push(`### ${opts.label(r.index)} (${opts.classOf(r.index)})`);
    if (r.note) lines.push(`- ${r.note}`);
    const lead = leadTab(r.presets);
    for (const p of r.presets) lines.push(...presetLines(p, lead?.preset === p ? lead.tab.tab : null));
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}
