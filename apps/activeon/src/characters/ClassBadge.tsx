// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M25: a character's picture with the game's own class icon (data/ClassIcons<i>, ADR 0009 as amended
// 2026-10-19) pinned to its lower-right corner. The badge sits inside the picture's box, so the strip,
// the Characters list and the headers keep their widths at 390 px. Decorative: the class is always
// written beside the picture. When the icon is missing it simply isn't drawn.
import type { ReactNode } from 'react';
import { classArtOf } from '../art/game/class-art';
import { GameIcon } from '../art/game/GameIcon';
import './class-badge.css';

/** The badge's box per picture size: about half the picture, never under 16 px. */
const BADGE = (size: number): 16 | 24 | 32 => (size >= 64 ? 32 : size >= 40 ? 24 : 16);

export function ClassBadge({
  classLabel,
  size,
  children,
}: {
  classLabel: string | null | undefined;
  /** The picture's own edge in px. */
  size: number;
  children: ReactNode;
}) {
  const art = classArtOf(classLabel);
  if (!art) return <>{children}</>;
  return (
    <span className="cb" data-size={BADGE(size)}>
      {children}
      <span className="cb__icon">
        <GameIcon art={art} size={BADGE(size)} decorative />
      </span>
    </span>
  );
}
