// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // The parser bundle is one ~6 MB module by design; it only ever loads inside the Web Worker.
  build: { target: 'es2022', chunkSizeWarningLimit: 8000 },
  worker: { format: 'es' },
});
