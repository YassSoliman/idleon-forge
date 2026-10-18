# ActiveOn Design Lab archive

The public, data-free copy of the ActiveOn Design Lab (2026-10-18). It is **reference material, not
shipped code**: the app builds its design system from it (M21, `docs/specs/M21-redesign.md`), and the
variants the app doesn't build are kept here so any of them can be picked later.

## What's here
- `brief.md`: the design brief and its twelve principles (P1–P12).
- `critique.md`, `critique.json`, `inventory.json`: v1, the Now screen, cards and flows (53 components,
  146 variants), with every variant's name, score, verdict and note.
- `v2/critique.md`, `v2/critique.json`, `v2/inventory.json`: v2, the System views (32 components, 106
  variants).
- `tokens.css`: the three directions (Quest Log, Field Guide, Command Board), light and dark. The app's
  own copy is `apps/activeon/src/design/tokens.css`, which self-hosts its fonts instead of the Lab's
  Google Fonts import.
- `art/`: our own pixel art (ADR 0009), its house style (`art/README.md`) and `art/MANIFEST.json`.
  `scripts/art/import.mjs` turns it into the app's typed art library.

Left out on purpose: the rendered variants (`parts/`, `v2/parts/`, the `index*.html` pages, `shots/`),
which embed scrubbed save data, and the research and build scratch. They stay in the private, local
copy at `fixtures/private/design-lab/` (gitignored). The Lab's `ref/` folder of game sprites is never
copied anywhere (ADR 0009).

The JSON and CSS files are reformatted by the repo's formatter; their content is the Lab's.

## The owner's ruling (2026-10-18)
"Implement this entire design system, all your picks specifically, 1:1 in the app ... keep them all in
our collection of design items, but go for mostly your picks." Four overrides, where a runner-up wins:

| Component | Critique pick | Owner's choice |
|---|---|---|
| What's new (`flows.whats-new`) | Inline new dots | Patch notes scroll |
| Your suggestions (`flows.your-suggestions`) | Plain list | Quest board on top, plain list for the rest |
| Empty states (`flows.empty`) | Next action empty | Sleeping blob |
| Loading / waiting (`flows.loading`) | Skeleton of the real layout | Blob walking |

Everything else is the critique's pick, with its critique note applied.

**The collection (owner answer to M21 Q1):** this archive plus the private full Lab is the collection.
There is no live in-app catalogue of the variants.
