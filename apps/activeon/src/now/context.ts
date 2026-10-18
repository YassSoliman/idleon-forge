// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What the Now screen's leaf components can do, passed down once instead of through every level.
import type { TimelineFix } from '@idleon-forge/engine/now';
import type { EngineResult } from '@idleon-forge/engine/result';
import { createContext, useContext } from 'react';
import type { Route } from '../shell/route';
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
  /** Opens a character's page on one of its tabs (`character-tabs.ts`), e.g. 'build'. */
  openTab(index: number, tab: string): void;
  toggle(id: string): void;
  /** M20 FR-15: tick a checklist row the save can't judge, until its period ends (null clears it). */
  tick?: (key: string, until: number | null) => void;
  expanded: ReadonlySet<string>;
  /** M17: a player move to another place or page (pushState, keyboard focus to its heading). */
  navigate?: (to: Route, opts?: { origin?: string; highlight?: string | null }) => void;
  /**
   * M17 FR-27: go to where a Next Action is shown (the account list, or a character's Now tab), unfold
   * "show more" or its details first, scroll to it and outline it. Absent in leaf tests.
   */
  reveal?: (fix: TimelineFix) => void;
  /** M17 FR-4: the place being shown ('now' on a Character page opened from the Roster). */
  place?: 'now' | 'characters' | 'systems' | 'timeline';
  /** The engine result, for "See it" links (M17 FR-31); absent in leaf tests. */
  result?: EngineResult;
  /** The NextAction key to outline (M17 FR-31). */
  highlight?: string | null;
}

export const NowActionsContext = createContext<NowActions | null>(null);

export function useNowActions(): NowActions {
  const a = useContext(NowActionsContext);
  if (!a) throw new Error('NowActionsContext is missing');
  return a;
}
