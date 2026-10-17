// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import type { AccountState } from '@idleon-forge/account-state';
import { formatAge } from '../format';
import type { SaveSource } from '../use-activeon';

/** The game cloud-saves about every 4 minutes of play; older than that means no fresh save is coming. */
const STALE_AFTER_S = 240;

interface Props {
  state: AccountState | null;
  source: SaveSource | null;
  now: number;
}

export function Header({ state, source, now }: Props) {
  const saved = state?.account.lastCloudSave ?? null;
  const age = saved === null ? null : Math.max(0, (now - saved) / 1000);
  const stale = age !== null && age > STALE_AFTER_S;

  return (
    <header className="top">
      <h1>
        Active<span>On</span>
      </h1>
      <div className="top-status" aria-live="polite">
        {age === null ? (
          <span className="sync none">no save yet</span>
        ) : (
          <span className={stale ? 'sync old' : 'sync'} title={new Date(saved ?? 0).toLocaleString()}>
            {source === 'paste' ? 'pasted · ' : ''}last cloud save {formatAge(age)} ago
          </span>
        )}
      </div>
      {stale && source === 'live' ? (
        <p className="hint">No new save for a while: switch character in the game to refresh.</p>
      ) : null}
    </header>
  );
}
