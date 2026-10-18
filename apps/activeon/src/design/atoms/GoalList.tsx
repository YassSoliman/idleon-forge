// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-F5 (moved verbatim from now/parts.tsx in Phase F): the ranked Goal list with "show more",
// "n skipped · undo" and "Hidden until next patch", used by Now, Account and the System pages. It renders
// each Goal with Now's NextActionItem and SeeItLink.
import type { GoalView } from '@idleon-forge/engine/now';
import { useNowActions } from '../../now/context';
import { NextActionItem, SeeItLink } from '../../now/parts';

export function GoalList({
  goals,
  subject,
  hiddenCount,
  skipped,
  dismissed,
  highlightFirst = false,
  seeIt = true,
  who,
}: {
  goals: GoalView[];
  subject: string;
  hiddenCount: number;
  /** Keys skipped on this subject, for "n skipped · undo". */
  skipped: string[];
  dismissed: { key: string; text: string }[];
  highlightFirst?: boolean;
  /** M17 FR-31: never on the System page itself. */
  seeIt?: boolean;
  /** M17 FR-23: who each Goal is for, on a System page. */
  who?: (g: GoalView, n: number) => string | null;
}) {
  const actions = useNowActions();
  const expanded = actions.expanded.has(subject);
  return (
    <>
      <ul className="goals">
        {goals.map((g, n) => (
          <li key={g.action.key}>
            {who?.(g, n) ? <p className="who small">{who(g, n)}</p> : null}
            <NextActionItem
              action={g.action}
              milestone={g.milestone}
              details={g.details}
              walkthrough={g.walkthrough}
              first={highlightFirst && n === 0}
            />
            {seeIt ? <SeeItLink goal={g} subject={subject} /> : null}
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
        // M17 FR-27: a skipped bar's "See the fix" lands here, found by its key and outlined (R6 QA).
        <p
          className={`small muted skipped-line${actions.highlight && skipped.includes(actions.highlight) ? ' lit' : ''}`}
          data-skipped-keys={skipped.join(' ')}
        >
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
