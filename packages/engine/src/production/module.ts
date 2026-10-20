// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C (Wave C) as one engine step, `production` (docs/specs/M26-crafting-guidance.md FR-C3 to
// FR-C12). It runs after every other module (it reads the Gear Plan and the shown Goals) and writes
// `EngineResult.production`: each character's Production Plan rows (its anvil, craft next, its printer
// slots), the pieces several characters want, the Anvil page's Recipes and Walkthrough tabs and its
// answer. It adds no Goal and no Now card in Wave C: the rows are read on the Character's Now tab, the
// Anvil page and #production. Deterministic: `now` is the input's, nothing reads the clock.
//
// Demand (7.1), one list in this order: the shown Walkthroughs (M14, unchanged), the next anvil tab's
// tree (page scope only, never fed back to Now), each character's craft-next piece (Visit Order).
import { type AccountState, anvilPlanWindow, type CharacterState } from '@idleon-forge/account-state';
import type { SlotValue } from '@idleon-forge/knowledge';
import { aboutDuration } from '@idleon-forge/knowledge/template';
import type { EngineInput, EngineModule, ModuleOutput } from '../core/module';
import { gearFacts } from '../gear/kb';
import { runMetaPath } from '../metapath';
import type { MetaPathResult } from '../metapath/types';
import type { EngineResult, WalkthroughView } from '../result';
import { planWalkthroughs, type WalkthroughParent, who } from '../walkthrough/build';
import { anvilTabItem, missingLeaves } from '../walkthrough/expand';
import { holdingsOf, totalOf } from '../walkthrough/holdings';
import {
  anvilRecipes,
  human,
  itemId,
  itemOf,
  say,
  type WalkthroughKnowledge,
} from '../walkthrough/knowledge';
import { parentsOf, walkthroughValues } from '../walkthrough/module';
import { leafEffort, unratedCount } from '../walkthrough/plan';
import type { ReqNode, WalkthroughResult } from '../walkthrough/types';
import { type AnvilProduct, planAnvil, ratioText } from './anvil';
import { type CraftCandidate, craftCandidates, craftNextOf, Holdings, sharedCrafts } from './craft';
import { recipeGate, systemHref, tabGate, tabReadiness } from './gates';
import { recipeLookups, recipeTabs } from './recipes';
import type {
  AccountLever,
  CraftShared,
  NextTabView,
  ProductionResult,
  ProductionRow,
  ProductionStep,
} from './types';

/** A material whose missing leaves include one with no source or no time estimate (FR-C12). */
export const NO_ESTIMATE = 'no estimate';
export const ENTRY = {
  anvil: 'production-plan.check.anvil-switch',
  craft: 'gear.check.craft-next',
  nextTab: 'anvil.check.next-tab',
  hammers: 'anvil.check.hammers',
  printer: 'printer.check.slot-plan',
} as const;
export const FACT = { products: 'production-plan.fact.anvil-exp' } as const;
/** C-Q1: switch only at this much more EXP (values.keepRatio overrides it). */
export const KEEP_RATIO = 1.1;
/** The last W1-W4 tab a Walkthrough is built for (Tab 5 is the W5 gate, parent N1). */
export const LAST_TAB = 4;

export interface ProductionModuleDeps {
  kb: WalkthroughKnowledge;
}

type Slots = Record<string, SlotValue>;

/** "A, B or C" / "A and B". */
const list = (xs: string[], last: 'or' | 'and') =>
  xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} ${last} ${xs[xs.length - 1]}`;
const n0 = (x: number) => Math.round(x).toLocaleString('en-US');
const plural = (name: string) => (/s$/.test(name) ? name : `${name}s`);

export function productsOf(kb: WalkthroughKnowledge): Array<AnvilProduct & { name: string }> {
  const rows = kb.facts[FACT.products]?.rows as Array<AnvilProduct & { name: string }> | undefined;
  return Array.isArray(rows) ? rows : [];
}

/** The tab Walkthrough parent (FR-C4): the next tab not owned, up to Tab 4. */
export function nextTabOf(state: AccountState): number | null {
  const owned = state.account.anvilTabsOwned;
  if (owned === null || owned === undefined) return null;
  return owned < LAST_TAB ? owned + 1 : null;
}

const hasAnvilGate = (n: ReqNode): boolean =>
  (n.kind === 'gate' && (n.gate === 'anvil-tab' || n.gate === 'smithing')) || n.children.some(hasAnvilGate);

export interface BuildInput {
  state: AccountState;
  kb: WalkthroughKnowledge;
  prior: EngineResult;
  meta: MetaPathResult | null;
  expectedReturnSeconds: number;
}

export function buildProduction(input: BuildInput): ProductionResult | null {
  const { state, kb, prior, meta } = input;
  const products = productsOf(kb);
  if (products.length === 0) return null;
  const s = (id: string, key: string, slots: Slots = {}) => say(kb, id, key, slots) ?? '';
  const sa = (key: string, slots: Slots = {}) => s(ENTRY.anvil, key, slots);
  const keepRatio = (() => {
    const v = kb.entries[ENTRY.anvil]?.values.keepRatio;
    return typeof v === 'number' && v >= 1 ? v : KEEP_RATIO;
  })();
  const hours = input.expectedReturnSeconds / 3600;
  const values = walkthroughValues(kb, input.expectedReturnSeconds);
  const chars = [...state.characters].sort((a, b) => a.index - b.index);
  const byIndex = new Map(chars.map((c) => [c.index, c]));
  const order = prior.visitOrder.length ? prior.visitOrder : chars.map((c) => c.index);

  // 7.1 (1): the shown Walkthroughs, exactly as M14 builds them (the printer plan reads only these).
  const shown = parentsOf(prior, kb, meta);
  const runShown: WalkthroughResult = planWalkthroughs({ state, kb, meta, prior, values, parents: shown });
  // 7.1 (2): the next anvil tab, in the Anvil page's scope only.
  const tab = nextTabOf(state);
  const tabParent: WalkthroughParent | null =
    tab !== null && kb.entries[itemId(anvilTabItem(tab))]
      ? {
          key: `${ENTRY.nextTab}@account`,
          entryId: ENTRY.nextTab,
          subject: 'account',
          title: `Anvil Tab ${tab}`,
          targetId: itemId(anvilTabItem(tab)),
        }
      : null;
  const runTab = tabParent
    ? planWalkthroughs({ state, kb, meta, prior, values, parents: [tabParent] })
    : null;

  // Demand by rawName, with its source (lower rank first) and what it is for.
  const demand = new Map<string, number>();
  const source = new Map<string, { rank: number; target: string }>();
  const titleOf = new Map(shown.map((p) => [p.key, p.title]));
  const claimed = new Map<string, number>();
  const addDemand = (raw: string, missing: number, rank: number, target: string) => {
    if (missing <= 0) return;
    demand.set(raw, (demand.get(raw) ?? 0) + missing);
    if (!source.has(raw)) source.set(raw, { rank, target });
  };
  for (const d of runShown.demand)
    addDemand(d.rawName, d.missing, 0, titleOf.get(d.byParent[0]?.key ?? '') ?? 'a Walkthrough');
  for (const d of runTab?.demand ?? []) addDemand(d.rawName, d.missing, 1, `Anvil Tab ${tab}`);
  // Holdings the shown Walkthroughs and the next tab use are not counted again for craft next.
  const claim = (w: WalkthroughResult | null) => {
    for (const b of w?.walkthroughs ?? []) {
      const walk = (n: ReqNode) => {
        if (n.kind === 'item') claimed.set(n.rawName, (claimed.get(n.rawName) ?? 0) + n.held - (n.worn ?? 0));
        n.children.forEach(walk);
      };
      walk(b.tree);
    }
  };
  claim(runShown);
  claim(runTab);

  // FR-C10: craft next and the shared pieces.
  const holdings = new Holdings(state, claimed);
  const cands = prior.gear ? craftCandidates(state, kb, prior.gear, holdings) : [];
  const picks = craftNextOf(cands);
  const shared = sharedCrafts(state, kb, cands, holdings);
  // 7.1 (3): each craft-next piece's missing materials, in Visit Order.
  for (const i of order) {
    const p = picks.get(i);
    if (!p) continue;
    for (const m of p.materials) addDemand(m.rawName, m.need - m.held, 2, p.name);
  }

  const rows: ProductionRow[] = [];
  const ladder = gearFacts(kb)?.ladder;
  const nameOf = (raw: string) =>
    products.find((p) => p.rawName === raw)?.name ??
    anvilRecipes(kb)[raw]?.name ??
    ladder?.get(raw)?.name ??
    itemOf(kb, raw)?.name ??
    human(raw);
  const productName = (i: number) => products[i]?.name ?? `product ${i}`;

  // ---- the anvil rows (FR-C7, FR-C8), save order (7.3) ----
  const stamp = state.account.stampLevels?.StampB3 ?? null;
  let sumBest = 0;
  let sumCurrent = 0;
  let switching = 0;
  let total = 0;
  const keeps: number[] = [];
  for (const c of chars) {
    const a = c.anvil;
    const key = `anvil@c${c.index}`;
    const claimKey = `anvil:products@c${c.index}`;
    if (!a || a.capacity === null || !c.anvilSpeed || c.smithingLevel == null) {
      if (a === null || c.anvilSpeed === null)
        rows.push(
          row(c, key, 'anvil', 'unknown', sa('unknown'), sa('why-unknown'), null, null, claimKey, 50),
        );
      continue;
    }
    total++;
    const capacity = a.capacity;
    const plan = planAnvil({
      hammers: a.hammers,
      stock: a.stock,
      capacity,
      speed: c.anvilSpeed,
      smithingLevel: c.smithingLevel,
      hours,
      products,
      demand,
      sourceOf: (raw) => source.get(raw) ?? null,
      keepRatio,
    });
    const m = 1 + (a.expBonus ?? 0) / 100;
    sumCurrent += plan.currentExp * m;
    sumBest += (plan.kind === 'keep' ? plan.currentExp : plan.bestExp) * m;
    const names = plan.to.map((p) => (p < 0 ? '-' : productName(p)));
    const free = a.hammers.filter((h) => h < 0).length;
    const hammersWord = (k: number) => sa(k === 1 ? 'hammer' : 'hammers');

    let kind: ProductionRow['kind'] = plan.kind;
    let text: string;
    let why: string;
    let chip: ProductionRow['chip'] = null;
    if (plan.kind === 'demand' && plan.demand) {
      const p = plan.demand;
      const perHour = c.anvilSpeed / (products[p.product]?.requiredAmount ?? 1);
      const time = Math.ceil((p.missing / (perHour * p.hammers)) * 4) / 4;
      text = sa('demand', {
        n: p.hammers,
        hammers: hammersWord(p.hammers),
        product: productName(p.product),
        target: p.target,
      });
      why = sa('why-demand', {
        target: p.target,
        missing: Math.ceil(p.missing),
        product: productName(p.product),
        time,
        n: p.hammers,
        hammers: hammersWord(p.hammers),
      });
      chip = { text: sa('chip-demand', { missing: Math.ceil(p.missing) }), tone: 'gold' };
    } else if (plan.kind === 'switch') {
      text =
        free > 0
          ? sa('free', { n: free, hammers: hammersWord(free) })
          : sa('switch', { products: list(names, 'and') });
      if (free > 0) kind = 'free-hammer';
      const idle = [...new Set(a.hammers.filter((h) => h >= 0 && !plan.to.includes(h)))]
        .map((h) => products[h])
        .filter((p) => !!p);
      const whys: string[] = [];
      if (free > 0) whys.push(sa('why-free', { used: a.hammers.length - free, n: a.hammers.length }));
      if (idle.length)
        whys.push(
          sa('why-idle', {
            products: list(
              idle.map((p) => p?.name ?? ''),
              'or',
            ),
            held: list(
              idle.map((p) => n0(totalOf(holdingsOf(state, p?.rawName ?? '')))),
              'and',
            ),
          }),
        );
      if (plan.topCaps) whys.push(sa('why-cap', { product: productName(plan.topCaps.product), capacity }));
      why = whys.join(' ');
      if (plan.currentExp > 0)
        chip = { text: sa('chip-ratio', { ratio: ratioText(plan.bestExp / plan.currentExp) }), tone: 'gold' };
    } else {
      text = sa('keep', { products: list(names, 'and') });
      why =
        plan.bestExp > plan.currentExp + 1e-6
          ? sa('why-keep', { pct: `${Math.round((keepRatio - 1) * 100)}%` })
          : sa('why-keep-best');
      chip = { text: sa('chip-keep'), tone: 'mint' };
    }
    if (plan.kind === 'keep') keeps.push(c.index);
    else switching++;

    // A full product leads the row (US-C5b); the switch becomes its first step.
    const full = a.hammers
      .filter((h, i, xs) => h >= 0 && xs.indexOf(h) === i)
      .find((h) => (a.stock[h] ?? 0) >= capacity);
    const steps: ProductionStep[] = [];
    if (full !== undefined) {
      steps.push({
        key: `${key}:switch-line`,
        text,
        tone: plan.kind === 'keep' ? 'done' : 'todo',
        icon: products[plan.to[0] ?? 0]?.rawName ?? null,
        link: null,
      });
      why = `${sa('why-capped', { amount: a.stock[full] ?? 0, capacity })} ${why}`.trim();
      text = sa('capped', { product: productName(full) });
      kind = 'capped';
      chip = { text: sa('chip-full'), tone: 'gold' };
    }
    if (plan.kind !== 'keep')
      steps.push({
        key: `${key}:switch`,
        text: sa('step-switch'),
        tone: 'todo',
        icon: products[plan.to[0] ?? 0]?.rawName ?? null,
        link: null,
      });
    // FR-C8 speed-ups: the Anvil Zoomer stamp, Hammer Hammer, unspent anvil points.
    if (stamp && stamp.maxLevel > 0 && a.speedStampNext) {
      const pct = `${(Math.round((a.speedStampNext / c.anvilSpeed - 1) * 1000) / 10).toFixed(1)}%`;
      const atCap = stamp.level >= stamp.maxLevel;
      steps.push({
        key: 'stamps:cap:StampB3',
        text: sa(atCap ? 'detail-step-stamp-cap' : 'detail-step-stamp', {
          level: stamp.level,
          max: stamp.maxLevel,
          pct,
        }),
        tone: 'todo',
        icon: 'StampB3',
        link: { label: sa('link-stamps'), href: '#system-stamps' },
      });
    }
    const hh = a.speedParts?.hammerHammer ?? 0;
    const hhLevel = state.account.alchemyPlan?.bubbleLevels.quicc?.[2] ?? null;
    steps.push(
      hh > 0
        ? {
            key: `${key}:hammer-hammer`,
            text: sa('step-hh-on'),
            tone: 'done',
            icon: 'aUpgradesG2',
            link: null,
          }
        : hhLevel !== null && hhLevel > 0
          ? {
              key: `${key}:hammer-hammer`,
              text: sa('step-hh-equip'),
              tone: 'todo',
              icon: 'aUpgradesG2',
              link: { label: sa('link-alchemy'), href: '#system-alchemy-bubbles' },
            }
          : {
              key: `${key}:hammer-hammer`,
              text: sa('step-hh-locked'),
              tone: 'display',
              icon: 'aUpgradesG2',
              link: { label: sa('link-alchemy'), href: '#system-alchemy-bubbles' },
            },
    );
    const unspent = c.anvilPointsAvailable ?? 0;
    if (unspent > 0) {
      const w = c.afk?.anvilPlan
        ? anvilPlanWindow(c.afk.anvilPlan, input.expectedReturnSeconds * 1000)
        : null;
      const sp = w?.spend;
      const where =
        sp && sp.capacity > 0 && sp.speed > 0
          ? 'Speed and Capacity'
          : sp && sp.capacity > 0
            ? 'Capacity'
            : 'Speed';
      steps.push({
        key: `anvil:points@c${c.index}`,
        text: sa('step-points', {
          n: unspent,
          points: sa(unspent === 1 ? 'point' : 'points'),
          them: sa(unspent === 1 ? 'it' : 'them'),
          where,
        }),
        tone: 'todo',
        icon: null,
        link: { label: sa('link-points'), href: systemHref('anvil', 'points', `c${c.index}`) },
      });
    }

    const r = row(
      c,
      key,
      'anvil',
      kind,
      text,
      why || null,
      chip,
      products[plan.to[0] ?? 0]?.rawName ?? null,
      claimKey,
      kind === 'demand' ? 0 : kind === 'keep' ? 30 : 10,
    );
    r.quiet = kind === 'keep';
    r.steps = steps;
    r.hammers = plan.to.map((to, h) => ({
      from: a.hammers[h] ?? -1,
      to,
      made: Math.floor(plan.made[h] ?? 0),
      room: Math.floor(plan.room[h] ?? 0),
      shared: to >= 0 && plan.to.filter((x) => x === to).length > 1,
    }));
    rows.push(r);
  }

  // ---- craft next (FR-C10) ----
  const sc = (key: string, slots: Slots = {}) => s(ENTRY.craft, key, slots);
  const sharedOf = new Map<string, CraftShared>();
  const sharedOut: CraftShared[] = shared.map((x) => {
    const gate = recipeGate(state, kb, x.rawName, x.name) ?? tabGate(state, kb, x.tab);
    const k = x.who.length;
    const enough =
      x.enough >= k
        ? sc('detail-enough-all', { k })
        : sc('detail-enough-some', {
            n: x.enough,
            k,
            item: nameOf(x.short?.rawName ?? ''),
            held: x.short?.held ?? 0,
            need: x.short?.need ?? 0,
          });
    const whoText = list(
      x.who.map((i) => (byIndex.get(i) ? who(byIndex.get(i) as CharacterState) : `c${i}`)),
      'and',
    );
    const out: CraftShared = {
      key: `gear:craft-shared:${x.rawName}`,
      rawName: x.rawName,
      name: x.name,
      text: sc('shared', { k, plural: plural(x.name) }),
      detail: sc('detail-shared', { who: whoText, enough }),
      who: x.who,
      enough: x.enough,
      gate,
    };
    sharedOf.set(x.rawName, out);
    return out;
  });
  const sharedFor = (i: number, exclude: string): CraftShared | null =>
    sharedOut.find((x) => x.who.includes(i) && x.rawName !== exclude) ?? null;
  for (const c of chars) {
    if (!prior.gear?.characters.some((g) => g.index === c.index)) continue;
    const p: CraftCandidate | undefined = picks.get(c.index);
    const key = `craft@c${c.index}`;
    const claimKey = `gear:craft@c${c.index}`;
    if (!p) {
      const r = row(c, key, 'craft-next', 'craft-none', sc('none'), sc('why-none'), null, null, claimKey, 40);
      r.quiet = true;
      rows.push(r);
      continue;
    }
    const missing = p.materials.filter((m) => m.held < m.need);
    const worn = p.materials.find((m) => m.worn);
    const behind =
      p.levelsBehind > 0 ? sc('why-behind', { slot: slotWord(p.slot), n: p.levelsBehind }) : null;
    const held =
      missing.length === 0
        ? worn
          ? sc('why-held-worn', { worn: nameOf(worn.rawName) })
          : sc('why-held')
        : missing
            .map((m) => sc('why-short', { missing: m.need - m.held, item: nameOf(m.rawName) }))
            .join(', ');
    const sh = sharedOf.get(p.rawName);
    const why = [held, behind].filter(Boolean).join(' · ');
    const r = row(
      c,
      key,
      'craft-next',
      'craft',
      sc('craft', { item: p.name }),
      why,
      missing.length === 0
        ? { text: sc('chip-ready'), tone: 'mint' }
        : { text: sc('chip-short', { n: missing.length }), tone: 'gold' },
      p.rawName,
      claimKey,
      missing.length === 0 ? 12 : 20,
    );
    r.gate = recipeGate(state, kb, p.rawName, p.name);
    const other = sh ?? sharedFor(c.index, p.rawName);
    if (other) {
      r.also = {
        text: sc(
          `${other.rawName === p.rawName ? 'detail-also' : 'detail-also-other'}${other.who.length === 2 ? '-one' : ''}`,
          { n: other.who.length - 1, k: other.who.length, plural: plural(other.name), item: other.name },
        ),
        label: sc('detail-also-label', { k: other.who.length, plural: plural(other.name) }),
        href: '#production',
      };
    }
    rows.push(r);
  }

  // ---- the printer row (FR-C11): M14's own plan, from the shown Walkthroughs only ----
  const pr = runShown.printer;
  const sp = (key: string, slots: Slots = {}) => s(ENTRY.printer, key, slots);
  for (const pc of state.account.printer?.characters ?? []) {
    const c = byIndex.get(pc.characterIndex);
    if (!c || pc.active.length === 0) continue;
    const change = pr?.changes.find((x) => x.characterIndex === c.index);
    const key = `printer@c${c.index}`;
    if (change) {
      const item = itemOf(kb, change.item)?.name ?? human(change.item);
      const text =
        change.action === 'swap-to-stored'
          ? sp('swap', { who: who(c), item })
          : sp('take-sample', { map: `map ${change.mapIndex ?? '?'}`, who: who(c), item });
      rows.push(
        row(c, key, 'printer', 'printer', text, null, null, change.item, `printer:slot@c${c.index}`, 15),
      );
      continue;
    }
    const names = [...new Set(pc.active.map((x) => human(x.name)))];
    const text =
      names.length === 1
        ? pc.active.length > 1
          ? sp('row-keep', { item: names[0] ?? '' })
          : sp('row-keep-one', { item: names[0] ?? '' })
        : sp('row-keep-mixed', { items: list(names, 'and') });
    const r = row(
      c,
      key,
      'printer',
      'keep',
      text,
      null,
      { text: sp('chip-keep'), tone: 'mint' },
      pc.active[0]?.rawName ?? null,
      null,
      35,
    );
    r.quiet = true;
    rows.push(r);
  }
  rows.sort(
    (a, b) =>
      order.indexOf(a.characterIndex) - order.indexOf(b.characterIndex) ||
      a.order - b.order ||
      (a.key < b.key ? -1 : 1),
  );

  // ---- the next tab (FR-C4) ----
  let nextTab: NextTabView | null = null;
  const sn = (key: string, slots: Slots = {}) => s(ENTRY.nextTab, key, slots);
  if (tab !== null) {
    const r = tabReadiness(state, kb, tab);
    const built = runTab?.walkthroughs[0] ?? null;
    const lv = anvilRecipes(kb)[anvilTabItem(tab)]?.lv ?? null;
    const known = chars.filter((c) => c.smithingLevel != null);
    // Each material's time, from the same missing leaves and efforts the Walkthrough's "slowest known
    // ... (n lack a time estimate)" counts (FR-C12): "no estimate" exactly where a leaf is unrated.
    const materialNodes = new Map<string, ReqNode>();
    for (const c of built?.tree.children ?? [])
      if (c.kind === 'item' && !materialNodes.has(c.rawName)) materialNodes.set(c.rawName, c);
    const etaOf = (raw: string): string | null => {
      const node = materialNodes.get(raw);
      if (!node) return null;
      const leaves = missingLeaves(node);
      if (leaves.length === 0) return null;
      const efforts = leaves.map((l) => leafEffort(l, l.supplies, values));
      if (unratedCount(efforts.map((effort) => ({ effort }))) > 0) return NO_ESTIMATE;
      const slowest = Math.max(...efforts.map((e) => e.seconds ?? 0));
      // 0 s is the plan's "doable now" (ore held to smelt, a shop to buy from), not a duration.
      if (slowest > 0) return aboutDuration(slowest);
      return efforts.every((e) => e.kind === 'smelt')
        ? 'smelt now'
        : efforts.every((e) => e.kind === 'buy')
          ? 'buy now'
          : 'now';
    };
    nextTab = {
      tab,
      rawName: anvilTabItem(tab),
      answer: sn('answer', { tab, ready: r.ready, of: r.of }),
      bottleneck: built ? built.view.collapsed.split(' · ').slice(1).join(' · ') || built.view.collapsed : '',
      ready: r.ready,
      of: r.of,
      smithing: { lv, best: known.length ? Math.max(...known.map((c) => c.smithingLevel ?? 0)) : null },
      materials: r.materials.map((m) => ({ ...m, name: nameOf(m.rawName), eta: etaOf(m.rawName) })),
      walkthrough: built?.view ?? null,
    };
  }

  // ---- the Anvil page's Walkthrough tab (FR-C1b, FR-C4) ----
  const walkthroughs: ProductionResult['walkthroughs'] = [];
  if (nextTab?.walkthrough)
    walkthroughs.push({ title: `Anvil Tab ${tab}`, subject: 'account', view: nextTab.walkthrough });
  for (const w of runShown.walkthroughs)
    if (hasAnvilGate(w.tree))
      walkthroughs.push({
        title: titleOf.get(w.parentKey) ?? w.targetId,
        subject: w.parentSubject,
        view: w.view,
      });

  // ---- account summary and levers (FR-C8: a lever on the whole account shows once) ----
  const ratio = sumCurrent > 0 ? sumBest / sumCurrent : null;
  const keepWho = list(
    keeps.map((i) => who(byIndex.get(i) as CharacterState)),
    'and',
  );
  const anvils = {
    line: switching > 0 ? sa('account-line', { switching, total }) : sa('account-none'),
    detail: [
      ratio !== null && switching > 0 ? sa('detail-account', { ratio: ratioText(ratio) }) : '',
      keeps.length && switching > 0 ? sa('detail-account-keeps', { who: keepWho }) : '',
    ]
      .filter(Boolean)
      .join('; '),
    switching,
    total,
    ratio,
  };
  const levers: AccountLever[] = [];
  const stampStep = rows.flatMap((r) => r.steps).find((x) => x.key === 'stamps:cap:StampB3');
  if (stampStep)
    levers.push({
      ...stampStep,
      text: stampStep.text.replace(/ \(each level[^)]*\)| each level.*$/, ''),
      tone: 'todo',
    });

  // ---- the page answer (section 8: a free hammer, a full product, the shared craft, the next tab) ----
  const freeRow = rows.find((r) => r.kind === 'free-hammer');
  const fullRow = rows.find((r) => r.kind === 'capped');
  const lead = (r: ProductionRow) => ({
    cap: 'Do this next',
    hero: r.text,
    sub: `${who(byIndex.get(r.characterIndex) as CharacterState)}: ${(r.why ?? '').split(/(?<=\.) /)[0]}`.trim(),
  });
  const top = sharedOut[0];
  const answer = freeRow
    ? lead(freeRow)
    : fullRow
      ? lead(fullRow)
      : top
        ? {
            cap: 'Do this next',
            hero: `${top.text} on tab ${top.gate.label.replace(/^Anvil tab /i, '')}`,
            sub: top.detail,
          }
        : nextTab
          ? { cap: 'Do this next', hero: nextTab.answer, sub: nextTab.bottleneck || null }
          : null;

  return {
    rows,
    shared: sharedOut,
    anvils,
    levers,
    tabs: recipeTabs(state, kb, prior.gear ?? null, cands, picks),
    nextTab,
    walkthroughs,
    answer,
    keepRatio,
    tabGates: [1, 2, 3, 4, 5].map((t) => tabGate(state, kb, t)),
    products: products.map((p) => ({ rawName: p.rawName, name: p.name })),
    ...recipeLookups(state, kb, nameOf),
  };
}

const SLOT_WORD: Readonly<Record<string, string>> = {
  ring1: 'ring',
  ring2: 'ring',
  rod: 'rod',
  net: 'net',
};
const slotWord = (slot: string) => SLOT_WORD[slot] ?? slot;

function row(
  c: CharacterState,
  key: string,
  producer: ProductionRow['producer'],
  kind: ProductionRow['kind'],
  text: string,
  why: string | null,
  chip: ProductionRow['chip'],
  icon: string | null,
  claim: string | null,
  order: number,
): ProductionRow {
  return {
    key,
    characterIndex: c.index,
    producer,
    kind,
    text,
    why,
    chip,
    icon,
    gate: null,
    hammers: [],
    steps: [],
    quiet: false,
    order,
    claim,
  };
}

export function createProductionModule(deps: ProductionModuleDeps): EngineModule {
  return {
    id: 'production',
    covers: [],
    dependsOnExpectedReturn: true,
    affectsVerdict: false,
    after: true,
    run(input: EngineInput, prior?: EngineResult): ModuleOutput {
      if (!prior) return {};
      let meta: MetaPathResult | null = null;
      const full = input.knowledge.kb;
      if (full)
        try {
          meta = runMetaPath(input.state, full, input.now);
        } catch {
          meta = null;
        }
      const production = buildProduction({
        state: input.state,
        kb: deps.kb,
        prior,
        meta,
        expectedReturnSeconds: input.options.expectedReturnSeconds,
      });
      return { production };
    },
  };
}

export type { WalkthroughView };
