// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment jsdom
// Copyright (C) 2026 IdleOn Forge contributors.
// M25 polish: the Anvil page's Walkthrough on a W3 save (public first.json, next tab 4). The craft step's
// chip names tab 3 and shows tab 3's sprite while it opens Anvil Tab 4's recipe; the full steps don't link
// the tab back to its own Walkthrough; and the header says what the Production Plan sees when a check
// can't read this older save, instead of "Can't tell · Can't tell from the save".
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { AccountState } from '@idleon-forge/account-state';
import type { EngineResult } from '@idleon-forge/engine/result';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { handleRequest } from '../src/worker/handle-request';
import { props, renderNow } from './now-helpers';

let result: EngineResult;
let state: AccountState;
beforeAll(() => {
  const raw = JSON.parse(
    readFileSync(
      path.resolve(import.meta.dirname, '../../../packages/account-state/fixtures/public/first.json'),
      'utf8',
    ),
  ) as { data: Record<string, unknown> };
  // Parsed now, as a pasted save is in the app (the save itself is old).
  const now = Date.now();
  const res = handleRequest({
    type: 'parse',
    id: 1,
    now,
    input: { kind: 'text', text: JSON.stringify(raw) },
    engine: {
      expectedReturnSeconds: 8 * 3600,
      sessionStartedAt: null,
      learnedExpectedReturnSeconds: null,
      knowledgeVersion: 'k',
    },
  } as never);
  if (!('state' in res) || !res.ok || !res.result || 'error' in res.result)
    throw new Error('expected a result');
  result = res.result;
  state = res.state;
}, 120_000);
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

const open = async (hash: string) => {
  window.history.replaceState(null, '', hash);
  renderNow(props(result, { state, source: 'paste', seq: 1, kind: 'first', slot: null }));
  return screen.findByRole('tablist', {}, { timeout: 5000 });
};

describe('the Anvil Walkthrough (first.json)', () => {
  it('reads tab 4 as the next tab', () => {
    expect(result.production?.nextTab?.tab).toBe(4);
  });

  it("the craft step's chip: tab 3's label and sprite, opening Anvil Tab 4's recipe", async () => {
    await open('/#system-anvil?tab=walkthrough');
    const a = await screen.findByRole('link', { name: "Anvil tab 3: open Anvil Tab 4's recipe" });
    expect(a.getAttribute('href')).toBe('#system-anvil?tab=recipes&focus=EquipmentSmithingTabs4');
    const src = a.querySelector('img')?.getAttribute('src') ?? '';
    expect(src).toContain('SmithingTabs3');
    expect(a.textContent).toContain('Anvil tab 3');
  });

  it('the full steps never link Anvil Tab 4 back to its own Walkthrough', async () => {
    await open('/#system-anvil?tab=walkthrough');
    fireEvent.click(await screen.findByRole('button', { name: 'Every step and the full tree' }));
    const self = [...document.querySelectorAll('a')].filter(
      (x) =>
        x.closest('.walkthrough') &&
        x.getAttribute('href') === '#system-anvil?tab=walkthrough&focus=EquipmentSmithingTabs4',
    );
    expect(self).toEqual([]);
  });

  it('the header says what the Production Plan sees, not "Can\'t tell" twice', async () => {
    await open('/#system-anvil');
    const head = document.querySelector('.sf-status')?.textContent ?? '';
    expect(head).not.toContain("Can't tell");
    expect(head).toContain(result.production?.anvils.line ?? '?');
    expect(head).toContain("some checks can't read this save");
  });

  it('says "no estimate" on as many materials as the header says lack one (final QA P2)', async () => {
    await open('/#system-anvil?tab=walkthrough');
    const t = result.production?.nextTab;
    const head = t?.bottleneck ?? '';
    const lacking = Number(
      head.match(/(\d+) lacks? a time estimate/)?.[1] ?? (/^slowest:/.test(head) ? 0 : -1),
    );
    const rows = [...document.querySelectorAll('.aw-eta')].map((x) => x.textContent);
    const none = rows.filter((x) => x === 'no estimate').length;
    if (lacking >= 0) expect(none).toBe(lacking);
    // Every missing material says something: a time or "no estimate", never a blank.
    for (const m of t?.materials ?? []) if (m.held < m.need) expect(m.eta).toBeTruthy();
  });
});
