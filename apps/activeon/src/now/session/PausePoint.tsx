// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Log in and Log off pause points' content (M21 FR-N6, FR-N7), a lazy part.
// - Log in: the Away card (`flows.away-card` Scaled welcome: one line up to 8 h, the full "While you were
//   away" card after) and a read-only list of up to 7 things that changed: limits that bound while away,
//   daily resets passed, and class levels gained (a level row opens that character's Build tab).
// - Log off: every unmet AFK Setup item (at most 7, then "+n"), each ticked by the next cloud save, never
//   by a tap (DO-CONFIRM, DS-2). All ticked ends on the Verdict: the wax seals, the campfire and "Safe to
//   log off · back in 8h", in the Quest Log celebration frame (`flows.session-checklist` Quest scroll).
import { AWAY_WORDS, PAUSE_WORDS } from '@idleon-forge/engine/now';
import { useEffect } from 'react';
import { PixelArt } from '../../design/art/PixelArt';
import { TokenLine } from '../../design/atoms/TokenLine';
import type { FirstFix, LoginRow, LogoffItem, NowSessionView } from './types';

export interface PausePointProps {
  view: NowSessionView;
  /** The Log off items first shown this Play Session (the save ticks the ones it no longer lists). */
  shown: { key: string; text: string; who: string | null }[];
  onShown(items: { key: string; text: string; who: string | null }[]): void;
  onOpen(index: number): void;
  onBuild(index: number): void;
  /** "8h", the Expected Return the closing line says. */
  back: string;
}

const ROW_GLYPH = { limit: 'now-cap-anvil', reset: 'now-hourglass', level: 'v2-character-star' } as const;

function Rows({ rows, onBuild }: { rows: LoginRow[]; onBuild(index: number): void }) {
  return (
    <ol className="n-seals">
      {rows.map((r) => (
        <li key={r.key} className="n-seal-item">
          <PixelArt name={ROW_GLYPH[r.kind]} decorative />
          {r.kind === 'level' && r.index !== null ? (
            <button type="button" className="n-seal-item__link" onClick={() => onBuild(r.index as number)}>
              {r.text}
            </button>
          ) : (
            <span>{r.text}</span>
          )}
        </li>
      ))}
    </ol>
  );
}

function StartWith({ first, onOpen }: { first: FirstFix | null; onOpen(index: number): void }) {
  if (!first) return <p className="n-muted">{AWAY_WORDS.nothingToStart}</p>;
  return (
    <p className="n-away__first">
      <span className="n-away__k">{AWAY_WORDS.startWith}</span>
      {first.who ? (
        <button type="button" className="n-away__go" onClick={() => first.who && onOpen(first.who.index)}>
          <TokenLine who={{ family: first.who.family, label: first.who.label }} where={first.where} />
          <span>{first.text}</span>
        </button>
      ) : (
        <span>{first.text}</span>
      )}
    </p>
  );
}

function LogIn({ view, onOpen, onBuild }: PausePointProps) {
  const away = view.away;
  const login = view.login;
  return (
    <section className="n-pause-card" aria-label={PAUSE_WORDS.tabs.login}>
      {away?.size === 'card' ? (
        <div className="n-away" data-direction="quest">
          <div className="n-away__head">
            <PixelArt name="flows-sunrise" scale={2} decorative />
            <h3 className="n-away__title">{away.text}</h3>
          </div>
          <Rows rows={away.rows} onBuild={onBuild} />
          {login && login.more > 0 ? <p className="n-muted">{PAUSE_WORDS.more(login.more)}</p> : null}
          <StartWith first={away.first} onOpen={onOpen} />
        </div>
      ) : (
        <>
          {away ? <p className="n-away-line">{away.text}</p> : null}
          <h3 className="n-pause-card__title">{PAUSE_WORDS.loginTitle}</h3>
          {login && login.rows.length > 0 ? (
            <>
              <Rows rows={login.rows} onBuild={onBuild} />
              {login.more > 0 ? <p className="n-muted">{PAUSE_WORDS.more(login.more)}</p> : null}
            </>
          ) : (
            <p className="n-muted">{PAUSE_WORDS.nothingChanged}</p>
          )}
        </>
      )}
    </section>
  );
}

function LogOff({ view, shown, onShown, onOpen, back }: PausePointProps) {
  const current = view.logoff.items;
  const keys = new Set(current.map((i) => i.key));
  const known = new Set(shown.map((i) => i.key));
  const added = current.filter((i) => !known.has(i.key));
  useEffect(() => {
    if (added.length > 0)
      onShown([...shown, ...added.map((i) => ({ key: i.key, text: i.text, who: i.who?.label ?? null }))]);
  }, [added, shown, onShown]);
  const items: { key: string; text: string; who: string | null; item: LogoffItem | null; ticked: boolean }[] =
    [
      ...shown.map((s) => ({
        ...s,
        item: current.find((i) => i.key === s.key) ?? null,
        ticked: !keys.has(s.key),
      })),
      ...added.map((i) => ({ key: i.key, text: i.text, who: i.who?.label ?? null, item: i, ticked: false })),
    ];
  const allTicked = current.length === 0;
  return (
    <section className="n-pause-card" aria-label={PAUSE_WORDS.tabs.logoff}>
      <h3 className="n-pause-card__title">{PAUSE_WORDS.logoffTitle}</h3>
      {items.length > 0 ? (
        <ol className="n-seals">
          {items.map((i) => (
            <li key={i.key} className={`n-seal-item${i.ticked ? ' is-ticked' : ''}`}>
              <PixelArt
                name={i.ticked ? 'flows-wax-seal-ticked' : 'flows-wax-seal-open'}
                scale={2}
                decorative
              />
              <span className="n-seal-item__body">
                {i.item?.who ? (
                  <button
                    type="button"
                    className="n-seal-item__who"
                    onClick={() => i.item?.who && onOpen(i.item.who.index)}
                  >
                    <TokenLine
                      who={{ family: i.item.who.family, label: i.item.who.label }}
                      where={i.item.where}
                    />
                  </button>
                ) : i.who ? (
                  <span className="n-muted">{i.who}</span>
                ) : null}
                <span className="n-seal-item__text">{i.ticked ? <s>{i.text}</s> : i.text}</span>
                <span className="sr-only">{i.ticked ? PAUSE_WORDS.ticked : PAUSE_WORDS.open}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      {view.logoff.more > 0 ? <p className="n-muted">{PAUSE_WORDS.more(view.logoff.more)}</p> : null}
      {allTicked ? (
        <div className="n-allset" data-direction="quest">
          <PixelArt name="flows-campfire" scale={2} decorative />
          <p className="n-allset__title">{PAUSE_WORDS.safe(back)}</p>
        </div>
      ) : (
        <p className="n-muted n-small">{PAUSE_WORDS.logoffHint}</p>
      )}
    </section>
  );
}

export function PausePoint(props: PausePointProps) {
  if (props.view.tab === 'login') return <LogIn {...props} />;
  if (props.view.tab === 'logoff') return <LogOff {...props} />;
  return null;
}
