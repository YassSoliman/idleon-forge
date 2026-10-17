// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Stub for @mantine/hooks: helpers.js only calls readLocalStorageValue (the pets "what if" import path).
export const readLocalStorageValue = <T>({ defaultValue }: { key: string; defaultValue: T }): T =>
  defaultValue;
