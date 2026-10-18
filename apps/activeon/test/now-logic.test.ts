// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Now screen's pure rules in the app: following the game (FR-14 ruling), Report this (US-12,
// TR-10), What's new (US-16, M12 TR-8), the Preview badge (M12 FR-11) and the import boundary (TR-1).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BuildInfo, WhatsNewFeed } from '@idleon-forge/release';
import { describe, expect, it } from 'vitest';
import { INITIAL_FOLLOW, onSave, onTap } from '../src/now/follow';
import { previewBadge, whatsNewFor } from '../src/now/release';
import { MAX_URL_BYTES, reportUrl, scrubNames } from '../src/now/report';

const order = [3, 0, 4, 1, 2];
/** FR-12 over a fixed order: the first unvisited character that isn't `exclude`. */
const nextUp = (exclude: number, visited: ReadonlySet<number>) =>
  order.find((i) => i !== exclude && !visited.has(i)) ?? null;
const save = (kind: 'first' | 'autosave' | 'switch-leave', slot: number | null, sessionStartedAt = 1) => ({
  kind,
  slot,
  fresh: true,
  sessionStartedAt,
  nextUp,
});

describe('following the game (FR-14 as ruled on #38)', () => {
  it('the recorded sequence: autosave on A, switch saves stamp A, B, C (left), then an autosave on D', () => {
    let s = onSave(INITIAL_FOLLOW, save('first', 3));
    expect(s).toMatchObject({ followTo: 3, state: { playing: { index: 3, status: 'confirmed' } } });
    // Switch away from 3: the save stamps 3 (left). Next up is the worst unvisited: 0.
    s = onSave(s.state, save('switch-leave', 3));
    expect(s.followTo).toBe(0);
    expect(s.state).toMatchObject({ leftFrom: 3, playing: { index: 0, status: 'next-up' } });
    // The player went to 4 instead and switched on: the save stamps 4 (left).
    s = onSave(s.state, save('switch-leave', 4));
    expect(s.state.leftFrom).toBe(4);
    expect(s.followTo).toBe(0);
    // The autosave stamps 1 as current: it wins, silently.
    s = onSave(s.state, save('autosave', 1));
    expect(s).toMatchObject({ followTo: 1, state: { playing: { index: 1, status: 'confirmed' } } });
    expect(s.state.visited.sort()).toEqual([1, 3, 4]);
    // A later autosave on the same character never moves the view.
    expect(onSave(s.state, save('autosave', 1)).followTo).toBeNull();
  });
  it('null never moves the view; a stale save never follows', () => {
    const s = onSave(INITIAL_FOLLOW, save('first', 3)).state;
    expect(onSave(s, save('switch-leave', null)).followTo).toBeNull();
    expect(onSave(s, { ...save('autosave', 2), fresh: false }).followTo).toBeNull();
  });
  it('a tap means "I\'m on X" until a save confirms or contradicts it', () => {
    let st = onTap(INITIAL_FOLLOW, 2, true);
    expect(st.playing).toEqual({ index: 2, status: 'assumed' });
    expect(onSave({ ...st, sessionStartedAt: 1 }, save('autosave', 2)).state.playing).toEqual({
      index: 2,
      status: 'confirmed',
    });
    st = { ...st, sessionStartedAt: 1 };
    expect(onSave(st, save('autosave', 0))).toMatchObject({ followTo: 0, state: { playing: { index: 0 } } });
  });
  it('a new Play Session forgets the visited set', () => {
    const s = onSave(onSave(INITIAL_FOLLOW, save('first', 3, 1)).state, save('autosave', 0, 99));
    expect(s.state.visited).toEqual([0]);
  });
  it('paste mode: a tap only marks visited', () => {
    expect(onTap(INITIAL_FOLLOW, 2, false)).toMatchObject({ visited: [2], playing: null });
  });
});

const build: BuildInfo = {
  schema: 1,
  app: '2026.10.17-abc1234',
  commit: 'abc1234def5678',
  builtFrom: '2026-10-17T00:00:00Z',
  channel: 'production',
  knowledge: '2026.10.17',
  parsers: { toolboxCommit: '6c37e3dac38e', toolboxVersion: '3.3.96', gameVersion: '2.3.540' },
};

describe('US-12 Report this (pre-M13)', () => {
  const input = {
    outputKind: 'next-action' as const,
    entryIds: ['stamps.check.cheapest-damage'],
    fields: ['characters[2].level'],
    text: 'Switch to Grumbo and buy the Target Stamp',
    stale: false,
    contested: false,
    screen: 'character' as const,
    character: { classLabel: 'Squire', level: 43 },
    stage: 'W2-mid',
    knowledge: '2026.10.17',
    gameBuild: 142,
    build,
  };
  it('pre-fills the kb-correction form with ids, versions, Stage, class and level, and no name', () => {
    const url = reportUrl(input, ['Grumbo']);
    expect(
      url.startsWith('https://github.com/YassSoliman/idleon-forge/issues/new?template=kb-correction.yml&'),
    ).toBe(true);
    const body = new URL(url).searchParams.get('body') ?? '';
    for (const s of [
      'stamps.check.cheapest-damage',
      '2026.10.17',
      '142',
      'W2-mid',
      'Squire',
      '43',
      'buy the Target Stamp',
    ])
      expect(body).toContain(s);
    expect(body).not.toContain('Grumbo');
    expect(body).toContain('[character]');
  });
  it('names the Knowledge Base version once, without the bundle display\'s "knowledge" prefix (R3 QA P2-1)', () => {
    const body = new URL(reportUrl({ ...input, knowledge: 'knowledge 2026.10.17.13' }, [])).searchParams.get(
      'body',
    );
    expect(body).toContain('- Knowledge Base: 2026.10.17.13');
    expect(body).not.toContain('Knowledge Base: knowledge');
  });
  it('keeps the whole URL at most 7,500 bytes, truncating the action text first', () => {
    const url = reportUrl({ ...input, text: 'x'.repeat(20_000) }, []);
    expect(new TextEncoder().encode(url).length).toBeLessThanOrEqual(MAX_URL_BYTES);
    expect(new URL(url).searchParams.get('body')).toContain('stamps.check.cheapest-damage');
  });
  it('scrubs the longest name first', () => {
    expect(scrubNames('Ann and Anna', ['Ann', 'Anna'])).toBe('[character] and [character]');
  });
});

describe("US-16 What's new (M12 TR-8)", () => {
  const feed: WhatsNewFeed = {
    schema: 1,
    entries: Array.from({ length: 8 }, (_, i) => ({
      id: `E${i + 1}`,
      date: `2026-10-${String(20 - i).padStart(2, '0')}`,
      section: (['advice', 'game-patch', 'app'] as const)[i % 3] ?? 'app',
      text: `Entry ${i + 1}`,
    })),
  };
  it('lastSeen E5: E1–E4, grouped as Advice changes / Game patch support / App changes', () => {
    const v = whatsNewFor(feed, { id: 'E5', date: '2026-10-16' });
    expect(v?.groups.map((g) => g.title)).toEqual(['Advice changes', 'Game patch support', 'App changes']);
    expect(v?.groups.flatMap((g) => g.entries.map((e) => e.id)).sort()).toEqual(['E1', 'E2', 'E3', 'E4']);
    expect(v?.newest).toEqual({ id: 'E1', date: '2026-10-20' });
  });
  it('first visit: nothing; nothing new: nothing; an unknown id falls back to dates (rollback: nothing)', () => {
    expect(whatsNewFor(feed, null)).toBeNull();
    expect(whatsNewFor(feed, { id: 'E1', date: '2026-10-20' })).toBeNull();
    expect(whatsNewFor(feed, { id: 'gone', date: '2026-10-21' })).toBeNull();
    expect(
      whatsNewFor(feed, { id: 'gone', date: '2026-10-18' })?.groups.flatMap((g) => g.entries).length,
    ).toBe(2);
  });
  it('at most 10, then "and N more"', () => {
    const big: WhatsNewFeed = {
      schema: 1,
      entries: Array.from({ length: 14 }, (_, i) => ({
        id: `B${i}`,
        date: '2026-10-20',
        section: 'app',
        text: 't',
      })),
    };
    expect(whatsNewFor(big, { id: 'B13', date: '2026-10-01' })?.more).toBe(3);
  });
});

describe('M12 FR-11 Preview badge', () => {
  it('shows on a Preview only', () => {
    // M21 G2: a grey pill in the header's chip row.
    expect(previewBadge({ ...build, channel: 'preview', pr: 63 })).toBe('Preview · PR #63');
    expect(previewBadge(build)).toBeNull();
  });
});

describe('TR-1 import boundary', () => {
  it('the UI thread never imports the engine root or toolbox-parsers at runtime (worker excepted)', () => {
    const src = path.resolve(fileURLToPath(new URL('../src/', import.meta.url)));
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = path.join(d, f);
        if (statSync(p).isDirectory()) {
          if (f !== 'worker') walk(p);
        } else if (/\.tsx?$/.test(f)) files.push(p);
      }
    };
    walk(src);
    const bad = files.flatMap((f) => {
      const text = readFileSync(f, 'utf8');
      const runtime = [...text.matchAll(/^import (?!type )[^;]*?from '([^']+)'/gms)].map((m) => m[1] ?? '');
      return runtime
        .filter(
          (m) =>
            m === '@idleon-forge/engine' ||
            m.startsWith('@idleon-forge/engine/core') ||
            m === '@idleon-forge/toolbox-parsers',
        )
        .map((m) => `${path.relative(src, f)}: ${m}`);
    });
    expect(bad).toEqual([]);
  });
});
