// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-F5 (moved verbatim from now/parts.tsx in Phase F): the Source line every area shows.
import type { SourceView } from '@idleon-forge/engine/now';
import { useId, useState } from 'react';

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/**
 * The Source line (FR-18, FR-19, #74): the best player-facing Source as a link named for its page
 * ("IdleOn Wiki: Smithing"), then the muted Toolbox credit, linked to the Toolbox website page, never to
 * code. With no wiki or guide, the link is that Toolbox page ("IdleOn Toolbox: Anvil") and the credit
 * stays text. "+n" lists the other player Sources in Focus.
 */
export function SourceLabel({ source, more = true }: { source: SourceView; more?: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const cls = `src${source.stale ? ' stale' : ''}`;
  if (!source.text && !source.credit && !source.stale) return null;
  return (
    <span className="src-wrap">
      {source.text ? (
        source.href ? (
          <a className={cls} href={source.href} target="_blank" rel="noopener noreferrer">
            {source.text}
          </a>
        ) : (
          <span className={cls}>{source.text}</span>
        )
      ) : null}
      {source.credit ? (
        <span className="src-credit muted">
          {source.text ? ' · ' : ''}
          {source.creditHref ? (
            <a className="muted" href={source.creditHref} target="_blank" rel="noopener noreferrer">
              {source.credit}
            </a>
          ) : (
            source.credit
          )}
        </span>
      ) : null}
      {source.stale ? <span className="src-stale"> · Stale</span> : null}
      {more && source.more.length > 0 ? (
        <>
          <button
            type="button"
            className="ghost tiny"
            aria-expanded={open}
            aria-controls={id}
            aria-label={`${source.more.length} more source${source.more.length === 1 ? '' : 's'}`}
            onClick={() => setOpen((o) => !o)}
          >
            +{source.more.length}
          </button>
          {open ? (
            <ul id={id} className="src-more">
              {source.more.map((m) => (
                <li key={`${m.text}${m.href}`}>
                  {m.href ? <ExternalLink href={m.href}>{m.text}</ExternalLink> : m.text}{' '}
                  <span className="muted">verified {m.verifiedOn}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </span>
  );
}
