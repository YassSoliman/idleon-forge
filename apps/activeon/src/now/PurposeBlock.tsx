// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4's Purpose in the Focus card (M21 `now.focus-purpose` Quest line, with `character.now-tab`'s Purpose
// ladder folded to three rungs): one "Quest" line with a bar that fills from the save, then where it is,
// what is next and the step after. A tap opens its sheet: the Source, the other Purpose lines and Report
// this, so the face carries no control of its own (DS-10). Every word and number comes from the engine.
import { FOCUS_WORDS, type FocusCard, type PurposeItemView } from '@idleon-forge/engine/now';
import { useState } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { SourceLabel } from '../design/atoms';
import { cx } from '../design/atoms/Button';
import { Meter } from '../design/atoms/Meter';
import { ModalSheet as Sheet } from './chrome/ModalSheet';
import { ReportThis } from './parts';

const report = (p: PurposeItemView) => (
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
);

function Line({ p }: { p: PurposeItemView }) {
  return (
    <li className={cx('purpose-line', !p.worthwhile && 'quiet')}>
      <span>{p.text}</span>
      {p.detail ? <span className="n-muted"> ({p.detail})</span> : null}
      {p.source ? (
        <span className="n-small">
          {' '}
          <SourceLabel source={p.source} more={false} />
        </span>
      ) : null}
      {report(p)}
    </li>
  );
}

export function PurposeBlock({ card }: { card: FocusCard }) {
  const [open, setOpen] = useState(false);
  const [head, ...rest] = card.purpose;
  if (!head) return null;
  const shown = rest.filter((p) => !p.more);
  return (
    <section aria-label="Purpose" className="purpose n-quest">
      <div className={cx('n-quest__line quest', !head.worthwhile && 'quiet')}>
        <button type="button" className="n-quest__open" aria-haspopup="dialog" onClick={() => setOpen(true)}>
          <span className="n-quest__k">
            <PixelArt name="cards-scroll-open-16" decorative />
            {FOCUS_WORDS.quest}
          </span>
          {head.echoesGoal ? (
            // The first Goal below says this line already: show it once, keep the bar and the ladder.
            <span className="sr-only">{head.text}</span>
          ) : (
            <span className="n-quest__t quest-line">
              {head.text}
              {head.detail ? <span className="n-muted"> ({head.detail})</span> : null}
            </span>
          )}
        </button>
        {head.bar ? (
          <Meter
            value={head.bar.current}
            max={head.bar.next}
            label={`${Math.round((Math.min(head.bar.current, head.bar.next) / head.bar.next) * 100)}% of the way to the next step`}
            tone={head.worthwhile ? 'ok' : 'muted'}
          />
        ) : null}
        {head.ladder.length > 0 ? (
          <ol className="n-ladder ladder" aria-label="Milestones">
            {head.ladder.slice(0, 3).map((l) => (
              <li key={l.state} className={`n-ladder__rung is-${l.state}`}>
                <b className="num">{l.label}</b>
                {l.note ? <small className="num">{l.note}</small> : null}
              </li>
            ))}
          </ol>
        ) : null}
      </div>
      {shown.length > 0 ? (
        <ul className="n-quest__rest">
          {shown.map((p) => (
            <li key={p.goalId} className={cx(!p.worthwhile && 'quiet')}>
              {p.text}
            </li>
          ))}
        </ul>
      ) : null}
      <Sheet open={open} title={FOCUS_WORDS.quest} onClose={() => setOpen(false)}>
        <ul className="n-quest__all">
          {card.purpose.map((p) => (
            <Line key={p.goalId} p={p} />
          ))}
        </ul>
      </Sheet>
    </section>
  );
}
