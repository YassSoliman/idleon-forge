// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// Self-hosted (all three are OFL-1.1): no font request leaves for Google, so a visit reaches nothing
// but our own origin and the game's Firebase (M10 TR-13).
import '@fontsource/pixelify-sans/500.css';
import '@fontsource/pixelify-sans/700.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import './styles/tokens.css';
import './styles/app.css';
import './styles/now.css';
import './styles/views.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
