// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// TalentBannedforAllLV, mirrored from the game client: the skillIndexes excluded from every
// "added levels" source (super talent points, AllTalentLVz additions). The last clause is
// unbounded, not a range: every id past 614 (star talents) is excluded.
// Dependency-free on purpose: the builds editor imports this on public pages and must not
// drag the parser modules along (see utility/builds/hydrate.js).
// game: "TalentBannedforAllLV"
export const isTalentBannedForAllLevels = (skillIndex) => (
  (skillIndex >= 49 && skillIndex <= 59)
  || skillIndex === 149 || skillIndex === 374 || skillIndex === 505 || skillIndex === 539
  || skillIndex > 614
);
