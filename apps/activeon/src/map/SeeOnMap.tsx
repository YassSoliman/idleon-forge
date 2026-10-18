// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-M7, FR-I1: "See it on the map", one link to a map's sheet on the Map place (`#map-<n>`). It goes on
// the Purpose quest line, the Cards grind list, Walkthrough steps with a map and the constellations. It
// draws nothing for a map the Map place doesn't know (W5 and up, or no map module), so it never opens an
// empty Map. Small and free of the Map place's code: the lazy parts that show it import only this file.
import { LINK_WORDS } from '@idleon-forge/engine/now';
import type { EngineResult } from '@idleon-forge/engine/result';
import { PixelArt } from '../design/art/PixelArt';
import { useNowActions } from '../now/context';
import { formatRoute } from '../shell/route';
import './see-on-map.css';

/** True when the Map place has a node (and so a sheet) for `mapIndex`. */
export function onMap(result: EngineResult | undefined, mapIndex: number | null | undefined): boolean {
  if (mapIndex === null || mapIndex === undefined || !result?.map) return false;
  return result.map.worlds.some((w) => w.maps.some((m) => m.mapIndex === mapIndex));
}

/** The map that holds a constellation (the Map's constellations overlay), or null. */
export function constellationMap(result: EngineResult | undefined, name: string): number | null {
  const by = result?.map?.overlays.constellations ?? {};
  for (const [m, names] of Object.entries(by)) if (names.includes(name)) return Number(m);
  return null;
}

export function SeeOnMap({ mapIndex, label }: { mapIndex: number | null | undefined; label?: string }) {
  const actions = useNowActions();
  if (!onMap(actions.result, mapIndex) || mapIndex === null || mapIndex === undefined) return null;
  const to = { place: 'map' as const, mapIndex };
  return (
    <a
      className="see-on-map"
      href={formatRoute(to)}
      aria-label={label ? `${LINK_WORDS.seeOnMap}: ${label}` : undefined}
      onClick={(e) => {
        if (!actions.navigate) return;
        e.preventDefault();
        actions.navigate(to);
      }}
    >
      <PixelArt name="v2-map-nav-map" decorative />
      <span>{LINK_WORDS.seeOnMap}</span>
    </a>
  );
}
