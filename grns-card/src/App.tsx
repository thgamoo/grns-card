import { useEffect, useMemo, useState } from "react";
import type {
  CSSProperties,
  KeyboardEvent,
  PointerEvent,
  ReactNode,
} from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BookOpenText,
  ChevronDown,
  Gamepad2,
  Library,
  Map as MapIcon,
  Printer,
  Search,
  Shield,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import "./App.css";
import {
  combatConceptId,
  combatConceptNotes,
  keywordRules,
  ruleTermId,
  ruleTermNotes,
} from "./content/rules";
import { fieldTermNotes } from "./content/field";
import { worldLinks } from "./content/world";
import { FieldTermToken } from "./components/FieldTermToken";
import { MissingCallout } from "./components/MissingCallout";
import { FieldPage } from "./pages/FieldPage";
import { IntroPage } from "./pages/IntroPage";
import { DeckListPage } from "./pages/DeckListPage";
import { RulesPage } from "./pages/RulesPage";
import { TutorialPage } from "./pages/TutorialPage";
import { WorldPage } from "./pages/WorldPage";

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
    structureDecks?: DeckSource[];
  };
};

type DeckSource = {
  classId: string;
  file: string;
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
  illustration?: string;
  classMark: string;
  classStripe: string;
  packId: string;
  packName: string;
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
  mainDeckCards?: number;
  trapCards?: number;
  hero?: {
    cardId: string;
    serial: string;
    name: string;
  };
  entries: DeckEntry[];
};

type DbState = {
  version: VersionEntry;
  classes: ClassInfo[];
  expansions: Expansion[];
  cards: Card[];
  decks: StructureDeck[];
};

type TabId =
  | "intro"
  | "db"
  | "rules"
  | "tutorial"
  | "deckList"
  | "graph"
  | "field"
  | "world";

const emptyCards: Card[] = [];
const emptyClasses: ClassInfo[] = [];
const emptyDecks: StructureDeck[] = [];

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
  { id: "tutorial", label: "튜토리얼", icon: Gamepad2 },
  { id: "deckList", label: "시작 덱", icon: Printer },
  { id: "graph", label: "그래프", icon: Activity },
  { id: "field", label: "필드", icon: MapIcon },
  { id: "world", label: "서고", icon: BookOpenText },
];

const tabPaths: Record<TabId, string> = {
  intro: "/",
  db: "/cards",
  rules: "/rules",
  tutorial: "/tutorial",
  deckList: "/decks",
  graph: "/graph",
  field: "/field",
  world: "/world",
};

function tabFromPath(pathname: string): TabId {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const found = Object.entries(tabPaths).find(
    ([, path]) => path === normalized,
  );
  return found ? (found[0] as TabId) : "intro";
}

const pinnedKeywordFilters = ["왕살"];
const st01FrontFrame =
  "./docs/card-assets/st01/common/card-frame-20260530_f2.png";
const st01CardBack = "./docs/card-assets/st01/common/backside.png";
const st01FirstGateEmblem =
  "./docs/card-assets/st01/common/emblem-first-sungmoon.png";
const gayaEmblem = "./docs/faction-diamonds/garak-emblem.png";

function publicAssetPath(file: string) {
  if (/^(https?:)?\/\//.test(file)) return file;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = file.replace(/^\.?\//, "");
  return `${base}/${path}`;
}

async function fetchJson<T>(file: string): Promise<T> {
  const response = await fetch(publicAssetPath(file), {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${file} 로드 실패`);
  return response.json() as Promise<T>;
}

function packName(packId: string, expansions: Expansion[]) {
  if (packId === "base") return "기본";
  return expansions.find((item) => item.id === packId)?.name ?? packId;
}

function serialNumber(serial: string) {
  return Number(serial.match(/(\d+)$/)?.[1] ?? 0);
}

const packDisplayOrder = ["st01", "base", "ex01"];

function packOrderIndex(packId: string) {
  const index = packDisplayOrder.indexOf(packId);
  return index === -1 ? packDisplayOrder.length : index;
}

function layeredFrameEmblem(card: Card) {
  if (card.classId === "gaya" || card.faction === "가락") return gayaEmblem;
  return st01FirstGateEmblem;
}

function compareCardsBySerial(a: Card, b: Card) {
  if (a.packId !== b.packId) {
    const packDiff = packOrderIndex(a.packId) - packOrderIndex(b.packId);
    if (packDiff !== 0) return packDiff;
    return a.packId.localeCompare(b.packId);
  }
  return serialNumber(a.serial) - serialNumber(b.serial);
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
  const decks = await Promise.all(
    (db.sources.structureDecks ?? []).map((source) =>
      fetchJson<StructureDeck>(source.file),
    ),
  );
  return {
    version,
    classes,
    expansions,
    cards: groups.flat().sort(compareCardsBySerial),
    decks,
  };
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
    new Set((effect.match(/<[^>]+>/g) ?? []).map((item) => item.slice(1, -1))),
  );
}

function cardTags(card: Card) {
  return Array.from(
    new Set(
      [
        card.faction,
        card.race,
        ...card.race.split(/[/,·\s]+/),
        ...keywords(card.effect),
        ...angleTerms(card.effect),
      ]
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function primaryRace(card: Card) {
  return card.race.split(/[/,·\s]+/).find(Boolean) ?? "";
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
  return keyword.replace(/^(강화|공개|희생)\s+(N|X|\d+)$/i, "$1");
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

function keywordBadge(keyword: string) {
  return keywordRules.find(
    ([rule]) => rule.replace(/^\[|\]$/g, "") === keyword,
  )?.[2];
}

function CardTile({ card, onClick }: { card: Card; onClick?: () => void }) {
  const compactName =
    card.name.length >= 11
      ? " name-extra-long"
      : card.name.length >= 9
        ? " name-long"
        : card.name.length > 6
          ? " name-small"
          : "";
  const hasEffect = Boolean(card.effect.trim());
  const effectText = card.effect.trim() || card.lore.trim();
  const effectClassName = hasEffect
    ? "card-effect"
    : "card-effect card-effect-lore";
  const illustration = card.illustration?.trim();
  const illustrationSrc = illustration ? publicAssetPath(illustration) : "";
  const usesLayeredFrame =
    Boolean(illustration) &&
    (card.packId === "st01" ||
      card.packId === "base" ||
      illustration?.includes("card-assets/st01") ||
      illustration?.includes("card-assets/base"));
  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cardRect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - cardRect.left) / cardRect.width;
    const y = (event.clientY - cardRect.top) / cardRect.height;
    const rotateY = (x - 0.5) * 10;
    const rotateX = (0.5 - y) * 8;

    event.currentTarget.style.setProperty("--tilt-x", `${rotateX}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${rotateY}deg`);
    event.currentTarget.style.setProperty("--glare-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--glare-y", `${y * 100}%`);
  };
  const resetTilt = (target: HTMLElement) => {
    target.style.setProperty("--tilt-x", "0deg");
    target.style.setProperty("--tilt-y", "0deg");
    target.style.setProperty("--glare-x", "50%");
    target.style.setProperty("--glare-y", "35%");
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onClick) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onClick();
  };
  const tileStyle = {
    "--class-stripe":
      card.classStripe || classColors[card.classId] || "#ffffff",
    "--tilt-x": "0deg",
    "--tilt-y": "0deg",
    "--glare-x": "50%",
    "--glare-y": "35%",
  } as CSSProperties;

  if (usesLayeredFrame) {
    return (
      <article
        className="card-tile card-frame-stack"
        style={tileStyle}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={(event) => resetTilt(event.currentTarget)}
        onBlur={(event) => resetTilt(event.currentTarget)}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <img
          className="frame-stack-illustration"
          src={illustrationSrc}
          alt=""
          aria-hidden="true"
        />
        <img
          className="frame-stack-image"
          src={publicAssetPath(st01FrontFrame)}
          alt=""
          aria-hidden="true"
        />
        <img
          className="frame-stack-emblem"
          src={publicAssetPath(layeredFrameEmblem(card))}
          alt=""
          aria-hidden="true"
        />
        <span className="frame-stack-cost">{card.cost}</span>
        <span className="frame-stack-power">{card.power}</span>
        <strong className={`frame-stack-name${compactName}`}>
          {card.name}
        </strong>
        {hasEffect ? (
          <span className="frame-stack-effect">
            <EmphasizedTerms text={effectText} plainTerms disableTermTooltips />
          </span>
        ) : (
          <div className="frame-stack-lore-slot">
            <span className="frame-stack-effect frame-stack-lore">
              <EmphasizedTerms text={effectText} plainTerms disableTermTooltips />
            </span>
          </div>
        )}
        <div className="frame-stack-meta-slot">
          <span className="frame-stack-meta">{card.race}</span>
        </div>
        <div className="frame-stack-serial-slot">
          <span className="frame-stack-serial">{card.serial}</span>
        </div>
      </article>
    );
  }

  return (
    <article
      className="card-tile"
      style={tileStyle}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={(event) => resetTilt(event.currentTarget)}
      onBlur={(event) => resetTilt(event.currentTarget)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className="card-stripe" aria-hidden="true" />
      <span className="card-top">
        <span className="card-cost">{card.cost}</span>
        <strong className={`card-name${compactName}`}>{card.name}</strong>
        <span className="card-power">{card.power}</span>
      </span>
      <span className="card-art" aria-hidden="true">
        {illustrationSrc && !usesLayeredFrame ? (
          <img src={illustrationSrc} alt="" />
        ) : (
          <span>{card.sigil || "怪"}</span>
        )}
      </span>
      <span className="card-bottom">
        <span className="card-meta">
          <span>{card.faction}</span>
          {card.race && <span>{card.race}</span>}
        </span>
        <span className={effectClassName}>
          <EmphasizedTerms text={effectText} plainTerms disableTermTooltips />
        </span>
        <span className="card-serial">{card.serial}</span>
        <span className="card-mark">
          {card.classMark || fallbackClassMarks[card.classId] || "◇"}
        </span>
      </span>
    </article>
  );
}

function CardBackTile() {
  return (
    <div className="card-back-tile" aria-label="카드 뒷면">
      <img src={publicAssetPath(st01CardBack)} alt="" aria-hidden="true" />
    </div>
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

function EmphasizedTerms({
  text,
  onFieldTermClick,
  onRuleTermClick,
  plainTerms = false,
  disableTermTooltips = false,
}: {
  text: string;
  onFieldTermClick?: () => void;
  onRuleTermClick?: (term: string) => void;
  plainTerms?: boolean;
  disableTermTooltips?: boolean;
}) {
  return (
    <>
      {text
        .replace(/\\n/g, "\n")
        .split(/(\*\*[^*\n]+\*\*|_[^_\n]+_|\r?\n|<[^>]+>|\[[^\]]+\])/g)
        .map((part, index) => {
          if (/^\r?\n$/.test(part)) {
            return <br key={`line-${index}`} />;
          }

          if (/^\*\*[^*]+\*\*$/.test(part)) {
            return (
              <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
            );
          }

          if (/^_[^_]+_$/.test(part)) {
            return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
          }

          if (/^<[^>]+>$/.test(part)) {
            if (disableTermTooltips) {
              return part;
            }

            const term = part.slice(1, -1);
            const note = plainTerms
              ? undefined
              : (fieldTermNotes[term] ??
                ruleTermNotes[term] ??
                combatConceptNotes[term]);
            if (note) {
              return (
                <FieldTermToken
                  key={`${part}-${index}`}
                  note={note}
                  emphasize={!plainTerms}
                  onNavigateField={
                    fieldTermNotes[term]
                      ? onFieldTermClick
                      : ruleTermNotes[term] || combatConceptNotes[term]
                        ? () => onRuleTermClick?.(term)
                        : undefined
                  }
                >
                  {part}
                </FieldTermToken>
              );
            }

            return plainTerms ? (
              part
            ) : (
              <strong key={`${part}-${index}`}>{part}</strong>
            );
          }

          return /^\[[^\]]+\]$/.test(part) ? (
            <strong key={`${part}-${index}`}>{part}</strong>
          ) : (
            part
          );
        })}
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
            <EmphasizedTerms text={block} />
          </p>
        );
      })}
    </div>
  );
}

function paginateMarkdown(source: string, title?: string, subtitle?: string) {
  const blocks = source.split(/\n{2,}/).filter(Boolean);
  if (!blocks.length) return [source];

  const pages: string[] = [];
  let current: string[] = [];
  let weight = 0;
  const bodyBlocks = [...blocks];
  const pageBudget = 390;

  if (bodyBlocks[0]?.startsWith("# ")) {
    bodyBlocks.shift();
  }

  if (title) {
    pages.push(subtitle ? `# ${title}\n\n${subtitle}` : `# ${title}`);
  }

  const readableBlocks = bodyBlocks.flatMap((block) => {
    if (block.startsWith("#") || block.startsWith("- ") || block.includes("\n- ")) {
      return [block];
    }
    const sentences = block.split(/(?<=[.!?。])\s+/).filter(Boolean);
    return sentences.length > 1 ? sentences : [block];
  });

  readableBlocks.forEach((block) => {
    const blockWeight = block.startsWith("#") ? 120 : block.length + 28;
    if (current.length && weight + blockWeight > pageBudget) {
      pages.push(current.join("\n\n"));
      current = [];
      weight = 0;
    }
    current.push(block);
    weight += blockWeight;
  });

  if (current.length) pages.push(current.join("\n\n"));
  return pages.length % 2 === 0 ? pages : [...pages, ""];
}

function App() {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [dbState, setDbState] = useState<DbState | null>(null);
  const [versionId, setVersionId] = useState("");
  const [query, setQuery] = useState("");
  const [classIds, setClassIds] = useState<string[]>([]);
  const [packIds, setPackIds] = useState<string[]>([]);
  const [keywordFilters, setKeywordFilters] = useState<string[]>([]);
  const [otherFilters, setOtherFilters] = useState<string[]>([]);
  const [graphClassId, setGraphClassId] = useState("all");
  const [graphTag, setGraphTag] = useState("전체");
  const [openDistributionPackId, setOpenDistributionPackId] = useState("base");
  const [modalCardId, setModalCardId] = useState<string | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [rulebookMarkdown, setRulebookMarkdown] = useState("");
  const [showRulebook, setShowRulebook] = useState(false);
  const [worldDocIndex, setWorldDocIndex] = useState(0);
  const [worldMarkdown, setWorldMarkdown] = useState("");
  const [isWorldStoryOpen, setIsWorldStoryOpen] = useState(false);
  const [worldBookSpread, setWorldBookSpread] = useState(0);
  const [worldNotice, setWorldNotice] = useState("");
  const [sealedBooksUnlocked, setSealedBooksUnlocked] = useState(false);
  const [graphUnlocked, setGraphUnlocked] = useState(false);
  const [error, setError] = useState("");
  const activeTab = tabFromPath(pathname);
  const visibleWorldLinks = worldLinks;
  const visibleTabs = graphUnlocked
    ? tabs
    : tabs.filter((tab) => tab.id !== "graph");

  useEffect(() => {
    fetchJson<Manifest>("./data/card-versions.json")
      .then((nextManifest) => {
        setManifest(nextManifest);
        setVersionId(nextManifest.latest);
      })
      .catch((caught: Error) => setError(caught.message));
  }, []);

  const navigateTab = (tabId: TabId) => {
    navigate({ to: tabPaths[tabId] });
  };

  useEffect(() => {
    if (activeTab === "graph" && !graphUnlocked) {
      navigateTab("intro");
    }
  }, [activeTab, graphUnlocked]);

  useEffect(() => {
    fetch(publicAssetPath("./docs/rulebook.md"), { cache: "no-store" })
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
    const selectedDoc =
      visibleWorldLinks[worldDocIndex] ?? visibleWorldLinks[0];
    if (!selectedDoc) return;
    if (selectedDoc.kind === "image") return;
    if (selectedDoc.private && !sealedBooksUnlocked) return;
    fetch(publicAssetPath(selectedDoc.href), { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("세계관 문서 로드 실패");
        return response.text();
      })
      .then((source) => {
        const trimmed = source.trim();
        if (!trimmed) {
          setWorldMarkdown(
            `# ${selectedDoc.title}\n\n아직 작성된 내용이 없습니다.`,
          );
          return;
        }

        if (selectedDoc.href.endsWith(".json")) {
          setWorldMarkdown(
            `# ${selectedDoc.title}\n\n\`\`\`json\n${trimmed}\n\`\`\``,
          );
          return;
        }

        setWorldMarkdown(trimmed);
      })
      .catch(() =>
        setWorldMarkdown(
          `# ${selectedDoc.title}\n\n세계관 문서를 불러오지 못했습니다.`,
        ),
      );
  }, [sealedBooksUnlocked, visibleWorldLinks, worldDocIndex]);

  useEffect(() => {
    const command = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      " ",
    ];
    let progress = 0;

    const handleKeyDown = (event: WindowEventMap["keydown"]) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      const expected = command[progress];
      const key = event.key === "Spacebar" ? " " : event.key;
      if (key === expected) {
        progress += 1;
        if (progress === command.length) {
          setSealedBooksUnlocked(true);
          setWorldNotice("봉인이 풀렸다.");
          progress = 0;
        }
        return;
      }
      progress = key === command[0] ? 1 : 0;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const command = ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", " "];
    let progress = 0;

    const handleKeyDown = (event: WindowEventMap["keydown"]) => {
      if (activeTab !== "intro") return;

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      const expected = command[progress];
      const key = event.key === "Spacebar" ? " " : event.key;
      if (key === expected) {
        progress += 1;
        if (progress === command.length) {
          setGraphUnlocked(true);
          navigateTab("graph");
          progress = 0;
        }
        return;
      }
      progress = key === command[0] ? 1 : 0;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  useEffect(() => {
    if (!worldNotice) return;
    const timeout = window.setTimeout(() => setWorldNotice(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [worldNotice]);

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
  const decks = dbState?.decks ?? emptyDecks;
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
        keywordFilters.every(
          (keyword) =>
            haystack.includes(keyword.toLowerCase()) ||
            matchesKeywordFilter(cardKeywords, keyword),
        ) &&
        otherFilters.every((term) => cardAngleTerms.includes(term))
      );
    });
  }, [cards, classIds, keywordFilters, otherFilters, packIds, query]);
  const printCardPages = useMemo(() => {
    const pages: Card[][] = [];
    for (let index = 0; index < filteredCards.length; index += 9) {
      pages.push(filteredCards.slice(index, index + 9));
    }
    return pages;
  }, [filteredCards]);

  const keywordCounts = useMemo(() => {
    const counts = new Map<string, number>();
    cards
      .flatMap((card) => keywords(card.effect))
      .map(normalizeKeyword)
      .forEach((keyword) =>
        counts.set(keyword, (counts.get(keyword) ?? 0) + 1),
      );
    pinnedKeywordFilters.forEach((keyword) => {
      if (!counts.has(keyword)) counts.set(keyword, 0);
    });
    return Array.from(counts, ([keyword, count]) => ({ keyword, count })).sort(
      (a, b) => b.count - a.count,
    );
  }, [cards]);

  const keywordFilterItems = useMemo(() => {
    const items = keywordCounts.slice(0, 18);
    const seen = new Set(items.map((item) => item.keyword));
    pinnedKeywordFilters.forEach((keyword) => {
      if (seen.has(keyword)) return;
      items.push(
        keywordCounts.find((item) => item.keyword === keyword) ?? {
          keyword,
          count: 0,
        },
      );
    });
    return items;
  }, [keywordCounts]);

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
        (graphTag === "전체" || cardTags(card).includes(graphTag))
      );
    });
  }, [cards, graphClassId, graphTag]);

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
        radius: 6.5,
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
    return { averageCost, averagePower };
  }, [graphCards]);

  const cardDistribution = useMemo(() => {
    const classLabels = new Map(
      classes.map((classInfo) => {
        const className = classInfo.className ?? classInfo.name ?? classInfo.id;
        const label =
          classInfo.faction === className
            ? classInfo.faction
            : `${classInfo.faction} · ${className}`;
        return [classInfo.id, label];
      }),
    );
    const packClassCounts = cards.reduce((counts, card) => {
      const packCounts = counts.get(card.packId) ?? new Map<string, number>();
      packCounts.set(card.classId, (packCounts.get(card.classId) ?? 0) + 1);
      counts.set(card.packId, packCounts);
      return counts;
    }, new Map<string, Map<string, number>>());

    return {
      total: cards.length,
      byPack: packs.map((pack) => ({
        ...pack,
        total: Array.from(packClassCounts.get(pack.id)?.values() ?? []).reduce(
          (sum, count) => sum + count,
          0,
        ),
        classes: classes
          .map((classInfo) => ({
            id: classInfo.id,
            name: classLabels.get(classInfo.id) ?? classInfo.id,
            count: packClassCounts.get(pack.id)?.get(classInfo.id) ?? 0,
          }))
          .filter((classInfo) => classInfo.count > 0),
      })),
    };
  }, [cards, classes, packs]);
  const visibleDistributionPackId =
    cardDistribution.byPack.find((pack) => pack.id === openDistributionPackId)
      ?.id ??
    cardDistribution.byPack[0]?.id ??
    "";

  const modalCard = cards.find((card) => card.id === modalCardId);
  const sampleCard =
    cards.find((card) => card.serial === "GRNS-0009") ?? cards[0];
  const activeWorldDocIndex =
    worldDocIndex < visibleWorldLinks.length ? worldDocIndex : 0;
  const activeWorldDoc = visibleWorldLinks[activeWorldDocIndex];
  const worldStoryPages = useMemo(
    () =>
      paginateMarkdown(
        worldMarkdown,
        activeWorldDoc?.title,
        activeWorldDoc?.body,
      ),
    [activeWorldDoc?.body, activeWorldDoc?.title, worldMarkdown],
  );
  const leftWorldPage = worldStoryPages[worldBookSpread * 2] ?? "";
  const rightWorldPage = worldStoryPages[worldBookSpread * 2 + 1] ?? "";
  const worldStoryPageCount = Math.max(
    1,
    worldStoryPages.filter((page) => page.trim()).length,
  );
  const leftWorldPageNumber = worldBookSpread * 2 + 1;
  const rightWorldPageNumber = worldBookSpread * 2 + 2;
  const canTurnWorldBookBackward = worldBookSpread > 0;
  const canTurnWorldBookForward =
    worldBookSpread * 2 + 2 < worldStoryPages.length;
  const openWorldStory = (index: number) => {
    const selectedDoc = visibleWorldLinks[index];
    if (selectedDoc?.private && !sealedBooksUnlocked) {
      setWorldNotice("이 책은 열리지 않는다.");
      return;
    }
    setWorldDocIndex(index);
    setWorldBookSpread(0);
    setIsWorldStoryOpen(true);
  };
  const openWorldMap = (index: number) => {
    setWorldDocIndex(index);
    setMapZoom(1);
    setIsMapModalOpen(true);
  };
  const zoomWorldMapIn = () => {
    setMapZoom((zoom) => Math.min(2.5, zoom + 0.25));
  };
  const zoomWorldMapOut = () => {
    setMapZoom((zoom) => Math.max(1, zoom - 0.25));
  };
  const navigateRuleTerm = (term: string) => {
    const target =
      (term === "전투" ? document.getElementById("combat-resolution") : null) ??
      document.getElementById(ruleTermId(term)) ??
      (combatConceptNotes[term]
        ? document.getElementById("combat-control")
        : null) ??
      document.getElementById(combatConceptId(term));

    if (!target) return;

    document.documentElement.scrollTo({
      top:
        document.documentElement.scrollTop +
        target.getBoundingClientRect().top -
        96,
      behavior: "smooth",
    });
  };

  return (
    <main className="site-shell">
      <header className="site-header">
        <button
          className="brand"
          type="button"
          onClick={() => navigateTab("intro")}
        >
          괴력난신DB
        </button>
        <nav className="tab-nav" aria-label="페이지 탭">
          {visibleTabs.map(({ id, label, icon: Icon }) => (
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
          <IntroPage
            onNavigateCards={() => navigateTab("db")}
            onNavigateRules={() => navigateTab("rules")}
          />
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
                <span>키워드</span>
                <div className="chip-list keyword-chips">
                  {keywordFilterItems.map((item) => (
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
                      {keywordBadge(item.keyword) === "new" && (
                        <span className="keyword-new-badge">new</span>
                      )}
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
                {printCardPages.map((page, pageIndex) => (
                  <div className="db-print-page" key={`print-page-${pageIndex}`}>
                    {page.map((card) => (
                      <div className="db-print-card" key={card.id}>
                        <CardTile
                          card={card}
                          onClick={() => setModalCardId(card.id)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "rules" && (
          <RulesPage
            renderInlineText={(text) => (
              <EmphasizedTerms
                text={text}
                onFieldTermClick={() => navigateTab("field")}
                onRuleTermClick={navigateRuleTerm}
              />
            )}
            rulebook={<MarkdownView source={rulebookMarkdown} />}
            sampleCard={sampleCard ? <CardTile card={sampleCard} /> : null}
            showRulebook={showRulebook}
            onNavigateField={() => navigateTab("field")}
            onNavigateTutorial={() => navigateTab("tutorial")}
            onSelectKeyword={(keyword) => {
              setQuery("");
              setKeywordFilters([keyword.replace(/^\[|\]$/g, "")]);
              navigateTab("db");
            }}
            onSelectRuleTerm={navigateRuleTerm}
            onToggleRulebook={() => setShowRulebook((current) => !current)}
          />
        )}

        {activeTab === "tutorial" && <TutorialPage />}

        {activeTab === "deckList" && (
          <DeckListPage
            cards={cards}
            decks={decks}
            renderCard={(card) => <CardTile card={card as Card} />}
            renderBack={() => <CardBackTile />}
          />
        )}

        {activeTab === "graph" && graphUnlocked && (
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
                    aria-label="카드 허기와 힘을 기준으로 한 노드 그래프"
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
                          세력과 태그 조건을 조정하세요.
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
                  <div className="graph-distribution">
                    <div className="graph-distribution-head">
                      <h3>카드 분포</h3>
                      <strong>{cardDistribution.total}장</strong>
                    </div>
                    {cardDistribution.byPack.map((pack) => (
                      <section key={pack.id} className="graph-pack-summary">
                        <button
                          type="button"
                          aria-expanded={visibleDistributionPackId === pack.id}
                          onClick={() => setOpenDistributionPackId(pack.id)}
                        >
                          <span>{pack.name}</span>
                          <strong>{pack.total}장</strong>
                          <ChevronDown
                            className={
                              visibleDistributionPackId === pack.id
                                ? "open"
                                : ""
                            }
                            size={16}
                            aria-hidden="true"
                          />
                        </button>
                        {visibleDistributionPackId === pack.id && (
                          <div className="graph-count-list">
                            {pack.classes.map((classInfo) => (
                              <span key={classInfo.id}>
                                <em>{classInfo.name}</em>
                                <strong>{classInfo.count}</strong>
                              </span>
                            ))}
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                  <div className="graph-legend">
                    <h3>범례</h3>
                    <p>
                      가로축은 허기, 세로축은 힘입니다. 각 점은 카드 1장을
                      나타냅니다.
                    </p>
                  </div>
                </aside>
              </div>
            </section>
          </div>
        )}

        {activeTab === "field" && <FieldPage />}

        {activeTab === "world" && (
          <WorldPage
            activeDocIndex={activeWorldDocIndex}
            links={visibleWorldLinks}
            onOpenStory={openWorldStory}
            onOpenMap={openWorldMap}
            sealedBooksUnlocked={sealedBooksUnlocked}
            onOpenLockedBook={() => setWorldNotice("이 책은 열리지 않는다.")}
          />
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
                  <dt>종족</dt>
                  <dd>{modalCard.race || ""}</dd>
                </div>
                <div>
                  <dt>팩</dt>
                  <dd>{modalCard.packName}</dd>
                </div>
                <div>
                  <dt>허기 / 힘</dt>
                  <dd>
                    {modalCard.cost} / {modalCard.power}
                  </dd>
                </div>
              </dl>
              {modalCard.effect.trim() && (
                <div className="modal-rule">
                  <strong>효과</strong>
                  <p>
                    <EmphasizedTerms
                      text={modalCard.effect}
                      plainTerms
                      disableTermTooltips
                    />
                  </p>
                </div>
              )}
              {modalCard.lore && (
                <div className="modal-lore">
                  <strong>기록</strong>
                  <p>
                    <EmphasizedTerms
                      text={modalCard.lore}
                      plainTerms
                      disableTermTooltips
                    />
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {isMapModalOpen && activeWorldDoc?.kind === "image" && (
        <div
          className="map-modal-backdrop"
          role="presentation"
          onClick={() => setIsMapModalOpen(false)}
        >
          <section
            className="map-modal"
            role="dialog"
            aria-modal="true"
            aria-label="괴력난신 세계 지도"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              aria-label="닫기"
              onClick={() => setIsMapModalOpen(false)}
            >
              <X />
            </button>
            <div className="map-modal-tools" aria-label="지도 확대 도구">
              <button
                type="button"
                aria-label="지도 축소"
                onClick={zoomWorldMapOut}
              >
                <ZoomOut />
              </button>
              <span>{Math.round(mapZoom * 100)}%</span>
              <button
                type="button"
                aria-label="지도 확대"
                onClick={zoomWorldMapIn}
              >
                <ZoomIn />
              </button>
            </div>
            <div
              className="map-modal-scroll"
              onClick={zoomWorldMapIn}
              onContextMenu={(event) => {
                event.preventDefault();
                zoomWorldMapOut();
              }}
            >
              <img
                src={publicAssetPath(activeWorldDoc.href)}
                alt="괴력난신 세계 지도"
                style={{ transform: `scale(${mapZoom})` }}
              />
            </div>
          </section>
        </div>
      )}

      {isWorldStoryOpen && activeWorldDoc?.story && (
        <div
          className="world-story-backdrop"
          role="presentation"
          onClick={() => setIsWorldStoryOpen(false)}
        >
          <section
            className="world-story-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeWorldDoc.title} 기록`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close world-story-close"
              type="button"
              aria-label="닫기"
              onClick={() => setIsWorldStoryOpen(false)}
            >
              <X />
            </button>
            <div className="world-story-book">
              <div className="world-story-gutter" aria-hidden="true" />
              <div className="world-story-pages" aria-label="펼친 책">
                <button
                  type="button"
                  className="world-story-page world-story-page-left"
                  aria-label="이전 쪽"
                  onClick={() => {
                    if (canTurnWorldBookBackward) {
                      setWorldBookSpread((current) => current - 1);
                    }
                  }}
                >
                  <MarkdownView source={leftWorldPage} />
                  {leftWorldPage.trim() && (
                    <span className="world-story-page-number">
                      {leftWorldPageNumber}/{worldStoryPageCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className="world-story-page world-story-page-right"
                  aria-label="다음 쪽"
                  onClick={() => {
                    if (canTurnWorldBookForward) {
                      setWorldBookSpread((current) => current + 1);
                    }
                  }}
                >
                  <MarkdownView source={rightWorldPage} />
                  {rightWorldPage.trim() && (
                    <span className="world-story-page-number">
                      {rightWorldPageNumber}/{worldStoryPageCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {worldNotice && (
        <div className="world-notice" role="status">
          {worldNotice}
        </div>
      )}

      {error && (
        <div className="error-message" role="status">
          <MissingCallout />
        </div>
      )}
    </main>
  );
}

export default App;
