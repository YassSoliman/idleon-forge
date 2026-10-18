// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Which System a Next Action's "See it" opens (M17 FR-31). Split from systems-view.ts so a Next Action
// card can ask without pulling in the Systems hub and page views (M21: those can then load lazily).
// `@idleon-forge/engine/see-it` is the UI thread's entry; systems-view.ts re-exports it for the barrel.
import type { EngineResult, Goal } from '../result';

/** M15 F5's Behind Goal (metapath/behind.ts BEHIND_ID; not imported: the view layer stays Knowledge-free, M10 TR-1). */
export const BEHIND_ID = 'metapath.goal.behind';

/** The System a Goal belongs to; the Behind Goal belongs to the System it picked. */
export function goalSystem(g: Pick<Goal, 'id' | 'system'>, result: EngineResult): string {
  if (g.id === BEHIND_ID) return result.behindSystems?.find((r) => r.chosen)?.systemId ?? g.system;
  return g.system;
}

/** The System a Next Action's "See it" opens (FR-31), or null when it gets none. */
export function seeItSystem(goal: Pick<Goal, 'id' | 'system'>, result: EngineResult): string | null {
  const id = goalSystem(goal, result);
  const s = result.systems?.find((x) => x.id === id);
  return s && s.kind === 'game' ? s.id : null;
}
