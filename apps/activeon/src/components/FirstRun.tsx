// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// First run (M24 FirstRun and MenuPhone boards): before any save, one screen that says what ActiveOn is
// and how to bring a save. Desktop: what it does on the left (three pictures and the read-only promise),
// "Bring your save" on the right (Sign in with Google, the one frame on the screen, then paste). Phone:
// one column, the save first. A lazy part: a returning player never downloads it.
// The pictures are our own pixel art (ADR 0009): the sprite kit's coin and clock, the guide blob, and
// two small drawings the kit has no sprite for (the clipboard, the read-only shield), all decorative
// beside their words.
import { FIRST_RUN_WORDS as W } from '@idleon-forge/engine/menu-text';
import type { ReactNode } from 'react';
import { GameIcon } from '../art/game/GameIcon';
import { dataArt } from '../art/game/game-art';
import { Sprite } from '../art/sprites/Sprite';
import { Blob } from '../design/atoms/Blob';
import { Pip, Tag } from '../design/atoms/Surfaces';

/** The game's gold coin (Toolbox data/Coins3), for the Spend Plan's picture. */
const COIN = dataArt('Coins3');

function Shield() {
  return (
    <svg
      width={36}
      height={40}
      viewBox="0 0 10 11"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="0" width="8" height="1" fill="#7FD4A6" />
      <rect x="0" y="1" width="10" height="5" fill="#7FD4A6" />
      <rect x="1" y="6" width="8" height="2" fill="#7FD4A6" />
      <rect x="2" y="8" width="6" height="1" fill="#7FD4A6" />
      <rect x="3" y="9" width="4" height="1" fill="#7FD4A6" />
      <rect x="4" y="10" width="2" height="1" fill="#7FD4A6" />
      <rect x="2" y="4" width="1" height="1" fill="#14161B" />
      <rect x="3" y="5" width="1" height="1" fill="#14161B" />
      <rect x="4" y="6" width="1" height="1" fill="#14161B" />
      <rect x="5" y="5" width="1" height="1" fill="#14161B" />
      <rect x="6" y="4" width="1" height="1" fill="#14161B" />
      <rect x="7" y="3" width="1" height="1" fill="#14161B" />
    </svg>
  );
}

function Clipboard() {
  return (
    <svg
      width={24}
      height={30}
      viewBox="0 0 12 15"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width="10" height="13" fill="#8C5A2B" />
      <rect x="4" y="0" width="4" height="2" fill="#BDB6A6" />
      <rect x="2" y="3" width="8" height="10" fill="#E8DCC2" />
      <rect x="3" y="5" width="6" height="1" fill="#8C8679" />
      <rect x="3" y="7" width="5" height="1" fill="#8C8679" />
      <rect x="3" y="9" width="6" height="1" fill="#8C8679" />
      <rect x="3" y="11" width="4" height="1" fill="#8C8679" />
    </svg>
  );
}

/** The three pictures: the full things to collect, what fills while away, what to buy. */
const PICTURES: [ReactNode, ReactNode][] = [
  [
    <span key="p" className="n-fr-pic n-fr-pic--fix">
      <Blob family="warrior" size={28} />
      <Blob family="mage" size={28} />
      <Blob family="archer" size={28} />
      <Pip tone="gold" className="n-fr-pic__end" />
    </span>,
    <Blob key="i" family="warrior" size={24} />,
  ],
  [
    <span key="p" className="n-fr-pic n-fr-pic--line">
      <span className="n-fr-line" />
      <span className="n-fr-mark n-fr-mark--a" />
      <span className="n-fr-mark n-fr-mark--b" />
      <span className="n-fr-mark n-fr-mark--c" />
      <span className="n-fr-mark n-fr-mark--fill" />
      <span className="n-fr-back" />
      <span className="n-fr-tick n-fr-tick--now">{W.timelineNow}</span>
      <span className="n-fr-tick n-fr-tick--back">{W.timelineBack}</span>
    </span>,
    <Sprite key="i" name="status-clock" size={24} decorative />,
  ],
  [
    <span key="p" className="n-fr-pic n-fr-pic--buy">
      <GameIcon art={COIN} fallback="item-coin" size={32} decorative />
      <GameIcon art={COIN} fallback="item-coin" size={32} decorative />
      <GameIcon art={COIN} fallback="item-coin" size={32} decorative />
      <span className="n-fr-buy">{W.buy}</span>
    </span>,
    <GameIcon key="i" art={COIN} fallback="item-coin" size={24} decorative />,
  ],
];

export interface FirstRunProps {
  /** Signed out: the Sign in with Google button. Any other auth state: the sign-in card instead. */
  signedOut: boolean;
  onSignIn(): void;
  /** The sign-in card (asking, the device code, restoring, not set up), when not plain signed out. */
  signIn: ReactNode;
  /** A sign-in error to show under the button. */
  error: string | null;
  /** The paste box (PasteSave, plain variant). */
  paste: ReactNode;
}

export function FirstRun({ signedOut, onSignIn, signIn, error, paste }: FirstRunProps) {
  return (
    <div className="n-fr">
      <div className="n-fr__intro">
        <p className="n-fr__kicker">
          <Blob size={56} />
          <span className="a-cap">{W.kicker}</span>
        </p>
        <h2 className="a-display n-fr__title">{W.title}</h2>
        <p className="n-fr__lead">{W.lead}</p>
      </div>

      <ul className="n-fr__feats">
        {W.features.map(([title, line], i) => (
          <li key={title} className="n-fr-feat">
            {PICTURES[i]?.[0]}
            <span className="n-fr-feat__ico">{PICTURES[i]?.[1]}</span>
            <span className="n-fr-feat__text">
              <span className="n-fr-feat__title">{title}</span>
              <span className="n-fr-feat__line">{line}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="n-fr__safe">
        <Shield />
        <p className="n-fr__safe-text">
          <span className="n-fr__safe-title">{W.readOnlyTitle}</span>
          <span>{W.readOnly}</span>
        </p>
      </div>

      <section className="n-fr__bring" aria-label={W.bring}>
        <h2 className="a-h2">{W.bring}</h2>
        <div className="a-frame a-frame--gold a-frame--pad n-fr__signin">
          {signedOut ? (
            <>
              <p className="n-fr__opt">
                <span className="n-fr__opt-title">{W.signInTitle}</span>
                <Tag tone="gold">{W.best}</Tag>
              </p>
              <p className="n-fr__opt-lead">{W.signInLead}</p>
              <button type="button" className="a-btn a-btn--primary n-fr__go" onClick={onSignIn}>
                {W.signInTitle}
              </button>
              {error ? (
                <p className="error n-error" role="alert">
                  {error}
                </p>
              ) : null}
            </>
          ) : (
            signIn
          )}
        </div>
        <p className="n-fr__or" aria-hidden="true">
          <span />
          {W.or}
          <span />
        </p>
        <div className="a-tile n-fr__paste">
          <p className="n-fr__opt">
            <Clipboard />
            <span className="n-fr__opt-title">{W.pasteTitle}</span>
          </p>
          <p className="n-fr__opt-lead">{W.pasteLead}</p>
          {paste}
        </div>
      </section>
    </div>
  );
}
