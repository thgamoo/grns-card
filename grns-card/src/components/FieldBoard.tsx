import { battlefieldSlots, gateSlots } from "../content/field";

export function FieldBoard({ className = "" }: { className?: string }) {
  return (
    <section
      className={`field-board-react${className ? ` ${className}` : ""}`}
      aria-label="필드 판"
    >
      <header className="field-title-react">
        <p>괴력난신 필드판</p>
      </header>

      <section className="battlefield-zone-react" aria-label="전장">
        <div className="field-zone-label">
          <strong>전장</strong>
          <span>야전병 5장 · &lt;대기&gt; 세로 / &lt;휴식&gt; 가로</span>
        </div>
        <div className="field-unit-slots">
          {battlefieldSlots.map((slot, index) => (
            <span key={slot.id} className={`field-soldier-${index + 1}`}>
              야전병 {index + 1}
            </span>
          ))}
        </div>
      </section>

      <section className="castle-zone-react" aria-label="성">
        <div className="gate-zone-react">
          <div className="field-zone-label">
            <strong>성</strong>
            <span>문지기 4</span>
          </div>
          <div className="field-gate-row">
            {gateSlots.map((slot) => (
              <span key={slot.id}>{slot.name}</span>
            ))}
          </div>
        </div>
        <div className="lord-zone-react">
          <div className="field-zone-label">
            <strong>성</strong>
            <span>성주</span>
          </div>
          <div className="lord-slot-react">성주</div>
        </div>
      </section>

      <section className="resource-zone-react" aria-label="성 외곽 기지">
        <div className="camp-slot-react">
          <strong>후방기지</strong>
          <span>보급 전 자원</span>
        </div>
        <div className="camp-slot-react">
          <strong>전진기지</strong>
          <span>야전과 이어진 보급</span>
        </div>
      </section>

      <section className="side-zones-react" aria-label="징집소와 매장지">
        <div>
          <strong>징집소</strong>
          <span>덱</span>
        </div>
        <div>
          <strong>매장지</strong>
          <span>공개 트래시</span>
        </div>
      </section>
    </section>
  );
}
