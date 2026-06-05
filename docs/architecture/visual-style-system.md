# Visual Style System

This document records how GRNS visual direction is split.

## Decision

Global visual direction should stay minimal. Expansion and pack identity belongs
in style profiles.

```txt
lore/visual/style-core.md
  -> minimum shared visual grammar
lore/visual/anti-realism.md
  -> global guardrail against photoreal / cinematic drift
lore/visual/style-profiles/*.md
  -> pack, expansion, faction, or scene-specific art direction
```

## Read Order

Image generation should read:

```txt
card note
  -> context.scene
  -> context.style_profile
  -> lore/visual/style-core.md
  -> lore/visual/anti-realism.md
  -> selected/reference images
```

## Current Profiles

- `style-profile.ob01`: onboarding / first gate
- `style-profile.tu01`: tutorial
- `style-profile.st01-yemaek`: Yemaek base
- `style-profile.st02-gaya`: Gaya base
- `style-profile.st03-saro`: Saro base
- `style-profile.st04-sipje`: Sipje base
- `style-profile.ex01-revealed-reverse`: first expansion

## Rule

Do not add broad shared direction to `style-core.md` if it belongs to one pack,
faction, expansion, or scene. Put it in a style profile instead.
