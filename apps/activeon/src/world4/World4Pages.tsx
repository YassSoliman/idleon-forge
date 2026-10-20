// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4: the read-only Laboratory, Cooking and Breeding System page bodies, one lazy chunk
// (systems/pages.ts). Each lays out its part of `EngineResult.world4`, built in the worker; a save without
// that World 4 record says so plainly instead of drawing an empty page.
import type { SystemPageBodyProps } from '../systems/pages';
import { BreedingBody } from './BreedingPage';
import { CookingBody } from './CookingPage';
import { LabBody } from './LabPage';
import './world4.css';

const Missing = ({ what }: { what: string }) => (
  <p className="w4-small w4-muted">This save has no {what} record yet, so there is nothing to show.</p>
);

export function LaboratoryPage({ s, page }: SystemPageBodyProps) {
  const v = s.result.world4?.lab;
  return v ? <LabBody s={s} v={v} framed={page.goals.length === 0} /> : <Missing what="Laboratory" />;
}

export function CookingPage({ s, page }: SystemPageBodyProps) {
  const v = s.result.world4?.cooking;
  return v ? <CookingBody s={s} v={v} framed={page.goals.length === 0} /> : <Missing what="Cooking" />;
}

export function BreedingPage({ s, page }: SystemPageBodyProps) {
  const v = s.result.world4?.breeding;
  return v ? <BreedingBody s={s} v={v} framed={page.goals.length === 0} /> : <Missing what="Breeding" />;
}
