// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { tryToParse } from '@utility/helpers';
import { bribes } from '@website-data';
import type { IdleonData } from '../types';

export interface Bribe {
  name: string;
  value: number;
  done: boolean;
  [key: string]: unknown;
}

export const getBribes = (idleonData: IdleonData): Bribe[] | undefined => {
  const bribesRaw = idleonData?.BribeStatus || tryToParse(idleonData?.BribeStatus);
  return parseBribes(bribesRaw);
}

const parseBribes = (bribesRaw: any): Bribe[] | undefined => {
  return bribes?.map((bribe, index) => {
    const bribeStatus = bribesRaw?.[index];
    return {
      ...bribe,
      done: bribeStatus === 1
    };
  });
}

export const getBribeBonus = (bribes: Bribe[] | undefined, bribeName: string): number => {
  return bribes?.find(({ name, done }) => name === bribeName && done)?.value ?? 0;
}
