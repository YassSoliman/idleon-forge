// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The preference namespace for the settings (G10), provided by the app shell so every Now piece (and
// any area that formats a time itself) reads the same Times and Back in choices.
import { createContext, useContext } from 'react';
import { type Settings, useSettings } from './settings-store';

export const SettingsNamespace = createContext<string | null>(null);

/** The player's settings for the account on screen (defaults until the namespace is known). */
export function useNowSettings(): Settings {
  return useSettings(useContext(SettingsNamespace))[0];
}
