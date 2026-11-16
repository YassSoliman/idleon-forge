// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 48cb4ee697988ec5eac14ba97142add6296505b2.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { prefix } from '@utility/helpers';

// Built by utility/build-worker.mjs, passed in by next.config.js as { name: { file, version } }.
const workers = (() => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_WORKERS || '{}');
  } catch {
    return {};
  }
})();

/** URL and expected version of a prebuilt worker, or null when it wasn't built (tests). */
export const workerFile = (name) => {
  const worker = workers[name];
  return worker ? { url: `${prefix}workers/${worker.file}`, version: worker.version } : null;
};
