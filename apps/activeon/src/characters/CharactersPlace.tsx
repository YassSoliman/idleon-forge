// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Characters (M17 FR-13, M21 FR-C6, FR-C7; Design Lab `character.overview` "Health matrix" pick, with
// the class tree block and the slot ribbon). In save order, so a row never moves:
// - the health matrix: characters × the tabs that publish health, each cell a glyph plus a word with a
//   unit, a 44 px link to that tab, exactly one cell ringed as the fix;
// - the "Next character" card (owner request 2026-10-18): the next slot's class and when it opens;
// - the class tree block: who plays which line;
// - the Builds overview (each character's lead tab and next steps with running totals), the Cards
//   overview and the Skill Grid, unchanged in substance.
import {
  buildOverviewLine,
  CHARACTERS_WORDS,
  type NowView,
  type RosterRow,
  type TabHealth,
} from '@idleon-forge/engine/now';
import type { ClassFamily, NextCharacterCard } from '@idleon-forge/engine/result';
import type { ArtName } from '../design/art/names';
import { PixelArt } from '../design/art/PixelArt';
import { GLYPH, VERDICT_GLYPH } from '../design/atoms';
import { WhoGlyph } from '../design/who/WhoGlyph';
import { CardsOverview } from '../now/cards/CardsPanel';
import { characterTabs, NOW_TAB, tabHref } from '../now/character-tabs';
import { BUILDS_OPEN } from '../now/open-keys';
import { SkillGrid } from '../now/SkillsTab';
import { SEVERITY } from '../now/tab-health';
import { formatRoute } from '../shell/route';
import type { Session } from '../shell/session';
import './place.css';

const W = CHARACTERS_WORDS;
const n = (x: number) => x.toLocaleString('en-US');

const HEALTH_GLYPH: Record<TabHealth['level'], ArtName> = {
  fix: VERDICT_GLYPH.fix,
  behind: 'v2-character-behind',
  empty: 'v2-character-empty',
  unknown: VERDICT_GLYPH.unknown,
  ok: GLYPH.check,
};

interface Cell {
  tab: string;
  label: string;
  health: TabHealth;
}

function cellsOf(view: NowView, index: number): (Cell | null)[] {
  return characterTabs
    .filter((t) => t.health)
    .map((t) => {
      const h = t.health?.(view, index) ?? null;
      return h ? { tab: t.id, label: t.label, health: h } : null;
    });
}

/** Exactly one ringed cell: the most severe, ties broken by Visit Order, then tab order (FR-C7). */
function ringOf(rows: RosterRow[], cells: Map<number, (Cell | null)[]>): string | null {
  let best: { key: string; sev: number; pos: number; col: number } | null = null;
  for (const r of rows)
    (cells.get(r.index) ?? []).forEach((c, col) => {
      if (!c || c.health.level === 'ok') return;
      const sev = SEVERITY[c.health.level];
      if (
        !best ||
        sev < best.sev ||
        (sev === best.sev && (r.position < best.pos || (r.position === best.pos && col < best.col)))
      )
        best = { key: `${r.index}:${c.tab}`, sev, pos: r.position, col };
    });
  return (best as { key: string } | null)?.key ?? null;
}

function HealthMatrix({ s, rows }: { s: Session; rows: RosterRow[] }) {
  const tabs = characterTabs.filter((t) => t.health);
  const cells = new Map(rows.map((r) => [r.index, cellsOf(s.view, r.index)] as const));
  const shown = tabs.filter((_, col) => rows.some((r) => cells.get(r.index)?.[col]));
  const ring = ringOf(rows, cells);
  const families = s.view.families ?? {};
  const open = (index: number, tab: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    s.navigate({ place: 'character', index, tab }, 'push', { origin: '#characters' });
  };
  return (
    <section className="cp-block" aria-labelledby="cp-matrix-h">
      <h3 id="cp-matrix-h" className="cp-h">
        {W.matrix.heading}
      </h3>
      <div className="cp-matrix-wrap">
        <table className="cp-matrix">
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">{W.title}</span>
              </th>
              {shown.map((t) => (
                <th key={t.id} scope="col">
                  {t.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.index}>
                <th scope="row">
                  <a
                    className="cp-who"
                    href={tabHref(NOW_TAB, r.index)}
                    aria-label={r.accessibleName}
                    onClick={open(r.index, NOW_TAB)}
                  >
                    <WhoGlyph
                      family={(families[r.index] ?? 'beginner') as ClassFamily}
                      classLabel={r.classLabel}
                      scale={1}
                      decorative
                    />
                    <span className="cp-who-t">
                      <span className="cp-name">{r.name}</span>
                      <span className="num">
                        {r.classLabel} {r.level}
                      </span>
                    </span>
                  </a>
                </th>
                {shown.map((t) => {
                  const c = cells.get(r.index)?.[tabs.indexOf(t)] ?? null;
                  if (!c) return <td key={t.id} />;
                  const ringed = ring === `${r.index}:${c.tab}`;
                  return (
                    <td key={t.id}>
                      <a
                        className="cp-cell"
                        data-level={c.health.level}
                        data-ring={ringed ? 'yes' : 'no'}
                        href={tabHref(c.tab, r.index)}
                        onClick={open(r.index, c.tab)}
                        aria-label={`${r.name}, ${c.label}: ${W.matrix.level[c.health.level]}, ${c.health.word}`}
                      >
                        <PixelArt name={HEALTH_GLYPH[c.health.level]} decorative />
                        <span>{c.health.word}</span>
                        {ringed ? <span className="cp-ring-tag">{W.matrix.fixFirst}</span> : null}
                      </a>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="cp-hint">{W.matrix.hint}</p>
    </section>
  );
}

const etaWords = (n0: NextCharacterCard): string | null => {
  if (!n0.eta) return null;
  if (n0.eta.kind === 'days')
    return `about ${n(n0.eta.days)} ${n0.eta.days === 1 ? 'day' : 'days'} at your pace`;
  if (n0.eta.kind === 'too-long') return 'more than 90 days at your pace';
  return null;
};

/** FR-19 (M2) + M15 F3: the next character slot as a ghost slot at the end of the roster. */
function NextCharacter({ card, s }: { card: NextCharacterCard; s: Session }) {
  const family: ClassFamily =
    card.line === 'Journeyman'
      ? 'journeyman'
      : card.baseClass === 'Warrior'
        ? 'warrior'
        : card.baseClass === 'Archer'
          ? 'archer'
          : card.baseClass === 'Mage'
            ? 'mage'
            : 'beginner';
  const title =
    card.line === card.baseClass
      ? `Slot ${card.slotNumber}: ${card.line}`
      : `Slot ${card.slotNumber}: ${card.baseClass} → ${card.line}`;
  const eta = etaWords(card);
  return (
    <section className="cp-next" aria-labelledby="cp-next-h" data-open={card.slotOpen ? 'yes' : 'no'}>
      <span className="cp-next-glyph">
        <WhoGlyph family={family} classLabel={card.line} scale={3} decorative />
      </span>
      <div className="cp-next-body">
        <h3 id="cp-next-h" className="cp-next-h">
          Next character · {title}
        </h3>
        {card.slotOpen ? (
          <p className="cp-next-when">
            The slot is open now.{' '}
            <a
              href={formatRoute({ place: 'now' })}
              className="cp-link"
              onClick={(e) => {
                e.preventDefault();
                s.navigate({ place: 'now' }, 'push', { origin: '#characters' });
              }}
            >
              See it on Now
            </a>
          </p>
        ) : card.opensAt !== null ? (
          <p className="cp-next-when">
            Opens at family level <b className="num">{n(card.opensAt)}</b>
            {card.gap !== null ? ` (${n(card.gap)} levels to go${eta ? `, ${eta}` : ''})` : ''}
          </p>
        ) : null}
        <p className="cp-next-why">{card.why}</p>
        {card.steps.length ? (
          <ol className="cp-next-steps">
            {card.steps.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}

const FAMILY_WORDS: Record<ClassFamily, string> = {
  warrior: 'Warrior',
  archer: 'Archer',
  mage: 'Mage',
  beginner: 'Beginner',
  journeyman: 'Journeyman',
};

/** The class tree block (`character.overview` runner-up): who plays which line, by family. */
function ClassTree({ s, rows }: { s: Session; rows: RosterRow[] }) {
  const families = s.view.families ?? {};
  const order: ClassFamily[] = ['warrior', 'archer', 'mage', 'beginner', 'journeyman'];
  const groups = order
    .map((f) => ({ f, list: rows.filter((r) => (families[r.index] ?? 'beginner') === f) }))
    .filter((g) => g.list.length > 0 || g.f === 'warrior' || g.f === 'archer' || g.f === 'mage');
  return (
    <section className="cp-block" aria-labelledby="cp-tree-h">
      <h3 id="cp-tree-h" className="cp-h">
        {W.classTree.heading}
      </h3>
      <ul className="cp-tree">
        {groups.map((g) => (
          <li key={g.f} className="cp-tree-col">
            <span className="cp-tree-h">
              <WhoGlyph family={g.f} classLabel={FAMILY_WORDS[g.f]} scale={1} decorative />
              {FAMILY_WORDS[g.f]}
            </span>
            {g.list.length ? (
              <ul className="cp-tree-list">
                {g.list.map((r) => (
                  <li key={r.index} className="num">
                    {r.classLabel} {r.level}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="cp-muted">{W.classTree.noOne}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The Builds overview's folded line: "3 with unspent points". */
export function buildsSummary(builds: NowView['builds']): string {
  const k = builds.filter((b) => b.presets.some((p) => (p.unspent ?? 0) > 0)).length;
  return k > 0 ? `${k} with unspent points` : 'no unspent points';
}

/** FR-C6: each character's lead tab, its known points and its next steps with running totals. */
function BuildsOverview({ s, rows }: { s: Session; rows: RosterRow[] }) {
  const builds = s.view.builds;
  if (builds.length === 0) return null;
  const first = builds[0]?.note ?? null;
  const shared = first !== null && builds.every((b) => b.note === first) ? first : null;
  const open = s.actions.expanded.has(BUILDS_OPEN);
  return (
    <section aria-labelledby="builds-h" id="builds" className="cp-block builds-overview">
      <details
        className="cp-fold"
        open={open}
        onToggle={(e) => {
          const now = (e.currentTarget as HTMLDetailsElement).open;
          if (now !== s.actions.expanded.has(BUILDS_OPEN)) s.actions.toggle(BUILDS_OPEN);
        }}
      >
        <summary className="cp-fold-sum">
          <h3 id="builds-h" className="cp-h">
            Builds
          </h3>
          <span className="cp-muted">{shared ? 'not covered past World 4' : buildsSummary(builds)}</span>
        </summary>
        {shared ? (
          <p className="cp-muted">
            {shared.split(';')[0]}. Each character's Build tab shows its plain talent levels.
          </p>
        ) : (
          <ul className="cp-bo-list">
            {rows.map((row) => {
              const b = builds.find((x) => x.index === row.index);
              if (!b) return null;
              return (
                <li key={b.index}>
                  <a
                    href={b.href}
                    className="cp-bo-row"
                    onClick={(e) => {
                      e.preventDefault();
                      s.actions.openTab(b.index, 'build');
                    }}
                  >
                    <span className="cp-name">{b.name}</span>
                    <span className="num cp-muted">
                      {b.classLabel} {b.level}
                    </span>
                    <span className="cp-bo-line">{buildOverviewLine(b)}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </details>
    </section>
  );
}

export function CharactersPlace({ s }: { s: Session }) {
  // Save order: the Roster's rows (Visit Order) re-sorted by CharacterState.index.
  const rows = [...s.view.roster].sort((a, b) => a.index - b.index);
  const next = s.result?.nextCharacter ?? null;
  return (
    <section className="characters-place" aria-labelledby="characters-h">
      <div className="cp-head">
        <h2 id="characters-h" className="section-h place-h" data-place-heading tabIndex={-1}>
          {W.title}
        </h2>
        <span className="cp-muted num">
          {rows.length} {rows.length === 1 ? 'character' : 'characters'}
          {next && next.opensAt !== null && next.gap !== null
            ? ` · family level ${n(next.opensAt - next.gap)} · slot ${next.slotNumber} at ${n(next.opensAt)}`
            : ''}
        </span>
      </div>
      <HealthMatrix s={s} rows={rows} />
      {next ? <NextCharacter card={next} s={s} /> : null}
      <ClassTree s={s} rows={rows} />
      <BuildsOverview s={s} rows={rows} />
      <CardsOverview view={s.view} />
      <SkillGrid grid={s.view.skillGrid} />
    </section>
  );
}
