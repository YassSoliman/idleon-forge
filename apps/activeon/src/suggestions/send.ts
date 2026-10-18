// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Sending one Suggestion (M13 FR-11, FR-12, FR-14, TR-9): rebuild the context from the current save,
// scrub, check against the Worker's own schema, then post with the proof and a fresh Turnstile token.
// Without a proof it goes to the outbox; nothing is ever sent without the player's tap. The same
// `clientId` is reused on every retry, so the Worker never files a second issue for one draft.
import type { BuildInfo } from '@idleon-forge/release';
import type { MySuggestion, SuggestionRequest } from '@idleon-forge/suggestions-worker/contract';
import { validateSuggestionRequest } from '@idleon-forge/suggestions-worker/validate';
import { type ClientOptions, createSuggestion, isOutboxError, messageFor, SAVED_FOR_LATER } from './client';
import { accountNames, buildContext, namesUnavailable, type Scene, scrubText } from './context';
import { containsName } from './scrub';
import type { Draft, OutboxItem, SuggestionsStore } from './store';

export type SendResult =
  | { kind: 'sent'; number: number; url: string | null; dryRun: boolean }
  | { kind: 'outbox'; message: string }
  | { kind: 'error'; message: string };

export interface SendDeps {
  client: ClientOptions;
  build: BuildInfo;
  store: SuggestionsStore;
  getProof(): Promise<string | null>;
  scene: Scene;
  now?: () => number;
}

/** The request body without the two tokens: exactly what the preview shows (FR-4). */
export function requestPreview(
  draft: Draft,
  attachValues: boolean,
  scene: Scene,
  build: BuildInfo,
): Omit<SuggestionRequest, 'turnstileToken' | 'proof'> {
  const names = accountNames(scene);
  let report = draft.report;
  if (report && !attachValues && report.values) {
    const { values: _dropped, ...rest } = report;
    report = rest;
  }
  return {
    clientId: draft.clientId,
    type: draft.type,
    text: scrubText(draft.text, names),
    context: buildContext(
      { ...scene, characterIndex: draft.characterIndex, screen: draft.screen },
      build,
      report,
    ),
  };
}

async function toOutbox(store: SuggestionsStore, draft: Draft, attachValues: boolean, now: number) {
  const outbox = (await store.get('outbox')).filter((o) => o.clientId !== draft.clientId);
  const item: OutboxItem = { ...draft, attachValues, savedAt: now };
  await store.set('outbox', [...outbox, item]);
  const current = await store.get('draft');
  if (current?.clientId === draft.clientId) await store.set('draft', null);
}

async function forget(store: SuggestionsStore, clientId: string) {
  const current = await store.get('draft');
  if (current?.clientId === clientId) await store.set('draft', null);
  const outbox = await store.get('outbox');
  if (outbox.some((o) => o.clientId === clientId))
    await store.set(
      'outbox',
      outbox.filter((o) => o.clientId !== clientId),
    );
}

/** Runs `fn` holding the cross-tab outbox lock, so only one tab sends (§6 Multiple tabs). */
export async function withOutboxLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  if (!locks?.request) return fn();
  return locks.request('activeon-outbox', () => fn()) as Promise<T>;
}

/**
 * Sends one draft or outbox item. `token` is a fresh Turnstile token; with no proof yet it may be null,
 * since the Suggestion only goes to the outbox then.
 */
export async function sendSuggestion(
  deps: SendDeps,
  draft: Draft,
  attachValues: boolean,
  token: string | null,
): Promise<SendResult> {
  const now = (deps.now ?? Date.now)();
  if (namesUnavailable(deps.scene.state))
    return {
      kind: 'error',
      message: "Can't check your text for character names right now. Try again in a moment.",
    };
  const preview = requestPreview(draft, attachValues, deps.scene, deps.build);
  const free = [...Object.values(preview.text), preview.context.report?.renderedText ?? ''].join('\n');
  if (containsName(free, accountNames(deps.scene)))
    return {
      kind: 'error',
      message: "Can't check your text for character names right now. Try again in a moment.",
    };

  const proof = await deps.getProof();
  if (!proof) {
    await toOutbox(deps.store, draft, attachValues, now);
    return { kind: 'outbox', message: SAVED_FOR_LATER };
  }
  if (!token) return { kind: 'error', message: "Couldn't confirm you're human, try again." };
  const req: SuggestionRequest = { ...preview, turnstileToken: token, proof };
  const v = validateSuggestionRequest(req);
  if (!v.ok)
    return { kind: 'error', message: messageFor({ ok: false, error: { error: 'invalid', field: v.field } }) };

  const reply = await withOutboxLock(() => createSuggestion(deps.client, v.value));
  if (reply.ok) {
    await forget(deps.store, draft.clientId);
    const dryRun = reply.body.dryRun === true;
    if (!dryRun && reply.body.url) {
      const sent: MySuggestion = {
        number: reply.body.number,
        url: reply.body.url,
        type: draft.type,
        iWant: preview.text.iWant,
        createdAt: new Date(now).toISOString(),
        status: 'received',
      };
      const list = (await deps.store.get('sent')).filter((s) => s.number !== sent.number);
      await deps.store.set('sent', [sent, ...list]);
    }
    return { kind: 'sent', number: reply.body.number, url: reply.body.url, dryRun };
  }
  if (isOutboxError(reply.error)) {
    await toOutbox(deps.store, draft, attachValues, now);
    return { kind: 'outbox', message: SAVED_FOR_LATER };
  }
  return { kind: 'error', message: messageFor(reply) };
}
