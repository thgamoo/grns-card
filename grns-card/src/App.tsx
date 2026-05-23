import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import {
  Activity,
  BookOpenText,
  Library,
  Map as MapIcon,
  Printer,
  Search,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
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

type TabId = "intro" | "db" | "rules" | "graph" | "field" | "world";
type CardPartTerm = {
  id: number;
  title: string;
  body: string;
  link?: {
    text: string;
    href: string;
  };
};

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
  { id: "graph", label: "그래프", icon: Activity },
  { id: "field", label: "필드", icon: MapIcon },
  { id: "world", label: "세계관", icon: BookOpenText },
];

const tabPaths: Record<TabId, string> = {
  intro: "/",
  db: "/cards",
  rules: "/rules",
  graph: "/graph",
  field: "/field",
  world: "/world",
};

const worldLinks = [
  {
    href: "./world/docs/overview.md",
    title: "세계관 개요",
    body: "전쟁의 기본 정서와 핵심 질문",
  },
  {
    href: "./world/docs/factions.md",
    title: "팩션",
    body: "예맥, 사로국, 가락, 십제, 중립",
  },
  {
    href: "./world/docs/timeline.md",
    title: "연표",
    body: "드러나는 이면 전후 사건",
  },
  {
    href: "./world/docs/places.md",
    title: "장소",
    body: "변경 성문과 첫 캠페인 지역",
  },
  {
    href: "./world/docs/expansion-01.md",
    title: "드러나는 이면",
    body: "첫 확장팩 배경 문서",
  },
  {
    href: "./world/fiction/prologue.md",
    title: "군웅의 발호",
    body: "서장",
  },
  {
    href: "./world/maps/README.md",
    title: "지도 작업",
    body: "지도",
  },
  {
    href: "./world/data/events.json",
    title: "데이터",
    body: "장소, 팩션, 사건 JSON",
  },
];

// Field board guidelines:
// - Keep these notes out of the rendered UI; the board itself should explain through layout.
// - Battlefield is one section containing five vertical field soldier slots.
// - Castle is one section containing four gatekeeper slots and one lord slot.
// - Forward and rear bases sit outside the castle; the right-side forward base should feel connected to the battlefield without entering it.
// - Position explanations belong in a separate component above the playable board.
// - Print layout should preserve card-slot proportions and avoid prose inside the board.
const battlefieldSlots = [
  {
    id: "front-1",
    name: "야전병",
    note: "가장 왼쪽 진. 문지기 1과 대각으로 맞닿아 장악과 공격 경로를 만든다.",
  },
  {
    id: "front-2",
    name: "야전병",
    note: "문지기 1과 2 사이를 압박하는 진. 양쪽 문지기 중 비어 있는 곳을 노리기 쉽다.",
  },
  {
    id: "front-3",
    name: "야전병",
    note: "중앙 진. 성주로 향하는 압박이 가장 잘 보이는 자리다.",
  },
  {
    id: "front-4",
    name: "야전병",
    note: "문지기 3과 4 사이를 압박하는 진. 이동 후 장악 판단이 자주 일어난다.",
  },
  {
    id: "front-5",
    name: "야전병",
    note: "가장 오른쪽 진. 문지기 4와 대각으로 맞닿아 외곽 공격선을 만든다.",
  },
];

const gateSlots = [
  {
    id: "gate-1",
    name: "문지기 1",
    note: "첫 번째와 두 번째 야전병 사이의 수비점. 비공개로 시작하고 공격받으면 등장한다.",
  },
  {
    id: "gate-2",
    name: "문지기 2",
    note: "두 번째와 세 번째 야전병 사이의 수비점. 중앙으로 향하는 첫 관문이다.",
  },
  {
    id: "gate-3",
    name: "문지기 3",
    note: "세 번째와 네 번째 야전병 사이의 수비점. 성주 주변 전투를 지연시킨다.",
  },
  {
    id: "gate-4",
    name: "문지기 4",
    note: "네 번째와 다섯 번째 야전병 사이의 수비점. 외곽 장악을 막는 마지막 문이다.",
  },
];

const supportZones = [
  {
    name: "군영",
    note: "손패. 출정, 보급병 배치, 퇴출과 공개의 출발점으로 삼는다.",
  },
  {
    name: "징집소",
    note: "덱. 전쟁 시작 시 40장으로 구성하고, 비면 즉시 패배한다.",
  },
  {
    name: "후방기지",
    note: "아직 보급하지 않은 보급병이 머무는 곳. 공격과 이동의 비용을 준비한다.",
  },
  {
    name: "전진기지",
    note: "보급에 사용된 카드가 이동하는 곳. 일부 지원유닛은 이곳에서 자체보급한다.",
  },
  {
    name: "매장지",
    note: "쓰러진 병사와 퇴출된 카드가 가는 공개 더미. 성주가 이곳으로 가면 패배한다.",
  },
];

const fieldPositionNotes = [
  {
    name: "전장",
    note: "야전병 5장이 세로로 서는 구획. 공격, 이동, 장악 판단이 일어나는 전투 중심입니다.",
  },
  {
    name: "성",
    note: "문지기 4장과 성주 1장을 포함하는 구획. 성주는 패배 조건과 직접 연결됩니다.",
  },
  ...supportZones,
];

function tabFromPath(pathname: string): TabId {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const found = Object.entries(tabPaths).find(
    ([, path]) => path === normalized,
  );
  return found ? (found[0] as TabId) : "intro";
}

const cardPartTerms: CardPartTerm[] = [
  {
    id: 1,
    title: "허기",
    body: "이 카드를 <전장>에 배치하기 위한 비용입니다. 왼쪽 위 숫자입니다.",
  },
  {
    id: 2,
    title: "힘",
    body: "전투 시 승패를 결정짓는 수치입니다. 오른쪽 위 숫자입니다.",
  },
  {
    id: 3,
    title: "용모파기",
    body: "영체화가가 그려준 용모파기입니다. 카드 중앙의 일러스트 영역입니다.",
  },
  {
    id: 4,
    title: "종족",
    body: "이 카드의 소속 및 종입니다. 효과 위 네모 칩들입니다.",
  },
  {
    id: 5,
    title: "효과",
    body: '특정 조건에 따라 이행합니다. 카드가 "지원" 유닛이라면 보급로에서 효과를 이행하며, "매복" 유닛이라면 매복 시 효과를 이행합니다.',
    link: {
      text: "전투의 처리",
      href: "#combat-resolution",
    },
  },
  {
    id: 6,
    title: "종류",
    body: '3종류로 이루어져 있습니다. "일반", "지원", "매복"입니다.',
  },
  {
    id: 7,
    title: "소속문양",
    body: "이 카드의 소속을 나타내는 문양입니다.",
  },
];

const warPrepSections = [
  {
    title: "징집소 구축",
    intro:
      "전쟁을 시작하려면 군역을 징발해야합니다. 민초들의 잠재력을 살펴보고 징집소를 세우세요.",
    items: [
      "징집소 - 덱. 40장으로 구성해야함.",
      "같은 카드는 최대 3장까지 넣을 수 있음.",
    ],
  },
  {
    title: "패배 조건 인지",
    intro: "다른 영령들과 전쟁에서 패배하지 않도록 미리 살펴보세요.",
    items: [
      '"성주"가 매장지로 이동한 경우 즉시 패배한다.',
      '"징집소"에 병사가 없는 경우 즉시 패배한다.',
    ],
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
  {
    title: "정비 페이즈",
    body: "전진기지로 옮겼던 보급병들을 후방기지로 재위치 시키기. <휴식> 상태였던 <전장>의 병사를 <대기> 상태로 바꾸기.",
  },
  {
    title: "징집 페이즈",
    body: "<징집소>에서 <군영>으로 카드를 2장 <징집>하기. 단, 선공은 첫 턴에 징집할 수 없다.",
  },
  {
    title: "보급병 배치 페이즈",
    body: "<군영>에서 <후방기지>로 <보급병>으로 사용할 카드 1장 또는 0장을 내려놓기.",
  },
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
  '문지기 등장 선언 - 내려놓는 위치가 문지기일 경우 "매복 선언"이 아닌 "문지기 등장" 선언으로 간주. 이 경우 [문지기 등장] 진언이 붙은 카드만 매복효과로 이행할 수 있음.',
  "상시 효과 이행 - 현재 상태에서 이행되는 상시효과를 전투에 적용.",
  "매복 효과 이행 - 상대가 배치한 <매복> 카드의 효과를 이행.",
  "문지기 등장 - 공격받은 유닛이 문지기였다면 진행. 등장 시 상시 효과가 있다면 선이행. 매복 카드였다면 매복효과 추가 이행. 뒤집힌 문지기일 경우 뒤집으면서 등장 후 비용없이 이행.",
  "힘겨루기 - 힘이 낮은 유닛이 <매장지>로 이동. 힘이 같다면, 공격자가 1장 군영에서 <희생> 하는 것으로 힘이 낮은 유닛을 <매장지>로 이동. 그렇게 하지 않을 경우 둘 다 생존.",
];

const keywordRules = [
  ["[출정]", "<전장>으로 배치 시 효과를 이행"],
  ["[단말마]", "<전장> 혹은 <성>에서 <매장지>로 이동하였을 경우 효과를 이행"],
  ["[자체보급]", "해당 유닛을 <보급> 하여 효과를 발동"],
  ["[상시]", "조건을 만족하는 동안 지속적으로 효과를 적용"],
  ["[전투광]", "공격 선언 시 <보급> 하지 않는다."],
  ["[강화]", "지정한 유닛 힘 +X"],
  ["[약화]", "지정한 유닛 힘 -X. 단 약화로 힘이 0 이하로 감소할 수 없다."],
  ["[퇴출 X]", "<군영> 또는 <징집소>에서 X 만큼 <매장지>로 이동"],
  ["[공개 X]", "<군영>의 카드 X장을 공개한다."],
  [
    "[문지기 등장]",
    "<비공개> 상태에서 <문지기> 위치로 배치 되었을 경우 효과를 이행",
  ],
  ["[퇴각]", "<퇴각> 할 경우 효과를 이행"],
  ["[퇴출]", "<퇴출> 될 경우 효과를 이행"],
];

async function fetchJson<T>(file: string): Promise<T> {
  const response = await fetch(file.replace(/^\.\/data\//, "./data/"), {
    cache: "no-store",
  });
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
      const cards = await fetchJson<
        Omit<Card, "packId" | "packName" | "classMark" | "classStripe">[]
      >(source.file);
      const classInfo = classes.find((item) => item.id === source.classId);
      return cards.map((card) => ({
        ...card,
        classMark: classInfo?.mark ?? fallbackClassMarks[card.classId] ?? "◇",
        classStripe:
          classInfo?.stripe ?? classColors[card.classId] ?? "#ffffff",
        packId: source.packId,
        packName: packName(source.packId, expansions),
      }));
    }),
  );
  return { version, classes, expansions, cards: groups.flat() };
}

function keywords(effect: string) {
  return Array.from(
    new Set(
      (effect.match(/\[[^\]]+\]/g) ?? []).map((item) => item.slice(1, -1)),
    ),
  );
}

function angleTerms(effect: string) {
  return Array.from(
    new Set(
      (effect.match(/<[^>]+>/g) ?? []).map((item) => item.slice(1, -1)),
    ),
  );
}

function cardTags(card: Card) {
  return Array.from(
    new Set(
      [
        card.faction,
        card.race,
        ...card.race.split(/[\/,·\s]+/),
        ...keywords(card.effect),
        ...angleTerms(card.effect),
      ]
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function primaryRace(card: Card) {
  return card.race.split(/[\/,·\s]+/).find(Boolean) ?? "";
}

function hashNumber(value: string) {
  return Array.from(value).reduce(
    (total, char) => (total * 31 + char.charCodeAt(0)) % 9973,
    7,
  );
}

function buildGraphEdges(cards: Card[]) {
  const edges: Array<{
    source: string;
    target: string;
    kind: "curve" | "synergy";
  }> = [];
  const seen = new Set<string>();
  const classGroups = cards.reduce((groups, card) => {
    const items = groups.get(card.classId) ?? [];
    items.push(card);
    groups.set(card.classId, items);
    return groups;
  }, new Map<string, Card[]>());

  const addEdge = (
    source?: Card,
    target?: Card,
    kind: "curve" | "synergy" = "curve",
  ) => {
    if (!source || !target || source.id === target.id) return;
    const key = `${source.id}->${target.id}:${kind}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ source: source.id, target: target.id, kind });
  };

  classGroups.forEach((classCards) => {
    const sorted = [...classCards].sort(
      (a, b) => a.cost - b.cost || a.power - b.power,
    );
    sorted.forEach((card, index) => addEdge(card, sorted[index + 1]));
  });

  cards.forEach((source) => {
    const sourceKeywords = new Set(keywords(source.effect));
    const targets = cards
      .filter((target) => {
        if (target.id === source.id || target.classId !== source.classId)
          return false;
        const race = primaryRace(target);
        if (race && source.effect.includes(race)) return true;
        return keywords(target.effect).some((keyword) =>
          sourceKeywords.has(keyword),
        );
      })
      .slice(0, 2);

    targets.forEach((target) => addEdge(source, target, "synergy"));
  });

  return edges.slice(0, 120);
}

function normalizeKeyword(keyword: string) {
  return keyword.replace(/^(강화|약화|공개|희생)\s+(X|\d+)$/i, "$1");
}

function matchesKeywordFilter(cardKeywords: string[], filter: string) {
  return cardKeywords.some(
    (keyword) =>
      keyword === filter ||
      normalizeKeyword(keyword) === normalizeKeyword(filter),
  );
}

function normalizeKeywordQuery(query: string) {
  return normalizeKeyword(query.replace(/^\[|\]$/g, "").trim());
}

function CardTile({ card, onClick }: { card: Card; onClick?: () => void }) {
  const compactName =
    card.name.length > 9
      ? " name-compact"
      : card.name.length > 6
        ? " name-small"
        : "";

  return (
    <button
      className="card-tile"
      style={
        {
          "--class-stripe":
            card.classStripe || classColors[card.classId] || "#ffffff",
        } as CSSProperties
      }
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
        <span className="card-effect">
          <EmphasizedTerms text={card.effect || "효과 없음"} />
        </span>
        <span className="card-serial">{card.serial}</span>
        <span className="card-type">{card.type}</span>
        <span className="card-mark">
          {card.classMark || fallbackClassMarks[card.classId] || "◇"}
        </span>
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
    <button
      className={active ? "filter-chip active" : "filter-chip"}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function EmphasizedTerms({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(<[^>]+>|\[[^\]]+\])/g)
        .map((part, index) =>
          /^<[^>]+>$|^\[[^\]]+\]$/.test(part) ? (
            <strong key={`${part}-${index}`}>{part}</strong>
          ) : (
            part
          ),
        )}
    </>
  );
}

function MarkdownView({ source }: { source: string }) {
  const blocks = source.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="markdown-view">
      {blocks.map((block, index) => {
        if (block.startsWith("# ")) {
          return <h1 key={index}>{block.replace(/^# /, "")}</h1>;
        }

        if (block.startsWith("## ")) {
          return <h2 key={index}>{block.replace(/^## /, "")}</h2>;
        }

        if (block.startsWith("### ")) {
          return <h3 key={index}>{block.replace(/^### /, "")}</h3>;
        }

        if (block.startsWith("```")) {
          const code = block
            .replace(/^```[a-z]*\n?/i, "")
            .replace(/\n?```$/, "");

          return (
            <pre key={index}>
              <code>{code}</code>
            </pre>
          );
        }

        if (block.startsWith("- ") || block.includes("\n- ")) {
          const items = block
            .split("\n")
            .filter((line) => line.startsWith("- "))
            .map((line) => line.replace(/^- /, ""));

          return (
            <ul key={index}>
              {items.map((item) => (
                <li key={item}>
                  <EmphasizedTerms text={item} />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index}>
            <EmphasizedTerms text={block.replace(/\n/g, " ")} />
          </p>
        );
      })}
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
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    tabFromPath(window.location.pathname),
  );
  const [query, setQuery] = useState("");
  const [classIds, setClassIds] = useState<string[]>([]);
  const [packIds, setPackIds] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [keywordFilters, setKeywordFilters] = useState<string[]>([]);
  const [otherFilters, setOtherFilters] = useState<string[]>([]);
  const [graphClassId, setGraphClassId] = useState("all");
  const [graphType, setGraphType] = useState("전체");
  const [graphTag, setGraphTag] = useState("전체");
  const [modalCardId, setModalCardId] = useState<string | null>(null);
  const [rulebookMarkdown, setRulebookMarkdown] = useState("");
  const [showRulebook, setShowRulebook] = useState(false);
  const [worldDocIndex, setWorldDocIndex] = useState(0);
  const [worldMarkdown, setWorldMarkdown] = useState("");
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
    const handlePopState = () => {
      setActiveTab(tabFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTab = (tabId: TabId) => {
    const nextPath = tabPaths[tabId];
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, "", nextPath);
    }
    setActiveTab(tabId);
  };

  useEffect(() => {
    fetch("./docs/rulebook.md", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("룰북 로드 실패");
        return response.text();
      })
      .then(setRulebookMarkdown)
      .catch(() =>
        setRulebookMarkdown(
          "# 괴력난신 룰북\n\n룰북 문서를 불러오지 못했습니다.",
        ),
      );
  }, []);

  useEffect(() => {
    const selectedDoc = worldLinks[worldDocIndex];
    if (!selectedDoc) return;

    fetch(selectedDoc.href, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("세계관 문서 로드 실패");
        return response.text();
      })
      .then((source) => {
        const trimmed = source.trim();
        if (!trimmed) {
          setWorldMarkdown(`# ${selectedDoc.title}\n\n아직 작성된 내용이 없습니다.`);
          return;
        }

        if (selectedDoc.href.endsWith(".json")) {
          setWorldMarkdown(`# ${selectedDoc.title}\n\n\`\`\`json\n${trimmed}\n\`\`\``);
          return;
        }

        setWorldMarkdown(trimmed);
      })
      .catch(() =>
        setWorldMarkdown(
          `# ${selectedDoc.title}\n\n세계관 문서를 불러오지 못했습니다.`,
        ),
      );
  }, [worldDocIndex]);

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
  const cardTypes = useMemo(
    () => Array.from(new Set(cards.map((card) => card.type))),
    [cards],
  );
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
    const queryKeyword = normalizeKeywordQuery(query);
    return cards.filter((card) => {
      const haystack =
        `${card.name} ${card.effect} ${card.race} ${card.faction} ${card.className} ${card.theme}`.toLowerCase();
      const cardKeywords = keywords(card.effect);
      const cardAngleTerms = angleTerms(card.effect);
      return (
        (!normalized ||
          haystack.includes(normalized) ||
          matchesKeywordFilter(cardKeywords, queryKeyword)) &&
        (classIds.length === 0 || classIds.includes(card.classId)) &&
        (packIds.length === 0 || packIds.includes(card.packId)) &&
        (types.length === 0 || types.includes(card.type)) &&
        keywordFilters.every(
          (keyword) =>
            haystack.includes(keyword.toLowerCase()) ||
            matchesKeywordFilter(cardKeywords, keyword),
        ) &&
        otherFilters.every((term) => cardAngleTerms.includes(term))
      );
    });
  }, [cards, classIds, keywordFilters, otherFilters, packIds, query, types]);

  const keywordCounts = useMemo(() => {
    const counts = new Map<string, number>();
    cards
      .flatMap((card) => keywords(card.effect))
      .map(normalizeKeyword)
      .forEach((keyword) =>
        counts.set(keyword, (counts.get(keyword) ?? 0) + 1),
      );
    return Array.from(counts, ([keyword, count]) => ({ keyword, count })).sort(
      (a, b) => b.count - a.count,
    );
  }, [cards]);

  const otherTermCounts = useMemo(() => {
    const counts = new Map<string, number>();
    cards
      .flatMap((card) => angleTerms(card.effect))
      .forEach((term) => counts.set(term, (counts.get(term) ?? 0) + 1));
    return Array.from(counts, ([term, count]) => ({ term, count })).sort(
      (a, b) => b.count - a.count,
    );
  }, [cards]);

  const graphTags = useMemo(() => {
    return Array.from(new Set(cards.flatMap(cardTags))).sort((a, b) =>
      a.localeCompare(b, "ko"),
    );
  }, [cards]);

  const graphCards = useMemo(() => {
    return cards.filter((card) => {
      return (
        (graphClassId === "all" || card.classId === graphClassId) &&
        (graphType === "전체" || card.type === graphType) &&
        (graphTag === "전체" || cardTags(card).includes(graphTag))
      );
    });
  }, [cards, graphClassId, graphTag, graphType]);

  const graphData = useMemo(() => {
    const width = 960;
    const height = 540;
    const margin = { top: 44, right: 48, bottom: 52, left: 62 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const maxCost = Math.ceil(
      Math.max(1, ...graphCards.map((card) => card.cost || 0)),
    );
    const maxPower = Math.ceil(
      Math.max(1, ...graphCards.map((card) => card.power || 0)),
    );
    const nodes = graphCards.map((card) => {
      const hash = hashNumber(card.id);
      const jitterX = (hash % 19) - 9;
      const jitterY = ((Math.floor(hash / 19) % 19) - 9) * 0.85;
      return {
        card,
        x: margin.left + (card.cost / maxCost) * plotWidth + jitterX,
        y: margin.top + (1 - card.power / maxPower) * plotHeight + jitterY,
        radius:
          card.type === "매복유닛" ? 7 : card.type === "지원유닛" ? 8 : 6.5,
        color: card.classStripe || classColors[card.classId] || "#ffffff",
      };
    });
    const nodeById = new Map(nodes.map((node) => [node.card.id, node]));
    const edges = buildGraphEdges(graphCards);
    const costTicks = Array.from(
      { length: maxCost + 1 },
      (_, cost) => cost,
    ).filter((cost) => cost === 0 || cost === maxCost || cost % 2 === 0);
    const powerTicks = Array.from(
      { length: maxPower + 1 },
      (_, power) => power,
    ).filter((power) => power === 0 || power === maxPower || power % 2 === 0);

    return {
      width,
      height,
      margin,
      plotWidth,
      plotHeight,
      maxCost,
      maxPower,
      nodes,
      nodeById,
      edges,
      costTicks,
      powerTicks,
    };
  }, [graphCards]);

  const graphMetrics = useMemo(() => {
    const averageCost =
      graphCards.reduce((sum, card) => sum + card.cost, 0) /
      (graphCards.length || 1);
    const averagePower =
      graphCards.reduce((sum, card) => sum + card.power, 0) /
      (graphCards.length || 1);
    const typeCounts = graphCards.reduce((counts, card) => {
      counts.set(card.type, (counts.get(card.type) ?? 0) + 1);
      return counts;
    }, new Map<string, number>());
    const topKeywords = Array.from(
      graphCards
        .flatMap((card) => keywords(card.effect))
        .reduce((counts, keyword) => {
          const normalized = normalizeKeyword(keyword);
          counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
          return counts;
        }, new Map<string, number>()),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { averageCost, averagePower, typeCounts, topKeywords };
  }, [graphCards]);

  const modalCard = cards.find((card) => card.id === modalCardId);
  const sampleCard =
    cards.find((card) => card.serial === "GRNS-0009") ?? cards[0];

  return (
    <main className="site-shell">
      <header className="site-header">
        <button
          className="brand"
          type="button"
          onClick={() => navigateTab("intro")}
        >
          괴력난신
        </button>
        <nav className="tab-nav" aria-label="페이지 탭">
          {tabs.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={tabPaths[id]}
              className={activeTab === id ? "active" : ""}
              onClick={(event) => {
                event.preventDefault();
                navigateTab(id);
              }}
            >
              <Icon />
              {label}
            </a>
          ))}
        </nav>
        <label className="version-picker">
          <span>카드 버전</span>
          <select
            value={versionId}
            onChange={(event) => setVersionId(event.target.value)}
            aria-label="카드 버전"
          >
            {manifest?.versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.createdAt}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="tab-stage">
        {activeTab === "intro" && (
          <div className="intro-view">
            <div className="intro-copy">
              <p className="eyebrow">한국형 판타지 TCG</p>
              <h1>괴력난신</h1>
              <p>
                사실 군자께서는 괴이와 용력, 반란과 귀신이 역사의 이면이라
                하셨다.
              </p>
              <div className="intro-actions">
                <button type="button" onClick={() => navigateTab("db")}>
                  카드 DB
                </button>
                <button type="button" onClick={() => navigateTab("rules")}>
                  룰 보기
                </button>
              </div>
            </div>
            <div className="hero-board" aria-hidden="true">
              <span className="lane north"></span>
              <span className="lane south"></span>
              <span className="lane east"></span>
              <span className="lane west"></span>
              <span className="lord">城主</span>
              <span className="gate gate-a"></span>
              <span className="gate gate-b"></span>
              <span className="gate gate-c"></span>
              <span className="gate gate-d"></span>
            </div>
            <div className="intro-stats" aria-label="통계">
              <span>
                <strong>{cards.length || "..."}</strong> Cards
              </span>
              <span>
                <strong>{classes.length || "..."}</strong> Factions
              </span>
            </div>
          </div>
        )}

        {activeTab === "db" && (
          <div className="db-view">
            <aside className="db-filters">
              <p className="eyebrow">card database</p>
              <h2 className="db-filter-title">필터</h2>
              <label className="search-box">
                <Search />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="카드명, 효과, 종족"
                />
              </label>
              <div className="filter-hint">
                선택한 조건은 AND로 적용됩니다. 같은 묶음 안에서는 하나 이상과
                일치하면 통과합니다.
              </div>
              <div className="filter-group">
                <span>세력</span>
                <div className="chip-list">
                  {classes.map((item) => (
                    <FilterChip
                      key={item.id}
                      active={classIds.includes(item.id)}
                      onClick={() =>
                        setClassIds((current) => toggleValue(current, item.id))
                      }
                    >
                      {item.faction}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span>팩</span>
                <div className="chip-list">
                  {packs.map((item) => (
                    <FilterChip
                      key={item.id}
                      active={packIds.includes(item.id)}
                      onClick={() =>
                        setPackIds((current) => toggleValue(current, item.id))
                      }
                    >
                      {item.name}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span>타입</span>
                <div className="chip-list">
                  {cardTypes.map((item) => (
                    <FilterChip
                      key={item}
                      active={types.includes(item)}
                      onClick={() =>
                        setTypes((current) => toggleValue(current, item))
                      }
                    >
                      {item}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span>키워드</span>
                <div className="chip-list keyword-chips">
                  {keywordCounts.slice(0, 18).map((item) => (
                    <FilterChip
                      key={item.keyword}
                      active={keywordFilters.includes(item.keyword)}
                      onClick={() =>
                        setKeywordFilters((current) =>
                          toggleValue(current, item.keyword),
                        )
                      }
                    >
                      [{item.keyword}] <span>{item.count}</span>
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span>그 외</span>
                <div className="chip-list keyword-chips">
                  {otherTermCounts.slice(0, 18).map((item) => (
                    <FilterChip
                      key={item.term}
                      active={otherFilters.includes(item.term)}
                      onClick={() =>
                        setOtherFilters((current) =>
                          toggleValue(current, item.term),
                        )
                      }
                    >
                      &lt;{item.term}&gt; <span>{item.count}</span>
                    </FilterChip>
                  ))}
                </div>
              </div>
              {Boolean(
                query ||
                classIds.length ||
                packIds.length ||
                types.length ||
                keywordFilters.length ||
                otherFilters.length,
              ) && (
                <button
                  className="clear-filters"
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setClassIds([]);
                    setPackIds([]);
                    setTypes([]);
                    setKeywordFilters([]);
                    setOtherFilters([]);
                  }}
                >
                  필터 초기화
                </button>
              )}
            </aside>
            <section className="db-grid" aria-label="카드 목록">
              <div className="panel-head">
                <span>{filteredCards.length}장</span>
                <div className="panel-actions">
                  <span>{dbState?.version.label}</span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    disabled={filteredCards.length === 0}
                  >
                    <Printer />
                    A4 프린트
                  </button>
                </div>
              </div>
              <div className="card-grid">
                {filteredCards.map((card) => (
                  <CardTile
                    key={card.id}
                    card={card}
                    onClick={() => setModalCardId(card.id)}
                  />
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
                괴력난신의 세계에 오신 것을 환영합니다, 영령 님. 당신은 각
                종족의 수호자로서 전쟁을 주관하고 무릇 만민의 숭배를 받으실
                겁니다. 제가 어떻게 계시를 내려야 하는지 말씀 올리겠습니다.
                이해하기 쉽도록 영체언어 (ex. 카드) 로 부가 설명을
                덧붙이겠습니다.
              </p>
              <div className="rules-link-grid">
                <button
                  type="button"
                  onClick={() => setShowRulebook((current) => !current)}
                >
                  <BookOpenText />
                  룰북
                </button>
                <button type="button" onClick={() => navigateTab("field")}>
                  <MapIcon />
                  필드 판
                </button>
              </div>
              {showRulebook && (
                <aside
                  className="rulebook-reader"
                  id="rulebook-reader"
                  aria-label="룰북"
                >
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
                민초들은 매일 굶주려 있습니다. 당신이 식량을 제공해주신다면
                잠재되어 있는 힘을 낼 수 있을 것입니다. 각 종족의 우두머리에게
                계시를 내려 병사를 징집하고 식량을 하사하여 전쟁에 매혹시키세요.
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
                    <article
                      key={term.id}
                      className={term.id === 5 ? "wide" : ""}
                    >
                      <span>{term.id}</span>
                      <h3>{term.title}</h3>
                      <p>
                        <EmphasizedTerms text={term.body} />
                        {term.link && (
                          <>
                            {" "}
                            <a
                              className="term-inline-link"
                              href={term.link.href}
                            >
                              {term.link.text}
                            </a>{" "}
                            섹션 참고
                          </>
                        )}
                      </p>
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
                    <h3>
                      {index + 1}. {section.title}
                    </h3>
                    <p>
                      <EmphasizedTerms text={section.intro} />
                    </p>
                    <ol>
                      {section.items.map((item) => (
                        <li key={item}>
                          <EmphasizedTerms text={item} />
                        </li>
                      ))}
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
                      <h3>{phase.title}</h3>
                      <p>
                        <EmphasizedTerms text={phase.body} />
                      </p>
                      {phase.actions && (
                        <ol>
                          {phase.actions.map((action) => (
                            <li key={action}>
                              <EmphasizedTerms text={action} />
                            </li>
                          ))}
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
                  겁을 먹은 병사들은 후방기지로 돌아가고 싶어합니다. 한 턴의 한
                  번 영령 님은 해당 종족의 지도자로서 한밤의 꿈을 통해 두려움과
                  공포를 안길 수 있습니다. 예를들면...계시를 받은 개똥이는
                  후방기지에 전서구를 보내 보급 준비를 하고 있던 말똥이를 군에서
                  내보냅니다. 징발되었던 말똥이는 기쁜 마음으로 고향에 돌아 갈
                  채비를 합니다. 하지만, 억울하게도 탈영병으로 몰려 즉결처분을
                  당하고 맙니다.
                </p>
                <dl>
                  <div>
                    <dt>[퇴출]</dt>
                    <dd>
                      <EmphasizedTerms text="퇴각보다 먼저 이행. <후방기지> 맨 아래에서 <매장지>로 이동 후에 즉시 효과를 이행" />
                    </dd>
                  </div>
                  <div>
                    <dt>[퇴각]</dt>
                    <dd>
                      <EmphasizedTerms text="<후방기지> 맨 위로 이동 후에 즉시 효과를 이행" />
                    </dd>
                  </div>
                </dl>
              </article>
              <article id="combat-resolution">
                <p className="eyebrow">combat</p>
                <h2>전투의 처리</h2>
                <p className="section-intro">
                  민초들의 전투는 하등하고 복잡합니다. 영령 님이 승리를 거두려면
                  명확하게 순서를 파악해야 합니다.
                </p>
                <ol>
                  {battleSteps.map((step) => (
                    <li key={step}>
                      <EmphasizedTerms text={step} />
                    </li>
                  ))}
                </ol>
              </article>
            </section>

            <section className="rules-section">
              <div className="rules-section-head">
                <p className="eyebrow">keywords</p>
                <h2>진언의 종류</h2>
              </div>
              <p className="section-intro">
                "진언" 은 민초가 갖고 있는 잠재력의 형태입니다. 흔히 영체언어로
                "키워드"라고 설명됩니다.
              </p>
              <div className="keyword-chip-list">
                {keywordRules.map(([keyword]) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setKeywordFilters([keyword.replace(/^\[|\]$/g, "")]);
                      navigateTab("db");
                    }}
                  >
                    <strong>{keyword}</strong>
                  </button>
                ))}
              </div>
              <div className="keyword-description-list">
                {keywordRules.map(([keyword, body]) => (
                  <p key={keyword}>
                    <strong>{keyword}</strong> - <EmphasizedTerms text={body} />
                  </p>
                ))}
              </div>
              <div className="other-keywords">
                <h3>그 외의 키워드</h3>
                <MissingCallout />
              </div>
            </section>

            <section className="rules-section">
              <div className="rules-section-head">
                <p className="eyebrow">closing</p>
                <h2>끝으로</h2>
              </div>
              <p>
                영령님께서 전종족의 지배자가 될 수 있도록 기원하며,
                <br />
                저는 이만 물러나겠습니다.
              </p>
            </section>
          </div>
        )}

        {activeTab === "graph" && (
          <div className="graph-view">
            <section
              className="level-graph-section"
              aria-label="레벨디자인 그래프"
            >
              <div className="level-graph-head">
                <div>
                  <p className="eyebrow">level design graph</p>
                  <h2>카드 노드 그래프</h2>
                </div>
                <span>{dbState?.version.label ?? "불러오는 중"}</span>
              </div>

              <div className="graph-filter-bar" aria-label="그래프 필터">
                <label>
                  세력
                  <select
                    value={graphClassId}
                    onChange={(event) => setGraphClassId(event.target.value)}
                  >
                    <option value="all">전체</option>
                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.faction}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  카드 타입
                  <select
                    value={graphType}
                    onChange={(event) => setGraphType(event.target.value)}
                  >
                    <option value="전체">전체</option>
                    {cardTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  태그
                  <select
                    value={graphTag}
                    onChange={(event) => setGraphTag(event.target.value)}
                  >
                    <option value="전체">전체</option>
                    {graphTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setGraphClassId("all");
                    setGraphType("전체");
                    setGraphTag("전체");
                  }}
                >
                  초기화
                </button>
              </div>

              <div className="level-graph-layout">
                <div className="graph-panel">
                  <svg
                    className="level-graph"
                    viewBox="0 0 960 540"
                    role="img"
                    aria-label="카드 비용과 힘을 기준으로 한 노드 그래프"
                  >
                    {graphCards.length === 0 ? (
                      <>
                        <rect
                          x="1"
                          y="1"
                          width="958"
                          height="538"
                          className="graph-empty-bg"
                        />
                        <text
                          x="480"
                          y="258"
                          textAnchor="middle"
                          className="graph-empty"
                        >
                          그래프 필터와 일치하는 카드가 없습니다.
                        </text>
                        <text
                          x="480"
                          y="288"
                          textAnchor="middle"
                          className="graph-empty-help"
                        >
                          세력, 타입, 태그 조건을 조정하세요.
                        </text>
                      </>
                    ) : (
                      <>
                        <g className="graph-axis">
                          <line
                            x1={graphData.margin.left}
                            y1={graphData.height - graphData.margin.bottom}
                            x2={graphData.width - graphData.margin.right}
                            y2={graphData.height - graphData.margin.bottom}
                          />
                          <line
                            x1={graphData.margin.left}
                            y1={graphData.margin.top}
                            x2={graphData.margin.left}
                            y2={graphData.height - graphData.margin.bottom}
                          />
                          {graphData.costTicks.map((cost) => {
                            const x =
                              graphData.margin.left +
                              (cost / graphData.maxCost) * graphData.plotWidth;
                            return (
                              <g key={`cost-${cost}`}>
                                <line
                                  className="graph-grid"
                                  x1={x}
                                  y1={graphData.margin.top}
                                  x2={x}
                                  y2={
                                    graphData.height - graphData.margin.bottom
                                  }
                                />
                                <text
                                  x={x}
                                  y={graphData.height - 18}
                                  textAnchor="middle"
                                >
                                  {cost}
                                </text>
                              </g>
                            );
                          })}
                          {graphData.powerTicks.map((power) => {
                            const y =
                              graphData.margin.top +
                              (1 - power / graphData.maxPower) *
                                graphData.plotHeight;
                            return (
                              <g key={`power-${power}`}>
                                <line
                                  className="graph-grid"
                                  x1={graphData.margin.left}
                                  y1={y}
                                  x2={graphData.width - graphData.margin.right}
                                  y2={y}
                                />
                                <text x="34" y={y + 4} textAnchor="middle">
                                  {power}
                                </text>
                              </g>
                            );
                          })}
                          <text
                            x={graphData.width / 2}
                            y={graphData.height - 4}
                            textAnchor="middle"
                          >
                            허기
                          </text>
                          <text
                            x="18"
                            y={graphData.height / 2}
                            textAnchor="middle"
                            transform={`rotate(-90 18 ${graphData.height / 2})`}
                          >
                            힘
                          </text>
                        </g>
                        <g className="graph-edges">
                          {graphData.edges.map((edge) => {
                            const source = graphData.nodeById.get(edge.source);
                            const target = graphData.nodeById.get(edge.target);
                            if (!source || !target) return null;
                            return (
                              <line
                                key={`${edge.source}-${edge.target}-${edge.kind}`}
                                className={`graph-edge graph-edge-${edge.kind}`}
                                x1={source.x}
                                y1={source.y}
                                x2={target.x}
                                y2={target.y}
                              />
                            );
                          })}
                        </g>
                        <g className="graph-nodes">
                          {graphData.nodes.map((node) => {
                            const label = `${node.card.name} · 허기 ${node.card.cost} / 힘 ${node.card.power}`;
                            const openGraphCard = () =>
                              setModalCardId(node.card.id);
                            const handleGraphKeyDown = (
                              event: KeyboardEvent<SVGElement>,
                            ) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openGraphCard();
                              }
                            };
                            if (node.card.type === "매복유닛") {
                              return (
                                <rect
                                  key={node.card.id}
                                  className="graph-node"
                                  role="button"
                                  tabIndex={0}
                                  aria-label={label}
                                  onClick={openGraphCard}
                                  onKeyDown={handleGraphKeyDown}
                                  x={node.x - node.radius}
                                  y={node.y - node.radius}
                                  width={node.radius * 2}
                                  height={node.radius * 2}
                                  fill={node.color}
                                >
                                  <title>{label}</title>
                                </rect>
                              );
                            }
                            if (node.card.type === "지원유닛") {
                              const points = `${node.x},${node.y - node.radius} ${
                                node.x + node.radius
                              },${node.y} ${node.x},${node.y + node.radius} ${
                                node.x - node.radius
                              },${node.y}`;
                              return (
                                <polygon
                                  key={node.card.id}
                                  className="graph-node"
                                  role="button"
                                  tabIndex={0}
                                  aria-label={label}
                                  onClick={openGraphCard}
                                  onKeyDown={handleGraphKeyDown}
                                  points={points}
                                  fill={node.color}
                                >
                                  <title>{label}</title>
                                </polygon>
                              );
                            }
                            return (
                              <circle
                                key={node.card.id}
                                className="graph-node"
                                role="button"
                                tabIndex={0}
                                aria-label={label}
                                onClick={openGraphCard}
                                onKeyDown={handleGraphKeyDown}
                                cx={node.x}
                                cy={node.y}
                                r={node.radius}
                                fill={node.color}
                              >
                                <title>{label}</title>
                              </circle>
                            );
                          })}
                        </g>
                      </>
                    )}
                  </svg>
                </div>
                <aside className="graph-side">
                  <div className="graph-metrics">
                    <div>
                      <strong>{graphCards.length}</strong>
                      <span>노드</span>
                    </div>
                    <div>
                      <strong>{graphData.edges.length}</strong>
                      <span>연결</span>
                    </div>
                    <div>
                      <strong>{graphMetrics.averageCost.toFixed(1)}</strong>
                      <span>평균 허기</span>
                    </div>
                    <div>
                      <strong>{graphMetrics.averagePower.toFixed(1)}</strong>
                      <span>평균 힘</span>
                    </div>
                  </div>
                  <div className="graph-legend">
                    <h3>범례</h3>
                    <p>
                      가로축은 허기, 세로축은 힘입니다. 원은 일반유닛, 사각형은
                      매복유닛, 마름모는 지원유닛입니다.
                    </p>
                    <div className="graph-type-counts">
                      {Array.from(graphMetrics.typeCounts).map(
                        ([type, count]) => (
                          <span key={type}>
                            {type} {count}
                          </span>
                        ),
                      )}
                    </div>
                    <div className="graph-keywords">
                      {graphMetrics.topKeywords.map(([keyword, count]) => (
                        <span key={keyword}>
                          <strong>[{keyword}]</strong> {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
            </section>
          </div>
        )}

        {activeTab === "field" && (
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

            <section
              className="field-position-notes"
              aria-label="필드 위치 설명"
            >
              {fieldPositionNotes.map((zone) => (
                <article key={zone.name}>
                  <strong>{zone.name}</strong>
                  <p>{zone.note}</p>
                </article>
              ))}
            </section>

            <section className="field-board-react" aria-label="필드 판">
              <header className="field-title-react">
                <p>괴력난신 필드판</p>
              </header>

              <section className="battlefield-zone-react" aria-label="전장">
                <div className="field-zone-label">
                  <strong>전장</strong>
                  <span>야전병 5장 · &lt;대기&gt; 세로 / &lt;정비&gt; 가로</span>
                </div>
                <div className="field-unit-slots">
                  {battlefieldSlots.map((slot, index) => (
                    <span key={slot.id} className={`field-soldier-${index + 1}`}>
                      야전병 {index + 1}
                    </span>
                  ))}
                </div>
              </section>

              <section className="castle-zone-react" aria-label="성">
                <div className="gate-zone-react">
                  <div className="field-zone-label">
                    <strong>성</strong>
                    <span>문지기 4</span>
                  </div>
                  <div className="field-gate-row">
                    {gateSlots.map((slot) => (
                      <span key={slot.id}>{slot.name}</span>
                    ))}
                  </div>
                </div>
                <div className="lord-zone-react">
                  <div className="field-zone-label">
                    <strong>성</strong>
                    <span>성주</span>
                  </div>
                  <div className="lord-slot-react">성주</div>
                </div>
              </section>

              <section
                className="resource-zone-react"
                aria-label="성 외곽 기지"
              >
                <div className="camp-slot-react">
                  <strong>후방기지</strong>
                  <span>보급 전 자원</span>
                </div>
                <div className="camp-slot-react">
                  <strong>전진기지</strong>
                  <span>야전과 이어진 보급</span>
                </div>
              </section>

              <section
                className="side-zones-react"
                aria-label="징집소와 매장지"
              >
                <div>
                  <strong>징집소</strong>
                  <span>덱</span>
                </div>
                <div>
                  <strong>매장지</strong>
                  <span>공개 트래시</span>
                </div>
              </section>
            </section>
          </div>
        )}

        {activeTab === "world" && (
          <div className="world-view">
            <div className="world-head">
              <p className="eyebrow">world</p>
              <h2>괴력난신 세계서</h2>
              <p>
                이곳에서는 지도, 팩션 관계, 연표, 단편 소설, 장소 데이터를
                확인할 수 있습니다.
              </p>
            </div>
            <div className="world-doc-layout">
              <nav className="world-doc-list" aria-label="세계관 문서 목록">
                {worldLinks.map((link, index) => (
                  <button
                    key={link.href}
                    type="button"
                    className={worldDocIndex === index ? "active" : ""}
                    onClick={() => setWorldDocIndex(index)}
                  >
                    <strong>{link.title}</strong>
                    <span>{link.body}</span>
                  </button>
                ))}
              </nav>
              <article className="world-doc-reader">
                <MarkdownView source={worldMarkdown} />
              </article>
            </div>
          </div>
        )}
      </section>

      {modalCard && (
        <div
          className="card-modal-backdrop"
          role="presentation"
          onClick={() => setModalCardId(null)}
        >
          <section
            className="card-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="card-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              aria-label="닫기"
              onClick={() => setModalCardId(null)}
            >
              <X />
            </button>
            <CardTile card={modalCard} />
            <div className="modal-copy">
              <p className="eyebrow">{modalCard.serial}</p>
              <h2 id="card-modal-title">{modalCard.name}</h2>
              <dl>
                <div>
                  <dt>세력</dt>
                  <dd>
                    {modalCard.faction} · {modalCard.className}
                  </dd>
                </div>
                <div>
                  <dt>타입</dt>
                  <dd>{modalCard.type}</dd>
                </div>
                <div>
                  <dt>종족</dt>
                  <dd>{modalCard.race || "기록 없음"}</dd>
                </div>
                <div>
                  <dt>팩</dt>
                  <dd>{modalCard.packName}</dd>
                </div>
                <div>
                  <dt>비용 / 힘</dt>
                  <dd>
                    {modalCard.cost} / {modalCard.power}
                  </dd>
                </div>
              </dl>
              <div className="modal-rule">
                <strong>효과</strong>
                <p>
                  <EmphasizedTerms text={modalCard.effect || "효과 없음"} />
                </p>
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
