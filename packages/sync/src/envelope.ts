// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Assembles the parser input from the save document and the side reads, the same way Toolbox's
// firebase/index.js subscribe() callback does.
import type { RawSaveEnvelope, SideReadName } from '@idleon-forge/toolbox-parsers';

export interface SideReads {
  /** Firestore `_data/{uid}`. */
  cloudsave: Record<string, unknown>;
  /** RTDB `_uid/{uid}`. */
  charNames: unknown;
  /** Firestore `_vars/_vars`. */
  serverVars: Record<string, unknown> | null;
  /** RTDB `_comp/{uid}`. */
  companion: unknown;
  /** RTDB `_usgu/{uid}/g`. */
  guildId: unknown;
  /** RTDB `_guild/{guildId}`. */
  guild: unknown;
  /** RTDB `_tournament/{uid}`. */
  tournamentUser: unknown;
  /** Firestore `_T_RES_UID/{uid}`. */
  tournamentMatch: unknown;
  /** Firestore `_TOURNAMENT/_TOURNAMENT`. */
  tournamentGlobal: unknown;
  /** When the save document was created (epoch ms), if the SDK exposed it. */
  accountCreateTime: number | null;
  /** When this snapshot arrived (epoch ms). */
  capturedAt: number;
  /** Side reads that errored (not merely absent), passed through to the Account State (FR-17). */
  failedSideReads?: SideReadName[];
}

const tryToParse = (v: unknown): unknown => {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

/** RTDB returns arrays as arrays, or as `{0: .., 1: ..}` objects when there are gaps. */
const toNames = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map((n) => String(n ?? ''));
  const rec = asRecord(v);
  return rec ? Object.values(rec).map((n) => String(n ?? '')) : [];
};

export function assembleEnvelope(r: SideReads): RawSaveEnvelope {
  const guild = asRecord(r.guild);
  const envelope: RawSaveEnvelope = {
    data: r.cloudsave,
    charNames: toNames(r.charNames),
    companion: r.companion ?? null,
    guildData: {
      id: r.guildId ?? null,
      stats: tryToParse(r.cloudsave.Guild),
      members: Object.values(asRecord(guild?.m) ?? {}),
      points: guild?.p,
    },
    tournament: {
      user: r.tournamentUser ?? null,
      match: r.tournamentMatch ?? null,
      global: r.tournamentGlobal ?? null,
      leaderboard: [],
    },
    lastUpdated: r.capturedAt,
  };
  if (r.serverVars) envelope.serverVars = r.serverVars;
  if (r.accountCreateTime !== null) envelope.accountCreateTime = r.accountCreateTime;
  if (r.failedSideReads) envelope.sideReadReport = { failed: [...r.failedSideReads] };
  return envelope;
}
