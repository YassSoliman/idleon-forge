// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 48cb4ee697988ec5eac14ba97142add6296505b2.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import type { IdleonData } from '../types';

import { riftInfo } from '@website-data';
import { saveField } from '@parsers/saveField';

export const getRift = (idleonData: IdleonData) => {
  const rawRift = saveField(idleonData, 'Rift') || (idleonData as any)?.Rift;
  return parseRift(rawRift);
}

const parseRift = (rawRift: any) => {
  const [currentRift, currentProgress, chars] = rawRift || [];
  return {
    list: riftInfo,
    currentRift: parseInt(currentRift) || 0,
    currentProgress: currentProgress ?? 0,
    chars
  }
}

// game: RiftStuff[5][RiftStuff[4][rift]], a table the site data does not carry. Each task's sentence states its goal
// as its first number ("DEFEAT_500_MONSTERS_WITHIN_5_MIN"), the same as the table for every real rift (checked against
// the live game); the "cannot progress further" rows past the last one have none
export const getRiftTaskGoal = (task: string = ''): number | null => {
  const match = String(task).match(/\d+/);
  return match ? Number(match[0]) : null;
};

// The rifts that have a task to do, not the placeholders after the last
export const getRiftCount = (list: any[] = []) => list.filter(({ task }: any) => getRiftTaskGoal(task) !== null).length;

export const isRiftBonusUnlocked = (rift: any, bonusName: string) => {
  return rift?.list?.find(({ riftBonus }: any, index: number) => {
    return riftBonus === bonusName && index <= rift?.currentRift
  });
}
