// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the Refinery (canvas board after/sys/Refinery): each open salt with its rank bar, Auto Refine and
// fuel, the next salt still locked, and the salts waiting in Refinery storage. M24's refinery picture
// (pictures/w23.ts) from M15's Refinery fields; the Refinery Checks' advice stays theirs (the page's
// step and order). No advice of its own.
import { Sprite } from '../../art/sprites/Sprite';
import { inSpan } from '../../design/format';
import type { FullPageProps, SystemPageBodyProps } from '../pages';
import { Bar, Big, Cap, Head, n0, type PageSections, pictureOf, Split, Tag } from './kit';

export const REFINERY_WORDS = {
  salts: 'Salts',
  storage: 'Storage',
  open: (n: number, of: number) => `${n} of ${of} open`,
  rank: (n: number) => `Rank ${n}`,
  on: 'switched on',
  off: 'switched off',
  auto: 'Auto Refine on',
  bar: "This rank's bar",
  barOf: (v: string, max: string) => `${v} of ${max}`,
  fullIn: (t: string) => `full ${t}`,
  full: 'full',
  barNote:
    'Only a full bar refined by hand ranks a salt up. Auto Refine turns the bar into salt early, so it never fills.',
  fuel: 'Fuel',
  dry: (t: string) => `runs dry ${t}`,
  dryBefore: (t: string) => `runs dry ${t}, before you're back`,
  /** The header when a salt's fuel runs out before you're back (QA P2: not "Nothing to fix"). */
  dryStatus: "Fuel runs dry before you're back",
  held: (n: string) => `${n} held`,
  next: 'Next salt',
  locked: (n: number) => `${n} salts still locked`,
  lockedTag: 'locked',
  fuelCycle: 'Fuel',
  waiting: 'Refinery storage',
  waitingUnit: 'salts waiting',
  chestNote: 'Builds are paid from your storage chest and bags, not from Refinery storage.',
  paysFor: (salt: string) => `Paid in ${salt} now`,
  inRefinery: 'in the Refinery',
  inChest: 'in your chest',
} as const;
const W = REFINERY_WORDS;

function Salts({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'refinery');
  if (!pic) return null;
  const now = p.s.now;
  const back = p.s.result.returnAt ?? null;
  const open = pic.salts.filter((s) => s.unlocked);
  const locked = pic.salts.filter((s) => !s.unlocked);
  const next = locked[0] ?? null;
  const paying = open.filter((s) => s.paysFor.length);
  return (
    <Split
      main={
        <>
          {open.map((s) => {
            const lit = s.autoRefine && p.page.goals.length > 0;
            const dryBefore = s.dryAt !== null && back !== null && s.dryAt < back;
            return (
              <section
                key={s.id}
                className={`a-tile w-tile w-stack--24 w23-salt${lit ? ' is-now' : ''}`}
                aria-label={s.name}
              >
                <div className="w-row">
                  <span className="w-icon">
                    <Sprite name="item-salt" size={32} decorative />
                  </span>
                  <span className="w-stack w-stack--4 w-grow">
                    <h4 className="a-h2">{s.name}</h4>
                    <span className="w-sm w-mut2">
                      {W.rank(s.rank)} · {s.active ? W.on : W.off}
                    </span>
                  </span>
                  {s.autoRefine ? <Tag tone="gold">{W.auto}</Tag> : null}
                </div>
                <div className="w-stack w-stack--8">
                  <span className="w-row w-row--between w-sm">
                    <span className="w-b">{W.bar}</span>
                    <span className="w-t--sky">
                      {W.barOf(n0(s.power), n0(s.powerCap))}
                      {s.power >= s.powerCap
                        ? ` · ${W.full}`
                        : s.active && s.fullAt !== null
                          ? ` · ${W.fullIn(inSpan(s.fullAt - now))}`
                          : ''}
                    </span>
                  </span>
                  <Bar value={s.power} max={s.powerCap} tone="sky" label={`${s.name} ${W.bar}`} />
                  {s.autoRefine ? <span className="w-xs w-mut2">{W.barNote}</span> : null}
                </div>
                {s.fuel.length ? (
                  <div className="w-stack w-stack--8 w-foot">
                    <span className="w-row w-row--between w-sm">
                      <span className="w-b">{W.fuel}</span>
                      {s.dryAt !== null ? (
                        <span className={dryBefore ? 'w-t--gold w-b' : 'w-mut'}>
                          {(dryBefore ? W.dryBefore : W.dry)(inSpan(Math.max(0, s.dryAt - now)))}
                        </span>
                      ) : null}
                    </span>
                    <ul className="w-row w-plain">
                      {s.fuel.map((f) => (
                        <li key={f.name} className="a-tile2 w-tile2 w-grow w23-fuel">
                          <span className="w-sm w-b">{f.name}</span>
                          <span className="w-xs w-mut">{W.held(n0(f.held))}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            );
          })}
          {next ? (
            <section className="w-stack" aria-labelledby="w23-next-salt">
              <Head id="w23-next-salt" title={W.next} note={W.locked(locked.length)} />
              <div className="a-tile w-tile is-later">
                <div className="w-row">
                  <span className="w-icon">
                    <Sprite name="item-salt" size={32} decorative />
                  </span>
                  <span className="w-b w-grow">{next.name}</span>
                  <Tag>{W.lockedTag}</Tag>
                </div>
                {next.fuel.length ? (
                  <span className="w-row w-xs w-mut2">
                    <Cap>{W.fuelCycle}</Cap>
                    {next.fuel.map((f) => `${f.name} (${W.held(n0(f.held))})`).join(' · ')}
                  </span>
                ) : null}
              </div>
              {locked.length > 1 ? (
                <ul className="w-row w-plain">
                  {locked.slice(1).map((s) => (
                    <li key={s.id} className="a-tile2 w-tile2 w-xs w-mut">
                      {s.name}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </>
      }
      aside={
        <>
          <div className="w-stack">
            <Cap>{W.waiting}</Cap>
            <Big value={n0(pic.waiting)} unit={W.waitingUnit} tone={pic.waiting > 0 ? 'gold' : undefined} />
            <span className="w-sm w-mut2">{W.chestNote}</span>
          </div>
          {paying.map((s) => (
            <div key={s.id} className="w-stack w-stack--8">
              <Cap>{W.paysFor(s.name)}</Cap>
              <ul className="w-hair w-plain w-sm">
                {s.paysFor.map((b) => (
                  <li key={b.name} className="w-li w-row--between">
                    <span>{b.name}</span>
                    <span className="w-mut2">
                      Lv {b.from} → {b.to}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      }
    />
  );
}

function Storage({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'refinery');
  if (!pic) return null;
  const rows = pic.salts.filter((s) => s.unlocked || s.inRefinery || s.inChest);
  return (
    <section className="w-stack">
      <p className="w-p">{W.chestNote}</p>
      <ul className="w-hair w-plain">
        {rows.map((s) => (
          <li key={s.id} className="w-li">
            <Sprite name="item-salt" size={24} decorative />
            <span className="w-grow w-b">{s.name}</span>
            <span className={`w-sm${s.inRefinery ? ' w-t--gold w-b' : ' w-mut'}`}>
              {n0(s.inRefinery)} {W.inRefinery}
            </span>
            <span className="w-sm w-mut2">
              {n0(s.inChest)} {W.inChest}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function refinerySections(p: FullPageProps): PageSections | null {
  const pic = pictureOf(p, 'refinery');
  if (!pic) return null;
  // Gold, not coral: it runs out later, not now (coral is losing value now). It sets the header only
  // when the engine's own status is fine, so a wasting or behind word is never hidden.
  const back = p.s.result.returnAt ?? null;
  const dry = pic.salts.some((s) => s.unlocked && s.dryAt !== null && back !== null && s.dryAt < back);
  const fine = p.page.frame.status.tone === 'mint';
  return {
    answer: null,
    ...(dry && fine
      ? { status: { tone: 'gold' as const, word: W.dryStatus, reason: p.page.frame.status.reason } }
      : {}),
    tabs: [
      {
        id: 'salts',
        label: W.salts,
        badge: W.open(pic.salts.filter((s) => s.unlocked).length, pic.salts.length),
        render: () => <Salts p={p} />,
      },
      { id: 'storage', label: W.storage, badge: pic.waiting || null, render: () => <Storage p={p} /> },
    ],
  };
}
