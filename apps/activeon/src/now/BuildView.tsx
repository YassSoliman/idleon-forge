// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Build view (owner request 2026-10-18, docs/specs/M9-builds.md "Build view"): one character's
// talent roadmap as the character page's Build tab, and the Builds overview on the Roster. Everything
// is worded and ordered by the engine (`view.builds`); this only lays it out. Phone first: the two
// presets are tabbed under 1000 px and side by side above; wide talent tables scroll in their own box.
import type { BuildRoadmapView, NowView } from '@idleon-forge/engine/now';
import type { BuildPresetView, BuildTabView } from '@idleon-forge/engine/result';
import { useState } from 'react';
import type { CharacterTabProps } from './character-tabs';
import { useNowActions } from './context';
import { SourceLabel } from './parts';

const pct = (current: number, target: number) => (target > 0 ? Math.min(current, target) : 0);

function ClassPath({ r }: { r: BuildRoadmapView }) {
  if (r.path.length === 0) return null;
  return (
    <section aria-label="Class path" className="bv-block">
      <h3 className="section-h">Class path</h3>
      <ol className="bv-path">
        {r.path.map((p) => (
          <li key={`${p.label}-${p.state}`} className={`bv-step ${p.state}`}>
            <span className="sr-only">
              {{ done: 'done: ', now: 'now: ', next: 'next: ', later: 'later: ' }[p.state]}
            </span>
            {p.state === 'done' ? '✓ ' : ''}
            {p.label}
          </li>
        ))}
      </ol>
      {r.nextClass ? <p className="bv-next-class">{r.nextClass}</p> : null}
    </section>
  );
}

function TalentTable({ tab, presetKey }: { tab: BuildTabView; presetKey: string }) {
  const id = `${presetKey}-t${tab.tab}`;
  return (
    <section className="bv-tab" aria-labelledby={id}>
      <h5 id={id} className="bv-tab-h">
        Tab {tab.tab} · {tab.name}
        <span className="muted small">
          {' '}
          · {tab.spent.toLocaleString('en-US')} spent
          {tab.unspent ? ` · ${tab.unspent.toLocaleString('en-US')}+ unspent` : ''}
        </span>
      </h5>
      {tab.rows.length > 0 ? (
        <div className="bv-scroll">
          <table className="bv-table">
            <thead>
              <tr>
                <th scope="col">Talent</th>
                <th scope="col" className="num">
                  Now / target
                </th>
                <th scope="col">
                  <span className="sr-only">Progress</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tab.rows.map((x) => (
                <tr key={x.id} className={x.met ? 'met' : x.note ? 'later' : ''}>
                  <th scope="row">
                    {x.label}
                    {x.core ? <span className="bv-core"> core</span> : null}
                    {x.note ? <span className="bv-note small muted">{x.note}</span> : null}
                  </th>
                  <td className="num">
                    {x.current} / {x.target}
                    {x.met ? ' ✓' : ''}
                  </td>
                  <td>
                    <progress
                      className="bv-bar"
                      max={Math.max(1, x.target)}
                      value={pct(x.current, x.target)}
                      aria-label={`${x.label}: ${x.current} of ${x.target}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {tab.others.length > 0 ? (
        <p className="small muted bv-others">
          {tab.rows.length > 0 ? 'Also has points: ' : 'Talents with points: '}
          {tab.others.map((o) => `${o.label} ${o.level}`).join(', ')}
        </p>
      ) : tab.rows.length === 0 ? (
        <p className="small muted bv-others">No points in this tab.</p>
      ) : null}
    </section>
  );
}

function PresetPanel({ p, index, hidden }: { p: BuildPresetView; index: number; hidden: boolean }) {
  const key = `bv-${index}-p${p.slot}`;
  const byTab = new Map<number, typeof p.next>();
  for (const n of p.next) byTab.set(n.tab, [...(byTab.get(n.tab) ?? []), n]);
  return (
    <section
      className={`bv-preset${hidden ? ' phone-hidden' : ''}`}
      aria-labelledby={`${key}-h`}
      id={`${key}-panel`}
      role="tabpanel"
    >
      <h4 id={`${key}-h`} className="bv-preset-h">
        {p.heading}
        {p.active ? <span className="bv-badge">in use</span> : null}
      </h4>
      <p className="small muted">{p.roleText}</p>
      {p.unspent ? (
        <p className="bv-unspent">At least {p.unspent.toLocaleString('en-US')} points unspent</p>
      ) : null}
      {p.next.length > 0 ? (
        <div className="bv-next">
          <h5 className="section-h">Next points</h5>
          {[...byTab].map(([tab, list]) => (
            <div key={tab}>
              <p className="small muted">Tab {tab}</p>
              <ol className="bv-check">
                {list.map((n) => (
                  <li key={n.key}>{n.text}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : p.buildTitle ? (
        <p className="small">Every step of the build is done for now.</p>
      ) : null}
      {p.attackBar ? (
        <div className="bv-attacks small">
          <p>
            <b>Attack bar:</b> {p.attackBar.text}
          </p>
          {p.attackBar.set.length ? <p className="muted">On the bar: {p.attackBar.set.join(', ')}</p> : null}
          {p.attackBar.recommended.length ? (
            <p className="muted">The build wants: {p.attackBar.recommended.join(', ')}</p>
          ) : null}
        </div>
      ) : null}
      {p.tabs.map((t) => (
        <TalentTable key={t.tab} tab={t} presetKey={key} />
      ))}
    </section>
  );
}

/** One character's roadmap. */
export function BuildRoadmap({ r }: { r: BuildRoadmapView }) {
  const firstSel = r.presets.find((p) => p.active)?.slot ?? r.presets[0]?.slot ?? 0;
  const [sel, setSel] = useState<number>(firstSel);
  return (
    <div className={`build-view${r.presets.length > 1 ? ' two' : ''}`}>
      <p className="bv-status">{r.status}</p>
      {r.note ? <p className="bv-note-line">{r.note}</p> : null}
      <ClassPath r={r} />
      {r.presets.length > 1 ? (
        <div className="bv-switch" role="tablist" aria-label="Talent presets">
          {r.presets.map((p) => (
            <button
              key={p.slot}
              type="button"
              role="tab"
              id={`bv-${r.index}-p${p.slot}-tab`}
              aria-selected={sel === p.slot}
              aria-controls={`bv-${r.index}-p${p.slot}-panel`}
              className={`chip${sel === p.slot ? ' on' : ''}`}
              onClick={() => setSel(p.slot)}
            >
              {p.heading}
            </button>
          ))}
        </div>
      ) : null}
      <div className="bv-presets">
        {r.presets.map((p) => (
          <PresetPanel key={p.slot} p={p} index={r.index} hidden={r.presets.length > 1 && sel !== p.slot} />
        ))}
      </div>
      {r.comingUp.length > 0 ? (
        <section aria-label="Coming up" className="bv-block">
          <h3 className="section-h">Coming up</h3>
          <ul className="bv-coming">
            {r.comingUp.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {r.quiet || r.source ? (
        <p className="small muted bv-quiet">
          {r.quiet ? `${r.quiet} ` : ''}
          {r.source ? <SourceLabel source={r.source} /> : null}
        </p>
      ) : null}
    </div>
  );
}

/** The character page's Build tab. */
export function BuildTab({ view, index }: CharacterTabProps) {
  const r = view.builds.find((b) => b.index === index);
  if (!r) return <p className="small muted">No build data for this character yet.</p>;
  return <BuildRoadmap r={r} />;
}

/** The Builds overview on the Roster: every character with a one-line build status. */
export function BuildsOverview({ view }: { view: NowView }) {
  const actions = useNowActions();
  if (view.builds.length === 0) return null;
  return (
    <section aria-labelledby="builds-h" id="builds" className="builds-overview">
      <h2 id="builds-h" className="section-h">
        Builds
      </h2>
      <ul className="bo-list">
        {view.builds.map((b) => (
          <li key={b.index}>
            <a
              href={b.href}
              className="bo-row"
              onClick={(e) => {
                e.preventDefault();
                actions.openTab(b.index, 'build');
              }}
            >
              <span className="bo-top">
                <span className="r-name">{b.name}</span>
                <span className="r-class">
                  {b.classLabel} · lv {b.level}
                </span>
              </span>
              <span className="bo-status small">{b.status}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
