// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// R-Q9a item 4: preset steps are explicit Walkthrough steps. When a job changes a character's activity,
// the Walkthrough says which talent preset and card preset to switch to, or which to set up first.
//
// TODO(M9): M9 (#77) classifies talent presets against its role-tagged Builds (`classifyPreset`); until
// it is on main a preset is a skilling preset when it holds `skillingAt` points in the skilling talents
// of walkthrough.fact.preset-fit. TODO(M8): M8 (#80) owns the card preset rule (`presetFits`, TR-9: a
// preset fits when at least half its cards' effects name the activity); this is the same rule over the
// same kind of keyword table. Replace both with the owners' helpers once they merge.
import type { CharacterState } from '@idleon-forge/account-state';
import type { PresetFit } from './knowledge';

export type PresetAction =
  | { kind: 'switch'; talent: number; card: number }
  | { kind: 'setup-talent'; talent: number }
  | { kind: 'fill-card'; card: number };

const tokens = (effect: string) =>
  `_${effect
    .replace(/^\+?\{(%|px)?_?/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')}_`;
const matches = (effect: string, words: readonly string[]) => {
  const t = tokens(effect);
  return words.some((w) => t.includes(`_${w.toLowerCase()}_`));
};

/** Does one card effect fit an activity? Drop rate fits both (M8 TR-9). */
export function cardFits(effect: string, activity: string, fit: PresetFit): boolean {
  if (matches(effect, fit.cards.both ?? [])) return true;
  if (activity === 'FIGHTING') return matches(effect, fit.cards.FIGHTING ?? []);
  return matches(effect, fit.cards[activity] ?? []) || matches(effect, fit.cards.skilling ?? []);
}

export function cardPresetFits(effects: readonly string[], activity: string, fit: PresetFit): boolean {
  if (effects.length === 0) return false;
  return effects.filter((e) => cardFits(e, activity, fit)).length * 2 >= effects.length;
}

export type TalentRole = 'fighting' | 'skilling' | 'empty';
export function talentRole(levels: Readonly<Record<string, number>>, fit: PresetFit): TalentRole {
  const total = Object.values(levels).reduce((n, x) => n + x, 0);
  if (total === 0) return 'empty';
  const skill = fit.talents.skilling.reduce((n, t) => n + (levels[t] ?? 0), 0);
  return skill >= fit.talents.skillingAt ? 'skilling' : 'fighting';
}

/** The preset steps for moving `c` to `activity`; [] when its active presets already fit or the save can't tell. */
export function presetActions(c: CharacterState, activity: string, fit: PresetFit | null): PresetAction[] {
  if (!fit) return [];
  const want: TalentRole = activity === 'FIGHTING' ? 'fighting' : 'skilling';
  const tp = c.talentPresets ?? null;
  const cp = c.cardPresets ?? null;
  const out: PresetAction[] = [];
  let talent: number | null = null;
  let talentSwitch = false;
  if (tp) {
    const active = tp.presets.find((p) => p.index === tp.selected);
    if (active && talentRole(active.levels, fit) === want) talent = tp.selected;
    else {
      const other = tp.presets.find((p) => p.index !== tp.selected && talentRole(p.levels, fit) === want);
      if (other) {
        talent = other.index;
        talentSwitch = true;
      } else
        out.push({
          kind: 'setup-talent',
          talent: tp.presets.find((p) => p.index !== tp.selected)?.index ?? 1,
        });
    }
  }
  let card: number | null = null;
  let cardSwitch = false;
  if (cp) {
    const unlocked = cp.presets.slice(0, Math.max(1, cp.unlocked));
    if (cardPresetFits(unlocked[cp.selected] ?? [], activity, fit)) card = cp.selected;
    else {
      const other = unlocked.findIndex((p, i) => i !== cp.selected && cardPresetFits(p, activity, fit));
      if (other >= 0) {
        card = other;
        cardSwitch = true;
      } else {
        const empty = unlocked.findIndex((p, i) => i !== cp.selected && p.length === 0);
        if (empty >= 0) out.push({ kind: 'fill-card', card: empty });
      }
    }
  }
  if (talentSwitch || cardSwitch)
    out.unshift({ kind: 'switch', talent: talent ?? tp?.selected ?? 0, card: card ?? cp?.selected ?? 0 });
  return out;
}
