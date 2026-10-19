// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4 in the DOM: the three read-only pages are registered page bodies, each shows its one framed
// answer and switches its sections with tabs; a save without the record says so; the welcome slot
// renders nothing before World 4 and lists the steps after. Built from the early-World-4 public save.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { EngineResult } from '@idleon-forge/engine/result';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SYSTEM_PAGES, type SystemPageBodyProps } from '../src/systems/pages';
import { handleRequest } from '../src/worker/handle-request';
import { W4Welcome } from '../src/world4/W4Welcome';
import { W4WelcomeSlot } from '../src/world4/W4WelcomeSlot';
import { BreedingPage, CookingPage, LaboratoryPage } from '../src/world4/World4Pages';
import { noAxeViolations } from './helpers/views';

afterEach(() => cleanup());

// The public early-World-4 save through the worker, as the app parses it.
const text = readFileSync(
  path.resolve(import.meta.dirname, '../../../packages/account-state/fixtures/public/first.json'),
  'utf8',
);
const res = handleRequest({
  type: 'parse',
  id: 1,
  now: Date.UTC(2026, 9, 17, 12),
  input: { kind: 'text', text },
  engine: {
    expectedReturnSeconds: 8 * 3600,
    sessionStartedAt: null,
    learnedExpectedReturnSeconds: null,
    knowledgeVersion: 'k',
  },
} as never) as { result?: { world4?: unknown } };
const view = res.result?.world4 as NonNullable<EngineResult['world4']>;
if (!view) throw new Error('no world4 view');
const session = (world4: unknown) => ({ result: { world4 }, navigate: () => {} }) as never;
const props = (world4: unknown) =>
  ({ s: session(world4), page: { goals: [] } }) as unknown as SystemPageBodyProps;

describe('M24 the World 4 pages', () => {
  it('are registered page bodies', () => {
    expect(SYSTEM_PAGES.laboratory).toBeDefined();
    expect(SYSTEM_PAGES.cooking).toBeDefined();
    expect(SYSTEM_PAGES.breeding).toBeDefined();
  });

  it('Laboratory: the framed answer, the board, then the chips tab', async () => {
    const { container } = render(<LaboratoryPage {...props(view)} />);
    expect(
      screen.getByRole('heading', { name: '3 bonuses lit · next on the board: Animal Farm' }),
    ).toBeTruthy();
    expect(screen.getByRole('img', { name: /^Lab board/ })).toBeTruthy();
    expect(container.querySelectorAll('.a-frame')).toHaveLength(1);
    await noAxeViolations(container);
    fireEvent.click(screen.getByRole('tab', { name: /Chips/ }));
    expect(screen.getByText('Grounded Motherboard')).toBeTruthy();
  });

  it('Cooking: the kitchens, then the meal table', () => {
    render(<CookingPage {...props(view)} />);
    expect(screen.getByRole('heading', { name: 'All 4 kitchens busy' })).toBeTruthy();
    expect(screen.getByText('Kitchen 5')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /Meals/ }));
    expect(screen.getByRole('rowheader', { name: 'Turkey of Thank' })).toBeTruthy();
  });

  it('Breeding: the nest, then the territories', () => {
    render(<BreedingPage {...props(view)} />);
    expect(screen.getByRole('heading', { name: /^1 egg in the nest/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /Territories/ }));
    expect(screen.getByText('Grasslands')).toBeTruthy();
  });

  it('a save without the record says so, with no numbers', () => {
    render(<LaboratoryPage {...props({ ...view, lab: null })} />);
    expect(screen.getByText(/no Laboratory record yet/)).toBeTruthy();
  });

  it('the welcome slot is empty before World 4; the welcome lists the five steps', async () => {
    const { container } = render(<W4WelcomeSlot s={session({ ...view, welcome: null })} />);
    expect(container.innerHTML).toBe('');
    cleanup();
    const w = view.welcome;
    if (!w) throw new Error('no welcome');
    const r = render(<W4Welcome s={session(view)} w={w} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByText('Repository open · 5 of 7')).toBeTruthy();
    await noAxeViolations(r.container);
  });
});
