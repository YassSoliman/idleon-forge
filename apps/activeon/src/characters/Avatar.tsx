// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The character page's pictures from the M24 sprite kit (our own pixel art, ADR 0009): a character by
// its class sprite ("class-hunter"), falling back to the family who-glyph for a class the kit doesn't
// draw yet; a Goal by its System's sprite, falling back to a status sprite.
import { KitSprite } from '../art/game/KitSprite';
import { spriteOf } from '../art/sprites';
import { Sprite } from '../art/sprites/Sprite';
import { type ClassFamily, WhoGlyph } from '../design/who/WhoGlyph';

const slug = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** The game spells it "Conjuror"; the kit's sprite is "conjurer". */
const ALIAS: Readonly<Record<string, string>> = { 'bubonic-conjuror': 'bubonic-conjurer' };

/** "Beast Master" -> "class-beast-master" when the kit draws it, else null. */
export const classSprite = (classLabel: string): string | null => {
  const s = slug(classLabel);
  const name = `class-${ALIAS[s] ?? s}`;
  return spriteOf(name) ? name : null;
};

/**
 * The class family's own sprite ("class-warrior") for a class the kit doesn't draw yet, so a strip of
 * end-game classes never mixes class sprites with blobs (M24 QA P3).
 */
const familySprite = (family: ClassFamily): string | null => {
  const name = `class-${family}`;
  return spriteOf(name) ? name : null;
};

/** A character's picture: its class sprite, else its family's, else the family who-glyph. Always decorative. */
export function Avatar({
  classLabel,
  family,
  size,
}: {
  classLabel: string;
  family: ClassFamily;
  size: 32 | 48 | 64;
}) {
  const name = classSprite(classLabel) ?? familySprite(family);
  if (name) return <Sprite name={name} size={size} decorative className="cp-avatar" />;
  return (
    <span className="cp-avatar cp-avatar--who" data-size={size}>
      <WhoGlyph
        family={family}
        classLabel={classLabel}
        scale={size === 32 ? 1 : size === 48 ? 2 : 3}
        decorative
      />
    </span>
  );
}

/** A Goal's picture: its System's sprite ("sys-cards"), else a warning for a fix or an arrow. */
export function GoalSprite({ system, fix, size }: { system: string; fix: boolean; size: 32 | 48 }) {
  return <KitSprite name={`sys-${system}`} fallback={fix ? 'status-warning' : 'status-arrow'} size={size} />;
}
