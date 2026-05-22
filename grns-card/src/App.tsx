import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { BookOpenText, CircleDot, Library, Search, Shield, Sparkles, Swords } from "lucide-react";
import "./App.css";

type VersionEntry = {
  id: string;
  label: string;
  file: string;
  createdAt: string;
  notes: string;
};

type Manifest = {
  latest: string;
  versions: VersionEntry[];
};

type CardSource = {
  packId: string;
  classId: string;
  file: string;
  count: number;
};

type SplitDb = {
  dbVersion: string;
  updatedAt: string;
  sources: {
    classes: string;
    expansions: string;
    cards: CardSource[];
  };
};

type ClassInfo = {
  id: string;
  faction: string;
  name?: string;
  className?: string;
};

type Expansion = {
  id: string;
  name: string;
};

type Card = {
  id: string;
  name: string;
  cost: number;
  faction: string;
  classId: string;
  className: string;
  theme: string;
  type: string;
  race: string;
  effect: string;
  lore: string;
  power: number;
  serial: string;
  sigil: string;
  packId: string;
  packName: string;
};

type DbState = {
  version: VersionEntry;
  classes: ClassInfo[];
  expansions: Expansion[];
  cards: Card[];
};

type TabId = "intro" | "db" | "rules" | "about";

const emptyCards: Card[] = [];
const emptyClasses: ClassInfo[] = [];

const classColors: Record<string, string> = {
  goguryeo: "#ff8a6b",
  jinhan: "#c6a4ff",
  gaya: "#86ffe0",
  mahan: "#8bc7ff",
  neutral: "#f4f0d0",
};

const tabs: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  { id: "intro", label: "처음", icon: Sparkles },
  { id: "db", label: "DB", icon: Library },
  { id: "rules", label: "룰", icon: Shield },
  { id: "about", label: "설명", icon: BookOpenText },
];

const ruleItems = [
  {
    icon: Shield,
    title: "성주와 문지기",
    body: "성주는 패배 조건이고 문지기는 그 앞을 막는 방패다. 공격은 문지기와 성주 사이에서 방향을 정한다.",
  },
  {
    icon: Swords,
    title: "전장",
    body: "유닛은 전장에 놓여 힘으로 맞붙는다. 비용과 힘, 상태, 카드 타입이 전투의 계산을 바꾼다.",
  },
  {
    icon: CircleDot,
    title: "막사",
    body: "지휘막사와 야전막사는 카드 흐름을 만드는 자원선이다. 이동할 때 발동하는 카드가 덱의 호흡을 만든다.",
  },
  {
    icon: Sparkles,
    title: "트랩",
    body: "트랩유닛은 상대의 공격과 배치에 끼어드는 카드다. 공격 대상, 힘, 이동 위치를 순간적으로 뒤튼다.",
  },
];

async function fetchJson<T>(file: string): Promise<T> {
  const response = await fetch(file.replace(/^\.\/data\//, "./data/"), { cache: "no-store" });
  if (!response.ok) throw new Error(`${file} 로드 실패`);
  return response.json() as Promise<T>;
}

function packName(packId: string, expansions: Expansion[]) {
  if (packId === "base") return "기본";
  return expansions.find((item) => item.id === packId)?.name ?? packId;
}

async function loadDb(version: VersionEntry): Promise<DbState> {
  const db = await fetchJson<SplitDb>(version.file);
  const [classes, expansions] = await Promise.all([
    fetchJson<ClassInfo[]>(db.sources.classes),
    fetchJson<Expansion[]>(db.sources.expansions),
  ]);
  const groups = await Promise.all(
    db.sources.cards.map(async (source) => {
      const cards = await fetchJson<Omit<Card, "packId" | "packName">[]>(source.file);
      return cards.map((card) => ({
        ...card,
        packId: source.packId,
        packName: packName(source.packId, expansions),
      }));
    }),
  );
  return { version, classes, expansions, cards: groups.flat() };
}

function keywords(effect: string) {
  return Array.from(new Set((effect.match(/\[[^\]]+\]/g) ?? []).map((item) => item.slice(1, -1))));
}

function CardTile({ card, selected = false, onClick }: { card: Card; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      className={selected ? "card-tile selected" : "card-tile"}
      style={{ "--accent": classColors[card.classId] ?? "#f4f0d0" } as CSSProperties}
      type="button"
      onClick={onClick}
    >
      <span className="card-cost">{card.cost}</span>
      <span className="card-power">{card.power}</span>
      <span className="card-type">{card.type.replace("유닛", "")}</span>
      <strong>{card.name}</strong>
      <span className="card-mark">{card.sigil || "怪"}</span>
      <p>{card.effect || "효과 없음"}</p>
      <small>{card.faction} / {card.race}</small>
    </button>
  );
}

/**
 * 지우기
 */
function MythGlyph() {
  return (
    <div className="myth-glyph" aria-hidden="true">
      <span className="moon moon-a" />
      <span className="moon moon-b" />
      <span className="moon moon-c" />
      <span className="pine pine-a" />
      <span className="pine pine-b" />
      <span className="water water-a" />
      <span className="water water-b" />
      <span className="creature-body" />
      <span className="creature-eye eye-a" />
      <span className="creature-eye eye-b" />
      <span className="creature-mouth" />
      <span className="tail" />
    </div>
  );
}

function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [dbState, setDbState] = useState<DbState | null>(null);
  const [versionId, setVersionId] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("intro");
  const [query, setQuery] = useState("");
  const [classId, setClassId] = useState("all");
  const [type, setType] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson<Manifest>("./data/card-versions.json")
      .then((nextManifest) => {
        setManifest(nextManifest);
        setVersionId(nextManifest.latest);
      })
      .catch((caught: Error) => setError(caught.message));
  }, []);

  useEffect(() => {
    if (!manifest || !versionId) return;
    const version = manifest.versions.find((item) => item.id === versionId);
    if (!version) return;
    loadDb(version)
      .then((nextDb) => {
        setDbState(nextDb);
        setError("");
        setSelectedId((current) => current ?? nextDb.cards[9]?.id ?? nextDb.cards[0]?.id ?? null);
      })
      .catch((caught: Error) => setError(caught.message));
  }, [manifest, versionId]);

  const cards = dbState?.cards ?? emptyCards;
  const classes = dbState?.classes ?? emptyClasses;
  const selected = cards.find((card) => card.id === selectedId) ?? cards[0];
  const types = useMemo(() => Array.from(new Set(cards.map((card) => card.type))), [cards]);

  const filteredCards = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cards.filter((card) => {
      const haystack = `${card.name} ${card.effect} ${card.race} ${card.faction} ${card.className} ${card.theme}`.toLowerCase();
      return (
        (!normalized || haystack.includes(normalized)) &&
        (classId === "all" || card.classId === classId) &&
        (type === "all" || card.type === type)
      );
    });
  }, [cards, classId, query, type]);

  const keywordCounts = useMemo(() => {
    const counts = new Map<string, number>();
    cards.flatMap((card) => keywords(card.effect)).forEach((keyword) => counts.set(keyword, (counts.get(keyword) ?? 0) + 1));
    return Array.from(counts, ([keyword, count]) => ({ keyword, count })).sort((a, b) => b.count - a.count);
  }, [cards]);

  return (
    <main className="site-shell">
      <header className="site-header">
        <button className="brand" type="button" onClick={() => setActiveTab("intro")}>괴력난신</button>
        <nav className="tab-nav" aria-label="페이지 탭">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} className={activeTab === id ? "active" : ""} type="button" onClick={() => setActiveTab(id)}>
              <Icon />
              {label}
            </button>
          ))}
        </nav>
        <select value={versionId} onChange={(event) => setVersionId(event.target.value)} aria-label="DB 버전">
          {manifest?.versions.map((version) => (
            <option key={version.id} value={version.id}>{version.createdAt}</option>
          ))}
        </select>
      </header>

      <section className="tab-stage">
        {activeTab === "intro" && (
          <div className="intro-view">
            <div className="intro-copy">
              <p className="eyebrow">mythic card archive</p>
              <h1>괴력난신</h1>
              <p>
                인간의 영웅담보다 오래된 것들. 성문 앞의 짐승, 막사에 숨은 도구,
                밤길의 괴이와 패장에서 돌아오는 귀신을 모은 카드 아카이브.
              </p>
              <div className="intro-actions">
                <button type="button" onClick={() => setActiveTab("db")}>카드 DB</button>
                <button type="button" onClick={() => setActiveTab("rules")}>룰 보기</button>
              </div>
            </div>
            <div className="intro-stats" aria-label="통계">
              <span><strong>{cards.length || "..."}</strong> Cards</span>
              <span><strong>{classes.length || "..."}</strong> Factions</span>
              <span><strong>{keywordCounts.length || "..."}</strong> Keywords</span>
            </div>
          </div>
        )}

        {activeTab === "db" && (
          <div className="db-view">
            <aside className="db-filters">
              <p className="eyebrow">card database</p>
              <h2>카드 DB</h2>
              <label className="search-box">
                <Search />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="카드명, 효과, 종족" />
              </label>
              <select value={classId} onChange={(event) => setClassId(event.target.value)}>
                <option value="all">모든 세력</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>{item.faction} · {item.className ?? item.name}</option>
                ))}
              </select>
              <select value={type} onChange={(event) => setType(event.target.value)}>
                <option value="all">모든 타입</option>
                {types.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              {selected && (
                <div className="selected-card-note">
                  <span>{selected.serial}</span>
                  <strong>{selected.name}</strong>
                  <p>{selected.lore || selected.effect || "기록되지 않은 카드"}</p>
                </div>
              )}
            </aside>
            <section className="db-grid" aria-label="카드 목록">
              <div className="panel-head">
                <span>{filteredCards.length}장</span>
                <span>{dbState?.version.label}</span>
              </div>
              <div className="card-grid">
                {filteredCards.map((card) => (
                  <CardTile key={card.id} card={card} selected={selected?.id === card.id} onClick={() => setSelectedId(card.id)} />
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "rules" && (
          <div className="rules-view">
            <div className="panel-title">
              <p className="eyebrow">rules</p>
              <h2>룰</h2>
            </div>
            <div className="rule-list">
              {ruleItems.map(({ icon: Icon, title, body }) => (
                <article key={title}>
                  <Icon />
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
            <div className="keyword-panel">
              <h3>키워드</h3>
              <div>
                {keywordCounts.map((item) => (
                  <button key={item.keyword} type="button" onClick={() => {
                    setQuery(`[${item.keyword}]`);
                    setActiveTab("db");
                  }}>
                    [{item.keyword}] <span>{item.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="about-view">
            <div className="panel-title">
              <p className="eyebrow">about</p>
              <h2>설명</h2>
            </div>
            <div className="about-grid">
              {classes.map((item) => (
                <article key={item.id} style={{ "--accent": classColors[item.id] ?? "#f4f0d0" } as CSSProperties}>
                  <span>{item.faction}</span>
                  <h3>{item.className ?? item.name}</h3>
                  <p>{item.id === "goguryeo" && "성문을 부수고 정면으로 밀고 들어가는 용력의 전투."}</p>
                  <p>{item.id === "jinhan" && "밤길과 장난, 약화와 트랩으로 상대의 계산을 흐리는 괴이."}</p>
                  <p>{item.id === "gaya" && "막사와 도구, 희생과 찬탈로 큰 철기를 움직이는 반란."}</p>
                  <p>{item.id === "mahan" && "패장과 되살림, 죽은 뒤 남는 효과로 이어지는 귀신."}</p>
                  <p>{item.id === "neutral" && "모든 덱이 공유하는 기본 규칙과 카드 흐름."}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {error && <p className="error-message">{error}</p>}
    </main>
  );
}

export default App;
