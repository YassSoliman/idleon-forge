// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19's page words (FR-19 to FR-22) as plain functions of `AlchemyResult`, shared by the lazy Alchemy page
// chunk and the golden's `## Alchemy` section, so both say the same thing. Types-only imports: this file
// is safe to load on the UI thread.
import type { AlchemyResult, BubblePick, P2wCell, PotView, TubeView } from './types';

const POT_NAMES: Record<string, string> = {
  power: 'Power',
  quicc: 'Quicc',
  'high-iq': 'High-IQ',
  kazam: 'Kazam',
};
export const potName = (c: string) => POT_NAMES[c] ?? c;

/** 92.7 -> "93", 0.076 -> "0.08". */
export const liquidAmount = (n: number) =>
  n < 10 ? String(Math.round(n * 100) / 100) : String(Math.round(n));

/** "Roid Ragin 3 → 12". */
export const pickText = (p: BubblePick) => `${p.name} ${p.from} → ${p.to}`;

/** FR-19 / US-6: a pot's own line: "Next: Mage Is Best 1 → 6", "Stable Jenius 1 → 12 · needs Water". */
export function potLine(pot: PotView): string {
  const n = pot.next;
  if (n && n.atLeast > 0) return `Next: ${pickText(n)}`;
  if (n?.blocked) return `${pickText(n)} · needs ${n.blocked.name}`;
  if (pot.locked.length) return 'Nothing to level yet · spend brew';
  return 'Plan met';
}

/** "about 4 new bubbles" from M6's expected brew (FR-19); '' when that rounds to none (R9 QA). */
export const brewLine = (pot: PotView) => {
  const n = Math.round(pot.expectedNewBubbles);
  return n > 0 ? `about ${n} new bubble${n === 1 ? '' : 's'}` : '';
};

/** A plan row in the pot's tap sheet: "at least 9 levels" or its shortfall. */
export function rowLine(p: BubblePick): string {
  if (p.atLeast > 0) return `${pickText(p)} · at least ${p.atLeast} level${p.atLeast === 1 ? '' : 's'}`;
  if (p.blocked) return `${p.name} ${p.from} → ${p.band} · needs ${p.blocked.more} more ${p.blocked.name}`;
  return `${p.name} ${p.from} → ${p.band}`;
}

/** FR-21: "32 of 32 · full", "92 of 138", "opens at Alchemy 35". */
export function tubeLine(t: TubeView): string {
  if (!t.open) return t.opensAt ? `opens at Alchemy ${t.opensAt}` : 'locked';
  const full = t.current >= t.max;
  return `${liquidAmount(t.current)} of ${t.max}${full ? ' · full' : ''}`;
}

/** FR-22: "Speed 86 of 150", "Regen not open in Pay 2 Win yet". */
export function cellLine(c: P2wCell): string {
  if (c.closed) return `${c.label} not open in Pay 2 Win yet`;
  return c.max === null ? `${c.label} ${c.level}` : `${c.label} ${c.level} of ${c.max}`;
}

/** The golden's `## Alchemy` section (TR-10). */
export function renderAlchemyText(a: AlchemyResult | null): string {
  if (!a) return '(no Alchemy page)';
  const out: string[] = [];
  out.push(
    `band ${a.band ?? '-'} · pick ${a.pick ? `${pickText(a.pick)} (at least ${a.pick.atLeast})` : a.planMet ? a.notes.planMet : 'none'}`,
  );
  for (const p of a.pots)
    out.push(
      `- ${potName(p.cauldron)}: ${[potLine(p), brewLine(p)].filter(Boolean).join(' · ')}${p.next?.actionKey ? ' · lit' : ''}`,
    );
  out.push(`vial: ${a.vialPick ? `${a.vialPick.name} ${a.vialPick.from} → ${a.vialPick.to}` : 'none'}`);
  out.push(
    `rolls: ${a.rollTargets.length ? a.rollTargets.map((r) => `${r.name} ${r.rollNeeded}+ (${r.item})`).join(', ') : 'none'}`,
  );
  if (a.attempts) out.push(`attempts: ${a.attempts.current} of ${a.attempts.max} left`);
  out.push(
    `tubes: ${a.tubes.map((t) => `${t.name} ${tubeLine(t)}${t.note ? ` (${t.note})` : ''}`).join('; ')}`,
  );
  const next = a.p2w.find((c) => c.next);
  out.push(`p2w next: ${next ? `${next.row} ${cellLine(next)}` : 'none'}`);
  if (a.topStep) out.push(`step: ${a.topStep.text}`);
  return out.join('\n');
}
