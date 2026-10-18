// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 340ef2ccfa460673b759369dabf8996eb11d8086.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import createCache from '@emotion/cache';
import { slimPrefixer } from './emotion-prefixer';

// The same cache on the build machine and the client, so both write identical CSS.
const createEmotionCache = () => {
  return createCache({ key: 'css', stylisPlugins: [slimPrefixer] });
};

export default createEmotionCache;
