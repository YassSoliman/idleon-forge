// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What the Now screen's leaf components can do, passed down once instead of through every level.
import { createContext, useContext } from 'react';
import type { ReportInput } from './report';

export interface NowActions {
  skip(key: string): void;
  unskip(keys: string[]): void;
  dismiss(key: string): void;
  undismiss(keys: string[]): void;
  /** The Report this URL for an output (pre-M13: a GitHub issue form). */
  reportUrl(
    r: Pick<ReportInput, 'outputKind' | 'entryIds' | 'fields' | 'text' | 'stale' | 'contested'>,
  ): string;
  /** Opens a character's Focus as a player action (pushState, keyboard focus to its heading). */
  open(index: number): void;
  toggle(id: string): void;
  expanded: ReadonlySet<string>;
}

export const NowActionsContext = createContext<NowActions | null>(null);

export function useNowActions(): NowActions {
  const a = useContext(NowActionsContext);
  if (!a) throw new Error('NowActionsContext is missing');
  return a;
}
