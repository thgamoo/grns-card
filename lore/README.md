---
id: lore.readme
type: index
title: Lore
status: active
tags:
  - lore
  - obsidian
---

# Lore

`lore/` is the source workspace for the GRNS setting.

Use this directory for notes that explain the world underneath cards and public
website pages: scene context, spatial background, periods, events, societies,
style profiles, and card-to-world relationships.

The Markdown structure is designed to work well in Obsidian.

## Directory Roles

- `scenes/`: image-generation scene contexts. These are the main bridge from a
  card to the world behind it.
- `atlas/`: regions, routes, sites, borders, and recurring spatial frames.
- `chronology/`: periods and timeline anchors.
- `events/`: wars, rites, disasters, migrations, rebellions, and encounters.
- `societies/`: factions, classes, social groups, occupations, and institutions.
- `cosmology/`: powers, spirits, omens, taboos, and transformations.
- `visual/`: style core, anti-realism guardrails, style profiles, motifs,
  materials, palettes, costumes, and architecture.
- `cards/`: card concept notes. Current `ob01` notes were bootstrapped from old
  card JSON, but future card data should be generated from these notes.
- `media/`: setting-node image references, generated candidates, selected-media
  promotion manifests, and image-to-node manifests. Selection is stored in note
  metadata.
- `cache/`: gitignored generated working cache for image-generation context
  bundles. This directory can be deleted and rebuilt at any time.
- `rules/`: global writing and image-generation rules.
- `indexes/`: Obsidian maps of content.
- `generated/`: generated indexes such as card-to-world context mappings.
- `graph/exports/`: generated graph formats such as GraphML.

## Recommended Flow

The intended forward flow is:

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
card JSON. They are marked with `legacy_seed` to preserve that history, but the
old card JSON should not be treated as the long-term source of truth.

## Card Metadata

Use these frontmatter fields for card notes:

- `context`: execution map for generation and card-data export.
  Include `context.style_profile` so expansion-specific art direction can vary.
- `grounded_in`: editorial basis for the context links.
- `outputs`: downstream artifacts expected from the note.
- `images`: browsing and promotion metadata. `images.selected` is not read as
  image-generation input.
- `image_generation`: explicit generation inputs such as `reference_images`.
- `legacy_seed`: bootstrap-only record of old data used to seed a note.

Do not use `source` for card notes. It makes the old card JSON sound like the
source of truth and obscures the forward flow.

See `docs/architecture/lore-world-pipeline.md` for the full decision record.

## Scripts

Run these helper scripts from the repository root:

```bash
node scripts/lore/extract-ob-lore.mjs
node scripts/lore/extract-ob-lore.mjs --force
node scripts/lore/normalize-metadata.mjs --root lore
node scripts/lore/add-frontmatter.mjs --root lore --write
node scripts/lore/build-image-context-cache.mjs --root lore
node scripts/lore/build-image-context-cache.mjs --root lore --card ob01-0003
node scripts/lore/promote-selected-media.mjs
node scripts/lore/export-media-index.mjs
node scripts/lore/export-card-contexts.mjs --root lore --out lore/generated/card-contexts.json
node scripts/lore/export-graphml.mjs --root lore --out lore/graph/exports/world.graphml
```

## Image-Generation Cache

Image generation should not repeatedly read every possible lore note. Build the
cache first, then read the relevant card bundle:

```txt
lore/cards/ob01/ob01-0003.md
  -> scripts/lore/build-image-context-cache.mjs
  -> lore/cache/image-contexts/ob01-0003.json
  -> prompt / image-generation request
```

`lore/cache/` is gitignored. The cache is only a convenience layer, not source
of truth. If a note changes, rebuild the cache.

`images.selected` belongs to the later promotion step. For generation, use
`image_generation.reference_images` when an existing image should be used as a
visual reference.

## Authoring Flow

You can start by writing only non-card setting notes: scenes, sites, periods,
events, factions, classes, groups, motifs, materials, palettes, and style
profiles. From those notes I can help draft card notes and add frontmatter.

Card notes are still useful when you already know the card's subject, rule
fantasy, or image brief. In that case write the body freely; the metadata can be
normalized afterward with:

```bash
node scripts/lore/add-frontmatter.mjs --root lore --write
```
