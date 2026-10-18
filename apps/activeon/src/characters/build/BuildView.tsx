// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Build tab (M21 area C, Design Lab `character.build.*` picks; owner request "show the entire
// build"). Everything is worded and ordered by the engine (`view.builds`); this only lays it out:
// - the class path as stepping stones and the level-gate ruler (FR-C5);
// - the wrong-preset banner on top (the side-by-side runner-up's banner, FR-C3);
// - per preset: one step, then the rest (FR-C4), the game-tab grid with the star tile (FR-C3, FR-C13),
//   and the selected tab's whole Build path (FR-C1): done / can add now / part now / next after these /
//   later, each as colour plus glyph plus word, with the running total and the band marker;
// - the attack bar as a slot row with ghosts, and what's coming up as a milestone ladder.
// Phone first: the presets are a segmented choice under 1000 px; from 1000 px both presets sit side by
// side and every tab's path shows in columns (Command Board layout, D-3).
import {
  type BuildRoadmapView,
  buildPartLine,
  CHARACTERS_WORDS,
  cumulativeLine,
  leadTab,
  pathMarker,
  tabBadge,
} from '@idleon-forge/engine/now';
import type { BuildPathStepView, BuildPresetView, BuildTabView } from '@idleon-forge/engine/result';
import { useState } from 'react';
import { PixelArt } from '../../design/art/PixelArt';
import { cx, GLYPH, Meter, SegmentedControl, STATUS_GLYPH } from '../../design/atoms';
import { SourceLabel } from '../../design/atoms/SourceLabel';
import type { CharacterTabProps } from '../../now/character-tabs';
import { useNowActions } from '../../now/context';
import './build.css';

const W = CHARACTERS_WORDS;
const PATH = W.buildPath;
const n = (x: number) => x.toLocaleString('en-US');

// ---------- the class path and the level-gate ruler ----------

function ClassPath({ r }: { r: BuildRoadmapView }) {
  if (r.path.length === 0) return null;
  const words = { done: 'done', now: 'you are here', next: 'next', later: 'later' } as const;
  return (
    <section aria-labelledby={`bv-${r.index}-cp`} className="bv-block">
      <h3 id={`bv-${r.index}-cp`} className="bv-h">
        {W.classPath}
      </h3>
      <ol className="bv-stones">
        {r.path.map((p) => (
          <li key={`${p.label}-${p.state}`} className="bv-stone" data-state={p.state}>
            {p.state === 'done' ? <PixelArt name={GLYPH.check} decorative /> : null}
            <b>{p.label}</b>
            <span className="bv-stone-t">{words[p.state]}</span>
          </li>
        ))}
      </ol>
      {r.nextClass ? <p className="bv-stone-opens">{r.nextClass}</p> : null}
    </section>
  );
}

/** The level-gate ruler (FR-C5, Build tab only): the class pick at Lv 10 and the second preset at 15. */
function GateRuler({ r }: { r: BuildRoadmapView }) {
  const gates = [
    { at: 10, word: 'class pick' },
    { at: 15, word: 'second preset' },
  ].filter((g) => r.level < g.at);
  if (gates.length === 0) return null;
  return (
    <p className="bv-ruler">
      <span className="num">Lv {r.level}</span>
      {gates.map((g) => (
        <span key={g.at} className="bv-ruler-gate">
          <PixelArt name={GLYPH.arrowRight} decorative />
          <span>
            <span className="num">Lv {g.at}</span> {g.word} ({n(g.at - r.level)} levels to go)
          </span>
        </span>
      ))}
    </p>
  );
}

// ---------- the Build path ----------

const BAND_GLYPH: Record<BuildPathStepView['band'], React.ReactNode> = {
  done: <PixelArt name={GLYPH.check} decorative />,
  now: <span className="bv-plus">+</span>,
  part: <span className="bv-plus">+</span>,
  next: <PixelArt name={GLYPH.arrowRight} decorative />,
  later: <PixelArt name={STATUS_GLYPH.locked} decorative />,
};

function PathStep({ s }: { s: BuildPathStepView }) {
  const band = PATH.band[s.band];
  const total = s.cumulative !== null ? cumulativeLine(s.cumulative, s.label) : null;
  // A tie (FR-C11) is one row; its members' levels are in the note ("split evenly: …").
  const tie = s.note?.startsWith('split evenly') === true;
  const levels =
    s.band === 'done'
      ? `${n(s.goal)}`
      : tie || (s.band === 'later' && s.goal <= 0)
        ? null
        : `${n(s.current)} → ${n(s.goal)}`;
  const extra = s.condition ?? s.note;
  return (
    <li className="bv-ps" data-band={s.band}>
      <span className="bv-ps-glyph" aria-hidden="true">
        {BAND_GLYPH[s.band]}
      </span>
      <span className="bv-ps-main">
        <span className="bv-ps-top">
          <span className="bv-ps-name">{s.label}</span>
          {levels ? <span className="bv-ps-lv num">{levels}</span> : null}
        </span>
        {!tie && s.band !== 'done' && s.band !== 'later' && s.goal > 0 ? (
          <Meter
            value={s.current}
            max={s.goal}
            label={`${s.label}: ${n(s.current)} of ${n(s.goal)}`}
            tone={s.band === 'next' ? 'muted' : 'ok'}
            dashed={s.band === 'next'}
          />
        ) : null}
        <span className="bv-ps-foot">
          <span className="bv-ps-band">{band}</span>
          {s.band === 'part' && s.partNow !== null ? (
            <span className="num">{buildPartLine(s.partNow, s.need)}</span>
          ) : null}
          {total ? <span className="bv-ps-total num">{total}</span> : null}
        </span>
        {extra ? <span className="bv-ps-note">{extra}</span> : null}
      </span>
    </li>
  );
}

/** Groups the star tab's steps under page headings (one pool of points, FR-C13). */
function pages(path: readonly BuildPathStepView[]): { page: number | null; steps: BuildPathStepView[] }[] {
  const out: { page: number | null; steps: BuildPathStepView[] }[] = [];
  for (const s of path) {
    const last = out[out.length - 1];
    if (last && last.page === s.page) last.steps.push(s);
    else out.push({ page: s.page, steps: [s] });
  }
  return out;
}

/**
 * Every Build step of one tab, in spend order (FR-C1). The marker sits where the known points end; with
 * none known it leads. "Next after these" rows keep full-contrast text (never faded).
 */
export function BuildPath({ tab, id }: { tab: BuildTabView; id: string }) {
  const path = tab.path ?? [];
  const known = tab.known?.points ?? 0;
  const cut =
    known > 0 ? path.reduce((m, s, i) => (s.band === 'now' || s.band === 'part' ? i : m), -1) + 1 : 0;
  const marker = pathMarker(tab);
  const list = (steps: BuildPathStepView[], start: number) =>
    steps.length ? (
      <ol className="bv-ps-list" start={start}>
        {steps.map((s) => (
          <PathStep key={s.key} s={s} />
        ))}
      </ol>
    ) : null;
  const grouped = (steps: BuildPathStepView[], start: number) => {
    if (tab.tab !== 0) return list(steps, start);
    let i = start;
    return pages(steps).map((g) => {
      const at = i;
      i += g.steps.length;
      return (
        <div key={`${g.page}-${at}`} className="bv-page">
          {g.page !== null ? (
            <h6 className="bv-page-h">
              {PATH.page} {g.page}
            </h6>
          ) : null}
          {list(g.steps, at)}
        </div>
      );
    });
  };
  return (
    <section className="bv-path" aria-labelledby={`${id}-h`}>
      <h5 id={`${id}-h`} className="bv-path-h">
        {tab.name}
        <span className="bv-muted num"> · {n(tab.spent)} spent</span>
      </h5>
      {path.length === 0 ? <p className="bv-muted">{PATH.noPoints}</p> : null}
      {grouped(path.slice(0, cut), 1)}
      {path.length > 0 ? (
        <p className="bv-marker" data-known={known > 0 ? 'yes' : 'no'}>
          <span>
            {marker}
            {tab.known?.kind === 'exact' ? (
              // ADR 0010: an exact count is still as of the last save; an unverified one says where it
              // comes from.
              <span className="bv-asof">
                {PATH.asOf}
                {tab.tab !== 0 && tab.known.verified === false ? ` · ${PATH.fromTotals}` : ''}
              </span>
            ) : null}
          </span>
        </p>
      ) : null}
      {grouped(path.slice(cut), cut + 1)}
      {tab.others.length > 0 ? (
        <p className="bv-muted bv-others">
          {PATH.alsoHas}: {tab.others.map((o) => `${o.label} ${n(o.level)}`).join(', ')}
        </p>
      ) : null}
    </section>
  );
}

// ---------- the tab grid ----------

/** Spent against the Build's targets, over the path's steps that take or took points. */
function fillOf(t: BuildTabView): { value: number; max: number } {
  let value = 0;
  let max = 0;
  for (const s of t.path ?? []) {
    if (s.band === 'later' || s.goal <= 0) continue;
    max += s.goal;
    value += Math.min(s.current, s.goal);
  }
  return { value, max };
}

function TabTile({
  t,
  on,
  start,
  onPick,
  controls,
}: {
  t: BuildTabView;
  on: boolean;
  start: boolean;
  onPick(): void;
  controls: string;
}) {
  const badge = tabBadge(t);
  const { value, max } = fillOf(t);
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <li className="bv-tile" data-on={on ? 'yes' : 'no'} data-star={t.tab === 0 ? 'yes' : 'no'}>
      <button
        type="button"
        className="bv-tile-btn"
        aria-pressed={on}
        aria-controls={controls}
        onClick={onPick}
      >
        <span className="bv-tile-top">
          {t.tab === 0 ? <PixelArt name="v2-character-star" decorative /> : null}
          <span className="bv-tile-name">{t.name}</span>
        </span>
        {max > 0 ? (
          <Meter value={value} max={max} label={`${t.name}: ${pct}% of the Build's targets`} tone="ok" />
        ) : null}
        <span className="bv-tile-foot">
          {badge ? (
            <span className="bv-badge num">{badge}</span>
          ) : (
            <span className="bv-muted num">
              {n(t.spent)} {W.grid.spent}
            </span>
          )}
          {start ? <span className="bv-nowtag">{W.grid.startHere}</span> : null}
        </span>
      </button>
    </li>
  );
}

function NextPoints({ p }: { p: BuildPresetView }) {
  const [first, ...rest] = p.next;
  if (!first) return null;
  return (
    <div className="bv-next">
      <p className="bv-hero-step">
        {first.text}
        <span className="bv-nowtag">Next</span>
      </p>
      {rest.slice(0, 2).map((x) => (
        <p key={x.key} className="bv-next-line">
          {x.text}
        </p>
      ))}
    </div>
  );
}

function AttackBar({ bar }: { bar: NonNullable<BuildPresetView['attackBar']> }) {
  return (
    <section className="bv-atk" aria-label={W.attackBar.heading}>
      <h6 className="bv-path-h">{W.attackBar.heading}</h6>
      <ol className="bv-atk-row">
        {bar.set.map((a) => (
          <li key={`s-${a}`} className="bv-atk-slot">
            {a}
          </li>
        ))}
        {bar.missing.map((a) => (
          <li key={`m-${a}`} className="bv-atk-slot" data-ghost="yes">
            <span className="sr-only">{W.attackBar.empty}, </span>
            <span className="bv-muted">{W.attackBar.wants}</span> {a}
          </li>
        ))}
      </ol>
      <p className="bv-atk-line">{bar.text}</p>
    </section>
  );
}

function PresetPanel({
  p,
  index,
  lead,
  wide,
}: {
  p: BuildPresetView;
  index: number;
  lead: number | null;
  wide: boolean;
}) {
  const tabs = [...p.tabs, ...(p.star ? [p.star] : [])];
  const firstWithPath = tabs.find((t) => (t.path?.length ?? 0) > 0)?.tab ?? tabs[0]?.tab ?? 1;
  const [sel, setSel] = useState<number>(lead ?? firstWithPath);
  const key = `bv-${index}-p${p.slot}`;
  const shown = wide
    ? tabs.filter((t) => (t.path?.length ?? 0) > 0 || t.tab === 0)
    : tabs.filter((t) => t.tab === sel);
  return (
    <section className="bv-preset" aria-labelledby={`${key}-h`}>
      <h4 id={`${key}-h`} className="bv-preset-h">
        {p.heading}
        {p.active ? <span className="bv-inuse">{W.grid.inUse}</span> : null}
      </h4>
      <p className="bv-muted">{p.roleText}</p>
      <NextPoints p={p} />
      <ul className="bv-tiles" aria-label={W.grid.label}>
        {tabs.map((t) => (
          <TabTile
            key={t.tab}
            t={t}
            on={!wide && t.tab === sel}
            start={t.tab === lead}
            onPick={() => setSel(t.tab)}
            controls={`${key}-t${t.tab}`}
          />
        ))}
      </ul>
      <div className={cx('bv-paths', wide && 'bv-paths--cols')}>
        {shown.map((t) => (
          <div key={t.tab} id={`${key}-t${t.tab}`}>
            <BuildPath tab={t} id={`${key}-t${t.tab}`} />
          </div>
        ))}
      </div>
      {p.attackBar ? <AttackBar bar={p.attackBar} /> : null}
    </section>
  );
}

function ComingUp({ r }: { r: BuildRoadmapView }) {
  if (r.comingUp.length === 0) return null;
  return (
    <section aria-labelledby={`bv-${r.index}-cu`} className="bv-block">
      <h3 id={`bv-${r.index}-cu`} className="bv-h">
        {W.comingUp.heading}
      </h3>
      <ol className="bv-ladder" reversed>
        {[...r.comingUp].reverse().map((c) => (
          <li key={c} className="bv-rung">
            {c}
          </li>
        ))}
        <li className="bv-rung" data-here="yes">
          <span className="num">
            {r.classLabel} · Lv {r.level}
          </span>{' '}
          · {W.comingUp.here}
        </li>
      </ol>
    </section>
  );
}

const WIDE = '(min-width: 1000px)';
const isWide = () => typeof window !== 'undefined' && !!window.matchMedia?.(WIDE).matches;

/** One character's whole Build. */
export function BuildRoadmap({ r, mismatch = null }: { r: BuildRoadmapView; mismatch?: string | null }) {
  const lead = leadTab(r.presets);
  const firstSel = lead?.preset.slot ?? r.presets.find((p) => p.active)?.slot ?? r.presets[0]?.slot ?? 0;
  const [sel, setSel] = useState<string>(String(firstSel));
  const [wide] = useState(isWide);
  const shown = wide || r.presets.length < 2 ? r.presets : r.presets.filter((p) => String(p.slot) === sel);
  return (
    <div className={cx('build-view', r.presets.length > 1 && 'two')}>
      {mismatch ? (
        <p className="bv-banner" role="note">
          <PixelArt name="now-glyph-wrench" decorative />
          <span>{mismatch}</span>
        </p>
      ) : null}
      {r.note ? <p className="bv-note-line">{r.note}</p> : <p className="bv-status">{r.status}</p>}
      <ClassPath r={r} />
      <GateRuler r={r} />
      {r.presets.length > 1 && !wide ? (
        <SegmentedControl
          label={W.grid.presets}
          value={sel}
          options={r.presets.map((p) => ({ value: String(p.slot), label: p.heading }))}
          onChange={setSel}
        />
      ) : null}
      <div className="bv-presets">
        {shown.map((p) => (
          <PresetPanel
            key={p.slot}
            p={p}
            index={r.index}
            lead={lead?.preset === p ? lead.tab.tab : null}
            wide={wide}
          />
        ))}
      </div>
      <ComingUp r={r} />
      {r.quiet || r.source ? (
        <p className="bv-muted bv-quiet">
          {r.quiet ? `${r.quiet} ` : ''}
          {r.source ? <SourceLabel source={r.source} /> : null}
        </p>
      ) : null}
    </div>
  );
}

/** The character page's Build tab. */
export function BuildTab({ view, index }: CharacterTabProps) {
  const actions = useNowActions();
  const r = view.builds.find((b) => b.index === index);
  if (!r) return <p className="bv-muted">No build data for this character yet.</p>;
  // The wrong-preset blocker's own words as the banner (FR-C3), when M9's blocker fires.
  const c = actions.result?.characters.find((x) => x.index === index);
  const wrong = c?.goals.find((g) => g.id === 'talent-presets.check.wrong-preset');
  return <BuildRoadmap r={r} mismatch={wrong ? wrong.nextAction.text : null} />;
}
