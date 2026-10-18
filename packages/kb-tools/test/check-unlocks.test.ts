// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `kb check` for M17 FR-34 and TR-8: every game System that isn't always open names a resolving row of
// `systems.fact.unlocks`, in condition form, with its IdleOn Wiki page; activeon rows name none.
import { describe, expect, it } from 'vitest';
import { systemUnlockIssues } from '../src/check';
import { type KbSource, loadSource } from '../src/load';
import { kbTree } from './kb-tree';

const facts = (src: KbSource) => new Map(src.facts.map((f) => [f.value.id, f]));
const issues = (src: KbSource) => systemUnlockIssues(src, facts(src)).map((i) => `${i.id}: ${i.message}`);

const WIKI = `{ url: https://idleon.wiki/wiki/Alchemy, title: "IdleOn Wiki: Alchemy", tier: 2, claimDate: 2026-10-01, verified: 2026-10-18, gameVersion: 2.3.540 }`;
const GUIDE = `{ url: https://www.reddit.com/r/idleon/comments/1/, title: thread, tier: 3, claimDate: 2026-09-01, verified: 2026-10-18, gameVersion: 2.3.540 }`;

const systems = (extra = '') => `systems:
  - { id: afk, name: AFK safety, world: 0, scope: character, dossier: https://example.org/afk, unlocked: always, kind: activeon${extra} }
  - { id: alchemy, name: Alchemy, world: 2, scope: both, dossier: https://example.org/alchemy, unlocked: { id: worlds/reached, params: { world: 2 } }, unlockFact: systems.fact.unlocks }
`;
const table = (text: string, sources = `[${WIKI}]`) => `system: systems
facts:
  - id: systems.fact.unlocks
    system: systems
    origin: authored
    title: How each game System opens
    sources: [${WIKI}]
    rows:
      - { system: alchemy, world: 2, text: "${text}", gameVersion: 2.3.540, sources: ${sources} }
`;

describe('systemUnlockIssues (M17 FR-34, TR-8)', () => {
  it('passes on the shipped Knowledge Base', () => {
    expect(issues(loadSource())).toEqual([]);
  });

  it('passes on a well-formed row', () => {
    const src = loadSource(
      kbTree({ 'systems.yaml': systems(), 'systems/systems.facts.yaml': table('Opens in the W2 town') }),
    );
    expect(issues(src)).toEqual([]);
  });

  it('fails a game System with no unlock row, and an activeon System that names one', () => {
    const noRow = loadSource(
      kbTree({
        'systems.yaml': systems(', unlockFact: systems.fact.unlocks'),
        'systems/systems.facts.yaml': table('Opens in the W2 town').replace(
          'system: alchemy',
          'system: other',
        ),
      }),
    );
    expect(issues(noRow)).toEqual([
      'afk: an activeon System has no unlockFact (M17 TR-8)',
      'alchemy: systems.fact.unlocks has no row for alchemy',
    ]);
  });

  it('fails an instruction, a missing wiki Source and a missing table', () => {
    const imperative = loadSource(
      kbTree({
        'systems.yaml': systems(),
        'systems/systems.facts.yaml': table('Opens after you Buy the cauldron'),
      }),
    );
    expect(issues(imperative)).toEqual([
      'systems.fact.unlocks: unlock row alchemy: condition form only, no advice words (M17 TR-9)',
    ]);
    const noWiki = loadSource(
      kbTree({
        'systems.yaml': systems(),
        'systems/systems.facts.yaml': table('Opens in the W2 town', `[${GUIDE}]`),
      }),
    );
    expect(issues(noWiki)).toEqual([
      'systems.fact.unlocks: unlock row alchemy has no IdleOn Wiki Source (FR-34)',
    ]);
    const missing = loadSource(kbTree({ 'systems.yaml': systems() }));
    expect(issues(missing)).toEqual(['alchemy: unlockFact systems.fact.unlocks is missing']);
  });
});
