// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 Integration: `@idleon-forge/engine/characters-ui`, the UI-thread entry of area C's lazy parts (the
// Characters place, the Build tab), like area S's `./systems-ui`. Area C's words (`words/characters.ts`)
// are reached only from here, not from the `now` barrel, so a first-load file can't pull the Build path's
// word functions in by accident (TR-12). Pure words only: no worker module, no Knowledge Base.
export * from './words/characters';
