// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The facts table (M22 TR-2): one row per basic fact, with its value on every surface that carries
// it: the raw save, the Account State, and what the engine hands the screen (the Build view, the
// character header, the Spend Plan's wallets). A fact key is shared, so "the same fact has the same
// value everywhere" is one comparison per row.
import type { AccountState, CharacterState, PresetTalents } from '@idleon-forge/account-state';
import type { BuildRoadmap, EngineResult } from '@idleon-forge/engine/result';
import type { FactRow, PresetSlot, RawCharacter, RawFacts, Surface } from './types';

/** How many chest slots the table samples (the chest has hundreds; the first ones are the oldest). */
export const CHEST_SAMPLE = 25;

/** Equal within float noise (coins are floats in the save). */
export function same(a: number | string, b: number | string): boolean {
  if (typeof a === 'string' || typeof b === 'string') return String(a) === String(b);
  return Math.abs(a - b) <= Math.max(0.5, 1e-9 * Math.max(Math.abs(a), Math.abs(b)));
}

/** M9 FR-9's Goal and its wording: "Spend (at least) 345 talent points on your fighting preset". */
const BEHIND_GOAL = 'talent-presets.check.behind';
const BEHIND_TEXT = /^Spend (?:at least )?([\d,]+) talent points on your (\w+) preset/;

const normClass = (s: string | null | undefined) => (s ? s.toUpperCase().replace(/[\s-]+/g, '_') : null);

class Table {
  private rows = new Map<string, FactRow>();
  put(key: string, label: string, surface: Surface, value: number | string | null | undefined) {
    if (value === undefined) return;
    let row = this.rows.get(key);
    if (!row) {
      row = { key, label, values: {}, agree: true };
      this.rows.set(key, row);
    }
    row.values[surface] = value;
  }
  done(): FactRow[] {
    const out = [...this.rows.values()];
    for (const r of out) {
      const vs = Object.values(r.values).filter((v): v is number | string => v !== null && v !== undefined);
      r.agree = vs.every((v) => same(v, vs[0] as number | string));
    }
    return out;
  }
}

const who = (c: RawCharacter) => `Slot ${c.index} ${c.className ?? `class ${c.classId}`}`;

/** The Account State preset in a game slot: `active` is the selected one. */
export function statePreset(c: CharacterState, slot: PresetSlot): PresetTalents | null {
  const t = c.talents;
  if (!t) return null;
  return t.selectedPreset === slot ? t.active : t.other;
}

const buildPreset = (b: BuildRoadmap | undefined, slot: PresetSlot) =>
  b?.presets.find((p) => p.slot === slot);

export function factsOf(raw: RawFacts, state: AccountState, result: EngineResult | null): FactRow[] {
  const t = new Table();
  const builds = new Map((result?.builds ?? []).map((b) => [b.index, b]));
  const chars = new Map((result?.characters ?? []).map((c) => [c.index, c]));
  const wallets = result?.account.spendPlan?.wallets ?? [];
  for (const rc of raw.characters) {
    const sc = state.characters.find((c) => c.index === rc.index);
    const b = builds.get(rc.index);
    const cr = chars.get(rc.index);
    const w = who(rc);
    t.put(`c${rc.index}.class`, `${w} · class`, 'raw', rc.className);
    t.put(`c${rc.index}.class`, `${w} · class`, 'state', sc ? normClass(sc.class) : undefined);
    t.put(`c${rc.index}.class`, `${w} · class`, 'character', cr ? normClass(cr.classId) : undefined);
    t.put(`c${rc.index}.level`, `${w} · class level`, 'raw', rc.level);
    t.put(`c${rc.index}.level`, `${w} · class level`, 'state', sc?.level);
    t.put(`c${rc.index}.level`, `${w} · class level`, 'character', cr?.level);
    t.put(`c${rc.index}.level`, `${w} · class level`, 'build', b?.level);
    t.put(`c${rc.index}.preset`, `${w} · preset in use`, 'raw', rc.selectedPreset);
    t.put(`c${rc.index}.preset`, `${w} · preset in use`, 'state', sc?.talents?.selectedPreset);
    const activeView = b?.presets.find((p) => p.active);
    t.put(`c${rc.index}.preset`, `${w} · preset in use`, 'build', activeView?.slot);
    t.put(`c${rc.index}.coins`, `${w} · coins carried`, 'raw', rc.coins);
    t.put(`c${rc.index}.coins`, `${w} · coins carried`, 'state', sc?.money);
    t.put(
      `c${rc.index}.coins`,
      `${w} · coins carried`,
      'spend',
      wallets.find((x) => x.holder === rc.index)?.coins,
    );
    for (const [item, n] of Object.entries(rc.bag)) {
      t.put(`c${rc.index}.bag.${item}`, `${w} · bag · ${item}`, 'raw', n);
      if (sc?.inventoryItems)
        t.put(`c${rc.index}.bag.${item}`, `${w} · bag · ${item}`, 'state', sc.inventoryItems[item] ?? 0);
    }
    for (const rp of rc.presets) {
      const sp = sc ? statePreset(sc, rp.slot) : null;
      const bp = buildPreset(b, rp.slot);
      const pw = `${w} · preset ${rp.slot + 1}`;
      for (const rt of rp.tabs) {
        const st = sp?.tabs.find((x) => x.tab === rt.tab);
        const bt = bp?.tabs.find((x) => x.tab === rt.tab);
        const key = `c${rc.index}.p${rp.slot}.t${rt.tab}`;
        t.put(`${key}.spent`, `${pw} · tab ${rt.tab} · points spent`, 'raw', rt.spent);
        if (st)
          t.put(
            `${key}.spent`,
            `${pw} · tab ${rt.tab} · points spent`,
            'state',
            st.talents.reduce((n, x) => n + x.base, 0),
          );
        t.put(`${key}.spent`, `${pw} · tab ${rt.tab} · points spent`, 'build', bt?.spent);
        for (const [idText, lv] of Object.entries(rt.levels)) {
          const id = Number(idText);
          const k = `c${rc.index}.p${rp.slot}.talent.${id}`;
          const label = `${pw} · talent ${id}`;
          t.put(k, label, 'raw', lv);
          if (st) t.put(k, label, 'state', st.talents.find((x) => x.id === id)?.base ?? 0);
          const row = bt?.rows.find((x) => x.id === id);
          if (row) t.put(k, label, 'build-row', row.current);
          const step = bt?.path?.find((x) => x.talentId === id);
          if (step) t.put(k, label, 'build-path', step.current);
        }
      }
      // The preset's unspent class-tab points: the Build tab's chip (BuildPresetView.unspent) and the
      // "points left behind on a preset" Goal must say the same number (owner's live-save run).
      if (bp) {
        const uk = `c${rc.index}.p${rp.slot}.unspent`;
        const ul = `${pw} · unspent talent points`;
        t.put(uk, ul, 'build', bp.unspent);
        const behind = cr?.goals.find((g) => g.id === BEHIND_GOAL);
        const m = behind ? BEHIND_TEXT.exec(behind.nextAction.text) : null;
        if (m && `${m[2]} preset` === bp.heading.toLowerCase())
          t.put(uk, ul, 'goal', Number(m[1]?.replace(/,/g, '')));
      }
      const sk = `c${rc.index}.p${rp.slot}.star.spent`;
      t.put(sk, `${pw} · star talents · points spent`, 'raw', rp.star.spent);
      if (sp)
        t.put(
          sk,
          `${pw} · star talents · points spent`,
          'state',
          sp.star.reduce((n, x) => n + x.base, 0),
        );
    }
  }
  t.put('bank.coins', 'Bank coins', 'raw', raw.bankCoins);
  t.put('bank.coins', 'Bank coins', 'state', state.account.bankCoins);
  t.put('bank.coins', 'Bank coins', 'spend', wallets.find((x) => x.holder === 'bank')?.coins);
  const storage = state.account.storageItems;
  for (const [item, n] of Object.entries(raw.chest).slice(0, CHEST_SAMPLE)) {
    t.put(`chest.${item}`, `Chest · ${item}`, 'raw', n);
    if (storage) t.put(`chest.${item}`, `Chest · ${item}`, 'state', storage[item] ?? 0);
  }
  return t.done();
}
