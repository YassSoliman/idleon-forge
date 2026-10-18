// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Roster in Rounds (M21 FR-N3, FR-N4; `now.roster` Grouped jobs on top, `now.roster-row` Three-token
// line, `now.cap-pills` Optional tag + Account-level finding, `now.spend-chip` Fold into one spend card).
// - Roster findings: a cap pill on 3 or more rows is said once ("Anvil full on 6 · collect"), as a filter
//   that dims the rows without it; those rows keep only its glyph.
// - Grouped jobs: a Next Action entry on 2 or more rows is one card ("Same job on 8 characters") with
//   the sentence said once and the characters as glyph chips, map by map, biggest stop first; the rows
//   show a small marker instead of the sentence (DS-7).
// - One Spend card lists the payers as glyph chips; no row carries a coin chip.
// - Rows, in the frozen Visit Order (DS-8): line 1 who (the who-glyph, class and level) · where · the
//   Verdict stamp; line 2 the verb; up to 3 cap pills ("optional" on a Ready row); one tab chip (G4). The
//   row is one button with the whole row in its name (TR-14). With 6 or more characters the Ready rows
//   fold into one line of glyphs ("4 ready"); Unknown rows sit in their own fold under the counter.
// Words are the engine's; this file only lays them out (M10 red-team #5).
import {
  type CapPillView,
  GROUP_WORDS,
  LINK_WORDS,
  type NowView,
  ROSTER_WORDS,
  type RosterRow,
  type TabHealth,
} from '@idleon-forge/engine/now';
import type { EngineResult } from '@idleon-forge/engine/result';
import { type CSSProperties, forwardRef } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { cx } from '../design/atoms/Button';
import { GlyphChip } from '../design/atoms/Chip';
import { VERDICT_GLYPH } from '../design/atoms/glyphs';
import { LegacyPill } from '../design/atoms/LegacyPill';
import { Pill, VerdictStamp } from '../design/atoms/Pill';
import { coins, inSpan } from '../design/format';
import { WhoGlyph } from '../design/who/WhoGlyph';
import { formatRoute } from '../shell/route';
import { type CharacterTab, characterTabs } from './character-tabs';
import { capGlyph, capOpenId } from './chrome/cap-glyph';
import { useNowActions } from './context';
import type { FindingView, GroupedJobView, NowSessionView } from './session/types';

/** Re-exported for older importers until Integration (M21 FR-I3). */
export { LegacyPill as Pill };

const STAMP_WORD = { ready: 'Ready', fix: 'Fix', unknown: 'Unknown' } as const;

/** The row's Verdict stamp: glyph plus one word ("Fix"), the long form only in Focus. */
function Stamp({ row }: { row: RosterRow }) {
  const skipped = row.pill.text.includes('skipped');
  const verdict = row.pill.kind === 'unknown' && skipped ? 'skipped' : row.pill.kind;
  return <VerdictStamp verdict={verdict} word={skipped ? row.pill.text : STAMP_WORD[row.pill.kind]} />;
}

/** G4: the one tab chip a row keeps, the most useful one. With TabHealth (area C), only a tab that is
 *  fix, behind or empty, the most severe first, then tab order; until then, the Build or Cards tab. */
type HealthTab = CharacterTab & { health?: (view: NowView, index: number) => TabHealth | null };
const SEVERITY = ['fix', 'behind', 'empty'] as const;
export function rowTabChip(
  view: NowView,
  index: number,
): { id: string; label: string; word: string | null } | null {
  const tabs = characterTabs.filter((t) => t.Component !== null) as HealthTab[];
  const withHealth = tabs.filter((t) => typeof t.health === 'function');
  if (withHealth.length > 0) {
    let best: { id: string; label: string; word: string; rank: number } | null = null;
    for (const t of withHealth) {
      const h = t.health?.(view, index);
      const rank = h ? SEVERITY.indexOf(h.level as (typeof SEVERITY)[number]) : -1;
      if (h && rank >= 0 && (best === null || rank < best.rank))
        best = { id: t.id, label: t.label, word: h.word, rank };
    }
    return best ? { id: best.id, label: best.label, word: best.word } : null;
  }
  if (view.builds.some((b) => b.index === index)) return { id: 'build', label: 'Build', word: null };
  if (view.cards?.characters.some((c) => c.index === index))
    return { id: 'cards', label: 'Cards', word: null };
  return null;
}

function RowCaps({
  row,
  inFindings,
  ready,
}: {
  row: RosterRow;
  inFindings: readonly string[];
  ready: boolean;
}) {
  if (row.caps.length === 0) return null;
  const said = (c: CapPillView) => inFindings.includes(c.entryId);
  return (
    <span className="n-row__caps">
      {row.caps.map((c) =>
        said(c) ? (
          <span key={c.key} className="n-row__capmark" data-cap={c.key} title={c.label}>
            <PixelArt name={capGlyph(c.label)} decorative />
            <span className="sr-only">{c.label}</span>
          </span>
        ) : (
          <span key={c.key} data-cap={c.key} className="n-row__cap">
            <Pill
              urgency={c.fullNow ? (ready ? 'optional' : 'fix') : 'soon'}
              glyph={capGlyph(c.label)}
              verb={c.label}
            />
          </span>
        ),
      )}
      {row.moreCaps > 0 ? (
        <span className="n-row__more num">{ROSTER_WORDS.moreCaps(row.moreCaps)}</span>
      ) : null}
      {ready && row.caps.some((c) => c.fullNow && !said(c)) ? (
        <em className="n-opt">{ROSTER_WORDS.optional}</em>
      ) : null}
    </span>
  );
}

const Row = forwardRef<
  HTMLButtonElement,
  {
    row: RosterRow;
    view: NowView;
    family: Parameters<typeof WhoGlyph>[0]['family'];
    group: boolean;
    inFindings: readonly string[];
    dimmed: boolean;
    lane: { x: number; text: string } | null;
    onOpen(i: number): void;
  }
>(function Row({ row, view, family, group, inFindings, dimmed, lane, onOpen }, ref) {
  const actions = useNowActions();
  const chip = rowTabChip(view, row.index);
  const onClick = (e: React.MouseEvent) => {
    const cap = (e.target as HTMLElement).closest<HTMLElement>('[data-cap]')?.dataset.cap;
    if (cap && !actions.expanded.has(capOpenId(cap))) actions.toggle(capOpenId(cap));
    onOpen(row.index);
  };
  const ready = row.pill.kind === 'ready';
  return (
    <li className={cx('r', 'n-row', `is-${row.pill.kind}`, row.pill.kind, dimmed && 'is-dim')}>
      <button
        ref={ref}
        type="button"
        className="r-btn n-row__btn"
        aria-label={row.accessibleName}
        data-index={row.index}
        onClick={onClick}
      >
        <WhoGlyph
          family={family}
          classLabel={row.classLabel}
          level={row.level}
          scale={2}
          animate={row.playing}
          decorative
        />
        <span className="n-row__l1">
          <b>
            {row.classLabel} <span className="num">{row.level.toLocaleString('en-US')}</span>
          </b>
          {row.map ? (
            <span className="n-row__where">
              <PixelArt name="now-pin" decorative />
              {row.map}
            </span>
          ) : null}
          {row.playing ? <span className="n-row__playing">{ROSTER_WORDS.playing}</span> : null}
          {row.nextUp ? <span className="n-row__playing">{ROSTER_WORDS.nextUp}</span> : null}
        </span>
        <span className="n-row__v">
          <Stamp row={row} />
        </span>
        <span className="n-row__l2">
          {group ? (
            <span className="n-row__ingroup">
              <PixelArt name="now-glyph-wrench" decorative />
              {GROUP_WORDS.inGroup}
            </span>
          ) : (
            row.summary
          )}
        </span>
        <RowCaps row={row} inFindings={inFindings} ready={ready} />
        {lane ? (
          // `now.roster` Lanes (the Command Board roster from 1000 px): who needs me first, by length.
          <span className="n-row__lane" aria-hidden="true" style={{ '--at': lane.x } as CSSProperties}>
            <span className="n-row__lane-bar" />
            <span className="n-row__lane-t num">{lane.text}</span>
          </span>
        ) : null}
      </button>
      {chip ? (
        <a
          className="a-chip n-row__tab"
          href={`#${chip.id}-${row.index}`}
          aria-label={chip.word ? `${row.name}: ${chip.id} · ${chip.word}` : `${row.name}: ${chip.id}`}
          onClick={(e) => {
            e.preventDefault();
            actions.openTab(row.index, chip.id);
          }}
        >
          <span>{chip.label}</span>
          {chip.word ? <span className="a-chip__detail num">{chip.word}</span> : null}
        </a>
      ) : null}
    </li>
  );
});

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

/** One Spend card: the payers as glyph chips, then Open Spend Plan (FR-N9's door from the Roster). */
function SpendCard({ view, result, onSpend }: { view: NowView; result: EngineResult; onSpend(): void }) {
  const payers = view.roster.flatMap((r) => {
    const c = result.characters.find((x) => x.index === r.index);
    return c?.spendChip ? [{ row: r, ...c.spendChip }] : [];
  });
  if (payers.length === 0) return null;
  const lines = payers.reduce((n, p) => n + p.lines, 0);
  return (
    <section className="n-spendcard" aria-label="Spend Plan">
      <p className="n-group__h">
        <PixelArt name="now-coin" scale={2} decorative />
        <span>
          <b>Spend coins</b> · {lines} buys on {payers.length} characters
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
        Open the Spend Plan
        <PixelArt name="ui-arrow-right" decorative />
      </button>
    </section>
  );
}

export interface RosterProps {
  view: NowView;
  result: EngineResult;
  session: NowSessionView;
  onOpen(i: number): void;
  onSpend(): void;
  rowRef(index: number, el: HTMLButtonElement | null): void;
}

export function Roster({ view, result, session, onOpen, onSpend, rowRef }: RosterProps) {
  const actions = useNowActions();
  const families = view.families ?? {};
  const filters = session.findings.filter((f) => actions.expanded.has(`finding:${f.entryId}`));
  const dimmed = (i: number) => filters.length > 0 && !filters.some((f) => f.indexes.includes(i));
  const readyFold = new Set(session.readyFold);
  const now = Date.now();
  const axis = result.expectedReturn.usedSeconds * 1000;
  const laneOf = (i: number) => {
    const f = result.characters.find((c) => c.index === i)?.firstFill;
    if (!f || axis <= 0) return null;
    const x = Math.min(1, Math.max(0, (f.at - now) / axis));
    return { x, text: `${f.what ?? f.label} ${f.at <= now ? 'now' : inSpan(f.at - now)}` };
  };
  const readyOpen = actions.expanded.has('ready-fold');
  const unknownOpen = actions.expanded.has('unknown-fold');
  const row = (r: RosterRow) => (
    <Row
      key={r.index}
      row={r}
      view={view}
      family={families[r.index] ?? 'beginner'}
      group={session.marks[r.index]?.group != null}
      inFindings={session.marks[r.index]?.inFindings ?? []}
      dimmed={dimmed(r.index)}
      lane={laneOf(r.index)}
      onOpen={onOpen}
      ref={(el) => rowRef(r.index, el)}
    />
  );
  const main = view.roster.filter((r) => r.pill.kind !== 'unknown' && !readyFold.has(r.index));
  const folded = view.roster.filter((r) => readyFold.has(r.index));
  const unknown = view.roster.filter((r) => r.pill.kind === 'unknown');
  return (
    <section aria-label={ROSTER_WORDS.heading} className="n-roster">
      <h2 className="n-section-h roster-h">
        {ROSTER_WORDS.heading}
        {view.builds.length > 0 || view.cards ? (
          // M17 D-7: the Builds and Cards overviews live in Characters; the row chips stay.
          <a
            className="roster-builds n-section-h__link"
            href={formatRoute({ place: 'characters', section: null })}
            onClick={(e) => {
              if (!actions.navigate) return;
              e.preventDefault();
              actions.navigate({ place: 'characters', section: null });
            }}
          >
            {LINK_WORDS.toCharacters}
          </a>
        ) : null}
      </h2>
      <Findings findings={session.findings} />
      {session.groups.map((g) => (
        <GroupCard key={g.entryId} g={g} onOpen={onOpen} />
      ))}
      <SpendCard view={view} result={result} onSpend={onSpend} />
      <ol className="roster n-rows">{main.map(row)}</ol>
      {folded.length > 0 ? (
        <>
          <button
            type="button"
            className="n-fold-btn n-fold-btn--ready"
            aria-expanded={readyOpen}
            aria-controls="n-ready-fold"
            aria-label={ROSTER_WORDS.readyFoldName(folded.length)}
            onClick={() => actions.toggle('ready-fold')}
          >
            <PixelArt name={VERDICT_GLYPH.ready} decorative />
            <b>{ROSTER_WORDS.readyFold(folded.length)}</b>
            <span className="n-fold-btn__glyphs" aria-hidden="true">
              {folded.map((r) => (
                <WhoGlyph
                  key={r.index}
                  family={families[r.index] ?? 'beginner'}
                  classLabel={r.classLabel}
                  scale={1}
                  decorative
                />
              ))}
            </span>
          </button>
          <ol id="n-ready-fold" className={cx('roster n-rows', !readyOpen && 'is-folded')}>
            {folded.map(row)}
          </ol>
        </>
      ) : null}
      {unknown.length > 0 ? (
        <ol id="n-unknown-fold" className={cx('roster n-rows n-rows--unknown', !unknownOpen && 'is-folded')}>
          {unknown.map(row)}
        </ol>
      ) : null}
    </section>
  );
}
