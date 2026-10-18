// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M9 TR-15's authoring rules over the compiled Knowledge Base: every Build talent is generated data,
// `core` and `hardCap` only where TR-5 allows them, every Build has a dated Source whose game version
// was out on that date, and every M9 entry has a Source a player can read (#74).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Entry } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { buildId, buildsKnowledge } from '../../src/builds';
import { lookupOf } from '../../src/metapath/knowledge';
import { kb } from './helpers';

const PATCHES = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../knowledge/generated/_patches.json', import.meta.url)), 'utf8'),
) as { dates: Record<string, string> };

type BuildEntry = Extract<Entry, { type: 'build' }>;
const builds = Object.values(kb.entries).filter((e): e is BuildEntry => e.type === 'build');
const m9 = Object.values(kb.entries).filter((e) => /^(talents|talent-presets|talent-resets)\./.test(e.id));
const facts = buildsKnowledge(lookupOf(kb));

const IDLE_FIGHTING = new Set(['IDLE_BRAWLING', 'IDLE_SHOOTING', 'IDLE_CASTING']);

describe('M9 Build entries (TR-5, TR-15)', () => {
  it('cover every W1–W3 class line: fighting for all, skilling for all but the Beginner', () => {
    const lines = [
      'Warrior',
      'Archer',
      'Mage',
      'Barbarian',
      'Squire',
      'Bowman',
      'Hunter',
      'Wizard',
      'Shaman',
    ];
    for (const l of lines)
      for (const role of ['fighting', 'skilling'] as const)
        expect(kb.entries[buildId(l, role)]).toBeDefined();
    expect(kb.entries[buildId('Beginner', 'fighting')]).toBeDefined();
  });

  it('name only talents in the generated talent data', () => {
    for (const b of builds) {
      for (const t of b.tabs)
        for (const s of t.steps) expect(facts.talents.idOf(s.talent), s.talent).toBeDefined();
      for (const t of [...b.tags, ...b.attacks, ...b.onePointOk])
        expect(facts.talents.idOf(t), t).toBeDefined();
    }
  });

  it('mark core only the Idle fighting talent to 50, or the served skill attack', () => {
    for (const b of builds)
      for (const t of b.tabs)
        for (const s of t.steps) {
          if (!s.core) continue;
          const id = facts.talents.idOf(s.talent) as number;
          const ok =
            (b.role === 'fighting' && IDLE_FIGHTING.has(s.talent) && s.target === 50) ||
            (b.role === 'skilling' && b.serves.includes(facts.talents.skillAttackFor(id) as never));
          expect(ok, `${b.id} ${s.talent}`).toBe(true);
        }
  });

  it('allow hardCap only on accuracy-stat steps under accuracyShort', () => {
    for (const b of builds)
      for (const t of b.tabs)
        for (const s of t.steps)
          if (s.hardCap)
            expect(
              s.when?.some((w) => w.kind === 'accuracyShort'),
              `${b.id} ${s.talent}`,
            ).toBe(true);
  });

  it('list only attacks the game counts on the AFK bar', () => {
    for (const b of builds)
      for (const a of b.attacks)
        expect(facts.talents.isAttack(facts.talents.idOf(a) as number), a).toBe(true);
  });

  it('carry a dated community or wiki Source whose game version was out on that date', () => {
    for (const b of builds) {
      const dated = b.sources.filter((s) => s.tier === 2 || s.tier === 3);
      expect(dated.length, b.id).toBeGreaterThan(0);
      for (const s of dated) {
        expect(s.claimDate, b.id).toBeDefined();
        const released = PATCHES.dates[s.gameVersion];
        expect(released, `${b.id} ${s.gameVersion}`).toBeDefined();
        expect((released as string) <= (s.claimDate as string), `${b.id} ${s.gameVersion}`).toBe(true);
      }
    }
  });

  it('D4: the data-backed Builds are flagged Stale, the transcribed ones are not', () => {
    const stale = builds.filter((b) => b.stale).map((b) => b.id);
    expect(stale.sort()).toEqual(
      ['mage', 'warrior'].flatMap((l) => [buildId(l, 'fighting'), buildId(l, 'skilling')]).sort(),
    );
  });
});

describe('#74 player-facing Sources', () => {
  it('every M9 entry has at least one tier 2–4 Source that is not a GitHub file, and its tier 1 provenance', () => {
    expect(m9.length).toBeGreaterThan(25);
    for (const e of m9) {
      expect(
        e.sources.some((s) => s.tier >= 2 && !s.url.startsWith('https://github.com/')),
        e.id,
      ).toBe(true);
      expect(
        e.sources.some((s) => s.tier === 1),
        e.id,
      ).toBe(true);
    }
  });
});
