// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// generated/_patches.json (M11 TR-11): the distinct game versions in Toolbox's patch notes, oldest
// first, with letter suffixes normalised (2.0.493a -> 2.0.493). 120 Toolbox releases carried only 42
// distinct game versions at pin 6c37e3d; versions Toolbox never wrote notes for are simply absent.
import { compareGameVersions } from '../src/stale';
import { defineGenerator } from './types';

export function distinctPatches(notes: readonly { gameVer: string; date: string | null }[]) {
  const firstDate = new Map<string, string | null>();
  for (const n of notes) {
    const m = /^(\d+)\.(\d+)\.(\d+)/.exec(n.gameVer);
    if (!m) continue;
    const v = `${Number(m[1])}.${Number(m[2])}.${Number(m[3])}`;
    // Notes are newest first; keep the oldest date a version appears with.
    if (!firstDate.has(v) || n.date !== null) firstDate.set(v, n.date ?? firstDate.get(v) ?? null);
  }
  const patches = [...firstDate.keys()].sort(compareGameVersions);
  return { patches, dates: Object.fromEntries(patches.map((p) => [p, firstDate.get(p) ?? null])) };
}

export default defineGenerator({
  name: '_patches',
  system: 'patches',
  raw: true,
  inputs: ['data/patch-notes.js#patchNotes'],
  run({ patchNotes, pin }) {
    if (patchNotes.length === 0)
      throw new Error('_patches: no patch notes (fetch data/patch-notes.js at the pin)');
    const out = distinctPatches(patchNotes);
    if (!out.patches.includes(pin.gameVersion))
      throw new Error(`_patches: the pin's game version ${pin.gameVersion} is not in the patch notes`);
    return out;
  },
});
