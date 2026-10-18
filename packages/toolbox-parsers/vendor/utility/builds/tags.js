// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 340ef2ccfa460673b759369dabf8996eb11d8086.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// The authoritative list of tags a build can be labelled with.
// Imported by the create/edit form and the list filter popover so they stay
// in sync. The Cloudflare worker (`it-cloudflare-builds/src/lib/tags.ts`)
// keeps its own copy for server-side validation — update both if you change
// this list.

export const TAG_OPTIONS = [
  'afk',
  'active',
  'dps',
  'damage',
  'accuracy',
  'defense',
  'skilling',
  'mining',
  'choppin',
  'fishing',
  'catching',
  'sampling',
  'low-level',
  'early-game',
  'mid-game',
  'endgame'
];
