// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The shared pieces of a Next Action (M10 TR-4) in the M21 design:
// - `NextActionItem` is the Goal card (`cards.goal-card` Action-only card): one sentence plus the who /
//   where / how long tokens, the kind as a 4 px rule plus a small word. A tap on the card opens the why
//   sheet; Skip today (the Zz mark) is the one control on the face (DS-10, FR-N8).
// - `WhySheet` (`cards.why-sheet` Bottom sheet, delta first, merged with NPC speech): who and where, the
//   why spoken by our guide Scout (the Quest Log accent), the Sources with their dates, "sources
//   disagree" with both sides, the details as glyph chips, the Walkthrough, "See it" (G6) and the
//   overflow: Report this, and Not for me as hold-to-confirm (1 s) saying what it changes.
// - `RankedGoals` (`cards.goal-list` Ranked with one winner): one full card, then numbered muted lines,
//   then "+n more"; "2 skipped today · show" and "Hidden until next patch".
// - `CapPills`: a character's cap pills in the Focus header, each a disclosure (R-PILL-1).
// The Source label, the contested badge and the meta row live in design/atoms/ (Phase F); they are
// re-exported here until Integration (FR-I3). All text is React text: no dangerouslySetInnerHTML (TR-13).
import {
  CARD_WORDS,
  type CapPillView,
  type ControlsView,
  type GoalView,
  LINK_WORDS,
  type NextActionView,
  PLACE_WORDS,
  seeItSystem,
  tabHomeOf,
  timelineHome,
} from '@idleon-forge/engine/now';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { Button, cx } from '../design/atoms/Button';
import { GlyphChip } from '../design/atoms/Chip';
import { GLYPH, type SealKind } from '../design/atoms/glyphs';
import { Seal, Speech } from '../design/atoms/Marks';
import { Pill } from '../design/atoms/Pill';
import { SourceLabel } from '../design/atoms/SourceLabel';
import { TokenLine } from '../design/atoms/TokenLine';
import type { ClassFamily } from '../design/who/WhoGlyph';
import { formatRoute } from '../shell/route';
import { capGlyph, capOpenId } from './chrome/cap-glyph';
import { HoldButton } from './chrome/HoldButton';
import { ModalSheet as Sheet } from './chrome/ModalSheet';
import { type ReportOutput, useNowActions } from './context';
import { PUBLIC_NOTICE } from './report';
import { WalkthroughPin, WalkthroughSteps } from './walkthrough/Walkthrough';

export { ActionMeta, ContestedBadge } from '../design/atoms/ActionMeta';
export { GoalList } from '../design/atoms/GoalList';
export { ExternalLink, SourceLabel } from '../design/atoms/SourceLabel';
export { capOpenId } from './chrome/cap-glyph';
export { HoldButton } from './chrome/HoldButton';

const kindOfTag = (tag: string): SealKind => {
  const w = tag.split(' · ')[0]?.toLowerCase();
  return w === 'fix' || w === 'spend' || w === 'grow' || w === 'extra' ? w : 'grow';
};
const kindWord = (tag: string) => tag.split(' · ')[0] ?? tag;

/**
 * Report this (FR-30, US-12; M13 FR-9): opens the in-app Suggest form when the Suggestions provider is
 * there; otherwise two taps, with the public notice in between, to the pre-filled GitHub issue.
 */
export function ReportThis({ input, onOpen }: { input: ReportOutput; onOpen?: () => void }) {
  const actions = useNowActions();
  const [open, setOpen] = useState(false);
  const { openReport } = actions;
  if (openReport)
    return (
      <Button
        tone="plain"
        onClick={() => {
          // The form replaces the sheet it was opened from: a sheet never opens a sheet (DS-4).
          onOpen?.();
          openReport(input);
        }}
      >
        {CARD_WORDS.report}
      </Button>
    );
  if (!open)
    return (
      <Button tone="plain" onClick={() => setOpen(true)}>
        {CARD_WORDS.report}
      </Button>
    );
  return (
    <span className="report-confirm">
      {PUBLIC_NOTICE}.{' '}
      <a
        href={actions.reportUrl(input)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setOpen(false)}
      >
        Open the report
      </a>{' '}
      <Button tone="plain" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </span>
  );
}

/**
 * The sheet's controls: Skip today, then the overflow (•••, 44 px) with Report this and Not for me
 * (hold 1 s, saying what it changes). Report is never on a card face (DS-10).
 */
export function ActionControls({
  actionKey,
  controls,
  report,
  text,
  onClose,
}: {
  actionKey: string;
  controls: ControlsView;
  report: ReportOutput;
  /** The line, for "We won't suggest this again …". */
  text?: string;
  /** The sheet these controls sit in: Report this closes it before the form opens (DS-4). */
  onClose?: () => void;
}) {
  const actions = useNowActions();
  const [more, setMore] = useState(false);
  const hint = useId();
  const menu = useId();
  return (
    <div className="controls n-controls">
      {controls.skip ? (
        <button type="button" className="a-btn a-btn--quiet n-skip" onClick={() => actions.skip(actionKey)}>
          <PixelArt name="cards-zz" scale={2} decorative />
          <span>{CARD_WORDS.skip}</span>
        </button>
      ) : null}
      {controls.notForMe || controls.report ? (
        <button
          type="button"
          className="a-icon-btn n-overflow"
          aria-label={CARD_WORDS.overflow}
          aria-expanded={more}
          aria-controls={menu}
          onClick={() => setMore((v) => !v)}
        >
          <i aria-hidden="true" />
          <i aria-hidden="true" />
          <i aria-hidden="true" />
        </button>
      ) : null}
      {more ? (
        <div className="n-overflow-menu" id={menu}>
          {controls.notForMe ? (
            <>
              <HoldButton describedBy={hint} onConfirm={() => actions.dismiss(actionKey)}>
                {CARD_WORDS.notForMe}
              </HoldButton>
              <p className="n-muted n-small" id={hint}>
                {text ? CARD_WORDS.notForMeDone(text) : CARD_WORDS.notForMeHint}
              </p>
            </>
          ) : null}
          {controls.report ? <ReportThis input={report} onOpen={onClose} /> : null}
        </div>
      ) : null}
    </div>
  );
}

const reportOf = (action: NextActionView): ReportOutput => ({
  outputKind: 'next-action',
  entryIds: action.provenance.entryIds.length ? action.provenance.entryIds : [action.entryId],
  fields: action.provenance.fields,
  text: action.text,
  stale: action.stale,
  contested: action.contested !== null,
});

/** Goal.details as glyph chips (`cards.goal-details` Glyph chips): who, then the line; a tap opens Focus. */
export function GoalDetails({ details }: { details: GoalView['details'] }) {
  const actions = useNowActions();
  if (details.length === 0) return null;
  const result = actions.result;
  return (
    <ul className="n-details" aria-label={CARD_WORDS.details(details.length)}>
      {details.map((d) => {
        const m = /#c(\d+)$/.exec(d.key);
        const index = m ? Number(m[1]) : null;
        const c = index !== null ? result?.characters.find((x) => x.index === index) : undefined;
        const family =
          (index !== null ? result?.classFamilies?.[index] : undefined) ?? ('beginner' as ClassFamily);
        return (
          <li key={d.key}>
            {c && index !== null ? (
              <GlyphChip
                family={family}
                label={`${c.classLabel} ${c.level}`}
                onClick={() => actions.open(index)}
              />
            ) : null}
            <span>{d.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * M17 FR-31, M21 G6: "See it on the Alchemy page", one quiet row with an arrow, to its System's home
 * (FR-23a): a character's Build or Cards tab, the System page with this Next Action outlined, or the
 * Timeline for ActiveOn's own AFK Next Actions. ActiveOn's own concepts (Spend Plan, Meta Path) get none.
 */
export function SeeItLink({
  goal,
  subject,
}: {
  goal: Pick<GoalView, 'id' | 'system' | 'action'>;
  subject: string;
}) {
  const actions = useNowActions();
  const result = actions.result;
  if (!result || !actions.navigate) return null;
  if (timelineHome(goal.system) && result.returnAt !== undefined)
    return (
      <a
        className="n-see-it see-it"
        href={formatRoute({ place: 'timeline', section: null })}
        onClick={(e) => {
          e.preventDefault();
          actions.navigate?.({ place: 'timeline', section: null });
        }}
      >
        <span>{LINK_WORDS.seeIt(PLACE_WORDS.timeline)}</span>
        <PixelArt name={GLYPH.arrowRight} decorative />
      </a>
    );
  const id = seeItSystem(goal, result);
  if (!id) return null;
  const name = result.systems?.find((s) => s.id === id)?.name ?? id;
  const tab = tabHomeOf(id);
  const m = /^c(\d+)$/.exec(subject);
  const index = tab && m ? Number(m[1]) : null;
  const href = index !== null && tab ? `#${tab}-${index}` : `#system-${id}`;
  return (
    <a
      className="n-see-it see-it"
      href={href}
      onClick={(e) => {
        e.preventDefault();
        if (index !== null && tab) actions.openTab(index, tab);
        else actions.navigate?.({ place: 'system', id }, { highlight: goal.action.key });
      }}
    >
      <span>{LINK_WORDS.seeIt(name)}</span>
      <PixelArt name={GLYPH.arrowRight} decorative />
    </a>
  );
}

export interface WhoWhere {
  who?: { family: ClassFamily; label: string } | null;
  where?: string | null;
}

/** The why sheet (FR-N8). */
export function WhySheet({
  open,
  onClose,
  action,
  milestone,
  details = [],
  walkthrough = null,
  token,
  seeIt,
  extra,
}: {
  open: boolean;
  onClose(): void;
  action: NextActionView;
  milestone?: string | null;
  details?: GoalView['details'];
  walkthrough?: GoalView['walkthrough'];
  token?: WhoWhere;
  /** G6's row at the bottom of the sheet. */
  seeIt?: ReactNode;
  /** "How this was decided" and the like (M5's Better fit). */
  extra?: ReactNode;
}) {
  return (
    <Sheet open={open} title={CARD_WORDS.sheetTitle(kindWord(action.tag))} onClose={onClose}>
      <div className="n-why">
        <p className="n-why__act">{action.text}</p>
        {token?.who || token?.where ? (
          <TokenLine who={token.who ?? null} where={token.where ?? null} />
        ) : null}
        {milestone ? <p className="n-muted n-small num">{milestone}</p> : null}
        <Speech name={CARD_WORDS.guide}>
          <p>{action.why}</p>
        </Speech>
        {extra}
        <GoalDetails details={details} />
        {walkthrough ? <WalkthroughSteps view={walkthrough} /> : null}
        {action.contested ? (
          <div className="n-contested">
            <p className="n-badge-contested">
              <PixelArt name="cards-crossed-posts" decorative />
              {CARD_WORDS.disagree}
            </p>
            <ol className="n-sides">
              {action.contested.sides.map((s) => (
                <li key={s.text}>
                  {s.text}{' '}
                  {s.sources.map((src) => (
                    <SourceLabel key={`${src.href}${src.text}${src.credit}`} source={src} more={false} />
                  ))}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        <div className="n-why__src na-meta">
          <PixelArt name="cards-src-book" decorative />
          <SourceLabel source={action.source} />
        </div>
        {seeIt}
        <ActionControls
          actionKey={action.key}
          controls={action.controls}
          report={reportOf(action)}
          text={action.text}
          onClose={onClose}
        />
      </div>
    </Sheet>
  );
}

/**
 * The one shared component for a Next Action (TR-4): the Goal card. Its whole face opens the why sheet;
 * Skip today is the one other control on it.
 */
export function NextActionItem({
  action,
  milestone,
  details = [],
  walkthrough = null,
  first,
  token,
  seeIt,
  compact,
  rank,
}: {
  action: NextActionView;
  milestone?: string | null;
  details?: GoalView['details'];
  walkthrough?: GoalView['walkthrough'];
  /** The winner of a ranked list (one per list, DS-9). */
  first?: boolean;
  token?: WhoWhere;
  seeIt?: ReactNode;
  /** A muted, numbered line under the winner. */
  compact?: boolean;
  rank?: number;
}) {
  const actions = useNowActions();
  const [open, setOpen] = useState(false);
  const lit = actions.highlight === action.key;
  const kind = kindOfTag(action.tag);
  return (
    <div
      className={cx(
        'na n-goal',
        `a-kind-${kind}`,
        first && 'first is-winner',
        compact && 'is-compact',
        lit && 'lit',
      )}
      data-na-key={action.key}
    >
      <button
        type="button"
        className="n-goal__open"
        aria-haspopup="dialog"
        aria-label={`${action.text}. ${CARD_WORDS.open}`}
        onClick={() => setOpen(true)}
      >
        {rank !== undefined ? <span className="n-goal__rank num">{rank}</span> : null}
        {compact ? null : <Seal kind={kind} word={kindWord(action.tag)} />}
        <span className="n-goal__text na-text">{action.text}</span>
        {compact ? null : milestone ? <span className="n-goal__ms n-muted num">{milestone}</span> : null}
        {compact ? null : walkthrough ? <WalkthroughPin view={walkthrough} /> : null}
        {!compact && (token?.who || token?.where) ? (
          <TokenLine who={token.who ?? null} where={token.where ?? null} />
        ) : null}
        {action.contested && !compact ? (
          <span className="n-badge-contested">
            <PixelArt name="cards-crossed-posts" decorative />
            {CARD_WORDS.disagree}
          </span>
        ) : null}
        <PixelArt name={GLYPH.arrowRight} decorative className="n-goal__chev" />
      </button>
      {/* One control on the face (DS-10): Skip today on a full card; a muted ranked line keeps its
          "See it" row instead (M17 FR-31), and its Skip today waits in the sheet. */}
      {compact ? (
        <span className="n-goal__see">{seeIt}</span>
      ) : action.controls.skip ? (
        <button type="button" className="a-btn a-btn--quiet n-skip" onClick={() => actions.skip(action.key)}>
          <PixelArt name="cards-zz" scale={2} decorative />
          <span>{CARD_WORDS.skip}</span>
        </button>
      ) : null}
      <WhySheet
        open={open}
        onClose={() => setOpen(false)}
        action={action}
        milestone={milestone}
        details={details}
        walkthrough={walkthrough}
        token={token}
        seeIt={seeIt}
      />
    </div>
  );
}

/** The Goal's who-token on a character's page; an account Goal names no one (DS-3 hides it). */
export type GoalToken = (g: GoalView) => WhoWhere | undefined;

/**
 * `cards.goal-list` Ranked with one winner: the first Goal as a full card, the rest as numbered muted
 * lines, "+n more" as a count chip, then "2 skipped today · show" and "Hidden until next patch".
 */
export function RankedGoals({
  goals,
  subject,
  hiddenCount,
  skipped,
  dismissed,
  token,
  seeIt = true,
}: {
  goals: GoalView[];
  /** `c<index>` or `account`: the `expanded` id for "+n more" (M10). */
  subject: string;
  hiddenCount: number;
  skipped: string[];
  dismissed: { key: string; text: string }[];
  token?: GoalToken;
  seeIt?: boolean;
}) {
  const actions = useNowActions();
  const expanded = actions.expanded.has(subject);
  const [showSkipped, setShowSkipped] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  return (
    <>
      {goals.length > 0 ? (
        <ol className="goals n-ranked">
          {goals.map((g, n) => (
            <li key={g.action.key} className={n === 0 ? 'n-ranked__win' : 'n-ranked__rest'}>
              <NextActionItem
                action={g.action}
                milestone={g.milestone}
                details={g.details}
                walkthrough={g.walkthrough}
                first={n === 0}
                compact={n > 0}
                rank={n > 0 ? n + 1 : undefined}
                token={token?.(g)}
                seeIt={seeIt ? <SeeItLink goal={g} subject={subject} /> : undefined}
              />
              {/* The winner keeps its "See it" row under the card (M17 FR-31's findability); the rest
                  carry it in their why sheet (G6). */}
              {seeIt && n === 0 ? <SeeItLink goal={g} subject={subject} /> : null}
            </li>
          ))}
        </ol>
      ) : null}
      {hiddenCount > 0 || expanded ? (
        <button
          type="button"
          className="a-chip n-count-chip"
          aria-expanded={expanded}
          onClick={() => actions.toggle(subject)}
        >
          <span>{expanded ? CARD_WORDS.less : CARD_WORDS.more(hiddenCount)}</span>
        </button>
      ) : null}
      {skipped.length > 0 ? (
        // M17 FR-27: a skipped bar's "See the fix" lands here, found by its key and outlined (R6 QA).
        <div
          className={`n-skipped skipped-line${actions.highlight && skipped.includes(actions.highlight) ? ' lit' : ''}`}
          data-skipped-keys={skipped.join(' ')}
        >
          <button
            type="button"
            className="n-link-btn"
            aria-expanded={showSkipped}
            onClick={() => setShowSkipped((v) => !v)}
          >
            <PixelArt name="cards-zz" scale={2} decorative />
            <span>
              {CARD_WORDS.skippedLine(skipped.length)} · {CARD_WORDS.show}
            </span>
          </button>
          <button type="button" className="n-link-btn" onClick={() => actions.unskip(skipped)}>
            {CARD_WORDS.undo}
          </button>
        </div>
      ) : null}
      {dismissed.length > 0 ? (
        <div className="n-hidden-list">
          <button
            type="button"
            className="n-link-btn"
            aria-expanded={showHidden}
            onClick={() => setShowHidden((v) => !v)}
          >
            {CARD_WORDS.hidden(dismissed.length)}
          </button>
          {showHidden ? (
            <ul>
              {dismissed.map((d) => (
                <li key={d.key}>
                  {d.text}{' '}
                  <button type="button" className="n-link-btn" onClick={() => actions.undismiss([d.key])}>
                    {CARD_WORDS.undo}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

/**
 * R-PILL-1: a character's cap pills in the Focus header ("Anvil full · collect"; `now.info-lines` Fold
 * into caps: a cap not full yet is the "soon" state). Each is a disclosure button; open, it shows the
 * full text with the refill time, the Why and the Source, with Skip today and Report this.
 */
export function CapPills({ caps, ready = false }: { caps: CapPillView[]; ready?: boolean }) {
  const actions = useNowActions();
  const base = useId();
  if (caps.length === 0) return null;
  return (
    <div className="caps n-caps">
      <ul className="cap-list" aria-label="Quick collects">
        {caps.map((c, n) => (
          <li key={c.key}>
            <button
              type="button"
              data-cap-key={c.key}
              className={cx('cap n-cap-btn', c.fullNow && 'full', actions.highlight === c.key && 'lit')}
              aria-expanded={actions.expanded.has(capOpenId(c.key))}
              aria-controls={`${base}-${n}`}
              onClick={() => actions.toggle(capOpenId(c.key))}
            >
              <Pill
                urgency={c.fullNow ? (ready ? 'optional' : 'fix') : 'soon'}
                glyph={capGlyph(c.label)}
                verb={c.label}
              />
            </button>
          </li>
        ))}
      </ul>
      {caps.map((c, n) =>
        actions.expanded.has(capOpenId(c.key)) ? (
          <div key={c.key} id={`${base}-${n}`} className="cap-open n-cap-open">
            <p className="na-text">{c.text}</p>
            {c.why ? <p className="why n-muted">{c.why}</p> : null}
            {c.source ? (
              <div className="na-meta">
                <SourceLabel source={c.source} />
              </div>
            ) : null}
            <ActionControls
              actionKey={c.key}
              controls={{ skip: true, notForMe: false, report: true }}
              report={{
                outputKind: 'next-action',
                entryIds: [c.entryId],
                fields: [],
                text: c.text,
                stale: c.source?.stale ?? false,
                contested: false,
              }}
            />
          </div>
        ) : null,
      )}
    </div>
  );
}
