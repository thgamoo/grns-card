# Document Lifecycle

This repository now separates documents by purpose.

## Active Locations

- `lore/`: source setting notes and generation context.
- `world/`: public-facing website content.
- `docs/architecture/`: project architecture and production decisions.
- `docs/tutorials/`: tutorial implementation notes.
- `docs/card-assets/`: asset production outputs and briefs.
- `data/`: game/card data used by the app.

## Archive Policy

Do not delete old Markdown just because it is outdated. Move it to an `archive/`
folder or mark it with a preservation note when one of these is true:

- the file is empty;
- the file is a duplicate or old combined copy of smaller current documents;
- the file describes a superseded card-data version;
- the app no longer references it;
- the document is still historically useful but should not guide new work.

## Current Archive Moves

- `world/docs/overview.md` -> `world/docs/archive/overview-legacy.md`
- `world/docs/places.md` -> `world/docs/archive/places-empty.md`
- `world/docs/story-motifs.md` -> `world/docs/archive/story-motifs-empty.md`
- `world/fiction/fragments/expansion-01.md` -> `world/fiction/fragments/archive/expansion-01-empty.md`

## Known Preserved Legacy Docs

`docs/first-gate-starter.md` is already marked as a preserved pre-`tu01` /
pre-`ob01` starter draft. Keep it where it is unless a later documentation
cleanup creates a broader `docs/archive/` migration.

## Public Website Rule

If a Markdown file is referenced by `world/library/manifest.json`, do not move it
without updating the manifest and verifying the website build.
