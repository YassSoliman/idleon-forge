// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// Every field a descriptor or a metric may set; the design spec's "Descriptor fields" says what each one means
export const DESCRIPTOR_FIELDS = ['system', 'label', 'entryLabel', 'scope', 'route', 'groups', 'list', 'key', 'name', 'icon', 'systemIcon',
  'metrics', 'iconRows', 'entryTag', 'allOnly', 'totals', 'entryOnly', 'single', 'wikiId'];

export const METRIC_FIELDS = ['maxIsGoal', 'label', 'noun', 'value', 'max', 'percentOfMax', 'levelForPercent', 'steps', 'tiers', 'boolean', 'verb', 'cost',
  'allIcon', 'nextStep', 'threshold', 'tierAmount'];
