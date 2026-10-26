// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
const PLACEHOLDER = /^(filler|some[_ ])/i;

const nameOf = (entry: any): string | undefined => {
  if (typeof entry === 'string') return entry;
  if (!entry || typeof entry !== 'object') return undefined;
  return entry.name ?? entry.displayName ?? entry.rawName ?? entry.starName;
};

export const isPlaceholder = (entry: any): boolean => {
  const name = nameOf(entry);
  return typeof name === 'string' && PLACEHOLDER.test(name);
};

export interface CatalogEntry<T> {
  entry: T;
  index: number;
}

export const liveEntries = <T>(catalog: T[] | undefined | null): CatalogEntry<T>[] =>
  (catalog ?? [])
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !isPlaceholder(entry));

export const liveCount = (catalog: unknown[] | undefined | null): number =>
  liveEntries(catalog as any[]).length;
