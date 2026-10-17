// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Throwaway Knowledge Base trees for tests: a systems.yaml, majors.yaml and the files given, written
// under kb-tools/.cache (gitignored) so error paths read like the real ones (".../systems/x.yaml:12").
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { type DetectorRegistry, defineDetector } from '@idleon-forge/knowledge';
import { buildRegistry } from '@idleon-forge/knowledge/detectors-registry';
import { z } from 'zod';
import type { Registries } from '../src/discover';
import { CACHE } from '../src/paths';

let n = 0;

export const SYSTEMS_YAML = `systems:
  - { id: afk, name: AFK safety, world: 0, scope: character, dossier: https://example.org/afk, unlocked: always }
  - { id: alchemy, name: Alchemy, world: 2, scope: both, dossier: https://example.org/alchemy, unlocked: always }
  - { id: metapath, name: Meta Path, world: 0, scope: account, dossier: https://example.org/m, unlocked: always }
  - { id: death-note, name: Death Note, world: 3, scope: account, dossier: https://example.org/d, unlocked: always }
`;

/** Writes a tree and returns its root. `files` maps paths under the root to their content. */
export function kbTree(files: Record<string, string>): string {
  n += 1;
  const root = path.join(CACHE, `test-kb-${process.pid}-${n}`);
  rmSync(root, { recursive: true, force: true });
  const all: Record<string, string> = {
    'systems.yaml': SYSTEMS_YAML,
    'majors.yaml': 'majors: []\n',
    ...files,
  };
  for (const [rel, content] of Object.entries(all)) {
    const p = path.join(root, rel);
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
  return root;
}

export const SRC1 = `{ url: https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/parsers/character.ts, title: Toolbox, tier: 1, verified: 2026-10-17, gameVersion: 2.3.540 }`;
export const SRC3 = `{ url: https://www.reddit.com/r/idleon/comments/1/, title: thread, tier: 3, claimDate: 2026-09-01, verified: 2026-10-17, gameVersion: 2.3.540 }`;

/** One authored entry as YAML lines (indented for `entries:`). */
export function entry(fields: Record<string, string>): string {
  const base: Record<string, string> = {
    title: 'A title',
    text: 'Some text',
    why: 'A reason',
    sources: `[${SRC1}]`,
    appliesTo: '{ stages: all }',
    confidence: 'H',
    status: 'active',
    ...fields,
  };
  const order = [
    'id',
    'system',
    'type',
    ...Object.keys(base).filter((k) => !['id', 'system', 'type'].includes(k)),
  ];
  return order
    .filter((k) => base[k] !== undefined)
    .map((k, i) => `${i === 0 ? '  - ' : '    '}${k}: ${base[k]}`)
    .join('\n');
}

export const file = (system: string, ...entries: string[]) =>
  `system: ${system}\nentries:\n${entries.join('\n')}\n`;

const none = z.strictObject({});
/** Small test Detectors, one of each kind the tests need. */
export function testRegistries(extra: Record<string, unknown> = {}): Registries {
  const mk = (
    id: string,
    kind: 'check' | 'progress' | 'milestone' | 'contribution',
    slots: z.ZodType = none,
    params: z.ZodType = none,
  ) =>
    defineDetector({
      id,
      kind,
      system: id.split('/')[0] as string,
      params: params as z.ZodType,
      slots: slots as z.ZodType<Record<string, number | string>>,
      reads: ['characters[*].afkType'],
      examples: { fires: [], silent: [] },
      run: () => [],
    });
  const modules: Record<string, { default: unknown }> = {
    './afk/no-target.ts': {
      default: mk('afk/no-target', 'check', z.strictObject({ suggestion: z.string() })),
    },
    './alchemy/slots.ts': {
      default: mk(
        'alchemy/slots',
        'check',
        z.strictObject({ slot: z.number() }),
        z.strictObject({ min: z.int().default(1) }),
      ),
    },
    './death-note/kills.ts': { default: mk('death-note/kills', 'progress') },
    './worlds/reached.ts': { default: mk('worlds/reached', 'milestone') },
    ...Object.fromEntries(Object.entries(extra).map(([id, d]) => [`./${id}.ts`, { default: d }])),
  };
  return { knowledge: buildRegistry(modules) as DetectorRegistry, engine: {} };
}
