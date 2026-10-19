// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 Worship and Trapping (canvas boards after/sys/Worship, after/sys/Trapping): each character's
// charge as a tank and the totems, then each character's traps against the time you're back. M20's
// worship and traps pictures and M24's prayers picture (for which wave unlocks which prayer); the
// charge numbers are the engine's. No advice of its own.
import type { CSSProperties } from 'react';
import { GameIcon } from '../../art/game/GameIcon';
import { itemArt } from '../../art/game/game-art';
import { totemArt } from '../../art/game/systems-art';
import { inSpan, span } from '../../design/format';
import { formatRoute } from '../../shell/route';
import type { SystemPageBodyProps } from '../pages';
import {
  Bar,
  Cap,
  Head,
  litKeyOf,
  type PageAnswer,
  type PageSections,
  pictureOf,
  Split,
  stepOf,
  Tag,
  Who,
} from './kit';

export const WORSHIP_WORDS = {
  charge: 'Charge',
  totems: 'Totems',
  full: 'full · spend it',
  fullIn: (t: string) => `full ${t}`,
  noSkull: 'no skull',
  of: (v: string, max: number) => `${v} of ${max}`,
  chargeNote:
    'Charge grows on each character while you are away and stops when full. Spend it by playing a totem.',
  openTotems: 'Open totems',
  laterTotems: 'Other totems',
  bestWave: (n: number) => `best wave ${n}`,
  worship: (n: number) => `Worship ${n}`,
  opensAt: (n: number) => `opens at Worship ${n}`,
  unlocks: (wave: number, prayer: string) => `Wave ${wave} unlocks the prayer ${prayer}.`,
  prayersLink: 'Prayers',
  everyone: (n: number) => `Every character is Worship ${n}.`,
  best: (n: number) => `Your best Worship level is ${n}.`,
  skullsUnit: (of: number) => `of ${of} characters have a skull`,
  full_: 'full',
  traps: 'Traps',
  trapSets: 'Trap sets',
  placed: (n: number) => `${n} placed`,
  timers: 'Trap timers',
  noTrap: 'no trap yet',
  notStarted: 'Trapping not started',
  now: 'now',
  back: (t: string) => `you're back ${t}`,
  trapsNote:
    "Each placed trap is a bar that ends when it finishes. A bar that ends before the blue line sits idle until you're back.",
  setOf: (set: string, n: number | null) => (n ? `${set}, up to ${n} traps` : set),
  noSet: 'no trap set',
  ready: (n: number, of: number) => `${n} of ${of} done before you're back`,
} as const;
const W = WORSHIP_WORDS;

/** "1.66" -> "1.7", "50" -> "50". */
const charge = (n: number) => (n < 10 ? String(Math.round(n * 10) / 10) : String(Math.round(n)));

function Charge({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'worship');
  const prayers = pictureOf(p, 'prayers');
  if (!pic) return null;
  const now = p.s.now;
  const lit = litKeyOf(
    p,
    pic.tanks.map((t) => t.actionKey),
  );
  const best = prayers?.bestWorship ?? null;
  const levels = new Set(
    (p.s.result.skills ?? []).map((c) => c.rows.find((r) => r.skill === 'worship')?.level ?? null),
  );
  const open = pic.totems.filter((t) => best !== null && t.levelReq <= best);
  const later = pic.totems.filter((t) => !open.includes(t));
  const firstLocked = (zone: string) =>
    prayers?.prayers.filter((x) => x.zone === zone && !x.unlocked).sort((a, b) => a.wave - b.wave)[0] ?? null;
  return (
    <Split
      main={
        <section className="w-stack" aria-label={W.charge}>
          <ul className="w-plain w23-tanks">
            {pic.tanks.map((t) => {
              const full = t.charge >= t.max;
              const isLit = lit !== null && t.actionKey === lit;
              return (
                <li key={t.id} className="w23-tank">
                  <span
                    className={`w23-tank__g${full ? ' is-full' : ''}`}
                    style={
                      {
                        '--pct': `${t.max > 0 ? Math.min(100, (t.charge / t.max) * 100) : 0}%`,
                      } as CSSProperties
                    }
                    aria-hidden="true"
                  >
                    <i />
                  </span>
                  <span className="w-b">{W.of(charge(t.charge), Math.round(t.max))}</span>
                  <span className={`w-xs ${full ? 'w-t--gold w-b' : 'w-t--sky'}`}>
                    {full ? W.full : t.fullAt !== null ? W.fullIn(inSpan(t.fullAt - now)) : ''}
                  </span>
                  {t.skull ? (
                    <GameIcon art={itemArt(t.skull)} size={24} decorative />
                  ) : (
                    <span className={`w-xs${isLit ? ' w-t--gold w-b' : ' w-mut'}`}>{W.noSkull}</span>
                  )}
                  <Who p={p} index={t.index} quiet />
                </li>
              );
            })}
          </ul>
          <p className="w-p">{W.chargeNote}</p>
        </section>
      }
      aside={
        <>
          {open.length ? (
            <div className="w-stack">
              <Cap>{W.openTotems}</Cap>
              {open.map((t, i) => {
                const next = firstLocked(t.name);
                return (
                  <div key={t.id} className={`a-tile w-tile${i === 0 ? ' is-now' : ''}`}>
                    <span className="w-row">
                      <GameIcon art={totemArt(pic.totems.indexOf(t))} size={32} decorative />
                      <span className="w-b">{t.name}</span>
                    </span>
                    <span className="w-sm w-mut2">
                      {[t.map, W.worship(t.levelReq), W.bestWave(t.maxWave)].join(' · ')}
                    </span>
                    {next ? <span className="w-sm">{W.unlocks(next.wave, next.name)}</span> : null}
                    {i === 0 && prayers ? (
                      <a
                        className="w-link"
                        href={formatRoute({ place: 'system', id: 'prayers' })}
                        onClick={(e) => {
                          e.preventDefault();
                          p.s.navigate({ place: 'system', id: 'prayers' }, 'push');
                        }}
                      >
                        {W.prayersLink}
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
          {later.length ? (
            <div className="w-stack w-stack--8">
              <Cap>{W.laterTotems}</Cap>
              <ul className="w-hair w-plain w-sm">
                {later.map((t) => (
                  <li key={t.id} className="w-li w-row--between">
                    <span className="w-row">
                      <GameIcon art={totemArt(pic.totems.indexOf(t))} size={16} decorative />
                      <span>{t.name}</span>
                    </span>
                    <span className="w-mut">{W.worship(t.levelReq)}</span>
                  </li>
                ))}
              </ul>
              {levels.size === 1 && [...levels][0] !== null ? (
                <span className="w-xs w-mut2">{W.everyone([...levels][0] as number)}</span>
              ) : best !== null ? (
                <span className="w-xs w-mut2">{W.best(best)}</span>
              ) : null}
            </div>
          ) : null}
        </>
      }
    />
  );
}

function Totems({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'worship');
  if (!pic) return null;
  const maxWave = Math.max(1, ...pic.totems.map((t) => t.maxWave));
  return (
    <ul className="w-hair w-plain">
      {pic.totems.map((t) => (
        <li key={t.id} className="w-li w23-totem">
          <GameIcon art={totemArt(pic.totems.indexOf(t))} size={32} decorative />
          <span className="w-stack w-stack--4 w-grow">
            <span className="w-b">{t.name}</span>
            <span className="w-xs w-mut">
              {[t.map, W.worship(t.levelReq), t.usableBy.length ? `${t.usableBy.length} can play it` : null]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
          <span className="w23-totem__bar">
            <Bar value={t.maxWave} max={maxWave} tone="mint" label={`${t.name} ${W.bestWave(t.maxWave)}`} />
          </span>
          <span className="w-sm w-mut2">{W.bestWave(t.maxWave)}</span>
        </li>
      ))}
    </ul>
  );
}

function worshipAnswer(p: SystemPageBodyProps): PageAnswer | null {
  const pic = pictureOf(p, 'worship');
  const step = stepOf(p);
  if (!pic || !step?.key.startsWith('worship.check.no-skull')) return null;
  const n = pic.tanks.filter((t) => t.skull).length;
  return {
    tone: 'gold',
    cap: 'Do this next',
    hero: step.text,
    sub: null,
    big: { value: String(n), unit: W.skullsUnit(pic.tanks.length) },
  };
}

export function worshipSections(p: SystemPageBodyProps): PageSections | null {
  const pic = pictureOf(p, 'worship');
  if (!pic) return null;
  const full = pic.tanks.filter((t) => t.charge >= t.max).length;
  return {
    answer: worshipAnswer(p),
    tabs: [
      {
        id: 'charge',
        label: W.charge,
        badge: full ? `${full} ${W.full_}` : null,
        render: () => <Charge p={p} />,
      },
      { id: 'totems', label: W.totems, badge: pic.totems.length, render: () => <Totems p={p} /> },
    ],
  };
}

// ---- Trapping ----

const HOUR = 3_600_000;

function Traps({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'traps');
  if (!pic) return null;
  const now = p.s.now;
  const ends = pic.rows.flatMap((r) => r.traps.map((t) => t.endsAt));
  const hours = Math.max(12, Math.ceil(Math.max(pic.returnAt, ...ends, now) - now) / HOUR);
  const spanMs = Math.ceil(hours / 4) * 4 * HOUR;
  const at = (t: number) => `${Math.max(0, Math.min(100, ((t - now) / spanMs) * 100))}%`;
  const ticks = [0, 1, 2, 3].map((i) => (i === 0 ? W.now : span((spanMs / 3) * i)));
  return (
    <section className="w-stack" aria-labelledby="w23-traps-h">
      <Head id="w23-traps-h" title={W.timers} note={`${W.now} → ${span(spanMs)}`} />
      <div className="w23-lanes">
        <span />
        <span className="w23-ticks w-xs w-mut" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </span>
        {pic.rows.map((r) => (
          <div key={r.id} className="w23-lane-row">
            <span className="w-sm">
              <Who p={p} index={r.index} />
            </span>
            <span
              className="w23-lane"
              style={{ '--back': at(pic.returnAt) } as CSSProperties}
              role="img"
              aria-label={
                r.traps.length
                  ? W.ready(r.traps.filter((t) => t.endsAt <= pic.returnAt).length, r.traps.length)
                  : r.started
                    ? W.noTrap
                    : W.notStarted
              }
            >
              {r.traps.length ? (
                r.traps.map((t, k) => (
                  <i
                    // biome-ignore lint/suspicious/noArrayIndexKey: a character's traps are positional
                    key={k}
                    className={`w23-trap${t.endsAt <= pic.returnAt ? ' is-idle' : ''}`}
                    style={{ '--end': at(t.endsAt) } as CSSProperties}
                    title={t.critter}
                  />
                ))
              ) : (
                <span className="w-xs w-mut w23-lane__empty">{W.noTrap}</span>
              )}
            </span>
          </div>
        ))}
      </div>
      <p className="w-xs w-t--sky w23-backline">{W.back(inSpan(pic.returnAt - now))}</p>
      <p className="w-p">{W.trapsNote}</p>
    </section>
  );
}

function TrapSets({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'traps');
  if (!pic) return null;
  // The view names the set; Account State keeps its rawName (the sprite's name).
  const trapSetArt = (index: number) =>
    itemArt(p.s.state?.characters.find((c) => c.index === index)?.slots?.trapSet ?? null);
  return (
    <ul className="w-grid w-plain">
      {pic.rows.map((r) => (
        <li key={r.id} className={`a-tile w-tile${r.set ? '' : ' is-later'}`}>
          <span className="w-row">
            <GameIcon art={trapSetArt(r.index)} fallback="sys-trapping" size={32} wiki={r.set} decorative />
            <Who p={p} index={r.index} />
          </span>
          <span className="w-sm">
            {r.set ? W.setOf(r.set, r.allowed) : r.started ? W.noSet : W.notStarted}
          </span>
          {r.traps.length ? <Tag>{W.placed(r.traps.length)}</Tag> : null}
        </li>
      ))}
    </ul>
  );
}

export function trappingSections(p: SystemPageBodyProps): PageSections | null {
  const pic = pictureOf(p, 'traps');
  if (!pic) return null;
  const placed = pic.rows.reduce((t, r) => t + r.traps.length, 0);
  return {
    answer: null,
    tabs: [
      { id: 'traps', label: W.traps, badge: W.placed(placed), render: () => <Traps p={p} /> },
      { id: 'sets', label: W.trapSets, render: () => <TrapSets p={p} /> },
    ],
  };
}
