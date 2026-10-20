// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M25 (board m25/SystemsSearch.dc.html): the Systems hub's search and filters, pure and deterministic.
// A small hand-written fuzzy scorer (prefix, then substring, then in-order letters, then one or two
// typos), the words players use for each System (aliases) and the sections inside its page, the filter
// buckets, and the `#systems?q=…&w=…&s=…` fragment that keeps a view linkable. No dependency; it loads
// with the lazy hub chunk, never in the first load.

/** A filter bucket: every tile is in exactly one (its pip's meaning, `IndexTileView.tone` + status). */
export type StatusBucket = 'wasting' | 'behind' | 'todo' | 'fine' | 'notCovered' | 'locked';
export const BUCKETS: readonly StatusBucket[] = ['wasting', 'behind', 'todo', 'fine', 'notCovered', 'locked'];

/** The hub's search state: the query, the worlds kept (0 is account-wide) and the buckets kept. */
export interface HubQuery {
  q: string;
  worlds: readonly number[];
  status: readonly StatusBucket[];
}
export const EMPTY_QUERY: HubQuery = { q: '', worlds: [], status: [] };

/** A tile as the bucket rule reads it (a subset of the engine's `IndexTileView`). */
export interface BucketTile {
  status: string;
  tone: string;
}
export function bucketOf(t: BucketTile): StatusBucket {
  if (t.status === 'locked') return 'locked';
  if (t.tone === 'wasting') return 'wasting';
  if (t.status === 'behind') return 'behind';
  if (t.tone === 'todo') return 'todo';
  if (t.tone === 'ok') return 'fine';
  return 'notCovered';
}

// ---- the words players use ---------------------------------------------------------------------

/**
 * The common player words for each System (game terms and nicknames), and the names of the sections
 * inside its page. Matching on these is how "cauldron" finds Alchemy and "salts" finds the Refinery.
 * Sources: the System pages' own tab words (packages/engine/src/pictures/words.ts) and the IdleOn Wiki
 * page names (https://idleon.wiki, checked 2026-10-19).
 */
export const SEARCH_TERMS: Readonly<Record<string, { aliases?: string[]; sections?: string[] }>> = {
  classes: { aliases: ['subclass', 'class'] },
  talents: { aliases: ['talent points', 'skill points'] },
  'talent-presets': { aliases: ['presets', 'loadout'], sections: ['Points waiting', 'Star points'] },
  'talent-resets': { aliases: ['respec', 'reset'] },
  'upgrade-vault': { aliases: ['vault'], sections: ['Tower', 'Spend Plan'] },
  'gem-shop': { aliases: ['gems', 'shop'] },
  'merit-shop': { aliases: ['merits'] },
  'task-unlocks': { aliases: ['task board unlocks', 'merits'] },
  pets: { aliases: ['companions', 'pets', 'pet'] },
  minigames: { aliases: ['darts', 'hoops', 'mini games'] },
  cards: { aliases: ['card slots', 'card sets'] },
  obols: { aliases: ['obol'] },
  portals: { aliases: ['doors', 'map doors', 'portal'] },
  skills: { aliases: ['skilling', 'tools', 'doors'] },
  gear: { aliases: ['equipment', 'armor', 'weapons', 'tools'], sections: ['Empty slots', 'Everything worn'] },
  'random-events': { aliases: ['events'] },
  'pet-tournament': { aliases: ['tournament'] },
  'task-board': { aliases: ['dailies', 'tasks'] },
  guild: { aliases: ['guild points', 'gp'] },
  stamps: { aliases: ['stamp'], sections: ['Stamp book', 'Level up'] },
  'star-signs': { aliases: ['constellations', 'signs', 'star chart'], sections: ['Road to two signs'] },
  anvil: { aliases: ['anvil points', 'production'], sections: ['Point split', 'What each anvil makes'] },
  forge: { aliases: ['ore', 'smelting'] },
  bribes: { aliases: ['bribe'] },
  statues: { aliases: ['statue', 'gold statues'], sections: ['Statue wall'] },
  'post-office': { aliases: ['orders', 'boxes', 'po'] },
  owl: { aliases: ['feathers'] },
  quests: { aliases: ['quest', 'npc'] },
  'boss-keys': { aliases: ['keys', 'amarok', 'efaunt'] },
  colosseum: { aliases: ['tickets', 'colo'] },
  alchemy: { aliases: ['cauldron', 'cauldrons', 'liquids', 'brewing'], sections: ['Seats'] },
  'alchemy-bubbles': { aliases: ['bubbles'] },
  'alchemy-vials': { aliases: ['vials', 'vial'] },
  'alchemy-p2w': { aliases: ['p2w', 'pay to win'] },
  arcade: { aliases: ['balls', 'arcade shop'] },
  islands: { aliases: ['island', 'fisherman'] },
  'weekly-battles': { aliases: ['weekly bosses', 'battles'] },
  ballot: { aliases: ['vote', 'voting'] },
  refinery: { aliases: ['salts', 'salt', 'refine'] },
  construction: { aliases: ['cogs', 'cog', 'buildings', 'building', 'board', 'flags'] },
  library: { aliases: ['talent books', 'books'] },
  printer: { aliases: ['3d printer', 'sampling', 'samples'], sections: ['Stored samples'] },
  worship: { aliases: ['tower defense', 'charge'], sections: ['Totems'] },
  trapping: { aliases: ['traps', 'critters'], sections: ['Trap sets'] },
  'death-note': { aliases: ['kills', 'multikill'] },
  'armor-smithy': { aliases: ['armor sets', 'smithy'] },
  'salt-lick': { aliases: ['salts', 'lick'] },
  prayers: { aliases: ['prayer', 'curse'], sections: ['Equipped'] },
  shrines: { aliases: ['shrine'] },
  equinox: { aliases: ['dreams'] },
  'atom-collider': { aliases: ['atoms', 'collider', 'particles'] },
  lab: { aliases: ['lab', 'chips', 'jewels', 'mainframe'] },
  cooking: { aliases: ['meals', 'kitchens', 'spices', 'food'] },
  breeding: { aliases: ['pets', 'eggs', 'territory', 'pet'] },
};

// ---- the scorer ----------------------------------------------------------------------------------

/** Lowercase, letters and digits only, single spaces. */
export const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/**
 * Lowercased and stripped, with each kept char's index in the original, so a highlight lands on the
 * characters the player sees.
 */
function keyed(s: string): { text: string; at: number[] } {
  let text = '';
  const at: number[] = [];
  let space = false;
  for (let i = 0; i < s.length; i++) {
    const c = (s[i] ?? '').toLowerCase();
    if (/[\p{L}\p{N}]/u.test(c)) {
      if (space && text) {
        text += ' ';
        at.push(-1);
      }
      text += c;
      at.push(i);
      space = false;
    } else space = true;
  }
  return { text, at };
}

/** A match: higher is better; `hits` are indices into the original string. */
export interface Match {
  score: number;
  hits: number[];
}

/** Optimal string alignment distance (Levenshtein plus one adjacent swap), capped. */
export function editDistance(a: string, b: string, cap = 3): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    const row = d[i] as number[];
    const prev = d[i - 1] as number[];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min((prev[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        v = Math.min(v, ((d[i - 2] as number[])[j - 2] ?? 0) + 1);
      row[j] = v;
    }
  }
  return (d[a.length] as number[])[b.length] ?? cap + 1;
}

/** How many typos a query of this length may carry. */
const typosFor = (n: number) => (n >= 8 ? 2 : n >= 5 ? 1 : 0);

const isStart = (text: string, i: number) => i === 0 || text[i - 1] === ' ';

/**
 * Scores `query` against `target` (the text the player sees). Tiers, best first: the whole target,
 * a prefix, a word prefix, a substring, the letters in order (consecutive and word-start letters score
 * more), then a word within one or two typos. Null when nothing fits.
 */
export function fuzzyScore(query: string, target: string): Match | null {
  const q = norm(query);
  if (!q) return null;
  const { text, at } = keyed(target);
  const span = (from: number, n: number) =>
    Array.from({ length: n }, (_, k) => at[from + k] ?? -1).filter((x) => x >= 0);
  if (text === q) return { score: 1000, hits: span(0, q.length) };
  if (text.startsWith(q)) return { score: 900 - (text.length - q.length), hits: span(0, q.length) };
  const idx = text.indexOf(q);
  if (idx >= 0) {
    const word = isStart(text, idx);
    return { score: (word ? 800 : 600) - idx, hits: span(idx, q.length) };
  }
  // The letters in order (spaces in the query are free), first fit, scored for runs and word starts.
  const letters = q.replace(/ /g, '');
  if (letters.length >= 2) {
    const hits: number[] = [];
    let score = 300;
    let j = 0;
    let last = -2;
    for (let i = 0; i < text.length && j < letters.length; i++) {
      if (text[i] !== letters[j]) continue;
      if (i === last + 1) score += 12;
      if (isStart(text, i)) score += 8;
      score -= Math.min(6, i - last - 1);
      hits.push(at[i] ?? -1);
      last = i;
      j++;
    }
    // A scattered fit across a long name is noise: require the letters to cover a tight-enough span.
    if (j === letters.length && (hits.at(-1) ?? 0) - (hits[0] ?? 0) <= letters.length * 2 + 2)
      return { score, hits: hits.filter((x) => x >= 0) };
  }
  // Typos: the query against each word (and each run of words) of the same rough length.
  const allowed = typosFor(letters.length);
  if (allowed > 0) {
    const words = text.split(' ');
    let best: Match | null = null;
    let offset = 0;
    for (let w = 0; w < words.length; w++) {
      for (let k = w; k < words.length && k < w + 3; k++) {
        const phrase = words.slice(w, k + 1).join(' ');
        const cands = [phrase, phrase.slice(0, q.length), phrase.slice(0, q.length + 1)];
        for (const c of cands) {
          const dist = editDistance(q, c, allowed);
          if (dist <= allowed) {
            const score = 200 - dist * 40 - offset;
            if (!best || score > best.score) best = { score, hits: span(offset, c.length) };
          }
        }
      }
      offset += (words[w] ?? '').length + 1;
    }
    return best;
  }
  return null;
}

// ---- searching the hub ---------------------------------------------------------------------------

/** One System the search can find: its name and where it sits. */
export interface SearchItem {
  id: string;
  name: string;
  world: number;
}
export interface SearchResult {
  id: string;
  name: string;
  world: number;
  score: number;
  /** Highlighted characters of the name (empty when the match was on an alias or a section). */
  hits: number[];
  /** What matched when it wasn't the name: a player word or a section of the page. */
  via: { kind: 'alias' | 'section'; text: string; hits: number[] } | null;
}

/** A System's best match on its name, its player words and its sections. */
export function matchItem(query: string, item: SearchItem): SearchResult | null {
  const terms = SEARCH_TERMS[item.id] ?? {};
  let best: SearchResult | null = null;
  const consider = (m: Match | null, via: SearchResult['via'], weight: number) => {
    if (!m) return;
    const score = m.score * weight;
    if (!best || score > best.score)
      best = { id: item.id, name: item.name, world: item.world, score, hits: via ? [] : m.hits, via };
  };
  consider(fuzzyScore(query, item.name), null, 1);
  for (const a of terms.aliases ?? []) {
    const m = fuzzyScore(query, a);
    consider(m, m ? { kind: 'alias', text: a, hits: m.hits } : null, 0.95);
  }
  for (const s of terms.sections ?? []) {
    const m = fuzzyScore(query, s);
    consider(m, m ? { kind: 'section', text: s, hits: m.hits } : null, 0.85);
  }
  // A multi-word query: every word must fit the name or a player word; the score is their mean.
  const words = norm(query).split(' ').filter(Boolean);
  if (!best && words.length > 1) {
    const fields = [item.name, ...(terms.aliases ?? [])];
    const per = words.map((w) => Math.max(...fields.map((f) => fuzzyScore(w, f)?.score ?? -1)));
    if (per.every((s) => s > 0)) {
      const nameHits = words.flatMap((w) => fuzzyScore(w, item.name)?.hits ?? []);
      best = {
        id: item.id,
        name: item.name,
        world: item.world,
        score: (per.reduce((a, b) => a + b, 0) / per.length) * 0.8,
        hits: [...new Set(nameHits)].sort((a, b) => a - b),
        via: null,
      };
    }
  }
  return best;
}

/** Every matching System, best first (ties: shorter name, then the hub's own order). */
export function searchSystems(query: string, items: readonly SearchItem[]): SearchResult[] {
  if (!norm(query)) return [];
  return items
    .map((it, order) => ({ r: matchItem(query, it), order }))
    .filter((x): x is { r: SearchResult; order: number } => x.r !== null)
    .sort((a, b) => b.r.score - a.r.score || a.r.name.length - b.r.name.length || a.order - b.order)
    .map((x) => x.r);
}

/** Splits a text into runs for drawing: highlighted runs carry `hit: true`. */
export function highlightRuns(text: string, hits: readonly number[]): { text: string; hit: boolean }[] {
  const set = new Set(hits);
  const runs: { text: string; hit: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const hit = set.has(i);
    const last = runs.at(-1);
    if (last && last.hit === hit) last.text += text[i];
    else runs.push({ text: text[i] ?? '', hit });
  }
  return runs;
}

// ---- filtering ---------------------------------------------------------------------------------

/** Whether a tile stays under the query (by its search result) and the world and status filters. */
export function keeps(
  tile: BucketTile & { id: string },
  world: number,
  query: HubQuery,
  matched: ReadonlySet<string> | null,
): boolean {
  if (matched && !matched.has(tile.id)) return false;
  if (query.worlds.length > 0 && !query.worlds.includes(world)) return false;
  if (query.status.length > 0 && !query.status.includes(bucketOf(tile))) return false;
  return true;
}

/** True when the hub shows a narrowed view (any query or filter). */
export const isNarrowed = (q: HubQuery) => norm(q.q) !== '' || q.worlds.length > 0 || q.status.length > 0;

/** Turns one value on or off in a filter list, keeping a stable order. */
export function toggle<T>(list: readonly T[], value: T, order: readonly T[]): T[] {
  const on = list.includes(value);
  const next = on ? list.filter((x) => x !== value) : [...list, value];
  return order.filter((x) => next.includes(x));
}

// ---- the fragment ------------------------------------------------------------------------------

const BUCKET_SET: ReadonlySet<string> = new Set(BUCKETS);

/** The search state in `#systems?q=alch&w=0,2&s=wasting`; anything unknown is dropped. */
export function parseHubHash(hash: string): HubQuery {
  const at = hash.indexOf('?');
  if (!hash.startsWith('#systems') || at < 0) return EMPTY_QUERY;
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(hash.slice(at + 1));
  } catch {
    return EMPTY_QUERY;
  }
  const list = (k: string) =>
    (p.get(k) ?? '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  const worlds = [
    ...new Set(
      list('w')
        .filter((x) => /^\d$/.test(x))
        .map(Number),
    ),
  ].sort((a, b) => a - b);
  const status = BUCKETS.filter((b) => list('s').includes(b) && BUCKET_SET.has(b));
  return { q: (p.get('q') ?? '').slice(0, 60), worlds, status };
}

/** The fragment of a search state: `#systems` alone when nothing is narrowed. */
export function formatHubHash(q: HubQuery): string {
  const parts: string[] = [];
  const text = q.q.trim();
  if (text) parts.push(`q=${encodeURIComponent(text)}`);
  if (q.worlds.length) parts.push(`w=${[...q.worlds].sort((a, b) => a - b).join(',')}`);
  if (q.status.length) parts.push(`s=${BUCKETS.filter((b) => q.status.includes(b)).join(',')}`);
  return parts.length ? `#systems?${parts.join('&')}` : '#systems';
}
