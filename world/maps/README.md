# 지도

![괴력난신 세계 지도](/grns-card/world/maps/map-2026-05-30.svg)

[크게 보기](/grns-card/world/maps/)

## 수묵화 지도 스타일 적용

지도 SVG를 새로 업데이트한 뒤에는 아래 명령으로 고지도/수묵화 스타일을 다시 입힌다.

```bash
node world/maps/apply-ink-style.mjs world/maps/map-YYYY-MM-DD.svg
```

원본을 따로 보존하고 싶다면 출력 파일을 두 번째 인자로 넘긴다.

```bash
node world/maps/apply-ink-style.mjs world/maps/raw-map.svg world/maps/map-YYYY-MM-DD.svg
```

스타일 방향:

- 전체 바탕은 누런 종이색으로 둔다.
- 바다는 회색 먹 번짐처럼 어둡게 두되, 육지는 너무 밝게 날리지 않는다.
- 해안선과 국경선은 가장 진한 먹선으로 둔다.
- 강, 길, 세부 경계는 얇지만 선명하게 둔다.
- 지명은 흰 외곽선보다 종이색 외곽선을 얇게 사용해 판각 지도처럼 보이게 한다.
- 지도 파일을 교체하면 `grns-card/src/content/world.ts`의 지도 경로도 최신 파일명으로 맞춘다.

이 가이드는 작업용 문서이며 사이트 본문에는 따로 렌더링하지 않는다.
