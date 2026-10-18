// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8 stamp acquisition (FR-1 to FR-12): one status per obtainable stamp from the best of its routes,
// ranked now > active > toward > later, plus the groupings the Checks render (the shop trip, one
// hand-in per quest, held stamp items, Active Play quests, toward lines). Pure.
import { type AccountState, type CharacterState, isKnown } from '@idleon-forge/account-state';
import {
  type FactLookup,
  factRows,
  human,
  type ItemReq,
  M8,
  type QuestRoute,
  type StampEntry,
  shopTowns,
  stampEntries,
} from './knowledge';
import {
  and,
  holdings,
  holdingsKnown,
  placeLabel,
  previousKey,
  type QuestStanding,
  questStanding,
  slotsNeeded,
  who,
} from './routes';
import type { AcqStatus, Requirement, RouteEval, StampAcquisition } from './types';

type ItemNeed = Extract<Requirement, { kind: 'item' }>;

export interface ShopBuy {
  rawName: string;
  name: string;
  shop: number;
  town: string;
  world: number;
  priority: number;
}

export interface QuestOpportunity {
  quest: QuestRoute;
  /** Unowned, obtainable stamps this quest gives, in Priority List order. */
  stamps: { rawName: string; name: string; entryId: string }[];
  priority: number;
  status: Exclude<AcqStatus, 'owned'>;
  /** FR-10's pick among the characters with the quest accepted or acceptable. */
  character: number | null;
  /** Every character with it accepted or acceptable. */
  candidates: number[];
  needs: ItemNeed[];
  /** Custom quest thresholds the save measures (Papua Piggea 4: total stamp levels). */
  measured: { desc: string; target: number; progress: number } | null;
  /** TR-6: free slots the pick lacks for the hand-in, or 0. */
  slotsShort: number;
  /** D4: items this hand-in consumes that also pay for another System. */
  shared: { item: string; system: string }[];
  lookAhead: { quest: QuestRoute; stamps: string[]; items: string[] } | null;
}

export interface HeldStamp {
  rawName: string;
  name: string;
  /** The character carrying it, or null when it is in storage. */
  character: number | null;
}

export interface DropLine {
  rawName: string;
  name: string;
  character: number;
  monster: string;
  etaSeconds: number | null;
}

export interface StampsEval {
  /** `locked`: before Mr Pigibank; `unknown`: a section M8 needs failed (FR-26). */
  state: 'locked' | 'unknown' | 'ok';
  unlockLevel: number;
  owned: number;
  obtainable: number;
  byStatus: Record<AcqStatus, number>;
  items: StampAcquisition[];
  lv0: string[];
  shopNow: ShopBuy[];
  soldOut: ShopBuy[];
  handins: QuestOpportunity[];
  active: QuestOpportunity[];
  toward: QuestOpportunity[];
  held: HeldStamp[];
  drops: DropLine[];
  /** Fields read, for provenance. */
  fields: string[];
}

const FIELDS = [
  'account.stampLevels',
  'account.currentWorld',
  'account.shopStock',
  'account.storageItems',
  'account.refineryStorage',
  'account.heldItemTypes',
  'account.highestLevel',
  'characters[*].quests',
  'characters[*].inventoryItems',
  'characters[*].freeInventorySlots',
  'characters[*].carryPerSlot',
  'characters[*].smithingLevel',
  'characters[*].targetMonster',
  'characters[*].afk',
  'characters[*].level',
];

const EMPTY: Record<AcqStatus, number> = { owned: 0, now: 0, active: 0, toward: 0, later: 0, unknown: 0 };
const RANK: Record<Exclude<AcqStatus, 'owned'>, number> = {
  now: 0,
  active: 1,
  toward: 2,
  later: 3,
  unknown: 4,
};

const owns = (s: { level: number; maxLevel: number } | undefined) => !!s && (s.level > 0 || s.maxLevel > 0);

/** "XxX_Cattleprod_XxX2" -> "XxX Cattleprod XxX 2". */
export const questLabel = (q: QuestRoute) => `${human(q.npc)} ${q.questOrder + 1}`;

function pickCharacter(
  state: AccountState,
  candidates: CharacterState[],
  needs: readonly ItemNeed[],
  spaces: number,
): CharacterState | null {
  const carries = (c: CharacterState) => needs.every((n) => (c.inventoryItems?.[n.rawName] ?? 0) >= n.amount);
  const fits = (c: CharacterState) => (c.freeInventorySlots ?? 0) >= slotsNeeded(state, c, needs, spaces);
  return (
    [...candidates].sort(
      (a, b) =>
        Number(carries(b)) - Number(carries(a)) ||
        Number(fits(b)) - Number(fits(a)) ||
        b.level - a.level ||
        a.index - b.index,
    )[0] ?? null
  );
}

/** Evaluates every stamp route for the account. */
export function evaluateStamps(state: AccountState, kb: FactLookup): StampsEval {
  const unlockLevel = (factRows<{ stamps: number }>(kb, M8.townUnlocks) ?? { stamps: 14 }).stamps;
  const base: StampsEval = {
    state: 'ok',
    unlockLevel,
    owned: 0,
    obtainable: 0,
    byStatus: { ...EMPTY },
    items: [],
    lv0: [],
    shopNow: [],
    soldOut: [],
    handins: [],
    active: [],
    toward: [],
    held: [],
    drops: [],
    fields: FIELDS,
  };
  const levels = state.account.stampLevels;
  if (!isKnown(state, 'account.stampLevels') || !levels) return { ...base, state: 'unknown' };
  const unobtainable = new Set(factRows<string[]>(kb, M8.unobtainable));
  const catalogue = Object.keys(levels).filter((r) => !unobtainable.has(r));
  const ownedSet = new Set(catalogue.filter((r) => owns(levels[r])));
  base.owned = ownedSet.size;
  base.obtainable = catalogue.length;
  base.lv0 = Object.entries(levels)
    .filter(([, s]) => s.maxLevel > 0 && s.level === 0)
    .map(([r]) => r)
    .sort();
  const highest = state.account.highestLevel ?? Math.max(0, ...state.characters.map((c) => c.level));
  if (highest < unlockLevel) return { ...base, state: 'locked' };

  const entries = stampEntries(kb);
  const priority = new Map<string, number>(entries.map((e, i) => [e.rawName, i]));
  const byRaw = new Map<string, StampEntry>(entries.map((e) => [e.rawName, e]));
  const towns = shopTowns(entries);
  const world = state.account.currentWorld;
  const reached = (w: number | null) => w !== null && world !== null && w <= world;
  const shared = new Map(Object.entries(factRows<Record<string, string>>(kb, M8.sharedResources)));
  const holdOk = holdingsKnown(state);
  const questsOk = state.characters.every((c) => isKnown(state, `characters[${c.index}].quests`));
  const stockOk = isKnown(state, 'account.shopStock') && !!state.account.shopStock;

  // The generated quest order M8 ships: `${npc}#${order}` -> quest key.
  const questKeys = new Map<string, string>();
  for (const e of entries)
    for (const r of e.routes) if (r.kind === 'quest') questKeys.set(`${r.npc}#${r.questOrder}`, r.questKey);

  const evals = new Map<string, RouteEval[]>();
  const push = (raw: string, r: RouteEval) => evals.set(raw, [...(evals.get(raw) ?? []), r]);
  const unowned = (raw: string) => !ownedSet.has(raw) && !unobtainable.has(raw);

  // FR-2a: a stamp item already held beats every route.
  for (const raw of catalogue) {
    if (!unowned(raw) || !holdOk) continue;
    const h = holdings(state, raw);
    if (h.total <= 0) continue;
    const carrier = state.characters.find((c) => (c.inventoryItems?.[raw] ?? 0) > 0) ?? null;
    base.held.push({ rawName: raw, name: levels[raw]?.name ?? raw, character: carrier?.index ?? null });
    push(raw, {
      routeIndex: -1,
      kind: 'held',
      status: 'now',
      character: carrier?.index ?? null,
      requirements: [],
      etaSeconds: null,
      lookAhead: null,
    });
  }

  // FR-3: town shops.
  for (const e of entries) {
    if (!unowned(e.rawName)) continue;
    e.routes.forEach((r, routeIndex) => {
      if (r.kind !== 'shop') return;
      if (!reached(r.world)) {
        push(e.rawName, { ...blank(routeIndex, 'shop'), status: world === null ? 'unknown' : 'later' });
        return;
      }
      if (!stockOk) {
        push(e.rawName, { ...blank(routeIndex, 'shop'), status: 'unknown' });
        return;
      }
      const amount = state.account.shopStock?.[r.shop]?.[e.rawName] ?? 0;
      const buy: ShopBuy = {
        rawName: e.rawName,
        name: e.name,
        shop: r.shop,
        town: r.town,
        world: r.world as number,
        priority: priority.get(e.rawName) ?? 0,
      };
      if (amount > 0) base.shopNow.push(buy);
      else base.soldOut.push(buy);
      push(e.rawName, {
        ...blank(routeIndex, 'shop'),
        status: amount > 0 ? 'now' : 'toward',
        requirements: [
          { kind: 'world', world: r.world as number },
          { kind: 'stock', inStock: amount > 0 },
          { kind: 'coins', amount: r.price, bestHolder: null },
        ],
      });
    });
  }

  // FR-4 to FR-8: quests, one opportunity per quest (a quest can give several stamps).
  const opportunities = new Map<string, QuestOpportunity>();
  for (const e of entries)
    e.routes.forEach((r) => {
      if (r.kind !== 'quest' || !unowned(e.rawName)) return;
      const o = opportunities.get(r.questName);
      const stamp = { rawName: e.rawName, name: e.name, entryId: e.id };
      if (o) o.stamps.push(stamp);
      else
        opportunities.set(r.questName, {
          quest: r,
          stamps: [stamp],
          priority: priority.get(e.rawName) ?? 0,
          status: 'later',
          character: null,
          candidates: [],
          needs: [],
          measured: null,
          slotsShort: 0,
          shared: [],
          lookAhead: null,
        });
    });

  const totalStampLevels = Object.values(levels).reduce((n, s) => n + s.level, 0);
  const needOf = (i: ItemReq, times = 1): ItemNeed => {
    const h = holdings(state, i.rawName);
    return {
      kind: 'item',
      rawName: i.rawName,
      name: i.name,
      amount: i.amount * times,
      held: h.total,
      where: h.where,
    };
  };
  const smithing = Math.max(0, ...state.characters.map((c) => c.smithingLevel ?? 0));
  const soldIn = (raw: string) => {
    for (const [shop, stock] of (state.account.shopStock ?? []).entries()) {
      const t = towns.get(shop);
      if ((stock?.[raw] ?? 0) > 0 && t && reached(t.world)) return { shop, town: t.town };
    }
    return null;
  };

  for (const o of opportunities.values()) {
    const q = o.quest;
    if (!reached(q.world)) {
      o.status = world === null ? 'unknown' : 'later';
      continue;
    }
    if (!questsOk) {
      o.status = 'unknown';
      continue;
    }
    const prev = previousKey(state, q.npc, q.questOrder, questKeys);
    const standing = new Map<number, QuestStanding>(
      state.characters.map((c) => [c.index, questStanding(c, q.npc, q.questKey, prev)]),
    );
    const cands = state.characters.filter((c) => {
      const s = standing.get(c.index);
      return s === 'accepted' || s === 'acceptable';
    });
    o.candidates = cands.map((c) => c.index);
    if (cands.length === 0) continue; // later: the quest is two or more steps away, or done elsewhere.
    o.shared = q.requires.flatMap((i) => {
      const system = shared.get(i.rawName);
      return system ? [{ item: i.name, system }] : [];
    });

    if (q.questType === 'Custom') {
      const stampLv = q.custom.find((x) => /stamp lv/i.test(x.desc));
      if (stampLv) {
        o.measured = { desc: stampLv.desc, target: stampLv.value, progress: totalStampLevels };
        o.status = 'toward';
      } else o.status = 'active';
      const best = pickCharacter(state, cands, [], q.inventorySpacesNeeded);
      o.character = best?.index ?? null;
      o.lookAhead = lookAheadOf(state, entries, q, holdOk);
      continue;
    }
    if (!holdOk) {
      o.status = 'unknown';
      continue;
    }
    let met = true;
    o.needs = q.requires.map((i) => {
      const need = needOf(i);
      if (need.held >= need.amount) return need;
      const short = need.amount - need.held;
      const craft = i.craft;
      if (craft && smithing >= craft.lvReqToCraft) {
        const materials = craft.materials.map((m) => {
          const n = needOf({ ...m, kind: 'item' }, short);
          return { rawName: m.rawName, name: m.name, amount: n.amount, held: n.held };
        });
        if (materials.every((m) => m.held >= m.amount))
          return { ...need, craft: { materials, level: craft.lvReqToCraft } };
      }
      const shop = soldIn(i.rawName);
      if (shop) return { ...need, buyAt: shop };
      met = false;
      return need;
    });
    const best = pickCharacter(state, cands, o.needs, q.inventorySpacesNeeded);
    o.character = best?.index ?? null;
    // TR-6's carry caveat is for a hand-in the account can make now; a gap is gathered first anyway.
    if (best && met) {
      const short =
        slotsNeeded(state, best, o.needs, q.inventorySpacesNeeded) - (best.freeInventorySlots ?? 0);
      o.slotsShort = Math.max(0, short);
    }
    o.status = met ? 'now' : 'toward';
    if (met) o.lookAhead = lookAheadOf(state, entries, q, holdOk);
  }

  for (const o of opportunities.values()) {
    for (const s of o.stamps)
      push(s.rawName, {
        routeIndex:
          byRaw
            .get(s.rawName)
            ?.routes.findIndex((r) => r.kind === 'quest' && r.questName === o.quest.questName) ?? -1,
        kind: o.needs.some((n) => n.buyAt)
          ? 'buyThenQuest'
          : o.needs.some((n) => n.craft)
            ? 'craft'
            : 'quest',
        status: o.status,
        character: o.character,
        requirements: [...o.needs, ...(o.measured ? [custom(o.measured)] : [])],
        etaSeconds: null,
        lookAhead: o.lookAhead
          ? { questName: o.lookAhead.quest.questName, rewards: o.lookAhead.stamps }
          : null,
      });
    if (o.status === 'now') base.handins.push(o);
    else if (o.status === 'active') base.active.push(o);
    else if (o.status === 'toward') base.toward.push(o);
  }

  // FR-12: a drop on a character's current AFK Target (fighting only gets an ETA, at base rate).
  for (const e of entries) {
    if (!unowned(e.rawName)) continue;
    e.routes.forEach((r, routeIndex) => {
      if (r.kind !== 'drop' || !reached(r.world)) return;
      for (const c of state.characters) {
        if (c.targetMonster !== r.monster) continue;
        const kph = c.afkType === 'FIGHTING' ? (c.afk?.fighting?.finalKillsPerHour ?? null) : null;
        const eta = kph && kph > 0 && r.chance > 0 ? Math.round(3600 / (kph * r.chance)) : null;
        base.drops.push({
          rawName: e.rawName,
          name: e.name,
          character: c.index,
          monster: r.monster,
          etaSeconds: eta,
        });
        push(e.rawName, {
          ...blank(routeIndex, 'drop'),
          status: 'toward',
          character: c.index,
          etaSeconds: eta,
        });
      }
    });
  }

  const items: StampAcquisition[] = catalogue.map((raw) => {
    const e = byRaw.get(raw);
    const entryId = e?.id ?? `stamps.acquisition.${raw.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase()}`;
    const name = e?.name ?? levels[raw]?.name ?? raw;
    if (ownedSet.has(raw))
      return {
        entryId,
        rawName: raw,
        name,
        status: 'owned',
        best: null,
        others: [],
        provenance: prov(entryId),
      };
    const routes = [...(evals.get(raw) ?? [])].sort((a, b) => RANK[a.status] - RANK[b.status]);
    const [best = null, ...others] = routes;
    return {
      entryId,
      rawName: raw,
      name,
      status: best?.status ?? 'later',
      best,
      others,
      provenance: prov(entryId),
    };
  });
  for (const i of items) base.byStatus[i.status] += 1;
  base.items = items;
  base.shopNow.sort((a, b) => a.world - b.world || a.shop - b.shop || a.priority - b.priority);
  base.handins.sort((a, b) => a.priority - b.priority);
  base.active.sort((a, b) => a.priority - b.priority);
  base.toward.sort((a, b) => a.priority - b.priority);
  return base;
}

const prov = (entryId: string) => ({ entryIds: [entryId], fields: FIELDS });
const blank = (routeIndex: number, kind: RouteEval['kind']): RouteEval => ({
  routeIndex,
  kind,
  status: 'later',
  character: null,
  requirements: [],
  etaSeconds: null,
  lookAhead: null,
});
const custom = (m: { desc: string; target: number; progress: number }): Requirement => ({
  kind: 'custom',
  desc: m.desc,
  target: m.target,
  progress: m.progress,
});

/** FR-7: the same NPC's next quest, when it is a hand-in whose items the account already holds. One step only. */
function lookAheadOf(
  state: AccountState,
  entries: readonly StampEntry[],
  q: QuestRoute,
  holdOk: boolean,
): QuestOpportunity['lookAhead'] {
  if (!holdOk) return null;
  let next: QuestRoute | null = null;
  const stamps: string[] = [];
  for (const e of entries)
    for (const r of e.routes)
      if (r.kind === 'quest' && r.npc === q.npc && r.questOrder === q.questOrder + 1) {
        next = r;
        stamps.push(e.name);
      }
  if (next?.questType !== 'ItemsAndSpaceRequired' || next.requires.length === 0) return null;
  if (!next.requires.every((i) => holdings(state, i.rawName).total >= i.amount)) return null;
  return { quest: next, stamps, items: next.requires.map((i) => i.name) };
}

// ---- text pieces the Detectors put in slots (the entry templates hold every other word) ----

const count = (n: number, name: string) => (n === 1 ? `the ${name}` : `${n.toLocaleString('en-US')} ${name}`);
const a = (n: number, name: string) => (n === 1 ? `a ${name}` : `${n.toLocaleString('en-US')} ${name}`);

/** The hand-in's single instruction (FR-4, FR-5, TR-6), naming where the items are. */
export function handInAction(state: AccountState, o: QuestOpportunity): string {
  const npc = human(o.quest.npc);
  const c = state.characters.find((x) => x.index === o.character);
  const own = (n: ItemNeed) => (c?.inventoryItems?.[n.rawName] ?? 0) >= n.amount;
  if (o.needs.length > 0 && o.needs.every(own))
    return `Give ${npc} ${and(o.needs.map((n) => count(n.amount, n.name)))} you're carrying`;
  const steps: string[] = [];
  const bring: string[] = [];
  for (const n of o.needs) {
    if (n.craft) {
      const mats = and(n.craft.materials.map((m) => `${m.amount.toLocaleString('en-US')} ${m.name}`));
      steps.push(`Craft ${a(n.amount - n.held, n.name)} at the Anvil (${mats})`);
    } else if (n.buyAt) steps.push(`Buy ${a(n.amount - n.held, n.name)} at the ${human(n.buyAt.town)} shop`);
    else if (!own(n)) {
      const h = holdings(state, n.rawName);
      const places = h.where.map((p) => placeLabel(state, p));
      bring.push(`${n.amount.toLocaleString('en-US')} ${n.name} (from ${and(places)})`);
    }
  }
  if (bring.length) steps.push(`Take ${and(bring)}`);
  const it = o.needs.length === 1 && o.needs[0]?.amount === 1 ? 'it' : 'them';
  return `${steps.join(', ')}, then give ${it} to ${npc}`;
}

/** D4 and TR-6 notes, joined; empty when none. */
export function questNote(o: QuestOpportunity): string {
  const notes: string[] = [];
  for (const s of o.shared) notes.push(`uses ${s.item}, which also pays for ${s.system}`);
  if (o.slotsShort > 0)
    notes.push(
      `needs ${o.slotsShort} more free inventory slots; carry it in several trips or raise carry capacity`,
    );
  return notes.length ? ` (${notes.join('; ')})` : '';
}

/** "17 of 30 Redox Salts", "333 of 500 Total Stamp Lv". */
export function questGap(o: QuestOpportunity): string {
  if (o.measured)
    return `${o.measured.progress.toLocaleString('en-US')} of ${o.measured.target.toLocaleString('en-US')} ${o.measured.desc.replace(/:$/, '').toLowerCase()}`;
  return o.needs
    .filter((n) => n.held < n.amount && !n.craft && !n.buyAt)
    .map((n) => `${n.held.toLocaleString('en-US')} of ${n.amount.toLocaleString('en-US')} ${n.name}`)
    .join(', ');
}

export const stampNames = (o: QuestOpportunity) => and(o.stamps.map((s) => human(s.name)));

/** FR-7's look-ahead line, with TR-6's carry caveat for big hand-ins. */
export function lookAheadText(state: AccountState, o: QuestOpportunity): string {
  const l = o.lookAhead;
  if (!l) return '';
  const c = state.characters.find((x) => x.index === o.character);
  const needs = l.quest.requires.map((i) => ({ ...i, held: 0, where: [] }) as ItemNeed);
  const short = c
    ? slotsNeeded(state, c, needs, l.quest.inventorySpacesNeeded) - (c.freeInventorySlots ?? 0)
    : 0;
  const amount = l.quest.requires[0]?.amount ?? 0;
  const items =
    l.quest.requires.length > 1 && l.quest.requires.every((i) => i.amount === amount)
      ? `${amount.toLocaleString('en-US')} ${and(l.quest.requires.map((i) => i.name))}`
      : and(l.quest.requires.map((i) => `${i.amount.toLocaleString('en-US')} ${i.name}`));
  const carry = short > 0 ? `, but it needs ${short} more free inventory slots` : '';
  return `; then: ${questLabel(l.quest)} gives ${and(l.stamps.map(human))}, and you already hold the ${items}${carry}`;
}

export { who };
