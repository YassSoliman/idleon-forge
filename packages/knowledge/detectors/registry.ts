// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Builds a Detector registry from discovered modules. Discovery is by file convention, so no module
// ever edits a shared index: a Detector is `detectors/<system>/<name>.ts` whose default export is a
// `defineDetector({...})` with `id: '<system>/<name>'`. The same convention holds for engine
// Detectors under packages/engine/detectors/ (TR-4). The bundler path is ./index.ts (import.meta.glob);
// the kb CLI walks the same files on disk (packages/kb-tools/src/discover.ts) and checks both agree.
import type { AnyDetector, DetectorRegistry } from '../src/types';

export class RegistryError extends Error {
  override name = 'RegistryError';
}

/** `./afk/no-afk-target.ts` or `/abs/.../detectors/afk/no-afk-target.ts` -> `afk/no-afk-target`. */
export function detectorIdFromPath(path: string): string | null {
  const m = /(?:^|\/)([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)\.ts$/.exec(path);
  return m ? `${m[1]}/${m[2]}` : null;
}

/** Whether a discovered path is a Detector module (not a test, helper or the registry itself). */
export const isDetectorPath = (path: string): boolean =>
  !/\.test\.ts$/.test(path) && !/\/_[^/]*$/.test(path) && detectorIdFromPath(path) !== null;

export function buildRegistry(
  modules: Readonly<Record<string, { default?: unknown }>>,
  expectKind?: 'engine' | 'knowledge',
): DetectorRegistry {
  const registry: DetectorRegistry = {};
  for (const path of Object.keys(modules).sort()) {
    if (!isDetectorPath(path)) continue;
    const id = detectorIdFromPath(path) as string;
    const d = modules[path]?.default as AnyDetector | undefined;
    if (!d || typeof d !== 'object' || typeof d.run !== 'function')
      throw new RegistryError(`${path}: default export is not a Detector (use defineDetector)`);
    if (d.id !== id) throw new RegistryError(`${path}: id "${d.id}" must be "${id}" (its file path)`);
    if (d.system !== id.split('/')[0])
      throw new RegistryError(`${path}: system "${d.system}" must match the folder`);
    if (expectKind === 'engine' && d.kind !== 'engine')
      throw new RegistryError(`${path}: Detectors in the engine registry are kind 'engine'`);
    if (expectKind === 'knowledge' && d.kind === 'engine')
      throw new RegistryError(`${path}: engine Detectors live in packages/engine/detectors/`);
    if (Object.hasOwn(registry, id)) throw new RegistryError(`duplicate Detector id ${id}`);
    registry[id] = d;
  }
  return Object.freeze(registry);
}
