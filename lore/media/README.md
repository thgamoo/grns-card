---
id: media.readme
type: index
title: Lore Media
status: active
tags:
  - lore
  - media
  - image-generation
---

# Lore Media

`lore/media/` is the lookup layer for images attached to setting nodes.

It should make every useful image discoverable from lore notes without moving
final app assets out of `docs/card-assets`.

## Directory Roles

- `references/`: human-provided reference images for generation.
- `generated/`: generated candidates that are not final assets yet.
- `manifests/`: generated image-to-node indexes.

Selection is metadata. Use `images.selected` in the lore note to mark which
candidate or legacy final asset is currently preferred.

`images.selected` is not an image-generation input. It is used after selection
by promotion and indexing scripts.

## Asset Boundary

`docs/card-assets/` remains the final delivery location for game and website
assets. The app already reads those paths.

`lore/media/` indexes and references those assets so generation scripts can
discover them from lore.

Before the app copies `docs/` into `grns-card/public`, `sync-data.mjs` runs the
selected-media promotion script. That script copies the first `images.selected`
entry to `outputs.illustration` when those paths differ.

Legacy images that already live in `docs/card-assets/` are treated as selected
media too. For those notes, `images.selected` and `outputs.illustration` point
to the same path, so promotion is a no-op.

```txt
lore node
  -> image_generation.reference_images
  -> lore/cache/image-contexts/<card>.json
  -> generated candidate under lore/media/generated
  -> images.selected after review
  -> scripts/lore/promote-selected-media.mjs
  -> outputs.illustration under docs/card-assets
  -> lore/media/manifests/image-index.json
  -> docs/card-assets/... for final assets
```

## File Placement

Use node slugs in file names to keep Obsidian links unambiguous.

```txt
lore/media/references/scenes/onboarding-first-gate/onboarding-first-gate-layout-ref.png
lore/media/generated/cards/ob01/ob01-0003/ob01-0003-v01.png
```

For current final card illustrations, do not duplicate files by default. They
are indexed from `docs/card-assets/illustrations/**`.

## Promotion

Run this from the repository root:

```bash
node scripts/lore/promote-selected-media.mjs
```

This writes `lore/media/manifests/selected-media.json`.

The app build path runs this automatically through:

```bash
node grns-card/scripts/sync-data.mjs
```

## Selection Example

```yaml
images:
  cover: "docs/card-assets/illustrations/ob01/ob01-0003.png"
  generated:
    - "lore/media/generated/cards/ob01/ob01-0003/ob01-0003-v01.png"
    - "lore/media/generated/cards/ob01/ob01-0003/ob01-0003-v02.png"
  selected:
    - "lore/media/generated/cards/ob01/ob01-0003/ob01-0003-v02.png"
outputs:
  illustration: "docs/card-assets/illustrations/ob01/ob01-0003.png"

image_generation:
  reference_images:
    - "lore/media/generated/cards/ob01/ob01-0003/ob01-0003-v02.png"
```

If the selected image should not guide a future generation, do not also list it
under `image_generation.reference_images`.
