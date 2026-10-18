// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8 TR-15: every town shop's stock from raw `ShopStock`, item by item. Toolbox's own `getShops`
// (vendor/parsers/shops.ts) keeps only a whitelist of items (`shopMapping`), which drops most stamps,
// so ActiveOn reads the raw amounts and pairs each with Toolbox's shop item list (shared-data `shops`)
// by position, the same pairing `parseShops` uses.
import { shops } from '@website-data';

export interface ShopStockItem {
  rawName: string;
  amount: number;
}

const amountOf = (v: unknown): number => {
  const n = typeof v === 'string' ? Number.parseInt(v, 10) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
};

/** Stock by shop index (Toolbox's `shops` key), or null when the raw value is missing or malformed. */
export function shopStockAll(rawShopStock: unknown): ShopStockItem[][] | null {
  let raw = rawShopStock;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(raw)) return null;
  const table = shops as Record<string, { items?: { rawName: string }[] }>;
  const indexes = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);
  const out: ShopStockItem[][] = [];
  for (const shop of indexes) {
    const stock = raw[shop];
    const items = table[String(shop)]?.items ?? [];
    if (!stock || typeof stock !== 'object') {
      out[shop] = [];
      continue;
    }
    out[shop] = items.map((item, i) => ({
      rawName: item.rawName,
      amount: amountOf((stock as Record<string, unknown>)[String(i)]),
    }));
  }
  return out;
}
