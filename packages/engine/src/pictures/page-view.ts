// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `buildSystemPageFrameView` (M21 FR-S3, area S): M17's `buildSystemPageView` plus the Step-first frame's
// data: the page's step (its first open Next Action with who, DS-3), the Stage meter (only when the
// System has a behind row with its Stage) and the page's pictures. Pure and deterministic. It lives under
// `@idleon-forge/engine/systems-ui`, not the `now` barrel, so it loads with the lazy System page and never
// in the first load (TR-12): the barrel's modules all bundle into one first-load chunk.

import {
  buildSystemPageView,
  type NowPrefs,
  type NowView,
  REASON_WORDS,
  type SystemPageView,
  type SystemsUi,
} from '@idleon-forge/engine/now';
import { STAGES } from '@idleon-forge/knowledge/stages';
import type { EngineResult, SystemPicture } from '../result';
import { isWorld4ReadOnly } from '../world4';
import { isStage, readPrefs, type SystemStepView, stageLabel, whoToken } from './hub-view';
import { FRAME_WORDS, PAGE_FRAME_WORDS as W } from './words';

export interface SystemPageExtras {
  /** FR-S3: the page's step, the first open Next Action of the System (at most two lines, DS-18). */
  step: SystemStepView | null;
  /** FR-S3: the Stage meter, only when the System has a behind row with its Stage. */
  stageMeter: { text: string; value: number; max: number; label: string } | null;
  /** FR-S4, FR-S5: this System's pictures (M20's and area S's), from `EngineResult.slotPictures`. */
  pictures: SystemPicture[];
  /** M24: the page template's header, framed answer, steps, checks and footer line. */
  frame: SystemFrameView;
}

/** M24: the tone of a page's status and its framed answer (colour = meaning). */
export type FrameTone = 'coral' | 'gold' | 'mint' | 'sky' | 'mut';
export interface SystemFrameView {
  /** "Systems · World 1". */
  back: string;
  status: { tone: FrameTone; word: string; reason: string };
  answer: { tone: FrameTone; cap: string; hero: string; sub: string | null };
  /** The page's open steps in engine order, with who they are for ("Bowman 81"), for "In game". */
  steps: { key: string; text: string; who: string | null }[];
  checks: { title: string; tone: FrameTone; word: string }[];
  /** "Checks: …" for the footer line. */
  checksLine: string;
  /** A read-only World 4 page (`isWorld4ReadOnly`): its body draws its own answer, so the template doesn't. */
  readOnly: boolean;
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
  return {
    ...page,
    step,
    stageMeter,
    pictures: picturesOf(result, page.tile.id),
    frame: frameOf(result, page, step),
  };
}

/** "Bowman 81" for a character (class and level, never a name), null for the account. */
const labelOf = (result: EngineResult, index: number | null): string | null => {
  if (index === null) return null;
  const c = result.characters.find((x) => x.index === index);
  return c ? `${c.classLabel} ${c.level}` : null;
};

const subjectIndex = (subject: string): number | null =>
  subject.startsWith('c') ? Number(subject.slice(1)) : null;

/** M24: the System page template's words, from the tile, the Goals and the coverage. */
export function frameOf(
  result: EngineResult,
  page: SystemPageView,
  step: SystemStepView | null,
): SystemFrameView {
  const { tile } = page;
  const stage = result.stage.id;
  const world = isStage(stage) ? `World ${stage.slice(1, 2)}` : null;
  const parts = tile.reason[0]?.text === tile.statusWord.text ? tile.reason.slice(2) : tile.reason;
  // The status word says "Behind for World 3" or "Nothing to fix"; the reason doesn't repeat it.
  const reason = parts
    .map((p) => p.text)
    .join('')
    .split(REASON_WORDS.sep)
    .filter((x) => x && x !== REASON_WORDS.behind && x !== REASON_WORDS.nothingToFix)
    .join(REASON_WORDS.sep);
  const checksCount = page.coverage.checks.length;
  const todo = page.goals.length > 0;
  const readOnly = tile.status === 'not-covered' && isWorld4ReadOnly(result, tile.id);
  const status: SystemFrameView['status'] = readOnly
    ? { tone: 'sky', word: W.status.readOnly, reason: W.status.readOnlyReason }
    : tile.status === 'wasting'
      ? { tone: 'coral', word: W.status.wasting, reason }
      : tile.status === 'behind'
        ? { tone: 'gold', word: W.status.behind(world), reason }
        : tile.status === 'locked'
          ? { tone: 'mut', word: W.status.locked, reason }
          : tile.status === 'not-covered'
            ? { tone: 'mut', word: checksCount ? W.status.notCovered : W.status.noChecks, reason }
            : tile.status === 'cant-tell'
              ? { tone: 'mut', word: W.status.cantTell, reason }
              : { tone: 'mint', word: W.status.ok, reason };
  const more = Math.max(0, page.goals.length - 1);
  const who = step?.who?.label ?? null;
  const stepSub = [who, more ? W.more(more) : null].filter(Boolean).join(' · ') || null;
  const answer: SystemFrameView['answer'] =
    page.locked || tile.status === 'locked'
      ? { tone: 'mut', cap: W.cap.locked, hero: W.lockedHero(tile.name), sub: page.unlock?.text ?? null }
      : step && tile.status === 'wasting'
        ? { tone: 'coral', cap: W.cap.wasting, hero: step.text, sub: stepSub }
        : step && todo
          ? { tone: 'gold', cap: W.cap.todo, hero: step.text, sub: stepSub }
          : tile.status === 'not-covered'
            ? {
                tone: 'mut',
                cap: W.cap.off,
                hero: W.notCoveredHero(tile.name),
                sub: page.unlock?.text ?? null,
              }
            : tile.status === 'cant-tell'
              ? { tone: 'mut', cap: W.cap.cantTell, hero: W.cantTellHero, sub: null }
              : { tone: 'mint', cap: W.cap.ok, hero: W.okHero, sub: checksCount ? W.okSub : null };
  // A fired check reads coral when one of its Goals is a fix before you leave, gold otherwise.
  const summary = result.systems?.find((x) => x.id === tile.id);
  const fixIds = new Set(page.goals.filter((g) => g.blocker).map((g) => g.id));
  const fixTitles = new Set(
    (summary?.checks ?? []).filter((c) => c.fired && fixIds.has(c.entryId)).map((c) => c.title),
  );
  const checks = page.coverage.checks.map((c) =>
    c.state === 'see-above'
      ? fixTitles.has(c.title)
        ? { title: c.title, tone: 'coral' as FrameTone, word: W.check.losing }
        : { title: c.title, tone: 'gold' as FrameTone, word: W.check.todo }
      : { title: c.title, tone: 'mint' as FrameTone, word: W.check.fine },
  );
  return {
    back: W.back(W.world(tile.world)),
    status,
    answer,
    steps: page.goals.map((g) => ({
      key: g.action.key,
      text: g.action.text,
      who: labelOf(result, subjectIndex(g.subject)),
    })),
    checks,
    readOnly,
    checksLine: W.checksLine(
      [...page.coverage.checks]
        .sort((a, b) => Number(b.state === 'see-above') - Number(a.state === 'see-above'))
        .map((c) => c.title.toLowerCase()),
    ),
  };
}

/** The pictures drawn on a System's page: its own (M20's and area S's). */
export function picturesOf(result: EngineResult, systemId: string): SystemPicture[] {
  return (result.slotPictures ?? []).filter((p) => p.systemId === systemId);
}
