// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 F1 the Daily & Weekly Checklist section (docs/specs/M20-skills-parallel-slots.md FR-12 to FR-15): one
// line with the two rings (today, this week) and the daily reset, then three bands (no bank, banks,
// weekly) with to-do rows first and done rows folded. Each row shows a glyph and a word for its state
// (never colour alone), what to do, how long, when it resets, and links to the Goal that already carries
// it instead of repeating it (FR-8). The engine and view model word everything; this file only renders.
import type {
  ChecklistBandView,
  ChecklistRowView,
  ChecklistView,
  TimelineFix,
} from '@idleon-forge/engine/now';
import { LINK_WORDS, PLACE_WORDS } from '@idleon-forge/engine/now';
import { formatRoute } from '../shell/route';
import { useNowActions } from './context';
import { SourceLabel } from './parts';
import './checklist.css';

/** The rings: an arc per ring, the counts as text beside them (FR-6). */
function Rings({ v }: { v: ChecklistView }) {
  const arc = (done: number, total: number, r: number) => {
    const c = 2 * Math.PI * r;
    const f = total > 0 ? done / total : 0;
    return { strokeDasharray: `${c * f} ${c}`, r };
  };
  const t = arc(v.rings.today.done, v.rings.today.total, 18);
  const w = arc(v.rings.week.done, v.rings.week.total, 11);
  return (
    <svg className="cl-rings" viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
      <circle className="cl-track" cx="22" cy="22" r={t.r} />
      <circle className="cl-today" cx="22" cy="22" r={t.r} strokeDasharray={t.strokeDasharray} />
      <circle className="cl-track" cx="22" cy="22" r={w.r} />
      <circle className="cl-week" cx="22" cy="22" r={w.r} strokeDasharray={w.strokeDasharray} />
    </svg>
  );
}

/**
 * Where a linked Goal or "If you have time" item lives: a character Goal (`…@cN`) on that character's
 * Now tab, everything else in the account list or the "If you have time" list on the Now screen.
 */
export function linkFix(link: NonNullable<ChecklistRowView['link']>, inDom: boolean): TimelineFix {
  const m = /@c(\d+)$/.exec(link.key);
  if (link.kind === 'goal' && m)
    return { subject: `c${Number(m[1])}`, key: link.key, where: 'focus', expand: 'show-more' };
  return {
    subject: 'account',
    key: link.key,
    where: 'account',
    // Behind the account list's "show more" when it isn't on the page yet.
    expand: link.kind === 'goal' && !inDom ? 'show-more' : null,
  };
}

function RowLink({ r }: { r: ChecklistRowView }) {
  const actions = useNowActions();
  if (r.link) {
    const link = r.link;
    const target = link.kind === 'goal' ? 'in your list' : 'If you have time';
    return (
      <a
        className="small cl-link"
        href={`#na-${encodeURIComponent(link.key)}`}
        onClick={(e) => {
          e.preventDefault();
          const el = document.querySelector(`[data-na-key="${CSS.escape(link.key)}"]`);
          if (actions.reveal) actions.reveal(linkFix(link, el !== null));
          else el?.scrollIntoView?.({ block: 'center' });
        }}
      >
        {target} ↓
      </a>
    );
  }
  if (r.timeline && actions.result?.timeline)
    return (
      <a
        className="small cl-link"
        href={formatRoute({ place: 'timeline' })}
        onClick={(e) => {
          e.preventDefault();
          actions.navigate?.({ place: 'timeline' });
        }}
      >
        {LINK_WORDS.seeIt(PLACE_WORDS.timeline)}
      </a>
    );
  const system = actions.result?.systems?.find((s) => s.id === r.systemId);
  if (!system || !actions.navigate) return null;
  return (
    <a
      className="small cl-link"
      href={formatRoute({ place: 'system', id: r.systemId })}
      onClick={(e) => {
        e.preventDefault();
        actions.navigate?.({ place: 'system', id: r.systemId });
      }}
    >
      {LINK_WORDS.seeIt(system.name)}
    </a>
  );
}

function Row({ r }: { r: ChecklistRowView }) {
  const actions = useNowActions();
  const until = r.manual
    ? (actions.result?.checklist?.rows.find((x) => x.id === r.id)?.periodEnd ?? null)
    : null;
  return (
    <li className={`cl-row s-${r.state}${r.lostBeforeReturn ? ' lost' : ''}`}>
      <p className="cl-head">
        <span className="cl-state">
          <span aria-hidden="true">{r.glyph}</span> {r.stateWord}
        </span>{' '}
        <b>{r.nextAction ?? r.label}</b>
      </p>
      {r.details.length ? <p className="small cl-detail">{r.details.join(' · ')}</p> : null}
      <p className="small muted cl-meta">
        {[
          r.availableText,
          r.clockText,
          r.lostBeforeReturn ? 'lost before you are back' : null,
          r.effort,
          r.doneAt,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <div className="cl-actions">
        {r.manual ? (
          <button
            type="button"
            className={`ghost cl-tick${r.manual.ticked ? ' on' : ''}`}
            aria-pressed={r.manual.ticked}
            onClick={() => actions.tick?.(r.manual?.key ?? '', r.manual?.ticked ? null : until)}
          >
            {r.manual.ticked ? 'Done ✓ · undo' : 'Done'}
          </button>
        ) : null}
        {r.manual ? <span className="small muted">{r.manual.hint}</span> : null}
        <RowLink r={r} />
        {r.source ? <SourceLabel source={r.source} more={false} /> : null}
      </div>
    </li>
  );
}

function Band({ b }: { b: ChecklistBandView }) {
  const actions = useNowActions();
  const id = `cl-done-${b.band}`;
  const open = actions.expanded.has(id);
  return (
    <section className="cl-band" aria-label={b.title}>
      <h3 className="cl-band-h">{b.title}</h3>
      {b.rows.length ? (
        <ul className="cl-rows">
          {b.rows.map((r) => (
            <Row key={r.id} r={r} />
          ))}
        </ul>
      ) : null}
      {b.done.length ? (
        <>
          <button
            type="button"
            className="ghost cl-fold"
            aria-expanded={open}
            onClick={() => actions.toggle(id)}
          >
            {b.done.length} done · {open ? 'hide' : 'show'}
          </button>
          {open ? (
            <ul className="cl-rows">
              {b.done.map((r) => (
                <Row key={r.id} r={r} />
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
      {b.later.length ? <p className="small muted">Opens later: {b.later.join('; ')}</p> : null}
    </section>
  );
}

/** FR-12: at the top of the Account section, below the account blockers. */
export function ChecklistSection({ view }: { view: ChecklistView | null }) {
  const actions = useNowActions();
  if (!view) return null;
  // Collapsed by default; open by default when a row is lost before the return (the toggle inverts it).
  const flipped = actions.expanded.has('checklist');
  const open = view.expanded ? !flipped : flipped;
  return (
    <details
      className="checklist card"
      id="checklist"
      open={open}
      onToggle={(e) => {
        const now = (e.currentTarget as HTMLDetailsElement).open;
        if (now !== open) actions.toggle('checklist');
      }}
    >
      <summary className="cl-summary">
        <Rings v={view} />
        <span className="cl-sum-text">
          <b>Daily &amp; Weekly</b> <span className="num">{view.ringText}</span>
          <span className="small muted cl-daily"> · {view.dailyText}</span>
        </span>
      </summary>
      <p className="small muted">{view.weekWhy}</p>
      {view.bands.map((b) => (
        <Band key={b.band} b={b} />
      ))}
    </details>
  );
}
