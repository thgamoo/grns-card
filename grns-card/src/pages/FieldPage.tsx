import { useState } from "react";
import { Printer } from "lucide-react";
import fieldBoardArt from "../assets/field-board-art.png";
import sipjeFieldBg from "../assets/sipje-field-bg.png";
import { FieldBoard } from "../components/FieldBoard";
import { PaperButton } from "../components/PaperButton";
import { fieldPositionNotes } from "../content/field";

const BOARD_WIDTH_MM = 600;
const BOARD_HEIGHT_MM = 300;
const PRINT_SCALE = 0.7;
const CANVAS_SCALE = 4;

function drawCenteredText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
) {
  const lines = text.split("\n");
  context.font = `900 ${fontSize}px sans-serif`;
  context.fillStyle = "rgba(255, 255, 255, 0.92)";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = "rgba(0, 0, 0, 0.86)";
  context.shadowBlur = 5;
  context.shadowOffsetY = 2;
  lines.forEach((line, index) => {
    context.fillText(
      line,
      x + width / 2,
      y + height / 2 + (index - (lines.length - 1) / 2) * fontSize * 1.18,
    );
  });
  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
}

function drawSlot(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  borderColor: string,
  fontSize: number,
) {
  context.fillStyle = "rgba(255, 255, 255, 0.22)";
  context.strokeStyle = borderColor;
  context.lineWidth = 3;
  context.fillRect(x, y, width, height);
  context.strokeRect(x, y, width, height);
  drawCenteredText(context, label, x, y, width, height, fontSize);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export function FieldPage() {
  const [showPlacementOverlay, setShowPlacementOverlay] = useState(true);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const printField = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.alert("프린트 창을 열 수 없습니다. 팝업 차단을 확인해 주세요.");
      return;
    }

    printWindow.document.write(`<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>필드판 프린트 준비 중</title>
    <style>
      body {
        display: grid;
        min-height: 100vh;
        margin: 0;
        place-items: center;
        background: #ffffff;
        color: #111111;
        font: 900 18px sans-serif;
      }
    </style>
  </head>
  <body>필드판 프린트 준비 중...</body>
</html>`);
    printWindow.document.close();

    const unit = CANVAS_SCALE;
    const canvas = document.createElement("canvas");
    canvas.width = BOARD_WIDTH_MM * unit;
    canvas.height = BOARD_HEIGHT_MM * unit;
    const context = canvas.getContext("2d");
    if (!context) return;

    const boardImage = await loadImage(fieldBoardArt);
    context.drawImage(boardImage, 0, 0, canvas.width, canvas.height);

    const mm = (value: number) => value * unit;

    if (showPlacementOverlay) {
      for (let index = 0; index < 5; index += 1) {
        drawSlot(
          context,
          mm(80 + index * 88),
          mm(10),
          mm(88),
          mm(88),
          "야전병",
          "rgba(214, 58, 44, 0.92)",
          mm(9),
        );
      }

      for (let index = 0; index < 4; index += 1) {
        drawSlot(
          context,
          mm(124 + index * 88),
          mm(118),
          mm(88),
          mm(63),
          "문지기",
          "rgba(212, 174, 38, 0.96)",
          mm(8),
        );
      }

      drawSlot(
        context,
        mm(256),
        mm(218),
        mm(88),
        mm(63),
        "성주",
        "rgba(63, 145, 73, 0.94)",
        mm(9),
      );

      drawSlot(
        context,
        mm(8),
        mm(10),
        mm(63),
        mm(88),
        "전진\n기지",
        "rgba(255, 255, 255, 0.78)",
        mm(7),
      );
      drawSlot(
        context,
        mm(8),
        mm(114),
        mm(63),
        mm(88),
        "후방\n기지",
        "rgba(111, 57, 141, 0.9)",
        mm(7),
      );

      ["징집소", "매장지", "야생"].forEach((label, index) => {
        drawSlot(
          context,
          mm(529),
          mm(10 + index * 98),
          mm(63),
          mm(88),
          label,
          [
            "rgba(64, 102, 178, 0.94)",
            "rgba(185, 103, 35, 0.94)",
            "rgba(69, 148, 80, 0.94)",
          ][index],
          mm(7),
        );
      });
    }

    if (showGuidelines) {
      const guideX = mm(8);
      const guideY = mm(222);
      const guideWidth = mm(204);
      const guideHeight = mm(64);
      context.fillStyle = "rgba(255, 253, 247, 0.78)";
      context.strokeStyle = "rgba(255, 255, 255, 0.72)";
      context.lineWidth = 2;
      context.fillRect(guideX, guideY, guideWidth, guideHeight);
      context.strokeRect(guideX, guideY, guideWidth, guideHeight);

      [
        ["멀리건", "초기 4장 → 문지기 배치 / 1장 추가"],
        ["페이즈", "정비 → 징집 → 보급병 배치 → 전쟁 → 소강"],
        ["전투", "보급 → 공격 선언 → 매복/효과 → 힘겨루기 → 매장지"],
        ["보급", "<후방기지>에서 <전방기지>로 옮기는 행위"],
        ["징집", "<징집소>(덱)에서 <군영>(손패)으로 가져오는 행위"],
      ].forEach(([title, body], index) => {
        const y = guideY + mm(5 + index * 11);
        if (index > 0) {
          context.strokeStyle = "rgba(27, 19, 12, 0.18)";
          context.beginPath();
          context.moveTo(guideX + mm(5), y - mm(1.6));
          context.lineTo(guideX + guideWidth - mm(5), y - mm(1.6));
          context.stroke();
        }
        context.fillStyle = "#1b130c";
        context.font = `900 ${mm(2.8)}px sans-serif`;
        context.fillText(title, guideX + mm(5), y);
        context.fillStyle = "#33271b";
        context.font = `800 ${mm(2.55)}px sans-serif`;
        context.fillText(body, guideX + mm(28), y);
      });
    }

    const printImage = canvas.toDataURL("image/png");
    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>필드판 프린트</title>
    <style>
      @page { size: A3 landscape; margin: 0; }
      html,
      body {
        width: 420mm;
        height: 297mm;
        margin: 0;
        background: #ffffff;
        overflow: hidden;
      }
      img {
        display: block;
        width: ${BOARD_WIDTH_MM * PRINT_SCALE}mm;
        height: ${BOARD_HEIGHT_MM * PRINT_SCALE}mm;
      }
    </style>
  </head>
  <body>
    <img src="${printImage}" alt="필드판" />
  </body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    const printedImage = printWindow.document.querySelector("img");
    const printReady = () => printWindow.print();
    if (printedImage?.complete) {
      window.setTimeout(printReady, 100);
    } else {
      printedImage?.addEventListener(
        "load",
        () => window.setTimeout(printReady, 100),
        {
          once: true,
        },
      );
    }
  };

  const fieldButtonClass =
    "min-h-[52px] min-w-[150px] px-6 text-[clamp(0.9rem,1vw,1.02rem)] max-[760px]:flex-[1_1_180px] [&_span]:gap-2";

  return (
    <div
      className="grid min-h-[calc(100svh-74px)] gap-6 bg-cover bg-center bg-no-repeat p-[clamp(24px,4vw,46px)]"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(245, 242, 234, 0.28), rgba(245, 242, 234, 0.58) 58%, rgba(245, 242, 234, 0.72)), linear-gradient(90deg, rgba(245, 242, 234, 0.52), rgba(245, 242, 234, 0.08) 46%, rgba(17, 17, 17, 0.2)), url("${sipjeFieldBg}")`,
      }}
    >
      <section className="mx-auto flex w-[min(90vw,1440px)] items-center gap-12 max-[760px]:flex-wrap max-[760px]:gap-6 pl-5 pr-4">
          <PaperButton
            className={fieldButtonClass}
            variant={showPlacementOverlay ? "secondary" : "ghost"}
            aria-pressed={showPlacementOverlay}
            onClick={() => setShowPlacementOverlay((current) => !current)}
          >
            배치 오버레이
          </PaperButton>
          <PaperButton
            className={fieldButtonClass}
            variant={showGuidelines ? "secondary" : "ghost"}
            aria-pressed={showGuidelines}
            onClick={() => setShowGuidelines((current) => !current)}
          >
            가이드라인 얹기
          </PaperButton>
          <PaperButton className={fieldButtonClass} onClick={printField}>
            <Printer className="h-[18px] w-[18px]" />
            필드판 프린트
          </PaperButton>
      </section>

      <div className="field-screen-board">
        <FieldBoard
          showPlacementOverlay={showPlacementOverlay}
          showGuidelines={showGuidelines}
        />
      </div>

      <section
        className="mx-auto grid w-[min(90vw,1440px)] gap-3 border border-[var(--line)] bg-white/75 p-[18px] text-[var(--ink)] backdrop-blur-[2px] print:hidden max-[760px]:p-3.5"
        aria-label="필드 위치 설명"
      >
        <h3 className="m-0 text-[1.2rem]">필드 구성</h3>
        <ul className="grid list-none gap-0 p-0">
          {fieldPositionNotes.map((zone) => (
            <li
              className="grid grid-cols-[128px_minmax(0,1fr)] gap-4 border-t border-[rgba(17,17,17,0.16)] py-3 max-[760px]:grid-cols-1 max-[760px]:gap-1.5"
              key={zone.name}
            >
              <strong className="text-base font-black">{zone.name}</strong>
              <span className="text-[0.9rem] leading-[1.6] text-[#333333] [word-break:keep-all]">
                {zone.note}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
