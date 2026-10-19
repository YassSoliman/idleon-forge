// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The answer first (M21 FR-N1, FR-N2, DS-1, DS-11): the stale-first banner, the counter that reaches
// zero with its first fix, the Unknown fold, and the Expected Return line.
// - `now.verdict-banner` Counter that reaches zero: a big tabular number and "fixes before you leave",
//   the first fix as one button row (who · where · how long, then its verb). Fix times show only with a
//   real `fixSeconds` (none ship yet, D-10), so the time token is hidden (DS-3, DS-23). At zero: "All set:
//   safe to log off" with the campfire, in the Quest Log parchment frame, and M3's first-fill line.
// - Stale-first wording (DS-11, M10's rule: the save is older than the Expected Return): the save's age
//   is the first sentence and carries its fix; the counter is demoted to "last known".
// - `now.return-chips` Learned default: "Back in about 8h · Change", with the consequence sentence; the
//   chips open in a sheet, or stay inline when Settings says "Always ask" (G10).
// Every word is the engine's (`COUNTER_WORDS`, `RETURN_WORDS`); times go through design/format.ts.
import { COUNTER_WORDS, type NowView, RETURN_WORDS } from '@idleon-forge/engine/now';
import type { EngineResult } from '@idleon-forge/engine/result';
import { useState } from 'react';
import { PixelArt } from '../../design/art/PixelArt';
import { Button } from '../../design/atoms/Button';
import { GLYPH } from '../../design/atoms/glyphs';
import { TokenLine } from '../../design/atoms/TokenLine';
import { ago, localOffsetMinutes, moment, span } from '../../design/format';
import { formatRoute } from '../../shell/route';
import { useNow } from '../../use-now';
import { ExpectedReturnChips } from '../Chrome';
import type { CounterView, WhoToken } from '../session/types';
import type { Settings } from '../settings/settings-store';
import { LazySheet as Sheet } from './LazySheet';

/** M10 §6: a save older than the Expected Return is stale; the screen says so before anything is safe. */
export function staleAge(now: number, lastCloudSave: number | null, expectedReturnSeconds: number) {
  if (lastCloudSave === null) return null;
  const age = now - lastCloudSave;
  return age > expectedReturnSeconds * 1000 ? age : null;
}

/** `flows.stale` Stale-first banner: the age first, with its fix (Cloud Save). */
export function StaleBanner({ ageMs, lastKnown }: { ageMs: number; lastKnown: number | null }) {
  return (
    <section className="n-vb n-vb--stale" role="status" aria-label={COUNTER_WORDS.stale(span(ageMs))}>
      <div className="n-vb__top">
        <PixelArt name="now-glyph-stale" scale={3} decorative />
        <p className="n-vb__title">{COUNTER_WORDS.stale(span(ageMs))}</p>
      </div>
      {lastKnown !== null ? <p className="n-vb__lastknown">{COUNTER_WORDS.lastKnown(lastKnown)}</p> : null}
    </section>
  );
}

function SaveAgeLine({ lastCloudSave }: { lastCloudSave: number | null }) {
  const now = useNow();
  return lastCloudSave === null ? null : (
    <span className="num">{COUNTER_WORDS.age(ago(lastCloudSave, now))}</span>
  );
}

export interface CounterProps {
  view: NowView;
  counter: CounterView;
  lastCloudSave: number | null;
  /** The counter is demoted under a stale banner. */
  stale: boolean;
  onFirst(key: string, who: WhoToken | null): void;
  /** The Unknown fold is open (`expanded` 'unknown-fold'). */
  unknownOpen: boolean;
  onUnknown(): void;
  /** The first-fill line links to the Timeline (M17 FR-32) when the Timeline is there. */
  onTimeline: (() => void) | null;
  /** G10 "Around 20:10": the first-fill moment as a clock time; null keeps "in 3h 40m". */
  fillAt?: { at: number; settings: Settings } | null;
  /**
   * R11 QA: the AFK strip's `allSetDetail` (already full, next to fill, in the Times setting). When
   * given it replaces the engine's first-fill line, so All set says what the strip and return line say.
   */
  afkDetail?: string | null;
}

export function Counter({
  view,
  counter,
  lastCloudSave,
  stale,
  onFirst,
  unknownOpen,
  onUnknown,
  onTimeline,
  fillAt = null,
  afkDetail = null,
}: CounterProps) {
  const p = view.progress;
  const sub = (
    <p className="n-vb__sub">
      <span className="num">{`${p.ready} of ${p.total} ready`}</span>
      {lastCloudSave !== null ? ' · ' : null}
      <SaveAgeLine lastCloudSave={lastCloudSave} />
    </p>
  );
  const fold = counter.unknown ? (
    <button
      type="button"
      className="n-fold-btn"
      aria-expanded={unknownOpen}
      aria-controls="n-unknown-fold"
      onClick={onUnknown}
    >
      <PixelArt name="now-glyph-question" decorative />
      <span>{counter.unknown.text}</span>
    </button>
  ) : null;

  if (counter.allSet) {
    const a = counter.allSet;
    const fill = !a.covered
      ? a.firstFill
      : afkDetail !== null
        ? afkDetail
        : a.firstFill && fillAt && fillAt.settings.times === 'clock'
          ? a.firstFill.replace(
              /^First thing fills up in [^:]+:/,
              `First thing fills up ${moment(fillAt.at, Date.now(), 'clock', localOffsetMinutes(fillAt.at))}:`,
            )
          : a.firstFill;
    return (
      <section
        className="n-vb n-vb--ok"
        data-direction={a.covered ? 'quest' : undefined}
        aria-labelledby="n-vb-title"
      >
        <div className="n-vb__top">
          {a.covered ? <PixelArt name="now-campfire" scale={2} decorative /> : null}
          <div className="n-vb__txt">
            <h2 className="n-vb__title" id="n-vb-title">
              {a.text}
            </h2>
            {fill ? (
              <p className="n-vb__sub">
                {onTimeline ? (
                  <a
                    href={formatRoute({ place: 'timeline', section: null })}
                    onClick={(e) => {
                      e.preventDefault();
                      onTimeline();
                    }}
                  >
                    {fill}
                  </a>
                ) : (
                  fill
                )}
              </p>
            ) : (
              sub
            )}
          </div>
        </div>
        {fold}
      </section>
    );
  }

  const first = counter.first;
  return (
    <section className={`n-vb n-vb--fix${stale ? ' is-demoted' : ''}`} aria-labelledby="n-vb-title">
      <div className="n-vb__top">
        <PixelArt name="now-bell" scale={3} decorative />
        <span className="n-vb__n num" aria-hidden="true">
          {counter.count}
        </span>
        <div className="n-vb__txt">
          {/* The big number is drawn beside it (aria-hidden); the heading says the whole line. */}
          <h2 className="n-vb__title" id="n-vb-title" aria-label={counter.line}>
            {counter.sentence}
          </h2>
          {sub}
        </div>
      </div>
      {first ? (
        <button type="button" className="n-first a-frame" onClick={() => onFirst(first.key, first.who)}>
          <span className="n-first__k">{COUNTER_WORDS.first}</span>
          <span className="n-first__t">{first.text}</span>
          <TokenLine
            who={first.who ? { family: first.who.family, label: first.who.label } : null}
            where={first.where}
            howLong={first.howLong}
          />
          <PixelArt name={GLYPH.arrowRight} decorative className="n-first__go" />
        </button>
      ) : null}
      {fold}
    </section>
  );
}

/** The consequence sentence: "Plans for 8h away · the anvil on Bowman 60 fills first, in 3h 40m". */
function plan(
  result: EngineResult,
  view: NowView,
  now: number,
  settings: Settings,
  facts: string | null,
): string {
  const seconds = result.expectedReturn.usedSeconds;
  const f = result.firstFill;
  const back = RETURN_WORDS.plans(span(seconds * 1000));
  // R11 QA: the AFK strip's own facts (full now, next to fill), so the two lines never disagree.
  if (facts !== null) return `${back} · ${facts}`;
  if (!f || f.at > now + seconds * 1000) return `${back} · ${RETURN_WORDS.nothingFills}`;
  const row = /^c(\d+)$/.exec(f.subject)
    ? view.roster.find((r) => r.index === Number(f.subject.slice(1)))
    : undefined;
  const what = row
    ? `the ${f.what ?? f.label} on ${row.classLabel} ${row.level}`
    : `the ${f.what ?? f.label}`;
  const when = f.at <= now ? 'now' : moment(f.at, now, settings.times, localOffsetMinutes(f.at));
  return `${back} · ${RETURN_WORDS.fillsFirst(what, when)}`;
}

export function ReturnLine({
  view,
  result,
  settings,
  updating,
  onPick,
  facts = null,
}: {
  view: NowView;
  result: EngineResult;
  settings: Settings;
  updating: boolean;
  onPick(seconds: number): void;
  /** The AFK strip's `returnFacts` (R11 QA); without a strip the line reads `result.firstFill`. */
  facts?: string | null;
}) {
  const now = useNow(60_000);
  const [open, setOpen] = useState(false);
  const chips = view.expectedReturn.chips;
  const pressed = chips.find((c) => c.pressed);
  const sentence = plan(result, view, now, settings, facts);
  if (settings.back === 'ask')
    return (
      <div className="n-return n-return--ask">
        <ExpectedReturnChips chips={chips} updating={updating} onPick={onPick} />
        <p className="n-return__plan">{sentence}</p>
      </div>
    );
  return (
    <div className="n-return">
      <p className="n-return__line">
        <PixelArt name={GLYPH.howLong} decorative />
        <span>
          {RETURN_WORDS.lead}{' '}
          <b className="num">{pressed?.label ?? span(result.expectedReturn.usedSeconds * 1000)}</b>
        </span>
        <Button tone="quiet" onClick={() => setOpen(true)} aria-haspopup="dialog">
          {RETURN_WORDS.change}
        </Button>
      </p>
      <p className="n-return__plan">{sentence}</p>
      <Sheet open={open} title={RETURN_WORDS.sheetTitle} onClose={() => setOpen(false)}>
        <ExpectedReturnChips
          chips={chips}
          updating={updating}
          onPick={(seconds) => {
            onPick(seconds);
            setOpen(false);
          }}
        />
        <p className="n-return__plan">{sentence}</p>
        {result.expectedReturn.learnedSeconds === null ? (
          <p className="n-muted n-small">{RETURN_WORDS.learning}</p>
        ) : null}
      </Sheet>
    </div>
  );
}
