// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Account section (FR-22, FR-23, FR-26), "If you have time" (FR-24) and "Not covered yet".
import type { NowView } from '@idleon-forge/engine/now';
import type { CardsView } from '@idleon-forge/engine/result';
import { forwardRef } from 'react';
import { CardsOverview, useOpenCards } from './cards/CardsPanel';
import { useNowActions } from './context';
import { GoalList, NextActionItem, ReportThis, SourceLabel } from './parts';

export const AccountSection = forwardRef<
  HTMLElement,
  { view: NowView; cards?: CardsView | null; names?: ReadonlyMap<number, string> }
>(function AccountSection({ view, cards = null, names = new Map() }, ref) {
  const actions = useNowActions();
  const openCards = useOpenCards();
  const acc = view.account;
  const sp = acc.spendPlan;
  return (
    <section ref={ref} className="account" aria-labelledby="account-h" tabIndex={-1}>
      <h2 id="account-h" className="section-h">
        Account · any character
      </h2>
      {acc.safetyUnknown ? (
        <div className="verdict unknown">
          <p>{acc.safetyUnknown.text}</p>
          <div className="controls">
            {acc.safetyUnknown.skipped ? (
              <button
                type="button"
                className="ghost tiny"
                onClick={() => actions.unskip(['unknown@account'])}
              >
                skipped · undo
              </button>
            ) : (
              <button type="button" className="ghost tiny" onClick={() => actions.skip('unknown@account')}>
                Skip today
              </button>
            )}
            <ReportThis
              input={{
                outputKind: 'verdict',
                entryIds: [],
                fields: [],
                text: acc.safetyUnknown.text,
                stale: false,
                contested: false,
              }}
            />
          </div>
        </div>
      ) : null}
      {acc.blockers.length > 0 ? (
        <div className="verdict fix">
          <h3 className="sub-h">Fix before you leave</h3>
          <ul className="goals blockers">
            {acc.blockers.map((g) => (
              <li key={g.action.key}>
                <NextActionItem
                  action={g.action}
                  milestone={g.milestone}
                  details={g.details}
                  walkthrough={g.walkthrough}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <GoalList
        goals={acc.goals}
        subject="account"
        hiddenCount={acc.hiddenCount}
        skipped={acc.skippedKeys}
        dismissed={acc.dismissed}
        onCards={cards ? () => openCards('account') : null}
      />
      <CardsOverview cards={cards} names={names} />
      {sp ? (
        <details
          className="spend card"
          id="spend-plan"
          open={actions.expanded.has('spend-open')}
          onToggle={(e) => {
            const open = (e.currentTarget as HTMLDetailsElement).open;
            if (open !== actions.expanded.has('spend-open')) actions.toggle('spend-open');
          }}
        >
          <summary>
            <span className="tag">Spend · Spend coins</span> {sp.goal ? sp.goal.action.text : sp.summary}
          </summary>
          <ol className="spend-lines">
            {sp.lines.map((l) => (
              <li key={l.id} className={`spend-line ${l.status}`}>
                <p>
                  <b>{l.text}</b>
                  {l.levels ? ` · ${l.levels}` : ''}
                </p>
                <p className="small">
                  {l.cost}
                  {l.payer ? ` · ${l.payer}` : ''} ·{' '}
                  <span className={`pill s-${l.status}`}>{l.statusText}</span>
                </p>
                {l.runningTotal ? <p className="small muted num">{l.runningTotal}</p> : null}
                {l.source ? <SourceLabel source={l.source} more={false} /> : null}
                <div className="controls">
                  <button type="button" className="ghost tiny" onClick={() => actions.skip(l.key)}>
                    Skip today
                  </button>
                  <button type="button" className="ghost tiny" onClick={() => actions.dismiss(l.key)}>
                    Not for me
                  </button>
                  <ReportThis
                    input={{
                      outputKind: 'spend-line',
                      entryIds: [l.key.split('@')[0] ?? l.key],
                      fields: [],
                      text: l.text,
                      stale: l.stale,
                      contested: l.contested,
                    }}
                  />
                </div>
                {l.note ? <p className="small muted">{l.note}</p> : null}
              </li>
            ))}
          </ol>
          {sp.hiddenCount > 0 || actions.expanded.has('spend') ? (
            <button
              type="button"
              className="ghost"
              aria-expanded={actions.expanded.has('spend')}
              onClick={() => actions.toggle('spend')}
            >
              {actions.expanded.has('spend') ? 'show less' : `show more (${sp.hiddenCount})`}
            </button>
          ) : null}
          {sp.skippedKeys.length ? (
            <p className="small muted">
              {sp.skippedKeys.length} skipped ·{' '}
              <button type="button" className="ghost tiny" onClick={() => actions.unskip(sp.skippedKeys)}>
                undo
              </button>
            </p>
          ) : null}
          <p className="small">{sp.summary}</p>
          {sp.unavailable.map((u) => (
            <p key={u} className="small muted">
              {u}
            </p>
          ))}
        </details>
      ) : null}
      {acc.done.length > 0 ? (
        <details className="done small">
          <summary>Done this session ({acc.done.length})</summary>
          <ul>
            {acc.done.map((d) => (
              <li key={d.key}>
                <s>{d.text}</s> <span className="muted num">{d.time}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
});

export function IfYouHaveTime({ view }: { view: NowView }) {
  if (view.activePlay.length === 0) return null;
  return (
    <section aria-labelledby="iyht-h" className="small">
      <h2 id="iyht-h" className="section-h">
        If you have time
      </h2>
      <ul>
        {view.activePlay.map((a) => (
          <li key={a.key}>
            {a.text} · {a.estimate}
            {a.who ? ` · ${a.who}` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NotCoveredYet({ view }: { view: NowView }) {
  if (view.notCovered.length === 0) return null;
  return (
    <details className="not-covered small">
      <summary>Not covered yet: {view.notCovered.join(', ')}</summary>
      <p>ActiveOn has no advice for these yet, so you're on your own there.</p>
      <ul>
        {view.notCovered.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </details>
  );
}
