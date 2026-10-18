// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Shared by the M17 view tests after M21 Phase F split shell.test.tsx by area: the mid-session result
// with a System registry, the place-nav queries and the axe helper. F-owned and frozen: an area that
// needs a different fixture copies what it needs into its own test file.
import type { EngineResult, SystemSummary } from '@idleon-forge/engine/result';
import { fireEvent, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { expect } from 'vitest';
import { fixture } from '../now-helpers';

export async function noAxeViolations(container: HTMLElement) {
  const res = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  expect(res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`)).toEqual([]);
}

export const sys = (
  id: string,
  name: string,
  world: number,
  over: Partial<SystemSummary> = {},
): SystemSummary => ({
  id,
  name,
  kind: 'game',
  world,
  scope: 'account',
  unlocked: 'yes',
  unlockBy: world === 0 ? 'always' : 'world',
  covered: true,
  unlock: world === 0 ? null : { text: `Opens on reaching World ${world}`, world, stale: false, sources: [] },
  wiki: world === 0 ? null : `https://idleon.wiki/wiki/${name.replace(/ /g, '_')}`,
  checks: [],
  ...over,
});

/** mid-session with a registry: Dahlia's AFK blocker is ActiveOn's own; the rest are game Systems. */
export function withSystems(over: Partial<EngineResult> = {}): EngineResult {
  const r = fixture('mid-session');
  r.characters = r.characters.map((c) =>
    c.index === 3
      ? {
          ...c,
          goals: c.goals.map((g) => (g.system === 'anvil' ? { ...g, category: 'blocker' as const } : g)),
          verdict: {
            ...c.verdict,
            blockerKeys: [...c.verdict.blockerKeys, 'anvil.check.spend-points@c3'],
          },
        }
      : c,
  );
  return {
    ...r,
    systems: [
      sys('afk', 'AFK safety', 0, { kind: 'activeon' }),
      sys('talents', 'Talents', 0),
      sys('cards', 'Cards', 0),
      sys('obols', 'Obols', 0),
      sys('gem-shop', 'Gem Shop', 0),
      sys('minigames', 'Minigames', 0),
      sys('stamps', 'Stamps', 1),
      sys('anvil', 'Anvil', 1, {
        checks: [{ entryId: 'anvil.check.spend-points', title: 'Unspent anvil points', fired: true }],
      }),
      sys('boss-keys', 'Boss keys', 1),
      sys('post-office', 'Post Office', 1, {
        unlocked: 'no',
        unlockBy: 'own',
        unlock: { text: 'Opens once a character reaches class Lv 50', world: 2, stale: false, sources: [] },
      }),
      sys('alchemy-bubbles', 'Alchemy bubbles', 2),
      sys('equinox', 'Equinox', 2, { covered: false }),
      sys('lab', 'Laboratory', 3, { unlocked: 'no' }),
    ],
    behindSystems: [],
    unknownFindings: [],
    ...over,
  };
}

export const places = () => screen.getByRole('navigation', { name: 'Places' });
export const go = (name: string | RegExp) => fireEvent.click(within(places()).getByRole('link', { name }));
