// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Shared by the M20 view tests after M21 Phase F split m20-view.test.tsx by area: a mid-session result
// with a Daily & Weekly Checklist and a Skills tab. F-owned and frozen: an area that needs a different
// fixture copies what it needs into its own test file.
import type { CharacterSkills, Checklist, EngineResult } from '@idleon-forge/engine/result';

const src = [
  {
    label: 'IdleOn Wiki: Killroy',
    url: 'https://idleon.wiki/wiki/Killroy%27s_Slaughterhouse',
    tier: 2 as const,
    verifiedOn: '2026-10-18',
    claimDate: '2026-10-05',
    gameVersion: '2.3.540',
  },
];

export function withM20(r: EngineResult): EngineResult {
  const at = r.asOf;
  const checklist: Checklist = {
    clocks: {
      daily: at + 12 * 3_600_000,
      accountWeek: at + 36 * 3_600_000,
      serverWeek: at + 100 * 3_600_000,
      ballotWeek: at + 50 * 3_600_000,
    },
    rings: { today: { done: 1, total: 3 }, week: { done: 0, total: 1 } },
    rows: [
      {
        id: 'spiketrap',
        band: 'no-bank',
        clock: 'daily',
        label: 'Spiketrap gems',
        state: 'todo',
        details: [],
        periodEnd: at + 12 * 3_600_000,
        availableAt: null,
        lostBeforeReturn: false,
        resetSinceSave: false,
        effortSeconds: 60,
        doneAt: null,
        manual: null,
        link: null,
        nextAction: 'Play Spiketrap for its gems',
        systemId: 'minigames',
        sources: src,
      },
      {
        id: 'guild-daily',
        band: 'no-bank',
        clock: 'daily',
        label: 'Guild daily tasks',
        state: 'todo',
        details: [],
        periodEnd: at + 12 * 3_600_000,
        availableAt: null,
        lostBeforeReturn: false,
        resetSinceSave: false,
        effortSeconds: 60,
        doneAt: null,
        manual: { key: 'checklist@guild-daily@20740', hint: '2 of 5 met' },
        link: null,
        nextAction: "Claim your guild's daily tasks",
        systemId: 'guild',
        sources: src,
      },
      {
        id: 'vial-attempts',
        band: 'no-bank',
        clock: 'daily',
        label: 'Vial attempts',
        state: 'done',
        details: ['0 of 17 left'],
        periodEnd: at + 12 * 3_600_000,
        availableAt: null,
        lostBeforeReturn: false,
        resetSinceSave: false,
        effortSeconds: 60,
        doneAt: null,
        manual: null,
        link: null,
        nextAction: 'Use your vial attempts',
        systemId: 'alchemy-vials',
        sources: src,
      },
      {
        id: 'killroy-skulls',
        band: 'weekly',
        clock: 'account-week',
        label: 'Spend 6 Killroy skulls',
        state: 'todo',
        details: ['4 skulls buy 10 Arcade balls: 50 of 50 packs left this week'],
        periodEnd: at + 36 * 3_600_000,
        availableAt: null,
        lostBeforeReturn: true,
        resetSinceSave: false,
        effortSeconds: 90,
        doneAt: null,
        manual: null,
        link: null,
        nextAction: 'Spend 6 Killroy skulls',
        systemId: 'killroy',
        sources: src,
      },
    ],
    gated: [{ band: 'no-bank', text: "Post Office orders: finish Postboy Pablob's quest" }],
    expanded: true,
  };
  const c = r.characters[0];
  const skills: CharacterSkills[] = c
    ? [
        {
          index: c.index,
          rows: [
            {
              skill: 'construction',
              level: 11,
              progress: 0.5,
              efficiency: null,
              accountBest: { level: 11, index: c.index },
              role: { id: 'construction-builder', active: true, from: 'W3' },
              specialty: false,
              locked: null,
              nextGate: { label: 'Decent cogs', atLevel: 15, levelsLeft: 4, scope: 'character' },
            },
          ],
          train: {
            skill: 'construction',
            text: 'Train: Construction · trains while it sits on the Cog Board',
            via: 'parallel-slot',
            linkKey: null,
          },
          slots: [{ kind: 'cog', state: 'filled', text: 'builds on the Cog Board', linkKey: null }],
        },
      ]
    : [];
  return { ...r, checklist, skills };
}
