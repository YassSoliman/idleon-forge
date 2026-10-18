// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 Integration (TR-12): the Now place's session view (the counter, grouped jobs, findings, folds and
// pause points, area N's `buildSessionView`) is built in this small lazy chunk, so the builder is not in
// the first load. NowScreen starts the chunk with its own module, so it is in long before the worker's
// first parse; the components that draw the view stay in the first load and receive it as `children`.
import type { NowView, SessionUi } from '@idleon-forge/engine/now';
import type { EngineResult } from '@idleon-forge/engine/result';
import { buildSessionView } from '@idleon-forge/engine/session-view';
import { type ReactNode, useMemo } from 'react';
import type { NowSessionView } from './types';

export interface SessionHostProps {
  view: NowView;
  result: EngineResult;
  ui: SessionUi;
  children: (sv: NowSessionView) => ReactNode;
}

export function SessionHost({ view, result, ui, children }: SessionHostProps) {
  const sv = useMemo(() => buildSessionView(view, result, ui), [view, result, ui]);
  return <>{children(sv)}</>;
}
