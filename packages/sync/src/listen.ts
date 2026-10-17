// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Live sync: an onSnapshot listener on the save, Firestore `_data/{uid}`, plus the side reads the
// parsers need, mirroring Toolbox's firebase/index.js subscribe(). Read-only: nothing here writes.
import type { RawSaveEnvelope } from '@idleon-forge/toolbox-parsers';
import { child, get, goOnline, ref } from 'firebase/database';
import { type DocumentSnapshot, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { assembleEnvelope } from './envelope';
import type { Session } from './session';

export interface SaveListener {
  /** Called on every cloud save (every ~4 min of play, or on switching character). */
  onEnvelope: (envelope: RawSaveEnvelope) => void;
  onError: (error: Error) => void;
}

const readRtdb = async (session: Session, path: string): Promise<unknown> => {
  try {
    const snap = await get(child(ref(session.database), path));
    return snap.exists() ? snap.val() : null;
  } catch {
    // Side data is optional to the parsers; missing pieces degrade gracefully (see the parser spike).
    return null;
  }
};

const readDoc = async (
  session: Session,
  path: string,
  id: string,
): Promise<Record<string, unknown> | null> => {
  try {
    const snap = await getDoc(doc(session.firestore, path, id));
    return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

/**
 * Firestore's web SDK does not expose a document's create time publicly; Toolbox reads the same
 * internal field. Best effort only: the parsers merely pass it through.
 */
const createTimeOf = (snap: DocumentSnapshot): number | null => {
  try {
    const internal = (snap as unknown as { _document?: { createTime?: { toTimestamp?: () => unknown } } })
      ._document;
    const ts = internal?.createTime?.toTimestamp?.() as { toMillis?: () => number } | undefined;
    const ms = ts?.toMillis?.();
    return typeof ms === 'number' && Number.isFinite(ms) ? ms : null;
  } catch {
    return null;
  }
};

/** Starts listening. Resolves to an unsubscribe function once the bootstrap reads are done. */
export async function listenToSave(
  session: Session,
  uid: string,
  listener: SaveListener,
): Promise<() => void> {
  goOnline(session.database);
  // Bootstrap reads. The save itself is not fetched here: onSnapshot delivers it straight away.
  const [charNames, serverVars] = await Promise.all([
    readRtdb(session, `_uid/${uid}`),
    readDoc(session, '_vars', '_vars'),
  ]);
  if (!charNames || (Array.isArray(charNames) && charNames.length === 0)) {
    throw new Error('No characters found for this account. Is this the Google account you play with?');
  }

  let latest = 0;
  return onSnapshot(
    doc(session.firestore, '_data', uid),
    async (snap) => {
      if (!snap.exists()) return;
      const seq = ++latest;
      const capturedAt = Date.now();
      const cloudsave = snap.data() as Record<string, unknown>;
      try {
        const [companion, guildId, tournamentUser, tournamentMatch, tournamentGlobal] = await Promise.all([
          readRtdb(session, `_comp/${uid}`),
          readRtdb(session, `_usgu/${uid}/g`),
          readRtdb(session, `_tournament/${uid}`),
          readDoc(session, '_T_RES_UID', uid),
          readDoc(session, '_TOURNAMENT', '_TOURNAMENT'),
        ]);
        const guild = guildId ? await readRtdb(session, `_guild/${String(guildId)}`) : null;
        if (seq !== latest) return; // a newer save arrived while we were reading; it wins
        listener.onEnvelope(
          assembleEnvelope({
            cloudsave,
            charNames,
            serverVars,
            companion,
            guildId,
            guild,
            tournamentUser,
            tournamentMatch,
            tournamentGlobal,
            accountCreateTime: createTimeOf(snap),
            capturedAt,
          }),
        );
      } catch (err) {
        listener.onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    (err) => listener.onError(err),
  );
}
