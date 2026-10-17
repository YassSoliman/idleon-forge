// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Upgrade Vault kill rows (M4 TR-4): five Vault upgrades scale "per POW 10" of the account's kills on
// one map. Toolbox's exported getVaultTotalKills (the game's VaultKillzTOT) hard-codes which maps feed
// which slot, so the generator reads that mapping by calling it on probe inputs (one map at a time)
// rather than copying the list. The rows are the upgradeVault entries whose description scales per
// POW 10 of kills, paired in order with the raw-kill slots. Emits one ladder per map
// (`upgrade-vault.goal.kill-row-map-<i>`, powers of 10) and the map -> slot table
// `upgrade-vault.fact.kill-slots`.
import type { FactTableT, GeneratedEntryT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';

export const VAULT_FILE = 'parsers/misc/upgradeVault.ts';
/** Powers of 10 the ladders cover. The game's bonus is uncapped (floor(log10(kills))); 10^12 is our cut. */
export const MAX_POW = 12;
const PROBE = 1000;

interface VaultRow {
  name: string;
  description?: string;
}

export interface KillSlot {
  map: number;
  mapName: string;
  /** VaultKillzTOT slot holding the raw kill total. */
  slot: number;
  /** VaultKillzTOT slot holding floor(log10(kills)), what the row's bonus multiplies. */
  logSlot: number;
  /** upgradeVault row it scales, by its rawName-like name. */
  row: string;
}

type VaultTotal = (args: { characters: unknown[]; account: unknown }) => number[];

/** Which VaultKillzTOT slots a map's kills land in, found by probing the parser function map by map. */
export function probeSlots(fn: VaultTotal, mapCount: number) {
  const base = fn({ characters: [], account: {} });
  const out: { map: number; slot: number; logSlot: number }[] = [];
  for (let map = 0; map < mapCount; map++) {
    const kills: number[] = [];
    kills[map] = PROBE;
    const r = fn({ characters: [{ kills }], account: {} });
    const slot = r.findIndex((v, i) => v === PROBE && base[i] !== PROBE);
    if (slot < 0) continue;
    // The log slot is the other one that moves when the kills grow by 10^3.
    const more: number[] = [];
    more[map] = PROBE * 1000;
    const r2 = fn({ characters: [{ kills: more }], account: {} });
    const logSlot = r2.findIndex((v, i) => i !== slot && v !== r[i]);
    if (logSlot < 0) throw new Error(`vault-kills: map ${map} feeds slot ${slot} but no log slot moved`);
    out.push({ map, slot, logSlot });
  }
  return out.sort((a, b) => a.slot - b.slot);
}

const generator = defineGenerator({
  name: 'vault-kills',
  system: 'upgrade-vault',
  inputs: [
    `${VAULT_FILE}#getVaultTotalKills`,
    'website-data/shared-data.json#upgradeVault',
    'website-data/shared-data.json#mapNames',
  ],
  constants: { getVaultTotalKills: VAULT_FILE },
  run({ data, constants, pin }) {
    const fn = constants.getVaultTotalKills;
    if (typeof fn !== 'function') throw new Error('vault-kills: getVaultTotalKills is not a function');
    const mapNames = data.mapNames as Record<string, string>;
    const rows = data.upgradeVault as VaultRow[];
    const slots = probeSlots(fn as VaultTotal, Object.keys(mapNames).length);
    const scaled = rows.filter((r) => /per_POW_10_.+_Kills/.test(r.description ?? ''));
    if (slots.length === 0) throw new Error('vault-kills: no map feeds VaultKillzTOT');
    if (scaled.length !== slots.length)
      throw new Error(`vault-kills: ${slots.length} kill slots but ${scaled.length} POW 10 kill rows`);
    const table: KillSlot[] = slots.map((s, i) => ({
      ...s,
      mapName: mapNames[String(s.map)] ?? String(s.map),
      row: (scaled[i] as VaultRow).name,
    }));
    const by = generatedBy(generator, pin);
    const source = generatedSource(pin, VAULT_FILE, 'IdleOn Toolbox: getVaultTotalKills (VaultKillzTOT)');
    const entries: GeneratedEntryT[] = table.map((t) => {
      const map = t.mapName.replace(/_/g, ' ');
      const row = t.row.replace(/_/g, ' ');
      return {
        id: `upgrade-vault.goal.kill-row-map-${t.map}`,
        system: 'upgrade-vault',
        type: 'goal',
        origin: 'generated',
        title: `Vault kill row: ${map}`.slice(0, 80),
        text: `{value:compact} kills on ${map}; next ${row} step at {next:compact}`.slice(0, 240),
        why: `The Vault upgrade ${row} grows with each power of 10 of the account's kills on ${map}.`.slice(
          0,
          240,
        ),
        values: { map: t.map, row: t.row },
        sources: [source],
        appliesTo: { stages: 'all' },
        confidence: 'H',
        status: 'active',
        scope: 'account',
        category: 'compounding',
        unit: 'kills',
        progress: { id: 'upgrade-vault/kill-total', params: { map: t.map } },
        milestones: Array.from({ length: MAX_POW }, (_, i) => ({
          at: 10 ** (i + 1),
          reward: `${row} step ${i + 1}`,
        })),
        data: { slot: t.slot, logSlot: t.logSlot },
        generatedBy: by,
      };
    });
    const facts: FactTableT[] = [
      {
        id: 'upgrade-vault.fact.kill-slots',
        system: 'upgrade-vault',
        origin: 'generated',
        title: 'Upgrade Vault: map to kill slot',
        rows: table.map((t) => ({ ...t })),
        sources: [source],
        generatedBy: by,
      },
    ];
    return { entries, facts };
  },
});

export default generator;
