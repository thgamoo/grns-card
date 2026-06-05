---
id: index.image-generation
type: index
title: 이미지 생성 흐름
tags:
  - lore
  - image-generation
---

# 이미지 생성 흐름

카드 일러스트는 카드 자체보다 `scene_context`를 중심으로 읽는다.

```txt
card note
  -> scene
  -> region / site / period / event
  -> faction / social groups / motifs / materials
  -> style core / style profile / visual guardrails
  -> lore/cache/image-contexts/<card>.json
  -> image brief
  -> prompt
```

## Cache First

이미지 생성 요청 전에는 카드별 캐시를 먼저 만든다.

```bash
node scripts/lore/build-image-context-cache.mjs --root lore
node scripts/lore/build-image-context-cache.mjs --root lore --card ob01-0003
```

생성 시 우선 읽는 파일은 `lore/cache/image-contexts/<serial>.json`이다.
원문 md는 캐시에 빠진 맥락을 확인하거나 캐시를 재생성할 때만 다시 읽는다.

`images.selected`는 생성 입력이 아니다. 새 생성에 참고할 이미지는
`image_generation.reference_images`에 명시한다.

## Core Rules

- [[style-core]]
- [[anti-realism]]
- [[card-illustration]]

## Style Profiles

- [[ob01]]
- [[tu01]]
- [[st01-yemaek]]
- [[st02-gaya]]
- [[st03-saro]]
- [[st04-sipje]]
- [[ex01-revealed-reverse]]

## Starter Scenes

- [[onboarding-first-gate]]
- [[world-separation-aftermath]]
