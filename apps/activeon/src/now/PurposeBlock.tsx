// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Character page's side column (M24 board `CharNow`): M4's Purpose and the modules' info lines,
// sorted by what kind of time they carry. "Timers" are real countdowns from the save (blue: the next
// class level "in 58m", the anvil "full in 5h 08m"); "About, on average" are drop-rate and kill-rate
// expectations, said as "about" and never drawn as a countdown bar (red team, CharNow). One button opens
// the sheet with every line's Source and Report this (DS-10). Every word and number is the engine's.
import type { FocusCard, PurposeItemView } from '@idleon-forge/engine/now';
import { useState } from 'react';
import { PAGE_WORDS } from '../characters/words';
import { SourceLabel } from '../design/atoms';
import { cx } from '../design/atoms/Button';
import { SeeOnMap } from '../map/SeeOnMap';
import { ModalSheet as Sheet } from './chrome/ModalSheet';
import { ReportThis } from './parts';

/** M21 FR-M7: a portal line (`portals.goal.map-<n>`) is about one map; null for every other line. */
const mapOf = (p: PurposeItemView): number | null => {
  const m = /^portals\.goal\.map-(\d+)$/.exec(p.goalId);
  return m ? Number(m[1]) : null;
};

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
      <SeeOnMap mapIndex={mapOf(p)} label={p.text} />
      {report(p)}
    </li>
  );
}

/** A Purpose line whose next rung is a real countdown ("in 58m"), not an average. */
function timerOf(p: PurposeItemView): { what: string; when: string; detail: string } | null {
  const next = p.ladder.find((l) => l.state === 'next');
  if (!next || !/^in\s/.test(next.note)) return null;
  // "Class level 70 → 71 · about 58m": the countdown says the time, so the line keeps its first part.
  return { what: next.label, when: next.note, detail: p.text.split(' · ')[0] ?? p.text };
}

export function PurposeBlock({ card }: { card: FocusCard }) {
  const [open, setOpen] = useState(false);
  const shown = card.purpose.filter((p) => !p.more);
  const timers = shown.flatMap((p) => {
    const t = timerOf(p);
    return t ? [{ key: p.goalId, ...t }] : [];
  });
  const timed = new Set(timers.map((t) => t.key));
  // A line the hero's Goal already says (the portal push) shows once, in the hero (rule: say it once).
  const abouts = shown.filter((p) => !timed.has(p.goalId) && !p.echoesGoal);
  if (timers.length === 0 && card.info.length === 0 && abouts.length === 0) return null;
  return (
    <aside className="cp-side purpose" aria-label="Purpose">
      {timers.length > 0 || card.info.length > 0 ? (
        <section className="cp-side-sec" aria-label={PAGE_WORDS.timers}>
          <h3 className="cp-cap">{PAGE_WORDS.timers}</h3>
          {timers.map((t) => (
            <div key={t.key} className="cp-timer">
              <p className="cp-timer-top">
                <b>{t.what}</b>
                <b className="cp-sky num">{t.when}</b>
              </p>
              <p className="cp-xs">{t.detail}</p>
            </div>
          ))}
          {card.info.map((l) => (
            <div key={l.key} className="cp-timer">
              <p className="cp-timer-top">
                <b>{l.text}</b>
              </p>
              {l.source ? (
                <p className="cp-xs">
                  <SourceLabel source={l.source} more={false} />
                </p>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}
      {abouts.length > 0 ? (
        <section className="cp-side-sec" aria-label={PAGE_WORDS.about}>
          <h3 className="cp-cap">{PAGE_WORDS.about}</h3>
          <ul className="cp-about">
            {abouts.map((p) => (
              <li key={p.goalId} className={cx(!p.worthwhile && 'quiet')}>
                <span className="cp-about-t">{p.text}</span>
                {p.detail ? <span className="cp-xs">{p.detail}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {card.purpose.length > 0 ? (
        <button
          type="button"
          className="n-link-btn cp-side-more"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          {PAGE_WORDS.details}
        </button>
      ) : null}
      <Sheet open={open} title={PAGE_WORDS.details} onClose={() => setOpen(false)}>
        <ul className="n-quest__all">
          {card.purpose.map((p) => (
            <Line key={p.goalId} p={p} />
          ))}
        </ul>
      </Sheet>
    </aside>
  );
}
