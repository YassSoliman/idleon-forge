// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 F1 (docs/specs/M16-star-signs.md FR-1 to FR-4): until the Telescope quest is handed in, one
// opener walks the account there: open the tree doors, talk to the Telescope, A-2, hand the quest in.
import type { CharacterState } from '@idleon-forge/account-state';
import {
  candyPool,
  doorsLeft,
  excluded,
  hasDialogue,
  killRate,
  reachesTelescope,
  type StarContext,
  takeCandy,
} from './context';
import { constellationFacts } from './knowledge';

export type TelescopeStep =
  | {
      kind: 'open';
      character: number;
      mapIndex: number;
      next: number | null;
      kills: number;
      seconds: number | null;
    }
  | { kind: 'talk'; character: number }
  | { kind: 'a2'; character: number; candy: { hours: number; fromStorage: boolean } | null }
  | { kind: 'hand-in'; character: number };

export interface TelescopePlan {
  opener: CharacterState;
  /** Every character M14 FR-18 excludes: the opener goes "when it's free". */
  whenFree: boolean;
  step: TelescopeStep;
}

const leftOf = (ctx: StarContext, c: CharacterState) =>
  reachesTelescope(ctx, c) === true
    ? 0
    : (doorsLeft(ctx, c)?.reduce((n, d) => n + Math.max(0, d.left), 0) ?? null);

/** The first door still shut on a character's route, with its map's door destination. */
function nextDoor(ctx: StarContext, c: CharacterState) {
  const d = doorsLeft(ctx, c);
  const i = d?.findIndex((x) => x.left > 0) ?? -1;
  if (!d || i < 0) return null;
  const r = ctx.rules.route[i] as { mapIndex: number; door: number };
  const door = d[i] as { mapIndex: number; left: number };
  return {
    mapIndex: door.mapIndex,
    kills: door.left,
    next: ctx.maps.get(r.mapIndex)?.doors[r.door]?.destination ?? null,
  };
}

/** FR-2: the opener, and FR-3: its first step not done. null when no character's route can be read. */
export function telescopePlan(ctx: StarContext): TelescopePlan | null {
  const cs = ctx.state.characters.filter((c) => leftOf(ctx, c) !== null);
  if (!cs.length) return null;
  const rateAtNext = (c: CharacterState) => {
    const n = nextDoor(ctx, c);
    return n ? (killRate(ctx, c, n.mapIndex) ?? 0) : 0;
  };
  const free = cs.filter((c) => !excluded(ctx, c));
  const pool = free.length ? free : cs;
  const opener = [...pool].sort(
    (a, b) =>
      (leftOf(ctx, a) as number) - (leftOf(ctx, b) as number) ||
      rateAtNext(b) - rateAtNext(a) ||
      a.index - b.index,
  )[0] as CharacterState;
  const whenFree = free.length === 0;
  const at = (step: TelescopeStep): TelescopePlan => ({ opener, whenFree, step });

  const door = nextDoor(ctx, opener);
  if (reachesTelescope(ctx, opener) !== true && door) {
    const kph = killRate(ctx, opener, door.mapIndex);
    return at({
      kind: 'open',
      character: opener.index,
      mapIndex: door.mapIndex,
      next: door.next,
      kills: door.kills,
      seconds: kph ? Math.round((door.kills / kph) * 3600) : null,
    });
  }
  if (!hasDialogue(ctx, opener)) return at({ kind: 'talk', character: opener.index });
  const a2 = constellationFacts(ctx.kb).find((f) => f.name === 'A-2');
  const a2Done = a2 ? ctx.signs.claimed.includes(a2.rawIndex) : false;
  if (a2 && !a2Done) {
    const candy = takeCandy(candyPool(ctx), a2.min, opener.index);
    return at({
      kind: 'a2',
      character: opener.index,
      candy: candy ? { hours: candy.hours, fromStorage: candy.place === 'storage' } : null,
    });
  }
  return at({ kind: 'hand-in', character: opener.index });
}
