// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24: a page's sections on the System page template (frame/SystemFrame.tsx): the header, the one
// framed answer (the page's own, else the engine's), real tabs and the footer line. The System's
// Next Actions (M10's Goal list, folded) close the first tab. A System whose data is missing falls
// back to the thin page.
import { SimplePage, StepsSection } from '../frame/SimplePage';
import { SystemFrame } from '../frame/SystemFrame';
import type { FullPageProps } from '../pages';
import type { PageSections } from './kit';

export function FramedSections({ s, page, sections }: FullPageProps & { sections: PageSections | null }) {
  if (!sections || sections.tabs.length === 0) return <SimplePage s={s} page={page} />;
  const tabs = sections.tabs.map((t, i) =>
    i === 0
      ? {
          ...t,
          render: () => (
            <>
              {t.render()}
              <StepsSection page={page} quiet />
            </>
          ),
        }
      : t,
  );
  return (
    <SystemFrame
      s={s}
      page={page}
      {...(sections.answer ? { answer: sections.answer } : {})}
      tabs={tabs}
      {...(sections.initialTab ? { initialTab: sections.initialTab } : {})}
      {...(sections.status ? { status: sections.status } : {})}
    />
  );
}
