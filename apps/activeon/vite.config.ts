// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    // The parser bundle is one ~6 MB module by design; it only ever loads inside the Web Worker.
    chunkSizeWarningLimit: 8000,
    // Fonts stay files (cached, and allowed by `font-src 'self'`), never data: URIs in the CSS.
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
  },
  worker: { format: 'es' },
});
