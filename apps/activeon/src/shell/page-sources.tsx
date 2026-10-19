// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 rule 4 ("say it once"): a page's Sources go in one quiet line, the left half of the one-line
// footer. A place renders <PageSources>…</PageSources> anywhere in its tree and the words land in the
// footer; with none on screen the footer shows its default credit (numbers by IdleOn Toolbox, facts from
// the IdleOn Wiki). CSS swaps the two (`.n-foot__page:empty`), so no place has to tell the footer it left.
import { createContext, type ReactNode, useContext } from 'react';
import { createPortal } from 'react-dom';

/** The footer's Sources slot, set by the footer once it mounts. */
export const PageSourcesSlot = createContext<HTMLElement | null>(null);

/** One quiet line of Sources for the page on screen ("Kills from your save · IdleOn Wiki: Death Note"). */
export function PageSources({ children }: { children: ReactNode }) {
  const slot = useContext(PageSourcesSlot);
  return slot ? createPortal(children, slot) : null;
}
