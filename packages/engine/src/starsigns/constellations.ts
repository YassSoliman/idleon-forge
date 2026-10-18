// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 F2 and F4 (docs/specs/M16-star-signs.md FR-5 to FR-13): which W1–W3 constellations the account can
// clear now, of which kind, by whom, and at what effort. Pure: the same context gives the same answer.
import type { CharacterState } from '@idleon-forge/account-state';
import {
  assignOrder,
  type CandyUnit,
  candyPool,
  canReach,
  canUseCandy,
  hasDialogue,
  progressOf,
  reachesTelescope,
  type StarContext,
  takeCandy,
} from './context';
import { type ConstellationFact, constellationFacts, naturalName } from './knowledge';

export type CandidateKind = 'claim' | 'visit' | 'task' | 'candy' | 'afk-hours' | 'later-level' | 'challenge';
/** The kinds that become Goals (D-3). */
export const GOAL_KINDS: ReadonlySet<CandidateKind> = new Set(['claim', 'visit', 'task', 'candy']);

export type StepKind = 'talk' | 'visit' | 'task' | 'candy-withdraw' | 'candy' | 'key-withdraw' | 'claim';
export interface ConstellationStep {
  kind: StepKind;
  character: number;
  seconds: number;
  candy?: CandyUnit;
}

export interface Candidate {
  fact: ConstellationFact;
  kind: CandidateKind;
  /** Recorded slots that hold a character (US-6: a letter for an empty slot is never assigned). */
  recorded: number[];
  /** The game's progress count: the letters' length (F-i). */
  count: number;
  missing: number;
  steps: ConstellationStep[];
  effortSeconds: number;
  /** Reach could not be read (supply step missing): steps read "if you can reach it" (FR-0). */
  reachUnknown: boolean;
  /** FR-13: the highest-level character not yet recorded (challenges). */
  tryWith?: number;
  /** FR-11: the closest character below the level, its gap, and how many more after it. */
  short?: { index: number; gap: number; more: number };
}

export interface CandidateOptions {
  /** F1's why: count as if the quest were handed in (every character has the dialogue). */
  assumeHandedIn: boolean;
  /** The quest's reward candies, counted as storage (FR-4). */
  extraCandies?: Record<string, number>;
}

const inRange = (c: CharacterState, min: number, max: number) => {
  const k = c.classIndex ?? null;
  return k !== null && k >= min && k <= max;
};
const anyClass = (f: ConstellationFact) => f.min <= 0 && f.max >= 99;

/** FR-5 2–4: the world, character-count and class-line gates. */
function gated(ctx: StarContext, f: ConstellationFact): boolean {
  const cs = ctx.state.characters;
  const current = ctx.state.account.currentWorld ?? 1;
  if (f.world > 3 || f.world > ctx.world || f.world > current) return false;
  if (cs.length < f.players) return false;
  if (f.type === 0 && !anyClass(f) && !cs.some((c) => inRange(c, f.min, f.max))) return false;
  if (f.name === 'B-6') {
    const b = ctx.rules.classLines.beginner;
    if (!cs.some((c) => inRange(c, b.min, b.max))) return false;
  }
  return true;
}

/** Arenas and colosseums are entered with a key or tickets (FR-0, V7): reachable for anyone with the dialogue. */
function reach(ctx: StarContext, c: CharacterState, f: ConstellationFact): boolean | null {
  if (f.enter) return true;
  return canReach(ctx, c, f.mapIndex);
}

export function constellationCandidates(ctx: StarContext, opts: CandidateOptions): Candidate[] {
  const v = ctx.values;
  const out: Candidate[] = [];

  const exists = new Set(ctx.state.characters.map((c) => c.index));
  for (const f of constellationFacts(ctx.kb)) {
    const p = progressOf(ctx, f.rawIndex);
    if (p.done || !gated(ctx, f)) continue;
    const recorded = p.recorded.filter((i) => exists.has(i));
    const count = p.letterCount;
    const missing = Math.max(0, f.players - count);
    let reachUnknown = false;
    // F-k: a click counts only with the Telescope dialogue; a character without it talks first when it
    // can reach the Telescope, else it is never assigned (FR-8).
    const clicker = (c: CharacterState): { ok: boolean; talk: boolean } => {
      if (opts.assumeHandedIn || hasDialogue(ctx, c)) return { ok: true, talk: false };
      return reachesTelescope(ctx, c) === true ? { ok: true, talk: true } : { ok: false, talk: false };
    };
    const reaches = (c: CharacterState) => {
      const r = reach(ctx, c, f);
      if (r === null) reachUnknown = true;
      return r !== false;
    };
    const base = { fact: f, recorded, count, missing, reachUnknown: false };
    const push = (kind: CandidateKind, steps: ConstellationStep[], extra: Partial<Candidate> = {}) =>
      out.push({
        ...base,
        kind,
        steps,
        effortSeconds: steps.reduce((n, s) => n + s.seconds, 0),
        ...extra,
        reachUnknown,
      });
    const withTalk = (c: CharacterState, step: ConstellationStep): ConstellationStep[] =>
      clicker(c).talk ? [{ kind: 'talk', character: c.index, seconds: v.talkSeconds }, step] : [step];
    const others = ctx.state.characters.filter((c) => !recorded.includes(c.index));

    // claim (F-j): enough characters recorded; one visit by a character with the dialogue, a recorded one first.
    if (count >= f.players) {
      const pool = assignOrder(
        ctx,
        ctx.state.characters.filter((c) => clicker(c).ok && reaches(c)),
      ).sort((a, b) => Number(recorded.includes(b.index)) - Number(recorded.includes(a.index)));
      const who = pool[0];
      if (!who) continue;
      const steps: ConstellationStep[] = [];
      const key = f.enter?.key;
      if (key && ctx.state.account.storageItems?.[key] && !who.inventoryItems?.[key])
        steps.push({ kind: 'key-withdraw', character: who.index, seconds: 0 });
      steps.push(
        ...withTalk(who, { kind: 'claim', character: who.index, seconds: v.visitSeconds + v.claimSeconds }),
      );
      push('claim', steps);
      continue;
    }

    if (f.kind === 'visit' || f.kind === 'level' || f.kind === 'task') {
      if (f.kind === 'task' && f.name === 'C-3') continue; // Trapping level is not in the Account State yet.
      const meets = (c: CharacterState) =>
        f.kind === 'level'
          ? c.level >= f.min
          : f.kind === 'visit' && !anyClass(f)
            ? inRange(c, f.min, f.max)
            : true;
      const eligible = assignOrder(
        ctx,
        others.filter((c) => meets(c) && clicker(c).ok && reaches(c)),
      );
      if (eligible.length >= missing) {
        const kind = f.kind === 'task' ? 'task' : 'visit';
        const steps = eligible
          .slice(0, missing)
          .flatMap((c) => withTalk(c, { kind, character: c.index, seconds: v.visitSeconds }));
        push(kind, steps);
        continue;
      }
      if (f.kind === 'level') {
        // FR-11: Later only when every missing character is within the level gap.
        const need = missing - eligible.length;
        const near = others
          .filter((c) => !meets(c) && c.level >= f.min - v.levelGap && reaches(c))
          .sort((a, b) => b.level - a.level || a.index - b.index);
        const first = near[0];
        if (first && near.length >= need)
          push('later-level', [], {
            short: { index: first.index, gap: f.min - first.level, more: need - 1 },
          });
      }
      continue;
    }

    if (f.kind === 'afk') {
      const eligible = assignOrder(
        ctx,
        others.filter((c) => canUseCandy(ctx, c) && clicker(c).ok && reaches(c)),
      );
      if (f.min <= v.maxCandyHours && eligible.length >= missing) {
        const pool = candyPool(ctx, opts.extraCandies);
        const steps: ConstellationStep[] = [];
        let ok = true;
        for (const c of eligible.slice(0, missing)) {
          const candy = takeCandy(pool, f.min, c.index);
          if (!candy) {
            ok = false;
            break;
          }
          if (candy.place === 'storage')
            steps.push({ kind: 'candy-withdraw', character: c.index, seconds: 0, candy });
          steps.push(
            ...withTalk(c, {
              kind: 'candy',
              character: c.index,
              seconds: v.visitSeconds + v.candySeconds,
              candy,
            }),
          );
        }
        if (ok) {
          push('candy', steps);
          continue;
        }
      }
      push('afk-hours', []);
      continue;
    }

    // challenge (F4): a reachable map for at least one character not yet recorded (FR-13).
    const b = ctx.rules.classLines.beginner;
    const tryers = others
      .filter((c) => (f.name === 'B-6' ? inRange(c, b.min, b.max) : true) && reaches(c))
      .sort((x, y) => y.level - x.level || x.index - y.index);
    const t = tryers[0];
    if (t) push('challenge', [], { tryWith: t.index });
  }
  return out;
}

/** FR-7 selection order: lowest effort, more points, lower world, then natural name order. */
export function bySelection(a: Candidate, b: Candidate): number {
  return (
    a.effortSeconds - b.effortSeconds ||
    b.fact.points - a.fact.points ||
    a.fact.world - b.fact.world ||
    naturalName(a.fact.name, b.fact.name)
  );
}

/** FR-13: the challenge closest to done (most recorded, then most points). */
export function byCloseness(a: Candidate, b: Candidate): number {
  return b.count - a.count || b.fact.points - a.fact.points || naturalName(a.fact.name, b.fact.name);
}
