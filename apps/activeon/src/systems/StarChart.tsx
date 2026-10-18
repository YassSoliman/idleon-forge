// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16 Star Signs (docs/specs/M16-star-signs.md): the Star Chart's pieces (points, unlocked signs, the
// next constellations, every character's sign line) that the star-signs System page body draws. Area S.
// The Star Chart lives on its System page (D-9); the Account keeps one summary line. The engine
// (packages/engine/src/starsigns) builds and words everything; this file only renders it. Text is React
// text, styles are classes (CSP).
import type { StarSignsNowView } from '@idleon-forge/engine/now';
import { SourceLabel } from '../design/atoms';
import { useNowActions } from '../now/context';
import '../now/signs/signs-page.css';

const list = (xs: readonly string[]) => (xs.length ? xs.join(' + ') : 'nothing');

export function StarChartBody({ s, heading = true }: { s: StarSignsNowView; heading?: boolean }) {
  return (
    <>
      {heading ? <h3 className="ss-h">Star Chart</h3> : null}
      <p className="small">
        <span className="num">{s.points ?? '?'}</span> points to spend ·{' '}
        <span className="num">{s.unlockedNodes}</span> signs unlocked (the Hydron chart opens at{' '}
        <span className="num">{s.hydronAt}</span>) · <span className="num">{s.slots}</span>{' '}
        {s.slots === 1 ? 'sign slot' : 'sign slots'} per character
      </p>
      {s.milestone ? <p className="small">{s.milestone}</p> : null}
      {s.plan ? <p className="small">{s.plan}</p> : null}
      {!s.questDone ? (
        <p className="small muted">Constellations open once the Telescope quest is handed in.</p>
      ) : null}
      {s.next.length ? (
        <>
          <h3 className="ss-h">Next constellations</h3>
          <ol className="ss-next">
            {s.next.map((n) => (
              <li key={n.name}>
                <b>{n.name}</b> {n.text} · <span className="num">{n.points}</span> points
                {n.shown ? (
                  <>
                    {' '}
                    <span className="pill">on your list</span>
                  </>
                ) : null}
              </li>
            ))}
          </ol>
        </>
      ) : null}
      {s.later.length ? (
        <ul className="ss-later small muted">
          {s.later.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      ) : null}
      {s.nextCharacter ? <p className="small">{s.nextCharacter}</p> : null}
      {s.source ? (
        <div className="ss-sources">
          <SourceLabel source={s.source} />
        </div>
      ) : null}
    </>
  );
}

/**
 * Every character's sign line, with a recommendation shared by several characters said once
 * ("wear The Fuzzy Dice · 6 characters") and each character's own line under "show details" (#70 A5).
 */
export function CharacterSigns({ s }: { s: StarSignsNowView }) {
  const actions = useNowActions();
  const groups = new Map<string, StarSignsNowView['characters']>();
  for (const c of s.characters) {
    const id = c.activity ? `wear ${list(c.recommended)}` : c.line;
    groups.set(id, [...(groups.get(id) ?? []), c]);
  }
  const link = (c: StarSignsNowView['characters'][number]) => (
    <a
      href={`#signs-${c.index}`}
      onClick={(e) => {
        e.preventDefault();
        actions.openTab(c.index, 'signs');
      }}
    >
      {c.line}
    </a>
  );
  return (
    <ul className="ss-chars small">
      {[...groups].map(([id, cs]) =>
        cs.length > 1 ? (
          <li key={id}>
            {id} · <span className="num">{cs.length}</span> characters
            <details className="ss-group">
              <summary>show details</summary>
              <ul>
                {cs.map((c) => (
                  <li key={c.index}>{link(c)}</li>
                ))}
              </ul>
            </details>
          </li>
        ) : (
          cs.map((c) => <li key={c.index}>{link(c)}</li>)
        ),
      )}
    </ul>
  );
}
