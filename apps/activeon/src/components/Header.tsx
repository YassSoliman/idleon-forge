// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import type { AccountState } from '@idleon-forge/account-state';
import { formatAge, freshnessHint } from '../format';
import type { SaveSource, SyncState } from '../use-activeon';
import { useNow } from '../use-now';

export interface HeaderSave {
  state: AccountState;
  source: SaveSource;
  /** `last-good` while the newest save can't be read: the age is of the last good one (FR-15). */
  tag: 'current' | 'last-good';
}

interface Props {
  save: HeaderSave | null;
  sync: SyncState;
  online: boolean;
  lastSnapshotAt: number | null;
}

/** The "last cloud save Ns ago" chip: the only part of the header that re-renders every second. */
function SaveAge({ save }: { save: HeaderSave | null }) {
  const now = useNow();
  const saved = save?.state.account.lastCloudSave ?? null;
  if (save === null || saved === null) return <span className="sync none">no save yet</span>;
  const age = formatAge(Math.max(0, (now - saved) / 1000));
  const prefix = save.tag === 'last-good' ? 'last good save' : 'last cloud save';
  return (
    <span className={save.tag === 'last-good' ? 'sync old' : 'sync'} title={new Date(saved).toLocaleString()}>
      {save.source === 'paste' ? 'pasted · ' : ''}
      {prefix} <span className="num">{age}</span> ago
    </span>
  );
}

/** The refresh hint (FR-26, FR-27). Its text changes rarely, so its status role announces it once. */
function StaleHint({ save, lastSnapshotAt }: { save: HeaderSave | null; lastSnapshotAt: number | null }) {
  const now = useNow();
  const hint =
    save?.tag === 'current'
      ? freshnessHint({
          now,
          source: save.source,
          lastCloudSave: save.state.account.lastCloudSave,
          lastSnapshotAt,
        })
      : null;
  return (
    <p className="hint" role="status">
      {hint}
    </p>
  );
}

export function Header({ save, sync, online, lastSnapshotAt }: Props) {
  // Offline first: Firestore reconnects on its own when the network returns (FR-28).
  const connection = !online ? 'Offline' : sync.status === 'reconnecting' ? 'Reconnecting…' : null;
  return (
    <header className="top">
      <h1>
        Active<span>On</span>
      </h1>
      <div className="top-status">
        {connection ? <span className="sync warn">{connection}</span> : null}
        <SaveAge save={save} />
      </div>
      <StaleHint save={save} lastSnapshotAt={lastSnapshotAt} />
    </header>
  );
}
