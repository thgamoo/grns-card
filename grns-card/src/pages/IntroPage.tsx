import inkHeroImage from "../assets/grns-ink-hero-dokkaebi-right-focus-duel.png";

type IntroPageProps = {
  onNavigateCards: () => void;
  onNavigateRules: () => void;
};

export function IntroPage({
  onNavigateCards,
  onNavigateRules,
}: IntroPageProps) {
  return (
    <div className="intro-view">
      <div className="intro-wash" aria-hidden="true"></div>
      <div className="intro-copy">
        <p className="eyebrow">한국형 판타지 TCG</p>
        <h1>괴력난신</h1>
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
        <img src={inkHeroImage} alt="" />
      </div>
    </div>
  );
}
