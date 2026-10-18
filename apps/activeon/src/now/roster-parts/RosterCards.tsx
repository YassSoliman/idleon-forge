// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Roster's cards above the rows, a lazy part (M21 TR-12): the roster findings, the grouped jobs and
// the one Spend card. They show only when the save has them, so they load after the rows.
// - Roster findings (`now.cap-pills` Account-level finding): a cap pill on 3 or more rows, said once, as a
//   filter that dims the rows without it.
// - Grouped jobs (`now.roster` Grouped jobs on top): the sentence once, the characters as glyph chips,
//   map by map, biggest stop first.
// - One Spend card (`now.spend-chip` Fold into one spend card): the payers as glyph chips.
import { GROUP_WORDS, type NowView, ROSTER_WORDS } from '@idleon-forge/engine/now';
import type { EngineResult } from '@idleon-forge/engine/result';
import { PixelArt } from '../../design/art/PixelArt';
import { cx } from '../../design/atoms/Button';
import { GlyphChip } from '../../design/atoms/Chip';
import { Pill } from '../../design/atoms/Pill';
import { coins } from '../../design/format';
import { capGlyph } from '../chrome/cap-glyph';
import { useNowActions } from '../context';
import type { FindingView, GroupedJobView, NowSessionView } from '../session/types';

function Findings({ findings }: { findings: FindingView[] }) {
  const actions = useNowActions();
  if (findings.length === 0) return null;
  return (
    <fieldset className="n-findings">
      <legend className="sr-only">{GROUP_WORDS.findingsLabel}</legend>
      {findings.map((f) => (
        <Pill
          key={f.entryId}
          urgency={f.fullNow ? 'optional' : 'soon'}
          glyph={capGlyph(f.label)}
          verb={f.text}
          filter={{
            pressed: actions.expanded.has(`finding:${f.entryId}`),
            onToggle: () => actions.toggle(`finding:${f.entryId}`),
          }}
        />
      ))}
    </fieldset>
  );
}

function GroupCard({ g, onOpen }: { g: GroupedJobView; onOpen(i: number): void }) {
  return (
    <section className={cx('n-group', g.blocker && 'is-fix')} aria-label={g.heading}>
      <p className="n-group__h">
        <PixelArt name={capGlyph(g.text)} decorative />
        {g.heading}
      </p>
      <p className="n-group__t">{g.text}</p>
      <ol className="n-group__stops">
        {g.stops.map((st) => (
          <li key={st.map ?? '-'} className="n-group__stop">
            {st.map ? (
              <p className="n-group__map">
                <PixelArt name="now-pin" decorative />
                {st.map}
              </p>
            ) : null}
            <span className="n-chipset">
              {st.chips.map((c) => (
                <GlyphChip
                  key={c.index}
                  family={c.family}
                  label={c.label}
                  detail={c.detail ?? undefined}
                  onClick={() => onOpen(c.index)}
                />
              ))}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** One Spend card: the payers as glyph chips, then the Spend Plan (FR-N9's door from the Roster). */
function SpendCard({ view, result, onSpend }: { view: NowView; result: EngineResult; onSpend(): void }) {
  const payers = view.roster.flatMap((r) => {
    const c = result.characters.find((x) => x.index === r.index);
    return c?.spendChip ? [{ row: r, ...c.spendChip }] : [];
  });
  if (payers.length === 0) return null;
  const lines = payers.reduce((n, p) => n + p.lines, 0);
  return (
    <section className="n-spendcard" aria-label={ROSTER_WORDS.spendCard}>
      <p className="n-group__h">
        <PixelArt name="now-coin" scale={2} decorative />
        <span>
          <b>{ROSTER_WORDS.spendTitle}</b> · {ROSTER_WORDS.spendLine(lines, payers.length)}
        </span>
      </p>
      <span className="n-chipset">
        {payers.map((p) => (
          <GlyphChip
            key={p.row.index}
            family={view.families?.[p.row.index] ?? 'beginner'}
            label={`${p.row.classLabel} ${p.row.level}`}
            detail={`${p.lines} · ${coins(p.coins)}`}
            onClick={onSpend}
          />
        ))}
      </span>
      <button type="button" className="n-link-btn" onClick={onSpend}>
        {ROSTER_WORDS.spendOpen}
        <PixelArt name="ui-arrow-right" decorative />
      </button>
    </section>
  );
}

export function RosterCards({
  view,
  result,
  session,
  onOpen,
  onSpend,
}: {
  view: NowView;
  result: EngineResult;
  session: NowSessionView;
  onOpen(i: number): void;
  onSpend(): void;
}) {
  return (
    <>
      <Findings findings={session.findings} />
      {session.groups.map((g) => (
        <GroupCard key={g.entryId} g={g} onOpen={onOpen} />
      ))}
      <SpendCard view={view} result={result} onSpend={onSpend} />
    </>
  );
}
