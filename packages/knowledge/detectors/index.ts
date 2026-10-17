// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Knowledge Base Detector registry, auto-discovered: add `detectors/<system>/<name>.ts` with a
// default-exported `defineDetector({ id: '<system>/<name>', ... })` and it is registered. Never edit
// this file to add a Detector. Bundlers (Vite, Vitest) expand import.meta.glob at build time; the kb
// CLI, which runs under plain Node, discovers the same files on disk and checks the two sets agree.
import type { DetectorRegistry } from '../src/types';
import { buildRegistry } from './registry';

declare global {
  interface ImportMeta {
    glob<T>(pattern: string | string[], options: { eager: true }): Record<string, T>;
  }
}

export { buildRegistry, detectorIdFromPath, isDetectorPath, RegistryError } from './registry';

export const detectors: DetectorRegistry = buildRegistry(
  import.meta.glob<{ default?: unknown }>(['./*/*.ts', '!./*/*.test.ts', '!./*/_*.ts'], { eager: true }),
  'knowledge',
);
