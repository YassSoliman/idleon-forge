// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `buildSystemPageFrameView` (M21 FR-S3, area S): M17's `buildSystemPageView` plus the Step-first frame's
// data: the page's step (its first open Next Action with who, DS-3), the Stage meter (only when the
// System has a behind row with its Stage) and the page's pictures. Pure and deterministic. It lives under
// `@idleon-forge/engine/systems-ui`, not the `now` barrel, so it loads with the lazy System page and never
// in the first load (TR-12): the barrel's modules all bundle into one first-load chunk.
import { STAGES } from '@idleon-forge/knowledge/stages';
import type { NowPrefs } from '../now/prefs';
import { buildSystemPageView, readPrefs, type SystemsUi } from '../now/systems-view';
import type { NowView, SystemPageView } from '../now/view';
import type { EngineResult, SystemPicture } from '../result';
import { isStage, type SystemStepView, stageLabel, whoToken } from './hub-view';
import { FRAME_WORDS } from './words';

export interface SystemPageExtras {
  /** FR-S3: the page's step, the first open Next Action of the System (at most two lines, DS-18). */
  step: SystemStepView | null;
  /** FR-S3: the Stage meter, only when the System has a behind row with its Stage. */
  stageMeter: { text: string; value: number; max: number; label: string } | null;
  /** FR-S4, FR-S5: this System's pictures (M20's and area S's), from `EngineResult.slotPictures`. */
  pictures: SystemPicture[];
}

const indexOfSubject = (subject: string): number | null =>
  subject.startsWith('c') ? Number(subject.slice(1)) : null;

export function buildSystemPageFrameView(
  result: EngineResult,
  nowPrefs: NowPrefs,
  nowView: Pick<NowView, 'roster'>,
  ui: SystemsUi & { id: string; highlight: string | null },
): (SystemPageView & SystemPageExtras) | null {
  const page = buildSystemPageView(result, nowPrefs, nowView, ui);
  if (!page) return null;
  const prefs = readPrefs(result, nowPrefs, ui);
  const first = page.goals[0];
  const step: SystemStepView | null = first
    ? {
        key: first.action.key,
        text: first.action.text,
        who: whoToken(result, indexOfSubject(first.subject)),
      }
    : null;
  const stage = result.stage.id;
  const row = (result.behindSystems ?? []).find(
    (r) => r.systemId === page.tile.id && isStage(r.expectedBy) && r.findingKeys.some((k) => prefs.open(k)),
  );
  const stageMeter =
    row && isStage(stage) && isStage(row.expectedBy)
      ? {
          text: FRAME_WORDS.stageMeter(stageLabel(row.expectedBy), stageLabel(stage)),
          value: STAGES.indexOf(row.expectedBy) + 1,
          max: STAGES.indexOf(stage) + 1,
          label: FRAME_WORDS.stageMeter(stageLabel(row.expectedBy), stageLabel(stage)),
        }
      : null;
  return { ...page, step, stageMeter, pictures: picturesOf(result, page.tile.id) };
}

/** The pictures drawn on a System's page: its own (M20's and area S's). */
export function picturesOf(result: EngineResult, systemId: string): SystemPicture[] {
  return (result.slotPictures ?? []).filter((p) => p.systemId === systemId);
}
