// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Invariant: a next step is never already at its target (M22 FR-2a). For every Build "next points"
// line, the talent's level in the save (that preset, read raw) must be below the level the line
// takes it to; and the first line of a tab ("Put the next 12 points into X (to 40)") must start from
// the save's level: 40 - 12 = the raw level. The same holds for M9's "Next talent points" Goal,
// checked only when the talent is at its target on every preset that has it (no false alarms).
import type { BuildPresetView } from '@idleon-forge/engine/result';
import type { RawCharacter, Violation } from '../types';
import { type Rule, reachOf, takeOf } from './rule';

/** The talent a Build line names, by its label in the same tab's rows or path. */
export function talentIdOf(p: BuildPresetView, tab: number, label: string): number | null {
  const t = p.tabs.find((x) => x.tab === tab);
  const row = t?.rows.find((r) => r.label === label);
  if (row) return row.id;
  const step = t?.path?.find((s) => s.label === label);
  if (step) return step.talentId;
  for (const x of p.tabs) {
    const r = x.rows.find((y) => y.label === label);
    if (r) return r.id;
  }
  return null;
}

const rawLevel = (c: RawCharacter, slot: number, id: number): number | null => {
  const p = c.presets.find((x) => x.slot === slot);
  if (!p) return null;
  for (const t of p.tabs) if (id in t.levels) return t.levels[id] ?? 0;
  return p.star.levels[id] ?? null;
};

const who = (c: RawCharacter) => `Slot ${c.index} ${c.className ?? `class ${c.classId}`}`;

export const nextNotAtTarget: Rule = {
  id: 'next-not-at-target',
  title: 'A next step is never already at its target',
  check({ raw, result }) {
    const out: Violation[] = [];
    if (!result) return out;
    for (const b of result.builds ?? []) {
      const rc = raw.characters.find((c) => c.index === b.index);
      if (!rc) continue;
      for (const p of b.presets) {
        const seenTab = new Set<number>();
        for (const n of p.next) {
          const first = !seenTab.has(n.tab);
          seenTab.add(n.tab);
          const reach = reachOf(n.text);
          const id = talentIdOf(p, n.tab, n.label);
          if (reach === null || id === null) continue;
          const lv = rawLevel(rc, p.slot, id);
          if (lv === null) continue;
          const where = `${who(rc)} · preset ${p.slot + 1} · tab ${n.tab}`;
          const scope = {
            kind: 'talents',
            character: rc.index,
            slot: p.slot,
            tab: n.tab,
            itemKey: n.key,
          } as const;
          if (lv >= reach) {
            out.push({
              rule: 'next-not-at-target',
              key: n.key,
              message: `${where}: the next step takes ${n.label} to ${reach}, but the save already has it at ${lv}`,
              severity: 'P1',
              scope,
              evidence: { talent: id, raw: lv, target: reach, text: n.text },
            });
            continue;
          }
          const take = takeOf(n.text);
          if (first && take !== null && reach - take !== lv)
            out.push({
              rule: 'next-not-at-target',
              key: n.key,
              message: `${where}: the next step starts ${n.label} at ${reach - take}, the save has it at ${lv}`,
              severity: 'P2',
              scope,
              evidence: { talent: id, raw: lv, shownStart: reach - take, text: n.text },
            });
        }
      }
      // M21 FR-C1's Build path: a step's band agrees with the save. Only a talent's first step in a tab
      // starts from its real level (later ones start from the simulated one); bubble-set steps are done
      // by rule, and 'later' steps wait on a Stage, so both are left out.
      for (const p of b.presets)
        for (const t of p.tabs) {
          const seen = new Set<number>();
          for (const s of t.path ?? []) {
            if (seen.has(s.talentId)) continue;
            seen.add(s.talentId);
            if (s.band === 'later' || s.note === 'set by a bubble') continue;
            const lv = rawLevel(rc, p.slot, s.talentId);
            if (lv === null) continue;
            const done = s.band === 'done';
            if (done ? lv >= s.goal : lv < s.goal) continue;
            out.push({
              rule: 'next-not-at-target',
              key: s.key,
              message: `${who(rc)} · preset ${p.slot + 1} · tab ${t.tab}: the Build path shows ${s.label} ${
                done ? 'done' : `still to do (to ${s.goal})`
              }, the save has it at ${lv}`,
              severity: done ? 'P1' : 'P2',
              scope: { kind: 'talents', character: rc.index, slot: p.slot, tab: t.tab, itemKey: s.key },
              evidence: { talent: s.talentId, raw: lv, goal: s.goal, band: s.band },
            });
          }
        }
      // M9's Goal: "Next talent points: <talent> to <target>".
      const cr = result.characters.find((c) => c.index === b.index);
      for (const g of cr?.goals ?? []) {
        if (g.nextAction.entryId !== 'talents.check.next-step') continue;
        const m = /^Next talent points: (.+) to ([\d,]+)/.exec(g.nextAction.text);
        if (!m?.[1] || !m[2]) continue;
        const target = Number(m[2].replace(/,/g, ''));
        const levels = b.presets
          .map((p) => {
            const t = p.tabs.find((x) => x.rows.some((r) => r.label === m[1]));
            const id = t?.rows.find((r) => r.label === m[1])?.id;
            return id === undefined ? null : rawLevel(rc, p.slot, id);
          })
          .filter((x): x is number => x !== null);
        if (levels.length > 0 && levels.every((lv) => lv >= target))
          out.push({
            rule: 'next-not-at-target',
            key: g.nextAction.key,
            message: `${who(rc)}: the Goal says ${m[1]} to ${target}, the save has it at ${Math.min(...levels)} or more on every preset`,
            severity: 'P1',
            scope: { kind: 'talents', character: rc.index, itemKey: g.nextAction.key },
            evidence: { target, raw: Math.min(...levels), text: g.nextAction.text },
          });
      }
    }
    return out;
  },
};
