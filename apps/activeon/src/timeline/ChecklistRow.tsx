// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// One Daily & Weekly checklist row (M20 FR-12 to FR-15, redrawn by M21 FR-T2), as the Timeline's
// `#daily` sheet and the Five-minute plan show it: a glyph and a word for its state (never colour alone),
// what to do, its bank pips, how long, when it resets, the Done tick for a row the save can't judge
// (FR-15), and the link to the Goal that already carries it (FR-8). The engine and view model word
// everything; this file only renders. It lives with the Timeline so it never joins the first load.
import type { ChecklistRowView, TimelineFix } from '@idleon-forge/engine/now';
import { LINK_WORDS, PLACE_WORDS } from '@idleon-forge/engine/now';
import { GameIcon } from '../art/game/GameIcon';
import { PixelArt } from '../design/art/PixelArt';
import { Button, cx, SourceLabel } from '../design/atoms';
import { useNowActions } from '../now/context';
import { formatRoute } from '../shell/route';
import { rowArt, rowGameArt } from './art';
import { bankPips } from './daily-model';
import { DAILY_WORDS } from './words';

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
        className="cl-link"
        href={`#na-${encodeURIComponent(link.key)}`}
        aria-label={`${target} ↓`}
        onClick={(e) => {
          e.preventDefault();
          const el = document.querySelector(`[data-na-key="${CSS.escape(link.key)}"]`);
          if (actions.reveal) actions.reveal(linkFix(link, el !== null));
          else el?.scrollIntoView?.({ block: 'center' });
        }}
      >
        {target}
        <PixelArt name="ui-arrow-right" decorative />
      </a>
    );
  }
  if (r.timeline && actions.result?.timeline)
    return (
      <a
        className="cl-link"
        href={formatRoute({ place: 'timeline', section: null })}
        onClick={(e) => {
          e.preventDefault();
          actions.navigate?.({ place: 'timeline', section: null });
        }}
      >
        {LINK_WORDS.seeIt(PLACE_WORDS.timeline)}
      </a>
    );
  const system = actions.result?.systems?.find((s) => s.id === r.systemId);
  if (!system || !actions.navigate) return null;
  return (
    <a
      className="cl-link"
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

/** M21 FR-T2 "Bank pips calendar": 0 to 3 kept days, the last one red ("lost tomorrow"), then the lost. */
export function DayPips({ kept, lost }: { kept: number; lost: number }) {
  return (
    <span className="cl-pips" role="img" aria-label={DAILY_WORDS.pips(kept, lost)}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={cx('cl-pip', i < kept && 'is-on', i === 2 && 'is-last')} />
      ))}
      {Array.from({ length: Math.min(lost, 3) }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a fixed count of identical pips
        <span key={`l${i}`} className="cl-pip is-lost" />
      ))}
    </span>
  );
}

/** One checklist row, as the Daily & Weekly sheet and the Five-minute plan show it. */
export function ChecklistRow({ r }: { r: ChecklistRowView }) {
  const actions = useNowActions();
  const until = r.manual
    ? (actions.result?.checklist?.rows.find((x) => x.id === r.id)?.periodEnd ?? null)
    : null;
  const { pips, rest } = bankPips(r.details);
  return (
    <li className={`cl-row s-${r.state}${r.lostBeforeReturn ? ' lost' : ''}`}>
      <span className="cl-ic">
        <GameIcon
          art={rowGameArt(r.id)}
          fallback={<PixelArt name={rowArt(r.id)} decorative animate={false} />}
          size={32}
          decorative
        />
      </span>
      <div className="cl-m">
        <p className="cl-head">
          <span className="cl-state">
            <span aria-hidden="true">{r.glyph}</span> {r.stateWord}
          </span>{' '}
          <b>{r.nextAction ?? r.label}</b>
        </p>
        {pips.length ? (
          <ul className="cl-banks">
            {pips.map((p) => (
              <li key={p.name}>
                <span>{p.name}</span> <DayPips kept={p.kept} lost={p.lost} />
                {p.lost ? <span className="cl-lost"> {DAILY_WORDS.lost(p.lost)}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {rest.length ? <p className="cl-detail">{rest.join(' · ')}</p> : null}
        <p className="cl-meta">
          {[
            r.availableText,
            r.clockText,
            r.lostBeforeReturn ? DAILY_WORDS.lostBeforeBack : null,
            r.effort,
            r.doneAt,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className="cl-actions">
          {r.manual ? (
            <Button
              tone="quiet"
              className={`cl-tick${r.manual.ticked ? ' on' : ''}`}
              aria-pressed={r.manual.ticked}
              onClick={() => actions.tick?.(r.manual?.key ?? '', r.manual?.ticked ? null : until)}
            >
              {r.manual.ticked ? 'Done ✓ · undo' : 'Done'}
            </Button>
          ) : null}
          {r.manual ? <span className="cl-hint">{r.manual.hint}</span> : null}
          <RowLink r={r} />
          {r.source ? <SourceLabel source={r.source} more={false} /> : null}
        </div>
      </div>
    </li>
  );
}
