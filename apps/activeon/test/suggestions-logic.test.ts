// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M13 in the app, pure parts: the name scrub (FR-6, US-3), the report context (FR-9, FR-10, US-2), the
// request the form sends (TR-3, TR-9), the outbox (FR-12, US-4), retries (FR-14, US-7), the error
// messages (FR-15, US-6) and the build config. The Worker's own validator checks every request.
import { readdirSync } from 'node:fs';
import path from 'node:path';
import type { AccountState } from '@idleon-forge/account-state';
import type { BuildInfo } from '@idleon-forge/release';
import type { SuggestionRequest } from '@idleon-forge/suggestions-worker/contract';
import { validateSuggestionRequest } from '@idleon-forge/suggestions-worker/validate';
import { describe, expect, it, vi } from 'vitest';
import { fallbackIssueUrl } from '../src/now/report';
import { type ClientOptions, messageFor } from '../src/suggestions/client';
import { readSuggestionsConfig } from '../src/suggestions/config';
import {
  accountNames,
  attachByDefault,
  buildContext,
  buildReport,
  namedCharacters,
  type ReportSource,
  type Scene,
} from '../src/suggestions/context';
import { anonymize, scrubNames } from '../src/suggestions/scrub';
import { requestPreview, sendSuggestion } from '../src/suggestions/send';
import { createSuggestionsStore, type Draft } from '../src/suggestions/store';
import { fixture, stateFor } from './now-helpers';

const BUILD: BuildInfo = {
  schema: 1,
  app: '2026.10.17-3f9c2ab',
  commit: '3f9c2ab0000000000000000000000000000000aa',
  builtFrom: '2026-10-17T00:00:00Z',
  channel: 'production',
  knowledge: '2026.10.17.2',
  parsers: { toolboxCommit: '6c37e3dac38e', toolboxVersion: '1.0.0', gameVersion: '2.48' },
};

const sceneOf = (id = 'mid-session', characterIndex: number | null = 2): Scene => {
  const result = fixture(id);
  const state = stateFor(result);
  for (const c of state.characters) Object.assign(c, { class: 'Squire', level: 85 });
  return { state, result, characterIndex, screen: 'character', expectedReturnSeconds: 7200, now: Date.now() };
};

const wrongAdvice = (scene: Scene): ReportSource => {
  const c = scene.result?.characters.find((x) => x.index === 2);
  return {
    outputKind: 'verdict',
    entryIds: ['afk.check.weak-map'],
    detectorIds: ['afk/weak-map'],
    fields: ['characters[*].afkType', 'characters[2].level'],
    text: `${c?.name} dies on this map before you return`,
    stale: false,
    contested: true,
    values: { killsPerHour: 1234.5678, survives: false, map: 'w2_bandit_bob' },
  };
};

const draftOf = (scene: Scene, over: Partial<Draft> = {}): Draft => ({
  clientId: crypto.randomUUID(),
  type: 'wrong',
  text: { whenIm: '', iWant: 'the food warning to count my equipped food', soThat: '', example: '' },
  report: buildReport(wrongAdvice(scene), namedCharacters(scene), accountNames(scene), true),
  attach: null,
  characterIndex: 2,
  screen: 'character',
  createdAt: Date.now(),
  ...over,
});

describe('US-3 the name scrub (FR-6)', () => {
  it('replaces whole-word names, any case, Unicode-aware, longest first', () => {
    expect(scrubNames('Ann and Anna went', ['Ann', 'Anna'])).toBe('[character] and [character] went');
    expect(scrubNames('zoë is my wizard, not Zoëlla', ['Zoë'])).toBe('[character] is my wizard, not Zoëlla');
    expect(scrubNames('Cedar_alt and Cedar.', ['Cedar'])).toBe('Cedar_alt and [character].');
    expect(scrubNames('a+b (x) ab', ['a+b', '(x)'])).toBe('[character] [character] ab');
  });

  it('renders advice anonymously as class and level (FR-9)', () => {
    const chars = [{ name: 'Grumbo', classLabel: 'Squire', level: 85 }];
    expect(anonymize('Grumbo dies before you return', chars)).toBe('Squire lv 85 dies before you return');
  });

  it('no character name in the context for any fixture, screen and output kind (property)', () => {
    const dir = path.resolve(import.meta.dirname, '../../../packages/engine/test/now/fixtures');
    const kinds = ['next-action', 'purpose', 'higher-leverage', 'spend-line', 'verdict', 'goal'] as const;
    const screens = ['now', 'character', 'account', 'suggestions', 'settings', 'other'] as const;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const result = fixture(file.replace(/\.json$/, ''));
      const scene: Scene = { ...sceneOf(), result, state: stateFor(result) };
      const names = accountNames(scene);
      for (const c of result.characters) {
        for (const kind of kinds) {
          const src: ReportSource = {
            outputKind: kind,
            entryIds: ['afk.check.weak-map'],
            fields: ['characters[*].afkType'],
            text: `${names.join(' and ')} should swap with ${c.name.toUpperCase()}`,
            stale: false,
            contested: false,
          };
          for (const screen of screens) {
            const ctx = buildContext(
              { ...scene, characterIndex: c.index, screen },
              BUILD,
              buildReport(src, namedCharacters(scene), names, true),
            );
            const json = JSON.stringify(ctx).toLowerCase();
            for (const n of names) expect(json).not.toContain(n.toLowerCase());
          }
        }
      }
    }
  });
});

describe('US-2 Report this context (FR-9, FR-10)', () => {
  it('carries the output kind, ids, field patterns, flags and the anonymous text', () => {
    const scene = sceneOf();
    const r = buildReport(wrongAdvice(scene), namedCharacters(scene), accountNames(scene), false);
    expect(r).toEqual({
      outputKind: 'verdict-blocker',
      renderedText: expect.stringMatching(/^\w+ lv \d+ dies on this map/),
      entryIds: ['afk.check.weak-map'],
      detectorIds: ['afk/weak-map'],
      fieldPaths: ['characters[*].afkType', 'characters[2].level'],
      stale: false,
      contested: true,
    });
  });

  it('maps a Higher-leverage line with its option id', () => {
    const scene = sceneOf();
    const r = buildReport(
      { ...wrongAdvice(scene), outputKind: 'higher-leverage', optionId: 'move:2:w2.bandit-bob' },
      [],
      [],
      false,
    );
    expect(r?.outputKind).toBe('higher-leverage');
    expect(r?.optionId).toBe('move:2:w2.bandit-bob');
  });

  it('"Attach the numbers" is ticked by default for Something\'s wrong only (RT-16)', () => {
    expect(attachByDefault('wrong')).toBe(true);
    expect(attachByDefault('idea')).toBe(false);
    expect(attachByDefault('confusing')).toBe(false);
  });

  it('values are sent unrounded when ticked, and not at all when unticked', () => {
    const scene = sceneOf();
    const draft = draftOf(scene);
    const on = requestPreview(draft, true, scene, BUILD);
    expect(on.context.report?.values).toEqual({
      killsPerHour: 1234.5678,
      survives: false,
      map: 'w2_bandit_bob',
    });
    const off = requestPreview(draft, false, scene, BUILD);
    expect(off.context.report).toBeDefined();
    expect('values' in (off.context.report ?? {})).toBe(false);
  });

  it('drops a string value that is not an enum-like id or that holds a name', () => {
    const scene = sceneOf();
    const name = accountNames(scene)[0] ?? 'x';
    const r = buildReport(
      { ...wrongAdvice(scene), values: { a: 'Free text', b: name.toLowerCase(), c: 3 } },
      [],
      accountNames(scene),
      true,
    );
    expect(r?.values).toEqual({ c: 3 });
  });
});

describe('the request passes the Worker schema (TR-1, TR-3)', () => {
  it('for a report, a plain suggestion and a broken parse', () => {
    const scene = sceneOf();
    const cases: SuggestionRequest[] = [
      { ...requestPreview(draftOf(scene), true, scene, BUILD), turnstileToken: 't', proof: 'a.b.c' },
      {
        ...requestPreview(draftOf(scene, { type: 'idea', report: null }), false, scene, BUILD),
        turnstileToken: 't',
        proof: 'a.b.c',
      },
      {
        ...requestPreview(
          draftOf(scene, { report: null, screen: 'other', characterIndex: null }),
          false,
          { ...scene, state: null, result: null, screen: 'other' },
          { ...BUILD, channel: 'preview', pr: 91, knowledge: '2026.10.17.2+pr91' },
        ),
        turnstileToken: 't',
        proof: 'a.b.c',
      },
    ];
    for (const req of cases) expect(validateSuggestionRequest(req)).toEqual({ ok: true, value: req });
    expect(cases[2]?.context).toMatchObject({ gameBuild: null, stage: null, screen: 'other' });
  });

  it('the context has the build, the save build, Stage, class and level, and the Verdict', () => {
    const scene = sceneOf();
    const ctx = requestPreview(draftOf(scene), true, scene, BUILD).context;
    expect(ctx.build).toEqual({
      app: BUILD.app,
      commit: BUILD.commit,
      channel: 'production',
      knowledge: BUILD.knowledge,
      parsers: BUILD.parsers,
    });
    expect(ctx.gameBuild).toBe(142);
    expect(ctx.stage).toBe(scene.result?.stage.id);
    expect(ctx.character).toMatchObject({ class: 'Squire', level: 85 });
    expect(ctx.expectedReturnHours).toBe(2);
    expect(ctx.saveAgeSeconds).toBeGreaterThanOrEqual(0);
  });
});

const proofOf = (p: string | null) => vi.fn(async () => p);
const okFetch = (
  body: unknown = { number: 120, url: 'https://github.com/YassSoliman/idleon-forge/issues/120' },
) => vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status: 201 }));

describe('sending (FR-11, FR-12, FR-14)', () => {
  it('US-1: posts once, scrubbed, with the proof and token, and remembers the sent item', async () => {
    const scene = sceneOf();
    const store = createSuggestionsStore(null);
    const fetch = okFetch();
    const client: ClientOptions = { baseUrl: 'https://w.example', dryRun: false, fetch };
    const name = accountNames(scene)[0] as string;
    const draft = draftOf(scene, {
      text: { whenIm: '', iWant: `my ${name} to stop dying`, soThat: '', example: name },
    });
    await store.set('draft', draft);
    const r = await sendSuggestion(
      { client, build: BUILD, store, getProof: proofOf('a.b.c'), scene },
      draft,
      true,
      'tok',
    );
    expect(r).toEqual({
      kind: 'sent',
      number: 120,
      url: 'https://github.com/YassSoliman/idleon-forge/issues/120',
      dryRun: false,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://w.example/v1/suggestions');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Suggestions-Dry-Run']).toBeUndefined();
    const body = String(init.body);
    for (const n of accountNames(scene)) expect(body.toLowerCase()).not.toContain(n.toLowerCase());
    const sent = JSON.parse(body) as SuggestionRequest;
    expect(sent.text.iWant).toBe('my [character] to stop dying');
    expect(sent.proof).toBe('a.b.c');
    expect(sent.turnstileToken).toBe('tok');
    expect(sent.clientId).toBe(draft.clientId);
    expect(await store.get('draft')).toBeNull();
    expect((await store.get('sent')).map((s) => s.number)).toEqual([120]);
  });

  it('US-4: with no proof nothing is posted and it waits in the outbox', async () => {
    const scene = sceneOf();
    const store = createSuggestionsStore(null);
    const fetch = okFetch();
    const draft = draftOf(scene);
    await store.set('draft', draft);
    const r = await sendSuggestion(
      {
        client: { baseUrl: 'https://w.example', dryRun: false, fetch },
        build: BUILD,
        store,
        getProof: proofOf(null),
        scene,
      },
      draft,
      true,
      null,
    );
    expect(r).toEqual({ kind: 'outbox', message: 'Saved. You can send it within the hour.' });
    expect(fetch).not.toHaveBeenCalled();
    expect((await store.get('outbox')).map((o) => o.clientId)).toEqual([draft.clientId]);
    expect(await store.get('draft')).toBeNull();
  });

  it('proof_too_old, proof_unknown_key and live_token move it to the outbox (FR-15)', async () => {
    for (const code of ['proof_too_old', 'proof_unknown_key', 'live_token']) {
      const scene = sceneOf();
      const store = createSuggestionsStore(null);
      const fetch = vi.fn(async () => new Response(JSON.stringify({ error: code }), { status: 401 }));
      const r = await sendSuggestion(
        {
          client: { baseUrl: 'https://w.example', dryRun: false, fetch },
          build: BUILD,
          store,
          getProof: proofOf('a.b.c'),
          scene,
        },
        draftOf(scene),
        true,
        'tok',
      );
      expect(r.kind).toBe('outbox');
      expect(await store.get('outbox')).toHaveLength(1);
    }
  });

  it('US-7: a retry sends the same clientId; US-6: a refusal keeps the draft', async () => {
    const scene = sceneOf();
    const store = createSuggestionsStore(null);
    const draft = draftOf(scene);
    await store.set('draft', draft);
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'daily_limit', retryAfterSeconds: 3 * 3600 }), { status: 429 }),
      );
    const deps = {
      client: { baseUrl: 'https://w.example', dryRun: false, fetch },
      build: BUILD,
      store,
      getProof: proofOf('a.b.c'),
      scene,
    };
    const first = await sendSuggestion(deps, draft, true, 'tok1');
    expect(first).toEqual({ kind: 'error', message: "Can't reach GitHub right now, your draft is kept." });
    const second = await sendSuggestion(deps, draft, true, 'tok2');
    expect(second).toEqual({
      kind: 'error',
      message: "You've sent 5 in the last 24 hours. You can send again in about 3 hours.",
    });
    const ids = fetch.mock.calls.map(
      (c) => (JSON.parse(String((c[1] as RequestInit).body)) as SuggestionRequest).clientId,
    );
    expect(ids).toEqual([draft.clientId, draft.clientId]);
    expect((await store.get('draft'))?.clientId).toBe(draft.clientId);
  });

  it('a non-production build asks the Worker for a dry run, and a dry run is not remembered as sent', async () => {
    const scene = sceneOf();
    const store = createSuggestionsStore(null);
    const fetch = okFetch({ number: 0, url: null, dryRun: true });
    const r = await sendSuggestion(
      {
        client: { baseUrl: 'https://w.example', dryRun: true, fetch },
        build: BUILD,
        store,
        getProof: proofOf('a.b.c'),
        scene,
      },
      draftOf(scene),
      true,
      'tok',
    );
    expect(r).toEqual({ kind: 'sent', number: 0, url: null, dryRun: true });
    expect(
      ((fetch.mock.calls[0] as [string, RequestInit])[1].headers as Record<string, string>)[
        'X-Suggestions-Dry-Run'
      ],
    ).toBe('1');
    expect(await store.get('sent')).toEqual([]);
  });

  it('FR-6: refuses to send when the character names did not load', async () => {
    const scene = sceneOf();
    const state = {
      ...scene.state,
      diagnostics: { failedSideReads: ['charNames'] },
    } as unknown as AccountState;
    const fetch = okFetch();
    const r = await sendSuggestion(
      {
        client: { baseUrl: 'https://w.example', dryRun: false, fetch },
        build: BUILD,
        store: createSuggestionsStore(null),
        getProof: proofOf('a.b.c'),
        scene: { ...scene, state },
      },
      draftOf(scene),
      true,
      'tok',
    );
    expect(r).toEqual({
      kind: 'error',
      message: "Can't check your text for character names right now. Try again in a moment.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('FR-15 messages', () => {
  const m = (error: string, extra: Record<string, unknown> = {}) =>
    messageFor({ ok: false, error: { error: error as never, ...extra } });
  it('says what happened in plain words', () => {
    expect(m('rate_limited')).toBe('Wait a minute before sending again.');
    expect(m('paused')).toBe('Suggestions are paused for now, your draft is kept.');
    expect(m('proof_invalid')).toBe('Sign in again to send.');
    expect(m('provider_not_allowed')).toBe('Sign in with Google or Steam to send suggestions.');
    expect(m('not_yours')).toBe("This isn't one of your suggestions.");
    expect(m('already_answered')).toBe("You've already answered this question.");
    expect(m('github_unavailable')).toBe("Can't reach GitHub right now, your draft is kept.");
    expect(m('invalid', { field: 'text.example' })).toBe('Game example is too long.');
    expect(m('daily_limit', { retryAfterSeconds: 3000 })).toMatch(/in about 1 hour\.$/);
    expect(messageFor({ ok: false, error: null, offline: true })).toBe("You're offline, it'll stay here.");
  });
});

describe('build config and the paste-mode fallback', () => {
  it('reads the Worker URL and site key; anything but production is a dry run', () => {
    const env = {
      VITE_SUGGESTIONS_URL: 'https://activeon-suggestions.idleon.workers.dev/',
      VITE_TURNSTILE_SITE_KEY: '0x4AAAAAAFZh5dFIi0_6HO68',
    };
    expect(readSuggestionsConfig(env, { channel: 'production' })).toEqual({
      baseUrl: 'https://activeon-suggestions.idleon.workers.dev',
      siteKey: '0x4AAAAAAFZh5dFIi0_6HO68',
      dryRun: false,
    });
    expect(readSuggestionsConfig(env, { channel: 'preview' }).dryRun).toBe(true);
    expect(readSuggestionsConfig(env, { channel: 'local' }).dryRun).toBe(true);
    expect(readSuggestionsConfig({}, { channel: 'production' })).toEqual({
      baseUrl: null,
      siteKey: null,
      dryRun: false,
    });
    expect(
      readSuggestionsConfig({ VITE_SUGGESTIONS_URL: 'http://evil.example' }, { channel: 'production' })
        .baseUrl,
    ).toBeNull();
  });

  it('the GitHub-issue fallback carries the scrubbed text and the same context, no names', () => {
    const scene = sceneOf();
    const name = accountNames(scene)[0] as string;
    const p = requestPreview(
      draftOf(scene, { text: { whenIm: name, iWant: `${name} should not starve`, soThat: '', example: '' } }),
      true,
      scene,
      BUILD,
    );
    const url = new URL(fallbackIssueUrl('wrong', p.text, p.context));
    expect(url.origin + url.pathname).toBe('https://github.com/YassSoliman/idleon-forge/issues/new');
    expect(url.searchParams.get('title')).toBe("[Something's wrong] [character] should not starve");
    const body = url.searchParams.get('body') ?? '';
    expect(body).toContain('"outputKind": "verdict-blocker"');
    for (const n of accountNames(scene)) expect(body).not.toContain(n);
  });
});
