// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4 as one engine module, `world4`: it builds the read-only Laboratory, Cooking and Breeding
// pages and the World 4 welcome (EngineResult.world4) from the Account State. No Detector, Goal, Check
// or Verdict: World 4 advice needs its own spec and red team. Pure (the clock is `now`).
import type { EngineInput, EngineModule, ModuleOutput } from '../core/module';
import { classTree, lookupOf } from '../metapath/knowledge';
import { buildWorld4View } from './view';

export function createWorld4Module(): EngineModule {
  return {
    id: 'world4',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    run(input: EngineInput): ModuleOutput {
      const kb = input.knowledge.kb ?? null;
      let tree = null;
      if (kb) {
        try {
          tree = classTree(lookupOf(kb));
        } catch {
          tree = null;
        }
      }
      return { world4: buildWorld4View(input.state, tree) };
    },
  };
}
