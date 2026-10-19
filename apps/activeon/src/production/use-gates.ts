// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C FR-C1, FR-C2: the gate spans of the current result and the shell move a gate chip makes (a
// push to the System page's tab, its row focused), for any view under the shell.
import type { GateSpan } from '@idleon-forge/engine/production';
import { useCallback } from 'react';
import { useNowActions } from '../now/context';

export function useGates(): { tabGates: readonly GateSpan[] | null; onNavigate?: (g: GateSpan) => void } {
  const a = useNowActions();
  const nav = a.navigate;
  const onNavigate = useCallback(
    (g: GateSpan) =>
      nav?.({ place: 'system', id: g.system, tab: g.tab, ...(g.focus ? { focus: g.focus } : {}) }),
    [nav],
  );
  return { tabGates: a.result?.production?.tabGates ?? null, ...(nav ? { onNavigate } : {}) };
}
