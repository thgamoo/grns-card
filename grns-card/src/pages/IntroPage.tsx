type IntroPageProps = {
  cardCount: number;
  classCount: number;
  onNavigateCards: () => void;
  onNavigateRules: () => void;
};

export function IntroPage({
  cardCount,
  classCount,
  onNavigateCards,
  onNavigateRules,
}: IntroPageProps) {
  return (
    <div className="intro-view">
      <div className="intro-wash" aria-hidden="true"></div>
      <div className="intro-copy">
        <p className="eyebrow">한국형 판타지 TCG</p>
        <h1>괴력난신</h1>
        <p>
          사실 군자께서는 괴이와 용력, 반란과 귀신이 역사의 이면이라 하셨다.
        </p>
        <div className="intro-actions">
          <button type="button" onClick={onNavigateCards}>
            카드 DB
          </button>
          <button type="button" onClick={onNavigateRules}>
            룰 보기
          </button>
        </div>
      </div>
      <div className="hero-board" aria-hidden="true">
        <span className="ink-sun"></span>
        <span className="ink-peak ink-peak-a"></span>
        <span className="ink-peak ink-peak-b"></span>
        <span className="ink-peak ink-peak-c"></span>
        <span className="ink-ridge ink-ridge-a"></span>
        <span className="ink-ridge ink-ridge-b"></span>
        <span className="ink-river"></span>
        <span className="ink-forest ink-forest-a"></span>
        <span className="ink-forest ink-forest-b"></span>
      </div>
      <div className="intro-stats" aria-label="통계">
        <span>
          <strong>{cardCount || "..."}</strong> Cards
        </span>
        <span>
          <strong>{classCount || "..."}</strong> Factions
        </span>
      </div>
    </div>
  );
}
