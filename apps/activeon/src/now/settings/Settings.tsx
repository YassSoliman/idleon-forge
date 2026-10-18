// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 G10: the Settings sheet's body, a lazy part opened from the header's overflow menu. Three rows,
// each a segmented control (a radio group, 44 px): Theme (System / Light / Dark: the way back to
// System that the header's sun/moon toggle doesn't offer), Times and Back in. There is no direction
// row (D-1).
import { SETTINGS_WORDS as W } from '@idleon-forge/engine/now';
import { type ReactNode, useState } from 'react';
import { SegmentedControl } from '../../design/atoms/Choice';
import { readTheme, type ThemeChoice, writeTheme } from '../../design/theme';
import { type BackMode, THEME_EVENT, useSettings } from './settings-store';

function Row({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="n-setting">
      {/* The control's legend says the same for screen readers. */}
      <p className="n-setting__name" aria-hidden="true">
        {name}
      </p>
      {children}
    </div>
  );
}

export function SettingsBody({ namespace, persistent }: { namespace: string | null; persistent: boolean }) {
  const [settings, update] = useSettings(namespace);
  const [theme, setTheme] = useState<ThemeChoice>(readTheme);
  return (
    <div className="n-settings">
      <Row name={W.theme}>
        <SegmentedControl<ThemeChoice>
          label={W.theme}
          value={theme}
          options={[
            { value: 'system', label: W.themeSystem },
            { value: 'light', label: W.themeLight, glyph: 'ui-theme-sun' },
            { value: 'dark', label: W.themeDark, glyph: 'ui-theme-moon' },
          ]}
          onChange={(v) => {
            writeTheme(v);
            setTheme(v);
            try {
              window.dispatchEvent(new Event(THEME_EVENT));
            } catch {}
          }}
        />
      </Row>
      <Row name={W.times}>
        <SegmentedControl<'relative' | 'clock'>
          label={W.times}
          value={settings.times}
          options={[
            { value: 'relative', label: W.timesRelative },
            { value: 'clock', label: W.timesClock },
          ]}
          onChange={(v) => update({ times: v })}
        />
      </Row>
      <Row name={W.backIn}>
        <SegmentedControl<BackMode>
          label={W.backIn}
          value={settings.back}
          options={[
            { value: 'learned', label: W.backLearned },
            { value: 'ask', label: W.backAsk },
          ]}
          onChange={(v) => update({ back: v })}
        />
      </Row>
      <p className="n-muted n-small">{persistent && namespace !== null ? W.stored : W.notStored}</p>
    </div>
  );
}
