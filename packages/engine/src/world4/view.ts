// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4: the read-only page data (types.ts) from the Account State's `lab`, `cooking` and `breeding`
// and the facts in facts.ts. Pure: the clock is `now`. Each page's framed answer says what the save
// shows first (a full nest, an idle kitchen, nobody uploaded) with how the game works; it never ranks or
// fires anything, and nothing here becomes a Goal (World 4 Detectors need their own spec).
import type {
  AccountState,
  BreedingState,
  CharacterState,
  CookingState,
  LabState,
} from '@idleon-forge/account-state';
import { formatCoins, formatDate, formatName, shortDuration, span } from '@idleon-forge/knowledge/template';
import { activityLabel, classLabel } from '../core/labels';
import type { ClassTree } from '../metapath/knowledge';
import {
  ARENA_LEVEL,
  ARENA_WAVES,
  BASE_MEAL_SPEED,
  CHIP_SLOT_LEVELS,
  EARLY_MEALS,
  EGG_SECONDS,
  ELITE_NOTE,
  ELITE_OF,
  FIRST_KITCHENS,
  GOBO_LADLES,
  GOBO_QUESTS,
  KITCHEN_PRICES,
  kitchenSpices,
  LAB_BEAM,
  LAB_OPENERS,
  labDistance,
  NODE_WORDS,
  PRISM,
  SHINY_LEVEL,
  SINGLE_SPICE_MEALS,
  SOURCES,
  SPICE_CLAIMS_A_DAY,
  UPGRADE_FACTS,
} from './facts';
import type {
  BreedingPageView,
  CookingPageView,
  KitchenTile,
  LabBoard,
  LabPageView,
  W4Frame,
  W4Row,
  World4View,
  World4Welcome,
} from './types';

/** The World 4 Systems with a read-only page (engine SYSTEM_HOMES ids). */
export const WORLD4_PAGES = ['lab', 'cooking', 'breeding'] as const;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const nice = (id: string) => formatName(id);
const who = (c: Pick<CharacterState, 'class' | 'level'>) => `${classLabel(c)} ${c.level}`;
/** 263 -> "263", 28800 -> "28,800", 2.4e7 -> "24M" (deterministic, no locale). */
const num = (n: number) => {
  const r = Math.round(n);
  if (r >= 1e6) return formatCoins(r).replace(' coins', '');
  return String(r).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
/** "+2% Total Damage" from Toolbox's "+{%_Total_Damage" and the per-level value. */
const bonusOf = (effect: string, value: number) =>
  nice(effect.replace('{', String(Math.round(value * 100) / 100)))
    .replace(/\s+/g, ' ')
    .trim();
const hours = (h: number) => (h * 3600 < 60 ? 'under a minute' : span(h * 3_600_000));

/** The elite a character's subclass becomes (the class tree when the KB loaded, else the wiki table). */
function eliteOf(cls: string, tree: ClassTree | null): string | null {
  if (!(cls in ELITE_OF)) return null;
  if (tree) {
    for (const row of tree.byName.values()) if (row.tier === 'elite' && row.promotesFrom === cls) return row.class;
  }
  return ELITE_OF[cls] ?? null;
}
/** Eliteus's six elites, or a class promoted from one of them. */
function isEliteOrLater(c: Pick<CharacterState, 'class'>, tree: ClassTree | null): boolean {
  return Object.values(ELITE_OF).some((e) => c.class === e || (tree?.isA(c.class, e) ?? false));
}
/** A character on one of the six subclass lines Eliteus serves. */
const onEliteLine = (c: Pick<CharacterState, 'class'>, tree: ClassTree | null) =>
  eliteOf(c.class, tree) !== null || isEliteOrLater(c, tree);

/** Copies of an item held: the storage chest plus every bag. */
function held(state: AccountState, rawName: string): number | null {
  const chest = state.account.storageItems;
  if (chest === null || chest === undefined) return null;
  let n = chest[rawName] ?? 0;
  for (const c of state.characters) n += c.inventoryItems?.[rawName] ?? 0;
  return n;
}

// ---------------------------------------------------------------- Laboratory

function labBoard(lab: LabState, chars: Map<number, CharacterState>): LabBoard {
  const connected = lab.characters.filter((c) => c.connected && chars.has(c.index));
  const uploaded = lab.characters.filter((c) => c.uploaded && chars.has(c.index));
  // The beam as a picture: prism to the nearest connected character, then each to its nearest linked one.
  const links: LabBoard['links'] = [];
  const linked: Array<{ x: number; y: number }> = [{ ...PRISM }];
  const left = [...connected];
  while (left.length > 0) {
    let best = 0;
    let from = linked[0] as { x: number; y: number };
    let bestD = Number.POSITIVE_INFINITY;
    left.forEach((c, i) => {
      for (const p of linked) {
        const d = labDistance(p.x, p.y, c.x, c.y);
        if (d < bestD) {
          bestD = d;
          best = i;
          from = p;
        }
      }
    });
    const [c] = left.splice(best, 1);
    if (!c) break;
    links.push({ x1: from.x, y1: from.y, x2: c.x, y2: c.y });
    linked.push({ x: c.x, y: c.y });
  }
  const next = nodesInReach(lab).find((n) => !n.lit);
  const nodes = lab.bonuses.map((b) => ({
    key: `node-${b.index}`,
    label: NODE_WORDS[b.name]?.short ?? nice(b.name),
    x: b.x,
    y: b.y,
    state: b.lit ? ('lit' as const) : b.index === next?.index ? ('next' as const) : ('off' as const),
  }));
  const jewels = lab.jewels.map((j) => ({
    key: `jewel-${j.index}`,
    x: j.x,
    y: j.y,
    owned: j.owned,
    lit: j.lit,
  }));
  const characters = uploaded.map((c) => {
    const ch = chars.get(c.index) as CharacterState;
    return { key: `c${c.index}`, label: who(ch), cls: ch.class, x: c.x, y: c.y, connected: c.connected };
  });
  const xs = [PRISM.x, ...nodes.map((n) => n.x), ...jewels.map((j) => j.x), ...characters.map((c) => c.x)];
  const ys = [PRISM.y, ...nodes.map((n) => n.y), ...jewels.map((j) => j.y), ...characters.map((c) => c.y)];
  const top = Math.min(...ys) - 40;
  const lit = lab.bonuses.filter((b) => b.lit).length;
  const summary = `${plural(uploaded.length, 'character')} uploaded · ${plural(connected.length, 'connected', 'connected')} · ${plural(lit, 'bonus', 'bonuses')} lit`;
  return {
    prism: { ...PRISM },
    links,
    reach: LAB_BEAM.reach,
    nodes,
    jewels,
    characters,
    left: 0,
    top,
    width: Math.max(...xs) + 80,
    height: Math.max(...ys) + 60 - top,
    summary,
    accessibleName: `Lab board: the prism at the left; ${summary}${next ? `; next to light: ${NODE_WORDS[next.name]?.short ?? nice(next.name)}` : ''}`,
  };
}

/** Mainframe bonuses in reach order: nearest to the prism first. */
function nodesInReach(lab: LabState) {
  return [...lab.bonuses]
    .map((b) => ({ ...b, dist: labDistance(PRISM.x, PRISM.y, b.x, b.y) }))
    .sort((a, b) => a.dist - b.dist);
}

export function buildLabPage(state: AccountState, lab: LabState, tree: ClassTree | null): LabPageView {
  const chars = new Map(state.characters.map((c) => [c.index, c]));
  const mine = lab.characters.filter((c) => chars.has(c.index));
  const uploaded = mine.filter((c) => c.uploaded);
  const connected = mine.filter((c) => c.connected);
  const ordered = nodesInReach(lab);
  const lit = ordered.filter((b) => b.lit).length;
  const next = ordered.find((b) => !b.lit);
  const short = (name: string) => NODE_WORDS[name]?.short ?? nice(name);
  const first = ordered[0];

  let frame: W4Frame;
  if (uploaded.length === 0) {
    const d = first ? Math.round(first.dist) : null;
    frame = {
      title: `Upload 2 characters and line them up toward ${first ? short(first.name) : 'the first bonus'}`,
      why: `That lights your first bonus and finishes Gobo's 5th quest. One character can't reach it${
        d !== null
          ? `: ${short(first?.name ?? '')} is ${d} px from the prism, and a new character's beam is ${LAB_BEAM.base} px`
          : ''
      }.`,
      value: '0',
      unit: 'of 2 uploaded',
      tone: 'gold',
      meter: 0,
      link: null,
    };
  } else if (connected.length === 0) {
    frame = {
      title: `Your ${plural(uploaded.length, 'uploaded character')} ${uploaded.length === 1 ? "doesn't" : "don't"} reach the prism`,
      why: 'A beam runs from the prism to a character within its beam width, then character to character. Move one closer to the prism in the Lab.',
      value: '0',
      unit: `of ${uploaded.length} connected`,
      tone: 'gold',
      meter: 0,
      link: null,
    };
  } else {
    frame = {
      title: next
        ? `${plural(lit, 'bonus', 'bonuses')} lit · next on the board: ${short(next.name)}`
        : `All ${plural(lit, 'bonus', 'bonuses')} lit`,
      why: next
        ? `${short(next.name)} is ${Math.round(next.dist)} px from the prism${NODE_WORDS[next.name]?.effect ? `: ${NODE_WORDS[next.name]?.effect}` : ''}. Every lit character reaches ${LAB_BEAM.reach} px around it.`
        : 'Every Mainframe bonus on the board is lit.',
      value: String(connected.length),
      unit: `of ${uploaded.length} connected`,
      tone: next ? 'gold' : 'mint',
      meter: connected.length / uploaded.length,
      link: null,
    };
  }

  const nodeRows: W4Row[] = ordered.slice(0, 8).map((b, i) => ({
    key: `node-${b.index}`,
    n: i + 1,
    name: nice(b.name),
    detail: NODE_WORDS[b.name]?.effect ?? '',
    extra: `${Math.round(b.dist)} px`,
    status: b.lit ? 'lit' : b.index === next?.index ? 'next to light' : 'later',
    tone: b.lit ? 'mint' : b.index === next?.index ? 'gold' : 'muted',
    quiet: !b.lit && b.index !== next?.index,
  }));

  const rows = [...mine].sort((a, b) => Number(b.uploaded) - Number(a.uploaded) || a.index - b.index);
  const characters = rows.map((c) => {
    const ch = chars.get(c.index) as CharacterState;
    const elite = eliteOf(ch.class, tree);
    const note = elite
      ? `becomes ${nice(elite)}${ELITE_NOTE[elite] ? `, ${ELITE_NOTE[elite]}` : ''}`
      : ELITE_NOTE[ch.class]
        ? nice(ELITE_NOTE[ch.class] as string).replace(/^The/, 'the')
        : classLabel(ch);
    return {
      key: `c${c.index}`,
      label: who(ch),
      cls: ch.class,
      note,
      labLevel: `Lab ${c.labLevel}`,
      now: c.uploaded
        ? c.connected
          ? 'in the Lab · connected'
          : 'in the Lab · not connected'
        : activityLabel(ch),
      tone: c.connected ? ('mint' as const) : c.uploaded ? ('gold' as const) : ('muted' as const),
    };
  });

  const chipsHave = held(state, 'Quest65');
  const jewelsHave = held(state, 'Quest66');
  const openers = [
    {
      key: 'repo',
      title: 'Chip Repository',
      badge: lab.repositoryOpen ? 'open' : 'locked',
      text: lab.repositoryOpen
        ? `Open. You own ${plural(lab.chipsOwned, 'chip')}; chips work wherever the character is, even outside the Lab.`
        : `Opens when you hold a stack of ${LAB_OPENERS.processorChips} Pile of Processor Chips, from the World 4 town shop.`,
      have: lab.repositoryOpen ? null : chipsHave,
      need: lab.repositoryOpen ? null : LAB_OPENERS.processorChips,
      open: lab.repositoryOpen,
    },
    {
      key: 'spinner',
      title: 'Jewel Spinner',
      badge: lab.spinnerOpen ? 'open' : 'locked',
      text: lab.spinnerOpen
        ? `Open. You own ${lab.jewels.filter((j) => j.owned).length} of ${lab.jewels.length} jewels; a jewel works only while lit.`
        : `Opens when you hold a stack of ${LAB_OPENERS.strungJewels} Strung Jewels from the same shop. Your first jewel then costs 5 more.`,
      have: lab.spinnerOpen ? null : jewelsHave,
      need: lab.spinnerOpen ? null : LAB_OPENERS.strungJewels,
      open: lab.spinnerOpen,
    },
  ];
  const slotsOpen = (lv: number) => CHIP_SLOT_LEVELS.filter((l) => lv >= l).length;
  const chipsBySlot = mine.map((c) => {
    const ch = chars.get(c.index) as CharacterState;
    return {
      key: `c${c.index}`,
      label: who(ch),
      cls: ch.class,
      slots: c.chips.map((x) => (x ? nice(x) : null)),
      open: slotsOpen(c.labLevel),
    };
  });
  const filled = mine.reduce((s, c) => s + c.chips.filter(Boolean).length, 0);
  const ownedJewels = lab.jewels.filter((j) => j.owned);
  const jewelRows: W4Row[] = ownedJewels.map((j) => ({
    key: `jewel-${j.index}`,
    name: nice(j.name),
    detail: '',
    status: j.lit ? 'lit' : 'not lit',
    tone: j.lit ? 'mint' : 'muted',
  }));
  const shop = lab.shop
    ? {
        week: `Week of ${formatDate(lab.shop.weekStart)} (your save's week)`,
        rows: lab.shop.items.map((x, i) => ({
          key: `shop-${i}`,
          name: nice(x.name),
          detail: x.kind,
          extra: x.cost.map((c) => `${num(c.amount)} ${nice(c.name)}`).join(' · '),
          status:
            x.kind === 'jewel'
              ? lab.spinnerOpen
                ? 'in the Spinner'
                : 'Spinner locked'
              : lab.repositoryOpen
                ? 'in the Repository'
                : 'Repository locked',
          tone: (x.kind === 'jewel' ? lab.spinnerOpen : lab.repositoryOpen)
            ? ('gold' as const)
            : ('muted' as const),
        })),
        note: 'Same shop for every player; new picks every Thursday 00:00 UTC, each buyable once a week.',
      }
    : null;
  return {
    frame,
    tabs: [
      { id: 'board', label: 'Board', badge: null },
      { id: 'chips', label: 'Chips', badge: `${filled} of ${mine.length * CHIP_SLOT_LEVELS.length} slots` },
      { id: 'jewels', label: 'Jewels', badge: `${ownedJewels.length} of ${lab.jewels.length}` },
      { id: 'shop', label: 'Weekly shop', badge: null },
    ],
    board: labBoard(lab, chars),
    boardNote: `Each Lab level adds ${LAB_BEAM.perLevel} px of beam to that character, so the same chain reaches further as they level. Pancakes (a meal) adds more.`,
    nodes: nodeRows,
    nodesNote: 'Distance is from the prism. A connected character lights any bonus within its reach.',
    characters,
    charactersLede:
      'An uploaded character counts only while its AFK target is the Lab, and then earns Lab EXP and nothing else: no kills, no skilling.',
    openers,
    slotLevels: CHIP_SLOT_LEVELS.map(String),
    chipsBySlot,
    jewelsLine: lab.spinnerOpen
      ? `${ownedJewels.length} of ${lab.jewels.length} owned · ${ownedJewels.filter((j) => j.lit).length} lit`
      : 'The Jewel Spinner is locked',
    jewels: jewelRows,
    shop,
    source: SOURCES.lab,
  };
}

// ---------------------------------------------------------------- Cooking

function richestWallet(state: AccountState): { label: string; coins: number } | null {
  const wallets = state.account.spend?.wallets ?? [];
  let best: { label: string; coins: number } | null = null;
  for (const w of wallets) {
    if (w.holder === 'bank') continue;
    const c = state.characters.find((x) => x.index === w.holder);
    if (c && (!best || w.coins > best.coins)) best = { label: who(c), coins: w.coins };
  }
  return best;
}

export function buildCookingPage(state: AccountState, ck: CookingState): CookingPageView {
  const owned = ck.kitchens.filter((k) => k.status !== 'locked');
  const idle = owned.filter((k) => k.status === 'idle');
  const cooking = owned.filter((k) => k.status === 'cooking');
  const recipe = owned.filter((k) => k.status === 'recipe');
  const found = ck.spices.filter((s) => s.held !== null);
  const spiceName = (i: number) => ck.spices[i]?.name ?? `Spice ${i + 1}`;
  const meals = new Map(ck.meals.map((m) => [m.name, m]));

  let frame: W4Frame;
  if (found.length === 0) {
    frame = {
      title: 'Get your first spice in Breeding, then put it in Kitchen 1',
      why: "Recipes need spices and you have none yet. Win the Grasslands Mob battle, claim its spice, and Grasslands alone discovers Turkey of Thank. Gobo's 3rd and 4th quests walk you through it.",
      value: '0',
      unit: 'spices held',
      tone: 'gold',
      meter: null,
      link: { label: 'Breeding: territories', system: 'breeding' },
    };
  } else if (idle.length > 0) {
    frame = {
      title:
        idle.length === 1
          ? `Kitchen ${(idle[0]?.index ?? 0) + 1} is idle`
          : `${idle.length} kitchens are idle: ${idle.map((k) => k.index + 1).join(', ')}`,
      why: 'An idle kitchen makes nothing. Start a meal, or a recipe with 1 to 4 spices to find a new meal.',
      value: String(idle.length),
      unit: `of ${owned.length} idle`,
      tone: 'coral',
      meter: idle.length / owned.length,
      link: null,
    };
  } else {
    frame = {
      title: `All ${plural(owned.length, 'kitchen')} busy`,
      why: `${cooking.length} cooking, ${recipe.length} looking for a new recipe. A kitchen on a recipe adds no meal speed.`,
      value: String(owned.length),
      unit: `of ${ck.kitchens.length} kitchens`,
      tone: 'mint',
      meter: owned.length / ck.kitchens.length,
      link: null,
    };
  }

  const wallet = richestWallet(state);
  const unbought = ck.kitchens.filter((k) => k.status === 'locked');
  const show = Math.min(ck.kitchens.length, Math.max(5, owned.length + 1));
  const kitchens: KitchenTile[] = ck.kitchens.slice(0, show).map((k) => {
    const [s, f, l] = kitchenSpices(k.index).map(spiceName) as [string, string, string];
    const up = (label: string, lv: number, spice: string) => ({
      label,
      value: k.status === 'locked' || lv === 0 ? spice : `Lv ${lv}`,
    });
    const upgrades = [up('Speed', k.speedLv, s), up('Fire', k.fireLv, f), up('Luck', k.luckLv, l)];
    if (k.status === 'locked') {
      const price = KITCHEN_PRICES[k.index - 1] ?? null;
      const order = unbought.indexOf(k);
      const soon = order < 3;
      const affordable = price !== null && wallet !== null && wallet.coins >= price;
      return {
        key: `k${k.index}`,
        n: k.index + 1,
        state:
          price === null
            ? 'not bought'
            : `${soon ? 'Buy · ' : ''}${formatCoins(price)}${soon ? '' : ' · later'}`,
        tone: soon ? 'gold' : 'muted',
        badge: soon ? (affordable ? 'can buy' : 'to buy') : 'later',
        upgrades,
        owned: false,
        lit: false,
      };
    }
    const byStatus = {
      idle: { state: 'Idle · nothing cooking', tone: 'coral' as const, badge: 'idle' },
      cooking: {
        state: `Cooking ${k.meal ? nice(k.meal) : 'a meal'}`,
        tone: 'mint' as const,
        badge: 'cooking',
      },
      recipe: { state: 'Finding a new recipe', tone: 'sky' as const, badge: 'recipe' },
    }[k.status];
    return {
      key: `k${k.index}`,
      n: k.index + 1,
      ...byStatus,
      upgrades,
      owned: true,
      lit: k.status === 'cooking',
    };
  });
  const nextBuys = unbought.slice(0, 3).filter((k) => KITCHEN_PRICES[k.index - 1] !== undefined);
  const sum = nextBuys.reduce((t, k) => t + (KITCHEN_PRICES[k.index - 1] ?? 0), 0);
  const laterBuys = unbought.slice(3);
  const buyLine =
    nextBuys.length > 0
      ? {
          title: `Kitchens ${nextBuys
            .map((k) => k.index + 1)
            .join(', ')
            .replace(/, (\d+)$/, ' and $1')} cost ${formatCoins(sum)} in all.`,
          detail: wallet
            ? `${wallet.label} carries ${formatCoins(wallet.coins)}. Each kitchen cooks on its own, all day.`
            : 'Coins only. Each kitchen cooks on its own, all day.',
          later:
            laterBuys.length > 0
              ? `Kitchens ${laterBuys[0] ? laterBuys[0].index + 1 : ''} to 10: ${laterBuys
                  .map((k) => formatCoins(KITCHEN_PRICES[k.index - 1] ?? 0).replace(' coins', ''))
                  .join(', ')} coins`
              : '',
        }
      : null;

  const spiceOf = (meal: string): number | null => {
    for (const [i, list] of Object.entries(SINGLE_SPICE_MEALS)) if (list.includes(meal)) return Number(i);
    return null;
  };
  const nextMeals = EARLY_MEALS.filter((m) => (meals.get(m)?.level ?? 0) === 0 && spiceOf(m) !== null)
    .slice(0, 3)
    .map((name, i) => {
      const m = meals.get(name);
      const sp = spiceOf(name) as number;
      const has = ck.spices[sp]?.held !== null && ck.spices[sp]?.held !== undefined;
      return {
        key: name,
        n: i + 1,
        name: nice(name),
        bonus: m ? `${bonusOf(m.effect, m.perLevel)} a level` : '',
        how: `${spiceName(sp)} alone${has ? ' · you have it' : ''}`,
      };
    });
  const speeds = owned.map((k) => k.mealSpeed ?? 0).filter((v) => v > 0);
  const speed = speeds.length > 0 ? Math.max(...speeds) : BASE_MEAL_SPEED;
  const fromSave = speeds.length > 0;
  const foundMeals = ck.meals.filter((m) => m.level > 0);
  const early = new Set<string>(EARLY_MEALS);
  const tableMeals = [
    ...EARLY_MEALS.flatMap((n) => (meals.get(n) ? [meals.get(n) as (typeof ck.meals)[number]] : [])),
    ...foundMeals.filter((m) => !early.has(m.name)),
  ];
  const mealRows = tableMeals.map((m) => {
    const sp = spiceOf(m.name);
    return {
      key: m.name,
      name: nice(m.name),
      bonus: bonusOf(m.effect, m.perLevel),
      spice: sp !== null ? spiceName(sp) : '',
      time: hours(m.cookReq / speed),
      level: String(m.level),
    };
  });
  const closest =
    foundMeals
      .filter((m) => m.level < ck.mealMaxLevel && m.levelCost > 0 && m.amount < m.levelCost)
      .map((m) => ({ m, r: m.amount / m.levelCost }))
      .sort((a, b) => b.r - a.r)[0]?.m ?? null;
  const spices = ck.spices.slice(0, Math.max(6, found.length + 1)).map((s) => {
    const uses: string[] = [];
    for (let k = 0; k < 10; k++) {
      const at = kitchenSpices(k).indexOf(s.index);
      if (at >= 0) uses.push(`Kitchen ${k + 1} ${['Speed', 'Fire', 'Luck'][at]}`);
    }
    const finds = SINGLE_SPICE_MEALS[s.index];
    return {
      key: `s${s.index}`,
      name: s.name,
      use: [uses.slice(0, 2).join(', '), finds ? `finds ${finds.map(nice).join(', ')}` : '']
        .filter(Boolean)
        .join(' · '),
      held: s.held === null ? 'not found' : num(s.held),
      found: s.held !== null,
    };
  });
  return {
    frame,
    tabs: [
      { id: 'kitchens', label: 'Kitchens', badge: `${owned.length} of ${ck.kitchens.length}` },
      { id: 'meals', label: 'Meals', badge: `${foundMeals.length} found` },
      { id: 'spices', label: 'Spices', badge: `${found.length} of ${ck.spices.length}` },
    ],
    kitchensLede: 'each upgrade costs one spice',
    kitchens,
    buyLine,
    nextMeals,
    mealsTitle: nextMeals.length > 0 ? 'Meals to find first' : 'Your meals',
    meals: mealRows,
    mealsTotal: ck.meals.length,
    mealsNote: fromSave
      ? `"1 copy in" is your fastest kitchen, at ${num(speed)} progress an hour. ${ck.meals.length} meals in all.`
      : `"1 copy in" is a brand-new kitchen at ${BASE_MEAL_SPEED} progress an hour; Speed upgrades, more kitchens and the Egg meal shorten it. ${ck.meals.length} meals in all.`,
    growth: [
      { label: 'Discover it', value: 'level 1' },
      { label: 'Level 1 to 2', value: '15 copies' },
      { label: 'Level 4 to 5', value: '115 copies' },
      { label: 'Highest level now', value: String(ck.mealMaxLevel) },
    ],
    closest: closest
      ? {
          name: `${nice(closest.name)} · level ${closest.level}`,
          have: closest.amount,
          need: closest.levelCost,
          text: `${num(closest.amount)} of ${num(closest.levelCost)} copies · level it on the Dinner Menu when the bar fills`,
        }
      : null,
    spicesLine: `${ck.claimsToday ?? 0} of ${SPICE_CLAIMS_A_DAY} claims today`,
    spices,
    spicesNote:
      "Each spice comes from the Breeding territory of the same name. A territory you haven't won locks that kitchen upgrade.",
    ladles: `One ladle pushes every kitchen 1 hour ahead; the whole stack goes at once. Gobo's quests give ${GOBO_LADLES}.`,
    source: SOURCES.cooking,
  };
}

// ---------------------------------------------------------------- Breeding

export function buildBreedingPage(br: BreedingState, ck: CookingState | null): BreedingPageView {
  const full = br.eggs >= br.eggCapacity;
  const toFull = Math.max(0, br.eggCapacity - br.eggs);
  const fillSeconds = toFull === 0 ? 0 : br.nextEggInSeconds + (toFull - 1) * EGG_SECONDS;
  const frame: W4Frame = full
    ? {
        title: `Your nest is full: hatch your ${plural(br.eggs, 'egg')}`,
        why: `A full nest stops laying.${br.speciesBred === 0 ? " The first hatch is always a Green Mushroom, which is Gobo's 1st quest." : ''} A new egg comes every 2 hours, so an empty nest is full again in ${shortDuration(br.eggCapacity * EGG_SECONDS)}.`,
        value: String(br.eggs),
        unit: `of ${plural(br.eggCapacity, 'egg')}`,
        tone: 'coral',
        meter: 1,
        link: null,
      }
    : {
        title: `${plural(br.eggs, 'egg')} in the nest · full ${fillSeconds > 0 ? `in ${span(fillSeconds * 1000)}` : 'now'}`,
        why: `A new egg comes every 2 hours${br.nextEggInSeconds > 0 ? `; the next one in ${span(br.nextEggInSeconds * 1000)}` : ''}. A full nest stops laying.`,
        value: String(br.eggs),
        unit: `of ${plural(br.eggCapacity, 'egg')}`,
        tone: 'sky',
        meter: br.eggs / br.eggCapacity,
        link: null,
      };
  const capUpgrade = br.upgrades.find((u) => u.name.startsWith('Egg_Capacity'));
  const nest = [
    ...Array.from({ length: br.eggCapacity }, (_, i) => ({
      key: `egg${i}`,
      state: i < br.eggs ? ('egg' as const) : ('empty' as const),
      label: i < br.eggs ? `egg ${i + 1}` : 'empty',
    })),
    ...(capUpgrade && capUpgrade.level < capUpgrade.maxLevel
      ? [
          {
            key: 'cap',
            state: 'locked' as const,
            label: `Egg Capacity +${capUpgrade.maxLevel - capUpgrade.level}`,
          },
        ]
      : []),
  ];
  const won = br.territories.filter((t) => t.status !== 'not-won');
  const firstNotWon = br.territories.findIndex((t) => t.status === 'not-won');
  const shownTo = Math.max(6, (firstNotWon < 0 ? br.territories.length : firstNotWon) + 3);
  const spiceUse = (i: number) => {
    const uses: string[] = [];
    for (let k = 0; k < 10; k++) {
      const at = kitchenSpices(k).indexOf(i);
      if (at >= 0) uses.push(`Kitchen ${k + 1} ${['Speed', 'Fire', 'Luck'][at]}`);
    }
    const finds = SINGLE_SPICE_MEALS[i];
    return [uses[0], finds ? finds.map(nice).join(', ') : ''].filter(Boolean).join(' · ');
  };
  const territories: W4Row[] = br.territories
    .slice(0, Math.min(br.territories.length, shownTo))
    .map((t, i) => {
      const isNext = i === firstNotWon;
      const held = ck?.spices[t.index]?.held;
      return {
        key: `t${t.index}`,
        n: i + 1,
        name: t.name,
        detail: `Battle: ${nice(t.battle)} · ${t.enemyHp < 1e4 ? num(t.enemyHp) : formatCoins(t.enemyHp).replace(' coins', '')} enemy HP in all`,
        extra: spiceUse(t.index),
        status:
          t.status === 'foraging'
            ? `foraging${held !== null && held !== undefined ? ` · ${num(held)} held` : ''}`
            : t.status === 'won'
              ? 'won · no team'
              : isNext
                ? 'win first'
                : 'later',
        tone: t.status === 'foraging' ? 'mint' : t.status === 'won' ? 'gold' : isNext ? 'gold' : 'muted',
        quiet: t.status === 'not-won' && !isNext,
      };
    });
  const open = br.level >= ARENA_LEVEL;
  const max = ARENA_WAVES[ARENA_WAVES.length - 1]?.wave ?? 200;
  const waves = ARENA_WAVES.map((w, i) => ({
    key: `w${w.wave}`,
    wave: `Wave ${w.wave}`,
    what: w.what,
    at: (i + 0.5) / ARENA_WAVES.length,
    key2: w.key === true,
    reached: br.arenaBestWave >= w.wave,
  }));
  const upgrades: W4Row[] = br.upgrades.slice(0, 9).map((u) => {
    const f = UPGRADE_FACTS.find((x) => u.name.startsWith(x.name));
    const opensAt = f?.opens ?? null;
    const isOpen = opensAt === null || br.level >= opensAt;
    return {
      key: `u${u.index}`,
      name: nice(u.name.split('_}')[0] ?? u.name),
      detail: f?.what ?? '',
      extra: opensAt !== null ? `Level ${opensAt}` : '',
      status: !isOpen ? `opens at level ${opensAt}` : `level ${u.level} of ${u.maxLevel}`,
      tone: !isOpen ? 'muted' : u.level >= u.maxLevel ? 'mint' : u.level === 0 ? 'gold' : 'muted',
      quiet: !isOpen,
    };
  });
  return {
    frame,
    tabs: [
      { id: 'nest', label: 'Nest and Mobs', badge: null },
      { id: 'territories', label: 'Territories', badge: `${won.length} of ${br.territories.length}` },
      {
        id: 'arena',
        label: 'Mob Arena',
        badge: open ? `best wave ${br.arenaBestWave}` : `at level ${ARENA_LEVEL}`,
      },
      { id: 'upgrades', label: 'Upgrades', badge: null },
    ],
    nest,
    nestLine: `1 egg every 2 hours · ${plural(br.speciesBred, 'Mob species', 'Mob species')} bred · ${num(br.deadDna)} Dead DNA`,
    nestNote:
      "Hatch every egg, keep the best Mob of each kind, and trash the rest: each trashed Mob gives 3 to 5 Dead DNA, which pays for upgrades. A Mob's power comes mostly from your Breeding level, so old Mobs get trashed as you level.",
    loopNote:
      'Every kitchen recipe and every Lab chip needs a spice, and spices only come from territories your Mobs forage. Every Breeding upgrade costs Dead DNA plus a meal.',
    territoriesTitle: 'Territories: win once, then forage',
    territoriesLine: `${won.length} of ${br.territories.length} won · each makes its own spice`,
    territories,
    forageNote:
      'Only Mobs with a forager gene add speed (Forager, Targeter, Fleeter and the like). Fighting genes add nothing since July 2025, so older guides that say "send your strongest" are out of date.',
    claimsNote: `Claim spices up to ${SPICE_CLAIMS_A_DAY} times a day; unclaimed claims are lost at reset.`,
    arenaLine: open
      ? `best wave ${br.arenaBestWave} · Breeding level ${br.level}`
      : `opens at Breeding level ${ARENA_LEVEL} · you are level ${br.level}`,
    arena: {
      waves,
      best: br.arenaBestWave,
      open,
      note: `Wave 35 halves kitchen upgrade costs; wave 100 gives a 3rd large Alchemy bubble.${br.arenaBestWave > max ? ` Your best is past wave ${max}.` : ''}`,
    },
    upgradesLine: 'each costs Dead DNA plus a meal',
    upgrades,
    mobsNote:
      'The World 4 row of Mobs opens after your first Massive Troll kill. Until then you breed the World 1 to 3 rows.',
    shinyNote: `Shiny Mobs open at Breeding level ${SHINY_LEVEL} with the Paint Bucket upgrade. Each shiny gives a small bonus everywhere and levels over weeks and months.`,
    source: SOURCES.breeding,
  };
}

// ---------------------------------------------------------------- The World 4 welcome

export function buildWelcome(state: AccountState, tree: ClassTree | null): World4Welcome | null {
  const gq = state.account.gateQuests ?? null;
  const gobo = GOBO_QUESTS.filter((q) => (gq?.[q]?.completedBy.length ?? 0) > 0).length;
  const lines = state.characters.filter((c) => onEliteLine(c, tree));
  const elites = lines.filter((c) => isEliteOrLater(c, tree)).length;
  const ck = state.account.cooking ?? null;
  const lab = state.account.lab ?? null;
  const kitchens = ck ? ck.kitchens.filter((k) => k.status !== 'locked').length : null;
  const uploaded = lab ? lab.characters.filter((c) => c.uploaded).length : null;
  const anyLit = lab ? lab.bonuses.some((b) => b.lit) : false;
  const steps: Array<Omit<World4Welcome['steps'][number], 'n' | 'now'>> = [
    {
      key: 'gobo',
      title: "Do Gobo's 5 quests in town",
      why: `He teaches Breeding, then Cooking, then the Lab, gives ${GOBO_LADLES} ladles and Mob Eggs, and opens the way out of town.`,
      progress: gq === null ? "can't tell" : `${gobo} of 5`,
      done: gobo === GOBO_QUESTS.length,
      home: { label: 'Breeding', system: 'breeding' },
    },
    {
      key: 'elites',
      title: 'Take every elite class at Eliteus',
      why: 'On map 4, Outskirts of Fallstar Isle. One elite per character, no choice, no level needed. It adds a 4th talent tab.',
      progress: `${elites} of ${lines.length}`,
      done: lines.length > 0 && elites === lines.length,
      home: { label: 'Map', system: null },
    },
    {
      key: 'kitchens',
      title: 'Buy kitchens 2, 3 and 4',
      why: `Coins only, ${formatCoins((KITCHEN_PRICES[0] ?? 0) + (KITCHEN_PRICES[1] ?? 0) + (KITCHEN_PRICES[2] ?? 0))} in all. Each kitchen cooks meals on its own, all day.`,
      progress:
        kitchens === null
          ? "can't tell"
          : `${Math.min(kitchens, FIRST_KITCHENS)} of ${FIRST_KITCHENS} kitchens`,
      done: kitchens !== null && kitchens >= FIRST_KITCHENS,
      home: { label: 'Cooking', system: 'cooking' },
    },
    {
      key: 'lab',
      title: 'Upload 2 characters to the Lab',
      why: "Line them up toward Animal Farm, the first bonus. One alone can't reach it.",
      progress:
        uploaded === null ? "can't tell" : anyLit ? 'a bonus is lit' : `${Math.min(uploaded, 2)} of 2`,
      done: anyLit,
      home: { label: 'Laboratory', system: 'lab' },
    },
    {
      key: 'openers',
      title: 'Hold 3 Pile of Processor Chips and 7 Strung Jewels',
      why: 'From the town shop. Holding them opens the Chip Repository and the Jewel Spinner for good.',
      progress:
        lab === null
          ? "can't tell"
          : [
              lab.repositoryOpen ? 'Repository open' : `${held(state, 'Quest65') ?? 0} of 3`,
              lab.spinnerOpen ? 'Spinner open' : `${held(state, 'Quest66') ?? 0} of 7`,
            ].join(' · '),
      done: lab !== null && lab.repositoryOpen && lab.spinnerOpen,
      home: { label: 'Laboratory', system: 'lab' },
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const firstOpen = steps.findIndex((s) => !s.done);
  return {
    title: 'World 4 is open. Set up these 5, in this order.',
    lede: 'Breeding, Cooking and the Lab only earn once they are running. Set them running before you push maps: they work while you fight.',
    badge: 'Set up first',
    place: 'World 4 · Hyperion Nebula',
    steps: steps.map((s, i) => ({ ...s, n: i + 1, now: i === firstOpen })),
    doneCount,
    source: [SOURCES.gobo, SOURCES.eliteus, SOURCES.lab, SOURCES.cooking, SOURCES.breeding],
  };
}

/** The whole World 4 view; `tree` is the KB's class tree when it loaded. */
export function buildWorld4View(state: AccountState, tree: ClassTree | null): World4View {
  const reached = state.account.finishedWorlds.includes(3);
  const { lab, cooking, breeding } = state.account;
  return {
    reached,
    readOnlyPages: reached ? [...WORLD4_PAGES] : [],
    welcome: reached ? buildWelcome(state, tree) : null,
    lab: lab ? buildLabPage(state, lab, tree) : null,
    cooking: cooking ? buildCookingPage(state, cooking) : null,
    breeding: breeding ? buildBreedingPage(breeding, cooking ?? null) : null,
  };
}
