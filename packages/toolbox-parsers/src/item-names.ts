// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14: an item's display name from Toolbox's game data, for the 3D Printer samples the Account State
// lists (a sample can be any item, so the Knowledge Base can't carry every name).
import { items } from '@website-data';

/** "Forest_Fibres" for "ForestTree"; null for an id the pin doesn't know. */
export function itemDisplayName(rawName: string): string | null {
  const it = (items as Record<string, { displayName?: string }>)[rawName];
  return typeof it?.displayName === 'string' ? it.displayName : null;
}
