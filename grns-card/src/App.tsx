import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { BookOpenText, Library, Map as MapIcon, Printer, Search, Shield, Sparkles, X } from "lucide-react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
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
  mark?: string;
  stripe?: string;
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
  classMark: string;
  classStripe: string;
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
  goguryeo: "#d7d7d7",
  jinhan: "#bfbfbf",
  gaya: "#ececec",
  mahan: "#cfcfcf",
  neutral: "#ffffff",
};

const fallbackClassMarks: Record<string, string> = {
  goguryeo: "△",
  jinhan: "★",
  gaya: "■",
  mahan: "●",
  neutral: "◇",
};

const tabs: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  { id: "intro", label: "처음", icon: Sparkles },
  { id: "db", label: "DB", icon: Library },
  { id: "rules", label: "룰", icon: Shield },
  { id: "about", label: "설명", icon: BookOpenText },
];

const cardPartTerms = [
  { id: 1, title: "허기", body: "이 카드를 <전장>에 배치하기 위한 비용입니다. 왼쪽 위 숫자입니다." },
  { id: 2, title: "힘", body: "전투 시 승패를 결정짓는 수치입니다. 오른쪽 위 숫자입니다." },
  { id: 3, title: "용모파기", body: "영체화가가 그려준 용모파기입니다. 카드 중앙의 일러스트 영역입니다." },
  { id: 4, title: "종족", body: "이 카드의 소속 및 종입니다. 효과 위 네모 칩들입니다." },
  { id: 5, title: "효과", body: "특정 조건에 따라 이행합니다. 카드가 \"지원\" 유닛이라면 보급로에서 효과를 이행하며, \"매복\" 유닛이라면 <반격> 시 효과를 이행합니다. 아래의 <전투의 처리> 섹션을 참고합니다." },
  { id: 6, title: "종류", body: "3종류로 이루어져 있습니다. \"일반\", \"지원\", \"매복\"입니다. 맨 왼쪽 하단 텍스트입니다." },
  { id: 7, title: "소속문양", body: "이 카드의 소속을 나타내는 문양입니다. 맨 오른쪽 하단 문양입니다." },
];

const warPrepSections = [
  {
    title: "징집소 구축",
    intro: "전쟁을 시작하려면 군역을 징발해야합니다. 민초들의 잠재력을 살펴보고 징집소를 세우세요.",
    items: ["징집소 - 덱. 40장으로 구성해야함.", "같은 카드는 최대 3장까지 넣을 수 있음."],
  },
  {
    title: "패배 조건 인지",
    intro: "다른 영령들과 전쟁에서 패배하지 않도록 미리 살펴보세요.",
    items: ["\"성주\"가 매장지로 이동한 경우 즉시 패배한다.", "\"징집소\"에 병사가 없는 경우 즉시 패배한다."],
  },
  {
    title: "전쟁의 시작",
    intro: "다른 영령을 조우하셨군요. 어서 가서 본때를 보여주죠.",
    items: [
      "풍향 관찰 - 가위바위보에서 이긴 사람이 <선공> 턴을 가져간다. 동남풍이 분다아아아.",
      "성주 배치 - 본인이 생각한 성주를 <비공개> 상태, 즉 뒷면으로 배치한다.",
      "훈련병 징발 - 4장을 <징집> 한다. 이 유닛들을 문지기로 쓰고 싶으면 그대로 배치한다. 그리고 5장을 추가로 뽑아 <군영> 으로 설정한다. 아니면 1장을 추가로 <징집> 하여 시작 <군영>으로 설정한다. 그리고 다시 4장을 뽑아 문지기로 배치한다.",
    ],
  },
];

const phases = [
  { title: "정비 페이즈", body: "전진기지로 옮겼던 보급병들을 후방기지로 재위치 시키기. <휴식> 상태였던 <전장>의 병사를 <대기> 상태로 바꾸기." },
  { title: "징집 페이즈", body: "<징집소>에서 <군영>으로 카드를 2장 <징집>하기. 단, 선공은 첫 턴에 징집할 수 없다." },
  { title: "보급병 배치 페이즈", body: "<군영>에서 <후방기지>로 <보급병>으로 사용할 카드 1장 또는 0장을 내려놓기." },
  {
    title: "전쟁 페이즈",
    body: "다음의 7개의 액션을 자유롭게 할 수 있음.",
    actions: [
      "출정 - <군영>에서 전장으로 <식량>을 소모하고 유닛을 <대기> 상태로 배치.",
      "공격 - <후방기지>에서 <전방기지>로 [보급]하여 <전장>에 <대기> 상태인 유닛으로 상대의 유닛과 <전투>를 시작.",
      "자체보급 - <지원> 유닛 중 [자체보급] 키워드를 갖고 있는 유닛을 <후방기지>에서 <전진기지>로 옮기면서 효과를 발동.",
      "퇴각 - 1턴에 1번만 가능. <후방기지>의 맨 아래 유닛 1장을 <매장지>로 이동시키고, <전장>의 유닛 1장을 지정하여 <후방기지> 맨 위에 위치 시키기.",
      "이동 - [보급]하여 <전장>에 배치한 유닛을 다른 <진>으로 이동. 대치 중인 유닛이 있었다면 <대가>를 지불 해야한다.",
      "장악 - 이웃한 대각선 경로의 상대 문지기가 비어있을 경우, [보급] 후 해당 위치에 카드를 배치함으로써 [장악]할 수 있음.",
      "문지기 배치 - <군영>에서 자신의 비어있는 <문지기> 위치에 <등장> 상태로 배치.",
    ],
  },
  { title: "소강 페이즈", body: "턴을 종료함." },
];

const battleSteps = [
  "공격 선언 - <보급> 처리 후 상대 유닛을 지정 후 선언. 카드를 <대기> 상태에서 <정비> 상태로 전환.",
  "매복 선언 - 상대가 <보급> 처리 후 군영에서 <매복> 카드를 <전장>에 배치.",
  "문지기 등장 선언 - 내려놓는 위치가 문지기일 경우 \"매복 선언\"이 아닌 \"문지기 등장\" 선언으로 간주. 이 경우 [문지기 등장] 진언이 붙은 카드만 매복효과로 이행할 수 있음.",
  "상시 효과 이행 - 현재 상태에서 이행되는 상시효과를 전투에 적용.",
  "매복 효과 이행 - 상대가 배치한 <매복> 카드의 효과를 이행.",
  "문지기 등장 - 공격받은 유닛이 문지기였다면 진행. 등장 시 상시 효과가 있다면 선이행. 매복 카드였다면 매복효과 추가 이행. 뒤집힌 문지기일 경우 뒤집으면서 등장 후 비용없이 이행.",
  "힘겨루기 - 힘이 낮은 유닛이 <매장지>로 이동. 힘이 같다면, 공격자가 1장 군영에서 <희생> 하는 것으로 힘이 낮은 유닛을 <매장지>로 이동. 그렇게 하지 않을 경우 둘 다 생존.",
];

const keywordRules = [
  ["[출정]", "<전장>으로 배치 시 효과를 이행"],
  ["[단말마]", "<전장> 혹은 <성>에서 <매장지>로 이동하였을 경우 효과를 이행"],
  ["[자체보급]", "해당 유닛을 <보급> 하여 효과를 발동"],
  ["[전투광]", "공격 선언 시 <보급> 하지 않는다."],
  ["[강화 X]", "유닛 1장을 지정하여 X 만큼 힘 +1"],
  ["[약화 X]", "유닛 1장을 지정하여 X 만큼 힘 -1. 단 약화로 힘이 0 이하로 감소할 수 없다."],
  ["[희생 X]", "<군영> 또는 <징집소>에서 X 만큼 <매장지>로 이동"],
  ["[문지기 등장]", "<비공개> 상태에서 <문지기> 위치로 배치 되었을 경우 효과를 이행"],
  ["[퇴각]", "<퇴각> 할 경우 효과를 이행"],
  ["[퇴출]", "<퇴출> 될 경우 효과를 이행"],
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
      const cards = await fetchJson<Omit<Card, "packId" | "packName" | "classMark" | "classStripe">[]>(source.file);
      const classInfo = classes.find((item) => item.id === source.classId);
      return cards.map((card) => ({
        ...card,
        classMark: classInfo?.mark ?? fallbackClassMarks[card.classId] ?? "◇",
        classStripe: classInfo?.stripe ?? classColors[card.classId] ?? "#ffffff",
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

function CardTile({ card, onClick }: { card: Card; onClick?: () => void }) {
  const compactName = card.name.length > 9 ? " name-compact" : card.name.length > 6 ? " name-small" : "";

  return (
    <button
      className="card-tile"
      style={{ "--class-stripe": card.classStripe || classColors[card.classId] || "#ffffff" } as CSSProperties}
      type="button"
      onClick={onClick}
    >
      <span className="card-stripe" aria-hidden="true" />
      <span className="card-top">
        <span className="card-cost">{card.cost}</span>
        <strong className={`card-name${compactName}`}>{card.name}</strong>
        <span className="card-power">{card.power}</span>
      </span>
      <span className="card-art" aria-hidden="true">
        <span>{card.sigil || "怪"}</span>
      </span>
      <span className="card-bottom">
        <span className="card-meta">
          <span>{card.faction}</span>
          <span>{card.race || "무속성"}</span>
        </span>
        <span className="card-effect">{card.effect || "효과 없음"}</span>
        <span className="card-serial">{card.serial}</span>
        <span className="card-type">{card.type}</span>
        <span className="card-mark">{card.classMark || fallbackClassMarks[card.classId] || "◇"}</span>
      </span>
    </button>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={active ? "filter-chip active" : "filter-chip"} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function EmphasizedTerms({ text }: { text: string }) {
  return (
    <>
      {text.split(/(<[^>]+>|\[[^\]]+\])/g).map((part, index) => (
        /^<[^>]+>$|^\[[^\]]+\]$/.test(part) ? <strong key={`${part}-${index}`}>{part}</strong> : part
      ))}
    </>
  );
}

function emphasizeMarkdownTerms(source: string) {
  return source
    .replace(/<([^>\n]+)>/g, "**&lt;$1&gt;**")
    .replace(/(\[[^\]\n]+\])/g, "**$1**");
}

function MarkdownView({ source }: { source: string }) {
  return (
    <div className="markdown-view">
      <Streamdown>{emphasizeMarkdownTerms(source)}</Streamdown>
    </div>
  );
}

function MissingCallout() {
  return (
    <aside className="missing-callout">
      <p>앗, 허기진 영체 짐승이 설명을 먹어버렸습니다. 금방 잡아올게요.</p>
    </aside>
  );
}

function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [dbState, setDbState] = useState<DbState | null>(null);
  const [versionId, setVersionId] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("intro");
  const [query, setQuery] = useState("");
  const [classIds, setClassIds] = useState<string[]>([]);
  const [packIds, setPackIds] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [keywordFilters, setKeywordFilters] = useState<string[]>([]);
  const [modalCardId, setModalCardId] = useState<string | null>(null);
  const [rulebookMarkdown, setRulebookMarkdown] = useState("");
  const [showRulebook, setShowRulebook] = useState(false);
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
    fetch("./docs/rulebook.md", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("룰북 로드 실패");
        return response.text();
      })
      .then(setRulebookMarkdown)
      .catch(() => setRulebookMarkdown("# 괴력난신 룰북\n\n룰북 문서를 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    if (!manifest || !versionId) return;
    const version = manifest.versions.find((item) => item.id === versionId);
    if (!version) return;
    loadDb(version)
      .then((nextDb) => {
        setDbState(nextDb);
        setError("");
        setModalCardId(null);
      })
      .catch((caught: Error) => setError(caught.message));
  }, [manifest, versionId]);

  const cards = dbState?.cards ?? emptyCards;
  const classes = dbState?.classes ?? emptyClasses;
  const cardTypes = useMemo(() => Array.from(new Set(cards.map((card) => card.type))), [cards]);
  const packs = useMemo(() => {
    const seen = new Set<string>();
    return cards.reduce<Array<{ id: string; name: string }>>((items, card) => {
      if (seen.has(card.packId)) return items;
      seen.add(card.packId);
      items.push({ id: card.packId, name: card.packName });
      return items;
    }, []);
  }, [cards]);

  const filteredCards = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cards.filter((card) => {
      const haystack = `${card.name} ${card.effect} ${card.race} ${card.faction} ${card.className} ${card.theme}`.toLowerCase();
      return (
        (!normalized || haystack.includes(normalized)) &&
        (classIds.length === 0 || classIds.includes(card.classId)) &&
        (packIds.length === 0 || packIds.includes(card.packId)) &&
        (types.length === 0 || types.includes(card.type)) &&
        keywordFilters.every((keyword) => haystack.includes(keyword.toLowerCase()) || keywords(card.effect).includes(keyword))
      );
    });
  }, [cards, classIds, keywordFilters, packIds, query, types]);

  const keywordCounts = useMemo(() => {
    const counts = new Map<string, number>();
    cards.flatMap((card) => keywords(card.effect)).forEach((keyword) => counts.set(keyword, (counts.get(keyword) ?? 0) + 1));
    return Array.from(counts, ([keyword, count]) => ({ keyword, count })).sort((a, b) => b.count - a.count);
  }, [cards]);

  const modalCard = cards.find((card) => card.id === modalCardId);
  const sampleCard = cards.find((card) => card.serial === "GRNS-0009") ?? cards[0];

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
        <label className="version-picker">
          <span>카드 버전</span>
          <select value={versionId} onChange={(event) => setVersionId(event.target.value)} aria-label="카드 버전">
            {manifest?.versions.map((version) => (
              <option key={version.id} value={version.id}>{version.createdAt}</option>
            ))}
          </select>
        </label>
      </header>

      <section className="tab-stage">
        {activeTab === "intro" && (
          <div className="intro-view">
            <div className="intro-copy">
              <p className="eyebrow">mythic card archive</p>
              <h1>괴력난신</h1>
              <p>
                정복전쟁의 시초, 성문 뒤에서 먼저 움직인 사람과 소문과 괴이를 기록합니다.
                카드 작업과 흑백 출력 검토를 한 화면에서 이어갑니다.
              </p>
              <div className="intro-actions">
                <button type="button" onClick={() => setActiveTab("db")}>카드 DB</button>
                <button type="button" onClick={() => setActiveTab("rules")}>룰 보기</button>
              </div>
            </div>
            <div className="hero-board" aria-hidden="true">
              <span className="lane north">동</span>
              <span className="lane south">서</span>
              <span className="lane east">남</span>
              <span className="lane west">북</span>
              <span className="lord">城主</span>
              <span className="gate gate-a"></span>
              <span className="gate gate-b"></span>
              <span className="gate gate-c"></span>
              <span className="gate gate-d"></span>
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
              <h2>필터</h2>
              <label className="search-box">
                <Search />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="카드명, 효과, 종족" />
              </label>
              <div className="filter-hint">선택한 조건은 AND로 적용됩니다. 같은 묶음 안에서는 하나 이상과 일치하면 통과합니다.</div>
              <div className="filter-group">
                <span>세력</span>
                <div className="chip-list">
                  {classes.map((item) => (
                    <FilterChip key={item.id} active={classIds.includes(item.id)} onClick={() => setClassIds((current) => toggleValue(current, item.id))}>
                      {item.faction}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span>팩</span>
                <div className="chip-list">
                  {packs.map((item) => (
                    <FilterChip key={item.id} active={packIds.includes(item.id)} onClick={() => setPackIds((current) => toggleValue(current, item.id))}>
                      {item.name}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span>타입</span>
                <div className="chip-list">
                  {cardTypes.map((item) => (
                    <FilterChip key={item} active={types.includes(item)} onClick={() => setTypes((current) => toggleValue(current, item))}>
                      {item}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span>키워드</span>
                <div className="chip-list keyword-chips">
                  {keywordCounts.slice(0, 18).map((item) => (
                    <FilterChip key={item.keyword} active={keywordFilters.includes(item.keyword)} onClick={() => setKeywordFilters((current) => toggleValue(current, item.keyword))}>
                      [{item.keyword}] <span>{item.count}</span>
                    </FilterChip>
                  ))}
                </div>
              </div>
              {(query || classIds.length || packIds.length || types.length || keywordFilters.length) && (
                <button className="clear-filters" type="button" onClick={() => {
                  setQuery("");
                  setClassIds([]);
                  setPackIds([]);
                  setTypes([]);
                  setKeywordFilters([]);
                }}>
                  필터 초기화
                </button>
              )}
            </aside>
            <section className="db-grid" aria-label="카드 목록">
              <div className="panel-head">
                <span>{filteredCards.length}장</span>
                <div className="panel-actions">
                  <span>{dbState?.version.label}</span>
                  <button type="button" onClick={() => window.print()} disabled={filteredCards.length === 0}>
                    <Printer />
                    A4 프린트
                  </button>
                </div>
              </div>
              <div className="card-grid">
                {filteredCards.map((card) => (
                  <CardTile key={card.id} card={card} onClick={() => setModalCardId(card.id)} />
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "rules" && (
          <div className="rules-view">
            <section className="rules-section rules-hero">
              <p className="eyebrow">rules</p>
              <h2>전쟁 안내</h2>
              <p className="section-intro">
                괴력난신의 세계에 오신 것을 환영합니다, 영령 님.
                당신은 각 종족의 수호자로서 전쟁을 주관하고 무릇 만민의 숭배를 받으실 겁니다.
                제가 어떻게 계시를 내려야 하는지 말씀 올리겠습니다.
                이해하기 쉽도록 영체언어 (ex. 카드) 로 부가 설명을 덧붙이겠습니다.
              </p>
              <div className="rules-link-grid">
                <button type="button" onClick={() => setShowRulebook((current) => !current)}>
                  <BookOpenText />
                  룰북
                </button>
                <a href="/field-board.html">
                  <MapIcon />
                  필드 판
                </a>
              </div>
              {showRulebook && (
                <aside className="rulebook-reader" id="rulebook-reader" aria-label="룰북">
                  <MarkdownView source={rulebookMarkdown} />
                  <MissingCallout />
                </aside>
              )}
            </section>

            <section className="rules-section">
              <div className="rules-section-head">
                <p className="eyebrow">card layout</p>
                <h2>카드 구성</h2>
              </div>
              <p className="section-intro">
                민초들은 매일 굶주려 있습니다. 당신이 식량을 제공해주신다면 잠재되어 있는 힘을 낼 수 있을 것입니다.
                각 종족의 우두머리에게 계시를 내려 병사를 징집하고 식량을 하사하여 전쟁에 매혹시키세요.
              </p>
              <div className="card-layout-guide">
                {sampleCard && (
                  <div className="annotated-card">
                    <CardTile card={sampleCard} />
                    <span className="callout callout-cost">1</span>
                    <span className="callout callout-power">2</span>
                    <span className="callout callout-art">3</span>
                    <span className="callout callout-race">4</span>
                    <span className="callout callout-effect">5</span>
                    <span className="callout callout-type">6</span>
                    <span className="callout callout-mark">7</span>
                  </div>
                )}
                <div className="term-grid">
                  {cardPartTerms.map((term) => (
                    <article key={term.id} className={term.id === 5 ? "wide" : ""}>
                      <span>{term.id}</span>
                      <h3>{term.title}</h3>
                      <p><EmphasizedTerms text={term.body} /></p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="rules-section">
              <div className="rules-section-head">
                <p className="eyebrow">setup</p>
                <h2>전쟁 준비</h2>
              </div>
              <div className="rule-chapter-flow">
                {warPrepSections.map((section, index) => (
                  <article key={section.title}>
                    <h3>{index + 1}. {section.title}</h3>
                    <p><EmphasizedTerms text={section.intro} /></p>
                    <ol>
                      {section.items.map((item) => <li key={item}><EmphasizedTerms text={item} /></li>)}
                    </ol>
                  </article>
                ))}
              </div>
            </section>

            <section className="rules-section">
              <div className="rules-section-head">
                <p className="eyebrow">turn phases</p>
                <h2>게임의 진행</h2>
              </div>
              <div className="phase-list">
                {phases.map((phase, index) => (
                  <article key={phase.title}>
                    <span>{index + 1}</span>
                    <div>
                      <h3>{index + 1}. {phase.title}</h3>
                      <p><EmphasizedTerms text={phase.body} /></p>
                      {phase.actions && (
                        <ol>
                          {phase.actions.map((action) => <li key={action}><EmphasizedTerms text={action} /></li>)}
                        </ol>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rules-section split-rules">
              <article>
                <p className="eyebrow">retreat</p>
                <h2>퇴각과 퇴출</h2>
                <p className="section-intro">
                  겁을 먹은 병사들은 후방기지로 돌아가고 싶어합니다. 한 턴의 한 번 영령 님은 해당 종족의 지도자로서
                  한밤의 꿈을 통해 두려움과 공포를 안길 수 있습니다. 예를들면...계시를 받은 개똥이는 후방기지에 전서구를 보내
                  보급 준비를 하고 있던 말똥이를 군에서 내보냅니다. 징발되었던 말똥이는 기쁜 마음으로 고향에 돌아 갈 채비를 합니다.
                  하지만, 억울하게도 탈영병으로 몰려 즉결처분을 당하고 맙니다.
                </p>
                <dl>
                  <div><dt>[퇴출]</dt><dd><EmphasizedTerms text="퇴각보다 먼저 이행. <후방기지> 맨 아래에서 <매장지>로 이동 후에 즉시 효과를 이행" /></dd></div>
                  <div><dt>[퇴각]</dt><dd><EmphasizedTerms text="<후방기지> 맨 위로 이동 후에 즉시 효과를 이행" /></dd></div>
                </dl>
              </article>
              <article>
                <p className="eyebrow">combat</p>
                <h2>전투의 처리</h2>
                <p className="section-intro">민초들의 전투는 하등하고 복잡합니다. 영령 님이 승리를 거두려면 명확하게 순서를 파악해야 합니다.</p>
                <ol>
                  {battleSteps.map((step) => <li key={step}><EmphasizedTerms text={step} /></li>)}
                </ol>
              </article>
            </section>

            <section className="rules-section">
              <div className="rules-section-head">
                <p className="eyebrow">keywords</p>
                <h2>진언의 종류</h2>
              </div>
              <p className="section-intro">
                "진언" 은 민초가 갖고 있는 잠재력의 형태입니다. 흔히 영체언어로 "키워드"라고 설명됩니다.
              </p>
              <div className="keyword-chip-list">
                {keywordRules.map(([keyword, body]) => (
                  <button key={keyword} type="button" onClick={() => {
                    setQuery(keyword);
                    setActiveTab("db");
                  }}>
                    <strong>{keyword}</strong>
                    <span><EmphasizedTerms text={body} /></span>
                  </button>
                ))}
              </div>
              <div className="other-keywords">
                <h3>그 외의 키워드</h3>
                <MissingCallout />
                <p>영령님께서 전종족의 지배자가 될 수 있도록 기원하며,<br />저는 이만 물러나겠습니다.</p>
              </div>
            </section>
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
                <article key={item.id} style={{ "--class-stripe": classColors[item.id] ?? "#ffffff" } as CSSProperties}>
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

      {modalCard && (
        <div className="card-modal-backdrop" role="presentation" onClick={() => setModalCardId(null)}>
          <section className="card-modal" role="dialog" aria-modal="true" aria-labelledby="card-modal-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="닫기" onClick={() => setModalCardId(null)}>
              <X />
            </button>
            <CardTile card={modalCard} />
            <div className="modal-copy">
              <p className="eyebrow">{modalCard.serial}</p>
              <h2 id="card-modal-title">{modalCard.name}</h2>
              <dl>
                <div><dt>세력</dt><dd>{modalCard.faction} · {modalCard.className}</dd></div>
                <div><dt>타입</dt><dd>{modalCard.type}</dd></div>
                <div><dt>종족</dt><dd>{modalCard.race || "기록 없음"}</dd></div>
                <div><dt>팩</dt><dd>{modalCard.packName}</dd></div>
                <div><dt>비용 / 힘</dt><dd>{modalCard.cost} / {modalCard.power}</dd></div>
              </dl>
              <div className="modal-rule">
                <strong>효과</strong>
                <p>{modalCard.effect || "효과 없음"}</p>
              </div>
              {modalCard.lore && (
                <div className="modal-lore">
                  <strong>기록</strong>
                  <p>{modalCard.lore}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}
    </main>
  );
}

export default App;
