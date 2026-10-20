// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 2, the W2/W3 gaps' pages on the template, one lazy chunk (pages.ts `FULL_PAGES`).
import type { FullPageProps } from '../pages';
import { FramedSections } from '../w23/framed';
import { forgeSections } from './forge';
import { TASK_WORDS, taskBoardSections } from './taskboard';

export const ForgePage = (p: FullPageProps) => <FramedSections {...p} sections={forgeSections(p)} />;
/** One page for the Task Board, the Merit Shop and Task Unlocks: titled "Task Board" whichever opened it. */
export const TaskBoardPage = (p: FullPageProps) => (
  <FramedSections
    s={p.s}
    page={{ ...p.page, tile: { ...p.page.tile, name: TASK_WORDS.pageTitle } }}
    sections={taskBoardSections(p)}
  />
);
