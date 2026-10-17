// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeEnvelope, parseSave } from '@idleon-forge/toolbox-parsers';
import { type AccountState, toAccountState } from '../src';

/** Fixed clock for every contract test, so results are reproducible. */
export const NOW = Date.UTC(2026, 9, 17, 12);

const dir = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
export const PUBLIC_DIR = dir('../fixtures/public/');
/** Real saves: gitignored, local only, may be absent (always absent in CI). */
export const PRIVATE_DIR = dir('../../../fixtures/private/');

export const listJson = (folder: string, suffix = '.json'): string[] =>
  existsSync(folder)
    ? readdirSync(folder)
        .filter((f) => f.endsWith(suffix))
        .sort()
    : [];

export const readSave = (folder: string, file: string): unknown =>
  JSON.parse(readFileSync(folder + file, 'utf8'));

export const accountStateOf = (
  input: unknown,
  now = NOW,
  source: 'live' | 'paste' = 'paste',
): AccountState => {
  const envelope = normalizeEnvelope(input);
  return toAccountState(parseSave(envelope, { now }), envelope, { source });
};

type Envelope = { data: Record<string, unknown>; [key: string]: unknown };

/** A deep copy of a fixture with its raw save changed by `edit` (keys removed, ids made unknown). */
export const editedSave = (input: unknown, edit: (data: Record<string, unknown>) => void): Envelope => {
  const copy = structuredClone(input) as Envelope;
  edit(copy.data);
  return copy;
};
