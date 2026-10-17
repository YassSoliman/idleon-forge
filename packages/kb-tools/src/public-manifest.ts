// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Public fixtures are pinned by content (TR-15): packages/kb-tools/fixtures/public-manifest.json
// maps each of our fixture ids to its upstream path and sha256. A sync that changes or removes a
// pinned file is reported as "public fixture changed upstream" instead of silently moving goldens.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { type PublicManifest, readPublicManifest, sha256 } from './fixtures';
import { PUBLIC_FIXTURES, PUBLIC_MANIFEST } from './paths';

const UPSTREAM_OF = (file: string) =>
  file === 'toolbox-raw.json' ? 'data/raw.json' : `__test__/fixtures/${file}`;

export interface ManifestDrift {
  changed: string[];
  removed: string[];
  added: string[];
}

/** Files on disk vs the manifest. Empty lists mean every pinned file is byte-identical. */
export function publicFixtureDrift(): ManifestDrift {
  const manifest = existsSync(PUBLIC_MANIFEST) ? readPublicManifest() : { description: '', fixtures: {} };
  const onDisk = readdirSync(PUBLIC_FIXTURES).filter((f) => f.endsWith('.json') && f !== 'manifest.json');
  const pinned = new Map(Object.entries(manifest.fixtures).map(([id, f]) => [f.file, { id, ...f }]));
  const drift: ManifestDrift = { changed: [], removed: [], added: [] };
  for (const [file, f] of pinned) {
    const p = path.join(PUBLIC_FIXTURES, file);
    if (!existsSync(p)) drift.removed.push(f.id);
    else if (sha256(readFileSync(p)) !== f.sha256) drift.changed.push(f.id);
  }
  for (const file of onDisk) if (!pinned.has(file)) drift.added.push(file.replace(/\.json$/, ''));
  return drift;
}

/** Re-pins every public fixture on disk (after a reviewed sync). */
export function writePublicManifest(): PublicManifest {
  const fixtures: PublicManifest['fixtures'] = {};
  for (const file of readdirSync(PUBLIC_FIXTURES)
    .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
    .sort()) {
    fixtures[file.replace(/\.json$/, '')] = {
      file,
      upstream: UPSTREAM_OF(file),
      sha256: sha256(readFileSync(path.join(PUBLIC_FIXTURES, file))),
    };
  }
  const manifest: PublicManifest = {
    description:
      "IdleOn Forge fixture ids for Toolbox's public saves, pinned by sha256 (M11 TR-15). Written by `pnpm kb fixtures --pin`; keep it when re-syncing.",
    fixtures,
  };
  writeFileSync(PUBLIC_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

export function formatDrift(d: ManifestDrift): string[] {
  return [
    ...d.changed.map((id) => `public fixture changed upstream: ${id}`),
    ...d.removed.map((id) => `public fixture removed upstream: ${id}`),
    ...d.added.map((id) => `new public fixture, not pinned yet: ${id}`),
  ];
}
