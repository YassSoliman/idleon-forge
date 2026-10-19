// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Characters (M17 FR-13, M21 FR-C6, FR-C7; M24 board `after/Characters`). Top to bottom:
// - the roster grid, sorted by Visit Order (fix first, then most to spend): who with the same state word
//   as Now's cards (the pip always agrees with the word), the AFK target and map, then one square per tab
//   that publishes health (talent points, gear slots, card preset, star sign, parallel slots), each a
//   link to that tab, a big word and a small one, coloured gold (do it), mint (fine) or grey (later);
// - the next character (the one framed block of the screen) beside the class tree;
// - the Skills heat map: brighter is a higher level, gold is the skill the character should train.
// Characters are labelled by class + level; the who column adds the in-game name under it, small and
// quiet (M25), so two characters of one class can be told apart. Every fact is the engine's.
import type { RosterRow, TabHealth } from '@idleon-forge/engine/now';
import type { ClassFamily, NextCharacterCard } from '@idleon-forge/engine/result';
import { classArtOf } from '../art/game/class-art';
import { GameIcon } from '../art/game/GameIcon';
import { Blob } from '../design/atoms/Blob';
import { cx } from '../design/atoms/Button';
import { Pip } from '../design/atoms/Surfaces';
import { characterTabs, NOW_TAB, tabHref } from '../now/character-tabs';
import { type CardState, cardState, fullGroups, fullSet } from '../now/place/derive';
import { Icon } from '../now/place/icon';
import { StateWord } from '../now/place/LogOff';
import { CHARACTERS_PLACE_WORDS as W } from '../now/place/words';
import { TAB_HEALTH } from '../now/tab-health';
import type { Session } from '../shell/session';
import { ClassBadge } from './ClassBadge';
import { shownName } from './name';
import './place.css';

const who = (r: RosterRow) => `${r.classLabel} ${r.level}`;

/** A health level's colour: gold do it, mint fine, grey later (rule 7). */
const TONE: Record<TabHealth['level'], 'warn' | 'ok' | 'muted'> = {
  fix: 'warn',
  behind: 'warn',
  empty: 'muted',
  ok: 'ok',
  unknown: 'muted',
};

const PIP_OF = { warn: 'gold', ok: 'mint', muted: undefined } as const;

/** The tabs that publish health, in tab order, with the anchor a section route lands on. */
const COLS = characterTabs.filter((t) => TAB_HEALTH[t.id]);
const ANCHOR: Record<string, string> = { build: 'builds', cards: 'cards' };

/** A health word as the square's big and small words ("empty preset · 995 points" → 995 points / empty preset). */
function words(tab: string, h: TabHealth): { big: string; small: string } {
  const parts = h.word.split(' · ');
  if (parts.length > 1)
    return { big: parts[parts.length - 1] ?? h.word, small: parts.slice(0, -1).join(' · ') };
  const big = h.level === 'ok' && h.word === 'ok' ? 'Fine' : h.word;
  const small = W.small[tab]?.[h.level] ?? '';
  return {
    big: big.charAt(0).toUpperCase() + big.slice(1),
    small: small.toLowerCase() === big.toLowerCase() ? '' : small,
  };
}

function Grid({ s, rows }: { s: Session; rows: RosterRow[] }) {
  const families = s.view.families ?? {};
  const groups = fullGroups(s.timeline, s.view);
  const full = fullSet(groups);
  const open = (index: number, tab: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    s.navigate({ place: 'character', index, tab }, 'push', { origin: '#characters' });
  };
  const shown = COLS.filter((t) => rows.some((r) => TAB_HEALTH[t.id]?.(s.view, r.index)));
  const why = (r: RosterRow, state: CardState) => {
    if (state === 'collect') {
      const g = groups.find((x) => x.indexes.includes(r.index));
      return g ? W.fullWhat(g.what) : '';
    }
    // "Fix first" already says it; Ready and Can't tell say why in a word.
    return state === 'fix' ? '' : (W.stateWhy[state as 'ready' | 'unknown'] ?? '');
  };
  const activities = rows.map((r) => r.activity?.split(' ')[0] ?? null);
  const sameAfk =
    activities.length > 0 && activities.every((a) => a && a === activities[0]) ? activities[0] : null;
  return (
    <div className="cp-grid-wrap">
      <table className="cp-grid">
        <thead>
          <tr>
            <th scope="col">{W.cols.who}</th>
            <th scope="col">{W.cols.afk}</th>
            {shown.map((t) => (
              <th key={t.id} scope="col" id={ANCHOR[t.id]}>
                {W.cols[t.id] ?? t.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const state = cardState(r, full);
            const name = shownName(s.result?.characters.find((c) => c.index === r.index));
            return (
              <tr key={r.index}>
                <th scope="row">
                  <a
                    className="cp-who"
                    href={tabHref(NOW_TAB, r.index)}
                    aria-label={`${r.position}. ${who(r)}${name ? `, ${name}` : ''}, ${state}`}
                    onClick={open(r.index, NOW_TAB)}
                  >
                    <span className="cp-n num">{r.position}</span>
                    <ClassBadge classLabel={r.classLabel} size={40}>
                      <Blob family={(families[r.index] ?? 'beginner') as ClassFamily} size={40} />
                    </ClassBadge>
                    <span className="cp-who-t">
                      <span className="cp-who-l">
                        <b className="num">{who(r)}</b>
                        {name ? (
                          <span className="cp-who-name" title={name}>
                            {name}
                          </span>
                        ) : null}
                      </span>
                      <span className="cp-xs">
                        <StateWord state={state} />
                        {/* M24 QA P2: the state word and its reason read as two parts, not one run. */}
                        {why(r, state) ? <span className="cp-muted"> · {why(r, state)}</span> : null}
                      </span>
                    </span>
                  </a>
                </th>
                <td>
                  <a
                    className="cp-cell cp-cell--afk"
                    href={tabHref(NOW_TAB, r.index)}
                    onClick={open(r.index, NOW_TAB)}
                  >
                    <span className="cp-col">{W.cols.afk}</span>
                    <b className="cp-sm">{r.activity ?? W.noAfk}</b>
                    {r.map ? <span className="cp-xs cp-muted">{r.map}</span> : null}
                  </a>
                </td>
                {shown.map((t) => {
                  const h = TAB_HEALTH[t.id]?.(s.view, r.index) ?? null;
                  if (!h) return <td key={t.id} />;
                  const w = words(t.id, h);
                  const tone = TONE[h.level];
                  const loud = t.id === 'build' && (h.level === 'behind' || h.level === 'empty');
                  return (
                    <td key={t.id}>
                      <a
                        className="cp-cell"
                        data-tone={tone}
                        href={tabHref(t.id, r.index)}
                        onClick={open(r.index, t.id)}
                        aria-label={`${who(r)}, ${t.label}: ${h.word}`}
                      >
                        <span className="cp-col">{W.cols[t.id] ?? t.label}</span>
                        <Pip tone={PIP_OF[tone]} />
                        <span className="cp-cell-t">
                          <b className={cx(loud ? 'cp-loud' : 'cp-sm')}>{w.big}</b>
                          {w.small ? <span className="cp-xs cp-muted">{w.small}</span> : null}
                        </span>
                      </a>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="cp-hint cp-xs cp-muted">
        {W.hint}
        {sameAfk ? W.allAfk(rows.length, sameAfk) : ''}
      </p>
    </div>
  );
}

const FAMILY_WORDS: Record<ClassFamily, string> = {
  warrior: 'Warrior',
  archer: 'Archer',
  mage: 'Mage',
  beginner: 'Beginner',
  journeyman: 'Journeyman',
};

/** Our own class sprite ("class-beast-master"), drawn when the game's class icon is missing. */
const fallbackClass = (line: string) => `class-${line.toLowerCase().replace(/\s+/g, '-')}`;

/** The next character slot: what to make, the family-level meter, and the creation steps. */
function NextCharacter({ card }: { card: NextCharacterCard }) {
  const at = card.opensAt !== null && card.gap !== null ? card.opensAt - card.gap : null;
  const share = at !== null && card.opensAt ? Math.min(1, at / card.opensAt) : card.slotOpen ? 1 : 0;
  const title = card.line === card.baseClass ? card.line : `${card.baseClass} → ${card.line}`;
  return (
    <section className="cp-next a-frame" aria-labelledby="cp-next-h">
      <span className="a-cap">{W.nextCap(card.slotNumber)}</span>
      <div className="cp-next-top">
        <span className="cp-next-pic">
          <GameIcon
            art={classArtOf(card.line) ?? classArtOf(card.baseClass)}
            fallback={
              <Icon name={fallbackClass(card.line)} fallback={fallbackClass(card.baseClass)} size={48} />
            }
            size={48}
            decorative
            wiki={classArtOf(card.line) ? card.line : card.baseClass}
          />
        </span>
        <div className="cp-next-t">
          <h3 id="cp-next-h" className="a-h2">
            {title}
          </h3>
          <span className="cp-sm cp-muted">{card.why}</span>
        </div>
      </div>
      {card.slotOpen ? (
        <p className="cp-sm cp-t-ok">{W.slotOpen}</p>
      ) : at !== null && card.opensAt !== null ? (
        <div className="cp-meter-box">
          <div className="cp-meter-row cp-sm">
            <span className="cp-muted">{W.familyOf(at, card.opensAt)}</span>
            {card.gap !== null ? <b>{W.toGo(card.gap)}</b> : null}
          </div>
          <span className="cp-meter" aria-hidden="true">
            <i style={{ width: `${Math.round(share * 100)}%` }} />
          </span>
        </div>
      ) : null}
      {card.steps.length ? (
        <ol className="cp-steps cp-sm">
          {card.steps.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

/** The class tree: who plays which line, by family, and the next slot as a ghost tile. */
function ClassTree({ s, rows, next }: { s: Session; rows: RosterRow[]; next: NextCharacterCard | null }) {
  const families = s.view.families ?? {};
  const order: ClassFamily[] = ['warrior', 'archer', 'mage', 'beginner', 'journeyman'];
  const groups = order
    .map((f) => ({ f, list: rows.filter((r) => (families[r.index] ?? 'beginner') === f) }))
    .filter((g) => g.list.length > 0 || g.f === 'warrior' || g.f === 'archer' || g.f === 'mage');
  const ghost = next && !groups.some((g) => FAMILY_WORDS[g.f] === next.baseClass && g.list.length === 0);
  return (
    <section className="cp-tree-sec" aria-labelledby="cp-tree-h">
      <h3 id="cp-tree-h" className="a-h2">
        {W.tree}
      </h3>
      <ul className="cp-tree">
        {groups.map((g) => (
          <li key={g.f} className="cp-tree-col" data-family={g.f}>
            <span className="a-cap cp-fam">{FAMILY_WORDS[g.f]}</span>
            {g.list.length ? (
              g.list.map((r) => (
                <span key={r.index} className="cp-sm num">
                  {who(r)}
                </span>
              ))
            ) : (
              <span className="cp-sm cp-muted">{W.noOne}</span>
            )}
          </li>
        ))}
        {next && ghost ? (
          <li className="cp-tree-col cp-tree-ghost">
            <span className="a-cap">{next.line}</span>
            <span className="cp-sm cp-muted">{W.ghost(next.slotNumber, next.opensAt)}</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

/** The Skills heat map: one row per character, one square per skill; gold is the skill to train. */
function Skills({ s, rows }: { s: Session; rows: RosterRow[] }) {
  const grid = s.view.skillGrid;
  if (!grid) return null;
  const noOne = grid.skills.filter((k) => !grid.rows.some((r) => r.cells[k].specialty));
  const byIndex = new Map(grid.rows.map((r) => [r.index, r] as const));
  const shade = (v: number | null) => (v === null ? 0 : v >= 20 ? 3 : v >= 10 ? 2 : v >= 5 ? 1 : 0);
  return (
    <section id="skills" className="cp-skills" aria-labelledby="cp-skills-h" tabIndex={-1}>
      <div className="cp-sec-head">
        <h3 id="cp-skills-h" className="a-h2">
          {W.skills}
        </h3>
        {noOne.length ? (
          <span className="cp-sm cp-muted">{W.noOneBuilt(noOne.map((k) => grid.names[k]).join(', '))}</span>
        ) : null}
      </div>
      <div className="cp-heat-wrap">
        <table className="cp-heat">
          <thead>
            <tr>
              <td />
              {grid.skills.map((k) => (
                <th key={k} scope="col">
                  {grid.names[k]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const g = byIndex.get(r.index);
              if (!g) return null;
              return (
                <tr key={r.index}>
                  <th scope="row">
                    <a
                      href={tabHref('skills', r.index)}
                      onClick={(e) => {
                        e.preventDefault();
                        s.actions.openTab(r.index, 'skills');
                      }}
                    >
                      {who(r)}
                    </a>
                  </th>
                  {grid.skills.map((k) => {
                    const c = g.cells[k];
                    const title = `${who(r)} · ${grid.names[k]} ${c.level ?? '?'}${c.role ? ' · Role' : ''}${c.best ? ' · best' : ''}`;
                    return (
                      <td
                        key={k}
                        className="num"
                        data-shade={shade(c.level)}
                        data-role={c.role ? 'yes' : undefined}
                        data-low={c.level !== null && c.level <= 1 && !c.role ? 'yes' : undefined}
                        title={title}
                      >
                        <span className="sr-only">{title}</span>
                        <span aria-hidden="true">{c.level ?? '?'}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="cp-key cp-xs cp-muted">
        <span>
          <span className="cp-sw" data-shade="0" aria-hidden="true" />
          <span className="cp-sw" data-shade="3" aria-hidden="true" />
          {W.shade}
        </span>
        <span>
          <span className="cp-sw" data-role="yes" aria-hidden="true" />
          {W.roleKey}
        </span>
      </p>
    </section>
  );
}

export function CharactersPlace({ s }: { s: Session }) {
  // Visit Order: the Roster's own order (fix first, then most to spend).
  const rows = [...s.view.roster].sort((a, b) => a.position - b.position);
  const next = s.result?.nextCharacter ?? null;
  const family = next && next.opensAt !== null && next.gap !== null ? next.opensAt - next.gap : null;
  return (
    <section className="characters-place" aria-labelledby="characters-h">
      <div className="cp-head">
        <div className="cp-head-t">
          <h2 id="characters-h" className="a-h1 cp-title" data-place-heading tabIndex={-1}>
            {W.title}
          </h2>
          <span className="cp-sm cp-muted num">{W.sub(rows.length, family)}</span>
        </div>
        <span className="cp-legend cp-xs cp-muted" aria-hidden="true">
          {(['warn', 'ok', 'muted'] as const).map((t) => (
            <span key={t}>
              <Pip tone={PIP_OF[t]} />
              {W.legend[t === 'warn' ? 'gold' : t === 'ok' ? 'mint' : 'mut']}
            </span>
          ))}
        </span>
      </div>
      <Grid s={s} rows={rows} />
      <div className={next ? 'cp-pair' : 'cp-pair cp-pair--one'}>
        {next ? <NextCharacter card={next} /> : null}
        <ClassTree s={s} rows={rows} next={next} />
      </div>
      <Skills s={s} rows={rows} />
    </section>
  );
}
