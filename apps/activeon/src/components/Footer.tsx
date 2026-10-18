// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The footer (M21 `flows.footer` Fan disclaimer), a lazy part under the fold: who made it, who didn't
// (LavaFlame2), that it is read-only, and every link 44 px (DS-15). The versions moved to the header's
// overflow menu (G1).
import { HEADER_WORDS, SETUP_WORDS } from '@idleon-forge/engine/now';
import { PixelArt } from '../design/art/PixelArt';
import type { ClearOptions } from '../use-activeon';
import { ClearMyData } from './ClearMyData';

export function Footer({
  persistent,
  signedIn,
  onSuggest,
  onYourSuggestions,
  onClear,
}: {
  persistent: boolean;
  signedIn: boolean;
  onSuggest(): void;
  onYourSuggestions: (() => void) | null;
  onClear(options: ClearOptions): Promise<void>;
}) {
  return (
    <footer className="foot n-foot">
      <div className="n-foot__fan">
        <PixelArt name="flows-fan-badge" scale={2} decorative />
        <p>
          <b>{SETUP_WORDS.fanMade}</b> {SETUP_WORDS.fanLine}
        </p>
      </div>
      <p className="n-small">{SETUP_WORDS.readOnly}</p>
      {!persistent ? <p className="n-small n-muted">{SETUP_WORDS.noMemory}</p> : null}
      <ul className="n-foot__links">
        <li>
          <button type="button" className="n-link-btn" onClick={onSuggest}>
            {HEADER_WORDS.suggest}
          </button>
        </li>
        {onYourSuggestions ? (
          <li>
            <button type="button" className="n-link-btn" onClick={onYourSuggestions}>
              {HEADER_WORDS.yourSuggestions}
            </button>
          </li>
        ) : null}
        {signedIn ? (
          <li>
            <ClearMyData onClear={onClear} />
          </li>
        ) : null}
        <li>
          <a
            className="n-link-btn"
            href="https://github.com/Morta1/IdleonToolbox"
            target="_blank"
            rel="noopener noreferrer"
          >
            IdleOn Toolbox
          </a>
        </li>
        <li>
          <a
            className="n-link-btn"
            href="https://github.com/YassSoliman/idleon-forge"
            target="_blank"
            rel="noopener noreferrer"
          >
            {SETUP_WORDS.source}
          </a>
        </li>
      </ul>
      <p className="legal">Read-only companion. Not affiliated with LavaFlame2.</p>
    </footer>
  );
}
