# 괴력난신 카드 DB 운영 문서

## 목적

**괴력난신 카드 DB**는 카드 목록, 스트럭쳐 덱, 출력용 카드 이미지를 관리하기 위한 개인용 웹 도구다.

이 문서는 웹사이트 운영과 데이터 관리만 다룬다. 게임 규칙은 [룰북](./rulebook.html), 카드 설계 방향은 [카드/클래스 설계](./card-design.html)에서 관리한다.

## 로컬 실행

```bash
pnpm dev
```

개발 서버는 Node 내장 모듈만 사용하는 `server.mjs`로 실행된다. 별도 패키지 설치 없이 `pnpm dev`로 켤 수 있으며, 기본 URL은 `http://127.0.0.1:4173/index.html`이다.

## GitHub Pages 배포

`main` 브랜치에 push하면 `.github/workflows/pages.yml`이 실행되어 GitHub Pages에 배포한다.

```bash
npm run build
```

빌드 결과는 `dist`에 생성된다. 공개 페이지에는 카드 DB, 레벨 그래프, 스트럭쳐 덱, 필드 판, 세계관 허브가 분리된 HTML로 포함된다.

## 데이터 버전 관리

카드 데이터는 `./data` 디렉토리에 둔다.

- 버전 목록: `data/card-versions.json`
- 카드 DB 파일명 규칙: `data/card-[date-version].json`
- 예시: `data/card-2026-05-16-v1.json`

새 버전은 JSON 파일을 직접 생성하거나 수정해서 관리한다. 새 `card-YYYY-MM-DD-vN.json` 파일을 `data` 디렉토리에 넣고, `data/card-versions.json`에 항목을 추가하면 상단 버전 드롭다운에서 선택할 수 있다.

브라우저 보안상 웹앱이 로컬 파일을 직접 덮어쓰지는 않는다. 카드 데이터 수정은 JSON 파일을 편집하고 새 버전으로 등록하는 흐름을 기준으로 한다.

## 분리형 데이터 구조

최신 버전은 단일 JSON 대신 클래스와 팩 단위로 나눈다. `data/card-versions.json`의 `file`은 각 버전 디렉토리의 `index.json`을 가리킨다.

```text
data/card-2026-05-19-v1/
  index.json
  classes.json
  card-types.json
  expansions.json
  cards/
    base/
      goguryeo.json
      jinhan.json
      gaya.json
      mahan.json
    ex01/
      jinhan.json
      neutral.json
  decks/
    goguryeo.json
    jinhan.json
    gaya.json
    mahan.json
```

- `cards/base/*.json`: 기본 카드풀. 클래스별로 관리한다.
- `cards/ex01/*.json`: 확장팩 `드러나는 이면` 카드풀. 확장팩과 클래스별로 관리한다.
- `decks/*.json`: 스트럭쳐 덱 리스트. 기본 카드풀 교체 시 이 파일도 함께 확인한다.
- 과거 단일 JSON 버전도 계속 읽을 수 있다.

## 카드 데이터 필드

카드별 설정 설명은 `lore` 필드에 작성한다. `lore`는 카드 표면, PNG Export, 프린트에는 들어가지 않고 카드 상세 팝업에서만 표시된다.

## 출력과 이미지 내보내기

- 카드 선택 후 `PNG Export`를 누르면 해당 카드를 63mm x 88mm, 300dpi PNG로 저장한다.
- `A4 9장 Print`는 현재 필터/검색 결과를 기준으로 A4 한 장에 3열 x 3행, 총 9장씩 배치한다.
- 브라우저 인쇄 창에서 대상 프린터를 선택하거나, PDF로 저장하면 인쇄용 파일을 만들 수 있다.
- 63mm x 88mm 카드는 A4 세로 기준으로 3 x 3 배치가 물리적으로 적합하다.
- 카드 표면은 흰 배경과 검은 글씨 중심으로 구성해 흑백 프린트 환경에서도 읽히도록 한다.

## 문서 구성

| 문서 | 역할 |
|---|---|
| [문서 홈](./index.html) | 전체 문서 입구 |
| [룰북](./rulebook.html) | 준비, 페이즈, 전투, 패배 조건 |
| [키워드 정리](./keywords.html) | 카드 효과 키워드와 대괄호 표기 |
| [카드/클래스 설계](./card-design.html) | 클래스 정체성, 카드 타입, 레이아웃, 스트럭쳐 덱 |
| [카드 DB 운영 문서](./card-db-plan.html) | 로컬 실행, 배포, 데이터 버전 관리 |

## 세계관 작업 공간

세계관 설정은 `world` 디렉토리에서 카드 DB와 분리해 관리한다.

- `world/maps`: 지도 원본과 내보낸 이미지
- `world/docs`: 세계관 개요, 팩션, 장소, 연표, 확장팩 배경
- `world/fiction`: 단편 소설과 장면 조각
- `world/data`: 장소, 팩션, 사건 JSON
