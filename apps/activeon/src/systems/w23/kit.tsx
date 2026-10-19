// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the shared kit of the World 2 and 3 System page sections (canvas boards after/Alchemy*, Bubba,
// after/sys/Refinery, Construction, Worship, Trapping, Printer, ArmorSmithy, Prayers, Shrines).
//
// A page is a list of sections (tabs) and, optionally, its own framed answer, in the shapes of the
// System page template's `FrameTab` and `FrameAnswer` (frame/SystemFrame.tsx); framed.tsx renders
// them through the template.
import type { SystemPicture } from '@idleon-forge/engine/result';
import type { ReactNode } from 'react';
import { Meter } from '../../design/atoms';
import { WhoGlyph } from '../../design/who/WhoGlyph';
import type { SystemPageBodyProps } from '../pages';
import './w23.css';

export type Tone = 'coral' | 'gold' | 'mint' | 'sky' | 'mut';

/** = the template's FrameAnswer: the framed answer, with an optional big number. */
export interface PageAnswer {
  tone: Tone;
  cap: string;
  hero: string;
  sub?: string | null;
  big?: {
    value: string;
    unit?: string | null;
    note?: string | null;
    meter?: number | null;
    tone?: Tone;
  } | null;
}

/** = the template's FrameTab. */
export interface SectionTab {
  id: string;
  label: string;
  badge?: string | number | null;
  render: () => ReactNode;
}

export interface PageSections {
  /** The page's own answer, when it says more than the engine's step (null: the template's default). */
  answer: PageAnswer | null;
  tabs: SectionTab[];
  /** The tab open first (a tab id). */
  initialTab?: string;
  /** Replaces the header's status when the page's own picture says more than the engine's word. */
  status?: { tone: Tone; word: string; reason?: string | null };
}

/** "Bowman 81": class and level, never a name. */
export const whoLabel = (p: SystemPageBodyProps, index: number): string => {
  const c = p.s.view.roster.find((r) => r.index === index);
  return c ? `${c.classLabel} ${c.level}` : `Character ${index + 1}`;
};

/** A character as its chibi and "Class level" (DS-13). */
export function Who({ p, index, quiet = false }: { p: SystemPageBodyProps; index: number; quiet?: boolean }) {
  const family = p.s.result.classFamilies?.[index];
  const label = whoLabel(p, index);
  return (
    <span className={`w-who${quiet ? ' w-mut2' : ''}`}>
      {family ? <WhoGlyph family={family} classLabel={label} scale={1} decorative /> : null}
      <span>{label}</span>
    </span>
  );
}

export const pictureOf = <K extends SystemPicture['kind']>(p: SystemPageBodyProps, kind: K) =>
  p.s.result.slotPictures?.find((x): x is Extract<SystemPicture, { kind: K }> => x.kind === kind) ?? null;

/** A picture the shared union declares narrowly (M21's printer), read as its full type. */
export const widePictureOf = <T,>(p: SystemPageBodyProps, kind: SystemPicture['kind']): T | null =>
  (p.s.result.slotPictures?.find((x) => x.kind === kind) as T | undefined) ?? null;

/** The page's step: one Next Action and who it is for (engine pictures/hub-view.ts PageStep). */
export interface PageStep {
  key: string;
  text: string;
  who: { label: string } | null;
}

/** The page's step (SystemPage passes the frame view, which carries it). */
export const stepOf = (p: SystemPageBodyProps): PageStep | null =>
  (p.page as { step?: PageStep | null }).step ?? null;

/** The one lit key: the page's highlight when it names one, else the System's first Next Action. */
export function litKeyOf(p: SystemPageBodyProps, keys: readonly (string | null)[]): string | null {
  if (p.page.highlight && keys.includes(p.page.highlight)) return p.page.highlight;
  for (const g of p.page.goals) if (keys.includes(g.action.key)) return g.action.key;
  return null;
}

export const n0 = (n: number) => Math.round(n).toLocaleString('en-US');

/** A section head: the 22 px pixel title, with an optional quiet note on the right. */
export function Head({ id, title, note }: { id?: string; title: string; note?: ReactNode }) {
  return (
    <div className="w-head">
      <h3 id={id} className="a-h2">
        {title}
      </h3>
      {note ? <span className="w-note">{note}</span> : null}
    </div>
  );
}

/** A 12 px caps label. */
export const Cap = ({ children, tone }: { children: ReactNode; tone?: Tone }) => (
  <span className={`a-cap${tone ? ` w-t--${tone}` : ''}`}>{children}</span>
);

/** A thin bar: value against max, coloured by meaning (the shared Meter atom). */
export function Bar({
  value,
  max,
  tone = 'mint',
  label,
}: {
  value: number;
  max: number;
  tone?: Tone;
  label: string;
}) {
  return <Meter value={value} max={max} label={label} tone={tone === 'mut' ? 'muted' : tone} />;
}

/** The shared Tag and Pip atoms (M24 Surfaces). */
export { Pip, Tag } from '../../design/atoms';

/** A big number with its unit ("7 of 18 tries"). */
export const Big = ({ value, unit, tone }: { value: string; unit?: string; tone?: Tone }) => (
  <span className={`w-big${tone ? ` w-t--${tone}` : ''}`}>
    {value}
    {unit ? <span className="w-big__u"> {unit}</span> : null}
  </span>
);

/** The aside next to a section's main column (a 320 px column from 1000 px, under it on a phone). */
export const Split = ({ main, aside }: { main: ReactNode; aside: ReactNode }) => (
  <div className="w-split">
    <div className="w-split__main">{main}</div>
    <aside className="w-split__aside">{aside}</aside>
  </div>
);
