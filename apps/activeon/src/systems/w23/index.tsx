// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the World 3 System pages on the template, one lazy chunk (pages.ts `FULL_PAGES`): Construction,
// Worship, Trapping, the 3D Printer, the Armor-set Smithy, the Refinery, Prayers and Shrines.
import type { FullPageProps } from '../pages';
import { constructionSections } from './construction';
import { FramedSections } from './framed';
import { prayersSections, shrinesSections } from './prayers';
import { printerSections, smithySections } from './printer';
import { refinerySections } from './refinery';
import { trappingSections, worshipSections } from './worship';

export const ConstructionPage = (p: FullPageProps) => (
  <FramedSections {...p} sections={constructionSections(p)} />
);
export const WorshipPage = (p: FullPageProps) => <FramedSections {...p} sections={worshipSections(p)} />;
export const TrappingPage = (p: FullPageProps) => <FramedSections {...p} sections={trappingSections(p)} />;
export const PrinterPage = (p: FullPageProps) => <FramedSections {...p} sections={printerSections(p)} />;
export const ArmorSmithyPage = (p: FullPageProps) => <FramedSections {...p} sections={smithySections(p)} />;
export const RefineryPage = (p: FullPageProps) => <FramedSections {...p} sections={refinerySections(p)} />;
export const PrayersPage = (p: FullPageProps) => <FramedSections {...p} sections={prayersSections(p)} />;
export const ShrinesPage = (p: FullPageProps) => <FramedSections {...p} sections={shrinesSections(p)} />;
