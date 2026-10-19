// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4: the "set up first" checklist (board `after/W4Welcome`, its framed block), facts from the
// save: Gobo's quests done, elites taken, kitchens owned, Lab characters uploaded, the Repository and
// Spinner open, each with its wiki-sourced step. Rendered on Now by W4WelcomeSlot only once World 4 is
// reached and until every step is done. It is Now's one framed block while it shows.
import type { World4Welcome } from '@idleon-forge/engine/world4';
import { Sprite } from '../art/sprites/Sprite';
import { cx } from '../design/atoms';
import { formatRoute } from '../shell/route';
import type { Session } from '../shell/session';
import './world4.css';

export function W4Welcome({ s, w }: { s: Session; w: World4Welcome }) {
  return (
    <section className="w4-welcome a-frame w4-t--gold" aria-labelledby="w4-welcome-h">
      <div className="w4-welcome__head">
        <Sprite name="sys-rift" size={64} decorative />
        <div className="w4-stack">
          <span className="w4-welcome__badges">
            <span className="w4-tag w4-tag--solid">{w.badge}</span>
            <span className="w4-small w4-muted">{w.place}</span>
          </span>
          <h2 id="w4-welcome-h" className="w4-welcome__title">
            {w.title}
          </h2>
          <p className="w4-small w4-muted">{w.lede}</p>
        </div>
      </div>
      <ol className="w4-steps">
        {w.steps.map((x) => {
          const href = x.home.system
            ? formatRoute({ place: 'system', id: x.home.system })
            : formatRoute({ place: 'map', mapIndex: null });
          return (
            <li key={x.key} className={cx('w4-step', x.now && 'is-now', x.done && 'is-done')}>
              <span className="w4-step__n" aria-hidden="true">
                {x.done ? <Sprite name="status-check" size={24} decorative /> : x.n}
              </span>
              <span className="w4-row__main">
                <span className="w4-strong">
                  {x.title}
                  {x.done ? <span className="sr-only"> (done)</span> : null}
                </span>
                <span className="w4-small w4-muted">{x.why}</span>
              </span>
              <span className="w4-step__end">
                <span
                  className={cx(
                    'w4-small w4-strong num',
                    x.done ? 'w4-t--mint' : x.now ? 'w4-t--gold' : 'w4-muted',
                  )}
                >
                  {x.progress}
                </span>
                <a
                  className="w4-xs"
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    if (x.home.system) s.navigate({ place: 'system', id: x.home.system }, 'push');
                    else s.navigate({ place: 'map', mapIndex: null }, 'push');
                  }}
                >
                  {x.home.label} ›
                </a>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="w4-xs w4-muted">
        Steps from{' '}
        {w.source.map((x, i) => (
          <span key={x.url}>
            {i > 0 ? ', ' : ''}
            <a href={x.url} target="_blank" rel="noopener noreferrer">
              {x.title.replace('IdleOn Wiki: ', '')}
            </a>
          </span>
        ))}{' '}
        (IdleOn Wiki)
      </p>
    </section>
  );
}
