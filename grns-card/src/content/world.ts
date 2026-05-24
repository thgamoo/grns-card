export type WorldLink = {
  href: string;
  title: string;
  body: string;
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
    href: "./world/docs/timeline.md",
    title: "연표",
    body: "드러나는 이면 전후 사건",
  },
  {
    href: "./world/docs/places.md",
    title: "장소",
    body: "변경 성문과 첫 캠페인 지역",
  },
  {
    href: "./world/docs/expansion-01.md",
    title: "드러나는 이면",
    body: "첫 확장팩 배경 문서",
  },
  {
    href: "./world/fiction/prologue.md",
    title: "군웅의 발호",
    body: "서장",
  },
  {
    href: "./world/fiction/short-story-guide.md",
    title: "단편 작업 가이드",
    body: "분량, 구조, 작성 순서, 파일 관리",
    private: true,
  },
  {
    href: "./world/maps/README.md",
    title: "지도 작업",
    body: "지도",
  },
  {
    href: "./world/data/events.json",
    title: "데이터",
    body: "장소, 팩션, 사건 JSON",
  },
];
