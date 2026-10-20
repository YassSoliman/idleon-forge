// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-10, FR-S4: the four new System page pictures, from Account State and the outputs the other
// modules already computed. Pure and deterministic. The one lit element always comes from an existing
// module's order, never from a rule of our own (D-13):
// - Stamps: M8's first stamp to get (the top stamps Goal's stamp, else M8's first "now" stamp);
// - Statues: M7's first statue Gold line;
// - Upgrade Vault: M7's first Vault line;
// - 3D Printer: M14's Parallel Slot Plan (its first change).
import type { AccountState } from '@idleon-forge/account-state';
import type { CompiledKnowledge } from '@idleon-forge/knowledge';
import { evaluateStamps, type StampsEval } from '../collections/stamps';
import type { StampAcquisition } from '../collections/types';
import { spendLineKey } from '../now/build-now-view';
import type { EngineResult, Goal } from '../result';
import type { SpendLine } from '../spend/types';
import type { PrinterSlotPlan } from '../walkthrough/types';
import type {
  PrinterPicture,
  StampRoute,
  StampStatus,
  StampsPicture,
  StampTab,
  StampTile,
  StatuesPicture,
  StatueTile,
  VaultFloorRow,
  VaultPicture,
} from './types';

/** "Sword_Stamp" -> "Sword Stamp"; "POWER" stays as the game writes it, turned into "Power". */
const human = (s: string) => s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
const titleCase = (s: string) =>
  human(s)
    .split(' ')
    .map((w) => (w === w.toUpperCase() && w.length > 1 ? w.charAt(0) + w.slice(1).toLowerCase() : w))
    .join(' ');

type Kb = Pick<CompiledKnowledge, 'entries' | 'facts'>;

const values = (kb: Kb, id: string): Record<string, unknown> | null => {
  const e = kb.entries[id] as { values?: Record<string, unknown> } | undefined;
  return e?.values ?? null;
};

/** Every Goal of the result, account first (the Spend-and-collect Goals live there), in rank order. */
const goalsInOrder = (prior: EngineResult): Goal[] => [
  ...prior.account.goals,
  ...prior.characters.flatMap((c) => c.goals),
];

// ---- Stamps ----

const stampAcq = (rawName: string) =>
  `stamps.acquisition.${rawName.replace(/^Stamp/, 'stamp-').toLowerCase()}`;
const STAMP_TABS: readonly StampTab[] = ['combat', 'skills', 'misc'];
const tabOf = (kb: Kb, rawName: string): StampTab => {
  const t = values(kb, stampAcq(rawName))?.tab;
  if (t === 'combat' || t === 'skills' || t === 'misc') return t;
  const letter = rawName.match(/^Stamp([ABC])/)?.[1];
  return letter === 'B' ? 'skills' : letter === 'C' ? 'misc' : 'combat';
};
const STATUS_RANK: Record<StampStatus, number> = {
  now: 0,
  active: 1,
  toward: 2,
  later: 3,
  unknown: 4,
  owned: 5,
};
/**
 * The stamps a stamps Goal is about, in its own order (M8's Checks, `collections/stamps.ts`). A
 * character's Goal names only that character's stamps (its quest, its drop, what it carries), so the
 * page's step and its "Next stamps" row point at the same stamp (final QA P2).
 */
function stampsOfGoal(g: Goal, ev: StampsEval): string[] {
  const id = g.id;
  const who = g.nextAction.key.match(/@c(\d+)$/);
  const index = who ? Number(who[1]) : null;
  const mine = (c: number | null) => index === null || c === index;
  const quests = (os: StampsEval['toward']) =>
    os.filter((o) => mine(o.character)).flatMap((o) => o.stamps.map((s) => s.rawName));
  if (id === 'stamps.check.shop-now') return ev.shopNow.map((s) => s.rawName);
  if (id === 'stamps.check.held-now')
    return ev.held.filter((h) => h.character === index).map((s) => s.rawName);
  if (id === 'stamps.check.handin-now') return quests(ev.handins);
  if (id === 'stamps.check.quest-toward')
    return index === null
      ? ev.soldOut.map((b) => b.rawName)
      : [...quests(ev.toward), ...ev.drops.filter((d) => d.character === index).map((d) => d.rawName)];
  if (id.startsWith('stamps.check.activeplay-'))
    return ev.active.flatMap((h) => h.stamps.map((s) => s.rawName));
  if (id === 'stamps.goal.collect') return ev.items.filter((s) => s.status === 'now').map((s) => s.rawName);
  return [];
}

export function stampsPicture(state: AccountState, kb: Kb, prior: EngineResult): StampsPicture | null {
  const lookup = { get: (id: string) => kb.entries[id] ?? kb.facts[id] };
  let ev: StampsEval;
  try {
    ev = evaluateStamps(state, lookup);
  } catch {
    return null;
  }
  if (ev.state !== 'ok') return null;
  const levels = state.account.stampLevels ?? {};
  const spend = state.account.spend?.stamps ?? null;
  const raises = new Set(
    (prior.account.spendPlan?.lines ?? []).flatMap((l) =>
      l.steps.filter((s) => s.sink === 'stamp' && s.material).map((s) => s.ref),
    ),
  );
  // The lit stamp and its Next Action key: the first stamps Goal that names a stamp.
  let litRaw: string | null = null;
  let litKey: string | null = null;
  for (const g of goalsInOrder(prior)) {
    if (g.system !== 'stamps') continue;
    const first = stampsOfGoal(g, ev).find(
      (r) => levels[r] && !(levels[r].level > 0 || levels[r].maxLevel > 0),
    );
    if (first) {
      litRaw = first;
      litKey = g.nextAction.key;
      break;
    }
  }
  // Every unowned stamp a stamps Goal names carries that Goal's key (the first in rank order), so the
  // page's step or a "See it" lights its own stamp (FR-S6).
  const keyOf = new Map<string, string>();
  for (const g of goalsInOrder(prior))
    if (g.system === 'stamps')
      for (const r of stampsOfGoal(g, ev)) if (!keyOf.has(r)) keyOf.set(r, g.nextAction.key);
  // Each stamps Goal's unowned stamps, in its own order: the page orders "Next stamps" by its steps.
  const byGoal: Record<string, string[]> = {};
  for (const g of goalsInOrder(prior))
    if (g.system === 'stamps')
      byGoal[g.nextAction.key] = stampsOfGoal(g, ev)
        .filter((r) => levels[r] && !(levels[r].level > 0 || levels[r].maxLevel > 0))
        .map((r) => `stamp-${r}`);
  const byRaw = new Map<string, StampAcquisition>(ev.items.map((s) => [s.rawName, s]));
  litRaw ??= ev.items.find((s) => s.status === 'now')?.rawName ?? null;
  const elements: StampTile[] = ev.items.map((s) => {
    const lv = levels[s.rawName];
    const own = spend?.find((x) => x.id === s.rawName);
    const status = s.status as StampStatus;
    return {
      id: `stamp-${s.rawName}`,
      actionKey:
        s.status === 'owned' ? null : (keyOf.get(s.rawName) ?? (s.rawName === litRaw ? litKey : null)),
      rawName: s.rawName,
      name: human(lv?.name ?? s.name),
      tab: tabOf(kb, s.rawName),
      level: lv?.level ?? 0,
      cap: lv?.maxLevel ?? 0,
      status,
      route: status === 'owned' ? null : ((s.best?.kind as StampRoute | undefined) ?? null),
      nextCoins: own?.nextCoinCost ?? null,
      raiseInPlan: raises.has(stampAcq(s.rawName)),
    };
  });
  const order = (a: StampTile, b: StampTile) => STATUS_RANK[a.status] - STATUS_RANK[b.status];
  const unowned = elements.filter((t) => t.status !== 'owned').sort(order);
  const litId = litRaw && byRaw.has(litRaw) ? `stamp-${litRaw}` : null;
  const next = [
    ...(litId ? [litId] : []),
    ...unowned
      .filter((t) => t.id !== litId && t.status !== 'later' && t.status !== 'unknown')
      .map((t) => t.id),
  ].slice(0, 3);
  return {
    systemId: 'stamps',
    kind: 'stamps',
    elements,
    lit: litId,
    owned: elements.filter((t) => t.status === 'owned').length,
    total: elements.length,
    tabs: STAMP_TABS.map((tab) => {
      const xs = elements.filter((t) => t.tab === tab);
      return { tab, owned: xs.filter((t) => t.status === 'owned').length, total: xs.length };
    }),
    next,
    byGoal,
  };
}

// ---- Statues ----

const firstLine = (prior: EngineResult, sink: SpendLine['steps'][number]['sink']) =>
  (prior.account.spendPlan?.lines ?? []).find((l) => l.steps.some((s) => s.sink === sink)) ?? null;
const refIndex = (ref: string): number | null => {
  const m = ref.match(/-(\d+)$/);
  return m ? Number(m[1]) : null;
};

export function statuesPicture(state: AccountState, prior: EngineResult): StatuesPicture | null {
  const statues = state.account.statues;
  if (!statues || statues.length === 0) return null;
  const line = firstLine(prior, 'statue-gold');
  const step = line?.steps.find((s) => s.sink === 'statue-gold') ?? null;
  const litIndex = step ? refIndex(step.ref) : null;
  const goldRefs = new Set(
    (prior.account.spendPlan?.lines ?? []).flatMap((l) =>
      l.steps.filter((s) => s.sink === 'statue-gold').map((s) => s.ref),
    ),
  );
  const indices = state.characters.map((c) => c.index);
  const elements: StatueTile[] = statues.map((s) => ({
    id: `statue-${s.index}`,
    actionKey: line && s.index === litIndex ? spendLineKey(line) : null,
    index: s.index,
    name: titleCase(s.name),
    level: s.level,
    grade: s.grade,
    byCharacter: s.byCharacter,
    characterIndices: s.byCharacter ? indices.slice(0, s.byCharacter.length) : [],
    goldCoins: s.index === litIndex ? (step?.coins ?? null) : null,
    goldInPlan: goldRefs.has(`statues.acquisition.statue-${s.index}`),
  }));
  return {
    systemId: 'statues',
    kind: 'statues',
    elements,
    lit: litIndex !== null && elements.some((e) => e.index === litIndex) ? `statue-${litIndex}` : null,
    gold: elements.filter((e) => e.grade >= 1).length,
    onyx: elements.filter((e) => e.grade >= 2).length,
  };
}

// ---- Upgrade Vault ----

export function vaultPicture(state: AccountState, kb: Kb, prior: EngineResult): VaultPicture | null {
  const vault = state.account.spend?.vault;
  if (!vault || vault.rows.length === 0) return null;
  const line = firstLine(prior, 'vault');
  const step = line?.steps.find((s) => s.sink === 'vault') ?? null;
  const litIndex = step ? refIndex(step.ref) : null;
  const elements: VaultFloorRow[] = vault.rows.map((r) => {
    const at = values(kb, `upgrade-vault.acquisition.row-${r.index}`)?.unlockLevel;
    const unlockAt = typeof at === 'number' ? at : 0;
    const maxed = r.level >= r.maxLevel;
    return {
      id: `vault-${r.index}`,
      actionKey: line && r.index === litIndex ? spendLineKey(line) : null,
      index: r.index,
      name: human(r.name),
      level: r.level,
      maxLevel: r.maxLevel,
      unlockAt,
      open: r.buyable,
      nextCoins: r.buyable && !maxed ? r.nextCost : null,
    };
  });
  return {
    systemId: 'upgrade-vault',
    kind: 'vault',
    elements,
    lit: litIndex !== null && elements.some((e) => e.index === litIndex) ? `vault-${litIndex}` : null,
    totalLevels: vault.totalLevels,
    nextUnlock: vault.nextUnlock
      ? { levels: Math.max(0, vault.nextUnlock.at - vault.totalLevels), name: human(vault.nextUnlock.name) }
      : null,
  };
}

// ---- 3D Printer ----

/** M14's printer Goal key (walkthrough/module.ts: `${ENTRY.printer}@account`). */
export const PRINTER_GOAL_KEY = 'printer.check.slot-plan@account';

export function printerPicture(
  state: AccountState,
  plan: PrinterSlotPlan | null,
  itemName: (rawName: string) => string,
  changeText: (characterIndex: number) => string | null,
): PrinterPicture | null {
  const p = state.account.printer;
  if (!p || p.level <= 0) return null;
  const printing = [...state.characters.map((c) => c.index)].sort((a, b) => a - b).slice(0, p.level);
  const change = new Map((plan?.changes ?? []).map((c) => [c.characterIndex, c]));
  const elements = printing.flatMap((i) => {
    const pc = p.characters.find((c) => c.characterIndex === i);
    const active = pc?.active ?? [];
    const ch = change.get(i) ?? null;
    const slots = Math.max(1, p.activeSlots);
    return Array.from({ length: slots }, (_, k) => {
      const s = active[k] ?? null;
      // M14 changes one sample per character: the one it replaces, else the first slot.
      const changed =
        ch !== null && (ch.replaces ? s?.rawName === ch.replaces : k === 0) ? (ch as typeof ch) : null;
      return {
        id: `printer-${i}-${k}`,
        actionKey: changed ? PRINTER_GOAL_KEY : null,
        characterIndex: i,
        item: s ? human(s.name) : null,
        perHour: s ? s.perHour : null,
        changeTo: changed ? itemName(changed.item) : null,
        changeText: changed ? changeText(i) : null,
      };
    });
  });
  const lit = elements.find((e) => e.changeTo !== null)?.id ?? null;
  return { systemId: 'printer', kind: 'printer', elements, lit, level: p.level, activeSlots: p.activeSlots };
}
