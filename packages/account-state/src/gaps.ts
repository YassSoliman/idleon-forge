// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 2, the W2/W3 gaps: Toolbox output -> the wave's Account State blocks (gaps-types.ts). Called
// once from adapter.ts; each System's reader lives in its own file (salt.ts, ...). One failing reader
// marks only its own field unknown.
import { readForge } from './forge';
import type { GapsAccountFields } from './gaps-types';
import { readSaltHeld, readSaltLick } from './salt';
import type { SaltState } from './unspent-types';

type Dict = Record<string, unknown>;

interface Collector {
  unknown(path: string): void;
}

export interface GapsInputs {
  account: Dict;
  /** Toolbox's parsed characters (bags hold ore and barrels). */
  characters: readonly unknown[];
  failedSections: readonly string[];
}

/** Runs `read`, null (and unknown) when one of its sections failed or it throws. */
function guarded<T>(
  c: Collector,
  path: string,
  sections: readonly string[],
  failed: readonly string[],
  read: () => T | null,
): T | null {
  if (sections.some((s) => failed.includes(s))) {
    c.unknown(path);
    return null;
  }
  try {
    return read();
  } catch {
    c.unknown(path);
    return null;
  }
}

export function readGaps(i: GapsInputs, c: Collector): Required<GapsAccountFields> {
  const { account, failedSections: failed } = i;
  return {
    saltLick: guarded(c, 'account.saltLick', ['saltLick'], failed, () => readSaltLick(account)),
    forge: guarded(c, 'account.forge', ['forge'], failed, () => readForge(account, i.characters)),
  };
}

/** FR-21b: each salt's `held` (Storage Chest) and `inRefinery`, added to the shared salt list. */
export function withSaltHeld(salts: SaltState[] | null, i: GapsInputs, c: Collector): SaltState[] | null {
  if (salts === null) return null;
  const held = guarded(c, 'account.salts[].held', ['storage', 'refinery'], i.failedSections, () =>
    readSaltHeld(i.account),
  );
  if (held === null) return salts;
  return salts.map((s) => {
    const h = held.get(s.rawName);
    return { ...s, held: h?.held ?? 0, inRefinery: h?.inRefinery ?? 0 };
  });
}
