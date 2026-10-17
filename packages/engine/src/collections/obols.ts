// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8 obols (FR-20 to FR-23): the Obol Altar hand-in while it is locked, then stored obols into empty
// slots of the same shape (family first, then personal), the next-slot Milestones with FR-22's anomaly
// rule, and why obols aren't dropping (the W2 merit). Pure.
import { type AccountState, type CharacterState, isKnown, type ObolSlot } from '@idleon-forge/account-state';
import {
  type FactLookup,
  factRows,
  human,
  M8,
  obolAltarQuest,
  type QuestRoute,
  shopTowns,
  stampEntries,
} from './knowledge';
import { holdings, holdingsKnown } from './routes';

export interface Placement {
  to: 'family' | number;
  shape: string;
  count: number;
}

export interface ObolsEval {
  /** `hidden`: no character has reached the altar level; `unknown`: a section M8 needs failed. */
  state: 'hidden' | 'unknown' | 'ok';
  altarDone: boolean;
  altar: {
    character: number;
    how: 'carrying' | 'storage' | 'buy' | 'missing';
    item: string;
    town: string | null;
  } | null;
  stored: number;
  placements: Placement[];
  familyFilled: number;
  familyOpen: number;
  nextFamilySlot: { levelReq: number; shape: string; gap: number } | null;
  /** FR-22: a locked slot whose gate is already met; no Milestone, only this diagnostic. */
  anomalies: { where: 'family' | number; levelReq: number }[];
  nextPersonal: { character: number; levelReq: number; shape: string }[];
  meritLevel: number | null;
  quest: QuestRoute | null;
}

const lowestLocked = (slots: readonly ObolSlot[]) =>
  [...slots].filter((s) => s.state === 'locked').sort((a, b) => a.levelReq - b.levelReq)[0] ?? null;

export function evaluateObols(state: AccountState, kb: FactLookup): ObolsEval {
  const out: ObolsEval = {
    state: 'ok',
    altarDone: false,
    altar: null,
    stored: 0,
    placements: [],
    familyFilled: 0,
    familyOpen: 0,
    nextFamilySlot: null,
    anomalies: [],
    nextPersonal: [],
    meritLevel: state.account.obolDropMerit ?? null,
    quest: null,
  };
  const altarLevel = factRows<{ level: number }>(kb, M8.obolAltarLevel).level;
  const highest = state.account.highestLevel ?? Math.max(0, ...state.characters.map((c) => c.level));
  if (highest < altarLevel) return { ...out, state: 'hidden' };
  const known =
    isKnown(state, 'account.familyObols') &&
    isKnown(state, 'account.storedObols') &&
    state.characters.every((c) => isKnown(state, `characters[${c.index}].quests`));
  const family = state.account.familyObols;
  const stored = state.account.storedObols;
  if (!known || !family || !stored) return { ...out, state: 'unknown' };
  out.stored = stored.length;
  out.familyFilled = family.filter((s) => s.state === 'filled').length;
  out.familyOpen = family.filter((s) => s.state === 'empty').length;

  // FR-20: the altar quest is account-wide: done when any character finished it.
  const q = obolAltarQuest(kb);
  out.quest = q;
  out.altarDone = state.characters.some((c) => c.quests?.[q.npc]?.[q.questKey] === 1);
  if (!out.altarDone) {
    const accepted = state.characters.filter((c) => c.quests?.[q.npc]?.[q.questKey] === 0);
    const pool = accepted.length ? accepted : state.characters.filter((c) => c.level >= altarLevel);
    const pick = [...pool].sort((a, b) => b.level - a.level || a.index - b.index)[0];
    const req = q.requires[0];
    if (pick && req && holdingsKnown(state)) {
      const h = holdings(state, req.rawName);
      const towns = shopTowns(stampEntries(kb));
      let town: string | null = null;
      for (const [shop, stock] of (state.account.shopStock ?? []).entries())
        if ((stock?.[req.rawName] ?? 0) > 0) town = towns.get(shop)?.town ?? null;
      const how =
        (pick.inventoryItems?.[req.rawName] ?? 0) >= req.amount
          ? 'carrying'
          : h.total >= req.amount
            ? 'storage'
            : town
              ? 'buy'
              : 'missing';
      out.altar = { character: pick.index, how, item: human(req.name), town: town ? human(town) : null };
    }
    return out;
  }

  // FR-21: stored obols into empty slots of their shape, family first, then personal by character.
  const left = new Map<string, number>();
  for (const o of stored) left.set(o.shape, (left.get(o.shape) ?? 0) + 1);
  const place = (to: Placement['to'], slots: readonly ObolSlot[]) => {
    const open = new Map<string, number>();
    for (const s of slots) if (s.state === 'empty') open.set(s.shape, (open.get(s.shape) ?? 0) + 1);
    for (const [shape, n] of open) {
      const k = Math.min(n, left.get(shape) ?? 0);
      if (k <= 0) continue;
      left.set(shape, (left.get(shape) ?? 0) - k);
      out.placements.push({ to, shape, count: k });
    }
  };
  place('family', family);
  const byLevel: CharacterState[] = [...state.characters].sort(
    (a, b) => b.level - a.level || a.index - b.index,
  );
  for (const c of byLevel) if (c.personalObols) place(c.index, c.personalObols);

  // FR-22: the next slot Milestones, silent when the save's lock disagrees with the gate.
  const famNext = lowestLocked(family);
  const familyLevel = state.account.accountLevel;
  if (famNext && familyLevel !== null) {
    if (famNext.levelReq <= familyLevel) out.anomalies.push({ where: 'family', levelReq: famNext.levelReq });
    else
      out.nextFamilySlot = {
        levelReq: famNext.levelReq,
        shape: famNext.shape,
        gap: famNext.levelReq - familyLevel,
      };
  }
  for (const c of state.characters) {
    const next = c.personalObols ? lowestLocked(c.personalObols) : null;
    if (!next) continue;
    if (next.levelReq <= c.level) out.anomalies.push({ where: c.index, levelReq: next.levelReq });
    else out.nextPersonal.push({ character: c.index, levelReq: next.levelReq, shape: next.shape });
  }
  return out;
}
