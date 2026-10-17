// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The engine Detector registry (M11 TR-4), auto-discovered like the Knowledge Base's: add
// `detectors/<system>/<name>.ts` whose default export is an engine Detector (`kind: 'engine'`) with
// `id: '<system>/<name>'`. Never edit this file to add one; the kb CLI discovers the same files on disk.

import type { DetectorRegistry } from '@idleon-forge/knowledge';
import { buildRegistry } from '@idleon-forge/knowledge/detectors-registry';

export const engineDetectors: DetectorRegistry = buildRegistry(
  import.meta.glob<{ default?: unknown }>(['./*/*.ts', '!./*/*.test.ts', '!./*/_*.ts'], { eager: true }),
  'engine',
);
