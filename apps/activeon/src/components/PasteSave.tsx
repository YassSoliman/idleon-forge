// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The raw-JSON fallback (M21 `flows.paste-save` Drop zone + Clear failure): one big target and three
// numbered steps; it works without signing in, from IdleOn Toolbox's "Copy for support", and the save
// stays in this tab. A failed paste says what went wrong with its fix, and the Roster stays (FR-20).
// M24 `plain`: the FirstRun and menu boards' version: the three steps, the box ("Paste here") and a
// quiet "Read this save" button, under a heading its container already gives.
import { SETUP_WORDS as W } from '@idleon-forge/engine/now';
import { type FormEvent, useId, useState } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { Button } from '../design/atoms/Button';

interface Props {
  busy: boolean;
  /** A failed paste while a roster is showing: reported here, and the roster stays (FR-20). */
  error: string | null;
  onPaste(text: string): void;
  /** M24: the steps, the box and a quiet button, with no drop-target heading of its own. */
  plain?: boolean;
}

export function PasteSave({ busy, error, onPaste, plain = false }: Props) {
  const [text, setText] = useState('');
  const id = useId();
  const errorId = useId();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) onPaste(text);
  };
  if (plain) {
    return (
      <form className="paste n-drop n-drop--plain" onSubmit={submit}>
        <ol className="n-steps">
          <li>{W.pasteStep1}</li>
          <li>{W.pasteStep2}</li>
          <li>{W.pasteStep3}</li>
        </ol>
        <label htmlFor={id} className="sr-only">
          {W.pasteLabel}
        </label>
        <textarea
          id={id}
          className="n-drop__text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={W.pastePlaceholder}
          spellCheck={false}
          autoComplete="off"
          rows={3}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {error ? (
          <p id={errorId} className="error n-alert n-alert--bad" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" tone="ghost" className="n-wide" disabled={busy || text.trim() === ''}>
          {busy ? W.pasteBusy : W.pasteRead}
        </Button>
      </form>
    );
  }
  return (
    <form className="paste n-drop" onSubmit={submit}>
      <label htmlFor={id} className="n-drop__target">
        <PixelArt name={text ? 'flows-clipboard-filled' : 'flows-clipboard-empty'} scale={2} decorative />
        <span className="n-drop__title">{W.pasteTitle}</span>
        <span className="n-muted n-small">{W.pasteHint}</span>
      </label>
      <textarea
        id={id}
        className="n-drop__text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='{"data": { … }, "charNames": [ … ] }'
        spellCheck={false}
        autoComplete="off"
        rows={2}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      <ol className="n-steps">
        <li>{W.pasteStep1}</li>
        <li>{W.pasteStep2}</li>
        <li>{W.pasteStep3}</li>
      </ol>
      {error ? (
        <p id={errorId} className="error n-alert n-alert--bad" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" tone="primary" className="n-wide" disabled={busy || text.trim() === ''}>
        {busy ? W.pasteBusy : W.pasteRead}
      </Button>
    </form>
  );
}
