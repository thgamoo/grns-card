import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { StepBack } from "lucide-react";

type ZoneId =
  | "hand"
  | "mulligan"
  | "battlefield"
  | "gate"
  | "rear"
  | "front"
  | "grave"
  | "recruit"
  | "opponentLord";

type Phase =
  | "intro"
  | "tour"
  | "coin"
  | "mulliganIntro"
  | "mulligan"
  | "opponentTurn"
  | "playerTurn"
  | "victory";

type CardModel = {
  id: string;
  name: string;
  zone: ZoneId;
  owner: "player" | "opponent";
  deckIndex: number;
  exhausted?: boolean;
};

type LogEntry = {
  id: string;
  icon: string;
  title: string;
  detail: string;
  snapshot?: EngineSnapshot;
};

type EngineSnapshot = Omit<EngineState, "logs"> & {
  logs: LogEntry[];
};

type Campaign = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  firstPlayer: string;
  opponentLord: string;
  playerDeck: string[];
  opponentDeck: string[];
};

type EngineState = {
  cards: CardModel[];
  selectedCardId: string | null;
  phase: Phase;
  turn: "player" | "opponent";
  turnNumber: number;
  logs: LogEntry[];
  activeLogId: string | null;
  turnBanner: string;
  opponentBubble: string;
  animatingCardIds: string[];
  tourIndex: number;
  coinFlipping: boolean;
  victory: boolean;
  opponentLordPower: number;
  playerTurnDraws: number;
  turnPhaseIndex: number;
  cardModalId: string | null;
};

const turnPhaseNames = ["정비페이즈", "징집페이즈", "보급배치페이즈", "전쟁페이즈", "소강페이즈"];

const campaigns: Campaign[] = [
  {
    id: "one-day-wolf",
    number: 1,
    title: "하룻 이리",
    subtitle: "게임 준비 및 멀리건",
    firstPlayer: "나: 후공",
    opponentLord: "하룻 이리 1/2",
    opponentDeck: ["징집소 지키는 이리 x1"],
    playerDeck: [
      "문지기 여우",
      "문지기 고양이",
      "문지기 고양이",
      "떠돌이 이리",
      "온순한 이리",
      "문지기 고양이",
      "문지기 여우",
      "문지기 여우",
      "떠돌이 이리",
      "온순한 이리",
      "새끼 이리",
      "징집소 지키는 이리",
    ],
  },
  {
    id: "peace-bear",
    number: 2,
    title: "평화주의 곰",
    subtitle: "기지 키워드",
    firstPlayer: "나: 선공",
    opponentLord: "평화주의 곰 2/3",
    opponentDeck: ["징집소 지키는 이리 x1"],
    playerDeck: [
      "새끼 이리",
      "문지기 고양이",
      "북방 사냥꾼",
      "북방 덫 개발자",
      "북방마비산 제조사",
      "문지기 고양이",
      "새끼 이리",
      "북방 사냥꾼",
      "위협용 거대 우리",
      "징집소 지키는 이리",
    ],
  },
  {
    id: "betrayal-tiger",
    number: 3,
    title: "배신 범",
    subtitle: "공격, 전투광, 정복 승리",
    firstPlayer: "나: 선공",
    opponentLord: "배신 범 3/4",
    opponentDeck: ["징집소 지키는 이리 x1"],
    playerDeck: [
      "문지기 고양이",
      "문지기 여우",
      "북방 덫 개발자",
      "어슬렁 거리는 산군",
      "북방마비산 제조사",
      "북방 사냥꾼",
      "광폭한 거대 고양이",
      "쓰디 쓴 쑥떡",
    ],
  },
  {
    id: "fox-entourage",
    number: 4,
    title: "호가호위 여우",
    subtitle: "출정, 희생, 단말마",
    firstPlayer: "나: 선공",
    opponentLord: "호가호위 여우 4/5",
    opponentDeck: ["징집소 지키는 이리 x1"],
    playerDeck: [
      "미래를 뒤트는 까마귀",
      "산중호걸 호랑님",
      "문지기 고양이",
      "문지기 여우",
      "배고픈 사냥꾼",
      "미래를 뒤트는 까마귀",
      "문지기 고양이",
      "문지기 여우",
      "산중호걸 호랑님",
      "쓰디 쓴 쑥떡",
    ],
  },
];

function initialState(campaign: Campaign): EngineState {
  return {
    cards: campaign.playerDeck.map((name, index) => ({
      id: `${campaign.id}-card-${index}`,
      name,
      owner: "player",
      deckIndex: index,
      zone: "recruit",
    })),
    selectedCardId: null,
    phase: "intro",
    turn: campaign.firstPlayer.includes("후공") ? "opponent" : "player",
    turnNumber: 0,
    logs: [
      {
        id: "log-start",
        icon: "始",
        title: "대기",
        detail: "튜토리얼 시작 버튼을 누르면 초기 징집과 턴 전환이 시작됩니다.",
      },
    ],
    activeLogId: null,
    turnBanner: "",
    opponentBubble: "",
    animatingCardIds: [],
    tourIndex: 0,
    coinFlipping: false,
    victory: false,
    opponentLordPower: Number(campaign.opponentLord.match(/(\d+)\/\d+/)?.[1] ?? 4),
    playerTurnDraws: 0,
    turnPhaseIndex: 0,
    cardModalId: null,
  };
}

const tourSteps = [
  {
    zone: "recruit" as const,
    title: "징집소",
    detail: "덱입니다. 위에서부터 순서대로 카드를 가져오며, 차례 시작마다 보통 2장을 군영으로 가져옵니다.",
  },
  {
    zone: "hand" as const,
    title: "군영",
    detail: "손패입니다. 출정하거나 보급으로 쓰기 전 카드가 머무는 곳입니다.",
  },
  {
    zone: "gate" as const,
    title: "문지기",
    detail: "게임 시작 때 성 앞에 가로로 배치하는 수비 카드입니다.",
  },
  {
    zone: "opponentLord" as const,
    title: "성주",
    detail: "각 플레이어의 핵심 카드입니다. 이번 튜토리얼에서는 시작 절차를 마치면 상대 성주가 패배합니다.",
  },
];

function snapshot(state: EngineState): EngineSnapshot {
  return { ...state, cards: state.cards.map((card) => ({ ...card })), logs: [...state.logs] };
}

function sortByDeckOrder(cards: CardModel[]) {
  return [...cards].sort((a, b) => a.deckIndex - b.deckIndex);
}

function shortCardName(name: string) {
  return name.replace(/\s*[—-].*$/, "").replace(/\s+x\d+$/, "");
}

function cardSigil(name: string) {
  if (name.includes("호랑") || name.includes("산군") || name.includes("범")) return "虎";
  if (name.includes("곰")) return "熊";
  if (name.includes("여우")) return "狐";
  if (name.includes("고양이")) return "猫";
  if (name.includes("이리")) return "狼";
  if (name.includes("까마귀")) return "烏";
  if (name.includes("사냥꾼")) return "獵";
  return "怪";
}

function cardPower(name: string) {
  if (name.includes("광폭한")) return 3;
  if (name.includes("산군")) return 4;
  if (name.includes("사냥꾼")) return 2;
  if (name.includes("까마귀")) return 0;
  return Math.max(0, name.length % 4);
}

function zoneTitle(zone: ZoneId) {
  const titles: Record<ZoneId, string> = {
    hand: "군영",
    mulligan: "초기 선택",
    battlefield: "전장",
    gate: "문지기",
    rear: "후방기지",
    front: "전진기지",
    grave: "매장지",
    recruit: "징집소",
    opponentLord: "상대 성주",
  };
  return titles[zone];
}

function logIcon(zone: ZoneId) {
  const icons: Record<ZoneId, string> = {
    hand: "軍",
    mulligan: "初",
    battlefield: "戰",
    gate: "門",
    rear: "後",
    front: "前",
    grave: "葬",
    recruit: "徵",
    opponentLord: "主",
  };
  return icons[zone];
}

function drawTop(cards: CardModel[], count: number, targetZone: ZoneId) {
  const recruitCards = sortByDeckOrder(cards.filter((card) => card.zone === "recruit"));
  const drawnCards = recruitCards.slice(0, count);
  const drawnIds = new Set(drawnCards.map((card) => card.id));
  return {
    drawnCards,
    cards: cards.map((card) => (drawnIds.has(card.id) ? { ...card, zone: targetZone } : card)),
  };
}

function recruitTopCard(cards: CardModel[]) {
  return sortByDeckOrder(cards.filter((card) => card.zone === "recruit"))[0];
}

function isRecruitGuard(card?: CardModel) {
  return Boolean(card?.name.includes("징집소 지키는 이리"));
}

function TutorialCard({
  card,
  selected,
  drawing = false,
  drawIndex = 0,
  horizontal = false,
  onClick,
}: {
  card: CardModel;
  selected: boolean;
  drawing?: boolean;
  drawIndex?: number;
  horizontal?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`tabletop-card${selected ? " selected" : ""}${drawing ? " drawing" : ""}${horizontal ? " horizontal" : ""}`}
      style={
        {
          "--draw-index": drawIndex,
          animationDelay: drawing ? `${Math.max(drawIndex, 0) * 80}ms` : undefined,
        } as CSSProperties
      }
      type="button"
      onClick={onClick}
    >
      <span className="tabletop-card-cost">{card.name.length % 4}</span>
      <span className="tabletop-card-art">{cardSigil(card.name)}</span>
      <strong>{shortCardName(card.name)}</strong>
      <span className="tabletop-card-power">{cardPower(card.name)}</span>
    </button>
  );
}

function RecruitStackZone({
  cards,
  onClick,
  label = "징집소",
  tourActive = false,
}: {
  cards: CardModel[];
  onClick: () => void;
  label?: string;
  tourActive?: boolean;
}) {
  const orderedCards = sortByDeckOrder(cards);
  const topCard = orderedCards[0];

  return (
    <button
      className={`tabletop-zone tabletop-zone-recruit tabletop-recruit-stack${tourActive ? " tour-highlight" : ""}`}
      type="button"
      onClick={onClick}
    >
      <span className="tabletop-zone-title">{label}</span>
      <div className="recruit-stack-visual" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <strong>{orderedCards.length}장</strong>
      <em>{topCard ? `맨 위: ${shortCardName(topCard.name)}` : "비어 있음"}</em>
    </button>
  );
}

function ZoneSlot({
  zone,
  cards,
  active,
  tourActive = false,
  selectedCardId,
  animatingCardIds,
  slots = 0,
  onClick,
  onCardClick,
}: {
  zone: ZoneId;
  cards: CardModel[];
  active: boolean;
  tourActive?: boolean;
  selectedCardId: string | null;
  animatingCardIds: string[];
  slots?: number;
  onClick: () => void;
  onCardClick: (card: CardModel) => void;
}) {
  const slotCount = Math.max(slots, cards.length);

  return (
    <button
      className={`tabletop-zone tabletop-zone-${zone}${active ? " active" : ""}${tourActive ? " tour-highlight" : ""}`}
      type="button"
      onClick={onClick}
    >
      <span className="tabletop-zone-title">{zoneTitle(zone)}</span>
      <div className="tabletop-zone-cards">
        {slotCount > 0 ? (
          Array.from({ length: slotCount }, (_, index) => {
            const card = cards[index];
            return (
              <span
                key={card?.id ?? `${zone}-slot-${index}`}
                className={`tabletop-zone-slot${card ? " filled" : ""}${card?.id === selectedCardId ? " selected" : ""}${card && animatingCardIds.includes(card.id) ? " drawing" : ""}`}
                role={card ? "button" : undefined}
                tabIndex={card ? 0 : undefined}
                onClick={(event) => {
                  if (!card) return;
                  event.stopPropagation();
                  onCardClick(card);
                }}
                onKeyDown={(event) => {
                  if (!card) return;
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  event.stopPropagation();
                  onCardClick(card);
                }}
              >
                {card ? shortCardName(card.name) : "빈 칸"}
              </span>
            );
          })
        ) : (
          <em>빈 슬롯</em>
        )}
      </div>
    </button>
  );
}

export function TutorialPage() {
  const [campaignIndex, setCampaignIndex] = useState(0);
  const campaign = campaigns[campaignIndex];
  const [state, setState] = useState<EngineState>(() => initialState(campaign));
  const selectedCard = state.cards.find((card) => card.id === state.selectedCardId);
  const zones = useMemo(() => {
    return {
      hand: sortByDeckOrder(state.cards.filter((card) => card.zone === "hand")),
      mulligan: sortByDeckOrder(state.cards.filter((card) => card.zone === "mulligan")),
      battlefield: sortByDeckOrder(state.cards.filter((card) => card.zone === "battlefield")),
      gate: sortByDeckOrder(state.cards.filter((card) => card.zone === "gate")),
      rear: sortByDeckOrder(state.cards.filter((card) => card.zone === "rear")),
      front: sortByDeckOrder(state.cards.filter((card) => card.zone === "front")),
      grave: sortByDeckOrder(state.cards.filter((card) => card.zone === "grave")),
      recruit: sortByDeckOrder(state.cards.filter((card) => card.zone === "recruit")),
    };
  }, [state.cards]);

  const pushLog = (
    current: EngineState,
    icon: string,
    title: string,
    detail: string,
    before?: EngineSnapshot,
  ): LogEntry[] => [
    {
      id: `log-${Date.now()}-${current.logs.length}`,
      icon,
      title,
      detail,
      snapshot: before,
    },
    ...current.logs,
  ].slice(0, 18);

  const resetCampaign = (nextIndex = campaignIndex) => {
    const nextCampaign = campaigns[nextIndex];
    setCampaignIndex(nextIndex);
    setState(initialState(nextCampaign));
  };

  const showBanner = (text: string) => {
    setState((current) => ({ ...current, turnBanner: text }));
    window.setTimeout(() => {
      setState((current) => ({ ...current, turnBanner: "" }));
    }, 950);
  };

  const drawToMulligan = () => {
    setState((current) => {
      if (current.phase !== "mulliganIntro") return current;
      const before = snapshot(current);
      const { cards, drawnCards } = drawTop(current.cards, 4, "mulligan");
      return {
        ...current,
        cards,
        phase: "mulligan",
        turn: "player",
        turnNumber: 1,
        animatingCardIds: drawnCards.map((card) => card.id),
        logs: pushLog(
          current,
          "徵",
          "초기 4장",
          `${drawnCards.map((card) => shortCardName(card.name)).join(", ")}을 징집소 위에서 공개했습니다.`,
          before,
        ),
      };
    });
    window.setTimeout(() => {
      setState((current) => ({ ...current, animatingCardIds: [] }));
    }, 520);
  };

  const startTutorial = () => {
    setState((current) => ({ ...current, phase: "tour", tourIndex: 0 }));
  };

  const advanceTour = () => {
    if (state.tourIndex < tourSteps.length - 1) {
      setState((current) => ({ ...current, tourIndex: current.tourIndex + 1 }));
      return;
    }

    setState((current) => ({ ...current, phase: "coin", coinFlipping: true }));
    window.setTimeout(() => {
      setState((current) => ({ ...current, coinFlipping: false }));
      window.setTimeout(() => {
        setState((current) => ({ ...current, phase: "mulliganIntro" }));
      }, 520);
    }, 1250);
  };

  const placeInitialGates = (mode: "gate-first" | "army-first") => {
    setState((current) => {
      if (current.phase !== "mulligan") return current;
      const before = snapshot(current);
      const candidates = sortByDeckOrder(current.cards.filter((card) => card.zone === "mulligan"));
      let nextCards = current.cards;
      let gateCards: CardModel[];
      let handCards: CardModel[];

      if (mode === "gate-first") {
        const gateIds = new Set(candidates.slice(0, 4).map((card) => card.id));
        nextCards = nextCards.map((card) => (gateIds.has(card.id) ? { ...card, zone: "gate" } : card));
        const drawn = drawTop(nextCards, 5, "hand");
        nextCards = drawn.cards;
        gateCards = candidates.slice(0, 4);
        handCards = drawn.drawnCards;
      } else {
        const candidateIds = new Set(candidates.map((card) => card.id));
        const oneMore = drawTop(nextCards, 1, "hand");
        nextCards = oneMore.cards.map((card) => (candidateIds.has(card.id) ? { ...card, zone: "hand" } : card));
        const gates = drawTop(nextCards, 4, "gate");
        nextCards = gates.cards;
        gateCards = gates.drawnCards;
        handCards = [...candidates, ...oneMore.drawnCards];
      }

      return {
        ...current,
        cards: nextCards,
        phase: "opponentTurn",
        selectedCardId: null,
        animatingCardIds: [...gateCards, ...handCards].map((card) => card.id),
        logs: pushLog(
          current,
          "門",
          mode === "gate-first" ? "문지기 배치" : "군영 선택",
          mode === "gate-first"
            ? "공개된 4장을 문지기로 가로 배치하고 5장을 군영으로 가져왔습니다."
            : "공개된 4장과 추가 1장을 군영으로 쓰고, 다음 4장을 문지기로 배치했습니다.",
          before,
        ),
      };
    });
    window.setTimeout(() => {
      setState((current) => ({ ...current, animatingCardIds: [] }));
      beginOpponentTurn();
    }, 520);
  };

  const beginOpponentTurn = () => {
    showBanner("상대턴");
    setState((current) => ({ ...current, opponentBubble: "그르릉..." }));
    window.setTimeout(() => {
      setState((current) => ({ ...current, opponentBubble: "" }));
      beginPlayerTurn();
    }, 1900);
  };

  const beginPlayerTurn = () => {
    showBanner("나의턴");
    window.setTimeout(() => {
      setState((current) => {
        const topCard = recruitTopCard(current.cards);
        const shouldSkipRecruit = isRecruitGuard(topCard);
        const before = snapshot(current);
        return {
          ...current,
          phase: shouldSkipRecruit ? "victory" : "playerTurn",
          turn: "player",
          turnNumber: current.turnNumber + 1,
          playerTurnDraws: 0,
          turnPhaseIndex: shouldSkipRecruit ? 2 : 1,
          victory: shouldSkipRecruit,
          opponentLordPower: shouldSkipRecruit ? 0 : current.opponentLordPower,
          logs: shouldSkipRecruit
            ? pushLog(
                current,
                "徵",
                "징집페이즈 생략",
                "징집소 지키는 이리가 맨 위에 있어 징집페이즈를 생략했습니다.",
                before,
              )
            : current.logs,
        };
      });
    }, 620);
  };

  const selectCard = (card: CardModel) => {
    setState((current) => ({
      ...current,
      selectedCardId: card.owner === "player" ? card.id : current.selectedCardId,
      cardModalId: card.owner === "player" ? card.id : current.cardModalId,
    }));
  };

  const closeCardModal = () => {
    setState((current) => ({ ...current, cardModalId: null }));
  };

  const moveSelectedTo = (targetZone: ZoneId) => {
    if (!selectedCard || selectedCard.zone !== "hand") return;
    if (!["battlefield", "gate", "rear", "front", "grave"].includes(targetZone)) return;
    if (targetZone === "gate" && !selectedCard.name.includes("문지기")) return;

    setState((current) => {
      const before = snapshot(current);
      return {
        ...current,
        cards: current.cards.map((card) =>
          card.id === selectedCard.id ? { ...card, zone: targetZone } : card,
        ),
        selectedCardId: null,
        logs: pushLog(
          current,
          logIcon(targetZone),
          zoneTitle(targetZone),
          `${shortCardName(selectedCard.name)}을(를) ${zoneTitle(targetZone)}에 놓았습니다.`,
          before,
        ),
      };
    });
  };

  const drawOneFromRecruit = () => {
    setState((current) => {
      if (current.phase !== "playerTurn") return current;
      if (current.phase === "playerTurn" && current.playerTurnDraws >= 2) return current;
      const before = snapshot(current);
      const topCard = recruitTopCard(current.cards);
      if (isRecruitGuard(topCard)) {
        return {
          ...current,
          phase: "victory",
          turnPhaseIndex: 2,
          victory: true,
          opponentLordPower: 0,
          logs: pushLog(
            current,
            "徵",
            "징집페이즈 생략",
            "징집소 지키는 이리가 맨 위에 있어 남은 징집을 생략했습니다.",
            before,
          ),
        };
      }
      const { cards, drawnCards } = drawTop(current.cards, 1, "hand");
      if (drawnCards.length === 0) return current;
      const nextDrawCount = current.phase === "playerTurn" ? current.playerTurnDraws + 1 : current.playerTurnDraws;
        return {
          ...current,
          cards,
          playerTurnDraws: nextDrawCount,
          turnPhaseIndex: nextDrawCount >= 2 ? 2 : 1,
          animatingCardIds: drawnCards.map((card) => card.id),
        logs: pushLog(
          current,
          "徵",
          current.phase === "playerTurn" ? `${nextDrawCount}/2 징집` : "1장 징집",
          `${shortCardName(drawnCards[0].name)}을(를) 군영으로 가져왔습니다.`,
          before,
        ),
      };
    });
    window.setTimeout(() => {
      setState((current) => ({ ...current, animatingCardIds: [] }));
    }, 520);
    window.setTimeout(() => {
      setState((current) => {
        if (current.phase !== "playerTurn" || current.playerTurnDraws < 2 || current.victory) return current;
        return {
          ...current,
          phase: "victory",
          victory: true,
          opponentLordPower: 0,
          logs: pushLog(
            current,
            "勝",
            "승리",
            "직접 2장을 징집했습니다. 하룻 이리가 패배합니다.",
            snapshot(current),
          ),
        };
      });
    }, 760);
  };

  const restoreLog = (entry: LogEntry) => {
    if (!entry.snapshot) return;
    setState({ ...entry.snapshot, activeLogId: null });
  };

  const activeTourZone = state.phase === "tour" ? tourSteps[state.tourIndex].zone : null;
  const shouldGuideDraw = state.phase === "playerTurn" && state.playerTurnDraws < 2;
  const expandedCard = state.cardModalId ? state.cards.find((card) => card.id === state.cardModalId) : null;
  const coinResultFace = campaign.firstPlayer.includes("후공") ? "後" : "先";

  return (
    <div className="tutorial-view">
      <section className="tutorial-campaign-tabs" aria-label="튜토리얼 캠페인 선택">
        {campaigns.map((item, index) => (
          <button
            key={item.id}
            className={index === campaignIndex ? "active" : ""}
            type="button"
            onClick={() => resetCampaign(index)}
          >
            <span>{item.number}</span>
            <strong>{item.title}</strong>
            <em>{item.subtitle}</em>
          </button>
        ))}
      </section>

      <section className="tabletop-layout tabletop-layout-full">
        <div className="tabletop-engine grns-field-engine">
          {state.phase === "intro" && (
            <div className="tutorial-start-overlay">
              <div className="tutorial-start-modal">
                <p className="eyebrow">tutorial {campaign.number}</p>
                <h2>{campaign.title}</h2>
                <p>{campaign.subtitle}</p>
                <button type="button" onClick={startTutorial}>
                  튜토리얼 {campaign.number} 시작
                </button>
              </div>
            </div>
          )}

          {state.phase === "tour" && (
            <div className={`tour-overlay tour-focus-${tourSteps[state.tourIndex].zone}`}>
              <div className="tour-card">
                <p className="eyebrow">field tour</p>
                <h2>{tourSteps[state.tourIndex].title}</h2>
                <p>{tourSteps[state.tourIndex].detail}</p>
                <button type="button" onClick={advanceTour}>
                  {state.tourIndex === tourSteps.length - 1 ? "코인플립으로" : "다음"}
                </button>
              </div>
            </div>
          )}

          {state.phase === "coin" && (
            <div className="coin-flip-overlay">
              <div
                className={`coin-token${state.coinFlipping ? " flipping" : ""}`}
                style={
                  {
                    "--coin-result-rotation": coinResultFace === "後" ? "900deg" : "720deg",
                  } as CSSProperties
                }
              >
                <span>先</span>
                <span>後</span>
              </div>
              <strong>{campaign.firstPlayer}</strong>
            </div>
          )}

          {state.phase === "mulliganIntro" && (
            <div className="tutorial-modal-overlay">
              <div className="tutorial-guide-modal">
                <p className="eyebrow">mulligan</p>
                <h2>멀리건</h2>
                <p>
                  게임 시작 전에 징집소 위에서 4장을 공개합니다. 이 4장을 먼저 문지기로 세울지,
                  군영으로 사용할지 선택하게 됩니다.
                </p>
                <button type="button" onClick={drawToMulligan}>
                  4장 공개하기
                </button>
              </div>
            </div>
          )}

          {shouldGuideDraw && (
            <div className="draw-guide-overlay">
              <div className="draw-guide-card">
                <p className="eyebrow">나의 턴 · {turnPhaseNames[state.turnPhaseIndex]}</p>
                <h2>징집 {state.playerTurnDraws}/2</h2>
                <p>내 징집소를 클릭해서 카드를 2장 군영으로 가져오세요.</p>
              </div>
            </div>
          )}

          {state.turnBanner && <div className="turn-banner">{state.turnBanner}</div>}

          <div className="tabletop-opponent">
            <RecruitStackZone
              cards={campaign.opponentDeck.map((name, index) => ({
                id: `${campaign.id}-opponent-${index}`,
                name,
                zone: "recruit",
                owner: "opponent",
                deckIndex: index,
              }))}
              onClick={() => undefined}
              label="상대 징집소"
            />
            <button
              className={`tabletop-lord opponent-lord${state.victory ? " shattered" : ""}${activeTourZone === "opponentLord" ? " tour-highlight" : ""}`}
              type="button"
              onClick={() => undefined}
            >
              <span>상대 성주</span>
              <strong>{campaign.opponentLord}</strong>
              <em>힘 {state.opponentLordPower}</em>
              {state.opponentBubble && <b className="opponent-speech">{state.opponentBubble}</b>}
            </button>
            <ZoneSlot
              zone="grave"
              cards={[]}
              active={false}
              tourActive={false}
              selectedCardId={state.selectedCardId}
              animatingCardIds={state.animatingCardIds}
              onClick={() => undefined}
              onCardClick={selectCard}
            />
          </div>

          <div className="grns-field-main">
            <ZoneSlot
              zone="battlefield"
              cards={zones.battlefield}
              active={Boolean(selectedCard && selectedCard.zone === "hand")}
              tourActive={false}
              selectedCardId={state.selectedCardId}
              animatingCardIds={state.animatingCardIds}
              slots={5}
              onClick={() => moveSelectedTo("battlefield")}
              onCardClick={selectCard}
            />
            <ZoneSlot
              zone="gate"
              cards={zones.gate}
              active={Boolean(selectedCard?.zone === "hand" && selectedCard.name.includes("문지기"))}
              tourActive={activeTourZone === "gate"}
              selectedCardId={state.selectedCardId}
              animatingCardIds={state.animatingCardIds}
              slots={4}
              onClick={() => moveSelectedTo("gate")}
              onCardClick={selectCard}
            />
            <button className="tabletop-lord player-lord" type="button" onClick={() => undefined}>
              <span>내 성주</span>
              <strong>계시를 받은 범</strong>
              <em>{campaign.firstPlayer}</em>
            </button>
          </div>

          <div className="tabletop-camps">
            <ZoneSlot
              zone="front"
              cards={zones.front}
              active={Boolean(selectedCard?.zone === "hand")}
              tourActive={false}
              selectedCardId={state.selectedCardId}
              animatingCardIds={state.animatingCardIds}
              onClick={() => moveSelectedTo("front")}
              onCardClick={selectCard}
            />
            <ZoneSlot
              zone="rear"
              cards={zones.rear}
              active={Boolean(selectedCard?.zone === "hand")}
              tourActive={false}
              selectedCardId={state.selectedCardId}
              animatingCardIds={state.animatingCardIds}
              onClick={() => moveSelectedTo("rear")}
              onCardClick={selectCard}
            />
          </div>

          <div className="tabletop-side-stacks">
            <ZoneSlot
              zone="grave"
              cards={zones.grave}
              active={Boolean(selectedCard?.zone === "hand")}
              tourActive={false}
              selectedCardId={state.selectedCardId}
              animatingCardIds={state.animatingCardIds}
              onClick={() => moveSelectedTo("grave")}
              onCardClick={selectCard}
            />
            <RecruitStackZone
              cards={zones.recruit}
              onClick={drawOneFromRecruit}
              label="내 징집소"
              tourActive={activeTourZone === "recruit" || shouldGuideDraw}
            />
          </div>

          {zones.mulligan.length > 0 && (
            <section className="mulligan-choice-row" aria-label="초기 멀리건 선택">
              <div className="mulligan-cards">
                {zones.mulligan.map((card) => (
                  <TutorialCard
                    key={card.id}
                    card={card}
                    selected={false}
                    drawing={state.animatingCardIds.includes(card.id)}
                    drawIndex={state.animatingCardIds.indexOf(card.id)}
                    onClick={() => undefined}
                  />
                ))}
              </div>
              <div className="mulligan-actions">
                <button type="button" onClick={() => placeInitialGates("gate-first")}>
                  문지기 배치
                </button>
                <button type="button" onClick={() => placeInitialGates("army-first")}>
                  군영으로 사용
                </button>
              </div>
            </section>
          )}

          <section className={`tabletop-hand${activeTourZone === "hand" ? " tour-highlight" : ""}`} aria-label="군영">
            {zones.hand.length === 0 ? (
              <p>군영 비어 있음</p>
            ) : (
              zones.hand.map((card) => (
                <TutorialCard
                  key={card.id}
                  card={card}
                  selected={card.id === state.selectedCardId}
                  drawing={state.animatingCardIds.includes(card.id)}
                  drawIndex={state.animatingCardIds.indexOf(card.id)}
                  onClick={() => selectCard(card)}
                />
              ))
            )}
          </section>
        </div>

        {expandedCard && (
          <div className="card-zoom-backdrop" onClick={closeCardModal} role="presentation">
            <div className="card-zoom-panel" onClick={(event) => event.stopPropagation()}>
              <TutorialCard
                card={expandedCard}
                selected={expandedCard.id === state.selectedCardId}
                onClick={() => undefined}
              />
              <strong>{shortCardName(expandedCard.name)}</strong>
              <em>{zoneTitle(expandedCard.zone)}</em>
            </div>
          </div>
        )}

        {state.victory && (
          <div className="victory-modal-backdrop">
            <div className="victory-modal">
              <p className="eyebrow">tutorial clear</p>
              <h2>승리!</h2>
              <p>멀리건과 첫 턴 징집까지 확인했습니다.</p>
              <button type="button" onClick={() => resetCampaign(1)}>
                다음 튜토리얼로
              </button>
            </div>
          </div>
        )}

        <aside className="tutorial-log rail-log" aria-label="행동 로그">
          <div className="rail-log-head">
            <strong>{campaign.title}</strong>
          </div>
          <div className="rail-log-list">
            {state.logs.map((entry) => (
              <button
                key={entry.id}
                className={entry.id === state.activeLogId ? "active" : ""}
                type="button"
                title={`${entry.title}: ${entry.detail}`}
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    activeLogId: current.activeLogId === entry.id ? null : entry.id,
                  }))
                }
              >
                {entry.icon}
                <span className="rail-log-tooltip">
                  <strong>{entry.title}</strong>
                  <em>{entry.detail}</em>
                </span>
                {entry.id === state.activeLogId && (
                  <span className="rail-log-popover">
                    <strong>{entry.title}</strong>
                    <em>{entry.detail}</em>
                    {entry.snapshot && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          restoreLog(entry);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault();
                          event.stopPropagation();
                          restoreLog(entry);
                        }}
                      >
                        <StepBack />
                        되돌리기
                      </span>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
