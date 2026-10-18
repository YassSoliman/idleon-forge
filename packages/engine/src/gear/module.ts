// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 as one engine module, `gear` (docs/specs/M18-gear-tools.md TR-1). It runs with the other modules
// (`after: false`), so M14's walkthrough step (which runs after every module) sees its Goals and builds
// their Walkthroughs from the inline roots they carry (X3). No Verdict, no blocker.
import type { EngineInput, EngineModule, ModuleOutput } from '../core/module';
import { runMetaPath } from '../metapath';
import { buildGear } from './build';
import { ENTRY as GEAR_ENTRY, type GearKnowledge, say } from './kb';

export interface GearModuleDeps {
  kb: GearKnowledge;
}

export function createGearModule(deps: GearModuleDeps): EngineModule {
  return {
    id: 'gear',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    run(input: EngineInput): ModuleOutput {
      const full = input.knowledge.kb;
      if (!full) return {};
      const meta = runMetaPath(input.state, full, input.now);
      const out = buildGear({ state: input.state, kb: deps.kb, meta });
      if (!out) return {};
      // X5: M6's unlock-point and merit lines name the recipes M18's Goals need first (a detail, never
      // its text; the core adds it to the Goal with that key, M19's goalNotes).
      const wants = out.result.unlockWants;
      const keyOf = (w: (typeof wants)[number]) =>
        w.kind === 'task-unlock'
          ? 'task-unlocks.check.spend@account'
          : `merit-shop.check.spend-w${w.world}@account`;
      const goalNotes = [...new Set(wants.map(keyOf))].map((key) => ({
        key,
        details: [
          {
            subject: 'account' as const,
            text: say(deps.kb, GEAR_ENTRY.next, 'detail-unlocks', {
              items: wants
                .filter((w) => keyOf(w) === key)
                .map((w) => w.what)
                .join(', '),
            }),
          },
        ],
      }));
      return {
        characters: [...out.characters].map(([index, goals]) => ({ index, goals })),
        account: { goals: out.account },
        gear: out.result,
        ...(goalNotes.length ? { goalNotes } : {}),
      };
    },
  };
}
