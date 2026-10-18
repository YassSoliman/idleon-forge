// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Cards view model (M8 "Cards view", owner request 2026-10-18; docs/specs/M8-collections.md):
//   1. every card preset as a row of slots (cards with their effect at their level, empty slots, the
//      equipped set on the active preset), marked with the activities it fits by M8's keyword rule;
//   2. the best preset from OWNED cards for the AFK Target and the character's other Role activity
//      (FR-13's ranking, FR-14's set), as a diff ("Swap X → Y") against the preset that does that job;
//   3. the cards worth getting or levelling next from the class's card list (`cardCandidates`), only
//      where the drop map is reachable now (M14's reachable maps, M2's Stage world, the current world),
//      with the base chance, mean kills and hours per character (M14's Supply method);
//   4. one overview row per character and a merged account list.
// Every number is a Toolbox value or arithmetic on one (ADR 0005): the chance is the drop table's base
// chance, ×5 while the account owns none (the game's LootDropOddsReset, cards dossier, H), and never the
// card drop multiplier, which Toolbox doesn't compute; so an ETA is a mean at base chance, a ceiling
// ("likely sooner"). Drop Rate (Toolbox getDropRate) doesn't enter: the game multiplies card entries by
// the card drop multiplier, not by Drop Rate. Pure and deterministic.
import type { AccountState, CardSetState, CharacterState } from '@idleon-forge/account-state';
import { STAGE_DEFINITIONS } from '@idleon-forge/knowledge';
import { assignRoles } from '../metapath/roles';
import { analyzeRoster } from '../metapath/roster';
import { detectStage } from '../metapath/stage';
import type { SourceRef } from '../result';
import {
  activityName,
  CARD_ACTIVITIES,
  type CardActivity,
  type CardFacts,
  cardCandidates,
  cardLevel,
  isPassive,
  type Keywords,
  presetFits,
  pusherIndex,
  rankOwnedCards,
  recommendedSet,
  setBonus,
} from './cards';
import type {
  CardChip,
  CardSetChip,
  CardSwap,
  CardsView,
  CharacterCards,
  GrindItem,
  PresetRecommendation,
  PresetRow,
} from './cards-view-types';
import { type FactLookup, factRows, human, M8 } from './knowledge';
import { and, plural, who } from './routes';

/** The generated card table (packages/knowledge/generators/card-drops.gen.ts). */
export const CARD_DROPS = 'cards.fact.drops';
export const MAPS = 'maps.fact.maps';
export const NODES = 'skills.fact.nodes';

export interface CardDropRow {
  name: string;
  effect: string;
  bonus: number;
  perTier: number;
  set: string;
  chance: number;
  monster: string | null;
  afkType: string | null;
  maps: number[];
}
interface MapRow {
  index: number;
  name: string;
  world: number;
  afkType: string | null;
  target: string | null;
  listed: boolean;
}

/** The game's ×5 card chance while the account owns none (N.js LootDropOddsReset, cards dossier, H). */
export const UNOWNED_MULTIPLIER = 5;
/** A grind line at or under this many hours counts as a quick win and is listed first. */
export const QUICK_HOURS = 24;
/** Base card levels every account reaches (Toolbox calculateStars' maxStars without Rift or Spelunking). */
export const BASE_MAX_LEVEL = 5;
export const CHARACTER_GRIND_CAP = 6;
export const ACCOUNT_GRIND_CAP = 10;

const SKILL_NAMES: Record<string, string> = {
  MINING: 'Mining',
  CHOPPIN: 'Choppin',
  FISHING: 'Fishing',
  CATCHING: 'Catching',
};

/** "+{%_Total_Drop_Rate" at value 6 -> "+6% Total Drop Rate"; "+{_Base_STR" -> "+14 Base STR". */
export function effectText(effect: string, value: number | null): string {
  const v = value === null ? null : Math.round(value * 100) / 100;
  const body = effect
    .replace(/^\+?\{/, '')
    .replace(/\((passive|p)\)/i, '(passive)')
    .replace(/_/g, ' ')
    .trim();
  const pct = body.startsWith('%');
  const rest = (pct ? body.slice(1) : body).trim();
  if (v === null) return `+${pct ? 'x%' : 'x'} ${rest}`;
  return `+${v.toLocaleString('en-US')}${pct ? '%' : ''} ${rest}`;
}

/** "1 in 250". */
export function oneIn(chance: number): string {
  if (!(chance > 0)) return 'no drop chance on record';
  const n = 1 / chance;
  const r = n >= 100 ? Math.round(n / 10) * 10 : Math.round(n);
  return `1 in ${r.toLocaleString('en-US')}`;
}

/** "about 1.2 h", "about 40 min", "about 3 days". */
export function hoursText(hours: number): string {
  if (hours < 1) return `about ${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 10) return `about ${Math.round(hours * 10) / 10} h`;
  if (hours < 72) return `about ${Math.round(hours)} h`;
  return `about ${Math.round(hours / 24)} days`;
}

/**
 * Mean kills for the next `missing` copies at base chance (M14's Supply method, ADR 0005): the first
 * copy at ×5 while none is owned, every other copy at the base chance.
 */
export function killsFor(chance: number, owned: number, missing: number): number | null {
  if (!(chance > 0) || missing <= 0) return null;
  if (owned > 0) return missing / chance;
  return 1 / (chance * UNOWNED_MULTIPLIER) + (missing - 1) / chance;
}

/** The next card threshold: the first copy, or Toolbox's `nextLevelReq` copies for the next level. */
export function nextThreshold(
  owned: number,
  stars: number,
  nextLevelReq: number,
): { copies: number; label: string } | null {
  if (owned <= 0) return { copies: 1, label: 'first copy' };
  const level = stars + 1;
  if (level >= BASE_MAX_LEVEL) return null;
  return { copies: Math.max(owned + 1, nextLevelReq), label: `level ${level + 1}` };
}

const rowsOf = <T>(kb: FactLookup, id: string): T | null => {
  const f = kb.get(id);
  return f && 'rows' in f ? (f.rows as T) : null;
};

interface Ctx {
  state: AccountState;
  kb: FactLookup;
  k: Keywords;
  f: CardFacts;
  drops: Record<string, CardDropRow>;
  maps: Map<number, MapRow>;
  /** Fishing pools by fish (skills.fact.nodes). */
  pools: Map<string, number[]>;
  world: number;
  pusher: number | null;
  roles: Record<number, { afkType: string | null; active: boolean }[]>;
}

const nameOf = (ctx: Ctx, raw: string) =>
  human(ctx.state.account.cards?.[raw]?.name ?? ctx.drops[raw]?.name ?? raw);

function chip(ctx: Ctx, raw: string): CardChip {
  const owned = ctx.state.account.cards?.[raw];
  const row = ctx.drops[raw];
  const effect = owned?.effect ?? row?.effect ?? '';
  const level = cardLevel(ctx.state, raw);
  const bonus = row?.bonus ?? null;
  return {
    rawName: raw,
    name: nameOf(ctx, raw),
    effect:
      bonus === null
        ? effectText(effect, null)
        : level > 0
          ? effectText(effect, bonus * level)
          : `${effectText(effect, bonus)} per level`,
    level,
    stars: level > 0 ? level - 1 : 0,
    passive: isPassive(effect),
  };
}

function setChip(s: CardSetState | null): CardSetChip | null {
  if (!s) return null;
  return { rawName: s.rawName, name: human(s.name), tier: s.tier, bonus: setBonus(s) };
}

const fitsOf = (ctx: Ctx, cards: readonly string[]) => {
  const active = cards.filter((r) => !isPassive(ctx.state.account.cards?.[r]?.effect ?? ''));
  return CARD_ACTIVITIES.filter((a) => presetFits(ctx.state, active, a, ctx.k));
};

const fitLabel = (fits: readonly CardActivity[], empty: boolean) =>
  empty
    ? 'empty'
    : fits.length === 0
      ? 'no clear fit'
      : fits.length === CARD_ACTIVITIES.length
        ? 'fits every activity (drop rate cards)'
        : `fits ${and([...fits].sort((a, b) => (a === 'FIGHTING' ? 1 : b === 'FIGHTING' ? -1 : 0)).map(activityName))}`;

/** The AFK Target's card activity, then the first active Role activity that differs (FR-7 Roles). */
function activitiesOf(ctx: Ctx, c: CharacterState): { act: CardActivity; reason: 'afk-target' | 'role' }[] {
  const out: { act: CardActivity; reason: 'afk-target' | 'role' }[] = [];
  const isCard = (a: string | null | undefined): a is CardActivity =>
    (CARD_ACTIVITIES as readonly string[]).includes(a ?? '');
  if (isCard(c.afkType)) out.push({ act: c.afkType, reason: 'afk-target' });
  for (const r of ctx.roles[c.index] ?? [])
    if (r.active && isCard(r.afkType) && !out.some((o) => o.act === r.afkType))
      out.push({ act: r.afkType, reason: 'role' });
  return out.slice(0, 2);
}

function presetRows(
  ctx: Ctx,
  c: CharacterState,
  slotCount: number,
  unlocked: number,
  target: CardActivity | null,
) {
  const l = c.cardLoadout;
  if (!l) return [];
  const sel = l.selectedPreset ?? 0;
  const rows: PresetRow[] = [];
  for (let i = 0; i < unlocked; i++) {
    const cards = i === sel ? l.equipped : (l.presets[i] ?? []);
    const fits = fitsOf(ctx, cards);
    const slots: (CardChip | null)[] = Array.from({ length: Math.max(slotCount, cards.length) }, (_, s) =>
      cards[s] ? chip(ctx, cards[s] as string) : null,
    );
    rows.push({
      n: i + 1,
      active: i === sel,
      slots,
      fits: fits.map(activityName),
      label: fitLabel(fits, cards.length === 0),
      fitsTarget: target !== null && fits.includes(target),
      set: i === sel ? setChip(ctx.state.account.cardSets?.find((s) => s.rawName === l.set) ?? null) : null,
    });
  }
  return rows;
}

function swapsOf(
  ctx: Ctx,
  current: readonly string[],
  best: readonly string[],
  slotCount: number,
): CardSwap[] {
  const out = current.filter((r) => !best.includes(r));
  const into = best.filter((r) => !current.includes(r));
  const swaps: CardSwap[] = [];
  let empty = Math.max(0, slotCount - current.length);
  // Passive cards go first (FR-16: they work unequipped), then the lowest-level cards.
  const leaving = [...out].sort(
    (a, b) =>
      Number(isPassive(ctx.state.account.cards?.[b]?.effect ?? '')) -
        Number(isPassive(ctx.state.account.cards?.[a]?.effect ?? '')) ||
      cardLevel(ctx.state, a) - cardLevel(ctx.state, b),
  );
  for (const r of into) {
    const to = chip(ctx, r);
    if (empty > 0) {
      empty--;
      swaps.push({ from: null, to, text: `Add ${to.name}` });
      continue;
    }
    const f = leaving.shift();
    if (!f) break;
    const from = chip(ctx, f);
    swaps.push({ from, to, text: `Swap ${from.name} → ${to.name}` });
  }
  return swaps;
}

function recommend(
  ctx: Ctx,
  c: CharacterState,
  act: CardActivity,
  reason: 'afk-target' | 'role',
  rows: PresetRow[],
  slotCount: number,
  taken: ReadonlySet<number> = new Set(),
): PresetRecommendation | null {
  const l = c.cardLoadout;
  if (!l) return null;
  // FR-13 picks which cards make the cut (by level within the list); they are shown in the list's order,
  // so the card the list values most comes first (US-6: "Iron card first").
  const list = cardCandidates(ctx.kb, c, act);
  const pos = (r: string) => {
    const i = list.indexOf(r);
    return i < 0 ? list.length : i;
  };
  const chosen = rankOwnedCards(ctx.state, ctx.kb, c, act).slice(0, slotCount);
  const best = chosen
    .map((r, i) => ({ r, i }))
    .sort((a, b) => pos(a.r) - pos(b.r) || a.i - b.i)
    .map((x) => x.r);
  if (best.length === 0) return null;
  const sel = l.selectedPreset ?? 0;
  const activeRow = rows.find((r) => r.active);
  // Which preset does this job: the active one when it fits (or presets are locked), else a stored one
  // that fits, else an empty one to fill, else the active one (when no other job claimed it).
  let target: PresetRow | null = null;
  let where = '';
  // FR-17: leave the active preset only when its cards fit another job; an empty or mixed one is refilled.
  const activeKeeps =
    activeRow !== undefined &&
    !taken.has(activeRow.n) &&
    (activeRow.fits.includes(activityName(act)) || activeRow.fits.length === 0);
  if (rows.length <= 1 || activeKeeps) {
    target = activeRow ?? null;
    where =
      rows.length <= 1
        ? 'In your card slots'
        : reason === 'role' && activeRow
          ? `In card preset ${activeRow.n} (${activeRow.label})`
          : `In your active card preset ${sel + 1}`;
  } else {
    // Another activity's recommendation may already claim a preset: never send two jobs to one preset.
    const free = (r: PresetRow) => !r.active && !taken.has(r.n);
    const fitting = rows.find((r) => free(r) && r.fits.includes(activityName(act)));
    const empty = rows.find((r) => free(r) && r.label === 'empty');
    const own = activeRow && !taken.has(activeRow.n) ? activeRow : null;
    target = fitting ?? empty ?? own;
    where = fitting
      ? `Switch to card preset ${fitting.n} (${fitting.label})`
      : empty
        ? `Fill empty card preset ${empty.n}, then switch to it${reason === 'role' ? ` when you go ${act === 'FIGHTING' ? 'fighting' : activityName(act)}` : ''}`
        : own
          ? `In your active card preset ${sel + 1}`
          : 'No free card preset: swap these in when you change job (the Gem Shop sells more presets)';
  }
  const current = target ? (target.active ? l.equipped : (l.presets[target.n - 1] ?? [])) : l.equipped;
  const swaps = swapsOf(ctx, current, best, slotCount);
  const set = recommendedSet(ctx.state, ctx.kb, c, act, ctx.pusher);
  const setNote =
    set && set.rawName !== l.set
      ? `Equip the ${human(set.name)} card set (tier ${set.tier}, ${setBonus(set)}) when you ${act === 'FIGHTING' ? 'fight' : `go ${activityName(act)}`}`
      : null;
  return {
    activity: activityName(act),
    reason,
    preset: rows.length <= 1 ? null : (target?.n ?? null),
    where,
    cards: best.map((r) => chip(ctx, r)),
    swaps,
    done: swaps.length === 0,
    set: setChip(set),
    setNote,
  };
}

/** The drop maps of a card the account can use: fighting maps, or the skilling map of its resource. */
function dropMaps(ctx: Ctx, raw: string): { mapIndex: number; skill: string | null }[] {
  const row = ctx.drops[raw];
  if (!row) return [];
  const maps = [...row.maps, ...(ctx.pools.get(raw) ?? [])];
  return [...new Set(maps)].flatMap((m) => {
    const r = ctx.maps.get(m);
    if (!r?.listed) return [];
    const skill = r.afkType && r.afkType !== 'FIGHTING' ? r.afkType : null;
    return [{ mapIndex: m, skill }];
  });
}

/** Can `c` walk to `mapIndex` today (M14 FR-12, M5 TR-4's reachable maps)? */
function reaches(ctx: Ctx, c: CharacterState, mapIndex: number, skill: string | null): boolean {
  const row = ctx.maps.get(mapIndex);
  if (!row || row.world > ctx.world) return false;
  if (c.mapIndex === mapIndex) return true;
  const rates = ctx.state.account.supplyRates ?? null;
  const reach = rates?.reachable?.[c.index] ?? null;
  // Without the worker's reachable maps, the world gate is all the save can tell.
  if (reach === null) return true;
  if (reach.includes(mapIndex)) return true;
  // M14 supply.ts: skilling maps have no doors in Toolbox's data; any walked map of the world counts.
  return skill !== null && reach.some((m) => ctx.maps.get(m)?.world === row.world);
}

function killsPerHour(ctx: Ctx, c: CharacterState, mapIndex: number): number | null {
  const r = ctx.state.account.supplyRates?.maps
    .find((m) => m.mapIndex === mapIndex)
    ?.rates.find((x) => x.characterIndex === c.index);
  if (r && r.finalKillsPerHour > 0) return r.finalKillsPerHour;
  if (c.afkType === 'FIGHTING' && c.mapIndex === mapIndex) {
    const k = c.afk?.fighting?.finalKillsPerHour ?? null;
    if (k !== null && k > 0) return k;
  }
  return null;
}

const farming = (ctx: Ctx, mapIndex: number, skill: string | null) =>
  ctx.state.characters
    .filter((x) => x.mapIndex === mapIndex && (x.afkType ?? '') === (skill ?? 'FIGHTING'))
    .map((x) => who(x));

/** One grind line for `c`, or null when the card is maxed, unplaceable or out of reach. */
function grindLine(
  ctx: Ctx,
  c: CharacterState,
  raw: string,
  improves: string,
): GrindItem | null | 'unplaced' {
  const row = ctx.drops[raw];
  if (!row) return 'unplaced';
  const owned = ctx.state.account.cards?.[raw];
  const amount = owned?.amount ?? 0;
  const next = nextThreshold(amount, owned?.stars ?? 0, owned?.nextLevelReq ?? 0);
  if (!next) return null;
  const maps = dropMaps(ctx, raw);
  if (maps.length === 0 || !(row.chance > 0)) return 'unplaced';
  const options = maps
    .filter((m) => reaches(ctx, c, m.mapIndex, m.skill))
    .map((m) => ({ ...m, kph: m.skill ? null : killsPerHour(ctx, c, m.mapIndex) }));
  if (options.length === 0) return null;
  const missing = next.copies - amount;
  const kills = killsFor(row.chance, amount, missing);
  // The map the character is already on wins: that's the card it's farming now (R5 QA P3-1).
  const best =
    [...options].sort((a, b) => {
      const on = Number(b.mapIndex === c.mapIndex) - Number(a.mapIndex === c.mapIndex);
      if (on !== 0) return on;
      const ha = a.kph && kills ? kills / a.kph : Number.POSITIVE_INFINITY;
      const hb = b.kph && kills ? kills / b.kph : Number.POSITIVE_INFINITY;
      return ha - hb || a.mapIndex - b.mapIndex;
    })[0] ?? options[0];
  if (!best) return null;
  const map = ctx.maps.get(best.mapIndex) as MapRow;
  const hours = best.skill === null && best.kph && kills !== null ? kills / best.kph : null;
  const chance = amount > 0 ? row.chance : row.chance * UNOWNED_MULTIPLIER;
  const skillName = best.skill ? (SKILL_NAMES[best.skill] ?? human(best.skill)) : null;
  const etaText =
    hours !== null
      ? `${hoursText(hours)} at the base drop chance (likely sooner)`
      : skillName
        ? `drops while ${skillName.toLowerCase()} here; no time estimate for skilling`
        : 'no kill rate on this map yet';
  const c0 = chip(ctx, raw);
  return {
    rawName: raw,
    name: c0.name,
    effect: row.bonus > 0 ? `${effectText(row.effect, row.bonus)} per level` : c0.effect,
    monster: human(row.monster ? (ctx.drops[row.monster]?.name ?? row.name) : row.name),
    map: human(map.name),
    mapIndex: map.index,
    world: map.world,
    skill: skillName,
    owned: amount,
    level: c0.level,
    stars: c0.stars,
    next,
    missing,
    chance,
    chanceText: `${oneIn(chance)}${amount > 0 ? '' : ` (×${UNOWNED_MULTIPLIER} while you own none)`}`,
    kills,
    hours,
    etaText,
    improves,
    farmingNow: farming(ctx, map.index, best.skill),
    helps: [],
    fastest: null,
    quick: amount === 0 || (hours !== null && hours <= QUICK_HOURS),
  };
}

/**
 * Grind order (docs/specs/M8-collections.md "Cards view", R5 QA P3-1): quick wins first (a first copy,
 * or 24 h or less), then the fewest hours (no estimate last), then the card list's order.
 */
const byGrindOrder =
  (rank: (g: GrindItem) => number) =>
  (a: GrindItem, b: GrindItem): number =>
    Number(b.quick) - Number(a.quick) ||
    (a.hours ?? Number.POSITIVE_INFINITY) - (b.hours ?? Number.POSITIVE_INFINITY) ||
    rank(a) - rank(b) ||
    (a.rawName < b.rawName ? -1 : 1);

function grindFor(
  ctx: Ctx,
  c: CharacterState,
  acts: CardActivity[],
  rows: PresetRow[],
  recs: readonly PresetRecommendation[],
) {
  // Only a card a best preset keeps improves that preset: one it swaps out (or doesn't pick) never
  // claims to (R5 QA P3-1). The first activity whose best preset keeps it names it, else the first list.
  const keptIn = (raw: string): string | null => {
    if (rows.length <= 1) return null;
    for (const act of acts) {
      const rec = recs.find((r) => r.activity === activityName(act));
      if (rec?.preset != null && rec.cards.some((x) => x.rawName === raw))
        return `${activityName(act)} preset (card preset ${rec.preset})`;
    }
    return null;
  };
  const ranked: { raw: string; rank: number; improves: string }[] = [];
  acts.forEach((act, ai) => {
    cardCandidates(ctx.kb, c, act).forEach((raw, i) => {
      if (!ranked.some((r) => r.raw === raw))
        ranked.push({ raw, rank: ai * 1000 + i, improves: keptIn(raw) ?? `${activityName(act)} cards` });
    });
  });
  const items: GrindItem[] = [];
  let unplaced = 0;
  const rankOf = new Map<string, number>();
  for (const r of ranked) {
    const g = grindLine(ctx, c, r.raw, r.improves);
    if (g === 'unplaced') {
      if (
        nextThreshold(
          ctx.state.account.cards?.[r.raw]?.amount ?? 0,
          ctx.state.account.cards?.[r.raw]?.stars ?? 0,
          ctx.state.account.cards?.[r.raw]?.nextLevelReq ?? 0,
        )
      )
        unplaced++;
      continue;
    }
    if (!g) continue;
    rankOf.set(g.rawName, r.rank);
    items.push(g);
  }
  // The card it is farming right now (its AFK map) leads, then the grind order.
  const here = (g: GrindItem) => Number(g.mapIndex === c.mapIndex);
  items.sort((a, b) => here(b) - here(a) || byGrindOrder((g) => rankOf.get(g.rawName) ?? 0)(a, b));
  return { items, unplaced, rankOf };
}

/** The ids the Cards view reads, for provenance and for `kb compile` (named in detectors/cards/slots.ts). */
export const CARDS_VIEW_READS = [M8.keywords, M8.cardPreferences, M8.cardSlots, CARD_DROPS, MAPS] as const;

function sourcesOf(kb: FactLookup): SourceRef[] {
  const out: SourceRef[] = [];
  for (const id of [M8.cardPreferences, M8.cardSlots, CARD_DROPS]) {
    const f = kb.get(id);
    for (const s of f?.sources ?? [])
      if (!out.some((o) => o.url === s.url))
        out.push({
          label: s.title,
          url: s.url,
          tier: s.tier,
          verifiedOn: s.verified,
          ...(s.claimDate ? { claimDate: s.claimDate } : {}),
          gameVersion: s.gameVersion,
        });
  }
  // #74: the player-facing pages first, never a GitHub file alone.
  return out.sort((a, b) => (a.tier === 1 ? 1 : 0) - (b.tier === 1 ? 1 : 0) || a.tier - b.tier);
}

export const CARDS_CAVEATS = [
  `Hours are an average at each card's base drop chance (×${UNOWNED_MULTIPLIER} until you own one); your card drop bonuses make it sooner.`,
  'Only cards whose map a character can walk to today are listed.',
];

/** The Cards view for one save, or null when the Knowledge Base lacks M8's card tables. */
export function buildCardsView(state: AccountState, kb: FactLookup): CardsView | null {
  const drops = rowsOf<Record<string, CardDropRow>>(kb, CARD_DROPS);
  const mapRows = rowsOf<MapRow[]>(kb, MAPS);
  if (!drops || !mapRows || !kb.get(M8.keywords) || !kb.get(M8.cardSlots) || !kb.get(M8.cardPreferences))
    return null;
  const stage = (() => {
    try {
      return detectStage(state, kb);
    } catch {
      return null;
    }
  })();
  const stageWorld = stage?.id ? STAGE_DEFINITIONS[stage.id].world : null;
  const roles = (() => {
    try {
      const roster = analyzeRoster(state, kb, stage?.id ?? null);
      return assignRoles(state, kb, stage?.id ?? null, roster, pusherIndex(state, kb));
    } catch {
      return {};
    }
  })();
  // M14's authored fishing pools (skills.fact.nodes): a fish card drops while fishing its pool.
  const pools = new Map<string, number[]>();
  for (const n of rowsOf<{ item: string; maps: number[] }[]>(kb, NODES) ?? [])
    pools.set(n.item, [...(pools.get(n.item) ?? []), ...n.maps]);
  const currentWorld = state.account.currentWorld ?? 1;
  const ctx: Ctx = {
    state,
    kb,
    k: factRows<Keywords>(kb, M8.keywords),
    f: factRows<CardFacts>(kb, M8.cardSlots),
    drops,
    maps: new Map(mapRows.map((r) => [r.index, r])),
    pools,
    // "Not past the account's Stage": the Stage's world, and never past the current world.
    world: stageWorld === null ? currentWorld : Math.min(currentWorld, stageWorld),
    pusher: pusherIndex(state, kb),
    roles,
  };
  const gems = state.account.gemPurchases ?? null;
  const slotCount = ctx.f.baseSlots + (gems?.[ctx.f.gemExtraSlot] ?? 0);
  const unlockedPresets = Math.min(ctx.f.maxPresets, ctx.f.basePresets + (gems?.[ctx.f.gemPresets] ?? 0));

  const merged = new Map<string, { item: GrindItem; rank: number; helps: string[] }>();
  const characters = state.characters.map((c): CharacterCards => {
    const l = c.cardLoadout ?? null;
    const acts = activitiesOf(ctx, c);
    const target = acts.find((a) => a.reason === 'afk-target')?.act ?? null;
    const base: CharacterCards = {
      index: c.index,
      who: who(c),
      activity: target ? activityName(target) : null,
      unknown: null,
      slotCount,
      presetsLocked: c.level < ctx.f.presetLevel ? `Card presets unlock at Lv ${ctx.f.presetLevel}` : null,
      presets: [],
      activePreset: (l?.selectedPreset ?? 0) + 1,
      emptySlots: 0,
      set: null,
      recommendations: [],
      grind: [],
      grindNote: null,
      overview: '',
      presetFits: null,
    };
    if (!l || !state.account.cards) {
      return {
        ...base,
        unknown: "Can't read this character's cards right now",
        overview: "can't read cards",
      };
    }
    const rows = presetRows(ctx, c, slotCount, c.level < ctx.f.presetLevel ? 1 : unlockedPresets, target);
    const activeRow = rows.find((r) => r.active) ?? null;
    const empty = Math.max(0, slotCount - l.equipped.length);
    const taken = new Set<number>();
    const recs: PresetRecommendation[] = [];
    for (const a of acts) {
      const r = recommend(ctx, c, a.act, a.reason, rows, slotCount, taken);
      if (!r) continue;
      recs.push(r);
      if (r.preset !== null) taken.add(r.preset);
    }
    // A fighter with no Role elsewhere still gets its fighting list; a character doing nothing card-wise too.
    const grindActs = acts.length ? acts.map((a) => a.act) : (['FIGHTING'] as CardActivity[]);
    const g = grindFor(ctx, c, grindActs, rows, recs);
    for (const item of g.items) {
      const was = merged.get(item.rawName);
      const rank = g.rankOf.get(item.rawName) ?? 0;
      const label = who(c);
      const faster = item.hours !== null && (was?.item.hours ?? Number.POSITIVE_INFINITY) > item.hours;
      if (!was) {
        merged.set(item.rawName, {
          item: { ...item, fastest: item.hours !== null ? label : null },
          rank,
          helps: [label],
        });
        continue;
      }
      was.helps.push(label);
      was.rank = Math.min(was.rank, rank);
      if (faster) was.item = { ...item, fastest: label };
    }
    const fitsTarget = target ? (activeRow?.fitsTarget ?? false) : null;
    const top = g.items[0];
    const overview = [
      target === null
        ? 'no card activity'
        : activeRow?.label === 'empty'
          ? 'active preset empty'
          : fitsTarget
            ? `preset fits ${activityName(target)} ✓`
            : `preset doesn't fit ${activityName(target)}`,
      empty > 0 ? `${empty} empty ${plural(empty, 'slot')}` : 'slots full',
      top
        ? `next grind: ${top.name} card${top.hours !== null ? ` (${hoursText(top.hours)})` : top.skill ? ` (${top.skill.toLowerCase()})` : ''}`
        : 'nothing to grind in reach',
    ].join(' · ');
    return {
      ...base,
      presets: rows,
      emptySlots: empty,
      set: activeRow?.set ?? null,
      recommendations: recs,
      grind: g.items.slice(0, CHARACTER_GRIND_CAP),
      grindNote:
        g.unplaced > 0
          ? `${g.unplaced} more ${plural(g.unplaced, 'card')} on its list ${g.unplaced === 1 ? 'drops' : 'drop'} from bosses, crystal mobs or nodes ActiveOn can't place on a map yet`
          : null,
      overview,
      presetFits: fitsTarget,
    };
  });

  const account = [...merged.values()]
    .map((m) => ({ ...m.item, helps: m.helps, rank: m.rank }))
    .sort(
      (a, b) =>
        Number(b.quick) - Number(a.quick) ||
        b.helps.length - a.helps.length ||
        byGrindOrder((x) => (x as typeof a).rank)(a, b),
    )
    .slice(0, ACCOUNT_GRIND_CAP)
    .map(({ rank: _r, ...item }) => item);

  return { characters, account: { grind: account }, caveats: CARDS_CAVEATS, sources: sourcesOf(kb) };
}

/** At most this many card maps get kill rates in the worker (M14 TR-8's budget, on top of its own). */
export const CARD_RATE_MAPS = 12;

/**
 * M14 TR-3 leaves for the parse worker: the fighting drop maps of the cards a grind list could show, so
 * `computeSupplyRates` asks Toolbox for their kill rates (it keeps only maps someone can reach). Ordered
 * by the card lists; at most CARD_RATE_MAPS distinct maps.
 */
export function cardLeavesForRates(
  state: AccountState,
  kb: FactLookup,
): { rawName: string; maps: { mapIndex: number; chance: number }[] }[] {
  const drops = rowsOf<Record<string, CardDropRow>>(kb, CARD_DROPS);
  const mapRows = rowsOf<MapRow[]>(kb, MAPS);
  if (!drops || !mapRows || !kb.get(M8.cardPreferences) || !kb.get(M8.classTree)) return [];
  const maps = new Map(mapRows.map((r) => [r.index, r]));
  const world = state.account.currentWorld ?? 1;
  const seen = new Set<string>();
  const mapSet = new Set<number>();
  const out: { rawName: string; maps: { mapIndex: number; chance: number }[] }[] = [];
  const order: string[] = [];
  for (const c of state.characters) {
    const acts = (CARD_ACTIVITIES as readonly string[]).includes(c.afkType ?? '')
      ? [c.afkType as CardActivity, 'FIGHTING' as CardActivity]
      : (['FIGHTING'] as CardActivity[]);
    for (const a of acts)
      for (const raw of cardCandidates(kb, c, a)) if (!order.includes(raw)) order.push(raw);
  }
  for (const raw of order) {
    if (seen.has(raw)) continue;
    seen.add(raw);
    const row = drops[raw];
    const owned = state.account.cards?.[raw];
    if (!row || !(row.chance > 0)) continue;
    if (!nextThreshold(owned?.amount ?? 0, owned?.stars ?? 0, owned?.nextLevelReq ?? 0)) continue;
    const fighting = row.maps.filter((m) => {
      const r = maps.get(m);
      return r?.listed && r.afkType === 'FIGHTING' && r.world <= world;
    });
    const fresh = fighting.filter((m) => !mapSet.has(m));
    if (fighting.length === 0 || mapSet.size + fresh.length > CARD_RATE_MAPS) continue;
    for (const m of fresh) mapSet.add(m);
    out.push({
      rawName: `card:${raw}`,
      maps: fighting.map((mapIndex) => ({ mapIndex, chance: row.chance })),
    });
  }
  return out;
}
