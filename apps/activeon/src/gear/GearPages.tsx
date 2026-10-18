// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M18 F5 the System page bodies (docs/specs/M18-gear-tools.md FR-26 to FR-28): the Gear page's heat strip
// (rows are characters, columns the 8 equipment slots and the AFK tool; under 720 px a list of each
// character's worst slot, three rows and "show all") and the Armor-set Smithy's set cards. An element
// whose `actionKey` is the page's highlight, or one of its Next Actions, is outlined (M17 FR-31). Names
// are joined here, on the UI thread, from the view. A lazy chunk with the Gear tab.
import { useState } from 'react';
import { StateGlyph } from '../design/atoms/StateGlyph';
import type { SystemPageBodyProps } from '../systems/pages';
import '../systems/gear-pages.css';

const COLUMN: Readonly<Record<string, string>> = {
  helmet: 'Helmet',
  weapon: 'Weapon',
  shirt: 'Shirt',
  pendant: 'Pendant',
  pants: 'Pants',
  ring1: 'Ring',
  shoes: 'Shoes',
  ring2: 'Ring',
  tool: 'AFK tool',
};

const nameOf = (p: SystemPageBodyProps, index: number) => {
  const c = p.s.view.roster.find((r) => r.index === index);
  return c ? `${c.name} (${c.classLabel} ${c.level})` : `Character ${index + 1}`;
};
const isLit = (p: SystemPageBodyProps, key: string | null) =>
  key !== null && (p.page.highlight === key || p.page.goals.some((g) => g.action.key === key));
/** One lit cell per picture: the highlight, else the first Next Action's cell. */
function litKey(p: SystemPageBodyProps, keys: readonly (string | null)[]): string | null {
  if (p.page.highlight && keys.includes(p.page.highlight)) return p.page.highlight;
  // FR-24's order: the hand-out first, then the other account lines, then character lines.
  const rank = (k: string) => (k.startsWith('gear.check.equip-held@') ? 0 : k.endsWith('@account') ? 1 : 2);
  const goals = [...p.page.goals].sort((a, b) => rank(a.action.key) - rank(b.action.key));
  for (const g of goals) if (keys.includes(g.action.key)) return g.action.key;
  return null;
}

export function GearPageBody(p: SystemPageBodyProps) {
  const heat = p.s.view.gear?.heat;
  const [all, setAll] = useState(false);
  if (!heat || heat.rows.length === 0) return null;
  const lit = litKey(
    p,
    heat.rows.flatMap((r) => r.cells.map((c) => c.actionKey)),
  );
  let litDone = false;
  const cellLit = (key: string | null) => {
    if (litDone || key === null || key !== lit || !isLit(p, key)) return false;
    litDone = true;
    return true;
  };
  // Phone fallback: each character's worst slot (most levels behind, else empty), three rows.
  const rank = (s: string) => (s === 'behind' ? 0 : s === 'empty' ? 1 : s === 'held-upgrade' ? 2 : 3);
  const worst = heat.rows.map((r) => {
    const i = r.cells
      .map((c, k) => ({ c, k }))
      .filter((x) => x.c.state !== 'none')
      .sort(
        (a, b) =>
          rank(a.c.state) - rank(b.c.state) || (parseInt(b.c.word, 10) || 0) - (parseInt(a.c.word, 10) || 0),
      )[0];
    return { index: r.index, col: i ? heat.columns[i.k] : null, cell: i?.c ?? null };
  });
  return (
    <section className="sy-pic gd-heat" aria-labelledby="gd-heat-h">
      <h3 id="gd-heat-h" className="sy-h3">
        Gear across the account
      </h3>
      <p className="small muted">Numbers are levels behind the Gear Plan.</p>
      <div className="gd-heat-wide">
        <table className="gd-heat-table">
          <thead>
            <tr>
              <th scope="col">Character</th>
              {heat.columns.map((c) => (
                <th key={c} scope="col">
                  {COLUMN[c] ?? c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heat.rows.map((r) => (
              <tr key={r.index}>
                <th scope="row">{nameOf(p, r.index)}</th>
                {heat.columns
                  .map((col, k) => ({
                    col,
                    c: r.cells[k] ?? { word: '', state: 'none' as const, actionKey: null },
                  }))
                  .map(({ col, c }) => (
                    <td key={col} className={`hc st-${c.state}${cellLit(c.actionKey) ? ' is-now' : ''}`}>
                      {c.state === 'none' ? (
                        '—'
                      ) : (
                        <>
                          <StateGlyph state={c.state} />
                          {c.word}
                        </>
                      )}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="gd-heat-narrow">
        <ul className="gd-worst">
          {(all ? worst : worst.slice(0, 3)).map((w) => (
            <li
              key={w.index}
              className={`st-${w.cell?.state ?? 'ok'}${w.cell && w.cell.actionKey === lit ? ' is-now' : ''}`}
            >
              {nameOf(p, w.index)}:{' '}
              {w.cell ? (
                <>
                  <StateGlyph state={w.cell.state} /> {COLUMN[w.col ?? ''] ?? w.col} {w.cell.word}
                </>
              ) : (
                'ok'
              )}
            </li>
          ))}
        </ul>
        {worst.length > 3 ? (
          <button type="button" className="a-btn a-btn--quiet" onClick={() => setAll(!all)}>
            {all ? 'show fewer' : `show all ${worst.length}`}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function ArmorSmithyBody(p: SystemPageBodyProps) {
  const sm = p.s.view.gear?.smithy;
  if (!sm) return null;
  const lit = litKey(
    p,
    sm.sets.map((x) => x.actionKey),
  );
  return (
    <section className="sy-pic gd-smithy" aria-labelledby="gd-smithy-h">
      <h3 id="gd-smithy-h" className="sy-h3">
        Armour sets
      </h3>
      <p className="small">{sm.line}</p>
      <ul className="gd-sets">
        {sm.sets.map((set) => (
          <li
            key={set.set}
            className={`gd-set${set.registered ? ' done' : ''}${set.actionKey && set.actionKey === lit ? ' is-now' : ''}`}
          >
            <p>
              <b>{set.setName}</b> · {set.bonus}
            </p>
            <ul className="gd-parts" aria-label={`${set.setName} set parts`}>
              {set.parts.map((pt) => (
                <li key={pt.rawName} className={`gp ${pt.where}`}>
                  <StateGlyph
                    state={pt.where === 'worn' ? 'ok' : pt.where === 'held' ? 'held-upgrade' : 'empty'}
                  />
                  {pt.name} <span className="small muted">{pt.where}</span>
                </li>
              ))}
            </ul>
            <p className="small">{set.line}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
