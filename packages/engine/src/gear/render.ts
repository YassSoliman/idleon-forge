// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 TR-10: the golden's `## Gear` section, one line per character (its lit slot and every slot's word),
// then the Smithy line. Labels are save-order slots (C1…), never names.
import type { GearResult } from './types';

export function renderGearText(
  gear: GearResult | null | undefined,
  label: (index: number) => string,
  classOf: (index: number) => string,
): string {
  if (!gear) return '(no gear data)';
  const lines: string[] = [];
  for (const c of gear.characters) {
    const words = c.slots
      .filter((s) => s.state !== 'm20')
      .map((s) => `${s.slot} ${s.word}`)
      .join(', ');
    lines.push(`- ${label(c.index)} · ${classOf(c.index)} · ${c.status} · lit: ${c.lit ?? 'none'}`);
    if (c.step) lines.push(`  next: ${c.step}`);
    lines.push(`  ${words}`);
    for (const l of c.ladders) if (l.next) lines.push(`  ${l.skill}: ${l.next}`);
  }
  lines.push(`- Smithy: ${gear.smithy.line}`);
  for (const s of gear.smithy.sets) lines.push(`  ${s.setName}: ${s.line}`);
  return lines.join('\n');
}
