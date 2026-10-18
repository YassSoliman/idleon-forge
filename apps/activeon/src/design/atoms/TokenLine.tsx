// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The action line's three tokens (M21 DS-3, TR-5): who · where · how long, in that order. A known
// token shows; an unknown one (null or undefined) is hidden, never printed as "place not given" or
// "time not known". "Any character" is hidden too: the engine passes null for it.
import { PixelArt } from '../art/PixelArt';
import { type ClassFamily, WhoGlyph } from '../who/WhoGlyph';
import { GLYPH } from './glyphs';

export interface TokenLineProps {
  who?: { family: ClassFamily; label: string } | null;
  where?: string | null;
  howLong?: string | null;
}

export function TokenLine({ who, where, howLong }: TokenLineProps) {
  const tokens = [
    who ? (
      <span key="who" className="a-token a-token--who">
        <WhoGlyph family={who.family} classLabel={who.label} scale={1} decorative />
        <span>{who.label}</span>
      </span>
    ) : null,
    where ? (
      <span key="where" className="a-token a-token--where">
        <PixelArt name={GLYPH.where} decorative />
        <span>{where}</span>
      </span>
    ) : null,
    howLong ? (
      <span key="howLong" className="a-token a-token--how-long">
        <PixelArt name={GLYPH.howLong} decorative />
        <span className="num">{howLong}</span>
      </span>
    ) : null,
  ].filter((t) => t !== null);
  if (tokens.length === 0) return null;
  return (
    <span className="a-token-line">
      {tokens.flatMap((t, i) =>
        i === 0
          ? [t]
          : [
              <span key={`sep-${t.key}`} className="a-token-sep" aria-hidden="true">
                ·
              </span>,
              t,
            ],
      )}
    </span>
  );
}
