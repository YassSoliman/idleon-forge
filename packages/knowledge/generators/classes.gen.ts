// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The class tree (M2 TR-7, M9 TR-5): `classes.fact.class-tree` (classIndex -> class, line, tier, swap
// sibling, talent tabs) and one Acquisition per released subclass and elite class. Read from Toolbox's
// classPromotions.json only: tier is the depth below Beginner (base / subclass / elite / master),
// the line is the base class above it, and the swap sibling is the class at the same depth under the
// other subclass of the same base class (the subclass swap token works within a class line).
import type { FactTableT, GeneratedEntryT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';

interface Promotion {
  index: number;
  released?: boolean;
  promotesTo?: string[];
  promotesFrom?: string;
  talentTabs?: string[];
}

const TIERS = ['beginner', 'base', 'subclass', 'elite', 'master'] as const;
export type ClassTier = (typeof TIERS)[number];

export interface ClassTreeRow {
  classIndex: number;
  class: string;
  /** The base class of its line (Warrior, Archer, Mage, Journeyman); null for Beginner. */
  line: string | null;
  tier: ClassTier;
  promotesFrom: string | null;
  promotesTo: string[];
  /** The class at the same tier on the other subclass branch of the same line; null when there is none. */
  swapSibling: string | null;
  talentTabs: string[];
  released: boolean;
}

/** Builds the tree rows from classPromotions.json. Throws when a class's ancestry doesn't reach Beginner. */
export function classTree(promotions: Record<string, Promotion>): ClassTreeRow[] {
  const ancestry = (c: string): string[] => {
    const chain: string[] = [c];
    let cur = promotions[c]?.promotesFrom;
    while (cur) {
      if (chain.includes(cur)) throw new Error(`classes: promotion cycle at ${cur}`);
      chain.unshift(cur);
      cur = promotions[cur]?.promotesFrom;
    }
    return chain; // Beginner first, except for Beginner and the Journeyman line (see below)
  };
  const rows: ClassTreeRow[] = [];
  for (const [name, p] of Object.entries(promotions)) {
    const chain = ancestry(name);
    // Journeyman has no promotesFrom in the data but is a base class (Beginner lists it nowhere either):
    // it is a base class when its chain starts at itself and it is not Beginner.
    const rooted = chain[0] === 'Beginner' ? chain : ['Beginner', ...chain];
    const depth = rooted.length - 1;
    const tier = TIERS[depth];
    if (!tier) throw new Error(`classes: ${name} is ${depth} promotions deep, past the known tiers`);
    const line = depth >= 1 ? (rooted[1] as string) : null;
    let swapSibling: string | null = null;
    if (depth >= 2) {
      const sub = rooted[2] as string;
      const otherSubs = (promotions[line as string]?.promotesTo ?? []).filter((s) => s !== sub);
      if (otherSubs.length === 1) {
        let other: string | undefined = otherSubs[0];
        for (let d = 3; d <= depth && other; d++) {
          const next: string[] = promotions[other]?.promotesTo ?? [];
          other = next.length === 1 ? next[0] : undefined;
        }
        swapSibling = other ?? null;
      }
    }
    rows.push({
      classIndex: p.index,
      class: name,
      line,
      tier,
      promotesFrom: p.promotesFrom ?? null,
      promotesTo: [...(p.promotesTo ?? [])].sort(),
      swapSibling,
      talentTabs: [...(p.talentTabs ?? [])],
      released: p.released !== false,
    });
  }
  return rows.sort((a, b) => a.classIndex - b.classIndex);
}

const generator = defineGenerator({
  name: 'classes',
  system: 'classes',
  inputs: ['website-data/classPromotions.json'],
  run({ data, pin }) {
    const promotions = data.classPromotions as Record<string, Promotion>;
    if (!promotions?.Beginner) throw new Error('classes: classPromotions.json has no Beginner');
    const rows = classTree(promotions);
    const source = generatedSource(
      pin,
      'website-data/classPromotions.json',
      'IdleOn Toolbox game data: classPromotions',
    );
    const by = generatedBy(generator, pin);
    const entries: GeneratedEntryT[] = rows
      .filter((r) => r.released && (r.tier === 'subclass' || r.tier === 'elite') && r.promotesFrom)
      .map((r) => {
        const display = r.class.replace(/_/g, ' ');
        const from = (r.promotesFrom as string).replace(/_/g, ' ');
        return {
          id: `classes.acquisition.${slugify(r.class)}`,
          system: 'classes',
          type: 'acquisition',
          origin: 'generated',
          title: `Class: ${display}`.slice(0, 80),
          text: `Promote a ${from} to ${display}`,
          why: `${display} is a ${r.tier} class of the ${(r.line as string).replace(/_/g, ' ')} line.`,
          values: { class: r.class, from: r.promotesFrom as string, tier: r.tier, classIndex: r.classIndex },
          sources: [source],
          appliesTo: { stages: 'all' },
          confidence: 'H',
          status: 'active',
          thing: { kind: 'class', rawName: r.class },
          methods: [{ how: `Promote from ${from}`, requires: [] }],
          generatedBy: by,
        };
      });
    return {
      entries,
      facts: [
        {
          id: 'classes.fact.class-tree',
          system: 'classes',
          origin: 'generated',
          title: 'Class tree: index, line, tier, swap sibling',
          rows: rows as unknown as FactTableT['rows'],
          sources: [source],
          generatedBy: by,
        },
      ],
    };
  },
});

export default generator;
