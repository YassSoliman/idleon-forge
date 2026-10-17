// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { type FormEvent, useId, useState } from 'react';

interface Props {
  busy: boolean;
  onPaste(text: string): void;
}

/** The raw-JSON fallback: works without signing in, from IdleOn Toolbox's "Copy for support". */
export function PasteSave({ busy, onPaste }: Props) {
  const [text, setText] = useState('');
  const id = useId();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) onPaste(text);
  };
  return (
    <form className="paste" onSubmit={submit}>
      <label htmlFor={id} className="small">
        In IdleOn Toolbox, use <b>Copy for support</b> (or <b>Copy raw data</b>), then paste it here. It stays
        in this tab.
      </label>
      <textarea
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='{"data": { … }, "charNames": [ … ] }'
        spellCheck={false}
        autoComplete="off"
      />
      <button type="submit" className="primary" disabled={busy || text.trim() === ''}>
        {busy ? 'Reading…' : 'Read this save'}
      </button>
    </form>
  );
}
