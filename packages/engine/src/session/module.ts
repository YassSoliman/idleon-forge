// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-11: the `session` engine module, owned by area N (Now and flows). Phase F registers this stub
// so the worker's module list and EngineResult never change shape again; area N fills it with the
// Play Session facts (SessionFacts) it reads from the save history.
import type { EngineModule, ModuleOutput } from '../core/module';

export function createSessionModule(): EngineModule {
  return {
    id: 'session',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    run(): ModuleOutput {
      return { session: null };
    },
  };
}
