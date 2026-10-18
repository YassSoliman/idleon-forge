// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The shared pieces of a Next Action (M10 TR-4): Source label with its Stale and Contested marks, the
// controls (Skip today, Not for me, Report this), and the Goal list with "show more" and undo.
// All text is React text: no dangerouslySetInnerHTML anywhere (TR-13).
import type {
  CapPillView,
  ControlsView,
  GoalView,
  NextActionView,
  SourceView,
} from '@idleon-forge/engine/now';
import { useId, useState } from 'react';
import { useNowActions } from './context';
import { PUBLIC_NOTICE } from './report';
import { Walkthrough } from './walkthrough/Walkthrough';

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/**
 * The Source line (FR-18, FR-19, #74): the best player-facing Source as a link named for its page
 * ("IdleOn Wiki: Smithing"), then the muted Toolbox credit, linked to the Toolbox website page, never to
 * code. With no wiki or guide, the link is that Toolbox page ("IdleOn Toolbox: Anvil") and the credit
 * stays text. "+n" lists the other player Sources in Focus.
 */
export function SourceLabel({ source, more = true }: { source: SourceView; more?: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const cls = `src${source.stale ? ' stale' : ''}`;
  if (!source.text && !source.credit && !source.stale) return null;
  return (
    <span className="src-wrap">
      {source.text ? (
        source.href ? (
          <a className={cls} href={source.href} target="_blank" rel="noopener noreferrer">
            {source.text}
          </a>
        ) : (
          <span className={cls}>{source.text}</span>
        )
      ) : null}
      {source.credit ? (
        <span className="src-credit muted">
          {source.text ? ' · ' : ''}
          {source.creditHref ? (
            <a className="muted" href={source.creditHref} target="_blank" rel="noopener noreferrer">
              {source.credit}
            </a>
          ) : (
            source.credit
          )}
        </span>
      ) : null}
      {source.stale ? <span className="src-stale"> · Stale</span> : null}
      {more && source.more.length > 0 ? (
        <>
          <button
            type="button"
            className="ghost tiny"
            aria-expanded={open}
            aria-controls={id}
            aria-label={`${source.more.length} more source${source.more.length === 1 ? '' : 's'}`}
            onClick={() => setOpen((o) => !o)}
          >
            +{source.more.length}
          </button>
          {open ? (
            <ul id={id} className="src-more">
              {source.more.map((m) => (
                <li key={`${m.text}${m.href}`}>
                  {m.href ? <ExternalLink href={m.href}>{m.text}</ExternalLink> : m.text}{' '}
                  <span className="muted">verified {m.verifiedOn}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </span>
  );
}

/** "sources disagree" with both sides behind an expander (FR-20). */
export function ContestedBadge({ contested }: { contested: NonNullable<NextActionView['contested']> }) {
  return (
    <details className="contested">
      <summary>sources disagree</summary>
      <ul>
        {contested.sides.map((s) => (
          <li key={s.text}>
            {s.text}{' '}
            {s.sources.map((src) => (
              <SourceLabel key={`${src.href}${src.text}${src.credit}`} source={src} more={false} />
            ))}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Report this: two taps, with the public notice in between (FR-30, US-12). */
export function ReportThis({
  input,
}: {
  input: Parameters<ReturnType<typeof useNowActions>['reportUrl']>[0];
}) {
  const actions = useNowActions();
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button type="button" className="ghost tiny" onClick={() => setOpen(true)}>
        Report this
      </button>
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
      <button type="button" className="ghost tiny" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </span>
  );
}

export function ActionControls({
  actionKey,
  controls,
  report,
}: {
  actionKey: string;
  controls: ControlsView;
  report: Parameters<ReturnType<typeof useNowActions>['reportUrl']>[0];
}) {
  const actions = useNowActions();
  return (
    <div className="controls">
      {controls.skip ? (
        <button type="button" className="ghost tiny" onClick={() => actions.skip(actionKey)}>
          Skip today
        </button>
      ) : null}
      {controls.notForMe ? (
        <button type="button" className="ghost tiny" onClick={() => actions.dismiss(actionKey)}>
          Not for me
        </button>
      ) : null}
      {controls.report ? <ReportThis input={report} /> : null}
    </div>
  );
}

/** The one shared component for a Next Action (TR-4). */
/** Goal.details: per-character lines under an account Goal, collapsed by default (#70 A2, A3). */
export function GoalDetails({ details }: { details: GoalView['details'] }) {
  if (details.length === 0) return null;
  return (
    <details className="goal-details small muted">
      <summary>show details ({details.length})</summary>
      <ul>
        {details.map((d) => (
          <li key={d.key}>{d.text}</li>
        ))}
      </ul>
    </details>
  );
}

export function NextActionItem({
  action,
  milestone,
  details = [],
  walkthrough = null,
  first,
}: {
  action: NextActionView;
  milestone?: string | null;
  details?: GoalView['details'];
  walkthrough?: GoalView['walkthrough'];
  first?: boolean;
}) {
  return (
    <div className={`na${first ? ' first' : ''}`}>
      <span className="tag">{action.tag}</span>
      <p className="na-text">{action.text}</p>
      {milestone ? <p className="small muted">{milestone}</p> : null}
      <p className="why small">Why: {action.why}</p>
      <GoalDetails details={details} />
      {walkthrough ? <Walkthrough view={walkthrough} /> : null}
      <div className="na-meta">
        <SourceLabel source={action.source} />
        {action.contested ? <ContestedBadge contested={action.contested} /> : null}
      </div>
      <ActionControls
        actionKey={action.key}
        controls={action.controls}
        report={{
          outputKind: 'next-action',
          entryIds: action.provenance.entryIds.length ? action.provenance.entryIds : [action.entryId],
          fields: action.provenance.fields,
          text: action.text,
          stale: action.stale,
          contested: action.contested !== null,
        }}
      />
    </div>
  );
}

export function GoalList({
  goals,
  subject,
  hiddenCount,
  skipped,
  dismissed,
  highlightFirst = false,
}: {
  goals: GoalView[];
  subject: string;
  hiddenCount: number;
  /** Keys skipped on this subject, for "n skipped · undo". */
  skipped: string[];
  dismissed: { key: string; text: string }[];
  highlightFirst?: boolean;
}) {
  const actions = useNowActions();
  const expanded = actions.expanded.has(subject);
  return (
    <>
      <ul className="goals">
        {goals.map((g, n) => (
          <li key={g.action.key}>
            <NextActionItem
              action={g.action}
              milestone={g.milestone}
              details={g.details}
              walkthrough={g.walkthrough}
              first={highlightFirst && n === 0}
            />
          </li>
        ))}
      </ul>
      {hiddenCount > 0 || expanded ? (
        <button
          type="button"
          className="ghost"
          aria-expanded={expanded}
          onClick={() => actions.toggle(subject)}
        >
          {expanded ? 'show less' : `show more (${hiddenCount})`}
        </button>
      ) : null}
      {skipped.length > 0 ? (
        <p className="small muted">
          {skipped.length} skipped ·{' '}
          <button type="button" className="ghost tiny" onClick={() => actions.unskip(skipped)}>
            undo
          </button>
        </p>
      ) : null}
      {dismissed.length > 0 ? (
        <details className="hidden-list small">
          <summary>Hidden until next patch ({dismissed.length})</summary>
          <ul>
            {dismissed.map((d) => (
              <li key={d.key}>
                {d.text}{' '}
                <button type="button" className="ghost tiny" onClick={() => actions.undismiss([d.key])}>
                  undo
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}

/** The `expanded` id that keeps a cap pill open across the Roster and Focus (R-PILL-1). */
export const capOpenId = (key: string) => `cap:${key}`;

/**
 * R-PILL-1: a character's cap pills in the Focus header ("Anvil full · collect"). Each is a disclosure
 * button; open, it shows the full text with the refill time, the Why and the Source, with Skip today and
 * Report this. Never a blocker, never a Fix card.
 */
export function CapPills({ caps }: { caps: CapPillView[] }) {
  const actions = useNowActions();
  const base = useId();
  if (caps.length === 0) return null;
  return (
    <div className="caps">
      <ul className="cap-list" aria-label="Quick collects">
        {caps.map((c, n) => (
          <li key={c.key}>
            <button
              type="button"
              className={`cap${c.fullNow ? ' full' : ''}`}
              aria-expanded={actions.expanded.has(capOpenId(c.key))}
              aria-controls={`${base}-${n}`}
              onClick={() => actions.toggle(capOpenId(c.key))}
            >
              {c.label}
            </button>
          </li>
        ))}
      </ul>
      {caps.map((c, n) =>
        actions.expanded.has(capOpenId(c.key)) ? (
          <div key={c.key} id={`${base}-${n}`} className="cap-open small">
            <p className="na-text">{c.text}</p>
            {c.why ? <p className="why">Why: {c.why}</p> : null}
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
