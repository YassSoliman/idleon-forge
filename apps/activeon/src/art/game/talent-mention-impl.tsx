// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The lazy half of <TalentMention>: finds the talent a sentence names and draws its game icon.
import type { ReactNode } from 'react';
import { GameIcon } from './GameIcon';
import { talentArt } from './game-art';
import { talentIdInText } from './talent-art';

export function TalentMentionImpl({
  text,
  fallback,
  size,
}: {
  text: string;
  fallback: ReactNode;
  size: 16 | 24 | 32 | 48 | 64;
}) {
  const id = talentIdInText(text);
  if (id === null) return <>{fallback}</>;
  return <GameIcon art={talentArt(id)} fallback={fallback} size={size} decorative />;
}
