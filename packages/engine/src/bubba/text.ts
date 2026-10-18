// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 FR-25: Bubba's number words, one formatter each. Meat is never coins (D-12, M21 FR-F7): it uses the
// app's one short-number format with a "meat" suffix. A bonus is a percent except Critter Gain, which the
// game adds flat to a trap's base critters (F-f, N.js `(BoxRewards["16c"] + Bubba bonus 2) / 10`).
import { compact, span } from '@idleon-forge/knowledge/template';
import type { BubbaResult } from './types';

/** 245074812968 -> "245B meat". */
export const meatText = (n: number) => `${compact(n)} meat`;

/** 1.2 -> "1.2", 0.10300000000000001 -> "0.1", 420 -> "420", 1236 -> "1.2k". */
export function amount(n: number): string {
  if (Math.abs(n) >= 1000) return compact(n);
  return String(Math.round(n * 100) / 100);
}

/** The game's "−" for Atom Cost, a typographic minus (DS-19). */
const MINUS = '−';

/** One Boon bonus total or delta in words (FR-22). */
export function bonusText(key: string, name: string, value: number): string {
  if (key === 'critterGain') return `+${amount(value / 10)} base critters per trap`;
  if (key === 'atomCost') return `${MINUS}${amount(value)}% ${name}`;
  return `+${amount(value)}% ${name}`;
}

/**
 * A Charisma attribute's bonus in the game's own label (`generalSpelunky[35]`): `}` is the multiplier
 * 1 + x/100 ("13.36x"), `{` and `$` the value; Rizz's "-$% Costs" reads "−2.06% Costs" (F-g).
 */
export function charismaLabel(label: string, value: number): string {
  return label
    .replace('}', amount(1 + value / 100))
    .replace(/[{$]/, amount(value))
    .replace(/^-/, MINUS)
    .trim();
}

/** "16h 11m": a length of time in the one time language (M21 FR-F6). */
export const spanText = (seconds: number) => span(seconds * 1000);

/**
 * "10 of 10" pats; "21 left · 11 a refill" when Megaflesh 8's head start leaves more than a refill gives
 * (F-h); "? of 10" without X1.
 */
export function patsText(p: NonNullable<BubbaResult['pats']>): string {
  if (p.left === null || p.perHour === null) return `${p.left ?? '?'} of ${p.perHour ?? '?'}`;
  return p.left > p.perHour ? `${p.left} left · ${p.perHour} a refill` : `${p.left} of ${p.perHour}`;
}

/** The `## Bubba` golden section (M23 TR-10): the page's words at `now`, deterministic. */
export function renderBubbaText(b: BubbaResult | null | undefined, now: number): string {
  if (!b) return '(no Bubba)';
  if (b.state === 'unknown') return "Can't read Bubba from this save";
  const at = (t: number | null) => (t === null ? 'out of reach' : t <= now ? 'now' : `in ${span(t - now)}`);
  const lines: string[] = [];
  lines.push(
    b.step
      ? `Step: ${b.step.text}`
      : b.nextEvent
        ? `Nothing to do in Bubba right now · ${b.nextEvent.label} ${at(b.nextEvent.at)}`
        : 'Nothing to do in Bubba right now',
  );
  if (b.openOn) lines.push(`Open it on: ${b.openOn}`);
  if (b.loginNote) lines.push('Away time: only on a character with the door');
  lines.push(`Account bonuses: ${b.bonuses.map((x) => `${x.text} (${x.rating})`).join(', ')}`);
  if (b.megaflesh.multiplier) lines.push(`Boosted by Megaflesh: ${b.megaflesh.multiplier}`);
  if (b.boonNext)
    lines.push(
      `Boon ${b.boonNext.level}: ${b.boonNext.add ?? b.boonNext.name}${b.boonNext.cost ? ` · ${b.boonNext.cost}` : ''} · ${b.boonNext.affordable ? 'affordable' : at(b.boonNext.at)}`,
    );
  const mf = b.megaflesh;
  lines.push(
    `Megaflesh: ${mf.owned} owned${mf.chromatic ? ` · Chromatic × ${mf.chromatic}` : ''}${
      mf.next
        ? ` · next ${mf.next.row}: ${mf.next.label}${mf.next.progress ? ` · ${mf.next.progress}` : ''} · ${mf.next.affordable ? 'affordable' : at(mf.next.at)}`
        : ''
    }`,
  );
  if (b.ratePerMin) lines.push(`This run: ${b.ratePerMin} a minute · ${b.projected ?? '?'} now`);
  if (b.run.nextType) lines.push(`Next type: ${b.run.nextType}`);
  if (b.run.nextBuys.length)
    lines.push(
      `Next buys: ${b.run.nextBuys
        .slice(0, 3)
        .map((x) => `${x.name} (${x.cost})`)
        .join(', ')}`,
    );
  if (b.pats)
    lines.push(
      `Pats: ${patsText(b.pats)} · ${b.pats.refillAt === null ? 'full when you open Bubba' : `refill ${at(b.pats.refillAt)}`}`,
    );
  if (b.smoker)
    lines.push(
      `Smoker: ${spanText(Math.min(b.smoker.seconds, b.smoker.max))} of ${spanText(b.smoker.max)}${
        b.smoker.atMax ? (b.smoker.heldForSlabcakes ? ' · held for Slabcakes' : ' · at max quality') : ''
      }${b.smoker.needs ? ` · ${b.smoker.needs}` : ''}`,
    );
  if (b.charisma) {
    const c = b.charisma;
    lines.push(
      `Charisma: ${c.attrs
        .map(
          (a) =>
            `${a.name} ${a.level}/${a.max ?? '?'}${a.training ? (a.atMax ? ' (training, max)' : ' (training)') : ''}${a.emulsified ? ' 3x' : ''}`,
        )
        .join(', ')}`,
    );
    const next =
      c.attrs.find((a) => a.next && !a.atMax && a.level === 0) ?? c.attrs.find((a) => a.next && !a.atMax);
    if (next?.next) lines.push(`Next level: ${next.next}`);
    if (c.banked !== null) lines.push(`Banked: ${c.banked} levels`);
    if (c.mindfulFirst) lines.push(`Mindful first: ${c.mindfulFirst.level}/${c.mindfulFirst.max ?? '?'}`);
    for (const t of c.targets)
      lines.push(
        `Target ${t.label}: ${t.gaps
          .map((g, i) => (g ? `${c.attrs[i]?.name ?? i} ${g.gap === 0 ? 'met' : `${g.gap} to go`}` : null))
          .filter(Boolean)
          .join(', ')}`,
      );
    if (c.emulsifyOpen) lines.push('Emulsify: open');
  }
  if (b.gifts.length) lines.push(`Gifts: ${b.gifts.join(', ')}`);
  const locked = Object.entries(b.locked);
  if (locked.length) lines.push(`Locked: ${locked.map(([k, v]) => `${k} (${v})`).join(', ')}`);
  return lines.join('\n');
}
