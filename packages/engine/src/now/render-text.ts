// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `renderNowText(view)` (M10 TR-15): the Now screen as stable plain text. It is the `## Now` section
// of M11's golden files and M10's own view-fixture snapshots. Character names never appear: each is
// replaced by its label (`<c3>` by default; goldens pass `C1…Cn` in save order, M11 TR-15). One
// `### <label> · <Class> <level> · <Verdict>` line per character and one `### Account · …` line, so
// M11's `verdictLines` can diff Verdicts between two goldens.
import type { GoalView, NowView, SourceView } from './view';

export interface RenderTextOptions {
  /** The label that stands in for a character's name. Default `<c{index}>`. */
  label?: (index: number) => string;
  /** Goldens carry their own `## Not covered yet` section (M11), so they leave this line out. */
  includeNotCovered?: boolean;
}

const src = (s: SourceView) => `[${s.text}]`;

function goalLine(g: GoalView, indent = ''): string[] {
  const a = g.action;
  const out = [`${indent}- ${a.tag}: ${a.text} ${src(a.source)}`];
  if (g.milestone) out.push(`${indent}  ${g.milestone}`);
  if (a.contested)
    out.push(`${indent}  sources disagree: ${a.contested.sides.map((s) => s.text).join(' | ')}`);
  return out;
}

export function renderNowText(view: NowView, options: RenderTextOptions = {}): string {
  const label = options.label ?? ((i: number) => `<c${i}>`);
  const lines: string[] = [];
  for (const b of view.banners) lines.push(`! ${b.text}`);
  if (!view.progress.hidden) lines.push(view.progress.label);

  for (const row of view.roster) {
    const where = [row.activity, row.map].filter(Boolean).join(' · ');
    lines.push('', `### ${label(row.index)} · ${row.classLabel} ${row.level} · ${row.pill.text}`);
    lines.push(`${row.position} · ${where} · ${row.summary}${row.spendChip ? ` · ${row.spendChip}` : ''}`);
  }

  const f = view.focus;
  if (f) {
    lines.push('', `FOCUS ${label(f.index)} · ${f.position}${f.playing ? ` · ${f.playing}` : ''}`);
    if (f.left) lines.push(f.left.text);
    if (f.unknown) lines.push(`Unknown: ${f.unknown.text}${f.unknown.skipped ? ' (skipped)' : ''}`);
    if (f.unknown?.suggestion)
      lines.push(`  suggestion: ${f.unknown.suggestion.text} ${src(f.unknown.suggestion.source)}`);
    for (const g of f.blockers) lines.push(...goalLine(g));
    if (f.skippedBlockers) lines.push(`${f.skippedBlockers} skipped · undo`);
    for (const p of f.purpose) lines.push(`purpose: ${p.text}`);
    for (const g of f.goals) lines.push(...goalLine(g));
    if (f.hiddenCount) lines.push(`show more (${f.hiddenCount})`);
    if (f.skippedCount) lines.push(`${f.skippedCount} skipped · undo`);
    if (f.dismissed.length) lines.push(`Hidden until next patch (${f.dismissed.length}) · undo`);
    if (f.higherLeverage) lines.push(`Better fit: ${f.higherLeverage.text} ${src(f.higherLeverage.source)}`);
    if (f.higherLeverageNote) lines.push(f.higherLeverageNote);
    for (const a of f.activePlay) lines.push(`active play: ${a.text} · ${a.estimate}`);
    if (f.done.length)
      lines.push(
        `Done this session (${f.done.length}): ${f.done.map((d) => `~~${d.text}~~ ${d.time}`).join('; ')}`,
      );
    lines.push(f.next.text);
  }

  const acc = view.account;
  const acctStatus =
    acc.blockers.length > 0
      ? `fix ${acc.blockers.length} before you leave`
      : acc.safetyUnknown && !acc.safetyUnknown.skipped
        ? 'Unknown'
        : 'nothing to fix';
  lines.push('', `### Account · ${acctStatus}`);
  if (acc.safetyUnknown)
    lines.push(`${acc.safetyUnknown.text}${acc.safetyUnknown.skipped ? ' (skipped)' : ''}`);
  if (acc.blockers.length) lines.push('Fix before you leave');
  for (const g of acc.blockers) lines.push(...goalLine(g));
  if (acc.skippedBlockers) lines.push(`${acc.skippedBlockers} skipped · undo`);
  for (const g of acc.goals) lines.push(...goalLine(g));
  if (acc.hiddenCount) lines.push(`show more (${acc.hiddenCount})`);
  if (acc.skippedCount) lines.push(`${acc.skippedCount} skipped · undo`);
  const sp = acc.spendPlan;
  if (sp) {
    lines.push(`Spend coins: ${sp.summary}`);
    sp.lines.forEach((l, n) => {
      const bits = [l.text, l.levels, l.cost, l.payer, l.statusText, l.runningTotal].filter(Boolean);
      lines.push(`  ${n + 1}. ${bits.join(' · ')}`);
      if (l.note) lines.push(`     ${l.note}`);
    });
    if (sp.hiddenCount) lines.push(`  show more (${sp.hiddenCount})`);
    for (const u of sp.unavailable) lines.push(`  ${u}`);
  }
  if (acc.done.length)
    lines.push(`Done this session (${acc.done.length}): ${acc.done.map((d) => `~~${d.text}~~`).join('; ')}`);
  if (view.activePlay.length) {
    lines.push('If you have time');
    for (const a of view.activePlay) lines.push(`- ${a.text} · ${a.estimate}${a.who ? ` · ${a.who}` : ''}`);
  }
  if ((options.includeNotCovered ?? true) && view.notCovered.length)
    lines.push(`Not covered yet: ${view.notCovered.join(', ')}`);

  // Names never leave the renderer: replace each with its label, longest first ("Character 10"
  // before "Character 1").
  let text = lines.join('\n').replace(/^\n+/, '');
  const names = view.roster
    .map((r) => ({ name: r.name, label: label(r.index) }))
    .filter((n) => n.name.length > 0)
    .sort((a, b) => b.name.length - a.name.length);
  for (const n of names) text = text.split(n.name).join(n.label);
  return `${text}\n`;
}
