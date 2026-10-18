// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 TR-2 / TR-4 contract tests: the SpendInputs projection with the worker's Toolbox calls, on the public
// saves, the scrubbed saves and (locally) the private ones. A re-sync that breaks a ladder identity or the
// non-gilded stamp prices fails here. Assertions are on rules, never on a private save's balances.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { type AccountState, isKnown, SPEND_VAULT_ROWS, toAccountState } from '../src';
import { editedSave, listJson, NOW, PRIVATE_DIR, PUBLIC_DIR, readSave } from './helpers';

const SCRUBBED_DIR = fileURLToPath(new URL('../../../fixtures/scrubbed/', import.meta.url));

const withToolbox = (input: unknown) => {
  const envelope = normalizeEnvelope(input);
  const parsed = parseSave(envelope, { now: NOW });
  return {
    parsed,
    state: toAccountState(parsed, envelope, { toolbox: { calls: toolboxCalls, withFrozenClock } }),
  };
};

const saves: [string, string][] = [
  ...listJson(PUBLIC_DIR).map((f): [string, string] => [`public ${f}`, PUBLIC_DIR + f]),
  ...['scrubbed-w2.json', 'scrubbed-w3.json'].map((f): [string, string] => [f, SCRUBBED_DIR + f]),
  ...listJson(PRIVATE_DIR, '.raw.json').map((f): [string, string] => [`private ${f}`, PRIVATE_DIR + f]),
];
const read = (path: string) => {
  const dir = path.slice(0, path.lastIndexOf('/') + 1);
  return readSave(dir, path.slice(dir.length));
};

describe.each(saves)('%s', (_label, path) => {
  const { parsed, state } = withToolbox(read(path));
  const spend = state.account.spend;

  it('has a projection with one wallet per readable character plus the bank', () => {
    expect(spend).not.toBeNull();
    expect(spend?.wallets.map((w) => w.holder)).toEqual([...state.characters.map((c) => c.index), 'bank']);
    for (const w of spend?.wallets ?? []) expect(w.coins).toBeGreaterThanOrEqual(0);
  });

  it('prices Vault ladders by summing per-level costs (TR-4 ladder contract)', () => {
    const vault = spend?.vault;
    if (!vault) return; // the save has no UpgVault (FR-25), checked below
    expect(vault.rows).toHaveLength(SPEND_VAULT_ROWS);
    for (const row of vault.rows) {
      if (!row.ladder.length) continue;
      expect(row.ladder[0]).toEqual({ k: 1, coins: row.nextCost });
      expect(row.ladder.length).toBeLessThanOrEqual(Math.min(25, row.maxLevel - row.level));
      for (let i = 1; i < row.ladder.length; i++)
        expect(row.ladder[i]?.coins).toBeGreaterThan(row.ladder[i - 1]?.coins ?? 0);
      // Toolbox's costToMax agrees where a double can still tell the difference.
      if (row.costToMax < 1e15 && row.ladder.length === row.maxLevel - row.level) {
        const last = row.ladder.at(-1)?.coins ?? 0;
        expect(Math.abs(last - row.costToMax) / row.costToMax).toBeLessThan(1e-9);
      }
    }
  });

  it('prices stamp cap raises without the parse default Gilded Stamp (TR-4)', () => {
    const list = spend?.stamps ?? [];
    const gilded = (spend?.gildedStamps ?? 0) > 0;
    // biome-ignore lint/suspicious/noExplicitAny: Toolbox's parsed stamps are untyped.
    const parsedStamps = Object.values((parsed.account as any).stamps ?? {}).flat() as any[];
    for (const s of list) {
      expect(s.cap > 0 || s.level > 0).toBe(true);
      if (s.level < s.cap) {
        expect(s.raise).toBeNull();
        expect(s.nextCoinCost).not.toBeNull();
        continue;
      }
      const raise = s.raise;
      expect(raise).not.toBeNull();
      if (!raise || gilded) continue;
      const p = parsedStamps.find((x) => x.rawName === s.id);
      // The parse's price is at x0.05; ours is the real one, about 20x (floors aside).
      if (p && p.materialCost > 20) expect(raise.atDiscount.cost / p.materialCost).toBeGreaterThan(15);
      expect(raise.gilded).toBeNull();
      for (const c of raise.carriers)
        expect(state.characters.some((x) => x.index === c.characterIndex)).toBe(true);
    }
  });

  it('keeps only bribe statuses -1, 0 and 1, and Pay 2 Win vial and Player upgrades unpriced', () => {
    for (const b of spend?.bribes ?? []) expect([-1, 0, 1]).toContain(b.status);
    for (const u of spend?.p2w ?? [])
      if (u.key.startsWith('vials.') || u.key.startsWith('player.')) expect(u.nextCost).toBeNull();
      else expect(u.nextCost).not.toBeNull();
  });

  it('never carries a character name', () => {
    const text = JSON.stringify(spend);
    for (const c of state.characters) if (c.name.length > 3) expect(text).not.toContain(`"${c.name}"`);
  });
});

describe('bribe sets (TR-4)', () => {
  it('match the generated bribes.acquisition.* set facts', () => {
    const gen = JSON.parse(
      readFileSync(fileURLToPath(new URL('../../knowledge/generated/bribes.json', import.meta.url)), 'utf8'),
    ) as { entries: { values: { index: number; set: number } }[] };
    const { state } = withToolbox(readSave(PUBLIC_DIR, 'latest.json'));
    const sets = new Map((state.account.spend?.bribes ?? []).map((b) => [b.index, b.set]));
    for (const e of gen.entries) expect(sets.get(e.values.index)).toBe(e.values.set);
  });
});

describe('partial data (FR-25)', () => {
  const file = `${PUBLIC_DIR}latest.json`;
  it('marks a missing Vault unknown instead of reading it as level 0', () => {
    const edited = editedSave(readSave(PUBLIC_DIR, 'latest.json'), (d) => {
      delete d.UpgVault;
    });
    const { state } = withToolbox(edited);
    expect(state.account.spend?.vault).toBeNull();
    expect(isKnown(state, 'account.spend.vault')).toBe(false);
    expect(state.account.spend?.stamps).not.toBeNull();
    expect(existsSync(file)).toBe(true);
  });

  it('is null without the worker Toolbox calls', () => {
    const envelope = normalizeEnvelope(readSave(PUBLIC_DIR, 'latest.json'));
    const s: AccountState = toAccountState(parseSave(envelope, { now: NOW }), envelope);
    expect(s.account.spend).toBeNull();
  });
});
