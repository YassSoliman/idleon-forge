// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// The design system first (M21 TR-2): fonts, tokens, element defaults, atoms; then the places' CSS.
import './design/fonts';
import './design/tokens.css';
import './design/base.css';
import './design/atoms/atoms.css';
import './styles/tokens.css';
import './styles/app.css';
import './styles/now.css';
import './styles/views.css';
import { initRoot } from './design/theme';

// data-direction and data-theme before the first render, so the first paint has the right colours.
initRoot();

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
