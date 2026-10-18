// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The chrome every place shows above its content (M17 FR-6): the banners, the progress bar, What's new
// and the polite live region. Area N's slot (M21 §9 "Chrome slot"): the shell renders `<NowChrome s />`
// and never edits these pieces itself, so the Now redesign changes only this folder.
import type { Session } from '../../shell/session';
import { Banners, ProgressBar, WhatsNewCard } from '../Chrome';
import { useWhatsNew } from '../release';

export function NowChrome({ s }: { s: Session }) {
  const whatsNew = useWhatsNew();
  return (
    <>
      <Banners
        banners={s.view.banners}
        onReload={s.onReload}
        firstFill={s.view.allSet?.covered && s.timeline ? s.view.allSet.detail : null}
        onTimeline={() => s.navigate({ place: 'timeline', section: null }, 'push')}
      />
      <ProgressBar progress={s.view.progress} onAccount={s.toAccountFix} />
      {whatsNew.view ? <WhatsNewCard view={whatsNew.view} onDismiss={whatsNew.dismiss} /> : null}
    </>
  );
}

/** The polite live region (TR-14): it sits after the place's content, as before the slot existed. */
export function NowLiveRegion({ s }: { s: Session }) {
  return (
    <p className="sr-only" aria-live="polite">
      {s.spoken}
    </p>
  );
}
