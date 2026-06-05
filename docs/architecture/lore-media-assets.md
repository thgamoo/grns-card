# Lore Media And Card Assets

This document records how images attach to lore nodes.

## Decision

`lore/media/` is the image discovery layer for lore. It stores references,
generated candidates, and generated manifests.

`docs/card-assets/` remains the final asset delivery location used by the app.
Existing app paths should not be broken just to make Obsidian browsing nicer.

Selected images are recorded in lore note metadata. They are not moved into a
separate `selected/` folder.

`images.selected` is not read when asking for a new image. It is read only by
promotion/indexing scripts after a candidate has already been chosen.

During `grns-card/scripts/sync-data.mjs`, selected media is promoted before
`docs/` is copied into `grns-card/public`.

## Roles

- `lore/media/references/`: reference images used by prompt/image generation.
- `lore/media/generated/`: generated candidates and experiments.
- `lore/media/manifests/`: generated indexes linking images to nodes.
- `docs/card-assets/`: final game and website assets.

## Card Note Fields

Card notes can point to existing final illustrations:

```yaml
images:
  cover: "docs/card-assets/illustrations/ob01/ob01-0003.png"
  generated:
    - "lore/media/generated/cards/ob01/ob01-0003/ob01-0003-v01.png"
    - "lore/media/generated/cards/ob01/ob01-0003/ob01-0003-v02.png"
  selected:
    - "lore/media/generated/cards/ob01/ob01-0003/ob01-0003-v02.png"

image_generation:
  reference_images:
    - "lore/media/generated/cards/ob01/ob01-0003/ob01-0003-v02.png"
```

Use `outputs.illustration` for the downstream final asset path. Use `images`
for current visual attachments. Use `image_generation.reference_images` for
images that should be passed into a future generation request.

## Generation Boundary

Before image generation, build the gitignored context cache:

```bash
node scripts/lore/build-image-context-cache.mjs --root lore
node scripts/lore/build-image-context-cache.mjs --root lore --card ob01-0003
```

Read `lore/cache/image-contexts/<serial>.json` first. It contains the card note,
resolved scene/style/site/period/faction/group/motif notes, and explicit
reference images.

Do not use `images.selected` as generation input. Selection describes the result
of a previous choice. If the selected image should guide the next generation,
copy that path into `image_generation.reference_images`.

## Build Boundary

`grns-card/scripts/sync-data.mjs` runs selected-media promotion before copying
`docs/` into `grns-card/public`.

When a generated candidate should become a real card or website asset, put that
candidate path in `images.selected`. The promotion script copies it to the path
named in `outputs.illustration`.

Legacy final assets are valid selected images. If `images.selected[0]` already
equals `outputs.illustration`, promotion records it as unchanged.

## Manifests

`lore/media/manifests/image-index.json` is generated from existing files and
card data. It is the main lookup table for scripts.

`lore/media/manifests/card-assets.json` is a filtered view of card-related
assets.

Regenerate them with:

```bash
node scripts/lore/promote-selected-media.mjs
node scripts/lore/export-media-index.mjs
```

Generated manifests can be recreated and should not be hand-edited.
