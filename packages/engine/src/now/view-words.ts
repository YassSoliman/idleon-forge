// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The view prose for M17's views and M21's areas (TR-9, M21 TR-7): status words, counts, headings and
// link labels. Every other string a view shows is a module's own text, a registry or fact-table fact, a
// character's name, a time or a count. Nothing here is advice: no imperative from the Next Action
// templates and no rating word (P6). `view-words.test.ts` lints it.
//
// M21 TR-7: the words live per area in `words/*.ts` (each area edits only its own file); this file
// re-exports them so every import keeps working.
export * from './words/characters';
export * from './words/map';
export * from './words/now';
export * from './words/shared';
export * from './words/shell';
export * from './words/systems';
export * from './words/time';
