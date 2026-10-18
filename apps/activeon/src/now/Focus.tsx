// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Focus, the Character page's Now tab (M10 FR-10 to FR-14; M21 FR-N5, `now.focus-card` Current-step hero,
// `now.verdict-strip` Pager with the next fix, `now.focus-identity` Plain "you are here",
// `now.focus-better-fit` Quiet hint, `now.focus-footer` Primary next with its Session recap fold).
// Top to bottom: the pager (← prev · dots · Next), "you are here", the identity strip and tab bar (area
// C's CharacterShell), then on the Now tab the current-step hero (one step: who · where · how long, its
// fill from the save, "See it"), the Purpose quest line, the ranked Goals (one winner), the quiet Better
// fit hint, the character's "If you have time" lines, the Done fold and the one Next button.
// "Something confusing here?" moved to the header's overflow (G1). The <h2> takes keyboard focus only
// when the player opened the card, never on an auto-follow.
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
import { CharacterShell } from '../characters/CharacterShell';
import { PixelArt } from '../design/art/PixelArt';
import { SourceLabel } from '../design/atoms';
import { Button, cx } from '../design/atoms/Button';
import { GLYPH, VERDICT_GLYPH } from '../design/atoms/glyphs';
import { VerdictStamp } from '../design/atoms/Pill';
import { EmptyState } from '../design/atoms/States';
import { TokenLine } from '../design/atoms/TokenLine';
import { span } from '../design/format';
import { WhoGlyph } from '../design/who/WhoGlyph';
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

export interface FocusProps {
  card: FocusCard;
  /** "Now playing <name> · go", while an auto-follow waits for the player to finish (FR-14). */
  pendingFollow: { index: number; text: string } | null;
  /** G5: the in-game Cloud Save tip, only while the screen is guessing who is played (M10 FR-14). */
  showCloudSaveTip: boolean;
  onBack(): void;
  onNext(index: number | null): void;
  /** The character page's tab (`character-tabs.ts`); "now" is this card's own content. */
  tab?: string;
  onTab?: (id: string) => void;
  /** The whole Now view, for the other tabs and the who-glyphs. */
  view?: NowView;
  /** The identity strip's <h2>: it takes keyboard focus when the player opens the page. */
  headingRef?: Ref<HTMLHeadingElement>;
}

const STAMP_WORD = { ready: 'Ready', fix: 'Fix', unknown: 'Unknown' } as const;

/** `now.verdict-strip` Pager: "← prev", the dots (a tap opens every character as 44 px rows), "Next". */
function Pager({ card, view }: { card: FocusCard; view?: NowView }) {
  const actions = useNowActions();
  const [open, setOpen] = useState(false);
  const at = card.strip.findIndex((s) => s.current);
  const prev = at > 0 ? card.strip[at - 1] : undefined;
  const next = at >= 0 && at < card.strip.length - 1 ? card.strip[at + 1] : undefined;
  const who = (i: number) => {
    const r = view?.roster.find((x) => x.index === i);
    return r ? `${r.classLabel} ${r.level}` : '';
  };
  return (
    <nav className="n-pager strip" aria-label="Characters in Visit Order">
      {prev ? (
        <a
          className="a-btn a-btn--plain n-pager__prev"
          href={tabHref(NOW_TAB, prev.index)}
          aria-label={FOCUS_WORDS.prevName(who(prev.index))}
          onClick={(e) => {
            e.preventDefault();
            actions.open(prev.index);
          }}
        >
          <PixelArt name={GLYPH.arrowLeft} decorative />
          <span>{FOCUS_WORDS.prev}</span>
        </a>
      ) : (
        <span className="n-pager__prev is-off" aria-hidden="true" />
      )}
      <button
        type="button"
        className="n-dots"
        aria-label={FOCUS_WORDS.dotsOpen}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {card.strip.map((s) => (
          <i key={s.index} className={cx(`is-${s.kind}`, s.current && 'is-cur')} />
        ))}
      </button>
      {next ? (
        <a
          className="a-btn a-btn--quiet n-pager__next"
          href={tabHref(NOW_TAB, next.index)}
          onClick={(e) => {
            e.preventDefault();
            actions.open(next.index);
          }}
        >
          <span>
            {`Next: ${who(next.index)}`}
            {next.kind === 'fix' ? ` · ${STAMP_WORD.fix.toLowerCase()}` : ''}
          </span>
          <PixelArt name={GLYPH.arrowRight} decorative />
        </a>
      ) : null}
      <Sheet open={open} title={FOCUS_WORDS.pagerTitle} onClose={() => setOpen(false)}>
        <ol className="n-pager__list">
          {card.strip.map((s) => (
            <li key={s.index}>
              <a
                className={cx('n-pager__row strip-item', s.kind, s.current && 'is-cur')}
                href={tabHref(NOW_TAB, s.index)}
                aria-label={s.accessibleName}
                aria-current={s.current ? 'true' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  actions.open(s.index);
                }}
              >
                <WhoGlyph
                  family={view?.families?.[s.index] ?? 'beginner'}
                  classLabel={who(s.index)}
                  scale={1}
                  decorative
                />
                <span>{s.label}</span>
                <VerdictStamp verdict={s.kind} word={STAMP_WORD[s.kind]} />
              </a>
            </li>
          ))}
        </ol>
      </Sheet>
    </nav>
  );
}

/** The current-step hero: one step with who · where · how long, its fill from the save, and "See it". */
function StepHero({ card, goal, family }: { card: FocusCard; goal: GoalView; family: NowView['families'] }) {
  const actions = useNowActions();
  const [open, setOpen] = useState(false);
  const a = goal.action;
  const fix = goal.blocker;
  const who = { family: family?.[card.index] ?? 'beginner', label: `${card.classLabel} ${card.level}` };
  const step = goal.walkthrough?.steps.find((s) => s.when === 'now') ?? null;
  const progress = step?.progress && step.progress.need > 0 ? step.progress : null;
  return (
    <div
      className={cx('n-step', fix ? 'is-fix' : 'is-now', actions.highlight === a.key && 'lit')}
      data-na-key={a.key}
    >
      <button type="button" className="n-step__open" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <span className="n-step__k">
          <PixelArt name={fix ? VERDICT_GLYPH.fix : 'cards-stone-now'} decorative />
          {fix ? FOCUS_WORDS.beforeYouLeave : FOCUS_WORDS.current}
        </span>
        <span className="n-step__t na-text">{a.text}</span>
        <TokenLine who={who} where={card.map} />
        {progress ? (
          <span className="n-step__fill num">{`${progress.held.toLocaleString('en-US')} of ${progress.need.toLocaleString('en-US')}`}</span>
        ) : null}
      </button>
      {fix ? <p className="n-step__hint">{FOCUS_WORDS.ticksItself}</p> : null}
      <SeeItLink goal={goal} subject={`c${card.index}`} />
      {a.controls.skip ? (
        <button type="button" className="a-btn a-btn--quiet n-skip" onClick={() => actions.skip(a.key)}>
          <PixelArt name="cards-zz" scale={2} decorative />
          <span>{CARD_WORDS.skip}</span>
        </button>
      ) : null}
      <WhySheet
        open={open}
        onClose={() => setOpen(false)}
        action={a}
        milestone={goal.milestone}
        details={goal.details}
        walkthrough={goal.walkthrough}
        token={{ who, where: card.map }}
      />
    </div>
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
  onBack,
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
  const [hero, ...moreBlockers] = card.blockers;
  const heroGoal = hero ?? null;
  return (
    <section className={cx('focus n-focus', `is-${card.pill.kind}`)} aria-labelledby="focus-h">
      <Pager card={card} view={view} />

      {pendingFollow ? (
        <button type="button" className="a-chip follow" onClick={() => actions.open(pendingFollow.index)}>
          {pendingFollow.text} · go
        </button>
      ) : null}

      <p className="n-here">
        {card.position}
        {card.playing ? ` · ${card.playing}` : ''}
      </p>
      {showCloudSaveTip ? (
        <p className="n-tip">
          <PixelArt name={GLYPH.howLong} decorative />
          {FOCUS_WORDS.cloudSaveTip}
        </p>
      ) : null}
      {card.left ? (
        <p className="n-left left-line">
          {card.left.text} ·{' '}
          <a
            className="n-back"
            href={tabHref(NOW_TAB, card.left.index)}
            onClick={(e) => go(e, card.left?.index ?? card.index)}
          >
            <PixelArt name={GLYPH.arrowLeft} decorative />
            {LINK_WORDS.back}
          </a>
        </p>
      ) : null}

      <CharacterShell ref={headingRef} card={card} tab={tab} onTab={onTab && view ? onTab : null} view={view}>
        <CapPills caps={card.caps} ready={card.pill.kind === 'ready'} />
      </CharacterShell>

      {Other && view ? (
        <Suspense fallback={<Loading what={`the ${tabById(tab)?.label ?? ''} tab`} />}>
          <Other view={view} index={card.index} />
        </Suspense>
      ) : (
        <div className="n-focus__now">
          {card.info.length > 0 ? (
            <ul className="info-lines n-info" aria-label="Info">
              {card.info.map((l) => (
                <li key={l.key}>
                  {l.text} {l.source ? <SourceLabel source={l.source} more={false} /> : null}
                </li>
              ))}
            </ul>
          ) : null}

          {card.unknown ? (
            <div className="n-unknown unknown">
              <PixelArt name="now-magnifier" scale={2} decorative />
              <div>
                <p className="n-unknown__t">
                  <VerdictStamp verdict="unknown" word={STAMP_WORD.unknown} /> {card.unknown.text}
                </p>
                {card.unknown.note ? <p className="n-muted n-small">{card.unknown.note}</p> : null}
                {card.unknown.suggestion ? <NextActionItem action={card.unknown.suggestion} first /> : null}
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

          {heroGoal ? <StepHero card={card} goal={heroGoal} family={view?.families} /> : null}
          {!heroGoal && !card.unknown && card.goals.length === 0 ? <Asleep card={card} /> : null}
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

          {card.purpose.length > 0 ? <PurposeBlock card={card} /> : null}

          {card.goals.length > 0 || card.hiddenCount > 0 || card.skippedKeys.length > 0 ? (
            <section className="n-goals" aria-label={FOCUS_WORDS.goals(`${card.classLabel} ${card.level}`)}>
              <h3 className="n-sub-h">{FOCUS_WORDS.goals(`${card.classLabel} ${card.level}`)}</h3>
              <RankedGoals
                goals={card.goals}
                subject={`c${card.index}`}
                hiddenCount={card.hiddenCount}
                skipped={card.skippedKeys}
                dismissed={card.dismissed}
              />
            </section>
          ) : null}

          <BetterFit card={card} />

          {card.activePlay.length > 0 ? (
            <section aria-label={FOCUS_WORDS.ifYouHaveTime} className="n-extra">
              <h3 className="n-sub-h">{FOCUS_WORDS.ifYouHaveTime}</h3>
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
      )}

      <div className="focus-foot n-focus__foot">
        <button type="button" className="a-btn a-btn--primary n-wide" onClick={() => onNext(card.next.index)}>
          <span>{card.next.text}</span>
          <PixelArt name={GLYPH.arrowRight} decorative />
        </button>
        <Button tone="plain" onClick={onBack}>
          {actions.place === undefined || actions.place === 'now' ? null : (
            <PixelArt name={GLYPH.arrowLeft} decorative />
          )}
          {actions.place === undefined || actions.place === 'now'
            ? FOCUS_WORDS.allCharacters
            : LINK_WORDS.back}
        </Button>
      </div>
    </section>
  );
}
