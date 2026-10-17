// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Accepts what a player can paste: Toolbox's "Copy for support" envelope, an envelope without the
// extras, or a bare save ("Copy raw data"). Mirrors Toolbox's helpers.handleLoadJson.
import type { RawSaveEnvelope } from './types';

export class InvalidSaveInputError extends Error {
  override name = 'InvalidSaveInputError';
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const optionalNumber = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

/** Normalizes pasted or fetched input into a `RawSaveEnvelope`. Throws `InvalidSaveInputError`. */
export function normalizeEnvelope(input: unknown): RawSaveEnvelope {
  if (!isRecord(input)) throw new InvalidSaveInputError('Expected a JSON object.');
  const isEnvelope = isRecord(input.data);
  const data = isEnvelope ? (input.data as Record<string, unknown>) : input;
  if (Object.keys(data).length === 0) throw new InvalidSaveInputError('The save is empty.');
  if (!isEnvelope) return { data };

  const envelope: RawSaveEnvelope = { data };
  if (Array.isArray(input.charNames)) envelope.charNames = input.charNames.map(String);
  if (input.companion !== undefined) envelope.companion = input.companion;
  if (input.guildData !== undefined) envelope.guildData = input.guildData;
  if (isRecord(input.serverVars)) envelope.serverVars = input.serverVars;
  if (input.tournament !== undefined) envelope.tournament = input.tournament;
  const created = optionalNumber(input.accountCreateTime);
  if (created !== undefined) envelope.accountCreateTime = created;
  const captured = optionalNumber(input.lastUpdated);
  if (captured !== undefined) envelope.lastUpdated = captured;
  return envelope;
}

/** `JSON.parse` + `normalizeEnvelope`, with a readable error for non-JSON text. */
export function parseEnvelopeText(text: string): RawSaveEnvelope {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new InvalidSaveInputError('That is not valid JSON.');
  }
  return normalizeEnvelope(json);
}
