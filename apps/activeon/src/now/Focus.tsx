// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Focus (M10 variant C, FR-10 to FR-14): one character's card. The Verdict strip is a nav of plain
// links (TR-14: Tab only, aria-current on the one in Focus). The <h2> takes keyboard focus only when
// the player opened the card, never on an auto-follow.
import type { FocusCard } from '@idleon-forge/engine/now';
import { forwardRef } from 'react';
import { useNowActions } from './context';
import { ActionControls, GoalList, NextActionItem, ReportThis, SourceLabel } from './parts';
import { Pill } from './Roster';

export interface FocusProps {
  card: FocusCard;
  /** "Now playing <name> · go", while an auto-follow waits for the player to finish (FR-14). */
  pendingFollow: { index: number; text: string } | null;
  /** The in-game Cloud Save tip, while the screen is guessing who is played (FR-14 ruling). */
  showCloudSaveTip: boolean;
  onBack(): void;
  onNext(index: number | null): void;
  onConfusing(): string;
}

export const Focus = forwardRef<HTMLHeadingElement, FocusProps>(function Focus(
  { card, pendingFollow, showCloudSaveTip, onBack, onNext, onConfusing },
  headingRef,
) {
  const actions = useNowActions();
  const go = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    actions.open(index);
  };
  return (
    <section className="focus card" aria-labelledby="focus-h">
      <nav aria-label="Characters in Visit Order" className="strip">
        <ul>
          {card.strip.map((s) => (
            <li key={s.index}>
              <a
                href={`?c=${s.index}`}
                className={`strip-item ${s.kind}`}
                aria-label={s.accessibleName}
                aria-current={s.current ? 'true' : undefined}
                onClick={(e) => go(e, s.index)}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {pendingFollow ? (
        <button type="button" className="chip follow" onClick={() => actions.open(pendingFollow.index)}>
          {pendingFollow.text} · go
        </button>
      ) : null}

      <p className="small muted">
        {card.position}
        {card.playing ? ` · ${card.playing}` : ''}
      </p>
      {showCloudSaveTip ? (
        <p className="small tip">Tip: press Cloud Save in the game to lock this in right away.</p>
      ) : null}
      {card.left ? (
        <p className="left-line small">
          {card.left.text} ·{' '}
          <a href={`?c=${card.left.index}`} onClick={(e) => go(e, card.left?.index ?? card.index)}>
            ← back
          </a>
        </p>
      ) : null}

      <div className="hero">
        <h2 id="focus-h" ref={headingRef} tabIndex={-1}>
          {card.name}
        </h2>
        <p className="small muted">
          {card.classLabel} · lv {card.level} · {[card.activity, card.map].filter(Boolean).join(' · ')}
        </p>
      </div>

      {card.info.length > 0 ? (
        <ul className="info-lines small muted" aria-label="Info">
          {card.info.map((l) => (
            <li key={l.key}>
              {l.text} {l.source ? <SourceLabel source={l.source} more={false} /> : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className={`verdict ${card.pill.kind}`}>
        <Pill pill={card.pill} />
        {card.unknown ? (
          <div className="unknown">
            <p>
              <b>Unknown:</b> {card.unknown.text}
            </p>
            {card.unknown.suggestion ? <NextActionItem action={card.unknown.suggestion} /> : null}
            {card.unknown.skipKey ? (
              <div className="controls">
                {card.unknown.skipped ? (
                  <button
                    type="button"
                    className="ghost tiny"
                    onClick={() => actions.unskip([card.unknown?.skipKey ?? ''])}
                  >
                    skipped · undo
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ghost tiny"
                    onClick={() => actions.skip(card.unknown?.skipKey ?? '')}
                  >
                    Skip today
                  </button>
                )}
                <ReportThis
                  input={{
                    outputKind: 'verdict',
                    entryIds: [],
                    fields: [],
                    text: card.unknown.text,
                    stale: false,
                    contested: false,
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
        {card.blockers.length > 0 ? (
          <ul className="goals blockers">
            {card.blockers.map((g) => (
              <li key={g.action.key}>
                <NextActionItem action={g.action} milestone={g.milestone} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {card.purpose.length > 0 ? (
        <section aria-label="Purpose" className="purpose">
          <h3 className="section-h">Purpose</h3>
          <ul>
            {card.purpose.map((p) => (
              <li key={p.goalId}>
                {p.text} {p.source ? <SourceLabel source={p.source} more={false} /> : null}{' '}
                <ReportThis
                  input={{
                    outputKind: 'purpose',
                    entryIds: [p.goalId],
                    fields: [],
                    text: p.text,
                    stale: p.badges.includes('stale'),
                    contested: p.badges.includes('contested'),
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <GoalList
        goals={card.goals}
        subject={`c${card.index}`}
        hiddenCount={card.hiddenCount}
        skipped={card.skippedKeys}
        dismissed={card.dismissed}
        highlightFirst
      />

      {card.higherLeverage ? (
        <div className="hl">
          <p>
            <b>Better fit:</b>{' '}
            {card.higherLeverage.partner ? (
              <>
                <a
                  href={`?c=${card.higherLeverage.partner.index}`}
                  onClick={(e) => go(e, card.higherLeverage?.partner?.index ?? card.index)}
                >
                  {card.higherLeverage.partner.name}
                </a>{' '}
              </>
            ) : null}
            {card.higherLeverage.text}
          </p>
          <p className="why small">Why: {card.higherLeverage.why}</p>
          <details className="small">
            <summary>How this was decided</summary>
            <p>Decided by {card.higherLeverage.decidedBy}.</p>
            {card.higherLeverage.alsoConsidered.length ? (
              <ul>
                {card.higherLeverage.alsoConsidered.map((a) => (
                  <li key={a.text}>
                    Also considered: {a.text} ({a.reason})
                  </li>
                ))}
              </ul>
            ) : null}
          </details>
          <SourceLabel source={card.higherLeverage.source} />
          <ActionControls
            actionKey={card.higherLeverage.key}
            controls={card.higherLeverage.controls}
            report={{
              outputKind: 'higher-leverage',
              entryIds: [],
              fields: [],
              text: card.higherLeverage.text,
              stale: card.higherLeverage.stale,
              contested: false,
            }}
          />
        </div>
      ) : card.higherLeverageNote ? (
        <p className="small muted">{card.higherLeverageNote}</p>
      ) : null}

      {card.activePlay.length > 0 ? (
        <section aria-label="Active play" className="small">
          <h3 className="section-h">Active play</h3>
          <ul>
            {card.activePlay.map((a) => (
              <li key={a.key}>
                {a.text} · {a.estimate}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {card.done.length > 0 ? (
        <details className="done small">
          <summary>Done this session ({card.done.length})</summary>
          <ul>
            {card.done.map((d) => (
              <li key={d.key}>
                <s>{d.text}</s> <span className="muted num">{d.time}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="focus-foot">
        <button type="button" className="primary" onClick={() => onNext(card.next.index)}>
          {card.next.text}
        </button>
        <button type="button" className="ghost" onClick={onBack}>
          ← All characters
        </button>
        <a className="small" href={onConfusing()} target="_blank" rel="noopener noreferrer">
          Something confusing here?
        </a>
      </div>
    </section>
  );
});
