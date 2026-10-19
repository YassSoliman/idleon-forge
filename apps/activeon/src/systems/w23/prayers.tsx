// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 Prayers and Shrines (canvas boards after/sys/Prayers, after/sys/Shrines): read-only facts from the
// save (M24's prayers and shrines pictures, pictures/w23.ts). ActiveOn has no Checks for either yet, so
// neither page says what to do: "unlock your first prayer" and "build this shrine there" need their
// own Checks and red team first.
import type { PrayersPicture } from '@idleon-forge/engine/systems-ui';
import { Sprite } from '../../art/sprites/Sprite';
import type { SystemPageBodyProps } from '../pages';
import { Head, type PageSections, pictureOf, Tag, Who } from './kit';

export const PRAYER_WORDS = {
  equipped: 'Equipped',
  all: 'All prayers',
  noPrayer: 'no prayer',
  equipNote:
    'A prayer gives its bonus and its curse to the character who equips it, so pick one whose curse does not hurt what that character does.',
  canUnlock: 'Prayers you can unlock',
  atLevel1: 'numbers at level 1',
  atLevel: 'numbers at their level',
  wave: (n: number) => `wave ${n}`,
  but: (curse: string) => ` · but ${curse}`,
  openNow: (lv: number) => `open now · Worship ${lv}`,
  needs: (lv: number) => `needs Worship ${lv}`,
  bestWave: (n: number) => `best wave ${n}`,
  unlocked: (lv: number) => `Lv ${lv}`,
  noneUnlockable: 'Every prayer of the open totems is unlocked.',
} as const;
const W = PRAYER_WORDS;

type Prayers = PrayersPicture;

function Zone({ pr, zone, only }: { pr: Prayers; zone: string; only?: 'locked' }) {
  const totem = pr.totems.find((t) => t.name === zone) ?? null;
  const open = totem !== null && pr.bestWorship !== null && totem.levelReq <= pr.bestWorship;
  const rows = pr.prayers
    .filter((x) => x.zone === zone && (only !== 'locked' || !x.unlocked))
    .sort((a, b) => a.wave - b.wave);
  if (!rows.length) return null;
  const firstLocked = rows.find((x) => !x.unlocked);
  return (
    <div className="w-stack w-stack--8">
      <div className="w-row w-row--between">
        <span className="w-b">{zone}</span>
        <span className={`w-xs${open ? ' w-t--mint' : ' w-mut'}`}>
          {totem ? (open ? W.openNow(totem.levelReq) : W.needs(totem.levelReq)) : ''}
          {totem && open ? ` · ${W.bestWave(totem.maxWave)}` : ''}
        </span>
      </div>
      <ul className="w-hair w-plain">
        {rows.map((r) => (
          <li key={r.index} className={`w-li${r.unlocked || r === firstLocked ? '' : ' w23-dim'}`}>
            <Tag tone={r.unlocked ? 'mint' : open && r === firstLocked ? 'gold' : undefined}>
              {r.unlocked ? W.unlocked(r.level) : W.wave(r.wave)}
            </Tag>
            <span className="w-stack w-stack--4 w-grow">
              <span className="w-sm w-b">{r.name}</span>
              <span className="w-xs">
                <span className="w-t--mint">{r.bonus}</span>
                <span className="w-mut">{W.but(r.curse)}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Equipped({ p, pr }: { p: SystemPageBodyProps; pr: Prayers }) {
  const zones = [...new Set(pr.prayers.map((x) => x.zone))];
  const open = zones.filter((z) => {
    const t = pr.totems.find((x) => x.name === z);
    return t && pr.bestWorship !== null && t.levelReq <= pr.bestWorship;
  });
  const shown = (open.length ? open : zones.slice(0, 1)).slice(0, 2);
  const anyLocked = shown.some((z) => pr.prayers.some((x) => x.zone === z && !x.unlocked));
  return (
    <>
      <section className="w-stack" aria-label={W.equipped}>
        <ul className="w-grid w-grid--3 w-plain">
          {pr.equipped.map((c) => (
            <li key={c.index} className="a-tile w-tile w23-prayer-who">
              <Who p={p} index={c.index} />
              {c.prayers.length ? (
                <ul className="w-plain w-sm">
                  {c.prayers.map((n) => (
                    <li key={n} className="w-row">
                      <Sprite name="item-prayer" size={16} decorative />
                      {n}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="a-tile2 w-tile2 w-xs w-mut">{W.noPrayer}</span>
              )}
            </li>
          ))}
        </ul>
        <p className="w-p">{W.equipNote}</p>
      </section>
      <section className="w-stack" aria-labelledby="w23-pr-unlock">
        <Head id="w23-pr-unlock" title={W.canUnlock} note={W.atLevel1} />
        {anyLocked ? (
          <div className="w-grid w23-zones">
            {shown.map((z) => (
              <Zone key={z} pr={pr} zone={z} only="locked" />
            ))}
          </div>
        ) : (
          <p className="w-p">{W.noneUnlockable}</p>
        )}
      </section>
    </>
  );
}

function All({ pr }: { pr: Prayers }) {
  const zones = [...new Set(pr.prayers.map((x) => x.zone))];
  return (
    <section className="w-stack">
      <span className="w-note">{W.atLevel}</span>
      <div className="w-grid w23-zones">
        {zones.map((z) => (
          <Zone key={z} pr={pr} zone={z} />
        ))}
      </div>
    </section>
  );
}

export function prayersSections(p: SystemPageBodyProps): PageSections | null {
  const pr = pictureOf(p, 'prayers');
  if (!pr) return null;
  const n = pr.equipped.reduce((t, c) => t + c.prayers.length, 0);
  return {
    answer: null,
    tabs: [
      { id: 'equipped', label: W.equipped, badge: n, render: () => <Equipped p={p} pr={pr} /> },
      { id: 'all', label: W.all, badge: pr.prayers.length, render: () => <All pr={pr} /> },
    ],
  };
}

// ---- Shrines ----

export const SHRINE_WORDS = {
  maps: 'On your maps',
  all: 'All shrines',
  where: 'Where your characters are',
  whereNote: 'a shrine boosts everyone on its map',
  shrinesHere: (n: number) => `${n} ${n === 1 ? 'shrine' : 'shrines'} here`,
  noShrine: 'no shrine here',
  others: 'Other maps',
  othersNote: (n: number) => (n ? `${n} shrines placed where no character is` : 'no characters, no shrines'),
  allNote: 'bonus at its level, or at level 1 while unbuilt',
  built: (lv: number) => `built · Lv ${lv}`,
  notBuilt: 'not built',
  on: (map: string) => `on ${map}`,
  salt: (salt: string) => salt,
} as const;
const S = SHRINE_WORDS;

function OnMaps({ p }: { p: SystemPageBodyProps }) {
  const sh = pictureOf(p, 'shrines');
  if (!sh) return null;
  const mapNames = new Set(sh.maps.map((m) => m.map));
  const elsewhere = sh.shrines.filter((s) => s.map !== null && !mapNames.has(s.map));
  return (
    <section className="w-stack" aria-labelledby="w23-sh-maps">
      <Head id="w23-sh-maps" title={S.where} note={S.whereNote} />
      <ul className="w-grid w-plain">
        {sh.maps.map((m) => {
          const here = sh.shrines.filter((s) => s.map === m.map);
          return (
            <li key={m.map} className="a-tile w-tile">
              <span className="w-b">{m.map}</span>
              <div className="w-who-list w-sm">
                {m.characters.map((i) => (
                  <Who key={i} p={p} index={i} />
                ))}
              </div>
              {here.length ? (
                <ul className="w-plain w-xs">
                  {here.map((s) => (
                    <li key={s.index} className="w-row">
                      <Sprite name="item-shrine" size={16} decorative />
                      {s.name} · {s.what}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="w-xs w-mut">{S.noShrine}</span>
              )}
            </li>
          );
        })}
        <li className="a-tile w-tile is-later">
          <span className="w-sm w-mut">{S.others}</span>
          <span className="w-xs w-mut">{S.othersNote(elsewhere.length)}</span>
        </li>
      </ul>
    </section>
  );
}

function AllShrines({ p }: { p: SystemPageBodyProps }) {
  const sh = pictureOf(p, 'shrines');
  if (!sh) return null;
  return (
    <section className="w-stack" aria-labelledby="w23-sh-all">
      <Head id="w23-sh-all" title={S.all} note={S.allNote} />
      <ul className="w-grid w-grid--3 w-plain">
        {sh.shrines.map((s) => (
          <li key={s.index} className={`a-tile2 w-tile2 w23-shrine${s.built ? '' : ' is-later'}`}>
            <Sprite name="item-shrine" size={32} decorative />
            <span className="w-stack w-stack--4 w-grow">
              <span className="w-sm w-b">{s.name}</span>
              <span className="w-xs w-mut2">{s.what}</span>
              <span className="w-xs w-mut">
                {[s.built ? S.built(s.level) : S.notBuilt, s.map ? S.on(s.map) : null, s.salt]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function shrinesSections(p: SystemPageBodyProps): PageSections | null {
  const sh = pictureOf(p, 'shrines');
  if (!sh) return null;
  return {
    answer: null,
    tabs: [
      { id: 'maps', label: S.maps, render: () => <OnMaps p={p} /> },
      { id: 'all', label: S.all, badge: sh.shrines.length, render: () => <AllShrines p={p} /> },
    ],
  };
}
