---
id: index.media
type: index
title: Media Index
status: active
tags:
  - lore
  - media
---

# Media Index

Use `lore/media/manifests/image-index.json` to find every indexed image.

Use `lore/media/manifests/card-assets.json` to find final card illustrations
that are connected to card data.

## Current Media Roots

- [[Lore Media]]
- `docs/card-assets/illustrations/`
- `docs/card-assets/deck-banners/`
- `docs/card-assets/ui/`
- `docs/card-assets/common/`

## Regenerate

```bash
node scripts/lore/promote-selected-media.mjs
node scripts/lore/export-media-index.mjs
```
