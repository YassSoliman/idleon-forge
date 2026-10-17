// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Discovers Detectors and generators on disk, by the same file conventions the bundler path uses
// (packages/knowledge/detectors/index.ts). Engine Detectors live in packages/engine/detectors/ and are
// optional: until packages/engine exists the engine registry is empty.
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { DetectorRegistry } from '@idleon-forge/knowledge';
import { buildRegistry, isDetectorPath } from '@idleon-forge/knowledge/detectors-registry';
import type { Generator } from '@idleon-forge/knowledge/generators';
import { DETECTORS_DIR, ENGINE_DETECTORS_DIR, GENERATORS_DIR } from './paths';

/** `<dir>/<system>/<name>.ts` files, sorted, as paths relative to `dir` prefixed with `./`. */
export function detectorFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const system of readdirSync(dir).sort()) {
    const sub = path.join(dir, system);
    if (!statSync(sub).isDirectory()) continue;
    for (const f of readdirSync(sub).sort()) {
      const rel = `./${system}/${f}`;
      if (f.endsWith('.ts') && isDetectorPath(rel)) out.push(rel);
    }
  }
  return out;
}

async function importAll(dir: string, files: readonly string[]) {
  const modules: Record<string, { default?: unknown }> = {};
  for (const f of files)
    modules[f] = (await import(pathToFileURL(path.join(dir, f)).href)) as { default?: unknown };
  return modules;
}

export interface Registries {
  knowledge: DetectorRegistry;
  engine: DetectorRegistry;
}

const cache = new Map<string, Promise<Registries>>();

/** The Knowledge Base and engine Detector registries, discovered on disk. */
export function discoverDetectors(
  knowledgeDir: string = DETECTORS_DIR,
  engineDir: string = ENGINE_DETECTORS_DIR,
): Promise<Registries> {
  const key = `${knowledgeDir}|${engineDir}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = (async () => ({
      knowledge: buildRegistry(await importAll(knowledgeDir, detectorFiles(knowledgeDir)), 'knowledge'),
      engine: buildRegistry(await importAll(engineDir, detectorFiles(engineDir)), 'engine'),
    }))();
    cache.set(key, hit);
  }
  return hit;
}

/** `generators/<name>.gen.ts`, sorted. */
export function generatorFiles(dir: string = GENERATORS_DIR): string[] {
  return existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.gen.ts'))
        .sort()
    : [];
}

/** Every generator, by name. Each file's default export must be a Generator whose name matches the file. */
export async function discoverGenerators(dir: string = GENERATORS_DIR): Promise<Generator[]> {
  const out: Generator[] = [];
  for (const f of generatorFiles(dir)) {
    const mod = (await import(pathToFileURL(path.join(dir, f)).href)) as { default?: Generator };
    const g = mod.default;
    const name = f.replace(/\.gen\.ts$/, '');
    if (!g || typeof g.run !== 'function')
      throw new Error(`generators/${f}: default export is not a Generator`);
    if (g.name !== name)
      throw new Error(`generators/${f}: name "${g.name}" must be "${name}" (its file name)`);
    out.push(g);
  }
  return out;
}
