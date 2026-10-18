// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, {
  lineOfTab,
  type TalentIndex,
  type TalentRow,
  talentIndex,
  talentRows,
} from '@idleon-forge/knowledge/generators/talents.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive } from './helpers';

const PROMOTIONS = {
  Warrior: { promotesFrom: 'Beginner', basicsTab: 'Rage_Basics' },
  Squire: { promotesFrom: 'Warrior' },
  Divine_Knight: { promotesFrom: 'Squire' },
  Journeyman: {},
  Maestro: { promotesFrom: 'Journeyman' },
};

describe('talents generator', () => {
  it('classifies attacks and skill attacks from AFKactivity and uses the growth function it is given (synthetic slice)', () => {
    const growth = (func: string, lv: number, x1: number, x2: number) =>
      func === 'bigBase' ? x1 + x2 * lv : -1;
    const rows = talentRows(
      {
        Warrior: {
          BIG_PICK: {
            name: 'BIG_PICK',
            skillIndex: 100,
            funcX: 'bigBase',
            x1: 150,
            x2: 15,
            funcY: 'txt',
            K: 1.05,
            D: 1.4,
            AFKactivity: 1,
          },
          POWER_STRIKE: {
            name: 'POWER_STRIKE',
            skillIndex: 85,
            funcX: 'bigBase',
            x1: 1,
            x2: 1,
            K: 1.1,
            D: 1.2,
            AFKactivity: 0,
          },
          FIRMLY_GRASP_IT: {
            name: 'FIRMLY_GRASP_IT',
            skillIndex: 90,
            funcX: 'bigBase',
            x1: 1,
            x2: 1,
            AFKactivity: -1,
          },
        },
        Squire: { BACK_TO_BASICS: { name: 'BACK_TO_BASICS', skillIndex: 119, funcX: 'add', x1: 1, x2: 0 } },
        Divine_Knight: {
          BACK_TO_BASICS: { name: 'BACK_TO_BASICS', skillIndex: 119, funcX: 'add', x1: 1, x2: 0 },
        },
      },
      PROMOTIONS,
      growth,
    );
    const row = (n: string) => rows.find((r) => r.rawName === n) as TalentRow;
    expect(row('BIG_PICK')).toMatchObject({
      isAttack: false,
      skillAttackFor: 'MINING',
      lines: ['Warrior'],
      valuesY: null,
    });
    expect(row('BIG_PICK').valuesX).toEqual({ '10': 300, '25': 525, '50': 900, '100': 1650 });
    expect(row('POWER_STRIKE')).toMatchObject({ isAttack: true, skillAttackFor: null });
    expect(row('FIRMLY_GRASP_IT')).toMatchObject({ isAttack: false, skillAttackFor: null });
    expect(row('BACK_TO_BASICS').tabs).toEqual(['Divine_Knight', 'Squire']);
    expect(lineOfTab('Rage_Basics', PROMOTIONS)).toBe('Warrior');
    expect(lineOfTab('Maestro', PROMOTIONS)).toBe('Journeyman');
    expect(lineOfTab('Special Talent 1', PROMOTIONS)).toBeNull();
    // M9's compact runtime index carries the same flags.
    expect(talentIndex(rows)).toEqual({
      skillIndex: { BACK_TO_BASICS: 119, BIG_PICK: 100, FIRMLY_GRASP_IT: 90, POWER_STRIKE: 85 },
      attacks: ['POWER_STRIKE'],
      skillAttacks: { BIG_PICK: 'MINING' },
    });
  });

  it('holds its invariants on the pinned data', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const get = (id: string): unknown => out.facts.find((f) => f.id === id)?.rows;
    const rows = get('talents.fact.talents') as TalentRow[];
    // Hand-checked in talents.json at the pin: 376 distinct talent names over 433 tab slots; Big Pick is
    // bigBase 150/15 with AFKactivity 1, so 300 at level 10 through Toolbox's growth; three skill attacks.
    expect(rows).toHaveLength(376);
    const pick = rows.find((r) => r.rawName === 'BIG_PICK');
    expect(pick).toMatchObject({ skillAttackFor: 'MINING', isAttack: false, x1: 150, x2: 15 });
    expect(pick?.valuesX?.['10']).toBe(300);
    expect(
      rows
        .filter((r) => r.skillAttackFor)
        .map((r) => `${r.rawName}:${r.skillAttackFor}`)
        .sort(),
    ).toEqual(['BIG_PICK:MINING', 'LOG_ON_LOGS:CHOPPIN', 'WORMING_UNDERCOVER:FISHING']);
    expect(rows.filter((r) => r.isAttack).length).toBeGreaterThan(40);
    expect(get('talents.fact.bubble-capped')).toEqual([
      'BEEFY_BOTTLES',
      'BLOCKY_BOTTLES',
      'FANTASIA_FLASKS',
      'FUSCIA_FLASKS',
      'VELOCITY_VESSELS',
      'VISIBILITY_VESSELS',
    ]);
    // Promotheus 2 + 1, Hamish 1, Speccius 1, Lord of the Hunt 4: 9 potions from quests; 200 gems in the shop.
    const sources = get('talents.fact.reset-sources') as {
      quests: { amount: number }[];
      gemShop: { cost: number };
    };
    expect(sources.quests.reduce((n, q) => n + q.amount, 0)).toBe(9);
    expect(sources.gemShop.cost).toBe(200);
    const index = get('talents.fact.index') as TalentIndex;
    expect(Object.keys(index.skillIndex)).toHaveLength(376);
    expect(index.attacks).toHaveLength(rows.filter((r) => r.isAttack).length);
    expect(index.skillIndex.IDLE_BRAWLING).toBe(88);
  });

  it("agrees with Toolbox's parsed talent pages and AFK loadout, on a known save", async () => {
    const out = await runLive(generator);
    const rows = out.facts.find((f) => f.id === 'talents.fact.talents')?.rows as unknown as TalentRow[];
    const byName = new Map(rows.map((r) => [r.rawName, r]));
    const chars = knownSave('latest.json').characters as {
      talents?: Record<string, { name: string; orderedTalents: { name: string; skillIndex: number }[] }>;
      talentsLoadout?: { name: string; AFKactivity?: number }[];
    }[];
    let checked = 0;
    for (const c of chars) {
      for (const page of Object.values(c.talents ?? {}))
        for (const t of page.orderedTalents ?? []) {
          if (!t?.name || t.name === 'FILLER' || !byName.has(t.name)) continue;
          expect(byName.get(t.name)?.skillIndex).toBe(t.skillIndex);
          checked++;
        }
      for (const t of c.talentsLoadout ?? []) {
        const r = byName.get(t?.name);
        if (r && t.AFKactivity === 0) expect(r.isAttack).toBe(true);
      }
    }
    expect(checked).toBeGreaterThan(100);
  });
});
