// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, {
  type SkillClassRow,
  skillClasses,
} from '@idleon-forge/knowledge/generators/skill-classes.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive } from './helpers';

const rowsOf = (out: { facts: { id: string; rows: unknown }[] }) =>
  out.facts.find((f) => f.id === 'talents.fact.skill-classes')?.rows as unknown as SkillClassRow[];

describe('skill-classes generator', () => {
  it('reads skill attacks from AFKactivity on the class tabs (synthetic slice, hand-checked)', () => {
    const rows = skillClasses(
      {
        Warrior: {
          BIG_PICK: { name: 'BIG_PICK', AFKactivity: 1 },
          POWER_STRIKE: { name: 'POWER_STRIKE', AFKactivity: 0 },
        },
        Barbarian: { WORMING_UNDERCOVER: { name: 'WORMING_UNDERCOVER', AFKactivity: 4 } },
      },
      {
        Warrior: { talentTabs: ['Warrior'] },
        Barbarian: { talentTabs: ['Warrior', 'Barbarian'] },
        Hidden: { released: false, talentTabs: ['Warrior'] },
      },
    );
    expect(rows).toEqual([
      { class: 'Barbarian', skills: { FISHING: ['WORMING_UNDERCOVER'], MINING: ['BIG_PICK'] } },
      { class: 'Warrior', skills: { MINING: ['BIG_PICK'] } },
    ]);
  });

  it('holds its invariants on the pinned data', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const rows = rowsOf(out);
    // Hand-checked at the pin: every Warrior-line class mines (Big Pick on the Warrior tab), Barbarian-line
    // classes also fish, Mage-line classes chop (Log On Logs); Archer-line classes have no skill attack.
    expect(rows.find((r) => r.class === 'Squire')?.skills).toEqual({ MINING: ['BIG_PICK'] });
    expect(rows.find((r) => r.class === 'Death_Bringer')?.skills).toEqual({
      FISHING: ['WORMING_UNDERCOVER'],
      MINING: ['BIG_PICK'],
    });
    expect(rows.find((r) => r.class === 'Shaman')?.skills).toEqual({ CHOPPIN: ['LOG_ON_LOGS'] });
    expect(rows.find((r) => r.class === 'Hunter')?.skills).toEqual({});
    expect(rows.length).toBeGreaterThanOrEqual(20);
  });

  it("matches the talent pages Toolbox parsed for each character's class, on a known save", async () => {
    const rows = rowsOf(await runLive(generator));
    const chars = knownSave('latest.json').characters as {
      class?: string;
      talents?: Record<string, { orderedTalents: { name: string }[] }>;
    }[];
    let checked = 0;
    for (const c of chars) {
      const row = rows.find((r) => r.class === c.class);
      if (!row) continue;
      const onPages = new Set(
        Object.values(c.talents ?? {}).flatMap((p) => (p.orderedTalents ?? []).map((t) => t?.name)),
      );
      for (const list of Object.values(row.skills)) for (const t of list) expect(onPages.has(t)).toBe(true);
      checked++;
    }
    expect(checked).toBeGreaterThan(5);
  });
});
