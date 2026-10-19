// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the Goals page (canvas board Goals): the answer framed at the top (start with these three), a
// filter by group, then the rest in three groups (Spend what's waiting, Grow your account, Extras), each
// showing its next three with the others behind "Show N more"; the side column has the Goals that need
// one character logged in, and what the groups mean. Fixes that stop you logging off come first when
// there are any. It only lays out the Now view's account Goals (ranked by the engine).
import { useMemo, useState } from 'react';
import { Sprite } from '../art/sprites/Sprite';
import { cx } from '../design/atoms/Button';
import { WhoGlyph } from '../design/who/WhoGlyph';
import { useNowActions } from '../now/context';
import { NextActionItem, SeeItLink } from '../now/parts';
import type { Session } from '../shell/session';
import { Crumb } from './Crumb';
import { type GoalRow, GROUP_ORDER, type GroupId, goalsPage } from './goals-model';
import { GROUP_WORDS as G, GOALS_WORDS as W } from './words';

const SHOWN = 3;

function Mono({ r, big }: { r: GoalRow; big?: boolean }) {
  return (
    <span className={cx('ac-mono', `is-${r.tone}`, big && 'is-big')} aria-hidden="true">
      {r.sprite ? <Sprite name={r.sprite} size={big ? 32 : 24} decorative /> : r.mono}
    </span>
  );
}

function TopGoal({ r, n }: { r: GoalRow; n: number }) {
  return (
    <li className={cx('ac-gtop', r.tone === 'losing' && 'is-losing')}>
      <span className="ac-gtop__head">
        <span className={cx('ac-n num', r.tone === 'losing' && 'is-losing')} aria-hidden="true">
          {n}
        </span>
        <Mono r={r} big />
        <span className={cx('ac-gtop__state', r.urgency ? 'ac-coral' : 'ac-mut')}>
          {r.urgency ?? r.goal.milestone ?? ''}
        </span>
      </span>
      <b className="ac-gtop__t">{r.goal.action.text}</b>
      <span className="ac-sub ac-gtop__why">{r.goal.action.why}</span>
      <span className="ac-gtop__foot">
        <span className="ac-sub">{r.system}</span>
        <SeeItLink goal={r.goal} subject="account" />
      </span>
    </li>
  );
}

function GoalLine({ r }: { r: GoalRow }) {
  const actions = useNowActions();
  return (
    <li className="ac-grow">
      <Mono r={r} />
      <span className="ac-grow__t">
        <b>{r.goal.action.text}</b>
        <span className="ac-sub">{r.goal.action.why}</span>
      </span>
      {r.urgency ? (
        <span className="ac-grow__x ac-coral">{r.urgency}</span>
      ) : r.goal.milestone ? (
        <span className="ac-grow__x ac-sky">{r.goal.milestone}</span>
      ) : (
        <span className="ac-grow__x" />
      )}
      <span className="ac-grow__sys ac-sub">{r.system}</span>
      <SeeItLink goal={r.goal} subject="account" />
      <button
        type="button"
        className="a-btn a-btn--quiet ac-skip ac-skip--small"
        aria-label={W.skipLabel(r.goal.action.text)}
        onClick={() => actions.skip(r.goal.action.key)}
      >
        <span>{W.skip}</span>
      </button>
    </li>
  );
}

function Group({ id, rows, count }: { id: GroupId; rows: GoalRow[]; count: number }) {
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;
  const shown = open ? rows : rows.slice(0, SHOWN);
  return (
    <section className="ac-group" aria-labelledby={`ac-g-${id}`}>
      <div className="ac-head">
        <span className="ac-head__l">
          <h3 id={`ac-g-${id}`} className="ac-h2">
            {G[id].title}
          </h3>
          <span className="ac-sub num">{count}</span>
        </span>
      </div>
      <ol className="ac-glist">
        {shown.map((r) => (
          <GoalLine key={r.goal.action.key} r={r} />
        ))}
      </ol>
      {rows.length > SHOWN ? (
        <button
          type="button"
          className="n-link-btn ac-more"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? W.less : W.more(rows.length - SHOWN)}
        </button>
      ) : null}
    </section>
  );
}

export function GoalsPage({ s }: { s: Session }) {
  const actions = useNowActions();
  const page = useMemo(() => goalsPage(s.result, s.view), [s.result, s.view]);
  const [filter, setFilter] = useState<GroupId | 'all'>('all');
  const groups = page.groups.filter((g) => filter === 'all' || g.id === filter);
  const total = page.three.length + page.groups.reduce((n, g) => n + g.rows.length, 0);
  return (
    <article className="ac-page" aria-labelledby="ac-goals-h">
      <Crumb s={s} here={W.crumb} back={W.back} />
      <section className="a-frame ac-hero" aria-labelledby="ac-goals-h">
        <div className="ac-head ac-head--end">
          <span className="ac-hero__words">
            <span className="ac-cap">{W.cap(page.total, page.blockers.length)}</span>
            <h2 id="ac-goals-h" className="ac-h1" data-place-heading tabIndex={-1}>
              {page.three.length ? W.title(page.three.length) : W.none}
            </h2>
          </span>
        </div>
        {page.three.length ? (
          <ol className="ac-three">
            {page.three.map((r, i) => (
              <TopGoal key={r.goal.action.key} r={r} n={i + 1} />
            ))}
          </ol>
        ) : null}
      </section>

      {page.blockers.length ? (
        <section className="ac-fix" aria-labelledby="ac-fix-h">
          <h3 id="ac-fix-h" className="ac-h2 ac-coral">
            {W.fixFirst}
          </h3>
          <ul className="goals blockers">
            {page.blockers.map((g) => (
              <li key={g.action.key}>
                <NextActionItem
                  action={g.action}
                  milestone={g.milestone}
                  details={g.details}
                  walkthrough={g.walkthrough}
                  seeIt={<SeeItLink goal={g} subject="account" />}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="ac-bar-row">
        <fieldset className="ac-seg">
          <legend className="sr-only">{W.show}</legend>
          {(['all', ...GROUP_ORDER] as const).map((id) => {
            const n = id === 'all' ? total : (page.groups.find((g) => g.id === id)?.count ?? 0);
            if (id !== 'all' && n === 0) return null;
            return (
              <button
                key={id}
                type="button"
                className={cx('ac-seg__b', filter === id && 'is-on')}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
              >
                {id === 'all' ? W.all(n) : `${G[id].title} ${n}`}
              </button>
            );
          })}
        </fieldset>
        <span className="ac-counts ac-sub">
          <span>
            <i className="ac-pip is-later" aria-hidden="true" />
            {W.skipped(page.skippedKeys.length)}
            {page.skippedKeys.length ? (
              <button type="button" className="n-link-btn" onClick={() => actions.unskip(page.skippedKeys)}>
                {W.undo}
              </button>
            ) : null}
          </span>
          <span>
            <i className="ac-pip is-later" aria-hidden="true" />
            {W.hidden(page.dismissed)}
          </span>
        </span>
      </div>

      <div className="ac-cols ac-cols--goals">
        <div className="ac-main">
          {groups.map((g) => (
            <Group key={g.id} id={g.id} rows={g.rows} count={g.count} />
          ))}
        </div>
        <aside className="ac-side">
          {page.oneCharacter.length ? (
            <section className="ac-part" aria-labelledby="ac-one-h">
              <h3 id="ac-one-h" className="ac-h2">
                {W.oneChar}
              </h3>
              <p className="ac-sub">{W.oneCharLine}</p>
              <ul className="ac-people">
                {page.oneCharacter.map((c) => (
                  <li key={c.index}>
                    <a
                      href={`#now-${c.index}`}
                      className="ac-person"
                      onClick={(e) => {
                        e.preventDefault();
                        s.navigate({ place: 'character', index: c.index, tab: 'now' }, 'push', {
                          origin: '#goals',
                        });
                      }}
                    >
                      {c.family ? (
                        <WhoGlyph family={c.family} classLabel={c.who} scale={2} decorative />
                      ) : null}
                      <span className="ac-person__t">
                        <b>{c.who}</b>
                        <span className="ac-sub">{c.text}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className="ac-tile">
            <h3 className="ac-cap">{W.meaning}</h3>
            {GROUP_ORDER.map((id) => (
              <p key={id} className="ac-sub">
                <b className="ac-fg">{G[id].title}</b>: {G[id].line}
              </p>
            ))}
          </section>
        </aside>
      </div>
    </article>
  );
}
