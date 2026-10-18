// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-10: the `pictures` engine module, owned by area S (Systems). Phase F registers this stub so the
// worker's module list never changes again; area S fills it with the stamps, statues, vault, printer
// and p2w SystemPicture kinds (slots/types.ts `M21Picture`). It emits nothing yet.
import type { EngineModule, ModuleOutput } from '../core/module';

export function createPicturesModule(): EngineModule {
  return {
    id: 'pictures',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    run(): ModuleOutput {
      return {};
    },
  };
}
