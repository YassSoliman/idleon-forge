// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { generate } from '@idleon-forge/release/node';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { bundleGuards } from './bundle-guards.ts';

export default defineConfig(() => {
  // M12 TR-3: one generator run writes public/version.json and public/whats-new.json and gives the
  // BuildInfo compiled in as __BUILD_INFO__, so the two can never disagree. Tests skip the files.
  const { buildInfo } = generate({ appDir: import.meta.dirname, write: !process.env.VITEST });
  return {
    plugins: [react(), bundleGuards()],
    define: { __BUILD_INFO__: JSON.stringify(buildInfo) },
    build: {
      target: 'es2022',
      // The parser bundle is one ~6 MB module by design; it only ever loads inside the Web Worker.
      chunkSizeWarningLimit: 8000,
      // Fonts stay files (cached, and allowed by `font-src 'self'`), never data: URIs in the CSS.
      assetsInlineLimit: (file: string) => (/\.woff2?$/.test(file) ? false : undefined),
    },
    worker: { format: 'es' as const },
  };
});
