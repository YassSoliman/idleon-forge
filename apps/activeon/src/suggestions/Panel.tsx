// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The lazy Suggestions chunk (M13 TR-15): the Suggest form (FR-1 to FR-12) and Your suggestions
// (FR-16 to FR-19, FR-26 to FR-28), in a sheet that keeps the Now screen underneath.
// M21 FR-N12 (layout only; every word and the scrub stay M13's): `flows.suggest-form` Kind picker first
// (three big tiles, then one question at a time), `flows.report-form` Pick what's wrong (four chips and
// the optional line), the Turnstile frame (G9), and Your suggestions as the owner's split: the 3 newest
// as notes pinned to a quest board with their stamps, the rest as the plain list (D-17).

import type {
  MySuggestion,
  SuggestionStatus,
  SuggestionText,
  SuggestionType,
} from '@idleon-forge/suggestions-worker/contract';
import { TEXT_LIMITS } from '@idleon-forge/suggestions-worker/contract';
import { validateDetailsRequest } from '@idleon-forge/suggestions-worker/validate';
import type { ProofRing } from '@idleon-forge/sync';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ArtName } from '../design/art/names';
import { PixelArt } from '../design/art/PixelArt';
import { ago, clockAt, localOffsetMinutes } from '../design/format';
import { ModalSheet } from '../now/chrome/ModalSheet';
import { buildInfo } from '../now/release';
import { fallbackIssueUrl } from '../now/report';
import {
  addDetails,
  type ClientOptions,
  isOutboxError,
  listMine,
  messageFor,
  SAVED_FOR_LATER,
} from './client';
import { isConfigured, type SuggestionsConfig } from './config';
import {
  accountNames,
  attachByDefault,
  buildReport,
  codePoints,
  EMPTY_TEXT,
  namedCharacters,
  namesUnavailable,
  type Scene,
  textProblem,
} from './context';
import type { OpenRequest, PanelView, Toast } from './SuggestionsProvider';
import { scrubNames } from './scrub';
import { requestPreview, type SendDeps, sendSuggestion, withOutboxLock } from './send';
import { type Draft, newClientId, type OutboxItem, type SuggestionsStore } from './store';
import { useTurnstile } from './turnstile';
import './suggestions.css';

/** FR-11: "Sent. Track it in Your suggestions." with a link to the issue. */
const SENT = (href: string | null): Toast => ({ text: 'Sent. Track it in', list: true, href });

export const NOTICE = "Suggestions are posted publicly on GitHub. Don't include anything private.";
export const SIGN_IN = 'Sign in to send suggestions';
export const NAMES_UNAVAILABLE =
  "Can't check your text for character names right now. Try again in a moment.";

export const TYPE_LABEL: Record<SuggestionType, string> = {
  idea: 'Idea',
  wrong: "Something's wrong",
  confusing: 'Confusing',
};

const PLACEHOLDER: Record<SuggestionType, SuggestionText> = {
  idea: {
    whenIm: 'e.g. coming back after a long AFK',
    iWant: 'e.g. to see which character to open first',
    soThat: 'e.g. I spend less time clicking around',
    example: 'e.g. my W2 fighter had full inventory but the Roster put it last',
  },
  wrong: {
    whenIm: 'e.g. checking my Squire before going AFK',
    iWant: 'e.g. the food warning to use the food I actually have equipped',
    soThat: 'e.g. I don’t restock for nothing',
    example: 'e.g. it said food runs out in 2h, but I had 3 stacks',
  },
  confusing: {
    whenIm: 'e.g. reading the Spend Plan',
    iWant: 'e.g. to understand what "carry forward" means',
    soThat: 'e.g. I know whether to buy now or wait',
    example: 'e.g. the line said "hold 2.1M for the next stamp"',
  },
};

export const STATUS_LABEL: Record<SuggestionStatus, string> = {
  received: 'Received',
  looking: 'Being looked at',
  decision: 'Waiting on a decision',
  info: 'Needs your answer',
  planned: 'Planned',
  done: 'Done',
  wontdo: "Won't do",
};

const FIELDS: { key: keyof SuggestionText; label: string; rows: number }[] = [
  { key: 'whenIm', label: "When I'm…", rows: 1 },
  { key: 'iWant', label: 'I want…', rows: 3 },
  { key: 'soThat', label: 'So that…', rows: 2 },
  { key: 'example', label: 'Game example (optional)', rows: 3 },
];

export interface PanelProps {
  panel: PanelView;
  setPanel: Dispatch<SetStateAction<PanelView | null>>;
  config: SuggestionsConfig;
  signedIn: boolean;
  proof: ProofRing;
  scene(): Scene;
  store: SuggestionsStore;
  onToast(t: Toast): void;
}

/** When it was filed, as an age ("3d 4h ago"): one time language (FR-F6). */
const dateText = (iso: string) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? '' : ago(t, Date.now());
};
const timeText = (at: number) => clockAt(at, localOffsetMinutes(at));

/** The kind tiles' own art (DS-12: what kind). */
const KIND_ART: Record<SuggestionType, ArtName> = {
  idea: 'flows-lightbulb',
  wrong: 'flows-cracked-gear',
  confusing: 'flows-question-cloud',
};

/** `flows.report-form` Pick what's wrong: four chips; a pick starts "I want…" with its line. */
export const WRONG_CHIPS: { label: string; iWant: string }[] = [
  { label: 'Wrong number', iWant: 'the number on this line to match my game' },
  { label: 'Wrong advice', iWant: 'advice on this line that fits my account' },
  { label: 'Confusing words', iWant: 'this line in words I can follow' },
  { label: 'Already done', iWant: 'this line to see that I already did it' },
];

/** G9: Cloudflare's widget is a third-party frame we can't restyle; one line names it, its height is kept. */
export const HUMAN_CHECK = "Quick check that you're a person (Cloudflare)";

function useClient(config: SuggestionsConfig): ClientOptions | null {
  return useMemo(
    () => (config.baseUrl ? { baseUrl: config.baseUrl, dryRun: config.dryRun } : null),
    [config.baseUrl, config.dryRun],
  );
}

/** Whether a proof exists now; flips to true when the ring gets one (FR-12). */
function useProofReady(proof: ProofRing, signedIn: boolean): boolean | null {
  const [ready, setReady] = useState<boolean | null>(null);
  useEffect(() => {
    if (!signedIn) return setReady(false);
    let gone = false;
    void proof.getSignInProof().then((p) => !gone && setReady(p !== null));
    const off = proof.onProofReady(() => !gone && setReady(true));
    return () => {
      gone = true;
      off();
    };
  }, [proof, signedIn]);
  return ready;
}

export default function Panel(props: PanelProps) {
  const { panel, setPanel } = props;
  const close = useCallback(() => setPanel(null), [setPanel]);
  const title =
    panel.view === 'list'
      ? 'Your suggestions'
      : panel.request.kind === 'report'
        ? 'Report this line'
        : 'Suggest';
  return (
    <ModalSheet open title={title} onClose={close}>
      <div className="sg-panel">
        <div className="sg-head-links">
          {panel.view === 'form' ? (
            <button
              type="button"
              className="n-link-btn"
              onClick={() => setPanel({ view: 'list', sendNow: null })}
            >
              Your suggestions
            </button>
          ) : (
            <button
              type="button"
              className="n-link-btn"
              onClick={() =>
                setPanel({
                  view: 'form',
                  request: { kind: 'suggest', type: 'idea', screen: 'suggestions' },
                })
              }
            >
              Suggest
            </button>
          )}
        </div>
        {panel.view === 'form' ? (
          <SuggestForm {...props} request={panel.request} close={close} />
        ) : (
          <YourSuggestions {...props} sendNow={panel.sendNow} />
        )}
      </div>
    </ModalSheet>
  );
}

// ---- the form ----

function draftFor(request: OpenRequest, scene: Scene): Draft {
  const names = accountNames(scene);
  if (request.kind === 'report') {
    return {
      clientId: newClientId(),
      type: 'wrong',
      text: { ...EMPTY_TEXT },
      report: buildReport(request.source, namedCharacters(scene), names, true),
      attach: null,
      characterIndex: request.characterIndex,
      screen: request.screen,
      createdAt: Date.now(),
    };
  }
  return {
    clientId: newClientId(),
    type: request.type ?? 'idea',
    text: { ...EMPTY_TEXT },
    report: null,
    attach: null,
    characterIndex: request.characterIndex ?? null,
    screen: request.screen ?? 'now',
    createdAt: Date.now(),
  };
}

const isEmpty = (d: Draft) => Object.values(d.text).every((v) => v.trim() === '');
const sameReport = (a: Draft['report'], b: Draft['report']) =>
  (a?.renderedText ?? null) === (b?.renderedText ?? null) &&
  (a?.entryIds ?? []).join() === (b?.entryIds ?? []).join();

function SuggestForm(props: PanelProps & { request: OpenRequest; close(): void }) {
  const { request, store, config, signedIn } = props;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [conflict, setConflict] = useState<{ kept: Draft; fresh: Draft } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState(0);
  const client = useClient(config);
  const configured = isConfigured(config) && client !== null;
  const canSend = configured && signedIn;
  const proofReady = useProofReady(props.proof, signedIn);
  const turnstile = useTurnstile(canSend && proofReady ? config.siteKey : null);
  const scene = props.scene();
  const noNames = namesUnavailable(scene.state);
  const sceneOf = props.scene;

  // FR-8: the draft survives closing and reloading. A Report this on other advice asks first.
  useEffect(() => {
    let gone = false;
    void store.get('draft').then((saved) => {
      if (gone) return;
      const fresh = draftFor(request, sceneOf());
      if (!saved) return setDraft(fresh);
      if (request.kind === 'report' && !sameReport(saved.report, fresh.report)) {
        if (isEmpty(saved)) return setDraft(fresh);
        return setConflict({ kept: saved, fresh });
      }
      setDraft(saved);
    });
    return () => {
      gone = true;
    };
  }, [request, store, sceneOf]);

  const update = (next: Draft) => {
    setDraft(next);
    setError(null);
    void store.set('draft', next);
  };

  if (conflict) {
    return (
      <div className="sg-body">
        <p>You have a suggestion you haven't sent yet.</p>
        <div className="sg-actions">
          <button
            type="button"
            className="primary"
            data-autofocus
            onClick={() => {
              setDraft(conflict.kept);
              setConflict(null);
            }}
          >
            Keep editing it
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              update(conflict.fresh);
              setConflict(null);
            }}
          >
            Discard it and report this
          </button>
        </div>
      </div>
    );
  }
  if (!draft) return <p className="small muted">Loading…</p>;

  const attach = draft.report?.values ? (draft.attach ?? attachByDefault(draft.type)) : false;
  const preview = requestPreview(draft, attach, scene, buildInfo);
  const problem = textProblem(draft.text);
  const iWantShort = codePoints(draft.text.iWant.trim()) < TEXT_LIMITS.iWant.min;
  const needsToken = proofReady === true;
  const ready =
    canSend && !noNames && problem === null && !sending && (!needsToken || turnstile.token !== null);

  const send = async () => {
    if (!client || !ready) return;
    setSending(true);
    setError(null);
    const deps: SendDeps = {
      client,
      build: buildInfo,
      store,
      getProof: () => props.proof.getSignInProof(),
      scene: props.scene(),
    };
    const token = needsToken ? turnstile.take() : null;
    const r = await sendSuggestion(deps, draft, attach, token);
    setSending(false);
    if (r.kind === 'error') return setError(r.message);
    props.close();
    if (r.kind === 'outbox') return props.onToast({ text: r.message });
    if (r.dryRun) return props.onToast({ text: 'Preview: not sent.' });
    props.onToast(SENT(r.url));
  };

  return (
    <form
      className="sg-body"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      <fieldset className="sg-types sg-kinds">
        <legend className="sg-q">What kind?</legend>
        {(['idea', 'wrong', 'confusing'] as const).map((t, i) => (
          <label key={t} className={`sg-kind${draft.type === t ? ' on' : ''}`}>
            <input
              type="radio"
              className="sr-only"
              name="sg-type"
              value={t}
              checked={draft.type === t}
              data-autofocus={i === 0 ? true : undefined}
              onChange={() => update({ ...draft, type: t })}
            />
            <PixelArt name={KIND_ART[t]} scale={2} decorative />
            <span>{TYPE_LABEL[t]}</span>
          </label>
        ))}
      </fieldset>

      {draft.report ? (
        <div className="sg-report small">
          <p className="muted">About this advice:</p>
          <p className="sg-quote">{draft.report.renderedText}</p>
          <fieldset className="sg-chips">
            <legend className="sr-only">What's wrong</legend>
            {WRONG_CHIPS.map((c) => (
              <button
                key={c.label}
                type="button"
                className="a-chip"
                aria-pressed={draft.text.iWant === c.iWant}
                onClick={() => update({ ...draft, text: { ...draft.text, iWant: c.iWant } })}
              >
                <span>{c.label}</span>
              </button>
            ))}
          </fieldset>
          {draft.report.values ? (
            <label className="sg-check">
              <input
                type="checkbox"
                checked={attach}
                onChange={(e) => update({ ...draft, attach: e.target.checked })}
              />
              Attach the numbers this advice used
            </label>
          ) : null}
        </div>
      ) : null}

      <p className="sg-step-count n-muted" aria-live="polite">
        Question {step + 1} of {FIELDS.length}
      </p>
      {FIELDS.map((f, n) => {
        const max = TEXT_LIMITS[f.key].max;
        const left = max - codePoints(draft.text[f.key]);
        const id = `sg-${f.key}`;
        return (
          <div key={f.key} className={`sg-field${n === step ? ' is-current' : ' is-other'}`}>
            <label htmlFor={id}>
              {f.label}
              {f.key === 'iWant' ? <span className="muted small"> (required)</span> : null}
            </label>
            <textarea
              id={id}
              rows={f.rows}
              value={draft.text[f.key]}
              placeholder={PLACEHOLDER[draft.type][f.key]}
              aria-describedby={`${id}-count`}
              aria-invalid={left < 0 || undefined}
              onChange={(e) => update({ ...draft, text: { ...draft.text, [f.key]: e.target.value } })}
            />
            <p id={`${id}-count`} className={`sg-count small ${left < 0 ? 'error' : 'muted'}`}>
              {f.key === 'iWant' && iWantShort
                ? `At least ${TEXT_LIMITS.iWant.min} characters · ${left} left`
                : `${left} left`}
            </p>
          </div>
        );
      })}

      <div className="sg-stepper">
        <button
          type="button"
          className="a-btn a-btn--plain"
          disabled={step === 0}
          onClick={() => setStep((n) => Math.max(0, n - 1))}
        >
          <span>Back</span>
        </button>
        <button
          type="button"
          className="a-btn a-btn--quiet"
          disabled={step === FIELDS.length - 1}
          onClick={() => setStep((n) => Math.min(FIELDS.length - 1, n + 1))}
        >
          <span>Next question</span>
        </button>
      </div>

      <details className="sg-preview small">
        <summary>What gets sent</summary>
        <p className="muted">
          Exactly this, plus a one-time human check and an expired sign-in token that proves you're signed in
          (it can't open your save). Character names become [character].
        </p>
        <pre>{JSON.stringify(preview, null, 2)}</pre>
      </details>

      {!signedIn ? (
        <div className="sg-off small">
          <p>{SIGN_IN}.</p>
          <p>
            Or{' '}
            <a
              href={fallbackIssueUrl(draft.type, preview.text, preview.context)}
              target="_blank"
              rel="noopener noreferrer"
            >
              open it as a GitHub issue
            </a>{' '}
            (needs a GitHub account).
          </p>
        </div>
      ) : !configured ? (
        <div className="sg-off small">
          <p>In-app suggestions aren't set up in this build.</p>
          <p>
            <a
              href={fallbackIssueUrl(draft.type, preview.text, preview.context)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open it as a GitHub issue
            </a>{' '}
            (needs a GitHub account).
          </p>
        </div>
      ) : null}
      {noNames ? <p className="error">{NAMES_UNAVAILABLE}</p> : null}
      {canSend && needsToken ? (
        <div className="sg-turnstile-frame">
          <p className="n-small">{HUMAN_CHECK}</p>
          <div className="sg-turnstile" ref={turnstile.ref} />
        </div>
      ) : null}
      {canSend && needsToken && turnstile.state === 'blocked' ? (
        <p className="error">Couldn't load the human check. Allow challenges.cloudflare.com and try again.</p>
      ) : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <p className="sg-notice small">{NOTICE}</p>
      <div className="sg-actions">
        <button type="submit" className="primary" disabled={!ready}>
          {sending ? 'Sending…' : 'Send'}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            void store.set('draft', null);
            props.close();
          }}
        >
          Discard
        </button>
        {canSend && needsToken && !turnstile.token && turnstile.state !== 'blocked' ? (
          <span className="small muted">Checking you're human…</span>
        ) : null}
      </div>
    </form>
  );
}

// ---- Your suggestions ----

type ListState =
  | { status: 'loading' }
  | { status: 'live'; items: MySuggestion[] }
  | { status: 'cached'; items: MySuggestion[]; at: number | null; failed: boolean };

function merge(server: MySuggestion[], sent: MySuggestion[]): MySuggestion[] {
  const have = new Set(server.map((s) => s.number));
  return [...sent.filter((s) => !have.has(s.number)), ...server].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

function YourSuggestions(props: PanelProps & { sendNow: string | null }) {
  const { store, signedIn, config } = props;
  const client = useClient(config);
  const proofReady = useProofReady(props.proof, signedIn);
  const [list, setList] = useState<ListState>({ status: 'loading' });
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [sending, setSending] = useState<string | null>(props.sendNow);
  const [answered, setAnswered] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    let gone = false;
    const load = () => void store.get('outbox').then((o) => !gone && setOutbox(o));
    load();
    const off = store.subscribe(load);
    return () => {
      gone = true;
      off();
    };
  }, [store]);

  const refresh = useCallback(async () => {
    if (proofReady === null) return;
    const [cached, sent] = await Promise.all([store.get('mine'), store.get('sent')]);
    const proof = signedIn && client && proofReady ? await props.proof.getSignInProof() : null;
    if (!proof || !client) {
      setList({
        status: 'cached',
        items: merge(cached?.items ?? [], sent),
        at: cached?.at ?? null,
        failed: false,
      });
      return;
    }
    const reply = await listMine(client, proof);
    if (!reply.ok) {
      setList({
        status: 'cached',
        items: merge(cached?.items ?? [], sent),
        at: cached?.at ?? null,
        failed: true,
      });
      return;
    }
    const items = reply.body.items;
    await store.set('mine', { items, at: Date.now() });
    const have = new Set(items.map((i) => i.number));
    await store.set(
      'sent',
      sent.filter((s) => !have.has(s.number)),
    );
    setList({ status: 'live', items: merge(items, sent) });
  }, [store, signedIn, client, props.proof, proofReady]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!signedIn) {
    return (
      <div className="sg-body">
        <p>{SIGN_IN}.</p>
      </div>
    );
  }

  const items = list.status === 'loading' ? [] : list.items;
  return (
    <div className="sg-body">
      {outbox.length > 0 ? (
        <ul className="sg-list">
          {outbox.map((o) => (
            <li key={o.clientId} className="sg-item">
              <p className="sg-item-head small">
                <span className="sg-status">{proofReady ? 'Ready to send' : 'Waiting to send'}</span>
                <span className="muted">{TYPE_LABEL[o.type]}</span>
              </p>
              <p>{scrubNames(o.text.iWant, accountNames(props.scene()))}</p>
              {sending === o.clientId && proofReady ? (
                <OutboxSender
                  {...props}
                  item={o}
                  onDone={(msg) => {
                    setSending(null);
                    if (msg) props.onToast(msg);
                    void refresh();
                  }}
                />
              ) : (
                <div className="sg-actions">
                  {proofReady ? (
                    <button type="button" className="small-btn" onClick={() => setSending(o.clientId)}>
                      Send now
                    </button>
                  ) : (
                    <span className="small muted">You can send it within the hour.</span>
                  )}
                  <button
                    type="button"
                    className="ghost tiny"
                    onClick={() =>
                      void store.set(
                        'outbox',
                        outbox.filter((x) => x.clientId !== o.clientId),
                      )
                    }
                  >
                    Discard
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {list.status === 'loading' ? <p className="small muted">Loading…</p> : null}
      {list.status === 'cached' && list.failed ? <p className="small muted">Can't load right now.</p> : null}
      {list.status === 'cached' && !list.failed && list.at !== null ? (
        <p className="small muted">As of {timeText(list.at)}</p>
      ) : null}
      {list.status !== 'loading' && items.length === 0 && outbox.length === 0 ? (
        <p className="small muted">Nothing sent yet. What you send shows here, with what became of it.</p>
      ) : null}

      {items.length > 0 ? (
        <>
          <div className="sg-board-head">
            <PixelArt name="flows-notice-board" scale={2} decorative />
            <p className="n-muted">{items.length} filed</p>
          </div>
          <ul className="sg-notes">
            {items.slice(0, BOARD_NOTES).map((s) => (
              <li key={s.number} className={`sg-note st-${s.status}`}>
                <span className="sg-pin" aria-hidden="true" />
                <p className="sg-note-title">{s.iWant}</p>
                <p className="n-small n-muted">
                  {TYPE_LABEL[s.type]} · {dateText(s.createdAt)}
                </p>
                <span className={`sg-stamp sg-status st-${s.status}`}>{STATUS_LABEL[s.status]}</span>
                <Item
                  {...props}
                  s={s}
                  client={client}
                  answered={answered}
                  setAnswered={setAnswered}
                  refresh={refresh}
                />
              </li>
            ))}
          </ul>
          {items.length > BOARD_NOTES ? (
            <ul className="sg-plain">
              {items.slice(BOARD_NOTES).map((s) => (
                <li key={s.number} className="sg-plainrow">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="sg-plainrow__link">
                    <span className="n-small n-muted num">{dateText(s.createdAt)}</span>
                    <span className="sg-plain-title">{s.iWant}</span>
                    <span className={`sg-status st-${s.status}`}>{STATUS_LABEL[s.status]}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/** The notes on the quest board: D-17's "3 most recently changed" are the 3 newest (no change date yet). */
const BOARD_NOTES = 3;

/** A note's reply, its question with Add details, and its link. */
function Item(
  props: PanelProps & {
    s: MySuggestion;
    client: ClientOptions | null;
    answered: ReadonlySet<number>;
    setAnswered: Dispatch<SetStateAction<ReadonlySet<number>>>;
    refresh(): Promise<void>;
  },
) {
  const { s, client, answered, setAnswered, refresh } = props;
  return (
    <>
      {s.reply ? (
        <div className="sg-reply small">
          <p className="muted">Reply</p>
          <p>{s.reply}</p>
        </div>
      ) : null}
      {s.status === 'info' && s.question ? (
        <div className="sg-reply small">
          <p className="muted">Question for you</p>
          <p>{s.question}</p>
        </div>
      ) : null}
      {s.status === 'info' && s.question && s.canAddDetails && !answered.has(s.number) && client ? (
        <AddDetails
          {...props}
          client={client}
          issue={s.number}
          onAnswered={() => {
            setAnswered((prev) => new Set([...prev, s.number]));
            void refresh();
          }}
        />
      ) : null}
      <p className="small">
        <a href={s.url} target="_blank" rel="noopener noreferrer" className="sg-note-link">
          #{s.number} on GitHub
        </a>
      </p>
    </>
  );
}

/** Send now (FR-12): one tap runs Turnstile and sends; nothing goes without it. */
function OutboxSender(props: PanelProps & { item: OutboxItem; onDone(t: Toast | null): void }) {
  const { config, item } = props;
  const client = useClient(config);
  const turnstile = useTurnstile(config.siteKey);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const { onDone, store, proof, scene } = props;

  useEffect(() => {
    if (!turnstile.token || !client || busy.current) return;
    busy.current = true;
    const token = turnstile.take();
    void (async () => {
      const r = await withOutboxLock(async () => {
        const still = (await store.get('outbox')).some((o) => o.clientId === item.clientId);
        if (!still) return null;
        return sendSuggestion(
          { client, build: buildInfo, store, getProof: () => proof.getSignInProof(), scene: scene() },
          item,
          item.attachValues,
          token,
        );
      });
      busy.current = false;
      if (r === null) return onDone(null);
      if (r.kind === 'error') return setError(r.message);
      if (r.kind === 'outbox') return onDone({ text: r.message });
      onDone(r.dryRun ? { text: 'Preview: not sent.' } : SENT(r.url));
    })();
  }, [turnstile.token, turnstile.take, client, item, store, proof, scene, onDone]);

  return (
    <div className="sg-sender">
      <div className="sg-turnstile-frame">
        <p className="n-small">{HUMAN_CHECK}</p>
        <div className="sg-turnstile" ref={turnstile.ref} />
      </div>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : turnstile.state === 'blocked' ? (
        <p className="error">Couldn't load the human check. Allow challenges.cloudflare.com and try again.</p>
      ) : (
        <p className="small muted">Sending once you pass the human check…</p>
      )}
      <p className="sg-notice small">{NOTICE}</p>
    </div>
  );
}

/** Add details (D4, FR-26 to FR-28): one answer per question, same scrub, preview, notice and checks. */
function AddDetails(props: PanelProps & { client: ClientOptions; issue: number; onAnswered(): void }) {
  const { store, client, issue, config } = props;
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const turnstile = useTurnstile(config.siteKey);
  const scene = props.scene();
  const names = accountNames(scene);
  const noNames = namesUnavailable(scene.state);
  const scrubbed = scrubNames(text, names);
  const left = TEXT_LIMITS.details.max - codePoints(text);
  const id = `sg-details-${issue}`;
  const ok = text.trim() !== '' && left >= 0 && !noNames && turnstile.token !== null && !sending;

  const send = async () => {
    if (!ok) return;
    setSending(true);
    setError(null);
    const proof = await props.proof.getSignInProof();
    if (!proof) {
      setSending(false);
      return setError(`Not sent yet. ${SAVED_FOR_LATER.replace('Saved. ', '')}`);
    }
    const ids = await store.get('details');
    const clientId = ids[String(issue)] ?? newClientId();
    if (!ids[String(issue)]) await store.set('details', { ...ids, [String(issue)]: clientId });
    const req = { clientId, text: scrubbed, turnstileToken: turnstile.take() ?? '', proof };
    const v = validateDetailsRequest(req);
    if (!v.ok) {
      setSending(false);
      return setError(messageFor({ ok: false, error: { error: 'invalid', field: v.field } }));
    }
    const reply = await addDetails(client, issue, v.value);
    setSending(false);
    if (reply.ok) {
      const { [String(issue)]: _done, ...rest } = await store.get('details');
      await store.set('details', rest);
      props.onToast({ text: reply.body.dryRun ? 'Preview: not sent.' : 'Thanks, your answer was added.' });
      return props.onAnswered();
    }
    if (!reply.ok && reply.error?.error === 'already_answered') {
      props.onToast({ text: messageFor(reply) });
      return props.onAnswered();
    }
    setError(
      isOutboxError(reply.error) ? `Not sent yet. You can send it within the hour.` : messageFor(reply),
    );
  };

  return (
    <form
      className="sg-details"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      <label htmlFor={id} className="small">
        Add details
      </label>
      <textarea
        id={id}
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-describedby={`${id}-count`}
      />
      <p id={`${id}-count`} className={`sg-count small ${left < 0 ? 'error' : 'muted'}`}>
        {left} left
      </p>
      <details className="sg-preview small">
        <summary>What gets sent</summary>
        <pre>{scrubbed}</pre>
      </details>
      {noNames ? <p className="error">{NAMES_UNAVAILABLE}</p> : null}
      <div className="sg-turnstile-frame">
        <p className="n-small">{HUMAN_CHECK}</p>
        <div className="sg-turnstile" ref={turnstile.ref} />
      </div>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="sg-notice small">{NOTICE}</p>
      <div className="sg-actions">
        <button type="submit" className="small-btn" disabled={!ok}>
          {sending ? 'Sending…' : 'Send answer'}
        </button>
      </div>
    </form>
  );
}
