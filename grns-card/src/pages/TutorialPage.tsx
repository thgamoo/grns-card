import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  Crown,
  Dices,
  Hand,
  RotateCcw,
  Shield,
  Shuffle,
  Swords,
} from "lucide-react";

type SetupPath = "gatekeepers" | "camp" | null;

const recruitCards = ["훈련병", "척후병", "궁수", "방패병"];
const campCards = ["군영 1", "군영 2", "군영 3", "군영 4", "군영 5"];

const stepTitles = [
  "풍향 관찰",
  "성주 배치",
  "훈련병 징발",
  "문지기 선택",
  "군영 구성",
  "전쟁 준비 완료",
];

function TutorialCard({
  children,
  faceDown = false,
  active = false,
}: {
  children: string;
  faceDown?: boolean;
  active?: boolean;
}) {
  return (
    <span className={active ? "tutorial-card active" : "tutorial-card"}>
      {faceDown ? "비공개" : children}
    </span>
  );
}

function Zone({
  title,
  children,
  active = false,
  onClick,
}: {
  title: string;
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={active ? "tutorial-zone active" : "tutorial-zone"}
      type="button"
      onClick={onClick}
      disabled={!onClick}
    >
      <span>{title}</span>
      <div>{children}</div>
    </button>
  );
}

export function TutorialPage() {
  const [step, setStep] = useState(0);
  const [setupPath, setSetupPath] = useState<SetupPath>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog((current) => [message, ...current].slice(0, 5));
  };

  const reset = () => {
    setStep(0);
    setSetupPath(null);
    setLog([]);
  };

  const progress = useMemo(
    () => Math.round((step / (stepTitles.length - 1)) * 100),
    [step],
  );
  const deckCount =
    step >= 5 ? 31 : step >= 4 && setupPath === "camp" ? 35 : step >= 3 ? 36 : 40;

  const chooseWind = () => {
    setStep(1);
    addLog("가위바위보에서 이겨 선공을 가져옵니다.");
  };

  const placeLord = () => {
    setStep(2);
    addLog("성주를 비공개 상태로 성에 배치했습니다.");
  };

  const draftRecruits = () => {
    setStep(3);
    addLog("징집소에서 훈련병 4장을 징집했습니다.");
  };

  const choosePath = (path: Exclude<SetupPath, null>) => {
    setSetupPath(path);
    setStep(4);
    addLog(
      path === "gatekeepers"
        ? "징집한 4장을 문지기로 배치합니다."
        : "카드 1장을 먼저 군영으로 삼고, 다시 4장을 문지기로 배치합니다.",
    );
  };

  const finishSetup = () => {
    setStep(5);
    addLog("문지기와 군영을 갖추었습니다. 이제 첫 턴을 시작할 수 있습니다.");
  };

  const gatekeeperSlots = Array.from({ length: 4 }, (_, index) => {
    if (step < 4) return null;
    return setupPath === "gatekeepers"
      ? recruitCards[index]
      : `문지기 ${index + 1}`;
  });
  const camp = step >= 5 ? (setupPath === "gatekeepers" ? campCards : ["시작 군영"]) : [];

  return (
    <div className="tutorial-view">
      <section className="tutorial-brief">
        <div>
          <p className="eyebrow">interactive tutorial</p>
          <h2>전쟁 시작 튜토리얼</h2>
          <p>
            룰의 전쟁 준비 절차를 직접 눌러보며 익힙니다. 선공을 정하고,
            성주를 숨기고, 훈련병을 징발해 문지기와 군영을 구성하세요.
          </p>
          <div className="tutorial-callout" role="note">
            아직 만드는 중입니다. 현재는 전쟁 준비 흐름만 가볍게 체험할 수 있습니다.
          </div>
        </div>
        <button className="tutorial-reset" type="button" onClick={reset}>
          <RotateCcw />
          다시 시작
        </button>
      </section>

      <section className="tutorial-layout">
        <aside className="tutorial-panel">
          <div className="tutorial-progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="tutorial-step-count">
            {step + 1} / {stepTitles.length}
          </p>
          <h3>{stepTitles[step]}</h3>
          {step === 0 && (
            <>
              <p>먼저 풍향을 관찰합니다. 가위바위보에서 이긴 사람이 선공입니다.</p>
              <button type="button" onClick={chooseWind}>
                <Dices />
                선공 가져가기
              </button>
            </>
          )}
          {step === 1 && (
            <>
              <p>성주는 처음에 정체를 숨깁니다. 성의 중앙에 비공개로 놓으세요.</p>
              <button type="button" onClick={placeLord}>
                <Crown />
                성주 비공개 배치
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <p>징집소에서 4장을 징집합니다. 이 카드들은 문지기가 되거나, 시작 군영 선택에 쓰입니다.</p>
              <button type="button" onClick={draftRecruits}>
                <Shuffle />
                4장 징집
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <p>징집한 4장을 바로 문지기로 둘지, 군영 1장을 먼저 정하고 다시 4장을 징집할지 선택합니다.</p>
              <button type="button" onClick={() => choosePath("gatekeepers")}>
                <Shield />
                4장을 문지기로 배치
              </button>
              <button type="button" onClick={() => choosePath("camp")}>
                <Hand />
                군영 1장 먼저 선택
              </button>
            </>
          )}
          {step === 4 && (
            <>
              <p>
                {setupPath === "gatekeepers"
                  ? "문지기 4장을 배치했습니다. 이제 5장을 추가로 뽑아 군영으로 삼습니다."
                  : "시작 군영 1장을 정했습니다. 다시 4장을 징집해 문지기로 배치합니다."}
              </p>
              <button type="button" onClick={finishSetup}>
                <CheckCircle2 />
                준비 마치기
              </button>
            </>
          )}
          {step === 5 && (
            <>
              <p>전쟁 준비가 끝났습니다. 첫 턴에는 정비, 징집, 보급병 배치, 전쟁, 소강의 흐름을 따라 진행합니다.</p>
              <button type="button" onClick={reset}>
                <Swords />
                한 번 더 해보기
              </button>
            </>
          )}
        </aside>

        <div className="tutorial-board" aria-label="튜토리얼 필드">
          <Zone title="상대 성" active={step === 1} onClick={step === 1 ? placeLord : undefined}>
            <div className="tutorial-castle">
              {gatekeeperSlots.map((card, index) => (
                <TutorialCard key={index} faceDown={Boolean(card)} active={step >= 4}>
                  {card ?? "빈 문"}
                </TutorialCard>
              ))}
              <TutorialCard faceDown={step >= 2} active={step === 1 || step >= 2}>
                성주
              </TutorialCard>
            </div>
          </Zone>

          <Zone title="전장">
            <div className="tutorial-lanes">
              {Array.from({ length: 5 }, (_, index) => (
                <span key={index}>야전 {index + 1}</span>
              ))}
            </div>
          </Zone>

          <div className="tutorial-support-row">
            <Zone title="후방기지">
              <TutorialCard>보급 대기</TutorialCard>
            </Zone>
            <Zone title="전진기지">
              <TutorialCard>보급 완료</TutorialCard>
            </Zone>
          </div>

          <div className="tutorial-support-row">
            <Zone title="징집소" active={step === 2} onClick={step === 2 ? draftRecruits : undefined}>
              <strong>{deckCount}장</strong>
            </Zone>
            <Zone title="군영" active={step === 4 || step === 5}>
              <div className="tutorial-hand">
                {(step >= 3 && step < 5 ? recruitCards : camp).map((card) => (
                  <TutorialCard key={card}>{card}</TutorialCard>
                ))}
              </div>
            </Zone>
            <Zone title="매장지">
              <strong>0장</strong>
            </Zone>
          </div>
        </div>

        <aside className="tutorial-log" aria-label="튜토리얼 진행 기록">
          <h3>진행 기록</h3>
          {log.length ? (
            <ol>
              {log.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          ) : (
            <p>아직 아무 행동도 하지 않았습니다.</p>
          )}
        </aside>
      </section>
    </div>
  );
}
