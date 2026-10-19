// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Rule 3, no text walls (QA P2): a long "why" shows its first sentence and a "more" toggle for the
// rest. Short text renders as is. The whole text stays in the DOM order a screen reader reads once open.
import { useState } from 'react';

/** Text longer than this is folded after its first sentence. */
const LIMIT = 160;

/** "A. B. C." -> ["A.", "B. C."]; null when there is no sentence break worth folding at. */
export function splitFirstSentence(text: string): [string, string] | null {
  if (text.length <= LIMIT) return null;
  const m = /^(.+?[.!?;:])\s+(?=[A-Z0-9])/.exec(text);
  if (!m?.[1] || m[1].length >= text.length - 20) return null;
  return [m[1], text.slice(m[0].length)];
}

export function ShortText({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const parts = splitFirstSentence(text);
  if (!parts) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      {open ? text : parts[0]}{' '}
      <button type="button" className="a-more" aria-expanded={open} onClick={() => setOpen((x) => !x)}>
        {open ? 'less' : 'more'}
      </button>
    </span>
  );
}
