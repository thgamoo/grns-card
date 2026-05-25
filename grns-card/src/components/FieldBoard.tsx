import { battlefieldSlots, gateSlots } from "../content/field";

export function FieldBoard({ className = "" }: { className?: string }) {
  return (
    <section
      className={`field-board-react${className ? ` ${className}` : ""}`}
      aria-label="필드 판"
    >
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
          <strong>전진기지</strong>
          <span>사용한 자원</span>
        </div>
        <div className="camp-slot-react">
          <strong>후방기지</strong>
          <span>보급 전 자원</span>
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

      <section className="open-army-zone-react" aria-label="발각된 군영">
        <strong>발각된 군영</strong>
        <span>공개된 카드</span>
      </section>

      <section className="black-river-zone-react" aria-label="검은 강">
        <strong>검은 강</strong>
        <span>퇴출로 죽은 카드</span>
      </section>
    </section>
  );
}
