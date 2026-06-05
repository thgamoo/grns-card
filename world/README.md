# World

`world/` is the public-facing projection of the GRNS setting. It contains the
cleaned documents, maps, and small data files that the website can display.

The source-of-truth setting workspace lives in `lore/`. Use `lore/` for
Obsidian notes, scene context, visual rules, relationship extraction, and graph
exports. Use `world/` only after a note has been edited into something that can
be shown to readers.

## Directory Roles

- `docs/`: current public Markdown documents used by the website archive.
- `stories/`: short public story summaries grouped by product/story section.
- `fiction/`: longer reader-facing prose and fragments.
- `maps/`: public map assets plus the current map styling helper.
- `public-data/`: small JSON projections for website use.
- `library/`: website archive manifest and display metadata.
- `data/`: legacy public data location. Prefer `public-data/` for new work.
- `docs/archive/`: legacy, duplicate, or empty Markdown kept for traceability.

## Flow

```txt
lore/
  -> editorial pass
world/
  -> sync-data.mjs
grns-card/public/world/
```

Keep world files concise and display-oriented. If a note explains why something
exists, how it relates to other entities, or how it should guide image
generation, it probably belongs in `lore/` first.
