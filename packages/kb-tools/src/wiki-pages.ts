// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 TR-9: which IdleOn Wiki pages exist for items and monsters, and when each was last edited, so a
// generated Walkthrough step links the wiki page only when it is there (never a GitHub file, #74). The
// check goes through the MediaWiki API and is cached in packages/knowledge/generators/_wiki-pages.json,
// which the items generator reads; generation itself never touches the network.
//
//   pnpm --filter @idleon-forge/kb-tools exec tsx src/wiki-pages.ts
//
// Run it in the weekly parser sync (after `kb generate` has the new Toolbox data) and commit the cache.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { KNOWLEDGE, WEBSITE_DATA } from './paths';

export const WIKI_CACHE = path.join(KNOWLEDGE, 'generators/_wiki-pages.json');
const API = 'https://idleon.wiki/api.php';
const BATCH = 50;

/** "Megalodon_Tooth" -> "Megalodon Tooth": the wiki's page title for a Toolbox display name. */
export const wikiTitle = (displayName: string) => displayName.replace(/_/g, ' ').trim();

function titles(): string[] {
  const read = (f: string) => JSON.parse(readFileSync(path.join(WEBSITE_DATA, f), 'utf8'));
  const items = read('items.json') as Record<string, { displayName?: string }>;
  const monsters = read('monsters.json') as Record<string, { Name?: string }>;
  const out = new Set<string>();
  for (const i of Object.values(items)) if (i.displayName && i.displayName !== 'ERROR') out.add(wikiTitle(i.displayName));
  for (const m of Object.values(monsters)) if (m.Name) out.add(wikiTitle(m.Name));
  return [...out].filter((t) => t.length > 1 && !/[#<>[\]|{}]/.test(t)).sort();
}

async function main() {
  const all = titles();
  const pages: Record<string, string> = {};
  for (let i = 0; i < all.length; i += BATCH) {
    const batch = all.slice(i, i + BATCH);
    const url = `${API}?action=query&format=json&formatversion=2&prop=revisions&rvprop=timestamp&titles=${encodeURIComponent(batch.join('|'))}`;
    const res = await fetch(url, { headers: { 'user-agent': 'idleon-forge kb-tools (wiki link check)' } });
    if (!res.ok) throw new Error(`wiki API ${res.status}`);
    const json = (await res.json()) as {
      query?: { pages?: { title: string; missing?: boolean; revisions?: { timestamp: string }[] }[] };
    };
    for (const p of json.query?.pages ?? [])
      if (!p.missing && p.revisions?.[0]) pages[p.title] = p.revisions[0].timestamp.slice(0, 10);
  }
  const sorted = Object.fromEntries(Object.entries(pages).sort(([a], [b]) => (a < b ? -1 : 1)));
  writeFileSync(
    WIKI_CACHE,
    `${JSON.stringify({ checkedOn: new Date().toISOString().slice(0, 10), pages: sorted }, null, 2)}\n`,
  );
  console.log(`${Object.keys(sorted).length} of ${all.length} titles have a wiki page`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
