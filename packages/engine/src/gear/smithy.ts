// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 F4 the Armor-set Smithy (docs/specs/M18-gear-tools.md FR-21 to FR-23, FR-27): its state and
// countdown, one card per W1–W3 set with where each part is, and the hire and register lines.
import type { AccountState, WornSlot } from '@idleon-forge/account-state';
import { holdingsOf, totalOf } from '../walkthrough/holdings';
import { ENTRY, type GearFacts, type GearKnowledge, joinAnd, type SmithySet, say, who } from './kb';
import type { SmithySetCard } from './types';

export const SMITHY_DAYS = 30;
/** Gems bought that open the Smithy at once (Toolbox `getArmorSmithy` isSmithyUnlocked: 2e3, bun_c counts 1,500). */
export const SMITHY_GEMS = 2000;

export interface SmithyResult {
  state: 'waiting' | 'ready' | 'hired' | 'unknown';
  daysLeft: number | null;
  line: string;
  cards: SmithySetCard[];
  /** The register line for the first complete, unregistered set (hired only). */
  register: { card: SmithySetCard; set: SmithySet; details: string[] } | null;
  /** Parts of sets not registered: rawName -> set name ("Copper"), for FR-18. */
  unregistered: Map<string, string>;
}

type Where = { where: 'worn' | 'held' | 'missing'; by: number | null };

export function buildSmithy(
  state: AccountState,
  kb: GearKnowledge,
  facts: GearFacts,
  worn: ReadonlyMap<number, WornSlot[]>,
): SmithyResult {
  const s = state.account.armorSmithy ?? null;
  const st: SmithyResult['state'] = !s ? 'unknown' : s.hired ? 'hired' : s.canHire ? 'ready' : 'waiting';
  const daysLeft = s && st === 'waiting' ? Math.max(1, SMITHY_DAYS - Math.floor(s.daysWaited)) : null;
  const h = (k: string, slots: Record<string, string | number> = {}) =>
    say(kb, ENTRY.hire, k, { gems: SMITHY_GEMS, ...slots });
  const line =
    st === 'waiting'
      ? daysLeft === 1
        ? h('waiting-one')
        : h('waiting', { days: daysLeft ?? SMITHY_DAYS })
      : st === 'ready'
        ? h('ready')
        : st === 'hired'
          ? h('hired')
          : h('unknown');

  const wornBy = (raw: string): number | null => {
    for (const [index, slots] of worn) if (slots.some((x) => x.item?.rawName === raw)) return index;
    for (const c of state.characters) if (c.slots?.skull === raw || c.slots?.trapSet === raw) return c.index;
    return null;
  };
  const locate = (raw: string): Where => {
    const by = wornBy(raw);
    if (by !== null) return { where: 'worn', by };
    return totalOf(holdingsOf(state, raw)) > 0 ? { where: 'held', by: null } : { where: 'missing', by: null };
  };
  const registered = new Set(s?.registered ?? []);
  const unregistered = new Map<string, string>();
  const r = (k: string, slots: Record<string, string | number>) => say(kb, ENTRY.register, k, slots);
  const name = (raw: string) => facts.ladder.get(raw)?.name ?? raw.replace(/_/g, ' ');
  const cards: SmithySetCard[] = [];
  let register: SmithyResult['register'] = null;
  for (const set of facts.sets) {
    const isReg = registered.has(set.set);
    if (!isReg)
      for (const raw of [...set.armors, ...set.tools, ...set.weapons]) unregistered.set(raw, set.name);
    // The parts the set needs: every armour piece, then the best-placed tools and weapon.
    const pick = (list: readonly string[], n: number) => {
      const located = list.map((raw) => ({ raw, ...locate(raw) }));
      const rank = { worn: 0, held: 1, missing: 2 } as const;
      return [...located].sort((a, b) => rank[a.where] - rank[b.where]).slice(0, n);
    };
    const parts = [
      ...set.armors.map((raw) => ({ raw, ...locate(raw) })),
      ...pick(set.tools, set.requiredTools),
      ...pick(set.weapons, set.requiredWeapon),
    ];
    const have = parts.filter((p) => p.where !== 'missing').length;
    const need = parts.length;
    const found = parts.filter((p) => p.where !== 'missing');
    const missing = parts.find((p) => p.where === 'missing');
    const cardLine = isReg
      ? r('card-registered', {})
      : have === need
        ? r('card-parts', { have, need })
        : found.length === 1 && found[0]?.where === 'held'
          ? r('card-held', { have, need, item: name(found[0].raw) })
          : missing
            ? r('card-missing', { have, need, item: name(missing.raw) })
            : r('card-parts', { have, need });
    const key = `${ENTRY.register}@account`;
    const card: SmithySetCard = {
      set: set.set,
      setName: set.name,
      bonus: set.bonus,
      registered: isReg,
      parts: parts.map((p) => ({ rawName: p.raw, name: name(p.raw), where: p.where })),
      line: cardLine,
      actionKey: null,
    };
    cards.push(card);
    if (!register && st === 'hired' && !isReg && have === need) {
      card.actionKey = key;
      const groups = new Map<string, string[]>();
      for (const p of parts) {
        const c = p.by !== null ? state.characters.find((x) => x.index === p.by) : undefined;
        const where = p.where === 'worn' && c ? r('where-worn', { who: who(c) }) : r('where-held', {});
        groups.set(where, [...(groups.get(where) ?? []), name(p.raw)]);
      }
      register = {
        card,
        set,
        details: [...groups].map(([where, names]) => r('detail', { parts: joinAnd(names), where })),
      };
    }
  }
  if (st === 'ready') {
    const first = cards.find((c) => !c.registered);
    if (first) first.actionKey = `${ENTRY.hire}@account`;
  }
  return { state: st, daysLeft, line, cards, register, unregistered };
}
