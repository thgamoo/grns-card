import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

type CardLike = {
  id: string;
  name: string;
  serial: string;
  cost: number;
  power: number;
};

type DeckEntry = {
  cardId: string;
  serial: string;
  count: number;
};

type StructureDeck = {
  id: string;
  name: string;
  classId: string;
  faction: string;
  className: string;
  totalCards: number;
  entries: DeckEntry[];
};

type DrawCard = {
  key: string;
  name: string;
  serial: string;
  cost?: number;
  power?: number;
};

type ExpandedDeck = {
  id: string;
  name: string;
  label: string;
  cards: DrawCard[];
};

function expandDeck(deck: StructureDeck, cards: CardLike[]) {
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const cardBySerial = new Map(cards.map((card) => [card.serial, card]));
  const expanded: DrawCard[] = [];

  deck.entries.forEach((entry) => {
    const card = cardById.get(entry.cardId) ?? cardBySerial.get(entry.serial);
    for (let index = 0; index < entry.count; index += 1) {
      expanded.push({
        key: `${entry.cardId}-${index}-${expanded.length}`,
        name: card?.name ?? entry.cardId,
        serial: card?.serial ?? entry.serial,
        cost: card?.cost,
        power: card?.power,
      });
    }
  });

  return {
    id: deck.id,
    name: deck.name,
    label: `${deck.faction} · ${deck.className}`,
    cards: expanded,
  };
}

function drawCards(deck: ExpandedDeck | undefined, start: number, count: number) {
  return deck?.cards.slice(start, start + count) ?? [];
}

function DrawCardPill({ card }: { card: DrawCard }) {
  return (
    <span className="deck-sim-card">
      <small>{card.serial}</small>
      <strong>{card.name}</strong>
      {card.cost !== undefined && card.power !== undefined && (
        <em>
          {card.cost}/{card.power}
        </em>
      )}
    </span>
  );
}

export function DeckSimulatorPage({
  cards,
  decks,
}: {
  cards: CardLike[];
  decks: StructureDeck[];
}) {
  const expandedDecks = useMemo(
    () => decks.map((deck) => expandDeck(deck, cards)),
    [cards, decks],
  );
  const [firstDeckId, setFirstDeckId] = useState("");
  const [secondDeckId, setSecondDeckId] = useState("");
  const [turnCount, setTurnCount] = useState(8);
  const [skipFirstPlayerFirstDraw, setSkipFirstPlayerFirstDraw] =
    useState(true);

  const firstDeck = expandedDecks.find(
    (deck) => deck.id === (firstDeckId || expandedDecks[0]?.id),
  );
  const secondDeck = expandedDecks.find(
    (deck) => deck.id === (secondDeckId || expandedDecks[1]?.id),
  );

  const rows = useMemo(() => {
    let firstIndex = 0;
    let secondIndex = 0;

    return Array.from({ length: turnCount }, (_, index) => {
      const turn = index + 1;
      const firstDrawCount = skipFirstPlayerFirstDraw && turn === 1 ? 0 : 2;
      const firstDraw = drawCards(firstDeck, firstIndex, firstDrawCount);
      const secondDraw = drawCards(secondDeck, secondIndex, 2);
      firstIndex += firstDraw.length;
      secondIndex += secondDraw.length;

      return {
        turn,
        firstDraw,
        secondDraw,
        firstRemaining: Math.max((firstDeck?.cards.length ?? 0) - firstIndex, 0),
        secondRemaining: Math.max(
          (secondDeck?.cards.length ?? 0) - secondIndex,
          0,
        ),
      };
    });
  }, [firstDeck, secondDeck, skipFirstPlayerFirstDraw, turnCount]);

  const reset = () => {
    setFirstDeckId("");
    setSecondDeckId("");
    setTurnCount(8);
    setSkipFirstPlayerFirstDraw(true);
  };

  return (
    <div className="deck-sim-view">
      <section className="deck-sim-head">
        <div>
          <p className="eyebrow">deck simulator</p>
          <h2>초보자 덱 징집 흐름</h2>
          <p>
            스트럭쳐 징집소의 순서를 그대로 펼쳐서, 매 턴 양쪽이 어떤 카드를
            가져오는지만 확인합니다.
          </p>
        </div>
        <button type="button" onClick={reset}>
          <RotateCcw />
          초기화
        </button>
      </section>

      <section className="deck-sim-controls" aria-label="덱 시뮬레이터 설정">
        <label>
          선공 덱
          <select
            value={firstDeck?.id ?? ""}
            onChange={(event) => setFirstDeckId(event.target.value)}
          >
            {expandedDecks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          후공 덱
          <select
            value={secondDeck?.id ?? ""}
            onChange={(event) => setSecondDeckId(event.target.value)}
          >
            {expandedDecks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          턴 수
          <input
            type="number"
            min={1}
            max={20}
            value={turnCount}
            onChange={(event) =>
              setTurnCount(Math.min(20, Math.max(1, Number(event.target.value))))
            }
          />
        </label>
        <label className="deck-sim-check">
          <input
            type="checkbox"
            checked={skipFirstPlayerFirstDraw}
            onChange={(event) =>
              setSkipFirstPlayerFirstDraw(event.target.checked)
            }
          />
          선공 1턴 징집 없음
        </label>
      </section>

      <section className="deck-sim-summary" aria-label="선택한 덱 요약">
        {[firstDeck, secondDeck].map((deck, index) => (
          <article key={`${deck?.id ?? "empty"}-${index}`}>
            <span>{index === 0 ? "선공" : "후공"}</span>
            <strong>{deck?.label ?? "덱 없음"}</strong>
            <small>{deck?.cards.length ?? 0}장</small>
          </article>
        ))}
      </section>

      <section className="deck-sim-table" aria-label="턴별 징집 결과">
        <div className="deck-sim-row deck-sim-row-head">
          <span>턴</span>
          <strong>{firstDeck?.label ?? "선공"}</strong>
          <strong>{secondDeck?.label ?? "후공"}</strong>
        </div>
        {rows.map((row) => (
          <div className="deck-sim-row" key={row.turn}>
            <span>{row.turn}</span>
            <div>
              {row.firstDraw.length ? (
                row.firstDraw.map((card) => (
                  <DrawCardPill key={card.key} card={card} />
                ))
              ) : (
                <em>징집 없음</em>
              )}
              <small>남은 징집소 {row.firstRemaining}장</small>
            </div>
            <div>
              {row.secondDraw.map((card) => (
                <DrawCardPill key={card.key} card={card} />
              ))}
              <small>남은 징집소 {row.secondRemaining}장</small>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
