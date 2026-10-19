// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Focus, the Character page's Now tab (M10 FR-10 to FR-14; M21 FR-N5; M24 board `CharNow`).
// Top to bottom: the character page shell (the strip, the header, the cap pills and the tabs, in
// characters/CharacterShell.tsx), then on the Now tab two columns: the answer in the screen's one frame
// (the first blocker, else the first Goal: what, the step and its fill, "See it" and Skip today), "Then"
// with the next ranked Goals, the quiet Better fit hint, "If you have time" and the Done fold; beside it
// the side column (Timers, About on average: PurposeBlock). Last, one "Next: <character>" tile. The
// strip replaced the old pager, "you are here", the arrows, "Next: switch to" and "All characters"
// (M24 rule 5). The <h2> takes keyboard focus only when the player opened the card.
import {
  CARD_WORDS,
  FLOW_WORDS,
  FOCUS_WORDS,
  type FocusCard,
  type GoalView,
  LINK_WORDS,
  type NowView,
} from '@idleon-forge/engine/now';
import { type Ref, Suspense, useState } from 'react';
import { Avatar, GoalSprite } from '../characters/Avatar';
import { CharacterShell } from '../characters/CharacterShell';
import { PAGE_WORDS } from '../characters/words';
import { PixelArt } from '../design/art/PixelArt';
import { Frame, SourceLabel, Tag } from '../design/atoms';
import { Button, cx } from '../design/atoms/Button';
import { GLYPH, VERDICT_GLYPH } from '../design/atoms/glyphs';
import { Meter } from '../design/atoms/Meter';
import { VerdictStamp } from '../design/atoms/Pill';
import { EmptyState } from '../design/atoms/States';
import { span } from '../design/format';
import { Loading } from '../lazy-part';
import { NOW_TAB, tabById, tabHref } from './character-tabs';
import { ModalSheet as Sheet } from './chrome/ModalSheet';
import { useNowActions } from './context';
import { PurposeBlock } from './PurposeBlock';
import {
  ActionControls,
  CapPills,
  NextActionItem,
  RankedGoals,
  ReportThis,
  SeeItLink,
  WhySheet,
} from './parts';
import { characterStates } from './place/derive';
import { NOW_PLACE_WORDS } from './place/words';
import '../characters/now-tab.css';

export interface FocusProps {
  card: FocusCard;
  /** "Now playing <name> · go", while an auto-follow waits for the player to finish (FR-14). */
  pendingFollow: { index: number; text: string } | null;
  /** G5: the in-game Cloud Save tip, only while the screen is guessing who is played (M10 FR-14). */
  showCloudSaveTip: boolean;
  /** The shell's Esc and history keep it (M17); the page draws no back button (M24 rule 5). */
  onBack(): void;
  onNext(index: number | null): void;
  /** The character page's tab (`character-tabs.ts`); "now" is this card's own content. */
  tab?: string;
  onTab?: (id: string) => void;
  /** The whole Now view, for the other tabs and the who-glyphs. */
  view?: NowView;
  /** The header's <h2>: it takes keyboard focus when the player opens the page. */
  headingRef?: Ref<HTMLHeadingElement>;
}

const STAMP_WORD = { ready: 'Ready', fix: 'Fix', unknown: 'Unknown' } as const;

/** "Grow · A passive card in a slot" -> "Grow": the Goal's kind, the hero's badge. */
const kindOf = (tag: string) => tag.split(' · ')[0] ?? tag;
const n = (x: number) => x.toLocaleString('en-US');

/**
 * The answer in the screen's one frame (M24 rule 1): the first blocker, else the first Goal. Its kind,
 * what to do, the step with its fill from the save, "See it" and Skip today. A tap on the text opens
 * the why sheet (Sources, Report this).
 */
function StepHero({ card, goal }: { card: FocusCard; goal: GoalView }) {
  const actions = useNowActions();
  const [open, setOpen] = useState(false);
  const a = goal.action;
  const fix = goal.blocker;
  const steps = goal.walkthrough?.steps ?? [];
  const at = steps.findIndex((s) => s.when === 'now');
  const step = at >= 0 ? steps[at] : null;
  const progress = step?.progress && step.progress.need > 0 ? step.progress : null;
  return (
    <Frame
      as="section"
      tone={fix ? 'coral' : 'gold'}
      className={cx('n-step cp-hero', fix ? 'is-fix' : 'is-now', actions.highlight === a.key && 'lit')}
      data-na-key={a.key}
      aria-label={fix ? FOCUS_WORDS.beforeYouLeave : PAGE_WORDS.heroHint}
    >
      <p className="cp-hero-k">
        <Tag tone={fix ? 'coral' : 'gold'}>{kindOf(a.tag)}</Tag>
        <span className="cp-xs">{fix ? FOCUS_WORDS.beforeYouLeave : PAGE_WORDS.heroHint}</span>
      </p>
      <button
        type="button"
        className="n-step__open cp-hero-open"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span className="cp-hero-ic" aria-hidden="true">
          <GoalSprite system={goal.system} fix={fix} size={48} />
        </span>
        <span className="cp-hero-text">
          <span className="cp-hero-t a-h1 na-text">{a.text}</span>
          <span className="cp-hero-where">{[goal.title, card.map].filter(Boolean).join(' · ')}</span>
        </span>
      </button>
      {step ? (
        <div className="cp-hero-step">
          <p className="cp-hero-steprow">
            <span>
              {PAGE_WORDS.stepOf(at + 1, steps.length)} · {step.text}
            </span>
            {progress ? (
              <b className="n-step__fill num">{`${n(progress.held)} of ${n(progress.need)}`}</b>
            ) : null}
          </p>
          {progress ? (
            <Meter
              value={Math.min(progress.held, progress.need)}
              max={progress.need}
              label={`${n(progress.held)} of ${n(progress.need)}`}
              tone={fix ? 'coral' : 'gold'}
            />
          ) : null}
        </div>
      ) : null}
      {fix ? <p className="n-step__hint cp-xs">{FOCUS_WORDS.ticksItself}</p> : null}
      <div className="cp-hero-acts">
        <SeeItLink goal={goal} subject={`c${card.index}`} />
        {a.controls.skip ? (
          <button type="button" className="a-btn a-btn--quiet n-skip" onClick={() => actions.skip(a.key)}>
            <PixelArt name="cards-zz" scale={2} decorative />
            <span>{CARD_WORDS.skip}</span>
          </button>
        ) : null}
      </div>
      <WhySheet
        open={open}
        onClose={() => setOpen(false)}
        action={a}
        milestone={goal.milestone}
        details={goal.details}
        walkthrough={goal.walkthrough}
        token={{ where: card.map }}
      />
    </Frame>
  );
}

/** "Next: Barbarian 74": the one way on, at the end of the Now tab (M24 rule 5). */
function NextTile({
  card,
  view,
  onNext,
}: {
  card: FocusCard;
  view?: NowView;
  onNext(i: number | null): void;
}) {
  const i = card.next.index;
  const r = i === null ? null : view?.roster.find((x) => x.index === i);
  const who = r ? `${r.classLabel} ${r.level}` : null;
  // The same state word as Now's cards and the Characters grid (M24 QA P1-10).
  const state = i === null || !view ? null : (characterStates(view).get(i) ?? null);
  return (
    <button type="button" className="a-tile cp-next" onClick={() => onNext(i)}>
      {r ? (
        <Avatar family={view?.families?.[r.index] ?? 'beginner'} classLabel={r.classLabel} size={48} />
      ) : null}
      <span className="cp-next-text">
        <b>{who ? PAGE_WORDS.next(who) : card.next.text}</b>
        <span className="cp-xs">
          {card.position}
          {state ? ` · ${NOW_PLACE_WORDS.verdict[state]}` : ''}
        </span>
      </span>
      <PixelArt name={GLYPH.arrowRight} decorative />
    </button>
  );
}

/**
 * `flows.empty` Sleeping blob (owner override): nothing left for this character, so the blob sleeps and
 * says what is next ("Nothing to do now. Back in 8h 10m: the anvil on Bowman 54 fills first.").
 */
function Asleep({ card }: { card: FocusCard }) {
  const actions = useNowActions();
  const now = Date.now();
  const c = actions.result?.characters.find((x) => x.index === card.index);
  const fill = c?.firstFill ?? null;
  const what = fill ? `the ${fill.what ?? fill.label} on ${card.classLabel} ${card.level} fills first` : null;
  return (
    <EmptyState
      line={
        fill && fill.at > now
          ? FLOW_WORDS.empty(span(fill.at - now), what)
          : FLOW_WORDS.empty(span((actions.result?.expectedReturn.usedSeconds ?? 0) * 1000), null)
      }
    />
  );
}

/** `now.focus-better-fit` Quiet hint: one muted line under the step; the why is one tap away. */
function BetterFit({ card }: { card: FocusCard }) {
  const actions = useNowActions();
  const [open, setOpen] = useState(false);
  const hl = card.higherLeverage;
  if (!hl)
    return card.higherLeverageNote ? <p className="n-muted n-small">{card.higherLeverageNote}</p> : null;
  return (
    <div className="n-quiet hl">
      <p>
        <PixelArt name="now-signpost" decorative />
        <b>{FOCUS_WORDS.betterFit}</b>{' '}
        {hl.partner ? (
          <>
            <a
              href={tabHref(NOW_TAB, hl.partner.index)}
              onClick={(e) => {
                e.preventDefault();
                if (hl.partner) actions.open(hl.partner.index);
              }}
            >
              {hl.partner.name}
            </a>{' '}
          </>
        ) : null}
        {hl.text} ·{' '}
        <button type="button" className="n-link-btn" aria-haspopup="dialog" onClick={() => setOpen(true)}>
          {FOCUS_WORDS.why}
        </button>
      </p>
      <Sheet open={open} title={FOCUS_WORDS.betterFit} onClose={() => setOpen(false)}>
        <div className="n-why">
          <p className="n-why__act">{hl.text}</p>
          <p>{hl.why}</p>
          <h3 className="n-why__h">{CARD_WORDS.howDecided}</h3>
          <p>{CARD_WORDS.decidedBy(hl.decidedBy)}</p>
          {hl.alsoConsidered.length ? (
            <ul>
              {hl.alsoConsidered.map((x) => (
                <li key={x.text}>{CARD_WORDS.alsoConsidered(x.text, x.reason)}</li>
              ))}
            </ul>
          ) : null}
          <div className="n-why__src na-meta">
            <SourceLabel source={hl.source} />
          </div>
          <ActionControls
            actionKey={hl.key}
            controls={hl.controls}
            text={hl.text}
            report={{
              outputKind: 'higher-leverage',
              entryIds: [],
              fields: [],
              text: hl.text,
              stale: hl.stale,
              contested: false,
            }}
          />
        </div>
      </Sheet>
    </div>
  );
}

export function Focus({
  card,
  pendingFollow,
  showCloudSaveTip,
  onNext,
  tab = NOW_TAB,
  onTab,
  view,
  headingRef,
}: FocusProps) {
  const actions = useNowActions();
  const Other = tab === NOW_TAB ? null : (tabById(tab)?.Component ?? null);
  const go = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    actions.open(index);
  };
  // The answer: the first blocker, else the first Goal; the rest follow under "Then", ranked on.
  const [blocker, ...moreBlockers] = card.blockers;
  const heroGoal = blocker ?? card.goals[0] ?? null;
  const restGoals = blocker ? card.goals : card.goals.slice(1);
  // The hero is #1, so the list's ranks continue from 2 (blockers above it keep their own rows).
  const from = heroGoal ? 1 : 0;
  const hasThen =
    moreBlockers.length > 0 || restGoals.length > 0 || card.hiddenCount > 0 || card.skippedKeys.length > 0;
  return (
    <section className={cx('focus n-focus cp-page', `is-${card.pill.kind}`)} aria-labelledby="focus-h">
      {pendingFollow ? (
        <button type="button" className="a-chip follow" onClick={() => actions.open(pendingFollow.index)}>
          {pendingFollow.text} · go
        </button>
      ) : null}
      {card.left ? (
        <p className="n-left left-line">
          {card.left.text} ·{' '}
          <a
            className="n-back"
            href={tabHref(NOW_TAB, card.left.index)}
            onClick={(e) => go(e, card.left?.index ?? card.index)}
          >
            {LINK_WORDS.back}
          </a>
        </p>
      ) : null}

      <CharacterShell ref={headingRef} card={card} tab={tab} onTab={onTab && view ? onTab : null} view={view}>
        <CapPills caps={card.caps} ready={card.pill.kind === 'ready'} />
      </CharacterShell>

      {showCloudSaveTip ? <p className="n-tip">{FOCUS_WORDS.cloudSaveTip}</p> : null}

      {Other && view ? (
        <Suspense fallback={<Loading what={`the ${tabById(tab)?.label ?? ''} tab`} />}>
          <Other view={view} index={card.index} />
        </Suspense>
      ) : (
        <>
          <div className="n-focus__now cp-now">
            <div className="cp-main">
              {card.unknown ? (
                <div className="n-unknown unknown">
                  <PixelArt name="now-magnifier" scale={2} decorative />
                  <div>
                    <p className="n-unknown__t">
                      <VerdictStamp verdict="unknown" word={STAMP_WORD.unknown} /> {card.unknown.text}
                    </p>
                    {card.unknown.note ? <p className="n-muted n-small">{card.unknown.note}</p> : null}
                    {card.unknown.suggestion ? (
                      <NextActionItem action={card.unknown.suggestion} first />
                    ) : null}
                    {card.unknown.skipKey ? (
                      <div className="controls n-controls">
                        {card.unknown.skipped ? (
                          <Button tone="plain" onClick={() => actions.unskip([card.unknown?.skipKey ?? ''])}>
                            skipped · undo
                          </Button>
                        ) : (
                          <button
                            type="button"
                            className="a-btn a-btn--quiet n-skip"
                            onClick={() => actions.skip(card.unknown?.skipKey ?? '')}
                          >
                            <PixelArt name="cards-zz" scale={2} decorative />
                            <span>{CARD_WORDS.skip}</span>
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
                </div>
              ) : null}

              {heroGoal ? <StepHero card={card} goal={heroGoal} /> : null}
              {!heroGoal && !card.unknown ? <Asleep card={card} /> : null}

              {hasThen ? (
                <section
                  className="n-goals cp-then"
                  aria-label={FOCUS_WORDS.goals(`${card.classLabel} ${card.level}`)}
                >
                  <h3 className="a-cap cp-cap">{PAGE_WORDS.thenHeading}</h3>
                  {moreBlockers.length > 0 ? (
                    <ul className="goals blockers n-blockers">
                      {moreBlockers.map((g) => (
                        <li key={g.action.key}>
                          <NextActionItem
                            action={g.action}
                            milestone={g.milestone}
                            details={g.details}
                            walkthrough={g.walkthrough}
                            seeIt={<SeeItLink goal={g} subject={`c${card.index}`} />}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <RankedGoals
                    goals={restGoals}
                    subject={`c${card.index}`}
                    hiddenCount={card.hiddenCount}
                    skipped={card.skippedKeys}
                    dismissed={card.dismissed}
                    from={from}
                  />
                </section>
              ) : null}

              <BetterFit card={card} />

              {card.activePlay.length > 0 ? (
                <section aria-label={FOCUS_WORDS.ifYouHaveTime} className="n-extra">
                  <h3 className="a-cap cp-cap">{FOCUS_WORDS.ifYouHaveTime}</h3>
                  <ul>
                    {card.activePlay.map((a) => (
                      <li
                        key={a.key}
                        data-na-key={a.key}
                        className={cx('iyht', actions.highlight === a.key && 'lit')}
                      >
                        <PixelArt name="cards-seal-chest" decorative />
                        <span>
                          {a.text} <span className="n-muted num">· {a.estimate}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {card.done.length > 0 ? (
                <details className="done n-done">
                  <summary>{FOCUS_WORDS.doneThisSession(card.done.length)}</summary>
                  <ul>
                    {card.done.map((d) => (
                      <li key={d.key}>
                        <PixelArt name={VERDICT_GLYPH.ready} decorative />
                        <s>{d.text}</s> <span className="n-muted num">{d.time}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
            <PurposeBlock card={card} />
          </div>
          <NextTile card={card} view={view} onNext={onNext} />
        </>
      )}
    </section>
  );
}
