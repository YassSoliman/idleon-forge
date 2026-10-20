// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 6 in the DOM: Poppy's page sections (the pond, Megafish, Tar Pit, bonuses) from a pond past its
// twelfth Megafish, none for a save that never reached the pond; the Minigames Highscores tab.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { toAccountState } from '@idleon-forge/account-state';
import { normalizeEnvelope, parseSave } from '@idleon-forge/toolbox-parsers';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FULL_PAGES } from '../src/systems/pages';
import { MinigameScores } from '../src/systems/w1/minigame-scores';
import { poppySections } from '../src/systems/w1/poppy';
import { noAxeViolations } from './helpers/views';

afterEach(() => cleanup());

const stateOf = (file: string) => {
  const raw = readFileSync(
    path.resolve(import.meta.dirname, `../../../packages/account-state/fixtures/public/${file}`),
    'utf8',
  );
  const env = normalizeEnvelope(JSON.parse(raw));
  return toAccountState(parseSave(env, { now: Date.UTC(2026, 9, 17, 12) }), env, { source: 'paste' });
};
const props = (file: string) =>
  ({ s: { state: stateOf(file), navigate: () => {} }, page: { goals: [] } }) as never;

describe('M26 Wave 6: Poppy', () => {
  it('has its own page', () => {
    expect(FULL_PAGES.poppy).toBeDefined();
  });
  it('a save that never reached the pond has no sections (the thin page)', () => {
    expect(poppySections(props('first.json'))).toBeNull();
  });
  it('highend: the pond answers with its fish and Megafish, and draws every tab', async () => {
    const sec = poppySections(props('highend.json'));
    expect(sec?.answer?.big?.value).toBe('26');
    expect(sec?.tabs.map((t) => t.id)).toEqual(['pond', 'megafish', 'tar', 'bonuses']);
    for (const t of sec?.tabs ?? []) {
      const { container } = render(<>{t.render()}</>);
      await noAxeViolations(container);
      cleanup();
    }
    render(<>{sec?.tabs[1]?.render()}</>);
    expect(screen.getByText('Megafish 12')).toBeTruthy();
    expect(screen.getByText('Other spirals higher')).toBeTruthy();
  });
});

describe('M26 Wave 6: the Minigames Highscores tab', () => {
  it('first.json: the five highscores the Tome adds, 350 in all', () => {
    const s = stateOf('first.json');
    const mg = s.account.minigames;
    if (!mg) throw new Error('no minigames');
    render(<MinigameScores mg={mg} goals={[]} />);
    expect(screen.getByText('350')).toBeTruthy();
    expect(screen.getAllByText('Pen Pals')).toHaveLength(2);
  });
});
