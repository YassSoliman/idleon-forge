// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 F3 the Skills tab and FR-31 the Skill Grid (docs/specs/M20-skills-parallel-slots.md FR-33 to FR-38):
// every W1–W3 skill per character with its level, progress, efficiency, the account's best, the M2 Role
// that owns it, the class line's specialty, the next level that opens something, and one "Train" line.
// It advises, never moves (D-14). Pure.
import { type AccountState, type CharacterState, SKILL_IDS, type SkillId } from '@idleon-forge/account-state';
import { classTree, lookupOf, roleDefs } from '../metapath/knowledge';
import type { MetaPathResult } from '../metapath/types';
import { CAULDRONS, LIQUIDS } from './build';
import { ENTRY, FACT, type M20Knowledge, rowsOf, say } from './kb';
import type { CharacterSkills, SkillGrid, SkillRow, SlotPip } from './types';

export const SKILL_NAME: Record<SkillId, string> = {
  mining: 'Mining',
  smithing: 'Smithing',
  chopping: 'Choppin',
  fishing: 'Fishing',
  alchemy: 'Alchemy',
  catching: 'Catching',
  trapping: 'Trapping',
  construction: 'Construction',
  worship: 'Worship',
};

/** FR-35: what an M2 Role owns, per skill (`archer-smithing` owns Smithing by its id). */
const OWNS: Partial<Record<SkillId, string>> = {
  fishing: 'FISHING',
  catching: 'CATCHING',
  chopping: 'CHOPPIN',
  construction: 'parallel:cog',
  worship: 'parallel:worship',
  alchemy: 'parallel:cauldron',
  trapping: 'parallel:trap',
};
const AFK_SKILL: Record<string, SkillId> = {
  MINING: 'mining',
  CHOPPIN: 'chopping',
  FISHING: 'fishing',
  CATCHING: 'catching',
};
const SLOT_OF: Partial<Record<SkillId, SlotPip['kind']>> = {
  construction: 'cog',
  worship: 'worship',
  alchemy: 'cauldron',
  trapping: 'trap',
};
/** The world a skill's System opens in (FR-34). */
const OPENS_IN: Partial<Record<SkillId, { world: number; text: string }>> = {
  alchemy: { world: 2, text: 'Opens in W2: finish World 1' },
  trapping: { world: 3, text: 'Opens in W3: finish World 2' },
  construction: { world: 3, text: 'Opens in W3: finish World 2' },
  worship: { world: 3, text: 'Opens in W3: finish World 2' },
};

interface Gate {
  level: number;
  label: string;
  scope: 'character' | 'account';
}

/** FR-36: the gates of one skill, in level order: M4's doors and tools, then M20's table. */
export function gatesOf(kb: M20Knowledge, skill: SkillId): Gate[] {
  const door = (id: string): Gate[] => {
    const e = kb.entries[id] as { milestones?: { at: number; reward: string }[] } | undefined;
    const ms = Array.isArray(e?.milestones) ? e.milestones : [];
    return ms.map((m) => ({
      level: m.at,
      label: m.reward
        .replace(/^door to /, '')
        .replace(/ and door to .*$/, '')
        .replace(/^The /, ''),
      scope: 'character' as const,
    }));
  };
  const tools = (id: string): Gate[] => {
    const e = kb.entries[id] as { data?: { tools?: { level: number; name: string }[] } } | undefined;
    return (e?.data?.tools ?? []).map((t) => ({
      level: t.level,
      label: t.name,
      scope: 'character' as const,
    }));
  };
  const table = rowsOf<Partial<Record<SkillId, Gate[]>>>(kb, FACT.gates) ?? {};
  const list =
    skill === 'mining'
      ? door('skills.goal.door-mining')
      : skill === 'fishing'
        ? door('skills.goal.door-fishing')
        : skill === 'chopping'
          ? tools('skills.goal.tool-chopping')
          : skill === 'catching'
            ? tools('skills.goal.tool-catching')
            : (table[skill] ?? []);
  return [...list].sort((a, b) => a.level - b.level);
}

export interface SkillsInput {
  state: AccountState;
  kb: M20Knowledge;
  meta: MetaPathResult | null;
  pips: Map<number, SlotPip[]>;
  /** NextAction keys of the shown slot Goals, by the skill and character they fill. */
  slotGoalKey: (skill: SkillId, index: number) => string | null;
}

export function buildSkills(i: SkillsInput): CharacterSkills[] {
  const { state, kb, meta } = i;
  const chars = [...state.characters].sort((a, b) => a.index - b.index);
  const facts = lookupOf(kb);
  let tree: ReturnType<typeof classTree> | null = null;
  try {
    tree = classTree(facts);
  } catch {
    tree = null;
  }
  const defs = roleDefs(facts);
  const specialty = rowsOf<{ skill: SkillId; classLine: string }[]>(kb, FACT.specialty) ?? [];
  const world = state.account.currentWorld ?? 0;
  const best = new Map<SkillId, { level: number; index: number }>();
  for (const s of SKILL_IDS)
    for (const c of chars) {
      const lv = c.skills?.[s]?.level;
      if (lv === undefined) continue;
      const b = best.get(s);
      if (!b || lv > b.level) best.set(s, { level: lv, index: c.index });
    }

  return chars.map((c) => {
    const roles = meta?.roles[c.index] ?? [];
    const isA = (line: string) => tree?.isA(c.class, line) ?? c.class === line;
    // The class line's specialties, subclass first (F-h).
    const specs = specialty
      .filter((x) => isA(x.classLine))
      .sort(
        (a, b) =>
          Number(['Warrior', 'Archer', 'Mage'].includes(a.classLine)) -
          Number(['Warrior', 'Archer', 'Mage'].includes(b.classLine)),
      )
      .map((x) => x.skill);
    const roleFor = (skill: SkillId) => {
      const owns = OWNS[skill];
      const r = roles.find((x) =>
        skill === 'smithing' ? x.role === 'archer-smithing' : owns && x.afkType === owns,
      );
      if (!r) return null;
      const def = defs.find((d) => d.id === r.role && d.entryId === r.entryId);
      const from = def?.activeFrom ?? null;
      return { id: r.role, active: r.active, from: from ? `W${from.slice(1, 2)}` : null };
    };
    const rows: SkillRow[] = SKILL_IDS.map((skill) => {
      const st = c.skills?.[skill];
      const level = st?.level ?? null;
      const role = roleFor(skill);
      const opens = OPENS_IN[skill];
      const locked = opens && world < opens.world ? { text: opens.text } : null;
      const gates = gatesOf(kb, skill);
      const b = best.get(skill) ?? null;
      const base = gates[0]?.scope === 'account' ? (b?.level ?? level) : level;
      const g = base === null ? null : (gates.find((x) => x.level > base) ?? null);
      return {
        skill,
        level,
        progress: st && st.expReq > 0 ? Math.min(1, st.exp / st.expReq) : null,
        efficiency: c.skillEfficiency?.[skill] ?? null,
        accountBest: b,
        role,
        specialty: !role && specs.includes(skill),
        locked,
        nextGate:
          g && base !== null
            ? { label: g.label, atLevel: g.level, levelsLeft: g.level - base, scope: g.scope }
            : null,
      };
    });
    const pips = i.pips.get(c.index) ?? [];
    return {
      index: c.index,
      rows,
      train: trainLine(c, rows, roles, pips, specs, world, i.slotGoalKey, (skill, p) =>
        openerOf(kb, skill, p),
      ),
      slots: pips,
    };
  });
}

/**
 * The Check that opens a shut Role slot, in its own words: Trapping before the first quest is Lord of the
 * Hunt's (trapping.check.start). Other slots have no opener Check yet: null, and the slot's words stand.
 */
export function openerOf(
  kb: M20Knowledge,
  skill: SkillId,
  p: SlotPip,
): { step: string | null; why: string | null } {
  if (skill === 'trapping' && p.linkKey === null && p.state === 'unfillable') {
    const step = say(kb, ENTRY.trapStart, 'text');
    const why = say(kb, ENTRY.trapStart, 'why');
    return { step: step || null, why: why || null };
  }
  return { step: null, why: null };
}

function trainLine(
  c: CharacterState,
  rows: SkillRow[],
  roles: MetaPathResult['roles'][number],
  pips: SlotPip[],
  specs: SkillId[],
  world: number,
  slotGoalKey: SkillsInput['slotGoalKey'],
  opener: (skill: SkillId, p: SlotPip) => { step: string | null; why: string | null },
): CharacterSkills['train'] {
  const name = (s: SkillId) => SKILL_NAME[s];
  const pipOf = (s: SkillId) => {
    const k = SLOT_OF[s];
    return k ? pips.find((p) => p.kind === k) : undefined;
  };
  const afk = c.afkType ? AFK_SKILL[c.afkType] : undefined;
  const activity = (t: string | null) =>
    t === 'FIGHTING'
      ? "it's fighting now"
      : t
        ? `it's AFK on ${t.charAt(0)}${t.slice(1).toLowerCase()}`
        : "it's idle now";
  const slotWords = (s: SkillId): string => {
    const at = c.slots?.cauldron ?? -1;
    switch (s) {
      case 'construction':
        return c.slots?.cogPlace?.kind === 'shelf'
          ? 'trains while it makes cogs on the Cog Shelf'
          : 'trains while it sits on the Cog Board';
      case 'worship':
        return 'trains as it spends charge';
      case 'alchemy':
        return at >= 0 && at < 4
          ? `trains while it brews (${CAULDRONS[at]})`
          : at >= 4 && at < 8
            ? `trains while it brews (${LIQUIDS[at - 4]})`
            : 'trains while it brews';
      default:
        return 'trains while its traps run';
    }
  };
  const roleSkills = rows.filter((r) => r.role?.active && !r.locked);
  // M2's Role order for the class line: the order of the character's Role list.
  const order = (s: SkillId) =>
    roles.findIndex((r) => (s === 'smithing' ? r.role === 'archer-smithing' : r.afkType === OWNS[s]));
  roleSkills.sort((a, b) => order(a.skill) - order(b.skill));
  // (1) an active Role skill whose slot is fillable or capped
  for (const r of roleSkills) {
    const p = pipOf(r.skill);
    if (p && (p.state === 'fillable' || p.state === 'capped'))
      return {
        skill: r.skill,
        text: `Train: ${name(r.skill)} · ${p.state === 'capped' ? 'spend its charge, the bar is full' : p.text}`,
        via: 'parallel-slot',
        linkKey: p.linkKey ?? slotGoalKey(r.skill, c.index),
      };
  }
  // (2) the first active Role skill
  const first = roleSkills[0];
  if (first) {
    if (SLOT_OF[first.skill]) {
      const p = pipOf(first.skill);
      const shut = p && (p.state === 'unfillable' || p.state === 'locked');
      return {
        skill: first.skill,
        text: `Train: ${name(first.skill)} · ${slotWords(first.skill)}`,
        via: 'parallel-slot',
        linkKey: null,
        ...(shut ? { blocked: { text: p.text, ...opener(first.skill, p) } } : {}),
      };
    }
    if (afk === first.skill)
      return {
        skill: first.skill,
        text: `Train: ${name(first.skill)} · trains while AFK on ${name(first.skill)}`,
        via: 'afk-target',
        linkKey: null,
      };
    return {
      skill: first.skill,
      text: `Role skill: ${name(first.skill)} · ${activity(c.afkType)}`,
      via: 'role',
      linkKey: null,
    };
  }
  // (3) the specialty, its System open
  const spec = specs.find((s) => {
    const o = OPENS_IN[s];
    return !o || world >= o.world;
  });
  if (spec) {
    if (afk === spec)
      return {
        skill: spec,
        text: `Train: ${name(spec)} (specialty) · trains while AFK on ${name(spec)}`,
        via: 'afk-target',
        linkKey: null,
      };
    return {
      skill: spec,
      text: `Specialty: ${name(spec)} · ${activity(c.afkType)}`,
      via: 'specialty',
      linkKey: null,
    };
  }
  return null;
}

/** FR-31: the Skill Grid, one row per character; exactly one highlighted cell. */
export function buildSkillGrid(
  state: AccountState,
  skills: CharacterSkills[],
  highlight: { index: number; skill: string } | null,
): SkillGrid {
  const totals = Object.fromEntries(SKILL_IDS.map((s) => [s, 0])) as Record<SkillId, number>;
  const rows = skills.map((cs) => {
    const c = state.characters.find((x) => x.index === cs.index);
    const cells = Object.fromEntries(
      cs.rows.map((r) => {
        totals[r.skill] += r.level ?? 0;
        return [
          r.skill,
          {
            level: r.level,
            best: r.accountBest?.index === cs.index,
            specialty: r.specialty,
            role: r.role?.active === true,
          },
        ];
      }),
    ) as SkillGrid['rows'][number]['cells'];
    return {
      id: `row-${cs.index}`,
      actionKey: null,
      index: cs.index,
      cells,
      afkSkill: c?.afkType ? (AFK_SKILL[c.afkType] ?? null) : null,
      slots: cs.slots,
    };
  });
  const cell =
    highlight && rows.some((r) => r.index === highlight.index)
      ? `cell-${highlight.index}-${highlight.skill}`
      : null;
  return { skills: [...SKILL_IDS], rows, highlight: cell, totals };
}
