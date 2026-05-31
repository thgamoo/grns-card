import fieldBoardArt from "../assets/field-board-art.png";
import { battlefieldSlots, gateSlots } from "../content/field";

type FieldBoardProps = {
  className?: string;
  showPlacementOverlay?: boolean;
  showGuidelines?: boolean;
};

const guidelineSections = [
  {
    title: "멀리건",
    body: "초기 4장 → 문지기 배치 / 1장 추가",
  },
  {
    title: "페이즈",
    body: "정비 → 징집 → 보급병 배치 → 전쟁 → 소강",
  },
  {
    title: "전투",
    body: "보급 → 공격 선언 → 매복/효과 → 힘겨루기 → 매장지",
  },
  {
    title: "보급",
    body: "<후방기지>에서 <전방기지>로 옮기는 행위",
  },
  {
    title: "징집",
    body: "<징집소>(덱)에서 <군영>(손패)으로 가져오는 행위",
  },
];

export function FieldBoard({
  className = "",
  showPlacementOverlay = true,
  showGuidelines = false,
}: FieldBoardProps) {
  return (
    <section
      className={`field-board-react${className ? ` ${className}` : ""}`}
      aria-label="필드 판"
    >
      <img src={fieldBoardArt} alt="" aria-hidden="true" />
      {showPlacementOverlay && (
        <>
          <section className="battlefield-zone-react" aria-label="전장">
            <div className="field-unit-slots">
              {battlefieldSlots.map((slot, index) => (
                <span key={slot.id} className={`field-soldier-${index + 1}`}>
                  야전병
                </span>
              ))}
            </div>
          </section>

          <section className="castle-zone-react" aria-label="성">
            <div className="gate-zone-react">
              <div className="field-gate-row">
                {gateSlots.map((slot) => (
                  <span key={slot.id}>문지기</span>
                ))}
              </div>
            </div>
            <div className="lord-zone-react">
              <div className="lord-slot-react">성주</div>
            </div>
          </section>

          <section className="resource-zone-react" aria-label="성 외곽 기지">
            <div className="camp-slot-react">
              <strong>
                전진
                <br />
                기지
              </strong>
            </div>
            <div className="camp-slot-react">
              <strong>
                후방
                <br />
                기지
              </strong>
            </div>
          </section>

          <section className="side-zones-react" aria-label="징집소와 매장지와 야생">
            <div>
              <strong>징집소</strong>
            </div>
            <div>
              <strong>매장지</strong>
            </div>
            <div>
              <strong>야생</strong>
            </div>
          </section>
        </>
      )}

      {showGuidelines && (
        <aside className="field-guidelines-overlay" aria-label="초보자 진행 가이드">
          <dl>
            {guidelineSections.map((section) => (
              <div key={section.title}>
                <dt>{section.title}</dt>
                <dd>{section.body}</dd>
              </div>
            ))}
          </dl>
        </aside>
      )}
    </section>
  );
}
