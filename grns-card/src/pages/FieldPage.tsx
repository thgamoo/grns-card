import { Printer } from "lucide-react";
import { FieldBoard } from "../components/FieldBoard";
import { fieldPositionNotes } from "../content/field";

export function FieldPage() {
  return (
    <div className="field-view">
      <section className="field-hero">
        <div>
          <p className="eyebrow">play field</p>
          <h2>필드 판</h2>
        </div>
        <button type="button" onClick={() => window.print()}>
          <Printer />
          필드판 프린트
        </button>
      </section>

      <div className="field-screen-board">
        <FieldBoard />
      </div>

      <section className="field-position-notes" aria-label="필드 위치 설명">
        <h3>필드 구성</h3>
        <ul>
          {fieldPositionNotes.map((zone) => (
            <li key={zone.name}>
              <strong>{zone.name}</strong>
              <span>{zone.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="field-print-pages" aria-hidden="true">
        <div className="field-print-page">
          <div className="field-print-slice">
            <FieldBoard />
          </div>
        </div>
      </div>
    </div>
  );
}
