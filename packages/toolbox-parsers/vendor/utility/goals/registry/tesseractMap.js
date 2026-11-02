// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { getMaps } from '@parsers/class-specific/tesseract';
import { GOAL_ROUTES } from '../routes';
import { portalsDescriptor } from './portals';

export default portalsDescriptor({
  system: 'tesseractMap',
  label: 'Tesseract maps',
  route: GOAL_ROUTES.tesseractMap,
  // the Maps tab card per map; its portals open the map
  list: ({ account, characters }) => (account?.tesseract ? getMaps(account, characters ?? [], undefined) ?? [] : [])
});
