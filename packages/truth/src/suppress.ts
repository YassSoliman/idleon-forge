// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Suppression (M22 FR-3): never show advice from a broken read. Each violation names what it casts
// doubt on; only those advice items are replaced with "Can't be sure of this one right now", in the
// worker, so every view shows the same words and the main thread carries no truth code at all.
// Works on a copy: the engine keeps its own result for re-runs.
import type { BuildRoadmap, EngineResult, Goal } from '@idleon-forge/engine/result';
import type { Suppression, Violation } from './types';

export const CANT_BE_SURE = 'Can’t be sure of this one right now';
export const CANT_BE_SURE_WHY =
  'Two reads of your save disagree about this, so ActiveOn holds it back until a save reads clean.';

/** The Goal systems whose advice rests on talent levels (M9). */
const TALENT_GOAL = /^(talents|talent-presets)\./;

class Ledger {
  private items = new Map<string, Suppression>();
  add(kind: string, key: string, character: number | null, rule: string) {
    const id = `${kind}|${character}|${key}`;
    const s = this.items.get(id) ?? { kind, key, character, rules: [] };
    if (!s.rules.includes(rule)) s.rules.push(rule);
    this.items.set(id, s);
  }
  list(): Suppression[] {
    return [...this.items.values()];
  }
}

function suppressGoal(g: Goal, ledger: Ledger, character: number | null, rule: string) {
  g.nextAction.text = CANT_BE_SURE;
  g.nextAction.why = CANT_BE_SURE_WHY;
  g.milestone = null;
  delete g.walkthrough;
  ledger.add('goal', g.nextAction.key, character, rule);
}

/** Every Goal of a character, and its line in any account Goal's per-character details. */
function talentGoals(r: EngineResult, character: number, ledger: Ledger, rule: string, onlyKey?: string) {
  const match = (g: Goal) =>
    onlyKey ? g.nextAction.key === onlyKey : TALENT_GOAL.test(g.nextAction.entryId);
  for (const g of r.characters.find((c) => c.index === character)?.goals ?? [])
    if (match(g)) suppressGoal(g, ledger, character, rule);
  for (const g of r.account.goals) {
    if (onlyKey ? g.nextAction.key !== onlyKey : !TALENT_GOAL.test(g.nextAction.entryId)) continue;
    for (const d of g.details ?? [])
      if (d.subject === `c${character}`) {
        d.text = CANT_BE_SURE;
        ledger.add('goal-detail', `${g.nextAction.key}#c${character}`, character, rule);
      }
  }
}

/** Replace Build next-points lines (by key, or by preset and tab) and the overview's "next: X". */
function buildLines(
  b: BuildRoadmap,
  ledger: Ledger,
  rule: string,
  pick: { key?: string; slot?: number; tab?: number },
) {
  const labels = new Set<string>();
  for (const p of b.presets) {
    if (pick.slot !== undefined && p.slot !== pick.slot) continue;
    // A Build path step (M21 FR-C1) named by key: its note says so.
    if (pick.key !== undefined)
      for (const t of p.tabs)
        for (const s of t.path ?? [])
          if (s.key === pick.key) {
            s.note = CANT_BE_SURE;
            s.condition = null;
            ledger.add('build-path', s.key, b.index, rule);
          }
    for (const n of p.next) {
      if (pick.key !== undefined ? n.key !== pick.key : pick.tab !== undefined && n.tab !== pick.tab)
        continue;
      if (n.text !== CANT_BE_SURE) labels.add(n.label);
      n.text = CANT_BE_SURE;
      n.points = 0;
      ledger.add('build-next', n.key, b.index, rule);
    }
  }
  if (labels.size === 0) return;
  const parts = b.status.split(' · ');
  const next = parts.map((s) => (s.startsWith('next: ') && labels.has(s.slice(6)) ? CANT_BE_SURE : s));
  if (next.join(' · ') !== b.status) {
    b.status = next.join(' · ');
    ledger.add('build-status', `build@c${b.index}`, b.index, rule);
  }
}

/** A talent whose level the reads disagree on: its row and path steps say so (facts, not advice). */
function talentRow(b: BuildRoadmap, slot: number, id: number, ledger: Ledger, rule: string) {
  for (const p of b.presets) {
    if (p.slot !== slot) continue;
    for (const t of p.tabs) {
      for (const r of t.rows)
        if (r.id === id) {
          r.note = CANT_BE_SURE;
          ledger.add('build-row', `c${b.index}-s${slot}-talent${id}`, b.index, rule);
        }
      for (const s of t.path ?? [])
        if (s.talentId === id) {
          s.note = CANT_BE_SURE;
          s.condition = null;
          ledger.add('build-path', s.key, b.index, rule);
        }
    }
  }
}

/** Applies every violation to a copy of `result`. Returns the copy (or `result` untouched) and the ledger. */
export function suppress(
  result: EngineResult,
  violations: readonly Violation[],
): { result: EngineResult; suppressed: Suppression[] } {
  const acting = violations.filter((v) => v.scope.kind !== 'items' && v.hold !== false);
  if (acting.length === 0) return { result, suppressed: [] };
  const r = structuredClone(result);
  const ledger = new Ledger();
  const builds = new Map((r.builds ?? []).map((b) => [b.index, b]));
  for (const v of acting) {
    const { scope } = v;
    const c = scope.character;
    const b = c === null ? undefined : builds.get(c);
    if (scope.kind === 'talents' && c !== null) {
      if (scope.itemKey) {
        if (b) buildLines(b, ledger, v.rule, { key: scope.itemKey });
        talentGoals(r, c, ledger, v.rule, scope.itemKey);
        continue;
      }
      if (b) buildLines(b, ledger, v.rule, { slot: scope.slot, tab: scope.tab });
      const talent = /\.talent\.(\d+)$/.exec(v.key);
      if (b && talent?.[1] && scope.slot !== undefined)
        talentRow(b, scope.slot, Number(talent[1]), ledger, v.rule);
      talentGoals(r, c, ledger, v.rule);
    } else if (scope.kind === 'character' && c !== null) {
      if (b) buildLines(b, ledger, v.rule, {});
      talentGoals(r, c, ledger, v.rule);
    } else if (scope.kind === 'spend-line' || scope.kind === 'coins') {
      for (const line of r.account.spendPlan?.lines ?? []) {
        const hit =
          scope.kind === 'spend-line'
            ? line.id === scope.itemKey
            : (line.status === 'buy' || line.status === 'move-coins') &&
              (c === null
                ? line.status === 'move-coins'
                : line.payer === c || line.steps.some((s) => s.payer === c));
        if (!hit) continue;
        line.text = CANT_BE_SURE;
        line.reportText = CANT_BE_SURE;
        line.detail = null;
        line.why = CANT_BE_SURE_WHY;
        ledger.add('spend-line', line.id, c, v.rule);
      }
    }
  }
  return { result: r, suppressed: ledger.list() };
}
