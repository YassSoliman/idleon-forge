// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Talent facts (M9 TR-10), file generated/talents.facts.json:
// - `talents.fact.talents`: one row per talent rawName: skillIndex, tabs, class lines, funcX/x1/x2 and
//   funcY/y1/y2, `isAttack` (AFKactivity 0 with D and K present: the test Toolbox's
//   getTalentEffectOnKills uses), `skillAttackFor` (AFKactivity 1 mining, 3 choppin, 4 fishing), and a
//   value table at levels 10/25/50/100 computed by Toolbox's own exported `growth` (ADR 0005: we
//   never write the curve ourselves);
// - `talents.fact.index`: the compact runtime view of the same rows M9's engine ships (rawName ->
//   skillIndex, the attack and skill-attack flags), so the bundle never carries the full table;
// - `talents.fact.tab2-granting` and `talents.fact.bubble-capped`, the two groups M9 names;
// - `talents.fact.reset-items` and `talents.fact.reset-sources`: the reset potion and fragment items,
//   the quests that reward the potion, and its gem shop row.
// Talents.json has no default max level per talent, so none is emitted (M9 reads max from the save).
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';

interface Talent {
  name: string;
  skillIndex?: number;
  funcX?: string;
  x1?: number | null;
  x2?: number | null;
  funcY?: string;
  y1?: number | null;
  y2?: number | null;
  K?: number;
  D?: number;
  AFKactivity?: number;
}
interface Promotion {
  promotesFrom?: string;
  basicsTab?: string;
}
type Growth = (func: string, level: number, x1: number, x2: number) => number;

export const VALUE_LEVELS = [10, 25, 50, 100] as const;
/** AFKactivity codes of skill attacks (M9 TR-10; Big Pick 1, Log On Logs 3, Worming Undercover 4). */
export const SKILL_ATTACK_CODES: Readonly<Record<number, string>> = {
  1: 'MINING',
  3: 'CHOPPIN',
  4: 'FISHING',
};
export const TAB2_GRANTING = ['BACK_TO_BASICS', 'EARLIER_EDUCATION', 'PREVIOUS_POINTS'] as const;
/** The Bottles, Vessels and Flasks talents (M9 TR-5): classified by rawName suffix. */
export const BUBBLE_CAPPED_RE = /_(BOTTLES|VESSELS|FLASKS)$/;
export const RESET_ITEMS = ['ResetCompleted', 'ResetFrag'] as const;

export interface TalentRow {
  rawName: string;
  skillIndex: number | null;
  tabs: string[];
  lines: string[];
  funcX: string | null;
  x1: number | null;
  x2: number | null;
  funcY: string | null;
  y1: number | null;
  y2: number | null;
  isAttack: boolean;
  skillAttackFor: string | null;
  /** growth(funcX, level, x1, x2) at VALUE_LEVELS, rounded to 2 decimals as Toolbox does; null when funcX has no curve. */
  valuesX: Record<string, number> | null;
  valuesY: Record<string, number> | null;
}

/** The base class of the line a talent tab belongs to (Rage_Basics -> Warrior, Squire -> Warrior); null for star tabs. */
export function lineOfTab(tab: string, promotions: Record<string, Promotion>): string | null {
  const basicsOf = Object.entries(promotions).find(([, p]) => p.basicsTab === tab)?.[0];
  let cls = basicsOf ?? (promotions[tab] ? tab : null);
  if (cls === null) return null;
  while (promotions[cls]?.promotesFrom && promotions[cls]?.promotesFrom !== 'Beginner')
    cls = promotions[cls]?.promotesFrom as string;
  return cls;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function talentRows(
  talents: Record<string, Record<string, Talent>>,
  promotions: Record<string, Promotion>,
  growth: Growth,
): TalentRow[] {
  const curve = (func: string | undefined, x1: unknown, x2: unknown) => {
    const a = num(x1);
    const b = num(x2);
    if (!func || func === 'txt' || func === '_' || a === null || b === null) return null;
    return Object.fromEntries(VALUE_LEVELS.map((lv) => [String(lv), growth(func, lv, a, b)]));
  };
  const rows = new Map<string, TalentRow>();
  for (const [tab, list] of Object.entries(talents)) {
    for (const t of Object.values(list)) {
      const line = lineOfTab(tab, promotions);
      const prev = rows.get(t.name);
      if (prev) {
        if (!prev.tabs.includes(tab)) prev.tabs.push(tab);
        if (line && !prev.lines.includes(line)) prev.lines.push(line);
        continue;
      }
      rows.set(t.name, {
        rawName: t.name,
        skillIndex: num(t.skillIndex),
        tabs: [tab],
        lines: line ? [line] : [],
        funcX: t.funcX ?? null,
        x1: num(t.x1),
        x2: num(t.x2),
        funcY: t.funcY ?? null,
        y1: num(t.y1),
        y2: num(t.y2),
        isAttack: t.AFKactivity === 0 && t.K !== undefined && t.D !== undefined,
        skillAttackFor:
          typeof t.AFKactivity === 'number' ? (SKILL_ATTACK_CODES[t.AFKactivity] ?? null) : null,
        valuesX: curve(t.funcX, t.x1, t.x2),
        valuesY: curve(t.funcY, t.y1, t.y2),
      });
    }
  }
  for (const r of rows.values()) {
    r.tabs.sort();
    r.lines.sort();
  }
  return [...rows.values()].sort((a, b) => (a.rawName < b.rawName ? -1 : 1));
}

/** The runtime index M9 ships (TR-10): every rawName with a skillIndex, the attacks and the skill attacks. */
export interface TalentIndex {
  skillIndex: Record<string, number>;
  /** rawNames with isAttack. */
  attacks: string[];
  /** rawName -> the AFK skill it attacks for. */
  skillAttacks: Record<string, string>;
}

export function talentIndex(rows: readonly TalentRow[]): TalentIndex {
  const out: TalentIndex = { skillIndex: {}, attacks: [], skillAttacks: {} };
  for (const r of rows) {
    if (r.skillIndex === null) continue;
    out.skillIndex[r.rawName] = r.skillIndex;
    if (r.isAttack) out.attacks.push(r.rawName);
    if (r.skillAttackFor) out.skillAttacks[r.rawName] = r.skillAttackFor;
  }
  return out;
}

interface QuestStep {
  QuestName?: string;
  rewards?: { rawName?: string; amount?: number }[];
}

const generator = defineGenerator({
  name: 'talents',
  system: 'talents',
  inputs: [
    'website-data/talents.json',
    'website-data/classPromotions.json',
    'website-data/items.json',
    'website-data/quests.json',
    'website-data/gemShop.json',
    'utility/wiki/growth.mjs#growth',
  ],
  constants: { growth: '@utility/wiki/growth.mjs' },
  run({ data, constants, pin }) {
    const growth = constants.growth;
    if (typeof growth !== 'function')
      throw new Error('talents: growth is not exported by utility/wiki/growth.mjs');
    const rows = talentRows(
      data.talents as Record<string, Record<string, Talent>>,
      data.classPromotions as Record<string, Promotion>,
      growth as Growth,
    );
    const names = new Set(rows.map((r) => r.rawName));
    const missing = TAB2_GRANTING.filter((n) => !names.has(n));
    if (missing.length)
      throw new Error(`talents: tab-2 granting talents missing from talents.json: ${missing.join(', ')}`);
    const capped = rows.filter((r) => BUBBLE_CAPPED_RE.test(r.rawName)).map((r) => r.rawName);
    if (capped.length === 0) throw new Error('talents: no Bottles/Vessels/Flasks talents found');

    const items = data.items as Record<string, { displayName?: string; Type?: string }>;
    const resetItems = RESET_ITEMS.map((rawName) => {
      const it = items[rawName];
      if (!it) throw new Error(`talents: reset item ${rawName} is not in items.json`);
      return { rawName, name: it.displayName ?? rawName, type: it.Type ?? null };
    });
    const quests = data.quests as Record<string, Record<string, QuestStep>>;
    const questSources: { npc: string; quest: string; amount: number }[] = [];
    for (const [npc, steps] of Object.entries(quests))
      for (const step of Object.values(steps)) {
        if (!step || typeof step !== 'object' || !Array.isArray(step.rewards)) continue;
        for (const r of step.rewards)
          if (r.rawName === 'ResetCompleted' && typeof r.amount === 'number')
            questSources.push({ npc, quest: step.QuestName ?? npc, amount: r.amount });
      }
    questSources.sort((a, b) => (a.quest < b.quest ? -1 : 1));
    const gem = (
      data.gemShop as {
        sections: Record<string, { rawName: string; cost: number; maxPurchases: number }[]>;
      }[]
    )
      .flatMap((s) => Object.values(s.sections).flat())
      .find((i) => i.rawName === 'ResetCompleted');

    const by = generatedBy(generator, pin);
    const src = (file: string, title: string) => [generatedSource(pin, file, title)];
    const fact = (
      id: string,
      title: string,
      rowsValue: unknown,
      sources: FactTableT['sources'],
    ): FactTableT => ({
      id,
      system: 'talents',
      origin: 'generated',
      title,
      rows: rowsValue as FactTableT['rows'],
      sources,
      generatedBy: by,
    });
    return {
      facts: [
        fact(
          'talents.fact.talents',
          'Talents: tabs, curves, attacks and values',
          rows,
          src('website-data/talents.json', 'IdleOn Toolbox game data: talents'),
        ),
        fact(
          'talents.fact.index',
          'Talents: skill indices, attacks and skill attacks',
          talentIndex(rows),
          src('website-data/talents.json', 'IdleOn Toolbox game data: talents'),
        ),
        fact(
          'talents.fact.tab2-granting',
          'Talents that grant points to another tab',
          [...TAB2_GRANTING],
          src('website-data/talents.json', 'IdleOn Toolbox game data: talents'),
        ),
        fact(
          'talents.fact.bubble-capped',
          'Bottles, Vessels and Flasks talents',
          capped.sort(),
          src('website-data/talents.json', 'IdleOn Toolbox game data: talents'),
        ),
        fact(
          'talents.fact.reset-items',
          'Talent reset items',
          resetItems,
          src('website-data/items.json', 'IdleOn Toolbox game data: items'),
        ),
        fact(
          'talents.fact.reset-sources',
          'Where talent reset potions come from',
          { quests: questSources, gemShop: gem ? { cost: gem.cost, maxPurchases: gem.maxPurchases } : null },
          src('website-data/quests.json', 'IdleOn Toolbox game data: quests and gem shop'),
        ),
      ],
    };
  },
});

export default generator;
