import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Printer } from "lucide-react";

type PrintCard = {
  id: string;
  name: string;
  serial: string;
};

type DeckEntry = {
  cardId: string;
  serial: string;
  count: number;
};

type StructureDeck = {
  id: string;
  name: string;
  totalCards: number;
  mainDeckCards?: number;
  hero?: {
    cardId: string;
    serial: string;
    name: string;
  };
  entries: DeckEntry[];
};

type PrintableDeck = {
  deck: StructureDeck;
  cards: PrintCard[];
  uniqueCount: number;
};

type PrintMode = "selected" | "all" | "common";

const commonCardIds = [
  "st01-r-002",
  "st01-n-001",
  "st01-n-003",
  "st01-n-005",
  "st01-r-003",
  "st01-i-005",
  "st01-n-011",
];

function deckShortName(name: string) {
  if (name.includes("수신")) return "수신덱";
  if (name.includes("신모")) return "신모덱";
  if (name.includes("선구자")) return "선구자덱";
  return name.replace(/^옛이야기:\s*/, "").replace(/\s*고정 징집소$/, "");
}

function expandDeck(deck: StructureDeck, cards: PrintCard[]): PrintableDeck {
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const printableCards = [
    ...(deck.hero?.cardId ? [cardById.get(deck.hero.cardId)] : []),
    ...deck.entries.flatMap((entry) =>
      Array.from({ length: entry.count }, () => cardById.get(entry.cardId)),
    ),
  ].filter((card): card is PrintCard => Boolean(card));

  return {
    deck,
    cards: printableCards,
    uniqueCount: new Set(printableCards.map((card) => card.id)).size,
  };
}

function expandCommonCards(cards: PrintCard[]): PrintableDeck {
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const printableCards = commonCardIds
    .flatMap((cardId) => Array.from({ length: 2 }, () => cardById.get(cardId)))
    .filter((card): card is PrintCard => Boolean(card));

  return {
    deck: {
      id: "st01-common-print",
      name: "옛이야기: 공통 카드",
      totalCards: printableCards.length,
      mainDeckCards: printableCards.length,
      entries: commonCardIds.map((cardId) => ({
        cardId,
        serial: cardById.get(cardId)?.serial ?? "",
        count: 2,
      })),
    },
    cards: printableCards,
    uniqueCount: new Set(printableCards.map((card) => card.id)).size,
  };
}

export function DeckListPage({
  cards,
  decks,
  renderCard,
}: {
  cards: PrintCard[];
  decks: StructureDeck[];
  renderCard: (card: PrintCard) => ReactNode;
}) {
  const printableDecks = useMemo(
    () =>
      decks
        .filter((deck) => deck.id.startsWith("st01-"))
        .map((deck) => expandDeck(deck, cards)),
    [cards, decks],
  );
  const commonPrintable = useMemo(() => expandCommonCards(cards), [cards]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [printMode, setPrintMode] = useState<PrintMode>("selected");
  const selectedDeck =
    printableDecks.find(
      (item) => item.deck.id === (selectedDeckId || printableDecks[0]?.deck.id),
    ) ?? printableDecks[0];
  const visibleDecks =
    printMode === "all"
      ? printableDecks
      : printMode === "common"
        ? [commonPrintable]
        : [selectedDeck];

  useEffect(() => {
    const resetPrintMode = () => setPrintMode("selected");
    window.addEventListener("afterprint", resetPrintMode);
    return () => window.removeEventListener("afterprint", resetPrintMode);
  }, []);

  const printDecks = (mode: PrintMode) => {
    setPrintMode(mode);
    window.requestAnimationFrame(() => window.print());
  };

  if (!selectedDeck) {
    return (
      <div className="tutorial-print-view">
        <section className="tutorial-print-head">
          <p className="eyebrow">deck print</p>
          <h2>덱 프린트</h2>
          <p>출력할 옛이야기 덱 데이터가 없습니다.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="tutorial-print-view">
      <section className="tutorial-print-head">
        <div>
          <p className="eyebrow">deck print</p>
          <h2>옛이야기 덱 프린트</h2>
          <p>
            덱을 선택하면 성주 1장과 징집소 39장을 한 번에 출력합니다.
            프린트용 카드 얼굴은 DB 화면과 같은 컴포넌트를 사용합니다.
          </p>
        </div>
        <div className="tutorial-print-actions">
          <button type="button" onClick={() => printDecks("selected")}>
            <Printer />
            선택 덱 프린트
          </button>
          <button type="button" onClick={() => printDecks("all")}>
            <Printer />
            전체 덱 프린트
          </button>
          <button type="button" onClick={() => printDecks("common")}>
            <Printer />
            공통 카드 프린트
          </button>
        </div>
      </section>

      <section className="tutorial-deck-tabs" aria-label="프린트할 덱 선택">
        {printableDecks.map((item) => (
          <button
            key={item.deck.id}
            className={item.deck.id === selectedDeck.deck.id ? "active" : ""}
            type="button"
            onClick={() => setSelectedDeckId(item.deck.id)}
          >
            <strong>{deckShortName(item.deck.name)}</strong>
          <span>{item.cards.length}장</span>
          </button>
        ))}
      </section>

      <section className="tutorial-print-summary" aria-label="선택한 덱 정보">
        <article>
          <span>선택 덱</span>
          <strong>{deckShortName(selectedDeck.deck.name)}</strong>
        </article>
        <article>
          <span>성주</span>
          <strong>{selectedDeck.deck.hero?.name ?? "없음"}</strong>
        </article>
        <article>
          <span>징집소</span>
          <strong>{selectedDeck.deck.mainDeckCards ?? selectedDeck.deck.totalCards - 1}장</strong>
        </article>
        <article>
          <span>고유 카드</span>
          <strong>{selectedDeck.uniqueCount}종</strong>
        </article>
      </section>

      {visibleDecks.map((item) => (
        <section
          className="tutorial-print-sheet"
          key={item.deck.id}
          aria-label={`${item.deck.name} 카드 목록`}
        >
          <div className="tutorial-print-title">
            <span>{deckShortName(item.deck.name)}</span>
            <strong>{item.cards.length}장</strong>
          </div>
          <div className="tutorial-print-grid">
            {item.cards.map((card, index) => (
              <div className="tutorial-print-card" key={`${card.id}-${index}`}>
                {renderCard(card)}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
