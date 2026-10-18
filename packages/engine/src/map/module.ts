// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-9: the `map` engine module, owned by area M (Map and nav). Phase F registers this stub so the
// worker's module list and EngineResult never change shape again; area M fills it with the MapResult
// (worlds, gates, frontier, markers, doors, overlays).
import type { EngineModule, ModuleOutput } from '../core/module';

export function createMapModule(): EngineModule {
  return {
    id: 'map',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    run(): ModuleOutput {
      return { map: null };
    },
  };
}
