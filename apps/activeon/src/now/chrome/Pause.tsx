// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The pause points (M21 FR-N6, `flows.session-checklist` Auto tab): Log in · Rounds · Log off, picked
// from context with one muted line saying why; the player can switch, and a manual pick holds for the
// rest of the Play Session (D-8), across place moves and saves. M24: each pause point's view is in
// now/place/ (Log off first-load; Log in and Rounds a lazy part).
//
// The Log off list is DO-CONFIRM: it remembers the items it showed, and an item the next cloud save no
// longer lists is ticked by the save, never by a tap (DS-2).
import { PAUSE_WORDS, type PauseTab } from '@idleon-forge/engine/now';
import { useCallback, useEffect, useState } from 'react';
import { SegmentedControl } from '../../design/atoms/Choice';
import type { NowSessionView } from '../session/types';

interface Stored {
  session: number | null;
  manual: PauseTab | null;
  /** The Log off items first shown this Play Session, by key, for the save to tick (DO-CONFIRM). */
  logoff: { key: string; text: string; who: string | null }[];
}

const KEY = 'activeon:pause';
const read = (session: number | null): Stored => {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Stored | null;
    if (v && v.session === session) return v;
  } catch {}
  return { session, manual: null, logoff: [] };
};
const write = (v: Stored) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
};

/** The pause point's UI state for this Play Session (tab-scoped storage, reset with a new session). */
export function usePauseState(session: number | null) {
  const [state, setState] = useState<Stored>(() => read(session));
  useEffect(() => setState(read(session)), [session]);
  const update = useCallback(
    (patch: Partial<Stored>) =>
      setState((prev) => {
        const next = { ...prev, ...patch, session };
        write(next);
        return next;
      }),
    [session],
  );
  return [state, update] as const;
}

export function PauseControl({ view, onPick }: { view: NowSessionView; onPick(tab: PauseTab): void }) {
  const tabs: PauseTab[] = ['login', 'rounds', 'logoff'];
  return (
    <div className="n-pause">
      <SegmentedControl<PauseTab>
        label={PAUSE_WORDS.label}
        value={view.tab}
        options={tabs.map((t) => ({ value: t, label: PAUSE_WORDS.tabs[t] }))}
        onChange={onPick}
      />
      <p className="n-pause__why">{view.why}</p>
    </div>
  );
}
