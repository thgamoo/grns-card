# Lore / World Pipeline

This document records the current content architecture decision.

## Core Decision

`lore/` is the source workspace for setting canon, scene context, style profiles,
and card-to-world relationships. The Markdown structure is designed to work well
in Obsidian, but the directory is not defined by Obsidian.

`world/` is the public-facing projection used by the website. It should contain
reader-facing Markdown, public map assets, public JSON projections, and the
library manifest.

`data/` is generated or curated game data consumed by the app.

`docs/` is project documentation, design notes, production decisions, and asset
work logs.

`lore/media/` is the discovery layer for images attached to lore nodes.
`docs/card-assets/` remains the final app-facing asset location.
Selection among candidates is stored in lore note metadata, not by moving files
into a separate selected folder.
`grns-card/scripts/sync-data.mjs` promotes selected media to `docs/card-assets`
before copying public assets.

`lore/cache/` is a gitignored working cache for generation-time context bundles.
It exists so an image-generation request can read one card-specific JSON bundle
instead of scanning many Markdown files on every request.

## Forward Flow

The intended production flow is:

```txt
lore setting notes
  -> card concept notes
  -> card context mapping
  -> card data JSON/YAML
  -> image-generation context cache
  -> image brief and prompt
  -> generated illustration candidate in lore/media
  -> selected media promoted to docs/card-assets
  -> public world projection when needed
```

The current `ob01` card notes were created by a bootstrap pass from existing
card JSON. They are not the long-term source of truth yet. They are marked with
`legacy_seed` to show that origin.

## Card Note Metadata

Card notes live under `lore/cards/<pack>/<serial>.md`.

Use this shape:

```yaml
id: card.ob01-0003
type: card
title: "검은 새 머리 선구자"
status: draft
serial: "ob01-0003"
expansion: "ob01"

context:
  scene: "scene.onboarding-first-gate"
  site: "site.first-gate"
  period: "period.first-gate-learning-age"
  faction: "faction.neutral"
  class: "class.onboarding"
  style_profile: "style-profile.ob01"
  races:
    - "race.dokkaebi"
  social_groups:
    - "group.onboarding-spirits"
  motifs:
    - "motif.black-bird-head"

grounded_in:
  - "lore/scenes/onboarding-first-gate.md"
  - "world/stories/first-gate/fox.md"

outputs:
  card_data: "data/card-2026-06-01-v1/cards/ob01/ob01-pack.json"
  illustration: "docs/card-assets/illustrations/ob01/ob01-0003.png"

images:
  cover: "docs/card-assets/illustrations/ob01/ob01-0003.png"
  selected:
    - "docs/card-assets/illustrations/ob01/ob01-0003.png"

legacy_seed:
  card_file: "data/card-2026-06-01-v1/cards/ob01/ob01-pack.json"
  card_fields:
    - "name"
    - "effect"
    - "race"
    - "lore"
    - "sigil"
```

## Field Meanings

`context` is the execution map. Image generation and future card-data generation
follow these references.

`grounded_in` is the editorial basis. It explains why a context link exists.

`outputs` are downstream artifacts expected from the note.

`legacy_seed` is only for bootstrap notes that were reverse-extracted from old
card data.

`images.selected` is not an image-generation input. It records which generated
candidate or legacy final asset should be promoted after a human or agent has
chosen it. If an image should affect a new generation, put it under
`image_generation.reference_images`.

Do not use `source` for card notes. It confuses the forward pipeline because it
sounds like the old card JSON is the source of truth.

## Image-Generation Cache

Before generating a card image, build or refresh the card-specific cache:

```bash
node scripts/lore/build-image-context-cache.mjs --root lore
node scripts/lore/build-image-context-cache.mjs --root lore --card ob01-0003
```

The script writes `lore/cache/image-contexts/<serial>.json` plus an index. The
cache includes the card note, its execution context, image brief, explicit
generation references, and resolved scene/style/site/period/faction/group/motif
notes.

The cache deliberately omits `images.selected` from generation inputs. It may
include `image_generation.reference_images`, even if a reference happens to be
the same file that is currently selected.

## Current Scripts

Run from the repository root:

```bash
node scripts/lore/extract-ob-lore.mjs
node scripts/lore/extract-ob-lore.mjs --force
node scripts/lore/normalize-metadata.mjs --root lore
node scripts/lore/add-frontmatter.mjs --root lore --write
node scripts/lore/build-image-context-cache.mjs --root lore
node scripts/lore/promote-selected-media.mjs
node scripts/lore/export-media-index.mjs
node scripts/lore/export-card-contexts.mjs --root lore --out lore/generated/card-contexts.json
node scripts/lore/export-graphml.mjs --root lore --out lore/graph/exports/world.graphml
```

`extract-ob-lore.mjs` does not overwrite existing notes unless `--force` is
passed.

## Generated Files

- `lore/generated/card-contexts.json`: card-to-world mapping for downstream
  generation.
- `lore/media/manifests/image-index.json`: image-to-node mapping for media
  lookup.
- `lore/media/manifests/card-assets.json`: filtered card illustration mapping.
- `lore/media/manifests/selected-media.json`: selected-media promotion report.
- `lore/cache/image-contexts/*.json`: gitignored image-generation working
  cache.
- `lore/graph/exports/world.graphml`: graph export for tools such as Gephi,
  yEd, Cytoscape, or NetworkX.

Generated files can be regenerated from Markdown notes. Do not hand-edit them
unless you are intentionally patching an export.
