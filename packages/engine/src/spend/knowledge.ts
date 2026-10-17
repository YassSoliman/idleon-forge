// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Spend Priority List of a Stage (M7 TR-6), resolved from the compiled Knowledge Base into the items
// the plan walks, with their positions. A position is a tier; an `include` is one position (M11's rule),
// so an included block is one tie. Earlier Stages' `carryForward` items that the Stage's own list doesn't
// name carry forward (M2 TR-13). Every Spend list is written on the frame's positions (TR-6), so a carried
// item keeps its frame position rather than going after the last one.
import { type Entry, type SourceT, STAGES, type StageId, type TierItemT } from '@idleon-forge/knowledge';

export type SpendItemT = Extract<TierItemT, { item: string }>;

export interface ResolvedSpendItem {
  /** `${listId}#${item}` (TR-6), the SpendLine.entryId. */
  entryId: string;
  listId: string;
  slug: string;
  position: number;
  ref: string;
  spend: SpendItemT['spend'];
  text: string;
  why: string;
  sources: SourceT[];
  confidence: 'H' | 'M' | 'L';
  contested: boolean;
  stale: boolean;
  carried: boolean;
}

export interface SpendKnowledge {
  entries: Readonly<Record<string, Entry>>;
  priorityByStage?: Partial<Record<StageId, { spend?: string }>>;
  /** CompiledKnowledge.stale. */
  stale?: readonly string[];
}

type PriorityT = Extract<Entry, { type: 'priority' }>;

const priority = (kb: SpendKnowledge, id: string | undefined): PriorityT | null => {
  const e = id ? kb.entries[id] : undefined;
  return e?.type === 'priority' ? e : null;
};

const ownListId = (kb: SpendKnowledge, stage: StageId): string | null => {
  const id = kb.priorityByStage?.[stage]?.spend ?? `spend.priority.${stage.toLowerCase()}`;
  return priority(kb, id)?.list === 'spend' ? id : null;
};

/**
 * The spend list for a Stage: its own, else the nearest earlier Stage's. Lists are authored per band of
 * Stages (the Vault dossier's stage tables), so W2-late reads the W2-mid list.
 */
export function spendListId(kb: SpendKnowledge, stage: StageId): string | null {
  for (const s of STAGES.slice(0, STAGES.indexOf(stage) + 1).reverse()) {
    const id = ownListId(kb, s);
    if (id) return id;
  }
  return null;
}

/** One list's spend items by tier, includes expanded in place (each include is one tier). */
function tiersOf(kb: SpendKnowledge, list: PriorityT): { listId: string; item: SpendItemT; tier: number }[] {
  const out: { listId: string; item: SpendItemT; tier: number }[] = [];
  list.tiers.forEach((tier, t) => {
    for (const x of tier) {
      if (typeof x !== 'object') continue;
      if ('include' in x) {
        const block = priority(kb, x.include);
        for (const bt of block?.tiers ?? [])
          for (const y of bt)
            if (typeof y === 'object' && 'item' in y) out.push({ listId: x.include, item: y, tier: t });
      } else if ('item' in x) out.push({ listId: list.id, item: x, tier: t });
    }
  });
  return out;
}

const resolved = (
  kb: SpendKnowledge,
  listId: string,
  item: SpendItemT,
  position: number,
  carried: boolean,
): ResolvedSpendItem => ({
  entryId: `${listId}#${item.item}`,
  listId,
  slug: item.item,
  position,
  ref: item.ref,
  spend: item.spend,
  text: item.text,
  why: item.why,
  sources: item.sources,
  confidence: item.confidence,
  contested: item.verification === 'contested',
  stale: kb.stale?.includes(listId) ?? false,
  carried,
});

/** The Stage's items in position order (1-based), carried-forward items last. null without a list. */
export function resolveSpendList(kb: SpendKnowledge, stage: StageId): ResolvedSpendItem[] | null {
  const listId = spendListId(kb, stage);
  const list = priority(kb, listId ?? undefined);
  if (!list || !listId) return null;
  const own = tiersOf(kb, list).map(({ listId: l, item, tier }) => resolved(kb, l, item, tier + 1, false));
  // A list's own item supersedes an earlier one for the same purchase; a sweep (`every-*`) only by slug.
  const keyOf = (i: { spend: { sink: string }; ref: string; slug: string }) =>
    i.slug.startsWith('every-') ? `${i.spend.sink}|${i.slug}` : `${i.spend.sink}|${i.ref}`;
  const named = new Set(own.map(keyOf));
  const last = list.tiers.length;
  const carried: ResolvedSpendItem[] = [];
  const seen = new Set<string>();
  const lists = new Set<string>([listId]);
  for (const earlier of STAGES.slice(0, STAGES.indexOf(stage)).reverse()) {
    const id = ownListId(kb, earlier);
    if (!id || lists.has(id)) continue;
    lists.add(id);
    const other = priority(kb, id);
    if (!other) continue;
    for (const { listId: l, item, tier } of tiersOf(kb, other)) {
      if (!item.carryForward) continue;
      const key = keyOf({ spend: item.spend, ref: item.ref, slug: item.item });
      if (named.has(key) || seen.has(key)) continue;
      seen.add(key);
      // The Spend lists share the frame's positions (spend.yaml), so a carried item keeps its own.
      carried.push(resolved(kb, l, item, Math.min(tier + 1, last), true));
    }
  }
  return [...own, ...carried];
}
