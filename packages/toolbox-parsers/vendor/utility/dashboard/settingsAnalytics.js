// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { allTrackers } from './settingsModel';

export const trackSettingsEvent = (name, params = {}) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, { event_category: 'dashboard', ...params });
};

export const resetScope = (model, prefix) => {
  if (!prefix) return 'all';
  if (model.some((tab) => tab.sections.some((section) => section.key === prefix))) return 'section';
  return allTrackers(model).some((tracker) => tracker.path === prefix) ? 'tracker' : 'option';
};
