// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 2, the W2/W3 gaps' pages on the template, one lazy chunk (pages.ts `FULL_PAGES`).
import type { FullPageProps } from '../pages';
import { FramedSections } from '../w23/framed';
import { forgeSections } from './forge';

export const ForgePage = (p: FullPageProps) => <FramedSections {...p} sections={forgeSections(p)} />;
