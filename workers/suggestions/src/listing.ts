// SPDX-License-Identifier: GPL-3.0-only
// The one listing (M13 TR-12): every bot-created Suggestion with its last-line marker parsed, kept for
// 30 s and shared by requests. Idempotency, the daily cap, the global breaker and "mine" all derive
// from it, so GitHub is the only counter and there is no database.
//
// Two layers: the Cache API (shared within a colo; a no-op on workers.dev, which has no zone cache) and
// isolate memory. Issues this isolate just created are kept separately for the cache window and merged
// into every listing, so a retry inside the window finds its issue even before GitHub lists it.

import type { SuggestionType } from './contract';
import { type GitHubClient, labelNames, type RawIssue } from './github';
import { parseIWant, parseMarker, typeFromLabels } from './render';

export const LISTING_TTL_MS = 30_000;
const CACHE_KEY = 'https://activeon-suggestions.cache/listing/v1';

export interface ListedIssue {
  number: number;
  url: string;
  state: 'open' | 'closed';
  stateReason: string | null;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  type: SuggestionType | null;
  iWant: string;
  m: string;
  cid: string;
}

export function toListed(raw: RawIssue): ListedIssue | null {
  const marker = parseMarker(raw.body);
  if (!marker) return null;
  const labels = labelNames(raw);
  return {
    number: raw.number,
    url: raw.html_url,
    state: raw.state,
    stateReason: raw.state_reason ?? null,
    labels,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    type: typeFromLabels(labels),
    iWant: parseIWant(raw.body) ?? raw.title,
    m: marker.m,
    cid: marker.cid,
  };
}

export interface ListingCache {
  match(key: string): Promise<Response | undefined>;
  put(key: string, res: Response): Promise<void>;
}

interface Snapshot {
  at: number;
  issues: ListedIssue[];
}

let memory: Snapshot | null = null;
const justCreated = new Map<number, { at: number; issue: ListedIssue }>();

export function resetListingMemory(): void {
  memory = null;
  justCreated.clear();
}

function merge(issues: ListedIssue[], now: number): ListedIssue[] {
  for (const [n, entry] of justCreated) if (now - entry.at > LISTING_TTL_MS) justCreated.delete(n);
  const known = new Set(issues.map((i) => i.number));
  const extra = [...justCreated.values()].map((e) => e.issue).filter((i) => !known.has(i.number));
  return [...extra, ...issues].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export class Listing {
  constructor(
    private readonly gh: GitHubClient,
    private readonly cache: ListingCache | null,
    private readonly clock: () => number = Date.now,
  ) {}

  /** `fresh` skips both cache layers (used before writes, where a stale list could duplicate). */
  async get(opts: { fresh?: boolean } = {}): Promise<ListedIssue[]> {
    const now = this.clock();
    if (!opts.fresh) {
      if (memory && now - memory.at < LISTING_TTL_MS) return merge(memory.issues, now);
      const hit = await this.cache?.match(CACHE_KEY).catch(() => undefined);
      if (hit) {
        const snap = (await hit.json()) as Snapshot;
        if (now - snap.at < LISTING_TTL_MS) {
          memory = snap;
          return merge(snap.issues, now);
        }
      }
    }
    const raw = await this.gh.listSuggestionIssues();
    const issues = raw.map(toListed).filter((i): i is ListedIssue => i !== null);
    await this.store({ at: now, issues });
    return merge(issues, now);
  }

  /** Right after a create: the new issue is visible to every later request in this isolate (TR-12). */
  async insert(issue: ListedIssue): Promise<void> {
    const now = this.clock();
    justCreated.set(issue.number, { at: now, issue });
    if (memory) await this.store({ at: memory.at, issues: [issue, ...memory.issues] });
  }

  private async store(snap: Snapshot): Promise<void> {
    memory = snap;
    const res = new Response(JSON.stringify(snap), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${LISTING_TTL_MS / 1000}` },
    });
    await this.cache?.put(CACHE_KEY, res).catch(() => undefined);
  }
}
