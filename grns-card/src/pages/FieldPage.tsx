import { Printer } from "lucide-react";
import { FieldBoard } from "../components/FieldBoard";
import { fieldPositionNotes } from "../content/field";

const fieldPrintSlices = [
  "field-print-page-r1-c1",
  "field-print-page-r1-c2",
  "field-print-page-r1-c3",
  "field-print-page-r2-c1",
  "field-print-page-r2-c2",
  "field-print-page-r2-c3",
];

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

      <section className="field-position-notes" aria-label="필드 위치 설명">
        {fieldPositionNotes.map((zone) => (
          <article key={zone.name}>
            <strong>{zone.name}</strong>
            <p>{zone.note}</p>
          </article>
        ))}
      </section>

      <div className="field-screen-board">
        <FieldBoard />
      </div>

      <div className="field-print-pages" aria-hidden="true">
        {fieldPrintSlices.map((slice) => (
          <div key={slice} className={`field-print-page ${slice}`}>
            <div className="field-print-slice">
              <FieldBoard />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
