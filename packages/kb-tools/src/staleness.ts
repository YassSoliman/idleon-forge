// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The deterministic part of the staleness pass (TR-11 step 2): `kb facts --mentions <gameVersion>`
// lists the authored entries whose System, entities or rawNames appear in that version's patch notes.
// The LLM judges each candidate afterwards (step 3); nothing here decides staleness.
import { readFileSync } from 'node:fs';
import type { KbSource } from './load';
import { readPin } from './paths';
import { loadPatchNotes, patchNotesFile } from './toolbox-data';

export async function loadPatchNotesText(): Promise<string> {
  const pin = readPin();
  await loadPatchNotes(pin);
  return readFileSync(patchNotesFile(pin), 'utf8');
}

/** The notes text of every Toolbox release tagged with `gameVersion`. */
export function notesFor(text: string, gameVersion: string): string {
  const blocks = text.split(/\n\s*\{\s*\n\s*'ver':/);
  return blocks.filter((b) => b.includes(`'gameVer': '${gameVersion}'`)).join('\n');
}

const words = (s: string) => s.toLowerCase().replace(/_/g, ' ');

/** Candidate entries for the staleness pass: their System name, id slug or a rawName appears in the notes. */
export function mentionedEntries(src: KbSource, gameVersion: string, text: string): string[] {
  const notes = words(notesFor(text, gameVersion));
  if (!notes.trim()) return [`no patch notes for ${gameVersion}`];
  const systemName = new Map(src.systems.map((s) => [s.value.id, s.value.name]));
  const out: string[] = [];
  for (const e of src.authored) {
    const v = e.value;
    const terms = new Set<string>([words(systemName.get(v.system) ?? v.system), words(v.title)]);
    const raw = (x: unknown) => {
      if (typeof x === 'string' && /^[A-Z][A-Za-z0-9_]{3,}$/.test(x)) terms.add(words(x));
      else if (Array.isArray(x)) x.forEach(raw);
      else if (x && typeof x === 'object') Object.values(x).forEach(raw);
    };
    raw(v);
    const hits = [...terms].filter((t) => t.length > 3 && notes.includes(t));
    if (hits.length) out.push(`${v.id}\t${e.file}:${e.lineOf()}\tmentions: ${hits.join(', ')}`);
  }
  return out.length ? out : [`no authored entry is mentioned by ${gameVersion}`];
}
