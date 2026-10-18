// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What the Now screen's leaf components can do, passed down once instead of through every level.
import { createContext, useContext } from 'react';
import type { ReportInput } from './report';

/** What a Report this control knows about its output. */
export type ReportOutput = Pick<
  ReportInput,
  'outputKind' | 'entryIds' | 'fields' | 'text' | 'stale' | 'contested'
> &
  Partial<Pick<ReportInput, 'detectorIds' | 'optionId' | 'values'>>;

export interface NowActions {
  skip(key: string): void;
  unskip(keys: string[]): void;
  dismiss(key: string): void;
  undismiss(keys: string[]): void;
  /** The GitHub-issue fallback for Report this (signed out, or outside the Suggestions provider). */
  reportUrl(r: ReportOutput): string;
  /** Opens the in-app Suggest form for this output (M13 FR-9); null without the Suggestions provider. */
  openReport: ((r: ReportOutput) => void) | null;
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
