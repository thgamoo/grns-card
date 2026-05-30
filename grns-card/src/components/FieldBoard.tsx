import fieldBoardArt from "../assets/field-board-art.png";
import { battlefieldSlots, gateSlots } from "../content/field";

export function FieldBoard({ className = "" }: { className?: string }) {
  return (
    <section
      className={`field-board-react${className ? ` ${className}` : ""}`}
      aria-label="필드 판"
    >
      <img src={fieldBoardArt} alt="" aria-hidden="true" />
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
    </section>
  );
}
