// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

const KINDS = { zow: 'Zow', chow: 'Chow', wow: 'Wow' };

export default {
  system: 'apocalypse',
  label: 'Apocalypses',
  entryLabel: 'monster',
  scope: 'character',
  route: GOAL_ROUTES.apocalypse,
  groups: {
    label: 'Apocalypse',
    of: (row) => row.kind,
    names: KINDS
  },
  // afkTarget repeats between maps, the map name does not
  list: ({ character }) => Object.keys(KINDS).flatMap((kind) =>
    (character?.[kind]?.list ?? []).map((monster) => ({ ...monster, kind }))),
  key: (row) => `${row.kind}:${row.mapName}`,
  name: (row) => `${cleanUnderscore(row.name)}, ${cleanUnderscore(row.mapName)} (${KINDS[row.kind]})`,
  icon: (row) => `data/Mface${row.monsterFace}`,
  metrics: {
    kills: { label: 'Kills', value: (row) => (Number.isFinite(row.kills) ? Math.floor(row.kills) : 0) }
  }
};
