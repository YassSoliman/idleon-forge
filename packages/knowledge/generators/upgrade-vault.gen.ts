// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Upgrade Vault rows (M7 TR-6): one generated Acquisition per row, `upgrade-vault.acquisition.row-<i>`.
// The id uses the row index because the index IS the game's identifier: the save stores levels as the
// array `UpgVault[i]`, M7's VaultRow.index and Toolbox's per-index rules key on it, and row names are
// display text. A reorder upstream would move the save too, so the index is the stable key here.
// Placeholder rows (Toolbox's liveEntries rule: names starting "Filler" or "Some ") are skipped.
import type { GeneratedEntryT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';
import { humanName } from './world-maps';

interface VaultRow {
  name: string;
  maxLevel: number;
  unlockLevel: number;
  x1: number;
  x2: number;
  x5: number;
}

const PLACEHOLDER = /^(filler|some[_ ])/i;
const MASTERY = /^Vault_Mastery/;

const generator = defineGenerator({
  name: 'upgrade-vault',
  system: 'upgrade-vault',
  inputs: ['website-data/shared-data.json#upgradeVault'],
  run({ data, pin }) {
    const rows = data.upgradeVault as VaultRow[];
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('upgrade-vault: upgradeVault is empty');
    const masteryRows = rows.flatMap((r, i) => (MASTERY.test(r.name) ? [i] : []));
    if (masteryRows.length === 0) throw new Error('upgrade-vault: no Vault_Mastery row found');
    const source = generatedSource(
      pin,
      'website-data/shared-data.json#upgradeVault',
      'IdleOn Toolbox game data: upgradeVault',
    );
    const by = generatedBy(generator, pin);
    const entries: GeneratedEntryT[] = [];
    rows.forEach((r, index) => {
      if (PLACEHOLDER.test(r.name ?? '')) return;
      if (typeof r.maxLevel !== 'number' || typeof r.unlockLevel !== 'number')
        throw new Error(`upgrade-vault: row ${index} has no numeric maxLevel/unlockLevel`);
      const display = humanName(r.name);
      const isMastery = masteryRows.includes(index);
      // The mastery band: rows before the first Vault_Mastery row are band 1, and so on. Whether a
      // given row is actually boosted is game code (Toolbox calcUpgradeVaultBonus), not data.
      const band = isMastery ? null : masteryRows.filter((m) => m < index).length + 1;
      entries.push({
        id: `upgrade-vault.acquisition.row-${index}`,
        system: 'upgrade-vault',
        type: 'acquisition',
        origin: 'generated',
        title: `Upgrade Vault: ${display}`.slice(0, 80),
        text: `Upgrade Vault row ${index}: ${display}`.slice(0, 240),
        why: 'A Vault row unlocks once the account has bought enough Vault levels in total.',
        values: {
          index,
          name: r.name,
          unlockLevel: r.unlockLevel,
          maxLevel: r.maxLevel,
        },
        sources: [source],
        appliesTo: { stages: 'all' },
        confidence: 'H',
        status: 'active',
        thing: { kind: 'other', rawName: r.name.slice(0, 64) },
        data: {
          oneOff: r.maxLevel === 1,
          // Toolbox getUpgradeCost applies Vault row 13's discount only to rows below 33, the first
          // Vault_Mastery row plus one; expressed through the mastery row so it follows the data.
          majorDiscountApplies: index <= (masteryRows[0] as number),
          masteryTier: band,
          isMasteryRow: isMastery,
        },
        generatedBy: by,
      });
    });
    return { entries };
  },
});

export default generator;
