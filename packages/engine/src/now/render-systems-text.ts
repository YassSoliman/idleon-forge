// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 TR-10: the golden snapshots' `## Systems` section, one line per tile:
// `<world> · <name> · <status> · <reason>`, then "Needs you" and the other gaps. Plain text from the
// view model only, so a Knowledge Base PR that changes a status shows it in its golden diff.
// M21 TR-14: owned by area S.

import type { SystemsHubExtras } from '../pictures/hub-view';
import type { NewPicture } from '../pictures/types';
import type { SystemPicture } from '../result';
import type { SystemsView, TileView } from './view';

const line = (t: TileView) =>
  `W${t.world} · ${t.name} · ${t.statusWord.text} · ${t.reason.map((r) => r.text).join('')}`;

export function renderSystemsText(view: SystemsView & Partial<SystemsHubExtras>): string {
  const out: string[] = [];
  for (const g of view.groups) out.push(...g.tiles.map(line));
  if (view.later) out.push(`${view.later.label}: ${view.later.tiles.map((t) => t.name).join(', ')}`);
  if (view.beyond) out.push(view.beyond);
  out.push(
    `Needs you: ${view.needsYou.length ? view.needsYou.map((n) => `${n.name} (${n.status})`).join(', ') : '(none)'}`,
  );
  out.push(`Other gaps: ${view.otherGaps.length ? view.otherGaps.join(', ') : '(none)'}`);
  out.push(`Wasting: ${view.wastingCount}`);
  // M21 FR-S1: the Stage report card (axis rows by gap, the worst open with its step).
  if (view.report) {
    out.push(`Report card (${view.report.stage}):`);
    for (const r of view.report.rows)
      out.push(
        `- ${r.name} · ${r.expectedBy ?? '?'} · ${r.gap} behind${r.open && r.step ? ` · step: ${r.step.text}` : ''}`,
      );
  } else if (view.report === null) out.push('Report card: (none)');
  // M21 FR-S4: the new pictures (US-12).
  for (const l of pictureLines(view.pictures ?? [])) out.push(l);
  return out.join('\n');
}

/** One line per new picture (US-12), for the golden. Plain facts; names are game names only. */
function pictureLines(pictures: readonly SystemPicture[]): string[] {
  const out: string[] = [];
  for (const any of pictures) {
    const p = any as unknown as NewPicture;
    const lit = p.lit
      ? (p.elements as { id: string; name?: string }[]).find((e) => e.id === p.lit)
      : undefined;
    const name = lit?.name ?? '(none)';
    if (p.kind === 'stamps')
      out.push(`Stamps picture: ${p.owned} of ${p.total} owned · lit ${name} · next ${p.next.length}`);
    else if (p.kind === 'statues') {
      const s = p.elements.find((e) => e.id === p.lit);
      const price = s ? (s.goldCoins === null ? ' (price not checked)' : ' (priced)') : '';
      out.push(
        `Statues picture: ${p.gold} of ${p.elements.length} Gold · ${p.onyx} Onyx · lit ${name}${price}`,
      );
    } else if (p.kind === 'vault')
      out.push(
        `Vault picture: ${p.nextUnlock ? `${p.nextUnlock.levels} levels to open ${p.nextUnlock.name}` : 'every row open'} · here ${p.totalLevels} · lit ${name}`,
      );
    else if (p.kind === 'printer') {
      const changed = p.elements.filter((e) => e.changeTo !== null);
      out.push(
        `Printer picture: ${p.elements.length} slots · ${changed.length} changed${changed.map((e) => ` · ${e.item ?? 'empty'} → ${e.changeTo}`).join('')} · ${p.elements.length - changed.length} no change`,
      );
    }
  }
  return out;
}
