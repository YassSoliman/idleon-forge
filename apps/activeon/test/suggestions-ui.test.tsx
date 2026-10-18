// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M13 in the DOM: the Suggest form from Suggest and from Report this (US-1, US-2, FR-1 to FR-11), the
// signed-out fallback (D6), names that didn't load (US-3), the outbox (US-4) and Your suggestions with
// Add details (US-5, US-9). A fake Worker records every request; Turnstile is a stub that solves at once.
import type { MySuggestion, SuggestionRequest } from '@idleon-forge/suggestions-worker/contract';
import type { ProofRing } from '@idleon-forge/sync';
import { act, cleanup, configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NowScreen } from '../src/now/NowScreen';
import type { SuggestionsConfig } from '../src/suggestions/config';
import type { ReportSource, Scene } from '../src/suggestions/context';
import {
  SuggestionsProvider,
  SuggestLink,
  useSuggestions,
  YourSuggestionsLink,
} from '../src/suggestions/SuggestionsProvider';
import { createSuggestionsStore, type SuggestionsStore } from '../src/suggestions/store';
import { fixture, props, saveOf, stateFor } from './now-helpers';

// The form chunk and its outbox store answer asynchronously; under full-suite load that can take well
// over the 1 s default. Every findBy/waitFor here waits up to 10 s, and each test up to 30 s.
configure({ asyncUtilTimeout: 10_000 });
vi.setConfig({ testTimeout: 30_000 });

const CONFIG: SuggestionsConfig = {
  baseUrl: 'https://activeon-suggestions.idleon.workers.dev',
  siteKey: '0x4AAAAAAFZh5dFIi0_6HO68',
  dryRun: true,
};

type Call = { path: string; body: Record<string, unknown>; headers: Record<string, string> };
let calls: Call[] = [];
let mine: MySuggestion[] = [];

function fakeWorker() {
  calls = [];
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const path = new URL(String(url)).pathname;
    const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
    calls.push({ path, body, headers: (init?.headers ?? {}) as Record<string, string> });
    if (path === '/v1/suggestions/mine')
      return new Response(JSON.stringify({ items: mine }), { status: 200 });
    if (path.endsWith('/details')) return new Response(JSON.stringify({ number: 7 }), { status: 201 });
    return new Response(
      JSON.stringify({ number: 130, url: 'https://github.com/YassSoliman/idleon-forge/issues/130' }),
      { status: 201 },
    );
  });
}

function proofRing(proof: string | null): ProofRing & { fire(p: string): void } {
  let listeners: ((p: string) => void)[] = [];
  let current = proof;
  return {
    record: async () => {},
    clear: async () => {},
    getSignInProof: async () => current,
    onProofReady(cb) {
      listeners.push(cb);
      return () => {
        listeners = listeners.filter((x) => x !== cb);
      };
    },
    fire(p) {
      current = p;
      for (const cb of listeners) cb(p);
    },
  };
}

let tokenN = 0;
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  tokenN = 0;
  window.turnstile = {
    render(_el, opts) {
      setTimeout(() => opts.callback(`tok-${++tokenN}`), 0);
      (window as unknown as { __ts: typeof opts }).__ts = opts;
      return 'w1';
    },
    reset() {
      const opts = (window as unknown as { __ts: { callback(t: string): void } }).__ts;
      setTimeout(() => opts.callback(`tok-${++tokenN}`), 0);
    },
    remove() {},
  };
  vi.stubGlobal('fetch', fakeWorker());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  mine = [];
});

const r = fixture('mid-session');
const baseScene = (): Scene => {
  const state = stateFor(r);
  for (const c of state.characters) Object.assign(c, { class: 'Squire', level: 85 });
  return {
    state,
    result: r,
    characterIndex: null,
    screen: 'now',
    expectedReturnSeconds: 7200,
    now: Date.now(),
  };
};

function Harness(p: {
  uid?: string | null;
  proof?: ProofRing;
  store?: SuggestionsStore;
  scene?: () => Scene;
  report?: ReportSource;
}) {
  return (
    <SuggestionsProvider
      config={CONFIG}
      uid={p.uid === undefined ? 'uid-1' : p.uid}
      signedOut={p.uid === null}
      proof={p.proof ?? proofRing('a.b.c')}
      scene={p.scene ?? baseScene}
      store={p.store ?? createSuggestionsStore(null)}
    >
      <SuggestLink fallbackHref="https://github.com/x">Suggest</SuggestLink>
      <YourSuggestionsLink />
      {p.report ? <ReportButton source={p.report} /> : null}
    </SuggestionsProvider>
  );
}

function ReportButton({ source }: { source: ReportSource }) {
  const api = useSuggestions();
  return (
    <button
      type="button"
      onClick={() => api?.open({ kind: 'report', source, screen: 'character', characterIndex: 2 })}
    >
      Report it
    </button>
  );
}

/** Waits past "Loading…" until the form's fields are there. */
const loaded = async (dialog: HTMLElement) => {
  await within(dialog).findByLabelText(/^I want…/);
  return dialog;
};
const openForm = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Suggest' }));
  return loaded(await screen.findByRole('dialog', { name: 'Suggest' }));
};
const fill = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const findToast = (text: string) =>
  screen.findByText(
    (_, el) => el?.classList.contains('sg-toast') === true && (el.textContent ?? '').startsWith(text),
  );
const sendButton = () => screen.getByRole('button', { name: /^Send/ }) as HTMLButtonElement;

describe('US-1 send an idea from Suggest (FR-1 to FR-5, FR-11)', () => {
  it('Send waits for 10 characters in I want…, then posts once and says Sent', async () => {
    const { container } = render(<Harness />);
    const dialog = await openForm();
    expect(await within(dialog).findByRole('radio', { name: 'Idea' })).toHaveProperty('checked', true);
    expect(
      within(dialog)
        .getAllByRole('radio')
        .map((x) => x.parentElement?.textContent),
    ).toEqual(['Idea', "Something's wrong", 'Confusing']);
    expect(
      screen.getByText("Suggestions are posted publicly on GitHub. Don't include anything private."),
    ).toBeTruthy();
    fill(/^I want…/, '123456789');
    expect(screen.getByText(/At least 10 characters · 591 left/)).toBeTruthy();
    await waitFor(() => expect(sendButton().disabled).toBe(true));
    fill(/^I want…/, 'to see which character to open first');
    await waitFor(() => expect(sendButton().disabled).toBe(false));
    const res = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    });
    expect(res.violations.map((v) => v.id)).toEqual([]);
    fireEvent.click(sendButton());
    await findToast('Sent. Track it in Your suggestions.');
    const creates = calls.filter((c) => c.path === '/v1/suggestions');
    expect(creates).toHaveLength(1);
    expect(creates[0]?.headers['X-Suggestions-Dry-Run']).toBe('1');
    const body = creates[0]?.body as unknown as SuggestionRequest;
    expect(body.type).toBe('idea');
    expect(body.turnstileToken).toMatch(/^tok-/);
    expect(body.proof).toBe('a.b.c');
    expect(screen.getByRole('link', { name: 'View on GitHub' }).getAttribute('href')).toBe(
      'https://github.com/YassSoliman/idleon-forge/issues/130',
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('FR-8: the draft survives closing the overlay', async () => {
    const store = createSuggestionsStore(null);
    render(<Harness store={store} />);
    await openForm();
    fill(/^I want…/, 'a draft I come back to');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await openForm();
    await waitFor(() =>
      expect((screen.getByLabelText(/^I want…/) as HTMLTextAreaElement).value).toBe('a draft I come back to'),
    );
  });

  it('FR-4: the preview shows the scrubbed text and the context', async () => {
    render(<Harness />);
    await openForm();
    const name = r.characters[0]?.name as string;
    fill(/^Game example/, `my ${name} keeps dying`);
    const pre = screen.getByText(/"schema": 1/);
    expect(pre.textContent).toContain('my [character] keeps dying');
    expect(pre.textContent).not.toContain(name);
  });
});

const report: ReportSource = {
  outputKind: 'verdict',
  entryIds: ['afk.check.weak-map'],
  detectorIds: ['afk/weak-map'],
  fields: ['characters[*].afkType'],
  text: `${r.characters.find((c) => c.index === 2)?.name} dies before you return`,
  stale: false,
  contested: false,
  values: { killsPerHour: 1234.5678 },
};

describe('US-2 Report this (FR-9, FR-10)', () => {
  it("opens as Something's wrong with the numbers ticked; Idea unticks them; unticked sends no values", async () => {
    render(<Harness report={report} />);
    fireEvent.click(screen.getByRole('button', { name: 'Report it' }));
    // R5 QA P3-3: opened from Report this, the form is headed for what it is.
    const dialog = await loaded(await screen.findByRole('dialog', { name: 'Report this line' }));
    expect(await within(dialog).findByRole('radio', { name: "Something's wrong" })).toHaveProperty(
      'checked',
      true,
    );
    const box = within(dialog).getByRole('checkbox', {
      name: 'Attach the numbers this advice used',
    }) as HTMLInputElement;
    expect(box.checked).toBe(true);
    expect(screen.getByText(/"killsPerHour": 1234.5678/)).toBeTruthy();
    expect(within(dialog).getByText(/^\w+ lv \d+ dies before you return$/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('radio', { name: 'Idea' }));
    expect(box.checked).toBe(false);
    fireEvent.click(within(dialog).getByRole('radio', { name: "Something's wrong" }));
    expect(box.checked).toBe(true);
    fireEvent.click(box);
    expect(box.checked).toBe(false);
    fireEvent.click(within(dialog).getByRole('radio', { name: 'Confusing' }));
    fireEvent.click(within(dialog).getByRole('radio', { name: "Something's wrong" }));
    expect(box.checked).toBe(false); // touched: the type no longer changes it
    fill(/^I want…/, 'the weak-map check to use my real damage');
    await waitFor(() => expect(sendButton().disabled).toBe(false));
    fireEvent.click(sendButton());
    await findToast('Sent. Track it in Your suggestions.');
    const body = calls.find((c) => c.path === '/v1/suggestions')?.body as unknown as SuggestionRequest;
    expect(body.context.report).toMatchObject({
      outputKind: 'verdict-blocker',
      entryIds: ['afk.check.weak-map'],
    });
    expect('values' in (body.context.report ?? {})).toBe(false);
    for (const c of r.characters) expect(JSON.stringify(body)).not.toContain(c.name);
  });

  it('Report this on the Now screen opens the in-app form inside the provider', async () => {
    window.history.replaceState(null, '', '/?c=2');
    render(
      <SuggestionsProvider
        config={CONFIG}
        uid="u"
        signedOut={false}
        proof={proofRing('a.b.c')}
        scene={baseScene}
        store={createSuggestionsStore(null)}
      >
        <NowScreen {...props(r, saveOf(r, 1, 'first', null, 'live'))} />
      </SuggestionsProvider>,
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Report this' })[0] as HTMLElement);
    const dialog = await loaded(await screen.findByRole('dialog', { name: 'Report this line' }));
    expect(await within(dialog).findByRole('radio', { name: "Something's wrong" })).toHaveProperty(
      'checked',
      true,
    );
    expect(within(dialog).getByText('About this advice:')).toBeTruthy();
    // Esc closes the overlay, not the Focus card underneath.
    fireEvent.keyDown(within(dialog).getByLabelText(/^I want…/), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(window.location.search).toBe('?c=2');
  });
});

describe('who can send (FR-6, FR-7, D6)', () => {
  it('signed out: the form says to sign in and offers the pre-filled GitHub issue', async () => {
    render(<Harness uid={null} />);
    await openForm();
    fill(/^I want…/, 'to suggest without signing in');
    expect(screen.getByText('Sign in to send suggestions.')).toBeTruthy();
    expect(sendButton().disabled).toBe(true);
    const link = screen.getByRole('link', { name: 'open it as a GitHub issue' });
    expect(link.getAttribute('href')).toMatch(
      /^https:\/\/github\.com\/YassSoliman\/idleon-forge\/issues\/new\?/,
    );
    expect(new URL(link.getAttribute('href') as string).searchParams.get('body')).toContain(
      'to suggest without signing in',
    );
  });

  it('US-3: names that did not load disable Send', async () => {
    const scene = () => {
      const s = baseScene();
      return {
        ...s,
        state: { ...s.state, diagnostics: { failedSideReads: ['charNames'] } } as unknown as Scene['state'],
      };
    };
    render(<Harness scene={scene} />);
    await openForm();
    fill(/^I want…/, 'something long enough to send');
    expect(
      screen.getByText("Can't check your text for character names right now. Try again in a moment."),
    ).toBeTruthy();
    await act(async () => {});
    expect(sendButton().disabled).toBe(true);
  });
});

describe('US-4 no proof yet (FR-12, FR-19)', () => {
  it('saves to the outbox, shows Waiting to send, then Ready to send; Send now posts once', async () => {
    const ring = proofRing(null);
    const store = createSuggestionsStore(null);
    render(<Harness proof={ring} store={store} />);
    await openForm();
    // The form shows "Loading…" until the outbox store answers; on a busy CI runner that takes a tick.
    await screen.findByLabelText(/^I want…/);
    fill(/^I want…/, 'to save this one for later');
    await waitFor(() => expect(sendButton().disabled).toBe(false));
    fireEvent.click(sendButton());
    await findToast('Saved. You can send it within the hour.');
    expect(calls.filter((c) => c.path === '/v1/suggestions')).toHaveLength(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Your suggestions' })[0] as HTMLElement);
    await screen.findByText('Waiting to send');
    expect(calls).toHaveLength(0);
    act(() => ring.fire('a.b.c'));
    await screen.findByText('Ready to send');
    expect(calls.filter((c) => c.path === '/v1/suggestions')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Send now' }));
    await findToast('Sent. Track it in Your suggestions.');
    expect(calls.filter((c) => c.path === '/v1/suggestions')).toHaveLength(1);
    expect(await store.get('outbox')).toEqual([]);
  });
});

describe('US-5 / US-9 Your suggestions', () => {
  it('shows statuses, the approved reply, and a one-shot Add details box', async () => {
    mine = [
      {
        number: 7,
        url: 'https://github.com/YassSoliman/idleon-forge/issues/7',
        type: 'wrong',
        iWant: 'food to count right',
        createdAt: '2026-10-17T10:00:00Z',
        status: 'info',
        question: 'Which food was equipped?',
        canAddDetails: true,
      },
      {
        number: 6,
        url: 'https://github.com/YassSoliman/idleon-forge/issues/6',
        type: 'idea',
        iWant: 'a dark theme',
        createdAt: '2026-10-16T10:00:00Z',
        status: 'done',
        reply: 'Shipped in 2026.10.17.',
      },
      {
        number: 5,
        url: 'https://github.com/YassSoliman/idleon-forge/issues/5',
        type: 'confusing',
        iWant: 'to understand carry forward',
        createdAt: '2026-10-15T10:00:00Z',
        status: 'decision',
      },
      {
        number: 4,
        url: 'https://github.com/YassSoliman/idleon-forge/issues/4',
        type: 'idea',
        iWant: 'more pets',
        createdAt: '2026-10-14T10:00:00Z',
        status: 'received',
      },
    ];
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Your suggestions' }));
    const dialog = await screen.findByRole('dialog', { name: 'Your suggestions' });
    await within(dialog).findByText('Needs your answer');
    expect(within(dialog).getByText('Done')).toBeTruthy();
    expect(within(dialog).getByText('Waiting on a decision')).toBeTruthy();
    expect(within(dialog).getByText('Received')).toBeTruthy();
    expect(within(dialog).getByText('Shipped in 2026.10.17.')).toBeTruthy();
    expect(within(dialog).getByText('Which food was equipped?')).toBeTruthy();
    expect(calls[0]).toMatchObject({ path: '/v1/suggestions/mine', body: { proof: 'a.b.c' } });
    const name = r.characters[0]?.name as string;
    fireEvent.change(within(dialog).getByLabelText('Add details'), {
      target: { value: `${name} had sushi equipped` },
    });
    const send = within(dialog).getByRole('button', { name: 'Send answer' }) as HTMLButtonElement;
    await waitFor(() => expect(send.disabled).toBe(false));
    mine = mine.map((m) => (m.number === 7 ? { ...m, canAddDetails: false } : m));
    fireEvent.click(send);
    await waitFor(() => expect(within(dialog).queryByLabelText('Add details')).toBeNull());
    const d = calls.find((c) => c.path === '/v1/suggestions/7/details');
    expect(d?.body).toMatchObject({ text: '[character] had sushi equipped', proof: 'a.b.c' });
    expect(String(d?.body.turnstileToken)).toMatch(/^tok-/);
  });

  it('with no proof, shows the cached list marked "as of"', async () => {
    const store = createSuggestionsStore(null);
    await store.set('mine', {
      items: [
        {
          number: 3,
          url: 'https://github.com/YassSoliman/idleon-forge/issues/3',
          type: 'idea',
          iWant: 'cached one',
          createdAt: '2026-10-10T10:00:00Z',
          status: 'planned',
        },
      ],
      at: Date.now() - 60_000,
    });
    render(<Harness proof={proofRing(null)} store={store} />);
    fireEvent.click(screen.getByRole('button', { name: 'Your suggestions' }));
    await screen.findByText('cached one');
    expect(screen.getByText(/^As of /)).toBeTruthy();
    expect(screen.getByText('Planned')).toBeTruthy();
    expect(calls).toHaveLength(0);
  });

  it('signing out clears the draft, outbox and cached list', async () => {
    const store = createSuggestionsStore(null);
    await store.set('owner', 'abc');
    await store.set('outbox', [
      {
        clientId: 'x',
        type: 'idea',
        text: { whenIm: '', iWant: 'queued', soThat: '', example: '' },
        report: null,
        attach: null,
        characterIndex: null,
        screen: 'now',
        createdAt: 0,
        attachValues: false,
        savedAt: 0,
      },
    ]);
    render(<Harness uid={null} store={store} />);
    await waitFor(async () => expect(await store.get('outbox')).toEqual([]));
    expect(await store.get('owner')).toBeNull();
  });
});
