// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (area I-now): the Log in and Rounds pause points, the boards `after/NowLogIn` and `after/NowRounds`.
// A lazy part: Log off is the first screen; these load when picked.
// - Log in: "Welcome back" with what filled up while you were away (the engine's Away rows: limits,
//   resets, levels), then the one framed "Start with" (the first fix, else the account's losing-now
//   Goal, else the first character's job), then "Then your round".
// - Rounds: the framed next character on the round, the round as a numbered strip in Visit Order, the
//   same job said once ("Same job on 5: spend the full worship charge"), and the way back to Log off.
import type { NowView, TimelineView } from '@idleon-forge/engine/now';
import { PixelArt } from '../../design/art/PixelArt';
import { Blob } from '../../design/atoms/Blob';
import { cx } from '../../design/atoms/Button';
import { Pip } from '../../design/atoms/Surfaces';
import { TokenLine } from '../../design/atoms/TokenLine';
import type { ClassFamily } from '../../design/who/WhoGlyph';
import { formatRoute } from '../../shell/route';
import type { LoginRow, NowSessionView } from '../session/types';
import { Badged } from './Badged';
import { cardState, type FullGroup, fullSet, type LossNow, PIP, roundNext } from './derive';
import { Icon, systemSprite } from './icon';
import { Go } from './LogOff';
import { rowTabChip } from './tab-chip';
import { NOW_PLACE_WORDS as W } from './words';

const familyOf = (view: NowView, i: number): ClassFamily => view.families?.[i] ?? 'beginner';
/** M25: the game's class icon on the blob's corner (ClassBadge), as on the Characters list. */
const classOf = (view: NowView, i: number): string | undefined =>
  view.roster.find((r) => r.index === i)?.classLabel;
const who = (view: NowView, i: number) => {
  const r = view.roster.find((x) => x.index === i);
  return r ? `${r.classLabel} ${r.level}` : '';
};
const charHref = (index: number) => formatRoute({ place: 'character', index, tab: 'now' });

export interface PauseViewProps {
  /** False while another block holds the screen's one frame (the World 4 welcome). */
  framed?: boolean;
  view: NowView;
  sv: NowSessionView;
  timeline: TimelineView | null;
  groups: FullGroup[];
  losses: LossNow[];
  visited: readonly number[];
  onOpen(index: number): void;
  onBuild(index: number): void;
  onPause(tab: 'login' | 'rounds' | 'logoff'): void;
  onTimeline(): void;
  onDaily(): void;
  onFirst(): void;
}

/** A Log in row's System, from its words (a row carries no System id); null when none matches. */
const rowSystem = (text: string): string | null =>
  /worship/i.test(text)
    ? 'worship'
    : /colosseum|ticket/i.test(text)
      ? 'colosseum'
      : /bubba|megaflesh/i.test(text)
        ? 'bubba'
        : /anvil/i.test(text)
          ? 'anvil'
          : /trap/i.test(text)
            ? 'trapping'
            : /salt|fuel|refinery/i.test(text)
              ? 'refinery'
              : null;

/** A Log in row's sprite: a System's (its game sprite, through KitSprite), else a status glyph. */
const rowSprite = (r: LoginRow): string => {
  if (r.kind === 'reset') return 'status-clock';
  if (r.kind === 'level') return 'item-star'; // a level-up has no game sprite: our star (UI chrome)
  const sys = rowSystem(r.text);
  return sys ? `sys-${sys}` : 'status-full';
};

function LoginRows({ rows, p }: { rows: LoginRow[]; p: PauseViewProps }) {
  return (
    <ol className="np-rows">
      {rows.map((r) => {
        const daily = r.kind === 'reset' || r.key.startsWith('loss:');
        const go =
          r.kind === 'level' && r.index !== null
            ? () => p.onBuild(r.index as number)
            : daily
              ? p.onDaily
              : p.onTimeline;
        const href =
          r.kind === 'level' && r.index !== null
            ? formatRoute({ place: 'character', index: r.index, tab: 'build' })
            : daily
              ? '#daily'
              : '#timeline';
        return (
          <li key={r.key} className="np-row" data-kind={r.key.startsWith('loss:') ? 'loss' : r.kind}>
            <span className="np-row__ic" aria-hidden="true">
              <Icon name={rowSprite(r)} size={24} />
            </span>
            <span className="np-row__t">{r.text}</span>
            <Go href={href} onGo={go} className="np-row__go">
              {daily ? W.rowLink.reset : W.rowLink[r.kind]}
              <PixelArt name="ui-arrow-right" decorative />
            </Go>
          </li>
        );
      })}
    </ol>
  );
}

export function LogInView(p: PauseViewProps) {
  const { view, sv } = p;
  // Without a save history the engine has no Away rows; what is full or being lost now still filled up
  // while the player was away, so those are the rows (the same facts as the Log off hero).
  const engineRows = sv.away?.rows.length ? sv.away.rows : (sv.login?.rows ?? []);
  const rows: LoginRow[] = engineRows.length
    ? engineRows
    : [
        ...p.losses.map((l) => ({
          key: `loss:${l.entryId}`,
          text: l.label,
          kind: 'limit' as const,
          index: null,
        })),
        ...p.groups.map((g) => ({
          key: `full:${g.entryId}`,
          text: W.fullRow(g.what, g.indexes.length),
          kind: 'limit' as const,
          index: null,
        })),
      ];
  const limits = rows.filter((r) => r.kind === 'limit').length;
  const first = sv.counter.first ?? sv.away?.first ?? null;
  const loss = p.losses[0];
  const lead = view.roster[0] ?? null;
  const fixes = sv.counter.count;
  return (
    <>
      <section className="np-welcome" aria-labelledby="np-welcome-h">
        <div className="np-welcome__head">
          <PixelArt name="flows-sunrise" scale={2} decorative />
          <div className="np-welcome__t">
            <span className="a-cap np-t-gold">{W.welcome}</span>
            <h3 id="np-welcome-h" className="a-h1">
              {W.filledWhileAway(limits)}
            </h3>
            {sv.away ? <span className="np-muted np-sm">{sv.away.text}</span> : null}
          </div>
        </div>
        {rows.length > 0 ? <LoginRows rows={rows} p={p} /> : null}
        {sv.login && sv.login.more > 0 ? <p className="np-muted np-sm">+{sv.login.more}</p> : null}
      </section>
      <section
        className={p.framed === false ? 'np-start np-plain' : 'np-start a-frame a-frame--gold'}
        aria-labelledby="np-start-h"
      >
        <span className="a-cap np-t-gold">{W.startWith}</span>
        <div className="np-start__body">
          {first ? (
            <>
              <h3 id="np-start-h" className="np-start__t">
                {first.text}
              </h3>
              <TokenLine
                who={first.who ? { family: first.who.family, label: first.who.label } : null}
                where={first.where}
              />
            </>
          ) : loss ? (
            <>
              <h3 id="np-start-h" className="np-start__t">
                {loss.action ?? loss.label}
              </h3>
              <span className="np-muted np-sm">
                {W.account1} · <span className="np-t-coral">{W.losingNow}</span>
              </span>
            </>
          ) : lead ? (
            <>
              <h3 id="np-start-h" className="np-start__t">
                {lead.summary || who(view, lead.index)}
              </h3>
              <TokenLine
                who={{ family: familyOf(view, lead.index), label: who(view, lead.index) }}
                where={lead.map}
              />
            </>
          ) : (
            <h3 id="np-start-h" className="np-start__t">
              {W.nothingBefore}
            </h3>
          )}
        </div>
        {first || loss || lead ? (
          <button
            type="button"
            className="np-btn"
            onClick={() =>
              first ? p.onFirst() : loss ? p.onDaily() : lead ? p.onOpen(lead.index) : undefined
            }
          >
            {W.showMe}
            <PixelArt name="ui-arrow-right" decorative />
          </button>
        ) : null}
      </section>
      <button type="button" className="np-then" onClick={() => p.onPause('rounds')}>
        <span className="np-then__t">
          <b>{W.thenRound}</b>
          <span className="np-muted np-sm">
            {W.roundLine(
              view.roster.length,
              fixes,
              p.groups.reduce((n, g) => n + g.indexes.length, 0),
            )}
          </span>
        </span>
        <span className="np-then__who" aria-hidden="true">
          {view.roster.map((r) => (
            <Blob key={r.index} family={familyOf(view, r.index)} size={32} />
          ))}
        </span>
        <span className="np-go">
          {W.rounds}
          <PixelArt name="ui-arrow-right" decorative />
        </span>
      </button>
    </>
  );
}

export function RoundsView(p: PauseViewProps) {
  const { view, sv, groups } = p;
  const next = roundNext(view, p.visited);
  const full = fullSet(groups);
  if (!next) return null;
  const total = view.roster.length;
  const fullHere = groups.find((g) => g.indexes.includes(next.index));
  const maps = new Set(view.roster.map((r) => r.map).filter(Boolean));
  const first = p.visited.length === 0 || next.index === view.roster[0]?.index;
  const detail = [
    next.map,
    next.purpose,
    fullHere ? W.thenAlso(fullHere.verb ?? 'collect', fullHere.what) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const jobs = [
    ...groups
      .filter((g) => g.indexes.length >= 2)
      .map((g) => ({
        key: g.entryId,
        text: W.sameJobFull(g.indexes.length, g.verb ?? 'collect', g.what),
        core: null as string | null,
        glyph: systemSprite(g.entryId.split('.')[0]),
        indexes: g.indexes,
      })),
    ...sv.groups.map((g) => ({
      key: g.entryId,
      text: W.sameJob(
        g.stops.reduce((n, s) => n + s.chips.length, 0),
        g.text,
      ),
      core: g.text as string | null,
      glyph: systemSprite(g.entryId.split('.')[0]),
      indexes: g.stops.flatMap((s) => s.chips.map((c) => c.index)),
    })),
  ];
  const mapsOf = (idx: number[]) => [
    ...new Set(idx.map((i) => view.roster.find((r) => r.index === i)?.map).filter((m): m is string => !!m)),
  ];
  const fullCount = groups.reduce((n, g) => n + g.indexes.length, 0);
  // Rule 3: the next three jobs, biggest first; the rest stay on each character's card.
  const shownJobs = [...jobs].sort((a, z) => z.indexes.length - a.indexes.length).slice(0, 3);
  /** M24 QA P2 (say it once): a card whose task is a shown "Same job" points there instead of repeating it. */
  const inJob = (i: number, summary: string | null | undefined) =>
    !!summary &&
    shownJobs.some(
      (j) => j.core && j.indexes.includes(i) && summary.toLowerCase().startsWith(j.core.toLowerCase()),
    );
  return (
    <>
      <section
        className={p.framed === false ? 'np-next np-plain' : 'np-next a-frame a-frame--gold'}
        aria-labelledby="np-next-h"
      >
        <Badged classLabel={classOf(view, next.index)} size={72}>
          <Blob family={familyOf(view, next.index)} size={72} />
        </Badged>
        <div className="np-next__t">
          <span className="a-cap np-t-gold">
            {first ? W.startRound(next.position, total) : W.nextRound(next.position, total)}
          </span>
          <h3 id="np-next-h" className="a-h1">
            {who(view, next.index)}
          </h3>
          {next.summary ? <span className="np-next__task">{next.summary}</span> : null}
          {detail ? <span className="np-muted np-sm">{detail}</span> : null}
        </div>
        <Go href={charHref(next.index)} onGo={() => p.onOpen(next.index)} className="np-btn">
          {W.open(who(view, next.index))}
          <PixelArt name="ui-arrow-right" decorative />
        </Go>
      </section>
      <section className="np-round-sec" aria-labelledby="np-round-h">
        <div className="np-sec-head">
          <h3 id="np-round-h" className="a-h2">
            {W.yourRound}
          </h3>
          <span className="np-muted np-sm">
            {W.roundSummary(total, maps.size, sv.counter.count, fullCount)}
          </span>
        </div>
        <ol className="np-round">
          {view.roster.map((r) => {
            const state = cardState(r, full);
            const chip = rowTabChip(view, r.index);
            return (
              <li key={r.index}>
                <Go
                  href={charHref(r.index)}
                  onGo={() => p.onOpen(r.index)}
                  index={r.index}
                  className={cx(
                    'np-stop',
                    r.index === next.index && 'is-next',
                    p.visited.includes(r.index) && 'is-done',
                  )}
                >
                  <span className="np-stop__pic" aria-hidden="true">
                    <Badged classLabel={classOf(view, r.index)} size={44}>
                      <Blob family={familyOf(view, r.index)} size={44} />
                    </Badged>
                  </span>
                  <span className="np-stop__who">
                    <span className="np-stop__n num">{r.position}</span>
                    <b>{who(view, r.index)}</b>
                  </span>
                  {r.map ? <span className="np-muted np-xs">{r.map}</span> : null}
                  {r.summary ? (
                    inJob(r.index, r.summary) ? (
                      <span className="np-stop__task np-sm np-muted">{W.sameJobBelow}</span>
                    ) : (
                      <span className="np-stop__task np-sm">{r.summary}</span>
                    )
                  ) : null}
                  <span className="np-xs np-stop__chip">
                    <Pip tone={PIP[state]} />
                    {/* M24 QA P2: a pip is never alone; without a tab chip it carries the state word. */}
                    <span className="np-muted">
                      {chip ? `${chip.label}${chip.word ? ` · ${chip.word}` : ''}` : W.verdict[state]}
                    </span>
                  </span>
                </Go>
              </li>
            );
          })}
        </ol>
      </section>
      {shownJobs.map((j) => {
        const m = mapsOf(j.indexes);
        return (
          <section key={j.key} className="np-job" aria-label={j.text}>
            <span className="np-job__ic" aria-hidden="true">
              <Icon name={j.glyph} size={32} />
            </span>
            <span className="np-job__t">
              <b>{j.text}</b>
              <span className="np-muted np-sm">
                {m.length === 1 && m[0] ? W.oneTrip(j.indexes.length, m[0]) : W.trips(m)}
              </span>
            </span>
            <span className="np-job__who">
              {j.indexes.map((i) => (
                <Go key={i} href={charHref(i)} onGo={() => p.onOpen(i)} label={who(view, i)}>
                  <Blob family={familyOf(view, i)} size={32} />
                </Go>
              ))}
            </span>
          </section>
        );
      })}
      {sv.counter.count > 0 || fullCount > 0 ? (
        <button type="button" className="np-leave" onClick={() => p.onPause('logoff')}>
          <Pip tone={sv.counter.count > 0 ? 'coral' : 'gold'} />
          <span>{sv.counter.count > 0 ? W.leavingFix(sv.counter.count) : W.leavingSoon(fullCount)}</span>
          <b className="np-t-gold">
            {W.logOff}
            <PixelArt name="ui-arrow-right" decorative />
          </b>
        </button>
      ) : null}
    </>
  );
}

export function PauseView(p: PauseViewProps & { tab: 'login' | 'rounds' }) {
  return p.tab === 'login' ? <LogInView {...p} /> : <RoundsView {...p} />;
}
