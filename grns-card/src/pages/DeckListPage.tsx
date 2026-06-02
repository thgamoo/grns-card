import { Fragment, useEffect, useMemo, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { Printer } from "lucide-react";
import pioneerDeckBannerUrl from "../assets/pioneer-deck-banner-crow.png";
import shinmoDeckBannerUrl from "../assets/shinmo-deck-banner-bear.png";
import sushinDeckBannerUrl from "../assets/sushin-deck-banner-tiger.png";

type PrintCard = {
  name: string;
  serial: string;
  cost?: number;
  power?: number;
  race?: string;
  effect?: string;
};

type DeckEntry = {
  serial: string;
  count: number;
};

type StructureDeck = {
  id: string;
  name: string;
  totalCards: number;
  mainDeckCards?: number;
  hero?: {
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

type DeckCardLine = {
  card: PrintCard;
  count: number;
};

type PrintMode = "selected" | "all" | "common";
type PrintSideMode = "simplex" | "duplex";
type PreviewAnchor = "top" | "bottom";

const cardsPerPrintPage = 9;

const commonCardSerials = [
  "tu01-0028",
  "tu01-0029",
  "tu01-0030",
  "tu01-0031",
  "tu01-0032",
  "tu01-0033",
  "tu01-0035",
];

function deckShortName(name: string) {
  if (name.includes("성주 공격 미니덱")) return "첫 전투";
  if (name.includes("수신")) return "수신덱";
  if (name.includes("신모")) return "신모덱";
  if (name.includes("선구자")) return "선구자덱";
  return name.replace(/^옛이야기:\s*/, "").replace(/\s*고정 징집소$/, "");
}

function deckBannerStyle(deck: StructureDeck): CSSProperties | undefined {
  const shortName = deckShortName(deck.name);
  const bannerUrl =
    shortName === "수신덱"
      ? sushinDeckBannerUrl
      : shortName === "신모덱"
        ? shinmoDeckBannerUrl
        : shortName === "선구자덱"
          ? pioneerDeckBannerUrl
          : undefined;

  return bannerUrl
    ? ({
        "--starter-deck-banner": `url(${bannerUrl})`,
      } as CSSProperties)
    : undefined;
}

function expandDeck(deck: StructureDeck, cards: PrintCard[]): PrintableDeck {
  const cardBySerial = new Map(cards.map((card) => [card.serial, card]));
  const printableCards = [
    ...(deck.hero?.serial ? [cardBySerial.get(deck.hero.serial)] : []),
    ...deck.entries.flatMap((entry) =>
      Array.from({ length: entry.count }, () =>
        cardBySerial.get(entry.serial),
      ),
    ),
  ].filter((card): card is PrintCard => Boolean(card));

  return {
    deck,
    cards: printableCards,
    uniqueCount: new Set(printableCards.map((card) => card.serial)).size,
  };
}

function serialNumber(serial: string) {
  return Number(serial.match(/(\d+)$/)?.[1] ?? 0);
}

function starterDeckColumns(deck: StructureDeck, cards: PrintCard[]) {
  const cardBySerial = new Map(cards.map((card) => [card.serial, card]));
  const counts = new Map<string, number>();
  for (const entry of deck.entries) {
    counts.set(entry.serial, (counts.get(entry.serial) ?? 0) + entry.count);
  }

  const lines = Array.from(counts.entries())
    .map(([serial, count]) => ({
      card: cardBySerial.get(serial),
      count,
    }))
    .filter((line): line is DeckCardLine => Boolean(line.card))
    .sort(
      (a, b) =>
        serialNumber(a.card.serial) - serialNumber(b.card.serial) ||
        a.card.name.localeCompare(b.card.name),
    );

  const rightStartIndex = lines.findIndex(
    (line) => line.card.serial === "tu01-0028",
  );
  const splitIndex =
    rightStartIndex === -1 ? Math.ceil(lines.length / 2) : rightStartIndex;

  return [lines.slice(0, splitIndex), lines.slice(splitIndex)];
}

function expandCommonCards(cards: PrintCard[]): PrintableDeck {
  const cardBySerial = new Map(cards.map((card) => [card.serial, card]));
  const printableCards = commonCardSerials
    .flatMap((serial) =>
      Array.from({ length: 2 }, () => cardBySerial.get(serial)),
    )
    .filter((card): card is PrintCard => Boolean(card));

  return {
    deck: {
      id: "tu01-common-print",
      name: "옛이야기: 공통 카드",
      totalCards: printableCards.length,
      mainDeckCards: printableCards.length,
      entries: commonCardSerials.map((serial) => ({
        serial,
        count: 2,
      })),
    },
    cards: printableCards,
    uniqueCount: new Set(printableCards.map((card) => card.serial)).size,
  };
}

function chunkCards(cards: PrintCard[], size: number) {
  const chunks: PrintCard[][] = [];
  for (let index = 0; index < cards.length; index += size) {
    chunks.push(cards.slice(index, index + size));
  }
  return chunks;
}

function effectSummary(effect?: string) {
  const text = effect?.replace(/_[\s\S]*$/g, "").trim();
  if (!text) return "(효과없음)";
  return text.length > 46 ? `${text.slice(0, 45)}...` : text;
}

export function DeckListPage({
  cards,
  decks,
  renderCard,
  renderBack,
}: {
  cards: PrintCard[];
  decks: StructureDeck[];
  renderCard: (card: PrintCard) => ReactNode;
  renderBack?: () => ReactNode;
}) {
  const printableDecks = useMemo(
    () =>
      decks
        .filter((deck) => deck.id.startsWith("tu01-"))
        .map((deck) => expandDeck(deck, cards)),
    [cards, decks],
  );
  const commonPrintable = useMemo(() => expandCommonCards(cards), [cards]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [printMode, setPrintMode] = useState<PrintMode>("selected");
  const [printSideMode, setPrintSideMode] =
    useState<PrintSideMode>("simplex");
  const [previewCard, setPreviewCard] = useState<PrintCard | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [previewAnchor, setPreviewAnchor] = useState<PreviewAnchor>("top");
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

  const movePreview = (event: MouseEvent) => {
    setPreviewPosition({ x: event.clientX, y: event.clientY });
    setPreviewAnchor(
      event.clientY > window.innerHeight - 280 ? "bottom" : "top",
    );
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
          <p className="eyebrow">starter decks</p>
          <h2>온보딩 덱</h2>
        </div>
        <div className="tutorial-print-actions">
          <div className="tutorial-print-toggle" aria-label="인쇄 방식">
            <button
              type="button"
              className={printSideMode === "simplex" ? "active" : ""}
              onClick={() => setPrintSideMode("simplex")}
            >
              단면인쇄
            </button>
            <button
              type="button"
              className={printSideMode === "duplex" ? "active" : ""}
              onClick={() => setPrintSideMode("duplex")}
            >
              양면인쇄
            </button>
          </div>
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

      <section className="starter-deck-browser" aria-label="선택한 덱 구성">
        <div
          className="starter-deck-hero"
          style={deckBannerStyle(selectedDeck.deck)}
        >
          <div>
            <span>성주</span>
            <strong>{selectedDeck.deck.hero?.name ?? "없음"}</strong>
          </div>
          <span>{selectedDeck.deck.hero?.serial ?? "-"}</span>
        </div>

        {(() => {
          const columns = starterDeckColumns(selectedDeck.deck, cards);

          const renderLines = (items: DeckCardLine[]) =>
            items.map(({ card, count }) => (
              <li
                key={card.serial}
                tabIndex={0}
                onBlur={() => setPreviewCard(null)}
                onFocus={() => setPreviewCard(card)}
                onMouseEnter={(event) => {
                  setPreviewCard(card);
                  movePreview(event);
                }}
                onMouseMove={movePreview}
                onMouseLeave={() => setPreviewCard(null)}
              >
                <span className="starter-card-cost">{card.cost ?? "-"}</span>
                <div className="starter-card-copy">
                  <strong>
                    {card.name}
                    <small>{card.serial}</small>
                  </strong>
                  <span>{effectSummary(card.effect)}</span>
                </div>
                <span className="starter-card-race">{card.race || "일반"}</span>
                <span className="starter-card-count">{count}</span>
              </li>
            ));

          return (
            <div className="starter-deck-columns">
              {columns.map((column, index) => (
                <article className="starter-deck-list" key={index}>
                  {index === 0 && (
                    <header className="starter-card-list-header">
                      <span>허기</span>
                      <span>카드</span>
                      <span>종족</span>
                      <span>장수</span>
                    </header>
                  )}
                  <ol>{renderLines(column)}</ol>
                </article>
              ))}
            </div>
          );
        })()}
        {previewCard && (
          <aside
            className={`starter-card-preview ${previewAnchor}`}
            style={{
              left: `${previewPosition.x}px`,
              top: `${previewPosition.y}px`,
            }}
            aria-hidden="true"
          >
            {renderCard(previewCard)}
          </aside>
        )}
      </section>

      {visibleDecks.map((item) => (
        <Fragment key={item.deck.id}>
          {chunkCards(item.cards, cardsPerPrintPage).map((pageCards, pageIndex) => (
            <section
              className="tutorial-print-sheet print-only"
              key={`${item.deck.id}-front-${pageIndex}`}
              aria-label={`${item.deck.name} 카드 앞면 ${pageIndex + 1}쪽`}
            >
              <div className="tutorial-print-title">
                <span>
                  {deckShortName(item.deck.name)} 앞면 {pageIndex + 1}
                </span>
                <strong>
                  {pageCards.length}장 / {item.cards.length}장
                </strong>
              </div>
              <div className="tutorial-print-grid">
                {pageCards.map((card, index) => (
                  <div
                    className="tutorial-print-card"
                    key={`${card.serial}-${pageIndex}-${index}`}
                  >
                    {renderCard(card)}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {renderBack &&
            printSideMode === "duplex" &&
            chunkCards(item.cards, cardsPerPrintPage).map(
              (pageCards, pageIndex) => (
                <section
                  className="tutorial-print-sheet tutorial-print-back-sheet print-only"
                  key={`${item.deck.id}-back-${pageIndex}`}
                  aria-label={`${item.deck.name} 카드 뒷면 ${pageIndex + 1}쪽`}
                >
                  <div className="tutorial-print-title">
                    <span>
                      {deckShortName(item.deck.name)} 뒷면 {pageIndex + 1}
                    </span>
                    <strong>
                      {pageCards.length}장 / {item.cards.length}장
                    </strong>
                  </div>
                  <div className="tutorial-print-grid">
                    {pageCards.map((card, index) => (
                      <div
                        className="tutorial-print-card"
                        key={`${card.serial}-back-${pageIndex}-${index}`}
                      >
                        {renderBack()}
                      </div>
                    ))}
                  </div>
                </section>
              ),
            )}
        </Fragment>
      ))}
    </div>
  );
}
