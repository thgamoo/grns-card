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
      <div className="intro-copy">
        <p className="eyebrow">한국형 판타지 TCG</p>
        <h1>갈래누리</h1>
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
        <span className="lane north"></span>
        <span className="lane south"></span>
        <span className="lane east"></span>
        <span className="lane west"></span>
        <span className="lord">城主</span>
        <span className="gate gate-a"></span>
        <span className="gate gate-b"></span>
        <span className="gate gate-c"></span>
        <span className="gate gate-d"></span>
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
