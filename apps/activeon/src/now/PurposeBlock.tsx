// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4's Purpose block in the Focus card's Now tab (Design Lab `now.focus-purpose`: the "Quest line" with
// the "Milestone ladder" under it). The headline is one line with a bar that fills from the save, then
// done / next / later; the next two Purpose lines follow, and the rest sit behind "show more" (FR-11).
// Every word and number comes from the engine; this file only lays them out.
import type { FocusCard, PurposeItemView } from '@idleon-forge/engine/now';
import { ReportThis, SourceLabel } from './parts';

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
    <li className={p.worthwhile ? 'purpose-line' : 'purpose-line quiet'}>
      {p.text}
      {p.detail ? <span className="small muted"> ({p.detail})</span> : null}{' '}
      {p.source ? <SourceLabel source={p.source} more={false} /> : null} {report(p)}
    </li>
  );
}

export function PurposeBlock({ card }: { card: FocusCard }) {
  const [head, ...rest] = card.purpose;
  if (!head) return null;
  const shown = rest.filter((p) => !p.more);
  const more = rest.filter((p) => p.more);
  const fill = head.bar ? Math.max(0, Math.min(1, head.bar.current / head.bar.next)) : null;
  return (
    <section aria-label="Purpose" className="purpose">
      <h3 className="section-h">Purpose</h3>
      <div className={`quest${head.worthwhile ? '' : ' quiet'}`}>
        <p className="quest-line">
          {head.text}
          {head.detail ? <span className="small muted"> ({head.detail})</span> : null}
        </p>
        {fill !== null ? (
          <div
            className="quest-bar"
            role="img"
            aria-label={`${Math.round(fill * 100)}% of the way to the next step`}
          >
            <span style={{ width: `${Math.round(fill * 100)}%` }} />
          </div>
        ) : null}
        {head.ladder.length > 0 ? (
          <ol className="ladder" aria-label="Milestones">
            {head.ladder.map((l) => (
              <li key={l.state} className={`is-${l.state}`}>
                <b>{l.label}</b>
                {l.note ? <small>{l.note}</small> : null}
              </li>
            ))}
          </ol>
        ) : null}
        <p className="small">
          {head.source ? <SourceLabel source={head.source} more={false} /> : null} {report(head)}
        </p>
      </div>
      {shown.length > 0 ? (
        <ul>
          {shown.map((p) => (
            <Line key={p.goalId} p={p} />
          ))}
        </ul>
      ) : null}
      {more.length > 0 ? (
        <details className="small">
          <summary>show more ({more.length})</summary>
          <ul>
            {more.map((p) => (
              <Line key={p.goalId} p={p} />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
