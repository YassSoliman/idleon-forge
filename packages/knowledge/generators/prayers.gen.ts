// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `prayers.fact.unending-energy-cap` (M3 §TR facts): the AFK time cap the Unending Energy prayer's curse
// sets, in seconds. The game data carries this number only in the curse text
// ("Max_AFK_time_is_now_10_hours"), so this is the one generator sanctioned to read text (M11 TR-10
// table): it parses that exact phrase and fails generation loudly if it no longer parses, so a patch
// that moves the cap breaks the build instead of the advice.
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';

export const UNENDING_ENERGY = 'Unending_Energy';
const CAP_RE = /Max_AFK_time_is_now_(\d+(?:\.\d+)?)_hours/;

/** The cap in seconds from a curse text, or throws. */
export function capFromCurse(curse: unknown): number {
  const m = typeof curse === 'string' ? CAP_RE.exec(curse) : null;
  if (!m)
    throw new Error(`prayers: the ${UNENDING_ENERGY} curse no longer reads "Max_AFK_time_is_now_<n>_hours"`);
  return Math.round(Number(m[1]) * 3600);
}

const generator = defineGenerator({
  name: 'prayers',
  system: 'prayers',
  inputs: ['website-data/shared-data.json#prayers'],
  run({ data, pin }) {
    const prayer = (data.prayers as { name?: string; curse?: string; prayerIndex?: number }[]).find(
      (p) => p.name === UNENDING_ENERGY,
    );
    if (!prayer) throw new Error(`prayers: ${UNENDING_ENERGY} is not in the prayer data`);
    const fact: FactTableT = {
      id: 'prayers.fact.unending-energy-cap',
      system: 'prayers',
      origin: 'generated',
      title: 'Unending Energy: AFK time cap',
      rows: {
        prayer: UNENDING_ENERGY,
        prayerIndex: prayer.prayerIndex ?? null,
        capSeconds: capFromCurse(prayer.curse),
      },
      sources: [generatedSource(pin, 'website-data/shared-data.json', 'IdleOn Toolbox game data: prayers')],
      generatedBy: generatedBy(generator, pin),
    };
    return { facts: [fact] };
  },
});

export default generator;
