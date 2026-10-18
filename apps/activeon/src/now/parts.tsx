// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The shared pieces of a Next Action (M10 TR-4): the controls (Skip today, Not for me, Report this).
// M21 Phase F moved the Source label, the Contested badge, the meta row and the Goal list into
// design/atoms/; they are re-exported here until Integration (FR-I3).
// All text is React text: no dangerouslySetInnerHTML anywhere (TR-13).
import {
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
import { useId, useState } from 'react';
import { ActionMeta } from '../design/atoms/ActionMeta';
import { SourceLabel } from '../design/atoms/SourceLabel';
import { formatRoute } from '../shell/route';
import { type ReportOutput, useNowActions } from './context';
import { PUBLIC_NOTICE } from './report';
import { Walkthrough } from './walkthrough/Walkthrough';

export { ActionMeta, ContestedBadge } from '../design/atoms/ActionMeta';
export { GoalList } from '../design/atoms/GoalList';
export { ExternalLink, SourceLabel } from '../design/atoms/SourceLabel';

/**
 * Report this (FR-30, US-12; M13 FR-9): opens the in-app Suggest form when the Suggestions provider is
 * there; otherwise two taps, with the public notice in between, to the pre-filled GitHub issue.
 */
export function ReportThis({ input }: { input: ReportOutput }) {
  const actions = useNowActions();
  const [open, setOpen] = useState(false);
  const { openReport } = actions;
  if (openReport)
    return (
      <button type="button" className="ghost tiny" onClick={() => openReport(input)}>
        Report this
      </button>
    );
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
  report: ReportOutput;
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
  const { highlight } = useNowActions();
  const lit = highlight === action.key;
  return (
    <div className={`na${first ? ' first' : ''}${lit ? ' lit' : ''}`} data-na-key={action.key}>
      <span className="tag">{action.tag}</span>
      <p className="na-text">{action.text}</p>
      {milestone ? <p className="small muted">{milestone}</p> : null}
      <p className="why small">Why: {action.why}</p>
      <GoalDetails details={details} />
      {walkthrough ? <Walkthrough view={walkthrough} /> : null}
      <ActionMeta action={action} />
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

/**
 * M17 FR-31: "See it: <System>", one quiet link under a Next Action on Now, to its System's home
 * (FR-23a): a character's Build or Cards tab, or the System page with this Next Action outlined. The
 * Behind Goal links to its chosen row's System; ActiveOn's own concepts (Spend Plan, Meta Path) get none.
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
  // Phase 2: ActiveOn's own AFK Next Actions live on the Timeline (FR-31).
  if (timelineHome(goal.system) && result.returnAt !== undefined)
    return (
      <a
        className="small build-link see-it"
        href={formatRoute({ place: 'timeline', section: null })}
        onClick={(e) => {
          e.preventDefault();
          actions.navigate?.({ place: 'timeline', section: null });
        }}
      >
        {LINK_WORDS.seeIt(PLACE_WORDS.timeline)}
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
      className="small build-link see-it"
      href={href}
      onClick={(e) => {
        e.preventDefault();
        if (index !== null && tab) actions.openTab(index, tab);
        else actions.navigate?.({ place: 'system', id }, { highlight: goal.action.key });
      }}
    >
      {LINK_WORDS.seeIt(name)}
    </a>
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
              data-cap-key={c.key}
              className={`cap${c.fullNow ? ' full' : ''}${actions.highlight === c.key ? ' lit' : ''}`}
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
