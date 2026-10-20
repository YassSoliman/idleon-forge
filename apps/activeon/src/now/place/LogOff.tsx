// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (area I-now): the Now place's Log off view, the board `after/Now` (and `NowPhone` at 390 px).
// Top to bottom: the hero (the one `.a-frame`: a one-word verdict, who and what, the account loss), the
// Away line, "Before you're back" (how long you're away, the mini-timeline with who-glyphs), the
// character cards in Visit Order with a state word that agrees with its pip, and the coins row.
// Every fact is the engine's (Now view, Timeline view, session view); `derive.ts` only groups them.

import type { NowView, TimelineView } from '@idleon-forge/engine/now';
import type { EngineResult } from '@idleon-forge/engine/result';
import { type CSSProperties, Fragment, forwardRef, type ReactNode } from 'react';
import { dataArt } from '../../art/game/game-art';
import { PixelArt } from '../../design/art/PixelArt';
import { Blob } from '../../design/atoms/Blob';
import { cx } from '../../design/atoms/Button';
import { SegmentedControl } from '../../design/atoms/Choice';
import { Frame, Pip } from '../../design/atoms/Surfaces';
import { TokenLine } from '../../design/atoms/TokenLine';
import { coins, inSpan } from '../../design/format';
import type { ClassFamily } from '../../design/who/WhoGlyph';
import { formatRoute } from '../../shell/route';
import { capGlyph } from '../chrome/cap-glyph';
import type { CounterView, NowSessionView } from '../session/types';
import { Badged } from './Badged';
import {
  awayParts,
  type CardState,
  cardState,
  type FullGroup,
  fullSet,
  type HeroState,
  type LossNow,
  miniMarks,
  nextLimit,
  type Payer,
  PIP,
  STATE_TONE,
  untimedGroups,
} from './derive';
import { Icon, systemSprite } from './icon';
import { rowTabChip } from './tab-chip';
import { NOW_PLACE_WORDS as W } from './words';

/** The game's gold coin (Toolbox data/Coins3): the money a Spend Plan line spends. */
const COIN = dataArt('Coins3');
/** A full group's System, from its words (the cap pill's own rule, capGlyph): its game sprite draws. */
const capSystem = (what: string): string | null =>
  /anvil/i.test(what)
    ? 'anvil'
    : /worship|prayer/i.test(what)
      ? 'worship'
      : /trap/i.test(what)
        ? 'trapping'
        : null;

type Vars = CSSProperties & Record<`--${string}`, string | number>;
const familyOf = (view: NowView, i: number): ClassFamily => view.families?.[i] ?? 'beginner';
/** M25: the game's class icon on the blob's corner (ClassBadge), as on the Characters list. */
const classOf = (view: NowView, i: number): string | undefined =>
  view.roster.find((r) => r.index === i)?.classLabel;
const whoLabel = (view: NowView, i: number) => {
  const r = view.roster.find((x) => x.index === i);
  return r ? `${r.classLabel} ${r.level}` : '';
};

/** A link that moves inside the app (pushState) and still works as a plain link. */
export const Go = forwardRef<
  HTMLAnchorElement,
  { href: string; onGo(): void; className?: string; children: ReactNode; label?: string; index?: number }
>(function Go({ href, onGo, className, children, label, index }, ref) {
  return (
    <a
      ref={ref}
      data-index={index}
      href={href}
      className={className}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        onGo();
      }}
    >
      {children}
    </a>
  );
});

export interface HeroProps {
  view: NowView;
  counter: CounterView;
  state: HeroState;
  groups: FullGroup[];
  losses: LossNow[];
  /** "8h", the Expected Return the verdict line says. */
  back: string;
  /** The Ready line's detail: the next thing that fills (the AFK strip's own words). */
  readyDetail: string | null;
  onOpen(index: number): void;
  onFirst(): void;
  onLoss(): void;
  onTimeline(): void;
  unknownOpen: boolean;
  onUnknown(): void;
  /** False while another block holds the screen's one frame (the World 4 welcome): a plain heading. */
  framed?: boolean;
  /** The Log off list (DO-CONFIRM: the save ticks it, never a tap). */
  ticks: { key: string; text: string; ticked: boolean }[];
}

/** The hero's box: the screen's one Frame, or a plain section while another block holds the frame. */
function HeroBox({
  framed,
  tone,
  state,
  children,
}: {
  framed: boolean;
  tone: 'coral' | 'gold' | 'ok';
  state: HeroState;
  children: ReactNode;
}) {
  return framed ? (
    <Frame tone={tone} pad={false} className="np-hero" data-tone={state} aria-labelledby="np-hero-title">
      {children}
    </Frame>
  ) : (
    <section className="np-hero np-plain" data-tone={state} aria-labelledby="np-hero-title">
      {children}
    </section>
  );
}

/** The hero: the answer first, in the one framed block of the screen. */
export function Hero(p: HeroProps) {
  const { view, counter, state, groups, losses, back } = p;
  const first = counter.first;
  const head = groups[0];
  const tone =
    state === 'fix' ? 'coral' : state === 'collect' ? 'gold' : state === 'ready' ? 'mint' : 'muted';
  // The frame's tint says what it holds (rule 7): coral a fix (losing if you leave), mint fine, gold collect.
  const frame = state === 'fix' ? 'coral' : state === 'ready' ? 'ok' : 'gold';
  const title =
    state === 'fix'
      ? (first?.text ?? counter.line)
      : state === 'collect' && head
        ? W.fullOn(head.what, head.indexes.length, whoLabel(view, head.indexes[0] ?? -1))
        : state === 'ready'
          ? W.safeFor(back)
          : W.cantTell;
  const sub =
    state === 'fix'
      ? W.fixesLeft(counter.count)
      : state === 'collect'
        ? W.thenSafe(back)
        : state === 'ready'
          ? null
          : null;
  return (
    <HeroBox framed={p.framed !== false} tone={frame} state={state}>
      <p className="np-hero__verdict">
        <span className={cx('a-display', `np-t-${tone}`)}>{W.verdict[state]}</span>
        {sub ? <span className="np-hero__then">{sub}</span> : null}
      </p>
      <h3 className="np-hero__title" id="np-hero-title">
        {title}
      </h3>
      {state === 'fix' && first ? (
        <button type="button" className="np-first" onClick={p.onFirst}>
          <TokenLine
            who={first.who ? { family: first.who.family, label: first.who.label } : null}
            where={first.where}
            howLong={first.howLong}
          />
          <span className="np-go">
            {first.who ? W.open(first.who.label) : W.showMe}
            <PixelArt name="ui-arrow-right" decorative />
          </span>
        </button>
      ) : null}
      {state === 'collect' && head ? (
        <>
          <p className="np-hero__why">{W.fullWhy(head.verb, counter.count === 0)}</p>
          <ul className="np-chips">
            {head.indexes.map((i) => (
              <li key={i}>
                <Go
                  href={formatRoute({ place: 'character', index: i, tab: 'now' })}
                  onGo={() => p.onOpen(i)}
                  className="np-chip"
                >
                  <Blob family={familyOf(view, i)} size={28} />
                  <span>{whoLabel(view, i)}</span>
                </Go>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {state === 'ready' && p.readyDetail ? (
        <p className="np-hero__why">
          <Go href={formatRoute({ place: 'timeline', section: null })} onGo={p.onTimeline}>
            {p.readyDetail}
          </Go>
        </p>
      ) : null}
      {groups.slice(state === 'collect' ? 1 : 0).map((g) => (
        <p key={g.entryId} className="np-hero__also">
          {capSystem(g.what) ? (
            <Icon name={systemSprite(capSystem(g.what))} size={16} />
          ) : (
            <PixelArt name={capGlyph(g.what)} decorative />
          )}
          {W.alsoFull(g.what, g.indexes.length)}
        </p>
      ))}
      {p.ticks.length > 0 ? (
        <ol className="np-ticks">
          {p.ticks.map((t) => (
            <li key={t.key} className={t.ticked ? 'is-ticked' : undefined}>
              <PixelArt name={t.ticked ? 'now-glyph-check' : 'now-glyph-wrench'} decorative />
              {t.ticked ? <s>{t.text}</s> : <span>{t.text}</span>}
              <span className="sr-only">{t.ticked ? 'done' : 'to do'}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {losses.map((l) => (
        <Go key={l.entryId} href="#daily" onGo={p.onLoss} className="np-loss">
          <Pip tone="coral" />
          <span className="np-loss__t">
            <b>{l.action ?? l.label}</b> <span className="np-t-coral">· {W.losingNow}</span>
          </span>
          <span className="np-go">
            {W.how}
            <PixelArt name="ui-arrow-right" decorative />
          </span>
        </Go>
      ))}
      {counter.unknown ? (
        <button
          type="button"
          className="n-fold-btn np-fold"
          aria-expanded={p.unknownOpen}
          aria-controls="n-unknown-fold"
          onClick={p.onUnknown}
        >
          <PixelArt name="now-glyph-question" decorative />
          <span>{counter.unknown.text}</span>
        </button>
      ) : null}
    </HeroBox>
  );
}

/** The Away line under the hero (red-team #3): what filled up and what is being lost, in one line. */
export function AwayLine({
  view,
  groups,
  losses,
}: {
  view: NowView;
  groups: FullGroup[];
  losses: LossNow[];
}) {
  const parts = awayParts(groups, losses, view, W);
  if (parts.length === 0) return null;
  return (
    <p className="np-away">
      <Icon name="status-clock" size={16} />
      <span>
        <b>{W.awayLead}</b> · {parts.join(' · ')}
      </span>
    </p>
  );
}

/** "Before you're back": how long you're away, then the mini-timeline of what fills before then. */
export function BackSection({
  view,
  timeline,
  before,
  onPick,
  onTimeline,
}: {
  view: NowView;
  timeline: TimelineView | null;
  /** How many limits bind before you're back (the Timeline badge's number). */
  before: number;
  onPick(seconds: number): void;
  onTimeline(): void;
}) {
  const chips = view.expectedReturn.chips;
  const pressed = chips.find((c) => c.pressed);
  const start = timeline?.axis.start ?? 0;
  const marks = miniMarks(timeline, view, (at) => inSpan(at - start));
  const charWhat = [...new Set(marks.filter((m) => m.index !== null).map((m) => m.what))];
  const accountMarks = marks.filter((m) => m.index === null);
  const accountLabels = [...new Set(accountMarks.map((m) => m.label))];
  const ret = timeline?.axis.returnAt ?? start;
  const ticks = (timeline?.axis.ticks ?? []).filter((t) => t.at <= ret + 60_000);
  return (
    <section className="np-back" aria-labelledby="np-back-h">
      <div className="np-back__head">
        <h3 id="np-back-h" className="a-h2">
          {W.backTitle}
        </h3>
        <div className="np-back__ask">
          <span className="np-muted" aria-hidden="true">
            {W.awayAsk}
          </span>
          <SegmentedControl<string>
            label={W.awayAsk}
            value={String(pressed?.seconds ?? '')}
            options={chips.map((c) => ({ value: String(c.seconds), label: c.label }))}
            onChange={(v) => onPick(Number(v))}
          />
        </div>
      </div>
      {timeline ? (
        <div className="np-axis-tile">
          <div className="np-axis">
            <span className="np-axis__rail" aria-hidden="true" />
            <span className="np-axis__now np-muted" aria-hidden="true">
              {W.now}
            </span>
            <span className="np-axis__back" aria-hidden="true">
              {W.back(pressed?.label ?? '')}
            </span>
            <ul className="np-axis__marks" aria-label={W.backTitle}>
              {marks.map((m) => (
                <li
                  key={m.key}
                  className={cx('np-mark', m.index === null && 'np-mark--account')}
                  data-row={m.row}
                  style={{ '--x': m.x } as Vars}
                  title={m.a11y}
                  aria-label={m.a11y}
                >
                  {m.index !== null ? (
                    <Blob family={familyOf(view, m.index)} size={18} />
                  ) : (
                    <Icon name={systemSprite(m.system)} size={16} />
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="np-ticks-row np-muted num" aria-hidden="true">
            <span className="np-tick" style={{ '--x': 0 } as Vars}>
              {W.now}
            </span>
            {ticks.map((t) => (
              <span
                key={t.at}
                className="np-tick"
                style={{ '--x': (t.at - start) / Math.max(1, ret - start) } as Vars}
              >
                {t.label}
              </span>
            ))}
          </div>
          {marks.length === 0 ? <p className="np-muted">{W.nothingBefore}</p> : null}
        </div>
      ) : null}
      <p className="np-key np-muted">
        {charWhat.length > 0 ? (
          <span className="np-key__i">
            <span className="np-key__sw" aria-hidden="true" />
            {W.keyChar(charWhat.length === 1 ? (charWhat[0] ?? null) : null)}
          </span>
        ) : null}
        {accountLabels.length > 0 ? (
          <span className="np-key__i">
            <Icon name={systemSprite(accountMarks[0]?.system)} size={16} />
            {W.keyAccount(accountLabels)}
          </span>
        ) : null}
        <span className="np-key__i">
          {before > 0 ? `${W.limitsInAll(before)} · ` : ''}
          <Go href={formatRoute({ place: 'timeline', section: null })} onGo={onTimeline}>
            {W.timeline}
          </Go>
        </span>
      </p>
    </section>
  );
}

const STATE_WORD: Record<CardState, string> = {
  fix: W.verdict.fix,
  collect: W.verdict.collect,
  ready: W.verdict.ready,
  unknown: W.verdict.unknown,
};

/** One state word with its pip; the pip's colour always agrees with the word (red-team #2). */
export function StateWord({ state }: { state: CardState }) {
  return (
    <span className={cx('np-state', `np-t-${STATE_TONE[state]}`)}>
      <Pip tone={PIP[state]} />
      {STATE_WORD[state]}
    </span>
  );
}

/** The character cards, in Visit Order: who, where, the state word, the one job, its tab chip and timer. */
export function CharacterCards({
  view,
  timeline,
  groups,
  onOpen,
  rowRef,
}: {
  view: NowView;
  timeline: TimelineView | null;
  groups: FullGroup[];
  onOpen(index: number): void;
  rowRef?(index: number, el: HTMLElement | null): void;
}) {
  const full = fullSet(groups);
  const states = view.roster.map((r) => cardState(r, full));
  const count = (s: CardState) => states.filter((x) => x === s).length;
  const start = timeline?.axis.start ?? 0;
  const summary = (['fix', 'collect', 'ready', 'unknown'] as const)
    .filter((s) => count(s) > 0)
    .map((s) => (
      <b key={s} className={`np-t-${STATE_TONE[s]}`}>
        {W.stateCount(count(s), STATE_WORD[s])}
      </b>
    ));
  return (
    <section className="np-cards-sec" aria-labelledby="np-cards-h">
      <div className="np-sec-head">
        <h3 id="np-cards-h" className="a-h2">
          {W.characters}
        </h3>
        <span className="np-muted np-sec-head__sum">
          {W.inVisitOrder}
          {summary.map((s) => (
            <span key={s.key}> · {s}</span>
          ))}
        </span>
      </div>
      <ol className="np-cards n-roster">
        {view.roster.map((r, i) => {
          const state = states[i] ?? 'ready';
          const chip = rowTabChip(view, r.index);
          const timer = nextLimit(timeline, r.index);
          const who = `${r.classLabel} ${r.level}`;
          const task = r.summary ? (state === 'collect' ? W.thenTask(r.summary) : r.summary) : null;
          return (
            <li key={r.index}>
              <Go
                ref={(el) => rowRef?.(r.index, el)}
                href={formatRoute({ place: 'character', index: r.index, tab: 'now' })}
                onGo={() => onOpen(r.index)}
                index={r.index}
                className="np-card"
                label={`${r.position}. ${who}${r.map ? `, ${r.map}` : ''}, ${STATE_WORD[state]}${task ? `. ${task}` : ''}`}
              >
                <span className="np-card__top">
                  <Badged classLabel={classOf(view, r.index)} size={40}>
                    <Blob family={familyOf(view, r.index)} size={40} />
                  </Badged>
                  <span className="np-card__who">
                    <span className="np-card__line">
                      <b>{who}</b>
                      <StateWord state={state} />
                    </span>
                    {r.map ? <span className="np-muted np-xs">{r.map}</span> : null}
                  </span>
                </span>
                {task ? <span className="np-card__task">{task}</span> : null}
                <span className="np-card__foot np-xs">
                  <span className="np-card__meta">
                    <span className="np-muted">
                      {chip ? `${chip.label}${chip.word ? ` · ${chip.word}` : ''}` : ''}
                    </span>
                    {timer ? (
                      <span className="np-t-sky num">{W.timer(timer.label, inSpan(timer.at - start))}</span>
                    ) : null}
                  </span>
                </span>
              </Go>
            </li>
          );
        })}
      </ol>
      {untimedGroups(timeline, view).map((g) => (
        <p key={g.what} className="np-untimed np-muted np-sm">
          {W.untimed(g.what, g.kindWord, g.indexes.length)}
        </p>
      ))}
    </section>
  );
}

/** The coins row: who has coins to spend, then the Spend Plan. */
export function CoinsRow({
  payers,
  onSpend,
  compact = false,
}: {
  payers: Payer[];
  onSpend(): void;
  compact?: boolean;
}) {
  if (payers.length === 0) return null;
  const buys = payers.reduce((n, p) => n + p.lines, 0);
  if (compact)
    return (
      <Go href="#spend" onGo={onSpend} className="np-coins np-coins--compact">
        <Icon art={COIN} fallback="item-coin" name="coin" size={32} />
        <span className="np-coins__t">
          <b>{W.coinsShort(buys, payers.length)}</b>
          <span className="np-muted np-xs">{W.coinsCap}</span>
        </span>
        <PixelArt name="ui-arrow-right" decorative />
      </Go>
    );
  return (
    <section className="np-coins" aria-label={W.coinsCap}>
      <Icon art={COIN} fallback="item-coin" name="coin" size={32} />
      <span className="np-coins__t">
        <b>{W.coinsTitle(buys, payers.length)}</b>
        <span className="np-muted np-sm">
          {payers.map((p, i) => (
            <Fragment key={p.index}>
              {i > 0 ? ' · ' : ''}
              <span className="np-coins__who">
                {p.label}{' '}
                <span className="np-dim">{W.coinsWho(p.lines, coins(p.coins).replace(/ coins$/, ''))}</span>
              </span>
            </Fragment>
          ))}
        </span>
      </span>
      <button
        type="button"
        className="np-btn np-btn--ghost"
        onClick={onSpend}
        aria-label="Open the Spend Plan"
      >
        {W.spendPlan}
        <PixelArt name="ui-arrow-right" decorative />
      </button>
    </section>
  );
}

export type { EngineResult, NowSessionView };
