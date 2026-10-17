// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// One valid entry of each type (M11 TR-3 shapes), for schema and rule tests. Illustrative content only.
export const TOOLBOX =
  'https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/world-3/deathNote.ts';
export const tier1 = {
  url: TOOLBOX,
  title: 'IdleOn Toolbox game data',
  tier: 1,
  verified: '2026-10-17',
  gameVersion: '2.3.540',
} as const;
export const tier3 = {
  url: 'https://www.reddit.com/r/idleon/comments/1wnq6ay/comment/pbgy0ai/',
  title: 'r/idleon thread',
  tier: 3,
  claimDate: '2026-09-22',
  verified: '2026-10-17',
  gameVersion: '2.3.540',
} as const;

const base = (id: string, system: string) => ({
  id,
  system,
  title: 'A title',
  text: 'Some text',
  why: 'Some reason',
  sources: [tier1],
  appliesTo: { stages: 'all' as const },
  confidence: 'H' as const,
  status: 'active' as const,
});

export const goal = {
  ...base('death-note.goal.w1-skulls', 'death-note'),
  type: 'goal',
  scope: 'account',
  category: 'compounding',
  unit: 'kills',
  progress: { id: 'death-note/kills-of-monster', params: { monster: 'poopSmall' } },
  extends: 'death-note.goal.poop-small',
};
export const contribution = {
  ...base('death-note.contribution.fight-poop', 'death-note'),
  type: 'contribution',
  activity: { afkType: 'FIGHTING', map: 'Poopy_Sewers', target: 'poopSmall' },
  goal: 'death-note.goal.w1-skulls',
  detector: { id: 'fighting/on-target', params: { target: 'poopSmall' } },
  eta: 'kills-per-hour',
};
export const check = {
  ...base('alchemy.check.empty-big-bubble-slot', 'alchemy'),
  type: 'check',
  subject: 'character',
  effect: 'next-action',
  goal: 'alchemy.goal.big-bubbles-equipped',
  detector: { id: 'alchemy/empty-big-bubble-slot', params: {} },
};
export const blocker = {
  ...base('afk.check.no-afk-target', 'afk'),
  type: 'check',
  subject: 'character',
  effect: 'blocker',
  detector: { id: 'afk/no-afk-target' },
};
export const priority = {
  ...base('metapath.priority.w3-early', 'metapath'),
  type: 'priority',
  confidence: 'M',
  sources: [tier3],
  appliesTo: { stages: ['W3-early'] },
  list: 'goals',
  stage: 'W3-early',
  tiers: [
    [{ include: 'metapath.priority.never-skip' }],
    ['metapath.goal.push'],
    [{ ref: 'quests.goal.hoggindaz-1-5', verification: 'confirmed' }],
    ['worship.goal.wax-skull-all', 'trapping.goal.traps-all'],
  ],
};
export const build = {
  ...base('talents.build.squire-skilling', 'talents'),
  type: 'build',
  confidence: 'L',
  sources: [tier3],
  appliesTo: { stages: [{ from: 'W2-early', to: 'W4-entry' }], classes: ['Squire'], levels: { min: 15 } },
  classLine: 'Squire',
  role: 'skilling',
  serves: ['MINING'],
  variant: 'afk',
  tags: ['BIG_PICK'],
  tabs: [{ tab: 2, steps: [{ talent: 'BIG_PICK', target: 'max', core: true }] }],
};
export const acquisition = {
  ...base('obols.acquisition.efaunt-obol', 'obols'),
  type: 'acquisition',
  thing: { kind: 'obol', rawName: 'ObolEfauntA' },
  extends: 'obols.acquisition.obol-efaunt-a-drop',
  methods: [
    {
      how: 'Fight Efaunt',
      where: { monster: 'Boss2A' },
      requires: ['bosses.acquisition.efaunt-key', { text: 'W2 obol merit bought' }],
    },
  ],
  detector: { id: 'obols/owned', params: { rawName: 'ObolEfauntA' } },
};
export const metapath = {
  ...base('metapath.metapath.slot-plan', 'metapath'),
  type: 'metapath',
  confidence: 'M',
  sources: [tier3],
  part: 'slots',
  slots: [
    { slot: 1, classLine: 'Barbarian', role: 'pusher' },
    {
      slot: { from: 9, to: 10 },
      classLine: 'Arcane_Cultist',
      status: 'contested',
      sides: [
        { position: 'Second Arcane Cultist', sources: [tier3] },
        { position: 'Second Death Bringer', sources: [tier3] },
      ],
    },
  ],
};

export const ALL = { goal, contribution, check, blocker, priority, build, acquisition, metapath };
