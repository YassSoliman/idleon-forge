// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// Every field a descriptor or a metric may set; the design spec's "Descriptor fields" says what each one means
export const DESCRIPTOR_FIELDS = ['system', 'label', 'entryLabel', 'scope', 'route', 'groups', 'list', 'key', 'name', 'icon',
  'metrics', 'iconRows', 'entryTag', 'allOnly', 'totals', 'entryOnly'];

export const METRIC_FIELDS = ['label', 'noun', 'value', 'max', 'percentOfMax', 'steps', 'tiers', 'boolean', 'verb', 'cost',
  'allIcon', 'nextStep', 'threshold'];
