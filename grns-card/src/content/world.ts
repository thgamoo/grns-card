export type WorldLink = {
  href: string;
  title: string;
  body: string;
  kind?: "markdown" | "image" | "timeline";
  private?: boolean;
};

export const worldLinks: WorldLink[] = [
  {
    href: "./world/docs/overview.md",
    title: "세계관 개요",
    body: "전쟁의 기본 정서와 핵심 질문",
  },
  {
    href: "./world/docs/story-motifs.md",
    title: "단편 모티프",
    body: "팩션별 사건 모티프와 단편 씨앗",
    private: true,
  },
  {
    href: "./world/docs/factions.md",
    title: "팩션",
    body: "예맥, 사로국, 가락, 십제, 중립",
  },
  {
    href: "./world/maps/map-2026-05-24.svg",
    title: "지도",
    body: "지도",
    kind: "image",
  },
  {
    href: "./world/data/timeline.json",
    title: "연표",
    body: "드러나는 이면 전후 사건",
    kind: "timeline",
  },
  {
    href: "./world/fiction/prologue.md",
    title: "대변혁 이후",
    body: "서장",
  },
  {
    href: "./world/docs/expansion-01.md",
    title: "드러나는 이면",
    body: "첫 확장팩 배경 문서",
  },
  {
    href: "./world/fiction/short-story-guide.md",
    title: "단편 작업 가이드",
    body: "분량, 구조, 작성 순서, 파일 관리",
    private: true,
  },
];
